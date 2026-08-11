// ============================================================================
//  gauss.js — Classical Gauss orbit determination from three sky observations
// ----------------------------------------------------------------------------
//  This is the "inverse" of kepler.js: kepler.js takes orbital elements and
//  predicts where a body appears on the sky; this module takes three sky
//  positions (RA/Dec at three times) and recovers the six orbital elements.
//
//  Reference: Gauss, "Theoria Motus" (1809); modern treatment in
//  Curtis, "Orbital Mechanics for Engineering Students", ch. 5.10;
//  Boulet, "Methods of Orbit Determination for the Micro Computer".
//
//  Units    : AU, days.  Gravitational parameter μ = GM_SUN (AU³/day²).
//  Frame    : J2000 ecliptic, heliocentric — the same frame kepler.js uses.
//  Angles   : returned in DEGREES.
//
//  No external libraries, no DOM, no network. Pure computation.
// ============================================================================

import { GM_SUN, heliocentricPosition, cometPosition } from './kepler.js';

const DEG = Math.PI / 180;
const TWO_PI = 2 * Math.PI;
const MU = GM_SUN;

// Mean obliquity of the ecliptic at J2000 — identical to the value kepler.js
// uses in ephemeris(), so the two modules agree to the last digit.
const OBLIQUITY = 23.43929 * DEG;
const COS_EPS = Math.cos(OBLIQUITY);
const SIN_EPS = Math.sin(OBLIQUITY);

// Light-time: days required for light to cross 1 AU (= 1 / c in AU/day).
const LIGHT_TIME_PER_AU = 0.0057755183;

// ---------------------------------------------------------------------------
//  Minimal 3-vector helpers (plain {x,y,z} objects, matching kepler.js)
// ---------------------------------------------------------------------------
const vec  = (x, y, z) => ({ x, y, z });
const add  = (a, b) => vec(a.x + b.x, a.y + b.y, a.z + b.z);
const sub  = (a, b) => vec(a.x - b.x, a.y - b.y, a.z - b.z);
const scale = (a, s) => vec(a.x * s, a.y * s, a.z * s);
const dot  = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a, b) => vec(
  a.y * b.z - a.z * b.y,
  a.z * b.x - a.x * b.z,
  a.x * b.y - a.y * b.x
);
const norm = a => Math.sqrt(dot(a, a));

// Normalize an angle in radians to [0, 2π)
const wrap2pi = r => ((r % TWO_PI) + TWO_PI) % TWO_PI;
// Normalize an angle in radians to [-π, π]
const wrapPi  = r => wrap2pi(r + Math.PI) - Math.PI;
// Radians → degrees in [0, 360)
const deg360  = r => wrap2pi(r) / DEG;

// ---------------------------------------------------------------------------
//  Frame rotations about the x-axis by the obliquity ε.
//  ecliptic → equatorial :  y' =  y·cosε − z·sinε ,  z' =  y·sinε + z·cosε
//  equatorial → ecliptic :  y' =  y·cosε + z·sinε ,  z' = −y·sinε + z·cosε
// ---------------------------------------------------------------------------
function eclipticToEquatorial(v) {
  return vec(v.x, v.y * COS_EPS - v.z * SIN_EPS, v.y * SIN_EPS + v.z * COS_EPS);
}
function equatorialToEcliptic(v) {
  return vec(v.x, v.y * COS_EPS + v.z * SIN_EPS, -v.y * SIN_EPS + v.z * COS_EPS);
}

// ---------------------------------------------------------------------------
//  3×3 matrix inverse via cofactors / determinant (no external libraries).
//  m is given as an array of ROWS: [[a,b,c],[d,e,f],[g,h,i]].
//  Returns null when the matrix is singular (observations coplanar with the
//  Earth-Sun geometry, or three identical directions).
// ---------------------------------------------------------------------------
function invert3(m) {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  // Cofactor matrix entries (these are the *transposed* cofactors, i.e. the
  // adjugate, so adj/det is directly the inverse).
  const A =  (e * i - f * h);
  const B = -(b * i - c * h);
  const C =  (b * f - c * e);
  const D = -(d * i - f * g);
  const E =  (a * i - c * g);
  const F = -(a * f - c * d);
  const G =  (d * h - e * g);
  const H = -(a * h - b * g);
  const I =  (a * e - b * d);
  const det = a * A + b * D + c * G;
  // Scale-aware singularity test: compare |det| against the product of the
  // row magnitudes (a determinant of order 1 is expected for unit columns).
  const rowScale = m.reduce((p, r) => p * Math.hypot(r[0], r[1], r[2]), 1) || 1;
  if (!isFinite(det) || Math.abs(det) < 1e-12 * Math.abs(rowScale)) return null;
  return [
    [A / det, B / det, C / det],
    [D / det, E / det, F / det],
    [G / det, H / det, I / det]
  ];
}

// Apply a 3×3 matrix (array of rows) to a {x,y,z} vector.
function apply3(m, v) {
  return vec(
    m[0][0] * v.x + m[0][1] * v.y + m[0][2] * v.z,
    m[1][0] * v.x + m[1][1] * v.y + m[1][2] * v.z,
    m[2][0] * v.x + m[2][1] * v.y + m[2][2] * v.z
  );
}

// ============================================================================
//  EXPORT 1 — observeBody: the forward model (elements → sky position)
// ============================================================================
//  Returns the apparent geocentric EQUATORIAL (J2000) direction of a small
//  body as seen from Earth's centre:
//      geocentric ecliptic vector  ρ⃗ = r⃗_target − R⃗_earth
//      rotate ecliptic → equatorial about x by ε
//      RA  = atan2(y_eq, x_eq),  normalized to [0, 24) hours
//      Dec = asin(z_eq / |ρ⃗|)
//
//  Light-time correction: what we see now left the body Δt = ρ/c days ago, so
//  the direction must be evaluated with the TARGET retarded by Δt while the
//  observer (Earth) stays at the observation epoch. Iterated to convergence
//  (3–4 passes is far more than enough — it converges geometrically with a
//  ratio of order 0.006 · dρ/dt).
// ---------------------------------------------------------------------------
export function observeBody(body, jd) {
  const earth = heliocentricPosition('earth', jd);
  let lightTime = 0;
  let geoEcl = vec(0, 0, 0);
  let dist = 0;
  for (let k = 0; k < 4; k++) {
    const target = cometPosition(body, jd - lightTime);
    geoEcl = sub(target, earth);
    dist = norm(geoEcl);
    lightTime = dist * LIGHT_TIME_PER_AU;
  }
  const geoEq = eclipticToEquatorial(geoEcl);
  let raHours = Math.atan2(geoEq.y, geoEq.x) / DEG / 15;
  raHours = ((raHours % 24) + 24) % 24;
  const decDeg = Math.asin(geoEq.z / dist) / DEG;
  return { raHours, decDeg, distAU: dist };
}

// ---------------------------------------------------------------------------
//  (RA, Dec) → unit direction vector, expressed in the ECLIPTIC frame.
//      equatorial:  ρ̂ = (cosδ·cosα, cosδ·sinα, sinδ),  α = RA·15°
//      then rotate equatorial → ecliptic (about x by −ε)
// ---------------------------------------------------------------------------
function directionVector(raHours, decDeg) {
  const alpha = raHours * 15 * DEG;
  const delta = decDeg * DEG;
  const cd = Math.cos(delta);
  const eq = vec(cd * Math.cos(alpha), cd * Math.sin(alpha), Math.sin(delta));
  return equatorialToEcliptic(eq);
}

// ---------------------------------------------------------------------------
//  Stumpff functions C(z) and S(z) — used by the universal-variable Kepler
//  propagator that supplies EXACT Lagrange f and g coefficients during the
//  refinement loop (the truncated series is only used for the first guess).
// ---------------------------------------------------------------------------
function stumpffC(z) {
  if (z > 1e-8) { const s = Math.sqrt(z); return (1 - Math.cos(s)) / z; }
  if (z < -1e-8) { const s = Math.sqrt(-z); return (Math.cosh(s) - 1) / (-z); }
  return 0.5 - z / 24 + z * z / 720;            // series about z = 0
}
function stumpffS(z) {
  if (z > 1e-8) { const s = Math.sqrt(z); return (s - Math.sin(s)) / (s * s * s); }
  if (z < -1e-8) { const s = Math.sqrt(-z); return (Math.sinh(s) - s) / (s * s * s); }
  return 1 / 6 - z / 120 + z * z / 5040;        // series about z = 0
}

// ---------------------------------------------------------------------------
//  Exact Lagrange coefficients f, g for propagating a state (r⃗₀, v⃗₀) by dt,
//  solved with the universal anomaly χ (valid for elliptic, parabolic and
//  hyperbolic orbits, and for dt of either sign).
//      √μ·dt = (r₀·vr₀/√μ)·χ²C(z) + (1 − α r₀)·χ³S(z) + r₀·χ ,  z = α χ²
//      f = 1 − (χ²/r₀)·C(z) ,   g = dt − (χ³/√μ)·S(z)
//  and, for a full state propagation, with r = |f·r⃗₀ + g·v⃗₀|
//      ḟ = (√μ/(r·r₀))·(α·χ³·S(z) − χ) ,   ġ = 1 − (χ²/r)·C(z)
//  Returns null if the Newton iteration fails to converge.
// ---------------------------------------------------------------------------
function lagrangeFG(r0v, v0v, dt) {
  const sqrtMu = Math.sqrt(MU);
  const r0 = norm(r0v);
  if (!(r0 > 0)) return null;
  const vr0 = dot(r0v, v0v) / r0;                 // radial speed
  const alpha = 2 / r0 - dot(v0v, v0v) / MU;      // = 1/a
  // Initial guess (Curtis): χ ≈ √μ |α| dt for bound orbits.
  let chi = sqrtMu * Math.abs(alpha) * dt;
  if (!isFinite(chi) || chi === 0) chi = sqrtMu * dt / r0;
  for (let n = 0; n < 80; n++) {
    const z = alpha * chi * chi;
    const C = stumpffC(z), S = stumpffS(z);
    const F = (r0 * vr0 / sqrtMu) * chi * chi * C
            + (1 - alpha * r0) * chi * chi * chi * S
            + r0 * chi - sqrtMu * dt;
    const dF = (r0 * vr0 / sqrtMu) * chi * (1 - alpha * chi * chi * S)
             + (1 - alpha * r0) * chi * chi * C + r0;
    if (!isFinite(F) || !isFinite(dF) || dF === 0) return null;
    const ratio = F / dF;
    chi -= ratio;
    if (Math.abs(ratio) < 1e-12) break;
    if (n === 79) return null;
  }
  const z = alpha * chi * chi;
  const C = stumpffC(z), S = stumpffS(z);
  const f = 1 - (chi * chi / r0) * C;
  const g = dt - (chi * chi * chi / sqrtMu) * S;
  if (!isFinite(f) || !isFinite(g)) return null;
  // Derivatives (needed only when a full state propagation is requested).
  const rv = add(scale(r0v, f), scale(v0v, g));
  const r = norm(rv);
  const fdot = (sqrtMu / (r * r0)) * (alpha * chi * chi * chi * S - chi);
  const gdot = 1 - (chi * chi / r) * C;
  return { f, g, fdot, gdot, rVec: rv, vVec: add(scale(r0v, fdot), scale(v0v, gdot)) };
}

// Propagate a state vector (r⃗₀, v⃗₀) by dt days along its Kepler orbit.
function propagateState(r0v, v0v, dt) {
  if (dt === 0) return { rVec: r0v, vVec: v0v };
  const fg = lagrangeFG(r0v, v0v, dt);
  if (!fg || !isFinite(norm(fg.rVec)) || !isFinite(norm(fg.vVec))) return null;
  return { rVec: fg.rVec, vVec: fg.vVec };
}

// ---------------------------------------------------------------------------
//  Positive real roots of  r⁸ + a·r⁶ + b·r³ + c = 0.
//  Strategy (no external libraries): scan a logarithmically spaced grid over a
//  generous heliocentric-distance range, bracket every sign change, then
//  refine each bracket with bisection guarded Newton to machine precision.
// ---------------------------------------------------------------------------
function octicRoots(a, b, c, rMin = 0.02, rMax = 120, samples = 8000) {
  const P  = r => { const r3 = r * r * r; return r3 * r3 * r * r + a * r3 * r3 + b * r3 + c; };
  const dP = r => { const r2 = r * r, r3 = r2 * r; return 8 * r3 * r3 * r + 6 * a * r3 * r2 + 3 * b * r2; };

  const roots = [];
  const logMin = Math.log(rMin), logMax = Math.log(rMax);
  let rPrev = rMin, pPrev = P(rMin);
  if (Math.abs(pPrev) < 1e-14) roots.push(rMin);

  for (let i = 1; i <= samples; i++) {
    const r = Math.exp(logMin + (logMax - logMin) * i / samples);
    const p = P(r);
    if (isFinite(p) && isFinite(pPrev) && ((p < 0 && pPrev > 0) || (p > 0 && pPrev < 0))) {
      // Bracket [rPrev, r] contains a root — bisection with Newton acceleration.
      let lo = rPrev, hi = r, flo = pPrev;
      let x = 0.5 * (lo + hi);
      for (let k = 0; k < 200; k++) {
        const fx = P(x);
        if (fx === 0) break;
        if ((fx < 0) === (flo < 0)) { lo = x; flo = fx; } else { hi = x; }
        // Newton step, accepted only if it stays inside the bracket.
        const d = dP(x);
        let xn = d !== 0 ? x - fx / d : NaN;
        if (!(isFinite(xn) && xn > lo && xn < hi)) xn = 0.5 * (lo + hi);
        if (Math.abs(xn - x) < 1e-14 * Math.max(1, Math.abs(x))) { x = xn; break; }
        x = xn;
      }
      if (x > 0 && isFinite(x)) roots.push(x);
    }
    rPrev = r; pPrev = p;
  }
  // De-duplicate roots that the scan may have found twice.
  roots.sort((p, q) => p - q);
  const out = [];
  for (const r of roots) {
    if (!out.length || Math.abs(r - out[out.length - 1]) > 1e-8 * Math.max(1, r)) out.push(r);
  }
  return out;
}

// ---------------------------------------------------------------------------
//  State vector (r⃗, v⃗) at epoch → the six classical elements.
//      h⃗ = r⃗ × v⃗                       specific angular momentum
//      ε = v²/2 − μ/r                   specific energy      →  a = −μ/(2ε)
//      e⃗ = (v⃗ × h⃗)/μ − r⃗/r             eccentricity vector  →  e = |e⃗|
//      i = acos(h_z/h) ; n⃗ = ẑ × h⃗ ; Ω = atan2(n_y, n_x)
//      ω = ∠(n⃗, e⃗)  (2π − ω if e_z < 0)
//      ν = ∠(e⃗, r⃗)  (2π − ν if r⃗·v⃗ < 0)
//      tan(E/2) = √((1−e)/(1+e))·tan(ν/2) ;  M = E − e·sinE
// ---------------------------------------------------------------------------
function stateToElements(rv, vv) {
  const r = norm(rv), v = norm(vv);
  if (!(r > 0) || !isFinite(v)) return null;
  const h = cross(rv, vv);
  const hMag = norm(h);
  const energy = v * v / 2 - MU / r;
  const a = -MU / (2 * energy);
  const eVec = sub(scale(cross(vv, h), 1 / MU), scale(rv, 1 / r));
  const e = norm(eVec);
  const inc = Math.acos(Math.max(-1, Math.min(1, h.z / hMag)));
  const n = vec(-h.y, h.x, 0);                     // n⃗ = ẑ × h⃗
  const nMag = norm(n);

  let node = 0, omega = 0;
  if (nMag > 1e-12) {
    node = Math.atan2(n.y, n.x);
    if (e > 1e-12) {
      omega = Math.acos(Math.max(-1, Math.min(1, dot(n, eVec) / (nMag * e))));
      if (eVec.z < 0) omega = TWO_PI - omega;
    }
  } else {
    // Equatorial (here: zero-inclination) orbit — Ω is undefined; use Ω = 0 and
    // measure ω from the reference x-axis instead.
    node = 0;
    if (e > 1e-12) {
      omega = Math.atan2(eVec.y, eVec.x);
      if (h.z < 0) omega = TWO_PI - omega;
    }
  }

  let nu = 0;
  if (e > 1e-12) {
    nu = Math.acos(Math.max(-1, Math.min(1, dot(eVec, rv) / (e * r))));
    if (dot(rv, vv) < 0) nu = TWO_PI - nu;
  } else {
    // Circular orbit — measure the argument of latitude from n⃗ (or x̂).
    const ref = nMag > 1e-12 ? n : vec(1, 0, 0);
    const refMag = nMag > 1e-12 ? nMag : 1;
    nu = Math.acos(Math.max(-1, Math.min(1, dot(ref, rv) / (refMag * r))));
    if (rv.z < 0) nu = TWO_PI - nu;
  }

  // Mean anomaly (elliptic case only; for e ≥ 1 the elliptic M is meaningless)
  let M = 0;
  if (e < 1) {
    const E = 2 * Math.atan2(Math.sqrt(1 - e) * Math.sin(nu / 2),
                             Math.sqrt(1 + e) * Math.cos(nu / 2));
    M = wrap2pi(E - e * Math.sin(E));
  }

  const periodDays = a > 0 ? TWO_PI * Math.sqrt(a * a * a / MU) : Infinity;
  return {
    a, e,
    i: inc / DEG,
    node: deg360(node),
    omega: deg360(omega),
    M: deg360(M),
    nu: deg360(nu),
    periodYears: a > 0 ? periodDays / 365.25 : Infinity
  };
}

// ---------------------------------------------------------------------------
//  Elements (+ the epoch their mean anomaly refers to) → a body object of the
//  shape cometPosition()/bodies.js expects:
//      { a, e, I(°), argp(°), node(°), tperi(JD), period(days) }
//  with  n = √(μ/a³) rad/day,  period = 2π/n,  tperi = epoch − M(rad)/n.
//  Returns null for non-elliptical or otherwise unusable elements.
// ---------------------------------------------------------------------------
export function elementsToBody(elements, epochJd) {
  if (!elements) return null;
  const { a, e } = elements;
  if (!(a > 0) || !(e >= 0) || !(e < 1) || !isFinite(a) || !isFinite(e)) return null;
  const n = Math.sqrt(MU / (a * a * a));            // mean motion, rad/day
  const period = TWO_PI / n;                        // days
  const tperi = epochJd - (elements.M * DEG) / n;
  return {
    a, e,
    I: elements.i,
    argp: elements.omega,
    node: elements.node,
    tperi,
    period
  };
}

// ============================================================================
//  EXPORT 2 — determineOrbit: classical Gauss's method
// ============================================================================
//
//  ALGEBRA (documented here because the derivation is the point of the tool)
//  -----------------------------------------------------------------------
//  Geometry:      r⃗ᵢ = R⃗ᵢ + ρᵢ·ρ̂ᵢ            (R⃗ = Sun→Earth, ρ⃗ = Earth→body)
//  Coplanarity:   r⃗₂ = c₁·r⃗₁ + c₃·r⃗₃
//    ⇒  c₁·ρ₁·ρ̂₁ − ρ₂·ρ̂₂ + c₃·ρ₃·ρ̂₃ = −(c₁·R⃗₁ − R⃗₂ + c₃·R⃗₃)          (*)
//
//  Sector/triangle ratios to second order in the time intervals
//  (τ₁ = t₁−t₂ < 0, τ₃ = t₃−t₂ > 0, τ = t₃−t₁), with u ≡ μ/r₂³:
//      a₁  =  τ₃/τ                a₃  = −τ₁/τ
//      a₁u = (τ₃/6τ)(τ² − τ₃²)    a₃u = (−τ₁/6τ)(τ² − τ₁²)
//      c₁  = a₁ + a₁u·u           c₃  = a₃ + a₃u·u
//
//  Write (*) as  M·x = P⃗ + u·Q⃗ , where M has COLUMNS (ρ̂₁, −ρ̂₂, ρ̂₃),
//      x  = (c₁ρ₁, ρ₂, c₃ρ₃)ᵀ
//      P⃗  = −(a₁·R⃗₁ − R⃗₂ + a₃·R⃗₃)
//      Q⃗  = −(a₁u·R⃗₁ + a₃u·R⃗₃)
//  so with N = M⁻¹ the middle component gives immediately
//      ρ₂ = A + B·u ,     A = (N·P⃗)_y ,   B = (N·Q⃗)_y                  (**)
//
//  Law of cosines on r⃗₂ = R⃗₂ + ρ₂ρ̂₂, with E ≡ 2(ρ̂₂·R⃗₂) and F ≡ |R⃗₂|²:
//      r₂² = F + ρ₂² + E·ρ₂
//  Substituting (**) with u = μ/r₂³ and multiplying through by r₂⁶:
//      r₂⁸ = (F + A² + A·E)·r₂⁶ + μ·B·(2A + E)·r₂³ + μ²·B²
//  i.e.  r₂⁸ + a·r₂⁶ + b·r₂³ + c = 0  with
//        a = −(A² + A·E + F)
//        b = −μ·B·(2A + E)
//        c = −μ²·B²                      (note c ≤ 0 always)
//
//  Root → ρ₂ → ρ₁, ρ₃ from x → r⃗₁, r⃗₂, r⃗₃, then the truncated Lagrange series
//      f_i = 1 − μτᵢ²/(2r₂³) ,  g_i = τᵢ − μτᵢ³/(6r₂³)
//      v⃗₂ = (f₃·r⃗₁ − f₁·r⃗₃)/(f₃g₁ − f₁g₃)
//  gives a first velocity. The refinement loop then replaces the series with
//  EXACT f, g from a universal-variable Kepler propagation of (r⃗₂, v⃗₂), and
//  re-derives c₁ = g₃/(f₁g₃ − f₃g₁), c₃ = −g₁/(f₁g₃ − f₃g₁) — this is what
//  turns Gauss's approximation into a converged, essentially exact solution.
// ---------------------------------------------------------------------------

function emptyResult(error) {
  return {
    converged: false, iterations: 0,
    r2Vec: null, v2Vec: null,
    ranges: [], r2: null,
    elements: null,
    epochJd: null,
    candidateRoots: [],
    error
  };
}

export function determineOrbit(observations, opts = {}) {
  const maxIterations = opts.maxIterations ?? 20;
  const tolerance = opts.tolerance ?? 1e-10;

  try {
    // --- input validation -------------------------------------------------
    if (!Array.isArray(observations) || observations.length !== 3) {
      return emptyResult('Gauss orbit determination needs exactly 3 observations.');
    }
    for (const o of observations) {
      if (!o || !isFinite(o.jd) || !isFinite(o.raHours) || !isFinite(o.decDeg)) {
        return emptyResult('Each observation needs numeric jd, raHours and decDeg.');
      }
    }
    const t1 = observations[0].jd, t2 = observations[1].jd, t3 = observations[2].jd;
    if (!(t1 < t2 && t2 < t3)) {
      return emptyResult('Observations must be strictly time-ordered (t1 < t2 < t3).');
    }

    // --- 1. direction unit vectors, rotated into the ecliptic frame --------
    const rho = observations.map(o => directionVector(o.raHours, o.decDeg));

    // --- 2. Earth (Sun→Earth) position vectors, ecliptic AU ----------------
    //  These stay pinned to the OBSERVATION epochs: the observer really was
    //  there when the light arrived. Only the dynamics (the τ's below) use the
    //  light-time-corrected epochs, because r⃗ᵢ = R⃗ᵢ + ρᵢρ̂ᵢ is where the body
    //  was when the light left it, i.e. at tᵢ − ρᵢ/c.
    const R = observations.map(o => heliocentricPosition('earth', o.jd));

    // --- invert M (columns ρ̂₁, −ρ̂₂, ρ̂₃) — depends only on the sight-lines,
    //     so it is computed once and reused by every iteration below.
    const M = [
      [rho[0].x, -rho[1].x, rho[2].x],
      [rho[0].y, -rho[1].y, rho[2].y],
      [rho[0].z, -rho[1].z, rho[2].z]
    ];
    const N = invert3(M);
    if (!N) {
      return emptyResult('Singular geometry: the three sight-lines are degenerate ' +
                         '(identical, or exactly coplanar with the Sun). ' +
                         'Choose better-spaced observations.');
    }

    // Solve the linear system (*) for a given pair (c₁, c₃):
    //   x = M⁻¹·(−(c₁R⃗₁ − R⃗₂ + c₃R⃗₃)) ,  ρ₁ = x_x/c₁, ρ₂ = x_y, ρ₃ = x_z/c₃
    const solveRanges = (c1, c3) => {
      if (!isFinite(c1) || !isFinite(c3) || Math.abs(c1) < 1e-12 || Math.abs(c3) < 1e-12) return null;
      const rhs = scale(add(sub(scale(R[0], c1), R[1]), scale(R[2], c3)), -1);
      const x = apply3(N, rhs);
      const r1 = x.x / c1, r2 = x.y, r3 = x.z / c3;
      if (![r1, r2, r3].every(isFinite)) return null;
      return [r1, r2, r3];
    };

    // ---------------------------------------------------------------------
    //  Core Gauss solve for one set of (light-time-corrected) epochs.
    //  Returns { candidateRoots, solutions } where each solution is a fully
    //  refined state vector at the corrected middle epoch tStar[1].
    // ---------------------------------------------------------------------
    const gaussSolve = (tStar) => {
      // --- 3. time intervals -----------------------------------------------
      const tau1 = tStar[0] - tStar[1];
      const tau3 = tStar[2] - tStar[1];
      const tau  = tStar[2] - tStar[0];
      if (!(tau > 0)) return { candidateRoots: [], solutions: [] };

      // --- 4. first-order sector/triangle coefficients ----------------------
      const a1  = tau3 / tau;
      const a3  = -tau1 / tau;
      const a1u = (tau3 / (6 * tau)) * (tau * tau - tau3 * tau3);
      const a3u = (-tau1 / (6 * tau)) * (tau * tau - tau1 * tau1);

      // --- 5. constants A and B of  ρ₂ = A + B·μ/r₂³ ------------------------
      const Pvec = scale(add(sub(scale(R[0], a1), R[1]), scale(R[2], a3)), -1);
      const Qvec = scale(add(scale(R[0], a1u), scale(R[2], a3u)), -1);
      const A = apply3(N, Pvec).y;
      const B = apply3(N, Qvec).y;

      // --- 6. eighth-degree polynomial and its positive real roots ----------
      const Ecoef = 2 * dot(rho[1], R[1]);
      const Fcoef = dot(R[1], R[1]);
      const pa = -(A * A + A * Ecoef + Fcoef);
      const pb = -MU * B * (2 * A + Ecoef);
      const pc = -MU * MU * B * B;
      const candidateRoots = octicRoots(pa, pb, pc);

      // --- 7/8. refine one candidate root into a converged state vector -----
      const attempt = (rootR2) => {
        let ranges = null, rVecs = null, v2 = null;
        let iterations = 0, converged = false;

        // Seed: Gauss series coefficients evaluated at the trial r₂, then the
        // truncated Lagrange f/g series for a first velocity.
        {
          const u = MU / (rootR2 * rootR2 * rootR2);
          ranges = solveRanges(a1 + a1u * u, a3 + a3u * u);
          if (!ranges || !(ranges[1] > 0)) return null;   // ρ₂ must be in front of us
          rVecs = ranges.map((rr, k) => add(R[k], scale(rho[k], rr)));
          const r2m = norm(rVecs[1]);
          const u2 = MU / (r2m * r2m * r2m);
          const f1 = 1 - 0.5 * u2 * tau1 * tau1;
          const f3 = 1 - 0.5 * u2 * tau3 * tau3;
          const g1 = tau1 - (u2 * tau1 * tau1 * tau1) / 6;
          const g3 = tau3 - (u2 * tau3 * tau3 * tau3) / 6;
          const den = f3 * g1 - f1 * g3;
          if (!isFinite(den) || Math.abs(den) < 1e-14) return null;
          v2 = scale(sub(scale(rVecs[0], f3), scale(rVecs[2], f1)), 1 / den);
        }

        // Refinement: replace the series with EXACT Lagrange f, g obtained by
        // propagating the current state (r⃗₂, v⃗₂) to t₁ and t₃, then
        //   c₁ = g₃/(f₁g₃ − f₃g₁),  c₃ = −g₁/(f₁g₃ − f₃g₁)
        // and re-solve the linear system. Under-relaxation (blending the new
        // ranges with the old ones) keeps near-degenerate short-arc geometries
        // — typical of near-Earth asteroids — from oscillating.
        let prevR2 = norm(rVecs[1]);
        let bestState = { ranges, rVecs, v2, r2: prevR2, delta: Infinity };
        for (let it = 0; it < maxIterations; it++) {
          iterations = it + 1;
          const fg1 = lagrangeFG(rVecs[1], v2, tau1);
          const fg3 = lagrangeFG(rVecs[1], v2, tau3);
          if (!fg1 || !fg3) break;
          const den = fg1.f * fg3.g - fg3.f * fg1.g;
          if (!isFinite(den) || Math.abs(den) < 1e-14) break;
          const newRanges = solveRanges(fg3.g / den, -fg1.g / den);
          if (!newRanges || !(newRanges[1] > 0)) break;
          // Under-relax after the first few free iterations.
          const w = it < 3 ? 1 : 0.6;
          ranges = ranges.map((old, k) => old + w * (newRanges[k] - old));
          rVecs = ranges.map((rr, k) => add(R[k], scale(rho[k], rr)));
          const den2 = fg3.f * fg1.g - fg1.f * fg3.g;
          if (!isFinite(den2) || Math.abs(den2) < 1e-14) break;
          v2 = scale(sub(scale(rVecs[0], fg3.f), scale(rVecs[2], fg1.f)), 1 / den2);
          const r2m = norm(rVecs[1]);
          if (!isFinite(r2m) || r2m <= 0) break;
          const delta = Math.abs(r2m - prevR2);
          if (delta < bestState.delta) bestState = { ranges, rVecs, v2, r2: r2m, delta };
          prevR2 = r2m;
          if (delta < tolerance) { converged = true; break; }
        }
        if (!converged) ({ ranges, rVecs, v2 } = bestState);   // fall back to the tightest step

        const elements = stateToElements(rVecs[1], v2);
        if (!elements || !isFinite(elements.a) || !isFinite(elements.e)) return null;
        return {
          converged, iterations,
          r2Vec: rVecs[1], v2Vec: v2,
          ranges, r2: norm(rVecs[1]), elements,
          epoch: tStar[1]
        };
      };

      // --- root selection ---------------------------------------------------
      // Keep every root that yields ρ₂ > 0 and a usable solution; prefer bound,
      // elliptical orbits; among the survivors pick the one that best reproduces
      // the three input observations (lowest RMS of the O−C residuals).
      const solutions = [];
      for (const root of candidateRoots) {
        if (!(A + B * MU / (root * root * root) > 0)) continue;  // body behind the observer
        const sol = attempt(root);
        if (!sol) continue;
        const bound = sol.elements.a > 0 && sol.elements.e < 1;
        let rms = Infinity;
        try {
          const res = residuals(sol.elements, sol.epoch, observations);
          if (res && res.length === 3) rms = rmsResidual(res);
        } catch (_) { /* residuals unavailable (e.g. hyperbolic) — keep rms = ∞ */ }
        if (!isFinite(rms)) rms = Infinity;
        solutions.push({ root, sol, bound, rms });
      }
      solutions.sort((p, q) => {
        if (p.bound !== q.bound) return p.bound ? -1 : 1;   // bound orbits first
        if (p.rms !== q.rms) return p.rms - q.rms;          // then best sky fit
        return p.root - q.root;
      });
      return { candidateRoots, solutions };
    };

    // ---------------------------------------------------------------------
    //  Outer light-time loop. The first pass assumes instantaneous light
    //  (Δt = 0); each later pass shifts the dynamical epochs back by ρᵢ/c
    //  using the ranges just recovered. Two or three passes converge to well
    //  below a milli-arcsecond.
    // ---------------------------------------------------------------------
    const tObs = [t1, t2, t3];
    let lightTimes = [0, 0, 0];
    let best = null;
    let candidateRoots = [];

    for (let pass = 0; pass < 4; pass++) {
      const tStar = tObs.map((t, k) => t - lightTimes[k]);
      const out = gaussSolve(tStar);
      if (pass === 0) candidateRoots = out.candidateRoots;
      if (!out.solutions.length) break;
      best = out.solutions[0].sol;
      candidateRoots = out.candidateRoots;
      const newLT = best.ranges.map(r => Math.max(0, r) * LIGHT_TIME_PER_AU);
      const shift = Math.max(...newLT.map((v, k) => Math.abs(v - lightTimes[k])));
      lightTimes = newLT;
      if (shift < 1e-9) break;                        // < 0.1 ms of epoch change
    }

    if (!best) {
      if (!candidateRoots.length) {
        return {
          ...emptyResult('No positive real root of the 8th-degree Gauss polynomial was found. ' +
                         'The observation geometry is degenerate or the data are inconsistent.'),
          candidateRoots: []
        };
      }
      return {
        ...emptyResult('Every root of the Gauss polynomial gave an unphysical solution ' +
                       '(range behind the observer, or no convergent orbit).'),
        candidateRoots
      };
    }

    // --- 9. report the state and elements at the requested epoch t₂ --------
    //  The refined state belongs to the light-time-corrected epoch t₂ − ρ₂/c;
    //  propagate it forward along its own Kepler orbit so that everything the
    //  caller sees (r2Vec, v2Vec, mean anomaly M) refers to observations[1].jd.
    let r2Vec = best.r2Vec, v2Vec = best.v2Vec, elements = best.elements;
    const dtEpoch = t2 - best.epoch;
    if (dtEpoch !== 0) {
      const prop = propagateState(best.r2Vec, best.v2Vec, dtEpoch);
      if (prop) {
        const el = stateToElements(prop.rVec, prop.vVec);
        if (el) { r2Vec = prop.rVec; v2Vec = prop.vVec; elements = el; }
      }
    }

    return {
      converged: best.converged,
      iterations: best.iterations,
      r2Vec, v2Vec,
      ranges: best.ranges,
      r2: norm(r2Vec),
      elements,
      epochJd: t2,
      candidateRoots,
      error: null
    };
  } catch (err) {
    return emptyResult('Orbit determination failed: ' + (err && err.message ? err.message : String(err)));
  }
}

// ============================================================================
//  EXPORT 3 — residuals: observed minus computed (O−C) for the recovered orbit
// ============================================================================
//  Rebuilds a body object from the recovered elements, runs the forward model
//  (observeBody, light-time corrected) at each observation epoch, and reports
//  the difference on the sky in arcseconds:
//      ΔRA*  = (RA_obs − RA_calc)·15·3600·cos(Dec)      [wrap-safe]
//      ΔDec  = (Dec_obs − Dec_calc)·3600
//      total = √(ΔRA*² + ΔDec²)
//  The returned array also carries a `rms` property (arcsec) for convenience;
//  rmsResidual() does the same for callers who prefer an explicit function.
// ---------------------------------------------------------------------------
export function residuals(elements, epochJd, observations) {
  const body = elementsToBody(elements, epochJd);
  if (!body || !Array.isArray(observations)) return [];
  const out = observations.map(obs => {
    const calc = observeBody(body, obs.jd);
    // RA difference, wrapped into (−12, +12] hours to survive the 0/24h seam.
    let dRaHours = obs.raHours - calc.raHours;
    dRaHours = ((dRaHours + 12) % 24 + 24) % 24 - 12;
    const decMid = 0.5 * (obs.decDeg + calc.decDeg) * DEG;
    const dRA = dRaHours * 15 * 3600 * Math.cos(decMid);   // arcsec, true sky angle
    const dDec = (obs.decDeg - calc.decDeg) * 3600;        // arcsec
    return {
      jd: obs.jd,
      dRA_arcsec: dRA,
      dDec_arcsec: dDec,
      total_arcsec: Math.hypot(dRA, dDec)
    };
  });
  Object.defineProperty(out, 'rms', {
    value: rmsResidual(out), enumerable: false, writable: false
  });
  return out;
}

// RMS of the total residuals, in arcseconds.
export function rmsResidual(res) {
  if (!res || !res.length) return NaN;
  const ss = res.reduce((p, q) => p + q.total_arcsec * q.total_arcsec, 0) / res.length;
  return Math.sqrt(ss);
}
