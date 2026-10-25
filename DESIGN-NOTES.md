# Design notes — "The painting is being made as you scroll"

A 2D watercolor abstraction. Every section is one stage of making a painting and owns one pigment; that pigment bleeds into the next section's paper, so the page reads as one continuous sheet.

| Section | Stage | Pigment |
| --- | --- | --- |
| Nav | The palette — a paint well per section, plus a progress stroke that uncovers every pigment you've scrolled past | all |
| 01 Hero | First wash | Rose · Yellow · Cerulean |
| 02 About | Pigment — the raw material | Quinacridone Rose |
| 03 What I build | Three primaries, kept pure | Cerulean / Rose / Yellow |
| 04 Work | Four finished paintings, one two-pigment mix each | Ultramarine, Orange, Phthalo Green, Violet |
| 05 Approach | Glazing — the three primaries from 03 are layered one principle at a time | Violet |
| 06 How it works | Wet-on-wet — one stroke bleeding step to step | Phthalo Green → Cerulean |
| 07 Experience | Strata — a dried band of color per role | Orange |
| 08 Contact | Clean paper — your color goes here | Ultramarine |
| Footer | Rinse water — every pigment, mixed | all |

## Painted scenes (every section)

The last four scenes:

- **How it works** (`process.js`): a river that comes down the right of the heading and runs along the step row, with a rocket, `</>`, a blueprint scroll and a magnifier beside it. Its level stretch lines up with the drops through `.process-river { top: calc(42px - 38.5vw) }`. On phones, where the steps stack, the river is hidden.
- **Experience** (`experience.js`): a painted canyon beside the heading, with seven tool fossils in its layers. Strata strips run along both page edges (the right one is mirrored), hidden below 1240px.
- **Contact** (`contact.js`): a blue-hour sky, drifting clouds, and a sheet with a brush and a paper plane.
- **Footer** (`footer.js`): now a pale warm strip with ink text, with the rinse jar on the right. The companion aims at its rim, at 19% of the jar's height.

## Earlier scene notes

These sections are full watercolor scenes, not sketches. They're painted by code in `tools/scenes/`: `painter.js` is the engine plus a small scene registry, and each section has one composition file (`hero.js`, `about.js`). They export to `assets/scenes/` as WebP layers.

**To repaint a scene:**
1. Open `tools/scenes/index.html?scene=about` (or `hero`) in Chrome.
2. Press **Download all**.
3. Replace the files in `assets/scenes/`.

Seeds are pinned, so a re-export paints the same picture.

**About** is split into pieces that each sit where there's no text, because its copy runs nearly full width:

| Layer | What's on it |
| --- | --- |
| `far` | The wall, filling the whole section: a rose band along the top, golden glow at the upper right, a pale centre, and a rose-to-pale-blue fade at the bottom. |
| `light` | Window light shafts on a slow breathing loop. |
| `wall` | Pinned sketches and blueprints, in the top padding above the heading. |
| `desk` | The feathered desk vignette in the right column. |
| `steam` | The steam over the mug, rising on its own loop. |

**What I Build** (`build.js`) puts the studio table under the cards:

| Layer | What's on it |
| --- | --- |
| `far` | The wall: a cerulean band on top, rose and yellow at the edges, a pale centre, and a warm neutral at the bottom. |
| `table` | The table surface, full width. Its front edge fades out with a CSS mask. |
| `tubes` | The three tubes, painted at the card-grid width so each one stands under its card. |
| `dab-*` | The painted swatch icon on each card. |

- The puddles are painted with `multiply`, so where they overlap the colors really mix: violet, orange, and green in front.
- On desktop the soft wall layers of About and What I Build stretch to fill their tall sections (`object-fit: fill`). On phones they crop to the pale centre instead.

**Selected Work** (`work.js`) gives each project card's picture box its own painted vignette:

| Vignette | What's in it |
| --- | --- |
| `noigate` | Night sky, a rocket off a git branch. |
| `bid` | Scales weighing three bids, a trophy. |
| `ops` | A corkboard with notes and a checklist. |
| `audit` | A light table, documents, a magnifier and a stamp. |

- Each subject sits in the upper part of the box, so the UI card can cover the faded lower corner.
- Each vignette overhangs its box and fades out on every side, so the colors bleed toward the neighbouring cards.
- The wall layer (`far`) is warm neutral on top and violet at the bottom, with each project's colors at the page edge beside its card.

**Approach** (`approach.js`) keeps the glazing interaction:

| Layer | What's on it |
| --- | --- |
| `base` | The taped sheet: a violet-lit floor with a faint hard hat and monitor. |
| `pane-yellow`, `pane-rose`, `pane-cerulean` | One glass pane each, with its own colored shadow. |
| `far` | The violet wall, which fades into pale green at the bottom. |

- `script.js` toggles `.pane.on` once per principle, so each pane drops in as its principle reaches the middle of the screen.
- The panes use `mix-blend-mode: multiply`, so overlapping shadows turn orange and violet.
- A soft shimmer sweeps across the glass.

**Hero** layers:

| Layer | What's on it |
| --- | --- |
| `far` | The sunrise sky and the paper itself. It's opaque, painted at quarter resolution, and upscaled so it stays soft. |
| `mid` | The brush trail, color clouds and smoke. |
| `float` | Splatters that drift on their own loop. |
| `fore` | The laptop, the rocket tube and the paint blobs. |
| `fallback` | A tiny flattened copy of the sky, shown while the layers load. |

- Nothing in the scene has an outline. Shapes are stacked translucent washes, with pigment pooling on parts of the rim, lifted highlights, blooms and granulation.
- The left half, behind the headline, stays a pale wash of 10–20% intensity.
The other sections still use the ink-sketch illustrations below.

## Illustrations

Each section has one hand-drawn sketch: a laptop and rocket tube (hero), a desk (about), three paint tubes (what I build), one sketch per project (work), glass panes (approach), paint drops (process), a canyon cross-section (experience), a sheet, brush and paper plane (contact), and a rinse jar (footer).

- Everything is inline SVG with two layers. `.paint` holds the fills and uses filter `#wc`: displaced edges, a darker rim, and granulation. `.ink` holds the outlines and uses filter `#ink`, a slight hand wobble. The paint sits a few units off the ink, like a loose sketch. The `-sm` filter variants are for small marks.
- Fill classes (`.f-rose`, `.t-orange`, `.o-5` …) all point at the pigment tokens in `style.css`, so the palette lives in one place.
- The SVGs never animate internally. Entrances, hovers and glazing move whole elements, so each filter rasterizes once.

## Companion

The paint drop (`.companion`) lives in the right gutter, outside the text column.

- Its height mirrors scroll progress, and it takes the current section's pigment from `--sec-pig`.
- It leans with scroll speed and leaves a trail colored by the real section positions.
- It bobs and blinks while idle, squishes on hover, and on click it splashes and glides to the next section.
- Near the end of the page it steers into the jar's mouth, disappears, and sets off a ripple.
- On phones it peeks in from the screen edge.

## Watercolor washes

- `watercolor.js` still paints the experience bands and the highlighter marks behind key phrases, procedurally on canvas. It's deterministic per `data-seed`.

## Rules kept

- Bright pigments are decorative only. Text uses the deepened `--*-ink` tokens, which are ≥ 4.5:1 on paper.
- Motion: transform and opacity only; strong ease-out for entrances; ≤ 300 ms for anything the visitor triggers; press feedback at `scale(.97)`; hover effects only on fine pointers.
- `prefers-reduced-motion`: washes appear already dry, and nothing drifts or animates.
- No JS: washes fall back to soft CSS gradients, and all content stays visible.
- The contact form has no backend by design. It composes a prefilled email in the visitor's mail client.

No build step: run `npm start` and open http://localhost:3000.
