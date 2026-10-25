/* ═══ PORTFOLIO — page behaviour ═══
   Paint queue + bloom, word-split reveals, palette nav, glazing, drift, form.
   Motion rules: transform/opacity only; ease-out for things entering, short
   (≤300ms) for anything the visitor triggers; nothing moves under
   prefers-reduced-motion — washes simply appear already dry. */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const hasIO = "IntersectionObserver" in window;

/* ═══ WORD SPLIT — headings rise word by word ═══ */
document.querySelectorAll("[data-split]").forEach((el) => {
  let i = 0;
  (function walk(node) {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 1) return walk(child);
      if (child.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      child.textContent.split(/(\s+)/).forEach((token) => {
        if (!token) return;
        if (/^\s+$/.test(token)) return frag.appendChild(document.createTextNode(token));
        const outer = document.createElement("span");
        outer.className = "w";
        const inner = document.createElement("span");
        inner.textContent = token;
        inner.style.setProperty("--i", i++);
        outer.appendChild(inner);
        frag.appendChild(outer);
      });
      child.replaceWith(frag);
    });
  })(el);
});

/* ═══ PAINT QUEUE — washes are painted lazily, a frame-budget at a time, so
   the main thread never stalls; visible ones jump the queue ═══ */
const washes = Array.from(document.querySelectorAll(".wash"));
const queue = [];
let pumping = false;

function settle(el) {
  if (!el._wantBloom || !el.dataset.painted || el._bloomed) return;
  el._bloomed = true;
  if (reduceMotion) return el.classList.add("bloom");
  void el.offsetWidth; /* commit the pre-bloom state so the transition runs */
  setTimeout(() => el.classList.add("bloom"), parseInt(el.dataset.delay || "0", 10));
}
function pump() {
  const start = performance.now();
  while (queue.length && performance.now() - start < 10) {
    const el = queue.shift();
    window.Watercolor.paint(el);
    settle(el);
  }
  if (queue.length) requestAnimationFrame(pump);
  else pumping = false;
}
function enqueue(el, urgent) {
  if (el.dataset.painted) return settle(el);
  if (el._queued && !urgent) return;
  if (el._queued) queue.splice(queue.indexOf(el), 1);
  el._queued = true;
  urgent ? queue.unshift(el) : queue.push(el);
  if (!pumping) {
    pumping = true;
    requestAnimationFrame(pump);
  }
}

if (hasIO) {
  const near = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && (enqueue(e.target), near.unobserve(e.target))),
    { rootMargin: "80% 0px" },
  );
  const seen = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target._wantBloom = true;
        enqueue(e.target, true);
        seen.unobserve(e.target);
      }),
    { rootMargin: "0px 0px -6% 0px" },
  );
  washes.forEach((el) => {
    near.observe(el);
    seen.observe(el);
  });
} else {
  washes.forEach((el) => {
    el._wantBloom = true;
    enqueue(el);
  });
}

/* highlighter marks behind key phrases: painted strokes as background images */
document.querySelectorAll(".hl").forEach((el, i) => {
  requestAnimationFrame(() => {
    const url = window.Watercolor.strokeURL(el.dataset.pig || "yellow", 401 + i * 7, 640, 96);
    if (url) el.style.setProperty("--hl", `url(${url})`);
  });
});

/* ═══ REVEALS ═══ */
const revealEls = document.querySelectorAll(".rv, [data-split], .statement, .flowline");
if (reduceMotion || !hasIO) {
  revealEls.forEach((el) => el.classList.add("in"));
} else {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      }),
    { threshold: 0.14, rootMargin: "0px 0px -6% 0px" },
  );
  revealEls.forEach((el) => io.observe(el));
}

/* ═══ NAV — palette wells, scrollspy, progress stroke ═══ */
const nav = document.getElementById("nav");
const navLinks = Array.from(nav.querySelectorAll(".palette a"));
const spy = navLinks
  .map((link) => ({ link, section: document.querySelector(link.getAttribute("href")) }))
  .filter((s) => s.section);
const pigSections = Array.from(document.querySelectorAll("main > section[data-pig]"));
let currentPig = "";
let ticking = false;

function onScroll() {
  ticking = false;
  const max = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
  nav.style.setProperty("--progress", Math.min(Math.max(scrollY / max, 0), 1).toFixed(4));
  nav.classList.toggle("scrolled", scrollY > 24);

  const marker = scrollY + innerHeight * 0.4;
  let active = null;
  spy.forEach((s) => {
    if (s.section.offsetTop <= marker) active = s;
  });
  spy.forEach((s) => {
    const on = s === active;
    s.link.classList.toggle("active", on);
    on ? s.link.setAttribute("aria-current", "location") : s.link.removeAttribute("aria-current");
  });

  /* the page's working pigment follows the section under the reader —
     selection colour and nav accents pick it up */
  let pigSec = pigSections[0];
  pigSections.forEach((s) => {
    if (s.offsetTop <= marker) pigSec = s;
  });
  const pig = pigSec ? pigSec.dataset.pig : "rose";
  if (pig !== currentPig) {
    if (currentPig) companionArrive();
    currentPig = pig;
    document.documentElement.style.setProperty("--sec-pig", `var(--${pig})`);
    document.documentElement.style.setProperty("--sec-ink", `var(--${pig}-ink)`);
  }
  requestDrift();
  requestCompanion();
}
function requestScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(onScroll);
}
addEventListener("scroll", requestScroll, { passive: true });
addEventListener("resize", () => {
  measureDrift();
  measureCompanion();
  requestScroll();
}, { passive: true });

/* mobile menu */
const toggle = nav.querySelector(".menu-toggle");
function setMenu(open) {
  nav.classList.toggle("menu-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.querySelector(".menu-label").textContent = open ? "Close" : "Menu";
}
toggle.addEventListener("click", () => setMenu(!nav.classList.contains("menu-open")));
navLinks.forEach((a) => a.addEventListener("click", () => setMenu(false)));
addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav.classList.contains("menu-open")) {
    setMenu(false);
    toggle.focus();
  }
});
matchMedia("(min-width: 861px)").addEventListener("change", (e) => e.matches && setMenu(false));

/* ═══ GLAZING — three glass panes, one per primary, are laid down one
   principle at a time; scrolling back up lifts them off again ═══ */
(function () {
  const glaze = document.querySelector(".glaze");
  if (!glaze) return;
  const layers = Array.from(glaze.querySelectorAll(".pane"));
  const count = glaze.querySelector(".glaze-count");
  const principles = Array.from(document.querySelectorAll(".principle"));
  const stacked = matchMedia("(max-width: 860px)");
  function apply(n) {
    glaze.dataset.applied = n;
    count.textContent = n;
    layers.forEach((g, i) => g.classList.toggle("on", i < n));
    principles.forEach((p) => p.classList.toggle("current", +p.dataset.layer === n));
  }
  if (reduceMotion || !hasIO) return apply(3);
  const centre = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (stacked.matches) return;
        const n = +e.target.dataset.layer;
        if (e.isIntersecting) apply(n);
        else if (n === 1 && e.boundingClientRect.top > 0) apply(0);
      }),
    { rootMargin: "-42% 0px -42% 0px" },
  );
  principles.forEach((p) => centre.observe(p));
  /* stacked layout: the painting sits above the text, so lay all three
     glazes in sequence once it's on screen */
  new IntersectionObserver(
    (entries) => {
      if (!stacked.matches || !entries[0].isIntersecting) return;
      [1, 2, 3].forEach((n) => setTimeout(() => apply(n), (n - 1) * 380));
    },
    { threshold: 0.4 },
  ).observe(glaze);
})();

/* ═══ DRIFT — washes float at their own depth on scroll; hero washes also
   lean toward the pointer. One lerped rAF loop that sleeps when settled. ═══ */
const drifters = reduceMotion
  ? []
  : Array.from(document.querySelectorAll("[data-drift], [data-follow]")).map((el) => ({
      el,
      drift: parseFloat(el.dataset.drift || "0"),
      follow: finePointer ? parseFloat(el.dataset.follow || "0") : 0,
      cy: 0,
      x: 0,
      y: 0,
    }));
let pointer = { x: 0, y: 0 };
let drifting = false;

function measureDrift() {
  drifters.forEach((d) => {
    d.el.style.translate = "none";
    const r = d.el.getBoundingClientRect();
    d.cy = r.top + scrollY + r.height / 2;
    d.el.style.translate = `${d.x.toFixed(2)}px ${d.y.toFixed(2)}px`;
  });
}
function driftFrame() {
  const mid = scrollY + innerHeight / 2;
  let moving = false;
  drifters.forEach((d) => {
    const dist = d.cy - mid;
    if (Math.abs(dist) > innerHeight * 1.6) return;
    const tx = pointer.x * d.follow;
    const ty = dist * d.drift + pointer.y * d.follow * 0.6;
    d.x += (tx - d.x) * 0.1;
    d.y += (ty - d.y) * 0.1;
    if (Math.abs(tx - d.x) > 0.1 || Math.abs(ty - d.y) > 0.1) moving = true;
    d.el.style.translate = `${d.x.toFixed(2)}px ${d.y.toFixed(2)}px`;
  });
  if (moving) requestAnimationFrame(driftFrame);
  else drifting = false;
}
function requestDrift() {
  if (!drifters.length || drifting) return;
  drifting = true;
  requestAnimationFrame(driftFrame);
}
if (drifters.length) {
  measureDrift();
  addEventListener("load", measureDrift);
  if (finePointer) {
    const hero = document.querySelector(".hero");
    hero.addEventListener("pointermove", (e) => {
      pointer.x = e.clientX / innerWidth - 0.5;
      pointer.y = e.clientY / innerHeight - 0.5;
      requestDrift();
    });
    hero.addEventListener("pointerleave", () => {
      pointer = { x: 0, y: 0 };
      requestDrift();
    });
  }
}

/* ═══ COMPANION — a paint drop travelling the right gutter. Its height on
   the track mirrors page progress; it takes each section's pigment (CSS
   --sec-pig), leans with scroll speed, leaves a wet trail coloured by the
   sections it passed, and near the end glides into the rinse jar. ═══ */
const comp = document.querySelector(".companion");
const trail = document.querySelector(".drop-trail");
const compLean = comp.querySelector(".c-lean");
const compSquish = comp.querySelector(".c-squish");
const jar = document.querySelector(".art-jar");
const footer = document.querySelector("footer");
const stops = Array.from(document.querySelectorAll("main > section, footer"));
const cs = { x: 0, y: 0, lean: 0, w: 44, h: 52, col: 0, top: 0, bottom: 0, trailH: 0, lastY: scrollY, inJar: false, placed: false };
let compRunning = false;

function measureCompanion() {
  cs.w = comp.offsetWidth;
  cs.h = (cs.w * 76) / 64;
  /* centre of the empty strip right of the text column — never over copy */
  const inner = document.querySelector(".sec-inner");
  const r = inner.getBoundingClientRect();
  const free = innerWidth - (r.right - parseFloat(getComputedStyle(inner).paddingRight));
  cs.col = innerWidth <= 600 ? innerWidth - cs.w * 0.62 : innerWidth - Math.min(free / 2, 80) - cs.w / 2;
  cs.top = nav.offsetHeight + 18;
  cs.bottom = innerHeight - cs.h - 28;

  const max = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
  const parts = pigSections.map((s) => {
    const p = Math.min(Math.max((s.offsetTop - innerHeight * 0.4) / max, 0), 1);
    return `var(--${s.dataset.pig}) ${(p * 100).toFixed(1)}%`;
  });
  trail.style.setProperty("--trail", `linear-gradient(${parts.join(", ")})`);
  cs.trailH = cs.bottom - cs.top;
  trail.style.height = `${cs.trailH}px`;
  trail.style.transform = `translate3d(${(cs.col + cs.w / 2 - 5).toFixed(1)}px, ${(cs.top + cs.h * 0.3).toFixed(1)}px, 0)`;
}

function compFrame() {
  const max = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
  const p = Math.min(Math.max(scrollY / max, 0), 1);
  const trackY = cs.top + p * (cs.bottom - cs.top);
  let tx = cs.col;
  let ty = trackY;

  /* the last stretch of page: steer into the jar's mouth */
  const reach = Math.min(footer.offsetHeight, innerHeight) * 0.85;
  const t = Math.min(Math.max(1 - (max - scrollY) / reach, 0), 1);
  if (t > 0) {
    const jr = jar.getBoundingClientRect();
    const e = t * t * (3 - 2 * t);
    tx += (jr.left + jr.width * 0.5 - cs.w / 2 - tx) * e;
    ty += (jr.top + jr.height * 0.17 - cs.h * 0.9 - ty) * e;
  }
  const inJar = t > 0.97;
  if (inJar !== cs.inJar) {
    cs.inJar = inJar;
    comp.classList.toggle("in-jar", inJar);
    if (inJar && !reduceMotion) {
      jar.classList.remove("splash");
      void jar.getBoundingClientRect();
      jar.classList.add("splash");
    }
  }

  const v = scrollY - cs.lastY;
  cs.lastY = scrollY;
  if (reduceMotion || !cs.placed) {
    cs.x = tx;
    cs.y = ty;
    cs.placed = true;
  } else {
    cs.x += (tx - cs.x) * 0.16;
    cs.y += (ty - cs.y) * 0.16;
    cs.lean += (Math.max(-12, Math.min(12, -v * 0.35)) - cs.lean) * 0.15;
    compLean.style.rotate = `${cs.lean.toFixed(2)}deg`;
  }
  comp.style.transform = `translate3d(${cs.x.toFixed(1)}px, ${cs.y.toFixed(1)}px, 0)`;
  const shown = Math.max(0, Math.min(cs.trailH, trackY - cs.top));
  trail.style.clipPath = `inset(0 0 ${(cs.trailH - shown).toFixed(1)}px 0)`;

  const moving = Math.abs(tx - cs.x) > 0.3 || Math.abs(ty - cs.y) > 0.3 || Math.abs(cs.lean) > 0.15;
  if (moving) requestAnimationFrame(compFrame);
  else compRunning = false;
}
function requestCompanion() {
  if (compRunning) return;
  compRunning = true;
  requestAnimationFrame(compFrame);
}

function squish() {
  if (reduceMotion) return;
  compSquish.classList.remove("squish");
  void compSquish.offsetWidth; /* restart the keyframes */
  compSquish.classList.add("squish");
}
function companionArrive() {
  squish();
}
compSquish.addEventListener("animationend", () => compSquish.classList.remove("squish"));
if (finePointer) comp.addEventListener("pointerenter", squish);

comp.addEventListener("click", () => {
  if (!reduceMotion) {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + Math.random() * 0.5;
      const d = 18 + Math.random() * 16;
      const s = document.createElement("span");
      s.className = "splat";
      s.style.setProperty("--dx", `${(Math.cos(a) * d).toFixed(1)}px`);
      s.style.setProperty("--dy", `${(Math.sin(a) * d).toFixed(1)}px`);
      s.addEventListener("animationend", () => s.remove());
      comp.appendChild(s);
    }
    squish();
  }
  const behavior = reduceMotion ? "auto" : "smooth";
  /* +24 clears the scroll-padding a just-reached section rests on */
  const next = stops.find((s) => s.getBoundingClientRect().top > nav.offsetHeight + 24);
  if (next) next.scrollIntoView({ behavior });
  else scrollTo({ top: 0, behavior });
});

measureCompanion();
addEventListener("load", () => {
  measureCompanion();
  requestCompanion();
});
onScroll();

/* ═══ CONTACT FORM ═══
   No backend by design: submit composes a prefilled email in the visitor's
   own mail client via mailto:. The status line speaks in full sentences. */
(function () {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const nameEl = document.getElementById("cf-name");
  const msgEl = document.getElementById("cf-msg");
  const status = form.querySelector(".cf-status");
  let resetTimer = 0;
  function say(text, cls) {
    status.textContent = text;
    status.className = "cf-status" + (cls ? " " + cls : "");
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      status.textContent = "";
      status.className = "cf-status";
    }, 7000);
  }
  [nameEl, msgEl].forEach((el) => el.addEventListener("input", () => el.removeAttribute("aria-invalid")));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameEl.value.trim();
    const msg = msgEl.value.trim();
    if (!name) {
      nameEl.setAttribute("aria-invalid", "true");
      say("Add your name so I know who's writing.", "err");
      return nameEl.focus();
    }
    if (!msg) {
      msgEl.setAttribute("aria-invalid", "true");
      say("Write a quick note — a line or two is plenty.", "err");
      return msgEl.focus();
    }
    const subject = "Portfolio contact — " + name;
    /* RFC 6068: mailto body line breaks are %0D%0A */
    const body = msg + "\r\n\r\n— " + name;
    window.location.href =
      "mailto:hk.nguyen91@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    say("Your draft is ready in your mail app — just hit send.", "ok");
  });
})();
