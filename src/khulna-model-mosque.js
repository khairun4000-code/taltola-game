import * as THREE from 'three';
import { box, cylinder, rodBetween } from './scene-utils.js';
import { attachDerivedPBRMaps } from './aaa-shaders.js';

/**
 * KHULNA DISTRICT MODEL MOSQUE & ISLAMIC CULTURAL CENTER
 * (খুলনা জেলা মডেল মসজিদ ও ইসলামিক সাংস্কৃতিক কেন্দ্র · আলিয়া মাদ্রাসা প্রাঙ্গণ, খুলনা)
 *
 * Ultra-Sharp, High-Quality, Fully Enterable & Walkable 3-Level Architectural Recreation:
 *  - Razor-sharp structural edges, true curved pointed Islamic arches (ExtrudeGeometry),
 *    1024x1024 veined white marble, 1024x1024 Islamic geometric jaali screens, turquoise
 *    glazed ceramic frames, 1 grand central dome + 3 front domes, and a 32.5m square minaret.
 *  - Walkable Ground Floor (y = 0.24m): Authentic Ozu Khana (tiled bench, 10 chrome taps,
 *    water channel, mirrors), Teak Shoe Racks, Islamic Library & Reception.
 *  - Walkable 2nd Floor Main Prayer Hall (y = 3.60m): Grand wide white marble front staircase
 *    with central planter -> wide open carved teak portals -> emerald & gold saff prayer carpet,
 *    recessed arched Mihrab, carved 5-step teak Mimbar, Imam mic stand, PA speakers, Quran
 *    Rehal stands, digital Bengali prayer time board, fluted marble columns, multi-tier crystal
 *    & brass chandelier, ceiling fans & warm downlights.
 *  - Walkable 3rd Floor Upper Prayer Gallery (y = 8.40m): Reached via NW marble switchback
 *    staircase, overlooking the Main Prayer Hall & soaring central dome atrium.
 *  - Zero Arabic text (strictly crisp Bengali & English signage only).
 *  - All static geometry merges cleanly via parent mergeStaticMeshes() + 300m distance culling
 *    for locked 60-120 FPS at full native resolution.
 */

export const MODEL_MOSQUE_POS = { x: 171.0, z: 166.0 };

function seeded(seed = 2026) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
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

/* ============================================================================
 * HIGH-RESOLUTION 1024x1024 PROCEDURAL PBR TEXTURES (RAZOR-SHARP ARCHITECTURAL)
 * ========================================================================== */

function makeVeinedMarbleTexture(seedVal = 20261) {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  ctx.fillStyle = '#f7f6f2';
  ctx.fillRect(0, 0, S, S);

  // Subtle architectural stone block grid (4x4 slabs)
  ctx.strokeStyle = 'rgba(150,156,164,0.28)';
  ctx.lineWidth = 2;
  for (let p = 0; p < S; p += 256) {
    ctx.beginPath();
    ctx.moveTo(p, 0); ctx.lineTo(p, S);
    ctx.moveTo(0, p); ctx.lineTo(S, p);
    ctx.stroke();
  }

  // Fine natural Carrara marble veins
  for (let i = 0; i < 48; i++) {
    ctx.strokeStyle = `rgba(148,158,168,${0.06 + rnd() * 0.11})`;
    ctx.lineWidth = 0.8 + rnd() * 2.4;
    ctx.beginPath();
    let x = rnd() * S;
    let y = rnd() * S;
    ctx.moveTo(x, y);
    for (let seg = 0; seg < 6; seg++) {
      x += (rnd() - 0.35) * 140;
      y += (rnd() - 0.5) * 90;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Subtle micro-grain
  for (let i = 0; i < 4200; i++) {
    const v = 220 + Math.floor(rnd() * 35);
    ctx.fillStyle = `rgba(${v},${v},${v - 2},0.16)`;
    ctx.fillRect(rnd() * S, rnd() * S, 2, 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeCrispJaaliTexture(bgHex = '#f6f5f0', deepHex = '#0a4f5c', lineHex = '#14919b') {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, S, S);

  const step = 128;
  for (let y = 0; y < S; y += step) {
    for (let x = 0; x < S; x += step) {
      const cx = x + step * 0.5;
      const cy = y + step * 0.5;

      // Outer stone cell border
      ctx.strokeStyle = '#d6d3cb';
      ctx.lineWidth = 4;
      ctx.strokeRect(x + 2, y + 2, step - 4, step - 4);

      // Deep recessed octagonal Islamic star cutout
      ctx.fillStyle = deepHex;
      ctx.beginPath();
      const rOuter = step * 0.40;
      const rInner = step * 0.24;
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const r = k % 2 === 0 ? rOuter : rInner;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Crisp turquoise inner geometric bevel
      ctx.strokeStyle = lineHex;
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Center marble rosette diamond
      ctx.fillStyle = bgHex;
      ctx.beginPath();
      ctx.moveTo(cx, cy - step * 0.14);
      ctx.lineTo(cx + step * 0.14, cy);
      ctx.lineTo(cx, cy + step * 0.14);
      ctx.lineTo(cx - step * 0.14, cy);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c8c4ba';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeCrispPrayerCarpetTexture() {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(786);

  // Rich royal emerald mosque carpet velvet
  ctx.fillStyle = '#0a5c3c';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,25,15,0.05)';
    ctx.fillRect(rnd() * S, rnd() * S, 3, 2);
  }

  // Horizontal golden Saff (কাতার) alignment borders (2 rows per tile)
  const rowH = S / 2;
  const colW = S / 4;
  for (let r = 0; r < 2; r++) {
    const ry = r * rowH;
    // Crisp golden saff line
    ctx.fillStyle = '#d9b44a';
    ctx.fillRect(0, ry, S, 14);
    ctx.fillRect(0, ry + rowH - 14, S, 14);
    ctx.fillStyle = '#063d28';
    ctx.fillRect(0, ry + 14, S, 8);
    ctx.fillRect(0, ry + rowH - 22, S, 8);

    // Individual prayer mat pointed mihrab arches
    for (let col = 0; col < 4; col++) {
      const cx = col * colW + colW * 0.5;
      const x0 = col * colW + 14;
      const w = colW - 28;
      ctx.strokeStyle = '#e6c563';
      ctx.lineWidth = 4;
      ctx.strokeRect(x0, ry + 28, w, rowH - 56);

      // Pointed arch facing -X / top of tile
      ctx.beginPath();
      ctx.moveTo(x0 + 18, ry + rowH - 36);
      ctx.lineTo(x0 + 18, ry + 145);
      ctx.quadraticCurveTo(x0 + 18, ry + 68, cx, ry + 42);
      ctx.quadraticCurveTo(x0 + w - 18, ry + 68, x0 + w - 18, ry + 145);
      ctx.lineTo(x0 + w - 18, ry + rowH - 36);
      ctx.stroke();

      // Inner decorative gold diamond
      ctx.fillStyle = 'rgba(230,197,99,0.22)';
      ctx.beginPath();
      ctx.moveTo(cx, ry + 180);
      ctx.lineTo(cx + 28, ry + 240);
      ctx.lineTo(cx, ry + 300);
      ctx.lineTo(cx - 28, ry + 240);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeOzuTileTexture() {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e8f4f5';
  ctx.fillRect(0, 0, S, S);
  const step = 64;
  for (let y = 0; y < S; y += step) {
    for (let x = 0; x < S; x += step) {
      ctx.fillStyle = ((x / step + y / step) % 2 === 0) ? '#f3fafb' : '#dfeff2';
      ctx.fillRect(x + 2, y + 2, step - 4, step - 4);
      ctx.strokeStyle = '#9ec5cc';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, step - 2, step - 2);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeMosquePlaqueTexture() {
  const W = 800;
  const H = 200;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0c4a58');
  grad.addColorStop(1, '#072e3a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 7;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.fillStyle = '#fde047';
  ctx.fillRect(18, 18, 10, H - 36);

  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 34px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText('খুলনা জেলা মডেল মসজিদ ও ইসলামিক সাংস্কৃতিক কেন্দ্র', 44, H * 0.38, W - 64);

  ctx.fillStyle = '#fde047';
  ctx.font = '600 22px "Manrope", "Noto Sans Bengali", sans-serif';
  ctx.fillText('KHULNA DISTRICT MODEL MOSQUE · আলিয়া মাদ্রাসা প্রাঙ্গণ, খুলনা', 44, H * 0.72, W - 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makePrayerTimeBoardTexture() {
  const W = 640;
  const H = 480;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#091520';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, W - 16, H - 16);

  ctx.fillStyle = '#0d4f5c';
  ctx.fillRect(16, 16, W - 32, 74);
  ctx.fillStyle = '#fde047';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 30px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText('নামাজের সময়সূচী · খুলনা মডেল মসজিদ', W * 0.5, 53);

  const rows = [
    ['ফজর (FAJR)', '০৫:১৫ AM'],
    ['যোহর (DHUHR)', '০১:১৫ PM'],
    ['আসর (ASR)', '০৪:১৫ PM'],
    ['মাগরিব (MAGHRIB)', '০৫:৩০ PM'],
    ['এশা (ISHA)', '০৭:১৫ PM'],
    ['জুমা (JUMMAH)', '০১:৩০ PM'],
  ];

  rows.forEach(([name, time], idx) => {
    const ry = 126 + idx * 56;
    ctx.fillStyle = idx % 2 === 0 ? 'rgba(20,145,155,0.18)' : 'rgba(255,255,255,0.04)';
    ctx.fillRect(28, ry - 22, W - 56, 46);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px "Noto Sans Bengali", "Segoe UI", sans-serif';
    ctx.fillText(name, 48, ry);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 26px "Manrope", monospace';
    ctx.fillText(time, W - 48, ry);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ============================================================================
 * ARCHITECTURAL GEOMETRY HELPERS (TRUE POINTED ISLAMIC ARCHES & PROPS)
 * ========================================================================== */

function addPointedArchSpandrel(parent, { span, height, depth, archRise, pos, rotY = 0, mat }) {
  const hw = span * 0.5;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, 0);
  shape.lineTo(-hw, height);
  shape.lineTo(hw, height);
  shape.lineTo(hw, 0);

  // Smooth Islamic pointed ogee/lancet arch from +hw up to apex (0, archRise) and down to -hw
  const segs = 12;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const ax = hw * (1 - t);
    const ay = Math.sin(t * Math.PI * 0.5) * archRise * 0.92 + Math.pow(t, 1.5) * archRise * 0.08;
    shape.lineTo(ax, ay);
  }
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const ax = -hw * t;
    const ay = Math.cos(t * Math.PI * 0.5) * archRise * 0.92 + Math.pow(1 - t, 1.5) * archRise * 0.08;
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

function addMosqueLamp(staticG, dynamicG, bank, x, z, h = 4.6, yBase = 0.08) {
  cylinder(staticG, 0.14, 0.22, 0.45, [x, yBase + 0.22, z], bank.steelDark, 8);
  cylinder(staticG, 0.055, 0.085, h, [x, yBase + h * 0.5 + 0.2, z], bank.steelDark, 8);
  box(staticG, [0.95, 0.07, 0.08], [x, yBase + h + 0.12, z], bank.steelDark);
  for (const sx of [-0.42, 0.42]) {
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), bank.bulbGlow);
    globe.position.set(x + sx, yBase + h + 0.28, z);
    dynamicG.add(globe);
  }
}

function addCeilingFan(staticG, bank, x, y, z) {
  cylinder(staticG, 0.055, 0.075, 0.06, [x, y - 0.03, z], bank.whitePlaster, 10);
  cylinder(staticG, 0.022, 0.022, 0.46, [x, y - 0.26, z], bank.steelDark, 8);
  cylinder(staticG, 0.16, 0.17, 0.09, [x, y - 0.51, z], bank.whitePlaster, 14);
  cylinder(staticG, 0.175, 0.175, 0.02, [x, y - 0.51, z], bank.goldMat, 14);
  for (let b = 0; b < 3; b++) {
    const a = (b / 3) * Math.PI * 2;
    const blade = box(staticG, [0.64, 0.016, 0.13], [x + Math.cos(a) * 0.44, y - 0.51, z + Math.sin(a) * 0.44], bank.whitePlaster);
    blade.rotation.y = -a;
  }
}

function addGrandChandelier(staticG, dynamicG, bank, x, yTop, z, dropLen = 2.6, radius = 1.65) {
  cylinder(staticG, 0.035, 0.045, dropLen, [x, yTop - dropLen * 0.5, z], bank.goldMat, 8);
  const yRing1 = yTop - dropLen;
  const yRing2 = yRing1 + 0.55;
  // Two concentric ornate brass & crystal tiers
  for (const [ry, r, count] of [[yRing1, radius, 12], [yRing2, radius * 0.62, 8]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.045, 8, 24), bank.goldMat);
    ring.rotation.x = Math.PI * 0.5;
    ring.position.set(x, ry, z);
    staticG.add(ring);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const bx = x + Math.cos(a) * r;
      const bz = z + Math.sin(a) * r;
      rodBetween(staticG, [x, ry + 0.35, z], [bx, ry, bz], 0.015, bank.goldMat, 5);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), bank.bulbGlow);
      bulb.position.set(bx, ry - 0.14, bz);
      dynamicG.add(bulb);
    }
  }
  const finialOrb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), bank.goldMat);
  finialOrb.position.set(x, yRing1 - 0.32, z);
  staticG.add(finialOrb);
}

function addQuranRehalStand(staticG, bank, x, y, z, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  const leg1 = box(g, [0.36, 0.03, 0.26], [0, 0.16, 0], bank.teakWood);
  leg1.rotation.z = 0.68;
  const leg2 = box(g, [0.36, 0.03, 0.26], [0, 0.16, 0], bank.teakWood);
  leg2.rotation.z = -0.68;
  // Open book pages resting neatly on rehal
  const p1 = box(g, [0.16, 0.022, 0.22], [-0.07, 0.27, 0], bank.chalkLine);
  p1.rotation.z = -0.45;
  const p2 = box(g, [0.16, 0.022, 0.22], [0.07, 0.27, 0], bank.chalkLine);
  p2.rotation.z = 0.45;
  staticG.add(g);
}

/* ============================================================================
 * MAIN BUILDER: RAZOR-SHARP WALKABLE KHULNA DISTRICT MODEL MOSQUE
 * ========================================================================== */

export function buildKhulnaModelMosque3D(staticG, dynamicG, bank) {
  const mx = MODEL_MOSQUE_POS.x; // 171.0
  const mz = MODEL_MOSQUE_POS.z; // 166.0
  const W = 22.0; // X: 160.0 .. 182.0
  const D = 24.0; // Z: 154.0 .. 178.0
  const y0 = 0.24;    // Ground Floor (Ozu Khana + Library + Lobby)
  const y1 = 3.60;    // 2nd Floor (Main Prayer Hall — reached via Grand Front Marble Stairs!)
  const y2 = 8.40;    // 3rd Floor (Upper Prayer Mezzanine Gallery overlooking Central Dome Atrium!)
  const yRoof = 13.60;

  // Dedicated Ultra-Sharp High-Res PBR Materials
  const marbleTex = makeVeinedMarbleTexture(20261);
  const marbleMat = new THREE.MeshPhysicalMaterial({
    map: marbleTex,
    roughness: 0.22,
    metalness: 0.04,
    clearcoat: 0.55,
    clearcoatRoughness: 0.22,
    envMapIntensity: 0.9,
  });
  attachDerivedPBRMaps(marbleMat, marbleTex, { strength: 1.4, roughBase: 0.24, normalScale: 0.45 });

  const jaaliTex = makeCrispJaaliTexture('#f6f5f0', '#0a4f5c', '#14919b');
  const jaaliMat = new THREE.MeshStandardMaterial({
    map: jaaliTex,
    roughness: 0.42,
    metalness: 0.08,
    envMapIntensity: 0.75,
  });
  attachDerivedPBRMaps(jaaliMat, jaaliTex, { strength: 2.4, roughBase: 0.42, normalScale: 0.85 });

  const minaretJaaliTex = makeCrispJaaliTexture('#f4f2ec', '#334155', '#64748b');
  const minaretJaaliMat = new THREE.MeshStandardMaterial({
    map: minaretJaaliTex,
    roughness: 0.48,
    metalness: 0.06,
  });
  attachDerivedPBRMaps(minaretJaaliMat, minaretJaaliTex, { strength: 2.2, roughBase: 0.48, normalScale: 0.78 });

  const carpetTex = makeCrispPrayerCarpetTexture();
  carpetTex.repeat.set(6, 7);
  const carpetMat = new THREE.MeshStandardMaterial({
    map: carpetTex,
    roughness: 0.90,
    metalness: 0.02,
  });

  const ozuTileTex = makeOzuTileTexture();
  ozuTileTex.repeat.set(4, 4);
  const ozuTileMat = new THREE.MeshPhysicalMaterial({
    map: ozuTileTex,
    roughness: 0.18,
    metalness: 0.04,
    clearcoat: 0.78,
  });

  const waterChannelMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    roughness: 0.06,
    metalness: 0.10,
    clearcoat: 0.95,
    transparent: true,
    opacity: 0.78,
  });

  const darkGraniteMat = new THREE.MeshPhysicalMaterial({
    color: 0x334155,
    roughness: 0.24,
    metalness: 0.14,
    clearcoat: 0.65,
  });

  const tealGlazeMat = bank.mosqueTeal;
  const turqGlazeMat = bank.mosqueTurquoise;

  /* --------------------------------------------------------------------------
   * 1. COURTYARD MARBLE PLAZA, CEREMONIAL AVENUE & GRAND FRONT MARBLE STAIRCASE
   * ------------------------------------------------------------------------ */
  box(staticG, [38.0, 0.08, 34.0], [mx + 4.5, 0.04, mz], marbleMat, { castShadow: false, uvScale: 5.5 });
  box(staticG, [9.2, 0.08, 32.0], [191.5, 0.04, 140.0], bank.paverDriveway, { castShadow: false, uvScale: 3.5 });

  // Ground Floor Slab (x = 160..186.5, z = 154..178, top = y0 = 0.24m)
  box(staticG, [W + 4.8, y0, D + 0.6], [mx + 2.2, y0 * 0.5, mz], marbleMat, { uvScale: 4.0 });

  // GRAND WIDE WHITE MARBLE FRONT STAIRCASE (x = 186.5..192.5, z = 160.0..172.0)
  // Climbs cleanly from y = 0.08m up to 2nd Floor Veranda y1 = 3.60m!
  const stairSteps = 16;
  for (let i = 0; i < stairSteps; i++) {
    const t = (i + 0.5) / stairSteps;
    const sx = THREE.MathUtils.lerp(192.5, 186.5, t);
    const sy = THREE.MathUtils.lerp(0.08, y1, (i + 1) / stairSteps);
    box(staticG, [0.40, sy, 12.0], [sx, sy * 0.5, mz], marbleMat);
    // Crisp dark granite non-slip nosing strip on every stair tread
    box(staticG, [0.06, 0.025, 12.0], [sx + 0.17, sy + 0.012, mz], darkGraniteMat);
  }
  // Central Sculpted Marble Planter Island splitting the Grand Staircase
  box(staticG, [2.8, 0.65, 2.8], [189.5, y1 * 0.48, mz], marbleMat);
  box(staticG, [2.4, 0.14, 2.4], [189.5, y1 * 0.48 + 0.36, mz], bank.grassTurf);
  for (const [fx, fz, isGold] of [[-0.6, -0.6, false], [0.6, 0.6, true], [-0.6, 0.6, true], [0.6, -0.6, false]]) {
    box(staticG, [0.55, 0.42, 0.55], [189.5 + fx, y1 * 0.48 + 0.58, mz + fz], bank.moss);
    box(staticG, [0.36, 0.28, 0.36], [189.5 + fx, y1 * 0.48 + 0.84, mz + fz], isGold ? bank.flowerGold : bank.flowerRed);
  }
  // Stepped Marble Staircase Side Wing Walls + Chrome Handrails
  for (const sz of [mz - 6.18, mz + 6.18]) {
    box(staticG, [6.2, y1 + 0.45, 0.38], [189.5, (y1 + 0.45) * 0.5, sz], marbleMat);
    box(staticG, [6.3, 0.12, 0.46], [189.5, y1 + 0.50, sz], tealGlazeMat);
    rodBetween(staticG, [192.5, 1.05, sz], [186.5, y1 + 1.02, sz], 0.04, bank.chromeMat);
  }

  /* --------------------------------------------------------------------------
   * 2. GROUND FLOOR STRUCTURE & AUTHENTIC INTERIOR (OZU KHANA + SHOE RACKS + LIBRARY)
   *    Walkable height: y0 = 0.24m..3.60m
   * ------------------------------------------------------------------------ */
  // 2nd Floor Slab (y1 = 3.60m) with NW Interior Stairwell Cutout (x = 160.5..166.5, z = 154.5..160.5)
  box(staticG, [W + 4.6, 0.28, 17.6], [mx + 2.2, y1 - 0.14, 169.2], marbleMat);
  box(staticG, [19.9, 0.28, 6.4], [176.65, y1 - 0.14, 157.2], marbleMat);

  // East Ground-Floor Colonnade Piers supporting the 2nd Floor Veranda (OPEN entrances at z = 156..160 & z = 172..176!)
  for (const pz of [154.4, 159.8, 172.2, 177.6]) {
    box(staticG, [0.58, y1 - y0, 0.58], [186.2, (y0 + y1) * 0.5, pz], marbleMat);
    box(staticG, [0.68, 0.18, 0.68], [186.2, y0 + 0.09, pz], tealGlazeMat);
    box(staticG, [0.68, 0.18, 0.68], [186.2, y1 - 0.24, pz], tealGlazeMat);
  }
  // True Pointed Islamic Arches over North & South Ground-Floor Entry Portals
  for (const az of [157.1, 174.9]) {
    addPointedArchSpandrel(staticG, {
      span: 4.85,
      height: 1.05,
      depth: 0.44,
      archRise: 0.72,
      pos: [186.2, y1 - 1.25, az],
      rotY: Math.PI * 0.5,
      mat: marbleMat,
    });
  }

  // Ground-Floor Ozu Khana (North-East Interior: x = 167.2..181.2, z = 154.6..162.8)
  box(staticG, [14.0, 0.04, 8.2], [174.2, y0 + 0.02, 158.7], ozuTileMat, { castShadow: false });
  box(staticG, [14.0, 2.2, 0.12], [174.2, y0 + 1.1, 154.52], ozuTileMat); // North tiled wall
  // Raised Tiled Ablution Seating Bench (অজুর বেঞ্চ) + Drainage Channel with Water + 10 Chrome Taps (কল)!
  box(staticG, [11.6, 0.46, 0.62], [174.4, y0 + 0.23, 156.9], ozuTileMat);
  box(staticG, [11.6, 0.10, 0.54], [174.4, y0 + 0.05, 155.85], darkGraniteMat);
  box(staticG, [11.4, 0.04, 0.40], [174.4, y0 + 0.09, 155.85], waterChannelMat, { castShadow: false });
  box(staticG, [11.6, 1.35, 0.24], [174.4, y0 + 0.675, 154.82], ozuTileMat); // Tap splashback ledge
  for (let i = 0; i < 10; i++) {
    const tx = 169.4 + i * 1.12;
    // Chrome faucet pipe + spout + valve handle
    cylinder(staticG, 0.025, 0.025, 0.18, [tx, y0 + 0.86, 155.02], bank.chromeMat, 8);
    box(staticG, [0.04, 0.04, 0.22], [tx, y0 + 0.86, 155.12], bank.chromeMat);
    box(staticG, [0.09, 0.03, 0.03], [tx, y0 + 0.94, 155.04], bank.chromeMat);
    // Wall mirror above every other tap
    if (i % 2 === 0) {
      box(staticG, [0.68, 0.82, 0.04], [tx + 0.56, y0 + 1.72, 154.68], bank.steelDark);
      box(staticG, [0.60, 0.74, 0.05], [tx + 0.56, y0 + 1.72, 154.70], bank.glassCurtain, { castShadow: false });
    }
  }
  // Low tiled partition wall separating Ozu Khana from central lobby
  box(staticG, [12.0, 1.35, 0.18], [174.4, y0 + 0.675, 162.8], ozuTileMat);

  // Multi-Tier Varnished Teak Shoe Racks (জুতার তাক) in Ground Entrance Lobby
  for (const rz of [164.4, 167.6]) {
    box(staticG, [0.42, 1.15, 2.4], [181.2, y0 + 0.575, rz], bank.teakWood);
    for (const sy of [0.28, 0.60, 0.92]) {
      box(staticG, [0.46, 0.04, 2.32], [181.2, y0 + sy, rz], bank.lightWood);
    }
  }

  // Ground-Floor South Wing — Islamic Library & Reception (x = 161.0..180.5, z = 169.0..177.2)
  box(staticG, [18.5, 0.03, 8.0], [170.8, y0 + 0.015, 173.2], bank.mosaicFloor, { castShadow: false, uvScale: 4.0 });
  const bookCols = [bank.emeraldMat, bank.awningBlue, bank.flowerRed, bank.flowerGold, bank.terracotta];
  for (let bi = 0; bi < 4; bi++) {
    const bx = 163.8 + bi * 3.8;
    box(staticG, [2.6, 2.2, 0.48], [bx, y0 + 1.1, 177.35], bank.teakWood);
    for (let shelf = 0; shelf < 4; shelf++) {
      for (let k = 0; k < 8; k++) {
        box(staticG, [0.24, 0.30, 0.24], [bx - 1.05 + k * 0.30, y0 + 0.36 + shelf * 0.48, 177.12], bookCols[(bi + shelf + k) % bookCols.length]);
      }
    }
  }
  // Library Reading Table & Chairs
  box(staticG, [4.2, 0.78, 1.4], [171.0, y0 + 0.39, 173.2], bank.teakWood);
  box(staticG, [4.3, 0.05, 1.48], [171.0, y0 + 0.80, 173.2], bank.lightWood);
  for (const cx of [169.8, 171.0, 172.2]) {
    for (const cz of [172.0, 174.4]) {
      box(staticG, [0.46, 0.44, 0.46], [cx, y0 + 0.22, cz], bank.cushionDark);
    }
  }
  // Ground-Floor Ceiling Fans & Warm LED Tube Lights
  for (const [fx, fz] of [[170.0, 159.0], [177.0, 159.0], [170.0, 173.0], [177.0, 173.0]]) {
    addCeilingFan(staticG, bank, fx, y1 - 0.28, fz);
    box(dynamicG, [1.8, 0.06, 0.14], [fx, y1 - 0.30, fz + 2.2], bank.tubeGlow, { castShadow: false });
  }

  /* --------------------------------------------------------------------------
   * 3. MAIN EXTERIOR SHELL (RAZOR-SHARP MARBLE WALLS, JAALI SCREENS & ARCHES)
   *    Spans Ground -> 2nd Floor Prayer Hall -> 3rd Floor Mezzanine -> Roof
   * ------------------------------------------------------------------------ */
  const totalWallH = yRoof - y0;
  const wallMidY = (y0 + yRoof) * 0.5;

  // West Back Wall (Qibla Wall, solid marble with exterior pilasters & jaali bays)
  box(staticG, [0.48, totalWallH, D], [mx - W * 0.5 + 0.24, wallMidY, mz], marbleMat, { uvScale: 4.0 });
  // North & South Exterior Walls with recessed glazed turquoise-arched windows
  box(staticG, [W, totalWallH, 0.48], [mx, wallMidY, mz - D * 0.5 + 0.24], marbleMat, { uvScale: 4.0 });
  box(staticG, [W, totalWallH, 0.48], [mx, wallMidY, mz + D * 0.5 - 0.24], marbleMat, { uvScale: 4.0 });

  // East Main Prayer Hall Front Wall (x = 181.76) — WIDE OPEN TRIPLE ARCHED ENTRANCE ON 2ND FLOOR!
  // Ground-floor East wall left open at z = 156..160 & z = 172..176 for Ozu Khana / Lobby access
  box(staticG, [0.48, y1 - y0, 11.4], [mx + W * 0.5 - 0.24, (y0 + y1) * 0.5, mz], marbleMat);
  // 2nd Floor Prayer Hall East Wall piers between 3 wide open portals:
  // Open Center Grand Portal: z = 164.0..168.0 (4.0m wide!), Flanking Portals: z = 158.2..160.8 & z = 171.2..173.8
  const eastPiers2F = [
    [154.0, 158.2],
    [160.8, 164.0],
    [168.0, 171.2],
    [173.8, 178.0],
  ];
  for (const [z0, z1] of eastPiers2F) {
    box(staticG, [0.48, y2 - y1, z1 - z0], [mx + W * 0.5 - 0.24, (y1 + y2) * 0.5, (z0 + z1) * 0.5], marbleMat);
  }
  // True Pointed Islamic Arch Spandrels + Carved Swung-Open Teak Double Doors on all 3 2nd-Floor Portals!
  for (const [az, span] of [[159.5, 2.6], [166.0, 4.0], [172.5, 2.6]]) {
    addPointedArchSpandrel(staticG, {
      span,
      height: 1.55,
      depth: 0.48,
      archRise: 1.05,
      pos: [mx + W * 0.5 - 0.24, y2 - 1.55, az],
      rotY: Math.PI * 0.5,
      mat: marbleMat,
    });
    // Turquoise ceramic arch frame trim
    box(staticG, [0.54, 3.25, 0.14], [mx + W * 0.5 - 0.24, y1 + 1.625, az - span * 0.5], tealGlazeMat);
    box(staticG, [0.54, 3.25, 0.14], [mx + W * 0.5 - 0.24, y1 + 1.625, az + span * 0.5], tealGlazeMat);
    // Swung-open ornate carved teak double doors (inside hall, zero blocking!)
    const leafW = Math.min(1.45, span * 0.42);
    box(staticG, [leafW, 3.15, 0.08], [mx + W * 0.5 - 0.5 - leafW * 0.5, y1 + 1.575, az - span * 0.5 + 0.12], bank.teakWood);
    box(staticG, [leafW, 3.15, 0.08], [mx + W * 0.5 - 0.5 - leafW * 0.5, y1 + 1.575, az + span * 0.5 - 0.12], bank.teakWood);
  }
  // 3rd Floor East Wall (above 2nd-floor portals up to roof)
  box(staticG, [0.48, yRoof - y2, D], [mx + W * 0.5 - 0.24, (y2 + yRoof) * 0.5, mz], marbleMat);

  // Crisp Horizontal Architectural Cornice Moldings & Turquoise Accent Bands around all 4 sides
  for (const cy of [y1, y2, yRoof]) {
    box(staticG, [W + 0.9, 0.28, D + 0.9], [mx, cy, mz], marbleMat);
    box(staticG, [W + 1.05, 0.10, D + 1.05], [mx, cy + 0.18, mz], tealGlazeMat);
  }

  // Rooftop Ornate White Marble Parapet Wall + Corner Merlon Finials
  box(staticG, [W + 0.5, 1.15, 0.30], [mx, yRoof + 0.72, mz - D * 0.5], marbleMat);
  box(staticG, [W + 0.5, 1.15, 0.30], [mx, yRoof + 0.72, mz + D * 0.5], marbleMat);
  box(staticG, [0.30, 1.15, D + 0.5], [mx - W * 0.5, yRoof + 0.72, mz], marbleMat);
  box(staticG, [0.30, 1.15, D + 0.5], [mx + W * 0.5, yRoof + 0.72, mz], marbleMat);
  for (const cx of [mx - W * 0.5, mx + W * 0.5]) {
    for (const cz of [mz - D * 0.5, mz + D * 0.5]) {
      box(staticG, [0.85, 1.55, 0.85], [cx, yRoof + 0.92, cz], marbleMat);
      cylinder(staticG, 0.08, 0.22, 0.55, [cx, yRoof + 1.92, cz], bank.goldMat, 10);
    }
  }

  // East 2nd-Floor Veranda Marble Balustrades (flanking the Grand Staircase opening z = 160..172)
  box(staticG, [0.28, 1.05, 6.0], [186.35, y1 + 0.52, 157.0], marbleMat);
  box(staticG, [0.28, 1.05, 6.0], [186.35, y1 + 0.52, 175.0], marbleMat);
  box(staticG, [4.6, 1.05, 0.28], [184.1, y1 + 0.52, 154.15], marbleMat);
  box(staticG, [4.6, 1.05, 0.28], [184.1, y1 + 0.52, 177.85], marbleMat);

  // Exterior Crisp Geometric Jaali Screens & Glowing Turquoise-Framed Arched Windows on East, North & South Facades!
  const fX = mx + W * 0.5 + 0.06;
  // East Facade Flanking Full-Height Jaali Panels
  for (const dz of [-9.6, 9.6]) {
    box(staticG, [0.18, yRoof - y1 - 0.4, 2.8], [fX, (y1 + yRoof) * 0.5, mz + dz], jaaliMat, { uvScale: 2.2 });
    box(staticG, [0.24, yRoof - y1, 0.22], [fX + 0.03, (y1 + yRoof) * 0.5, mz + dz - 1.48], marbleMat);
    box(staticG, [0.24, yRoof - y1, 0.22], [fX + 0.03, (y1 + yRoof) * 0.5, mz + dz + 1.48], marbleMat);
  }
  // 3rd-Floor East Facade Arched Turquoise Windows + Jaali Screen Band
  box(staticG, [0.14, yRoof - y2 - 0.5, 16.0], [fX - 0.02, (y2 + yRoof) * 0.5, mz], jaaliMat, { uvScale: 3.0 });
  for (const [wz, ww] of [[-5.2, 2.4], [0, 3.8], [5.2, 2.4]]) {
    box(staticG, [0.22, 3.1, ww], [fX + 0.06, y2 + 2.4, mz + wz], turqGlazeMat);
    box(dynamicG, [0.10, 2.65, ww - 0.42], [fX + 0.14, y2 + 2.4, mz + wz], bank.mosqueGlow, { castShadow: false });
    addPointedArchSpandrel(staticG, {
      span: ww,
      height: 0.95,
      depth: 0.26,
      archRise: 0.65,
      pos: [fX + 0.08, y2 + 3.05, mz + wz],
      rotY: Math.PI * 0.5,
      mat: marbleMat,
    });
  }

  // North & South Exterior Tall Arched Mosque Windows + Structural Pilasters
  for (const sideSign of [-1, 1]) {
    const wz = mz + sideSign * (D * 0.5 + 0.05);
    for (let bx = -7.5; bx <= 7.6; bx += 3.75) {
      // Full-height crisp marble pilaster rib
      box(staticG, [0.46, totalWallH, 0.36], [mx + bx - 1.875, wallMidY, wz], marbleMat);
      for (const fy of [y1, y2]) {
        const wy = fy + 2.25;
        box(staticG, [2.35, 3.05, 0.22], [mx + bx, wy, wz], turqGlazeMat);
        box(dynamicG, [1.95, 2.65, 0.10], [mx + bx, wy, wz + sideSign * 0.08], bank.mosqueGlow, { castShadow: false });
        addPointedArchSpandrel(staticG, {
          span: 2.35,
          height: 0.85,
          depth: 0.24,
          archRise: 0.58,
          pos: [mx + bx, wy + 0.72, wz],
          rotY: 0,
          mat: marbleMat,
        });
      }
    }
  }

  /* --------------------------------------------------------------------------
   * 4. 2ND FLOOR GRAND MAIN PRAYER HALL INTERIOR (y1 = 3.60m, FULLY ENTERABLE!)
   *    - High-Res Emerald & Gold Saff Carpet
   *    - Recessed Arched Qibla Mihrab (West Wall)
   *    - Carved 5-Step Teakwood Mimbar + Velvet Cushion + Canopy
   *    - Imam Mic Stand, PA Speakers, Quran Rehals, Digital Prayer Time Board
   *    - 8 Fluted Marble Columns, Multi-Tier Chandeliers & Ceiling Fans
   * ------------------------------------------------------------------------ */
  // Crisp Emerald-Green & Gold Saff Prayer Carpet covering the entire Main Prayer Hall
  box(staticG, [W - 1.0, 0.04, D - 1.0], [mx, y1 + 0.02, mz], carpetMat, { castShadow: false });

  // 8 Fluted White Marble Structural Columns with Octagonal Bases & Gold Rings
  const colPositions = [
    [mx - 5.2, mz - 6.2], [mx - 5.2, mz + 6.2],
    [mx + 0.2, mz - 6.2], [mx + 0.2, mz + 6.2],
    [mx + 5.6, mz - 6.2], [mx + 5.6, mz + 6.2],
    [mx + 5.6, mz - 2.4], [mx + 5.6, mz + 2.4],
  ];
  for (const [cx, cz] of colPositions) {
    cylinder(staticG, 0.44, 0.48, 0.36, [cx, y1 + 0.18, cz], marbleMat, 8);
    cylinder(staticG, 0.32, 0.35, y2 - y1 - 0.5, [cx, (y1 + y2) * 0.5, cz], marbleMat, 16);
    cylinder(staticG, 0.39, 0.39, 0.14, [cx, y1 + 0.40, cz], bank.goldMat, 16);
    cylinder(staticG, 0.42, 0.36, 0.32, [cx, y2 - 0.26, cz], bank.goldMat, 16);
    // Wall-mounted white PA sound speaker box on inner columns
    box(staticG, [0.22, 0.42, 0.26], [cx + 0.36, y1 + 3.25, cz], bank.acMat);
  }

  // GRAND RECESSED QIBLA MIHRAB (West Wall: x = 160.35, z = 166.0)
  const mihX = mx - W * 0.5 + 0.55;
  box(staticG, [0.85, 4.4, 4.2], [mihX, y1 + 2.2, mz], tealGlazeMat);
  box(staticG, [0.60, 3.85, 3.2], [mihX + 0.22, y1 + 1.92, mz], jaaliMat, { uvScale: 1.8 });
  // True Curved Pointed Arch crowning the Mihrab Niche
  addPointedArchSpandrel(staticG, {
    span: 3.4,
    height: 1.45,
    depth: 0.42,
    archRise: 1.05,
    pos: [mihX + 0.44, y1 + 2.95, mz],
    rotY: Math.PI * 0.5,
    mat: marbleMat,
  });
  // Twin Fluted Mihrab Marble Pilasters & Golden Frame Moldings
  for (const dz of [-1.85, 1.85]) {
    cylinder(staticG, 0.18, 0.20, 4.2, [mihX + 0.48, y1 + 2.1, mz + dz], marbleMat, 12);
    cylinder(staticG, 0.24, 0.24, 0.14, [mihX + 0.48, y1 + 0.18, mz + dz], bank.goldMat, 12);
    cylinder(staticG, 0.24, 0.24, 0.14, [mihX + 0.48, y1 + 4.15, mz + dz], bank.goldMat, 12);
  }
  box(staticG, [0.22, 0.22, 4.4], [mihX + 0.46, y1 + 4.42, mz], bank.goldMat);
  // Warm Mihrab Uplight Glow Strip
  box(dynamicG, [0.10, 0.12, 2.8], [mihX + 0.45, y1 + 0.14, mz], bank.bulbGlow, { castShadow: false });

  // Imam's Dedicated Prayer Mat + Goose-Neck Microphone Stand in front of Mihrab
  box(staticG, [1.35, 0.045, 0.88], [mihX + 1.45, y1 + 0.04, mz], bank.rugRed);
  cylinder(staticG, 0.12, 0.14, 0.04, [mihX + 0.85, y1 + 0.04, mz + 0.65], bank.steelDark, 10);
  cylinder(staticG, 0.014, 0.016, 1.38, [mihX + 0.85, y1 + 0.72, mz + 0.65], bank.chromeMat, 6);
  rodBetween(staticG, [mihX + 0.85, y1 + 1.40, mz + 0.65], [mihX + 1.15, y1 + 1.46, mz + 0.35], 0.012, bank.steelDark, 6);

  // ORNATE CARVED 5-STEP TEAKWOOD MIMBAR (মিম্বর — right beside the Mihrab at z = 162.0!)
  const mimX = mihX + 0.75;
  const mimZ = mz - 3.9;
  for (let s = 0; s < 5; s++) {
    const sx = mimX + 2.2 - s * 0.45;
    const sh = 0.26 * (s + 1);
    box(staticG, [0.46, sh, 1.35], [sx, y1 + sh * 0.5, mimZ], bank.teakWood);
    box(staticG, [0.46, 0.03, 1.35], [sx, y1 + sh + 0.015, mimZ], bank.lightWood);
  }
  // Preacher's Elevated Seat Platform + Emerald Cushion + Carved Canopy Crown
  box(staticG, [1.25, 1.35, 1.45], [mimX - 0.15, y1 + 0.675, mimZ], bank.teakWood);
  box(staticG, [0.95, 0.12, 1.15], [mimX - 0.15, y1 + 1.40, mimZ], bank.emeraldMat);
  for (const [px, pz] of [[-0.65, -0.62], [0.35, -0.62], [-0.65, 0.62], [0.35, 0.62]]) {
    cylinder(staticG, 0.045, 0.05, 2.25, [mimX + px, y1 + 2.45, mimZ + pz], bank.teakWood, 8);
  }
  box(staticG, [1.35, 0.24, 1.52], [mimX - 0.15, y1 + 3.60, mimZ], bank.teakWood);
  const mimDome = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), bank.goldMat);
  mimDome.position.set(mimX - 0.15, y1 + 3.72, mimZ);
  staticG.add(mimDome);
  // Mimbar Side Railings
  rodBetween(staticG, [mimX + 2.35, y1 + 0.95, mimZ - 0.65], [mimX + 0.35, y1 + 2.15, mimZ - 0.65], 0.035, bank.lightWood, 6);
  rodBetween(staticG, [mimX + 2.35, y1 + 0.95, mimZ + 0.65], [mimX + 0.35, y1 + 2.15, mimZ + 0.65], 0.035, bank.lightWood, 6);

  // Quran Rehal Stands & Book Racks along Qibla Wall & Columns
  for (const rz of [mz - 8.2, mz - 6.8, mz + 4.4, mz + 6.4, mz + 8.4]) {
    addQuranRehalStand(staticG, bank, mihX + 1.15, y1 + 0.04, rz, Math.PI * 0.5);
  }
  for (const rz of [mz - 9.2, mz + 9.2]) {
    box(staticG, [0.44, 1.25, 2.2], [mihX + 0.30, y1 + 0.625, rz], bank.teakWood);
    for (let k = 0; k < 6; k++) {
      box(staticG, [0.22, 0.28, 0.24], [mihX + 0.45, y1 + 0.88, rz - 0.8 + k * 0.32], k % 2 === 0 ? bank.emeraldMat : bank.goldMat);
    }
  }

  // Digital Bengali Prayer Time Display Board on West Qibla Wall (South of Mihrab, ZERO Arabic!)
  const ptTex = makePrayerTimeBoardTexture();
  const ptMat = new THREE.MeshStandardMaterial({
    map: ptTex,
    emissive: 0xffffff,
    emissiveMap: ptTex,
    emissiveIntensity: 0.45,
    roughness: 0.22,
  });
  bank.emissiveList.push({ mat: ptMat, day: 0.45, night: 1.35 });
  const ptBoard = new THREE.Mesh(new THREE.BoxGeometry(0.10, 1.55, 2.15), ptMat);
  ptBoard.position.set(mihX + 0.12, y1 + 2.35, mz + 4.6);
  dynamicG.add(ptBoard);

  // Grand Multi-Tiered Crystal & Brass Chandelier under Central Dome + Side Chandeliers & Ceiling Fans
  addGrandChandelier(staticG, dynamicG, bank, mx - 0.5, yRoof + 1.6, mz, 6.2, 2.15);
  for (const [cx, cz] of [[mx - 6.0, mz - 8.2], [mx - 6.0, mz + 8.2], [mx + 6.2, mz - 8.2], [mx + 6.2, mz + 8.2]]) {
    addCeilingFan(staticG, bank, cx, y2 - 0.26, cz);
    const downlight = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 10), bank.bulbGlow);
    downlight.position.set(cx, y2 - 0.28, cz + (cz < mz ? 2.4 : -2.4));
    dynamicG.add(downlight);
  }

  /* --------------------------------------------------------------------------
   * 5. 3RD FLOOR WALKABLE UPPER PRAYER GALLERY (y2 = 8.40m) + CENTRAL ATRIUM
   *    & NW INTERIOR MARBLE SWITCHBACK STAIRCASE (y0 -> y1 -> y2)
   * ------------------------------------------------------------------------ */
  // 3rd-Floor Slab around Central Open Dome Atrium (Atrium cutout: x = 165.8..175.8, z = 161.0..171.0)
  // Plus NW Stairwell cutout (x = 160.5..166.5, z = 154.5..160.5)
  box(staticG, [W - 0.6, 0.28, 7.0], [mx, y2 - 0.14, 174.5], marbleMat); // South gallery wing
  box(staticG, [15.2, 0.28, 6.8], [174.1, y2 - 0.14, 157.6], marbleMat); // North gallery wing
  box(staticG, [5.6, 0.28, 10.4], [163.0, y2 - 0.14, 166.0], marbleMat); // West gallery wing
  box(staticG, [6.0, 0.28, 10.4], [178.8, y2 - 0.14, 166.0], marbleMat); // East gallery wing
  // Prayer carpets on 3rd-Floor Gallery wings
  box(staticG, [W - 1.2, 0.03, 6.4], [mx, y2 + 0.015, 174.5], carpetMat, { castShadow: false });
  box(staticG, [14.6, 0.03, 6.2], [174.1, y2 + 0.015, 157.6], carpetMat, { castShadow: false });
  box(staticG, [5.2, 0.03, 10.0], [178.8, y2 + 0.015, 166.0], carpetMat, { castShadow: false });

  // Carved Marble & Gold Atrium Balustrades overlooking the Main Prayer Hall
  box(staticG, [10.4, 1.02, 0.24], [170.8, y2 + 0.51, 161.0], marbleMat);
  box(staticG, [10.4, 1.02, 0.24], [170.8, y2 + 0.51, 171.0], marbleMat);
  box(staticG, [0.24, 1.02, 10.0], [165.8, y2 + 0.51, 166.0], marbleMat);
  box(staticG, [0.24, 1.02, 10.0], [175.8, y2 + 0.51, 166.0], marbleMat);
  box(staticG, [10.5, 0.08, 0.28], [170.8, y2 + 1.04, 161.0], bank.goldMat);
  box(staticG, [10.5, 0.08, 0.28], [170.8, y2 + 1.04, 171.0], bank.goldMat);
  box(staticG, [0.28, 0.08, 10.2], [165.8, y2 + 1.04, 166.0], bank.goldMat);
  box(staticG, [0.28, 0.08, 10.2], [175.8, y2 + 1.04, 166.0], bank.goldMat);

  // NW INTERIOR MARBLE SWITCHBACK STAIRCASE (x = 160.6..166.4, z = 154.6..160.4)
  // Connects Ground Floor (0.24m) <-> 2nd Floor Prayer Hall (3.60m) <-> 3rd Floor Gallery (8.40m)!
  const buildInteriorFlight = (yBot, yTop) => {
    const yMid = (yBot + yTop) * 0.5;
    const steps = 10;
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const sx = THREE.MathUtils.lerp(166.2, 162.4, t);
      const sy = THREE.MathUtils.lerp(yBot, yMid, (i + 1) / steps);
      box(staticG, [0.42, 0.22, 2.4], [sx, sy - 0.11, 159.1], marbleMat);
      box(staticG, [0.05, 0.02, 2.4], [sx + 0.18, sy + 0.01, 159.1], darkGraniteMat);
    }
    box(staticG, [1.8, 0.24, 5.4], [161.4, yMid - 0.12, 157.5], marbleMat);
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const sx = THREE.MathUtils.lerp(162.4, 166.2, t);
      const sy = THREE.MathUtils.lerp(yMid, yTop, (i + 1) / steps);
      box(staticG, [0.42, 0.22, 2.4], [sx, sy - 0.11, 155.9], marbleMat);
      box(staticG, [0.05, 0.02, 2.4], [sx - 0.18, sy + 0.01, 155.9], darkGraniteMat);
    }
    rodBetween(staticG, [166.2, yBot + 0.92, 157.8], [162.4, yMid + 0.92, 157.8], 0.035, bank.chromeMat);
    rodBetween(staticG, [162.4, yMid + 0.92, 157.2], [166.2, yTop + 0.92, 157.2], 0.035, bank.chromeMat);
  };
  buildInteriorFlight(y0, y1);
  buildInteriorFlight(y1, y2);

  // Roof Slab with Circular Cutout Framing around Central Dome
  box(staticG, [W + 0.8, 0.42, 7.2], [mx, yRoof + 0.21, 174.6], marbleMat);
  box(staticG, [W + 0.8, 0.42, 7.2], [mx, yRoof + 0.21, 157.4], marbleMat);
  box(staticG, [6.2, 0.42, 10.6], [163.1, yRoof + 0.21, 166.0], marbleMat);
  box(staticG, [6.6, 0.42, 10.6], [178.9, yRoof + 0.21, 166.0], marbleMat);

  /* --------------------------------------------------------------------------
   * 6. 1 GRAND CENTRAL DOME + 3 FRONT DOMES + 32.5m TALL SQUARE JAALI MINARET
   * ------------------------------------------------------------------------ */
  const addArchitecturalDome = (dx, dz, radius, drumH, withClerestory = false) => {
    const baseY = yRoof + 0.42;
    // Octagonal plinth + cylindrical drum + turquoise & gold accent bands
    cylinder(staticG, radius * 1.08, radius * 1.12, 0.55, [dx, baseY + 0.275, dz], marbleMat, 16);
    cylinder(staticG, radius * 1.02, radius * 1.04, drumH, [dx, baseY + 0.55 + drumH * 0.5, dz], marbleMat, 28);
    cylinder(staticG, radius * 1.06, radius * 1.06, 0.18, [dx, baseY + 0.55 + drumH, dz], turqGlazeMat, 28);
    cylinder(staticG, radius * 1.07, radius * 1.07, 0.08, [dx, baseY + 0.55 + drumH + 0.14, dz], bank.goldMat, 28);

    // Clerestory glowing windows around the grand central dome drum
    if (withClerestory) {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const wx = dx + Math.cos(a) * (radius * 1.03);
        const wz = dz + Math.sin(a) * (radius * 1.03);
        const w = box(dynamicG, [0.14, drumH * 0.62, 0.72], [wx, baseY + 0.55 + drumH * 0.5, wz], bank.mosqueGlow, { castShadow: false });
        w.rotation.y = -a;
      }
    }

    // Crisp White Marble Dome Shell (DoubleSide so visible looking UP from inside the Prayer Hall!)
    const domeMat = new THREE.MeshPhysicalMaterial({
      color: 0xfbfaf6,
      roughness: 0.18,
      metalness: 0.05,
      clearcoat: 0.82,
      side: THREE.DoubleSide,
    });
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.52),
      domeMat
    );
    dome.position.set(dx, baseY + 0.55 + drumH, dz);
    dome.castShadow = true;
    dome.receiveShadow = true;
    staticG.add(dome);

    // Golden Brass Finial Spire with Triple Orbs & Crescent
    const topY = baseY + 0.55 + drumH + radius;
    cylinder(staticG, 0.05, 0.10, 2.2, [dx, topY + 1.05, dz], bank.goldMat, 10);
    for (const [oy, or] of [[0.35, 0.28], [0.95, 0.20], [1.45, 0.13]]) {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(or, 12, 10), bank.goldMat);
      orb.position.set(dx, topY + oy, dz);
      staticG.add(orb);
    }
    const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.055, 8, 16, Math.PI * 1.45), bank.goldMat);
    crescent.position.set(dx, topY + 2.15, dz);
    crescent.rotation.z = Math.PI * 0.78;
    staticG.add(crescent);
  };

  // 1 Grand Central Dome + 3 Front Smaller Domes (matching Khulna District Model Mosque!)
  addArchitecturalDome(mx - 0.5, mz, 5.5, 1.85, true);
  addArchitecturalDome(mx + 7.2, mz - 7.6, 2.35, 0.95, false);
  addArchitecturalDome(mx + 7.2, mz, 2.55, 1.05, false);
  addArchitecturalDome(mx + 7.2, mz + 7.6, 2.35, 0.95, false);

  // TALL 32.5m SQUARE ISLAMIC JAALI MINARET (North-East Front-Right Corner!)
  const minX = mx + W * 0.5 + 2.2; // 184.2
  const minZ = mz - D * 0.5 + 1.4; // 155.4
  const minH = 31.0;
  // Minaret Base Plinth + Recessed Jaali Shaft + Crisp Corner Pilasters
  box(staticG, [4.2, 1.2, 4.2], [minX, 0.6, minZ], marbleMat);
  box(staticG, [3.6, minH, 3.6], [minX, minH * 0.5, minZ], minaretJaaliMat, { uvScale: 2.8 });
  for (const sx of [-1.68, 1.68]) {
    for (const sz of [-1.68, 1.68]) {
      box(staticG, [0.42, minH + 0.6, 0.42], [minX + sx, minH * 0.5, minZ + sz], marbleMat);
    }
  }
  // 3 Projecting Cantilevered Minaret Balconies with Turquoise Trim & Glowing Lantern Band
  for (const by of [11.5, 20.5, 27.6]) {
    box(staticG, [4.5, 0.45, 4.5], [minX, by, minZ], marbleMat);
    box(staticG, [4.65, 0.14, 4.65], [minX, by + 0.28, minZ], turqGlazeMat);
    box(staticG, [4.35, 0.78, 0.18], [minX, by + 0.65, minZ - 2.1], marbleMat);
    box(staticG, [4.35, 0.78, 0.18], [minX, by + 0.65, minZ + 2.1], marbleMat);
    box(staticG, [0.18, 0.78, 4.35], [minX - 2.1, by + 0.65, minZ], marbleMat);
    box(staticG, [0.18, 0.78, 4.35], [minX + 2.1, by + 0.65, minZ], marbleMat);
  }
  // Top Minaret Crown, Glowing Sound Gallery, Marble Dome & Golden Spire
  box(dynamicG, [3.2, 1.8, 3.2], [minX, minH - 1.2, minZ], bank.mosqueGlow, { castShadow: false });
  box(staticG, [4.2, 0.75, 4.2], [minX, minH + 0.35, minZ], marbleMat);
  const minDome = new THREE.Mesh(
    new THREE.SphereGeometry(1.75, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.54),
    bank.marbleDome
  );
  minDome.position.set(minX, minH + 0.70, minZ);
  staticG.add(minDome);
  cylinder(staticG, 0.05, 0.09, 2.2, [minX, minH + 3.45, minZ], bank.goldMat, 8);

  /* --------------------------------------------------------------------------
   * 7. MONUMENT SIGNBOARD (CLEAN BENGALI & ENGLISH ONLY) & COURTYARD LAMPS
   * ------------------------------------------------------------------------ */
  const sx = 193.6;
  const sz = 157.5;
  box(staticG, [0.90, 1.35, 5.8], [sx, 0.675, sz], marbleMat);
  box(staticG, [1.05, 0.16, 6.0], [sx, 1.40, sz], tealGlazeMat);
  const signTex = makeMosquePlaqueTexture();
  const signMat = new THREE.MeshStandardMaterial({
    map: signTex,
    emissive: 0xffffff,
    emissiveMap: signTex,
    emissiveIntensity: 0.34,
    roughness: 0.28,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });
  bank.emissiveList.push({ mat: signMat, day: 0.32, night: 1.55 });
  const signGrp = new THREE.Group();
  signGrp.position.set(sx, 2.25, sz);
  signGrp.rotation.y = Math.PI * 0.5;
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(5.55, 1.42, 0.12), bank.steelDark);
  const face = new THREE.Mesh(new THREE.BoxGeometry(5.40, 1.30, 0.15), signMat);
  signGrp.add(bezel, face);
  dynamicG.add(signGrp);

  for (const [lx, lz] of [
    [193.6, 152.2], [193.6, 179.8],
    [183.5, 149.8], [183.5, 182.2],
    [164.0, 149.8], [164.0, 182.2],
  ]) {
    addMosqueLamp(staticG, dynamicG, bank, lx, lz, 4.6, 0.08);
  }
}

/* ============================================================================
 * WALKABLE MULTI-FLOOR GROUND HEIGHT & SOLID COLLISIONS
 * ========================================================================== */

export function getModelMosqueGroundHeight(pos, grounded = true, verticalVelocity = 0) {
  const mx = MODEL_MOSQUE_POS.x;
  const mz = MODEL_MOSQUE_POS.z;
  if (pos.x < 156.0 || pos.x > 195.0 || pos.z < 149.0 || pos.z > 183.0) return 0.0;

  const footY = pos.y - 1.68;
  const maxStepUp = grounded ? 0.55 : (verticalVelocity > 0 ? 0.08 : 0.38);

  // 1) Grand East Front Marble Staircase (x = 186.5..192.5, z = 160.0..172.0)
  if (pos.x >= 186.4 && pos.x <= 192.6 && pos.z >= 159.9 && pos.z <= 172.1) {
    const t = THREE.MathUtils.clamp((192.5 - pos.x) / 6.0, 0, 1);
    const sy = 0.08 + t * (3.60 - 0.08);
    if (sy <= footY + maxStepUp + 0.35) return sy;
  }

  // 2) Inside Main Mosque & East Veranda (x = 160.0..186.6, z = 154.0..178.0)
  if (pos.x >= 160.0 && pos.x <= 186.6 && pos.z >= 154.0 && pos.z <= 178.0) {
    let bestY = 0.24; // Ground Floor (Ozu Khana + Library + Lobby)

    // NW Interior Marble Switchback Staircase (x = 160.5..166.4, z = 154.5..160.5)
    const inInnerStairs = pos.x >= 160.5 && pos.x <= 166.4 && pos.z >= 154.5 && pos.z <= 160.5;
    if (inInnerStairs) {
      for (const [yBot, yTop] of [[0.24, 3.60], [3.60, 8.40]]) {
        const yMid = (yBot + yTop) * 0.5;
        if (pos.x <= 162.4) {
          if (yMid <= footY + maxStepUp) bestY = Math.max(bestY, yMid);
        } else if (pos.z >= 157.5) {
          const t = THREE.MathUtils.clamp((166.2 - pos.x) / 3.8, 0, 1);
          const sy = yBot + t * (yMid - yBot);
          if (sy <= footY + maxStepUp) bestY = Math.max(bestY, sy);
        } else {
          const t = THREE.MathUtils.clamp((pos.x - 162.4) / 3.8, 0, 1);
          const sy = yMid + t * (yTop - yMid);
          if (sy <= footY + maxStepUp) bestY = Math.max(bestY, sy);
        }
      }
      return bestY;
    }

    // 2nd Floor Main Prayer Hall & Veranda (y1 = 3.60m)
    if (3.60 <= footY + maxStepUp) bestY = Math.max(bestY, 3.60);

    // 3rd Floor Upper Prayer Mezzanine Gallery (y2 = 8.40m — open over central dome atrium!)
    const inAtrium = pos.x > 166.0 && pos.x < 175.6 && pos.z > 161.2 && pos.z < 170.8;
    if (!inAtrium && pos.x <= 182.0 && 8.40 <= footY + maxStepUp) {
      bestY = Math.max(bestY, 8.40);
    }

    return bestY;
  }

  // 3) Marble Courtyard Plaza
  return 0.08;
}

export function applyModelMosqueCollisions(pos, radius = 0.34, footY = 0) {
  if (pos.x < 156.0 || pos.x > 196.0 || pos.z < 149.0 || pos.z > 183.0) return;

  // Monument Signboard Pedestal at East Plaza Entrance
  if (footY < 3.2) {
    resolveCircleAABB(pos, radius, 193.0, 194.2, 154.5, 160.5);
  }
  // North-East Tall Minaret Tower (solid base & shaft)
  if (footY < 31.5) {
    resolveCircleAABB(pos, radius, 182.1, 186.3, 153.3, 157.5);
  }
  // Central Planter Island on Grand Front Staircase
  if (footY < 3.2) {
    resolveCircleAABB(pos, radius, 188.0, 191.0, 164.5, 167.5);
  }

  // Outer Perimeter Walls (West Qibla, North & South) across all floors
  if (footY < 14.0) {
    resolveCircleAABB(pos, radius, 159.9, 160.6, 154.0, 178.0); // West Qibla wall
    resolveCircleAABB(pos, radius, 160.0, 182.0, 153.9, 154.6); // North exterior wall
    resolveCircleAABB(pos, radius, 160.0, 182.0, 177.4, 178.1); // South exterior wall
  }

  // Ground Floor East Wall (solid center behind stairs, OPEN at z = 156..160 & z = 172..176!)
  if (footY < 3.1) {
    resolveCircleAABB(pos, radius, 181.5, 182.1, 160.2, 171.8);
    // Staircase side wing walls
    resolveCircleAABB(pos, radius, 186.4, 192.6, 159.6, 160.1);
    resolveCircleAABB(pos, radius, 186.4, 192.6, 171.9, 172.4);
  }

  // 2nd Floor Main Prayer Hall East Wall Piers (3 WIDE OPEN doorways at z = 158.2..160.8, 164.0..168.0, 171.2..173.8!)
  if (footY >= 3.1 && footY < 8.0) {
    for (const [z0, z1] of [[154.0, 158.2], [160.8, 164.0], [168.0, 171.2], [173.8, 178.0]]) {
      resolveCircleAABB(pos, radius, 181.5, 182.1, z0, z1);
    }
    // 2nd Floor East Veranda Balustrades (flanking the staircase opening)
    resolveCircleAABB(pos, radius, 186.2, 186.6, 154.0, 160.0);
    resolveCircleAABB(pos, radius, 186.2, 186.6, 172.0, 178.0);
    resolveCircleAABB(pos, radius, 182.0, 186.6, 153.9, 154.3);
    resolveCircleAABB(pos, radius, 182.0, 186.6, 177.7, 178.1);
  }

  // 3rd Floor Upper Gallery Atrium Balustrades (prevents falling into central atrium)
  if (footY >= 8.0 && footY < 13.5) {
    resolveCircleAABB(pos, radius, 181.5, 182.1, 154.0, 178.0); // East 3rd-floor wall
    resolveCircleAABB(pos, radius, 165.6, 176.0, 160.85, 161.2);
    resolveCircleAABB(pos, radius, 165.6, 176.0, 170.8, 171.15);
    resolveCircleAABB(pos, radius, 165.6, 166.0, 161.0, 171.0);
    resolveCircleAABB(pos, radius, 175.6, 176.0, 161.0, 171.0);
  }
}
