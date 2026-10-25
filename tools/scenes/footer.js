/* ═══ FOOTER SCENE — "Rinse water": every pigment, mixed ═══
     far    21:9 strip: pale warm wash, cream at the top, soft warm grey-brown
            along the bottom; left and centre calm for the links
     jar    the jar of muddy-rainbow rinse water on the right, a wet brush
            leaning on the rim, drops and ripples on the table beside it.
            The jar mouth sits at ~17% of the image height — the companion
            drop aims there (script.js). */
(function () {
  const P = window.Pig;
  const { rose, yellow, cerulean, ultra, violet, viridian, orange, gray, mix, shade } = P;
  const paperWhite = [255, 253, 247];
  const warmGray = mix(mix(orange, gray, 0.6), [120, 100, 80], 0.3);
  const soft = { k: 0.3, spread: 0.12 };
  const quad = (x0, y0, x1, y1, w) => {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    const nx = (-dy / L) * (w / 2), ny = (dx / L) * (w / 2);
    return [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]];
  };

  const layers = {
    far(p) {
      p.wash(p.ellipse(1050, 520, 1100, 300, 16, 0.1), mix(yellow, orange, 0.4), { ...soft, layers: 18, alpha: 0.0022 });
      p.wash(p.ellipse(1800, 560, 420, 320, 16, 0.12), mix(rose, orange, 0.5), { ...soft, layers: 16, alpha: 0.004 });
      p.wash(p.ellipse(100, 600, 300, 260, 14, 0.12), mix(violet, cerulean, 0.5), { ...soft, layers: 12, alpha: 0.0025 });
      p.wash([[-40, 700], [700, 690], [1400, 705], [2140, 692], [2140, 960], [-40, 960]], warmGray, { layers: 22, alpha: 0.008, k: 0.1, spread: 0.1 });
      p.wash([[-40, 800], [700, 792], [1400, 806], [2140, 795], [2140, 960], [-40, 960]], warmGray, { layers: 18, alpha: 0.007, k: 0.1, spread: 0.08 });
    },

    jar(p) {
      const sh = mix(violet, warmGray, 0.4);
      /* table shadow, tinted by the water inside */
      p.wash(p.ellipse(320, 740, 210, 26, 16, 0.12), mix(violet, viridian, 0.4), { layers: 14, alpha: 0.05, k: 0.2, blur: 8 });
      /* the water: every pigment, swirling and settling to mud at the bottom */
      const water = [[150, 290], [450, 284], [452, 640], [430, 700], [380, 722], [220, 722], [170, 700], [148, 640]];
      [[rose, 190, 360], [orange, 290, 330], [yellow, 400, 380], [viridian, 230, 470], [cerulean, 380, 500], [ultra, 300, 590], [violet, 200, 620]].forEach(([c, x, y]) =>
        p.wash(p.ellipse(x, y, 120, 90, 14, 0.3), c, { layers: 10, alpha: 0.03, k: 0.35, spread: 0.08, comp: "multiply" }),
      );
      p.wash(water, mix(warmGray, violet, 0.3), { layers: 14, alpha: 0.025, k: 0.03, spread: 0.01 });
      p.wash([[150, 560], [452, 556], [452, 640], [430, 700], [380, 722], [220, 722], [170, 700], [148, 640]], warmGray, { layers: 12, alpha: 0.04, k: 0.05, blur: 6 });
      /* swirls still dissolving */
      p.drybrush([[180, 420], [260, 380], [340, 420], [420, 390]], { width: 14, color: rose, color2: orange, alpha: 0.2, taper: 0.4 });
      p.drybrush([[170, 540], [260, 500], [330, 560], [430, 520]], { width: 14, color: cerulean, color2: viridian, alpha: 0.2, taper: 0.4 });
      p.drybrush([[210, 640], [290, 610], [380, 650]], { width: 12, color: violet, alpha: 0.16, taper: 0.4 });
      /* water surface */
      p.wash(p.ellipse(300, 288, 152, 12, 16, 0.05), mix(cerulean, paperWhite, 0.4), { layers: 10, alpha: 0.08, k: 0.04 });
      /* the glass: no outline — a cool faint glaze, pooled at the sides,
         and bright lifted highlights */
      const glass = [[136, 150], [464, 150], [470, 210], [470, 650], [446, 712], [390, 740], [210, 740], [154, 712], [130, 650], [130, 210]];
      p.wash(glass, mix(cerulean, paperWhite, 0.4), { layers: 10, alpha: 0.025, k: 0.02, rim: 0.28, rimColor: mix(cerulean, violet, 0.3), rimW: 3.4, rimBlur: 1.6 });
      p.wash([[130, 210], [150, 200], [150, 690], [132, 650]], mix(cerulean, gray, 0.4), { layers: 8, alpha: 0.05, k: 0.04, blur: 2 });
      p.wash([[470, 210], [450, 200], [450, 690], [468, 650]], mix(violet, gray, 0.4), { layers: 8, alpha: 0.06, k: 0.04, blur: 2 });
      p.lift([[168, 230], [186, 226], [182, 640], [166, 630]], 0.7, 3);
      p.lift([[208, 250], [214, 248], [210, 480], [204, 478]], 0.5, 1.5);
      /* the rim */
      p.wash(p.ellipse(300, 150, 168, 18, 18, 0.04), mix(cerulean, paperWhite, 0.5), { layers: 10, alpha: 0.08, k: 0.03, rim: 0.3, rimColor: mix(cerulean, violet, 0.4) });
      p.lift(p.ellipse(300, 150, 150, 10, 16, 0.04), 0.5, 2);
      /* the wet brush leaning on the rim, out to the upper right */
      p.wash(quad(268, 560, 330, 340, 9), mix(violet, warmGray, 0.5), { layers: 8, alpha: 0.05, k: 0.03, blur: 2 });
      p.wash(quad(330, 340, 382, 162, 11), shade(mix(violet, ultra, 0.4), 0.95), { layers: 14, alpha: 0.12, k: 0.02, rim: 0.25 });
      p.wash(quad(382, 162, 520, -40, 12), mix(violet, ultra, 0.3), { layers: 14, alpha: 0.13, k: 0.02, rim: 0.3 });
      p.lift(quad(392, 150, 510, -24, 3), 0.5, 1);
      p.wash(quad(318, 382, 340, 320, 16), mix(gray, yellow, 0.25), { layers: 10, alpha: 0.14, k: 0.03 });
      /* drops and ripples on the table beside it */
      [[560, 728, violet], [620, 744, rose], [592, 770, cerulean]].forEach(([x, y, c], i) => {
        p.wash(p.ellipse(x, y, 16 - i * 3, 7, 12, 0.2), c, { layers: 12, alpha: 0.12, k: 0.2, rim: 0.4 });
        p.wash(p.ellipse(x, y, 34 - i * 4, 12, 14, 0.05), c, { layers: 1, alpha: 0, k: 0.05, rim: 0.25, rimW: 1.8 });
      });
      p.splatter(520, 690, mix(rose, orange, 0.5), 5, 26, 3.5, 0.5);
    },
  };

  window.Scene.define(
    "footer",
    {
      far: { w: 2100, h: 900, out: 1400, q: 0.7, grain: [0.06, 0.1], down: 4, paper: "#fbf7ef", paint: layers.far },
      jar: { w: 600, h: 800, out: 480, q: 0.8, grain: [0.1, 0.08], paint: layers.jar },
    },
    { fallback: { layers: ["far"], w: 840 } },
  );
})();
