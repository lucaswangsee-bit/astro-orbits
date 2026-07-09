// ============================================================================
//  bodies.js — physical data and "notable features" of celestial bodies
// ----------------------------------------------------------------------------
//  This is a pure data layer, fully decoupled from rendering.
//  To add stars / galaxies later, just extend the data structures here.
//
//  Field reference:
//   nameZh / nameEn  localized names (kept as fields; both hold English now)
//   type             type (star / planet / moon …)
//   color            render color
//   displaySize      display radius in the scene (exaggerated for visibility, not to scale)
//   spinHours        rotation period (hours; negative means retrograde rotation)
//   rings            whether it has prominent rings
//   facts            key data (shown in the info panel)
//   highlights       list of "notable features" — the core content of this project
//   blurb            a one-paragraph overview
// ============================================================================

export const SUN = {
  key: 'sun', nameZh: 'Sun', nameEn: 'Sun', type: 'star',
  color: 0xffcc33, displaySize: 2.0, spinHours: 609.12, texture: 'assets/textures/2k_sun.jpg',
  facts: {
    'Type': 'G2V yellow dwarf',
    'Diameter': '1,392,700 km (~109 Earths)',
    'Surface temp.': '~5,500 °C',
    'Core temp.': '~15 million °C',
    'Mass share': '99.86% of the Solar System',
    'Age': '~4.6 billion years'
  },
  highlights: [
    'The only star in the Solar System; powered by hydrogen fusing into helium in its core',
    'Its gravity dominates the whole system — every planet orbits it',
    'Light takes about 8 min 20 s to reach Earth',
    'Has sunspots, flares and coronal mass ejections on an ~11-year activity cycle'
  ],
  blurb: 'The Sun is a G-type yellow dwarf and the gravitational anchor of the Solar System, holding 99.86% of its total mass. Hydrogen fusion in its core supplies virtually all the energy that sustains life on Earth, and its gravity governs every planetary orbit.',
  mechanics: {
    orbit: 'The Sun sits at the Solar System’s barycenter, so it does not orbit anything inside the system — instead every planet position in this simulation is computed relative to it (it is fixed at the origin). On a far larger scale it does orbit the center of the Milky Way, one lap every ~230 million years at about 220 km/s.',
    massKg: 1.989e30, radiusM: 6.96e8,
    gValue: 'Surface gravity g ≈ 274 m/s² (about 28 × Earth)',
    gCalc: String.raw`g = \dfrac{GM}{R^2} = \dfrac{(6.674\times10^{-11}\,\mathrm{N\cdot m^2/kg^2})(1.989\times10^{30}\,\mathrm{kg})}{(6.96\times10^{8}\,\mathrm{m})^2} \approx 274\,\mathrm{m/s^2}`,
    gNote: 'Using the Sun’s mass and photospheric radius.'
  }
};

// Planet keys must match the ELEMENTS in kepler.js
export const PLANETS = [
  {
    key: 'mercury', nameZh: 'Mercury', nameEn: 'Mercury', type: 'planet',
    color: 0x9c8a7a, displaySize: 0.16, spinHours: 1407.6, rings: false, texture: 'assets/textures/2k_mercury.jpg',
    facts: {
      'Semi-major axis': '0.387 AU (~57.9 million km)',
      'Orbital period': '88 days',
      'Rotation period': '58.6 days',
      'Diameter': '4,879 km',
      'Moons': '0',
      'Surface temp. range': '-173 °C to 427 °C'
    },
    highlights: [
      'Closest to the Sun and the fastest-orbiting planet',
      'Almost no atmosphere; among the most extreme day-night temperature swings in the Solar System',
      'High orbital eccentricity (0.206) gives it a markedly elliptical orbit',
      'Surface is covered in craters, much like the Moon'
    ],
    blurb: 'Mercury is the innermost and smallest planet. With almost no atmosphere to trap or redistribute heat, its surface ranges from about 430 °C in daylight to −170 °C at night — one of the most extreme day–night temperature swings of any planet.',
    mechanics: {
      orbit: String.raw`Position comes from the JPL J2000 Keplerian elements (a = 0.387 AU, e = 0.206). Each frame the six elements are propagated to the date, the mean anomaly \(M = L - \varpi\) is formed, and Kepler’s equation \(M = E - e\sin E\) is solved for the eccentric anomaly E by Newton iteration; then \(r = a(1 - e\cos E)\). Its large eccentricity makes the ellipse the most pronounced of any planet, and its perihelion precesses an extra 43″ per century beyond Newton — a famous confirmation of general relativity.`,
      massKg: 3.30e23, radiusM: 2.44e6, albedo: 0.068,
      gValue: 'Surface gravity g ≈ 3.70 m/s² (about 0.38 g)',
      gCalc: String.raw`g = \dfrac{GM}{R^2} = \dfrac{(6.674\times10^{-11}\,\mathrm{N\cdot m^2/kg^2})(3.30\times10^{23}\,\mathrm{kg})}{(2.44\times10^{6}\,\mathrm{m})^2} \approx 3.70\,\mathrm{m/s^2}`,
      gNote: 'Mass M and radius R of Mercury; G is the gravitational constant.'
    }
  },
  {
    key: 'venus', nameZh: 'Venus', nameEn: 'Venus', type: 'planet',
    color: 0xe8c07a, displaySize: 0.28, spinHours: -5832.5, rings: false, texture: 'assets/textures/2k_venus_surface.jpg',
    facts: {
      'Semi-major axis': '0.723 AU (~108 million km)',
      'Orbital period': '225 days',
      'Rotation period': '243 days (retrograde)',
      'Diameter': '12,104 km',
      'Moons': '0',
      'Surface temp.': '~465 °C'
    },
    highlights: [
      'The hottest planetary surface — a runaway greenhouse effect from a dense CO₂ atmosphere',
      'Rotates backward (retrograde) compared with other planets; the Sun rises in the west',
      'Surface pressure is over 90× Earth’s, under perpetual sulfuric-acid clouds',
      'Similar in size to Earth, earning it the name "Earth’s sister planet"'
    ],
    blurb: 'Venus is nearly Earth’s twin in size, yet a runaway greenhouse effect has made it the hottest planet in the Solar System: a dense carbon-dioxide atmosphere holds the surface near 465 °C — hot enough to melt lead — under a pressure more than 90 times Earth’s.',
    mechanics: {
      orbit: String.raw`The same JPL J2000 Kepler solver is used (a = 0.723 AU). With e = 0.0068 its orbit is the most nearly circular of any planet, so the eccentric anomaly E barely differs from the mean anomaly M and the Newton iteration of \(M = E - e\sin E\) converges almost immediately; \(r = a(1 - e\cos E)\) stays very close to a throughout.`,
      massKg: 4.87e24, radiusM: 6.05e6, albedo: 0.77,
      gValue: 'Surface gravity g ≈ 8.87 m/s² (about 0.90 g)',
      gCalc: String.raw`g = \dfrac{GM}{R^2} = \dfrac{(6.674\times10^{-11}\,\mathrm{N\cdot m^2/kg^2})(4.87\times10^{24}\,\mathrm{kg})}{(6.05\times10^{6}\,\mathrm{m})^2} \approx 8.87\,\mathrm{m/s^2}`,
      gNote: 'Nearly Earth-like, because its mass and radius are close to Earth’s.'
    }
  },
  {
    key: 'earth', nameZh: 'Earth', nameEn: 'Earth', type: 'planet',
    color: 0x3d8bd4, displaySize: 0.30, spinHours: 23.934, rings: false, texture: 'assets/textures/2k_earth_daymap.jpg',
    facts: {
      'Semi-major axis': '1.000 AU (~149.6 million km)',
      'Orbital period': '365.25 days',
      'Rotation period': '23.93 hours',
      'Diameter': '12,742 km',
      'Moons': '1 (the Moon)',
      'Mean temp.': '~15 °C',
      'Orbital eccentricity': '0.0167 (near-circular)'
    },
    highlights: [
      '⭐ The only place in the known universe with life',
      'About 71% of the surface is liquid water — it sits in the "habitable zone" where liquid water can exist',
      'Oxygen-nitrogen atmosphere (78% N, 21% O), with an ozone layer that blocks UV',
      'A strong magnetic field deflects the solar wind and keeps the atmosphere from being stripped away',
      'Tectonically active — the only body known to have plate tectonics',
      'A relatively large moon stabilizes its axial tilt, keeping the climate stable over the long term'
    ],
    blurb: 'Earth is our home and the only body confirmed to harbor life. Liquid water, a breathable atmosphere, a stable magnetic field, and just the right distance from the Sun together make this blue planet uniquely habitable.',
    mechanics: {
      orbit: String.raw`Solved from the JPL J2000 elements (a ≡ 1.000 AU, e = 0.0167), the orbit that defines the astronomical unit itself. Kepler’s equation \(M = E - e\sin E\) is solved by Newton iteration, then in-plane coordinates \(x = a(\cos E - e),\ y = a\sqrt{1-e^2}\,\sin E\) are rotated into the J2000 ecliptic frame. The small eccentricity is why the seasons differ slightly in length (perihelion falls in early January).`,
      massKg: 5.97e24, radiusM: 6.371e6, albedo: 0.306,
      gValue: 'Surface gravity g ≈ 9.81 m/s² (1 g, the reference)',
      gCalc: String.raw`g = \dfrac{GM}{R^2} = \dfrac{(6.674\times10^{-11}\,\mathrm{N\cdot m^2/kg^2})(5.97\times10^{24}\,\mathrm{kg})}{(6.371\times10^{6}\,\mathrm{m})^2} \approx 9.81\,\mathrm{m/s^2}`,
      gNote: 'The standard against which every other value here is compared.'
    }
  },
  {
    key: 'mars', nameZh: 'Mars', nameEn: 'Mars', type: 'planet',
    color: 0xc1440e, displaySize: 0.20, spinHours: 24.623, rings: false, texture: 'assets/textures/2k_mars.jpg',
    facts: {
      'Semi-major axis': '1.524 AU (~228 million km)',
      'Orbital period': '687 days',
      'Rotation period': '24.6 hours',
      'Diameter': '6,779 km',
      'Moons': '2 (Phobos, Deimos)',
      'Mean temp.': '~-63 °C'
    },
    highlights: [
      'Its red color comes from iron oxide (rust) covering the surface',
      'Home to the tallest volcano in the Solar System — Olympus Mons (~22 km high)',
      'Dry riverbeds and polar caps are evidence of ancient liquid water',
      'Its day length is strikingly close to Earth’s (~24.6 hours)',
      'The prime target for current exploration and future crewed landings'
    ],
    blurb: 'Mars is a cold, dry red desert world, yet geologically the most Earth-like of the planets. Ancient valleys and subsurface ice make it the top candidate for finding past life and for future settlement.',
    mechanics: {
      orbit: String.raw`Solved from the JPL J2000 elements (a = 1.524 AU, e = 0.0934). It was Mars’s comparatively large eccentricity that let Kepler deduce, from Tycho Brahe’s data, that orbits are ellipses rather than circles — the very relation \(M = E - e\sin E\) this simulation solves each frame to place the planet.`,
      massKg: 6.42e23, radiusM: 3.39e6, albedo: 0.25,
      gValue: 'Surface gravity g ≈ 3.72 m/s² (about 0.38 g)',
      gCalc: String.raw`g = \dfrac{GM}{R^2} = \dfrac{(6.674\times10^{-11}\,\mathrm{N\cdot m^2/kg^2})(6.42\times10^{23}\,\mathrm{kg})}{(3.39\times10^{6}\,\mathrm{m})^2} \approx 3.72\,\mathrm{m/s^2}`,
      gNote: 'Despite Mars being larger than Mercury, their surface gravities are nearly identical.'
    }
  },
  {
    key: 'jupiter', nameZh: 'Jupiter', nameEn: 'Jupiter', type: 'planet',
    color: 0xd8a878, displaySize: 1.15, spinHours: 9.925, rings: true, texture: 'assets/textures/2k_jupiter.jpg',
    facts: {
      'Semi-major axis': '5.203 AU (~778 million km)',
      'Orbital period': '11.86 years',
      'Rotation period': '9.9 hours (fastest)',
      'Diameter': '139,820 km',
      'Moons': '95+',
      'Composition': 'Mainly hydrogen and helium'
    },
    highlights: [
      'The largest planet — over 1,300 Earths could fit inside',
      'The Great Red Spot is a giant storm lasting centuries, larger than Earth',
      'Rotates fastest of all — a day under 10 hours flings it into an oblate shape',
      'Its powerful gravity acts as a "Solar System vacuum cleaner," shielding inner planets from many comet impacts',
      'Its Galilean moon Europa may hide an ocean beneath its ice'
    ],
    blurb: 'Jupiter is a gas giant more massive than all the other planets combined. Its Great Red Spot — a storm wider than Earth — has churned for centuries, and its family of 95+ moons resembles a miniature solar system of its own.',
    mechanics: {
      orbit: String.raw`Solved from the JPL J2000 elements (a = 5.203 AU). Its period follows Kepler’s third law \(T = \sqrt{a^3}\) ≈ 11.86 yr; each frame the eccentric anomaly E is found from Kepler’s equation and the in-plane position is rotated into the J2000 ecliptic. Being by far the most massive planet, Jupiter also perturbs every other orbit — a correction the per-century element rates partly absorb.`,
      massKg: 1.898e27, radiusM: 7.149e7, albedo: 0.503,
      gValue: 'Surface gravity g ≈ 24.79 m/s² (about 2.53 g, at the 1-bar cloud tops)',
      gCalc: String.raw`g = \dfrac{GM}{R^2} = \dfrac{(6.674\times10^{-11}\,\mathrm{N\cdot m^2/kg^2})(1.898\times10^{27}\,\mathrm{kg})}{(7.149\times10^{7}\,\mathrm{m})^2} \approx 24.79\,\mathrm{m/s^2}`,
      gNote: 'Uses the equatorial (1-bar) radius; there is no solid surface to stand on.'
    }
  },
  {
    key: 'saturn', nameZh: 'Saturn', nameEn: 'Saturn', type: 'planet',
    color: 0xe3d29a, displaySize: 1.0, spinHours: 10.656, rings: true, texture: 'assets/textures/2k_saturn.jpg', ringTexture: 'assets/textures/2k_saturn_ring_alpha.png',
    facts: {
      'Semi-major axis': '9.537 AU (~1.43 billion km)',
      'Orbital period': '29.45 years',
      'Rotation period': '10.7 hours',
      'Diameter': '116,460 km',
      'Moons': '140+',
      'Mean density': '0.69 g/cm³ (lighter than water)'
    },
    highlights: [
      'Has the most spectacular ring system, made of countless ice particles and rocky chunks',
      'Less dense than water — in theory it could "float" in a large enough ocean',
      'Its largest moon Titan has a thick atmosphere and liquid-methane lakes',
      'Its moon Enceladus vents water plumes from a subsurface ocean'
    ],
    blurb: 'Saturn is famed for its bright ring system, made of countless particles of ice and rock. Its largest moon, Titan, has a thick atmosphere and lakes of liquid methane, making it a key target in the study of the chemistry that precedes life.',
    mechanics: {
      orbit: String.raw`Solved from the JPL J2000 elements (a = 9.537 AU); Kepler’s third law gives \(T = \sqrt{a^3}\) ≈ 29.4 yr. Because its semi-major axis drifts measurably, the elements carry a per-century rate that is applied before Kepler’s equation \(M = E - e\sin E\) is solved — the same Newton iteration used for every planet.`,
      massKg: 5.683e26, radiusM: 6.027e7, albedo: 0.342,
      gValue: 'Surface gravity g ≈ 10.44 m/s² (about 1.06 g, at the 1-bar level)',
      gCalc: String.raw`g = \dfrac{GM}{R^2} = \dfrac{(6.674\times10^{-11}\,\mathrm{N\cdot m^2/kg^2})(5.683\times10^{26}\,\mathrm{kg})}{(6.027\times10^{7}\,\mathrm{m})^2} \approx 10.44\,\mathrm{m/s^2}`,
      gNote: 'Barely above Earth’s despite Saturn’s enormous size, because its density is less than water.'
    }
  },
  {
    key: 'uranus', nameZh: 'Uranus', nameEn: 'Uranus', type: 'planet',
    color: 0x9fe3e0, displaySize: 0.6, spinHours: -17.24, rings: true, texture: 'assets/textures/2k_uranus.jpg',
    facts: {
      'Semi-major axis': '19.19 AU (~2.87 billion km)',
      'Orbital period': '84 years',
      'Rotation period': '17.2 hours (tilted on its side, retrograde)',
      'Diameter': '50,724 km',
      'Moons': '27+',
      'Mean temp.': '~-195 °C'
    },
    highlights: [
      'Rotates "on its side" — its axis is nearly parallel to its orbital plane (~98° tilt)',
      'Methane in its atmosphere absorbs red light, giving it a cyan-blue hue',
      'Classed as an "ice giant," rich in water, ammonia and methane ices',
      'Extreme seasons: each pole gets ~42 years of continuous daylight, then ~42 years of night'
    ],
    blurb: 'Uranus is an ice giant that rolls along on its side. Its unique axial tilt gives it the most extreme seasons in the Solar System, and its cyan-blue color comes from atmospheric methane.',
    mechanics: {
      orbit: String.raw`Solved from the JPL J2000 elements (a = 19.19 AU); Kepler’s third law gives \(T = \sqrt{a^3}\) ≈ 84 yr. Discovered telescopically in 1781, its computed position stubbornly disagreed with observation — small residuals that betrayed an eighth planet tugging on it, and led directly to the discovery of Neptune.`,
      massKg: 8.681e25, radiusM: 2.556e7, albedo: 0.300,
      gValue: 'Surface gravity g ≈ 8.87 m/s² (about 0.90 g, at the 1-bar level)',
      gCalc: String.raw`g = \dfrac{GM}{R^2} = \dfrac{(6.674\times10^{-11}\,\mathrm{N\cdot m^2/kg^2})(8.681\times10^{25}\,\mathrm{kg})}{(2.556\times10^{7}\,\mathrm{m})^2} \approx 8.87\,\mathrm{m/s^2}`,
      gNote: 'Coincidentally almost the same as Venus, though Uranus is far larger and less dense.'
    }
  },
  {
    key: 'neptune', nameZh: 'Neptune', nameEn: 'Neptune', type: 'planet',
    color: 0x3f66d4, displaySize: 0.58, spinHours: 16.11, rings: true, texture: 'assets/textures/2k_neptune.jpg',
    facts: {
      'Semi-major axis': '30.07 AU (~4.5 billion km)',
      'Orbital period': '164.8 years',
      'Rotation period': '16.1 hours',
      'Diameter': '49,244 km',
      'Moons': '14+',
      'Mean temp.': '~-200 °C'
    },
    highlights: [
      'The farthest planet from the Sun and the last of the major planets',
      'Winds reach up to 2,000 km/h — the strongest in the Solar System',
      'Predicted by mathematics before it was ever observed (from perturbations in Uranus’s orbit)',
      'Its deep-blue color also comes from methane; its largest moon, Triton, orbits in retrograde'
    ],
    blurb: 'Neptune is the most distant major planet, a deep-blue, storm-lashed frozen world. It was the first planet humans "calculated" mathematically before finding it with a telescope.',
    mechanics: {
      orbit: String.raw`Solved from the JPL J2000 elements (a = 30.07 AU); Kepler’s third law gives \(T = \sqrt{a^3}\) ≈ 165 yr. Neptune was found by running this logic backwards: the unexplained perturbations in Uranus’s orbit were fed into Newtonian gravity to predict where an unseen planet must be — and in 1846 it was spotted within a degree of the prediction.`,
      massKg: 1.024e26, radiusM: 2.476e7, albedo: 0.290,
      gValue: 'Surface gravity g ≈ 11.15 m/s² (about 1.14 g, at the 1-bar level)',
      gCalc: String.raw`g = \dfrac{GM}{R^2} = \dfrac{(6.674\times10^{-11}\,\mathrm{N\cdot m^2/kg^2})(1.024\times10^{26}\,\mathrm{kg})}{(2.476\times10^{7}\,\mathrm{m})^2} \approx 11.15\,\mathrm{m/s^2}`,
      gNote: 'The strongest surface gravity of any planet except Jupiter.'
    }
  }
];

// The Moon (Earth’s satellite; handled specially — orbits Earth, not the Sun)
export const MOON = {
  key: 'moon', nameZh: 'Moon', nameEn: 'Moon', type: 'moon',
  color: 0xbfbfbf, displaySize: 0.09, spinHours: 655.7, rings: false, texture: 'assets/textures/2k_moon.jpg',
  facts: {
    'Distance from Earth': '~384,400 km',
    'Orbital period': '27.32 days (sidereal month)',
    'Diameter': '3,474 km',
    'Surface gravity': '1/6 of Earth’s'
  },
  highlights: [
    'Earth’s only natural satellite; tidally locked — always shows the same face to Earth',
    'Its gravity drives Earth’s tides and stabilizes Earth’s axial tilt',
    'Its surface is covered in craters and "maria" — plains formed by ancient lava',
    'The only extraterrestrial body humans have set foot on (the Apollo program)'
  ],
  blurb: 'The Moon is Earth’s only natural satellite. It stabilizes Earth’s axial tilt, drives the ocean tides, and remains the only world beyond Earth that humans have set foot on.'
};

// ---------------------------------------------------------------------------
//  Comets — high-eccentricity bodies that grow a Sun-facing double tail near
//  perihelion. Elements use the comet-catalog convention (argp = argument of
//  perihelion ω directly), consumed by cometPosition() in kepler.js.
// ---------------------------------------------------------------------------
export const COMETS = [
  {
    key: 'halley', nameZh: 'Halley', nameEn: "1P/Halley", type: 'comet',
    color: 0x8ff0e0, displaySize: 0.12,
    a: 17.834, e: 0.96714, I: 162.262, argp: 111.332, node: 58.42,
    tperi: 2446470.96, period: 27510,   // last perihelion 1986-02-09, P ≈ 75.3 yr
    facts: {
      'Semi-major axis': '17.8 AU',
      'Eccentricity': '0.967 (highly elongated)',
      'Orbital period': '~75.3 years',
      'Perihelion': '0.586 AU (inside Venus)',
      'Aphelion': '35.1 AU (beyond Neptune)',
      'Next perihelion': '2061'
    },
    highlights: [
      'The most famous comet — visible from Earth roughly every 76 years',
      'Orbits retrograde (inclination 162°), opposite to the planets',
      'Its tail always points away from the Sun, pushed by the solar wind and radiation pressure',
      'Last seen in 1986; returns in 2061',
      'Recorded by humans for over 2,000 years'
    ],
    blurb: 'Halley is the best-known short-period comet, sweeping from inside Venus’s orbit out past Neptune every 75 years. Near the Sun its ices vaporize into a glowing coma and a long double tail that always streams anti-sunward.'
  },
  {
    key: 'encke', nameZh: 'Encke', nameEn: '2P/Encke', type: 'comet',
    color: 0xa8f0c0, displaySize: 0.10,
    a: 2.2155, e: 0.8483, I: 11.78, argp: 186.55, node: 334.57,
    tperi: 2460239.5, period: 1204,     // perihelion 2023-10-22, P ≈ 3.3 yr
    facts: {
      'Semi-major axis': '2.22 AU',
      'Eccentricity': '0.848',
      'Orbital period': '3.3 years (shortest of any bright comet)',
      'Perihelion': '0.336 AU',
      'Aphelion': '4.1 AU (past Mars)'
    },
    highlights: [
      'The shortest orbital period of any known bright comet — just 3.3 years',
      'Source of the Taurid meteor showers Earth passes through each year',
      'Its tail is faint because repeated close passes have depleted its ices'
    ],
    blurb: 'Encke has the shortest period of any well-known comet, looping the inner Solar System every 3.3 years. Countless passes near the Sun have worn it down, leaving a stream of debris that lights up as the Taurid meteor showers.'
  }
];

// Render order (inner to outer)
export const ALL_BODIES = [SUN, ...PLANETS, MOON];
