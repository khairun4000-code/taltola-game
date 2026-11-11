import * as THREE from 'three';
import { box, cylinder, rodBetween } from './scene-utils.js';

/**
 * SK ARSHAN ALIF TOWER (শেখ আরশান আলিফ টাওয়ার) — 35 Haji Mohsin Road, Khulna
 * + FAKIR BARI LANE (পাশের গলি)
 *
 * Rebuilt 1:1 from Google Street View (May 2024, pano fu9q0yInNkCtlR_lVjRj1Q):
 *  - G + 9 storey white modern apartment tower on the corner of Haji Mohsin Rd & the side lane
 *  - Front (road) facade: projecting corner balconies with grey steel railings (bay A),
 *    deep recessed balconies between white fins (bay B), staggered white box-frame balconies (bay C)
 *  - Lane-side facade: grey fair-faced cement with stacked windows & white sun hoods
 *  - Ground floor: black speckled granite + real swirl-marble piers, vertical steel-bar parking gates,
 *    maroon rolling shutter, row of brown shop shutters along the lane
 *  - Raised black-granite plinth with stainless tube railings, car ramp & steps, red paver sidewalk
 *  - Lane: light concrete paving, weathered brick boundary wall (real photo texture with blue paint patch)
 *
 * World layout (shared with haji-mohsin-road.js):
 *   Haji Mohsin Road runs along Z at x ∈ [-2.1, 2.1].  West sidewalk x ∈ [-3.28, -2.08].
 *   Lane runs West at z ∈ [10.2, 14.25].  Tower occupies x ∈ [-19.9, -3.25], z ∈ [14.25, 28.6].
 */

const texLoader = new THREE.TextureLoader();

function loadTex(file, { repeatX = 1, repeatY = 1, offsetY = 0 } = {}) {
  const t = texLoader.load(`./assets/haji/${file}`);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.offset.y = offsetY;
  return t;
}

export function createHajiMaterials() {
  const lam = (opts, uvScale) => {
    const mat = new THREE.MeshLambertMaterial(opts);
    if (uvScale) mat.userData.uvScale = uvScale;
    return mat;
  };
  const std = (opts, uvScale) => {
    const mat = new THREE.MeshStandardMaterial(opts);
    if (uvScale) mat.userData.uvScale = uvScale;
    return mat;
  };
  const stuccoMap = loadTex('white-stucco.jpg');
  // Weathered wall photo is ~2.95 m wide x 2.2 m tall: worldUV uses one scale for both axes,
  // so stretch V so the full photo height maps onto the 2.15 m wall (centred local geometry -> offset 0.5)
  const WALL_W = 2.95;
  return {
    stucco: lam({ map: stuccoMap }, 3.2),
    stuccoShade: lam({ map: stuccoMap, color: 0xdedcd6 }, 3.2),
    grey: lam({ map: loadTex('grey-cement.jpg'), color: 0xe2e4e4 }, 2.6),
    darkGrey: lam({ map: loadTex('grey-cement.jpg'), color: 0x8a8e90 }, 2.6),
    marble: std({ map: loadTex('swirl-marble.jpg'), roughness: 0.24, metalness: 0.02 }, 1.8),
    granite: std({ map: loadTex('black-granite.jpg'), roughness: 0.2, metalness: 0.04 }, 1.3),
    pavers: lam({ map: loadTex('red-pavers.jpg') }, 2.4),
    alleyConcrete: lam({ map: loadTex('alley-concrete.jpg') }, 3.4),
    maroonShutter: lam({ map: loadTex('maroon-shutter.jpg') }, 2.4),
    brownShutter: lam({ map: loadTex('brown-shutter.jpg') }, 2.4),
    weatheredWall: lam({ map: loadTex('weathered-wall.jpg', { repeatY: WALL_W / 2.2, offsetY: 0.5 }) }, WALL_W),
    oldCream: lam({ map: stuccoMap, color: 0xd6c08e }, 3.2),
    oldPink: lam({ map: stuccoMap, color: 0xcf9484 }, 3.2),
    oldYellow: lam({ map: stuccoMap, color: 0xe0c87a }, 3.2),
    glass: std({ color: 0x2a5a80, roughness: 0.08, metalness: 0.3, emissive: 0x08141e }),
    frame: lam({ color: 0x50565a }),
    steel: std({ color: 0xc7cbcf, roughness: 0.3, metalness: 0.45 }),
    railGrey: lam({ color: 0x8f969b }),
    grilleBar: lam({ color: 0xa3a9ad }),
    dark: lam({ color: 0x17191b }),
    window: lam({ color: 0x2b3134 }),
    ac: lam({ color: 0xeceeea }),
    acFan: lam({ color: 0x33373a }),
    plant: lam({ color: 0x3d7a33 }),
    terracotta: lam({ color: 0x9c4a2d }),
    redCar: std({ color: 0x9a1a1a, roughness: 0.35, metalness: 0.25 }),
    tyre: lam({ color: 0x141414 }),
    rubble: lam({ color: 0xb3ada2 }),
    brickRed: lam({ color: 0x9a4a36 }),
    banner: lam({ map: loadTex('balcony-banner.jpg'), side: THREE.DoubleSide }),
    signMcsk: lam({ map: loadTex('sign-mcsk.jpg'), side: THREE.DoubleSide }),
    signShetu: lam({ map: loadTex('sign-shetu.jpg'), side: THREE.DoubleSide }),
  };
}

/** Axis-aligned box from min/max extents (much easier to match measured facades). */
function makeB(parent) {
  return (x0, x1, y0, y1, z0, z1, mat, opts) => box(
    parent,
    [Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)],
    [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2],
    mat,
    opts,
  );
}

/** Balcony railing: top rail + mid rail + thin vertical balusters (grey steel, like the real tower). */
function railingAlongZ(B, parent, hm, x, z0, z1, y, h = 1.0, spacing = 0.11) {
  rodBetween(parent, [x, y + h, z0], [x, y + h, z1], 0.026, hm.steel, 8);
  rodBetween(parent, [x, y + 0.12, z0], [x, y + 0.12, z1], 0.016, hm.railGrey, 6);
  for (let z = Math.min(z0, z1) + 0.04; z <= Math.max(z0, z1) - 0.02; z += spacing) {
    B(x - 0.012, x + 0.012, y + 0.1, y + h, z - 0.012, z + 0.012, hm.railGrey, { castShadow: false });
  }
}

function railingAlongX(B, parent, hm, z, x0, x1, y, h = 1.0, spacing = 0.11) {
  rodBetween(parent, [x0, y + h, z], [x1, y + h, z], 0.026, hm.steel, 8);
  rodBetween(parent, [x0, y + 0.12, z], [x1, y + 0.12, z], 0.016, hm.railGrey, 6);
  for (let x = Math.min(x0, x1) + 0.04; x <= Math.max(x0, x1) - 0.02; x += spacing) {
    B(x - 0.012, x + 0.012, y + 0.1, y + h, z - 0.012, z + 0.012, hm.railGrey, { castShadow: false });
  }
}

/** Stainless tube railing on the granite plinth (3 horizontal tubes + posts). */
function plinthRailZ(parent, hm, x, z0, z1, y) {
  for (const h of [0.3, 0.6, 0.9]) rodBetween(parent, [x, y + h, z0], [x, y + h, z1], 0.022, hm.steel, 8);
  const n = Math.max(1, Math.round(Math.abs(z1 - z0) / 1.5));
  for (let i = 0; i <= n; i++) {
    const z = z0 + ((z1 - z0) * i) / n;
    rodBetween(parent, [x, y, z], [x, y + 0.95, z], 0.028, hm.steel, 8);
  }
}

function plinthRailX(parent, hm, z, x0, x1, y) {
  for (const h of [0.3, 0.6, 0.9]) rodBetween(parent, [x0, y + h, z], [x1, y + h, z], 0.022, hm.steel, 8);
  const n = Math.max(1, Math.round(Math.abs(x1 - x0) / 1.5));
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    rodBetween(parent, [x, y, z], [x, y + 0.95, z], 0.028, hm.steel, 8);
  }
}

/** Split-AC outdoor unit facing +X (road) or -Z (lane). */
function acUnit(B, parent, hm, x, y, z, facing = '+x') {
  if (facing === '+x') {
    B(x, x + 0.3, y, y + 0.55, z - 0.4, z + 0.4, hm.ac);
    const fan = cylinder(parent, 0.19, 0.19, 0.02, [x + 0.31, y + 0.275, z - 0.08], hm.acFan, 16);
    fan.rotation.z = Math.PI / 2;
  } else {
    B(x - 0.4, x + 0.4, y, y + 0.55, z - 0.3, z, hm.ac);
    const fan = cylinder(parent, 0.19, 0.19, 0.02, [x - 0.08, y + 0.275, z - 0.31], hm.acFan, 16);
    fan.rotation.x = Math.PI / 2;
  }
}

export function buildSkArshanTower(staticParent, dynamicParent, m, hm) {
  const g = new THREE.Group();
  g.name = 'SkArshanAlifTower';
  staticParent.add(g);
  const B = makeB(g);

  // Footprint & levels
  const FX = -4.0;   // front (road) facade line
  const BX = -19.9;  // rear wall
  const SZ = 14.6;   // lane-side facade line
  const EZ = 28.6;   // south party wall
  const PL = 0.5;    // raised plinth / ground floor level
  const L = (k) => (k === 0 ? PL : 4.0 + (k - 1) * 3.0); // k = 1..9 floors, 10 = roof
  const FLOORS = 9;
  const ROOF = L(FLOORS + 1); // 31.0 m

  // ==========================================================================
  // 1. RAISED BLACK-GRANITE PLINTH, CAR RAMP, STEPS & STAINLESS RAILINGS
  // ==========================================================================
  B(-4.6, BX, 0, PL, 14.25, EZ, hm.granite);
  // Front terrace strip (x -3.25..-4.6) with gaps for the car ramp & entrance steps
  B(-3.25, -4.6, 0, PL, 14.25, 19.2, hm.granite);
  B(-3.25, -4.6, 0, PL, 22.9, 26.6, hm.granite);
  // Grey concrete car ramp up to the parking gate (bay B)
  const ramp = box(g, [1.45, 0.14, 3.7], [-3.93, 0.28, 21.05], m.concrete);
  ramp.rotation.z = -Math.atan2(0.42, 1.35);
  // 3 granite steps at the south end
  for (let i = 0; i < 3; i++) B(-3.25 - i * 0.42, -4.6, 0, (i + 1) * (PL / 3), 26.6, 28.4, hm.granite);
  // Stainless railings
  plinthRailZ(g, hm, -3.33, 14.33, 19.15, PL);
  plinthRailZ(g, hm, -3.33, 22.95, 26.55, PL);
  plinthRailX(g, hm, 14.33, -3.33, -6.0, PL);

  // ==========================================================================
  // 2. GROUND FLOOR (parking + shops)
  // ==========================================================================
  B(-4.5, BX + 0.05, PL, 3.85, 14.75, EZ - 0.15, hm.dark); // shadowed parking interior
  B(-3.95, BX, 3.82, 4.1, SZ - 0.05, EZ, hm.stucco);        // 1st-floor slab edge band

  const grille = (z0, z1) => {
    for (let z = z0 + 0.1; z < z1 - 0.04; z += 0.2) B(-4.17, -4.27, PL, 3.72, z - 0.045, z + 0.045, hm.grilleBar);
    B(-4.14, -4.3, 3.7, 3.84, z0, z1, hm.frame);
    B(-4.14, -4.3, PL, PL + 0.07, z0, z1, hm.frame);
  };
  // Front (road) ground floor, from the lane corner southwards
  B(-4.0, -4.55, PL, 3.85, 14.55, 14.9, hm.granite);        // corner column
  grille(14.9, 17.0);                                       // bay A parking gate (under banner balcony)
  B(-4.0, -4.6, PL, 3.85, 17.0, 18.9, hm.granite);          // wide black granite pier
  grille(18.9, 21.9);                                       // bay B car gate at the ramp
  B(-4.0, -4.6, PL, 3.85, 21.9, 23.2, hm.granite);          // granite wall with small blue window
  B(-3.96, -4.0, 1.55, 2.55, 22.2, 22.9, hm.glass);
  B(-3.95, -4.01, 1.5, 1.55, 22.15, 22.95, hm.frame);
  B(-3.95, -4.01, 2.55, 2.6, 22.15, 22.95, hm.frame);
  B(-4.0, -4.6, PL, 3.85, 23.2, 24.0, hm.marble);           // real swirl-marble pier
  grille(24.0, 27.8);                                       // bay C parking gate
  B(-4.0, -4.6, PL, 3.85, 27.8, 28.65, hm.marble);          // south end swirl-marble pier
  B(-4.0, -6.2, PL, 3.85, 28.3, 28.65, hm.marble);          // marble wraps the south corner

  // Red car parked inside bay C (visible through the bars in Street View)
  B(-5.0, -9.2, PL + 0.25, PL + 0.92, 24.55, 26.25, hm.redCar);
  B(-5.9, -8.3, PL + 0.92, PL + 1.42, 24.65, 26.15, hm.redCar);
  for (const [wx, wz] of [[-5.8, 24.5], [-8.4, 24.5], [-5.8, 26.3], [-8.4, 26.3]]) {
    const wheel = cylinder(g, 0.32, 0.32, 0.2, [wx, PL + 0.32, wz], hm.tyre, 14);
    wheel.rotation.x = Math.PI / 2;
  }

  // Lane-side ground floor (facade z = 14.6), from the corner westwards
  B(-4.55, -6.0, PL, 3.38, 14.56, 14.7, hm.maroonShutter);   // maroon rolling shutter
  B(-4.55, -6.0, 3.38, 3.85, 14.5, 14.75, hm.stucco);        // shutter box
  B(-6.0, -6.5, PL, 3.85, 14.5, 14.75, hm.stucco);           // white pillar
  B(-6.5, -7.1, PL, 3.85, 14.5, 14.75, hm.granite);          // granite pier
  for (let i = 0; i < 6; i++) {
    const x0 = -7.1 - i * 2.13;
    B(x0, x0 - 1.7, PL, 3.2, 14.58, 14.7, hm.brownShutter);  // shop shutter
    B(x0, x0 - 1.7, 3.2, 3.85, 14.52, 14.75, hm.stucco);     // lintel / sign band
    B(x0 - 1.7, x0 - 2.13, PL, 3.85, 14.48, 14.75, hm.granite);
  }

  // ==========================================================================
  // 3. UPPER FLOORS — CORE MASS
  // ==========================================================================
  B(-5.6, BX, 4.1, ROOF, 14.75, EZ - 0.1, hm.stucco);

  // ==========================================================================
  // 4. FRONT FACADE — BAY A (corner, z 14.6..18.6): projecting cantilever balconies
  // ==========================================================================
  B(-4.2, -5.6, 4.1, ROOF, 14.6, 18.6, hm.stucco);
  for (let k = 1; k <= FLOORS; k++) {
    const y = L(k);
    B(-4.2, -2.85, y - 0.26, y, 14.3, 18.6, hm.stucco);              // slab
    B(-2.85, -2.9, y - 0.26, y, 14.3, 18.6, hm.stuccoShade);         // drip edge
    B(-4.16, -4.22, y + 0.1, y + 2.35, 15.0, 17.6, hm.glass);        // sliding glass doors
    B(-4.15, -4.23, y + 2.35, y + 2.47, 14.95, 17.65, hm.frame);
    B(-4.15, -4.23, y + 0.1, y + 2.35, 16.27, 16.33, hm.frame);
    railingAlongZ(B, g, hm, -2.97, 14.38, 18.55, y);
    railingAlongX(B, g, hm, 14.38, -2.97, -4.2, y);
    acUnit(B, g, hm, -4.2, y + 1.85, 18.1, '+x');
  }
  // The colourful coaching-centre banner tied to the 1st-floor corner balcony (real photo texture)
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.92), hm.banner);
  banner.position.set(-2.93, L(1) + 0.58, 16.35);
  banner.rotation.y = Math.PI / 2;
  dynamicParent.add(banner);

  // ==========================================================================
  // 5. FRONT FACADE — BAY B (z 18.6..23.6): deep recessed balconies between white fins
  // ==========================================================================
  B(-5.6, -3.75, 4.1, ROOF, 18.6, 18.9, hm.stucco);
  B(-5.6, -3.75, 4.1, ROOF, 23.3, 23.6, hm.stucco);
  for (let k = 1; k <= FLOORS; k++) {
    const y = L(k);
    B(-5.6, -3.75, y - 0.24, y, 18.9, 23.3, hm.stucco);
    railingAlongZ(B, g, hm, -3.85, 18.95, 23.25, y);
    B(-5.57, -5.63, y + 0.1, y + 2.3, 19.3, 21.5, hm.glass);
    B(-5.56, -5.64, y + 2.3, y + 2.4, 19.25, 21.55, hm.frame);
    B(-5.57, -5.63, y + 0.9, y + 2.2, 21.9, 23.0, hm.glass);
    B(-5.56, -5.64, y + 0.85, y + 0.9, 21.85, 23.05, hm.frame);
    if (k % 2 === 0) acUnit(B, g, hm, -5.6, y + 0.02, 22.6, '+x');
    if (k % 3 === 1) {
      cylinder(g, 0.18, 0.13, 0.3, [-4.15, y + 0.15, 19.4], hm.terracotta, 10);
      B(-3.95, -4.35, y + 0.3, y + 0.85, 19.15, 19.65, hm.plant);
    }
  }

  // ==========================================================================
  // 6. FRONT FACADE — BAY C (z 23.6..28.6): staggered white box-frame balconies
  // ==========================================================================
  B(-5.0, -5.6, 4.1, ROOF, 23.6, 28.3, hm.stucco);
  B(-5.6, -3.65, 4.1, ROOF, 28.25, 28.6, hm.stucco);
  for (let k = 1; k <= FLOORS; k++) {
    const y = L(k);
    const px = k % 2 === 0 ? -3.65 : -4.3; // alternating projection = zig-zag stepped look
    B(-5.0, px, y - 0.26, y, 23.6, 28.25, hm.stucco);
    railingAlongZ(B, g, hm, px - 0.1, 23.65, 28.2, y);
    B(-4.97, -5.03, y + 0.1, y + 2.3, 24.1, 26.5, hm.glass);
    B(-4.96, -5.04, y + 2.3, y + 2.4, 24.05, 26.55, hm.frame);
    B(-4.97, -5.03, y + 0.9, y + 2.2, 26.8, 27.9, hm.glass);
    if (k % 2 === 1) acUnit(B, g, hm, -5.0, y + 1.85, 27.4, '+x');
  }

  // ==========================================================================
  // 7. LANE-SIDE FACADE (z = 14.6): grey cement cladding, stacked windows, white sun hoods
  // ==========================================================================
  B(-5.6, BX, 4.1, ROOF, 14.5, 14.76, hm.grey);
  const cols = [-6.7, -9.2, -11.7, -14.2, -16.7, -19.0];
  // Projecting grey piers between the window columns (makes the windows read as deep slots)
  const edges = [-5.6];
  for (const c of cols) edges.push(c + 0.6, c - 0.6);
  edges.push(BX);
  for (let i = 0; i < edges.length; i += 2) {
    const xa = edges[i];
    const xb = edges[i + 1];
    if (xa - xb > 0.05) B(xa, xb, 4.1, ROOF, 14.28, 14.5, hm.grey);
  }
  for (let k = 1; k <= FLOORS; k++) {
    const y = L(k);
    for (const c of cols) {
      B(c + 0.5, c - 0.5, y + 0.85, y + 2.35, 14.47, 14.5, hm.frame);
      B(c + 0.45, c - 0.45, y + 0.9, y + 2.3, 14.455, 14.47, hm.glass);
      B(c + 0.02, c - 0.02, y + 0.9, y + 2.3, 14.45, 14.46, hm.frame);
      B(c + 0.55, c - 0.55, y + 2.42, y + 2.52, 14.05, 14.5, hm.stucco); // white sun hood
      B(c + 0.5, c - 0.5, y + 0.78, y + 0.85, 14.36, 14.5, hm.stucco);   // sill
    }
    if (k % 2 === 0) acUnit(B, g, hm, -8.0, y + 1.0, 14.28, '-z');
  }

  // ==========================================================================
  // 8. ROOF: parapet, top grey frame, stair/lift room & water tank
  // ==========================================================================
  B(-3.65, BX, ROOF, ROOF + 0.25, 14.3, EZ, hm.stucco);
  B(-3.65, -3.9, ROOF + 0.25, ROOF + 1.2, 14.3, EZ, hm.stucco);
  B(-3.65, BX, ROOF + 0.25, ROOF + 1.2, 14.3, 14.55, hm.stucco);
  B(BX + 0.25, BX, ROOF + 0.25, ROOF + 1.2, 14.3, EZ, hm.stucco);
  B(-3.65, BX, ROOF + 0.25, ROOF + 1.2, EZ - 0.25, EZ, hm.stucco);
  B(-3.75, -5.6, ROOF + 1.2, ROOF + 1.55, 18.6, 28.6, hm.darkGrey);
  for (const z of [18.75, 23.45, 28.45]) B(-3.8, -4.1, ROOF + 0.25, ROOF + 1.2, z - 0.15, z + 0.15, hm.darkGrey);
  B(-10.0, -14.5, ROOF + 0.25, ROOF + 3.2, 18.0, 22.5, hm.stucco);
  B(-9.95, -10.0, ROOF + 0.3, ROOF + 2.4, 19.6, 20.6, hm.dark);
  B(-11.0, -13.5, ROOF + 3.2, ROOF + 4.5, 18.8, 21.6, hm.darkGrey);

  return g;
}

/**
 * Fakir Bari Lane (পাশের গলি): concrete paving, real weathered boundary wall,
 * rubble pile at the mouth, and the old cream/pink buildings down the lane.
 */
export function buildFakirBariLane(staticParent, m, hm) {
  const g = new THREE.Group();
  g.name = 'FakirBariLane';
  staticParent.add(g);
  const B = makeB(g);

  // Ground under the extended lane area
  B(-19.0, -46.0, -0.48, -0.3, -12, 42, m.darkConcrete, { castShadow: false });
  // Light concrete lane paving (x -3.3 .. -42.5)
  B(-3.3, -42.5, -0.05, 0.08, 10.2, 14.3, hm.alleyConcrete, { castShadow: false });
  // Shallow open drain edge along the tower plinth
  B(-3.3, -19.9, 0.0, 0.1, 14.18, 14.28, m.darkConcrete, { castShadow: false });

  // North boundary wall along the lane (real photo texture)
  B(-3.12, -42.5, 0, 2.15, 9.95, 10.21, hm.weatheredWall);
  B(-3.12, -42.5, 2.15, 2.25, 9.9, 10.26, m.darkConcrete);
  for (let x = -6.4; x > -42; x -= 3.3) B(x + 0.2, x - 0.2, 0, 2.3, 9.9, 10.3, hm.weatheredWall);

  // Broken concrete slabs & brick rubble at the lane mouth (exactly where Street View shows them)
  const chunks = [
    [-3.55, 0.18, 10.55, 0.75, 0.16, 0.6, 0.3, 0.5],
    [-3.95, 0.14, 10.75, 0.55, 0.14, 0.45, -0.4, 0.2],
    [-3.4, 0.3, 10.9, 0.45, 0.12, 0.5, 0.9, -0.3],
    [-4.3, 0.1, 10.5, 0.4, 0.1, 0.35, 0.2, 0.6],
  ];
  for (const [x, y, z, sx, sy, sz, ry, rz] of chunks) {
    const c = box(g, [sx, sy, sz], [x, y, z], hm.rubble);
    c.rotation.set(0.15, ry, rz);
  }
  for (let i = 0; i < 7; i++) {
    const b = box(g, [0.22, 0.07, 0.1], [-3.5 - (i % 4) * 0.22, 0.05 + Math.floor(i / 4) * 0.07, 11.2 + (i % 3) * 0.13], hm.brickRed);
    b.rotation.y = i * 0.7;
  }

  // Old buildings further down the lane (south side, beyond the tower)
  const oldBuilding = (x0, x1, z0, z1, h, mat, floorH = 3.1, faceZ = z0) => {
    B(x0, x1, 0, h, z0, z1, mat);
    B(x0 + 0.1, x1 - 0.1, h, h + 0.6, z0 - 0.1, z1 + 0.1, mat);
    const dir = faceZ === z0 ? -1 : 1;
    for (let y = floorH; y < h - 0.5; y += floorH) {
      B(x0, x1, y - 0.12, y + 0.06, faceZ + dir * 0.0, faceZ + dir * 0.55, hm.stuccoShade); // balcony slab / chajja
      for (let x = x0 - 1.2; x > x1 + 0.8; x -= 2.4) {
        B(x, x - 1.0, y + 0.8, y + 2.2, faceZ + dir * -0.02, faceZ + dir * 0.03, hm.window);
      }
    }
    for (let x = x0 - 0.3; x > x1 + 0.6; x -= 2.2) B(x, x - 1.6, 0, 2.6, faceZ + dir * -0.02, faceZ + dir * 0.04, hm.brownShutter);
  };
  oldBuilding(-20.3, -30.8, 14.7, 24.0, 9.6, hm.oldCream);
  oldBuilding(-31.0, -42.5, 14.7, 24.0, 12.6, hm.oldPink);
  // North side, rising above the boundary wall
  oldBuilding(-21.5, -31.5, 1.5, 9.6, 9.6, hm.oldYellow, 3.1, 9.6);
  oldBuilding(-32.0, -42.5, 1.5, 9.6, 6.8, hm.oldCream, 3.1, 9.6);
  // Lane end closure
  B(-42.5, -45.0, 0, 11.5, 9.0, 15.5, hm.oldPink);
  for (let y = 3.1; y < 11; y += 3.1) B(-42.46, -42.5, y + 0.8, y + 2.2, 11.6, 12.9, hm.window);

  // Concrete utility poles along the lane
  for (const x of [-13.0, -27.0, -39.0]) cylinder(g, 0.09, 0.13, 8.2, [x, 4.1, 10.5], m.concrete, 10);

  return g;
}
