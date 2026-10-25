/* ═══ EXPERIENCE SCENE — "Strata": a canyon of painted rock ═══
     far      orange wall: soft orange top, pale centre, orange cooling into
              pale blue at the bottom
     canyon   the cross-section beside the heading: orange, ochre, rose,
              violet and blue-grey layers, cut by a canyon, with tools
              embedded like fossils — hard hat, calculator, wrench and gear,
              code brackets, video camera, pen nib, graduation cap
     edge     a tall strip of strata for the page edges (mirrored on the
              right), fading toward the timeline */
(function () {
  const P = window.Pig;
  const { rose, yellow, cerulean, violet, orange, gray, mix, shade } = P;
  const paperWhite = [255, 253, 247];
  const ochre = mix(mix(yellow, orange, 0.45), gray, 0.25);
  const blueGray = mix(cerulean, gray, 0.55);
  const strata = [orange, ochre, mix(rose, orange, 0.25), mix(violet, rose, 0.25), blueGray];
  const soft = { k: 0.3, spread: 0.12 };
  const quad = (x0, y0, x1, y1, w) => {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    const nx = (-dy / L) * (w / 2), ny = (dx / L) * (w / 2);
    return [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]];
  };
  const rect = (p, cx, cy, w, h, rot = 0) => p.rotate([[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]], cx, cy, rot);

  /* a wavy band from y0 to y1 across x0..x1 */
  function band(p, x0, x1, y0, y1, color, alpha = 0.07, seedWave = 0) {
    const top = [], bot = [];
    for (let i = 0; i <= 10; i++) {
      const x = x0 + ((x1 - x0) * i) / 10;
      top.push([x, y0 + Math.sin(i * 0.9 + seedWave) * 8 + p.gauss() * 3]);
      bot.push([x, y1 + Math.sin(i * 0.8 + seedWave + 1) * 8 + p.gauss() * 3]);
    }
    p.wash(top.concat(bot.reverse()), color, { layers: 18, alpha, k: 0.05, spread: 0.01, rim: 0.35, rimShade: 0.75, rimW: 3.4, rimBlur: 1.4 });
    /* texture: darker flecks and a few lifted pebbles */
    for (let i = 0; i < (x1 - x0) / 22; i++) {
      const x = p.rand(x0, x1), y = p.rand(y0 + 6, y1 - 6), r = p.rand(1.5, 4.5);
      p.wash(p.ellipse(x, y, r * 1.6, r, 6, 0.3), shade(color, 0.7), { layers: 2, alpha: 0.2, k: 0.1 });
    }
    for (let i = 0; i < (x1 - x0) / 90; i++) p.lift(p.ellipse(p.rand(x0, x1), p.rand(y0 + 8, y1 - 8), p.rand(4, 9), p.rand(3, 5), 8, 0.3), 0.35, 1.2);
  }

  /* fossil: the object lifted out of the rock, its rim pooled darker */
  function fossil(p, pts, color, strength = 0.55) {
    p.lift(pts, strength, 1.2);
    p.wash(pts, color, { layers: 1, alpha: 0, k: 0.04, rim: 0.55, rimShade: 0.6, rimW: 2.4, rimBlur: 0.8 });
  }
  const fossils = {
    hat(p, x, y, c) {
      const d = [];
      for (let i = 0; i <= 12; i++) { const t = (i / 12) * Math.PI; d.push([x - 30 * Math.cos(t), y - 28 * Math.sin(t)]); }
      fossil(p, d, c);
      fossil(p, [[x - 40, y], [x + 40, y], [x + 40, y + 7], [x - 40, y + 7]], c);
    },
    calc(p, x, y, c) {
      fossil(p, rect(p, x, y, 40, 52, -8), c, 0.5);
      for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) p.wash(rect(p, x - 10 + k * 10, y - 2 + r * 11, 6, 6, -8), shade(c, 0.6), { layers: 3, alpha: 0.18, k: 0.05 });
      p.wash(rect(p, x - 1, y - 16, 26, 9, -8), shade(c, 0.6), { layers: 3, alpha: 0.14, k: 0.05 });
    },
    wrench(p, x, y, c) {
      fossil(p, quad(x - 34, y + 14, x + 18, y - 8, 9), c);
      fossil(p, p.ellipse(x + 24, y - 11, 12, 12, 12, 0.08), c);
      const gx = x - 46, gy = y - 12;
      fossil(p, p.ellipse(gx, gy, 14, 14, 14, 0.06), c);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; fossil(p, rect(p, gx + Math.cos(a) * 17, gy + Math.sin(a) * 17, 6, 6, (a * 180) / Math.PI), c, 0.5); }
    },
    code(p, x, y, c) {
      p.text("</>", x - 30, y + 14, 40, shade(c, 0.55), 0.55, 0, "italic 600 {s}px Georgia, serif");
    },
    camera(p, x, y, c) {
      fossil(p, rect(p, x, y, 46, 30, 4), c);
      fossil(p, [[x + 24, y - 6], [x + 42, y - 14], [x + 42, y + 14], [x + 24, y + 6]], c);
      fossil(p, p.ellipse(x - 12, y - 24, 9, 9, 10, 0.08), c, 0.45);
      fossil(p, p.ellipse(x + 8, y - 24, 9, 9, 10, 0.08), c, 0.45);
    },
    nib(p, x, y, c) {
      fossil(p, p.rotate([[x, y - 24], [x + 12, y], [x + 6, y + 18], [x - 6, y + 18], [x - 12, y]], x, y, 30), c);
      p.wash(p.rotate(quad(x, y - 20, x, y + 2, 2), x, y, 30), shade(c, 0.5), { layers: 3, alpha: 0.2, k: 0.03 });
    },
    cap(p, x, y, c) {
      fossil(p, [[x - 34, y - 4], [x, y - 18], [x + 34, y - 4], [x, y + 10]], c);
      fossil(p, [[x - 18, y + 4], [x + 18, y + 4], [x + 16, y + 18], [x - 16, y + 18]], c, 0.45);
      p.wash(quad(x + 22, y - 2, x + 26, y + 22, 2.2), shade(c, 0.5), { layers: 3, alpha: 0.2, k: 0.03 });
    },
  };

  const layers = {
    far(p) {
      p.wash([[-40, -40], [1640, -40], [1640, 130], [1100, 150], [500, 132], [-40, 150]], orange, { layers: 22, alpha: 0.005, k: 0.1, spread: 0.12 });
      p.wash(p.ellipse(-60, 420, 200, 440, 14, 0.14), orange, { ...soft, layers: 20, alpha: 0.006 });
      p.wash(p.ellipse(1660, 420, 200, 440, 14, 0.14), mix(orange, rose, 0.3), { ...soft, layers: 20, alpha: 0.006 });
      p.wash(p.ellipse(800, 450, 700, 330, 16, 0.1), orange, { ...soft, layers: 18, alpha: 0.001 });
      p.wash([[-40, 710], [600, 700], [1200, 715], [1640, 702], [1640, 840], [-40, 850]], orange, { layers: 16, alpha: 0.004, k: 0.1, spread: 0.1 });
      p.wash([[-40, 810], [600, 800], [1200, 815], [1640, 802], [1640, 960], [-40, 960]], cerulean, { layers: 20, alpha: 0.006, k: 0.1, spread: 0.1 });
    },

    canyon(p) {
      /* evening sky above the rim */
      p.wash(p.ellipse(550, 120, 520, 140, 16, 0.15), mix(orange, yellow, 0.5), { ...soft, layers: 16, alpha: 0.014, blur: 8 });
      p.wash(p.ellipse(860, 90, 70, 60, 12, 0.1), yellow, { layers: 14, alpha: 0.08, k: 0.1, blur: 2 });
      /* the strata, top to bottom */
      const ys = [210, 330, 450, 570, 690, 820];
      strata.forEach((c, i) => band(p, 40, 1060, ys[i], ys[i + 1], c, 0.075, i * 1.7));
      /* sage cap on the rim */
      band(p, 40, 1060, 196, 222, mix([143, 209, 63], gray, 0.3), 0.06, 9);
      /* the canyon cut: lifted back to sky, a river at the bottom */
      const cut = [[440, 190], [690, 186], [660, 330], [640, 450], [612, 570], [600, 690], [520, 690], [510, 570], [486, 450], [470, 330]];
      p.lift(cut, 0.82, 4);
      p.wash(cut, mix(yellow, paperWhite, 0.5), { layers: 6, alpha: 0.05, k: 0.04, blur: 6 });
      p.wash([[512, 676], [608, 676], [604, 700], [516, 700]], cerulean, { layers: 12, alpha: 0.12, k: 0.08, rim: 0.3 });
      /* shade on the canyon's west wall — warm violet, not black */
      p.wash([[640, 330], [676, 196], [712, 220], [690, 360], [664, 470], [628, 450]], mix(violet, orange, 0.3), { layers: 12, alpha: 0.025, k: 0.2, spread: 0.06, blur: 12 });
      /* fossils, one family per layer */
      fossils.hat(p, 200, 280, strata[0]);
      fossils.calc(p, 860, 392, strata[1]);
      fossils.wrench(p, 260, 520, strata[2]);
      fossils.code(p, 860, 630, strata[3]);
      fossils.camera(p, 210, 760, strata[4]);
      fossils.nib(p, 380, 770, strata[4]);
      fossils.cap(p, 880, 770, strata[4]);
      /* the base fades into the paper */
      p.wash([[40, 820], [1060, 820], [1060, 880], [40, 880]], blueGray, { layers: 10, alpha: 0.02, k: 0.1, blur: 10 });
      p.splatter(950, 250, orange, 5, 30, 4, 0.45);
    },

    edge(p) {
      /* strata run down the strip; colours cycle through the five */
      let y = 0, i = 0;
      while (y < 1600) {
        const h = p.rand(110, 190);
        band(p, -20, 340, y, y + h, strata[i % strata.length], 0.06, i * 1.3);
        if (i % 3 === 1) {
          const keys = Object.keys(fossils);
          fossils[keys[i % keys.length]](p, p.rand(80, 170), y + h / 2, strata[i % strata.length]);
        }
        y += h;
        i++;
      }
    },
  };

  const full = { w: 1600, h: 900 };
  window.Scene.define(
    "experience",
    {
      far: { ...full, out: 1280, q: 0.7, grain: [0.06, 0.1], down: 4, paper: "#fbf7ef", paint: layers.far },
      canyon: { w: 1100, h: 900, out: 820, q: 0.7, grain: [0.2, 0.1], feather: { cx: 0.5, cy: 0.5, rx: 0.62, ry: 0.62, inner: 0.7, edge: 0.08 }, paint: layers.canyon },
      /* inner side (right edge of the strip) fades out; mirrored for the right */
      edge: { w: 320, h: 1600, out: 280, q: 0.72, grain: [0.2, 0.1], feather: { cx: 0, cy: 0.5, rx: 1, ry: 3, inner: 0.25, edge: 0.04 }, paint: layers.edge },
    },
    { fallback: { layers: ["far"], w: 800 } },
  );
})();
