// ============================================================================
//  main.js — Three.js 场景、渲染循环、时间控制、双模式（太阳系 / 邻近恒星）与天象
// ============================================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import { heliocentricPosition, orbitPath, moonOffset, julianDate } from './kepler.js';
import { SUN, PLANETS, MOON } from './bodies.js';
import { STARS, starPositionLy, starVisual } from './stars.js';
import { computeEvents } from './events.js';

const SCALE = 20;        // 太阳系：每 AU 的场景单位（保持真实轨道几何）
const STAR_SCALE = 6;    // 恒星图：每光年的场景单位

function toScene(p)   { return new THREE.Vector3(p.x * SCALE, p.z * SCALE, -p.y * SCALE); }
function toSceneLy(p) { return new THREE.Vector3(p.x * STAR_SCALE, p.z * STAR_SCALE, -p.y * STAR_SCALE); }

// ---------------------------------------------------------------------------
//  渲染器 / 场景 / 相机
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
//  光照
// ---------------------------------------------------------------------------
scene.add(new THREE.AmbientLight(0xffffff, 0.22));
const sunLight = new THREE.PointLight(0xffffff, 3.4, 0, 0.35);
scene.add(sunLight);

// ---------------------------------------------------------------------------
//  银河背景（真实星空贴图，包裹整个场景）
// ---------------------------------------------------------------------------
const milkyway = new THREE.Mesh(
  new THREE.SphereGeometry(18000, 60, 40),
  new THREE.MeshBasicMaterial({ map: loadTex('assets/textures/2k_stars_milky_way.jpg'), side: THREE.BackSide })
);
scene.add(milkyway);

// ===========================================================================
//  A) 太阳系组
// ===========================================================================
const solarGroup = new THREE.Group();
scene.add(solarGroup);

const clickableBodies = [];
const bodyMeshes = {};

function makeLabel(text, className, offsetY) {
  const div = document.createElement('div');
  div.className = 'label ' + className;
  div.textContent = text;
  const obj = new CSS2DObject(div);
  obj.position.set(0, offsetY, 0);
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

// 太阳 + 光晕
const sunMesh = makeBody(SUN, true);
sunMesh.add(new THREE.Mesh(
  new THREE.SphereGeometry(SUN.displaySize * 1.5, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffdd66, transparent: true, opacity: 0.13 })
));

// 行星 + 光环
for (const p of PLANETS) {
  makeBody(p, false);
  if (p.rings) {
    const inner = p.displaySize * 1.4;
    const outer = p.displaySize * (p.key === 'saturn' ? 2.4 : 1.9);
    const ringGeo = new THREE.RingGeometry(inner, outer, 96);
    // 调整 UV，让环形贴图沿半径方向映射
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

// 轨道线
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
    if (orbitLines[p.key]) solarGroup.remove(orbitLines[p.key]);
    orbitLines[p.key] = buildOrbitLine(p.key, jd);
    orbitLines[p.key].visible = state.showOrbits;
    solarGroup.add(orbitLines[p.key]);
  }
}

// ===========================================================================
//  B) 邻近恒星组
// ===========================================================================
const starsGroup = new THREE.Group();
starsGroup.visible = false;
scene.add(starsGroup);

const clickableStars = [];
const starMeshes = {};
const starData = STARS.map(s => ({ ...s, ...starVisual(s) })); // 附上颜色与尺寸

for (const s of starData) {
  const geo = new THREE.SphereGeometry(s.size, 24, 24);
  const mat = new THREE.MeshBasicMaterial({ color: s.color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(toSceneLy(starPositionLy(s)));
  mesh.userData.star = s;
  // 光晕
  mesh.add(new THREE.Mesh(
    new THREE.SphereGeometry(s.size * 2.2, 16, 16),
    new THREE.MeshBasicMaterial({ color: s.color, transparent: true, opacity: 0.18 })
  ));
  mesh.add(makeLabel(s.nameZh, s.key === 'sun' ? 'label-star' : 'label-planet', s.size + 1.5));
  starsGroup.add(mesh);
  starMeshes[s.key] = mesh;
  clickableStars.push(mesh);
}

// 距离参考圈（光年）
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
  ring.add(makeLabel(`${ly} 光年`, 'label-ring', 0));
  ring.children[0].position.set(ly * STAR_SCALE, 0, 0);
  starsGroup.add(ring);
}

// ---------------------------------------------------------------------------
//  状态
// ---------------------------------------------------------------------------
const state = {
  simDate: new Date(),
  daysPerSecond: 5,
  playing: true,
  showOrbits: true,
  mode: 'solar',   // 'solar' | 'stars'
};
refreshOrbits();

// ---------------------------------------------------------------------------
//  位置更新
// ---------------------------------------------------------------------------
function updatePositions() {
  const jd = julianDate(state.simDate);
  for (const p of PLANETS) bodyMeshes[p.key].position.copy(toScene(heliocentricPosition(p.key, jd)));
  const e = heliocentricPosition('earth', jd), off = moonOffset(jd), MV = 60;
  bodyMeshes.moon.position.copy(toScene({ x: e.x + off.x * MV, y: e.y + off.y * MV, z: e.z + off.z * MV }));
}
function spinBodies(dtDays) {
  for (const key in bodyMeshes) {
    const b = bodyMeshes[key].userData.body;
    if (b.spinHours) bodyMeshes[key].rotation.y += (dtDays * 24 / b.spinHours) * 2 * Math.PI;
  }
}

// ---------------------------------------------------------------------------
//  交互
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
//  信息面板（天体与恒星共用）
// ---------------------------------------------------------------------------
const infoEl = document.getElementById('info');
function typeName(obj) {
  if (obj.spectral) return '恒星 · ' + obj.spectral;
  return { star: '恒星', planet: '行星', moon: '卫星' }[obj.type] || obj.type;
}
function selectObject(obj) { showInfo(obj); focusOn(obj.key); }
function showInfo(data) {
  const color = (data.color || 0xffffff).toString(16).padStart(6, '0');
  const facts = Object.entries(data.facts).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
  const highlights = data.highlights.map(h => `<li>${h}</li>`).join('');
  infoEl.innerHTML = `
    <div class="info-head">
      <span class="dot" style="background:#${color}"></span>
      <div><h2>${data.nameZh} <small>${data.nameEn}</small></h2>
      <span class="tag">${typeName(data)}</span></div>
    </div>
    <p class="blurb">${data.blurb}</p>
    <h3>明显特征</h3><ul class="highlights">${highlights}</ul>
    <h3>关键数据</h3><table class="facts">${facts}</table>`;
  infoEl.classList.add('visible');
}

// 镜头对准
let focusTarget = null;
function focusOn(key) {
  const map = state.mode === 'solar' ? bodyMeshes : starMeshes;
  if (map[key]) focusTarget = map[key];
}

// ---------------------------------------------------------------------------
//  UI 绑定
// ---------------------------------------------------------------------------
const dateLabel = document.getElementById('dateLabel');
const speedLabel = document.getElementById('speedLabel');
const speedSlider = document.getElementById('speed');
const playBtn = document.getElementById('playBtn');
const timeControls = document.getElementById('timeControls');
const bodyListEl = document.getElementById('bodyList');

const fmtDate = d => d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
const updateSpeedLabel = () => speedLabel.textContent = `${state.daysPerSecond} 天 / 秒`;

speedSlider.addEventListener('input', () => { state.daysPerSecond = +speedSlider.value; updateSpeedLabel(); });
playBtn.addEventListener('click', () => { state.playing = !state.playing; playBtn.textContent = state.playing ? '⏸ 暂停' : '▶ 播放'; });
document.getElementById('nowBtn').addEventListener('click', () => { state.simDate = new Date(); refreshOrbits(); });
document.getElementById('orbitsToggle').addEventListener('change', e => {
  state.showOrbits = e.target.checked;
  for (const k in orbitLines) orbitLines[k].visible = state.showOrbits;
});

// 天体 / 恒星快捷芯片（随模式重建）
function rebuildChips() {
  bodyListEl.innerHTML = '';
  const list = state.mode === 'solar' ? [SUN, ...PLANETS, MOON] : starData;
  for (const b of list) {
    const color = (b.color || 0xffffff).toString(16).padStart(6, '0');
    const btn = document.createElement('button');
    btn.className = 'body-chip';
    btn.innerHTML = `<span class="dot" style="background:#${color}"></span>${b.nameZh}`;
    btn.onclick = () => selectObject(b);
    bodyListEl.appendChild(btn);
  }
}

// 模式切换
const tabSolar = document.getElementById('tabSolar');
const tabStars = document.getElementById('tabStars');
function setMode(m) {
  state.mode = m;
  solarGroup.visible = (m === 'solar');
  starsGroup.visible = (m === 'stars');
  timeControls.style.display = (m === 'solar') ? '' : 'none';
  tabSolar.classList.toggle('active', m === 'solar');
  tabStars.classList.toggle('active', m === 'stars');
  focusTarget = null;
  controls.target.set(0, 0, 0);
  camera.position.set(0, m === 'solar' ? 120 : 260, m === 'solar' ? 260 : 620);
  rebuildChips();
  infoEl.classList.remove('visible');
}
tabSolar.onclick = () => setMode('solar');
tabStars.onclick = () => setMode('stars');

// ---------------------------------------------------------------------------
//  天象面板（延迟计算）
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
      state.playing = false; playBtn.textContent = '▶ 播放';
      refreshOrbits();
    };
  });
  eventsBuilt = true;
}
eventsBtn.onclick = () => {
  if (!eventsBuilt) buildEvents();
  eventsPanel.classList.toggle('visible');
};
document.getElementById('eventsClose').onclick = () => eventsPanel.classList.remove('visible');

updateSpeedLabel();
rebuildChips();
showInfo(SUN);

// ---------------------------------------------------------------------------
//  渲染循环
// ---------------------------------------------------------------------------
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
    dateLabel.textContent = fmtDate(state.simDate);
    updatePositions();
  }

  if (focusTarget) {
    const target = focusTarget.getWorldPosition(new THREE.Vector3());
    controls.target.lerp(target, 0.08);
    const size = focusTarget.userData.body ? focusTarget.userData.body.displaySize : (focusTarget.userData.star.size || 1);
    const desired = target.clone().add(new THREE.Vector3(0, size * 6 + 6, size * 10 + 16));
    camera.position.lerp(desired, 0.06);
    if (camera.position.distanceTo(desired) < 1) focusTarget = null;
  }

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});
