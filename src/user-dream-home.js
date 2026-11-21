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
 * Builds the user's Grand 5-Story Dream Home directly straight at the end of Altapole East Goli:
 *  - Elevated Ground Floor (Level 0 at y = 0.85m) with a 4.2m Hill-Climb Tiled Ramp for Cars & Bikes + 6-step Side Stairs
 *  - Tall, Wide Shiny Emerald Green + Mirror Stainless Steel Double Garage Gate (3.8m × 3.4m, gleams in sun & at night!)
 *  - Huge Open Drive-In Car & Bike Parking Garage on Level 0
 *  - Central Staircase & Corridor Core down the middle (GF -> 2F -> 3F -> 4F -> 5F -> Rooftop)
 *  - 2 Big, Separate, Enclosed Flats (Flat A + Flat B) on EVERY Upper Floor (Floors 2, 3, 4, 5)
 *  - 3 Openable Main Wooden Doors right beside the Staircase on EVERY Upper Floor!
 *  - Fully Furnished & Interactive Flats: Openable Wooden Almirahs, Openable Fridges, ON/OFF Smart TVs, Sittable Sofas/Beds/Chairs/Commodes, Openable Thai Windows
 *  - Lush Rooftop Flower & Fruit-Tree Garden (ছাদ বাগান) + Well-Crafted Furnished Enterable Rooftop Room (ছাদের রুম)!
 */
export function createUserDreamHome(parent, shared, cfg = {}) {
  const m = shared.m;
  const cx = cfg.cx ?? 215.3;
  const cz = cfg.cz ?? -404.0;
  const rotY = cfg.rotY ?? (-Math.PI / 2); // Faces West (-X) straight down the alley!
  const W = 16.4;
  const D = 13.0;
  const floors = 5; // 5 Stories: GF (0) + 2F (1) + 3F (2) + 4F (3) + 5F (4) + Rooftop (5)
  const hw = W * 0.5; // 8.2
  const hd = D * 0.5; // 6.5
  const gfBaseY = 0.85; // Elevated Level 0 for real hill-climb car/bike ramp!
  const gfH = 4.10;
  const flH = 3.20;
  const FLOOR_Y = [gfBaseY];
  for (let k = 1; k <= floors; k++) {
    FLOOR_Y.push(Number((gfBaseY + gfH + (k - 1) * flH).toFixed(2)));
  }
  const roofY = FLOOR_Y[floors]; // 17.75m

  const nameBn = '২৬ · আলতাপোল গলি ভিলা (৫-তলা)';
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

  // Materials: Soft Off-White + Glossy Emerald Green & Mirror Stainless Steel + Rooftop Garden Flowers!
  const softWhiteWall = shared.makeWall('#f7f8f5', 4808, false);
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

  // Geometry Constants (Local Space: +Z is front facade straight facing the alley!)
  const ENT_CX = 0.0;
  const ENT_MIN_X = -1.90;
  const ENT_MAX_X = 1.90;  // 3.80m wide grand garage gate dead-center on alley!
  const ENT_DOOR_H = 3.40; // Extra tall!
  const RAMP_LEN = 4.20;   // Long smooth hill-climb ramp (y = 0 -> 0.85m)!

  // Central Staircase & Corridor Core down the middle (lx ∈ [-1.75, +1.75])
  const CORR_MIN_X = -1.75;
  const CORR_MAX_X = 1.75;
  const STAIR_MIN_X = -1.55;
  const STAIR_MAX_X = -0.05; // 1.50m wide marble staircase in center-left of core
  const STAIR_START_Z = 2.40;
  const STAIR_END_Z = -3.40;

  // 3 Main Doors beside the Central Staircase on EVERY Upper Floor:
  //   Door 1: Flat A Front Entry (lx = CORR_MIN_X = -1.75, lz ∈ [2.60, 3.85])
  //   Door 2: Flat B Front Entry (lx = CORR_MAX_X = +1.75, lz ∈ [2.60, 3.85])
  //   Door 3: Flat B Rear Suite Entry (lx = CORR_MAX_X = +1.75, lz ∈ [-4.45, -3.20])
  const D_FRONT_MIN_Z = 2.60;
  const D_FRONT_MAX_Z = 3.85;
  const D_FRONT_CZ = (D_FRONT_MIN_Z + D_FRONT_MAX_Z) * 0.5;
  const D_REAR_MIN_Z = -4.45;
  const D_REAR_MAX_Z = -3.20;
  const D_REAR_CZ = (D_REAR_MIN_Z + D_REAR_MAX_Z) * 0.5;

  // Rooftop Penthouse Room (well-crafted enterable room at back-right of rooftop)
  const RROOM_MIN_X = 2.30;
  const RROOM_MAX_X = 7.60;
  const RROOM_MIN_Z = -6.00;
  const RROOM_MAX_Z = -1.10;
  const RROOM_DOOR_MIN_X = 3.20;
  const RROOM_DOOR_MAX_X = 4.45;
  const RROOM_DOOR_CX = (RROOM_DOOR_MIN_X + RROOM_DOOR_MAX_X) * 0.5;

  const root = new THREE.Group();
  root.name = 'AltapoleGoli_UserDreamHome_5Story';
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
  const floorSeats = new Map();

  // Helper: Floor Slab with Central Stairwell Cutout
  function addFloorSlab(y, isGround = false) {
    if (isGround) {
      // Elevated Level 0 Plinth Slab (y = 0 -> 0.85m!)
      box(exteriorStatic, [W, y, D], [0, y * 0.5, 0], shared.garageFloorTile, { uvScale: 3.0 });
      // Decorative colorful tile skirt wrapping the elevated 0.85m front plinth
      box(exteriorStatic, [W + 0.10, y, 0.08], [0, y * 0.5, hd + 0.02], shared.colorfulTile, { uvScale: 2.0 });

      // LONG HILL-CLIMB ANTI-SLIP TILED RAMP FOR CARS & BIKES (3.60m wide × 4.20m long, y = 0 -> 0.85m!)
      const rampW = 3.60;
      const rampSegs = 22;
      for (let rs = 0; rs < rampSegs; rs++) {
        const frac = (rs + 0.5) / rampSegs;
        const segH = THREE.MathUtils.lerp(y, 0.03, frac);
        const segZ = hd + frac * RAMP_LEN;
        box(exteriorStatic, [rampW, segH, RAMP_LEN / rampSegs + 0.03], [0, segH * 0.5, segZ], shared.bikeRampTile, { uvScale: 1.1 });
      }
      // Sloped Colorful Mosaic Tile Retaining Curbs along both sides of the Hill-Climb Ramp
      for (let rs = 0; rs < 12; rs++) {
        const frac = (rs + 0.5) / 12;
        const curbH = THREE.MathUtils.lerp(y + 0.16, 0.16, frac);
        const segZ = hd + frac * RAMP_LEN;
        box(exteriorStatic, [0.18, curbH, RAMP_LEN / 12 + 0.04], [-rampW * 0.5 - 0.09, curbH * 0.5, segZ], shared.colorfulTile, { uvScale: 0.9 });
        box(exteriorStatic, [0.18, curbH, RAMP_LEN / 12 + 0.04], [rampW * 0.5 + 0.09, curbH * 0.5, segZ], shared.colorfulTile, { uvScale: 0.9 });
      }

      // Adjacent 6-Step Colorful-Tiled Pedestrian Stairs (সিঁড়ি) right next to the Hill-Climb Ramp (lx ∈ [2.05, 3.75])
      const stepW = 1.70;
      const stepCx = 2.90;
      for (let st = 0; st < 6; st++) {
        const stH = ((6 - st) / 6) * y;
        const stZ = hd + (st + 0.5) * 0.38;
        box(exteriorStatic, [stepW, stH, 0.39], [stepCx, stH * 0.5, stZ], shared.colorfulTile, { uvScale: 0.9 });
        box(exteriorStatic, [stepW + 0.04, 0.035, 0.41], [stepCx, stH + 0.015, stZ], shared.whiteBand);
      }
      return;
    }

    const slabH = 0.22;
    const slabY = y - 0.11;
    // 1) Left Wing Slab (Flat A: lx ∈ [-hw, CORR_MIN_X])
    box(exteriorStatic, [CORR_MIN_X - (-hw), slabH, D], [(-hw + CORR_MIN_X) * 0.5, slabY, 0], m.pillarTile || shared.stairConcrete, { uvScale: 2.2 });
    // 2) Right Wing Slab (Flat B: lx ∈ [CORR_MAX_X, +hw])
    box(exteriorStatic, [hw - CORR_MAX_X, slabH, D], [(CORR_MAX_X + hw) * 0.5, slabY, 0], m.pillarTile || shared.stairConcrete, { uvScale: 2.2 });
    // 3) Center Corridor Front Landing (lx ∈ [CORR_MIN_X, CORR_MAX_X], lz ∈ [STAIR_START_Z, +hd])
    box(exteriorStatic, [CORR_MAX_X - CORR_MIN_X, slabH, hd - STAIR_START_Z], [0, slabY, (STAIR_START_Z + hd) * 0.5], m.pillarTile || shared.stairConcrete, { uvScale: 1.8 });
    // 4) Center Corridor Back Landing (lx ∈ [CORR_MIN_X, CORR_MAX_X], lz ∈ [-hd, STAIR_END_Z])
    box(exteriorStatic, [CORR_MAX_X - CORR_MIN_X, slabH, STAIR_END_Z - (-hd)], [0, slabY, (-hd + STAIR_END_Z) * 0.5], m.pillarTile || shared.stairConcrete, { uvScale: 1.8 });
    // 5) Center Right Walkway beside Stairwell (lx ∈ [STAIR_MAX_X, CORR_MAX_X], lz ∈ [STAIR_END_Z, STAIR_START_Z])
    box(exteriorStatic, [CORR_MAX_X - STAIR_MAX_X, slabH, STAIR_START_Z - STAIR_END_Z], [(STAIR_MAX_X + CORR_MAX_X) * 0.5, slabY, (STAIR_END_Z + STAIR_START_Z) * 0.5], m.pillarTile || shared.stairConcrete, { uvScale: 1.8 });
    // Crisp Pearl-White Cornice Trim Band
    box(exteriorStatic, [W + 0.34, 0.24, D + 0.34], [0, y - 0.08, 0], shared.whiteBand);
  }

  function addOpenableThaiWindow({ floorIdx, lx, ly, lz, w, h, label }) {
    const halfW = w * 0.5;
    box(exteriorStatic, [w + 0.10, 0.06, 0.22], [lx, ly + h * 0.5, lz], shared.thaiFrame);
    box(exteriorStatic, [w + 0.10, 0.06, 0.22], [lx, ly - h * 0.5, lz], shared.thaiFrame);
    box(exteriorStatic, [0.06, h, 0.22], [lx - halfW, ly, lz], shared.thaiFrame);
    box(exteriorStatic, [0.06, h, 0.22], [lx + halfW, ly, lz], shared.thaiFrame);
    box(exteriorStatic, [halfW - 0.03, h - 0.08, 0.03], [lx - halfW * 0.5, ly, lz - 0.03], shared.thaiGlass, { castShadow: false });
    for (let gx = -halfW + 0.30; gx <= halfW - 0.25; gx += 0.38) {
      box(exteriorStatic, [0.028, h - 0.08, 0.028], [lx + gx, ly, lz + 0.11], shared.whiteBand);
    }
    box(exteriorStatic, [w - 0.06, 0.035, 0.028], [lx, ly, lz + 0.11], shared.whiteBand);
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

  // ==========================================================================
  // 1) ELEVATED LEVEL 0: HUGE DRIVE-IN GARAGE + TALL SHINY GREEN & STEEL GATE
  // ==========================================================================
  addFloorSlab(FLOOR_Y[0], true);
  const gfWallTop = FLOOR_Y[0] + gfH; // 4.95
  const doorTopY = FLOOR_Y[0] + ENT_DOOR_H; // 4.25

  // Exterior Ground Floor Walls (Soft Off-White)
  box(exteriorStatic, [0.26, gfWallTop, D], [-hw + 0.13, gfWallTop * 0.5, 0], softWhiteWall);
  box(exteriorStatic, [0.26, gfWallTop, D], [hw - 0.13, gfWallTop * 0.5, 0], softWhiteWall);
  box(exteriorStatic, [W, gfWallTop, 0.26], [0, gfWallTop * 0.5, -hd + 0.13], softWhiteWall);
  box(exteriorStatic, [ENT_MIN_X - (-hw), gfWallTop, 0.28], [(-hw + ENT_MIN_X) * 0.5, gfWallTop * 0.5, hd - 0.14], softWhiteWall);
  box(exteriorStatic, [hw - ENT_MAX_X, gfWallTop, 0.28], [(ENT_MAX_X + hw) * 0.5, gfWallTop * 0.5, hd - 0.14], softWhiteWall);
  box(exteriorStatic, [ENT_MAX_X - ENT_MIN_X + 0.04, Math.max(0.28, gfWallTop - doorTopY), 0.28], [ENT_CX, doorTopY + Math.max(0.28, gfWallTop - doorTopY) * 0.5, hd - 0.14], softWhiteWall);

  // Colorful Glazed Mosaic Tiles cladding both Front Wings of Ground Floor
  const wingW = ENT_MIN_X - (-hw) - 0.30;
  box(exteriorStatic, [wingW, 3.25, 0.07], [-hw + 0.14 + wingW * 0.5, gfBaseY + 1.62, hd + 0.02], shared.colorfulTile, { uvScale: 2.0 });
  box(exteriorStatic, [wingW, 3.25, 0.07], [ENT_MAX_X + 0.28 + wingW * 0.5, gfBaseY + 1.62, hd + 0.02], shared.colorfulTile, { uvScale: 2.0 });

  // Two Tall Colorful-Tiled Gate Pillars + Stainless Bands + Glowing Globe Lamps
  for (const px of [ENT_MIN_X - 0.26, ENT_MAX_X + 0.26]) {
    box(exteriorStatic, [0.54, doorTopY + 0.26, 0.56], [px, (doorTopY + 0.26) * 0.5, hd + 0.14], shared.colorfulTile, { uvScale: 1.4 });
    box(exteriorStatic, [0.58, 0.09, 0.60], [px, gfBaseY + ENT_DOOR_H * 0.5, hd + 0.14], shinyStainlessSteel);
    box(exteriorStatic, [0.64, 0.14, 0.64], [px, doorTopY + 0.32, hd + 0.14], shared.whiteBand);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), shared.liftLed);
    globe.position.set(px, doorTopY + 0.54, hd + 0.14);
    dynamicG.add(globe);
  }

  // Grand Overhead Canopy + Warm LED Bar + Real PointLight so Green & Steel Gate SPARKLES Day & Night!
  box(exteriorStatic, [ENT_MAX_X - ENT_MIN_X + 1.25, 0.28, 0.78], [ENT_CX, doorTopY + 0.14, hd + 0.18], shared.whiteBand);
  box(exteriorStatic, [ENT_MAX_X - ENT_MIN_X + 1.28, 0.08, 0.80], [ENT_CX, doorTopY + 0.30, hd + 0.18], shinyStainlessSteel);
  box(dynamicG, [2.70, 0.05, 0.22], [ENT_CX, doorTopY - 0.02, hd + 0.28], shared.liftLed, { castShadow: false });
  const gateGlowLight = new THREE.PointLight(0xfff4d6, 2.8, 16.0, 1.35);
  gateGlowLight.position.set(ENT_CX, doorTopY - 0.16, hd + 1.15);
  dynamicG.add(gateGlowLight);

  // Glowing Emerald & Steel Nameplate Signboard above Gate
  const signTex = makeNameplateTexture(nameBn, 'হিল-ক্লাইম্ব গ্যারেজ · ২ বড় ফ্ল্যাট ও ছাদ বাগান [E]');
  const signMat = new THREE.MeshStandardMaterial({
    map: signTex,
    emissive: 0xffffff,
    emissiveMap: signTex,
    emissiveIntensity: 0.38,
    roughness: 0.28,
  });
  const signMesh = new THREE.Mesh(new THREE.BoxGeometry(3.95, 0.74, 0.09), signMat);
  signMesh.position.set(ENT_CX, doorTopY + 0.64, hd + 0.16);
  dynamicG.add(signMesh);

  // TALL & WIDE SHINY EMERALD GREEN + MIRROR STAINLESS STEEL DOUBLE GARAGE GATE (3.80m × 3.40m!)
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

  // Level 0 Open Drive-In Car & Bike Parking Garage Interior
  {
    const garG = new THREE.Group();
    garG.name = 'UserHome_ParkingGarage_GF';
    const fy = FLOOR_Y[0];
    const ceilY = fy + gfH - 0.16;
    for (const lxLine of [-6.0, -2.6, 2.6, 6.0]) {
      box(garG, [0.09, 0.016, 7.6], [lxLine, fy + 0.01, -0.8], shared.whiteBand);
    }
    for (const lxLed of [-5.2, 0.0, 5.2]) {
      box(garG, [1.85, 0.05, 0.16], [lxLed, ceilY, 2.4], shared.liftLed, { castShadow: false });
      box(garG, [1.85, 0.05, 0.16], [lxLed, ceilY, -2.8], shared.liftLed, { castShadow: false });
    }
    box(garG, [W - 0.6, 1.45, 0.06], [0, fy + 0.72, -hd + 0.30], shared.colorfulTile, { uvScale: 2.2 });
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
      // Shiny Stainless Steel Handrail on right (+X) side of central staircase
      rodBetween(exteriorStatic, [STAIR_MAX_X - 0.05, y0 + 0.94, STAIR_START_Z], [STAIR_MAX_X - 0.05, y1 + 0.94, STAIR_END_Z], 0.026, shinyStainlessSteel, 6);
      for (let p = 0; p <= 5; p++) {
        const f = p / 5;
        const pz = THREE.MathUtils.lerp(STAIR_START_Z, STAIR_END_Z, f);
        const py = THREE.MathUtils.lerp(y0, y1, f);
        cylinder(exteriorStatic, 0.018, 0.018, 0.94, [STAIR_MAX_X - 0.05, py + 0.47, pz], shinyStainlessSteel, 6);
      }
    }
  }

  // Helper: Build one complete furnished & interactive Wing Flat (side = -1 for Flat A, +1 for Flat B)
  function buildWingFlat(intG, k, fy, h, side, ceilY) {
    const isLeft = side < 0;
    const minX = isLeft ? (-hw + 0.26) : (CORR_MAX_X + 0.10);
    const maxX = isLeft ? (CORR_MIN_X - 0.10) : (hw - 0.26);
    const midX = (minX + maxX) * 0.5;
    const minZ = -hd + 0.26;
    const maxZ = hd - 0.26;
    const tag = isLeft ? `ফ্ল্যাট ${k + 1}A` : `ফ্ল্যাট ${k + 1}B`;

    // Room divider walls inside each flat (Front Living Room lz > 0.60, Back Master Bed + Kitchen/Dining + Bath)
    const divZ = 0.60;
    const bathZ = -3.10;
    const bedDivX = isLeft ? (minX + 3.25) : (maxX - 3.25);

    // Living/Bedroom divider along lz = divZ (leaving 1.45m doorway!)
    if (isLeft) {
      box(exteriorStatic, [bedDivX - minX - 0.15, h, 0.14], [(minX + bedDivX - 0.15) * 0.5, fy + h * 0.5, divZ], m.roomWall);
    } else {
      box(exteriorStatic, [maxX - (bedDivX + 0.15), h, 0.14], [(bedDivX + 0.15 + maxX) * 0.5, fy + h * 0.5, divZ], m.roomWall);
    }
    // Bedroom / Kitchen-Bath vertical divider at lx = bedDivX (lz ∈ [minZ, divZ])
    box(exteriorStatic, [0.14, h, divZ - minZ], [bedDivX, fy + h * 0.5, (minZ + divZ) * 0.5], m.roomWall);

    // 1) LIVING & DRAWING ROOM (Front: lz ∈ [divZ, maxZ])
    const livCz = (divZ + maxZ) * 0.5;
    box(intG, [3.6, 0.025, 3.0], [midX, fy + 0.02, livCz], m.rugMat);
    const sofaX = isLeft ? (minX + 0.58) : (maxX - 0.58);
    box(intG, [0.85, 0.42, 2.85], [sofaX, fy + 0.21, livCz], m.sofaFabric);
    box(intG, [0.18, 0.56, 2.85], [sofaX + (isLeft ? -0.34 : 0.34), fy + 0.60, livCz], m.sofaFabric);
    box(intG, [0.95, 0.06, 1.45], [midX, fy + 0.44, livCz], m.wood);
    for (const [tx, tz] of [[-0.38, -0.58], [0.38, -0.58], [-0.38, 0.58], [0.38, 0.58]]) {
      box(intG, [0.06, 0.42, 0.06], [midX + tx, fy + 0.21, livCz + tz], m.wood);
    }
    // Interactive 65" Smart TV against Corridor Wall
    const tvWallX = isLeft ? (maxX - 0.06) : (minX + 0.06);
    const tvLz = 1.45;
    box(intG, [0.42, 0.48, 1.85], [tvWallX + (isLeft ? -0.22 : 0.22), fy + 0.24, tvLz], m.wood);
    box(intG, [0.07, 1.00, 1.68], [tvWallX, fy + 1.40, tvLz], m.darkMetal);
    const tvScr = new THREE.Mesh(new THREE.PlaneGeometry(1.58, 0.90), tvOnMat);
    tvScr.rotation.y = isLeft ? (-Math.PI / 2) : (Math.PI / 2);
    tvScr.position.set(tvWallX + (isLeft ? -0.05 : 0.05), fy + 1.40, tvLz);
    dynamicG.add(tvScr);
    interactiveProps.push({
      kind: 'tv', floorIdx: k,
      lx: tvWallX + (isLeft ? -0.5 : 0.5), ly: fy, lz: tvLz,
      on: true, mesh: tvScr, label: `${tag} স্মার্ট টিভি`,
    });
    box(intG, [0.58, 0.04, 0.58], [midX, ceilY, livCz], m.lamp, { castShadow: false });

    // 2) MASTER BEDROOM (Outer Back Corner: King Bed + Interactive Openable Wooden Almirah!)
    const bedMinX = isLeft ? minX : bedDivX;
    const bedMaxX = isLeft ? bedDivX : maxX;
    const bedCx = (bedMinX + bedMaxX) * 0.5;
    const bedBodyZ = minZ + 1.25;
    box(intG, [2.10, 0.30, 2.05], [bedCx, fy + 0.15, bedBodyZ], m.wood);
    box(intG, [2.18, 1.00, 0.14], [bedCx, fy + 0.50, minZ + 0.14], m.wood);
    box(intG, [2.00, 0.20, 1.92], [bedCx, fy + 0.40, bedBodyZ], m.mattressMat);
    box(intG, [2.02, 0.21, 1.25], [bedCx, fy + 0.41, bedBodyZ + 0.34], m.blanketMat);
    box(intG, [0.62, 0.12, 0.36], [bedCx - 0.48, fy + 0.54, minZ + 0.46], shared.whiteBand);
    box(intG, [0.62, 0.12, 0.36], [bedCx + 0.48, fy + 0.54, minZ + 0.46], shared.whiteBand);

    // Interactive Wooden Almirah (আলমারি) with Openable Double Doors & Clothes Inside!
    const almX = isLeft ? (minX + 0.36) : (maxX - 0.36);
    const almZ = -1.65;
    const almSign = isLeft ? 1 : -1;
    box(intG, [0.60, 2.15, 1.56], [almX, fy + 1.075, almZ], m.wood);
    for (const sy of [0.55, 1.10, 1.60]) {
      box(intG, [0.52, 0.04, 1.44], [almX, fy + sy, almZ], m.roomWall);
    }
    box(intG, [0.36, 0.15, 0.42], [almX + almSign * 0.05, fy + 0.65, almZ - 0.32], clothRed);
    box(intG, [0.36, 0.15, 0.42], [almX + almSign * 0.05, fy + 1.20, almZ + 0.28], clothBlue);
    box(intG, [0.36, 0.15, 0.42], [almX + almSign * 0.05, fy + 1.70, almZ - 0.18], clothGold);
    const almDoorL = new THREE.Group();
    almDoorL.position.set(almX + almSign * 0.31, fy + 0.04, almZ - 0.76);
    {
      const dg = new THREE.Group();
      box(dg, [0.05, 2.04, 0.75], [0, 1.02, 0.375], m.wood);
      box(dg, [0.03, 1.38, 0.44], [almSign * 0.03, 1.10, 0.38], m.mirrorMat || shared.thaiGlass);
      mergeStaticMeshes(dg);
      almDoorL.add(dg);
      dynamicG.add(almDoorL);
    }
    const almDoorR = new THREE.Group();
    almDoorR.position.set(almX + almSign * 0.31, fy + 0.04, almZ + 0.76);
    {
      const dg = new THREE.Group();
      box(dg, [0.05, 2.04, 0.75], [0, 1.02, -0.375], m.wood);
      mergeStaticMeshes(dg);
      almDoorR.add(dg);
      dynamicG.add(almDoorR);
    }
    interactiveProps.push({
      kind: 'almirah', floorIdx: k,
      lx: almX + almSign * 0.65, ly: fy, lz: almZ,
      open: false, angle: 0, doorL: almDoorL, doorR: almDoorR, dir: almSign,
      label: `${tag} আলমারি`,
    });
    box(intG, [0.54, 0.04, 0.54], [bedCx, ceilY, -2.5], m.lamp, { castShadow: false });

    // 3) DINING, MODERN KITCHEN & INTERACTIVE FRIDGE (Inner Back Strip)
    const kitMinX = isLeft ? bedDivX : minX;
    const kitMaxX = isLeft ? maxX : bedDivX;
    const kitCx = (kitMinX + kitMaxX) * 0.5;
    const kitWallX = isLeft ? (maxX - 0.34) : (minX + 0.34);
    const kitSign = isLeft ? -1 : 1;
    // Kitchen Counter + Stove
    box(intG, [0.62, 0.84, 1.85], [kitWallX, fy + 0.42, -1.25], m.pillarTile);
    box(intG, [0.66, 0.06, 1.90], [kitWallX, fy + 0.86, -1.25], m.blackTile);
    cylinder(intG, 0.08, 0.08, 0.025, [kitWallX, fy + 0.92, -1.45], m.stoveFlame, 8);
    cylinder(intG, 0.08, 0.08, 0.025, [kitWallX, fy + 0.92, -1.05], m.stoveFlame, 8);

    // Interactive Openable Double-Door Refrigerator (ফ্রিজ)
    const frZ = bathZ + 0.58;
    box(intG, [0.68, 1.90, 0.80], [kitWallX, fy + 0.95, frZ], fridgeBodyMat);
    box(intG, [0.06, 1.62, 0.66], [kitWallX + kitSign * 0.33, fy + 0.95, frZ], fridgeInnerLight, { castShadow: false });
    cylinder(intG, 0.05, 0.05, 0.24, [kitWallX + kitSign * 0.16, fy + 1.12, frZ - 0.14], clothBlue, 8);
    cylinder(intG, 0.05, 0.05, 0.22, [kitWallX + kitSign * 0.16, fy + 1.11, frZ + 0.04], clothRed, 8);
    const frDoor = new THREE.Group();
    frDoor.position.set(kitWallX + kitSign * 0.35, fy + 0.04, frZ - 0.39);
    {
      const dg = new THREE.Group();
      box(dg, [0.06, 1.82, 0.78], [0, 0.91, 0.39], fridgeBodyMat);
      box(dg, [0.04, 0.52, 0.04], [kitSign * 0.05, 1.18, 0.68], shinyStainlessSteel);
      mergeStaticMeshes(dg);
      frDoor.add(dg);
      dynamicG.add(frDoor);
    }
    interactiveProps.push({
      kind: 'fridge', floorIdx: k,
      lx: kitWallX + kitSign * 0.72, ly: fy, lz: frZ,
      open: false, angle: 0, door: frDoor, dir: kitSign,
      label: `${tag} ফ্রিজ`,
    });

    // 4) ATTACHED BATHROOM (Inner Rear Corner: lz ∈ [minZ, bathZ])
    const bathCz = (minZ + bathZ) * 0.5;
    box(intG, [kitMaxX - kitMinX - 0.18, 0.03, bathZ - minZ - 0.18], [kitCx, fy + 0.02, bathCz], m.bathTile);
    const comX = kitCx;
    const comZ = minZ + 0.58;
    cylinder(intG, 0.18, 0.14, 0.36, [comX, fy + 0.19, comZ], m.porcelain, 10);
    cylinder(intG, 0.22, 0.18, 0.08, [comX, fy + 0.40, comZ], m.porcelain, 10);
    box(intG, [0.40, 0.40, 0.18], [comX, fy + 0.64, minZ + 0.24], m.porcelain);
    box(intG, [0.42, 0.04, 0.42], [kitCx, ceilY, bathCz], m.lamp, { castShadow: false });

    // Spinning Ceiling Fan in Living Room
    const fg = new THREE.Group();
    fg.position.set(midX, ceilY + 0.02, livCz);
    dynamicG.add(fg);
    cylinder(fg, 0.018, 0.018, 0.26, [0, -0.13, 0], shared.whiteBand, 6);
    const rotor = new THREE.Group();
    rotor.position.set(0, -0.26, 0);
    fg.add(rotor);
    cylinder(rotor, 0.11, 0.11, 0.045, [0, 0, 0], shared.whiteBand, 8);
    for (let b = 0; b < 3; b++) {
      const a = (b / 3) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.012, 0.09), shared.whiteBand);
      blade.position.set(Math.cos(a) * 0.29, 0, Math.sin(a) * 0.29);
      blade.rotation.y = -a;
      rotor.add(blade);
    }
    animatedFans.push({ rotor, floorIdx: k });

    // Sittable Furniture (World Coordinates)
    const sofaW = localToWorld(sofaX + (isLeft ? 0.10 : -0.10), livCz);
    const bedW = localToWorld(bedCx, bedBodyZ + 0.15);
    const comW = localToWorld(comX, comZ + 0.08);
    return [
      { seatX: sofaW.x, seatZ: sofaW.z, seatY: 0.46, yaw: rotY + (isLeft ? Math.PI / 2 : -Math.PI / 2), fy, label: `${tag} সোফা` },
      { seatX: bedW.x, seatZ: bedW.z, seatY: 0.54, yaw: rotY, fy, label: `${tag} মাস্টার বেড` },
      { seatX: comW.x, seatZ: comW.z, seatY: 0.46, yaw: rotY, fy, label: `${tag} কমোড` },
    ];
  }

  // ==========================================================================
  // 3) FLOORS 2, 3, 4 & 5: 2 BIG ENCLOSED FLATS + 3 MAIN DOORS BESIDE STAIRS!
  // ==========================================================================
  for (let k = 1; k < floors; k++) {
    const fy = FLOOR_Y[k];
    const h = flH;
    addFloorSlab(fy, false);

    // Exterior Soft Off-White Walls (Left, Right, Back)
    box(exteriorStatic, [0.24, h, D], [-hw + 0.12, fy + h * 0.5, 0], softWhiteWall);
    box(exteriorStatic, [0.24, h, D], [hw - 0.12, fy + h * 0.5, 0], softWhiteWall);
    box(exteriorStatic, [W, h, 0.24], [0, fy + h * 0.5, -hd + 0.12], softWhiteWall);

    // Front (+Z) Exterior Wall with Twin Wide Living Room Thai Windows (Flat A & Flat B)
    const winA = -4.95;
    const winB = 4.95;
    const winW = 2.80;
    box(exteriorStatic, [W, 0.85, 0.24], [0, fy + 0.425, hd - 0.12], softWhiteWall);
    box(exteriorStatic, [W, h - 2.40, 0.24], [0, fy + 2.40 + (h - 2.40) * 0.5, hd - 0.12], softWhiteWall);
    box(exteriorStatic, [(winA - winW * 0.5) - (-hw), 1.55, 0.24], [(-hw + winA - winW * 0.5) * 0.5, fy + 1.625, hd - 0.12], softWhiteWall);
    box(exteriorStatic, [(winB - winW * 0.5) - (winA + winW * 0.5), 1.55, 0.24], [0, fy + 1.625, hd - 0.12], softWhiteWall);
    box(exteriorStatic, [hw - (winB + winW * 0.5), 1.55, 0.24], [(winB + winW * 0.5 + hw) * 0.5, fy + 1.625, hd - 0.12], softWhiteWall);

    addOpenableThaiWindow({ floorIdx: k, lx: winA, ly: fy + 1.625, lz: hd - 0.12, w: winW, h: 1.55, label: `ফ্ল্যাট ${k + 1}A থাই জানালা` });
    addOpenableThaiWindow({ floorIdx: k, lx: winB, ly: fy + 1.625, lz: hd - 0.12, w: winW, h: 1.55, label: `ফ্ল্যাট ${k + 1}B থাই জানালা` });

    // Colorful Glazed Mosaic Tile Vertical Feature Piers + Center Stair Glass Accent
    for (const px of [-hw + 0.55, -1.85, 1.85, hw - 0.55]) {
      box(exteriorStatic, [0.95, h, 0.08], [px, fy + h * 0.5, hd + 0.02], shared.colorfulTile, { uvScale: 1.4 });
    }
    box(exteriorStatic, [2.2, h - 0.2, 0.10], [0, fy + h * 0.5, hd + 0.03], shared.cobaltGlass);
    box(dynamicG, [0.18, 0.34, 0.10], [-hw + 0.55, fy + 2.0, hd + 0.08], shared.liftLed, { castShadow: false });
    box(dynamicG, [0.18, 0.34, 0.10], [hw - 0.55, fy + 2.0, hd + 0.08], shared.liftLed, { castShadow: false });

    // Twin Wide Luxury Front Balconies (Flat A & Flat B) with Colorful Mosaic Tile Aprons + Stainless Steel Railings
    for (const bx of [winA, winB]) {
      const balW = 4.90;
      box(exteriorStatic, [balW, 0.16, 1.05], [bx, fy + 0.04, hd + 0.50], shared.whiteBand);
      box(exteriorStatic, [balW, 0.48, 0.10], [bx, fy + 0.34, hd + 0.98], shared.colorfulTile, { uvScale: 1.5 });
      box(exteriorStatic, [balW, 0.48, 0.06], [bx, fy + 0.80, hd + 0.98], shared.thaiGlass, { castShadow: false });
      box(exteriorStatic, [balW + 0.08, 0.07, 0.10], [bx, fy + 1.06, hd + 0.98], shinyStainlessSteel);
      box(exteriorStatic, [0.10, 1.02, 1.05], [bx - balW * 0.5, fy + 0.56, hd + 0.50], shared.colorfulTile, { uvScale: 0.9 });
      box(exteriorStatic, [0.10, 1.02, 1.05], [bx + balW * 0.5, fy + 0.56, hd + 0.50], shared.colorfulTile, { uvScale: 0.9 });
    }

    // --- CENTRAL CORRIDOR WALLS DIVIDING FLAT A & FLAT B + 3 OPENABLE MAIN DOORS BESIDE STAIRS! ---
    // Left Corridor Wall (lx = CORR_MIN_X = -1.75) with Door 1 (D_FRONT_MIN_Z..D_FRONT_MAX_Z)
    box(exteriorStatic, [0.16, h, D_FRONT_MIN_Z - (-hd)], [CORR_MIN_X, fy + h * 0.5, (-hd + D_FRONT_MIN_Z) * 0.5], m.roomWall);
    box(exteriorStatic, [0.16, h, hd - D_FRONT_MAX_Z], [CORR_MIN_X, fy + h * 0.5, (D_FRONT_MAX_Z + hd) * 0.5], m.roomWall);
    box(exteriorStatic, [0.16, h - 2.26, D_FRONT_MAX_Z - D_FRONT_MIN_Z], [CORR_MIN_X, fy + 2.26 + (h - 2.26) * 0.5, D_FRONT_CZ], m.roomWall);

    // Right Corridor Wall (lx = CORR_MAX_X = +1.75) with Door 2 (Front) AND Door 3 (Rear)
    box(exteriorStatic, [0.16, h, D_REAR_MIN_Z - (-hd)], [CORR_MAX_X, fy + h * 0.5, (-hd + D_REAR_MIN_Z) * 0.5], m.roomWall);
    box(exteriorStatic, [0.16, h, D_FRONT_MIN_Z - D_REAR_MAX_Z], [CORR_MAX_X, fy + h * 0.5, (D_REAR_MAX_Z + D_FRONT_MIN_Z) * 0.5], m.roomWall);
    box(exteriorStatic, [0.16, h, hd - D_FRONT_MAX_Z], [CORR_MAX_X, fy + h * 0.5, (D_FRONT_MAX_Z + hd) * 0.5], m.roomWall);
    box(exteriorStatic, [0.16, h - 2.26, D_FRONT_MAX_Z - D_FRONT_MIN_Z], [CORR_MAX_X, fy + 2.26 + (h - 2.26) * 0.5, D_FRONT_CZ], m.roomWall);
    box(exteriorStatic, [0.16, h - 2.26, D_REAR_MAX_Z - D_REAR_MIN_Z], [CORR_MAX_X, fy + 2.26 + (h - 2.26) * 0.5, D_REAR_CZ], m.roomWall);

    const doorSpecs = [
      { lx: CORR_MIN_X, minZ: D_FRONT_MIN_Z, maxZ: D_FRONT_MAX_Z, cz: D_FRONT_CZ, openAngle: Math.PI * 0.54, label: `দরজা ১ · ফ্ল্যাট ${k + 1}A (বাম)` },
      { lx: CORR_MAX_X, minZ: D_FRONT_MIN_Z, maxZ: D_FRONT_MAX_Z, cz: D_FRONT_CZ, openAngle: -Math.PI * 0.54, label: `দরজা ২ · ফ্ল্যাট ${k + 1}B (ডান)` },
      { lx: CORR_MAX_X, minZ: D_REAR_MIN_Z, maxZ: D_REAR_MAX_Z, cz: D_REAR_CZ, openAngle: -Math.PI * 0.54, label: `দরজা ৩ · ফ্ল্যাট ${k + 1}B পেছনের দরজা` },
    ];
    for (const ds of doorSpecs) {
      const piv = new THREE.Group();
      piv.position.set(ds.lx, fy + 0.02, ds.minZ + 0.02);
      const dg = new THREE.Group();
      const dw = ds.maxZ - ds.minZ - 0.04;
      box(dg, [0.07, 2.22, dw], [0, 1.11, dw * 0.5], m.wood);
      box(dg, [0.12, 0.22, 0.05], [0, 1.04, dw - 0.14], shinyStainlessSteel);
      mergeStaticMeshes(dg);
      piv.add(dg);
      dynamicG.add(piv);
      flatDoors.push({
        floorIdx: k, pivot: piv, lx: ds.lx, ly: fy, lz: ds.cz,
        open: false, angle: 0, openAngle: ds.openAngle, label: ds.label,
        collider: { minX: ds.lx - 0.14, maxX: ds.lx + 0.14, minZ: ds.minZ, maxZ: ds.maxZ },
      });
    }

    // Build Both Big Furnished Flats (Flat A + Flat B)
    const intG = new THREE.Group();
    intG.name = `UserHome_Interior_F${k}`;
    const ceilY = fy + h - 0.16;
    const seatsA = buildWingFlat(intG, k, fy, h, -1, ceilY);
    const seatsB = buildWingFlat(intG, k, fy, h, 1, ceilY);
    // Corridor ceiling LEDs
    box(intG, [0.52, 0.04, 0.52], [0.65, ceilY, 3.6], m.lamp, { castShadow: false });
    box(intG, [0.52, 0.04, 0.52], [0.65, ceilY, -4.2], m.lamp, { castShadow: false });

    mergeStaticMeshes(intG);
    root.add(intG);
    floorInteriorGroups[k] = intG;
    floorSeats.set(k, [...seatsA, ...seatsB]);
  }

  // ==========================================================================
  // 4) ROOFTOP GARDEN (ফুল ও গাছের বাগান) + ENTERABLE FURNISHED ROOFTOP ROOM!
  // ==========================================================================
  addFloorSlab(roofY, false);
  box(exteriorStatic, [W, 1.08, 0.24], [0, roofY + 0.54, -hd + 0.12], shared.whiteBand);
  box(exteriorStatic, [W, 1.08, 0.24], [0, roofY + 0.54, hd - 0.12], shared.whiteBand);
  box(exteriorStatic, [0.24, 1.08, D], [-hw + 0.12, roofY + 0.54, 0], shared.whiteBand);
  box(exteriorStatic, [0.24, 1.08, D], [hw - 0.12, roofY + 0.54, 0], shared.whiteBand);
  box(exteriorStatic, [W + 0.08, 0.58, 0.08], [0, roofY + 0.56, hd + 0.04], shared.colorfulTile, { uvScale: 2.2 });
  box(exteriorStatic, [W + 0.16, 0.12, 0.30], [0, roofY + 1.10, hd - 0.08], shared.whiteBand);

  // Central Stairhead Mumty Room + Overhead Water Tank on top
  box(exteriorStatic, [3.70, 0.20, 6.4], [0, roofY + 2.95, -0.5], shared.whiteBand);
  box(exteriorStatic, [0.20, 2.90, 6.3], [-1.80, roofY + 1.45, -0.5], softWhiteWall);
  box(exteriorStatic, [0.20, 2.90, 6.3], [1.80, roofY + 1.45, -0.5], softWhiteWall);
  box(exteriorStatic, [3.70, 2.90, 0.20], [0, roofY + 1.45, -3.65], softWhiteWall);
  cylinder(exteriorStatic, 0.72, 0.74, 1.48, [0, roofY + 3.78, -1.8], shared.waterTank, 10);

  // WELL-CRAFTED ENTERABLE ROOFTOP ROOM (ছাদের রুম: lx ∈ [2.30, 7.60], lz ∈ [-6.00, -1.10])
  {
    const rH = 3.05;
    const rW = RROOM_MAX_X - RROOM_MIN_X;
    const rD = RROOM_MAX_Z - RROOM_MIN_Z;
    const rCx = (RROOM_MIN_X + RROOM_MAX_X) * 0.5;
    const rCz = (RROOM_MIN_Z + RROOM_MAX_Z) * 0.5;
    // Roof slab & walls with colorful mosaic corner trim + garden-view glass window
    box(exteriorStatic, [rW + 0.36, 0.20, rD + 0.36], [rCx, roofY + rH + 0.10, rCz], shared.whiteBand);
    box(exteriorStatic, [0.20, rH, rD], [RROOM_MIN_X, roofY + rH * 0.5, rCz], softWhiteWall);
    box(exteriorStatic, [0.20, rH, rD], [RROOM_MAX_X, roofY + rH * 0.5, rCz], softWhiteWall);
    box(exteriorStatic, [rW, rH, 0.20], [rCx, roofY + rH * 0.5, RROOM_MIN_Z], softWhiteWall);
    // Front (+Z) wall with Doorway (RROOM_DOOR_MIN_X..RROOM_DOOR_MAX_X) & Garden View Window
    box(exteriorStatic, [RROOM_DOOR_MIN_X - RROOM_MIN_X, rH, 0.20], [(RROOM_MIN_X + RROOM_DOOR_MIN_X) * 0.5, roofY + rH * 0.5, RROOM_MAX_Z], softWhiteWall);
    box(exteriorStatic, [RROOM_MAX_X - RROOM_DOOR_MAX_X, 0.90, 0.20], [(RROOM_DOOR_MAX_X + RROOM_MAX_X) * 0.5, roofY + 0.45, RROOM_MAX_Z], softWhiteWall);
    box(exteriorStatic, [RROOM_MAX_X - RROOM_DOOR_MAX_X, 0.70, 0.20], [(RROOM_DOOR_MAX_X + RROOM_MAX_X) * 0.5, roofY + 2.70, RROOM_MAX_Z], softWhiteWall);
    box(exteriorStatic, [RROOM_MAX_X - RROOM_DOOR_MAX_X - 0.4, 1.45, 0.06], [(RROOM_DOOR_MAX_X + RROOM_MAX_X) * 0.5, roofY + 1.62, RROOM_MAX_Z], shared.thaiGlass, { castShadow: false });
    box(exteriorStatic, [RROOM_DOOR_MAX_X - RROOM_DOOR_MIN_X, rH - 2.25, 0.20], [RROOM_DOOR_CX, roofY + 2.25 + (rH - 2.25) * 0.5, RROOM_MAX_Z], softWhiteWall);
    box(exteriorStatic, [rW + 0.10, 0.46, 0.08], [rCx, roofY + rH - 0.10, RROOM_MAX_Z + 0.12], shared.colorfulTile, { uvScale: 1.4 });

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

    // Furnished Rooftop Room Interior (Sofa-Bed, Study Desk, Rug, Ceiling Light & Fan)
    box(exteriorStatic, [3.2, 0.025, 2.6], [rCx, roofY + 0.02, rCz], m.rugMat);
    box(exteriorStatic, [2.10, 0.38, 1.55], [RROOM_MAX_X - 1.25, roofY + 0.19, RROOM_MIN_Z + 1.05], m.wood);
    box(exteriorStatic, [2.00, 0.18, 1.45], [RROOM_MAX_X - 1.25, roofY + 0.44, RROOM_MIN_Z + 1.05], m.mattressMat);
    box(exteriorStatic, [1.45, 0.06, 0.72], [RROOM_MIN_X + 1.05, roofY + 0.76, RROOM_MIN_Z + 0.65], m.wood);
    box(exteriorStatic, [0.56, 0.04, 0.56], [rCx, roofY + rH - 0.12, rCz], m.lamp, { castShadow: false });
  }

  // LUSH ROOFTOP FLOWER & FRUIT-TREE GARDEN (ছাদ বাগান — বিভিন্ন ফুল ও গাছ চাষ!)
  {
    const addFlowerBed = (bx, bz, bw, bd, flowerIdxOffset = 0) => {
      box(exteriorStatic, [bw, 0.42, bd], [bx, roofY + 0.21, bz], shared.colorfulTile, { uvScale: 1.0 });
      box(exteriorStatic, [bw - 0.14, 0.36, bd - 0.14], [bx, roofY + 0.24, bz], soilMat);
      const nx = Math.max(2, Math.floor(bw / 0.72));
      const nz = Math.max(1, Math.floor(bd / 0.72));
      for (let ix = 0; ix < nx; ix++) {
        for (let iz = 0; iz < nz; iz++) {
          const px = bx - (bw - 0.55) * 0.5 + (nx > 1 ? (ix / (nx - 1)) * (bw - 0.55) : 0);
          const pz = bz - (bd - 0.55) * 0.5 + (nz > 1 ? (iz / (nz - 1)) * (bd - 0.55) : 0);
          const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 1), (ix + iz) % 2 === 0 ? leafBright : leafDark);
          foliage.position.set(px, roofY + 0.54, pz);
          exteriorStatic.add(foliage);
          // Colorful blooming flower clusters on top of each plant!
          const fMat = flowerMats[(ix + iz + flowerIdxOffset) % flowerMats.length];
          for (const [fx, fyOff, fz] of [[0, 0.18, 0], [0.11, 0.12, 0.09], [-0.10, 0.13, -0.08]]) {
            const fl = new THREE.Mesh(new THREE.SphereGeometry(0.068, 6, 5), fMat);
            fl.position.set(px + fx, roofY + 0.54 + fyOff, pz + fz);
            exteriorStatic.add(fl);
          }
        }
      }
    };

    const addPottedFruitTree = (tx, tz, height = 2.1, flowerIdx = 0) => {
      cylinder(exteriorStatic, 0.30, 0.22, 0.48, [tx, roofY + 0.24, tz], potMat, 8);
      cylinder(exteriorStatic, 0.055, 0.075, height * 0.58, [tx, roofY + 0.45 + height * 0.29, tz], trunkMat, 6);
      const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(0.68, 1), leafDark);
      canopy.position.set(tx, roofY + 0.45 + height * 0.68, tz);
      exteriorStatic.add(canopy);
      const canopy2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.50, 1), leafBright);
      canopy2.position.set(tx + 0.28, roofY + 0.45 + height * 0.80, tz - 0.18);
      exteriorStatic.add(canopy2);
      // Colorful blossoms / fruits on the tree!
      const fMat = flowerMats[flowerIdx % flowerMats.length];
      for (const [ox, oy, oz] of [[0.42, 0.05, 0.25], [-0.38, 0.18, -0.22], [0.12, 0.35, -0.35], [-0.20, -0.10, 0.42]]) {
        const bl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), fMat);
        bl.position.set(tx + ox, roofY + 0.45 + height * 0.68 + oy, tz + oz);
        exteriorStatic.add(bl);
      }
    };

    // Raised Flower Farming Beds across Left Garden & Front Terrace!
    addFlowerBed(-5.1, 4.9, 4.8, 1.35, 0);
    addFlowerBed(4.9, 4.9, 4.8, 1.35, 2);
    addFlowerBed(-6.6, -0.8, 1.45, 7.2, 4);
    addFlowerBed(-4.1, -4.6, 3.2, 1.45, 1);

    // Potted Fruit & Ornamental Trees around the Rooftop Garden
    addPottedFruitTree(-7.2, 5.4, 2.35, 1);
    addPottedFruitTree(-2.4, 5.4, 1.95, 2);
    addPottedFruitTree(2.4, 5.4, 2.05, 0);
    addPottedFruitTree(7.2, 5.4, 2.40, 5);
    addPottedFruitTree(-7.2, -5.4, 2.25, 3);
    addPottedFruitTree(7.2, 1.2, 2.15, 4);

    // Decorative Wooden Garden Pergola Arch + Hanging Vines + Sittable Garden Bench
    for (const [px, pz] of [[-5.6, 1.6], [-2.8, 1.6], [-5.6, -1.6], [-2.8, -1.6]]) {
      box(exteriorStatic, [0.12, 2.55, 0.12], [px, roofY + 1.275, pz], m.wood);
    }
    for (let rz = -1.6; rz <= 1.65; rz += 0.64) {
      box(exteriorStatic, [3.1, 0.08, 0.10], [-4.2, roofY + 2.55, rz], m.wood);
    }
    box(exteriorStatic, [2.1, 0.08, 0.56], [-4.2, roofY + 0.46, 0.0], m.wood);
    box(exteriorStatic, [2.1, 0.46, 0.08], [-4.2, roofY + 0.72, -0.25], m.wood);
  }

  const roofBenchW = localToWorld(-4.2, 0.06);
  const roofBedW = localToWorld(RROOM_MAX_X - 1.25, RROOM_MIN_Z + 1.15);
  floorSeats.set(floors, [
    { seatX: roofBenchW.x, seatZ: roofBenchW.z, seatY: 0.48, yaw: rotY, fy: roofY, label: 'ছাদ বাগানের বেঞ্চ' },
    { seatX: roofBedW.x, seatZ: roofBedW.z, seatY: 0.54, yaw: rotY, fy: roofY, label: 'ছাদের রুমের বিছানা' },
  ]);

  mergeStaticMeshes(exteriorStatic);

  // ==========================================================================
  // 5) RUNTIME API (HILL-CLIMB GARAGE, COLLISIONS, INTERACTIONS, 60 FPS CULLING)
  // ==========================================================================
  function isInFootprint(pos, pad = 0) {
    if (!pos) return false;
    const lp = worldToLocal(pos.x, pos.z);
    return lp.x >= -hw - pad && lp.x <= hw + pad && lp.z >= -hd - pad && lp.z <= hd + pad;
  }

  function nearestFloorIndex(footY) {
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
      // Hill-Climb Car/Bike Ramp (y = 0.0 -> 0.85m)
      if (footY < 2.0 && lpR.z >= hd && lpR.z <= hd + RAMP_LEN + 0.12 && lpR.x >= -1.95 && lpR.x <= 1.95) {
        const t = THREE.MathUtils.clamp((lpR.z - hd) / RAMP_LEN, 0, 1);
        return THREE.MathUtils.lerp(FLOOR_Y[0], 0.02, t);
      }
      // 6-Step Pedestrian Stairs beside Ramp
      if (footY < 2.0 && lpR.z >= hd && lpR.z <= hd + 2.38 && lpR.x >= 1.98 && lpR.x <= 3.85) {
        const t = THREE.MathUtils.clamp((lpR.z - hd) / 2.28, 0, 1);
        return THREE.MathUtils.lerp(FLOOR_Y[0], 0.02, t);
      }
    }
    if (!isInFootprint(pos, 0.25)) return null;
    const lp = worldToLocal(pos.x, pos.z);
    const footY = pos.y - 1.68;
    const maxStepUp = grounded ? 0.62 : (verticalVelocity > 0 ? 0.08 : 0.42);

    let bestY = FLOOR_Y[0];
    const inStairs = lp.x >= STAIR_MIN_X && lp.x <= STAIR_MAX_X && lp.z >= STAIR_END_Z && lp.z <= STAIR_START_Z;
    const inStairHole = lp.x >= STAIR_MIN_X + 0.06 && lp.x <= STAIR_MAX_X - 0.06 && lp.z > STAIR_END_Z + 0.16 && lp.z < STAIR_START_Z - 0.16;
    if (inStairs) {
      const t = THREE.MathUtils.clamp((STAIR_START_Z - lp.z) / (STAIR_START_Z - STAIR_END_Z), 0, 1);
      for (let k = 0; k < floors; k++) {
        const rampY = FLOOR_Y[k] + t * (FLOOR_Y[k + 1] - FLOOR_Y[k]);
        if (rampY <= footY + maxStepUp) bestY = Math.max(bestY, rampY);
      }
    }
    for (let k = 0; k <= floors; k++) {
      const fy = FLOOR_Y[k];
      if (fy > footY + maxStepUp) continue;
      if (k >= 1 && inStairHole) continue;
      bestY = Math.max(bestY, fy);
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
          // Left corridor wall (Door 1)
          resolveCircleAABB(lp, radius, CORR_MIN_X - 0.10, CORR_MIN_X + 0.10, -hd, D_FRONT_MIN_Z);
          resolveCircleAABB(lp, radius, CORR_MIN_X - 0.10, CORR_MIN_X + 0.10, D_FRONT_MAX_Z, hd);
          // Right corridor wall (Door 2 & Door 3)
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
    } else {
      // Rooftop Parapet & Rooftop Room Walls
      if (footY - roofY < 0.72) {
        resolveCircleAABB(lp, radius, -hw, -hw + 0.26, -hd, hd);
        resolveCircleAABB(lp, radius, hw - 0.26, hw, -hd, hd);
        resolveCircleAABB(lp, radius, -hw, hw, -hd, -hd + 0.26);
        resolveCircleAABB(lp, radius, -hw, hw, hd - 0.26, hd);
      }
      resolveCircleAABB(lp, radius, RROOM_MIN_X - 0.10, RROOM_MIN_X + 0.10, RROOM_MIN_Z, RROOM_MAX_Z);
      resolveCircleAABB(lp, radius, RROOM_MAX_X - 0.10, RROOM_MAX_X + 0.10, RROOM_MIN_Z, RROOM_MAX_Z);
      resolveCircleAABB(lp, radius, RROOM_MIN_X, RROOM_MAX_X, RROOM_MIN_Z - 0.10, RROOM_MIN_Z + 0.10);
      resolveCircleAABB(lp, radius, RROOM_MIN_X, RROOM_DOOR_MIN_X, RROOM_MAX_Z - 0.10, RROOM_MAX_Z + 0.10);
      resolveCircleAABB(lp, radius, RROOM_DOOR_MAX_X, RROOM_MAX_X, RROOM_MAX_Z - 0.10, RROOM_MAX_Z + 0.10);
      const rDoor = flatDoors.find((d) => d.floorIdx === floors);
      if (rDoor && !rDoor.open) {
        resolveCircleAABB(lp, radius, rDoor.collider.minX, rDoor.collider.maxX, rDoor.collider.minZ, rDoor.collider.maxZ);
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

    // Protect central staircase column while leaving wide left & right parking bays open!
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
    if (footY >= roofY - 0.6) {
      if (lp.x >= RROOM_MIN_X && lp.x <= RROOM_MAX_X && lp.z >= RROOM_MIN_Z && lp.z <= RROOM_MAX_Z) {
        return `${zonePrefix} · ROOFTOP PENTHOUSE ROOM`;
      }
      return `${zonePrefix} · ROOFTOP FLOWER & FRUIT GARDEN`;
    }
    const fl = nearestFloorIndex(footY);
    if (fl === 0) return `${zonePrefix} · ELEVATED CAR & BIKE GARAGE`;
    const flTag = ` (FLOOR ${fl + 1})`;
    if (lp.x >= CORR_MIN_X && lp.x <= CORR_MAX_X) return `${zonePrefix}${flTag} · CENTRAL STAIR HALL (3 DOORS)`;
    return lp.x < CORR_MIN_X
      ? `${zonePrefix}${flTag} · FLAT ${fl + 1}A (NORTH BIG FLAT)`
      : `${zonePrefix}${flTag} · FLAT ${fl + 1}B (SOUTH BIG FLAT)`;
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
    const nearInt = distSq < 52 * 52;
    const pFootY = playerPos ? (playerPos.y - 1.68) : 0;
    const curFl = nearestFloorIndex(pFootY);
    if (gateGlowLight) gateGlowLight.visible = !isLow && distSq < 58 * 58;
    for (let k = 0; k < floors; k++) {
      const grp = floorInteriorGroups[k];
      if (!grp) continue;
      const want = nearInt && (k === 0 || Math.abs(curFl - k) <= 1 || distSq < 24 * 24);
      if (grp.visible !== want) grp.visible = want;
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
