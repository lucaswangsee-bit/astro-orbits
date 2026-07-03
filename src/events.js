// ============================================================================
//  events.js — 天象预测引擎
// ----------------------------------------------------------------------------
//  复用 kepler.js 的轨道解算，扫描未来若干年，检测：
//   · 外行星的「冲」(opposition)        —— 行星与太阳地心黄经相差 180°，整夜可见、最亮
//   · 内行星的「大距」(elongation)       —— 水星/金星离太阳角距最大，最易观测
//   · 亮行星之间的「相合」(conjunction)  —— 两行星在天空中靠得最近
//  这些都是可用真实轨道数据精确算出的日期，非估算。
// ============================================================================
import { heliocentricPosition, julianDate } from './kepler.js';

const RAD2DEG = 180 / Math.PI;

// 归一到 [-180, 180]
function norm180(a) {
  a = ((a % 360) + 360) % 360;
  return a > 180 ? a - 360 : a;
}

// 某行星的「地心黄经」(deg)：从地球看过去的方向
function geoLon(key, jd) {
  const p = heliocentricPosition(key, jd);
  const e = heliocentricPosition('earth', jd);
  return Math.atan2(p.y - e.y, p.x - e.x) * RAD2DEG;
}

// 太阳的地心黄经：从地球看太阳 = 地球日心方向的反向
function sunGeoLon(jd) {
  const e = heliocentricPosition('earth', jd);
  return Math.atan2(-e.y, -e.x) * RAD2DEG;
}

const NAME = {
  mercury: '水星', venus: '金星', mars: '火星', jupiter: '木星',
  saturn: '土星', uranus: '天王星', neptune: '海王星'
};

function jdToDate(jd) { return new Date((jd - 2440587.5) * 86400000); }
function fmt(d) {
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

const OUTER = ['mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
const INNER = ['mercury', 'venus'];
const PAIRS = [
  ['venus', 'jupiter'], ['venus', 'mars'], ['venus', 'saturn'],
  ['mars', 'jupiter'], ['mars', 'saturn'], ['jupiter', 'saturn']
];

// 计算某时刻的快照
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
//  主函数：从 startDate 起扫描 years 年，返回按日期排序的天象列表
// ---------------------------------------------------------------------------
export function computeEvents(startDate, years = 8) {
  const jd0 = julianDate(startDate);
  const jd1 = jd0 + years * 365.25;
  const events = [];

  let prev2 = null, prev = null;

  for (let jd = jd0; jd <= jd1; jd += 1) {
    const cur = snapshot(jd);

    if (prev) {
      // —— 外行星「冲」：elong 在 ±180 处跳变
      for (const k of OUTER) {
        if (Math.abs(prev.elong[k] - cur.elong[k]) > 180) {
          events.push({
            jd, type: 'opposition', title: `${NAME[k]}冲日`,
            desc: `${NAME[k]}与太阳地心方向相差 180°，整夜可见、最亮最大，是全年最佳观测期。`
          });
        }
      }
      // —— 亮行星「相合」：两行星地心黄经差越过 0
      for (const [x, y] of PAIRS) {
        const a = prev.pairDiff[`${x}_${y}`], b = cur.pairDiff[`${x}_${y}`];
        if (a * b < 0 && Math.abs(a) + Math.abs(b) < 60) {
          events.push({
            jd, type: 'conjunction', title: `${NAME[x]}合${NAME[y]}`,
            desc: `${NAME[x]}与${NAME[y]}在天空中相合，黄经接近一致，是难得的双星同框景象。`
          });
        }
      }
    }
    // —— 内行星「大距」：|elong| 出现三点局部极大值（发生在 prev 时刻）
    if (prev2 && prev) {
      for (const k of INNER) {
        const p0 = Math.abs(prev2.elong[k]), p1 = Math.abs(prev.elong[k]), p2 = Math.abs(cur.elong[k]);
        if (p1 > p0 && p1 >= p2 && p1 > 15) {
          const east = prev.elong[k] > 0;
          events.push({
            jd: prev.jd, type: 'elongation',
            title: `${NAME[k]}${east ? '东' : '西'}大距`,
            desc: `${NAME[k]}离太阳角距达最大（约 ${p1.toFixed(0)}°），${east ? '日落后现于西方天空' : '日出前现于东方天空'}，最易观测。`
          });
        }
      }
    }

    prev2 = prev; prev = cur;
  }

  events.sort((e1, e2) => e1.jd - e2.jd);
  return events.map(e => ({ ...e, date: jdToDate(e.jd), dateStr: fmt(jdToDate(e.jd)) }));
}
