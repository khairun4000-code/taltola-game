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

function drawLiftDisplayCanvas(canvas, code = 'GF', arrow = '●', statusText = 'DOOR OPEN · দরজা খোলা', targetIdx = 0) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#070b14';
  ctx.fillRect(0, 0, 256, 512);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 240, 496);

  // Digital 7-segment style LED screen at top
  ctx.fillStyle = '#03050a';
  ctx.fillRect(20, 22, 216, 92);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 22, 216, 92);

  ctx.fillStyle = arrow === '●' ? '#22c55e' : '#f59e0b';
  ctx.font = '900 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(arrow, 68, 84);

  ctx.fillStyle = '#ef4444';
  ctx.font = '900 58px monospace';
  ctx.fillText(code, 158, 86);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('HIGH-SPEED LIFT · লিফট', 128, 138);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 16px Arial';
  ctx.fillText(statusText, 128, 162);

  // 2-column circular elevator floor buttons (R, 9..1, G)
  const btns = [
    ['R', 10], ['9', 9],
    ['8', 8], ['7', 7],
    ['6', 6], ['5', 5],
    ['4', 4], ['3', 3],
    ['2', 2], ['1', 1],
    ['G', 0],
  ];
  btns.forEach(([label, idx], i) => {
    const col = label === 'G' ? 0.5 : (i % 2);
    const row = label === 'G' ? 5 : Math.floor(i / 2);
    const cx = label === 'G' ? 128 : (col === 0 ? 78 : 178);
    const cy = 198 + row * 48;
    const isTarget = idx === targetIdx;

    ctx.beginPath();
    ctx.arc(cx, cy, 19, 0, Math.PI * 2);
    ctx.fillStyle = isTarget ? '#d97706' : '#1e293b';
    ctx.fill();
    ctx.lineWidth = isTarget ? 4 : 2.5;
    ctx.strokeStyle = isTarget ? '#fde047' : '#94a3b8';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 19px Arial';
    ctx.fillText(label, cx, cy + 7);
  });

  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 17px Arial';
  ctx.fillText('CLICK OR PRESS [E / L]', 128, 490);
}

function createLiftDisplayTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  drawLiftDisplayCanvas(canvas, 'GF', '●', 'DOOR OPEN · দরজা খোলা', 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.userData.canvas = canvas;
  return tex;
}

function createFloorPlaqueTexture(floorNum, titleBn, subtitleEn) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 496, 144);
  ctx.fillStyle = '#fbbf24';
  ctx.font = '900 44px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${floorNum} · ${titleBn}`, 256, 68);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 24px Arial';
  ctx.fillText(subtitleEn, 256, 118);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWoodGrainTexture(baseHex = '#5c3a21', grainHex = '#3d2412') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 140; i++) {
    const y = (i / 140) * 512;
    ctx.strokeStyle = i % 3 === 0 ? grainHex : 'rgba(255,235,205,0.06)';
    ctx.lineWidth = 1 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(170, y + Math.sin(i) * 10, 340, y - Math.cos(i) * 10, 512, y);
    ctx.stroke();
  }
  // Plank seams
  ctx.strokeStyle = 'rgba(20,10,5,0.35)';
  ctx.lineWidth = 2;
  for (let y = 64; y < 512; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createTuftedFabricTexture(baseHex = '#1e40af', stitchHex = '#172554', highlightHex = 'rgba(255,255,255,0.12)') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle woven threads
  ctx.fillStyle = highlightHex;
  for (let y = 0; y < 256; y += 4) ctx.fillRect(0, y, 256, 1);
  for (let x = 0; x < 256; x += 4) ctx.fillRect(x, 0, 1, 256);

  // Diamond quilting / tufting seams & buttons
  ctx.strokeStyle = stitchHex;
  ctx.lineWidth = 3;
  const step = 64;
  for (let y = 0; y <= 256; y += step) {
    for (let x = 0; x <= 256; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, y - step / 2);
      ctx.lineTo(x + step / 2, y);
      ctx.lineTo(x, y + step / 2);
      ctx.lineTo(x - step / 2, y);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = stitchHex;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createPersianRugTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(0, 0, 512, 512);

  // Ornate concentric borders
  const borders = [
    [16, '#fbbf24', 10],
    [34, '#1e3a8a', 18],
    [58, '#fde68a', 6],
    [72, '#991b1b', 8],
  ];
  for (const [pad, col, lw] of borders) {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.strokeRect(pad, pad, 512 - pad * 2, 512 - pad * 2);
  }
  // Center medallion
  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.ellipse(256, 256, 110, 75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.ellipse(256, 256, 52, 34, 0, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createBathTileTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(0, 0, 256, 256);
  const sz = 32;
  for (let y = 0; y < 256; y += sz) {
    for (let x = 0; x < 256; x += sz) {
      ctx.fillStyle = (x / sz + y / sz) % 2 === 0 ? '#bae6fd' : '#e0f2fe';
      ctx.fillRect(x + 2, y + 2, sz - 4, sz - 4);
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, sz - 2, sz - 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
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
    // High-Fi Interior Luxury Materials (with rich procedural PBR textures & bump detail!)
    creamTile: std({ map: stuccoMap, color: 0xf5f2eb, roughness: 0.16, metalness: 0.06 }, 2.5),
    wallCream: std({ map: stuccoMap, color: 0xfbf9f5, roughness: 0.72 }, 3.0),
    wallAccent: std({ map: stuccoMap, color: 0xe2e8f0, roughness: 0.65 }, 3.0),
    woodWalnut: (() => {
      const t = createWoodGrainTexture('#5c3a21', '#3b2210');
      return std({ map: t, bumpMap: t, bumpScale: 0.008, roughness: 0.34, metalness: 0.08 }, 1.6);
    })(),
    woodOak: (() => {
      const t = createWoodGrainTexture('#a47551', '#7c5333');
      return std({ map: t, bumpMap: t, bumpScale: 0.006, roughness: 0.40, metalness: 0.05 }, 1.6);
    })(),
    velvetBlue: (() => {
      const t = createTuftedFabricTexture('#1d4ed8', '#1e3a8a');
      return std({ map: t, bumpMap: t, bumpScale: 0.012, roughness: 0.62, metalness: 0.04 }, 1.2);
    })(),
    velvetCream: (() => {
      const t = createTuftedFabricTexture('#ece6dc', '#c7bfb1');
      return std({ map: t, bumpMap: t, bumpScale: 0.010, roughness: 0.58, metalness: 0.03 }, 1.2);
    })(),
    velvetEmerald: (() => {
      const t = createTuftedFabricTexture('#047857', '#064e3b');
      return std({ map: t, bumpMap: t, bumpScale: 0.010, roughness: 0.58, metalness: 0.04 }, 1.2);
    })(),
    rugPattern: std({ map: createPersianRugTexture(), roughness: 0.82 }, 3.2),
    bedSheet: (() => {
      const t = createTuftedFabricTexture('#f8fafc', '#cbd5e1');
      return std({ map: t, bumpMap: t, bumpScale: 0.008, roughness: 0.68 }, 1.5);
    })(),
    bedBlanket: (() => {
      const t = createTuftedFabricTexture('#0284c7', '#0369a1');
      return std({ map: t, bumpMap: t, bumpScale: 0.010, roughness: 0.62 }, 1.4);
    })(),
    bathTile: std({ map: createBathTileTexture(), roughness: 0.18, metalness: 0.08 }, 1.4),
    porcelain: std({ color: 0xffffff, roughness: 0.10, metalness: 0.08 }),
    chrome: std({ color: 0xe2e8f0, roughness: 0.12, metalness: 0.85 }),
    mirrorMat: std({ color: 0xdbeafe, roughness: 0.03, metalness: 0.92 }),
    waterBlue: std({ color: 0x38bdf8, roughness: 0.08, metalness: 0.1, emissive: 0x0284c7, emissiveIntensity: 0.25 }),
    curtainGold: std({ color: 0xd97706, roughness: 0.65 }),
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

/** Helper to place a crisp untiled PlaneGeometry sign/screen that won't have its UVs overwritten by mergeStaticMeshes. */
function addScreenPlane(parent, width, height, pos, rotY, mat) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.y = rotY;
  mesh.userData.skipMerge = true;
  parent.add(mesh);
  return mesh;
}

/** Builds a detailed luxury apartment interior for floor k (y = L(k)). */
function buildApartmentFloorInterior(parent, screenParent, hm, y, levelIndex = 1) {
  const B = makeB(parent);
  const fy = y + 0.02; // top of floor slab

  // 1. Central Elevator & Stair Lobby (z = 18.65 .. 23.18, x = -5.6 .. -16.65)
  // Hollow Elevator Shaft Walls (x = -11.55 .. -13.38, z = 18.70 .. 20.40) with open doorway z = 18.96 .. 20.14!
  B(-13.26, -13.40, fy, y + 2.74, 18.70, 20.40, hm.marble); // rear shaft wall
  B(-11.55, -13.40, fy, y + 2.74, 18.68, 18.80, hm.marble); // north shaft wall
  B(-11.55, -13.40, fy, y + 2.74, 20.28, 20.40, hm.marble); // south shaft wall
  // Front elevator portal jambs & header at x = -11.55 (leaving z = 18.96 .. 20.14 open to walk inside!)
  B(-11.52, -11.68, fy, y + 2.74, 18.70, 18.96, hm.granite);
  B(-11.52, -11.68, fy, y + 2.74, 20.14, 20.40, hm.granite);
  B(-11.52, -11.68, fy + 2.28, y + 2.74, 18.96, 20.14, hm.marble);
  // Golden portal arch trim around elevator doorway
  B(-11.49, -11.55, fy, fy + 2.32, 18.92, 18.97, hm.gold);
  B(-11.49, -11.55, fy, fy + 2.32, 20.13, 20.18, hm.gold);
  B(-11.49, -11.55, fy + 2.27, fy + 2.33, 18.92, 20.18, hm.gold);
  // Digital Lift Call & Floor Panel beside elevator door (crisp PlaneGeometry facing +X)
  addScreenPlane(screenParent, 0.36, 0.78, [-11.48, fy + 1.35, 18.82], Math.PI / 2, hm.liftDisplay);
  // Ceiling LED panels in lobby & stair hallway
  B(-7.0, -8.5, y + 2.71, y + 2.74, 20.0, 21.2, hm.ledWarm);
  B(-9.5, -11.0, y + 2.71, y + 2.74, 19.2, 20.4, hm.ledWarm);
  B(-14.3, -15.8, y + 2.71, y + 2.74, 20.2, 21.4, hm.ledWarm);

  // Partition walls separating Central Lobby from North Flat A (z = 18.63) & South Flat B (z = 23.26)
  // North Flat A entrance doorway is open at x = -7.2 .. -8.6, and En-Suite Bathroom doorway is open at x = -17.1 .. -18.3!
  B(-5.6, -7.2, fy, y + 2.74, 18.55, 18.72, hm.wallCream);
  B(-8.6, -17.1, fy, y + 2.74, 18.55, 18.72, hm.wallCream);
  B(-18.3, -19.7, fy, y + 2.74, 18.55, 18.72, hm.wallCream);
  B(-7.2, -8.6, y + 2.22, y + 2.74, 18.55, 18.72, hm.wallCream);
  B(-17.1, -18.3, y + 2.22, y + 2.74, 18.55, 18.72, hm.wallCream);
  // Walnut door frames & open wooden door leaf swung into Flat A
  B(-7.16, -7.24, fy, y + 2.24, 18.52, 18.75, hm.woodWalnut);
  B(-8.56, -8.64, fy, y + 2.24, 18.52, 18.75, hm.woodWalnut);
  B(-8.55, -8.65, fy, y + 2.2, 17.35, 18.55, hm.woodWalnut);

  // ATTACHED LUXURY BATHROOM (অ্যাটাচড বাথরুম: x = -16.65 .. -19.65, z = 18.65 .. 21.35)
  // Positioned on the West En-Suite side so the Staircase Top Landing (x = -14.1 .. -16.5) is 100% open!
  // Entered via open doorway at z = 18.63, x = -17.1 .. -18.3 (from Master Bedroom)
  B(-16.65, -19.65, fy, fy + 0.03, 18.65, 21.35, hm.bathTile);
  B(-16.60, -16.75, fy, y + 2.74, 18.65, 21.35, hm.bathTile);
  B(-19.50, -19.65, fy, y + 2.74, 18.65, 21.35, hm.bathTile);
  B(-16.65, -19.65, fy, y + 2.74, 21.25, 21.40, hm.bathTile);
  // 1) Western Porcelain Commode / Toilet (কমোড) at x = -19.00, z = 20.65 (facing +X)
  cylinder(parent, 0.19, 0.15, 0.38, [-18.97, fy + 0.20, 20.65], hm.porcelain, 14);
  cylinder(parent, 0.24, 0.20, 0.08, [-18.93, fy + 0.42, 20.65], hm.porcelain, 14);
  cylinder(parent, 0.16, 0.16, 0.02, [-18.91, fy + 0.45, 20.65], hm.waterBlue, 12);
  // Raised white toilet lid & cistern tank with chrome flush button
  B(-19.17, -19.11, fy + 0.46, fy + 0.86, 20.44, 20.86, hm.porcelain);
  B(-19.47, -19.19, fy + 0.44, fy + 0.88, 20.42, 20.88, hm.porcelain);
  cylinder(parent, 0.035, 0.035, 0.03, [-19.33, fy + 0.90, 20.65], hm.chrome, 10);
  // 2) Vanity Washbasin & Backlit LED Mirror at x = -17.00, z = 20.02 (against east bathroom wall)
  B(-16.77, -17.30, fy + 0.02, fy + 0.78, 19.60, 20.45, hm.woodWalnut);
  B(-16.75, -17.33, fy + 0.78, fy + 0.86, 19.56, 20.48, hm.marble);
  cylinder(parent, 0.18, 0.14, 0.12, [-17.03, fy + 0.92, 20.02], hm.porcelain, 14);
  cylinder(parent, 0.02, 0.02, 0.16, [-16.83, fy + 1.02, 20.02], hm.chrome, 8);
  B(-16.77, -16.81, fy + 1.18, fy + 2.05, 19.65, 20.40, hm.ledCyan);
  B(-16.81, -16.84, fy + 1.22, fy + 2.01, 19.69, 20.36, hm.mirrorMat);
  // 3) Walk-in Rain Shower & Glass Partition at x = -19.00, z = 19.15
  B(-18.30, -18.35, fy + 0.02, fy + 2.15, 18.70, 19.65, hm.clearGlass);
  rodBetween(parent, [-19.48, fy + 1.05, 19.15], [-19.48, fy + 2.25, 19.15], 0.018, hm.chrome, 8);
  rodBetween(parent, [-19.48, fy + 2.25, 19.15], [-19.05, fy + 2.20, 19.15], 0.018, hm.chrome, 8);
  cylinder(parent, 0.14, 0.12, 0.03, [-19.05, fy + 2.17, 19.15], hm.chrome, 12);
  B(-17.7, -18.7, y + 2.70, y + 2.74, 19.7, 20.3, hm.ledWarm);

  // South Flat B entrance doorway is open at x = -7.2 .. -8.6!
  B(-5.6, -7.2, fy, y + 2.74, 23.18, 23.35, hm.wallCream);
  B(-8.6, -19.7, fy, y + 2.74, 23.18, 23.35, hm.wallCream);
  B(-7.2, -8.6, y + 2.22, y + 2.74, 23.18, 23.35, hm.wallCream);
  B(-7.16, -7.24, fy, y + 2.24, 23.15, 23.38, hm.woodWalnut);
  B(-8.56, -8.64, fy, y + 2.24, 23.15, 23.38, hm.woodWalnut);
  B(-8.55, -8.65, fy, y + 2.2, 23.35, 24.55, hm.woodWalnut);

  // 2. NORTH WING (FLAT A): Grand Living Lounge (x = -4.3 .. -13.3, z = 14.8 .. 18.55)
  // Partition wall between Living Lounge and Master Bedroom at x = -13.3 (open doorway at z = 16.0 .. 17.3)
  B(-13.22, -13.38, fy, y + 2.74, 14.8, 16.0, hm.wallCream);
  B(-13.22, -13.38, fy, y + 2.74, 17.3, 18.55, hm.wallCream);
  B(-13.22, -13.38, y + 2.22, y + 2.74, 16.0, 17.3, hm.wallCream);
  B(-13.19, -13.41, fy, y + 2.24, 15.96, 16.04, hm.woodWalnut);
  B(-13.19, -13.41, fy, y + 2.24, 17.26, 17.34, hm.woodWalnut);

  // Designer Persian Rug & Tufted Royal Blue Velvet L-Sofa in Living Lounge
  B(-6.5, -10.8, fy, fy + 0.025, 15.3, 18.1, hm.rugPattern);
  // Sofa wooden base trim + plush seat cushions + tufted backrest + armrests
  B(-6.58, -11.02, fy + 0.02, fy + 0.12, 15.04, 15.96, hm.woodWalnut);
  B(-6.6, -11.0, fy + 0.12, fy + 0.46, 15.05, 15.95, hm.velvetBlue);
  B(-6.6, -11.0, fy + 0.46, fy + 0.92, 15.00, 15.28, hm.velvetBlue);
  B(-6.45, -6.68, fy + 0.12, fy + 0.66, 15.02, 15.98, hm.velvetBlue); // right armrest
  B(-10.08, -11.02, fy + 0.02, fy + 0.12, 15.95, 17.68, hm.woodWalnut);
  B(-10.1, -11.0, fy + 0.12, fy + 0.46, 15.95, 17.65, hm.velvetBlue);
  B(-10.75, -11.0, fy + 0.46, fy + 0.92, 15.28, 17.65, hm.velvetBlue);
  B(-10.08, -11.02, fy + 0.12, fy + 0.66, 17.55, 17.75, hm.velvetBlue); // chaise armrest
  // Throw pillows along both sofa backs
  for (const cz of [15.5, 16.3, 17.1]) {
    B(-10.42, -10.72, fy + 0.46, fy + 0.76, cz - 0.22, cz + 0.22, hm.velvetCream);
  }
  for (const cx of [-7.3, -8.4, -9.5]) {
    B(cx - 0.24, cx + 0.24, fy + 0.46, fy + 0.76, 15.28, 15.52, hm.velvetCream);
  }
  // Swirl-Marble & Gold Coffee Table with Porcelain Tea Service
  B(-7.5, -9.3, fy + 0.40, fy + 0.47, 16.35, 17.25, hm.marble);
  B(-7.6, -9.2, fy + 0.02, fy + 0.40, 16.45, 17.15, hm.gold);
  cylinder(parent, 0.08, 0.06, 0.14, [-8.1, fy + 0.54, 16.75], hm.porcelain, 12);
  cylinder(parent, 0.045, 0.035, 0.07, [-8.45, fy + 0.50, 16.65], hm.porcelain, 10);
  cylinder(parent, 0.045, 0.035, 0.07, [-8.45, fy + 0.50, 16.90], hm.porcelain, 10);
  // Pleated Gold Curtains beside lane windows
  for (const wx of [-6.1, -7.3, -8.6, -9.8]) {
    B(wx - 0.12, wx + 0.12, fy + 0.55, fy + 2.45, 14.78, 14.92, hm.curtainGold);
  }

  // 75-Inch Wall-Mounted 4K Smart TV, Soundbar & Walnut Media Console on South Wall (z = 18.48, facing -Z)
  B(-6.8, -10.2, fy + 0.02, fy + 0.52, 18.02, 18.52, hm.woodWalnut);
  B(-6.78, -10.22, fy + 0.52, fy + 0.56, 18.00, 18.53, hm.marble);
  B(-7.8, -9.2, fy + 0.56, fy + 0.64, 18.18, 18.35, hm.dark); // Dolby Atmos Soundbar
  B(-7.2, -9.8, fy + 0.92, fy + 2.12, 18.46, 18.53, hm.dark);
  addScreenPlane(screenParent, 2.48, 1.12, [-8.5, fy + 1.52, 18.44], Math.PI, hm.smartTv);
  // Warm false-ceiling cove light strips & Chandelier
  B(-6.0, -11.8, y + 2.70, y + 2.74, 15.4, 15.55, hm.ledWarm);
  B(-6.0, -11.8, y + 2.70, y + 2.74, 17.9, 18.05, hm.ledWarm);
  cylinder(parent, 0.45, 0.45, 0.08, [-8.4, y + 2.62, 16.8], hm.gold, 16);
  cylinder(parent, 0.38, 0.38, 0.06, [-8.4, y + 2.56, 16.8], hm.ledWarm, 16);

  // 3. NORTH WING MASTER BEDROOM (x = -13.4 .. -19.6, z = 14.8 .. 18.55)
  // King-size luxury bed against west wall (x = -19.5) with quilted mattress & silk duvet
  B(-16.6, -19.5, fy + 0.02, fy + 0.38, 15.25, 17.45, hm.woodWalnut);
  B(-16.68, -19.25, fy + 0.38, fy + 0.62, 15.35, 17.35, hm.bedSheet);
  B(-16.66, -18.25, fy + 0.62, fy + 0.68, 15.33, 17.37, hm.bedBlanket);
  B(-19.22, -19.55, fy + 0.38, fy + 1.58, 15.20, 17.50, hm.woodWalnut);
  B(-19.16, -19.24, fy + 0.55, fy + 1.48, 15.32, 17.38, hm.velvetCream); // tufted padded headboard
  // Plump Pillows & Bedside Nightstand with Warm Lamp
  B(-18.55, -19.12, fy + 0.62, fy + 0.78, 15.50, 16.25, hm.velvetCream);
  B(-18.55, -19.12, fy + 0.62, fy + 0.78, 16.45, 17.20, hm.velvetCream);
  B(-18.85, -19.50, fy + 0.02, fy + 0.54, 14.82, 15.18, hm.woodWalnut);
  cylinder(parent, 0.12, 0.16, 0.26, [-19.15, fy + 0.72, 15.00], hm.ledWarm, 12);
  // Full-height Walnut & Mirror Wardrobe along south wall (z = 17.95 .. 18.52, x = -14.0 .. -16.5)
  B(-14.0, -16.5, fy + 0.02, fy + 2.45, 17.95, 18.52, hm.woodWalnut);
  B(-14.15, -16.35, fy + 0.22, fy + 2.25, 17.92, 17.95, hm.mirrorMat);
  B(-15.5, -18.5, y + 2.70, y + 2.74, 16.3, 16.9, hm.ledWarm);

  // 4. SOUTH WING (FLAT B): Formal Dining & Modular Kitchen (x = -5.1 .. -13.3, z = 23.35 .. 28.3)
  B(-13.22, -13.38, fy, y + 2.74, 23.35, 24.9, hm.wallCream);
  B(-13.22, -13.38, fy, y + 2.74, 26.3, 28.3, hm.wallCream);
  B(-13.22, -13.38, y + 2.22, y + 2.74, 24.9, 26.3, hm.wallCream);
  B(-13.19, -13.41, fy, y + 2.24, 24.86, 24.94, hm.woodWalnut);
  B(-13.19, -13.41, fy, y + 2.24, 26.26, 26.34, hm.woodWalnut);

  // 6-Seater Swirl-Marble Dining Table with Porcelain Dinnerware (x = -7.0 .. -9.8, z = 24.6 .. 26.2)
  B(-6.6, -10.2, fy, fy + 0.02, 24.0, 26.8, hm.rugPattern);
  B(-7.0, -9.8, fy + 0.74, fy + 0.82, 24.6, 26.2, hm.marble);
  for (const [lx, lz] of [[-7.2, 24.8], [-9.6, 24.8], [-7.2, 26.0], [-9.6, 26.0]]) {
    B(lx - 0.06, lx + 0.06, fy + 0.02, fy + 0.74, lz - 0.06, lz + 0.06, hm.gold);
  }
  for (const cx of [-7.5, -8.4, -9.3]) {
    cylinder(parent, 0.14, 0.11, 0.025, [cx, fy + 0.835, 24.9], hm.porcelain, 12);
    cylinder(parent, 0.14, 0.11, 0.025, [cx, fy + 0.835, 25.9], hm.porcelain, 12);
    for (const [cz, backZ] of [[24.25, 24.02], [26.55, 26.78]]) {
      B(cx - 0.24, cx + 0.24, fy + 0.02, fy + 0.46, cz - 0.22, cz + 0.22, hm.velvetEmerald);
      B(cx - 0.24, cx + 0.24, fy + 0.46, fy + 0.96, backZ - 0.05, backZ + 0.05, hm.velvetEmerald);
    }
  }
  // Modular Kitchen Counter, Gas Burner, Range Hood, Sink & Smart Fridge (z = 27.5 .. 28.25)
  B(-7.2, -12.2, fy + 0.02, fy + 0.88, 27.55, 28.25, hm.woodOak);
  B(-7.15, -12.25, fy + 0.88, fy + 0.94, 27.50, 28.26, hm.granite);
  // Gas Stove + Glowing Blue Burners + Stainless Pot + Range Hood
  B(-8.2, -9.1, fy + 0.94, fy + 0.98, 27.65, 28.15, hm.dark);
  cylinder(parent, 0.10, 0.10, 0.02, [-8.45, fy + 0.99, 27.90], hm.ledCyan, 12);
  cylinder(parent, 0.10, 0.10, 0.02, [-8.85, fy + 0.99, 27.90], hm.ledCyan, 12);
  cylinder(parent, 0.13, 0.11, 0.16, [-8.45, fy + 1.08, 27.90], hm.chrome, 12);
  B(-8.15, -9.15, fy + 1.65, fy + 1.78, 27.60, 28.25, hm.steel);
  // Stainless Sink & Faucet
  B(-10.1, -10.9, fy + 0.93, fy + 0.96, 27.65, 28.15, hm.chrome);
  rodBetween(parent, [-10.5, fy + 0.96, 28.18], [-10.5, fy + 1.24, 28.02], 0.018, hm.chrome, 8);
  B(-7.2, -11.2, fy + 1.55, fy + 2.35, 27.75, 28.25, hm.woodWalnut); // overhead cabinets
  B(-12.25, -13.15, fy + 0.02, fy + 1.95, 27.45, 28.25, hm.steel);   // Smart Refrigerator
  B(-7.2, -11.8, y + 2.70, y + 2.74, 25.1, 25.7, hm.ledWarm);

  // 5. SOUTH-WEST VIP RGB GAMING & STUDY SUITE (x = -13.4 .. -19.6, z = 23.35 .. 28.3)
  // L-Shaped Gaming Desk along west/south corner
  B(-18.6, -19.55, fy + 0.72, fy + 0.78, 24.2, 27.6, hm.dark);
  B(-18.65, -19.55, fy + 0.78, fy + 0.80, 24.2, 24.26, hm.ledCyan);
  B(-18.6, -18.66, fy + 0.78, fy + 0.80, 24.2, 27.6, hm.ledMagenta);
  // Dual curved gaming monitors + RGB PC Tower
  B(-19.15, -19.25, fy + 0.92, fy + 1.42, 25.0, 27.1, hm.dark);
  addScreenPlane(screenParent, 0.98, 0.48, [-19.13, fy + 1.17, 25.5], Math.PI / 2, hm.smartTv);
  addScreenPlane(screenParent, 0.98, 0.48, [-19.13, fy + 1.17, 26.6], Math.PI / 2, hm.liftDisplay);
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

  // All 11 stops of the High-Speed Elevator (0 = Ground, 1..9 = Apartment Floors, 10 = Rooftop)
  const LIFT_STOPS = [
    { index: 0, code: 'GF', btn: 'G', y: 0.5, label: 'নিচতলা · গ্র্যান্ড লবি ও পার্কিং (Ground Floor)' },
    { index: 1, code: '1F', btn: '1', y: 4.0, label: '২য় তলা · কোচিং ও ফ্ল্যাট ১ (1st Floor)' },
    { index: 2, code: '2F', btn: '2', y: 7.0, label: '৩য় তলা · মডেল ফ্ল্যাট ২ (2nd Floor)' },
    { index: 3, code: '3F', btn: '3', y: 10.0, label: '৪র্থ তলা · লাক্সারি ফ্ল্যাট ৩ (3rd Floor)' },
    { index: 4, code: '4F', btn: '4', y: 13.0, label: '৫ম তলা · ডুপ্লেক্স ফ্ল্যাট ৪ (4th Floor)' },
    { index: 5, code: '5F', btn: '5', y: 16.0, label: '৬ষ্ঠ তলা · লাক্সারি ফ্ল্যাট ৫ (5th Floor)' },
    { index: 6, code: '6F', btn: '6', y: 19.0, label: '৭ম তলা · লাক্সারি ফ্ল্যাট ৬ (6th Floor)' },
    { index: 7, code: '7F', btn: '7', y: 22.0, label: '৮ম তলা · স্কাই স্যুট ৭ (7th Floor)' },
    { index: 8, code: '8F', btn: '8', y: 25.0, label: '৯ম তলা · লাক্সারি ফ্ল্যাট ৮ (8th Floor)' },
    { index: 9, code: '9F', btn: '9', y: 28.0, label: '১০ম তলা · ভিআইপি পেন্টহাউস ৯ (9th Floor)' },
    { index: 10, code: 'RF', btn: 'R', y: 31.0, label: 'ছাদ · স্কাই লাউঞ্জ ও গার্ডেন (Rooftop)' },
  ];

  const state = {
    gateOpen: true,      // Main parking gate open by default so player can drive/walk straight inside!
    gateSlide: 1.0,      // 0 = closed, 1 = slid open
    liftFloorIndex: 0,   // Current nearest floor index (0..10)
    liftTargetIndex: 0,  // Destination floor index (0..10)
    liftY: PL,           // Live elevator cabin floor elevation (0.5m .. 31.0m)
    liftDoorOpen: 1.0,   // 0.0 = closed, 1.0 = open (starts open at Ground Lobby!)
    liftPhase: 'open',   // 'open' | 'closing' | 'moving' | 'opening'
    liftDirection: 0,    // -1 = down, 0 = idle, 1 = up
  };

  // Web Audio Synthesizer for authentic Elevator Button Beep & Two-Tone Arrival Chime ("Ding-Dong!")
  let audioCtx = null;
  function playLiftSound(type = 'beep') {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;
      if (type === 'beep') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.095);
      } else if (type === 'tick') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.3, now);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.055);
      } else if (type === 'chime') {
        // Classic luxury hotel elevator two-tone chime (E5 -> C5)
        const notes = [[659.25, 0, 0.38], [523.25, 0.22, 0.55]];
        for (const [freq, delay, dur] of notes) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + delay);
          gain.gain.setValueAtTime(0.11, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
          osc.connect(gain).connect(audioCtx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + dur + 0.02);
        }
      }
    } catch {}
  }

  // Helper to build a floor slab with cutouts for BOTH the Elevator Shaft (x ∈ [-13.38, -11.55], z ∈ [18.70, 20.40])
  // and the Stairwell Opening (x ∈ [-14.20, -9.60], z ∈ [21.55, 22.80])
  function buildSlabWithShaftCutouts(xEast, xWest, y0, y1, zNorth, zSouth, mat) {
    B(xEast, xWest, y0, y1, zNorth, 18.70, mat);          // North of elevator shaft
    B(xEast, -11.55, y0, y1, 18.70, 20.40, mat);          // East of elevator shaft (lobby in front of lift)
    B(-13.38, xWest, y0, y1, 18.70, 20.40, mat);          // West of elevator shaft
    B(xEast, xWest, y0, y1, 20.40, 21.55, mat);           // Hallway between elevator shaft & stairwell
    B(xEast, -9.60, y0, y1, 21.55, 22.80, mat);           // East of stairwell
    B(-14.20, xWest, y0, y1, 21.55, 22.80, mat);          // West of stairwell (top landing)
    B(xEast, xWest, y0, y1, 22.80, zSouth, mat);          // South of stairwell
  }

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
  // Perimeter Rear & South Walls of Ground Floor
  B(BX, BX + 0.32, PL, 3.85, 14.6, EZ, hm.stucco);
  B(-4.2, BX, PL, 3.85, EZ - 0.32, EZ, hm.stucco);
  // 1st-floor ceiling / slab with cutouts for BOTH Elevator Shaft & Stairwell
  buildSlabWithShaftCutouts(-3.95, BX, 3.82, 4.02, SZ - 0.05, EZ, hm.stucco);

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

  // 3) Grand Reception & Concierge Desk + Illuminated Golden Nameplate + Hollow Lift Shaft Entrance (x = -11.55, z = 18.7..20.4)
  B(-9.2, -10.8, PL, PL + 1.12, 17.2, 18.5, hm.marble);
  B(-9.1, -10.9, PL + 1.12, PL + 1.20, 17.1, 18.6, hm.granite);
  B(-9.15, -10.85, PL + 0.04, PL + 0.14, 17.18, 18.52, hm.gold);
  // Dual CCTV Security Monitors on Reception Desk
  B(-9.8, -9.92, PL + 1.20, PL + 1.68, 17.5, 18.2, hm.dark);
  addScreenPlane(dynamicParent, 0.68, 0.44, [-9.79, PL + 1.44, 17.85], Math.PI / 2, hm.smartTv);
  // Illuminated Golden Building Signboard on Lobby Wall (x = -11.52, z = 16.0 .. 18.7)
  B(-11.55, -12.1, PL, 3.82, 16.0, 18.72, hm.marble);
  B(-11.50, -11.56, PL + 1.82, PL + 2.78, 16.12, 18.58, hm.gold);
  addScreenPlane(dynamicParent, 2.38, 0.88, [-11.48, PL + 2.30, 17.35], Math.PI / 2, hm.lobbySign);
  // Ground-Floor Hollow Elevator Shaft Walls & Open Portal (doorway open at z = 18.96 .. 20.14!)
  B(-13.26, -13.40, PL, 3.82, 18.70, 20.40, hm.marble); // rear shaft wall
  B(-11.55, -13.40, PL, 3.82, 18.68, 18.80, hm.marble); // north shaft wall
  B(-11.55, -13.40, PL, 3.82, 20.28, 20.40, hm.marble); // south shaft wall
  B(-11.52, -11.68, PL, 3.82, 18.70, 18.96, hm.granite);
  B(-11.52, -11.68, PL, 3.82, 20.14, 20.40, hm.granite);
  B(-11.52, -11.68, PL + 2.28, 3.82, 18.96, 20.14, hm.marble);
  B(-11.49, -11.55, PL, PL + 2.32, 18.92, 18.97, hm.gold);
  B(-11.49, -11.55, PL, PL + 2.32, 20.13, 20.18, hm.gold);
  B(-11.49, -11.55, PL + 2.27, PL + 2.33, 18.92, 20.18, hm.gold);
  addScreenPlane(dynamicParent, 0.36, 0.82, [-11.48, PL + 1.46, 18.80], Math.PI / 2, hm.liftDisplay);

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
  //    Stair lane: x ∈ [-14.2, -9.6], z ∈ [21.58, 22.78]
  //    Climbing in -X direction (from x = -9.65 up to x = -14.10)
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

  // Per-floor floor slabs (with cutouts for BOTH Elevator Shaft & Stairwell)
  for (let k = 1; k <= FLOORS; k++) {
    const y = L(k);
    buildSlabWithShaftCutouts(-5.5, BX + 0.25, y - 0.24, y + 0.02, 14.7, EZ - 0.25, hm.creamTile);
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
  // Roof slab with cutouts for BOTH Elevator Shaft & Stairwell
  buildSlabWithShaftCutouts(-3.65, BX, ROOF - 0.24, ROOF + 0.04, 14.3, EZ, hm.stucco);

  // Rooftop Parapet Walls
  B(-3.65, -3.9, ROOF + 0.04, ROOF + 1.15, 14.3, EZ, hm.stucco);
  B(-3.65, BX, ROOF + 0.04, ROOF + 1.15, 14.3, 14.55, hm.stucco);
  B(BX + 0.25, BX, ROOF + 0.04, ROOF + 1.15, 14.3, EZ, hm.stucco);
  B(-3.65, BX, ROOF + 0.04, ROOF + 1.15, EZ - 0.25, EZ, hm.stucco);
  // Architectural grey frame & pergola beams raised to 2.7m above roof so player walks freely underneath!
  B(-3.75, -5.6, ROOF + 2.65, ROOF + 2.95, 18.6, 28.6, hm.darkGrey);
  for (const z of [18.75, 23.45, 28.45]) B(-3.8, -4.1, ROOF + 0.04, ROOF + 2.65, z - 0.15, z + 0.15, hm.darkGrey);

  // Stair & Lift Penthouse Room on Roof (x = -9.4 .. -16.6, z = 18.2 .. 23.1) with wide landing & open door at x = -9.4, z = 18.9..21.4
  B(-9.4, -16.6, ROOF + 3.0, ROOF + 3.25, 18.2, 23.1, hm.stucco);
  B(-16.35, -16.6, ROOF + 0.04, ROOF + 3.0, 18.2, 23.1, hm.stucco);
  B(-9.4, -16.6, ROOF + 0.04, ROOF + 3.0, 18.2, 18.45, hm.stucco);
  B(-9.4, -16.6, ROOF + 0.04, ROOF + 3.0, 22.85, 23.1, hm.stucco);
  B(-9.4, -9.65, ROOF + 0.04, ROOF + 3.0, 18.2, 18.9, hm.stucco);
  B(-9.4, -9.65, ROOF + 0.04, ROOF + 3.0, 21.4, 23.1, hm.stucco);
  // Rooftop Elevator Shaft Portal inside Penthouse Room
  B(-13.26, -13.40, ROOF + 0.04, ROOF + 2.98, 18.70, 20.40, hm.marble);
  B(-11.55, -13.40, ROOF + 0.04, ROOF + 2.98, 18.68, 18.80, hm.marble);
  B(-11.55, -13.40, ROOF + 0.04, ROOF + 2.98, 20.28, 20.40, hm.marble);
  B(-11.52, -11.68, ROOF + 0.04, ROOF + 2.98, 18.70, 18.96, hm.granite);
  B(-11.52, -11.68, ROOF + 0.04, ROOF + 2.98, 20.14, 20.40, hm.granite);
  B(-11.52, -11.68, ROOF + 2.30, ROOF + 2.98, 18.96, 20.14, hm.marble);
  B(-11.0, -13.8, ROOF + 3.25, ROOF + 4.5, 18.8, 21.6, hm.darkGrey); // overhead water tank
  addScreenPlane(dynamicParent, 0.38, 0.82, [-11.48, ROOF + 1.45, 18.82], Math.PI / 2, hm.liftDisplay); // rooftop lift panel

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
  // 10. ANIMATED SLIDING LANDING DOORS ON EVERY FLOOR (k = 0..10)
  //     + 3D MOVING LUXURY ELEVATOR CABIN (elevatorCabGroup)
  // ==========================================================================
  const landingDoors = [];
  for (let k = 0; k <= 10; k++) {
    const fy = L(k) + 0.02;
    const dg = new THREE.Group();
    dg.name = `LiftLandingDoors_${k}`;
    dynamicParent.add(dg);

    const leftDoor = box(dg, [0.045, 2.26, 0.60], [-11.54, fy + 1.13, 19.25], hm.steel);
    const rightDoor = box(dg, [0.045, 2.26, 0.60], [-11.54, fy + 1.13, 19.85], hm.steel);
    const initOpen = k === 0 ? 1.0 : 0.0;
    leftDoor.position.z = 19.25 - initOpen * 0.56;
    rightDoor.position.z = 19.85 + initOpen * 0.56;
    landingDoors.push({ level: k, y: L(k), leftDoor, rightDoor, open: initOpen });
  }

  // 3D Walk-In Luxury Elevator Cabin (rides smoothly from y = 0.5m to y = 31.0m!)
  const elevatorCabGroup = new THREE.Group();
  elevatorCabGroup.name = 'SkArshanElevatorCabin';
  elevatorCabGroup.position.set(0, state.liftY, 0);
  dynamicParent.add(elevatorCabGroup);
  const BC = makeB(elevatorCabGroup);

  // Cabin Swirl-Marble Floor & Gold Border Inlay (x = -11.58 .. -13.32, z = 18.74 .. 20.36)
  BC(-11.56, -13.34, -0.04, 0.022, 18.74, 20.36, hm.marble);
  BC(-11.60, -13.30, 0.022, 0.028, 18.78, 18.84, hm.gold);
  BC(-11.60, -13.30, 0.022, 0.028, 20.26, 20.32, hm.gold);
  BC(-13.24, -13.30, 0.022, 0.028, 18.78, 20.32, hm.gold);

  // Cabin Walnut & Brushed Gold Interior Walls
  BC(-13.26, -13.34, 0.02, 2.42, 18.74, 20.36, hm.woodWalnut); // rear cabin wall
  BC(-11.58, -13.34, 0.02, 2.42, 18.72, 18.79, hm.woodWalnut); // north cabin wall
  BC(-11.58, -13.34, 0.02, 2.42, 20.31, 20.38, hm.woodWalnut); // south cabin wall
  // Beveled Rear Mirror & Brushed Gold Handrails inside Cabin
  BC(-13.22, -13.26, 0.94, 2.16, 18.90, 20.20, hm.mirrorMat);
  BC(-13.21, -13.25, 0.90, 0.94, 18.88, 20.22, hm.gold);
  BC(-13.21, -13.25, 2.16, 2.20, 18.88, 20.22, hm.gold);
  rodBetween(elevatorCabGroup, [-13.16, 0.86, 18.86], [-13.16, 0.86, 20.24], 0.024, hm.gold, 10);
  rodBetween(elevatorCabGroup, [-11.72, 0.86, 18.84], [-13.16, 0.86, 18.84], 0.022, hm.gold, 10);
  rodBetween(elevatorCabGroup, [-11.72, 0.86, 20.26], [-13.16, 0.86, 20.26], 0.022, hm.gold, 10);

  // Cabin Coffered Warm LED Ceiling
  BC(-11.58, -13.34, 2.38, 2.45, 18.74, 20.36, hm.granite);
  BC(-11.82, -13.10, 2.35, 2.38, 18.96, 20.14, hm.ledWarm);

  // Cabin Front Return Jambs & Sliding Inner Doors
  BC(-11.58, -11.65, 0.02, 2.42, 18.74, 18.96, hm.steel);
  BC(-11.58, -11.65, 0.02, 2.42, 20.14, 20.36, hm.steel);
  BC(-11.58, -11.65, 2.28, 2.42, 18.96, 20.14, hm.steel);
  const cabLeftDoor = box(elevatorCabGroup, [0.04, 2.26, 0.60], [-11.60, 1.15, 19.25 - state.liftDoorOpen * 0.56], hm.steel);
  const cabRightDoor = box(elevatorCabGroup, [0.04, 2.26, 0.60], [-11.60, 1.15, 19.85 + state.liftDoorOpen * 0.56], hm.steel);

  // 3D Interactive Button Column inside the Elevator Cabin (on south wall z = 20.29 & front jamb)
  BC(-12.02, -12.48, 0.92, 1.82, 20.27, 20.31, hm.gold);
  addScreenPlane(elevatorCabGroup, 0.42, 0.84, [-12.25, 1.37, 20.26], Math.PI, hm.liftDisplay);
  addScreenPlane(elevatorCabGroup, 0.36, 0.72, [-11.95, 1.37, 18.81], 0, hm.liftDisplay);

  // ==========================================================================
  // 11. PER-FLOOR HIGH-FI APARTMENT INTERIORS (Culled dynamically by player Y)
  // ==========================================================================
  const floorInteriors = [];
  for (let k = 1; k <= FLOORS; k++) {
    const fg = new THREE.Group();
    fg.name = `SkArshanFloor_${k}`;
    const staticPart = new THREE.Group();
    const screenPart = new THREE.Group();
    fg.add(staticPart, screenPart);
    buildApartmentFloorInterior(staticPart, screenPart, hm, L(k), k);
    // Add Floor Number Plaque on the stair/lobby wall opposite the elevator so player clearly sees floor number!
    const stopInfo = LIFT_STOPS[k];
    const plaqueMat = new THREE.MeshBasicMaterial({
      map: createFloorPlaqueTexture(stopInfo.code, `${k + 1} তলা লবি`, `FLOOR ${k} · LUXURY APARTMENTS`),
    });
    addScreenPlane(screenPart, 1.35, 0.42, [-9.55, L(k) + 1.72, 21.48], 0, plaqueMat);
    mergeStaticMeshes(staticPart);
    dynamicParent.add(fg);
    floorInteriors.push({ level: k, y: L(k), group: fg });
  }

  function updateLiftDisplayCanvas() {
    const canvas = hm.liftDisplay?.map?.userData?.canvas;
    if (!canvas) return;
    const stop = LIFT_STOPS[state.liftFloorIndex] || LIFT_STOPS[0];
    let arrow = '●';
    let statusText = 'DOOR OPEN · দরজা খোলা';
    if (state.liftPhase === 'closing') {
      arrow = state.liftDirection > 0 ? '▲' : (state.liftDirection < 0 ? '▼' : '►◄');
      statusText = 'CLOSING · দরজা বন্ধ হচ্ছে';
    } else if (state.liftPhase === 'moving') {
      arrow = state.liftDirection >= 0 ? '▲' : '▼';
      const targetStop = LIFT_STOPS[state.liftTargetIndex] || stop;
      statusText = `GOING TO ${targetStop.code} · চলমান`;
    } else if (state.liftPhase === 'opening') {
      arrow = '◄►';
      statusText = 'ARRIVED · দরজা খুলছে';
    } else if (state.liftDoorOpen < 0.2) {
      arrow = '■';
      statusText = 'READY · প্রেস করুন';
    }
    drawLiftDisplayCanvas(canvas, stop.code, arrow, statusText, state.liftTargetIndex);
    hm.liftDisplay.map.needsUpdate = true;
  }

  function isNearGate(pos) {
    return pos.x >= -6.5 && pos.x <= -2.2 && pos.z >= 18.2 && pos.z <= 22.6 && (pos.y - 1.68) < 2.2;
  }

  function isInsideLift(pos) {
    return pos.x >= -13.38 && pos.x <= -11.52 && pos.z >= 18.72 && pos.z <= 20.38;
  }

  function isNearLiftLobby(pos) {
    return pos.x >= -13.45 && pos.x <= -9.15 && pos.z >= 18.10 && pos.z <= 21.25;
  }

  function getNearestFloorIndex(footY) {
    let bestIdx = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < LIFT_STOPS.length; i++) {
      const d = Math.abs(footY - LIFT_STOPS[i].y);
      if (d < bestDiff) {
        bestDiff = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  function goToFloor(targetIdx, playerPos = null) {
    const idx = THREE.MathUtils.clamp(Math.round(targetIdx), 0, LIFT_STOPS.length - 1);
    playLiftSound('beep');
    state.liftTargetIndex = idx;

    // If the player clicked a floor button while standing just outside the lift door, step them cleanly inside the cabin!
    if (playerPos && isNearLiftLobby(playerPos) && !isInsideLift(playerPos)) {
      const playerFloorIdx = getNearestFloorIndex(playerPos.y - 1.68);
      if (Math.abs(state.liftY - LIFT_STOPS[playerFloorIdx].y) < 0.35) {
        playerPos.x = -12.38;
        playerPos.z = 19.55;
        playerPos.y = state.liftY + 1.68;
      }
    }

    const targetY = LIFT_STOPS[idx].y;
    if (Math.abs(state.liftY - targetY) < 0.04) {
      state.liftFloorIndex = idx;
      state.liftDirection = 0;
      state.liftPhase = 'opening';
      updateLiftDisplayCanvas();
      return true;
    }

    state.liftDirection = targetY > state.liftY ? 1 : -1;
    state.liftPhase = state.liftDoorOpen > 0.05 ? 'closing' : 'moving';
    updateLiftDisplayCanvas();
    return true;
  }

  function openDoors(playerPos = null) {
    playLiftSound('beep');
    if (playerPos && !isInsideLift(playerPos)) {
      const playerFloorIdx = getNearestFloorIndex(playerPos.y - 1.68);
      if (Math.abs(state.liftY - LIFT_STOPS[playerFloorIdx].y) > 0.1) {
        return goToFloor(playerFloorIdx, null);
      }
    }
    if (state.liftPhase !== 'moving') {
      state.liftPhase = 'opening';
      updateLiftDisplayCanvas();
    }
    return true;
  }

  function closeDoors() {
    playLiftSound('beep');
    if (state.liftPhase === 'open' || state.liftPhase === 'opening') {
      state.liftPhase = 'closing';
      updateLiftDisplayCanvas();
    }
    return true;
  }

  return {
    group: g,
    state,
    stops: LIFT_STOPS,
    nearestFloorIndex: getNearestFloorIndex,
    isInsideLift,
    isNearLiftLobby,
    isLiftOpenAtY(footY) {
      return Math.abs(footY - state.liftY) < 1.35 && state.liftDoorOpen > 0.55;
    },
    goToFloor,
    openDoors,
    closeDoors,
    getPrompt(playerPos) {
      if (isInsideLift(playerPos)) {
        const curStop = LIFT_STOPS[state.liftFloorIndex] || LIFT_STOPS[0];
        if (state.liftPhase === 'moving' || state.liftPhase === 'closing') {
          const dst = LIFT_STOPS[state.liftTargetIndex] || curStop;
          return `লিফট চলছে: ${curStop.code} → ${dst.label} ...`;
        }
        return `[E / L / Click] লিফটের ফ্লোর নাম্বার বাটন প্যানেল খুলুন (বর্তমান: ${curStop.code})`;
      }
      if (isNearLiftLobby(playerPos)) {
        const playerFloorIdx = getNearestFloorIndex(playerPos.y - 1.68);
        const atThisFloor = Math.abs(state.liftY - LIFT_STOPS[playerFloorIdx].y) < 0.25;
        if (atThisFloor && state.liftDoorOpen > 0.7) {
          return `[ভিতরে হাঁটুন অথবা E / L চাপুন] হাই-স্পিড লিফটে ঢুকুন ও নাম্বার ক্লিক করুন`;
        }
        return `[E / F / Click] হাই-স্পিড লিফট ডাকুন ও দরজা খুলুন (Call Lift)`;
      }
      if (isNearGate(playerPos)) {
        return state.gateOpen
          ? 'Press E / F · শেখ আরশান আলিফ টাওয়ারের মেইন গেট বন্ধ করুন (Close Gate)'
          : 'Press E / F · শেখ আরশান আলিফ টাওয়ারের মেইন গেট খুলুন (Open Gate)';
      }
      return null;
    },
    interact(playerPos) {
      if (isInsideLift(playerPos) || isNearLiftLobby(playerPos)) {
        const playerFloorIdx = getNearestFloorIndex(playerPos.y - 1.68);
        if (!isInsideLift(playerPos) && Math.abs(state.liftY - LIFT_STOPS[playerFloorIdx].y) > 0.2) {
          goToFloor(playerFloorIdx, null);
        } else if (state.liftDoorOpen < 0.8 && state.liftPhase !== 'moving') {
          state.liftPhase = 'opening';
          updateLiftDisplayCanvas();
        }
        return 'lift_panel';
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

      // Auto-call / auto-open lift doors when player walks right up to the lift lobby
      const footY = playerPos.y - 1.68;
      if (state.liftPhase === 'open' && !isInsideLift(playerPos) && isNearLiftLobby(playerPos)) {
        const playerFloorIdx = getNearestFloorIndex(footY);
        if (Math.abs(state.liftY - LIFT_STOPS[playerFloorIdx].y) > 0.25) {
          state.liftTargetIndex = playerFloorIdx;
          state.liftDirection = LIFT_STOPS[playerFloorIdx].y > state.liftY ? 1 : -1;
          state.liftPhase = state.liftDoorOpen > 0.05 ? 'closing' : 'moving';
          updateLiftDisplayCanvas();
        } else if (state.liftDoorOpen < 0.95) {
          state.liftPhase = 'opening';
        }
      }

      // Elevator State Machine: closing -> moving -> opening -> open
      const playerInCab = isInsideLift(playerPos) && Math.abs(footY - state.liftY) < 1.85;
      if (state.liftPhase === 'closing') {
        state.liftDoorOpen = Math.max(0, state.liftDoorOpen - delta * 2.4);
        if (state.liftDoorOpen <= 0.01) {
          state.liftDoorOpen = 0;
          const targetY = LIFT_STOPS[state.liftTargetIndex].y;
          if (Math.abs(targetY - state.liftY) > 0.04) {
            state.liftPhase = 'moving';
            state.liftDirection = targetY > state.liftY ? 1 : -1;
          } else {
            state.liftPhase = 'open';
            state.liftDirection = 0;
          }
          updateLiftDisplayCanvas();
        }
      } else if (state.liftPhase === 'moving') {
        const targetY = LIFT_STOPS[state.liftTargetIndex].y;
        const diff = targetY - state.liftY;
        const speed = 7.8; // High-speed smooth luxury lift (7.8 m/s)
        const step = Math.sign(diff) * Math.min(Math.abs(diff), speed * delta);
        const prevFloorIdx = state.liftFloorIndex;
        state.liftY += step;
        if (playerInCab) {
          playerPos.y = state.liftY + 1.68;
        }
        const curFloorIdx = getNearestFloorIndex(state.liftY);
        if (curFloorIdx !== prevFloorIdx) {
          state.liftFloorIndex = curFloorIdx;
          playLiftSound('tick');
          updateLiftDisplayCanvas();
        }
        if (Math.abs(targetY - state.liftY) <= 0.02) {
          state.liftY = targetY;
          if (playerInCab) playerPos.y = state.liftY + 1.68;
          state.liftFloorIndex = state.liftTargetIndex;
          state.liftDirection = 0;
          state.liftPhase = 'opening';
          playLiftSound('chime');
          updateLiftDisplayCanvas();
        }
      } else if (state.liftPhase === 'opening') {
        state.liftDoorOpen = Math.min(1, state.liftDoorOpen + delta * 2.4);
        if (state.liftDoorOpen >= 0.99) {
          state.liftDoorOpen = 1.0;
          state.liftPhase = 'open';
          updateLiftDisplayCanvas();
        }
      }

      // Sync 3D Elevator Cabin Y & Sliding Cabin Doors + Current Floor Landing Doors
      elevatorCabGroup.position.y = state.liftY;
      cabLeftDoor.position.z = 19.25 - state.liftDoorOpen * 0.56;
      cabRightDoor.position.z = 19.85 + state.liftDoorOpen * 0.56;

      for (const ld of landingDoors) {
        const isCurrentFloor = Math.abs(state.liftY - ld.y) < 0.18;
        const targetOpen = isCurrentFloor ? state.liftDoorOpen : 0.0;
        if (Math.abs(ld.open - targetOpen) > 0.001) {
          ld.open += (targetOpen - ld.open) * Math.min(1, delta * 14.0);
          ld.leftDoor.position.z = 19.25 - ld.open * 0.56;
          ld.rightDoor.position.z = 19.85 + ld.open * 0.56;
        }
      }

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
