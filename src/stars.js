// ============================================================================
//  stars.js — 邻近与著名恒星数据（真实天球坐标）
// ----------------------------------------------------------------------------
//  每颗恒星用真实的赤经(RA)、赤纬(Dec)、距离(光年)定位，
//  在以太阳为中心的 3D 星图中还原它们的真实空间分布。
//  数据来源：SIMBAD / Hipparcos / Gaia 公开星表。
// ============================================================================

// 由光谱型首字母决定颜色（恒星表面温度：O蓝 → M红）
export const SPECTRAL_COLOR = {
  O: 0x9bb0ff, B: 0xaabfff, A: 0xcad8ff, F: 0xf8f7ff,
  G: 0xfff2cc, K: 0xffcf8f, M: 0xff8a5c
};

// 光度级 → 显示尺寸（矮星小、巨星中、超巨星大）
const LUM_SIZE = { V: 0.4, IV: 0.5, III: 0.9, II: 1.4, I: 2.4 };

// ra: 赤经(小时)  dec: 赤纬(度)  dist: 距离(光年)
export const STARS = [
  {
    key: 'sun', nameZh: '太阳', nameEn: 'Sun', ra: 0, dec: 0, dist: 0,
    spectral: 'G2V', lum: 'V',
    facts: { '距离': '0（我们所在）', '光谱型': 'G2V 黄矮星', '直径': '1,392,700 km' },
    highlights: ['星图的中心参照点', '在银河系猎户臂的一个普通位置'],
    blurb: '太阳 —— 我们的母恒星，这张邻近恒星地图的原点。'
  },
  {
    key: 'proxima', nameZh: '比邻星', nameEn: 'Proxima Centauri', ra: 14.4953, dec: -62.679, dist: 4.246,
    spectral: 'M5.5Ve', lum: 'V',
    facts: { '距离': '4.24 光年（最近的恒星）', '光谱型': 'M5.5Ve 红矮星', '所属': '半人马座 α 三星系统' },
    highlights: [
      '⭐ 离太阳最近的恒星',
      '拥有位于宜居带的行星「比邻星 b」',
      '红矮星，质量仅约太阳的 1/8，会爆发耀斑',
      '光需 4.24 年才能到达我们'
    ],
    blurb: '比邻星是距太阳最近的恒星，一颗昏暗的红矮星。它拥有一颗位于宜居带的行星，是人类星际探测的首要目标。'
  },
  {
    key: 'alphacen', nameZh: '南门二', nameEn: 'Alpha Centauri A', ra: 14.6601, dec: -60.834, dist: 4.365,
    spectral: 'G2V', lum: 'V',
    facts: { '距离': '4.37 光年', '光谱型': 'G2V（与太阳几乎相同）', '所属': '半人马座 α' },
    highlights: [
      '与太阳最像的邻近恒星（同为 G2V）',
      '与南门二乙（K1V）组成双星，比邻星是其伴星',
      '南天最亮恒星之一，肉眼可见'
    ],
    blurb: '南门二 A 是离我们第二近的恒星系统的主星，性质与太阳惊人地相似，长期是科幻中星际航行的目的地。'
  },
  {
    key: 'barnard', nameZh: '巴纳德星', nameEn: "Barnard's Star", ra: 17.9633, dec: 4.693, dist: 5.963,
    spectral: 'M4.0V', lum: 'V',
    facts: { '距离': '5.96 光年', '光谱型': 'M4V 红矮星', '特点': '自行最快的恒星' },
    highlights: [
      '天空中「自行」最快的恒星——移动肉眼虽不可见但逐年可测',
      '古老的红矮星，年龄可能超过 100 亿年',
      '2024 年确认拥有行星'
    ],
    blurb: '巴纳德星是一颗高速掠过我们视线的古老红矮星，它在天球上的移动速度是所有已知恒星里最快的。'
  },
  {
    key: 'sirius', nameZh: '天狼星', nameEn: 'Sirius', ra: 6.7525, dec: -16.716, dist: 8.66,
    spectral: 'A1V', lum: 'V',
    facts: { '距离': '8.66 光年', '光谱型': 'A1V', '视星等': '-1.46（全天最亮恒星）' },
    highlights: [
      '⭐ 夜空中最亮的恒星',
      '有一颗白矮星伴星「天狼星 B」',
      '比太阳更热更亮更大（约 2 倍太阳质量）',
      '古埃及用它的偕日升预测尼罗河泛滥'
    ],
    blurb: '天狼星是夜空中最耀眼的恒星，位于大犬座。它是一对双星，主星炽热明亮，伴星是一颗致密的白矮星。'
  },
  {
    key: 'procyon', nameZh: '南河三', nameEn: 'Procyon', ra: 7.6550, dec: 5.225, dist: 11.46,
    spectral: 'F5IV-V', lum: 'IV',
    facts: { '距离': '11.46 光年', '光谱型': 'F5IV-V', '视星等': '0.34' },
    highlights: ['全天第八亮星', '同样有白矮星伴星', '与天狼星、参宿四组成「冬季大三角」'],
    blurb: '南河三是小犬座的主星，明亮而临近，是冬季夜空最好辨认的亮星之一。'
  },
  {
    key: 'tauceti', nameZh: '天仓五', nameEn: 'Tau Ceti', ra: 1.7344, dec: -15.937, dist: 11.9,
    spectral: 'G8.5V', lum: 'V',
    facts: { '距离': '11.9 光年', '光谱型': 'G8.5V（类太阳）', '特点': '拥有多行星系统' },
    highlights: ['最近的单颗类太阳恒星之一', '拥有多颗行星，含可能位于宜居带者', '金属含量低，系统古老'],
    blurb: '天仓五是一颗与太阳相似、临近而稳定的黄矮星，拥有一个多行星系统，是搜寻地外生命的重点目标。'
  },
  {
    key: 'altair', nameZh: '牛郎星', nameEn: 'Altair', ra: 19.8464, dec: 8.868, dist: 16.73,
    spectral: 'A7V', lum: 'V',
    facts: { '距离': '16.73 光年', '光谱型': 'A7V', '特点': '自转极快、呈扁球形' },
    highlights: [
      '⭐「牛郎织女」中的牛郎星（天鹰座 α）',
      '自转极快（约 9 小时一圈），被甩成明显扁球',
      '与织女星、天津四组成「夏季大三角」'
    ],
    blurb: '牛郎星是夏夜三角的一员，自转快得把自己甩成了扁球。它与银河对岸的织女星，构成了千古流传的传说。'
  },
  {
    key: 'vega', nameZh: '织女星', nameEn: 'Vega', ra: 18.6156, dec: 38.784, dist: 25.04,
    spectral: 'A0V', lum: 'V',
    facts: { '距离': '25.04 光年', '光谱型': 'A0V', '视星等': '0.03' },
    highlights: [
      '⭐「牛郎织女」中的织女星（天琴座 α）',
      '曾是天文测光的「零点」标准星',
      '周围有尘埃盘，可能正在形成行星',
      '约 1.2 万年后将因地轴进动成为北极星'
    ],
    blurb: '织女星是天琴座的主星，明亮偏蓝。它是北半球夏夜最醒目的恒星之一，也曾是恒星亮度的标准参照。'
  },
  {
    key: 'fomalhaut', nameZh: '北落师门', nameEn: 'Fomalhaut', ra: 22.9608, dec: -29.622, dist: 25.13,
    spectral: 'A3V', lum: 'V',
    facts: { '距离': '25.13 光年', '光谱型': 'A3V', '特点': '拥有著名的尘埃盘' },
    highlights: ['周围有壮观的碎屑尘埃环', '曾直接成像疑似行星', '秋季南方天空的孤星'],
    blurb: '北落师门是南鱼座的主星，因周围一圈醒目的尘埃环而闻名，是研究行星系统形成的天然实验室。'
  },
  {
    key: 'pollux', nameZh: '北河三', nameEn: 'Pollux', ra: 7.7553, dec: 28.026, dist: 33.78,
    spectral: 'K0III', lum: 'III',
    facts: { '距离': '33.78 光年', '光谱型': 'K0III 橙巨星', '特点': '最近的巨星、有行星' },
    highlights: ['离太阳最近的巨星', '拥有一颗确认的系外行星', '双子座最亮星'],
    blurb: '北河三是双子座的头号亮星，一颗临近的橙色巨星，也是最早确认拥有行星的巨星之一。'
  },
  {
    key: 'arcturus', nameZh: '大角星', nameEn: 'Arcturus', ra: 14.2612, dec: 19.182, dist: 36.7,
    spectral: 'K0III', lum: 'III',
    facts: { '距离': '36.7 光年', '光谱型': 'K0III 橙巨星', '视星等': '-0.05' },
    highlights: ['北天最亮恒星', '一颗年老的橙色巨星，直径约太阳 25 倍', '正高速穿越银河系（银晕族恒星）'],
    blurb: '大角星是牧夫座的主星，北半球夜空最亮的恒星。它是一颗年老的橙巨星，正以高速穿越太阳附近的星际空间。'
  },
  {
    key: 'aldebaran', nameZh: '毕宿五', nameEn: 'Aldebaran', ra: 4.5986, dec: 16.509, dist: 65.3,
    spectral: 'K5III', lum: 'III',
    facts: { '距离': '65.3 光年', '光谱型': 'K5III 橙巨星', '特点': '金牛座「牛眼」' },
    highlights: ['金牛座主星，宛如公牛的红色眼睛', '直径约太阳 44 倍的橙巨星', '恒星演化晚期的样本'],
    blurb: '毕宿五是金牛座那只红色的「牛眼」，一颗膨胀中的橙色巨星，展示了类太阳恒星走向暮年的模样。'
  },
  {
    key: 'betelgeuse', nameZh: '参宿四', nameEn: 'Betelgeuse', ra: 5.9195, dec: 7.407, dist: 548,
    spectral: 'M1-2Ia', lum: 'I',
    facts: { '距离': '约 548 光年', '光谱型': 'M1-2 Ia 红超巨星', '直径': '约太阳的 700 倍' },
    highlights: [
      '⭐ 猎户座的红超巨星，若置于太阳位置可吞没火星轨道',
      '亮度会不规则变化，2019 年曾神秘大幅变暗',
      '已接近生命尽头，未来（天文尺度）将以超新星爆发',
      '爆发时白昼可见，是最受关注的候选超新星'
    ],
    blurb: '参宿四是猎户座肩上的红超巨星，体积大到能装下整个内太阳系。它已濒临死亡，随时可能爆发为壮观的超新星。'
  },
  {
    key: 'antares', nameZh: '心宿二', nameEn: 'Antares', ra: 16.49, dec: -26.432, dist: 604,
    spectral: 'M1.5Iab', lum: 'I',
    facts: { '距离': '约 604 光年', '光谱型': 'M1.5 Iab 红超巨星', '特点': '天蝎之心' },
    highlights: ['天蝎座的红色心脏，名字意为「火星的对手」', '红超巨星，直径约太阳 700 倍', '同样是未来的超新星候选'],
    blurb: '心宿二是天蝎座心脏处的红超巨星，颜色火红，古人称它为「火星的对手」。它与参宿四一样濒临超新星爆发。'
  },
  {
    key: 'rigel', nameZh: '参宿七', nameEn: 'Rigel', ra: 5.2422, dec: -8.202, dist: 863,
    spectral: 'B8Ia', lum: 'I',
    facts: { '距离': '约 863 光年', '光谱型': 'B8 Ia 蓝超巨星', '光度': '约太阳的 12 万倍' },
    highlights: ['猎户座最亮星，一颗炽热的蓝超巨星', '真实光度约为太阳的 12 万倍', '与红色的参宿四在猎户座遥相辉映'],
    blurb: '参宿七是猎户座脚下炽热的蓝超巨星，真实亮度是太阳的十几万倍。它与对角的红超巨星参宿四，构成猎户座的冷暖两极。'
  }
];

// 赤道坐标(RA,Dec,dist) → 直角坐标（光年）
export function starPositionLy(star) {
  const ra = star.ra * 15 * Math.PI / 180;   // 小时 → 度 → 弧度
  const dec = star.dec * Math.PI / 180;
  return {
    x: star.dist * Math.cos(dec) * Math.cos(ra),
    y: star.dist * Math.cos(dec) * Math.sin(ra),
    z: star.dist * Math.sin(dec)
  };
}

// 给恒星附上颜色与显示尺寸（供渲染层使用）
export function starVisual(star) {
  const cls = star.spectral[0];
  const color = SPECTRAL_COLOR[cls] || 0xffffff;
  const size = LUM_SIZE[star.lum] || 0.4;
  return { color, size };
}
