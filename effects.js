/* The energy field shares the gyroscope's clock, visibility gate and quality budget. */
export function createEnergyField(THREE, parent, compact) {
  const group = new THREE.Group();
  parent.add(group);
  const count = compact ? 900 : 2800;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 3);
  const random = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  for (let i = 0; i < count; i++) {
    seeds.set([random(i + 1), random(i + 4100), random(i + 8200)], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 3));
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { time: { value: 0 }, density: { value: compact ? 0.8 : 1 }, pointer: { value: new THREE.Vector2() } },
    vertexShader: `
      attribute vec3 seed;
      uniform float time;
      uniform float density;
      uniform vec2 pointer;
      varying vec3 tint;
      varying float alpha;
      void main() {
        float lane = floor(seed.z * 5.0);
        float angle = seed.x * 6.283185 + time * (0.12 + seed.y * 0.16) * (mod(lane, 2.0) * 2.0 - 1.0);
        float radius = 1.75 + seed.y * 1.1;
        vec3 p = vec3(cos(angle) * radius, (seed.z - 0.5) * 0.26, sin(angle) * radius);
        float tilt = lane * 0.57 + 0.3;
        p.xy = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt)) * p.xy;
        p.y += sin(angle * 3.0 + time * 0.4) * 0.09;
        p.xy += pointer * (0.035 + seed.y * 0.07);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp((2.5 + pow(seed.y, 8.0) * 10.0) * (7.0 / -mv.z) * density, 1.0, 20.0);
        tint = mix(vec3(0.03, 0.52, 0.72), vec3(0.55, 0.19, 0.9), seed.z);
        if (seed.z > 0.8) tint = vec3(0.9, 0.48, 0.12);
        alpha = 0.28 + 0.5 * pow(0.5 + 0.5 * sin(time * 1.4 + seed.x * 50.0), 3.0);
      }`,
    fragmentShader: `
      varying vec3 tint;
      varying float alpha;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;
        float core = 1.0 - smoothstep(0.0, 0.32, d);
        gl_FragColor = vec4(mix(tint, vec3(1.0), core * 0.75), (pow(1.0 - d, 2.0) * 0.8 + core * 0.4) * alpha);
      }`,
  });
  const particles = new THREE.Points(geometry, material);
  particles.frustumCulled = false; // Positions are generated on the GPU.
  group.add(particles);

  const orbits = [];
  const palette = [0x28b6d1, 0x8b64df, 0xdca354];
  const gemGeometry = new THREE.OctahedronGeometry(0.045);
  for (let i = 0; i < (compact ? 3 : 5); i++) {
    const pivot = new THREE.Group();
    pivot.rotation.set(0.5 + i * 0.48, i * 0.6, i * 0.7);
    group.add(pivot);
    const radius = 2.05 + i * 0.14;
    const points = [];
    for (let j = 0; j <= 160; j++) {
      const a = j / 160 * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: palette[i % 3], transparent: true, opacity: 0.22, depthWrite: false }));
    pivot.add(line);
    const comet = new THREE.Group();
    pivot.add(comet);
    const gem = new THREE.Mesh(gemGeometry, new THREE.MeshBasicMaterial({ color: palette[i % 3] }));
    gem.position.x = radius;
    comet.add(gem);
    const trailPoints = [];
    const colors = [];
    const color = new THREE.Color(palette[i % 3]);
    for (let j = 0; j < 64; j++) {
      const a = -j / 64 * 0.8;
      trailPoints.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
      colors.push(color.r, color.g, color.b);
    }
    const trailGeometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
    trailGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    comet.add(new THREE.Points(trailGeometry, new THREE.PointsMaterial({ color: palette[i % 3], size: 0.019, transparent: true, opacity: 0.65, depthWrite: false })));
    orbits.push({ pivot, comet, gem });
  }
  return {
    attachRings(rings, radii) {
      rings.forEach((ring, index) => {
        const vertices = [];
        for (let i = 0; i < (compact ? 100 : 260); i++) {
          const a = random(i + index * 300) * Math.PI * 2;
          const radius = radii[index] + (random(i + 900) - 0.5) * 0.12;
          vertices.push(Math.cos(a) * radius, Math.sin(a) * radius, (random(i + 1900) - 0.5) * 0.16);
        }
        const sparkGeometry = new THREE.BufferGeometry();
        sparkGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        ring.add(new THREE.Points(sparkGeometry, new THREE.PointsMaterial({
          color: palette[index % 3], size: 0.024, transparent: true,
          opacity: 0.8, depthWrite: false,
        })));
      });
    },
    update(time, x, y, qualityDrops) {
      material.uniforms.time.value = time;
      material.uniforms.pointer.value.set(x, -y);
      geometry.setDrawRange(0, Math.floor(count / (1 + qualityDrops * 0.5)));
      orbits.forEach(({ pivot, comet, gem }, i) => {
        comet.rotation.z = time * (0.24 + i * 0.06) * (i % 2 ? -1 : 1) + i * 1.8;
        pivot.rotation.y = i * 0.6 + time * 0.025;
        gem.rotation.set(time * 0.6, time * 0.8, 0);
      });
    },
  };
}
