/* ═══ CONTACT SCENE — "Clean paper": blue hour over a blank sheet ═══
     far      ultramarine-to-cerulean sky across the top with a hint of
              violet, fading to bare cream by the middle (the form sits below)
     clouds   soft colour clouds that drift on a loop
     plane    the vignette under the email links: a blank sheet, a brush
              resting on it, a paper plane taking off with a thin streak */
(function () {
  const P = window.Pig;
  const { yellow, cerulean, ultra, violet, rose, gray, mix, shade } = P;
  const paperWhite = [255, 253, 247];
  const soft = { k: 0.3, spread: 0.12 };
  const quad = (x0, y0, x1, y1, w) => {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    const nx = (-dy / L) * (w / 2), ny = (dx / L) * (w / 2);
    return [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]];
  };

  const layers = {
    far(p) {
      /* the sky: deeper at the very top, thinning downward */
      p.wash([[-40, -40], [1640, -40], [1640, 240], [1200, 270], [700, 250], [300, 275], [-40, 260]], ultra, { layers: 24, alpha: 0.006, k: 0.1, spread: 0.12 });
      p.wash([[-40, -40], [1640, -40], [1640, 120], [900, 140], [-40, 130]], ultra, { layers: 18, alpha: 0.006, k: 0.1, spread: 0.1 });
      p.wash(p.ellipse(1300, 150, 420, 200, 16, 0.14), cerulean, { ...soft, layers: 18, alpha: 0.007 });
      p.wash(p.ellipse(200, 110, 340, 160, 16, 0.14), violet, { ...soft, layers: 16, alpha: 0.005 });
      p.wash(p.ellipse(1500, 300, 160, 120, 14, 0.15), mix(rose, violet, 0.5), { ...soft, layers: 12, alpha: 0.004 });
      /* faint wash edges down the lower half; the middle stays bare cream */
      p.wash(p.ellipse(-60, 640, 170, 320, 14, 0.14), cerulean, { ...soft, layers: 14, alpha: 0.004 });
      p.wash(p.ellipse(1660, 620, 170, 320, 14, 0.14), ultra, { ...soft, layers: 14, alpha: 0.004 });
    },

    clouds(p) {
      [[300, 170, 140, 40, violet], [700, 110, 180, 44, cerulean], [1120, 200, 150, 38, mix(ultra, violet, 0.5)], [1450, 90, 120, 34, mix(rose, violet, 0.6)]].forEach(([x, y, rx, ry, c]) => {
        p.wash(p.ellipse(x, y, rx, ry, 14, 0.25), c, { layers: 14, alpha: 0.014, k: 0.35, spread: 0.08, blur: 6 });
        p.lift(p.ellipse(x - rx * 0.2, y - ry * 0.3, rx * 0.5, ry * 0.4, 12, 0.3), 0.25, 8);
      });
    },

    plane(p) {
      const sh = mix(ultra, violet, 0.35);
      /* the blank sheet, lying slightly askew, its shadow tinted blue */
      p.wash([[140, 250], [620, 210], [660, 520], [170, 560]].map(([x, y]) => [x + 16, y + 20]), sh, { layers: 12, alpha: 0.04, k: 0.04, blur: 10 });
      p.wash([[140, 250], [620, 210], [660, 520], [170, 560]], paperWhite, { layers: 6, alpha: 0.6, k: 0.02, spread: 0.004 });
      p.wash([[140, 250], [620, 210], [660, 520], [170, 560]], cerulean, { layers: 1, alpha: 0, k: 0.02, rim: 0.2, rimW: 3, rimBlur: 2 });
      /* the brush resting across it, a fresh ultramarine stroke beside it */
      p.drybrush([[220, 470], [300, 446], [380, 452], [440, 432]], { width: 26, color: ultra, color2: mix(ultra, violet, 0.3), alpha: 0.34, taper: 0.8 });
      p.wash(quad(440, 430, 520, 410, 12), mix(ultra, violet, 0.2), { layers: 12, alpha: 0.13, k: 0.06, blur: 0.8 });
      p.wash(quad(520, 410, 556, 401, 12), mix(gray, paperWhite, 0.3), { layers: 10, alpha: 0.16, k: 0.03 });
      p.wash(quad(556, 401, 780, 340, 11), mix(cerulean, P.viridian, 0.5), { layers: 14, alpha: 0.12, k: 0.02, rim: 0.3 });
      p.wash(quad(560, 418, 790, 356, 10), sh, { layers: 8, alpha: 0.04, k: 0.05, blur: 4 });
      p.lift(quad(600, 386, 760, 344, 2.5), 0.5, 1);
      /* the paper plane lifting off from the sheet's corner, up and right */
      const pl = (pts) => p.rotate(pts, 760, 140, -14);
      p.wash(pl([[860, 110], [690, 150], [745, 162]]), paperWhite, { layers: 6, alpha: 0.55, k: 0.02 });
      p.wash(pl([[860, 110], [745, 162], [760, 210]]), mix(cerulean, paperWhite, 0.55), { layers: 12, alpha: 0.12, k: 0.03, rim: 0.3, rimColor: ultra });
      p.wash(pl([[745, 162], [770, 180], [760, 210]]), mix(ultra, violet, 0.3), { layers: 10, alpha: 0.12, k: 0.03 });
      p.wash(pl([[860, 110], [690, 150], [745, 162]]), cerulean, { layers: 1, alpha: 0, k: 0.02, rim: 0.3, rimW: 2.2 });
      /* its thin paint streak, curling back to the sheet */
      p.drybrush([[612, 236], [640, 196], [676, 178], [700, 182], [714, 162]], { width: 7, color: ultra, color2: violet, alpha: 0.4, taper: 0.3, breakOn: 0.03 });
      p.splatter(820, 240, cerulean, 5, 26, 3.5, 0.5);
      p.splatter(260, 520, ultra, 5, 24, 3.5, 0.45);
    },
  };

  const full = { w: 1600, h: 900 };
  window.Scene.define(
    "contact",
    {
      far: { ...full, out: 1280, q: 0.7, grain: [0.06, 0.1], down: 4, paper: "#fbf7ef", paint: layers.far },
      clouds: { ...full, out: 1600, q: 0.72, grain: [0.06, 0.06], down: 2, paint: layers.clouds },
      plane: { w: 900, h: 640, out: 800, q: 0.78, grain: [0.1, 0.08], feather: { cx: 0.5, cy: 0.5, rx: 0.7, ry: 0.7, inner: 0.75, edge: 0.06 }, paint: layers.plane },
    },
    { fallback: { layers: ["far"], w: 800 } },
  );
})();
