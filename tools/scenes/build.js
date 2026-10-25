/* ═══ WHAT I BUILD SCENE — "Three primaries": a studio table ═══
   The heading and the three cards fill the upper centre, so:
     far     the wall: soft cerulean band along the top, loose rose and yellow
             at the sides, pale centre, warm three-colour neutral at the
             bottom fading out — opaque, covers the section
     table   the table surface, seen slightly from above — full width, under
             the cards
     tubes   three tubes standing in a row, one under each card column, with
             spills that run together: puddles are painted with multiply, so
             blue + rose really makes violet, rose + yellow orange, and
             blue + yellow green
     dab-*   a small painted swatch per card, in place of the sketch icon
   Cerulean leads. */
(function () {
  const P = window.Pig;
  const TUBE_SCALE = 0.62;
  const { rose, yellow, cerulean, violet, orange, gray, mix, shade } = P;
  const paperWhite = [255, 253, 247];
  const shadowC = mix(violet, cerulean, 0.4);
  const neutral = mix(mix(rose, yellow, 0.5), cerulean, 0.42);

  /* one standing tube: cap on the table, crimped end up. `motif` paints the
     label art in tube-local coordinates (origin = label centre). */
  function tube(p, cx, tilt, color, deep, motif) {
    /* drawn at full size around (cx, 452), then shrunk toward its base */
    const S = TUBE_SCALE;
    const R = (pts) => p.rotate(pts.map(([x, y]) => [cx + (x - cx) * S, 452 + (y - 452) * S]), cx, 452, tilt);
    const L = (x, y) => R([[cx + x, 220 + y]])[0];
    /* colored shadow thrown back-left onto the wall/table */
    p.wash(R([[cx - 90, 120], [cx - 20, 110], [cx - 10, 452], [cx - 96, 456]]), shadowC, { layers: 12, alpha: 0.025, k: 0.08, blur: 10 });
    p.wash(p.ellipse(cx - 12, 452, 64 * S, 10, 12, 0.15), shadowC, { layers: 12, alpha: 0.06, k: 0.2, blur: 4 });
    /* cap */
    p.wash(R([[cx - 32, 388], [cx + 32, 388], [cx + 33, 448], [cx - 33, 448]]), mix(gray, paperWhite, 0.25), { layers: 12, alpha: 0.1, k: 0.03, rim: 0.22 });
    for (let i = -2; i <= 2; i++) p.wash(R([[cx + i * 12 - 2, 392], [cx + i * 12 + 2, 392], [cx + i * 12 + 2, 444], [cx + i * 12 - 2, 444]]), gray, { layers: 3, alpha: 0.08, k: 0.03 });
    /* shoulder + body, deeper glaze on the shade side, bare-paper streak on the lit side */
    const body = R([[cx - 62, 78], [cx + 62, 78], [cx + 54, 336], [cx + 26, 384], [cx - 26, 384], [cx - 54, 336]]);
    p.wash(body, color, { layers: 18, alpha: 0.09, k: 0.025, spread: 0.004, rim: 0.32, rimColor: deep });
    p.wash(R([[cx + 22, 78], [cx + 62, 78], [cx + 54, 336], [cx + 26, 384], [cx + 12, 384]]), deep, { layers: 12, alpha: 0.06, k: 0.04, blur: 2.4 });
    p.lift(R([[cx - 46, 92], [cx - 34, 90], [cx - 34, 320], [cx - 44, 322]]), 0.55, 3);
    /* crimped end */
    p.wash(R([[cx - 66, 54], [cx + 66, 54], [cx + 64, 80], [cx - 64, 80]]), deep, { layers: 12, alpha: 0.1, k: 0.03, rim: 0.25 });
    for (let i = -5; i <= 5; i++) p.wash(R([[cx + i * 11 - 1.5, 57], [cx + i * 11 + 1.5, 57], [cx + i * 11 + 1.5, 77], [cx + i * 11 - 1.5, 77]]), shade(deep, 0.8), { layers: 3, alpha: 0.1, k: 0.03 });
    /* label lifted back to paper */
    const label = R([[cx - 56, 150], [cx + 56, 150], [cx + 54, 292], [cx - 54, 292]]);
    p.lift(label, 0.82, 1.4);
    p.wash(label, paperWhite, { layers: 4, alpha: 0.16, k: 0.02 });
    motif(L, (x0, y0, w, h, c, a = 0.12) => p.wash(R([[cx + x0, 220 + y0], [cx + x0 + w, 220 + y0], [cx + x0 + w, 220 + y0 + h], [cx + x0, 220 + y0 + h]]), c, { layers: 10, alpha: a, k: 0.04, rim: 0.25 }));
  }

  const layers = {
    far(p) {
      const soft = { k: 0.32, spread: 0.1 };
      /* soft cerulean along the top — picks up About's pale-blue hand-off */
      p.wash([[-40, -40], [1640, -40], [1640, 150], [1200, 170], [700, 152], [300, 175], [-40, 160]], cerulean, { layers: 22, alpha: 0.008, k: 0.1, spread: 0.05 });
      /* the wall: loose washes of the three primaries, kept to the sides */
      p.wash(p.ellipse(-10, 360, 240, 420, 14, 0.14), cerulean, { ...soft, layers: 20, alpha: 0.009 });
      p.wash(p.ellipse(1640, 300, 220, 380, 14, 0.14), rose, { ...soft, layers: 18, alpha: 0.006 });
      p.wash(p.ellipse(1600, 580, 200, 240, 14, 0.14), yellow, { ...soft, layers: 16, alpha: 0.008 });
      p.wash(p.ellipse(40, 650, 180, 190, 14, 0.14), yellow, { ...soft, layers: 14, alpha: 0.005 });
      p.wash(p.ellipse(800, 430, 700, 330, 16, 0.1), cerulean, { ...soft, layers: 18, alpha: 0.0012 });
      /* bottom: all three melted into a warm neutral */
      p.wash([[-40, 720], [600, 708], [1200, 722], [1640, 710], [1640, 960], [-40, 960]], neutral, { layers: 20, alpha: 0.008, k: 0.1, spread: 0.05 });
    },

    table(p) {
      /* the table top, seen slightly from above: back edge soft, wood
         glazed warm with the wall's blue reflected in it */
      const top = [[-60, 300], [800, 286], [1600, 296], [2460, 288], [2460, 580], [-60, 580]];
      p.wash(top, mix(mix(yellow, orange, 0.4), gray, 0.55), { layers: 18, alpha: 0.045, k: 0.03, spread: 0.01 });
      p.wash([[-60, 300], [2460, 288], [2460, 318], [-60, 330]], mix(gray, violet, 0.3), { layers: 10, alpha: 0.05, k: 0.03, blur: 4 });
      p.wash(p.ellipse(1200, 420, 900, 80, 16, 0.1), cerulean, { layers: 12, alpha: 0.012, k: 0.2, spread: 0.06, blur: 10 });
      /* grain of the boards — faint dry-brush streaks */
      for (let i = 0; i < 7; i++) {
        const y = 345 + i * 26 + p.rand(-6, 6);
        p.drybrush([[-40, y], [800, y + p.rand(-4, 4)], [1600, y + p.rand(-4, 4)], [2440, y]], { width: 5, color: shade(mix(orange, gray, 0.6), 0.8), alpha: 0.08, taper: 0.05, breakOn: 0.05 });
      }
      /* the brush lying on the table, front left, and stray splatters */
      p.wash([[340, 498], [348, 486], [780, 452], [784, 462]], mix(cerulean, violet, 0.3), { layers: 12, alpha: 0.11, k: 0.02, rim: 0.25 });
      p.wash([[780, 452], [784, 462], [826, 456], [822, 446]], mix(gray, yellow, 0.3), { layers: 8, alpha: 0.14, k: 0.03 });
      p.wash([[822, 446], [826, 456], [866, 454], [870, 446], [858, 440]], rose, { layers: 10, alpha: 0.16, k: 0.1, blur: 0.8 });
      p.wash([[352, 506], [790, 470], [792, 478], [356, 514]], shadowC, { layers: 8, alpha: 0.04, k: 0.05, blur: 4 });
      p.splatter(1900, 470, cerulean, 8, 40, 5, 0.5);
      p.splatter(480, 380, yellow, 6, 30, 4.5, 0.5);
      p.splatter(2100, 380, rose, 6, 30, 4.5, 0.5);
    },

    tubes(p) {
      const blue = mix(cerulean, P.ultra, 0.45);
      /* spills first, so the tubes stand in them. multiply → real mixing */
      /* pooled, not ragged: low deformation, generous height (seen from above) */
      const spill = (pts, c, a = 0.07) => p.wash(pts, c, { layers: 18, alpha: a, k: 0.1, spread: 0.025, comp: "multiply", rim: 0.34, rimW: 3.2, rimBlur: 1.6 });
      spill(p.ellipse(200, 466, 130, 36, 18, 0.12), cerulean);
      spill(p.ellipse(370, 476, 110, 30, 16, 0.14, 0.08), cerulean);
      spill(p.ellipse(420, 512, 170, 28, 16, 0.14, 0.1), cerulean, 0.06);
      spill(p.ellipse(600, 462, 120, 32, 18, 0.12), rose);
      spill(p.ellipse(450, 470, 90, 26, 16, 0.14, -0.06), rose);
      spill(p.ellipse(760, 468, 100, 28, 16, 0.14, 0.06), rose);
      spill(p.ellipse(1000, 466, 130, 36, 18, 0.12), yellow, 0.085);
      spill(p.ellipse(840, 478, 110, 30, 16, 0.14, -0.08), yellow, 0.085);
      spill(p.ellipse(780, 514, 180, 28, 16, 0.14, -0.1), yellow, 0.075);
      /* blooms where the wet edges met: violet, orange, and green in front */
      p.bloom(405, 474, 24, violet, 0.16);
      p.bloom(800, 472, 22, orange, 0.16);
      p.bloom(600, 520, 20, P.viridian, 0.16);

      tube(p, 200, -4, cerulean, blue, (L, box) => {
        [-54, -16, 22].forEach((y, i) => {
          box(-36, y, 72, 28, mix(cerulean, paperWhite, 0.2), 0.12);
          box(-28, y + 10, 8, 8, i === 2 ? yellow : P.viridian, 0.2);
          box(-12, y + 12, 34, 4, blue, 0.14);
        });
      });
      tube(p, 600, 2, rose, mix(rose, violet, 0.5), (L, box) => {
        box(-32, -38, 64, 58, mix(rose, paperWhite, 0.3), 0.12);
        box(-21, -20, 14, 14, cerulean, 0.2);
        box(7, -20, 14, 14, cerulean, 0.2);
        box(-16, 4, 32, 6, mix(rose, violet, 0.5), 0.16);
        box(-3, -60, 6, 22, mix(rose, violet, 0.4), 0.14);
        box(-8, -70, 16, 12, yellow, 0.2);
        box(-44, -16, 12, 22, mix(rose, violet, 0.4), 0.1);
        box(32, -16, 12, 22, mix(rose, violet, 0.4), 0.1);
      });
      tube(p, 1000, 5, yellow, mix(yellow, orange, 0.6), (L, box) => {
        const gear = (gx, gy, r, n, c) => {
          for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            const [x, y] = [gx + Math.cos(a) * r, gy + Math.sin(a) * r];
            box(x - 5, y - 5, 10, 10, c, 0.16);
          }
          p.wash(p.ellipse(...L(gx, gy), r * 0.95 * TUBE_SCALE, r * 0.95 * TUBE_SCALE, 16, 0.05), c, { layers: 12, alpha: 0.11, k: 0.05, rim: 0.3 });
          p.lift(p.ellipse(...L(gx, gy), r * 0.38 * TUBE_SCALE, r * 0.38 * TUBE_SCALE, 12, 0.05), 0.8, 1);
        };
        gear(-10, 8, 26, 9, orange);
        gear(26, -34, 15, 7, mix(yellow, orange, 0.5));
      });
      /* splashes thrown up from the puddles */
      p.splatter(330, 430, cerulean, 6, 24, 3.5, 0.5);
      p.splatter(720, 432, rose, 6, 24, 3.5, 0.5);
      p.splatter(1120, 438, yellow, 6, 24, 3.5, 0.55);
    },
  };

  /* card swatches: one loaded brush-dab per primary, with a drip */
  const dab = (c, deep) => (p) => {
    p.wash([[30, 70], [150, 52], [210, 78], [200, 118], [90, 130], [26, 110]], c, { layers: 20, alpha: 0.085, k: 0.2, rim: 0.4, rimColor: deep, rimW: 3 });
    p.wash([[120, 74], [190, 70], [208, 96], [190, 116], [130, 112]], deep, { layers: 10, alpha: 0.05, k: 0.2, blur: 3 });
    p.wash([[96, 124], [106, 124], [104, 150], [100, 156], [96, 150]], c, { layers: 10, alpha: 0.12, k: 0.03 });
    p.lift(p.ellipse(80, 78, 24, 6, 10, 0.2, -0.15), 0.5, 2);
    p.splatter(196, 132, c, 4, 14, 3.5, 0.55);
  };

  const full = { w: 1600, h: 900 };
  const dabSpec = (c, deep) => ({ w: 240, h: 170, out: 240, q: 0.82, grain: [0.12, 0.08], paint: dab(c, deep) });
  window.Scene.define(
    "build",
    {
      far: { ...full, out: 1280, q: 0.7, grain: [0.06, 0.1], down: 4, paper: "#fbf7ef", paint: layers.far },
      table: { w: 2400, h: 560, out: 1920, q: 0.72, grain: [0.08, 0.08], down: 2, feather: { cx: 0.5, cy: 0.72, rx: 0.62, ry: 0.62, inner: 0.7 }, paint: layers.table },
      tubes: { w: 1200, h: 560, out: 1200, q: 0.78, grain: [0.12, 0.08], paint: layers.tubes },
      "dab-cerulean": dabSpec(cerulean, mix(cerulean, P.ultra, 0.5)),
      "dab-rose": dabSpec(rose, mix(rose, violet, 0.5)),
      "dab-yellow": dabSpec(yellow, mix(yellow, orange, 0.6)),
    },
    { fallback: { layers: ["far"], w: 800 } },
  );
})();
