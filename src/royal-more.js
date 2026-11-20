import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { box, cylinder, rodBetween } from './scene-utils.js';
import { attachDerivedPBRMaps } from './aaa-shaders.js';
import { decorateCorridorPole } from './khulna-street-props.js';
import { buildCNGAuto, buildEasybike } from './khulna-vehicles.js';

/**
 * ROYAL MORE / CHINGRI CHATTAR (খুলনা রয়্যালের মোড় · চিংড়ি চত্বর)
 * Exact real-world OSM roundabout center: (-716.8, -291.8)
 * Intersecting roads:
 *   1) Khan Jahan Ali Road (SE from PTI More / Rupsha)
 *   2) Khan Jahan Ali Road (NW toward Shantidham / Dakbangla)
 *   3) KDA Avenue (West dual carriageway toward Shibbari / Sonadanga)
 *
 * Ultra-Detailed GPU-Batched District featuring:
 *   - Authentic Blender-ported 3-Golda-Prawn Chingri Chattar Fountain with wet chitin PBR,
 *     48 nozzles, stainless railing, brick basin, animated water jets & night uplights
 *   - Full Urban Paved Ground Deck (eliminating empty green field around Royal More)
 *   - Exact OSM Roads + Continuous Raised Tiled Pedestrian Sidewalks (ফুটপাত) & Kerbstones
 *   - Prominent Hotel Castle Salam (হোটেল ক্যাসেল সালাম · G-8 KDA Avenue)
 *   - 10-Story Hotel Royal International (হোটেল রয়েল ইন্টারন্যাশনাল · est. 1986)
 *   - Complete Royal More Bus Counter Strip (Green Line, Sohagh, Hanif, Ena, Eagle, Tungipara)
 *     with waiting benches, glass booths & 2 parked Luxury AC Coaches
 *   - Kacchi Ghor & Prime Bank 24/7 ATM Plaza, Fatima Hospital, Royal Sweets Arcade, KMP Police Box
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
  grad.addColorStop(0, 'rgba(255,255,255,0.18)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.26)');
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
    ctx.strokeStyle = 'rgba(24,18,14,0.22)';
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

function makeFootpathTileTexture(seedVal = 515) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  ctx.fillStyle = '#b9b4aa';
  ctx.fillRect(0, 0, 256, 256);

  // Interlocking KCC pedestrian paving slabs (64x64 concrete tiles with subtle variation)
  for (let gy = 0; gy < 4; gy++) {
    for (let gx = 0; gx < 4; gx++) {
      const shade = 172 + Math.floor(rnd() * 24);
      const warm = (gx + gy) % 2 === 0 ? 6 : -4;
      ctx.fillStyle = `rgb(${shade + warm}, ${shade + warm - 3}, ${shade - 8})`;
      ctx.fillRect(gx * 64 + 2, gy * 64 + 2, 60, 60);
      // Inner bevel groove
      ctx.strokeStyle = 'rgba(55,52,48,0.34)';
      ctx.lineWidth = 2;
      ctx.strokeRect(gx * 64 + 1, gy * 64 + 1, 62, 62);
      // Subtle tactile dots / micro grit
      for (let d = 0; d < 18; d++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(30,28,25,0.09)';
        ctx.fillRect(gx * 64 + 4 + rnd() * 54, gy * 64 + 4 + rnd() * 54, 2, 2);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function makeUrbanGroundTexture(seedVal = 619) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  ctx.fillStyle = '#8b8881';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3200; i++) {
    const v = 115 + Math.floor(rnd() * 44);
    ctx.fillStyle = `rgba(${v},${v - 2},${v - 6},0.28)`;
    ctx.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 5, 2 + rnd() * 5);
  }
  ctx.strokeStyle = 'rgba(42,40,38,0.18)';
  ctx.lineWidth = 2;
  for (let p = 0; p < 256; p += 64) {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, 256);
    ctx.moveTo(0, p);
    ctx.lineTo(256, p);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(36, 34);
  tex.anisotropy = 4;
  return tex;
}

function makeChitinBumpTexture(seedVal = 777) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);
  // Fine horizontal chitin ridges + glossy organic micro-pores
  for (let y = 0; y < 256; y += 8) {
    const g = ctx.createLinearGradient(0, y, 0, y + 8);
    g.addColorStop(0, '#9e9e9e');
    g.addColorStop(0.5, '#727272');
    g.addColorStop(1, '#585858');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, 256, 8);
  }
  for (let i = 0; i < 900; i++) {
    const v = 90 + Math.floor(rnd() * 85);
    ctx.fillStyle = `rgba(${v},${v},${v},0.22)`;
    ctx.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 3, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
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
    ctx.fillStyle = '#0b2942';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(14, 16, 228, 22);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(20, 56, 216, 134);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(32, 70, 88, 56);
    ctx.fillRect(136, 70, 88, 56);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AC TICKET COUNTER', 128, 168);
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

  const footpathTex = makeFootpathTileTexture(515);
  const footpathMat = new THREE.MeshStandardMaterial({ map: footpathTex, roughness: 0.84, metalness: 0.03 });
  attachDerivedPBRMaps(footpathMat, footpathTex, { strength: 2.0, roughBase: 0.84, normalScale: 0.55 });

  const urbanGroundTex = makeUrbanGroundTexture(619);
  const urbanGroundMat = new THREE.MeshStandardMaterial({ map: urbanGroundTex, roughness: 0.90, metalness: 0.02 });

  const chitinBump = makeChitinBumpTexture(777);

  const dispAtmTex = makeShopfrontGlassTexture('atm');
  const dispBusTex = makeShopfrontGlassTexture('bus');
  const dispHospTex = makeShopfrontGlassTexture('hospital');
  const dispKacchiTex = makeShopfrontGlassTexture('kacchi');
  const dispSweetsTex = makeShopfrontGlassTexture('sweets');

  const bank = {
    asphalt: m.road || new THREE.MeshStandardMaterial({ color: 0x3b4046, roughness: 0.78, metalness: 0.05 }),
    footpath: footpathMat,
    urbanGround: urbanGroundMat,
    brick: m.brick || mkPlaster('#9b4634', 101, 0.88, { subtleBrick: true }),
    concrete: m.concrete || mkPlaster('#a8a69e', 102, 0.88),
    darkConcrete: m.darkConcrete || mkPlaster('#4b4f52', 103, 0.90),
    royalCream: mkPlaster('#efe6d5', 201, 0.74),
    royalSand: mkPlaster('#d8bc94', 202, 0.76),
    royalTerracotta: mkPlaster('#b2523d', 203, 0.82, { subtleBrick: true }),
    castleBurgundy: mkPlaster('#6f1d28', 211, 0.72),
    castleIvory: mkPlaster('#f5efe2', 212, 0.70),
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
      roughness: 0.20,
      metalness: 0.88,
      clearcoat: 0.70,
      envMapIntensity: 1.65,
    }),
    stainlessChrome: new THREE.MeshPhysicalMaterial({
      color: 0xe8eef4,
      roughness: 0.14,
      metalness: 0.95,
      clearcoat: 0.90,
      envMapIntensity: 1.9,
    }),
    galvanizedPole: new THREE.MeshStandardMaterial({
      color: 0xb6bec6,
      roughness: 0.34,
      metalness: 0.76,
      envMapIntensity: 1.3,
    }),
    prawnChitin: new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.22,
      metalness: 0.14,
      clearcoat: 0.94,
      clearcoatRoughness: 0.12,
      bumpMap: chitinBump,
      bumpScale: 0.035,
      envMapIntensity: 1.55,
    }),
    prawnWhisker: new THREE.MeshPhysicalMaterial({
      color: 0xd9a24c,
      roughness: 0.24,
      metalness: 0.25,
      clearcoat: 0.85,
    }),
    prawnEye: new THREE.MeshPhysicalMaterial({
      color: 0x0b0f14,
      roughness: 0.08,
      metalness: 0.1,
      clearcoat: 1.0,
    }),
    fountainBrickVC: new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.80,
      metalness: 0.04,
      bumpMap: chitinBump,
      bumpScale: 0.025,
    }),
    fountainBasinVC: new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.56,
      metalness: 0.06,
    }),
    fountainNozzleTeal: new THREE.MeshStandardMaterial({
      color: 0x0d7a7e,
      roughness: 0.32,
      metalness: 0.65,
    }),
    steelDark: new THREE.MeshStandardMaterial({ color: 0x1e252c, roughness: 0.44, metalness: 0.74 }),
    aluminum: new THREE.MeshStandardMaterial({ color: 0xd1dae2, roughness: 0.24, metalness: 0.88, envMapIntensity: 1.3 }),
    fountainWater: new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      emissive: 0x0369a1,
      emissiveIntensity: 0.25,
      roughness: 0.07,
      metalness: 0.12,
      transparent: true,
      opacity: 0.84,
      clearcoat: 1.0,
    }),
    sprayJet: new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x7dd3fc,
      emissiveIntensity: 0.42,
      transparent: true,
      opacity: 0.74,
      roughness: 0.18,
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
    busRed: new THREE.MeshPhysicalMaterial({ color: 0xb91c1c, roughness: 0.20, metalness: 0.25, clearcoat: 0.95, envMapIntensity: 1.5 }),
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
    const len = Math.hypot(dx, dz) + 0.9;
    const yaw = Math.atan2(dx, dz);
    addRotBox(parent, [width, 0.04, len], [(x0 + x1) * 0.5, y, (z0 + z1) * 0.5], mat, yaw, {
      castShadow: false,
      uvScale,
    });
  }
}

/**
 * Adds a continuous raised tiled pedestrian sidewalk (ফুটপাত) with painted kerbstone
 * along one side (`sideSign = +1 or -1`) of a road polyline.
 */
function addSidewalkAlongPolyline(staticG, bank, pts, roadHalfW, sideSign, {
  walkWidth = 2.8,
  curbMat = bank.curbBlackWhite,
  addRailing = false,
} = {}) {
  const offset = roadHalfW + walkWidth * 0.5 + 0.12;
  const curbOffset = roadHalfW + 0.16;

  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const segLen = Math.hypot(dx, dz);
    if (segLen < 0.5) continue;
    const yaw = Math.atan2(dx, dz);
    // Right-hand perpendicular vector in XZ plane
    const perpX = dz / segLen;
    const perpZ = -dx / segLen;
    const mx = (x0 + x1) * 0.5;
    const mz = (z0 + z1) * 0.5;

    // Raised tiled pedestrian slab (height = 0.22m)
    addRotBox(
      staticG,
      [walkWidth, 0.22, segLen + 0.7],
      [mx + perpX * sideSign * offset, 0.11, mz + perpZ * sideSign * offset],
      bank.footpath,
      yaw,
      { castShadow: false, uvScale: 1.9 },
    );

    // Painted kerbstone along road edge
    addRotBox(
      staticG,
      [0.32, 0.24, segLen + 0.75],
      [mx + perpX * sideSign * curbOffset, 0.12, mz + perpZ * sideSign * curbOffset],
      curbMat,
      yaw,
      { castShadow: false },
    );

    // Optional pedestrian safety railing on busy roundabout approaches
    if (addRailing && segLen > 6) {
      const railOff = roadHalfW + 0.42;
      addRotBox(
        staticG,
        [0.06, 0.06, segLen - 1.2],
        [mx + perpX * sideSign * railOff, 0.96, mz + perpZ * sideSign * railOff],
        bank.steelDark,
        yaw,
      );
      const posts = Math.max(2, Math.floor(segLen / 4.2));
      for (let p = 0; p <= posts; p++) {
        const t = (p / posts - 0.5) * (segLen - 1.4);
        const px = mx + (dx / segLen) * t + perpX * sideSign * railOff;
        const pz = mz + (dz / segLen) * t + perpZ * sideSign * railOff;
        cylinder(staticG, 0.035, 0.04, 0.82, [px, 0.58, pz], bank.steelDark, 6);
      }
    }
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
    bulb.position.set(
      x + Math.cos(rotY) * (sx * 1.48),
      7.45,
      z - Math.sin(rotY) * (sx * 1.48),
    );
    bulb.rotation.y = rotY;
    dynamicG.add(bulb);
  }
  staticG.add(g);
}

function addSidewalkBench(staticG, bank, x, z, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0.22, z);
  g.rotation.y = rotY;
  box(g, [1.85, 0.08, 0.48], [0, 0.44, 0], bank.royalTerracotta);
  box(g, [1.85, 0.34, 0.07], [0, 0.70, -0.21], bank.royalTerracotta);
  for (const sx of [-0.74, 0.74]) {
    box(g, [0.10, 0.44, 0.44], [sx, 0.22, 0], bank.steelDark);
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

/* ============================================================================
 * 1. URBAN PAVED GROUND + EXACT MAP-MATCHED ROADS + CONTINUOUS FOOTPATHS
 * ========================================================================== */
function buildRoyalMoreRoadsAndFootpaths(staticG, dynamicG, bank) {
  const CX = ROYAL_MORE_CENTER.x;
  const CZ = ROYAL_MORE_CENTER.z;

  // Dense Urban Paved Concrete Ground Deck covering the surrounding green field (no empty grass field!)
  box(staticG, [196, 0.028, 178], [-740, 0.014, -296], bank.urbanGround, { castShadow: false });

  // Main Circular Roundabout Asphalt Ring (inner r = 4.45m, outer r = 13.6m)
  const ringGeo = new THREE.RingGeometry(4.45, 13.6, 56);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMesh = new THREE.Mesh(ringGeo, bank.asphalt);
  ringMesh.position.set(CX, 0.036, CZ);
  ringMesh.receiveShadow = true;
  staticG.add(ringMesh);

  // Outer Roundabout Raised Footpath Apron Collar segments (where no road enters)
  const cornerArcs = [
    [-0.18, 0.44],   // East-SE corner apron
    [1.06, 2.02],    // South apron (Castle Salam side)
    [3.56, 4.38],    // North-NW apron
    [5.02, 5.75],    // NE apron (Police Box / Royal Sweets corner)
  ];
  for (const [aStart, aEnd] of cornerArcs) {
    const segs = 10;
    const step = (aEnd - aStart) / segs;
    for (let i = 0; i < segs; i++) {
      const a0 = aStart + i * step;
      const a1 = a0 + step;
      const am = (a0 + a1) * 0.5;
      const rMid = 15.25;
      const arcLen = Math.max(0.9, rMid * step + 0.35);
      addRotBox(
        staticG,
        [3.1, 0.22, arcLen],
        [CX + Math.cos(am) * rMid, 0.11, CZ + Math.sin(am) * rMid],
        bank.footpath,
        -am,
        { castShadow: false, uvScale: 1.8 },
      );
      addRotBox(
        staticG,
        [0.32, 0.24, arcLen + 0.1],
        [CX + Math.cos(am) * 13.75, 0.12, CZ + Math.sin(am) * 13.75],
        bank.curbRedWhite,
        -am,
        { castShadow: false },
      );
    }
  }

  // Dashed White Lane Ring around Roundabout (r = 9.0m)
  const dashCount = 24;
  for (let i = 0; i < dashCount; i++) {
    const a = (i / dashCount) * Math.PI * 2;
    const r = 9.0;
    addRotBox(
      staticG,
      [0.18, 0.012, 1.35],
      [CX + Math.cos(a) * r, 0.043, CZ + Math.sin(a) * r],
      bank.roadLineWhite,
      -a,
      { castShadow: false },
    );
  }

  // Exact OSM Intersecting Road Polylines
  const seKhanJahan = [[-644, -248], [-670, -264], [-686, -276], [-711, -290]];
  const nwKhanJahan = [[-716, -296], [-727.9, -317.9], [-742.2, -337.3], [-756.6, -353.9], [-778.6, -386.1]];
  const kdaSouthLane = [[-715, -285.3], [-735.8, -277.2], [-766.8, -273.0], [-801.0, -274.8], [-834.0, -283.2]];
  const kdaNorthLane = [[-721, -296.5], [-742.8, -289.1], [-770.4, -283.7], [-802.5, -284.5], [-834.0, -290.5]];
  const slipSEtoKDA = [[-686.8, -275.6], [-735.8, -277.2]];
  const slipKDAtoNW = [[-742.8, -289.1], [-735.2, -299.2], [-727.9, -317.9]];

  addRoadRibbon(staticG, seKhanJahan, 13.6, 0.033, bank.asphalt, 5.5);
  addRoadRibbon(staticG, nwKhanJahan, 12.0, 0.033, bank.asphalt, 5.5);
  addRoadRibbon(staticG, kdaSouthLane, 8.4, 0.033, bank.asphalt, 5.5);
  addRoadRibbon(staticG, kdaNorthLane, 8.4, 0.033, bank.asphalt, 5.5);
  addRoadRibbon(staticG, slipSEtoKDA, 7.6, 0.031, bank.asphalt, 5.5);
  addRoadRibbon(staticG, slipKDAtoNW, 7.2, 0.031, bank.asphalt, 5.5);

  // Continuous Raised Tiled Pedestrian Footpaths (ফুটপাত) along EVERY Road Arm!
  // 1) SE Khan Jahan Ali Road (both sides)
  const seWalkPts = [[-644, -248], [-670, -264], [-686, -276], [-699, -283.5]];
  addSidewalkAlongPolyline(staticG, bank, seWalkPts, 6.8, 1, { walkWidth: 3.0, curbMat: bank.curbBlackWhite, addRailing: true });
  addSidewalkAlongPolyline(staticG, bank, seWalkPts, 6.8, -1, { walkWidth: 3.0, curbMat: bank.curbBlackWhite, addRailing: true });

  // 2) NW Khan Jahan Ali Road (both sides)
  const nwWalkPts = [[-726.5, -315.5], [-742.2, -337.3], [-756.6, -353.9], [-778.6, -386.1]];
  addSidewalkAlongPolyline(staticG, bank, nwWalkPts, 6.0, 1, { walkWidth: 2.9, curbMat: bank.curbBlackWhite, addRailing: true });
  addSidewalkAlongPolyline(staticG, bank, nwWalkPts, 6.0, -1, { walkWidth: 2.9, curbMat: bank.curbBlackWhite, addRailing: false });

  // 3) KDA Avenue South Footpath (Hotel Castle Salam + Bus Counter Strip promenade — wide 3.4m)
  const kdaSouthWalkPts = [[-735.8, -277.2], [-766.8, -273.0], [-801.0, -274.8], [-834.0, -283.2]];
  addSidewalkAlongPolyline(staticG, bank, kdaSouthWalkPts, 4.2, -1, { walkWidth: 3.4, curbMat: bank.curbRedWhite, addRailing: true });

  // 4) KDA Avenue North Footpath (Hotel Royal International + Kacchi Ghor / Prime Bank promenade — wide 3.4m)
  const kdaNorthWalkPts = [[-742.8, -289.1], [-770.4, -283.7], [-802.5, -284.5], [-834.0, -290.5]];
  addSidewalkAlongPolyline(staticG, bank, kdaNorthWalkPts, 4.2, 1, { walkWidth: 3.4, curbMat: bank.curbRedWhite, addRailing: true });

  // Pedestrian benches along the KDA Avenue footpaths
  for (const [bx, bz, byaw] of [
    [-752, -267.8, Math.PI],
    [-778, -266.8, Math.PI],
    [-806, -268.2, Math.PI],
    [-762, -291.2, 0],
    [-794, -291.5, 0],
  ]) {
    addSidewalkBench(staticG, bank, bx, bz, byaw);
  }

  // KDA Avenue Central Raised Median Divider (between South & North carriageways)
  const kdaMedianPts = [[-748, -281.8], [-770, -278.4], [-802, -279.6], [-828, -286.2]];
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

  // SE Khan Jahan Ali Road Raised Center Divider
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

  // Crisp Zebra Crosswalks on all Approaches into Royal Circle
  addZebraCrosswalk(staticG, bank, -701.5, -284.2, seYaw, 11.4);
  addZebraCrosswalk(staticG, bank, -724.5, -310.2, Math.atan2(-11.9, -21.9), 10.2);
  addZebraCrosswalk(staticG, bank, -736.5, -289.8, Math.atan2(-22.0, 5.2), 7.4);
  addZebraCrosswalk(staticG, bank, -734.8, -277.6, Math.atan2(-22.0, 4.0), 7.4);

  // Overhead Steel Directional Highway Gantry on SE Khan Jahan Ali Rd Approach
  const gx = -682.0;
  const gz = -272.2;
  const gPerpX = Math.cos(seYaw);
  const gPerpZ = -Math.sin(seYaw);
  for (const side of [-7.8, 7.8]) {
    cylinder(staticG, 0.22, 0.28, 6.8, [gx + gPerpX * side, 3.4, gz + gPerpZ * side], bank.steelDark, 10);
  }
  addRotBox(staticG, [16.2, 0.36, 0.42], [gx, 6.45, gz], bank.steelDark, seYaw);
  addSignBox(
    dynamicG,
    bank,
    {
      title: 'রয়্যালের মোড় · চিংড়ি চত্বর (ROYAL MORE)',
      subtitle: '← কেডিএ অ্যাভিনিউ (সোনাডাঙ্গা / বাস কাউন্টার)  |  ↑ শিববাড়ি',
      bg: '#065f46',
      accent: '#fef08a',
      width: 640,
      height: 176,
    },
    [gx, 6.65, gz],
    seYaw,
    9.4,
    1.85,
  );
}

/* ============================================================================
 * 2. AUTHENTIC CHINGRI CHATTAR (চিংড়ি চত্বর) PRAWN FOUNTAIN
 * Faithfully ported from the user's `prawn_fountain_blender.py` (Blender Z-up →
 * Three.js Y-up via (bx, bz, -by)) and upgraded with high-gloss wet chitin PBR,
 * chitin bump map, long sweeping antennae whiskers, 48 nozzles, chrome railing,
 * 16 animated water jets & night uplights!
 * ========================================================================== */
function buildVertexColoredTube(points, radii, colors, segs = 12) {
  const n = points.length;
  const positions = [];
  const vc = [];
  const uvs = [];
  const indices = [];

  const upRef = new THREE.Vector3(0, 1, 0);
  const fallbackRef = new THREE.Vector3(1, 0, 0);

  for (let i = 0; i < n; i++) {
    const p = points[i];
    const t = new THREE.Vector3();
    if (i === 0) t.subVectors(points[1], points[0]);
    else if (i === n - 1) t.subVectors(points[n - 1], points[n - 2]);
    else t.subVectors(points[i + 1], points[i - 1]);
    if (t.lengthSq() < 1e-8) t.set(0, 1, 0);
    t.normalize();

    const ref = Math.abs(t.dot(upRef)) > 0.92 ? fallbackRef : upRef;
    const u = new THREE.Vector3().crossVectors(t, ref).normalize();
    const v = new THREE.Vector3().crossVectors(t, u).normalize();

    const rx = Array.isArray(radii[i]) ? radii[i][0] : radii[i];
    const ry = Array.isArray(radii[i]) ? radii[i][1] : radii[i];
    const c = colors[i];

    for (let j = 0; j <= segs; j++) {
      const a = (j / segs) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const vx = p.x + u.x * (ca * rx) + v.x * (sa * ry);
      const vy = p.y + u.y * (ca * rx) + v.y * (sa * ry);
      const vz = p.z + u.z * (ca * rx) + v.z * (sa * ry);
      positions.push(vx, vy, vz);
      // Slight dorsal sheen variation around circumference
      const shade = 0.88 + 0.18 * (0.5 + 0.5 * sa);
      vc.push(
        Math.min(1, c[0] * shade),
        Math.min(1, c[1] * shade),
        Math.min(1, c[2] * shade),
      );
      uvs.push(j / segs, i / Math.max(1, n - 1));
    }
  }

  const stride = segs + 1;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * stride + j;
      const b = a + 1;
      const c = (i + 1) * stride + j;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(vc, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  const nonIdx = geo.toNonIndexed();
  geo.dispose();
  nonIdx.computeVertexNormals();
  return nonIdx;
}

function colorizeGeometry(geo, rgb) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  const count = g.attributes.position.count;
  const cols = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    cols[i * 3] = rgb[0];
    cols[i * 3 + 1] = rgb[1];
    cols[i * 3 + 2] = rgb[2];
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) {
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
  }
  return g;
}

function buildSingleGoldaPrawnGeometries(rotYAngle) {
  // Exact Golda Prawn iridescent palette from user's `prawn_fountain_blender.py`
  const C_YELLOW = [0.90, 0.92, 0.24];
  const C_GREEN = [0.24, 0.76, 0.34];
  const C_TEAL = [0.10, 0.56, 0.62];
  const C_BLUE = [0.10, 0.26, 0.68];
  const C_DEEPBLUE = [0.06, 0.14, 0.46];
  const C_ORANGE = [0.96, 0.36, 0.12];

  const v = (bx, by, bz) => new THREE.Vector3(bx, bz, -by); // Blender Z-up -> Three.js Y-up
  const prawnGeos = [];
  const whiskerGeos = [];
  const eyeGeos = [];

  const rotMat = new THREE.Matrix4().makeRotationY(rotYAngle);

  const pushPrawn = (g) => {
    g.applyMatrix4(rotMat);
    prawnGeos.push(g);
  };

  // 1) 6 Bulging Segmented Abdomen Rings curving up from pedestal (1.05,0,1.24) -> (1.98,0,2.60)
  const abdPts = [
    v(1.05, 0, 1.24),
    v(1.28, 0, 1.42),
    v(1.52, 0, 1.66),
    v(1.74, 0, 1.94),
    v(1.90, 0, 2.26),
    v(1.98, 0, 2.60),
  ];
  const abdRad = [
    [0.14, 0.16],
    [0.24, 0.27],
    [0.31, 0.35],
    [0.36, 0.41],
    [0.38, 0.43],
    [0.39, 0.44],
  ];
  const abdCol = [C_ORANGE, C_YELLOW, C_GREEN, C_TEAL, C_BLUE, C_BLUE];

  // Add subtle inter-segment bulges so each chitin plate looks sculpted
  const segPts = [];
  const segRad = [];
  const segCol = [];
  for (let i = 0; i < abdPts.length - 1; i++) {
    const p0 = abdPts[i];
    const p1 = abdPts[i + 1];
    const r0 = abdRad[i];
    const r1 = abdRad[i + 1];
    const c0 = abdCol[i];
    const c1 = abdCol[i + 1];
    segPts.push(p0.clone());
    segRad.push([r0[0] * 0.90, r0[1] * 0.90]);
    segCol.push(c0);

    const mid = p0.clone().lerp(p1, 0.52);
    segPts.push(mid);
    segRad.push([(r0[0] + r1[0]) * 0.56, (r0[1] + r1[1]) * 0.56]);
    segCol.push([
      (c0[0] + c1[0]) * 0.5,
      (c0[1] + c1[1]) * 0.5,
      (c0[2] + c1[2]) * 0.5,
    ]);
  }
  segPts.push(abdPts[abdPts.length - 1].clone());
  segRad.push(abdRad[abdRad.length - 1]);
  segCol.push(abdCol[abdCol.length - 1]);
  pushPrawn(buildVertexColoredTube(segPts, segRad, segCol, 14));

  // 2) Smooth Cephalothorax Carapace curving inward toward central pole (1.97,0,2.55) -> (1.48,0,3.90)
  const carPts = [
    v(1.97, 0, 2.55),
    v(1.96, 0, 2.95),
    v(1.86, 0, 3.35),
    v(1.68, 0, 3.68),
    v(1.48, 0, 3.90),
  ];
  const carRad = [
    [0.40, 0.45],
    [0.43, 0.49],
    [0.39, 0.45],
    [0.30, 0.35],
    [0.18, 0.21],
  ];
  const carCol = [C_BLUE, C_TEAL, C_GREEN, C_YELLOW, C_YELLOW];
  pushPrawn(buildVertexColoredTube(carPts, carRad, carCol, 14));

  // 3) Serrated Orange-Tipped Rostrum Horn (y = 3.84..4.88)
  const rosPts = [
    v(1.48, 0, 3.84),
    v(1.36, 0, 4.18),
    v(1.22, 0, 4.54),
    v(1.06, 0, 4.88),
  ];
  const rosRad = [0.13, 0.085, 0.048, 0.015];
  const rosCol = [C_YELLOW, C_ORANGE, C_ORANGE, C_ORANGE];
  pushPrawn(buildVertexColoredTube(rosPts, rosRad, rosCol, 10));

  // 4) Antennal Scales + Stalked Glossy Black Eyes + Long Sweeping Antennae Whiskers!
  for (const sy of [-1, 1]) {
    const scalePts = [
      v(1.46, sy * 0.14, 3.82),
      v(1.32, sy * 0.26, 4.12),
      v(1.22, sy * 0.30, 4.38),
    ];
    pushPrawn(buildVertexColoredTube(scalePts, [[0.06, 0.03], [0.07, 0.025], [0.02, 0.01]], [C_TEAL, C_BLUE, C_ORANGE], 8));

    // Stalked black eye
    const eyeSphere = new THREE.SphereGeometry(0.068, 10, 8);
    const ep = v(1.48, sy * 0.22, 3.92);
    eyeSphere.translate(ep.x, ep.y, ep.z);
    eyeSphere.applyMatrix4(rotMat);
    eyeGeos.push(eyeSphere.index ? eyeSphere.toNonIndexed() : eyeSphere);

    // Long sweeping realistic Golda Prawn antennae whisker curving gracefully out & down
    const wCurve = new THREE.CatmullRomCurve3([
      v(1.44, sy * 0.18, 3.88),
      v(1.24, sy * 0.62, 4.42),
      v(1.42, sy * 1.12, 4.58),
      v(1.86, sy * 1.38, 4.15),
    ]);
    const wGeo = new THREE.TubeGeometry(wCurve, 14, 0.014, 5, false);
    wGeo.applyMatrix4(rotMat);
    whiskerGeos.push(wGeo.index ? wGeo.toNonIndexed() : wGeo);
  }

  // 5) 5-Blade Tail Fan (Telson & Uropods) splayed above the octagonal pedestal
  for (let b = -2; b <= 2; b++) {
    const spread = b * 0.15;
    const bladePts = [
      v(1.06, spread * 0.3, 1.26),
      v(0.84, spread * 1.0, 1.12),
      v(0.62, spread * 1.55, 0.96),
    ];
    pushPrawn(buildVertexColoredTube(
      bladePts,
      [[0.07, 0.025], [0.10, 0.022], [0.04, 0.012]],
      [C_ORANGE, C_BLUE, C_DEEPBLUE],
      8,
    ));
  }

  // 6) 4 Pairs of Yellow-Blue Swimmerets (Pleopods) along underside of curved abdomen
  for (let s = 0; s < 4; s++) {
    const pBase = abdPts[s + 1];
    for (const sy of [-1, 1]) {
      const swPts = [
        new THREE.Vector3(pBase.x - 0.14, pBase.y - 0.06, pBase.z + sy * 0.18),
        new THREE.Vector3(pBase.x - 0.36, pBase.y - 0.14, pBase.z + sy * 0.30),
        new THREE.Vector3(pBase.x - 0.50, pBase.y - 0.26, pBase.z + sy * 0.34),
      ];
      pushPrawn(buildVertexColoredTube(swPts, [0.045, 0.036, 0.014], [C_YELLOW, C_TEAL, C_BLUE], 6));
    }
  }

  // 7) Long Deep-Blue Cheliped Arms (Claws) & 3 Pairs of Walking Legs gripping the central pole!
  for (const sy of [-1, 1]) {
    // Giant blue cheliped claw arm reaching inward to embrace the central pole
    const armPts = [
      v(1.66, sy * 0.28, 3.20),
      v(1.18, sy * 0.52, 3.56),
      v(0.68, sy * 0.42, 3.92),
      v(0.30, sy * 0.22, 4.18),
    ];
    pushPrawn(buildVertexColoredTube(armPts, [0.075, 0.068, 0.082, 0.045], [C_TEAL, C_BLUE, C_DEEPBLUE, C_DEEPBLUE], 8));

    // Pincer finger split at tip
    const pincerPts = [
      v(0.48, sy * 0.30, 4.06),
      v(0.24, sy * 0.14, 4.30),
    ];
    pushPrawn(buildVertexColoredTube(pincerPts, [0.038, 0.015], [C_DEEPBLUE, C_ORANGE], 6));

    // 3 Walking legs bracing against the pedestal & central pole
    for (let l = 0; l < 3; l++) {
      const zOff = 2.65 + l * 0.32;
      const legPts = [
        v(1.76 - l * 0.08, sy * 0.32, zOff),
        v(1.12, sy * 0.56, zOff + 0.12),
        v(0.56, sy * 0.34, zOff - 0.16),
        v(0.26, sy * 0.18, zOff - 0.32),
      ];
      pushPrawn(buildVertexColoredTube(legPts, [0.048, 0.038, 0.030, 0.016], [C_GREEN, C_TEAL, C_BLUE, C_DEEPBLUE], 6));
    }
  }

  return { prawnGeos, whiskerGeos, eyeGeos };
}

function buildChingriChattarMonument(staticG, dynamicG, bank) {
  const CX = ROYAL_MORE_CENTER.x;
  const CZ = ROYAL_MORE_CENTER.z;

  const mon = new THREE.Group();
  mon.position.set(CX, 0, CZ);
  dynamicG.add(mon); // Keep vertex-colored Chingri Chattar cleanly batched here (only 5 draw calls total!)

  const brickGeos = [];
  const basinGeos = [];
  const nozzleGeos = [];
  const chromeGeos = [];
  const allPrawnGeos = [];
  const allWhiskerGeos = [];
  const allEyeGeos = [];

  // 1) Outer Dark Concrete Apron (r = 4.48 -> 4.40, y = 0..0.10) & Turquoise Basin Floor (r = 3.48, y = 0.10..0.24)
  const apron = new THREE.CylinderGeometry(4.40, 4.48, 0.10, 40);
  apron.translate(0, 0.05, 0);
  basinGeos.push(colorizeGeometry(apron, [0.22, 0.24, 0.27]));

  const floor = new THREE.CylinderGeometry(3.48, 3.48, 0.14, 36);
  floor.translate(0, 0.17, 0);
  basinGeos.push(colorizeGeometry(floor, [0.08, 0.44, 0.52]));

  // Inner turquoise liner wall (r = 3.44..3.52, y = 0.10..0.92)
  const innerWall = new THREE.CylinderGeometry(3.48, 3.48, 0.82, 36, 1, true);
  innerWall.translate(0, 0.51, 0);
  basinGeos.push(colorizeGeometry(innerWall, [0.10, 0.56, 0.62]));

  // 2) Authentic Sandstone / Ochre Brick Ring Wall (7 courses × 42 staggered bricks, r = 3.46..3.98, y = 0.10..0.92)
  const rnd = seeded(909);
  const courses = 7;
  const bricksPerCourse = 42;
  const courseH = 0.82 / courses;
  for (let c = 0; c < courses; c++) {
    const yMid = 0.10 + (c + 0.5) * courseH;
    const angleOffset = (c % 2) * (Math.PI / bricksPerCourse);
    for (let b = 0; b < bricksPerCourse; b++) {
      const a = (b / bricksPerCourse) * Math.PI * 2 + angleOffset;
      const r = 3.73;
      const br = new THREE.BoxGeometry(0.50, courseH - 0.012, 0.52);
      br.rotateY(-a);
      br.translate(Math.cos(a) * r, yMid, Math.sin(a) * r);
      // Warm sandstone / ochre brick color variation
      const v = (rnd() - 0.5) * 0.10;
      brickGeos.push(colorizeGeometry(br, [0.74 + v, 0.54 + v * 0.8, 0.34 + v * 0.5]));
    }
  }

  // Light Tan Sandstone Top Coping Cap Ring (y = 0.92..0.98)
  for (let b = 0; b < 36; b++) {
    const a = (b / 36) * Math.PI * 2;
    const cap = new THREE.BoxGeometry(0.62, 0.07, 0.68);
    cap.rotateY(-a);
    cap.translate(Math.cos(a) * 3.72, 0.955, Math.sin(a) * 3.72);
    brickGeos.push(colorizeGeometry(cap, [0.85, 0.77, 0.64]));
  }

  // 3) Fountain Spray Pipe Ring (majorR = 3.34, y = 0.54) + 48 Teal Nozzles
  const sprayPipe = new THREE.TorusGeometry(3.34, 0.034, 8, 48);
  sprayPipe.rotateX(Math.PI / 2);
  sprayPipe.translate(0, 0.54, 0);
  nozzleGeos.push(sprayPipe.index ? sprayPipe.toNonIndexed() : sprayPipe);

  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const nz = new THREE.CylinderGeometry(0.016, 0.028, 0.14, 6);
    nz.translate(Math.cos(a) * 3.34, 0.60, Math.sin(a) * 3.34);
    nozzleGeos.push(nz.index ? nz.toNonIndexed() : nz);
  }

  // 4) Gleaming Stainless Steel Perimeter Railing (majorR = 3.72, y = 1.32) on 12 Flanged Posts
  const railTorus = new THREE.TorusGeometry(3.72, 0.046, 10, 48);
  railTorus.rotateX(Math.PI / 2);
  railTorus.translate(0, 1.32, 0);
  chromeGeos.push(railTorus.index ? railTorus.toNonIndexed() : railTorus);

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const px = Math.cos(a) * 3.72;
    const pz = Math.sin(a) * 3.72;
    const post = new THREE.CylinderGeometry(0.034, 0.038, 0.36, 8);
    post.translate(px, 1.14, pz);
    chromeGeos.push(post.index ? post.toNonIndexed() : post);

    const flange = new THREE.CylinderGeometry(0.072, 0.08, 0.04, 8);
    flange.translate(px, 0.99, pz);
    chromeGeos.push(flange.index ? flange.toNonIndexed() : flange);
  }

  // 5) Central Concrete Pedestal (r = 0.52, y = 0.24..1.08) + 3 Radial Octagonal Pedestals (r = 1.44, y = 0.24..1.22)
  const centerPed = new THREE.CylinderGeometry(0.48, 0.54, 0.84, 12);
  centerPed.translate(0, 0.66, 0);
  basinGeos.push(colorizeGeometry(centerPed, [0.76, 0.74, 0.70]));

  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.35;
    const oct = new THREE.CylinderGeometry(0.45, 0.50, 0.98, 8);
    oct.translate(Math.cos(a) * 1.44, 0.73, Math.sin(a) * 1.44);
    basinGeos.push(colorizeGeometry(oct, [0.80, 0.77, 0.72]));

    // Build each of the 3 Giant Curved Golda Prawns (গলদা চিংড়ি)!
    const { prawnGeos, whiskerGeos, eyeGeos } = buildSingleGoldaPrawnGeometries(-a);
    allPrawnGeos.push(...prawnGeos);
    allWhiskerGeos.push(...whiskerGeos);
    allEyeGeos.push(...eyeGeos);
  }

  // 6) Tall Central Galvanized Steel Pole (r = 0.22 -> 0.21, y = 1.08..5.65) + Top Cap & Crown Finial
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.22, 4.58, 14), bank.galvanizedPole);
  pole.position.y = 3.37;
  pole.castShadow = true;
  mon.add(pole);

  const topBracket = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.26, 12), bank.stainlessChrome);
  topBracket.position.y = 5.72;
  mon.add(topBracket);

  const topRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.055, 8, 24), bank.goldMetal);
  topRing.rotation.x = Math.PI / 2;
  topRing.position.y = 5.88;
  mon.add(topRing);

  // Merge each Chingri Chattar material group cleanly into 1 draw call
  const addMerged = (geos, mat, cast = true, receive = true) => {
    if (!geos.length) return;
    const merged = mergeGeometries(geos, false);
    for (const g of geos) g.dispose();
    if (!merged) return;
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    mon.add(mesh);
  };

  addMerged(brickGeos, bank.fountainBrickVC, true, true);
  addMerged(basinGeos, bank.fountainBasinVC, true, true);
  addMerged(nozzleGeos, bank.fountainNozzleTeal, false, true);
  addMerged(chromeGeos, bank.stainlessChrome, true, true);
  addMerged(allPrawnGeos, bank.prawnChitin, true, true);
  addMerged(allWhiskerGeos, bank.prawnWhisker, false, false);
  addMerged(allEyeGeos, bank.prawnEye, false, false);

  // Shimmering Turquoise Water Surface inside the Basin (y = 0.56)
  const waterDisc = new THREE.Mesh(new THREE.CylinderGeometry(3.42, 3.42, 0.08, 36), bank.fountainWater);
  waterDisc.position.y = 0.56;
  mon.add(waterDisc);

  // 6 Night Uplight Fixtures illuminating the 3 Prawns & Basin
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const bulb = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.18, 0.16, 10),
      i % 2 === 0 ? bank.uplightGold : bank.uplightCyan,
    );
    bulb.position.set(Math.cos(a) * 2.55, 0.62, Math.sin(a) * 2.55);
    mon.add(bulb);
  }

  // 16 Animated Parabolic Fountain Water Jets spraying inward from the 48-nozzle ring!
  const fountainJets = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const jetCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * 3.30, 0.66, Math.sin(a) * 3.30),
      new THREE.Vector3(Math.cos(a) * 2.15, 2.25 + (i % 2) * 0.35, Math.sin(a) * 2.15),
      new THREE.Vector3(Math.cos(a) * 1.15, 0.72, Math.sin(a) * 1.15),
    ]);
    const jet = new THREE.Mesh(new THREE.TubeGeometry(jetCurve, 12, 0.036, 5, false), bank.sprayJet);
    mon.add(jet);
    fountainJets.push({ mesh: jet, phase: i * 0.55 });
  }

  // Illuminated Plaque Sign on Outer Brick Wall facing SE incoming traffic
  addSignBox(
    dynamicG,
    bank,
    {
      title: 'চিংড়ি চত্বর · রয়্যালের মোড়',
      subtitle: 'CHINGRI CHATTAR · ROYAL MORE · KHULNA',
      bg: '#0f172a',
      fg: '#fef08a',
      accent: '#f59e0b',
      border: '#f59e0b',
    },
    [CX + 3.45, 0.78, CZ + 2.15],
    Math.PI * 0.34,
    2.1,
    0.66,
  );

  return fountainJets;
}

/* ============================================================================
 * 3. HOTEL ROYAL INTERNATIONAL (হোটেল রয়েল ইন্টারন্যাশনাল — ১০-তলা, স্থাপিত ১৯৮৬)
 * ========================================================================== */
function buildHotelRoyalInternational(staticG, dynamicG, bank) {
  const hx = -774.0;
  const hz = -314.0;
  const rotY = 0.16;
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
  const totalH = gfH + (floors - 1) * flH;

  box(g, [W + 6.5, 0.16, D + 8.5], [0, 0.08, 2.2], bank.marbleWhite, { castShadow: false, uvScale: 2.8 });
  box(g, [3.6, 0.20, 5.2], [0, 0.12, D * 0.5 + 2.4], bank.redCarpet, { castShadow: false });

  box(g, [W, gfH, D], [0, gfH * 0.5, 0], bank.blackGranite, { uvScale: 2.5 });
  box(g, [W - 3.6, 3.6, 0.35], [0, 2.0, D * 0.5 + 0.02], bank.glassLobby);
  box(dg, [W - 4.4, 3.1, 0.15], [0, 1.9, D * 0.5 - 0.18], bank.warmWindowLit, { castShadow: false });

  // Grand Projecting Porte-Cochere Canopy
  box(g, [10.8, 0.52, 4.8], [0, 4.35, D * 0.5 + 2.3], bank.marbleWhite);
  box(g, [11.0, 0.16, 4.95], [0, 4.66, D * 0.5 + 2.3], bank.goldMetal);
  for (const cx of [-4.6, -1.9, 1.9, 4.6]) {
    cylinder(g, 0.32, 0.36, 4.15, [cx, 2.15, D * 0.5 + 4.25], bank.marbleWhite, 12);
    cylinder(g, 0.40, 0.42, 0.25, [cx, 0.25, D * 0.5 + 4.25], bank.blackGranite, 12);
  }

  // Main 10-Story Tower
  box(g, [W, totalH - gfH, D], [0, gfH + (totalH - gfH) * 0.5, 0], bank.royalCream, { uvScale: 3.2 });
  box(g, [6.4, totalH - gfH + 1.2, 0.45], [0, gfH + (totalH - gfH) * 0.5 + 0.4, D * 0.5 + 0.18], bank.glassCurtain);
  for (const fx of [-3.35, 3.35, -9.2, 9.2, -12.35, 12.35]) {
    box(g, [0.62, totalH - gfH + 0.8, 0.72], [fx, gfH + (totalH - gfH) * 0.5 + 0.2, D * 0.5 + 0.12], bank.royalTerracotta);
  }

  const rnd = seeded(1986);
  for (let f = 1; f < floors; f++) {
    const fy = gfH + (f - 1) * flH;
    box(g, [W + 0.55, 0.24, D + 0.55], [0, fy, 0], bank.marbleWhite);
    for (const wx of [-10.7, -7.6, -5.0, 5.0, 7.6, 10.7]) {
      const lit = rnd() > 0.38;
      const wMat = lit ? (rnd() > 0.35 ? bank.warmWindowLit : bank.coolWindowLit) : bank.glassCurtain;
      box(lit ? dg : g, [2.05, 1.75, 0.18], [wx, fy + 1.65, D * 0.5 + 0.04], wMat, { castShadow: false });
      box(g, [2.35, 0.16, 0.82], [wx, fy + 0.12, D * 0.5 + 0.40], bank.marbleWhite);
      box(g, [2.25, 0.72, 0.10], [wx, fy + 0.52, D * 0.5 + 0.76], bank.royalTerracotta);
      box(g, [2.05, 1.65, 0.16], [wx, fy + 1.65, -D * 0.5 - 0.04], bank.glassCurtain, { castShadow: false });
    }
    for (const sx of [-1, 1]) {
      for (const wz of [-4.6, 0, 4.6]) {
        const litS = rnd() > 0.55;
        box(litS ? dg : g, [0.16, 1.65, 2.2], [sx * (W * 0.5 + 0.04), fy + 1.65, wz], litS ? bank.warmWindowLit : bank.glassCurtain, { castShadow: false });
      }
    }
  }

  box(g, [W + 0.9, 1.45, D + 0.9], [0, totalH + 0.72, 0], bank.royalTerracotta);
  box(g, [W + 1.05, 0.24, D + 1.05], [0, totalH + 1.52, 0], bank.goldMetal);
  box(g, [10.5, 3.2, 8.5], [0, totalH + 2.8, 0], bank.modernWhite);
  box(g, [10.9, 0.35, 8.9], [0, totalH + 4.5, 0], bank.goldMetal);

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

  addOrnamentalPalm(staticG, bank, hx - 12.8, hz + 10.5, 8.2, 811);
  addOrnamentalPalm(staticG, bank, hx + 12.8, hz + 8.5, 7.8, 823);
}

/* ============================================================================
 * 4. PROMINENT HOTEL CASTLE SALAM (হোটেল ক্যাসেল সালাম · G-8 KDA AVENUE)
 * Flagship 7-story luxury hotel prominently facing KDA Avenue & Royal Circle!
 * ========================================================================== */
function buildHotelCastleSalam(staticG, dynamicG, bank) {
  const hx = -744.0;
  const hz = -252.0;
  const rotY = Math.PI - 0.14; // Front (+Z locally) faces North directly onto KDA Avenue & Royal Circle
  const g = new THREE.Group();
  g.position.set(hx, 0, hz);
  g.rotation.y = rotY;
  staticG.add(g);

  const dg = new THREE.Group();
  dg.position.set(hx, 0, hz);
  dg.rotation.y = rotY;
  dynamicG.add(dg);

  const W = 24.0;
  const D = 15.0;
  const gfH = 4.5;
  const flH = 3.2;
  const floors = 7;
  const totalH = gfH + (floors - 1) * flH; // ~23.7m

  // Grand Marble Forecourt & Red Carpet Entrance
  box(g, [W + 6.0, 0.18, D + 7.5], [0, 0.09, 2.0], bank.marbleWhite, { castShadow: false, uvScale: 2.6 });
  box(g, [3.8, 0.22, 5.4], [0, 0.13, D * 0.5 + 2.2], bank.redCarpet, { castShadow: false });

  // Ground Floor Lobby + Burgundy & Gold Trim
  box(g, [W, gfH, D], [0, gfH * 0.5, 0], bank.castleBurgundy, { uvScale: 2.5 });
  box(g, [W - 4.0, 3.4, 0.35], [0, 1.9, D * 0.5 + 0.02], bank.glassLobby);
  box(dg, [W - 4.8, 2.9, 0.16], [0, 1.85, D * 0.5 - 0.18], bank.warmWindowLit, { castShadow: false });

  // Grand Castle-Style Entrance Portico with 4 Fluted Marble Pillars & Gold Cornice
  box(g, [10.4, 0.58, 4.4], [0, 4.28, D * 0.5 + 2.1], bank.castleIvory);
  box(g, [10.8, 0.22, 4.65], [0, 4.65, D * 0.5 + 2.1], bank.goldMetal);
  for (const cx of [-4.4, -1.8, 1.8, 4.4]) {
    cylinder(g, 0.34, 0.38, 4.1, [cx, 2.1, D * 0.5 + 3.9], bank.marbleWhite, 12);
    cylinder(g, 0.42, 0.46, 0.28, [cx, 0.26, D * 0.5 + 3.9], bank.castleBurgundy, 12);
  }

  // 7-Story Ivory Tower with Twin Corner Castle Turret Piers & Central Glass Bay
  box(g, [W, totalH - gfH, D], [0, gfH + (totalH - gfH) * 0.5, 0], bank.castleIvory, { uvScale: 3.0 });
  box(g, [5.8, totalH - gfH + 1.0, 0.42], [0, gfH + (totalH - gfH) * 0.5 + 0.2, D * 0.5 + 0.16], bank.glassCurtain);
  for (const px of [-W * 0.5 + 0.8, W * 0.5 - 0.8]) {
    box(g, [1.8, totalH + 1.4, 1.8], [px, (totalH + 1.4) * 0.5, D * 0.5 - 0.4], bank.castleBurgundy);
    box(g, [2.1, 0.28, 2.1], [px, totalH + 1.5, D * 0.5 - 0.4], bank.goldMetal);
  }

  // Upper Floors Balconies & Lit Hotel Windows
  const rnd = seeded(1996);
  for (let f = 1; f < floors; f++) {
    const fy = gfH + (f - 1) * flH;
    box(g, [W + 0.5, 0.22, D + 0.5], [0, fy, 0], bank.marbleWhite);
    for (const wx of [-8.8, -5.6, 5.6, 8.8]) {
      const lit = rnd() > 0.35;
      box(lit ? dg : g, [2.1, 1.75, 0.18], [wx, fy + 1.65, D * 0.5 + 0.04], lit ? bank.warmWindowLit : bank.glassCurtain, { castShadow: false });
      box(g, [2.45, 0.16, 0.84], [wx, fy + 0.12, D * 0.5 + 0.42], bank.marbleWhite);
      box(g, [2.35, 0.74, 0.10], [wx, fy + 0.54, D * 0.5 + 0.78], bank.castleBurgundy);
      box(g, [2.1, 1.65, 0.16], [wx, fy + 1.65, -D * 0.5 - 0.04], bank.glassCurtain, { castShadow: false });
    }
    for (const sx of [-1, 1]) {
      for (const wz of [-4.2, 0, 4.2]) {
        const litS = rnd() > 0.5;
        box(litS ? dg : g, [0.16, 1.65, 2.1], [sx * (W * 0.5 + 0.04), fy + 1.65, wz], litS ? bank.warmWindowLit : bank.glassCurtain, { castShadow: false });
      }
    }
  }

  // Iconic Crown Parapet & Golden Rooftop Pavilion
  box(g, [W + 0.8, 1.3, D + 0.8], [0, totalH + 0.65, 0], bank.castleBurgundy);
  box(g, [W + 1.0, 0.24, D + 1.0], [0, totalH + 1.38, 0], bank.goldMetal);
  cylinder(g, 3.2, 3.5, 2.2, [0, totalH + 2.4, 0], bank.castleIvory, 12);
  cylinder(g, 0.4, 3.3, 1.8, [0, totalH + 4.4, 0], bank.goldMetal, 12);

  // Prominent Entrance Portico Sign + Huge Rooftop Hotel Castle Salam Signboard
  addSignBox(
    dg,
    bank,
    {
      title: 'হোটেল ক্যাসেল সালাম ★★★★',
      subtitle: 'HOTEL CASTLE SALAM · G-8, KDA AVENUE · EST. 1996',
      bg: '#4c0519',
      fg: '#fef08a',
      accent: '#f59e0b',
      border: '#f59e0b',
      width: 640,
    },
    [0, 5.35, D * 0.5 + 4.35],
    0,
    9.8,
    1.32,
  );
  addSignBox(
    dg,
    bank,
    {
      title: 'HOTEL CASTLE SALAM',
      subtitle: 'হোটেল ক্যাসেল সালাম · রয়্যালের মোড়, খুলনা',
      bg: '#7f1d1d',
      fg: '#ffffff',
      accent: '#fde047',
      border: '#f59e0b',
      width: 640,
    },
    [0, totalH + 2.4, D * 0.5 + 0.52],
    0,
    14.0,
    2.35,
  );

  addOrnamentalPalm(staticG, bank, hx - 12.6, hz - 9.2, 7.6, 841);
  addOrnamentalPalm(staticG, bank, hx + 12.6, hz - 9.8, 7.8, 849);
}

/* ============================================================================
 * 5. COMPLETE ROYAL MORE BUS COUNTER STRIP (বাসের কাউন্টার সারি · কেডিএ অ্যাভিনিউ)
 * 6 Iconic Khulna Inter-District Bus Counters + Waiting Canopy + 2 AC Coaches!
 * ========================================================================== */
function buildBusCounterStrip(staticG, dynamicG, bank) {
  const bx = -801.0;
  const bz = -255.0;
  const rotY = Math.PI - 0.12; // Front (+Z locally) faces North onto KDA Avenue South lane
  const g = new THREE.Group();
  g.position.set(bx, 0, bz);
  g.rotation.y = rotY;
  staticG.add(g);

  const dg = new THREE.Group();
  dg.position.set(bx, 0, bz);
  dg.rotation.y = rotY;
  dynamicG.add(dg);

  const counters = [
    { name: 'গ্রীন লাইন পরিবহন', sub: 'GREEN LINE AC · খুলনা—ঢাকা', bg: '#065f46', accent: '#fde047' },
    { name: 'সোহাগ পরিবহন', sub: 'SOHAGH PARIBAHAN · SCANIA AC', bg: '#991b1b', accent: '#fef08a' },
    { name: 'হানিফ এন্টারপ্রাইজ', sub: 'HANIF ENTERPRISE · NON-STOP', bg: '#1e3a8a', accent: '#38bdf8' },
    { name: 'এনা ট্রান্সপোর্ট', sub: 'ENA TRANSPORT · HYUNDAI AC', bg: '#7c2d12', accent: '#fde047' },
    { name: 'ঈগল পরিবহন', sub: 'EAGLE PARIBAHAN · ROYAL MORE', bg: '#0f766e', accent: '#a7f3d0' },
    { name: 'টুঙ্গিপাড়া এক্সপ্রেস', sub: 'TUNGIPARA EXPRESS · পদ্মা সেতু', bg: '#4c1d95', accent: '#fde047' },
  ];

  const bayW = 7.4;
  const W = counters.length * bayW; // 44.4m continuous bus counter arcade!
  const D = 11.5;
  const gfH = 4.2;
  const totalH = gfH + 6.4; // 3-story commercial building above the bus counter strip

  // Wide Passenger Boarding Apron & Footpath Connection
  box(g, [W + 3.0, 0.18, D + 6.5], [0, 0.09, 2.2], bank.footpath, { castShadow: false, uvScale: 2.2 });

  // Ground Floor Counter Structure + Projecting Rain Canopy
  box(g, [W, gfH, D - 0.8], [0, gfH * 0.5, -0.4], bank.modernWhite, { uvScale: 2.8 });
  box(g, [W + 0.8, 0.24, 3.2], [0, 3.25, D * 0.5 + 1.2], bank.steelDark);

  // Upper 2 Commercial Floors above Bus Counters (Offices / Hotel Rooms)
  box(g, [W, totalH - gfH, D], [0, gfH + (totalH - gfH) * 0.5, 0], bank.royalCream, { uvScale: 3.0 });
  box(g, [W + 0.5, 0.24, D + 0.5], [0, gfH, 0], bank.marbleWhite);
  box(g, [W + 0.5, 0.24, D + 0.5], [0, gfH + 3.2, 0], bank.marbleWhite);
  box(g, [W + 0.5, 0.85, D + 0.5], [0, totalH + 0.42, 0], bank.emeraldWall);

  const rnd = seeded(955);
  for (let i = 0; i < counters.length; i++) {
    const cx = -W * 0.5 + (i + 0.5) * bayW;
    const cInfo = counters[i];

    // Separating Counter Pillar + Canopy Support Column
    box(g, [0.42, gfH, 0.55], [cx - bayW * 0.5, gfH * 0.5, D * 0.5 - 0.25], bank.modernSlate);
    cylinder(g, 0.11, 0.13, 3.2, [cx - bayW * 0.5 + 0.25, 1.6, D * 0.5 + 2.45], bank.aluminum, 8);

    // Glowing Glass Ticket Counter Showcase
    box(dg, [bayW - 0.85, 2.55, 0.14], [cx, 1.45, D * 0.5 - 0.65], bank.dispBus, { castShadow: false });
    // Ticket desk ledge
    box(g, [bayW - 1.2, 0.12, 0.55], [cx, 1.05, D * 0.5 - 0.35], bank.marbleWhite);

    // Waiting Passenger Bench in front of each counter
    box(g, [2.4, 0.08, 0.46], [cx, 0.58, D * 0.5 + 1.35], bank.royalTerracotta);
    for (const lx of [-0.95, 0.95]) {
      box(g, [0.10, 0.44, 0.42], [cx + lx, 0.36, D * 0.5 + 1.35], bank.steelDark);
    }

    // Individual Illuminated Bus Counter Signboard!
    addSignBox(
      dg,
      bank,
      { title: cInfo.name, subtitle: cInfo.sub, bg: cInfo.bg, accent: cInfo.accent, width: 512, height: 164 },
      [cx, 3.85, D * 0.5 + 2.68],
      0,
      bayW - 0.32,
      1.18,
    );

    // Upper floor office windows
    for (let f = 0; f < 2; f++) {
      const fy = gfH + f * 3.2 + 1.55;
      const lit = rnd() > 0.42;
      box(lit ? dg : g, [bayW * 0.66, 1.6, 0.16], [cx, fy, D * 0.5 + 0.04], lit ? bank.warmWindowLit : bank.glassCurtain, { castShadow: false });
    }
  }
  // Right end pillar
  box(g, [0.42, gfH, 0.55], [W * 0.5, gfH * 0.5, D * 0.5 - 0.25], bank.modernSlate);

  // Rooftop Main Strip Banner
  addSignBox(
    dg,
    bank,
    {
      title: 'রয়্যালের মোড় আন্তঃজেলা বাস কাউন্টার সমূহ',
      subtitle: 'ROYAL MORE BUS COUNTERS · KHULNA — DHAKA — CHATTOGRAM — SYLHET',
      bg: '#064e3b',
      fg: '#ffffff',
      accent: '#fde047',
      border: '#fde047',
      width: 640,
    },
    [0, totalH + 1.55, D * 0.5 + 0.32],
    0,
    18.0,
    1.8,
  );
}

function buildLuxuryCoachBus(staticG, dynamicG, bank, { x, z, rotY, bodyMat, title, subtitle, bg }) {
  const bus = new THREE.Group();
  bus.position.set(x, 0.04, z);
  bus.rotation.y = rotY;
  staticG.add(bus);

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
  box(bus, [2.52, 2.55, 11.4], [0, 1.78, 0], bodyMat);
  box(bus, [2.56, 0.22, 11.45], [0, 1.22, 0], bank.busAccent);
  box(bus, [2.36, 1.05, 0.14], [0, 2.25, 5.72], bank.glassCurtain);
  for (const sx of [-1.27, 1.27]) {
    box(bus, [0.06, 1.05, 9.8], [sx, 2.28, -0.2], bank.glassCurtain);
  }
  box(bus, [1.65, 0.34, 3.4], [0, 3.22, 0.4], bank.modernWhite);
  for (const sx of [-0.85, 0.85]) {
    box(bus, [0.36, 0.18, 0.08], [sx, 0.85, 5.72], bank.lampGlow);
  }
  addSignBox(
    dynamicG,
    bank,
    { title, subtitle, bg, accent: '#fde047' },
    [x + Math.cos(rotY) * 1.32, 1.55, z - Math.sin(rotY) * 1.32],
    rotY + Math.PI * 0.5,
    4.6,
    0.58,
  );
}

/* ============================================================================
 * 6. ARTICULATED COMMERCIAL PLAZA HELPER & KMP TRAFFIC POLICE BOX
 * ========================================================================== */
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

  box(g, [w + 2.4, 0.16, d + 3.2], [0, 0.08, 0.8], bank.footpath, { castShadow: false, uvScale: 2.2 });
  box(g, [w + 0.2, 0.42, d + 0.2], [0, 0.21, 0], bank.darkConcrete);

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
      box(g, [bayW * 0.58, 1.55, 0.14], [bx, fy + 1.55, -d * 0.5 - 0.04], bank.glassCurtain, { castShadow: false });
    }
  }

  box(g, [w + 0.35, 0.95, 0.24], [0, totalH + 0.48, d * 0.5], accentMat);
  box(g, [w + 0.35, 0.95, 0.24], [0, totalH + 0.48, -d * 0.5], accentMat);
  box(g, [0.24, 0.95, d], [-w * 0.5, totalH + 0.48, 0], accentMat);
  box(g, [0.24, 0.95, d], [w * 0.5, totalH + 0.48, 0], accentMat);
  box(g, [3.4, 2.35, 3.6], [-w * 0.18, totalH + 1.18, 0], trimMat);
  cylinder(g, 0.65, 0.68, 1.4, [w * 0.22, totalH + 1.15, -1.2], bank.waterTank, 10);

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
 * Builds the complete Ultra-Detailed Royal More / Chingri Chattar (খুলনা রয়্যালের মোড়) district.
 */
export function buildRoyalMoreDistrict(parent, m) {
  const root = new THREE.Group();
  root.name = 'KhulnaLandmark_RoyalMore';
  const staticG = new THREE.Group();
  const dynamicG = new THREE.Group();
  root.add(staticG, dynamicG);
  parent.add(root);

  const bank = createRoyalBank(m);

  // 1) Urban Paved Ground + Exact OSM Roads + Continuous Raised Pedestrian Footpaths (ফুটপাত)
  buildRoyalMoreRoadsAndFootpaths(staticG, dynamicG, bank);

  // 2) Authentic Chingri Chattar (চিংড়ি চত্বর) 3-Golda-Prawn Fountain at (-716.8, -291.8)
  const fountainJets = buildChingriChattarMonument(staticG, dynamicG, bank);

  // 3) Hotel Royal International (10-story iconic landmark, est. 1986)
  buildHotelRoyalInternational(staticG, dynamicG, bank);

  // 4) Prominent Hotel Castle Salam (7-story flagship luxury hotel on KDA Avenue South)
  buildHotelCastleSalam(staticG, dynamicG, bank);

  // 5) Complete Royal More Inter-District Bus Counter Strip (Green Line, Sohagh, Hanif, Ena, Eagle, Tungipara)
  buildBusCounterStrip(staticG, dynamicG, bank);

  // 2 Parked Luxury AC Coaches neatly in the KDA Avenue Bus Counter Layby
  buildLuxuryCoachBus(staticG, dynamicG, bank, {
    x: -786.0,
    z: -267.8,
    rotY: Math.PI * 0.52,
    bodyMat: bank.busGreen,
    title: 'GREEN LINE · ঢাকা — খুলনা (AC)',
    subtitle: 'ROYAL MORE COUNTER · ROYAL COACH',
    bg: '#064e3b',
  });
  buildLuxuryCoachBus(staticG, dynamicG, bank, {
    x: -811.5,
    z: -269.6,
    rotY: Math.PI * 0.56,
    bodyMat: bank.busRed,
    title: 'SOHAGH PARIBAHAN · SCANIA AC',
    subtitle: 'খুলনা রয়্যাল মোড় — ঢাকা এক্সপ্রেস',
    bg: '#7f1d1d',
  });

  // 6) SE Corner Commercial Plaza (fills the SE Khan Jahan Ali Rd corner so zero empty field!)
  buildRoyalCornerBuilding(staticG, dynamicG, bank, {
    cx: -702.0,
    cz: -250.0,
    rotY: Math.PI - 0.35,
    w: 20.0,
    d: 13.0,
    floors: 5,
    wallMat: bank.royalSand,
    trimMat: bank.marbleWhite,
    accentMat: bank.royalTerracotta,
    shopMat: bank.dispSweets,
    signTitle: 'রয়েল সিটি মার্কেট · ফার্মেসি · টেলিকম',
    signSub: 'KHAN JAHAN ALI ROAD · ROYAL MORE SOUTH',
    signBg: '#1e293b',
    seed: 418,
  });

  // 7) Royal More NE Corner Commercial Arcade (Royal Sweets, Pharmacy & Islami Bank ATM)
  buildRoyalCornerBuilding(staticG, dynamicG, bank, {
    cx: -688.0,
    cz: -318.0,
    rotY: -0.68,
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

  // 8) Fatima Hospital & Diagnostic Center (East side of NW Khan Jahan Ali Rd)
  buildRoyalCornerBuilding(staticG, dynamicG, bank, {
    cx: -720.0,
    cz: -350.0,
    rotY: -Math.PI * 0.38,
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

  // 9) Kacchi Ghor & Prime Bank 24/7 ATM Plaza (North side of KDA Avenue)
  buildRoyalCornerBuilding(staticG, dynamicG, bank, {
    cx: -808.0,
    cz: -306.0,
    rotY: 0.08,
    w: 22.0,
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

  // 10) KMP Traffic Police Control Box on NE Roundabout Apron
  buildKmpTrafficBox(staticG, dynamicG, bank, -701.2, -301.0);

  // 11) Roadside Utility Poles with Bengali Posters & Parked CNG / Easybike
  const poleSpots = [
    [-703.5, -274.5, 0.5],
    [-684.0, -288.0, 2.5],
    [-732.0, -308.0, -0.8],
    [-752.0, -296.0, 1.5],
    [-754.0, -266.0, -1.5],
    [-796.0, -267.0, -1.5],
  ];
  for (let i = 0; i < poleSpots.length; i++) {
    const [px, pz, pyaw] = poleSpots[i];
    cylinder(staticG, 0.10, 0.15, 8.8, [px, 4.4, pz], bank.concrete, 8);
    decorateCorridorPole(dynamicG, px, pz, pyaw, 910 + i);
  }

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
  standEasy.position.set(-758.0, 0.05, -267.5);
  standEasy.rotation.y = 1.65;
  staticG.add(standEasy);

  for (const [px, pz, h, sd] of [
    [-702.5, -306.0, 7.6, 901],
    [-718.0, -265.0, 7.4, 902],
    [-746.0, -322.0, 7.8, 903],
    [-770.0, -266.0, 7.2, 904],
  ]) {
    addOrnamentalPalm(staticG, bank, px, pz, h, sd);
  }

  // Safely normalize (non-indexed + position/normal/uv) & batch all static meshes for locked 60+ FPS!
  staticG.updateWorldMatrix(true, true);
  const invRoot = staticG.matrixWorld.clone().invert();
  const buckets = new Map();
  staticG.traverse((obj) => {
    if (!obj.isMesh || obj.isInstancedMesh || Array.isArray(obj.material) || !obj.material) return;
    const key = `${obj.material.uuid}-${obj.castShadow}-${obj.receiveShadow}`;
    if (!buckets.has(key)) {
      buckets.set(key, { material: obj.material, cast: obj.castShadow, receive: obj.receiveShadow, meshes: [], geometries: [] });
    }
    const b = buckets.get(key);
    const g = obj.geometry.index ? obj.geometry.toNonIndexed() : obj.geometry.clone();
    g.applyMatrix4(invRoot.clone().multiply(obj.matrixWorld));
    g.clearGroups();
    for (const attr of Object.keys(g.attributes)) {
      if (attr !== 'position' && attr !== 'normal' && attr !== 'uv') g.deleteAttribute(attr);
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) {
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    }
    b.meshes.push(obj);
    b.geometries.push(g);
  });
  for (const b of buckets.values()) {
    if (b.meshes.length < 2) continue;
    const merged = mergeGeometries(b.geometries, false);
    for (const g of b.geometries) g.dispose();
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, b.material);
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.receive;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    for (const orig of b.meshes) orig.removeFromParent();
    staticG.add(mesh);
  }

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
      for (let i = 0; i < fountainJets.length; i++) {
        const j = fountainJets[i];
        const s = 0.94 + Math.sin(time * 5.4 + j.phase) * 0.09;
        j.mesh.scale.set(1, s, 1);
      }
    },
  };
}
