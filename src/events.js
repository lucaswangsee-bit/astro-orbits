// ============================================================================
//  events.js — sky-event prediction engine
// ----------------------------------------------------------------------------
//  Reuses the orbit solver in kepler.js, scanning several years ahead to detect:
//   · Opposition of an outer planet   — planet and Sun 180° apart in geocentric
//                                        longitude; visible all night, brightest.
//   · Greatest elongation of an inner  — Mercury/Venus at max angular distance
//     planet                             from the Sun; easiest to observe.
//   · Conjunction of two bright planets — two planets appear closest together.
//  These are exact dates computed from real orbital data, not estimates.
// ============================================================================
import { heliocentricPosition, julianDate } from './kepler.js';

const RAD2DEG = 180 / Math.PI;

// Normalize to [-180, 180]
function norm180(a) {
  a = ((a % 360) + 360) % 360;
  return a > 180 ? a - 360 : a;
}

// Geocentric longitude of a planet (deg): its direction as seen from Earth
function geoLon(key, jd) {
  const p = heliocentricPosition(key, jd);
  const e = heliocentricPosition('earth', jd);
  return Math.atan2(p.y - e.y, p.x - e.x) * RAD2DEG;
}

// Geocentric longitude of the Sun: seen from Earth = opposite of Earth’s heliocentric direction
function sunGeoLon(jd) {
  const e = heliocentricPosition('earth', jd);
  return Math.atan2(-e.y, -e.x) * RAD2DEG;
}

const NAME = {
  mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter',
  saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune'
};

function jdToDate(jd) { return new Date((jd - 2440587.5) * 86400000); }
function fmt(d) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

const OUTER = ['mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
const INNER = ['mercury', 'venus'];
const PAIRS = [
  ['venus', 'jupiter'], ['venus', 'mars'], ['venus', 'saturn'],
  ['mars', 'jupiter'], ['mars', 'saturn'], ['jupiter', 'saturn']
];

// Compute a snapshot at a given instant
function snapshot(jd) {
  const sun = sunGeoLon(jd);
  const planet = {}, elong = {}, pairDiff = {};
  for (const k of [...OUTER, ...INNER]) {
    planet[k] = geoLon(k, jd);
    elong[k] = norm180(planet[k] - sun);
  }
  for (const [a, b] of PAIRS) pairDiff[`${a}_${b}`] = norm180(planet[a] - planet[b]);
  return { jd, sun, planet, elong, pairDiff };
}

// ---------------------------------------------------------------------------
//  Main: scan `years` years from startDate, return events sorted by date
// ---------------------------------------------------------------------------
export function computeEvents(startDate, years = 8) {
  const jd0 = julianDate(startDate);
  const jd1 = jd0 + years * 365.25;
  const events = [];

  let prev2 = null, prev = null;

  for (let jd = jd0; jd <= jd1; jd += 1) {
    const cur = snapshot(jd);

    if (prev) {
      // — Outer-planet opposition: elong flips across ±180
      for (const k of OUTER) {
        if (Math.abs(prev.elong[k] - cur.elong[k]) > 180) {
          events.push({
            jd, type: 'opposition', title: `${NAME[k]} at opposition`,
            desc: `${NAME[k]} sits 180° from the Sun as seen from Earth — visible all night, at its brightest and largest. The best viewing window of the year.`
          });
        }
      }
      // — Bright-planet conjunction: the pair’s geocentric-longitude difference crosses 0
      for (const [x, y] of PAIRS) {
        const a = prev.pairDiff[`${x}_${y}`], b = cur.pairDiff[`${x}_${y}`];
        if (a * b < 0 && Math.abs(a) + Math.abs(b) < 60) {
          events.push({
            jd, type: 'conjunction', title: `${NAME[x]}–${NAME[y]} conjunction`,
            desc: `${NAME[x]} and ${NAME[y]} meet in the sky at nearly the same longitude — a rare chance to see two planets in one frame.`
          });
        }
      }
    }
    // — Inner-planet greatest elongation: |elong| shows a local max across three points (at the prev instant)
    if (prev2 && prev) {
      for (const k of INNER) {
        const p0 = Math.abs(prev2.elong[k]), p1 = Math.abs(prev.elong[k]), p2 = Math.abs(cur.elong[k]);
        if (p1 > p0 && p1 >= p2 && p1 > 15) {
          const east = prev.elong[k] > 0;
          events.push({
            jd: prev.jd, type: 'elongation',
            title: `${NAME[k]} at greatest ${east ? 'eastern' : 'western'} elongation`,
            desc: `${NAME[k]} reaches its maximum angular distance from the Sun (~${p1.toFixed(0)}°), ${east ? 'appearing in the western sky after sunset' : 'appearing in the eastern sky before sunrise'} — easiest to observe.`
          });
        }
      }
    }

    prev2 = prev; prev = cur;
  }

  events.sort((e1, e2) => e1.jd - e2.jd);
  return events.map(e => ({ ...e, date: jdToDate(e.jd), dateStr: fmt(jdToDate(e.jd)) }));
}
