import * as THREE from 'three';
import { box, cylinder, rodBetween, mergeStaticMeshes } from './scene-utils.js';

function resolveCircleAABB(pos, radius, minX, maxX, minZ, maxZ) {
  const closestX = THREE.MathUtils.clamp(pos.x, minX, maxX);
  const closestZ = THREE.MathUtils.clamp(pos.z, minZ, maxZ);
  const dx = pos.x - closestX;
  const dz = pos.z - closestZ;
  const distSq = dx * dx + dz * dz;
  if (distSq < radius * radius) {
    if (distSq > 1e-8) {
      const dist = Math.sqrt(distSq);
      const overlap = radius - dist;
      pos.x += (dx / dist) * overlap;
      pos.z += (dz / dist) * overlap;
    } else {
      const leftPen = Math.abs(pos.x - minX);
      const rightPen = Math.abs(maxX - pos.x);
      const backPen = Math.abs(pos.z - minZ);
      const frontPen = Math.abs(maxZ - pos.z);
      const minPen = Math.min(leftPen, rightPen, backPen, frontPen);
      if (minPen === leftPen) pos.x = minX - radius;
      else if (minPen === rightPen) pos.x = maxX + radius;
      else if (minPen === backPen) pos.z = minZ - radius;
      else pos.z = maxZ + radius;
    }
  }
}

function makeSignTexture({ title, subtitle = '', bg = '#1e293b', fg = '#f8fafc', accent = '#facc15', border = '#52b788' }) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 160;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = border;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 144);
  ctx.fillStyle = accent;
  ctx.fillRect(18, 18, 10, 124);
  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 34px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText(title, 42, subtitle ? 60 : 80, 446);
  if (subtitle) {
    ctx.fillStyle = accent;
    ctx.font = '600 20px "Manrope", "Noto Sans Bengali", sans-serif';
    ctx.fillText(subtitle, 42, 114, 446);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeParkingFloorTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4b5055';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3200; i++) {
    const shade = 65 + Math.floor(Math.random() * 26);
    ctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 4})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
  }
  // Subtle concrete expansion grid
  ctx.strokeStyle = 'rgba(20,24,28,0.35)';
  ctx.lineWidth = 2;
  for (let p = 0; p < 512; p += 128) {
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(512, p); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 4);
  return tex;
}

function makeCheckeredRampTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  const palette = ['#e6dfd1', '#c76b3a', '#5c4b42', '#d8a35d', '#8e8a84', '#b8532a', '#dfd6c7'];
  const cols = 8;
  const rows = 8;
  const cw = 512 / cols;
  const ch = 512 / rows;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const idx = (r * 3 + col * 5 + (r % 2) * 2) % palette.length;
      ctx.fillStyle = palette[idx];
      ctx.fillRect(col * cw, r * ch, cw, ch);
      ctx.strokeStyle = 'rgba(40,32,26,0.38)';
      ctx.lineWidth = 3;
      ctx.strokeRect(col * cw + 1.5, r * ch + 1.5, cw - 3, ch - 3);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.4, 1.2);
  tex.anisotropy = 4;
  return tex;
}

function makeTerracottaTileWallTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#9b3d28';
  ctx.fillRect(0, 0, 512, 512);
  const rows = 16;
  const cols = 6;
  const rh = 512 / rows;
  const cw = 512 / cols;
  const shades = ['#9b3d28', '#a8442d', '#8c3522', '#b04b33', '#943a26'];
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cw * 0.5);
    for (let col = -1; col <= cols; col++) {
      ctx.fillStyle = shades[(r * 7 + col * 3 + 12) % shades.length];
      ctx.fillRect(col * cw + offset + 2, r * rh + 2, cw - 4, rh - 4);
    }
  }
  ctx.strokeStyle = 'rgba(232,224,216,0.28)';
  ctx.lineWidth = 2;
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * rh); ctx.lineTo(512, r * rh); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.2, 1.2);
  tex.anisotropy = 4;
  return tex;
}

/**
 * Builds the realistic, fully enterable 6-Story Apartment Building at the North Head of Altapole Lane
 * (29 Upper Jessore Rd, West side directly opposite Ispahani Sales Center):
 *  - Footprint: x = 152.1 .. 162.7 (10.6m), z = -516.4 .. -502.0 (14.4m)
 *  - Ground Floor (y = 0.08m): Wide open empty car parking garage + [E]/[G] Double-Leaf Main Car Gate (North)
 *    + [E] Pedestrian Lobby Door (East, facing Altapole Lane) + Elevator Lobby + Staircase
 *  - Floors 1..5 (y = 3.72, 6.82, 9.92, 13.02, 16.12m): Fully furnished enterable residential flats
 *    (Living Room with Sofa & 4K Smart TV, Master Bedroom with King Bed & Wardrobe, Dining & Modular Kitchen,
 *    Attached Bathroom with Western Commode/Basin/Shower, Ceiling Fans, and [E]-Openable Thai Sliding Windows!)
 *  - Rooftop (y = 19.22m): Open terrace, parapet wall, lift/stair mumty room & Gazi overhead water tank
 */
export function buildAltapoleHeadTower(parent, m) {
  const root = new THREE.Group();
  root.name = 'AltapoleHeadTower_29UpperJessore';
  parent.add(root);

  const exteriorStatic = new THREE.Group();
  root.add(exteriorStatic);

  const dynamicG = new THREE.Group();
  root.add(dynamicG);

  // Footprint constants
  const X0 = 152.1;
  const X1 = 162.7;
  const Z0 = -516.4;
  const Z1 = -502.0;
  const CX = (X0 + X1) * 0.5; // 157.4
  const CZ = (Z0 + Z1) * 0.5; // -509.2
  const W = X1 - X0;          // 10.6
  const L = Z1 - Z0;          // 14.4

  const FLOOR_Y = [0.08, 3.72, 6.82, 9.92, 13.02, 16.12, 19.22];
  const STOPS = [
    { idx: 0, code: 'GF', y: FLOOR_Y[0], label: 'Ground Floor · Garage & Lobby', nameBn: 'Ground Floor (Garage)' },
    { idx: 1, code: '1F', y: FLOOR_Y[1], label: '2nd Floor · Flat 2A', nameBn: '2nd Floor (Flat 2A)' },
    { idx: 2, code: '2F', y: FLOOR_Y[2], label: '3rd Floor · Flat 3A', nameBn: '3rd Floor (Flat 3A)' },
    { idx: 3, code: '3F', y: FLOOR_Y[3], label: '4th Floor · Flat 4A', nameBn: '4th Floor (Flat 4A)' },
    { idx: 4, code: '4F', y: FLOOR_Y[4], label: '5th Floor · Flat 5A', nameBn: '5th Floor (Flat 5A)' },
    { idx: 5, code: '5F', y: FLOOR_Y[5], label: '6th Floor · Flat 6A', nameBn: '6th Floor (Flat 6A)' },
    { idx: 6, code: 'R',  y: FLOOR_Y[6], label: 'Rooftop · Sky Terrace', nameBn: 'Rooftop Terrace' },
  ];

  // Elevator shaft bounds (SW back corner — keeps entire garage open for cars!)
  const LIFT_MIN_X = 152.45;
  const LIFT_MAX_X = 154.35;
  const LIFT_MIN_Z = -505.85;
  const LIFT_MAX_Z = -504.05;
  const LIFT_CX = (LIFT_MIN_X + LIFT_MAX_X) * 0.5; // 153.40
  const LIFT_CZ = (LIFT_MIN_Z + LIFT_MAX_Z) * 0.5; // -504.95
  const LIFT_DOOR_MIN_Z = -505.50;
  const LIFT_DOOR_MAX_Z = -504.40;

  // Staircase bounds (along South wall, climbing East -> West from x=159.4 -> 154.6)
  const STAIR_MIN_X = 154.55;
  const STAIR_MAX_X = 159.55;
  const STAIR_MIN_Z = -503.85;
  const STAIR_MAX_Z = -502.30;

  // Main Car Gate bounds (North front wall facing Upper Jessore Rd, wide 4.4m!)
  const GATE_MIN_X = 154.90;
  const GATE_MAX_X = 159.30;

  // Pedestrian Lobby Door (East wall facing Altapole Lane)
  const PED_MIN_Z = -507.60;
  const PED_MAX_Z = -506.00;

  // Authentic 29 Upper Jessore Rd Google Street View exterior (North = mint leaf-green, East/West/South = chocolate brown!)
  const mintFrontWall = new THREE.MeshStandardMaterial({ color: 0x77c982, roughness: 0.68 });
  const brownWall = new THREE.MeshStandardMaterial({ color: 0x4a3228, roughness: 0.76 }); // Real East/Altapole Lane chocolate-brown side wall
  const mintAccent = new THREE.MeshStandardMaterial({ color: 0x62b870, roughness: 0.64 });
  const redBrickFace = new THREE.MeshStandardMaterial({ map: makeTerracottaTileWallTexture(), roughness: 0.62 });
  const checkeredRampMat = new THREE.MeshStandardMaterial({ map: makeCheckeredRampTexture(), roughness: 0.72 });
  const whiteBand = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.40 });
  const thaiFrameMat = new THREE.MeshStandardMaterial({ color: 0xdce3ec, roughness: 0.22, metalness: 0.85 });
  const thaiGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x2563eb,
    transparent: true,
    opacity: 0.52,
    roughness: 0.06,
    metalness: 0.24,
    clearcoat: 1.0,
    side: THREE.DoubleSide,
  });
  const cobaltCurtainGlass = new THREE.MeshPhysicalMaterial({
    color: 0x1e56c5,
    roughness: 0.06,
    metalness: 0.35,
    clearcoat: 1.0,
    emissive: 0x0c2461,
    emissiveIntensity: 0.22,
  });
  const guardBoothGlass = new THREE.MeshPhysicalMaterial({
    color: 0x0f2d6e,
    roughness: 0.08,
    metalness: 0.30,
    clearcoat: 1.0,
    emissive: 0x091d4a,
    emissiveIntensity: 0.18,
  });
  const shrubFoliageMat = new THREE.MeshStandardMaterial({ color: 0x2d6a32, roughness: 0.82 });
  const garageFloorMat = new THREE.MeshStandardMaterial({ map: makeParkingFloorTexture(), roughness: 0.86 });
  const yellowPaintMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.55 });
  const gateSteelMat = new THREE.MeshStandardMaterial({ color: 0x7d8792, roughness: 0.34, metalness: 0.78 });
  const gateDarkAccent = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.42, metalness: 0.72 });
  const gateGoldMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.25, metalness: 0.88 });
  const liftSteelMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.28, metalness: 0.82 });
  const liftInteriorMat = new THREE.MeshStandardMaterial({ color: 0x2a313c, roughness: 0.45, metalness: 0.42 });
  const liftLedMat = new THREE.MeshStandardMaterial({ color: 0xfff8e1, emissive: 0xffe8a3, emissiveIntensity: 1.4 });
  const stairConcreteMat = new THREE.MeshStandardMaterial({ color: 0xd6d3ce, roughness: 0.78 });
  const waterTankMat = new THREE.MeshStandardMaterial({ color: 0x151d24, roughness: 0.45 });

  // Dynamic state
  const state = {
    gateOpen: false,
    gateAngle: 0,
    pedDoorOpen: false,
    pedDoorAngle: 0,
    liftY: FLOOR_Y[0],
    liftFloorIndex: 0,
    liftTargetIndex: 0,
    liftPhase: 'idle', // 'idle' | 'closing' | 'moving' | 'opening'
    liftDirection: 0,
    liftDoorOpen: 1.0, // 0..1
    liftDoorTimer: 0,
  };

  const animatedFans = [];
  const flatDoors = [];     // { floorIdx, pivot, x, z, y, open, angle, openAngle, collider }
  const thaiWindows = [];   // { floorIdx, mesh, axis, closedPos, openPos, open, progress, x, y, z, label }
  const floorInteriorGroups = []; // indexed 1..5
  const floorSeats = new Map();   // floorIdx -> array of seat descriptors

  // ============================================================================
  // 1) GROUND FLOOR — SPACIOUS EMPTY CAR GARAGE + MAIN GATE + LOBBY
  // ============================================================================
  // Concrete garage slab + iconic checkered multi-color tiled car ramp outside North Main Gate
  box(exteriorStatic, [W, 0.16, L], [CX, 0.0, CZ], garageFloorMat, { receiveShadow: true, castShadow: false });
  // Sloped checkered tiled ramp connecting Upper Jessore Rd (z=-518.7, y=0.01) to garage floor (z=-516.4, y=0.08)
  const rampGeo = new THREE.BoxGeometry(5.4, 0.09, 2.35);
  const rampMesh = new THREE.Mesh(rampGeo, checkeredRampMat);
  rampMesh.position.set((GATE_MIN_X + GATE_MAX_X) * 0.5, 0.03, Z0 - 1.12);
  rampMesh.rotation.x = 0.03;
  rampMesh.receiveShadow = true;
  exteriorStatic.add(rampMesh);

  // Yellow parking bay lines inside empty garage (2 big bays on West & East + wide drive lane in center!)
  for (const bx of [153.1, 155.8, 158.6, 161.8]) {
    box(exteriorStatic, [0.10, 0.012, 5.4], [bx, 0.09, -511.2], yellowPaintMat, { castShadow: false });
  }
  box(exteriorStatic, [8.8, 0.012, 0.12], [157.45, 0.09, -508.5], yellowPaintMat, { castShadow: false });
  // Overhead bright garage LED tube fixtures
  for (const lz of [-514.2, -510.2, -506.4]) {
    for (const lx of [155.2, 159.6]) {
      box(exteriorStatic, [1.45, 0.06, 0.18], [lx, 3.44, lz], liftLedMat, { castShadow: false });
    }
  }

  // Ground-floor terracotta ceramic-tile perimeter walls (matching real Street View 29 Upper Jessore Rd!)
  const gfH = FLOOR_Y[1]; // 3.72
  // West wall (solid)
  box(exteriorStatic, [0.28, gfH, L], [X0 + 0.14, gfH * 0.5, CZ], redBrickFace);
  // South wall (solid)
  box(exteriorStatic, [W, gfH, 0.28], [CX, gfH * 0.5, Z1 - 0.14], redBrickFace);
  // North front wall flanking Main Car Gate (154.90..159.30)
  box(exteriorStatic, [GATE_MIN_X - X0, gfH, 0.30], [(X0 + GATE_MIN_X) * 0.5, gfH * 0.5, Z0 + 0.15], redBrickFace);
  box(exteriorStatic, [X1 - GATE_MAX_X, gfH, 0.30], [(GATE_MAX_X + X1) * 0.5, gfH * 0.5, Z0 + 0.15], redBrickFace);
  // Header beam above Main Car Gate (clear height 3.05m so SUVs/HiAce/Alphard drive in easily!)
  box(exteriorStatic, [GATE_MAX_X - GATE_MIN_X + 0.2, gfH - 3.05, 0.32], [(GATE_MIN_X + GATE_MAX_X) * 0.5, 3.05 + (gfH - 3.05) * 0.5, Z0 + 0.15], redBrickFace);

  // Real Street View Detail A: East-North Guard Booth (left of gate when facing building: x = 159.5..162.4)
  // Recessed cobalt-blue tinted guard booth window + white frame + 3 vertical white accent stripes above & below!
  const gbX = 160.95;
  box(exteriorStatic, [1.86, 1.38, 0.16], [gbX, 1.82, Z0 - 0.04], whiteBand);
  box(exteriorStatic, [1.66, 1.18, 0.18], [gbX, 1.82, Z0 - 0.06], guardBoothGlass);
  for (const sx of [-0.26, 0, 0.26]) {
    box(exteriorStatic, [0.11, 0.72, 0.08], [gbX + sx, 3.02, Z0 - 0.04], whiteBand); // 3 upper white stripes
    box(exteriorStatic, [0.11, 0.86, 0.08], [gbX + sx, 0.58, Z0 - 0.04], whiteBand); // 3 lower white stripes
  }

  // Real Street View Detail B: West-North Low Terracotta Planter Wall + Green Shrubs (right of gate: x = 152.1..154.7)
  const plX = (X0 + GATE_MIN_X - 0.15) * 0.5;
  const plW = GATE_MIN_X - X0 - 0.15;
  box(exteriorStatic, [plW, 0.88, 0.96], [plX, 0.44, Z0 - 0.52], redBrickFace);
  box(exteriorStatic, [plW + 0.08, 0.10, 1.04], [plX, 0.90, Z0 - 0.52], whiteBand);
  for (const [bx, r] of [[152.65, 0.36], [153.25, 0.42], [153.85, 0.38], [154.35, 0.34]]) {
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), shrubFoliageMat);
    bush.position.set(bx, 1.12, Z0 - 0.52);
    bush.scale.set(1.1, 0.85, 0.95);
    exteriorStatic.add(bush);
  }

  // Terracotta Gate Pillars flanking Main Car Gate
  for (const gx of [GATE_MIN_X - 0.18, GATE_MAX_X + 0.18]) {
    box(exteriorStatic, [0.46, 3.25, 0.48], [gx, 1.62, Z0 - 0.08], redBrickFace);
    box(exteriorStatic, [0.50, 0.10, 0.52], [gx, 3.24, Z0 - 0.08], whiteBand);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), liftLedMat);
    globe.position.set(gx, 3.38, Z0 - 0.08);
    dynamicG.add(globe);
  }

  // East wall facing Altapole Lane (leaving Pedestrian Lobby Door at z = -507.60..-506.00)
  box(exteriorStatic, [0.28, gfH, PED_MIN_Z - Z0], [X1 - 0.14, gfH * 0.5, (Z0 + PED_MIN_Z) * 0.5], redBrickFace);
  box(exteriorStatic, [0.28, gfH, Z1 - PED_MAX_Z], [X1 - 0.14, gfH * 0.5, (PED_MAX_Z + Z1) * 0.5], redBrickFace);
  box(exteriorStatic, [0.28, gfH - 2.45, PED_MAX_Z - PED_MIN_Z], [X1 - 0.14, 2.45 + (gfH - 2.45) * 0.5, (PED_MIN_Z + PED_MAX_Z) * 0.5], redBrickFace);
  // Prominent White Marble Portal Frame around East Pedestrian Lobby Door (facing Altapole Lane!)
  box(exteriorStatic, [0.22, 2.58, 0.16], [X1 + 0.04, 1.29, PED_MIN_Z - 0.06], whiteBand);
  box(exteriorStatic, [0.22, 2.58, 0.16], [X1 + 0.04, 1.29, PED_MAX_Z + 0.06], whiteBand);
  box(exteriorStatic, [0.26, 0.20, PED_MAX_Z - PED_MIN_Z + 0.28], [X1 + 0.06, 2.54, (PED_MIN_Z + PED_MAX_Z) * 0.5], whiteBand);
  box(dynamicG, [0.20, 0.06, 0.85], [X1 + 0.10, 2.42, (PED_MIN_Z + PED_MAX_Z) * 0.5], liftLedMat, { castShadow: false });

  // Real Street View Detail C (11.06.38 AM corner photo): East-North Corner Low Terracotta Planter + Steel Railing + Shrubs
  box(exteriorStatic, [0.76, 0.92, 3.6], [X1 + 0.36, 0.46, -513.8], redBrickFace);
  box(exteriorStatic, [0.84, 0.10, 3.68], [X1 + 0.36, 0.94, -513.8], whiteBand);
  box(exteriorStatic, [0.05, 0.34, 3.52], [X1 + 0.72, 1.15, -513.8], gateSteelMat);
  for (const bz of [-515.1, -514.2, -513.3, -512.5]) {
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 1), shrubFoliageMat);
    bush.position.set(X1 + 0.38, 1.16, bz);
    bush.scale.set(0.95, 0.85, 1.1);
    exteriorStatic.add(bush);
  }
  // White fascia band wrapping top of ground floor
  box(exteriorStatic, [W + 0.30, 0.34, L + 0.30], [CX, gfH - 0.12, CZ], whiteBand);

  // Clear Entrance Signboards on East Pedestrian Gate & North Car Gate
  const signTexN = makeSignTexture({
    title: '২৯ আপার যশোর রোড · প্রবেশ গেট [E]',
    subtitle: 'গ্যারেজ · লিফট · সিঁড়ি · ফ্ল্যাট (GARAGE & LIFT)',
    bg: '#1c2a24', fg: '#f8fafc', accent: '#facc15', border: '#77c982',
  });
  const signMatN = new THREE.MeshStandardMaterial({ map: signTexN, emissive: 0xffffff, emissiveMap: signTexN, emissiveIntensity: 0.34, roughness: 0.32 });
  const signMeshE = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.74, 0.10), signMatN);
  signMeshE.position.set(X1 + 0.18, 3.06, (PED_MIN_Z + PED_MAX_Z) * 0.5);
  signMeshE.rotation.y = Math.PI / 2;
  dynamicG.add(signMeshE);

  // Ornate Gunmetal-Silver Double-Leaf Steel Main Car Gate (matches real Street View circular medallions + louvers!)
  const halfGateW = (GATE_MAX_X - GATE_MIN_X) * 0.5 - 0.04;
  function buildCarGateLeaf(pivotX, dir) {
    const piv = new THREE.Group();
    piv.position.set(pivotX, 0.10, Z0 + 0.04);
    const g = new THREE.Group();
    piv.add(g);
    const midX = dir * halfGateW * 0.5;
    // Outer brushed silver steel frame
    box(g, [halfGateW, 0.12, 0.09], [midX, 2.86, 0], gateSteelMat);
    box(g, [halfGateW, 0.12, 0.09], [midX, 0.12, 0], gateSteelMat);
    box(g, [halfGateW, 0.08, 0.07], [midX, 1.48, 0], gateSteelMat);
    box(g, [0.10, 2.86, 0.09], [dir * 0.05, 1.48, 0], gateSteelMat);
    box(g, [0.10, 2.86, 0.09], [dir * (halfGateW - 0.05), 1.48, 0], gateSteelMat);
    // Lower steel backing panel + decorative horizontal slats
    box(g, [halfGateW - 0.14, 0.96, 0.04], [midX, 0.62, 0], gateDarkAccent);
    for (let y = 0.28; y <= 2.72; y += 0.24) {
      box(g, [halfGateW - 0.14, 0.032, 0.055], [midX, y, 0], gateSteelMat);
    }
    // Vertical steel bars
    for (let i = 1; i <= 6; i++) {
      const bx = dir * (i / 7) * halfGateW;
      box(g, [0.032, 2.68, 0.042], [bx, 1.48, 0], gateSteelMat);
    }
    // Iconic circular steel ring medallion in center of each gate leaf (matching real 29 Upper Jessore Rd photo!)
    const ringOuter = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.038, 8, 22), gateGoldMat);
    ringOuter.position.set(midX, 1.54, 0.04);
    g.add(ringOuter);
    const ringInner = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.028, 8, 18), gateSteelMat);
    ringInner.position.set(midX, 1.54, 0.04);
    g.add(ringInner);
    // Stainless pull handle
    box(g, [0.05, 0.28, 0.14], [dir * (halfGateW - 0.16), 1.24, 0], gateGoldMat);
    mergeStaticMeshes(g);
    dynamicG.add(piv);
    return piv;
  }
  const gateLeafLeft = buildCarGateLeaf(GATE_MIN_X + 0.02, 1);
  const gateLeafRight = buildCarGateLeaf(GATE_MAX_X - 0.02, -1);

  // Pedestrian Lobby Glass/Steel Door on East Wall
  const pedDoorPivot = new THREE.Group();
  pedDoorPivot.position.set(X1 - 0.14, 0.08, PED_MIN_Z + 0.02);
  {
    const g = new THREE.Group();
    const dw = PED_MAX_Z - PED_MIN_Z - 0.04;
    box(g, [0.08, 2.38, dw], [0, 1.19, dw * 0.5], gateSteelMat);
    box(g, [0.10, 1.45, dw * 0.70], [0, 1.42, dw * 0.5], thaiGlassMat);
    box(g, [0.14, 0.26, 0.05], [0, 1.12, dw - 0.16], gateGoldMat);
    pedDoorPivot.add(g);
    dynamicG.add(pedDoorPivot);
  }

  // ============================================================================
  // 2) FULL-HEIGHT 3D ELEVATOR SHAFT + WORKING ANIMATED LIFT CABIN
  // ============================================================================
  const totalShaftH = FLOOR_Y[6] + 3.1;
  // West, North, South shaft walls
  box(exteriorStatic, [0.16, totalShaftH, LIFT_MAX_Z - LIFT_MIN_Z + 0.16], [LIFT_MIN_X - 0.04, totalShaftH * 0.5, LIFT_CZ], m.darkConcrete || stairConcreteMat);
  box(exteriorStatic, [LIFT_MAX_X - LIFT_MIN_X + 0.16, totalShaftH, 0.16], [LIFT_CX, totalShaftH * 0.5, LIFT_MIN_Z - 0.04], m.darkConcrete || stairConcreteMat);
  box(exteriorStatic, [LIFT_MAX_X - LIFT_MIN_X + 0.16, totalShaftH, 0.16], [LIFT_CX, totalShaftH * 0.5, LIFT_MAX_Z + 0.04], m.darkConcrete || stairConcreteMat);
  // East shaft jambs flanking doorway (LIFT_DOOR_MIN_Z..LIFT_DOOR_MAX_Z)
  box(exteriorStatic, [0.16, totalShaftH, LIFT_DOOR_MIN_Z - LIFT_MIN_Z], [LIFT_MAX_X, totalShaftH * 0.5, (LIFT_MIN_Z + LIFT_DOOR_MIN_Z) * 0.5], liftSteelMat);
  box(exteriorStatic, [0.16, totalShaftH, LIFT_MAX_Z - LIFT_DOOR_MAX_Z], [LIFT_MAX_X, totalShaftH * 0.5, (LIFT_DOOR_MAX_Z + LIFT_MAX_Z) * 0.5], liftSteelMat);
  // Live 3D Illuminated Elevator Button Panel Texture (used BOTH inside the cabin & on every floor landing!)
  const liftPanelCanvas = document.createElement('canvas');
  liftPanelCanvas.width = 256;
  liftPanelCanvas.height = 512;
  const liftPanelTex = new THREE.CanvasTexture(liftPanelCanvas);
  liftPanelTex.colorSpace = THREE.SRGBColorSpace;
  const liftPanelMat = new THREE.MeshBasicMaterial({ map: liftPanelTex });

  function redrawLiftPanel() {
    const ctx = liftPanelCanvas.getContext('2d');
    const curStop = STOPS[state.liftFloorIndex] || STOPS[0];
    const isMoving = state.liftPhase === 'moving' || state.liftPhase === 'closing';
    const arrow = isMoving ? (state.liftDirection >= 0 ? '▲' : '▼') : (state.liftDoorOpen > 0.6 ? '●' : '■');
    const statusText = state.liftPhase === 'moving'
      ? `GOING TO ${STOPS[state.liftTargetIndex]?.code || curStop.code}`
      : (state.liftPhase === 'opening' ? 'DOORS OPENING' : (state.liftPhase === 'closing' ? 'DOORS CLOSING' : 'DOOR OPEN · PRESS [E/L]'));

    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, 256, 512);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 240, 496);

    ctx.fillStyle = '#03050a';
    ctx.fillRect(20, 22, 216, 92);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 22, 216, 92);

    ctx.fillStyle = arrow === '●' ? '#22c55e' : '#f59e0b';
    ctx.font = '900 46px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(arrow, 68, 84);

    ctx.fillStyle = '#ef4444';
    ctx.font = '900 56px monospace';
    ctx.fillText(curStop.code, 158, 86);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('29 UPPER JESSORE · LIFT', 128, 138);
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(statusText, 128, 162);

    const btns = [
      ['R', 6], ['5', 5],
      ['4', 4], ['3', 3],
      ['2', 2], ['1', 1],
      ['G', 0],
    ];
    btns.forEach(([label, idx], i) => {
      const col = label === 'G' ? 0.5 : (i % 2);
      const row = label === 'G' ? 3 : Math.floor(i / 2);
      const cx = label === 'G' ? 128 : (col === 0 ? 78 : 178);
      const cy = 212 + row * 62;
      const isCur = idx === state.liftFloorIndex && !isMoving;
      const isTarget = idx === state.liftTargetIndex && isMoving;

      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.fillStyle = isTarget ? '#d97706' : (isCur ? '#15803d' : '#1e293b');
      ctx.fill();
      ctx.lineWidth = (isTarget || isCur) ? 4 : 2.5;
      ctx.strokeStyle = isTarget ? '#fde047' : (isCur ? '#4ade80' : '#94a3b8');
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Arial';
      ctx.fillText(label, cx, cy + 8);
    });

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('PRESS [E / L] OR 0-5 / R', 128, 486);
    liftPanelTex.needsUpdate = true;
  }
  redrawLiftPanel();

  // Floor doorway headers + stainless landing frames + 3D Illuminated Call & Floor Display Panels on every stop
  for (let k = 0; k < STOPS.length; k++) {
    const fy = FLOOR_Y[k];
    const nextY = k < STOPS.length - 1 ? FLOOR_Y[k + 1] : fy + 3.0;
    const headerH = Math.max(0.35, nextY - (fy + 2.28));
    box(exteriorStatic, [0.18, headerH, LIFT_DOOR_MAX_Z - LIFT_DOOR_MIN_Z], [LIFT_MAX_X, fy + 2.28 + headerH * 0.5, LIFT_CZ], liftSteelMat);
    // 3D Illuminated Call Button & Floor Indicator Panel beside doorway on every floor
    box(exteriorStatic, [0.06, 0.78, 0.36], [LIFT_MAX_X + 0.10, fy + 1.38, LIFT_DOOR_MAX_Z + 0.24], m.darkMetal);
    const landingPanel = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.70), liftPanelMat);
    landingPanel.position.set(LIFT_MAX_X + 0.135, fy + 1.38, LIFT_DOOR_MAX_Z + 0.24);
    landingPanel.rotation.y = Math.PI / 2;
    dynamicG.add(landingPanel);
  }

  // Moving 3D Passenger Lift Cabin
  const liftCabin = new THREE.Group();
  liftCabin.position.set(LIFT_CX, FLOOR_Y[0], LIFT_CZ);
  dynamicG.add(liftCabin);
  const cabW = LIFT_MAX_X - LIFT_MIN_X - 0.22; // 1.68
  const cabD = LIFT_MAX_Z - LIFT_MIN_Z - 0.22; // 1.58
  const cabH = 2.38;
  {
    const cg = new THREE.Group();
    // Cabin floor, ceiling, warm LED panel, 3 interior walls, rear mirror, brass handrail
    box(cg, [cabW, 0.10, cabD], [0, 0.02, 0], m.blackTile || liftInteriorMat);
    box(cg, [cabW, 0.10, cabD], [0, cabH, 0], liftInteriorMat);
    box(cg, [cabW * 0.72, 0.04, cabD * 0.72], [0, cabH - 0.06, 0], liftLedMat, { castShadow: false });
    box(cg, [0.08, cabH, cabD], [-cabW * 0.5 + 0.04, cabH * 0.5, 0], liftInteriorMat);
    box(cg, [0.04, 1.35, cabD * 0.72], [-cabW * 0.5 + 0.10, 1.35, 0], m.mirrorMat || thaiGlassMat);
    box(cg, [cabW, cabH, 0.08], [0, cabH * 0.5, -cabD * 0.5 + 0.04], liftInteriorMat);
    box(cg, [cabW, cabH, 0.08], [0, cabH * 0.5, cabD * 0.5 - 0.04], liftInteriorMat);
    // Handrail inside cabin
    box(cg, [0.05, 0.05, cabD * 0.80], [-cabW * 0.5 + 0.16, 0.94, 0], gateGoldMat);
    // Metallic Bezel Mounts for Interior 3D Lift Floor Button Panels (South & North walls inside cabin!)
    box(cg, [0.46, 0.88, 0.05], [0.24, 1.36, cabD * 0.5 - 0.09], gateGoldMat);
    box(cg, [0.46, 0.88, 0.05], [0.24, 1.36, -cabD * 0.5 + 0.09], gateGoldMat);
    mergeStaticMeshes(cg);
    liftCabin.add(cg);
  }
  // Glowing 3D Floor Button Panels INSIDE the Elevator Cabin (South wall facing North + North wall facing South!)
  const cabPanelSouth = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.84), liftPanelMat);
  cabPanelSouth.position.set(0.24, 1.36, cabD * 0.5 - 0.12);
  cabPanelSouth.rotation.y = Math.PI;
  const cabPanelNorth = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.84), liftPanelMat);
  cabPanelNorth.position.set(0.24, 1.36, -cabD * 0.5 + 0.12);
  liftCabin.add(cabPanelSouth, cabPanelNorth);

  // Sliding double stainless-steel lift cabin doors (open along ±Z on East face)
  const liftDoorW = (LIFT_DOOR_MAX_Z - LIFT_DOOR_MIN_Z) * 0.5;
  const liftDoorLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.24, liftDoorW), liftSteelMat);
  const liftDoorRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.24, liftDoorW), liftSteelMat);
  liftDoorLeft.position.set(cabW * 0.5 - 0.02, 1.14, -liftDoorW * 0.5);
  liftDoorRight.position.set(cabW * 0.5 - 0.02, 1.14, liftDoorW * 0.5);
  liftCabin.add(liftDoorLeft, liftDoorRight);

  // ============================================================================
  // 3) CONTINUOUS WALKABLE MULTI-STORY STAIRCASE (GF -> 5F -> ROOF)
  // ============================================================================
  for (let k = 0; k < 6; k++) {
    const y0 = FLOOR_Y[k];
    const y1 = FLOOR_Y[k + 1];
    const steps = 16;
    const xStart = STAIR_MAX_X - 0.15; // 159.40
    const xEnd = STAIR_MIN_X + 0.15;   // 154.70
    const stepSpan = (xStart - xEnd) / steps;
    const stepRise = (y1 - y0) / steps;
    const stairZ = (STAIR_MIN_Z + STAIR_MAX_Z) * 0.5;
    const stairW = STAIR_MAX_Z - STAIR_MIN_Z - 0.08;
    for (let s = 0; s < steps; s++) {
      const sx = xStart - (s + 0.5) * stepSpan;
      const sy = y0 + (s + 0.5) * stepRise;
      box(exteriorStatic, [stepSpan + 0.04, stepRise + 0.16, stairW], [sx, sy - 0.04, stairZ], stairConcreteMat);
    }
    // Stainless steel sloped handrails on North side of staircase
    rodBetween(exteriorStatic, [xStart, y0 + 0.94, STAIR_MIN_Z + 0.06], [xEnd, y1 + 0.94, STAIR_MIN_Z + 0.06], 0.025, thaiFrameMat, 8);
    for (let p = 0; p <= 4; p++) {
      const f = p / 4;
      const px = THREE.MathUtils.lerp(xStart, xEnd, f);
      const py = THREE.MathUtils.lerp(y0, y1, f);
      cylinder(exteriorStatic, 0.018, 0.018, 0.94, [px, py + 0.47, STAIR_MIN_Z + 0.06], thaiFrameMat, 6);
    }
  }

  // Helper: Build an interactive [E]-Openable Thai Aluminum Sliding Window!
  function addOpenableThaiWindow({ floorIdx, axis, cx, cy, cz, width, height, label }) {
    const frameDepth = 0.20;
    const halfW = width * 0.5;
    const g = exteriorStatic;
    if (axis === 'X') {
      // Window along North/South wall (sliding along X)
      box(g, [width + 0.12, 0.07, frameDepth], [cx, cy + height * 0.5, cz], thaiFrameMat);
      box(g, [width + 0.12, 0.07, frameDepth], [cx, cy - height * 0.5, cz], thaiFrameMat);
      box(g, [0.07, height, frameDepth], [cx - halfW, cy, cz], thaiFrameMat);
      box(g, [0.07, height, frameDepth], [cx + halfW, cy, cz], thaiFrameMat);
      // Fixed left half glass pane
      box(g, [halfW - 0.04, height - 0.10, 0.03], [cx - halfW * 0.5, cy, cz + 0.03], thaiGlassMat, { castShadow: false });
      // Exterior white safety grille bars
      for (let gx = -halfW + 0.35; gx <= halfW - 0.30; gx += 0.42) {
        box(g, [0.03, height - 0.08, 0.03], [cx + gx, cy, cz - 0.11], whiteBand);
      }
      box(g, [width - 0.06, 0.04, 0.03], [cx, cy, cz - 0.11], whiteBand);

      // Animated Right Sliding Thai Sash (slides left over the fixed pane when opened!)
      const sash = new THREE.Group();
      const closedX = cx + halfW * 0.5;
      const openX = cx - halfW * 0.42;
      sash.position.set(closedX, cy, cz - 0.02);
      const sashW = halfW - 0.02;
      const sashH = height - 0.10;
      box(sash, [sashW, sashH, 0.03], [0, 0, 0], thaiGlassMat, { castShadow: false });
      box(sash, [sashW, 0.05, 0.05], [0, sashH * 0.5, 0], thaiFrameMat);
      box(sash, [sashW, 0.05, 0.05], [0, -sashH * 0.5, 0], thaiFrameMat);
      box(sash, [0.05, sashH, 0.05], [-sashW * 0.5, 0, 0], thaiFrameMat);
      box(sash, [0.05, sashH, 0.05], [sashW * 0.5, 0, 0], thaiFrameMat);
      // Interior pull handle
      box(sash, [0.03, 0.22, 0.06], [sashW * 0.36, -0.05, 0.04], m.darkMetal);
      dynamicG.add(sash);
      thaiWindows.push({ floorIdx, mesh: sash, axis: 'X', closedPos: closedX, openPos: openX, open: false, progress: 0, x: cx, y: cy, z: cz, label });
    } else {
      // Window along East/West wall (sliding along Z)
      box(g, [frameDepth, 0.07, width + 0.12], [cx, cy + height * 0.5, cz], thaiFrameMat);
      box(g, [frameDepth, 0.07, width + 0.12], [cx, cy - height * 0.5, cz], thaiFrameMat);
      box(g, [frameDepth, height, 0.07], [cx, cy, cz - halfW], thaiFrameMat);
      box(g, [frameDepth, height, 0.07], [cx, cy, cz + halfW], thaiFrameMat);
      // Fixed North half glass pane
      box(g, [0.03, height - 0.10, halfW - 0.04], [cx - 0.03, cy, cz - halfW * 0.5], thaiGlassMat, { castShadow: false });
      // Exterior white safety grille bars
      for (let gz = -halfW + 0.35; gz <= halfW - 0.30; gz += 0.42) {
        box(g, [0.03, height - 0.08, 0.03], [cx + 0.11, cy, cz + gz], whiteBand);
      }
      box(g, [0.03, 0.04, width - 0.06], [cx + 0.11, cy, cz], whiteBand);

      // Animated South Sliding Thai Sash
      const sash = new THREE.Group();
      const closedZ = cz + halfW * 0.5;
      const openZ = cz - halfW * 0.42;
      sash.position.set(cx + 0.02, cy, closedZ);
      const sashW = halfW - 0.02;
      const sashH = height - 0.10;
      box(sash, [0.03, sashH, sashW], [0, 0, 0], thaiGlassMat, { castShadow: false });
      box(sash, [0.05, 0.05, sashW], [0, sashH * 0.5, 0], thaiFrameMat);
      box(sash, [0.05, 0.05, sashW], [0, -sashH * 0.5, 0], thaiFrameMat);
      box(sash, [0.05, sashH, 0.05], [0, 0, -sashW * 0.5], thaiFrameMat);
      box(sash, [0.05, sashH, 0.05], [0, 0, sashW * 0.5], thaiFrameMat);
      box(sash, [0.06, 0.22, 0.03], [-0.04, -0.05, sashW * 0.36], m.darkMetal);
      dynamicG.add(sash);
      thaiWindows.push({ floorIdx, mesh: sash, axis: 'Z', closedPos: closedZ, openPos: openZ, open: false, progress: 0, x: cx, y: cy, z: cz, label });
    }
  }

  // Helper: Build Floor Slab with Lift Shaft & Stairwell cutouts
  function addFloorSlabWithCutouts(y) {
    // 1) Main North section (z = Z0 .. -505.85) — full width X0..X1
    box(exteriorStatic, [W, 0.20, LIFT_MIN_Z - Z0], [CX, y - 0.10, (Z0 + LIFT_MIN_Z) * 0.5], m.pillarTile || stairConcreteMat, { uvScale: 1.8 });
    // 2) Lift lobby strip (z = -505.85 .. -503.85) — East of lift shaft (X = LIFT_MAX_X .. X1)
    box(exteriorStatic, [X1 - LIFT_MAX_X, 0.20, STAIR_MIN_Z - LIFT_MIN_Z], [(LIFT_MAX_X + X1) * 0.5, y - 0.10, (LIFT_MIN_Z + STAIR_MIN_Z) * 0.5], m.pillarTile || stairConcreteMat, { uvScale: 1.8 });
    // 3) Stair top landing (z = -503.85 .. Z1, West of stair cutout: X0 .. STAIR_MIN_X)
    box(exteriorStatic, [STAIR_MIN_X - X0, 0.20, Z1 - STAIR_MIN_Z], [(X0 + STAIR_MIN_X) * 0.5, y - 0.10, (STAIR_MIN_Z + Z1) * 0.5], m.pillarTile || stairConcreteMat, { uvScale: 1.8 });
    // 4) Stair bottom landing (z = -503.85 .. Z1, East of stair cutout: STAIR_MAX_X .. X1)
    box(exteriorStatic, [X1 - STAIR_MAX_X, 0.20, Z1 - STAIR_MIN_Z], [(STAIR_MAX_X + X1) * 0.5, y - 0.10, (STAIR_MIN_Z + Z1) * 0.5], m.pillarTile || stairConcreteMat, { uvScale: 1.8 });
    // Exterior white cornice trim band
    box(exteriorStatic, [W + 0.44, 0.24, L + 0.44], [CX, y - 0.08, CZ], whiteBand);
  }

  // Central Vertical Cobalt-Blue Reflective Glass Curtain Wall on North Facade (x = 156.24..158.56, matching real photo!)
  const upTotalH = FLOOR_Y[6] - FLOOR_Y[1];
  const cwW = 2.34;
  const cwY = FLOOR_Y[1] + upTotalH * 0.5;
  box(exteriorStatic, [cwW, upTotalH + 0.16, 0.12], [CX, cwY, Z0 - 0.08], cobaltCurtainGlass);
  // Vertical silver aluminum mullions
  for (const mx of [CX - cwW * 0.5, CX - cwW * 0.18, CX + cwW * 0.18, CX + cwW * 0.5]) {
    box(exteriorStatic, [0.07, upTotalH + 0.20, 0.18], [mx, cwY, Z0 - 0.10], thaiFrameMat);
  }
  // Horizontal silver aluminum spandrel transoms across all 5 upper floors
  for (let k = 1; k <= 5; k++) {
    const fy = FLOOR_Y[k];
    for (const dy of [0.05, 1.05, 2.05, 3.05]) {
      box(exteriorStatic, [cwW + 0.10, 0.07, 0.18], [CX, fy + dy, Z0 - 0.10], thaiFrameMat);
    }
  }

  // ============================================================================
  // 4) APARTMENT FLOORS 1..5 — HOLLOW WALLS, THAI WINDOWS & FURNISHED FLATS
  // ============================================================================
  const FL_H = 3.10;
  for (let k = 1; k <= 5; k++) {
    const fy = FLOOR_Y[k];
    addFloorSlabWithCutouts(fy);

    // --- EXTERIOR WALLS WITH REAL WINDOW OPENINGS (so Thai windows actually open to the street!) ---
    // West wall (solid chocolate brown)
    box(exteriorStatic, [0.26, FL_H, L], [X0 + 0.13, fy + FL_H * 0.5, CZ], brownWall);
    // South wall (solid chocolate brown)
    box(exteriorStatic, [W, FL_H, 0.26], [CX, fy + FL_H * 0.5, Z1 - 0.13], brownWall);

    // North facade wall (z = Z0 + 0.13) — Mint Leaf-Green (matching real Street View 1.21.12 PM!)
    //  Win N1 (Master Bedroom): x = 153.6..156.2, y = fy+0.85..fy+2.45
    //  Win N2 (Living Room):    x = 158.6..161.2, y = fy+0.85..fy+2.45
    box(exteriorStatic, [W, 0.85, 0.26], [CX, fy + 0.425, Z0 + 0.13], mintFrontWall); // sill wall
    box(exteriorStatic, [W, FL_H - 2.45, 0.26], [CX, fy + 2.45 + (FL_H - 2.45) * 0.5, Z0 + 0.13], mintFrontWall); // lintel wall
    box(exteriorStatic, [153.6 - X0, 1.60, 0.26], [(X0 + 153.6) * 0.5, fy + 1.65, Z0 + 0.13], mintFrontWall);
    box(exteriorStatic, [158.6 - 156.2, 1.60, 0.26], [157.4, fy + 1.65, Z0 + 0.13], mintFrontWall);
    box(exteriorStatic, [X1 - 161.2, 1.60, 0.26], [(161.2 + X1) * 0.5, fy + 1.65, Z0 + 0.13], mintFrontWall);
    // Vertical Mint-Green accent band on SE corner of East side (matching 11.06.38 AM corner photo!)
    box(exteriorStatic, [0.14, FL_H, 1.35], [X1 + 0.04, fy + FL_H * 0.5, Z1 - 0.85], mintFrontWall);

    addOpenableThaiWindow({ floorIdx: k, axis: 'X', cx: 154.9, cy: fy + 1.65, cz: Z0 + 0.13, width: 2.6, height: 1.60, label: `Bedroom Thai Window (Floor ${k + 1})` });
    addOpenableThaiWindow({ floorIdx: k, axis: 'X', cx: 159.9, cy: fy + 1.65, cz: Z0 + 0.13, width: 2.6, height: 1.60, label: `Living Room North Window (Floor ${k + 1})` });

    // East facade wall (x = X1 - 0.13) with 2 big Thai Window openings overlooking Altapole Lane:
    //  Win E1 (Living Room): z = -514.5..-511.9
    //  Win E2 (Dining Room): z = -509.5..-506.9
    box(exteriorStatic, [0.26, 0.85, L], [X1 - 0.13, fy + 0.425, CZ], brownWall);
    box(exteriorStatic, [0.26, FL_H - 2.45, L], [X1 - 0.13, fy + 2.45 + (FL_H - 2.45) * 0.5, CZ], brownWall);
    box(exteriorStatic, [0.26, 1.60, -514.5 - Z0], [X1 - 0.13, fy + 1.65, (Z0 - 514.5) * 0.5], brownWall);
    box(exteriorStatic, [0.26, 1.60, -509.5 - (-511.9)], [X1 - 0.13, fy + 1.65, -510.7], brownWall);
    box(exteriorStatic, [0.26, 1.60, Z1 - (-506.9)], [X1 - 0.13, fy + 1.65, (-506.9 + Z1) * 0.5], brownWall);

    addOpenableThaiWindow({ floorIdx: k, axis: 'Z', cx: X1 - 0.13, cy: fy + 1.65, cz: -513.2, width: 2.6, height: 1.60, label: `Living Room East Window (Floor ${k + 1})` });
    addOpenableThaiWindow({ floorIdx: k, axis: 'Z', cx: X1 - 0.13, cy: fy + 1.65, cz: -508.2, width: 2.6, height: 1.60, label: `Dining Thai Window (Floor ${k + 1})` });

    if (k <= 3) {
      box(exteriorStatic, [0.36, 0.54, 0.78], [X1 + 0.22, fy + 0.56, -510.7], m.aluminum);
    }

    // --- INTERIOR PARTITION WALLS ---
    // Lobby-to-Flat wall at z = -506.20 (with Flat Main Doorway at x = 158.1..159.4)
    box(exteriorStatic, [158.1 - X0, FL_H, 0.16], [(X0 + 158.1) * 0.5, fy + FL_H * 0.5, -506.20], m.roomWall);
    box(exteriorStatic, [X1 - 159.4, FL_H, 0.16], [(159.4 + X1) * 0.5, fy + FL_H * 0.5, -506.20], m.roomWall);
    box(exteriorStatic, [1.32, FL_H - 2.26, 0.16], [158.75, fy + 2.26 + (FL_H - 2.26) * 0.5, -506.20], m.roomWall);

    // Openable Wooden Flat Main Door
    const fdPivot = new THREE.Group();
    fdPivot.position.set(158.12, fy + 0.02, -506.20);
    {
      const dg = new THREE.Group();
      box(dg, [1.26, 2.22, 0.07], [0.63, 1.11, 0], m.wood);
      box(dg, [0.05, 0.22, 0.12], [1.12, 1.02, 0], m.chrome);
      mergeStaticMeshes(dg);
      fdPivot.add(dg);
      dynamicG.add(fdPivot);
    }
    flatDoors.push({
      floorIdx: k,
      pivot: fdPivot,
      x: 158.75,
      y: fy,
      z: -506.20,
      open: false,
      angle: 0,
      openAngle: -Math.PI * 0.54,
      label: `Flat ${k + 1}A Main Door`,
      collider: { minX: 158.10, maxX: 159.40, minZ: -506.34, maxZ: -506.06 },
    });

    // Bedroom / Living Room divider at x = 157.30 (z = -516.2..-510.2, open doorway at z = -511.6..-510.3)
    box(exteriorStatic, [0.16, FL_H, -511.6 - Z0], [157.30, fy + FL_H * 0.5, (Z0 - 511.6) * 0.5], m.roomWall);
    box(exteriorStatic, [0.16, FL_H - 2.24, 1.35], [157.30, fy + 2.24 + (FL_H - 2.24) * 0.5, -510.95], m.roomWall);

    // Attached Bathroom walls (x = 152.35..156.20, z = -510.10..-506.28, open doorway on East at z = -509.2..-508.1)
    box(exteriorStatic, [156.20 - X0, FL_H, 0.16], [(X0 + 156.20) * 0.5, fy + FL_H * 0.5, -510.10], m.roomWall);
    box(exteriorStatic, [0.16, FL_H, -509.2 - (-510.1)], [156.20, fy + FL_H * 0.5, -509.65], m.roomWall);
    box(exteriorStatic, [0.16, FL_H, -506.28 - (-508.1)], [156.20, fy + FL_H * 0.5, -507.19], m.roomWall);
    box(exteriorStatic, [0.16, FL_H - 2.20, 1.15], [156.20, fy + 2.20 + (FL_H - 2.20) * 0.5, -508.65], m.roomWall);

    // --- FURNISHED FLAT INTERIOR (Culled per floor for rock-solid 60 FPS!) ---
    const intG = new THREE.Group();
    intG.name = `AltapoleTowerInterior_F${k}`;

    // 1) Living Room (NE: x = 157.4..162.4, z = -516.1..-510.2)
    box(intG, [2.8, 0.02, 2.8], [159.9, fy + 0.02, -513.2], m.rugMat);
    // Velvet L-Sofa against West partition
    box(intG, [0.80, 0.42, 2.35], [158.0, fy + 0.22, -513.6], m.sofaFabric);
    box(intG, [0.18, 0.52, 2.35], [157.68, fy + 0.58, -513.6], m.sofaFabric);
    // Wooden Center Coffee Table
    box(intG, [0.80, 0.06, 1.25], [159.5, fy + 0.44, -513.6], m.wood);
    for (const [lx, lz] of [[159.15, -514.15], [159.85, -514.15], [159.15, -513.05], [159.85, -513.05]]) {
      box(intG, [0.05, 0.42, 0.05], [lx, fy + 0.21, lz], m.wood);
    }
    // Wall-Mounted 4K Smart TV & Wooden Console (against East wall between windows, facing West)
    box(intG, [0.42, 0.46, 1.72], [162.12, fy + 0.24, -510.7], m.wood);
    box(intG, [0.46, 0.04, 1.76], [162.12, fy + 0.48, -510.7], m.blackTile);
    box(intG, [0.07, 0.92, 1.54], [162.32, fy + 1.40, -510.7], m.darkMetal);
    const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 0.82), m.tvScreen);
    tvScreen.rotation.y = -Math.PI / 2;
    tvScreen.position.set(162.27, fy + 1.40, -510.7);
    intG.add(tvScreen);
    // Ceiling LED light
    box(intG, [0.58, 0.04, 0.58], [159.9, fy + 2.86, -513.2], m.lamp, { castShadow: false });

    // 2) Master Bedroom (NW: x = 152.4..157.2, z = -516.1..-510.2)
    // King-Size Wooden Bed (খাট + ম্যাট্রেস + বালিশ + কম্বল)
    box(intG, [2.15, 0.30, 1.92], [153.75, fy + 0.16, -513.6], m.wood);
    box(intG, [0.14, 0.98, 1.96], [152.62, fy + 0.52, -513.6], m.wood); // headboard
    box(intG, [2.04, 0.20, 1.82], [153.75, fy + 0.40, -513.6], m.mattressMat);
    box(intG, [1.35, 0.21, 1.84], [154.10, fy + 0.41, -513.6], m.blanketMat);
    box(intG, [0.38, 0.12, 0.68], [152.96, fy + 0.54, -514.08], whiteBand); // pillow 1
    box(intG, [0.38, 0.12, 0.68], [152.96, fy + 0.54, -513.12], whiteBand); // pillow 2
    // Wooden Wardrobe with Mirror (along South bedroom wall)
    box(intG, [1.55, 2.08, 0.56], [154.8, fy + 1.05, -510.55], m.wood);
    box(intG, [0.56, 1.45, 0.04], [154.8, fy + 1.15, -510.85], m.mirrorMat || thaiGlassMat);
    // Bedside table
    box(intG, [0.46, 0.48, 0.46], [152.85, fy + 0.25, -515.15], m.wood);
    box(intG, [0.56, 0.04, 0.56], [154.8, fy + 2.86, -513.2], m.lamp, { castShadow: false });

    // 3) Dining & Modular Kitchen (East-Central: x = 156.4..162.4, z = -510.0..-506.3)
    box(intG, [1.55, 0.06, 0.96], [159.4, fy + 0.76, -508.2], m.wood);
    for (const [lx, lz] of [[158.7, -508.6], [160.1, -508.6], [158.7, -507.8], [160.1, -507.8]]) {
      box(intG, [0.06, 0.72, 0.06], [lx, fy + 0.36, lz], m.wood);
    }
    // Dining chairs
    for (const cx of [159.05, 159.75]) {
      box(intG, [0.40, 0.45, 0.40], [cx, fy + 0.24, -509.02], m.wood);
      box(intG, [0.40, 0.45, 0.40], [cx, fy + 0.24, -507.38], m.wood);
    }
    // Kitchen Counter + Gas Stove + Fridge along South-East wall
    box(intG, [2.40, 0.84, 0.60], [161.1, fy + 0.43, -506.62], m.pillarTile);
    box(intG, [2.46, 0.05, 0.64], [161.1, fy + 0.86, -506.62], m.blackTile);
    box(intG, [0.68, 0.05, 0.42], [161.2, fy + 0.91, -506.62], m.chrome);
    cylinder(intG, 0.09, 0.09, 0.02, [161.04, fy + 0.94, -506.62], m.stoveFlame, 10);
    cylinder(intG, 0.09, 0.09, 0.02, [161.36, fy + 0.94, -506.62], m.stoveFlame, 10);
    box(intG, [0.68, 1.78, 0.66], [162.05, fy + 0.90, -509.62], m.aluminum);
    box(intG, [0.54, 0.04, 0.54], [159.4, fy + 2.86, -508.2], m.lamp, { castShadow: false });

    // 4) Attached Bathroom (West-Central: x = 152.4..156.1, z = -510.0..-506.3)
    box(intG, [3.6, 0.03, 3.6], [154.25, fy + 0.02, -508.15], m.bathTile);
    box(intG, [0.04, 1.38, 3.5], [152.42, fy + 0.70, -508.15], m.bathTile);
    // Western Porcelain Commode
    cylinder(intG, 0.18, 0.14, 0.36, [152.96, fy + 0.20, -507.15], m.porcelain, 12);
    cylinder(intG, 0.22, 0.19, 0.08, [152.98, fy + 0.40, -507.15], m.porcelain, 12);
    box(intG, [0.18, 0.40, 0.40], [152.72, fy + 0.64, -507.15], m.porcelain);
    // Wash Basin & Mirror
    cylinder(intG, 0.10, 0.12, 0.66, [152.84, fy + 0.34, -509.15], m.porcelain, 10);
    box(intG, [0.40, 0.13, 0.48], [152.88, fy + 0.74, -509.15], m.porcelain);
    box(intG, [0.03, 0.72, 0.52], [152.54, fy + 1.42, -509.15], m.chrome);
    box(intG, [0.04, 0.66, 0.46], [152.56, fy + 1.42, -509.15], m.mirrorMat || thaiGlassMat);
    // Overhead Chrome Shower + Blue Bucket & Mug
    rodBetween(intG, [155.55, fy + 0.90, -506.62], [155.55, fy + 2.15, -506.62], 0.015, m.chrome, 8);
    rodBetween(intG, [155.55, fy + 2.15, -506.62], [155.28, fy + 2.08, -506.62], 0.015, m.chrome, 8);
    cylinder(intG, 0.10, 0.08, 0.03, [155.28, fy + 2.05, -506.62], m.chrome, 10);
    cylinder(intG, 0.17, 0.13, 0.35, [155.15, fy + 0.18, -506.95], m.bucketMat, 10);
    box(intG, [0.36, 0.04, 0.36], [154.25, fy + 2.86, -508.15], m.lamp, { castShadow: false });

    mergeStaticMeshes(intG);
    root.add(intG);
    floorInteriorGroups[k] = intG;

    // Spinning ceiling fans in Living Room & Master Bedroom
    for (const [fx, fz] of [[159.9, -513.2], [154.8, -513.2]]) {
      const fg = new THREE.Group();
      fg.position.set(fx, fy + 2.88, fz);
      dynamicG.add(fg);
      cylinder(fg, 0.02, 0.02, 0.28, [0, -0.14, 0], whiteBand, 6);
      const rotor = new THREE.Group();
      rotor.position.set(0, -0.28, 0);
      fg.add(rotor);
      cylinder(rotor, 0.12, 0.12, 0.05, [0, 0, 0], whiteBand, 10);
      for (let b = 0; b < 3; b++) {
        const a = (b / 3) * Math.PI * 2;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.012, 0.10), whiteBand);
        blade.position.set(Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32);
        blade.rotation.y = -a;
        rotor.add(blade);
      }
      animatedFans.push({ rotor, floorIdx: k });
    }

    // Register sittable furniture on this floor
    floorSeats.set(k, [
      { minX: 157.58, maxX: 158.42, minZ: -514.8, maxZ: -512.4, seatX: 158.08, seatZ: -513.6, seatY: 0.45, yaw: Math.PI / 2, fy, label: `Living Room Sofa (Floor ${k + 1})` },
      { minX: 152.65, maxX: 154.85, minZ: -514.6, maxZ: -512.6, seatX: 154.05, seatZ: -513.6, seatY: 0.54, yaw: Math.PI / 2, fy, label: `Master King Bed (Floor ${k + 1})` },
      { minX: 152.65, maxX: 153.25, minZ: -507.45, maxZ: -506.85, seatX: 153.02, seatZ: -507.15, seatY: 0.46, yaw: Math.PI / 2, fy, label: `Toilet Commode (Floor ${k + 1})` },
    ]);
  }

  // ============================================================================
  // 5) ROOFTOP (y = 19.22m) — PARAPET WALL, MUMTY ROOM & GAZI WATER TANK
  // ============================================================================
  const roofY = FLOOR_Y[6];
  addFloorSlabWithCutouts(roofY);
  // Rooftop perimeter parapet wall (1.05m tall)
  box(exteriorStatic, [W, 1.05, 0.24], [CX, roofY + 0.52, Z0 + 0.12], whiteBand);
  box(exteriorStatic, [W, 1.05, 0.24], [CX, roofY + 0.52, Z1 - 0.12], whiteBand);
  box(exteriorStatic, [0.24, 1.05, L], [X0 + 0.12, roofY + 0.52, CZ], whiteBand);
  box(exteriorStatic, [0.24, 1.05, L], [X1 - 0.12, roofY + 0.52, CZ], whiteBand);
  // Rooftop Mumty (Lift & Stairhead enclosure with open North exit doorway onto terrace)
  box(exteriorStatic, [8.2, 0.20, 4.4], [156.2, roofY + 3.05, -504.2], whiteBand);
  box(exteriorStatic, [0.22, 3.0, 4.2], [X0 + 0.14, roofY + 1.5, -504.2], whiteBand);
  box(exteriorStatic, [8.2, 3.0, 0.22], [156.2, roofY + 1.5, Z1 - 0.14], whiteBand);
  box(exteriorStatic, [0.22, 3.0, 4.2], [160.2, roofY + 1.5, -504.2], whiteBand);
  // Black Gazi 2000L Overhead Water Tank on concrete stand
  box(exteriorStatic, [1.8, 0.65, 1.8], [154.6, roofY + 0.32, -513.5], stairConcreteMat);
  cylinder(exteriorStatic, 0.72, 0.74, 1.55, [154.6, roofY + 1.42, -513.5], waterTankMat, 12);

  mergeStaticMeshes(exteriorStatic);

  // ============================================================================
  // 6) LIFT, DOOR, THAI WINDOW, GROUND HEIGHT & COLLISION API
  // ============================================================================
  function isInTowerFootprint(pos, pad = 0) {
    return pos && pos.x >= X0 - pad && pos.x <= X1 + pad && pos.z >= Z0 - pad && pos.z <= Z1 + pad;
  }

  function isInsideLift(pos) {
    if (!pos) return false;
    return pos.x >= LIFT_MIN_X - 0.05 && pos.x <= LIFT_MAX_X + 0.05
      && pos.z >= LIFT_MIN_Z - 0.05 && pos.z <= LIFT_MAX_Z + 0.05;
  }

  function isNearLiftLobby(pos) {
    if (!pos) return false;
    return pos.x >= LIFT_MAX_X - 0.2 && pos.x <= LIFT_MAX_X + 2.4
      && pos.z >= LIFT_MIN_Z - 1.2 && pos.z <= LIFT_MAX_Z + 1.2;
  }

  function isLiftOpenAtY(footY) {
    if (state.liftPhase === 'moving' || state.liftDoorOpen < 0.65) return false;
    return Math.abs(footY - state.liftY) < 0.85;
  }

  function nearestFloorIndex(footY) {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < STOPS.length; i++) {
      const d = Math.abs(footY - STOPS[i].y);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  function goToFloor(targetIdx) {
    const idx = THREE.MathUtils.clamp(Math.round(targetIdx), 0, STOPS.length - 1);
    state.liftTargetIndex = idx;
    if (idx === state.liftFloorIndex && state.liftPhase !== 'moving') {
      state.liftPhase = 'opening';
      redrawLiftPanel();
      return;
    }
    state.liftDirection = STOPS[idx].y >= state.liftY ? 1 : -1;
    state.liftPhase = state.liftDoorOpen > 0.05 ? 'closing' : 'moving';
    redrawLiftPanel();
  }

  function openDoors() {
    if (state.liftPhase !== 'moving') {
      state.liftPhase = 'opening';
      redrawLiftPanel();
    }
  }

  function closeDoors() {
    if (state.liftPhase !== 'moving') {
      state.liftPhase = 'closing';
      redrawLiftPanel();
    }
  }

  function toggleGate() {
    state.gateOpen = !state.gateOpen;
    return state.gateOpen;
  }

  function findNearestInteractable(pos) {
    if (!pos || !isInTowerFootprint(pos, 4.2)) return null;
    const footY = pos.y - 1.68;

    // 1) Inside Lift Cabin
    if (isInsideLift(pos) && Math.abs(footY - state.liftY) < 1.6) {
      return { kind: 'lift_inside', prompt: '[E / L] Open Elevator Keypad' };
    }
    // 2) Lift Lobby Call Button
    if (isNearLiftLobby(pos)) {
      const fl = nearestFloorIndex(footY);
      return {
        kind: 'lift_call',
        floorIdx: fl,
        prompt: state.liftFloorIndex === fl && state.liftDoorOpen > 0.7
          ? '[E / L] Enter Elevator & Select Floor'
          : `[E] Call Elevator (${STOPS[fl].label})`,
      };
    }
    // 3) Ground Floor Main Car Gate (North)
    if (footY < 2.2 && Math.hypot(pos.x - (GATE_MIN_X + GATE_MAX_X) * 0.5, pos.z - Z0) < 3.4) {
      return {
        kind: 'main_gate',
        prompt: state.gateOpen ? '[E] Close Main Garage Gate' : '[E] Open Main Garage Gate',
      };
    }
    // 4) Ground Floor Pedestrian Lobby Door (East)
    if (footY < 2.2 && Math.hypot(pos.x - X1, pos.z - (PED_MIN_Z + PED_MAX_Z) * 0.5) < 2.6) {
      return {
        kind: 'ped_door',
        prompt: state.pedDoorOpen ? '[E] Close Lobby Door' : '[E] Open Lobby Door (Enter)',
      };
    }
    // 5) Flat Main Door on current floor
    for (const fd of flatDoors) {
      if (Math.abs(footY - fd.y) < 1.4 && Math.hypot(pos.x - fd.x, pos.z - fd.z) < 2.2) {
        return {
          kind: 'flat_door',
          door: fd,
          prompt: fd.open ? `[E] Close ${fd.label}` : `[E] Open ${fd.label} (Enter Flat)`,
        };
      }
    }
    // 6) Openable Thai Sliding Windows on current floor!
    let bestWin = null;
    let bestWinD = 2.35;
    for (const tw of thaiWindows) {
      if (Math.abs(footY - (tw.y - 1.65)) > 1.4) continue;
      const d = Math.hypot(pos.x - tw.x, pos.z - tw.z);
      if (d < bestWinD) {
        bestWinD = d;
        bestWin = tw;
      }
    }
    if (bestWin) {
      return {
        kind: 'thai_window',
        win: bestWin,
        prompt: bestWin.open ? `[E] Close ${bestWin.label}` : `[E] Open ${bestWin.label}`,
      };
    }
    return null;
  }

  function getPrompt(pos) {
    return findNearestInteractable(pos)?.prompt || null;
  }

  function interact(pos) {
    const hit = findNearestInteractable(pos);
    if (!hit) return null;
    if (hit.kind === 'lift_inside') return 'open_lift_keypad';
    if (hit.kind === 'lift_call') {
      goToFloor(hit.floorIdx);
      return 'open_lift_keypad';
    }
    if (hit.kind === 'main_gate') {
      state.gateOpen = !state.gateOpen;
      return 'gate_toggled';
    }
    if (hit.kind === 'ped_door') {
      state.pedDoorOpen = !state.pedDoorOpen;
      return 'door_toggled';
    }
    if (hit.kind === 'flat_door') {
      hit.door.open = !hit.door.open;
      return 'door_toggled';
    }
    if (hit.kind === 'thai_window') {
      hit.win.open = !hit.win.open;
      return 'window_toggled';
    }
    return null;
  }

  function findNearestSeat(pos) {
    if (!isInTowerFootprint(pos, 0.2)) return null;
    const footY = pos.y - 1.68;
    const fl = nearestFloorIndex(footY);
    const list = floorSeats.get(fl);
    if (!list) return null;
    let best = null;
    let bestD = 1.65;
    for (const item of list) {
      const cx = THREE.MathUtils.clamp(pos.x, item.minX, item.maxX);
      const cz = THREE.MathUtils.clamp(pos.z, item.minZ, item.maxZ);
      const d = Math.hypot(pos.x - cx, pos.z - cz);
      if (d < bestD && Math.abs(footY - item.fy) < 1.35) {
        bestD = d;
        best = { ...item, dist: d };
      }
    }
    return best;
  }

  function computeGroundHeight(pos, grounded, verticalVelocity) {
    if (!isInTowerFootprint(pos, 0.2)) return null;
    const footY = pos.y - 1.68;
    const maxStepUp = grounded ? 0.55 : (verticalVelocity > 0 ? 0.08 : 0.38);

    // 1) Inside 3D Lift Cabin
    if (isInsideLift(pos) && Math.abs(footY - state.liftY) < 2.3) {
      return state.liftY;
    }

    let bestY = FLOOR_Y[0];
    // 2) Walkable Staircase (x = 154.55..159.55, z = -503.85..-502.30)
    const inStairs = pos.x >= STAIR_MIN_X && pos.x <= STAIR_MAX_X && pos.z >= STAIR_MIN_Z && pos.z <= STAIR_MAX_Z;
    const inStairHole = pos.x > STAIR_MIN_X + 0.15 && pos.x < STAIR_MAX_X - 0.15 && pos.z >= STAIR_MIN_Z && pos.z <= STAIR_MAX_Z;
    if (inStairs) {
      const t = THREE.MathUtils.clamp((STAIR_MAX_X - 0.15 - pos.x) / (STAIR_MAX_X - STAIR_MIN_X - 0.30), 0, 1);
      for (let k = 0; k < 6; k++) {
        const rampY = FLOOR_Y[k] + t * (FLOOR_Y[k + 1] - FLOOR_Y[k]);
        if (rampY <= footY + maxStepUp) bestY = Math.max(bestY, rampY);
      }
    }

    // 3) Floor slabs k = 0..6 (respect stairwell cutout on upper floors)
    for (let k = 0; k < STOPS.length; k++) {
      const fy = FLOOR_Y[k];
      if (fy > footY + maxStepUp) continue;
      if (k >= 1 && inStairHole) continue;
      bestY = Math.max(bestY, fy);
    }
    return bestY;
  }

  function applyPlayerCollisions(pos, radius, footY) {
    if (!isInTowerFootprint(pos, 2.0)) return;
    const fl = nearestFloorIndex(footY);
    const inStairs = pos.x >= STAIR_MIN_X - 0.1 && pos.x <= STAIR_MAX_X + 0.1 && pos.z >= STAIR_MIN_Z && pos.z <= STAIR_MAX_Z;

    // Full-height Lift Shaft Walls
    resolveCircleAABB(pos, 0.20, LIFT_MIN_X - 0.12, LIFT_MIN_X + 0.08, LIFT_MIN_Z - 0.12, LIFT_MAX_Z + 0.12);
    resolveCircleAABB(pos, 0.20, LIFT_MIN_X - 0.12, LIFT_MAX_X + 0.12, LIFT_MIN_Z - 0.12, LIFT_MIN_Z + 0.08);
    resolveCircleAABB(pos, 0.20, LIFT_MIN_X - 0.12, LIFT_MAX_X + 0.12, LIFT_MAX_Z - 0.08, LIFT_MAX_Z + 0.12);
    resolveCircleAABB(pos, 0.16, LIFT_MAX_X - 0.08, LIFT_MAX_X + 0.10, LIFT_MIN_Z - 0.10, LIFT_DOOR_MIN_Z);
    resolveCircleAABB(pos, 0.16, LIFT_MAX_X - 0.08, LIFT_MAX_X + 0.10, LIFT_DOOR_MAX_Z, LIFT_MAX_Z + 0.10);
    if (!isLiftOpenAtY(footY)) {
      resolveCircleAABB(pos, 0.22, LIFT_MAX_X - 0.08, LIFT_MAX_X + 0.10, LIFT_DOOR_MIN_Z, LIFT_DOOR_MAX_Z);
    }

    if (footY < FLOOR_Y[1] - 0.4) {
      // Ground Floor Exterior Walls + Main Car Gate + Pedestrian Door
      resolveCircleAABB(pos, radius, X0, X0 + 0.28, Z0, Z1);
      resolveCircleAABB(pos, radius, X0, X1, Z1 - 0.28, Z1);
      resolveCircleAABB(pos, radius, X0, GATE_MIN_X, Z0, Z0 + 0.30);
      resolveCircleAABB(pos, radius, GATE_MAX_X, X1, Z0, Z0 + 0.30);
      if (!state.gateOpen) {
        resolveCircleAABB(pos, radius, GATE_MIN_X, GATE_MAX_X, Z0 - 0.08, Z0 + 0.26);
      }
      resolveCircleAABB(pos, radius, X1 - 0.28, X1, Z0, PED_MIN_Z);
      resolveCircleAABB(pos, radius, X1 - 0.28, X1, PED_MAX_Z, Z1);
      if (!state.pedDoorOpen) {
        resolveCircleAABB(pos, radius, X1 - 0.28, X1, PED_MIN_Z, PED_MAX_Z);
      }
    } else if (footY < FLOOR_Y[6] - 0.6) {
      // Apartment Floors 1..5 Exterior & Interior Partition Walls
      resolveCircleAABB(pos, radius, X0, X0 + 0.26, Z0, Z1);
      resolveCircleAABB(pos, radius, X0, X1, Z1 - 0.26, Z1);
      resolveCircleAABB(pos, radius, X0, X1, Z0, Z0 + 0.26);
      resolveCircleAABB(pos, radius, X1 - 0.26, X1, Z0, Z1);

      if (!inStairs) {
        // Lobby-to-Flat wall (doorway 158.1..159.4)
        resolveCircleAABB(pos, radius, X0, 158.10, -506.28, -506.12);
        resolveCircleAABB(pos, radius, 159.40, X1, -506.28, -506.12);
        const fd = flatDoors.find((d) => d.floorIdx === fl);
        if (fd && !fd.open) {
          resolveCircleAABB(pos, radius, fd.collider.minX, fd.collider.maxX, fd.collider.minZ, fd.collider.maxZ);
        }
        // Bedroom / Living partition (doorway -511.6..-510.3)
        resolveCircleAABB(pos, radius, 157.22, 157.38, Z0, -511.60);
        // Bathroom walls (doorway on East -509.2..-508.1)
        resolveCircleAABB(pos, radius, X0, 156.24, -510.18, -510.02);
        resolveCircleAABB(pos, radius, 156.12, 156.28, -510.10, -509.20);
        resolveCircleAABB(pos, radius, 156.12, 156.28, -508.10, -506.24);
      }
      // Stairwell guardrail
      resolveCircleAABB(pos, 0.14, STAIR_MIN_X + 0.10, STAIR_MAX_X - 0.10, STAIR_MIN_Z - 0.04, STAIR_MIN_Z + 0.08);
    } else {
      // Rooftop Parapet Walls
      if (footY - FLOOR_Y[6] < 0.68) {
        resolveCircleAABB(pos, radius, X0, X0 + 0.26, Z0, Z1);
        resolveCircleAABB(pos, radius, X1 - 0.26, X1, Z0, Z1);
        resolveCircleAABB(pos, radius, X0, X1, Z0, Z0 + 0.26);
        resolveCircleAABB(pos, radius, X0, X1, Z1 - 0.26, Z1);
      }
      resolveCircleAABB(pos, radius, 160.08, 160.32, -506.30, Z1);
    }
  }

  // Dedicated Car Collision & Drive-in Garage Handler for src/car.js!
  function applyCarCollisions(carPos, carState) {
    if (!carPos || carPos.x < X0 - 3.5 || carPos.x > X1 + 3.5 || carPos.z < Z0 - 3.5 || carPos.z > Z1 + 3.5) {
      return { hitWall: false, inGarage: false };
    }
    const hw = (carState?.halfWidth || 0.90) + 0.10;
    const hl = (carState?.halfLength || 2.15) * 0.55;
    const r = Math.max(hw, Math.min(hl, 1.05));
    const prevX = carPos.x;
    const prevZ = carPos.z;

    // Exterior solid walls (West, South, East)
    resolveCircleAABB(carPos, r, X0 - 0.10, X0 + 0.30, Z0, Z1);
    resolveCircleAABB(carPos, r, X0, X1, Z1 - 0.30, Z1 + 0.10);
    resolveCircleAABB(carPos, r, X1 - 0.30, X1 + 0.10, Z0, Z1);

    // North front wall flanking the 4.4m Main Car Gate
    resolveCircleAABB(carPos, r, X0, GATE_MIN_X, Z0 - 0.10, Z0 + 0.32);
    resolveCircleAABB(carPos, r, GATE_MAX_X, X1, Z0 - 0.10, Z0 + 0.32);
    if (!state.gateOpen) {
      resolveCircleAABB(carPos, r, GATE_MIN_X, GATE_MAX_X, Z0 - 0.12, Z0 + 0.26);
    }

    // Keep car out of Southwest Lift Shaft & South Staircase
    resolveCircleAABB(carPos, r, LIFT_MIN_X - 0.15, LIFT_MAX_X + 0.15, LIFT_MIN_Z - 0.15, LIFT_MAX_Z + 0.15);
    resolveCircleAABB(carPos, r, STAIR_MIN_X, STAIR_MAX_X, STAIR_MIN_Z, Z1);

    const hitWall = Math.hypot(carPos.x - prevX, carPos.z - prevZ) > 0.002;
    const inGarage = carPos.x >= X0 + 0.2 && carPos.x <= X1 - 0.2 && carPos.z >= Z0 - 0.2 && carPos.z <= Z1 - 0.2;
    if (inGarage) {
      carPos.y = FLOOR_Y[0];
    }
    return { hitWall, inGarage };
  }

  function getZoneName(x, z, footY = 0) {
    if (x < X0 || x > X1 || z < Z0 || z > Z1) return null;
    if (isInsideLift({ x, z })) {
      const stopName = STOPS[state.liftFloorIndex]?.code || 'LIFT';
      return `29 UPPER JESSORE RD · ELEVATOR CABIN (${stopName})`;
    }
    if (footY < FLOOR_Y[1] - 0.6) {
      return '29 UPPER JESSORE RD · GROUND GARAGE & LOBBY';
    }
    if (footY >= FLOOR_Y[6] - 0.6) {
      return '29 UPPER JESSORE RD · ROOFTOP TERRACE';
    }
    const fl = nearestFloorIndex(footY);
    if (z > -506.2) return `29 UPPER JESSORE RD (FLOOR ${fl + 1}) · LIFT & STAIR LOBBY`;
    if (z < -510.1) {
      return x >= 157.3
        ? `29 UPPER JESSORE RD (FLOOR ${fl + 1}) · LIVING ROOM & SMART TV`
        : `29 UPPER JESSORE RD (FLOOR ${fl + 1}) · MASTER BEDROOM`;
    }
    return x >= 156.2
      ? `29 UPPER JESSORE RD (FLOOR ${fl + 1}) · DINING & KITCHEN`
      : `29 UPPER JESSORE RD (FLOOR ${fl + 1}) · ATTACHED BATHROOM`;
  }

  function update(delta, playerPos = null, isLow = false) {
    const dt = Math.min(delta, 0.05);
    const nearTower = !playerPos || ((playerPos.x - CX) ** 2 + (playerPos.z - CZ) ** 2) < 260 * 260;
    if (root.visible !== nearTower) root.visible = nearTower;
    if (!nearTower) return;

    // 1) Animate Main Car Gate (swings open inward into garage cleanly!)
    const targetGateA = state.gateOpen ? Math.PI * 0.52 : 0;
    if (Math.abs(targetGateA - state.gateAngle) > 0.001) {
      state.gateAngle += (targetGateA - state.gateAngle) * Math.min(1, dt * 5.8);
      gateLeafLeft.rotation.y = -state.gateAngle;
      gateLeafRight.rotation.y = state.gateAngle;
    }

    // 2) Animate Pedestrian Lobby Door
    const targetPedA = state.pedDoorOpen ? -Math.PI * 0.54 : 0;
    if (Math.abs(targetPedA - state.pedDoorAngle) > 0.001) {
      state.pedDoorAngle += (targetPedA - state.pedDoorAngle) * Math.min(1, dt * 6.5);
      pedDoorPivot.rotation.y = state.pedDoorAngle;
    }

    // 3) Animate Flat Doors
    for (const fd of flatDoors) {
      const tgt = fd.open ? fd.openAngle : 0;
      if (Math.abs(tgt - fd.angle) > 0.001) {
        fd.angle += (tgt - fd.angle) * Math.min(1, dt * 6.5);
        fd.pivot.rotation.y = fd.angle;
      }
    }

    // 4) Animate Sliding Thai Windows
    for (const tw of thaiWindows) {
      const tgt = tw.open ? 1 : 0;
      if (Math.abs(tgt - tw.progress) > 0.001) {
        tw.progress += (tgt - tw.progress) * Math.min(1, dt * 6.8);
        const val = THREE.MathUtils.lerp(tw.closedPos, tw.openPos, tw.progress);
        if (tw.axis === 'X') tw.mesh.position.x = val;
        else tw.mesh.position.z = val;
      }
    }

    // 5) Animate 3D Passenger Lift & Doors
    const doorSpeed = 1.6;
    let panelDirty = false;
    if (state.liftPhase === 'closing') {
      state.liftDoorOpen = Math.max(0, state.liftDoorOpen - doorSpeed * dt);
      if (state.liftDoorOpen <= 0.01) {
        state.liftDoorOpen = 0;
        if (state.liftTargetIndex !== state.liftFloorIndex) {
          state.liftPhase = 'moving';
        } else {
          state.liftPhase = 'idle';
        }
        panelDirty = true;
      }
    } else if (state.liftPhase === 'moving') {
      const targetY = STOPS[state.liftTargetIndex].y;
      const diff = targetY - state.liftY;
      const liftSpeed = 4.2;
      const prevIdx = state.liftFloorIndex;
      if (Math.abs(diff) <= liftSpeed * dt) {
        state.liftY = targetY;
        state.liftFloorIndex = state.liftTargetIndex;
        state.liftDirection = 0;
        state.liftPhase = 'opening';
        panelDirty = true;
      } else {
        state.liftY += Math.sign(diff) * liftSpeed * dt;
        state.liftFloorIndex = nearestFloorIndex(state.liftY);
        if (state.liftFloorIndex !== prevIdx) panelDirty = true;
      }
    } else if (state.liftPhase === 'opening') {
      state.liftDoorOpen = Math.min(1, state.liftDoorOpen + doorSpeed * dt);
      if (state.liftDoorOpen >= 0.99) {
        state.liftDoorOpen = 1;
        state.liftPhase = 'idle';
        panelDirty = true;
      }
    }
    if (panelDirty) redrawLiftPanel();
    liftCabin.position.y = state.liftY;
    const slideOff = state.liftDoorOpen * (liftDoorW * 0.88);
    liftDoorLeft.position.z = -liftDoorW * 0.5 - slideOff;
    liftDoorRight.position.z = liftDoorW * 0.5 + slideOff;

    // 6) Per-floor Interior Visibility Culling (keeps 60-120 FPS!)
    const pFootY = playerPos ? (playerPos.y - 1.68) : 0;
    const distSq = playerPos ? ((playerPos.x - CX) ** 2 + (playerPos.z - CZ) ** 2) : 0;
    const nearInt = distSq < 54 * 54;
    const curFl = nearestFloorIndex(pFootY);
    for (let k = 1; k <= 5; k++) {
      const grp = floorInteriorGroups[k];
      if (!grp) continue;
      const want = nearInt && (Math.abs(curFl - k) <= 1 || distSq < 26 * 26);
      if (grp.visible !== want) grp.visible = want;
    }

    if (!isLow && nearInt) {
      const rotD = dt * 6.0;
      for (const f of animatedFans) {
        if (Math.abs(curFl - f.floorIdx) <= 1) f.rotor.rotation.y += rotD;
      }
    }
  }

  return {
    group: root,
    state,
    stops: STOPS,
    liftCabinCenter: { x: LIFT_CX, z: LIFT_CZ },
    liftExitPos: { x: LIFT_MAX_X + 0.95, z: LIFT_CZ },
    isInTowerFootprint,
    isInsideAnyRoom(pos) {
      return isInTowerFootprint(pos, -0.05);
    },
    isInsideLift,
    isNearLiftLobby,
    isLiftOpenAtY,
    nearestFloorIndex,
    goToFloor,
    openDoors,
    closeDoors,
    toggleGate,
    getPrompt,
    interact,
    findNearestSeat,
    computeGroundHeight,
    applyPlayerCollisions,
    applyCarCollisions,
    getZoneName,
    update,
  };
}
