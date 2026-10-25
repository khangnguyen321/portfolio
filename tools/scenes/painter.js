/* ═══ PAINTER — offline watercolor engine for the scene artwork ═══
   Paints in a fixed design space (W×H units) onto a canvas of any scale, so
   the same scene exports at any resolution. No outlines anywhere: shapes are
   built from stacked translucent washes (deformed polygons, Tyler Hobbs
   style), pigment pooling on part of the rim (lost-and-found edges), lifted
   bare-paper highlights, wet-on-wet blooms, granulation and paper tooth.
   Deterministic per seed. Used by the scene pages in this folder. */
(function () {
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
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(4)})`;
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const shade = (c, f) => c.map((v) => Math.round(v * f));

  class Painter {
    constructor(canvas, scale, seed) {
      this.canvas = canvas;
      this.x = canvas.getContext("2d");
      this.s = scale;
      this.r = mulberry32(seed * 7919 + 17);
      this.patterns = {};
    }
    rand(a = 0, b = 1) {
      return a + this.r() * (b - a);
    }
    gauss() {
      let u = 0;
      while (u === 0) u = this.r();
      const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * this.r());
      return Math.max(-2.2, Math.min(2.2, g));
    }

    /* ── geometry ── */
    prep(pts, v = 1) {
      return pts.map(([x, y]) => ({ x, y, v: v * (0.35 + this.r() * 0.65) }));
    }
    deform(pts, depth, k) {
      for (let d = 0; d < depth; d++) {
        const out = [];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i];
          const b = pts[(i + 1) % pts.length];
          out.push(a);
          const len = Math.hypot(b.x - a.x, b.y - a.y);
          const v = (a.v + b.v) / 2;
          out.push({
            x: (a.x + b.x) / 2 + this.gauss() * len * v * k,
            y: (a.y + b.y) / 2 + this.gauss() * len * v * k,
            v: v * (0.82 + this.r() * 0.3),
          });
        }
        pts = out;
      }
      return pts;
    }
    ellipse(cx, cy, rx, ry, n = 14, jit = 0.12, rot = 0) {
      const pts = [];
      for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2;
        const r = 1 + (this.r() - 0.5) * jit * 2;
        const ex = Math.cos(t) * rx * r;
        const ey = Math.sin(t) * ry * r;
        pts.push([cx + ex * Math.cos(rot) - ey * Math.sin(rot), cy + ex * Math.sin(rot) + ey * Math.cos(rot)]);
      }
      return pts;
    }
    rotate(pts, cx, cy, deg) {
      const a = (deg * Math.PI) / 180;
      return pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
    }
    bbox(pts) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      pts.forEach((p) => {
        const x = p.x ?? p[0], y = p.y ?? p[1];
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      });
      return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
    }
    trace(pts) {
      const x = this.x;
      x.beginPath();
      x.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) x.lineTo(pts[i].x, pts[i].y);
      x.closePath();
    }
    fill(color, a, grad) {
      if (!grad) return rgba(color, a);
      const g = this.x.createLinearGradient(...grad.line);
      grad.stops.forEach(([t, c, m = 1]) => g.addColorStop(t, rgba(c, a * m)));
      return g;
    }

    /* ── the core wash: many translucent, slightly different layers ── */
    wash(pts, color, o = {}) {
      const x = this.x, s = this.s;
      const layers = o.layers ?? 20;
      const a = o.alpha ?? 0.06;
      const k = o.k ?? 0.3;
      const spread = o.spread ?? 0.04;
      const base = this.deform(this.prep(pts, o.v ?? 1), o.depth ?? 3, k);
      const bb = this.bbox(base);
      const R = Math.min(bb.w, bb.h) / 2;
      x.save();
      x.globalCompositeOperation = o.comp || "source-over";
      if (o.blur) x.filter = `blur(${(o.blur * s).toFixed(2)}px)`;
      x.fillStyle = this.fill(color, a, o.grad);
      for (let l = 0; l < layers; l++) {
        const poly = this.deform(base, o.layerDepth ?? 2, k * 0.55);
        const sc = 1 + this.gauss() * spread;
        const ox = this.gauss() * R * spread * 0.5;
        const oy = this.gauss() * R * spread * 0.5;
        x.setTransform(s * sc, 0, 0, s * sc, s * (bb.cx - bb.cx * sc + ox), s * (bb.cy - bb.cy * sc + oy));
        this.trace(poly);
        x.fill();
      }
      x.setTransform(s, 0, 0, s, 0, 0);
      /* pigment pools along parts of the rim only — edges are found in some
         places, lost in others */
      if (o.rim) {
        x.filter = `blur(${((o.rimBlur ?? 1.2) * s).toFixed(2)}px)`;
        x.strokeStyle = rgba(shade(o.rimColor || color, o.rimShade ?? 0.72), o.rim);
        x.lineWidth = o.rimW ?? 2.4;
        x.lineJoin = "round";
        x.setLineDash([this.rand(40, 120), this.rand(20, 90)]);
        x.lineDashOffset = this.rand(0, 200);
        this.trace(this.deform(base, 1, k * 0.4));
        x.stroke();
      }
      x.restore();
      return base;
    }
    /* lift pigment back to bare paper (highlights, label bands) */
    lift(pts, strength = 0.6, blur = 2, k = 0.08) {
      const x = this.x, s = this.s;
      const base = this.deform(this.prep(pts), 3, k);
      x.save();
      x.setTransform(s, 0, 0, s, 0, 0);
      x.globalCompositeOperation = "destination-out";
      x.filter = `blur(${(blur * s).toFixed(2)}px)`;
      x.fillStyle = `rgba(0,0,0,${strength})`;
      this.trace(base);
      x.fill();
      x.restore();
    }
    /* backrun: water pushed into a drying wash — pale centre, darker cauliflower rim */
    bloom(cx, cy, r, color, strength = 0.35) {
      const pts = this.ellipse(cx, cy, r, r * this.rand(0.8, 1.1), 18, 0.25);
      this.lift(pts, strength, r * 0.12, 0.35);
      this.wash(pts, color, { layers: 1, alpha: 0, k: 0.35, rim: 0.14, rimW: Math.max(4, r * 0.08), rimBlur: Math.max(2.5, r * 0.04) });
    }
    splatter(cx, cy, color, n = 12, spread = 60, size = 6, alpha = 0.55) {
      const x = this.x, s = this.s;
      x.save();
      x.setTransform(s, 0, 0, s, 0, 0);
      x.filter = `blur(${(0.5 * s).toFixed(2)}px)`;
      for (let i = 0; i < n; i++) {
        const ang = this.rand(0, Math.PI * 2);
        const d = Math.abs(this.gauss()) * spread;
        const r = size * Math.pow(this.rand(0.25, 1), 2);
        const px = cx + Math.cos(ang) * d;
        const py = cy + Math.sin(ang) * d;
        x.fillStyle = rgba(color, alpha * this.rand(0.6, 1));
        x.beginPath();
        x.ellipse(px, py, r * this.rand(1, 1.8), r, ang, 0, Math.PI * 2);
        x.fill();
        if (r > size * 0.5) {
          x.fillStyle = rgba(shade(color, 0.75), alpha * 0.5);
          x.beginPath();
          x.ellipse(px, py, r * 0.9, r * 0.7, ang, 0, Math.PI * 2);
          x.lineWidth = 0.8;
          x.strokeStyle = rgba(shade(color, 0.7), alpha * 0.5);
          x.stroke();
        }
      }
      x.restore();
    }
    /* dry brush: separate bristle tracks that skip across the paper tooth */
    drybrush(path, o = {}) {
      const x = this.x, s = this.s;
      const w = o.width ?? 30;
      const pts = [];
      for (let i = 0; i < path.length - 1; i++) {
        const [ax, ay] = path[i], [bx, by] = path[i + 1];
        const n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) / 4));
        for (let j = 0; j < n; j++) pts.push([ax + ((bx - ax) * j) / n, ay + ((by - ay) * j) / n]);
      }
      pts.push(path[path.length - 1]);
      const bristles = Math.round(w / 1.8);
      x.save();
      x.setTransform(s, 0, 0, s, 0, 0);
      x.lineCap = "round";
      x.filter = `blur(${(0.45 * s).toFixed(2)}px)`;
      for (let b = 0; b < bristles; b++) {
        const lane = b / (bristles - 1) - 0.5;
        let on = this.r() > 0.2;
        const lw = this.rand(1, 2.6);
        x.lineWidth = lw;
        for (let i = 1; i < pts.length; i++) {
          const t = i / pts.length;
          if (on && this.r() < (o.breakOn ?? 0.05) + t * 0.08) on = false;
          else if (!on && this.r() < 0.22 - t * 0.12) on = true;
          if (!on) continue;
          const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
          const len = Math.hypot(bx - ax, by - ay) || 1;
          const nx = -(by - ay) / len, ny = (bx - ax) / len;
          const taper = Math.pow(1 - t, o.taper ?? 0.7) * 0.9 + 0.1;
          const off = lane * w * taper;
          const c = o.color2 ? mix(o.color, o.color2, t) : o.color;
          x.strokeStyle = rgba(c, (o.alpha ?? 0.3) * this.rand(0.55, 1));
          x.beginPath();
          x.moveTo(ax + nx * off, ay + ny * off);
          x.lineTo(bx + nx * off, by + ny * off);
          x.stroke();
        }
      }
      x.restore();
    }
    text(str, px, py, size, color, alpha = 0.8, rot = 0, font = "600 {s}px Georgia, serif") {
      const x = this.x, s = this.s;
      x.save();
      x.setTransform(s, 0, 0, s, 0, 0);
      x.translate(px, py);
      x.rotate((rot * Math.PI) / 180);
      x.filter = `blur(${(0.35 * s).toFixed(2)}px)`;
      x.font = font.replace("{s}", size);
      x.fillStyle = rgba(color, alpha);
      x.fillText(str, 0, 0);
      x.restore();
    }

    /* ── surface passes ── */
    noise(name, size, build) {
      if (!this.patterns[name]) {
        const c = document.createElement("canvas");
        c.width = c.height = size;
        build(c.getContext("2d"), size);
        this.patterns[name] = c;
      }
      return this.x.createPattern(this.patterns[name], "repeat");
    }
    /* pigment settles into the paper: dark specks where paint is, pale tooth */
    granulate(dark = 0.16, tooth = 0.14) {
      const x = this.x;
      const W = this.canvas.width, H = this.canvas.height;
      const speck = this.noise("speck", 180, (g, n) => {
        const img = g.createImageData(n, n);
        for (let i = 0; i < img.data.length; i += 4) {
          const v = Math.random();
          img.data[i] = 40; img.data[i + 1] = 30; img.data[i + 2] = 60;
          img.data[i + 3] = v > 0.6 ? Math.pow(v, 4) * 255 : 0;
        }
        g.putImageData(img, 0, 0);
      });
      /* paper tooth is generated at full size — a repeating tile shows up as
         a visible grid in flat, pale washes */
      /* …and at full resolution: upscaled noise becomes an even dot grid */
      const small = document.createElement("canvas");
      small.width = W;
      small.height = H;
      const sg = small.getContext("2d");
      const img = sg.createImageData(W, H);
      for (let i = 0; i < img.data.length; i += 4) img.data[i + 3] = this.r() > 0.62 ? this.r() * 255 : 0;
      sg.putImageData(img, 0, 0);
      x.save();
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.globalCompositeOperation = "source-atop";
      x.globalAlpha = dark;
      x.fillStyle = speck;
      x.fillRect(0, 0, W, H);
      x.globalCompositeOperation = "destination-out";
      x.globalAlpha = tooth;
      x.filter = "blur(1.2px)";
      x.imageSmoothingEnabled = true;
      x.drawImage(small, 0, 0, W, H);
      x.restore();
    }
  }

  /* ── scene registry: each scene file defines its layers; this paints and
     exports them. A layer spec: { w, h (design units), out (px width),
     q (webp quality), grain: [dark, tooth], down (paint at 1/n res and
     upscale — for big soft washes), paper (opaque base colour), seed,
     feather: {cx, cy, rx, ry, inner} (soft elliptical fade to transparent,
     0–1 units), paint(p) } ── */
  const scenes = {};
  const hash = (s) => [...s].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7) % 100000;
  function feather(c, f) {
    const g = c.getContext("2d");
    g.save();
    g.globalCompositeOperation = "destination-in";
    g.setTransform(f.rx * c.width, 0, 0, f.ry * c.height, f.cx * c.width, f.cy * c.height);
    const grad = g.createRadialGradient(0, 0, f.inner ?? 0.6, 0, 0, 1);
    grad.addColorStop(0, "rgba(0,0,0,1)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(-10, -10, 20, 20);
    g.restore();
    /* …and every side dissolves to nothing, whatever the oval reached */
    const e = f.edge ?? 0.14;
    [[0, 0, c.width, 0], [0, 0, 0, c.height]].forEach(([x0, y0, x1, y1]) => {
      const lin = g.createLinearGradient(x0, y0, x1, y1);
      lin.addColorStop(0, "rgba(0,0,0,0)");
      lin.addColorStop(e, "rgba(0,0,0,1)");
      lin.addColorStop(1 - e, "rgba(0,0,0,1)");
      lin.addColorStop(1, "rgba(0,0,0,0)");
      g.save();
      g.globalCompositeOperation = "destination-in";
      g.fillStyle = lin;
      g.fillRect(0, 0, c.width, c.height);
      g.restore();
    });
  }
  window.Scene = {
    define(name, layers, opts = {}) {
      scenes[name] = { layers, opts };
    },
    layers: (name) => Object.keys(scenes[name].layers),
    spec: (name, layer) => scenes[name].layers[layer],
    paint(name, layer, outW) {
      const L = scenes[name].layers[layer];
      const c = document.createElement("canvas");
      c.width = Math.round(outW || L.out || L.w);
      c.height = Math.round((c.width * L.h) / L.w);
      const seed = L.seed ?? hash(`${name}:${layer}`);
      const down = L.down || 1;
      if (down > 1) {
        const lo = document.createElement("canvas");
        lo.width = Math.round(c.width / down);
        lo.height = Math.round(c.height / down);
        L.paint(new Painter(lo, lo.width / L.w, seed));
        const g = c.getContext("2d");
        g.imageSmoothingEnabled = true;
        g.imageSmoothingQuality = "high";
        g.drawImage(lo, 0, 0, c.width, c.height);
      } else {
        L.paint(new Painter(c, c.width / L.w, seed));
      }
      if (L.grain) new Painter(c, c.width / L.w, seed + 1).granulate(...L.grain);
      if (L.feather) feather(c, L.feather);
      if (L.paper) {
        const g = c.getContext("2d");
        g.globalCompositeOperation = "destination-over";
        g.fillStyle = L.paper;
        g.fillRect(0, 0, c.width, c.height);
      }
      return c;
    },
    export(name) {
      const S = scenes[name];
      const out = {};
      Object.keys(S.layers).forEach((l) => {
        out[l] = this.paint(name, l).toDataURL("image/webp", S.layers[l].q ?? 0.8);
      });
      /* fallback: the named layers flattened onto paper, small */
      const fb = S.opts.fallback;
      if (fb) {
        const first = S.layers[fb.layers[0]];
        const c = document.createElement("canvas");
        c.width = fb.w;
        c.height = Math.round((fb.w * first.h) / first.w);
        const g = c.getContext("2d");
        g.fillStyle = "#fbf7ef";
        g.fillRect(0, 0, c.width, c.height);
        fb.layers.forEach((l) => g.drawImage(this.paint(name, l, fb.w), 0, 0, c.width, c.height));
        out.fallback = c.toDataURL("image/webp", 0.72);
      }
      return out;
    },
  };

  window.Painter = Painter;
  window.Pig = {
    rose: [255, 61, 127],
    yellow: [255, 193, 46],
    cerulean: [32, 168, 242],
    ultra: [64, 73, 240],
    violet: [154, 75, 255],
    viridian: [16, 184, 158],
    orange: [255, 106, 43],
    /* warm gray mixed from the three primaries */
    gray: [142, 128, 150],
    mix,
    shade,
  };
})();
