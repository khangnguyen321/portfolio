/* ═══ SELECTED WORK SCENE — "The paintings": four vignettes ═══
   Each project card's picture area is its own small painting with a mini
   background; the UI mock sits over its lower part, so every subject lives
   in the upper area (upper-left; upper-right for the flipped AI Audit card).
   Vignette edges are feathered and the boxes overhang their cards, so
   neighbours bleed into each other across the gaps.
     far       the wall: warm neutral top, soft violet bottom, and each
               project's colours at the page edges beside its card
     noigate   night sky (ultramarine + cerulean), a rocket off a git branch
     bid       warm desk, scales weighing three bids, a tiny trophy
     ops       corkboard with pinned notes and a checklist (green + yellow)
     audit     glowing light table, documents, magnifier, rose stamp */
(function () {
  const P = window.Pig;
  const { rose, yellow, cerulean, ultra, violet, viridian, orange, gray, mix, shade } = P;
  const paperWhite = [255, 253, 247];
  const sap = [143, 209, 63];
  const neutral = mix(mix(rose, yellow, 0.5), cerulean, 0.42);

  const quad = (x0, y0, x1, y1, w) => {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    const nx = (-dy / L) * (w / 2), ny = (dx / L) * (w / 2);
    return [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]];
  };
  const rect = (p, cx, cy, w, h, rot = 0) => p.rotate([[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]], cx, cy, rot);
  const line = (p, a, b, w, color, alpha = 0.4) => p.wash(quad(a[0], a[1], b[0], b[1], w), color, { layers: 4, alpha, k: 0.02, spread: 0.002 });
  const soft = { k: 0.3, spread: 0.08 };
  /* a sheet of paper with a coloured shadow and ruled lines */
  const paper = (p, cx, cy, w, h, rot, shadowC, lines = 5, lineC = gray) => {
    p.wash(rect(p, cx + 8, cy + 10, w, h, rot), shadowC, { layers: 10, alpha: 0.03, k: 0.04, blur: 5 });
    p.wash(rect(p, cx, cy, w, h, rot), paperWhite, { layers: 6, alpha: 0.5, k: 0.02, spread: 0.004 });
    for (let i = 0; i < lines; i++) {
      const y = -h * 0.32 + (i * h * 0.64) / Math.max(1, lines - 1);
      const len = w * (i % 3 === 2 ? 0.42 : 0.64);
      const [a, b] = p.rotate([[cx - w * 0.32, cy + y], [cx - w * 0.32 + len, cy + y]], cx, cy, rot);
      line(p, a, b, 3, lineC, 0.2);
    }
  };

  const layers = {
    far(p) {
      p.wash([[-40, -40], [1640, -40], [1640, 120], [1100, 140], [500, 124], [-40, 140]], neutral, { layers: 20, alpha: 0.008, k: 0.1, spread: 0.05 });
      p.wash(p.ellipse(-20, 230, 170, 200, 14, 0.15), ultra, { ...soft, layers: 18, alpha: 0.01 });
      p.wash(p.ellipse(10, 160, 120, 120, 12, 0.15), cerulean, { ...soft, layers: 14, alpha: 0.008 });
      p.wash(p.ellipse(-20, 470, 160, 180, 14, 0.15), yellow, { ...soft, layers: 16, alpha: 0.01 });
      p.wash(p.ellipse(20, 540, 110, 110, 12, 0.15), orange, { ...soft, layers: 12, alpha: 0.008 });
      p.wash(p.ellipse(1620, 450, 160, 190, 14, 0.15), viridian, { ...soft, layers: 16, alpha: 0.009 });
      p.wash(p.ellipse(1590, 520, 110, 110, 12, 0.15), yellow, { ...soft, layers: 12, alpha: 0.008 });
      p.wash(p.ellipse(1620, 700, 170, 170, 14, 0.15), violet, { ...soft, layers: 16, alpha: 0.01 });
      p.wash(p.ellipse(1580, 760, 110, 100, 12, 0.15), rose, { ...soft, layers: 12, alpha: 0.008 });
      /* bottom: soft violet, handing over to Approach */
      p.wash([[-40, 780], [600, 770], [1200, 785], [1640, 772], [1640, 960], [-40, 960]], violet, { layers: 20, alpha: 0.007, k: 0.1, spread: 0.05 });
    },

    noigate(p) {
      /* night sky in the upper-left, melting to pale toward the mock */
      p.wash(p.ellipse(380, 330, 420, 340, 18, 0.12), ultra, { ...soft, layers: 24, alpha: 0.028, blur: 10 });
      p.wash(p.ellipse(560, 200, 300, 220, 16, 0.14), cerulean, { ...soft, layers: 18, alpha: 0.026, blur: 8 });
      p.wash(p.ellipse(260, 460, 260, 200, 16, 0.14), mix(ultra, violet, 0.5), { ...soft, layers: 16, alpha: 0.02, blur: 8 });
      p.bloom(520, 260, 70, cerulean, 0.14);
      /* stars: lifted back to paper */
      for (let i = 0; i < 26; i++) {
        const x = p.rand(80, 680), y = p.rand(80, 560);
        const r = p.rand(1.6, 4.4);
        p.lift(p.ellipse(x, y, r, r, 8, 0.2), p.rand(0.6, 0.95), 0.6);
      }
      /* the git branch along the bottom of the sky: pale lines + commits */
      const main = [[90, 580], [600, 580]];
      line(p, main[0], main[1], 7, mix(cerulean, paperWhite, 0.6), 0.5);
      line(p, [280, 580], [330, 520], 6, mix(cerulean, paperWhite, 0.5), 0.45);
      line(p, [330, 520], [420, 490], 6, mix(cerulean, paperWhite, 0.5), 0.45);
      [[130, 580], [230, 580], [330, 580], [470, 580], [570, 580]].forEach(([x, y]) => {
        p.wash(p.ellipse(x, y, 12, 12, 12, 0.08), paperWhite, { layers: 8, alpha: 0.35, k: 0.06 });
        p.wash(p.ellipse(x, y, 7, 7, 10, 0.08), cerulean, { layers: 8, alpha: 0.14, k: 0.06 });
      });
      p.wash(p.ellipse(420, 490, 13, 13, 12, 0.08), rose, { layers: 10, alpha: 0.2, k: 0.06, rim: 0.3 });
      /* the launch trail curving up from the branch tip */
      p.drybrush([[420, 488], [470, 420], [530, 340], [600, 270]], { width: 26, color: mix(rose, orange, 0.4), color2: yellow, alpha: 0.26, taper: 0.4 });
      p.wash(p.ellipse(440, 470, 40, 22, 12, 0.3), mix(gray, cerulean, 0.4), { layers: 12, alpha: 0.04, k: 0.3, blur: 5 });
      /* rocket, pointing up-right */
      const rk = (pts) => p.rotate(pts, 650, 220, 40);
      p.wash(rk([[650, 120], [678, 160], [684, 280], [616, 280], [622, 160]]), mix(paperWhite, cerulean, 0.15), { layers: 16, alpha: 0.12, k: 0.03, rim: 0.28, rimColor: mix(cerulean, ultra, 0.5) });
      p.wash(rk([[660, 130], [678, 160], [684, 280], [656, 280]]), cerulean, { layers: 10, alpha: 0.07, k: 0.04, blur: 2 });
      p.wash(p.ellipse(...rk([[650, 192]])[0], 14, 14, 12, 0.06), ultra, { layers: 12, alpha: 0.12, k: 0.06, rim: 0.3 });
      p.lift(p.ellipse(...rk([[646, 188]])[0], 4, 3, 8, 0.1), 0.8, 1);
      p.wash(rk([[618, 240], [596, 300], [622, 286]]), rose, { layers: 12, alpha: 0.12, k: 0.05, rim: 0.3 });
      p.wash(rk([[682, 240], [704, 300], [678, 286]]), rose, { layers: 12, alpha: 0.12, k: 0.05, rim: 0.3 });
      p.wash(rk([[628, 282], [672, 282], [660, 330], [650, 352], [640, 330]]), orange, { layers: 14, alpha: 0.1, k: 0.15, blur: 2.5 });
      p.wash(rk([[636, 282], [664, 282], [656, 314], [650, 332], [644, 314]]), yellow, { layers: 10, alpha: 0.14, k: 0.12, blur: 2 });
      p.splatter(560, 330, yellow, 6, 30, 3.5, 0.55);
    },

    bid(p) {
      /* warm wall and desk */
      p.wash(p.ellipse(380, 300, 420, 300, 18, 0.12), yellow, { ...soft, layers: 22, alpha: 0.02, blur: 10 });
      p.wash(p.ellipse(560, 200, 240, 180, 14, 0.14), orange, { ...soft, layers: 14, alpha: 0.014, blur: 8 });
      p.wash(p.ellipse(860, 420, 220, 260, 14, 0.15), orange, { ...soft, layers: 12, alpha: 0.012, blur: 10 });
      p.wash([[40, 500], [740, 488], [760, 620], [30, 640]], mix(mix(orange, yellow, 0.4), gray, 0.45), { layers: 16, alpha: 0.05, k: 0.04, spread: 0.01, blur: 3 });
      const sh = mix(violet, orange, 0.35);
      /* scales: post, beam tipped toward the heavier pan */
      p.wash(p.ellipse(360, 512, 90, 14, 12, 0.15), sh, { layers: 10, alpha: 0.05, k: 0.2, blur: 4 });
      p.wash([[310, 500], [410, 500], [396, 482], [324, 482]], mix(gray, yellow, 0.3), { layers: 12, alpha: 0.12, k: 0.03, rim: 0.25 });
      p.wash([[352, 484], [368, 484], [366, 170], [354, 170]], mix(gray, orange, 0.25), { layers: 14, alpha: 0.12, k: 0.02, rim: 0.25 });
      p.wash(p.ellipse(360, 166, 14, 14, 12, 0.06), yellow, { layers: 12, alpha: 0.15, k: 0.05, rim: 0.35, rimColor: orange });
      p.wash(quad(150, 190, 570, 150, 10), mix(gray, orange, 0.3), { layers: 12, alpha: 0.13, k: 0.02, rim: 0.2 });
      /* chains to the pans */
      [[156, 192, 110, 330], [156, 192, 202, 330], [564, 152, 520, 290], [564, 152, 610, 290]].forEach(([a, b, c, d]) => line(p, [a, b], [c, d], 2.4, mix(gray, orange, 0.3), 0.4));
      /* left pan: one heavy paper bid (A); right pan: two (B, C), lifted higher */
      p.wash(p.ellipse(156, 336, 74, 16, 14, 0.1), mix(yellow, orange, 0.5), { layers: 14, alpha: 0.12, k: 0.05, rim: 0.35, rimColor: orange });
      p.wash(p.ellipse(566, 296, 74, 16, 14, 0.1), mix(yellow, orange, 0.5), { layers: 14, alpha: 0.12, k: 0.05, rim: 0.35, rimColor: orange });
      paper(p, 156, 296, 70, 74, -4, sh, 3);
      paper(p, 540, 262, 50, 58, 5, sh, 2);
      paper(p, 594, 258, 50, 62, -6, sh, 2);
      p.text("A", 146, 300, 26, shade(orange, 0.75), 0.6, -4, "italic 600 {s}px Georgia, serif");
      p.text("B", 532, 266, 20, shade(orange, 0.75), 0.6, 5, "italic 600 {s}px Georgia, serif");
      p.text("C", 586, 264, 20, shade(orange, 0.75), 0.6, -6, "italic 600 {s}px Georgia, serif");
      /* tiny trophy on the desk */
      p.wash(p.ellipse(630, 540, 44, 9, 12, 0.15), sh, { layers: 8, alpha: 0.06, k: 0.2, blur: 3 });
      p.wash([[598, 444], [662, 444], [656, 480], [640, 496], [620, 496], [604, 480]], yellow, { layers: 16, alpha: 0.13, k: 0.03, rim: 0.4, rimColor: orange });
      p.lift([[610, 452], [620, 452], [620, 482], [612, 476]], 0.6, 1.4);
      p.wash([[624, 496], [636, 496], [638, 516], [622, 516]], mix(yellow, orange, 0.4), { layers: 10, alpha: 0.14, k: 0.03 });
      p.wash([[606, 516], [654, 516], [658, 536], [602, 536]], orange, { layers: 12, alpha: 0.11, k: 0.03, rim: 0.3 });
      p.wash([[598, 452], [580, 456], [584, 476], [602, 474]], yellow, { layers: 8, alpha: 0.1, k: 0.1 });
      p.wash([[662, 452], [680, 456], [676, 476], [658, 474]], yellow, { layers: 8, alpha: 0.1, k: 0.1 });
      p.splatter(260, 430, orange, 5, 26, 3.5, 0.5);
    },

    ops(p) {
      /* green-and-yellow wall, corkboard on it */
      p.wash(p.ellipse(380, 300, 430, 320, 18, 0.12), viridian, { ...soft, layers: 20, alpha: 0.014, blur: 10 });
      p.wash(p.ellipse(220, 200, 240, 200, 14, 0.14), sap, { ...soft, layers: 16, alpha: 0.014, blur: 8 });
      p.wash(p.ellipse(560, 420, 220, 200, 14, 0.14), yellow, { ...soft, layers: 14, alpha: 0.014, blur: 8 });
      p.wash(p.ellipse(120, 520, 220, 220, 14, 0.15), yellow, { ...soft, layers: 12, alpha: 0.01, blur: 10 });
      const sh = mix(violet, viridian, 0.4);
      const cork = mix(mix(orange, yellow, 0.45), gray, 0.35);
      p.wash(rect(p, 382, 336, 600, 440, -1.5).map(([x, y]) => [x + 12, y + 14]), sh, { layers: 10, alpha: 0.03, k: 0.03, blur: 7 });
      p.wash(rect(p, 382, 336, 600, 440, -1.5), cork, { layers: 18, alpha: 0.07, k: 0.025, spread: 0.004, rim: 0.3 });
      p.granulate && null;
      /* cork texture: a scatter of tiny darker specks */
      for (let i = 0; i < 70; i++) {
        const x = p.rand(100, 670), y = p.rand(130, 540), r = p.rand(1.2, 3);
        p.wash(p.ellipse(x, y, r, r, 6, 0.3), shade(cork, 0.7), { layers: 2, alpha: 0.18, k: 0.1 });
      }
      /* the checklist sheet with green checks */
      paper(p, 262, 340, 230, 300, 2, sh, 0);
      for (let i = 0; i < 4; i++) {
        const y = 236 + i * 64;
        p.wash(rect(p, 192, y, 30, 30, 2), mix(gray, viridian, 0.3), { layers: 6, alpha: 0.07, k: 0.04 });
        line(p, [222, y + 2], [340, y + 4], 4, gray, 0.2);
        line(p, [222, y + 16], [300, y + 17], 3, gray, 0.14);
        if (i < 2) p.drybrush([[180, y - 2], [190, y + 10], [212, y - 18]], { width: 8, color: viridian, alpha: 0.55, taper: 0.2 });
      }
      /* sticky notes */
      [[520, 220, 140, 130, 5, yellow], [510, 400, 130, 120, -4, sap], [650, 320, 100, 96, 7, mix(yellow, orange, 0.25)]].forEach(([x, y, w, h, r, c]) => {
        p.wash(rect(p, x + 8, y + 10, w, h, r), sh, { layers: 8, alpha: 0.03, k: 0.04, blur: 5 });
        p.wash(rect(p, x, y, w, h, r), c, { layers: 14, alpha: 0.08, k: 0.04, rim: 0.3 });
        const [a, b] = p.rotate([[x - w * 0.3, y - h * 0.05], [x + w * 0.28, y - h * 0.05]], x, y, r);
        line(p, a, b, 3, shade(c, 0.6), 0.22);
        const [c2, d] = p.rotate([[x - w * 0.3, y + h * 0.18], [x + w * 0.1, y + h * 0.18]], x, y, r);
        line(p, c2, d, 3, shade(c, 0.6), 0.2);
      });
      /* push-pins */
      [[262, 196, rose], [520, 160, cerulean], [510, 344, rose], [650, 276, viridian]].forEach(([x, y, c]) => {
        p.wash(p.ellipse(x + 3, y + 4, 7, 5, 10, 0.2), sh, { layers: 6, alpha: 0.08, k: 0.2, blur: 1.5 });
        p.wash(p.ellipse(x, y, 8, 8, 10, 0.12), c, { layers: 12, alpha: 0.18, k: 0.2, rim: 0.4 });
        p.lift(p.ellipse(x - 2.5, y - 2.5, 2.2, 1.8, 8, 0.1), 0.9, 0.5);
      });
      /* a pencil resting on the frame */
      p.wash(quad(560, 568, 720, 540, 9), yellow, { layers: 12, alpha: 0.14, k: 0.02, rim: 0.25, rimColor: orange });
      p.wash(quad(720, 540, 742, 536, 9), rose, { layers: 8, alpha: 0.16, k: 0.03 });
      p.splatter(140, 590, viridian, 5, 24, 3.5, 0.5);
    },

    audit(p) {
      /* violet room, the light table glowing upper-right */
      p.wash(p.ellipse(720, 300, 420, 320, 18, 0.12), violet, { ...soft, layers: 22, alpha: 0.02, blur: 10 });
      p.wash(p.ellipse(960, 180, 220, 200, 14, 0.14), rose, { ...soft, layers: 16, alpha: 0.016, blur: 8 });
      p.wash(p.ellipse(520, 460, 220, 220, 14, 0.14), mix(violet, ultra, 0.4), { ...soft, layers: 14, alpha: 0.012, blur: 10 });
      const table = [[430, 210], [1020, 190], [1060, 560], [400, 590]];
      p.wash(table.map(([x, y]) => [x + 14, y + 16]), mix(violet, ultra, 0.4), { layers: 12, alpha: 0.035, k: 0.03, blur: 8 });
      p.wash(table, mix(violet, paperWhite, 0.55), { layers: 16, alpha: 0.07, k: 0.025, spread: 0.004, rim: 0.3, rimColor: violet });
      /* the glow: pigment lifted back to bright paper in the middle */
      p.lift(p.ellipse(730, 390, 230, 150, 16, 0.12), 0.75, 30);
      p.wash(p.ellipse(730, 390, 260, 170, 16, 0.12), yellow, { layers: 10, alpha: 0.012, k: 0.2, blur: 18 });
      /* documents on the glass */
      paper(p, 620, 380, 210, 270, -6, mix(violet, cerulean, 0.3), 7, violet);
      paper(p, 830, 350, 190, 250, 8, mix(violet, cerulean, 0.3), 6, violet);
      p.wash(rect(p, 636, 330, 150, 16, -6), rose, { layers: 8, alpha: 0.07, k: 0.05 });
      p.text("$ 4,812", 760, 440, 28, mix(violet, ultra, 0.5), 0.55, 8, "italic 600 {s}px Georgia, serif");
      /* magnifier over the right sheet: lens lifted bright with a cerulean cast */
      p.wash(p.ellipse(860, 310, 86, 86, 18, 0.04), cerulean, { layers: 14, alpha: 0.05, k: 0.04 });
      p.lift(p.ellipse(848, 298, 40, 30, 12, 0.1, -0.6), 0.5, 8);
      p.wash(p.ellipse(860, 310, 86, 86, 18, 0.04), violet, { layers: 1, alpha: 0, k: 0.04, rim: 0.65, rimW: 9, rimShade: 0.85, rimBlur: 1.6 });
      p.text("§3.2", 822, 324, 34, mix(violet, ultra, 0.6), 0.6, 0, "italic 600 {s}px Georgia, serif");
      p.wash(quad(918, 372, 1010, 470, 20), mix(violet, ultra, 0.3), { layers: 14, alpha: 0.12, k: 0.02, rim: 0.3 });
      p.lift(quad(926, 378, 990, 446, 4), 0.5, 1);
      /* the rose stamp, pressed slightly off-square */
      p.wash(p.ellipse(560, 500, 46, 46, 18, 0.1), rose, { layers: 1, alpha: 0, k: 0.15, rim: 0.7, rimW: 6, rimShade: 0.9, rimBlur: 1 });
      p.wash(rect(p, 560, 502, 34, 28, -6), rose, { layers: 10, alpha: 0.06, k: 0.15, blur: 0.8 });
      p.wash(p.ellipse(552, 498, 4, 4, 8, 0.1), rose, { layers: 8, alpha: 0.22, k: 0.1 });
      p.wash(p.ellipse(570, 497, 4, 4, 8, 0.1), rose, { layers: 8, alpha: 0.22, k: 0.1 });
      p.splatter(990, 560, rose, 5, 24, 3.5, 0.5);
    },
  };

  const full = { w: 1600, h: 900 };
  /* vignettes: 1100×1000 = the card's picture box; feathered toward the
     corner the subject lives in, so the mock side fades to bare paper */
  const vig = (paint, cx) => ({ w: 1100, h: 1000, out: 900, q: 0.74, grain: [0.1, 0.08], feather: { cx, cy: 0.42, rx: 0.62, ry: 0.62, inner: 0.45 }, paint });
  window.Scene.define(
    "work",
    {
      far: { ...full, out: 1280, q: 0.7, grain: [0.06, 0.1], down: 4, paper: "#fbf7ef", paint: layers.far },
      noigate: vig(layers.noigate, 0.4),
      bid: vig(layers.bid, 0.4),
      ops: vig(layers.ops, 0.4),
      audit: vig(layers.audit, 0.6),
    },
    { fallback: { layers: ["far"], w: 800 } },
  );
})();
