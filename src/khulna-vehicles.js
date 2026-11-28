import * as THREE from 'three';
import { mergeStaticMeshes } from './scene-utils.js';

function createBanglaPlateTexture(text = 'খুলনা মেট্রো থ', bg = '#fef08a', fg = '#111827') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 96;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 256, 96);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 248, 88);
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 34px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText(text, 128, 50, 228);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createTruckBodyArtTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 192;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#065f46';
  ctx.fillRect(0, 0, 512, 192);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(0, 0, 512, 22);
  ctx.fillRect(0, 170, 512, 22);
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 28, 492, 136);
  // Decorative Bengal lotus medallion left/right
  for (const cx of [66, 446]) {
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(cx, 96, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(cx, 96, 14, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 36px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText('মা-বাবার আশীর্বাদ পরিবহন', 256, 86, 310);
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 22px "Manrope", sans-serif';
  ctx.fillText('KHULNA · MONGLA · RUPSHA', 256, 132, 310);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createVehicleAOShadowTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 128, 256);
  ctx.save();
  ctx.translate(64, 128);
  ctx.scale(1.0, 2.0);
  const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 58);
  grad.addColorStop(0.0, 'rgba(5, 8, 14, 0.82)');
  grad.addColorStop(0.55, 'rgba(8, 12, 18, 0.56)');
  grad.addColorStop(0.84, 'rgba(10, 14, 20, 0.18)');
  grad.addColorStop(1.0, 'rgba(10, 14, 20, 0.0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createVehicleMaterialBank() {
  const aoTex = createVehicleAOShadowTexture();
  const bank = {
    aoShadow: new THREE.MeshBasicMaterial({
      map: aoTex,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
    tire: new THREE.MeshStandardMaterial({ color: 0x16181a, roughness: 0.88, metalness: 0.04 }),
    rim: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.16, metalness: 0.94, envMapIntensity: 1.75 }),
    darkTrim: new THREE.MeshStandardMaterial({ color: 0x1e2226, roughness: 0.52, metalness: 0.28 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.08, metalness: 0.98, envMapIntensity: 1.95 }),
    windshield: new THREE.MeshPhysicalMaterial({
      color: 0x132836,
      roughness: 0.04,
      metalness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      transparent: true,
      opacity: 0.78,
      envMapIntensity: 2.15,
    }),
    headlight: new THREE.MeshStandardMaterial({ color: 0xfff8e6, emissive: 0xffe8b2, emissiveIntensity: 0.8 }),
    taillight: new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 1.0 }),
    amber: new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.6 }),
    cngGreen: new THREE.MeshPhysicalMaterial({ color: 0x146c3e, roughness: 0.16, metalness: 0.34, clearcoat: 0.85, clearcoatRoughness: 0.09, envMapIntensity: 1.65 }),
    cngYellow: new THREE.MeshPhysicalMaterial({ color: 0xfbbf24, roughness: 0.20, metalness: 0.18, clearcoat: 0.75, clearcoatRoughness: 0.10, envMapIntensity: 1.45 }),
    cngRexine: new THREE.MeshStandardMaterial({ color: 0x1a1e24, roughness: 0.76, metalness: 0.04 }),
    easyTeal: new THREE.MeshPhysicalMaterial({ color: 0x0e7490, roughness: 0.15, metalness: 0.36, clearcoat: 0.88, clearcoatRoughness: 0.08, envMapIntensity: 1.70 }),
    easyCrimson: new THREE.MeshPhysicalMaterial({ color: 0x9f1239, roughness: 0.15, metalness: 0.36, clearcoat: 0.88, clearcoatRoughness: 0.08, envMapIntensity: 1.70 }),
    easyRoof: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.45, envMapIntensity: 1.1 }),
    sedanSilver: new THREE.MeshPhysicalMaterial({ color: 0xcbd5e1, roughness: 0.11, metalness: 0.72, clearcoat: 1.0, clearcoatRoughness: 0.05, envMapIntensity: 2.05 }),
    sedanWhite: new THREE.MeshPhysicalMaterial({ color: 0xf4f7fb, roughness: 0.12, metalness: 0.25, clearcoat: 1.0, clearcoatRoughness: 0.05, envMapIntensity: 1.85 }),
    sedanBurgundy: new THREE.MeshPhysicalMaterial({ color: 0x72182f, roughness: 0.12, metalness: 0.48, clearcoat: 1.0, clearcoatRoughness: 0.05, envMapIntensity: 1.95 }),
    sedanBlue: new THREE.MeshPhysicalMaterial({ color: 0x1b3d6b, roughness: 0.11, metalness: 0.58, clearcoat: 1.0, clearcoatRoughness: 0.05, envMapIntensity: 2.00 }),
    truckCab: new THREE.MeshPhysicalMaterial({ color: 0xc2410c, roughness: 0.20, metalness: 0.34, clearcoat: 0.80, clearcoatRoughness: 0.10, envMapIntensity: 1.55 }),
    truckBed: new THREE.MeshStandardMaterial({ map: createTruckBodyArtTexture(), roughness: 0.62, metalness: 0.08 }),
    plate: new THREE.MeshStandardMaterial({ map: createBanglaPlateTexture(), roughness: 0.5 }),
    rickshawHood: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.64 }),
    rickshawRed: new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.28, metalness: 0.24, envMapIntensity: 1.3 }),
  };
  return bank;
}

function addUnderbodyAO(parent, bank, width, length) {
  const ao = new THREE.Mesh(new THREE.PlaneGeometry(width, length), bank.aoShadow);
  ao.rotation.x = -Math.PI / 2;
  ao.position.y = -0.014;
  ao.castShadow = false;
  ao.receiveShadow = false;
  parent.add(ao);
}

function makeWheel(bank, radius = 0.24, width = 0.14) {
  const w = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 14), bank.tire);
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = false;
  w.add(tire);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.56, radius * 0.56, width + 0.014, 10), bank.rim);
  rim.rotation.z = Math.PI / 2;
  w.add(rim);
  return w;
}

function addPart(parent, geo, mat, pos, rot = null) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

/** Authentic Bangladeshi Green/Yellow CNG Auto-Rickshaw (faces +Z forward) */
export function buildCNGAuto(bank) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const wheels = [];

  // Wheels: 1 front fork wheel, 2 rear wheels
  for (const [wx, wy, wz] of [[0, 0.21, 0.92], [-0.54, 0.21, -0.78], [0.54, 0.21, -0.78]]) {
    const w = makeWheel(bank, 0.21, 0.12);
    w.position.set(wx, wy, wz);
    g.add(w);
    wheels.push(w);
  }

  // Sculpted steel floor chassis + front mudguard + cowling
  addPart(body, new THREE.BoxGeometry(1.12, 0.18, 2.05), bank.darkTrim, [0, 0.28, -0.05]);
  addPart(body, new THREE.BoxGeometry(1.14, 0.56, 0.92), bank.cngGreen, [0, 0.62, -0.58]);
  // Tapered front nose fairing
  addPart(body, new THREE.BoxGeometry(0.76, 0.54, 0.62), bank.cngGreen, [0, 0.64, 0.72], [0.16, 0, 0]);
  addPart(body, new THREE.BoxGeometry(0.46, 0.18, 0.34), bank.cngGreen, [0, 0.34, 0.94]); // front fender
  // Chrome bumper bar
  addPart(body, new THREE.CylinderGeometry(0.025, 0.025, 0.98, 8), bank.chrome, [0, 0.36, 1.08], [0, 0, Math.PI / 2]);
  // Raked front windshield frame & glass
  addPart(body, new THREE.BoxGeometry(0.84, 0.66, 0.04), bank.windshield, [0, 1.18, 0.62], [-0.34, 0, 0]);
  // Black rexine convertible canopy roof + yellow Khulna CNG stripe collar
  addPart(body, new THREE.BoxGeometry(1.14, 0.08, 1.48), bank.cngRexine, [0, 1.56, -0.24]);
  addPart(body, new THREE.BoxGeometry(1.16, 0.12, 1.50), bank.cngYellow, [0, 1.48, -0.24]);
  addPart(body, new THREE.BoxGeometry(1.12, 0.62, 0.08), bank.cngRexine, [0, 1.18, -0.96]);
  // Protective tubular steel grill bars (authentic Bangladeshi CNG cage)
  for (const sx of [-0.52, 0.52]) {
    addPart(body, new THREE.CylinderGeometry(0.018, 0.018, 0.74, 6), bank.chrome, [sx, 1.16, -0.82]);
    addPart(body, new THREE.CylinderGeometry(0.018, 0.018, 0.78, 6), bank.chrome, [sx, 1.16, 0.18], [0.12, 0, 0]);
  }
  // Single round halogen headlight & amber turn signals
  addPart(body, new THREE.CylinderGeometry(0.09, 0.09, 0.08, 12), bank.headlight, [0, 0.74, 1.04], [Math.PI / 2, 0, 0]);
  for (const sx of [-0.32, 0.32]) {
    addPart(body, new THREE.BoxGeometry(0.09, 0.07, 0.06), bank.amber, [sx, 0.68, 1.02]);
    addPart(body, new THREE.BoxGeometry(0.11, 0.07, 0.05), bank.taillight, [sx * 1.35, 0.58, -1.04]);
  }
  // Driver seat + passenger bench
  addPart(body, new THREE.BoxGeometry(0.42, 0.24, 0.34), bank.darkTrim, [0, 0.58, 0.30]);
  addPart(body, new THREE.BoxGeometry(0.96, 0.28, 0.44), bank.darkTrim, [0, 0.62, -0.60]);
  mergeStaticMeshes(body);
  addUnderbodyAO(g, bank, 1.48, 2.55);
  g.userData.wheels = wheels;
  g.userData.wheelRadius = 0.21;
  return g;
}

/** Khulna Electric Battery Easybike / Auto (ইজিবাইক) */
export function buildEasybike(bank, altColor = false) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const wheels = [];
  const bodyMat = altColor ? bank.easyCrimson : bank.easyTeal;

  for (const [wx, wy, wz] of [[0, 0.22, 1.05], [-0.56, 0.22, -0.85], [0.56, 0.22, -0.85]]) {
    const w = makeWheel(bank, 0.22, 0.13);
    w.position.set(wx, wy, wz);
    g.add(w);
    wheels.push(w);
  }
  addPart(body, new THREE.BoxGeometry(1.18, 0.16, 2.30), bank.darkTrim, [0, 0.30, 0.0]);
  addPart(body, new THREE.BoxGeometry(1.18, 0.56, 1.40), bodyMat, [0, 0.65, -0.35]);
  addPart(body, new THREE.BoxGeometry(0.84, 0.56, 0.56), bodyMat, [0, 0.64, 0.85], [0.18, 0, 0]);
  // Full-width canopy roof on 6 steel pillars
  addPart(body, new THREE.BoxGeometry(1.22, 0.09, 2.15), bank.easyRoof, [0, 1.66, -0.05]);
  addPart(body, new THREE.BoxGeometry(1.06, 0.68, 0.04), bank.windshield, [0, 1.24, 0.82], [-0.26, 0, 0]);
  for (const sx of [-0.55, 0.55]) {
    for (const pz of [-0.95, 0.05, 0.72]) {
      addPart(body, new THREE.CylinderGeometry(0.018, 0.018, 0.82, 6), bank.chrome, [sx, 1.26, pz]);
    }
  }
  // Dual square headlights + taillights
  for (const sx of [-0.28, 0.28]) {
    addPart(body, new THREE.BoxGeometry(0.14, 0.09, 0.05), bank.headlight, [sx, 0.68, 1.15]);
    addPart(body, new THREE.BoxGeometry(0.14, 0.08, 0.05), bank.taillight, [sx * 1.45, 0.62, -1.07]);
  }
  addPart(body, new THREE.PlaneGeometry(0.32, 0.12), bank.plate, [0, 0.44, -1.08], [0, Math.PI, 0]);
  mergeStaticMeshes(body);
  addUnderbodyAO(g, bank, 1.54, 2.75);
  g.userData.wheels = wheels;
  g.userData.wheelRadius = 0.22;
  return g;
}

/** Sleek Clearcoat Urban Sedan (Toyota Premio/Corolla silhouette common in Khulna) */
export function buildSedanCar(bank, paintMat) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const wheels = [];
  for (const [wx, wz] of [[-0.82, 1.28], [0.82, 1.28], [-0.82, -1.24], [0.82, -1.24]]) {
    const w = makeWheel(bank, 0.30, 0.20);
    w.position.set(wx, 0.30, wz);
    g.add(w);
    wheels.push(w);
  }
  // Lower chassis skirt & main contoured body
  addPart(body, new THREE.BoxGeometry(1.72, 0.16, 4.18), bank.darkTrim, [0, 0.26, 0]);
  addPart(body, new THREE.BoxGeometry(1.74, 0.48, 4.24), paintMat, [0, 0.58, 0]);
  // Tapered nose hood
  addPart(body, new THREE.BoxGeometry(1.66, 0.22, 1.20), paintMat, [0, 0.78, 1.38], [0.08, 0, 0]);
  // Cabin silhouette + greenhouse glass + roof
  addPart(body, new THREE.BoxGeometry(1.48, 0.48, 2.02), bank.windshield, [0, 1.06, -0.14]);
  addPart(body, new THREE.BoxGeometry(1.46, 0.09, 1.72), paintMat, [0, 1.32, -0.18]);
  // Slanted A-pillars & front windshield highlight
  addPart(body, new THREE.BoxGeometry(1.44, 0.50, 0.06), bank.windshield, [0, 1.04, 0.84], [-0.62, 0, 0]);
  addPart(body, new THREE.BoxGeometry(1.44, 0.46, 0.06), bank.windshield, [0, 1.04, -1.16], [0.64, 0, 0]);
  // Chrome front grille
  addPart(body, new THREE.BoxGeometry(0.84, 0.16, 0.06), bank.chrome, [0, 0.56, 2.13]);
  // Side mirrors
  for (const sx of [-0.90, 0.90]) {
    addPart(body, new THREE.BoxGeometry(0.14, 0.09, 0.11), paintMat, [sx, 0.90, 0.68]);
  }
  // Crisp glowing headlights & wide crimson LED taillights
  for (const sx of [-0.60, 0.60]) {
    addPart(body, new THREE.BoxGeometry(0.30, 0.12, 0.06), bank.headlight, [sx, 0.62, 2.12]);
    addPart(body, new THREE.BoxGeometry(0.34, 0.12, 0.06), bank.taillight, [sx, 0.68, -2.12]);
  }
  addPart(body, new THREE.PlaneGeometry(0.42, 0.12), bank.plate, [0, 0.44, 2.13]);
  addPart(body, new THREE.PlaneGeometry(0.42, 0.12), bank.plate, [0, 0.46, -2.13], [0, Math.PI, 0]);
  mergeStaticMeshes(body);
  addUnderbodyAO(g, bank, 2.18, 4.85);

  g.userData.wheels = wheels;
  g.userData.wheelRadius = 0.30;
  return g;
}

/** Bangladeshi Decorated TATA Cargo Mini-Truck for Rupsha Ghat & Highway */
export function buildBanglaTruck(bank) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const wheels = [];
  for (const [wx, wz] of [[-0.94, 1.75], [0.94, 1.75], [-0.94, -1.45], [0.94, -1.45]]) {
    const w = makeWheel(bank, 0.38, 0.24);
    w.position.set(wx, 0.38, wz);
    g.add(w);
    wheels.push(w);
  }
  addPart(body, new THREE.BoxGeometry(1.92, 0.24, 5.20), bank.darkTrim, [0, 0.50, 0]);
  // Orange-red metallic cab
  addPart(body, new THREE.BoxGeometry(1.88, 1.46, 1.56), bank.truckCab, [0, 1.32, 1.74]);
  addPart(body, new THREE.BoxGeometry(1.74, 0.62, 0.06), bank.windshield, [0, 1.58, 2.53]);
  // Painted wooden/steel cargo bed with artwork
  addPart(body, new THREE.BoxGeometry(2.02, 1.32, 3.35), bank.truckBed, [0, 1.28, -0.82]);
  // Roof bamboo luggage rack & bumper
  addPart(body, new THREE.BoxGeometry(1.98, 0.16, 0.16), bank.chrome, [0, 0.48, 2.62]);
  for (const sx of [-0.68, 0.68]) {
    addPart(body, new THREE.BoxGeometry(0.26, 0.14, 0.06), bank.headlight, [sx, 0.78, 2.53]);
    addPart(body, new THREE.BoxGeometry(0.28, 0.12, 0.06), bank.taillight, [sx, 0.66, -2.52]);
  }
  mergeStaticMeshes(body);
  addUnderbodyAO(g, bank, 2.48, 5.85);
  g.userData.wheels = wheels;
  g.userData.wheelRadius = 0.38;
  return g;
}

function samplePolyline(pts, t) {
  if (!pts.length) return { x: 0, z: 0, dirX: 0, dirZ: 1 };
  let total = 0;
  const segLens = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    const dz = pts[i + 1][1] - pts[i][1];
    const len = Math.hypot(dx, dz);
    segLens.push(len);
    total += len;
  }
  let target = ((t % 1) + 1) % 1 * total;
  for (let i = 0; i < segLens.length; i++) {
    const len = segLens[i];
    if (target <= len || i === segLens.length - 1) {
      const f = len > 0.001 ? target / len : 0;
      const a = pts[i];
      const b = pts[i + 1];
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const inv = 1 / Math.max(0.001, len);
      return {
        x: a[0] + dx * f,
        z: a[1] + dz * f,
        dirX: dx * inv,
        dirZ: dz * inv,
        totalLen: total,
      };
    }
    target -= len;
  }
  return { x: pts[0][0], z: pts[0][1], dirX: 0, dirZ: 1, totalLen: total };
}

/**
 * Spawns live articulated moving Khulna vehicles along Haji Mohsin Road &
 * Rupsha Strand/Approach roads + stationary ferry-queue vehicles.
 */
export function createKhulnaTraffic(parent) {
  const group = new THREE.Group();
  group.name = 'KhulnaLiveTraffic';
  parent.add(group);

  const bank = createVehicleMaterialBank();
  const actors = [];

  // Exact real-world polyline paths following OSM roads & dodging hero parked rickshaw (0.85, 31.0)
  const hajiSouthLane = [
    [19.2, -134.0],
    [3.1, -55.3],
    [0.15, -40.5],
    [-1.08, -22.0],
    [-1.08, 20.0],
    [-1.08, 41.0],
    [-3.2, 47.0],
    [-5.6, 55.0],
    [-8.9, 85.0],
    [-12.2, 108.0],
  ];

  // Reverse direction on East lane, curving gently left around parked rickshaw at (0.85, 31.0)
  const hajiNorthLane = [
    [-10.2, 108.0],
    [-7.0, 84.0],
    [-3.6, 53.0],
    [-1.0, 42.5],
    [0.85, 39.5],
    [0.02, 34.0],
    [-0.08, 30.8],
    [0.05, 27.0],
    [0.98, 22.0],
    [1.02, -39.0],
    [4.4, -55.8],
    [21.2, -134.0],
  ];

  // Rupsha Strand Rd waterfront (running alongside Natun Bazar & River promenade down to Ferry More)
  const rupshaNorthbound = [
    [1134.5, 631.0],
    [1144.8, 590.0],
    [1145.6, 465.0],
    [1147.8, 382.0],
    [1145.8, 290.0],
    [1139.8, 215.0],
    [1125.6, 153.0],
    [1114.6, 112.8],
    [1096.8, 47.8],
    [1084.6, -2.0],
    [1076.2, -19.6],
  ];

  const rupshaApproach = [
    [940.0, 622.2],
    [1083.0, 635.2],
    [1132.5, 632.0],
    [1137.0, 650.5],
    [1224.0, 661.0],
    [1234.0, 648.0],
  ];

  function addActor(mesh, path, t0, speedMps, pingPong = false, hw = 0.85, hd = 1.65) {
    group.add(mesh);
    actors.push({
      mesh,
      path,
      t: t0,
      dir: 1,
      speedMps,
      pingPong,
      hw,
      hd,
      cx: 0,
      cz: 0,
      cosY: 1,
      sinY: 0,
      wheelAngle: 0,
      curSpeed: speedMps,
    });
  }

  // Haji Mohsin Rd Traffic Mix (CNGs, Easybikes, Sedans)
  addActor(buildCNGAuto(bank), hajiSouthLane, 0.14, 5.2, false, 0.72, 1.38);
  addActor(buildEasybike(bank, false), hajiSouthLane, 0.48, 4.3, false, 0.70, 1.35);
  addActor(buildSedanCar(bank, bank.sedanWhite), hajiSouthLane, 0.78, 5.9, false, 0.96, 2.18);

  addActor(buildEasybike(bank, true), hajiNorthLane, 0.18, 4.4, false, 0.70, 1.35);
  addActor(buildCNGAuto(bank), hajiNorthLane, 0.56, 5.0, false, 0.72, 1.38);
  addActor(buildSedanCar(bank, bank.sedanSilver), hajiNorthLane, 0.86, 5.8, false, 0.96, 2.18);

  // Rupsha Strand & Ferry Terminal Traffic Mix
  addActor(buildBanglaTruck(bank), rupshaNorthbound, 0.12, 4.8, true, 1.15, 2.72);
  addActor(buildCNGAuto(bank), rupshaNorthbound, 0.44, 5.6, true, 0.72, 1.38);
  addActor(buildEasybike(bank, false), rupshaNorthbound, 0.76, 4.6, true, 0.70, 1.35);

  addActor(buildBanglaTruck(bank), rupshaApproach, 0.25, 4.6, true, 1.15, 2.72);
  addActor(buildSedanCar(bank, bank.sedanBurgundy), rupshaApproach, 0.65, 5.4, true, 0.96, 2.18);
  addActor(buildCNGAuto(bank), rupshaApproach, 0.88, 5.2, true, 0.72, 1.38);

  // Parked vehicles near Rupsha Ferry Terminal, Natun Bazar Launch & Taltola Cross Rd
  const parkedVehicles = [];
  for (const [fn, px, pz, yaw, hw, hd] of [
    [() => buildBanglaTruck(bank), 1192.0, 653.0, Math.PI * 0.46, 1.15, 2.72],
    [() => buildCNGAuto(bank), 1212.0, 656.5, Math.PI * 0.48, 0.72, 1.38],
    [() => buildEasybike(bank, false), 1132.0, 41.2, 0.12, 0.70, 1.35],
    [() => buildSedanCar(bank, bank.sedanBlue), 1126.0, 29.0, 0.25, 0.96, 2.18],
    [() => buildCNGAuto(bank), 416.5, 956.0, 0.15, 0.72, 1.38],
  ]) {
    const parked = fn();
    parked.position.set(px, 0.03, pz);
    parked.rotation.y = yaw;
    mergeStaticMeshes(parked);
    parked.userData.px = px;
    parked.userData.pz = pz;
    parked.userData.hw = hw;
    parked.userData.hd = hd;
    parked.userData.cosY = Math.cos(yaw);
    parked.userData.sinY = Math.sin(yaw);
    group.add(parked);
    parkedVehicles.push(parked);
  }

  function resolveOBB(pos, radius, cx, cz, hw, hd, cosY, sinY) {
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    const lx = dx * cosY - dz * sinY;
    const lz = dx * sinY + dz * cosY;
    const clx = Math.max(-hw, Math.min(hw, lx));
    const clz = Math.max(-hd, Math.min(hd, lz));
    const ox = lx - clx;
    const oz = lz - clz;
    const d2 = ox * ox + oz * oz;
    if (d2 >= radius * radius) return;
    let px = 0;
    let pz = 0;
    if (d2 > 1e-8) {
      const dist = Math.sqrt(d2);
      const push = radius - dist;
      px = (ox / dist) * push;
      pz = (oz / dist) * push;
    } else {
      const penX = hw - Math.abs(lx);
      const penZ = hd - Math.abs(lz);
      if (penX < penZ) px = (lx >= 0 ? 1 : -1) * (penX + radius);
      else pz = (lz >= 0 ? 1 : -1) * (penZ + radius);
    }
    pos.x += px * cosY + pz * sinY;
    pos.z += -px * sinY + pz * cosY;
  }

  let prevElapsed = 0;

  return {
    group,
    applyVehicleCollisions(pos, radius, footY = 0) {
      if (!group.visible || footY > 1.75) return;
      for (let i = 0; i < parkedVehicles.length; i++) {
        const u = parkedVehicles[i].userData;
        if (Math.abs(pos.x - u.px) < 5 && Math.abs(pos.z - u.pz) < 5) {
          resolveOBB(pos, radius, u.px, u.pz, u.hw, u.hd, u.cosY, u.sinY);
        }
      }
      for (let i = 0; i < actors.length; i++) {
        const a = actors[i];
        if (!a.mesh.visible) continue;
        if (Math.abs(pos.x - a.cx) < 5 && Math.abs(pos.z - a.cz) < 5) {
          resolveOBB(pos, radius, a.cx, a.cz, a.hw, a.hd, a.cosY, a.sinY);
        }
      }
    },
    setNightFactor(nightFactor) {
      const nf = Math.max(0, Math.min(1, nightFactor || 0));
      bank.headlight.emissiveIntensity = 0.7 + nf * 2.8;
      bank.taillight.emissiveIntensity = 0.9 + nf * 2.2;
      bank.amber.emissiveIntensity = 0.5 + nf * 1.4;
    },
    setVisible(v) {
      group.visible = v;
    },
    update(elapsed, playerPos) {
      if (!group.visible) return;
      const dt = Math.min(0.08, Math.max(0.001, elapsed - prevElapsed));
      prevElapsed = elapsed;

      const visCullDistSq = 110 * 110;
      if (!playerPos || ((Math.floor(elapsed * 12) % 3) === 0)) {
        for (const pk of parkedVehicles) {
          if (!playerPos) {
            pk.visible = true;
          } else {
            const dxk = pk.userData.px - playerPos.x;
            const dzk = pk.userData.pz - playerPos.z;
            pk.visible = (dxk * dxk + dzk * dzk) <= visCullDistSq;
          }
        }
      }

      for (const a of actors) {
        const s = samplePolyline(a.path, a.t);
        const dxP = playerPos ? s.x - playerPos.x : 0;
        const dzP = playerPos ? s.z - playerPos.z : 0;
        const distSq = dxP * dxP + dzP * dzP;

        // Distance culling (>175m from player hides mesh cleanly & yields smoothly near player)
        const desiredSpeed = distSq < 26 ? 0.0 : (distSq < 64 ? a.speedMps * 0.35 : a.speedMps);
        a.curSpeed += (desiredSpeed - a.curSpeed) * Math.min(1, dt * 4.0);

        const len = Math.max(10, s.totalLen || 150);
        const dT = (a.curSpeed * dt) / len * a.dir;
        a.t += dT;
        if (a.pingPong) {
          if (a.t > 0.98) {
            a.t = 0.98;
            a.dir = -1;
          } else if (a.t < 0.02) {
            a.t = 0.02;
            a.dir = 1;
          }
        } else {
          if (a.t >= 1) a.t -= 1;
          else if (a.t < 0) a.t += 1;
        }

        const p2 = samplePolyline(a.path, a.t);
        const dx2 = playerPos ? p2.x - playerPos.x : 0;
        const dz2 = playerPos ? p2.z - playerPos.z : 0;
        const d2 = dx2 * dx2 + dz2 * dz2;
        const isNear = !playerPos || d2 <= visCullDistSq;
        a.mesh.visible = isNear;
        if (!isNear) continue;

        a.mesh.position.set(p2.x, 0.03, p2.z);
        const yaw = Math.atan2(p2.dirX * a.dir, p2.dirZ * a.dir);
        a.mesh.rotation.y = yaw;
        a.cx = p2.x;
        a.cz = p2.z;
        a.cosY = Math.cos(yaw);
        a.sinY = Math.sin(yaw);

        // Spin wheels & slight realistic road suspension micro-bob when moving nearby
        if (d2 < 120 * 120 && a.curSpeed > 0.1) {
          const r = a.mesh.userData.wheelRadius || 0.24;
          a.wheelAngle += (a.curSpeed * dt) / r;
          const wheels = a.mesh.userData.wheels || [];
          for (const w of wheels) w.rotation.x = a.wheelAngle;
          a.mesh.position.y = 0.03 + Math.abs(Math.sin(elapsed * 14 + p2.z)) * 0.004;
        }
      }
    },
  };
}
