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

function addPondBankTree(staticG, bank, x, z, scale = 1.0) {
  cylinder(staticG, 0.18 * scale, 0.28 * scale, 3.2 * scale, [x, 1.6 * scale, z], bank.teakWood, 7);
  const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2 * scale, 1), bank.emeraldMat);
  crown.scale.set(1.15, 0.82, 1.15);
  crown.position.set(x, 3.8 * scale, z);
  staticG.add(crown);
}

/**
 * REAL-VIDEO COVERED GREEN-AND-RED TIN-SHED PUKUR GHAT (video 01:52-02:16) + TWIN PONDS:
 *  - North Clean Bathing Pond (পরিষ্কার পুকুর) with gabled green/red tin-shed pavilion right off the main road,
 *    red-green pillars, red seating walls, wide stepped concrete bathing ghat & 4-sided brick Pukurpar!
 *  - South Old Green Algae Pond (সবুজ শ্যাওলা ও কচুরিপানা ভরা পুরনো পুকুর) right south of it!
 */
function buildTwinPondsAndRealPukurGhat(staticG, dynamicG, bank, mats) {
  /* ---- A) NORTH CLEAN BATHING POND (পরিষ্কার পুকুর) ---- */
  const cX0 = 201.0;
  const cX1 = 232.0;
  const cZ0 = 144.0;
  const cZ1 = 170.0;
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

  // Brick retaining embankments & Pukurpar walkway around Clean Pond
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
    const walk = box(staticG, [2.6, 0.12, len + 2.4], [mx + e.nx * 1.9, 0.06, mz + e.nz * 1.9], bank.paverDriveway, { uvScale: 3.0, castShadow: false });
    walk.rotation.y = yaw;
  }

  // ICONIC REAL-VIDEO COVERED TIN-SHED PUKUR GHAT PAVILION (01:52-02:15) on the West Bank right off the Main Road!
  const pgX = 198.2;
  const pgZ = cCz; // 157.0
  // Concrete pavilion floor extending from Main Road (x=194.5) to Water Edge (x=201.5)
  box(staticG, [7.2, 0.22, 11.4], [pgX, 0.11, pgZ], bank.stonePlinth);
  // Wide stepped concrete bathing ghat descending into the Clean Pond (x=201.0..205.5)
  for (let s = 0; s < 6; s++) {
    box(staticG, [0.64, 0.18, 9.6], [201.2 + s * 0.62, 0.20 - s * 0.11, pgZ], bank.stonePlinth);
  }
  // Low concrete side ledges framing the stepped ghat
  box(staticG, [4.2, 0.44, 0.42], [202.8, 0.22, pgZ - 4.9], bank.stonePlinth);
  box(staticG, [4.2, 0.44, 0.42], [202.8, 0.22, pgZ + 4.9], bank.stonePlinth);
  // Iconic Red-Painted Low Brick Seating Walls (রক) on North & South sides inside the tin-shed pavilion!
  box(staticG, [5.6, 0.68, 0.55], [pgX - 0.3, 0.44, pgZ - 5.2], bank.terracotta);
  box(staticG, [5.6, 0.68, 0.55], [pgX - 0.3, 0.44, pgZ + 5.2], bank.terracotta);
  // Red-and-Green Painted Steel Pipe Pillars supporting the gabled tin roof (video 01:53-02:02)
  for (const px of [pgX - 2.8, pgX, pgX + 2.8]) {
    for (const pz of [pgZ - 5.1, pgZ, pgZ + 5.1]) {
      if (pz === pgZ && px === pgX + 2.8) continue; // Keep center water view wide open!
      cylinder(staticG, 0.055, 0.055, 1.55, [px, 0.92, pz], bank.flowerRed, 8);
      cylinder(staticG, 0.055, 0.055, 1.55, [px, 2.45, pz], bank.emeraldMat, 8);
    }
  }
  // Gabled Green Corrugated Tin Roof with Red-Trimmed Fascia (video 01:52-01:56)
  const leftSlope = box(staticG, [6.6, 0.10, 6.2], [pgX, 3.45, pgZ - 2.9], bank.emeraldMat);
  leftSlope.rotation.x = 0.22;
  const rightSlope = box(staticG, [6.6, 0.10, 6.2], [pgX, 3.45, pgZ + 2.9], bank.emeraldMat);
  rightSlope.rotation.x = -0.22;
  box(staticG, [6.8, 0.18, 0.22], [pgX, 4.12, pgZ], bank.flowerRed); // Ridge beam
  box(staticG, [0.14, 0.24, 11.8], [pgX - 3.3, 3.10, pgZ], bank.emeraldDark); // Road-facing fascia

  // Pukur Ghat Signboard facing the Main Road
  const cleanSignTex = makeDemoLabelTex('পরিষ্কার পুকুর ও পুকুরঘাট', 'CLEAN BATHING POND & COVERED GHAT', '৩১মি × ২৬মি · গোসলের পুকুর', '#0c4a6e');
  const cleanBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 1.75),
    new THREE.MeshBasicMaterial({ map: cleanSignTex, side: THREE.DoubleSide }),
  );
  cleanBoard.position.set(pgX - 3.45, 3.65, pgZ);
  cleanBoard.rotation.y = -Math.PI * 0.5;
  dynamicG.add(cleanBoard);

  /* ---- B) SOUTH OLD GREEN ALGAE / DUCKWEED POND (সবুজ শ্যাওলা ও কচুরিপানা ভরা পুরনো পুকুর) ---- */
  const gX0 = 197.5;
  const gX1 = 227.5;
  const gZ0 = 175.5;
  const gZ1 = 197.5;
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

  const greenSignTex = makeDemoLabelTex('পুরনো সবুজ পুকুর (শ্যাওলা/কচুরিপানা)', 'OLD GREEN ALGAE POND · 30m × 22m', 'শ্যাওলা ও কচুরিপানা ভরা পুকুর', '#14532d');
  const greenBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(5.8, 1.80),
    new THREE.MeshBasicMaterial({ map: greenSignTex, side: THREE.DoubleSide }),
  );
  greenBoard.position.set(gX0 - 1.5, 2.3, gCz);
  greenBoard.rotation.y = -Math.PI * 0.5;
  dynamicG.add(greenBoard);

  // Dense lush shade trees surrounding BOTH ponds (matching video & satellite photo)
  const pondTrees = [
    [203, 141.5, 1.05], [216, 141.0, 1.15], [229, 141.5, 1.0],
    [235.0, 150, 1.1], [235.0, 164, 1.05], [233.5, 178, 1.15], [232.0, 192, 1.0],
    [205, 173.0, 0.95], [220, 173.0, 0.95],
    [202, 200.0, 1.05], [216, 200.5, 1.1], [226, 199.5, 1.0],
  ];
  for (const [tx, tz, sc] of pondTrees) {
    addPondBankTree(staticG, bank, tx, tz, sc);
  }
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

  const mats = {
    concreteRoad: concreteRoadMat,
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
  addRoadRibbon(staticG, [
    [179.5, 216.0],
    [184.0, 207.5],
    [191.5, 172.0],
    [193.0, 140.0],
    [193.5, 108.0],
    [193.5, 73.5],
  ], 3.8, mats.concreteRoad, 0.060, mats.curb, 0.45);

  // Iconic Red-and-Green Pipe Railings along the Main Road approaching the Portico (video 02:45-03:00!)
  addRedGreenRoadRailing(staticG, bank, 197.4, 134.0, 114.0);
  addRedGreenRoadRailing(staticG, bank, 197.4, 102.0, 82.0);

  // Clean connector path along North edge of Playground -> NE Campus & East Academic Campus
  addRoadRibbon(staticG, [
    [193.5, 75.5],
    [216.0, 75.5],
    [239.5, 76.5],
    [239.5, 106.0],
    [238.5, 136.0],
  ], 2.6, bank.paverDriveway, 0.056, mats.curb, 0.35);

  // Clean connector path between Big Playground & Clean Pond -> Student Hostel & Teachers' Quarters
  addRoadRibbon(staticG, [
    [193.0, 136.5],
    [216.0, 136.5],
    [238.5, 136.0],
  ], 2.6, bank.paverDriveway, 0.056, mats.curb, 0.35);

  // Red-and-Grey Interlocking Paver Forecourt in front of Model Mosque (matching video 00:42-01:28!)
  box(staticG, [11.0, 0.05, 20.0], [185.0, 0.025, 166.0], bank.paverDriveway, { castShadow: false, uvScale: 4.0 });

  // Central Play Ground (আলিয়া মাদ্রাসা বড় মাঠ) White Chalk Markings + Football Goalposts
  const fx = 216.0;
  const fz = 106.0;
  const fw = 32.0;
  const fl = 44.0;
  box(staticG, [fw, 0.02, 0.24], [fx, 0.032, fz - fl * 0.5], mats.chalkLine, { castShadow: false });
  box(staticG, [fw, 0.02, 0.24], [fx, 0.032, fz + fl * 0.5], mats.chalkLine, { castShadow: false });
  box(staticG, [fw, 0.02, 0.24], [fx, 0.032, fz], mats.chalkLine, { castShadow: false });
  box(staticG, [0.24, 0.02, fl], [fx - fw * 0.5, 0.032, fz], mats.chalkLine, { castShadow: false });
  box(staticG, [0.24, 0.02, fl], [fx + fw * 0.5, 0.032, fz], mats.chalkLine, { castShadow: false });
  buildFootballGoalpost(staticG, bank, fx, fz - fl * 0.5 + 1.0, -1);
  buildFootballGoalpost(staticG, bank, fx, fz + fl * 0.5 - 1.0, 1);

  /* ==========================================================================
   * 2. TWIN PONDS + REAL-VIDEO COVERED GREEN-AND-RED TIN-SHED PUKUR GHAT!
   * ======================================================================== */
  buildTwinPondsAndRealPukurGhat(staticG, dynamicG, bank, mats);

  /* ==========================================================================
   * 3. REAL-VIDEO MAIN GATE ON KHAN JAHAN ALI ROAD (gx = 184.0, gz = 207.5)
   *    White double metal gates + authentic white overhead Arabic/Bengali/English signboard!
   * ======================================================================== */
  const gx = 184.0;
  const gz = 207.5;
  const gateGroup = new THREE.Group();
  gateGroup.position.set(gx, 0, gz);
  gateGroup.rotation.y = KJA_ANGLE;
  staticG.add(gateGroup);

  const gateDynGroup = new THREE.Group();
  gateDynGroup.position.set(gx, 0, gz);
  gateDynGroup.rotation.y = KJA_ANGLE;
  dynamicG.add(gateDynGroup);

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

  /* ==========================================================================
   * 4. ALL REAL-LIFE BUILDINGS FROM SATELLITE SCREENSHOT + VIDEO (LABELED DEMO!)
   * ======================================================================== */
  const demoBuildings = [
    {
      // Ochre-yellow 3-story Etimkhana immediately LEFT of Main Gate on Khan Jahan Ali Rd (video 00:00-00:30!)
      cx: 164.5, cz: 192.5, w: 28.0, d: 13.0, floors: 3,
      titleBn: 'খুলনা আলিয়া মাদ্রাসা এতিমখানা', titleEn: 'ETIMKHANA (SALIMA BHABAN)',
      labelFaces: ['east', 'south', 'north'], rotY: KJA_ANGLE, tint: 'ochre',
    },
    {
      // Long vertical Teachers' Quarters east of BOTH ponds (user's tall red box)
      cx: 245.5, cz: 176.0, w: 11.0, d: 56.0, floors: 2,
      titleBn: 'শিক্ষকদের কোয়ার্টারস', titleEn: 'TEACHERS QUARTERS',
      labelFaces: ['west', 'north'], tint: 'hostel',
    },
    {
      // Student Hostel with rooftop stair/water-tank tower (SE of Playground — video 03:14-03:19!)
      cx: 246.5, cz: 129.0, w: 13.0, d: 18.0, floors: 3,
      titleBn: 'স্টুডেন্ট হোস্টেল (ছাত্রাবাস)', titleEn: 'STUDENT HOSTEL',
      labelFaces: ['west', 'south', 'north'], tint: 'hostel', rooftopTower: true,
    },
    {
      // East Academic Campus building east of Playground (video 03:13!)
      cx: 248.0, cz: 96.0, w: 11.5, d: 34.0, floors: 4,
      titleBn: 'পূর্ব একাডেমিক ক্যাম্পাস ভবন', titleEn: 'EAST ACADEMIC CAMPUS',
      labelFaces: ['west', 'south'], tint: 'neutral',
    },
    {
      // Top-right red-roofed NE Academic Campus building (user's top-right arrow!)
      cx: 244.0, cz: 63.0, w: 23.0, d: 13.5, floors: 4,
      titleBn: 'উত্তর-পূর্ব একাডেমিক ক্যাম্পাস', titleEn: 'NE ACADEMIC CAMPUS',
      labelFaces: ['south', 'west'], tint: 'neutral', redRoof: true,
    },
    {
      // Science Lab (বিজ্ঞানাগার ভবন — video 02:25-02:42, West of Main Portico)
      cx: 164.0, cz: 112.7, w: 14.0, d: 14.0, floors: 2,
      titleBn: 'বিজ্ঞানাগার ভবন (সায়েন্স ল্যাব)', titleEn: 'SCIENCE LAB',
      labelFaces: ['east', 'south'], tint: 'neutral',
    },
    {
      // Madrasah Library (মাদ্রাসার লাইব্রেরী — video 02:18-02:23, West of Science Lab)
      cx: 144.5, cz: 106.9, w: 9.0, d: 28.0, floors: 2,
      titleBn: 'মাদ্রাসার লাইব্রেরী', titleEn: 'MADRASAH LIBRARY',
      labelFaces: ['east', 'south'], tint: 'neutral', redRoof: true,
    },
    {
      // Khulna Alia Primary School (খুলনা আলিয়া প্রাইমারি স্কুল — video 03:23-03:34, 1-story arched)
      cx: 158.0, cz: 136.0, w: 16.0, d: 10.0, floors: 1,
      titleBn: 'খুলনা আলিয়া প্রাইমারি স্কুল', titleEn: 'ALIA PRIMARY SCHOOL',
      labelFaces: ['east', 'south'], tint: 'neutral', redRoof: true,
    },
    {
      // Khulna Alia Madrasah Girls' Wing (মহিলা শাখা — video 03:38-03:50, 1-story cream-pink)
      cx: 142.0, cz: 76.0, w: 18.0, d: 9.5, floors: 1,
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
