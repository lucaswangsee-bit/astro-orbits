// ============================================================================
//  stars.js — data for nearby and famous stars (real celestial coordinates)
// ----------------------------------------------------------------------------
//  Each star is placed by its real right ascension (RA), declination (Dec) and
//  distance (light-years), reconstructing its true 3D position in a Sun-centered
//  star map.
//  Sources: SIMBAD / Hipparcos / Gaia public catalogs.
// ============================================================================

// Color from the leading spectral-type letter (surface temperature: O blue → M red)
export const SPECTRAL_COLOR = {
  O: 0x9bb0ff, B: 0xaabfff, A: 0xcad8ff, F: 0xf8f7ff,
  G: 0xfff2cc, K: 0xffcf8f, M: 0xff8a5c
};

// Luminosity class → display size (dwarfs small, giants medium, supergiants large)
const LUM_SIZE = { V: 0.4, IV: 0.5, III: 0.9, II: 1.4, I: 2.4 };

// ra: right ascension (hours)  dec: declination (deg)  dist: distance (light-years)
export const STARS = [
  {
    key: 'sun', nameZh: 'Sun', nameEn: 'Sun', ra: 0, dec: 0, dist: 0,
    spectral: 'G2V', lum: 'V',
    facts: { 'Distance': '0 (our location)', 'Spectral type': 'G2V yellow dwarf', 'Diameter': '1,392,700 km' },
    highlights: ['The central reference point of the map', 'An ordinary position in the Milky Way’s Orion Arm'],
    blurb: 'The Sun — our home star and the origin point of this nearby-star map.',
    mechanics: {
      orbit: 'The Sun is the origin of this star map: its coordinates are exactly (0, 0, 0). Every other star is placed relative to it, from that star’s right ascension, declination and distance.',
      gValue: 'Surface gravity g ≈ 274 m/s² (about 28 × Earth)',
      gMethod: 'For a star, g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M = 1 M☉, R = 1 R☉ → g ≈ 274 m/s².'
    }
  },
  {
    key: 'proxima', nameZh: 'Proxima Centauri', nameEn: 'Proxima Centauri', ra: 14.4953, dec: -62.679, dist: 4.246,
    spectral: 'M5.5Ve', lum: 'V',
    facts: { 'Distance': '4.24 ly (nearest star)', 'Spectral type': 'M5.5Ve red dwarf', 'System': 'Alpha Centauri triple system' },
    highlights: [
      '⭐ The closest star to the Sun',
      'Hosts the planet "Proxima b" in its habitable zone',
      'A red dwarf only ~1/8 the Sun’s mass, prone to flares',
      'Its light takes 4.24 years to reach us'
    ],
    blurb: 'Proxima Centauri is the nearest star to the Sun, a dim red dwarf. It hosts a planet in its habitable zone and is the prime target for interstellar exploration.',
    mechanics: {
      orbit: 'Placed from its catalog coordinates RA = 14.50 h, Dec = −62.68°, distance = 4.24 ly. RA (hours) and Dec (degrees) are converted to radians, then mapped to 3D by x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec). Being the nearest star, it lies closest to the origin of any point on the map.',
      gValue: 'Surface gravity g ≈ 1410 m/s² (about 144 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 0.12 M☉, R ≈ 0.15 R☉ → g ≈ 1410 m/s². A tiny, dense red dwarf packs a surprisingly strong surface gravity.'
    }
  },
  {
    key: 'alphacen', nameZh: 'Alpha Centauri A', nameEn: 'Alpha Centauri A', ra: 14.6601, dec: -60.834, dist: 4.365,
    spectral: 'G2V', lum: 'V',
    facts: { 'Distance': '4.37 ly', 'Spectral type': 'G2V (almost identical to the Sun)', 'System': 'Alpha Centauri' },
    highlights: [
      'The nearby star most like the Sun (also G2V)',
      'Forms a binary with Alpha Centauri B (K1V); Proxima is a distant companion',
      'One of the brightest stars in the southern sky, visible to the naked eye'
    ],
    blurb: 'Alpha Centauri A is the primary star of the second-nearest star system, strikingly similar to the Sun and a long-standing destination in interstellar science fiction.',
    mechanics: {
      orbit: 'Placed from RA = 14.66 h, Dec = −60.83°, distance = 4.37 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec). It is gravitationally bound in a triple system, so its true position drifts slowly over centuries; this map is a fixed J2000 snapshot.',
      gValue: 'Surface gravity g ≈ 199 m/s² (about 20 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 1.08 M☉, R ≈ 1.22 R☉ → g ≈ 199 m/s². Sun-like, so its gravity is close to the Sun’s.'
    }
  },
  {
    key: 'barnard', nameZh: "Barnard's Star", nameEn: "Barnard's Star", ra: 17.9633, dec: 4.693, dist: 5.963,
    spectral: 'M4.0V', lum: 'V',
    facts: { 'Distance': '5.96 ly', 'Spectral type': 'M4V red dwarf', 'Notable': 'Highest proper motion of any star' },
    highlights: [
      'Moves across the sky faster than any other star ("proper motion") — invisible to the eye but measurable year to year',
      'An ancient red dwarf, possibly over 10 billion years old',
      'Confirmed to host a planet in 2024'
    ],
    blurb: 'Barnard’s Star is an ancient red dwarf streaking across our line of sight — its apparent motion on the sky is the fastest of any known star.',
    mechanics: {
      orbit: 'Placed from RA = 17.96 h, Dec = +4.69°, distance = 5.96 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec). It has the largest proper motion of any star, so its RA/Dec measurably shift year to year — this position is a snapshot for the J2000 epoch.',
      gValue: 'Surface gravity g ≈ 1210 m/s² (about 124 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 0.16 M☉, R ≈ 0.19 R☉ → g ≈ 1210 m/s².'
    }
  },
  {
    key: 'sirius', nameZh: 'Sirius', nameEn: 'Sirius', ra: 6.7525, dec: -16.716, dist: 8.66,
    spectral: 'A1V', lum: 'V',
    facts: { 'Distance': '8.66 ly', 'Spectral type': 'A1V', 'Apparent magnitude': '-1.46 (brightest star in the sky)' },
    highlights: [
      '⭐ The brightest star in the night sky',
      'Has a white-dwarf companion, "Sirius B"',
      'Hotter, brighter and larger than the Sun (~2 solar masses)',
      'Ancient Egyptians used its heliacal rising to predict the flooding of the Nile'
    ],
    blurb: 'Sirius is the most brilliant star in the night sky, in Canis Major. It is a binary: a hot, bright primary and a dense white-dwarf companion.',
    mechanics: {
      orbit: 'Placed from RA = 6.75 h, Dec = −16.72°, distance = 8.66 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec). The coordinates track the bright primary Sirius A; its white-dwarf companion Sirius B orbits too close to separate at this scale.',
      gValue: 'Surface gravity g ≈ 193 m/s² (about 20 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 2.06 M☉, R ≈ 1.71 R☉ → g ≈ 193 m/s².'
    }
  },
  {
    key: 'procyon', nameZh: 'Procyon', nameEn: 'Procyon', ra: 7.6550, dec: 5.225, dist: 11.46,
    spectral: 'F5IV-V', lum: 'IV',
    facts: { 'Distance': '11.46 ly', 'Spectral type': 'F5IV-V', 'Apparent magnitude': '0.34' },
    highlights: ['The eighth-brightest star in the sky', 'Also has a white-dwarf companion', 'Forms the "Winter Triangle" with Sirius and Betelgeuse'],
    blurb: 'Procyon is the primary star of Canis Minor, bright and nearby — one of the easiest bright stars to spot in the winter sky.',
    mechanics: {
      orbit: 'Placed from RA = 7.66 h, Dec = +5.23°, distance = 11.46 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec).',
      gValue: 'Surface gravity g ≈ 98 m/s² (about 10 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 1.5 M☉, R ≈ 2.05 R☉ → g ≈ 98 m/s². It is swelling into a subgiant, so its surface gravity has already dropped well below the Sun’s.'
    }
  },
  {
    key: 'tauceti', nameZh: 'Tau Ceti', nameEn: 'Tau Ceti', ra: 1.7344, dec: -15.937, dist: 11.9,
    spectral: 'G8.5V', lum: 'V',
    facts: { 'Distance': '11.9 ly', 'Spectral type': 'G8.5V (Sun-like)', 'Notable': 'Hosts a multi-planet system' },
    highlights: ['One of the nearest single Sun-like stars', 'Hosts several planets, some possibly in the habitable zone', 'Metal-poor and an old system'],
    blurb: 'Tau Ceti is a nearby, stable yellow dwarf similar to the Sun, with a multi-planet system that makes it a key target in the search for extraterrestrial life.',
    mechanics: {
      orbit: 'Placed from RA = 1.73 h, Dec = −15.94°, distance = 11.9 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec).',
      gValue: 'Surface gravity g ≈ 342 m/s² (about 35 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 0.78 M☉, R ≈ 0.79 R☉ → g ≈ 342 m/s². A slightly smaller Sun-like star, so it is a touch denser and its gravity a bit higher.'
    }
  },
  {
    key: 'altair', nameZh: 'Altair', nameEn: 'Altair', ra: 19.8464, dec: 8.868, dist: 16.73,
    spectral: 'A7V', lum: 'V',
    facts: { 'Distance': '16.73 ly', 'Spectral type': 'A7V', 'Notable': 'Extremely fast rotation, oblate shape' },
    highlights: [
      '⭐ The "Cowherd" star of the Chinese legend (Alpha Aquilae)',
      'Spins so fast (~9 hours per rotation) that it is visibly flattened',
      'Forms the "Summer Triangle" with Vega and Deneb'
    ],
    blurb: 'Altair is a member of the Summer Triangle, spinning so fast it has flung itself into an oblate shape. With Vega across the Milky Way, it stars in a legend told for millennia.',
    mechanics: {
      orbit: 'Placed from RA = 19.85 h, Dec = +8.87°, distance = 16.73 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec). Its extreme rotation makes it visibly oblate, so the “radius” used below is an equatorial average.',
      gValue: 'Surface gravity g ≈ 151 m/s² (about 15 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 1.8 M☉, R ≈ 1.8 R☉ → g ≈ 151 m/s².'
    }
  },
  {
    key: 'vega', nameZh: 'Vega', nameEn: 'Vega', ra: 18.6156, dec: 38.784, dist: 25.04,
    spectral: 'A0V', lum: 'V',
    facts: { 'Distance': '25.04 ly', 'Spectral type': 'A0V', 'Apparent magnitude': '0.03' },
    highlights: [
      '⭐ The "Weaver Girl" star of the Chinese legend (Alpha Lyrae)',
      'Once served as the "zero point" reference for stellar photometry',
      'Surrounded by a dust disk that may be forming planets',
      'Will become the pole star in about 12,000 years due to axial precession'
    ],
    blurb: 'Vega is the primary star of Lyra, bright and bluish. One of the most conspicuous stars of the northern summer sky, it once served as the standard reference for stellar brightness.',
    mechanics: {
      orbit: 'Placed from RA = 18.62 h, Dec = +38.78°, distance = 25.04 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec).',
      gValue: 'Surface gravity g ≈ 105 m/s² (about 11 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 2.14 M☉, R ≈ 2.36 R☉ → g ≈ 105 m/s².'
    }
  },
  {
    key: 'fomalhaut', nameZh: 'Fomalhaut', nameEn: 'Fomalhaut', ra: 22.9608, dec: -29.622, dist: 25.13,
    spectral: 'A3V', lum: 'V',
    facts: { 'Distance': '25.13 ly', 'Spectral type': 'A3V', 'Notable': 'Famous for its dust disk' },
    highlights: ['Surrounded by a spectacular debris dust ring', 'Once directly imaged with a suspected planet', 'A lone bright star in the autumn southern sky'],
    blurb: 'Fomalhaut is the primary star of Piscis Austrinus, famed for a striking ring of dust around it — a natural laboratory for studying planetary-system formation.',
    mechanics: {
      orbit: 'Placed from RA = 22.96 h, Dec = −29.62°, distance = 25.13 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec).',
      gValue: 'Surface gravity g ≈ 155 m/s² (about 16 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 1.92 M☉, R ≈ 1.84 R☉ → g ≈ 155 m/s².'
    }
  },
  {
    key: 'pollux', nameZh: 'Pollux', nameEn: 'Pollux', ra: 7.7553, dec: 28.026, dist: 33.78,
    spectral: 'K0III', lum: 'III',
    facts: { 'Distance': '33.78 ly', 'Spectral type': 'K0III orange giant', 'Notable': 'Nearest giant star, has a planet' },
    highlights: ['The nearest giant star to the Sun', 'Hosts a confirmed exoplanet', 'The brightest star in Gemini'],
    blurb: 'Pollux is the brightest star in Gemini, a nearby orange giant and one of the first giant stars confirmed to host a planet.',
    mechanics: {
      orbit: 'Placed from RA = 7.76 h, Dec = +28.03°, distance = 33.78 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec).',
      gValue: 'Surface gravity g ≈ 6.8 m/s² (about 0.7 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 1.9 M☉, R ≈ 8.8 R☉ → g ≈ 6.8 m/s². As an orange giant it has puffed up, so despite ~2 solar masses its surface gravity is below Earth’s.'
    }
  },
  {
    key: 'arcturus', nameZh: 'Arcturus', nameEn: 'Arcturus', ra: 14.2612, dec: 19.182, dist: 36.7,
    spectral: 'K0III', lum: 'III',
    facts: { 'Distance': '36.7 ly', 'Spectral type': 'K0III orange giant', 'Apparent magnitude': '-0.05' },
    highlights: ['The brightest star in the northern sky', 'An old orange giant about 25× the Sun’s diameter', 'Racing through the galaxy at high speed (a halo-population star)'],
    blurb: 'Arcturus is the primary star of Boötes and the brightest in the northern night sky. An aged orange giant, it is speeding through the interstellar space near the Sun.',
    mechanics: {
      orbit: 'Placed from RA = 14.26 h, Dec = +19.18°, distance = 36.7 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec). It races through the solar neighborhood, so over long timescales its map position shifts noticeably.',
      gValue: 'Surface gravity g ≈ 0.46 m/s² (about 0.05 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 1.08 M☉, R ≈ 25 R☉ → g ≈ 0.46 m/s². Its huge, bloated envelope leaves only a feeble surface gravity.'
    }
  },
  {
    key: 'aldebaran', nameZh: 'Aldebaran', nameEn: 'Aldebaran', ra: 4.5986, dec: 16.509, dist: 65.3,
    spectral: 'K5III', lum: 'III',
    facts: { 'Distance': '65.3 ly', 'Spectral type': 'K5III orange giant', 'Notable': 'The "eye of the bull" in Taurus' },
    highlights: ['The primary star of Taurus, like the bull’s red eye', 'An orange giant about 44× the Sun’s diameter', 'A specimen of late stellar evolution'],
    blurb: 'Aldebaran is the red "eye of the bull" in Taurus, a swelling orange giant that shows what a Sun-like star looks like heading into old age.',
    mechanics: {
      orbit: 'Placed from RA = 4.60 h, Dec = +16.51°, distance = 65.3 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec).',
      gValue: 'Surface gravity g ≈ 0.16 m/s² (about 0.017 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 1.16 M☉, R ≈ 44 R☉ → g ≈ 0.16 m/s².'
    }
  },
  {
    key: 'betelgeuse', nameZh: 'Betelgeuse', nameEn: 'Betelgeuse', ra: 5.9195, dec: 7.407, dist: 548,
    spectral: 'M1-2Ia', lum: 'I',
    facts: { 'Distance': '~548 ly', 'Spectral type': 'M1-2 Ia red supergiant', 'Diameter': '~700× the Sun' },
    highlights: [
      '⭐ The red supergiant of Orion; placed at the Sun it would swallow Mars’s orbit',
      'Brightness varies irregularly; it dimmed mysteriously and dramatically in 2019',
      'Near the end of its life — on astronomical timescales it will explode as a supernova',
      'When it explodes it will be visible in daylight — the most-watched supernova candidate'
    ],
    blurb: 'Betelgeuse is the red supergiant on Orion’s shoulder, so vast it could contain the entire inner Solar System. Nearing death, it could erupt into a spectacular supernova at any time.',
    mechanics: {
      orbit: 'Placed from RA = 5.92 h, Dec = +7.41°, distance ≈ 548 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec). Its distance is uncertain by ~20%, so its radial position on the map is the least certain of these stars.',
      gValue: 'Surface gravity g ≈ 0.008 m/s² (about 0.0008 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 16.5 M☉, R ≈ 760 R☉ → g ≈ 0.008 m/s². A supergiant so vast its outer layers are barely bound — the surface gravity is almost negligible.'
    }
  },
  {
    key: 'antares', nameZh: 'Antares', nameEn: 'Antares', ra: 16.49, dec: -26.432, dist: 604,
    spectral: 'M1.5Iab', lum: 'I',
    facts: { 'Distance': '~604 ly', 'Spectral type': 'M1.5 Iab red supergiant', 'Notable': 'The heart of the Scorpion' },
    highlights: ['The red heart of Scorpius; its name means "rival of Mars"', 'A red supergiant about 700× the Sun’s diameter', 'Also a future supernova candidate'],
    blurb: 'Antares is the red supergiant at the heart of Scorpius, fiery red in color — the ancients called it the "rival of Mars." Like Betelgeuse, it is on the brink of a supernova.',
    mechanics: {
      orbit: 'Placed from RA = 16.49 h, Dec = −26.43°, distance ≈ 604 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec).',
      gValue: 'Surface gravity g ≈ 0.007 m/s² (about 0.0007 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 12 M☉, R ≈ 680 R☉ → g ≈ 0.007 m/s². Like Betelgeuse, a bloated supergiant with a vanishingly weak surface pull.'
    }
  },
  {
    key: 'rigel', nameZh: 'Rigel', nameEn: 'Rigel', ra: 5.2422, dec: -8.202, dist: 863,
    spectral: 'B8Ia', lum: 'I',
    facts: { 'Distance': '~863 ly', 'Spectral type': 'B8 Ia blue supergiant', 'Luminosity': '~120,000× the Sun' },
    highlights: ['The brightest star in Orion, a scorching blue supergiant', 'Intrinsically ~120,000× as luminous as the Sun', 'Balances the red Betelgeuse across Orion'],
    blurb: 'Rigel is the searing blue supergiant at Orion’s foot, intrinsically tens of thousands of times brighter than the Sun. With the red supergiant Betelgeuse diagonally opposite, it forms Orion’s hot-and-cold poles.',
    mechanics: {
      orbit: 'Placed from RA = 5.24 h, Dec = −8.20°, distance ≈ 863 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec). It is the most distant star in this map, so it defines its outer edge.',
      gValue: 'Surface gravity g ≈ 0.9 m/s² (about 0.09 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 21 M☉, R ≈ 79 R☉ → g ≈ 0.9 m/s². A blue supergiant is more compact than the red supergiants, so its gravity is far higher than theirs — though still below Earth’s.'
    }
  }
];

// Equatorial coordinates (RA, Dec, dist) → Cartesian coordinates (light-years)
export function starPositionLy(star) {
  const ra = star.ra * 15 * Math.PI / 180;   // hours → degrees → radians
  const dec = star.dec * Math.PI / 180;
  return {
    x: star.dist * Math.cos(dec) * Math.cos(ra),
    y: star.dist * Math.cos(dec) * Math.sin(ra),
    z: star.dist * Math.sin(dec)
  };
}

// Attach color and display size to a star (for the render layer)
export function starVisual(star) {
  const cls = star.spectral[0];
  const color = SPECTRAL_COLOR[cls] || 0xffffff;
  const size = LUM_SIZE[star.lum] || 0.4;
  return { color, size };
}
