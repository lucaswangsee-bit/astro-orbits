// Cosmic Origins — an eight-chapter timeline from the Big Bang to today's
// Solar System. Prose is intended to be scientifically rigorous and
// quantitative. KaTeX-bearing fields use template literals / String.raw so
// that LaTeX backslashes survive as literal characters.

export const ORIGINS = [
  {
    id: 'bigbang',
    icon: '🌌',
    epoch: 't = 0 → 10⁻³² s',
    title: 'The Big Bang & Inflation',
    body: `
      <p>The <b>Big Bang model</b> describes the observable universe as expanding and cooling from an extraordinarily hot, dense early state. It is not an explosion <i>into</i> space; it is the expansion <i>of</i> space itself, so every observer sees distant matter receding. The evidence — the cosmic expansion, the primordial light-element abundances, and the microwave background — all point back to this common origin.</p>
      <p>Within the first sliver of a second the universe likely underwent <b>cosmic inflation</b> (Alan Guth, 1981): a brief phase of <i>exponential</i> expansion driven by the vacuum energy of a scalar field. In roughly \\(10^{-32}\\ \\mathrm{s}\\) a patch smaller than a proton was stretched by a factor of \\(\\gtrsim 10^{26}\\), with the scale factor growing as \\( a(t) \\propto e^{Ht} \\) at nearly constant Hubble rate \\(H\\).</p>
      <p>Inflation solves two puzzles at once. It drives the spatial geometry toward <b>flatness</b> (any curvature is diluted away, so \\(\\Omega \\to 1\\)), and it explains why regions never in causal contact share the same temperature (the <b>horizon problem</b>). Crucially, it stretches microscopic <b>quantum fluctuations</b> to cosmic scales, imprinting the tiny density variations that would later grow into galaxies, stars, and planets — the seeds of all structure.</p>
    `,
    formula: String.raw`a(t) \propto e^{Ht}`,
    derive: null
  },
  {
    id: 'bbn',
    icon: '⚛️',
    epoch: 't ≈ 3 minutes',
    title: 'Big Bang Nucleosynthesis',
    body: `
      <p>As the universe expanded it cooled. By about one second the temperature had fallen to \\(\\sim 10^{10}\\ \\mathrm{K}\\) and the weak interactions that interconvert protons and neutrons "froze out." Because the neutron is slightly heavier than the proton (\\(\\Delta m c^2 \\approx 1.29\\ \\mathrm{MeV}\\)), thermal equilibrium favored protons, fixing the neutron-to-proton ratio at roughly \\( n_n/n_p \\approx 1/6 \\) after some neutron decay.</p>
      <p>By \\(t \\approx 3\\) minutes the universe was cool enough (\\(T \\sim 10^{9}\\ \\mathrm{K}\\)) that newly formed deuterium was no longer instantly photo-dissociated — the "deuterium bottleneck" broke. Protons and neutrons then rapidly bound into helium. This is <b>Big Bang nucleosynthesis (BBN)</b>.</p>
      <p>Essentially every available neutron ended up locked in \\(^4\\mathrm{He}\\), which yields a helium mass fraction of about <b>25%</b>, leaving roughly <b>75%</b> hydrogen, plus trace amounts of deuterium, \\(^3\\mathrm{He}\\), and \\(^7\\mathrm{Li}\\). No significant quantity of heavier elements formed: there are no stable nuclei at mass numbers 5 or 8 to bridge, and the universe was already too rarefied and cool. Everything heavier than lithium would have to wait for stars.</p>
    `,
    formula: String.raw`\dfrac{n_n}{n_p} \approx e^{-\Delta m c^2 / kT}`,
    derive: null
  },
  {
    id: 'cmb',
    icon: '📡',
    epoch: 't = 380,000 yr → today',
    title: 'Recombination, the CMB & an Expanding Universe',
    body: `
      <p>For its first ~380,000 years the universe was an opaque plasma: free electrons scattered photons so efficiently (Thomson scattering) that light could not travel far. As expansion cooled the plasma to \\(T \\approx 3000\\ \\mathrm{K}\\), electrons finally combined with nuclei to form neutral atoms — an event called <b>recombination</b>. With the free electrons gone, the universe became transparent and photons streamed freely for the first time.</p>
      <p>Those relic photons are still arriving today as the <b>Cosmic Microwave Background (CMB)</b>. Cosmic expansion has stretched their wavelengths by a factor of \\(1+z \\approx 1100\\), cooling the near-perfect blackbody spectrum from ~3000 K down to the observed <b>T ≈ 2.725 K</b>. The relation \\(1+z = a_0/a\\) ties this redshift directly to how much the universe has expanded since.</p>
      <p>On large scales galaxies recede from us with velocities proportional to their distance — the <b>Hubble–Lemaître law</b>, \\(v = H_0\\,d\\), with \\(H_0 \\approx 70\\ \\mathrm{km\\,s^{-1}\\,Mpc^{-1}}\\). Modern supernova surveys show this expansion is not merely coasting but <b>accelerating</b>, driven by <b>dark energy</b> — the dominant component of today's energy budget.</p>
    `,
    formula: String.raw`1+z = \dfrac{a_0}{a}, \qquad v = H_0\,d`,
    derive: null
  },
  {
    id: 'firststars',
    icon: '✨',
    epoch: 't ≈ 100–200 Myr',
    title: 'The First Stars: Gravitational Collapse',
    body: `
      <p>After recombination came the "cosmic dark ages": neutral hydrogen and helium gas, gently sculpted by the density seeds inflation had planted and by the gravity of dark matter halos. Where gas gathered densely enough and could shed heat, gravity began to win.</p>
      <p>A gas cloud is a contest between <b>self-gravity</b>, which pulls it together, and <b>thermal pressure</b>, which pushes back. The <b>Jeans instability</b> sets the tipping point: if a cloud's mass exceeds the <b>Jeans mass</b> \\(M_J\\), gravity overwhelms pressure and the cloud collapses. Colder, denser gas has a smaller \\(M_J\\), so it fragments more easily into stars.</p>
      <p>The very first stars (Population III) formed from pristine H/He with no metals to help radiate away heat, so they were typically very massive and short-lived. Their collapse ignited the first fusion and ended the dark ages, beginning the long chain of stellar generations that manufacture the elements.</p>
    `,
    formula: String.raw`M_J \sim \left(\dfrac{5kT}{G\mu m_H}\right)^{3/2}\left(\dfrac{3}{4\pi\rho}\right)^{1/2}`,
    derive: {
      title: 'The Jeans mass — when gravity wins',
      html: String.raw`
        <p>Model a cloud as a uniform sphere of mass \(M\), radius \(R\), density \(\rho\), and temperature \(T\), made of particles of mean molecular mass \(\mu m_H\). Its gravitational binding energy has magnitude</p>
        $$ |U| \sim \frac{3}{5}\frac{GM^2}{R}. $$
        <p>Its internal thermal energy, for \(N = M/(\mu m_H)\) particles each carrying \(\tfrac{3}{2}kT\), is</p>
        $$ E_\text{th} = \frac{3}{2}NkT = \frac{3}{2}\frac{M}{\mu m_H}kT. $$
        <p>By the virial argument, collapse proceeds when gravity dominates thermal support, \(|U| \gtrsim E_\text{th}\):</p>
        $$ \frac{3}{5}\frac{GM^2}{R} \gtrsim \frac{3}{2}\frac{M}{\mu m_H}kT. $$
        <p>Eliminate the radius using the density, \(M = \tfrac{4}{3}\pi R^3 \rho \Rightarrow R = \left(\dfrac{3M}{4\pi\rho}\right)^{1/3}\). Substituting and solving for the critical mass gives, up to order-unity factors,</p>
        $$ M_J \sim \left(\frac{5kT}{G\mu m_H}\right)^{3/2}\left(\frac{3}{4\pi\rho}\right)^{1/2}. $$
        <p>Any cloud exceeding \(M_J\) cannot support itself and collapses — the birth of a star.</p>
      `
    }
  },
  {
    id: 'mainsequence',
    icon: '☀️',
    epoch: 'millions–billions of years',
    title: "A Star's Life on the Main Sequence",
    body: `
      <p>A protostar contracts until its core reaches \\(\\sim 10^{7}\\ \\mathrm{K}\\), hot enough to fuse hydrogen into helium. The star then settles into <b>hydrostatic equilibrium</b>: the outward pressure from fusion energy exactly balances the inward pull of gravity. In this stable state the star sits on the <b>main sequence</b> of the Hertzsprung–Russell diagram, the diagonal band relating luminosity to surface temperature.</p>
      <p>Low-mass stars like the Sun fuse via the <b>proton–proton (p–p) chain</b>; more massive stars use the catalytic <b>CNO cycle</b>. Either way the net reaction converts four protons into one helium nucleus, \\( 4\\,^1\\mathrm{H} \\rightarrow\\, ^4\\mathrm{He} + 2e^+ + 2\\nu_e + \\gamma \\), releasing about 26.7 MeV as the helium nucleus is slightly less massive than four protons (\\(E = \\Delta m c^2\\)).</p>
      <p>A star's fate is dictated by its mass. Luminosity climbs steeply, roughly \\( L \\propto M^{3.5} \\), while the available fuel scales only as \\(M\\). So the main-sequence lifetime scales as \\(M/L \\propto M^{-2.5}\\): a ten-solar-mass star blazes thousands of times brighter than the Sun and exhausts its hydrogen in millions of years, whereas the Sun burns steadily for about ten billion.</p>
    `,
    formula: String.raw`L \propto M^{3.5}`,
    derive: null
  },
  {
    id: 'stardeath',
    icon: '💥',
    epoch: "end of a star's life",
    title: 'Stellar Death & the Element Factory',
    body: `
      <p>When core hydrogen runs out, a star fuses heavier fuels in concentric shells — helium to carbon and oxygen, and in massive stars onward through neon, silicon, up to iron. This is <b>stellar nucleosynthesis</b>. Fusion stops at iron: \\(^{56}\\mathrm{Fe}\\) has the highest binding energy per nucleon, so fusing it <i>absorbs</i> energy rather than releasing it. The iron core cannot support itself.</p>
      <p>Elements heavier than iron are not built by ordinary fusion. They are forged in the neutron-rich, explosive environments of <b>supernovae</b> (and neutron-star mergers) through rapid neutron capture — the <b>r-process</b>. The explosion then blasts this enriched material outward, seeding the <b>interstellar medium</b> with "metals" — the raw ingredients for the next generation of stars and planets.</p>
      <p>A star's endpoint is set by its mass. Below the <b>Chandrasekhar limit</b>, \\( M_\\mathrm{Ch} \\approx 1.4\\,M_\\odot \\), electron degeneracy pressure can hold up the remnant as a <b>white dwarf</b>. Above it, collapse continues to a <b>neutron star</b>, supported by neutron degeneracy; and if the remnant is heavier still, nothing halts the collapse and it becomes a <b>black hole</b>, its event horizon set by the Schwarzschild radius \\( r_s = \\dfrac{2GM}{c^2} \\).</p>
    `,
    formula: String.raw`M_\mathrm{Ch} \approx 1.4\,M_\odot`,
    derive: null
  },
  {
    id: 'solarnebula',
    icon: '🌀',
    epoch: '≈ 4.6 billion years ago',
    title: 'Birth of the Solar System: the Nebular Hypothesis',
    body: `
      <p>About <b>4.6 billion years ago</b>, a fragment of a giant molecular cloud — already enriched with the metals from earlier stellar generations — became gravitationally unstable and began to collapse, perhaps triggered by a nearby supernova shock. This is the <b>Kant–Laplace nebular hypothesis</b>.</p>
      <p>The cloud carried a small net rotation. As it shrank, <b>conservation of angular momentum</b>, \\( L = m v r = \\text{const} \\), forced it to spin faster and faster (like a skater pulling in their arms). Rotation resists collapse in the equatorial plane but not along the spin axis, so the cloud flattened into a <b>rotating protoplanetary disk</b>, with most of the mass sinking to the center to form the proto-Sun.</p>
      <p>This single picture explains the architecture we still observe: the planets orbit in <b>nearly the same plane</b> and travel in the <b>same direction</b> as the Sun's rotation, because they all condensed from one spinning disk. The order and coplanarity of the Solar System are fossils of its collapse.</p>
    `,
    formula: String.raw`L = m v r = \text{const}`,
    derive: {
      title: 'Why the cloud flattens into a disk',
      html: String.raw`
        <p>For a parcel of gas orbiting the forming center, gravity supplies no torque about the rotation axis, so its <b>angular momentum is conserved</b>:</p>
        $$ L = m\,v\,r = \text{const}. $$
        <p>As the cloud contracts and \(r\) decreases, the orbital speed must rise to compensate:</p>
        $$ v = \frac{L}{m\,r} \;\propto\; \frac{1}{r}. $$
        <p>The centrifugal (rotational) support per unit mass then grows steeply as the parcel falls inward:</p>
        $$ a_\text{cf} = \frac{v^2}{r} = \frac{L^2}{m^2 r^3} \;\propto\; \frac{1}{r^3}. $$
        <p>In the equatorial plane this centrifugal term rises fast enough to <b>balance gravity</b> and halt further infall at a characteristic radius. Along the rotation axis, however, there is no such support — gas is free to fall straight down onto the midplane. Collapse is therefore stopped in one direction but not the other, so the cloud inevitably settles into a thin, rotating <b>disk</b>. Every planet that later forms inherits that disk's plane and its direction of rotation.</p>
      `
    }
  },
  {
    id: 'accretion',
    icon: '🪐',
    epoch: '4.6 Gyr ago → now',
    title: "Accretion, the Frost Line & Today's Solar System",
    body: `
      <p>Within the disk, microscopic dust grains collided and stuck, growing into kilometre-scale <b>planetesimals</b> that then gravitationally accreted one another into full planets — the <b>core accretion</b> model. But <i>what</i> could condense depended on temperature, and the disk was hot near the young Sun and cold far from it, roughly \\( T(r) \\propto r^{-1/2} \\).</p>
      <p>The pivotal boundary is the <b>frost (snow) line</b>, near \\( r_\\mathrm{ice} \\approx 2.7\\ \\mathrm{AU} \\), where the temperature drops to \\(T \\approx 150\\text{–}170\\ \\mathrm{K}\\) and water and other volatiles freeze into ice. Beyond it there is far more solid material, so cores grew large and fast enough to capture nebular gas and become the <b>gas giants</b>; inside it only rock and metal survived the heat, forming the smaller <b>terrestrial planets</b>.</p>
      <p>Jupiter's enormous gravity stirred up the region just inside the frost line, pumping up collision speeds so that planetesimals there shattered instead of merging — no planet ever coalesced, leaving the <b>asteroid belt</b>. Later, a slow reshuffling of the giant planets' orbits — the <b>Nice model</b> — scattered icy bodies outward into the <b>Kuiper Belt</b> and <b>Oort cloud</b>, the reservoirs of the comets, and hurled others inward to produce the <b>Late Heavy Bombardment</b>.</p>
      <p>These same processes — gravitational collapse, disk formation, condensation across the frost line, accretion, and migration — produced <b>the very orbits you can now explore</b> in Cosmic Orbits.</p>
    `,
    formula: String.raw`T(r) \propto r^{-1/2}, \qquad r_\mathrm{ice} \approx 2.7\ \mathrm{AU}`,
    derive: {
      title: 'The frost line temperature',
      html: String.raw`
        <p>A dust grain in the disk is heated by the young Sun's radiation and re-radiates as a blackbody. The stellar flux falls off with the inverse square of distance:</p>
        $$ F(r) = \frac{L_\star}{4\pi r^2}. $$
        <p>In thermal (radiative) equilibrium the power absorbed equals the power emitted. A grain radiates as \(\sigma T^4\) per unit area, so the equilibrium temperature satisfies</p>
        $$ T^4 \;\propto\; F(r) \;\propto\; \frac{1}{r^2}. $$
        <p>Taking the fourth root gives the disk temperature profile</p>
        $$ T(r) \;\propto\; r^{-1/2}. $$
        <p>Water ice condenses where the temperature falls to about \(T \approx 150\text{–}170\ \mathrm{K}\). Anchoring the profile to the Sun's luminosity places that transition — the <b>frost line</b> — at</p>
        $$ r_\mathrm{ice} \approx 2.7\ \mathrm{AU}, $$
        <p>between the orbits of Mars and Jupiter. Inside it, volatiles stay gaseous and only rock survives; outside it, abundant ice builds the massive cores of the giant planets.</p>
      `
    }
  }
];
