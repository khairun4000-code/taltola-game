import * as THREE from 'three';
import { box, cylinder, rodBetween, mergeStaticMeshes } from './scene-utils.js';
import { attachDerivedPBRMaps } from './aaa-shaders.js';

/**
 * KHAN JAHAN ALI ROAD (N7) HIGH-DETAIL CORRIDOR & ROADSIDE NEIGHBORHOOD:
 * ROYAL MORE (রয়্যাল মোড়) <-> PTI MORE (পিটিআই মোড়) <-> KABORKHANA MORE (কবরখানা মোড়)
 *
 * Performance-First Architecture (Locked 60+ FPS, Full Native Resolution):
 *  - Split into 4 tight spatial culling slices (~320m radius) so only 1-2 slices render at once.
 *  - ALL static geometry (roads, footpaths, drains, buildings, balconies, AC units, tanks, walls,
 *    poles, wires, trees) batched via mergeStaticMeshes() per slice (~15 draw calls per slice!).
 *  - ALL 16 Bengali/English Khulna shop signboards packed into ONE 2048x1024 shared texture atlas
 *    and merged into 1 single GPU draw call per slice.
 *  - Zero extra dynamic PointLights (uses crisp emissive materials that smoothly brighten at night).
 */

export const KABORKHANA_MORE_CENTER = { x: -20.0, z: 104.5 };

const FOOTPATH_H = 0.20;

const ROYAL_TO_MID_PTS = [
  [-648.0, -250.5],
  [-620.0, -231.5],
  [-582.0, -207.5],
  [-548.5, -187.5],
  [-515.5, -167.5],
];

const MID_TO_PTI_PTS = [
  [-517.0, -168.4],
  [-477.5, -144.5],
  [-450.0, -128.0],
  [-409.5, -104.2],
  [-388.0, -91.8],
];

const PTI_TO_BABUKHAN_PTS = [
  [-238.0, 31.8],
  [-211.0, 64.5],
  [-195.0, 88.0],
  [-179.4, 94.2],
  [-158.0, 95.6],
];

const BABUKHAN_TO_KABORKHANA_PTS = [
  [-160.0, 95.4],
  [-110.0, 99.0],
  [-50.6, 101.8],
  [-24.3, 103.5],
  [-10.6, 107.7],
  [49.3, 142.0],
];

const HAJI_MOHSIN_LINK_PTS = [
  [-10.6, 107.7],
  [-7.8, 83.5],
  [-4.5, 52.4],
  [-1.0, 41.0],
];

const TUTPARA_LINK_PTS = [
  [-50.6, 101.8],
  [-39.0, 124.0],
  [-28.0, 144.0],
];

const BABU_KHAN_LINK_PTS = [
  [-193.0, 87.0],
  [-190.5, 56.0],
];

const CENTRAL_RD_LINK_PTS = [
  [-179.0, 94.2],
  [-175.0, 126.0],
];

const KHULNA_SIGN_CATALOG = [
  { title: 'খুলনা মেডিকেল ফার্মেসি', sub: '24 HR MEDICINE · KHAN JAHAN ALI RD', bg: '#065f46', accent: '#fde047' },
  { title: 'অঙ্কুর ডায়াগনস্টিক সেন্টার', sub: 'ANKUR DIAGNOSTIC · PATHOLOGY & X-RAY', bg: '#1e3a8a', accent: '#93c5fd' },
  { title: 'ন্যাশনাল ডায়াগনস্টিক ও হাসপাতাল', sub: 'NATIONAL DIAGNOSTIC · KHULNA', bg: '#0c4a6e', accent: '#fde047' },
  { title: 'প্রাইম ব্যাংক এটিএম বুথ', sub: 'PRIME BANK 24/7 ATM · KABORKHANA', bg: '#047857', accent: '#ffffff' },
  { title: 'চয়নিকা ফার্মেসি এন্ড স্টোর', sub: 'CAYNIKA PHARMACY · BABU KHAN RD', bg: '#7c2d12', accent: '#fef08a' },
  { title: 'রয়্যাল বেকারি এন্ড সুইটস', sub: 'FRESH SWEETS, CAKE & TEA · N7', bg: '#991b1b', accent: '#fde047' },
  { title: 'সুন্দরবন হার্ডওয়্যার ও স্যানিটারি', sub: 'TILES · PAINT · PIPE FITTINGS', bg: '#1e293b', accent: '#38bdf8' },
  { title: 'খুলনা মোটরস ও পার্টস হাউস', sub: 'HONDA · YAMAHA · BAJAJ SPARE PARTS', bg: '#0f172a', accent: '#f97316' },
  { title: 'মদিনা স্টীল এন্ড ফার্নিচার', sub: 'ALMIRAH · BED · OFFICE FURNITURE', bg: '#3f6212', accent: '#fef08a' },
  { title: 'খানজাহান আলী বুক হাউস', sub: 'STATIONERY · PHOTOCOPY · PRINTING', bg: '#1d4ed8', accent: '#ffffff' },
  { title: 'মা-বাবার দোয়া টি স্টল ও হোটেল', sub: 'গরম চা · পরোটা · নাস্তা · KHULNA', bg: '#78350f', accent: '#fde047' },
  { title: 'টুটপাড়া ইলেকট্রিক এন্ড মোবাইল', sub: 'BKASH · NAGAD · FLEXILOAD · AC SERVICE', bg: '#581c87', accent: '#f0abfc' },
  { title: 'জাহানারা ভবন · কমার্শিয়াল কমপ্লেক্স', sub: 'JAHANARA VABON · KHAN JAHAN ALI RD', bg: '#064e3b', accent: '#d9ed9c' },
  { title: 'আহসান মঞ্জিল · ডেন্টাল কেয়ার', sub: 'DR. PRODIP & SPECIALIST CHAMBER', bg: '#0e7490', accent: '#fef08a' },
  { title: 'নাজমুল এন্ড সন্স স্টীল হাউস', sub: 'MS ROD · CEMENT · HARDWARE DEALER', bg: '#334155', accent: '#facc15' },
  { title: 'খুলনা কম্পিউটার ও আইটি জোন', sub: 'LAPTOP · PRINTER · INTERNET SERVICE', bg: '#1e1b4b', accent: '#38bdf8' },
];

function seeded(seed = 2026) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makePitchTexture({ seedVal = 4071, centerDash = true, edgeLines = true, dustyShoulder = true } = {}) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  ctx.fillStyle = '#25292e';
  ctx.fillRect(0, 0, S, S);

  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(16, 18, 22, 0.30)' : 'rgba(54, 58, 66, 0.22)';
    ctx.fillRect(34 + rnd() * (S - 68), rnd() * S, 24 + rnd() * 64, 22 + rnd() * 58);
  }

  for (const lx of [S * 0.24, S * 0.37, S * 0.63, S * 0.76]) {
    const g = ctx.createLinearGradient(lx - 24, 0, lx + 24, 0);
    g.addColorStop(0, 'rgba(14,16,20,0)');
    g.addColorStop(0.5, 'rgba(12,14,18,0.28)');
    g.addColorStop(1, 'rgba(14,16,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(lx - 24, 0, 48, S);
  }

  for (let i = 0; i < 6200; i++) {
    const v = 30 + Math.floor(rnd() * 44);
    ctx.fillStyle = `rgba(${v},${v + 1},${v + 3},${0.20 + rnd() * 0.28})`;
    const sz = 1.2 + rnd() * 2.3;
    ctx.fillRect(rnd() * S, rnd() * S, sz, sz);
  }

  if (dustyShoulder) {
    const lg = ctx.createLinearGradient(0, 0, 34, 0);
    lg.addColorStop(0, 'rgba(116, 102, 82, 0.50)');
    lg.addColorStop(1, 'rgba(116, 102, 82, 0)');
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, 34, S);
    const rg = ctx.createLinearGradient(S, 0, S - 34, 0);
    rg.addColorStop(0, 'rgba(116, 102, 82, 0.50)');
    rg.addColorStop(1, 'rgba(116, 102, 82, 0)');
    ctx.fillStyle = rg;
    ctx.fillRect(S - 34, 0, 34, S);
  }

  if (edgeLines) {
    ctx.fillStyle = 'rgba(241, 245, 249, 0.76)';
    ctx.fillRect(22, 0, 7, S);
    ctx.fillRect(S - 29, 0, 7, S);
  }

  if (centerDash) {
    ctx.fillStyle = 'rgba(250, 204, 21, 0.88)';
    ctx.fillRect(S * 0.5 - 5, 24, 10, 176);
    ctx.fillRect(S * 0.5 - 5, 280, 10, 176);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeFootpathPaverTexture(seedVal = 4079) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = '#4c3e35';
  ctx.fillRect(0, 0, S, S);
  const rows = 8;
  const cols = 4;
  const bh = S / rows;
  const bw = S / cols;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (bw * 0.5);
    for (let col = -1; col <= cols; col++) {
      const bx = col * bw + off;
      const by = r * bh;
      const isRed = (r + col) % 3 !== 0;
      if (isRed) {
        ctx.fillStyle = `rgb(${156 + Math.floor(rnd() * 28)},${62 + Math.floor(rnd() * 18)},${48 + Math.floor(rnd() * 14)})`;
      } else {
        const v = 136 + Math.floor(rnd() * 26);
        ctx.fillStyle = `rgb(${v},${v - 2},${v - 6})`;
      }
      ctx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function makeCurbStripeTexture(colorA = '#facc15', colorB = '#18181b') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d');
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 === 0 ? colorA : colorB;
    ctx.fillRect(i * 64, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeStuccoTexture(baseHex, seedVal, { brick = false } = {}) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.06)' : `rgba(34,28,22,${0.03 + rnd() * 0.06})`;
    ctx.fillRect(rnd() * S, rnd() * S, 2 + rnd() * 5, 2 + rnd() * 5);
  }
  for (let i = 0; i < 28; i++) {
    const x = rnd() * S;
    const h = 28 + rnd() * 90;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(30,32,26,0.14)');
    g.addColorStop(1, 'rgba(30,32,26,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 3 + rnd() * 7, h);
  }
  if (brick) {
    ctx.strokeStyle = 'rgba(26,18,14,0.24)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < S; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(S, y);
      ctx.stroke();
      const off = ((y / 16) % 2) * 16;
      for (let x = off; x < S; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 16);
        ctx.stroke();
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeShutterTexture(tintHex = '#56646e') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = tintHex;
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 10) {
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(0, y, 256, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, y + 6, 256, 4);
  }
  const grime = ctx.createLinearGradient(0, 150, 0, 256);
  grime.addColorStop(0, 'rgba(55,42,30,0)');
  grime.addColorStop(1, 'rgba(55,42,30,0.34)');
  ctx.fillStyle = grime;
  ctx.fillRect(0, 150, 256, 106);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeShopShowcaseTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1b2836';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(10, 14, 236, 14);
  const cols = ['#ef4444', '#38bdf8', '#facc15', '#22c55e', '#f97316'];
  for (let y = 52; y < 220; y += 44) {
    ctx.fillStyle = '#475569';
    ctx.fillRect(16, y + 32, 224, 5);
    for (let x = 22; x < 224; x += 22) {
      ctx.fillStyle = cols[(x + y) % cols.length];
      ctx.fillRect(x, y + 8, 14, 24);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Packs ALL 16 Khulna Bengali shop signboards into ONE 2048x1024 atlas texture
 * so every shopfront sign along the corridor shares ONE material & ONE draw call!
 */
function makeSignAtlasTexture() {
  const W = 2048;
  const H = 1024;
  const cols = 4;
  const rows = 4;
  const cw = W / cols;
  const ch = H / rows;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  for (let i = 0; i < 16; i++) {
    const item = KHULNA_SIGN_CATALOG[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x0 = col * cw;
    const y0 = row * ch;

    ctx.fillStyle = item.bg;
    ctx.fillRect(x0, y0, cw, ch);

    const g = ctx.createLinearGradient(x0, y0, x0, y0 + ch);
    g.addColorStop(0, 'rgba(255,255,255,0.14)');
    g.addColorStop(0.5, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = g;
    ctx.fillRect(x0, y0, cw, ch);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(x0 + 8, y0 + 8, cw - 16, ch - 16);

    ctx.fillStyle = item.accent;
    ctx.fillRect(x0 + 18, y0 + 18, 10, ch - 36);

    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = 'bold 34px "Noto Sans Bengali", "Segoe UI", sans-serif';
    ctx.fillText(item.title, x0 + 40, y0 + ch * 0.39, cw - 58);

    ctx.fillStyle = item.accent;
    ctx.font = '600 20px "Manrope", "Noto Sans Bengali", sans-serif';
    ctx.fillText(item.sub, x0 + 40, y0 + ch * 0.72, cw - 58);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeSignTexture({ title, subtitle = '', bg = '#065f46', fg = '#ffffff', accent = '#fde047', border = '#ffffff' }) {
  const W = 768;
  const H = 200;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = border;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.fillStyle = accent;
  ctx.fillRect(20, 20, 12, H - 40);

  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 42px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText(title, 48, subtitle ? H * 0.38 : H * 0.50, W - 72);
  if (subtitle) {
    ctx.fillStyle = accent;
    ctx.font = '600 24px "Manrope", "Noto Sans Bengali", sans-serif';
    ctx.fillText(subtitle, 48, H * 0.72, W - 72);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function createCorridorBank(m) {
  const mkPitch = (opts, polyFactor) => {
    const tex = makePitchTexture(opts);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.74,
      metalness: 0.05,
      envMapIntensity: 0.50,
      polygonOffset: true,
      polygonOffsetFactor: polyFactor,
      polygonOffsetUnits: polyFactor,
    });
    attachDerivedPBRMaps(mat, tex, { strength: 2.0, roughBase: 0.74, normalScale: 0.64 });
    return mat;
  };

  const mkWall = (hex, seedVal, rough = 0.82, brick = false) => {
    const tex = makeStuccoTexture(hex, seedVal, { brick });
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: rough, metalness: 0.02, envMapIntensity: 0.55 });
    attachDerivedPBRMaps(mat, tex, { strength: brick ? 2.4 : 1.7, roughBase: rough, normalScale: 0.62 });
    return mat;
  };

  const pitchHighway = mkPitch({ seedVal: 4071, centerDash: true, edgeLines: true, dustyShoulder: true }, -2);
  const pitchSideRoad = mkPitch({ seedVal: 4073, centerDash: false, edgeLines: true, dustyShoulder: true }, -2);
  const pitchJunction = mkPitch({ seedVal: 4075, centerDash: false, edgeLines: false, dustyShoulder: false }, -3);
  pitchJunction.map.repeat.set(3.2, 3.2);

  const fpTex = makeFootpathPaverTexture(4079);
  const footpathMat = new THREE.MeshStandardMaterial({ map: fpTex, roughness: 0.84, metalness: 0.02 });
  attachDerivedPBRMaps(footpathMat, fpTex, { strength: 2.2, roughBase: 0.84, normalScale: 0.66 });

  const shutterSteelTex = makeShutterTexture('#586770');
  const shutterBlueTex = makeShutterTexture('#244d6e');
  const shutterSteel = new THREE.MeshStandardMaterial({ map: shutterSteelTex, roughness: 0.48, metalness: 0.60 });
  const shutterBlue = new THREE.MeshStandardMaterial({ map: shutterBlueTex, roughness: 0.46, metalness: 0.56 });

  const showcaseTex = makeShopShowcaseTexture();
  const shopShowcase = new THREE.MeshStandardMaterial({
    map: showcaseTex,
    emissive: 0xffe4a0,
    emissiveMap: showcaseTex,
    emissiveIntensity: 0.55,
    roughness: 0.20,
  });

  const signAtlasTex = makeSignAtlasTexture();
  const signAtlasMat = new THREE.MeshStandardMaterial({
    map: signAtlasTex,
    emissive: 0xffffff,
    emissiveMap: signAtlasTex,
    emissiveIntensity: 0.34,
    roughness: 0.30,
    metalness: 0.06,
  });

  const taltolaRoad = m?.road || pitchHighway;
  const bank = {
    pitchHighway: taltolaRoad,
    pitchSideRoad: taltolaRoad,
    pitchJunction: taltolaRoad,
    footpath: footpathMat,
    curbHazard: new THREE.MeshStandardMaterial({ map: makeCurbStripeTexture('#facc15', '#18181b'), roughness: 0.72 }),
    curbMedian: new THREE.MeshStandardMaterial({ map: makeCurbStripeTexture('#f8fafc', '#18181b'), roughness: 0.72 }),
    roadWhite: new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.76,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    }),
    // Shared Khulna Building Material Palette (zero per-building material explosion!)
    wallCream: mkWall('#ece2cf', 6101, 0.80),
    wallTerracotta: mkWall('#ba664a', 6102, 0.84),
    wallSage: mkWall('#96afa0', 6103, 0.82),
    wallOchre: mkWall('#c89a60', 6104, 0.84),
    wallWhite: mkWall('#e8edf2', 6105, 0.74),
    wallBrick: mkWall('#984534', 6106, 0.88, true),
    dampPlinth: mkWall('#40423c', 6107, 0.92),
    shutterSteel,
    shutterBlue,
    shopShowcase,
    signAtlas: signAtlasMat,
    windowGlass: new THREE.MeshPhysicalMaterial({ color: 0x1c4256, roughness: 0.10, metalness: 0.16, clearcoat: 0.90, envMapIntensity: 1.4 }),
    warmWindowLit: new THREE.MeshStandardMaterial({ color: 0xffebb8, emissive: 0xffcf70, emissiveIntensity: 0.32, roughness: 0.24 }),
    steelDark: new THREE.MeshStandardMaterial({ color: 0x1e252c, roughness: 0.44, metalness: 0.74 }),
    aluminum: new THREE.MeshStandardMaterial({ color: 0xd0d8e0, roughness: 0.26, metalness: 0.86 }),
    poleConcrete: new THREE.MeshStandardMaterial({ color: 0x8f9490, roughness: 0.90 }),
    waterTank: new THREE.MeshStandardMaterial({ color: 0x141d22, roughness: 0.38, metalness: 0.12 }),
    acBox: new THREE.MeshStandardMaterial({ color: 0xdce2e6, roughness: 0.48 }),
    woodDoor: new THREE.MeshStandardMaterial({ color: 0x6b3f23, roughness: 0.78 }),
    tinBlue: new THREE.MeshStandardMaterial({ color: 0x1f5c7a, roughness: 0.48, metalness: 0.48 }),
    whitePlaster: m.whiteBand || new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.80 }),
    emeraldDark: new THREE.MeshStandardMaterial({ color: 0x0f3d2e, roughness: 0.60 }),
    emeraldMat: new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.50 }),
    foliage: new THREE.MeshStandardMaterial({ color: 0x2c6b36, roughness: 0.88 }),
    trunk: m.trunk || new THREE.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.90 }),
    goldMat: new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.30, metalness: 0.82 }),
    wire: m.wire || new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 }),
    lampBulb: new THREE.MeshStandardMaterial({ color: 0xfff8e6, emissive: 0xffdf99, emissiveIntensity: 1.25 }),
    emissiveList: [],
  };

  bank.emissiveList.push(
    { mat: bank.lampBulb, day: 0.9, night: 3.4 },
    { mat: bank.warmWindowLit, day: 0.25, night: 1.85 },
    { mat: bank.shopShowcase, day: 0.52, night: 1.65 },
    { mat: bank.signAtlas, day: 0.32, night: 1.48 },
  );
  return bank;
}

/**
 * Single continuous mitered Bangladeshi pitch-asphalt ribbon along a polyline.
 */
function addPitchRoadAlongPolyline(staticG, pts, roadHalfW, mat, yTop = 0.002) {
  if (!pts || pts.length < 2) return;
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i];
    let nx = 0;
    let nz = 0;
    if (i > 0) {
      const dx = x - pts[i - 1][0];
      const dz = z - pts[i - 1][1];
      const l = Math.hypot(dx, dz) || 1;
      nx += -dz / l;
      nz += dx / l;
    }
    if (i < pts.length - 1) {
      const dx = pts[i + 1][0] - x;
      const dz = pts[i + 1][1] - z;
      const l = Math.hypot(dx, dz) || 1;
      nx += -dz / l;
      nz += dx / l;
    }
    const nl = Math.hypot(nx, nz) || 1;
    nx /= nl;
    nz /= nl;

    const lx = x - nx * roadHalfW;
    const lz = z - nz * roadHalfW;
    const rx = x + nx * roadHalfW;
    const rz = z + nz * roadHalfW;
    positions.push(lx, yTop, lz, rx, yTop, rz);
    normals.push(0, 1, 0, 0, 1, 0);
    uvs.push(lx / 5.5, lz / 5.5, rx / 5.5, rz / 5.5);

    if (i > 0) {
      const b = (i - 1) * 2;
      indices.push(b, b + 1, b + 3, b, b + 3, b + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  staticG.add(mesh);
}

function addPitchJunctionDisc(staticG, cx, cz, radius, mat, yTop = 0.003) {
  const geo = new THREE.CircleGeometry(radius, 32);
  geo.rotateX(-Math.PI * 0.5);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (cx + pos.getX(i)) / 5.5, (cz + pos.getZ(i)) / 5.5);
  }
  uv.needsUpdate = true;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(cx, yTop, cz);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  staticG.add(mesh);
}

function addRotBox(parent, size, pos, mat, rotY = 0, opts = {}) {
  const mesh = box(parent, size, pos, mat, opts);
  if (rotY) mesh.rotation.y = rotY;
  return mesh;
}

/**
 * Adds a signboard plane mapped to cell `signIdx` (0..15) of the shared 4x4 Sign Atlas.
 * Because all signboards use `bank.signAtlas`, mergeStaticMeshes(dynamicG) collapses them into 1 draw call!
 */
function addAtlasSignQuad(parent, bank, signIdx, w, h, localPos, facingSign) {
  const col = signIdx % 4;
  const row = Math.floor(signIdx / 4);
  const u0 = col * 0.25 + 0.002;
  const u1 = (col + 1) * 0.25 - 0.002;
  const v1 = 1.0 - row * 0.25 - 0.004;
  const v0 = 1.0 - (row + 1) * 0.25 + 0.004;

  const geo = new THREE.PlaneGeometry(w, h);
  const uv = geo.attributes.uv;
  uv.setXY(0, u0, v1);
  uv.setXY(1, u1, v1);
  uv.setXY(2, u0, v0);
  uv.setXY(3, u1, v0);
  uv.needsUpdate = true;

  const mesh = new THREE.Mesh(geo, bank.signAtlas);
  mesh.position.set(localPos[0], localPos[1], localPos[2]);
  mesh.rotation.y = facingSign > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

function addSignBox(dynamicG, bank, opts, pos, rotY, w, h) {
  const tex = makeSignTexture(opts);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: 0.36,
    roughness: 0.30,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });
  bank.emissiveList.push({ mat, day: 0.34, night: 1.50 });
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);
  g.rotation.y = rotY;
  g.add(
    new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.12), bank.steelDark),
    new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.145), mat),
  );
  dynamicG.add(g);
  return g;
}

/**
 * Adds raised walkable red-brick footpaths + black-yellow curbs + storm-drain gratings along a polyline.
 */
function addFootpathsAlongPolyline(staticG, bank, pts, roadHalfW, walkW, clearanceDiscs, footpathZones) {
  const curbW = 0.24;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const totalLen = Math.hypot(dx, dz);
    if (totalLen < 1.0) continue;
    const ux = dx / totalLen;
    const uz = dz / totalLen;
    const nx = -uz;
    const nz = ux;
    const yaw = Math.atan2(dx, dz);

    const steps = Math.max(1, Math.ceil(totalLen / 8.0));
    const chunkLen = totalLen / steps;
    for (let s = 0; s < steps; s++) {
      const tMid = (s + 0.5) / steps;
      const cx = x0 + dx * tMid;
      const cz = z0 + dz * tMid;

      for (const side of [-1, 1]) {
        const fpOff = roadHalfW + curbW + walkW * 0.5;
        const curbOff = roadHalfW + curbW * 0.5;
        const fx = cx + nx * side * fpOff;
        const fz = cz + nz * side * fpOff;

        let blocked = false;
        for (const [jx, jz, jr] of clearanceDiscs) {
          if (Math.hypot(fx - jx, fz - jz) < jr) {
            blocked = true;
            break;
          }
        }
        if (blocked) continue;

        const hStagger = FOOTPATH_H + ((i + s) % 2) * 0.002;
        addRotBox(
          staticG,
          [walkW, hStagger, chunkLen + 0.35],
          [fx, hStagger * 0.5, fz],
          bank.footpath,
          yaw,
          { castShadow: false, uvScale: 2.0 },
        );
        addRotBox(
          staticG,
          [curbW, hStagger + 0.02, chunkLen + 0.38],
          [cx + nx * side * curbOff, (hStagger + 0.02) * 0.5, cz + nz * side * curbOff],
          bank.curbHazard,
          yaw,
          { castShadow: false, uvScale: 1.8 },
        );

        // Concrete storm-drain manhole cover every ~24m on footpath
        if ((i + s) % 3 === 1) {
          addRotBox(
            staticG,
            [0.62, 0.03, 0.72],
            [cx + nx * side * (roadHalfW + 0.72), hStagger + 0.015, cz + nz * side * (roadHalfW + 0.72)],
            bank.poleConcrete,
            yaw,
            { castShadow: false },
          );
        }

        footpathZones.push({
          x0: x0 + dx * (s / steps) + nx * side * fpOff,
          z0: z0 + dz * (s / steps) + nz * side * fpOff,
          x1: x0 + dx * ((s + 1) / steps) + nx * side * fpOff,
          z1: z0 + dz * ((s + 1) / steps) + nz * side * fpOff,
          halfW: walkW * 0.5 + 0.25,
        });
      }
    }
  }
}

/**
 * Adds KCC central median divider, LED streetlamps, concrete utility poles & overhead electric cables.
 */
function addMedianPolesAndLamps(staticG, dynamicG, bank, pts, clearanceDiscs, colliders, { lampSpacing = 36, withMedian = true } = {}) {
  let distSinceLamp = lampSpacing * 0.45;
  const poleWirePts = [];

  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const segLen = Math.hypot(dx, dz);
    if (segLen < 1.0) continue;
    const ux = dx / segLen;
    const uz = dz / segLen;
    const nx = -uz;
    const nz = ux;
    const yaw = Math.atan2(dx, dz);

    if (withMedian) {
      const steps = Math.max(1, Math.ceil(segLen / 10.0));
      const chunkLen = segLen / steps;
      for (let s = 0; s < steps; s++) {
        const tMid = (s + 0.5) / steps;
        const mx = x0 + dx * tMid;
        const mz = z0 + dz * tMid;
        let blocked = false;
        for (const [jx, jz, jr] of clearanceDiscs) {
          if (Math.hypot(mx - jx, mz - jz) < jr + 4.0) {
            blocked = true;
            break;
          }
        }
        if (blocked) continue;
        addRotBox(staticG, [0.76, 0.24, chunkLen - 0.15], [mx, 0.12, mz], bank.curbMedian, yaw, { castShadow: false, uvScale: 2.0 });
        if ((i + s) % 2 === 0) {
          const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), bank.foliage);
          bush.position.set(mx, 0.48, mz);
          bush.scale.set(0.9, 0.72, 1.3);
          bush.castShadow = false;
          staticG.add(bush);
        }
      }
    }

    let d = distSinceLamp;
    while (d < segLen) {
      const px = x0 + ux * d;
      const pz = z0 + uz * d;
      let blocked = false;
      for (const [jx, jz, jr] of clearanceDiscs) {
        if (Math.hypot(px - jx, pz - jz) < jr + 3.0) {
          blocked = true;
          break;
        }
      }
      if (!blocked) {
        if (withMedian) {
          cylinder(staticG, 0.09, 0.14, 8.2, [px, 4.1, pz], bank.steelDark, 6);
          addRotBox(staticG, [2.6, 0.08, 0.08], [px, 8.15, pz], bank.aluminum, yaw, { castShadow: false });
          for (const side of [-1, 1]) {
            const lx = px + nx * side * 1.25;
            const lz = pz + nz * side * 1.25;
            addRotBox(staticG, [0.46, 0.10, 0.22], [lx, 8.12, lz], bank.steelDark, yaw, { castShadow: false });
            addRotBox(dynamicG, [0.36, 0.05, 0.16], [lx, 8.05, lz], bank.lampBulb, yaw, { castShadow: false });
          }
          colliders.push({ x: px, z: pz, r: 0.45 });
        }

        // Roadside concrete utility pole with crossarm & cobra lamp along footpath edge
        const poleX = px + nx * 7.65;
        const poleZ = pz + nz * 7.65;
        cylinder(staticG, 0.10, 0.15, 9.0, [poleX, 4.5, poleZ], bank.poleConcrete, 6);
        addRotBox(staticG, [0.12, 0.12, 1.45], [poleX, 8.55, poleZ], bank.steelDark, yaw, { castShadow: false });
        if (!withMedian) {
          addRotBox(staticG, [1.5, 0.07, 0.08], [poleX - nx * 0.72, 7.65, poleZ - nz * 0.72], bank.aluminum, yaw, { castShadow: false });
          addRotBox(dynamicG, [0.38, 0.06, 0.18], [poleX - nx * 1.42, 7.60, poleZ - nz * 1.42], bank.lampBulb, yaw, { castShadow: false });
        }
        colliders.push({ x: poleX, z: poleZ, r: 0.35 });
        poleWirePts.push([poleX, 8.6, poleZ]);
      }
      d += lampSpacing;
    }
    distSinceLamp = d - segLen;
  }

  // Overhead electric cables cleanly linking consecutive roadside utility poles
  for (let i = 0; i < poleWirePts.length - 1; i++) {
    const a = poleWirePts[i];
    const b = poleWirePts[i + 1];
    if (Math.hypot(b[0] - a[0], b[2] - a[2]) > lampSpacing * 1.9) continue;
    const mid = [(a[0] + b[0]) * 0.5, 8.05, (a[2] + b[2]) * 0.5];
    rodBetween(staticG, a, mid, 0.016, bank.wire, 4);
    rodBetween(staticG, mid, b, 0.016, bank.wire, 4);
    const lowMid = [(a[0] + b[0]) * 0.5, 6.25, (a[2] + b[2]) * 0.5];
    rodBetween(staticG, [a[0], 6.85, a[2]], lowMid, 0.018, bank.wire, 4);
    rodBetween(staticG, lowMid, [b[0], 6.85, b[2]], 0.018, bank.wire, 4);
  }
}

/**
 * High-detail, low-poly Khulna Commercial-Residential Roadside Building (3-5 stories):
 * Ground-floor shop arcade with shutters + lit showcase + backlit Bengali atlas signboard,
 * upper-floor balconies with steel balustrades, grilled windows, chajjas, AC boxes & Gazi tank.
 */
function buildRoadsideCommercialBuilding(staticG, dynamicG, bank, opts) {
  const {
    cx, cz, yaw, widthX = 9.6, lengthZ = 15.2, floors = 4, facing = 1,
    wallMat = bank.wallCream, shutterMat = bank.shutterSteel, signIdx = 0, seed = 101,
  } = opts;

  const rnd = seeded(seed);
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = yaw;
  staticG.add(g);

  const dg = new THREE.Group();
  dg.position.set(cx, 0, cz);
  dg.rotation.y = yaw;
  dynamicG.add(dg);

  const fDir = facing; // +1 faces +localX, -1 faces -localX
  const frontX = fDir * (widthX * 0.5);
  const groundH = 3.85;
  const floorH = 3.10;
  const totalH = groundH + Math.max(0, floors - 1) * floorH;

  // Damp plinth + ground floor shop arcade + upper stories
  box(g, [widthX + 0.16, 0.42, lengthZ + 0.16], [0, 0.21, 0], bank.dampPlinth, { castShadow: false, uvScale: 2.2 });
  box(g, [widthX - 0.65, groundH, lengthZ], [-fDir * 0.325, groundH * 0.5, 0], bank.wallCream, { uvScale: 2.8 });
  if (floors > 1) {
    const upH = totalH - groundH;
    box(g, [widthX, upH, lengthZ], [0, groundH + upH * 0.5, 0], wallMat, { uvScale: 2.8 });
  }

  // Ground-floor shop bays (alternating corrugated roller shutters & warmly lit showcases)
  const bays = Math.max(2, Math.floor(lengthZ / 4.2));
  const baySpan = lengthZ / bays;
  for (let i = 0; i <= bays; i++) {
    const bz = -lengthZ * 0.5 + i * baySpan;
    const colZ = i === 0 ? bz + 0.24 : (i === bays ? bz - 0.24 : bz);
    box(g, [0.44, groundH, 0.44], [frontX - fDir * 0.22, groundH * 0.5, colZ], bank.wallCream, { castShadow: false });
  }
  const gfFront = frontX - fDir * 0.65;
  for (let b = 0; b < bays; b++) {
    const bz = -lengthZ * 0.5 + (b + 0.5) * baySpan;
    const slotW = baySpan - 0.72;
    if (b % 2 === 1) {
      box(dg, [0.10, 2.48, slotW], [gfFront + fDir * 0.05, 1.34, bz], bank.shopShowcase, { castShadow: false });
      box(g, [0.16, 0.42, slotW], [gfFront + fDir * 0.08, 2.74, bz], shutterMat, { castShadow: false, uvScale: 1.5 });
    } else {
      box(g, [0.14, 2.76, slotW], [gfFront + fDir * 0.06, 1.38, bz], shutterMat, { castShadow: false, uvScale: 1.4 });
    }
  }

  // Recessed signboard fascia backing + crisp Bengali Shop Signboard from shared 16-sign Atlas!
  const signW = Math.min(lengthZ - 1.4, 7.6);
  box(g, [0.18, 0.94, lengthZ - 0.36], [frontX + fDir * 0.10, 3.36, 0], bank.steelDark, { castShadow: false });
  addAtlasSignQuad(dg, bank, signIdx, signW, 0.88, [frontX + fDir * 0.21, 3.36, 0], fDir);
  // Overhanging 1st-floor cornice slab
  box(g, [widthX + 0.65, 0.26, lengthZ + 0.32], [fDir * 0.22, groundH, 0], bank.wallCream, { castShadow: false });

  // Upper floors: alternating recessed balconies & chajja-shaded windows + AC units
  for (let f = 1; f < floors; f++) {
    const baseY = groundH + (f - 1) * floorH;
    const fy = baseY + floorH;
    box(g, [widthX + 0.48, 0.20, lengthZ + 0.22], [fDir * 0.16, fy, 0], bank.wallCream, { castShadow: false });

    for (let b = 0; b < bays; b++) {
      const bz = -lengthZ * 0.5 + (b + 0.5) * baySpan;
      const bw = Math.min(3.0, baySpan - 0.92);
      if ((b + f) % 2 === 0) {
        // Projecting veranda balcony with steel rail
        box(g, [0.95, 0.16, bw], [frontX + fDir * 0.45, baseY + 0.10, bz], bank.wallCream, { castShadow: false });
        box(g, [0.14, 0.40, bw], [frontX + fDir * 0.86, baseY + 0.36, bz], bank.wallCream, { castShadow: false });
        box(g, [0.06, 0.06, bw + 0.04], [frontX + fDir * 0.86, baseY + 1.04, bz], bank.aluminum, { castShadow: false });
        for (const rOff of [-0.32, 0, 0.32]) {
          box(g, [0.04, 0.52, 0.04], [frontX + fDir * 0.86, baseY + 0.78, bz + rOff * bw], bank.steelDark, { castShadow: false });
        }
        box(g, [0.14, 2.15, bw * 0.74], [frontX - fDir * 0.04, baseY + 1.22, bz], bank.windowGlass, { castShadow: false });
      } else {
        // Framed casement window + sunshade chajja + AC unit
        const winMat = rnd() > 0.62 ? bank.warmWindowLit : bank.windowGlass;
        box(rnd() > 0.62 ? dg : g, [0.14, 1.48, bw * 0.70], [frontX + fDir * 0.03, baseY + 1.50, bz], winMat, { castShadow: false });
        box(g, [0.28, 0.12, bw * 0.78], [frontX + fDir * 0.11, baseY + 2.30, bz], bank.wallCream, { castShadow: false });
        if (rnd() > 0.50) {
          box(g, [0.34, 0.50, 0.72], [frontX + fDir * 0.18, baseY + 0.46, bz + bw * 0.24], bank.acBox, { castShadow: false });
        }
      }
    }
  }

  // Rooftop parapet, stairhead mumty & Gazi black overhead water tank
  box(g, [0.22, 0.90, lengthZ], [frontX - fDir * 0.11, totalH + 0.45, 0], wallMat, { castShadow: false });
  box(g, [widthX, 0.90, 0.22], [0, totalH + 0.45, -lengthZ * 0.5 + 0.11], wallMat, { castShadow: false });
  box(g, [widthX, 0.90, 0.22], [0, totalH + 0.45, lengthZ * 0.5 - 0.11], wallMat, { castShadow: false });
  box(g, [3.0, 2.2, 3.2], [-fDir * 1.4, totalH + 1.1, 0], bank.wallCream, { castShadow: false });
  cylinder(g, 0.62, 0.64, 1.32, [fDir * 1.2, totalH + 1.15, -lengthZ * 0.22], bank.waterTank, 8);
}

/**
 * Taltola-Style Bangladeshi Multi-Story Residential House (2-4 stories) with brick compound wall & steel gate.
 */
function buildRoadsideResidentialHouse(staticG, dynamicG, bank, opts) {
  const {
    cx, cz, yaw, widthX = 9.0, lengthZ = 13.4, floors = 3, facing = 1,
    wallMat = bank.wallSage, accentMat = bank.wallCream, seed = 202,
  } = opts;

  const rnd = seeded(seed);
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = yaw;
  staticG.add(g);

  const dg = new THREE.Group();
  dg.position.set(cx, 0, cz);
  dg.rotation.y = yaw;
  dynamicG.add(dg);

  const fDir = facing;
  const frontX = fDir * (widthX * 0.5);
  const wallX = frontX + fDir * 1.35;
  const floorH = 3.05;
  const totalH = floors * floorH;

  // Compound brick boundary wall + steel residential gate + gate pillars
  const segLen = (lengthZ - 3.0) * 0.5;
  box(g, [0.28, 1.95, segLen], [wallX, 0.98, -(1.5 + segLen * 0.5)], bank.wallBrick, { castShadow: false, uvScale: 2.2 });
  box(g, [0.28, 1.95, segLen], [wallX, 0.98, +(1.5 + segLen * 0.5)], bank.wallBrick, { castShadow: false, uvScale: 2.2 });
  box(g, [0.38, 0.14, segLen + 0.1], [wallX, 2.00, -(1.5 + segLen * 0.5)], accentMat, { castShadow: false });
  box(g, [0.38, 0.14, segLen + 0.1], [wallX, 2.00, +(1.5 + segLen * 0.5)], accentMat, { castShadow: false });
  box(g, [0.08, 1.85, 2.84], [wallX, 0.96, 0], bank.shutterBlue, { castShadow: false });
  for (const gz of [-1.52, 1.52]) {
    box(g, [0.46, 2.35, 0.46], [wallX, 1.18, gz], accentMat, { castShadow: false });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), bank.lampBulb);
    globe.position.set(wallX, 2.52, gz);
    dg.add(globe);
  }

  // Main house massing
  box(g, [widthX + 0.16, 0.36, lengthZ + 0.16], [0, 0.18, 0], bank.dampPlinth, { castShadow: false });
  box(g, [widthX, totalH, lengthZ], [0, totalH * 0.5, 0], wallMat, { uvScale: 2.8 });
  box(g, [0.22, totalH, 2.2], [frontX + fDir * 0.06, totalH * 0.5, 0], accentMat, { castShadow: false });

  for (let f = 0; f < floors; f++) {
    const fy = f * floorH;
    box(g, [widthX + 0.44, 0.20, lengthZ + 0.22], [fDir * 0.12, fy + floorH, 0], accentMat, { castShadow: false });
    if (f === 0) {
      box(g, [0.14, 2.20, 1.30], [frontX + fDir * 0.04, 1.15, 0], bank.woodDoor, { castShadow: false });
      box(g, [1.05, 0.14, 2.1], [frontX + fDir * 0.50, 2.48, 0], accentMat, { castShadow: false });
      for (const wz of [-3.6, 3.6]) {
        box(g, [0.14, 1.32, 1.75], [frontX + fDir * 0.04, 1.52, wz], bank.windowGlass, { castShadow: false });
        box(g, [0.30, 0.12, 1.95], [frontX + fDir * 0.12, 2.24, wz], accentMat, { castShadow: false });
      }
    } else {
      const litCenter = rnd() > 0.55;
      box(litCenter ? dg : g, [0.14, 1.48, 1.25], [frontX + fDir * 0.12, fy + 1.52, 0], litCenter ? bank.warmWindowLit : bank.windowGlass, { castShadow: false });
      for (const bz of [-3.6, 3.6]) {
        const bw = 3.0;
        box(g, [0.95, 0.16, bw], [frontX + fDir * 0.46, fy + 0.10, bz], accentMat, { castShadow: false });
        box(g, [0.14, 0.40, bw], [frontX + fDir * 0.88, fy + 0.36, bz], wallMat, { castShadow: false });
        box(g, [0.06, 0.06, bw + 0.04], [frontX + fDir * 0.88, fy + 1.04, bz], bank.aluminum, { castShadow: false });
        box(g, [0.14, 2.05, 1.95], [frontX - fDir * 0.04, fy + 1.18, bz], bank.windowGlass, { castShadow: false });
      }
    }
  }

  // Rooftop parapet + water tank
  box(g, [0.22, 0.88, lengthZ], [frontX - fDir * 0.11, totalH + 0.44, 0], wallMat, { castShadow: false });
  box(g, [2.8, 2.1, 3.0], [-fDir * 1.1, totalH + 1.05, 0], accentMat, { castShadow: false });
  cylinder(g, 0.58, 0.60, 1.28, [fDir * 1.2, totalH + 1.12, -2.4], bank.waterTank, 8);
}

/**
 * Automatically populates both sides of a corridor polyline with authentic Khulna
 * commercial-residential buildings & Taltola-style houses, respecting every junction & landmark clearance!
 */
function populateRoadsideBuildings(staticG, dynamicG, bank, pts, roadHalfW, clearanceDiscs, obbColliders, { seedStart = 700, signOffset = 0 } = {}) {
  const wallPalette = [bank.wallCream, bank.wallTerracotta, bank.wallSage, bank.wallOchre, bank.wallWhite, bank.wallBrick];
  let bIdx = 0;

  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const segLen = Math.hypot(dx, dz);
    if (segLen < 16.0) continue;

    const ux = dx / segLen;
    const uz = dz / segLen;
    const nx = -uz;
    const nz = ux;
    const yaw = Math.atan2(dx, dz);
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);

    const slotStep = 19.5;
    const slots = Math.max(1, Math.floor((segLen - 6.0) / slotStep));
    for (let s = 0; s < slots; s++) {
      const dist = 3.0 + (s + 0.5) * ((segLen - 6.0) / slots);
      const rx = x0 + ux * dist;
      const rz = z0 + uz * dist;

      for (const side of [-1, 1]) {
        const isHouse = (bIdx % 3 === 2);
        const widthX = isHouse ? 9.0 : 9.6;
        const lengthZ = isHouse ? 13.4 : 15.2;
        const setback = roadHalfW + 2.35 + (isHouse ? 1.55 : 0.45) + widthX * 0.5;
        const bx = rx + nx * side * setback;
        const bz = rz + nz * side * setback;

        let blocked = false;
        for (const [jx, jz, jr] of clearanceDiscs) {
          if (Math.hypot(bx - jx, bz - jz) < jr + lengthZ * 0.52) {
            blocked = true;
            break;
          }
        }
        if (blocked) continue;

        const floors = 3 + ((bIdx * 7 + i) % 3); // 3, 4, or 5 stories
        const wallMat = wallPalette[(bIdx + i) % wallPalette.length];
        const facing = -side; // face directly toward the road centerline!

        if (isHouse) {
          buildRoadsideResidentialHouse(staticG, dynamicG, bank, {
            cx: bx,
            cz: bz,
            yaw,
            widthX,
            lengthZ,
            floors: Math.min(4, floors),
            facing,
            wallMat,
            accentMat: bank.wallCream,
            seed: seedStart + bIdx * 31,
          });
        } else {
          buildRoadsideCommercialBuilding(staticG, dynamicG, bank, {
            cx: bx,
            cz: bz,
            yaw,
            widthX,
            lengthZ,
            floors,
            facing,
            wallMat,
            shutterMat: bIdx % 2 === 0 ? bank.shutterSteel : bank.shutterBlue,
            signIdx: (signOffset + bIdx) % 16,
            seed: seedStart + bIdx * 31,
          });
        }

        obbColliders.push({
          cx: bx,
          cz: bz,
          hw: widthX * 0.5 + (isHouse ? 1.45 : 0.25),
          hd: lengthZ * 0.5 + 0.15,
          cosY,
          sinY,
        });
        bIdx++;
      }
    }
  }
}

/**
 * Adds a Bangladeshi KCC Passenger / Auto-Rickshaw Waiting Shed (যাত্রী ছাউনি) on the footpath.
 */
function addPassengerWaitingShed(staticG, bank, cx, cz, yaw, colliders) {
  const g = new THREE.Group();
  g.position.set(cx, FOOTPATH_H, cz);
  g.rotation.y = yaw;
  box(g, [1.85, 0.10, 5.2], [0, 0.05, 0], bank.dampPlinth, { castShadow: false });
  box(g, [0.12, 2.45, 5.0], [-0.82, 1.25, 0], bank.emeraldDark, { castShadow: false });
  for (const pz of [-2.3, 0, 2.3]) {
    cylinder(g, 0.055, 0.065, 2.55, [0.75, 1.28, pz], bank.steelDark, 6);
  }
  box(g, [2.25, 0.12, 5.6], [0, 2.58, 0], bank.tinBlue, { castShadow: false });
  // Passenger seating bench inside shed
  box(g, [0.46, 0.08, 4.2], [-0.46, 0.48, 0], bank.woodDoor, { castShadow: false });
  for (const lz of [-1.8, 0, 1.8]) {
    box(g, [0.40, 0.46, 0.08], [-0.46, 0.23, lz], bank.steelDark, { castShadow: false });
  }
  staticG.add(g);
  colliders.push({ x: cx, z: cz, r: 1.45 });
}

function addShadeTreesAlongPolyline(staticG, bank, pts, offsetDist, clearanceDiscs, step = 48, seedVal = 5101) {
  const rnd = seeded(seedVal);
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    if (len < 16) continue;
    const nx = -dz / len;
    const nz = dx / len;
    const count = Math.max(1, Math.floor(len / step));
    for (let k = 0; k < count; k++) {
      const t = (k + 0.5) / count;
      const side = ((i + k) % 2 === 0) ? 1 : -1;
      const tx = x0 + dx * t + nx * side * offsetDist;
      const tz = z0 + dz * t + nz * side * offsetDist;
      let blocked = false;
      for (const [jx, jz, jr] of clearanceDiscs) {
        if (Math.hypot(tx - jx, tz - jz) < jr + 4.5) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;
      const h = 4.2 + rnd() * 2.0;
      cylinder(staticG, 0.20, 0.30, h * 0.56, [tx, h * 0.28, tz], bank.trunk, 6);
      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.85 + rnd() * 0.55, 0), bank.foliage);
      crown.position.set(tx, h * 0.72, tz);
      crown.scale.set(1.1, 0.85, 1.1);
      crown.castShadow = false;
      staticG.add(crown);
    }
  }
}

function addZebraCrosswalk(staticG, bank, cx, cz, yaw, width = 9.6, depth = 2.6) {
  const count = Math.floor(width / 0.95);
  const start = -(count - 1) * 0.475;
  for (let i = 0; i < count; i++) {
    const off = start + i * 0.95;
    const sx = cx + Math.cos(yaw) * off;
    const sz = cz - Math.sin(yaw) * off;
    addRotBox(staticG, [0.42, 0.012, depth], [sx, 0.068, sz], bank.roadWhite, yaw, { castShadow: false });
  }
}

function addSpeedBreaker(staticG, bank, cx, cz, yaw, width = 11.4) {
  addRotBox(staticG, [width, 0.06, 0.55], [cx, 0.065, cz], bank.curbHazard, yaw, { castShadow: false, uvScale: 2.2 });
}

/**
 * Kaborkhana More (টুটপাড়া কবরখানা মোড়) Landmark Junction:
 * - Overhead KCC highway directional gantry spanning Khan Jahan Ali Road
 * - Tootpara Central Graveyard (টুটপাড়া কেন্দ্রীয় কবরখানা) Islamic arched gateway & compound wall
 */
function buildKaborkhanaMoreLandmark(staticG, dynamicG, bank, colliders) {
  const gx = -26.0;
  const gz = 103.5;
  const gYaw = Math.atan2(13.7, 4.2);
  const nx = -Math.sin(gYaw);
  const nz = Math.cos(gYaw);

  for (const side of [-7.5, 7.5]) {
    const px = gx + nx * side;
    const pz = gz + nz * side;
    cylinder(staticG, 0.20, 0.26, 6.8, [px, 3.4, pz], bank.steelDark, 8);
    box(staticG, [0.72, 0.55, 0.72], [px, 0.28, pz], bank.curbHazard, { castShadow: false });
    colliders.push({ x: px, z: pz, r: 0.55 });
  }
  addRotBox(staticG, [0.32, 0.45, 15.6], [gx, 6.45, gz], bank.steelDark, gYaw, { castShadow: false });
  addSignBox(
    dynamicG,
    bank,
    {
      title: 'কবরখানা মোড় (KABORKHANA MORE) · N7',
      subtitle: '← পিটিআই মোড় / রয়্যাল মোড়  |  ↑ হাজী মহসিন রোড  |  → আলিয়া মাদ্রাসা / রূপসা',
      bg: '#065f46',
      fg: '#ffffff',
      accent: '#fde047',
      border: '#ffffff',
    },
    [gx, 6.45, gz],
    gYaw + Math.PI * 0.5,
    8.6,
    1.75,
  );

  // Tootpara Central Graveyard (টুটপাড়া কেন্দ্রীয় কবরখানা) Front Compound Wall & Arched Gate
  const wallZ = 114.6;
  const gateX = -24.5;
  for (const [x0, x1] of [[-40.0, gateX - 2.6], [gateX + 2.6, -11.5]]) {
    const len = x1 - x0;
    const midX = (x0 + x1) * 0.5;
    box(staticG, [len, 1.55, 0.34], [midX, 0.78, wallZ], bank.whitePlaster, { castShadow: false });
    box(staticG, [len + 0.1, 0.16, 0.44], [midX, 1.62, wallZ], bank.emeraldDark, { castShadow: false });
    box(staticG, [len, 0.06, 0.08], [midX, 2.25, wallZ], bank.steelDark, { castShadow: false });
    for (let px = x0 + 0.6; px <= x1 - 0.4; px += 1.6) {
      box(staticG, [0.05, 0.65, 0.05], [px, 1.94, wallZ], bank.steelDark, { castShadow: false });
    }
    colliders.push({ minX: x0, maxX: x1, minZ: wallZ - 0.35, maxZ: wallZ + 0.35 });
  }
  for (const dx of [-2.45, 2.45]) {
    box(staticG, [0.85, 4.4, 0.85], [gateX + dx, 2.2, wallZ], bank.whitePlaster);
    box(staticG, [0.98, 0.28, 0.98], [gateX + dx, 4.48, wallZ], bank.emeraldDark);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), bank.goldMat);
    dome.position.set(gateX + dx, 4.82, wallZ);
    staticG.add(dome);
    colliders.push({ x: gateX + dx, z: wallZ, r: 0.65 });
  }
  box(staticG, [5.8, 1.15, 0.68], [gateX, 4.55, wallZ], bank.emeraldDark);
  box(staticG, [6.0, 0.18, 0.76], [gateX, 5.18, wallZ], bank.goldMat);
  addSignBox(
    dynamicG,
    bank,
    {
      title: 'টুটপাড়া কেন্দ্রীয় কবরখানা',
      subtitle: 'TOOTPARA CENTRAL GRAVEYARD · KABORKHANA MORE, KHULNA',
      bg: '#064e3b',
      fg: '#ffffff',
      accent: '#fde047',
      border: '#fde047',
    },
    [gateX, 4.55, wallZ - 0.40],
    Math.PI,
    5.2,
    0.96,
  );
  box(staticG, [29.0, 0.06, 18.0], [-25.5, 0.02, wallZ + 9.4], bank.emeraldMat, { castShadow: false });
  for (const [tx, tz] of [[-35.0, wallZ + 5.5], [-16.0, wallZ + 6.0], [-29.0, wallZ + 12.5], [-20.0, wallZ + 13.0]]) {
    cylinder(staticG, 0.24, 0.36, 3.6, [tx, 1.8, tz], bank.trunk, 6);
    const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 0), bank.foliage);
    crown.position.set(tx, 4.4, tz);
    crown.castShadow = false;
    staticG.add(crown);
  }
}

function pointToSegmentDistSq(px, pz, x0, z0, x1, z1) {
  const vx = x1 - x0;
  const vz = z1 - z0;
  const wx = px - x0;
  const wz = pz - z0;
  const lenSq = vx * vx + vz * vz;
  const t = lenSq > 1e-6 ? THREE.MathUtils.clamp((wx * vx + wz * vz) / lenSq, 0, 1) : 0;
  const cx = x0 + vx * t;
  const cz = z0 + vz * t;
  return (px - cx) * (px - cx) + (pz - cz) * (pz - cz);
}

function resolveCircleOBB(pos, radius, b) {
  const dx = pos.x - b.cx;
  const dz = pos.z - b.cz;
  const lx = dx * b.cosY - dz * b.sinY;
  const lz = dx * b.sinY + dz * b.cosY;
  const clx = THREE.MathUtils.clamp(lx, -b.hw, b.hw);
  const clz = THREE.MathUtils.clamp(lz, -b.hd, b.hd);
  const ox = lx - clx;
  const oz = lz - clz;
  const dSq = ox * ox + oz * oz;
  if (dSq >= radius * radius) return;
  let pushX = 0;
  let pushZ = 0;
  if (dSq > 1e-6) {
    const d = Math.sqrt(dSq);
    pushX = (ox / d) * (radius - d);
    pushZ = (oz / d) * (radius - d);
  } else {
    const px = b.hw - Math.abs(lx);
    const pz = b.hd - Math.abs(lz);
    if (px < pz) pushX = (lx >= 0 ? 1 : -1) * (px + radius);
    else pushZ = (lz >= 0 ? 1 : -1) * (pz + radius);
  }
  const nlx = lx + pushX;
  const nlz = lz + pushZ;
  pos.x = b.cx + nlx * b.cosY + nlz * b.sinY;
  pos.z = b.cz - nlx * b.sinY + nlz * b.cosY;
}

export function buildKjaCorridorDistrict(parent, m) {
  const group = new THREE.Group();
  group.name = 'KhulnaCorridor_RoyalPtiKaborkhana';
  parent.add(group);

  const bank = createCorridorBank(m);

  // 4 compact spatial culling slices — only 1-2 slices render at a time for locked 60+ FPS!
  const slices = [
    {
      name: 'KjaSlice_RoyalToMid',
      cx: -580.0,
      cz: -208.0,
      maxDistSq: 320 * 320,
      bounds: [-665, -495, -270, -145],
      root: new THREE.Group(),
      staticG: new THREE.Group(),
      dynamicG: new THREE.Group(),
      footpathZones: [],
      colliders: [],
      obbColliders: [],
    },
    {
      name: 'KjaSlice_MidToPti',
      cx: -452.0,
      cz: -130.0,
      maxDistSq: 320 * 320,
      bounds: [-535, -370, -185, -75],
      root: new THREE.Group(),
      staticG: new THREE.Group(),
      dynamicG: new THREE.Group(),
      footpathZones: [],
      colliders: [],
      obbColliders: [],
    },
    {
      name: 'KjaSlice_PtiToBabuKhan',
      cx: -198.0,
      cz: 66.0,
      maxDistSq: 320 * 320,
      bounds: [-255, -140, 15, 138],
      root: new THREE.Group(),
      staticG: new THREE.Group(),
      dynamicG: new THREE.Group(),
      footpathZones: [],
      colliders: [],
      obbColliders: [],
    },
    {
      name: 'KjaSlice_BabuKhanToKaborkhana',
      cx: -55.0,
      cz: 112.0,
      maxDistSq: 340 * 340,
      bounds: [-175, 68, 35, 165],
      root: new THREE.Group(),
      staticG: new THREE.Group(),
      dynamicG: new THREE.Group(),
      footpathZones: [],
      colliders: [],
      obbColliders: [],
    },
  ];

  for (const s of slices) {
    s.root.name = s.name;
    s.root.add(s.staticG, s.dynamicG);
    group.add(s.root);
  }

  // ============================================================================
  // SLICE 1: ROYAL MORE SE [-648, -250.5] -> MID KHAN JAHAN ALI RD [-515.5, -167.5]
  // ============================================================================
  {
    const s = slices[0];
    const clearance = [
      [-648.0, -250.5, 14.0],
      [-515.5, -167.5, 8.0],
    ];
    addPitchRoadAlongPolyline(s.staticG, ROYAL_TO_MID_PTS, 6.2, bank.pitchHighway, 0.002);
    addPitchJunctionDisc(s.staticG, -646.0, -249.2, 7.0, bank.pitchJunction, 0.003);

    addFootpathsAlongPolyline(s.staticG, bank, ROYAL_TO_MID_PTS, 6.2, 1.85, clearance, s.footpathZones);
    addMedianPolesAndLamps(s.staticG, s.dynamicG, bank, ROYAL_TO_MID_PTS, clearance, s.colliders, { lampSpacing: 36, withMedian: true });
    populateRoadsideBuildings(s.staticG, s.dynamicG, bank, ROYAL_TO_MID_PTS, 6.2, clearance, s.obbColliders, { seedStart: 701, signOffset: 0 });
    addShadeTreesAlongPolyline(s.staticG, bank, ROYAL_TO_MID_PTS, 8.8, clearance, 52, 5101);
  }

  // ============================================================================
  // SLICE 2: MID KHAN JAHAN ALI RD [-517, -168.4] -> PTI MORE NW [-388, -91.8]
  // ============================================================================
  {
    const s = slices[1];
    const clearance = [
      [-515.5, -167.5, 8.0],
      [-388.0, -91.8, 16.0],
    ];
    addPitchRoadAlongPolyline(s.staticG, MID_TO_PTI_PTS, 6.2, bank.pitchHighway, 0.002);
    addPitchJunctionDisc(s.staticG, -389.0, -92.4, 6.4, bank.pitchJunction, 0.003);

    addFootpathsAlongPolyline(s.staticG, bank, MID_TO_PTI_PTS, 6.2, 1.85, clearance, s.footpathZones);
    addMedianPolesAndLamps(s.staticG, s.dynamicG, bank, MID_TO_PTI_PTS, clearance, s.colliders, { lampSpacing: 36, withMedian: true });
    populateRoadsideBuildings(s.staticG, s.dynamicG, bank, MID_TO_PTI_PTS, 6.2, clearance, s.obbColliders, { seedStart: 809, signOffset: 6 });
    addShadeTreesAlongPolyline(s.staticG, bank, MID_TO_PTI_PTS, 8.8, clearance, 52, 5153);

    const midYaw = Math.atan2(MID_TO_PTI_PTS[1][0] - MID_TO_PTI_PTS[0][0], MID_TO_PTI_PTS[1][1] - MID_TO_PTI_PTS[0][1]);
    addZebraCrosswalk(s.staticG, bank, -515.5, -167.5, midYaw, 10.8, 2.5);
    addSpeedBreaker(s.staticG, bank, -405.0, -101.6, midYaw, 11.4);
  }

  // ============================================================================
  // SLICE 3: PTI MORE SE [-238, 31.8] -> BABU KHAN / CENTRAL RD [-158, 95.6]
  // ============================================================================
  {
    const s = slices[2];
    const clearance = [
      [-238.0, 31.8, 16.0],
      [-193.5, 87.5, 14.0], // Babu Khan Rd junction
      [-179.0, 94.2, 13.0], // Central Rd junction
    ];
    addPitchRoadAlongPolyline(s.staticG, PTI_TO_BABUKHAN_PTS, 6.0, bank.pitchHighway, 0.002);
    addPitchRoadAlongPolyline(s.staticG, BABU_KHAN_LINK_PTS, 3.4, bank.pitchSideRoad, 0.001);
    addPitchRoadAlongPolyline(s.staticG, CENTRAL_RD_LINK_PTS, 3.2, bank.pitchSideRoad, 0.001);

    addPitchJunctionDisc(s.staticG, -237.0, 33.0, 6.5, bank.pitchJunction, 0.003);
    addPitchJunctionDisc(s.staticG, -193.5, 87.5, 10.5, bank.pitchJunction, 0.003);
    addPitchJunctionDisc(s.staticG, -179.0, 94.2, 8.2, bank.pitchJunction, 0.003);

    addFootpathsAlongPolyline(s.staticG, bank, PTI_TO_BABUKHAN_PTS, 6.0, 1.85, clearance, s.footpathZones);
    addMedianPolesAndLamps(s.staticG, s.dynamicG, bank, PTI_TO_BABUKHAN_PTS, clearance, s.colliders, { lampSpacing: 36, withMedian: false });
    populateRoadsideBuildings(s.staticG, s.dynamicG, bank, PTI_TO_BABUKHAN_PTS, 6.0, clearance, s.obbColliders, { seedStart: 917, signOffset: 4 });
    addShadeTreesAlongPolyline(s.staticG, bank, PTI_TO_BABUKHAN_PTS, 8.6, clearance, 50, 5207);

    addZebraCrosswalk(s.staticG, bank, -168.0, 95.0, Math.atan2(20.3, 1.3), 10.4, 2.4);
    addPassengerWaitingShed(s.staticG, bank, -166.0, 87.2, Math.PI * 0.5, s.colliders);
  }

  // ============================================================================
  // SLICE 4: CENTRAL RD [-160, 95.4] -> TUTPARA MAIN RD -> KABORKHANA MORE -> [49.3, 142]
  // ============================================================================
  {
    const s = slices[3];
    const clearance = [
      [-159.0, 95.5, 8.0],
      [-50.6, 101.8, 14.5], // Tutpara Main Rd fork
      [-25.0, 118.0, 17.5], // Tootpara Central Graveyard compound (south side)
      [-13.0, 106.5, 16.0], // Kaborkhana More / Haji Mohsin Rd junction
      [49.3, 142.0, 14.0],
    ];
    addPitchRoadAlongPolyline(s.staticG, BABUKHAN_TO_KABORKHANA_PTS, 6.0, bank.pitchHighway, 0.002);
    addPitchRoadAlongPolyline(s.staticG, HAJI_MOHSIN_LINK_PTS, 3.4, bank.pitchSideRoad, 0.001);
    addPitchRoadAlongPolyline(s.staticG, TUTPARA_LINK_PTS, 3.4, bank.pitchSideRoad, 0.001);

    addPitchJunctionDisc(s.staticG, -50.6, 101.8, 10.5, bank.pitchJunction, 0.003);
    addPitchJunctionDisc(s.staticG, -13.0, 106.5, 13.5, bank.pitchJunction, 0.003);

    addFootpathsAlongPolyline(s.staticG, bank, BABUKHAN_TO_KABORKHANA_PTS, 6.0, 1.85, clearance, s.footpathZones);
    addMedianPolesAndLamps(s.staticG, s.dynamicG, bank, BABUKHAN_TO_KABORKHANA_PTS, clearance, s.colliders, { lampSpacing: 36, withMedian: false });
    populateRoadsideBuildings(s.staticG, s.dynamicG, bank, BABUKHAN_TO_KABORKHANA_PTS, 6.0, clearance, s.obbColliders, { seedStart: 1031, signOffset: 1 });
    addShadeTreesAlongPolyline(s.staticG, bank, BABUKHAN_TO_KABORKHANA_PTS, 8.6, clearance, 50, 5261);

    buildKaborkhanaMoreLandmark(s.staticG, s.dynamicG, bank, s.colliders);

    addZebraCrosswalk(s.staticG, bank, -34.0, 102.8, Math.atan2(26.3, 1.7), 10.4, 2.5);
    addZebraCrosswalk(s.staticG, bank, -9.2, 93.0, Math.atan2(-2.8, -24.2), 6.2, 2.2);
    addSpeedBreaker(s.staticG, bank, -68.0, 101.0, Math.atan2(59.4, 2.8), 11.2);
    addPassengerWaitingShed(s.staticG, bank, -34.0, 95.0, Math.PI * 0.5, s.colliders);
  }

  // Batch BOTH staticG and dynamicG per slice -> collapses hundreds of meshes into ~16 draw calls per slice!
  for (const s of slices) {
    mergeStaticMeshes(s.staticG);
    mergeStaticMeshes(s.dynamicG);
  }

  function syncVisibility(playerPos) {
    if (!playerPos) return;
    for (let i = 0; i < slices.length; i++) {
      const s = slices[i];
      const dx = playerPos.x - s.cx;
      const dz = playerPos.z - s.cz;
      const want = dx * dx + dz * dz <= s.maxDistSq;
      if (s.root.visible !== want) s.root.visible = want;
    }
  }

  function getGroundHeight(pos) {
    if (!pos) return 0.0;
    if (pos.x < -668 || pos.x > 72 || pos.z < -272 || pos.z > 168) return 0.0;
    for (let si = 0; si < slices.length; si++) {
      const s = slices[si];
      const [minX, maxX, minZ, maxZ] = s.bounds;
      if (pos.x < minX || pos.x > maxX || pos.z < minZ || pos.z > maxZ) continue;
      for (let i = 0; i < s.footpathZones.length; i++) {
        const f = s.footpathZones[i];
        if (pointToSegmentDistSq(pos.x, pos.z, f.x0, f.z0, f.x1, f.z1) <= f.halfW * f.halfW) {
          return FOOTPATH_H;
        }
      }
    }
    return 0.0;
  }

  function applyCollisions(pos, radius = 0.34, footY = 0) {
    if (!pos || footY > 18.0) return;
    if (pos.x < -668 || pos.x > 72 || pos.z < -272 || pos.z > 168) return;
    for (let si = 0; si < slices.length; si++) {
      const s = slices[si];
      const [minX, maxX, minZ, maxZ] = s.bounds;
      if (pos.x < minX || pos.x > maxX || pos.z < minZ || pos.z > maxZ) continue;

      for (let i = 0; i < s.obbColliders.length; i++) {
        resolveCircleOBB(pos, radius, s.obbColliders[i]);
      }
      if (footY > 3.2) continue;
      for (let i = 0; i < s.colliders.length; i++) {
        const c = s.colliders[i];
        if (c.r !== undefined) {
          const dx = pos.x - c.x;
          const dz = pos.z - c.z;
          const minR = c.r + radius;
          const dSq = dx * dx + dz * dz;
          if (dSq < minR * minR && dSq > 1e-8) {
            const d = Math.sqrt(dSq);
            pos.x += (dx / d) * (minR - d);
            pos.z += (dz / d) * (minR - d);
          }
        } else {
          const cx = THREE.MathUtils.clamp(pos.x, c.minX, c.maxX);
          const cz = THREE.MathUtils.clamp(pos.z, c.minZ, c.maxZ);
          const dx = pos.x - cx;
          const dz = pos.z - cz;
          const dSq = dx * dx + dz * dz;
          if (dSq < radius * radius && dSq > 1e-8) {
            const d = Math.sqrt(dSq);
            pos.x += (dx / d) * (radius - d);
            pos.z += (dz / d) * (radius - d);
          }
        }
      }
    }
  }

  return {
    group,
    syncVisibility,
    getGroundHeight,
    applyCollisions,
    setNightFactor(nightFactor = 0) {
      const nf = THREE.MathUtils.clamp(nightFactor, 0, 1);
      for (let i = 0; i < bank.emissiveList.length; i++) {
        const item = bank.emissiveList[i];
        item.mat.emissiveIntensity = item.day + (item.night - item.day) * nf;
      }
    },
    update(_time, playerPos = null) {
      if (playerPos) syncVisibility(playerPos);
    },
  };
}
