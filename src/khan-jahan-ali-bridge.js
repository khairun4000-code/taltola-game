import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Exact arched road-deck height profile Y(localX) sampled from
 * `Bridge_Deck_Asphalt_SV` inside `public/assets/khan_jahan_ali_bridge.glb`.
 */
const DECK_PROFILE = [
  [-257, 7.22],
  [-240, 7.86],
  [-220, 10.06],
  [-200, 12.59],
  [-180, 14.13],
  [-160, 14.78],
  [-140, 15.46],
  [-120, 16.04],
  [-100, 16.53],
  [-80, 16.92],
  [-60, 17.21],
  [-40, 17.40],
  [-20, 17.50],
  [0, 17.51],
  [20, 17.50],
  [40, 17.40],
  [60, 17.21],
  [80, 16.92],
  [100, 16.53],
  [120, 16.04],
  [140, 15.46],
  [160, 14.78],
  [180, 14.08],
  [200, 11.73],
  [220, 8.64],
  [240, 7.62],
  [286, 7.62],
];

export function sampleBridgeDeckY(localX) {
  if (localX <= DECK_PROFILE[0][0]) return DECK_PROFILE[0][1];
  const last = DECK_PROFILE[DECK_PROFILE.length - 1];
  if (localX >= last[0]) return last[1];
  for (let i = 0; i < DECK_PROFILE.length - 1; i++) {
    const [x0, y0] = DECK_PROFILE[i];
    const [x1, y1] = DECK_PROFILE[i + 1];
    if (localX <= x1) {
      const t = (localX - x0) / (x1 - x0);
      return y0 + (y1 - y0) * t;
    }
  }
  return last[1];
}

function sampleBridgeSlopeRad(localX) {
  const y0 = sampleBridgeDeckY(localX - 2.0);
  const y1 = sampleBridgeDeckY(localX + 2.0);
  return Math.atan2(y1 - y0, 4.0);
}

/** Soft additive radial glow sprite texture for realistic night streetlamps & nav beacons */
let _sharedGlowTex = null;
function getGlowSpriteTexture() {
  if (_sharedGlowTex) return _sharedGlowTex;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  g.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  g.addColorStop(0.22, 'rgba(255, 244, 214, 0.72)');
  g.addColorStop(0.55, 'rgba(255, 200, 110, 0.22)');
  g.addColorStop(1.0, 'rgba(255, 180, 80, 0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  _sharedGlowTex = new THREE.CanvasTexture(c);
  _sharedGlowTex.colorSpace = THREE.SRGBColorSpace;
  return _sharedGlowTex;
}

/** High-detail Bangladeshi Coastal Cargo Ship / Lighter Vessel (লাইটারেজ জাহাজ) passing under the bridge */
function buildCargoShip(mats, nightEmissives) {
  const g = new THREE.Group();

  // Steel hull + anti-fouling red lower waterline + tapered bow
  const hullLower = new THREE.Mesh(new THREE.BoxGeometry(8.2, 1.6, 36.0), mats.hullRed);
  hullLower.position.set(0, 0.75, 0);
  hullLower.castShadow = true;
  g.add(hullLower);

  const hullUpper = new THREE.Mesh(new THREE.BoxGeometry(8.4, 2.2, 36.4), mats.hullNavy);
  hullUpper.position.set(0, 2.5, 0);
  hullUpper.castShadow = true;
  hullUpper.receiveShadow = true;
  g.add(hullUpper);

  // Tapered steel bow prow
  const bow = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 4.4, 7.6, 4), mats.hullNavy);
  bow.rotation.x = Math.PI * 0.5;
  bow.rotation.z = Math.PI * 0.25;
  bow.scale.set(1.0, 0.58, 1.0);
  bow.position.set(0, 2.35, 21.8);
  bow.castShadow = true;
  g.add(bow);

  // Main deck + 3 cargo hold hatch covers (clinker / coal / grain bulk carrier)
  const deck = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.22, 35.0), mats.deckRust);
  deck.position.set(0, 3.68, 0);
  g.add(deck);

  for (const hz of [11.0, 2.5, -6.0]) {
    const coaming = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.25, 6.8), mats.steelGrey);
    coaming.position.set(0, 4.38, hz);
    coaming.castShadow = true;
    g.add(coaming);
    const hatch = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.22, 7.0), mats.hatchBlue);
    hatch.position.set(0, 5.08, hz);
    g.add(hatch);
  }

  // Stern white crew accommodation superstructure + bridge wheelhouse
  const cabin1 = new THREE.Mesh(new THREE.BoxGeometry(6.8, 2.8, 7.2), mats.whiteCabin);
  cabin1.position.set(0, 5.1, -13.8);
  cabin1.castShadow = true;
  g.add(cabin1);

  const cabin2 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.3, 5.4), mats.whiteCabin);
  cabin2.position.set(0, 7.6, -14.2);
  cabin2.castShadow = true;
  g.add(cabin2);

  // Glowing wheelhouse & cabin windows at night
  const winMat = mats.cabinGlow.clone();
  nightEmissives.push({ mat: winMat, day: 0.22, night: 2.6 });
  const bridgeWin = new THREE.Mesh(new THREE.BoxGeometry(5.72, 0.95, 2.8), winMat);
  bridgeWin.position.set(0, 7.9, -12.6);
  g.add(bridgeWin);
  const sideWin = new THREE.Mesh(new THREE.BoxGeometry(6.92, 0.72, 5.2), winMat);
  sideWin.position.set(0, 5.3, -13.8);
  g.add(sideWin);

  // Smokestack funnel + radar mast
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.78, 2.6, 10), mats.funnelOrange);
  funnel.position.set(0, 9.8, -15.6);
  g.add(funnel);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 3.6, 8), mats.steelGrey);
  mast.position.set(0, 10.5, -13.2);
  g.add(mast);

  // Navigation lights (Port Red, Starboard Green, Masthead White)
  const navWhite = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), mats.navWhite);
  navWhite.position.set(0, 12.35, -13.2);
  g.add(navWhite);
  const navRed = new THREE.Mesh(new THREE.SphereGeometry(0.20, 8, 6), mats.navRed);
  navRed.position.set(-3.2, 8.6, -12.2);
  g.add(navRed);
  const navGreen = new THREE.Mesh(new THREE.SphereGeometry(0.20, 8, 6), mats.navGreen);
  navGreen.position.set(3.2, 8.6, -12.2);
  g.add(navGreen);

  // Soft white water wake trail behind stern
  const wake = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 16.0), mats.wakeFoam);
  wake.rotation.x = -Math.PI * 0.5;
  wake.position.set(0, 0.08, -26.0);
  g.add(wake);

  return g;
}

/** 2-Deck Bangladeshi Passenger Launch / River Cruiser gliding under the bridge */
function buildRiverLaunch(mats, nightEmissives) {
  const g = new THREE.Group();

  const hull = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.8, 24.0), mats.hullNavy);
  hull.position.set(0, 0.9, 0);
  hull.castShadow = true;
  g.add(hull);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(6.55, 0.28, 24.2), mats.funnelOrange);
  stripe.position.set(0, 1.82, 0);
  g.add(stripe);

  const bow = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 3.3, 5.2, 4), mats.hullNavy);
  bow.rotation.x = Math.PI * 0.5;
  bow.rotation.z = Math.PI * 0.25;
  bow.scale.set(1.0, 0.48, 1.0);
  bow.position.set(0, 1.0, 14.5);
  g.add(bow);

  const deck1 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.2, 19.5), mats.whiteCabin);
  deck1.position.set(0, 3.0, -0.8);
  deck1.castShadow = true;
  g.add(deck1);

  const roof1 = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.20, 20.4), mats.deckGreen);
  roof1.position.set(0, 4.18, -0.8);
  g.add(roof1);

  const deck2 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.9, 13.0), mats.whiteCabin);
  deck2.position.set(0, 5.2, -1.2);
  g.add(deck2);

  const roof2 = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.18, 13.8), mats.deckGreen);
  roof2.position.set(0, 6.22, -1.2);
  g.add(roof2);

  const winMat = mats.cabinGlow.clone();
  nightEmissives.push({ mat: winMat, day: 0.28, night: 2.8 });
  const w1 = new THREE.Mesh(new THREE.BoxGeometry(5.72, 0.9, 16.5), winMat);
  w1.position.set(0, 3.1, -0.8);
  g.add(w1);
  const w2 = new THREE.Mesh(new THREE.BoxGeometry(4.52, 0.8, 10.5), winMat);
  w2.position.set(0, 5.25, -1.2);
  g.add(w2);

  const mastLight = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), mats.navRed);
  mastLight.position.set(0, 8.2, 3.2);
  g.add(mastLight);

  const wake = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 12.0), mats.wakeFoam);
  wake.rotation.x = -Math.PI * 0.5;
  wake.position.set(0, 0.08, -18.0);
  g.add(wake);

  return g;
}

/** Low-profile Bangladeshi Sand Bulkhead Barge (বালুর বাল্কহেড) */
function buildSandBulkhead(mats) {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.4, 22.0), mats.hullRed);
  hull.position.set(0, 0.65, 0);
  hull.castShadow = true;
  g.add(hull);

  // Mound of golden Rupsha river sand inside hold
  const sand = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.3, 13.5, 6), mats.sandMound);
  sand.rotation.x = Math.PI * 0.5;
  sand.scale.set(1.0, 0.65, 1.0);
  sand.position.set(0, 1.65, 1.5);
  g.add(sand);

  // Rear tin engine cabin
  const cab = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.9, 3.6), mats.hatchBlue);
  cab.position.set(0, 2.1, -8.2);
  g.add(cab);

  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mats.navWhite);
  lamp.position.set(0, 3.35, -7.0);
  g.add(lamp);

  const wake = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 10.0), mats.wakeFoam);
  wake.rotation.x = -Math.PI * 0.5;
  wake.position.set(0, 0.08, -16.0);
  g.add(wake);

  return g;
}

/** Lightweight bridge-deck traffic vehicle (Bus / Truck / Car) with glowing headlights & taillights */
function buildBridgeTrafficVehicle(type, mats) {
  const g = new THREE.Group();
  const isBus = type === 'bus';
  const isTruck = type === 'truck';
  const len = isBus ? 9.2 : (isTruck ? 6.8 : 4.2);
  const wid = isBus ? 2.45 : (isTruck ? 2.25 : 1.82);
  const hgt = isBus ? 2.75 : (isTruck ? 2.45 : 1.38);

  const bodyMat = isBus ? mats.busWhite : (isTruck ? mats.funnelOrange : mats.carSilver);
  const body = new THREE.Mesh(new THREE.BoxGeometry(len, hgt, wid), bodyMat);
  body.position.set(0, hgt * 0.5 + 0.42, 0);
  body.castShadow = false;
  g.add(body);

  if (isBus) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(len + 0.04, 0.42, wid + 0.04), mats.funnelOrange);
    stripe.position.set(0, 1.45, 0);
    g.add(stripe);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(len * 0.86, 0.92, wid + 0.05), mats.glassDark);
    glass.position.set(0, 2.25, 0);
    g.add(glass);
  }

  // Front glowing headlights (+X) & rear red taillights (-X)
  for (const lz of [-wid * 0.34, wid * 0.34]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.36), mats.headlight);
    hl.position.set(len * 0.5 + 0.04, 0.95, lz);
    g.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.36), mats.taillight);
    tl.position.set(-len * 0.5 - 0.04, 0.95, lz);
    g.add(tl);
  }

  return g;
}

/**
 * Loads `public/assets/khan_jahan_ali_bridge.glb` and enriches it with:
 *  - High-quality PBR textures (16x anisotropy, crisp shadows, env reflections)
 *  - Dynamic day/night bridge streetlamp LEDs, red pier beacons, green channel beacons,
 *    toll plaza LED lane signs, soft additive night light halos, and warm deck PointLights
 *  - Animated toll plaza barrier arms (6 rigged lanes)
 *  - Animated ships (coastal cargo ship, passenger launch, sand bulkhead) passing underneath
 *  - Animated bridge-deck vehicles crossing along the exact parabolic deck profile
 */
export function buildKhanJahanAliBridge(options = {}) {
  const {
    position = [135, -0.35, 195],
    scale = 0.72,
    rotationY = 0,
    shipTravelRangeZ = 155,
    enableDeckTraffic = true,
    enablePointLights = true,
    glbUrl = './assets/khan_jahan_ali_bridge.glb',
  } = options;

  const root = new THREE.Group();
  root.name = 'KhanJahanAliBridge_UltraGLB';
  root.position.set(position[0], position[1], position[2]);
  root.rotation.y = rotationY;
  root.scale.setScalar(scale);

  const modelAnchor = new THREE.Group();
  modelAnchor.name = 'Bridge_GLB_Anchor';
  root.add(modelAnchor);

  const effectsGroup = new THREE.Group();
  effectsGroup.name = 'Bridge_NightLights_And_Ships';
  root.add(effectsGroup);

  const nightEmissives = [];
  const nightSprites = [];
  const nightPointLights = [];
  const tollBarriers = [];
  let currentNightFactor = 0;

  // Shared materials for ships, wakes, and bridge deck vehicles
  const shipMats = {
    hullNavy: new THREE.MeshStandardMaterial({ color: 0x162b47, roughness: 0.44, metalness: 0.28 }),
    hullRed: new THREE.MeshStandardMaterial({ color: 0x8c2323, roughness: 0.55, metalness: 0.18 }),
    deckRust: new THREE.MeshStandardMaterial({ color: 0x5c3c2e, roughness: 0.78, metalness: 0.15 }),
    deckGreen: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.68 }),
    steelGrey: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.50, metalness: 0.55 }),
    hatchBlue: new THREE.MeshStandardMaterial({ color: 0x1e4e79, roughness: 0.52, metalness: 0.35 }),
    whiteCabin: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.36, metalness: 0.06 }),
    funnelOrange: new THREE.MeshStandardMaterial({ color: 0xd9480f, roughness: 0.42, metalness: 0.22 }),
    sandMound: new THREE.MeshStandardMaterial({ color: 0xc2a36b, roughness: 0.94 }),
    cabinGlow: new THREE.MeshStandardMaterial({ color: 0xffefc2, emissive: 0xffc864, emissiveIntensity: 0.25, roughness: 0.2 }),
    navWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4d6, emissiveIntensity: 1.6 }),
    navRed: new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff1e1e, emissiveIntensity: 1.8 }),
    navGreen: new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 1.8 }),
    wakeFoam: new THREE.MeshBasicMaterial({ color: 0xdbeafe, transparent: true, opacity: 0.30, depthWrite: false }),
    busWhite: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.1 }),
    carSilver: new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.28, metalness: 0.55 }),
    glassDark: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.12, metalness: 0.4 }),
    headlight: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6d6, emissiveIntensity: 2.2 }),
    taillight: new THREE.MeshStandardMaterial({ color: 0xff2a2a, emissive: 0xff1111, emissiveIntensity: 2.0 }),
  };

  nightEmissives.push(
    { mat: shipMats.navWhite, day: 1.2, night: 4.5 },
    { mat: shipMats.navRed, day: 1.2, night: 4.8 },
    { mat: shipMats.navGreen, day: 1.2, night: 4.8 },
    { mat: shipMats.headlight, day: 1.2, night: 5.0 },
    { mat: shipMats.taillight, day: 1.0, night: 4.2 },
  );

  // --------------------------------------------------------------------------
  // 1) NIGHT GLOW HALOS & WARM POINT LIGHTS ALONG BRIDGE DECK, PIERS & TOLL PLAZA
  // --------------------------------------------------------------------------
  const glowTex = getGlowSpriteTexture();
  function addGlowHalo(x, y, z, colorHex, spriteScale, dayOpacity, nightOpacity) {
    const mat = new THREE.SpriteMaterial({
      map: glowTex,
      color: colorHex,
      transparent: true,
      opacity: dayOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sp = new THREE.Sprite(mat);
    sp.position.set(x, y, z);
    sp.scale.set(spriteScale, spriteScale, 1);
    effectsGroup.add(sp);
    nightSprites.push({ mat, day: dayOpacity, night: nightOpacity });
  }

  // CobraHead streetlamp warm golden halos spaced along both sides of the arched deck
  for (let lx = -220; lx <= 220; lx += 36) {
    const deckY = sampleBridgeDeckY(lx);
    const lampY = deckY + 8.6;
    addGlowHalo(lx, lampY, -7.8, 0xffd27d, 9.5, 0.0, 0.72);
    addGlowHalo(lx, lampY, 7.8, 0xffd27d, 9.5, 0.0, 0.72);
  }
  // Red river pier navigation beacon halos & green main shipping channel beacon halos
  for (const px of [-102, -68, 68, 100]) {
    addGlowHalo(px, 4.15, -9.2, 0xff3030, 5.2, 0.15, 0.88);
    addGlowHalo(px, 4.15, 9.2, 0xff3030, 5.2, 0.15, 0.88);
  }
  for (const gx of [-34, 32]) {
    addGlowHalo(gx, 4.15, -9.2, 0x22ff66, 5.8, 0.18, 0.92);
    addGlowHalo(gx, 4.15, 9.2, 0x22ff66, 5.8, 0.18, 0.92);
  }
  // Toll Plaza canopy warm illumination halos (East end x ≈ 256)
  for (const tz of [-11, -3.5, 3.5, 11]) {
    addGlowHalo(256, 13.8, tz, 0xffe4a0, 10.5, 0.05, 0.78);
  }

  if (enablePointLights) {
    const lightSpecs = [
      [-120, sampleBridgeDeckY(-120) + 9.0, 0, 0xffcc70, 95 * scale, 1.5],
      [0, sampleBridgeDeckY(0) + 9.5, 0, 0xffd27d, 115 * scale, 1.4],
      [120, sampleBridgeDeckY(120) + 9.0, 0, 0xffcc70, 95 * scale, 1.5],
      [256, 15.5, 0, 0xffe6b0, 85 * scale, 1.4],
    ];
    for (const [lx, ly, lz, col, dist, decay] of lightSpecs) {
      const pl = new THREE.PointLight(col, 0, dist, decay);
      pl.position.set(lx, ly, lz);
      effectsGroup.add(pl);
      nightPointLights.push(pl);
    }
  }

  // --------------------------------------------------------------------------
  // 2) ANIMATED SHIPS & VESSELS PASSING UNDERNEATH THE BRIDGE ARCHES
  // --------------------------------------------------------------------------
  const passingShips = [];
  const halfSpanZ = shipTravelRangeZ / Math.max(0.25, scale);

  const shipConfigs = [
    // Main green-beacon navigation channel: Large Bangladeshi Coastal Cargo Ship (North -> South)
    { mesh: buildCargoShip(shipMats, nightEmissives), x: -6, dirZ: 1, speed: 7.4, phase: 0.12, amp: 0.10, bobSpeed: 0.95 },
    // Adjacent channel: 2-Deck Bangladeshi Passenger Launch (South -> North)
    { mesh: buildRiverLaunch(shipMats, nightEmissives), x: 22, dirZ: -1, speed: 9.2, phase: 0.56, amp: 0.09, bobSpeed: 1.15 },
    // West river span: Sand Bulkhead Barge (North -> South)
    { mesh: buildSandBulkhead(shipMats), x: -58, dirZ: 1, speed: 6.2, phase: 0.78, amp: 0.08, bobSpeed: 1.25 },
  ];

  for (const sc of shipConfigs) {
    sc.mesh.position.set(sc.x, 0.0, 0);
    sc.mesh.rotation.y = sc.dirZ > 0 ? 0 : Math.PI;
    effectsGroup.add(sc.mesh);
    passingShips.push(sc);
  }

  // --------------------------------------------------------------------------
  // 3) ANIMATED BRIDGE-DECK TRAFFIC CROSSING THE ARCHED ROADWAY
  // --------------------------------------------------------------------------
  const deckVehicles = [];
  if (enableDeckTraffic) {
    const vehicleSpecs = [
      { type: 'bus', dir: 1, laneZ: 3.4, speed: 15.0, phase: 0.05 },
      { type: 'car', dir: 1, laneZ: 6.6, speed: 20.5, phase: 0.42 },
      { type: 'truck', dir: 1, laneZ: 3.4, speed: 12.8, phase: 0.74 },
      { type: 'bus', dir: -1, laneZ: -3.4, speed: 14.5, phase: 0.22 },
      { type: 'car', dir: -1, laneZ: -6.6, speed: 21.5, phase: 0.61 },
      { type: 'truck', dir: -1, laneZ: -3.4, speed: 13.2, phase: 0.89 },
    ];
    for (const vs of vehicleSpecs) {
      const vm = buildBridgeTrafficVehicle(vs.type, shipMats);
      effectsGroup.add(vm);
      deckVehicles.push({ ...vs, mesh: vm });
    }
  }

  // --------------------------------------------------------------------------
  // 4) LOAD ULTRA-REALISTIC KHAN JAHAN ALI BRIDGE GLB MODEL
  // --------------------------------------------------------------------------
  function applyNightFactor(nf) {
    currentNightFactor = Math.max(0, Math.min(1, nf || 0));
    for (const e of nightEmissives) {
      e.mat.emissiveIntensity = e.day + (e.night - e.day) * currentNightFactor;
    }
    for (const sp of nightSprites) {
      sp.mat.opacity = sp.day + (sp.night - sp.day) * currentNightFactor;
      sp.mat.needsUpdate = false;
    }
    const plIntensity = currentNightFactor * 52.0;
    for (const pl of nightPointLights) {
      pl.intensity = plIntensity;
    }
  }

  const loader = new GLTFLoader();
  loader.load(
    glbUrl,
    (gltf) => {
      const model = gltf.scene;
      model.traverse((obj) => {
        if (obj.name && obj.name.startsWith('Toll_Barrier_Arm_')) {
          tollBarriers.push({
            obj,
            phase: tollBarriers.length * 1.15,
          });
        }
        if (!obj.isMesh) return;
        obj.castShadow = true;
        obj.receiveShadow = true;

        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const mat of mats) {
          if (!mat) continue;
          if (mat.map) mat.map.anisotropy = 16;
          if (mat.normalMap) mat.normalMap.anisotropy = 16;
          if (mat.roughnessMap) mat.roughnessMap.anisotropy = 16;
          if ('envMapIntensity' in mat) mat.envMapIntensity = 0.92;

          const mName = (mat.name || '').toLowerCase();
          if (mName.includes('cobrahead_led')) {
            mat.emissive = new THREE.Color(0xffd27d);
            nightEmissives.push({ mat, day: 0.45, night: 4.8 });
          } else if (mName.includes('beacon_red')) {
            mat.emissive = new THREE.Color(0xff2020);
            nightEmissives.push({ mat, day: 1.0, night: 4.5 });
          } else if (mName.includes('beacon_green')) {
            mat.emissive = new THREE.Color(0x22ee55);
            nightEmissives.push({ mat, day: 1.0, night: 4.5 });
          } else if (mName.includes('sign_lane_led') || mName.includes('scrolling_led')) {
            nightEmissives.push({ mat, day: 0.7, night: 2.6 });
          } else if (mName.includes('sign_') || mName.includes('rocket_banner')) {
            if (!mat.emissive || mat.emissive.getHex() === 0) {
              mat.emissive = new THREE.Color(0xffffff);
              if (mat.map) mat.emissiveMap = mat.map;
            }
            nightEmissives.push({ mat, day: 0.25, night: 1.55 });
          }
        }
      });

      modelAnchor.add(model);
      applyNightFactor(currentNightFactor);
    },
    undefined,
    (err) => {
      console.warn('[KhanJahanAliBridge] Failed to load GLB:', err);
    },
  );

  function update(elapsed) {
    // 1) Ships gliding underneath the bridge arches
    for (const s of passingShips) {
      const span = halfSpanZ * 2;
      const u = ((elapsed * s.speed) / span + s.phase) % 1.0;
      const z = s.dirZ > 0 ? (-halfSpanZ + u * span) : (halfSpanZ - u * span);
      s.mesh.position.z = z;
      s.mesh.position.y = Math.sin(elapsed * s.bobSpeed + s.phase * 10) * s.amp;
      s.mesh.rotation.z = Math.cos(elapsed * s.bobSpeed * 0.78 + s.phase * 8) * 0.018;
    }

    // 2) Vehicles crossing the arched bridge deck
    const minX = -250;
    const maxX = 278;
    const roadLen = maxX - minX;
    for (const v of deckVehicles) {
      const u = ((elapsed * v.speed) / roadLen + v.phase) % 1.0;
      const lx = v.dir > 0 ? (minX + u * roadLen) : (maxX - u * roadLen);
      const ly = sampleBridgeDeckY(lx);
      const slope = sampleBridgeSlopeRad(lx);
      v.mesh.position.set(lx, ly + 0.04, v.laneZ);
      v.mesh.rotation.set(0, v.dir > 0 ? 0 : Math.PI, v.dir > 0 ? slope : -slope);
    }

    // 3) Smoothly animate Toll Plaza barrier arms lifting & closing
    for (const tb of tollBarriers) {
      const wave = Math.sin(elapsed * 0.65 + tb.phase);
      const openAmt = Math.max(0, (wave - 0.15) / 0.85);
      tb.obj.rotation.x = openAmt * 1.25;
    }
  }

  return {
    root,
    update,
    setNightFactor: applyNightFactor,
  };
}
