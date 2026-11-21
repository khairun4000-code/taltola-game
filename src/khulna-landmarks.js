import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { box, cylinder, rodBetween, mergeStaticMeshes } from './scene-utils.js';
import { buildCNGAuto } from './khulna-vehicles.js';
import { buildRoyalMoreDistrict } from './royal-more.js';
import { buildPtiMoreDistrict } from './pti-more.js';
import { buildAliaMadrasahDistrict } from './alia-madrasah.js';

function makeSignTexture({
  title,
  subtitle = '',
  bg = '#0f3d2e',
  fg = '#ffffff',
  accent = '#d9ed9c',
  border = '#ffffff',
  width = 512,
  height = 192,
}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = border;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, width - 16, height - 16);

  ctx.fillStyle = accent;
  ctx.fillRect(18, 18, 10, height - 36);

  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 34px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText(title, 44, subtitle ? height * 0.40 : height * 0.50, width - 64);

  if (subtitle) {
    ctx.fillStyle = accent;
    ctx.font = '600 22px "Manrope", "Noto Sans Bengali", sans-serif';
    ctx.fillText(subtitle, 44, height * 0.72, width - 64);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function addSignBoard(parent, textOpts, pos, rotY = 0, w = 3.2, h = 1.15) {
  const mat = new THREE.MeshBasicMaterial({
    map: makeSignTexture(textOpts),
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.y = rotY;
  parent.add(mesh);
  return mesh;
}

function rotBox(parent, size, pos, material, rotY = 0, options = {}) {
  const mesh = box(parent, size, pos, material, options);
  if (rotY) mesh.rotation.y = rotY;
  return mesh;
}

function makeLandmarkMaterials(m) {
  const plasterMap = m.plaster?.map || null;
  const plasterNorm = m.plaster?.normalMap || null;
  const brickMap = m.brick?.map || null;
  const brickNorm = m.brick?.normalMap || null;
  return {
    whitePlaster: new THREE.MeshStandardMaterial({
      color: 0xf4f1e8,
      map: plasterMap,
      normalMap: plasterNorm,
      roughness: 0.80,
      metalness: 0.02,
      envMapIntensity: 0.35,
    }),
    colonialCream: new THREE.MeshStandardMaterial({
      color: 0xf5ecd9,
      map: plasterMap,
      normalMap: plasterNorm,
      roughness: 0.82,
      metalness: 0.02,
      envMapIntensity: 0.32,
    }),
    warmOchre: new THREE.MeshStandardMaterial({
      color: 0xd9a86c,
      map: plasterMap,
      normalMap: plasterNorm,
      roughness: 0.84,
      metalness: 0.02,
      envMapIntensity: 0.28,
    }),
    emeraldMat: new THREE.MeshStandardMaterial({
      color: 0x166534,
      roughness: 0.44,
      metalness: 0.14,
      envMapIntensity: 0.7,
    }),
    emeraldDark: new THREE.MeshStandardMaterial({
      color: 0x0f3d2e,
      roughness: 0.62,
      metalness: 0.12,
      envMapIntensity: 0.45,
    }),
    goldMat: new THREE.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.28,
      metalness: 0.82,
      envMapIntensity: 1.1,
    }),
    terracottaTile: new THREE.MeshStandardMaterial({
      color: 0xb94a38,
      map: brickMap,
      normalMap: brickNorm,
      roughness: 0.86,
      metalness: 0.04,
      envMapIntensity: 0.26,
    }),
    stonePlinth: new THREE.MeshStandardMaterial({
      color: 0xd6d3cd,
      map: plasterMap,
      normalMap: plasterNorm,
      roughness: 0.86,
      metalness: 0.03,
      envMapIntensity: 0.22,
    }),
    galleryMat: new THREE.MeshStandardMaterial({
      color: 0xc8d0da,
      map: plasterMap,
      roughness: 0.88,
      metalness: 0.03,
      envMapIntensity: 0.25,
    }),
    stadiumRoof: new THREE.MeshStandardMaterial({
      color: 0x0f766e,
      roughness: 0.56,
      metalness: 0.22,
      envMapIntensity: 0.65,
    }),
    steelMat: m.darkMetal || new THREE.MeshStandardMaterial({ color: 0x3b4252, roughness: 0.48, metalness: 0.65 }),
    cavityMat: new THREE.MeshStandardMaterial({ color: 0x0b1612, roughness: 0.94, metalness: 0.04 }),
    teakWood: new THREE.MeshStandardMaterial({ color: 0x784421, roughness: 0.78, metalness: 0.04 }),
    flowerRed: new THREE.MeshStandardMaterial({ color: 0xd9463e, roughness: 0.85, metalness: 0.02 }),
    flowerGold: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.84, metalness: 0.02 }),
    chalkLine: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.94, metalness: 0.01 }),
    awningBlue: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.65, metalness: 0.08 }),
    awningGreen: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.68, metalness: 0.06 }),
    shutterMat: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.52, metalness: 0.55 }),
    cngGreen: new THREE.MeshStandardMaterial({ color: 0x157f3d, roughness: 0.46, metalness: 0.16 }),
    cngYellow: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.52, metalness: 0.1 }),
    tireBlack: new THREE.MeshStandardMaterial({ color: 0x1f2428, roughness: 0.88, metalness: 0.06 }),
    chromeMat: new THREE.MeshStandardMaterial({ color: 0xdbe2ea, roughness: 0.24, metalness: 0.86 }),
    bulbGlow: new THREE.MeshStandardMaterial({
      color: 0xfff7dc,
      emissive: 0xffd27a,
      emissiveIntensity: 1.5,
      roughness: 0.3,
    }),
    floodGlow: new THREE.MeshStandardMaterial({
      color: 0xfef9c3,
      emissive: 0xfff3b0,
      emissiveIntensity: 1.65,
    }),
    brick: m.brick,
    concrete: m.concrete,
    darkConcrete: m.darkConcrete || m.concrete,
    glass: m.glass || new THREE.MeshStandardMaterial({ color: 0x1f3a4a, roughness: 0.18, metalness: 0.72 }),
    moss: m.moss || new THREE.MeshStandardMaterial({ color: 0x2e6f3e, roughness: 0.90 }),
    trim: m.trim || m.concrete,
    wire: m.wire || new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 }),
  };
}

function addParkBench(staticG, lm, x, z, rotY = 0) {
  const bench = new THREE.Group();
  bench.position.set(x, 0, z);
  bench.rotation.y = rotY;
  for (const lx of [-0.72, 0.72]) {
    box(bench, [0.10, 0.45, 0.52], [lx, 0.225, 0], lm.steelMat);
    box(bench, [0.08, 0.48, 0.08], [lx, 0.64, -0.22], lm.steelMat);
  }
  box(bench, [1.65, 0.06, 0.46], [0, 0.44, 0.03], lm.teakWood);
  box(bench, [1.65, 0.34, 0.06], [0, 0.70, -0.22], lm.teakWood);
  staticG.add(bench);
}

function addParkLamp(staticG, dynamicG, lm, x, z, h = 4.2, yBase = 0.0) {
  cylinder(staticG, 0.14, 0.22, 0.45, [x, yBase + 0.22, z], lm.steelMat, 8);
  cylinder(staticG, 0.055, 0.085, h, [x, yBase + h * 0.5 + 0.2, z], lm.steelMat, 8);
  box(staticG, [0.95, 0.07, 0.08], [x, yBase + h + 0.12, z], lm.steelMat);
  for (const sx of [-0.42, 0.42]) {
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), lm.bulbGlow);
    globe.position.set(x + sx, yBase + h + 0.28, z);
    dynamicG.add(globe);
  }
}

function addRailingSpan(staticG, lm, x0, z0, x1, z1, posts = 4, height = 0.86, yBase = 0.03) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  const yaw = Math.atan2(dx, dz);
  const midX = (x0 + x1) * 0.5;
  const midZ = (z0 + z1) * 0.5;
  for (let i = 0; i <= posts; i++) {
    const t = i / posts;
    cylinder(staticG, 0.035, 0.045, height, [x0 + dx * t, yBase + height * 0.5, z0 + dz * t], lm.steelMat, 6);
  }
  rotBox(staticG, [0.06, 0.06, len], [midX, yBase + height - 0.04, midZ], lm.steelMat, yaw);
  rotBox(staticG, [0.04, 0.04, len], [midX, yBase + height * 0.52, midZ], lm.steelMat, yaw);
}

function addUtilityPole(staticG, dynamicG, lm, x, z, facingX = 1) {
  cylinder(staticG, 0.11, 0.17, 9.2, [x, 4.6, z], lm.stonePlinth, 10);
  box(staticG, [0.16, 0.14, 1.9], [x, 8.6, z], lm.steelMat);
  for (const dz of [-0.72, 0, 0.72]) {
    cylinder(staticG, 0.045, 0.055, 0.18, [x, 8.75, z + dz], lm.concrete, 6);
  }
  rodBetween(staticG, [x, 7.3, z], [x + facingX * 1.15, 7.65, z], 0.04, lm.steelMat);
  box(dynamicG, [0.36, 0.12, 0.24], [x + facingX * 1.15, 7.62, z], lm.bulbGlow, { castShadow: false });
  return [x, 8.8, z];
}

function addCoconutPalm(staticG, lm, x, z, height = 9.5, leanX = 0.4, leanZ = 0.2) {
  const trunkMat = lm.teakWood;
  const leafMat = lm.emeraldMat;
  const segs = 5;
  let px = x;
  let py = 0;
  let pz = z;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const nx = x + leanX * t * t;
    const ny = height * t;
    const nz = z + leanZ * t * t;
    rodBetween(staticG, [px, py, pz], [nx, ny, nz], THREE.MathUtils.lerp(0.22, 0.11, t), trunkMat, 7);
    px = nx; py = ny; pz = nz;
  }
  for (let f = 0; f < 7; f++) {
    const ang = (f / 7) * Math.PI * 2;
    const frondLen = 2.6 + (f % 2) * 0.5;
    const midX = px + Math.cos(ang) * frondLen * 0.55;
    const midY = py + 0.55;
    const midZ = pz + Math.sin(ang) * frondLen * 0.55;
    const tipX = px + Math.cos(ang) * frondLen;
    const tipY = py - 0.55;
    const tipZ = pz + Math.sin(ang) * frondLen;
    rodBetween(staticG, [px, py, pz], [midX, midY, midZ], 0.08, leafMat, 5);
    rodBetween(staticG, [midX, midY, midZ], [tipX, tipY, tipZ], 0.06, leafMat, 5);
    rotBox(staticG, [0.55, 0.08, frondLen * 0.72], [midX, midY - 0.12, midZ], leafMat, Math.atan2(tipX - px, tipZ - pz));
  }
}

function addRedGreenFenceSpan(staticG, lm, x0, z0, x1, z1, posts = 8) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  const yaw = Math.atan2(dx, dz);
  const midX = (x0 + x1) * 0.5;
  const midZ = (z0 + z1) * 0.5;
  rotBox(staticG, [0.06, 0.06, len], [midX, 0.96, midZ], lm.flowerRed, yaw);
  rotBox(staticG, [0.05, 0.05, len], [midX, 0.50, midZ], lm.emeraldMat, yaw);
  rotBox(staticG, [0.06, 0.06, len], [midX, 0.14, midZ], lm.flowerRed, yaw);
  for (let i = 0; i <= posts; i++) {
    const t = i / posts;
    const mat = i % 2 === 0 ? lm.flowerRed : lm.emeraldMat;
    box(staticG, [0.06, 0.98, 0.06], [x0 + dx * t, 0.52, z0 + dz * t], mat);
  }
}

function addCeilingFan(staticG, lm, x, y, z) {
  cylinder(staticG, 0.025, 0.025, 0.42, [x, y - 0.21, z], lm.steelMat, 6);
  cylinder(staticG, 0.14, 0.14, 0.08, [x, y - 0.44, z], lm.whitePlaster, 10);
  for (let b = 0; b < 3; b++) {
    const a = (b / 3) * Math.PI * 2;
    rotBox(staticG, [0.56, 0.018, 0.11], [x + Math.cos(a) * 0.34, y - 0.44, z + Math.sin(a) * 0.34], lm.whitePlaster, -a);
  }
}

function addWallClock(staticG, dynamicG, lm, x, y, z, rotY = Math.PI * 0.5) {
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16), lm.teakWood);
  rim.rotation.z = Math.PI * 0.5;
  rim.rotation.y = rotY - Math.PI * 0.5;
  rim.position.set(x, y, z);
  staticG.add(rim);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.045, 16), lm.chalkLine);
  face.rotation.z = Math.PI * 0.5;
  face.rotation.y = rotY - Math.PI * 0.5;
  face.position.set(x, y, z);
  dynamicG.add(face);
}

function addAliaOfficeFurniture(staticG, dynamicG, lm, cx, cz, fy, labelTitle) {
  const officeDado = new THREE.MeshStandardMaterial({ color: 0x2b6e63, roughness: 0.78 });
  const rugMat = new THREE.MeshStandardMaterial({ color: 0x7c2d2d, roughness: 0.92 });
  const cushionMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 });
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, emissive: 0x38bdf8, emissiveIntensity: 0.75 });
  const acMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.32 });

  // 1) Painted Lower Wall Dado Paneling (Teal-Green) + Patterned Office Rug
  box(staticG, [0.06, 1.15, 7.8], [180.22, fy + 0.58, cz], officeDado);
  box(staticG, [6.8, 1.15, 0.06], [cx - 0.1, fy + 0.58, cz - 3.95], officeDado);
  box(staticG, [6.8, 1.15, 0.06], [cx - 0.1, fy + 0.58, cz + 3.95], officeDado);
  box(staticG, [3.6, 0.025, 4.4], [cx - 0.2, fy + 0.015, cz], rugMat);

  // 2) Executive Teak Desk + Computer Monitor + Keyboard + Files + Pen Cup + Tea Cup + Nameplate
  box(staticG, [1.75, 0.78, 0.92], [cx - 0.55, fy + 0.39, cz], lm.teakWood);
  box(staticG, [1.82, 0.06, 0.98], [cx - 0.55, fy + 0.79, cz], lm.warmOchre);
  // Desktop Monitor + Stand + Keyboard + Mouse
  box(staticG, [0.06, 0.34, 0.54], [cx - 0.78, fy + 1.04, cz - 0.05], lm.steelMat);
  box(staticG, [0.03, 0.28, 0.48], [cx - 0.74, fy + 1.04, cz - 0.05], screenMat);
  box(staticG, [0.16, 0.08, 0.14], [cx - 0.78, fy + 0.85, cz - 0.05], lm.steelMat);
  box(staticG, [0.16, 0.025, 0.38], [cx - 0.48, fy + 0.83, cz - 0.05], lm.steelMat);
  box(staticG, [0.09, 0.025, 0.06], [cx - 0.48, fy + 0.83, cz + 0.22], lm.steelMat);
  // Colorful stacked office file folders + pen holder + tea cup + nameplate
  box(staticG, [0.28, 0.04, 0.22], [cx - 0.45, fy + 0.84, cz - 0.34], lm.awningBlue);
  box(staticG, [0.28, 0.04, 0.22], [cx - 0.44, fy + 0.88, cz - 0.34], lm.flowerRed);
  box(staticG, [0.28, 0.04, 0.22], [cx - 0.46, fy + 0.92, cz - 0.34], lm.emeraldMat);
  cylinder(staticG, 0.035, 0.035, 0.09, [cx - 0.36, fy + 0.86, cz + 0.34], lm.goldMat, 8);
  cylinder(staticG, 0.035, 0.03, 0.07, [cx - 0.22, fy + 0.85, cz + 0.24], lm.chalkLine, 8);
  box(staticG, [0.08, 0.09, 0.28], [cx - 0.12, fy + 0.86, cz], lm.goldMat);

  // 3) Cushioned Executive Chair + 2 Visitor Chairs + Waiting Guest Sofa & Coffee Table
  box(staticG, [0.60, 0.12, 0.60], [cx - 1.72, fy + 0.46, cz], cushionMat);
  box(staticG, [0.12, 0.68, 0.56], [cx - 1.98, fy + 0.82, cz], cushionMat);
  cylinder(staticG, 0.04, 0.05, 0.42, [cx - 1.72, fy + 0.22, cz], lm.steelMat, 8);
  for (const vz of [-0.62, 0.62]) {
    box(staticG, [0.50, 0.08, 0.50], [cx + 0.72, fy + 0.44, cz + vz], cushionMat);
    box(staticG, [0.08, 0.48, 0.48], [cx + 0.94, fy + 0.70, cz + vz], cushionMat);
    for (const [lx, lz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) {
      box(staticG, [0.04, 0.42, 0.04], [cx + 0.72 + lx, fy + 0.21, cz + vz + lz], lm.steelMat);
    }
  }
  // Waiting Sofa & Coffee Table along side wall
  box(staticG, [2.1, 0.42, 0.72], [cx + 0.4, fy + 0.21, cz - 3.35], cushionMat);
  box(staticG, [2.1, 0.46, 0.16], [cx + 0.4, fy + 0.62, cz - 3.65], cushionMat);
  box(staticG, [1.1, 0.42, 0.55], [cx + 0.4, fy + 0.21, cz - 2.35], lm.teakWood);

  // 4) Tall Wooden Bookshelf & Steel Almirah packed with colorful books & registers
  box(staticG, [0.56, 2.15, 2.2], [cx - 2.95, fy + 1.075, cz - 1.7], lm.teakWood);
  const bookCols = [lm.flowerRed, lm.awningBlue, lm.emeraldMat, lm.flowerGold, lm.terracottaTile];
  for (let shelf = 0; shelf < 4; shelf++) {
    const sy = fy + 0.35 + shelf * 0.46;
    for (let bi = 0; bi < 7; bi++) {
      box(staticG, [0.24, 0.30, 0.22], [cx - 2.72, sy, cz - 2.45 + bi * 0.25], bookCols[(shelf + bi) % bookCols.length]);
    }
  }
  box(staticG, [0.58, 2.15, 1.8], [cx - 2.95, fy + 1.075, cz + 1.8], lm.steelMat);
  // Water Dispenser + Corner Potted Plant
  box(staticG, [0.36, 0.92, 0.36], [cx - 2.85, fy + 0.46, cz + 3.25], lm.chalkLine);
  cylinder(staticG, 0.14, 0.14, 0.42, [cx - 2.85, fy + 1.12, cz + 3.25], lm.awningBlue, 10);
  cylinder(staticG, 0.18, 0.14, 0.36, [cx + 2.45, fy + 0.18, cz + 3.25], lm.terracottaTile, 8);
  box(staticG, [0.55, 0.72, 0.55], [cx + 2.45, fy + 0.66, cz + 3.25], lm.emeraldMat);

  // 5) Ceiling Fan + Split AC + Tube Lights + Wall Clock + Notice Board
  addCeilingFan(staticG, lm, cx - 0.1, fy + 3.25, cz);
  box(staticG, [0.24, 0.32, 1.05], [180.32, fy + 2.72, cz], acMat);
  addWallClock(staticG, dynamicG, lm, 180.26, fy + 2.45, cz - 2.2, Math.PI * 0.5);
  box(dynamicG, [1.5, 0.07, 0.12], [cx - 0.2, fy + 3.24, cz - 1.8], lm.bulbGlow, { castShadow: false });
  box(dynamicG, [1.5, 0.07, 0.12], [cx - 0.2, fy + 3.24, cz + 1.8], lm.bulbGlow, { castShadow: false });
  addSignBoard(
    dynamicG,
    { title: 'নোটিশ বোর্ড · খুলনা আলিয়া মাদ্রাসা', subtitle: 'অফিস সময়: সকাল ৮:৩০ – বিকাল ৪:০০', bg: '#0f3d2e', fg: '#ffffff', accent: '#fde047' },
    [cx - 0.2, fy + 1.75, cz + 3.86],
    Math.PI,
    2.1,
    0.85
  );
  if (labelTitle) {
    addSignBoard(
      dynamicG,
      { title: labelTitle, subtitle: 'KHULNA ALIA MADRASAH', bg: '#064e3b', fg: '#ffffff', accent: '#fde047' },
      [187.48, fy + 2.55, cz],
      Math.PI * 0.5,
      1.85,
      0.52
    );
  }
}

function addAliaClassroomFurniture(staticG, dynamicG, lm, cx, cz, fy, roomName) {
  const classDado = new THREE.MeshStandardMaterial({ color: 0x4b748f, roughness: 0.80 });
  const notebookMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.90 });

  // 1) Painted Classroom Lower Dado Wall Band (Sky-Slate Blue) + Raised Wooden Teacher Podium
  box(staticG, [0.06, 1.12, 7.8], [180.22, fy + 0.56, cz], classDado);
  box(staticG, [6.8, 1.12, 0.06], [cx - 0.1, fy + 0.56, cz - 3.95], classDado);
  box(staticG, [6.8, 1.12, 0.06], [cx - 0.1, fy + 0.56, cz + 3.95], classDado);
  box(staticG, [1.55, 0.16, 4.4], [cx - 2.35, fy + 0.08, cz], lm.warmOchre);

  // 2) Large Framed Green Chalkboard with Real Lesson Text + Chalk Tray + Chalk & Duster
  box(staticG, [0.12, 1.45, 3.65], [180.28, fy + 1.62, cz], lm.teakWood);
  addSignBoard(
    dynamicG,
    {
      title: 'বিসমিল্লাহির রাহমানির রাহিম · আল-কুরআন ও হাদিস',
      subtitle: 'খুলনা আলিয়া কামিল মাদ্রাসা · আজকের পাঠ ও তারিখ',
      bg: '#134e3a',
      fg: '#f8fafc',
      accent: '#fde68a',
      border: '#784421',
    },
    [180.36, fy + 1.62, cz],
    Math.PI * 0.5,
    3.45,
    1.28
  );
  box(staticG, [0.18, 0.07, 3.55], [180.38, fy + 0.92, cz], lm.teakWood);
  box(staticG, [0.06, 0.04, 0.18], [180.42, fy + 0.98, cz - 0.6], lm.warmOchre); // Wooden duster
  box(staticG, [0.03, 0.03, 0.12], [180.42, fy + 0.97, cz + 0.4], lm.chalkLine); // Chalk piece

  // 3) Teacher's Desk + Chair + Attendance Register Book + Water Bottle
  box(staticG, [0.78, 0.80, 1.42], [cx - 1.95, fy + 0.56, cz], lm.teakWood);
  box(staticG, [0.34, 0.04, 0.44], [cx - 1.92, fy + 0.98, cz - 0.15], notebookMat);
  cylinder(staticG, 0.04, 0.04, 0.22, [cx - 1.85, fy + 1.07, cz + 0.42], lm.awningBlue, 8);
  box(staticG, [0.46, 0.46, 0.46], [cx - 2.55, fy + 0.39, cz], lm.steelMat);
  box(staticG, [0.08, 0.48, 0.46], [cx - 2.76, fy + 0.72, cz], lm.steelMat);

  // 4) 3 Rows x 2 Columns of Detailed Bangladeshi High-Desk & Low-Bench Sets with Open Notebooks & Books!
  const bookCols = [lm.awningBlue, lm.flowerRed, lm.emeraldMat, lm.flowerGold];
  for (let row = 0; row < 3; row++) {
    const rx = cx - 0.55 + row * 1.18;
    for (let ci = 0; ci < 2; ci++) {
      const colZ = ci === 0 ? (cz - 1.62) : (cz + 1.62);
      // High wooden writing desk + side legs + under-desk book shelf
      box(staticG, [0.46, 0.05, 2.25], [rx, fy + 0.74, colZ], lm.teakWood);
      box(staticG, [0.38, 0.04, 2.15], [rx, fy + 0.54, colZ], lm.warmOchre);
      for (const lz of [-1.02, 1.02]) {
        box(staticG, [0.44, 0.74, 0.06], [rx, fy + 0.37, colZ + lz], lm.teakWood);
      }
      // Low wooden sitting bench + legs
      box(staticG, [0.34, 0.05, 2.25], [rx + 0.46, fy + 0.44, colZ], lm.warmOchre);
      for (const lz of [-1.02, 1.02]) {
        box(staticG, [0.32, 0.44, 0.06], [rx + 0.46, fy + 0.22, colZ + lz], lm.teakWood);
      }
      // Open student notebooks & colorful textbooks scattered on the desks!
      box(staticG, [0.22, 0.025, 0.30], [rx, fy + 0.78, colZ - 0.55], notebookMat);
      box(staticG, [0.20, 0.035, 0.26], [rx, fy + 0.785, colZ + 0.48], bookCols[(row + ci) % bookCols.length]);
    }
  }

  // 5) 2 Ceiling Fans + 2 LED Tube Lights + Wall Clock + Class Routine Board + Dustbin
  addCeilingFan(staticG, lm, cx - 0.2, fy + 3.25, cz - 1.65);
  addCeilingFan(staticG, lm, cx - 0.2, fy + 3.25, cz + 1.65);
  box(dynamicG, [2.1, 0.06, 0.12], [cx + 0.2, fy + 3.24, cz - 2.6], lm.bulbGlow, { castShadow: false });
  box(dynamicG, [2.1, 0.06, 0.12], [cx + 0.2, fy + 3.24, cz + 2.6], lm.bulbGlow, { castShadow: false });
  addWallClock(staticG, dynamicG, lm, 180.26, fy + 2.62, cz + 2.65, Math.PI * 0.5);
  cylinder(staticG, 0.16, 0.13, 0.36, [cx + 2.55, fy + 0.18, cz - 3.35], lm.steelMat, 8);
  addSignBoard(
    dynamicG,
    { title: 'ক্লাস রুটিন ও সময়সূচী', subtitle: 'সকাল ৯:০০ – দুপুর ২:৩০ · আলিয়া মাদ্রাসা', bg: '#1e3a8a', fg: '#ffffff', accent: '#fde047' },
    [cx + 0.4, fy + 1.75, cz - 3.86],
    0,
    1.85,
    0.78
  );
  addSignBoard(
    dynamicG,
    { title: roomName, subtitle: '২য় তলা · CLASSROOM', bg: '#1e3a8a', fg: '#ffffff', accent: '#fde047' },
    [187.48, fy + 2.55, cz],
    Math.PI * 0.5,
    1.85,
    0.52
  );
}

function buildAliaMadrasahCampus(staticG, dynamicG, lm, m) {
  // Real-photo Khulna Alia Kamil Madrasah Campus (খুলনা আলিয়া কামিল মাদ্রাসা)
  // Spawn is at (216, 108) looking West toward the Main Walkable Building (185, 108) & Big Front Buildings!
  const lightGrassMat = new THREE.MeshStandardMaterial({ color: 0x6ea84f, roughness: 0.94, metalness: 0.01 });
  const softTuftMat = new THREE.MeshStandardMaterial({ color: 0x5c9640, roughness: 0.92, metalness: 0.01 });

  // 1) Concrete Entrance Driveway + Real 3D Grass Field Model (grass_field.glb) on BOTH Right (North) & Left (South) sides!
  box(staticG, [36.0, 0.07, 5.6], [208.5, 0.025, 108.0], lm.stonePlinth, { castShadow: false, uvScale: 2.8 });
  box(staticG, [34.0, 0.22, 0.36], [208.5, 0.11, 105.0], lm.darkConcrete);
  box(staticG, [34.0, 0.22, 0.36], [208.5, 0.11, 111.0], lm.darkConcrete);
  addRedGreenFenceSpan(staticG, lm, 195.0, 105.0, 222.0, 105.0, 14);
  addRedGreenFenceSpan(staticG, lm, 195.0, 111.0, 222.0, 111.0, 14);

  // Dark natural soil base matching grass_field.glb Material.001 (removes the old flat green painted layer!)
  const soilBedMat = new THREE.MeshStandardMaterial({ color: 0x261d14, roughness: 0.99, metalness: 0.0 });
  box(staticG, [32.0, 0.04, 22.8], [208.0, 0.012, 93.2], soilBedMat, { castShadow: false });
  box(staticG, [32.0, 0.04, 22.8], [208.0, 0.012, 122.8], soilBedMat, { castShadow: false });

  // Load real 3D Grass Field Clumps (extracted from user's grass_field.glb) & cover BOTH fields densely!
  const grassLoader = new GLTFLoader();
  grassLoader.load('./assets/alia_grass_clumps.glb', (gltf) => {
    const clumpTemplates = [];
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      const geom = child.geometry.clone();
      geom.computeBoundingBox();
      const bb = geom.boundingBox;
      if (bb) {
        const cx = (bb.min.x + bb.max.x) * 0.5;
        const cz = (bb.min.z + bb.max.z) * 0.5;
        geom.translate(-cx, -bb.min.y, -cz);
      }
      const srcMat = Array.isArray(child.material) ? child.material[0] : child.material;
      const mat = new THREE.MeshStandardMaterial({
        color: srcMat?.color ? srcMat.color.clone() : new THREE.Color(0x3f7d24),
        roughness: 0.92,
        metalness: 0.0,
        side: THREE.DoubleSide,
      });
      clumpTemplates.push({ geom, mat });
    });
    if (!clumpTemplates.length) return;

    let seed = 195201;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const fieldRects = [
      { x0: 192.4, x1: 223.6, z0: 82.0, z1: 104.4 },  // Right-hand (North) grass field
      { x0: 192.4, x1: 223.6, z0: 111.6, z1: 134.0 }, // Left-hand (South) grass field
    ];
    const perClumpCount = 1350; // 3 clumps x 1,350 = 4,050 dense real 3D grass clumps in just 3 GPU draw calls!
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();

    for (let ci = 0; ci < clumpTemplates.length; ci++) {
      const { geom, mat } = clumpTemplates[ci];
      const inst = new THREE.InstancedMesh(geom, mat, perClumpCount);
      inst.castShadow = false;
      inst.receiveShadow = true;
      for (let i = 0; i < perClumpCount; i++) {
        const rect = fieldRects[i % 2];
        const gx = rect.x0 + rand() * (rect.x1 - rect.x0);
        const gz = rect.z0 + rand() * (rect.z1 - rect.z0);
        if (gx > 200.2 && gx < 204.2 && gz > 102.0 && gz < 104.5) {
          dummy.position.set(gx + 6.5, 0.025, gz - 4.0);
        } else {
          dummy.position.set(gx, 0.025, gz);
        }
        dummy.rotation.set((rand() - 0.5) * 0.14, rand() * Math.PI * 2, (rand() - 0.5) * 0.14);
        const sx = 0.13 + rand() * 0.085;
        const sy = 0.055 + rand() * 0.048;
        const sz = 0.13 + rand() * 0.085;
        dummy.scale.set(sx, sy, sz);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
        col.setHSL(0.26 + (rand() - 0.5) * 0.05, 0.54 + rand() * 0.18, 0.30 + rand() * 0.15);
        inst.setColorAt(i, col);
      }
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      dynamicG.add(inst);
    }
  }, undefined, (err) => {
    console.warn('Alia Madrasah grass_field GLB load warning:', err);
  });

  // Tall Coconut Palms flanking the main building entrance just like the real photo
  addCoconutPalm(staticG, lm, 196.5, 101.2, 11.2, 0.8, -0.5);
  addCoconutPalm(staticG, lm, 204.5, 101.0, 10.4, 0.5, 0.4);
  addCoconutPalm(staticG, lm, 196.0, 115.0, 11.8, 0.7, 0.6);
  addCoconutPalm(staticG, lm, 205.5, 116.0, 9.8, -0.4, 0.5);

  // 2) WALKABLE 3-STORY MAIN ADMINISTRATIVE & CLASSROOM BUILDING (x = 180..190, z = 88..128)
  // Ground Floor (y = 0.45m): Left (South) = Office Rooms, Right (North) = Teachers Room & Office, Center = S-Shaped Stairs!
  // 2nd Floor (y = 3.85m): S-Stairs land into East Hallway leading Left & Right to 4 Furnished Classrooms!
  const mainX = 185.0;
  const mainZ = 108.0;
  const y0 = 0.45;
  const y1 = 3.85;
  const y2 = 7.25;
  const yRoof = 10.55;

  // Ground Plinth + Entry Ramp (x = 189.8..192.4, z = 105.4..110.6)
  box(staticG, [10.4, y0, 40.4], [mainX, y0 * 0.5, mainZ], lm.stonePlinth);
  box(staticG, [2.6, 0.22, 5.2], [191.1, 0.14, mainZ], lm.stonePlinth);
  // 2nd Floor Slab (with stairwell cutout at x = 180.4..187.2, z = 105.4..110.6 so you can walk straight up the S-stairs!)
  box(staticG, [10.2, 0.26, 17.4], [mainX, y1 - 0.13, 96.7], lm.colonialCream);
  box(staticG, [10.2, 0.26, 17.4], [mainX, y1 - 0.13, 119.3], lm.colonialCream);
  box(staticG, [3.0, 0.26, 5.6], [188.6, y1 - 0.13, mainZ], lm.colonialCream);
  // 3rd Floor Slab & Terracotta Roof Cornice
  box(staticG, [10.4, 0.28, 40.2], [mainX, y2 - 0.14, mainZ], lm.colonialCream);
  box(staticG, [10.6, 3.2, 40.0], [mainX, y2 + 1.6, mainZ], lm.colonialCream);
  box(staticG, [11.0, 0.55, 40.8], [mainX, yRoof, mainZ], lm.terracottaTile);

  // Outer Perimeter Walls (West back wall, North & South end walls) across Ground & 2nd Floor
  box(staticG, [0.36, y2 - y0, 40.2], [180.0, (y0 + y2) * 0.5, mainZ], lm.colonialCream);
  box(staticG, [10.2, y2 - y0, 0.36], [mainX, (y0 + y2) * 0.5, 88.0], lm.colonialCream);
  box(staticG, [10.2, y2 - y0, 0.36], [mainX, (y0 + y2) * 0.5, 128.0], lm.colonialCream);

  // East Front Arched Colonnade + 2nd-Floor Veranda Railings (WIDE OPEN main doorway at z = 105.4..110.6!)
  for (let wz = -17.0; wz <= 17.0; wz += 3.4) {
    if (Math.abs(wz) < 3.0) continue;
    box(staticG, [0.38, y2 - y0, 0.42], [189.85, (y0 + y2) * 0.5, mainZ + wz], lm.colonialCream);
    box(staticG, [0.22, 0.92, 3.2], [189.85, y1 + 0.46, mainZ + wz], lm.whitePlaster);
  }

  // Interior Hallway Partition Walls (at x = 187.3, separating East corridor from Rooms on BOTH floors, with open doors!)
  for (const fy of [y0, y1]) {
    const wallH = 3.25;
    const midY = fy + wallH * 0.5;
    // South wing rooms (z = 111.0..127.8) — open doors at z = 114.2..116.2 and z = 122.2..124.2
    box(staticG, [0.24, wallH, 3.2], [187.3, midY, 112.6], lm.whitePlaster);
    box(staticG, [0.24, wallH, 6.0], [187.3, midY, 119.2], lm.whitePlaster);
    box(staticG, [0.24, wallH, 3.6], [187.3, midY, 126.0], lm.whitePlaster);
    // North wing rooms (z = 88.2..105.0) — open doors at z = 91.8..93.8 and z = 99.8..101.8
    box(staticG, [0.24, wallH, 3.6], [187.3, midY, 90.0], lm.whitePlaster);
    box(staticG, [0.24, wallH, 6.0], [187.3, midY, 96.8], lm.whitePlaster);
    box(staticG, [0.24, wallH, 3.2], [187.3, midY, 103.4], lm.whitePlaster);
    // Room divider walls between front & back rooms in each wing
    box(staticG, [7.2, wallH, 0.24], [183.7, midY, 111.0], lm.whitePlaster);
    box(staticG, [7.2, wallH, 0.24], [183.7, midY, 119.4], lm.whitePlaster);
    box(staticG, [7.2, wallH, 0.24], [183.7, midY, 105.0], lm.whitePlaster);
    box(staticG, [7.2, wallH, 0.24], [183.7, midY, 96.6], lm.whitePlaster);
  }

  // GRAND S-SHAPED (SWITCHBACK) MARBLE STAIRCASE straight ahead from the main entrance (x = 180.4..187.2, z = 105.4..110.6)!
  const stepsPerFlight = 10;
  for (let i = 0; i < stepsPerFlight; i++) {
    const t = (i + 0.5) / stepsPerFlight;
    const sx = THREE.MathUtils.lerp(187.2, 182.2, t);
    const sy = THREE.MathUtils.lerp(y0, 2.15, (i + 1) / stepsPerFlight);
    box(staticG, [0.54, sy - y0, 2.25], [sx, y0 + (sy - y0) * 0.5, 109.3], lm.stonePlinth);
  }
  box(staticG, [2.0, 0.24, 5.4], [181.25, 2.04, mainZ], lm.stonePlinth);
  for (let i = 0; i < stepsPerFlight; i++) {
    const t = (i + 0.5) / stepsPerFlight;
    const sx = THREE.MathUtils.lerp(182.2, 187.2, t);
    const sy = THREE.MathUtils.lerp(2.15, y1, (i + 1) / stepsPerFlight);
    box(staticG, [0.54, 0.24, 2.25], [sx, sy - 0.12, 106.7], lm.stonePlinth);
  }
  rodBetween(staticG, [187.2, y0 + 0.95, 108.05], [182.2, 2.15 + 0.95, 108.05], 0.045, lm.steelMat);
  rodBetween(staticG, [182.2, 2.15 + 0.95, 107.95], [187.2, y1 + 0.95, 107.95], 0.045, lm.steelMat);

  // Ground Floor Furnished Rooms: Left (South) = Office Rooms, Right (North) = Teachers' Room & Office
  addAliaOfficeFurniture(staticG, dynamicG, lm, 183.8, 115.2, y0, 'অধ্যক্ষের কার্যালয় (PRINCIPAL OFFICE)');
  addAliaOfficeFurniture(staticG, dynamicG, lm, 183.8, 123.6, y0, 'একাডেমিক অফিস রুম (OFFICE ROOM)');
  addAliaOfficeFurniture(staticG, dynamicG, lm, 183.8, 100.8, y0, 'শিক্ষক মিলনায়তন (TEACHERS ROOM)');
  addAliaOfficeFurniture(staticG, dynamicG, lm, 183.8, 92.4, y0, 'হিসাব ও রেজিস্ট্রার অফিস');

  // 2nd Floor Furnished Classrooms on BOTH Left (South) & Right (North) Wings off the Hallway!
  addAliaClassroomFurniture(staticG, dynamicG, lm, 183.8, 115.2, y1, 'শ্রেণিকক্ষ ১০১ (CLASSROOM 101)');
  addAliaClassroomFurniture(staticG, dynamicG, lm, 183.8, 123.6, y1, 'শ্রেণিকক্ষ ১০২ (CLASSROOM 102)');
  addAliaClassroomFurniture(staticG, dynamicG, lm, 183.8, 100.8, y1, 'শ্রেণিকক্ষ ২০১ (CLASSROOM 201)');
  addAliaClassroomFurniture(staticG, dynamicG, lm, 183.8, 92.4, y1, 'শ্রেণিকক্ষ ২০২ (CLASSROOM 202)');

  // Iconic 3-Story Semicircular Cylindrical Central Portico Tower (OPEN at ground level so you walk straight in!)
  const portX = 190.4;
  cylinder(staticG, 4.45, 4.55, 0.34, [portX, 0.17, mainZ], lm.stonePlinth, 24);
  for (const ang of [-1.10, -0.58, 0.58, 1.10]) {
    cylinder(
      staticG,
      0.24,
      0.28,
      3.55,
      [portX + Math.cos(ang) * 4.15, 1.98, mainZ + Math.sin(ang) * 4.15],
      lm.colonialCream,
      10
    );
  }
  cylinder(staticG, 4.68, 4.68, 1.15, [portX, 3.95, mainZ], lm.warmOchre, 24);
  cylinder(staticG, 4.38, 4.38, 2.35, [portX, 5.55, mainZ], lm.emeraldDark, 24);
  cylinder(staticG, 4.72, 4.72, 1.25, [portX, 7.25, mainZ], lm.colonialCream, 24);
  cylinder(staticG, 4.38, 4.38, 2.20, [portX, 8.85, mainZ], lm.emeraldDark, 24);
  cylinder(staticG, 4.78, 4.78, 1.65, [portX, 10.75, mainZ], lm.colonialCream, 24);
  cylinder(staticG, 4.88, 4.88, 0.28, [portX, 11.65, mainZ], lm.terracottaTile, 24);
  for (const ang of [-0.95, -0.35, 0.35, 0.95]) {
    cylinder(staticG, 0.14, 0.15, 2.35, [portX + Math.cos(ang) * 4.54, 5.55, mainZ + Math.sin(ang) * 4.54], lm.whitePlaster, 8);
    cylinder(staticG, 0.14, 0.15, 2.25, [portX + Math.cos(ang) * 4.54, 8.85, mainZ + Math.sin(ang) * 4.54], lm.whitePlaster, 8);
  }

  addSignBoard(
    dynamicG,
    {
      title: 'খুলনা আলিয়া কামিল মাদ্রাসা',
      subtitle: 'KHULNA ALIA KAMIL MADRASAH · স্থাপিত: ১৯৫২',
      bg: '#c8a57a',
      fg: '#2b1b12',
      accent: '#7c2d12',
      border: '#7c2d12',
    },
    [portX + 4.74, 3.98, mainZ],
    Math.PI * 0.5,
    5.4,
    1.12
  );
  addSignBoard(
    dynamicG,
    {
      title: 'খুলনা আলিয়া কামিল মাদ্রাসা',
      subtitle: 'KHULNA ALIA MADRASAH · MAIN ACADEMIC BHABAN',
      bg: '#efe3cd',
      fg: '#1e293b',
      accent: '#0f5132',
      border: '#b94a38',
    },
    [portX + 4.78, 7.25, mainZ],
    Math.PI * 0.5,
    5.6,
    1.15
  );

  // 3) BIG 6-STORY WHITE & TERRACOTTA-RED MODERN ACADEMIC BUILDING RIGHT IN FRONT (North Courtyard Side, z = 76!)
  const b6x = 204.0;
  const b6z = 76.0;
  const b6H = 19.2;
  box(staticG, [32.0, 0.5, 10.2], [b6x, 0.25, b6z], lm.terracottaTile);
  box(staticG, [31.2, b6H, 9.4], [b6x, b6H * 0.5 + 0.4, b6z], lm.whitePlaster);
  box(staticG, [32.2, 0.72, 10.2], [b6x, b6H + 0.6, b6z], lm.terracottaTile);
  for (let fl = 0; fl < 6; fl++) {
    const fy = 0.55 + fl * 3.1;
    box(staticG, [31.8, 0.26, 9.9], [b6x, fy + 2.95, b6z], lm.terracottaTile);
    box(staticG, [31.4, 0.92, 0.22], [b6x, fy + 0.55, b6z + 4.82], lm.whitePlaster);
    for (let bx = -13.5; bx <= 13.5; bx += 3.0) {
      box(staticG, [2.25, 1.95, 0.35], [b6x + bx, fy + 1.85, b6z + 4.62], lm.cavityMat);
    }
  }
  for (let cx = -15.0; cx <= 15.0; cx += 3.0) {
    box(staticG, [0.34, b6H + 0.4, 0.42], [b6x + cx, b6H * 0.5 + 0.4, b6z + 4.82], lm.terracottaTile);
  }
  addSignBoard(
    dynamicG,
    {
      title: 'খুলনা আলিয়া কামিল মাদ্রাসা',
      subtitle: 'নতুন ৬-তলা একাডেমিক ভবন · KHULNA ALIA',
      bg: '#065f46',
      fg: '#ffffff',
      accent: '#fde047',
    },
    [b6x, 8.2, b6z + 5.06],
    0,
    5.2,
    1.35
  );

  // 4) BIG 4-STORY CREAM & TEAL-GREEN ARCHED ACADEMIC BUILDING RIGHT IN FRONT (South Courtyard Side, z = 138!)
  const b4x = 204.0;
  const b4z = 138.0;
  const b4H = 13.0;
  box(staticG, [32.0, 0.45, 9.2], [b4x, 0.225, b4z], lm.stonePlinth);
  box(staticG, [31.2, b4H, 8.4], [b4x, b4H * 0.5 + 0.35, b4z], lm.colonialCream);
  box(staticG, [32.0, 0.48, 9.0], [b4x, b4H + 0.55, b4z], lm.terracottaTile);
  box(staticG, [4.6, 3.2, 5.2], [b4x - 12.8, b4H + 2.1, b4z], lm.colonialCream);
  for (let fl = 0; fl < 4; fl++) {
    const fy = 0.45 + fl * 3.12;
    box(staticG, [31.6, 0.24, 8.8], [b4x, fy + 2.95, b4z], lm.terracottaTile);
    for (let bx = -13.0; bx <= 13.0; bx += 3.25) {
      box(staticG, [2.35, 2.05, 0.38], [b4x + bx, fy + 1.65, b4z - 4.12], lm.emeraldDark);
      box(staticG, [2.55, 0.72, 0.20], [b4x + bx, fy + 0.48, b4z - 4.25], lm.colonialCream);
    }
  }
  box(staticG, [7.2, 0.24, 1.8], [b4x - 10.5, 3.25, b4z - 4.9], lm.terracottaTile);

  // 5) Stone Foundation Plaque & Red Ixora (রঙ্গন) Flower Bushes in Front Courtyard
  box(staticG, [2.4, 1.05, 1.2], [202.0, 0.52, 103.0], lm.stonePlinth);
  addSignBoard(
    dynamicG,
    { title: 'খুলনা আলিয়া মাদ্রাসা', subtitle: 'স্থাপিত: ১৯৫২ · খুলনা', bg: '#e5e7eb', fg: '#111827', accent: '#b94a38', border: '#475569' },
    [202.0, 1.08, 103.65],
    0,
    2.1,
    0.72
  );
  for (const [fx, fz] of [[200.5, 103.2], [203.5, 103.2], [198.0, 104.0], [208.0, 104.0], [198.0, 112.0], [208.0, 112.0]]) {
    box(staticG, [0.9, 0.55, 0.9], [fx, 0.28, fz], lm.moss);
    box(staticG, [0.55, 0.35, 0.55], [fx, 0.62, fz], lm.flowerRed);
  }

  // 6) Courtyard Benches & Lamps
  for (const [bx, bz, ry] of [
    [203.0, 103.5, 0],
    [214.0, 103.5, 0],
    [203.0, 112.5, Math.PI],
    [214.0, 112.5, Math.PI],
  ]) {
    addParkBench(staticG, lm, bx, bz, ry);
  }
  for (const [lx, lz] of [
    [196.0, 104.4],
    [212.0, 104.4],
    [196.0, 111.6],
    [212.0, 111.6],
  ]) {
    addParkLamp(staticG, dynamicG, lm, lx, lz, 4.0, 0.02);
  }
}

function buildCircuitHouseAndStadium(staticG, dynamicG, lm, m) {
  // 1) Khulna District Stadium (sx = -60, sz = -740)
  const sx = -60.0;
  const sz = -740.0;

  // Chalk markings for inner football / athletic field
  for (const cx of [-24.0, 24.0]) {
    box(staticG, [0.38, 0.025, 82.0], [sx + cx, 0.015, sz], lm.chalkLine, { castShadow: false });
  }
  for (const cz of [-41.0, 0.0, 41.0]) {
    box(staticG, [48.4, 0.025, 0.38], [sx, 0.015, sz + cz], lm.chalkLine, { castShadow: false });
  }
  const centerCircle = new THREE.Mesh(new THREE.RingGeometry(8.6, 9.0, 28), lm.chalkLine);
  centerCircle.rotation.x = -Math.PI / 2;
  centerCircle.position.set(sx, 0.02, sz);
  centerCircle.receiveShadow = true;
  staticG.add(centerCircle);

  // Multi-tier Stadium Gallery Bowl with Facade Buttress Ribs, Arched Spans & Emerald Parapets
  const segs = 28;
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    // Leave clean SE grand portal gap around a ~ 0.85..1.10 rad facing Boro Maath!
    if (a > 0.72 && a < 1.18) continue;
    const rx = 74.0;
    const rz = 86.0;
    const yaw = -a;
    // Outer Stadium Facade Base & Terracotta Band
    rotBox(staticG, [3.2, 10.6, 16.0], [sx + Math.cos(a) * (rx + 5.2), 5.3, sz + Math.sin(a) * (rz + 5.2)], lm.galleryMat, yaw);
    rotBox(staticG, [3.6, 0.75, 16.2], [sx + Math.cos(a) * (rx + 5.2), 10.8, sz + Math.sin(a) * (rz + 5.2)], lm.stadiumRoof, yaw);
    rotBox(staticG, [3.5, 0.55, 16.2], [sx + Math.cos(a) * (rx + 5.2), 5.2, sz + Math.sin(a) * (rz + 5.2)], lm.terracottaTile, yaw);
    // Exterior Structural Buttress Ribs on outer stadium facade
    rotBox(staticG, [1.4, 11.2, 0.95], [sx + Math.cos(a) * (rx + 6.9), 5.6, sz + Math.sin(a) * (rz + 6.9)], lm.colonialCream, yaw);

    // 3 Stepped Inner Spectator Seating Tiers facing pitch
    rotBox(staticG, [4.0, 2.2, 15.4], [sx + Math.cos(a) * (rx - 4.4), 1.1, sz + Math.sin(a) * (rz - 4.4)], lm.concrete, yaw);
    rotBox(staticG, [4.2, 4.8, 15.6], [sx + Math.cos(a) * (rx - 0.5), 2.4, sz + Math.sin(a) * (rz - 0.5)], lm.terracottaTile, yaw);
    rotBox(staticG, [4.2, 7.4, 15.8], [sx + Math.cos(a) * (rx + 2.8), 3.7, sz + Math.sin(a) * (rz + 2.8)], lm.galleryMat, yaw);

    // West VIP Pavilion Cantilever Roof + Glazed Press Box
    if (Math.cos(a) < -0.35) {
      rotBox(staticG, [16.5, 0.62, 16.4], [sx + Math.cos(a) * (rx - 0.5), 12.2, sz + Math.sin(a) * (rz - 0.5)], lm.stadiumRoof, yaw);
      if (Math.cos(a) < -0.82) {
        rotBox(staticG, [6.5, 3.6, 14.0], [sx + Math.cos(a) * (rx + 3.0), 14.0, sz + Math.sin(a) * (rz + 3.0)], lm.whitePlaster, yaw);
        rotBox(staticG, [0.18, 2.0, 12.2], [sx + Math.cos(a) * (rx - 0.2), 14.0, sz + Math.sin(a) * (rz - 0.2)], lm.glass, yaw);
      }
    }
  }

  // South-East Stadium Grand Portal Archway facing Boro Maath (around sx + 48, sz + 64)
  const gateAng = 0.95;
  const gx = sx + Math.cos(gateAng) * 76.0;
  const gz = sz + Math.sin(gateAng) * 88.0;
  const gYaw = -gateAng;
  for (const offset of [-6.4, 6.4]) {
    rotBox(
      staticG,
      [3.8, 12.2, 3.2],
      [gx - Math.sin(gYaw) * offset, 6.1, gz + Math.cos(gYaw) * offset],
      lm.colonialCream,
      gYaw
    );
  }
  rotBox(staticG, [4.2, 2.4, 16.6], [gx, 11.4, gz], lm.stadiumRoof, gYaw);
  addSignBoard(
    dynamicG,
    { title: 'খুলনা জেলা স্টেডিয়াম', subtitle: 'KHULNA DISTRICT STADIUM · GATE NO. 1', bg: '#0f766e', accent: '#fef08a' },
    [gx + Math.cos(gateAng) * 2.25, 11.4, gz + Math.sin(gateAng) * 2.25],
    gYaw + Math.PI * 0.5,
    7.4,
    1.65
  );

  // 4 Iconic Stadium Floodlight Towers
  for (const [fx, fz] of [
    [sx - 66, sz - 72],
    [sx + 66, sz - 72],
    [sx - 66, sz + 72],
    [sx + 66, sz + 72],
  ]) {
    cylinder(staticG, 0.55, 1.05, 34.0, [fx, 17.0, fz], lm.steelMat, 8);
    const dx = sx - fx;
    const dz = sz - fz;
    const yaw = Math.atan2(dx, dz);
    rotBox(staticG, [7.5, 4.2, 0.8], [fx, 34.5, fz], lm.steelMat, yaw);
    rotBox(dynamicG, [6.8, 3.4, 0.9], [fx, 34.5, fz], lm.floodGlow, yaw);
  }

  // 2) Circuit House 1 & 2 Heritage Colonial Pavilions on East side of Boro Maath (102, -662 & 110, -708)
  for (const [cx, cz] of [
    [102, -662],
    [110, -708],
  ]) {
    box(staticG, [35.4, 0.52, 22.0], [cx, 0.26, cz], lm.stonePlinth);
    box(staticG, [34, 8.2, 20], [cx, 4.35, cz], lm.colonialCream);
    box(staticG, [36.5, 1.2, 22.5], [cx, 8.95, cz], lm.terracottaTile);
    // Projecting West Heritage Portico facing Boro Maath (cx - 17)
    box(staticG, [6.0, 5.2, 10.5], [cx - 18.5, 2.8, cz], lm.colonialCream);
    box(staticG, [6.8, 0.65, 11.4], [cx - 18.5, 5.6, cz], lm.terracottaTile);
    box(staticG, [14.0, 0.14, 16.0], [cx - 21.0, 0.03, cz], m.brick, { castShadow: false, uvScale: 2.6 });
    // Arched dark-cavity colonial window bays on West & South facades
    for (const wz of [-6.5, -3.2, 3.2, 6.5]) {
      box(staticG, [0.14, 2.2, 1.4], [cx - 17.02, 2.5, cz + wz], lm.cavityMat);
      box(staticG, [0.18, 2.0, 1.2], [cx - 17.08, 2.5, cz + wz], lm.glass);
      box(staticG, [0.14, 2.0, 1.4], [cx - 17.02, 6.4, cz + wz], lm.cavityMat);
      box(staticG, [0.18, 1.8, 1.2], [cx - 17.08, 6.4, cz + wz], lm.glass);
    }
    for (let px = -14; px <= 14; px += 4.6) {
      cylinder(staticG, 0.32, 0.36, 7.8, [cx + px, 4.15, cz + 10.2], lm.colonialCream, 8);
      cylinder(staticG, 0.32, 0.36, 7.8, [cx + px, 4.15, cz - 10.2], lm.colonialCream, 8);
    }
    addParkLamp(staticG, dynamicG, lm, cx - 22.0, cz - 7.0, 4.2);
    addParkLamp(staticG, dynamicG, lm, cx - 22.0, cz + 7.0, 4.2);
  }

  // 3) Khulna Boro Maath Foreground Civic Park Edge, Arch Gate & Turf Cricket Strip (visible from spawn 40, -540)
  // Paved South Entry Esplanade & Low Ornamental Boundary Wall (z = -532)
  box(staticG, [62.0, 0.06, 8.5], [40.0, 0.015, -536.0], m.brick, { castShadow: false, uvScale: 2.8 });
  box(staticG, [10.0, 0.06, 52.0], [40.0, 0.014, -562.0], m.brick, { castShadow: false, uvScale: 2.8 });
  for (const [wx0, wx1] of [[-12, 33], [47, 92]]) {
    const wlen = wx1 - wx0;
    const wmid = (wx0 + wx1) * 0.5;
    box(staticG, [wlen, 0.72, 0.36], [wmid, 0.36, -531.5], m.brick);
    box(staticG, [wlen + 0.2, 0.14, 0.46], [wmid, 0.78, -531.5], lm.colonialCream);
    addRailingSpan(staticG, lm, wx0, -531.5, wx1, -531.5, 8, 0.62, 0.85);
  }
  for (const gx of [33.5, 46.5]) {
    box(staticG, [1.2, 3.8, 1.2], [gx, 1.9, -531.5], lm.colonialCream);
    box(staticG, [1.5, 0.32, 1.5], [gx, 3.9, -531.5], lm.terracottaTile);
    addParkLamp(staticG, dynamicG, lm, gx + (gx < 40 ? -2.2 : 2.2), -533.8, 4.4);
  }
  for (const [bx, bz] of [[24.0, -535.0], [56.0, -535.0], [32.0, -565.0], [48.0, -565.0]]) {
    addParkBench(staticG, lm, bx, bz, bz < -550 ? Math.PI * 0.5 : 0);
  }

  // Central Boro Maath Turf Cricket Square + Sight-Screen (x = 38, z = -618..-658)
  box(staticG, [3.6, 0.04, 22.0], [38.0, 0.018, -618.0], lm.warmOchre, { castShadow: false, uvScale: 2.2 });
  box(staticG, [3.4, 0.045, 0.14], [38.0, 0.022, -608.0], lm.chalkLine, { castShadow: false });
  box(staticG, [3.4, 0.045, 0.14], [38.0, 0.022, -628.0], lm.chalkLine, { castShadow: false });
  // Stumps
  for (const szEnd of [-607.5, -628.5]) {
    for (const sxOff of [-0.14, 0, 0.14]) {
      cylinder(staticG, 0.022, 0.024, 0.72, [38.0 + sxOff, 0.36, szEnd], lm.teakWood, 6);
    }
  }
  // Classic White Cricket Sight-Screen at North End of Boro Maath + Emerald Paddock Boards
  box(staticG, [8.5, 4.2, 0.35], [38.0, 2.3, -658.0], lm.whitePlaster);
  box(staticG, [8.8, 0.35, 0.85], [38.0, 0.25, -658.0], lm.steelMat);
  for (const bx of [16, 26, 50, 60]) {
    box(staticG, [8.0, 0.92, 0.32], [bx, 0.46, -658.0], lm.emeraldMat);
  }

  // Boro Maath Signboard on West Side of Spawn Walkway
  box(staticG, [8.2, 0.35, 1.4], [25.0, 0.175, -530.0], m.brick);
  for (const dPos of [-2.8, 2.8]) {
    cylinder(staticG, 0.10, 0.12, 4.0, [25.0 + dPos, 2.0, -530.0], lm.steelMat, 8);
  }
  addSignBoard(
    dynamicG,
    { title: 'খুলনা বড় মাঠ · সার্কিট হাউস ও জেলা স্টেডিয়াম', subtitle: 'KHULNA CIRCUIT HOUSE GROUND & STADIUM · UPPER JESSORE RD', bg: '#0f3d2e', accent: '#bef264' },
    [25.0, 4.6, -530.0],
    0,
    7.6,
    1.8
  );

  // 4) SHAHEED HADIS PARK & REAL 3D SHAHEED MINAR (Complete Park Grounds + Flower Gardens + 3 Approach Paths + Elevated 6-Step Shaheed Minar + Main & Back Black Gates with Black Locks & Open Pocket Gates)
  const blackGateMat = new THREE.MeshStandardMaterial({ color: 0x101216, roughness: 0.38, metalness: 0.78 });
  const blackLockMat = new THREE.MeshStandardMaterial({ color: 0x060709, roughness: 0.28, metalness: 0.90 });
  const flowerPink = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.80 });
  const flowerWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.82 });
  const flowerOrange = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.80 });
  const parkGrass = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.92 });
  const parkGrassLight = new THREE.MeshStandardMaterial({ color: 0x3b8c3e, roughness: 0.92 });

  // Helper: Big Black Iron Park Gate (Closed Double-Leaf with Heavy Black Padlock + Open Pedestrian Pocket Gate!)
  // Oriented along X-axis by default (rotY = 0 faces +Z / -Z)
  const addHadisBlackParkGate = (gx, gz, rotY, titleText, subText) => {
    const gg = new THREE.Group();
    gg.position.set(gx, 0.25, gz);
    gg.rotation.y = rotY;
    staticG.add(gg);

    // Tall Black Iron & White-Capped Gate Pillars: Left (-2.8), Center (+2.8), Pocket Right (+4.6)
    for (const px of [-2.85, 2.85, 4.65]) {
      box(gg, [0.82, 4.2, 0.82], [px, 2.1, 0], blackGateMat);
      box(gg, [0.96, 0.24, 0.96], [px, 4.28, 0], lm.colonialCream);
      const lampGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), lm.bulbGlow);
      lampGlobe.position.set(px, 4.62, 0);
      dynamicG.add(lampGlobe);
      lampGlobe.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
      lampGlobe.position.add(new THREE.Vector3(gx, 0.25, gz));
    }
    // Grand Black Overhead Arch Beam + Signboard
    box(gg, [8.6, 0.46, 0.46], [0.90, 4.15, 0], blackGateMat);
    addSignBoard(
      dynamicG,
      { title: titleText, subtitle: subText, bg: '#0f172a', fg: '#ffffff', accent: '#facc15', border: '#475569' },
      [
        gx + Math.cos(rotY) * 0.90,
        5.05,
        gz - Math.sin(rotY) * 0.90,
      ],
      rotY,
      7.4,
      1.25
    );

    // Closed Big Black Double-Leaf Main Gate (x = -2.42..+2.42, height 3.05m)
    box(gg, [4.86, 1.05, 0.12], [0, 0.56, 0], blackGateMat);
    box(gg, [4.86, 0.12, 0.12], [0, 3.02, 0], blackGateMat);
    box(gg, [4.86, 0.10, 0.12], [0, 2.02, 0], blackGateMat);
    box(gg, [0.14, 3.05, 0.14], [0, 1.54, 0], blackGateMat); // Center meeting stile
    for (let bx = -2.25; bx <= 2.28; bx += 0.24) {
      box(gg, [0.055, 2.95, 0.055], [bx, 1.54, 0], blackGateMat);
    }
    // Chunky Black Iron Chain + Heavy Black Padlock (কালো তালা) right in the center of the Main Gate!
    box(gg, [0.52, 0.12, 0.22], [0, 1.48, 0], blackLockMat); // Black steel chain/bar
    box(gg, [0.28, 0.34, 0.22], [0, 1.24, 0.12], blackLockMat); // Heavy Black Padlock Body (front)
    box(gg, [0.28, 0.34, 0.22], [0, 1.24, -0.12], blackLockMat); // Back side visibility
    box(gg, [0.18, 0.16, 0.08], [0, 1.46, 0.12], blackLockMat); // Padlock shackle arch

    // OPEN Pedestrian Pocket Gate (x = +3.0..+4.5, swung OPEN 95° inward so player walks straight in!)
    const pLeaf = new THREE.Group();
    pLeaf.position.set(3.05, 0, 0);
    pLeaf.rotation.y = Math.PI * 0.54;
    box(pLeaf, [1.45, 0.92, 0.09], [0.72, 0.50, 0], blackGateMat);
    box(pLeaf, [1.45, 0.09, 0.09], [0.72, 2.55, 0], blackGateMat);
    for (let px = 0.14; px <= 1.38; px += 0.22) {
      box(pLeaf, [0.045, 2.45, 0.045], [px, 1.30, 0], blackGateMat);
    }
    gg.add(pLeaf);
  };

  // Helper: Vibrant Multi-Color Park Flower Garden Bed (ফুল বাগান)
  const addFlowerGarden = (fx, fz, w, d, yBase = 0.26) => {
    box(staticG, [w + 0.42, 0.30, d + 0.42], [fx, yBase + 0.15, fz], m.brick);
    box(staticG, [w, 0.36, d], [fx, yBase + 0.18, fz], parkGrassLight);
    const fMats = [lm.flowerRed, lm.flowerGold, flowerPink, flowerWhite, flowerOrange];
    let fi = 0;
    for (let gx = -w * 0.40; gx <= w * 0.41; gx += 0.92) {
      for (let gz = -d * 0.38; gz <= d * 0.39; gz += 0.92) {
        box(staticG, [0.48, 0.26, 0.48], [fx + gx, yBase + 0.44, fz + gz], lm.moss);
        box(staticG, [0.34, 0.24, 0.34], [fx + gx, yBase + 0.64, fz + gz], fMats[(fi++) % fMats.length]);
      }
    }
  };

  // A) FULL SHAHEED HADIS PARK SURROUNDING GREEN LAWNS & PROMENADE DECKS (Cleanly Above Lake Water at y = 0.26m!)
  // South Park Lawn & Grand Entrance Forecourt (x = -376..-270, z = -858..-838)
  box(staticG, [106.0, 0.88, 22.0], [-323.0, -0.18, -848.0], lm.darkConcrete, { castShadow: false });
  box(staticG, [104.0, 0.08, 20.0], [-323.0, 0.26, -848.0], parkGrass, { castShadow: false, uvScale: 4.0 });
  // East Park Lawn & Garden Strip (x = -298..-270, z = -958..-856)
  box(staticG, [28.0, 0.88, 102.0], [-284.0, -0.18, -907.0], lm.darkConcrete, { castShadow: false });
  box(staticG, [26.0, 0.08, 100.0], [-284.0, 0.26, -907.0], parkGrass, { castShadow: false, uvScale: 4.0 });
  // West Park Lawn & Garden Strip (x = -376..-354, z = -958..-856)
  box(staticG, [22.0, 0.88, 102.0], [-365.0, -0.18, -907.0], lm.darkConcrete, { castShadow: false });
  box(staticG, [20.0, 0.08, 100.0], [-365.0, 0.26, -907.0], parkGrass, { castShadow: false, uvScale: 4.0 });
  // North Park Lawn & Back Gate Plaza (x = -376..-270, z = -960..-934)
  box(staticG, [106.0, 0.88, 26.0], [-323.0, -0.18, -947.0], lm.darkConcrete, { castShadow: false });
  box(staticG, [104.0, 0.08, 24.0], [-323.0, 0.26, -947.0], parkGrass, { castShadow: false, uvScale: 4.0 });

  // Black Iron Perimeter Park Fence & Brick Plinth around ALL 4 sides (leaving openings at Main Gate & Back Gate!)
  const addParkFence = (x0, z0, x1, z1) => {
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    const mx = (x0 + x1) * 0.5;
    const mz = (z0 + z1) * 0.5;
    rotBox(staticG, [0.36, 0.72, len], [mx, 0.62, mz], m.brick, yaw);
    addRailingSpan(staticG, lm, x0, z0, x1, z1, Math.max(4, Math.floor(len / 3.5)), 1.35, 0.98);
  };
  // South boundary fence (gap at Main Gate x = -298..-290)
  addParkFence(-375.0, -840.0, -298.2, -840.0);
  addParkFence(-290.0, -840.0, -271.0, -840.0);
  // North boundary fence (gap at Back Gate x = -335..-327)
  addParkFence(-375.0, -958.0, -335.2, -958.0);
  addParkFence(-327.0, -958.0, -271.0, -958.0);
  // East & West perimeter fences
  addParkFence(-271.0, -840.0, -271.0, -958.0);
  addParkFence(-375.0, -840.0, -375.0, -958.0);

  // B) 2 BIG BLACK PARK GATES (MAIN GATE at South z = -840, BACK GATE at North z = -958)
  // Both have BLACK LOCKS on the main leaves + OPEN PEDESTRIAN POCKET GATES right beside them!
  addHadisBlackParkGate(-295.0, -840.0, 0, 'শহীদ হাদিস পার্ক · প্রধান গেট', 'SHAHEED HADIS PARK · MAIN GATE (POCKET GATE OPEN)');
  addHadisBlackParkGate(-332.0, -958.0, Math.PI, 'শহীদ হাদিস পার্ক · পিছনের গেট', 'SHAHEED HADIS PARK · BACK GATE (POCKET GATE OPEN)');

  // C) 3 WIDE PAVED PARK WALKWAYS TO SHAHEED MINAR (Multi-sided Access + Scenic Lake Bridge!)
  // Paved Main Entrance Plaza inside Main Gate + Brick Ring Walkways
  box(staticG, [16.0, 0.06, 18.0], [-295.0, 0.31, -849.0], m.brick, { castShadow: false, uvScale: 2.2 });
  // Path 1: Main Diagonal Scenic Lake Causeway Bridge from Main Gate (-297,-856 -> -322,-904)
  const buildParkWalkway = (x0, z0, x1, z1, width = 5.4, withRail = true) => {
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz) + 2.4;
    const yaw = Math.atan2(dx, dz);
    const mx = (x0 + x1) * 0.5;
    const mz = (z0 + z1) * 0.5;
    rotBox(staticG, [width + 0.8, 0.92, len], [mx, -0.15, mz], lm.darkConcrete, yaw, { castShadow: false });
    rotBox(staticG, [width, 0.08, len], [mx, 0.32, mz], m.brick, yaw, { castShadow: false, uvScale: 2.2 });
    if (withRail) {
      for (const side of [-(width * 0.5 + 0.12), width * 0.5 + 0.12]) {
        const ox = Math.cos(yaw) * side;
        const oz = -Math.sin(yaw) * side;
        addRailingSpan(staticG, lm, x0 + ox, z0 + oz, x1 + ox, z1 + oz, Math.max(4, Math.floor(len / 4.5)), 0.88, 0.32);
      }
    }
    addParkLamp(staticG, dynamicG, lm, mx + Math.cos(yaw) * (width * 0.45), mz - Math.sin(yaw) * (width * 0.45), 3.8, 0.32);
  };
  buildParkWalkway(-297.0, -856.0, -322.0, -904.0, 5.6, true);  // Path 1: South-East Causeway Bridge across Lake
  buildParkWalkway(-286.0, -856.0, -286.0, -916.0, 4.4, false); // Path 2a: East Garden Promenade
  buildParkWalkway(-286.0, -916.0, -310.0, -916.0, 4.8, true);  // Path 2b: East Bridge straight into Shaheed Minar
  buildParkWalkway(-362.0, -856.0, -362.0, -916.0, 4.4, false); // Path 3a: West Garden Promenade
  buildParkWalkway(-362.0, -916.0, -342.0, -916.0, 4.8, true);  // Path 3b: West Bridge straight into Shaheed Minar
  buildParkWalkway(-326.0, -930.0, -332.0, -956.0, 5.0, false); // Path 4: North Walkway straight to Back Black Gate!

  // D) LUSH PARK FLOWER GARDENS (ফুল বাগান), BENCHES, LAMPS & PALMS ALL AROUND HADIS PARK!
  addFlowerGarden(-280.0, -848.0, 9.5, 6.2, 0.26);
  addFlowerGarden(-314.0, -848.0, 12.0, 6.2, 0.26);
  addFlowerGarden(-342.0, -848.0, 12.0, 6.2, 0.26);
  addFlowerGarden(-278.5, -878.0, 6.5, 11.0, 0.26);
  addFlowerGarden(-278.5, -900.0, 6.5, 11.0, 0.26);
  addFlowerGarden(-278.5, -934.0, 6.5, 11.0, 0.26);
  addFlowerGarden(-369.5, -880.0, 5.8, 12.0, 0.26);
  addFlowerGarden(-369.5, -934.0, 5.8, 12.0, 0.26);
  addFlowerGarden(-306.0, -947.0, 13.0, 6.4, 0.26);
  addFlowerGarden(-352.0, -947.0, 13.0, 6.4, 0.26);

  // Shade Palms & Park Benches & Heritage Lamps
  for (const [px, pz] of [[-276, -844], [-305, -844], [-355, -844], [-276, -890], [-276, -948], [-370, -896], [-370, -948]]) {
    addCoconutPalm(staticG, lm, px, pz, 10.5, 0.4, 0.2);
  }
  for (const [bx, bz, ry] of [
    [-289.5, -846.0, Math.PI * 0.5], [-301.5, -846.0, -Math.PI * 0.5],
    [-283.5, -884.0, -Math.PI * 0.5], [-283.5, -906.0, -Math.PI * 0.5],
    [-359.0, -886.0, Math.PI * 0.5], [-321.0, -945.0, Math.PI],
  ]) {
    addParkBench(staticG, lm, bx, bz, ry);
  }
  for (const [lx, lz] of [
    [-290.5, -844.5], [-299.5, -844.5], [-284.0, -868.0], [-284.0, -916.0],
    [-360.0, -868.0], [-360.0, -916.0], [-327.0, -953.0], [-336.0, -953.0],
  ]) {
    addParkLamp(staticG, dynamicG, lm, lx, lz, 4.1, 0.26);
  }

  // E) ELEVATED SHAHEED MINAR CEREMONIAL ISLAND PLAZA (y = 0.55m above water) + 6 WALKABLE STAIRS (y = 0.55 -> 1.63m) + REAL 3D MODEL!
  const minarX = -326.0;
  const minarZ = -916.0;
  // Solid Elevated Concrete & Stone Island Plaza cleanly ABOVE the lake water (top = 0.55m)
  box(staticG, [34.0, 1.30, 28.0], [minarX, -0.10, minarZ], lm.darkConcrete, { castShadow: false });
  box(staticG, [32.6, 0.08, 26.6], [minarX, 0.55, minarZ], lm.stonePlinth, { castShadow: false, uvScale: 2.8 });
  // 4 Corner Flowerbeds framing the Shaheed Minar Monument
  addFlowerGarden(minarX - 13.0, minarZ - 8.5, 4.2, 5.2, 0.55);
  addFlowerGarden(minarX + 13.0, minarZ - 8.5, 4.2, 5.2, 0.55);
  addFlowerGarden(minarX - 13.0, minarZ + 8.5, 4.2, 5.2, 0.55);
  addFlowerGarden(minarX + 13.0, minarZ + 8.5, 4.2, 5.2, 0.55);

  // 6 Wide Walkable Ceremonial Stairs climbing from y = 0.55m up to Elevated Podium y = 1.63m!
  const stepCount = 6;
  const basePlazaY = 0.55;
  const stepRise = 0.18;
  const podiumTopY = basePlazaY + stepCount * stepRise; // 1.63m
  for (let s = 0; s < stepCount; s++) {
    const sy = basePlazaY + (s + 0.5) * stepRise;
    const shrink = s * 0.96;
    const sw = 21.0 - shrink;
    const sd = 15.6 - shrink;
    box(staticG, [sw, stepRise + 0.02, sd], [minarX, sy, minarZ - 0.6], s % 2 === 0 ? lm.colonialCream : m.brick);
  }
  // White Marble Top Podium Platform (top at y = 1.66m)
  box(staticG, [15.4, 0.06, 10.0], [minarX, podiumTopY + 0.02, minarZ - 0.6], lm.whitePlaster);

  // Load User's Real 3D Shaheed Minar Model (shaheed_minar_red_sun.glb) right onto the elevated 6-step podium!
  const minarLoader = new GLTFLoader();
  minarLoader.load('./assets/shaheed_minar_red_sun.glb', (gltf) => {
    const model = gltf.scene;
    model.rotation.y = 0.22; // Face slightly SE directly toward the Main Gate & Causeway!
    model.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    const maxDim = Math.max(size.y, size.x, size.z, 0.001);
    const scale = 14.5 / maxDim;
    model.scale.setScalar(scale);

    model.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(model);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);
    model.position.set(
      minarX - scaledCenter.x,
      podiumTopY + 0.05 - scaledBox.min.y,
      (minarZ - 1.2) - scaledCenter.z
    );

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;
      }
    });
    dynamicG.add(model);
  }, undefined, (err) => {
    console.warn('Shaheed Minar GLB load warning:', err);
  });

  addParkLamp(staticG, dynamicG, lm, minarX - 12.2, minarZ + 11.4, 4.2, 0.55);
  addParkLamp(staticG, dynamicG, lm, minarX + 12.2, minarZ + 11.4, 4.2, 0.55);
  addParkLamp(staticG, dynamicG, lm, minarX - 12.2, minarZ - 11.4, 4.2, 0.55);
  addParkLamp(staticG, dynamicG, lm, minarX + 12.2, minarZ - 11.4, 4.2, 0.55);
}

function addPtiShopfront(staticG, dynamicG, lm, { cx, cz, len, yaw, wallMat, awningMat, title, subtitle, signBg }) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = yaw;
  // Sidewalk plinth + ground-floor shop frontage cladding & shutter bays (facing +Z locally)
  box(g, [len + 1.8, 0.14, 3.2], [0, 0.07, 1.8], lm.brick, { uvScale: 2.2 });
  box(g, [len, 3.2, 1.4], [0, 1.65, -0.2], wallMat, { uvScale: 2.8 });
  const bays = Math.max(2, Math.floor(len / 3.4));
  const spacing = len / bays;
  for (let i = 0; i < bays; i++) {
    const bx = -len * 0.5 + spacing * (i + 0.5);
    box(g, [spacing * 0.78, 2.35, 0.16], [bx, 1.25, 0.55], lm.shutterMat);
    box(g, [0.22, 3.0, 0.3], [bx - spacing * 0.45, 1.5, 0.56], lm.colonialCream);
  }
  box(g, [len + 0.4, 0.22, 2.4], [0, 3.02, 1.3], awningMat, { uvScale: 2.4 });
  box(g, [len + 0.3, 0.92, 0.16], [0, 3.55, 0.62], lm.cavityMat);
  addSignBoard(g, { title, subtitle, bg: signBg, accent: '#fde047' }, [0, 3.55, 0.74], 0, Math.min(len * 0.82, 5.4), 0.96);
  staticG.add(g);
}

function buildPtiMoreAndTaltolaLane(staticG, dynamicG, lm, m) {
  // 1) PTI More Roundabout Island & Twin-Pylon Steel Highway Directional Gantry (-304.3, -56.7)
  const islandX = -304.3;
  const islandZ = -56.7;
  cylinder(staticG, 5.6, 6.0, 0.32, [islandX, 0.16, islandZ], m.brick, 24);
  cylinder(staticG, 4.9, 5.2, 0.40, [islandX, 0.24, islandZ], lm.stonePlinth, 24);
  cylinder(staticG, 4.2, 4.4, 0.52, [islandX, 0.30, islandZ], lm.moss, 20);
  // Tiered Flowering Shrubs inside Traffic Island
  for (let b = 0; b < 12; b++) {
    const ba = (b / 12) * Math.PI * 2;
    cylinder(staticG, 0.06, 0.07, 0.92, [islandX + Math.cos(ba) * 5.1, 0.68, islandZ + Math.sin(ba) * 5.1], lm.steelMat, 6);
    if (b % 2 === 0) {
      box(
        staticG,
        [0.65, 0.42, 0.65],
        [islandX + Math.cos(ba) * 2.5, 0.72, islandZ + Math.sin(ba) * 2.5],
        b % 4 === 0 ? lm.flowerRed : lm.flowerGold
      );
    }
  }
  // Clean Twin-Pylon Overhead Highway Gantry
  const gantryYaw = Math.PI * 0.2;
  for (const offset of [-2.4, 2.4]) {
    cylinder(
      staticG,
      0.16,
      0.21,
      5.6,
      [islandX + Math.cos(gantryYaw) * offset, 2.8, islandZ - Math.sin(gantryYaw) * offset],
      lm.steelMat,
      10
    );
  }
  rotBox(staticG, [5.4, 0.22, 0.36], [islandX, 5.2, islandZ], lm.steelMat, gantryYaw);
  addSignBoard(
    dynamicG,
    { title: 'পিটিআই মোড় (PTI MORE) · N7', subtitle: '← Royal More / Taltola Ln  |  → Haji Mohsin Rd / Rupsha', bg: '#065f46', accent: '#ffffff' },
    [islandX, 6.18, islandZ],
    gantryYaw,
    6.4,
    1.65
  );

  // 2) Corner Commercial Arcades & Bengali Signboards along PTI More Sidewalks (outside carriageway!)
  addPtiShopfront(staticG, dynamicG, lm, {
    cx: -283.2,
    cz: -52.5,
    len: 12.2,
    yaw: -Math.PI * 0.5,
    wallMat: lm.warmOchre,
    awningMat: lm.awningGreen,
    title: 'পিটিআই মোড় ফার্মেসি এন্ড মেডিসিন',
    subtitle: '24 HR HEALTHCARE & GENERAL STORE',
    signBg: '#064e3b',
  });
  addPtiShopfront(staticG, dynamicG, lm, {
    cx: -282.8,
    cz: -63.0,
    len: 10.6,
    yaw: 0.0,
    wallMat: lm.colonialCream,
    awningMat: lm.awningBlue,
    title: 'খুলনা স্টেশনারি এন্ড প্রিন্টিং',
    subtitle: 'PTI MORE CORNER · AHSAN AHMED RD',
    signBg: '#1e3a8a',
  });
  addPtiShopfront(staticG, dynamicG, lm, {
    cx: -312.2,
    cz: -63.2,
    len: 10.6,
    yaw: 0.0,
    wallMat: lm.terracottaTile,
    awningMat: lm.awningGreen,
    title: 'ভাই-ভাই টি স্টল এন্ড কনফেকশনারি',
    subtitle: 'KHAN JAHAN ALI RD · ROYAL MORE LINK',
    signBg: '#7c2d12',
  });
  addPtiShopfront(staticG, dynamicG, lm, {
    cx: -315.4,
    cz: -34.2,
    len: 7.4,
    yaw: Math.PI * 0.5,
    wallMat: lm.whitePlaster,
    awningMat: lm.awningBlue,
    title: 'মিয়া পাড়া ইলেকট্রিক এন্ড হার্ডওয়্যার',
    subtitle: 'MIA PARA RD CORNER · PTI MORE',
    signBg: '#0f172a',
  });

  // 3) KMP Traffic Police Kiosk on NE Corner + Parked CNG Auto + Overhead Streetlamps & Wires
  box(staticG, [2.2, 0.25, 2.2], [-291.0, 0.125, -51.5], m.concrete);
  box(staticG, [1.96, 1.05, 1.96], [-291.0, 0.76, -51.5], lm.whitePlaster);
  box(staticG, [2.04, 0.22, 2.04], [-291.0, 1.18, -51.5], lm.awningBlue);
  box(staticG, [1.72, 1.15, 1.72], [-291.0, 1.88, -51.5], lm.glass);
  for (const sx of [-0.92, 0.92]) {
    for (const sz of [-0.92, 0.92]) {
      cylinder(staticG, 0.055, 0.065, 2.55, [-291.0 + sx, 1.38, -51.5 + sz], lm.steelMat, 6);
    }
  }
  box(staticG, [2.8, 0.16, 2.8], [-291.0, 2.68, -51.5], lm.awningBlue);
  box(staticG, [1.8, 0.35, 1.8], [-291.0, 2.90, -51.5], lm.whitePlaster);

  const ptiCng = buildCNGAuto({
    tire: lm.tireBlack,
    rim: lm.chromeMat,
    darkTrim: lm.steelMat,
    chrome: lm.chromeMat,
    windshield: lm.glass,
    headlight: lm.bulbGlow,
    taillight: lm.terracottaTile,
    amber: lm.flowerGold,
    cngGreen: lm.cngGreen,
    cngYellow: lm.cngYellow,
    cngRexine: lm.tireBlack,
  });
  ptiCng.position.set(-286.5, 0.06, -45.5);
  ptiCng.rotation.y = -2.35;
  staticG.add(ptiCng);

  const p1 = addUtilityPole(staticG, dynamicG, lm, -285.5, -59.5, -1);
  const p2 = addUtilityPole(staticG, dynamicG, lm, -286.5, -39.5, -1);
  const p3 = addUtilityPole(staticG, dynamicG, lm, -315.5, -59.5, 1);
  const p4 = addUtilityPole(staticG, dynamicG, lm, -315.5, -39.5, 1);
  for (const [a, b] of [[p1, p2], [p3, p4], [p1, p3], [p2, p4]]) {
    const mid = [(a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5 - 0.55, (a[2] + b[2]) * 0.5];
    rodBetween(staticG, a, mid, 0.015, lm.wire, 5);
    rodBetween(staticG, mid, b, 0.015, lm.wire, 5);
  }
}

function buildTaltolaLaneWard23(staticG, dynamicG, lm) {
  // St. Joseph's Cathedral Bell Tower Spire (-252, -135)
  box(staticG, [8.5, 16.0, 8.5], [-252, 8.0, -135], lm.whitePlaster);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(3.8, 9.5, 4), lm.brick);
  spire.rotation.y = Math.PI / 4;
  spire.position.set(-252, 20.5, -135);
  staticG.add(spire);

  // Ward 23 Taltola Lane & Shamsur Rahman Rd Corner Sign (-614, -379)
  addSignBoard(
    dynamicG,
    { title: 'তালতলা লেন · শামসুর রহমান রোড', subtitle: 'TALTOLA LN (WARD 23 · ROYAL MORE CORRIDOR)', bg: '#1e3a8a', accent: '#fde047' },
    [-614.0, 4.2, -379.0],
    0,
    5.4,
    1.45
  );
}

export function buildKhulnaLandmarks(parent, m) {
  const group = new THREE.Group();
  group.name = 'KhulnaCityLandmarks';
  parent.add(group);

  const lm = makeLandmarkMaterials(m);
  const slices = [];

  function makeSlice(name, cx, cz, maxDist) {
    const root = new THREE.Group();
    root.name = name;
    const staticG = new THREE.Group();
    const dynamicG = new THREE.Group();
    root.add(staticG, dynamicG);
    group.add(root);
    const slice = { name, cx, cz, maxDistSq: maxDist * maxDist, root, staticG, dynamicG };
    slices.push(slice);
    return slice;
  }

  // Keep only the top high-detail Khulna showcase landmarks (Alia Madrasah & Model Mosque, Circuit House, Stadium, Boro Maath, Shaheed Hadis Park, Royal More, PTI More)
  const circuitHadisSlice = makeSlice('KhulnaLandmark_CircuitHadis', -145, -720, 480);

  buildCircuitHouseAndStadium(circuitHadisSlice.staticG, circuitHadisSlice.dynamicG, lm, m);
  const aliaMadrasah = buildAliaMadrasahDistrict(group, m);
  const royalMore = buildRoyalMoreDistrict(group, m);
  const ptiMore = buildPtiMoreDistrict(group, m);

  for (const s of slices) {
    mergeStaticMeshes(s.staticG);
  }

  function syncVisibility(playerPos) {
    if (!playerPos) return;
    for (const s of slices) {
      const dx = playerPos.x - s.cx;
      const dz = playerPos.z - s.cz;
      const want = dx * dx + dz * dz <= s.maxDistSq;
      if (s.root.visible !== want) s.root.visible = want;
    }
    aliaMadrasah.syncVisibility(playerPos);
    royalMore.syncVisibility(playerPos);
    ptiMore.syncVisibility(playerPos);
  }

  return {
    group,
    aliaMadrasah,
    royalMore,
    ptiMore,
    syncVisibility,
    getGroundHeight(pos) {
      let hadisY = 0;
      // Walkable Shaheed Hadis Park Grounds (y=0.28m), Elevated Shaheed Minar Island (y=0.55m) & 6 Stairs up to Podium (y=1.63m)
      if (pos && pos.x >= -377 && pos.x <= -269 && pos.z >= -961 && pos.z <= -838) {
        const mx = -326.0;
        const mz = -916.0;
        if (Math.abs(pos.x - mx) <= 16.8 && Math.abs(pos.z - mz) <= 13.8) {
          hadisY = 0.55;
          const dx = Math.abs(pos.x - mx);
          const dz = Math.abs(pos.z - (mz - 0.6));
          for (let s = 0; s < 6; s++) {
            const hw = (21.0 - s * 0.96) * 0.5;
            const hd = (15.6 - s * 0.96) * 0.5;
            if (dx <= hw && dz <= hd) {
              hadisY = 0.55 + (s + 1) * 0.18;
            }
          }
        } else if (pos.x >= -354 && pos.x <= -298 && pos.z >= -902 && pos.z <= -856) {
          // Over lake center: stay dry on SE Causeway Bridge
          const t = THREE.MathUtils.clamp((pos.z - (-856)) / (-904 - (-856)), 0, 1);
          const brX = -297.0 + (-322.0 - -297.0) * t;
          if (Math.abs(pos.x - brX) <= 3.3) hadisY = 0.34;
        } else {
          hadisY = 0.30;
        }
      }
      return Math.max(
        hadisY,
        aliaMadrasah.getGroundHeight?.(pos) ?? 0,
        royalMore.getGroundHeight?.(pos) ?? 0,
        ptiMore.getGroundHeight?.(pos) ?? 0,
      );
    },
    applyCollisions(pos, radius, footY = 0) {
      // Solid closed Main Black Gate & Back Black Gate leaves at Shaheed Hadis Park (leaving BOTH pedestrian pocket gates 100% open & walkable!)
      if (pos && footY < 3.0 && pos.x >= -378 && pos.x <= -268 && pos.z >= -962 && pos.z <= -836) {
        const blockBox = (minX, maxX, minZ, maxZ) => {
          const cx = THREE.MathUtils.clamp(pos.x, minX, maxX);
          const cz = THREE.MathUtils.clamp(pos.z, minZ, maxZ);
          const dx = pos.x - cx;
          const dz = pos.z - cz;
          const dSq = dx * dx + dz * dz;
          if (dSq < radius * radius) {
            const d = Math.sqrt(Math.max(dSq, 1e-8));
            pos.x += (dx / d) * (radius - d);
            pos.z += (dz / d) * (radius - d);
          }
        };
        blockBox(-297.5, -292.5, -840.4, -839.6); // Main Gate locked double-leaf (Pocket Gate at -292.0..-290.4 stays OPEN!)
        blockBox(-334.5, -329.5, -958.4, -957.6); // Back Gate locked double-leaf (Pocket Gate at -336.6..-335.0 stays OPEN!)
      }
      aliaMadrasah.applyCollisions?.(pos, radius, footY);
      royalMore.applyCollisions?.(pos, radius, footY);
      ptiMore.applyCollisions?.(pos, radius, footY);
    },
    setNightFactor(nf) {
      aliaMadrasah.setNightFactor(nf);
      royalMore.setNightFactor(nf);
      ptiMore.setNightFactor(nf);
    },
    update(time, playerPos = null) {
      if (playerPos) syncVisibility(playerPos);
      aliaMadrasah.update(time, playerPos);
      royalMore.update(time, playerPos);
      ptiMore.update(time, playerPos);
    },
    setVisible(visible) {
      group.visible = visible;
    },
  };
}
