import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const client = new URL("../dist/client/", import.meta.url);

async function checkAsset(reference, parent, prefix) {
  const resolved = new URL(reference, parent);
  assert.equal(resolved.origin, parent.origin, `External dependency: ${reference}`);
  assert.ok(resolved.pathname.startsWith(prefix), `Asset escapes the deployment path: ${reference}`);
  const relative = resolved.pathname.slice(prefix.length);
  const file = new URL(relative, client);
  assert.ok((await stat(file)).isFile(), `Missing built asset: ${reference}`);
  return { file, resolved };
}

for (const prefix of ["/", "/rhhs-game-jam/"]) {
  test(`production assets resolve when hosted at ${prefix}`, async () => {
    const page = new URL(`https://example.test${prefix}`);
    const html = await readFile(new URL("index.html", client), "utf8");
    const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)];
    assert.ok(references.length >= 3, "Expected the script, stylesheet and favicon");

    for (const [, reference] of references) {
      const { file, resolved } = await checkAsset(reference, page, prefix);
      if (!file.pathname.endsWith(".css")) continue;
      const css = await readFile(file, "utf8");
      const resources = [...css.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)];
      assert.ok(resources.length > 0, "Expected bundled artwork and fonts");
      for (const [, resource] of resources) {
        if (resource.startsWith("data:")) continue;
        await checkAsset(resource, resolved, prefix);
      }
    }
  });
}
