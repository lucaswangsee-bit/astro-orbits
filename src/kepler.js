// ============================================================================
//  kepler.js — Keplerian orbital elements and position solver (real astronomy engine)
// ----------------------------------------------------------------------------
//  Source : NASA JPL — "Keplerian Elements for Approximate Positions of the
//           Major Planets" (E. M. Standish, Solar System Dynamics Group)
//           https://ssd.jpl.nasa.gov/planets/approx_pos.html
//  Valid range: 1800 AD – 2050 AD (higher accuracy within this window)
//  Reference frame: J2000 ecliptic, heliocentric
// ============================================================================

const DEG = Math.PI / 180;

// Physical constants for the dynamics layer (velocities, vis-viva, energy)
//   GM_SUN : heliocentric gravitational parameter, in AU³ / day²
//            = k² where k = 0.01720209895 is the Gaussian gravitational constant
//   AU_DAY_TO_KM_S : convert a speed in AU/day to km/s
export const GM_SUN = 2.959122082855911e-4;   // AU³ / day²
export const AU_DAY_TO_KM_S = 1731.456837;    // 1 AU/day = 149597870.7 km / 86400 s

// The 6 orbital elements per planet and their linear rate of change "per Julian century":
//   a    semi-major axis          (AU)
//   e    eccentricity             (dimensionless)
//   I    inclination              (°)
//   L    mean longitude           (°)
//   peri longitude of perihelion ϖ (°)
//   node longitude of ascending node Ω (°)
// Format: [initial value (J2000), rate of change per century]
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
//  JS Date → Julian Date
//  Unix ms-timestamp epoch 1970-01-01 = JD 2440587.5
// ---------------------------------------------------------------------------
export function julianDate(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

// Normalize an angle to [-π, π]
function normalize(angle) {
  return ((angle + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
}

// ---------------------------------------------------------------------------
//  Solve Kepler's equation by Newton iteration: M = E - e·sin(E), for eccentric anomaly E
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

// Solve the instantaneous orbital elements at time T (Julian centuries)
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

// Rotate in-orbit-plane coordinates (xp, yp) to J2000 ecliptic coordinates (x, y, z)
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
//  Heliocentric ecliptic coordinates of a planet at a given time (units: AU)
// ---------------------------------------------------------------------------
export function heliocentricPosition(key, jd) {
  const T = (jd - 2451545.0) / 36525;          // Julian centuries since J2000
  const { a, e, I, L, peri, node } = elementsAt(key, T);
  const omega = peri - node;                   // argument of perihelion ω
  const M = normalize(L - peri);               // mean anomaly
  const E = solveKepler(M, e);                 // eccentric anomaly
  // In-orbit-plane coordinates
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  return orbitalToEcliptic(xp, yp, node, omega, I);
}

// ---------------------------------------------------------------------------
//  Sample the full orbit (to draw the elliptical orbit line), units: AU
//  Uses the instantaneous elements at the current jd, sampling one full loop
//  uniformly in eccentric anomaly E
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
//  Vis-viva: instantaneous, perihelion and aphelion speeds of a planet.
//    v      = √( GM · (2/r − 1/a) )         (current orbital speed)
//    v_peri = √( GM/a · (1+e)/(1−e) )       (fastest, at perihelion)
//    v_aph  = √( GM/a · (1−e)/(1+e) )       (slowest, at aphelion)
//  All returned in AU/day; multiply by AU_DAY_TO_KM_S for km/s.
//  Also returns r (current Sun distance), and rPeri/rAph = a(1∓e).
// ---------------------------------------------------------------------------
export function orbitalSpeeds(key, jd) {
  const T = (jd - 2451545.0) / 36525;
  const { a, e } = elementsAt(key, T);
  const p = heliocentricPosition(key, jd);
  const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
  return {
    a, e, r,
    rPeri: a * (1 - e),
    rAph:  a * (1 + e),
    v:     Math.sqrt(GM_SUN * (2 / r - 1 / a)),
    vPeri: Math.sqrt(GM_SUN / a * (1 + e) / (1 - e)),
    vAph:  Math.sqrt(GM_SUN / a * (1 - e) / (1 + e))
  };
}

// ---------------------------------------------------------------------------
//  Comets: solved from a fixed set of orbital elements (no per-century rates).
//  Element convention here is the one used in comet catalogs:
//    a     semi-major axis (AU)      e   eccentricity
//    I     inclination (°)           argp argument of perihelion ω (°)
//    node  longitude of ascending node Ω (°)
//    tperi Julian Date of perihelion passage
//    period orbital period (days)
// ---------------------------------------------------------------------------
export function cometPosition(c, jd) {
  const M = normalize(2 * Math.PI * (jd - c.tperi) / c.period);
  const E = solveKepler(M, c.e);
  const xp = c.a * (Math.cos(E) - c.e);
  const yp = c.a * Math.sqrt(1 - c.e * c.e) * Math.sin(E);
  return orbitalToEcliptic(xp, yp, c.node * DEG, c.argp * DEG, c.I * DEG);
}

export function cometOrbitPath(c, segments = 720) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const E = (i / segments) * 2 * Math.PI;
    const xp = c.a * (Math.cos(E) - c.e);
    const yp = c.a * Math.sqrt(1 - c.e * c.e) * Math.sin(E);
    pts.push(orbitalToEcliptic(xp, yp, c.node * DEG, c.argp * DEG, c.I * DEG));
  }
  return pts;
}

// ---------------------------------------------------------------------------
//  Moon: geocentric approximate orbit (simplified model, for visualization only,
//  not a high-precision ephemeris)
//  Returns the ecliptic offset relative to Earth (AU)
//  Averages: orbital radius 0.00257 AU, sidereal month 27.321661 days, inclination ~5.14°
// ---------------------------------------------------------------------------
export function moonOffset(jd) {
  const period = 27.321661;
  const meanRadius = 0.00257;
  const inc = 5.145 * DEG;
  // Mean angle with J2000 as the phase origin
  const phase = ((jd - 2451545.0) / period) * 2 * Math.PI;
  const x = meanRadius * Math.cos(phase);
  const y = meanRadius * Math.sin(phase) * Math.cos(inc);
  const z = meanRadius * Math.sin(phase) * Math.sin(inc);
  return { x, y, z };
}
