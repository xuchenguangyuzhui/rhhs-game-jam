# ECHO WAR

A two-player, one-keyboard arena game. Steal the stars, dodge your echoes, and try not to lose to your past self.

## Play

**[Play ECHO WAR in your browser](https://xuchenguangyuzhui.github.io/rhhs-game-jam/)**

Open the link on a Windows, macOS, Linux, or Chromebook computer with a current desktop browser and a keyboard. No installation, Node.js, or account is needed to play. Both players share the same computer and keyboard; this is local multiplayer. An internet connection is needed to load the game.

- **Player 1:** WASD to move, Shift to dash.
- **Player 2:** arrow keys to move, Enter to dash.
- **Pause:** Escape or the pause button. The match also pauses when the window loses focus.
- **Sound:** toggle the speaker button. Reduced-motion effects can be selected in the pause menu and follow your system preference on first launch.

A match has **five 12-second rounds**. At **12, 24, 36, and 48 seconds**, a new pair of recorded echoes joins the arena. Earlier echoes stay in play, so the final round has **8 echoes**. The match ends at 60 seconds without adding another pair. Echoes replay movement; they do not chase players or collect stars. Live players are solid blue/pink, while echoes have pale hollow outlines.

Small stars award **1 point**; the central gold star awards **3**. Hitting any echo, including your own, costs **1 point** (never below zero) and stuns you for half a second. A brief immunity window prevents repeated hits. Tap **Shift** (P1) or **Enter** (P2) to dash in your movement direction; dashes pass safely through echoes and recharge in **2.6 seconds**. Scores carry across rounds, and the higher score after 60 seconds wins. Both players return to their spawn points at each rewind.

## Development

The application is in `game/`. It uses the Product Design React/Vite prototype runtime, a fixed-step deterministic game engine, Canvas rendering, self-hosted fonts, and synthesized Web Audio effects. There is no server, account, paid service, or online multiplayer requirement.

```sh
cd game
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1 --port 4173
pnpm test
pnpm build
pnpm test:sites
pnpm test:deployment
```

The build emits static files in `game/dist/client` and retains the template's Sites-compatible Worker. Relative asset URLs allow the same build to work at a root domain or a project subdirectory.

## Publishing

GitHub Pages publishes `game/dist/client` through [the deployment workflow](.github/workflows/deploy-pages.yml). Every push to `main` runs gameplay tests, the production build, Sites packaging checks, and deployment-path checks before publishing. The workflow can also be started manually from GitHub Actions. Repository Pages settings use **GitHub Actions** as the publishing source.

The public game remains available when the development computer and local server are off. Future changes become live after their workflow succeeds. Browser and keyboard restrictions imposed by a school or workplace may still affect access or simultaneous key presses.

## Validation and limits

See [design QA](game/design-qa.md) for visual comparison, browser checks, and remaining limits. Automated gameplay tests cover scoring, dash immunity, collision, replay accuracy, match duration, round transitions, pickups, and reset behavior. Actual multi-key keyboard rollover and audio output should also be tried on the competition laptop with two people; browser automation cannot establish the hardware's simultaneous-key limits or judge the sound mix.

This version is designed for two local keyboard players. The layout adapts to smaller windows, but touch controls and gamepad support are outside this first version.

## AI assistance and credits

Code and original notebook artwork were produced with OpenAI Codex and ImageGen, with automated tests and browser review. The game idea was developed collaboratively; no third-party game artwork was copied. The title and blue/pink notebook direction were selected by the project owner.

- [Kalam](https://fontsource.org/fonts/kalam/about), Indian Type Foundry, SIL Open Font License 1.1. Font files are self-hosted through `@fontsource/kalam`.
- [Phosphor Icons](https://github.com/phosphor-icons/react), MIT license. Used for interface controls.
- [Asset inventory and generation direction](game/ASSETS.md).

No game content license is selected yet; this repository's public visibility does not itself grant an open-source license to all project content.
