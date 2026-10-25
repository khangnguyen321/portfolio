/* ═══ ABOUT SCENE — "Pigment": a painter's desk at golden hour ═══
   The About text runs nearly full width, so the scene is split into pieces
   that each live in a text-free zone:
     far    the wall: rose band along the top, golden glow upper right, pale
            centre, rose fading to pale blue at the bottom (hands off to the
            blue What-I-Build section) — opaque, covers the whole section
     light  window light falling in shafts from the upper right
     wall   a strip of pinned sketches and blueprints, in the top padding
     desk   the desk vignette for the right column: laptop, mug, open
            notebook, palette, hard hat on a shelf; feathered edges
     steam  wisps over the mug, on their own loop
   Opera Rose leads, with Hansa Yellow light and blue-violet shadows. */
(function () {
  const P = window.Pig;
  const { rose, yellow, cerulean, violet, orange, gray, mix, shade } = P;
  const paperWhite = [255, 253, 247];
  const wood = mix(mix(orange, yellow, 0.5), gray, 0.45);
  const shadowC = mix(violet, cerulean, 0.35);
  const pencil = mix(gray, violet, 0.35);

  /* a thin quad along a segment — painted lines, never strokes */
  const quad = (x0, y0, x1, y1, w) => {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    const nx = (-dy / L) * (w / 2), ny = (dx / L) * (w / 2);
    return [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]];
  };
  const rect = (p, cx, cy, w, h, rot) => p.rotate([[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]], cx, cy, rot);
  const local = (cx, cy, rot, x, y) => {
    const a = (rot * Math.PI) / 180;
    return [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)];
  };
  const line = (p, a, b, w, color, alpha = 0.4) => p.wash(quad(a[0], a[1], b[0], b[1], w), color, { layers: 3, alpha, k: 0.02, spread: 0.002 });

  /* a pinned sheet with a soft colored shadow and something on it */
  function sheet(p, cx, cy, w, h, rot, kind) {
    p.wash(rect(p, cx + 7, cy + 9, w, h, rot), shadowC, { layers: 10, alpha: 0.03, k: 0.04, blur: 4 });
    p.wash(rect(p, cx, cy, w, h, rot), paperWhite, { layers: 6, alpha: 0.5, k: 0.02, spread: 0.004 });
    const L = (x, y) => local(cx, cy, rot, x, y);
    if (kind === "blueprint") {
      p.wash(rect(p, cx, cy, w * 0.9, h * 0.88, rot), cerulean, { layers: 12, alpha: 0.07, k: 0.03, rim: 0.25, rimColor: mix(cerulean, violet, 0.4) });
      for (let i = -3; i <= 3; i++) line(p, L(i * w * 0.12, -h * 0.4), L(i * w * 0.12, h * 0.4), 1, paperWhite, 0.25);
      for (let j = -3; j <= 3; j++) line(p, L(-w * 0.42, j * h * 0.12), L(w * 0.42, j * h * 0.12), 1, paperWhite, 0.25);
      const b = [[-0.28, 0.3], [-0.28, -0.05], [0, -0.3], [0.28, -0.05], [0.28, 0.3], [-0.28, 0.3]];
      for (let i = 0; i < b.length - 1; i++) line(p, L(b[i][0] * w, b[i][1] * h), L(b[i + 1][0] * w, b[i + 1][1] * h), 2.4, paperWhite, 0.55);
      line(p, L(-0.08 * w, 0.3 * h), L(-0.08 * w, 0.08 * h), 2, paperWhite, 0.5);
      line(p, L(0.08 * w, 0.3 * h), L(0.08 * w, 0.08 * h), 2, paperWhite, 0.5);
    } else if (kind === "sketch") {
      for (let i = 0; i < 3; i++) {
        const y = -h * 0.24 + i * h * 0.2;
        p.drybrush([L(-w * 0.36, y), L(-w * 0.1, y - 5), L(w * 0.12, y + 4), L(w * 0.3, y - 2)], { width: 3, color: pencil, alpha: 0.34, taper: 0.3 });
      }
      p.wash(p.ellipse(...L(w * 0.14, h * 0.18), w * 0.2, h * 0.14, 12, 0.2), rose, { layers: 10, alpha: 0.07, k: 0.3, blur: 1 });
    } else if (kind === "swatch") {
      [[rose, -0.27], [yellow, 0], [cerulean, 0.27]].forEach(([c, x]) =>
        p.wash(rect(p, ...L(x * w, h * 0.06), w * 0.22, h * 0.5, rot + p.rand(-4, 4)), c, { layers: 10, alpha: 0.1, k: 0.08, rim: 0.3 }),
      );
    } else if (kind === "plan") {
      const pts = [[-0.36, -0.3], [0.36, -0.3], [0.36, 0.3], [-0.36, 0.3], [-0.36, -0.3]].map(([x, y]) => L(x * w, y * h));
      p.drybrush(pts, { width: 3.4, color: pencil, alpha: 0.4, taper: 0.05, breakOn: 0.02 });
      p.drybrush([L(-0.05 * w, -0.3 * h), L(-0.05 * w, 0.05 * h), L(0.36 * w, 0.05 * h)], { width: 3, color: pencil, alpha: 0.36, taper: 0.05 });
      p.wash(rect(p, ...L(0.16 * w, -0.12 * h), w * 0.3, h * 0.3, rot), yellow, { layers: 8, alpha: 0.07, k: 0.05 });
    }
    const [px, py] = L(0, -h * 0.42);
    p.wash(p.ellipse(px + 2, py + 3, 6, 4, 10, 0.2), shadowC, { layers: 6, alpha: 0.08, k: 0.2, blur: 1.5 });
    p.wash(p.ellipse(px, py, 5.5, 5.5, 10, 0.15), kind === "blueprint" ? rose : yellow, { layers: 10, alpha: 0.16, k: 0.2, rim: 0.4 });
    p.lift(p.ellipse(px - 1.8, py - 1.8, 1.6, 1.2, 8, 0.1), 0.9, 0.5);
  }

  const layers = {
    far(p) {
      const soft = { k: 0.32, spread: 0.1 };
      /* soft rose band along the top, carrying the hero's rose down */
      p.wash([[-40, -40], [1640, -40], [1640, 150], [1200, 172], [700, 158], [300, 178], [-40, 165]], rose, { layers: 22, alpha: 0.0075, k: 0.1, spread: 0.05 });
      /* golden-hour glow where the window is, upper right */
      p.wash(p.ellipse(1400, 230, 520, 380, 18, 0.12), yellow, { ...soft, layers: 26, alpha: 0.009 });
      p.wash(p.ellipse(1480, 160, 260, 180, 14, 0.16), orange, { ...soft, layers: 16, alpha: 0.004 });
      p.wash(p.ellipse(1250, 560, 380, 360, 16, 0.14), mix(rose, yellow, 0.5), { ...soft, layers: 18, alpha: 0.004 });
      /* the wall's warmth at the left edge; a barely-there veil in the centre */
      p.wash(p.ellipse(80, 460, 300, 520, 14, 0.14), rose, { ...soft, layers: 18, alpha: 0.006 });
      p.wash(p.ellipse(800, 450, 700, 360, 16, 0.1), yellow, { ...soft, layers: 18, alpha: 0.002 });
      p.bloom(1500, 300, 80, yellow, 0.1);
      /* bottom: rose melting into pale cerulean — the hand-off to What I Build */
      p.wash([[-40, 690], [500, 680], [1100, 695], [1640, 680], [1640, 820], [-40, 830]], rose, { layers: 16, alpha: 0.004, k: 0.1, spread: 0.05 });
      p.wash([[-40, 790], [600, 780], [1200, 795], [1640, 782], [1640, 960], [-40, 960]], cerulean, { layers: 20, alpha: 0.008, k: 0.1, spread: 0.05 });
    },

    light(p) {
      /* window light: two shafts from the upper right, raking down-left */
      /* each shaft tapers to a point before the bottom fade */
      p.wash([[1380, -40], [1530, -40], [1010, 640], [820, 760], [900, 610]], yellow, { layers: 16, alpha: 0.007, k: 0.06, spread: 0.03 });
      p.wash([[1570, -40], [1650, -40], [1260, 560], [1120, 680], [1180, 520]], yellow, { layers: 14, alpha: 0.006, k: 0.06, spread: 0.03 });
      p.wash(p.ellipse(1500, 70, 200, 150, 14, 0.15), mix(yellow, [255, 255, 255], 0.3), { layers: 16, alpha: 0.016, k: 0.3, spread: 0.08 });
    },

    wall(p) {
      /* the strip sits in the section's top padding, above the heading */
      p.wash([[-40, -20], [2440, -20], [2440, 150], [1600, 175], [800, 158], [-40, 172]], rose, { layers: 16, alpha: 0.008, k: 0.1, spread: 0.05, blur: 6 });
      [
        [120, 150, 190, 150, -5, "blueprint"],
        [360, 140, 150, 118, 4, "sketch"],
        [575, 152, 170, 130, -3, "swatch"],
        [820, 138, 200, 150, 6, "plan"],
        [1560, 146, 196, 152, -6, "blueprint"],
        [1800, 140, 150, 120, 3, "sketch"],
        [2020, 150, 180, 138, -4, "plan"],
        [2270, 142, 170, 128, 5, "swatch"],
      ].forEach(([x, y, w, h, r, k]) => sheet(p, x, y, w, h, r, k));
      p.splatter(1180, 120, rose, 6, 30, 4, 0.5);
      p.splatter(1340, 170, yellow, 5, 24, 4, 0.5);
    },

    desk(p) {
      /* wall behind, with the window light landing on it */
      p.wash(p.ellipse(560, 440, 540, 440, 18, 0.12), mix(rose, yellow, 0.35), { layers: 20, alpha: 0.012, k: 0.3, spread: 0.08, blur: 6 });
      p.wash([[700, 60], [1010, 20], [1070, 430], [760, 480]], yellow, { layers: 14, alpha: 0.02, k: 0.08, spread: 0.03, blur: 6 });
      sheet(p, 235, 240, 230, 172, -4, "blueprint");
      sheet(p, 480, 190, 160, 124, 5, "sketch");

      /* shelf, with the hard hat on it and the shadow it throws down-left */
      p.wash([[600, 330], [1020, 322], [1024, 344], [602, 352]], wood, { layers: 14, alpha: 0.1, k: 0.02, spread: 0.004, rim: 0.25 });
      p.wash([[602, 352], [1024, 344], [1010, 374], [612, 382]], shadowC, { layers: 10, alpha: 0.045, k: 0.05, blur: 3 });
      p.wash([[690, 260], [860, 252], [840, 330], [668, 336]], shadowC, { layers: 10, alpha: 0.03, k: 0.1, blur: 6 });
      const dome = [];
      for (let i = 0; i <= 14; i++) {
        const t = (i / 14) * Math.PI;
        dome.push([800 - 82 * Math.cos(t), 330 - 80 * Math.sin(t)]);
      }
      p.wash(dome, yellow, { layers: 18, alpha: 0.1, k: 0.02, spread: 0.004, rim: 0.32, rimColor: orange });
      p.wash([[810, 252], [880, 330], [826, 330]], mix(yellow, orange, 0.5), { layers: 10, alpha: 0.08, k: 0.06, blur: 2 });
      p.wash([[792, 251], [808, 251], [812, 330], [788, 330]], mix(yellow, orange, 0.35), { layers: 8, alpha: 0.12, k: 0.02 });
      p.lift(p.ellipse(760, 284, 22, 12, 10, 0.2, -0.6), 0.55, 3);
      p.wash([[694, 328], [906, 326], [910, 342], [690, 344]], mix(yellow, orange, 0.3), { layers: 12, alpha: 0.12, k: 0.02, rim: 0.3, rimColor: orange });

      /* desk: warm wood, the window light raking across its right half */
      p.wash([[20, 600], [1080, 585], [1090, 760], [10, 780]], wood, { layers: 16, alpha: 0.075, k: 0.02, spread: 0.004 });
      p.wash([[600, 590], [1080, 585], [1090, 760], [520, 768]], yellow, { layers: 10, alpha: 0.03, k: 0.04, blur: 4 });
      p.wash([[10, 780], [1090, 760], [1090, 800], [10, 820]], shade(wood, 0.8), { layers: 12, alpha: 0.09, k: 0.02 });
      p.wash([[60, 820], [92, 820], [88, 1000], [64, 1000]], wood, { layers: 10, alpha: 0.07, k: 0.03 });
      p.wash([[1008, 800], [1040, 800], [1036, 1000], [1012, 1000]], wood, { layers: 10, alpha: 0.07, k: 0.03 });
      p.wash([[10, 820], [1090, 800], [1090, 920], [10, 940]], shadowC, { layers: 12, alpha: 0.015, k: 0.08, blur: 8 });

      /* laptop, its shadow thrown left */
      p.wash(p.ellipse(430, 690, 240, 20, 14, 0.12), shadowC, { layers: 14, alpha: 0.05, k: 0.2, blur: 6 });
      p.wash([[330, 420], [600, 410], [608, 612], [322, 626]], mix(gray, violet, 0.15), { layers: 16, alpha: 0.085, k: 0.03, spread: 0.006, rim: 0.28 });
      p.wash([[346, 434], [586, 425], [593, 598], [340, 610]], mix(cerulean, gray, 0.5), {
        layers: 14, alpha: 0.07, k: 0.03, spread: 0.005,
        grad: { line: [346, 430, 590, 610], stops: [[0, mix(cerulean, gray, 0.35), 0.5], [1, mix(violet, gray, 0.5), 1.1]] },
      });
      [[462, 70, rose], [482, 110, cerulean], [502, 86, violet], [522, 64, rose], [542, 120, cerulean], [562, 90, violet]].forEach(([y, w, c], i) => {
        const x0 = 366 + (i % 2) * 14;
        p.wash([[x0, y], [x0 + w, y - 1], [x0 + w, y + 7], [x0, y + 8]], c, { layers: 6, alpha: 0.1, k: 0.05, spread: 0.01 });
      });
      p.lift([[560, 432], [584, 431], [590, 520], [566, 530]], 0.35, 6);
      p.wash([[322, 626], [608, 612], [660, 668], [268, 688]], mix(gray, yellow, 0.15), { layers: 14, alpha: 0.07, k: 0.03, spread: 0.006, rim: 0.2 });
      p.wash([[322, 622], [608, 608], [609, 618], [322, 632]], mix(gray, violet, 0.4), { layers: 8, alpha: 0.08, k: 0.03, blur: 1.2 });
      for (let r = 0; r < 3; r++) {
        const y0 = 634 + r * 14, xl = 318 - r * 14, xr = 612 + r * 14;
        for (let k = 0; k < 10; k++) {
          const a = xl + ((xr - xl) * k) / 10 + 3, b = xl + ((xr - xl) * (k + 1)) / 10 - 3;
          p.wash([[a, y0], [b, y0 - 1], [b - 2, y0 + 9], [a - 2, y0 + 10]], mix(gray, violet, 0.3), { layers: 3, alpha: 0.09, k: 0.04 });
        }
      }

      /* open notebook, front left, with a pencil */
      p.wash([[70, 712], [420, 698], [430, 772], [56, 788]], shadowC, { layers: 10, alpha: 0.03, k: 0.05, blur: 5 });
      p.wash([[88, 700], [248, 694], [244, 760], [70, 768]], paperWhite, { layers: 6, alpha: 0.55, k: 0.02 });
      p.wash([[248, 694], [404, 688], [414, 752], [244, 760]], paperWhite, { layers: 6, alpha: 0.55, k: 0.02 });
      p.wash([[244, 694], [252, 694], [248, 760], [240, 760]], mix(gray, violet, 0.3), { layers: 6, alpha: 0.08, k: 0.02, blur: 1.2 });
      for (let i = 0; i < 4; i++) {
        line(p, [96 - i * 4, 712 + i * 12], [236 - i * 1, 707 + i * 12], 1, cerulean, 0.2);
        line(p, [262, 704 + i * 12], [396 + i * 3, 699 + i * 12], 1, cerulean, 0.2);
      }
      p.wash(p.ellipse(330, 730, 34, 12, 12, 0.25), rose, { layers: 10, alpha: 0.07, k: 0.3, blur: 0.8 });
      p.wash(quad(120, 772, 300, 742, 7), yellow, { layers: 10, alpha: 0.13, k: 0.02 });
      p.wash(quad(300, 742, 318, 739, 7), mix(wood, paperWhite, 0.3), { layers: 8, alpha: 0.14, k: 0.02 });

      /* palette with the three primaries, front right */
      p.wash(p.ellipse(700, 744, 128, 22, 16, 0.08), shadowC, { layers: 10, alpha: 0.04, k: 0.15, blur: 4 });
      p.wash(p.ellipse(720, 726, 124, 32, 18, 0.06), mix(wood, paperWhite, 0.45), { layers: 14, alpha: 0.08, k: 0.04, rim: 0.25 });
      p.lift(p.ellipse(782, 738, 12, 6, 10, 0.15), 0.7, 1);
      [[650, 720, rose], [700, 713, yellow], [750, 718, cerulean], [688, 734, mix(rose, cerulean, 0.5)]].forEach(([x, y, c]) => {
        p.wash(p.ellipse(x, y, 19, 8, 12, 0.25), c, { layers: 12, alpha: 0.12, k: 0.25, rim: 0.35 });
        p.lift(p.ellipse(x - 6, y - 3, 4, 2, 8, 0.2), 0.6, 0.8);
      });

      /* mug, back right: lit on the window side, violet in its own shadow */
      p.wash(p.ellipse(860, 702, 74, 12, 12, 0.15), shadowC, { layers: 12, alpha: 0.05, k: 0.2, blur: 4 });
      p.wash([[860, 560], [950, 556], [948, 676], [936, 690], [874, 692], [862, 678]], cerulean, { layers: 16, alpha: 0.085, k: 0.02, spread: 0.004, rim: 0.32 });
      p.wash([[860, 560], [884, 559], [886, 690], [874, 692], [862, 678]], mix(violet, cerulean, 0.4), { layers: 10, alpha: 0.07, k: 0.03, blur: 2 });
      p.lift([[924, 566], [936, 565], [934, 676], [922, 680]], 0.5, 2.5);
      p.wash([[950, 584], [986, 590], [994, 626], [982, 656], [948, 662], [948, 644], [966, 641], [974, 626], [968, 606], [950, 604]], cerulean, { layers: 12, alpha: 0.09, k: 0.03, rim: 0.3 });
      p.wash(p.ellipse(905, 559, 44, 9, 14, 0.06), mix(orange, violet, 0.45), { layers: 12, alpha: 0.12, k: 0.06 });
      p.lift(p.ellipse(920, 557, 12, 2.5, 8, 0.1), 0.5, 1);

      p.splatter(560, 700, rose, 5, 30, 3.5, 0.5);
      p.splatter(980, 740, yellow, 4, 22, 3.5, 0.5);
    },

    steam(p) {
      /* vapour: soft puffs strung along two S-curves, thinning as they rise */
      const wisp = (x0, phase, color) => {
        for (let i = 0; i < 9; i++) {
          const t = i / 8;
          const y = 290 - t * 250;
          const x = x0 + Math.sin(t * Math.PI * 2 + phase) * 22;
          p.wash(p.ellipse(x, y, 13 - t * 5, 22, 10, 0.3), color, { layers: 8, alpha: 0.05 * (1 - t * 0.7), k: 0.3, blur: 3 });
        }
      };
      wisp(96, 0, mix(gray, rose, 0.35));
      wisp(122, 2.2, mix(gray, yellow, 0.3));
    },
  };

  const full = { w: 1600, h: 900 };
  window.Scene.define(
    "about",
    {
      far: { ...full, out: 1280, q: 0.7, grain: [0.06, 0.1], down: 4, paper: "#fbf7ef", paint: layers.far },
      light: { ...full, out: 1280, q: 0.7, down: 3, paint: layers.light },
      wall: { w: 2400, h: 300, out: 1920, q: 0.74, grain: [0.08, 0.06], paint: layers.wall },
      desk: { w: 1100, h: 1000, out: 900, q: 0.72, grain: [0.09, 0.07], feather: { cx: 0.5, cy: 0.5, rx: 0.5, ry: 0.5, inner: 0.55 }, paint: layers.desk },
      steam: { w: 200, h: 300, out: 200, q: 0.8, paint: layers.steam },
    },
    { fallback: { layers: ["far"], w: 800 } },
  );
})();
