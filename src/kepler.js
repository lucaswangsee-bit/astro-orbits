// ============================================================================
//  kepler.js — 开普勒轨道根数与位置解算（真实天文数据引擎）
// ----------------------------------------------------------------------------
//  数据来源：NASA JPL — "Keplerian Elements for Approximate Positions of the
//            Major Planets"（E. M. Standish, Solar System Dynamics Group）
//            https://ssd.jpl.nasa.gov/planets/approx_pos.html
//  适用区间：1800 AD – 2050 AD（此区间内精度较高）
//  参考系  ：J2000 黄道坐标系，日心
// ============================================================================

const DEG = Math.PI / 180;

// 每颗行星的 6 个轨道根数及其"每儒略世纪"的线性变化率：
//   a    半长轴        (AU)
//   e    离心率        (无量纲)
//   I    轨道倾角      (°)
//   L    平黄经        (°)
//   peri 近日点黄经 ϖ  (°)
//   node 升交点黄经 Ω  (°)
// 格式：[初始值(J2000), 每世纪变化率]
export const ELEMENTS = {
  mercury: {
    a:[0.38709927,  0.00000037], e:[0.20563593,  0.00001906], I:[7.00497902, -0.00594749],
    L:[252.25032350, 149472.67411175], peri:[77.45779628, 0.16047689], node:[48.33076593, -0.12534081]
  },
  venus: {
    a:[0.72333566,  0.00000390], e:[0.00677672, -0.00004107], I:[3.39467605, -0.00078890],
    L:[181.97909950, 58517.81538729], peri:[131.60246718, 0.00268329], node:[76.67984255, -0.27769418]
  },
  earth: {
    a:[1.00000261,  0.00000562], e:[0.01671123, -0.00004392], I:[-0.00001531, -0.01294668],
    L:[100.46457166, 35999.37244981], peri:[102.93768193, 0.32327364], node:[0.0, 0.0]
  },
  mars: {
    a:[1.52371034,  0.00001847], e:[0.09339410,  0.00007882], I:[1.84969142, -0.00813131],
    L:[-4.55343205, 19140.30268499], peri:[-23.94362959, 0.44441088], node:[49.55953891, -0.29257343]
  },
  jupiter: {
    a:[5.20288700, -0.00011607], e:[0.04838624, -0.00013253], I:[1.30439695, -0.00183714],
    L:[34.39644051, 3034.74612775], peri:[14.72847983, 0.21252668], node:[100.47390909, 0.20469106]
  },
  saturn: {
    a:[9.53667594, -0.00125060], e:[0.05386179, -0.00050991], I:[2.48599187,  0.00193609],
    L:[49.95424423, 1222.49362201], peri:[92.59887831, -0.41897216], node:[113.66242448, -0.28867794]
  },
  uranus: {
    a:[19.18916464, -0.00196176], e:[0.04725744, -0.00004397], I:[0.77263783, -0.00242939],
    L:[313.23810451, 428.48202785], peri:[170.95427630, 0.40805281], node:[74.01692503, 0.04240589]
  },
  neptune: {
    a:[30.06992276,  0.00026291], e:[0.00859048,  0.00005105], I:[1.77004347,  0.00035372],
    L:[-55.12002969, 218.45945325], peri:[44.96476227, -0.32241464], node:[131.78422574, -0.00508664]
  }
};

// ---------------------------------------------------------------------------
//  JS Date → 儒略日 (Julian Date)
//  Unix 毫秒时间戳基准 1970-01-01 = JD 2440587.5
// ---------------------------------------------------------------------------
export function julianDate(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

// 归一化角度到 [-π, π]
function normalize(angle) {
  return ((angle + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
}

// ---------------------------------------------------------------------------
//  牛顿迭代解开普勒方程：M = E - e·sin(E)，求偏近点角 E
// ---------------------------------------------------------------------------
function solveKepler(M, e) {
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 12; i++) {
    const dE = (M - (E - e * Math.sin(E))) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-8) break;
  }
  return E;
}

// 由某时刻 T（儒略世纪）解出瞬时轨道根数
function elementsAt(key, T) {
  const el = ELEMENTS[key];
  return {
    a:    el.a[0]    + el.a[1]    * T,
    e:    el.e[0]    + el.e[1]    * T,
    I:   (el.I[0]    + el.I[1]    * T) * DEG,
    L:   (el.L[0]    + el.L[1]    * T) * DEG,
    peri:(el.peri[0] + el.peri[1] * T) * DEG,
    node:(el.node[0] + el.node[1] * T) * DEG
  };
}

// 把轨道平面内坐标 (xp, yp) 旋转到 J2000 黄道坐标 (x, y, z)
function orbitalToEcliptic(xp, yp, node, omega, I) {
  const cosO = Math.cos(node), sinO = Math.sin(node);
  const cosw = Math.cos(omega), sinw = Math.sin(omega);
  const cosI = Math.cos(I),    sinI = Math.sin(I);
  return {
    x: (cosO * cosw - sinO * sinw * cosI) * xp + (-cosO * sinw - sinO * cosw * cosI) * yp,
    y: (sinO * cosw + cosO * sinw * cosI) * xp + (-sinO * sinw + cosO * cosw * cosI) * yp,
    z: (sinw * sinI) * xp + (cosw * sinI) * yp
  };
}

// ---------------------------------------------------------------------------
//  某时刻某行星的日心黄道坐标（单位：AU）
// ---------------------------------------------------------------------------
export function heliocentricPosition(key, jd) {
  const T = (jd - 2451545.0) / 36525;          // J2000 起算的儒略世纪
  const { a, e, I, L, peri, node } = elementsAt(key, T);
  const omega = peri - node;                   // 近日点角距 ω
  const M = normalize(L - peri);               // 平近点角
  const E = solveKepler(M, e);                 // 偏近点角
  // 轨道平面内坐标
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  return orbitalToEcliptic(xp, yp, node, omega, I);
}

// ---------------------------------------------------------------------------
//  生成整条轨道的采样点（用于画出椭圆轨道线），单位 AU
//  用当前时刻 jd 的瞬时根数，沿偏近点角 E 均匀采样一圈
// ---------------------------------------------------------------------------
export function orbitPath(key, jd, segments = 360) {
  const T = (jd - 2451545.0) / 36525;
  const { a, e, I, peri, node } = elementsAt(key, T);
  const omega = peri - node;
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const E = (i / segments) * 2 * Math.PI;
    const xp = a * (Math.cos(E) - e);
    const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const p = orbitalToEcliptic(xp, yp, node, omega, I);
    pts.push(p);
  }
  return pts;
}

// ---------------------------------------------------------------------------
//  月球：地心近似轨道（简化模型，仅用于可视化，不追求高精度星历）
//  返回相对地球的黄道偏移量（AU）
//  平均：轨道半径 0.00257 AU，恒星月 27.321661 天，倾角约 5.14°
// ---------------------------------------------------------------------------
export function moonOffset(jd) {
  const period = 27.321661;
  const meanRadius = 0.00257;
  const inc = 5.145 * DEG;
  // 以 J2000 为相位起点的平均角度
  const phase = ((jd - 2451545.0) / period) * 2 * Math.PI;
  const x = meanRadius * Math.cos(phase);
  const y = meanRadius * Math.sin(phase) * Math.cos(inc);
  const z = meanRadius * Math.sin(phase) * Math.sin(inc);
  return { x, y, z };
}
