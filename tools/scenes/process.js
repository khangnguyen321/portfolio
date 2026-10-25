/* ═══ HOW IT WORKS SCENE — "Wet-on-wet": a river of colour ═══
     far      green wall: soft green top, pale centre, green warming into
              pale orange at the bottom
     river    full-width: comes down the empty right side beside the heading,
              turns along the row of drops, and runs out to the left —
              starting pale (yellow-blue) and growing richer (phthalo green).
              Beside its descent: a magnifier, a blueprint scroll, code
              brackets and a tiny rocket.
     drop-1…4 the step drops, landing on the river and bleeding into it */
(function () {
  const P = window.Pig;
  const { rose, yellow, cerulean, violet, viridian, orange, gray, mix, shade } = P;
  const paperWhite = [255, 253, 247];
  const sap = [143, 209, 63];
  const teal = mix(viridian, cerulean, 0.5);
  const soft = { k: 0.3, spread: 0.12 };
  const quad = (x0, y0, x1, y1, w) => {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    const nx = (-dy / L) * (w / 2), ny = (dx / L) * (w / 2);
    return [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]];
  };

  /* sample a polyline at n even steps */
  function along(path, n) {
    const segs = [];
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const L = Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]);
      segs.push(L);
      total += L;
    }
    const out = [];
    for (let k = 0; k <= n; k++) {
      let d = (k / n) * total, i = 0;
      while (i < segs.length - 1 && d > segs[i]) d -= segs[i++];
      const t = Math.min(1, d / segs[i]);
      out.push([path[i][0] + (path[i + 1][0] - path[i][0]) * t, path[i][1] + (path[i + 1][1] - path[i][1]) * t, k / n]);
    }
    return out;
  }

  const layers = {
    far(p) {
      p.wash([[-40, -40], [1640, -40], [1640, 130], [1100, 150], [500, 132], [-40, 150]], viridian, { layers: 22, alpha: 0.006, k: 0.1, spread: 0.12 });
      p.wash(p.ellipse(1660, 360, 220, 440, 14, 0.14), viridian, { ...soft, layers: 20, alpha: 0.007 });
      p.wash(p.ellipse(-60, 420, 200, 420, 14, 0.14), mix(viridian, yellow, 0.4), { ...soft, layers: 18, alpha: 0.006 });
      p.wash(p.ellipse(1600, 160, 140, 140, 12, 0.15), cerulean, { ...soft, layers: 12, alpha: 0.006 });
      p.wash(p.ellipse(800, 450, 700, 330, 16, 0.1), viridian, { ...soft, layers: 18, alpha: 0.0011 });
      p.wash([[-40, 710], [600, 700], [1200, 715], [1640, 702], [1640, 840], [-40, 850]], viridian, { layers: 16, alpha: 0.004, k: 0.1, spread: 0.1 });
      p.wash([[-40, 810], [600, 800], [1200, 815], [1640, 802], [1640, 960], [-40, 960]], orange, { layers: 20, alpha: 0.005, k: 0.1, spread: 0.1 });
    },

    river(p) {
      const path = [[1430, -30], [1410, 110], [1350, 270], [1240, 420], [1080, 540], [880, 606], [600, 622], [300, 616], [-60, 626]];
      const pts = along(path, 90);
      /* wet body: overlapping soft pools, growing wider and richer */
      pts.forEach(([x, y, t]) => {
        const c = t < 0.35 ? mix(mix(yellow, cerulean, 0.5), viridian, t / 0.35 * 0.4) : mix(mix(viridian, cerulean, 0.25), viridian, (t - 0.35) / 0.65);
        const r = 18 + t * 26;
        p.wash(p.ellipse(x + p.gauss() * 4, y + p.gauss() * 4, r * 1.25, r, 12, 0.25), c, { layers: 6, alpha: 0.03 + t * 0.045, k: 0.3, spread: 0.06 });
      });
      /* pigment pooling along the banks */
      p.wash(pts.map(([x, y, t]) => [x, y - (16 + t * 24)]).concat(pts.slice().reverse().map(([x, y, t]) => [x, y + (16 + t * 24)])).map(([x, y]) => [x, y]), viridian, { layers: 1, alpha: 0, k: 0.04, depth: 1, rim: 0.25, rimW: 3, rimBlur: 1.8 });
      /* the current: dry-brush streaks running with the flow */
      p.drybrush(path.slice(2), { width: 26, color: mix(cerulean, viridian, 0.4), color2: shade(viridian, 0.8), alpha: 0.16, taper: 0.2, breakOn: 0.04 });
      p.drybrush(path.slice(4).map(([x, y]) => [x, y + 10]), { width: 12, color: mix(yellow, viridian, 0.4), alpha: 0.14, taper: 0.3, breakOn: 0.05 });
      p.bloom(1150, 500, 34, teal, 0.14);
      p.bloom(520, 620, 40, viridian, 0.14);
      p.bloom(180, 618, 36, mix(viridian, cerulean, 0.3), 0.14);
      /* a touch of rose where it all began */
      p.wash(p.ellipse(1418, 40, 36, 26, 12, 0.3), rose, { layers: 10, alpha: 0.04, k: 0.3, blur: 3 });

      /* details beside the descent — kept right of the heading (which ends
         near x≈1030) and left of the companion's gutter (x≳1480) */
      const sh = mix(violet, viridian, 0.35);
      /* tiny rocket at the river's head */
      const rk = (pts2) => p.rotate(pts2, 1500, 150, 30).map(([x, y]) => [x - 170, y - 76]);
      p.wash(rk([[1500, 96], [1516, 120], [1520, 190], [1480, 190], [1484, 120]]), mix(paperWhite, cerulean, 0.25), { layers: 12, alpha: 0.12, k: 0.03, rim: 0.3, rimColor: cerulean });
      p.wash(rk([[1482, 168], [1468, 206], [1486, 196]]), rose, { layers: 10, alpha: 0.14, k: 0.06 });
      p.wash(rk([[1518, 168], [1532, 206], [1514, 196]]), rose, { layers: 10, alpha: 0.14, k: 0.06 });
      p.wash(rk([[1486, 192], [1514, 192], [1506, 226], [1500, 240], [1494, 226]]), orange, { layers: 10, alpha: 0.12, k: 0.12, blur: 2 });
      p.wash(p.ellipse(...rk([[1500, 138]])[0], 7, 7, 10, 0.08), viridian, { layers: 10, alpha: 0.14, k: 0.06 });
      /* code brackets, painted loosely */
      p.text("</>", 1200, 290, 54, shade(teal, 0.7), 0.42, -6, "italic 500 {s}px Georgia, serif");
      /* blueprint scroll, half unrolled, lying in the bend of the river */
      const sx = 60, sy = 186;
      p.wash(quad(1010 + sx, 330 + sy, 1130 + sx, 300 + sy, 48).map(([x, y]) => [x + 8, y + 12]), sh, { layers: 8, alpha: 0.03, k: 0.04, blur: 5 });
      p.wash(quad(1010 + sx, 330 + sy, 1130 + sx, 300 + sy, 48), cerulean, { layers: 14, alpha: 0.075, k: 0.03, rim: 0.3, rimColor: mix(cerulean, violet, 0.4) });
      for (let i = 0; i < 4; i++) p.wash(quad(1020 + sx + i * 26, 326 + sy - i * 6.5 - 18, 1020 + sx + i * 26 + 6, 326 + sy - i * 6.5 + 20, 1.6), paperWhite, { layers: 3, alpha: 0.3, k: 0.02 });
      p.wash(p.ellipse(1136 + sx, 298 + sy, 12, 26, 12, 0.08, -0.24), mix(cerulean, violet, 0.3), { layers: 12, alpha: 0.1, k: 0.05 });
      p.lift(p.ellipse(1132 + sx, 290 + sy, 4, 12, 8, 0.1, -0.24), 0.5, 1);
      /* magnifier lying at the river's edge */
      p.wash(p.ellipse(1340, 386, 44, 42, 16, 0.05), cerulean, { layers: 10, alpha: 0.035, k: 0.04 });
      p.wash(p.ellipse(1340, 386, 44, 42, 16, 0.05), viridian, { layers: 1, alpha: 0, k: 0.04, rim: 0.6, rimW: 6, rimBlur: 1.4, rimShade: 0.8 });
      p.lift(p.ellipse(1330, 374, 15, 9, 10, 0.1, -0.6), 0.6, 3);
      p.wash(quad(1372, 418, 1418, 468, 12), mix(viridian, gray, 0.3), { layers: 12, alpha: 0.12, k: 0.02, rim: 0.25 });
      p.splatter(1260, 470, viridian, 6, 30, 4, 0.5);
      p.splatter(820, 650, cerulean, 5, 30, 3.5, 0.45);
    },
  };

  /* a landing drop: teardrop, pale highlight, the number in soft
     handwriting, and the puddle it makes as it bleeds into the river */
  const drop = (color, n) => (p) => {
    const tear = [[80, 14], [96, 52], [128, 98], [134, 128], [122, 158], [80, 174], [38, 158], [26, 128], [32, 98], [64, 52]];
    p.wash(p.ellipse(84, 182, 66, 12, 14, 0.2), color, { layers: 12, alpha: 0.06, k: 0.25, blur: 3 });
    p.wash(tear, color, { layers: 20, alpha: 0.1, k: 0.06, spread: 0.01, rim: 0.4, rimW: 3 });
    p.wash([[96, 70], [128, 108], [130, 140], [104, 166], [110, 120]], shade(color, 0.8), { layers: 10, alpha: 0.06, k: 0.06, blur: 3 });
    p.lift([[52, 92], [62, 82], [58, 130], [48, 134]], 0.65, 3);
    p.text(String(n), 66, 150, 52, shade(color, 0.42), 0.75, -4, "italic 400 {s}px Georgia, serif");
    p.splatter(84, 178, color, 5, 38, 4, 0.55);
  };

  const full = { w: 1600, h: 900 };
  const dropSpec = (c, n) => ({ w: 160, h: 200, out: 160, q: 0.84, grain: [0.1, 0.06], paint: drop(c, n) });
  window.Scene.define(
    "process",
    {
      far: { ...full, out: 1280, q: 0.7, grain: [0.06, 0.1], down: 4, paper: "#fbf7ef", paint: layers.far },
      river: { w: 1600, h: 700, out: 1920, q: 0.74, grain: [0.1, 0.08], paint: layers.river },
      "drop-1": dropSpec(sap, 1),
      "drop-2": dropSpec(viridian, 2),
      "drop-3": dropSpec(teal, 3),
      "drop-4": dropSpec(cerulean, 4),
    },
    { fallback: { layers: ["far"], w: 800 } },
  );
})();
