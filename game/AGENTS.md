# Prototype Instructions

## Echo War decisions

- Use the selected notebook-paper / blue-and-pink highlighter visual direction. The game name is **ECHO WAR**.
- This is a browser game for two local players sharing one keyboard, not online multiplayer.
- Keep a single arena, 60-second matches, three 20-second rounds, and recorded movement echoes from prior rounds.
- Live players are solid blue/pink; replay echoes are pale hollow versions. All interface text is English.
- Prioritize clear movement, dash, collection, collision, rewind transitions, and quick rematches. Respect reduced motion and mute settings.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
