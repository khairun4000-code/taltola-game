import * as THREE from 'three';
import { box, cylinder, rodBetween, mergeStaticMeshes } from './scene-utils.js';
import { attachDerivedPBRMaps } from './aaa-shaders.js';
import { decorateCorridorPole } from './khulna-street-props.js';
import { buildCNGAuto, buildEasybike } from './khulna-vehicles.js';

/**
 * SATRASTA MORE (খুলনা সাতরাস্তার মোড় · কেডিএ এভিনিউ — রয়্যাল মোড় সংযোগ) — HIGH QUALITY EDITION
 * World Center: (-920.0, -292.0) | Seamlessly connected East along KDA Avenue to Royal More (-716.8, -291.8)
 *
 * High-Detail Highlights:
 *  1. Iconic Sculpted Black-Wood Roundabout Monument (কালো কাঠের হাই-কোয়ালিটি ভাস্কর্য) with carved ebony arches, lotus finial, granite plinth & 6 golden uplights.
 *  2. বিল্লাল ভাইয়ের চায়ের দোকান (Billal Bhai Tea Stall — Prominent RIGHT ON THE ROUNDABOUT CORNER, open veranda, 3 kettles, biscuit cabinet, TV, adda benches).
 *  3. শিমলা প্লাজা · কাচ্চি ভাই (Shimla Plaza 5-Story Tower — Walkable marble stairs up to 3rd & 4th Floor Panoramic Glass Kacchi Bhai Dining Halls!).
 *  4. সাতরাস্তা কাচ্চি ঘর (Grand Flagship Enterable Kacchi Ghor — Large 21m × 14m Mughlai Hall, 4 copper degchis, 10 detailed booths, chandeliers, ACs, wash basin).
 *  5. সাতরাস্তা কাবাব ও শর্মা হাউস (Enterable Live Charcoal Grill, Skewers, Shawarma Spit, Tandoor & Dining).
 *  6. ২টি শাহী মিষ্টি পানের দোকান (Glass showcases, betel leaf stacks, spice jars & stools).
 *  7. Locked 60+ FPS via mergeStaticMeshes(), shared procedural PBR textures & per-building interior culling.
 */

export const SATRASTA_MORE_CENTER = { x: -920.0, z: -292.0 };

function makeWeatheredPlasterTex(baseHex, seedVal = 701, { streakAlpha = 0.11, brickLines = false } = {}) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  let s = seedVal >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 5200; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const sz = 1.5 + rnd() * 3.5;
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.055)' : `rgba(22,18,14,${0.03 + rnd() * 0.055})`;
    ctx.fillRect(x, y, sz, sz);
  }
  for (let i = 0; i < 44; i++) {
    const x = rnd() * S;
    const h = 48 + rnd() * 170;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgba(20,24,20,${streakAlpha})`);
    g.addColorStop(1, 'rgba(20,24,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 4 + rnd() * 10, h);
  }
  if (brickLines) {
    ctx.strokeStyle = 'rgba(24,18,14,0.22)';
    ctx.lineWidth = 2;
    for (let y = 0; y < S; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(S, y);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeSignTexture({
  title,
  subtitle = '',
  bg = '#0f3d2e',
  fg = '#ffffff',
  accent = '#fde047',
  border = '#ffffff',
  width = 1024,
  height = 300,
}) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, 'rgba(255,255,255,0.22)');
  g.addColorStop(0.42, 'rgba(255,255,255,0.03)');
  g.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  const bw = Math.max(8, Math.round(height * 0.036));
  ctx.strokeStyle = border;
  ctx.lineWidth = bw;
  ctx.strokeRect(bw, bw, width - bw * 2, height - bw * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.24)';
  ctx.lineWidth = 2;
  ctx.strokeRect(bw * 2.2, bw * 2.2, width - bw * 4.4, height - bw * 4.4);
  ctx.fillStyle = accent;
  ctx.fillRect(bw * 2.6, bw * 2.4, Math.max(12, Math.round(width * 0.015)), height - bw * 4.8);

  const titlePx = Math.round(height * 0.22);
  const subPx = Math.round(height * 0.125);
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = fg;
  ctx.font = `bold ${titlePx}px "Noto Sans Bengali", "Segoe UI", sans-serif`;
  ctx.fillText(title, bw * 5.6, subtitle ? height * 0.38 : height * 0.52, width - bw * 8);
  if (subtitle) {
    ctx.shadowBlur = 4;
    ctx.fillStyle = accent;
    ctx.font = `600 ${subPx}px "Manrope", "Noto Sans Bengali", sans-serif`;
    ctx.fillText(subtitle, bw * 5.6, height * 0.74, width - bw * 8);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeBlackWoodGrainTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#171311';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) {
    const x = (i / 160) * 512;
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(72,52,38,0.48)' : 'rgba(6,5,4,0.72)';
    ctx.lineWidth = 1.6 + (i % 4) * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y <= 512; y += 24) {
      ctx.lineTo(x + Math.sin(y * 0.032 + i * 0.8) * 5.0, y);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 4);
  tex.anisotropy = 8;
  return tex;
}

function makeTileFloorTexture(c1 = '#ece8df', c2 = '#dfd8ca', grout = '#b8b0a0') {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, S, S);
  const step = 128;
  for (let y = 0; y < S; y += step) {
    for (let x = 0; x < S; x += step) {
      ctx.fillStyle = ((x / step + y / step) % 2 === 0) ? c1 : c2;
      ctx.fillRect(x + 3, y + 3, step - 6, step - 6);
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 12, y + 24);
      ctx.bezierCurveTo(x + 48, y + 54, x + 78, y + 36, x + 114, y + 98);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(120,112,96,0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 18, y + 102);
      ctx.bezierCurveTo(x + 56, y + 76, x + 88, y + 90, x + 116, y + 26);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.anisotropy = 8;
  return tex;
}

function makeCurbStripeTex() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d');
  for (let x = 0; x < 256; x += 64) {
    ctx.fillStyle = (x / 64) % 2 === 0 ? '#18181b' : '#facc15';
    ctx.fillRect(x, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 1);
  return tex;
}

function makeAsphaltRoadTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#32373d';
  ctx.fillRect(0, 0, 512, 512);
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0.0, 'rgba(20,23,27,0.22)');
  grad.addColorStop(0.26, 'rgba(65,70,78,0.14)');
  grad.addColorStop(0.50, 'rgba(25,28,33,0.10)');
  grad.addColorStop(0.74, 'rgba(65,70,78,0.14)');
  grad.addColorStop(1.0, 'rgba(20,23,27,0.22)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 6500; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const v = 34 + Math.floor(rand() * 44);
    ctx.fillStyle = `rgba(${v},${v + 2},${v + 5},0.55)`;
    ctx.fillRect(x, y, 1.8, 1.8);
  }
  ctx.strokeStyle = 'rgba(18,20,23,0.34)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 5; i++) {
    const sx = 60 + i * 98;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    for (let y = 0; y <= 512; y += 32) {
      ctx.lineTo(sx + Math.sin(y * 0.04 + i) * 3.5, y);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2);
  tex.anisotropy = 4;
  return tex;
}

function makeFootpathTileTex() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8b877e';
  ctx.fillRect(0, 0, 256, 256);
  const rows = 8;
  const cols = 4;
  const rw = 256 / cols;
  const rh = 256 / rows;
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (rw * 0.5);
    for (let col = -1; col <= cols; col++) {
      const shade = ((r + col) % 3 === 0) ? '#c2bdb1' : ((r + col) % 3 === 1 ? '#b7b2a6' : '#aba69a');
      ctx.fillStyle = shade;
      ctx.fillRect(col * rw + offset + 2, r * rh + 2, rw - 4, rh - 4);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 6);
  tex.anisotropy = 4;
  return tex;
}

function makeMenuBoardTexture(title, lines, bg = '#3b0f0f', accent = '#fde047') {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 512);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 512);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 14;
  ctx.strokeRect(14, 14, 996, 484);
  ctx.strokeStyle = 'rgba(255,255,255,0.32)';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 964, 452);
  ctx.fillStyle = accent;
  ctx.textAlign = 'center';
  ctx.font = 'bold 52px "Noto Sans Bengali", sans-serif';
  ctx.fillText(title, 512, 92);
  ctx.fillRect(140, 118, 744, 4);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.font = '600 38px "Noto Sans Bengali", sans-serif';
  lines.forEach((line, idx) => {
    ctx.fillText(line, 66, 186 + idx * 76, 892);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function addRotBox(parent, size, pos, mat, rotY = 0, opts = {}) {
  const mesh = box(parent, size, pos, mat, opts);
  if (rotY) mesh.rotation.y = rotY;
  return mesh;
}

export function buildSatrastaMoreDistrict(parent, m) {
  const CX = SATRASTA_MORE_CENTER.x;
  const CZ = SATRASTA_MORE_CENTER.z;

  const root = new THREE.Group();
  root.name = 'KhulnaLandmark_SatrastaMore';
  const staticG = new THREE.Group();
  const dynamicG = new THREE.Group();
  root.add(staticG, dynamicG);
  parent.add(root);

  // ============================================================================
  // SHARED HIGH-QUALITY PBR MATERIALS
  // ============================================================================
  const blackWoodTex = makeBlackWoodGrainTexture();
  const blackWoodMat = new THREE.MeshPhysicalMaterial({
    color: 0x201915,
    map: blackWoodTex,
    roughness: 0.30,
    metalness: 0.08,
    clearcoat: 0.80,
    clearcoatRoughness: 0.18,
  });
  const ebonyTrimMat = new THREE.MeshStandardMaterial({ color: 0x100d0c, roughness: 0.25, metalness: 0.18 });
  const graniteMat = new THREE.MeshStandardMaterial({ color: 0x2a2d34, roughness: 0.35, metalness: 0.22 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.22, metalness: 0.88 });
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xc86d34, roughness: 0.24, metalness: 0.82 });
  const redClothMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.82 });
  const panGreenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.62 });
  const emberGlowMat = new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0xff3b00, emissiveIntensity: 2.0, roughness: 0.4 });
  const meatSkewMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.64 });
  const mkPbrPlaster = (hex, seedVal, rough = 0.78, opts = {}) => {
    const tex = makeWeatheredPlasterTex(hex, seedVal, opts);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: rough,
      metalness: 0.03,
      envMapIntensity: 0.75,
    });
    attachDerivedPBRMaps(mat, tex, { strength: opts.brickLines ? 2.4 : 1.7, roughBase: rough, normalScale: 0.62 });
    return mat;
  };
  const asphaltMat = m.road || new THREE.MeshStandardMaterial({ color: 0x3b4046, roughness: 0.78, metalness: 0.05 });
  const footpathTex = makeFootpathTileTex();
  const footpathMat = new THREE.MeshStandardMaterial({
    map: footpathTex,
    color: 0xe6e2d8,
    roughness: 0.82,
  });
  attachDerivedPBRMaps(footpathMat, footpathTex, { strength: 2.0, roughBase: 0.82, normalScale: 0.64 });
  const urbanGroundMat = new THREE.MeshStandardMaterial({ color: 0x74726c, roughness: 0.92 });
  const curbBlackYellow = new THREE.MeshStandardMaterial({ map: makeCurbStripeTex(), roughness: 0.68 });
  const roadLineWhite = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.78 });
  const roadLineYellow = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.76 });
  const drainGrateMat = new THREE.MeshStandardMaterial({ color: 0x262c33, roughness: 0.45, metalness: 0.78 });
  const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.88 });
  const steelDark = m.darkMetal || new THREE.MeshStandardMaterial({ color: 0x1e252c, roughness: 0.40, metalness: 0.76 });
  const chromeMat = m.chrome || new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.16, metalness: 0.92 });
  const aluminumMat = m.aluminum || new THREE.MeshStandardMaterial({ color: 0xd6ded9, roughness: 0.24, metalness: 0.86 });
  const railMat = m.rail || chromeMat;
  const brickMat = m.brick || mkPbrPlaster('#a8503b', 731, 0.86, { brickLines: true });
  const porcelainMat = m.porcelain || new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.14, clearcoat: 0.85 });
  const mirrorSurfaceMat = m.mirrorMat || chromeMat;
  const ceilingBrightMat = m.ceilingMat || new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x5c5a54, emissiveIntensity: 0.68, roughness: 0.84 });
  const pvcPipeMat = m.pvcPipe || new THREE.MeshStandardMaterial({ color: 0xb8c0bc, roughness: 0.42 });
  const terracottaMat = m.terracotta || new THREE.MeshStandardMaterial({ color: 0x9c4a2d, roughness: 0.82 });
  const wallArtMat = m.wallArt || new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.5 });
  const creamWall = mkPbrPlaster('#f2eadb', 701, 0.76, { streakAlpha: 0.11 });
  const warmOchre = mkPbrPlaster('#d9a86c', 703, 0.78, { streakAlpha: 0.13 });
  const maroonWall = mkPbrPlaster('#6b1720', 705, 0.62, { streakAlpha: 0.09 });
  const emeraldWall = mkPbrPlaster('#0f5132', 707, 0.64, { streakAlpha: 0.09 });
  const modernSlate = mkPbrPlaster('#2c3540', 709, 0.56, { streakAlpha: 0.08 });
  const acWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.34, metalness: 0.14 });
  const tinAwningMat = new THREE.MeshStandardMaterial({ color: 0x5c6b7a, roughness: 0.42, metalness: 0.68 });
  const woodMat = m.wood || new THREE.MeshStandardMaterial({ color: 0x784421, roughness: 0.60 });
  const darkWoodMat = m.darkWood || new THREE.MeshStandardMaterial({ color: 0x432818, roughness: 0.52 });
  const tileTex1 = makeTileFloorTexture('#eeeadf', '#e2dcd0', '#bcb4a4');
  const tileFloorMat = new THREE.MeshStandardMaterial({ map: tileTex1, roughness: 0.32, metalness: 0.06, envMapIntensity: 0.85 });
  attachDerivedPBRMaps(tileFloorMat, tileTex1, { strength: 1.5, roughBase: 0.32, normalScale: 0.50 });
  const marbleTex = makeTileFloorTexture('#f7f3ea', '#e8dec8', '#caa763');
  const luxuryMarbleMat = new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.22, metalness: 0.10, envMapIntensity: 1.05 });
  attachDerivedPBRMaps(luxuryMarbleMat, marbleTex, { strength: 1.4, roughBase: 0.22, normalScale: 0.45 });
  const kgFloorTex = makeTileFloorTexture('#f2ede2', '#d7e2d6', '#a8b5a6');
  const kacchiGhorFloorMat = new THREE.MeshStandardMaterial({ map: kgFloorTex, roughness: 0.26, metalness: 0.08, envMapIntensity: 0.95 });
  attachDerivedPBRMaps(kacchiGhorFloorMat, kgFloorTex, { strength: 1.4, roughBase: 0.26, normalScale: 0.48 });
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x2f7d3a, roughness: 0.92 });
  const flowerRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.74 });
  const flowerGold = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.74 });
  const flowerPink = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.74 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x1d4e6b,
    transparent: true,
    opacity: 0.44,
    roughness: 0.06,
    metalness: 0.24,
    clearcoat: 1.0,
    side: THREE.DoubleSide,
  });
  const glassTintBlue = new THREE.MeshPhysicalMaterial({
    color: 0x0f2f46,
    transparent: true,
    opacity: 0.52,
    roughness: 0.05,
    metalness: 0.30,
    clearcoat: 1.0,
    side: THREE.DoubleSide,
  });
  const tvScreenMat = m.tvScreen || new THREE.MeshStandardMaterial({ color: 0x16a34a, emissive: 0x22c55e, emissiveIntensity: 0.85, roughness: 0.2 });
  const lampGlow = new THREE.MeshStandardMaterial({ color: 0xfff8e6, emissive: 0xffd98a, emissiveIntensity: 1.05 });
  const uplightGold = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.95 });
  const emissiveList = [
    { mat: lampGlow, day: 0.75, night: 3.30 },
    { mat: uplightGold, day: 0.55, night: 3.10 },
    { mat: emberGlowMat, day: 1.60, night: 3.40 },
  ];

  // Physics, Walkable Slabs, Ramps/Stairs, Doors, Seats & Interior Culling Registries
  const circles = [];
  const obbs = [];
  const walkableSlabs = [];
  const stairRamps = [];
  const interactiveDoors = [];
  const animatedFans = [];
  const seats = [];
  const interiorGroups = [];
  const shopZones = [];

  const addCircle = (x, z, r, maxH = 12, minH = -1) => circles.push({ x, z, r, minH, maxH });
  const addOBB = (cx, cz, width, depth, rotY = 0, maxH = 18, minH = -1) => obbs.push({
    cx, cz, hx: width * 0.5, hz: depth * 0.5, cos: Math.cos(rotY), sin: Math.sin(rotY), minH, maxH,
  });
  const addWalkableSlab = (cx, cz, width, depth, rotY = 0, topY = 0.16) => walkableSlabs.push({
    cx, cz, hx: width * 0.5, hz: depth * 0.5, cos: Math.cos(rotY), sin: Math.sin(rotY), topY,
  });

  function addSignBox(targetG, opts, pos, rotY, w, h) {
    const tex = makeSignTexture(opts);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      emissive: 0xffffff,
      emissiveMap: tex,
      emissiveIntensity: 0.48,
      roughness: 0.25,
      side: THREE.DoubleSide,
    });
    emissiveList.push({ mat, day: 0.45, night: 1.75 });
    const grp = new THREE.Group();
    grp.position.set(pos[0], pos[1], pos[2]);
    grp.rotation.y = rotY;
    grp.add(new THREE.Mesh(new THREE.BoxGeometry(w + 0.10, h + 0.10, 0.14), steelDark));
    grp.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.165), mat));
    targetG.add(grp);
    return grp;
  }

  function addSpinningFan(lx, ly, lz, parentG) {
    const fg = new THREE.Group();
    fg.position.set(lx, ly, lz);
    parentG.add(fg);
    cylinder(fg, 0.02, 0.02, 0.30, [0, -0.15, 0], chromeMat, 6);
    const rotor = new THREE.Group();
    rotor.position.set(0, -0.30, 0);
    fg.add(rotor);
    cylinder(rotor, 0.13, 0.13, 0.06, [0, 0, 0], creamWall, 8);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.014, 0.11), creamWall);
      blade.position.set(Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32);
      blade.rotation.y = -a;
      rotor.add(blade);
    }
    animatedFans.push(rotor);
  }

  function addChandelier(parentG, x, y, z) {
    cylinder(parentG, 0.02, 0.02, 0.45, [x, y - 0.22, z], brassMat, 6);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.028, 8, 20), brassMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, y - 0.48, z);
    parentG.add(ring);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), lampGlow);
      bulb.position.set(x + Math.cos(a) * 0.46, y - 0.42, z + Math.sin(a) * 0.46);
      parentG.add(bulb);
    }
  }

  function addSplitAC(parentG, x, y, z, rotY = 0) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rotY;
    box(g, [1.05, 0.30, 0.24], [0, 0, 0], acWhiteMat);
    box(g, [0.95, 0.05, 0.26], [0, -0.09, 0.02], steelDark);
    parentG.add(g);
  }

  function addRoadRibbon(pts, width, y = -0.018) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i];
      const [x1, z1] = pts[i + 1];
      const dx = x1 - x0;
      const dz = z1 - z0;
      const len = Math.hypot(dx, dz) + 1.2;
      const yaw = Math.atan2(dx, dz);
      addRotBox(staticG, [width, 0.04, len], [(x0 + x1) * 0.5, y, (z0 + z1) * 0.5], asphaltMat, yaw, {
        castShadow: false,
        uvScale: 5.5,
      });
    }
  }

  function addRoadMarkings(pts, width, { dashedWhite = false, doubleYellow = false, dashedYellow = false, whiteEdges = true, y = 0.005 } = {}) {
    const halfW = width * 0.5;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i];
      const [x1, z1] = pts[i + 1];
      const dx = x1 - x0;
      const dz = z1 - z0;
      const segLen = Math.hypot(dx, dz);
      if (segLen < 0.5) continue;
      const yaw = Math.atan2(dx, dz);
      const nx = dz / segLen;
      const nz = -dx / segLen;
      const mx = (x0 + x1) * 0.5;
      const mz = (z0 + z1) * 0.5;

      if (whiteEdges) {
        const edgeOff = halfW - 0.30;
        for (const sgn of [-1, 1]) {
          addRotBox(staticG, [0.14, 0.008, segLen + 0.2], [mx + nx * edgeOff * sgn, y, mz + nz * edgeOff * sgn], roadLineWhite, yaw, { castShadow: false });
        }
      }
      if (doubleYellow) {
        for (const sgn of [-0.14, 0.14]) {
          addRotBox(staticG, [0.12, 0.008, segLen], [mx + nx * sgn, y, mz + nz * sgn], roadLineYellow, yaw, { castShadow: false });
        }
      }
      if (dashedWhite || dashedYellow) {
        const lineMat = dashedYellow ? roadLineYellow : roadLineWhite;
        const dashLen = 2.6;
        const step = 5.6;
        for (let d = 2.0; d < segLen - 2.0; d += step) {
          const t = d / segLen;
          addRotBox(staticG, [0.15, 0.008, dashLen], [x0 + dx * t, y, z0 + dz * t], lineMat, yaw, { castShadow: false });
        }
      }
    }
  }

  function addSidewalkAlongPolyline(pts, roadHalfW, sideSign, { walkWidth = 2.0, addGrates = true } = {}) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i];
      const [x1, z1] = pts[i + 1];
      const dx = x1 - x0;
      const dz = z1 - z0;
      const segLen = Math.hypot(dx, dz);
      if (segLen < 0.5) continue;
      const yaw = Math.atan2(dx, dz);
      const nx = (dz / segLen) * sideSign;
      const nz = (-dx / segLen) * sideSign;
      const mx = (x0 + x1) * 0.5;
      const mz = (z0 + z1) * 0.5;

      const curbOff = roadHalfW + 0.12;
      addRotBox(staticG, [0.24, 0.175, segLen + 0.3], [mx + nx * curbOff, 0.088, mz + nz * curbOff], curbBlackYellow, yaw, { castShadow: false });
      const walkOff = roadHalfW + 0.24 + walkWidth * 0.5;
      const wx = mx + nx * walkOff;
      const wz = mz + nz * walkOff;
      addRotBox(staticG, [walkWidth, 0.16, segLen + 0.3], [wx, 0.08, wz], footpathMat, yaw, { castShadow: false, uvScale: 2.2 });
      addWalkableSlab(wx, wz, walkWidth + 0.24, segLen + 0.4, yaw, 0.16);

      if (addGrates) {
        const grateOff = roadHalfW - 0.32;
        for (let d = 5.5; d < segLen - 4.0; d += 14.0) {
          const t = d / segLen;
          addRotBox(staticG, [0.46, 0.012, 0.84], [x0 + dx * t + nx * grateOff, 0.056, z0 + dz * t + nz * grateOff], drainGrateMat, yaw, { castShadow: false });
        }
      }
    }
  }

  function addZebraCrosswalk(cx, cz, yaw, roadWidth = 8.0) {
    const nx = Math.cos(yaw);
    const nz = -Math.sin(yaw);
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    const stripes = Math.max(4, Math.floor(roadWidth / 0.96));
    const start = -((stripes - 1) * 0.92) * 0.5;
    for (let i = 0; i < stripes; i++) {
      const off = start + i * 0.92;
      addRotBox(staticG, [0.46, 0.004, 2.35], [cx + nx * off, 0.005, cz + nz * off], roadLineWhite, yaw, { castShadow: false });
    }
    addRotBox(staticG, [roadWidth - 0.6, 0.004, 0.36], [cx + fx * 1.95, 0.005, cz + fz * 1.95], roadLineWhite, yaw, { castShadow: false });
  }

  function addOrnamentalMedianTree(x, z) {
    cylinder(staticG, 0.11, 0.16, 2.1, [x, 1.35, z], treeTrunkMat, 7);
    const crown1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.05, 1), panGreenMat);
    crown1.position.set(x, 2.85, z);
    crown1.scale.set(1.05, 0.85, 1.05);
    crown1.castShadow = true;
    staticG.add(crown1);
    const crown2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.78, 1), grassMat);
    crown2.position.set(x + 0.30, 3.45, z - 0.15);
    staticG.add(crown2);
  }

  function addDoubleLamp(x, z, rotY = 0) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    cylinder(g, 0.09, 0.14, 7.6, [0, 3.8, 0], chromeMat, 8);
    for (const sx of [-1, 1]) {
      box(g, [1.50, 0.06, 0.07], [sx * 0.75, 7.45, 0], chromeMat);
      box(g, [0.46, 0.10, 0.22], [sx * 1.42, 7.52, 0], steelDark);
      const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.15), lampGlow);
      bulb.position.set(x + Math.cos(rotY) * (sx * 1.42), 7.45, z - Math.sin(rotY) * (sx * 1.42));
      bulb.rotation.y = rotY;
      dynamicG.add(bulb);
    }
    staticG.add(g);
  }

  function addDetailedDiningBooth(intG, tx, tz, cushionMat, toWorld, seatYaw, seatLabel, fy = 0.18) {
    // Polished hardwood dining table + steel base + runner
    box(intG, [1.90, 0.07, 1.06], [tx, 0.76, tz], darkWoodMat);
    box(intG, [1.92, 0.02, 0.34], [tx, 0.80, tz], cushionMat);
    box(intG, [0.14, 0.74, 0.54], [tx, 0.37, tz], steelDark);
    box(intG, [0.68, 0.05, 0.68], [tx, 0.03, tz], steelDark);
    // 4 Ceramic Biryani Plates + Borhani Glasses + Tissue Box
    for (const px of [-0.50, 0.50]) {
      cylinder(intG, 0.14, 0.11, 0.03, [tx + px, 0.815, tz - 0.26], creamWall, 10);
      cylinder(intG, 0.14, 0.11, 0.03, [tx + px, 0.815, tz + 0.26], creamWall, 10);
      cylinder(intG, 0.04, 0.032, 0.11, [tx + px + 0.19, 0.855, tz - 0.26], acWhiteMat, 8);
      cylinder(intG, 0.04, 0.032, 0.11, [tx + px + 0.19, 0.855, tz + 0.26], acWhiteMat, 8);
    }
    box(intG, [0.22, 0.08, 0.12], [tx, 0.84, tz], brassMat);
    // Cushioned Booth Seats with Backrests (both sides)
    for (const szOff of [-0.84, 0.84]) {
      box(intG, [1.84, 0.44, 0.48], [tx, 0.22, tz + szOff], cushionMat);
      box(intG, [1.84, 0.54, 0.12], [tx, 0.68, tz + szOff + Math.sign(szOff) * 0.20], cushionMat);
    }
    const sw = toWorld(tx, tz + 0.82);
    seats.push({ seatX: sw.x, seatZ: sw.z, seatY: 0.46, yaw: seatYaw, fy, label: seatLabel });
  }

  // ============================================================================
  // 1) REALISTIC ASPHALT ROADS, PAVED FOOTPATHS & SEAMLESS ROYAL MORE CONNECTION!
  //    East KDA Avenue aligns 1:1 with Royal More's exact endpoints:
  //    North Lane -> [-834.0, -290.5] (w=8.2) | South Lane -> [-834.0, -283.2] (w=8.2)
  //    Central Landscaped Median -> [-828.0, -286.2]
  // ============================================================================
  box(staticG, [230, 0.024, 194], [-918, -0.026, -292], urbanGroundMat, { castShadow: false });

  // Main Roundabout Taltola-style Asphalt Apron (inner r = 6.15m, outer r = 16.0m, flush at y = 0.003)
  const ringGeo = new THREE.RingGeometry(6.15, 16.0, 64);
  ringGeo.rotateX(-Math.PI / 2);
  const srPos = ringGeo.attributes.position;
  const srUv = ringGeo.attributes.uv;
  for (let i = 0; i < srPos.count; i++) {
    srUv.setXY(i, (CX + srPos.getX(i)) / 5.5, (CZ + srPos.getZ(i)) / 5.5);
  }
  srUv.needsUpdate = true;
  const ringMesh = new THREE.Mesh(ringGeo, asphaltMat);
  ringMesh.position.set(CX, 0.003, CZ);
  ringMesh.receiveShadow = true;
  staticG.add(ringMesh);

  // Crisp Inner White Apron Ring + Dashed White Roundabout Lane Divider
  const innerLineGeo = new THREE.RingGeometry(6.65, 6.82, 48);
  innerLineGeo.rotateX(-Math.PI / 2);
  const innerLineMesh = new THREE.Mesh(innerLineGeo, roadLineWhite);
  innerLineMesh.position.set(CX, 0.005, CZ);
  staticG.add(innerLineMesh);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    addRotBox(staticG, [0.16, 0.004, 1.38], [CX + Math.cos(a) * 11.2, 0.005, CZ + Math.sin(a) * 11.2], roadLineWhite, -a, { castShadow: false });
  }

  // 1a & 1b. EAST KDA AVENUE DUAL CARRIAGEWAY -> SEAMLESSLY CONNECTED TO ROYAL MORE!
  const kdaEastNorthPts = [[CX + 12.0, CZ - 5.2], [-872.0, -293.0], [-833.5, -290.5]];
  const kdaEastSouthPts = [[CX + 12.0, CZ + 5.2], [-872.0, -283.5], [-833.5, -283.2]];
  addRoadRibbon(kdaEastNorthPts, 8.2, -0.018);
  addRoadRibbon(kdaEastSouthPts, 8.2, -0.018);
  addRoadMarkings(kdaEastNorthPts, 8.2, { dashedWhite: true, whiteEdges: true });
  addRoadMarkings(kdaEastSouthPts, 8.2, { dashedWhite: true, whiteEdges: true });
  addSidewalkAlongPolyline(kdaEastNorthPts, 4.1, 1, { walkWidth: 2.0, addGrates: true });
  addSidewalkAlongPolyline(kdaEastSouthPts, 4.1, -1, { walkWidth: 2.0, addGrates: true });

  // 2. WEST KDA AVENUE (TOWARD MOYLAPOTA)
  const kdaWestPts = [[CX - 12.0, CZ], [-1022.0, CZ]];
  addRoadRibbon(kdaWestPts, 14.2, -0.018);
  addRoadMarkings(kdaWestPts, 14.2, { doubleYellow: true, whiteEdges: true });
  addSidewalkAlongPolyline(kdaWestPts, 7.1, -1, { walkWidth: 2.2, addGrates: true });
  addSidewalkAlongPolyline(kdaWestPts, 7.1, 1, { walkWidth: 2.2, addGrates: true });

  // 3-7. OTHER 5 CONVERGING ROADS OF SATRASTA MORE (WITH MARKINGS & CURBED FOOTPATHS!)
  const radialRoads = [
    { pts: [[CX - 8.5, CZ - 10.5], [-985, -372]], w: 10.6, dashedYellow: true },  // 3. NW Majid Sarani / Shibbari
    { pts: [[CX + 8.5, CZ - 10.5], [-878, -372]], w: 9.6, dashedYellow: true },   // 4. NE Shantidham / Shamsur Rahman
    { pts: [[CX - 8.5, CZ + 10.5], [-985, -214]], w: 10.4, dashedYellow: true },  // 5. SW Banorgati / Nirala
    { pts: [[CX + 9.0, CZ + 10.5], [-862, -218]], w: 9.8, dashedYellow: true },   // 6. SE Tootpara / South Central Rd
    { pts: [[CX, CZ + 12.5], [CX, -214]], w: 7.4, dashedYellow: true },           // 7. South Satrasta Cross Lane
  ];
  for (const r of radialRoads) {
    addRoadRibbon(r.pts, r.w, -0.019);
    addRoadMarkings(r.pts, r.w, { dashedYellow: r.dashedYellow, whiteEdges: true });
    addSidewalkAlongPolyline(r.pts, r.w * 0.5, 1, { walkWidth: 1.65, addGrates: false });
    addSidewalkAlongPolyline(r.pts, r.w * 0.5, -1, { walkWidth: 1.65, addGrates: false });
  }

  // CONTINUOUS LANDSCAPED KDA AVENUE MEDIAN BRIDGING SATRASTA MORE -> ROYAL MORE (-828, -286.2)!
  const kdaMedianPts = [[-901.5, -291.6], [-872.0, -288.25], [-828.0, -286.85]];
  for (let i = 0; i < kdaMedianPts.length - 1; i++) {
    const [x0, z0] = kdaMedianPts[i];
    const [x1, z1] = kdaMedianPts[i + 1];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const segLen = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    const mx = (x0 + x1) * 0.5;
    const mz = (z0 + z1) * 0.5;
    addRotBox(staticG, [1.52, 0.30, segLen - 0.6], [mx, 0.15, mz], curbBlackYellow, yaw);
    addRotBox(staticG, [1.06, 0.34, segLen - 1.2], [mx, 0.17, mz], grassMat, yaw, { castShadow: false });
    addRotBox(staticG, [0.76, 0.52, segLen - 2.0], [mx, 0.52, mz], panGreenMat, yaw);
    addOBB(mx, mz, 1.52, segLen - 0.6, yaw, 0.95);

    const lampStep = 18.0;
    for (let d = 5.0; d < segLen - 3.0; d += lampStep) {
      const t = d / segLen;
      addDoubleLamp(x0 + dx * t, z0 + dz * t, yaw);
    }
    for (let d = 13.0; d < segLen - 4.0; d += 18.0) {
      const t = d / segLen;
      addOrnamentalMedianTree(x0 + dx * t, z0 + dz * t);
    }
    for (let d = 3.0; d < segLen - 2.5; d += 5.5) {
      const t = d / segLen;
      const fl = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), Math.floor(d) % 2 === 0 ? flowerRed : flowerGold);
      fl.position.set(x0 + dx * t, 0.88, z0 + dz * t);
      staticG.add(fl);
    }
  }

  // ZEBRA CROSSWALKS + WHITE STOP BARS ON ALL MAJOR ROUNDABOUT APPROACHES
  addZebraCrosswalk(CX + 16.5, CZ - 5.0, Math.PI * 0.5, 7.8);  // East KDA North
  addZebraCrosswalk(CX + 16.5, CZ + 5.0, Math.PI * 0.5, 7.8);  // East KDA South
  addZebraCrosswalk(CX - 17.5, CZ, -Math.PI * 0.5, 13.2);      // West KDA
  addZebraCrosswalk(CX - 11.8, CZ - 14.5, -0.68, 9.8);         // NW Shibbari
  addZebraCrosswalk(CX + 10.5, CZ - 14.8, 0.48, 8.8);          // NE Shantidham
  addZebraCrosswalk(CX - 11.8, CZ + 14.8, Math.PI + 0.68, 9.6);// SW Banorgati
  addZebraCrosswalk(CX + 11.5, CZ + 14.8, Math.PI - 0.55, 9.0);// SE Tootpara

  // ============================================================================
  // 2) TALL, SLENDER SCULPTED WOOD LOG / TREE-TRUNK MONUMENT AT SATRASTA MORE
  //    ("সাতরাস্তা মোড়ের কাঠের গুঁড়ির ভাস্কর্য" — আরও চিকন ও লম্বা!)
  // ============================================================================
  {
    addCircle(CX, CZ, 6.30, 12.0);
    const mon = new THREE.Group();
    mon.position.set(CX, 0, CZ);
    staticG.add(mon);

    // Cut-timber growth-ring texture for sawed log ends
    const ringCan = document.createElement('canvas');
    ringCan.width = 256;
    ringCan.height = 256;
    const rCtx = ringCan.getContext('2d');
    rCtx.fillStyle = '#5c4028';
    rCtx.fillRect(0, 0, 256, 256);
    for (let rad = 118; rad > 8; rad -= 9) {
      rCtx.strokeStyle = rad % 18 === 0 ? '#3a2414' : '#785436';
      rCtx.lineWidth = 4;
      rCtx.beginPath();
      rCtx.arc(128, 128, rad, 0, Math.PI * 2);
      rCtx.stroke();
    }
    const cutWoodTex = new THREE.CanvasTexture(ringCan);
    cutWoodTex.colorSpace = THREE.SRGBColorSpace;
    const cutWoodMat = new THREE.MeshStandardMaterial({ map: cutWoodTex, roughness: 0.78 });
    const barkMat = new THREE.MeshStandardMaterial({
      color: 0x261c15,
      map: blackWoodTex,
      roughness: 0.84,
      metalness: 0.05,
    });
    const darkBarkMat = new THREE.MeshStandardMaterial({
      color: 0x17110c,
      map: blackWoodTex,
      roughness: 0.90,
      metalness: 0.04,
    });
    const mossStoneMat = new THREE.MeshStandardMaterial({ color: 0x4b5349, roughness: 0.90 });

    // Outer Black-and-Yellow Striped Island Curb + Paved Apron (r = 6.2m)
    cylinder(mon, 6.10, 6.20, 0.24, [0, 0.12, 0], footpathMat, 40);
    const curbCount = 32;
    for (let i = 0; i < curbCount; i++) {
      const a = (i / curbCount) * Math.PI * 2;
      const segLen = (2 * Math.PI * 6.18) / curbCount + 0.04;
      addRotBox(mon, [0.28, 0.28, segLen], [Math.cos(a) * 6.16, 0.14, Math.sin(a) * 6.16], i % 2 === 0 ? roadLineYellow : steelDark, -a);
    }

    // Inner Circular Stone Planter Basin, Flowerbed & Stainless Steel Railing (r = 4.75m)
    cylinder(mon, 4.72, 4.82, 0.68, [0, 0.44, 0], graniteMat, 32);
    cylinder(mon, 4.44, 4.44, 0.72, [0, 0.46, 0], grassMat, 32);
    for (const ry of [0.96, 1.24]) {
      const railRing = new THREE.Mesh(new THREE.TorusGeometry(4.72, 0.040, 8, 44), chromeMat);
      railRing.rotation.x = Math.PI / 2;
      railRing.position.y = ry;
      mon.add(railRing);
    }
    const flMats = [flowerRed, flowerGold, flowerPink];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      cylinder(mon, 0.03, 0.036, 0.56, [Math.cos(a) * 4.72, 0.96, Math.sin(a) * 4.72], chromeMat, 6);
      const fl = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 1), flMats[i % 3]);
      fl.position.set(Math.cos(a) * 3.72, 0.92, Math.sin(a) * 3.72);
      mon.add(fl);
    }

    // Sleek Raised Stone Pedestal & Mossy Earth Mound (narrower to accentuate tall slender silhouette)
    cylinder(mon, 2.25, 2.48, 0.52, [0, 1.02, 0], graniteMat, 12);
    cylinder(mon, 1.78, 2.02, 0.54, [0, 1.52, 0], mossStoneMat, 12);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.2;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42 + (i % 3) * 0.10, 1), i % 2 === 0 ? graniteMat : mossStoneMat);
      rock.scale.set(1.15, 0.60, 0.95);
      rock.position.set(Math.cos(a) * 1.48, 1.62, Math.sin(a) * 1.48);
      rock.rotation.y = a;
      mon.add(rock);
    }

    // 6 Warm Golden Ground Uplights illuminating the tall sculpted wooden column at night
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.35;
      const ul = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.14, 10), uplightGold);
      ul.position.set(CX + Math.cos(a) * 2.08, 1.32, CZ + Math.sin(a) * 2.08);
      dynamicG.add(ul);
    }

    // TALL & SLENDER SCULPTED WOODEN LOG / TREE-TRUNK MONUMENT (চিকন ও লম্বা · y = 1.55m -> 10.6m!)
    // 1) Main Tall, Slim Gnarled Timber Trunk with organic S-curve & fluted bark ridges
    const mainTrunkPts = [
      new THREE.Vector3(0.0, 1.55, 0.0),
      new THREE.Vector3(0.11, 3.65, -0.06),
      new THREE.Vector3(-0.09, 5.95, 0.09),
      new THREE.Vector3(0.08, 8.30, -0.05),
      new THREE.Vector3(-0.03, 10.55, 0.03),
    ];
    const mainCurve = new THREE.CatmullRomCurve3(mainTrunkPts);
    const trunkGeo = new THREE.TubeGeometry(mainCurve, 34, 0.50, 14, false);
    const posAttr = trunkGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);
      const hFrac = THREE.MathUtils.clamp((vy - 1.55) / 9.0, 0, 1);
      const ang = Math.atan2(vz, vx);
      const taper = THREE.MathUtils.lerp(1.16, 0.46, hFrac);
      const barkRidge = 1.0 + Math.sin(ang * 7.0 + hFrac * 3.8) * 0.11 + Math.cos(ang * 13.0 - hFrac * 5.2) * 0.05;
      posAttr.setXYZ(i, vx * taper * barkRidge, vy, vz * taper * barkRidge);
    }
    trunkGeo.computeVertexNormals();
    const trunkMesh = new THREE.Mesh(trunkGeo, barkMat);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    mon.add(trunkMesh);

    // Sculpted Angled Cut-Face at the Tall Crown showing wood growth rings
    const topCut = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.08, 14), cutWoodMat);
    topCut.position.set(-0.03, 10.56, 0.03);
    topCut.rotation.z = 0.22;
    mon.add(topCut);

    // 2) 7 Slim Flared Sundarbans Buttress Roots hugging the tall base
    for (let r = 0; r < 7; r++) {
      const a = (r / 7) * Math.PI * 2 + (r % 2) * 0.14;
      const rootCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(a) * 0.36, 3.65 + (r % 2) * 0.55, Math.sin(a) * 0.36),
        new THREE.Vector3(Math.cos(a + 0.08) * 0.78, 2.35, Math.sin(a + 0.08) * 0.78),
        new THREE.Vector3(Math.cos(a + 0.14) * 1.38, 1.58, Math.sin(a + 0.14) * 1.38),
      ]);
      const rootMesh = new THREE.Mesh(new THREE.TubeGeometry(rootCurve, 14, 0.16 + (r % 2) * 0.04, 8, false), darkBarkMat);
      rootMesh.castShadow = true;
      mon.add(rootMesh);
    }

    // 3) 3 Sleek Upward-Sweeping Sculpted Wooden Boughs branching high up the tall trunk
    const boughs = [
      { ang: 0.45, y0: 5.5, len: 1.45, rise: 2.35, r: 0.21 },
      { ang: 2.55, y0: 6.4, len: 1.35, rise: 2.55, r: 0.19 },
      { ang: 4.55, y0: 4.9, len: 1.30, rise: 2.05, r: 0.20 },
    ];
    for (const b of boughs) {
      const p0 = new THREE.Vector3(Math.cos(b.ang) * 0.26, b.y0, Math.sin(b.ang) * 0.26);
      const p1 = new THREE.Vector3(Math.cos(b.ang + 0.10) * (b.len * 0.58), b.y0 + b.rise * 0.55, Math.sin(b.ang + 0.10) * (b.len * 0.58));
      const p2 = new THREE.Vector3(Math.cos(b.ang) * b.len, b.y0 + b.rise, Math.sin(b.ang) * b.len);
      const bCurve = new THREE.CatmullRomCurve3([p0, p1, p2]);
      const bMesh = new THREE.Mesh(new THREE.TubeGeometry(bCurve, 14, b.r, 10, false), barkMat);
      bMesh.castShadow = true;
      mon.add(bMesh);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(b.r * 0.92, b.r * 0.95, 0.06, 12), cutWoodMat);
      cap.position.copy(p2);
      cap.lookAt(p2.clone().add(new THREE.Vector3(Math.cos(b.ang), 1.1, Math.sin(b.ang))));
      cap.rotateX(Math.PI * 0.5);
      mon.add(cap);
    }

    // 4) Iconic Sundarbans Wooden Pneumatophores (শ্বাসমূল) around the stone mound
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      const dist = 1.55 + (k % 3) * 0.26;
      const ph = 0.52 + (k % 4) * 0.20;
      cylinder(mon, 0.032, 0.072, ph, [Math.cos(a) * dist, 1.55 + ph * 0.4, Math.sin(a) * dist], darkBarkMat, 6);
    }

    // Clean Engraved Plaques facing East (Royal More) & West (Moylapota)
    addSignBox(dynamicG, {
      title: 'সাতরাস্তা মোড় · খুলনা',
      subtitle: 'SATRASTA MORE · KDA AVENUE',
      bg: '#14110f', fg: '#fde047', accent: '#f59e0b', border: '#eab308',
    }, [CX + 1.88, 1.48, CZ], Math.PI * 0.5, 2.45, 0.76);
    addSignBox(dynamicG, {
      title: 'সাতরাস্তা মোড় · খুলনা',
      subtitle: '← ময়লাপোতা  |  রয়্যাল মোড় →',
      bg: '#14110f', fg: '#fde047', accent: '#f59e0b', border: '#eab308',
    }, [CX - 1.88, 1.48, CZ], -Math.PI * 0.5, 2.45, 0.76);
  }

  // ============================================================================
  // HELPER: ENTERABLE HIGH-QUALITY GROUND-FLOOR SHOP / RESTAURANT BUILDER
  // ============================================================================
  function createEnterableShop({
    name, zoneLabel, cx, cz, rotY = 0, w, d, h = 4.0, upperFloors = 0,
    wallMat = creamWall, accentMat = maroonWall, awningMat = tinAwningMat, floorMat = tileFloorMat,
    doorWidth = 2.8, hasGlassDoor = false,
    signTitle, signSub, signBg = '#0f3d2e', signFg = '#ffffff', signAccent = '#fde047',
    buildInterior,
  }) {
    const hw = w * 0.5;
    const hd = d * 0.5;
    const cosR = Math.cos(rotY);
    const sinR = Math.sin(rotY);
    const toWorld = (lx, lz) => ({
      x: cx + lx * cosR + lz * sinR,
      z: cz - lx * sinR + lz * cosR,
    });

    const shopStatic = new THREE.Group();
    shopStatic.position.set(cx, 0, cz);
    shopStatic.rotation.y = rotY;
    staticG.add(shopStatic);

    const shopDyn = new THREE.Group();
    shopDyn.position.set(cx, 0, cz);
    shopDyn.rotation.y = rotY;
    dynamicG.add(shopDyn);

    // Tiled Floor + Front Veranda Apron + Bright Self-Lit Ceiling Slab (Taltola-House Quality!)
    box(shopStatic, [w, 0.18, d], [0, 0.09, 0], floorMat, { uvScale: 1.8 });
    box(shopStatic, [w + 0.8, 0.14, 2.0], [0, 0.07, hd + 1.0], footpathMat, { castShadow: false });
    addWalkableSlab(cx, cz, w + 0.8, d + 2.4, rotY, 0.18);
    box(shopStatic, [w + 0.35, 0.26, d + 0.35], [0, h, 0], creamWall);
    box(shopStatic, [w - 0.48, 0.05, d - 0.48], [0, h - 0.14, 0], ceilingBrightMat, { castShadow: false });

    // Decorative Front Corner Pilasters with Black Granite Plinths, Brass Collar & Terracotta Potted Plants
    for (const px of [-hw + 0.18, hw - 0.18]) {
      box(shopStatic, [0.46, h, 0.46], [px, h * 0.5, hd - 0.08], accentMat);
      box(shopStatic, [0.54, 0.52, 0.54], [px, 0.26, hd - 0.08], graniteMat);
      box(shopStatic, [0.52, 0.08, 0.52], [px, 0.54, hd - 0.08], brassMat);
      box(shopStatic, [0.52, 0.08, 0.52], [px, h - 0.28, hd - 0.08], brassMat);
      // Terracotta potted plant flanking entrance veranda
      const potX = px - Math.sign(px) * 0.25;
      cylinder(shopStatic, 0.22, 0.16, 0.38, [potX, 0.33, hd + 0.72], terracottaMat, 10);
      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.30, 1), panGreenMat);
      bush.position.set(potX, 0.66, hd + 0.72);
      shopStatic.add(bush);
    }

    // Hollow Perimeter Walls
    const addLocalWall = (lx, lz, sw, sd, sy = h) => {
      box(shopStatic, [sw, sy, sd], [lx, sy * 0.5, lz], wallMat);
      const wp = toWorld(lx, lz);
      addOBB(wp.x, wp.z, sw, sd, rotY, sy);
    };
    addLocalWall(-hw + 0.14, 0, 0.28, d);
    addLocalWall(hw - 0.14, 0, 0.28, d);
    addLocalWall(0, -hd + 0.14, w, 0.28);

    const sideW = (w - doorWidth) * 0.5;
    if (sideW > 0.3) {
      addLocalWall(-hw + sideW * 0.5, hd - 0.14, sideW, 0.28, 0.95);
      addLocalWall(hw - sideW * 0.5, hd - 0.14, sideW, 0.28, 0.95);
      // Tall Aluminum-Framed Multi-Pane Storefront Windows
      for (const sgn of [-1, 1]) {
        const wx = sgn * (hw - sideW * 0.5);
        const winH = h - 1.25;
        const winY = 0.95 + winH * 0.5;
        box(shopStatic, [sideW - 0.12, winH, 0.06], [wx, winY, hd - 0.12], glassMat, { castShadow: false });
        box(shopStatic, [sideW, 0.08, 0.16], [wx, 0.98, hd - 0.10], aluminumMat);
        box(shopStatic, [sideW, 0.08, 0.16], [wx, h - 0.32, hd - 0.10], aluminumMat);
        box(shopStatic, [0.06, winH, 0.14], [wx, winY, hd - 0.10], aluminumMat);
        box(shopStatic, [sideW - 0.08, 0.05, 0.12], [wx, winY + winH * 0.22, hd - 0.10], aluminumMat);
      }
    }
    // Header lintel above doorway with brass accent molding
    box(shopStatic, [doorWidth + 0.14, h - 2.75, 0.30], [0, 2.75 + (h - 2.75) * 0.5, hd - 0.14], accentMat);
    box(shopStatic, [doorWidth + 0.18, 0.06, 0.34], [0, 2.76, hd - 0.12], brassMat);

    // Projecting Front Awning + Warm Under-Awning Recessed Lights + 1024px Illuminated Bengali Signboard
    const awn = box(shopStatic, [w + 0.6, 0.12, 1.75], [0, 3.12, hd + 0.78], awningMat);
    awn.rotation.x = 0.15;
    for (let lx = -hw + 1.5; lx <= hw - 1.5; lx += 2.6) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), lampGlow);
      b.position.set(lx, 2.94, hd + 0.82);
      shopDyn.add(b);
    }
    addSignBox(shopDyn, {
      title: signTitle, subtitle: signSub, bg: signBg, fg: signFg, accent: signAccent, width: 1024, height: 300,
    }, [0, h - 0.12, hd + 0.24], 0, Math.min(w - 0.2, 13.4), 1.24);

    // Optional Openable Double Glass Entrance Door (starts OPEN for immediate walk-in!)
    if (hasGlassDoor) {
      const piv = new THREE.Group();
      piv.position.set(-doorWidth * 0.5 + 0.06, 0.18, hd - 0.12);
      const dg = new THREE.Group();
      const dw = doorWidth * 0.48;
      box(dg, [dw, 2.48, 0.05], [dw * 0.5, 1.24, 0], glassMat, { castShadow: false });
      box(dg, [dw, 0.08, 0.08], [dw * 0.5, 2.46, 0], brassMat);
      box(dg, [dw, 0.08, 0.08], [dw * 0.5, 0.04, 0], brassMat);
      box(dg, [0.05, 0.58, 0.12], [dw - 0.14, 1.20, 0], brassMat);
      piv.add(dg);
      piv.rotation.y = Math.PI * 0.52;
      shopDyn.add(piv);
      const dwPos = toWorld(0, hd);
      interactiveDoors.push({
        label: name, pivot: piv, x: dwPos.x, z: dwPos.z, open: true, angle: Math.PI * 0.52, openAngle: Math.PI * 0.52,
      });
    }

    // TALTOLA-HOUSE QUALITY UPPER FLOORS (Aluminum-Framed Windows, Sunshades, Balconies, Steel Railings, AC Condensers & PVC Pipes!)
    if (upperFloors > 0) {
      const upH = upperFloors * 3.25;
      box(shopStatic, [w, upH, d], [0, h + upH * 0.5, 0], wallMat);
      // Vertical Red-Brick Accent Corner Bands & Exterior PVC Drainage Pipes
      for (const sgn of [-1, 1]) {
        box(shopStatic, [0.46, upH + 0.4, 0.46], [sgn * (hw - 0.14), h + upH * 0.5, hd - 0.06], brickMat);
        cylinder(shopStatic, 0.045, 0.045, h + upH, [sgn * (hw + 0.08), (h + upH) * 0.5, hd - 0.65], pvcPipeMat, 8);
        for (let py = 2.0; py < h + upH; py += 3.0) {
          box(shopStatic, [0.14, 0.05, 0.14], [sgn * (hw + 0.04), py, hd - 0.65], steelDark);
        }
      }
      for (let f = 0; f < upperFloors; f++) {
        const fy = h + f * 3.25;
        // Floor slab band + white cornice trim
        box(shopStatic, [w + 0.46, 0.24, d + 0.46], [0, fy + 3.20, 0], creamWall);
        box(shopStatic, [w + 0.52, 0.07, d + 0.52], [0, fy + 3.08, 0], accentMat);

        // Cantilevered Front Balcony with Steel Railing & Balusters!
        const balW = Math.min(w - 2.0, 5.4);
        if (balW > 2.2) {
          const balY = fy + 0.14;
          box(shopStatic, [balW, 0.18, 1.10], [0, balY, hd + 0.52], creamWall);
          box(shopStatic, [balW, 0.44, 0.14], [0, balY + 0.28, hd + 1.00], accentMat);
          rodBetween(shopStatic, [-balW * 0.48, balY + 0.96, hd + 1.02], [balW * 0.48, balY + 0.96, hd + 1.02], 0.024, railMat, 8);
          rodBetween(shopStatic, [-balW * 0.48, balY + 0.72, hd + 1.02], [balW * 0.48, balY + 0.72, hd + 1.02], 0.018, railMat, 8);
          const postCount = Math.max(3, Math.floor(balW / 0.72));
          for (let pi = 0; pi <= postCount; pi++) {
            const pxP = -balW * 0.48 + (pi / postCount) * (balW * 0.96);
            rodBetween(shopStatic, [pxP, balY + 0.48, hd + 1.02], [pxP, balY + 0.96, hd + 1.02], 0.018, railMat, 6);
          }
        }

        for (let wx = -hw + 2.0; wx <= hw - 2.0; wx += 3.4) {
          // Recessed Aluminum-Framed Multi-Pane Window + Projecting Sunshade Canopy
          const wy = fy + 1.64;
          box(shopStatic, [2.20, 1.66, 0.08], [wx, wy, hd + 0.03], glassTintBlue, { castShadow: false });
          box(shopStatic, [2.32, 0.07, 0.14], [wx, wy - 0.84, hd + 0.06], aluminumMat);
          box(shopStatic, [2.32, 0.07, 0.14], [wx, wy + 0.84, hd + 0.06], aluminumMat);
          box(shopStatic, [0.07, 1.72, 0.14], [wx - 1.12, wy, hd + 0.06], aluminumMat);
          box(shopStatic, [0.07, 1.72, 0.14], [wx + 1.12, wy, hd + 0.06], aluminumMat);
          box(shopStatic, [0.055, 1.66, 0.14], [wx, wy, hd + 0.06], aluminumMat);
          box(shopStatic, [2.20, 0.045, 0.14], [wx, wy + 0.22, hd + 0.06], aluminumMat);
          // Projecting concrete sunshade canopy (chajja) + sill
          box(shopStatic, [2.56, 0.10, 0.46], [wx, wy + 0.96, hd + 0.22], creamWall);
          box(shopStatic, [2.42, 0.12, 0.26], [wx, wy - 0.90, hd + 0.12], accentMat);

          // Detailed Outdoor Split AC Condenser with Fan Grille & Wall Brackets
          if (Math.abs(wx) < hw - 3.5 && f % 2 === 0) {
            const acX = wx + 1.48;
            const acY = fy + 1.06;
            box(shopStatic, [0.78, 0.54, 0.32], [acX, acY, hd + 0.20], acWhiteMat);
            const fanG = cylinder(shopStatic, 0.19, 0.19, 0.34, [acX - 0.12, acY, hd + 0.20], steelDark, 12);
            fanG.rotation.x = Math.PI / 2;
            for (const bx of [-0.28, 0.28]) {
              box(shopStatic, [0.05, 0.32, 0.34], [acX + bx, acY - 0.26, hd + 0.18], steelDark);
            }
          }
        }
      }
      // Rooftop Parapet with Coping Cap & Water Tank
      box(shopStatic, [w + 0.30, 0.95, 0.24], [0, h + upH + 0.48, hd], accentMat);
      box(shopStatic, [w + 0.38, 0.10, 0.32], [0, h + upH + 0.98, hd], creamWall);
      cylinder(shopStatic, 0.62, 0.62, 1.42, [-hw + 2.2, h + upH + 0.72, -hd + 2.2], steelDark, 12);
    }

    // High-Detail Furnished Interior Group (Batched & Distance Culled at 62m!)
    const intG = new THREE.Group();
    intG.position.set(cx, 0.18, cz);
    intG.rotation.y = rotY;
    buildInterior(intG, shopDyn, toWorld, { w, d, h, hw, hd });
    mergeStaticMeshes(intG);
    root.add(intG);
    interiorGroups.push({ group: intG, cx, cz, maxDistSq: 62 * 62 });
    shopZones.push({ cx, cz, hx: hw, hz: hd, cos: cosR, sin: sinR, minY: -1, maxY: h + 0.5, label: zoneLabel });
  }

  // ============================================================================
  // 3) SHOP #1 (NORTH SIDE — OPPOSITE BILLAL BHAI): GRAND বড় সাতরাস্তা কাচ্চি ঘর!
  //    (Swapped to North side of KDA Avenue directly opposite Billal Bhai Tea Shop)
  // ============================================================================
  createEnterableShop({
    name: 'সাতরাস্তা কাচ্চি ঘর · গ্র্যান্ড হল',
    zoneLabel: 'SATRASTA MORE · GRAND KACCHI GHOR RESTAURANT',
    cx: -885.5, cz: -310.5, rotY: -0.08, w: 20.5, d: 13.8, h: 4.5, upperFloors: 3,
    wallMat: creamWall, accentMat: emeraldWall, awningMat: emeraldWall, floorMat: kacchiGhorFloorMat,
    doorWidth: 4.0, hasGlassDoor: true,
    signTitle: 'সাতরাস্তা কাচ্চি ঘর · GRAND KACCHI GHOR',
    signSub: 'খাসির স্পেশাল কাচ্চি · খুলনার চুইঝাল গরুর মাংস · বিফ তেহারি · ফ্যামিলি ডাইনিং',
    signBg: '#0f3d2e', signAccent: '#fde047',
    buildInterior(intG, shopDyn, toWorld, { hw, hd, h }) {
      const steamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, roughness: 1.0 });
      // Grand Emerald & Gold Marble Serving Counter + 4 Steaming Copper Handis + Brass Ladles!
      box(intG, [10.4, 1.06, 1.02], [-1.2, 0.53, -hd + 1.75], emeraldWall);
      box(intG, [10.5, 0.08, 1.10], [-1.2, 1.08, -hd + 1.75], brassMat);
      for (const dx of [-4.6, -2.6, -0.6, 1.4]) {
        cylinder(intG, 0.46, 0.38, 0.56, [dx, 1.38, -hd + 1.75], redClothMat, 14);
        cylinder(intG, 0.48, 0.48, 0.08, [dx, 1.68, -hd + 1.75], copperMat, 14);
        cylinder(intG, 0.14, 0.14, 0.06, [dx, 1.75, -hd + 1.75], brassMat, 10);
        rodBetween(intG, [dx + 0.44, 1.14, -hd + 1.55], [dx + 0.62, 1.52, -hd + 1.92], 0.016, brassMat, 6);
        const st = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), steamMat);
        st.position.set(dx, 1.98, -hd + 1.75);
        intG.add(st);
      }
      // Cash Billing Desk + POS Monitor & Receipt Printer on West end of counter
      box(intG, [2.1, 1.06, 0.88], [-7.8, 0.53, -hd + 1.75], darkWoodMat);
      box(intG, [2.16, 0.06, 0.94], [-7.8, 1.08, -hd + 1.75], brassMat);
      box(intG, [0.48, 0.34, 0.06], [-7.8, 1.28, -hd + 1.75], steelDark);
      box(intG, [0.24, 0.18, 0.24], [-7.1, 1.20, -hd + 1.75], acWhiteMat);

      // Stocked Glass Borhani, Firni & Cold-Drinks Display Chiller
      box(intG, [2.4, 1.62, 0.85], [5.8, 0.81, -hd + 1.75], acWhiteMat);
      box(intG, [2.2, 1.02, 0.88], [5.8, 1.08, -hd + 1.75], glassMat, { castShadow: false });
      const bottleCols = [porcelainMat, flowerGold, panGreenMat, flowerRed];
      for (let shelf = 0; shelf < 2; shelf++) {
        const sy = 0.78 + shelf * 0.42;
        for (let bi = 0; bi < 6; bi++) {
          cylinder(intG, 0.055, 0.055, 0.22, [4.95 + bi * 0.34, sy, -hd + 1.72], bottleCols[(bi + shelf) % bottleCols.length], 8);
        }
      }

      // High-Resolution 1024px Illuminated Bengali Menu Board on Back Wall
      const kgMenu = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 1.95), new THREE.MeshStandardMaterial({
        map: makeMenuBoardTexture('সাতরাস্তা কাচ্চি ঘর · স্পেশাল মেনু', [
          'খাসির শাহী কাচ্চি বিরিয়ানি .......... ৪২০ টাকা',
          'খুলনার স্পেশাল চুইঝাল গরুর মাংস ...... ৩২০ টাকা',
          'বিফ তেহারি ও মোরগ পোলাও ............. ২৬০ টাকা',
          'স্পেশাল বোরহানি ও জর্দা ............. ৮০ টাকা',
        ], '#064e3b', '#fde047'),
      }));
      kgMenu.position.set(-1.2, 2.82, -hd + 0.34);
      intG.add(kgMenu);

      // Porcelain Double Hand-Wash Basin Station with Chrome Faucets & Real Reflective Mirror
      box(intG, [0.64, 0.88, 2.10], [hw - 0.62, 0.44, 0.2], porcelainMat);
      box(intG, [0.68, 0.06, 2.16], [hw - 0.62, 0.90, 0.2], graniteMat);
      for (const bz of [-0.32, 0.72]) {
        cylinder(intG, 0.18, 0.14, 0.10, [hw - 0.62, 0.94, bz], porcelainMat, 12);
        cylinder(intG, 0.018, 0.018, 0.16, [hw - 0.38, 1.00, bz], chromeMat, 8);
        rodBetween(intG, [hw - 0.38, 1.06, bz], [hw - 0.54, 1.03, bz], 0.014, chromeMat, 8);
      }
      box(intG, [0.05, 1.08, 1.90], [hw - 0.33, 1.66, 0.2], brassMat);
      box(intG, [0.06, 0.98, 1.80], [hw - 0.34, 1.66, 0.2], mirrorSurfaceMat);

      // Framed Mughlai Wall Art Panels along West Dining Wall
      for (const az of [-2.2, 1.2, 4.2]) {
        box(intG, [0.05, 0.92, 1.38], [-hw + 0.31, 2.05, az], brassMat);
        box(intG, [0.06, 0.82, 1.28], [-hw + 0.32, 2.05, az], wallArtMat);
      }

      // 9 Spacious Luxury 4-Seater Dining Booths (3 Rows × 3 Columns!)
      for (const tx of [-7.0, -0.4, 6.2]) {
        for (const tz of [-2.4, 0.8, 4.0]) {
          addDetailedDiningBooth(intG, tx, tz, emeraldWall, toWorld, Math.PI - 0.08, 'কাচ্চি ঘর ডাইনিং টেবিল', 0.18);
        }
      }
      // 3 Crystal Chandeliers + 4 Spinning Ceiling Fans + 3 Split ACs
      for (const cxCh of [-6.8, -0.4, 6.0]) {
        addChandelier(intG, cxCh, h - 0.15, 0.8);
      }
      addSplitAC(intG, -hw + 0.28, h - 0.75, -1.0, Math.PI * 0.5);
      addSplitAC(intG, -hw + 0.28, h - 0.75, 3.5, Math.PI * 0.5);
      addSplitAC(intG, hw - 0.28, h - 0.75, 3.5, -Math.PI * 0.5);
      for (const fx of [-5.2, 4.6]) {
        for (const fz of [-1.8, 3.6]) {
          addSpinningFan(fx, h - 0.18, fz, shopDyn);
        }
      }
    },
  });

  // ============================================================================
  // 5) SHIMLA PLAZA 5-STORY TOWER + 3RD & 4TH FLOOR ENTERABLE KACCHI BHAI!
  //    ("কাচ্চি ভাইটা একটু উপরে তিন চার তলার উপরে করবেন একটা বিল্ডিংয়ের")
  //    Location: North KDA Avenue (cx = -862.5, cz = -308.5, facing South +Z)
  //    Walkable Marble Staircase climbs GF (0.18m) -> 2nd (3.68m) -> 3rd (7.18m) -> 4th Floor (10.68m)!
  // ============================================================================
  {
    const KCX = -862.5;
    const KCZ = -308.5;
    const KW = 17.6;
    const KD = 13.0;
    const hw = KW * 0.5;
    const hd = KD * 0.5;
    const FL_H = 3.50;
    const Y0 = 0.18;
    const floorYs = [Y0, Y0 + FL_H, Y0 + FL_H * 2, Y0 + FL_H * 3, Y0 + FL_H * 4]; // 0.18, 3.68, 7.18, 10.68, 14.18
    const toWorld = (lx, lz) => ({ x: KCX + lx, z: KCZ + lz });

    const plazaStatic = new THREE.Group();
    plazaStatic.position.set(KCX, 0, KCZ);
    staticG.add(plazaStatic);

    const plazaDyn = new THREE.Group();
    plazaDyn.position.set(KCX, 0, KCZ);
    dynamicG.add(plazaDyn);

    // Front granite apron
    box(plazaStatic, [KW + 1.2, 0.16, 2.2], [0, 0.08, hd + 1.1], graniteMat, { castShadow: false });
    addWalkableSlab(KCX, KCZ + hd + 1.1, KW + 1.2, 2.4, 0, 0.16);

    // Build Ground (0), 2nd (1), 3rd (2 — KACCHI BHAI HALL 1), 4th (3 — KACCHI BHAI VIP HALL 2) + Roof (4)
    // Stairwell Shaft on East side: lx ∈ [5.4 .. 8.5], lz ∈ [-6.1 .. 4.6]
    const STAIR_X0 = 5.45;
    const STAIR_X1 = 8.45;

    for (let fl = 0; fl < 4; fl++) {
      const fy = floorYs[fl];
      const fTop = fy + FL_H;
      const isKacchiFloor = (fl === 2 || fl === 3); // 3rd & 4th Floor = KACCHI BHAI!

      // Floor Slab: Main hall [-hw .. STAIR_X0] + South Stair Landing [STAIR_X0 .. hw, lz: 1.8 .. hd] + North Landing [STAIR_X0 .. hw, lz: -hd .. -3.8]
      const mainW = STAIR_X0 - (-hw);
      const mainCx = (-hw + STAIR_X0) * 0.5;
      box(plazaStatic, [mainW, 0.24, KD], [mainCx, fy - 0.12, 0], isKacchiFloor ? luxuryMarbleMat : tileFloorMat);
      addWalkableSlab(KCX + mainCx, KCZ, mainW, KD, 0, fy);

      const stW = hw - STAIR_X0;
      const stCx = (STAIR_X0 + hw) * 0.5;
      // Front landing (always solid) & Rear landing (always solid)
      box(plazaStatic, [stW, 0.24, 4.4], [stCx, fy - 0.12, hd - 2.2], tileFloorMat);
      addWalkableSlab(KCX + stCx, KCZ + hd - 2.2, stW, 4.4, 0, fy);
      box(plazaStatic, [stW, 0.24, 2.8], [stCx, fy - 0.12, -hd + 1.4], tileFloorMat);
      addWalkableSlab(KCX + stCx, KCZ - hd + 1.4, stW, 2.8, 0, fy);
      if (fl === 0) {
        // Solid ground under entire stairwell
        box(plazaStatic, [stW, 0.24, KD], [stCx, fy - 0.12, 0], tileFloorMat);
        addWalkableSlab(KCX + stCx, KCZ, stW, KD, 0, fy);
      }

      // Perimeter Walls for this floor
      const wallM = isKacchiFloor ? creamWall : modernSlate;
      // West wall, East wall, Back North wall
      box(plazaStatic, [0.30, FL_H, KD], [-hw + 0.15, fy + FL_H * 0.5, 0], wallM);
      addOBB(KCX - hw + 0.15, KCZ, 0.30, KD, 0, fTop, fy - 0.2);
      box(plazaStatic, [0.30, FL_H, KD], [hw - 0.15, fy + FL_H * 0.5, 0], wallM);
      addOBB(KCX + hw - 0.15, KCZ, 0.30, KD, 0, fTop, fy - 0.2);
      box(plazaStatic, [KW, FL_H, 0.30], [0, fy + FL_H * 0.5, -hd + 0.15], wallM);
      addOBB(KCX, KCZ - hd + 0.15, KW, 0.30, 0, fTop, fy - 0.2);

      // Front South Facade Wall (Panoramic Glass Curtain Wall on 2nd/3rd/4th floors; Wide Open Lobby Entrance on GF!)
      if (fl === 0) {
        // Open entrance at lx ∈ [4.2 .. 8.2] leading directly to the Grand Staircase & Lobby!
        box(plazaStatic, [12.8, 0.95, 0.28], [-2.4, fy + 0.475, hd - 0.14], modernSlate);
        addOBB(KCX - 2.4, KCZ + hd - 0.14, 12.8, 0.28, 0, fTop, fy - 0.2);
        box(plazaStatic, [12.6, FL_H - 1.15, 0.10], [-2.4, fy + 0.95 + (FL_H - 1.15) * 0.5, hd - 0.12], glassMat, { castShadow: false });
        // Doorway header above staircase entrance
        box(plazaStatic, [4.6, 0.75, 0.30], [6.5, fy + FL_H - 0.375, hd - 0.14], maroonWall);
        addSignBox(plazaDyn, {
          title: '↑ কাচ্চি ভাই · ৩য় ও ৪র্থ তলা',
          subtitle: 'সিঁড়ি দিয়ে উপরে উঠুন · SHIMLA PLAZA',
          bg: '#7f1d1d', accent: '#fde047', width: 512,
        }, [6.4, fy + 3.05, hd + 0.22], 0, 4.4, 0.85);
      } else {
        // Upper floor panoramic glass overlooking Satrasta More & KDA Avenue (solid collision so player doesn't fall out!)
        box(plazaStatic, [KW, 0.72, 0.24], [0, fy + 0.36, hd - 0.12], isKacchiFloor ? maroonWall : modernSlate);
        box(plazaStatic, [KW - 0.4, FL_H - 0.92, 0.10], [0, fy + 0.72 + (FL_H - 0.92) * 0.5, hd - 0.12], isKacchiFloor ? glassMat : glassTintBlue, { castShadow: false });
        // Vertical gold/dark glass mullions
        for (let mx = -hw + 2.2; mx <= hw - 2.0; mx += 2.6) {
          box(plazaStatic, [0.12, FL_H, 0.16], [mx, fy + FL_H * 0.5, hd - 0.10], isKacchiFloor ? brassMat : steelDark);
        }
        addOBB(KCX, KCZ + hd - 0.12, KW, 0.28, 0, fTop, fy - 0.2);
      }

      // Staircase Flight climbing from fl -> fl + 1 (for fl = 0, 1, 2: GF->2nd, 2nd->3rd, 3rd->4th!)
      if (fl < 3) {
        const zStart = 2.0;  // Bottom of flight (South landing)
        const zEnd = -3.7;   // Top of flight (North landing)
        const steps = 14;
        const stepDepth = Math.abs(zStart - zEnd) / steps;
        const stepRise = FL_H / steps;
        for (let s = 0; s < steps; s++) {
          const sy = fy + (s + 0.5) * stepRise;
          const sz = zStart - (s + 0.5) * stepDepth;
          box(plazaStatic, [2.75, stepRise + 0.06, stepDepth + 0.04], [STAIR_X0 + 1.48, sy, sz], luxuryMarbleMat);
        }
        // Stainless steel handrail along inner stair edge
        rodBetween(plazaStatic, [STAIR_X0 + 0.10, fy + 0.95, zStart], [STAIR_X0 + 0.10, fTop + 0.95, zEnd], 0.04, brassMat, 6);
        // Register continuous walkable stair ramp (lx ∈ [STAIR_X0 .. hw-0.2], lz ∈ [zEnd .. zStart])
        stairRamps.push({
          xMin: KCX + STAIR_X0 - 0.1,
          xMax: KCX + hw - 0.15,
          zStart: KCZ + zStart,
          zEnd: KCZ + zEnd,
          yStart: fy,
          yEnd: fTop,
        });
      }

      // Interior Partition separating Stairwell from Main Hall (with wide open doorway on 3rd & 4th floor Kacchi Bhai!)
      if (isKacchiFloor) {
        // Leave wide 3.0m open entry arch at lz ∈ [2.2 .. 5.2] from South Landing into Kacchi Bhai Dining Hall!
        box(plazaStatic, [0.22, FL_H, 8.4], [STAIR_X0, fy + FL_H * 0.5, -2.0], maroonWall);
        addOBB(KCX + STAIR_X0, KCZ - 2.0, 0.22, 8.4, 0, fTop, fy - 0.2);
      }

      // Register zone label per floor
      shopZones.push({
        cx: KCX, cz: KCZ, hx: hw, hz: hd, cos: 1, sin: 0,
        minY: fy - 0.3, maxY: fTop - 0.1,
        label: fl === 3 ? 'KACCHI BHAI · ৪র্থ তলা VIP ডাইনিং (SHIMLA PLAZA)'
          : fl === 2 ? 'KACCHI BHAI · ৩য় তলা মেইন ডাইনিং (SHIMLA PLAZA)'
            : fl === 1 ? 'SHIMLA PLAZA · ২য় তলা সিঁড়ি (↑ কাচ্চি ভাই)'
              : 'SHIMLA PLAZA · গ্রাউন্ড লবি (↑ ৩য়-৪র্থ তলায় কাচ্চি ভাই)',
      });
    }

    // 5th Floor Crown Roof Slab & Architectural Parapet
    const roofY = floorYs[4];
    box(plazaStatic, [KW + 0.6, 0.34, KD + 0.6], [0, roofY, 0], creamWall);
    box(plazaStatic, [KW + 0.6, 1.15, 0.30], [0, roofY + 0.65, hd + 0.15], maroonWall);
    box(plazaStatic, [KW + 0.6, 0.18, 0.40], [0, roofY + 1.25, hd + 0.15], brassMat);

    // MASSIVE GLOWING EXTERIOR SIGNBOARDS ON 3RD & 4TH FLOOR FACADE (Visible from far away!)
    addSignBox(plazaDyn, {
      title: 'কাচ্চি ভাই · KACCHI BHAI (৩য় ও ৪র্থ তলা)',
      subtitle: 'শিমলা প্লাজা · বাসমতি কাচ্চি · বোরহানি · ফিরনি · ১২ কেডিএ এভিনিউ',
      bg: '#7f1d1d', fg: '#ffffff', accent: '#fde047', border: '#eab308', width: 768,
    }, [0, floorYs[3] + 0.15, hd + 0.28], 0, 14.8, 1.65);

    addSignBox(plazaDyn, {
      title: 'SHIMLA PLAZA · শিমলা প্লাজা',
      subtitle: 'শাওয়ার্মা হাউস এক্সপ্রেস · বেকারি ও শপিং মল (নিচতলা)',
      bg: '#1e293b', fg: '#ffffff', accent: '#38bdf8', width: 640,
    }, [-2.2, floorYs[1] - 0.15, hd + 0.26], 0, 11.4, 1.05);

    // HIGH-DETAIL INTERIORS FOR BOTH 3RD FLOOR & 4TH FLOOR KACCHI BHAI!
    const kbIntG = new THREE.Group();
    kbIntG.position.set(KCX, 0, KCZ);
    for (const fl of [2, 3]) {
      const fy = floorYs[fl];
      const fGroup = new THREE.Group();
      fGroup.position.set(0, fy, 0);
      kbIntG.add(fGroup);

      // Royal Mughlai Maroon & Gold Serving Counter + 4 Copper Kacchi Degchis wrapped in Red Salu Cloth!
      box(fGroup, [7.6, 1.04, 0.98], [-2.2, 0.52, -hd + 1.65], maroonWall);
      box(fGroup, [7.7, 0.08, 1.06], [-2.2, 1.06, -hd + 1.65], brassMat);
      for (const dx of [-4.6, -3.0, -1.4, 0.2]) {
        cylinder(fGroup, 0.44, 0.36, 0.54, [dx, 1.35, -hd + 1.65], redClothMat, 12);
        cylinder(fGroup, 0.46, 0.46, 0.08, [dx, 1.64, -hd + 1.65], copperMat, 12);
      }
      // Cash Billing Counter + POS Monitor
      box(fGroup, [2.0, 1.06, 0.80], [3.2, 0.53, -hd + 1.65], darkWoodMat);
      box(fGroup, [0.46, 0.34, 0.06], [3.2, 1.24, -hd + 1.65], steelDark);

      // Illuminated Digital Menu Board
      const kbMenu = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.68), new THREE.MeshStandardMaterial({
        map: makeMenuBoardTexture(fl === 2 ? 'কাচ্চি ভাই · ৩য় তলা স্পেশাল মেনু' : 'কাচ্চি ভাই · ৪র্থ তলা VIP লাউঞ্জ', [
          'বাসমতি মাটন কাচ্চি (১:১) .......... ৪৬০ টাকা',
          'কাচ্চি + চিকেন রোস্ট + বোরহানি ... ৫৯০ টাকা',
          'জালি কাবাব / বিফ চুইঝাল ........... ২৪০ টাকা',
          'বাদাম শরবত / শাহী ফিরনি ........... ৯০ টাকা',
        ], '#450a0a', '#fde047'),
      }));
      kbMenu.position.set(-1.6, 2.38, -hd + 0.34);
      fGroup.add(kbMenu);

      // 6 Luxury 4-Seater Mughlai Dining Booths per Floor (12 Booths total across 3rd & 4th floor!)
      for (const tx of [-5.8, -0.6]) {
        for (const tz of [-1.4, 1.4, 4.1]) {
          addDetailedDiningBooth(fGroup, tx, tz, maroonWall, toWorld, Math.PI, `কাচ্চি ভাই (${fl + 1}য়/৪র্থ তলা) টেবিল`, fy);
        }
      }
      // Warm Crystal Chandeliers + Split ACs + Spinning Fans
      addChandelier(fGroup, -5.6, FL_H - 0.15, 1.2);
      addChandelier(fGroup, -0.6, FL_H - 0.15, 1.2);
      addSplitAC(fGroup, -hw + 0.30, FL_H - 0.65, 0.5, Math.PI * 0.5);
      addSplitAC(fGroup, -hw + 0.30, FL_H - 0.65, 3.8, Math.PI * 0.5);
      addSpinningFan(-5.6, fy + FL_H - 0.16, 3.8, plazaDyn);
      addSpinningFan(-0.6, fy + FL_H - 0.16, 3.8, plazaDyn);
    }
    mergeStaticMeshes(kbIntG);
    root.add(kbIntG);
    interiorGroups.push({ group: kbIntG, cx: KCX, cz: KCZ, maxDistSq: 68 * 68 });
  }

  // ============================================================================
  // 6) SHOP #4 (SOUTH SIDE — OPPOSITE KACCHI GHOR): বিল্লাল ভাইয়ের স্পেশাল চায়ের দোকান!
  //    Redesigned Authentic Khulna Tea House + Right-Hand Entrance পানওয়ালার দোকান
  //    - বিপরীত সাইডে (South KDA Avenue, directly facing North toward Kacchi Ghor)
  //    - সবসময় খোলা (rolled-up shutter, hanging Edison lights, side glowing blade sign)
  //    - সামনেই লাইভ চা কাউন্টার (৩ কেতলি, গরম চায়ের কাপ, কলার ছড়ি, বিস্কুট/বান শোকেস)
  //    - ঢোকার একদম ডান হাতে (+X) শাহী মিষ্টি পানের দোকান ও খালি বসার আসন (কোনো NPC নেই)
  //    - ভিতরে সোজাসুজি বড় বসার হল (৮টি কাঠের ব্যাকরেস্ট আড্ডা বুথ, টিভি, ফ্রিজ ও বেসিন)
  // ============================================================================
  createEnterableShop({
    name: 'বিল্লাল ভাইয়ের স্পেশাল চায়ের দোকান',
    zoneLabel: 'SATRASTA MORE · BILLAL BHAI SPECIAL TEA HOUSE',
    cx: -881.5, cz: -268.2, rotY: Math.PI, w: 8.8, d: 14.8, h: 4.1, upperFloors: 1,
    wallMat: creamWall, accentMat: emeraldWall, awningMat: emeraldWall, floorMat: luxuryMarbleMat,
    doorWidth: 6.8, hasGlassDoor: false,
    signTitle: 'বিল্লাল ভাইয়ের স্পেশাল চায়ের দোকান · সাতরাস্তা',
    signSub: 'খুলনার বিখ্যাত মালাই চা · দুধ চা · মশলা চা · ২৪ ঘণ্টা খোলা · ভিতরে বসার সুব্যবস্থা',
    signBg: '#064e3b', signAccent: '#fde047',
    buildInterior(intG, shopDyn, toWorld, { hw, hd, h }) {
      const shopRotY = Math.PI;
      const steamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.34, roughness: 1.0 });
      const bananaMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.55 });
      const woodPanelMat = new THREE.MeshStandardMaterial({ color: 0x6b3f20, roughness: 0.58 });
      const tileWallMat = new THREE.MeshStandardMaterial({ map: makeTileFloorTexture('#f8fafc', '#e2e8f0', '#94a3b8'), roughness: 0.22 });

      // ------------------------------------------------------------------------
      // 0) AUTHENTIC TEA HOUSE ARCHITECTURAL DETAILING
      //    Rolled-up shutter box (always open!), warm Edison festoon lights, wood wainscoting & blade sign
      // ------------------------------------------------------------------------
      // Rolled-up open steel shutter housing at top of wide entrance
      cylinder(intG, 0.22, 0.22, 6.7, [0, 2.74, hd - 0.22], steelDark, 10);
      // Warm hanging festoon Edison bulbs across the open front entrance
      for (let bx = -3.0; bx <= 3.05; bx += 1.0) {
        cylinder(intG, 0.008, 0.008, 0.32, [bx, 2.66, hd + 0.10], steelDark, 5);
        const eBulb = new THREE.Mesh(new THREE.SphereGeometry(0.068, 8, 6), uplightGold);
        eBulb.position.set(bx, 2.48, hd + 0.10);
        shopDyn.add(eBulb);
      }
      // Side-projecting glowing blade sign visible straight from Satrasta Roundabout!
      addSignBox(shopDyn, {
        title: 'বিল্লাল ভাইয়ের চা',
        subtitle: 'মালাই চা · ২৪ ঘণ্টা',
        bg: '#065f46', fg: '#fde047', accent: '#ffffff', width: 384, height: 160,
      }, [-hw - 0.18, 3.25, hd + 0.55], -Math.PI * 0.5, 1.85, 0.78);

      // Warm wooden wainscoting + vertical timber battens along both interior side walls
      for (const sgn of [-1, 1]) {
        box(intG, [0.06, 1.25, 14.0], [sgn * (hw - 0.31), 0.625, 0], woodPanelMat);
        box(intG, [0.09, 0.07, 14.0], [sgn * (hw - 0.32), 1.26, 0], brassMat);
        for (let bz = -6.2; bz <= 6.2; bz += 1.55) {
          box(intG, [0.08, h - 0.35, 0.12], [sgn * (hw - 0.32), h * 0.5, bz], darkWoodMat);
        }
      }
      // Ceiling wooden acoustic beams
      for (let czB = -5.6; czB <= 5.8; czB += 2.28) {
        box(intG, [8.2, 0.14, 0.18], [0, h - 0.16, czB], darkWoodMat);
      }

      // ------------------------------------------------------------------------
      // A) FRONT ENTRANCE LEFT (-X): LIVE AUTHENTIC TEA BAR (সামনেই সবসময় গরম চা বিক্রি!)
      // ------------------------------------------------------------------------
      const teaZ = hd - 1.95;
      // Clean white tiled backsplash behind tea stove
      box(intG, [0.06, 2.20, 4.4], [-hw + 0.31, 1.15, teaZ - 0.7], tileWallMat);
      // L-Shaped Stainless Steel & Marble-Top Tea Counter
      box(intG, [3.15, 1.02, 1.12], [-hw + 1.85, 0.51, teaZ], emeraldWall);
      box(intG, [3.22, 0.08, 1.18], [-hw + 1.85, 1.04, teaZ], chromeMat);
      box(intG, [3.22, 0.05, 0.05], [-hw + 1.85, 0.96, teaZ + 0.58], uplightGold, { castShadow: false });
      // 3-Burner Glowing Gas Stove + 3 Detailed Steaming Brass/Copper Tea Kettles (with spouts & handles)!
      box(intG, [1.72, 0.14, 0.62], [-hw + 1.38, 1.14, teaZ], steelDark);
      const kettleXs = [-hw + 0.80, -hw + 1.38, -hw + 1.96];
      for (let ki = 0; ki < kettleXs.length; ki++) {
        const kx = kettleXs[ki];
        const kMat = ki === 1 ? brassMat : copperMat;
        cylinder(intG, 0.14, 0.16, 0.04, [kx, 1.23, teaZ], emberGlowMat, 10);
        cylinder(intG, 0.15, 0.21, 0.34, [kx, 1.42, teaZ], kMat, 12);
        cylinder(intG, 0.09, 0.11, 0.06, [kx, 1.61, teaZ], chromeMat, 10);
        rodBetween(intG, [kx + 0.14, 1.36, teaZ + 0.05], [kx + 0.26, 1.56, teaZ + 0.10], 0.018, kMat, 6);
        rodBetween(intG, [kx - 0.15, 1.35, teaZ], [kx - 0.22, 1.55, teaZ], 0.014, steelDark, 6);
        const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), steamMat);
        s1.position.set(kx, 1.82, teaZ);
        const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), steamMat);
        s2.position.set(kx + 0.05, 2.02, teaZ - 0.04);
        intG.add(s1, s2);
      }
      // Brass Tray with Ready-to-Serve Hot Malai Tea Porcelain Cups + Saucers right at the front!
      box(intG, [1.02, 0.04, 0.58], [-hw + 2.82, 1.10, teaZ + 0.20], brassMat);
      for (const [cxCup, czCup] of [[-0.32, -0.12], [0.0, -0.12], [0.32, -0.12], [-0.16, 0.14], [0.16, 0.14]]) {
        cylinder(intG, 0.070, 0.055, 0.014, [-hw + 2.82 + cxCup, 1.125, teaZ + 0.20 + czCup], porcelainMat, 10);
        cylinder(intG, 0.046, 0.034, 0.095, [-hw + 2.82 + cxCup, 1.175, teaZ + 0.20 + czCup], porcelainMat, 10);
        cylinder(intG, 0.042, 0.042, 0.015, [-hw + 2.82 + cxCup, 1.222, teaZ + 0.20 + czCup], warmOchre, 10);
      }
      // Pyramid of Condensed Milk Tins + Hanging Iconic Banana Bunch (কলার ছড়ি)!
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3 - row; col++) {
          cylinder(intG, 0.056, 0.056, 0.115, [-hw + 2.55 + col * 0.13 + row * 0.065, 1.14 + row * 0.115, teaZ - 0.30], flowerRed, 8);
        }
      }
      rodBetween(intG, [-hw + 2.95, 2.80, teaZ + 0.45], [-hw + 2.95, 2.18, teaZ + 0.45], 0.016, steelDark, 5);
      for (let bi = 0; bi < 7; bi++) {
        const ba = (bi / 7) * Math.PI * 2;
        const ban = cylinder(intG, 0.028, 0.022, 0.22, [-hw + 2.95 + Math.cos(ba) * 0.08, 2.06, teaZ + 0.45 + Math.sin(ba) * 0.08], bananaMat, 6);
        ban.rotation.z = Math.cos(ba) * 0.45;
        ban.rotation.x = Math.sin(ba) * 0.45;
      }
      // Double-Tier Glass Biscuit, Butter-Bun & Cake Display Cabinet behind tea bar
      box(intG, [0.72, 1.85, 2.35], [-hw + 0.56, 0.925, teaZ - 1.90], chromeMat);
      box(intG, [0.64, 0.98, 2.25], [-hw + 0.58, 1.42, teaZ - 1.90], glassMat, { castShadow: false });
      const jarCols = [flowerGold, warmOchre, flowerRed, panGreenMat, flowerPink, brassMat];
      for (let i = 0; i < 6; i++) {
        cylinder(intG, 0.092, 0.092, 0.22, [-hw + 0.56, 1.18, teaZ - 2.82 + i * 0.36], jarCols[i % jarCols.length], 8);
        cylinder(intG, 0.084, 0.084, 0.20, [-hw + 0.56, 1.56, teaZ - 2.82 + i * 0.36], jarCols[(i + 2) % jarCols.length], 8);
      }

      // ------------------------------------------------------------------------
      // B) FRONT ENTRANCE RIGHT HAND (+X): শাহী মিষ্টি পান স্টল (খালি বসার আসন, কোনো NPC নেই!)
      // ------------------------------------------------------------------------
      const panX = hw - 1.18;
      const panZ = hd - 1.15;
      box(intG, [1.68, 0.98, 1.32], [panX, 0.49, panZ], woodPanelMat);
      box(intG, [1.74, 0.07, 1.38], [panX, 1.01, panZ], chromeMat);
      box(intG, [1.60, 0.78, 0.96], [panX, 1.43, panZ + 0.14], glassMat, { castShadow: false });
      for (let bx = -0.50; bx <= 0.52; bx += 0.34) {
        cylinder(intG, 0.115, 0.135, 0.22, [panX + bx, 1.14, panZ + 0.24], panGreenMat, 8);
      }
      const spiceCols = [flowerRed, flowerGold, brassMat, porcelainMat, copperMat, flowerPink];
      for (let i = 0; i < 6; i++) {
        cylinder(intG, 0.068, 0.068, 0.19, [panX - 0.54 + i * 0.215, 1.54, panZ - 0.08], spiceCols[i % spiceCols.length], 8);
      }
      box(intG, [0.06, 1.95, 1.45], [hw - 0.32, 1.48, panZ], redClothMat, { castShadow: false });
      box(intG, [0.08, 0.07, 1.45], [hw - 0.33, 2.46, panZ], brassMat);
      const panBulb = new THREE.Mesh(new THREE.SphereGeometry(0.072, 8, 6), uplightGold);
      panBulb.position.set(panX, 2.34, panZ);
      shopDyn.add(panBulb);
      box(intG, [0.60, 0.46, 0.60], [panX + 0.05, 0.23, panZ - 1.05], darkWoodMat);
      box(intG, [0.56, 0.08, 0.56], [panX + 0.05, 0.50, panZ - 1.05], redClothMat);
      const swPan = toWorld(panX + 0.05, panZ - 1.05);
      seats.push({ seatX: swPan.x, seatZ: swPan.z, seatY: 0.54, yaw: shopRotY, fy: 0.18, label: 'পানওয়ালার খালি আসন' });
      addSignBox(shopDyn, {
        title: 'শাহী মিষ্টি পান',
        subtitle: 'বিল্লাল ভাই কর্নার · পান স্টল',
        bg: '#14532d', fg: '#ffffff', accent: '#fde047', width: 512, height: 180,
      }, [panX, 2.58, panZ + 0.68], 0, 1.80, 0.58);

      // ------------------------------------------------------------------------
      // C) DEEP STRAIGHT-IN COZY SEATING HALL (৮টি ব্যাকরেস্ট কাঠের আড্ডা বুথ!)
      //    Wide central walkway (lx ∈ [-1.2 .. +1.2]) all the way to the back!
      // ------------------------------------------------------------------------
      for (const tz of [2.5, 0.0, -2.5, -5.0]) {
        for (const sgn of [-1, 1]) {
          const tx = sgn * 2.65;
          box(intG, [1.75, 0.07, 0.88], [tx, 0.74, tz], woodPanelMat);
          box(intG, [1.78, 0.025, 0.90], [tx, 0.70, tz], brassMat);
          box(intG, [0.10, 0.72, 0.54], [tx, 0.36, tz], steelDark);
          box(intG, [0.64, 0.04, 0.64], [tx, 0.02, tz], steelDark);
          cylinder(intG, 0.045, 0.035, 0.09, [tx - 0.42, 0.82, tz - 0.16], porcelainMat, 10);
          cylinder(intG, 0.045, 0.035, 0.09, [tx + 0.40, 0.82, tz + 0.16], porcelainMat, 10);
          cylinder(intG, 0.055, 0.055, 0.11, [tx, 0.83, tz - 0.18], brassMat, 8);
          box(intG, [0.18, 0.07, 0.10], [tx, 0.81, tz + 0.14], emeraldWall);
          for (const szOff of [-0.72, 0.72]) {
            box(intG, [1.72, 0.42, 0.40], [tx, 0.21, tz + szOff], darkWoodMat);
            box(intG, [1.68, 0.06, 0.38], [tx, 0.45, tz + szOff], emeraldWall);
            box(intG, [1.72, 0.46, 0.09], [tx, 0.68, tz + szOff + Math.sign(szOff) * 0.17], woodPanelMat);
          }
          const sw = toWorld(tx, tz + 0.70);
          seats.push({ seatX: sw.x, seatZ: sw.z, seatY: 0.48, yaw: shopRotY + Math.PI, fy: 0.18, label: 'বিল্লাল ভাইয়ের চায়ের আড্ডা বুথ' });
        }
      }

      // Stocked Cold-Drinks Glass Fridge (ফ্রিজ) with Bottles Inside + Porcelain Hand-Wash Basin & Reflective Mirror
      box(intG, [0.85, 2.05, 0.92], [hw - 0.72, 1.025, 4.35], acWhiteMat);
      box(intG, [0.88, 1.45, 0.78], [hw - 0.74, 1.18, 4.35], glassMat, { castShadow: false });
      const sodaCols = [flowerRed, panGreenMat, flowerGold, porcelainMat];
      for (let sh = 0; sh < 3; sh++) {
        const sy = 0.68 + sh * 0.40;
        for (let bi = 0; bi < 3; bi++) {
          cylinder(intG, 0.046, 0.046, 0.22, [hw - 0.72, sy, 4.10 + bi * 0.24], sodaCols[(bi + sh) % sodaCols.length], 8);
        }
      }
      box(intG, [1.25, 0.86, 0.58], [hw - 1.10, 0.43, -hd + 0.65], porcelainMat);
      cylinder(intG, 0.18, 0.14, 0.10, [hw - 1.10, 0.88, -hd + 0.65], porcelainMat, 12);
      cylinder(intG, 0.018, 0.018, 0.16, [hw - 1.10, 0.96, -hd + 0.44], chromeMat, 8);
      rodBetween(intG, [hw - 1.10, 1.02, -hd + 0.44], [hw - 1.10, 0.99, -hd + 0.58], 0.014, chromeMat, 8);
      box(intG, [1.14, 0.90, 0.05], [hw - 1.10, 1.56, -hd + 0.34], brassMat);
      box(intG, [1.04, 0.80, 0.06], [hw - 1.10, 1.56, -hd + 0.35], mirrorSurfaceMat);

      // Framed Wall Art on Side Walls
      box(intG, [0.05, 0.82, 1.24], [-hw + 0.32, 2.02, -1.25], brassMat);
      box(intG, [0.06, 0.72, 1.14], [-hw + 0.33, 2.02, -1.25], wallArtMat);
      box(intG, [0.05, 0.82, 1.24], [hw - 0.32, 2.02, -1.25], brassMat);
      box(intG, [0.06, 0.72, 1.14], [hw - 0.33, 2.02, -1.25], wallArtMat);

      // Back Wall: 55-inch 4K Live Smart TV (matching Taltola House!) + Media Shelf + High-Res Menu Board
      box(intG, [2.10, 1.22, 0.09], [-0.4, 2.82, -hd + 0.34], steelDark);
      const tvPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.94, 1.08), tvScreenMat);
      tvPlane.position.set(-0.4, 2.82, -hd + 0.40);
      intG.add(tvPlane);
      box(intG, [1.50, 0.07, 0.28], [-0.4, 2.15, -hd + 0.44], darkWoodMat);
      const menu = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 1.52), new THREE.MeshStandardMaterial({
        map: makeMenuBoardTexture('বিল্লাল ভাইয়ের স্পেশাল চা · সাতরাস্তা', [
          '১. স্পেশাল মালাই চা ............ ২৫ টাকা',
          '২. গরম দুধ-এলাচ চা ............. ১৫ টাকা',
          '৩. আদা-লেবু মশলা চা ........... ১৫ টাকা',
          '৪. বাটার বান · বিস্কুট · কেক .... ৪০ টাকা',
        ], '#064e3b', '#fde047'),
      }));
      menu.position.set(-0.4, 1.32, -hd + 0.34);
      intG.add(menu);

      // Warm Overhead Pendant Lights & 3 Spinning Ceiling Fans down the hall
      for (const lz of [4.2, 0.0, -4.2]) {
        box(intG, [2.1, 0.06, 0.18], [0, h - 0.28, lz], lampGlow, { castShadow: false });
        addSpinningFan(0, h - 0.20, lz, shopDyn);
      }
    },
  });

  // ============================================================================
  // 7) SHOP #5: সাতরাস্তা কাবাব ও শর্মা হাউস (Enterable Live Grill — SW Corner!)
  // ============================================================================
  createEnterableShop({
    name: 'সাতরাস্তা কাবাব ও শর্মা হাউস',
    zoneLabel: 'SATRASTA MORE · KABAB & SHAWARMA HOUSE',
    cx: -942.0, cz: -272.5, rotY: Math.PI - 0.22, w: 13.0, d: 9.6, h: 4.0, upperFloors: 2,
    wallMat: creamWall, accentMat: redClothMat, awningMat: redClothMat, floorMat: tileFloorMat,
    doorWidth: 4.0, hasGlassDoor: false,
    signTitle: 'সাতরাস্তা কাবাব ও শর্মা হাউস',
    signSub: 'শিক কাবাব · বটি কাবাব · নান রুটি · গ্রিল চিকেন · লাইভ কয়লার চুলা',
    signBg: '#991b1b', signAccent: '#fde047',
    buildInterior(intG, shopDyn, toWorld, { hd, h }) {
      // Live Charcoal Kabab Grill Pit with Glowing Embers & Skewers
      box(intG, [3.8, 0.96, 0.96], [-2.4, 0.48, hd - 1.55], steelDark);
      box(intG, [3.5, 0.08, 0.70], [-2.4, 0.98, hd - 1.55], emberGlowMat, { castShadow: false });
      for (let kx = -3.8; kx <= -1.0; kx += 0.34) {
        rodBetween(intG, [kx, 1.08, hd - 1.98], [kx, 1.08, hd - 1.12], 0.014, chromeMat, 5);
        cylinder(intG, 0.048, 0.048, 0.46, [kx, 1.08, hd - 1.55], meatSkewMat, 6);
      }
      box(intG, [4.0, 0.52, 1.10], [-2.4, 2.42, hd - 1.55], chromeMat);
      // Rotating Shawarma Meat Cone + Clay Tandoor Oven
      cylinder(intG, 0.22, 0.14, 0.78, [0.6, 1.48, hd - 1.55], meatSkewMat, 10);
      cylinder(intG, 0.03, 0.03, 1.10, [0.6, 1.48, hd - 1.55], chromeMat, 6);
      cylinder(intG, 0.58, 0.64, 0.98, [3.0, 0.49, -hd + 1.40], copperMat, 12);
      cylinder(intG, 0.34, 0.34, 0.06, [3.0, 1.00, -hd + 1.40], emberGlowMat, 10);

      for (const tx of [-3.4, 2.8]) {
        for (const tz of [-1.8, 1.0]) {
          addDetailedDiningBooth(intG, tx, tz, redClothMat, toWorld, -0.22, 'কাবাব হাউস ডাইনিং টেবিল', 0.18);
        }
      }
      addChandelier(intG, 0, h - 0.15, -0.5);
      addSpinningFan(-2.6, h - 0.18, -0.4, shopDyn);
      addSpinningFan(2.6, h - 0.18, -0.4, shopDyn);
    },
  });

  // ============================================================================
  // 8) SHOP #6: সাতরাস্তা বেকারি ও মিষ্টি পান কর্নার (Adjacent South Shop beside Billal Bhai!)
  // ============================================================================
  createEnterableShop({
    name: 'সাতরাস্তা বেকারি ও মিষ্টি পান কর্নার',
    zoneLabel: 'SATRASTA MORE · BAKERY & MISTI PAN CORNER',
    cx: -867.5, cz: -269.5, rotY: Math.PI, w: 11.4, d: 9.2, h: 3.8, upperFloors: 2,
    wallMat: creamWall, accentMat: warmOchre, awningMat: maroonWall, floorMat: tileFloorMat,
    doorWidth: 4.2, hasGlassDoor: false,
    signTitle: 'সাতরাস্তা বেকারি ও মিষ্টি পান কর্নার',
    signSub: 'তাজা পাউরুটি · পেস্ট্রি · শাহী মিষ্টি পান · ফালুদা ও লাচ্ছি',
    signBg: '#78350f', signAccent: '#fde047',
    buildInterior(intG, shopDyn, toWorld, { hd, h }) {
      box(intG, [6.4, 1.02, 0.92], [0, 0.51, -hd + 1.65], chromeMat);
      box(intG, [6.2, 0.78, 0.84], [0, 1.40, -hd + 1.65], glassMat, { castShadow: false });
      const cakeCols = [warmOchre, flowerGold, flowerPink, creamWall, flowerRed, panGreenMat];
      for (let i = 0; i < 8; i++) {
        cylinder(intG, 0.15, 0.16, 0.18, [-2.4 + i * 0.68, 1.18, -hd + 1.60], cakeCols[i % cakeCols.length], 10);
      }
      box(intG, [2.0, 0.06, 0.16], [0, h - 0.28, 0], lampGlow, { castShadow: false });
      addSpinningFan(-1.8, h - 0.18, 0.2, shopDyn);
      addSpinningFan(1.8, h - 0.18, 0.2, shopDyn);
    },
  });

  // ============================================================================
  // 9) CONNECTING HIGH-DETAIL COMMERCIAL BLOCKS (BRIDGING SATRASTA <-> ROYAL MORE)
  // ============================================================================
  const fillerBlocks = [
    { cx: -841.0, cz: -307.5, rotY: 0.04, w: 22.0, d: 11.4, h: 16.5, wall: creamWall, accent: maroonWall, title: 'কিং শর্মা ও রেস্তোরাঁ · সাতরাস্তা প্লাজা', sub: 'KING SHAWARMA & RESTAURANT · KDA AVENUE', bg: '#7c2d12' },
    { cx: -841.5, cz: -266.5, rotY: Math.PI - 0.06, w: 18.0, d: 11.4, h: 15.0, wall: warmOchre, accent: emeraldWall, title: 'সাতরাস্তা ফার্মেসি এন্ড ডায়াগনস্টিক', sub: '24/7 MEDICINE & HEALTHCARE · KDA AVENUE', bg: '#065f46' },
    { cx: -945.0, cz: -312.5, rotY: 0.38, w: 18.5, d: 11.4, h: 17.0, wall: creamWall, accent: modernSlate, title: 'সাতরাস্তা সুপার মার্কেট · টেলিকম ও ফ্যাশন', sub: 'SATRASTA MORE NW · SHIBBARI LINK', bg: '#1e3a8a' },
    { cx: -980.0, cz: -308.5, rotY: 0.0, w: 22.0, d: 11.0, h: 15.5, wall: warmOchre, accent: maroonWall, title: 'খুলনা ফুড কোর্ট ও বেকারি · কেডিএ এভিনিউ', sub: 'KDA AVENUE WEST · TOWARD MOYLAPOTA', bg: '#78350f' },
    { cx: -980.0, cz: -275.5, rotY: Math.PI, w: 22.0, d: 11.0, h: 15.0, wall: creamWall, accent: emeraldWall, title: 'সোনালী ব্যাংক বুথ · ইলেকট্রনিক্স ও বুকস', sub: 'KDA AVENUE SOUTH · SATRASTA MORE', bg: '#0f3d2e' },
  ];
  for (const b of fillerBlocks) {
    addOBB(b.cx, b.cz, b.w, b.d, b.rotY, b.h + 2);
    const bg = new THREE.Group();
    bg.position.set(b.cx, 0, b.cz);
    bg.rotation.y = b.rotY;
    staticG.add(bg);
    box(bg, [b.w, b.h, b.d], [0, b.h * 0.5, 0], b.wall);
    box(bg, [b.w + 0.44, 0.90, b.d + 0.44], [0, b.h + 0.44, 0], b.accent);
    for (let fy = 4.0; fy < b.h - 1.5; fy += 3.2) {
      box(bg, [b.w + 0.38, 0.22, b.d + 0.38], [0, fy, 0], creamWall);
      for (let wx = -b.w * 0.38; wx <= b.w * 0.39; wx += 3.6) {
        const wy = fy + 1.52;
        const fz = b.d * 0.5;
        box(bg, [2.24, 1.60, 0.08], [wx, wy, fz + 0.04], glassTintBlue, { castShadow: false });
        box(bg, [2.36, 0.07, 0.14], [wx, wy - 0.81, fz + 0.06], aluminumMat);
        box(bg, [2.36, 0.07, 0.14], [wx, wy + 0.81, fz + 0.06], aluminumMat);
        box(bg, [0.06, 1.64, 0.14], [wx, wy, fz + 0.06], aluminumMat);
        box(bg, [2.52, 0.10, 0.42], [wx, wy + 0.92, fz + 0.20], creamWall);
        box(bg, [2.42, 0.12, 0.26], [wx, wy - 0.88, fz + 0.12], b.accent);
      }
    }
    const cosR = Math.cos(b.rotY);
    const sinR = Math.sin(b.rotY);
    const sx = b.cx + (b.d * 0.5 + 0.26) * sinR;
    const sz = b.cz + (b.d * 0.5 + 0.26) * cosR;
    addSignBox(dynamicG, { title: b.title, subtitle: b.sub, bg: b.bg, accent: '#fde047', width: 640 }, [sx, 3.70, sz], b.rotY, Math.min(b.w - 1.2, 11.2), 1.16);
  }

  // KMP Traffic Police Box + Utility Poles + Parked CNG & Easybike Stand
  addCircle(CX + 13.5, CZ - 11.5, 1.65, 3.4);
  cylinder(staticG, 1.48, 1.58, 0.28, [CX + 13.5, 0.14, CZ - 11.5], graniteMat, 8);
  cylinder(staticG, 1.24, 1.28, 1.05, [CX + 13.5, 0.78, CZ - 11.5], creamWall, 8);
  cylinder(staticG, 1.14, 1.14, 1.12, [CX + 13.5, 1.86, CZ - 11.5], glassMat, 8);
  cylinder(staticG, 1.78, 1.85, 0.22, [CX + 13.5, 2.52, CZ - 11.5], emeraldWall, 8);

  const poles = [
    [CX + 17, CZ - 10.5, 0.2],
    [CX + 50, CZ - 10.5, 0.0],
    [CX + 17, CZ + 11.0, -0.2],
    [CX + 50, CZ + 11.0, 0.0],
    [CX - 18, CZ - 10.5, 0.0],
    [CX - 18, CZ + 10.5, 0.0],
  ];
  for (let i = 0; i < poles.length; i++) {
    const [px, pz, pyaw] = poles[i];
    cylinder(staticG, 0.10, 0.15, 8.6, [px, 4.3, pz], footpathMat, 8);
    addCircle(px, pz, 0.22, 8.6);
    decorateCorridorPole(dynamicG, px, pz, pyaw, 1400 + i);
  }

  const vBank = {
    tire: steelDark, rim: chromeMat, darkTrim: steelDark, chrome: chromeMat,
    windshield: glassMat, headlight: lampGlow, taillight: flowerRed, amber: flowerGold,
    cngGreen: emeraldWall, cngYellow: roadLineYellow, cngRexine: steelDark,
    easyTeal: glassMat, easyCrimson: redClothMat, easyRoof: creamWall, plate: roadLineYellow,
  };
  const cng = buildCNGAuto(vBank);
  cng.position.set(CX - 16.5, 0.05, CZ + 14.5);
  cng.rotation.y = 0.65;
  staticG.add(cng);
  addOBB(CX - 16.5, CZ + 14.5, 1.5, 2.8, 0.65, 1.8);

  const easy = buildEasybike(vBank, false);
  easy.position.set(CX + 26.0, 0.05, CZ + 10.2);
  easy.rotation.y = 1.57;
  staticG.add(easy);
  addOBB(CX + 26.0, CZ + 10.2, 1.4, 2.7, 1.57, 1.8);

  mergeStaticMeshes(staticG);

  // ============================================================================
  // 10) RUNTIME API (MULTI-FLOOR STAIRS, COLLISIONS, DOORS, SEATS, ZONE, 60 FPS)
  // ============================================================================
  const maxDistSq = 370 * 370;

  function inBounds(pos) {
    if (!pos) return false;
    const dx = pos.x - CX;
    const dz = pos.z - CZ;
    return dx * dx + dz * dz <= 170 * 170;
  }

  function getGroundHeight(pos) {
    if (!inBounds(pos)) return 0.0;
    const footY = (pos.y ?? 1.68) - 1.68;
    const maxStepUp = 0.68;
    let bestY = 0.0;

    // 1) Check walkable multi-floor slabs (including Shimla Plaza 2nd/3rd/4th floor Kacchi Bhai!)
    for (let i = 0; i < walkableSlabs.length; i++) {
      const s = walkableSlabs[i];
      if (s.topY > footY + maxStepUp) continue;
      const dx = pos.x - s.cx;
      const dz = pos.z - s.cz;
      const lx = dx * s.cos - dz * s.sin;
      const lz = dx * s.sin + dz * s.cos;
      if (Math.abs(lx) <= s.hx + 0.14 && Math.abs(lz) <= s.hz + 0.14) {
        if (s.topY > bestY) bestY = s.topY;
      }
    }

    // 2) Check walkable Shimla Plaza marble staircase flights (GF -> 2nd -> 3rd -> 4th Floor Kacchi Bhai)
    for (let i = 0; i < stairRamps.length; i++) {
      const r = stairRamps[i];
      if (pos.x >= r.xMin && pos.x <= r.xMax) {
        const zLo = Math.min(r.zStart, r.zEnd) - 0.15;
        const zHi = Math.max(r.zStart, r.zEnd) + 0.15;
        if (pos.z >= zLo && pos.z <= zHi) {
          const t = THREE.MathUtils.clamp((pos.z - r.zStart) / (r.zEnd - r.zStart), 0, 1);
          const rampY = r.yStart + t * (r.yEnd - r.yStart);
          if (rampY <= footY + maxStepUp && rampY > bestY) {
            bestY = rampY;
          }
        }
      }
    }
    return bestY;
  }

  function applyCollisions(pos, radius = 0.34, footY = 0) {
    if (!inBounds(pos)) return;
    for (let i = 0; i < circles.length; i++) {
      const c = circles[i];
      if (footY < c.minH || footY >= c.maxH) continue;
      const dx = pos.x - c.x;
      const dz = pos.z - c.z;
      const minD = c.r + radius;
      const dSq = dx * dx + dz * dz;
      if (dSq < minD * minD) {
        const d = Math.sqrt(Math.max(dSq, 1e-8));
        pos.x += (dx / d) * (minD - d);
        pos.z += (dz / d) * (minD - d);
      }
    }
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < obbs.length; i++) {
        const b = obbs[i];
        if (footY < b.minH || footY >= b.maxH) continue;
        const dx = pos.x - b.cx;
        const dz = pos.z - b.cz;
        const maxE = b.hx + b.hz + radius + 0.5;
        if (Math.abs(dx) > maxE || Math.abs(dz) > maxE) continue;
        let lx = dx * b.cos - dz * b.sin;
        let lz = dx * b.sin + dz * b.cos;
        const clx = THREE.MathUtils.clamp(lx, -b.hx, b.hx);
        const clz = THREE.MathUtils.clamp(lz, -b.hz, b.hz);
        const rx = lx - clx;
        const rz = lz - clz;
        const dSq = rx * rx + rz * rz;
        if (dSq < radius * radius) {
          if (dSq > 1e-8) {
            const d = Math.sqrt(dSq);
            lx += (rx / d) * (radius - d);
            lz += (rz / d) * (radius - d);
          } else {
            const px = b.hx - Math.abs(lx);
            const pz = b.hz - Math.abs(lz);
            if (px < pz) lx = lx >= 0 ? (b.hx + radius) : -(b.hx + radius);
            else lz = lz >= 0 ? (b.hz + radius) : -(b.hz + radius);
          }
          pos.x = b.cx + lx * b.cos + lz * b.sin;
          pos.z = b.cz - lx * b.sin + lz * b.cos;
        }
      }
    }
  }

  function findNearestDoor(pos) {
    if (!inBounds(pos)) return null;
    if ((pos.y - 1.68) > 2.2) return null;
    let best = null;
    let bestD = 3.2;
    for (const d of interactiveDoors) {
      const dist = Math.hypot(pos.x - d.x, pos.z - d.z);
      if (dist < bestD) { bestD = dist; best = d; }
    }
    return best;
  }

  function findNearestSeat(pos) {
    if (!inBounds(pos)) return null;
    const footY = pos.y - 1.68;
    let best = null;
    let bestD = 1.65;
    for (const s of seats) {
      if (Math.abs(footY - s.fy) > 1.35) continue;
      const d = Math.hypot(pos.x - s.seatX, pos.z - s.seatZ);
      if (d < bestD) { bestD = d; best = { ...s, dist: d }; }
    }
    return best;
  }

  function getZoneName(x, z, footY = 0) {
    const dxC = x - CX;
    const dzC = z - CZ;
    if (dxC * dxC + dzC * dzC > 135 * 135) return null;
    for (const sz of shopZones) {
      if (footY < sz.minY || footY > sz.maxY) continue;
      const dx = x - sz.cx;
      const dz = z - sz.cz;
      const lx = dx * sz.cos - dz * sz.sin;
      const lz = dx * sz.sin + dz * sz.cos;
      if (Math.abs(lx) <= sz.hx && Math.abs(lz) <= sz.hz) return sz.label;
    }
    return 'SATRASTA MORE · KDA AVENUE (KHULNA)';
  }

  function syncVisibility(playerPos) {
    if (!playerPos) return;
    const dx = playerPos.x - CX;
    const dz = playerPos.z - CZ;
    const want = dx * dx + dz * dz <= maxDistSq;
    if (root.visible !== want) root.visible = want;
  }

  return {
    root,
    getGroundHeight,
    applyCollisions,
    getPrompt(pos) {
      const d = findNearestDoor(pos);
      if (!d) return null;
      return d.open ? `[E] ${d.label} দরজা বন্ধ করুন` : `[E] ${d.label} দরজা খুলুন`;
    },
    interact(pos) {
      const d = findNearestDoor(pos);
      if (!d) return false;
      d.open = !d.open;
      return true;
    },
    findNearestSeat,
    getZoneName,
    setNightFactor(nf = 0) {
      const n = THREE.MathUtils.clamp(nf, 0, 1);
      for (const item of emissiveList) {
        item.mat.emissiveIntensity = item.day + (item.night - item.day) * n;
      }
    },
    syncVisibility,
    update(time, playerPos = null, delta = 0.016) {
      if (playerPos) syncVisibility(playerPos);
      if (!root.visible) return;
      const step = Math.min(1, delta * 6.5);
      for (const d of interactiveDoors) {
        const tgt = d.open ? d.openAngle : 0;
        if (Math.abs(tgt - d.angle) > 0.001) {
          d.angle += (tgt - d.angle) * step;
          d.pivot.rotation.y = d.angle;
        }
      }
      if (playerPos) {
        for (const ig of interiorGroups) {
          const dSq = (playerPos.x - ig.cx) ** 2 + (playerPos.z - ig.cz) ** 2;
          const want = dSq <= ig.maxDistSq;
          if (ig.group.visible !== want) ig.group.visible = want;
        }
      }
      const rotD = delta * 5.8;
      for (const fan of animatedFans) fan.rotation.y += rotD;
    },
  };
}
