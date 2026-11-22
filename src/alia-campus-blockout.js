import * as THREE from 'three';
import { box, cylinder, rodBetween } from './scene-utils.js';
import { attachDerivedPBRMaps } from './aaa-shaders.js';

/**
 * KHULNA ALIA KAMIL MADRASAH — 1:1 REAL-LIFE LAYOUT (USER SATELLITE SCREENSHOT + REAL CAMPUS VIDEO 4Pxw4clRnRM)
 *
 * Verified Frame-by-Frame from YouTube (4Pxw4clRnRM) & User's Annotated Satellite Screenshot:
 *  1) Real Main Gate on Khan Jahan Ali Road (gx = 184.0, gz = 207.5, angled -30.25° flush with N7):
 *     - White double metal gate leaves (interactive [E]) + authentic white overhead Arabic/Bengali/English signboard
 *  2) High-Graphics Concrete Campus Road (matching video 00:18-00:39 & 02:44-03:00):
 *     - Weathered light-grey/warm concrete slab road with side concrete drain & iconic red-green pipe railings
 *       leading straight from Main Gate -> past Etimkhana (Left) & Old Green Pond (Right)
 *       -> past Model Mosque (Left) & Covered Tin-Shed Pukur Ghat + Clean Pond (Right)
 *       -> along West edge of Big Playground -> straight into Main Alia Madrasah Portico!
 *  3) Twin Ponds on Right Side of Main Road:
 *     - NORTH CLEAN BATHING POND (পরিষ্কার পুকুর) with authentic GREEN-AND-RED COVERED TIN-SHED PUKUR GHAT
 *       (video 01:52-02:16: gabled tin roof, red-green pillars, red seating walls, wide stepped concrete ghat)
 *       + full 4-sided brick Pukurpar & shade trees!
 *     - SOUTH OLD GREEN ALGAE POND (পুরনো সবুজ শ্যাওলা/কচুরিপানা পুকুর) with lush green duckweed/algae mat & dense trees!
 *  4) Clean Labeled DEMO Blockouts for all real campus buildings (ready for user OK before full high-graphics):
 *     - Etimkhana (ochre-yellow, immediately left of Main Gate along Khan Jahan Ali Rd — video 00:00-00:30)
 *     - Teachers' Quarters (long vertical N-S block east of both ponds)
 *     - Student Hostel (SE of Big Playground with signature rooftop tower — video 03:14-03:19)
 *     - East Academic Campus (4-story building east of Big Playground — video 03:13)
 *     - NE Academic Campus (top-right terracotta-roofed building at head of Big Playground)
 *     - Library (মাদ্রাসার লাইব্রেরী — video 02:18) & Science Lab (বিজ্ঞানাগার ভবন — video 02:25-02:42)
 *     - Primary School (খুলনা আলিয়া প্রাইমারি স্কুল — video 03:23-03:34) & Girls' Wing (মহিলা শাখা — video 03:38-03:50)
 */

const KJA_ANGLE = -0.528; // Exact angle of Khan Jahan Ali Road (-30.25° in XZ)

function seeded(seed = 195299) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * High-graphics weathered concrete campus road texture matching the real video (00:18-00:39, 02:44-03:00):
 * Warm light-grey concrete slabs with subtle expansion joints, tire-wear & monsoon patina.
 */
function makeConcreteCampusRoadTex(seedVal = 9104) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  ctx.fillStyle = '#a8a296';
  ctx.fillRect(0, 0, S, S);

  // Fine concrete aggregate & tropical monsoon weathering patches
  for (let i = 0; i < 7500; i++) {
    const v = 132 + Math.floor(rnd() * 58);
    ctx.fillStyle = `rgba(${v},${v - 3},${v - 8},${0.18 + rnd() * 0.22})`;
    ctx.fillRect(rnd() * S, rnd() * S, 1.5 + rnd() * 3.0, 1.5 + rnd() * 3.0);
  }
  for (let i = 0; i < 45; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(92,86,76,0.10)' : 'rgba(218,214,204,0.12)';
    ctx.beginPath();
    ctx.arc(rnd() * S, rnd() * S, 14 + rnd() * 38, 0, Math.PI * 2);
    ctx.fill();
  }
  // Concrete slab expansion joints across width
  ctx.fillStyle = 'rgba(65,60,54,0.34)';
  ctx.fillRect(0, 126, S, 3);
  ctx.fillRect(0, 382, S, 3);
  // Darkened kerb shoulders on left & right edges
  ctx.fillStyle = 'rgba(72,68,62,0.32)';
  ctx.fillRect(0, 0, 18, S);
  ctx.fillRect(S - 18, 0, 18, S);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Dense green duckweed / algae / kochuripana surface texture for the South Old Green Pond.
 */
function makeGreenAlgaePondTex(seedVal = 7741) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  ctx.fillStyle = '#2e5d28';
  ctx.fillRect(0, 0, S, S);
  const shades = ['#3e7a2e', '#4d8f34', '#264d20', '#5ca33b', '#356b29', '#6fb048'];
  for (let i = 0; i < 480; i++) {
    ctx.fillStyle = shades[Math.floor(rnd() * shades.length)];
    ctx.globalAlpha = 0.35 + rnd() * 0.45;
    ctx.beginPath();
    ctx.arc(rnd() * S, rnd() * S, 8 + rnd() * 28, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.72;
  for (let i = 0; i < 6500; i++) {
    ctx.fillStyle = shades[Math.floor(rnd() * shades.length)];
    const r = 1.2 + rnd() * 2.6;
    ctx.fillRect(rnd() * S, rnd() * S, r, r);
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = 8;
  return tex;
}

/**
 * Authentic white overhead Main Gate signboard from video (00:09-00:13):
 * Arabic + Bengali + English + 88 Khan Jahan Ali Road, Khulna.
 */
function makeRealMainGateSignTex() {
  const W = 1024;
  const H = 224;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#0f3d2e';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, W - 16, H - 16);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#0f3d2e';
  ctx.font = 'bold 34px "Noto Sans Arabic", "Segoe UI", sans-serif';
  ctx.fillText('خولنا عالية كامل مدرسة', W * 0.5, 50);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 46px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText('খুলনা আলিয়া কামিল (এম.এ) মাদ্রাসা', W * 0.5, 114);

  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 28px "Manrope", sans-serif';
  ctx.fillText('Khulna Alia Kamil (M.A) Madrasah  ·  88, Khan Jahan Ali Road, Khulna', W * 0.5, 174);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeDemoLabelTex(titleBn, titleEn, dimsText, bgHex = '#1e293b') {
  const W = 640;
  const H = 200;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, W - 16, H - 16);

  ctx.fillStyle = '#facc15';
  ctx.fillRect(24, 22, 118, 34);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px "Manrope", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('DEMO MODEL', 32, 39);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText(titleBn, 26, 94, W - 52);

  ctx.fillStyle = '#bae6fd';
  ctx.font = '600 22px "Manrope", sans-serif';
  ctx.fillText(`${titleEn}  ·  ${dimsText}`, 26, 148, W - 52);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function addRoadRibbon(staticG, pts, halfW, mat, yTop = 0.058, curbMat = null, curbExtra = 0.65) {
  if (!pts || pts.length < 2) return;
  const buildStrip = (hw, y, material) => {
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    let distAcc = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i];
      let nx = 0;
      let nz = 0;
      if (i > 0) {
        const dx = x - pts[i - 1][0];
        const dz = z - pts[i - 1][1];
        const l = Math.hypot(dx, dz) || 1;
        distAcc += l;
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
      positions.push(x - nx * hw, y, z - nz * hw);
      positions.push(x + nx * hw, y, z + nz * hw);
      normals.push(0, 1, 0, 0, 1, 0);
      const vCoord = distAcc * 0.14;
      uvs.push(0, vCoord, 1, vCoord);
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
    const mesh = new THREE.Mesh(geo, material);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    staticG.add(mesh);
  };

  if (curbMat) {
    buildStrip(halfW + curbExtra, yTop - 0.012, curbMat);
  }
  buildStrip(halfW, yTop, mat);
}

function addWallSpan(staticG, colliders, x0, z0, x1, z1, bank, height = 1.95) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  if (len < 0.5) return;
  const mx = (x0 + x1) * 0.5;
  const mz = (z0 + z1) * 0.5;
  const yaw = Math.atan2(dx, dz);

  const wall = box(staticG, [0.38, height, len], [mx, height * 0.5, mz], bank.colonialCream);
  wall.rotation.y = yaw;
  const cap = box(staticG, [0.50, 0.18, len + 0.1], [mx, height + 0.09, mz], bank.terracotta);
  cap.rotation.y = yaw;

  const pillars = Math.max(2, Math.floor(len / 8.0));
  for (let i = 0; i <= pillars; i++) {
    const t = i / pillars;
    const px = x0 + dx * t;
    const pz = z0 + dz * t;
    const p = box(staticG, [0.56, height + 0.25, 0.56], [px, (height + 0.25) * 0.5, pz], bank.colonialCream);
    p.rotation.y = yaw;
  }

  const segs = Math.max(1, Math.ceil(len / 6.0));
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs;
    const t1 = (i + 1) / segs;
    const sx0 = x0 + dx * t0;
    const sz0 = z0 + dz * t0;
    const sx1 = x0 + dx * t1;
    const sz1 = z0 + dz * t1;
    colliders.push({
      minX: Math.min(sx0, sx1) - 0.28,
      maxX: Math.max(sx0, sx1) + 0.28,
      minZ: Math.min(sz0, sz1) - 0.28,
      maxZ: Math.max(sz0, sz1) + 0.28,
      maxY: height + 0.4,
    });
  }
}

/**
 * Iconic Red-and-Green painted steel pipe railing along the Main Campus Road (video 02:45-03:00).
 */
function addRedGreenRoadRailing(staticG, bank, x, z0, z1) {
  const len = Math.abs(z1 - z0);
  const mz = (z0 + z1) * 0.5;
  box(staticG, [0.06, 0.06, len], [x, 0.96, mz], bank.flowerRed);
  box(staticG, [0.05, 0.05, len], [x, 0.52, mz], bank.emeraldMat);
  const posts = Math.max(4, Math.floor(len / 2.2));
  for (let i = 0; i <= posts; i++) {
    const pz = z0 + (z1 - z0) * (i / posts);
    cylinder(staticG, 0.032, 0.032, 0.98, [x, 0.49, pz], i % 2 === 0 ? bank.emeraldMat : bank.flowerRed, 6);
  }
}

function makeDirtPathTex(seedVal = 6612) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(0, 0, S, S);
  const tones = ['#7d664a', '#9c8364', '#6d583e', '#a89172', '#5f4d37'];
  for (let i = 0; i < 600; i++) {
    ctx.fillStyle = tones[Math.floor(rnd() * tones.length)];
    ctx.globalAlpha = 0.25 + rnd() * 0.35;
    ctx.beginPath();
    ctx.arc(rnd() * S, rnd() * S, 6 + rnd() * 24, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.65;
  for (let i = 0; i < 6500; i++) {
    ctx.fillStyle = tones[Math.floor(rnd() * tones.length)];
    const r = 1 + rnd() * 2.5;
    ctx.fillRect(rnd() * S, rnd() * S, r, r);
  }
  ctx.globalAlpha = 1.0;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeDustyBrickPathTex(seedVal = 5519) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  // Dusty weathered mortar base
  ctx.fillStyle = '#7c7568';
  ctx.fillRect(0, 0, S, S);
  const bw = 32;
  const bh = 16;
  const brickCols = ['#945444', '#864a3d', '#9f6150', '#7c483d', '#8c5a4c', '#a36b58'];
  for (let row = 0; row < S / bh; row++) {
    const off = (row % 2) * (bw * 0.5);
    for (let col = -1; col <= S / bw; col++) {
      ctx.fillStyle = brickCols[Math.floor(rnd() * brickCols.length)];
      ctx.fillRect(col * bw + off + 2, row * bh + 2, bw - 4, bh - 4);
    }
  }
  // Natural Bangladeshi dust, sand & monsoon moss smudges across the bricks
  for (let i = 0; i < 420; i++) {
    ctx.fillStyle = rnd() > 0.28 ? 'rgba(155,144,122,0.22)' : 'rgba(62,74,48,0.18)';
    ctx.beginPath();
    ctx.arc(rnd() * S, rnd() * S, 8 + rnd() * 26, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 5200; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(176,165,144,0.26)' : 'rgba(48,42,35,0.24)';
    ctx.fillRect(rnd() * S, rnd() * S, 1.5 + rnd() * 2, 1.5 + rnd() * 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function buildTwinPondsAndRealPukurGhat(staticG, dynamicG, bank, mats, colliders) {
  /* ---- A) NORTH CLEAN BATHING POND (পরিষ্কার পুকুর — wider West & East!) ---- */
  const cX0 = 199.5;
  const cX1 = 236.0;
  const cZ0 = 141.5;
  const cZ1 = 169.5;
  const cCx = (cX0 + cX1) * 0.5;
  const cCz = (cZ0 + cZ1) * 0.5;
  const cW = cX1 - cX0;
  const cD = cZ1 - cZ0;

  const cleanWaterMat = new THREE.MeshPhysicalMaterial({
    color: 0x265c42, // Natural greenish-teal Bangladeshi pond water seen in video 02:07-02:15!
    roughness: 0.14,
    metalness: 0.06,
    clearcoat: 0.90,
    transparent: true,
    opacity: 0.94,
  });
  const cleanWater = new THREE.Mesh(new THREE.PlaneGeometry(cW, cD), cleanWaterMat);
  cleanWater.rotation.x = -Math.PI * 0.5;
  cleanWater.position.set(cCx, 0.02, cCz);
  cleanWater.receiveShadow = true;
  dynamicG.add(cleanWater);

  // Brick retaining embankments & dusty weathered Pukurpar walkway around Clean Pond
  const edges = [
    { x0: cX0, z0: cZ0, x1: cX1, z1: cZ0, nx: 0, nz: -1 },
    { x0: cX1, z0: cZ0, x1: cX1, z1: cZ1, nx: 1, nz: 0 },
    { x0: cX1, z0: cZ1, x1: cX0, z1: cZ1, nx: 0, nz: 1 },
    { x0: cX0, z0: cZ1, x1: cX0, z1: cZ0, nx: -1, nz: 0 },
  ];
  for (const e of edges) {
    const dx = e.x1 - e.x0;
    const dz = e.z1 - e.z0;
    const len = Math.hypot(dx, dz);
    const mx = (e.x0 + e.x1) * 0.5;
    const mz = (e.z0 + e.z1) * 0.5;
    const yaw = Math.atan2(dx, dz);

    const wall = box(staticG, [0.68, 0.52, len + 0.6], [mx + e.nx * 0.34, 0.26, mz + e.nz * 0.34], bank.brick, { uvScale: 2.2 });
    wall.rotation.y = yaw;
    const cap = box(staticG, [0.82, 0.10, len + 0.7], [mx + e.nx * 0.34, 0.55, mz + e.nz * 0.34], bank.stonePlinth);
    cap.rotation.y = yaw;
    const walk = box(staticG, [2.6, 0.12, len + 2.4], [mx + e.nx * 1.9, 0.06, mz + e.nz * 1.9], mats.dustyBrick, { uvScale: 3.0, castShadow: false });
    walk.rotation.y = yaw;
  }

  // ICONIC REAL-VIDEO COVERED TIN-SHED PUKUR GHAT PAVILION (01:52-02:15) on the West Bank right off the Main Road!
  const pgX = 197.2;
  const pgZ = cCz; // 155.5
  box(staticG, [6.4, 0.22, 11.4], [pgX, 0.11, pgZ], bank.stonePlinth);
  for (let s = 0; s < 6; s++) {
    box(staticG, [0.64, 0.18, 9.6], [199.8 + s * 0.62, 0.20 - s * 0.11, pgZ], bank.stonePlinth);
  }
  box(staticG, [4.2, 0.44, 0.42], [201.4, 0.22, pgZ - 4.9], bank.stonePlinth);
  box(staticG, [4.2, 0.44, 0.42], [201.4, 0.22, pgZ + 4.9], bank.stonePlinth);
  box(staticG, [5.2, 0.68, 0.55], [pgX - 0.2, 0.44, pgZ - 5.2], bank.terracotta);
  box(staticG, [5.2, 0.68, 0.55], [pgX - 0.2, 0.44, pgZ + 5.2], bank.terracotta);
  for (const px of [pgX - 2.4, pgX, pgX + 2.4]) {
    for (const pz of [pgZ - 5.1, pgZ, pgZ + 5.1]) {
      if (pz === pgZ && px === pgX + 2.4) continue;
      cylinder(staticG, 0.055, 0.055, 1.55, [px, 0.92, pz], bank.flowerRed, 8);
      cylinder(staticG, 0.055, 0.055, 1.55, [px, 2.45, pz], bank.emeraldMat, 8);
    }
  }
  const leftSlope = box(staticG, [6.2, 0.10, 6.2], [pgX, 3.45, pgZ - 2.9], bank.emeraldMat);
  leftSlope.rotation.x = 0.22;
  const rightSlope = box(staticG, [6.2, 0.10, 6.2], [pgX, 3.45, pgZ + 2.9], bank.emeraldMat);
  rightSlope.rotation.x = -0.22;
  box(staticG, [6.4, 0.18, 0.22], [pgX, 4.12, pgZ], bank.flowerRed);
  box(staticG, [0.14, 0.24, 11.8], [pgX - 3.0, 3.10, pgZ], bank.emeraldDark);

  const cleanSignTex = makeDemoLabelTex('পরিষ্কার পুকুর ও পুকুরঘাট', 'CLEAN BATHING POND & COVERED GHAT', '৩৬মি × ২৮মি · গোসলের পুকুর', '#0c4a6e');
  const cleanBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 1.75),
    new THREE.MeshBasicMaterial({ map: cleanSignTex, side: THREE.DoubleSide }),
  );
  cleanBoard.position.set(pgX - 3.15, 3.65, pgZ);
  cleanBoard.rotation.y = -Math.PI * 0.5;
  dynamicG.add(cleanBoard);

  /* ---- B) DIRT ROAD (মাটির রাস্তা) BETWEEN CLEAN POND & OLD GREEN POND -> TEACHERS' QUARTERS! ---- */
  addRoadRibbon(staticG, [
    [194.2, 173.8],
    [216.0, 173.8],
    [244.5, 173.8],
  ], 3.4, mats.dirtPath, 0.048, null, 0);

  /* ---- C) POND-FRONT MADRASAH VEHICLE & BIKE GARAGE (আলিয়া মাদ্রাসা পুকুরের সামনের গ্যারেজ!) ---- */
  const garX = 197.6;
  const garZ = 179.0;
  box(staticG, [6.4, 0.18, 7.6], [garX, 0.09, garZ], bank.stonePlinth);
  box(staticG, [0.24, 2.85, 7.4], [garX + 3.05, 1.52, garZ], bank.colonialCream); // Back wall
  box(staticG, [6.2, 2.85, 0.24], [garX, 1.52, garZ + 3.65], bank.colonialCream); // South wall
  box(staticG, [6.2, 2.85, 0.24], [garX, 1.52, garZ - 3.65], bank.colonialCream); // North wall
  for (const gzP of [garZ - 3.5, garZ, garZ + 3.5]) {
    cylinder(staticG, 0.08, 0.08, 2.95, [garX - 3.0, 1.56, gzP], bank.steelDark, 8);
  }
  const garRoof = box(staticG, [6.9, 0.12, 8.0], [garX, 3.10, garZ], bank.emeraldDark);
  garRoof.rotation.z = -0.07;
  // Parked bicycles/motorbikes inside the Pond-Front Garage
  for (let i = 0; i < 4; i++) {
    const bz = garZ - 2.3 + i * 1.5;
    box(staticG, [1.65, 0.72, 0.42], [garX + 0.6, 0.52, bz], i % 2 === 0 ? bank.steelDark : bank.flowerRed);
    box(staticG, [0.16, 0.55, 0.62], [garX - 0.15, 0.92, bz], bank.chromeMat);
  }
  const garSignTex = makeDemoLabelTex('আলিয়া মাদ্রাসা গ্যারেজ', 'ALIA MADRASAH GARAGE (PARKING)', 'পুকুরের সামনের গ্যারেজ', '#1e3a5f');
  const garBoard = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.25), new THREE.MeshBasicMaterial({ map: garSignTex, side: THREE.DoubleSide }));
  garBoard.position.set(garX - 3.15, 2.75, garZ);
  garBoard.rotation.y = -Math.PI * 0.5;
  dynamicG.add(garBoard);
  colliders.push({ minX: garX + 2.8, maxX: garX + 3.3, minZ: garZ - 3.8, maxZ: garZ + 3.8, maxY: 3.4 });
  colliders.push({ minX: garX - 3.1, maxX: garX + 3.3, minZ: garZ + 3.4, maxZ: garZ + 3.9, maxY: 3.4 });
  colliders.push({ minX: garX - 3.1, maxX: garX + 3.3, minZ: garZ - 3.9, maxZ: garZ - 3.4, maxY: 3.4 });

  /* ---- D) SOUTH OLD GREEN ALGAE / DUCKWEED POND (finishes earlier on West, stretches further East!) ---- */
  const gX0 = 203.0;
  const gX1 = 238.0;
  const gZ0 = 178.0;
  const gZ1 = 198.5;
  const gCx = (gX0 + gX1) * 0.5;
  const gCz = (gZ0 + gZ1) * 0.5;
  const gW = gX1 - gX0;
  const gD = gZ1 - gZ0;

  const greenPondMesh = new THREE.Mesh(new THREE.PlaneGeometry(gW, gD), mats.greenAlgaePond);
  greenPondMesh.rotation.x = -Math.PI * 0.5;
  greenPondMesh.position.set(gCx, 0.024, gCz);
  greenPondMesh.receiveShadow = true;
  dynamicG.add(greenPondMesh);

  box(staticG, [gW + 2.4, 0.42, 1.2], [gCx, 0.21, gZ0 - 0.6], bank.moss);
  box(staticG, [gW + 2.4, 0.42, 1.2], [gCx, 0.21, gZ1 + 0.6], bank.moss);
  box(staticG, [1.2, 0.42, gD + 1.2], [gX0 - 0.6, 0.21, gCz], bank.moss);
  box(staticG, [1.2, 0.42, gD + 1.2], [gX1 + 0.6, 0.21, gCz], bank.moss);

  const greenSignTex = makeDemoLabelTex('পুরনো সবুজ পুকুর (শ্যাওলা/কচুরিপানা)', 'OLD GREEN ALGAE POND · 35m × 20m', 'শ্যাওলা ও কচুরিপানা ভরা পুকুর', '#14532d');
  const greenBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(5.8, 1.80),
    new THREE.MeshBasicMaterial({ map: greenSignTex, side: THREE.DoubleSide }),
  );
  greenBoard.position.set(gX0 - 1.5, 2.3, gCz);
  greenBoard.rotation.y = -Math.PI * 0.5;
  dynamicG.add(greenBoard);
  // Plastic round pond-bank ball trees removed — ready for user's Tripo tree models!
}

function addDemoBlockoutBuilding(staticG, dynamicG, mats, colliders, {
  cx, cz, w, d, floors = 3, titleBn, titleEn, labelFaces = ['south'], rotY = 0, tint = 'neutral', redRoof = false, rooftopTower = false,
}) {
  const flH = 3.2;
  const totalH = floors * flH;
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = rotY;
  staticG.add(g);

  const bodyMat = tint === 'ochre'
    ? mats.demoOchre
    : (tint === 'pink' ? mats.demoPink : (tint === 'hostel' ? mats.demoHostel : mats.demoBody));

  box(g, [w + 0.5, 0.35, d + 0.5], [0, 0.175, 0], mats.demoPlinth);
  box(g, [w, totalH, d], [0, 0.35 + totalH * 0.5, 0], bodyMat);
  box(g, [w + 0.3, 0.28, d + 0.3], [0, 0.35 + totalH + 0.14, 0], redRoof ? mats.demoRedRoof : mats.demoTrim);
  for (let f = 1; f < floors; f++) {
    box(g, [w + 0.18, 0.10, d + 0.18], [0, 0.35 + f * flH, 0], mats.demoBand);
  }

  // Signature rooftop concrete water-tank/stair tower on Student Hostel (video 03:14-03:19!)
  if (rooftopTower) {
    const ty = 0.35 + totalH;
    box(g, [4.2, 3.8, 4.2], [0, ty + 1.9, -d * 0.25], bodyMat);
    box(g, [4.6, 0.28, 4.6], [0, ty + 3.9, -d * 0.25], mats.demoTrim);
  }

  const dimsText = `${Math.round(w)}m × ${Math.round(d)}m · ${floors} তলা`;
  const signTex = makeDemoLabelTex(titleBn, titleEn, dimsText);
  const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });

  const dg = new THREE.Group();
  dg.position.set(cx, 0, cz);
  dg.rotation.y = rotY;
  dynamicG.add(dg);

  const signY = Math.min(Math.max(totalH * 0.55, 2.2), 5.2);
  for (const face of labelFaces) {
    const span = (face === 'east' || face === 'west') ? d : w;
    const signW = Math.min(Math.max(span * 0.72, 4.4), 12.0);
    const signH = signW * 0.31;
    const sMesh = new THREE.Mesh(new THREE.PlaneGeometry(signW, signH), signMat);
    if (face === 'east') {
      sMesh.position.set(w * 0.5 + 0.18, signY, 0);
      sMesh.rotation.y = Math.PI * 0.5;
    } else if (face === 'west') {
      sMesh.position.set(-w * 0.5 - 0.18, signY, 0);
      sMesh.rotation.y = -Math.PI * 0.5;
    } else if (face === 'north') {
      sMesh.position.set(0, signY, -d * 0.5 - 0.18);
      sMesh.rotation.y = Math.PI;
    } else {
      sMesh.position.set(0, signY, d * 0.5 + 0.18);
    }
    dg.add(sMesh);
  }

  const roofSign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w * 0.85, 11.5), Math.min(d * 0.55, 3.8)), signMat);
  roofSign.rotation.x = -Math.PI * 0.5;
  roofSign.position.set(0, 0.35 + totalH + 0.36, 0);
  dg.add(roofSign);

  const c = Math.abs(Math.cos(rotY));
  const s = Math.abs(Math.sin(rotY));
  const hw = (w * c + d * s) * 0.5;
  const hd = (w * s + d * c) * 0.5;
  colliders.push({
    minX: cx - hw,
    maxX: cx + hw,
    minZ: cz - hd,
    maxZ: cz + hd,
    maxY: totalH + 0.8,
  });
}

function buildFootballGoalpost(staticG, bank, cx, cz, facingSign = 1) {
  const gw = 5.4;
  const gh = 2.25;
  const gd = 1.4;
  cylinder(staticG, 0.055, 0.055, gh, [cx - gw * 0.5, gh * 0.5, cz], bank.marbleWhite, 8);
  cylinder(staticG, 0.055, 0.055, gh, [cx + gw * 0.5, gh * 0.5, cz], bank.marbleWhite, 8);
  box(staticG, [gw + 0.12, 0.11, 0.11], [cx, gh, cz], bank.marbleWhite);
  for (const sx of [-gw * 0.5, gw * 0.5]) {
    rodBetween(staticG, [cx + sx, gh, cz], [cx + sx, 0.05, cz - facingSign * gd], 0.04, bank.marbleWhite, 6);
    rodBetween(staticG, [cx + sx, 0.05, cz], [cx + sx, 0.05, cz - facingSign * gd], 0.04, bank.marbleWhite, 6);
  }
  box(staticG, [gw, 0.06, 0.06], [cx, 0.05, cz - facingSign * gd], bank.marbleWhite);
}

export function buildAliaCampusBlockoutAndRoads(staticG, dynamicG, bank) {
  const concreteRoadTex = makeConcreteCampusRoadTex(9104);
  const concreteRoadMat = new THREE.MeshStandardMaterial({
    map: concreteRoadTex,
    roughness: 0.78,
    metalness: 0.04,
    envMapIntensity: 0.50,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  attachDerivedPBRMaps(concreteRoadMat, concreteRoadTex, { strength: 2.0, roughBase: 0.78, normalScale: 0.65 });

  const greenAlgaeTex = makeGreenAlgaePondTex(7741);
  const greenAlgaeMat = new THREE.MeshStandardMaterial({
    map: greenAlgaeTex,
    roughness: 0.90,
    metalness: 0.02,
  });
  attachDerivedPBRMaps(greenAlgaeMat, greenAlgaeTex, { strength: 1.6, roughBase: 0.90, normalScale: 0.55 });

  const dirtPathTex = makeDirtPathTex(6612);
  const dirtPathMat = new THREE.MeshStandardMaterial({
    map: dirtPathTex,
    roughness: 0.94,
    metalness: 0.0,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  attachDerivedPBRMaps(dirtPathMat, dirtPathTex, { strength: 1.8, roughBase: 0.94, normalScale: 0.60 });

  const dustyBrickTex = makeDustyBrickPathTex(5519);
  const dustyBrickMat = new THREE.MeshStandardMaterial({
    map: dustyBrickTex,
    roughness: 0.88,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  attachDerivedPBRMaps(dustyBrickMat, dustyBrickTex, { strength: 2.1, roughBase: 0.88, normalScale: 0.65 });

  const mats = {
    concreteRoad: concreteRoadMat,
    dirtPath: dirtPathMat,
    dustyBrick: dustyBrickMat,
    curb: bank.darkConcrete,
    greenAlgaePond: greenAlgaeMat,
    demoBody: new THREE.MeshStandardMaterial({ color: 0xd8dee6, roughness: 0.86, metalness: 0.04 }),
    demoHostel: new THREE.MeshStandardMaterial({ color: 0xebe0c8, roughness: 0.86, metalness: 0.04 }),
    demoOchre: new THREE.MeshStandardMaterial({ color: 0xc29e4c, roughness: 0.85, metalness: 0.04 }), // Real ochre-yellow Etimkhana (video 00:01-00:30)!
    demoPink: new THREE.MeshStandardMaterial({ color: 0xebd7cc, roughness: 0.85, metalness: 0.04 }), // Real Girls Wing cream-pink tint (video 03:38)
    demoPlinth: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.88 }),
    demoTrim: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.78 }),
    demoRedRoof: new THREE.MeshStandardMaterial({ color: 0xa64b37, roughness: 0.78 }),
    demoBand: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.82 }),
    chalkLine: bank.chalkLine,
  };

  const demoColliders = [];

  /* ==========================================================================
   * 1. HIGH-GRAPHICS CONCRETE MAIN ENTRANCE ROAD (VIDEO 00:18-00:39 & 02:44-03:00)
   *    Khan Jahan Ali Rd Main Gate -> past Etimkhana (Left) & Green Pond (Right)
   *    -> past Model Mosque (Left) & Covered Pukur Ghat (Right)
   *    -> straight North along Big Playground -> Main Alia Madrasah Portico!
   * ======================================================================== */
  // Straight-ahead Concrete Main Road from Main Gate (184, 207.5) directly into Main Portico Building (184, 86.0)!
  addRoadRibbon(staticG, [
    [184.0, 217.0],
    [184.0, 207.5],
    [184.0, 172.0],
    [184.0, 136.0],
    [184.0, 106.0],
    [184.0, 86.0],
  ], 3.8, mats.concreteRoad, 0.060, mats.curb, 0.45);

  // Concrete front promenade along the Main Alia Madrasah Portico Building (z = 86.0)
  addRoadRibbon(staticG, [
    [164.0, 86.0],
    [184.0, 86.0],
    [206.0, 86.0],
  ], 3.4, mats.concreteRoad, 0.059, mats.curb, 0.35);

  // Iconic Red-and-Green Pipe Railings along BOTH Right (x=188.4) and Left (x=179.6) sides past the Pukurpar right-turn road (z=136.5)
  for (const railX of [179.6, 188.4]) {
    addRedGreenRoadRailing(staticG, bank, railX, 134.0, 114.0);
    addRedGreenRoadRailing(staticG, bank, railX, 106.0, 91.0);
  }

  // Concrete Side Drains + Taller Slender Ornamental Trees & Flowering Plants along BOTH sides starting AFTER the Pukurpar right-turn road (z = 133.0 -> 92.0)
  const drainChanMat = new THREE.MeshStandardMaterial({ color: 0x3f474f, roughness: 0.92 });
  const slimTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5b3d26, roughness: 0.92 });
  const slenderLeafMat = new THREE.MeshStandardMaterial({ color: 0x1d6b34, roughness: 0.78 });
  const flowerLeafMat = new THREE.MeshStandardMaterial({ color: 0x26823e, roughness: 0.78 });
  const flowerBloomMats = [
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.52 }),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.52 }),
    new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.52 }),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.52 }),
  ];
  for (const side of [-1, 1]) {
    const dx = 184.0 + side * 4.55;
    // Concrete open side drain running cleanly beside the main road (z = 92..198)
    box(staticG, [0.44, 0.08, 106.0], [dx, 0.02, 145.0], drainChanMat, { castShadow: false });
    box(staticG, [0.10, 0.16, 106.0], [dx - 0.24, 0.08, 145.0], mats.curb, { castShadow: false });
    box(staticG, [0.10, 0.16, 106.0], [dx + 0.24, 0.08, 145.0], mats.curb, { castShadow: false });

    // Alternating Tall Slender Ornamental Trees (চিকন লম্বা গাছ) & Taller Flowering Plants (ফুল গাছ)
    // Starts cleanly right AFTER the Pukurpar right-turn road (z = 136.5) -> z = 133.0 down to 92.0!
    const fx = 184.0 + side * 5.35;
    let idx = 0;
    for (let fz = 133.0; fz >= 92.0; fz -= 2.8) {
      // Leave clean open crossing gap matching the railing opening at z = 107..113
      if (fz > 107.0 && fz < 113.0) { idx++; continue; }
      const isSlimTree = (idx % 2 === 0);
      if (isSlimTree) {
        // Tall, slim columnar ornamental tree (~3.4m-3.9m tall, narrow & graceful)
        const hBoost = (idx % 3) * 0.22;
        cylinder(staticG, 0.055, 0.085, 1.25 + hBoost * 0.4, [fx, 0.62 + hBoost * 0.2, fz], slimTrunkMat, 6);
        const tiers = [
          [1.45 + hBoost * 0.4, 0.46, 0.95],
          [2.10 + hBoost * 0.6, 0.38, 0.92],
          [2.72 + hBoost * 0.8, 0.29, 0.85],
          [3.25 + hBoost, 0.18, 0.72],
        ];
        for (const [ty, tr, th] of tiers) {
          const cone = new THREE.Mesh(new THREE.ConeGeometry(tr, th, 7), slenderLeafMat);
          cone.position.set(fx, ty, fz);
          staticG.add(cone);
        }
      } else {
        // Taller, fuller flowering plant (~1.45m tall) with slim stem & vibrant blooms
        cylinder(staticG, 0.032, 0.048, 0.78, [fx, 0.39, fz], slimTrunkMat, 6);
        const lowerBush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36, 0), flowerLeafMat);
        lowerBush.scale.set(0.85, 1.15, 0.85);
        lowerBush.position.set(fx, 0.88, fz);
        staticG.add(lowerBush);
        const upperBush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), flowerLeafMat);
        upperBush.scale.set(0.82, 1.15, 0.82);
        upperBush.position.set(fx, 1.24, fz);
        staticG.add(upperBush);
        const bMat = flowerBloomMats[Math.abs(idx + (side > 0 ? 1 : 0)) % flowerBloomMats.length];
        for (const [oxF, oyF, ozF] of [
          [-0.18, 1.05, 0.14], [0.19, 1.08, -0.12], [0.0, 1.46, 0.02],
          [-0.12, 1.32, -0.14], [0.14, 1.28, 0.14],
        ]) {
          const fl = new THREE.Mesh(new THREE.SphereGeometry(0.085, 6, 5), bMat);
          fl.position.set(fx + oxF, oyF, fz + ozF);
          staticG.add(fl);
        }
      }
      idx++;
    }
  }

  // Dusty weathered herringbone brick connector path along North/East edge of Playground -> NE & East Academic Campuses
  addRoadRibbon(staticG, [
    [188.0, 86.0],
    [216.0, 80.0],
    [240.0, 75.0],
    [240.0, 106.0],
    [239.0, 136.0],
  ], 2.6, mats.dustyBrick, 0.056, mats.curb, 0.35);

  // Dusty weathered brick connector path between Big Playground & Clean Pond -> Student Hostel & Teachers' Quarters
  addRoadRibbon(staticG, [
    [187.5, 136.5],
    [216.0, 136.5],
    [239.0, 136.0],
  ], 2.6, mats.dustyBrick, 0.056, mats.curb, 0.35);

  // Dusty weathered interlocking paver forecourt right in front of Model Mosque inside campus (left of Main Road!)
  box(staticG, [8.5, 0.05, 22.0], [176.0, 0.025, 162.0], mats.dustyBrick, { castShadow: false, uvScale: 4.0 });

  // Bigger Clean Central Play Ground (আলিয়া মাদ্রাসা বড় মাঠ — 100% open & free of benches!)
  const fx = 216.5;
  const fz = 105.5;
  const fw = 35.0;
  const fl = 48.0;
  box(staticG, [fw, 0.02, 0.24], [fx, 0.032, fz - fl * 0.5], mats.chalkLine, { castShadow: false });
  box(staticG, [fw, 0.02, 0.24], [fx, 0.032, fz + fl * 0.5], mats.chalkLine, { castShadow: false });
  box(staticG, [fw, 0.02, 0.24], [fx, 0.032, fz], mats.chalkLine, { castShadow: false });
  box(staticG, [0.24, 0.02, fl], [fx - fw * 0.5, 0.032, fz], mats.chalkLine, { castShadow: false });
  box(staticG, [0.24, 0.02, fl], [fx + fw * 0.5, 0.032, fz], mats.chalkLine, { castShadow: false });
  buildFootballGoalpost(staticG, bank, fx, fz - fl * 0.5 + 1.0, -1);
  buildFootballGoalpost(staticG, bank, fx, fz + fl * 0.5 - 1.0, 1);

  /* ==========================================================================
   * 2. TWIN PONDS + DIRT ROAD + POND-FRONT GARAGE + COVERED TIN-SHED PUKUR GHAT!
   * ======================================================================== */
  buildTwinPondsAndRealPukurGhat(staticG, dynamicG, bank, mats, demoColliders);

  /* ==========================================================================
   * 3. REAL-VIDEO MAIN GATE ON KHAN JAHAN ALI ROAD (gx = 184.0, gz = 207.5)
   *    White double metal gates + authentic white overhead Arabic/Bengali/English signboard!
   * ======================================================================== */
  const gx = 184.0;
  const gz = 207.5;
  // Aligned 0° straight North (-Z) directly facing the Main Portico Building & Principal's Office!
  const gateGroup = new THREE.Group();
  gateGroup.position.set(gx, 0, gz);
  gateGroup.rotation.y = 0;
  staticG.add(gateGroup);

  const gateDynGroup = new THREE.Group();
  gateDynGroup.position.set(gx, 0, gz);
  gateDynGroup.rotation.y = 0;
  dynamicG.add(gateDynGroup);

  // Exterior Alia Madrasah Boundary Wall & Tall White-Plaster Pillars along South Perimeter (outside campus!)
  for (const seg of [
    { x0: 136.0, x1: 178.8 },
    { x0: 189.2, x1: 242.0 },
  ]) {
    const segW = seg.x1 - seg.x0;
    const segCx = (seg.x0 + seg.x1) * 0.5;
    box(staticG, [segW, 1.95, 0.32], [segCx, 0.98, gz], bank.whitePlaster);
    box(staticG, [segW + 0.08, 0.14, 0.42], [segCx, 2.02, gz], bank.stonePlinth);
    for (let px = seg.x0; px <= seg.x1 + 0.1; px += 4.8) {
      box(staticG, [0.58, 2.65, 0.58], [px, 1.32, gz], bank.whitePlaster);
      box(staticG, [0.70, 0.16, 0.70], [px, 2.72, gz], bank.stonePlinth);
    }
  }

  for (const dx of [-4.4, 4.4]) {
    box(gateGroup, [1.05, 5.2, 1.05], [dx, 2.6, 0], bank.whitePlaster);
    box(gateGroup, [1.22, 0.28, 1.22], [dx, 5.26, 0], bank.darkConcrete);
  }
  box(gateGroup, [9.9, 1.55, 0.35], [0, 5.15, 0], bank.steelDark);

  const gateSignTex = makeRealMainGateSignTex();
  const gateSignMat = new THREE.MeshStandardMaterial({
    map: gateSignTex,
    emissive: 0xffffff,
    emissiveMap: gateSignTex,
    emissiveIntensity: 0.22,
    roughness: 0.35,
    side: THREE.DoubleSide,
  });
  bank.emissiveList.push({ mat: gateSignMat, day: 0.20, night: 1.25 });
  const gateBoard = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 1.46), gateSignMat);
  gateBoard.position.set(0, 5.15, 0.22);
  gateDynGroup.add(gateBoard);

  // Authentic White Painted Metal Double Gate Leaves (video 00:10-00:17)
  const leftLeaf = new THREE.Group();
  leftLeaf.position.set(-3.8, 0, 0);
  const rightLeaf = new THREE.Group();
  rightLeaf.position.set(3.8, 0, 0);
  const mkLeaf = (leaf, sign) => {
    box(leaf, [3.7, 2.75, 0.09], [sign * 1.85, 1.42, 0], bank.whitePlaster);
    box(leaf, [3.74, 0.10, 0.12], [sign * 1.85, 2.82, 0], bank.steelDark);
    for (let i = 0; i < 6; i++) {
      box(leaf, [0.04, 0.55, 0.11], [sign * (0.35 + i * 0.58), 3.10, 0], bank.steelDark);
    }
  };
  mkLeaf(leftLeaf, 1);
  mkLeaf(rightLeaf, -1);
  gateDynGroup.add(leftLeaf, rightLeaf);

  // SW Boundary Wall flush along Khan Jahan Ali Road
  const cosA = Math.cos(KJA_ANGLE);
  const sinA = Math.sin(KJA_ANGLE);
  const gateLeftX = gx - 5.0 * cosA;
  const gateLeftZ = gz + 5.0 * sinA;
  const gateRightX = gx + 5.0 * cosA;
  const gateRightZ = gz - 5.0 * sinA;
  addWallSpan(staticG, demoColliders, 128.0, 175.0, gateLeftX, gateLeftZ, bank, 1.95);
  addWallSpan(staticG, demoColliders, gateRightX, gateRightZ, 258.0, 236.0, bank, 1.95);
  addWallSpan(staticG, demoColliders, 128.0, 175.0, 128.0, 52.0, bank, 1.95);
  addWallSpan(staticG, demoColliders, 128.0, 52.0, 258.0, 52.0, bank, 1.95);
  addWallSpan(staticG, demoColliders, 258.0, 52.0, 258.0, 236.0, bank, 1.95);

  /* ---- DARWAN GUARD ROOM / SECURITY POST RIGHT INSIDE RIGHT SIDE OF MAIN GATE (user video 02:40-03:20!) ---- */
  const drGroup = new THREE.Group();
  drGroup.position.set(gx + 6.4 * cosA - 2.6 * sinA, 0, gz - 6.4 * sinA - 2.6 * cosA);
  drGroup.rotation.y = KJA_ANGLE;
  staticG.add(drGroup);
  // Concrete plinth + white plastered guard cabin (3.4m × 3.0m) with open doorway & grilled observation window
  box(drGroup, [3.6, 0.24, 3.2], [0, 0.12, 0], bank.stonePlinth);
  box(drGroup, [3.4, 2.75, 0.22], [0, 1.60, -1.40], bank.whitePlaster);   // Back wall
  box(drGroup, [0.22, 2.75, 3.0], [1.60, 1.60, 0], bank.whitePlaster);    // Right wall
  box(drGroup, [0.22, 2.75, 1.0], [-1.60, 1.60, -1.0], bank.whitePlaster); // Left wall (leaves open entry facing road!)
  box(drGroup, [0.22, 0.80, 1.15], [-1.60, 2.58, 0.10], bank.whitePlaster);
  box(drGroup, [1.2, 2.75, 0.22], [1.0, 1.60, 1.40], bank.whitePlaster);  // Front right wall
  box(drGroup, [1.1, 1.10, 0.22], [-0.45, 0.78, 1.40], bank.whitePlaster); // Window sill wall facing gate
  box(drGroup, [1.1, 0.65, 0.22], [-0.45, 2.65, 1.40], bank.whitePlaster); // Window header
  box(drGroup, [1.05, 0.95, 0.08], [-0.45, 1.80, 1.40], bank.glassCurtain, { castShadow: false });
  box(drGroup, [3.9, 0.22, 3.5], [0, 3.05, 0], bank.emeraldMat);           // Green tin/slab overhang roof
  // Darwan's wooden desk & chair right inside + outside chair!
  box(drGroup, [1.15, 0.74, 0.58], [0.2, 0.61, 0.72], bank.teakWood);     // Guard desk
  box(drGroup, [0.48, 0.45, 0.48], [0.2, 0.46, 0.05], bank.teakWood);     // Darwan chair seat
  box(drGroup, [0.48, 0.48, 0.08], [0.2, 0.90, -0.18], bank.teakWood);    // Darwan chair backrest
  // Extra outdoor guard chair right beside the doorway!
  box(drGroup, [0.50, 0.45, 0.50], [-2.15, 0.35, 0.55], bank.teakWood);
  box(drGroup, [0.50, 0.46, 0.08], [-2.15, 0.78, 0.32], bank.teakWood);
  const drSignTex = makeDemoLabelTex('দারোয়ান কক্ষ (গার্ড পোস্ট)', 'SECURITY / DARWAN ROOM', 'খুলনা আলিয়া মাদ্রাসা গেট', '#065f46');
  const drSign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.72), new THREE.MeshBasicMaterial({ map: drSignTex, side: THREE.DoubleSide }));
  drSign.position.set(0, 2.85, 1.56);
  drGroup.add(drSign);

  /* ---- WALKABLE 3-STORY OCHRE ETIMKHANA BUILDING (ভেতরে ঢোকা যাবে — user video 03:20-03:45!) ---- */
  const etX = 164.5;
  const etZ = 192.5;
  const etW = 28.0;
  const etD = 13.0;
  const etGroup = new THREE.Group();
  etGroup.position.set(etX, 0, etZ);
  etGroup.rotation.y = KJA_ANGLE;
  staticG.add(etGroup);
  // Plinth + tiled walkable ground-floor hall (hollow ground story with wide open East doorway facing the road!)
  box(etGroup, [etW + 0.6, 0.30, etD + 0.6], [0, 0.15, 0], bank.marbleWhite);
  box(etGroup, [etW, 3.2, 0.36], [0, 1.90, -etD * 0.5 + 0.18], mats.demoOchre); // North wall
  box(etGroup, [etW, 3.2, 0.36], [0, 1.90,  etD * 0.5 - 0.18], mats.demoOchre); // South wall
  box(etGroup, [0.36, 3.2, etD], [-etW * 0.5 + 0.18, 1.90, 0], mats.demoOchre); // West wall
  // East wall facing main campus road: WIDE OPEN CENTER ENTRANCE (3.4m wide!)
  box(etGroup, [0.36, 3.2, 4.6], [etW * 0.5 - 0.18, 1.90, -4.1], mats.demoOchre);
  box(etGroup, [0.36, 3.2, 4.6], [etW * 0.5 - 0.18, 1.90,  4.1], mats.demoOchre);
  box(etGroup, [0.36, 0.7, 3.8], [etW * 0.5 - 0.18, 3.15,  0.0], mats.demoOchre);
  // Interior pillars & student beds/desks inside the walkable ground hall
  for (const ix of [-8.0, 0.0, 8.0]) {
    box(etGroup, [0.42, 3.2, 0.42], [ix, 1.90, -2.5], bank.whitePlaster);
    box(etGroup, [0.42, 3.2, 0.42], [ix, 1.90,  2.5], bank.whitePlaster);
    box(etGroup, [2.1, 0.55, 1.0], [ix - 2.4, 0.58, -4.6], bank.teakWood);
    box(etGroup, [2.1, 0.55, 1.0], [ix - 2.4, 0.58,  4.6], bank.teakWood);
  }
  // 2nd & 3rd floors above with balconies, terracotta trims & windows
  box(etGroup, [etW + 0.2, 0.26, etD + 0.2], [0, 3.55, 0], mats.demoBand);
  box(etGroup, [etW, 6.4, etD], [0, 6.85, 0], mats.demoOchre);
  box(etGroup, [etW + 0.35, 0.28, etD + 0.35], [0, 10.18, 0], mats.demoRedRoof);
  box(etGroup, [etW + 0.2, 0.14, etD + 0.2], [0, 6.85, 0], mats.demoBand);
  for (let wx = -11.0; wx <= 11.0; wx += 4.4) {
    for (const wy of [5.2, 8.4]) {
      box(etGroup, [1.8, 1.5, 0.16], [wx, wy,  etD * 0.5 + 0.04], bank.glassCurtain, { castShadow: false });
      box(etGroup, [1.8, 1.5, 0.16], [wx, wy, -etD * 0.5 - 0.04], bank.glassCurtain, { castShadow: false });
    }
  }
  const etSignTex = makeDemoLabelTex('খুলনা আলিয়া মাদ্রাসা এতিমখানা', 'ETIMKHANA (SALIMA BHABAN · WALKABLE)', '২৮মি × ১৩মি · ৩ তলা', '#78350f');
  const etSign = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 2.2), new THREE.MeshBasicMaterial({ map: etSignTex, side: THREE.DoubleSide }));
  etSign.position.set(etW * 0.5 + 0.22, 5.2, 0);
  etSign.rotation.y = Math.PI * 0.5;
  etGroup.add(etSign);

  /* ==========================================================================
   * 4. ALL REAL-LIFE BUILDINGS FROM SATELLITE SCREENSHOT + VIDEO
   * ======================================================================== */
  const demoBuildings = [
    {
      // Long vertical Teachers' Quarters pushed further East behind expanded ponds (reachable via Dirt Road!)
      cx: 250.5, cz: 176.0, w: 10.5, d: 56.0, floors: 2,
      titleBn: 'শিক্ষকদের কোয়ার্টারস', titleEn: 'TEACHERS QUARTERS',
      labelFaces: ['west', 'north'], tint: 'hostel',
    },
    {
      // Real-life large 4-Story Student Hostel with rooftop stair/water-tank tower (SE of Playground!)
      cx: 247.5, cz: 129.0, w: 14.5, d: 21.0, floors: 4,
      titleBn: 'স্টুডেন্ট হোস্টেল (ছাত্রাবাস)', titleEn: 'STUDENT HOSTEL (4-STORY)',
      labelFaces: ['west', 'south', 'north'], tint: 'hostel', rooftopTower: true,
    },
    {
      // Top-right red-roofed NE Academic Campus building (cleanly East of 6-Story Honors Building!)
      cx: 247.0, cz: 62.5, w: 17.5, d: 13.5, floors: 4,
      titleBn: 'উত্তর-পূর্ব একাডেমিক ক্যাম্পাস', titleEn: 'NE ACADEMIC CAMPUS',
      labelFaces: ['south', 'west'], tint: 'neutral', redRoof: true,
    },
    {
      // Science Lab (বিজ্ঞানাগার ভবন — West of open campus courtyard)
      cx: 164.0, cz: 112.7, w: 14.0, d: 14.0, floors: 2,
      titleBn: 'বিজ্ঞানাগার ভবন (সায়েন্স ল্যাব)', titleEn: 'SCIENCE LAB',
      labelFaces: ['east', 'south'], tint: 'neutral',
    },
    {
      // Madrasah Library (মাদ্রাসার লাইব্রেরী — West of Science Lab)
      cx: 144.5, cz: 108.0, w: 9.0, d: 26.0, floors: 2,
      titleBn: 'মাদ্রাসার লাইব্রেরী', titleEn: 'MADRASAH LIBRARY',
      labelFaces: ['east', 'south'], tint: 'neutral', redRoof: true,
    },
    {
      // Khulna Alia Primary School (খুলনা আলিয়া প্রাইমারি স্কুল — 1-story arched)
      cx: 158.0, cz: 136.0, w: 16.0, d: 10.0, floors: 1,
      titleBn: 'খুলনা আলিয়া প্রাইমারি স্কুল', titleEn: 'ALIA PRIMARY SCHOOL',
      labelFaces: ['east', 'south'], tint: 'neutral', redRoof: true,
    },
    {
      // Khulna Alia Madrasah Girls' Wing (মহিলা শাখা — cleanly South of rotated Main Portico front apron!)
      cx: 142.0, cz: 86.0, w: 18.0, d: 9.5, floors: 1,
      titleBn: 'খুলনা আলিয়া মাদ্রাসা মহিলা শাখা', titleEn: 'GIRLS WING (MOHILA SHAKHA)',
      labelFaces: ['south', 'east'], tint: 'pink', redRoof: true,
    },
  ];
  for (const b of demoBuildings) {
    addDemoBlockoutBuilding(staticG, dynamicG, mats, demoColliders, b);
  }

  return {
    swMainGate: { gx, gz, leftLeaf, rightLeaf },
    demoColliders,
  };
}
