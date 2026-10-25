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
