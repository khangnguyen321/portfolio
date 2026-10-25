/* ═══ HERO SCENE — "First wash": sunrise over the studio ═══
   1600×900 design space, painted in four transparent layers so the page can
   parallax them:
     far    sunrise sky (Hansa Yellow melting into Opera Rose), rose ground band
     mid    brush-streak trail behind the rocket, colour clouds, lift-off smoke
     float  a few splatters that drift on their own loop
     fore   laptop with splattered screen, rocket paint tube, three blobs
   The left half (behind the headline) stays a pale 10–20% wash; the richest
   colour lives on the right and along the edges. */
(function () {
  const W = 1600, H = 900;
  const P = window.Pig;
  const { rose, yellow, cerulean, ultra, violet, viridian, orange, gray, mix } = P;
  const glow = mix(yellow, orange, 0.35);
  const shadowTint = mix(violet, rose, 0.5);

  const layers = {
    far(p) {
      /* the far layer is painted at quarter resolution with no blur filter and
         upscaled by paintHero — Chrome's canvas blur renders large shapes in
         visible tiles, while an upscaled low-res wash is seamlessly soft */
      const soft = { k: 0.32, spread: 0.1 };
      /* text-safe veil over the left half: barely-there yellow and rose */
      p.wash(p.ellipse(380, 420, 620, 420, 16, 0.1), yellow, { ...soft, layers: 24, alpha: 0.0045 });
      p.wash(p.ellipse(160, 160, 420, 260, 14, 0.1), rose, { ...soft, layers: 20, alpha: 0.0032 });

      /* the sun: a wet glow on the right, yellow melting outward */
      p.wash(p.ellipse(1240, 380, 520, 420, 18, 0.12), yellow, { ...soft, layers: 30, alpha: 0.015 });
      p.wash(p.ellipse(1260, 360, 280, 230, 16, 0.14), glow, { ...soft, layers: 20, alpha: 0.013 });
      /* opera rose sky gathering above and around it — wet-on-wet hand-off */
      p.wash(p.ellipse(1380, 130, 460, 200, 16, 0.18), rose, { ...soft, layers: 26, alpha: 0.012 });
      p.wash(p.ellipse(1590, 420, 200, 340, 14, 0.18), rose, { ...soft, layers: 22, alpha: 0.014 });
      p.wash(p.ellipse(1060, 120, 260, 120, 14, 0.2), mix(rose, yellow, 0.4), { ...soft, layers: 16, alpha: 0.01 });
      /* where the two run together: orange blooms */
      p.wash(p.ellipse(1150, 200, 150, 90, 12, 0.2), orange, { ...soft, layers: 12, alpha: 0.012 });
      p.wash(p.ellipse(1470, 260, 120, 80, 12, 0.2), orange, { ...soft, layers: 12, alpha: 0.011 });
      p.bloom(1410, 210, 70, rose, 0.18);
      p.bloom(1180, 430, 90, yellow, 0.14);
      /* a cool cerulean whisper in the top corner keeps the warmth from going flat */
      p.wash(p.ellipse(1600, 40, 220, 120, 12, 0.2), cerulean, { ...soft, layers: 14, alpha: 0.01 });

      /* rose ground band along the bottom, strongest on the right, fading out
         — it hands the colour on to the About section */
      /* (plain fills, not a gradient: gradients dither at low resolution and the
         upscale turns the dither into a visible dot grid) */
      const band = [[-40, 800], [420, 780], [900, 772], [1300, 760], [1660, 752], [1660, 960], [-40, 960]];
      p.wash(band, rose, { layers: 22, alpha: 0.0045, k: 0.08, spread: 0.03 });
      p.wash([[560, 790], [1000, 772], [1660, 752], [1660, 960], [560, 960]], rose, { layers: 20, alpha: 0.005, k: 0.1, spread: 0.04 });
      p.wash([[1060, 774], [1340, 760], [1660, 752], [1660, 960], [1060, 960]], rose, { layers: 20, alpha: 0.008, k: 0.12, spread: 0.05 });
    },

    mid(p) {
      /* drifting colour clouds */
      p.wash(p.ellipse(1010, 150, 150, 60, 12, 0.25), mix(rose, violet, 0.35), { layers: 16, alpha: 0.03, k: 0.4, blur: 9 });
      p.wash(p.ellipse(1320, 70, 130, 46, 12, 0.25), yellow, { layers: 14, alpha: 0.035, k: 0.4, blur: 8 });
      p.wash(p.ellipse(1560, 610, 90, 40, 12, 0.25), mix(rose, orange, 0.4), { layers: 14, alpha: 0.03, k: 0.4, blur: 8 });

      /* the brush-streak trail the rocket leaves across the sky: a wet
         underlayer, then dry-brush bristles over it */
      /* starts at the brush tip on top of the rocket and arcs back across the sky */
      const trail = [[1486, 262], [1428, 196], [1340, 156], [1232, 142], [1112, 154], [1002, 194], [922, 252]];
      p.wash(
        [[1504, 262], [1440, 182], [1344, 136], [1232, 122], [1108, 134], [994, 176], [910, 240], [934, 264], [1010, 214], [1116, 176], [1232, 164], [1336, 178], [1416, 212], [1470, 266]],
        mix(rose, orange, 0.3),
        { layers: 16, alpha: 0.03, k: 0.1, spread: 0.02, blur: 6 },
      );
      p.drybrush(trail, { width: 48, color: rose, color2: orange, alpha: 0.4, taper: 0.9 });
      p.drybrush(trail.map(([x, y]) => [x + 8, y + 10]), { width: 20, color: mix(rose, violet, 0.3), alpha: 0.26, taper: 1.2, breakOn: 0.08 });

      /* lift-off smoke under the rocket: warm gray mixed from the primaries */
      p.wash(p.ellipse(1395, 815, 70, 34, 12, 0.3), gray, { layers: 14, alpha: 0.03, k: 0.4, blur: 7 });
      p.wash(p.ellipse(1500, 830, 80, 36, 12, 0.3), gray, { layers: 14, alpha: 0.028, k: 0.4, blur: 7 });
      p.wash(p.ellipse(1450, 855, 110, 30, 12, 0.3), mix(gray, rose, 0.3), { layers: 14, alpha: 0.025, k: 0.4, blur: 9 });
    },

    float(p) {
      p.splatter(1110, 110, rose, 7, 26, 7, 0.6);
      p.splatter(1265, 92, yellow, 6, 22, 6, 0.7);
      p.splatter(1585, 300, cerulean, 6, 20, 6, 0.55);
      p.splatter(985, 330, orange, 5, 18, 5, 0.55);
      p.splatter(1395, 150, rose, 4, 14, 4, 0.55);
    },

    fore(p) {
      /* ── laptop ─────────────────────────────── */
      /* colored shadow first: violet-rose, never black */
      p.wash(p.ellipse(1085, 752, 270, 26, 16, 0.1), shadowTint, { layers: 20, alpha: 0.05, k: 0.2, blur: 12 });
      /* lid */
      const lid = [[930, 430], [1230, 415], [1240, 640], [925, 655]];
      p.wash(lid, mix(gray, violet, 0.15), { layers: 16, alpha: 0.085, k: 0.035, depth: 3, spread: 0.006, rim: 0.3, rimW: 2.6 });
      /* screen: blue-gray, lighter toward the top-left where the light falls */
      const screen = [[948, 446], [1214, 433], [1222, 626], [944, 639]];
      p.wash(screen, mix(cerulean, gray, 0.55), {
        layers: 16, alpha: 0.075, k: 0.03, depth: 3, spread: 0.005,
        grad: { line: [948, 440, 1220, 640], stops: [[0, mix(cerulean, gray, 0.4), 0.45], [1, mix(ultra, gray, 0.5), 1.1]] },
      });
      /* faint lines of code glazed under the paint */
      [[470, 60, violet], [490, 92, ultra], [510, 74, viridian], [530, 52, violet], [550, 98, ultra], [570, 66, viridian], [590, 84, violet]].forEach(([y, w, c], i) => {
        const x0 = 966 + (i % 2) * 12;
        p.wash([[x0, y], [x0 + w, y - 1], [x0 + w, y + 6], [x0, y + 7]], c, { layers: 6, alpha: 0.09, k: 0.05, spread: 0.01 });
      });
      p.text("</>", 958, 466, 13, [255, 255, 255], 0.7, -2, "500 {s}px ui-monospace, Menlo, monospace");
      /* the splatters on the screen, with drips running off onto the deck */
      p.wash(p.ellipse(1040, 512, 52, 44, 16, 0.28), rose, { layers: 18, alpha: 0.09, k: 0.4, rim: 0.4, rimW: 2.4, blur: 0.6 });
      p.bloom(1032, 506, 22, rose, 0.3);
      p.wash([[1036, 548], [1046, 548], [1048, 610], [1047, 668], [1043, 676], [1038, 668], [1037, 610]], rose, { layers: 10, alpha: 0.1, k: 0.03, blur: 0.6 });
      p.wash(p.ellipse(1043, 676, 13, 6, 10, 0.2), rose, { layers: 8, alpha: 0.12, k: 0.3, rim: 0.4 });
      p.wash(p.ellipse(1146, 566, 44, 38, 16, 0.28), yellow, { layers: 18, alpha: 0.1, k: 0.4, rim: 0.35, rimShade: 0.8, blur: 0.6 });
      p.wash([[1142, 598], [1150, 598], [1151, 640], [1147, 646], [1143, 640]], yellow, { layers: 10, alpha: 0.12, k: 0.03, blur: 0.6 });
      p.wash(p.ellipse(1176, 470, 18, 15, 12, 0.3), cerulean, { layers: 12, alpha: 0.09, k: 0.4, rim: 0.3 });
      p.splatter(1080, 470, rose, 6, 30, 4, 0.6);
      p.splatter(1110, 600, yellow, 5, 24, 4, 0.6);
      /* bare-paper glare across the screen */
      p.lift([[962, 452], [1010, 449], [972, 560], [952, 566]], 0.35, 7);
      /* deck */
      const deck = [[925, 655], [1240, 640], [1300, 720], [860, 740]];
      p.wash(deck, mix(gray, yellow, 0.12), { layers: 14, alpha: 0.07, k: 0.03, depth: 3, spread: 0.006, rim: 0.22 });
      p.wash([[860, 740], [1300, 720], [1300, 733], [862, 753]], mix(gray, violet, 0.25), { layers: 12, alpha: 0.1, k: 0.03, spread: 0.004 });
      /* hinge shadow: a soft glaze, not a line */
      p.wash([[925, 650], [1240, 636], [1242, 648], [924, 662]], mix(gray, violet, 0.4), { layers: 8, alpha: 0.08, k: 0.03, blur: 1.4 });
      /* keys suggested by small glazes in perspective */
      for (let r = 0; r < 4; r++) {
        const t0 = 0.1 + r * 0.17, t1 = t0 + 0.12;
        const L0 = [925 + (860 - 925) * t0 + 22, 655 + (740 - 655) * t0], R0 = [1240 + (1300 - 1240) * t0 - 22, 640 + (720 - 640) * t0];
        const L1 = [925 + (860 - 925) * t1 + 22, 655 + (740 - 655) * t1], R1 = [1240 + (1300 - 1240) * t1 - 22, 640 + (720 - 640) * t1];
        if (r === 3) continue;
        for (let k = 0; k < 11; k++) {
          const a = k / 11 + 0.008, b = (k + 1) / 11 - 0.008;
          const q = (P0, P1, u) => [P0[0] + (P1[0] - P0[0]) * u, P0[1] + (P1[1] - P0[1]) * u];
          p.wash([q(L0, R0, a), q(L0, R0, b), q(L1, R1, b), q(L1, R1, a)], mix(gray, violet, 0.3), { layers: 3, alpha: 0.09, k: 0.04, spread: 0.01 });
        }
      }
      p.lift([[1030, 706], [1140, 701], [1146, 722], [1024, 727]], 0.4, 2);

      /* ── rocket paint tube, lifting off ─────── */
      /* drawn at 1×, then scaled 1.3× about its middle and tilted */
      const cx = 1490, tilt = -6, grow = 1.3, shift = -45;
      const R = (pts) => p.rotate(pts.map(([x, y]) => [cx + shift + (x - cx) * grow, 600 + (y - 600) * grow]), cx + shift, 600, tilt);
      const pt = (x, y) => R([[x, y]])[0];
      p.wash(p.ellipse(1455, 872, 84, 13, 12, 0.2), mix(orange, rose, 0.5), { layers: 14, alpha: 0.05, k: 0.25, blur: 10 });
      /* flame: orange melting into yellow, edges dissolving */
      p.wash(R([[1462, 708], [1518, 708], [1506, 760], [1490, 810], [1474, 760]]), orange, { layers: 18, alpha: 0.08, k: 0.18, blur: 3 });
      p.wash(R([[1474, 708], [1506, 708], [1498, 745], [1490, 776], [1482, 745]]), yellow, { layers: 14, alpha: 0.12, k: 0.16, blur: 2.5 });
      p.splatter(...pt(1478, 812), orange, 6, 18, 4.5, 0.55);
      /* fins */
      p.wash(R([[1456, 640], [1418, 716], [1460, 706]]), yellow, { layers: 14, alpha: 0.1, k: 0.05, rim: 0.3, rimColor: orange });
      p.wash(R([[1524, 640], [1562, 716], [1520, 706]]), mix(yellow, orange, 0.45), { layers: 14, alpha: 0.1, k: 0.05, rim: 0.3, rimColor: orange });
      /* body: rose, glazed darker on the shadow side, a bare-paper streak on the lit side */
      const body = R([[1458, 478], [1466, 468], [1514, 468], [1522, 478], [1528, 700], [1520, 710], [1460, 710], [1452, 700]]);
      p.wash(body, rose, { layers: 18, alpha: 0.085, k: 0.03, depth: 3, spread: 0.005, rim: 0.35, rimW: 2.6 });
      p.wash(R([[1500, 470], [1514, 468], [1522, 478], [1528, 700], [1520, 710], [1504, 710]]), mix(rose, violet, 0.45), { layers: 12, alpha: 0.07, k: 0.04, blur: 2 });
      p.lift(R([[1466, 486], [1474, 484], [1472, 690], [1464, 690]]), 0.55, 2.5);
      /* crimped end */
      p.wash(R([[1452, 700], [1528, 700], [1528, 712], [1452, 712]]), mix(rose, violet, 0.5), { layers: 8, alpha: 0.12, k: 0.03 });
      /* label band, lifted back to paper, with the pigment code */
      p.lift(R([[1456, 598], [1526, 596], [1527, 628], [1456, 630]]), 0.8, 1);
      p.wash(R([[1456, 598], [1526, 596], [1527, 628], [1456, 630]]), mix(yellow, [255, 255, 255], 0.6), { layers: 4, alpha: 0.12, k: 0.02 });
      p.text("PR122", ...pt(1466, 621), 19, [192, 18, 78], 0.75, tilt, "600 {s}px ui-monospace, Menlo, monospace");
      /* porthole */
      const ph = pt(1494, 540);
      p.wash(p.ellipse(ph[0], ph[1], 22, 22, 14, 0.06), mix(gray, violet, 0.2), { layers: 10, alpha: 0.12, k: 0.05 });
      p.wash(p.ellipse(ph[0], ph[1], 14, 14, 14, 0.06), cerulean, { layers: 12, alpha: 0.12, k: 0.08, rim: 0.3 });
      p.lift(p.ellipse(ph[0] - 5, ph[1] - 5, 5, 4, 8, 0.1), 0.8, 1);
      /* neck and the brush standing in it */
      p.wash(R([[1476, 448], [1504, 448], [1512, 470], [1468, 470]]), gray, { layers: 12, alpha: 0.1, k: 0.04, rim: 0.25 });
      p.wash(R([[1497, 440], [1505, 444], [1552, 344], [1545, 340]]), viridian, { layers: 14, alpha: 0.11, k: 0.03, spread: 0.004, rim: 0.3, rimColor: mix(viridian, ultra, 0.4) });
      p.lift(R([[1540, 352], [1543, 353], [1505, 432], [1502, 431]]), 0.5, 1);
      p.wash(R([[1492, 452], [1503, 458], [1509, 444], [1498, 438]]), mix(gray, yellow, 0.2), { layers: 8, alpha: 0.14, k: 0.03 });
      p.wash(R([[1488, 470], [1494, 452], [1503, 458], [1497, 476]]), rose, { layers: 10, alpha: 0.16, k: 0.08, blur: 0.8 });
      p.splatter(...pt(1552, 470), rose, 5, 22, 4, 0.6);

      /* ── three paint blobs resting in the foreground ── */
      [[1205, 815, 36, cerulean], [1282, 834, 31, rose], [1356, 812, 34, yellow]].forEach(([bx, by, r, c]) => {
        p.wash(p.ellipse(bx + 8, by + 14, r * 1.15, r * 0.4, 14, 0.15), mix(c, violet, 0.35), { layers: 12, alpha: 0.05, k: 0.25, blur: 6 });
        p.wash(p.ellipse(bx, by, r, r * 0.72, 18, 0.18), c, { layers: 20, alpha: 0.1, k: 0.3, rim: 0.42, rimW: 2.8 });
        p.wash(p.ellipse(bx + r * 0.25, by + r * 0.2, r * 0.55, r * 0.35, 14, 0.2), P.shade(c, 0.85), { layers: 8, alpha: 0.06, k: 0.3, blur: 2 });
        p.lift(p.ellipse(bx - r * 0.35, by - r * 0.25, r * 0.22, r * 0.12, 10, 0.2, -0.4), 0.75, 1.6);
        p.splatter(bx, by - r * 0.4, c, 5, r * 1.4, 4, 0.55);
      });
    },
  };
  /* far carries the paper itself (opaque) and is painted at quarter
     resolution; seeds are pinned so re-exports reproduce the same painting */
  const base = { w: W, h: H };
  window.Scene.define(
    "hero",
    {
      far: { ...base, out: 1280, q: 0.7, grain: [0.06, 0.1], down: 4, paper: "#fbf7ef", seed: 314, paint: layers.far },
      mid: { ...base, out: 1600, q: 0.78, grain: [0.12, 0.12], seed: 314, paint: layers.mid },
      float: { ...base, out: 1600, q: 0.8, seed: 516, paint: layers.float },
      fore: { ...base, out: 2000, q: 0.82, grain: [0.16, 0.1], seed: 415, paint: layers.fore },
    },
    /* sky only: the props are framed differently (first screen, not the
       whole hero), so a flattened copy would show misaligned while loading */
    { fallback: { layers: ["far", "mid"], w: 960 } },
  );
})();
