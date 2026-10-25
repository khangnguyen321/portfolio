/* ═══ APPROACH SCENE — "Glazing": three panes of coloured light ═══
   The section keeps its interaction — one glaze lands per principle — so the
   glass is painted as separate transparent panes over a painted base:
     far          violet wall: violet top and edges, pale centre, violet
                  fading into pale green at the bottom (hands off to How)
     base         the taped sheet: violet-lit floor, a faint hard hat and
                  monitor that show through the glass
     pane-*       tall translucent glazes — cerulean behind, rose in the
                  middle, yellow in front — each with its own coloured shadow.
                  The page multiplies them, so where the shadows overlap they
                  really turn orange (yellow·rose) and violet (rose·blue). */
(function () {
  const P = window.Pig;
  const { rose, yellow, cerulean, violet, viridian, gray, mix, shade } = P;
  const paperWhite = [255, 253, 247];
  const soft = { k: 0.3, spread: 0.08 };
  const wide = { k: 0.3, spread: 0.16 };

  /* an upright pane in gentle perspective: face, thickness edge, lit rim,
     and the shadow it throws down-right across the floor */
  function pane(p, x, y, w, h, color) {
    const sk = h * 0.08;
    const face = [[x, y + sk], [x + w, y], [x + w, y + h], [x, y + h + sk]];
    const floorY = y + h + sk;
    /* shadow: coloured light, never grey — a long skewed shape on the floor */
    p.wash([[x, floorY], [x + w, y + h], [x + w + 210, y + h + 60], [x + 200, floorY + 76]], color, { layers: 16, alpha: 0.035, k: 0.05, spread: 0.02, blur: 9 });
    p.wash([[x + 40, floorY + 6], [x + w - 10, y + h + 6], [x + w + 120, y + h + 40], [x + 150, floorY + 50]], color, { layers: 10, alpha: 0.03, k: 0.06, blur: 6 });
    /* the face: thin, even glaze, a little denser toward the bottom */
    /* one plain glaze — gradients and part-glazes band visibly on flat glass */
    p.wash(face, color, { layers: 16, alpha: 0.04, k: 0.02, spread: 0.004, rim: 0.3, rimShade: 0.8, rimW: 3 });
    /* thickness on the right edge */
    p.wash([[x + w, y], [x + w + 14, y + 8], [x + w + 14, y + h + 8], [x + w, y + h]], shade(color, 0.85), { layers: 10, alpha: 0.1, k: 0.02 });
    /* light passing through: bare-paper streaks and a bright top rim */
    p.lift([[x + w * 0.16, y + sk * 0.9 + 26], [x + w * 0.26, y + sk * 0.75 + 26], [x + w * 0.14, y + h * 0.7], [x + w * 0.06, y + h * 0.72]], 0.5, 4);
    p.lift([[x + w * 0.36, y + sk * 0.6 + 40], [x + w * 0.4, y + sk * 0.55 + 40], [x + w * 0.3, y + h * 0.5], [x + w * 0.27, y + h * 0.5]], 0.4, 2);
    p.lift([[x + 6, y + sk + 2], [x + w - 6, y + 2], [x + w - 6, y + 10], [x + 6, y + sk + 10]], 0.55, 2);
    p.bloom(x + w * 0.62, y + h * 0.66, w * 0.16, color, 0.12);
  }

  const layers = {
    far(p) {
      /* wide layer spread so every wash melts gradually — no frame edge */
      p.wash([[-40, -40], [1640, -40], [1640, 120], [1100, 140], [500, 122], [-40, 140]], violet, { layers: 22, alpha: 0.006, k: 0.1, spread: 0.12 });
      p.wash(p.ellipse(-60, 420, 220, 460, 14, 0.14), violet, { ...wide, layers: 22, alpha: 0.007 });
      p.wash(p.ellipse(1660, 380, 220, 460, 14, 0.14), violet, { ...wide, layers: 22, alpha: 0.007 });
      p.wash(p.ellipse(1640, 260, 120, 160, 12, 0.15), rose, { ...wide, layers: 12, alpha: 0.006 });
      p.wash(p.ellipse(-30, 560, 130, 150, 12, 0.15), cerulean, { ...wide, layers: 12, alpha: 0.005 });
      p.wash(p.ellipse(800, 450, 700, 330, 16, 0.1), violet, { ...wide, layers: 18, alpha: 0.0012 });
      /* bottom: violet melting into pale green */
      p.wash([[-40, 710], [600, 700], [1200, 715], [1640, 702], [1640, 840], [-40, 850]], violet, { layers: 16, alpha: 0.004, k: 0.1, spread: 0.1 });
      p.wash([[-40, 810], [600, 800], [1200, 815], [1640, 802], [1640, 960], [-40, 960]], viridian, { layers: 20, alpha: 0.006, k: 0.1, spread: 0.1 });
    },

    base(p) {
      /* violet room light, brighter where the light comes in, upper-left */
      p.wash(p.ellipse(420, 360, 460, 420, 18, 0.1), violet, { ...wide, layers: 22, alpha: 0.011, blur: 12 });
      p.wash(p.ellipse(220, 170, 240, 200, 14, 0.14), mix(yellow, paperWhite, 0.4), { ...wide, layers: 14, alpha: 0.01, blur: 10 });
      /* the floor line, softly */
      p.wash([[-20, 600], [820, 584], [820, 820], [-20, 820]], mix(violet, cerulean, 0.3), { layers: 16, alpha: 0.014, k: 0.04, spread: 0.02, blur: 8 });
      /* what you see through the glass: a monitor and a hard hat, faint */
      const mon = mix(gray, cerulean, 0.35);
      p.wash([[430, 300], [640, 292], [646, 452], [434, 460]], mon, { layers: 12, alpha: 0.035, k: 0.03, blur: 2 });
      p.wash([[520, 456], [554, 454], [560, 530], [514, 532]], mon, { layers: 8, alpha: 0.035, k: 0.03, blur: 2 });
      p.wash([[468, 530], [604, 526], [610, 548], [462, 552]], mon, { layers: 8, alpha: 0.04, k: 0.03, blur: 2 });
      [[330, 70], [350, 110], [370, 54]].forEach(([y, w], i) => p.wash([[460, y + i * 4], [460 + w, y + i * 4], [460 + w, y + i * 4 + 8], [460, y + i * 4 + 8]], violet, { layers: 4, alpha: 0.05, k: 0.05 }));
      const dome = [];
      for (let i = 0; i <= 14; i++) {
        const t = (i / 14) * Math.PI;
        dome.push([250 - 96 * Math.cos(t), 580 - 92 * Math.sin(t)]);
      }
      p.wash(dome, mix(yellow, gray, 0.45), { layers: 12, alpha: 0.04, k: 0.03, blur: 2 });
      p.wash([[140, 574], [362, 570], [366, 590], [136, 594]], mix(yellow, gray, 0.45), { layers: 10, alpha: 0.05, k: 0.03, blur: 2 });
      p.splatter(680, 680, violet, 6, 30, 4, 0.4);
    },

    "pane-cerulean": (p) => pane(p, 360, 120, 250, 420, cerulean),
    "pane-rose": (p) => pane(p, 230, 190, 250, 420, rose),
    "pane-yellow": (p) => pane(p, 100, 260, 250, 420, yellow),
  };

  const full = { w: 1600, h: 900 };
  const sq = { w: 800, h: 800, out: 800, q: 0.76 };
  window.Scene.define(
    "approach",
    {
      far: { ...full, out: 1280, q: 0.7, grain: [0.06, 0.1], down: 4, paper: "#fbf7ef", paint: layers.far },
      base: { ...sq, grain: [0.08, 0.08], down: 2, paper: "#fffdf8", paint: layers.base },
      "pane-cerulean": { ...sq, grain: [0.1, 0.06], paint: layers["pane-cerulean"] },
      "pane-rose": { ...sq, grain: [0.1, 0.06], paint: layers["pane-rose"] },
      "pane-yellow": { ...sq, grain: [0.1, 0.06], paint: layers["pane-yellow"] },
    },
    { fallback: { layers: ["far"], w: 800 } },
  );
})();
