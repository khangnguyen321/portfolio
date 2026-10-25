/* ═══ WATERCOLOR — procedural 2D wash painter ═══
   Every .wash element on the page is painted once onto its own canvas, using
   layered polygon deformation: a seeded base shape is recursively deformed,
   then ~40 further-deformed copies are stacked at a few percent opacity each.
   That stacking gives soft bleeding edges; a faint stroke per layer gives the
   darker rim pigment leaves when it dries; a destination-out noise pass gives
   granulation; an off-centre lift gives the lighter "backrun" bloom.
   Canvases blend with mix-blend-mode: multiply (style.css), so overlapping
   washes mix subtractively — rose over yellow reads orange, like real paint.
   Exposed as window.Watercolor.paint(el). Deterministic per data-seed. */
(function () {
  const MAX_PX = 520; /* internal canvas cap — washes are soft, CSS upscales cleanly */

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* clamped normal: rare far outliers otherwise shoot thin spikes off the rim */
  function gaussFrom(rand) {
    return function () {
      let u = 0;
      while (u === 0) u = rand();
      const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
      return Math.max(-2.2, Math.min(2.2, g));
    };
  }

  /* midpoint displacement: each edge gains a jittered midpoint whose spread
     scales with edge length and the edge's own variance, so some sides stay
     calm while others fray — the irregularity that reads as hand-made */
  function deform(pts, depth, k, rand, gauss) {
    for (let d = 0; d < depth; d++) {
      const out = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        out.push(a);
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        const v = (a.v + b.v) / 2;
        out.push({
          x: (a.x + b.x) / 2 + gauss() * len * v * k,
          y: (a.y + b.y) / 2 + gauss() * len * v * k,
          v: v * (0.82 + rand() * 0.3),
        });
      }
      pts = out;
    }
    return pts;
  }

  function trace(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
  }

  let grain = null;
  function grainPattern(ctx) {
    if (!grain) {
      grain = document.createElement("canvas");
      grain.width = grain.height = 160;
      const g = grain.getContext("2d");
      const img = g.createImageData(160, 160);
      for (let i = 0; i < img.data.length; i += 4) {
        const n = Math.random();
        img.data[i + 3] = n > 0.55 ? Math.pow(n, 3) * 255 : 0;
      }
      g.putImageData(img, 0, 0);
    }
    return ctx.createPattern(grain, "repeat");
  }

  function hexToRgb(hex) {
    const h = hex.trim().replace("#", "");
    const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  const rootStyle = getComputedStyle(document.documentElement);
  const cache = {};
  function pigment(name) {
    if (!cache[name]) {
      const v = rootStyle.getPropertyValue("--" + name);
      cache[name] = v ? hexToRgb(v) : [120, 120, 140];
    }
    return cache[name];
  }

  function paint(el) {
    if (el.dataset.painted) return;
    const rect = el.getBoundingClientRect();
    const cssW = rect.width || el.offsetWidth;
    const cssH = rect.height || el.offsetHeight;
    if (!cssW || !cssH) return;
    el.dataset.painted = "1";

    const scale = Math.min(1, MAX_PX / Math.max(cssW, cssH)) * Math.min(window.devicePixelRatio || 1, 1.5);
    const W = Math.max(8, Math.round(cssW * scale));
    const H = Math.max(8, Math.round(cssH * scale));
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const seed = parseInt(el.dataset.seed || "1", 10);
    const rand = mulberry32(seed * 9973);
    const gauss = gaussFrom(rand);
    const layers = parseInt(el.dataset.layers || "44", 10);
    const c1 = pigment(el.dataset.pig || "rose");
    const c2 = el.dataset.pig2 ? pigment(el.dataset.pig2) : null;
    const elongated = parseFloat(el.dataset.aspect || "1") > 1.6;
    const calm = el.dataset.calm ? parseFloat(el.dataset.calm) : 1;

    /* base shape: an irregular ellipse with enough margin that no layer
       ever reaches the canvas edge (a clipped wash shows a straight cut) */
    const cx = W / 2;
    const cy = H / 2;
    const rx = W * (el.dataset.rx ? parseFloat(el.dataset.rx) : elongated ? 0.37 : 0.25);
    const ry = H * (elongated ? 0.22 : 0.25);
    const n = elongated ? 18 : 9 + Math.floor(rand() * 4);
    let base = [];
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.4;
      const r = 0.82 + rand() * 0.3;
      base.push({ x: cx + Math.cos(t) * rx * r, y: cy + Math.sin(t) * ry * r, v: 0.25 + rand() * 0.75 });
    }
    base = deform(base, 3, 0.38 * calm, rand, gauss);

    let fill;
    const alpha = parseFloat(el.dataset.alpha || "0.06");
    if (c2) {
      /* wet-in-wet: two pigments run into each other along a random axis;
         elongated strokes always run left → right */
      const ang = elongated ? 0 : rand() * Math.PI * 2;
      const dx = Math.cos(ang) * W * 0.4;
      const dy = Math.sin(ang) * H * 0.4;
      fill = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
      fill.addColorStop(0.1, `rgba(${c1},${alpha})`);
      fill.addColorStop(0.9, `rgba(${c2},${alpha})`);
    } else fill = `rgba(${c1},${alpha})`;
    const rimC = c2 ? c1.map((v, i) => Math.round((v + c2[i]) / 2)) : c1;
    ctx.fillStyle = fill;
    ctx.strokeStyle = `rgba(${rimC.map((v) => Math.round(v * 0.72))},0.04)`;
    ctx.lineWidth = Math.max(1, W / 260);
    ctx.lineJoin = "round";

    /* three batches, each from a re-deformed base: wider shape variance
       between batches, finer variance within — Hobbs' layered wash */
    const perBatch = Math.ceil(layers / 3);
    const R = Math.min(rx, ry);
    for (let b = 0; b < 3; b++) {
      const batchBase = deform(base, 1, 0.3 * calm, rand, gauss);
      for (let l = 0; l < perBatch; l++) {
        const poly = deform(batchBase, 3, 0.36 * calm, rand, gauss);
        /* each layer spreads a little more or less, and drifts: overlapping
           layers thin out toward the rim — the feathered, wet edge */
        const s = 0.86 + rand() * 0.2;
        const ox = cx + gauss() * R * 0.03;
        const oy = cy + gauss() * R * 0.03;
        ctx.setTransform(s, 0, 0, s, ox - cx * s, oy - cy * s);
        trace(ctx, poly);
        ctx.fill();
        if (l % 3 === 0) ctx.stroke();
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    /* backrun: lift pigment off-centre, as water pushes it to the rim */
    ctx.globalCompositeOperation = "destination-out";
    const lx = cx + (rand() - 0.5) * rx * 0.7;
    const ly = cy + (rand() - 0.5) * ry * 0.7;
    const lr = Math.min(rx, ry) * (0.55 + rand() * 0.4);
    const lift = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
    lift.addColorStop(0, "rgba(0,0,0,0.2)");
    lift.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = lift;
    ctx.fillRect(0, 0, W, H);

    /* granulation: pigment settling into the paper tooth */
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = grainPattern(ctx);
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    canvas.className = "wash-canvas";
    el.appendChild(canvas);
    el.classList.add("painted");
  }

  /* a painted stroke as an image URL — used for highlighter marks behind text */
  function strokeURL(pig, seed, w, h) {
    const tmp = document.createElement("div");
    tmp.dataset.pig = pig;
    tmp.dataset.seed = String(seed);
    tmp.dataset.aspect = String(w / h);
    tmp.dataset.layers = "30";
    tmp.dataset.alpha = "0.07";
    tmp.dataset.calm = "0.45";
    tmp.dataset.rx = "0.44"; /* run nearly edge to edge under the phrase */
    tmp.style.cssText = `position:absolute;left:-9999px;top:0;width:${w}px;height:${h}px`;
    document.body.appendChild(tmp);
    paint(tmp);
    const c = tmp.querySelector("canvas");
    const url = c ? c.toDataURL("image/png") : "";
    tmp.remove();
    return url;
  }

  window.Watercolor = { paint, strokeURL };
})();
