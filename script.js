      /* ═══ GYRE CONFIG ═══
   The persistent WebGL object (three optical-glass bands around an organic mineral core) on a fixed
   canvas behind the page. Choreography: 9 keyframes, hero → footer, 2.72 total turns,
   pure function of scrollY — plus per-section viewpoint (p/r/f) and environment
   (lk/w/bg) channels, and a free-running slow ring loop (time-based, not scroll).
   Rungs: L0 full spec · L1 ≤1080/watchdog (no dispersion,
   lower DPR) · L2 ≤920 (no transmission, lower DPR) · L3 no-WebGL
   (SVG fallback stays visible). Motion and scroll response remain active otherwise. */
      const OBJ_CFG = {
        /* — object — */
        /* 4 tall thin "tape band" rings (BAND_DEPTH = axial height 0.30, BAND_WIDTH
           = radial thickness 0.06) nested as disjoint spherical shells. A tumbling
           ring sweeps distances [R−w/2, sqrt((R+w/2)²+(d/2)²)] ≈ [R−0.03, R+0.037];
           the 0.10 radius steps keep every adjacent pair clear at EVERY orientation
           — the rings can never touch or pass through each other — while the whole
           nest hugs the island (silhouette radius ≈1.5). */
        RING_TILTS_DEG: [10, 40, 70, 100],
        RING_YAW_OFFSET_DEG: 45,
        RING_RADII: [1.6, 1.7, 1.8, 1.9],
        RING_TUBE: [0.105, 0.105, 0.105, 0.105],
        RING_BAND_WIDTH: [0.06, 0.06, 0.06, 0.06],
        RING_BAND_DEPTH: [0.3, 0.3, 0.3, 0.3],
        RING_ASPECT_Y: [1, 1, 1, 1] /* 1 = true circles (values <1 squash vertically) */,
        RING_WOBBLE: [0, 0, 0, 0] /* 0 = perfectly round bands, no radial warble */,
        HERO_POSE: { x: 50, y: 80, s: 50 },
        ROCK_COLOR: "#343830",
        ROCK_SHADE_DARK: "#171a18",
        ROCK_SHADE_LIGHT: "#77796a",
        ROCK_ROUGH: 0.92,
        ROCK_METAL: 0.02,
        GLASS_ROUGH: 0.03 /* polished clear-water read */,
        GLASS_IOR: 1.47,
        GLASS_TINT: "#F4FAFC",
        DISPERSION: 0.24 /* visible prismatic edges on the ribbons, per reference */,
        /* — light — */
        KEY_INT: 1.0,
        FILL_INT: 0.3,
        ACCENT_RIM_COLOR: "#E99A00",
        ACCENT_RIM_INT: 0.35,
        CTA_GLINT_TRIM_DEG: 0 /* additive yaw trim at K7 to land the amber glint */,
        /* — choreography — */
        /* per-keyframe channels beyond x/y/s/t/o:
       p/r  = pitch/roll viewpoint offsets (deg) — object-space rotation, reads as a
              per-section camera-orbit change without touching the placement math
       f    = camera FOV (deg) — zoom/dolly feel; placement math self-compensates
       lk   = light-rig intensity multiplier (key/fill/ambient)
       w    = warmth 0→1 — amber rim boost + light-pool tint; peaks at #cta (glint)
       bg   = backdrop plane color. Light-graphite family (≤~4% lightness deltas so
              panel edges don't seam against the static CSS --bg) EXCEPT the guarded
              #how ink band (#222325): its ramps are compressed into inter-section
              padding by av-guard keyframes and the DOM flips body.sec-ink in sync
              (see updateScrollMotion). K0 bg MUST equal --bg.
       pl   = light-pool strength 0→1 — backdrop brightens in a soft plateau pool
              under the object (tint = white→amber by w)
       form = ring formation preset name (FORMATIONS table); resolved at boot to
              formR, per-ring params interpolate numerically between keyframes
       av   = per-keyframe ANCHOR_VH override — guard keyframes use it to pin color
              ramps inside inter-section padding (dark never under readable copy) */
        KEYFRAMES: [
          /* anchor '' = scroll 0; y>100 exits below.
             Authored path: hero (lower-center, below the centered copy — the
             rock core stays under the ROCK_SAFE_Y line) → GHOST at #statement
             (mild zoom, faded to o 0.3 and pinned by av:0 at the reading
             moment — the centered copy sits over the canvas with no opaque
             surface, so legibility beats object prominence here) → LEFT phase
             (#build orbit, #work gyro) → RIGHT phase (#approach disc → #how
             LADDER inside the guarded ink band → #experience disc) → nest +
             amber warmth at #cta → ZOOM OUT at footer. Formation adjacency
             chain nest·nest·orbit·gyro·disc·ladder·ladder·
             disc·disc·nest·nest satisfies safety rules R1/R3 (see FORMATIONS). */
          {
            a: "",
            form: "nest",
            x: 50,
            y: 80,
            s: 50,
            t: 0.0,
            o: 1.0,
            p: -4,
            r: -5,
            f: 34,
            lk: 1.0,
            w: 0,
            pl: 0.16,
            bg: "#E7E9EB",
          },
          {
            a: "#statement",
            form: "nest",
            /* reading pose: av 0 pins this key to the section-filling scroll
               (default ANCHOR_VH 0.6 would put the reading moment 60% into the
               K1→K2 lerp, parking the dark rock under the copy — the pre-Phase-0
               legibility bug); s/o tamed from 132/0.9 for the same reason */
            x: 62,
            y: 50,
            s: 72,
            t: 0.2,
            o: 0.3,
            p: -18,
            r: 9,
            f: 28,
            lk: 0.92,
            w: 0,
            pl: 0.14,
            bg: "#E3E5E7",
            av: 0,
          },
          {
            a: "#build",
            form: "orbit",
            /* s compensates orbit's ×1.58 footprint vs the fixed BASE_DIAM */
            x: 20,
            y: 50,
            s: 52,
            t: 0.64,
            o: 1.0,
            p: 22,
            r: -12,
            f: 34,
            lk: 1.05,
            w: 0,
            pl: 0.16,
            bg: "#DDDFE1",
          },
          {
            a: "#work",
            form: "gyro",
            x: 22,
            y: 48,
            s: 64,
            t: 1.05,
            o: 0.88,
            p: -28,
            r: 16,
            f: 32,
            lk: 0.88,
            w: 0,
            pl: 0.18,
            bg: "#D8DADC",
          },
          {
            a: "#approach",
            form: "disc",
            x: 80,
            y: 50,
            s: 70,
            t: 1.42,
            o: 0.86,
            p: 26,
            r: -18,
            f: 33,
            lk: 0.95,
            w: 0,
            pl: 0.14,
            bg: "#E1E3E5",
          },
          {
            /* ink-band GUARD IN: still light at 1.15vh above #how — the dark ramp
               lives entirely in the #approach→#how padding corridor */
            a: "#how",
            av: 1.15,
            form: "ladder",
            x: 78,
            y: 52,
            s: 90,
            t: 1.7,
            o: 1.0,
            p: -6,
            r: 10,
            f: 31,
            lk: 1.0,
            w: 0,
            pl: 0.2,
            bg: "#DCDEE0",
          },
          {
            /* the INK moment: ladder stack over deep graphite, brightest pool;
               lk 1.18 keeps the object luminous against the dark band */
            a: "#how",
            av: 0.35,
            form: "ladder",
            x: 78,
            y: 52,
            s: 96,
            t: 1.82,
            o: 1.0,
            p: -6,
            r: 8,
            f: 30,
            lk: 1.18,
            w: 0,
            pl: 0.3,
            bg: "#222325",
          },
          {
            /* dark HOLD through the #how→#experience padding, rings re-coalesce */
            a: "#experience",
            av: 1.15,
            form: "disc",
            x: 74,
            y: 55,
            s: 70,
            t: 2.02,
            o: 0.9,
            p: 10,
            r: -4,
            f: 34,
            lk: 1.12,
            w: 0,
            pl: 0.26,
            bg: "#222325",
          },
          {
            /* GUARD OUT: back to light before #experience copy is readable */
            a: "#experience",
            av: 0.6,
            form: "disc",
            x: 74,
            y: 55,
            s: 62,
            t: 2.12,
            o: 0.78,
            p: 32,
            r: -10,
            f: 36,
            lk: 0.85,
            w: 0,
            pl: 0.14,
            bg: "#E7E9EB",
          },
          {
            a: "#cta",
            form: "nest",
            /* warm paper + w 1.0: the pool ambers itself via the tint coupling */
            x: 64,
            y: 50,
            s: 72,
            t: 2.45,
            o: 1.0,
            p: -20,
            r: 14,
            f: 33,
            lk: 1.02,
            w: 1.0,
            pl: 0.22,
            bg: "#EAE8E2",
          },
          {
            a: "footer",
            form: "nest",
            x: 50,
            y: 54,
            s: 38,
            t: 2.72,
            o: 0.85,
            p: 0,
            r: 0,
            f: 40,
            lk: 0.95,
            w: 0.3,
            pl: 0.1,
            bg: "#E7E9EB",
          },
        ],
        ANCHOR_VH: 0.6 /* keyframe fires when anchor top hits 60% viewport */,
        PITCH_RATIO: 0.35,
        PITCH_CLAMP_DEG: 18,
        /* — per-ring continuous loop: constant time-based rotation about each ring's own
       axis, ring B counter-rotating (negative PERIOD_S), slow full 360° revolutions.
       The angle accumulates incrementally, so disabling spin (watchdog drop-2, ≤920
       rung) freezes it in place — no snap back to PHASE. PHASE is the initial angle
       only; the K7 amber glint is now carried by the environment channel (w), not a
       ring phase lock. RING_LOOP_ON is the runtime kill switch — every branch that
       must let the loop park sets it false. — */
        RING_LOOP: [
          /* each ring's spin AXIS itself precesses slowly around PRECESS_AXIS —
             the tumble direction keeps changing (never just forward/backward),
             while both angles accumulate incrementally so kills still freeze */
          {
            PERIOD_S: 24,
            AXIS: [0.94, 0.33, 0],
            PHASE: 0,
            PRECESS_S: 68,
            PRECESS_AXIS: [0, 1, 0],
          } /* ring A: clearly visible rotation */,
          {
            PERIOD_S: -31,
            AXIS: [0, 0.29, 0.96],
            PHASE: 18,
            PRECESS_S: -56,
            PRECESS_AXIS: [1, 0, 0.2],
          } /* ring B: faster counter-rotation */,
          {
            PERIOD_S: 35,
            AXIS: [0.38, 0.86, 0.34],
            PHASE: -12,
            PRECESS_S: 90,
            PRECESS_AXIS: [0.2, 0, 1],
          } /* ring C: oblique orbit */,
          {
            PERIOD_S: -41,
            AXIS: [0.6, -0.52, 0.61],
            PHASE: 42,
            PRECESS_S: -76,
            PRECESS_AXIS: [0.7, 0.7, 0],
          } /* ring D: diagonal counter-tumble */,
        ],
        RING_LOOP_ON: true,
        /* scroll-velocity ring boost: scrolling injects angular momentum into the ring
       spin that decays back to idle. GAIN = rad/s added per px of scroll this frame;
       TAU_MS = decay time-constant (higher = longer flywheel carry); MAX = clamp on
       the boost angular velocity (rad/s) so a hard touch-flick can't over-spin.
       Suppressed under prefers-reduced-motion in engine.js. */
        RING_SCROLL_SPIN_ON: true,
        RING_SCROLL_SPIN_GAIN: 0.006,
        RING_SCROLL_SPIN_TAU_MS: 320,
        RING_SCROLL_SPIN_MAX: 2.6,
        /* — per-section ring FORMATIONS: the one object evolves instead of new objects.
       Each keyframe names a formation (form:'nest'|...); boot resolves it to formR and
       targetAt interpolates the RESOLVED per-ring params, so mid-scroll poses blend
       continuously. Channels per ring: scale (fs), y offset (fy), tilt/yaw/roll pose
       (ft/fw/fl). fa = alignment 0→1: 0 keeps the free RING_LOOP tumble, 1 holds the
       authored pose (still revolving in-plane on the SAME spinAngle accumulator, so
       every kill switch freezes formations exactly like the tumble).
       SAFETY (audited invariants):
       R1 — every formation keeps s ≥ 1 and non-decreasing in ring index, so adjacent
            swept shells stay disjoint at every interpolated pose;
       R2 — per-ring y offsets only apply once fa ≥ FORM_GATE (flat rings clear each
            other radially — s uniform — and clear the island: every flat-ring point
            sits ≥ inner radius 1.57 > the landmass's measured 1.55 max lateral
            extent; the keyed content's full 2.10 reach is the swan's flight arc,
            which rings legitimately cross in depth on the flat billboard);
       R3 — formations with distinct per-ring y (ladder) may only be keyframe-adjacent
            to flat aligned formations (disc) — the "flat corridor". — */
        FORMATIONS: {
          nest: {
            a: 0,
            s: [1, 1, 1, 1],
            y: [0, 0, 0, 0],
            tilt: [10, 40, 70, 100],
            yaw: [0, 45, 90, 135],
            roll: [-5, 8, -4, 6],
          } /* ≡ construction pose — the zero-visual-change identity */,
          orbit: {
            a: 0,
            s: [1.15, 1.3, 1.45, 1.6],
            y: [0, 0, 0, 0],
            tilt: [10, 40, 70, 100],
            yaw: [0, 45, 90, 135],
            roll: [-5, 8, -4, 6],
          } /* nest expanded into separated free-tumbling orbits */,
          gyro: {
            a: 1,
            s: [1, 1, 1, 1],
            y: [0, 0, 0, 0],
            tilt: [0, 90, 90, 48],
            yaw: [0, 0, 90, 45],
            roll: [0, 0, 0, 0],
          } /* aligned toward orthogonal axes — gyroscope/instrument read */,
          disc: {
            a: 1,
            s: [1.06, 1.06, 1.06, 1.06],
            y: [-0.12, -0.12, -0.12, -0.12],
            tilt: [0, 0, 0, 0],
            yaw: [0, 0, 0, 0],
            roll: [0, 0, 0, 0],
          } /* flat co-planar ground rings, slight drop */,
          ladder: {
            a: 1,
            s: [1, 1, 1, 1] /* MUST stay uniform — R2's radial fallback */,
            y: [1.05, 0.35, -0.35, -1.05],
            tilt: [0, 0, 0, 0],
            yaw: [0, 0, 0, 0],
            roll: [0, 0, 0, 0],
          } /* vertical stack through the island */,
        },
        FORM_GATE: [0.97, 1.0] /* smoothstep window on fa that gates y offsets (R2) */,
        ALIGNED_SPIN_MUL: 0.4 /* in-plane revolve rate of aligned poses (rides spinAngle) */,
        WARM_RIM_MULT: 3.0 /* rim intensity multiplier at w=1 (K7 amber moment) */,
        /* — rock instrumentation (addendum A2): PCB traces walking the facets + engraved
       glyphs; amber only on the 3 upper-hemisphere solder dots — */
        ROCK_TRACES: 0,
        TRACE_COLOR: "#DFE1E3",
        TRACE_OPACITY: 0.55,
        TRACE_LIFT: 0.015,
        DOT_AMBER_COUNT: 3,
        GLYPH_OPACITY: 0.45,
        GLYPH_SIZE: 0.3,
        PULSE_AMP: 0.12,
        PULSE_AMP_AMBER: 0.15,
        PULSE_PERIOD_S: 6,
        PULSE_STAGGER_S: 0.8,
        OBJ_SMOOTH: 0.1,
        IDLE_DRIFT_DEG: 4,
        IDLE_PERIOD_S: 10,
        ENTRANCE_MS: 1100,
        ENTRANCE_SCALE_FROM: 0.9,
        ENTRANCE_YAW_FROM_DEG: -6,
        /* — legibility contract — */
        ROCK_SAFE_Y: 0.58 /* rock-core top edge stays below 58% viewport height in hero at every width; hero text block must end above 54% */,
        /* — performance — */
        DPR_MAX: 1.75,
        FPS_FLOOR: 28,
        PROBE_MS: 3000,
        overrides: {
          "(max-width:1080px)": { DPR_MAX: 1.5, DISPERSION: 0 },
          "(max-width:920px)": { DPR_MAX: 1.25, TRANSMISSION: false },
          "(max-width:620px)": { DPR_MAX: 1 },
        },
      };

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      /* ═══ PRELOADER ═══ */
      (function () {
        let complete = false;
        const fallbackTimer = setTimeout(finish, 1800);
        document.addEventListener("gyre:ready", finish, { once: true });

        function finish() {
          if (complete) return;
          complete = true;
          clearTimeout(fallbackTimer);
          setTimeout(done, reduceMotion ? 0 : 70);
        }
        function done() {
          const loader = document.getElementById("loader");
          loader.classList.add("done");
          loader.setAttribute("aria-hidden", "true");
          heroIn();
        }
      })();

      /* ═══ HERO ENTRANCE ═══ */
      function heroIn() {
        document.getElementById("hero")?.classList.add("hero-ready");
      }

      /* ═══ NAV + SCROLL PROGRESS ═══ */
      const headerEl = document.getElementById("header");
      const navLinks = Array.from(document.querySelectorAll("nav.links a"));
      const navSections = navLinks
        .map((link) => ({
          link,
          section: document.querySelector(link.getAttribute("href")),
        }))
        .filter((item) => item.section);
      const railLinks = Array.from(document.querySelectorAll(".rail a"))
        .map((link) => ({
          link,
          section: document.querySelector(link.getAttribute("href")),
        }))
        .filter((item) => item.section);
      /* sticky mobile CTA (≤620): same scrollspy, zero extra listeners */
      const mobileCta = document.querySelector(".mobile-cta");
      /* sec-ink: DOM side of the #how ink band. Thresholds are the MIDPOINTS of the
         WebGL bg ramps authored on the av-guard keyframes — in: (1.15+0.35)/2 = 0.75
         above #how; out: (1.15+0.60)/2 = 0.875 above #experience — so the class
         flips inside inter-section padding while cur.bg lerps around it. Keep these
         coupled to the keyframe av values in OBJ_CFG. */
      const inkHowEl = document.getElementById("how");
      const inkExpEl = document.getElementById("experience");
      const INK_HYST = 48; /* px — scroll jitter can't strobe the page */
      let inkOn = false;
      let scrollTicking = false;
      function updateScrollMotion() {
        const maxScroll = Math.max(
          document.documentElement.scrollHeight - innerHeight,
          1,
        );
        headerEl.style.setProperty(
          "--scroll-progress",
          Math.min(Math.max(scrollY / maxScroll, 0), 1).toFixed(4),
        );
        headerEl.classList.toggle("scrolled", scrollY > 40);

        const marker = scrollY + innerHeight * 0.38;
        let active = null;
        navSections.forEach((item) => {
          if (item.section.offsetTop <= marker) active = item;
        });
        navSections.forEach((item) => {
          const isActive = item === active;
          item.link.classList.toggle("active", isActive);
          if (isActive) item.link.setAttribute("aria-current", "location");
          else item.link.removeAttribute("aria-current");
        });
        let railActive = null;
        railLinks.forEach((item) => {
          if (item.section.offsetTop <= marker) railActive = item;
        });
        railLinks.forEach((item) => {
          const isActive = item === railActive;
          item.link.classList.toggle("active", isActive);
          if (isActive) item.link.setAttribute("aria-current", "location");
          else item.link.removeAttribute("aria-current");
        });
        /* sticky mobile CTA: shown while a rail section is active (01–06),
           hidden in the hero (railActive null) and once #cta is active —
           #cta stays the last-active item through the footer, so the pill
           stays hidden there too */
        if (mobileCta)
          mobileCta.classList.toggle(
            "show",
            !!railActive && railActive.section.id !== "cta",
          );
        if (inkHowEl && inkExpEl) {
          const inkIn = inkHowEl.offsetTop - 0.75 * innerHeight;
          const inkOut = inkExpEl.offsetTop - 0.875 * innerHeight;
          const on = inkOn
            ? scrollY > inkIn - INK_HYST && scrollY < inkOut + INK_HYST
            : scrollY > inkIn + INK_HYST && scrollY < inkOut - INK_HYST;
          if (on !== inkOn) {
            inkOn = on;
            document.body.classList.toggle("sec-ink", inkOn);
          }
        }
        scrollTicking = false;
      }
      function requestScrollMotion() {
        if (scrollTicking) return;
        scrollTicking = true;
        requestAnimationFrame(updateScrollMotion);
      }
      window.addEventListener("scroll", requestScrollMotion, { passive: true });
      window.addEventListener("resize", requestScrollMotion, { passive: true });
      updateScrollMotion();

      /* ═══ CONTACT FORM ═══
   No backend by design (static site, no secrets in the repo): Send composes a
   prefilled email in the visitor's own mail client via mailto:. The status
   line speaks in a plain human voice — full sentences, no log glyphs. */
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
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          const name = nameEl.value.trim();
          const msg = msgEl.value.trim();
          if (!name) {
            say("Add your name so I know who's writing.", "err");
            nameEl.focus();
            return;
          }
          if (!msg) {
            say("Write a quick note — a line or two is plenty.", "err");
            msgEl.focus();
            return;
          }
          const subject = "Portfolio contact — " + name;
          /* RFC 6068: mailto body line breaks are %0D%0A */
          const body = msg + "\r\n\r\n— " + name;
          window.location.href =
            "mailto:hk.nguyen91@gmail.com?subject=" +
            encodeURIComponent(subject) +
            "&body=" +
            encodeURIComponent(body);
          say("Your draft is ready in your mail app — just hit send.", "ok");
        });
      })();

      /* ═══ SCROLL REVEALS ═══ */
      const revealEls = Array.from(document.querySelectorAll(".reveal"));
      const staggerSelectors = [
        ".svc-grid",
        ".work-grid",
        ".steps",
        "#experience .content",
      ];
      staggerSelectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((group) => {
          Array.from(group.children)
            .filter((el) => el.classList.contains("reveal"))
            .forEach((el, index) => {
              el.style.setProperty(
                "--reveal-delay",
                `${Math.min(index, 5) * 85}ms`,
              );
            });
        });
      });
      if (reduceMotion || !("IntersectionObserver" in window)) {
        revealEls.forEach((el) => el.classList.add("in"));
      } else {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("in");
              io.unobserve(entry.target);
            });
          },
          { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
        );
        revealEls.forEach((el) => io.observe(el));
      }

      /* ═══ LOGO VIDEO — kn monogram in the header on a fixed cadence.
   Variant pick: VP9-alpha WebM (.alpha — transparent line-art) where supported,
   else the mp4 on its black plate (.chip); a failing webm demotes itself to the
   chip once. PERIOD_MS is start-to-start: the ~5s animation plays, rests on its
   final frame (which matches the first), and begins again 7s after it last
   started. The "/khang" text remains until first frame data exists; total media
   failure restores it. Data Saver never fetches the decorative video. ═══ */
      const LOGO_CFG = { PERIOD_MS: 7000 };
      (function () {
        const link = document.querySelector(".logo");
        const lv = link ? link.querySelector(".logo-video") : null;
        if (!lv) return;
        const saveData = !!(
          navigator.connection && navigator.connection.saveData === true
        );
        if (saveData || reduceMotion) {
          lv.remove();
          return;
        }
        lv.addEventListener("loadeddata", () => link.classList.add("video-on"));
        lv.addEventListener("error", () => {
          if (lv.classList.contains("alpha")) {
            /* webm failed → mp4 chip; text covers the reload gap */
            link.classList.remove("video-on");
            attach(false);
            return;
          }
          link.classList.remove("video-on");
          lv.remove();
        });
        function restart() {
          /* hidden tabs defer the restart until the tab returns (file convention: nothing decodes unseen) */
          if (!lv.isConnected) return;
          if (document.hidden) {
            document.addEventListener("visibilitychange", restart, {
              once: true,
            });
            return;
          }
          lv.currentTime = 0;
          lv.play().catch(() => {});
        }
        lv.addEventListener("ended", () => {
          const wait = Math.max(400, LOGO_CFG.PERIOD_MS - lv.duration * 1000);
          setTimeout(restart, wait);
        });
        document.addEventListener("visibilitychange", () => {
          if (!lv.isConnected) return;
          if (document.hidden) {
            if (!lv.paused) lv.pause();
          } else if (lv.paused && !lv.ended && lv.readyState >= 2)
            lv.play().catch(() => {});
        });
        function attach(alpha) {
          lv.classList.remove("alpha", "chip");
          lv.classList.add(alpha ? "alpha" : "chip");
          lv.preload = "auto";
          lv.src = alpha ? lv.dataset.webm : lv.dataset.src;
          const pr = lv.play();
          if (pr && pr.catch)
            pr.catch(() => {
              if (lv.readyState >= 1) lv.currentTime = 0.001;
              else
                lv.addEventListener(
                  "loadedmetadata",
                  () => {
                    lv.currentTime = 0.001;
                  },
                  { once: true },
                ); /* blocked: static mark until first gesture */
              window.addEventListener(
                "pointerdown",
                () => {
                  if (lv.isConnected) lv.play().catch(() => {});
                },
                { once: true },
              );
            });
        }
        attach(
          !!(lv.dataset.webm && lv.canPlayType('video/webm; codecs="vp9"')),
        );
      })();
