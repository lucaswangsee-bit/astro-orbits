// ============================================================================
//  interiors.js — the second layer of every world: what it is made of inside,
//  and what its air is made of. The visual layer shows the surface you would
//  see; this one shows the structure you would not.
// ----------------------------------------------------------------------------
//  `layers` runs OUTERMOST FIRST. `to` is the OUTER radius of that shell as a
//  fraction of the body's mean radius, so a layer spans from the `to` of the
//  next entry down to its own. Values come from seismology (Earth, Moon),
//  spacecraft gravity and magnetic data (Juno at Jupiter, Cassini at Saturn,
//  MESSENGER at Mercury, InSight at Mars, Dawn at Vesta/Ceres) and, for the
//  ice giants, interior models — those two are the least well constrained.
//
//  `air` is composition by VOLUME of the lower atmosphere (dry, for Earth).
// ============================================================================

export const INTERIORS = {
  sun: {
    radiusKm: 696340,
    layers: [
      { name: 'Convective zone', to: 1.00,  color: 0xffb038, note: 'Energy rides rising cells of plasma the last 30% of the way out' },
      { name: 'Radiative zone',  to: 0.70,  color: 0xff8c1a, note: 'Photons random-walk outward — a single one takes ~100,000 years' },
      { name: 'Core',            to: 0.25,  color: 0xfff6c9, note: 'Hydrogen fuses to helium at ~15 million K; the source of all of it' }
    ],
    air: [['Hydrogen', 73.8], ['Helium', 24.9], ['Oxygen', 0.8], ['Carbon', 0.3]],
    airNote: 'Composition by mass. The Sun is plasma throughout — it has no surface, only a photosphere where it turns transparent.',
    pressure: '~250 billion bar at the core'
  },

  mercury: {
    radiusKm: 2440,
    layers: [
      { name: 'Crust',  to: 1.000, color: 0x9c8f80, note: 'Ancient, heavily cratered silicate, ~35 km thick' },
      { name: 'Mantle', to: 0.986, color: 0x6f5f52, note: 'A surprisingly thin silicate shell — only ~400 km' },
      { name: 'Core',   to: 0.830, color: 0xffd27a, note: 'Iron core filling ~83% of the radius, partly molten — the largest core fraction of any planet' }
    ],
    air: [['Oxygen', 42], ['Sodium', 29], ['Hydrogen', 22], ['Helium', 6]],
    airNote: 'Not an atmosphere but an exosphere: atoms knocked off the surface by sunlight and the solar wind, so thin they never collide.',
    pressure: '~10⁻¹⁵ bar (essentially vacuum)'
  },

  venus: {
    radiusKm: 6052,
    layers: [
      { name: 'Crust',  to: 1.000, color: 0xd8c9a0, note: 'Basaltic, young — the whole surface was resurfaced ~500 Myr ago' },
      { name: 'Mantle', to: 0.993, color: 0xb0713a, note: 'Hot silicate rock, but with no plate tectonics to vent the heat' },
      { name: 'Core',   to: 0.529, color: 0xffc061, note: 'Iron–nickel, probably still liquid — yet Venus has no magnetic field, because it barely rotates' }
    ],
    air: [['Carbon dioxide', 96.5], ['Nitrogen', 3.5], ['Sulphur dioxide', 0.015]],
    airNote: 'A runaway greenhouse: 92 bar of mostly CO₂ holds the surface at ~464 °C, hot enough to melt lead — hotter than Mercury.',
    pressure: '92 bar at the surface'
  },

  earth: {
    radiusKm: 6371,
    layers: [
      { name: 'Crust',       to: 1.000, color: 0x7d9b5a, note: 'Only 5–70 km thick — proportionally thinner than an apple skin' },
      { name: 'Mantle',      to: 0.995, color: 0xc4622d, note: 'Solid silicate that creeps like putty over millions of years, driving plate tectonics' },
      { name: 'Outer core',  to: 0.546, color: 0xffa733, note: 'Liquid iron–nickel. Its churning is the geodynamo that makes the magnetic field' },
      { name: 'Inner core',  to: 0.191, color: 0xfff0a8, note: 'Solid iron–nickel at ~5,400 K — kept solid by 3.6 million bar of pressure' }
    ],
    air: [['Nitrogen', 78.08], ['Oxygen', 20.95], ['Argon', 0.93], ['Carbon dioxide', 0.04]],
    airNote: 'Dry air by volume. The free oxygen is biological — nothing else in the Solar System has it, which is why it is a biosignature.',
    pressure: '1.0 bar at sea level'
  },

  moon: {
    radiusKm: 1737,
    layers: [
      { name: 'Crust',      to: 1.000, color: 0xb9b4ad, note: 'Anorthosite, ~40 km — floated up as the magma ocean froze' },
      { name: 'Mantle',     to: 0.977, color: 0x6d6862, note: 'Silicate; partial melt at its base still shows up in seismic data' },
      { name: 'Outer core', to: 0.190, color: 0xffbe63, note: 'A small fluid iron layer' },
      { name: 'Inner core', to: 0.138, color: 0xffeeb5, note: 'Solid iron, ~240 km across — tiny, which is why the Moon has no field today' }
    ],
    air: [['Argon', 40], ['Helium', 30], ['Sodium', 20], ['Potassium', 10]],
    airNote: 'A surface-bound exosphere of roughly 100 molecules per cm³ — about a hundred trillion times thinner than Earth\'s air.',
    pressure: '~3×10⁻¹⁵ bar'
  },

  mars: {
    radiusKm: 3390,
    layers: [
      { name: 'Crust',  to: 1.000, color: 0xc1663f, note: 'Iron-oxide-rich basalt, 24–72 km — the rust is why it is red' },
      { name: 'Mantle', to: 0.985, color: 0x7a4630, note: 'Silicate, and seismically quiet: InSight heard only faint marsquakes' },
      { name: 'Core',   to: 0.540, color: 0xffb877, note: 'Liquid iron–sulphur, 1,830 km in radius — measured by InSight in 2021' }
    ],
    air: [['Carbon dioxide', 95.3], ['Nitrogen', 2.7], ['Argon', 1.6], ['Oxygen', 0.13]],
    airNote: 'Thin enough that liquid water boils away at the surface. The core froze early, the field died, and the solar wind stripped most of the air.',
    pressure: '0.006 bar (0.6% of Earth\'s)'
  },

  ceres: {
    radiusKm: 470,
    layers: [
      { name: 'Crust',      to: 1.000, color: 0xa9a094, note: 'Dusty, salt- and clay-rich — bright carbonate patches mark where brine reached the surface' },
      { name: 'Icy mantle', to: 0.940, color: 0xa8d8e8, note: 'Water ice mixed with rock; Ceres may still hold pockets of brine' },
      { name: 'Rocky core', to: 0.500, color: 0x7a6a5a, note: 'Hydrated silicate — Ceres separated into layers, unlike most asteroids' }
    ],
    air: [['Water vapour', 100]],
    airNote: 'No real atmosphere, but Herschel and Dawn detected transient water vapour — ice sublimating from the surface.',
    pressure: 'negligible'
  },

  vesta: {
    radiusKm: 263,
    layers: [
      { name: 'Basaltic crust', to: 1.000, color: 0xbdae90, note: 'Solidified lava — the HED meteorites found on Earth are pieces of it' },
      { name: 'Mantle',         to: 0.900, color: 0x8a7358, note: 'Olivine-rich rock, exposed at the bottom of the giant Rheasilvia impact basin' },
      { name: 'Iron core',      to: 0.420, color: 0xffc98a, note: 'A metallic core ~110 km across. Vesta melted and differentiated — it is a surviving protoplanet, not a rubble pile' }
    ],
    air: [],
    airNote: 'Airless.',
    pressure: 'none'
  },

  jupiter: {
    radiusKm: 69911,
    layers: [
      { name: 'Molecular hydrogen', to: 1.000, color: 0xe3c9a4, note: 'The banded cloud deck and the fluid H₂ beneath it — no surface anywhere' },
      { name: 'Metallic hydrogen', to: 0.780, color: 0x9fb6e8, note: 'Squeezed until hydrogen conducts like a metal; this layer generates the strongest planetary magnetic field in the Solar System' },
      { name: 'Dilute core',       to: 0.250, color: 0xd9a05a, note: 'Juno found the core is "fuzzy" — heavy elements smeared through the hydrogen rather than a sharp rocky ball' }
    ],
    air: [['Hydrogen (H₂)', 89.8], ['Helium', 10.2], ['Methane', 0.3], ['Ammonia', 0.026]],
    airNote: 'Essentially a captured piece of the solar nebula — its composition is close to the Sun\'s, which is why it never became a star only for want of mass.',
    pressure: 'rises past 1 bar at the clouds to ~4,000 GPa at the centre'
  },

  saturn: {
    radiusKm: 58232,
    layers: [
      { name: 'Molecular hydrogen', to: 1.000, color: 0xe8d9ae, note: 'Deep, hazy cloud layers; the blandest face of any giant' },
      { name: 'Metallic hydrogen', to: 0.500, color: 0xa9bce0, note: 'Helium may be raining out through this layer — an internal heat source' },
      { name: 'Rocky core',        to: 0.250, color: 0xc98f52, note: 'Ring seismology (Cassini) suggests a diffuse core reaching ~60% of the radius' }
    ],
    air: [['Hydrogen (H₂)', 96.3], ['Helium', 3.25], ['Methane', 0.45]],
    airNote: 'Less helium than Jupiter in the visible layers — the missing helium is thought to have rained into the interior.',
    pressure: '~1,000 GPa at the centre'
  },

  uranus: {
    radiusKm: 25362,
    layers: [
      { name: 'H/He atmosphere', to: 1.000, color: 0xa8e6e2, note: 'Hydrogen, helium and the methane that absorbs red light and leaves it cyan' },
      { name: 'Icy mantle',      to: 0.800, color: 0x4f8fa8, note: 'Hot, dense water–ammonia–methane fluid. Not ice as you know it: an electrically conducting ocean' },
      { name: 'Rocky core',      to: 0.200, color: 0x7d6a58, note: 'Small silicate–iron core, roughly Earth-mass' }
    ],
    air: [['Hydrogen (H₂)', 82.5], ['Helium', 15.2], ['Methane', 2.3]],
    airNote: 'The coldest atmosphere in the Solar System, reaching −224 °C — colder than Neptune despite being closer to the Sun.',
    pressure: '~800 GPa at the centre'
  },

  neptune: {
    radiusKm: 24622,
    layers: [
      { name: 'H/He atmosphere', to: 1.000, color: 0x7f9cff, note: 'Home to the fastest winds measured anywhere — over 2,000 km/h' },
      { name: 'Icy mantle',      to: 0.800, color: 0x3f5fa8, note: 'Water–ammonia–methane fluid; its off-centre convection makes Neptune\'s lopsided magnetic field' },
      { name: 'Rocky core',      to: 0.200, color: 0x6f5f52, note: 'Silicate and iron, about the mass of Earth' }
    ],
    air: [['Hydrogen (H₂)', 80.0], ['Helium', 19.0], ['Methane', 1.5]],
    airNote: 'Radiates 2.6× more heat than it receives from the Sun — something inside is still releasing energy.',
    pressure: '~700 GPa at the centre'
  }
};
