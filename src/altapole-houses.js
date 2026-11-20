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

function makeWallSignTexture({ title, subtitle = '', bg = '#f1f5f9', fg = '#1e3a8a', accent = '#b91c1c', border = '#3b82f6' }) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 176;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 176);
  ctx.strokeStyle = border;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 160);
  ctx.fillStyle = accent;
  ctx.fillRect(18, 18, 10, 140);
  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 34px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText(title, 42, subtitle ? 66 : 88, 444);
  if (subtitle) {
    ctx.fillStyle = accent;
    ctx.font = '600 20px "Manrope", "Noto Sans Bengali", sans-serif';
    ctx.fillText(subtitle, 42, 126, 444);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeShutterTexture(tint = '#15803d') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 10) {
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(0, y, 256, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, y + 6, 256, 4);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeBlackboardTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#143326';
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = '#7c4a26';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, 498, 242);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = 'bold 28px "Noto Sans Bengali", sans-serif';
  ctx.fillText('কামিয়াব টিচিং হোম · ১৫, আলতাপোল লেন', 32, 54);
  ctx.font = '22px monospace';
  ctx.fillStyle = '#fde68a';
  ctx.fillText('(a + b)² = a² + 2ab + b²', 38, 112);
  ctx.fillStyle = '#bae6fd';
  ctx.fillText('F = m × a   |   E = mc²', 38, 160);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '20px "Noto Sans Bengali", sans-serif';
  ctx.fillText('আজকের পাঠ: পদার্থবিজ্ঞান ও উচ্চতর গণিত', 38, 210);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function addWallSign(parent, opts, pos, rotY, w, h, frameMat) {
  const tex = makeWallSignTexture(opts);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: 0.28,
    roughness: 0.34,
    side: THREE.DoubleSide,
  });
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);
  g.rotation.y = rotY;
  g.add(new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, h + 0.06, 0.08), frameMat));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.10), mat));
  parent.add(g);
}

function createSpinningFan(parent, pos, m, animatedFans) {
  const fg = new THREE.Group();
  fg.position.set(pos[0], pos[1], pos[2]);
  parent.add(fg);
  cylinder(fg, 0.02, 0.02, 0.30, [0, -0.15, 0], m.whiteBand, 8);
  const rotor = new THREE.Group();
  rotor.position.set(0, -0.30, 0);
  fg.add(rotor);
  cylinder(rotor, 0.13, 0.13, 0.06, [0, 0, 0], m.whiteBand, 12);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.012, 0.11), m.whiteBand);
    blade.position.set(Math.cos(a) * 0.34, 0, Math.sin(a) * 0.34);
    blade.rotation.y = -a;
    rotor.add(blade);
  }
  animatedFans.push(rotor);
}

function buildHingedPanelDoor(m, pos, width, height, panelMat, axis = 'Z') {
  const pivot = new THREE.Group();
  pivot.position.set(pos[0], pos[1], pos[2]);
  const g = new THREE.Group();
  pivot.add(g);
  if (axis === 'Z') {
    box(g, [0.075, height, width], [0, height * 0.5, width * 0.5], panelMat);
    box(g, [0.12, 0.22, 0.05], [0, 1.04, width - 0.14], m.chrome);
  } else {
    box(g, [width, height, 0.075], [width * 0.5, height * 0.5, 0], panelMat);
    box(g, [0.05, 0.22, 0.12], [width - 0.14, 1.04, 0], m.chrome);
  }
  mergeStaticMeshes(g);
  return pivot;
}

function buildHingedGate(m, pos, width, height, barMat, frameMat) {
  const pivot = new THREE.Group();
  pivot.position.set(pos[0], pos[1], pos[2]);
  const g = new THREE.Group();
  pivot.add(g);
  // Perimeter frame
  box(g, [0.08, height, 0.06], [0, height * 0.5, 0.03], frameMat);
  box(g, [0.08, height, 0.06], [0, height * 0.5, width - 0.03], frameMat);
  box(g, [0.08, 0.07, width], [0, height - 0.04, width * 0.5], frameMat);
  box(g, [0.08, 0.07, width], [0, 0.14, width * 0.5], frameMat);
  box(g, [0.05, height * 0.44, width - 0.08], [0, height * 0.26, width * 0.5], barMat);
  const bars = Math.max(4, Math.floor(width / 0.22));
  for (let i = 1; i < bars; i++) {
    const bz = (i / bars) * width;
    box(g, [0.04, height - 0.16, 0.03], [0, height * 0.5, bz], frameMat);
  }
  mergeStaticMeshes(g);
  return pivot;
}

function addSmartTV(parent, m, x, y, z, faceDir = 1) {
  box(parent, [0.40, 0.44, 1.65], [x + faceDir * 0.20, y + 0.24, z], m.wood);
  box(parent, [0.43, 0.04, 1.70], [x + faceDir * 0.20, y + 0.48, z], m.blackTile);
  box(parent, [0.06, 0.90, 1.48], [x + faceDir * 0.05, y + 1.38, z], m.darkMetal);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.40, 0.80), m.tvScreen);
  screen.geometry.rotateY(faceDir * (Math.PI / 2));
  screen.position.set(x + faceDir * 0.09, y + 1.38, z);
  parent.add(screen);
}

function addAttachedBathroomFurniture(parent, m, minX, maxX, minZ, maxZ, fy = 0.06) {
  const cx = (minX + maxX) * 0.5;
  const cz = (minZ + maxZ) * 0.5;
  const w = maxX - minX;
  const d = maxZ - minZ;
  // Aqua ceramic floor & dado tile
  box(parent, [w - 0.08, 0.03, d - 0.08], [cx, fy + 0.02, cz], m.bathTile);
  box(parent, [0.03, 1.35, d - 0.12], [minX + 0.06, fy + 0.70, cz], m.bathTile);
  // Western Porcelain Commode
  const commodeZ = minZ + 0.72;
  cylinder(parent, 0.18, 0.14, 0.36, [minX + 0.48, fy + 0.20, commodeZ], m.porcelain, 12);
  cylinder(parent, 0.22, 0.19, 0.08, [minX + 0.50, fy + 0.40, commodeZ], m.porcelain, 12);
  box(parent, [0.18, 0.40, 0.40], [minX + 0.26, fy + 0.64, commodeZ], m.porcelain);
  // Wash Basin + Framed Mirror
  const basinZ = maxZ - 0.85;
  cylinder(parent, 0.10, 0.12, 0.66, [minX + 0.36, fy + 0.34, basinZ], m.porcelain, 10);
  box(parent, [0.40, 0.13, 0.48], [minX + 0.40, fy + 0.74, basinZ], m.porcelain);
  box(parent, [0.03, 0.72, 0.52], [minX + 0.10, fy + 1.42, basinZ], m.chrome);
  box(parent, [0.04, 0.66, 0.46], [minX + 0.12, fy + 1.42, basinZ], m.mirrorMat);
  // Overhead Chrome Shower + Blue Bucket & Mug
  rodBetween(parent, [maxX - 0.25, fy + 0.90, maxZ - 0.55], [maxX - 0.25, fy + 2.15, maxZ - 0.55], 0.015, m.chrome, 8);
  rodBetween(parent, [maxX - 0.25, fy + 2.15, maxZ - 0.55], [maxX - 0.52, fy + 2.08, maxZ - 0.55], 0.015, m.chrome, 8);
  cylinder(parent, 0.10, 0.08, 0.03, [maxX - 0.52, fy + 2.05, maxZ - 0.55], m.chrome, 10);
  cylinder(parent, 0.17, 0.13, 0.35, [maxX - 0.55, fy + 0.20, maxZ - 0.95], m.bucketMat, 10);
  cylinder(parent, 0.06, 0.05, 0.12, [maxX - 0.78, fy + 0.09, maxZ - 0.86], m.bucketMat, 8);
  // Ceiling Dome Light
  box(parent, [0.34, 0.04, 0.34], [cx, fy + 2.94, cz], m.lamp);
}

/**
 * Builds 4 realistic, fully enterable & furnished houses/shops along Altapole Lane
 * matching the user's real Google Street View photos:
 *  1) ইস্পাহানি বিক্রয় কেন্দ্র (29 Upper Jessore Rd, north mouth of Altapole Lane)
 *  2) ১৫, আলতাপোল লেন — কামিয়াব টিচিং হোম (Heritage 2-story coaching house)
 *  3) ২৪, আলতাপোল লেন — পরশমনি কলা কেন্দ্র (Iconic sky-blue 2-story cultural & family house)
 *  4) ১, আলতাপোল লেন — ক্লাসিক সাদা বাড়ি (2-story colonial veranda residence)
 */
export function buildAltapoleEnterableHouses(parent, m, helpers = {}) {
  const root = new THREE.Group();
  root.name = 'AltapoleEnterableHouses';
  parent.add(root);

  const exteriorStatic = new THREE.Group();
  root.add(exteriorStatic);

  const dynamicG = new THREE.Group();
  root.add(dynamicG);

  const treesG = new THREE.Group();
  root.add(treesG);

  const animatedFans = [];
  const interactiveDoors = [];
  const interiorGroups = [];
  const staticColliders = []; // { minX, maxX, minZ, maxZ, maxY }

  const addSolidWall = (parentG, minX, maxX, minZ, maxZ, minY, maxY, mat, opts = {}) => {
    const sx = maxX - minX;
    const sy = maxY - minY;
    const sz = maxZ - minZ;
    box(parentG, [sx, sy, sz], [(minX + maxX) * 0.5, (minY + maxY) * 0.5, (minZ + maxZ) * 0.5], mat, opts);
    staticColliders.push({ minX, maxX, minZ, maxZ, maxY });
  };

  // Shared custom authentic Altapole Lane materials
  const skyBlueWall = new THREE.MeshStandardMaterial({ color: 0x4b87c8, roughness: 0.72 });
  const royalBlueDoor = new THREE.MeshStandardMaterial({ color: 0x2554a6, roughness: 0.62 });
  const tealMeshGate = new THREE.MeshStandardMaterial({ color: 0x2a7b6f, roughness: 0.55, metalness: 0.50 });
  const ispGreenShutter = new THREE.MeshStandardMaterial({ map: makeShutterTexture('#15803d'), roughness: 0.42, metalness: 0.52 });
  const ispRedTrim = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.65 });
  const ispYellowBand = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.38 });
  const tinRustMat = new THREE.MeshStandardMaterial({ map: makeShutterTexture('#7a4834'), roughness: 0.70, metalness: 0.35 });
  const blackboardMat = new THREE.MeshStandardMaterial({ map: makeBlackboardTexture(), roughness: 0.78 });
  const teaGreenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.45 });
  const teaRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 });
  const teaGoldMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.40 });
  const harmoniumMat = new THREE.MeshStandardMaterial({ color: 0x5c341d, roughness: 0.58 });
  const juteMat = new THREE.MeshStandardMaterial({ color: 0x9c8259, roughness: 0.94 });

  // ============================================================================
  // 1) ইস্পাহানি বিক্রয় কেন্দ্র (29 Upper Jessore Rd, North Entrance East Side)
  // Footprint: x = 167.9..178.5, z = -515.8..-507.2, front faces North (-Z)
  // ============================================================================
  {
    const x0 = 167.9;
    const x1 = 178.5;
    const z0 = -515.8;
    const z1 = -507.2;
    const cx = (x0 + x1) * 0.5;
    const cz = (z0 + z1) * 0.5;
    const h = 4.1;

    // Floor & ceiling slab
    box(exteriorStatic, [x1 - x0, 0.14, z1 - z0], [cx, 0.05, cz], m.pillarTile, { uvScale: 1.8 });
    box(exteriorStatic, [x1 - x0 + 0.3, 0.24, z1 - z0 + 0.3], [cx, h, cz], m.creamTrim || m.plaster);
    box(exteriorStatic, [x1 - x0 - 0.3, 0.08, z1 - z0 - 0.3], [cx, 3.65, cz], m.ceilingMat);

    // Solid West, East & South perimeter walls
    addSolidWall(exteriorStatic, x0, x0 + 0.24, z0, z1, 0, h, m.plaster);
    addSolidWall(exteriorStatic, x1 - 0.24, x1, z0, z1, 0, h, m.plaster);
    addSolidWall(exteriorStatic, x0, x1, z1 - 0.24, z1, 0, h, m.plaster);

    // North Front Wall with 3 shutter bays — Left & Right shutters closed, Center bay (x = 171.8..174.6) is OPENABLE!
    addSolidWall(exteriorStatic, x0, 171.8, z0, z0 + 0.22, 0, h, m.plaster);
    addSolidWall(exteriorStatic, 174.6, x1, z0, z0 + 0.22, 0, h, m.plaster);
    box(exteriorStatic, [2.85, 1.18, 0.24], [173.2, 3.52, z0 + 0.11], m.plaster);
    // Left & Right green corrugated shutters
    box(exteriorStatic, [2.75, 2.75, 0.12], [169.9, 1.48, z0 - 0.02], ispGreenShutter);
    box(exteriorStatic, [2.75, 2.75, 0.12], [176.3, 1.48, z0 - 0.02], ispGreenShutter);
    // Red/White corner pillar
    box(exteriorStatic, [0.52, 1.05, 0.52], [x0 + 0.16, 0.52, z0 + 0.16], ispRedTrim);
    box(exteriorStatic, [0.52, 2.45, 0.52], [x0 + 0.16, 2.25, z0 + 0.16], m.whiteBand);
    // Yellow fascia & red trim + Signboards
    box(exteriorStatic, [11.2, 1.15, 0.30], [cx, 3.85, z0 - 0.10], ispYellowBand);
    box(exteriorStatic, [11.2, 0.14, 0.34], [cx, 3.24, z0 - 0.10], ispRedTrim);
    addWallSign(dynamicG, {
      title: 'ইস্পাহানি বিক্রয় কেন্দ্র · খুলনা',
      subtitle: 'ISPAHANI SALES CENTER · 29 UPPER JESSORE RD',
      bg: '#facc15', fg: '#14532d', accent: '#b91c1c', border: '#15803d',
    }, [cx - 0.4, 3.88, z0 - 0.28], Math.PI, 8.8, 1.08, m.darkMetal);
    addWallSign(dynamicG, {
      title: 'ইস্পাহানি বিক্রয় কেন্দ্র',
      subtitle: 'ISPAHANI · ALTAPOLE LN',
      bg: '#facc15', fg: '#14532d', accent: '#b91c1c', border: '#15803d',
    }, [x0 - 0.14, 3.85, cz], -Math.PI / 2, 5.4, 0.96, m.darkMetal);

    // Center Roll-up Green Shutter (opens upward smoothly with [E]!)
    const shutterMesh = new THREE.Mesh(new THREE.BoxGeometry(2.76, 2.84, 0.12), ispGreenShutter);
    shutterMesh.position.set(173.2, 1.48, z0 - 0.02);
    dynamicG.add(shutterMesh);
    interactiveDoors.push({
      kind: 'shutter',
      label: 'ইস্পাহানি বিক্রয় কেন্দ্রের শাটার',
      mesh: shutterMesh,
      closedY: 1.48,
      openY: 3.12,
      x: 173.2,
      z: z0,
      open: true, // Start open so user can immediately see & walk right inside!
      progress: 1,
      collider: { minX: 171.8, maxX: 174.6, minZ: z0 - 0.15, maxZ: z0 + 0.28, maxY: 2.9 },
    });

    // Furnished Ispahani Tea Shop Interior
    const ispInt = new THREE.Group();
    ispInt.name = 'AltapoleInterior_Ispahani';
    // Glowing ceiling LED tubes
    box(ispInt, [3.2, 0.05, 0.26], [cx, 3.58, cz - 1.4], m.lamp);
    box(ispInt, [3.2, 0.05, 0.26], [cx, 3.58, cz + 1.6], m.lamp);
    createSpinningFan(dynamicG, [cx, 3.58, cz], m, animatedFans);

    // Wooden Sales Counter along back-center
    box(ispInt, [4.6, 0.96, 0.72], [cx, 0.54, z1 - 2.35], m.wood);
    box(ispInt, [4.7, 0.05, 0.78], [cx, 1.04, z1 - 2.35], m.blackTile);
    // Cash monitor on counter
    box(ispInt, [0.42, 0.34, 0.08], [cx + 1.2, 1.24, z1 - 2.35], m.darkMetal);
    // Tall Tea Display Shelves along West, East & South walls stocked with Ispahani Tea Boxes!
    const teaMats = [teaGreenMat, teaRedMat, teaGoldMat];
    for (let sx = x0 + 1.0; sx <= x1 - 1.0; sx += 2.2) {
      box(ispInt, [1.85, 2.45, 0.48], [sx, 1.30, z1 - 0.55], m.wood);
      for (let sy = 0.55; sy <= 2.15; sy += 0.52) {
        for (let k = -2; k <= 2; k++) {
          box(ispInt, [0.26, 0.30, 0.28], [sx + k * 0.33, sy, z1 - 0.52], teaMats[Math.abs(Math.round(sx + k)) % 3]);
        }
      }
    }
    for (let sz = z0 + 1.6; sz <= z1 - 1.8; sz += 2.0) {
      box(ispInt, [0.48, 2.30, 1.65], [x1 - 0.55, 1.22, sz], m.wood);
      for (let sy = 0.55; sy <= 1.95; sy += 0.55) {
        for (let k = -1; k <= 1; k++) {
          box(ispInt, [0.28, 0.30, 0.36], [x1 - 0.58, sy, sz + k * 0.45], teaMats[Math.abs(Math.round(sz + k)) % 3]);
        }
      }
    }
    // Stacked Jute Tea Sacks in West corner
    for (let i = 0; i < 3; i++) {
      box(ispInt, [0.82, 0.38, 0.58], [x0 + 0.95, 0.26 + i * 0.36, z0 + 2.2], juteMat);
      box(ispInt, [0.82, 0.38, 0.58], [x0 + 0.95, 0.26 + i * 0.36, z0 + 3.0], juteMat);
    }
    mergeStaticMeshes(ispInt);
    root.add(ispInt);
    interiorGroups.push({ group: ispInt, cx, cz, maxDistSq: 48 * 48 });

    helpers.addBroadleafTree?.(treesG, x1 - 3.8, 0, -504.2, 1.32, 9051);
    helpers.addBroadleafTree?.(treesG, x0 + 2.7, 0, -505.5, 1.20, 9059);
  }

  // ============================================================================
  // 2) ১৫, আলতাপোল লেন — কামিয়াব টিচিং হোম (Enterable 2-Story Heritage Coaching House)
  // West side at z = -442, rx ≈ 167.2. House x = 154.0..162.4, z = -448.5..-435.5
  // ============================================================================
  {
    const x0 = 154.0;
    const x1 = 162.4;
    const z0 = -448.5;
    const z1 = -435.5;
    const cx = (x0 + x1) * 0.5;
    const cz = (z0 + z1) * 0.5; // -442.0
    const wx = 164.25;
    const gfH = 3.2;
    const totalH = 6.4;

    // Courtyard paved floor + House ground floor ceramic tiles + 2nd floor slab + ceiling
    box(exteriorStatic, [2.1, 0.10, z1 - z0], [163.3, 0.04, cz], m.courtyard, { uvScale: 2.0 });
    box(exteriorStatic, [x1 - x0, 0.14, z1 - z0], [cx, 0.05, cz], m.pillarTile, { uvScale: 1.6 });
    box(exteriorStatic, [x1 - x0 - 0.3, 0.08, z1 - z0 - 0.3], [cx, 3.06, cz], m.ceilingMat);

    // Boundary Wall with Openable Gate (gate gap at z = -439.6 .. -437.0)
    addSolidWall(exteriorStatic, wx - 0.14, wx + 0.14, z0, -439.6, 0, 1.98, m.wall);
    addSolidWall(exteriorStatic, wx - 0.14, wx + 0.14, -437.0, z1, 0, 1.98, m.wall);
    box(exteriorStatic, [0.44, 2.30, 0.44], [wx, 1.15, -439.6], m.darkConcrete);
    box(exteriorStatic, [0.44, 2.30, 0.44], [wx, 1.15, -437.0], m.darkConcrete);
    addWallSign(dynamicG, {
      title: 'কামিয়াব টিচিং হোম · ১৫, আলতাপোল লেন',
      subtitle: 'খুলনা · সকল শ্রেণির কোচিং ও পড়ানো হয়',
      bg: '#d6d3c9', fg: '#1e3a5f', accent: '#7c2d12', border: '#57534e',
    }, [wx + 0.18, 1.18, -444.0], Math.PI / 2, 4.6, 1.12, m.darkMetal);

    const kGate = buildHingedGate(m, [wx, 0.05, -439.55], 2.48, 1.88, royalBlueDoor, m.darkMetal);
    dynamicG.add(kGate);
    interactiveDoors.push({
      kind: 'door',
      label: 'কামিয়াব টিচিং হোমের মেইন গেট',
      pivot: kGate,
      x: wx,
      z: -438.3,
      open: false,
      angle: 0,
      openAngle: -Math.PI * 0.52,
      collider: { minX: wx - 0.20, maxX: wx + 0.20, minZ: -439.6, maxZ: -437.0, maxY: 2.0 },
    });

    // Ground-Floor Hollow Exterior Walls (Doorway on East front x1 at z = -442.7..-441.3)
    addSolidWall(exteriorStatic, x0, x0 + 0.22, z0, z1, 0, gfH, m.warmPlaster);
    addSolidWall(exteriorStatic, x0, x1, z0, z0 + 0.22, 0, gfH, m.warmPlaster);
    addSolidWall(exteriorStatic, x0, x1, z1 - 0.22, z1, 0, gfH, m.warmPlaster);
    addSolidWall(exteriorStatic, x1 - 0.22, x1, z0, -442.7, 0, gfH, m.warmPlaster);
    addSolidWall(exteriorStatic, x1 - 0.22, x1, -441.3, z1, 0, gfH, m.warmPlaster);
    box(exteriorStatic, [0.22, 0.88, 1.44], [x1 - 0.11, 2.76, -442.0], m.warmPlaster);

    // Royal-Blue Front Entrance Door + Decorative Side Shutters
    const kFrontDoor = buildHingedPanelDoor(m, [x1 - 0.10, 0.08, -442.68], 1.34, 2.28, royalBlueDoor, 'Z');
    dynamicG.add(kFrontDoor);
    interactiveDoors.push({
      kind: 'door',
      label: 'কামিয়াব টিচিং হোমের দরজা',
      pivot: kFrontDoor,
      x: x1,
      z: -442.0,
      open: false,
      angle: 0,
      openAngle: -Math.PI * 0.54,
      collider: { minX: x1 - 0.24, maxX: x1 + 0.16, minZ: -442.7, maxZ: -441.3, maxY: 2.4 },
    });
    for (const wz of [-445.5, -438.5]) {
      box(exteriorStatic, [0.12, 1.45, 1.35], [x1 + 0.04, 1.62, wz], m.glass);
      box(exteriorStatic, [0.16, 1.45, 0.08], [x1 + 0.06, 1.62, wz - 0.68], royalBlueDoor);
      box(exteriorStatic, [0.16, 1.45, 0.08], [x1 + 0.06, 1.62, wz + 0.68], royalBlueDoor);
    }

    // 2nd Floor Upper Story + Rounded White Balcony
    box(exteriorStatic, [x1 - x0, totalH - gfH, z1 - z0], [cx, gfH + (totalH - gfH) * 0.5, cz], m.plaster, { uvScale: 2.4 });
    box(exteriorStatic, [1.85, 0.18, z1 - z0 - 0.4], [x1 + 0.85, 3.30, cz], m.whiteBand);
    box(exteriorStatic, [0.18, 1.02, z1 - z0 - 1.2], [x1 + 1.68, 3.88, cz], m.whiteBand);
    box(exteriorStatic, [x1 - x0 + 0.3, 0.24, z1 - z0 + 0.3], [cx, totalH + 0.05, cz], m.darkConcrete);
    for (const wz of [-445.5, -442.0, -438.5]) {
      box(exteriorStatic, [0.12, 1.50, 1.30], [x1 + 0.04, 4.85, wz], m.glass);
    }

    // Interior Room Divider Wall (x = 158.0, open doorway at z = -442.7..-441.3)
    addSolidWall(exteriorStatic, 157.92, 158.08, z0 + 0.22, -442.7, 0, gfH, m.roomWall);
    addSolidWall(exteriorStatic, 157.92, 158.08, -441.3, z1 - 0.22, 0, gfH, m.roomWall);
    box(exteriorStatic, [0.16, 0.86, 1.44], [158.0, 2.75, -442.0], m.roomWall);

    // Furnished Coaching Classroom + Inner Teacher Office
    const kInt = new THREE.Group();
    kInt.name = 'AltapoleInterior_Kamyab';
    // Front Classroom (x = 158.1..162.1)
    box(kInt, [2.6, 1.28, 0.08], [160.1, 1.68, z0 + 0.28], blackboardMat);
    // Teacher desk & chair
    box(kInt, [1.35, 0.76, 0.68], [160.1, 0.46, z0 + 1.55], m.wood);
    box(kInt, [0.46, 0.46, 0.46], [160.1, 0.31, z0 + 0.92], m.wood);
    // 4 Rows of Student Wooden Benches & Desks
    for (let r = 0; r < 4; r++) {
      const rz = z0 + 3.2 + r * 2.15;
      box(kInt, [2.85, 0.74, 0.48], [160.1, 0.45, rz], m.wood);
      box(kInt, [2.85, 0.44, 0.34], [160.1, 0.30, rz + 0.56], m.wood);
    }
    // Ceiling LEDs & Fans
    box(kInt, [0.58, 0.04, 0.58], [160.1, 2.99, cz - 2.6], m.lamp);
    box(kInt, [0.58, 0.04, 0.58], [160.1, 2.99, cz + 2.6], m.lamp);
    createSpinningFan(dynamicG, [160.1, 2.98, cz], m, animatedFans);

    // Inner Principal Office & Study (x = 154.2..157.9)
    box(kInt, [1.65, 0.78, 0.82], [155.8, 0.47, cz - 2.2], m.wood);
    box(kInt, [0.52, 0.50, 0.52], [155.8, 0.33, cz - 3.1], m.sofaFabric);
    box(kInt, [0.48, 2.10, 1.85], [154.5, 1.12, cz + 2.8], m.wood); // Bookshelf/Almirah
    box(kInt, [1.95, 0.42, 0.76], [156.2, 0.29, z1 - 0.82], m.sofaFabric); // Visitor Sofa
    box(kInt, [0.55, 0.04, 0.55], [156.0, 2.99, cz], m.lamp);
    createSpinningFan(dynamicG, [156.0, 2.98, cz], m, animatedFans);

    mergeStaticMeshes(kInt);
    root.add(kInt);
    interiorGroups.push({ group: kInt, cx, cz, maxDistSq: 42 * 42 });
    helpers.addPalm?.(dynamicG, 163.4, 0, -440.2, 8.4, 0.12, 0.25);
  }

  // ============================================================================
  // 3) ২৪, আলতাপোল লেন — পরশমনি কলা কেন্দ্র (Enterable Iconic Sky-Blue 2-Story House)
  // West side at z = -418, rx ≈ 169.1. House x = 156.6..164.8, z = -424.9..-411.1
  // ============================================================================
  {
    const x0 = 156.6;
    const x1 = 164.8;
    const z0 = -424.9;
    const z1 = -411.1;
    const cx = (x0 + x1) * 0.5;
    const cz = (z0 + z1) * 0.5; // -418.0
    const wx = 166.25;
    const gfH = 3.2;
    const totalH = 6.6;

    // Courtyard & Veranda + Ground Ceramic Tiles + Ceiling
    box(exteriorStatic, [1.8, 0.10, z1 - z0], [165.4, 0.04, cz], m.courtyard, { uvScale: 2.0 });
    box(exteriorStatic, [x1 - x0, 0.14, z1 - z0], [cx, 0.05, cz], m.pillarTile, { uvScale: 1.6 });
    box(exteriorStatic, [x1 - x0 - 0.3, 0.08, z1 - z0 - 0.3], [cx, 3.06, cz], m.ceilingMat);

    // Front Boundary Wall + Iconic Sky-Blue Gate Pillar + Openable White/Blue Iron Gate (z = -415.7..-412.6)
    addSolidWall(exteriorStatic, wx - 0.14, wx + 0.14, z0, -415.7, 0, 2.02, m.wall);
    addSolidWall(exteriorStatic, wx - 0.14, wx + 0.14, -412.6, z1, 0, 2.02, m.wall);
    box(exteriorStatic, [0.46, 2.28, 0.46], [wx, 1.14, -415.7], skyBlueWall);
    box(exteriorStatic, [0.46, 2.28, 0.46], [wx, 1.14, -412.6], skyBlueWall);
    addWallSign(dynamicG, {
      title: 'পরশমনি কলা কেন্দ্র · ২৪, আলতাপোল লেন',
      subtitle: 'সংগীত · আবৃত্তি · অভিনয় · খুলনা',
      bg: '#f1f5f9', fg: '#1e3a8a', accent: '#b91c1c', border: '#3b82f6',
    }, [wx + 0.18, 1.22, -420.2], Math.PI / 2, 4.8, 1.15, m.darkMetal);

    const pGate = buildHingedGate(m, [wx, 0.05, -415.65], 2.98, 1.90, m.whiteBand, skyBlueWall);
    dynamicG.add(pGate);
    interactiveDoors.push({
      kind: 'door',
      label: 'পরশমনি কলা কেন্দ্রের মেইন গেট',
      pivot: pGate,
      x: wx,
      z: -414.15,
      open: false,
      angle: 0,
      openAngle: -Math.PI * 0.52,
      collider: { minX: wx - 0.20, maxX: wx + 0.20, minZ: -415.7, maxZ: -412.6, maxY: 2.0 },
    });

    // Ground-Floor Hollow Sky-Blue Walls (Doorway on East front x1 at z = -418.7..-417.3)
    addSolidWall(exteriorStatic, x0, x0 + 0.22, z0, z1, 0, gfH, skyBlueWall);
    addSolidWall(exteriorStatic, x0, x1, z0, z0 + 0.22, 0, gfH, skyBlueWall);
    addSolidWall(exteriorStatic, x0, x1, z1 - 0.22, z1, 0, gfH, skyBlueWall);
    addSolidWall(exteriorStatic, x1 - 0.22, x1, z0, -418.7, 0, gfH, skyBlueWall);
    addSolidWall(exteriorStatic, x1 - 0.22, x1, -417.3, z1, 0, gfH, skyBlueWall);
    box(exteriorStatic, [0.22, 0.88, 1.44], [x1 - 0.11, 2.76, -418.0], skyBlueWall);

    // Sloping Tin Veranda Awning
    const awning = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.08, z1 - z0 - 0.4), tinRustMat);
    awning.position.set(x1 + 0.85, 2.86, cz);
    awning.rotation.z = -0.22;
    exteriorStatic.add(awning);

    // Openable Wooden Front Door
    const pFrontDoor = buildHingedPanelDoor(m, [x1 - 0.10, 0.08, -418.68], 1.34, 2.28, m.wood, 'Z');
    dynamicG.add(pFrontDoor);
    interactiveDoors.push({
      kind: 'door',
      label: 'পরশমনি কলা কেন্দ্রের মূল দরজা',
      pivot: pFrontDoor,
      x: x1,
      z: -418.0,
      open: false,
      angle: 0,
      openAngle: -Math.PI * 0.54,
      collider: { minX: x1 - 0.24, maxX: x1 + 0.16, minZ: -418.7, maxZ: -417.3, maxY: 2.4 },
    });

    // 2nd Floor Sky-Blue Upper Story + White Cornice Bands & Windows
    box(exteriorStatic, [x1 - x0, totalH - gfH, z1 - z0], [cx, gfH + (totalH - gfH) * 0.5, cz], skyBlueWall, { uvScale: 2.5 });
    box(exteriorStatic, [x1 - x0 + 0.35, 0.24, z1 - z0 + 0.35], [cx, 3.35, cz], m.whiteBand);
    box(exteriorStatic, [x1 - x0 + 0.35, 0.24, z1 - z0 + 0.35], [cx, totalH + 0.05, cz], m.whiteBand);
    for (const dz of [-4.2, -1.4, 1.4, 4.2]) {
      box(exteriorStatic, [0.14, 1.45, 1.32], [x1 + 0.04, 4.95, cz + dz], m.glass);
      box(exteriorStatic, [0.22, 0.12, 1.50], [x1 + 0.08, 5.72, cz + dz], m.whiteBand);
    }

    // Interior Partitions (X divider at 160.3 with doorways at z=-419.5 & z=-414.0; Z divider at -416.6 with doorway at x=162.4)
    addSolidWall(exteriorStatic, 160.22, 160.38, z0 + 0.22, -420.2, 0, gfH, m.roomWall);
    addSolidWall(exteriorStatic, 160.22, 160.38, -418.8, -414.7, 0, gfH, m.roomWall);
    addSolidWall(exteriorStatic, 160.22, 160.38, -413.3, z1 - 0.22, 0, gfH, m.roomWall);
    addSolidWall(exteriorStatic, x0 + 0.22, 160.22, -416.68, -416.52, 0, gfH, m.roomWall);
    addSolidWall(exteriorStatic, 160.38, 161.6, -416.68, -416.52, 0, gfH, m.roomWall);
    addSolidWall(exteriorStatic, 163.2, x1 - 0.22, -416.68, -416.52, 0, gfH, m.roomWall);

    // Furnished Parashmoni Cultural Hall + Bedroom + Dining + Attached Bathroom
    const pInt = new THREE.Group();
    pInt.name = 'AltapoleInterior_Parashmoni';
    // 1) Front Cultural Hall & Drawing Room (x = 160.4..164.6, z = -424.6..-416.7)
    box(pInt, [2.4, 0.02, 2.8], [162.5, 0.13, -420.8], m.rugMat);
    // Low cultural practice stage with Harmonium & Tabla
    box(pInt, [2.1, 0.22, 1.6], [162.5, 0.20, -423.5], m.wood);
    box(pInt, [0.68, 0.26, 0.38], [162.2, 0.44, -423.4], harmoniumMat); // Harmonium
    box(pInt, [0.56, 0.04, 0.14], [162.2, 0.58, -423.28], m.whiteBand); // Harmonium keys
    cylinder(pInt, 0.14, 0.11, 0.26, [163.0, 0.44, -423.3], harmoniumMat, 10); // Tabla Bayan
    cylinder(pInt, 0.10, 0.08, 0.24, [163.3, 0.43, -423.4], m.whiteBand, 10); // Tabla Dayan
    // Sofa + Smart TV
    box(pInt, [0.76, 0.42, 2.05], [161.0, 0.30, -420.8], m.sofaFabric);
    box(pInt, [0.18, 0.52, 2.05], [160.68, 0.66, -420.8], m.sofaFabric);
    addSmartTV(pInt, m, 164.50, 0.08, -420.8, -1);
    box(pInt, [0.56, 0.04, 0.56], [162.5, 2.99, -420.8], m.lamp);
    createSpinningFan(dynamicG, [162.5, 2.98, -420.8], m, animatedFans);

    // 2) Master Bedroom (x = 156.8..160.2, z = -424.6..-416.7)
    box(pInt, [1.95, 0.30, 1.80], [158.4, 0.24, -422.6], m.wood);
    box(pInt, [1.85, 0.18, 1.70], [158.4, 0.46, -422.6], m.mattressMat);
    box(pInt, [1.87, 0.19, 1.00], [158.4, 0.47, -422.2], m.blanketMat);
    box(pInt, [0.54, 2.02, 1.25], [157.2, 1.10, -418.2], m.wood);
    box(pInt, [0.56, 1.46, 0.44], [157.2, 1.15, -418.2], m.mirrorMat);
    box(pInt, [0.54, 0.04, 0.54], [158.4, 2.99, -420.6], m.lamp);
    createSpinningFan(dynamicG, [158.4, 2.98, -420.6], m, animatedFans);

    // 3) Dining & Kitchen Corner (x = 160.4..164.6, z = -416.5..-411.3)
    box(pInt, [1.45, 0.06, 0.96], [162.5, 0.76, -414.2], m.wood);
    for (const [lx, lz] of [[161.85, -414.6], [163.15, -414.6], [161.85, -413.8], [163.15, -413.8]]) {
      box(pInt, [0.06, 0.68, 0.06], [lx, 0.40, lz], m.wood);
    }
    box(pInt, [2.30, 0.84, 0.60], [162.6, 0.48, z1 - 0.54], m.pillarTile);
    box(pInt, [2.36, 0.05, 0.64], [162.6, 0.92, z1 - 0.54], m.blackTile);
    box(pInt, [0.64, 1.72, 0.64], [160.9, 0.94, z1 - 0.64], m.aluminum);
    box(pInt, [0.52, 0.04, 0.52], [162.5, 2.99, -413.9], m.lamp);

    // 4) Attached Bathroom (x = 156.8..160.2, z = -416.5..-411.3)
    addAttachedBathroomFurniture(pInt, m, 156.8, 160.2, -416.5, -411.3, 0.08);

    mergeStaticMeshes(pInt);
    root.add(pInt);
    interiorGroups.push({ group: pInt, cx, cz, maxDistSq: 42 * 42 });
    helpers.addBroadleafTree?.(treesG, 165.0, 0, -416.8, 1.30, 9811);
  }

  // ============================================================================
  // 4) ১, আলতাপোল লেন — ক্লাসিক সাদা বাড়ি (Enterable 2-Story Colonial Veranda House)
  // West side at z = -384, rx ≈ 168.7. House x = 155.8..164.2, z = -390.7..-377.3
  // ============================================================================
  {
    const x0 = 155.8;
    const x1 = 164.2;
    const z0 = -390.7;
    const z1 = -377.3;
    const cx = (x0 + x1) * 0.5;
    const cz = (z0 + z1) * 0.5; // -384.0
    const wx = 165.85;
    const gfH = 3.2;
    const totalH = 6.4;

    box(exteriorStatic, [1.9, 0.10, z1 - z0], [165.0, 0.04, cz], m.courtyard, { uvScale: 2.0 });
    box(exteriorStatic, [x1 - x0, 0.14, z1 - z0], [cx, 0.05, cz], m.pillarTile, { uvScale: 1.6 });
    box(exteriorStatic, [x1 - x0 - 0.3, 0.08, z1 - z0 - 0.3], [cx, 3.06, cz], m.ceilingMat);

    // Front Boundary Wall + Openable Teal Iron Mesh Gate (z = -381.6..-378.9)
    addSolidWall(exteriorStatic, wx - 0.14, wx + 0.14, z0, -381.6, 0, 1.98, m.wall);
    addSolidWall(exteriorStatic, wx - 0.14, wx + 0.14, -378.9, z1, 0, 1.98, m.wall);
    box(exteriorStatic, [0.44, 2.25, 0.44], [wx, 1.12, -381.6], m.whiteBand);
    box(exteriorStatic, [0.44, 2.25, 0.44], [wx, 1.12, -378.9], m.whiteBand);

    const wGate = buildHingedGate(m, [wx, 0.05, -381.55], 2.58, 1.88, tealMeshGate, m.darkMetal);
    dynamicG.add(wGate);
    interactiveDoors.push({
      kind: 'door',
      label: '১ আলতাপোল লেন বাড়ির গেট',
      pivot: wGate,
      x: wx,
      z: -380.25,
      open: false,
      angle: 0,
      openAngle: -Math.PI * 0.52,
      collider: { minX: wx - 0.20, maxX: wx + 0.20, minZ: -381.6, maxZ: -378.9, maxY: 2.0 },
    });

    // Ground-Floor Hollow White Colonial Walls (Doorway on East front x1 at z = -384.7..-383.3)
    addSolidWall(exteriorStatic, x0, x0 + 0.22, z0, z1, 0, gfH, m.whiteBand);
    addSolidWall(exteriorStatic, x0, x1, z0, z0 + 0.22, 0, gfH, m.whiteBand);
    addSolidWall(exteriorStatic, x0, x1, z1 - 0.22, z1, 0, gfH, m.whiteBand);
    addSolidWall(exteriorStatic, x1 - 0.22, x1, z0, -384.7, 0, gfH, m.whiteBand);
    addSolidWall(exteriorStatic, x1 - 0.22, x1, -383.3, z1, 0, gfH, m.whiteBand);
    box(exteriorStatic, [0.22, 0.88, 1.44], [x1 - 0.11, 2.76, -384.0], m.whiteBand);

    const wFrontDoor = buildHingedPanelDoor(m, [x1 - 0.10, 0.08, -384.68], 1.34, 2.28, m.wood, 'Z');
    dynamicG.add(wFrontDoor);
    interactiveDoors.push({
      kind: 'door',
      label: '১ আলতাপোল লেন বাড়ির দরজা',
      pivot: wFrontDoor,
      x: x1,
      z: -384.0,
      open: false,
      angle: 0,
      openAngle: -Math.PI * 0.54,
      collider: { minX: x1 - 0.24, maxX: x1 + 0.16, minZ: -384.7, maxZ: -383.3, maxY: 2.4 },
    });

    // 2nd Floor White Colonial Story + Cornice + Windows
    box(exteriorStatic, [x1 - x0, totalH - gfH, z1 - z0], [cx, gfH + (totalH - gfH) * 0.5, cz], m.whiteBand, { uvScale: 2.4 });
    box(exteriorStatic, [x1 - x0 + 0.4, 0.22, z1 - z0 + 0.4], [cx + 0.15, 3.35, cz], m.trim);
    box(exteriorStatic, [x1 - x0 + 0.4, 0.22, z1 - z0 + 0.4], [cx + 0.15, totalH + 0.05, cz], m.trim);
    for (const dz of [-3.6, 0, 3.6]) {
      box(exteriorStatic, [0.14, 1.48, 1.50], [x1 + 0.04, 4.85, cz + dz], m.glass);
    }

    // Interior Partitions
    addSolidWall(exteriorStatic, 159.72, 159.88, z0 + 0.22, -386.6, 0, gfH, m.roomWall);
    addSolidWall(exteriorStatic, 159.72, 159.88, -385.2, -381.2, 0, gfH, m.roomWall);
    addSolidWall(exteriorStatic, 159.72, 159.88, -379.8, z1 - 0.22, 0, gfH, m.roomWall);
    addSolidWall(exteriorStatic, x0 + 0.22, 159.72, -383.18, -383.02, 0, gfH, m.roomWall);
    addSolidWall(exteriorStatic, 159.88, 161.2, -383.18, -383.02, 0, gfH, m.roomWall);
    addSolidWall(exteriorStatic, 162.8, x1 - 0.22, -383.18, -383.02, 0, gfH, m.roomWall);

    // Furnished Taltola-Style Residence Interior
    const wInt = new THREE.Group();
    wInt.name = 'AltapoleInterior_House1';
    // Living Room (x = 159.9..164.0, z = -390.4..-383.2)
    box(wInt, [2.1, 0.02, 2.2], [161.9, 0.13, -386.8], m.rugMat);
    box(wInt, [2.05, 0.40, 0.76], [161.9, 0.28, z0 + 0.74], m.sofaFabric);
    box(wInt, [2.05, 0.52, 0.18], [161.9, 0.66, z0 + 0.42], m.sofaFabric);
    box(wInt, [1.10, 0.05, 0.60], [161.9, 0.45, -386.8], m.wood);
    addSmartTV(wInt, m, 160.0, 0.08, -386.8, 1);
    box(wInt, [0.55, 0.04, 0.55], [161.9, 2.99, -386.8], m.lamp);
    createSpinningFan(dynamicG, [161.9, 2.98, -386.8], m, animatedFans);

    // Master Bedroom (x = 156.0..159.7, z = -390.4..-383.2)
    box(wInt, [1.95, 0.30, 1.80], [157.8, 0.24, -388.4], m.wood);
    box(wInt, [1.85, 0.18, 1.70], [157.8, 0.46, -388.4], m.mattressMat);
    box(wInt, [1.87, 0.19, 1.00], [157.8, 0.47, -388.0], m.blanketMat);
    box(wInt, [0.54, 2.02, 1.18], [156.4, 1.10, -384.6], m.wood);
    box(wInt, [0.56, 1.46, 0.44], [156.4, 1.15, -384.6], m.mirrorMat);
    box(wInt, [0.54, 0.04, 0.54], [157.8, 2.99, -386.6], m.lamp);
    createSpinningFan(dynamicG, [157.8, 2.98, -386.6], m, animatedFans);

    // Dining & Kitchen (x = 159.9..164.0, z = -383.0..-377.5)
    box(wInt, [1.48, 0.06, 0.98], [161.9, 0.76, -380.4], m.wood);
    box(wInt, [2.40, 0.84, 0.62], [162.0, 0.48, z1 - 0.55], m.pillarTile);
    box(wInt, [2.45, 0.05, 0.66], [162.0, 0.92, z1 - 0.55], m.blackTile);
    box(wInt, [0.68, 0.05, 0.42], [161.5, 0.97, z1 - 0.56], m.chrome);
    cylinder(wInt, 0.09, 0.09, 0.02, [161.34, 1.00, z1 - 0.56], m.stoveFlame, 10);
    cylinder(wInt, 0.09, 0.09, 0.02, [161.66, 1.00, z1 - 0.56], m.stoveFlame, 10);
    box(wInt, [0.66, 1.76, 0.66], [160.4, 0.95, z1 - 0.65], m.aluminum);
    box(wInt, [0.52, 0.04, 0.52], [161.9, 2.99, -380.2], m.lamp);

    // Attached Bathroom (x = 156.0..159.7, z = -383.0..-377.5)
    addAttachedBathroomFurniture(wInt, m, 156.0, 159.7, -383.0, -377.5, 0.08);

    mergeStaticMeshes(wInt);
    root.add(wInt);
    interiorGroups.push({ group: wInt, cx, cz, maxDistSq: 42 * 42 });
    helpers.addBroadleafTree?.(treesG, 164.9, 0, -387.5, 1.26, 9837);
    helpers.addBroadleafTree?.(treesG, 164.5, 0, -379.2, 1.16, 9841);
  }

  mergeStaticMeshes(exteriorStatic);
  helpers.finalizeTrees?.(treesG);

  function findNearestDoor(pos) {
    if (!pos || pos.x < 148 || pos.x > 186 || pos.z < -524 || pos.z > -370) return null;
    let best = null;
    let bestD = 3.2;
    for (const d of interactiveDoors) {
      const dist = Math.hypot(pos.x - d.x, pos.z - d.z);
      if (dist < bestD) {
        bestD = dist;
        best = d;
      }
    }
    return best;
  }

  return {
    group: root,
    getPrompt(pos) {
      const d = findNearestDoor(pos);
      if (!d) return null;
      return d.open ? `[E] ${d.label} বন্ধ করুন` : `[E] ${d.label} খুলুন (ভিতরে যান)`;
    },
    interact(pos) {
      const d = findNearestDoor(pos);
      if (!d) return false;
      d.open = !d.open;
      return true;
    },
    toggleAllDoors() {
      const anyClosed = interactiveDoors.some((d) => !d.open);
      for (const d of interactiveDoors) d.open = anyClosed;
      return anyClosed;
    },
    getZoneName(x, z) {
      if (x >= 167.9 && x <= 178.5 && z >= -515.8 && z <= -507.2) {
        return 'ISPAHANI SALES CENTER · ইস্পাহানি বিক্রয় কেন্দ্র (ভিতরে)';
      }
      if (x >= 154.0 && x <= 164.3 && z >= -448.5 && z <= -435.5) {
        return x >= 162.4
          ? '১৫ আলতাপোল লেন · কামিয়াব টিচিং হোম উঠান'
          : (x >= 158.0 ? '১৫ আলতাপোল লেন · কামিয়াব টিচিং হোম (ক্লাসরুম)' : '১৫ আলতাপোল লেন · শিক্ষক কক্ষ ও অফিস');
      }
      if (x >= 156.6 && x <= 166.3 && z >= -424.9 && z <= -411.1) {
        if (x >= 164.8) return '২৪ আলতাপোল লেন · পরশমনি কলা কেন্দ্র উঠান';
        if (z < -416.6) return x >= 160.3 ? '২৪ আলতাপোল লেন · পরশমনি কলা কেন্দ্র (সংগীত ও ড্রয়িং হল)' : '২৪ আলতাপোল লেন · মাস্টার বেডরুম';
        return x >= 160.3 ? '২৪ আলতাপোল লেন · ডাইনিং ও রান্নাঘর' : '২৪ আলতাপোল লেন · অ্যাটাচড বাথরুম';
      }
      if (x >= 155.8 && x <= 165.9 && z >= -390.7 && z <= -377.3) {
        if (x >= 164.2) return '১ আলতাপোল লেন · সাদা বাড়ির উঠান';
        if (z < -383.1) return x >= 159.8 ? '১ আলতাপোল লেন · বসার ঘর ও স্মার্ট টিভি রুম' : '১ আলতাপোল লেন · মাস্টার বেডরুম';
        return x >= 159.8 ? '১ আলতাপোল লেন · ডাইনিং ও রান্নাঘর' : '১ আলতাপোল লেন · অ্যাটাচড বাথরুম';
      }
      return null;
    },
    isInsideAnyHouse(pos) {
      if (!pos) return false;
      const { x, z } = pos;
      return (x >= 167.9 && x <= 178.5 && z >= -515.8 && z <= -507.2)
        || (x >= 154.0 && x <= 162.4 && z >= -448.5 && z <= -435.5)
        || (x >= 156.6 && x <= 164.8 && z >= -424.9 && z <= -411.1)
        || (x >= 155.8 && x <= 164.2 && z >= -390.7 && z <= -377.3);
    },
    applyCollisions(pos, radius, footY = 0) {
      if (!pos || pos.x < 150 || pos.x > 184 || pos.z < -520 || pos.z > -372) return;
      for (let i = 0; i < staticColliders.length; i++) {
        const c = staticColliders[i];
        if (footY > c.maxY - 0.15) continue;
        if (pos.x + radius < c.minX || pos.x - radius > c.maxX || pos.z + radius < c.minZ || pos.z - radius > c.maxZ) continue;
        resolveCircleAABB(pos, radius, c.minX, c.maxX, c.minZ, c.maxZ);
      }
      for (let i = 0; i < interactiveDoors.length; i++) {
        const d = interactiveDoors[i];
        if (d.open || footY > d.collider.maxY - 0.15) continue;
        const c = d.collider;
        resolveCircleAABB(pos, radius, c.minX, c.maxX, c.minZ, c.maxZ);
      }
    },
    update(delta, playerPos = null, isLow = false) {
      const nearCorridor = !playerPos || ((playerPos.x - 166) ** 2 + (playerPos.z + 425) ** 2) < 250 * 250;
      if (root.visible !== nearCorridor) root.visible = nearCorridor;
      if (!nearCorridor) return;

      const step = Math.min(1, 6.5 * delta);
      for (const d of interactiveDoors) {
        if (d.kind === 'shutter') {
          const target = d.open ? 1 : 0;
          if (Math.abs(target - d.progress) > 0.001) {
            d.progress += (target - d.progress) * step;
            d.mesh.position.y = THREE.MathUtils.lerp(d.closedY, d.openY, d.progress);
            d.mesh.scale.y = THREE.MathUtils.lerp(1.0, 0.18, d.progress);
          }
        } else {
          const target = d.open ? d.openAngle : 0;
          if (Math.abs(target - d.angle) > 0.001) {
            d.angle += (target - d.angle) * step;
            d.pivot.rotation.y = d.angle;
          }
        }
      }

      if (playerPos) {
        for (const ig of interiorGroups) {
          const dSq = (playerPos.x - ig.cx) ** 2 + (playerPos.z - ig.cz) ** 2;
          const want = dSq <= ig.maxDistSq;
          if (ig.group.visible !== want) ig.group.visible = want;
        }
      }

      if (!isLow) {
        const rotD = delta * 6.2;
        for (const fan of animatedFans) fan.rotation.y += rotD;
      }
    },
  };
}
