import * as THREE from 'three';
import { box, cylinder, rodBetween, mergeStaticMeshes } from './scene-utils.js';
import { createHajiMaterials, buildSkArshanTower, buildFakirBariLane } from './sk-arshan-tower.js';

function createRedPaverTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#9e5a4b';
  ctx.fillRect(0, 0, 256, 256);

  const brickW = 64;
  const brickH = 32;
  const shades = ['#b56553', '#a85a48', '#bf6d5a', '#9c5242'];
  for (let row = 0; row < 8; row++) {
    const offset = (row % 2) * (brickW / 2);
    for (let col = -1; col < 5; col++) {
      const x = col * brickW + offset;
      const y = row * brickH;
      ctx.fillStyle = shades[(row + col + 4) % shades.length];
      ctx.fillRect(x + 2, y + 2, brickW - 4, brickH - 4);
      ctx.strokeStyle = '#753d31';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, brickW - 2, brickH - 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createShutterTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#7d6250';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 8) {
    ctx.fillStyle = '#947662';
    ctx.fillRect(0, y, 256, 3);
    ctx.fillStyle = '#5c4637';
    ctx.fillRect(0, y + 5, 256, 3);
  }
  // Subtle weathered rust/dust streaks
  ctx.fillStyle = 'rgba(140, 82, 50, 0.18)';
  ctx.fillRect(24, 0, 48, 256);
  ctx.fillRect(160, 0, 55, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createGraniteTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#232629';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const px = x * 64;
      const py = y * 64;
      ctx.fillStyle = (x + y) % 2 === 0 ? '#2b2f33' : '#24272a';
      ctx.fillRect(px + 1, py + 1, 62, 62);
      ctx.strokeStyle = '#17191b';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 1, py + 1, 62, 62);
    }
  }
  // Granite speckles
  ctx.fillStyle = 'rgba(255,255,255,0.09)';
  for (let i = 0; i < 220; i++) {
    ctx.fillRect((i * 73) % 256, (i * 139) % 256, 2, 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createASBSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f4f6f4';
  ctx.fillRect(0, 0, 512, 320);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 496, 304);

  // Red bold title: AVIJIT'S
  ctx.fillStyle = '#b91c1c';
  ctx.font = '900 84px Arial';
  ctx.textAlign = 'center';
  ctx.fillText("AVIJIT'S", 256, 108);

  // Black subtitle: SPECIAL BATCH (ASB)
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 38px Arial';
  ctx.fillText('SPECIAL BATCH (ASB)', 256, 174);

  // Green bottom arrow bar with Bengali phone number
  ctx.fillStyle = '#064e3b';
  ctx.beginPath();
  ctx.moveTo(36, 244);
  ctx.lineTo(84, 210);
  ctx.lineTo(84, 224);
  ctx.lineTo(468, 224);
  ctx.lineTo(468, 268);
  ctx.lineTo(84, 268);
  ctx.lineTo(84, 282);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ecfdf5';
  ctx.font = 'bold 34px Arial';
  ctx.fillText('০১৭১৭-১২৫৩৬৫', 275, 258);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createHamidBillboardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 512, 320);
  grad.addColorStop(0, '#0a2e6e');
  grad.addColorStop(0.6, '#1d4ed8');
  grad.addColorStop(1, '#065f46');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 320);

  // Architectural tower silhouette on the left side of billboard
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(42, 48, 95, 235);
  ctx.fillStyle = '#f59e0b';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 3; c++) {
      ctx.fillRect(54 + c * 26, 62 + r * 26, 18, 16);
    }
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px Arial';
  ctx.fillText('HAMID', 200, 118);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 28px Arial';
  ctx.fillText('PROPERTIES LTD.', 200, 162);
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 26px Arial';
  ctx.fillText('হাজী মহসিন রোড, খুলনা', 200, 212);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('LUXURY APARTMENTS', 200, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createPoleSignTexture(type) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');

  if (type === 'mcsk') {
    // Yellow & Red "ক্যাডেট MCSK গাইড" sign
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 0, 256, 360);
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 244, 348);

    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ক্যাডেট', 128, 76);

    ctx.fillStyle = '#15803d';
    ctx.font = '900 44px Arial';
    ctx.fillText('MCSK', 128, 136);

    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(16, 165, 224, 72);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 38px Arial';
    ctx.fillText('প্রাইভেট প্রোগ্রাম', 128, 214);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('হাজী মহসিন রোড, খুলনা', 128, 280);
    ctx.fillText('০১৭১২-৮৫২০৩৫', 128, 322);
  } else {
    // White, Red & Blue "SHETU'S SPECIAL" sign
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 360);

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, 256, 68);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("SHETU'S", 128, 46);

    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 26px Arial';
    ctx.fillText('SPECIAL BATCH', 128, 108);

    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(172, 196, 48, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('ভর্তি চলছে!', 72, 196);

    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(0, 296, 256, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('হাজী মহসিন রোড, খুলনা', 128, 336);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBalconyBannerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, '#fef9c3');
  grad.addColorStop(0.5, '#ffffff');
  grad.addColorStop(1, '#e0f2fe');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 240);

  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 10;
  ctx.strokeRect(6, 6, 500, 228);

  ctx.fillStyle = '#d97706';
  ctx.font = 'bold 46px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('দারুল কুরআন একাডেমি', 256, 76);

  ctx.fillStyle = '#0369a1';
  ctx.font = 'bold 30px Arial';
  ctx.fillText('হাজী মহসিন রোড · টুটপাড়া, খুলনা', 256, 132);

  // Colorful circular badges like the real balcony banner
  const badgeColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
  for (let i = 0; i < badgeColors.length; i++) {
    ctx.fillStyle = badgeColors[i];
    ctx.beginPath();
    ctx.arc(96 + i * 64, 186, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createMilkVitaShopSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 500, 148);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('মিল্ক ভিটা ও ডেইরি শপ', 256, 74);
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 28px Arial';
  ctx.fillText('MILK VITA SALES CENTER · হাজী মহসিন রোড', 256, 124);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds the parked Blue & Black Commuter Motorcycle on the red-brick sidewalk
 * in front of the 6-story modern white building (matching Google Street View).
 */
function buildParkedMotorcycle(parent, m, x, z) {
  const bike = new THREE.Group();
  bike.position.set(x, 0.08, z);
  bike.rotation.y = 0.38;
  parent.add(bike);

  const bluePaint = new THREE.MeshLambertMaterial({ color: 0x1d4ed8 });
  const tireMat = new THREE.MeshLambertMaterial({ color: 0x17191c });

  // Front & Rear Wheels
  for (const wz of [-0.62, 0.62]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.09, 16), tireMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0, 0.31, wz);
    bike.add(wheel);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.095, 12), m.chrome);
    rim.rotation.z = Math.PI / 2;
    rim.position.set(0, 0.31, wz);
    bike.add(rim);
  }

  // Front forks & handlebars
  rodBetween(bike, [-0.08, 0.31, 0.62], [-0.08, 0.96, 0.38], 0.022, m.chrome, 8);
  rodBetween(bike, [0.08, 0.31, 0.62], [0.08, 0.96, 0.38], 0.022, m.chrome, 8);
  rodBetween(bike, [-0.36, 1.02, 0.36], [0.36, 1.02, 0.36], 0.018, m.chrome, 8);
  // Headlight & Blue Cowl
  box(bike, [0.22, 0.24, 0.20], [0, 0.86, 0.48], bluePaint);
  box(bike, [0.16, 0.14, 0.04], [0, 0.85, 0.59], m.lamp);

  // Sculpted Blue Fuel Tank & Side Panels
  box(bike, [0.30, 0.26, 0.52], [0, 0.78, 0.08], bluePaint);
  box(bike, [0.24, 0.18, 0.38], [0, 0.58, -0.12], bluePaint);
  // Engine Block & Chrome Exhaust Pipe
  box(bike, [0.22, 0.28, 0.32], [0, 0.42, 0.06], m.darkMetal);
  rodBetween(bike, [0.13, 0.32, 0.12], [0.15, 0.38, -0.68], 0.042, m.chrome, 10);

  // Black Padded Rider & Pillion Seat + Rear Grab Rail
  box(bike, [0.26, 0.12, 0.68], [0, 0.75, -0.38], m.blackTile);
  box(bike, [0.22, 0.10, 0.22], [0, 0.78, -0.68], bluePaint);
  // Side Kickstand
  rodBetween(bike, [-0.10, 0.32, -0.05], [-0.26, 0.0, -0.08], 0.015, m.darkMetal, 6);
}

/**
 * Builds a traditional Khulna 3-Wheeler Cycle Rickshaw on Haji Mohsin Road.
 */
function buildCycleRickshaw(parent, m, x, z) {
  const rickshaw = new THREE.Group();
  rickshaw.position.set(x, 0, z);
  rickshaw.rotation.y = Math.PI; // Facing south down Haji Mohsin Road
  parent.add(rickshaw);

  const tireMat = new THREE.MeshLambertMaterial({ color: 0x1c1e21 });
  const hoodMat = new THREE.MeshLambertMaterial({ color: 0x2b2927, side: THREE.DoubleSide });
  const seatMat = new THREE.MeshLambertMaterial({ color: 0x991b1b });
  const frameGreen = new THREE.MeshLambertMaterial({ color: 0x15803d });

  // 2 Rear Wheels + 1 Front Wheel
  for (const [wx, wz] of [[-0.54, -0.55], [0.54, -0.55], [0, 0.85]]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.05, 18), tireMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.38, wz);
    rickshaw.add(wheel);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.055, 12), m.chrome);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(wx, 0.38, wz);
    rickshaw.add(hub);
  }

  // Rear axle, chassis & footboard
  rodBetween(rickshaw, [-0.54, 0.38, -0.55], [0.54, 0.38, -0.55], 0.025, m.darkMetal, 8);
  rodBetween(rickshaw, [0, 0.38, -0.55], [0, 0.52, 0.72], 0.03, frameGreen, 8);
  box(rickshaw, [0.96, 0.05, 0.65], [0, 0.48, -0.32], m.wood);

  // Passenger Seat, Armrests & Colorful Tin Backrest
  box(rickshaw, [0.92, 0.14, 0.46], [0, 0.72, -0.52], seatMat);
  box(rickshaw, [0.92, 0.48, 0.06], [0, 1.02, -0.74], frameGreen);
  box(rickshaw, [0.76, 0.34, 0.07], [0, 1.02, -0.74], m.cushionMat);
  for (const sx of [-0.46, 0.46]) {
    box(rickshaw, [0.06, 0.32, 0.48], [sx, 0.90, -0.52], seatMat);
  }

  // Raised Black Vinyl Rickshaw Hood (হুড)
  box(rickshaw, [1.00, 0.06, 0.82], [0, 1.66, -0.45], hoodMat);
  box(rickshaw, [1.00, 0.52, 0.05], [0, 1.42, -0.82], hoodMat);
  for (const sx of [-0.47, 0.47]) {
    rodBetween(rickshaw, [sx, 0.92, -0.72], [sx, 1.65, -0.78], 0.015, m.chrome, 6);
    rodBetween(rickshaw, [sx, 0.92, -0.35], [sx, 1.65, -0.10], 0.015, m.chrome, 6);
  }

  // Front steering fork, bicycle saddle & handlebars
  rodBetween(rickshaw, [0, 0.38, 0.85], [0, 1.08, 0.68], 0.024, frameGreen, 8);
  rodBetween(rickshaw, [-0.28, 1.10, 0.66], [0.28, 1.10, 0.66], 0.018, m.chrome, 8);
  box(rickshaw, [0.18, 0.06, 0.24], [0, 0.90, 0.28], m.blackTile);
  rodBetween(rickshaw, [0, 0.48, 0.28], [0, 0.88, 0.28], 0.02, frameGreen, 6);
}

/**
 * Builds the complete Haji Mohsin Road (হাজী মহসিন রোড, খুলনা) neighborhood block
 * directly adjacent to the Taltola 5-Story House (z = +7.4 to +42, and across the street x < -2.0).
 */
export function buildHajiMohsinRoad(parent, m) {
  const staticGroup = new THREE.Group();
  staticGroup.name = 'HajiMohsinRoadBlock';
  parent.add(staticGroup);

  const dynamicGroup = new THREE.Group();
  dynamicGroup.name = 'HajiMohsinRoadSignboardsAndVehicles';
  parent.add(dynamicGroup);

  // Photo-matched materials extracted from Street View (see sk-arshan-tower.js)
  const hm = createHajiMaterials();
  const redPaverMat = hm.pavers;

  const shutterMat = new THREE.MeshLambertMaterial({ map: createShutterTexture() });
  shutterMat.userData.uvScale = 1.8;

  const graniteMat = new THREE.MeshLambertMaterial({ map: createGraniteTexture() });
  graniteMat.userData.uvScale = 1.5;

  const mintWallMat = new THREE.MeshLambertMaterial({ color: 0xb8d4cc });
  const darkMintMat = new THREE.MeshLambertMaterial({ color: 0x7fa39a });
  const modernStuccoMat = new THREE.MeshLambertMaterial({ color: 0xf4f6f8 });
  const modernGreyMat = new THREE.MeshLambertMaterial({ color: 0x646a73 });
  const blueGlassMat = new THREE.MeshLambertMaterial({ color: 0x2563eb, transparent: true, opacity: 0.58 });
  const redTileMat = new THREE.MeshLambertMaterial({ color: 0xa8382b });
  const ornateGateMat = new THREE.MeshLambertMaterial({ color: 0x4a3228 });
  const adBlueMat = new THREE.MeshLambertMaterial({ color: 0x2557a7 });
  const adYellowMat = new THREE.MeshLambertMaterial({ color: 0xd4b838 });
  const cypressLeafMat = new THREE.MeshLambertMaterial({ color: 0x23472b });

  // ============================================================================
  // 1. RED-BRICK HERRINGBONE SIDEWALKS (লাল ইটের ফুটপাত) & MANHOLE COVERS
  // ============================================================================
  // East Sidewalk (z = 7.35 .. 42.0, x = 2.08 .. 3.28) right beside Taltola House
  box(staticGroup, [1.22, 0.14, 34.6], [2.66, 0.02, 24.65], redPaverMat, { uvScale: 2.4 });
  // West Sidewalk North of Fakir Bari Lane (z = -40.0 .. 10.2, x = -2.08 .. -3.12)
  box(staticGroup, [1.08, 0.14, 50.2], [-2.58, 0.02, -14.9], redPaverMat, { uvScale: 2.4 });
  // West Sidewalk South of Fakir Bari Lane (z = 14.2 .. 42.0, x = -2.08 .. -3.28)
  box(staticGroup, [1.22, 0.14, 27.8], [-2.66, 0.02, 28.1], redPaverMat, { uvScale: 2.4 });

  // Concrete Storm-Drain Manhole Covers along both sidewalks (matching Street View)
  for (const [mx, mz] of [[2.28, 11.2], [2.28, 22.4], [2.28, 33.0], [-2.28, 8.2], [-2.28, 19.5], [-2.28, 31.0]]) {
    box(staticGroup, [0.76, 0.16, 0.82], [mx, 0.025, mz], m.concrete);
    cylinder(staticGroup, 0.24, 0.24, 0.02, [mx, 0.105, mz], m.darkConcrete, 14);
  }

  // ============================================================================
  // 2. FAKIR BARI LANE — WALKABLE CONCRETE SIDE ALLEY (পশ্চিম পাশের গলি: z = 10.2..14.2)
  // ============================================================================
  // Rebuilt 1:1 from Street View: concrete paving, real weathered wall, rubble, old buildings down the lane
  buildFakirBariLane(staticGroup, m, hm);
  // Red-brick threshold apron where the side alley meets Haji Mohsin Road
  box(staticGroup, [1.10, 0.14, 4.0], [-2.58, 0.02, 12.2], redPaverMat, { uvScale: 2.4 });

  // ============================================================================
  // 3. WEATHERED BRICK & PLASTER WALL + BLUE/YELLOW WALL ADS (z = -10.0 .. +10.2)
  // ============================================================================
  // Main aged boundary wall along x = -3.12 (z = -10.0 .. +10.2)
  box(staticGroup, [0.28, 2.15, 20.2], [-3.12, 1.075, 0.1], hm.weatheredWall);
  box(staticGroup, [0.36, 0.10, 20.3], [-3.12, 2.18, 0.1], m.darkConcrete);
  // (Lane-side return wall, blue/yellow paint patches & exposed brick are now part of the real photo texture)

  // Brick pillars along the weathered wall + wire mesh fence posts on top
  for (let z = -9.8; z <= 10.1; z += 3.3) {
    box(staticGroup, [0.40, 2.26, 0.38], [-3.10, 1.13, z], hm.weatheredWall);
    rodBetween(staticGroup, [-3.08, 2.20, z], [-3.08, 2.75, z], 0.018, m.darkMetal, 6);
  }
  rodBetween(staticGroup, [-3.08, 2.48, -9.8], [-3.08, 2.48, 10.1], 0.012, m.darkMetal, 6);
  rodBetween(staticGroup, [-3.08, 2.72, -9.8], [-3.08, 2.72, 10.1], 0.012, m.darkMetal, 6);

  // Corner concrete rubble slabs beside the alley entrance (matching step_16_media_0.png)
  box(staticGroup, [0.62, 0.10, 0.78], [-3.15, 0.12, 10.42], m.concrete);
  box(staticGroup, [0.48, 0.12, 0.52], [-3.35, 0.20, 10.35], m.darkConcrete);

  // Twin Utility Poles at the Alley Corner with "ক্যাডেট MCSK গাইড" & "SHETU'S SPECIAL" Signboards!
  for (const pz of [9.15, 9.95]) {
    cylinder(staticGroup, 0.10, 0.14, 8.8, [-2.26, 4.4, pz], m.concrete, 10);
    // White/blue paper flyers wrapped around the lower pole
    cylinder(staticGroup, 0.135, 0.145, 2.1, [-2.26, 1.25, pz], m.whiteBand, 10);
  }
  const mcskSignMat = hm.signMcsk;
  const shetuSignMat = hm.signShetu;

  const mcskSign = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.22), mcskSignMat);
  mcskSign.rotation.y = Math.PI / 2;
  mcskSign.position.set(-2.12, 3.15, 9.15);
  dynamicGroup.add(mcskSign);

  const shetuSign = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.2), shetuSignMat);
  shetuSign.rotation.y = Math.PI / 2;
  shetuSign.position.set(-2.12, 3.2, 9.95);
  dynamicGroup.add(shetuSign);

  // Older 2-story house visible behind the weathered wall & mango trees (x = -7.8, z = 4.5)
  box(staticGroup, [6.5, 6.4, 8.8], [-8.2, 3.2, 4.2], m.concrete);
  box(staticGroup, [6.8, 0.25, 9.1], [-8.2, 6.45, 4.2], m.darkConcrete);

  // ============================================================================
  // 4. SK ARSHAN ALIF TOWER — 35 HAJI MOHSIN RD (G+9, rebuilt 1:1 from Street View)
  // ============================================================================
  const skArshanTower = buildSkArshanTower(staticGroup, dynamicGroup, m, hm);

  // ============================================================================
  // 5. EAST SIDE: PLANTER BOX, SAGO PALMS & TALL CONICAL PINE/THUJA TREE (z = 7.4..11.2)
  // ============================================================================
  // Raised Beige Stone Planter right next to the 5-Story Taltola House
  box(staticGroup, [1.15, 0.68, 3.65], [3.55, 0.34, 9.30], m.trim);
  box(staticGroup, [0.95, 0.12, 3.45], [3.55, 0.64, 9.30], m.moss);

  // 2 Sago Palms (সাইকাস গাছ) in the planter
  for (const sz of [8.15, 9.25]) {
    cylinder(staticGroup, 0.14, 0.18, 0.55, [3.55, 0.85, sz], m.trunk, 8);
    for (let f = 0; f < 10; f++) {
      const ang = (f / 10) * Math.PI * 2;
      const fx = 3.55 + Math.cos(ang) * 0.55;
      const fz = sz + Math.sin(ang) * 0.55;
      rodBetween(staticGroup, [3.55, 1.12, sz], [fx, 1.48, fz], 0.045, cypressLeafMat, 6);
    }
  }
  // Tall Conical Evergreen Pine / Thuja Tree (ঝাউ গাছ) at z = 10.45 (matching step_10_media_0.png)
  cylinder(staticGroup, 0.12, 0.20, 7.5, [3.65, 3.75, 10.45], m.trunk, 8);
  for (let tier = 0; tier < 7; tier++) {
    const ty = 2.0 + tier * 0.88;
    const rad = 1.45 - tier * 0.17;
    cylinder(staticGroup, rad * 0.35, rad, 1.35, [3.65, ty, 10.45], cypressLeafMat, 10);
  }

  // ============================================================================
  // 6. EAST SIDE: 4 CORRUGATED SHUTTER SHOPS & OPEN RENOVATION STALL (z = 11.3 .. 20.6)
  // ============================================================================
  // Main 1-Story Commercial Structure (x = 3.25 .. 7.80, z = 11.3 .. 20.6)
  box(staticGroup, [4.4, 3.25, 9.3], [5.55, 1.625, 15.95], m.concrete);
  // Rough Weathered Concrete Roof Parapet & Awning Lip overhanging the red-brick sidewalk
  box(staticGroup, [5.1, 0.28, 9.5], [5.20, 3.32, 15.95], m.darkConcrete);
  box(staticGroup, [0.18, 0.48, 9.5], [2.72, 3.58, 15.95], m.concrete);
  // Blue plastic ribbons tied along the rough concrete cornice (exact detail from step_12_media_0.png!)
  for (const rz of [12.4, 14.5, 16.8, 18.6, 19.9]) {
    box(staticGroup, [0.06, 0.42, 0.08], [2.62, 3.55, rz], m.blueTarp);
  }

  // 4 Shop Bays:
  // Bay 1 (z = 11.5..13.7), Bay 2 (z = 13.8..16.0), Bay 3 (z = 16.1..18.2 - HALF OPEN!), Bay 4 (z = 18.3..20.5)
  for (const [idx, bz] of [[0, 12.6], [1, 14.9], [2, 17.15], [3, 19.4]]) {
    // Rusty brown steel divider posts
    box(staticGroup, [0.14, 3.15, 0.12], [3.32, 1.58, bz - 1.12], m.orange);
    if (idx === 2) {
      // Bay 3: Half-open shutter at top + open bottom exposing renovation concrete floor & red brick rubble!
      box(staticGroup, [0.08, 1.45, 2.16], [3.36, 2.42, bz], shutterMat, { uvScale: 1.5 });
      // Recessed interior shop room
      box(staticGroup, [2.8, 0.16, 2.15], [4.75, 0.14, bz], m.concrete);
      box(staticGroup, [2.8, 3.0, 0.14], [4.75, 1.6, bz - 1.08], m.wall);
      box(staticGroup, [2.8, 3.0, 0.14], [4.75, 1.6, bz + 1.08], m.wall);
      box(staticGroup, [0.14, 3.0, 2.15], [6.10, 1.6, bz], m.brick);
      // Pile of broken red brick rubble inside the open stall
      for (const [rx, ry, rz] of [
        [3.95, 0.26, bz + 0.35], [4.25, 0.30, bz + 0.55], [4.55, 0.34, bz + 0.25],
        [4.10, 0.25, bz - 0.15], [4.45, 0.28, bz + 0.68], [4.75, 0.32, bz + 0.42],
      ]) {
        box(staticGroup, [0.28, 0.14, 0.22], [rx, ry, rz], m.brick);
      }
    } else {
      // Closed full-height corrugated brown roller shutter
      box(staticGroup, [0.08, 3.05, 2.16], [3.36, 1.58, bz], shutterMat, { uvScale: 1.5 });
    }
  }
  box(staticGroup, [0.14, 3.15, 0.12], [3.32, 1.58, 20.52], m.orange);

  // ============================================================================
  // 7. "AVIJIT'S SPECIAL BATCH (ASB)" COMPOUND, ORNATE GATE & MINT BUILDING (z = 20.7 .. 34.0)
  // ============================================================================
  // Walkable ASB Courtyard Slab (x = 3.2 .. 14.5, z = 20.7 .. 26.8)
  box(staticGroup, [11.5, 0.12, 6.2], [8.85, 0.02, 23.8], m.courtyard, { uvScale: 2.0 });

  // Low White Compound Side Wall with Diamond Ventilation (along z = 20.7, x = 3.35 .. 7.8)
  box(staticGroup, [4.5, 1.65, 0.22], [5.55, 0.825, 20.72], m.wall);
  box(staticGroup, [4.6, 0.10, 0.28], [5.55, 1.68, 20.72], m.darkConcrete);

  // Red-Ceramic-Tiled Gate Pillars at x = 3.35, z = 23.6 and z = 26.6
  for (const gz of [23.6, 26.6]) {
    box(staticGroup, [0.58, 2.35, 0.58], [3.35, 1.175, gz], redTileMat);
    box(staticGroup, [0.64, 0.10, 0.64], [3.35, 2.38, gz], m.trim);
  }

  // Ornate Dark-Brown Iron Gate Wing swung open at z = 20.85 .. 23.5 (matching step_14_media_0.png!)
  box(staticGroup, [0.06, 1.52, 2.15], [3.08, 0.92, 22.35], ornateGateMat);
  rodBetween(staticGroup, [3.08, 1.76, 21.28], [3.08, 1.76, 23.42], 0.02, ornateGateMat, 8);
  rodBetween(staticGroup, [3.08, 0.16, 21.28], [3.08, 0.16, 23.42], 0.02, ornateGateMat, 8);
  for (let gz = 21.35; gz <= 23.35; gz += 0.28) {
    rodBetween(staticGroup, [3.08, 1.68, gz], [3.08, 1.88, gz], 0.014, m.rail, 6);
  }

  // Prominent Perpendicular Signboard: "AVIJIT'S SPECIAL BATCH (ASB)" (০১৭১৭-১২৫৩৬৫)
  const asbSignMat = new THREE.MeshBasicMaterial({ map: createASBSignTexture(), side: THREE.DoubleSide });
  const asbSign = new THREE.Mesh(new THREE.PlaneGeometry(1.52, 0.96), asbSignMat);
  asbSign.position.set(2.82, 2.86, 20.72);
  // Faces North/South perpendicular to the street just like in Street View!
  dynamicGroup.add(asbSign);
  // Black metal frame & bracket holding the ASB sign
  rodBetween(staticGroup, [2.05, 3.35, 20.72], [3.45, 3.35, 20.72], 0.022, m.darkMetal, 6);
  rodBetween(staticGroup, [2.05, 2.36, 20.72], [3.45, 2.36, 20.72], 0.022, m.darkMetal, 6);

  // 4-Story Pale Seafoam-Green Residential / Coaching Building inside Compound (x = 7.4..14.8, z = 21.5..33.5)
  box(staticGroup, [7.2, 12.2, 12.0], [11.0, 6.1, 27.5], mintWallMat);
  for (const fy of [3.05, 6.10, 9.15, 12.20]) {
    box(staticGroup, [7.5, 0.22, 12.3], [10.95, fy, 27.5], darkMintMat);
    for (const wz of [23.5, 27.5, 31.2]) {
      box(staticGroup, [0.12, 1.45, 1.85], [7.36, fy - 1.45, wz], m.glass);
      box(staticGroup, [0.45, 0.10, 2.15], [7.20, fy - 0.65, wz], darkMintMat);
    }
  }

  // Large Blue "HAMID PROPERTIES" Real-Estate Billboard mounted on the Mint Building Facade
  const hamidMat = new THREE.MeshBasicMaterial({ map: createHamidBillboardTexture(), side: THREE.DoubleSide });
  const hamidBoard = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.4), hamidMat);
  hamidBoard.rotation.y = -Math.PI / 2;
  hamidBoard.position.set(7.22, 4.45, 26.8);
  dynamicGroup.add(hamidBoard);

  // Tall 7-Story Modern Blue-Glass & Grey Apartment Tower rising behind the Mint Building (x = 15.5, z = 26.5)
  box(staticGroup, [9.5, 22.5, 14.0], [18.5, 11.25, 26.5], modernGreyMat);
  for (let ly = 3.2; ly <= 20.5; ly += 3.0) {
    box(staticGroup, [0.25, 0.22, 14.2], [13.7, ly, 26.5], modernStuccoMat);
    for (const wz of [22.0, 26.5, 31.0]) {
      box(staticGroup, [0.12, 1.65, 2.4], [13.72, ly - 1.3, wz], blueGlassMat);
    }
  }

  // ============================================================================
  // 8. FURTHER SOUTH TOWARD KABORKHANA MOR: MILK VITA SHOP & UNDER-CONSTRUCTION BUILDING
  // ============================================================================
  // East Side: Local Shop Strip with Red Signboard ("মিল্ক ভিটা ও ডেইরি শপ", z = 27.0 .. 37.5)
  box(staticGroup, [3.8, 3.4, 10.2], [5.1, 1.7, 32.2], m.warmPlaster);
  box(staticGroup, [4.4, 0.22, 10.5], [4.8, 3.45, 32.2], m.trim);
  for (const sz of [29.2, 32.2, 35.2]) {
    box(staticGroup, [0.08, 2.75, 2.35], [3.18, 1.42, sz], shutterMat);
  }
  const milkVitaMat = new THREE.MeshBasicMaterial({ map: createMilkVitaShopSignTexture(), side: THREE.DoubleSide });
  const milkVitaSign = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.95), milkVitaMat);
  milkVitaSign.rotation.y = -Math.PI / 2;
  milkVitaSign.position.set(2.58, 3.72, 30.8);
  dynamicGroup.add(milkVitaSign);

  // West Side: 4-Story Under-Construction Concrete Frame Building (z = 29.2 .. 39.5, x = -4.2 .. -12.0)
  // Raw grey concrete floor slabs & open columns (matching step_14_media_0.png background!)
  for (let cLvl = 0; cLvl < 4; cLvl++) {
    const cy = cLvl * 3.1;
    box(staticGroup, [7.6, 0.24, 10.0], [-8.0, cy + 3.0, 34.2], m.darkConcrete);
    for (const cx of [-4.5, -7.8, -11.2]) {
      for (const cz of [29.6, 34.2, 38.8]) {
        box(staticGroup, [0.38, 3.0, 0.38], [cx, cy + 1.5, cz], m.concrete);
      }
    }
  }
  // Brick infill wall on ground floor of under-construction building
  box(staticGroup, [0.24, 2.8, 9.6], [-4.5, 1.4, 34.2], m.brick);

  // ============================================================================
  // 9. UTILITY POLES, TANGLED CABLE SPOOLS & STREET VEHICLES (মোটরসাইকেল ও রিকশা)
  // ============================================================================
  // East Side Concrete Utility Pole right outside ASB Gate (x = 2.28, z = 23.8) with Flyer Wrap & Black Cable Spool!
  cylinder(staticGroup, 0.11, 0.16, 9.4, [2.28, 4.7, 23.8], m.concrete, 10);
  cylinder(staticGroup, 0.145, 0.165, 2.4, [2.28, 1.35, 23.8], adBlueMat, 10);
  // Giant tangled black cable spool / loop on pole (signature Bangladeshi street detail from step_14_media_0.png!)
  for (const sy of [5.4, 6.2]) {
    const spool = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.055, 8, 18), m.wire);
    spool.position.set(2.22, sy, 23.8);
    spool.rotation.y = Math.PI / 2;
    staticGroup.add(spool);
  }
  // West Side Utility Pole in front of the 6-story building (x = -2.26, z = 21.8)
  cylinder(staticGroup, 0.09, 0.13, 8.6, [-2.26, 4.3, 21.8], m.concrete, 10);

  // Parked Blue & Black Motorcycle on the West Sidewalk in front of the 6-Story Building
  buildParkedMotorcycle(staticGroup, m, -2.52, 18.2);

  // Traditional Khulna Cycle Rickshaw further south on Haji Mohsin Road
  buildCycleRickshaw(staticGroup, m, 0.85, 31.0);

  mergeStaticMeshes(staticGroup);
  return skArshanTower;
}
