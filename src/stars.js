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
  },
  {
    key: 'wolf359', nameZh: 'Wolf 359', nameEn: 'Wolf 359', ra: 10.9426, dec: 7.0272, dist: 7.86,
    spectral: 'M6.5Ve', lum: 'V',
    facts: { 'Distance': '7.86 ly', 'Spectral type': 'M6.5Ve red dwarf', 'Notable': 'One of the least luminous known stars' },
    highlights: [
      'One of the closest stars to the Sun (in Leo)',
      'A tiny red dwarf so faint you would need a telescope to see it despite its nearness',
      'An active flare star that brightens suddenly and often',
      'Famous in science fiction as a Star Trek battle site'
    ],
    blurb: 'Wolf 359 is a dim, cool red dwarf and one of the Sun’s nearest neighbors. Barely one ten-thousandth the Sun’s luminosity, it is a textbook example of how faint the most common stars in the galaxy really are.',
    mechanics: {
      orbit: 'Placed from RA = 10.94 h, Dec = +7.03°, distance = 7.86 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec). It sits among the innermost points of the map as one of the Sun’s closest neighbors.',
      gValue: 'Surface gravity g ≈ 1450 m/s² (about 148 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 0.11 M☉, R ≈ 0.144 R☉ → g ≈ 1450 m/s². A very small, dense red dwarf, so its surface gravity is enormous.'
    }
  },
  {
    key: 'lalande21185', nameZh: 'Lalande 21185', nameEn: 'Lalande 21185', ra: 11.0557, dec: 35.9815, dist: 8.30,
    spectral: 'M2V', lum: 'V',
    facts: { 'Distance': '8.30 ly', 'Spectral type': 'M2V red dwarf', 'Notable': 'Brightest red dwarf in the northern sky' },
    highlights: [
      'One of the nearest stars, in Ursa Major',
      'The brightest red dwarf in the northern hemisphere — yet still too faint to see unaided',
      'Hosts at least two confirmed planets detected by its tiny wobble',
      'An old, calm star roughly 5–10 billion years old'
    ],
    blurb: 'Lalande 21185 is a quiet red dwarf and one of the closest stars to the Sun. Though the brightest red dwarf in the northern sky, it is invisible to the naked eye, and it is now known to host its own small planetary system.',
    mechanics: {
      orbit: 'Placed from RA = 11.06 h, Dec = +35.98°, distance = 8.30 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec). Its large proper motion means its RA/Dec drift measurably over decades; this is a J2000 snapshot.',
      gValue: 'Surface gravity g ≈ 700 m/s² (about 72 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 0.39 M☉, R ≈ 0.39 R☉ → g ≈ 700 m/s².'
    }
  },
  {
    key: 'epsiloneridani', nameZh: 'Epsilon Eridani', nameEn: 'Epsilon Eridani', ra: 3.5488, dec: -9.4583, dist: 10.48,
    spectral: 'K2V', lum: 'V',
    facts: { 'Distance': '10.48 ly', 'Spectral type': 'K2V orange dwarf', 'Notable': 'Nearby young star with a planet and dust disks' },
    highlights: [
      'One of the closest single stars that resemble a young Sun',
      'Hosts a confirmed giant planet (Epsilon Eridani b)',
      'Encircled by dust disks, hinting at a whole planet-forming system',
      'A classic target in the search for other Earths and for SETI listening'
    ],
    blurb: 'Epsilon Eridani is a nearby orange dwarf only a fraction of the Sun’s age, wrapped in rings of dust and hosting at least one giant planet. Its youth and proximity make it a favorite laboratory for studying planetary systems in the making.',
    mechanics: {
      orbit: 'Placed from RA = 3.55 h, Dec = −9.46°, distance = 10.48 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec).',
      gValue: 'Surface gravity g ≈ 416 m/s² (about 42 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 0.82 M☉, R ≈ 0.735 R☉ → g ≈ 416 m/s². A slightly smaller, denser cousin of the Sun, so its gravity is a bit higher.'
    }
  },
  {
    key: 'sixtyonecygni', nameZh: '61 Cygni A', nameEn: '61 Cygni A', ra: 21.1141, dec: 38.7415, dist: 11.4,
    spectral: 'K5V', lum: 'V',
    facts: { 'Distance': '11.4 ly', 'Spectral type': 'K5V orange dwarf', 'Notable': 'First star to have its distance measured' },
    highlights: [
      'The "Flying Star" — noticed centuries ago for its swift motion across the sky',
      'The first star ever to have its distance measured by parallax (Bessel, 1838)',
      'A wide double of two orange dwarfs orbiting each other',
      'A milestone that proved the stars are suns at vast, measurable distances'
    ],
    blurb: '61 Cygni A is one half of a nearby pair of orange dwarfs in the Swan. In 1838 it became the first star whose distance was measured, a breakthrough that finally gave humanity a true scale for the universe.',
    mechanics: {
      orbit: 'Placed from RA = 21.11 h, Dec = +38.74°, distance = 11.4 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec). Its famously high proper motion shifts its coordinates over the years; this is a J2000 snapshot.',
      gValue: 'Surface gravity g ≈ 370 m/s² (about 38 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 0.70 M☉, R ≈ 0.72 R☉ → g ≈ 370 m/s².'
    }
  },
  {
    key: 'epsilonindi', nameZh: 'Epsilon Indi', nameEn: 'Epsilon Indi', ra: 22.0560, dec: -56.7860, dist: 11.87,
    spectral: 'K5V', lum: 'V',
    facts: { 'Distance': '11.87 ly', 'Spectral type': 'K5V orange dwarf', 'Notable': 'Has brown-dwarf companions and a planet' },
    highlights: [
      'A nearby orange dwarf in the southern constellation Indus',
      'Orbited by two brown dwarfs — "failed stars" too small to shine like the Sun',
      'Hosts a giant planet, Epsilon Indi Ab, one of the nearest imaged exoplanets',
      'An old, fast-moving star speeding through the solar neighborhood'
    ],
    blurb: 'Epsilon Indi is a close orange dwarf with an unusual retinue: a pair of brown-dwarf companions and a confirmed giant planet. Its nearness makes that planet one of the most accessible targets for direct imaging.',
    mechanics: {
      orbit: 'Placed from RA = 22.06 h, Dec = −56.79°, distance = 11.87 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec). Its high proper motion drifts these coordinates over decades; this is a J2000 snapshot.',
      gValue: 'Surface gravity g ≈ 421 m/s² (about 43 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 0.78 M☉, R ≈ 0.71 R☉ → g ≈ 421 m/s².'
    }
  },
  {
    key: 'capella', nameZh: 'Capella', nameEn: 'Capella', ra: 5.2782, dec: 45.9981, dist: 42.9,
    spectral: 'G5III', lum: 'III',
    facts: { 'Distance': '42.9 ly', 'Spectral type': 'G5III yellow giant', 'Notable': 'Two giant stars in a close pair' },
    highlights: [
      'The brightest star in Auriga and sixth-brightest in the night sky',
      'Actually two yellow giant stars orbiting closely — plus a distant red-dwarf pair',
      'The nearest bright star with the Sun’s yellow color, but far larger',
      'A brilliant beacon high overhead on northern winter evenings'
    ],
    blurb: 'Capella is the golden "goat star" of Auriga, one of the brightest stars in the sky. Though it looks single, it is a system of two yellow giants — each far larger than the Sun — locked in a tight mutual orbit.',
    mechanics: {
      orbit: 'Placed from RA = 5.28 h, Dec = +46.00°, distance = 42.9 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec). Coordinates track the bright giant pair, whose two stars orbit too close to separate at this scale.',
      gValue: 'Surface gravity g ≈ 4.95 m/s² (about 0.5 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 2.69 M☉, R ≈ 12.2 R☉ → g ≈ 4.95 m/s². As a swollen giant its surface gravity is only about half of Earth’s despite its large mass.'
    }
  },
  {
    key: 'castor', nameZh: 'Castor', nameEn: 'Castor', ra: 7.5767, dec: 31.8883, dist: 51.5,
    spectral: 'A1V', lum: 'V',
    facts: { 'Distance': '51.5 ly', 'Spectral type': 'A1V white star', 'Notable': 'A system of six stars' },
    highlights: [
      'One of the "twins" of Gemini, paired with Pollux',
      'Really a system of six stars bound together — three close binaries',
      'A hot, white main-sequence star brighter and larger than the Sun',
      'A classic first target for small telescopes, splitting into a lovely double'
    ],
    blurb: 'Castor is one of the twin stars of Gemini. To the eye it is a single blue-white star, but it is actually a remarkable family of six stars in three orbiting pairs — one of the most complex bright systems in the sky.',
    mechanics: {
      orbit: 'Placed from RA = 7.58 h, Dec = +31.89°, distance = 51.5 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec). Coordinates track the bright A-star; the other five members are unresolved at this scale.',
      gValue: 'Surface gravity g ≈ 114 m/s² (about 12 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 2.2 M☉, R ≈ 2.3 R☉ → g ≈ 114 m/s².'
    }
  },
  {
    key: 'regulus', nameZh: 'Regulus', nameEn: 'Regulus', ra: 10.1395, dec: 11.9672, dist: 79,
    spectral: 'B8IVn', lum: 'IV',
    facts: { 'Distance': '79 ly', 'Spectral type': 'B8 subgiant (blue-white)', 'Notable': 'Spins so fast it is egg-shaped' },
    highlights: [
      'The brightest star in Leo, marking the lion’s heart',
      'A hot blue-white star spinning near break-up speed, flattened into an egg shape',
      'Sits almost exactly on the ecliptic, so the Moon and planets often pass close by',
      'One of the four "royal stars" of ancient Persian astronomy'
    ],
    blurb: 'Regulus is the blue-white heart of Leo, a hot star whirling so fast it bulges at its equator into an egg shape. Lying nearly on the ecliptic, it is frequently visited by the Moon and planets.',
    mechanics: {
      orbit: 'Placed from RA = 10.14 h, Dec = +11.97°, distance = 79 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec). Its extreme rotation makes it oblate, so the radius below is an equatorial-average value.',
      gValue: 'Surface gravity g ≈ 109 m/s² (about 11 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 3.8 M☉, R ≈ 3.09 R☉ → g ≈ 109 m/s².'
    }
  },
  {
    key: 'algol', nameZh: 'Algol', nameEn: 'Algol', ra: 3.1361, dec: 40.9556, dist: 90,
    spectral: 'B8V', lum: 'V',
    facts: { 'Distance': '90 ly', 'Spectral type': 'B8V blue-white star', 'Notable': 'The prototype eclipsing variable' },
    highlights: [
      'The "Demon Star" of Perseus, marking the head of Medusa',
      'Visibly dims every 2.87 days as a companion passes in front of it',
      'The prototype of the "Algol" class of eclipsing binary stars',
      'Its winking was likely noticed by ancient sky-watchers, earning its ominous name'
    ],
    blurb: 'Algol is the famous "Demon Star" in Perseus, whose brightness dips like clockwork every few days as a fainter companion eclipses it. It gave its name to a whole class of eclipsing binaries and is one of the sky’s most-watched variable stars.',
    mechanics: {
      orbit: 'Placed from RA = 3.14 h, Dec = +40.96°, distance = 90 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec). Coordinates track the bright primary; the eclipsing companion orbits too close to separate at this scale.',
      gValue: 'Surface gravity g ≈ 117 m/s² (about 12 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 3.17 M☉, R ≈ 2.73 R☉ → g ≈ 117 m/s².'
    }
  },
  {
    key: 'spica', nameZh: 'Spica', nameEn: 'Spica', ra: 13.4199, dec: -11.1614, dist: 250,
    spectral: 'B1V', lum: 'IV',
    facts: { 'Distance': '~250 ly', 'Spectral type': 'B1 blue giant', 'Notable': 'A close, egg-shaped binary' },
    highlights: [
      'The brightest star in Virgo, a brilliant blue beacon',
      'Two hot, massive stars so close they orbit each other in just four days',
      'Their gravity distorts each other into egg shapes',
      'Intrinsically thousands of times more luminous than the Sun'
    ],
    blurb: 'Spica is the blue-white jewel of Virgo, in truth a pair of hot, massive stars whirling around each other every four days. So close that mutual gravity pulls them into egg shapes, together they blaze thousands of times brighter than the Sun.',
    mechanics: {
      orbit: 'Placed from RA = 13.42 h, Dec = −11.16°, distance ≈ 250 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec). Coordinates track the bright primary; its close companion is unresolved at this scale.',
      gValue: 'Surface gravity g ≈ 51 m/s² (about 5 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 10.3 M☉, R ≈ 7.4 R☉ → g ≈ 51 m/s².'
    }
  },
  {
    key: 'polaris', nameZh: 'Polaris', nameEn: 'Polaris', ra: 2.5303, dec: 89.2641, dist: 433,
    spectral: 'F7Ib', lum: 'I',
    facts: { 'Distance': '~433 ly', 'Spectral type': 'F7Ib yellow supergiant', 'Notable': 'The current North Star' },
    highlights: [
      '⭐ The North Star — it sits almost exactly above Earth’s north pole',
      'A yellow supergiant many times the Sun’s size, not an especially bright star intrinsically',
      'A pulsating Cepheid variable, slowly changing its brightness',
      'Will yield the "pole star" title to other stars as Earth’s axis slowly precesses'
    ],
    blurb: 'Polaris is the North Star, poised almost directly over Earth’s pole so that it barely moves as the sky turns — a natural compass for navigators for millennia. Physically it is a yellow supergiant and a pulsating Cepheid, far grander than it looks.',
    mechanics: {
      orbit: 'Placed from RA = 2.53 h, Dec = +89.26°, distance ≈ 433 ly via x = d·cos(Dec)·cos(RA), y = d·cos(Dec)·sin(RA), z = d·sin(Dec). Its declination of nearly +90° places it almost straight along the map’s polar (z) axis, mirroring how it sits over Earth’s north pole.',
      gValue: 'Surface gravity g ≈ 1.0 m/s² (about 0.1 × Earth)',
      gMethod: 'g = g☉ · (M/M☉)/(R/R☉)² with g☉ = 274 m/s². Here M ≈ 5.13 M☉, R ≈ 37.5 R☉ → g ≈ 1.0 m/s². As a bloated supergiant, its surface gravity is only about a tenth of Earth’s despite its large mass.'
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
