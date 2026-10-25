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

## How the paint works

- `watercolor.js` paints each `.wash` element procedurally on its own canvas: layered polygon deformation, with a faint rim for edge darkening, a noise pass for granulation, and an off-centre lift for backruns. It's deterministic per `data-seed`.
- Washes blend with `mix-blend-mode: multiply`, so overlaps mix subtractively, as glazes do. The dark footer uses `screen` instead.
- Attributes: `data-pig` (pigment), `data-pig2` (wet-in-wet second pigment), `data-seed`, `data-layers`, `data-aspect` (>1.6 makes a stroke), `data-calm` (less ragged), `data-drift` (scroll parallax), `data-follow` (pointer lean, hero only), `data-delay` (bloom stagger).
- `script.js` paints lazily in a 10 ms-per-frame queue, so washes on screen jump the queue. It then "blooms" each one in: opacity plus a settle from scale 0.84.

## Rules kept

- Bright pigments are decorative only. Text uses the deepened `--*-ink` tokens, which are ≥ 4.5:1 on paper.
- Motion: transform and opacity only; strong ease-out for entrances; ≤ 300 ms for anything the visitor triggers; press feedback at `scale(.97)`; hover effects only on fine pointers.
- `prefers-reduced-motion`: washes appear already dry, and nothing drifts or animates.
- No JS: washes fall back to soft CSS gradients, and all content stays visible.
- The contact form has no backend by design. It composes a prefilled email in the visitor's mail client.

No build step: run `npm start` and open http://localhost:3000.
