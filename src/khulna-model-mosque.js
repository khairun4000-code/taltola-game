import * as THREE from 'three';
import { box, cylinder, rodBetween } from './scene-utils.js';
import { attachDerivedPBRMaps } from './aaa-shaders.js';

/**
 * KHULNA DISTRICT MODEL MOSQUE & ISLAMIC CULTURAL CENTER
 * (খুলনা জেলা মডেল মসজিদ ও ইসলামিক সাংস্কৃতিক কেন্দ্র · আলিয়া মাদ্রাসা প্রাঙ্গণ)
 *
 * House-level realistic, 100% enterable & multi-floor playable architecture:
 *  - ZERO Arabic text anywhere (clean geometric marble arches + Bengali/English signage only)
 *  - Ground Floor (y = 0.30m): Wide unobstructed East/North/South entrances, Reception & Shoe-Rack
 *    Foyer, realistic tiled Ozu Khana (ablution hall with 10 chrome taps, benches, mirrors & drain),
 *    Islamic Library & Reading Room (bookshelves, tables, sittable chairs, lamps) & Marble Staircase.
 *  - 2nd Floor Main Prayer Hall (y = 3.80m): Reachable via BOTH the grand wide front marble staircase
 *    AND interior switchback marble staircase. Interactive carved teak double doors [E] (open by default),
 *    emerald-gold saff prayer carpet, recessed arched Mihrab, carved 5-step teak Mimbar, fluted marble
 *    columns, multi-tier brass chandelier, ceiling fans, digital Bengali prayer time board & Quran rehals.
 *  - 3rd Floor Upper Prayer Gallery (y = 8.40m): Walkable mezzanine overlooking the central dome atrium
 *    with marble balustrades, prayer carpets & tall arched windows.
 *  - Exterior: 1 Grand Central Ribbed Dome + 3 Front Domes + 32m Square Jaali Minaret (placed cleanly
 *    at NE corner plaza so it NEVER blocks any entrance or walkway).
 *
 * Performance: Static meshes placed in staticG (merged by alia-madrasah.js mergeStaticMeshes())
 * for locked 60–120 FPS at full native resolution.
 */

export const MODEL_MOSQUE_POS = { x: 171.0, z: 166.0 };

const MX = MODEL_MOSQUE_POS.x; // 171.0
const MZ = MODEL_MOSQUE_POS.z; // 166.0
const W = 22.0; // X: 160.0 .. 182.0
const D = 24.0; // Z: 154.0 .. 178.0
const X_WEST = MX - W * 0.5; // 160.0
const X_EAST = MX + W * 0.5; // 182.0
const X_VERANDA = X_EAST + 4.5; // 186.5
const Z_NORTH = MZ - D * 0.5; // 154.0
const Z_SOUTH = MZ + D * 0.5; // 178.0

const Y0 = 0.30; // Ground Floor
const Y1 = 3.80; // 2nd Floor Main Prayer Hall
const Y2 = 8.40; // 3rd Floor Upper Prayer Gallery
const Y_ROOF = 13.40; // Roof Slab

// Interior Switchback Stairwell (South-West corner, clear of Mihrab & Ozu Khana)
const STAIR_X0 = 160.8;
const STAIR_X_LAND = 162.6;
const STAIR_X1 = 169.0;
const STAIR_Z0 = 173.4;
const STAIR_Z_MID = 175.4;
const STAIR_Z1 = 177.4;

// Grand Front Exterior Marble Staircase (East Veranda to Courtyard)
const FRONT_STAIR_X0 = 186.5;
const FRONT_STAIR_X1 = 193.0;
const FRONT_STAIR_Z0 = 161.0;
const FRONT_STAIR_Z1 = 171.0;

// Interactive door state (OPEN by default so players can walk straight in immediately!)
const mosqueDoorState = {
  mainHallOpen: true,
  mainHallAngle: Math.PI * 0.48,
  leftLeaf: null,
  rightLeaf: null,
};

function seeded(seed = 202604) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ============================================================================
 * REALISTIC PROCEDURAL PBR TEXTURES (HOUSE-LEVEL QUALITY, ZERO ARABIC TEXT)
 * ========================================================================== */

function makeTravertineMarbleTexture(baseHex = '#f5f2ea', veinHex = '#d5cec0', seedVal = 2026) {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, S, S);

  // Fine natural stone speckles
  for (let i = 0; i < 4200; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(130,120,104,0.06)';
    ctx.fillRect(rnd() * S, rnd() * S, 1.5 + rnd() * 3.5, 1.5 + rnd() * 2.5);
  }

  // Natural marble veins
  ctx.strokeStyle = veinHex;
  for (let v = 0; v < 24; v++) {
    ctx.globalAlpha = 0.14 + rnd() * 0.16;
    ctx.lineWidth = 1.0 + rnd() * 2.4;
    ctx.beginPath();
    let x = rnd() * S;
    let y = 0;
    ctx.moveTo(x, y);
    while (y < S) {
      y += 42 + rnd() * 38;
      x += (rnd() - 0.5) * 65;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  // Architectural stone panel joints
  ctx.strokeStyle = 'rgba(128,120,108,0.28)';
  ctx.lineWidth = 2.0;
  const step = 256;
  for (let p = 0; p < S; p += step) {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, S);
    ctx.moveTo(0, p);
    ctx.lineTo(S, p);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeArchitecturalJaaliTexture(bgHex = '#f2eee4', patternHex = '#0f5c63', shadowHex = '#233038') {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, S, S);

  const cell = 128;
  for (let gy = 0; gy < S; gy += cell) {
    for (let gx = 0; gx < S; gx += cell) {
      const cx = gx + cell * 0.5;
      const cy = gy + cell * 0.5;
      const r = cell * 0.42;

      // Subtle recessed cavity behind jaali star
      ctx.fillStyle = shadowHex;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const rad = i % 2 === 0 ? r * 0.92 : r * 0.54;
        const px = cx + Math.cos(a) * rad;
        const py = cy + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Inner geometric filigree ribs
      ctx.strokeStyle = patternHex;
      ctx.lineWidth = 5;
      ctx.strokeRect(gx + 6, gy + 6, cell - 12, cell - 12);

      ctx.strokeStyle = bgHex;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.44, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, gy + 8);
      ctx.lineTo(cx, gy + cell - 8);
      ctx.moveTo(gx + 8, cy);
      ctx.lineTo(gx + cell - 8, cy);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeRealisticPrayerCarpetTexture() {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(9091);

  // Deep realistic mosque emerald wool base
  ctx.fillStyle = '#0d563c';
  ctx.fillRect(0, 0, S, S);

  // Subtle woven velvet pile grain
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(4,28,18,0.10)';
    ctx.fillRect(rnd() * S, rnd() * S, 2, 2);
  }

  // Horizontal golden saff (row) alignment bands
  for (const bandY of [0, S - 46]) {
    ctx.fillStyle = '#c9a13b';
    ctx.fillRect(0, bandY, S, 46);
    ctx.fillStyle = '#0a402c';
    ctx.fillRect(0, bandY + 10, S, 26);
    ctx.fillStyle = '#e2be5d';
    for (let x = 12; x < S; x += 32) {
      ctx.fillRect(x, bandY + 18, 16, 10);
    }
  }

  // Individual woven mihrab prayer mat arches
  const matW = S / 4;
  for (let col = 0; col < 4; col++) {
    const x0 = col * matW;
    const cx = x0 + matW * 0.5;
    ctx.strokeStyle = '#d4af47';
    ctx.lineWidth = 4;
    ctx.strokeRect(x0 + 14, 62, matW - 28, S - 124);

    // Pointed prayer arch motif
    ctx.beginPath();
    ctx.moveTo(x0 + 34, S - 90);
    ctx.lineTo(x0 + 34, 240);
    ctx.quadraticCurveTo(x0 + 34, 130, cx, 96);
    ctx.quadraticCurveTo(x0 + matW - 34, 130, x0 + matW - 34, 240);
    ctx.lineTo(x0 + matW - 34, S - 90);
    ctx.closePath();
    ctx.fillStyle = 'rgba(7, 68, 46, 0.55)';
    ctx.fill();
    ctx.stroke();

    // Small geometric star medallion inside arch
    ctx.fillStyle = '#d4af47';
    ctx.beginPath();
    ctx.arc(cx, 255, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 6);
  tex.anisotropy = 8;
  return tex;
}

function makeOzuCeramicTileTexture() {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(4412);

  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, S, S);
  const step = 64;
  for (let y = 0; y < S; y += step) {
    for (let x = 0; x < S; x += step) {
      const checker = ((x / step) + (y / step)) % 2 === 0;
      const g = checker ? 236 : 224;
      const b = checker ? 244 : 236;
      const r = checker ? 222 : 206;
      ctx.fillStyle = `rgb(${r + Math.floor(rnd() * 6 - 3)},${g + Math.floor(rnd() * 6 - 3)},${b})`;
      ctx.fillRect(x + 2, y + 2, step - 4, step - 4);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 3);
  tex.anisotropy = 8;
  return tex;
}

function makeMosquePlaqueTexture() {
  const W = 1024;
  const H = 224;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#0b3a40');
  g.addColorStop(0.5, '#0f5259');
  g.addColorStop(1, '#092f35');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 46px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText('খুলনা জেলা মডেল মসজিদ ও ইসলামিক সাংস্কৃতিক কেন্দ্র', W * 0.5, H * 0.39, W - 76);

  ctx.fillStyle = '#facc15';
  ctx.font = '700 24px "Manrope", "Noto Sans Bengali", sans-serif';
  ctx.fillText('KHULNA DISTRICT MODEL MOSQUE · আলিয়া মাদ্রাসা প্রাঙ্গণ, খুলনা', W * 0.5, H * 0.74, W - 76);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makePrayerTimeBoardTexture() {
  const W = 512;
  const H = 640;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#071c1b';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, W - 16, H - 16);

  ctx.fillStyle = '#0f4c45';
  ctx.fillRect(20, 20, W - 40, 88);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 34px "Noto Sans Bengali", sans-serif';
  ctx.fillText('নামাজের সময়সূচী', W * 0.5, 62);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 18px "Manrope", sans-serif';
  ctx.fillText('KHULNA MODEL MOSQUE', W * 0.5, 94);

  const rows = [
    ['ফজর (FAJR)', '০৪:৩০'],
    ['যোহর (DHUHR)', '০১:১৫'],
    ['আসর (ASR)', '০৪:৪৫'],
    ['মাগরিব (MAGHRIB)', '০৬:২০'],
    ['এশা (ISHA)', '০৮:০০'],
    ['জুম্মা (JUMMAH)', '০১:৩০'],
  ];
  rows.forEach(([name, time], idx) => {
    const ry = 136 + idx * 78;
    ctx.fillStyle = idx % 2 === 0 ? 'rgba(20, 83, 75, 0.45)' : 'rgba(15, 55, 50, 0.35)';
    ctx.fillRect(26, ry, W - 52, 64);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px "Noto Sans Bengali", sans-serif';
    ctx.fillText(name, 44, ry + 41);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 30px "Manrope", monospace';
    ctx.fillText(time, W - 44, ry + 42);
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeRoomSignTexture(title, subtitle) {
  const W = 512;
  const H = 128;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0c3f45';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, W - 12, H - 12);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px "Noto Sans Bengali", sans-serif';
  ctx.fillText(title, W * 0.5, 48, W - 40);
  ctx.fillStyle = '#fde047';
  ctx.font = '600 20px "Manrope", sans-serif';
  ctx.fillText(subtitle, W * 0.5, 90, W - 40);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* ============================================================================
 * ARCHITECTURAL GEOMETRY HELPERS
 * ========================================================================== */

function addPointedArchSpandrel(parent, { span, height, depth, archRise, pos, rotY = 0, mat }) {
  const hw = span * 0.5;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, 0);
  shape.lineTo(-hw, height);
  shape.lineTo(hw, height);
  shape.lineTo(hw, 0);
  // Crisp Islamic ogee/pointed arch curve
  const segs = 16;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const ang = t * Math.PI;
    const ax = Math.cos(ang) * hw;
    const ay = Math.pow(Math.sin(ang), 0.78) * archRise;
    shape.lineTo(ax, ay);
  }
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 10 });
  geom.translate(0, 0, -depth * 0.5);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.y = rotY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addArchedGlazedWindow(staticG, dynamicG, mats, x, yBase, z, width, height, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, yBase, z);
  g.rotation.y = rotY;

  const archH = Math.min(0.65, width * 0.34);
  const rectH = height - archH;

  // Outer stone sill & slim bronze frame
  box(g, [width + 0.24, 0.10, 0.34], [0, 0.05, 0], mats.marbleTrim);
  box(g, [0.10, height, 0.24], [-width * 0.5 + 0.05, height * 0.5, 0], mats.bronzeMat);
  box(g, [0.10, height, 0.24], [width * 0.5 - 0.05, height * 0.5, 0], mats.bronzeMat);
  box(g, [width, 0.09, 0.24], [0, 0.12, 0], mats.bronzeMat);
  box(g, [width, 0.08, 0.20], [0, rectH, 0], mats.bronzeMat);

  // Vertical mullions
  for (const mxOff of [-width * 0.18, width * 0.18]) {
    box(g, [0.045, rectH, 0.14], [mxOff, rectH * 0.5, 0], mats.bronzeMat);
  }
  // Pointed arch spandrel header
  addPointedArchSpandrel(g, {
    span: width - 0.06,
    height: archH + 0.14,
    depth: 0.24,
    archRise: archH,
    pos: [0, rectH, 0],
    rotY: 0,
    mat: mats.marbleTrim,
  });

  // Tinted architectural glass pane (placed in dynamicG so transparent material doesn't merge into opaque staticG)
  const glass = new THREE.Mesh(new THREE.BoxGeometry(width - 0.16, height - 0.22, 0.04), mats.archGlass);
  glass.position.set(0, height * 0.5, 0);
  const glassWrap = new THREE.Group();
  glassWrap.position.set(x, yBase, z);
  glassWrap.rotation.y = rotY;
  glassWrap.add(glass);
  dynamicG.add(glassWrap);

  staticG.add(g);
}

function addCeilingFan(staticG, mats, x, ceilY, z) {
  cylinder(staticG, 0.05, 0.07, 0.06, [x, ceilY - 0.03, z], mats.marbleTrim, 10);
  cylinder(staticG, 0.022, 0.022, 0.48, [x, ceilY - 0.27, z], mats.bronzeMat, 8);
  cylinder(staticG, 0.15, 0.16, 0.09, [x, ceilY - 0.52, z], mats.marbleTrim, 12);
  cylinder(staticG, 0.165, 0.165, 0.02, [x, ceilY - 0.52, z], mats.brassMat, 12);
  for (let b = 0; b < 3; b++) {
    const a = (b / 3) * Math.PI * 2;
    const blade = box(staticG, [0.64, 0.016, 0.13], [x + Math.cos(a) * 0.44, ceilY - 0.52, z + Math.sin(a) * 0.44], mats.marbleTrim);
    blade.rotation.y = -a;
  }
}

function addCourtyardLamp(staticG, dynamicG, mats, x, z, h = 4.5, yBase = 0.08) {
  cylinder(staticG, 0.16, 0.22, 0.50, [x, yBase + 0.25, z], mats.bronzeMat, 10);
  cylinder(staticG, 0.055, 0.085, h, [x, yBase + h * 0.5 + 0.25, z], mats.bronzeMat, 8);
  box(staticG, [1.05, 0.07, 0.07], [x, yBase + h + 0.22, z], mats.bronzeMat);
  for (const sx of [-0.46, 0.46]) {
    cylinder(staticG, 0.12, 0.16, 0.08, [x + sx, yBase + h + 0.28, z], mats.brassMat, 8);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), mats.warmBulb);
    globe.position.set(x + sx, yBase + h + 0.42, z);
    dynamicG.add(globe);
  }
}

function addMosqueSignPlaque(dynamicG, tex, pos, rotY, w, h, backlit = true, emissiveList = null) {
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: backlit ? 0xffffff : 0x000000,
    emissiveMap: backlit ? tex : null,
    emissiveIntensity: backlit ? 0.28 : 0.0,
    roughness: 0.34,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });
  if (backlit && emissiveList) {
    emissiveList.push({ mat, day: 0.26, night: 1.35 });
  }
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.10), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.y = rotY;
  dynamicG.add(mesh);
  return mesh;
}

/* ============================================================================
 * MAIN BUILDER: REALISTIC HOUSE-QUALITY WALKABLE KHULNA MODEL MOSQUE
 * ========================================================================== */

export function buildKhulnaModelMosque3D(staticG, dynamicG, bank) {
  const marbleWallTex = makeTravertineMarbleTexture('#f4f1e8', '#d3cbb8', 2026);
  marbleWallTex.repeat.set(3, 2);
  const marbleWallMat = new THREE.MeshPhysicalMaterial({
    map: marbleWallTex,
    roughness: 0.34,
    metalness: 0.03,
    clearcoat: 0.28,
    envMapIntensity: 0.72,
  });
  attachDerivedPBRMaps(marbleWallMat, marbleWallTex, { strength: 1.4, roughBase: 0.34, normalScale: 0.45 });

  const floorMarbleTex = makeTravertineMarbleTexture('#ede9df', '#c6beb0', 2027);
  floorMarbleTex.repeat.set(5, 5);
  const floorMarbleMat = new THREE.MeshPhysicalMaterial({
    map: floorMarbleTex,
    roughness: 0.22,
    metalness: 0.04,
    clearcoat: 0.58,
    envMapIntensity: 0.85,
  });

  const jaaliTex = makeArchitecturalJaaliTexture('#f2eee4', '#0f5c63', '#1e2c33');
  jaaliTex.repeat.set(2, 4);
  const jaaliMat = new THREE.MeshStandardMaterial({
    map: jaaliTex,
    roughness: 0.44,
    metalness: 0.06,
    envMapIntensity: 0.65,
  });
  attachDerivedPBRMaps(jaaliMat, jaaliTex, { strength: 2.0, roughBase: 0.44, normalScale: 0.68 });

  const carpetMat = new THREE.MeshStandardMaterial({
    map: makeRealisticPrayerCarpetTexture(),
    roughness: 0.92,
    metalness: 0.02,
  });

  const ozuTileMat = new THREE.MeshPhysicalMaterial({
    map: makeOzuCeramicTileTexture(),
    roughness: 0.20,
    metalness: 0.05,
    clearcoat: 0.65,
  });

  const mats = {
    marbleWall: marbleWallMat,
    floorMarble: floorMarbleMat,
    marbleTrim: bank.marbleWhite,
    marbleDome: bank.marbleDome,
    granite: bank.granite,
    jaali: jaaliMat,
    tealAccent: new THREE.MeshPhysicalMaterial({ color: 0x0f5c63, roughness: 0.26, metalness: 0.14, clearcoat: 0.62 }),
    tealDeep: new THREE.MeshPhysicalMaterial({ color: 0x0a3f46, roughness: 0.30, metalness: 0.12, clearcoat: 0.52 }),
    brassMat: new THREE.MeshPhysicalMaterial({ color: 0xc59a3e, roughness: 0.24, metalness: 0.86, clearcoat: 0.55 }),
    bronzeMat: new THREE.MeshStandardMaterial({ color: 0x2c2824, roughness: 0.38, metalness: 0.72 }),
    chromeMat: bank.chromeMat,
    teakWood: bank.teakWood,
    lightWood: bank.lightWood,
    carpet: carpetMat,
    ozuTile: ozuTileMat,
    interiorWall: bank.interiorWall,
    mirrorMat: new THREE.MeshPhysicalMaterial({ color: 0xdbeafe, roughness: 0.06, metalness: 0.88, clearcoat: 1.0 }),
    archGlass: new THREE.MeshPhysicalMaterial({
      color: 0x89c4d6,
      roughness: 0.08,
      metalness: 0.12,
      transmission: 0.15,
      opacity: 0.42,
      transparent: true,
      clearcoat: 0.9,
    }),
    warmBulb: bank.bulbGlow,
    ledStrip: bank.tubeGlow,
    acMat: bank.acMat,
    paver: bank.paverDriveway,
    grass: bank.grassTurf,
    moss: bank.moss,
  };

  /* --------------------------------------------------------------------------
   * 1. COURTYARD PLAZA, PAVED APPROACH AVENUE & GROUND PLINTH
   * ------------------------------------------------------------------------ */
  box(staticG, [40.0, 0.10, 36.0], [MX + 4.0, 0.04, MZ], mats.floorMarble, { castShadow: false });
  // Wide ceremonial paver walkway connecting Alia Madrasah main portico straight to Model Mosque
  box(staticG, [10.0, 0.08, 30.0], [190.5, 0.04, 141.0], mats.paver, { castShadow: false });

  // Ground floor marble plinth (top at Y0 = 0.30m) + smooth low step aprons at all entrances
  box(staticG, [W + 5.0, Y0, D + 0.8], [MX + 2.25, Y0 * 0.5, MZ], mats.floorMarble);
  // Wide gentle East ground steps (x = 186.5..187.4) on North & South sides of grand staircase
  box(staticG, [0.90, 0.15, 7.0], [X_VERANDA + 0.45, 0.075, 157.5], mats.granite);
  box(staticG, [0.90, 0.15, 7.0], [X_VERANDA + 0.45, 0.075, 174.5], mats.granite);
  // North & South side entrance steps
  box(staticG, [4.0, 0.15, 0.90], [171.75, 0.075, Z_NORTH - 0.55], mats.granite);
  box(staticG, [4.0, 0.15, 0.90], [171.75, 0.075, Z_SOUTH + 0.55], mats.granite);

  /* --------------------------------------------------------------------------
   * 2. GROUND FLOOR (y = 0.30m .. 3.80m) — FOYER, OZU KHANA & ISLAMIC LIBRARY
   * ------------------------------------------------------------------------ */
  const gH = Y1 - Y0; // 3.50m
  const gMidY = Y0 + gH * 0.5;

  // Ground Exterior Walls with WIDE UNOBSTRUCTED ENTRANCES:
  // - West Wall (solid, x = 160.0)
  box(staticG, [0.36, gH, D], [X_WEST + 0.18, gMidY, MZ], mats.marbleWall);
  // - North Wall (z = 154.0, open entrance at x = 170.0..173.5)
  box(staticG, [10.0, gH, 0.36], [165.0, gMidY, Z_NORTH + 0.18], mats.marbleWall);
  box(staticG, [8.5, gH, 0.36], [177.75, gMidY, Z_NORTH + 0.18], mats.marbleWall);
  addPointedArchSpandrel(staticG, { span: 3.5, height: 1.0, depth: 0.36, archRise: 0.62, pos: [171.75, Y1 - 1.0, Z_NORTH + 0.18], rotY: 0, mat: mats.marbleTrim });
  // - South Wall (z = 178.0, open entrance at x = 170.0..173.5)
  box(staticG, [10.0, gH, 0.36], [165.0, gMidY, Z_SOUTH - 0.18], mats.marbleWall);
  box(staticG, [8.5, gH, 0.36], [177.75, gMidY, Z_SOUTH - 0.18], mats.marbleWall);
  addPointedArchSpandrel(staticG, { span: 3.5, height: 1.0, depth: 0.36, archRise: 0.62, pos: [171.75, Y1 - 1.0, Z_SOUTH - 0.18], rotY: 0, mat: mats.marbleTrim });
  // - East Ground Wall (x = 182.0, TWO wide open entrances: z = 156.5..160.0 and z = 172.0..175.5, plus center glazed arches)
  box(staticG, [0.36, gH, 2.5], [X_EAST - 0.18, gMidY, 155.25], mats.marbleWall);
  box(staticG, [0.36, gH, 12.0], [X_EAST - 0.18, gMidY, 166.0], mats.marbleWall);
  box(staticG, [0.36, gH, 2.5], [X_EAST - 0.18, gMidY, 176.75], mats.marbleWall);
  for (const ez of [158.25, 173.75]) {
    addPointedArchSpandrel(staticG, { span: 3.5, height: 0.95, depth: 0.36, archRise: 0.58, pos: [X_EAST - 0.18, Y1 - 0.95, ez], rotY: Math.PI * 0.5, mat: mats.marbleTrim });
  }
  // Veranda Support Columns on Ground Floor (x = 186.1, spaced cleanly so walkways are 100% open!)
  for (const cz of [154.6, 160.8, 171.2, 177.4]) {
    cylinder(staticG, 0.28, 0.32, gH, [X_VERANDA - 0.35, gMidY, cz], mats.marbleTrim, 14);
    cylinder(staticG, 0.36, 0.38, 0.16, [X_VERANDA - 0.35, Y0 + 0.08, cz], mats.brassMat, 14);
    cylinder(staticG, 0.36, 0.36, 0.16, [X_VERANDA - 0.35, Y1 - 0.14, cz], mats.brassMat, 14);
  }

  // Ground Interior Room Dividers (wide open interior archways so player walks freely between Foyer, Ozu Khana, Library & Stairs!)
  // 1) Islamic Library Partition (North-West: x = 160.4..174.5, z = 154.4..163.8) — wide open doorway on East (x = 174.5, z = 157.5..161.2)
  box(staticG, [14.0, gH, 0.22], [167.4, gMidY, 163.8], mats.interiorWall);
  box(staticG, [0.22, gH, 3.1], [174.5, gMidY, 155.95], mats.interiorWall);
  box(staticG, [0.22, gH, 2.6], [174.5, gMidY, 162.5], mats.interiorWall);
  box(staticG, [0.22, 0.95, 3.7], [174.5, Y1 - 0.48, 159.35], mats.interiorWall);
  addMosqueSignPlaque(dynamicG, makeRoomSignTexture('ইসলামিক লাইব্রেরি ও পাঠাগার', 'ISLAMIC LIBRARY & STUDY HALL'), [174.66, Y0 + 2.85, 159.35], Math.PI * 0.5, 2.5, 0.56, false);

  // 2) Ozu Khana (Ablution Hall — South-Center: x = 169.4..176.2, z = 167.8..177.5) — tiled floor, open wide access on North & East!
  box(staticG, [6.8, 0.03, 9.5], [172.8, Y0 + 0.015, 172.6], mats.ozuTile, { castShadow: false });
  box(staticG, [0.22, 2.2, 7.6], [169.4, Y0 + 1.1, 173.6], mats.ozuTile); // Privacy divider separating Ozu Khana from Stairwell
  addMosqueSignPlaque(dynamicG, makeRoomSignTexture('অজুখানা (OZU KHANA)', 'ABLUTION & WASHING HALL'), [176.2, Y0 + 2.85, 172.6], Math.PI * 0.5, 2.3, 0.54, false);

  // Ozu Khana Detailed Tiled Benches, 10 Chrome Taps, Mirrors & Stainless Drainage Channel
  for (let i = 0; i < 5; i++) {
    const tz = 169.6 + i * 1.45;
    // West Ozu Row (facing West wall at x = 169.6)
    box(staticG, [0.50, 0.42, 0.62], [171.25, Y0 + 0.21, tz], mats.ozuTile); // Tiled sitting stool
    box(staticG, [0.44, 0.05, 0.56], [171.25, Y0 + 0.44, tz], mats.granite); // Granite seat top
    box(staticG, [0.46, 0.08, 1.38], [170.05, Y0 + 0.04, tz], mats.bronzeMat); // Drainage grate
    cylinder(staticG, 0.022, 0.022, 0.24, [169.68, Y0 + 0.72, tz], mats.chromeMat, 8); // Tap riser
    box(staticG, [0.22, 0.035, 0.035], [169.78, Y0 + 0.80, tz], mats.chromeMat); // Tap spout
    // East Ozu Row (back-to-back central tiled tap island at x = 174.4)
    box(staticG, [0.50, 0.42, 0.62], [173.15, Y0 + 0.21, tz], mats.ozuTile);
    box(staticG, [0.44, 0.05, 0.56], [173.15, Y0 + 0.44, tz], mats.granite);
    box(staticG, [0.46, 0.08, 1.38], [174.25, Y0 + 0.04, tz], mats.bronzeMat);
    cylinder(staticG, 0.022, 0.022, 0.24, [174.62, Y0 + 0.72, tz], mats.chromeMat, 8);
    box(staticG, [0.22, 0.035, 0.035], [174.52, Y0 + 0.80, tz], mats.chromeMat);
  }
  // Central tiled tap wall + Mirrors
  box(staticG, [0.28, 1.65, 7.6], [174.82, Y0 + 0.825, 172.5], mats.ozuTile);
  box(staticG, [0.04, 0.78, 6.2], [169.54, Y0 + 1.52, 172.5], mats.mirrorMat);
  box(staticG, [0.04, 0.78, 6.2], [174.66, Y0 + 1.52, 172.5], mats.mirrorMat);

  // 3) Islamic Library & Cultural Study Room Furniture (x = 160.6..174.0, z = 154.6..163.4)
  const bookColors = [bank.emeraldMat, bank.flowerRed, bank.awningBlue, mats.brassMat, bank.terracotta];
  for (let shelfIdx = 0; shelfIdx < 3; shelfIdx++) {
    const bx = 162.4 + shelfIdx * 3.4;
    box(staticG, [2.6, 2.25, 0.48], [bx, Y0 + 1.125, 154.9], mats.teakWood);
    for (let row = 0; row < 4; row++) {
      const sy = Y0 + 0.36 + row * 0.46;
      for (let bi = 0; bi < 8; bi++) {
        box(staticG, [0.24, 0.32, 0.28], [bx - 1.05 + bi * 0.30, sy, 155.02], bookColors[(shelfIdx + row + bi) % bookColors.length]);
      }
    }
  }
  // 2 Long Teak Reading Tables + 8 Wooden Chairs + Green Desk Lamps
  for (const tx of [164.6, 170.2]) {
    box(staticG, [2.8, 0.06, 1.15], [tx, Y0 + 0.76, 159.4], mats.lightWood);
    for (const [lx, lz] of [[-1.25, -0.48], [1.25, -0.48], [-1.25, 0.48], [1.25, 0.48]]) {
      box(staticG, [0.07, 0.74, 0.07], [tx + lx, Y0 + 0.37, 159.4 + lz], mats.teakWood);
    }
    // Reading lamp on table center
    cylinder(staticG, 0.06, 0.09, 0.30, [tx, Y0 + 0.94, 159.4], mats.brassMat, 8);
    cylinder(staticG, 0.16, 0.22, 0.14, [tx, Y0 + 1.12, 159.4], bank.emeraldMat, 10);
    // 4 Chairs around each table
    for (const cxOff of [-0.72, 0.72]) {
      for (const czSign of [-1, 1]) {
        const chz = 159.4 + czSign * 0.84;
        box(staticG, [0.46, 0.05, 0.44], [tx + cxOff, Y0 + 0.46, chz], mats.teakWood);
        box(staticG, [0.46, 0.44, 0.05], [tx + cxOff, Y0 + 0.70, chz + czSign * 0.20], mats.teakWood);
        for (const [clx, clz] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) {
          box(staticG, [0.04, 0.44, 0.04], [tx + cxOff + clx, Y0 + 0.22, chz + clz], mats.bronzeMat);
        }
      }
    }
  }
  addCeilingFan(staticG, mats, 165.0, Y1 - 0.18, 159.2);
  addCeilingFan(staticG, mats, 170.5, Y1 - 0.18, 159.2);

  // 4) East Reception & Shoe-Rack Foyer (x = 176.2..181.6, z = 155..177)
  // Reception Counter Desk (center-east)
  box(staticG, [0.85, 1.02, 3.2], [178.4, Y0 + 0.51, 166.0], mats.teakWood);
  box(staticG, [0.95, 0.07, 3.3], [178.4, Y0 + 1.04, 166.0], mats.marbleTrim);
  // Carved Wooden Shoe Racks along East interior wall
  for (const sz of [162.2, 169.8]) {
    box(staticG, [0.42, 1.05, 3.0], [X_EAST - 0.58, Y0 + 0.525, sz], mats.teakWood);
    for (let row = 0; row < 3; row++) {
      box(staticG, [0.36, 0.04, 2.86], [X_EAST - 0.58, Y0 + 0.24 + row * 0.30, sz], mats.lightWood);
    }
  }
  // Ground Floor Warm LED Ceiling Lights
  for (const [lx, lz] of [[178.5, 159.0], [178.5, 166.0], [178.5, 173.0], [172.5, 172.0], [167.5, 159.0], [165.0, 167.5]]) {
    box(dynamicG, [0.9, 0.05, 0.9], [lx, Y1 - 0.20, lz], mats.ledStrip, { castShadow: false });
  }

  /* --------------------------------------------------------------------------
   * 3. 2ND FLOOR SLAB (y = 3.80m) & GRAND FRONT WHITE MARBLE STAIRCASE
   * ------------------------------------------------------------------------ */
  // 2nd Floor Slab with clean Stairwell Cutout (x = 160.5..169.0, z = 173.4..177.6)
  box(staticG, [W + 4.5, 0.28, 19.4], [MX + 2.25, Y1 - 0.14, 163.7], mats.marbleWall); // North & Center slab (z = 154.0..173.4)
  box(staticG, [17.5, 0.28, 4.6], [177.75, Y1 - 0.14, 175.7], mats.marbleWall); // South-East slab beside stairwell (x = 169.0..186.5, z = 173.4..178.0)

  // Grand Front White Marble Staircase (x = 186.5..193.0, z = 161.0..171.0, climbs from y = 0.08 to Y1 = 3.80m)
  const frontSteps = 16;
  for (let i = 0; i < frontSteps; i++) {
    const t = (i + 0.5) / frontSteps;
    const sx = THREE.MathUtils.lerp(FRONT_STAIR_X1, FRONT_STAIR_X0, t);
    const sy = THREE.MathUtils.lerp(0.08, Y1, (i + 1) / frontSteps);
    box(staticG, [0.46, sy, 10.0], [sx, sy * 0.5, MZ], mats.marbleTrim);
    box(staticG, [0.06, 0.025, 10.0], [sx + 0.20, sy + 0.01, MZ], mats.granite);
  }
  // Low Side Balustrade Walls flanking the Front Staircase (at z = 160.8 and z = 171.2)
  for (const sz of [FRONT_STAIR_Z0 - 0.22, FRONT_STAIR_Z1 + 0.22]) {
    rodBetween(staticG, [FRONT_STAIR_X1, 1.05, sz], [FRONT_STAIR_X0, Y1 + 0.95, sz], 0.055, mats.brassMat, 10);
    box(staticG, [6.6, 0.36, 0.34], [189.75, 0.18, sz], mats.marbleTrim);
  }
  // 2nd Floor East Veranda Marble Railings (North z = 154.0..161.0, South z = 171.0..178.0, leaving Stair Top OPEN!)
  box(staticG, [0.24, 1.0, 6.8], [X_VERANDA - 0.12, Y1 + 0.50, 157.4], mats.marbleTrim);
  box(staticG, [0.24, 1.0, 6.8], [X_VERANDA - 0.12, Y1 + 0.50, 174.6], mats.marbleTrim);
  box(staticG, [4.5, 1.0, 0.24], [X_EAST + 2.25, Y1 + 0.50, Z_NORTH + 0.12], mats.marbleTrim);
  box(staticG, [4.5, 1.0, 0.24], [X_EAST + 2.25, Y1 + 0.50, Z_SOUTH - 0.12], mats.marbleTrim);

  /* --------------------------------------------------------------------------
   * 4. INTERIOR SWITCHBACK MARBLE STAIRCASE (CONNECTS GROUND -> 2ND -> 3RD FLOOR!)
   * ------------------------------------------------------------------------ */
  const buildInteriorSwitchback = (yBot, yTop) => {
    const yMid = (yBot + yTop) * 0.5;
    const steps = 11;
    // Lower flight: z = 173.5..175.3, climbs going West (x: 169.0 -> 162.6)
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const sx = THREE.MathUtils.lerp(STAIR_X1, STAIR_X_LAND, t);
      const sy = THREE.MathUtils.lerp(yBot, yMid, (i + 1) / steps);
      box(staticG, [0.62, 0.24, 1.85], [sx, sy - 0.12, 174.4], mats.marbleTrim);
      box(staticG, [0.05, 0.02, 1.85], [sx + 0.28, sy + 0.005, 174.4], mats.granite);
    }
    // Mid-Landing (x = 160.5..162.6, z = 173.4..177.4)
    box(staticG, [2.2, 0.24, 4.0], [161.55, yMid - 0.12, 175.4], mats.marbleTrim);
    // Upper flight: z = 175.5..177.3, climbs going East (x: 162.6 -> 169.0)
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const sx = THREE.MathUtils.lerp(STAIR_X_LAND, STAIR_X1, t);
      const sy = THREE.MathUtils.lerp(yMid, yTop, (i + 1) / steps);
      box(staticG, [0.62, 0.24, 1.85], [sx, sy - 0.12, 176.4], mats.marbleTrim);
      box(staticG, [0.05, 0.02, 1.85], [sx - 0.28, sy + 0.005, 176.4], mats.granite);
    }
    // Brass handrails
    rodBetween(staticG, [STAIR_X1, yBot + 0.92, STAIR_Z_MID], [STAIR_X_LAND, yMid + 0.92, STAIR_Z_MID], 0.036, mats.brassMat, 8);
    rodBetween(staticG, [STAIR_X_LAND, yMid + 0.92, STAIR_Z_MID], [STAIR_X1, yTop + 0.92, STAIR_Z_MID], 0.036, mats.brassMat, 8);
  };
  buildInteriorSwitchback(Y0, Y1);
  buildInteriorSwitchback(Y1, Y2);

  /* --------------------------------------------------------------------------
   * 5. 2ND FLOOR MAIN PRAYER HALL (y = 3.80m .. 8.40m) — REALISTIC INTERIOR!
   * ------------------------------------------------------------------------ */
  const h2 = Y2 - Y1; // 4.60m
  const midY2 = Y1 + h2 * 0.5;

  // Emerald-Gold Woven Saff Prayer Carpet (with stairwell cutout!)
  box(staticG, [W - 0.9, 0.035, 18.8], [MX, Y1 + 0.018, 163.8], mats.carpet, { castShadow: false });
  box(staticG, [12.4, 0.035, 4.4], [175.4, Y1 + 0.018, 175.4], mats.carpet, { castShadow: false });

  // Perimeter Walls of 2nd Floor & 3rd Floor (y = 3.80m .. 13.40m)
  const upperH = Y_ROOF - Y1; // 9.60m
  const upperMidY = Y1 + upperH * 0.5;

  // West Qibla Wall (x = 160.0)
  box(staticG, [0.38, upperH, D], [X_WEST + 0.19, upperMidY, MZ], mats.marbleWall);
  // North & South Exterior Walls (z = 154.0 and z = 178.0)
  box(staticG, [W, upperH, 0.38], [MX, upperMidY, Z_NORTH + 0.19], mats.marbleWall);
  box(staticG, [W, upperH, 0.38], [MX, upperMidY, Z_SOUTH - 0.19], mats.marbleWall);

  // East Front Facade Wall (x = 182.0) on 2nd Floor with 3 WIDE ARCHED ENTRANCE PORTALS:
  // - North Portal: z = 157.5..160.5 (3.0m wide)
  // - Grand Center Portal: z = 163.8..168.2 (4.4m wide — interactive carved teak double doors!)
  // - South Portal: z = 171.5..174.5 (3.0m wide)
  box(staticG, [0.42, h2, 3.5], [X_EAST - 0.21, midY2, 155.75], mats.marbleWall);
  box(staticG, [0.42, h2, 3.3], [X_EAST - 0.21, midY2, 162.15], mats.marbleWall);
  box(staticG, [0.42, h2, 3.3], [X_EAST - 0.21, midY2, 169.85], mats.marbleWall);
  box(staticG, [0.42, h2, 3.5], [X_EAST - 0.21, midY2, 176.25], mats.marbleWall);
  // Clean geometric pointed arches above all 3 portals (STRICTLY ZERO ARABIC TEXT!)
  addPointedArchSpandrel(staticG, { span: 3.0, height: 1.5, depth: 0.42, archRise: 0.72, pos: [X_EAST - 0.21, Y1 + 3.1, 159.0], rotY: Math.PI * 0.5, mat: mats.marbleTrim });
  addPointedArchSpandrel(staticG, { span: 4.4, height: 1.3, depth: 0.46, archRise: 0.88, pos: [X_EAST - 0.21, Y1 + 3.3, MZ], rotY: Math.PI * 0.5, mat: mats.marbleTrim });
  addPointedArchSpandrel(staticG, { span: 3.0, height: 1.5, depth: 0.42, archRise: 0.72, pos: [X_EAST - 0.21, Y1 + 3.1, 173.0], rotY: Math.PI * 0.5, mat: mats.marbleTrim });

  // Interactive Carved Teak Double Doors at the Grand Center Portal (x = 181.8, z = 163.8..168.2)
  const buildTeakDoorLeaf = (hingeZ, sign) => {
    const leaf = new THREE.Group();
    leaf.position.set(X_EAST - 0.22, Y1, hingeZ);
    box(leaf, [0.09, 3.25, 2.05], [0, 1.625, sign * 1.025], mats.teakWood);
    box(leaf, [0.12, 1.10, 1.60], [0, 0.82, sign * 1.025], mats.lightWood);
    box(leaf, [0.12, 1.35, 1.60], [0, 2.30, sign * 1.025], mats.lightWood);
    cylinder(leaf, 0.025, 0.025, 0.45, [0.08, 1.35, sign * 1.85], mats.brassMat, 8);
    cylinder(leaf, 0.025, 0.025, 0.45, [-0.08, 1.35, sign * 1.85], mats.brassMat, 8);
    dynamicG.add(leaf);
    return leaf;
  };
  mosqueDoorState.leftLeaf = buildTeakDoorLeaf(163.9, 1);
  mosqueDoorState.rightLeaf = buildTeakDoorLeaf(168.1, -1);
  mosqueDoorState.leftLeaf.rotation.y = mosqueDoorState.mainHallAngle;
  mosqueDoorState.rightLeaf.rotation.y = -mosqueDoorState.mainHallAngle;

  // 3rd Floor East Facade Wall (y = 8.40..13.40m) + Jaali Cladding Strips + Glazed Arched Windows
  const h3 = Y_ROOF - Y2; // 5.00m
  box(staticG, [0.42, h3, D], [X_EAST - 0.21, Y2 + h3 * 0.5, MZ], mats.marbleWall);
  // Signature Model Mosque Geometric Jaali Wing Panels on East Facade
  for (const dz of [-9.4, 9.4]) {
    box(staticG, [0.18, upperH - 0.4, 3.0], [X_EAST + 0.08, upperMidY, MZ + dz], mats.jaali);
    box(staticG, [0.24, upperH - 0.2, 0.20], [X_EAST + 0.10, upperMidY, MZ + dz - 1.55], mats.marbleTrim);
    box(staticG, [0.24, upperH - 0.2, 0.20], [X_EAST + 0.10, upperMidY, MZ + dz + 1.55], mats.marbleTrim);
  }
  // 3rd Floor East Arched Glazed Windows
  for (const [wz, ww] of [[-5.0, 2.4], [0, 3.8], [5.0, 2.4]]) {
    addArchedGlazedWindow(staticG, dynamicG, mats, X_EAST + 0.05, Y2 + 1.0, MZ + wz, ww, 2.9, Math.PI * 0.5);
  }
  // North & South Exterior Arched Glazed Windows (both 2nd & 3rd floor)
  for (const sideSign of [-1, 1]) {
    const wz = MZ + sideSign * (D * 0.5);
    for (const bx of [-7.0, -2.5, 2.5, 7.0]) {
      addArchedGlazedWindow(staticG, dynamicG, mats, MX + bx, Y1 + 0.95, wz + sideSign * 0.04, 2.1, 2.8, 0);
      addArchedGlazedWindow(staticG, dynamicG, mats, MX + bx, Y2 + 1.0, wz + sideSign * 0.04, 2.1, 2.8, 0);
    }
  }

  // RECESSED ARCHED MIHRAB (West Qibla Wall, x = 160.5, z = 166.0)
  box(staticG, [0.75, 4.1, 4.2], [X_WEST + 0.65, Y1 + 2.05, MZ], mats.marbleTrim);
  box(staticG, [0.42, 3.6, 3.0], [X_WEST + 0.88, Y1 + 1.80, MZ], mats.tealAccent);
  addPointedArchSpandrel(staticG, { span: 3.0, height: 1.1, depth: 0.44, archRise: 0.78, pos: [X_WEST + 0.96, Y1 + 2.75, MZ], rotY: Math.PI * 0.5, mat: mats.marbleTrim });
  for (const dz of [-1.52, 1.52]) {
    cylinder(staticG, 0.14, 0.16, 3.4, [X_WEST + 1.06, Y1 + 1.70, MZ + dz], mats.marbleTrim, 12);
    cylinder(staticG, 0.18, 0.18, 0.14, [X_WEST + 1.06, Y1 + 3.40, MZ + dz], mats.brassMat, 12);
  }
  // Warm hidden Mihrab arch light
  box(dynamicG, [0.10, 0.08, 2.4], [X_WEST + 0.96, Y1 + 3.65, MZ], mats.warmBulb, { castShadow: false });

  // CARVED TEAK MIMBAR (PULPIT) — 5 steps + handrail + canopy beside Mihrab (z = 162.2)
  const mimX = X_WEST + 1.85;
  const mimZ = MZ - 3.6;
  for (let s = 0; s < 5; s++) {
    box(staticG, [0.38, 0.28 * (s + 1), 1.15], [mimX + 1.35 - s * 0.36, Y1 + 0.14 * (s + 1), mimZ], mats.teakWood);
  }
  box(staticG, [1.25, 1.55, 1.25], [mimX - 0.52, Y1 + 0.775, mimZ], mats.teakWood);
  for (const [cx, cz] of [[-1.08, -0.56], [-1.08, 0.56], [0.02, -0.56], [0.02, 0.56]]) {
    cylinder(staticG, 0.045, 0.05, 1.85, [mimX + cx, Y1 + 2.45, mimZ + cz], mats.teakWood, 8);
  }
  box(staticG, [1.38, 0.24, 1.38], [mimX - 0.52, Y1 + 3.42, mimZ], mats.teakWood);
  const mimDome = new THREE.Mesh(new THREE.SphereGeometry(0.54, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), mats.brassMat);
  mimDome.position.set(mimX - 0.52, Y1 + 3.54, mimZ);
  staticG.add(mimDome);

  // Imam Mic Stand + Quran Rehal Stands along front saff
  cylinder(staticG, 0.14, 0.16, 0.05, [X_WEST + 1.95, Y1 + 0.03, MZ], mats.bronzeMat, 10);
  cylinder(staticG, 0.015, 0.015, 1.35, [X_WEST + 1.95, Y1 + 0.70, MZ], mats.chromeMat, 6);
  for (const rz of [158.0, 160.2, 169.8, 172.0]) {
    box(staticG, [0.42, 0.28, 0.54], [X_WEST + 2.2, Y1 + 0.16, rz], mats.teakWood);
    box(staticG, [0.34, 0.05, 0.44], [X_WEST + 2.2, Y1 + 0.33, rz], bank.chalkLine);
  }

  // Digital Bengali Prayer Time Board on Qibla Wall (North of Mimbar)
  addMosqueSignPlaque(dynamicG, makePrayerTimeBoardTexture(), [X_WEST + 0.46, Y1 + 2.25, 158.2], Math.PI * 0.5, 1.45, 1.82, true, bank.emissiveList);

  // 8 Fluted White Marble Structural Columns supporting Upper Gallery & Central Dome
  const colCoords = [
    [MX - 5.2, MZ - 5.2], [MX - 5.2, MZ + 5.2],
    [MX + 4.8, MZ - 5.2], [MX + 4.8, MZ + 5.2],
    [MX - 5.2, MZ - 10.2], [MX - 5.2, MZ + 10.2],
    [MX + 4.8, MZ - 10.2], [MX + 4.8, MZ + 10.2],
  ];
  for (const [cx, cz] of colCoords) {
    cylinder(staticG, 0.32, 0.36, upperH, [cx, upperMidY, cz], mats.marbleTrim, 14);
    cylinder(staticG, 0.42, 0.44, 0.18, [cx, Y1 + 0.09, cz], mats.brassMat, 14);
    cylinder(staticG, 0.42, 0.42, 0.18, [cx, Y2 - 0.16, cz], mats.brassMat, 14);
    cylinder(staticG, 0.42, 0.42, 0.18, [cx, Y_ROOF - 0.18, cz], mats.brassMat, 14);
  }

  // 6 Realistic Ceiling Fans + Split ACs + Warm Downlights in 2nd Floor Prayer Hall
  for (const [fx, fz] of [
    [MX - 5.0, MZ - 7.8], [MX + 4.8, MZ - 7.8],
    [MX - 5.0, MZ + 7.8], [MX + 4.8, MZ + 7.8],
    [MX + 7.6, MZ - 2.6], [MX + 7.6, MZ + 2.6],
  ]) {
    addCeilingFan(staticG, mats, fx, Y2 - 0.22, fz);
    box(dynamicG, [0.75, 0.05, 0.75], [fx, Y2 - 0.26, fz + 1.6], mats.ledStrip, { castShadow: false });
  }
  for (const acZ of [156.5, 166.0, 175.5]) {
    box(staticG, [0.28, 0.36, 1.35], [X_WEST + 0.52, Y1 + 3.65, acZ], mats.acMat);
  }

  /* --------------------------------------------------------------------------
   * 6. 3RD FLOOR UPPER PRAYER GALLERY (y = 8.40m) WITH OPEN CENTRAL DOME ATRIUM
   * ------------------------------------------------------------------------ */
  // Atrium Opening: x = 166.0..176.0, z = 161.0..171.0 (10m x 10m majestic open view of central dome!)
  // Stairwell Opening: x = 160.5..169.0, z = 173.4..177.6
  box(staticG, [W, 0.26, 7.0], [MX, Y2 - 0.13, 157.5], mats.marbleWall); // North gallery wing (z = 154..161)
  box(staticG, [6.0, 0.26, 12.4], [163.0, Y2 - 0.13, 167.2], mats.marbleWall); // West gallery wing (x = 160..166, z = 161..173.4)
  box(staticG, [6.0, 0.26, 17.0], [179.0, Y2 - 0.13, 169.5], mats.marbleWall); // East gallery wing (x = 176..182, z = 161..178)
  box(staticG, [7.0, 0.26, 7.0], [172.5, Y2 - 0.13, 174.5], mats.marbleWall); // South-Center gallery wing (x = 169..176, z = 171..178)
  box(staticG, [3.0, 0.26, 2.4], [167.5, Y2 - 0.13, 172.2], mats.marbleWall); // Bridge north of stairwell (x = 166..169, z = 171..173.4)

  // Prayer carpets on 3rd Floor Gallery
  box(staticG, [W - 1.0, 0.03, 6.2], [MX, Y2 + 0.015, 157.6], mats.carpet, { castShadow: false });
  box(staticG, [5.2, 0.03, 11.8], [163.1, Y2 + 0.015, 167.1], mats.carpet, { castShadow: false });
  box(staticG, [5.2, 0.03, 16.0], [178.9, Y2 + 0.015, 169.4], mats.carpet, { castShadow: false });
  box(staticG, [6.6, 0.03, 6.2], [172.5, Y2 + 0.015, 174.4], mats.carpet, { castShadow: false });

  // Safe Marble & Brass Atrium Balustrades around Central Opening (x = 166..176, z = 161..171)
  box(staticG, [10.2, 0.96, 0.20], [MX, Y2 + 0.48, 161.0], mats.marbleTrim);
  box(staticG, [10.2, 0.96, 0.20], [MX, Y2 + 0.48, 171.0], mats.marbleTrim);
  box(staticG, [0.20, 0.96, 10.2], [166.0, Y2 + 0.48, MZ], mats.marbleTrim);
  box(staticG, [0.20, 0.96, 10.2], [176.0, Y2 + 0.48, MZ], mats.marbleTrim);
  box(staticG, [10.3, 0.07, 0.24], [MX, Y2 + 0.98, 161.0], mats.brassMat);
  box(staticG, [10.3, 0.07, 0.24], [MX, Y2 + 0.98, 171.0], mats.brassMat);
  box(staticG, [0.24, 0.07, 10.3], [166.0, Y2 + 0.98, MZ], mats.brassMat);
  box(staticG, [0.24, 0.07, 10.3], [176.0, Y2 + 0.98, MZ], mats.brassMat);

  // Grand Multi-Tier Brass & Crystal Chandelier suspended down through the Central Dome Atrium
  cylinder(staticG, 0.045, 0.045, 5.2, [MX, Y_ROOF - 2.6, MZ], mats.brassMat, 10);
  for (const [ringR, ringY, bulbs] of [[2.2, Y2 + 1.0, 12], [1.45, Y2 + 0.15, 8], [0.75, Y2 - 0.55, 6]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(ringR, 0.065, 8, 28), mats.brassMat);
    ring.rotation.x = Math.PI * 0.5;
    ring.position.set(MX, ringY, MZ);
    staticG.add(ring);
    for (let i = 0; i < bulbs; i++) {
      const a = (i / bulbs) * Math.PI * 2;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mats.warmBulb);
      bulb.position.set(MX + Math.cos(a) * ringR, ringY - 0.16, MZ + Math.sin(a) * ringR);
      dynamicG.add(bulb);
    }
  }

  /* --------------------------------------------------------------------------
   * 7. ROOF SLAB, 4 REALISTIC MARBLE DOMES & 32m MINARET (CLEAR OF ALL DOORS!)
   * ------------------------------------------------------------------------ */
  box(staticG, [W + 0.8, 0.42, D + 0.8], [MX, Y_ROOF + 0.21, MZ], mats.marbleWall);
  box(staticG, [W + 1.0, 0.18, D + 1.0], [MX, Y_ROOF + 0.48, MZ], mats.tealAccent);
  // Roof Parapet
  box(staticG, [W + 0.6, 1.05, 0.26], [MX, Y_ROOF + 0.98, Z_NORTH], mats.marbleTrim);
  box(staticG, [W + 0.6, 1.05, 0.26], [MX, Y_ROOF + 0.98, Z_SOUTH], mats.marbleTrim);
  box(staticG, [0.26, 1.05, D + 0.6], [X_WEST, Y_ROOF + 0.98, MZ], mats.marbleTrim);
  box(staticG, [0.26, 1.05, D + 0.6], [X_EAST, Y_ROOF + 0.98, MZ], mats.marbleTrim);

  const addRibbedDome = (dx, dz, radius, drumH, withWindows = false) => {
    const baseY = Y_ROOF + 0.42;
    cylinder(staticG, radius * 1.02, radius * 1.05, drumH, [dx, baseY + drumH * 0.5, dz], mats.marbleWall, 28);
    cylinder(staticG, radius * 1.07, radius * 1.07, 0.18, [dx, baseY + drumH, dz], mats.tealAccent, 28);
    cylinder(staticG, radius * 1.08, radius * 1.08, 0.08, [dx, baseY + drumH + 0.12, dz], mats.brassMat, 28);
    if (withWindows) {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const w = box(dynamicG, [0.12, drumH * 0.56, 0.72], [dx + Math.cos(a) * (radius * 1.03), baseY + drumH * 0.5, dz + Math.sin(a) * (radius * 1.03)], bank.mosqueGlow, { castShadow: false });
        w.rotation.y = -a;
      }
    }
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.52),
      mats.marbleDome
    );
    dome.position.set(dx, baseY + drumH + 0.08, dz);
    dome.castShadow = true;
    dome.receiveShadow = true;
    staticG.add(dome);

    const topY = baseY + drumH + 0.08 + radius;
    cylinder(staticG, 0.055, 0.085, 2.0, [dx, topY + 0.95, dz], mats.brassMat, 10);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8), mats.brassMat);
    orb.position.set(dx, topY + 0.58, dz);
    staticG.add(orb);
  };

  // 1 Grand Central Dome + 3 Front Smaller Domes
  addRibbedDome(MX, MZ, 5.4, 1.55, true);
  addRibbedDome(X_EAST - 3.0, MZ - 7.4, 2.25, 0.85, false);
  addRibbedDome(X_EAST - 3.0, MZ, 2.55, 0.95, false);
  addRibbedDome(X_EAST - 3.0, MZ + 7.4, 2.25, 0.85, false);

  // TALL 32m SQUARE JAALI MINARET — Placed cleanly at North-East Plaza (x = 184.8, z = 150.6) so it NEVER blocks any doorway!
  const minX = 184.8;
  const minZ = 150.6;
  const minH = 31.0;
  box(staticG, [4.0, 0.8, 4.0], [minX, 0.4, minZ], mats.granite);
  box(staticG, [3.4, minH, 3.4], [minX, minH * 0.5 + 0.4, minZ], mats.jaali);
  for (const sx of [-1.58, 1.58]) {
    for (const sz of [-1.58, 1.58]) {
      box(staticG, [0.34, minH + 0.6, 0.34], [minX + sx, minH * 0.5 + 0.4, minZ + sz], mats.marbleTrim);
    }
  }
  for (const balY of [14.0, 23.5, minH - 2.6]) {
    box(staticG, [4.3, 0.34, 4.3], [minX, balY, minZ], mats.marbleTrim);
    box(staticG, [4.35, 0.14, 4.35], [minX, balY + 0.22, minZ], mats.tealAccent);
    box(staticG, [4.15, 0.85, 0.16], [minX, balY + 0.62, minZ - 2.02], mats.marbleTrim);
    box(staticG, [4.15, 0.85, 0.16], [minX, balY + 0.62, minZ + 2.02], mats.marbleTrim);
    box(staticG, [0.16, 0.85, 4.15], [minX - 2.02, balY + 0.62, minZ], mats.marbleTrim);
    box(staticG, [0.16, 0.85, 4.15], [minX + 2.02, balY + 0.62, minZ], mats.marbleTrim);
  }
  box(staticG, [3.6, 0.8, 3.6], [minX, minH + 0.8, minZ], mats.marbleTrim);
  const minDome = new THREE.Mesh(new THREE.SphereGeometry(1.55, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), mats.marbleDome);
  minDome.position.set(minX, minH + 1.2, minZ);
  staticG.add(minDome);
  cylinder(staticG, 0.05, 0.08, 2.2, [minX, minH + 3.6, minZ], mats.brassMat, 10);

  // Clean Bengali & English Facade Plaque (ZERO Arabic text!)
  addMosqueSignPlaque(
    dynamicG,
    makeMosquePlaqueTexture(),
    [X_EAST + 0.36, Y2 + 0.32, MZ],
    Math.PI * 0.5,
    9.4,
    1.34,
    true,
    bank.emissiveList
  );

  // Courtyard Lamps & Landscaping Planters
  for (const [lx, lz] of [[194.2, 159.5], [194.2, 172.5], [188.2, 152.5], [188.2, 179.5]]) {
    addCourtyardLamp(staticG, dynamicG, mats, lx, lz, 4.5, 0.08);
  }
  for (const [px, pz] of [[193.6, 156.5], [193.6, 175.5], [180.0, 152.0], [180.0, 180.0]]) {
    box(staticG, [1.8, 0.45, 1.8], [px, 0.28, pz], mats.marbleTrim);
    box(staticG, [1.4, 0.55, 1.4], [px, 0.65, pz], mats.moss);
  }
}

/* ============================================================================
 * WALKABLE MULTI-FLOOR PHYSICS, COLLISIONS, INTERACTIVE DOORS & SEATS
 * ========================================================================== */

export function getModelMosqueGroundHeight(pos, grounded = true, verticalVelocity = 0) {
  if (!pos) return 0.0;
  if (pos.x < X_WEST - 1.5 || pos.x > FRONT_STAIR_X1 + 1.5 || pos.z < Z_NORTH - 1.5 || pos.z > Z_SOUTH + 1.5) {
    return 0.0;
  }

  const footY = pos.y - 1.68;
  const maxStepUp = grounded ? 0.62 : (verticalVelocity > 0 ? 0.08 : 0.42);

  // 1) Grand Front White Marble Staircase (x = 186.5..193.0, z = 161.0..171.0)
  if (pos.x >= FRONT_STAIR_X0 && pos.x <= FRONT_STAIR_X1 && pos.z >= FRONT_STAIR_Z0 && pos.z <= FRONT_STAIR_Z1) {
    const t = THREE.MathUtils.clamp((FRONT_STAIR_X1 - pos.x) / (FRONT_STAIR_X1 - FRONT_STAIR_X0), 0, 1);
    const stairY = 0.08 + t * (Y1 - 0.08);
    if (stairY <= footY + maxStepUp) return stairY;
    return 0.08;
  }

  // 2) Inside Main Mosque & East Veranda Footprint (x = 160.0..186.5, z = 154.0..178.0)
  if (pos.x >= X_WEST && pos.x <= X_VERANDA && pos.z >= Z_NORTH && pos.z <= Z_SOUTH) {
    let bestY = Y0;

    // A) Interior Switchback Marble Stairwell (x = 160.4..169.2, z = 173.4..177.6)
    const inStairwell = pos.x >= X_WEST + 0.2 && pos.x <= STAIR_X1 + 0.2 && pos.z >= STAIR_Z0 && pos.z <= STAIR_Z1 + 0.2;
    if (inStairwell) {
      for (const [yBot, yTop] of [[Y0, Y1], [Y1, Y2]]) {
        const yMid = (yBot + yTop) * 0.5;
        if (pos.x <= STAIR_X_LAND) {
          if (yMid <= footY + maxStepUp) bestY = Math.max(bestY, yMid);
        } else if (pos.z < STAIR_Z_MID) {
          const t = THREE.MathUtils.clamp((STAIR_X1 - pos.x) / (STAIR_X1 - STAIR_X_LAND), 0, 1);
          const sy = yBot + t * (yMid - yBot);
          if (sy <= footY + maxStepUp) bestY = Math.max(bestY, sy);
        } else {
          const t = THREE.MathUtils.clamp((pos.x - STAIR_X_LAND) / (STAIR_X1 - STAIR_X_LAND), 0, 1);
          const sy = yMid + t * (yTop - yMid);
          if (sy <= footY + maxStepUp) bestY = Math.max(bestY, sy);
        }
      }
      return bestY;
    }

    // B) 2nd Floor Main Prayer Hall & Veranda Slab (y = 3.80m)
    if (Y1 <= footY + maxStepUp) {
      bestY = Math.max(bestY, Y1);
    }

    // C) 3rd Floor Upper Prayer Gallery Slab (y = 8.40m — respects Central Atrium Opening!)
    const inAtrium = pos.x > 166.1 && pos.x < 175.9 && pos.z > 161.1 && pos.z < 170.9;
    const onGallery = pos.x <= X_EAST && !inAtrium;
    if (onGallery && Y2 <= footY + maxStepUp) {
      bestY = Math.max(bestY, Y2);
    }

    return bestY;
  }

  return 0.08;
}

function resolveCircleAABB(pos, radius, minX, maxX, minZ, maxZ) {
  const cx = THREE.MathUtils.clamp(pos.x, minX, maxX);
  const cz = THREE.MathUtils.clamp(pos.z, minZ, maxZ);
  const dx = pos.x - cx;
  const dz = pos.z - cz;
  const dSq = dx * dx + dz * dz;
  if (dSq < radius * radius) {
    if (dSq > 1e-8) {
      const d = Math.sqrt(dSq);
      const push = radius - d;
      pos.x += (dx / d) * push;
      pos.z += (dz / d) * push;
    } else {
      const l = Math.abs(pos.x - minX);
      const r = Math.abs(maxX - pos.x);
      const b = Math.abs(pos.z - minZ);
      const f = Math.abs(pos.z - maxZ);
      const m = Math.min(l, r, b, f);
      if (m === l) pos.x = minX - radius;
      else if (m === r) pos.x = maxX + radius;
      else if (m === b) pos.z = minZ - radius;
      else pos.z = maxZ + radius;
    }
  }
}

export function applyModelMosqueCollisions(pos, radius = 0.34, footY = 0) {
  if (!pos) return;
  if (pos.x < X_WEST - 2.0 || pos.x > FRONT_STAIR_X1 + 2.0 || pos.z < Z_NORTH - 6.0 || pos.z > Z_SOUTH + 2.0) {
    return;
  }

  // Minaret Base (placed cleanly at NE Plaza x = 184.8, z = 150.6 — never blocks any entrance!)
  if (footY < 32.0) {
    resolveCircleAABB(pos, radius, 182.8, 186.8, 148.6, 152.6);
  }

  // Grand Front Staircase Side Railings
  if (footY < Y1 + 1.2 && pos.x >= FRONT_STAIR_X0 && pos.x <= FRONT_STAIR_X1) {
    resolveCircleAABB(pos, radius, FRONT_STAIR_X0, FRONT_STAIR_X1, FRONT_STAIR_Z0 - 0.40, FRONT_STAIR_Z0);
    resolveCircleAABB(pos, radius, FRONT_STAIR_X0, FRONT_STAIR_X1, FRONT_STAIR_Z1, FRONT_STAIR_Z1 + 0.40);
  }

  if (footY >= Y_ROOF - 0.4) return;

  // West Solid Perimeter Wall (all floors)
  resolveCircleAABB(pos, radius, X_WEST - 0.1, X_WEST + 0.45, Z_NORTH, Z_SOUTH);

  if (footY < Y1 - 0.6) {
    // --- GROUND FLOOR COLLISIONS (WIDE OPEN ENTRANCES!) ---
    // North Wall (open entrance x = 170.0..173.5)
    resolveCircleAABB(pos, radius, X_WEST, 170.0, Z_NORTH - 0.1, Z_NORTH + 0.42);
    resolveCircleAABB(pos, radius, 173.5, X_EAST, Z_NORTH - 0.1, Z_NORTH + 0.42);
    // South Wall (open entrance x = 170.0..173.5)
    resolveCircleAABB(pos, radius, X_WEST, 170.0, Z_SOUTH - 0.42, Z_SOUTH + 0.1);
    resolveCircleAABB(pos, radius, 173.5, X_EAST, Z_SOUTH - 0.42, Z_SOUTH + 0.1);
    // East Wall (open wide entrances at z = 156.5..160.0 and z = 172.0..175.5!)
    resolveCircleAABB(pos, radius, X_EAST - 0.42, X_EAST + 0.08, Z_NORTH, 156.5);
    resolveCircleAABB(pos, radius, X_EAST - 0.42, X_EAST + 0.08, 160.0, 172.0);
    resolveCircleAABB(pos, radius, X_EAST - 0.42, X_EAST + 0.08, 175.5, Z_SOUTH);

    // Islamic Library Divider Wall (open wide doorway at x = 174.5, z = 157.5..161.2)
    resolveCircleAABB(pos, radius, X_WEST, 174.5, 163.68, 163.94);
    resolveCircleAABB(pos, radius, 174.38, 174.64, Z_NORTH, 157.5);
    resolveCircleAABB(pos, radius, 174.38, 174.64, 161.2, 163.9);

    // Ozu Khana Privacy Divider (between stairwell & Ozu Khana) & Central Tap Wall
    resolveCircleAABB(pos, radius, 169.28, 169.54, 169.8, Z_SOUTH);
    resolveCircleAABB(pos, radius, 174.66, 174.98, 168.7, 176.3);
    // Reception Desk
    resolveCircleAABB(pos, radius, 177.95, 178.85, 164.35, 167.65);
  } else if (footY < Y2 - 0.6) {
    // --- 2ND FLOOR MAIN PRAYER HALL COLLISIONS ---
    // North & South Exterior Walls
    resolveCircleAABB(pos, radius, X_WEST, X_EAST, Z_NORTH - 0.1, Z_NORTH + 0.42);
    resolveCircleAABB(pos, radius, X_WEST, X_EAST, Z_SOUTH - 0.42, Z_SOUTH + 0.1);

    // East Facade Wall with 3 Wide Open Arched Portals (157.5..160.5, 163.8..168.2, 171.5..174.5)
    resolveCircleAABB(pos, radius, X_EAST - 0.44, X_EAST + 0.08, Z_NORTH, 157.5);
    resolveCircleAABB(pos, radius, X_EAST - 0.44, X_EAST + 0.08, 160.5, 163.8);
    resolveCircleAABB(pos, radius, X_EAST - 0.44, X_EAST + 0.08, 168.2, 171.5);
    resolveCircleAABB(pos, radius, X_EAST - 0.44, X_EAST + 0.08, 174.5, Z_SOUTH);
    // Closed center double door (only blocks if player explicitly closes it with [E]!)
    if (!mosqueDoorState.mainHallOpen) {
      resolveCircleAABB(pos, radius, X_EAST - 0.36, X_EAST - 0.06, 163.8, 168.2);
    }

    // 2nd Floor Veranda Railings (leave top of Front Staircase z = 161.0..171.0 100% OPEN!)
    resolveCircleAABB(pos, radius, X_VERANDA - 0.28, X_VERANDA + 0.10, Z_NORTH, FRONT_STAIR_Z0);
    resolveCircleAABB(pos, radius, X_VERANDA - 0.28, X_VERANDA + 0.10, FRONT_STAIR_Z1, Z_SOUTH);
    resolveCircleAABB(pos, radius, X_EAST, X_VERANDA, Z_NORTH - 0.1, Z_NORTH + 0.28);
    resolveCircleAABB(pos, radius, X_EAST, X_VERANDA, Z_SOUTH - 0.28, Z_SOUTH + 0.1);

    // Mihrab & Mimbar solid bases
    resolveCircleAABB(pos, radius, X_WEST, X_WEST + 1.15, MZ - 1.7, MZ + 1.7);
    resolveCircleAABB(pos, radius, X_WEST + 0.65, X_WEST + 3.2, MZ - 4.3, MZ - 2.9);

    // 8 Fluted Marble Columns
    for (const [cx, cz] of [
      [MX - 5.2, MZ - 5.2], [MX - 5.2, MZ + 5.2],
      [MX + 4.8, MZ - 5.2], [MX + 4.8, MZ + 5.2],
      [MX - 5.2, MZ - 10.2], [MX - 5.2, MZ + 10.2],
      [MX + 4.8, MZ - 10.2], [MX + 4.8, MZ + 10.2],
    ]) {
      resolveCircleAABB(pos, radius, cx - 0.34, cx + 0.34, cz - 0.34, cz + 0.34);
    }
  } else {
    // --- 3RD FLOOR UPPER PRAYER GALLERY COLLISIONS ---
    resolveCircleAABB(pos, radius, X_WEST, X_EAST, Z_NORTH - 0.1, Z_NORTH + 0.42);
    resolveCircleAABB(pos, radius, X_WEST, X_EAST, Z_SOUTH - 0.42, Z_SOUTH + 0.1);
    resolveCircleAABB(pos, radius, X_EAST - 0.44, X_EAST + 0.12, Z_NORTH, Z_SOUTH);

    // Atrium Safety Balustrades (so player doesn't accidentally fall into the dome atrium)
    if (footY - Y2 < 0.72) {
      resolveCircleAABB(pos, radius, 165.85, 176.15, 160.88, 161.14);
      resolveCircleAABB(pos, radius, 165.85, 176.15, 170.86, 171.14);
      resolveCircleAABB(pos, radius, 165.88, 166.14, 160.88, 171.14);
      resolveCircleAABB(pos, radius, 175.86, 176.14, 160.88, 171.14);
    }
  }
}

export function isInsideModelMosque(pos) {
  if (!pos) return false;
  return pos.x >= X_WEST && pos.x <= X_EAST && pos.z >= Z_NORTH && pos.z <= Z_SOUTH && pos.y - 1.68 < Y_ROOF;
}

export function getModelMosqueZoneName(x, z, footY = 0) {
  if (x < X_WEST - 1.5 || x > FRONT_STAIR_X1 + 2.0 || z < Z_NORTH - 2.0 || z > Z_SOUTH + 2.0) {
    return null;
  }
  if (footY >= Y2 - 0.6) {
    return 'KHULNA MODEL MOSQUE · 3RD FLOOR UPPER PRAYER GALLERY';
  }
  if (footY >= Y1 - 0.6) {
    if (x > X_EAST) return 'KHULNA MODEL MOSQUE · 2ND FLOOR MARBLE VERANDA';
    return 'KHULNA MODEL MOSQUE · 2ND FLOOR MAIN PRAYER HALL';
  }
  if (x >= 160.0 && x <= 174.5 && z >= 154.0 && z <= 163.8) {
    return 'KHULNA MODEL MOSQUE · ISLAMIC LIBRARY & STUDY HALL';
  }
  if (x >= 169.4 && x <= 176.2 && z >= 167.8 && z <= 178.0) {
    return 'KHULNA MODEL MOSQUE · OZU KHANA (ABLUTION HALL)';
  }
  if (x >= X_WEST && x <= X_EAST && z >= Z_NORTH && z <= Z_SOUTH) {
    return 'KHULNA MODEL MOSQUE · GROUND FOYER & CULTURAL CENTER';
  }
  return 'KHULNA DISTRICT MODEL MOSQUE · COURTYARD PLAZA';
}

export function getModelMosquePrompt(pos) {
  if (!pos) return null;
  const footY = pos.y - 1.68;
  if (Math.abs(footY - Y1) < 1.2 && Math.hypot(pos.x - X_EAST, pos.z - MZ) < 3.6) {
    return mosqueDoorState.mainHallOpen
      ? '[E] Close Model Mosque Main Door'
      : '[E] Open Model Mosque Main Door';
  }
  return null;
}

export function toggleModelMosqueDoor(pos) {
  if (!pos) return false;
  const footY = pos.y - 1.68;
  if (Math.abs(footY - Y1) < 1.2 && Math.hypot(pos.x - X_EAST, pos.z - MZ) < 3.8) {
    mosqueDoorState.mainHallOpen = !mosqueDoorState.mainHallOpen;
    return true;
  }
  return false;
}

export function updateModelMosque(dt = 0.016) {
  const target = mosqueDoorState.mainHallOpen ? Math.PI * 0.48 : 0.0;
  if (Math.abs(mosqueDoorState.mainHallAngle - target) > 0.002) {
    mosqueDoorState.mainHallAngle += (target - mosqueDoorState.mainHallAngle) * Math.min(1, dt * 6.0);
    if (mosqueDoorState.leftLeaf) mosqueDoorState.leftLeaf.rotation.y = mosqueDoorState.mainHallAngle;
    if (mosqueDoorState.rightLeaf) mosqueDoorState.rightLeaf.rotation.y = -mosqueDoorState.mainHallAngle;
  }
}

export function findNearestModelMosqueSeat(pos) {
  if (!pos) return null;
  const footY = pos.y - 1.68;
  if (Math.abs(footY - Y0) > 1.0) return null;
  if (pos.x < 161.0 || pos.x > 175.0 || pos.z < 155.0 || pos.z > 177.5) return null;

  const seats = [];
  // Islamic Library reading chairs
  for (const tx of [164.6, 170.2]) {
    for (const cxOff of [-0.72, 0.72]) {
      seats.push(
        { seatX: tx + cxOff, seatZ: 158.56, seatY: 0.46, yaw: 0, fy: Y0, label: 'Library Reading Chair' },
        { seatX: tx + cxOff, seatZ: 160.24, seatY: 0.46, yaw: Math.PI, fy: Y0, label: 'Library Reading Chair' },
      );
    }
  }
  // Ozu Khana sitting stools
  for (let i = 0; i < 5; i++) {
    const tz = 169.6 + i * 1.45;
    seats.push(
      { seatX: 171.25, seatZ: tz, seatY: 0.44, yaw: -Math.PI * 0.5, fy: Y0, label: 'Ozu Khana Bench' },
      { seatX: 173.15, seatZ: tz, seatY: 0.44, yaw: Math.PI * 0.5, fy: Y0, label: 'Ozu Khana Bench' },
    );
  }

  let best = null;
  let bestDist = 1.45;
  for (const s of seats) {
    const d = Math.hypot(pos.x - s.seatX, pos.z - s.seatZ);
    if (d < bestDist) {
      bestDist = d;
      best = { ...s, dist: d };
    }
  }
  return best;
}
