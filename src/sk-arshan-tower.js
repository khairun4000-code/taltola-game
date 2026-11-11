import * as THREE from 'three';
import { box, cylinder, rodBetween, mergeStaticMeshes } from './scene-utils.js';

/**
 * SK ARSHAN ALIF TOWER (শেখ আরশান আলিফ টাওয়ার) — 35 Haji Mohsin Road, Khulna
 * + FAKIR BARI LANE (পাশের গলি)
 *
 * 1:1 Photorealistic Exterior from Google Street View + Ultra High-Fi Enterable Multi-Floor Interior:
 *  - Ground Floor (y = 0.50m): Walkable concrete car ramp & south granite steps, interactive sliding
 *    steel-bar parking gate, Grand Parking Deck (Red Sedan, Black Luxury SUV, Sport Bike),
 *    Swirl-Marble Security & Concierge Lobby, Interactive High-Speed Elevator + Continuous Walkable Staircase.
 *  - Floors 1..9 (y = 4.0m .. 28.0m): Fully enterable Luxury Apartments on every floor:
 *      • Central Marble Lift & Stair Lobby + Walkable Bay B Recessed Balcony
 *      • North Wing Flat A: Grand Living Room (Velvet L-Sofa, 75" 4K Smart TV, False Ceiling Cove Lights,
 *        Walkable Bay A Corner Balcony behind the real Coaching Banner) + Master Bedroom overlooking Fakir Bari Lane
 *      • South Wing Flat B: 6-Seater Marble Dining Room, Modular Kitchen + Smart Fridge, Walkable Bay C Balcony,
 *        and RGB Dual-Monitor Gaming & Executive Study Suite!
 *  - Rooftop Sky Lounge (y = 31.0m): Walkable Rooftop Garden, Pergola Sky Lounge, Outdoor Sofas & Panoramic View.
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

function createLobbySignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 1024, 256);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.5, '#1e293b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 256);

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 8;
  ctx.strokeRect(12, 12, 1000, 232);
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, 976, 208);

  ctx.fillStyle = '#fde68a';
  ctx.font = '900 54px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('SK ARSHAN ALIF TOWER', 512, 92);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 46px Arial';
  ctx.fillText('শেখ আরশান আলিফ টাওয়ার', 512, 158);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 28px Arial';
  ctx.fillText('৩৫, হাজী মহসিন রোড (ফকির বাড়ি লেন মোড়), খুলনা · VIP LUXURY RESIDENCE', 512, 212);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSmartTVTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 288;
  const ctx = canvas.getContext('2d');

  const sky = ctx.createLinearGradient(0, 0, 0, 288);
  sky.addColorStop(0, '#0284c7');
  sky.addColorStop(0.55, '#38bdf8');
  sky.addColorStop(0.6, '#15803d');
  sky.addColorStop(1, '#064e3b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 512, 288);

  // Glowing sun & Sundarbans river reflection
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(380, 82, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
  ctx.fillRect(0, 232, 512, 56);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('▶  4K ULTRA HD SMART TV · KHULNA LIVE', 24, 266);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createLiftDisplayTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 256, 512);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 240, 496);

  ctx.fillStyle = '#ef4444';
  ctx.font = '900 68px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('▲ G-10', 128, 92);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 26px Arial';
  ctx.fillText('HIGH-SPEED LIFT', 128, 145);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('লিফট চালু আছে', 128, 185);

  const floors = ['R · ছাদ (Sky Lounge)', '9F · Penthouse', '7F · Sky Suite', '4F · Duplex Flat', '2F · Model Flat', '1F · Coaching & Flat', 'GF · Grand Lobby'];
  ctx.font = 'bold 20px Arial';
  floors.forEach((f, i) => {
    ctx.fillStyle = i % 2 === 0 ? '#1e293b' : '#0f172a';
    ctx.fillRect(22, 210 + i * 38, 212, 32);
    ctx.fillStyle = '#fde68a';
    ctx.fillText(f, 128, 233 + i * 38);
  });

  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('PRESS [E] TO RIDE', 128, 492);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
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
    glass: std({ color: 0x2a5a80, roughness: 0.08, metalness: 0.3, emissive: 0x08141e, transparent: true, opacity: 0.72 }),
    clearGlass: std({ color: 0x99d5ff, roughness: 0.06, metalness: 0.2, transparent: true, opacity: 0.38 }),
    frame: lam({ color: 0x50565a }),
    steel: std({ color: 0xc7cbcf, roughness: 0.28, metalness: 0.55 }),
    gold: std({ color: 0xf59e0b, roughness: 0.25, metalness: 0.7, emissive: 0x3b2506 }),
    railGrey: lam({ color: 0x8f969b }),
    grilleBar: lam({ color: 0xa3a9ad }),
    dark: lam({ color: 0x17191b }),
    window: lam({ color: 0x2b3134 }),
    ac: lam({ color: 0xeceeea }),
    acFan: lam({ color: 0x33373a }),
    plant: lam({ color: 0x2e7d32 }),
    terracotta: lam({ color: 0x9c4a2d }),
    redCar: std({ color: 0xb91c1c, roughness: 0.25, metalness: 0.35 }),
    blackSuv: std({ color: 0x1e293b, roughness: 0.22, metalness: 0.45 }),
    carGlass: std({ color: 0x0f172a, roughness: 0.1, metalness: 0.5 }),
    headlight: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
    taillight: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
    tyre: lam({ color: 0x141414 }),
    rubble: lam({ color: 0xb3ada2 }),
    brickRed: lam({ color: 0x9a4a36 }),
    banner: lam({ map: loadTex('balcony-banner.jpg'), side: THREE.DoubleSide }),
    signMcsk: lam({ map: loadTex('sign-mcsk.jpg'), side: THREE.DoubleSide }),
    signShetu: lam({ map: loadTex('sign-shetu.jpg'), side: THREE.DoubleSide }),
    // High-Fi Interior Luxury Materials
    creamTile: std({ map: stuccoMap, color: 0xf5f2eb, roughness: 0.18, metalness: 0.05 }, 2.5),
    wallCream: lam({ color: 0xfbf9f5 }),
    wallAccent: lam({ color: 0xe2e8f0 }),
    woodWalnut: std({ color: 0x5c3a21, roughness: 0.42, metalness: 0.06 }),
    woodOak: std({ color: 0xa47551, roughness: 0.48 }),
    velvetBlue: lam({ color: 0x1d4ed8 }),
    velvetCream: lam({ color: 0xe5e0d8 }),
    velvetEmerald: lam({ color: 0x047857 }),
    rugPattern: lam({ color: 0x7c2d12 }),
    bedSheet: lam({ color: 0xf8fafc }),
    bedBlanket: lam({ color: 0x0284c7 }),
    ledWarm: new THREE.MeshBasicMaterial({ color: 0xfffbeb }),
    ledCyan: new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
    ledMagenta: new THREE.MeshBasicMaterial({ color: 0xe879f9 }),
    yellowLine: new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
    lobbySign: new THREE.MeshBasicMaterial({ map: createLobbySignTexture() }),
    smartTv: new THREE.MeshBasicMaterial({ map: createSmartTVTexture() }),
    liftDisplay: new THREE.MeshBasicMaterial({ map: createLiftDisplayTexture() }),
    turfGreen: lam({ color: 0x15803d }),
  };
}

/** Axis-aligned box from min/max extents. */
function makeB(parent) {
  return (x0, x1, y0, y1, z0, z1, mat, opts) => box(
    parent,
    [Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)],
    [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2],
    mat,
    opts,
  );
}

/** Balcony railing: top rail + mid rail + thin vertical balusters. */
function railingAlongZ(B, parent, hm, x, z0, z1, y, h = 1.0, spacing = 0.14) {
  rodBetween(parent, [x, y + h, z0], [x, y + h, z1], 0.026, hm.steel, 8);
  rodBetween(parent, [x, y + 0.12, z0], [x, y + 0.12, z1], 0.016, hm.railGrey, 6);
  for (let z = Math.min(z0, z1) + 0.05; z <= Math.max(z0, z1) - 0.02; z += spacing) {
    B(x - 0.012, x + 0.012, y + 0.1, y + h, z - 0.012, z + 0.012, hm.railGrey, { castShadow: false });
  }
}

function railingAlongX(B, parent, hm, z, x0, x1, y, h = 1.0, spacing = 0.14) {
  rodBetween(parent, [x0, y + h, z], [x1, y + h, z], 0.026, hm.steel, 8);
  rodBetween(parent, [x0, y + 0.12, z], [x1, y + 0.12, z], 0.016, hm.railGrey, 6);
  for (let x = Math.min(x0, x1) + 0.05; x <= Math.max(x0, x1) - 0.02; x += spacing) {
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
    const fan = cylinder(parent, 0.19, 0.19, 0.02, [x + 0.31, y + 0.275, z - 0.08], hm.acFan, 14);
    fan.rotation.z = Math.PI / 2;
  } else {
    B(x - 0.4, x + 0.4, y, y + 0.55, z - 0.3, z, hm.ac);
    const fan = cylinder(parent, 0.19, 0.19, 0.02, [x - 0.08, y + 0.275, z - 0.31], hm.acFan, 14);
    fan.rotation.x = Math.PI / 2;
  }
}

/** Builds a detailed luxury apartment interior for floor k (y = L(k)). */
function buildApartmentFloorInterior(parent, hm, y) {
  const B = makeB(parent);
  const fy = y + 0.02; // top of floor slab

  // 1. Central Elevator & Stair Lobby (z = 18.6 .. 23.2, x = -5.6 .. -14.5)
  // Swirl-marble elevator front wall at x = -11.8, z = 18.7 .. 20.6
  B(-11.6, -12.1, fy, y + 2.74, 18.7, 20.6, hm.marble);
  // Brushed stainless-steel elevator doors
  B(-11.55, -11.6, fy + 0.02, y + 2.25, 19.05, 19.62, hm.steel);
  B(-11.55, -11.6, fy + 0.02, y + 2.25, 19.65, 20.22, hm.steel);
  B(-11.53, -11.62, y + 2.25, y + 2.42, 18.98, 20.30, hm.dark);
  // Digital Lift Panel beside elevator door
  B(-11.54, -11.58, fy + 0.95, fy + 1.75, 18.68, 19.02, hm.liftDisplay);
  // Ceiling LED panels in lobby
  B(-7.0, -8.5, y + 2.71, y + 2.74, 20.0, 21.2, hm.ledWarm);
  B(-9.5, -11.0, y + 2.71, y + 2.74, 19.2, 20.4, hm.ledWarm);

  // Partition walls separating Central Lobby from North Flat A (z = 18.6) & South Flat B (z = 23.2)
  // North Flat A entrance doorway is open at x = -7.2 .. -8.6!
  B(-5.6, -7.2, fy, y + 2.74, 18.55, 18.72, hm.wallCream);
  B(-8.6, -19.7, fy, y + 2.74, 18.55, 18.72, hm.wallCream);
  B(-7.2, -8.6, y + 2.22, y + 2.74, 18.55, 18.72, hm.wallCream);
  // Open wooden door leaf swung into Flat A
  B(-8.55, -8.65, fy, y + 2.2, 17.35, 18.55, hm.woodWalnut);

  // South Flat B entrance doorway is open at x = -7.2 .. -8.6!
  B(-5.6, -7.2, fy, y + 2.74, 23.18, 23.35, hm.wallCream);
  B(-8.6, -19.7, fy, y + 2.74, 23.18, 23.35, hm.wallCream);
  B(-7.2, -8.6, y + 2.22, y + 2.74, 23.18, 23.35, hm.wallCream);
  B(-8.55, -8.65, fy, y + 2.2, 23.35, 24.55, hm.woodWalnut);

  // 2. NORTH WING (FLAT A): Grand Living Lounge (x = -4.3 .. -13.3, z = 14.8 .. 18.55)
  // Partition wall between Living Lounge and Master Bedroom at x = -13.3 (open doorway at z = 16.0 .. 17.3)
  B(-13.22, -13.38, fy, y + 2.74, 14.8, 16.0, hm.wallCream);
  B(-13.22, -13.38, fy, y + 2.74, 17.3, 18.55, hm.wallCream);
  B(-13.22, -13.38, y + 2.22, y + 2.74, 16.0, 17.3, hm.wallCream);

  // Designer Persian Rug & L-Shaped Velvet Sofa in Living Lounge
  B(-6.5, -10.8, fy, fy + 0.02, 15.3, 18.1, hm.rugPattern);
  // Sofa back along north/lane wall (z = 15.0 .. 15.85) + L-chaise along x = -10.2 .. -11.1
  B(-6.6, -11.0, fy + 0.02, fy + 0.44, 15.05, 15.95, hm.velvetBlue);
  B(-6.6, -11.0, fy + 0.44, fy + 0.88, 15.02, 15.28, hm.velvetBlue);
  B(-10.1, -11.0, fy + 0.02, fy + 0.44, 15.95, 17.65, hm.velvetBlue);
  B(-10.75, -11.0, fy + 0.44, fy + 0.88, 15.28, 17.65, hm.velvetBlue);
  // Accent cushions
  for (const cz of [15.4, 16.2, 17.1]) {
    B(-10.45, -10.72, fy + 0.45, fy + 0.72, cz - 0.2, cz + 0.2, hm.velvetCream);
  }
  // Marble & Gold Coffee Table
  B(-7.5, -9.3, fy + 0.38, fy + 0.44, 16.35, 17.25, hm.marble);
  B(-7.6, -9.2, fy + 0.02, fy + 0.38, 16.45, 17.15, hm.gold);

  // 75-Inch Wall-Mounted 4K Smart TV & Walnut Media Console on South Wall (z = 18.48)
  B(-6.8, -10.2, fy + 0.02, fy + 0.52, 18.05, 18.52, hm.woodWalnut);
  B(-7.2, -9.8, fy + 0.92, fy + 2.12, 18.46, 18.53, hm.dark);
  B(-7.26, -9.74, fy + 0.96, fy + 2.08, 18.44, 18.46, hm.smartTv);
  // Warm false-ceiling cove light strips
  B(-6.0, -11.8, y + 2.70, y + 2.74, 15.4, 15.55, hm.ledWarm);
  B(-6.0, -11.8, y + 2.70, y + 2.74, 17.9, 18.05, hm.ledWarm);

  // 3. NORTH WING MASTER BEDROOM (x = -13.4 .. -19.6, z = 14.8 .. 18.55)
  // King-size luxury bed against west wall (x = -19.5)
  B(-16.6, -19.5, fy + 0.02, fy + 0.52, 15.6, 17.7, hm.woodWalnut);
  B(-16.7, -19.2, fy + 0.52, fy + 0.68, 15.7, 17.6, hm.bedSheet);
  B(-16.7, -18.2, fy + 0.68, fy + 0.73, 15.72, 17.58, hm.bedBlanket);
  B(-19.25, -19.55, fy + 0.52, fy + 1.48, 15.55, 17.75, hm.velvetCream); // tufted headboard
  // Pillows
  B(-18.6, -19.15, fy + 0.68, fy + 0.82, 15.85, 16.55, hm.wallCream);
  B(-18.6, -19.15, fy + 0.68, fy + 0.82, 16.75, 17.45, hm.wallCream);
  // Full-height Walnut & Mirror Wardrobe along south wall (z = 18.0 .. 18.52)
  B(-14.2, -16.4, fy + 0.02, fy + 2.45, 17.95, 18.52, hm.woodWalnut);
  B(-14.35, -16.25, fy + 0.25, fy + 2.25, 17.92, 17.95, hm.clearGlass);
  B(-15.5, -18.5, y + 2.70, y + 2.74, 16.3, 16.9, hm.ledWarm);

  // 4. SOUTH WING (FLAT B): Formal Dining & Modular Kitchen (x = -5.1 .. -13.3, z = 23.35 .. 28.3)
  B(-13.22, -13.38, fy, y + 2.74, 23.35, 24.9, hm.wallCream);
  B(-13.22, -13.38, fy, y + 2.74, 26.3, 28.3, hm.wallCream);
  B(-13.22, -13.38, y + 2.22, y + 2.74, 24.9, 26.3, hm.wallCream);

  // 6-Seater Marble Dining Table (x = -7.0 .. -9.8, z = 24.6 .. 26.2)
  B(-7.0, -9.8, fy + 0.74, fy + 0.82, 24.6, 26.2, hm.marble);
  for (const [lx, lz] of [[-7.2, 24.8], [-9.6, 24.8], [-7.2, 26.0], [-9.6, 26.0]]) {
    B(lx - 0.06, lx + 0.06, fy + 0.02, fy + 0.74, lz - 0.06, lz + 0.06, hm.gold);
  }
  for (const cx of [-7.5, -8.4, -9.3]) {
    for (const [cz, backZ] of [[24.25, 24.02], [26.55, 26.78]]) {
      B(cx - 0.24, cx + 0.24, fy + 0.02, fy + 0.46, cz - 0.22, cz + 0.22, hm.velvetEmerald);
      B(cx - 0.24, cx + 0.24, fy + 0.46, fy + 0.94, backZ - 0.05, backZ + 0.05, hm.velvetEmerald);
    }
  }
  // Modular Kitchen Counter & Double-Door Smart Fridge along south wall (z = 27.5 .. 28.25)
  B(-7.2, -12.2, fy + 0.02, fy + 0.88, 27.55, 28.25, hm.woodOak);
  B(-7.15, -12.25, fy + 0.88, fy + 0.94, 27.50, 28.26, hm.granite);
  B(-7.2, -11.2, fy + 1.55, fy + 2.35, 27.75, 28.25, hm.woodWalnut); // overhead cabinets
  B(-12.25, -13.15, fy + 0.02, fy + 1.95, 27.45, 28.25, hm.steel);   // Smart Refrigerator
  B(-7.2, -11.8, y + 2.70, y + 2.74, 25.1, 25.7, hm.ledWarm);

  // 5. SOUTH-WEST VIP RGB GAMING & STUDY SUITE (x = -13.4 .. -19.6, z = 23.35 .. 28.3)
  // L-Shaped Gaming Desk along west/south corner
  B(-18.6, -19.55, fy + 0.72, fy + 0.78, 24.2, 27.6, hm.dark);
  B(-18.65, -19.55, fy + 0.78, fy + 0.80, 24.2, 24.26, hm.ledCyan);
  B(-18.6, -18.66, fy + 0.78, fy + 0.80, 24.2, 27.6, hm.ledMagenta);
  // Dual curved gaming monitors + RGB PC Tower
  B(-19.15, -19.25, fy + 0.92, fy + 1.42, 25.0, 26.0, hm.smartTv);
  B(-19.15, -19.25, fy + 0.92, fy + 1.42, 26.1, 27.1, hm.liftDisplay);
  B(-18.8, -19.4, fy + 0.78, fy + 1.32, 24.35, 24.75, hm.ledCyan); // RGB PC case
  // Ergonomic Gaming Chair
  B(-17.8, -18.4, fy + 0.02, fy + 0.52, 25.5, 26.1, hm.redCar);
  B(-17.7, -17.82, fy + 0.52, fy + 1.25, 25.5, 26.1, hm.redCar);
  // Ceiling RGB + Warm light
  B(-15.2, -18.8, y + 2.70, y + 2.74, 25.4, 26.2, hm.ledCyan);
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

  const state = {
    gateOpen: true,      // Main parking gate open by default so player can drive/walk straight inside!
    gateSlide: 1.0,      // 0 = closed, 1 = slid open
    liftFloorIndex: 0,
  };

  // ==========================================================================
  // 1. RAISED BLACK-GRANITE PLINTH, CAR RAMP, STEPS & STAINLESS RAILINGS
  // ==========================================================================
  B(-4.6, BX, 0, PL, 14.25, EZ, hm.granite);
  // Front terrace strip (x -3.25..-4.6) with gaps for the car ramp & entrance steps
  B(-3.25, -4.6, 0, PL, 14.25, 19.2, hm.granite);
  B(-3.25, -4.6, 0, PL, 22.9, 26.6, hm.granite);
  // Grey concrete car ramp up to the parking gate (bay B: z = 19.2 .. 22.9)
  const ramp = box(g, [1.45, 0.14, 3.7], [-3.93, 0.28, 21.05], m.concrete);
  ramp.rotation.z = -Math.atan2(0.42, 1.35);
  // 3 granite steps at the south end (z = 26.6 .. 28.4)
  for (let i = 0; i < 3; i++) B(-3.25 - i * 0.42, -4.6, 0, (i + 1) * (PL / 3), 26.6, 28.4, hm.granite);
  // Stainless railings
  plinthRailZ(g, hm, -3.33, 14.33, 19.15, PL);
  plinthRailZ(g, hm, -3.33, 22.95, 26.55, PL);
  plinthRailX(g, hm, 14.33, -3.33, -6.0, PL);

  // ==========================================================================
  // 2. GROUND FLOOR GRAND PARKING & RECEPTION LOBBY (y = 0.50m .. 3.85m)
  // ==========================================================================
  // Perimeter Rear & South Walls of Ground Floor (instead of solid dark box!)
  B(BX, BX + 0.32, PL, 3.85, 14.6, EZ, hm.stucco);
  B(-4.2, BX, PL, 3.85, EZ - 0.32, EZ, hm.stucco);
  // 1st-floor ceiling / slab with stairwell opening at x ∈ [-14.2, -9.6], z ∈ [21.5, 22.85]
  B(-3.95, BX, 3.82, 4.02, SZ - 0.05, 21.5, hm.stucco);
  B(-3.95, BX, 3.82, 4.02, 22.85, EZ, hm.stucco);
  B(-3.95, -9.6, 3.82, 4.02, 21.5, 22.85, hm.stucco);
  B(-14.2, BX, 3.82, 4.02, 21.5, 22.85, hm.stucco);

  // Glowing LED Tube Lights on Ground Floor Ceiling + Yellow Parking Bay Lines
  for (const lx of [-6.8, -10.5, -14.8, -18.0]) {
    for (const lz of [16.8, 20.5, 25.2]) {
      B(lx - 0.08, lx + 0.08, 3.76, 3.82, lz - 1.1, lz + 1.1, hm.ledWarm);
    }
  }
  for (const pz of [15.5, 18.2, 24.2, 26.6]) {
    B(-5.2, -9.4, PL + 0.005, PL + 0.02, pz - 0.05, pz + 0.05, hm.yellowLine);
  }
  // Structural Columns inside Parking Deck with Yellow/Black Safety Bands
  for (const [cx, cz] of [[-8.8, 17.5], [-8.8, 23.6], [-15.2, 17.5], [-15.2, 23.6]]) {
    B(cx - 0.25, cx + 0.25, PL, 3.82, cz - 0.25, cz + 0.25, hm.grey);
    B(cx - 0.27, cx + 0.27, PL + 0.2, PL + 1.1, cz - 0.27, cz + 0.27, hm.yellowLine);
  }

  // Static Steel-Bar Grille helper (used for Bay A & Bay C)
  const grille = (z0, z1) => {
    for (let z = z0 + 0.1; z < z1 - 0.04; z += 0.2) B(-4.17, -4.27, PL, 3.72, z - 0.045, z + 0.045, hm.grilleBar);
    B(-4.14, -4.3, 3.7, 3.84, z0, z1, hm.frame);
    B(-4.14, -4.3, PL, PL + 0.07, z0, z1, hm.frame);
  };

  // Interactive Sliding Steel-Bar Parking Gate for Bay B (z = 18.9 .. 21.9, right at the car ramp!)
  const slidingGateGroup = new THREE.Group();
  slidingGateGroup.name = 'SkArshanSlidingGate';
  dynamicParent.add(slidingGateGroup);
  const BG = makeB(slidingGateGroup);
  for (let z = 19.0; z < 21.86; z += 0.2) {
    BG(-4.17, -4.27, PL, 3.72, z - 0.045, z + 0.045, hm.grilleBar);
  }
  BG(-4.14, -4.3, 3.68, 3.82, 18.9, 21.9, hm.frame);
  BG(-4.14, -4.3, PL + 0.02, PL + 0.10, 18.9, 21.9, hm.frame);
  slidingGateGroup.position.z = state.gateSlide * -2.85;

  // Front (road) ground floor piers & gates
  B(-4.0, -4.55, PL, 3.85, 14.55, 14.9, hm.granite);        // corner column
  grille(14.9, 17.0);                                       // bay A parking gate (under banner balcony)
  B(-4.0, -4.6, PL, 3.85, 17.0, 18.9, hm.granite);          // wide black granite pier
  // Bay B (18.9 .. 21.9) has the interactive slidingGateGroup!
  B(-4.0, -4.6, PL, 3.85, 21.9, 23.2, hm.granite);          // granite wall with small blue window
  B(-3.96, -4.0, 1.55, 2.55, 22.2, 22.9, hm.glass);
  B(-3.95, -4.01, 1.5, 1.55, 22.15, 22.95, hm.frame);
  B(-3.95, -4.01, 2.55, 2.6, 22.15, 22.95, hm.frame);
  B(-4.0, -4.6, PL, 3.85, 23.2, 24.0, hm.marble);           // real swirl-marble pier
  grille(24.0, 26.6);                                       // bay C parking gate (leaves 26.6..27.8 open pedestrian entry at steps!)
  B(-4.14, -4.3, 3.68, 3.84, 26.6, 27.8, hm.frame);         // top arch frame above pedestrian entry
  B(-4.0, -4.6, PL, 3.85, 27.8, 28.65, hm.marble);          // south end swirl-marble pier
  B(-4.0, -6.2, PL, 3.85, 28.3, 28.65, hm.marble);          // marble wraps the south corner

  // 1) Upgraded Red Sedan Car parked inside Bay C (z = 24.55 .. 26.25)
  B(-5.0, -9.2, PL + 0.25, PL + 0.92, 24.55, 26.25, hm.redCar);
  B(-5.8, -8.3, PL + 0.92, PL + 1.44, 24.68, 26.12, hm.redCar);
  B(-5.76, -8.34, PL + 0.94, PL + 1.38, 24.64, 26.16, hm.carGlass);
  B(-4.96, -5.02, PL + 0.55, PL + 0.78, 24.68, 25.02, hm.headlight);
  B(-4.96, -5.02, PL + 0.55, PL + 0.78, 25.78, 26.12, hm.headlight);
  B(-9.18, -9.24, PL + 0.58, PL + 0.78, 24.68, 25.08, hm.taillight);
  B(-9.18, -9.24, PL + 0.58, PL + 0.78, 25.72, 26.12, hm.taillight);
  for (const [wx, wz] of [[-5.8, 24.5], [-8.4, 24.5], [-5.8, 26.3], [-8.4, 26.3]]) {
    const wheel = cylinder(g, 0.32, 0.32, 0.22, [wx, PL + 0.32, wz], hm.tyre, 14);
    wheel.rotation.x = Math.PI / 2;
  }

  // 2) Luxury Black Prado SUV parked in North-West Bay (x = -14.5 .. -18.8, z = 15.6 .. 17.6)
  B(-14.5, -18.8, PL + 0.32, PL + 1.15, 15.6, 17.6, hm.blackSuv);
  B(-15.3, -18.5, PL + 1.15, PL + 1.82, 15.72, 17.48, hm.blackSuv);
  B(-15.25, -18.55, PL + 1.18, PL + 1.74, 15.68, 17.52, hm.carGlass);
  B(-14.46, -14.52, PL + 0.78, PL + 1.02, 15.72, 16.12, hm.headlight);
  B(-14.46, -14.52, PL + 0.78, PL + 1.02, 17.08, 17.48, hm.headlight);
  for (const [wx, wz] of [[-15.3, 15.55], [-18.0, 15.55], [-15.3, 17.65], [-18.0, 17.65]]) {
    const wheel = cylinder(g, 0.38, 0.38, 0.26, [wx, PL + 0.38, wz], hm.tyre, 14);
    wheel.rotation.x = Math.PI / 2;
  }

  // 3) Grand Reception & Concierge Desk + Illuminated Golden Nameplate + Lift Entrance (x = -11.5, z = 18.6..20.8)
  B(-9.2, -10.8, PL, PL + 1.12, 17.2, 18.5, hm.marble);
  B(-9.1, -10.9, PL + 1.12, PL + 1.20, 17.1, 18.6, hm.granite);
  B(-9.15, -10.85, PL + 0.04, PL + 0.14, 17.18, 18.52, hm.gold);
  // Dual CCTV Security Monitors on Reception Desk
  B(-9.8, -10.0, PL + 1.20, PL + 1.68, 17.5, 18.2, hm.smartTv);
  // Illuminated Golden Building Signboard on Lobby Wall (x = -11.52, z = 16.2 .. 18.5)
  B(-11.55, -12.1, PL, 3.82, 16.0, 20.8, hm.marble);
  B(-11.48, -11.54, PL + 1.85, PL + 2.75, 16.15, 18.55, hm.lobbySign);
  // Ground-Floor High-Speed Lift Doors & Digital Call Panel (x = -11.52, z = 18.95 .. 20.3)
  B(-11.50, -11.56, PL + 0.02, PL + 2.35, 19.05, 19.62, hm.steel);
  B(-11.50, -11.56, PL + 0.02, PL + 2.35, 19.65, 20.22, hm.steel);
  B(-11.48, -11.56, PL + 1.05, PL + 1.88, 18.62, 18.98, hm.liftDisplay);

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
  // 3. CONTINUOUS WALKABLE MARBLE STAIRCASE (Ground -> All 9 Floors -> Rooftop)
  //    Stair lane: x ∈ [-14.2, -9.6], z ∈ [21.55, 22.80]
  //    Climbing in -X direction (from x = -9.6 up to x = -14.1)
  // ==========================================================================
  for (let k = 0; k <= FLOORS; k++) {
    const y0 = L(k);
    const y1 = L(k + 1);
    const steps = 14;
    for (let s = 0; s < steps; s++) {
      const t0 = s / steps;
      const t1 = (s + 1) / steps;
      const sx0 = -9.65 - t0 * 4.45;
      const sx1 = -9.65 - t1 * 4.45;
      const sy = y0 + t1 * (y1 - y0);
      B(sx0, sx1, sy - 0.24, sy, 21.58, 22.78, hm.marble);
    }
    // Stainless steel stair handrail
    rodBetween(g, [-9.65, y0 + 0.92, 21.58], [-14.1, y1 + 0.92, 21.58], 0.025, hm.steel, 8);
    rodBetween(g, [-9.65, y0 + 0.92, 22.78], [-14.1, y1 + 0.92, 22.78], 0.025, hm.steel, 8);
  }

  // ==========================================================================
  // 4. UPPER FLOORS (k = 1..9): PERIMETER WALLS, FLOOR SLABS & LUXURY INTERIORS
  // ==========================================================================
  // Rear Wall (x = BX) & South Party Wall (z = EZ)
  B(BX, BX + 0.28, 4.0, ROOF, 14.6, EZ, hm.stucco);
  B(-5.6, BX, 4.0, ROOF, EZ - 0.28, EZ, hm.stucco);

  // Per-floor floor slabs (with stairwell opening at x ∈ [-14.2, -9.6], z ∈ [21.55, 22.80])
  for (let k = 1; k <= FLOORS; k++) {
    const y = L(k);
    B(-5.5, BX + 0.25, y - 0.24, y + 0.02, 14.7, 21.55, hm.creamTile);
    B(-5.5, BX + 0.25, y - 0.24, y + 0.02, 22.80, EZ - 0.25, hm.creamTile);
    B(-5.5, -9.6, y - 0.24, y + 0.02, 21.55, 22.80, hm.creamTile);
    B(-14.2, BX + 0.25, y - 0.24, y + 0.02, 21.55, 22.80, hm.creamTile);
  }

  // ==========================================================================
  // 5. FRONT FACADE — BAY A (corner, z 14.6..18.6): Walkable Corner Balconies
  // ==========================================================================
  for (let k = 1; k <= FLOORS; k++) {
    const y = L(k);
    // Front wall with open sliding glass doorway at z = 15.2 .. 17.4 so player can walk onto the balcony!
    B(-4.2, -4.45, y, y + 2.76, 14.6, 15.2, hm.stucco);
    B(-4.2, -4.45, y, y + 2.76, 17.4, 18.6, hm.stucco);
    B(-4.2, -4.45, y + 2.35, y + 2.76, 15.2, 17.4, hm.stucco);
    // Sliding glass panel pushed to one side (z = 16.3 .. 17.4) leaving z = 15.2 .. 16.3 open to walk through!
    B(-4.18, -4.24, y + 0.05, y + 2.35, 16.35, 17.4, hm.glass);
    B(-4.15, -4.25, y + 2.32, y + 2.42, 15.15, 17.45, hm.frame);

    // Cantilever Balcony Slab & Railings
    B(-4.45, -2.85, y - 0.26, y + 0.02, 14.3, 18.6, hm.stucco);
    B(-2.85, -2.9, y - 0.26, y + 0.02, 14.3, 18.6, hm.stuccoShade);
    railingAlongZ(B, g, hm, -2.97, 14.38, 18.55, y);
    railingAlongX(B, g, hm, 14.38, -2.97, -4.2, y);
    acUnit(B, g, hm, -4.2, y + 1.85, 18.1, '+x');
  }
  // Colourful coaching-centre banner tied to the 1st-floor corner balcony (real photo texture)
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.92), hm.banner);
  banner.position.set(-2.93, L(1) + 0.58, 16.35);
  banner.rotation.y = Math.PI / 2;
  dynamicParent.add(banner);

  // ==========================================================================
  // 6. FRONT FACADE — BAY B (z 18.6..23.6): Walkable Recessed Balconies
  // ==========================================================================
  B(-5.6, -3.75, 4.1, ROOF, 18.6, 18.9, hm.stucco);
  B(-5.6, -3.75, 4.1, ROOF, 23.3, 23.6, hm.stucco);
  for (let k = 1; k <= FLOORS; k++) {
    const y = L(k);
    B(-5.6, -3.75, y - 0.24, y + 0.02, 18.9, 23.3, hm.stucco);
    railingAlongZ(B, g, hm, -3.85, 18.95, 23.25, y);
    // Wall with open doorway at z = 19.3 .. 20.6
    B(-5.5, -5.7, y, y + 2.76, 18.9, 19.3, hm.stucco);
    B(-5.5, -5.7, y, y + 2.76, 21.5, 23.3, hm.stucco);
    B(-5.5, -5.7, y + 2.32, y + 2.76, 19.3, 21.5, hm.stucco);
    B(-5.56, -5.62, y + 0.05, y + 2.3, 20.45, 21.5, hm.glass); // half-open sliding glass door
    B(-5.48, -5.72, y + 0.9, y + 2.2, 21.9, 23.0, hm.glass);
    if (k % 2 === 0) acUnit(B, g, hm, -5.6, y + 0.02, 22.6, '+x');
    if (k % 3 === 1) {
      cylinder(g, 0.18, 0.13, 0.3, [-4.15, y + 0.15, 19.4], hm.terracotta, 10);
      B(-3.95, -4.35, y + 0.3, y + 0.85, 19.15, 19.65, hm.plant);
    }
  }

  // ==========================================================================
  // 7. FRONT FACADE — BAY C (z 23.6..28.6): Walkable Stepped Box-Frame Balconies
  // ==========================================================================
  B(-5.6, -3.65, 4.1, ROOF, 28.25, 28.6, hm.stucco);
  for (let k = 1; k <= FLOORS; k++) {
    const y = L(k);
    const px = k % 2 === 0 ? -3.65 : -4.3;
    B(-5.15, px, y - 0.26, y + 0.02, 23.6, 28.25, hm.stucco);
    railingAlongZ(B, g, hm, px - 0.1, 23.65, 28.2, y);
    // Wall at x = -5.0 with open sliding doorway at z = 24.1 .. 25.3
    B(-4.95, -5.2, y, y + 2.76, 23.6, 24.1, hm.stucco);
    B(-4.95, -5.2, y, y + 2.76, 26.5, 28.3, hm.stucco);
    B(-4.95, -5.2, y + 2.32, y + 2.76, 24.1, 26.5, hm.stucco);
    B(-4.98, -5.05, y + 0.05, y + 2.3, 25.3, 26.5, hm.glass);
    B(-4.94, -5.22, y + 0.9, y + 2.2, 26.8, 27.9, hm.glass);
    if (k % 2 === 1) acUnit(B, g, hm, -5.0, y + 1.85, 27.4, '+x');
  }

  // ==========================================================================
  // 8. LANE-SIDE FACADE (z = 14.6): Grey Cement Cladding & Real See-Through Windows
  // ==========================================================================
  const cols = [-6.7, -9.2, -11.7, -14.2, -16.7, -19.0];
  const edges = [-4.2];
  for (const c of cols) edges.push(c + 0.5, c - 0.5);
  edges.push(BX);
  for (let i = 0; i < edges.length; i += 2) {
    const xa = edges[i];
    const xb = edges[i + 1];
    if (xa - xb > 0.04) {
      B(xa, xb, 4.1, ROOF, 14.5, 14.76, hm.grey);
      if (xa <= -5.5) B(xa, xb, 4.1, ROOF, 14.28, 14.5, hm.grey);
    }
  }
  for (let k = 1; k <= FLOORS; k++) {
    const y = L(k);
    for (const c of cols) {
      // Wall below sill and above lintel so the window opening (y+0.85 .. y+2.35) is genuinely see-through!
      B(c + 0.5, c - 0.5, y - 0.24, y + 0.85, 14.5, 14.76, hm.grey);
      B(c + 0.5, c - 0.5, y + 2.35, y + 2.76, 14.5, 14.76, hm.grey);
      B(c + 0.5, c - 0.5, y + 0.85, y + 2.35, 14.47, 14.52, hm.frame);
      B(c + 0.45, c - 0.45, y + 0.9, y + 2.3, 14.48, 14.51, hm.glass);
      B(c + 0.02, c - 0.02, y + 0.9, y + 2.3, 14.46, 14.52, hm.frame);
      B(c + 0.55, c - 0.55, y + 2.42, y + 2.52, 14.05, 14.5, hm.stucco); // white sun hood
      B(c + 0.5, c - 0.5, y + 0.78, y + 0.85, 14.36, 14.5, hm.stucco);   // sill
    }
    if (k % 2 === 0) acUnit(B, g, hm, -8.0, y + 1.0, 14.28, '-z');
  }

  // ==========================================================================
  // 9. ROOFTOP SKY LOUNGE & INFINITY GARDEN (ROOF = 31.0m)
  // ==========================================================================
  // Roof slab with stairwell opening at x ∈ [-14.2, -9.6], z ∈ [21.55, 22.80]
  B(-3.65, BX, ROOF - 0.24, ROOF + 0.04, 14.3, 21.55, hm.stucco);
  B(-3.65, BX, ROOF - 0.24, ROOF + 0.04, 22.80, EZ, hm.stucco);
  B(-3.65, -9.6, ROOF - 0.24, ROOF + 0.04, 21.55, 22.80, hm.stucco);
  B(-14.2, BX, ROOF - 0.24, ROOF + 0.04, 21.55, 22.80, hm.stucco);

  // Rooftop Parapet Walls
  B(-3.65, -3.9, ROOF + 0.04, ROOF + 1.2, 14.3, EZ, hm.stucco);
  B(-3.65, BX, ROOF + 0.04, ROOF + 1.2, 14.3, 14.55, hm.stucco);
  B(BX + 0.25, BX, ROOF + 0.04, ROOF + 1.2, 14.3, EZ, hm.stucco);
  B(-3.65, BX, ROOF + 0.04, ROOF + 1.2, EZ - 0.25, EZ, hm.stucco);
  // Architectural grey frame & pergola beams
  B(-3.75, -5.6, ROOF + 1.2, ROOF + 1.55, 18.6, 28.6, hm.darkGrey);
  for (const z of [18.75, 23.45, 28.45]) B(-3.8, -4.1, ROOF + 0.04, ROOF + 1.2, z - 0.15, z + 0.15, hm.darkGrey);

  // Stair & Lift Penthouse Room on Roof (x = -9.4 .. -14.5, z = 18.2 .. 23.1) with open door at x = -9.4, z = 19.3..20.8
  B(-9.4, -14.5, ROOF + 3.0, ROOF + 3.25, 18.2, 23.1, hm.stucco);
  B(-14.25, -14.5, ROOF + 0.04, ROOF + 3.0, 18.2, 23.1, hm.stucco);
  B(-9.4, -14.5, ROOF + 0.04, ROOF + 3.0, 18.2, 18.45, hm.stucco);
  B(-9.4, -14.5, ROOF + 0.04, ROOF + 3.0, 22.85, 23.1, hm.stucco);
  B(-9.4, -9.65, ROOF + 0.04, ROOF + 3.0, 18.2, 19.3, hm.stucco);
  B(-9.4, -9.65, ROOF + 0.04, ROOF + 3.0, 20.8, 23.1, hm.stucco);
  B(-11.0, -13.5, ROOF + 3.25, ROOF + 4.5, 18.8, 21.6, hm.darkGrey); // overhead water tank
  B(-11.4, -11.5, ROOF + 0.9, ROOF + 1.8, 18.6, 19.1, hm.liftDisplay); // rooftop lift panel

  // Rooftop Sky Lounge Turf, Wooden Deck, Outdoor Sofas & Warm Lanterns
  B(-4.2, -8.8, ROOF + 0.04, ROOF + 0.08, 15.0, 22.5, hm.turfGreen);
  B(-4.8, -7.8, ROOF + 0.08, ROOF + 0.52, 15.8, 16.5, hm.velvetCream);
  B(-7.1, -7.8, ROOF + 0.08, ROOF + 0.52, 16.5, 19.2, hm.velvetCream);
  B(-5.4, -6.8, ROOF + 0.08, ROOF + 0.44, 17.2, 18.6, hm.woodWalnut);
  for (const pz of [15.2, 17.8, 20.4, 24.2, 27.2]) {
    B(-4.0, -4.6, ROOF + 0.08, ROOF + 0.55, pz - 0.35, pz + 0.35, hm.terracotta);
    B(-3.95, -4.65, ROOF + 0.55, ROOF + 1.35, pz - 0.45, pz + 0.45, hm.plant);
  }

  mergeStaticMeshes(g);

  // ==========================================================================
  // 10. PER-FLOOR HIGH-FI APARTMENT INTERIORS (Culled dynamically by player Y)
  // ==========================================================================
  const floorInteriors = [];
  for (let k = 1; k <= FLOORS; k++) {
    const fg = new THREE.Group();
    fg.name = `SkArshanFloor_${k}`;
    buildApartmentFloorInterior(fg, hm, L(k));
    mergeStaticMeshes(fg);
    dynamicParent.add(fg);
    floorInteriors.push({ level: k, y: L(k), group: fg });
  }

  // Lift stop elevations: Ground(0.5), 1st(4.0), 2nd(7.0), 4th(13.0), 7th(22.0), 9th(28.0), Roof(31.0)
  const LIFT_STOPS = [
    { y: 0.5, label: 'নিচতলা লবি (Ground Lobby)' },
    { y: 4.0, label: '২য় তলা ফ্ল্যাট ও কোচিং (1st Floor)' },
    { y: 7.0, label: '৩য় তলা মডেল ফ্ল্যাট (2nd Floor)' },
    { y: 13.0, label: '৫ম তলা লাক্সারি ডুপ্লেক্স (4th Floor)' },
    { y: 22.0, label: '৮ম তলা স্কাই স্যুট (7th Floor)' },
    { y: 28.0, label: '১০ম তলা ভিআইপি পেন্টহাউস (9th Floor)' },
    { y: 31.0, label: 'ছাদের স্কাই লাউঞ্জ (Rooftop Garden)' },
  ];

  function isNearGate(pos) {
    return pos.x >= -6.5 && pos.x <= -2.2 && pos.z >= 18.2 && pos.z <= 22.6 && (pos.y - 1.68) < 2.2;
  }

  function isNearLift(pos) {
    return pos.x >= -13.2 && pos.x <= -9.2 && pos.z >= 18.0 && pos.z <= 21.4;
  }

  return {
    group: g,
    state,
    getPrompt(playerPos) {
      if (isNearLift(playerPos)) {
        const nextIdx = (state.liftFloorIndex + 1) % LIFT_STOPS.length;
        return `Press E / F or Click · হাই-স্পিড লিফট: ${LIFT_STOPS[nextIdx].label}-এ যান`;
      }
      if (isNearGate(playerPos)) {
        return state.gateOpen
          ? 'Press E / F · শেখ আরশান আলিফ টাওয়ারের মেইন গেট বন্ধ করুন (Close Gate)'
          : 'Press E / F · শেখ আরশান আলিফ টাওয়ারের মেইন গেট খুলুন (Open Gate)';
      }
      return null;
    },
    interact(playerPos) {
      if (isNearLift(playerPos)) {
        state.liftFloorIndex = (state.liftFloorIndex + 1) % LIFT_STOPS.length;
        const stop = LIFT_STOPS[state.liftFloorIndex];
        playerPos.x = -10.4;
        playerPos.z = 19.6;
        playerPos.y = stop.y + 1.68;
        return true;
      }
      if (isNearGate(playerPos)) {
        state.gateOpen = !state.gateOpen;
        return true;
      }
      return false;
    },
    update(delta, playerPos, isLow = false) {
      const targetSlide = state.gateOpen ? 1.0 : 0.0;
      if (Math.abs(state.gateSlide - targetSlide) > 0.001) {
        state.gateSlide += (targetSlide - state.gateSlide) * Math.min(1, delta * 6.0);
        slidingGateGroup.position.z = state.gateSlide * -2.85;
      }
      const footY = playerPos.y - 1.68;
      const insideTower = playerPos.x <= -2.8 && playerPos.x >= -20.2 && playerPos.z >= 14.2 && playerPos.z <= 28.8;
      for (const fl of floorInteriors) {
        if (isLow && !insideTower) {
          fl.group.visible = fl.level <= 2;
        } else if (insideTower) {
          fl.group.visible = Math.abs(footY - fl.y) <= 4.5;
        } else {
          fl.group.visible = fl.level <= 4;
        }
      }
    },
  };
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
      B(x0, x1, y - 0.12, y + 0.06, faceZ + dir * 0.0, faceZ + dir * 0.55, hm.stuccoShade);
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
