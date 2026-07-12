      import * as THREE from "./vendor/three.module.min.js";

      (function () {
        const canvas = document.getElementById("obj-canvas");
        if (!canvas) return;
        const PAGE_BG =
          getComputedStyle(document.documentElement)
            .getPropertyValue("--bg")
            .trim() || "#E8EDEF";
        /* ── config: base + boot-time media-query overrides (rungs are chosen at boot;
        the watchdog can only move DOWN at runtime) ── */
        const cfg = Object.assign({}, OBJ_CFG);
        cfg.KEYFRAMES = OBJ_CFG.KEYFRAMES.map((keyframe) => ({ ...keyframe }));
        delete cfg.overrides;
        Object.keys(OBJ_CFG.overrides).forEach((q) => {
          if (window.matchMedia(q).matches)
            Object.assign(cfg, OBJ_CFG.overrides[q]);
        });
        if (window.matchMedia("(max-width:920px)").matches) {
          cfg.KEYFRAMES = cfg.KEYFRAMES.map((keyframe) => ({
            ...keyframe,
            x: 50 + (keyframe.x - 50) * 0.62,
            s: keyframe.s * 0.74,
          }));
          cfg.HERO_POSE = { x: 62, y: 64, s: 58 };
        }
        /* The portfolio's central interaction is always live. Accessibility and Data
           Saver still simplify CSS transitions and the decorative logo, but they do
           not disable the Three.js renderer or its scroll choreography. */
        const heroOnly = false;
        const useTransmission = cfg.TRANSMISSION !== false;
        const staticMode = false;
        /* the engine's one reduced-motion gate: used ONLY to suppress the scroll-velocity
           ring-spin boost. The core scroll choreography stays live by design (see the
           heroOnly/staticMode comment above); this const does not disable anything else. */
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;

        /* normalize keyframe channels once: default any omitted viewpoint/env values and
     pre-parse bg into a lerpable THREE.Color */
        cfg.KEYFRAMES.forEach((k) => {
          k.p ??= 0;
          k.r ??= 0;
          k.f ??= 34;
          k.lk ??= 1;
          k.w ??= 0;
          k.pl ??= 0;
          k.form ??= "nest";
          k.formR = cfg.FORMATIONS[k.form] || cfg.FORMATIONS.nest;
          k.bgC = new THREE.Color(k.bg || PAGE_BG);
        });
        const BG0 = new THREE.Color(PAGE_BG);
        /* light-pool tint endpoints + per-frame scratch (linear working space, same
           as every bgC color — the despill mirrors these values term-for-term) */
        const POOL_NEUTRAL = new THREE.Color("#FFFFFF");
        const POOL_WARM = new THREE.Color("#FFC98A");
        const poolTint = new THREE.Color();
        const poolColor = new THREE.Color();

        /* ── renderer — L4 (no WebGL) leaves the SVG fallback visible and exits.
        Probe support on a scratch canvas first: constructing WebGLRenderer on a
        context-less canvas console.errors internally before throwing. ── */
        const probeGl =
          document.createElement("canvas").getContext("webgl2") ||
          document.createElement("canvas").getContext("webgl");
        if (!probeGl) {
          document.dispatchEvent(new CustomEvent("gyre:ready"));
          return;
        }
        let renderer;
        try {
          renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
          });
        } catch (e) {
          document.dispatchEvent(new CustomEvent("gyre:ready"));
          return;
        }
        renderer.setPixelRatio(Math.min(devicePixelRatio, cfg.DPR_MAX));
        renderer.setClearColor(new THREE.Color(PAGE_BG), 1);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.96;
        /* L1 boot rung (≤1080): half-res transmission buffer too — dispersion is already 0
     there, so the watchdog's drop-1 remedy would otherwise be skipped entirely */
        if (
          window.matchMedia("(max-width:1080px)").matches &&
          useTransmission &&
          "transmissionResolutionScale" in renderer
        )
          renderer.transmissionResolutionScale = 0.5;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
        camera.position.set(0, 0, 9);

        /* opaque in-scene backdrop matched to --bg — now a minimal ShaderMaterial:
     per-section tone (uBase) plus a soft "light pool" tracking the object
     (uCenter/uRadius/uStrength). Plateau falloff (g ≡ 1 for d < 0.7R) keeps the
     island's despill exact across the landmass (within ~1.51 wu of center at the
     authored radii); the outermost keyed fringes (swan flight arc, ≤1.84 wu) ride
     the falloff with a graceful ≤~6% drift at the ink stop. Raw ShaderMaterials skip
     tone mapping (≡ the old toneMapped:false) but NOT output encoding — the
     colorspace_fragment include keeps uStrength=0 byte-identical to the old
     MeshBasicMaterial (probe-verified corner pixels). Required: transmission
     renders flat white over an empty canvas and samples OPAQUE objects only —
     transparent stays false. */
        const backdrop = new THREE.Mesh(
          new THREE.PlaneGeometry(400, 400),
          new THREE.ShaderMaterial({
            transparent: false,
            uniforms: {
              uBase: { value: new THREE.Color(PAGE_BG) },
              uPool: { value: new THREE.Color(PAGE_BG) },
              uCenter: { value: new THREE.Vector2(0, 0) },
              uRadius: { value: 1 },
              uStrength: { value: 0 },
            },
            vertexShader: `
              varying vec2 vXY;
              void main() {
                vXY = (modelMatrix * vec4(position, 1.0)).xy;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform vec3 uBase;
              uniform vec3 uPool;
              uniform vec2 uCenter;
              uniform float uRadius;
              uniform float uStrength;
              varying vec2 vXY;
              void main() {
                float d = distance(vXY, uCenter);
                float g = 1.0 - smoothstep(uRadius * 0.7, uRadius, d);
                gl_FragColor = vec4(mix(uBase, uPool, uStrength * g), 1.0);
                #include <colorspace_fragment>
              }
            `,
          }),
        );
        backdrop.position.z = -40;
        scene.add(backdrop);

        /* ── environment: light-gray studio with real darks — glass only reads as glass
        when its reflections contain contrast ── */
        function studioEnv() {
          const env = new THREE.Scene();
          env.background = new THREE.Color("#AEB3B8");
          const add = (w, h, color, x, y, z, ry = 0, rx = 0) => {
            const m = new THREE.Mesh(
              new THREE.PlaneGeometry(w, h),
              new THREE.MeshBasicMaterial({ color }),
            );
            m.position.set(x, y, z);
            m.rotation.y = ry;
            m.rotation.x = rx;
            env.add(m);
          };
          env.add(
            new THREE.Mesh(
              new THREE.BoxGeometry(30, 30, 30),
              new THREE.MeshBasicMaterial({
                color: "#8E9398",
                side: THREE.BackSide,
              }),
            ),
          );
          add(
            12,
            9,
            new THREE.Color("#FFFFFF").multiplyScalar(1.9 * cfg.KEY_INT),
            -9,
            6,
            4,
            Math.PI / 2.6,
          ); /* key */
          add(
            10,
            12,
            new THREE.Color("#E4E7EA").multiplyScalar(
              (1.1 * cfg.FILL_INT) / 0.3,
            ),
            10,
            2,
            2,
            -Math.PI / 2.4,
          );
          add(
            16,
            5,
            new THREE.Color("#F4F6F8").multiplyScalar(1.3),
            0,
            12,
            -2,
            0,
            Math.PI / 2,
          );
          add(24, 24, "#26282B", 0, -13, 0, 0, -Math.PI / 2); /* dark floor */
          add(4, 14, "#26282B", -4, 2, -9, 0.3); /* dark strips */
          add(3, 12, "#26282B", 7, 4, -8, -0.5);
          /* neon SHADE reflections — three large graded panels (amber / cyan /
             blue). The chrome sweeps through them as broad shaded color bands
             baked into the env map, replacing the retired core-reflect point
             light whose sampled color always read as a localized dot. */
          const addShade = (hex, boost, w, h, x, y, z, ry = 0, rx = 0) => {
            const cv = document.createElement("canvas");
            cv.width = 4;
            cv.height = 128;
            const g = cv.getContext("2d");
            const grade = g.createLinearGradient(0, 0, 0, 128);
            grade.addColorStop(0, hex);
            grade.addColorStop(0.42, hex); /* bright neon core */
            grade.addColorStop(1, "#04060A"); /* falls off into the studio darks */
            g.fillStyle = grade;
            g.fillRect(0, 0, 4, 128);
            const tex = new THREE.CanvasTexture(cv);
            tex.colorSpace = THREE.SRGBColorSpace;
            const m = new THREE.Mesh(
              new THREE.PlaneGeometry(w, h),
              new THREE.MeshBasicMaterial({
                map: tex,
                color: new THREE.Color().setScalar(boost),
              }),
            );
            m.position.set(x, y, z);
            m.rotation.y = ry;
            m.rotation.x = rx;
            env.add(m);
          };
          /* all three live in the FRONT hemisphere (z > 0) — face-on glass
             reflects mirrored directions from behind the camera, so back-wall
             panels only ever show up as grazing-edge slivers */
          /* boosts run hot on purpose: face-on clear glass only returns ~4-6% of
             the env (fresnel), and the white key/fill panels otherwise drown the
             color — the neon must win its share of the mirror, not the intensity */
          addShade("#FFB347", 8.5, 13, 12, 4, -9, 6, -Math.PI / 5, -Math.PI / 3); /* neon amber */
          addShade("#3DF2FF", 7.0, 13, 11, -6, 2, 7, Math.PI / 3); /* neon cyan */
          addShade("#3D6BFF", 8.2, 12, 13, 9, 3, 5, -Math.PI / 2.8); /* neon blue */
          const pmrem = new THREE.PMREMGenerator(renderer);
          const tex = pmrem.fromScene(env, 0.04).texture;
          pmrem.dispose();
          return tex;
        }
        scene.environment = studioEnv();

        /* ── the object ── */
        const object = new THREE.Group();
        scene.add(object);

        /* Scroll owns only the parallax container (`object`). Continuous local motion
           lives below `orientationGroup`, so reversing scroll never resets the gyroscope. */
        const orientationGroup = new THREE.Group();
        const outerRingsGroup = new THREE.Group();
        const mechanicalCoreGroup = new THREE.Group();
        object.add(orientationGroup);
        orientationGroup.add(outerRingsGroup, mechanicalCoreGroup);
        /* the island billboard renders at (0,-0.48,0.03) — park the whole ring/core
           system on that same center so the rings visibly SURROUND the island and
           pitch/roll pivot around it, not around a point above it */
        orientationGroup.position.set(0, -0.48, 0.03);

        /* Architectural annular band with broad planar faces, straight inner/outer walls,
           and four tiny chamfers. This avoids the inflated profile of TorusGeometry. */
        function createBandGeometry(
          radius,
          width,
          depth,
          segments = 192,
          bevel = 0.024,
          aspectY = 1,
          wobble = 0,
        ) {
          const inner = radius - width * 0.5;
          const outer = radius + width * 0.5;
          const halfD = depth * 0.5;
          const b = Math.min(bevel, width * 0.22, depth * 0.34);
          const profile = [
            [inner, -halfD + b],
            [inner + b, -halfD],
            [outer - b, -halfD],
            [outer, -halfD + b],
            [outer, halfD - b],
            [outer - b, halfD],
            [inner + b, halfD],
            [inner, halfD - b],
          ];
          const positions = [];
          const uvs = [];
          const indices = [];
          for (let s = 0; s <= segments; s++) {
            const u = s / segments;
            const a = u * Math.PI * 2;
            const ca = Math.cos(a), sa = Math.sin(a);
            const radialWarp = 1 + wobble * Math.sin(a * 3 + 0.65);
            const verticalWarp = 1 + wobble * 0.65 * Math.cos(a * 2 - 0.4);
            profile.forEach(([r, z], p) => {
              positions.push(
                ca * r * radialWarp,
                sa * r * aspectY * verticalWarp,
                z + wobble * depth * Math.sin(a * 2.5),
              );
              uvs.push(u, p / profile.length);
            });
          }
          const stride = profile.length;
          for (let s = 0; s < segments; s++) {
            for (let p = 0; p < stride; p++) {
              const q = (p + 1) % stride;
              const a = s * stride + p;
              const b0 = (s + 1) * stride + p;
              const c = (s + 1) * stride + q;
              const d = s * stride + q;
              indices.push(a, b0, d, b0, c, d);
            }
          }
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
          geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
          geometry.setIndex(indices);
          geometry.computeVertexNormals();
          geometry.computeBoundingSphere();
          return geometry;
        }

        /* unified finish — all four rings: shining clear glass (transmission),
           one continuous optical set. The wet clearcoat carries the reflections:
           the neon shade panels in the environment (amber/cyan/blue graded
           bands) sweep across the glass as broad shaded color, never a body
           tint or a point-light dot. */
        const glassEdgeTints = ["#DCE9EF", "#E3E6EC", "#E8ECEC", "#DFE8EE"];
        const glassMats = cfg.RING_RADII.map(
          (_, i) =>
            new THREE.MeshPhysicalMaterial({
              color: "#EDF2F4",
              metalness: 0,
              roughness: cfg.GLASS_ROUGH + i * 0.006,
              transmission: useTransmission ? 1 : 0,
              transparent: true,
              opacity: useTransmission ? 1 : 0.48,
              ior: cfg.GLASS_IOR,
              thickness: 0.55 + i * 0.05,
              clearcoat: 1,
              clearcoatRoughness: 0.008 /* tighter coat = wetter, shinier highlights */,
              specularIntensity: 1.5 /* lifts face-on reflection so the neon
                 shade bands read across the band, not just at grazing edges */,
              envMapIntensity: 1.75 + i * 0.14,
              attenuationColor: glassEdgeTints[i],
              attenuationDistance: 2.6,
              dispersion: useTransmission ? cfg.DISPERSION : 0,
              side: THREE.DoubleSide,
              depthWrite: false,
            }),
        );

        const rings = cfg.RING_RADII.map((radius, i) => {
          const geometry = createBandGeometry(
            radius,
            cfg.RING_BAND_WIDTH[i],
            cfg.RING_BAND_DEPTH[i],
            innerWidth <= 620 ? 112 : 192,
            0.024,
            cfg.RING_ASPECT_Y[i],
            cfg.RING_WOBBLE[i],
          );
          const ring = new THREE.Mesh(geometry, glassMats[i]);
          const tilt = THREE.MathUtils.degToRad(cfg.RING_TILTS_DEG[i]);
          ring.rotation.set(
            Math.PI / 2 - tilt,
            THREE.MathUtils.degToRad(i * cfg.RING_YAW_OFFSET_DEG),
            THREE.MathUtils.degToRad([-5, 8, -4, 6][i] || 0),
          );
          ring.renderOrder = 10 + i;
          /* no wireframe edge overlay — the reference glass is clean; edge sparkle
             comes from the chamfers catching the env map and the dispersion */
          outerRingsGroup.add(ring);
          return ring;
        });
        const ringBaseQ = rings.map((ring) => ring.quaternion.clone());
        const ringAxes = cfg.RING_LOOP.map((loop) =>
          new THREE.Vector3(...loop.AXIS).normalize(),
        );
        const ringPrecAxes = cfg.RING_LOOP.map((loop) =>
          new THREE.Vector3(...(loop.PRECESS_AXIS || [0, 1, 0])).normalize(),
        );
        const ringSpinAxis = new THREE.Vector3();
        const ringQ = new THREE.Quaternion();
        const precQ = new THREE.Quaternion();
        const coreLayerQ = new THREE.Quaternion();
        /* formation scratch (per-frame, no allocs in the loop) */
        const ringLiveQ = new THREE.Quaternion();
        const ringFormQ = new THREE.Quaternion();
        const ringPlaneQ = new THREE.Quaternion();
        const ringFormE = new THREE.Euler();
        const RING_PLANE_AXIS = new THREE.Vector3(0, 0, 1);

        /* Precision spherical cage: three graphite great-circle ribs create six large
           openings, with polished portal lips clarifying the cut-through silhouette. */
        const graphiteMat = new THREE.MeshPhysicalMaterial({
          color: "#161D23",
          metalness: 0.72,
          roughness: 0.18,
          clearcoat: 0.9,
          clearcoatRoughness: 0.08,
          envMapIntensity: 1.7,
          iridescence: 0.34,
          iridescenceIOR: 1.35,
          transparent: true,
          opacity: 0.94,
        });
        const titaniumMats = ["#79DDEB", "#8C82D9", "#D2A55B"].map((color) =>
          new THREE.MeshPhysicalMaterial({
            color,
            metalness: 0.62,
            roughness: 0.16,
            clearcoat: 1,
            clearcoatRoughness: 0.055,
            envMapIntensity: 1.9,
            iridescence: 0.2,
            iridescenceIOR: 1.3,
          }),
        );
        const coreCage = new THREE.Group();
        mechanicalCoreGroup.add(coreCage);
        const cageGeometry = createBandGeometry(0.72, 0.13, 0.085, 128, 0.016);
        [
          [0, 0, 0],
          [Math.PI / 2, 0, 0],
          [0, Math.PI / 2, 0],
        ].forEach(([x, y, z]) => {
          const rib = new THREE.Mesh(cageGeometry, graphiteMat);
          rib.rotation.set(x, y, z);
          coreCage.add(rib);
        });
        const portalGeometry = new THREE.TorusGeometry(0.325, 0.026, 12, 72);
        const portalDirections = [
          [1, 0, 0], [-1, 0, 0], [0, 1, 0],
          [0, -1, 0], [0, 0, 1], [0, 0, -1],
        ];
        const portalForward = new THREE.Vector3(0, 0, 1);
        portalDirections.forEach((values, i) => {
          const direction = new THREE.Vector3(...values);
          const portal = new THREE.Mesh(portalGeometry, titaniumMats[i % 3]);
          portal.position.copy(direction).multiplyScalar(0.655);
          portal.quaternion.setFromUnitVectors(portalForward, direction);
          portal.scale.setScalar(i < 2 ? 1.04 : 0.96);
          coreCage.add(portal);
        });

        const coreRings = [];
        const coreRingSpecs = [
          [0.54, 0.072, 0.052, [0.35, 0.7, 0.12]],
          [0.43, 0.062, 0.047, [1.05, -0.22, 0.64]],
          [0.33, 0.052, 0.042, [-0.48, 0.9, 1.15]],
        ];
        coreRingSpecs.forEach(([radius, width, depth, rotation], i) => {
          const layer = new THREE.Group();
          layer.rotation.set(...rotation);
          layer.userData.baseQ = layer.quaternion.clone();
          layer.userData.axis = new THREE.Vector3(
            i === 0 ? 0.2 : 1,
            i === 1 ? 0.35 : 0.8,
            i === 2 ? 0.25 : 1,
          ).normalize();
          layer.userData.speed = [0.17, -0.135, 0.105][i];
          const band = new THREE.Mesh(
            createBandGeometry(radius, width, depth, 112, 0.009),
            titaniumMats[i],
          );
          layer.add(band);
          mechanicalCoreGroup.add(layer);
          coreRings.push(layer);
        });

        const nucleusGroup = new THREE.Group();
        const nucleus = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.205, 4),
          new THREE.MeshPhysicalMaterial({
            color: "#C9F4F6",
            metalness: 0.22,
            roughness: 0.12,
            transmission: useTransmission ? 0.32 : 0,
            thickness: 0.5,
            clearcoat: 1,
            clearcoatRoughness: 0.025,
            iridescence: 0.62,
            iridescenceIOR: 1.42,
            envMapIntensity: 2.1,
          }),
        );
        const nucleusGlow = new THREE.Mesh(
          new THREE.SphereGeometry(0.11, 24, 16),
          new THREE.MeshBasicMaterial({
            color: "#8EEBFF",
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
          }),
        );
        nucleusGroup.add(nucleus, nucleusGlow);
        mechanicalCoreGroup.add(nucleusGroup);

        /* Organic mineral core inspired by the reference: an asymmetric, craggy mass
           with charcoal strata and restrained moss/mineral variation. The glass bands
           remain separate so they can counter-rotate around the rock. */
        const mineralCore = (() => {
          const geometry = new THREE.IcosahedronGeometry(1.02, 3);
          const position = geometry.attributes.position;
          const vertex = new THREE.Vector3();
          const normal = new THREE.Vector3();
          const colors = new Float32Array(position.count * 3);
          const dark = new THREE.Color("#171B18");
          const graphite = new THREE.Color("#4B5048");
          const mineral = new THREE.Color("#8A8E7C");
          const moss = new THREE.Color("#687248");
          const color = new THREE.Color();
          const hashMineral = (n) => {
            const value = Math.sin(n * 91.173 + 17.41) * 43758.5453;
            return value - Math.floor(value);
          };

          for (let i = 0; i < position.count; i++) {
            vertex.fromBufferAttribute(position, i);
            normal.copy(vertex).normalize();
            const strata =
              Math.sin(normal.x * 4.7 + normal.y * 2.2) * 0.095 +
              Math.sin(normal.y * 10.8 - normal.z * 5.6) * 0.062;
            const fracture =
              -Math.pow(
                Math.max(
                  0,
                  Math.sin(
                    normal.x * 13.1 +
                      normal.y * 8.3 -
                      normal.z * 11.7,
                  ),
                ),
                8,
              ) * 0.12;
            const grain = (hashMineral(i) - 0.5) * 0.055;
            const displacement = 1 + strata + fracture + grain;
            position.setXYZ(
              i,
              vertex.x * displacement * 1.46,
              vertex.y * displacement * 0.7,
              vertex.z * displacement * 1.02,
            );

            const band =
              0.5 +
              0.5 *
                Math.sin(
                  normal.x * 7.4 + normal.y * 4.2 - normal.z * 6.6,
                );
            color.lerpColors(dark, graphite, 0.22 + band * 0.58);
            if (band > 0.68) color.lerp(mineral, (band - 0.68) * 0.42);
            if (normal.y > 0.16 && band > 0.52)
              color.lerp(moss, Math.min((normal.y - 0.16) * 0.62, 0.34));
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
          }
          geometry.setAttribute(
            "color",
            new THREE.BufferAttribute(colors, 3),
          );
          geometry.computeVertexNormals();
          geometry.computeBoundingSphere();

          const relief = document.createElement("canvas");
          relief.width = relief.height = 192;
          const context = relief.getContext("2d");
          const image = context.createImageData(192, 192);
          for (let y = 0; y < 192; y++) {
            for (let x = 0; x < 192; x++) {
              const value =
                118 +
                46 * Math.sin(x * 0.29 + Math.sin(y * 0.08)) +
                24 * Math.sin(y * 0.51 - x * 0.13) +
                14 * Math.sin((x + y) * 1.31);
              const offset = (y * 192 + x) * 4;
              const shade = Math.max(12, Math.min(242, value));
              image.data[offset] = shade;
              image.data[offset + 1] = shade;
              image.data[offset + 2] = shade;
              image.data[offset + 3] = 255;
            }
          }
          context.putImageData(image, 0, 0);
          const bump = new THREE.CanvasTexture(relief);
          bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
          bump.repeat.set(2.6, 1.9);

          const mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({
              vertexColors: true,
              roughness: 0.89,
              metalness: 0.025,
              bumpMap: bump,
              bumpScale: 0.085,
              envMapIntensity: 0.82,
              flatShading: true,
            }),
          );
          mesh.rotation.set(-0.14, 0.28, -0.08);
          mesh.scale.set(1.12, 0.9, 1);
          mesh.castShadow = false;
          mesh.receiveShadow = false;
          mechanicalCoreGroup.add(mesh);
          return mesh;
        })();

        /* Final animated island: coreRings.mp4 is decoded normally but sampled into a
           1024px canvas at 18fps. This preserves the six-second loop duration while
           giving the texture a deliberate cinematic cadence and bounded GPU uploads. */
        /* keyColor = the clip's measured backdrop plate, #F5F4F6 ≈ rgb(245,244,246)
           (ffprobe-sampled across frames/corners; codec noise spans 242–247). THREE.Color
           parses the hex straight into linear working space — the same space texel.rgb
           is in after the texture's sRGB decode, so the key distance is apples-to-apples. */
        const createCoreKeyMaterial = (keyHex, keyEnabled = 1) =>
          new THREE.ShaderMaterial({
            uniforms: {
              coreMap: { value: null },
              keyColor: { value: new THREE.Color(keyHex) },
              keyEnabled: { value: keyEnabled },
              pageBg: { value: new THREE.Color(PAGE_BG) },
            },
            vertexShader: `
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform sampler2D coreMap;
              uniform vec3 keyColor;
              uniform float keyEnabled;
              uniform vec3 pageBg;
              varying vec2 vUv;
              void main() {
                vec4 texel = texture2D(coreMap, vUv);
                float keyDistance = distance(texel.rgb, keyColor);
                /* window: 0.045 covers the plate's codec noise (alpha hits true 0);
                   kept tight above so the swan/window whites stay opaque */
                float keyedAlpha = smoothstep(0.045, 0.10, keyDistance);
                float alpha = texel.a * mix(1.0, keyedAlpha, keyEnabled);
                /* opaque-cutout threshold: surviving pixels render OPAQUE so the
                   billboard joins the transmission buffer (rings refract the core) */
                if (alpha < 0.45) discard;
                /* despill: semi-keyed pixels blend toward the LIVE page backdrop, so
                   residual plate haze and edge halos match the page, never read white */
                vec3 rgb = mix(pageBg, texel.rgb, mix(1.0, keyedAlpha, keyEnabled));
                gl_FragColor = vec4(rgb, alpha);
                /* texel was decoded sRGB->linear by the texture; without this output
                   encoding the billboard renders visibly darker than the source clip */
                #include <colorspace_fragment>
              }
            `,
            /* NOT transparent: three.js only feeds opaque objects to the glass
               transmission buffer — this is what lets the rings visibly REFRACT
               and cover the core instead of smearing pale backdrop over it */
            transparent: false,
            depthTest: true,
            depthWrite: true,
            side: THREE.DoubleSide,
            toneMapped: false,
          });

        const coreVisualGroup = new THREE.Group();
        object.add(coreVisualGroup);
        const coreImageMaterial = createCoreKeyMaterial("#F5F4F6");
        const coreImage = new THREE.Mesh(
          new THREE.PlaneGeometry(3.24, 3.24),
          coreImageMaterial,
        );
        coreImage.position.set(0, -0.48, 0.03);
        coreImage.renderOrder = 2;
        coreImage.visible = false;
        coreVisualGroup.add(coreImage);

        let coreAssetReady = false;
        let gyreReadySent = false;
        const signalGyreReady = () => {
          if (!coreAssetReady || !firstFrame || gyreReadySent) return;
          gyreReadySent = true;
          document.dispatchEvent(new CustomEvent("gyre:ready"));
        };

        let fallbackStarted = false;
        const activateStaticFallback = () => {
          if (fallbackStarted || coreAssetReady) return;
          fallbackStarted = true;
          new THREE.TextureLoader().load(
            "./pictures/automat-core.webp",
            (texture) => {
              texture.colorSpace = THREE.SRGBColorSpace;
              texture.anisotropy = Math.min(
                8,
                renderer.capabilities.getMaxAnisotropy(),
              );
              coreImageMaterial.uniforms.coreMap.value = texture;
              coreImageMaterial.uniforms.keyEnabled.value = 0;
              coreImage.visible = true;
              mineralCore.visible = false;
              coreAssetReady = true;
              signalGyreReady();
            },
            undefined,
            () => {
              /* Keep the procedural mineral if both final video and poster fail. */
              coreAssetReady = true;
              signalGyreReady();
            },
          );
        };

        const CORE_VIDEO_FPS = 18;
        const CORE_FRAME_MS = 1000 / CORE_VIDEO_FPS;
        const coreVideoCanvas = document.createElement("canvas");
        coreVideoCanvas.width = 1024;
        coreVideoCanvas.height = 1024;
        const coreVideoContext = coreVideoCanvas.getContext("2d", {
          alpha: false,
          desynchronized: true,
        });
        const coreVideoTexture = new THREE.CanvasTexture(coreVideoCanvas);
        coreVideoTexture.colorSpace = THREE.SRGBColorSpace;
        coreVideoTexture.minFilter = THREE.LinearFilter;
        coreVideoTexture.magFilter = THREE.LinearFilter;
        coreVideoTexture.generateMipmaps = false;
        let nextCoreFrameAt = 0;

        const coreVideo = document.createElement("video");
        coreVideo.muted = true;
        coreVideo.defaultMuted = true;
        coreVideo.loop = true;
        coreVideo.autoplay = true;
        coreVideo.playsInline = true;
        coreVideo.preload = "auto";
        coreVideo.disablePictureInPicture = true;
        coreVideo.setAttribute("playsinline", "");
        coreVideo.setAttribute("aria-hidden", "true");
        coreVideo.tabIndex = -1;
        coreVideo.style.cssText =
          "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;inset:auto 0 0 auto";
        document.body.appendChild(coreVideo);

        const ensureCoreVideoPlaying = () => {
          if (!coreVideo.isConnected && !coreVideo.src) return;
          coreVideo.play().catch(() => {
            window.addEventListener(
              "pointerdown",
              () => coreVideo.play().catch(activateStaticFallback),
              { once: true },
            );
          });
        };

        const updateCoreVideoTexture = (now, force = false) => {
          if (coreVideo.readyState < 2) return;
          if (!force && (coreVideo.paused || now < nextCoreFrameAt)) return;
          coreVideoContext.drawImage(
            coreVideo,
            0,
            0,
            coreVideoCanvas.width,
            coreVideoCanvas.height,
          );
          coreVideoTexture.needsUpdate = true;
          nextCoreFrameAt = now + CORE_FRAME_MS;
        };
        let videoCoreActivated = false;
        const activateVideoCore = () => {
          if (videoCoreActivated) return;
          videoCoreActivated = true;
          updateCoreVideoTexture(performance.now(), true);
          coreImageMaterial.uniforms.coreMap.value = coreVideoTexture;
          coreImageMaterial.uniforms.keyEnabled.value = 1;
          coreImage.visible = true;
          mineralCore.visible = false;
          coreAssetReady = true;
          signalGyreReady();
          ensureCoreVideoPlaying();
        };
        coreVideo.addEventListener("loadeddata", activateVideoCore, {
          once: true,
        });
        coreVideo.addEventListener("canplay", activateVideoCore, {
          once: true,
        });
        coreVideo.addEventListener("error", activateStaticFallback, {
          once: true,
        });
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) coreVideo.pause();
          else ensureCoreVideoPlaying();
        });
        coreVideo.src = "./videos/coreRings.mp4";
        coreVideo.load();
        ensureCoreVideoPlaying();

        /* Retain the precision-core geometry for easy iteration, but let the new mineral
           mass define the visible silhouette. */
        coreCage.visible = false;
        coreRings.forEach((layer) => (layer.visible = false));
        nucleusGroup.visible = false;

        /* ═══ four-season engine ═══
           One looping cycle on the idle clock (freezes with the render loop):
           spring → summer → fall → winter, cfg.SEASON_S each, SEASON_FADE_S
           crossfade. Every season contributes (a) a looping particle overlay
           around the core, (b) a particle stream riding each ring (children of
           the ring meshes, so they tumble with them), (c) glass tint/roughness
           targets. Exactly two seasons are ever visible (during a fade). */
        const SEASONS = [
          {
            key: "spring",
            glass: { atten: "#EED9EA", body: "#F3EFF5", rough: 0.03 },
            ring: { sprite: "flower", colors: ["#F7A8C4", "#FFFFFF", "#F9E27D"], count: 46, size: 0.085, flow: 0.35, opacity: 0.9, additive: false },
            core: { sprite: "flower", colors: ["#F7A8C4", "#FFD7E6", "#FFFFFF"], count: 110, size: 0.1, speed: 0.16, sway: 0.35, dir: 1, opacity: 0.95, additive: false },
          },
          {
            key: "summer",
            glass: { atten: "#9FD9EC", body: "#EAF7FB", rough: 0.02 },
            ring: { sprite: "glow", colors: ["#CBEFFB", "#FFFFFF", "#8FD4EF"], count: 64, size: 0.065, flow: 1.0, opacity: 0.85, additive: true },
            core: { sprite: "glow", colors: ["#FFC46B", "#FF9D45", "#FFE9A8"], count: 90, size: 0.08, speed: 0.3, sway: 0.2, dir: 1, opacity: 0.8, additive: true },
          },
          {
            key: "fall",
            glass: { atten: "#E9D2B4", body: "#F3EDE4", rough: 0.05 },
            ring: { sprite: "leaf", colors: ["#C4452B", "#E8A93C", "#E07B5F"], count: 40, size: 0.11, flow: 0.5, opacity: 0.95, additive: false },
            core: { sprite: "leaf", colors: ["#C4452B", "#E8A93C", "#E07B5F"], count: 110, size: 0.12, speed: 0.2, sway: 0.6, dir: -1, opacity: 0.95, additive: false },
          },
          {
            key: "winter",
            glass: { atten: "#DCEBF6", body: "#F0F5F9", rough: 0.08 },
            ring: { sprite: "flake", colors: ["#FFFFFF", "#DCEBFA", "#BFD9F2"], count: 84, size: 0.055, flow: 0.22, opacity: 0.95, additive: false },
            core: { sprite: "flake", colors: ["#FFFFFF", "#EAF3FB"], count: 130, size: 0.075, speed: 0.11, sway: 0.25, dir: -1, opacity: 0.95, additive: false },
          },
        ];
        const seasonHash = (n) => {
          const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
          return v - Math.floor(v);
        };
        /* white-on-transparent sprites; vertex colors do the tinting */
        const makeSeasonSprite = (kind) => {
          const cnv = document.createElement("canvas");
          cnv.width = cnv.height = 64;
          const x = cnv.getContext("2d");
          x.fillStyle = "#fff";
          x.strokeStyle = "#fff";
          if (kind === "flower") {
            for (let p = 0; p < 5; p++) {
              const a = (p / 5) * Math.PI * 2;
              x.beginPath();
              x.ellipse(32 + Math.cos(a) * 12, 32 + Math.sin(a) * 12, 9, 9, 0, 0, Math.PI * 2);
              x.fill();
            }
            x.beginPath();
            x.arc(32, 32, 6, 0, Math.PI * 2);
            x.fill();
          } else if (kind === "leaf") {
            x.translate(32, 32);
            x.rotate(-0.6);
            x.beginPath();
            x.moveTo(0, -20);
            x.quadraticCurveTo(15, -6, 0, 20);
            x.quadraticCurveTo(-15, -6, 0, -20);
            x.fill();
          } else if (kind === "flake") {
            x.translate(32, 32);
            x.lineWidth = 4;
            x.lineCap = "round";
            for (let p = 0; p < 6; p++) {
              x.rotate(Math.PI / 3);
              x.beginPath();
              x.moveTo(0, 4);
              x.lineTo(0, -20);
              x.stroke();
            }
          } else {
            /* glow: soft radial puff (summer embers + water sparkle) */
            const g = x.createRadialGradient(32, 32, 0, 32, 32, 30);
            g.addColorStop(0, "rgba(255,255,255,1)");
            g.addColorStop(0.55, "rgba(255,255,255,.55)");
            g.addColorStop(1, "rgba(255,255,255,0)");
            x.fillStyle = g;
            x.fillRect(0, 0, 64, 64);
          }
          const t = new THREE.CanvasTexture(cnv);
          t.colorSpace = THREE.SRGBColorSpace;
          return t;
        };
        const seasonSprites = {
          flower: makeSeasonSprite("flower"),
          glow: makeSeasonSprite("glow"),
          leaf: makeSeasonSprite("leaf"),
          flake: makeSeasonSprite("flake"),
        };
        const makeSeasonMat = (spriteKey, size, additive) =>
          new THREE.PointsMaterial({
            size,
            map: seasonSprites[spriteKey],
            vertexColors: true,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
            alphaTest: 0.02,
            toneMapped: false,
          });
        const seasonFillColors = (colors, count, salt) => {
          const col = new Float32Array(count * 3);
          const c = new THREE.Color();
          for (let k = 0; k < count; k++) {
            c.set(colors[Math.floor(seasonHash(salt + k) * colors.length)]);
            col[k * 3] = c.r;
            col[k * 3 + 1] = c.g;
            col[k * 3 + 2] = c.b;
          }
          return col;
        };

        /* core overlays: a looping band around the island (rise for spring/summer,
           fall for autumn/winter); positions rewritten each frame while visible */
        const CORE_BAND = { x: 1.95, yMin: -2.0, yMax: 1.45, zMin: -0.85, zMax: 1.15 };
        const coreSeasonFx = SEASONS.map((s, si) => {
          const n = s.core.count;
          const geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
          geo.setAttribute("color", new THREE.BufferAttribute(seasonFillColors(s.core.colors, n, si * 7919), 3));
          const seed = [];
          for (let k = 0; k < n; k++)
            seed.push({
              x0: (seasonHash(si * 1000 + k) * 2 - 1) * CORE_BAND.x,
              y0: seasonHash(si * 2000 + k) * (CORE_BAND.yMax - CORE_BAND.yMin),
              z0: CORE_BAND.zMin + seasonHash(si * 3000 + k) * (CORE_BAND.zMax - CORE_BAND.zMin),
              ph: seasonHash(si * 4000 + k) * Math.PI * 2,
              sp: 0.7 + seasonHash(si * 5000 + k) * 0.6,
            });
          const pts = new THREE.Points(geo, makeSeasonMat(s.core.sprite, s.core.size, s.core.additive));
          pts.visible = false;
          pts.renderOrder = 8;
          pts.frustumCulled = false;
          coreVisualGroup.add(pts);
          return { pts, seed, cfg: s.core };
        });
        const updateCoreSeasonFx = (fx, t, w) => {
          fx.pts.material.opacity = fx.cfg.opacity * w;
          fx.pts.visible = w > 0.003;
          if (!fx.pts.visible) return;
          const arr = fx.pts.geometry.attributes.position.array;
          const span = CORE_BAND.yMax - CORE_BAND.yMin;
          for (let k = 0; k < fx.seed.length; k++) {
            const sd = fx.seed[k];
            const travel = (sd.y0 + t * fx.cfg.speed * sd.sp) % span;
            arr[k * 3] = sd.x0 + Math.sin(t * 0.7 * sd.sp + sd.ph) * fx.cfg.sway;
            arr[k * 3 + 1] =
              fx.cfg.dir > 0 ? CORE_BAND.yMin + travel : CORE_BAND.yMax - travel;
            arr[k * 3 + 2] = sd.z0 + Math.cos(t * 0.45 + sd.ph) * 0.1;
          }
          fx.pts.geometry.attributes.position.needsUpdate = true;
        };

        /* ring streams: particles seeded on each band's circumference as CHILDREN
           of the ring mesh — they tumble with it; local-Z rotation makes them
           flow along the band (water/snow-string/petal/leaf streams) */
        const ringSeasonFx = rings.map((ring, ri) =>
          SEASONS.map((s, si) => {
            const n = s.ring.count;
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(n * 3);
            const R = cfg.RING_RADII[ri];
            for (let k = 0; k < n; k++) {
              const a = (k / n) * Math.PI * 2 + seasonHash(ri * 77 + si * 913 + k) * 0.5;
              const rr = R + (seasonHash(ri * 131 + si * 517 + k) - 0.5) * cfg.RING_BAND_WIDTH[ri] * 1.4;
              pos[k * 3] = Math.cos(a) * rr;
              pos[k * 3 + 1] = Math.sin(a) * rr;
              pos[k * 3 + 2] =
                (seasonHash(ri * 313 + si * 271 + k) - 0.5) * cfg.RING_BAND_DEPTH[ri] * 2.4;
            }
            geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
            geo.setAttribute("color", new THREE.BufferAttribute(seasonFillColors(s.ring.colors, n, ri * 3571 + si * 6373), 3));
            const pts = new THREE.Points(geo, makeSeasonMat(s.ring.sprite, s.ring.size, s.ring.additive));
            pts.visible = false;
            pts.renderOrder = 24 + ri;
            pts.frustumCulled = false;
            ring.add(pts);
            return { pts, flow: s.ring.flow, op: s.ring.opacity };
          }),
        );

        const smooth01 = (a, b, x) => {
          const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
          return u * u * (3 - 2 * u);
        };
        const seasonWeights = (t) => {
          const total = SEASONS.length * cfg.SEASON_S;
          const tt = ((t % total) + total) % total;
          const i = Math.floor(tt / cfg.SEASON_S);
          const blend = smooth01(cfg.SEASON_S - cfg.SEASON_FADE_S, cfg.SEASON_S, tt - i * cfg.SEASON_S);
          return { i, j: (i + 1) % SEASONS.length, blend };
        };

        const particleCount = innerWidth <= 620 ? 42 : 86;
        const particlePositions = new Float32Array(particleCount * 3);
        const particleColors = new Float32Array(particleCount * 3);
        const particlePalette = [
          new THREE.Color("#BCEFFF"),
          new THREE.Color("#C9C0FF"),
          new THREE.Color("#E9C989"),
        ];
        const hashParticle = (n) => {
          const value = Math.sin(n * 91.17) * 43758.5453;
          return value - Math.floor(value);
        };
        for (let i = 0; i < particleCount; i++) {
          const y = hashParticle(i * 3.1 + 2) * 2 - 1;
          const angle = hashParticle(i * 7.7 + 4) * Math.PI * 2;
          const radius = 0.88 + hashParticle(i * 5.3 + 8) * 1.45;
          const radial = Math.sqrt(1 - y * y);
          particlePositions[i * 3] = Math.cos(angle) * radial * radius;
          particlePositions[i * 3 + 1] = y * radius;
          particlePositions[i * 3 + 2] = Math.sin(angle) * radial * radius;
          const color = particlePalette[i % particlePalette.length];
          particleColors[i * 3] = color.r;
          particleColors[i * 3 + 1] = color.g;
          particleColors[i * 3 + 2] = color.b;
        }
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute(
          "position",
          new THREE.BufferAttribute(particlePositions, 3),
        );
        particleGeometry.setAttribute(
          "color",
          new THREE.BufferAttribute(particleColors, 3),
        );
        const coreParticles = new THREE.Points(
          particleGeometry,
          new THREE.PointsMaterial({
            size: innerWidth <= 620 ? 0.018 : 0.022,
            vertexColors: true,
            transparent: true,
            opacity: 0.54,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
          }),
        );
        orientationGroup.add(coreParticles);
        const coreContactGlow = new THREE.PointLight(0x82eaff, 0.55, 3.1, 2);
        mechanicalCoreGroup.add(coreContactGlow);

        /* Legacy organic-core builder retained temporarily behind a dead branch so the
           surrounding page diff stays isolated; no geometry/materials are constructed. */
        if (false) {

        /* Optical glass rings: transmission supplies the body/refraction while a very
     thin additive spectral shell gives older Three builds a restrained rainbow edge. */
        const glassMats = cfg.RING_RADII.map(
          (_, i) =>
            new THREE.MeshPhysicalMaterial({
              color: cfg.GLASS_TINT,
              metalness: 0,
              roughness: cfg.GLASS_ROUGH + i * 0.006,
              transmission: useTransmission ? 0.985 : 0,
              thickness: 0.2 + i * 0.035,
              ior: cfg.GLASS_IOR,
              transparent: true,
              opacity: useTransmission ? 1 : 0.46,
              clearcoat: 1,
              clearcoatRoughness: 0.006,
              envMapIntensity: 3.25 + i * 0.36,
              attenuationColor: i === 1 ? "#C9E9F2" : "#F4EAF7",
              attenuationDistance: 1.15,
              side: THREE.DoubleSide,
            }),
        );

        const rings = cfg.RING_RADII.map((R, i) => {
          const ringGeo = new THREE.TorusGeometry(R, cfg.RING_TUBE[i], 64, 240);
          const m = new THREE.Mesh(ringGeo, glassMats[i]);
          const spectralGeo = ringGeo.clone();
          const spectralColors = new Float32Array(spectralGeo.attributes.position.count * 3);
          const spectralColor = new THREE.Color();
          const spectralPos = spectralGeo.attributes.position;
          for (let v = 0; v < spectralPos.count; v++) {
            const hue = (Math.atan2(spectralPos.getY(v), spectralPos.getX(v)) / (Math.PI * 2) + 1 + i * .12) % 1;
            spectralColor.setHSL(hue, .88, .67);
            spectralColors[v * 3] = spectralColor.r;
            spectralColors[v * 3 + 1] = spectralColor.g;
            spectralColors[v * 3 + 2] = spectralColor.b;
          }
          spectralGeo.setAttribute("color", new THREE.BufferAttribute(spectralColors, 3));
          const spectralShell = new THREE.Mesh(
            spectralGeo,
            new THREE.MeshBasicMaterial({
              vertexColors: true,
              transparent: true,
              opacity: .28,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              toneMapped: false,
            }),
          );
          spectralShell.scale.setScalar(1.018);
          spectralShell.renderOrder = 3;
          m.add(spectralShell);
          const tilt = THREE.MathUtils.degToRad(cfg.RING_TILTS_DEG[i]);
          m.rotation.set(
            Math.PI / 2 - tilt,
            THREE.MathUtils.degToRad(i * cfg.RING_YAW_OFFSET_DEG),
            0,
          );
          /* Compress only the tube's local depth, producing a slim crystal ribbon
             while preserving the authored circular orbit and ring choreography. */
          m.scale.z = 0.56 + i * 0.04;
          object.add(m);
          return m;
        });
        /* per-ring loop rig: authored tilts become base quaternions; each frame the
     ring's accumulated loop angle is composed IN FRONT of its base */
        const ringBaseQ = rings.map((r) => r.quaternion.clone());
        const ringAxes = cfg.RING_LOOP.map((l) =>
          new THREE.Vector3(...l.AXIS).normalize(),
        );
        const ringQ = new THREE.Quaternion();

        /* orbital particles: two lightweight point-cloud ribbons parented to the rings,
     so every spark inherits the authored tilt and continuous loop motion. */
        const ringParticles = rings.map((ring, ringIndex) => {
          const count = innerWidth <= 620 ? 70 : 130;
          const positions = new Float32Array(count * 3);
          const colors = new Float32Array(count * 3);
          const amber = new THREE.Color(cfg.ACCENT_RIM_COLOR);
          const ice = new THREE.Color("#EAF7FF");
          for (let i = 0; i < count; i++) {
            const a =
              (i / count) * Math.PI * 2 +
              hashParticle(i + ringIndex * 211) * 0.08;
            const radius =
              cfg.RING_RADII[ringIndex] +
              (hashParticle(i * 3.7 + 9) - 0.5) * 0.24;
            positions[i * 3] = Math.cos(a) * radius;
            positions[i * 3 + 1] = Math.sin(a) * radius;
            positions[i * 3 + 2] = (hashParticle(i * 8.1 + 4) - 0.5) * 0.18;
            const c = i % 7 === 0 ? amber : ice;
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
          }
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3),
          );
          geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
          const material = new THREE.PointsMaterial({
            size: ringIndex ? 0.035 : 0.028,
            vertexColors: true,
            transparent: true,
            opacity: 0.84,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
          });
          const cloud = new THREE.Points(geometry, material);
          ring.add(cloud);
          return cloud;
        });

        function hashParticle(n) {
          const s = Math.sin(n * 91.17) * 43758.5453;
          return s - Math.floor(s);
        }

        /* Organic monolith: a high-resolution, asymmetrically warped icosphere with
     mineral/moss vertex variation and procedural micro-relief. */
        const hash = (n) => {
          const s = Math.sin(n) * 43758.5453;
          return s - Math.floor(s);
        };
        const rock = (() => {
          const geo = new THREE.IcosahedronGeometry(0.86, 4);
          const pos = geo.attributes.position,
            v = new THREE.Vector3();
          for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            const n = v.clone().normalize();
            const broad =
              Math.sin(n.x * 3.4 + Math.sin(n.y * 2.7)) * .075 +
              Math.sin(n.y * 5.1 - n.z * 3.2) * .045 +
              Math.sin((n.x + n.z) * 9.2) * .022;
            const pits = -Math.pow(Math.max(0, Math.sin(n.x * 12.3 + n.y * 8.7 - n.z * 10.1)), 7) * .055;
            const d = 1 + broad + pits;
            pos.setXYZ(v.x * d * 1.16, v.y * d * .91, v.z * d * 1.02);
          }
          geo.computeVertexNormals();
          const dark = new THREE.Color(cfg.ROCK_SHADE_DARK),
            light = new THREE.Color(cfg.ROCK_SHADE_LIGHT);
          const colors = new Float32Array(geo.attributes.position.count * 3),
            c = new THREE.Color();
          for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i).normalize();
            const mineral = .5 + .5 * Math.sin(v.x * 8.4 + v.y * 4.1 - v.z * 6.8);
            c.lerpColors(dark, light, .16 + mineral * .48);
            if (v.y > .12 && mineral > .58) c.lerp(new THREE.Color("#667052"), .28);
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
          }
          geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
          const relief = document.createElement("canvas");
          relief.width = relief.height = 256;
          const reliefCtx = relief.getContext("2d");
          const reliefData = reliefCtx.createImageData(256, 256);
          for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
            const grain =
              128 + 38 * Math.sin(x * .31 + Math.sin(y * .07)) +
              26 * Math.sin(y * .53 - x * .11) +
              16 * Math.sin((x + y) * 1.37);
            const p = (y * 256 + x) * 4;
            const g = Math.max(18, Math.min(238, grain));
            reliefData.data[p] = reliefData.data[p + 1] = reliefData.data[p + 2] = g;
            reliefData.data[p + 3] = 255;
          }
          reliefCtx.putImageData(reliefData, 0, 0);
          const reliefTexture = new THREE.CanvasTexture(relief);
          reliefTexture.wrapS = reliefTexture.wrapT = THREE.RepeatWrapping;
          reliefTexture.repeat.set(2.4, 1.8);
          const mesh = new THREE.Mesh(
            geo,
            new THREE.MeshStandardMaterial({
              vertexColors: true,
              roughness: cfg.ROCK_ROUGH,
              metalness: cfg.ROCK_METAL,
              envMapIntensity: 0.42,
              bumpMap: reliefTexture,
              bumpScale: .075,
            }),
          );
          object.add(mesh);
          return mesh;
        })();

        /* facet table: center, outward normal, area — for traces + glyph placement */
        const facets = cfg.ROCK_TRACES > 0 ? (() => {
          const p = rock.geometry.attributes.position,
            index = rock.geometry.index,
            out = [];
          const a = new THREE.Vector3(),
            b = new THREE.Vector3(),
            c3 = new THREE.Vector3();
          const ab = new THREE.Vector3(),
            ac = new THREE.Vector3(),
            n = new THREE.Vector3();
          const triangleCount = index ? index.count / 3 : p.count / 3;
          for (let f = 0; f < triangleCount; f++) {
            const ia = index ? index.getX(f * 3) : f * 3;
            const ib = index ? index.getX(f * 3 + 1) : f * 3 + 1;
            const ic = index ? index.getX(f * 3 + 2) : f * 3 + 2;
            a.fromBufferAttribute(p, ia);
            b.fromBufferAttribute(p, ib);
            c3.fromBufferAttribute(p, ic);
            ab.subVectors(b, a);
            ac.subVectors(c3, a);
            n.crossVectors(ab, ac);
            out.push({
              a: a.clone(),
              b: b.clone(),
              c: c3.clone(),
              center: new THREE.Vector3()
                .addVectors(a, b)
                .add(c3)
                .divideScalar(3),
              normal: n.clone().normalize(),
              area: n.length() / 2,
            });
          }
          return out;
        })() : [];

        /* modular armor: panels stand slightly proud of the core, exposing purposeful
     seams and illuminated connection points like an assembled technical system. */
        const moduleGroup = new THREE.Group();
        rock.add(moduleGroup);
        moduleGroup.visible = false;
        const modulePanels = [];
        const directions = [
          [1, 0, 0],
          [-1, 0, 0],
          [0, 1, 0],
          [0, -1, 0],
          [0, 0, 1],
          [0, 0, -1],
          [1, 1, 1],
          [-1, 1, 1],
          [1, -1, 1],
          [1, 1, -1],
          [-1, -1, 1],
          [-1, 1, -1],
        ].map((v) => new THREE.Vector3(...v).normalize());
        const panelGeo = new THREE.BoxGeometry(0.31, 0.23, 0.075);
        const panelMats = [
          new THREE.MeshPhysicalMaterial({
            color: "#AEB8C2",
            metalness: 0.92,
            roughness: 0.16,
            clearcoat: 0.8,
          }),
          new THREE.MeshPhysicalMaterial({
            color: "#242A31",
            metalness: 0.8,
            roughness: 0.25,
            clearcoat: 0.65,
          }),
        ];
        const nodeGeo = new THREE.SphereGeometry(0.035, 12, 12);
        const nodeWhite = new THREE.MeshBasicMaterial({
          color: "#EAF7FF",
          toneMapped: false,
        });
        const nodeAmber = new THREE.MeshBasicMaterial({
          color: cfg.ACCENT_RIM_COLOR,
          toneMapped: false,
        });
        const forward = new THREE.Vector3(0, 0, 1);
        directions.forEach((dir, i) => {
          const panel = new THREE.Mesh(panelGeo, panelMats[i % 2]);
          panel.position.copy(dir).multiplyScalar(0.76);
          panel.quaternion.setFromUnitVectors(forward, dir);
          panel.scale.set(
            0.8 + hash(i * 3 + 1) * 0.45,
            0.8 + hash(i * 7 + 2) * 0.35,
            1,
          );
          panel.userData.basePosition = panel.position.clone();
          panel.userData.phase = i * 0.57;
          moduleGroup.add(panel);
          modulePanels.push(panel);
          const edge = new THREE.LineSegments(
            new THREE.EdgesGeometry(panelGeo),
            new THREE.LineBasicMaterial({
              color: i % 3 === 0 ? cfg.ACCENT_RIM_COLOR : "#D8E0E7",
              transparent: true,
              opacity: 0.5,
              toneMapped: false,
            }),
          );
          panel.add(edge);
          const node = new THREE.Mesh(
            nodeGeo,
            i % 4 === 0 ? nodeAmber : nodeWhite,
          );
          node.position.copy(dir).multiplyScalar(0.835);
          moduleGroup.add(node);
        });

        /* structural braces make project engineering explicit: visible load paths and
     connection logic rather than a generic decorative orb. */
        const braceMat = new THREE.MeshStandardMaterial({
          color: "#606B75",
          metalness: 0.9,
          roughness: 0.2,
        });
        const addBrace = (a, b) => {
          const delta = new THREE.Vector3().subVectors(b, a);
          const brace = new THREE.Mesh(
            new THREE.CylinderGeometry(0.014, 0.014, delta.length(), 8),
            braceMat,
          );
          brace.position.copy(a).add(b).multiplyScalar(0.5);
          brace.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            delta.clone().normalize(),
          );
          moduleGroup.add(brace);
        };
        [
          [0, 2],
          [2, 5],
          [5, 1],
          [1, 3],
          [3, 4],
          [4, 0],
          [6, 7],
          [7, 11],
          [11, 9],
          [9, 6],
        ].forEach(([a, b]) =>
          addBrace(
            directions[a].clone().multiplyScalar(0.82),
            directions[b].clone().multiplyScalar(0.82),
          ),
        );
        const coreCage = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.88, 2),
          new THREE.MeshBasicMaterial({
            color: "#DCE5EC",
            wireframe: true,
            transparent: true,
            opacity: 0.12,
            toneMapped: false,
          }),
        );
        rock.add(coreCage);
        coreCage.visible = false;

        /* data field retained under the dustCloud name for the shared animation path. */
        const dataCount = innerWidth <= 620 ? 70 : 160;
        const dataPos = new Float32Array(dataCount * 3);
        for (let i = 0; i < dataCount; i++) {
          const y = hash(i * 4.19 + 1) * 2 - 1,
            a = hash(i * 8.73 + 4) * Math.PI * 2,
            r = 0.9 + hash(i * 3.17 + 7) * 0.28;
          const radial = Math.sqrt(1 - y * y);
          dataPos[i * 3] = Math.cos(a) * radial * r;
          dataPos[i * 3 + 1] = y * r;
          dataPos[i * 3 + 2] = Math.sin(a) * radial * r;
        }
        const dataGeo = new THREE.BufferGeometry();
        dataGeo.setAttribute("position", new THREE.BufferAttribute(dataPos, 3));
        const dustCloud = new THREE.Points(
          dataGeo,
          new THREE.PointsMaterial({
            color: "#C8E8FF",
            size: 0.018,
            transparent: true,
            opacity: 0.42,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
          }),
        );
        rock.add(dustCloud);
        const waterMats = [];

        /* ── rock instrumentation: circuit traces + solder dots + engraved glyphs.
        All children of the rock mesh (inherit every rotation), all deterministic
        (hash(), no Math.random), all monochrome except DOT_AMBER_COUNT dots. ── */
        const pulseMats =
          []; /* materials whose opacity breathes on the idle clock (userData: baseOpacity, amp, phase) */
        if (cfg.ROCK_TRACES > 0) {
          /* traces: random-walk nearest unvisited facet centers, lifted along normals.
       One LineSegments per trace — each gets its own material so the pulse can
       stagger per-trace (addendum A3: signal drift, not a blink). */
          const dotInfo = [];
          for (let t = 0; t < cfg.ROCK_TRACES; t++) {
            const tracePts = [];
            let idx =
              Math.floor(hash(t * 7.31 + 2) * facets.length) % facets.length;
            const visited = new Set([idx]);
            const steps =
              3 + Math.floor(hash(t * 3.17 + 5) * 3); /* 3-5 segments */
            let prev = facets[idx];
            dotInfo.push(
              prev.center.clone().addScaledVector(prev.normal, cfg.TRACE_LIFT),
            );
            for (let s = 0; s < steps; s++) {
              let best = -1,
                bestD = 1e9;
              for (let f = 0; f < facets.length; f++) {
                if (visited.has(f)) continue;
                const d = facets[f].center.distanceToSquared(prev.center);
                if (d < bestD) {
                  bestD = d;
                  best = f;
                }
              }
              if (best < 0) break;
              visited.add(best);
              const cur2 = facets[best];
              tracePts.push(
                prev.center
                  .clone()
                  .addScaledVector(prev.normal, cfg.TRACE_LIFT),
                cur2.center
                  .clone()
                  .addScaledVector(cur2.normal, cfg.TRACE_LIFT),
              );
              prev = cur2;
            }
            dotInfo.push(
              prev.center.clone().addScaledVector(prev.normal, cfg.TRACE_LIFT),
            );
            const mat = new THREE.LineBasicMaterial({
              color: cfg.TRACE_COLOR,
              transparent: true,
              opacity: cfg.TRACE_OPACITY,
              toneMapped: false,
            });
            mat.userData = {
              baseOpacity: cfg.TRACE_OPACITY,
              amp: cfg.PULSE_AMP,
              phase: t * cfg.PULSE_STAGGER_S,
            };
            pulseMats.push(mat);
            rock.add(
              new THREE.LineSegments(
                new THREE.BufferGeometry().setFromPoints(tracePts),
                mat,
              ),
            );
          }

          /* solder dots at trace endpoints — amber only on the 3 highest (upper-hemisphere)
       dots, the object's single accent family */
          const dotGeo = new THREE.SphereGeometry(0.018, 8, 8);
          const whiteDot = new THREE.MeshBasicMaterial({
            color: "#FFFFFF",
            transparent: true,
            opacity: 0.7,
            toneMapped: false,
          });
          const amberDot = new THREE.MeshBasicMaterial({
            color: cfg.ACCENT_RIM_COLOR,
            transparent: true,
            opacity: 0.85,
            toneMapped: false,
          });
          whiteDot.userData = {
            baseOpacity: 0.7,
            amp: cfg.PULSE_AMP,
            phase: 0,
          };
          amberDot.userData = {
            baseOpacity: 0.85,
            amp: cfg.PULSE_AMP_AMBER,
            phase: 1.7,
          };
          pulseMats.push(whiteDot, amberDot);
          const byHeight = dotInfo
            .map((pt, i) => [pt.y, i])
            .sort((a, b) => b[0] - a[0]);
          const amberSet = new Set(
            byHeight.slice(0, cfg.DOT_AMBER_COUNT).map((e) => e[1]),
          );
          dotInfo.forEach((pt, i) => {
            const d = new THREE.Mesh(
              dotGeo,
              amberSet.has(i) ? amberDot : whiteDot,
            );
            d.position.copy(pt);
            rock.add(d);
          });

          /* engraved glyphs — coding · design · programming marks on the 4 largest facets,
       spread by direction so at least one faces the camera at most poses */
          const drawGlyph = (draw) => {
            const cv = document.createElement("canvas");
            cv.width = cv.height = 128;
            const ctx = cv.getContext("2d");
            ctx.strokeStyle = ctx.fillStyle = "#FFFFFF";
            ctx.lineWidth = 5;
            ctx.lineCap = "round";
            ctx.font = "600 62px ui-monospace,Menlo,monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            draw(ctx);
            const tex = new THREE.CanvasTexture(cv);
            tex.anisotropy = 4;
            return tex;
          };
          const glyphs = [
            drawGlyph((ctx) => ctx.fillText("{ }", 64, 66)) /* coding */,
            drawGlyph((ctx) => ctx.fillText("</>", 64, 66)) /* markup */,
            drawGlyph((ctx) => {
              /* design: bezier pen handles */
              ctx.beginPath();
              ctx.moveTo(24, 92);
              ctx.quadraticCurveTo(64, 10, 104, 92);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(24, 92);
              ctx.lineTo(50, 56);
              ctx.stroke();
              ctx.fillRect(45, 51, 10, 10);
              ctx.beginPath();
              ctx.arc(24, 92, 7, 0, 7);
              ctx.fill();
            }),
            drawGlyph((ctx) => {
              /* programming: git branch */
              ctx.beginPath();
              ctx.moveTo(44, 24);
              ctx.lineTo(44, 104);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(44, 64);
              ctx.quadraticCurveTo(84, 64, 88, 40);
              ctx.stroke();
              [
                [44, 24],
                [44, 104],
                [90, 30],
              ].forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, 9, 0, 7);
                ctx.fill();
              });
            }),
          ];
          /* pick the largest facet in each of 4 yaw quadrants (spread around the rock) */
          const quads = [[], [], [], []];
          facets.forEach((f, i) =>
            quads[
              Math.floor(
                ((Math.atan2(f.normal.z, f.normal.x) + Math.PI) /
                  (2 * Math.PI)) *
                  4,
              ) % 4
            ].push(i),
          );
          glyphs.forEach((tex, gi) => {
            const pool = quads[gi].length ? quads[gi] : facets.map((_, i) => i);
            const fi = pool.reduce((a, b) =>
              facets[a].area > facets[b].area ? a : b,
            );
            const f = facets[fi];
            /* glyphs are engraving, not signal — they do NOT pulse (addendum A2) */
            const mat = new THREE.MeshBasicMaterial({
              map: tex,
              transparent: true,
              opacity: cfg.GLYPH_OPACITY,
              toneMapped: false,
              depthWrite: false,
            });
            const plane = new THREE.Mesh(
              new THREE.PlaneGeometry(cfg.GLYPH_SIZE, cfg.GLYPH_SIZE),
              mat,
            );
            plane.position.copy(f.center).addScaledVector(f.normal, 0.03);
            plane.lookAt(f.center.clone().addScaledVector(f.normal, 2));
            rock.add(plane);
          });
        }

        }

        /* lights: key upper-left-front · fill camera-right · ONE amber rim lower-rear-left */
        const key = new THREE.DirectionalLight(0xffffff, 1.4 * cfg.KEY_INT);
        key.position.set(-6, 8, 6);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xe4e7ea, cfg.FILL_INT);
        fill.position.set(7, 1, 5);
        scene.add(fill);
        const rim = new THREE.DirectionalLight(
          cfg.ACCENT_RIM_COLOR,
          cfg.ACCENT_RIM_INT,
        );
        rim.position.set(-4, -3, -6);
        scene.add(rim);
        const amb = new THREE.AmbientLight(0xedeff1, 0.35);
        scene.add(amb);
        const chromeGlint = new THREE.PointLight(0xffffff, 12, 15, 2);
        scene.add(chromeGlint);
        const chromeGlintWarm = new THREE.PointLight(
          cfg.ACCENT_RIM_COLOR,
          3.5,
          10,
          2,
        );
        scene.add(chromeGlintWarm);
        const spectralCyan = new THREE.PointLight(0x74e8ff, 4, 11, 2);
        /* neon blue completes the amber/cyan/blue triad (was violet) */
        const spectralBlue = new THREE.PointLight(0x3d6bff, 2.2, 10, 2);
        scene.add(spectralCyan, spectralBlue);
        const AMB_INT = 0.35,
          KEY_BASE = 1.4 * cfg.KEY_INT; /* lk=1 reference intensities */

        /* ── choreography: piecewise-linear keyframes over scrollY, then per-frame lerp ── */
        const BASE_DIAM =
          2 *
          (Math.max(...cfg.RING_RADII) +
            Math.max(
              ...cfg.RING_BAND_WIDTH,
            )); /* object's rest bounding diameter, world units */
        /* flat scalar channel list — everything cur/tgt eases per frame. Formation
           presets are resolved to per-ring scalars (fs/fy/ft/fw/fl + shared fa) so
           interpolation stays numeric; preset names never reach targetAt. */
        const RING_N = cfg.RING_RADII.length;
        const FORM_CHANNELS = [];
        for (let i = 0; i < RING_N; i++)
          FORM_CHANNELS.push("fs" + i, "fy" + i, "ft" + i, "fw" + i, "fl" + i);
        const CHANNELS = [
          "x",
          "y",
          "s",
          "t",
          "o",
          "p",
          "r",
          "f",
          "lk",
          "w",
          "pl",
          "fa",
          "bgR",
          "bgG",
          "bgB",
          ...FORM_CHANNELS,
        ];
        function formChannelsOf(fr) {
          const out = { fa: fr.a };
          for (let i = 0; i < RING_N; i++) {
            out["fs" + i] = fr.s[i];
            out["fy" + i] = fr.y[i];
            out["ft" + i] = fr.tilt[i];
            out["fw" + i] = fr.yaw[i];
            out["fl" + i] = fr.roll[i];
          }
          return out;
        }
        /* swept-shell bounds per ring (world units, scale 1) — a tumbling band sweeps
           the spherical shell [IN, OUT]; the QA hook derives live no-touch margins
           from these (safety rules R1/R2 in the FORMATIONS comment) */
        const RING_SHELL_IN = cfg.RING_RADII.map(
          (R, i) => R - cfg.RING_BAND_WIDTH[i] / 2,
        );
        const RING_SHELL_OUT = cfg.RING_RADII.map((R, i) =>
          Math.hypot(R + cfg.RING_BAND_WIDTH[i] / 2, cfg.RING_BAND_DEPTH[i] / 2),
        );
        let anchors = [];
        function computeAnchors() {
          const vh = innerHeight;
          anchors = cfg.KEYFRAMES.map((k) => {
            if (!k.a) return { y: 0, k };
            const el = document.querySelector(k.a);
            return {
              /* k.av overrides ANCHOR_VH per keyframe — guard keyframes use it to
                 compress color ramps into inter-section padding */
              y: el
                ? Math.max(1, el.offsetTop - (k.av ?? cfg.ANCHOR_VH) * vh)
                : 0,
              k,
            };
          }).sort((a, b) => a.y - b.y);
        }
        function targetAt(scrollY) {
          if (heroOnly) {
            const hp = cfg.HERO_POSE || { x: 50, y: 66, s: 46 };
            /* rotation still tracks scroll; viewpoint/env channels stay at their neutral
         defaults on hero-only rungs — the page there sits on the static CSS --bg */
            return {
              x: hp.x,
              y: hp.y,
              s: hp.s,
              t: scrollY / (innerHeight * 3),
              o: 1,
              p: 0,
              r: 0,
              f: 34,
              lk: 1,
              w: 0,
              pl: 0,
              bgR: BG0.r,
              bgG: BG0.g,
              bgB: BG0.b,
              ...formChannelsOf(cfg.FORMATIONS.nest),
            };
          }
          let a = anchors[0],
            b = anchors[anchors.length - 1];
          for (let i = 0; i < anchors.length - 1; i++) {
            if (scrollY >= anchors[i].y && scrollY <= anchors[i + 1].y) {
              a = anchors[i];
              b = anchors[i + 1];
              break;
            }
            if (scrollY > anchors[i + 1].y) {
              a = anchors[i + 1];
              b = anchors[Math.min(i + 2, anchors.length - 1)];
            }
          }
          const span = Math.max(b.y - a.y, 1);
          const u =
            a === b ? 0 : Math.min(Math.max((scrollY - a.y) / span, 0), 1);
          const eased = u * u * (3 - 2 * u);
          const L = (p, q) => p + (q - p) * eased;
          const out = {
            x: L(a.k.x, b.k.x),
            y: L(a.k.y, b.k.y),
            s: L(a.k.s, b.k.s),
            t: L(a.k.t, b.k.t),
            o: L(a.k.o, b.k.o),
            p: L(a.k.p, b.k.p),
            r: L(a.k.r, b.k.r),
            f: L(a.k.f, b.k.f),
            lk: L(a.k.lk, b.k.lk),
            w: L(a.k.w, b.k.w),
            pl: L(a.k.pl, b.k.pl),
            fa: L(a.k.formR.a, b.k.formR.a),
            bgR: L(a.k.bgC.r, b.k.bgC.r),
            bgG: L(a.k.bgC.g, b.k.bgC.g),
            bgB: L(a.k.bgC.b, b.k.bgC.b),
          };
          const fA = a.k.formR,
            fB = b.k.formR;
          for (let i = 0; i < RING_N; i++) {
            out["fs" + i] = L(fA.s[i], fB.s[i]);
            out["fy" + i] = L(fA.y[i], fB.y[i]);
            out["ft" + i] = L(fA.tilt[i], fB.tilt[i]);
            out["fw" + i] = L(fA.yaw[i], fB.yaw[i]);
            out["fl" + i] = L(fA.roll[i], fB.roll[i]);
          }
          return out;
        }

        /* ── render loop ── */
        const cur = {
          x: 70,
          y: 55,
          s: 72,
          t: 0,
          o: 1,
          p: 0,
          r: 0,
          f: 34,
          lk: 1,
          w: 0,
          pl: 0,
          bgR: BG0.r,
          bgG: BG0.g,
          bgB: BG0.b,
          ...formChannelsOf(cfg.FORMATIONS.nest),
        };
        let raf = 0,
          needsFrame = true,
          entranceT0 = -1,
          firstFrame = false,
          dead = false,
          lastConverged = false;
        let frames = 0,
          probeStart = 0,
          rungDrops = 0;
        let idleClock = 0,
          prevNow = 0; /* accumulated rendered-time (ms) — drives pulse; never jumps across hidden gaps */
        const spinAngle = cfg.RING_LOOP.map((l) =>
          THREE.MathUtils.degToRad(l.PHASE),
        );
        const precAngle = cfg.RING_LOOP.map(() => 0); /* per-ring accumulated loop angle */
        let scrollSpin = 0; /* rad/s angular-velocity boost from scroll, decays to 0 */
        let lastScrollYSpin = window.scrollY; /* prev-frame scrollY for per-frame delta */
        const CONV_EPS = {
          t: 0.0002,
          lk: 0.002,
          w: 0.002,
          pl: 0.002,
          fa: 0.002,
          bgR: 0.002,
          bgG: 0.002,
          bgB: 0.002,
        }; /* per-channel park thresholds; default 0.02 */
        /* formation channel thresholds must snap SUB-PIXEL at max object scale
           (~250 px/world-unit): fs 0.001 ≈ 0.5px on a 2wu radius, fy 0.002wu ≈ 0.5px;
           pose degrees keep the 0.02 default (0.02° ≈ 0.2px at radius 2wu) */
        for (let i = 0; i < RING_N; i++) {
          CONV_EPS["fs" + i] = 0.001;
          CONV_EPS["fy" + i] = 0.002;
        }

        function resize() {
          renderer.setSize(innerWidth, innerHeight, false);
          camera.aspect = innerWidth / innerHeight;
          camera.updateProjectionMatrix();
          computeAnchors();
          needsFrame = true;
        }

        function frame(now) {
          raf = 0;
          if (dead) return;
          /* static mode always renders the designed rest pose — never the scroll-derived
       one (an RM visitor restored mid-page must not get a mid-choreography frame) */
          const K0 = cfg.KEYFRAMES[0];
          const tgt = staticMode
            ? heroOnly
              ? targetAt(0)
              : {
                  x: K0.x,
                  y: K0.y,
                  s: K0.s,
                  t: 0,
                  o: 1,
                  p: K0.p,
                  r: K0.r,
                  f: K0.f,
                  lk: K0.lk,
                  w: K0.w,
                  pl: K0.pl,
                  bgR: K0.bgC.r,
                  bgG: K0.bgC.g,
                  bgB: K0.bgC.b,
                  ...formChannelsOf(K0.formR),
                }
            : targetAt(scrollY);
          if (staticMode) {
            Object.assign(cur, tgt, { t: 0, o: 1 });
            lastConverged = true;
          } else {
            const f = cfg.OBJ_SMOOTH;
            let converged = true;
            for (const ch of CHANNELS) {
              const d = tgt[ch] - cur[ch];
              if (Math.abs(d) > (CONV_EPS[ch] ?? 0.02)) {
                cur[ch] += d * f;
                converged = false;
              } else cur[ch] = tgt[ch];
            }
            needsFrame = !converged;
            lastConverged = converged;
          }

          /* entrance (skipped in static mode) */
          let eScale = 1,
            eYaw = 0,
            eOpacity = 1;
          if (!staticMode && entranceT0 >= 0) {
            const e = Math.min((now - entranceT0) / cfg.ENTRANCE_MS, 1);
            const k = 1 - Math.pow(1 - e, 3);
            eScale =
              cfg.ENTRANCE_SCALE_FROM + (1 - cfg.ENTRANCE_SCALE_FROM) * k;
            eYaw =
              THREE.MathUtils.degToRad(cfg.ENTRANCE_YAW_FROM_DEG) * (1 - k);
            eOpacity = k;
            if (e >= 1) entranceT0 = -1;
            else needsFrame = true;
          }

          /* per-section FOV (zoom/dolly feel) — applied BEFORE the placement math so the
       viewH recompute below self-compensates: apparent size stays governed by s
       while perspective foreshortening shifts (a dolly-zoom read for free) */
          if (Math.abs(camera.fov - cur.f) > 0.01) {
            camera.fov = cur.f;
            camera.updateProjectionMatrix();
          }

          /* screen-space pose → world */
          const viewH =
            2 *
            camera.position.z *
            Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
          const viewW = viewH * camera.aspect;
          object.position.set(
            (cur.x / 100 - 0.5) * viewW,
            (0.5 - cur.y / 100) * viewH,
            0,
          );
          object.scale.setScalar(
            Math.max(((cur.s / 100) * viewH) / BASE_DIAM, 0.001) * eScale,
          );

          /* idle clock: advances only while the animated loop is entitled to run — it is
       what keeps the ring loop + pulse alive when parked-on-scroll would otherwise
       freeze. spinOn is the ring loop's single gate: staticMode or an explicit
       RING_LOOP_ON override can stop it (the hard rule: every
       continuous source dies in every degrade branch). */
          const spinOn = !staticMode && cfg.RING_LOOP_ON !== false;
          const keepAlive = spinOn || (!staticMode && cfg.IDLE_DRIFT_DEG > 0);
          const dt = prevNow ? Math.min(now - prevNow, 100) : 16;
          prevNow = now;
          if (keepAlive) idleClock += dt;

          /* scroll-velocity ring boost: each frame's scroll delta adds angular momentum
             that decays back to the idle spin (see RING_SCROLL_SPIN_* in OBJ_CFG). Gated
             by spinOn (freeze contract) AND reduced motion. lastScrollYSpin always tracks
             so resuming after a freeze never spikes. */
          const scrollY_now = window.scrollY;
          const scrollDeltaSpin = scrollY_now - lastScrollYSpin;
          lastScrollYSpin = scrollY_now;
          const scrollSpinActive =
            spinOn && !prefersReducedMotion && cfg.RING_SCROLL_SPIN_ON !== false;
          if (scrollSpinActive) {
            scrollSpin += scrollDeltaSpin * cfg.RING_SCROLL_SPIN_GAIN;
            scrollSpin *= Math.exp(-dt / cfg.RING_SCROLL_SPIN_TAU_MS);
            scrollSpin = THREE.MathUtils.clamp(
              scrollSpin,
              -cfg.RING_SCROLL_SPIN_MAX,
              cfg.RING_SCROLL_SPIN_MAX,
            );
          } else {
            scrollSpin = 0;
          }

          const idle =
            !staticMode && cfg.IDLE_DRIFT_DEG > 0
              ? THREE.MathUtils.degToRad(cfg.IDLE_DRIFT_DEG) *
                Math.sin((now / 1000) * ((2 * Math.PI) / cfg.IDLE_PERIOD_S))
              : 0;
          const yaw =
            cur.t * 2 * Math.PI +
            idle +
            eYaw +
            THREE.MathUtils.degToRad(cfg.CTA_GLINT_TRIM_DEG) *
              Math.min(cur.t / 2.25, 1);
          orientationGroup.rotation.y = yaw;
          /* pitch: scroll-coupled component stays clamped ±PITCH_CLAMP; the per-section
       viewpoint offset (p) is added OUTSIDE the clamp. roll (r) is viewpoint-only. */
          orientationGroup.rotation.x =
            THREE.MathUtils.clamp(
              yaw * cfg.PITCH_RATIO,
              -THREE.MathUtils.degToRad(cfg.PITCH_CLAMP_DEG),
              THREE.MathUtils.degToRad(cfg.PITCH_CLAMP_DEG),
            ) + THREE.MathUtils.degToRad(cur.p);
          orientationGroup.rotation.z = THREE.MathUtils.degToRad(cur.r);
          /* The island camera stays locked; only scroll-authored roll can move it. */
          coreVisualGroup.rotation.z = THREE.MathUtils.degToRad(cur.r * 0.16);

          /* ring loop: constant slow angular velocity about each ring's own axis, ring B
       counter-rotating. The angle only ACCUMULATES while spinOn — when a degrade
       branch flips spin off, the rings freeze exactly where they are (no snap). */
          rings.forEach((r, i) => {
            if (spinOn) {
              spinAngle[i] +=
                (THREE.MathUtils.degToRad(360 / cfg.RING_LOOP[i].PERIOD_S) *
                  dt *
                  (1 + 0.11 * Math.sin(idleClock / 2600 + i * 1.9))) /
                1000;
              if (scrollSpin !== 0) {
                spinAngle[i] +=
                  (Math.sign(cfg.RING_LOOP[i].PERIOD_S) * scrollSpin * dt) /
                  1000;
              }
              precAngle[i] +=
                (THREE.MathUtils.degToRad(
                  360 / cfg.RING_LOOP[i].PRECESS_S,
                ) *
                  dt) /
                1000;
            }
            /* the spin axis itself precesses — the tumble direction keeps drifting
               through 3D instead of a fixed forward/backward orbit */
            ringSpinAxis
              .copy(ringAxes[i])
              .applyQuaternion(
                precQ.setFromAxisAngle(ringPrecAxes[i], precAngle[i]),
              );
            ringQ.setFromAxisAngle(ringSpinAxis, spinAngle[i]);
            ringLiveQ.copy(ringQ).multiply(ringBaseQ[i]);
            /* formation compose: authored pose (same Euler recipe as construction)
               revolving in-plane on the SAME frozen-able spinAngle accumulator; slerp
               weight = alignment channel. fa=0 (nest/orbit) reproduces the pure
               tumble path bit-for-bit. */
            ringFormE.set(
              Math.PI / 2 - THREE.MathUtils.degToRad(cur["ft" + i]),
              THREE.MathUtils.degToRad(cur["fw" + i]),
              THREE.MathUtils.degToRad(cur["fl" + i]),
            );
            ringFormQ
              .setFromEuler(ringFormE)
              .multiply(
                ringPlaneQ.setFromAxisAngle(
                  RING_PLANE_AXIS,
                  spinAngle[i] * cfg.ALIGNED_SPIN_MUL,
                ),
              );
            r.quaternion
              .copy(ringLiveQ)
              .slerp(ringFormQ, smooth01(0, 1, cur.fa));
            /* R2 gate: per-ring y offsets bloom only once alignment is complete */
            const formGate = smooth01(
              cfg.FORM_GATE[0],
              cfg.FORM_GATE[1],
              cur.fa,
            );
            r.position.y = cur["fy" + i] * formGate;
            r.scale.setScalar(cur["fs" + i]);
          });
          const coreTime = idleClock / 1000;
          mineralCore.rotation.y =
            0.28 + 0.026 * Math.sin(coreTime * 0.19);
          mineralCore.rotation.x =
            -0.14 + 0.018 * Math.sin(coreTime * 0.23 + 0.7);
          mineralCore.rotation.z =
            -0.08 + 0.012 * Math.sin(coreTime * 0.17 + 1.4);
          coreCage.rotation.y = coreTime * 0.085 + 0.035 * Math.sin(coreTime * 0.31);
          coreCage.rotation.x = 0.08 * Math.sin(coreTime * 0.23);
          coreRings.forEach((layer, i) => {
            const angle =
              coreTime * layer.userData.speed +
              0.09 * Math.sin(coreTime * (0.27 + i * 0.07) + i * 1.7);
            coreLayerQ.setFromAxisAngle(layer.userData.axis, angle);
            layer.quaternion.copy(coreLayerQ).multiply(layer.userData.baseQ);
          });
          nucleusGroup.position.y = 0.032 * Math.sin(coreTime * 0.62);
          nucleusGroup.rotation.y = coreTime * 0.12;
          nucleusGroup.rotation.x = 0.16 * Math.sin(coreTime * 0.38);
          nucleusGlow.material.opacity = 0.58 + 0.12 * Math.sin(coreTime * 1.05);
          coreParticles.rotation.y = coreTime * 0.045;
          coreParticles.rotation.x = 0.035 * Math.sin(coreTime * 0.21);
          coreParticles.material.opacity = 0.45 + 0.09 * Math.sin(coreTime * 0.7);

          /* ── four-season cycle: crossfade weights drive the core overlays, the
             ring streams, and the glass tint/roughness targets ── */
          /* seasons drive the core overlays + ring particle streams only — the
             glass body/attenuation stays fixed so the neon amber/cyan/blue shade
             reflections own the ring color story (seasonal tint washed them out) */
          const sw = seasonWeights(coreTime);
          SEASONS.forEach((s, si) => {
            const w = si === sw.i ? 1 - sw.blend : si === sw.j ? sw.blend : 0;
            updateCoreSeasonFx(coreSeasonFx[si], coreTime, w);
            ringSeasonFx.forEach((perRing, ri) => {
              const h = perRing[si];
              h.pts.material.opacity = h.op * w;
              h.pts.visible = w > 0.003;
              if (h.pts.visible)
                h.pts.rotation.z = coreTime * h.flow * (ri % 2 ? -1 : 1);
            });
          });
          const glintPhase = idleClock / 1300;
          chromeGlint.position.set(
            object.position.x + Math.cos(glintPhase) * 4.2,
            object.position.y + Math.sin(glintPhase * 0.73) * 3.1,
            4.5 + Math.sin(glintPhase) * 1.2,
          );
          chromeGlintWarm.position.set(
            object.position.x + Math.cos(-glintPhase * 0.62) * 3.2,
            object.position.y - 2.2 + Math.sin(glintPhase * 0.5),
            2.8,
          );
          spectralCyan.position.set(
            object.position.x + Math.cos(glintPhase * .43 + 1.4) * 3.8,
            object.position.y + Math.sin(glintPhase * .61) * 2.8,
            3.4,
          );
          spectralBlue.position.set(
            object.position.x + Math.cos(-glintPhase * .51) * 3.4,
            object.position.y + Math.sin(glintPhase * .39 + 2.2) * 3.1,
            3.1,
          );
          glassMats.forEach((mat, i) => {
            /* hotter sweep than the old chrome mix — fresnel-limited glass needs
               more env energy for the neon shade bands to visibly shine */
            const sweep = 0.5 + 0.5 * Math.sin(glintPhase * 2.1 + i * 2.05);
            mat.envMapIntensity = 1.9 + sweep * 0.9;
          });

          /* per-section environment: backdrop tone + light pool + light-rig intensity
       + amber warmth. Backdrop stays OPAQUE (transmission renders flat white over
       transparency) — its color shifting IS the visible section-atmosphere change.
       The pool tracks the object (same cur.x/y/s the placement math uses, projected
       at backdrop depth with the LIVE fov) and warms with the w channel. Everything
       here is a pure function of parked channels — no new keepAlive source. */
          const bd = backdrop.material.uniforms;
          bd.uBase.value.setRGB(cur.bgR, cur.bgG, cur.bgB);
          poolTint.copy(POOL_NEUTRAL).lerp(POOL_WARM, cur.w);
          poolColor.setRGB(cur.bgR, cur.bgG, cur.bgB).lerp(poolTint, 0.5);
          bd.uPool.value.copy(poolColor);
          {
            const bdDist = camera.position.z - backdrop.position.z;
            const bdH =
              2 * bdDist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
            bd.uCenter.value.set(
              (cur.x / 100 - 0.5) * bdH * camera.aspect,
              (0.5 - cur.y / 100) * bdH,
            );
            bd.uRadius.value = 0.55 * (cur.s / 100) * bdH;
            bd.uStrength.value = cur.pl;
          }
          /* keep the billboard's despill matched to the live backdrop color AT THE
       OBJECT: the plateau puts the landmass on mix(base, pool, pl) exactly, so
       this mirrors the fragment term-for-term (same poolColor temp); only the
       outermost keyed fringes extend past 0.7R into the falloff */
          coreImageMaterial.uniforms.pageBg.value
            .setRGB(cur.bgR, cur.bgG, cur.bgB)
            .lerp(poolColor, cur.pl);
          key.intensity = KEY_BASE * cur.lk;
          fill.intensity = cfg.FILL_INT * cur.lk;
          amb.intensity = AMB_INT * cur.lk;
          rim.intensity =
            cfg.ACCENT_RIM_INT *
            THREE.MathUtils.lerp(1, cfg.WARM_RIM_MULT, cur.w);

          updateCoreVideoTexture(now);
          canvas.style.opacity = (cur.o * eOpacity).toFixed(3);
          renderer.render(scene, camera);

          if (!firstFrame) {
            firstFrame = true;
            document.body.classList.add("webgl-on");
            signalGyreReady();
            if (staticMode) {
              dead = true;
              renderer.dispose();
              return;
            } /* one designed frame, then the engine is permanently done */
            probeStart = now;
          }

          /* FPS watchdog — measures PROBE_MS windows of continuous rendering; drops a
       rung at most twice, then locks. Only counts while frames are actually flowing. */
          if (rungDrops < 2) {
            frames++;
            if (now - probeStart >= cfg.PROBE_MS) {
              const fps = frames / ((now - probeStart) / 1000);
              if (fps < cfg.FPS_FLOOR) {
                rungDrops++;
                if (rungDrops === 1 && renderer.getPixelRatio() > 1.25) {
                  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
                } else {
                  /* Preserve motion on slower GPUs. Reducing resolution is substantially
               cheaper without making the deliberately animated rings look broken. */
                  rungDrops = 2;
                  renderer.setPixelRatio(Math.min(devicePixelRatio, 1));
                  if ("transmissionResolutionScale" in renderer)
                    renderer.transmissionResolutionScale = 0.25;
                }
              }
              frames = 0;
              probeStart = now;
            }
          }

          /* keepAlive (not `idle !== 0`) — a sine sampled exactly at zero must not park the loop */
          if ((needsFrame || keepAlive) && !document.hidden && renderGate)
            schedule();
        }
        function schedule() {
          if (!raf && !dead) raf = requestAnimationFrame(frame);
        }

        /* ── wiring — static rungs get NO listeners: one designed frame, then the engine
        is inert (the canvas scrolls away inside the hero like any image) ── */
        let renderGate = true; /* false only when a hero-only canvas has scrolled away */
        if (heroOnly || staticMode) {
          canvas.classList.add("in-hero");
          const hero = document.getElementById("hero");
          hero.appendChild(canvas);
          if (!staticMode) {
            new IntersectionObserver(
              (entries) => {
                entries.forEach((en) => {
                  renderGate = en.isIntersecting;
                  if (renderGate) schedule();
                });
              },
              { threshold: 0 },
            ).observe(hero);
          }
        }
        resize();
        if (!staticMode) {
          window.addEventListener("resize", resize, { passive: true });
          new ResizeObserver(() => {
            computeAnchors();
            needsFrame = true;
            if (renderGate) schedule();
          }).observe(document.body);
          window.addEventListener(
            "scroll",
            () => {
              needsFrame = true;
              if (renderGate) schedule();
            },
            { passive: true },
          );
          document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
              if (raf) {
                cancelAnimationFrame(raf);
                raf = 0;
              }
            } else if (renderGate) {
              frames = 0;
              probeStart =
                performance.now(); /* hidden time must not contaminate the FPS window */
              schedule();
            }
          });
        }

        const begin = () => {
          /* Pre-roll slightly while the loader is still covering the canvas so the
             first revealed WebGL frame is already legible, not transparent. */
          entranceT0 = performance.now() - 180;
          canvas.style.opacity = "0";
          schedule();
        };
        if (staticMode)
          schedule(); /* render the single designed frame immediately */
        else begin();

        /* Release GPU resources on navigation; shared geometries/materials are disposed
           once even when referenced by several cage or ring meshes. */
        window.addEventListener(
          "pagehide",
          () => {
            dead = true;
            if (raf) cancelAnimationFrame(raf);
            const geometries = new Set();
            const materials = new Set();
            scene.traverse((node) => {
              if (node.geometry) geometries.add(node.geometry);
              if (node.material) {
                const list = Array.isArray(node.material)
                  ? node.material
                  : [node.material];
                list.forEach((material) => materials.add(material));
              }
            });
            const coreTexture = coreImageMaterial.uniforms.coreMap.value;
            if (coreTexture) coreTexture.dispose();
            coreVideo.pause();
            coreVideo.removeAttribute("src");
            coreVideo.load();
            coreVideo.remove();
            geometries.forEach((geometry) => geometry.dispose());
            materials.forEach((material) => material.dispose());
            if (scene.environment) scene.environment.dispose();
            renderer.dispose();
          },
          { once: true },
        );

        /* read-only QA hook — headless probes assert channel/loop state through this */
        window.__gyre = () => ({
          cur: { ...cur },
          fov: camera.fov,
          spin: spinAngle.map((a) => (a * 180) / Math.PI),
          season: (() => {
            const w = seasonWeights(idleClock / 1000);
            return { key: SEASONS[w.i].key, next: SEASONS[w.j].key, blend: +w.blend.toFixed(3) };
          })(),
          rim: rim.intensity,
          bg:
            "#" +
            backdrop.material.uniforms.uBase.value.getHexString().toUpperCase(),
          converged: lastConverged,
          anchors: anchors.map((a) => Math.round(a.y)),
          form: {
            fa: cur.fa,
            gate: smooth01(cfg.FORM_GATE[0], cfg.FORM_GATE[1], cur.fa),
            scale: rings.map((r) => r.scale.x),
            yApplied: rings.map((r) => r.position.y),
          },
          pool: {
            x: backdrop.material.uniforms.uCenter.value.x,
            y: backdrop.material.uniforms.uCenter.value.y,
            r: backdrop.material.uniforms.uRadius.value,
            strength: backdrop.material.uniforms.uStrength.value,
          },
          /* linear-space triplets so probes can assert the despill mirror
             (despill == mix(bg, pool, pl)) without color-space conversions */
          bgLin: backdrop.material.uniforms.uBase.value.toArray(),
          poolLin: backdrop.material.uniforms.uPool.value.toArray(),
          despillLin: coreImageMaterial.uniforms.pageBg.value.toArray(),
          safety: (() => {
            const s = rings.map((r) => r.scale.x);
            const y = rings.map((r) => r.position.y);
            const aligned = cur.fa >= cfg.FORM_GATE[0];
            let pairMin = Infinity;
            for (let i = 0; i < rings.length - 1; i++) {
              /* tumbling: conservative shell separation incl. center offsets;
                 aligned (flat corridor / norm-shells): radial gap */
              const m = aligned
                ? RING_SHELL_IN[i + 1] * s[i + 1] - RING_SHELL_OUT[i] * s[i]
                : RING_SHELL_IN[i + 1] * s[i + 1] -
                  (Math.abs(y[i] - y[i + 1]) + RING_SHELL_OUT[i] * s[i]);
              if (m < pairMin) pairMin = m;
            }
            let islandMin = Infinity;
            /* 1.55 = measured max LATERAL extent of the keyed landmass (audit,
               shader-faithful key over coreRings.mp4 frames) — not the nominal
               1.5 silhouette guess */
            for (let i = 0; i < rings.length; i++) {
              const m = aligned
                ? Math.hypot(RING_SHELL_IN[i] * s[i], y[i]) - 1.55
                : RING_SHELL_IN[i] * s[i] - Math.abs(y[i]) - 1.55;
              if (m < islandMin) islandMin = m;
            }
            const gateOK = !(
              Math.max(...y.map(Math.abs)) > 0.02 &&
              cur.fa < cfg.FORM_GATE[0]
            );
            return { pairMin, islandMin, gateOK };
          })(),
          spinOn: !staticMode && cfg.RING_LOOP_ON !== false,
          raf: !!raf,
          drops: rungDrops,
          dead,
          staticMode,
          heroOnly,
        });
      })();
