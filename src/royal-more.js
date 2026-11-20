import * as THREE from 'three';
import { box, cylinder, rodBetween, mergeStaticMeshes } from './scene-utils.js';
import { attachDerivedPBRMaps } from './aaa-shaders.js';
import { decorateCorridorPole } from './khulna-street-props.js';
import { buildCNGAuto, buildEasybike } from './khulna-vehicles.js';

/**
 * ROYAL MORE / ROYAL CHATTAR (খুলনা রয়্যালের মোড়)
 * Exact real-world OSM roundabout center: (-716.8, -291.8)
 * Intersecting roads:
 *   1) Khan Jahan Ali Road (SE from PTI More / Rupsha)
 *   2) Khan Jahan Ali Road (NW toward Shantidham / Dakbangla)
 *   3) KDA Avenue (West dual carriageway toward Shibbari / Sonadanga)
 *
 * High-detail, GPU-batched (merged static meshes + selective night emissives + distance culling)
 * showcase district featuring:
 *   - Exact roundabout carriageway, dual-lane dividers, slip-road islands, zebra crossings & curbs
 *   - Iconic Royal Chattar Monument (leaping Khulna fish/shrimp sculpture & animated fountain)
 *   - Hotel Royal International (10-story landmark est. 1986)
 *   - Hotel Castle Salam (6-story classic hotel)
 *   - Greenline Paribahan Counter & Luxury AC Coach
 *   - Kacchi Ghor & Prime Bank 24/7 ATM Plaza
 *   - Fatima Hospital & Diagnostic Center
 *   - Royal Sweets, Pharmacy & Islami Bank ATM Corner Arcade
 *   - KMP Traffic Police Control Box & Directional Highway Gantry
 */

export const ROYAL_MORE_CENTER = { x: -716.8, z: -291.8 };

function seeded(seed = 2026) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeLightBoxTexture({
  title,
  subtitle = '',
  bg = '#0f3d2e',
  fg = '#ffffff',
  accent = '#fde047',
  border = '#ffffff',
  width = 512,
  height = 176,
}) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, 'rgba(255,255,255,0.16)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.24)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = border;
  ctx.lineWidth = 7;
  ctx.strokeRect(7, 7, width - 14, height - 14);
  ctx.fillStyle = accent;
  ctx.fillRect(16, 16, 10, height - 32);

  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 34px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText(title, 40, subtitle ? height * 0.38 : height * 0.5, width - 60);
  if (subtitle) {
    ctx.fillStyle = accent;
    ctx.font = '600 20px "Manrope", "Noto Sans Bengali", sans-serif';
    ctx.fillText(subtitle, 40, height * 0.72, width - 60);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makePlasterTexture(baseHex, seedVal = 401, { subtleBrick = false, darkStreak = 0.12 } = {}) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.055)' : `rgba(34,28,22,${0.03 + rnd() * 0.055})`;
    ctx.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 4, 2 + rnd() * 4);
  }
  for (let i = 0; i < 30; i++) {
    const x = rnd() * 256;
    const h = 24 + rnd() * 88;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgba(25,28,24,${darkStreak})`);
    g.addColorStop(1, 'rgba(25,28,24,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 3 + rnd() * 7, h);
  }
  if (subtleBrick) {
    ctx.strokeStyle = 'rgba(24,18,14,0.20)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < 256; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeCurbStripeTexture(c1 = '#dc2626', c2 = '#f8fafc') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d');
  for (let x = 0; x < 256; x += 64) {
    ctx.fillStyle = (x / 64) % 2 === 0 ? c1 : c2;
    ctx.fillRect(x, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeShopfrontGlassTexture(kind = 'sweets') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (kind === 'atm') {
    const g = ctx.createRadialGradient(128, 120, 14, 128, 128, 120);
    g.addColorStop(0, '#10b981');
    g.addColorStop(0.6, '#065f46');
    g.addColorStop(1, '#022c22');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(72, 66, 112, 154);
    ctx.fillStyle = '#6ee7b7';
    ctx.fillRect(88, 86, 80, 48);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('24/7 ATM', 128, 44);
  } else if (kind === 'bus') {
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(14, 18, 228, 22);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(24, 62, 208, 130);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(36, 76, 84, 54);
    ctx.fillRect(136, 76, 84, 54);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TICKET COUNTER', 128, 168);
  } else if (kind === 'hospital') {
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(0, 0, 256, 56);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(114, 88, 28, 84);
    ctx.fillRect(86, 116, 84, 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('EMERGENCY 24H', 128, 36);
  } else {
    // Warm sweets / restaurant / pharmacy display
    ctx.fillStyle = kind === 'kacchi' ? '#451a03' : '#1e293b';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(12, 16, 232, 18);
    for (let y = 56; y < 224; y += 46) {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(16, y + 32, 224, 6);
      for (let x = 22; x < 226; x += 26) {
        ctx.fillStyle = ['#f59e0b', '#fbbf24', '#ef4444', '#fde047', '#fb923c'][(x + y) % 5];
        ctx.fillRect(x, y + 8, 18, 22);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRoyalBank(m) {
  const mkPlaster = (hex, seedVal, rough = 0.80, opts = {}) => {
    const tex = makePlasterTexture(hex, seedVal, opts);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: rough, metalness: 0.03, envMapIntensity: 0.72 });
    attachDerivedPBRMaps(mat, tex, { strength: opts.subtleBrick ? 2.4 : 1.7, roughBase: rough, normalScale: 0.65 });
    return mat;
  };

  const redWhiteCurbTex = makeCurbStripeTexture('#dc2626', '#f8fafc');
  redWhiteCurbTex.repeat.set(6, 1);
  const blackWhiteCurbTex = makeCurbStripeTexture('#18181b', '#f8fafc');
  blackWhiteCurbTex.repeat.set(8, 1);

  const dispAtmTex = makeShopfrontGlassTexture('atm');
  const dispBusTex = makeShopfrontGlassTexture('bus');
  const dispHospTex = makeShopfrontGlassTexture('hospital');
  const dispKacchiTex = makeShopfrontGlassTexture('kacchi');
  const dispSweetsTex = makeShopfrontGlassTexture('sweets');

  const bank = {
    asphalt: m.road || new THREE.MeshStandardMaterial({ color: 0x3b4046, roughness: 0.78, metalness: 0.05 }),
    brick: m.brick || mkPlaster('#9b4634', 101, 0.88, { subtleBrick: true }),
    concrete: m.concrete || mkPlaster('#a8a69e', 102, 0.88),
    darkConcrete: m.darkConcrete || mkPlaster('#4b4f52', 103, 0.90),
    royalCream: mkPlaster('#efe6d5', 201, 0.74),
    royalSand: mkPlaster('#d6b992', 202, 0.78),
    royalTerracotta: mkPlaster('#b2523d', 203, 0.82, { subtleBrick: true }),
    modernWhite: mkPlaster('#eef2f6', 204, 0.68),
    modernSlate: mkPlaster('#334155', 205, 0.62),
    hospitalBlue: mkPlaster('#0284c7', 206, 0.62),
    emeraldWall: mkPlaster('#065f46', 207, 0.68),
    sageWall: mkPlaster('#9bb0a3', 208, 0.80),
    marbleWhite: new THREE.MeshPhysicalMaterial({ color: 0xf4f1ea, roughness: 0.22, metalness: 0.05, clearcoat: 0.75, envMapIntensity: 1.2 }),
    blackGranite: new THREE.MeshPhysicalMaterial({ color: 0x1b1f24, roughness: 0.18, metalness: 0.12, clearcoat: 0.85, envMapIntensity: 1.35 }),
    curbRedWhite: new THREE.MeshStandardMaterial({ map: redWhiteCurbTex, roughness: 0.76 }),
    curbBlackWhite: new THREE.MeshStandardMaterial({ map: blackWhiteCurbTex, roughness: 0.76 }),
    roadLineWhite: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.82 }),
    roadLineYellow: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.78 }),
    glassCurtain: new THREE.MeshPhysicalMaterial({
      color: 0x133852,
      roughness: 0.07,
      metalness: 0.25,
      clearcoat: 0.96,
      envMapIntensity: 1.75,
    }),
    glassLobby: new THREE.MeshPhysicalMaterial({
      color: 0x1e4c68,
      roughness: 0.08,
      metalness: 0.18,
      clearcoat: 0.9,
      transparent: true,
      opacity: 0.65,
      envMapIntensity: 1.6,
    }),
    warmWindowLit: new THREE.MeshStandardMaterial({
      color: 0xffebb8,
      emissive: 0xffcf70,
      emissiveIntensity: 0.35,
      roughness: 0.24,
    }),
    coolWindowLit: new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x7dd3fc,
      emissiveIntensity: 0.30,
      roughness: 0.24,
    }),
    goldMetal: new THREE.MeshPhysicalMaterial({
      color: 0xf5b82e,
      roughness: 0.22,
      metalness: 0.88,
      clearcoat: 0.65,
      envMapIntensity: 1.65,
    }),
    silverSculpture: new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      roughness: 0.18,
      metalness: 0.92,
      clearcoat: 0.8,
      envMapIntensity: 1.8,
    }),
    steelDark: new THREE.MeshStandardMaterial({ color: 0x1e252c, roughness: 0.44, metalness: 0.74 }),
    aluminum: new THREE.MeshStandardMaterial({ color: 0xd1dae2, roughness: 0.24, metalness: 0.88, envMapIntensity: 1.3 }),
    fountainWater: new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      emissive: 0x0369a1,
      emissiveIntensity: 0.25,
      roughness: 0.08,
      metalness: 0.1,
      transparent: true,
      opacity: 0.86,
      clearcoat: 1.0,
    }),
    sprayJet: new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x7dd3fc,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.72,
      roughness: 0.2,
    }),
    grassTurf: new THREE.MeshStandardMaterial({ color: 0x2f7d3a, roughness: 0.92 }),
    flowerRed: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.82 }),
    flowerGold: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.82 }),
    redCarpet: new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.86 }),
    policeBlue: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.45, metalness: 0.15 }),
    lampGlow: new THREE.MeshStandardMaterial({ color: 0xfff8e6, emissive: 0xffd98a, emissiveIntensity: 0.85 }),
    uplightCyan: new THREE.MeshStandardMaterial({ color: 0xbae6fd, emissive: 0x38bdf8, emissiveIntensity: 0.65 }),
    uplightGold: new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.75 }),
    busGreen: new THREE.MeshPhysicalMaterial({ color: 0x047857, roughness: 0.20, metalness: 0.25, clearcoat: 0.95, envMapIntensity: 1.5 }),
    busAccent: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 }),
    tireBlack: new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: 0.88 }),
    acBox: mkPlaster('#dde2e6', 299, 0.50, { darkStreak: 0.03 }),
    waterTank: new THREE.MeshPhysicalMaterial({ color: 0x12181f, roughness: 0.40, clearcoat: 0.35 }),
    dispAtm: new THREE.MeshStandardMaterial({ map: dispAtmTex, emissive: 0x10b981, emissiveMap: dispAtmTex, emissiveIntensity: 0.75 }),
    dispBus: new THREE.MeshStandardMaterial({ map: dispBusTex, emissive: 0x38bdf8, emissiveMap: dispBusTex, emissiveIntensity: 0.60 }),
    dispHosp: new THREE.MeshStandardMaterial({ map: dispHospTex, emissive: 0x93c5fd, emissiveMap: dispHospTex, emissiveIntensity: 0.60 }),
    dispKacchi: new THREE.MeshStandardMaterial({ map: dispKacchiTex, emissive: 0xfbbf24, emissiveMap: dispKacchiTex, emissiveIntensity: 0.70 }),
    dispSweets: new THREE.MeshStandardMaterial({ map: dispSweetsTex, emissive: 0xfde047, emissiveMap: dispSweetsTex, emissiveIntensity: 0.70 }),
    emissiveList: [],
  };

  bank.emissiveList.push(
    { mat: bank.warmWindowLit, day: 0.22, night: 1.85 },
    { mat: bank.coolWindowLit, day: 0.18, night: 1.65 },
    { mat: bank.lampGlow, day: 0.65, night: 3.40 },
    { mat: bank.uplightCyan, day: 0.35, night: 2.60 },
    { mat: bank.uplightGold, day: 0.45, night: 2.80 },
    { mat: bank.fountainWater, day: 0.18, night: 1.15 },
    { mat: bank.sprayJet, day: 0.25, night: 1.50 },
    { mat: bank.dispAtm, day: 0.65, night: 1.75 },
    { mat: bank.dispBus, day: 0.50, night: 1.55 },
    { mat: bank.dispHosp, day: 0.50, night: 1.55 },
    { mat: bank.dispKacchi, day: 0.60, night: 1.65 },
    { mat: bank.dispSweets, day: 0.60, night: 1.65 },
  );

  return bank;
}

function addSignBox(dynamicG, bank, opts, pos, rotY, w, h) {
  const tex = makeLightBoxTexture(opts);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: 0.42,
    roughness: 0.28,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });
  bank.emissiveList.push({ mat, day: 0.38, night: 1.55 });
  const grp = new THREE.Group();
  grp.position.set(pos[0], pos[1], pos[2]);
  grp.rotation.y = rotY;
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.12), bank.steelDark);
  const face = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.145), mat);
  grp.add(bezel, face);
  dynamicG.add(grp);
  return grp;
}

function addRotBox(parent, size, pos, mat, rotY = 0, opts = {}) {
  const mesh = box(parent, size, pos, mat, opts);
  if (rotY) mesh.rotation.y = rotY;
  return mesh;
}

function addRoadRibbon(parent, pts, width, y, mat, uvScale = 5.5) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz) + 0.85;
    const yaw = Math.atan2(dx, dz);
    addRotBox(parent, [width, 0.04, len], [(x0 + x1) * 0.5, y, (z0 + z1) * 0.5], mat, yaw, {
      castShadow: false,
      uvScale,
    });
  }
}

function addZebraCrosswalk(parent, bank, cx, cz, yaw, roadWidth = 9.2) {
  const grp = new THREE.Group();
  grp.position.set(cx, 0.044, cz);
  grp.rotation.y = yaw;
  const count = Math.floor(roadWidth / 0.92);
  const start = -((count - 1) * 0.92) * 0.5;
  for (let i = 0; i < count; i++) {
    box(grp, [0.46, 0.014, 2.35], [start + i * 0.92, 0, 0], bank.roadLineWhite, { castShadow: false });
  }
  parent.add(grp);
}

function addDoubleArmLamp(staticG, dynamicG, bank, x, z, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  cylinder(g, 0.10, 0.15, 7.6, [0, 3.8, 0], bank.aluminum, 8);
  cylinder(g, 0.22, 0.26, 0.35, [0, 0.175, 0], bank.darkConcrete, 8);
  for (const sx of [-1, 1]) {
    box(g, [1.55, 0.07, 0.08], [sx * 0.78, 7.45, 0], bank.aluminum);
    box(g, [0.48, 0.11, 0.22], [sx * 1.48, 7.52, 0], bank.steelDark);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.16), bank.lampGlow);
    bulb.position.set(sx * 1.48, 7.45, 0);
    dynamicG.add(bulb);
    // Align dynamic bulb into world space
    bulb.position.set(
      x + Math.cos(rotY) * (sx * 1.48),
      7.45,
      z - Math.sin(rotY) * (sx * 1.48),
    );
    bulb.rotation.y = rotY;
  }
  staticG.add(g);
}

function addOrnamentalPalm(staticG, bank, x, z, height = 7.4, seed = 11) {
  const rnd = seeded(seed);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6f553b, roughness: 0.92 });
  const leafMat = bank.grassTurf;
  const leanX = (rnd() - 0.5) * 0.65;
  const leanZ = (rnd() - 0.5) * 0.65;
  let px = x;
  let py = 0;
  let pz = z;
  for (let i = 1; i <= 4; i++) {
    const t = i / 4;
    const nx = x + leanX * t * t;
    const ny = height * t;
    const nz = z + leanZ * t * t;
    rodBetween(staticG, [px, py, pz], [nx, ny, nz], THREE.MathUtils.lerp(0.19, 0.10, t), trunkMat, 7);
    px = nx; py = ny; pz = nz;
  }
  for (let f = 0; f < 7; f++) {
    const a = (f / 7) * Math.PI * 2 + rnd() * 0.25;
    const len = 2.25 + (f % 2) * 0.35;
    const mx = px + Math.cos(a) * len * 0.55;
    const my = py + 0.45;
    const mz = pz + Math.sin(a) * len * 0.55;
    const tx = px + Math.cos(a) * len;
    const ty = py - 0.45;
    const tz = pz + Math.sin(a) * len;
    rodBetween(staticG, [px, py, pz], [mx, my, mz], 0.06, leafMat, 5);
    rodBetween(staticG, [mx, my, mz], [tx, ty, tz], 0.045, leafMat, 5);
    addRotBox(staticG, [0.46, 0.06, len * 0.68], [mx, my - 0.08, mz], leafMat, Math.atan2(tx - px, tz - pz));
  }
}

/**
 * 1. EXACT ROYAL MORE ROUNDABOUT & INTERSECTING KHULNA ROADS
 * Matches OSM road polylines in khulna-world-data.json 1:1 with high-detail asphalt,
 * painted curbs, medians, zebra crossings, dashed lane rings & slip-road islands.
 */
function buildRoyalMoreRoads(staticG, dynamicG, bank) {
  const CX = ROYAL_MORE_CENTER.x;
  const CZ = ROYAL_MORE_CENTER.z;

  // Main Circular Roundabout Asphalt Ring (inner r = 4.45m, outer r = 13.5m)
  const ringGeo = new THREE.RingGeometry(4.45, 13.5, 48);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMesh = new THREE.Mesh(ringGeo, bank.asphalt);
  ringMesh.position.set(CX, 0.036, CZ);
  ringMesh.receiveShadow = true;
  staticG.add(ringMesh);

  // Dashed White Lane Ring around the Roundabout (r = 8.95m)
  const dashCount = 24;
  for (let i = 0; i < dashCount; i++) {
    const a = (i / dashCount) * Math.PI * 2;
    const r = 8.95;
    addRotBox(
      staticG,
      [0.18, 0.012, 1.35],
      [CX + Math.cos(a) * r, 0.043, CZ + Math.sin(a) * r],
      bank.roadLineWhite,
      -a,
      { castShadow: false },
    );
  }

  // Exact Intersecting High-Detail Road Aprons (overlaying OSM splines seamlessly)
  const seKhanJahan = [[-644, -248], [-670, -264], [-686, -276], [-711, -290]];
  const nwKhanJahan = [[-716, -296], [-727.9, -317.9], [-742.2, -337.3], [-756.6, -353.9], [-778.6, -386.1]];
  const kdaSouthLane = [[-715, -285.3], [-735.8, -277.2], [-766.8, -273.0], [-801.0, -274.8], [-832.4, -283.2]];
  const kdaNorthLane = [[-721, -296.5], [-742.8, -289.1], [-770.4, -283.7], [-802.5, -284.5], [-832.9, -290.5]];
  const slipSEtoKDA = [[-686.8, -275.6], [-735.8, -277.2]];
  const slipKDAtoNW = [[-742.8, -289.1], [-735.2, -299.2], [-727.9, -317.9]];

  addRoadRibbon(staticG, seKhanJahan, 13.6, 0.033, bank.asphalt, 5.5);
  addRoadRibbon(staticG, nwKhanJahan, 12.0, 0.033, bank.asphalt, 5.5);
  addRoadRibbon(staticG, kdaSouthLane, 8.2, 0.033, bank.asphalt, 5.5);
  addRoadRibbon(staticG, kdaNorthLane, 8.2, 0.033, bank.asphalt, 5.5);
  addRoadRibbon(staticG, slipSEtoKDA, 7.6, 0.031, bank.asphalt, 5.5);
  addRoadRibbon(staticG, slipKDAtoNW, 7.2, 0.031, bank.asphalt, 5.5);

  // KDA Avenue Central Raised Median Divider (between South & North carriageways: x = -746 .. -824)
  const kdaMedianPts = [[-748, -281.8], [-770, -278.4], [-802, -279.6], [-826, -285.8]];
  for (let i = 0; i < kdaMedianPts.length - 1; i++) {
    const [x0, z0] = kdaMedianPts[i];
    const [x1, z1] = kdaMedianPts[i + 1];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    const mx = (x0 + x1) * 0.5;
    const mz = (z0 + z1) * 0.5;
    addRotBox(staticG, [1.55, 0.28, len], [mx, 0.14, mz], bank.curbBlackWhite, yaw);
    addRotBox(staticG, [1.05, 0.34, len - 0.6], [mx, 0.17, mz], bank.grassTurf, yaw);
    addDoubleArmLamp(staticG, dynamicG, bank, mx, mz, yaw);
    addOrnamentalPalm(staticG, bank, x0 + dx * 0.25, z0 + dz * 0.25, 6.2, 700 + i * 17);
  }

  // SE Khan Jahan Ali Road Raised Center Divider (x = -696..-652)
  const seDivStart = [-695.5, -280.2];
  const seDivEnd = [-652.0, -253.5];
  const seDx = seDivEnd[0] - seDivStart[0];
  const seDz = seDivEnd[1] - seDivStart[1];
  const seLen = Math.hypot(seDx, seDz);
  const seYaw = Math.atan2(seDx, seDz);
  const seMx = (seDivStart[0] + seDivEnd[0]) * 0.5;
  const seMz = (seDivStart[1] + seDivEnd[1]) * 0.5;
  addRotBox(staticG, [1.25, 0.28, seLen], [seMx, 0.14, seMz], bank.curbBlackWhite, seYaw);
  addRotBox(staticG, [0.78, 0.34, seLen - 0.8], [seMx, 0.17, seMz], bank.grassTurf, seYaw);
  addDoubleArmLamp(staticG, dynamicG, bank, seDivStart[0] + seDx * 0.30, seDivStart[1] + seDz * 0.30, seYaw);
  addDoubleArmLamp(staticG, dynamicG, bank, seDivStart[0] + seDx * 0.72, seDivStart[1] + seDz * 0.72, seYaw);

  // NW Khan Jahan Ali Road Dashed Yellow Centerline
  for (let i = 0; i < nwKhanJahan.length - 1; i++) {
    const [x0, z0] = nwKhanJahan[i];
    const [x1, z1] = nwKhanJahan[i + 1];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const segLen = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    const steps = Math.max(2, Math.floor(segLen / 5.0));
    for (let s = 0; s < steps; s++) {
      const f = (s + 0.5) / steps;
      addRotBox(
        staticG,
        [0.20, 0.014, 2.2],
        [x0 + dx * f, 0.044, z0 + dz * f],
        bank.roadLineYellow,
        yaw,
        { castShadow: false },
      );
    }
  }

  // Crisp Zebra Crosswalks on all 3 Major Approaches into Royal Circle
  addZebraCrosswalk(staticG, bank, -701.5, -284.2, seYaw, 11.4);
  addZebraCrosswalk(staticG, bank, -724.5, -310.2, Math.atan2(-11.9, -21.9), 10.2);
  addZebraCrosswalk(staticG, bank, -736.5, -289.8, Math.atan2(-22.0, 5.2), 7.4);
  addZebraCrosswalk(staticG, bank, -734.8, -277.6, Math.atan2(-22.0, 4.0), 7.4);

  // Overhead Steel Directional Highway Gantry on SE Khan Jahan Ali Rd Approach
  const gx = -682.0;
  const gz = -272.2;
  const gPerpX = Math.cos(seYaw);
  const gPerpZ = -Math.sin(seYaw);
  for (const side of [-7.6, 7.6]) {
    cylinder(staticG, 0.22, 0.28, 6.8, [gx + gPerpX * side, 3.4, gz + gPerpZ * side], bank.steelDark, 10);
  }
  addRotBox(staticG, [15.8, 0.36, 0.42], [gx, 6.45, gz], bank.steelDark, seYaw);
  addSignBox(
    dynamicG,
    bank,
    {
      title: 'রয়্যালের মোড় (ROYAL MORE) · খুলনা',
      subtitle: '← কেডিএ অ্যাভিনিউ (সোনাডাঙ্গা)  |  ↑ শিববাড়ি / ডাকবাংলা',
      bg: '#065f46',
      accent: '#fef08a',
      width: 640,
      height: 176,
    },
    [gx, 6.65, gz],
    seYaw,
    9.2,
    1.85,
  );
}

/**
 * 2. ICONIC ROYAL CHATTAR / ROYAL CIRCLE MONUMENT & ANIMATED FOUNTAIN
 * Center: (-716.8, -291.8), radius 4.45m
 */
function buildRoyalChattarMonument(staticG, dynamicG, bank) {
  const CX = ROYAL_MORE_CENTER.x;
  const CZ = ROYAL_MORE_CENTER.z;
  const mon = new THREE.Group();
  mon.position.set(CX, 0, CZ);
  staticG.add(mon);

  // Outer Red-White Painted Concrete Roundabout Curb (r = 4.45m)
  cylinder(mon, 4.45, 4.58, 0.32, [0, 0.16, 0], bank.curbRedWhite, 36);
  // Green Lawn Collar + Marigold/Ixora Flower Ring
  cylinder(mon, 4.18, 4.24, 0.38, [0, 0.20, 0], bank.grassTurf, 32);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    box(
      mon,
      [0.36, 0.24, 0.36],
      [Math.cos(a) * 3.72, 0.44, Math.sin(a) * 3.72],
      i % 2 === 0 ? bank.flowerRed : bank.flowerGold,
    );
    // Ornamental Black & Gold Roundabout Perimeter Fence Posts
    cylinder(mon, 0.032, 0.04, 0.72, [Math.cos(a) * 4.30, 0.66, Math.sin(a) * 4.30], bank.steelDark, 6);
  }
  const fenceRing = new THREE.Mesh(new THREE.TorusGeometry(4.30, 0.035, 8, 36), bank.goldMetal);
  fenceRing.rotation.x = Math.PI / 2;
  fenceRing.position.y = 0.98;
  mon.add(fenceRing);

  // Black Granite Fountain Rim & Shimmering Turquoise Water Basin (r = 3.25m)
  cylinder(mon, 3.28, 3.38, 0.72, [0, 0.36, 0], bank.blackGranite, 32);
  cylinder(mon, 3.04, 3.04, 0.62, [0, 0.35, 0], bank.fountainWater, 32);

  // Tiered Marble & Terracotta Sculptural Pedestal
  cylinder(mon, 1.55, 1.85, 0.75, [0, 0.78, 0], bank.marbleWhite, 8);
  cylinder(mon, 1.25, 1.48, 0.95, [0, 1.55, 0], bank.royalTerracotta, 8);
  cylinder(mon, 1.38, 1.38, 0.16, [0, 2.06, 0], bank.goldMetal, 8);
  cylinder(mon, 0.92, 1.12, 1.10, [0, 2.65, 0], bank.marbleWhite, 12);

  // Sculpted Wave Arches & 3 Iconic Leaping Khulna Silver-Gold Fish / White Gold Sculptures!
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.35;
    const archGrp = new THREE.Group();
    archGrp.rotation.y = a;
    mon.add(archGrp);

    // Sweeping stylized wave rib curving up from pedestal
    const waveCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.75, 2.85, 0),
      new THREE.Vector3(1.55, 4.10, 0.25),
      new THREE.Vector3(1.10, 5.55, 0.10),
      new THREE.Vector3(0.28, 6.45, 0),
    ]);
    const waveMesh = new THREE.Mesh(new THREE.TubeGeometry(waveCurve, 18, 0.11, 8, false), bank.silverSculpture);
    archGrp.add(waveMesh);

    // Stylized Leaping Fish / Shrimp Silhouette (body + tail fin + dorsal ridge)
    const fishBody = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), i === 0 ? bank.goldMetal : bank.silverSculpture);
    fishBody.scale.set(0.42, 1.85, 0.72);
    fishBody.position.set(1.22, 4.75, 0.15);
    fishBody.rotation.z = 0.36;
    archGrp.add(fishBody);

    const tailFin = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.65, 4), bank.goldMetal);
    tailFin.position.set(1.48, 3.88, 0.18);
    tailFin.rotation.z = -0.35;
    archGrp.add(tailFin);
  }

  // Central Tall Spire & Royal Golden Crown Finial (reaching y = 7.8m)
  cylinder(mon, 0.18, 0.36, 3.8, [0, 4.95, 0], bank.marbleWhite, 12);
  const crownRing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.08, 10, 24), bank.goldMetal);
  crownRing.rotation.x = Math.PI / 2;
  crownRing.position.y = 6.75;
  mon.add(crownRing);
  const topOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 1), bank.goldMetal);
  topOrb.position.y = 7.35;
  mon.add(topOrb);

  // Night Uplight Fixtures around the Fountain Rim
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const bulb = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.18, 0.16, 10),
      i % 2 === 0 ? bank.uplightGold : bank.uplightCyan,
    );
    bulb.position.set(CX + Math.cos(a) * 2.55, 0.72, CZ + Math.sin(a) * 2.55);
    dynamicG.add(bulb);
  }

  // Animated Fountain Water Jets (8 parabolic arcs + central spray column)
  const fountainJets = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const jetCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(CX + Math.cos(a) * 2.65, 0.68, CZ + Math.sin(a) * 2.65),
      new THREE.Vector3(CX + Math.cos(a) * 1.95, 2.05, CZ + Math.sin(a) * 1.95),
      new THREE.Vector3(CX + Math.cos(a) * 1.25, 0.75, CZ + Math.sin(a) * 1.25),
    ]);
    const jet = new THREE.Mesh(new THREE.TubeGeometry(jetCurve, 12, 0.045, 6, false), bank.sprayJet);
    dynamicG.add(jet);
    fountainJets.push({ mesh: jet, phase: i * 0.78 });
  }

  // Golden Plaque Sign at Monument Base facing SE toward incoming traffic
  addSignBox(
    dynamicG,
    bank,
    {
      title: 'রয়্যাল চত্বর · খুলনা',
      subtitle: 'ROYAL CHATTAR · KHULNA CITY CORPORATION',
      bg: '#0f172a',
      fg: '#fef08a',
      accent: '#f59e0b',
      border: '#f59e0b',
    },
    [CX + 1.55, 1.55, CZ + 0.95],
    Math.PI * 0.34,
    1.85,
    0.62,
  );

  return fountainJets;
}

/**
 * 3. HOTEL ROYAL INTERNATIONAL (হোটেল রয়েল ইন্টারন্যাশনাল — ১০-তলা, স্থাপিত ১৯৮৬)
 * Khulna's iconic first 10-story luxury hotel in the NW wedge between KDA Ave & Khan Jahan Ali Rd.
 */
function buildHotelRoyalInternational(staticG, dynamicG, bank) {
  const hx = -776.0;
  const hz = -316.0;
  const rotY = 0.22; // Angled slightly to face KDA Avenue & Royal Circle cleanly
  const g = new THREE.Group();
  g.position.set(hx, 0, hz);
  g.rotation.y = rotY;
  staticG.add(g);

  const dg = new THREE.Group();
  dg.position.set(hx, 0, hz);
  dg.rotation.y = rotY;
  dynamicG.add(dg);

  const W = 25.0;
  const D = 16.5;
  const gfH = 4.6;
  const flH = 3.15;
  const floors = 10;
  const totalH = gfH + (floors - 1) * flH; // ~33m

  // Forecourt Granite Paving & Red Carpet Entrance Ramp (front faces +Z locally)
  box(g, [W + 6.5, 0.14, D + 8.5], [0, 0.07, 2.2], bank.marbleWhite, { castShadow: false, uvScale: 2.8 });
  box(g, [3.6, 0.18, 5.2], [0, 0.11, D * 0.5 + 2.4], bank.redCarpet, { castShadow: false });

  // Grand Ground Floor Lobby Core + Black Granite Base & Glass Entrance
  box(g, [W, gfH, D], [0, gfH * 0.5, 0], bank.blackGranite, { uvScale: 2.5 });
  box(g, [W - 3.6, 3.6, 0.35], [0, 2.0, D * 0.5 + 0.02], bank.glassLobby);
  // Illuminated Hotel Lobby Interior Warm Glow behind Glass
  box(dg, [W - 4.4, 3.1, 0.15], [0, 1.9, D * 0.5 - 0.18], bank.warmWindowLit, { castShadow: false });

  // Grand Projecting Porte-Cochere Entrance Canopy with Marble Columns & Gold Trim
  box(g, [10.8, 0.52, 4.8], [0, 4.35, D * 0.5 + 2.3], bank.marbleWhite);
  box(g, [11.0, 0.16, 4.95], [0, 4.66, D * 0.5 + 2.3], bank.goldMetal);
  for (const cx of [-4.6, -1.9, 1.9, 4.6]) {
    cylinder(g, 0.32, 0.36, 4.15, [cx, 2.15, D * 0.5 + 4.25], bank.marbleWhite, 12);
    cylinder(g, 0.40, 0.42, 0.25, [cx, 0.25, D * 0.5 + 4.25], bank.blackGranite, 12);
  }

  // Main 10-Story Tower Core (Cream Plaster + Vertical Terracotta Architectural Ribs)
  box(g, [W, totalH - gfH, D], [0, gfH + (totalH - gfH) * 0.5, 0], bank.royalCream, { uvScale: 3.2 });
  // Central Reflective Curtain-Wall Glass Atrium Spine
  box(g, [6.4, totalH - gfH + 1.2, 0.45], [0, gfH + (totalH - gfH) * 0.5 + 0.4, D * 0.5 + 0.18], bank.glassCurtain);
  for (const fx of [-3.35, 3.35, -9.2, 9.2, -12.35, 12.35]) {
    box(g, [0.62, totalH - gfH + 0.8, 0.72], [fx, gfH + (totalH - gfH) * 0.5 + 0.2, D * 0.5 + 0.12], bank.royalTerracotta);
  }

  // Floors 2..10 Balconies, Windows & Night-Lit Hotel Rooms (front +Z and back -Z)
  const rnd = seeded(1986);
  for (let f = 1; f < floors; f++) {
    const fy = gfH + (f - 1) * flH;
    // Horizontal floor slab band
    box(g, [W + 0.55, 0.24, D + 0.55], [0, fy, 0], bank.marbleWhite);
    for (const wx of [-10.7, -7.6, -5.0, 5.0, 7.6, 10.7]) {
      const lit = rnd() > 0.38;
      const wMat = lit ? (rnd() > 0.35 ? bank.warmWindowLit : bank.coolWindowLit) : bank.glassCurtain;
      box(lit ? dg : g, [2.05, 1.75, 0.18], [wx, fy + 1.65, D * 0.5 + 0.04], wMat, { castShadow: false });
      box(g, [2.35, 0.16, 0.82], [wx, fy + 0.12, D * 0.5 + 0.40], bank.marbleWhite);
      box(g, [2.25, 0.72, 0.10], [wx, fy + 0.52, D * 0.5 + 0.76], bank.royalTerracotta);
      // Rear windows so hotel looks detailed from every angle
      box(g, [2.05, 1.65, 0.16], [wx, fy + 1.65, -D * 0.5 - 0.04], bank.glassCurtain, { castShadow: false });
    }
    // Side gable windows (East & West)
    for (const sx of [-1, 1]) {
      for (const wz of [-4.6, 0, 4.6]) {
        const litS = rnd() > 0.55;
        box(litS ? dg : g, [0.16, 1.65, 2.2], [sx * (W * 0.5 + 0.04), fy + 1.65, wz], litS ? bank.warmWindowLit : bank.glassCurtain, { castShadow: false });
      }
    }
  }

  // Iconic Rooftop Crown Parapet, Penthouse Pavilion & Helipad-Style Trim
  box(g, [W + 0.9, 1.45, D + 0.9], [0, totalH + 0.72, 0], bank.royalTerracotta);
  box(g, [W + 1.05, 0.24, D + 1.05], [0, totalH + 1.52, 0], bank.goldMetal);
  box(g, [10.5, 3.2, 8.5], [0, totalH + 2.8, 0], bank.modernWhite);
  box(g, [10.9, 0.35, 8.9], [0, totalH + 4.5, 0], bank.goldMetal);

  // Illuminated Canopy Entrance Sign + Giant Rooftop Hotel Signboard!
  addSignBox(
    dg,
    bank,
    {
      title: 'হোটেল রয়েল ইন্টারন্যাশনাল ★★★',
      subtitle: 'HOTEL ROYAL INTERNATIONAL · EST. 1986 · KHULNA',
      bg: '#0f172a',
      fg: '#fef08a',
      accent: '#f59e0b',
      border: '#f59e0b',
      width: 640,
    },
    [0, 5.25, D * 0.5 + 4.68],
    0,
    9.2,
    1.25,
  );
  addSignBox(
    dg,
    bank,
    {
      title: 'HOTEL ROYAL INTERNATIONAL',
      subtitle: 'হোটেল রয়েল ইন্টারন্যাশনাল · খুলনা',
      bg: '#7f1d1d',
      fg: '#ffffff',
      accent: '#fde047',
      border: '#f59e0b',
      width: 640,
    },
    [0, totalH + 2.85, D * 0.5 + 0.55],
    0,
    14.5,
    2.4,
  );

  // Palms framing the Hotel Forecourt
  addOrnamentalPalm(staticG, bank, hx - 12.8, hz + 10.5, 8.2, 811);
  addOrnamentalPalm(staticG, bank, hx + 12.8, hz + 8.5, 7.8, 823);
}

/**
 * 4. MULTI-STORY ARTICULATED COMMERCIAL / HOTEL BUILDING HELPER
 * Builds realistic Khulna commercial plazas with ground-floor glowing shopfronts,
 * recessed balconies, AC units, rooftop water tanks & illuminated Bengali signboards.
 */
function buildRoyalCornerBuilding(staticG, dynamicG, bank, cfg) {
  const {
    cx, cz, rotY = 0, w = 18, d = 13, floors = 5,
    wallMat = bank.royalSand,
    trimMat = bank.marbleWhite,
    accentMat = bank.royalTerracotta,
    shopMat = bank.dispSweets,
    signTitle,
    signSub,
    signBg = '#064e3b',
    secondSign = null,
    seed = 301,
  } = cfg;

  const rnd = seeded(seed);
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = rotY;
  staticG.add(g);

  const dg = new THREE.Group();
  dg.position.set(cx, 0, cz);
  dg.rotation.y = rotY;
  dynamicG.add(dg);

  const gfH = 4.0;
  const flH = 3.1;
  const totalH = gfH + (floors - 1) * flH;

  // Sidewalk Plinth & Damp Base
  box(g, [w + 2.4, 0.14, d + 3.2], [0, 0.07, 0.8], bank.brick, { castShadow: false, uvScale: 2.4 });
  box(g, [w + 0.2, 0.42, d + 0.2], [0, 0.21, 0], bank.darkConcrete);

  // Ground Floor Arcade + Glowing Shop Showcases (front faces +Z locally)
  box(g, [w, gfH, d - 0.6], [0, gfH * 0.5, -0.3], trimMat, { uvScale: 2.8 });
  const bays = Math.max(3, Math.floor(w / 4.2));
  const bayW = w / bays;
  for (let i = 0; i <= bays; i++) {
    const bx = -w * 0.5 + i * bayW;
    box(g, [0.46, gfH, 0.52], [bx, gfH * 0.5, d * 0.5 - 0.26], accentMat);
  }
  for (let b = 0; b < bays; b++) {
    const bx = -w * 0.5 + (b + 0.5) * bayW;
    box(dg, [bayW - 0.68, 2.55, 0.12], [bx, 1.42, d * 0.5 - 0.55], shopMat, { castShadow: false });
    box(g, [bayW - 0.55, 0.14, 0.92], [bx, 2.88, d * 0.5 + 0.05], bank.steelDark);
  }

  // Upper Floors Structural Core + Balconies + Windows + AC Units
  box(g, [w, totalH - gfH, d], [0, gfH + (totalH - gfH) * 0.5, 0], wallMat, { uvScale: 3.0 });
  box(g, [w + 0.6, 0.26, d + 0.6], [0, gfH, 0], trimMat);

  for (let f = 1; f < floors; f++) {
    const fy = gfH + (f - 1) * flH;
    box(g, [w + 0.45, 0.20, d + 0.45], [0, fy + flH, 0], trimMat);
    for (let b = 0; b < bays; b++) {
      const bx = -w * 0.5 + (b + 0.5) * bayW;
      const lit = rnd() > 0.45;
      const winM = lit ? (rnd() > 0.35 ? bank.warmWindowLit : bank.coolWindowLit) : bank.glassCurtain;
      box(lit ? dg : g, [bayW * 0.64, 1.65, 0.16], [bx, fy + 1.55, d * 0.5 + 0.04], winM, { castShadow: false });
      if ((b + f) % 2 === 0) {
        box(g, [bayW * 0.78, 0.16, 0.86], [bx, fy + 0.12, d * 0.5 + 0.42], trimMat);
        box(g, [bayW * 0.78, 0.78, 0.12], [bx, fy + 0.54, d * 0.5 + 0.80], accentMat);
      } else {
        box(g, [bayW * 0.74, 0.12, 0.34], [bx, fy + 2.44, d * 0.5 + 0.16], trimMat);
        if (rnd() > 0.45) {
          box(g, [0.72, 0.50, 0.34], [bx + bayW * 0.22, fy + 0.48, d * 0.5 + 0.20], bank.acBox);
        }
      }
      // Rear windows
      box(g, [bayW * 0.58, 1.55, 0.14], [bx, fy + 1.55, -d * 0.5 - 0.04], bank.glassCurtain, { castShadow: false });
    }
  }

  // Rooftop Parapet, Stairhead Mumty & Black Gazi Water Tank
  box(g, [w + 0.35, 0.95, 0.24], [0, totalH + 0.48, d * 0.5], accentMat);
  box(g, [w + 0.35, 0.95, 0.24], [0, totalH + 0.48, -d * 0.5], accentMat);
  box(g, [0.24, 0.95, d], [-w * 0.5, totalH + 0.48, 0], accentMat);
  box(g, [0.24, 0.95, d], [w * 0.5, totalH + 0.48, 0], accentMat);
  box(g, [3.4, 2.35, 3.6], [-w * 0.18, totalH + 1.18, 0], trimMat);
  cylinder(g, 0.65, 0.68, 1.4, [w * 0.22, totalH + 1.15, -1.2], bank.waterTank, 10);

  // Main Illuminated Fascia Signboard
  addSignBox(
    dg,
    bank,
    { title: signTitle, subtitle: signSub, bg: signBg, accent: '#fde047', width: 576 },
    [0, 3.48, d * 0.5 + 0.26],
    0,
    Math.min(w - 1.2, 10.5),
    1.15,
  );
  if (secondSign) {
    addSignBox(
      dg,
      bank,
      secondSign,
      [0, totalH + 1.55, d * 0.5 + 0.28],
      0,
      Math.min(w - 2.0, 9.2),
      1.35,
    );
  }
}

/**
 * 5. GREENLINE LUXURY AC COACH BUS parked in the KDA Avenue layby outside Greenline Counter
 */
function buildGreenlineBus(staticG, dynamicG, bank, x, z, rotY) {
  const bus = new THREE.Group();
  bus.position.set(x, 0.04, z);
  bus.rotation.y = rotY;
  staticG.add(bus);

  // 4 Heavy Coach Wheels
  for (const [wx, wz] of [[-1.18, 3.3], [1.18, 3.3], [-1.18, -3.1], [1.18, -3.1]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.30, 14), bank.tireBlack);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.48, wz);
    bus.add(w);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.32, 10), bank.aluminum);
    rim.rotation.z = Math.PI / 2;
    rim.position.set(wx, 0.48, wz);
    bus.add(rim);
  }
  // Sleek Emerald Green Luxury Coach Body + Roof AC Pod + Tinted Windows
  box(bus, [2.52, 2.55, 11.4], [0, 1.78, 0], bank.busGreen);
  box(bus, [2.56, 0.22, 11.45], [0, 1.22, 0], bank.busAccent);
  box(bus, [2.36, 1.05, 0.14], [0, 2.25, 5.72], bank.glassCurtain); // front panoramic windshield
  for (const sx of [-1.27, 1.27]) {
    box(bus, [0.06, 1.05, 9.8], [sx, 2.28, -0.2], bank.glassCurtain);
  }
  box(bus, [1.65, 0.34, 3.4], [0, 3.22, 0.4], bank.modernWhite); // Roof AC unit
  for (const sx of [-0.85, 0.85]) {
    box(bus, [0.36, 0.18, 0.08], [sx, 0.85, 5.72], bank.lampGlow);
  }
  addSignBox(
    dynamicG,
    bank,
    { title: 'GREEN LINE · ঢাকা — খুলনা (AC)', subtitle: 'ROYAL MORE COUNTER · ROYAL COACH', bg: '#064e3b', accent: '#fde047' },
    [x + Math.cos(rotY) * 1.32, 1.55, z - Math.sin(rotY) * 1.32],
    rotY + Math.PI * 0.5,
    4.6,
    0.58,
  );
}

/**
 * 6. KMP TRAFFIC POLICE BOX (কেএমপি ট্রাফিক পুলিশ বক্স · রয়্যালের মোড়)
 */
function buildKmpTrafficBox(staticG, dynamicG, bank, x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  staticG.add(g);

  cylinder(g, 1.55, 1.65, 0.28, [0, 0.14, 0], bank.concrete, 8);
  cylinder(g, 1.28, 1.32, 1.05, [0, 0.80, 0], bank.modernWhite, 8);
  cylinder(g, 1.34, 1.34, 0.22, [0, 1.24, 0], bank.policeBlue, 8);
  cylinder(g, 1.15, 1.15, 1.15, [0, 1.92, 0], bank.glassLobby, 8);
  cylinder(g, 1.85, 1.92, 0.18, [0, 2.60, 0], bank.policeBlue, 8);
  cylinder(g, 0.85, 1.55, 0.48, [0, 2.92, 0], bank.modernWhite, 8);

  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.24, 10), bank.uplightCyan);
  beacon.position.set(x, 3.28, z);
  dynamicG.add(beacon);

  addSignBox(
    dynamicG,
    bank,
    { title: 'KMP ট্রাফিক পুলিশ বক্স', subtitle: 'ROYAL MORE · খুলনা মেট্রোপলিটন পুলিশ', bg: '#1e3a8a', accent: '#fde047' },
    [x - 0.85, 2.66, z + 0.95],
    -Math.PI * 0.24,
    2.2,
    0.52,
  );
}

/**
 * Builds the complete High-Detail Royal More (খুলনা রয়্যালের মোড়) showcase district.
 */
export function buildRoyalMoreDistrict(parent, m) {
  const root = new THREE.Group();
  root.name = 'KhulnaLandmark_RoyalMore';
  const staticG = new THREE.Group();
  const dynamicG = new THREE.Group();
  root.add(staticG, dynamicG);
  parent.add(root);

  const bank = createRoyalBank(m);

  // 1) Exact Royal More Roundabout, Dual Carriageways, Medians, Crosswalks & Highway Gantry
  buildRoyalMoreRoads(staticG, dynamicG, bank);

  // 2) Iconic Royal Chattar Monument & Animated Illuminated Fountain at (-716.8, -291.8)
  const fountainJets = buildRoyalChattarMonument(staticG, dynamicG, bank);

  // 3) Hotel Royal International (10-story iconic landmark, est. 1986)
  buildHotelRoyalInternational(staticG, dynamicG, bank);

  // 4) Hotel Castle Salam (SE-South corner facing Royal Circle)
  buildRoyalCornerBuilding(staticG, dynamicG, bank, {
    cx: -706.0,
    cz: -250.0,
    rotY: Math.PI - 0.18, // Faces North toward Royal Circle
    w: 20.0,
    d: 13.5,
    floors: 6,
    wallMat: bank.royalSand,
    trimMat: bank.marbleWhite,
    accentMat: bank.royalTerracotta,
    shopMat: bank.dispSweets,
    signTitle: 'হোটেল ক্যাসেল সালাম',
    signSub: 'HOTEL CASTLE SALAM · ROYAL MORE, KHULNA',
    signBg: '#7c2d12',
    secondSign: { title: 'HOTEL CASTLE SALAM', subtitle: 'LUXURY STAY & BANQUET', bg: '#0f172a', accent: '#f59e0b' },
    seed: 412,
  });

  // 5) Royal More NE Corner Commercial Arcade (Royal Sweets, Pharmacy & Islami Bank ATM)
  buildRoyalCornerBuilding(staticG, dynamicG, bank, {
    cx: -688.0,
    cz: -318.0,
    rotY: -0.68, // Angled cleanly facing SW directly onto Royal Circle
    w: 22.0,
    d: 13.0,
    floors: 5,
    wallMat: bank.modernWhite,
    trimMat: bank.royalCream,
    accentMat: bank.emeraldWall,
    shopMat: bank.dispSweets,
    signTitle: 'রয়েল সুইটস · ইসলামী ব্যাংক এটিএম · ফার্মেসি',
    signSub: 'ROYAL MORE COMMERCIAL PLAZA · KHAN JAHAN ALI RD',
    signBg: '#064e3b',
    seed: 519,
  });

  // 6) Fatima Hospital & Diagnostic Center (East side of NW Khan Jahan Ali Rd)
  buildRoyalCornerBuilding(staticG, dynamicG, bank, {
    cx: -720.0,
    cz: -350.0,
    rotY: -Math.PI * 0.38, // Faces SW toward NW Khan Jahan Ali Rd
    w: 20.0,
    d: 12.5,
    floors: 6,
    wallMat: bank.modernWhite,
    trimMat: bank.marbleWhite,
    accentMat: bank.hospitalBlue,
    shopMat: bank.dispHosp,
    signTitle: 'ফাতেমা হাসপাতাল এন্ড ডায়াগনস্টিক সেন্টার',
    signSub: 'FATIMA HOSPITAL · 24/7 EMERGENCY & DIAGNOSTIC',
    signBg: '#0c4a6e',
    secondSign: { title: 'FATIMA HOSPITAL · 24H', subtitle: 'KHAN JAHAN ALI ROAD, KHULNA', bg: '#991b1b', accent: '#ffffff' },
    seed: 607,
  });

  // 7) Kacchi Ghor & Prime Bank 24/7 ATM Plaza (North side of KDA Avenue)
  buildRoyalCornerBuilding(staticG, dynamicG, bank, {
    cx: -808.0,
    cz: -305.0,
    rotY: 0.06, // Faces South onto KDA Avenue
    w: 21.0,
    d: 12.5,
    floors: 5,
    wallMat: bank.sageWall,
    trimMat: bank.marbleWhite,
    accentMat: bank.modernSlate,
    shopMat: bank.dispKacchi,
    signTitle: 'কাচ্চি ঘর · প্রাইম ব্যাংক এটিএম · ব্যাংক প্লাজা',
    signSub: 'KACCHI GHOR & PRIME BANK 24/7 ATM · KDA AVENUE',
    signBg: '#78350f',
    secondSign: { title: 'PRIME BANK · 24/7 ATM', subtitle: 'ROYAL MORE · KDA AVENUE', bg: '#065f46', accent: '#6ee7b7' },
    seed: 711,
  });

  // 8) Greenline Paribahan Counter & Travel Arcade (South side of KDA Avenue)
  buildRoyalCornerBuilding(staticG, dynamicG, bank, {
    cx: -800.0,
    cz: -256.0,
    rotY: Math.PI - 0.08, // Faces North onto KDA Avenue
    w: 22.0,
    d: 12.0,
    floors: 4,
    wallMat: bank.royalCream,
    trimMat: bank.marbleWhite,
    accentMat: bank.emeraldWall,
    shopMat: bank.dispBus,
    signTitle: 'গ্রীন লাইন পরিবহন · রয়েল মোড় কাউন্টার',
    signSub: 'GREENLINE PARIBAHAN · KHULNA — DHAKA AC BUS',
    signBg: '#065f46',
    seed: 809,
  });

  // Parked Greenline Luxury AC Bus in layby in front of Greenline Counter
  buildGreenlineBus(staticG, dynamicG, bank, -798.0, -267.8, Math.PI * 0.52);

  // 9) KMP Traffic Police Control Box on NE Roundabout Apron
  buildKmpTrafficBox(staticG, dynamicG, bank, -701.2, -301.0);

  // 10) Roadside Utility Poles with Bengali Posters, Election Banners & Parked CNG / Easybike
  const poleSpots = [
    [-703.5, -274.5, 0.5],
    [-684.0, -288.0, 2.5],
    [-732.0, -308.0, -0.8],
    [-752.0, -296.0, 1.5],
    [-754.0, -266.0, -1.5],
    [-786.0, -266.5, -1.5],
  ];
  for (let i = 0; i < poleSpots.length; i++) {
    const [px, pz, pyaw] = poleSpots[i];
    cylinder(staticG, 0.10, 0.15, 8.8, [px, 4.4, pz], bank.concrete, 8);
    decorateCorridorPole(dynamicG, px, pz, pyaw, 910 + i);
  }

  // Parked CNG Auto & Easybike neatly at the corner passenger stand (clear of traffic lanes)
  const vBank = {
    tire: bank.tireBlack,
    rim: bank.aluminum,
    darkTrim: bank.steelDark,
    chrome: bank.aluminum,
    windshield: bank.glassCurtain,
    headlight: bank.lampGlow,
    taillight: bank.flowerRed,
    amber: bank.flowerGold,
    cngGreen: bank.emeraldWall,
    cngYellow: bank.busAccent,
    cngRexine: bank.steelDark,
    easyTeal: bank.hospitalBlue,
    easyCrimson: bank.royalTerracotta,
    easyRoof: bank.modernWhite,
    plate: bank.busAccent,
  };
  const standCng = buildCNGAuto(vBank);
  standCng.position.set(-701.0, 0.05, -308.0);
  standCng.rotation.y = -2.2;
  staticG.add(standCng);

  const standEasy = buildEasybike(vBank, false);
  standEasy.position.set(-756.0, 0.05, -267.5);
  standEasy.rotation.y = 1.65;
  staticG.add(standEasy);

  // Ornamental Palms along perimeter corners
  for (const [px, pz, h, sd] of [
    [-702.5, -306.0, 7.6, 901],
    [-718.0, -265.0, 7.4, 902],
    [-746.0, -322.0, 7.8, 903],
    [-772.0, -266.0, 7.2, 904],
  ]) {
    addOrnamentalPalm(staticG, bank, px, pz, h, sd);
  }

  // Batch all static geometry into minimal GPU draw calls for locked 60+ FPS!
  mergeStaticMeshes(staticG);

  const maxDistSq = 380 * 380;

  return {
    root,
    setNightFactor(nightFactor = 0) {
      const nf = THREE.MathUtils.clamp(nightFactor, 0, 1);
      for (let i = 0; i < bank.emissiveList.length; i++) {
        const item = bank.emissiveList[i];
        item.mat.emissiveIntensity = item.day + (item.night - item.day) * nf;
      }
    },
    syncVisibility(playerPos) {
      if (!playerPos) return;
      const dx = playerPos.x - ROYAL_MORE_CENTER.x;
      const dz = playerPos.z - ROYAL_MORE_CENTER.z;
      const want = dx * dx + dz * dz <= maxDistSq;
      if (root.visible !== want) root.visible = want;
    },
    update(time, playerPos = null) {
      if (playerPos) this.syncVisibility(playerPos);
      if (!root.visible) return;
      // Gentle shimmering fountain jet pulse
      for (let i = 0; i < fountainJets.length; i++) {
        const j = fountainJets[i];
        const s = 0.94 + Math.sin(time * 5.2 + j.phase) * 0.08;
        j.mesh.scale.set(1, s, 1);
      }
    },
  };
}
