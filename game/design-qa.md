# ECHO WAR design QA

The original full visual comparison below records the first, three-round release. The current balance uses five 12-second rounds; see the subsequent timing verification section. Earlier screenshots are retained as historical design evidence, not as the current rules.

## Comparison setup

- Source: `docs/visual-target.png`, the selected first concept renamed ECHO WAR.
- Implementation: `docs/gameplay.jpg`, local browser render at `/?reference`.
- Viewport: 1485 x 1059 CSS pixels. Source and screenshot: 1485 x 1059 pixels, device scale factor 1. No density resampling.
- State: round 3, 12 seconds remaining, P1 14 / P2 11, two solid players and four pale replay echoes. The development-only reference fixture freezes this state; normal play uses the complete engine.
- Full comparisons: `docs/comparison-before.jpg` (initial) and `docs/comparison-final.jpg` (after fixes), both images in each comparison input.
- Focused comparisons: `docs/header-comparison.jpg`, `docs/arena-comparison.jpg`, and `docs/controls-comparison.jpg`. These were inspected for type, alignment, image quality, echo readability, and control labels.

## Findings: first comparison

- [P2] Header groups drift to the right and the identity is undersized. The target timer is centered in the page; the implementation's grid centers it farther right. The logo and player tags are visually smaller. Fix the desktop header grid and display scales.
- [P2] The source's top and bottom center obstacle bars are missing. This changes arena anatomy. Add matching raster bars and collision rectangles.
- [P2] Footer controls are smaller and less prominent than the selected source. Increase the desktop key caps and labels while preserving the full arena in one screen.
- [P3] The newly generated border is a little more regular and heavier than the original sketch. This is a cohesive asset variation; the notebook material, blue hatching, and gameplay boundary remain legible.

## Required fidelity surfaces

- Fonts: self-hosted Kalam preserves the handwritten hierarchy; desktop score and control scale needs adjustment.
- Spacing/layout: arena occupies the correct major region; header alignment and center bars need the fixes above.
- Colors: ivory paper, blue ruling, cobalt/rose player colors, graphite and gold match the chosen direction. Echoes remain hollow and much lighter than live players.
- Image quality: real generated transparent raster assets are present for scenery, logo, characters, echoes, stars, and brush marks. No placeholder illustrations are used. Icons are Phosphor library components.
- Copy: ECHO WAR naming, English-only UI, scores, phase, timer and core tagline are correct. Menu, tutorial and results copy extend the selected gameplay concept.

## Comparison history and fixes

The second comparison corrected the header alignment/scales, footer scales, source arena anatomy, and reference echo positions. The center timer now sits at the horizontal page center. New raster center bars have matching engine colliders. Focused header/arena/control comparisons were inspected.

A subsequent 1280 x 800 viewport check found an additional [P2] footer wrap and vertical overflow (document height 857). The footer tagline now stays on one line and the arena height budget includes the complete header, footer, utility row, and page padding. After the fix, the document is exactly 1280 x 800 and the utility row ends at y=788.17. `docs/laptop.jpg` is the post-fix evidence. The tutorial fits between y=100.46 and y=705.22 at this viewport (`docs/tutorial-laptop.jpg`).

The final full and focused comparisons were opened together after these fixes. No actionable P0/P1/P2 issues remain. The major layout, handwritten hierarchy, notebook palette, real raster asset language, live/echo distinction, and English content retain the selected design. Dynamic movement paths and exact character poses naturally vary during normal play; the fixture aligns phase, scores, timer and echo count for comparison.

## Final fidelity surfaces

- **Typography:** Kalam 400/700 is self-hosted. The score, phase and control hierarchy is readable without wrapping. Minor differences from generated hand lettering are accepted as P3.
- **Spacing/layout:** centered timer, balanced scores, one full arena, all ten static obstacles, and persistent controls fit the desktop and laptop windows. The 390 x 844 narrow document also fits its viewport (`docs/narrow.jpg`).
- **Colors/tokens:** ivory/blue paper, graphite structure, blue/pink live players, pale hollow echoes, and golden objectives match the source direction. HUD semantics remain consistent across menu, pause, match, and results.
- **Image quality:** all 13 raster art assets are present, sharp at intended sizes, and have appropriate transparency. Character and collectible alpha bounds are measured before rendering. Phosphor controls use a consistent icon family.
- **Copy/content:** ECHO WAR is used throughout. The reference state reads 14 / 11, 00:12, ROUND 3 / 3. The English tutorial explains star values, any-echo collision, stun, dash safety, and cooldown. Menu and result states are complete.

## Validation

- 10 gameplay tests passed: match length/freeze, round/echo progression, normalized movement, collision, pickup values/respawn, pickup ownership, exact replay rather than pursuit, echo penalties/immunity, dash cooldown/safety, interpolation, and reset.
- 25 full-match collision stress runs passed across varied deterministic inputs.
- Production build passed. All 4 template Worker/packaging tests passed. Protected runtime/Worker behavior is retained.
- Browser checks: menu, tutorial, countdown, both movement key sets, both players collecting a star (both HUD scores reached 01), dash inputs, round 2 with two echoes, round 3 with four echoes, Escape/button pause and resume, timer held at 00:37 while paused, motion effects toggle, mute/unmute, full-screen entry/exit, complete match results, and rematch resetting to round 1 / 01:00 / zero scores and echoes.
- Browser console errors and warnings: none observed in the final local page.
- Evidence includes `docs/menu.jpg`, `docs/results.jpg`, gameplay/full/focused comparisons, laptop, narrow, and tutorial captures.

## Follow-up polish and limits

- [P3] Generated pencil borders and block hatching are somewhat more regular than the concept; footer player labels use plain colored lettering. These are cohesive stylistic variations, not functional blockers.
- Actual simultaneous-key hardware rollover and the audible sound mix need two-human testing on the competition laptop. Automated inputs establish browser handling, not physical keyboard limitations or perceived sound quality.
- Narrow layout is inspectable; this first version requires a keyboard and does not provide touch/gamepad controls. Cross-browser and multi-device manual regression was not performed.
- The app is running locally. No hosted deployment has been claimed.

## Completed checklist

### 12-second balance update

- Current rules: five 12-second rounds within the same 60-second match. Add two echoes at 12, 24, 36 and 48 seconds, retaining earlier generations, for eight echoes in round 5. No further echoes are added at 60 seconds.
- Timing and round-count values now drive both the engine and interface. The menu, HUD, tutorial, README and project guidelines agree on the new timing. The original visual-reference fixture uses a consistent elapsed time for its round under the new rules.
- All 10 gameplay tests passed, including checks immediately before/at the first 12-second boundary, every later boundary, retained earlier tracks, exactly eight echoes, no rewind at match end, and reset after reaching the final round. Recorded-path replay still matches captured movement with 12-second tracks.
- Production build passed. Worker behavior and art/layout were not changed; the baseline packaging tests were not repeated for this balance-only change.
- Browser: tutorial states every 12 seconds and up to 8 echoes, and fits a 1280 x 800 window. A complete match reached ROUND 4 / 5 with 6 echoes at 00:24, then finished at ROUND 5 / 5, 00:00 with 8 echoes retained in the rendered state. Console errors/warnings: none observed.
- Current timing screenshot: `docs/timing-12s.jpg`. The preview was returned to the menu for a fresh match. No new two-person hardware or cross-browser testing was performed for this change.

- [x] Resolved P2 layout and arena differences and re-captured post-fix evidence.
- [x] Compared full views and focused typography, controls, and image regions.
- [x] Checked desktop, laptop, narrow viewport and primary browser flows.
- [x] Ran gameplay tests, collision stress checks, production build, and packaging tests.

final result: passed
