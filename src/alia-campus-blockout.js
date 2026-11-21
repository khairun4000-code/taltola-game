import * as THREE from 'three';
import { box, cylinder, rodBetween } from './scene-utils.js';
import { attachDerivedPBRMaps } from './aaa-shaders.js';

/**
 * KHULNA ALIA KAMIL MADRASAH — EXACT USER-MARKED SATELLITE LAYOUT (DEMO BLOCKOUT + HIGH-GRAPHICS ROADS)
 * Matched 1:1 to the user's annotated Google Satellite screenshot:
 *
 *  1) Main Gate on Khan Jahan Ali Road (gx = 184.0, gz = 207.5, flush with N7)
 *  2) ONE Iconic Long Continuous Main Entrance Road (high-graphics asphalt + concrete curbs/footpaths)
 *     from Main Gate -> NE past Model Mosque -> straight North along West edge of Big Playground
 *     all the way to the Main Alia Madrasah Campus!
 *  3) Left of Main Road (before midpoint): Existing 4-Story Khulna District Model Mosque (171, 166)
 *     + Etimkhana along Khan Jahan Ali Rd just south of Model Mosque.
 *  4) Right of Main Road: TWO Distinct Ponds side-by-side (North-South):
 *     - NORTH POND: Clean Bathing Pond (পরিষ্কার পুকুর) with full 4-sided brick Pukurpar, stepped ghats,
 *       railings, benches, lamps & shade trees.
 *     - SOUTH POND: Old Green Algae / Duckweed Covered Pond (সবুজ শ্যাওলা/কচুরিপানা ভরা পুরনো পুকুর)
 *       with vibrant green algae/kochuripana mat texture & dense mossy tree-lined banks.
 *  5) East of BOTH Ponds: Long Vertical N-S Teachers' Quarters (শিক্ষকদের কোয়ার্টারস).
 *  6) North of Clean Pond: Big High-Graphics Alia Madrasah Playground (আলিয়া মাদ্রাসা মাঠ)
 *     with chalk markings & goalposts.
 *  7) East & NE of Playground (all 3 user-marked campus buildings as clean labeled DEMO structures):
 *     - Student Hostel (স্টুডেন্ট হোস্টেল — SE of playground, just above Teachers' Quarters)
 *     - East Academic Campus (পূর্ব একাডেমিক ক্যাম্পাস — long N-S building east of playground)
 *     - NE Academic Campus (উত্তর-পূর্ব একাডেমিক ক্যাম্পাস — top-right corner at head of playground)
 */

const KJA_ANGLE = -0.528; // Exact angle of Khan Jahan Ali Road (-30.25° in XZ)

function seeded(seed = 195299) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeCampusAsphaltTex(seedVal = 9101) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = '#2d3138';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 6500; i++) {
    const v = 34 + Math.floor(rnd() * 44);
    ctx.fillStyle = `rgba(${v},${v + 1},${v + 3},${0.22 + rnd() * 0.24})`;
    ctx.fillRect(rnd() * S, rnd() * S, 1.5 + rnd() * 2.4, 1.5 + rnd() * 2.4);
  }
  for (const lx of [S * 0.30, S * 0.70]) {
    const g = ctx.createLinearGradient(lx - 28, 0, lx + 28, 0);
    g.addColorStop(0, 'rgba(12,14,18,0)');
    g.addColorStop(0.5, 'rgba(12,14,18,0.24)');
    g.addColorStop(1, 'rgba(12,14,18,0)');
    ctx.fillStyle = g;
    ctx.fillRect(lx - 28, 0, 56, S);
  }
  ctx.fillStyle = 'rgba(236,240,245,0.70)';
  ctx.fillRect(14, 0, 6, S);
  ctx.fillRect(S - 20, 0, 6, S);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Procedural dense green duckweed / algae / kochuripana pond surface texture
 * for the South Old Green Pond (সবুজ শ্যাওলা ও কচুরিপানা ভরা পুরনো পুকুর).
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

  // Broad patches of duckweed, moss & floating green algae mats
  const shades = ['#3e7a2e', '#4d8f34', '#264d20', '#5ca33b', '#356b29', '#6fb048'];
  for (let i = 0; i < 480; i++) {
    ctx.fillStyle = shades[Math.floor(rnd() * shades.length)];
    ctx.globalAlpha = 0.35 + rnd() * 0.45;
    ctx.beginPath();
    ctx.arc(rnd() * S, rnd() * S, 8 + rnd() * 28, 0, Math.PI * 2);
    ctx.fill();
  }
  // Tiny duckweed / kochuripana leaf speckles covering the entire surface
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

function addRoadRibbon(staticG, pts, halfW, mat, yTop = 0.058, curbMat = null, curbExtra = 0.75) {
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
 * Simple lush tropical shade tree for lining both pond banks (matching dense tree ring in satellite photo).
 */
function addPondBankTree(staticG, bank, x, z, scale = 1.0) {
  cylinder(staticG, 0.18 * scale, 0.28 * scale, 3.2 * scale, [x, 1.6 * scale, z], bank.teakWood, 7);
  const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2 * scale, 1), bank.emeraldMat);
  crown.scale.set(1.15, 0.82, 1.15);
  crown.position.set(x, 3.8 * scale, z);
  staticG.add(crown);
}

/**
 * Builds BOTH real-life ponds on the RIGHT (East) side of the Main Entrance Road:
 *  1) NORTH CLEAN BATHING POND (পরিষ্কার পুকুর — x = 199..231, z = 144..170)
 *     Full 4-sided brick Pukurpar embankment, paved walkway, railings, benches, lamps & stepped ghats!
 *  2) SOUTH OLD GREEN ALGAE / DUCKWEED POND (সবুজ শ্যাওলা/কচুরিপানা ভরা পুরনো পুকুর — x = 197..227, z = 176..198)
 *     Completely covered in rich green duckweed/algae/kochuripana with mossy banks & dense trees!
 */
function buildTwinPondsAndPukurpar(staticG, dynamicG, bank, mats) {
  /* ---- A) NORTH CLEAN BATHING POND (পরিষ্কার পুকুর) ---- */
  const cX0 = 199.0;
  const cX1 = 231.0;
  const cZ0 = 144.0;
  const cZ1 = 170.0;
  const cCx = (cX0 + cX1) * 0.5;
  const cCz = (cZ0 + cZ1) * 0.5;
  const cW = cX1 - cX0;
  const cD = cZ1 - cZ0;

  const cleanWaterMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b5d70,
    roughness: 0.12,
    metalness: 0.08,
    clearcoat: 0.92,
    transparent: true,
    opacity: 0.94,
  });
  const cleanWater = new THREE.Mesh(new THREE.PlaneGeometry(cW, cD), cleanWaterMat);
  cleanWater.rotation.x = -Math.PI * 0.5;
  cleanWater.position.set(cCx, 0.02, cCz);
  cleanWater.receiveShadow = true;
  dynamicG.add(cleanWater);

  // Brick retaining walls & 3.2m paved Pukurpar promenade on all 4 sides of Clean Pond
  const edges = [
    { x0: cX0, z0: cZ0, x1: cX1, z1: cZ0, nx: 0, nz: -1 }, // North bank
    { x0: cX1, z0: cZ0, x1: cX1, z1: cZ1, nx: 1, nz: 0 },  // East bank
    { x0: cX1, z0: cZ1, x1: cX0, z1: cZ1, nx: 0, nz: 1 },  // South divider bank (between the 2 ponds!)
    { x0: cX0, z0: cZ1, x1: cX0, z1: cZ0, nx: -1, nz: 0 }, // West bank (facing Main Entrance Road!)
  ];

  for (const e of edges) {
    const dx = e.x1 - e.x0;
    const dz = e.z1 - e.z0;
    const len = Math.hypot(dx, dz);
    const mx = (e.x0 + e.x1) * 0.5;
    const mz = (e.z0 + e.z1) * 0.5;
    const yaw = Math.atan2(dx, dz);

    // Brick embankment retaining wall
    const wall = box(staticG, [0.70, 0.55, len + 0.6], [mx + e.nx * 0.35, 0.275, mz + e.nz * 0.35], bank.brick, { uvScale: 2.2 });
    wall.rotation.y = yaw;
    const cap = box(staticG, [0.85, 0.10, len + 0.7], [mx + e.nx * 0.35, 0.58, mz + e.nz * 0.35], bank.stonePlinth);
    cap.rotation.y = yaw;

    // Paved Pukurpar walkway (3.0m wide)
    const walk = box(staticG, [3.0, 0.14, len + 2.8], [mx + e.nx * 2.1, 0.07, mz + e.nz * 2.1], bank.paverDriveway, { uvScale: 3.2, castShadow: false });
    walk.rotation.y = yaw;

    // Iron safety railings along water edge
    const railTop = box(staticG, [0.06, 0.06, len], [mx + e.nx * 0.42, 1.05, mz + e.nz * 0.42], bank.steelDark);
    railTop.rotation.y = yaw;
    const railMid = box(staticG, [0.04, 0.04, len], [mx + e.nx * 0.42, 0.80, mz + e.nz * 0.42], bank.steelDark);
    railMid.rotation.y = yaw;
    const posts = Math.max(4, Math.floor(len / 3.5));
    for (let p = 0; p <= posts; p++) {
      const t = p / posts;
      cylinder(staticG, 0.035, 0.04, 0.50, [e.x0 + dx * t + e.nx * 0.42, 0.80, e.z0 + dz * t + e.nz * 0.42], bank.steelDark, 6);
    }

    // Benches & warm lamp posts on North & West Pukurpar
    if (e.nz === -1 || e.nx === -1) {
      for (const bt of [0.32, 0.68]) {
        const bx = e.x0 + dx * bt + e.nx * 2.3;
        const bz = e.z0 + dz * bt + e.nz * 2.3;
        const bGroup = new THREE.Group();
        bGroup.position.set(bx, 0.14, bz);
        bGroup.rotation.y = Math.atan2(-e.nx, -e.nz);
        box(bGroup, [1.75, 0.07, 0.46], [0, 0.44, 0], bank.teakWood);
        box(bGroup, [1.75, 0.34, 0.06], [0, 0.72, -0.22], bank.teakWood);
        for (const lx of [-0.70, 0.70]) box(bGroup, [0.10, 0.44, 0.46], [lx, 0.22, 0], bank.steelDark);
        staticG.add(bGroup);
      }
      const lx = e.x0 + e.nx * 1.9;
      const lz = e.z0 + e.nz * 1.9;
      cylinder(staticG, 0.06, 0.09, 3.8, [lx, 2.0, lz], bank.steelDark, 8);
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), bank.bulbGlow);
      globe.position.set(lx, 4.05, lz);
      dynamicG.add(globe);
    }
  }

  // Main Bathing Ghat on West Bank (পাকা গোসল ঘাট — facing the Main Entrance Road & Mosque!)
  const wgX = cX0;
  const wgZ = cCz;
  box(staticG, [3.2, 0.28, 8.0], [wgX - 1.2, 0.14, wgZ], bank.brick, { uvScale: 2.0 });
  for (let s = 0; s < 5; s++) {
    box(staticG, [0.58, 0.20, 6.6], [wgX + 0.5 + s * 0.52, 0.24 - s * 0.13, wgZ], bank.stonePlinth);
  }
  // North Stepped Ghat (facing Big Playground!)
  box(staticG, [9.2, 0.28, 3.2], [cCx, 0.14, cZ0 - 1.2], bank.brick, { uvScale: 2.2 });
  for (let s = 0; s < 5; s++) {
    box(staticG, [7.8, 0.20, 0.58], [cCx, 0.24 - s * 0.13, cZ0 + 0.5 + s * 0.54], bank.stonePlinth);
  }

  // Clean Pond Signboard
  const cleanSignTex = makeDemoLabelTex('পরিষ্কার পুকুর ও পুকুরপাড়', 'CLEAN BATHING POND · 32m × 26m', 'গোসলের পুকুর ও পাকা ঘাট', '#0c4a6e');
  const cleanBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(6.0, 1.85),
    new THREE.MeshBasicMaterial({ map: cleanSignTex, side: THREE.DoubleSide }),
  );
  cleanBoard.position.set(cX0 - 2.2, 2.4, cCz - 7.5);
  cleanBoard.rotation.y = -Math.PI * 0.5;
  dynamicG.add(cleanBoard);

  /* ---- B) SOUTH OLD GREEN ALGAE / DUCKWEED POND (সবুজ শ্যাওলা ও কচুরিপানা ভরা পুরনো পুকুর) ---- */
  const gX0 = 197.0;
  const gX1 = 227.0;
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

  // Mossy natural earthen/old-brick banks around the Green Algae Pond
  box(staticG, [gW + 2.4, 0.42, 1.2], [gCx, 0.21, gZ0 - 0.6], bank.moss);
  box(staticG, [gW + 2.4, 0.42, 1.2], [gCx, 0.21, gZ1 + 0.6], bank.moss);
  box(staticG, [1.2, 0.42, gD + 1.2], [gX0 - 0.6, 0.21, gCz], bank.moss);
  box(staticG, [1.2, 0.42, gD + 1.2], [gX1 + 0.6, 0.21, gCz], bank.moss);

  // Green Pond Signboard
  const greenSignTex = makeDemoLabelTex('পুরনো সবুজ পুকুর (শ্যাওলা/কচুরিপানা)', 'OLD GREEN ALGAE POND · 30m × 22m', 'ময়লা ও শ্যাওলা ভরা পুকুর', '#14532d');
  const greenBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(6.0, 1.85),
    new THREE.MeshBasicMaterial({ map: greenSignTex, side: THREE.DoubleSide }),
  );
  greenBoard.position.set(gX0 - 1.5, 2.3, gCz);
  greenBoard.rotation.y = -Math.PI * 0.5;
  dynamicG.add(greenBoard);

  // Dense Shade Trees surrounding BOTH ponds (just like the lush dark-green tree ring in the satellite screenshot!)
  const pondTrees = [
    [203, 141.5, 1.05], [216, 141.0, 1.15], [229, 141.5, 1.0],
    [234.5, 150, 1.1], [234.5, 164, 1.05], [233.5, 178, 1.15], [232.0, 192, 1.0],
    [205, 173.0, 0.95], [220, 173.0, 0.95], // Tree-lined divider bank between the 2 ponds!
    [202, 200.0, 1.05], [216, 200.5, 1.1], [226, 199.5, 1.0],
  ];
  for (const [tx, tz, sc] of pondTrees) {
    addPondBankTree(staticG, bank, tx, tz, sc);
  }
}

function addDemoBlockoutBuilding(staticG, dynamicG, mats, colliders, {
  cx, cz, w, d, floors = 3, titleBn, titleEn, labelFaces = ['south'], rotY = 0, tint = 'neutral', redRoof = false,
}) {
  const flH = 3.2;
  const totalH = floors * flH;
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = rotY;
  staticG.add(g);

  const bodyMat = tint === 'hostel' ? mats.demoHostel : mats.demoBody;

  box(g, [w + 0.5, 0.35, d + 0.5], [0, 0.175, 0], mats.demoPlinth);
  box(g, [w, totalH, d], [0, 0.35 + totalH * 0.5, 0], bodyMat);
  box(g, [w + 0.3, 0.28, d + 0.3], [0, 0.35 + totalH + 0.14, 0], redRoof ? mats.demoRedRoof : mats.demoTrim);
  for (let f = 1; f < floors; f++) {
    box(g, [w + 0.18, 0.10, d + 0.18], [0, 0.35 + f * flH, 0], mats.demoBand);
  }

  const dimsText = `${Math.round(w)}m × ${Math.round(d)}m · ${floors} তলা`;
  const signTex = makeDemoLabelTex(titleBn, titleEn, dimsText);
  const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });

  const dg = new THREE.Group();
  dg.position.set(cx, 0, cz);
  dg.rotation.y = rotY;
  dynamicG.add(dg);

  const signY = Math.min(Math.max(totalH * 0.55, 2.4), 5.2);
  for (const face of labelFaces) {
    const span = (face === 'east' || face === 'west') ? d : w;
    const signW = Math.min(Math.max(span * 0.72, 4.5), 12.0);
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
  const asphaltTex = makeCampusAsphaltTex(9101);
  const asphaltMat = new THREE.MeshStandardMaterial({
    map: asphaltTex,
    roughness: 0.74,
    metalness: 0.05,
    envMapIntensity: 0.55,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  attachDerivedPBRMaps(asphaltMat, asphaltTex, { strength: 2.0, roughBase: 0.74, normalScale: 0.65 });

  const greenAlgaeTex = makeGreenAlgaePondTex(7741);
  const greenAlgaeMat = new THREE.MeshStandardMaterial({
    map: greenAlgaeTex,
    roughness: 0.90,
    metalness: 0.02,
  });
  attachDerivedPBRMaps(greenAlgaeMat, greenAlgaeTex, { strength: 1.6, roughBase: 0.90, normalScale: 0.55 });

  const mats = {
    asphalt: asphaltMat,
    footpath: bank.stonePlinth,
    greenAlgaePond: greenAlgaeMat,
    demoBody: new THREE.MeshStandardMaterial({ color: 0xd8dee6, roughness: 0.86, metalness: 0.04 }),
    demoHostel: new THREE.MeshStandardMaterial({ color: 0xe6ddd0, roughness: 0.86, metalness: 0.04 }),
    demoPlinth: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.88 }),
    demoTrim: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.78 }),
    demoRedRoof: new THREE.MeshStandardMaterial({ color: 0xa64b37, roughness: 0.78 }),
    demoBand: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.82 }),
    chalkLine: bank.chalkLine,
  };

  const demoColliders = [];

  /* ==========================================================================
   * 1. EXACT USER-DRAWN LONG MAIN ENTRANCE ROAD (RED LINE IN SATELLITE PHOTO!)
   *    Khan Jahan Ali Rd Main Gate (184, 207.5) -> NE past Model Mosque (191.5, 172)
   *    -> Straight North between Model Mosque (Left) & Twin Ponds (Right)
   *    -> Along West edge of Big Playground -> Straight up to Main Alia Madrasah!
   * ======================================================================== */
  addRoadRibbon(staticG, [
    [179.5, 216.0],
    [184.0, 207.5],
    [191.5, 172.0],
    [193.0, 140.0],
    [193.5, 108.0],
    [193.5, 73.5],
  ], 4.0, mats.asphalt, 0.060, mats.footpath, 0.85);

  // Clean connector path along North edge of Playground -> NE Campus & East Academic Campus
  addRoadRibbon(staticG, [
    [193.5, 75.5],
    [216.0, 75.5],
    [239.5, 76.5],
    [239.5, 106.0],
    [238.5, 136.0],
  ], 2.8, bank.paverDriveway, 0.056, mats.footpath, 0.55);

  // Clean connector path between Big Playground (North) & Clean Pond Pukurpar (South) -> Student Hostel & Teachers' Quarters
  addRoadRibbon(staticG, [
    [193.0, 136.5],
    [216.0, 136.5],
    [238.5, 136.0],
  ], 2.8, bank.paverDriveway, 0.056, mats.footpath, 0.55);

  // Model Mosque Paved Forecourt connecting Left of Main Road directly to Mosque entrance
  box(staticG, [10.0, 0.05, 18.0], [185.0, 0.025, 166.0], bank.paverDriveway, { castShadow: false, uvScale: 3.5 });

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
   * 2. TWIN PONDS ON THE RIGHT SIDE OF MAIN ROAD (CLEAN BATHING POND + OLD GREEN ALGAE POND!)
   * ======================================================================== */
  buildTwinPondsAndPukurpar(staticG, dynamicG, bank, mats);

  /* ==========================================================================
   * 3. REAL ANGLED MAIN GATE ON KHAN JAHAN ALI ROAD (gx = 184.0, gz = 207.5)
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

  for (const dx of [-4.6, 4.6]) {
    box(gateGroup, [1.35, 5.8, 1.35], [dx, 2.9, 0], bank.colonialCream);
    box(gateGroup, [1.55, 0.36, 1.55], [dx, 5.88, 0], bank.terracotta);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), bank.bulbGlow);
    globe.position.set(dx, 6.28, 0);
    gateDynGroup.add(globe);
  }
  box(gateGroup, [10.8, 1.60, 1.05], [0, 5.95, 0], bank.emeraldDark);
  box(gateGroup, [11.2, 0.24, 1.20], [0, 6.84, 0], bank.goldMat);

  const gateSignTex = makeDemoLabelTex(
    'খুলনা আলিয়া কামিল মাদ্রাসা (প্রধান ফটক)',
    'MAIN GATE · 88 KHAN JAHAN ALI RD',
    'EST. 1952 · EIIN 117162',
    '#064e3b',
  );
  const gateSignMat = new THREE.MeshStandardMaterial({
    map: gateSignTex,
    emissive: 0xffffff,
    emissiveMap: gateSignTex,
    emissiveIntensity: 0.32,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });
  bank.emissiveList.push({ mat: gateSignMat, day: 0.30, night: 1.40 });
  const gateBoard = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 1.44), gateSignMat);
  gateBoard.position.set(0, 5.95, 0.58);
  gateDynGroup.add(gateBoard);

  const leftLeaf = new THREE.Group();
  leftLeaf.position.set(-3.9, 0, 0);
  const rightLeaf = new THREE.Group();
  rightLeaf.position.set(3.9, 0, 0);
  const mkLeaf = (leaf, sign) => {
    box(leaf, [3.8, 2.70, 0.10], [sign * 1.9, 1.42, 0], bank.emeraldDark);
    for (let i = 0; i < 7; i++) {
      box(leaf, [0.05, 2.90, 0.13], [sign * (0.28 + i * 0.54), 1.52, 0], bank.goldMat);
    }
  };
  mkLeaf(leftLeaf, 1);
  mkLeaf(rightLeaf, -1);
  gateDynGroup.add(leftLeaf, rightLeaf);

  // SW Boundary Wall flush along Khan Jahan Ali Road
  const cosA = Math.cos(KJA_ANGLE);
  const sinA = Math.sin(KJA_ANGLE);
  const gateLeftX = gx - 5.3 * cosA;
  const gateLeftZ = gz + 5.3 * sinA;
  const gateRightX = gx + 5.3 * cosA;
  const gateRightZ = gz - 5.3 * sinA;
  addWallSpan(staticG, demoColliders, 128.0, 175.0, gateLeftX, gateLeftZ, bank, 1.95);
  addWallSpan(staticG, demoColliders, gateRightX, gateRightZ, 258.0, 236.0, bank, 1.95);
  // West, North & East Campus Perimeter Walls
  addWallSpan(staticG, demoColliders, 128.0, 175.0, 128.0, 52.0, bank, 1.95);
  addWallSpan(staticG, demoColliders, 128.0, 52.0, 258.0, 52.0, bank, 1.95);
  addWallSpan(staticG, demoColliders, 258.0, 52.0, 258.0, 236.0, bank, 1.95);

  /* ==========================================================================
   * 4. EXACT USER-MARKED CAMPUS BUILDINGS (CLEAN LABELED DEMO BLOCKOUTS!)
   * ======================================================================== */
  const demoBuildings = [
    {
      // Long vertical red box on RIGHT of both ponds: Teachers' Quarters (শিক্ষকদের কোয়ার্টারস)
      cx: 245.5, cz: 176.0, w: 11.0, d: 56.0, floors: 2,
      titleBn: 'শিক্ষকদের কোয়ার্টারস', titleEn: 'TEACHERS QUARTERS',
      labelFaces: ['west', 'north'], tint: 'hostel',
    },
    {
      // Small triangle arrow at SE of Big Playground (right above Teachers' Quarters): Student Hostel
      cx: 246.5, cz: 129.0, w: 13.0, d: 18.0, floors: 3,
      titleBn: 'স্টুডেন্ট হোস্টেল (ছাত্রাবাস)', titleEn: 'STUDENT HOSTEL',
      labelFaces: ['west', 'south', 'north'], tint: 'hostel',
    },
    {
      // Right-side arrow along East edge of Big Playground: East Academic Campus (এখানেও ক্লাস হয়)
      cx: 248.0, cz: 96.0, w: 11.5, d: 34.0, floors: 4,
      titleBn: 'পূর্ব একাডেমিক ক্যাম্পাস ভবন', titleEn: 'EAST ACADEMIC CAMPUS',
      labelFaces: ['west', 'south'], tint: 'neutral',
    },
    {
      // Top-right corner arrow at head of Big Playground (red-roofed building): NE Academic Campus
      cx: 244.0, cz: 63.0, w: 23.0, d: 13.5, floors: 4,
      titleBn: 'উত্তর-পূর্ব একাডেমিক ক্যাম্পাস', titleEn: 'NE ACADEMIC CAMPUS',
      labelFaces: ['south', 'west'], tint: 'neutral', redRoof: true,
    },
    {
      // Building right along Khan Jahan Ali Rd south of Model Mosque (Etimkhana)
      cx: 162.5, cz: 188.5, w: 26.0, d: 12.5, floors: 3,
      titleBn: 'এতিমখানা ভবন', titleEn: 'ETIMKHANA',
      labelFaces: ['east', 'south', 'north'], rotY: KJA_ANGLE, tint: 'hostel',
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
