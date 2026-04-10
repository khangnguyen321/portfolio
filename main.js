'use strict';
/* ═════════════════════════════════════════════════════
   FLOW CANVAS — Circuit board (left) + Code rain (right)
═════════════════════════════════════════════════════ */
const bgCanvas = document.getElementById('flow-canvas');
const bgCtx = bgCanvas.getContext('2d');
let W, H, bgFrame = 0;

function resizeBg() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  bgCanvas.width  = W * dpr; bgCanvas.height = H * dpr;
  bgCanvas.style.width  = W + 'px'; bgCanvas.style.height = H + 'px';
  bgCtx.scale(dpr, dpr);
  initCircuits(); initCodeRain();
}

const NODES = [], CONNS = [];
function initCircuits() {
  NODES.length = 0; CONNS.length = 0;
  const hw = W * 0.5;
  for (let i = 0; i < 30; i++) {
    NODES.push({ x: 20 + Math.random() * (hw - 40), y: 20 + Math.random() * (H - 40), r: 1.5 + Math.random() * 2.5, pulse: Math.random(), speed: 0.003 + Math.random() * 0.005, alpha: 0 });
  }
  for (let i = 0; i < NODES.length; i++) {
    for (let j = i + 1; j < NODES.length; j++) {
      const dx = NODES[i].x - NODES[j].x, dy = NODES[i].y - NODES[j].y;
      if (Math.sqrt(dx*dx+dy*dy) < 170) CONNS.push({ a:i, b:j, alpha:0, progress:0 });
    }
  }
  NODES.forEach((n, i) => anime({ targets: n, alpha: [0, 0.8], duration: 600 + Math.random()*800, delay: i * 55, easing: 'easeOutExpo', update:()=>{} }));
  CONNS.forEach((c, i) => anime({ targets: c, progress: [0,1], alpha:[0,0.35], duration:900, delay: 400+i*22, easing:'easeInOutSine', update:()=>{} }));
}

const PKTS = [];
function spawnPacket() {
  if (!CONNS.length) return;
  const c = CONNS[Math.floor(Math.random()*CONNS.length)];
  PKTS.push({ conn:c, t:0, speed:0.007+Math.random()*0.013 });
}
setInterval(spawnPacket, 320);

const CODE_CHARS = '01アイウエオカキクケコ</>{}[]()=>;#function()const let var';
const COLS = [];
function initCodeRain() {
  COLS.length = 0;
  const hw = W * 0.5;
  const colW = 18;
  const num = Math.floor((W - hw) / colW);
  for (let i = 0; i < num; i++) {
    COLS.push({ x: hw + i*colW + 9, y: -Math.random()*H, speed: 0.7+Math.random()*1.5,
      chars: Array.from({length:22}, ()=>CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)]),
      mutate: 0, alpha: 0.08+Math.random()*0.2, fz: 10+Math.floor(Math.random()*4) });
  }
}

let divP = 0;
anime({ targets:{v:0}, v:1, duration:2200, loop:true, direction:'alternate', easing:'easeInOutSine',
  update(a) { divP = a.animations[0].currentValue; }});

function bgLoop() {
  bgCtx.fillStyle = 'rgba(5,8,20,0.88)';
  bgCtx.fillRect(0, 0, W, H);

  const hw = W * 0.5;

  // — Grid dots (left) —
  bgCtx.fillStyle = 'rgba(26,110,255,0.05)';
  for (let gx = 0; gx < hw; gx += 38) {
    for (let gy = 0; gy < H; gy += 38) {
      bgCtx.beginPath(); bgCtx.arc(gx, gy, 1, 0, Math.PI*2); bgCtx.fill();
    }
  }

  // — Connection wires —
  CONNS.forEach(c => {
    const A = NODES[c.a], B = NODES[c.b];
    const ex = A.x + (B.x-A.x)*c.progress, ey = A.y + (B.y-A.y)*c.progress;
    bgCtx.beginPath(); bgCtx.moveTo(A.x, A.y); bgCtx.lineTo(ex, ey);
    bgCtx.strokeStyle = `rgba(26,110,255,${c.alpha * 0.7})`; bgCtx.lineWidth = 0.5; bgCtx.stroke();
  });

  // — Data packets —
  PKTS.forEach((p, i) => {
    p.t += p.speed;
    const A = NODES[p.conn.a], B = NODES[p.conn.b];
    const x = A.x + (B.x-A.x)*p.t, y = A.y + (B.y-A.y)*p.t;
    bgCtx.beginPath(); bgCtx.arc(x, y, 2.5, 0, Math.PI*2);
    bgCtx.fillStyle = 'rgba(232,255,71,0.8)'; bgCtx.fill();
    if (p.t >= 1) PKTS.splice(i, 1);
  });

  // — Circuit nodes —
  NODES.forEach(n => {
    n.pulse += n.speed;
    const glow = 0.4 + 0.5 * Math.sin(n.pulse * Math.PI * 2);
    bgCtx.beginPath(); bgCtx.arc(n.x, n.y, n.r, 0, Math.PI*2);
    bgCtx.fillStyle = `rgba(26,110,255,${n.alpha * glow})`; bgCtx.fill();
  });

  // — Center divider —
  const grad = bgCtx.createLinearGradient(hw-1, 0, hw+1, H);
  grad.addColorStop(0, `rgba(26,110,255,${0.06+divP*0.08})`);
  grad.addColorStop(0.5, `rgba(232,255,71,${0.15+divP*0.12})`);
  grad.addColorStop(1, `rgba(255,77,26,${0.06+divP*0.08})`);
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(hw - 0.5, 0, 1, H);

  // — Code rain (right) —
  COLS.forEach(col => {
    col.y += col.speed;
    col.mutate++;
    if (col.mutate > 12) {
      col.chars[Math.floor(Math.random()*col.chars.length)] = CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)];
      col.mutate = 0;
    }
    if (col.y > H + col.chars.length * col.fz) col.y = -col.chars.length * col.fz;

    bgCtx.font = `${col.fz}px 'DM Mono', monospace`;
    col.chars.forEach((ch, ci) => {
      const cy = col.y + ci * col.fz;
      if (cy < -col.fz || cy > H + col.fz) return;
      const bright = ci === col.chars.length - 1;
      bgCtx.fillStyle = bright
        ? `rgba(232,255,71,${col.alpha * 3.5})`
        : ci > col.chars.length - 4
          ? `rgba(26,110,255,${col.alpha * 1.8})`
          : `rgba(26,110,255,${col.alpha * 0.6})`;
      bgCtx.fillText(ch, col.x, cy);
    });
  });

  bgFrame++;
  requestAnimationFrame(bgLoop);
}

resizeBg();
bgLoop();
window.addEventListener('resize', resizeBg);

/* ═════════════════════════════════════════════════════
   CURSOR TRACKING
═════════════════════════════════════════════════════ */
const cur = document.getElementById('cursor');
const curR = document.getElementById('cursor-ring');
let curX = 0, curY = 0, ringX = 0, ringY = 0;

document.addEventListener('mousemove', e => { curX = e.clientX; curY = e.clientY; });

(function cursorLoop() {
  ringX += (curX - ringX) * 0.12;
  ringY += (curY - ringY) * 0.12;
  if (cur) { cur.style.left = curX + 'px'; cur.style.top = curY + 'px'; }
  if (curR) { curR.style.left = ringX + 'px'; curR.style.top = ringY + 'px'; }
  requestAnimationFrame(cursorLoop);
})();

/* ═════════════════════════════════════════════════════
   INTRO ANIMATION SEQUENCE
═════════════════════════════════════════════════════ */
const intro = document.getElementById('intro');
const fill  = document.getElementById('intro-fill');
const num   = document.getElementById('intro-num');

let threeCtrl = null;

anime.timeline({ easing: 'easeOutExpo' })
  .add({ targets: '#intro-mark', opacity: [0,1], scale: [0.8,1], duration: 900 })
  .add({ targets: '#intro-wordmark', opacity: [0,1], letterSpacing: ['0.2em','0.55em'], duration: 900 }, '-=400')
  .add({ targets: '.intro-progress-track', opacity: [0,1], duration: 500 }, '-=200')
  .add({ targets: '#intro-num', opacity: [0,1], duration: 500 }, '-=300')
  .add({ targets: { pct: 0 }, pct: 100, duration: 1800, easing: 'easeInOutQuad',
    update(a) {
      const v = Math.round(a.animations[0].currentValue);
      if (fill) fill.style.width = v + '%';
      if (num) num.textContent = String(v).padStart(3,'0') + '%';
    }
  }, '-=100')
  .add({ targets: '#enter-btn', opacity: [0,1], translateY: [16,0], duration: 700 }, '-=100');

// Scan beams
anime({ targets:'#beam1', top:['0%','100%'], opacity:[0.6,0], duration:2800, loop:true, easing:'easeInOutSine', delay:400 });
anime({ targets:'#beam2', top:['100%','0%'], opacity:[0.4,0], duration:2200, loop:true, easing:'easeInOutSine', delay:900 });

function enterSite() {
  anime({
    targets: intro,
    opacity: [1, 0],
    scale: [1, 0.98],
    duration: 900,
    easing: 'easeInExpo',
    complete() { intro.style.display = 'none'; }
  });
  anime({ targets: '#main', opacity: [0,1], duration: 1000, delay: 400, easing: 'easeOutExpo',
    begin() { document.getElementById('main').classList.add('visible'); }
  });
  anime({ targets: '#sidenav', opacity: [0,1], translateX: [20,0], duration: 800, delay: 700 });
  anime({ targets: '#loc',     opacity: [0,1], duration: 800, delay: 900 });
  anime({ targets: '#mob-nav', opacity: [0,1], translateY: [10,0], duration: 600, delay: 800,
    begin() { document.getElementById('mob-nav').classList.add('visible'); }
  });

  // HERO text reveal
  anime({ targets: '.hero-eyebrow',   opacity:[0,1], letterSpacing:['0.2em','0.55em'], duration:900, delay:600, easing:'easeOutExpo' });
  anime({ targets: '#hero-monogram',  opacity:[0,1], scale:[0.7,1], rotate:['-10deg','0deg'], duration:1200, delay:700, easing:'easeOutBack' });
  anime({ targets: '.hero-name-wrap', opacity:[0,1], duration:900, delay:900, easing:'easeOutExpo' });
  anime({ targets: '.hero-first',     translateY:['40px','0px'], duration:1100, delay:950, easing:'easeOutExpo' });
  anime({ targets: '.hero-last',      translateY:['30px','0px'], duration:1000, delay:1050, easing:'easeOutExpo' });
  anime({ targets: '.hero-rule',      opacity:[0,1], scaleX:[0,1], duration:800, delay:1200, easing:'easeOutExpo' });
  anime({ targets: '.hero-tagline',   opacity:[0,1], translateY:[16,0], duration:900, delay:1300, easing:'easeOutExpo' });
  anime({ targets: '.hero-pills',     opacity:[0,1], translateY:[12,0], duration:800, delay:1500, easing:'easeOutExpo' });
  anime({ targets: '.hero-scroll-hint', opacity:[0,0.6], translateY:[8,0], duration:800, delay:1800, easing:'easeOutExpo' });

  // Init THREE.js hero
  threeCtrl = initThreeJS();
}

/* ═════════════════════════════════════════════════════
   SCROLL SNAP NAVIGATION & ACTIVE STATES
═════════════════════════════════════════════════════ */
const SECTIONS = ['hero','about','experience','skills','education','contact'];
const isMobile = () => window.innerWidth <= 1024;

function navTo(id) {
  if (isMobile()) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior:'smooth' });
  } else {
    const scroller = document.getElementById('scroller');
    const el = document.getElementById(id);
    if (scroller && el) scroller.scrollTop = el.offsetTop;
  }
}

function setActive(id) {
  document.querySelectorAll('.sn-item, .mn-item').forEach(el => {
    el.classList.toggle('active', el.dataset.s === id);
  });

  // Show/hide THREE.js based on section
  const threeCanvas = document.getElementById('three-canvas');
  if (threeCanvas) {
    threeCanvas.classList.toggle('hidden', id !== 'hero');
  }
}

// Progress bar + active section
const scroller = document.getElementById('scroller');
if (scroller) {
  scroller.addEventListener('scroll', () => {
    const total = scroller.scrollHeight - scroller.clientHeight;
    const pct = total > 0 ? (scroller.scrollTop / total) * 100 : 0;
    const pb = document.getElementById('progress');
    if (pb) pb.style.width = pct + '%';

    // Determine active section
    const scrollY = scroller.scrollTop;
    let current = SECTIONS[0];
    SECTIONS.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= scrollY + window.innerHeight * 0.5) current = id;
    });
    setActive(current);
  });
}

// Mobile scroll tracking
if (isMobile()) {
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    let current = SECTIONS[0];
    SECTIONS.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.5) current = id;
    });
    setActive(current);
  });
}

/* ═════════════════════════════════════════════════════
   INTERSECTION OBSERVER — REVEAL ANIMATIONS
═════════════════════════════════════════════════════ */
function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(({ isIntersecting, target: el }) => {
      if (!isIntersecting) return;

      if (el.classList.contains('reveal') || el.classList.contains('sec-label')) {
        anime({ targets:el, opacity:[0,1], translateY:[24,0], duration:900, easing:'easeOutExpo' });
      }
      if (el.classList.contains('about-quote')) {
        anime({ targets:el, opacity:[0,1], translateX:[-32,0], duration:1000, easing:'easeOutExpo' });
      }
      if (el.classList.contains('about-body')) {
        anime({ targets:el, opacity:[0,1], translateX:[-24,0], duration:900, easing:'easeOutExpo', delay:150 });
      }
      if (el.classList.contains('stats-grid')) {
        anime({ targets:el, opacity:[0,1], translateX:[32,0], duration:1000, easing:'easeOutExpo' });
        el.querySelectorAll('.counter').forEach((c,i) => {
          anime({ targets:c, innerHTML:[0, +c.dataset.t], round:1, duration:1600, delay:300+i*120, easing:'easeOutExpo' });
        });
      }
      if (el.classList.contains('exp-card')) {
        anime({ targets:el, opacity:[0,1], translateX:[28,0], duration:800, easing:'easeOutExpo' });
      }
      if (el.id === 'skill-canvas-wrap') {
        anime({ targets:el, opacity:[0,1], scale:[0.92,1], duration:1000, easing:'easeOutExpo' });
        drawRadar();
      }
      if (el.classList.contains('skill-list')) {
        anime({ targets:el, opacity:[0,1], translateX:[28,0], duration:900, easing:'easeOutExpo' });
        el.querySelectorAll('.skill-fill').forEach((sf,i) => {
          setTimeout(() => { sf.style.width = sf.dataset.w + '%'; }, 200 + i * 90);
        });
      }
      if (el.classList.contains('edu-card')) {
        anime({ targets:el, opacity:[0,1], translateY:[32,0], duration:900, easing:'easeOutExpo' });
      }
      if (el.classList.contains('contact-pre') || el.classList.contains('contact-head') ||
          el.classList.contains('contact-tiles') || el.classList.contains('contact-right')) {
        anime({ targets:el, opacity:[0,1], translateY:[28,0], duration:900, easing:'easeOutExpo' });
      }
      io.unobserve(el);
    });
  }, { threshold:0.1, root: isMobile() ? null : scroller });

  document.querySelectorAll('.reveal,.sec-label,.about-quote,.about-body,.stats-grid,.exp-card,#skill-canvas-wrap,.skill-list,.edu-card,.contact-pre,.contact-head,.contact-tiles,.contact-right').forEach(el => io.observe(el));
}
initReveal();

/* ═════════════════════════════════════════════════════
   RADAR CHART — Algorithmic Canvas 2D
═════════════════════════════════════════════════════ */
function drawRadar() {
  const canvas = document.getElementById('skill-canvas');
  const wrap   = document.getElementById('skill-canvas-wrap');
  const size   = wrap.offsetWidth - 48 || 340;
  const dpr    = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width  = size * dpr; canvas.height = size * dpr;
  canvas.style.width  = size + 'px'; canvas.style.height  = size + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const cx = size/2, cy = size/2, R = size * 0.36;
  const skills = [
    { label:'JavaScript', val:0.88 },
    { label:'HTML/CSS',   val:0.95 },
    { label:'Proj Mgmt',  val:0.90 },
    { label:'UI/UX',      val:0.78 },
    { label:'Power BI',   val:0.82 },
    { label:'Premiere',   val:0.84 },
    { label:'PHP/MySQL',  val:0.86 },
  ];
  const N = skills.length;

  function drawGrid(anim) {
    ctx.clearRect(0, 0, size, size);
    // Rings
    for (let ring = 1; ring <= 5; ring++) {
      const r = R * ring / 5;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const a = (i/N)*Math.PI*2 - Math.PI/2;
        const x = cx + r*Math.cos(a), y = cy + r*Math.sin(a);
        i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.strokeStyle = ring===5 ? 'rgba(232,255,71,0.12)' : 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1; ctx.stroke();
    }
    // Spokes
    for (let i = 0; i < N; i++) {
      const a = (i/N)*Math.PI*2 - Math.PI/2;
      ctx.beginPath(); ctx.moveTo(cx,cy);
      ctx.lineTo(cx+R*Math.cos(a), cy+R*Math.sin(a));
      ctx.strokeStyle = 'rgba(26,110,255,0.15)'; ctx.lineWidth=1; ctx.stroke();
    }
    // Data polygon
    const ease = anim < 0.5 ? 2*anim*anim : -1+(4-2*anim)*anim;
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const a = (i/N)*Math.PI*2 - Math.PI/2;
      const r = R * skills[i].val * ease;
      const x = cx + r*Math.cos(a), y = cy + r*Math.sin(a);
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(cx,cy,0, cx,cy,R);
    g.addColorStop(0,   'rgba(26,110,255,0.18)');
    g.addColorStop(0.5, 'rgba(232,255,71,0.08)');
    g.addColorStop(1,   'rgba(255,77,26,0.10)');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(232,255,71,0.25)'; ctx.lineWidth = 1.5; ctx.stroke();
    // Data points
    const hues = [210,220,200,15,25,190,30];
    for (let i = 0; i < N; i++) {
      const a = (i/N)*Math.PI*2 - Math.PI/2;
      const r = R * skills[i].val * ease;
      const x = cx + r*Math.cos(a), y = cy + r*Math.sin(a);
      ctx.beginPath(); ctx.arc(x,y,3.5,0,Math.PI*2);
      ctx.fillStyle = `hsl(${hues[i]},90%,65%)`; ctx.fill();
      ctx.beginPath(); ctx.arc(x,y,7,0,Math.PI*2);
      ctx.strokeStyle = `hsla(${hues[i]},90%,65%,0.3)`; ctx.lineWidth=1; ctx.stroke();
    }
    // Labels
    ctx.font = `300 ${size*0.027}px 'DM Mono',monospace`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    for (let i = 0; i < N; i++) {
      const a = (i/N)*Math.PI*2 - Math.PI/2;
      ctx.fillStyle = 'rgba(176,184,208,0.75)';
      ctx.fillText(skills[i].label, cx+(R+28)*Math.cos(a), cy+(R+28)*Math.sin(a));
    }
  }

  let pct = 0;
  const rId = setInterval(() => {
    pct = Math.min(1, pct + 0.03);
    drawGrid(pct);
    if (pct >= 1) clearInterval(rId);
  }, 16);
}

/* ═════════════════════════════════════════════════════
   CLICK PARTICLES
═════════════════════════════════════════════════════ */
document.addEventListener('click', e => {
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    const hue = (i * 30 + bgFrame * 2) % 360;
    const sz = 3 + Math.random() * 5;
    p.style.cssText = `position:fixed;width:${sz}px;height:${sz}px;border-radius:50%;background:hsl(${hue},90%,65%);pointer-events:none;z-index:9990;left:${e.clientX}px;top:${e.clientY}px;mix-blend-mode:screen;`;
    document.body.appendChild(p);
    anime({ targets:p,
      left: e.clientX + (Math.random()-0.5)*180 + 'px',
      top:  e.clientY + (Math.random()-0.5)*180 + 'px',
      opacity:[1,0], scale:[1,0],
      duration:700+Math.random()*500, easing:'easeOutExpo',
      complete:()=>p.remove()
    });
  }
});

/* ═════════════════════════════════════════════════════
   TEXT SCRAMBLE — Hero name on hover
═════════════════════════════════════════════════════ */
const SCRAMBLE_CHARS = 'アイウエオカキクケコABCDEF0123456789';
const hfEl = document.getElementById('hf');
if (hfEl) {
  const orig = hfEl.textContent;
  hfEl.addEventListener('mouseenter', () => {
    let iter = 0;
    clearInterval(hfEl._sc);
    hfEl._sc = setInterval(() => {
      hfEl.textContent = orig.split('').map((ch, i) => {
        if (i < iter) return orig[i];
        return SCRAMBLE_CHARS[Math.floor(Math.random()*SCRAMBLE_CHARS.length)];
      }).join('');
      iter += 0.35;
      if (iter >= orig.length) clearInterval(hfEl._sc);
    }, 40);
  });
}

/* ═════════════════════════════════════════════════════
   CONTACT FORM — success feedback
═════════════════════════════════════════════════════ */
const cForm = document.getElementById('contactForm');
if (cForm) {
  // FormSubmit redirects by default. We show success if _next param is set or handle via JS.
  // For pure JS fallback — intercept and use fetch:
  cForm.addEventListener('submit', async (e) => {
    const btn = cForm.querySelector('.form-submit-btn');
    const success = document.getElementById('formSuccess');
    // Let the native form submission to FormSubmit handle it.
    // Just show visual feedback:
    if (btn) {
      btn.querySelector('span').textContent = 'Sending...';
      btn.disabled = true;
    }
  });
}
