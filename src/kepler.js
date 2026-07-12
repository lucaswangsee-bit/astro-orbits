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

// Unit conversions for SI-valued derived quantities (energy, angular momentum)
const AU_M = 1.495978707e11;             // 1 AU in metres
const DAY_S = 86400;                      // 1 day in seconds
const VEL2_MS = (AU_M / DAY_S) ** 2;     // (m/s)² per (AU/day)²  — specific orbital energy
const AREA_MS = (AU_M * AU_M) / DAY_S;   // (m²/s) per (AU²/day)  — angular momentum / areal velocity

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
//  Ephemeris — apparent geocentric equatorial position (RA / Dec) of a body,
//  as it would appear in Earth's sky on a given date. This is the "forward"
//  companion to orbit determination: given the orbital elements, predict where
//  the object shows up on the sky. (RA in hours, Dec in degrees.)
//    target_geo = r_helio(target) - r_helio(Earth)      [ecliptic]
//    then rotate ecliptic -> equatorial by the obliquity ε, and read off
//    RA = atan2(y, x),  Dec = asin(z / |r|).
//  Pass key 'sun' for the Sun (its geocentric vector is simply -Earth).
// ---------------------------------------------------------------------------
const OBLIQUITY = 23.43929 * DEG;   // mean obliquity of the ecliptic (J2000)

function formatRA(hours) {
  const total = Math.round((((hours % 24) + 24) % 24) * 3600); // seconds of RA
  const h = Math.floor(total / 3600) % 24;
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

function formatDec(deg) {
  const sign = deg < 0 ? '−' : '+';
  const total = Math.round(Math.abs(deg) * 3600);             // arcseconds
  const d = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${sign}${d}° ${String(m).padStart(2, '0')}′ ${String(s).padStart(2, '0')}″`;
}

export function ephemeris(key, date) {
  const jd = julianDate(date);
  const target = key === 'sun' ? { x: 0, y: 0, z: 0 } : heliocentricPosition(key, jd);
  const earth  = heliocentricPosition('earth', jd);
  // Geocentric ecliptic vector (Earth → target), in AU
  const xe = target.x - earth.x;
  const ye = target.y - earth.y;
  const ze = target.z - earth.z;
  // Rotate ecliptic → equatorial about the x-axis by the obliquity ε
  const c = Math.cos(OBLIQUITY), s = Math.sin(OBLIQUITY);
  const xq = xe;
  const yq = ye * c - ze * s;
  const zq = ye * s + ze * c;
  const dist = Math.sqrt(xq * xq + yq * yq + zq * zq);
  let raHours = Math.atan2(yq, xq) / DEG / 15;   // radians → degrees → hours
  raHours = ((raHours % 24) + 24) % 24;
  const decDeg = Math.asin(zq / dist) / DEG;
  return { raHours, decDeg, distAU: dist, raStr: formatRA(raHours), decStr: formatDec(decDeg) };
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
//  Orbital dynamics: conserved quantities and derived laws for a planet.
//    T   = 2π√(a³/GM)              Kepler's third law (period)
//    ε   = −GM/2a                  specific orbital energy (constant along the orbit)
//    h   = √(GM·a(1−e²))           specific angular momentum (constant)
//    dA/dt = h/2                   Kepler's second law (areal velocity, constant)
//    v_esc = √(2GM/r)              local escape speed from the Sun at distance r
//    ν                             true anomaly (angle from perihelion)
//    T_syn                         synodic period relative to Earth
//  Energy/momentum are returned in SI (J/kg, m²/s); speeds via AU_DAY_TO_KM_S.
// ---------------------------------------------------------------------------
export function orbitalDynamics(key, jd) {
  const T = (jd - 2451545.0) / 36525;
  const { a, e, L, peri } = elementsAt(key, T);
  const M = normalize(L - peri);
  const E = solveKepler(M, e);
  const nu = normalize(2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2),
                                      Math.sqrt(1 - e) * Math.cos(E / 2)));
  const p = heliocentricPosition(key, jd);
  const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);

  const periodDays = 2 * Math.PI * Math.sqrt(a * a * a / GM_SUN);
  const ea = elementsAt('earth', T).a;
  const earthPeriodDays = 2 * Math.PI * Math.sqrt(ea * ea * ea / GM_SUN);
  const invSyn = Math.abs(1 / periodDays - 1 / earthPeriodDays);
  const synodicDays = invSyn > 1e-9 ? 1 / invSyn : Infinity;

  const eps = -GM_SUN / (2 * a);            // AU²/day²  (specific energy)
  const h = Math.sqrt(GM_SUN * a * (1 - e * e)); // AU²/day (specific angular momentum)
  const vEsc = Math.sqrt(2 * GM_SUN / r);   // AU/day

  return {
    a, e, r,
    Mdeg: M / DEG, Edeg: E / DEG, nuDeg: nu / DEG,
    periodDays, periodYears: periodDays / 365.25,
    synodicDays, synodicYears: synodicDays / 365.25,
    epsSI: eps * VEL2_MS,                    // J/kg
    hSI: h * AREA_MS,                        // m²/s
    dAdtSI: (h / 2) * AREA_MS,               // m²/s
    vEscKmS: vEsc * AU_DAY_TO_KM_S           // km/s
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
