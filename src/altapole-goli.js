import * as THREE from 'three';
import { box, cylinder, rodBetween, mergeStaticMeshes } from './scene-utils.js';
import { createUserDreamHome } from './user-dream-home.js';

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
  ctx.font = 'bold 32px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText(title, 42, subtitle ? 60 : 80, 446);
  if (subtitle) {
    ctx.fillStyle = accent;
    ctx.font = '600 19px "Manrope", "Noto Sans Bengali", sans-serif';
    ctx.fillText(subtitle, 42, 114, 446);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeWeatheredPlasterTexture(baseHex, seed = 101, isOld = false) {
  let s = seed >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  const grains = isOld ? 2400 : 900;
  for (let i = 0; i < grains; i++) {
    ctx.fillStyle = rnd() > 0.5
      ? `rgba(255,255,255,${isOld ? 0.05 : 0.03})`
      : `rgba(38,32,26,${isOld ? 0.08 : 0.025})`;
    ctx.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 5, 2 + rnd() * 5);
  }
  if (isOld) {
    // Monsoon rain streaks & moss patina near cornice
    for (let i = 0; i < 34; i++) {
      const x = rnd() * 256;
      const h = 28 + rnd() * 96;
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(32,38,26,0.26)');
      g.addColorStop(1, 'rgba(32,38,26,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, 3 + rnd() * 9, h);
    }
    // Subtle plaster cracks
    ctx.strokeStyle = 'rgba(42,35,28,0.22)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 10; i++) {
      let cx = rnd() * 256;
      let cy = rnd() * 256;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let k = 0; k < 5; k++) {
        cx += (rnd() - 0.5) * 24;
        cy += rnd() * 22;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeTerracottaTileTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#943a26';
  ctx.fillRect(0, 0, 256, 256);
  const shades = ['#9b3d28', '#a8442d', '#8c3522', '#b04b33', '#853220'];
  const rh = 16;
  const cw = 42;
  for (let r = 0; r < 16; r++) {
    const off = (r % 2) * 21;
    for (let col = -1; col <= 7; col++) {
      ctx.fillStyle = shades[(r * 7 + col * 3 + 15) % shades.length];
      ctx.fillRect(col * cw + off + 1, r * rh + 1, cw - 2, rh - 2);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeCorrugatedTinTexture(hex = '#6e4532') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 12) {
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(x, 0, 4, 256);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(x + 6, 0, 4, 256);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeColorfulMosaicTileTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  // Clean pearl-white grout base
  ctx.fillStyle = '#eef2f5';
  ctx.fillRect(0, 0, 512, 512);
  // Harmonious vibrant Bangladeshi exterior decorative glazed tiles
  const palette = [
    '#0f766e', // emerald teal
    '#1d4ed8', // royal sapphire
    '#d95f43', // warm coral terracotta
    '#f59e0b', // warm amber gold
    '#10b981', // fresh jade green
    '#f8fafc', // pearl white tile
    '#0284c7', // sky cerulean
    '#e2e8f0', // soft silver pearl
  ];
  const rows = 16;
  const cols = 8;
  const rh = 512 / rows;
  const cw = 512 / cols;
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cw * 0.5);
    for (let col = -1; col <= cols; col++) {
      const idx = Math.abs(r * 5 + col * 3 + (r % 3) * 2) % palette.length;
      const x = col * cw + offset;
      const y = r * rh;
      ctx.fillStyle = palette[idx];
      ctx.fillRect(x + 2.5, y + 2.5, cw - 5, rh - 5);
      // Subtle glazed ceramic sheen on top half of each tile
      const g = ctx.createLinearGradient(x, y, x, y + rh);
      g.addColorStop(0, 'rgba(255,255,255,0.22)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.03)');
      g.addColorStop(1, 'rgba(0,0,0,0.10)');
      ctx.fillStyle = g;
      ctx.fillRect(x + 2.5, y + 2.5, cw - 5, rh - 5);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function makeBikeRampTileTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#d6d3cd';
  ctx.fillRect(0, 0, 256, 256);
  const cols = ['#c7c2b8', '#b8b2a6', '#9a4f38', '#4b6b5e'];
  for (let r = 0; r < 8; r++) {
    for (let col = 0; col < 8; col++) {
      ctx.fillStyle = ((r + col) % 4 === 0) ? cols[2] : (((r + col) % 4 === 2) ? cols[3] : cols[(r + col) % 2]);
      ctx.fillRect(col * 32 + 2, r * 32 + 2, 28, 28);
      // Anti-slip traction grooves for bikes
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(col * 32 + 5, r * 32 + 9, 22, 3);
      ctx.fillRect(col * 32 + 5, r * 32 + 19, 22, 3);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function createSharedGoliMaterials(m) {
  const terracottaTile = new THREE.MeshStandardMaterial({ map: makeTerracottaTileTexture(), roughness: 0.66 });
  const colorfulTile = new THREE.MeshStandardMaterial({ map: makeColorfulMosaicTileTexture(), roughness: 0.28, metalness: 0.08 });
  const bikeRampTile = new THREE.MeshStandardMaterial({ map: makeBikeRampTileTexture(), roughness: 0.56 });
  const garageFloorTile = new THREE.MeshStandardMaterial({ map: makeBikeRampTileTexture(), color: 0xe5e7eb, roughness: 0.46 });
  const greenSteelGate = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.28, metalness: 0.72 });
  const greenSteelAccent = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.25, metalness: 0.76 });
  const tinRust = new THREE.MeshStandardMaterial({ map: makeCorrugatedTinTexture('#7b4832'), roughness: 0.72, metalness: 0.34 });
  const tinTeal = new THREE.MeshStandardMaterial({ map: makeCorrugatedTinTexture('#275b6d'), roughness: 0.56, metalness: 0.42 });
  const thaiFrame = new THREE.MeshStandardMaterial({ color: 0xdce3ec, roughness: 0.22, metalness: 0.85 });
  const thaiGlass = new THREE.MeshPhysicalMaterial({
    color: 0x2563eb,
    transparent: true,
    opacity: 0.50,
    roughness: 0.06,
    metalness: 0.24,
    clearcoat: 1.0,
    side: THREE.DoubleSide,
  });
  const cobaltGlass = new THREE.MeshPhysicalMaterial({
    color: 0x1e56c5,
    roughness: 0.06,
    metalness: 0.35,
    clearcoat: 1.0,
    emissive: 0x0c2461,
    emissiveIntensity: 0.20,
  });
  const whiteBand = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.42 });
  const dampPlinth = new THREE.MeshStandardMaterial({ map: makeWeatheredPlasterTexture('#4a4d45', 88, true), roughness: 0.92 });
  const stairConcrete = new THREE.MeshStandardMaterial({ color: 0xd6d3ce, roughness: 0.78 });
  const liftSteel = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.28, metalness: 0.82 });
  const liftInterior = new THREE.MeshStandardMaterial({ color: 0x262d38, roughness: 0.45, metalness: 0.42 });
  const liftLed = new THREE.MeshStandardMaterial({ color: 0xfff8e1, emissive: 0xffe8a3, emissiveIntensity: 1.35 });
  const gateSteel = new THREE.MeshStandardMaterial({ color: 0x3f4c58, roughness: 0.38, metalness: 0.74 });
  const oldShutterGreen = new THREE.MeshStandardMaterial({ color: 0x275743, roughness: 0.78 });
  const oldShutterBlue = new THREE.MeshStandardMaterial({ color: 0x1f4068, roughness: 0.76 });
  const waterTank = new THREE.MeshStandardMaterial({ color: 0x151d24, roughness: 0.45 });
  const shrubMat = new THREE.MeshStandardMaterial({ color: 0x2d6a32, roughness: 0.84 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4a94e, roughness: 0.30, metalness: 0.82 });

  return {
    terracottaTile,
    colorfulTile,
    bikeRampTile,
    garageFloorTile,
    greenSteelGate,
    greenSteelAccent,
    tinRust,
    tinTeal,
    thaiFrame,
    thaiGlass,
    cobaltGlass,
    whiteBand,
    dampPlinth,
    stairConcrete,
    liftSteel,
    liftInterior,
    liftLed,
    gateSteel,
    oldShutterGreen,
    oldShutterBlue,
    waterTank,
    shrubMat,
    brassMat,
    makeWall(hex, seed, isOld) {
      return new THREE.MeshStandardMaterial({
        map: makeWeatheredPlasterTexture(hex, seed, isOld),
        roughness: isOld ? 0.88 : 0.66,
      });
    },
    m,
  };
}

/**
 * Creates one fully enterable, multi-story Khulna residential building in local coordinates
 * where +Z is ALWAYS the front facade facing the alley, then transforms via (cx, cz, rotY).
 * Supports both Old Heritage houses (no lift, wooden shutters, tin chajja, weathered plaster)
 * and New Modern Apartments (with or without working 3D elevator, Thai sliding windows,
 * marble lobby portal, cobalt glass strips, furnished flats on every floor, walkable stairs & rooftop).
 */
function createEnterableGoliBuilding(parent, shared, cfg) {
  const {
    id,
    nameBn,
    eyebrowTitle,
    zonePrefix,
    cx,
    cz,
    rotY = 0, // 0 = faces +Z (South), Math.PI = faces -Z (North), -Math.PI/2 = faces -X (West)
    width: W,
    depth: D,
    floors, // total habitable stories (1..5); rooftop is at index = floors
    style = 'new', // 'old' | 'new'
    hasLift = false,
    wallHex = '#e6decb',
    accentHex = '#4a3228',
    gfHex = null,
    seed = 101,
    hasPitchedTinRoof = false,
    isUserHome = false,
  } = cfg;

  const m = shared.m;
  const isOld = style === 'old';
  const wallMat = shared.makeWall(wallHex, seed, isOld);
  const accentMat = shared.makeWall(accentHex, seed + 17, isOld);
  const gfMat = gfHex ? shared.makeWall(gfHex, seed + 31, isOld) : (isOld ? wallMat : shared.terracottaTile);
  const shutterMat = (seed % 2 === 0) ? shared.oldShutterGreen : shared.oldShutterBlue;

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

  const hw = W * 0.5;
  const hd = D * 0.5;
  const gfH = isUserHome ? 3.70 : (hasLift ? 3.40 : (isOld ? 3.10 : 3.20));
  const flH = 3.10;
  const gfBaseY = isUserHome ? 0.34 : 0.08;

  // Floor elevations: 0 = GF, 1..(floors-1) = upper flats, floors = Rooftop
  const FLOOR_Y = [gfBaseY];
  for (let k = 1; k <= floors; k++) {
    FLOOR_Y.push(Number((gfBaseY + gfH + (k - 1) * flH).toFixed(2)));
  }

  const STOPS = [];
  for (let k = 0; k <= floors; k++) {
    if (k === 0) {
      STOPS.push({ idx: 0, code: 'GF', y: FLOOR_Y[0], label: isUserHome ? 'Ground Floor · Parking Garage' : 'Ground Floor · Lobby & Flat 1A' });
    } else if (k === floors) {
      STOPS.push({ idx: k, code: 'R', y: FLOOR_Y[k], label: 'Rooftop · Terrace' });
    } else {
      STOPS.push({ idx: k, code: `${k}F`, y: FLOOR_Y[k], label: `Floor ${k + 1} · Flat ${k + 1}A` });
    }
  }

  // Circulation Core & Flat Partition Geometry (Local Coordinates)
  // Right Side (+X) holds Staircase (+ Lift Shaft if hasLift), Left Side (-X) holds the Furnished Flat!
  const STAIR_MIN_X = hw - 1.65;
  const STAIR_MAX_X = hw - 0.24;
  const STAIR_START_Z = 2.15;  // Bottom of stair flight (near front lobby +Z)
  const STAIR_END_Z = -2.35;   // Top of stair flight (near back landing -Z)
  const SPLIT_X = hasLift ? (hw - 3.65) : (hw - 1.82); // Wall separating Flat (-X) from Circulation Hall (+X)

  // Elevator shaft (if hasLift): sits in lx ∈ [SPLIT_X + 0.14, STAIR_MIN_X - 0.14], lz ∈ [-2.35, -0.55]
  // Lift door opens on +Z face (lz = -0.55) directly into the front lift & stair lobby!
  const LIFT_MIN_X = SPLIT_X + 0.14;
  const LIFT_MAX_X = STAIR_MIN_X - 0.14;
  const LIFT_MIN_Z = -2.35;
  const LIFT_MAX_Z = -0.55;
  const LIFT_CX = (LIFT_MIN_X + LIFT_MAX_X) * 0.5;
  const LIFT_CZ = (LIFT_MIN_Z + LIFT_MAX_Z) * 0.5;
  const LIFT_DOOR_MIN_X = LIFT_CX - 0.52;
  const LIFT_DOOR_MAX_X = LIFT_CX + 0.52;

  // Front Entrance Door / Grand Green Steel Gate (on +Z facade)
  const ENT_CX = isUserHome ? 0.0 : (hasLift ? (SPLIT_X + hw) * 0.5 : (hw - 1.02));
  const ENT_MIN_X = isUserHome ? -1.55 : (ENT_CX - 0.72);
  const ENT_MAX_X = isUserHome ? 1.55 : (ENT_CX + 0.72);
  const ENT_DOOR_H = isUserHome ? 2.92 : 2.38;

  // Flat Main Door (on lx = SPLIT_X, opening from Lobby into Living Room)
  const FLAT_DOOR_MIN_Z = 2.25;
  const FLAT_DOOR_MAX_Z = 3.45;
  const FLAT_DOOR_CZ = (FLAT_DOOR_MIN_Z + FLAT_DOOR_MAX_Z) * 0.5;

  // Flat Interior Room Divisions (lx ∈ [-hw + 0.24, SPLIT_X - 0.08], lz ∈ [-hd + 0.24, hd - 0.24])
  const FLAT_MIN_X = -hw + 0.24;
  const FLAT_MAX_X = SPLIT_X - 0.08;
  const FLAT_MIN_Z = -hd + 0.24;
  const FLAT_MAX_Z = hd - 0.24;
  const FLAT_W = FLAT_MAX_X - FLAT_MIN_X;
  const ROOM_DIV_Z = 0.25; // Front Living Room (lz > 0.25) vs Back Bedroom + Dining/Kitchen + Bath (lz < 0.25)
  const BED_DIV_X = FLAT_MIN_X + FLAT_W * 0.52; // Left = Master Bedroom, Right = Dining/Kitchen + Attached Bath
  const BATH_DIV_Z = -1.95; // Back-right corner (lz < -1.95) = Attached Bathroom

  const root = new THREE.Group();
  root.name = `AltapoleGoli_${id}`;
  root.position.set(cx, 0, cz);
  root.rotation.y = rotY;
  parent.add(root);

  const exteriorStatic = new THREE.Group();
  root.add(exteriorStatic);

  const dynamicG = new THREE.Group();
  root.add(dynamicG);

  const state = {
    entDoorOpen: false,
    entDoorAngle: 0,
    liftY: FLOOR_Y[0],
    liftFloorIndex: 0,
    liftTargetIndex: 0,
    liftPhase: 'idle',
    liftDirection: 0,
    liftDoorOpen: 1.0,
  };

  const flatDoors = [];
  const thaiWindows = [];
  const animatedFans = [];
  const floorInteriorGroups = [];
  const floorSeats = new Map();

  // Helper: Slab with Stairwell & Lift Shaft Cutouts
  function addFloorSlab(y, isGround = false) {
    if (isGround) {
      if (isUserHome) {
        // Raised tiled Parking Garage plinth slab (y = 0 -> 0.34)
        box(exteriorStatic, [W, y, D], [0, y * 0.5, 0], shared.garageFloorTile, { uvScale: 2.2 });
        // Long Tiled Bike Ramp right in front of the Grand Green Steel Gate (lx ∈ [-1.55, 0.95], lz ∈ [hd, hd + 2.20])
        const rampW = 2.50;
        const rampCx = -0.30;
        const rampLen = 2.20;
        const rampSteps = 12;
        for (let rs = 0; rs < rampSteps; rs++) {
          const frac = (rs + 0.5) / rampSteps;
          const segH = THREE.MathUtils.lerp(y, 0.03, frac);
          const segZ = hd + frac * rampLen;
          box(exteriorStatic, [rampW, segH, rampLen / rampSteps + 0.03], [rampCx, segH * 0.5, segZ], shared.bikeRampTile, { uvScale: 1.0 });
        }
        // Colorful mosaic tiled side curbs bordering the bike ramp
        box(exteriorStatic, [0.14, 0.24, rampLen], [rampCx - rampW * 0.5 - 0.07, 0.12, hd + rampLen * 0.5], shared.colorfulTile, { uvScale: 0.9 });
        box(exteriorStatic, [0.14, 0.24, rampLen], [rampCx + rampW * 0.5 + 0.07, 0.12, hd + rampLen * 0.5], shared.colorfulTile, { uvScale: 0.9 });
        // Adjacent Pedestrian Tiled Steps (সিঁড়ি) right next to the bike ramp (lx ∈ [1.02, 2.38], 3 wide steps)
        const stepW = 1.36;
        const stepCx = 1.70;
        for (let st = 0; st < 3; st++) {
          const stH = ((3 - st) / 3) * y;
          const stZ = hd + (st + 0.5) * 0.45;
          box(exteriorStatic, [stepW, stH, 0.46], [stepCx, stH * 0.5, stZ], shared.colorfulTile, { uvScale: 0.8 });
          box(exteriorStatic, [stepW + 0.04, 0.035, 0.48], [stepCx, stH + 0.015, stZ], shared.whiteBand);
        }
        return;
      }
      box(exteriorStatic, [W, 0.16, D], [0, y - 0.08, 0], m.pillarTile || shared.stairConcrete, { uvScale: 1.8 });
      // Entry front step connecting alley sidewalk to lobby floor
      box(exteriorStatic, [2.1, 0.09, 0.55], [ENT_CX, 0.045, hd + 0.26], shared.dampPlinth);
      return;
    }
    const slabH = 0.20;
    const slabY = y - 0.10;
    // 1) Left Flat Slab (full depth: lx ∈ [-hw, SPLIT_X])
    box(exteriorStatic, [SPLIT_X - (-hw), slabH, D], [(-hw + SPLIT_X) * 0.5, slabY, 0], m.pillarTile || shared.stairConcrete, { uvScale: 1.8 });
    // 2) Right Front Lobby Slab (lz ∈ [STAIR_START_Z, hd], lx ∈ [SPLIT_X, hw])
    box(exteriorStatic, [hw - SPLIT_X, slabH, hd - STAIR_START_Z], [(SPLIT_X + hw) * 0.5, slabY, (STAIR_START_Z + hd) * 0.5], m.pillarTile || shared.stairConcrete, { uvScale: 1.8 });
    // 3) Right Back Landing Slab (lz ∈ [-hd, STAIR_END_Z], lx ∈ [SPLIT_X, hw])
    box(exteriorStatic, [hw - SPLIT_X, slabH, STAIR_END_Z - (-hd)], [(SPLIT_X + hw) * 0.5, slabY, (-hd + STAIR_END_Z) * 0.5], m.pillarTile || shared.stairConcrete, { uvScale: 1.8 });
    // 4) Middle strip between Flat and Stairwell (if hasLift, leaves LIFT_MIN_Z..LIFT_MAX_Z open for lift shaft, fills LIFT_MAX_Z..STAIR_START_Z!)
    if (hasLift) {
      box(exteriorStatic, [STAIR_MIN_X - SPLIT_X, slabH, STAIR_START_Z - LIFT_MAX_Z], [(SPLIT_X + STAIR_MIN_X) * 0.5, slabY, (LIFT_MAX_Z + STAIR_START_Z) * 0.5], m.pillarTile || shared.stairConcrete, { uvScale: 1.8 });
    } else if (STAIR_MIN_X > SPLIT_X + 0.05) {
      box(exteriorStatic, [STAIR_MIN_X - SPLIT_X, slabH, STAIR_START_Z - STAIR_END_Z], [(SPLIT_X + STAIR_MIN_X) * 0.5, slabY, (STAIR_END_Z + STAIR_START_Z) * 0.5], m.pillarTile || shared.stairConcrete, { uvScale: 1.8 });
    }
    // Exterior horizontal cornice trim band
    box(exteriorStatic, [W + 0.28, 0.22, D + 0.28], [0, y - 0.08, 0], isOld ? shared.dampPlinth : shared.whiteBand);
  }

  // Helper: Openable Thai Sliding Window on Front (+Z) Wall (New Buildings)
  function addOpenableThaiWindow({ floorIdx, lx, ly, lz, w, h, label }) {
    const halfW = w * 0.5;
    box(exteriorStatic, [w + 0.10, 0.06, 0.20], [lx, ly + h * 0.5, lz], shared.thaiFrame);
    box(exteriorStatic, [w + 0.10, 0.06, 0.20], [lx, ly - h * 0.5, lz], shared.thaiFrame);
    box(exteriorStatic, [0.06, h, 0.20], [lx - halfW, ly, lz], shared.thaiFrame);
    box(exteriorStatic, [0.06, h, 0.20], [lx + halfW, ly, lz], shared.thaiFrame);
    // Fixed left glass pane
    box(exteriorStatic, [halfW - 0.03, h - 0.08, 0.03], [lx - halfW * 0.5, ly, lz - 0.03], shared.thaiGlass, { castShadow: false });
    // Exterior white safety grille
    for (let gx = -halfW + 0.30; gx <= halfW - 0.25; gx += 0.38) {
      box(exteriorStatic, [0.028, h - 0.08, 0.028], [lx + gx, ly, lz + 0.10], shared.whiteBand);
    }
    box(exteriorStatic, [w - 0.06, 0.035, 0.028], [lx, ly, lz + 0.10], shared.whiteBand);
    // Sliding right sash
    const sash = new THREE.Group();
    const closedX = lx + halfW * 0.5;
    const openX = lx - halfW * 0.42;
    sash.position.set(closedX, ly, lz + 0.02);
    const sw = halfW - 0.02;
    const sh = h - 0.08;
    box(sash, [sw, sh, 0.03], [0, 0, 0], shared.thaiGlass, { castShadow: false });
    box(sash, [sw, 0.045, 0.045], [0, sh * 0.5, 0], shared.thaiFrame);
    box(sash, [sw, 0.045, 0.045], [0, -sh * 0.5, 0], shared.thaiFrame);
    box(sash, [0.045, sh, 0.045], [-sw * 0.5, 0, 0], shared.thaiFrame);
    box(sash, [0.045, sh, 0.045], [sw * 0.5, 0, 0], shared.thaiFrame);
    box(sash, [0.03, 0.20, 0.05], [sw * 0.34, -0.04, -0.04], m.darkMetal);
    dynamicG.add(sash);
    thaiWindows.push({ floorIdx, mesh: sash, closedX, openX, open: false, progress: 0, lx, ly, lz, label });
  }

  // Helper: Classic Old Wooden Shuttered Window on Front (+Z) Wall (Old Houses)
  function addOldShutteredWindow(lx, ly, lz, w, h) {
    box(exteriorStatic, [w, h, 0.10], [lx, ly, lz - 0.02], m.glass);
    // Wooden shutter frames on left & right + horizontal louvers
    box(exteriorStatic, [0.22, h, 0.12], [lx - w * 0.5 - 0.06, ly, lz + 0.03], shutterMat);
    box(exteriorStatic, [0.22, h, 0.12], [lx + w * 0.5 + 0.06, ly, lz + 0.03], shutterMat);
    // Rusty iron grille bars
    for (let gx = -w * 0.36; gx <= w * 0.38; gx += 0.28) {
      box(exteriorStatic, [0.025, h - 0.06, 0.025], [lx + gx, ly, lz + 0.06], m.darkMetal);
    }
    // Weathered concrete chajja sunshade & sill
    box(exteriorStatic, [w + 0.36, 0.12, 0.34], [lx, ly + h * 0.5 + 0.08, lz + 0.14], shared.dampPlinth);
    box(exteriorStatic, [w + 0.24, 0.08, 0.22], [lx, ly - h * 0.5 - 0.04, lz + 0.08], shared.dampPlinth);
  }

  // ==========================================================================
  // 1) GROUND FLOOR SHELL, LOBBY ENTRANCE DOOR, SIGNBOARD & ARCHITECTURE
  // ==========================================================================
  addFloorSlab(FLOOR_Y[0], true);
  // Plinth band around outer base (skip colorful front on user home so ramp & mosaic tiles shine)
  if (!isUserHome) {
    box(exteriorStatic, [W + 0.12, 0.38, D + 0.12], [0, 0.19, 0], shared.dampPlinth);
  }

  const gfWallTop = FLOOR_Y[0] + gfH;
  // Solid Left (-X), Right (+X), Back (-Z) Ground Floor Exterior Walls
  box(exteriorStatic, [0.24, gfWallTop, D], [-hw + 0.12, gfWallTop * 0.5, 0], gfMat);
  box(exteriorStatic, [0.24, gfWallTop, D], [hw - 0.12, gfWallTop * 0.5, 0], gfMat);
  box(exteriorStatic, [W, gfWallTop, 0.24], [0, gfWallTop * 0.5, -hd + 0.12], gfMat);

  // Front (+Z) Ground Floor Wall with Entrance Doorway (ENT_MIN_X..ENT_MAX_X)
  const doorTopY = FLOOR_Y[0] + ENT_DOOR_H;
  box(exteriorStatic, [ENT_MIN_X - (-hw), gfWallTop, 0.26], [(-hw + ENT_MIN_X) * 0.5, gfWallTop * 0.5, hd - 0.13], gfMat);
  box(exteriorStatic, [hw - ENT_MAX_X, gfWallTop, 0.26], [(ENT_MAX_X + hw) * 0.5, gfWallTop * 0.5, hd - 0.13], gfMat);
  box(exteriorStatic, [ENT_MAX_X - ENT_MIN_X + 0.04, Math.max(0.24, gfWallTop - doorTopY), 0.26], [ENT_CX, doorTopY + Math.max(0.24, gfWallTop - doorTopY) * 0.5, hd - 0.13], gfMat);

  // Front Entrance Portal Styling (User's Dream Home Grand Colorful-Tile Portal vs Modern vs Old)
  if (isUserHome) {
    // Colorful decorative exterior mosaic tiles cladding both front wings of ground floor!
    const lw = ENT_MIN_X - (-hw) - 0.24;
    const rw = hw - ENT_MAX_X - 0.24;
    box(exteriorStatic, [lw, 2.65, 0.06], [-hw + 0.12 + lw * 0.5, 1.325, hd + 0.02], shared.colorfulTile, { uvScale: 1.5 });
    box(exteriorStatic, [rw, 2.65, 0.06], [ENT_MAX_X + 0.24 + rw * 0.5, 1.325, hd + 0.02], shared.colorfulTile, { uvScale: 1.5 });
    // Two Grand Colorful-Tiled Gate Pillars flanking the big green steel gate
    for (const px of [ENT_MIN_X - 0.22, ENT_MAX_X + 0.22]) {
      box(exteriorStatic, [0.46, doorTopY + 0.22, 0.48], [px, (doorTopY + 0.22) * 0.5, hd + 0.10], shared.colorfulTile, { uvScale: 1.2 });
      box(exteriorStatic, [0.56, 0.14, 0.56], [px, doorTopY + 0.28, hd + 0.10], shared.whiteBand);
      // Glowing warm gate-post globe lamp on top of each pillar
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), shared.liftLed);
      lamp.position.set(px, doorTopY + 0.48, hd + 0.10);
      dynamicG.add(lamp);
    }
    // Grand Pearl-White Overhead Gate Arch / Canopy Beam with warm LED downlights
    box(exteriorStatic, [ENT_MAX_X - ENT_MIN_X + 1.02, 0.24, 0.62], [ENT_CX, doorTopY + 0.12, hd + 0.14], shared.whiteBand);
    box(dynamicG, [1.80, 0.05, 0.18], [ENT_CX, doorTopY - 0.02, hd + 0.22], shared.liftLed, { castShadow: false });
    // Colorful tiled planter boxes with lush shrubs on outer corners of front facade
    for (const plX of [-hw + 1.35, hw - 1.35]) {
      box(exteriorStatic, [2.1, 0.56, 0.48], [plX, 0.28, hd + 0.28], shared.colorfulTile, { uvScale: 1.0 });
      box(exteriorStatic, [2.18, 0.07, 0.54], [plX, 0.58, hd + 0.28], shared.whiteBand);
      for (const off of [-0.62, 0, 0.62]) {
        const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 1), shared.shrubMat);
        bush.position.set(plX + off, 0.80, hd + 0.28);
        exteriorStatic.add(bush);
      }
    }
  } else if (!isOld) {
    box(exteriorStatic, [0.16, 2.48, 0.22], [ENT_MIN_X - 0.06, 1.24, hd + 0.04], shared.whiteBand);
    box(exteriorStatic, [0.16, 2.48, 0.22], [ENT_MAX_X + 0.06, 1.24, hd + 0.04], shared.whiteBand);
    box(exteriorStatic, [ENT_MAX_X - ENT_MIN_X + 0.28, 0.18, 0.26], [ENT_CX, 2.48, hd + 0.05], shared.whiteBand);
    box(dynamicG, [0.85, 0.05, 0.18], [ENT_CX, 2.36, hd + 0.10], shared.liftLed, { castShadow: false });
    // Low planter box & green shrubs on left side of front facade
    const plW = Math.min(2.6, ENT_MIN_X - (-hw) - 0.6);
    if (plW > 0.9) {
      const plX = -hw + 0.3 + plW * 0.5;
      box(exteriorStatic, [plW, 0.58, 0.46], [plX, 0.29, hd + 0.24], shared.terracottaTile);
      box(exteriorStatic, [plW + 0.06, 0.07, 0.50], [plX, 0.60, hd + 0.24], shared.whiteBand);
      for (let bx = plX - plW * 0.32; bx <= plX + plW * 0.34; bx += 0.65) {
        const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 1), shared.shrubMat);
        bush.position.set(bx, 0.78, hd + 0.24);
        exteriorStatic.add(bush);
      }
    }
  } else {
    // Old house sloping corrugated tin awning over front door
    const tinAwning = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.07, 0.85), shared.tinRust);
    tinAwning.position.set(ENT_CX, 2.58, hd + 0.36);
    tinAwning.rotation.x = 0.28;
    exteriorStatic.add(tinAwning);
    // Decorative old front window on ground floor living room wall
    const gfWinX = (-hw + ENT_MIN_X) * 0.5;
    if (ENT_MIN_X - (-hw) > 2.2) {
      addOldShutteredWindow(gfWinX, 1.55, hd - 0.02, 1.35, 1.25);
    }
  }

  // Bangla House Nameplate Signboard above Front Entrance
  const signTex = makeSignTexture({
    title: nameBn,
    subtitle: isUserHome
      ? 'সবুজ স্টিলের গেট · বাইক র‍্যাম্প ও পার্কিং গ্যারেজ [E]'
      : (hasLift ? 'LIFT & STAIRS · প্রবেশযোগ্য [E]' : (isOld ? 'পুরাতন বাড়ি · প্রবেশযোগ্য [E]' : 'নতুন বাড়ি · প্রবেশযোগ্য [E]')),
    bg: isUserHome ? '#0f3d2e' : (isOld ? '#d6d0c4' : '#14242b'),
    fg: isOld ? '#1e293b' : '#f8fafc',
    accent: isOld ? '#7c2d12' : '#fde047',
    border: isUserHome ? '#22c55e' : (isOld ? '#57534e' : '#38bdf8'),
  });
  const signMat = new THREE.MeshStandardMaterial({
    map: signTex,
    emissive: isOld ? 0x000000 : 0xffffff,
    emissiveMap: isOld ? null : signTex,
    emissiveIntensity: isUserHome ? 0.34 : (isOld ? 0.0 : 0.26),
    roughness: 0.32,
  });
  const signMesh = new THREE.Mesh(new THREE.BoxGeometry(isUserHome ? 3.25 : 2.55, isUserHome ? 0.68 : 0.62, 0.08), signMat);
  signMesh.position.set(ENT_CX, isUserHome ? (doorTopY + 0.58) : 2.94, hd + 0.12);
  dynamicG.add(signMesh);

  // Openable Front Entrance Door (or Grand Double-Leaf Tall Green Steel Gate for User's Home!)
  const entDoorPivot = new THREE.Group();
  let entDoorPivotRight = null;
  if (isUserHome) {
    const leafW = (ENT_MAX_X - ENT_MIN_X) * 0.5 - 0.03;
    const gateH = ENT_DOOR_H - 0.06;
    const buildGreenGateLeaf = (isRight) => {
      const leaf = new THREE.Group();
      const dir = isRight ? -1 : 1;
      const cxLeaf = dir * leafW * 0.5;
      // Heavy emerald-green steel outer frame
      box(leaf, [leafW, 0.09, 0.09], [cxLeaf, 0.045, 0], shared.greenSteelGate);
      box(leaf, [leafW, 0.10, 0.09], [cxLeaf, gateH - 0.05, 0], shared.greenSteelGate);
      box(leaf, [0.09, gateH, 0.09], [dir * 0.045, gateH * 0.5, 0], shared.greenSteelGate);
      box(leaf, [0.09, gateH, 0.09], [dir * (leafW - 0.045), gateH * 0.5, 0], shared.greenSteelGate);
      // Solid green steel lower privacy kick-panel (bottom 1.18m)
      box(leaf, [leafW - 0.12, 1.12, 0.055], [cxLeaf, 0.62, 0], shared.greenSteelAccent);
      box(leaf, [leafW - 0.08, 0.07, 0.095], [cxLeaf, 1.20, 0], shared.greenSteelGate);
      // Upper vertical green steel bars + golden decorative spear finials
      const barCount = 7;
      for (let b = 1; b < barCount; b++) {
        const bx = dir * (b / barCount) * leafW;
        box(leaf, [0.035, gateH - 1.28, 0.035], [bx, 1.20 + (gateH - 1.28) * 0.5, 0], shared.greenSteelGate);
        box(leaf, [0.055, 0.09, 0.055], [bx, gateH - 0.15, 0], shared.brassMat);
      }
      // Decorative horizontal mid-rail & gold center medallion
      box(leaf, [leafW - 0.10, 0.06, 0.07], [cxLeaf, 2.02, 0], shared.greenSteelGate);
      box(leaf, [0.22, 0.22, 0.08], [cxLeaf, 2.02, 0], shared.brassMat, { rotZ: Math.PI / 4 });
      // Brass double-gate handle near meeting edge
      box(leaf, [0.05, 0.30, 0.16], [dir * (leafW - 0.16), 1.30, 0], shared.brassMat);
      mergeStaticMeshes(leaf);
      return leaf;
    };
    entDoorPivot.position.set(ENT_MIN_X + 0.02, FLOOR_Y[0], hd - 0.06);
    entDoorPivot.add(buildGreenGateLeaf(false));
    dynamicG.add(entDoorPivot);

    entDoorPivotRight = new THREE.Group();
    entDoorPivotRight.position.set(ENT_MAX_X - 0.02, FLOOR_Y[0], hd - 0.06);
    entDoorPivotRight.add(buildGreenGateLeaf(true));
    dynamicG.add(entDoorPivotRight);
  } else {
    entDoorPivot.position.set(ENT_MIN_X + 0.02, FLOOR_Y[0], hd - 0.10);
    const dg = new THREE.Group();
    const dw = ENT_MAX_X - ENT_MIN_X - 0.04;
    box(dg, [dw, 2.32, 0.08], [dw * 0.5, 1.16, 0], isOld ? m.wood : shared.gateSteel);
    if (!isOld) {
      box(dg, [dw * 0.66, 1.42, 0.10], [dw * 0.5, 1.38, 0], shared.thaiGlass, { castShadow: false });
    } else {
      box(dg, [dw * 0.72, 0.75, 0.10], [dw * 0.5, 1.62, 0], shutterMat);
    }
    box(dg, [0.05, 0.24, 0.14], [dw - 0.14, 1.08, 0], shared.brassMat);
    entDoorPivot.add(dg);
    dynamicG.add(entDoorPivot);
  }

  // ==========================================================================
  // 2) OPTIONAL WORKING 3D PASSENGER ELEVATOR SHAFT + CABIN + LIVE PANEL
  // ==========================================================================
  let liftCabin = null;
  let liftDoorLeft = null;
  let liftDoorRight = null;
  let liftDoorW = 0.52;
  let redrawLiftPanel = () => {};

  if (hasLift) {
    const shaftH = FLOOR_Y[floors] + 2.95;
    const sW = LIFT_MAX_X - LIFT_MIN_X;
    const sD = LIFT_MAX_Z - LIFT_MIN_Z;

    // West, East, Back (-Z) solid shaft walls
    box(exteriorStatic, [0.14, shaftH, sD + 0.14], [LIFT_MIN_X - 0.04, shaftH * 0.5, LIFT_CZ], m.darkConcrete || shared.stairConcrete);
    box(exteriorStatic, [0.14, shaftH, sD + 0.14], [LIFT_MAX_X + 0.04, shaftH * 0.5, LIFT_CZ], m.darkConcrete || shared.stairConcrete);
    box(exteriorStatic, [sW + 0.14, shaftH, 0.14], [LIFT_CX, shaftH * 0.5, LIFT_MIN_Z - 0.04], m.darkConcrete || shared.stairConcrete);
    // Front (+Z) shaft jambs flanking doorway (LIFT_DOOR_MIN_X..LIFT_DOOR_MAX_X)
    box(exteriorStatic, [LIFT_DOOR_MIN_X - LIFT_MIN_X, shaftH, 0.14], [(LIFT_MIN_X + LIFT_DOOR_MIN_X) * 0.5, shaftH * 0.5, LIFT_MAX_Z], shared.liftSteel);
    box(exteriorStatic, [LIFT_MAX_X - LIFT_DOOR_MAX_X, shaftH, 0.14], [(LIFT_DOOR_MAX_X + LIFT_MAX_X) * 0.5, shaftH * 0.5, LIFT_MAX_Z], shared.liftSteel);

    // Live Illuminated 3D Floor Indicator & Keypad Texture
    const lpCanvas = document.createElement('canvas');
    lpCanvas.width = 256;
    lpCanvas.height = 512;
    const lpTex = new THREE.CanvasTexture(lpCanvas);
    lpTex.colorSpace = THREE.SRGBColorSpace;
    const lpMat = new THREE.MeshBasicMaterial({ map: lpTex });

    redrawLiftPanel = () => {
      const ctx = lpCanvas.getContext('2d');
      const curStop = STOPS[state.liftFloorIndex] || STOPS[0];
      const isMoving = state.liftPhase === 'moving' || state.liftPhase === 'closing';
      const arrow = isMoving ? (state.liftDirection >= 0 ? '▲' : '▼') : (state.liftDoorOpen > 0.6 ? '●' : '■');
      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, 256, 512);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, 240, 496);
      ctx.fillStyle = '#03050a';
      ctx.fillRect(20, 22, 216, 92);
      ctx.fillStyle = arrow === '●' ? '#22c55e' : '#f59e0b';
      ctx.font = '900 44px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(arrow, 68, 82);
      ctx.fillStyle = '#ef4444';
      ctx.font = '900 54px monospace';
      ctx.fillText(curStop.code, 158, 84);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(eyebrowTitle.slice(0, 22), 128, 138);
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(isMoving ? `GOING TO ${STOPS[state.liftTargetIndex]?.code || ''}` : 'PRESS [E / L] · 0-4 / R', 128, 162);

      for (let i = 0; i < STOPS.length; i++) {
        const stop = STOPS[STOPS.length - 1 - i];
        const col = i % 2;
        const row = Math.floor(i / 2);
        const bx = col === 0 ? 78 : 178;
        const by = 216 + row * 68;
        const isCur = stop.idx === state.liftFloorIndex && !isMoving;
        const isTgt = stop.idx === state.liftTargetIndex && isMoving;
        ctx.beginPath();
        ctx.arc(bx, by, 24, 0, Math.PI * 2);
        ctx.fillStyle = isTgt ? '#d97706' : (isCur ? '#15803d' : '#1e293b');
        ctx.fill();
        ctx.lineWidth = (isCur || isTgt) ? 4 : 2;
        ctx.strokeStyle = isTgt ? '#fde047' : (isCur ? '#4ade80' : '#94a3b8');
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(stop.code, bx, by + 7);
      }
      lpTex.needsUpdate = true;
    };
    redrawLiftPanel();

    // Doorway headers & landing call panels on every floor
    for (let k = 0; k <= floors; k++) {
      const fy = FLOOR_Y[k];
      const nextY = k < floors ? FLOOR_Y[k + 1] : fy + 2.95;
      const headerH = Math.max(0.32, nextY - (fy + 2.24));
      box(exteriorStatic, [LIFT_DOOR_MAX_X - LIFT_DOOR_MIN_X, headerH, 0.16], [LIFT_CX, fy + 2.24 + headerH * 0.5, LIFT_MAX_Z], shared.liftSteel);
      // 3D landing call panel beside doorway
      box(exteriorStatic, [0.32, 0.72, 0.06], [LIFT_DOOR_MAX_X + 0.18, fy + 1.36, LIFT_MAX_Z + 0.08], m.darkMetal);
      const lPanel = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.64), lpMat);
      lPanel.position.set(LIFT_DOOR_MAX_X + 0.18, fy + 1.36, LIFT_MAX_Z + 0.115);
      dynamicG.add(lPanel);
    }

    // Moving 3D Cabin
    liftCabin = new THREE.Group();
    liftCabin.position.set(LIFT_CX, FLOOR_Y[0], LIFT_CZ);
    dynamicG.add(liftCabin);
    const cabW = sW - 0.22;
    const cabD = sD - 0.22;
    const cabH = 2.34;
    {
      const cg = new THREE.Group();
      box(cg, [cabW, 0.10, cabD], [0, 0.02, 0], m.blackTile || shared.liftInterior);
      box(cg, [cabW, 0.10, cabD], [0, cabH, 0], shared.liftInterior);
      box(cg, [cabW * 0.70, 0.04, cabD * 0.70], [0, cabH - 0.06, 0], shared.liftLed, { castShadow: false });
      box(cg, [cabW, cabH, 0.08], [0, cabH * 0.5, -cabD * 0.5 + 0.04], shared.liftInterior);
      box(cg, [cabW * 0.72, 1.32, 0.04], [0, 1.32, -cabD * 0.5 + 0.10], m.mirrorMat || shared.thaiGlass);
      box(cg, [0.08, cabH, cabD], [-cabW * 0.5 + 0.04, cabH * 0.5, 0], shared.liftInterior);
      box(cg, [0.08, cabH, cabD], [cabW * 0.5 - 0.04, cabH * 0.5, 0], shared.liftInterior);
      box(cg, [cabW * 0.76, 0.05, 0.05], [0, 0.94, -cabD * 0.5 + 0.16], shared.brassMat);
      mergeStaticMeshes(cg);
      liftCabin.add(cg);
    }
    const cabPanel = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.76), lpMat);
    cabPanel.position.set(cabW * 0.5 - 0.10, 1.34, 0.18);
    cabPanel.rotation.y = -Math.PI / 2;
    liftCabin.add(cabPanel);

    liftDoorW = (LIFT_DOOR_MAX_X - LIFT_DOOR_MIN_X) * 0.5;
    liftDoorLeft = new THREE.Mesh(new THREE.BoxGeometry(liftDoorW, 2.20, 0.06), shared.liftSteel);
    liftDoorRight = new THREE.Mesh(new THREE.BoxGeometry(liftDoorW, 2.20, 0.06), shared.liftSteel);
    liftDoorLeft.position.set(-liftDoorW * 0.5, 1.12, cabD * 0.5 - 0.02);
    liftDoorRight.position.set(liftDoorW * 0.5, 1.12, cabD * 0.5 - 0.02);
    liftCabin.add(liftDoorLeft, liftDoorRight);
  }

  // ==========================================================================
  // 3) CONTINUOUS WALKABLE MULTI-STORY STAIRCASE (GF -> ALL FLOORS -> ROOF)
  // ==========================================================================
  if (floors >= 2 || !hasPitchedTinRoof) {
    const stairX = (STAIR_MIN_X + STAIR_MAX_X) * 0.5;
    const stairW = STAIR_MAX_X - STAIR_MIN_X - 0.06;
    for (let k = 0; k < floors; k++) {
      const y0 = FLOOR_Y[k];
      const y1 = FLOOR_Y[k + 1];
      const steps = 15;
      const stepSpan = (STAIR_START_Z - STAIR_END_Z) / steps;
      const stepRise = (y1 - y0) / steps;
      for (let s = 0; s < steps; s++) {
        const sz = STAIR_START_Z - (s + 0.5) * stepSpan;
        const sy = y0 + (s + 0.5) * stepRise;
        box(exteriorStatic, [stairW, stepRise + 0.16, stepSpan + 0.04], [stairX, sy - 0.04, sz], shared.stairConcrete);
      }
      // Handrail on inner (-X) side of staircase
      const railMat = isOld ? m.darkMetal : shared.thaiFrame;
      rodBetween(exteriorStatic, [STAIR_MIN_X + 0.06, y0 + 0.92, STAIR_START_Z], [STAIR_MIN_X + 0.06, y1 + 0.92, STAIR_END_Z], 0.024, railMat, 6);
      for (let p = 0; p <= 4; p++) {
        const f = p / 4;
        const pz = THREE.MathUtils.lerp(STAIR_START_Z, STAIR_END_Z, f);
        const py = THREE.MathUtils.lerp(y0, y1, f);
        cylinder(exteriorStatic, 0.016, 0.016, 0.92, [STAIR_MIN_X + 0.06, py + 0.46, pz], railMat, 6);
      }
    }
  }

  // ==========================================================================
  // 4) ALL HABITABLE FLOORS (k = 0 .. floors-1): WALLS, BALCONIES & INTERIORS
  // ==========================================================================
  // Vertical decorative cobalt curtain strip on front facade for modern lift buildings
  if (!isOld && hasLift) {
    const upH = FLOOR_Y[floors] - FLOOR_Y[1];
    box(exteriorStatic, [1.25, upH + 0.14, 0.12], [ENT_CX, FLOOR_Y[1] + upH * 0.5, hd + 0.04], shared.cobaltGlass);
    box(exteriorStatic, [0.06, upH + 0.18, 0.16], [ENT_CX - 0.62, FLOOR_Y[1] + upH * 0.5, hd + 0.05], shared.thaiFrame);
    box(exteriorStatic, [0.06, upH + 0.18, 0.16], [ENT_CX + 0.62, FLOOR_Y[1] + upH * 0.5, hd + 0.05], shared.thaiFrame);
  }

  for (let k = 0; k < floors; k++) {
    const fy = FLOOR_Y[k];
    const h = k === 0 ? gfH : flH;
    if (k >= 1) {
      addFloorSlab(fy, false);

      // Exterior Walls for Upper Floors (Solid Left, Right, Back; Front with Real Window Openings!)
      box(exteriorStatic, [0.24, h, D], [-hw + 0.12, fy + h * 0.5, 0], wallMat);
      box(exteriorStatic, [0.24, h, D], [hw - 0.12, fy + h * 0.5, 0], wallMat);
      box(exteriorStatic, [W, h, 0.24], [0, fy + h * 0.5, -hd + 0.12], wallMat);

      // Front (+Z) Upper Wall with Living Room Window Opening
      const winCx = (FLAT_MIN_X + FLAT_MAX_X) * 0.5;
      const winW = Math.min(2.3, FLAT_W - 1.4);
      const winMinX = winCx - winW * 0.5;
      const winMaxX = winCx + winW * 0.5;
      box(exteriorStatic, [W, 0.85, 0.24], [0, fy + 0.425, hd - 0.12], wallMat);
      box(exteriorStatic, [W, h - 2.35, 0.24], [0, fy + 2.35 + (h - 2.35) * 0.5, hd - 0.12], wallMat);
      box(exteriorStatic, [winMinX - (-hw), 1.50, 0.24], [(-hw + winMinX) * 0.5, fy + 1.60, hd - 0.12], wallMat);
      box(exteriorStatic, [hw - winMaxX, 1.50, 0.24], [(winMaxX + hw) * 0.5, fy + 1.60, hd - 0.12], wallMat);

      if (isUserHome) {
        addOpenableThaiWindow({
          floorIdx: k,
          lx: winCx,
          ly: fy + 1.60,
          lz: hd - 0.12,
          w: winW,
          h: 1.50,
          label: `${nameBn} Thai Window (F${k + 1})`,
        });
        // Colorful Decorative Mosaic Tile vertical feature bands on left, center & right facade piers!
        box(exteriorStatic, [0.85, h, 0.08], [-hw + 0.48, fy + h * 0.5, hd + 0.02], shared.colorfulTile, { uvScale: 1.3 });
        box(exteriorStatic, [0.85, h, 0.08], [hw - 0.48, fy + h * 0.5, hd + 0.02], shared.colorfulTile, { uvScale: 1.3 });
        box(exteriorStatic, [1.25, h, 0.08], [SPLIT_X + 0.68, fy + h * 0.5, hd + 0.02], shared.colorfulTile, { uvScale: 1.3 });
        // Wide Luxury Front Balcony with Colorful Mosaic Tile Apron + Tinted Glass + Steel Railings
        const balW = Math.min(4.8, FLAT_W - 0.35);
        box(exteriorStatic, [balW, 0.16, 0.96], [winCx, fy + 0.04, hd + 0.46], shared.whiteBand);
        box(exteriorStatic, [balW, 0.46, 0.10], [winCx, fy + 0.32, hd + 0.90], shared.colorfulTile, { uvScale: 1.4 });
        box(exteriorStatic, [balW, 0.48, 0.06], [winCx, fy + 0.78, hd + 0.90], shared.thaiGlass, { castShadow: false });
        box(exteriorStatic, [balW + 0.08, 0.06, 0.10], [winCx, fy + 1.04, hd + 0.90], shared.thaiFrame);
        box(exteriorStatic, [0.10, 0.98, 0.96], [winCx - balW * 0.5, fy + 0.54, hd + 0.46], shared.colorfulTile, { uvScale: 0.9 });
        box(exteriorStatic, [0.10, 0.98, 0.96], [winCx + balW * 0.5, fy + 0.54, hd + 0.46], shared.colorfulTile, { uvScale: 0.9 });
        // Warm exterior architectural sconce lights on the colorful feature piers
        box(dynamicG, [0.18, 0.32, 0.10], [-hw + 0.48, fy + 1.95, hd + 0.08], shared.liftLed, { castShadow: false });
        box(dynamicG, [0.18, 0.32, 0.10], [hw - 0.48, fy + 1.95, hd + 0.08], shared.liftLed, { castShadow: false });
      } else if (!isOld) {
        addOpenableThaiWindow({
          floorIdx: k,
          lx: winCx,
          ly: fy + 1.60,
          lz: hd - 0.12,
          w: winW,
          h: 1.50,
          label: `${nameBn} Thai Window (F${k + 1})`,
        });
        // Accent vertical architectural fin on left corner
        box(exteriorStatic, [0.16, h, 0.55], [-hw - 0.04, fy + h * 0.5, hd - 0.42], accentMat);
        // Projecting Modern Balcony with glass/metal railing
        const balW = Math.min(3.2, FLAT_W - 0.6);
        box(exteriorStatic, [balW, 0.14, 0.82], [winCx, fy + 0.04, hd + 0.40], shared.whiteBand);
        box(exteriorStatic, [balW, 0.88, 0.08], [winCx, fy + 0.50, hd + 0.78], shared.thaiGlass, { castShadow: false });
        box(exteriorStatic, [balW + 0.06, 0.06, 0.08], [winCx, fy + 0.96, hd + 0.78], shared.thaiFrame);
        box(exteriorStatic, [0.08, 0.90, 0.82], [winCx - balW * 0.5, fy + 0.50, hd + 0.40], accentMat);
        box(exteriorStatic, [0.08, 0.90, 0.82], [winCx + balW * 0.5, fy + 0.50, hd + 0.40], accentMat);
        // AC outdoor compressor unit
        if (k <= 3) {
          box(exteriorStatic, [0.68, 0.48, 0.30], [winMaxX + 0.42, fy + 0.52, hd + 0.18], m.aluminum);
        }
      } else {
        // Old House Shuttered Front Window + Classic Iron-Grill Veranda Balcony
        addOldShutteredWindow(winCx, fy + 1.60, hd - 0.02, winW * 0.78, 1.42);
        const balW = Math.min(3.0, FLAT_W - 0.6);
        box(exteriorStatic, [balW, 0.15, 0.76], [winCx, fy + 0.04, hd + 0.36], shared.dampPlinth);
        box(exteriorStatic, [balW, 0.38, 0.12], [winCx, fy + 0.28, hd + 0.70], accentMat);
        for (let rx = -balW * 0.44; rx <= balW * 0.45; rx += 0.26) {
          box(exteriorStatic, [0.03, 0.56, 0.03], [winCx + rx, fy + 0.72, hd + 0.70], m.darkMetal);
        }
        box(exteriorStatic, [balW + 0.04, 0.05, 0.06], [winCx, fy + 1.00, hd + 0.70], m.darkMetal);
      }
    }

    // User's Home Ground Floor = Spacious Open Tiled Parking Garage + Staircase up (ready for future interior work!)
    if (isUserHome && k === 0) {
      const garG = new THREE.Group();
      garG.name = `${id}_ParkingGarage_GF`;
      const ceilY = fy + h - 0.16;
      // Clean white parking bay markings & bright LED ceiling tubes
      box(garG, [0.08, 0.015, 4.4], [-2.2, fy + 0.01, -0.4], shared.whiteBand);
      box(garG, [0.08, 0.015, 4.4], [0.2, fy + 0.01, -0.4], shared.whiteBand);
      box(garG, [0.08, 0.015, 4.4], [2.4, fy + 0.01, -0.4], shared.whiteBand);
      for (const lxLed of [-2.4, 0.0, 2.2]) {
        box(garG, [1.25, 0.05, 0.14], [lxLed, ceilY, 0.4], shared.liftLed, { castShadow: false });
        box(garG, [1.25, 0.05, 0.14], [lxLed, ceilY, -2.0], shared.liftLed, { castShadow: false });
      }
      // Colorful mosaic tile dado along back interior garage wall
      box(garG, [W - 0.55, 1.25, 0.05], [0, fy + 0.625, -hd + 0.28], shared.colorfulTile, { uvScale: 1.6 });
      mergeStaticMeshes(garG);
      root.add(garG);
      floorInteriorGroups[k] = garG;
      continue;
    }

    // --- INTERIOR PARTITION WALLS (Flat vs Lobby + Bedroom + Bathroom) ---
    // Lobby-to-Flat Wall at lx = SPLIT_X (Flat Main Doorway at FLAT_DOOR_MIN_Z..FLAT_DOOR_MAX_Z)
    box(exteriorStatic, [0.16, h, FLAT_DOOR_MIN_Z - (-hd)], [SPLIT_X, fy + h * 0.5, (-hd + FLAT_DOOR_MIN_Z) * 0.5], m.roomWall);
    box(exteriorStatic, [0.16, h, hd - FLAT_DOOR_MAX_Z], [SPLIT_X, fy + h * 0.5, (FLAT_DOOR_MAX_Z + hd) * 0.5], m.roomWall);
    box(exteriorStatic, [0.16, h - 2.24, FLAT_DOOR_MAX_Z - FLAT_DOOR_MIN_Z], [SPLIT_X, fy + 2.24 + (h - 2.24) * 0.5, FLAT_DOOR_CZ], m.roomWall);

    // Openable Wooden Flat Main Door
    const fdPivot = new THREE.Group();
    fdPivot.position.set(SPLIT_X, fy + 0.02, FLAT_DOOR_MIN_Z + 0.02);
    {
      const dg = new THREE.Group();
      const dw = FLAT_DOOR_MAX_Z - FLAT_DOOR_MIN_Z - 0.04;
      box(dg, [0.07, 2.20, dw], [0, 1.10, dw * 0.5], m.wood);
      box(dg, [0.12, 0.20, 0.05], [0, 1.02, dw - 0.14], shared.brassMat);
      mergeStaticMeshes(dg);
      fdPivot.add(dg);
      dynamicG.add(fdPivot);
    }
    flatDoors.push({
      floorIdx: k,
      pivot: fdPivot,
      lx: SPLIT_X,
      ly: fy,
      lz: FLAT_DOOR_CZ,
      open: false,
      angle: 0,
      openAngle: Math.PI * 0.54,
      label: `${nameBn} Flat ${k + 1}A Door`,
      collider: { minX: SPLIT_X - 0.14, maxX: SPLIT_X + 0.14, minZ: FLAT_DOOR_MIN_Z, maxZ: FLAT_DOOR_MAX_Z },
    });

    // Bedroom / Dining divider along lx = BED_DIV_X (from -hd to ROOM_DIV_Z)
    box(exteriorStatic, [0.14, h, ROOM_DIV_Z - (-hd)], [BED_DIV_X, fy + h * 0.5, (-hd + ROOM_DIV_Z) * 0.5], m.roomWall);
    // Front Living / Back Bedroom divider along lz = ROOM_DIV_Z (leaving 1.15m doorway into Bedroom & open Dining entry!)
    const bedDoorMinX = BED_DIV_X - 1.25;
    if (bedDoorMinX > FLAT_MIN_X + 0.25) {
      box(exteriorStatic, [bedDoorMinX - FLAT_MIN_X, h, 0.14], [(FLAT_MIN_X + bedDoorMinX) * 0.5, fy + h * 0.5, ROOM_DIV_Z], m.roomWall);
    }
    box(exteriorStatic, [1.25, h - 2.20, 0.14], [BED_DIV_X - 0.625, fy + 2.20 + (h - 2.20) * 0.5, ROOM_DIV_Z], m.roomWall);

    // Attached Bathroom Front Wall at lz = BATH_DIV_Z (lx = BED_DIV_X..FLAT_MAX_X, doorway 0.95m on left side!)
    const bathDoorMaxX = BED_DIV_X + 1.05;
    if (FLAT_MAX_X > bathDoorMaxX + 0.18) {
      box(exteriorStatic, [FLAT_MAX_X - bathDoorMaxX, h, 0.14], [(bathDoorMaxX + FLAT_MAX_X) * 0.5, fy + h * 0.5, BATH_DIV_Z], m.roomWall);
    }
    box(exteriorStatic, [1.05, h - 2.18, 0.14], [BED_DIV_X + 0.525, fy + 2.18 + (h - 2.18) * 0.5, BATH_DIV_Z], m.roomWall);

    // --- FURNISHED FLAT INTERIOR (Merged & Per-Floor Culled for 60 FPS!) ---
    const intG = new THREE.Group();
    intG.name = `${id}_Interior_F${k}`;
    const ceilY = fy + h - 0.16;

    // 1) Living Room (Front: lx ∈ [FLAT_MIN_X, FLAT_MAX_X], lz ∈ [ROOM_DIV_Z, FLAT_MAX_Z])
    const livCx = (FLAT_MIN_X + FLAT_MAX_X) * 0.5;
    const livCz = (ROOM_DIV_Z + FLAT_MAX_Z) * 0.5;
    box(intG, [Math.min(2.6, FLAT_W - 1.4), 0.02, 2.2], [livCx, fy + 0.02, livCz], m.rugMat);
    // Sofa against West (-X) outer wall
    const sofaX = FLAT_MIN_X + 0.52;
    box(intG, [0.74, 0.40, 2.05], [sofaX, fy + 0.21, livCz], m.sofaFabric);
    box(intG, [0.16, 0.50, 2.05], [sofaX - 0.30, fy + 0.56, livCz], m.sofaFabric);
    // Coffee Table
    box(intG, [0.68, 0.05, 1.15], [sofaX + 1.18, fy + 0.42, livCz], m.wood);
    for (const [tx, tz] of [[sofaX + 0.90, livCz - 0.48], [sofaX + 1.46, livCz - 0.48], [sofaX + 0.90, livCz + 0.48], [sofaX + 1.46, livCz + 0.48]]) {
      box(intG, [0.05, 0.40, 0.05], [tx, fy + 0.20, tz], m.wood);
    }
    // TV Console & Smart TV (or Classic Showcase for Old Houses) along East partition (below doorway)
    const tvZ = ROOM_DIV_Z + 0.98;
    box(intG, [0.38, 0.44, 1.42], [FLAT_MAX_X - 0.24, fy + 0.23, tvZ], m.wood);
    box(intG, [0.06, 0.82, 1.32], [FLAT_MAX_X - 0.06, fy + 1.32, tvZ], m.darkMetal);
    const tvScr = new THREE.Mesh(new THREE.PlaneGeometry(1.24, 0.72), m.tvScreen);
    tvScr.rotation.y = -Math.PI / 2;
    tvScr.position.set(FLAT_MAX_X - 0.10, fy + 1.32, tvZ);
    intG.add(tvScr);
    box(intG, [0.52, 0.04, 0.52], [livCx, ceilY, livCz], m.lamp, { castShadow: false });

    // 2) Master Bedroom (Back-Left: lx ∈ [FLAT_MIN_X, BED_DIV_X], lz ∈ [FLAT_MIN_Z, ROOM_DIV_Z])
    const bedCx = (FLAT_MIN_X + BED_DIV_X) * 0.5;
    const bedCz = (FLAT_MIN_Z + ROOM_DIV_Z) * 0.5;
    const bedHeadX = FLAT_MIN_X + 0.14;
    const bedBodyX = FLAT_MIN_X + 1.08;
    const bedZ = FLAT_MIN_Z + 1.45;
    box(intG, [1.92, 0.28, 1.72], [bedBodyX, fy + 0.15, bedZ], m.wood);
    box(intG, [0.12, 0.92, 1.76], [bedHeadX, fy + 0.48, bedZ], m.wood);
    box(intG, [1.82, 0.18, 1.62], [bedBodyX, fy + 0.37, bedZ], m.mattressMat);
    box(intG, [1.20, 0.19, 1.64], [bedBodyX + 0.30, fy + 0.38, bedZ], m.blanketMat);
    box(intG, [0.34, 0.11, 0.60], [bedHeadX + 0.30, fy + 0.50, bedZ - 0.40], shared.whiteBand);
    box(intG, [0.34, 0.11, 0.60], [bedHeadX + 0.30, fy + 0.50, bedZ + 0.40], shared.whiteBand);
    // Wooden Wardrobe with Mirror
    box(intG, [0.50, 1.98, 1.24], [FLAT_MIN_X + 0.32, fy + 1.00, ROOM_DIV_Z - 0.88], m.wood);
    box(intG, [0.04, 1.38, 0.44], [FLAT_MIN_X + 0.58, fy + 1.12, ROOM_DIV_Z - 0.88], m.mirrorMat || shared.thaiGlass);
    box(intG, [0.50, 0.04, 0.50], [bedCx, ceilY, bedCz], m.lamp, { castShadow: false });

    // 3) Dining & Kitchen Corner (Mid-Right: lx ∈ [BED_DIV_X, FLAT_MAX_X], lz ∈ [BATH_DIV_Z, ROOM_DIV_Z])
    const dinCx = (BED_DIV_X + FLAT_MAX_X) * 0.5;
    const dinCz = (BATH_DIV_Z + ROOM_DIV_Z) * 0.5;
    box(intG, [0.54, 0.82, 1.56], [FLAT_MAX_X - 0.32, fy + 0.42, dinCz], m.pillarTile);
    box(intG, [0.58, 0.05, 1.60], [FLAT_MAX_X - 0.32, fy + 0.85, dinCz], m.blackTile);
    box(intG, [0.40, 0.05, 0.62], [FLAT_MAX_X - 0.32, fy + 0.90, dinCz], m.chrome);
    cylinder(intG, 0.08, 0.08, 0.02, [FLAT_MAX_X - 0.32, fy + 0.93, dinCz - 0.15], m.stoveFlame, 8);
    cylinder(intG, 0.08, 0.08, 0.02, [FLAT_MAX_X - 0.32, fy + 0.93, dinCz + 0.15], m.stoveFlame, 8);
    box(intG, [0.60, 1.68, 0.60], [FLAT_MAX_X - 0.36, fy + 0.85, BATH_DIV_Z + 0.44], m.aluminum);
    box(intG, [0.46, 0.04, 0.46], [dinCx, ceilY, dinCz], m.lamp, { castShadow: false });

    // 4) Attached Bathroom (Back-Right: lx ∈ [BED_DIV_X, FLAT_MAX_X], lz ∈ [FLAT_MIN_Z, BATH_DIV_Z])
    const bathW = FLAT_MAX_X - BED_DIV_X - 0.14;
    const bathD = BATH_DIV_Z - FLAT_MIN_Z - 0.14;
    const bathCx = (BED_DIV_X + FLAT_MAX_X) * 0.5;
    const bathCz = (FLAT_MIN_Z + BATH_DIV_Z) * 0.5;
    box(intG, [bathW, 0.03, bathD], [bathCx, fy + 0.02, bathCz], m.bathTile);
    // Western Porcelain Commode
    const comX = FLAT_MAX_X - 0.48;
    const comZ = FLAT_MIN_Z + 0.54;
    cylinder(intG, 0.17, 0.13, 0.35, [comX, fy + 0.19, comZ], m.porcelain, 10);
    cylinder(intG, 0.21, 0.18, 0.08, [comX, fy + 0.39, comZ], m.porcelain, 10);
    box(intG, [0.38, 0.38, 0.18], [comX, fy + 0.62, FLAT_MIN_Z + 0.24], m.porcelain);
    // Wash Basin & Mirror
    const basX = BED_DIV_X + 0.48;
    cylinder(intG, 0.09, 0.11, 0.64, [basX, fy + 0.33, FLAT_MIN_Z + 0.34], m.porcelain, 8);
    box(intG, [0.46, 0.12, 0.38], [basX, fy + 0.72, FLAT_MIN_Z + 0.38], m.porcelain);
    box(intG, [0.48, 0.66, 0.04], [basX, fy + 1.38, FLAT_MIN_Z + 0.14], m.mirrorMat || shared.thaiGlass);
    // Overhead Shower + Blue Bucket
    rodBetween(intG, [FLAT_MAX_X - 0.22, fy + 0.88, BATH_DIV_Z - 0.44], [FLAT_MAX_X - 0.22, fy + 2.08, BATH_DIV_Z - 0.44], 0.014, m.chrome, 6);
    cylinder(intG, 0.09, 0.07, 0.03, [FLAT_MAX_X - 0.42, fy + 2.02, BATH_DIV_Z - 0.44], m.chrome, 8);
    cylinder(intG, 0.16, 0.12, 0.33, [FLAT_MAX_X - 0.46, fy + 0.17, BATH_DIV_Z - 0.76], m.bucketMat, 8);
    box(intG, [0.34, 0.04, 0.34], [bathCx, ceilY, bathCz], m.lamp, { castShadow: false });

    // Lobby Ceiling LED
    box(intG, [0.48, 0.04, 0.48], [ENT_CX, ceilY, (STAIR_START_Z + hd) * 0.5], m.lamp, { castShadow: false });

    mergeStaticMeshes(intG);
    root.add(intG);
    floorInteriorGroups[k] = intG;

    // Spinning Ceiling Fan in Living Room
    const fg = new THREE.Group();
    fg.position.set(livCx, ceilY + 0.02, livCz);
    dynamicG.add(fg);
    cylinder(fg, 0.018, 0.018, 0.26, [0, -0.13, 0], shared.whiteBand, 6);
    const rotor = new THREE.Group();
    rotor.position.set(0, -0.26, 0);
    fg.add(rotor);
    cylinder(rotor, 0.11, 0.11, 0.045, [0, 0, 0], shared.whiteBand, 8);
    for (let b = 0; b < 3; b++) {
      const a = (b / 3) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.011, 0.09), shared.whiteBand);
      blade.position.set(Math.cos(a) * 0.29, 0, Math.sin(a) * 0.29);
      blade.rotation.y = -a;
      rotor.add(blade);
    }
    animatedFans.push({ rotor, floorIdx: k });

    // Sittable Furniture (transformed to world coordinates!)
    const sofaW = localToWorld(sofaX + 0.08, livCz);
    const bedW = localToWorld(bedBodyX + 0.18, bedZ);
    const comW = localToWorld(comX, comZ + 0.06);
    floorSeats.set(k, [
      { seatX: sofaW.x, seatZ: sofaW.z, seatY: 0.44, yaw: rotY + Math.PI / 2, fy, label: `${nameBn} Sofa (F${k + 1})` },
      { seatX: bedW.x, seatZ: bedW.z, seatY: 0.52, yaw: rotY + Math.PI / 2, fy, label: `${nameBn} King Bed (F${k + 1})` },
      { seatX: comW.x, seatZ: comW.z, seatY: 0.45, yaw: rotY, fy, label: `${nameBn} Commode (F${k + 1})` },
    ]);
  }

  // ==========================================================================
  // 5) ROOFTOP TERRACE (OR PITCHED TIN ROOF FOR 1-STORY OLD COTTAGE)
  // ==========================================================================
  const roofY = FLOOR_Y[floors];
  if (hasPitchedTinRoof) {
    // 1-Story Old Brick Cottage: Flat inner ceiling + pitched corrugated tin roof
    box(exteriorStatic, [W, 0.16, D], [0, roofY - 0.08, 0], shared.stairConcrete);
    box(exteriorStatic, [W + 0.45, 0.09, D * 0.58], [0, roofY + 0.58, D * 0.24], shared.tinTeal, { rotX: 0.22 });
    box(exteriorStatic, [W + 0.45, 0.09, D * 0.58], [0, roofY + 0.58, -D * 0.24], shared.tinTeal, { rotX: -0.22 });
  } else {
    addFloorSlab(roofY, false);
    const paraMat = isOld ? accentMat : shared.whiteBand;
    // Rooftop perimeter parapet wall (1.0m tall)
    box(exteriorStatic, [W, 1.0, 0.22], [0, roofY + 0.50, -hd + 0.11], paraMat);
    box(exteriorStatic, [W, 1.0, 0.22], [0, roofY + 0.50, hd - 0.11], paraMat);
    box(exteriorStatic, [0.22, 1.0, D], [-hw + 0.11, roofY + 0.50, 0], paraMat);
    box(exteriorStatic, [0.22, 1.0, D], [hw - 0.11, roofY + 0.50, 0], paraMat);
    if (isUserHome) {
      // Colorful Mosaic Tile Crown Frieze across the front rooftop parapet!
      box(exteriorStatic, [W + 0.08, 0.54, 0.08], [0, roofY + 0.52, hd + 0.04], shared.colorfulTile, { uvScale: 1.6 });
      box(exteriorStatic, [W + 0.16, 0.12, 0.30], [0, roofY + 1.04, hd - 0.08], shared.whiteBand);
    }
    // Stairhead / Lift Mumty Room over Right Circulation Core (open South exit onto terrace)
    const mumW = hw - SPLIT_X + 0.12;
    const mumCx = (SPLIT_X + hw) * 0.5;
    box(exteriorStatic, [mumW, 0.18, 5.2], [mumCx, roofY + 2.86, -0.35], paraMat);
    box(exteriorStatic, [0.20, 2.8, 5.1], [hw - 0.12, roofY + 1.4, -0.35], paraMat);
    box(exteriorStatic, [mumW, 2.8, 0.20], [mumCx, roofY + 1.4, -2.85], paraMat);
    box(exteriorStatic, [0.20, 2.8, 3.2], [SPLIT_X, roofY + 1.4, -1.25], paraMat);
    // Gazi 2000L Black Overhead Water Tank on concrete stand
    box(exteriorStatic, [1.55, 0.52, 1.55], [-hw + 1.6, roofY + 0.26, -hd + 1.6], shared.stairConcrete);
    cylinder(exteriorStatic, 0.62, 0.64, 1.38, [-hw + 1.6, roofY + 1.20, -hd + 1.6], shared.waterTank, 10);
  }

  mergeStaticMeshes(exteriorStatic);

  // ==========================================================================
  // 6) BUILDING RUNTIME API (GROUND HEIGHT, COLLISIONS, INTERACT, LIFT, UPDATE)
  // ==========================================================================
  function isInFootprint(pos, pad = 0) {
    if (!pos) return false;
    const lp = worldToLocal(pos.x, pos.z);
    return lp.x >= -hw - pad && lp.x <= hw + pad && lp.z >= -hd - pad && lp.z <= hd + pad;
  }

  function isInsideLift(pos) {
    if (!hasLift || !pos) return false;
    const lp = worldToLocal(pos.x, pos.z);
    return lp.x >= LIFT_MIN_X - 0.05 && lp.x <= LIFT_MAX_X + 0.05
      && lp.z >= LIFT_MIN_Z - 0.05 && lp.z <= LIFT_MAX_Z + 0.05;
  }

  function isNearLiftLobby(pos) {
    if (!hasLift || !pos) return false;
    const lp = worldToLocal(pos.x, pos.z);
    return lp.x >= LIFT_MIN_X - 0.8 && lp.x <= LIFT_MAX_X + 1.2
      && lp.z >= LIFT_MAX_Z - 0.2 && lp.z <= LIFT_MAX_Z + 2.2;
  }

  function isLiftOpenAtY(footY) {
    if (!hasLift || state.liftPhase === 'moving' || state.liftDoorOpen < 0.65) return false;
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
    if (!hasLift) return;
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
    if (hasLift && state.liftPhase !== 'moving') {
      state.liftPhase = 'opening';
      redrawLiftPanel();
    }
  }

  function closeDoors() {
    if (hasLift && state.liftPhase !== 'moving') {
      state.liftPhase = 'closing';
      redrawLiftPanel();
    }
  }

  function findNearestInteractable(pos) {
    if (!pos || !isInFootprint(pos, isUserHome ? 3.8 : 2.8)) return null;
    const lp = worldToLocal(pos.x, pos.z);
    const footY = pos.y - 1.68;

    // 1) Inside Lift Cabin
    if (hasLift && isInsideLift(pos) && Math.abs(footY - state.liftY) < 1.6) {
      return { kind: 'lift_inside', prompt: `[E / L] Open ${nameBn} Lift Keypad` };
    }
    // 2) Lift Lobby Call Button
    if (hasLift && isNearLiftLobby(pos)) {
      const fl = nearestFloorIndex(footY);
      return {
        kind: 'lift_call',
        floorIdx: fl,
        prompt: state.liftFloorIndex === fl && state.liftDoorOpen > 0.7
          ? `[E / L] Enter ${nameBn} Elevator`
          : `[E] Call ${nameBn} Elevator (${STOPS[fl].code})`,
      };
    }
    // 3) Ground Floor Front Entrance Door / Grand Green Steel Gate
    if (footY < 2.5 && Math.hypot(lp.x - ENT_CX, lp.z - hd) < (isUserHome ? 3.45 : 2.35)) {
      return {
        kind: 'ent_door',
        prompt: isUserHome
          ? (state.entDoorOpen ? `[E] সবুজ স্টিলের গেট বন্ধ করুন` : `[E] সবুজ স্টিলের গেট খুলুন (পার্কিং গ্যারেজ)`) 
          : (state.entDoorOpen ? `[E] Close ${nameBn} Gate` : `[E] Open ${nameBn} Gate (Enter)`),
      };
    }
    // 4) Flat Main Door on current floor
    for (const fd of flatDoors) {
      if (Math.abs(footY - fd.ly) < 1.35 && Math.hypot(lp.x - fd.lx, lp.z - fd.lz) < 2.1) {
        return {
          kind: 'flat_door',
          door: fd,
          prompt: fd.open ? `[E] Close ${fd.label}` : `[E] Open ${fd.label} (Enter Flat)`,
        };
      }
    }
    // 5) Openable Thai Windows on current floor
    for (const tw of thaiWindows) {
      if (Math.abs(footY - (tw.ly - 1.60)) > 1.35) continue;
      if (Math.hypot(lp.x - tw.lx, lp.z - tw.lz) < 2.15) {
        return {
          kind: 'thai_window',
          win: tw,
          prompt: tw.open ? `[E] Close ${tw.label}` : `[E] Open ${tw.label}`,
        };
      }
    }
    return null;
  }

  function interact(pos) {
    const hit = findNearestInteractable(pos);
    if (!hit) return null;
    if (hit.kind === 'lift_inside') return { action: 'open_lift_keypad', tower: liftApi };
    if (hit.kind === 'lift_call') {
      goToFloor(hit.floorIdx);
      return { action: 'open_lift_keypad', tower: liftApi };
    }
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
    return null;
  }

  function findNearestSeat(pos) {
    if (!isInFootprint(pos, 0.2)) return null;
    const footY = pos.y - 1.68;
    const fl = nearestFloorIndex(footY);
    const list = floorSeats.get(fl);
    if (!list) return null;
    let best = null;
    let bestD = 1.55;
    for (const s of list) {
      const d = Math.hypot(pos.x - s.seatX, pos.z - s.seatZ);
      if (d < bestD && Math.abs(footY - s.fy) < 1.3) {
        bestD = d;
        best = { ...s, dist: d };
      }
    }
    return best;
  }

  function computeGroundHeight(pos, grounded, verticalVelocity) {
    if (isUserHome && isInFootprint(pos, 2.4)) {
      const lpRamp = worldToLocal(pos.x, pos.z);
      const footY = pos.y - 1.68;
      if (footY < 1.4 && lpRamp.z >= hd && lpRamp.z <= hd + 2.28 && lpRamp.x >= -1.65 && lpRamp.x <= 1.02) {
        const t = THREE.MathUtils.clamp((lpRamp.z - hd) / 2.20, 0, 1);
        return THREE.MathUtils.lerp(FLOOR_Y[0], 0.02, t);
      }
      if (footY < 1.4 && lpRamp.z >= hd && lpRamp.z <= hd + 1.46 && lpRamp.x > 1.02 && lpRamp.x <= 2.45) {
        const t = THREE.MathUtils.clamp((lpRamp.z - hd) / 1.38, 0, 1);
        return THREE.MathUtils.lerp(FLOOR_Y[0], 0.02, t);
      }
    }
    if (!isInFootprint(pos, 0.2)) return null;
    const lp = worldToLocal(pos.x, pos.z);
    const footY = pos.y - 1.68;
    const maxStepUp = grounded ? 0.55 : (verticalVelocity > 0 ? 0.08 : 0.38);

    // 1) Inside 3D Lift Cabin
    if (hasLift && isInsideLift(pos) && Math.abs(footY - state.liftY) < 2.2) {
      return state.liftY;
    }

    let bestY = FLOOR_Y[0];
    // 2) Walkable Staircase (lx ∈ [STAIR_MIN_X, STAIR_MAX_X], lz ∈ [STAIR_END_Z, STAIR_START_Z])
    const hasStairs = !hasPitchedTinRoof;
    const inStairs = hasStairs && lp.x >= STAIR_MIN_X && lp.x <= STAIR_MAX_X && lp.z >= STAIR_END_Z && lp.z <= STAIR_START_Z;
    const inStairHole = hasStairs && lp.x >= STAIR_MIN_X + 0.06 && lp.x <= STAIR_MAX_X - 0.06 && lp.z > STAIR_END_Z + 0.16 && lp.z < STAIR_START_Z - 0.16;
    if (inStairs) {
      const t = THREE.MathUtils.clamp((STAIR_START_Z - lp.z) / (STAIR_START_Z - STAIR_END_Z), 0, 1);
      for (let k = 0; k < floors; k++) {
        const rampY = FLOOR_Y[k] + t * (FLOOR_Y[k + 1] - FLOOR_Y[k]);
        if (rampY <= footY + maxStepUp) bestY = Math.max(bestY, rampY);
      }
    }

    // 3) Floor Slabs (respecting stairwell & lift shaft cutouts on upper floors)
    const maxSlabK = hasPitchedTinRoof ? 0 : floors;
    for (let k = 0; k <= maxSlabK; k++) {
      const fy = FLOOR_Y[k];
      if (fy > footY + maxStepUp) continue;
      if (k >= 1 && inStairHole) continue;
      if (hasLift && k >= 1 && lp.x >= LIFT_MIN_X && lp.x <= LIFT_MAX_X && lp.z >= LIFT_MIN_Z && lp.z <= LIFT_MAX_Z) continue;
      bestY = Math.max(bestY, fy);
    }
    return bestY;
  }

  function applyPlayerCollisions(pos, radius, footY) {
    if (!isInFootprint(pos, 1.4)) return;
    const lp = worldToLocal(pos.x, pos.z);
    const fl = nearestFloorIndex(footY);
    const inStairs = !hasPitchedTinRoof && lp.x >= STAIR_MIN_X - 0.08 && lp.x <= STAIR_MAX_X + 0.08 && lp.z >= STAIR_END_Z && lp.z <= STAIR_START_Z;

    // 1) Lift Shaft Walls (full height)
    if (hasLift) {
      resolveCircleAABB(lp, 0.18, LIFT_MIN_X - 0.10, LIFT_MIN_X + 0.06, LIFT_MIN_Z - 0.10, LIFT_MAX_Z + 0.10);
      resolveCircleAABB(lp, 0.18, LIFT_MAX_X - 0.06, LIFT_MAX_X + 0.10, LIFT_MIN_Z - 0.10, LIFT_MAX_Z + 0.10);
      resolveCircleAABB(lp, 0.18, LIFT_MIN_X - 0.10, LIFT_MAX_X + 0.10, LIFT_MIN_Z - 0.10, LIFT_MIN_Z + 0.06);
      resolveCircleAABB(lp, 0.15, LIFT_MIN_X - 0.08, LIFT_DOOR_MIN_X, LIFT_MAX_Z - 0.08, LIFT_MAX_Z + 0.08);
      resolveCircleAABB(lp, 0.15, LIFT_DOOR_MAX_X, LIFT_MAX_X + 0.08, LIFT_MAX_Z - 0.08, LIFT_MAX_Z + 0.08);
      if (!isLiftOpenAtY(footY)) {
        resolveCircleAABB(lp, 0.20, LIFT_DOOR_MIN_X, LIFT_DOOR_MAX_X, LIFT_MAX_Z - 0.08, LIFT_MAX_Z + 0.08);
      }
    }

    const roofLevelY = FLOOR_Y[floors];
    if (hasPitchedTinRoof || footY < roofLevelY - 0.6) {
      // Exterior Solid Walls (West -X, East +X, Back -Z)
      resolveCircleAABB(lp, radius, -hw, -hw + 0.26, -hd, hd);
      resolveCircleAABB(lp, radius, hw - 0.26, hw, -hd, hd);
      resolveCircleAABB(lp, radius, -hw, hw, -hd, -hd + 0.26);

      if (footY < FLOOR_Y[1] - 0.4 || hasPitchedTinRoof) {
        // Ground Floor Front Wall (+Z) with Entrance Doorway
        resolveCircleAABB(lp, radius, -hw, ENT_MIN_X, hd - 0.26, hd);
        resolveCircleAABB(lp, radius, ENT_MAX_X, hw, hd - 0.26, hd);
        if (!state.entDoorOpen) {
          resolveCircleAABB(lp, radius, ENT_MIN_X, ENT_MAX_X, hd - 0.24, hd + 0.06);
        }
      } else {
        // Upper Floor Solid Front Wall (+Z)
        resolveCircleAABB(lp, radius, -hw, hw, hd - 0.26, hd);
      }

      const isOpenUserGarage = isUserHome && footY < FLOOR_Y[1] - 0.4;
      if (!inStairs && !isOpenUserGarage) {
        // Lobby-to-Flat wall at SPLIT_X
        resolveCircleAABB(lp, radius, SPLIT_X - 0.10, SPLIT_X + 0.10, -hd, FLAT_DOOR_MIN_Z);
        resolveCircleAABB(lp, radius, SPLIT_X - 0.10, SPLIT_X + 0.10, FLAT_DOOR_MAX_Z, hd);
        const fd = flatDoors.find((d) => d.floorIdx === fl);
        if (fd && !fd.open) {
          resolveCircleAABB(lp, radius, fd.collider.minX, fd.collider.maxX, fd.collider.minZ, fd.collider.maxZ);
        }
        // Bedroom / Dining divider
        resolveCircleAABB(lp, radius, BED_DIV_X - 0.08, BED_DIV_X + 0.08, -hd, ROOM_DIV_Z);
        const bedDoorMinX = BED_DIV_X - 1.25;
        if (bedDoorMinX > FLAT_MIN_X + 0.25) {
          resolveCircleAABB(lp, radius, FLAT_MIN_X, bedDoorMinX, ROOM_DIV_Z - 0.08, ROOM_DIV_Z + 0.08);
        }
        // Attached Bathroom front wall
        const bathDoorMaxX = BED_DIV_X + 1.05;
        if (FLAT_MAX_X > bathDoorMaxX + 0.18) {
          resolveCircleAABB(lp, radius, bathDoorMaxX, FLAT_MAX_X, BATH_DIV_Z - 0.08, BATH_DIV_Z + 0.08);
        }
      }
      if (!hasPitchedTinRoof) {
        // Stairwell inner guardrail
        resolveCircleAABB(lp, 0.12, STAIR_MIN_X - 0.04, STAIR_MIN_X + 0.08, STAIR_END_Z + 0.10, STAIR_START_Z - 0.10);
      }
    } else {
      // Rooftop Parapet Walls
      if (footY - roofLevelY < 0.68) {
        resolveCircleAABB(lp, radius, -hw, -hw + 0.24, -hd, hd);
        resolveCircleAABB(lp, radius, hw - 0.24, hw, -hd, hd);
        resolveCircleAABB(lp, radius, -hw, hw, -hd, -hd + 0.24);
        resolveCircleAABB(lp, radius, -hw, hw, hd - 0.24, hd);
      }
    }

    const wp = localToWorld(lp.x, lp.z);
    pos.x = wp.x;
    pos.z = wp.z;
  }

  function applyCarCollisions(carPos, r) {
    if (!isInFootprint(carPos, r + 1.0)) return false;
    const lp = worldToLocal(carPos.x, carPos.z);
    const ox = lp.x;
    const oz = lp.z;
    resolveCircleAABB(lp, r, -hw, hw, -hd, hd);
    if (Math.hypot(lp.x - ox, lp.z - oz) > 0.002) {
      const wp = localToWorld(lp.x, lp.z);
      carPos.x = wp.x;
      carPos.z = wp.z;
      return true;
    }
    return false;
  }

  function getZoneName(x, z, footY = 0) {
    const lp = worldToLocal(x, z);
    if (lp.x < -hw || lp.x > hw || lp.z < -hd || lp.z > hd) return null;
    if (hasLift && isInsideLift({ x, z })) {
      return `${zonePrefix} · ELEVATOR (${STOPS[state.liftFloorIndex]?.code || 'GF'})`;
    }
    if (!hasPitchedTinRoof && footY >= FLOOR_Y[floors] - 0.6) {
      return `${zonePrefix} · ROOFTOP TERRACE`;
    }
    const fl = nearestFloorIndex(footY);
    if (isUserHome && fl === 0) {
      return `${zonePrefix} · PARKING GARAGE & STAIRWAY`;
    }
    const flTag = floors === 1 ? '' : ` (FLOOR ${fl + 1})`;
    if (lp.x >= SPLIT_X) return `${zonePrefix}${flTag} · ${hasLift ? 'LIFT & STAIR LOBBY' : 'STAIR LOBBY'}`;
    if (lp.z >= ROOM_DIV_Z) return `${zonePrefix}${flTag} · LIVING ROOM`;
    if (lp.x < BED_DIV_X) return `${zonePrefix}${flTag} · MASTER BEDROOM`;
    return lp.z < BATH_DIV_Z
      ? `${zonePrefix}${flTag} · ATTACHED BATHROOM`
      : `${zonePrefix}${flTag} · DINING & KITCHEN`;
  }

  function update(dt, playerPos, isLow) {
    // 1) Entrance door / Grand Double-Leaf Green Steel Gate animation
    const tgtEnt = state.entDoorOpen ? Math.PI * 0.54 : 0;
    if (Math.abs(tgtEnt - state.entDoorAngle) > 0.001) {
      state.entDoorAngle += (tgtEnt - state.entDoorAngle) * Math.min(1, dt * 6.5);
      entDoorPivot.rotation.y = state.entDoorAngle;
      if (entDoorPivotRight) entDoorPivotRight.rotation.y = -state.entDoorAngle;
    }
    // 2) Flat doors animation
    for (const fd of flatDoors) {
      const tgt = fd.open ? fd.openAngle : 0;
      if (Math.abs(tgt - fd.angle) > 0.001) {
        fd.angle += (tgt - fd.angle) * Math.min(1, dt * 6.5);
        fd.pivot.rotation.y = fd.angle;
      }
    }
    // 3) Thai sliding windows animation
    for (const tw of thaiWindows) {
      const tgt = tw.open ? 1 : 0;
      if (Math.abs(tgt - tw.progress) > 0.001) {
        tw.progress += (tgt - tw.progress) * Math.min(1, dt * 6.8);
        tw.mesh.position.x = THREE.MathUtils.lerp(tw.closedX, tw.openX, tw.progress);
      }
    }
    // 4) 3D Passenger Lift animation
    if (hasLift && liftCabin) {
      const doorSpeed = 1.6;
      let dirty = false;
      if (state.liftPhase === 'closing') {
        state.liftDoorOpen = Math.max(0, state.liftDoorOpen - doorSpeed * dt);
        if (state.liftDoorOpen <= 0.01) {
          state.liftDoorOpen = 0;
          state.liftPhase = state.liftTargetIndex !== state.liftFloorIndex ? 'moving' : 'idle';
          dirty = true;
        }
      } else if (state.liftPhase === 'moving') {
        const targetY = STOPS[state.liftTargetIndex].y;
        const diff = targetY - state.liftY;
        const speed = 4.0;
        const prevIdx = state.liftFloorIndex;
        if (Math.abs(diff) <= speed * dt) {
          state.liftY = targetY;
          state.liftFloorIndex = state.liftTargetIndex;
          state.liftDirection = 0;
          state.liftPhase = 'opening';
          dirty = true;
        } else {
          state.liftY += Math.sign(diff) * speed * dt;
          state.liftFloorIndex = nearestFloorIndex(state.liftY);
          if (state.liftFloorIndex !== prevIdx) dirty = true;
        }
      } else if (state.liftPhase === 'opening') {
        state.liftDoorOpen = Math.min(1, state.liftDoorOpen + doorSpeed * dt);
        if (state.liftDoorOpen >= 0.99) {
          state.liftDoorOpen = 1;
          state.liftPhase = 'idle';
          dirty = true;
        }
      }
      if (dirty) redrawLiftPanel();
      liftCabin.position.y = state.liftY;
      const off = state.liftDoorOpen * (liftDoorW * 0.88);
      liftDoorLeft.position.x = -liftDoorW * 0.5 - off;
      liftDoorRight.position.x = liftDoorW * 0.5 + off;
    }

    // 5) Per-floor interior visibility culling (60 FPS!)
    const distSq = playerPos ? ((playerPos.x - cx) ** 2 + (playerPos.z - cz) ** 2) : 0;
    const nearInt = distSq < 42 * 42;
    const pFootY = playerPos ? (playerPos.y - 1.68) : 0;
    const curFl = nearestFloorIndex(pFootY);
    for (let k = 0; k < floors; k++) {
      const grp = floorInteriorGroups[k];
      if (!grp) continue;
      const want = nearInt && (Math.abs(curFl - k) <= 1 || distSq < 20 * 20);
      if (grp.visible !== want) grp.visible = want;
    }
    if (!isLow && nearInt) {
      const rotD = dt * 5.8;
      for (const f of animatedFans) {
        if (Math.abs(curFl - f.floorIdx) <= 1) f.rotor.rotation.y += rotD;
      }
    }
  }

  const liftCenterWorld = localToWorld(LIFT_CX, LIFT_CZ);
  const liftExitWorld = localToWorld(LIFT_CX, LIFT_MAX_Z + 0.95);

  const liftApi = hasLift ? {
    id,
    eyebrowTitle,
    state,
    stops: STOPS,
    liftCabinCenter: liftCenterWorld,
    liftExitPos: liftExitWorld,
    isInTowerFootprint: isInFootprint,
    isInsideLift,
    isNearLiftLobby,
    isLiftOpenAtY,
    nearestFloorIndex,
    goToFloor,
    openDoors,
    closeDoors,
  } : null;

  return {
    id,
    hasLift,
    liftApi,
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

/**
 * Builds the detailed, fully enterable residential alley (গলি) directly opposite
 * Parashmoni Kala Kendra (24, Altapole Lane) along z = -404.0, x = 172..218:
 *  - 8 Enterable Old & New Residential Houses of varying sizes (1 to 5 stories)
 *  - 2 Modern Apartments WITH working 3D Elevators (N2 মধুমতি হাইটস & S2 স্বপ্ননীড় টাওয়ার)
 *  - 6 Old & New Walk-Up Houses WITHOUT Elevators (walkable staircases + furnished rooms)
 *  - Alley entrance signboard, streetlamp bollards & Khulna neighborhood greenery
 */
export function buildAltapoleOppositeGoli(parent, m, helpers = {}) {
  const root = new THREE.Group();
  root.name = 'AltapoleOppositeGoli_Parashmoni';
  parent.add(root);

  const shared = createSharedGoliMaterials(m);
  const propsStatic = new THREE.Group();
  root.add(propsStatic);
  const propsDynamic = new THREE.Group();
  root.add(propsDynamic);

  // Alley Mouth Welcome Signpole at (x = 172.0, z = -407.2) right opposite Parashmoni Kala Kendra!
  cylinder(propsStatic, 0.055, 0.075, 3.5, [172.1, 1.75, -407.2], m.darkMetal, 8);
  const alleySignTex = makeSignTexture({
    title: 'আলতাপোল পূর্ব উপ-গলি (পরশমণি কেন্দ্রের বিপরীত)',
    subtitle: '২৪/ক–২৬ আলতাপোল গলি · ৮টি প্রবেশযোগ্য বাড়ি ও লিফট',
    bg: '#0f3d2e',
    fg: '#ffffff',
    accent: '#fde047',
    border: '#52b788',
  });
  const alleySignMat = new THREE.MeshStandardMaterial({
    map: alleySignTex,
    emissive: 0xffffff,
    emissiveMap: alleySignTex,
    emissiveIntensity: 0.30,
    roughness: 0.34,
    side: THREE.DoubleSide,
  });
  const alleySign = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.96, 0.10), alleySignMat);
  alleySign.position.set(172.1, 3.35, -407.2);
  alleySign.rotation.y = -Math.PI / 2;
  propsDynamic.add(alleySign);

  // Warm alley boundary bollard lamps along both footpaths
  for (const [bx, bz] of [
    [182.0, -406.8], [190.5, -406.8], [200.6, -406.8],
    [181.8, -401.2], [192.0, -401.2], [200.8, -401.2],
  ]) {
    box(propsStatic, [0.24, 1.15, 0.24], [bx, 0.58, bz], shared.dampPlinth);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), shared.liftLed);
    globe.position.set(bx, 1.24, bz);
    propsDynamic.add(globe);
  }
  mergeStaticMeshes(propsStatic);

  // ==========================================================================
  // 8 ENTERABLE OLD & NEW HOUSES ALONG THE ALLEY (NORTH, SOUTH & DEAD-END)
  // ==========================================================================
  const specs = [
    // --- NORTH SIDE (Facing South +Z toward z = -404.0, front wall at z = -407.0) ---
    {
      id: 'N1_OldHeritage',
      nameBn: '২৪/ক · পুরাতন লাল-দালান',
      eyebrowTitle: '24/A ALTAPOLE GOLI · OLD HOUSE',
      zonePrefix: '24/A ALTAPOLE GOLI · OLD HERITAGE HOUSE',
      cx: 186.3, cz: -411.6, rotY: 0,
      width: 8.2, depth: 9.2, floors: 2,
      style: 'old', hasLift: false,
      wallHex: '#d9c2a3', accentHex: '#9c4a35', gfHex: '#c7a480',
      seed: 4101,
    },
    {
      id: 'N2_ModhumotiHeights',
      nameBn: '২৪/খ · মধুমতি হাইটস (লিফট)',
      eyebrowTitle: '24/B MODHUMOTI HEIGHTS · ALTAPOLE GOLI',
      zonePrefix: '24/B MODHUMOTI HEIGHTS',
      cx: 195.6, cz: -412.0, rotY: 0,
      width: 9.8, depth: 10.0, floors: 5,
      style: 'new', hasLift: true,
      wallHex: '#e9efe8', accentHex: '#3f6252',
      seed: 4202,
    },
    {
      id: 'N3_ShantiNeer',
      nameBn: '২৪/গ · শান্তি নীড় (পুরাতন)',
      eyebrowTitle: '24/C SHANTI NEER · ALTAPOLE GOLI',
      zonePrefix: '24/C SHANTI NEER',
      cx: 204.65, cz: -411.6, rotY: 0,
      width: 7.7, depth: 9.2, floors: 3,
      style: 'old', hasLift: false,
      wallHex: '#b4c7b9', accentHex: '#63786a', gfHex: '#9fb4a5',
      seed: 4303,
    },

    // --- SOUTH SIDE (Facing North -Z toward z = -404.0, front wall at z = -401.0) ---
    {
      id: 'S1_ChunSurki',
      nameBn: '২৫/ক · পুরাতন চুন-সুরকি বাড়ি',
      eyebrowTitle: '25/A OLD CHUN-SURKI HOUSE',
      zonePrefix: '25/A ALTAPOLE GOLI · OLD HOUSE',
      cx: 177.3, cz: -396.4, rotY: Math.PI,
      width: 8.6, depth: 9.2, floors: 2,
      style: 'old', hasLift: false,
      wallHex: '#ccb189', accentHex: '#8a3d2b', gfHex: '#b39570',
      seed: 4404,
    },
    {
      id: 'S2_ShopnoNeerTower',
      nameBn: '২৫/খ · স্বপ্ননীড় টাওয়ার (লিফট)',
      eyebrowTitle: '25/B SHOPNONEER TOWER · ALTAPOLE GOLI',
      zonePrefix: '25/B SHOPNONEER TOWER',
      cx: 186.9, cz: -396.1, rotY: Math.PI,
      width: 9.8, depth: 9.8, floors: 4,
      style: 'new', hasLift: true,
      wallHex: '#eef2f6', accentHex: '#2e4a66',
      seed: 4505,
    },
    {
      id: 'S3_ShobujKutir',
      nameBn: '২৫/গ · সবুজ কুটির (নতুন)',
      eyebrowTitle: '25/C SHOBUJ KUTIR · ALTAPOLE GOLI',
      zonePrefix: '25/C SHOBUJ KUTIR',
      cx: 196.4, cz: -396.3, rotY: Math.PI,
      width: 8.4, depth: 9.4, floors: 3,
      style: 'new', hasLift: false,
      wallHex: '#e6ece8', accentHex: '#4f7a68', gfHex: '#d5dfd8',
      seed: 4606,
    },
    {
      id: 'S4_OldCottage',
      nameBn: '২৫/ঘ · পুরাতন একতলা বাড়ি',
      eyebrowTitle: '25/D OLD COTTAGE · ALTAPOLE GOLI',
      zonePrefix: '25/D OLD ONE-STORY HOUSE',
      cx: 204.7, cz: -396.7, rotY: Math.PI,
      width: 7.4, depth: 8.6, floors: 1,
      style: 'old', hasLift: false,
      hasPitchedTinRoof: true,
      wallHex: '#d1b89c', accentHex: '#7a4534', gfHex: '#bfa184',
      seed: 4707,
    },

  ];

  const buildings = specs.map((cfg) => createEnterableGoliBuilding(root, shared, cfg));
  // Dead-end Cul-de-Sac: User's Grand 5-Story Dream Home (4 Big Flats/Floor, Open Rooftop Garden, Walkable Penthouse Roof & Dual Water Tanks)
  const userDreamHome = createUserDreamHome(root, shared, { cx: 217.8, cz: -404.0, rotY: -Math.PI / 2 });
  buildings.push(userDreamHome);
  const liftBuildings = buildings.filter((b) => b.hasLift && b.liftApi);

  // Subtle decorative potted palms flanking the alley dead-end
  helpers.addPalm?.(propsDynamic, 208.2, 0, -412.6, 7.4, 0.12, 0.25);
  helpers.addPalm?.(propsDynamic, 208.2, 0, -395.4, 7.0, -0.15, 0.22);

  function inGoliBounds(pos, pad = 6.0) {
    return pos && pos.x >= 169 - pad && pos.x <= 236 + pad && pos.z >= -422 - pad && pos.z <= -386 + pad;
  }

  return {
    group: root,
    buildings,
    getActiveLiftTower(pos) {
      if (!inGoliBounds(pos, 10.0)) return null;
      for (const b of liftBuildings) {
        if (b.isInFootprint(pos, 3.0)) return b.liftApi;
      }
      return null;
    },
    isInsideAnyRoom(pos) {
      if (!inGoliBounds(pos, 1.0)) return false;
      for (const b of buildings) {
        if (b.isInFootprint(pos, -0.05)) return true;
      }
      return false;
    },
    getPrompt(pos) {
      if (!inGoliBounds(pos, 3.5)) return null;
      for (const b of buildings) {
        const p = b.getPrompt(pos);
        if (p) return p;
      }
      return null;
    },
    interact(pos) {
      if (!inGoliBounds(pos, 3.5)) return null;
      for (const b of buildings) {
        const res = b.interact(pos);
        if (res) return res;
      }
      return null;
    },
    findNearestSeat(pos) {
      if (!inGoliBounds(pos, 1.0)) return null;
      for (const b of buildings) {
        const s = b.findNearestSeat(pos);
        if (s) return s;
      }
      return null;
    },
    computeGroundHeight(pos, grounded, verticalVelocity) {
      if (!inGoliBounds(pos, 1.0)) return null;
      for (const b of buildings) {
        const y = b.computeGroundHeight(pos, grounded, verticalVelocity);
        if (y !== null && y !== undefined) return y;
      }
      // Raised red-brick footpaths along both sides of the opposite alley (prevents feet sinking)
      if (
        pos.x >= 171.6 && pos.x <= 208.6 &&
        ((pos.z >= -406.95 && pos.z <= -405.58) || (pos.z >= -402.42 && pos.z <= -401.05))
      ) {
        return 0.24;
      }
      return null;
    },
    applyPlayerCollisions(pos, radius, footY) {
      if (!inGoliBounds(pos, 2.0)) return;
      for (const b of buildings) {
        b.applyPlayerCollisions(pos, radius, footY);
      }
    },
    applyCarCollisions(carPos, carState) {
      if (!inGoliBounds(carPos, 4.0)) return { hitWall: false, inGarage: false };
      const r = Math.max((carState?.halfWidth || 0.90) + 0.10, 0.92);
      let hitWall = false;
      let inGarage = false;
      for (const b of buildings) {
        const res = b.applyCarCollisions(carPos, r);
        if (typeof res === 'object' && res !== null) {
          if (res.hitWall) hitWall = true;
          if (res.inGarage) inGarage = true;
        } else if (res) {
          hitWall = true;
        }
      }
      return { hitWall, inGarage };
    },
    getZoneName(x, z, footY = 0) {
      if (!inGoliBounds({ x, z }, 1.0)) return null;
      for (const b of buildings) {
        const zn = b.getZoneName(x, z, footY);
        if (zn) return zn;
      }
      if (x >= 171.0 && x <= 209.2 && z >= -407.2 && z <= -400.8) {
        return 'ALTAPOLE EAST GOLI · OPPOSITE PARASHMONI KALA KENDRA';
      }
      return null;
    },
    toggleAllDoors() {
      for (const b of buildings) b.toggleAllDoors();
    },
    update(delta, playerPos = null, isLow = false) {
      const dt = Math.min(delta, 0.05);
      const nearGoli = !playerPos || ((playerPos.x - 194) ** 2 + (playerPos.z + 404) ** 2) < 250 * 250;
      if (root.visible !== nearGoli) root.visible = nearGoli;
      if (!nearGoli) return;
      for (const b of buildings) {
        b.update(dt, playerPos, isLow);
      }
    },
  };
}
