'use strict';
/* ═════════════════════════════════════════════════════
   THREE.JS — 3D HERO BACKGROUND
   Rotating wireframe icosahedra + particle cloud
   Mouse-reactive, color-coded blue/orange
═════════════════════════════════════════════════════ */
function initThreeJS() {
  const canvas = document.getElementById('three-canvas');
  if (!window.THREE || !canvas) return;

  const scene = new THREE.Scene();
  const W = window.innerWidth, H = window.innerHeight;

  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 2000);
  camera.position.z = 560;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);

  // — Outer wireframe icosahedron (blue, large, slow) —
  const outerGeo = new THREE.IcosahedronGeometry(220, 3);
  const outerMat = new THREE.MeshBasicMaterial({ color: 0x1a6eff, wireframe: true, transparent: true, opacity: 0.055 });
  const outerMesh = new THREE.Mesh(outerGeo, outerMat);
  scene.add(outerMesh);

  // — Inner octahedron (orange, medium, counter-rotation) —
  const innerGeo = new THREE.OctahedronGeometry(110);
  const innerMat = new THREE.MeshBasicMaterial({ color: 0xff4d1a, wireframe: true, transparent: true, opacity: 0.08 });
  const innerMesh = new THREE.Mesh(innerGeo, innerMat);
  scene.add(innerMesh);

  // — Orbiting tetrahedron (lime accent) —
  const tetraGeo = new THREE.TetrahedronGeometry(55);
  const tetraMat = new THREE.MeshBasicMaterial({ color: 0xe8ff47, wireframe: true, transparent: true, opacity: 0.12 });
  const tetraMesh = new THREE.Mesh(tetraGeo, tetraMat);
  scene.add(tetraMesh);

  // — Particle cloud —
  const COUNT = 3000;
  const pGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);

  const colBlue   = new THREE.Color(0x1a6eff);
  const colOrange = new THREE.Color(0xff4d1a);
  const colLime   = new THREE.Color(0xe8ff47);
  const colWhite  = new THREE.Color(0xb0b8d0);

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    const r = 260 + Math.random() * 280;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);

    const rnd = Math.random();
    let col;
    if      (rnd < 0.40) col = colBlue;
    else if (rnd < 0.70) col = colOrange;
    else if (rnd < 0.82) col = colLime;
    else                 col = colWhite;
    colors[i3] = col.r; colors[i3 + 1] = col.g; colors[i3 + 2] = col.b;
    sizes[i] = 0.8 + Math.random() * 1.8;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

  const pMat = new THREE.PointsMaterial({ size: 1.6, vertexColors: true, transparent: true, opacity: 0.55, sizeAttenuation: true });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // — Mouse tracking with lerp —
  let mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth - 0.5) * 0.6;
    my = -(e.clientY / window.innerHeight - 0.5) * 0.6;
  });

  // — Resize handler —
  window.addEventListener('resize', () => {
    const nW = window.innerWidth, nH = window.innerHeight;
    renderer.setSize(nW, nH);
    camera.aspect = nW / nH;
    camera.updateProjectionMatrix();
  });

  let running = true;
  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    const t = Date.now() * 0.00028;

    tx += (mx - tx) * 0.025;
    ty += (my - ty) * 0.025;

    outerMesh.rotation.x = t * 0.18 + ty * 0.3;
    outerMesh.rotation.y = t * 0.26 + tx * 0.3;

    innerMesh.rotation.x = -t * 0.35;
    innerMesh.rotation.y =  t * 0.55;
    innerMesh.rotation.z =  t * 0.22;

    tetraMesh.position.x = Math.cos(t * 0.9)  * 170;
    tetraMesh.position.y = Math.sin(t * 0.6)  *  80;
    tetraMesh.position.z = Math.sin(t * 0.9)  * 120;
    tetraMesh.rotation.x = t * 1.1;
    tetraMesh.rotation.y = t * 1.4;

    particles.rotation.x = t * 0.028 + ty * 0.04;
    particles.rotation.y = t * 0.042 + tx * 0.04;

    renderer.render(scene, camera);
  }
  loop();

  return { stop: () => { running = false; } };
}
