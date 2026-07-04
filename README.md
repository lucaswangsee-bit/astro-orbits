# 🌌 Cosmic Orbits · Solar System

A 3D Solar System website driven by **real NASA/JPL Keplerian orbital data**, showing each body's live orbital position and its "notable features." Pure front-end, zero build, free to deploy.

![tech](https://img.shields.io/badge/Three.js-r160-blue) ![build](https://img.shields.io/badge/build-none-green)

---

## ✨ Features

- **Real orbits**: the positions of all 8 planets are solved in real time from JPL Keplerian elements (semi-major axis / eccentricity / inclination / mean longitude…), solving Kepler's equation to get true geometric positions — not a fake animation.
- **Real textures**: the Sun, the eight planets and the Moon all use NASA-based imagery textures (Solar System Scope), with a Milky Way backdrop and Saturn's rings.
- **Dual mode**:
  - 🪐 **Solar System** — planets revolve and rotate in real time, with the Moon orbiting Earth.
  - ✨ **Nearby Stars** — Sun-centered, reconstructing the 3D distribution of 16 nearby and famous stars from their real RA/Dec/distance (Proxima Centauri, Sirius, Vega, Betelgeuse…), with light-year reference rings.
- **Sky-event prediction**: a built-in engine scans the next 8 years and computes the exact dates of planetary **opposition**, **greatest elongation** and **conjunction** from real orbits — click to jump to that day.
- **Time travel**: speed up, reverse, pause, and jump back to today with one click.
- **Body features**: click any body/star to see its notable features and key data (Earth is specially annotated as the "only known world with life," plus liquid water, atmosphere, magnetic field, etc.).
- **Interactive camera**: drag to rotate, scroll to zoom, one-click camera focus.

---

## 🏗 Architecture

```
astro-orbits/
├── index.html          Entry point. Loads Three.js from a CDN via importmap (no npm)
├── styles.css          Interface styles
├── assets/textures/    Planet/Sun/Moon textures + Milky Way backdrop (CC BY 4.0)
├── src/
│   ├── kepler.js       [Astronomy engine] JPL orbital-element tables + position/orbit solver
│   ├── bodies.js       [Data layer] physical data and feature text for each body
│   ├── stars.js        [Data layer] real coordinates and features of nearby stars
│   ├── events.js       [Prediction engine] opposition / elongation / conjunction computation
│   └── main.js         [Render layer] Three.js scene, dual mode, time control, interaction
└── README.md
```

**Layered design (easy to extend):**

| Layer | Responsibility | How to extend |
|-------|----------------|---------------|
| Astronomy engine `kepler.js` | Pure math: time in, coordinates out | Add a more precise ephemeris / comet orbits |
| Data layer `bodies.js` | Body properties and feature text | Add stars or galaxies here only |
| Render layer `main.js` | Visualization and interaction | Swap materials, add textures, add trails |

The three layers are decoupled: to add a "star / galaxy" module later, just add entries in the data layer and one drawing method in the render layer — the astronomy engine needs no changes.

---

## 🚀 Run locally

ES modules must be served over HTTP (you can't just double-click `index.html`). Pick one:

```bash
# Option 1: Python (bundled with macOS)
cd astro-orbits
python3 -m http.server 8080
# open http://localhost:8080 in a browser

# Option 2: Node
npx serve .
```

---

## 🌐 Free deployment (pick one — all are mainstream free options)

### GitHub Pages (recommended, simplest)
```bash
cd astro-orbits
git init && git add . && git commit -m "init"
git branch -M main
git remote add origin https://github.com/<your-username>/astro-orbits.git
git push -u origin main
```
Then in the repo under **Settings → Pages → Source**, pick the `main` branch root. After a few minutes it's live at
`https://<username>.github.io/astro-orbits/`.

### Firebase Hosting (official Google)
```bash
npm i -g firebase-tools
firebase login
firebase init hosting     # set the public directory to "."
firebase deploy
```

### Vercel
Import the repo at vercel.com, choose framework "Other," and deploy.

---

## 🔭 Data sources and accuracy

- Orbital elements: [JPL — Keplerian Elements for Approximate Positions of the Major Planets](https://ssd.jpl.nasa.gov/planets/approx_pos.html)
- Valid range 1800–2050; planetary positions are accurate enough for visualization.
- Display sizes and the Earth–Moon distance are **visually exaggerated** (at true scale the planets would be invisibly small); orbit **distances and shapes keep their true geometry**. The numbers in the info panel are real values.

---

## 📜 Assets and licensing

- **Planet/Sun/Moon textures, Milky Way backdrop**: [Solar System Scope Textures](https://www.solarsystemscope.com/textures/) — licensed **CC BY 4.0**, based on NASA imagery. Please keep this attribution when using the project.
- **Orbital elements**: NASA JPL Solar System Dynamics (public domain).
- **Star coordinates**: SIMBAD / Hipparcos / Gaia public catalogs.
- **3D engine**: [Three.js](https://threejs.org/) (MIT).

## 🧭 Possible future extensions

- [ ] Add planet textures (NASA public textures) for extra realism
- [ ] Add dwarf planets (Pluto, Ceres) and famous comet orbits
- [ ] "Stars" module: nearby stars, Sirius, Betelgeuse, etc. (equatorial coordinates + distance)
- [ ] "Galaxies" module: a Local Group schematic
- [ ] Date prediction of conjunctions, oppositions, transits, and other sky events
- [ ] Touch optimization and performance tiers for mobile
