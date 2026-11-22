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

function makeNameplateTexture(title, subtitle) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 160;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0c3b28';
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 144);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(18, 18, 10, 124);
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 30px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText(title, 42, 60, 446);
  ctx.fillStyle = '#fde047';
  ctx.font = '600 18px "Manrope", "Noto Sans Bengali", sans-serif';
  ctx.fillText(subtitle, 42, 114, 446);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeDoorPlaqueTexture(title, sub = '') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 96;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0f3d2e';
  ctx.fillRect(0, 0, 256, 96);
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 6;
  ctx.strokeRect(5, 5, 246, 86);
  ctx.fillStyle = '#fef9c3';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 30px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText(title, 128, sub ? 38 : 48, 230);
  if (sub) {
    ctx.fillStyle = '#86efac';
    ctx.font = '600 16px "Noto Sans Bengali", sans-serif';
    ctx.fillText(sub, 128, 70, 230);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeArtCanvasTexture(variant = 0) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 176;
  const ctx = c.getContext('2d');
  if (variant === 0) {
    // Khulna Rupsha River Sunset & Sundarbans Silhouette
    const sky = ctx.createLinearGradient(0, 0, 0, 120);
    sky.addColorStop(0, '#1e3a5f');
    sky.addColorStop(0.55, '#ea580c');
    sky.addColorStop(1, '#fde047');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 256, 120);
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(172, 74, 22, 0, Math.PI * 2);
    ctx.fill();
    const river = ctx.createLinearGradient(0, 118, 0, 176);
    river.addColorStop(0, '#c2410c');
    river.addColorStop(1, '#0f172a');
    ctx.fillStyle = river;
    ctx.fillRect(0, 118, 256, 58);
    ctx.fillStyle = '#064e3b';
    for (let x = 0; x < 256; x += 22) {
      ctx.beginPath();
      ctx.arc(x + 8, 118, 14 + (x % 3) * 5, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillStyle = '#1e1b18';
    ctx.beginPath();
    ctx.moveTo(64, 144);
    ctx.lineTo(126, 144);
    ctx.lineTo(116, 154);
    ctx.lineTo(74, 154);
    ctx.closePath();
    ctx.fill();
  } else {
    // Modern Teal & Gold Bengali Floral Abstract
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 256, 176);
    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.arc(76, 88, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(166, 72, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(146, 124, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, 232, 152);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWallClockTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(64, 64, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.fillStyle = '#0f172a';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(64 + Math.cos(a) * 44, 64 + Math.sin(a) * 44, i % 3 === 0 ? 3.5 : 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(64, 64);
  ctx.lineTo(64, 30);
  ctx.moveTo(64, 64);
  ctx.lineTo(90, 74);
  ctx.stroke();
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(64, 64);
  ctx.lineTo(42, 86);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeMeterPanelTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 248, 248);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(14, 12, 228, 26);
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WZPDCL KHULNA · 16 FLAT METERS', 128, 30);
  for (let r = 0; r < 4; r++) {
    for (let col = 0; col < 4; col++) {
      const mx = 16 + col * 58;
      const my = 46 + r * 49;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(mx, my, 48, 41);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(mx, my, 48, 41);
      ctx.fillStyle = '#052e16';
      ctx.fillRect(mx + 5, my + 6, 38, 13);
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`${r + 2}${col < 2 ? 'A' : 'B'}${(col % 2) + 1}`, mx + 24, my + 16);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(mx + 24, my + 30, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeTvScreenTexture(isOn) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 144;
  const ctx = c.getContext('2d');
  if (!isOn) {
    ctx.fillStyle = '#090d14';
    ctx.fillRect(0, 0, 256, 144);
  } else {
    const g = ctx.createLinearGradient(0, 0, 256, 144);
    g.addColorStop(0, '#0ea5e9');
    g.addColorStop(0.5, '#10b981');
    g.addColorStop(1, '#f59e0b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 144);
    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    ctx.fillRect(0, 104, 256, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText('KHULNA 4K SMART TV', 20, 62);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('LIVE · PRESS [E] TO TURN OFF', 20, 128);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds the user's Grand Expanded 5-Story Dream Home directly straight at the end of Altapole East Goli:
 *  - Large 18m × 18m Footprint!
 *  - Elevated Ground Floor (Level 0 at y = 0.85m) with 4.2m Hill-Climb Tiled Ramp + 6-Step Stainless-Railed Stairs
 *  - Tall, Wide Shiny Emerald Green + Mirror Stainless Steel Double Garage Gate (3.8m × 3.4m)
 *  - Huge 18m × 18m Open Drive-In Car & Bike Parking Garage on Level 0 (Guard Desk, WZPDCL 16-Meter Board, Pump Manifold, Wheel Stoppers)
 *  - Central Staircase & Corridor Core down the middle (GF -> 2F -> 3F -> 4F -> 5F -> Open Rooftop)
 *  - 4 BIG, SEPARATE, ENCLOSED LUXURY FLATS on EVERY Upper Floor (2 on Left: A1, A2 + 2 on Right: B1, B2 = 16 Flats!)
 *  - Openable Doors, Smart TVs, Openable Almirahs, Openable Fridges, Split ACs, Curtains, Khulna Art, Modular Kitchens & Full Bathrooms in EVERY Flat!
 *  - Grand OPEN Rooftop with a BIG Lush Rooftop Flower & Fruit-Tree Garden (বড় ছাদ বাগান)
 *  - Half-Roof Enterable Penthouse Room (ছাদের রুম) + Walkable Exterior Staircase UP onto the Penthouse Room Roof!
 *  - Light Garden (হালকা বাগান) & Sky-View Bench on top of the Penthouse Room Roof (y = 20.90m)!
 *  - 2 Large Gazi Overhead Water Tanks on the Very Top Concrete Platform (y = 21.35m)!
 */
export function createUserDreamHome(parent, shared, cfg = {}) {
  const m = shared.m;
  const cx = cfg.cx ?? 217.8;
  const cz = cfg.cz ?? -404.0;
  const rotY = cfg.rotY ?? (-Math.PI / 2); // Faces West (-X) straight down the alley!
  const W = 18.0;
  const D = 18.0;
  const floors = 7; // GF (0) + 2F..7F (1..6) + Open Rooftop Garden (7) — Tall Realistic Cement Structure!
  const hw = W * 0.5; // 9.0
  const hd = D * 0.5; // 9.0
  const gfBaseY = 1.15;
  const gfH = 4.55;
  const flH = 3.55;
  const FLOOR_Y = [gfBaseY];
  for (let k = 1; k <= floors; k++) {
    FLOOR_Y.push(Number((gfBaseY + gfH + (k - 1) * flH).toFixed(2)));
  }
  const roofY = FLOOR_Y[floors]; // 27.00m
  const rH = 3.15;
  const upperRoofY = Number((roofY + rH).toFixed(2)); // 28.35m (walkable roof on top of rooftop room!)
  const tankStandY = Number((upperRoofY + 0.45).toFixed(2)); // 28.80m (very top 2 water tanks platform!)

  const nameBn = '২৬ · আলতাপোল গলি ভিলা (৭-তলা)';
  const zonePrefix = '26 ALTAPOLE GOLI VILLA';

  const cosR = Math.cos(rotY);
  const sinR = Math.sin(rotY);
  const localToWorld = (lx, lz) => ({
    x: cx + lx * cosR + lz * sinR,
    z: cz - lx * sinR + lz * cosR,
  });
  const worldToLocal = (wx, wz) => {
    const dx = wx - cx;
    const dz = wz - cz;
    return {
      x: dx * cosR - dz * sinR,
      z: dx * sinR + dz * cosR,
    };
  };

  // White-Grey Architectural Concrete PBR Materials (crisp white-grey tone over realistic concrete texture!)
  const baseConcTex = m.concrete?.map || m.plaster?.map || null;
  const baseConcNorm = m.concrete?.normalMap || m.plaster?.normalMap || null;
  const baseConcRough = m.concrete?.roughnessMap || m.plaster?.roughnessMap || null;
  const makeWhiteGreyConcrete = (hex, rough = 0.88) => new THREE.MeshStandardMaterial({
    color: hex,
    map: baseConcTex,
    normalMap: baseConcNorm,
    roughnessMap: baseConcRough,
    roughness: rough,
    metalness: 0.02,
  });
  const softWhiteWall = makeWhiteGreyConcrete(0xe6eaee, 0.86);
  const gfCementWall = makeWhiteGreyConcrete(0xd4dae0, 0.88);
  const cementSlabMat = makeWhiteGreyConcrete(0xc3cad2, 0.90);
  const cementTrimMat = makeWhiteGreyConcrete(0xf0f3f6, 0.82);
  const cementBandMat = makeWhiteGreyConcrete(0xf4f6f8, 0.80);
  const taltolaBrickMat = m.brick;
  const taltolaRailMat = m.rail || shinyStainlessSteel;
  const taltolaAlumMat = m.aluminum || shared.thaiFrame;
  const taltolaGlassMat = m.glass || shared.thaiGlass;
  const taltolaFrostedMat = m.frostedGlass || shared.cobaltGlass;
  const greenEnamelSteel = new THREE.MeshPhysicalMaterial({
    color: 0x16a34a,
    metalness: 0.62,
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    emissive: 0x064e24,
    emissiveIntensity: 0.25,
  });
  const greenEnamelDark = new THREE.MeshPhysicalMaterial({
    color: 0x14532d,
    metalness: 0.68,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    emissive: 0x052e16,
    emissiveIntensity: 0.20,
  });
  const shinyStainlessSteel = new THREE.MeshPhysicalMaterial({
    color: 0xf1f5f9,
    metalness: 0.94,
    roughness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    emissive: 0x475569,
    emissiveIntensity: 0.38,
  });
  const tvOnMat = new THREE.MeshStandardMaterial({
    map: makeTvScreenTexture(true),
    emissive: 0xffffff,
    emissiveMap: makeTvScreenTexture(true),
    emissiveIntensity: 0.85,
    roughness: 0.12,
  });
  const tvOffMat = new THREE.MeshStandardMaterial({
    map: makeTvScreenTexture(false),
    roughness: 0.08,
    metalness: 0.35,
  });
  const fridgeBodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xdbe4ee,
    metalness: 0.72,
    roughness: 0.16,
    clearcoat: 0.9,
  });
  const fridgeInnerLight = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0xbae6fd,
    emissiveIntensity: 0.95,
  });
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x4b3621, roughness: 0.95 });
  const potMat = new THREE.MeshStandardMaterial({ color: 0xb4532a, roughness: 0.78 });
  const leafDark = new THREE.MeshStandardMaterial({ color: 0x1e6029, roughness: 0.82 });
  const leafBright = new THREE.MeshStandardMaterial({ color: 0x34a853, roughness: 0.78 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.90 });
  const flowerMats = [
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.55 }), // Red Rose
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.55 }), // Golden Marigold
    new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.55 }), // Pink Bougainvillea
    new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.55 }), // Purple Petunia
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.50 }), // White Jasmine
    new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.55 }), // Orange Marigold
  ];
  const clothRed = flowerMats[0];
  const clothBlue = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.8 });
  const clothGold = flowerMats[1];
  const warmWoodSlat = new THREE.MeshStandardMaterial({ color: 0x7c4a26, roughness: 0.62 });
  const darkWalnut = new THREE.MeshStandardMaterial({ color: 0x432818, roughness: 0.58 });
  const curtainTeal = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.86 });
  const curtainCream = new THREE.MeshStandardMaterial({ color: 0xf5efe6, roughness: 0.88 });
  const cushionGold = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.78 });
  const cushionCoral = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.78 });
  const acUnitWhite = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.30, metalness: 0.12 });
  const acLedGreen = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.4 });
  const lpgRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.36, metalness: 0.42 });
  const hazardYellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.50 });
  const pvcPipeGrey = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.44, metalness: 0.18 });
  const pumpBlueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.38, metalness: 0.55 });
  const stonePaverMat = new THREE.MeshStandardMaterial({ color: 0xcbc6bc, roughness: 0.88 });
  const warmLampGlow = new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffd166, emissiveIntensity: 1.25, roughness: 0.3 });
  const laptopScreenMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.9, roughness: 0.15 });
  const artMat0 = new THREE.MeshStandardMaterial({ map: makeArtCanvasTexture(0), roughness: 0.45 });
  const artMat1 = new THREE.MeshStandardMaterial({ map: makeArtCanvasTexture(1), roughness: 0.45 });
  const clockFaceMat = new THREE.MeshStandardMaterial({ map: makeWallClockTexture(), roughness: 0.35 });
  const meterPanelMat = new THREE.MeshStandardMaterial({ map: makeMeterPanelTexture(), roughness: 0.42 });
  const tankRibMat = new THREE.MeshStandardMaterial({ color: 0x0b1116, roughness: 0.38, metalness: 0.25 });

  // Geometry Constants (Local Space: +Z is front facade straight facing the alley!)
  const ENT_CX = 0.0;
  const ENT_MIN_X = -1.90;
  const ENT_MAX_X = 1.90;
  const ENT_DOOR_H = 3.40;
  const RAMP_LEN = 4.80;

  // Central Staircase & Corridor Core down the middle (lx ∈ [-1.75, +1.75])
  const CORR_MIN_X = -1.75;
  const CORR_MAX_X = 1.75;
  const STAIR_MIN_X = -1.55;
  const STAIR_MAX_X = -0.05;
  const STAIR_START_Z = 2.80;
  const STAIR_END_Z = -2.80;

  // 4 Separate Flat Doors on EVERY Upper Floor (2 on Left: A1, A2; 2 on Right: B1, B2)
  const D_FRONT_MIN_Z = 3.40;
  const D_FRONT_MAX_Z = 4.65;
  const D_FRONT_CZ = (D_FRONT_MIN_Z + D_FRONT_MAX_Z) * 0.5;
  const D_REAR_MIN_Z = -4.65;
  const D_REAR_MAX_Z = -3.40;
  const D_REAR_CZ = (D_REAR_MIN_Z + D_REAR_MAX_Z) * 0.5;

  // Half-Roof Penthouse Room on Open Rooftop (Back-Right Half: lx ∈ [2.10, 8.65], lz ∈ [-8.65, -0.40])
  const RROOM_MIN_X = 2.10;
  const RROOM_MAX_X = 8.65;
  const RROOM_MIN_Z = -8.65;
  const RROOM_MAX_Z = -0.40;
  const RROOM_DOOR_MIN_X = 3.40;
  const RROOM_DOOR_MAX_X = 4.70;
  const RROOM_DOOR_CX = (RROOM_DOOR_MIN_X + RROOM_DOOR_MAX_X) * 0.5;

  // Walkable Exterior Staircase UP onto the Penthouse Room Roof (roofY -> upperRoofY)
  const UP_STAIR_MIN_X = 0.55;
  const UP_STAIR_MAX_X = 1.95;
  const UP_STAIR_START_Z = 2.60;  // Bottom step at y = roofY (17.75m)
  const UP_STAIR_END_Z = -2.20;   // Top step at y = upperRoofY (20.90m)

  // Main Stairhead Mumty on Rooftop (lx ∈ [-1.85, +0.20], lz ∈ [-3.20, +3.10], top at upperRoofY = 20.90m!)
  const MUM_MIN_X = -1.85;
  const MUM_MAX_X = 0.20;
  const MUM_MIN_Z = -3.20;
  const MUM_MAX_Z = 3.10;

  const root = new THREE.Group();
  root.name = 'AltapoleGoli_UserDreamHome_7Story';
  root.position.set(cx, 0, cz);
  root.rotation.y = rotY;
  parent.add(root);

  const exteriorStatic = new THREE.Group();
  root.add(exteriorStatic);
  const dynamicG = new THREE.Group();
  root.add(dynamicG);

  const state = { entDoorOpen: false, entDoorAngle: 0 };
  const flatDoors = [];
  const thaiWindows = [];
  const interactiveProps = [];
  const animatedFans = [];
  const floorInteriorGroups = [];
  const floorDynamicGroups = []; // Per-floor dynamic culling so 16 flats stay locked at 60 FPS!
  const floorSeats = new Map();

  // Helper: Spinning Ceiling Fan
  function addCeilingFan(targetDynG, lx, ceilY, lz, floorIdx) {
    const fg = new THREE.Group();
    fg.position.set(lx, ceilY + 0.02, lz);
    targetDynG.add(fg);
    cylinder(fg, 0.018, 0.018, 0.26, [0, -0.13, 0], shared.whiteBand, 6);
    const rotor = new THREE.Group();
    rotor.position.set(0, -0.26, 0);
    fg.add(rotor);
    cylinder(rotor, 0.11, 0.11, 0.045, [0, 0, 0], shared.whiteBand, 8);
    cylinder(rotor, 0.055, 0.055, 0.052, [0, -0.008, 0], shared.brassMat || cushionGold, 8);
    for (let b = 0; b < 3; b++) {
      const a = (b / 3) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.012, 0.09), shared.whiteBand);
      blade.position.set(Math.cos(a) * 0.29, 0, Math.sin(a) * 0.29);
      blade.rotation.y = -a;
      rotor.add(blade);
    }
    animatedFans.push({ rotor, floorIdx });
  }

  // Helper: Small Decorative Potted Plant
  function addPottedPlant(targetG, px, py, pz, scale = 1.0, flowerIdx = 0) {
    cylinder(targetG, 0.16 * scale, 0.11 * scale, 0.28 * scale, [px, py + 0.14 * scale, pz], potMat, 8);
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.20 * scale, 1), flowerIdx % 2 === 0 ? leafBright : leafDark);
    bush.position.set(px, py + 0.36 * scale, pz);
    bush.castShadow = false;
    targetG.add(bush);
    const fMat = flowerMats[flowerIdx % flowerMats.length];
    for (const [fx, fyOff, fz] of [[0, 0.14, 0], [0.09, 0.08, 0.07], [-0.08, 0.09, -0.06]]) {
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.05 * scale, 6, 5), fMat);
      fl.position.set(px + fx * scale, py + (0.36 + fyOff) * scale, pz + fz * scale);
      fl.castShadow = false;
      targetG.add(fl);
    }
  }

  // Helper: Floor Slab with Central Stairwell Cutout
  function addFloorSlab(y, isGround = false) {
    if (isGround) {
      box(exteriorStatic, [W, y, D], [0, y * 0.5, 0], shared.garageFloorTile, { uvScale: 3.4 });
      box(exteriorStatic, [W + 0.10, y, 0.08], [0, y * 0.5, hd + 0.02], shared.colorfulTile, { uvScale: 2.2 });

      // LONG HILL-CLIMB ANTI-SLIP TILED RAMP FOR CARS & BIKES
      const rampW = 3.60;
      const rampSegs = 22;
      for (let rs = 0; rs < rampSegs; rs++) {
        const frac = (rs + 0.5) / rampSegs;
        const segH = THREE.MathUtils.lerp(y, 0.03, frac);
        const segZ = hd + frac * RAMP_LEN;
        box(exteriorStatic, [rampW, segH, RAMP_LEN / rampSegs + 0.03], [0, segH * 0.5, segZ], shared.bikeRampTile, { uvScale: 1.1 });
      }
      for (let rs = 0; rs < 12; rs++) {
        const frac = (rs + 0.5) / 12;
        const curbH = THREE.MathUtils.lerp(y + 0.16, 0.16, frac);
        const segZ = hd + frac * RAMP_LEN;
        box(exteriorStatic, [0.18, curbH, RAMP_LEN / 12 + 0.04], [-rampW * 0.5 - 0.09, curbH * 0.5, segZ], shared.colorfulTile, { uvScale: 0.9 });
        box(exteriorStatic, [0.18, curbH, RAMP_LEN / 12 + 0.04], [rampW * 0.5 + 0.09, curbH * 0.5, segZ], shared.colorfulTile, { uvScale: 0.9 });
      }

      // 6-Step Colorful-Tiled Pedestrian Stairs + Stainless Steel Handrail
      const stepW = 1.70;
      const stepCx = 2.90;
      for (let st = 0; st < 6; st++) {
        const stH = ((6 - st) / 6) * y;
        const stZ = hd + (st + 0.5) * 0.38;
        box(exteriorStatic, [stepW, stH, 0.39], [stepCx, stH * 0.5, stZ], shared.colorfulTile, { uvScale: 0.9 });
        box(exteriorStatic, [stepW + 0.04, 0.035, 0.41], [stepCx, stH + 0.015, stZ], shared.whiteBand);
      }
      rodBetween(exteriorStatic, [3.70, y + 0.88, hd + 0.10], [3.70, 0.96, hd + 2.24], 0.025, shinyStainlessSteel, 6);
      rodBetween(exteriorStatic, [3.70, y + 0.46, hd + 0.10], [3.70, 0.54, hd + 2.24], 0.014, shinyStainlessSteel, 6);
      for (const [pz, py] of [[hd + 0.12, y], [hd + 1.18, y * 0.5], [hd + 2.22, 0.08]]) {
        cylinder(exteriorStatic, 0.020, 0.020, 0.88, [3.70, py + 0.44, pz], shinyStainlessSteel, 6);
      }
      return;
    }

    const slabH = 0.22;
    const slabY = y - 0.11;
    const slabMat = y >= roofY - 0.05 ? cementSlabMat : (m.pillarTile || cementSlabMat);
    // Left Wing Slab (A1 + A2)
    box(exteriorStatic, [CORR_MIN_X - (-hw), slabH, D], [(-hw + CORR_MIN_X) * 0.5, slabY, 0], slabMat, { uvScale: 2.4 });
    // Right Wing Slab (B1 + B2)
    box(exteriorStatic, [hw - CORR_MAX_X, slabH, D], [(CORR_MAX_X + hw) * 0.5, slabY, 0], slabMat, { uvScale: 2.4 });
    // Center Front Landing (lz ∈ [STAIR_START_Z, +hd])
    box(exteriorStatic, [CORR_MAX_X - CORR_MIN_X, slabH, hd - STAIR_START_Z], [0, slabY, (STAIR_START_Z + hd) * 0.5], slabMat, { uvScale: 1.8 });
    // Center Back Landing (lz ∈ [-hd, STAIR_END_Z])
    box(exteriorStatic, [CORR_MAX_X - CORR_MIN_X, slabH, STAIR_END_Z - (-hd)], [0, slabY, (-hd + STAIR_END_Z) * 0.5], slabMat, { uvScale: 1.8 });
    // Center Right Walkway beside Stairwell (lx ∈ [STAIR_MAX_X, CORR_MAX_X])
    box(exteriorStatic, [CORR_MAX_X - STAIR_MAX_X, slabH, STAIR_START_Z - STAIR_END_Z], [(STAIR_MAX_X + CORR_MAX_X) * 0.5, slabY, (STAIR_END_Z + STAIR_START_Z) * 0.5], slabMat, { uvScale: 1.8 });
    // Taltola-Style Weathered Cement Floor Slab Cornice Band
    box(exteriorStatic, [W + 0.38, 0.24, D + 0.38], [0, y - 0.08, 0], cementTrimMat, { uvScale: 2.8 });
  }

  function addOpenableThaiWindow({ floorIdx, lx, ly, lz, w, h, label, faceSign = 1 }) {
    const halfW = w * 0.5;
    box(exteriorStatic, [w + 0.10, 0.06, 0.22], [lx, ly + h * 0.5, lz], taltolaAlumMat);
    box(exteriorStatic, [w + 0.10, 0.06, 0.22], [lx, ly - h * 0.5, lz], taltolaAlumMat);
    box(exteriorStatic, [0.06, h, 0.22], [lx - halfW, ly, lz], taltolaAlumMat);
    box(exteriorStatic, [0.06, h, 0.22], [lx + halfW, ly, lz], taltolaAlumMat);
    // Taltola-style projecting concrete chajja sunshade canopy + drip band
    box(exteriorStatic, [w + 0.44, 0.10, 0.46], [lx, ly + h * 0.5 + 0.10, lz + faceSign * 0.22], cementTrimMat);
    box(exteriorStatic, [w + 0.48, 0.04, 0.06], [lx, ly + h * 0.5 + 0.06, lz + faceSign * 0.44], cementBandMat);
    box(exteriorStatic, [w + 0.20, 0.06, 0.28], [lx, ly - h * 0.5 - 0.04, lz + faceSign * 0.10], cementTrimMat);
    box(exteriorStatic, [halfW - 0.03, h - 0.08, 0.03], [lx - halfW * 0.5, ly, lz - faceSign * 0.03], taltolaGlassMat, { castShadow: false });
    for (let gx = -halfW + 0.26; gx <= halfW - 0.22; gx += 0.26) {
      box(exteriorStatic, [0.022, h - 0.06, 0.022], [lx + gx, ly, lz + faceSign * 0.12], taltolaRailMat);
    }
    for (const gy of [-h * 0.25, 0, h * 0.25]) {
      box(exteriorStatic, [w - 0.04, 0.022, 0.022], [lx, ly + gy, lz + faceSign * 0.12], taltolaRailMat);
    }
    const sash = new THREE.Group();
    const closedX = lx + halfW * 0.5;
    const openX = lx - halfW * 0.42;
    sash.position.set(closedX, ly, lz + faceSign * 0.02);
    const sw = halfW - 0.02;
    const sh = h - 0.08;
    box(sash, [sw, sh, 0.03], [0, 0, 0], taltolaGlassMat, { castShadow: false });
    box(sash, [sw, 0.045, 0.045], [0, sh * 0.5, 0], taltolaAlumMat);
    box(sash, [sw, 0.045, 0.045], [0, -sh * 0.5, 0], taltolaAlumMat);
    box(sash, [0.045, sh, 0.045], [-sw * 0.5, 0, 0], taltolaAlumMat);
    box(sash, [0.045, sh, 0.045], [sw * 0.5, 0, 0], taltolaAlumMat);
    box(sash, [0.03, 0.20, 0.05], [sw * 0.34, -0.04, -faceSign * 0.04], m.darkMetal);
    dynamicG.add(sash);
    thaiWindows.push({ floorIdx, mesh: sash, closedX, openX, open: false, progress: 0, lx, ly, lz, label });
  }

  function addExteriorDecorWindow(lx, ly, lz, w, h, onSideX = true) {
    if (onSideX) {
      const sign = lx > 0 ? 1 : -1;
      box(exteriorStatic, [0.08, h + 0.12, w + 0.12], [lx + sign * 0.03, ly, lz], taltolaAlumMat, { castShadow: false });
      box(exteriorStatic, [0.10, h, w], [lx + sign * 0.05, ly, lz], taltolaGlassMat, { castShadow: false });
      // Taltola-style concrete side sunshade chajja + drip lip + security grill
      box(exteriorStatic, [0.44, 0.09, w + 0.42], [lx + sign * 0.22, ly + h * 0.5 + 0.12, lz], cementTrimMat, { castShadow: false });
      box(exteriorStatic, [0.06, 0.04, w + 0.46], [lx + sign * 0.43, ly + h * 0.5 + 0.08, lz], cementBandMat, { castShadow: false });
      for (let gz = -w * 0.42; gz <= w * 0.43; gz += 0.28) {
        box(exteriorStatic, [0.02, h - 0.06, 0.02], [lx + sign * 0.13, ly, lz + gz], taltolaRailMat, { castShadow: false });
      }
    } else {
      box(exteriorStatic, [w + 0.12, h + 0.12, 0.08], [lx, ly, lz - 0.03], taltolaAlumMat, { castShadow: false });
      box(exteriorStatic, [w, h, 0.10], [lx, ly, lz - 0.05], taltolaGlassMat, { castShadow: false });
      box(exteriorStatic, [w + 0.42, 0.09, 0.44], [lx, ly + h * 0.5 + 0.12, lz - 0.22], cementTrimMat, { castShadow: false });
    }
  }

  // ==========================================================================
  // 1) ELEVATED LEVEL 0: HUGE 18m × 18m DRIVE-IN GARAGE + SHINY GREEN & STEEL GATE
  //    Taltola-House Realistic Weathered Cement Plaster + Concrete Base & Pilasters!
  // ==========================================================================
  addFloorSlab(FLOOR_Y[0], true);
  const gfWallTop = FLOOR_Y[0] + gfH; // 5.10
  const doorTopY = FLOOR_Y[0] + ENT_DOOR_H; // 4.25

  box(exteriorStatic, [0.26, gfWallTop, D], [-hw + 0.13, gfWallTop * 0.5, 0], gfCementWall, { uvScale: 3.0 });
  box(exteriorStatic, [0.26, gfWallTop, D], [hw - 0.13, gfWallTop * 0.5, 0], gfCementWall, { uvScale: 3.0 });
  box(exteriorStatic, [W, gfWallTop, 0.26], [0, gfWallTop * 0.5, -hd + 0.13], gfCementWall, { uvScale: 3.0 });
  box(exteriorStatic, [ENT_MIN_X - (-hw), gfWallTop, 0.28], [(-hw + ENT_MIN_X) * 0.5, gfWallTop * 0.5, hd - 0.14], gfCementWall, { uvScale: 2.8 });
  box(exteriorStatic, [hw - ENT_MAX_X, gfWallTop, 0.28], [(ENT_MAX_X + hw) * 0.5, gfWallTop * 0.5, hd - 0.14], gfCementWall, { uvScale: 2.8 });
  box(exteriorStatic, [ENT_MAX_X - ENT_MIN_X + 0.04, Math.max(0.28, gfWallTop - doorTopY), 0.28], [ENT_CX, doorTopY + Math.max(0.28, gfWallTop - doorTopY) * 0.5, hd - 0.14], gfCementWall, { uvScale: 2.4 });

  // Taltola-Style Exposed Cement Plinth Dado, Vertical Plaster Pilasters & Subtle Monsoon Damp Base
  const wingW = ENT_MIN_X - (-hw) - 0.30;
  box(exteriorStatic, [wingW, 0.85, 0.08], [-hw + 0.14 + wingW * 0.5, 0.425, hd + 0.02], cementSlabMat, { uvScale: 2.4 });
  box(exteriorStatic, [wingW, 0.85, 0.08], [ENT_MAX_X + 0.28 + wingW * 0.5, 0.425, hd + 0.02], cementSlabMat, { uvScale: 2.4 });
  box(exteriorStatic, [W + 0.06, 0.24, 0.06], [0, 0.12, -hd - 0.02], m.moss || cementSlabMat, { castShadow: false });
  box(exteriorStatic, [0.06, 0.24, D + 0.06], [-hw - 0.02, 0.12, 0], m.moss || cementSlabMat, { castShadow: false });
  box(exteriorStatic, [0.06, 0.24, D + 0.06], [hw + 0.02, 0.12, 0], m.moss || cementSlabMat, { castShadow: false });
  // Taltola-Style Horizontal Concrete Belt Molding across Ground Floor Wings
  box(exteriorStatic, [wingW + 0.06, 0.12, 0.10], [-hw + 0.14 + wingW * 0.5, gfBaseY + 1.45, hd + 0.03], cementTrimMat);
  box(exteriorStatic, [wingW + 0.06, 0.12, 0.10], [ENT_MAX_X + 0.28 + wingW * 0.5, gfBaseY + 1.45, hd + 0.03], cementTrimMat);

  // Lush Front Entrance Concrete/Brick Planter Beds with Flowering Shrubs
  for (const [plX, plW, fOff] of [[-5.95, 5.1, 0], [6.25, 4.5, 2]]) {
    box(exteriorStatic, [plW, 0.62, 0.64], [plX, 0.31, hd + 0.36], taltolaBrickMat, { uvScale: 1.8 });
    box(exteriorStatic, [plW + 0.10, 0.08, 0.72], [plX, 0.64, hd + 0.36], cementTrimMat);
    box(exteriorStatic, [plW - 0.14, 0.52, 0.50], [plX, 0.34, hd + 0.36], soilMat);
    const nShrub = Math.max(3, Math.floor(plW / 0.85));
    for (let i = 0; i < nShrub; i++) {
      const sx = plX - (plW - 0.75) * 0.5 + (i / (nShrub - 1)) * (plW - 0.75);
      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.30, 1), i % 2 === 0 ? leafBright : leafDark);
      bush.position.set(sx, 0.84, hd + 0.36);
      exteriorStatic.add(bush);
      const fMat = flowerMats[(i + fOff) % flowerMats.length];
      for (const [fx, fy, fz] of [[0, 0.22, 0.04], [0.12, 0.14, 0.12], [-0.11, 0.15, -0.06]]) {
        const fl = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 5), fMat);
        fl.position.set(sx + fx, 0.84 + fy, hd + 0.36 + fz);
        fl.castShadow = false;
        exteriorStatic.add(fl);
      }
    }
  }

  // Two Tall Taltola-Style Stone/Cement-Tiled Gate Pillars with Black Accent Bands + Glowing Globe Lamps + Intercom & CCTV
  for (const px of [ENT_MIN_X - 0.28, ENT_MAX_X + 0.28]) {
    box(exteriorStatic, [0.58, doorTopY + 0.26, 0.58], [px, (doorTopY + 0.26) * 0.5, hd + 0.14], m.pillarTile || cementTrimMat, { uvScale: 1.5 });
    box(exteriorStatic, [0.62, 0.10, 0.62], [px, gfBaseY + 0.55, hd + 0.14], m.blackTile || m.darkMetal);
    box(exteriorStatic, [0.62, 0.10, 0.62], [px, doorTopY - 0.22, hd + 0.14], m.blackTile || m.darkMetal);
    box(exteriorStatic, [0.68, 0.14, 0.68], [px, doorTopY + 0.32, hd + 0.14], cementTrimMat);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), m.lamp || shared.liftLed);
    globe.position.set(px, doorTopY + 0.56, hd + 0.14);
    dynamicG.add(globe);
  }
  box(exteriorStatic, [0.18, 0.30, 0.06], [ENT_MAX_X + 0.28, gfBaseY + 1.38, hd + 0.45], shinyStainlessSteel, { castShadow: false });
  box(exteriorStatic, [0.10, 0.14, 0.07], [ENT_MAX_X + 0.28, gfBaseY + 1.42, hd + 0.46], m.darkMetal, { castShadow: false });
  box(exteriorStatic, [0.04, 0.04, 0.08], [ENT_MAX_X + 0.28, gfBaseY + 1.29, hd + 0.46], acLedGreen, { castShadow: false });
  cylinder(exteriorStatic, 0.09, 0.07, 0.08, [ENT_MIN_X + 0.32, doorTopY - 0.04, hd + 0.36], acUnitWhite, 8);
  const cctvLens = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), m.darkMetal);
  cctvLens.position.set(ENT_MIN_X + 0.32, doorTopY - 0.09, hd + 0.36);
  exteriorStatic.add(cctvLens);

  // Grand Concrete Overhead Canopy + Structural Corbel Beam (Taltola House Style) + Warm LED Bar
  box(exteriorStatic, [ENT_MAX_X - ENT_MIN_X + 1.30, 0.28, 0.82], [ENT_CX, doorTopY + 0.14, hd + 0.18], cementBandMat);
  box(exteriorStatic, [ENT_MAX_X - ENT_MIN_X + 1.34, 0.10, 0.86], [ENT_CX, doorTopY + 0.32, hd + 0.18], cementTrimMat);
  box(dynamicG, [2.70, 0.05, 0.22], [ENT_CX, doorTopY - 0.02, hd + 0.28], shared.liftLed, { castShadow: false });
  // Entrance glow handled by emissive LED bar above gate (zero global PointLight shader overhead)

  // Glowing Emerald & Steel Nameplate Signboard above Gate
  const signTex = makeNameplateTexture(nameBn, 'প্রতি তলায় ৪টি বড় ফ্ল্যাট · গ্যারেজ ও ছাদ বাগান [E]');
  const signMat = new THREE.MeshStandardMaterial({
    map: signTex,
    emissive: 0xffffff,
    emissiveMap: signTex,
    emissiveIntensity: 0.38,
    roughness: 0.28,
  });
  const signMesh = new THREE.Mesh(new THREE.BoxGeometry(4.25, 0.76, 0.09), signMat);
  signMesh.position.set(ENT_CX, doorTopY + 0.64, hd + 0.16);
  dynamicG.add(signMesh);

  // SHINY EMERALD GREEN + MIRROR STAINLESS STEEL DOUBLE GARAGE GATE (3.80m × 3.40m)
  const leafW = (ENT_MAX_X - ENT_MIN_X) * 0.5 - 0.03;
  const gateH = ENT_DOOR_H - 0.06;
  function buildShinyGreenSteelLeaf(isRight) {
    const leaf = new THREE.Group();
    const dir = isRight ? -1 : 1;
    const cxL = dir * leafW * 0.5;
    box(leaf, [leafW, 0.12, 0.10], [cxL, 0.06, 0], shinyStainlessSteel);
    box(leaf, [leafW, 0.12, 0.10], [cxL, gateH - 0.06, 0], shinyStainlessSteel);
    box(leaf, [0.12, gateH, 0.10], [dir * 0.06, gateH * 0.5, 0], shinyStainlessSteel);
    box(leaf, [0.12, gateH, 0.10], [dir * (leafW - 0.06), gateH * 0.5, 0], shinyStainlessSteel);
    box(leaf, [leafW - 0.16, 1.38, 0.06], [cxL, 0.78, 0], greenEnamelSteel);
    box(leaf, [leafW - 0.14, 0.08, 0.095], [cxL, 0.48, 0], shinyStainlessSteel);
    box(leaf, [leafW - 0.14, 0.08, 0.095], [cxL, 1.08, 0], shinyStainlessSteel);
    box(leaf, [leafW - 0.10, 0.09, 0.105], [cxL, 1.50, 0], shinyStainlessSteel);
    const bars = 8;
    for (let b = 1; b < bars; b++) {
      const bx = dir * (b / bars) * leafW;
      const matBar = (b % 2 === 0) ? shinyStainlessSteel : greenEnamelDark;
      box(leaf, [0.044, gateH - 1.62, 0.044], [bx, 1.50 + (gateH - 1.62) * 0.5, 0], matBar);
      box(leaf, [0.068, 0.12, 0.068], [bx, gateH - 0.18, 0], shinyStainlessSteel);
    }
    box(leaf, [leafW - 0.12, 0.08, 0.085], [cxL, 2.45, 0], shinyStainlessSteel);
    box(leaf, [0.36, 0.36, 0.095], [cxL, 2.45, 0], greenEnamelSteel, { rotZ: Math.PI / 4 });
    box(leaf, [0.22, 0.22, 0.11], [cxL, 2.45, 0], shinyStainlessSteel, { rotZ: Math.PI / 4 });
    box(leaf, [0.06, 0.56, 0.16], [dir * (leafW - 0.22), 1.55, 0], shinyStainlessSteel);
    mergeStaticMeshes(leaf);
    return leaf;
  }

  const entDoorPivotLeft = new THREE.Group();
  entDoorPivotLeft.position.set(ENT_MIN_X + 0.02, FLOOR_Y[0], hd - 0.06);
  entDoorPivotLeft.add(buildShinyGreenSteelLeaf(false));
  dynamicG.add(entDoorPivotLeft);

  const entDoorPivotRight = new THREE.Group();
  entDoorPivotRight.position.set(ENT_MAX_X - 0.02, FLOOR_Y[0], hd - 0.06);
  entDoorPivotRight.add(buildShinyGreenSteelLeaf(true));
  dynamicG.add(entDoorPivotRight);

  // Level 0 Detailed Huge 18m × 18m Car & Bike Parking Garage Interior
  {
    const garG = new THREE.Group();
    garG.name = 'UserHome_ParkingGarage_GF';
    const fy = FLOOR_Y[0];
    const ceilY = fy + gfH - 0.16;
    for (const lxLine of [-7.2, -4.4, -2.2, 2.2, 4.4, 7.2]) {
      box(garG, [0.09, 0.016, 11.4], [lxLine, fy + 0.01, -0.8], shared.whiteBand, { castShadow: false });
    }
    for (const stopX of [-5.8, -3.3, 3.3, 5.8]) {
      box(garG, [1.85, 0.11, 0.18], [stopX, fy + 0.055, -6.65], m.darkMetal, { castShadow: false });
      box(garG, [0.36, 0.12, 0.19], [stopX - 0.55, fy + 0.06, -6.65], hazardYellowMat, { castShadow: false });
      box(garG, [0.36, 0.12, 0.19], [stopX + 0.55, fy + 0.06, -6.65], hazardYellowMat, { castShadow: false });
    }
    for (const lxLed of [-5.6, 0.0, 5.6]) {
      for (const lzLed of [4.6, 0.0, -4.6]) {
        box(garG, [1.85, 0.05, 0.16], [lxLed, ceilY, lzLed], shared.liftLed, { castShadow: false });
      }
    }
    box(garG, [W - 0.6, 1.45, 0.06], [0, fy + 0.72, -hd + 0.30], shared.colorfulTile, { uvScale: 2.6 });

    // WZPDCL Khulna 16-Flat Electric Meter & Breaker Board
    box(garG, [0.14, 1.45, 1.65], [-hw + 0.34, fy + 1.85, 5.20], m.darkMetal, { castShadow: false });
    const meterFace = new THREE.Mesh(new THREE.PlaneGeometry(1.54, 1.34), meterPanelMat);
    meterFace.rotation.y = Math.PI / 2;
    meterFace.position.set(-hw + 0.42, fy + 1.85, 5.20);
    garG.add(meterFace);
    for (const pz of [4.65, 5.20, 5.75]) {
      cylinder(garG, 0.022, 0.022, 1.45, [-hw + 0.32, fy + 3.25, pz], pvcPipeGrey, 6);
    }

    // Security Guard / Caretaker Desk & Chair (Front-Right Corner)
    box(garG, [1.35, 0.76, 0.68], [7.10, fy + 0.38, 6.90], warmWoodSlat);
    box(garG, [1.40, 0.05, 0.72], [7.10, fy + 0.78, 6.90], darkWalnut);
    box(garG, [0.34, 0.03, 0.24], [6.90, fy + 0.82, 6.88], curtainCream, { castShadow: false });
    cylinder(garG, 0.08, 0.11, 0.14, [7.55, fy + 0.88, 6.76], warmLampGlow, 8);
    box(garG, [0.46, 0.44, 0.46], [7.10, fy + 0.22, 7.60], darkWalnut);
    box(garG, [0.46, 0.48, 0.07], [7.10, fy + 0.66, 7.80], darkWalnut);

    // Submersible Water Pump & Dual PVC Risers (Rear-Left Utility Corner)
    box(garG, [1.05, 0.24, 0.85], [-7.55, fy + 0.12, -7.85], shared.stairConcrete);
    cylinder(garG, 0.17, 0.17, 0.48, [-7.55, fy + 0.46, -7.85], pumpBlueMat, 10);
    cylinder(garG, 0.04, 0.04, gfH - 0.5, [-8.15, fy + gfH * 0.5, -8.25], pvcPipeGrey, 8);
    cylinder(garG, 0.035, 0.035, gfH - 0.5, [-7.95, fy + gfH * 0.5, -8.25], pvcPipeGrey, 8);

    // Fire Extinguisher, Safety Bumper & Shoe/Helmet Rack near Staircase
    cylinder(garG, 0.09, 0.09, 0.48, [0.18, fy + 1.32, 2.75], lpgRedMat, 10);
    box(garG, [0.12, 0.90, 0.12], [0.02, fy + 0.55, 2.86], hazardYellowMat, { castShadow: false });
    box(garG, [0.38, 1.05, 1.25], [1.48, fy + 0.525, 3.25], warmWoodSlat);
    for (const sy of [0.35, 0.70]) {
      box(garG, [0.36, 0.04, 1.20], [1.48, fy + sy, 3.25], darkWalnut, { castShadow: false });
    }

    mergeStaticMeshes(garG);
    root.add(garG);
    floorInteriorGroups[0] = garG;
  }

  // ==========================================================================
  // 2) CENTRAL WALKABLE MARBLE STAIRCASE (GF -> 2F -> 3F -> 4F -> 5F -> ROOF)
  // ==========================================================================
  {
    const stairX = (STAIR_MIN_X + STAIR_MAX_X) * 0.5;
    const stairW = STAIR_MAX_X - STAIR_MIN_X - 0.06;
    for (let k = 0; k < floors; k++) {
      const y0 = FLOOR_Y[k];
      const y1 = FLOOR_Y[k + 1];
      const steps = 16;
      const stepSpan = (STAIR_START_Z - STAIR_END_Z) / steps;
      const stepRise = (y1 - y0) / steps;
      for (let s = 0; s < steps; s++) {
        const sz = STAIR_START_Z - (s + 0.5) * stepSpan;
        const sy = y0 + (s + 0.5) * stepRise;
        box(exteriorStatic, [stairW, stepRise + 0.16, stepSpan + 0.04], [stairX, sy - 0.04, sz], shared.stairConcrete);
      }
      rodBetween(exteriorStatic, [STAIR_MAX_X - 0.05, y0 + 0.94, STAIR_START_Z], [STAIR_MAX_X - 0.05, y1 + 0.94, STAIR_END_Z], 0.026, shinyStainlessSteel, 6);
      rodBetween(exteriorStatic, [STAIR_MAX_X - 0.05, y0 + 0.52, STAIR_START_Z], [STAIR_MAX_X - 0.05, y1 + 0.52, STAIR_END_Z], 0.014, shinyStainlessSteel, 6);
      for (let p = 0; p <= 5; p++) {
        const f = p / 5;
        const pz = THREE.MathUtils.lerp(STAIR_START_Z, STAIR_END_Z, f);
        const py = THREE.MathUtils.lerp(y0, y1, f);
        cylinder(exteriorStatic, 0.018, 0.018, 0.94, [STAIR_MAX_X - 0.05, py + 0.47, pz], shinyStainlessSteel, 6);
      }
    }
  }

  // ==========================================================================
  // HELPER: Build ONE Complete Luxury Furnished Flat (4 Flats per Upper Floor!)
  //   side  = -1 (Left: A1/A2) or +1 (Right: B1/B2)
  //   halfZ = +1 (Front half: lz ∈ [0.10, +8.74]) or -1 (Back half: lz ∈ [-8.74, -0.10])
  // ==========================================================================
  function buildQuadFlat(intG, dynFloorG, k, fy, h, side, halfZ, ceilY) {
    const isLeft = side < 0;
    const isFront = halfZ > 0;
    const minX = isLeft ? (-hw + 0.26) : (CORR_MAX_X + 0.10);
    const maxX = isLeft ? (CORR_MIN_X - 0.10) : (hw - 0.26);
    const midX = (minX + maxX) * 0.5;
    const inSign = isLeft ? 1 : -1; // Points inward toward central corridor

    // Map local Z symmetrically for Front (+1) and Back (-1) flats!
    // outerZ = ±8.74 (window facade), partyZ = ±0.10 (center party wall)
    const outerZ = halfZ * (hd - 0.26);
    const partyZ = halfZ * 0.10;
    const zAt = (distFromParty) => halfZ * (0.10 + distFromParty); // distFromParty ∈ [0, 8.64]

    const tag = `ফ্ল্যাট ${k + 1}${isLeft ? 'A' : 'B'}${isFront ? '1' : '2'}`;

    // Internal Room Divisions:
    //   Living/Dining Room: distFromParty ∈ [4.25, 8.64] (4.39m deep × 6.89m wide — spacious front/back window bay!)
    //   Master Bedroom:     distFromParty ∈ [0.00, 4.25], outer X side (width 3.65m)
    //   Kitchen & Bath:     distFromParty ∈ [0.00, 4.25], inner corridor X side (width 3.24m)
    const divZ = zAt(4.25);
    const bathZ = zAt(2.15);
    const bedDivX = isLeft ? (minX + 3.65) : (maxX - 3.65);

    // Living/Bedroom divider along divZ (leaving 1.35m wide doorway!)
    if (isLeft) {
      box(exteriorStatic, [bedDivX - minX - 0.20, h, 0.14], [(minX + bedDivX - 0.20) * 0.5, fy + h * 0.5, divZ], m.roomWall);
    } else {
      box(exteriorStatic, [maxX - (bedDivX + 0.20), h, 0.14], [(bedDivX + 0.20 + maxX) * 0.5, fy + h * 0.5, divZ], m.roomWall);
    }
    // Bedroom / Kitchen-Bath divider along bedDivX (between partyZ and divZ)
    box(exteriorStatic, [0.14, h, Math.abs(divZ - partyZ)], [bedDivX, fy + h * 0.5, (partyZ + divZ) * 0.5], m.roomWall);

    // 1) LIVING & DINING ROOM (Window Bay: distFromParty ∈ [4.25, 8.64])
    const livCz = zAt(6.45);
    box(intG, [3.4, 0.025, 2.7], [midX, fy + 0.02, livCz], m.rugMat, { castShadow: false });

    // Plush Sofa with Armrests & 3 Colorful Throw Pillows
    const sofaX = isLeft ? (minX + 0.58) : (maxX - 0.58);
    box(intG, [0.84, 0.42, 2.55], [sofaX, fy + 0.21, livCz], m.sofaFabric);
    box(intG, [0.18, 0.56, 2.55], [sofaX - inSign * 0.33, fy + 0.60, livCz], m.sofaFabric);
    box(intG, [0.86, 0.28, 0.18], [sofaX, fy + 0.48, livCz - 1.22], m.sofaFabric);
    box(intG, [0.86, 0.28, 0.18], [sofaX, fy + 0.48, livCz + 1.22], m.sofaFabric);
    box(intG, [0.15, 0.30, 0.34], [sofaX - inSign * 0.15, fy + 0.56, livCz - 0.72], cushionGold, { castShadow: false });
    box(intG, [0.15, 0.30, 0.34], [sofaX - inSign * 0.15, fy + 0.56, livCz], curtainTeal, { castShadow: false });
    box(intG, [0.15, 0.30, 0.34], [sofaX - inSign * 0.15, fy + 0.56, livCz + 0.72], cushionCoral, { castShadow: false });

    // Framed Khulna Art + Split AC Indoor Unit on Outer Wall
    const outerWallX = isLeft ? (minX + 0.04) : (maxX - 0.04);
    box(intG, [0.05, 0.98, 1.42], [outerWallX, fy + 1.88, livCz], darkWalnut, { castShadow: false });
    const livArt = new THREE.Mesh(new THREE.PlaneGeometry(1.30, 0.86), (isLeft === isFront) ? artMat0 : artMat1);
    livArt.rotation.y = isLeft ? (Math.PI / 2) : (-Math.PI / 2);
    livArt.position.set(outerWallX + inSign * 0.032, fy + 1.88, livCz);
    intG.add(livArt);
    box(intG, [0.22, 0.30, 1.00], [outerWallX + inSign * 0.10, fy + 2.74, livCz], acUnitWhite, { castShadow: false });
    box(intG, [0.03, 0.03, 0.03], [outerWallX + inSign * 0.22, fy + 2.66, livCz + 0.36], acLedGreen, { castShadow: false });

    // Glass-Top Coffee Table with Tea Tray & Ceramic Bowl
    box(intG, [0.92, 0.06, 1.38], [midX, fy + 0.44, livCz], darkWalnut);
    box(intG, [0.80, 0.02, 1.24], [midX, fy + 0.48, livCz], shared.thaiGlass, { castShadow: false });
    for (const [tx, tz] of [[-0.36, -0.54], [0.36, -0.54], [-0.36, 0.54], [0.36, 0.54]]) {
      box(intG, [0.055, 0.42, 0.055], [midX + tx, fy + 0.21, livCz + tz], darkWalnut);
    }
    box(intG, [0.32, 0.03, 0.42], [midX, fy + 0.50, livCz - 0.16], warmWoodSlat, { castShadow: false });
    cylinder(intG, 0.065, 0.085, 0.13, [midX - 0.04, fy + 0.58, livCz - 0.22], shinyStainlessSteel, 8);
    cylinder(intG, 0.12, 0.075, 0.075, [midX, fy + 0.53, livCz + 0.32], potMat, 8);

    // Luxury Wood-Slat TV Feature Wall + Interactive 65" Smart TV + Soundbar + Floating Shelf
    const tvWallX = isLeft ? (maxX - 0.06) : (minX + 0.06);
    const tvLz = zAt(6.25);
    for (let s = -4; s <= 4; s++) {
      box(intG, [0.035, 2.30, 0.08], [tvWallX + inSign * 0.02, fy + 1.26, tvLz + s * 0.21], warmWoodSlat, { castShadow: false });
    }
    box(intG, [0.40, 0.46, 1.78], [tvWallX - inSign * 0.21, fy + 0.23, tvLz], darkWalnut);
    box(intG, [0.10, 0.085, 1.12], [tvWallX - inSign * 0.17, fy + 0.51, tvLz], m.darkMetal, { castShadow: false });
    box(intG, [0.07, 0.96, 1.62], [tvWallX - inSign * 0.02, fy + 1.38, tvLz], m.darkMetal);
    box(intG, [0.22, 0.05, 1.48], [tvWallX - inSign * 0.11, fy + 2.18, tvLz], darkWalnut, { castShadow: false });
    box(intG, [0.15, 0.22, 0.08], [tvWallX - inSign * 0.11, fy + 2.32, tvLz - 0.40], clothRed, { castShadow: false });
    box(intG, [0.15, 0.20, 0.08], [tvWallX - inSign * 0.11, fy + 2.31, tvLz - 0.30], clothBlue, { castShadow: false });
    cylinder(intG, 0.055, 0.075, 0.22, [tvWallX - inSign * 0.11, fy + 2.33, tvLz + 0.38], curtainTeal, 8);
    // Wall Clock above flat door
    const clockMesh = new THREE.Mesh(new THREE.CircleGeometry(0.20, 14), clockFaceMat);
    clockMesh.rotation.y = isLeft ? (-Math.PI / 2) : (Math.PI / 2);
    clockMesh.position.set(tvWallX - inSign * 0.02, fy + 2.52, halfZ * D_FRONT_CZ);
    intG.add(clockMesh);

    const tvScr = new THREE.Mesh(new THREE.PlaneGeometry(1.52, 0.86), tvOnMat);
    tvScr.rotation.y = isLeft ? (-Math.PI / 2) : (Math.PI / 2);
    tvScr.position.set(tvWallX - inSign * 0.07, fy + 1.38, tvLz);
    dynFloorG.add(tvScr);
    interactiveProps.push({
      kind: 'tv', floorIdx: k,
      lx: tvWallX - inSign * 0.5, ly: fy, lz: tvLz,
      on: true, mesh: tvScr, label: `${tag} স্মার্ট টিভি`,
    });

    // Floor-to-Ceiling Window Curtains framing the Outer Thai Window (lx = ±5.35)
    const winCx = isLeft ? -5.35 : 5.35;
    const curtZ = outerZ - halfZ * 0.12;
    rodBetween(intG, [winCx - 1.72, fy + 2.66, curtZ], [winCx + 1.72, fy + 2.66, curtZ], 0.018, shinyStainlessSteel, 6);
    for (const cOff of [-1.50, 1.50]) {
      box(intG, [0.40, 2.52, 0.09], [winCx + cOff, fy + 1.38, curtZ], curtainTeal, { castShadow: false });
      box(intG, [0.20, 2.48, 0.06], [winCx + cOff * 0.80, fy + 1.38, curtZ + halfZ * 0.04], curtainCream, { castShadow: false });
    }

    // 4-Seater Dining Table Set near window corner (clear of doorway!)
    const dinX = isLeft ? (maxX - 1.50) : (minX + 1.50);
    const dinZ = zAt(7.65);
    box(intG, [1.24, 0.06, 0.84], [dinX, fy + 0.76, dinZ], darkWalnut);
    box(intG, [0.86, 0.015, 0.26], [dinX, fy + 0.80, dinZ], curtainTeal, { castShadow: false });
    cylinder(intG, 0.055, 0.065, 0.21, [dinX, fy + 0.90, dinZ], shared.thaiGlass, 8);
    for (const [lxO, lzO] of [[-0.52, -0.32], [0.52, -0.32], [-0.52, 0.32], [0.52, 0.32]]) {
      box(intG, [0.05, 0.74, 0.05], [dinX + lxO, fy + 0.37, dinZ + lzO], darkWalnut);
    }
    for (const [cxO, czO, backDir] of [[-0.30, -0.56, -1], [0.30, -0.56, -1], [-0.30, 0.56, 1], [0.30, 0.56, 1]]) {
      box(intG, [0.38, 0.44, 0.38], [dinX + cxO, fy + 0.22, dinZ + czO], warmWoodSlat, { castShadow: false });
      box(intG, [0.38, 0.44, 0.05], [dinX + cxO, fy + 0.64, dinZ + czO + backDir * 0.17], warmWoodSlat, { castShadow: false });
    }

    box(intG, [0.56, 0.04, 0.56], [midX, ceilY, livCz], m.lamp, { castShadow: false });
    addPottedPlant(intG, isLeft ? (minX + 0.44) : (maxX - 0.44), fy, outerZ - halfZ * 0.44, 1.1, k + (isFront ? 0 : 2));
    addCeilingFan(dynFloorG, midX, ceilY, livCz, k);

    // 2) MASTER BEDROOM (distFromParty ∈ [0.00, 4.25], outer X side)
    const bedMinX = isLeft ? minX : bedDivX;
    const bedMaxX = isLeft ? bedDivX : maxX;
    const bedCx = (bedMinX + bedMaxX) * 0.5;
    const bedBodyZ = zAt(1.25);
    const headZ = zAt(0.18);
    box(intG, [2.25, 0.02, 1.35], [bedCx, fy + 0.02, zAt(2.75)], m.rugMat, { castShadow: false });
    box(intG, [2.05, 0.30, 1.98], [bedCx, fy + 0.15, bedBodyZ], darkWalnut);
    box(intG, [2.16, 1.08, 0.15], [bedCx, fy + 0.54, headZ], darkWalnut);
    box(intG, [1.92, 0.68, 0.05], [bedCx, fy + 0.70, headZ + halfZ * 0.09], m.sofaFabric, { castShadow: false });
    box(intG, [1.96, 0.20, 1.86], [bedCx, fy + 0.40, bedBodyZ], m.mattressMat);
    box(intG, [1.98, 0.21, 1.20], [bedCx, fy + 0.41, bedBodyZ + halfZ * 0.30], m.blanketMat);
    box(intG, [0.58, 0.12, 0.34], [bedCx - 0.46, fy + 0.54, zAt(0.48)], shared.whiteBand, { castShadow: false });
    box(intG, [0.58, 0.12, 0.34], [bedCx + 0.46, fy + 0.54, zAt(0.48)], shared.whiteBand, { castShadow: false });
    box(intG, [0.34, 0.18, 0.15], [bedCx, fy + 0.57, zAt(0.64)], cushionGold, { castShadow: false });

    // Twin Nightstands with Warm Table Lamps
    for (const nsOff of [-1.28, 1.28]) {
      const nsX = bedCx + nsOff;
      if (nsX > bedMinX + 0.22 && nsX < bedMaxX - 0.22) {
        box(intG, [0.42, 0.46, 0.40], [nsX, fy + 0.23, zAt(0.34)], darkWalnut);
        cylinder(intG, 0.028, 0.055, 0.15, [nsX, fy + 0.54, zAt(0.34)], shinyStainlessSteel, 6);
        cylinder(intG, 0.085, 0.12, 0.16, [nsX, fy + 0.69, zAt(0.34)], warmLampGlow, 8);
      }
    }
    // Framed Art & Split AC on Party Wall above Bed
    box(intG, [1.22, 0.80, 0.05], [bedCx, fy + 1.70, partyZ + halfZ * 0.05], darkWalnut, { castShadow: false });
    const bedArt = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.70), (isLeft === isFront) ? artMat1 : artMat0);
    bedArt.rotation.y = isFront ? 0 : Math.PI;
    bedArt.position.set(bedCx, fy + 1.70, partyZ + halfZ * 0.085);
    intG.add(bedArt);
    box(intG, [0.94, 0.28, 0.22], [bedCx, fy + 2.74, partyZ + halfZ * 0.14], acUnitWhite, { castShadow: false });
    box(intG, [0.03, 0.03, 0.03], [bedCx + 0.32, fy + 2.66, partyZ + halfZ * 0.26], acLedGreen, { castShadow: false });

    // Dressing Table with Tall Mirror & Stool
    const drWallX = isLeft ? (bedDivX - 0.28) : (bedDivX + 0.28);
    const drSign = isLeft ? -1 : 1;
    const drZ = zAt(2.85);
    box(intG, [0.44, 0.76, 1.04], [drWallX, fy + 0.38, drZ], warmWoodSlat);
    box(intG, [0.05, 1.14, 0.74], [drWallX - drSign * 0.19, fy + 1.36, drZ], darkWalnut, { castShadow: false });
    box(intG, [0.04, 1.04, 0.64], [drWallX - drSign * 0.17, fy + 1.36, drZ], m.mirrorMat || shared.thaiGlass, { castShadow: false });
    box(intG, [0.34, 0.42, 0.34], [drWallX + drSign * 0.44, fy + 0.21, drZ], cushionGold, { castShadow: false });

    // Interactive Openable Wooden Almirah (আলমারি)
    const almX = isLeft ? (minX + 0.36) : (maxX - 0.36);
    const almZ = zAt(2.85);
    const almSign = isLeft ? 1 : -1;
    box(intG, [0.58, 2.15, 1.50], [almX, fy + 1.075, almZ], m.wood);
    for (const sy of [0.55, 1.10, 1.60]) {
      box(intG, [0.50, 0.04, 1.38], [almX, fy + sy, almZ], m.roomWall);
    }
    box(intG, [0.34, 0.14, 0.40], [almX + almSign * 0.05, fy + 0.65, almZ - 0.30], clothRed, { castShadow: false });
    box(intG, [0.34, 0.14, 0.40], [almX + almSign * 0.05, fy + 1.20, almZ + 0.26], clothBlue, { castShadow: false });
    box(intG, [0.34, 0.14, 0.40], [almX + almSign * 0.05, fy + 1.70, almZ - 0.16], clothGold, { castShadow: false });
    const almDoorL = new THREE.Group();
    almDoorL.position.set(almX + almSign * 0.30, fy + 0.04, almZ - 0.73);
    {
      const dg = new THREE.Group();
      box(dg, [0.05, 2.04, 0.72], [0, 1.02, 0.36], m.wood);
      box(dg, [0.03, 1.34, 0.42], [almSign * 0.03, 1.10, 0.36], m.mirrorMat || shared.thaiGlass);
      mergeStaticMeshes(dg);
      almDoorL.add(dg);
      dynFloorG.add(almDoorL);
    }
    const almDoorR = new THREE.Group();
    almDoorR.position.set(almX + almSign * 0.30, fy + 0.04, almZ + 0.73);
    {
      const dg = new THREE.Group();
      box(dg, [0.05, 2.04, 0.72], [0, 1.02, -0.36], m.wood);
      mergeStaticMeshes(dg);
      almDoorR.add(dg);
      dynFloorG.add(almDoorR);
    }
    interactiveProps.push({
      kind: 'almirah', floorIdx: k,
      lx: almX + almSign * 0.65, ly: fy, lz: almZ,
      open: false, angle: 0, doorL: almDoorL, doorR: almDoorR, dir: almSign,
      label: `${tag} আলমারি`,
    });
    box(intG, [0.52, 0.04, 0.52], [bedCx, ceilY, zAt(2.15)], m.lamp, { castShadow: false });
    addCeilingFan(dynFloorG, bedCx, ceilY, zAt(2.15), k);

    // 3) MODERN MODULAR KITCHEN & INTERACTIVE FRIDGE (distFromParty ∈ [2.15, 4.25], inner corridor X side)
    const kitMinX = isLeft ? bedDivX : minX;
    const kitMaxX = isLeft ? maxX : bedDivX;
    const kitCx = (kitMinX + kitMaxX) * 0.5;
    const kitWallX = isLeft ? (maxX - 0.34) : (minX + 0.34);
    const kitSign = isLeft ? -1 : 1;

    const kitMidZ = zAt(3.25);
    box(intG, [0.62, 0.84, 1.95], [kitWallX, fy + 0.42, kitMidZ], m.pillarTile);
    box(intG, [0.66, 0.06, 2.00], [kitWallX, fy + 0.86, kitMidZ], m.blackTile);
    box(intG, [0.04, 0.76, 1.98], [kitWallX - kitSign * 0.30, fy + 1.28, kitMidZ], shared.colorfulTile, { uvScale: 1.0, castShadow: false });
    box(intG, [0.36, 0.70, 1.15], [kitWallX - kitSign * 0.14, fy + 2.04, zAt(3.65)], warmWoodSlat, { castShadow: false });
    // Range Hood (Chimney) + 2-Burner Stove + Cooking Pot + Sink + Microwave + LPG Cylinder
    const stoveZ = zAt(2.75);
    box(intG, [0.46, 0.15, 0.74], [kitWallX - kitSign * 0.06, fy + 1.82, stoveZ], shinyStainlessSteel, { castShadow: false });
    box(intG, [0.22, 0.88, 0.26], [kitWallX - kitSign * 0.16, fy + 2.34, stoveZ], shinyStainlessSteel, { castShadow: false });
    box(intG, [0.40, 0.05, 0.68], [kitWallX, fy + 0.91, stoveZ], shinyStainlessSteel, { castShadow: false });
    cylinder(intG, 0.075, 0.075, 0.025, [kitWallX, fy + 0.95, stoveZ - 0.16], m.stoveFlame, 8);
    cylinder(intG, 0.075, 0.075, 0.025, [kitWallX, fy + 0.95, stoveZ + 0.16], m.stoveFlame, 8);
    cylinder(intG, 0.10, 0.09, 0.13, [kitWallX, fy + 1.02, stoveZ - 0.16], shinyStainlessSteel, 8);
    const sinkZ = zAt(3.85);
    box(intG, [0.40, 0.04, 0.48], [kitWallX, fy + 0.89, sinkZ], m.chrome || shinyStainlessSteel, { castShadow: false });
    cylinder(intG, 0.014, 0.014, 0.25, [kitWallX - kitSign * 0.21, fy + 1.03, sinkZ], shinyStainlessSteel, 6);
    box(intG, [0.32, 0.24, 0.42], [kitWallX, fy + 1.01, zAt(3.32)], m.darkMetal, { castShadow: false });
    cylinder(intG, 0.15, 0.15, 0.56, [kitWallX + kitSign * 0.56, fy + 0.28, stoveZ], lpgRedMat, 10);

    // Interactive Openable Double-Door Refrigerator (ফ্রিজ)
    const frZ = zAt(2.60);
    const frX = isLeft ? (kitMinX + 0.44) : (kitMaxX - 0.44);
    const frSign = isLeft ? 1 : -1;
    box(intG, [0.64, 1.88, 0.76], [frX, fy + 0.94, frZ], fridgeBodyMat);
    box(intG, [0.06, 1.58, 0.62], [frX + frSign * 0.31, fy + 0.94, frZ], fridgeInnerLight, { castShadow: false });
    cylinder(intG, 0.045, 0.045, 0.22, [frX + frSign * 0.14, fy + 1.10, frZ - 0.12], clothBlue, 8);
    cylinder(intG, 0.045, 0.045, 0.20, [frX + frSign * 0.14, fy + 1.09, frZ + 0.06], clothRed, 8);
    const frDoor = new THREE.Group();
    frDoor.position.set(frX + frSign * 0.33, fy + 0.04, frZ - 0.37);
    {
      const dg = new THREE.Group();
      box(dg, [0.06, 1.80, 0.74], [0, 0.90, 0.37], fridgeBodyMat);
      box(dg, [0.04, 0.50, 0.04], [frSign * 0.05, 1.16, 0.64], shinyStainlessSteel);
      mergeStaticMeshes(dg);
      frDoor.add(dg);
      dynFloorG.add(frDoor);
    }
    interactiveProps.push({
      kind: 'fridge', floorIdx: k,
      lx: frX + frSign * 0.68, ly: fy, lz: frZ,
      open: false, angle: 0, door: frDoor, dir: frSign,
      label: `${tag} ফ্রিজ`,
    });

    // 4) COMPLETE ATTACHED BATHROOM (distFromParty ∈ [0.00, 2.15], inner corridor X side)
    const bathCz = (partyZ + bathZ) * 0.5;
    const bathW = kitMaxX - kitMinX - 0.18;
    const bathD = Math.abs(bathZ - partyZ) - 0.16;
    box(intG, [bathW, 0.03, bathD], [kitCx, fy + 0.02, bathCz], m.bathTile, { castShadow: false });
    box(intG, [bathW, 1.42, 0.03], [kitCx, fy + 0.73, partyZ + halfZ * 0.04], m.bathTile, { castShadow: false });
    box(intG, [0.03, 1.42, bathD], [kitWallX - kitSign * 0.30, fy + 0.73, bathCz], m.bathTile, { castShadow: false });
    // Commode
    const comX = kitCx;
    const comZ = zAt(0.54);
    cylinder(intG, 0.17, 0.13, 0.36, [comX, fy + 0.19, comZ], m.porcelain, 10);
    cylinder(intG, 0.21, 0.17, 0.08, [comX, fy + 0.40, comZ], m.porcelain, 10);
    box(intG, [0.38, 0.38, 0.18], [comX, fy + 0.63, zAt(0.22)], m.porcelain);
    // Pedestal Wash Basin + Framed Mirror
    const basZ = zAt(1.38);
    cylinder(intG, 0.085, 0.105, 0.65, [kitWallX + kitSign * 0.04, fy + 0.33, basZ], m.porcelain, 8);
    box(intG, [0.36, 0.13, 0.46], [kitWallX + kitSign * 0.08, fy + 0.73, basZ], m.porcelain);
    box(intG, [0.04, 0.66, 0.48], [kitWallX - kitSign * 0.26, fy + 1.40, basZ], shinyStainlessSteel, { castShadow: false });
    box(intG, [0.045, 0.60, 0.42], [kitWallX - kitSign * 0.24, fy + 1.40, basZ], m.mirrorMat || shared.thaiGlass, { castShadow: false });
    // Rain Shower + Towel Bar + Bucket & Mug
    const shX = isLeft ? (kitMinX + 0.28) : (kitMaxX - 0.28);
    const shZ = zAt(1.10);
    rodBetween(intG, [shX, fy + 0.90, shZ], [shX, fy + 2.16, shZ], 0.015, shinyStainlessSteel, 6);
    rodBetween(intG, [shX, fy + 2.16, shZ], [shX - kitSign * 0.26, fy + 2.10, shZ], 0.015, shinyStainlessSteel, 6);
    cylinder(intG, 0.10, 0.08, 0.03, [shX - kitSign * 0.26, fy + 2.06, shZ], shinyStainlessSteel, 8);
    box(intG, [0.04, 0.03, 0.50], [shX, fy + 1.30, zAt(1.65)], shinyStainlessSteel, { castShadow: false });
    box(intG, [0.07, 0.40, 0.34], [shX - kitSign * 0.03, fy + 1.10, zAt(1.65)], cushionCoral, { castShadow: false });
    cylinder(intG, 0.15, 0.11, 0.32, [shX - kitSign * 0.24, fy + 0.17, zAt(0.82)], m.bucketMat || clothBlue, 8);
    box(intG, [0.40, 0.04, 0.40], [kitCx, ceilY, bathCz], m.lamp, { castShadow: false });

    // Sittable Furniture (World Coordinates)
    const sofaW = localToWorld(sofaX + (isLeft ? 0.10 : -0.10), livCz);
    const bedW = localToWorld(bedCx, bedBodyZ + halfZ * 0.14);
    const comW = localToWorld(comX, comZ + halfZ * 0.06);
    return [
      { seatX: sofaW.x, seatZ: sofaW.z, seatY: 0.46, yaw: rotY + (isLeft ? Math.PI / 2 : -Math.PI / 2), fy, label: `${tag} সোফা` },
      { seatX: bedW.x, seatZ: bedW.z, seatY: 0.54, yaw: rotY + (isFront ? 0 : Math.PI), fy, label: `${tag} মাস্টার বেড` },
      { seatX: comW.x, seatZ: comW.z, seatY: 0.46, yaw: rotY + (isFront ? 0 : Math.PI), fy, label: `${tag} কমোড` },
    ];
  }

  // ==========================================================================
  // 3) FLOORS 2, 3, 4 & 5: 4 BIG ENCLOSED FLATS PER FLOOR (2 LEFT + 2 RIGHT!)
  // ==========================================================================
  for (let k = 1; k < floors; k++) {
    const fy = FLOOR_Y[k];
    const h = flH;
    addFloorSlab(fy, false);

    const dynFloorG = new THREE.Group();
    dynFloorG.name = `UserHome_Dynamic_F${k}`;
    dynamicG.add(dynFloorG);
    floorDynamicGroups[k] = dynFloorG;

    // Side Exterior Walls (-X, +X)
    box(exteriorStatic, [0.24, h, D], [-hw + 0.12, fy + h * 0.5, 0], softWhiteWall);
    box(exteriorStatic, [0.24, h, D], [hw - 0.12, fy + h * 0.5, 0], softWhiteWall);

    // Side Decorative Exterior Windows (2 for Front Flat, 2 for Back Flat on both sides!)
    for (const wz of [-6.4, -2.4, 2.4, 6.4]) {
      addExteriorDecorWindow(-hw, fy + 1.62, wz, 1.55, 1.35, true);
      addExteriorDecorWindow(hw, fy + 1.62, wz, 1.55, 1.35, true);
    }

    // Front (+Z) & Back (-Z) Exterior Walls with Openable Thai Windows for ALL 4 Flats (A1, B1 front + A2, B2 back!)
    const winA = -5.35;
    const winB = 5.35;
    const winW = 2.80;
    for (const faceZ of [1, -1]) {
      const zWall = faceZ * (hd - 0.12);
      box(exteriorStatic, [W, 0.85, 0.24], [0, fy + 0.425, zWall], softWhiteWall);
      box(exteriorStatic, [W, h - 2.40, 0.24], [0, fy + 2.40 + (h - 2.40) * 0.5, zWall], softWhiteWall);
      box(exteriorStatic, [(winA - winW * 0.5) - (-hw), 1.55, 0.24], [(-hw + winA - winW * 0.5) * 0.5, fy + 1.625, zWall], softWhiteWall);
      box(exteriorStatic, [(winB - winW * 0.5) - (winA + winW * 0.5), 1.55, 0.24], [0, fy + 1.625, zWall], softWhiteWall);
      box(exteriorStatic, [hw - (winB + winW * 0.5), 1.55, 0.24], [(winB + winW * 0.5 + hw) * 0.5, fy + 1.625, zWall], softWhiteWall);

      const suffix = faceZ > 0 ? '1' : '2';
      addOpenableThaiWindow({ floorIdx: k, lx: winA, ly: fy + 1.625, lz: zWall, w: winW, h: 1.55, faceSign: faceZ, label: `ফ্ল্যাট ${k + 1}A${suffix} থাই জানালা` });
      addOpenableThaiWindow({ floorIdx: k, lx: winB, ly: fy + 1.625, lz: zWall, w: winW, h: 1.55, faceSign: faceZ, label: `ফ্ল্যাট ${k + 1}B${suffix} থাই জানালা` });

      // Twin Wide Taltola-Style Realistic Cement Balconies on BOTH Front (A1/B1) & Rear (A2/B2) Facades!
      for (const bx of [winA, winB]) {
        const balW = 5.10;
        const balOuterZ = faceZ * (hd + 1.00);
        // Cantilevered Concrete Balcony Slab + White Cement Fascia Edge
        box(exteriorStatic, [balW + 0.14, 0.22, 1.12], [bx, fy + 0.02, faceZ * (hd + 0.52)], cementBandMat, { uvScale: 2.2 });
        box(exteriorStatic, [balW + 0.10, 0.42, 0.16], [bx, fy - 0.08, balOuterZ], bx > 0 ? cementBandMat : softWhiteWall, { uvScale: 2.4 });
        // Solid Weathered Cement Half-Parapet Wall + Concrete Coping Trim
        box(exteriorStatic, [balW, 0.54, 0.16], [bx, fy + 0.38, balOuterZ], softWhiteWall, { uvScale: 2.2 });
        box(exteriorStatic, [balW + 0.10, 0.08, 0.24], [bx, fy + 0.68, balOuterZ], cementTrimMat);
        // Taltola-Style Steel/Aluminum Balcony Railing Bars above Cement Parapet
        for (const ry of [fy + 0.84, fy + 1.08]) {
          rodBetween(exteriorStatic, [bx - balW * 0.5, ry, balOuterZ], [bx + balW * 0.5, ry, balOuterZ], 0.022, taltolaRailMat, 8);
        }
        for (let px = -balW * 0.5; px <= balW * 0.5 + 0.01; px += 0.64) {
          rodBetween(exteriorStatic, [bx + px, fy + 0.70, balOuterZ], [bx + px, fy + 1.08, balOuterZ], 0.020, taltolaRailMat, 6);
        }
        // Full-Height Cement Side Privacy Wing Walls (just like Taltola House!)
        box(exteriorStatic, [0.16, h - 0.20, 1.10], [bx - balW * 0.5, fy + (h - 0.20) * 0.5, faceZ * (hd + 0.52)], softWhiteWall, { uvScale: 2.0 });
        box(exteriorStatic, [0.16, h - 0.20, 1.10], [bx + balW * 0.5, fy + (h - 0.20) * 0.5, faceZ * (hd + 0.52)], softWhiteWall, { uvScale: 2.0 });
        addPottedPlant(exteriorStatic, bx - balW * 0.38, fy + 0.14, faceZ * (hd + 0.52), 0.92, k + (bx < 0 ? 0 : 2));
        addPottedPlant(exteriorStatic, bx + balW * 0.38, fy + 0.14, faceZ * (hd + 0.52), 0.88, k + (bx < 0 ? 1 : 3));
        const acX = bx < 0 ? (bx - balW * 0.5 + 0.28) : (bx + balW * 0.5 - 0.28);
        box(exteriorStatic, [0.32, 0.52, 0.72], [acX, fy + 0.42, faceZ * (hd + 0.48)], acUnitWhite, { castShadow: false });
        const acFan = cylinder(exteriorStatic, 0.18, 0.18, 0.04, [acX + (bx < 0 ? 0.16 : -0.16), fy + 0.44, faceZ * (hd + 0.48)], m.darkMetal, 10);
        acFan.rotation.z = Math.PI / 2;
        acFan.castShadow = false;
      }
    }

    // Taltola-House Signature Central Exposed Red-Brick Staircase Column + Frosted Stair Window & Louvers (Front & Rear!)
    for (const faceZ of [1, -1]) {
      box(exteriorStatic, [2.45, h, 0.34], [0, fy + h * 0.5, faceZ * (hd + 0.12)], taltolaBrickMat, { uvScale: 2.5 });
      box(exteriorStatic, [0.92, 2.24, 0.08], [0, fy + 1.56, faceZ * (hd + 0.30)], taltolaFrostedMat, { castShadow: false });
      box(exteriorStatic, [1.02, 0.06, 0.10], [0, fy + 2.68, faceZ * (hd + 0.30)], taltolaAlumMat, { castShadow: false });
      box(exteriorStatic, [1.02, 0.06, 0.10], [0, fy + 0.44, faceZ * (hd + 0.30)], taltolaAlumMat, { castShadow: false });
      for (let li = 0; li < 6; li++) {
        rodBetween(exteriorStatic, [-0.42, fy + 0.62 + li * 0.34, faceZ * (hd + 0.35)], [0.42, fy + 0.74 + li * 0.34, faceZ * (hd + 0.35)], 0.010, taltolaAlumMat, 5);
      }
    }
    // Structural Cement Relief Pilasters flanking Front Facade
    for (const px of [-hw + 0.20, -1.85, 1.85, hw - 0.20]) {
      box(exteriorStatic, [0.42, h, 0.14], [px, fy + h * 0.5, hd + 0.05], cementTrimMat, { uvScale: 2.4 });
    }
    for (const sx of [-hw + 0.55, hw - 0.55]) {
      box(exteriorStatic, [0.16, 0.34, 0.12], [sx, fy + 2.0, hd + 0.07], m.darkMetal, { castShadow: false });
      box(dynamicG, [0.12, 0.06, 0.10], [sx, fy + 2.18, hd + 0.08], shared.liftLed, { castShadow: false });
      box(dynamicG, [0.12, 0.06, 0.10], [sx, fy + 1.82, hd + 0.08], shared.liftLed, { castShadow: false });
    }

    // --- SOLID PARTY WALL AT lz = 0.0 SEPARATING FRONT FLATS (A1/B1) FROM BACK FLATS (A2/B2)! ---
    box(exteriorStatic, [CORR_MIN_X - (-hw), h, 0.18], [(-hw + CORR_MIN_X) * 0.5, fy + h * 0.5, 0], m.roomWall);
    box(exteriorStatic, [hw - CORR_MAX_X, h, 0.18], [(CORR_MAX_X + hw) * 0.5, fy + h * 0.5, 0], m.roomWall);

    // --- CENTRAL CORRIDOR WALLS WITH 4 OPENABLE MAIN FLAT DOORS (2 ON LEFT + 2 ON RIGHT!) ---
    for (const corrX of [CORR_MIN_X, CORR_MAX_X]) {
      box(exteriorStatic, [0.16, h, D_REAR_MIN_Z - (-hd)], [corrX, fy + h * 0.5, (-hd + D_REAR_MIN_Z) * 0.5], m.roomWall);
      box(exteriorStatic, [0.16, h, D_FRONT_MIN_Z - D_REAR_MAX_Z], [corrX, fy + h * 0.5, (D_REAR_MAX_Z + D_FRONT_MIN_Z) * 0.5], m.roomWall);
      box(exteriorStatic, [0.16, h, hd - D_FRONT_MAX_Z], [corrX, fy + h * 0.5, (D_FRONT_MAX_Z + hd) * 0.5], m.roomWall);
      box(exteriorStatic, [0.16, h - 2.26, D_FRONT_MAX_Z - D_FRONT_MIN_Z], [corrX, fy + 2.26 + (h - 2.26) * 0.5, D_FRONT_CZ], m.roomWall);
      box(exteriorStatic, [0.16, h - 2.26, D_REAR_MAX_Z - D_REAR_MIN_Z], [corrX, fy + 2.26 + (h - 2.26) * 0.5, D_REAR_CZ], m.roomWall);
    }

    const doorSpecs = [
      { lx: CORR_MIN_X, minZ: D_FRONT_MIN_Z, maxZ: D_FRONT_MAX_Z, cz: D_FRONT_CZ, openAngle: Math.PI * 0.54, plaque: `ফ্ল্যাট ${k + 1}A1`, sub: 'বাম-সামনের ফ্ল্যাট', faceSign: 1, label: `ফ্ল্যাট ${k + 1}A1 (বাম-সামনে)` },
      { lx: CORR_MIN_X, minZ: D_REAR_MIN_Z, maxZ: D_REAR_MAX_Z, cz: D_REAR_CZ, openAngle: Math.PI * 0.54, plaque: `ফ্ল্যাট ${k + 1}A2`, sub: 'বাম-পেছনের ফ্ল্যাট', faceSign: 1, label: `ফ্ল্যাট ${k + 1}A2 (বাম-পেছনে)` },
      { lx: CORR_MAX_X, minZ: D_FRONT_MIN_Z, maxZ: D_FRONT_MAX_Z, cz: D_FRONT_CZ, openAngle: -Math.PI * 0.54, plaque: `ফ্ল্যাট ${k + 1}B1`, sub: 'ডান-সামনের ফ্ল্যাট', faceSign: -1, label: `ফ্ল্যাট ${k + 1}B1 (ডান-সামনে)` },
      { lx: CORR_MAX_X, minZ: D_REAR_MIN_Z, maxZ: D_REAR_MAX_Z, cz: D_REAR_CZ, openAngle: -Math.PI * 0.54, plaque: `ফ্ল্যাট ${k + 1}B2`, sub: 'ডান-পেছনের ফ্ল্যাট', faceSign: -1, label: `ফ্ল্যাট ${k + 1}B2 (ডান-পেছনে)` },
    ];
    for (const ds of doorSpecs) {
      box(exteriorStatic, [0.20, 2.26, 0.08], [ds.lx, fy + 1.13, ds.minZ], darkWalnut, { castShadow: false });
      box(exteriorStatic, [0.20, 2.26, 0.08], [ds.lx, fy + 1.13, ds.maxZ], darkWalnut, { castShadow: false });
      box(exteriorStatic, [0.20, 0.08, ds.maxZ - ds.minZ + 0.08], [ds.lx, fy + 2.26, ds.cz], darkWalnut, { castShadow: false });
      const pqMat = new THREE.MeshStandardMaterial({ map: makeDoorPlaqueTexture(ds.plaque, ds.sub), roughness: 0.35 });
      const pqMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.17), pqMat);
      pqMesh.rotation.y = ds.faceSign > 0 ? (Math.PI / 2) : (-Math.PI / 2);
      pqMesh.position.set(ds.lx + ds.faceSign * 0.095, fy + 1.62, ds.maxZ + 0.32);
      dynFloorG.add(pqMesh);

      const piv = new THREE.Group();
      piv.position.set(ds.lx, fy + 0.02, ds.minZ + 0.02);
      const dg = new THREE.Group();
      const dw = ds.maxZ - ds.minZ - 0.04;
      box(dg, [0.07, 2.22, dw], [0, 1.11, dw * 0.5], m.wood);
      box(dg, [0.085, 0.72, dw * 0.66], [0, 1.62, dw * 0.5], darkWalnut);
      box(dg, [0.085, 0.72, dw * 0.66], [0, 0.64, dw * 0.5], darkWalnut);
      box(dg, [0.12, 0.22, 0.05], [0, 1.04, dw - 0.14], shinyStainlessSteel);
      mergeStaticMeshes(dg);
      piv.add(dg);
      dynFloorG.add(piv);
      flatDoors.push({
        floorIdx: k, pivot: piv, lx: ds.lx, ly: fy, lz: ds.cz,
        open: false, angle: 0, openAngle: ds.openAngle, label: ds.label,
        collider: { minX: ds.lx - 0.14, maxX: ds.lx + 0.14, minZ: ds.minZ, maxZ: ds.maxZ },
      });
    }

    // Build ALL 4 Big Luxury Furnished Flats on Floor k (A1, A2, B1, B2)
    const intG = new THREE.Group();
    intG.name = `UserHome_Interior_F${k}`;
    const ceilY = fy + h - 0.16;
    const seatsA1 = buildQuadFlat(intG, dynFloorG, k, fy, h, -1, 1, ceilY);
    const seatsA2 = buildQuadFlat(intG, dynFloorG, k, fy, h, -1, -1, ceilY);
    const seatsB1 = buildQuadFlat(intG, dynFloorG, k, fy, h, 1, 1, ceilY);
    const seatsB2 = buildQuadFlat(intG, dynFloorG, k, fy, h, 1, -1, ceilY);

    // Corridor Ceiling LEDs + Front & Back Landing Potted Plants + Fire Extinguisher
    box(intG, [0.52, 0.04, 0.52], [0.65, ceilY, 5.2], m.lamp, { castShadow: false });
    box(intG, [0.52, 0.04, 0.52], [0.65, ceilY, 0.0], m.lamp, { castShadow: false });
    box(intG, [0.52, 0.04, 0.52], [0.65, ceilY, -5.2], m.lamp, { castShadow: false });
    addPottedPlant(intG, 0.0, fy, hd - 0.55, 0.95, k + 1);
    addPottedPlant(intG, 0.0, fy, -hd + 0.55, 0.95, k + 3);
    cylinder(intG, 0.075, 0.075, 0.42, [-1.52, fy + 1.25, -hd + 0.34], lpgRedMat, 8);

    mergeStaticMeshes(intG);
    root.add(intG);
    floorInteriorGroups[k] = intG;
    floorSeats.set(k, [...seatsA1, ...seatsA2, ...seatsB1, ...seatsB2]);
  }

  // Taltola-Style Full-Height Structural Concrete Corner Pilasters + Exposed PVC Rainwater Downpipes
  for (const cxP of [-hw + 0.04, hw - 0.04]) {
    for (const czP of [-hd + 0.04, hd - 0.04]) {
      box(exteriorStatic, [0.34, roofY + 1.15, 0.34], [cxP, (roofY + 1.15) * 0.5, czP], cementTrimMat, { uvScale: 2.8 });
    }
  }
  for (const rpx of [-hw - 0.08, hw + 0.08]) {
    for (const rpz of [-hd + 0.45, 0.45, hd - 0.45]) {
      cylinder(exteriorStatic, 0.055, 0.055, roofY + 0.4, [rpx, (roofY + 0.4) * 0.5, rpz], m.pvcPipe || pvcPipeGrey, 8);
    }
  }

  // ==========================================================================
  // 4) GRAND OPEN ROOFTOP (roofY = 25.20m) + BIG GARDEN + HALF-ROOF ROOM
  //    + WALKABLE STAIRS TO UPPER ROOF (28.35m) + LIGHT UPPER GARDEN + 2 WATER TANKS ON VERY TOP!
  // ==========================================================================
  addFloorSlab(roofY, false);
  // Taltola-Style Realistic Weathered Cement Rooftop Perimeter Parapet Wall (1.08m tall + coping ledge)
  box(exteriorStatic, [W, 1.08, 0.24], [0, roofY + 0.54, -hd + 0.12], softWhiteWall, { uvScale: 2.6 });
  box(exteriorStatic, [W, 1.08, 0.24], [0, roofY + 0.54, hd - 0.12], softWhiteWall, { uvScale: 2.6 });
  box(exteriorStatic, [0.24, 1.08, D], [-hw + 0.12, roofY + 0.54, 0], softWhiteWall, { uvScale: 2.6 });
  box(exteriorStatic, [0.24, 1.08, D], [hw - 0.12, roofY + 0.54, 0], softWhiteWall, { uvScale: 2.6 });
  box(exteriorStatic, [W + 0.22, 0.12, 0.32], [0, roofY + 1.10, hd - 0.08], cementTrimMat);
  box(exteriorStatic, [W + 0.22, 0.12, 0.32], [0, roofY + 1.10, -hd + 0.08], cementTrimMat);
  box(exteriorStatic, [0.32, 0.12, D + 0.22], [-hw + 0.08, roofY + 1.10, 0], cementTrimMat);
  box(exteriorStatic, [0.32, 0.12, D + 0.22], [hw - 0.08, roofY + 1.10, 0], cementTrimMat);

  // Central Stairhead Mumty Room (চিলেকোঠা — Taltola House Style Plaster + Exposed Brick Rear Wall!)
  {
    const mW = MUM_MAX_X - MUM_MIN_X;
    const mD = MUM_MAX_Z - MUM_MIN_Z;
    const mCx = (MUM_MIN_X + MUM_MAX_X) * 0.5;
    const mCz = (MUM_MIN_Z + MUM_MAX_Z) * 0.5;
    box(exteriorStatic, [mW + 0.30, 0.22, mD + 0.30], [mCx, upperRoofY - 0.11, mCz], cementTrimMat);
    box(exteriorStatic, [0.20, rH, mD], [MUM_MIN_X, roofY + rH * 0.5, mCz], softWhiteWall, { uvScale: 2.4 });
    box(exteriorStatic, [0.20, rH, mD], [MUM_MAX_X, roofY + rH * 0.5, mCz], softWhiteWall, { uvScale: 2.4 });
    box(exteriorStatic, [mW, rH, 0.22], [mCx, roofY + rH * 0.5, MUM_MIN_Z], taltolaBrickMat, { uvScale: 2.4 });
  }

  // WALKABLE EXTERIOR STAIRCASE FROM MAIN OPEN ROOFTOP UP TO PENTHOUSE ROOM ROOF (roofY -> upperRoofY!)
  {
    const upStairX = (UP_STAIR_MIN_X + UP_STAIR_MAX_X) * 0.5;
    const upStairW = UP_STAIR_MAX_X - UP_STAIR_MIN_X;
    const upSteps = 16;
    const stepSpan = (UP_STAIR_START_Z - UP_STAIR_END_Z) / upSteps;
    const stepRise = (upperRoofY - roofY) / upSteps;
    for (let s = 0; s < upSteps; s++) {
      const sz = UP_STAIR_START_Z - (s + 0.5) * stepSpan;
      const sy = roofY + (s + 0.5) * stepRise;
      box(exteriorStatic, [upStairW, stepRise + 0.18, stepSpan + 0.04], [upStairX, sy - 0.05, sz], shared.stairConcrete);
    }
    // Stainless steel handrails on both sides of the upper-roof staircase
    for (const rx of [UP_STAIR_MIN_X + 0.05, UP_STAIR_MAX_X - 0.05]) {
      rodBetween(exteriorStatic, [rx, roofY + 0.94, UP_STAIR_START_Z], [rx, upperRoofY + 0.94, UP_STAIR_END_Z], 0.025, shinyStainlessSteel, 6);
      rodBetween(exteriorStatic, [rx, roofY + 0.52, UP_STAIR_START_Z], [rx, upperRoofY + 0.52, UP_STAIR_END_Z], 0.014, shinyStainlessSteel, 6);
      for (let p = 0; p <= 5; p++) {
        const f = p / 5;
        cylinder(exteriorStatic, 0.018, 0.018, 0.94, [rx, THREE.MathUtils.lerp(roofY, upperRoofY, f) + 0.47, THREE.MathUtils.lerp(UP_STAIR_START_Z, UP_STAIR_END_Z, f)], shinyStainlessSteel, 6);
      }
    }
    // Upper Landing Bridge connecting top of staircase (lz = -2.20..-4.20) to Penthouse Roof & Tank Deck!
    box(exteriorStatic, [2.10, 0.22, 2.20], [1.15, upperRoofY - 0.11, -3.20], shared.whiteBand);
    // Safety guardrail along back edge of upper landing bridge
    box(exteriorStatic, [2.05, 0.95, 0.12], [1.15, upperRoofY + 0.48, -4.25], shared.whiteBand);
  }

  // HALF-ROOF ENTERABLE PENTHOUSE ROOM (ছাদের রুম: lx ∈ [2.10, 8.65], lz ∈ [-8.65, -0.40], roof top at upperRoofY = 20.90m!)
  {
    const rW = RROOM_MAX_X - RROOM_MIN_X;
    const rD = RROOM_MAX_Z - RROOM_MIN_Z;
    const rCx = (RROOM_MIN_X + RROOM_MAX_X) * 0.5;
    const rCz = (RROOM_MIN_Z + RROOM_MAX_Z) * 0.5;

    // Walkable Upper Roof Slab on top of Penthouse Room!
    box(exteriorStatic, [rW + 0.30, 0.22, rD + 0.30], [rCx, upperRoofY - 0.11, rCz], m.pillarTile || shared.whiteBand, { uvScale: 2.0 });
    box(exteriorStatic, [0.22, rH, rD], [RROOM_MIN_X, roofY + rH * 0.5, rCz], softWhiteWall);
    box(exteriorStatic, [0.22, rH, rD], [RROOM_MAX_X, roofY + rH * 0.5, rCz], softWhiteWall);
    box(exteriorStatic, [rW, rH, 0.22], [rCx, roofY + rH * 0.5, RROOM_MIN_Z], softWhiteWall);

    // Front (+Z) wall with Doorway & Wide Garden-View Glass Window
    box(exteriorStatic, [RROOM_DOOR_MIN_X - RROOM_MIN_X, rH, 0.22], [(RROOM_MIN_X + RROOM_DOOR_MIN_X) * 0.5, roofY + rH * 0.5, RROOM_MAX_Z], softWhiteWall);
    box(exteriorStatic, [RROOM_MAX_X - RROOM_DOOR_MAX_X, 0.90, 0.22], [(RROOM_DOOR_MAX_X + RROOM_MAX_X) * 0.5, roofY + 0.45, RROOM_MAX_Z], softWhiteWall);
    box(exteriorStatic, [RROOM_MAX_X - RROOM_DOOR_MAX_X, 0.78, 0.22], [(RROOM_DOOR_MAX_X + RROOM_MAX_X) * 0.5, roofY + 2.76, RROOM_MAX_Z], softWhiteWall);
    box(exteriorStatic, [RROOM_MAX_X - RROOM_DOOR_MAX_X - 0.45, 1.48, 0.06], [(RROOM_DOOR_MAX_X + RROOM_MAX_X) * 0.5, roofY + 1.64, RROOM_MAX_Z], shared.thaiGlass, { castShadow: false });
    box(exteriorStatic, [RROOM_DOOR_MAX_X - RROOM_DOOR_MIN_X, rH - 2.25, 0.22], [RROOM_DOOR_CX, roofY + 2.25 + (rH - 2.25) * 0.5, RROOM_MAX_Z], softWhiteWall);
    box(exteriorStatic, [rW + 0.14, 0.46, 0.08], [rCx, upperRoofY - 0.14, RROOM_MAX_Z + 0.14], shared.colorfulTile, { uvScale: 1.6 });

    // Rooftop Room Plaque
    const rPqMat = new THREE.MeshStandardMaterial({ map: makeDoorPlaqueTexture('ছাদের রুম', 'PENTHOUSE LOUNGE'), roughness: 0.35 });
    const rPq = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.21), rPqMat);
    rPq.position.set(RROOM_DOOR_MIN_X - 0.52, roofY + 1.68, RROOM_MAX_Z + 0.13);
    dynamicG.add(rPq);

    // Openable Rooftop Room Wooden Door
    const rDoorPiv = new THREE.Group();
    rDoorPiv.position.set(RROOM_DOOR_MIN_X + 0.02, roofY + 0.02, RROOM_MAX_Z);
    {
      const dg = new THREE.Group();
      const dw = RROOM_DOOR_MAX_X - RROOM_DOOR_MIN_X - 0.04;
      box(dg, [dw, 2.20, 0.07], [dw * 0.5, 1.10, 0], m.wood);
      box(dg, [0.05, 0.22, 0.12], [dw - 0.14, 1.04, 0], shinyStainlessSteel);
      mergeStaticMeshes(dg);
      rDoorPiv.add(dg);
      dynamicG.add(rDoorPiv);
    }
    flatDoors.push({
      floorIdx: floors, pivot: rDoorPiv, lx: RROOM_DOOR_CX, ly: roofY, lz: RROOM_MAX_Z,
      open: false, angle: 0, openAngle: Math.PI * 0.55, label: 'ছাদের রুমের দরজা',
      collider: { minX: RROOM_DOOR_MIN_X, maxX: RROOM_DOOR_MAX_X, minZ: RROOM_MAX_Z - 0.14, maxZ: RROOM_MAX_Z + 0.14 },
    });

    // Richly Furnished Half-Roof Penthouse Room Interior
    box(exteriorStatic, [4.2, 0.025, 3.6], [rCx, roofY + 0.02, rCz], m.rugMat, { castShadow: false });
    // Plush King Bed + Headboard + Pillows + Nightstand Lamp
    box(exteriorStatic, [2.20, 0.36, 2.00], [RROOM_MAX_X - 1.45, roofY + 0.18, RROOM_MIN_Z + 1.35], darkWalnut);
    box(exteriorStatic, [2.26, 1.05, 0.14], [RROOM_MAX_X - 1.45, roofY + 0.52, RROOM_MIN_Z + 0.28], darkWalnut);
    box(exteriorStatic, [2.10, 0.20, 1.88], [RROOM_MAX_X - 1.45, roofY + 0.45, RROOM_MIN_Z + 1.35], m.mattressMat);
    box(exteriorStatic, [2.12, 0.21, 1.18], [RROOM_MAX_X - 1.45, roofY + 0.46, RROOM_MIN_Z + 1.65], m.blanketMat);
    box(exteriorStatic, [0.58, 0.12, 0.34], [RROOM_MAX_X - 1.85, roofY + 0.58, RROOM_MIN_Z + 0.60], shared.whiteBand, { castShadow: false });
    box(exteriorStatic, [0.58, 0.12, 0.34], [RROOM_MAX_X - 1.05, roofY + 0.58, RROOM_MIN_Z + 0.60], shared.whiteBand, { castShadow: false });
    // Lounge Sofa along East interior wall
    box(exteriorStatic, [0.85, 0.42, 2.40], [RROOM_MAX_X - 0.62, roofY + 0.21, -2.55], m.sofaFabric);
    box(exteriorStatic, [0.18, 0.54, 2.40], [RROOM_MAX_X - 0.28, roofY + 0.58, -2.55], m.sofaFabric);
    box(exteriorStatic, [0.16, 0.30, 0.36], [RROOM_MAX_X - 0.48, roofY + 0.55, -2.55], cushionGold, { castShadow: false });
    // Study Desk with Glowing Laptop, Lamp & Chair
    const deskX = RROOM_MIN_X + 1.15;
    const deskZ = RROOM_MIN_Z + 0.72;
    box(exteriorStatic, [1.55, 0.06, 0.76], [deskX, roofY + 0.76, deskZ], darkWalnut);
    for (const [dx, dz] of [[-0.70, -0.32], [0.70, -0.32], [-0.70, 0.32], [0.70, 0.32]]) {
      box(exteriorStatic, [0.06, 0.74, 0.06], [deskX + dx, roofY + 0.37, deskZ + dz], darkWalnut);
    }
    box(exteriorStatic, [0.40, 0.02, 0.28], [deskX, roofY + 0.80, deskZ], m.darkMetal, { castShadow: false });
    box(exteriorStatic, [0.40, 0.25, 0.02], [deskX, roofY + 0.93, deskZ - 0.13], laptopScreenMat, { castShadow: false });
    cylinder(exteriorStatic, 0.075, 0.105, 0.15, [deskX + 0.52, roofY + 0.88, deskZ - 0.15], warmLampGlow, 8);
    box(exteriorStatic, [0.46, 0.44, 0.46], [deskX, roofY + 0.22, deskZ + 0.65], warmWoodSlat);
    box(exteriorStatic, [0.46, 0.46, 0.06], [deskX, roofY + 0.65, deskZ + 0.85], warmWoodSlat);
    // Tall Bookshelf + Split AC + Curtains + Ceiling Light & Fan
    box(exteriorStatic, [0.44, 2.15, 1.85], [RROOM_MIN_X + 0.34, roofY + 1.075, rCz + 0.65], warmWoodSlat);
    for (let bi = 0; bi < 3; bi++) {
      const by = roofY + 0.62 + bi * 0.52;
      box(exteriorStatic, [0.22, 0.22, 0.26], [RROOM_MIN_X + 0.38, by, rCz + 0.25], flowerMats[bi % flowerMats.length], { castShadow: false });
      box(exteriorStatic, [0.22, 0.20, 0.26], [RROOM_MIN_X + 0.38, by, rCz + 0.72], clothBlue, { castShadow: false });
    }
    box(exteriorStatic, [0.98, 0.28, 0.22], [rCx, roofY + 2.74, RROOM_MIN_Z + 0.20], acUnitWhite, { castShadow: false });
    box(exteriorStatic, [0.38, 2.40, 0.08], [RROOM_DOOR_MAX_X + 0.38, roofY + 1.32, RROOM_MAX_Z - 0.16], curtainTeal, { castShadow: false });
    box(exteriorStatic, [0.38, 2.40, 0.08], [RROOM_MAX_X - 0.38, roofY + 1.32, RROOM_MAX_Z - 0.16], curtainTeal, { castShadow: false });
    box(exteriorStatic, [0.60, 0.04, 0.60], [rCx, upperRoofY - 0.24, rCz], m.lamp, { castShadow: false });
    addCeilingFan(dynamicG, rCx, upperRoofY - 0.24, rCz, floors);

    // --- ON TOP OF THE PENTHOUSE ROOM (upperRoofY = 20.90m): WALKABLE UPPER TERRACE + LIGHT GARDEN! ---
    // Protective Parapet + Stainless Steel Top Rail around Upper Roof (leaving opening at lx = 2.10, lz ∈ [-4.20, -2.10]!)
    box(exteriorStatic, [rW, 0.88, 0.18], [rCx, upperRoofY + 0.44, RROOM_MIN_Z + 0.09], shared.whiteBand);
    box(exteriorStatic, [rW, 0.88, 0.18], [rCx, upperRoofY + 0.44, RROOM_MAX_Z - 0.09], shared.whiteBand);
    box(exteriorStatic, [0.18, 0.88, rD], [RROOM_MAX_X - 0.09, upperRoofY + 0.44, rCz], shared.whiteBand);
    box(exteriorStatic, [0.18, 0.88, (-4.20) - RROOM_MIN_Z], [RROOM_MIN_X + 0.09, upperRoofY + 0.44, (RROOM_MIN_Z - 4.20) * 0.5], shared.whiteBand);
    box(exteriorStatic, [0.18, 0.88, RROOM_MAX_Z - (-2.10)], [RROOM_MIN_X + 0.09, upperRoofY + 0.44, (-2.10 + RROOM_MAX_Z) * 0.5], shared.whiteBand);
    // Stainless steel top cap rails
    box(exteriorStatic, [rW + 0.06, 0.06, 0.08], [rCx, upperRoofY + 0.92, RROOM_MAX_Z - 0.09], shinyStainlessSteel, { castShadow: false });
    box(exteriorStatic, [rW + 0.06, 0.06, 0.08], [rCx, upperRoofY + 0.92, RROOM_MIN_Z + 0.09], shinyStainlessSteel, { castShadow: false });

    // Light Rooftop Garden on Top of Penthouse Room (হালকা বাগান: neat flower strip + corner pots + sky-view bench!)
    box(exteriorStatic, [4.8, 0.36, 0.82], [5.45, upperRoofY + 0.18, RROOM_MAX_Z - 0.72], shared.colorfulTile, { uvScale: 1.1 });
    box(exteriorStatic, [4.64, 0.30, 0.68], [5.45, upperRoofY + 0.21, RROOM_MAX_Z - 0.72], soilMat);
    for (let i = 0; i < 6; i++) {
      const px = 3.55 + i * 0.76;
      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 1), i % 2 === 0 ? leafBright : leafDark);
      bush.position.set(px, upperRoofY + 0.48, RROOM_MAX_Z - 0.72);
      exteriorStatic.add(bush);
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 5), flowerMats[i % flowerMats.length]);
      fl.position.set(px, upperRoofY + 0.66, RROOM_MAX_Z - 0.72);
      fl.castShadow = false;
      exteriorStatic.add(fl);
    }
    // 4 Corner Potted Ornamental Plants on Upper Roof
    addPottedPlant(exteriorStatic, RROOM_MAX_X - 0.65, upperRoofY, RROOM_MIN_Z + 0.65, 1.35, 0);
    addPottedPlant(exteriorStatic, RROOM_MIN_X + 0.65, upperRoofY, RROOM_MIN_Z + 0.65, 1.35, 2);
    addPottedPlant(exteriorStatic, RROOM_MAX_X - 0.65, upperRoofY, RROOM_MAX_Z - 1.65, 1.20, 4);
    addPottedPlant(exteriorStatic, RROOM_MIN_X + 0.65, upperRoofY, RROOM_MAX_Z - 0.72, 1.20, 1);

    // Sky-View Garden Bench & Tea Table on Upper Roof
    box(exteriorStatic, [2.05, 0.08, 0.56], [5.55, upperRoofY + 0.46, -5.65], m.wood);
    box(exteriorStatic, [2.05, 0.44, 0.08], [5.55, upperRoofY + 0.70, -5.90], m.wood);
    box(exteriorStatic, [1.92, 0.06, 0.48], [5.55, upperRoofY + 0.52, -5.63], curtainTeal, { castShadow: false });
    cylinder(exteriorStatic, 0.42, 0.42, 0.05, [5.55, upperRoofY + 0.52, -4.70], darkWalnut, 10);
    cylinder(exteriorStatic, 0.05, 0.08, 0.50, [5.55, upperRoofY + 0.25, -4.70], darkWalnut, 8);
  }

  // --- 2 LARGE OVERHEAD WATER TANKS ON THE VERY TOP PLATFORM (y = 21.35m, ABOVE CENTRAL MUMTY!) ---
  {
    const mCx = (MUM_MIN_X + MUM_MAX_X) * 0.5; // -0.825
    // Raised concrete tank stand on top of mumty roof
    box(exteriorStatic, [1.95, 0.45, 4.10], [mCx, upperRoofY + 0.225, -0.80], shared.stairConcrete);
    // Tank 1 & Tank 2 side-by-side (large ribbed black Gazi 2000L water tanks!)
    for (const tz of [-1.85, 0.25]) {
      cylinder(exteriorStatic, 0.76, 0.78, 1.62, [mCx, tankStandY + 0.81, tz], shared.waterTank, 14);
      // Ribbed reinforcement rings & top lid on each tank
      for (const ry of [0.35, 0.82, 1.28]) {
        cylinder(exteriorStatic, 0.79, 0.79, 0.07, [mCx, tankStandY + ry, tz], tankRibMat, 14);
      }
      cylinder(exteriorStatic, 0.28, 0.30, 0.14, [mCx, tankStandY + 1.68, tz], tankRibMat, 10);
    }
    // Interconnecting PVC manifold pipe between the 2 tanks + main downpipe
    rodBetween(exteriorStatic, [mCx + 0.65, tankStandY + 0.25, -1.85], [mCx + 0.65, tankStandY + 0.25, 0.25], 0.04, pvcPipeGrey, 8);
    cylinder(exteriorStatic, 0.04, 0.04, 4.2, [mCx + 0.65, tankStandY - 1.85, -3.28], pvcPipeGrey, 8);
    // Steel inspection ladder on West side of mumty leading up to the 2 tanks
    for (const lzLad of [-2.2, -1.65]) {
      cylinder(exteriorStatic, 0.022, 0.022, rH + 0.45, [MUM_MIN_X - 0.14, roofY + (rH + 0.45) * 0.5, lzLad], shinyStainlessSteel, 6);
    }
    for (let lyRung = 0.35; lyRung <= rH + 0.25; lyRung += 0.36) {
      box(exteriorStatic, [0.03, 0.03, 0.56], [MUM_MIN_X - 0.14, roofY + lyRung, -1.925], shinyStainlessSteel, { castShadow: false });
    }
  }

  // --- BIG LUSH OPEN ROOFTOP GARDEN (বড় ছাদ বাগান — বিভিন্ন ফুল ও ফলের গাছ!) ---
  {
    const addFlowerBed = (bx, bz, bw, bd, flowerIdxOffset = 0) => {
      box(exteriorStatic, [bw, 0.44, bd], [bx, roofY + 0.22, bz], shared.colorfulTile, { uvScale: 1.0 });
      box(exteriorStatic, [bw - 0.14, 0.38, bd - 0.14], [bx, roofY + 0.25, bz], soilMat);
      const nx = Math.max(2, Math.floor(bw / 0.78));
      const nz = Math.max(1, Math.floor(bd / 0.78));
      for (let ix = 0; ix < nx; ix++) {
        for (let iz = 0; iz < nz; iz++) {
          const px = bx - (bw - 0.60) * 0.5 + (nx > 1 ? (ix / (nx - 1)) * (bw - 0.60) : 0);
          const pz = bz - (bd - 0.60) * 0.5 + (nz > 1 ? (iz / (nz - 1)) * (bd - 0.60) : 0);
          const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25, 1), (ix + iz) % 2 === 0 ? leafBright : leafDark);
          foliage.position.set(px, roofY + 0.56, pz);
          exteriorStatic.add(foliage);
          const fMat = flowerMats[(ix + iz + flowerIdxOffset) % flowerMats.length];
          for (const [fx, fyOff, fz] of [[0, 0.19, 0], [0.11, 0.13, 0.09], [-0.10, 0.13, -0.08]]) {
            const fl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), fMat);
            fl.position.set(px + fx, roofY + 0.56 + fyOff, pz + fz);
            fl.castShadow = false;
            exteriorStatic.add(fl);
          }
        }
      }
    };

    const addPottedFruitTree = (tx, tz, height = 2.25, flowerIdx = 0) => {
      cylinder(exteriorStatic, 0.32, 0.23, 0.50, [tx, roofY + 0.25, tz], potMat, 8);
      cylinder(exteriorStatic, 0.06, 0.08, height * 0.58, [tx, roofY + 0.46 + height * 0.29, tz], trunkMat, 6);
      const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(0.72, 1), leafDark);
      canopy.position.set(tx, roofY + 0.46 + height * 0.68, tz);
      exteriorStatic.add(canopy);
      const canopy2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.54, 1), leafBright);
      canopy2.position.set(tx + 0.28, roofY + 0.46 + height * 0.80, tz - 0.18);
      exteriorStatic.add(canopy2);
      const fMat = flowerMats[flowerIdx % flowerMats.length];
      for (const [ox, oy, oz] of [[0.44, 0.05, 0.26], [-0.40, 0.18, -0.22], [0.12, 0.36, -0.36], [-0.22, -0.10, 0.44]]) {
        const bl = new THREE.Mesh(new THREE.SphereGeometry(0.085, 6, 5), fMat);
        bl.position.set(tx + ox, roofY + 0.46 + height * 0.68 + oy, tz + oz);
        bl.castShadow = false;
        exteriorStatic.add(bl);
      }
    };

    // Big Raised Flower Farming Beds across the Open Rooftop!
    addFlowerBed(-5.4, 7.2, 6.2, 1.55, 0);   // Front-Left Grand Flower Bed
    addFlowerBed(5.4, 7.2, 6.2, 1.55, 2);    // Front-Right Grand Flower Bed
    addFlowerBed(-7.4, -0.6, 1.55, 11.2, 4); // Long West Garden Bed
    addFlowerBed(-4.5, -7.2, 4.4, 1.55, 1);  // Back-Left Flower Bed
    addFlowerBed(5.6, 2.8, 4.4, 1.35, 3);    // Front-Right Mid Flower Bed (in front of Penthouse Room!)

    // 10 Potted Fruit & Flowering Trees around the Open Rooftop!
    addPottedFruitTree(-8.1, 7.8, 2.55, 1);
    addPottedFruitTree(-2.2, 7.8, 2.10, 2);
    addPottedFruitTree(2.2, 7.8, 2.20, 0);
    addPottedFruitTree(8.1, 7.8, 2.60, 5);
    addPottedFruitTree(-8.1, -7.8, 2.45, 3);
    addPottedFruitTree(-2.0, -7.8, 2.15, 4);
    addPottedFruitTree(8.1, 4.8, 2.30, 0);
    addPottedFruitTree(8.1, 0.8, 2.25, 1);
    addPottedFruitTree(-5.2, 4.6, 2.05, 5);
    addPottedFruitTree(-2.4, -5.0, 2.10, 2);

    // Stepping-Stone Garden Pathways connecting Mumty -> Pergola -> Penthouse Door -> Upper Stairs
    for (const [sx, sz] of [
      [-1.0, 4.0], [-2.1, 3.4], [-3.2, 2.8], [-4.2, 2.2],
      [0.2, 4.2], [1.4, 4.2], [2.8, 3.6], [3.9, 1.6], [4.0, 0.5],
      [-0.6, 3.4], [0.4, 3.0],
    ]) {
      box(exteriorStatic, [0.72, 0.03, 0.50], [sx, roofY + 0.015, sz], stonePaverMat, { castShadow: false });
    }

    // Grand Wooden Garden Pergola + Warm Fairy Lights + Cushioned Bench & Tea Table!
    for (const [px, pz] of [[-6.0, 2.0], [-2.8, 2.0], [-6.0, -2.0], [-2.8, -2.0]]) {
      box(exteriorStatic, [0.13, 2.65, 0.13], [px, roofY + 1.325, pz], m.wood);
    }
    for (let rz = -2.0; rz <= 2.05; rz += 0.66) {
      box(exteriorStatic, [3.5, 0.08, 0.10], [-4.4, roofY + 2.65, rz], m.wood);
      for (const lxBulb of [-5.5, -4.4, -3.3]) {
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 5), warmLampGlow);
        bulb.position.set(lxBulb, roofY + 2.54, rz);
        bulb.castShadow = false;
        exteriorStatic.add(bulb);
      }
    }
    box(exteriorStatic, [2.25, 0.08, 0.58], [-4.4, roofY + 0.46, -0.35], m.wood);
    box(exteriorStatic, [2.25, 0.46, 0.08], [-4.4, roofY + 0.72, -0.60], m.wood);
    box(exteriorStatic, [2.10, 0.07, 0.50], [-4.4, roofY + 0.53, -0.33], curtainTeal, { castShadow: false });
    box(exteriorStatic, [0.30, 0.26, 0.14], [-5.20, roofY + 0.68, -0.49], cushionGold, { castShadow: false });
    box(exteriorStatic, [0.30, 0.26, 0.14], [-3.60, roofY + 0.68, -0.49], cushionCoral, { castShadow: false });
    cylinder(exteriorStatic, 0.48, 0.48, 0.05, [-4.4, roofY + 0.54, 0.68], darkWalnut, 12);
    cylinder(exteriorStatic, 0.05, 0.08, 0.52, [-4.4, roofY + 0.26, 0.68], darkWalnut, 8);
    cylinder(exteriorStatic, 0.06, 0.08, 0.12, [-4.4, roofY + 0.62, 0.68], shinyStainlessSteel, 8);
    cylinder(exteriorStatic, 0.035, 0.03, 0.06, [-4.60, roofY + 0.59, 0.62], curtainCream, 6);
    cylinder(exteriorStatic, 0.035, 0.03, 0.06, [-4.20, roofY + 0.59, 0.74], curtainCream, 6);

    // Garden Water Tap & Coiled Green Hose
    cylinder(exteriorStatic, 0.025, 0.025, 0.68, [-6.35, roofY + 0.34, -5.25], pvcPipeGrey, 6);
    box(exteriorStatic, [0.16, 0.04, 0.04], [-6.26, roofY + 0.64, -5.25], shinyStainlessSteel, { castShadow: false });
    const hose = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.035, 6, 14), greenEnamelSteel);
    hose.rotation.x = Math.PI / 2;
    hose.position.set(-6.05, roofY + 0.04, -5.25);
    hose.castShadow = false;
    exteriorStatic.add(hose);
  }

  // Rooftop & Upper-Roof Seats
  const roofBenchW = localToWorld(-4.4, -0.28);
  const roofBedW = localToWorld(RROOM_MAX_X - 1.45, RROOM_MIN_Z + 1.45);
  const roofSofaW = localToWorld(RROOM_MAX_X - 0.72, -2.55);
  const upperBenchW = localToWorld(5.55, -5.58);
  floorSeats.set(floors, [
    { seatX: roofBenchW.x, seatZ: roofBenchW.z, seatY: 0.48, yaw: rotY, fy: roofY, label: 'ছাদ বাগানের বেঞ্চ' },
    { seatX: roofBedW.x, seatZ: roofBedW.z, seatY: 0.54, yaw: rotY, fy: roofY, label: 'ছাদের রুমের বিছানা' },
    { seatX: roofSofaW.x, seatZ: roofSofaW.z, seatY: 0.46, yaw: rotY - Math.PI / 2, fy: roofY, label: 'ছাদের রুমের সোফা' },
    { seatX: upperBenchW.x, seatZ: upperBenchW.z, seatY: 0.48, yaw: rotY, fy: upperRoofY, label: 'উপরের ছাদ বাগানের বেঞ্চ' },
  ]);

  mergeStaticMeshes(exteriorStatic);

  // ==========================================================================
  // 5) RUNTIME API (HILL-CLIMB GARAGE, 4-FLAT COLLISIONS, UPPER ROOF STAIRS, 60 FPS CULLING)
  // ==========================================================================
  function isInFootprint(pos, pad = 0) {
    if (!pos) return false;
    const lp = worldToLocal(pos.x, pos.z);
    return lp.x >= -hw - pad && lp.x <= hw + pad && lp.z >= -hd - pad && lp.z <= hd + pad;
  }

  function nearestFloorIndex(footY) {
    if (footY >= roofY - 0.8) return floors;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < FLOOR_Y.length; i++) {
      const d = Math.abs(footY - FLOOR_Y[i]);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  function findNearestInteractable(pos) {
    if (!pos || !isInFootprint(pos, 5.2)) return null;
    const lp = worldToLocal(pos.x, pos.z);
    const footY = pos.y - 1.68;

    if (footY < 3.4 && Math.hypot(lp.x - ENT_CX, lp.z - hd) < 5.0) {
      return {
        kind: 'ent_door',
        prompt: state.entDoorOpen
          ? '[E] সবুজ-স্টিলের গ্যারেজ গেট বন্ধ করুন'
          : '[E] সবুজ-স্টিলের গ্যারেজ গেট খুলুন (গাড়ি/বাইক পার্কিং)',
      };
    }
    for (const fd of flatDoors) {
      if (Math.abs(footY - fd.ly) < 1.35 && Math.hypot(lp.x - fd.lx, lp.z - fd.lz) < 2.25) {
        return { kind: 'flat_door', door: fd, prompt: fd.open ? `[E] ${fd.label} বন্ধ করুন` : `[E] ${fd.label} খুলুন` };
      }
    }
    for (const prop of interactiveProps) {
      if (Math.abs(footY - prop.ly) > 1.35) continue;
      if (Math.hypot(lp.x - prop.lx, lp.z - prop.lz) < 2.2) {
        if (prop.kind === 'tv') {
          return { kind: 'prop', prop, prompt: prop.on ? `[E] ${prop.label} বন্ধ করুন` : `[E] ${prop.label} চালু করুন` };
        }
        return { kind: 'prop', prop, prompt: prop.open ? `[E] ${prop.label} বন্ধ করুন` : `[E] ${prop.label} খুলুন` };
      }
    }
    for (const tw of thaiWindows) {
      if (Math.abs(footY - (tw.ly - 1.625)) > 1.35) continue;
      if (Math.hypot(lp.x - tw.lx, lp.z - tw.lz) < 2.25) {
        return { kind: 'thai_window', win: tw, prompt: tw.open ? `[E] ${tw.label} বন্ধ করুন` : `[E] ${tw.label} খুলুন` };
      }
    }
    return null;
  }

  function interact(pos) {
    const hit = findNearestInteractable(pos);
    if (!hit) return null;
    if (hit.kind === 'ent_door') {
      state.entDoorOpen = !state.entDoorOpen;
      return { action: 'door_toggled' };
    }
    if (hit.kind === 'flat_door') {
      hit.door.open = !hit.door.open;
      return { action: 'door_toggled' };
    }
    if (hit.kind === 'thai_window') {
      hit.win.open = !hit.win.open;
      return { action: 'window_toggled' };
    }
    if (hit.kind === 'prop') {
      const p = hit.prop;
      if (p.kind === 'tv') {
        p.on = !p.on;
        p.mesh.material = p.on ? tvOnMat : tvOffMat;
      } else {
        p.open = !p.open;
      }
      return { action: 'prop_toggled' };
    }
    return null;
  }

  function findNearestSeat(pos) {
    if (!isInFootprint(pos, 0.4)) return null;
    const footY = pos.y - 1.68;
    const fl = nearestFloorIndex(footY);
    const list = floorSeats.get(fl);
    if (!list) return null;
    let best = null;
    let bestD = 1.65;
    for (const s of list) {
      const d = Math.hypot(pos.x - s.seatX, pos.z - s.seatZ);
      if (d < bestD && Math.abs(footY - s.fy) < 1.35) {
        bestD = d;
        best = { ...s, dist: d };
      }
    }
    return best;
  }

  function computeGroundHeight(pos, grounded, verticalVelocity) {
    if (isInFootprint(pos, RAMP_LEN + 0.4)) {
      const lpR = worldToLocal(pos.x, pos.z);
      const footY = pos.y - 1.68;
      if (footY < 2.0 && lpR.z >= hd && lpR.z <= hd + RAMP_LEN + 0.12 && lpR.x >= -1.95 && lpR.x <= 1.95) {
        const t = THREE.MathUtils.clamp((lpR.z - hd) / RAMP_LEN, 0, 1);
        return THREE.MathUtils.lerp(FLOOR_Y[0], 0.02, t);
      }
      if (footY < 2.0 && lpR.z >= hd && lpR.z <= hd + 2.38 && lpR.x >= 1.98 && lpR.x <= 3.85) {
        const t = THREE.MathUtils.clamp((lpR.z - hd) / 2.28, 0, 1);
        return THREE.MathUtils.lerp(FLOOR_Y[0], 0.02, t);
      }
    }
    if (!isInFootprint(pos, 0.25)) return null;
    const lp = worldToLocal(pos.x, pos.z);
    const footY = pos.y - 1.68;
    const maxStepUp = grounded ? 0.65 : (verticalVelocity > 0 ? 0.08 : 0.45);

    let bestY = FLOOR_Y[0];
    // 1) Main Interior Staircase (GF -> 5F -> Open Rooftop)
    const inStairs = lp.x >= STAIR_MIN_X && lp.x <= STAIR_MAX_X && lp.z >= STAIR_END_Z && lp.z <= STAIR_START_Z;
    const inStairHole = lp.x >= STAIR_MIN_X + 0.06 && lp.x <= STAIR_MAX_X - 0.06 && lp.z > STAIR_END_Z + 0.16 && lp.z < STAIR_START_Z - 0.16;
    if (inStairs) {
      const t = THREE.MathUtils.clamp((STAIR_START_Z - lp.z) / (STAIR_START_Z - STAIR_END_Z), 0, 1);
      for (let k = 0; k < floors; k++) {
        const rampY = FLOOR_Y[k] + t * (FLOOR_Y[k + 1] - FLOOR_Y[k]);
        if (rampY <= footY + maxStepUp) bestY = Math.max(bestY, rampY);
      }
    }
    // 2) Exterior Upper-Roof Staircase (Main Open Rooftop roofY -> Penthouse Room Roof upperRoofY!)
    const inUpStairs = lp.x >= UP_STAIR_MIN_X - 0.05 && lp.x <= UP_STAIR_MAX_X + 0.05
      && lp.z >= UP_STAIR_END_Z - 0.10 && lp.z <= UP_STAIR_START_Z + 0.10;
    if (inUpStairs && footY >= roofY - 0.5) {
      const t = THREE.MathUtils.clamp((UP_STAIR_START_Z - lp.z) / (UP_STAIR_START_Z - UP_STAIR_END_Z), 0, 1);
      const rampY = roofY + t * (upperRoofY - roofY);
      if (rampY <= footY + maxStepUp) bestY = Math.max(bestY, rampY);
    }

    // 3) Main Floors & Open Rooftop Slabs
    for (let k = 0; k <= floors; k++) {
      const fy = FLOOR_Y[k];
      if (fy > footY + maxStepUp) continue;
      if (k >= 1 && inStairHole) continue;
      bestY = Math.max(bestY, fy);
    }

    // 4) Walkable Upper Roof Slab (Penthouse Room Roof + Upper Landing Bridge + Mumty Roof at upperRoofY = 20.90m!)
    const onPenthouseRoof = lp.x >= RROOM_MIN_X - 0.10 && lp.x <= RROOM_MAX_X + 0.10
      && lp.z >= RROOM_MIN_Z - 0.10 && lp.z <= RROOM_MAX_Z + 0.10;
    const onUpperBridge = lp.x >= 0.10 && lp.x <= 2.20 && lp.z >= -4.30 && lp.z <= -2.10;
    const onMumtyRoof = lp.x >= MUM_MIN_X && lp.x <= MUM_MAX_X && lp.z >= MUM_MIN_Z && lp.z <= MUM_MAX_Z;
    if ((onPenthouseRoof || onUpperBridge || onMumtyRoof) && upperRoofY <= footY + maxStepUp) {
      bestY = Math.max(bestY, upperRoofY);
    }

    return bestY;
  }

  function applyPlayerCollisions(pos, radius, footY) {
    if (!isInFootprint(pos, 1.5)) return;
    const lp = worldToLocal(pos.x, pos.z);
    const fl = nearestFloorIndex(footY);
    const inStairs = lp.x >= STAIR_MIN_X - 0.08 && lp.x <= STAIR_MAX_X + 0.08 && lp.z >= STAIR_END_Z && lp.z <= STAIR_START_Z;

    if (footY < roofY - 0.6) {
      resolveCircleAABB(lp, radius, -hw, -hw + 0.28, -hd, hd);
      resolveCircleAABB(lp, radius, hw - 0.28, hw, -hd, hd);
      resolveCircleAABB(lp, radius, -hw, hw, -hd, -hd + 0.28);

      if (footY < FLOOR_Y[1] - 0.4) {
        resolveCircleAABB(lp, radius, -hw, ENT_MIN_X, hd - 0.28, hd);
        resolveCircleAABB(lp, radius, ENT_MAX_X, hw, hd - 0.28, hd);
        if (!state.entDoorOpen) {
          resolveCircleAABB(lp, radius, ENT_MIN_X, ENT_MAX_X, hd - 0.24, hd + 0.08);
        }
      } else {
        resolveCircleAABB(lp, radius, -hw, hw, hd - 0.28, hd);
        if (!inStairs) {
          // Solid Party Wall at lz = 0.0 separating Front Flats (A1/B1) from Back Flats (A2/B2)
          resolveCircleAABB(lp, radius, -hw, CORR_MIN_X, -0.10, 0.10);
          resolveCircleAABB(lp, radius, CORR_MAX_X, hw, -0.10, 0.10);
          // Left corridor wall (2 doors: A2 back & A1 front)
          resolveCircleAABB(lp, radius, CORR_MIN_X - 0.10, CORR_MIN_X + 0.10, -hd, D_REAR_MIN_Z);
          resolveCircleAABB(lp, radius, CORR_MIN_X - 0.10, CORR_MIN_X + 0.10, D_REAR_MAX_Z, D_FRONT_MIN_Z);
          resolveCircleAABB(lp, radius, CORR_MIN_X - 0.10, CORR_MIN_X + 0.10, D_FRONT_MAX_Z, hd);
          // Right corridor wall (2 doors: B2 back & B1 front)
          resolveCircleAABB(lp, radius, CORR_MAX_X - 0.10, CORR_MAX_X + 0.10, -hd, D_REAR_MIN_Z);
          resolveCircleAABB(lp, radius, CORR_MAX_X - 0.10, CORR_MAX_X + 0.10, D_REAR_MAX_Z, D_FRONT_MIN_Z);
          resolveCircleAABB(lp, radius, CORR_MAX_X - 0.10, CORR_MAX_X + 0.10, D_FRONT_MAX_Z, hd);
          // Closed door colliders on this floor
          for (const fd of flatDoors) {
            if (fd.floorIdx === fl && !fd.open) {
              resolveCircleAABB(lp, radius, fd.collider.minX, fd.collider.maxX, fd.collider.minZ, fd.collider.maxZ);
            }
          }
        }
      }
      resolveCircleAABB(lp, 0.12, STAIR_MAX_X - 0.08, STAIR_MAX_X + 0.04, STAIR_END_Z + 0.12, STAIR_START_Z - 0.12);
    } else if (footY < upperRoofY - 0.65) {
      // Main Open Rooftop Parapet, Mumty Walls & Half-Roof Penthouse Room Walls
      if (footY - roofY < 0.72) {
        resolveCircleAABB(lp, radius, -hw, -hw + 0.26, -hd, hd);
        resolveCircleAABB(lp, radius, hw - 0.26, hw, -hd, hd);
        resolveCircleAABB(lp, radius, -hw, hw, -hd, -hd + 0.26);
        resolveCircleAABB(lp, radius, -hw, hw, hd - 0.26, hd);
      }
      // Mumty walls (open on +Z front)
      resolveCircleAABB(lp, radius, MUM_MIN_X - 0.10, MUM_MIN_X + 0.10, MUM_MIN_Z, MUM_MAX_Z);
      resolveCircleAABB(lp, radius, MUM_MAX_X - 0.10, MUM_MAX_X + 0.10, MUM_MIN_Z, MUM_MAX_Z);
      resolveCircleAABB(lp, radius, MUM_MIN_X, MUM_MAX_X, MUM_MIN_Z - 0.10, MUM_MIN_Z + 0.10);
      // Half-Roof Penthouse Room Walls
      resolveCircleAABB(lp, radius, RROOM_MIN_X - 0.12, RROOM_MIN_X + 0.12, RROOM_MIN_Z, RROOM_MAX_Z);
      resolveCircleAABB(lp, radius, RROOM_MAX_X - 0.12, RROOM_MAX_X + 0.12, RROOM_MIN_Z, RROOM_MAX_Z);
      resolveCircleAABB(lp, radius, RROOM_MIN_X, RROOM_MAX_X, RROOM_MIN_Z - 0.12, RROOM_MIN_Z + 0.12);
      resolveCircleAABB(lp, radius, RROOM_MIN_X, RROOM_DOOR_MIN_X, RROOM_MAX_Z - 0.12, RROOM_MAX_Z + 0.12);
      resolveCircleAABB(lp, radius, RROOM_DOOR_MAX_X, RROOM_MAX_X, RROOM_MAX_Z - 0.12, RROOM_MAX_Z + 0.12);
      const rDoor = flatDoors.find((d) => d.floorIdx === floors);
      if (rDoor && !rDoor.open) {
        resolveCircleAABB(lp, radius, rDoor.collider.minX, rDoor.collider.maxX, rDoor.collider.minZ, rDoor.collider.maxZ);
      }
    } else {
      // Upper Roof Safety Parapets on top of Penthouse Room (leaving entrance gap at lx = 2.10, lz ∈ [-4.20, -2.10] open!)
      if (lp.x >= RROOM_MIN_X - 0.3 && lp.x <= RROOM_MAX_X + 0.3 && lp.z >= RROOM_MIN_Z - 0.3 && lp.z <= RROOM_MAX_Z + 0.3) {
        resolveCircleAABB(lp, radius, RROOM_MIN_X, RROOM_MAX_X, RROOM_MIN_Z, RROOM_MIN_Z + 0.20);
        resolveCircleAABB(lp, radius, RROOM_MIN_X, RROOM_MAX_X, RROOM_MAX_Z - 0.20, RROOM_MAX_Z);
        resolveCircleAABB(lp, radius, RROOM_MAX_X - 0.20, RROOM_MAX_X, RROOM_MIN_Z, RROOM_MAX_Z);
        resolveCircleAABB(lp, radius, RROOM_MIN_X, RROOM_MIN_X + 0.20, RROOM_MIN_Z, -4.20);
        resolveCircleAABB(lp, radius, RROOM_MIN_X, RROOM_MIN_X + 0.20, -2.10, RROOM_MAX_Z);
      }
    }

    const wp = localToWorld(lp.x, lp.z);
    pos.x = wp.x;
    pos.z = wp.z;
  }

  // HILL-CLIMB DRIVE-IN CAR & BIKE GARAGE PHYSICS!
  function applyCarCollisions(carPos, r) {
    if (!isInFootprint(carPos, r + RAMP_LEN + 0.6)) return { hitWall: false, inGarage: false };
    const lp = worldToLocal(carPos.x, carPos.z);
    const ox = lp.x;
    const oz = lp.z;
    let inGarage = false;

    if (lp.z >= hd && lp.z <= hd + RAMP_LEN + 0.25 && lp.x >= -2.15 && lp.x <= 2.15) {
      const t = THREE.MathUtils.clamp((lp.z - hd) / RAMP_LEN, 0, 1);
      carPos.y = THREE.MathUtils.lerp(FLOOR_Y[0] + 0.01, 0.01, t);
      inGarage = true;
    } else if (lp.x >= -hw && lp.x <= hw && lp.z >= -hd && lp.z <= hd) {
      carPos.y = FLOOR_Y[0] + 0.01;
      inGarage = true;
    }

    resolveCircleAABB(lp, r, STAIR_MIN_X - 0.12, STAIR_MAX_X + 0.12, STAIR_END_Z - 0.12, STAIR_START_Z + 0.12);
    resolveCircleAABB(lp, r, -hw, -hw + 0.30, -hd, hd);
    resolveCircleAABB(lp, r, hw - 0.30, hw, -hd, hd);
    resolveCircleAABB(lp, r, -hw, hw, -hd, -hd + 0.30);
    resolveCircleAABB(lp, r, -hw, ENT_MIN_X, hd - 0.30, hd + 0.12);
    resolveCircleAABB(lp, r, ENT_MAX_X, hw, hd - 0.30, hd + 0.12);
    if (!state.entDoorOpen) {
      resolveCircleAABB(lp, r, ENT_MIN_X, ENT_MAX_X, hd - 0.25, hd + 0.12);
    }

    const hitWall = Math.hypot(lp.x - ox, lp.z - oz) > 0.002;
    if (hitWall) {
      const wp = localToWorld(lp.x, lp.z);
      carPos.x = wp.x;
      carPos.z = wp.z;
    }
    return { hitWall, inGarage };
  }

  function getZoneName(x, z, footY = 0) {
    const lp = worldToLocal(x, z);
    if (lp.x < -hw || lp.x > hw || lp.z < -hd || lp.z > hd) return null;
    if (footY >= upperRoofY - 0.6) {
      return `${zonePrefix} · UPPER ROOF GARDEN & DUAL WATER TANKS`;
    }
    if (footY >= roofY - 0.6) {
      if (lp.x >= RROOM_MIN_X && lp.x <= RROOM_MAX_X && lp.z >= RROOM_MIN_Z && lp.z <= RROOM_MAX_Z) {
        return `${zonePrefix} · HALF-ROOF PENTHOUSE ROOM`;
      }
      return `${zonePrefix} · OPEN ROOFTOP GARDEN`;
    }
    const fl = nearestFloorIndex(footY);
    if (fl === 0) return `${zonePrefix} · ELEVATED CAR & BIKE GARAGE`;
    const flTag = ` (FLOOR ${fl + 1})`;
    if (lp.x >= CORR_MIN_X && lp.x <= CORR_MAX_X) return `${zonePrefix}${flTag} · CENTRAL STAIR HALL (4 FLATS)`;
    const sideCode = lp.x < CORR_MIN_X ? 'A' : 'B';
    const halfCode = lp.z >= 0 ? '1' : '2';
    return `${zonePrefix}${flTag} · FLAT ${fl + 1}${sideCode}${halfCode}`;
  }

  function update(dt, playerPos, isLow) {
    const tgtEnt = state.entDoorOpen ? Math.PI * 0.52 : 0;
    if (Math.abs(tgtEnt - state.entDoorAngle) > 0.001) {
      state.entDoorAngle += (tgtEnt - state.entDoorAngle) * Math.min(1, dt * 6.0);
      entDoorPivotLeft.rotation.y = state.entDoorAngle;
      entDoorPivotRight.rotation.y = -state.entDoorAngle;
    }
    for (const fd of flatDoors) {
      const tgt = fd.open ? fd.openAngle : 0;
      if (Math.abs(tgt - fd.angle) > 0.001) {
        fd.angle += (tgt - fd.angle) * Math.min(1, dt * 6.5);
        fd.pivot.rotation.y = fd.angle;
      }
    }
    for (const tw of thaiWindows) {
      const tgt = tw.open ? 1 : 0;
      if (Math.abs(tgt - tw.progress) > 0.001) {
        tw.progress += (tgt - tw.progress) * Math.min(1, dt * 6.8);
        tw.mesh.position.x = THREE.MathUtils.lerp(tw.closedX, tw.openX, tw.progress);
      }
    }
    for (const prop of interactiveProps) {
      if (prop.kind === 'almirah') {
        const tgt = prop.open ? Math.PI * 0.56 : 0;
        if (Math.abs(tgt - prop.angle) > 0.001) {
          prop.angle += (tgt - prop.angle) * Math.min(1, dt * 7.0);
          prop.doorL.rotation.y = -prop.dir * prop.angle;
          prop.doorR.rotation.y = prop.dir * prop.angle;
        }
      } else if (prop.kind === 'fridge') {
        const tgt = prop.open ? Math.PI * 0.58 : 0;
        if (Math.abs(tgt - prop.angle) > 0.001) {
          prop.angle += (tgt - prop.angle) * Math.min(1, dt * 7.0);
          prop.door.rotation.y = -prop.dir * prop.angle;
        }
      }
    }

    const distSq = playerPos ? ((playerPos.x - cx) ** 2 + (playerPos.z - cz) ** 2) : 0;
    const nearInt = distSq < 54 * 54;
    const pFootY = playerPos ? (playerPos.y - 1.68) : 0;
    const curFl = nearestFloorIndex(pFootY);
    if (gateGlowLight) gateGlowLight.visible = !isLow && distSq < 60 * 60;
    for (let k = 0; k < floors; k++) {
      const grp = floorInteriorGroups[k];
      const dGrp = floorDynamicGroups[k];
      const want = nearInt && (k === 0 || Math.abs(curFl - k) <= 1 || distSq < 22 * 22);
      if (grp && grp.visible !== want) grp.visible = want;
      if (dGrp && dGrp.visible !== want) dGrp.visible = want;
    }
    if (!isLow && nearInt) {
      const rotD = dt * 5.8;
      for (const f of animatedFans) {
        if (Math.abs(curFl - f.floorIdx) <= 1) f.rotor.rotation.y += rotD;
      }
    }
  }

  return {
    id: 'E1_GoliSheshVilla',
    hasLift: false,
    liftApi: null,
    isInFootprint,
    getPrompt: (pos) => findNearestInteractable(pos)?.prompt || null,
    interact,
    findNearestSeat,
    computeGroundHeight,
    applyPlayerCollisions,
    applyCarCollisions,
    getZoneName,
    toggleAllDoors() {
      state.entDoorOpen = !state.entDoorOpen;
      for (const fd of flatDoors) fd.open = state.entDoorOpen;
    },
    update,
  };
}
