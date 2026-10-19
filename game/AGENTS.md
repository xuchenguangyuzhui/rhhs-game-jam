# Prototype Instructions

## Echo War decisions

- Use the selected notebook-paper / blue-and-pink highlighter visual direction. The game name is **ECHO WAR**.
- This is a browser game for two local players sharing one keyboard, not online multiplayer.
- Keep a single arena and 60-second matches with five 12-second rounds. Add two recorded movement echoes at 12, 24, 36, and 48 seconds, keeping earlier echoes for a maximum of eight. End the match at 60 seconds without adding another pair.
- Live players are solid blue/pink; replay echoes are pale hollow versions. All interface text is English.
- Distribution targets desktop browsers with a keyboard. Publish through the repository's GitHub Pages workflow and keep asset URLs portable under its project path. Touch and gamepad controls are outside the requested scope.
- Small stars award 1 point and the center gold star awards 3. Gold visuals and feedback depend on the pickup type, not on its score value.
- Keep tutorial step labels 01/02/03 and explicitly explain Shift (P1) and Enter (P2) dash controls. Dialogs must cover the footer, stay inside the viewport, and scroll internally when needed; hide the footer slogan while a dialog is open.
- Prioritize clear movement, dash, collection, collision, rewind transitions, and quick rematches. Respect reduced motion and mute settings.
- The score and timer must never overlap in windowed play. Scale the header to the actual game-shell width, including short desktop windows, and keep the timer centered with a separate score area on each side.
- Keep the footer slogan and both players' keyboard instructions separate in windowed play. Size the entire footer by game-shell width, and move the slogan onto its own centered row when space is limited.
- Menu content must fit inside the arena in short windows; scale it by game-shell width and contain any remaining vertical overflow so it cannot cover the header or footer.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
