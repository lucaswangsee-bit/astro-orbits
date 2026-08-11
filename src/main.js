// ============================================================================
//  main.js — Three.js scene, render loop, time control, dual mode
//            (Solar System / Nearby Stars) and sky events
// ============================================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import {
  heliocentricPosition, orbitPath, moonOffset, julianDate,
  orbitalSpeeds, orbitalDynamics, cometPosition, cometOrbitPath, AU_DAY_TO_KM_S, ephemeris,
  orbitalElements, GM_SUN
} from './kepler.js';
import { SUN, PLANETS, MOON, COMETS, ASTEROIDS } from './bodies.js';
import { observeBody, determineOrbit, residuals, elementsToBody } from './gauss.js';
import { STARS, starPositionLy, starVisual } from './stars.js';
import { computeEvents } from './events.js';
import { ORIGINS } from './origins.js';

const SCALE = 20;        // Solar System: scene units per AU (real distances)
const SCALE_C = 26;      // Compact mode: reference scale for the √-compressed radius
const STAR_SCALE = 6;    // Star map: scene units per light-year

// Distance scale morph: 0 = true distances, 1 = compact (outer planets pulled in).
// `compress` is the animated current value; `compressTarget` is where it heads.
let compress = 0;
let compressTarget = 0;

// Remap a heliocentric distance r (AU) to a scene radius. Compact mode uses a
// square-root law: it spreads the crowded inner planets out and reels the far
// outer planets (and big comet orbits) in, while keeping every orbit's shape
// and orientation intact (the mapping is purely radial).
function radiusScene(r) {
  const real = r * SCALE;
  if (compress <= 1e-4) return real;
  const comp = Math.sqrt(r) * SCALE_C;
  return real + (comp - real) * compress;
}

// Position → scene: scale each point radially about the Sun, then swap axes.
function toScene(p) {
  const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) || 1e-9;
  const s = radiusScene(r) / r;
  return new THREE.Vector3(p.x * s, p.z * s, -p.y * s);
}
// Direction → scene: axis swap only (NO radial remap — for velocity/tail vectors).
function toSceneDir(v)  { return new THREE.Vector3(v.x, v.z, -v.y); }
function toSceneLy(p) { return new THREE.Vector3(p.x * STAR_SCALE, p.z * STAR_SCALE, -p.y * STAR_SCALE); }

// ---------------------------------------------------------------------------
//  Renderer / scene / camera
// ---------------------------------------------------------------------------
const container = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
container.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 40000);
camera.position.set(0, 120, 260);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 3;
controls.maxDistance = 9000;

const texLoader = new THREE.TextureLoader();
function loadTex(url) {
  const t = texLoader.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------------------------------------------------------------------------
//  Lighting
// ---------------------------------------------------------------------------
scene.add(new THREE.AmbientLight(0xffffff, 0.22));
const sunLight = new THREE.PointLight(0xffffff, 3.4, 0, 0.35);
scene.add(sunLight);

// ---------------------------------------------------------------------------
//  Milky Way backdrop (real star-field texture wrapping the whole scene)
// ---------------------------------------------------------------------------
const milkyway = new THREE.Mesh(
  new THREE.SphereGeometry(18000, 60, 40),
  new THREE.MeshBasicMaterial({ map: loadTex('assets/textures/2k_stars_milky_way.jpg'), side: THREE.BackSide })
);
scene.add(milkyway);

// ===========================================================================
//  A) Solar System group
// ===========================================================================
const solarGroup = new THREE.Group();
scene.add(solarGroup);

const clickableBodies = [];
const bodyMeshes = {};

// Base priority per label kind — higher wins when two labels fight for the same
// patch of screen. The selected body gets a large runtime boost (see declutter).
const LABEL_PRIORITY = {
  'label-star': 100,
  'label-planet': 80,
  'label-comet': 60,
  'label-asteroid': 40,
  'label-ring': 20,
};
const labels = [];   // declutter candidates: { obj, el, priority }

function makeLabel(text, className, offsetY) {
  const div = document.createElement('div');
  div.className = 'label ' + className;
  div.textContent = text;
  const obj = new CSS2DObject(div);
  obj.position.set(0, offsetY, 0);
  labels.push({ obj, el: div, priority: LABEL_PRIORITY[className] ?? 50 });
  return obj;
}

function makeBody(data, emissive) {
  const geo = new THREE.SphereGeometry(data.displaySize, 48, 48);
  const map = data.texture ? loadTex(data.texture) : null;
  const mat = emissive
    ? new THREE.MeshBasicMaterial({ map, color: map ? 0xffffff : data.color })
    : new THREE.MeshStandardMaterial({ map, color: map ? 0xffffff : data.color, roughness: 0.9, metalness: 0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.body = data;
  mesh.add(makeLabel(data.nameZh, data.type === 'star' ? 'label-star' : 'label-planet', data.displaySize + 0.6));
  solarGroup.add(mesh);
  bodyMeshes[data.key] = mesh;
  clickableBodies.push(mesh);
  return mesh;
}

// Sun + glow halo
const sunMesh = makeBody(SUN, true);
sunMesh.add(new THREE.Mesh(
  new THREE.SphereGeometry(SUN.displaySize * 1.5, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffdd66, transparent: true, opacity: 0.13 })
));

// Planets + rings
for (const p of PLANETS) {
  makeBody(p, false);
  if (p.rings) {
    const inner = p.displaySize * 1.4;
    const outer = p.displaySize * (p.key === 'saturn' ? 2.4 : 1.9);
    const ringGeo = new THREE.RingGeometry(inner, outer, 96);
    // Adjust UVs so the ring texture maps along the radial direction
    const pos = ringGeo.attributes.position, uv = ringGeo.attributes.uv, v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i);
      const r = (v3.length() - inner) / (outer - inner);
      uv.setXY(i, r, 0.5);
    }
    const ringMap = p.ringTexture ? loadTex(p.ringTexture) : null;
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringMap, color: ringMap ? 0xffffff : p.color,
      side: THREE.DoubleSide, transparent: true, opacity: p.key === 'saturn' ? 0.9 : 0.3
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2 - 0.45;
    bodyMeshes[p.key].add(ring);
  }
}
makeBody(MOON, false);

// ---------------------------------------------------------------------------
//  Comets — nucleus + coma glow + double tail (ion + dust), all Sun-facing.
//  Registered in bodyMeshes/clickableBodies so click-to-select and focus work.
// ---------------------------------------------------------------------------
const cometRigs = [];   // { data, mesh, ionTail, dustTail, orbitLine }
const UP_Y = new THREE.Vector3(0, 1, 0);
for (const c of COMETS) {
  const geo = new THREE.SphereGeometry(c.displaySize, 24, 24);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: c.color }));
  mesh.userData.body = c;
  // Coma halo around the icy nucleus
  mesh.add(new THREE.Mesh(
    new THREE.SphereGeometry(c.displaySize * 2.6, 16, 16),
    new THREE.MeshBasicMaterial({ color: c.color, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })
  ));
  mesh.add(makeLabel(c.nameZh, 'label-comet', c.displaySize + 0.7));
  solarGroup.add(mesh);
  bodyMeshes[c.key] = mesh;
  clickableBodies.push(mesh);

  // Tails: unit cones (apex at the nucleus, base flaring outward), oriented each
  // frame to stream away from the Sun. Ion = straight & blue; dust = broad & tan.
  const makeTail = (color, width, opacity) => {
    const t = new THREE.Mesh(
      new THREE.ConeGeometry(1, 1, 20, 1, true),   // unit cone; scaled per-frame
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
    );
    t.userData.width = width;
    t.visible = false;
    solarGroup.add(t);
    return t;
  };
  const ionTail  = makeTail(0x9fd8ff, 0.18, 0.34);   // narrow, straight, blue
  const dustTail = makeTail(0xf0dcab, 0.55, 0.16);   // broad, curved, tan

  // Full elliptical orbit path (kept in AU so it can be re-mapped on scale morph)
  const orbitPtsAU = cometOrbitPath(c);
  const orbitLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(orbitPtsAU.map(toScene)),
    new THREE.LineBasicMaterial({ color: c.color, transparent: true, opacity: 0.28 })
  );
  solarGroup.add(orbitLine);

  cometRigs.push({ data: c, mesh, ionTail, dustTail, orbitLine, orbitPtsAU });
}

// ---------------------------------------------------------------------------
//  Asteroids — real minor planets (Ceres, Vesta, Eros, Apophis …) solved from
//  JPL orbital elements with the same 6-element engine as comets. Rendered as a
//  small body + faint halo + orbit line; fully click-to-select and focusable.
// ---------------------------------------------------------------------------
const asteroidRigs = [];
for (const c of ASTEROIDS) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(c.displaySize, 20, 20),
    new THREE.MeshBasicMaterial({ color: c.color })
  );
  mesh.userData.body = c;
  mesh.add(new THREE.Mesh(   // faint halo so small bodies stay visible
    new THREE.SphereGeometry(c.displaySize * 2.2, 12, 12),
    new THREE.MeshBasicMaterial({ color: c.color, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false })
  ));
  mesh.add(makeLabel(c.nameZh, 'label-asteroid', c.displaySize + 0.7));
  solarGroup.add(mesh);
  bodyMeshes[c.key] = mesh;
  clickableBodies.push(mesh);

  const orbitPtsAU = cometOrbitPath(c);   // generic Keplerian 6-element solver
  const orbitLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(orbitPtsAU.map(toScene)),
    new THREE.LineBasicMaterial({ color: c.color, transparent: true, opacity: 0.32 })
  );
  solarGroup.add(orbitLine);
  asteroidRigs.push({ data: c, mesh, orbitLine, orbitPtsAU });
}

// Orbit lines
const orbitLines = {};
function buildOrbitLine(key, jd) {
  const pts = orbitPath(key, jd).map(toScene);
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color: bodyMeshes[key].userData.body.color, transparent: true, opacity: 0.38 });
  return new THREE.Line(geo, mat);
}
function refreshOrbits() {
  const jd = julianDate(state.simDate);
  for (const p of PLANETS) {
    const old = orbitLines[p.key];
    if (old) {
      solarGroup.remove(old);
      old.geometry.dispose();   // free GPU buffers — refreshOrbits runs on every "back to today" / event jump
      old.material.dispose();
    }
    orbitLines[p.key] = buildOrbitLine(p.key, jd);
    orbitLines[p.key].visible = state.showOrbits;
    solarGroup.add(orbitLines[p.key]);
  }
}

// ---------------------------------------------------------------------------
//  Recovered orbit — the bright green ellipse the Orbit Determination Lab draws
//  into the live scene, on top of the asteroid's true orbit. Declared HERE (with
//  the other orbit-line state, well above every caller) so that setMode() and
//  rebuildCometOrbits() can reach it without ever touching a TDZ binding.
//  At most one exists at a time: a new run replaces the previous one.
// ---------------------------------------------------------------------------
let recoveredLine = null;      // THREE.Line currently in solarGroup, or null
let recoveredPtsAU = null;     // its path in AU, kept for the scale-morph remap

function clearRecoveredOrbit() {
  if (!recoveredLine) return;
  solarGroup.remove(recoveredLine);
  recoveredLine.geometry.dispose();    // free the GPU buffers — runs on every re-run
  recoveredLine.material.dispose();
  recoveredLine = null;
  recoveredPtsAU = null;
}

// Draw the ellipse described by a solved element set. `el` is the solver's
// `elements` (a in AU, angles in DEGREES); `epochJd` is the epoch its M refers to.
function drawRecoveredOrbit(el, epochJd) {
  clearRecoveredOrbit();                              // replace, never stack
  const period = 365.25 * Math.pow(el.a, 1.5);        // Kepler III, days (a in AU)
  const n = 2 * Math.PI / period;                     // mean motion, rad/day
  // cometOrbitPath() wants a body-shaped record: angles in degrees, plus the
  // perihelion epoch implied by the mean anomaly at `epochJd`.
  const shape = {
    a: el.a, e: el.e, I: el.i, argp: el.omega, node: el.node,
    tperi: epochJd - (el.M * Math.PI / 180) / n,
    period
  };
  recoveredPtsAU = cometOrbitPath(shape);
  recoveredLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(recoveredPtsAU.map(toScene)),
    new THREE.LineBasicMaterial({ color: 0x7dffb0, transparent: true, opacity: 0.9 })
  );
  solarGroup.add(recoveredLine);
}

// Re-map the (static) comet orbit lines through the current scale — called each
// frame while the compact/real distance morph is in progress.
function rebuildCometOrbits() {
  for (const rig of cometRigs) {
    rig.orbitLine.geometry.setFromPoints(rig.orbitPtsAU.map(toScene));
  }
  for (const rig of asteroidRigs) {
    rig.orbitLine.geometry.setFromPoints(rig.orbitPtsAU.map(toScene));
  }
  // The recovered ellipse is static too, so it needs the same treatment
  if (recoveredLine) recoveredLine.geometry.setFromPoints(recoveredPtsAU.map(toScene));
}

// ---------------------------------------------------------------------------
//  Kepler's 2nd law sweep sector — for the selected planet, a translucent
//  wedge swept from the Sun over a FIXED time interval (period/10). As the
//  planet moves the wedge changes shape but keeps (nearly) constant area.
// ---------------------------------------------------------------------------
const SWEEP_SEGMENTS = 40;
const sweepGeo = new THREE.BufferGeometry();
sweepGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((SWEEP_SEGMENTS) * 3 * 3), 3));
const sweepMesh = new THREE.Mesh(
  sweepGeo,
  new THREE.MeshBasicMaterial({ color: 0xffd873, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
);
sweepMesh.visible = false;
solarGroup.add(sweepMesh);

// Rebuild the wedge for `key` ending at the current jd
const _sw = new THREE.Vector3();
function updateSweep(key, jd) {
  const { a } = orbitalSpeeds(key, jd);
  const periodDays = 365.25 * Math.pow(a, 1.5);
  const span = periodDays / 10;
  const pos = sweepGeo.attributes.position;
  let ptr = 0;
  const arc = [];
  for (let i = 0; i <= SWEEP_SEGMENTS; i++) {
    const t = jd - span * (1 - i / SWEEP_SEGMENTS);
    arc.push(toScene(heliocentricPosition(key, t)));
  }
  for (let i = 0; i < SWEEP_SEGMENTS; i++) {
    // triangle: Sun (origin) — arc[i] — arc[i+1]
    pos.array[ptr++] = 0; pos.array[ptr++] = 0; pos.array[ptr++] = 0;
    _sw.copy(arc[i]);     pos.array[ptr++] = _sw.x; pos.array[ptr++] = _sw.y; pos.array[ptr++] = _sw.z;
    _sw.copy(arc[i + 1]); pos.array[ptr++] = _sw.x; pos.array[ptr++] = _sw.y; pos.array[ptr++] = _sw.z;
  }
  pos.needsUpdate = true;
  sweepGeo.computeVertexNormals();
}

// ===========================================================================
//  B) Nearby-stars group
// ===========================================================================
const starsGroup = new THREE.Group();
starsGroup.visible = false;
scene.add(starsGroup);

const clickableStars = [];
const starMeshes = {};
const starData = STARS.map(s => ({ ...s, ...starVisual(s) })); // attach color and size

for (const s of starData) {
  const geo = new THREE.SphereGeometry(s.size, 24, 24);
  const mat = new THREE.MeshBasicMaterial({ color: s.color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(toSceneLy(starPositionLy(s)));
  mesh.userData.star = s;
  // Glow halo
  mesh.add(new THREE.Mesh(
    new THREE.SphereGeometry(s.size * 2.2, 16, 16),
    new THREE.MeshBasicMaterial({ color: s.color, transparent: true, opacity: 0.18 })
  ));
  mesh.add(makeLabel(s.nameZh, s.key === 'sun' ? 'label-star' : 'label-planet', s.size + 1.5));
  starsGroup.add(mesh);
  starMeshes[s.key] = mesh;
  clickableStars.push(mesh);
}

// Distance reference rings (light-years)
for (const ly of [5, 10, 25, 50]) {
  const pts = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * ly * STAR_SCALE, 0, Math.sin(a) * ly * STAR_SCALE));
  }
  const ring = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0x33507a, transparent: true, opacity: 0.35 })
  );
  ring.add(makeLabel(`${ly} ly`, 'label-ring', 0));
  ring.children[0].position.set(ly * STAR_SCALE, 0, 0);
  starsGroup.add(ring);
}

// ---------------------------------------------------------------------------
//  State
// ---------------------------------------------------------------------------
const state = {
  simDate: new Date(),
  daysPerSecond: 5,
  playing: true,
  showOrbits: true,
  showSweep: true,
  selectedKey: null,   // key of the currently selected body (for the sweep sector)
  mode: 'solar',   // 'solar' | 'stars'
  follow: false,   // when true, the camera keeps the selected body centred as it orbits
};
refreshOrbits();

// ---------------------------------------------------------------------------
//  Position updates
// ---------------------------------------------------------------------------
const _vel = new THREE.Vector3();
const _tailDir = new THREE.Vector3();
const _q = new THREE.Quaternion();
function updatePositions() {
  const jd = julianDate(state.simDate);
  for (const p of PLANETS) {
    const mesh = bodyMeshes[p.key];
    mesh.position.copy(toScene(heliocentricPosition(p.key, jd)));
  }
  const e = heliocentricPosition('earth', jd), off = moonOffset(jd), MV = 60;
  bodyMeshes.moon.position.copy(toScene({ x: e.x + off.x * MV, y: e.y + off.y * MV, z: e.z + off.z * MV }));

  // Asteroids: position + orbit-line visibility (no tails)
  for (const rig of asteroidRigs) {
    rig.mesh.position.copy(toScene(cometPosition(rig.data, jd)));
    rig.orbitLine.visible = state.showOrbits;
  }

  // Comets: position, then re-aim both tails anti-sunward (grow near perihelion)
  for (const rig of cometRigs) {
    const c = rig.data;
    const p = cometPosition(c, jd);
    const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);   // Sun distance (AU)
    rig.mesh.position.copy(toScene(p));
    rig.orbitLine.visible = state.showOrbits;

    // Tail length grows sharply near the Sun, fades out past ~3 AU
    const len = Math.min(28, 3.2 / (r * r));
    const active = len > 0.6;
    rig.ionTail.visible = rig.dustTail.visible = active;
    if (active) {
      _tailDir.copy(rig.mesh.position).normalize();           // anti-sun (Sun at origin)
      // Ion tail: straight anti-solar
      _q.setFromUnitVectors(UP_Y, _tailDir.clone().negate());
      placeTail(rig.ionTail, rig.mesh.position, _tailDir, len, _q);
      // Dust tail: broader, shorter, curved slightly along the anti-velocity direction
      const cv = cometPosition(c, jd + 0.5);
      _vel.set(cv.x - p.x, cv.y - p.y, cv.z - p.z);
      const antiVel = toSceneDir(_vel).normalize().multiplyScalar(-0.35);
      _tailDir.copy(rig.mesh.position).normalize().add(antiVel).normalize();
      _q.setFromUnitVectors(UP_Y, _tailDir.clone().negate());
      placeTail(rig.dustTail, rig.mesh.position, _tailDir, len * 0.7, _q);
    }
  }

  // Kepler sweep sector for the selected planet
  const showSweep = state.showSweep && state.selectedKey && bodyMeshes[state.selectedKey]
    && bodyMeshes[state.selectedKey].userData.body.type === 'planet';
  sweepMesh.visible = !!showSweep;
  if (showSweep) updateSweep(state.selectedKey, jd);
}

// Position/scale/orient a unit cone tail: apex at the nucleus, flaring outward.
// Scale is anisotropic — long along the tail axis (Y), thin across (X/Z).
function placeTail(tail, origin, dir, len, quat) {
  const w = tail.userData.width * (1 + len * 0.15);   // flare a little as it lengthens
  tail.quaternion.copy(quat);
  tail.scale.set(w, len, w);
  tail.position.copy(origin).addScaledVector(dir, len * 0.5);
}
function spinBodies(dtDays) {
  for (const key in bodyMeshes) {
    const b = bodyMeshes[key].userData.body;
    if (b.spinHours) bodyMeshes[key].rotation.y += (dtDays * 24 / b.spinHours) * 2 * Math.PI;
  }
}

// ---------------------------------------------------------------------------
//  Interaction
// ---------------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', onPointerDown);
function onPointerDown(e) {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const targets = state.mode === 'solar' ? clickableBodies : clickableStars;
  const hits = raycaster.intersectObjects(targets, true);
  if (hits.length) {
    let o = hits[0].object;
    while (o && !o.userData.body && !o.userData.star) o = o.parent;
    if (o) selectObject(o.userData.body || o.userData.star);
  }
}

// ---------------------------------------------------------------------------
//  Info panel (shared by bodies and stars)
// ---------------------------------------------------------------------------
const infoEl = document.getElementById('info');
const infoBody = document.getElementById('infoBody');
const infoTitle = document.getElementById('infoTitle');
function typeName(obj) {
  if (obj.spectral) return 'Star · ' + obj.spectral;
  return { star: 'Star', planet: 'Planet', moon: 'Moon', comet: 'Comet', asteroid: 'Asteroid' }[obj.type] || obj.type;
}
function selectObject(obj) { state.selectedKey = obj.key; followTarget = bodyMeshes[obj.key] || null; showInfo(obj); focusOn(obj.key); syncHash(); }
function showInfo(data) {
  const color = (data.color || 0xffffff).toString(16).padStart(6, '0');
  const facts = Object.entries(data.facts).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
  const highlights = data.highlights.map(h => `<li>${h}</li>`).join('');
  infoTitle.textContent = data.nameZh;   // the bar keeps naming it while folded
  infoBody.innerHTML = `
    <div class="info-head">
      <span class="dot" style="background:#${color}"></span>
      <div><h2>${data.nameZh} <small>${data.nameEn}</small></h2>
      <span class="tag">${typeName(data)}</span></div>
    </div>
    <p class="blurb">${data.blurb}</p>
    ${data.type === 'planet' ? `
    <h3>Live physics · Vis-viva</h3>
    <div class="formula-block sm">$$v^2 = GM\\!\\left(\\frac{2}{r} - \\frac{1}{a}\\right)$$</div>
    <table class="facts live-physics">
      <tr><td>Orbital speed now</td><td><span id="lpV" class="lp-val">—</span></td></tr>
      <tr><td>Sun distance now</td><td><span id="lpR">—</span></td></tr>
      <tr><td>At perihelion (fastest)</td><td><span id="lpVp">—</span></td></tr>
      <tr><td>At aphelion (slowest)</td><td><span id="lpVa">—</span></td></tr>
      <tr><td>True anomaly ν</td><td><span id="lpNu">—</span></td></tr>
      <tr><td>Escape speed (here)</td><td><span id="lpVesc">—</span></td></tr>
      <tr class="lp-try"><td>Try a speed here</td><td><input type="number" id="lpInput" class="lp-input" step="1" min="0" placeholder="km/s" /> km/s</td></tr>
      <tr><td>→ Orbit it would give</td><td><span id="lpCalc" class="lp-val">—</span></td></tr>
    </table>` : ''}
    <h3>Notable features</h3><ul class="highlights">${highlights}</ul>
    <h3>Key data</h3><table class="facts">${facts}</table>
    ${data.mechanics ? `
    <button class="derive-btn" id="deriveBtn">🔬 ${isStar(data) ? 'Position' : 'Orbit'} &amp; gravity derivation →</button>` : ''}`;
  infoEl.classList.add('visible');
  infoEl.classList.remove('collapsed');   // a fresh selection always opens up
  renderMath(infoBody);
  const db = document.getElementById('deriveBtn');
  if (db) db.onclick = () => openDerivation(data);

  // Vis-viva sandbox: type a speed → invert v² = GM(2/r − 1/a) at the planet's
  // current Sun distance r to get the orbit (semi-major axis, period) that speed
  // would produce — or flag it as unbound if it exceeds escape speed.
  const lpIn = document.getElementById('lpInput');
  if (lpIn) {
    const runVisViva = () => {
      const out = document.getElementById('lpCalc');
      const k = state.selectedKey;
      if (!out || !k) return;
      const s = orbitalSpeeds(k, julianDate(state.simDate));   // uses current r
      const kms = parseFloat(lpIn.value);
      if (!isFinite(kms) || kms <= 0) { out.textContent = '—'; return; }
      const vAUday = kms / AU_DAY_TO_KM_S;
      const invA = 2 / s.r - (vAUday * vAUday) / GM_SUN;       // 1/a
      const vEsc = Math.sqrt(2 * GM_SUN / s.r) * AU_DAY_TO_KM_S;
      if (invA <= 1e-9) {
        out.innerHTML = `<span class="lp-unbound">unbound — escapes the Sun</span> <span class="lp-cmp">(v ≥ v_esc ≈ ${vEsc.toFixed(1)} km/s)</span>`;
        return;
      }
      const aNew = 1 / invA;                                   // AU
      const periodYr = 2 * Math.PI * Math.sqrt(aNew ** 3 / GM_SUN) / 365.25;
      const cmp = aNew > s.a * 1.001 ? 'wider orbit' : (aNew < s.a * 0.999 ? 'tighter orbit' : 'same as now');
      out.innerHTML = `a = <b>${aNew.toFixed(3)} AU</b> · period ${periodYr.toFixed(2)} yr <span class="lp-cmp">(${cmp})</span>`;
    };
    lpIn.oninput = runVisViva;
    // Start from the planet's real current speed so it lands on the true orbit
    const s0 = orbitalSpeeds(data.key, julianDate(state.simDate));
    lpIn.value = (s0.v * AU_DAY_TO_KM_S).toFixed(1);
    runVisViva();
  }
}

// Is this object a star? (stars carry a spectral type; the Sun is a star too)
function isStar(data) { return !!data.spectral || data.type === 'star'; }

// ---------------------------------------------------------------------------
//  Second layer: orbit / position + surface-gravity derivation (modal overlay)
// ---------------------------------------------------------------------------
const deriveOverlay = document.getElementById('deriveOverlay');

// Typeset every $$…$$ / \(…\) block inside an element with KaTeX (if loaded)
function renderMath(el) {
  if (!el || !window.renderMathInElement) return;
  window.renderMathInElement(el, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\(', right: '\\)', display: false }
    ],
    throwOnError: false
  });
}

// Format a number in scientific notation with Unicode superscripts, e.g. 4.46×10¹⁵
function fmtExp(x, digits = 2) {
  if (!isFinite(x) || x === 0) return String(x);
  const exp = Math.floor(Math.log10(Math.abs(x)));
  const mant = (x / 10 ** exp).toFixed(digits);
  const sup = String(exp).replace(/[-0-9]/g, c => (c === '-' ? '⁻' : '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]));
  return `${mant}×10${sup}`;
}

function openDerivation(data) {
  const m = data.mechanics;
  if (!m) return;
  const star = isStar(data);
  // Standard (general) formulas, rendered as textbook math above the worked numbers
  const posFormula = star
    ? String.raw`$$x = d\cos\delta\cos\alpha,\quad y = d\cos\delta\sin\alpha,\quad z = d\sin\delta$$`
    : String.raw`$$M = E - e\sin E \qquad r = a\,(1 - e\cos E)$$` +
      String.raw`$$v^2 = GM\!\left(\frac{2}{r} - \frac{1}{a}\right)$$`;
  const gFormula = star
    ? String.raw`$$g = g_\odot\,\frac{M/M_\odot}{(R/R_\odot)^2}$$`
    : String.raw`$$g = \frac{GM}{R^2}$$`;
  const isPlanet = data.type === 'planet';
  const dyn = isPlanet ? orbitalDynamics(data.key, julianDate(state.simDate)) : null;
  const el = isPlanet ? orbitalElements(data.key, julianDate(state.simDate)) : null;
  const lawFormula = String.raw`$$T = 2\pi\sqrt{\tfrac{a^3}{GM}}\qquad \varepsilon = -\frac{GM}{2a}\qquad h = \sqrt{GM\,a(1-e^2)}\qquad \frac{dA}{dt}=\frac{h}{2}$$`;
  // Derived reference quantities (Solar-System bodies carry mass/radius; planets also albedo)
  let vEsc, vOrb, rho, teq = null;
  const derivedFormula = String.raw`$$v_{\text{esc}}=\sqrt{\tfrac{2GM}{R}}\qquad v_{\text{orb}}=\sqrt{\tfrac{GM}{R}}\qquad \rho=\frac{M}{\tfrac{4}{3}\pi R^3}\qquad T_{\text{eq}}=T_\odot\sqrt{\tfrac{R_\odot}{2d}}(1-A)^{1/4}$$`;
  if (m.massKg) {
    const G = 6.674e-11, GMb = G * m.massKg, R = m.radiusM;
    vEsc = Math.sqrt(2 * GMb / R) / 1000;
    vOrb = Math.sqrt(GMb / R) / 1000;
    rho = m.massKg / ((4 / 3) * Math.PI * R ** 3) / 1000;   // kg/m³ → g/cm³
    if (isPlanet && m.albedo != null && dyn) {
      const Tsun = 5772, Rsun = SUN.mechanics.radiusM, AU_M = 1.495978707e11;
      teq = Tsun * Math.sqrt(Rsun / (2 * dyn.a * AU_M)) * (1 - m.albedo) ** 0.25;
    }
  }
  document.getElementById('deriveTitle').textContent = `${data.nameZh} — derivation`;
  document.getElementById('deriveSub').textContent = star
    ? 'How its 3D position is mapped, and how its surface gravity is found'
    : 'How its orbit is solved, and how its surface gravity is found';
  const body = document.getElementById('deriveBody');
  body.innerHTML = `
    <div class="derive-section">
      <h3>${star ? '3D position mapping' : 'Orbit computation'}</h3>
      <div class="formula-block">${posFormula}</div>
      <p class="mech-note">${m.orbit}</p>
    </div>
    ${isPlanet && el ? `
    <div class="derive-section">
      <h3>Orbit from its six elements</h3>
      <p class="mech-note">The six Keplerian elements <b>a, e, i, Ω, ω, M</b> fully fix the orbit. The position at any moment follows in four steps — the same forward model an orbit determination is checked against. The formulas are general; the numbers below are ${data.nameZh}'s real J2000 elements.</p>
      <ol class="six-steps">
        <li><span class="six-lbl">① Mean anomaly grows uniformly with time</span>
          <div class="formula-block">$$M = M_0 + n\\,(t-t_0),\\qquad n=\\sqrt{\\tfrac{GM}{a^{3}}}$$</div></li>
        <li><span class="six-lbl">② Solve Kepler's equation for E (Newton–Raphson)</span>
          <div class="formula-block">$$M = E - e\\sin E,\\qquad E_{k+1}=E_k-\\dfrac{E_k-e\\sin E_k-M}{1-e\\cos E_k}$$</div></li>
        <li><span class="six-lbl">③ Coordinates in the orbital plane</span>
          <div class="formula-block">$$x'=a(\\cos E-e),\\quad y'=a\\sqrt{1-e^{2}}\\,\\sin E,\\quad r=a(1-e\\cos E)$$</div></li>
        <li><span class="six-lbl">④ Rotate into 3D space by ω, i, Ω</span>
          <div class="formula-block">$$\\mathbf{r}=R_z(\\Omega)\\,R_x(i)\\,R_z(\\omega)\\begin{bmatrix}x'\\\\ y'\\\\ 0\\end{bmatrix}$$</div></li>
      </ol>
      <table class="facts">
        <tr><td>a · semi-major axis</td><td class="mech-g">${el.a.toFixed(4)} AU</td></tr>
        <tr><td>e · eccentricity</td><td>${el.e.toFixed(5)}</td></tr>
        <tr><td>i · inclination</td><td>${el.i.toFixed(3)}°</td></tr>
        <tr><td>Ω · longitude of ascending node</td><td>${el.node.toFixed(2)}°</td></tr>
        <tr><td>ω · argument of perihelion</td><td>${el.omega.toFixed(2)}°</td></tr>
        <tr><td>M · mean anomaly (at shown date)</td><td class="mech-g">${el.M.toFixed(2)}°</td></tr>
      </table>
    </div>` : ''}
    ${isPlanet ? `
    <div class="derive-section">
      <h3>Conservation &amp; orbital laws</h3>
      <div class="formula-block">${lawFormula}</div>
      <table class="facts">
        <tr><td>Kepler III · period T</td><td class="mech-g">${dyn.periodYears.toFixed(2)} yr</td></tr>
        <tr><td>Specific energy ε</td><td>${(dyn.epsSI / 1e6).toFixed(1)} MJ/kg <span class="const-tag">conserved</span></td></tr>
        <tr><td>Specific ang. momentum h</td><td>${fmtExp(dyn.hSI)} m²/s <span class="const-tag">conserved</span></td></tr>
        <tr><td>Areal velocity dA/dt</td><td>${fmtExp(dyn.dAdtSI)} m²/s</td></tr>
        <tr><td>Synodic period vs Earth</td><td>${isFinite(dyn.synodicDays) ? dyn.synodicDays.toFixed(0) + ' days (' + dyn.synodicYears.toFixed(2) + ' yr)' : '—'}</td></tr>
      </table>
    </div>` : ''}
    <div class="derive-section">
      <h3>Surface gravity</h3>
      ${m.gCalc
        ? `<div class="formula-block">$$${m.gCalc}$$</div>`
        : `<div class="formula-block">${gFormula}</div>`}
      <table class="facts">
        <tr><td>Value</td><td class="mech-g">${m.gValue}</td></tr>
        ${m.gCalc
          ? (m.gNote ? `<tr><td>Notes</td><td class="mech-note">${m.gNote}</td></tr>` : '')
          : `<tr><td>How g is found</td><td class="mech-formula">${m.gMethod}</td></tr>`}
      </table>
    </div>
    ${m.massKg ? `
    <div class="derive-section">
      <h3>Derived reference quantities</h3>
      <div class="formula-block">${derivedFormula}</div>
      <table class="facts">
        <tr><td>Surface escape speed</td><td class="mech-g">${vEsc.toFixed(2)} km/s</td></tr>
        <tr><td>Orbital (first cosmic) speed</td><td>${vOrb.toFixed(2)} km/s</td></tr>
        <tr><td>Mean density</td><td>${rho.toFixed(2)} g/cm³${rho < 1 ? ' <span class="const-tag">&lt; water</span>' : ''}</td></tr>
        ${teq != null ? `<tr><td>Equilibrium temp.</td><td>${teq.toFixed(0)} K (${(teq - 273.15).toFixed(0)} °C) <span class="const-tag">no greenhouse</span></td></tr>` : ''}
      </table>
    </div>` : ''}`;
  renderMath(body);
  deriveOverlay.classList.add('visible');
}
function closeDerivation() { deriveOverlay.classList.remove('visible'); }
deriveOverlay.addEventListener('click', e => { if (e.target === deriveOverlay) closeDerivation(); });
document.getElementById('deriveClose').onclick = closeDerivation;
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDerivation(); });

// ---------------------------------------------------------------------------
//  Help / legend overlay — navigation, the label colour legend and the keyboard
//  shortcuts. Opened from the ? button in #controls or the ? / H keys, and shown
//  once automatically on a visitor's first entry into the 3D app.
// ---------------------------------------------------------------------------
const helpOverlay = document.getElementById('helpOverlay');
const HELP_SEEN_KEY = 'cosmicOrbits.helpSeen';

// localStorage throws outright in some privacy modes — never let it break the app.
function helpSeen() {
  try { return localStorage.getItem(HELP_SEEN_KEY) === '1'; } catch { return false; }
}
function markHelpSeen() {
  try { localStorage.setItem(HELP_SEEN_KEY, '1'); } catch { /* storage unavailable — just show it again next time */ }
}

function openHelp() { helpOverlay.classList.add('visible'); markHelpSeen(); }
function closeHelp() { helpOverlay.classList.remove('visible'); }

// First-visit auto-show. Deliberately NOT fired while the cinematic intro tour is
// flying: enterApp() defers it to endTour() so the two never compete for attention,
// and a non-solar entry (which runs no tour) opens it straight away. The short
// delay lets the mode transition settle first.
function maybeAutoShowHelp() {
  if (helpSeen()) return;
  setTimeout(() => { if (!helpSeen()) openHelp(); }, 600);   // re-check: they may have opened it by hand
}

helpOverlay.addEventListener('click', e => { if (e.target === helpOverlay) closeHelp(); });
document.getElementById('helpClose').onclick = closeHelp;
document.getElementById('helpBtn').onclick = openHelp;

// Live vis-viva readout, refreshed each frame while a planet is selected
function updateLivePhysics(jd) {
  const k = state.selectedKey;
  if (!k || !bodyMeshes[k] || bodyMeshes[k].userData.body.type !== 'planet') return;
  const el = document.getElementById('lpV');
  if (!el) return;
  const s = orbitalSpeeds(k, jd);
  const d = orbitalDynamics(k, jd);
  el.textContent = (s.v * AU_DAY_TO_KM_S).toFixed(2) + ' km/s';
  document.getElementById('lpR').textContent  = s.r.toFixed(3) + ' AU';
  document.getElementById('lpVp').textContent = (s.vPeri * AU_DAY_TO_KM_S).toFixed(2) + ' km/s';
  document.getElementById('lpVa').textContent = (s.vAph * AU_DAY_TO_KM_S).toFixed(2) + ' km/s';
  document.getElementById('lpNu').textContent = d.nuDeg.toFixed(1) + '°';
  document.getElementById('lpVesc').textContent = d.vEscKmS.toFixed(2) + ' km/s';
}

// Camera focus
let focusTarget = null;
// Follow-cam: the mesh the camera should stay centred on (set on select).
// Kept as a solar-system body mesh only; stars don't move so follow is a no-op there.
let followTarget = null;
const _followP = new THREE.Vector3();
const _followDelta = new THREE.Vector3();
function focusOn(key) {
  const map = state.mode === 'solar' ? bodyMeshes : starMeshes;
  if (map[key]) focusTarget = map[key];
}

// ---------------------------------------------------------------------------
//  UI bindings
// ---------------------------------------------------------------------------
const dateLabel = document.getElementById('dateLabel');
const speedInput = document.getElementById('speedInput');
const speedSlider = document.getElementById('speed');
const playBtn = document.getElementById('playBtn');
const timeControls = document.getElementById('timeControls');
const bodyListEl = document.getElementById('bodyList');

const fmtDate = d => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const SPEED_MIN = -200, SPEED_MAX = 200;   // slider range; the input box may exceed it
const updateSpeedLabel = () => {
  if (document.activeElement !== speedInput) speedInput.value = state.daysPerSecond;
  const clamped = Math.max(SPEED_MIN, Math.min(SPEED_MAX, state.daysPerSecond));
  if (+speedSlider.value !== clamped) speedSlider.value = clamped;
};

speedSlider.addEventListener('input', () => { state.daysPerSecond = +speedSlider.value; updateSpeedLabel(); });
speedInput.addEventListener('input', () => {
  const v = parseFloat(speedInput.value);
  if (!isFinite(v)) return;                 // ignore empty / partial input
  state.daysPerSecond = v;                  // any value, even beyond the slider
  speedSlider.value = Math.max(SPEED_MIN, Math.min(SPEED_MAX, v));
});
playBtn.addEventListener('click', () => { state.playing = !state.playing; playBtn.textContent = state.playing ? '⏸ Pause' : '▶ Play'; });
document.getElementById('nowBtn').addEventListener('click', () => { state.simDate = new Date(); refreshOrbits(); });
document.getElementById('orbitsToggle').addEventListener('change', e => {
  state.showOrbits = e.target.checked;
  for (const k in orbitLines) orbitLines[k].visible = state.showOrbits;
  for (const rig of cometRigs) rig.orbitLine.visible = state.showOrbits;
});
document.getElementById('sweepToggle').addEventListener('change', e => { state.showSweep = e.target.checked; });
document.getElementById('compactToggle').addEventListener('change', e => { compressTarget = e.target.checked ? 1 : 0; });
document.getElementById('followToggle').addEventListener('change', e => { state.follow = e.target.checked; });

// Restore the CURRENT mode's default framing without switching mode: drop the
// selection and any focus/follow lock, then re-place the camera exactly the way
// setMode() does. Shared by the 🏠 button and the R shortcut.
function resetView() {
  endTour();                     // a running intro flight would immediately fight the reset
  focusTarget = null;
  followTarget = null;
  state.selectedKey = null;
  infoEl.classList.remove('visible');
  clearRecoveredOrbit();         // 🏠 / R also wipes the orbit lab's green overlay
  controls.target.set(0, 0, 0);
  camera.position.set(0, state.mode === 'solar' ? 120 : 260, state.mode === 'solar' ? 260 : 620);
  syncHash();                    // drop the selected-body key from the URL
}
document.getElementById('resetBtn').addEventListener('click', resetView);

// Fold either side panel down to its title strip. The bar itself is the button,
// so the whole strip stays a big, obvious hit target once collapsed.
function wirePanelFold(panel, bar) {
  if (!panel || !bar) return;
  bar.addEventListener('click', () => {
    const collapsed = panel.classList.toggle('collapsed');
    bar.setAttribute('aria-expanded', String(!collapsed));
  });
}
wirePanelFold(document.getElementById('controls'), document.getElementById('controlsBar'));
wirePanelFold(infoEl, document.getElementById('infoBar'));

// ---------------------------------------------------------------------------
//  Keyboard shortcuts — Space play/pause · R reset view · O orbit lines ·
//  ? / H help · Esc close panels.
//  Two guards matter: never fire while the user is typing in one of the app's
//  form fields (#speedInput, #lpInput, #ephemDate, #ephemBody), and never
//  swallow a browser shortcut (Cmd/Ctrl/Alt held, e.g. Cmd+R to reload).
// ---------------------------------------------------------------------------
document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  // Escape is handled ahead of the typing guard — it isn't a typing key, so it
  // should still dismiss panels from inside a field. (The derivation modal has
  // its own Escape handler; this adds the help/events/ephemeris panels.)
  if (e.key === 'Escape') {
    closeHelp();
    eventsPanel.classList.remove('visible');
    ephemPanel.classList.remove('visible');
    odPanel.classList.remove('visible');
    return;
  }
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  switch (e.key) {
    case ' ':
    case 'Spacebar':             // legacy key name
      e.preventDefault();        // stop the page scrolling (and a focused button re-firing)
      playBtn.click();           // reuse the button's own handler so its label stays in sync
      break;
    case 'r': case 'R':
      resetView();
      break;
    case 'o': case 'O': {
      // Flip the checkbox and fire `change` so the existing listener does the work
      const cb = document.getElementById('orbitsToggle');
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event('change'));
      break;
    }
    case '?': case 'h': case 'H':
      openHelp();
      break;
  }
});

// Quick-select chips for bodies / stars (rebuilt on mode switch)
function rebuildChips() {
  bodyListEl.innerHTML = '';
  // Grouped by family so each kind of body sits together under its own heading
  const groups = state.mode === 'solar'
    ? [
        { label: 'Sun & planets', items: [SUN, ...PLANETS, MOON] },
        { label: 'Asteroids',     items: ASTEROIDS },
        { label: 'Comets',        items: COMETS }
      ]
    : [{ label: 'Nearby stars', items: starData }];

  for (const g of groups) {
    if (!g.items.length) continue;
    const head = document.createElement('div');
    head.className = 'chip-group';
    head.textContent = g.label;
    bodyListEl.appendChild(head);
    for (const b of g.items) {
      const color = (b.color || 0xffffff).toString(16).padStart(6, '0');
      const btn = document.createElement('button');
      btn.className = 'body-chip';
      btn.innerHTML = `<span class="dot" style="background:#${color}"></span>${b.nameZh}`;
      btn.onclick = () => selectObject(b);
      bodyListEl.appendChild(btn);
    }
  }
}

// Mode switching
const tabSolar = document.getElementById('tabSolar');
const tabStars = document.getElementById('tabStars');
const tabOrigins = document.getElementById('tabOrigins');
const controlsEl = document.getElementById('controls');   // the whole bottom-left control panel
// Toggle every CSS2DObject label inside a group. The CSS2DRenderer in this
// build honours only each label's own `.visible`, not its parent Group's, so
// hiding a Group leaves its text labels floating — we must set them explicitly.
function setLabelsVisible(group, visible) {
  group.traverse(o => {
    if (o.isCSS2DObject || o.element) o.visible = visible;
  });
}

function setMode(m) {
  state.mode = m;
  // Leaving a view cancels any intro flight still in progress — otherwise the
  // tour keeps driving the camera with Solar-System waypoints after the user has
  // switched away, stealing control (and leaving its hint on screen).
  endTour();
  const origins = (m === 'origins');
  if (origins) buildOrigins();   // lazily build the timeline the first time Origins is shown
  solarGroup.visible = (m === 'solar');
  starsGroup.visible = (m === 'stars');
  // Keep labels in lock-step with their mode (see setLabelsVisible above).
  setLabelsVisible(solarGroup, m === 'solar');
  setLabelsVisible(starsGroup, m === 'stars');
  timeControls.style.display = (m === 'solar') ? '' : 'none';
  // Tools that only mean anything against the Solar System (sky events, ephemeris)
  document.querySelectorAll('.solar-only').forEach(b => { b.style.display = (m === 'solar') ? '' : 'none'; });
  // Origins is a flat, scrolling article rather than a 3D view: hide the live-sim
  // chrome and reveal the timeline (the 3D scene keeps rendering quietly behind it).
  controlsEl.style.display = origins ? 'none' : '';
  originsPanel.classList.toggle('visible', origins);
  if (origins) {
    eventsPanel.classList.remove('visible');
    ephemPanel.classList.remove('visible');
    odPanel.classList.remove('visible');
  }
  // The recovered-orbit ellipse only means anything against the Solar System's
  // true orbits — drop it (and its GPU buffers) the moment we leave that view.
  if (m !== 'solar') clearRecoveredOrbit();
  tabSolar.classList.toggle('active', m === 'solar');
  tabStars.classList.toggle('active', m === 'stars');
  tabOrigins.classList.toggle('active', origins);
  focusTarget = null;
  followTarget = null;
  state.selectedKey = null;
  controls.target.set(0, 0, 0);
  camera.position.set(0, m === 'solar' ? 120 : 260, m === 'solar' ? 260 : 620);
  rebuildChips();
  infoEl.classList.remove('visible');
}
tabSolar.onclick = () => { setMode('solar'); syncHash(); };
tabStars.onclick = () => { setMode('stars'); syncHash(); };
tabOrigins.onclick = () => { setMode('origins'); syncHash(); };

// ---------------------------------------------------------------------------
//  C) Origins — a full-screen, vertically-scrolling cosmic timeline. The chapter
//     data lives in origins.js; here we render it into #originsPanel once (the
//     first time the mode is shown) and reuse the derivation modal for a
//     chapter's optional full derivation.
// ---------------------------------------------------------------------------
const originsPanel = document.getElementById('originsPanel');
let originsBuilt = false;

// Open a chapter's derivation in the shared #deriveOverlay modal. We only fill
// its slots and flip it visible — the existing close button / Esc / backdrop
// click handlers dismiss it, so we don't wire any of our own.
function openOriginsDerivation(derive) {
  document.getElementById('deriveTitle').textContent = derive.title;
  document.getElementById('deriveSub').textContent = '';
  const body = document.getElementById('deriveBody');
  body.innerHTML = derive.html;
  renderMath(body);
  deriveOverlay.classList.add('visible');
}

function buildOrigins() {
  if (originsBuilt) return;   // build once, then just toggle visibility
  originsBuilt = true;
  let html = `
    <div class="origins-inner">
      <header class="origins-head">
        <h1>Origins</h1>
        <p>A scroll through cosmic history — from the first instant to the world beneath your feet.</p>
      </header>`;
  for (const ch of ORIGINS) {
    html += `
      <article class="origin-card">
        <div class="origin-top">
          <span class="origin-icon">${ch.icon}</span>
          <span class="origin-epoch">${ch.epoch}</span>
        </div>
        <h2 class="origin-title">${ch.title}</h2>
        <div class="origin-body">${ch.body}</div>
        ${ch.formula ? `<div class="formula-block">$$${ch.formula}$$</div>` : ''}
        ${ch.derive ? `<button class="derive-btn origin-derive" data-id="${ch.id}">Show the full derivation →</button>` : ''}
      </article>`;
  }
  // Hand-off CTA: from the story straight into the live simulation.
  html += `
      <div class="origins-cta-wrap">
        <button id="originsCta" class="cta primary">Enter the Solar System →</button>
      </div>
    </div>`;
  originsPanel.innerHTML = html;

  // Wire each chapter's derivation button to the shared modal.
  originsPanel.querySelectorAll('.origin-derive').forEach(btn => {
    const ch = ORIGINS.find(c => c.id === btn.dataset.id);
    if (ch && ch.derive) btn.onclick = () => openOriginsDerivation(ch.derive);
  });

  // Hand-off: drop the reader into the live sim exactly the way the landing's
  // Enter button does — enter the app on first run, otherwise just switch mode.
  const cta = document.getElementById('originsCta');
  if (cta) cta.onclick = () => {
    if (!appEntered) enterApp('solar');
    else setMode('solar');
    syncHash();
  };

  renderMath(originsPanel);   // typeset all $$…$$ and \( \) across every chapter
}

// ---------------------------------------------------------------------------
//  Sky-events panel (computed lazily)
// ---------------------------------------------------------------------------
const eventsBtn = document.getElementById('eventsBtn');
const eventsPanel = document.getElementById('eventsPanel');
const eventsList = document.getElementById('eventsList');
let eventsBuilt = false;
const EVENT_ICON = { opposition: '🔭', elongation: '🌗', conjunction: '✨' };

function buildEvents() {
  const events = computeEvents(new Date(), 8);
  eventsList.innerHTML = events.map((e, i) => `
    <li data-i="${i}" data-t="${e.date.getTime()}">
      <span class="ev-icon">${EVENT_ICON[e.type]}</span>
      <span class="ev-date">${e.dateStr}</span>
      <span class="ev-title">${e.title}</span>
      <span class="ev-desc">${e.desc}</span>
    </li>`).join('');
  eventsList.querySelectorAll('li').forEach(li => {
    li.onclick = () => {
      const t = +li.dataset.t;
      if (state.mode !== 'solar') setMode('solar');
      state.simDate = new Date(t);
      state.playing = false; playBtn.textContent = '▶ Play';
      refreshOrbits();
    };
  });
  eventsBuilt = true;
}
eventsBtn.onclick = () => {
  if (!eventsBuilt) buildEvents();
  ephemPanel.classList.remove('visible');
  eventsPanel.classList.toggle('visible');
};
document.getElementById('eventsClose').onclick = () => eventsPanel.classList.remove('visible');

// ---------------------------------------------------------------------------
//  Ephemeris panel — date + body → apparent geocentric RA / Dec
// ---------------------------------------------------------------------------
const ephemBtn = document.getElementById('ephemBtn');
const ephemPanel = document.getElementById('ephemPanel');
const ephemBody = document.getElementById('ephemBody');
const ephemDate = document.getElementById('ephemDate');
const ephemResult = document.getElementById('ephemResult');
const EPHEM_BODIES = [
  ['sun', '☉ Sun'], ['mercury', '☿ Mercury'], ['venus', '♀ Venus'], ['mars', '♂ Mars'],
  ['jupiter', '♃ Jupiter'], ['saturn', '♄ Saturn'], ['uranus', '♅ Uranus'], ['neptune', '♆ Neptune']
];
let ephemInit = false;

function initEphem() {
  ephemBody.innerHTML = EPHEM_BODIES.map(([k, n]) => `<option value="${k}">${n}</option>`).join('');
  ephemBody.value = 'mars';
  ephemDate.value = new Date().toISOString().slice(0, 10);
  ephemInit = true;
}

function runEphem() {
  const key = ephemBody.value;
  const iso = ephemDate.value || new Date().toISOString().slice(0, 10);
  const e = ephemeris(key, new Date(iso + 'T00:00:00Z'));
  const name = (EPHEM_BODIES.find(b => b[0] === key) || [key, key])[1];
  ephemResult.innerHTML = `
    <div class="ephem-out">
      <div class="ephem-row"><span>Right ascension</span><strong>${e.raStr}</strong></div>
      <div class="ephem-row"><span>Declination</span><strong>${e.decStr}</strong></div>
      <div class="ephem-row"><span>Distance from Earth</span><strong>${e.distAU.toFixed(3)} AU</strong></div>
      <p class="ephem-hint">${name} · ${iso} · geocentric equatorial (J2000)</p>
    </div>`;
}

ephemBtn.onclick = () => {
  if (!ephemInit) initEphem();
  eventsPanel.classList.remove('visible');
  const showing = ephemPanel.classList.toggle('visible');
  if (showing) runEphem();
};
document.getElementById('ephemClose').onclick = () => ephemPanel.classList.remove('visible');
document.getElementById('ephemGo').onclick = runEphem;
ephemBody.onchange = runEphem;
ephemDate.onchange = runEphem;

// ---------------------------------------------------------------------------
//  Orbit-determination lab — the inverse of the ephemeris panel. We synthesise
//  three (RA, Dec) sightings of a real asteroid from its JPL elements, hand
//  ONLY those six numbers to Gauss's method, and compare the orbit it recovers
//  with the truth we started from. The recovered ellipse is also drawn into the
//  live scene, where it should sit right on top of the real one.
// ---------------------------------------------------------------------------
const odPanel = document.getElementById('odPanel');
const odBodySel = document.getElementById('odBody');
const odDateEls = ['odDate1', 'odDate2', 'odDate3'].map(id => document.getElementById(id));
const odNoiseEl = document.getElementById('odNoise');
const odResult = document.getElementById('odResult');
let odInit = false;

// Two opposite errors bound a usable arc, and the default spacing has to sit
// between them:
//   • too SHORT — the three sight-lines are nearly parallel, so triangulating
//     the ranges is ill-conditioned and the octic can favour a wrong root;
//   • too LONG  — the truncated f and g series stops describing the motion.
// Scaling with the period (~1.2% of it) lands main-belt objects in the ~2–3 week
// window where both errors are negligible, which is also the cadence a real
// observing campaign uses.
function odSpacingDays(body) {
  return Math.max(3, Math.min(25, Math.round(body.period * 0.012)));
}
// Objects whose orbit is close to Earth's are genuinely harder to solve from a
// short arc; flag them in the picker rather than let the user think it's a bug.
const odIsNearEarth = body => body.a < 1.7;
const odToISO = d => new Date(d).toISOString().slice(0, 10);

// Fill the three date inputs with a well-conditioned run for the chosen body.
function odFillDates() {
  const body = ASTEROIDS.find(a => a.key === odBodySel.value) || ASTEROIDS[0];
  const step = odSpacingDays(body);
  const t0 = Date.now();
  odDateEls.forEach((el, i) => { el.value = odToISO(t0 + i * step * 86400000); });
}

function initOD() {
  odBodySel.innerHTML = ASTEROIDS
    .map(a => `<option value="${a.key}">${a.nameZh}${odIsNearEarth(a) ? ' — near-Earth, ill-conditioned' : ''}</option>`)
    .join('');
  odBodySel.value = 'ceres';
  odFillDates();
  odInit = true;
}
odBodySel.onchange = odFillDates;   // re-condition the dates for the new target

// Standard normal deviate (Box–Muller) — used to scatter the synthetic
// measurements when the user asks for observational noise.
function gaussRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const fmtRA = h => {
  const t = Math.round((((h % 24) + 24) % 24) * 3600);
  return `${Math.floor(t / 3600) % 24}h ${String(Math.floor((t % 3600) / 60)).padStart(2, '0')}m ${String(t % 60).padStart(2, '0')}s`;
};
const fmtDec = d => {
  const t = Math.round(Math.abs(d) * 3600);
  return `${d < 0 ? '−' : '+'}${Math.floor(t / 3600)}° ${String(Math.floor((t % 3600) / 60)).padStart(2, '0')}′ ${String(t % 60).padStart(2, '0')}″`;
};

function runOD() {
  const body = ASTEROIDS.find(a => a.key === odBodySel.value);
  if (!body) return;
  const sigma = Math.max(0, parseFloat(odNoiseEl.value) || 0);   // arcsec

  // 1) Synthesise the three sightings from the true orbit, optionally scattered
  //    by the requested measurement error. Dec is offset directly; RA is offset
  //    along the sky, so it must be divided by cos(Dec).
  const jds = odDateEls.map(el => julianDate(new Date((el.value || odToISO(Date.now())) + 'T00:00:00Z')));
  if (jds.some(j => !isFinite(j)) || jds[0] >= jds[1] || jds[1] >= jds[2]) {
    odResult.innerHTML = `<div class="od-error"><b>Dates must increase.</b> Set observation 1 &lt; 2 &lt; 3.</div>`;
    return;
  }
  const observations = jds.map(jd => {
    const o = observeBody(body, jd);
    let ra = o.raHours, dec = o.decDeg;
    if (sigma > 0) {
      dec += (gaussRandom() * sigma) / 3600;
      ra += (gaussRandom() * sigma) / 3600 / Math.cos(dec * Math.PI / 180) / 15;
    }
    return { jd, raHours: ((ra % 24) + 24) % 24, decDeg: dec };
  });

  // 2) Hand the solver nothing but those six numbers.
  const r = determineOrbit(observations);
  if (r.error || !r.elements) {
    clearRecoveredOrbit();
    odResult.innerHTML = `<div class="od-error"><b>The solver could not find an orbit.</b><br />${r.error || 'No usable root.'}<br /><br />Try moving the three dates closer together — Gauss's method needs the observed arc to be a small fraction of the orbit.</div>`;
    return;
  }

  // 3) Score it against the truth we started from, and against the observations.
  const res = residuals(r.elements, r.epochJd, observations);
  const rms = res.rms;
  const el = r.elements;
  const truth = { a: body.a, e: body.e, i: body.I, node: body.node, omega: body.argp };
  const cmp = [
    ['a · semi-major axis', el.a, truth.a, 'AU', true],
    ['e · eccentricity', el.e, truth.e, '', true],
    ['i · inclination', el.i, truth.i, '°', false],
    ['Ω · ascending node', el.node, truth.node, '°', false],
    ['ω · arg. of perihelion', el.omega, truth.omega, '°', false]
  ];
  const angDiff = (x, y) => { let d = Math.abs(x - y) % 360; return d > 180 ? 360 - d : d; };
  // Flag a visibly poor recovery so the panel can explain WHY rather than just
  // showing bad numbers (short arcs are genuinely ill-conditioned).
  const bigMiss = Math.abs(el.a - truth.a) / truth.a > 0.01 || Math.abs(el.e - truth.e) > 0.01;
  const rows = cmp.map(([label, got, want, unit, pct]) => {
    const diff = pct ? Math.abs(got - want) : angDiff(got, want);
    const good = pct ? (want ? diff / Math.abs(want) < 0.01 : diff < 0.01) : diff < 0.5;
    const shown = pct && want ? `${(diff / Math.abs(want) * 100).toFixed(3)}%` : `${diff.toFixed(4)}${unit}`;
    return `<tr><td>${label}</td><td>${got.toFixed(4)}${unit}</td><td>${want.toFixed(4)}${unit}</td>
      <td class="${good ? 'mech-g' : ''}">${shown}</td></tr>`;
  }).join('');

  odResult.innerHTML = `
    <div class="od-section">
      <h3>The three synthetic observations</h3>
      <div class="od-scroll"><table class="od-table">
        <thead><tr><th>Date (UTC)</th><th>Right ascension</th><th>Declination</th></tr></thead>
        <tbody>${observations.map((o, i) => `<tr><td>${odDateEls[i].value}</td><td>${fmtRA(o.raHours)}</td><td>${fmtDec(o.decDeg)}</td></tr>`).join('')}</tbody>
      </table></div>
      <p class="od-note">These six numbers — and nothing else — are what the solver receives.${sigma > 0 ? ` Each was scattered by Gaussian noise of σ = ${sigma}″ to imitate a real measurement.` : ''}</p>
    </div>
    <div class="od-section">
      <h3>Recovered orbit vs. JPL truth</h3>
      <div class="od-scroll"><table class="od-table">
        <thead><tr><th>Element</th><th>Recovered</th><th>True</th><th>Difference</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <div class="od-legend"><span class="od-swatch"></span>The green ellipse now in the scene is the recovered orbit — compare it with ${body.nameZh}'s real one.</div>
    </div>
    <div class="od-section">
      <h3>O−C residuals</h3>
      <div class="od-scroll"><table class="od-table">
        <thead><tr><th>Observation</th><th>Δ RA</th><th>Δ Dec</th><th>Total</th></tr></thead>
        <tbody>${res.map((q, i) => `<tr><td>#${i + 1}</td><td>${q.dRA_arcsec.toFixed(3)}″</td><td>${q.dDec_arcsec.toFixed(3)}″</td><td>${q.total_arcsec.toFixed(3)}″</td></tr>`).join('')}</tbody>
        <tfoot><tr><td>RMS</td><td colspan="3">${rms.toFixed(3)}″</td></tr></tfoot>
      </table></div>
      <p class="od-note"><b>O−C = Observed − Computed.</b> The recovered elements are fed back through the forward model to predict where the object should have been, and the difference is the residual.<br /><br />
      <b>Read this honestly:</b> three observations give six numbers for six unknowns, so the solution is <i>exactly determined</i> — it is forced through all three points and the residuals are near zero <i>by construction</i>. They confirm the solver converged; they do <b>not</b> prove the orbit is right. Only the comparison with JPL above can do that. Real orbit determination therefore uses many more observations and fits them by least squares, where the residuals finally become a genuine test.</p>
    </div>${bigMiss ? `
    <div class="od-section">
      <p class="od-note"><b>Why is this one off?</b> ${
        sigma > 0
          ? `Short-arc orbit determination is acutely sensitive to measurement error: a scatter of only ${sigma}″ is enough to swing the elements this far, because many different orbits thread three nearby points almost equally well. Lower σ to watch it tighten.`
          : `A usable arc is squeezed between two opposite errors. Too <i>short</i> and the three sight-lines are nearly parallel, so triangulating the distances is ill-conditioned — the eighth-degree polynomial can even favour the wrong root. Too <i>long</i> and the truncated f and g series stops describing the motion. ${
              odIsNearEarth(body)
                ? `${body.nameZh} orbits close to Earth, which narrows that window badly.`
                : ''
            } Try other spacings for the three dates and watch the agreement swing.`
      }</p>
    </div>` : ''}
    <div class="od-section">
      <h3>Solver diagnostics</h3>
      <div class="od-diag"><span>Converged</span><strong class="${r.converged ? 'mech-g' : ''}">${r.converged ? 'yes' : 'no (iteration cap)'}</strong></div>
      <div class="od-diag"><span>Iterations</span><strong>${r.iterations}</strong></div>
      <div class="od-diag"><span>r₂ · Sun distance at t₂</span><strong>${r.r2.toFixed(6)} AU</strong></div>
      <div class="od-diag"><span>ρ₁, ρ₂, ρ₃ · Earth distances</span><strong>${r.ranges.map(x => x.toFixed(4)).join(', ')} AU</strong></div>
      <div class="od-diag"><span>Roots of the octic</span><strong class="od-roots">${
        (r.candidateRoots || []).map(x => Math.abs(x - r.r2) < 1e-6
          ? `<span class="od-root-pick">${x.toFixed(4)}</span>` : x.toFixed(4)).join('  ·  ') || '—'
      }</strong></div>
      <p class="od-note">The eighth-degree polynomial can offer several positive real roots; the highlighted one is the branch that reproduces the observations. Physically impossible roots are discarded.</p>
    </div>
    <div class="od-section">
      <h3>How it works</h3>
      <p class="od-step"><b>①</b> An observation fixes only a <i>direction</i>, not a distance:</p>
      <div class="formula-block sm">$$\\vec r_i = \\vec R_i + \\rho_i\\,\\hat\\rho_i$$</div>
      <p class="od-step"><b>②</b> All three positions lie in one plane through the Sun, so they are linearly dependent:</p>
      <div class="formula-block sm">$$c_1\\vec r_1 - \\vec r_2 + c_3\\vec r_3 = 0$$</div>
      <p class="od-step"><b>③</b> Kepler's 2nd law lets those area ratios be approximated by <i>time</i> ratios — the step that breaks the deadlock:</p>
      <div class="formula-block sm">$$c_1 \\approx \\tfrac{\\tau_3}{\\tau},\\qquad c_3 \\approx -\\tfrac{\\tau_1}{\\tau}$$</div>
      <p class="od-step"><b>④</b> Eliminating the unknown ranges closes into an eighth-degree polynomial for the middle distance:</p>
      <div class="formula-block sm">$$r_2^8 + a\\,r_2^6 + b\\,r_2^3 + c = 0$$</div>
      <p class="od-step"><b>⑤</b> The f and g series then give the velocity, and <b>r</b>₂, <b>v</b>₂ convert to the six elements:</p>
      <div class="formula-block sm">$$\\vec v_2 = \\frac{f_3\\vec r_1 - f_1\\vec r_3}{f_3g_1 - f_1g_3}$$</div>
    </div>`;
  renderMath(odResult);

  // 4) Show it: the recovered ellipse only reads against the Solar System view.
  drawRecoveredOrbit(r.elements, r.epochJd);
  if (state.mode !== 'solar') setMode('solar');
}

document.getElementById('odBtn').onclick = () => {
  if (!odInit) initOD();
  eventsPanel.classList.remove('visible');
  ephemPanel.classList.remove('visible');
  odPanel.classList.toggle('visible');
};
document.getElementById('odClose').onclick = () => { odPanel.classList.remove('visible'); clearRecoveredOrbit(); };
document.getElementById('odGo').onclick = runOD;

updateSpeedLabel();
rebuildChips();
showInfo(SUN);

// ---------------------------------------------------------------------------
//  Landing / main interface — cover screen shown before entering the app
// ---------------------------------------------------------------------------
const landing = document.getElementById('landing');
// Whether we've left the cover screen for a 3D view (drives landing vs. view
// in the hash router below).
let appEntered = false;
function enterApp(mode) {
  appEntered = true;
  setMode(mode);
  landing.classList.add('hidden');
  setTimeout(() => { landing.style.display = 'none'; }, 800); // remove after fade-out
  if (mode === 'solar') startTour();   // cinematic fly-through on first entry
  else maybeAutoShowHelp();            // no tour to wait for here, so the first-visit help can open now
}
document.getElementById('enterSolar').onclick = () => { enterApp('solar'); syncHash(); };
document.getElementById('enterStars').onclick = () => { enterApp('stars'); syncHash(); };

// ---------------------------------------------------------------------------
//  Hash routing — every view has its own shareable, reload-safe link.
//  Scheme (hash-based so GitHub Pages deep links survive a refresh):
//    #/                  → cover / landing screen
//    #/solar             → Solar System, no selection
//    #/solar/<key>       → Solar System + that body selected  (e.g. #/solar/earth)
//    #/stars             → Nearby Stars, no selection
//    #/stars/<key>       → Nearby Stars + that star selected  (e.g. #/stars/sirius)
//    #/origins           → Origins timeline (a flat article; no selectable key)
//  `sun` exists in both modes; the mode prefix disambiguates.
// ---------------------------------------------------------------------------

// Look up a body/star DATA object by key within a mode (null if unknown).
function dataForKey(mode, key) {
  const mesh = mode === 'solar' ? bodyMeshes[key] : starMeshes[key];
  if (!mesh) return null;
  return mode === 'solar' ? mesh.userData.body : mesh.userData.star;
}

// Build the hash string that describes the CURRENT view.
function currentHash() {
  if (!appEntered) return '#/';
  if (state.mode === 'origins') return '#/origins';   // the timeline article has no selectable key
  return state.selectedKey && dataForKey(state.mode, state.selectedKey)
    ? `#/${state.mode}/${state.selectedKey}`
    : `#/${state.mode}`;
}

// Write the current view into location.hash (creating a history entry so the
// browser Back/Forward buttons work). We set a guard so the resulting
// `hashchange` event is ignored — this prevents the select→hash→hashchange→
// select feedback loop.
let suppressHashChange = false;
function syncHash() {
  const h = currentHash();
  if (location.hash === h) return;   // already correct — no new history entry, no loop
  suppressHashChange = true;
  location.hash = h;
}

// Parse a hash into { mode, key } or null (empty/root → landing).
function parseHash(hash) {
  const raw = (hash || '').replace(/^#\/?/, '');   // strip leading '#' and optional '/'
  if (!raw) return null;
  const [mode, key] = raw.split('/');
  if (mode !== 'solar' && mode !== 'stars' && mode !== 'origins') return null;
  return { mode, key: key || null };
}

// Apply a route to the app. Idempotent: re-applying the same route is a no-op
// beyond the (cheap) redundant setMode/selectObject, and it never touches the
// hash itself, so it cannot re-trigger hashchange.
function applyRoute(route) {
  if (!route) {   // root → show the cover screen
    if (appEntered) {   // e.g. Back button from a view to the landing
      appEntered = false;
      landing.classList.remove('hidden');
      landing.style.display = '';
    }
    return;
  }
  // Enter the app (skipping the cover) if we're not already in it.
  if (!appEntered) enterApp(route.mode);
  else if (state.mode !== route.mode) setMode(route.mode);

  if (route.key) {
    const data = dataForKey(route.mode, route.key);
    if (data) {
      if (state.selectedKey !== route.key) selectObject(data);
    } else if (state.selectedKey !== null) {
      // Unknown key → fall back to the mode overview (no selection, no throw).
      setMode(route.mode);
    }
  } else if (state.selectedKey !== null) {
    // Bare mode route but something is selected → clear back to the overview.
    setMode(route.mode);
  }
}

// Restore on load (deep link), then keep in sync with Back/Forward.
function handleHashChange() {
  if (suppressHashChange) { suppressHashChange = false; return; }
  applyRoute(parseHash(location.hash));
}
window.addEventListener('hashchange', handleHashChange);
// NOTE: the initial deep-link restore is deferred to the very end of the module
// (just after animate() starts). A hash like #/solar makes applyRoute → enterApp
// → startTour touch `tour`/TOUR_WP, which are declared further below; running it
// here would hit their temporal-dead-zone and abort the whole module.

// ---------------------------------------------------------------------------
//  Render loop
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
//  Cinematic intro — a short auto flight the first time you enter the Solar
//  System, so a new visitor gets an immediate "wow" instead of a static frame.
//  Any interaction (drag / zoom / Skip) hands control straight back.
// ---------------------------------------------------------------------------
const tourHint = document.getElementById('tourHint');
let tour = null;
const TOUR_WP = [
  { t: 0.00, pos: [0, 16, 50],     look: [0, 0, 0]    },
  { t: 0.24, pos: [58, 28, 96],    look: [8, 0, 4]    },
  { t: 0.48, pos: [122, 96, 26],   look: [0, 0, 0]    },
  { t: 0.74, pos: [-150, 76, 206], look: [-45, 0, 56] },
  { t: 1.00, pos: [0, 158, 320],   look: [0, 0, 0]    }
];
const _twa = new THREE.Vector3(), _twb = new THREE.Vector3();
const _tla = new THREE.Vector3(), _tlb = new THREE.Vector3();
const smoothstep = x => x * x * (3 - 2 * x);

function startTour() {
  tour = { start: performance.now(), dur: 17000 };
  if (tourHint) tourHint.classList.add('visible');
}
// `offerHelp` is true only when the tour ended on its own terms — it ran to the
// end, or the visitor pressed Skip. Someone who grabbed the camera instead is
// already exploring, so we don't interrupt that with the first-visit help; the
// bottom hint and the ? button are still there whenever they want it.
// NOTE: callers wired directly to DOM/controls events must wrap this, or the
// Event object would arrive as a truthy `offerHelp`.
function endTour(offerHelp = false) {
  if (!tour) return;
  tour = null;
  if (tourHint) tourHint.classList.remove('visible');
  if (offerHelp) maybeAutoShowHelp();   // never overlaps the tour: it's over by here
}
function updateTour(now) {
  const p = Math.min(1, (now - tour.start) / tour.dur);
  let i = 0;
  while (i < TOUR_WP.length - 2 && p > TOUR_WP[i + 1].t) i++;
  const a = TOUR_WP[i], b = TOUR_WP[i + 1];
  const lt = smoothstep((p - a.t) / (b.t - a.t || 1));
  camera.position.copy(_twa.fromArray(a.pos).lerp(_twb.fromArray(b.pos), lt));
  controls.target.copy(_tla.fromArray(a.look).lerp(_tlb.fromArray(b.look), lt));
  if (p >= 1) endTour(true);   // watched it through — a good moment to orient them
}
// Any user gesture cancels the flight and returns full control. These are
// wrapped so the Event object never lands in `offerHelp` (see endTour).
controls.addEventListener('start', () => endTour());
renderer.domElement.addEventListener('pointerdown', () => endTour());
renderer.domElement.addEventListener('wheel', () => endTour(), { passive: true });
const _tourSkip = document.getElementById('tourSkip');
// Skipping means "spare me the flight, show me the thing" — orient them.
if (_tourSkip) _tourSkip.onclick = () => endTour(true);

// ---------------------------------------------------------------------------
//  Label declutter — a screen-space pass that hides overlapping labels so text
//  never piles up when bodies crowd together. Each frame we project every
//  mode-visible label to pixels, sort by importance (selected > star > planet >
//  comet > asteroid > ring, ties broken by nearest-to-camera), then greedily
//  place them: a label whose box hits an already-placed one is hidden.
//
//  We toggle `element.style.visibility` (NOT `.visible`/`display`): CSS2DRenderer
//  owns `display` for its own frustum/mode culling and setLabelsVisible owns
//  `.visible`, so visibility is the one channel we can drive without a fight.
// ---------------------------------------------------------------------------
const _lblPos = new THREE.Vector3();
function declutterLabels() {
  const w = window.innerWidth, h = window.innerHeight;
  const cands = [];
  for (const L of labels) {
    if (!L.obj.visible) continue;            // hidden by the solar/stars mode toggle
    L.obj.getWorldPosition(_lblPos);
    const dist = camera.position.distanceTo(_lblPos);
    _lblPos.project(camera);
    // Behind the camera or well outside the frustum: leave it to CSS2DRenderer
    // (it parks such labels off-screen) and drop it from the overlap contest.
    if (_lblPos.z > 1 || Math.abs(_lblPos.x) > 1.2 || Math.abs(_lblPos.y) > 1.2) {
      L.el.style.visibility = '';
      continue;
    }
    const parent = L.obj.parent;
    const key = parent && parent.userData
      ? (parent.userData.body?.key ?? parent.userData.star?.key)
      : null;
    const priority = key && key === state.selectedKey ? 1000 : L.priority;
    cands.push({
      L,
      sx: (_lblPos.x * 0.5 + 0.5) * w,
      sy: (-_lblPos.y * 0.5 + 0.5) * h,
      dist, priority,
    });
  }
  cands.sort((a, b) => (b.priority - a.priority) || (a.dist - b.dist));

  const placed = [];
  const PAD = 2;
  for (const c of cands) {
    const el = c.L.el;
    const bw = el.offsetWidth || 40, bh = el.offsetHeight || 14;
    const left = c.sx - bw / 2 - PAD, right = c.sx + bw / 2 + PAD;
    const top = c.sy - bh / 2 - PAD, bottom = c.sy + bh / 2 + PAD;
    let overlap = false;
    for (const p of placed) {
      if (left < p.right && right > p.left && top < p.bottom && bottom > p.top) { overlap = true; break; }
    }
    if (overlap) {
      el.style.visibility = 'hidden';
    } else {
      el.style.visibility = '';
      placed.push({ left, right, top, bottom });
    }
  }
}

let lastT = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now(), realDt = (now - lastT) / 1000; lastT = now;

  if (state.mode === 'solar') {
    if (state.playing) {
      const dtDays = realDt * state.daysPerSecond;
      state.simDate = new Date(state.simDate.getTime() + dtDays * 86400000);
      spinBodies(dtDays);
    }
    // Animate the real ↔ compact distance morph (rebuild the static orbit lines
    // each frame while it is in progress; body positions follow automatically)
    if (compress !== compressTarget) {
      const step = realDt / 0.7;   // ~0.7 s transition
      compress = compress < compressTarget
        ? Math.min(compressTarget, compress + step)
        : Math.max(compressTarget, compress - step);
      refreshOrbits();
      rebuildCometOrbits();
    }
    dateLabel.textContent = fmtDate(state.simDate);
    updatePositions();
    updateLivePhysics(julianDate(state.simDate));
  }

  if (tour) updateTour(now);

  if (focusTarget) {
    const target = focusTarget.getWorldPosition(new THREE.Vector3());
    controls.target.lerp(target, 0.08);
    const size = focusTarget.userData.body ? focusTarget.userData.body.displaySize : (focusTarget.userData.star.size || 1);
    const desired = target.clone().add(new THREE.Vector3(0, size * 6 + 6, size * 10 + 16));
    camera.position.lerp(desired, 0.06);
    if (camera.position.distanceTo(desired) < 1) focusTarget = null;
  }

  // Follow-cam: once any one-shot flight (focusTarget) has finished, keep the
  // camera locked onto the moving body. We translate BOTH the orbit target and
  // the camera by the body's per-frame displacement, so the object stays centred
  // while the user keeps their own zoom and rotation angle.
  if (state.follow && followTarget && !focusTarget && state.mode === 'solar'
      && followTarget.userData.body) {
    const p = followTarget.getWorldPosition(_followP);
    _followDelta.subVectors(p, controls.target);
    controls.target.add(_followDelta);
    camera.position.add(_followDelta);
  }

  controls.update();
  declutterLabels();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}
animate();

// Restore a deep link now that every function and binding above (tour, animate,
// route helpers) is initialized — safe to enter a view / select a body / fly the
// intro tour. (Deferred from the hash-router section; see the note there.)
applyRoute(parseHash(location.hash));

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});
