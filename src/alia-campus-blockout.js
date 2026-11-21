import * as THREE from 'three';
import { box, cylinder, rodBetween } from './scene-utils.js';
import { attachDerivedPBRMaps } from './aaa-shaders.js';

/**
 * KHULNA ALIA KAMIL MADRASAH — REAL-LIFE CAMPUS LAYOUT & DEMO BLOCKOUT
 * (OpenStreetMap way/371685061 exact coordinates & dimensions)
 *
 * Includes:
 *  1) HIGH-GRAPHICS Campus Roads (Khan Jahan Ali Rd Main Gate -> Model Mosque -> Main Portico
 *     -> Central Play Ground Loop -> West Science Lab/Library -> Central Pond Promenade)
 *  2) Real-Position South-West Main Gate on Khan Jahan Ali Road (x = 190, z = 204, interactive [E])
 *  3) Realistic Spreading Krishnochura Trees (কৃষ্ণচূড়া গাছ — Delonix regia) at real campus spots
 *  4) Clean Labeled DEMO Blockout Structures for all remaining campus buildings so the user can
 *     inspect & approve every building's real-life position & scale before high-graphics modeling.
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
  for (let i = 0; i < 6000; i++) {
    const v = 28 + Math.floor(rnd() * 44);
    ctx.fillStyle = `rgba(${v},${v + 1},${v + 3},${0.20 + rnd() * 0.25})`;
    ctx.fillRect(rnd() * S, rnd() * S, 1.5 + rnd() * 2.2, 1.5 + rnd() * 2.2);
  }
  // Subtle wheel tracks & warm campus edge dust
  for (const lx of [S * 0.28, S * 0.72]) {
    const g = ctx.createLinearGradient(lx - 26, 0, lx + 26, 0);
    g.addColorStop(0, 'rgba(12,14,18,0)');
    g.addColorStop(0.5, 'rgba(10,12,16,0.28)');
    g.addColorStop(1, 'rgba(12,14,18,0)');
    ctx.fillStyle = g;
    ctx.fillRect(lx - 26, 0, 52, S);
  }
  ctx.fillStyle = 'rgba(241,245,249,0.72)';
  ctx.fillRect(16, 0, 6, S);
  ctx.fillRect(S - 22, 0, 6, S);
  ctx.fillStyle = 'rgba(250,204,21,0.85)';
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

  // DEMO badge pill
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

function addRoadRibbon(staticG, pts, halfW, mat, yTop = 0.056) {
  if (!pts || pts.length < 2) return;
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
    positions.push(x - nx * halfW, yTop, z - nz * halfW);
    positions.push(x + nx * halfW, yTop, z + nz * halfW);
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
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  staticG.add(mesh);
}

/**
 * Realistic Spreading Krishnochura Tree (কৃষ্ণচূড়া গাছ — Delonix regia)
 * Wide umbrella branches, lush green fern foliage base, fiery scarlet/orange flower canopy & fallen petals!
 */
export function addKrishnochuraTree(staticG, mats, x, z, scale = 1.0, seedVal = 701) {
  const rnd = seeded(seedVal);
  const h = 6.2 * scale;
  const trunkTopY = h * 0.48;

  // Main gnarled bark trunk + root flare
  cylinder(staticG, 0.24 * scale, 0.38 * scale, trunkTopY, [x, trunkTopY * 0.5, z], mats.bark, 8);
  cylinder(staticG, 0.36 * scale, 0.52 * scale, 0.55 * scale, [x, 0.26 * scale, z], mats.bark, 8);

  // 5 Wide Spreading Umbrella Limbs + Fern Foliage + Fiery Red-Orange Krishnochura Blossoms
  const limbCount = 5;
  for (let i = 0; i < limbCount; i++) {
    const a = (i / limbCount) * Math.PI * 2 + rnd() * 0.45;
    const reach = (2.4 + rnd() * 1.1) * scale;
    const tipX = x + Math.cos(a) * reach;
    const tipY = trunkTopY + (1.6 + rnd() * 0.7) * scale;
    const tipZ = z + Math.sin(a) * reach;
    rodBetween(staticG, [x, trunkTopY - 0.15, z], [tipX, tipY, tipZ], 0.11 * scale, mats.bark, 6);

    // Underlying green fern leaf cluster
    const leafC = new THREE.Mesh(new THREE.DodecahedronGeometry((1.45 + rnd() * 0.35) * scale, 1), mats.fernGreen);
    leafC.scale.set(1.35, 0.56, 1.35);
    leafC.position.set(tipX, tipY - 0.10 * scale, tipZ);
    staticG.add(leafC);

    // Vibrant scarlet-red & vermilion-orange Krishnochura blossom clusters crowning each limb!
    const bloomMat = i % 2 === 0 ? mats.krishnoRed : mats.krishnoOrange;
    const bloom = new THREE.Mesh(new THREE.DodecahedronGeometry((1.38 + rnd() * 0.32) * scale, 1), bloomMat);
    bloom.scale.set(1.42, 0.52, 1.42);
    bloom.position.set(tipX + (rnd() - 0.5) * 0.3, tipY + 0.42 * scale, tipZ + (rnd() - 0.5) * 0.3);
    staticG.add(bloom);
  }

  // Central Umbrella Crown Blossom Dome
  const topGreen = new THREE.Mesh(new THREE.DodecahedronGeometry(1.95 * scale, 1), mats.fernGreen);
  topGreen.scale.set(1.45, 0.52, 1.45);
  topGreen.position.set(x, h * 0.76, z);
  staticG.add(topGreen);

  const topRed = new THREE.Mesh(new THREE.DodecahedronGeometry(1.88 * scale, 1), mats.krishnoRed);
  topRed.scale.set(1.50, 0.48, 1.50);
  topRed.position.set(x, h * 0.84, z);
  staticG.add(topRed);

  // Scattered fallen red Krishnochura petals on the ground beneath the canopy
  for (let p = 0; p < 7; p++) {
    const pa = rnd() * Math.PI * 2;
    const pr = (0.7 + rnd() * 2.4) * scale;
    box(
      staticG,
      [0.32 * scale, 0.025, 0.24 * scale],
      [x + Math.cos(pa) * pr, 0.035, z + Math.sin(pa) * pr],
      p % 2 === 0 ? mats.krishnoRed : mats.krishnoOrange,
      { castShadow: false },
    );
  }
}

/**
 * Clean, lightweight DEMO blockout building with subtle floor guide lines
 * and large readable Bengali + English nameboards so the user can verify
 * exact real-life campus placement & proportions before high-graphics upgrade.
 */
function addDemoBlockoutBuilding(staticG, dynamicG, mats, colliders, {
  cx, cz, w, d, floors = 3, titleBn, titleEn, labelFace = 'south', rotY = 0, tint = 'neutral',
}) {
  const flH = 3.2;
  const totalH = floors * flH;
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = rotY;
  staticG.add(g);

  const bodyMat = tint === 'hostel'
    ? mats.demoHostel
    : (tint === 'mosque' ? mats.demoMosque : mats.demoBody);

  // Simple plinth + matte demo massing volume + crisp roof parapet + subtle floor bands
  box(g, [w + 0.5, 0.35, d + 0.5], [0, 0.175, 0], mats.demoPlinth);
  box(g, [w, totalH, d], [0, 0.35 + totalH * 0.5, 0], bodyMat);
  box(g, [w + 0.3, 0.24, d + 0.3], [0, 0.35 + totalH + 0.12, 0], mats.demoTrim);
  for (let f = 1; f < floors; f++) {
    box(g, [w + 0.18, 0.10, d + 0.18], [0, 0.35 + f * flH, 0], mats.demoBand);
  }

  // Clear Bengali + English DEMO Signboard on front face AND top roof (for easy aerial/walk verification!)
  const dimsText = `${Math.round(w)}m × ${Math.round(d)}m · ${floors} তলা`;
  const signTex = makeDemoLabelTex(titleBn, titleEn, dimsText);
  const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
  const signW = Math.min(Math.max(w, d) * 0.72, 11.5);
  const signH = signW * 0.31;

  const dg = new THREE.Group();
  dg.position.set(cx, 0, cz);
  dg.rotation.y = rotY;
  dynamicG.add(dg);

  const frontSign = new THREE.Mesh(new THREE.PlaneGeometry(signW, signH), signMat);
  if (labelFace === 'east') {
    frontSign.position.set(w * 0.5 + 0.16, Math.min(totalH * 0.58, 5.2), 0);
    frontSign.rotation.y = Math.PI * 0.5;
  } else if (labelFace === 'west') {
    frontSign.position.set(-w * 0.5 - 0.16, Math.min(totalH * 0.58, 5.2), 0);
    frontSign.rotation.y = -Math.PI * 0.5;
  } else if (labelFace === 'north') {
    frontSign.position.set(0, Math.min(totalH * 0.58, 5.2), -d * 0.5 - 0.16);
    frontSign.rotation.y = Math.PI;
  } else {
    frontSign.position.set(0, Math.min(totalH * 0.58, 5.2), d * 0.5 + 0.16);
  }
  dg.add(frontSign);

  // Roof top label (visible when flying / looking from upper floors)
  const roofSign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w * 0.85, 11.0), Math.min(d * 0.55, 3.6)), signMat);
  roofSign.rotation.x = -Math.PI * 0.5;
  roofSign.position.set(0, 0.35 + totalH + 0.32, 0);
  dg.add(roofSign);

  // Register AABB collider (axis-aligned approximation for clean walking)
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
    curb: bank.marbleWhite,
    bark: new THREE.MeshStandardMaterial({ color: 0x4b3626, roughness: 0.92 }),
    fernGreen: new THREE.MeshStandardMaterial({ color: 0x2c6e31, roughness: 0.88 }),
    krishnoRed: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.76, emissive: 0x450a0a, emissiveIntensity: 0.14 }),
    krishnoOrange: new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.76, emissive: 0x431407, emissiveIntensity: 0.12 }),
    demoBody: new THREE.MeshStandardMaterial({ color: 0xd8dee6, roughness: 0.86, metalness: 0.04 }),
    demoHostel: new THREE.MeshStandardMaterial({ color: 0xe6ddd0, roughness: 0.86, metalness: 0.04 }),
    demoMosque: new THREE.MeshStandardMaterial({ color: 0xd2e6df, roughness: 0.84, metalness: 0.04 }),
    demoPlinth: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.88 }),
    demoTrim: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.78 }),
    demoBand: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.82 }),
    pondEdge: bank.brick,
    chalkLine: bank.chalkLine,
  };

  const demoColliders = [];

  /* ==========================================================================
   * 1. HIGH-GRAPHICS CAMPUS ROAD NETWORK (KHAN JAHAN ALI RD -> FULL CAMPUS!)
   * ======================================================================== */
  // A) Main Entrance Avenue: Khan Jahan Ali Rd (186, 214) -> SW Main Gate (190, 204)
  //    -> Model Mosque Forecourt (192, 166) -> Main Portico Front (193.5, 108) -> North Building (193.5, 74)
  addRoadRibbon(staticG, [
    [184.0, 218.0],
    [189.0, 204.0],
    [192.5, 180.0],
    [193.5, 152.0],
    [193.5, 108.0],
    [193.5, 73.5],
  ], 3.8, mats.asphalt, 0.058);

  // B) Central Play Ground Perimeter Loop Road (North, East & South of the 35m x 46m Playground!)
  addRoadRibbon(staticG, [
    [193.5, 73.5],
    [216.0, 73.5],
    [240.0, 76.0],
    [239.0, 106.0],
    [237.5, 134.0],
    [215.0, 134.0],
    [193.5, 134.0],
  ], 2.5, bank.paverDriveway, 0.056);

  // C) West Campus Branch Roads (to Science Lab, Library, Central Mosque Annex & Etimkhana)
  addRoadRibbon(staticG, [
    [193.5, 73.5],
    [164.0, 73.5],
    [156.0, 96.0],
    [156.0, 124.0],
    [172.0, 144.0],
    [193.5, 144.0],
  ], 2.3, bank.paverDriveway, 0.055);

  // D) South-East Pond Promenade & Teachers Quarter / A+ Hostel Link Road
  addRoadRibbon(staticG, [
    [192.5, 180.0],
    [218.0, 182.0],
    [238.0, 172.0],
    [241.0, 150.0],
    [237.5, 134.0],
  ], 2.2, bank.paverDriveway, 0.055);

  // E) Subtle White Field Boundary Markings on the Real Central Play Ground (x=198..234, z=82..130)
  const fx = 216.0;
  const fz = 106.0;
  const fw = 32.0;
  const fl = 44.0;
  box(staticG, [fw, 0.02, 0.22], [fx, 0.03, fz - fl * 0.5], mats.chalkLine, { castShadow: false });
  box(staticG, [fw, 0.02, 0.22], [fx, 0.03, fz + fl * 0.5], mats.chalkLine, { castShadow: false });
  box(staticG, [fw, 0.02, 0.22], [fx, 0.03, fz], mats.chalkLine, { castShadow: false });
  box(staticG, [0.22, 0.02, fl], [fx - fw * 0.5, 0.03, fz], mats.chalkLine, { castShadow: false });
  box(staticG, [0.22, 0.02, fl], [fx + fw * 0.5, 0.03, fz], mats.chalkLine, { castShadow: false });

  /* ==========================================================================
   * 2. REAL SOUTH-WEST MAIN GATE ON KHAN JAHAN ALI ROAD (x = 189.5, z = 204.0)
   * ======================================================================== */
  const gx = 189.5;
  const gz = 204.0;
  const gateGroup = new THREE.Group();
  gateGroup.position.set(gx, 0, gz);
  staticG.add(gateGroup);

  for (const dx of [-4.4, 4.4]) {
    box(gateGroup, [1.35, 5.8, 1.35], [dx, 2.9, 0], bank.colonialCream);
    box(gateGroup, [1.55, 0.36, 1.55], [dx, 5.85, 0], bank.terracotta);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), bank.bulbGlow);
    globe.position.set(gx + dx, 6.26, gz);
    dynamicG.add(globe);
  }
  box(gateGroup, [10.4, 1.60, 1.05], [0, 5.95, 0], bank.emeraldDark);
  box(gateGroup, [10.8, 0.24, 1.20], [0, 6.84, 0], bank.goldMat);

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
  const gateBoard = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 1.42), gateSignMat);
  gateBoard.position.set(gx, 5.95, gz + 0.58);
  dynamicG.add(gateBoard);

  // Interactive SW Main Gate Double Leaves
  const leftLeaf = new THREE.Group();
  leftLeaf.position.set(gx - 3.75, 0, gz);
  const rightLeaf = new THREE.Group();
  rightLeaf.position.set(gx + 3.75, 0, gz);
  const mkLeaf = (leaf, sign) => {
    box(leaf, [3.65, 2.65, 0.10], [sign * 1.82, 1.40, 0], bank.emeraldDark);
    for (let i = 0; i < 7; i++) {
      box(leaf, [0.05, 2.85, 0.13], [sign * (0.28 + i * 0.52), 1.50, 0], bank.goldMat);
    }
  };
  mkLeaf(leftLeaf, 1);
  mkLeaf(rightLeaf, -1);
  dynamicG.add(leftLeaf, rightLeaf);

  // South Boundary Wall flanking the SW Main Gate along Khan Jahan Ali Rd
  box(staticG, [24.0, 1.85, 0.38], [gx - 17.0, 0.925, gz], bank.colonialCream);
  box(staticG, [24.2, 0.18, 0.48], [gx - 17.0, 1.92, gz], bank.terracotta);
  box(staticG, [52.0, 1.85, 0.38], [gx + 31.0, 0.925, gz], bank.colonialCream);
  box(staticG, [52.2, 0.18, 0.48], [gx + 31.0, 1.92, gz], bank.terracotta);
  demoColliders.push(
    { minX: gx - 29.0, maxX: gx - 4.8, minZ: gz - 0.3, maxZ: gz + 0.3, maxY: 2.2 },
    { minX: gx + 4.8, maxX: gx + 57.0, minZ: gz - 0.3, maxZ: gz + 0.3, maxY: 2.2 },
  );

  /* ==========================================================================
   * 3. KRISHNOCHURA TREES — Rendered via high-detail krishnachura_tree.glb in alia-madrasah.js
   * ======================================================================== */

  /* ==========================================================================
   * 4. CLEAN LABELED DEMO BLOCKOUT STRUCTURES FOR ALL REMAINING CAMPUS BUILDINGS
   *    (Exact OpenStreetMap way/371685061 real-world positions & dimensions!)
   * ======================================================================== */
  const demoBuildings = [
    {
      cx: 166.0, cz: 60.5, w: 38.0, d: 11.5, floors: 3,
      titleBn: 'একাডেমিক ভবন (উত্তর-পশ্চিম)', titleEn: 'NW ACADEMIC BUILDING',
      labelFace: 'south', tint: 'neutral',
    },
    {
      cx: 251.0, cz: 95.0, w: 12.0, d: 30.0, floors: 4,
      titleBn: 'একাডেমিক ভবন ২ (পূর্ব)', titleEn: 'EAST ACADEMIC BUILDING 2',
      labelFace: 'west', tint: 'neutral',
    },
    {
      cx: 247.0, cz: 134.0, w: 19.0, d: 19.0, floors: 4,
      titleBn: 'A+ হোস্টেল ভবন (ছাত্রাবাস)', titleEn: 'A+ STUDENT HOSTEL',
      labelFace: 'west', tint: 'hostel',
    },
    {
      cx: 164.0, cz: 112.7, w: 15.0, d: 14.0, floors: 2,
      titleBn: 'সায়েন্স ল্যাব ভবন', titleEn: 'SCIENCE LAB',
      labelFace: 'east', tint: 'neutral',
    },
    {
      cx: 146.5, cz: 106.9, w: 8.5, d: 26.0, floors: 2,
      titleBn: 'কেন্দ্রীয় লাইব্রেরি ভবন', titleEn: 'LIBRARY BUILDING',
      labelFace: 'east', tint: 'neutral',
    },
    {
      cx: 162.5, cz: 135.8, w: 14.0, d: 13.0, floors: 2,
      titleBn: 'পুরাতন কেন্দ্রীয় মসজিদ / সংযোগ ভবন', titleEn: 'CENTRAL MOSQUE ANNEX',
      labelFace: 'east', tint: 'mosque',
    },
    {
      cx: 142.0, cz: 173.2, w: 32.0, d: 14.0, floors: 3,
      titleBn: 'এতিমখানা ভবন', titleEn: 'ETIMKHANA',
      labelFace: 'south', tint: 'hostel',
    },
    {
      cx: 238.3, cz: 182.0, w: 12.0, d: 12.0, floors: 3,
      titleBn: 'টিচার্স কোয়ার্টার', titleEn: 'TEACHERS QUARTER',
      labelFace: 'north', tint: 'hostel',
    },
  ];
  for (const b of demoBuildings) {
    addDemoBlockoutBuilding(staticG, dynamicG, mats, demoColliders, b);
  }

  // Central Pond Border Curb & Label Plaque (matching exact OSM pond polygon around 214, 161)
  const pondSignTex = makeDemoLabelTex('কেন্দ্রীয় পুকুর (মাদ্রাসা পুকুর)', 'CENTRAL POND · 37m × 26m', 'OSM REAL LOCATION', '#0c4a6e');
  const pondBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 1.75),
    new THREE.MeshBasicMaterial({ map: pondSignTex, side: THREE.DoubleSide }),
  );
  pondBoard.position.set(214.0, 2.2, 146.5);
  dynamicG.add(pondBoard);
  cylinder(staticG, 0.06, 0.08, 2.0, [211.6, 1.0, 146.5], bank.steelDark, 6);
  cylinder(staticG, 0.06, 0.08, 2.0, [216.4, 1.0, 146.5], bank.steelDark, 6);

  return {
    swMainGate: { gx, gz, leftLeaf, rightLeaf },
    demoColliders,
  };
}
