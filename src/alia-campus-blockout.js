import * as THREE from 'three';
import { box, cylinder, rodBetween } from './scene-utils.js';
import { attachDerivedPBRMaps } from './aaa-shaders.js';

/**
 * KHULNA ALIA KAMIL MADRASAH — REAL-LIFE FULL CAMPUS LAYOUT & DEMO BLOCKOUT
 * (OpenStreetMap way/371685061 exact coordinates & dimensions)
 *
 * Includes:
 *  1) WIDE HIGH-GRAPHICS Campus Roads (11m Main Avenue + 8.4m Playground Loop + 8m West/Etimkhana Road
 *     + 7.6m Pukurpar Ring Road) with raised concrete footpaths, curbs & central forecourt plaza
 *  2) FULL 4-SIDED PUKURPAR (পুকুরপাড়) around the real OSM Central Pond:
 *     - Brick embankment retaining wall, 4m paved pondside promenade walkway, iron safety railings,
 *       North & West stepped brick ghats (পুকুরঘাট), lakeside benches, lamp posts & pond water surface
 *  3) Real South-West Main Gate on Khan Jahan Ali Road (x = 189.5, z = 204.0, interactive [E])
 *     + East Pocket Gate (TB Cross Rd) + Full Campus Perimeter Boundary Walls
 *  4) Football Goalposts & Chalk Markings on the real Central Play Ground + Shaheed Minar
 *  5) Clean Multi-Side Labeled DEMO Blockout Structures for ALL remaining campus buildings
 *     (Etimkhana, Science Lab, Library, Old Central Mosque, East Academic 2, A+ Hostel,
 *      Hostel Dining, Teachers Quarter, Principal's Quarter, Campus Canteen, Guard Room)
 */

function seeded(seed = 195299) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeAsphaltRoadTex(seedVal = 9101) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = '#262a30';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 6500; i++) {
    const v = 28 + Math.floor(rnd() * 44);
    ctx.fillStyle = `rgba(${v},${v + 1},${v + 3},${0.20 + rnd() * 0.25})`;
    ctx.fillRect(rnd() * S, rnd() * S, 1.5 + rnd() * 2.4, 1.5 + rnd() * 2.4);
  }
  for (const lx of [S * 0.28, S * 0.72]) {
    const g = ctx.createLinearGradient(lx - 30, 0, lx + 30, 0);
    g.addColorStop(0, 'rgba(12,14,18,0)');
    g.addColorStop(0.5, 'rgba(10,12,16,0.30)');
    g.addColorStop(1, 'rgba(12,14,18,0)');
    ctx.fillStyle = g;
    ctx.fillRect(lx - 30, 0, 60, S);
  }
  ctx.fillStyle = 'rgba(241,245,249,0.78)';
  ctx.fillRect(14, 0, 7, S);
  ctx.fillRect(S - 21, 0, 7, S);
  ctx.fillStyle = 'rgba(250,204,21,0.88)';
  ctx.fillRect(S * 0.5 - 4, 24, 8, 172);
  ctx.fillRect(S * 0.5 - 4, 280, 8, 172);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
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

function addRoadRibbon(staticG, pts, halfW, mat, yTop = 0.058, curbMat = null, curbExtra = 0.85) {
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
      const vCoord = distAcc * 0.12;
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

  // Periodic brick pillars along boundary wall
  const pillars = Math.max(2, Math.floor(len / 8.0));
  for (let i = 0; i <= pillars; i++) {
    const t = i / pillars;
    const px = x0 + dx * t;
    const pz = z0 + dz * t;
    const p = box(staticG, [0.58, height + 0.25, 0.58], [px, (height + 0.25) * 0.5, pz], bank.colonialCream);
    p.rotation.y = yaw;
  }

  // Approximate axis-aligned collider segments for clean walking collision
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
 * Full 4-Sided Bangladeshi Madrasah Pukurpar (পুকুরপাড়):
 * Brick retaining embankment + 4m paved walkway + safety railings + benches + lamps + twin ghats!
 */
function buildFullCentralPondAndPukurpar(staticG, dynamicG, bank, mats, colliders) {
  // Exact OSM Central Pond polygon (clockwise in XZ)
  const pondPoly = [
    [202.9, 145.2],
    [220.3, 149.8],
    [234.8, 153.0],
    [230.0, 177.5],
    [194.5, 165.4],
  ];

  // Pond center for outward normals
  let pcx = 0;
  let pcz = 0;
  for (const [x, z] of pondPoly) {
    pcx += x;
    pcz += z;
  }
  pcx /= pondPoly.length;
  pcz /= pondPoly.length;

  // 1) Crisp Shimmering Pond Water Plane right inside the embankment (always clearly visible!)
  const wShape = new THREE.Shape(pondPoly.map(([x, z]) => new THREE.Vector2(x, -z)));
  const wGeo = new THREE.ShapeGeometry(wShape);
  wGeo.rotateX(-Math.PI * 0.5);
  const pondWaterMat = new THREE.MeshPhysicalMaterial({
    color: 0x0e6b7a,
    roughness: 0.14,
    metalness: 0.08,
    clearcoat: 0.9,
    transparent: true,
    opacity: 0.92,
  });
  const pondWaterMesh = new THREE.Mesh(wGeo, pondWaterMat);
  pondWaterMesh.position.y = 0.015;
  pondWaterMesh.receiveShadow = true;
  dynamicG.add(pondWaterMesh);

  // 2) Raised Brick Retaining Wall (পাকা পাড়) + 3.8m Paved Pukurpar Walkway + Safety Railings + Benches + Lamps
  for (let i = 0; i < pondPoly.length; i++) {
    const [x0, z0] = pondPoly[i];
    const [x1, z1] = pondPoly[(i + 1) % pondPoly.length];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const mx = (x0 + x1) * 0.5;
    const mz = (z0 + z1) * 0.5;
    const yaw = Math.atan2(dx, dz);

    // Outward unit normal pointing AWAY from pond center
    let nx = -dz / len;
    let nz = dx / len;
    if ((mx + nx - pcx) ** 2 + (mz + nz - pcz) ** 2 < (mx - pcx) ** 2 + (mz - pcz) ** 2) {
      nx = -nx;
      nz = -nz;
    }

    // Brick embankment coping wall right along the water's edge
    const wallX = mx + nx * 0.35;
    const wallZ = mz + nz * 0.35;
    const wall = box(staticG, [0.75, 0.55, len + 0.6], [wallX, 0.275, wallZ], bank.brick, { uvScale: 2.2 });
    wall.rotation.y = yaw;
    const cap = box(staticG, [0.90, 0.10, len + 0.7], [wallX, 0.58, wallZ], bank.stonePlinth);
    cap.rotation.y = yaw;

    // 3.8m Wide Paved Pukurpar Promenade Walkway (পুকুরপাড়ের রাস্তা)
    const walkX = mx + nx * 2.45;
    const walkZ = mz + nz * 2.45;
    const walk = box(staticG, [3.8, 0.14, len + 3.6], [walkX, 0.07, walkZ], bank.paverDriveway, { uvScale: 3.5, castShadow: false });
    walk.rotation.y = yaw;

    // Outer Pukurpar concrete border curb
    const outerX = mx + nx * 4.35;
    const outerZ = mz + nz * 4.35;
    const outerCurb = box(staticG, [0.30, 0.18, len + 3.8], [outerX, 0.09, outerZ], bank.marbleWhite);
    outerCurb.rotation.y = yaw;

    // Safety Iron Railings along the pond edge (skip small openings at North Ghat & West Ghat)
    const posts = Math.max(4, Math.floor(len / 3.2));
    const railX = mx + nx * 0.45;
    const railZ = mz + nz * 0.45;
    const railTop = box(staticG, [0.06, 0.06, len], [railX, 1.06, railZ], bank.steelDark);
    railTop.rotation.y = yaw;
    const railMid = box(staticG, [0.04, 0.04, len], [railX, 0.82, railZ], bank.steelDark);
    railMid.rotation.y = yaw;
    for (let p = 0; p <= posts; p++) {
      const t = p / posts;
      cylinder(staticG, 0.035, 0.04, 0.52, [x0 + dx * t + nx * 0.45, 0.82, z0 + dz * t + nz * 0.45], bank.steelDark, 6);
    }

    // Pondside Sitting Benches & Warm Lamp Posts along the Pukurpar!
    if (len > 14) {
      for (const bt of [0.30, 0.70]) {
        const bx = x0 + dx * bt + nx * 2.85;
        const bz = z0 + dz * bt + nz * 2.85;
        const bGroup = new THREE.Group();
        bGroup.position.set(bx, 0.14, bz);
        bGroup.rotation.y = Math.atan2(-nx, -nz);
        box(bGroup, [1.8, 0.07, 0.48], [0, 0.44, 0], bank.teakWood);
        box(bGroup, [1.8, 0.34, 0.06], [0, 0.72, -0.22], bank.teakWood);
        for (const lx of [-0.72, 0.72]) {
          box(bGroup, [0.10, 0.44, 0.48], [lx, 0.22, 0], bank.steelDark);
        }
        staticG.add(bGroup);
      }
      // Corner lamp post on Pukurpar
      const lx = x0 + nx * 2.1;
      const lz = z0 + nz * 2.1;
      cylinder(staticG, 0.06, 0.09, 3.8, [lx, 2.0, lz], bank.steelDark, 8);
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), bank.bulbGlow);
      globe.position.set(lx, 4.05, lz);
      dynamicG.add(globe);
    }
  }

  // 3) Grand North Stepped Brick Ghat (প্রধান উত্তর পুকুরঘাট — Facing Central Play Ground!)
  const ngX = 213.5;
  const ngZ = 148.2;
  box(staticG, [10.8, 0.30, 3.6], [ngX, 0.15, ngZ - 1.2], bank.brick, { uvScale: 2.4 });
  for (let s = 0; s < 5; s++) {
    box(staticG, [9.2, 0.22, 0.62], [ngX, 0.26 - s * 0.14, ngZ + 0.8 + s * 0.58], bank.stonePlinth);
  }
  for (const px of [ngX - 5.1, ngX + 5.1]) {
    box(staticG, [0.65, 1.35, 0.65], [px, 0.68, ngZ - 2.6], bank.colonialCream);
    box(staticG, [0.75, 0.18, 0.75], [px, 1.40, ngZ - 2.6], bank.terracotta);
  }

  // 4) West Stepped Wudu Ghat (পশ্চিম ঘাট — Facing Model Mosque!)
  const wgX = 197.8;
  const wgZ = 156.5;
  box(staticG, [3.2, 0.28, 7.6], [wgX - 1.2, 0.14, wgZ], bank.brick, { uvScale: 2.0 });
  for (let s = 0; s < 4; s++) {
    box(staticG, [0.58, 0.20, 6.2], [wgX + 0.5 + s * 0.52, 0.24 - s * 0.13, wgZ], bank.stonePlinth);
  }

  // 5) Prominent Bilingual Pukurpar Signboard (facing North toward Play Ground & Main Road)
  const pondSignTex = makeDemoLabelTex('কেন্দ্রীয় পুকুর ও পুকুরপাড়', 'CENTRAL POND & PUKURPAR · 37m × 27m', 'মাদ্রাসা পুকুরঘাট', '#0c4a6e');
  const pondBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(6.8, 2.1),
    new THREE.MeshBasicMaterial({ map: pondSignTex, side: THREE.DoubleSide }),
  );
  pondBoard.position.set(213.5, 2.55, 143.5);
  dynamicG.add(pondBoard);
  cylinder(staticG, 0.07, 0.09, 2.5, [210.5, 1.25, 143.5], bank.steelDark, 6);
  cylinder(staticG, 0.07, 0.09, 2.5, [216.5, 1.25, 143.5], bank.steelDark, 6);
}

/**
 * Clean, lightweight DEMO blockout building with subtle floor guide lines
 * and large readable Bengali + English nameboards on MULTIPLE faces + roof
 * so every single building is unmistakable from any walking direction.
 */
function addDemoBlockoutBuilding(staticG, dynamicG, mats, colliders, {
  cx, cz, w, d, floors = 3, titleBn, titleEn, labelFaces = ['south'], rotY = 0, tint = 'neutral',
}) {
  const flH = 3.2;
  const totalH = floors * flH;
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = rotY;
  staticG.add(g);

  const bodyMat = tint === 'hostel'
    ? mats.demoHostel
    : (tint === 'mosque' ? mats.demoMosque : (tint === 'canteen' ? mats.demoCanteen : mats.demoBody));

  box(g, [w + 0.5, 0.35, d + 0.5], [0, 0.175, 0], mats.demoPlinth);
  box(g, [w, totalH, d], [0, 0.35 + totalH * 0.5, 0], bodyMat);
  box(g, [w + 0.3, 0.24, d + 0.3], [0, 0.35 + totalH + 0.12, 0], mats.demoTrim);
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

  const signY = Math.min(Math.max(totalH * 0.55, 2.2), 5.2);
  for (const face of labelFaces) {
    const span = (face === 'east' || face === 'west') ? d : w;
    const signW = Math.min(Math.max(span * 0.72, 4.2), 11.5);
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

  const roofSign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w * 0.85, 11.0), Math.min(d * 0.55, 3.6)), signMat);
  roofSign.rotation.x = -Math.PI * 0.5;
  roofSign.position.set(0, 0.35 + totalH + 0.32, 0);
  dg.add(roofSign);

  const hw = w * 0.5;
  const hd = d * 0.5;
  colliders.push({
    minX: cx - hw,
    maxX: cx + hw,
    minZ: cz - hd,
    maxZ: cz + hd,
    maxY: totalH + 0.8,
  });
}

function buildShaheedMinarDemo(staticG, dynamicG, bank, colliders, cx, cz) {
  // Raised white-and-brick stepped platform
  box(staticG, [7.6, 0.36, 4.4], [cx, 0.18, cz], bank.marbleWhite);
  box(staticG, [6.4, 0.24, 3.4], [cx, 0.48, cz], bank.stonePlinth);
  // Red Rising Sun disc behind central columns
  const sun = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.12, 24), bank.flowerRed);
  sun.rotation.x = Math.PI * 0.5;
  sun.position.set(cx, 2.35, cz - 0.85);
  staticG.add(sun);
  // Central tall bent twin columns + side smaller frames
  for (const dx of [-0.65, 0.65]) {
    box(staticG, [0.22, 4.2, 0.22], [cx + dx, 2.7, cz - 0.2], bank.marbleWhite);
  }
  box(staticG, [1.55, 0.22, 0.22], [cx, 4.7, cz - 0.2], bank.marbleWhite);
  for (const side of [-2.1, 2.1]) {
    box(staticG, [0.18, 2.9, 0.18], [cx + side - 0.45, 2.05, cz - 0.1], bank.marbleWhite);
    box(staticG, [0.18, 2.9, 0.18], [cx + side + 0.45, 2.05, cz - 0.1], bank.marbleWhite);
    box(staticG, [1.10, 0.18, 0.18], [cx + side, 3.45, cz - 0.1], bank.marbleWhite);
  }
  const tex = makeDemoLabelTex('শহীদ মিনার', 'SHAHEED MINAR', 'খুলনা আলিয়া মাদ্রাসা', '#7f1d1d');
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 1.1), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
  sign.position.set(cx, 1.1, cz + 2.35);
  dynamicG.add(sign);
  colliders.push({ minX: cx - 3.8, maxX: cx + 3.8, minZ: cz - 2.2, maxZ: cz + 2.2, maxY: 5.0 });
}

function buildFootballGoalpost(staticG, bank, cx, cz, facingSign = 1) {
  const gw = 5.4;
  const gh = 2.25;
  const gd = 1.4;
  cylinder(staticG, 0.055, 0.055, gh, [cx - gw * 0.5, gh * 0.5, cz], bank.marbleWhite, 8);
  cylinder(staticG, 0.055, 0.055, gh, [cx + gw * 0.5, gh * 0.5, cz], bank.marbleWhite, 8);
  box(staticG, [gw + 0.12, 0.11, 0.11], [cx, gh, cz], bank.marbleWhite);
  // Back support bars
  for (const sx of [-gw * 0.5, gw * 0.5]) {
    rodBetween(staticG, [cx + sx, gh, cz], [cx + sx, 0.05, cz - facingSign * gd], 0.04, bank.marbleWhite, 6);
    rodBetween(staticG, [cx + sx, 0.05, cz], [cx + sx, 0.05, cz - facingSign * gd], 0.04, bank.marbleWhite, 6);
  }
  box(staticG, [gw, 0.06, 0.06], [cx, 0.05, cz - facingSign * gd], bank.marbleWhite);
}

export function buildAliaCampusBlockoutAndRoads(staticG, dynamicG, bank) {
  const asphaltTex = makeAsphaltRoadTex(9101);
  const asphaltMat = new THREE.MeshStandardMaterial({
    map: asphaltTex,
    roughness: 0.72,
    metalness: 0.06,
    envMapIntensity: 0.55,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  attachDerivedPBRMaps(asphaltMat, asphaltTex, { strength: 2.0, roughBase: 0.72, normalScale: 0.65 });

  const mats = {
    asphalt: asphaltMat,
    footpath: bank.stonePlinth,
    demoBody: new THREE.MeshStandardMaterial({ color: 0xd8dee6, roughness: 0.86, metalness: 0.04 }),
    demoHostel: new THREE.MeshStandardMaterial({ color: 0xe6ddd0, roughness: 0.86, metalness: 0.04 }),
    demoMosque: new THREE.MeshStandardMaterial({ color: 0xd2e6df, roughness: 0.84, metalness: 0.04 }),
    demoCanteen: new THREE.MeshStandardMaterial({ color: 0xead8c0, roughness: 0.86, metalness: 0.04 }),
    demoPlinth: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.88 }),
    demoTrim: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.78 }),
    demoBand: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.82 }),
    chalkLine: bank.chalkLine,
  };

  const demoColliders = [];

  /* ==========================================================================
   * 1. WIDE HIGH-GRAPHICS CAMPUS ROAD NETWORK WITH FOOTPATHS & CURBS!
   * ======================================================================== */
  // A) Grand 11m Wide Main Campus Avenue: Khan Jahan Ali Rd -> SW Main Gate -> Model Mosque -> Main Portico -> North Building
  addRoadRibbon(staticG, [
    [183.5, 222.0],
    [189.5, 204.0],
    [192.5, 182.0],
    [193.2, 152.0],
    [193.2, 108.0],
    [193.2, 72.5],
  ], 5.4, mats.asphalt, 0.060, mats.footpath, 1.0);

  // B) Wide 8.4m Central Play Ground Perimeter Loop Road (North, East & South of Play Ground!)
  addRoadRibbon(staticG, [
    [193.2, 72.5],
    [216.0, 72.5],
    [240.5, 74.0],
    [240.5, 106.0],
    [239.5, 136.0],
    [215.0, 136.0],
    [193.2, 136.0],
  ], 4.2, mats.asphalt, 0.058, mats.footpath, 0.85);

  // C) Wide 8.0m West Campus & ETIMKHANA Avenue (Direct from Main Gate -> Canteen -> Etimkhana -> Library -> Science Lab -> North!)
  addRoadRibbon(staticG, [
    [189.5, 196.0],
    [164.0, 184.5],
    [142.0, 184.5],
    [131.0, 174.0],
    [133.0, 145.0],
    [154.0, 136.0],
    [154.0, 106.0],
    [154.0, 72.5],
    [193.2, 72.5],
  ], 3.9, bank.paverDriveway, 0.056, mats.footpath, 0.75);

  // D) Wide 7.6m South & East Pukurpar Ring Road (Main Avenue -> South Pukurpar -> Teachers Quarter -> A+ Hostel -> East Gate!)
  addRoadRibbon(staticG, [
    [192.5, 182.0],
    [218.0, 182.5],
    [240.0, 176.0],
    [241.0, 150.0],
    [239.5, 136.0],
  ], 3.8, bank.paverDriveway, 0.056, mats.footpath, 0.75);

  // E) East Gate Connector Road (from East Playground Loop -> East Pocket Gate toward TB Cross Rd)
  addRoadRibbon(staticG, [
    [240.5, 118.0],
    [266.0, 118.0],
  ], 3.8, mats.asphalt, 0.057, mats.footpath, 0.75);

  // F) Wide Paved Central Forecourt Plaza between Main Portico, Model Mosque & Pond Approach
  box(staticG, [16.0, 0.05, 16.0], [189.0, 0.025, 164.0], bank.paverDriveway, { castShadow: false, uvScale: 4.0 });

  // G) Central Play Ground White Chalk Markings + Football Goalposts!
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
   * 2. FULL 4-SIDED PUKURPAR (পুকুরপাড়) & CENTRAL POND!
   * ======================================================================== */
  buildFullCentralPondAndPukurpar(staticG, dynamicG, bank, mats, demoColliders);

  /* ==========================================================================
   * 3. REAL SOUTH-WEST MAIN GATE ON KHAN JAHAN ALI ROAD (x = 189.5, z = 204.0)
   *    + EAST POCKET GATE + FULL CAMPUS BOUNDARY WALLS
   * ======================================================================== */
  const gx = 189.5;
  const gz = 204.0;
  const gateGroup = new THREE.Group();
  gateGroup.position.set(gx, 0, gz);
  staticG.add(gateGroup);

  for (const dx of [-5.2, 5.2]) {
    box(gateGroup, [1.45, 6.0, 1.45], [dx, 3.0, 0], bank.colonialCream);
    box(gateGroup, [1.65, 0.38, 1.65], [dx, 6.08, 0], bank.terracotta);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.30, 10, 8), bank.bulbGlow);
    globe.position.set(gx + dx, 6.50, gz);
    dynamicG.add(globe);
  }
  box(gateGroup, [12.0, 1.65, 1.10], [0, 6.15, 0], bank.emeraldDark);
  box(gateGroup, [12.4, 0.26, 1.25], [0, 7.06, 0], bank.goldMat);

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
  const gateBoard = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 1.48), gateSignMat);
  gateBoard.position.set(gx, 6.15, gz + 0.60);
  dynamicG.add(gateBoard);

  // Interactive SW Main Gate Double Leaves (wider 9m opening for wide avenue!)
  const leftLeaf = new THREE.Group();
  leftLeaf.position.set(gx - 4.45, 0, gz);
  const rightLeaf = new THREE.Group();
  rightLeaf.position.set(gx + 4.45, 0, gz);
  const mkLeaf = (leaf, sign) => {
    box(leaf, [4.35, 2.75, 0.10], [sign * 2.18, 1.45, 0], bank.emeraldDark);
    for (let i = 0; i < 8; i++) {
      box(leaf, [0.05, 2.95, 0.13], [sign * (0.28 + i * 0.54), 1.55, 0], bank.goldMat);
    }
  };
  mkLeaf(leftLeaf, 1);
  mkLeaf(rightLeaf, -1);
  dynamicG.add(leftLeaf, rightLeaf);

  // Diagonal South-West Boundary Wall along Khan Jahan Ali Road (clear of Etimkhana!)
  addWallSpan(staticG, demoColliders, 124.0, 186.0, gx - 5.9, gz, bank, 1.95);
  addWallSpan(staticG, demoColliders, gx + 5.9, gz, 264.0, 212.0, bank, 1.95);
  // West, North & East Campus Perimeter Boundary Walls (with East Pocket Gate gap at z = 113..123)
  addWallSpan(staticG, demoColliders, 124.0, 186.0, 124.0, 52.0, bank, 1.95);
  addWallSpan(staticG, demoColliders, 124.0, 52.0, 264.0, 52.0, bank, 1.95);
  addWallSpan(staticG, demoColliders, 264.0, 52.0, 264.0, 113.0, bank, 1.95);
  addWallSpan(staticG, demoColliders, 264.0, 123.0, 264.0, 212.0, bank, 1.95);

  // East Pocket Gate Archway (TB Cross Road side)
  for (const dz of [-4.6, 4.6]) {
    box(staticG, [1.1, 4.4, 1.1], [264.0, 2.2, 118.0 + dz], bank.colonialCream);
    box(staticG, [1.3, 0.3, 1.3], [264.0, 4.5, 118.0 + dz], bank.terracotta);
  }
  box(staticG, [0.9, 1.1, 10.4], [264.0, 4.6, 118.0], bank.emeraldDark);

  /* ==========================================================================
   * 4. SHAHEED MINAR + ALL REMAINING CAMPUS BUILDINGS (MULTI-SIDE LABELED DEMO!)
   * ======================================================================== */
  buildShaheedMinarDemo(staticG, dynamicG, bank, demoColliders, 215.0, 78.2);

  const demoBuildings = [
    {
      cx: 142.0, cz: 173.2, w: 28.0, d: 14.0, floors: 3,
      titleBn: 'এতিমখানা ও লিল্লাহ বোর্ডিং', titleEn: 'ETIMKHANA',
      labelFaces: ['east', 'south', 'north'], tint: 'hostel',
    },
    {
      cx: 252.5, cz: 95.0, w: 12.0, d: 32.0, floors: 4,
      titleBn: 'একাডেমিক ভবন ২ (পূর্ব)', titleEn: 'EAST ACADEMIC BUILDING 2',
      labelFaces: ['west', 'south'], tint: 'neutral',
    },
    {
      cx: 252.0, cz: 134.0, w: 18.0, d: 18.0, floors: 4,
      titleBn: 'A+ হোস্টেল ভবন (ছাত্রাবাস)', titleEn: 'A+ STUDENT HOSTEL',
      labelFaces: ['west', 'south'], tint: 'hostel',
    },
    {
      cx: 252.0, cz: 156.0, w: 14.0, d: 11.0, floors: 2,
      titleBn: 'হোস্টেল ডাইনিং ও মেস', titleEn: 'HOSTEL DINING & MESS',
      labelFaces: ['west', 'north'], tint: 'canteen',
    },
    {
      cx: 164.0, cz: 112.7, w: 14.0, d: 14.0, floors: 2,
      titleBn: 'সায়েন্স ল্যাব ভবন', titleEn: 'SCIENCE LAB',
      labelFaces: ['east', 'south', 'west'], tint: 'neutral',
    },
    {
      cx: 143.0, cz: 106.9, w: 9.0, d: 28.0, floors: 2,
      titleBn: 'কেন্দ্রীয় লাইব্রেরি ভবন', titleEn: 'LIBRARY BUILDING',
      labelFaces: ['east', 'south'], tint: 'neutral',
    },
    {
      cx: 163.0, cz: 135.8, w: 14.0, d: 13.0, floors: 2,
      titleBn: 'পুরাতন কেন্দ্রীয় মসজিদ / ওজুখানা', titleEn: 'OLD CENTRAL MOSQUE ANNEX',
      labelFaces: ['east', 'south'], tint: 'mosque',
    },
    {
      cx: 236.0, cz: 190.0, w: 14.0, d: 12.0, floors: 3,
      titleBn: 'টিচার্স কোয়ার্টার', titleEn: 'TEACHERS QUARTER',
      labelFaces: ['north', 'west'], tint: 'hostel',
    },
    {
      cx: 254.0, cz: 187.0, w: 12.0, d: 12.0, floors: 2,
      titleBn: 'অধ্যক্ষের বাসভবন', titleEn: 'PRINCIPALS QUARTER',
      labelFaces: ['north', 'west'], tint: 'hostel',
    },
    {
      cx: 171.0, cz: 192.0, w: 12.0, d: 7.0, floors: 1,
      titleBn: 'মাদ্রাসা ক্যান্টিন', titleEn: 'CAMPUS CANTEEN',
      labelFaces: ['east', 'north', 'south'], tint: 'canteen',
    },
    {
      cx: 181.8, cz: 200.5, w: 4.6, d: 4.0, floors: 1,
      titleBn: 'গার্ড রুম (গেট)', titleEn: 'SECURITY GUARD ROOM',
      labelFaces: ['east', 'north'], tint: 'canteen',
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
