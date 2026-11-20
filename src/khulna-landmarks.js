import * as THREE from 'three';
import { box, cylinder, rodBetween, mergeStaticMeshes } from './scene-utils.js';
import { buildCNGAuto } from './khulna-vehicles.js';

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

function buildAliaMadrasahCampus(staticG, dynamicG, lm, m) {
  // Khulna Alia Kamil Madrasah & District Model Mosque (mx = 176, mz = 112)
  // Open campus lawn green[9] (x = 193..236, z = 82..135) & Central Pond (x = 194..235, z = 145..177)
  const mx = 176.0;
  const mz = 112.0;

  // 1) District Model Mosque Plinth, Entrance Portico, Arched Colonnade, Dome & Twin Minarets
  box(staticG, [17.8, 0.55, 15.8], [mx, 0.275, mz], lm.darkConcrete);
  box(staticG, [16.0, 8.8, 14.0], [mx, 4.9, mz], lm.whitePlaster);
  box(staticG, [16.8, 0.42, 14.8], [mx, 4.85, mz], lm.whitePlaster);
  box(staticG, [16.8, 0.72, 14.8], [mx, 9.5, mz], lm.emeraldMat);

  // Projecting Eastern Mosque Marble Portico & Wide Entry Steps facing Campus Forecourt (x = 184..188)
  box(staticG, [3.8, 0.48, 7.2], [mx + 9.4, 0.24, mz], lm.stonePlinth);
  box(staticG, [4.6, 0.24, 8.0], [mx + 9.8, 0.12, mz], lm.brick);
  box(staticG, [3.4, 0.42, 6.8], [mx + 9.4, 4.9, mz], lm.emeraldMat);
  for (const pz of [-2.8, 2.8]) {
    cylinder(staticG, 0.22, 0.26, 4.4, [mx + 10.6, 2.55, mz + pz], lm.whitePlaster, 10);
  }
  box(staticG, [0.18, 3.25, 3.6], [mx + 8.05, 2.1, mz], lm.cavityMat);
  box(staticG, [0.22, 2.35, 3.0], [mx + 8.10, 1.65, mz], lm.teakWood);
  box(staticG, [0.24, 0.72, 3.0], [mx + 8.10, 3.30, mz], lm.glass);
  for (const dz of [-1.58, 0, 1.58]) {
    box(staticG, [0.26, 3.25, 0.14], [mx + 8.12, 2.1, mz + dz], lm.goldMat);
  }

  for (const bx of [-5.2, -2.6, 0, 2.6, 5.2]) {
    for (const fz of [-7.04, 7.04]) {
      const sideSign = Math.sign(fz);
      box(staticG, [1.60, 2.66, 0.08], [mx + bx, 2.1, mz + fz - sideSign * 0.04], lm.cavityMat);
      box(staticG, [1.52, 2.54, 0.12], [mx + bx, 2.1, mz + fz + sideSign * 0.03], lm.glass);
      box(staticG, [1.60, 2.36, 0.08], [mx + bx, 6.7, mz + fz - sideSign * 0.04], lm.cavityMat);
      box(staticG, [1.52, 2.24, 0.12], [mx + bx, 6.7, mz + fz + sideSign * 0.03], lm.glass);
      box(staticG, [0.42, 8.6, 0.44], [mx + bx - 1.1, 4.8, mz + fz], lm.whitePlaster);
    }
  }
  for (const bz of [-4.2, 4.2]) {
    box(staticG, [0.08, 2.54, 1.66], [mx + 7.98, 2.1, mz + bz], lm.cavityMat);
    box(staticG, [0.12, 2.42, 1.56], [mx + 8.06, 2.1, mz + bz], lm.glass);
    box(staticG, [0.08, 2.24, 1.66], [mx + 7.98, 6.7, mz + bz], lm.cavityMat);
    box(staticG, [0.12, 2.12, 1.56], [mx + 8.06, 6.7, mz + bz], lm.glass);
  }

  // Octagonal Dome Drum + Dome + Twin 24m Minarets
  cylinder(staticG, 4.9, 5.1, 1.6, [mx, 10.6, mz], lm.whitePlaster, 8);
  cylinder(staticG, 4.6, 4.8, 0.45, [mx, 11.4, mz], lm.emeraldMat, 8);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(4.4, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.56), lm.whitePlaster);
  dome.position.set(mx, 11.4, mz);
  staticG.add(dome);
  cylinder(staticG, 0.10, 0.15, 2.2, [mx, 16.5, mz], lm.goldMat, 8);

  for (const sx of [-7.8, 7.8]) {
    cylinder(staticG, 1.15, 1.35, 0.8, [mx + sx, 0.4, mz - 6.8], lm.darkConcrete, 8);
    cylinder(staticG, 0.82, 1.02, 19.8, [mx + sx, 10.2, mz - 6.8], lm.whitePlaster, 12);
    for (const by of [9.6, 15.8, 19.6]) {
      cylinder(staticG, 1.18, 1.05, 0.55, [mx + sx, by, mz - 6.8], lm.emeraldMat, 12);
    }
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.95, 3.2, 12), lm.emeraldMat);
    spire.position.set(mx + sx, 21.4, mz - 6.8);
    staticG.add(spire);
    cylinder(staticG, 0.05, 0.08, 1.4, [mx + sx, 23.4, mz - 6.8], lm.goldMat, 8);
  }

  // 2) Travertine & Herringbone Brick Campus Forecourt Promenade (x = 186..234, z = 104..118, right under spawn)
  box(staticG, [46.0, 0.06, 9.6], [210.0, 0.015, 110.5], m.brick, { castShadow: false, uvScale: 2.6 });
  box(staticG, [44.0, 0.08, 5.2], [210.0, 0.025, 110.5], lm.stonePlinth, { castShadow: false, uvScale: 3.0 });
  // Cross Garden Walkway linking Mosque Forecourt South to the Central Pond Ghat (x = 208..216, z = 114..144)
  box(staticG, [7.6, 0.06, 30.0], [212.0, 0.018, 129.0], m.brick, { castShadow: false, uvScale: 2.6 });
  // Raised Floral Lawn Curbs flanking walkways
  for (const lz of [104.2, 116.8]) {
    box(staticG, [18.0, 0.22, 1.8], [198.0, 0.08, lz], lm.whitePlaster);
    box(staticG, [17.4, 0.28, 1.2], [198.0, 0.14, lz], lm.moss);
  }
  // North Madrasah Academic Verandah Wing on open north lawn (x = 198..226, z = 84)
  box(staticG, [24.0, 0.42, 7.6], [212.0, 0.21, 84.5], lm.stonePlinth);
  box(staticG, [22.4, 7.2, 6.2], [212.0, 3.85, 84.5], lm.colonialCream);
  box(staticG, [23.2, 0.55, 7.0], [212.0, 7.65, 84.5], lm.emeraldMat);
  for (let px = -9.0; px <= 9.0; px += 3.0) {
    cylinder(staticG, 0.18, 0.22, 6.8, [212.0 + px, 3.8, 88.2], lm.whitePlaster, 8);
    if (Math.abs(px) <= 6.5) {
      box(staticG, [1.5, 1.65, 0.12], [212.0 + px, 2.0, 87.62], lm.cavityMat);
      box(staticG, [1.4, 1.55, 0.14], [212.0 + px, 5.4, 87.62], lm.glass);
    }
  }

  // 3) Open-Air Wudu / Ablution Pavilion near SW pond corner (x = 197, z = 132)
  box(staticG, [7.2, 0.34, 4.4], [197.5, 0.17, 132.0], lm.stonePlinth);
  box(staticG, [7.6, 0.24, 4.8], [197.5, 3.25, 132.0], lm.emeraldMat);
  for (const wx of [-3.1, 0, 3.1]) {
    for (const wz of [-1.7, 1.7]) {
      cylinder(staticG, 0.11, 0.13, 3.0, [197.5 + wx, 1.7, 132.0 + wz], lm.whitePlaster, 8);
    }
  }
  box(staticG, [5.4, 0.65, 0.9], [197.5, 0.65, 132.0], lm.whitePlaster);

  // 4) Campus East Entry Gatehouse & Perimeter Fence Wall (x = 234, z = 88..134)
  for (const [z0, z1] of [[88, 105], [116, 134]]) {
    const len = z1 - z0;
    const mid = (z0 + z1) * 0.5;
    box(staticG, [0.35, 1.25, len], [234.0, 0.62, mid], m.brick);
    box(staticG, [0.46, 0.14, len], [234.0, 1.30, mid], lm.whitePlaster);
  }
  for (const gz of [105.5, 115.5]) {
    box(staticG, [0.85, 3.6, 0.85], [234.0, 1.8, gz], lm.whitePlaster);
    box(staticG, [0.98, 0.28, 0.98], [234.0, 3.65, gz], lm.emeraldMat);
  }
  box(staticG, [0.95, 0.85, 10.6], [234.0, 3.95, 110.5], lm.emeraldMat);

  // 5) Central Pond Promenade Quay Wall, Iron Railings, Ghat Steps, Benches & Courtyard Lamps
  box(staticG, [39.0, 0.48, 2.2], [213.5, 0.08, 143.6], lm.stonePlinth);
  addRailingSpan(staticG, lm, 195.0, 144.4, 208.0, 144.4, 4, 0.86, 0.25);
  addRailingSpan(staticG, lm, 216.0, 144.4, 232.0, 144.4, 4, 0.86, 0.25);
  for (let s = 0; s < 5; s++) {
    box(staticG, [6.4, 0.18, 1.1], [212.0, 0.12 - s * 0.16, 144.2 + s * 0.8], lm.concrete);
  }

  for (const [bx, bz, ry] of [
    [203.0, 105.2, 0],
    [221.0, 105.2, 0],
    [203.0, 142.2, Math.PI],
    [223.0, 142.2, Math.PI],
  ]) {
    addParkBench(staticG, lm, bx, bz, ry);
  }
  for (const [lx, lz] of [
    [194.0, 105.8],
    [226.0, 105.8],
    [194.0, 115.4],
    [226.0, 115.4],
    [207.5, 142.5],
    [216.5, 142.5],
  ]) {
    addParkLamp(staticG, dynamicG, lm, lx, lz, 3.9, 0.02);
  }

  // 6) Madrasah Signboard raised cleanly in flowerbed planter curb at NE path edge
  box(staticG, [4.6, 0.45, 1.4], [190.5, 0.22, 123.5], m.brick);
  for (const dPos of [-2.0, 2.0]) {
    const legAngle = Math.PI * 0.62;
    cylinder(
      staticG,
      0.08,
      0.10,
      3.8,
      [
        190.5 + Math.cos(legAngle) * dPos - Math.sin(legAngle) * 0.14,
        1.9,
        123.5 - Math.sin(legAngle) * dPos - Math.cos(legAngle) * 0.14,
      ],
      lm.steelMat,
      8
    );
  }
  addSignBoard(
    dynamicG,
    { title: 'খুলনা আলিয়া কামিল মাদ্রাসা ও মডেল মসজিদ', subtitle: 'KHULNA ALIA KAMIL MADRASAH · CENTRAL POND & GROUND', bg: '#064e3b', accent: '#fcd34d' },
    [190.5, 4.4, 123.5],
    Math.PI * 0.62,
    5.8,
    1.6
  );
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

  // 4) Shaheed Hadis Park Lakeside Promenade Pier, Over-Lake Causeway & Shaheed Minar Lake Island (-295,-860 -> -332,-910)
  // SE Lakeside Brick & Stone Viewing Pier built right under spawn (-295, -860) so Sabit stands cleanly over the lake!
  box(staticG, [26.0, 0.62, 24.0], [-294.0, -0.28, -856.0], lm.darkConcrete, { castShadow: false });
  box(staticG, [24.8, 0.06, 22.8], [-294.0, 0.025, -856.0], m.brick, { castShadow: false, uvScale: 2.4 });
  box(staticG, [20.0, 0.07, 18.0], [-294.0, 0.032, -856.0], lm.stonePlinth, { castShadow: false, uvScale: 3.0 });
  // Viewing Pier Perimeter Cast-Iron Railings (leaving NW Causeway Opening around x = -307..-300, z = -868)
  addRailingSpan(staticG, lm, -306.5, -844.5, -281.5, -844.5, 7, 0.86, 0.03);
  addRailingSpan(staticG, lm, -281.5, -844.5, -281.5, -867.5, 6, 0.86, 0.03);
  addRailingSpan(staticG, lm, -299.0, -867.5, -281.5, -867.5, 5, 0.86, 0.03);
  addRailingSpan(staticG, lm, -306.5, -844.5, -306.5, -862.5, 5, 0.86, 0.03);
  // Park Flowerbed Planters + Benches + Heritage Park Lamps on Viewing Terrace
  for (const [fx, fz] of [[-285.0, -848.0], [-302.5, -848.0]]) {
    box(staticG, [4.2, 0.36, 2.2], [fx, 0.18, fz], m.brick);
    box(staticG, [3.6, 0.44, 1.6], [fx, 0.24, fz], lm.moss);
    for (const dx of [-1.0, 0.0, 1.0]) {
      box(staticG, [0.42, 0.28, 0.42], [fx + dx, 0.56, fz], dx === 0 ? lm.flowerGold : lm.flowerRed);
    }
  }
  addParkBench(staticG, lm, -285.5, -863.5, Math.PI * 0.72);
  addParkBench(staticG, lm, -285.5, -854.0, Math.PI * 0.5);
  addParkLamp(staticG, dynamicG, lm, -283.0, -846.0, 4.1, 0.03);
  addParkLamp(staticG, dynamicG, lm, -283.0, -866.0, 4.1, 0.03);
  addParkLamp(staticG, dynamicG, lm, -305.0, -846.0, 4.1, 0.03);

  // Ceremonial Stone Causeway Bridge across Hadis Park Pond (-304,-866 -> -326,-898)
  const brDx = -326.0 - -304.0;
  const brDz = -898.0 - -866.0;
  const brLen = Math.hypot(brDx, brDz) + 3.0;
  const brYaw = Math.atan2(brDx, brDz);
  const brMx = (-304.0 + -326.0) * 0.5;
  const brMz = (-866.0 + -898.0) * 0.5;
  rotBox(staticG, [6.4, 0.65, brLen], [brMx, -0.27, brMz], lm.darkConcrete, brYaw, { castShadow: false });
  rotBox(staticG, [5.6, 0.06, brLen], [brMx, 0.04, brMz], m.brick, brYaw, { castShadow: false, uvScale: 2.4 });
  for (const side of [-2.9, 2.9]) {
    const ox = Math.cos(brYaw) * side;
    const oz = -Math.sin(brYaw) * side;
    addRailingSpan(staticG, lm, -304.0 + ox, -866.0 + oz, -326.0 + ox, -898.0 + oz, 9, 0.88, 0.04);
  }
  for (const f of [0.32, 0.68]) {
    addParkLamp(staticG, dynamicG, lm, -304.0 + brDx * f + 2.4, -866.0 + brDz * f - 1.5, 3.8, 0.04);
  }

  // Shaheed Minar Lake Island Plaza & Monument (minarX = -332, minarZ = -910)
  const minarX = -332.0;
  const minarZ = -910.0;
  box(staticG, [26.0, 0.72, 20.0], [minarX, -0.32, minarZ], lm.darkConcrete, { castShadow: false });
  box(staticG, [24.2, 0.08, 18.2], [minarX, 0.05, minarZ], lm.stonePlinth, { castShadow: false, uvScale: 2.8 });
  box(staticG, [17.0, 1.15, 11.0], [minarX, 0.62, minarZ], m.brick);
  box(staticG, [15.0, 0.52, 9.0], [minarX, 1.45, minarZ], lm.colonialCream);
  for (const [ox, h] of [[-4.2, 8.5], [-2.1, 11.0], [0, 14.5], [2.1, 11.0], [4.2, 8.5]]) {
    box(staticG, [0.95, h, 0.45], [minarX + ox, 1.7 + h * 0.5, minarZ - 1.5], lm.colonialCream);
  }
  const sunDisc = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.35, 24), lm.terracottaTile);
  sunDisc.rotation.x = Math.PI / 2;
  sunDisc.position.set(minarX, 7.85, minarZ - 2.3);
  staticG.add(sunDisc);
  addParkLamp(staticG, dynamicG, lm, minarX - 10.5, minarZ + 7.2, 4.0, 0.05);
  addParkLamp(staticG, dynamicG, lm, minarX + 10.5, minarZ + 7.2, 4.0, 0.05);

  // Hadis Park Viewing Pier Signboard
  addSignBoard(
    dynamicG,
    { title: 'শহীদ হাদিস পার্ক · খুলনা', subtitle: 'SHAHEED HADIS PARK & LAKE · K.D. GHOSH RD', bg: '#7f1d1d', accent: '#fde68a' },
    [-286.0, 3.8, -845.5],
    Math.PI * 0.25,
    5.4,
    1.45
  );
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

  const aliaSlice = makeSlice('KhulnaLandmark_Alia', 205, 130, 260);
  const circuitHadisSlice = makeSlice('KhulnaLandmark_CircuitHadis', -145, -720, 480);
  const ptiSlice = makeSlice('KhulnaLandmark_PTI', -304, -57, 250);
  const ward23Slice = makeSlice('KhulnaLandmark_Ward23', -440, -260, 320);

  buildAliaMadrasahCampus(aliaSlice.staticG, aliaSlice.dynamicG, lm, m);
  buildCircuitHouseAndStadium(circuitHadisSlice.staticG, circuitHadisSlice.dynamicG, lm, m);
  buildPtiMoreAndTaltolaLane(ptiSlice.staticG, ptiSlice.dynamicG, lm, m);
  buildTaltolaLaneWard23(ward23Slice.staticG, ward23Slice.dynamicG, lm);

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
  }

  return {
    group,
    syncVisibility,
    update(_time, playerPos = null) {
      if (playerPos) syncVisibility(playerPos);
    },
    setVisible(visible) {
      group.visible = visible;
    },
  };
}
