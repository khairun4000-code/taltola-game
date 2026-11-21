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
      label: 'Ispahani Sales Center Shutter',
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
      label: 'Kamyab Teaching Home Main Gate',
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
      label: 'Kamyab Teaching Home Door',
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
      label: 'Parashmoni Kala Kendra Main Gate',
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
      label: 'Parashmoni Kala Kendra Front Door',
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
      label: '1 Altapole Lane House Gate',
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
      label: '1 Altapole Lane Front Door',
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

  // ============================================================================
  // 5) ISPAHANI HOUSE COMPLEX (28, Lower Jashore Road, Khulna · M.M. Ispahani Ltd. ESTD-1820)
  // Directly East & South of Ispahani Sales Center:
  //   - Grand Striped Gatehouse + Openable Geometric Main Gate & Pocket Gate (z = -515.8)
  //   - Paved Courtyard with White Badminton Court Lines & Tall Slender Palm (z = -515.2..-500.5)
  //   - 2-Story Crimson/White Striped Colonial Heritage Mansion (enterable ground floor, z = -500.5..-488.5)
  //   - M.M. Ispahani Manufacturing & Packaging Factory Unit behind mansion (enterable, z = -484.5..-471.5)
  // ============================================================================
  {
    const ispCrimson = new THREE.MeshStandardMaterial({ color: 0x8f2424, roughness: 0.68 });
    const ispCream = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.64 });
    const ispGreyWall = new THREE.MeshStandardMaterial({ color: 0x8d9299, roughness: 0.80 });
    const ispMaroonSteel = new THREE.MeshStandardMaterial({ color: 0x5c1818, roughness: 0.48, metalness: 0.42 });
    const ispFactoryRoof = new THREE.MeshStandardMaterial({ map: makeShutterTexture('#64748b'), roughness: 0.52, metalness: 0.55 });
    const ispMachineGreen = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.44, metalness: 0.48 });
    const ispCartonMat = new THREE.MeshStandardMaterial({ color: 0xb88952, roughness: 0.88 });
    const ispCurbYellow = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.72 });
    const ispCurbBlack = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.78 });
    const ispLawnMat = new THREE.MeshStandardMaterial({ color: 0x2f6b2f, roughness: 0.92 });
    const ispLineWhite = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

    // Custom Gold-on-Black Louvered Gatehouse Signboard Texture
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024;
    signCanvas.height = 280;
    const sctx = signCanvas.getContext('2d');
    sctx.fillStyle = '#14171c';
    sctx.fillRect(0, 0, 1024, 280);
    for (let y = 0; y < 280; y += 16) {
      sctx.fillStyle = '#262b33';
      sctx.fillRect(0, y, 1024, 5);
      sctx.fillStyle = '#0b0d10';
      sctx.fillRect(0, y + 11, 1024, 5);
    }
    sctx.strokeStyle = '#3f4652';
    sctx.lineWidth = 8;
    sctx.strokeRect(4, 4, 1016, 272);
    sctx.textAlign = 'center';
    sctx.textBaseline = 'middle';
    sctx.shadowColor = 'rgba(0,0,0,0.85)';
    sctx.shadowBlur = 8;
    sctx.fillStyle = '#e6c15c';
    sctx.font = '900 84px Georgia, "Times New Roman", serif';
    sctx.fillText('ISPAHANI HOUSE', 512, 76);
    sctx.fillStyle = '#f2d479';
    sctx.font = '700 40px "Manrope", "Segoe UI", sans-serif';
    sctx.fillText('28, LOWER JASHORE ROAD, KHULNA', 512, 162);
    sctx.font = '700 36px "Manrope", "Segoe UI", sans-serif';
    sctx.fillText('M.M. ISPAHANI LTD. ESTD-1820', 512, 224);
    const ispSignTex = new THREE.CanvasTexture(signCanvas);
    ispSignTex.colorSpace = THREE.SRGBColorSpace;
    ispSignTex.anisotropy = 4;
    const ispSignMat = new THREE.MeshStandardMaterial({
      map: ispSignTex,
      emissive: 0xffe4a0,
      emissiveMap: ispSignTex,
      emissiveIntensity: 0.24,
      roughness: 0.36,
      metalness: 0.45,
      side: THREE.DoubleSide,
    });

    // Geometric Maroon & White Main Gate Leaf Texture (matches reference photo diagonal design!)
    const makeGeoGateTex = (isLeft) => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#e8e6e1';
      ctx.fillRect(0, 0, 512, 512);
      // Top vertical grille band
      ctx.fillStyle = '#2b1212';
      ctx.fillRect(0, 0, 512, 96);
      ctx.fillStyle = '#d8d5ce';
      for (let gx = 12; gx < 512; gx += 28) {
        ctx.fillRect(gx, 10, 14, 76);
      }
      ctx.fillStyle = '#5c1818';
      ctx.fillRect(0, 88, 512, 14);
      // Geometric diagonal maroon triangles
      ctx.fillStyle = '#5c1818';
      ctx.beginPath();
      if (isLeft) {
        ctx.moveTo(0, 140);
        ctx.lineTo(512, 340);
        ctx.lineTo(512, 512);
        ctx.lineTo(0, 512);
      } else {
        ctx.moveTo(0, 102);
        ctx.lineTo(512, 102);
        ctx.lineTo(512, 340);
        ctx.lineTo(0, 210);
      }
      ctx.closePath();
      ctx.fill();
      if (!isLeft) {
        ctx.beginPath();
        ctx.moveTo(0, 340);
        ctx.lineTo(512, 512);
        ctx.lineTo(0, 512);
        ctx.closePath();
        ctx.fill();
      }
      // White diagonal sash stripe & center diamond emblem
      ctx.strokeStyle = '#f4f1ea';
      ctx.lineWidth = 10;
      ctx.strokeRect(6, 100, 500, 406);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };
    const leftGateMat = new THREE.MeshStandardMaterial({ map: makeGeoGateTex(true), roughness: 0.45, metalness: 0.35 });
    const rightGateMat = new THREE.MeshStandardMaterial({ map: makeGeoGateTex(false), roughness: 0.45, metalness: 0.35 });

    const cMinX = 178.6;
    const cMaxX = 205.5;
    const cMinZ = -515.8;
    const cMaxZ = -470.5;
    const gateCx = 191.5;

    // 1) Paved Courtyard, Service Yard & Badminton Court Lines
    box(exteriorStatic, [cMaxX - cMinX, 0.10, cMaxZ - cMinZ], [(cMinX + cMaxX) * 0.5, 0.03, (cMinZ + cMaxZ) * 0.5], m.courtyard, { uvScale: 4.5 });
    // Green lawn strip on East side of courtyard (like photo left lawn) with low crimson brick border
    box(exteriorStatic, [3.2, 0.08, 12.6], [203.2, 0.06, -508.0], ispLawnMat);
    box(exteriorStatic, [0.22, 0.24, 12.8], [201.5, 0.14, -508.0], ispCrimson);
    // Crisp White Painted Badminton Court Lines in Courtyard (x = 183.5..199.0, z = -512.8..-502.4)
    const courtY = 0.095;
    box(exteriorStatic, [13.4, 0.012, 0.09], [191.2, courtY, -512.4], ispLineWhite);
    box(exteriorStatic, [13.4, 0.012, 0.09], [191.2, courtY, -502.8], ispLineWhite);
    box(exteriorStatic, [13.4, 0.012, 0.09], [191.2, courtY, -507.6], ispLineWhite);
    box(exteriorStatic, [0.09, 0.012, 9.6], [184.5, courtY, -507.6], ispLineWhite);
    box(exteriorStatic, [0.09, 0.012, 9.6], [197.9, courtY, -507.6], ispLineWhite);
    box(exteriorStatic, [0.09, 0.012, 9.6], [185.2, courtY, -507.6], ispLineWhite);
    box(exteriorStatic, [0.09, 0.012, 9.6], [197.2, courtY, -507.6], ispLineWhite);
    box(exteriorStatic, [0.09, 0.012, 9.6], [191.2, courtY, -507.6], ispLineWhite);

    // 2) Front Boundary Wall (Grey plaster + Crimson plinth & coping) + Black/Yellow Curb + Ad Boards
    // West front wall (178.6..187.3) & East front wall (195.7..205.5)
    addSolidWall(exteriorStatic, cMinX, 187.3, cMinZ, cMinZ + 0.34, 0, 2.75, ispGreyWall);
    addSolidWall(exteriorStatic, 195.7, cMaxX, cMinZ, cMinZ + 0.34, 0, 2.75, ispGreyWall);
    // Crimson bottom plinth & top coping on front boundary walls
    box(exteriorStatic, [8.7, 0.42, 0.42], [182.95, 0.21, cMinZ + 0.17], ispCrimson);
    box(exteriorStatic, [8.7, 0.18, 0.44], [182.95, 2.78, cMinZ + 0.17], ispCrimson);
    box(exteriorStatic, [9.8, 0.42, 0.42], [200.6, 0.21, cMinZ + 0.17], ispCrimson);
    box(exteriorStatic, [9.8, 0.18, 0.44], [200.6, 2.78, cMinZ + 0.17], ispCrimson);
    // Black & Yellow striped roadside curb along front apron
    for (let cx = cMinX; cx < cMaxX; cx += 0.9) {
      if (cx > 188.0 && cx < 194.8) continue; // Keep driveway apron clear
      box(exteriorStatic, [0.88, 0.20, 0.26], [cx + 0.44, 0.10, cMinZ - 0.85], Math.floor(cx) % 2 === 0 ? ispCurbYellow : ispCurbBlack);
    }
    // Ruchi & Mirzapur Tea Wall Ad Boards (matching Google Street View!)
    addWallSign(dynamicG, {
      title: 'রুচি · RUCHI',
      subtitle: 'ISPAHANI FOODS · SNACKS & SPICES',
      bg: '#dc2626', fg: '#fef08a', accent: '#ffffff', border: '#991b1b',
    }, [199.8, 1.48, cMinZ - 0.08], Math.PI, 2.1, 1.35, m.darkMetal);
    addWallSign(dynamicG, {
      title: 'ইস্পাহানি মির্জাপুর চা',
      subtitle: 'MIRZAPUR BEST LEAF TEA',
      bg: '#facc15', fg: '#14532d', accent: '#b91c1c', border: '#ca8a04',
    }, [183.2, 1.48, cMinZ - 0.08], Math.PI, 2.0, 1.35, m.darkMetal);

    // Side & Rear Compound Perimeter Walls
    addSolidWall(exteriorStatic, cMaxX - 0.30, cMaxX, cMinZ, cMaxZ, 0, 2.75, ispGreyWall);
    addSolidWall(exteriorStatic, cMinX, cMaxX, cMaxZ - 0.30, cMaxZ, 0, 2.75, ispGreyWall);
    addSolidWall(exteriorStatic, cMinX, cMinX + 0.30, -507.2, cMaxZ, 0, 2.75, ispGreyWall);

    // 3) Grand Striped Gatehouse (x = 187.3..195.7, z = -516.2..-514.6)
    const addStripedPier = (px, pz, pw, pd, ph) => {
      const bandH = 0.36;
      const steps = Math.floor(ph / bandH);
      for (let i = 0; i < steps; i++) {
        box(exteriorStatic, [pw, bandH + 0.005, pd], [px, i * bandH + bandH * 0.5, pz], i % 2 === 0 ? ispCrimson : ispCream);
      }
      staticColliders.push({ minX: px - pw * 0.5, maxX: px + pw * 0.5, minZ: pz - pd * 0.5, maxZ: pz + pd * 0.5, maxY: ph });
    };
    addStripedPier(187.9, -515.4, 1.25, 1.70, 4.32); // West Pier
    addStripedPier(195.1, -515.4, 1.25, 1.70, 4.32); // East Pier (with guard window)
    box(exteriorStatic, [0.08, 0.86, 0.62], [194.46, 1.75, -515.35], m.glass);
    box(exteriorStatic, [0.10, 0.92, 0.68], [194.48, 1.75, -515.35], m.darkMetal);

    // Flat Cream Canopy Roof + Stepped Terracotta Cornice
    box(exteriorStatic, [9.2, 0.36, 2.10], [gateCx, 4.50, -515.4], ispCream);
    box(exteriorStatic, [9.5, 0.28, 2.28], [gateCx, 4.82, -515.4], ispCrimson);
    // Iconic Black-Louvered Gold-Lettered "ISPAHANI HOUSE" Signboard on top of Canopy
    const ispSignMesh = new THREE.Mesh(new THREE.BoxGeometry(7.9, 1.72, 0.18), ispSignMat);
    ispSignMesh.position.set(gateCx, 5.82, -515.85);
    ispSignMesh.rotation.y = Math.PI;
    dynamicG.add(ispSignMesh);
    // Support posts behind signboard
    box(exteriorStatic, [0.10, 1.65, 0.10], [gateCx - 3.2, 5.72, -515.72], m.darkMetal);
    box(exteriorStatic, [0.10, 1.65, 0.10], [gateCx + 3.2, 5.72, -515.72], m.darkMetal);

    // Openable Pedestrian Pocket Gate (Right side looking North / Left side looking South from road: x = 193.25..194.45)
    // Starts OPEN so player can walk straight into Ispahani House courtyard immediately!
    const pocketPivot = new THREE.Group();
    pocketPivot.position.set(194.42, 0.06, -515.45);
    const pLeaf = new THREE.Group();
    box(pLeaf, [1.18, 2.38, 0.08], [-0.59, 1.19, 0], ispMaroonSteel);
    box(pLeaf, [1.18, 0.10, 0.10], [-0.59, 2.38, 0], ispCream);
    mergeStaticMeshes(pLeaf);
    pocketPivot.add(pLeaf);
    pocketPivot.rotation.y = Math.PI * 0.52;
    dynamicG.add(pocketPivot);
    interactiveDoors.push({
      kind: 'door',
      label: 'Ispahani House Pocket Gate',
      pivot: pocketPivot,
      x: 193.85,
      z: -515.45,
      open: true,
      angle: Math.PI * 0.52,
      openAngle: Math.PI * 0.52,
      collider: { minX: 193.22, maxX: 194.45, minZ: -515.65, maxZ: -515.25, maxY: 2.5 },
    });

    // Openable Geometric Maroon & White Main Vehicle Gate (x = 188.55..193.20)
    const mainGatePivot = new THREE.Group();
    mainGatePivot.position.set(188.58, 0.06, -515.45);
    const mLeaf = new THREE.Group();
    box(mLeaf, [2.30, 3.05, 0.09], [1.15, 1.525, 0], rightGateMat);
    box(mLeaf, [2.30, 3.05, 0.09], [3.45, 1.525, 0], leftGateMat);
    mergeStaticMeshes(mLeaf);
    mainGatePivot.add(mLeaf);
    dynamicG.add(mainGatePivot);
    interactiveDoors.push({
      kind: 'door',
      label: 'Ispahani House Main Gate',
      pivot: mainGatePivot,
      x: 190.9,
      z: -515.45,
      open: false,
      angle: 0,
      openAngle: -Math.PI * 0.52,
      collider: { minX: 188.55, maxX: 193.22, minZ: -515.65, maxZ: -515.25, maxY: 3.1 },
    });

    // 4) 2-Story Crimson & White Striped Heritage Colonial Mansion ("ISPAHANI HOUSE")
    // Footprint: x = 180.5..202.5, z = -500.5..-488.5, height = 8.4m
    const mx0 = 180.5;
    const mx1 = 202.5;
    const mz0 = -500.5;
    const mz1 = -488.5;
    const mCx = (mx0 + mx1) * 0.5; // 191.5
    const mCz = (mz0 + mz1) * 0.5; // -494.5
    const gfH = 4.05;
    const totH = 8.40;

    // Raised Heritage Plinth, Marble Veranda & Ground Floor + Ceiling
    box(exteriorStatic, [mx1 - mx0 + 0.4, 0.24, mz1 - mz0 + 0.6], [mCx, 0.12, mCz], ispCrimson);
    box(exteriorStatic, [mx1 - mx0, 0.10, mz1 - mz0], [mCx, 0.26, mCz], m.pillarTile, { uvScale: 2.2 });
    box(exteriorStatic, [mx1 - mx0 - 0.4, 0.10, mz1 - mz0 - 0.4], [mCx, 3.92, mCz], m.ceilingMat);
    // Entry steps in front of center arch
    box(exteriorStatic, [3.6, 0.12, 0.55], [mCx, 0.06, mz0 - 0.48], ispCrimson);
    box(exteriorStatic, [3.2, 0.12, 0.35], [mCx, 0.18, mz0 - 0.22], ispCrimson);

    // Outer Ground-Floor Hollow Perimeter Walls (East, West, South; North entrance open through 5-arch veranda -> central hall!)
    addSolidWall(exteriorStatic, mx0, mx0 + 0.30, mz0, mz1, 0, gfH, ispCrimson);
    addSolidWall(exteriorStatic, mx1 - 0.30, mx1, mz0, mz1, 0, gfH, ispCrimson);
    addSolidWall(exteriorStatic, mx0, mx1, mz1 - 0.30, mz1, 0, gfH, ispCrimson);

    // Left & Right Striped Projecting Wings on North Facade (x = 180.5..186.2 and x = 196.8..202.5)
    for (const [wx0, wx1] of [[180.5, 186.2], [196.8, 202.5]]) {
      const wCx = (wx0 + wx1) * 0.5;
      const wW = wx1 - wx0;
      // Front wing ground-floor solid wall + striped crimson/cream horizontal quoins
      addSolidWall(exteriorStatic, wx0, wx1, mz0 - 0.55, mz0 + 0.25, 0, gfH, ispCrimson);
      for (let sy = 0.45; sy < totH; sy += 0.52) {
        box(exteriorStatic, [wW + 0.12, 0.20, 0.88], [wCx, sy, mz0 - 0.16], ispCream);
      }
      // 2nd Floor wing facade
      box(exteriorStatic, [wW, totH - gfH, 1.0], [wCx, gfH + (totH - gfH) * 0.5, mz0 - 0.15], ispCrimson);
      // 2 Ground-floor white louvered shutter windows + triangular cream pediments
      for (const ox of [-1.45, 1.45]) {
        box(exteriorStatic, [1.42, 2.05, 0.14], [wCx + ox, 1.72, mz0 - 0.60], ispCream);
        box(exteriorStatic, [1.56, 0.18, 0.22], [wCx + ox, 2.86, mz0 - 0.62], ispCream);
        // 2nd floor green/dark louvered shutter windows
        box(exteriorStatic, [1.38, 1.85, 0.14], [wCx + ox, 5.95, mz0 - 0.60], m.glass);
        box(exteriorStatic, [0.34, 1.85, 0.16], [wCx + ox - 0.78, 5.95, mz0 - 0.62], ispCream);
        box(exteriorStatic, [0.34, 1.85, 0.16], [wCx + ox + 0.78, 5.95, mz0 - 0.62], ispCream);
      }
    }

    // Central 5-Arch Colonnade Veranda (x = 186.2..196.8, z = -500.5..-497.5)
    const archPierXs = [186.35, 188.25, 190.05, 192.95, 194.75, 196.65];
    for (const px of archPierXs) {
      addSolidWall(exteriorStatic, px - 0.24, px + 0.24, mz0 - 0.20, mz0 + 0.30, 0, gfH, ispCrimson);
      // White horizontal quoin accents on central two grand piers
      if (Math.abs(px - mCx) < 1.8) {
        for (let sy = 0.5; sy < gfH; sy += 0.48) {
          box(exteriorStatic, [0.56, 0.16, 0.56], [px, sy, mz0 + 0.05], ispCream);
        }
      }
    }
    // Arch lintels, white semicircular trims & decorative circular medallions above 5 arches
    box(exteriorStatic, [10.6, 0.85, 0.52], [mCx, 3.68, mz0 + 0.05], ispCrimson);
    box(exteriorStatic, [10.8, 0.18, 0.64], [mCx, 4.10, mz0 + 0.02], ispCream);
    for (const [ax, aw] of [[187.3, 1.5], [189.15, 1.5], [191.5, 2.5], [193.85, 1.5], [195.7, 1.5]]) {
      box(exteriorStatic, [aw, 0.12, 0.58], [ax, 3.24, mz0 + 0.04], ispCream);
    }
    for (const mx of [188.25, 194.75]) {
      cylinder(exteriorStatic, 0.22, 0.22, 0.12, [mx, 3.64, mz0 - 0.24], ispCream, 12);
    }

    // Inner Hall Front Wall at z = -497.5 with Central Wide Openable Heritage Double Door (x = 190.4..192.6)
    addSolidWall(exteriorStatic, mx0 + 0.30, 190.4, -497.65, -497.35, 0, gfH, ispCream);
    addSolidWall(exteriorStatic, 192.6, mx1 - 0.30, -497.65, -497.35, 0, gfH, ispCream);
    box(exteriorStatic, [2.25, 1.35, 0.30], [mCx, 3.38, -497.50], ispCream);
    const hallDoorPivot = buildHingedPanelDoor(m, [190.45, 0.26, -497.50], 2.10, 2.55, m.wood, 'X');
    hallDoorPivot.rotation.y = Math.PI * 0.52;
    dynamicG.add(hallDoorPivot);
    interactiveDoors.push({
      kind: 'door',
      label: 'Ispahani House Heritage Hall Door',
      pivot: hallDoorPivot,
      x: mCx,
      z: -497.50,
      open: true,
      angle: Math.PI * 0.52,
      openAngle: Math.PI * 0.52,
      collider: { minX: 190.4, maxX: 192.6, minZ: -497.68, maxZ: -497.32, maxY: 2.85 },
    });

    // 2nd Floor Upper Story Body + Scalloped White Colonial Balcony Arches & Ornate Roof Pediment
    box(exteriorStatic, [mx1 - mx0, totH - gfH, mz1 - mz0 - 1.2], [mCx, gfH + (totH - gfH) * 0.5, mCz + 0.6], ispCrimson);
    // Central 2nd-floor white balcony railing & colonnade posts
    box(exteriorStatic, [10.6, 0.92, 0.16], [mCx, 4.62, mz0 - 0.08], ispCream);
    for (const px of [186.4, 188.1, 189.9, 193.1, 194.9, 196.6]) {
      box(exteriorStatic, [0.24, 3.25, 0.24], [px, 6.25, mz0 - 0.08], ispCream);
    }
    // Central 2nd-floor arched window bay
    box(exteriorStatic, [2.75, 2.85, 0.18], [mCx, 6.05, mz0 + 0.25], m.glass);
    box(exteriorStatic, [3.10, 0.24, 0.32], [mCx, 7.62, mz0 - 0.05], ispCream);
    // Ornate White Roof Balustrade, Crimson Frieze & Central Heritage Pediment Crest
    box(exteriorStatic, [mx1 - mx0 + 0.5, 0.24, mz1 - mz0 + 0.6], [mCx, totH, mCz], ispCream);
    box(exteriorStatic, [mx1 - mx0 + 0.4, 0.52, 0.34], [mCx, totH + 0.36, mz0 - 0.20], ispCrimson);
    box(exteriorStatic, [mx1 - mx0 + 0.6, 0.22, 0.44], [mCx, totH + 0.72, mz0 - 0.20], ispCream);
    // Ornate Central Roof Pediment Crest above center bay
    box(exteriorStatic, [4.2, 0.85, 0.36], [mCx, totH + 1.15, mz0 - 0.20], ispCrimson);
    box(exteriorStatic, [4.5, 0.20, 0.44], [mCx, totH + 1.64, mz0 - 0.20], ispCream);
    box(exteriorStatic, [2.2, 0.45, 0.32], [mCx, totH + 1.92, mz0 - 0.20], ispCream);
    // Decorative Roof Finial Urns along top cornice
    for (const fx of [180.7, 186.1, 189.5, 191.5, 193.5, 196.9, 202.3]) {
      cylinder(exteriorStatic, 0.14, 0.20, 0.52, [fx, totH + 1.05, mz0 - 0.20], ispCream, 8);
    }

    // Furnished Enterable Ground-Floor Heritage Hall Interior (M.M. Ispahani Ltd. Regional Office & Lounge)
    const mansionInt = new THREE.Group();
    mansionInt.name = 'AltapoleInterior_IspahaniHouse';
    // Red carpet runner from entrance to reception
    box(mansionInt, [2.2, 0.02, 6.2], [mCx, 0.32, -493.8], ispCrimson);
    // Executive Mahogany Reception Desk
    box(mansionInt, [3.8, 1.02, 0.84], [mCx, 0.82, -490.8], m.wood);
    box(mansionInt, [3.9, 0.06, 0.90], [mCx, 1.36, -490.8], m.blackTile);
    // Heritage Visitor Sofa Lounge (West wing inside)
    box(mansionInt, [3.2, 0.44, 0.85], [184.6, 0.52, -494.6], m.sofaFabric);
    box(mansionInt, [3.2, 0.54, 0.20], [184.6, 0.94, -495.0], m.sofaFabric);
    box(mansionInt, [1.6, 0.46, 0.86], [184.6, 0.54, -492.8], m.wood);
    // Heritage Conference Table & Display Cabinets (East wing inside)
    box(mansionInt, [3.4, 0.78, 1.35], [198.2, 0.70, -493.2], m.wood);
    box(mansionInt, [0.55, 2.35, 3.4], [201.6, 1.48, -493.2], m.wood);
    for (let k = -1; k <= 1; k++) {
      box(mansionInt, [0.34, 0.38, 0.45], [201.4, 1.25, -493.2 + k * 0.9], teaGoldMat);
      box(mansionInt, [0.34, 0.38, 0.45], [201.4, 1.85, -493.2 + k * 0.9], teaGreenMat);
    }
    // Ceiling Chandeliers / LED Panels & Spinning Fans
    for (const lx of [185.0, 191.5, 198.0]) {
      box(mansionInt, [0.85, 0.06, 0.85], [lx, 3.84, -493.2], m.lamp);
      createSpinningFan(dynamicG, [lx, 3.82, -493.2], m, animatedFans);
    }
    mergeStaticMeshes(mansionInt);
    root.add(mansionInt);
    interiorGroups.push({ group: mansionInt, cx: mCx, cz: mCz, maxDistSq: 50 * 50 });

    // Tall Slender Palm Tree right in front of left-center facade (iconic detail from photo!)
    helpers.addPalm?.(dynamicG, 194.2, 0, -502.4, 14.2, 0.14, 0.16);
    helpers.addBroadleafTree?.(treesG, 180.2, 0, -503.0, 1.38, 9121);
    helpers.addBroadleafTree?.(treesG, 203.2, 0, -501.2, 1.44, 9133);

    // 5) M.M. Ispahani Manufacturing & Packaging Factory Unit (Behind Mansion: x = 180.0..203.0, z = -484.5..-471.5)
    const fx0 = 180.0;
    const fx1 = 203.0;
    const fz0 = -484.5;
    const fz1 = -471.5;
    const fCx = (fx0 + fx1) * 0.5;
    const fCz = (fz0 + fz1) * 0.5;
    const fH = 5.4;

    // Concrete Industrial Floor & Corrugated Steel Roof + Clerestory Monitor
    box(exteriorStatic, [fx1 - fx0, 0.14, fz1 - fz0], [fCx, 0.06, fCz], m.darkConcrete);
    box(exteriorStatic, [fx1 - fx0 + 0.6, 0.24, fz1 - fz0 + 0.6], [fCx, fH + 0.12, fCz], ispFactoryRoof);
    box(exteriorStatic, [fx1 - fx0 - 2.0, 0.85, 3.2], [fCx, fH + 0.62, fCz], ispFactoryRoof);

    // Solid Factory Walls (North loading wall has wide 4.6m loading bay at x = 189.2..193.8)
    addSolidWall(exteriorStatic, fx0, fx0 + 0.30, fz0, fz1, 0, fH, ispGreyWall);
    addSolidWall(exteriorStatic, fx1 - 0.30, fx1, fz0, fz1, 0, fH, ispGreyWall);
    addSolidWall(exteriorStatic, fx0, fx1, fz1 - 0.30, fz1, 0, fH, ispGreyWall);
    addSolidWall(exteriorStatic, fx0, 189.2, fz0, fz0 + 0.30, 0, fH, ispGreyWall);
    addSolidWall(exteriorStatic, 193.8, fx1, fz0, fz0 + 0.30, 0, fH, ispGreyWall);
    box(exteriorStatic, [4.65, 1.65, 0.32], [fCx, 4.58, fz0 + 0.15], ispGreyWall);
    // Terracotta Industrial Stripe & Signboard
    box(exteriorStatic, [fx1 - fx0 + 0.1, 0.35, 0.36], [fCx, fH - 0.25, fz0 + 0.12], ispCrimson);
    addWallSign(dynamicG, {
      title: 'M.M. ISPAHANI LTD. · MANUFACTURING UNIT',
      subtitle: 'TEA BLENDING, FOOD PROCESSING & PACKAGING PLANT',
      bg: '#1e293b', fg: '#facc15', accent: '#ef4444', border: '#64748b',
    }, [fCx, 4.55, fz0 - 0.06], Math.PI, 8.6, 1.15, m.darkMetal);

    // Openable Industrial Roll-Up Loading Bay Shutter (starts OPEN so player can inspect factory floor!)
    const fShutterMesh = new THREE.Mesh(new THREE.BoxGeometry(4.56, 3.72, 0.14), ispFactoryRoof);
    fShutterMesh.position.set(fCx, 3.55, fz0 - 0.02);
    fShutterMesh.scale.y = 0.18;
    dynamicG.add(fShutterMesh);
    interactiveDoors.push({
      kind: 'shutter',
      label: 'Ispahani Factory Loading Shutter',
      mesh: fShutterMesh,
      closedY: 1.90,
      openY: 3.55,
      x: fCx,
      z: fz0,
      open: true,
      progress: 1,
      collider: { minX: 189.2, maxX: 193.8, minZ: fz0 - 0.15, maxZ: fz0 + 0.32, maxY: 3.75 },
    });

    // Factory Interior: Conveyor Line, Blending Hoppers, Cartons & Jute Sacks
    const facInt = new THREE.Group();
    facInt.name = 'AltapoleInterior_IspahaniFactory';
    // Automated Conveyor Belt Line (x = 183.0..199.5, z = -478.0)
    box(facInt, [15.5, 0.85, 1.15], [fCx, 0.52, -478.0], ispMachineGreen);
    box(facInt, [15.2, 0.08, 0.92], [fCx, 0.98, -478.0], m.darkMetal);
    // 3 Stainless Tea Blending & Packaging Hoppers along conveyor
    for (const hx of [185.5, 191.5, 197.5]) {
      cylinder(facInt, 0.72, 0.42, 1.85, [hx, 2.25, -478.0], m.aluminum, 12);
      box(facInt, [1.1, 1.1, 1.1], [hx, 3.45, -478.0], ispMachineGreen);
    }
    // Packaged Cartons moving on belt
    for (let bx = 184.5; bx <= 198.5; bx += 1.8) {
      box(facInt, [0.55, 0.42, 0.50], [bx, 1.24, -478.0], ispCartonMat);
    }
    // Stacked Shipping Pallets of Ruchi & Mirzapur Tea Cartons along South & East Walls
    for (let px = 182.0; px <= 200.0; px += 3.0) {
      box(facInt, [2.1, 0.16, 1.6], [px, 0.20, fz1 - 1.5], m.wood);
      for (let tier = 0; tier < 3; tier++) {
        box(facInt, [0.92, 0.58, 0.72], [px - 0.48, 0.58 + tier * 0.60, fz1 - 1.5], ispCartonMat);
        box(facInt, [0.92, 0.58, 0.72], [px + 0.48, 0.58 + tier * 0.60, fz1 - 1.5], tier % 2 === 0 ? teaGreenMat : teaRedMat);
      }
    }
    // Stacked Jute Raw Tea Sacks along West Wall
    for (let sz = fz0 + 2.2; sz <= fz1 - 3.6; sz += 2.2) {
      for (let tier = 0; tier < 3; tier++) {
        box(facInt, [1.15, 0.44, 0.78], [fx0 + 1.35, 0.34 + tier * 0.42, sz], juteMat);
        box(facInt, [1.15, 0.44, 0.78], [fx0 + 1.35, 0.34 + tier * 0.42, sz + 0.85], juteMat);
      }
    }
    // Overhead High-Bay Industrial LED Lights
    for (const lx of [185.0, 191.5, 198.0]) {
      box(facInt, [2.4, 0.08, 0.42], [lx, fH - 0.18, -481.0], m.lamp);
      box(facInt, [2.4, 0.08, 0.42], [lx, fH - 0.18, -475.0], m.lamp);
    }
    mergeStaticMeshes(facInt);
    root.add(facInt);
    interiorGroups.push({ group: facInt, cx: fCx, cz: fCz, maxDistSq: 54 * 54 });
  }

  // Enterable Altapole East Side Lane buildings (z = -404.0, x = 172.6..217.5) handle their own hollow colliders in src/altapole-goli.js
  staticColliders.push(
    { minX: 172.5, maxX: 182.1, minZ: -407.20, maxZ: -406.82, maxY: 2.2 }, // Short mint corner wall behind [D]
  );

  mergeStaticMeshes(exteriorStatic);
  helpers.finalizeTrees?.(treesG);

  function findNearestDoor(pos) {
    if (!pos || pos.x < 148 || pos.x > 210 || pos.z < -524 || pos.z > -370) return null;
    let best = null;
    let bestD = 3.6;
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
      return d.open ? `[E] Close ${d.label}` : `[E] Open ${d.label} (Enter)`;
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
        return 'ISPAHANI SALES CENTER · INTERIOR';
      }
      if (x >= 171.5 && x <= 210.0 && z >= -407.0 && z <= -401.0) {
        return 'ALTAPOLE LANE · EAST SIDE ALLEY';
      }
      if (x >= 178.6 && x <= 205.5 && z >= -515.8 && z <= -470.5) {
        if (z >= -484.5 && z <= -471.5 && x >= 180.0 && x <= 203.0) {
          return 'M.M. ISPAHANI LTD. · MANUFACTURING & PACKAGING UNIT';
        }
        if (z >= -500.5 && z <= -488.5 && x >= 180.5 && x <= 202.5) {
          return z < -497.5
            ? 'ISPAHANI HOUSE · HERITAGE COLONIAL VERANDA'
            : 'ISPAHANI HOUSE · HERITAGE MANSION HALL';
        }
        return 'ISPAHANI HOUSE · 28 LOWER JASHORE RD COURTYARD';
      }
      if (x >= 154.0 && x <= 164.3 && z >= -448.5 && z <= -435.5) {
        return x >= 162.4
          ? '15 ALTAPOLE LANE · KAMYAB TEACHING HOME COURTYARD'
          : (x >= 158.0 ? '15 ALTAPOLE LANE · KAMYAB TEACHING HOME CLASSROOM' : '15 ALTAPOLE LANE · PRINCIPAL OFFICE');
      }
      if (x >= 156.6 && x <= 166.3 && z >= -424.9 && z <= -411.1) {
        if (x >= 164.8) return '24 ALTAPOLE LANE · PARASHMONI KALA KENDRA COURTYARD';
        if (z < -416.6) return x >= 160.3 ? '24 ALTAPOLE LANE · PARASHMONI CULTURAL HALL' : '24 ALTAPOLE LANE · MASTER BEDROOM';
        return x >= 160.3 ? '24 ALTAPOLE LANE · DINING & KITCHEN' : '24 ALTAPOLE LANE · ATTACHED BATHROOM';
      }
      if (x >= 155.8 && x <= 165.9 && z >= -390.7 && z <= -377.3) {
        if (x >= 164.2) return '1 ALTAPOLE LANE · WHITE HOUSE COURTYARD';
        if (z < -383.1) return x >= 159.8 ? '1 ALTAPOLE LANE · LIVING ROOM & SMART TV' : '1 ALTAPOLE LANE · MASTER BEDROOM';
        return x >= 159.8 ? '1 ALTAPOLE LANE · DINING & KITCHEN' : '1 ALTAPOLE LANE · ATTACHED BATHROOM';
      }
      return null;
    },
    isInsideAnyHouse(pos) {
      if (!pos) return false;
      const { x, z } = pos;
      return (x >= 167.9 && x <= 178.5 && z >= -515.8 && z <= -507.2)
        || (x >= 180.5 && x <= 202.5 && z >= -500.5 && z <= -488.5)
        || (x >= 180.0 && x <= 203.0 && z >= -484.5 && z <= -471.5)
        || (x >= 154.0 && x <= 162.4 && z >= -448.5 && z <= -435.5)
        || (x >= 156.6 && x <= 164.8 && z >= -424.9 && z <= -411.1)
        || (x >= 155.8 && x <= 164.2 && z >= -390.7 && z <= -377.3);
    },
    applyCollisions(pos, radius, footY = 0) {
      if (!pos || pos.x < 150 || pos.x > 222 || pos.z < -520 || pos.z > -372) return;
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
      const nearCorridor = !playerPos || ((playerPos.x - 176) ** 2 + (playerPos.z + 445) ** 2) < 275 * 275;
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
