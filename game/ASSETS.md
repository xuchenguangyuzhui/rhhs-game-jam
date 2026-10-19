# Notebook artwork

The selected visual target is [docs/visual-target.png](docs/visual-target.png), the first displayed Product Design concept renamed to **ECHO WAR**. All game artwork was generated with the built-in ImageGen tool and inspected before use. Source PNGs retain their native resolution and alpha. The renderer measures alpha bounds at load time, so character padding does not affect collision sizing.

Shared prompt direction: warm ivory notebook paper, faint blue graph ruling, graphite pencil outlines and diagonal hatching, cobalt blue and rose pink highlighter marker characters, pale hollow replay echoes, and golden hand-drawn stars. Match the selected target; no generic vector substitutes, text glyph artwork, or external game sprites.

| File in public/assets | Generation prompt / role |
| --- | --- |
| paper.png | Clean ivory paper with subtle fibers and faint blue square ruling; no objects or text. Repeats at 500 CSS pixels. |
| arena-frame.png | Only the rough graphite rectangular arena boundary and reinforced corners, with a truly transparent center/background. |
| obstacle.png | One graphite pencil square block, diagonal hatching, warm ivory fill, subtle blue offset hatch shadow; transparent. |
| corner-obstacle.png | An L-shaped version of the same block, open toward bottom right; flipped for the other arena corners. |
| bar-obstacle.png | Long horizontal graphite block with diagonal hatching and blue hatch shadow; used at the top/bottom center. |
| player-blue.png | Small expressive cobalt marker bean runner, dark eyes and tiny hands/feet; solid fill, no labels or background. |
| player-pink.png | Matching runner, same silhouette and scale, with vivid rose marker fill. |
| echo-blue.png | Hollow pale cobalt outline counterpart of the live runner, transparent interior and pale eyes. |
| echo-pink.png | Matching pale rose hollow replay counterpart. |
| logo.png | Exact lettering ECHO WAR in blue/pink brush-marker handwriting, underlines and small graphite accents; transparent. |
| star.png | A single gold five-point collectible with brown graphite double outline and scribbled yellow marker fill; transparent. |
| brush-blue.png | Broad imperfect horizontal cobalt marker strokes, lighter streaks, no text; transparent. |
| brush-pink.png | Matching rose marker strokes; transparent. |

Programmatic drawing is restricted to actual recorded movement trails, dynamic text, and game feedback. Scenery, characters, collectibles, and brand marks use the raster assets above. Interface icons come from the Phosphor library. Sound effects are synthesized locally with Web Audio; no downloaded music or samples are used.
