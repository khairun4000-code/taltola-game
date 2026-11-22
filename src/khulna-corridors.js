import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { attachDerivedPBRMaps, upgradeWetAsphaltMaterial } from './aaa-shaders.js';
import { buildBanglaTruck, buildCNGAuto } from './khulna-vehicles.js';
import { decorateCorridorPole, addBigNetaWallPoster } from './khulna-street-props.js';
import { TALTOLA_HOUSE_OFFSET } from './khulna-geo.js';

function seeded(seed = 7731) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Smooth polyline X(z) along Haji Mohsin Road from OSM trace (z in -145..+145) */
function getHajiRoadCenterX(z) {
  if (z >= -41.5 && z <= 41.5) return 0.0;
  if (z < -41.5) {
    // Follows (0, -41.5) -> (3.2, -55.3) -> (21.5, -142)
    if (z >= -55.3) {
      const f = (-41.5 - z) / (55.3 - 41.5);
      return f * 3.2;
    }
    const f = (-55.3 - z) / (142.0 - 55.3);
    return 3.2 + f * (21.5 - 3.2);
  }
  // South curve: (0, 41.5) -> (-4.5, 52.4) -> (-11.3, 104.2) -> (-15.5, 142)
  if (z <= 52.4) {
    const f = (z - 41.5) / (52.4 - 41.5);
    return f * -4.5;
  }
  const f = (z - 52.4) / (142.0 - 52.4);
  return -4.5 + f * (-15.5 - -4.5);
}

/** Exact Bhairab-Rupsha River Western bank X(z) from khulna-world-data.json river polygon */
export function getRiverWestBankX(z) {
  const bankPts = [
    [-208.0, 1091.1],
    [-93.5, 1117.6],
    [153.8, 1206.5],
    [295.0, 1227.6],
    [441.1, 1231.7],
    [508.0, 1234.7],
    [566.0, 1245.6],
    [1047.4, 1229.3],
  ];
  if (z <= bankPts[0][0]) return bankPts[0][1];
  for (let i = 0; i < bankPts.length - 1; i++) {
    const [z0, x0] = bankPts[i];
    const [z1, x1] = bankPts[i + 1];
    if (z <= z1) {
      const t = (z - z0) / Math.max(0.001, z1 - z0);
      return x0 + (x1 - x0) * t;
    }
  }
  return bankPts[bankPts.length - 1][1];
}

/** Smooth polyline X(z) along Rupsha Ghat Road / Strand Rd */
function getRupshaStrandRoadX(z) {
  const roadPts = [
    [-20.0, 1074.6],
    [-2.0, 1082.9],
    [47.8, 1094.9],
    [112.8, 1112.7],
    [153.3, 1123.8],
    [215.6, 1138.3],
    [290.5, 1144.2],
    [382.1, 1146.1],
    [465.3, 1144.7],
    [590.6, 1145.1],
    [630.6, 1132.6],
  ];
  if (z <= roadPts[0][0]) return roadPts[0][1];
  for (let i = 0; i < roadPts.length - 1; i++) {
    const [z0, x0] = roadPts[i];
    const [z1, x1] = roadPts[i + 1];
    if (z <= z1) {
      const t = (z - z0) / Math.max(0.001, z1 - z0);
      return x0 + (x1 - x0) * t;
    }
  }
  return roadPts[roadPts.length - 1][1];
}

function makeLightBoxTexture({ title, subtitle = '', bg = '#0f3d2e', fg = '#ffffff', accent = '#d9ed9c', border = '#ffffff' }) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 176;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 176);

  // Subtle horizontal backlight diffusion gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 176);
  grad.addColorStop(0, 'rgba(255,255,255,0.12)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 176);

  ctx.strokeStyle = border;
  ctx.lineWidth = 7;
  ctx.strokeRect(7, 7, 498, 162);
  ctx.fillStyle = accent;
  ctx.fillRect(16, 16, 10, 144);

  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 34px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText(title, 40, subtitle ? 66 : 88, 446);
  if (subtitle) {
    ctx.fillStyle = accent;
    ctx.font = '600 20px "Manrope", "Noto Sans Bengali", sans-serif';
    ctx.fillText(subtitle, 40, 126, 446);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeCorrugatedShutterTexture(tint = '#5e6b73') {
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
  // Monsoon dust grime along lower third
  const grime = ctx.createLinearGradient(0, 140, 0, 256);
  grime.addColorStop(0, 'rgba(65,50,36,0)');
  grime.addColorStop(1, 'rgba(65,50,36,0.34)');
  ctx.fillStyle = grime;
  ctx.fillRect(0, 140, 256, 116);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeDisplayWindowTexture(kind = 'pharmacy') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = kind === 'atm' ? '#042f2e' : (kind === 'clinic' ? '#0c2738' : '#1e293b');
  ctx.fillRect(0, 0, 256, 256);

  if (kind === 'atm') {
    // Glowing emerald Prime Bank kiosk alcove & ATM terminal screen
    const g = ctx.createRadialGradient(128, 115, 16, 128, 128, 120);
    g.addColorStop(0, '#10b981');
    g.addColorStop(0.6, '#065f46');
    g.addColorStop(1, '#022c22');
    ctx.fillStyle = g;
    ctx.fillRect(14, 14, 228, 228);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(76, 62, 104, 152);
    ctx.fillStyle = '#6ee7b7';
    ctx.fillRect(92, 82, 72, 48);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(96, 142, 64, 22);
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('24/7 ATM', 128, 46);
  } else {
    // Warmly lit shelves inside pharmacy / shop showcase
    ctx.fillStyle = kind === 'clinic' ? '#e0f2fe' : '#fef3c7';
    ctx.fillRect(10, 16, 236, 14);
    for (let y = 52; y < 220; y += 44) {
      ctx.fillStyle = '#475569';
      ctx.fillRect(16, y + 32, 224, 5);
      for (let x = 22; x < 224; x += 22) {
        ctx.fillStyle = ['#ef4444', '#38bdf8', '#facc15', '#22c55e', '#f97316'][(x + y) % 5];
        ctx.fillRect(x, y + 8, 14, 24);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeHazardBarrierTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#18181b';
  for (let x = -128; x < 384; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 128);
    ctx.lineTo(x + 24, 128);
    ctx.lineTo(x + 68, 0);
    ctx.lineTo(x + 44, 0);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeStuccoNoiseTexture(baseHex, seedVal = 301, { subtleBrick = false, darkStreak = 0.14 } = {}) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  // Fine plaster aggregate & trowel stipple
  for (let i = 0; i < 2400; i++) {
    const light = rnd() > 0.48;
    ctx.fillStyle = light ? 'rgba(255,255,255,0.06)' : `rgba(38,32,26,${0.03 + rnd() * 0.06})`;
    ctx.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 5, 2 + rnd() * 5);
  }
  // Vertical tropical rain-streak patina along cornices
  for (let i = 0; i < 36; i++) {
    const x = rnd() * 256;
    const h = 24 + rnd() * 90;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgba(28,30,24,${darkStreak})`);
    g.addColorStop(1, 'rgba(28,30,24,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 3 + rnd() * 8, h);
  }
  if (subtleBrick) {
    ctx.strokeStyle = 'rgba(24,18,14,0.22)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < 256; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
      const off = ((y / 16) % 2) * 16;
      for (let x = off; x < 256; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 16);
        ctx.stroke();
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeRiverRevetmentTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(9091);
  ctx.fillStyle = '#5c5a52';
  ctx.fillRect(0, 0, 256, 256);
  // Precast concrete CC-blocks & mossy waterline cracks
  for (let y = 0; y < 256; y += 32) {
    for (let x = ((y / 32) % 2) * 16; x < 256; x += 32) {
      const shade = 78 + Math.floor(rnd() * 32);
      ctx.fillStyle = `rgb(${shade + 4},${shade},${shade - 6})`;
      ctx.fillRect(x + 2, y + 2, 28, 28);
    }
  }
  for (let i = 0; i < 600; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(42,52,38,0.22)' : 'rgba(215,210,198,0.14)';
    ctx.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 4, 2 + rnd() * 4);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Safe static mesh merger normalizing index/attributes to prevent BufferGeometryUtils crashes */
function mergeCorridorStatic(root) {
  root.updateWorldMatrix(true, true);
  const invRoot = root.matrixWorld.clone().invert();
  const buckets = new Map();

  root.traverse((obj) => {
    if (!obj.isMesh || obj.isInstancedMesh || Array.isArray(obj.material)) return;
    const key = `${obj.material.uuid}-${obj.castShadow}-${obj.receiveShadow}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        material: obj.material,
        cast: obj.castShadow,
        receive: obj.receiveShadow,
        meshes: [],
        geometries: [],
      });
    }
    const b = buckets.get(key);
    let g = obj.geometry.index ? obj.geometry.toNonIndexed() : obj.geometry.clone();
    const xform = invRoot.clone().multiply(obj.matrixWorld);
    g.applyMatrix4(xform);
    g.clearGroups();
    // Strip extra attributes not shared across primitives (keep position, normal, uv)
    for (const attr of Object.keys(g.attributes)) {
      if (attr !== 'position' && attr !== 'normal' && attr !== 'uv') g.deleteAttribute(attr);
    }
    if (!g.attributes.uv) {
      const count = g.attributes.position.count;
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    b.meshes.push(obj);
    b.geometries.push(g);
  });

  for (const b of buckets.values()) {
    if (b.meshes.length < 2) {
      for (const g of b.geometries) g.dispose();
      continue;
    }
    const merged = mergeGeometries(b.geometries, false);
    for (const g of b.geometries) g.dispose();
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, b.material);
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.receive;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    for (const orig of b.meshes) orig.removeFromParent();
    root.add(mesh);
  }
}

function addBox(parent, size, pos, mat, opts = {}) {
  const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
  if (opts.uvScale) {
    const p = geo.attributes.position;
    const n = geo.attributes.normal;
    const u = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const nx = Math.abs(n.getX(i));
      const ny = Math.abs(n.getY(i));
      const nz = Math.abs(n.getZ(i));
      if (nx >= ny && nx >= nz) u.setXY(i, p.getZ(i) / opts.uvScale, p.getY(i) / opts.uvScale);
      else if (ny >= nx && ny >= nz) u.setXY(i, p.getX(i) / opts.uvScale, p.getZ(i) / opts.uvScale);
      else u.setXY(i, p.getX(i) / opts.uvScale, p.getY(i) / opts.uvScale);
    }
    u.needsUpdate = true;
  }
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (opts.rotY) mesh.rotation.y = opts.rotY;
  if (opts.rotZ) mesh.rotation.z = opts.rotZ;
  if (opts.rotX) mesh.rotation.x = opts.rotX;
  mesh.castShadow = opts.castShadow ?? true;
  mesh.receiveShadow = opts.receiveShadow ?? true;
  parent.add(mesh);
  return mesh;
}

function addCyl(parent, rt, rb, h, pos, mat, seg = 10, rot = null) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * Builds an articulated multi-story Khulna commercial-residential facade
 * (never a flat cube: recessed ground arcade, damp concrete plinth,
 * floor cornice ledges, recessed balconies + iron grills, AC units, tanks).
 */
function buildDetailedBuilding(staticG, dynamicG, bank, opts) {
  const {
    cx,
    cz,
    widthX = 10.6,
    lengthZ = 16.0,
    floors = 4,
    floorH = 3.15,
    facing = -1, // -1 faces -X (East side of road); +1 faces +X (West side of road)
    rotY = 0,
    wallMat = bank.terracotta,
    accentMat = bank.creamTrim,
    shutterMat = bank.shutterSteel,
    hasShopArcade = true,
    displayKind = 'pharmacy',
    seed = 101,
  } = opts;

  const rnd = seeded(seed);
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = rotY;
  staticG.add(g);

  const dg = new THREE.Group();
  dg.position.set(cx, 0, cz);
  dg.rotation.y = rotY;
  dynamicG.add(dg);

  const fDir = facing; // front face normal direction in local X
  const frontX = fDir * (widthX * 0.5);
  const groundH = 3.92;
  const totalH = groundH + Math.max(0, floors - 1) * floorH;

  // Monsoon damp concrete plinth base around footprint
  addBox(g, [widthX + 0.14, 0.42, lengthZ + 0.14], [0, 0.21, 0], bank.dampPlinth, { uvScale: 2.0 });

  // Ground floor setback when building has an arcade shopfront
  const gfInset = hasShopArcade ? 0.68 : 0.0;
  const gfW = widthX - gfInset;
  addBox(g, [gfW, groundH, lengthZ], [-fDir * (gfInset * 0.5), groundH * 0.5, 0], accentMat, { uvScale: 2.8 });

  // Upper stories structural core (recessed behind balcony planes)
  if (floors > 1) {
    const upH = totalH - groundH;
    addBox(g, [widthX, upH, lengthZ], [0, groundH + upH * 0.5, 0], wallMat, { uvScale: 2.8 });
  }

  // Structural corner & shop bay columns on ground level
  const bayCount = Math.max(2, Math.floor(lengthZ / 4.2));
  const baySpan = lengthZ / bayCount;
  for (let i = 0; i <= bayCount; i++) {
    const bz = -lengthZ * 0.5 + i * baySpan;
    const colZ = i === 0 ? bz + 0.24 : (i === bayCount ? bz - 0.24 : bz);
    addBox(g, [0.46, groundH, 0.46], [frontX - fDir * 0.23, groundH * 0.5, colZ], accentMat, { uvScale: 2.2 });
  }

  // Ground floor bays: corrugated shutters + glowing showcases
  const gfFront = frontX - fDir * gfInset;
  for (let b = 0; b < bayCount; b++) {
    const bz = -lengthZ * 0.5 + (b + 0.5) * baySpan;
    const slotW = baySpan - 0.72;
    const isOpen = b % 2 === 1 || displayKind === 'atm';
    if (isOpen) {
      const dispMat = displayKind === 'atm' && b === 0 ? bank.dispATM : (displayKind === 'clinic' ? bank.dispClinic : bank.dispPharmacy);
      addBox(dg, [0.10, 2.48, slotW], [gfFront + fDir * 0.05, 1.34, bz], dispMat, { castShadow: false });
      addBox(g, [0.16, 0.44, slotW], [gfFront + fDir * 0.08, 2.74, bz], shutterMat, { uvScale: 1.5 }); // half-rolled shutter header
      addBox(g, [0.12, 2.72, 0.10], [gfFront + fDir * 0.08, 1.36, bz - slotW * 0.5], bank.aluminum);
      addBox(g, [0.12, 2.72, 0.10], [gfFront + fDir * 0.08, 1.36, bz + slotW * 0.5], bank.aluminum);
    } else {
      addBox(g, [0.14, 2.78, slotW], [gfFront + fDir * 0.06, 1.40, bz], shutterMat, { uvScale: 1.4 });
    }
  }

  // Recessed signboard fascia band (y = 2.86..3.80m) cleanly BELOW 1st-floor overhang slab (y = 3.94m)
  addBox(g, [0.18, 0.90, lengthZ - 0.36], [frontX + fDir * 0.14, 3.36, 0], bank.darkSlate);
  // Cantilevered 1st-floor overhang slab + monsoon drip edge (clears signboards below!)
  addBox(g, [widthX + 0.68, 0.28, lengthZ + 0.36], [fDir * 0.24, groundH, 0], accentMat, { uvScale: 2.5 });

  // Upper floor cornices, recessed balcony alcoves, window frames, grills & AC outdoor units
  for (let f = 1; f < floors; f++) {
    const fy = groundH + f * floorH;
    const baseY = fy - floorH;
    // Concrete floor slab cornice + top parapet cap
    addBox(g, [widthX + 0.54, 0.22, lengthZ + 0.24], [fDir * 0.18, fy, 0], accentMat, { uvScale: 2.5 });

    const bayN = Math.max(2, Math.floor(lengthZ / 4.4));
    const span = lengthZ / bayN;
    for (let b = 0; b < bayN; b++) {
      const bz = -lengthZ * 0.5 + (b + 0.5) * span;
      const bw = Math.min(3.1, span - 0.95);
      if ((b + f) % 2 === 0) {
        // Projecting veranda balcony with low masonry plinth + open steel spindle balustrade
        addBox(g, [1.02, 0.18, bw], [frontX + fDir * 0.48, baseY + 0.12, bz], accentMat, { uvScale: 2.2 });
        addBox(g, [0.14, 0.36, bw], [frontX + fDir * 0.92, baseY + 0.38, bz], accentMat, { uvScale: 2.2 });
        addBox(g, [0.98, 0.36, 0.14], [frontX + fDir * 0.48, baseY + 0.38, bz - bw * 0.5 + 0.07], accentMat, { uvScale: 2.0 });
        addBox(g, [0.98, 0.36, 0.14], [frontX + fDir * 0.48, baseY + 0.38, bz + bw * 0.5 - 0.07], accentMat, { uvScale: 2.0 });
        for (const rOff of [-0.34, -0.17, 0, 0.17, 0.34]) {
          addBox(g, [0.04, 0.54, 0.04], [frontX + fDir * 0.92, baseY + 0.80, bz + rOff * bw], bank.darkMetal);
        }
        addBox(g, [0.06, 0.06, bw + 0.04], [frontX + fDir * 0.92, baseY + 1.08, bz], bank.aluminum);
        // Dark alcove depth + sky-reflective glass sliding door
        addBox(g, [0.18, 2.25, bw * 0.78], [frontX - fDir * 0.06, baseY + 1.24, bz], bank.windowGlass);
      } else {
        // Framed glass casement window with sunshade chajja, sill & AC compressor
        const winMat = rnd() > 0.65 ? bank.warmWindowLit : bank.windowGlass;
        addBox(g, [0.16, 1.55, bw * 0.72], [frontX + fDir * 0.03, baseY + 1.52, bz], winMat);
        addBox(g, [0.24, 0.14, bw * 0.80], [frontX + fDir * 0.09, baseY + 2.34, bz], accentMat, { uvScale: 2.0 });
        addBox(g, [0.20, 0.10, bw * 0.80], [frontX + fDir * 0.07, baseY + 0.72, bz], accentMat, { uvScale: 2.0 });
        if (rnd() > 0.45) {
          addBox(g, [0.34, 0.54, 0.76], [frontX + fDir * 0.18, baseY + 0.46, bz + bw * 0.25], bank.acBox);
          addCyl(g, 0.18, 0.18, 0.08, [frontX + fDir * 0.34, baseY + 0.46, bz + bw * 0.25], bank.darkSlate, 10, [0, 0, Math.PI / 2]);
        }
      }
    }

    // North & South End Gable Windows & Sunshades (eliminates plain side walls at street intersections)
    for (const endZ of [-lengthZ * 0.5, lengthZ * 0.5]) {
      const zOut = Math.sign(endZ);
      for (const gx of [-widthX * 0.24, widthX * 0.24]) {
        const winMat = rnd() > 0.72 ? bank.warmWindowLit : bank.windowGlass;
        addBox(g, [1.55, 1.48, 0.14], [gx, baseY + 1.52, endZ + zOut * 0.02], winMat);
        addBox(g, [1.75, 0.14, 0.26], [gx, baseY + 2.30, endZ + zOut * 0.08], accentMat, { uvScale: 2.0 });
        addBox(g, [1.72, 0.09, 0.20], [gx, baseY + 0.74, endZ + zOut * 0.06], accentMat, { uvScale: 2.0 });
      }
    }
  }

  // Rooftop perimeter parapet + Gazi black ribbed overhead water tank + DTH dish
  addBox(g, [0.22, 0.95, lengthZ], [frontX - fDir * 0.12, totalH + 0.47, 0], wallMat, { uvScale: 2.5 });
  addBox(g, [0.22, 0.95, lengthZ], [-frontX + fDir * 0.12, totalH + 0.47, 0], wallMat, { uvScale: 2.5 });
  addBox(g, [widthX, 0.95, 0.22], [0, totalH + 0.47, -lengthZ * 0.5 + 0.12], wallMat, { uvScale: 2.5 });
  addBox(g, [widthX, 0.95, 0.22], [0, totalH + 0.47, lengthZ * 0.5 - 0.12], wallMat, { uvScale: 2.5 });

  // Rooftop stairhead chhat + Gazi 2000L tank
  addBox(g, [3.2, 2.35, 3.4], [-fDir * 1.4, totalH + 1.18, 0], accentMat, { uvScale: 2.5 });
  addCyl(g, 0.68, 0.70, 1.45, [fDir * 1.2, totalH + 1.25, -lengthZ * 0.22], bank.waterTank, 12);
  addBox(g, [1.55, 0.55, 1.55], [fDir * 1.2, totalH + 0.28, -lengthZ * 0.22], bank.darkMetal);
  return { frontLocalX: frontX, signY: 3.36 };
}

/**
 * High-Graphics 1024x1024 Authentic Bangladeshi Pitch-Asphalt Road Texture (বাংলাদেশি পিচ ঢালাই রাস্তা)
 * Deep charcoal bitumen pitch + fine basalt stone aggregate + tar repair patches + hairline cracks + worn tire tracks + dusty shoulders.
 */
function makeBangladeshiPitchRoadTexture({ seedVal = 841, centerStripe = null, edgeStripe = null, dustyShoulder = true } = {}) {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  // Deep rich charcoal bitumen base
  ctx.fillStyle = '#22262b';
  ctx.fillRect(0, 0, S, S);

  // Subtle organic bitumen tar repair patches
  for (let i = 0; i < 28; i++) {
    const px = 70 + rnd() * (S - 140);
    const py = rnd() * S;
    const rw = 44 + rnd() * 124;
    const rh = 34 + rnd() * 98;
    ctx.fillStyle = rnd() > 0.45 ? 'rgba(15, 17, 21, 0.34)' : 'rgba(54, 58, 65, 0.22)';
    ctx.fillRect(px, py, rw, rh);
  }

  // Longitudinal rubber tire-wear polish tracks
  for (const lx of [S * 0.23, S * 0.37, S * 0.63, S * 0.77]) {
    const g = ctx.createLinearGradient(lx - 48, 0, lx + 48, 0);
    g.addColorStop(0, 'rgba(14,16,20,0)');
    g.addColorStop(0.5, 'rgba(10,12,16,0.30)');
    g.addColorStop(1, 'rgba(14,16,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(lx - 48, 0, 96, S);
  }

  // Authentic hairline bitumen stress cracks (very subtle, high realism)
  ctx.strokeStyle = 'rgba(10, 12, 14, 0.42)';
  ctx.lineWidth = 1.4;
  for (let k = 0; k < 14; k++) {
    let cx = 90 + rnd() * (S - 180);
    let cy = rnd() * S;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let s = 0; s < 6; s++) {
      cx += (rnd() - 0.5) * 34;
      cy += (rnd() - 0.5) * 44;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  // Dense high-res crushed basalt stone aggregate grit (পাথরকুচি + পিচ ঢালাই)
  for (let i = 0; i < 18000; i++) {
    const v = 28 + Math.floor(rnd() * 52);
    const a = 0.20 + rnd() * 0.30;
    ctx.fillStyle = `rgba(${v},${v + 1},${v + 3},${a})`;
    const sz = 1.2 + rnd() * 2.6;
    ctx.fillRect(rnd() * S, rnd() * S, sz, sz);
  }

  // Natural dusty sandy-earth Bangladeshi road shoulders near curbs
  if (dustyShoulder) {
    const leftG = ctx.createLinearGradient(0, 0, 74, 0);
    leftG.addColorStop(0, 'rgba(120, 102, 80, 0.62)');
    leftG.addColorStop(0.55, 'rgba(98, 86, 70, 0.24)');
    leftG.addColorStop(1, 'rgba(116, 102, 82, 0)');
    ctx.fillStyle = leftG;
    ctx.fillRect(0, 0, 74, S);
    const rightG = ctx.createLinearGradient(S, 0, S - 74, 0);
    rightG.addColorStop(0, 'rgba(120, 102, 80, 0.62)');
    rightG.addColorStop(0.55, 'rgba(98, 86, 70, 0.24)');
    rightG.addColorStop(1, 'rgba(116, 102, 82, 0)');
    ctx.fillStyle = rightG;
    ctx.fillRect(S - 74, 0, 74, S);
  }

  if (edgeStripe) {
    ctx.fillStyle = edgeStripe;
    ctx.fillRect(48, 0, 14, S);
    ctx.fillRect(S - 62, 0, 14, S);
  }

  if (centerStripe) {
    ctx.fillStyle = centerStripe;
    const cw = 24;
    const cx = Math.floor(S * 0.5 - cw * 0.5);
    ctx.fillRect(cx, 56, cw, 336);
    ctx.fillRect(cx, 568, cw, 336);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** High-Graphics 512x512 Authentic Khulna Red Clay Brick Footpath Texture (লাল ইটের ফুটপাত) */
function makeRedBrickFootpathTexture(seedVal = 819) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  // Damp dark sandy mortar joints
  ctx.fillStyle = '#3f2b22';
  ctx.fillRect(0, 0, S, S);

  const rows = 12;
  const cols = 6;
  const bh = S / rows;
  const bw = S / cols;

  for (let r = 0; r < rows; r++) {
    const xOff = (r % 2) * (bw * 0.5);
    for (let col = -1; col <= cols; col++) {
      const bx = col * bw + xOff;
      const by = r * bh;
      const red = 152 + Math.floor(rnd() * 38);
      const grn = 52 + Math.floor(rnd() * 24);
      const blu = 38 + Math.floor(rnd() * 18);
      ctx.fillStyle = `rgb(${red}, ${grn}, ${blu})`;
      ctx.fillRect(bx + 2.5, by + 2.5, bw - 5, bh - 5);
      ctx.strokeStyle = 'rgba(255, 198, 165, 0.18)';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(bx + 4, by + 4, bw - 8, bh - 8);
      // Subtle mossy patina in humid Khulna corners
      if (rnd() > 0.72) {
        ctx.fillStyle = 'rgba(46, 66, 38, 0.22)';
        ctx.fillRect(bx + 2, by + 2, bw - 4, 6);
      }
      for (let d = 0; d < 18; d++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,220,200,0.09)' : 'rgba(22,12,8,0.14)';
        ctx.fillRect(bx + 5 + rnd() * (bw - 10), by + 5 + rnd() * (bh - 10), 2.2, 2.2);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function createCorridorBank() {
  const shutterSteel = makeCorrugatedShutterTexture('#5d6c75');
  const shutterBlue = makeCorrugatedShutterTexture('#264c6b');
  const dispATM = makeDisplayWindowTexture('atm');
  const dispPharmacy = makeDisplayWindowTexture('pharmacy');
  const dispClinic = makeDisplayWindowTexture('clinic');
  const hazardTex = makeHazardBarrierTexture();
  hazardTex.repeat.set(3, 1);

  const plasterStd = (hex, seedVal, rough, opts = {}) => {
    const tex = makeStuccoNoiseTexture(hex, seedVal, opts);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: rough, metalness: 0.02, envMapIntensity: 0.78 });
    attachDerivedPBRMaps(mat, tex, { strength: opts.subtleBrick ? 2.6 : 1.9, roughBase: rough, normalScale: 0.72 });
    return mat;
  };

  const mkPitchMat = (opts, polyFactor = -2) => {
    const tex = makeBangladeshiPitchRoadTexture(opts);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.72,
      metalness: 0.07,
      envMapIntensity: 0.65,
      polygonOffset: true,
      polygonOffsetFactor: polyFactor,
      polygonOffsetUnits: polyFactor,
    });
    attachDerivedPBRMaps(mat, tex, { size: 512, strength: 2.5, roughBase: 0.72, normalScale: 0.78 });
    upgradeWetAsphaltMaterial(mat, null, 0.38);
    return mat;
  };

  const pitchMainMat = mkPitchMat({ seedVal: 845, centerStripe: 'rgba(241, 245, 249, 0.84)', edgeStripe: 'rgba(241, 245, 249, 0.62)', dustyShoulder: true }, -2);
  const pitchLaneMat = mkPitchMat({ seedVal: 847, centerStripe: null, edgeStripe: null, dustyShoulder: true }, -2);
  const pitchJunctionMat = mkPitchMat({ seedVal: 841, centerStripe: null, edgeStripe: null, dustyShoulder: false }, -3);
  pitchJunctionMat.map.repeat.set(3.5, 3.5);

  const redBrickFootpathTex = makeRedBrickFootpathTexture(819);
  const redBrickFootpathMat = new THREE.MeshStandardMaterial({ map: redBrickFootpathTex, roughness: 0.84, metalness: 0.02, envMapIntensity: 0.45 });
  attachDerivedPBRMaps(redBrickFootpathMat, redBrickFootpathTex, { size: 512, strength: 2.6, roughBase: 0.84, normalScale: 0.76 });

  const revetTex = makeRiverRevetmentTexture();
  const riverRevetMat = new THREE.MeshStandardMaterial({ map: revetTex, roughness: 0.94, metalness: 0.02, envMapIntensity: 0.45 });
  attachDerivedPBRMaps(riverRevetMat, revetTex, { strength: 2.5, roughBase: 0.94, normalScale: 0.85 });

  const shutterMat = new THREE.MeshStandardMaterial({ map: shutterSteel, roughness: 0.46, metalness: 0.62, envMapIntensity: 1.0 });
  const shutterBlueMat = new THREE.MeshStandardMaterial({ map: shutterBlue, roughness: 0.44, metalness: 0.58, envMapIntensity: 1.0 });
  attachDerivedPBRMaps(shutterMat, shutterSteel, { strength: 3.0, roughBase: 0.46, normalScale: 0.9 });
  attachDerivedPBRMaps(shutterBlueMat, shutterBlue, { strength: 3.0, roughBase: 0.44, normalScale: 0.9 });

  const tinBlueTex = makeCorrugatedShutterTexture('#265d78');
  const tinRustTex = makeCorrugatedShutterTexture('#7a4834');
  const tinBlueMat = new THREE.MeshStandardMaterial({ map: tinBlueTex, roughness: 0.48, metalness: 0.46, envMapIntensity: 0.95 });
  const tinRustMat = new THREE.MeshStandardMaterial({ map: tinRustTex, roughness: 0.72, metalness: 0.34, envMapIntensity: 0.65 });
  attachDerivedPBRMaps(tinBlueMat, tinBlueTex, { strength: 2.8, roughBase: 0.48, normalScale: 0.85 });
  attachDerivedPBRMaps(tinRustMat, tinRustTex, { strength: 2.8, roughBase: 0.72, normalScale: 0.85 });

  const bank = {
    creamTrim: plasterStd('#e8decb', 101, 0.80),
    terracotta: plasterStd('#b9684b', 202, 0.85),
    sagePlaster: plasterStd('#9db3a6', 303, 0.82),
    ochrePlaster: plasterStd('#c6985e', 404, 0.84),
    brickRed: plasterStd('#9b4634', 505, 0.88, { subtleBrick: true }),
    modernWhite: plasterStd('#e6ebf0', 606, 0.72),
    dampPlinth: plasterStd('#3c3e38', 707, 0.93, { darkStreak: 0.25 }),
    pitchMain: pitchMainMat,
    pitchLane: pitchLaneMat,
    pitchJunction: pitchJunctionMat,
    redBrickFootpath: redBrickFootpathMat,
    roadLineWhite: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.78, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }),
    darkSlate: new THREE.MeshStandardMaterial({ color: 0x1e252b, roughness: 0.55, metalness: 0.35 }),
    aluminum: new THREE.MeshStandardMaterial({ color: 0xd1dae0, roughness: 0.24, metalness: 0.88, envMapIntensity: 1.25 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: 0x22282e, roughness: 0.45, metalness: 0.75 }),
    waterTank: new THREE.MeshPhysicalMaterial({ color: 0x141e22, roughness: 0.38, clearcoat: 0.4 }),
    acBox: plasterStd('#dde2e6', 808, 0.52, { darkStreak: 0.04 }),
    windowGlass: new THREE.MeshPhysicalMaterial({ color: 0x1e4356, roughness: 0.08, metalness: 0.14, clearcoat: 0.95, envMapIntensity: 1.65 }),
    warmWindowLit: new THREE.MeshStandardMaterial({ color: 0xffebb8, emissive: 0xffd07a, emissiveIntensity: 0.65, roughness: 0.24 }),
    shutterSteel: shutterMat,
    shutterBlue: shutterBlueMat,
    dispATM: new THREE.MeshStandardMaterial({ map: dispATM, emissive: 0x10b981, emissiveMap: dispATM, emissiveIntensity: 0.95, roughness: 0.14 }),
    dispPharmacy: new THREE.MeshStandardMaterial({ map: dispPharmacy, emissive: 0xffe4a0, emissiveMap: dispPharmacy, emissiveIntensity: 0.85, roughness: 0.18 }),
    dispClinic: new THREE.MeshStandardMaterial({ map: dispClinic, emissive: 0x93c5fd, emissiveMap: dispClinic, emissiveIntensity: 0.85, roughness: 0.18 }),
    poleConcrete: plasterStd('#8f9490', 909, 0.90),
    lampBulb: new THREE.MeshStandardMaterial({ color: 0xfff8e6, emissive: 0xffdf99, emissiveIntensity: 1.5 }),
    transformerMat: new THREE.MeshStandardMaterial({ color: 0x4b5e6b, roughness: 0.52, metalness: 0.55 }),
    hazardBarrier: new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.78 }),
    riverRevetment: riverRevetMat,
    tinBlue: tinBlueMat,
    tinRust: tinRustMat,
    steelBlue: plasterStd('#1e4f6e', 1313, 0.42, { darkStreak: 0.06 }),
    hullNavy: new THREE.MeshPhysicalMaterial({ color: 0x1d3557, roughness: 0.38, metalness: 0.25, clearcoat: 0.45 }),
    launchWhite: new THREE.MeshPhysicalMaterial({ color: 0xf1f5f9, roughness: 0.34, clearcoat: 0.55 }),
    deckGreen: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.74 }),
    ferryOrange: new THREE.MeshPhysicalMaterial({ color: 0xc2410c, roughness: 0.42, clearcoat: 0.5 }),
    woodBoat: plasterStd('#6f4225', 1111, 0.86),
    bambooCanopy: plasterStd('#8a6e4a', 1212, 0.92),
    ropes: new THREE.MeshStandardMaterial({ color: 0xa18864, roughness: 0.95 }),
    emissiveMaterials: [],
  };

  bank.emissiveMaterials.push(
    { mat: bank.lampBulb, day: 1.1, night: 3.4 },
    { mat: bank.warmWindowLit, day: 0.35, night: 1.85 },
    { mat: bank.dispATM, day: 0.75, night: 1.80 },
    { mat: bank.dispPharmacy, day: 0.65, night: 1.65 },
    { mat: bank.dispClinic, day: 0.65, night: 1.65 }
  );
  return bank;
}

function addIlluminatedSign(dynamicG, bank, opts, pos, rotY, w, h) {
  const tex = makeLightBoxTexture(opts);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: 0.42,
    roughness: 0.28,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });
  bank.emissiveMaterials.push({ mat, day: 0.36, night: 1.45 });
  const signGroup = new THREE.Group();
  signGroup.position.set(pos[0], pos[1], pos[2]);
  signGroup.rotation.y = rotY;
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, h + 0.06, 0.10), bank.darkMetal);
  const face = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.125), mat);
  signGroup.add(bezel, face);
  dynamicG.add(signGroup);
  return signGroup;
}

function addUtilityPoleAndLamp(staticG, dynamicG, bank, px, pz, armDirX = 1, hasTransformer = false, wireTargets = null, forceTier = null) {
  const hVal = Math.abs(Math.sin(px * 13.7 + pz * 7.3) * 43758.5453) % 1;
  const thicknessMod = forceTier !== null ? forceTier : (hasTransformer ? 2 : (hVal < 0.42 ? 0 : (hVal < 0.62 ? 1 : 2)));
  // Dramatic, unmistakably visible thick concrete poles (0.28..0.40m) vs slim steel poles (0.065..0.09m)!
  const rt = thicknessMod === 2 ? 0.28 : (thicknessMod === 1 ? 0.16 : 0.065);
  const rb = thicknessMod === 2 ? 0.40 : (thicknessMod === 1 ? 0.22 : 0.090);
  const midR = (rt + rb) * 0.5 + 0.014;
  addCyl(staticG, rt, rb, 9.2, [px, 4.6, pz], bank.poleConcrete, 8);
  // Concrete footing collar
  addCyl(staticG, rb + 0.06, rb + 0.09, 0.34, [px, 0.17, pz], bank.dampPlinth, 8);
  // Crossarm & ceramic insulators
  addBox(staticG, [0.12, 0.12, 1.45], [px, 8.65, pz], bank.darkMetal);
  for (const iz of [-0.56, 0, 0.56]) {
    addCyl(staticG, 0.06, 0.07, 0.18, [px, 8.80, pz + iz], bank.modernWhite, 6);
  }
  // Curved LED cobra streetlamp arm reaching over the carriageway
  addBox(staticG, [1.45, 0.07, 0.08], [px + armDirX * 0.72, 7.65, pz], bank.aluminum, { rotZ: armDirX * 0.14 });
  addBox(staticG, [0.46, 0.11, 0.24], [px + armDirX * 1.42, 7.75, pz], bank.darkSlate);
  addBox(dynamicG, [0.36, 0.05, 0.18], [px + armDirX * 1.42, 7.68, pz], bank.lampBulb, { castShadow: false });

  // Tangled black fiber cable coil hung at mid-pole
  const torus = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 6, 14), bank.darkSlate);
  torus.position.set(px + armDirX * (midR + 0.08), 5.4, pz);
  torus.rotation.y = Math.PI / 2;
  staticG.add(torus);

  if (hasTransformer) {
    addBox(staticG, [0.75, 0.12, 1.2], [px + armDirX * 0.38, 6.2, pz], bank.darkMetal);
    addCyl(staticG, 0.34, 0.34, 1.05, [px + armDirX * 0.45, 6.82, pz - 0.25], bank.transformerMat, 10);
    addCyl(staticG, 0.28, 0.28, 0.92, [px + armDirX * 0.45, 6.76, pz + 0.32], bank.transformerMat, 10);
  }
  // Attach authentic Bengali pole posters & high election banners matching exact pole thickness!
  decorateCorridorPole(dynamicG, px, pz, armDirX < 0 ? Math.PI : 0, Math.round(px * 3 + pz), midR);
  if (wireTargets) wireTargets.push([px, 8.75, pz]);
}

/** Smooth continuous paved strip connecting segments cleanly across road centerlines */
function buildPavedSegmentRoad(staticG, pts, width, y, mat, uvScale = 5.5) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz) + 0.9;
    const yaw = Math.atan2(dx, dz);
    addBox(staticG, [width, 0.05, len], [(x0 + x1) * 0.5, y + (i % 2) * 0.0014, (z0 + z1) * 0.5], mat, {
      rotY: yaw,
      castShadow: false,
      uvScale,
    });
  }
}

/**
 * Builds ONE continuous, mitered, ZERO-Z-fighting Bangladeshi Pitch-Asphalt road ribbon
 * along a polyline (eliminates overhanging box corners & flickering at curves and road mouths).
 */
function addPitchRoadAlongPolyline(staticG, pts, roadHalfW, mat, yTop = 0.002) {
  if (!pts || pts.length < 2) return;
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i];
    let nx = 0;
    let nz = 0;
    if (i > 0) {
      const dx = x - pts[i - 1][0];
      const dz = z - pts[i - 1][1];
      const l = Math.hypot(dx, dz) || 1;
      nx += -dz / l;
      nz += dx / l;
    }
    if (i < pts.length - 1) {
      const dx = pts[i + 1][0] - x;
      const dz = pts[i + 1][1] - z;
      const l = Math.hypot(dx, dz) || 1;
      nx += -dz / l;
      nz += dx / l;
    }
    const nl = Math.hypot(nx, nz) || 1;
    nx /= nl;
    nz /= nl;

    const lx = x - nx * roadHalfW;
    const lz = z - nz * roadHalfW;
    const rx = x + nx * roadHalfW;
    const rz = z + nz * roadHalfW;
    positions.push(lx, yTop, lz, rx, yTop, rz);
    normals.push(0, 1, 0, 0, 1, 0);
    uvs.push(lx / 5.5, lz / 5.5, rx / 5.5, rz / 5.5);

    if (i > 0) {
      const b = (i - 1) * 2;
      indices.push(b, b + 1, b + 3, b, b + 3, b + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  staticG.add(mesh);
}

/** Flat circular Taltola-style asphalt junction pad flush at ground level (yTop = 0.003) */
function addPitchJunctionDisc(staticG, cx, cz, radius, mat, yTop = 0.003) {
  const geo = new THREE.CircleGeometry(radius, 32);
  geo.rotateX(-Math.PI * 0.5);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (cx + pos.getX(i)) / 5.5, (cz + pos.getZ(i)) / 5.5);
  }
  uv.needsUpdate = true;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(cx, yTop, cz);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  staticG.add(mesh);
}

function buildHajiMohsinCorridor(staticG, dynamicG, bank, m, helpers, treesG = staticG) {
  const wireMat = m.wire;

  // 1) Wet-puddle continuous road aprons north (-140..-38) & south (38..140) matching OSM curves
  const northRoadPts = [[0, -37], [3.2, -55.3], [11.5, -94], [21.5, -142]];
  const southRoadPts = [[0, 37], [-4.5, 52.4], [-8.8, 82], [-15.2, 140]];
  buildPavedSegmentRoad(staticG, northRoadPts, 5.2, -0.023, m.road, 5.5);
  buildPavedSegmentRoad(staticG, southRoadPts, 5.2, -0.023, m.road, 5.5);
  // Flush shoulder sub-base strictly under carriageway + brick curbs so no corners jut past sidewalks
  buildPavedSegmentRoad(staticG, northRoadPts, 6.8, -0.055, m.darkConcrete, 3.0);
  buildPavedSegmentRoad(staticG, southRoadPts, 6.8, -0.055, m.darkConcrete, 3.0);

  // Transition aprons & weathered brick compound walls bridging z = ±36..±49 setback pockets cleanly
  // North East transition (bridges Reza Medical z = -35.5 to New Sundarban z = -45.5)
  addBox(staticG, [8.6, 0.08, 12.2], [7.6, -0.008, -41.2], bank.dampPlinth, { castShadow: false, uvScale: 2.5 });
  addBox(staticG, [0.34, 2.35, 11.4], [3.95, 1.17, -41.2], bank.brickRed, { uvScale: 2.4 });
  addBox(staticG, [0.46, 0.14, 11.6], [3.95, 2.38, -41.2], bank.creamTrim);
  for (const cz of [-36.0, -41.2, -46.4]) {
    addBox(staticG, [0.54, 2.65, 0.54], [3.95, 1.32, cz], bank.creamTrim);
  }
  addBox(staticG, [2.2, 0.12, 5.2], [4.7, 2.82, -41.2], bank.tinBlue, { rotZ: -0.18, uvScale: 1.8 });
  helpers.addBroadleafTree?.(treesG, 5.4, 0, -42.2, 1.08, 521);

  // North West transition (bridges West compound wall z = -40 to Khulna Dental z = -48)
  addBox(staticG, [9.2, 0.08, 10.6], [-6.6, -0.008, -44.2], bank.dampPlinth, { castShadow: false, uvScale: 2.5 });
  addBox(staticG, [0.34, 2.25, 10.2], [-2.75, 1.12, -44.2], bank.brickRed, { rotY: 0.21, uvScale: 2.4 });
  addBox(staticG, [0.46, 0.14, 10.4], [-2.75, 2.28, -44.2], bank.creamTrim, { rotY: 0.21 });
  helpers.addBroadleafTree?.(treesG, -5.0, 0, -45.2, 1.10, 529);

  // South East & South West transitions (z = +37..+49.5)
  addBox(staticG, [8.6, 0.08, 12.2], [5.8, -0.008, 43.2], bank.dampPlinth, { castShadow: false, uvScale: 2.5 });
  addBox(staticG, [0.34, 2.25, 11.6], [2.45, 1.12, 43.2], bank.brickRed, { rotY: -0.26, uvScale: 2.4 });
  addBox(staticG, [0.46, 0.14, 11.8], [2.45, 2.28, 43.2], bank.creamTrim, { rotY: -0.26 });
  addBox(staticG, [9.0, 0.08, 11.6], [-7.6, -0.008, 44.8], bank.dampPlinth, { castShadow: false, uvScale: 2.5 });
  addBox(staticG, [0.34, 2.25, 11.2], [-3.85, 1.12, 44.8], bank.brickRed, { rotY: -0.26, uvScale: 2.4 });
  addBox(staticG, [0.46, 0.14, 11.4], [-3.85, 2.28, 44.8], bank.creamTrim, { rotY: -0.26 });

  // BIG High-Quality Leader Wall Posters along Haji Mohsin Road compound walls!
  addBigNetaWallPoster(dynamicG, 0, 3.74, 1.32, -39.2, -Math.PI / 2, 1.95);
  addBigNetaWallPoster(dynamicG, 1, 3.74, 1.32, -43.0, -Math.PI / 2, 1.95);
  addBigNetaWallPoster(dynamicG, 2, -2.52, 1.32, -44.2, Math.PI / 2 + 0.21, 1.98);
  addBigNetaWallPoster(dynamicG, 0, 2.22, 1.32, 42.2, -Math.PI / 2 - 0.26, 1.92);
  addBigNetaWallPoster(dynamicG, 1, -3.62, 1.32, 44.8, Math.PI / 2 - 0.26, 1.92);
  addBigNetaWallPoster(dynamicG, 2, -2.86, 1.32, -4.5, Math.PI / 2, 1.95);
  addBigNetaWallPoster(dynamicG, 0, -2.86, 1.32, 3.5, Math.PI / 2, 1.95);

  // Crisp Zebra Crosswalks & Storm Drain Gratings along Hero Block (x = -1.9..+1.9)
  for (const cz of [-28.0, 9.8, 39.2]) {
    for (let sx = -1.5; sx <= 1.5; sx += 0.6) {
      addBox(staticG, [0.30, 0.014, 1.85], [sx, 0.036, cz], bank.modernWhite, { castShadow: false });
    }
  }

  // Seamless continuous Red-Brick Sidewalks North (-38..-140) & South (+38..+140)
  for (const side of [-1, 1]) {
    const northSw = northRoadPts.map(([x, z]) => [x + side * 2.88, z]);
    const southSw = southRoadPts.map(([x, z]) => [x + side * 2.88, z]);
    buildPavedSegmentRoad(staticG, northSw, 1.45, 0.065, m.brick, 2.2);
    buildPavedSegmentRoad(staticG, southSw, 1.45, 0.065, m.brick, 2.2);
  }

  // East sidewalk connecting z = -38.5 .. +7.35 seamlessly into existing hero East sidewalk (z = 7.35+)
  addBox(staticG, [1.45, 0.14, 46.2], [2.75, 0.02, -15.6], m.brick, { uvScale: 2.2 });

  // 4) Continuous Electric Poles, Transformers, Streetlamps & Overhead Wire Bundles (z = -128..+128)
  const eastWires = [];
  const westWires = [];
  for (const pz of [-124, -96, -68, -42, -16, 46, 74, 102, 128]) {
    const cx = getHajiRoadCenterX(pz);
    addUtilityPoleAndLamp(staticG, dynamicG, bank, cx + 2.95, pz, -1, pz === -68 || pz === 74, eastWires);
    if (pz !== -16) {
      addUtilityPoleAndLamp(staticG, dynamicG, bank, cx - 2.95, pz + 8, 1, false, westWires);
    }
  }
  for (let aIdx = 0; aIdx < 2; aIdx++) {
    const arr = aIdx === 0 ? eastWires : westWires;
    const sideDir = aIdx === 0 ? 1 : -1;
    for (let i = 0; i < arr.length - 1; i++) {
      const offsets = [
        [0.0, 0.0, 0.44, 0.016],
        [-0.38, -0.52, 0.64, 0.018],
        [0.36, -0.60, 0.58, 0.016],
        [-0.25, -2.55, 0.92, 0.024],
        [0.28, -2.95, 1.24, 0.020],
        [-0.14, -3.35, 1.52, 0.018],
        [0.18, -3.65, 1.08, 0.016],
        [-0.30, -3.12, 1.68, 0.015],
        [0.10, -2.80, 0.78, 0.017],
        [-0.08, -3.50, 1.38, 0.015],
        [0.32, -3.28, 1.18, 0.016],
      ];
      for (let k = 0; k < offsets.length; k++) {
        const [lat, dy, sag, rad] = offsets[k];
        const dy2 = dy + ((k % 3) - 1) * 0.26;
        const lat2 = lat + ((k % 2 === 0 ? 1 : -1) * 0.16);
        helpers.addWire?.(
          staticG,
          [arr[i][0] + lat, arr[i][1] + dy, arr[i][2]],
          [arr[i + 1][0] + lat2, arr[i + 1][1] + dy2, arr[i + 1][2]],
          wireMat,
          sag,
          rad,
        );
      }
      for (const [dzOff, endY, sag] of [[-6.5, 4.0, 0.72], [-1.5, 6.2, 0.52], [3.2, 5.4, 0.60], [8.2, 3.7, 0.86]]) {
        helpers.addWire?.(
          staticG,
          [arr[i][0], arr[i][1] - 3.25, arr[i][2]],
          [arr[i][0] + sideDir * 7.5, endY, arr[i][2] + dzOff],
          wireMat,
          sag,
          0.015,
        );
      }
    }
  }

  // Lush Tropical Rain-Trees & Coconut Palms framing the corridor sidewalks
  for (const [tz, side, isPalm] of [
    [-112, 1, false], [-88, -1, true], [-50, -1, false], [-32, 1, true],
    [48, 1, true], [72, -1, false], [100, 1, false], [116, -1, true],
  ]) {
    const px = getHajiRoadCenterX(tz) + side * 3.45;
    if (isPalm) helpers.addPalm?.(dynamicG, px, 0, tz, 6.8, (tz % 5) * 0.25, 0.35);
    else helpers.addBroadleafTree?.(treesG, px, 0, tz, 1.05, 500 + tz * 3);
  }
}

function buildKioskBooth(staticG, dynamicG, bank, m, cx, cz, width = 2.8, depth = 2.8, roofMat = bank.ferryOrange) {
  // Detailed glass & masonry toll/ticket booth instead of a flat cube
  addBox(staticG, [width + 0.36, 0.24, depth + 0.36], [cx, 0.12, cz], bank.dampPlinth, { uvScale: 2.0 });
  addBox(staticG, [width, 1.05, depth], [cx, 0.76, cz], bank.sagePlaster, { uvScale: 2.2 });
  // Corner aluminum mullions
  for (const sx of [-width * 0.48, width * 0.48]) {
    for (const sz of [-depth * 0.48, depth * 0.48]) {
      addBox(staticG, [0.14, 1.35, 0.14], [cx + sx, 1.92, cz + sz], bank.aluminum);
    }
  }
  // Sliding glass ticket windows + lit interior monitor box + sill counters
  addBox(staticG, [width * 0.88, 1.18, depth * 0.88], [cx, 1.92, cz], bank.windowGlass);
  addBox(dynamicG, [width * 0.55, 0.72, depth * 0.55], [cx, 1.88, cz], bank.warmWindowLit, { castShadow: false });
  addBox(staticG, [width + 0.26, 0.10, depth + 0.26], [cx, 1.30, cz], bank.darkSlate);
  // Security window grille bars on front & back
  for (let gz = -depth * 0.32; gz <= depth * 0.34; gz += 0.28) {
    addBox(staticG, [width + 0.04, 1.12, 0.03], [cx, 1.92, cz + gz], bank.darkMetal);
  }
  // Overhanging RCC canopy roof + fascia + rooftop AC box
  addBox(staticG, [width + 0.95, 0.22, depth + 0.95], [cx, 2.74, cz], roofMat, { uvScale: 2.2 });
  addBox(staticG, [width + 1.02, 0.14, depth + 1.02], [cx, 2.88, cz], bank.modernWhite, { uvScale: 2.2 });
  addBox(staticG, [0.55, 0.46, 0.65], [cx - width * 0.25, 3.16, cz], bank.acBox);
  addCyl(staticG, 0.14, 0.14, 0.06, [cx - width * 0.25, 3.16, cz + 0.33], bank.darkSlate, 8, [Math.PI / 2, 0, 0]);
}

function buildRupshaWaterfrontCorridor(staticG, dynamicG, bank, m, helpers) {
  const riverVessels = [];

  // 1) Continuous Sloped Concrete CC-Block Revetment Embankment + Yellow/Black Jersey Barrier + Quay Apron along the shoreline
  for (let z = -60; z <= 685; z += 18) {
    const zNext = z + 18;
    const x0 = getRiverWestBankX(z);
    const x1 = getRiverWestBankX(zNext);
    const midX = (x0 + x1) * 0.5;
    const midZ = (z + zNext) * 0.5;
    const dx = x1 - x0;
    const dz = zNext - z;
    const segLen = Math.hypot(dx, dz) + 0.5;
    const yaw = Math.atan2(dx, dz);

    // Sloped concrete/boulder embankment bank wall plunging smoothly beneath river water (y = -0.78..+0.22)
    addBox(staticG, [4.8, 1.15, segLen], [midX - 0.5, -0.32, midZ], bank.riverRevetment, { rotY: yaw, rotZ: -0.22, uvScale: 2.8 });
    // Continuous riverside paved shoulder connecting embankment to waterfront road
    addBox(staticG, [16.0, 0.10, segLen + 0.4], [midX - 9.8, -0.02, midZ], m.concrete, { rotY: yaw, castShadow: false, uvScale: 3.4 });

    // Promenade stone coping walkway + hazard Jersey barrier (open at Launch Ghat 20..46 & Ferry Terminal 636..656)
    const inOpening = (midZ > 18 && midZ < 48) || (midZ > 635 && midZ < 658);
    if (!inOpening) {
      addBox(staticG, [1.8, 0.24, segLen], [midX - 2.4, 0.08, midZ], m.brick, { rotY: yaw, uvScale: 2.2 });
      addBox(staticG, [0.42, 0.68, segLen * 0.94], [midX - 1.55, 0.44, midZ], bank.hazardBarrier, { rotY: yaw });
    }
    if (z % 36 === 0) {
      addUtilityPoleAndLamp(staticG, dynamicG, bank, midX - 2.95, midZ, 1, false);
      if (!inOpening && Math.abs(z % 72) === 0) {
        helpers.addPalm?.(dynamicG, midX - 5.2, 0, midZ + 4, 7.6, z * 0.03, 0.4);
      }
    }
  }

  // 2) Paved Rupsha Strand Road Waterfront Row & Riverfront Godowns/Shops (z = -25..625)
  const strandRoadPts = [];
  for (let z = -25; z <= 635; z += 35) {
    strandRoadPts.push([getRupshaStrandRoadX(z), z]);
  }
  buildPavedSegmentRoad(staticG, strandRoadPts, 7.6, -0.023, m.road, 5.5);

  // 3) Natun Bazar Launch Ghat Plaza, Ticket Shed, Stepped Ghat & Moored MV RUPSHA LAUNCH (z = -18..64, bank x ~ 1163)
  const ghatBankX = getRiverWestBankX(34); // ~1163.4
  // Broad paved asphalt + concrete port forecourt spanning from Strand Rd right out to embankment (flush at y = 0.001..0.002)
  addBox(staticG, [74, 0.12, 82], [ghatBankX - 38, -0.059, 23], m.road, { castShadow: false, uvScale: 5.5 });
  addBox(staticG, [46, 0.14, 48], [ghatBankX - 24, -0.068, 34], m.concrete, { castShadow: false, uvScale: 3.2 });
  // Passenger Waiting & Ticket Shed with pitched teal tin roof
  addBox(staticG, [8.5, 0.18, 18.0], [ghatBankX - 20, 0.16, 34], m.brick, { uvScale: 2.2 });
  addBox(staticG, [9.4, 0.16, 19.2], [ghatBankX - 20, 3.65, 34], bank.tinBlue, { rotZ: -0.08, uvScale: 2.2 });
  for (const pz of [26, 34, 42]) {
    for (const px of [ghatBankX - 24, ghatBankX - 16]) {
      addCyl(staticG, 0.12, 0.14, 3.55, [px, 1.85, pz], bank.aluminum, 8);
    }
  }
  buildKioskBooth(staticG, dynamicG, bank, m, ghatBankX - 21.8, 29.0, 2.2, 3.6, bank.tinBlue);
  addIlluminatedSign(dynamicG, bank, {
    title: 'নতুন বাজার লঞ্চ টার্মিনাল · বিআইডব্লিউটিএ',
    subtitle: 'NATUN BAZAR LAUNCH GHAT · KHULNA RIVER PORT',
    bg: '#0c4a6e',
    accent: '#fef08a',
  }, [ghatBankX - 15.2, 4.18, 34], Math.PI / 2, 6.4, 1.35);

  // Broad Concrete Stepped Ghat plunging neatly into the Bhairab/Rupsha water
  for (let s = 0; s < 7; s++) {
    addBox(staticG, [1.5, 0.24, 22], [ghatBankX - 1.2 + s * 1.15, 0.14 - s * 0.13, 34], m.concrete, { uvScale: 2.5 });
  }
  // Steel Pontoon Jetty Barge & Gangway
  addBox(staticG, [10.0, 0.85, 22.0], [ghatBankX + 11.5, -0.04, 32], bank.darkSlate);
  addBox(staticG, [9.4, 0.14, 21.2], [ghatBankX + 11.5, 0.42, 32], bank.deckGreen);
  addBox(staticG, [10.5, 0.18, 3.4], [ghatBankX + 4.8, 0.14, 33], bank.darkMetal, { rotZ: -0.05 });
  for (const bz of [23, 29, 35, 41]) {
    addCyl(staticG, 0.20, 0.24, 0.85, [ghatBankX + 16.0, 0.75, bz], bank.ferryOrange, 8);
  }
  // Stacked market goods/fish crates & burlap jute sacks near jetty + parked TATA truck & CNG on port apron
  for (const [cx, cz, col] of [[ghatBankX - 9, 25, bank.tinBlue], [ghatBankX - 8, 26.5, bank.ferryOrange], [ghatBankX - 9.5, 41, bank.ropes]]) {
    addBox(staticG, [1.2, 0.9, 1.4], [cx, 0.52, cz], col);
  }
  const portCng = buildCNGAuto({
    tire: bank.darkSlate, rim: bank.aluminum, darkTrim: bank.darkMetal, chrome: bank.aluminum,
    windshield: bank.windowGlass, headlight: bank.lampBulb, taillight: bank.ferryOrange, amber: bank.ferryOrange,
    cngGreen: bank.deckGreen, cngYellow: bank.tinBlue, cngRexine: bank.darkSlate,
  });
  portCng.position.set(ghatBankX - 28, 0.08, 17);
  portCng.rotation.y = 0.65;
  staticG.add(portCng);

  // High-Detail Moored Three-Deck Bangladeshi Passenger Launch (MV RUPSHA EXPRESS)
  const launch = new THREE.Group();
  launch.position.set(ghatBankX + 25.0, -0.22, 28.0);
  launch.rotation.y = 0.14;
  // Shaped Steel Hull + Bow Prow Cone
  addBox(launch, [9.8, 2.35, 34.0], [0, 1.15, 0], bank.hullNavy);
  addBox(launch, [10.0, 0.35, 34.2], [0, 2.35, 0], bank.ferryOrange);
  const bow = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 5.2, 7.5, 4), bank.hullNavy);
  bow.rotation.x = Math.PI / 2;
  bow.rotation.z = Math.PI / 4;
  bow.scale.set(1.0, 0.45, 1.0);
  bow.position.set(0, 1.25, 20.0);
  launch.add(bow);
  // Rubber tire hull fenders + verandah deck stanchion columns + orange lifebuoy rings
  for (let fz = -12; fz <= 12; fz += 4.8) {
    const fender = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.16, 8, 12), bank.darkSlate);
    fender.position.set(-4.95, 1.2, fz);
    fender.rotation.y = Math.PI / 2;
    launch.add(fender);
    for (const sx of [-4.45, 4.45]) {
      addCyl(launch, 0.08, 0.09, 2.75, [sx, 3.85, fz - 1.0], bank.aluminum, 6);
    }
  }
  for (const lz of [-8.0, 4.0]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.09, 8, 12), bank.ferryOrange);
    ring.position.set(-4.62, 5.55, lz);
    ring.rotation.y = Math.PI / 2;
    launch.add(ring);
  }
  // 2nd & 3rd Cabin Decks with Wraparound Verandah Columns & Glass Windows
  addBox(launch, [8.6, 2.75, 29.0], [0, 3.85, -1.0], bank.launchWhite);
  addBox(launch, [9.2, 0.26, 30.5], [0, 5.25, -1.0], bank.deckGreen);
  addBox(launch, [6.8, 2.45, 21.0], [0, 6.55, -2.0], bank.launchWhite);
  addBox(launch, [7.2, 0.24, 22.0], [0, 7.82, -2.0], bank.deckGreen);
  // Warm lit cabin passenger window strips
  for (const sx of [-4.33, 4.33]) {
    addBox(launch, [0.08, 1.15, 25.0], [sx, 4.0, -1.0], bank.warmWindowLit);
    addBox(launch, [0.08, 1.05, 17.5], [sx * 0.79, 6.65, -2.0], bank.warmWindowLit);
  }
  // Pilothouse Captain Bridge + Radar Mast + Red/Green Nav Beacons
  addBox(launch, [4.6, 2.2, 6.2], [0, 8.95, 5.5], bank.launchWhite);
  addBox(launch, [4.7, 0.9, 3.8], [0, 9.15, 6.9], bank.windowGlass);
  addCyl(launch, 0.12, 0.18, 4.5, [0, 12.2, 4.8], bank.aluminum, 8);
  addBox(launch, [0.3, 0.3, 0.3], [-4.5, 5.4, 8.5], bank.lampBulb);
  dynamicG.add(launch);
  riverVessels.push({ obj: launch, baseY: -0.22, amp: 0.08, speed: 1.05, phase: 0.4 });
  helpers.addWire?.(staticG, [ghatBankX + 16.0, 0.85, 23], [ghatBankX + 20.5, 1.9, 17], bank.ropes, 0.55, 0.045);
  helpers.addWire?.(staticG, [ghatBankX + 16.0, 0.85, 41], [ghatBankX + 20.5, 1.9, 43], bank.ropes, 0.55, 0.045);

  // 4) RUPSHA FERRY TERMINAL (x ~ 1140..1295, z ~ 615..676)
  const ferryBankX = getRiverWestBankX(646); // ~1242.9
  // Broad paved marshalling yard spanning both sides of Ferry Approach Rd (flush at y = 0.001)
  addBox(staticG, [104, 0.08, 62], [1188, -0.039, 646], m.road, { castShadow: false, uvScale: 5.5 });
  addBox(staticG, [28, 0.24, 34], [ferryBankX - 10, 0.14, 646], m.concrete, { uvScale: 3.0 });
  // Painted Ferry Boarding Queue Lane Stripes & Safety Bollards on Terminal Apron
  for (const lz of [640.5, 646.0, 651.5]) {
    for (let lx = 1196; lx <= 1230; lx += 5.5) {
      addBox(staticG, [2.8, 0.02, 0.18], [lx, 0.07, lz], bank.creamTrim, { castShadow: false });
    }
  }
  for (const bz of [637.5, 655.0]) {
    for (let bx = 1204; bx <= 1236; bx += 6.0) {
      addCyl(staticG, 0.14, 0.16, 0.85, [bx, 0.45, bz], bank.ferryOrange, 6);
    }
  }
  // Ferry Passenger Waiting Pavilion & Ghat Tea Kiosk along South Terminal Edge (x = 1206, z = 665)
  addBox(staticG, [18.0, 0.22, 6.4], [1208.0, 0.11, 665.0], m.brick, { uvScale: 2.2 });
  addBox(staticG, [19.0, 0.16, 7.2], [1208.0, 3.35, 665.0], bank.tinBlue, { rotX: 0.08, uvScale: 2.2 });
  for (const px of [1200, 1208, 1216]) {
    for (const pz of [662.2, 667.8]) {
      addCyl(staticG, 0.11, 0.13, 3.25, [px, 1.72, pz], bank.aluminum, 6);
    }
  }
  buildKioskBooth(staticG, dynamicG, bank, m, 1193.5, 664.0, 3.0, 2.8, bank.tinRust);
  addIlluminatedSign(dynamicG, bank, {
    title: 'পদ্মা-রূপসা ফেরিঘাট টি স্টল ও কাউন্টার',
    subtitle: 'RUPSHA FERRY PASSENGER SHED',
    bg: '#14532d',
    accent: '#fde047',
  }, [1208.0, 3.85, 661.5], 0, 6.2, 0.95);
  // Waiting Cargo Truck & CNG Auto queued cleanly on the boarding apron!
  const portQueueBank = {
    tire: bank.darkSlate, rim: bank.aluminum, darkTrim: bank.darkMetal, chrome: bank.aluminum,
    windshield: bank.windowGlass, headlight: bank.lampBulb, taillight: bank.ferryOrange, amber: bank.ferryOrange,
    cngGreen: bank.deckGreen, cngYellow: bank.tinBlue, cngRexine: bank.darkSlate,
    truckCab: bank.ferryOrange, truckBed: bank.tinBlue, plate: bank.creamTrim,
  };
  const queueTruck = buildBanglaTruck(portQueueBank);
  queueTruck.position.set(1224.0, 0.07, 643.8);
  queueTruck.rotation.y = Math.PI * 0.5;
  staticG.add(queueTruck);
  const queueCng = buildCNGAuto(portQueueBank);
  queueCng.position.set(1217.5, 0.07, 649.8);
  queueCng.rotation.y = Math.PI * 0.48;
  staticG.add(queueCng);
  // Coastal Palms & Port Yard High-Mast Light around Ferry Terminal Apron
  for (const [px, pz] of [[1182, 622], [1222, 622], [1180, 669], [1225, 669]]) {
    helpers.addPalm?.(dynamicG, px, 0, pz, 7.8, (px + pz) * 0.02, 0.35);
  }
  addCyl(staticG, 0.22, 0.36, 13.5, [1226.0, 6.75, 632.0], bank.steelBlue, 8);
  addBox(dynamicG, [2.8, 0.55, 0.7], [1226.0, 13.6, 632.0], bank.lampBulb);

  // BIWTC Steel Truss Welcome Gantry Arch spanning Rupsha Approach Rd
  const archX = 1198.0;
  addCyl(staticG, 0.28, 0.34, 7.6, [archX, 3.8, 639.0], bank.steelBlue, 10);
  addCyl(staticG, 0.28, 0.34, 7.6, [archX, 3.8, 658.0], bank.steelBlue, 10);
  addBox(staticG, [1.2, 1.6, 20.5], [archX, 7.2, 648.5], bank.steelBlue);
  addIlluminatedSign(dynamicG, bank, {
    title: 'বিআইডব্লিউটিসি রূপসা ফেরি টার্মিনাল · N7',
    subtitle: 'BIWTC RUPSHA FERRY GHAT · KHULNA — MONGLA CROSSING',
    bg: '#064e3b',
    accent: '#d9ed9c',
  }, [archX - 0.65, 7.2, 648.5], -Math.PI / 2, 11.2, 1.85);

  // Detailed Glazed Ferry Toll Booth & Boom Gate
  buildKioskBooth(staticG, dynamicG, bank, m, archX + 4.0, 642.4, 2.8, 2.8, bank.ferryOrange);
  addIlluminatedSign(dynamicG, bank, {
    title: 'ফেরি টোল ও টিকেট কাউন্টার',
    subtitle: 'BIWTC TOLL PLAZA · LANE 1',
    bg: '#7c2d12',
    accent: '#fde047',
  }, [archX + 2.45, 2.74, 642.4], -Math.PI / 2, 2.6, 0.54);
  addBox(staticG, [0.14, 0.12, 6.2], [archX + 4.0, 1.15, 647.2], bank.hazardBarrier);

  // Hydraulic Steel Ferry Pontoon Ramp connecting bank -> Ferry Bow
  addBox(staticG, [16.5, 0.38, 9.8], [ferryBankX + 6.5, 0.14, 646], bank.darkSlate, { rotZ: -0.03 });
  addBox(staticG, [16.5, 0.22, 0.45], [ferryBankX + 6.5, 0.68, 641.2], bank.hazardBarrier, { rotZ: -0.03 });
  addBox(staticG, [16.5, 0.22, 0.45], [ferryBankX + 6.5, 0.68, 650.8], bank.hazardBarrier, { rotZ: -0.03 });

  // Double-Ended Ro-Ro Vehicle Ferry with Bridge, Twin Funnels & Loaded Cargo Vehicles!
  const ferry = new THREE.Group();
  ferry.position.set(ferryBankX + 33.5, -0.20, 646.0);
  ferry.rotation.y = Math.PI * 0.49;
  addBox(ferry, [11.8, 1.85, 38.0], [0, 0.92, 0], bank.hullNavy);
  addBox(ferry, [10.4, 0.22, 37.0], [0, 1.88, 0], bank.deckGreen);
  // Bow & Stern hinged drop ramps
  addBox(ferry, [8.6, 0.18, 3.8], [0, 1.72, 20.2], bank.ferryOrange, { rotX: 0.18 });
  addBox(ferry, [8.6, 0.18, 3.8], [0, 1.72, -20.2], bank.ferryOrange, { rotX: -0.18 });
  // Elevated Starboard Captain Bridge Superstructure + Smokestack
  addBox(ferry, [2.6, 5.4, 15.0], [4.5, 4.5, 0], bank.launchWhite);
  addBox(ferry, [2.8, 0.36, 15.6], [4.5, 7.2, 0], bank.ferryOrange);
  addBox(ferry, [0.12, 1.15, 9.5], [3.15, 5.8, 0], bank.windowGlass);
  addCyl(ferry, 0.48, 0.58, 2.8, [4.5, 8.6, -3.5], bank.hullNavy, 10);
  // Parked TATA Truck & CNG right aboard the Ferry Car Deck!
  const fBank = {
    tire: bank.darkSlate,
    rim: bank.aluminum,
    darkTrim: bank.darkMetal,
    chrome: bank.aluminum,
    windshield: bank.windowGlass,
    headlight: bank.lampBulb,
    taillight: bank.ferryOrange,
    amber: bank.ferryOrange,
    cngGreen: bank.deckGreen,
    cngYellow: bank.tinBlue,
    cngRexine: bank.darkSlate,
    truckCab: bank.ferryOrange,
    truckBed: bank.tinBlue,
    plate: bank.creamTrim,
  };
  const deckTruck = buildBanglaTruck(fBank);
  deckTruck.position.set(-1.5, 1.98, -3.5);
  ferry.add(deckTruck);
  const deckCng = buildCNGAuto(fBank);
  deckCng.position.set(1.2, 1.98, 5.5);
  ferry.add(deckCng);
  dynamicG.add(ferry);
  riverVessels.push({ obj: ferry, baseY: -0.20, amp: 0.06, speed: 0.85, phase: 1.6 });

  // Curved Tapered Wooden Country Boats (নৌকা) gliding gently in midstream
  const noukaShape = new THREE.Shape();
  noukaShape.moveTo(0, 4.2);
  noukaShape.quadraticCurveTo(0.95, 1.6, 0.88, 0);
  noukaShape.quadraticCurveTo(0.92, -1.8, 0, -4.2);
  noukaShape.quadraticCurveTo(-0.92, -1.8, -0.88, 0);
  noukaShape.quadraticCurveTo(-0.95, 1.6, 0, 4.2);
  const noukaHullGeo = new THREE.ExtrudeGeometry(noukaShape, { depth: 0.62, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 }).toNonIndexed();
  noukaHullGeo.rotateX(Math.PI / 2);

  for (const [bx, bz, yaw, phase] of [
    [getRiverWestBankX(12) + 28, 12, 0.24, 0.5],
    [getRiverWestBankX(140) + 34, 140, -0.18, 1.4],
    [getRiverWestBankX(310) + 32, 310, 0.30, 2.2],
    [getRiverWestBankX(510) + 36, 510, 0.12, 0.8],
    [getRiverWestBankX(680) + 38, 680, -0.22, 1.9],
  ]) {
    const boat = new THREE.Group();
    boat.position.set(bx, -0.24, bz);
    boat.rotation.y = yaw;
    const hull = new THREE.Mesh(noukaHullGeo, bank.woodBoat);
    hull.position.y = 0.55;
    hull.castShadow = true;
    boat.add(hull);
    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.84, 3.2, 10, 1, false, 0, Math.PI), bank.bambooCanopy);
    canopy.rotation.z = Math.PI / 2;
    canopy.rotation.y = Math.PI / 2;
    canopy.position.set(0, 0.55, -0.2);
    boat.add(canopy);
    dynamicG.add(boat);
    riverVessels.push({ obj: boat, baseY: -0.24, amp: 0.09, speed: 1.65, phase });
  }

  return riverVessels;
}

function buildTaltolaNeighborhoodCorridor(staticG, dynamicG, bank, m, helpers, treesG = staticG) {
  // Surrounds enterable 5-Story Taltola House at TALTOLA_HOUSE_OFFSET along Tootpara Taltola Hospital Cross Rd
  const ox = TALTOLA_HOUSE_OFFSET.x;
  const oz = TALTOLA_HOUSE_OFFSET.z;

  // Restored Kawsar Bhai's original realistic Taltola House street (4.2m asphalt road, open concrete side drains with water, curbs, gate bridge slab & fallen leaves)
  const crossLanePts = [
    [ox - 5.8, oz - 53.0],
    [ox - 3.2, oz - 44.0],
    [ox, oz - 40.5],
    [ox, oz + 40.5],
    [ox - 0.8, oz + 49.5],
    [ox - 1.8, oz + 59.0],
  ];
  addBox(staticG, [4.2, 0.14, 82.0], [ox, -0.067, oz], m.road, { castShadow: false, uvScale: 5.5 });

  // Seamless north & south modern paved road connectors joining Taltola street cleanly to Khan Jahan Ali Rd (zero building/footpath overlap!)
  buildPavedSegmentRoad(staticG, [[ox, oz - 40.5], [ox, 152.4]], 5.4, -0.024, m.road, 5.5);
  buildPavedSegmentRoad(staticG, crossLanePts.slice(3), 4.6, -0.025, m.road, 5.5);
  buildPavedSegmentRoad(staticG, [[ox, oz + 38.2], [ox - 24.0, oz + 36.8]], 4.6, -0.026, m.road, 5.5);

  // Open concrete drains on BOTH sides with standing drain water & raised road-edge curbs (exact Kawsar Taltola street spec)
  for (const side of [-1, 1]) {
    const dx = ox + side * 2.36;
    addBox(staticG, [0.50, 0.08, 82.0], [dx, -0.32, oz], m.darkConcrete, { castShadow: false });
    addBox(staticG, [0.08, 0.34, 82.0], [ox + side * 2.09, -0.15, oz], m.concrete);
    addBox(staticG, [0.08, 0.34, 82.0], [ox + side * 2.63, -0.15, oz], m.concrete);
    addBox(staticG, [0.35, 0.012, 81.5], [dx, -0.255, oz], m.drainWater, { castShadow: false });
    addBox(staticG, [0.12, 0.10, 82.0], [ox + side * 2.02, 0.008, oz], m.concrete);
  }

  // Concrete gate entry bridge slab over East drain right in front of Taltola House main gate
  addBox(staticG, [1.0, 0.14, 4.75], [ox + 2.34, 0.012, oz], m.concrete);

  // West concrete drain crossing slabs
  for (const zOff of [-31, -18, 12, 27]) {
    addBox(staticG, [0.56, 0.09, 1.1], [ox - 2.36, -0.018, oz + zOff], m.concrete);
  }

  // Red-brick footpaths outside the open drains (East leaves gate opening at z=971..979)
  addBox(staticG, [1.05, 0.10, 35.5], [ox + 3.22, 0.01, oz - 21.25], m.brick, { uvScale: 2.2 });
  addBox(staticG, [1.05, 0.10, 35.5], [ox + 3.22, 0.01, oz + 21.25], m.brick, { uvScale: 2.2 });
  addBox(staticG, [1.35, 0.10, 74.0], [ox - 3.35, 0.01, oz], m.brick, { uvScale: 2.2 });

  // Green tropical roadside verges, tea-garden lawn & shaded compound plots
  addBox(staticG, [9.2, 0.08, 22.5], [ox - 9.0, 0.015, oz + 4.2], m.grass, { castShadow: false, uvScale: 2.6 });
  addBox(staticG, [4.0, 0.08, 12.0], [ox + 4.8, 0.015, oz - 9.5], m.grass, { castShadow: false, uvScale: 2.2 });
  addBox(staticG, [4.6, 0.08, 7.6], [ox + 5.2, 0.015, oz + 10.6], m.grass, { castShadow: false, uvScale: 2.2 });
  addBox(staticG, [7.2, 0.08, 10.5], [ox - 7.8, 0.015, oz + 38.5], m.grass, { castShadow: false, uvScale: 2.5 });

  // Populate Taltola House lawns & roadside verges with the new 3D Durba Grass Model (durba_grass_3d.glb)
  const durbaLoader = new GLTFLoader();
  durbaLoader.load(
    './assets/durba_grass_3d.glb',
    (gltf) => {
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
          map: srcMat?.map || null,
          color: srcMat?.map ? new THREE.Color(0xffffff) : new THREE.Color(0x3f7d24),
          roughness: 0.85,
          metalness: 0.0,
          side: THREE.DoubleSide,
        });
        clumpTemplates.push({ geom, mat });
      });
      if (!clumpTemplates.length) return;

      const rand = seeded(197504);
      const taltolaLawnRects = [
        { x0: ox - 13.4, x1: ox - 4.6, z0: oz - 6.8, z1: oz + 15.2 },
        { x0: ox + 3.0,  x1: ox + 6.6, z0: oz - 15.2, z1: oz - 3.8 },
        { x0: ox + 3.1,  x1: ox + 7.3, z0: oz + 7.0,  z1: oz + 14.2 },
        { x0: ox - 11.2, x1: ox - 4.4, z0: oz + 33.4, z1: oz + 43.5 },
      ];
      const count = 80;
      const dummy = new THREE.Object3D();
      const col = new THREE.Color();

      for (const { geom, mat } of clumpTemplates) {
        const inst = new THREE.InstancedMesh(geom, mat, count);
        inst.castShadow = false;
        inst.receiveShadow = false;
        for (let i = 0; i < count; i++) {
          const rect = taltolaLawnRects[i % taltolaLawnRects.length];
          const gx = rect.x0 + rand() * (rect.x1 - rect.x0);
          const gz = rect.z0 + rand() * (rect.z1 - rect.z0);
          dummy.position.set(gx, 0.018, gz);
          dummy.rotation.set((rand() - 0.5) * 0.06, rand() * Math.PI * 2, (rand() - 0.5) * 0.06);
          const sx = 1.05 + rand() * 0.45;
          const sy = 0.09 + rand() * 0.045;
          const sz = 1.05 + rand() * 0.45;
          dummy.scale.set(sx, sy, sz);
          dummy.updateMatrix();
          inst.setMatrixAt(i, dummy.matrix);
          col.setHSL(0.27 + (rand() - 0.5) * 0.04, 0.25 + rand() * 0.15, 0.78 + rand() * 0.18);
          inst.setColorAt(i, col);
        }
        inst.instanceMatrix.needsUpdate = true;
        if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
        dynamicG.add(inst);
      }
    },
    undefined,
    () => {}
  );

  // Clean open Taltola Street frontage around our 5-Story Taltola House (filler roadside buildings removed)
  // Street Signpole outside Taltola House gate
  addCyl(staticG, 0.06, 0.08, 3.6, [ox + 2.0, 1.8, oz + 8.8], bank.darkMetal, 8);
  addIlluminatedSign(dynamicG, bank, {
    title: 'তালতলা হাসপাতাল ক্রস রোড · তালতলার বাসা',
    subtitle: 'TALTOLA HOSPITAL CROSS RD · SOUTH TOOTPARA',
    bg: '#0f3d2e',
    accent: '#d9ed9c',
  }, [ox + 2.0, 3.42, oz + 8.8], -Math.PI / 2, 3.8, 1.15);

  // Parked Green CNG Auto-Rickshaw near South-West bazaar corner
  const cornerCng = buildCNGAuto({
    tire: bank.darkSlate, rim: bank.aluminum, darkTrim: bank.darkMetal, chrome: bank.aluminum,
    windshield: bank.windowGlass, headlight: bank.lampBulb, taillight: bank.ferryOrange, amber: bank.ferryOrange,
    cngGreen: bank.deckGreen, cngYellow: bank.tinBlue, cngRexine: bank.darkSlate,
  });
  cornerCng.position.set(ox - 1.9, 0.02, oz + 29.0);
  cornerCng.rotation.y = 0.08;
  staticG.add(cornerCng);

  // Utility Poles placed cleanly along the West footpath clear of the curved carriageway + Overhead Wires + Palms/Trees
  const crossLaneRoadX = (zVal) => {
    for (let i = 0; i < crossLanePts.length - 1; i++) {
      const [x0, z0] = crossLanePts[i];
      const [x1, z1] = crossLanePts[i + 1];
      if (zVal <= z1 || i === crossLanePts.length - 2) {
        const t = THREE.MathUtils.clamp((zVal - z0) / Math.max(0.001, z1 - z0), 0, 1);
        return x0 + (x1 - x0) * t;
      }
    }
    return ox;
  };
  // BIG High-Quality Leader Wall Posters right on Taltola House front boundary wall (facing the street!)
  addBigNetaWallPoster(dynamicG, 0, ox + 2.28, 1.34, oz - 4.7, -Math.PI / 2, 1.92);
  addBigNetaWallPoster(dynamicG, 1, ox + 2.28, 1.34, oz + 4.7, -Math.PI / 2, 1.92);
  addBigNetaWallPoster(dynamicG, 2, ox + 6.02, 5.20, oz - 0.1, -Math.PI / 2, 2.75);

  const poles = [];
  const taltolaPoleSpecs = [
    [oz - 28, 2, 0], // মোটা কংক্রিটের খাম্বা + Z X হুজ্জা
    [oz - 4,  0, 1], // চিকন স্টিলের খাম্বা + সাবিদ ফালা
    [oz + 10, 2, 2], // মোটা কংক্রিটের খাম্বা + পি.টি.আই রাফিন
    [oz + 24, 0, 0], // চিকন স্টিলের খাম্বা + Z X হুজ্জা
    [oz + 42, 2, 1], // মোটা কংক্রিটের খাম্বা + সাবিদ ফালা
  ];
  for (const [pz, tier] of taltolaPoleSpecs) {
    const poleX = Math.min(ox - 3.65, crossLaneRoadX(pz) - 3.45);
    addUtilityPoleAndLamp(staticG, dynamicG, bank, poleX, pz, 1, false, poles, tier);
  }
  for (let i = 0; i < poles.length - 1; i++) {
    const tangledSpecs = [
      [0.0, 0.0, 0.45, 0.016],
      [-0.36, -0.45, 0.62, 0.018],
      [0.34, -0.58, 0.56, 0.016],
      [-0.22, -2.55, 0.96, 0.024],
      [0.24, -2.95, 1.36, 0.020],
      [-0.18, -3.35, 1.62, 0.018],
      [0.14, -3.65, 1.18, 0.016],
      [-0.28, -3.15, 1.78, 0.015],
      [0.26, -2.80, 0.88, 0.017],
      [-0.08, -3.50, 1.42, 0.015],
      [0.30, -3.22, 1.24, 0.016],
      [-0.32, -2.90, 1.50, 0.015],
    ];
    for (let k = 0; k < tangledSpecs.length; k++) {
      const [lat, dy, sag, rad] = tangledSpecs[k];
      const dy2 = dy + ((k % 3) - 1) * 0.28;
      const lat2 = lat + (k % 2 === 0 ? 0.18 : -0.16);
      helpers.addWire?.(
        staticG,
        [poles[i][0] + lat, poles[i][1] + dy, poles[i][2]],
        [poles[i + 1][0] + lat2, poles[i + 1][1] + dy2, poles[i + 1][2]],
        m.wire,
        sag,
        rad,
      );
    }
  }
  const taltolaDrops = [
    [poles[1], [ox + 4.4, 4.1, oz - 2.2], 0.74],
    [poles[1], [ox + 4.4, 6.8, oz + 0.8], 0.58],
    [poles[1], [ox + 4.4, 9.4, oz + 3.2], 0.65],
    [poles[1], [ox + 4.4, 5.4, oz - 5.5], 0.82],
    [poles[1], [ox - 11.5, 4.6, oz - 6.0], 0.78],
    [poles[1], [ox - 11.5, 6.2, oz + 2.4], 0.88],
    [poles[2], [ox + 4.4, 4.4, oz + 6.4], 0.85],
    [poles[2], [ox + 4.4, 7.2, oz + 12.5], 0.70],
    [poles[2], [ox - 11.0, 5.1, oz + 16.5], 0.72],
    [poles[2], [ox - 11.0, 3.8, oz + 24.0], 0.82],
    [poles[0], [ox + 5.2, 5.2, oz - 22.0], 0.76],
    [poles[0], [ox - 11.0, 4.5, oz - 30.0], 0.70],
  ];
  for (const [pStart, pEnd, sag] of taltolaDrops) {
    if (pStart) {
      helpers.addWire?.(staticG, [pStart[0], pStart[1] - 3.35, pStart[2]], pEnd, m.wire, sag, 0.015);
    }
  }
  helpers.addPalm?.(dynamicG, ox - 3.6, 0, oz - 6.0, 6.8, 0.4, 0.35);
  helpers.addPalm?.(dynamicG, ox + 3.8, 0, oz - 12.2, 7.2, -0.3, 0.4);
  helpers.addPalm?.(dynamicG, ox - 4.4, 0, oz + 35.2, 7.0, 0.35, 0.25);
  helpers.addBroadleafTree?.(treesG, ox - 5.1, 0, oz + 16.5, 1.0, 771);
  helpers.addBroadleafTree?.(treesG, ox - 7.6, 0, oz + 1.8, 0.92, 783);
  helpers.addBroadleafTree?.(treesG, ox - 6.6, 0, oz - 27.5, 0.95, 797);
  helpers.addBroadleafTree?.(treesG, ox + 4.1, 0, oz + 35.8, 0.96, 809);
}

/**
 * Builds a high-detail Taltola-style Bangladeshi multi-story residential house
 * (compound boundary wall, gate pillars with globe lamps, steel gate, recessed balconies,
 * sunshade chajjas, window grills, AC units, rooftop parapet & Gazi water tank — zero shops).
 */
function buildTaltolaStyleResidence(staticG, dynamicG, bank, opts) {
  const {
    cx, cz, widthX = 9.4, lengthZ = 13.8, floors = 4, facing = -1,
    wallMat = bank.creamTrim, bandMat = bank.sagePlaster, seed = 4001,
  } = opts;
  const rnd = seeded(seed);
  const fDir = facing;
  const wallX = cx + fDir * (widthX * 0.5 + 1.15);

  // Compound boundary wall with gate opening, pillar caps & glowing pillar globe lamps
  const segLen = (lengthZ - 3.0) * 0.5;
  addBox(staticG, [0.30, 2.05, segLen], [wallX, 1.02, cz - (1.5 + segLen * 0.5)], bank.brickRed, { uvScale: 2.2 });
  addBox(staticG, [0.30, 2.05, segLen], [wallX, 1.02, cz + (1.5 + segLen * 0.5)], bank.brickRed, { uvScale: 2.2 });
  addBox(staticG, [0.40, 0.14, segLen + 0.1], [wallX, 2.08, cz - (1.5 + segLen * 0.5)], bank.creamTrim);
  addBox(staticG, [0.40, 0.14, segLen + 0.1], [wallX, 2.08, cz + (1.5 + segLen * 0.5)], bank.creamTrim);
  // Steel residential main gate (teal/slate bars)
  addBox(staticG, [0.08, 1.95, 2.86], [wallX, 1.0, cz], bank.shutterBlue, { uvScale: 1.4 });
  addBox(staticG, [0.14, 0.12, 2.94], [wallX, 1.98, cz], bank.darkMetal);
  for (const gz of [cz - 1.55, cz + 1.55]) {
    addBox(staticG, [0.48, 2.45, 0.48], [wallX, 1.22, gz], bank.creamTrim);
    addBox(staticG, [0.56, 0.12, 0.56], [wallX, 2.48, gz], bank.darkSlate);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), bank.lampBulb);
    globe.position.set(wallX, 2.70, gz);
    dynamicG.add(globe);
  }
  // Courtyard paved strip between gate and building front
  addBox(staticG, [2.2, 0.14, lengthZ], [cx + fDir * (widthX * 0.5 + 0.15), 0.07, cz], bank.dampPlinth, { castShadow: false, uvScale: 2.0 });

  // Main multi-story Taltola-style residential structure (no ground shops — pure residential!)
  const floorH = 3.05;
  const totalH = floors * floorH;
  const frontX = cx + fDir * (widthX * 0.5);
  addBox(staticG, [widthX + 0.16, 0.38, lengthZ + 0.16], [cx, 0.19, cz], bank.dampPlinth, { uvScale: 2.2 });
  addBox(staticG, [widthX, totalH, lengthZ], [cx, totalH * 0.5, cz], wallMat, { uvScale: 2.8 });

  // Accent vertical stair-bay pilaster & horizontal floor cornice bands
  addBox(staticG, [0.22, totalH, 2.4], [frontX + fDir * 0.06, totalH * 0.5, cz], bandMat, { uvScale: 2.2 });
  for (let f = 0; f < floors; f++) {
    const fy = f * floorH;
    addBox(staticG, [widthX + 0.46, 0.20, lengthZ + 0.24], [cx + fDir * 0.14, fy + floorH, cz], bank.creamTrim, { uvScale: 2.4 });

    if (f === 0) {
      // Ground-floor residential wooden front entrance door + porch canopy + grilled windows
      addBox(staticG, [0.16, 2.25, 1.35], [frontX + fDir * 0.04, 1.18, cz], bank.woodBoat);
      addBox(staticG, [1.15, 0.14, 2.2], [frontX + fDir * 0.55, 2.52, cz], bank.creamTrim);
      for (const wz of [cz - 3.9, cz + 3.9]) {
        addBox(staticG, [0.16, 1.35, 1.85], [frontX + fDir * 0.04, 1.55, wz], bank.windowGlass);
        addBox(staticG, [0.34, 0.12, 2.05], [frontX + fDir * 0.14, 2.28, wz], bank.creamTrim);
        for (const bar of [-0.55, 0, 0.55]) {
          addBox(staticG, [0.05, 1.32, 0.04], [frontX + fDir * 0.12, 1.55, wz + bar], bank.darkMetal);
        }
      }
    } else {
      // Upper floors: two recessed residential balconies flanking central stair window (just like Taltola House!)
      addBox(staticG, [0.16, 1.55, 1.35], [frontX + fDir * 0.12, fy + 1.55, cz], rnd() > 0.5 ? bank.warmWindowLit : bank.windowGlass);
      for (const bz of [cz - 3.8, cz + 3.8]) {
        const bw = 3.2;
        addBox(staticG, [1.05, 0.16, bw], [frontX + fDir * 0.50, fy + 0.10, bz], bank.creamTrim);
        addBox(staticG, [0.14, 0.42, bw], [frontX + fDir * 0.96, fy + 0.36, bz], bandMat);
        for (const rOff of [-1.1, -0.55, 0, 0.55, 1.1]) {
          addBox(staticG, [0.04, 0.58, 0.04], [frontX + fDir * 0.96, fy + 0.84, bz + rOff], bank.darkMetal);
        }
        addBox(staticG, [0.06, 0.06, bw + 0.04], [frontX + fDir * 0.96, fy + 1.12, bz], bank.aluminum);
        addBox(staticG, [0.18, 2.15, 2.1], [frontX - fDir * 0.04, fy + 1.20, bz], rnd() > 0.65 ? bank.warmWindowLit : bank.windowGlass);
        if (rnd() > 0.55) {
          addBox(staticG, [0.34, 0.52, 0.72], [frontX + fDir * 0.18, fy + 0.46, bz + 1.1], bank.acBox);
        }
      }
    }
  }

  // Rooftop parapet wall + mumty stairhead + Gazi 2000L black water tank
  addBox(staticG, [0.22, 0.95, lengthZ], [frontX - fDir * 0.11, totalH + 0.48, cz], wallMat, { uvScale: 2.4 });
  addBox(staticG, [0.22, 0.95, lengthZ], [cx - fDir * (widthX * 0.5 - 0.11), totalH + 0.48, cz], wallMat, { uvScale: 2.4 });
  addBox(staticG, [widthX, 0.95, 0.22], [cx, totalH + 0.48, cz - lengthZ * 0.5 + 0.11], wallMat, { uvScale: 2.4 });
  addBox(staticG, [widthX, 0.95, 0.22], [cx, totalH + 0.48, cz + lengthZ * 0.5 - 0.11], wallMat, { uvScale: 2.4 });
  addBox(staticG, [3.0, 2.35, 3.2], [cx - fDir * 1.1, totalH + 1.18, cz], bank.creamTrim, { uvScale: 2.4 });
  addCyl(staticG, 0.64, 0.66, 1.38, [cx + fDir * 1.4, totalH + 1.20, cz - 2.6], bank.waterTank, 10);
}

/**
 * Builds an authentic Bangladeshi semi-pucca Tin-Roof House (টিনের বাড়ি)
 * with brick plinth, plastered walls, pitched corrugated tin roof, veranda posts & wooden door.
 */
function buildTinRoofHouse(staticG, bank, opts) {
  const { cx, cz, widthX = 7.4, lengthZ = 10.2, facing = -1, tinMat = bank.tinBlue } = opts;
  const fDir = facing;
  const frontX = cx + fDir * (widthX * 0.5);

  // Raised damp brick plinth & front veranda steps
  addBox(staticG, [widthX + 1.4, 0.46, lengthZ + 0.6], [cx + fDir * 0.45, 0.23, cz], bank.dampPlinth, { uvScale: 2.0 });
  // Brick & plastered residential walls
  addBox(staticG, [widthX, 2.85, lengthZ], [cx, 1.88, cz], bank.brickRed, { uvScale: 2.2 });
  // Pitched double-slope corrugated tin roof (চাল)
  addBox(staticG, [widthX * 0.62, 0.10, lengthZ + 0.9], [cx + fDir * (widthX * 0.26), 3.68, cz], tinMat, { rotZ: -fDir * 0.24, uvScale: 1.6 });
  addBox(staticG, [widthX * 0.62, 0.10, lengthZ + 0.9], [cx - fDir * (widthX * 0.26), 3.68, cz], tinMat, { rotZ: fDir * 0.24, uvScale: 1.6 });
  // Front veranda sloping tin awning + wooden/steel veranda posts
  addBox(staticG, [1.85, 0.08, lengthZ + 0.6], [frontX + fDir * 0.82, 2.74, cz], tinMat, { rotZ: -fDir * 0.20, uvScale: 1.6 });
  for (const pz of [cz - lengthZ * 0.44, cz - 1.4, cz + 1.4, cz + lengthZ * 0.44]) {
    addCyl(staticG, 0.06, 0.07, 2.35, [frontX + fDir * 1.48, 1.60, pz], bank.woodBoat, 6);
  }
  // Wooden front door & twin shuttered windows
  addBox(staticG, [0.14, 2.05, 1.05], [frontX + fDir * 0.04, 1.48, cz], bank.woodBoat);
  for (const wz of [cz - 2.9, cz + 2.9]) {
    addBox(staticG, [0.14, 1.15, 1.25], [frontX + fDir * 0.04, 1.72, wz], bank.windowGlass);
    addBox(staticG, [0.18, 0.10, 1.40], [frontX + fDir * 0.06, 2.32, wz], bank.creamTrim);
  }
  // Low compound front wall with gap for entrance
  const wX = frontX + fDir * 1.85;
  addBox(staticG, [0.24, 1.25, lengthZ * 0.36], [wX, 0.62, cz - lengthZ * 0.32], bank.brickRed, { uvScale: 2.0 });
  addBox(staticG, [0.24, 1.25, lengthZ * 0.36], [wX, 0.62, cz + lengthZ * 0.32], bank.brickRed, { uvScale: 2.0 });
}

/**
 * Builds the realistic Altapole Lane (আলতাপোল লেন) Corridor along its real OSM trace
 * connecting Lower Jessore Road (z = -519) to South Central Road (z = -296) at x ≈ 166..170:
 * - Narrower slightly weathered/cracked lane (3.4m) + wider raised brick footpaths (1.75m, high curb)
 * - Ispahani Company (ইস্পাহানি কোম্পানি) & corner shops ONLY at the two lane heads
 * - Pure residential Taltola-style houses + semi-pucca tin-roof houses (টিনের বাড়ি) + Masjid Wali Asr inside
 */
function buildAltapoleLaneCorridor(staticG, dynamicG, bank, m, helpers, treesG = staticG) {
  const lanePts = [
    [166, -519],
    [166, -499],
    [165, -477],
    [167, -447],
    [170, -405],
    [168, -373],
    [167, -360],
    [163, -344],
    [160, -320],
    [157, -296],
  ];

  const laneCenterX = (zVal) => {
    for (let i = 0; i < lanePts.length - 1; i++) {
      const [x0, z0] = lanePts[i];
      const [x1, z1] = lanePts[i + 1];
      if (zVal <= z1 || i === lanePts.length - 2) {
        const t = THREE.MathUtils.clamp((zVal - z0) / Math.max(0.001, z1 - z0), 0, 1);
        return x0 + (x1 - x0) * t;
      }
    }
    return 166;
  };

  // 1) Narrower, slightly weathered/cracked asphalt lane (3.4m wide, flush at y = 0.002) + wider, higher raised brick footpaths!
  buildPavedSegmentRoad(staticG, lanePts, 3.4, -0.023, m.road, 5.2);
  buildPavedSegmentRoad(staticG, lanePts, 5.2, -0.055, m.darkConcrete, 3.0);
  // Weathered/cracked tarmac patches & uneven concrete repairs along the narrow lane
  for (let pz = -508; pz <= -304; pz += 11) {
    const cx = laneCenterX(pz);
    const sideShift = ((Math.abs(pz) % 3) - 1) * 0.72;
    addBox(staticG, [1.15, 0.004, 2.3], [cx + sideShift, 0.003, pz], bank.dampPlinth, { castShadow: false, rotY: (pz % 5) * 0.08, uvScale: 1.8 });
    if (Math.abs(pz) % 2 === 0) {
      addBox(staticG, [0.55, 0.004, 1.2], [cx - sideShift * 0.8, 0.0035, pz + 3.5], bank.darkSlate, { castShadow: false, rotY: -0.14 });
    }
  }
  // Wider, taller raised brick footpaths (1.75m wide, elevated curb y = 0.14m -> top at 0.27m!)
  // Leave a clean flush opening on the East footpath (side = 1) at z = -407.0 .. -401.0 for the East Side Lane!
  for (const side of [-1, 1]) {
    const swPts = lanePts.map(([x, z]) => [x + side * 2.58, z]);
    for (let i = 0; i < swPts.length - 1; i++) {
      let [x0, z0] = swPts[i];
      let [x1, z1] = swPts[i + 1];
      if (side === 1 && z0 < -406.8 && z1 > -406.8 && z1 < -400.0) {
        const tCut = (-407.0 - z0) / (z1 - z0);
        x1 = x0 + (x1 - x0) * tCut;
        z1 = -407.0;
      } else if (side === 1 && z0 < -401.2 && z1 > -401.2 && z0 > -408.0) {
        const tCut = (-401.0 - z0) / (z1 - z0);
        x0 = x0 + (x1 - x0) * tCut;
        z0 = -401.0;
      }
      const len = Math.hypot(x1 - x0, z1 - z0) + 0.45;
      const yaw = Math.atan2(x1 - x0, z1 - z0);
      addBox(staticG, [1.75, 0.26, len], [(x0 + x1) * 0.5, 0.13, (z0 + z1) * 0.5], m.brick, { rotY: yaw, uvScale: 2.0 });
      const curbOff = -side * 0.86;
      addBox(staticG, [0.16, 0.28, len], [(x0 + x1) * 0.5 + curbOff, 0.14, (z0 + z1) * 0.5], bank.creamTrim, { rotY: yaw });
    }
  }

  // North & South Entry Street Signpoles
  addCyl(staticG, 0.06, 0.08, 3.7, [169.1, 1.85, -514.0], bank.darkMetal, 8);
  addIlluminatedSign(dynamicG, bank, {
    title: 'আলতাপোল লেন · লোয়ার যশোর রোড মোড়',
    subtitle: 'ALTAPOLE LANE · WARD 23 · KHULNA',
    bg: '#0f3d2e',
    accent: '#d9ed9c',
  }, [169.1, 3.45, -514.0], 0, 3.8, 1.12);

  addCyl(staticG, 0.06, 0.08, 3.7, [160.2, 1.85, -302.0], bank.darkMetal, 8);
  addIlluminatedSign(dynamicG, bank, {
    title: 'আলতাপোল লেন · সাউথ সেন্ট্রাল রোড মোড়',
    subtitle: 'ALTAPOLE LANE · SOUTH ENTRY',
    bg: '#0c4a6e',
    accent: '#fde047',
  }, [160.2, 3.45, -302.0], Math.PI, 3.8, 1.12);

  // 2) NORTH ENTRANCE (29 Upper Jessore Rd Street View Recreation):
  //    - EAST SIDE: Exact 1-Story "ইস্পাহানি বিক্রয় কেন্দ্র, খুলনা" (3 bright green shutters, bright yellow signboard with green logo & red accents, lush tree behind)
  //    - WEST SIDE: Exact 6-Story "29 Upper Jessore Rd" Building (red brick ground floor + chocolate brown & mint green upper floors + white horizontal bands & window grills)
  const ispFrontZ = -516.2;
  const ispX = laneCenterX(-511) + 7.2;
  // Black-and-yellow striped corner curb wrapping both sides of the Altapole Lane mouth
  addBox(staticG, [0.34, 0.24, 5.5], [laneCenterX(-515) + 2.05, 0.12, -515.8], bank.hazardBarrier);
  addBox(staticG, [4.8, 0.24, 0.34], [laneCenterX(-518) + 4.4, 0.12, -518.4], bank.hazardBarrier);
  addBox(staticG, [0.34, 0.24, 5.5], [laneCenterX(-515) - 2.05, 0.12, -515.8], bank.hazardBarrier);
  addBox(staticG, [5.2, 0.24, 0.34], [laneCenterX(-518) - 4.6, 0.12, -518.4], bank.hazardBarrier);

  // Enterable 1-Story Ispahani Bikroy Kendra (with openable roll-up shutter & tea interior) is built by src/altapole-houses.js
  // Enterable 6-Story "29 Upper Jessore Rd" Apartment Tower (empty car garage, [E] main gate, working 3D lift, stairs, furnished flats & openable Thai windows) is built by src/altapole-tower.js

  // South Head Corner Shops (two shops flanking the South Central Rd mouth at z = -310)
  const seX = laneCenterX(-311) + 8.3;
  const seB = buildDetailedBuilding(staticG, dynamicG, bank, {
    cx: seX,
    cz: -311,
    widthX: 9.0,
    lengthZ: 13.5,
    floors: 3,
    facing: -1,
    wallMat: bank.terracotta,
    accentMat: bank.creamTrim,
    shutterMat: bank.shutterBlue,
    hasShopArcade: true,
    displayKind: 'pharmacy',
    seed: 9023,
  });
  addIlluminatedSign(dynamicG, bank, {
    title: 'আলতাপোল টি স্টল ও কনফেকশনারি',
    subtitle: 'CORNER TEA & GROCERY · SOUTH ENTRY',
    bg: '#7c2d12',
    accent: '#fde047',
  }, [seX + seB.frontLocalX - 0.24, seB.signY, -311], -Math.PI / 2, 5.8, 0.90);

  const swX = laneCenterX(-310) - 8.3;
  const swB = buildDetailedBuilding(staticG, dynamicG, bank, {
    cx: swX,
    cz: -310,
    widthX: 9.0,
    lengthZ: 13.5,
    floors: 3,
    facing: 1,
    wallMat: bank.sagePlaster,
    accentMat: bank.creamTrim,
    shutterMat: bank.shutterSteel,
    hasShopArcade: true,
    displayKind: 'atm',
    seed: 9034,
  });
  addIlluminatedSign(dynamicG, bank, {
    title: 'মায়ের দোয়া জেনারেল স্টোর ও ফ্লেক্সিলোড',
    subtitle: 'ALTAPOLE CORNER · BKASH · NAGAD',
    bg: '#1e3a8a',
    accent: '#fde047',
  }, [swX + swB.frontLocalX + 0.24, swB.signY, -310], Math.PI / 2, 5.8, 0.90);

  // 3) REAL STREET VIEW ENTRY SEGMENT ("2 Altapole Ln" right after entering from Ispahani side, z = -498 .. -466):
  //    - EAST (Left looking South): Long weathered mossy paneled compound wall + pilasters + open concrete drain + dense overhanging trees & white tin-roof quarters behind
  //    - WEST (Right looking South): Old weathered plaster/exposed-brick 2-story house with rusty tin window awning + reddish-brown dusty shoulder + stacked red brick pile + coconut palms
  const weatheredPlaster = bank.creamTrim;
  const dirtRedMat = new THREE.MeshStandardMaterial({ color: 0x7a4b37, roughness: 0.96 });
  const drainDarkMat = new THREE.MeshStandardMaterial({ color: 0x262b27, roughness: 0.95 });

  // Open concrete roadside drain (পাকা ড্রেন) along East edge + reddish-brown dusty earth shoulder along West edge
  for (let dz = -500; dz <= -456; dz += 8) {
    const cx = laneCenterX(dz);
    addBox(staticG, [0.42, 0.08, 8.2], [cx + 2.02, 0.02, dz], drainDarkMat, { castShadow: false });
    addBox(staticG, [0.14, 0.16, 8.2], [cx + 1.76, 0.08, dz], bank.dampPlinth, { castShadow: false });
    addBox(staticG, [1.15, 0.04, 8.2], [cx - 2.30, 0.03, dz], dirtRedMat, { castShadow: false });
  }

  // East Side (z = -498..-466): Long weathered paneled compound wall with pilasters every 3.2m + overhanging trees
  for (let wz = -496; wz <= -468; wz += 3.2) {
    const ex = laneCenterX(wz) + 2.38;
    addBox(staticG, [0.24, 2.05, 3.22], [ex, 1.02, wz], weatheredPlaster, { uvScale: 2.2 });
    addBox(staticG, [0.36, 2.18, 0.34], [ex, 1.09, wz - 1.58], bank.dampPlinth);
    addBox(staticG, [0.34, 0.12, 3.24], [ex, 2.08, wz], bank.dampPlinth);
  }
  // White plastered tin-roof quarter tucked behind the East mossy wall
  buildTinRoofHouse(staticG, bank, { cx: laneCenterX(-482) + 8.6, cz: -482, widthX: 6.8, lengthZ: 10.0, facing: -1, tinMat: bank.tinBlue });
  // Dense overhanging tropical canopy arching over the East wall (matching the Street View jungle-green left edge!)
  for (const [tz, isPalm] of [[-497, false], [-491, true], [-485, false], [-478, true], [-471, false], [-465, true]]) {
    const tx = laneCenterX(tz) + 3.45;
    if (isPalm) helpers.addPalm?.(dynamicG, tx, 0, tz, 7.6, (tz % 4) * 0.25, 0.42);
    else helpers.addBroadleafTree?.(treesG, tx, 0, tz, 1.18, 9700 + Math.abs(tz));
  }

  // West Side (z = -496..-484): Old weathered heritage plaster/exposed-brick 2-story house ("2 Altapole Ln")
  const oldX = laneCenterX(-490) - 6.8;
  const oldZ = -490.0;
  const oldW = 7.4;
  const oldL = 11.2;
  const oldFrontX = oldX + oldW * 0.5;
  addBox(staticG, [oldW, 6.2, oldL], [oldX, 3.1, oldZ], weatheredPlaster, { uvScale: 2.4 });
  addBox(staticG, [oldW + 0.25, 0.18, oldL + 0.25], [oldX, 3.25, oldZ], bank.dampPlinth);
  // Ground-floor dark wooden shuttered window + rusty corrugated tin awning (chajja) right on the lane face
  addBox(staticG, [0.18, 1.35, 2.1], [oldFrontX + 0.04, 1.38, oldZ - 1.8], bank.woodBoat);
  addBox(staticG, [0.78, 0.08, 2.35], [oldFrontX + 0.38, 2.22, oldZ - 1.8], bank.tinRust, { rotZ: -0.32, uvScale: 1.4 });
  // Upper-floor weathered window opening with exposed red-brick reveal border
  addBox(staticG, [0.22, 1.75, 2.25], [oldFrontX + 0.02, 4.45, oldZ - 1.8], bank.brickRed, { uvScale: 1.8 });
  addBox(staticG, [0.26, 1.35, 1.75], [oldFrontX + 0.05, 4.45, oldZ - 1.8], bank.darkSlate);
  // Second ground window & rusty tin awning
  addBox(staticG, [0.16, 1.25, 1.45], [oldFrontX + 0.04, 1.45, oldZ + 2.6], bank.woodBoat);
  addBox(staticG, [0.68, 0.08, 1.65], [oldFrontX + 0.34, 2.22, oldZ + 2.6], bank.tinRust, { rotZ: -0.30, uvScale: 1.4 });

  // Stacked pile of red construction bricks (ইটের স্তূপ) on the West dusty shoulder (z = -472) + overhanging palms
  const bpX = laneCenterX(-472) - 2.65;
  addBox(staticG, [1.55, 0.65, 2.9], [bpX, 0.32, -472], bank.brickRed, { uvScale: 1.2 });
  addBox(staticG, [1.15, 0.52, 2.2], [bpX - 0.12, 0.85, -472], bank.brickRed, { uvScale: 1.2, rotY: 0.08 });
  addBox(staticG, [0.72, 0.36, 1.4], [bpX - 0.18, 1.22, -472.2], bank.brickRed, { uvScale: 1.2 });
  helpers.addPalm?.(dynamicG, laneCenterX(-479) - 3.6, 0, -479, 8.2, -0.32, 0.38);
  helpers.addBroadleafTree?.(treesG, laneCenterX(-476) - 4.1, 0, -476, 1.15, 9741);

  // 4) REAL STREET VIEW LANDMARKS ALONG ALTAPOLE LANE (from user's 10 Google Street View photos, z = -458 .. -330):
  const skyBlueWall = new THREE.MeshStandardMaterial({ color: 0x4b87c8, roughness: 0.72 });
  const royalBlueDoor = new THREE.MeshStandardMaterial({ color: 0x2554a6, roughness: 0.62 });
  const mintLowerWall = new THREE.MeshStandardMaterial({ color: 0x8db596, roughness: 0.88 });
  const mossyTileRoof = new THREE.MeshStandardMaterial({ color: 0x5c693a, roughness: 0.92 });
  const paleGreenShutter = new THREE.MeshStandardMaterial({ color: 0x8ea688, roughness: 0.82 });
  const darkBlueShutter = new THREE.MeshStandardMaterial({ color: 0x162b42, roughness: 0.72 });
  const maroonTinRoof = new THREE.MeshStandardMaterial({ color: 0x7c292b, roughness: 0.60, metalness: 0.35 });
  const tealMeshGate = new THREE.MeshStandardMaterial({ color: 0x2a7b6f, roughness: 0.55, metalness: 0.50 });

  // Continuous narrow mossy side drain along the lane interior (z = -456 .. -330)
  for (let dz = -452; dz <= -332; dz += 10) {
    const cx = laneCenterX(dz);
    addBox(staticG, [0.38, 0.07, 10.2], [cx + 1.98, 0.02, dz], drainDarkMat, { castShadow: false });
    addBox(staticG, [0.12, 0.14, 10.2], [cx + 1.74, 0.07, dz], bank.dampPlinth, { castShadow: false });
  }

  // [A] z = -442 WEST: Enterable "১৫, আলতাপোল লেন — কামিয়াব টিচিং হোম" is built by src/altapole-houses.js

  // [B] z = -442 EAST: Old Exposed-Brick & Mossy Concrete Semi-Pucca House with Pale-Green Wooden Shutters
  {
    const rx = laneCenterX(-442);
    const hx = rx + 7.6;
    const hz = -442;
    addBox(staticG, [7.6, 3.4, 11.4], [hx, 1.7, hz], bank.dampPlinth, { uvScale: 2.2 });
    addBox(staticG, [7.8, 0.22, 11.6], [hx, 3.45, hz], mossyTileRoof);
    for (const dz of [-2.8, 2.4]) {
      addBox(staticG, [0.16, 1.28, 1.35], [hx - 3.84, 1.65, hz + dz], paleGreenShutter);
    }
    addBox(staticG, [0.16, 2.05, 1.05], [hx - 3.84, 1.12, hz - 0.2], bank.woodBoat);
    // Exposed-brick 2-story neighbor rising behind
    addBox(staticG, [6.2, 6.2, 10.0], [hx + 4.8, 3.1, hz - 2.0], bank.brickRed, { uvScale: 2.0 });
    // Weathered mossy boundary wall
    addBox(staticG, [0.26, 1.85, 11.8], [rx + 2.65, 0.92, hz], weatheredPlaster, { uvScale: 2.2 });
  }

  // [C] z = -418 WEST: Enterable "পরশমনি কলা কেন্দ্র · ২৪, আলতাপোল লেন" is built by src/altapole-houses.js

  // [D] z = -418 EAST: ICONIC MOSSY CLAY-TILE ROOF ROW HOUSE (টালির চালের বাড়ি) + MINT-GREEN LOWER WALL & WHITE JALI + OCHRE 2-STORY HERITAGE BUILDING
  {
    const rx = laneCenterX(-418);
    const ex = rx + 2.75;
    const hz = -418;
    // Front mint-green lower wall + perforated white brick jali section + mossy clay-tile sloping roof (টালির চাল)
    addBox(staticG, [0.28, 1.85, 16.0], [ex, 0.92, hz], mintLowerWall, { uvScale: 2.2 });
    addBox(staticG, [0.24, 0.95, 7.2], [ex, 2.30, hz - 3.6], bank.modernWhite, { uvScale: 1.4 });
    // Long sloping moss-covered terracotta clay-tile roof overhang facing the lane + silver tin repair patch
    addBox(staticG, [2.6, 0.12, 16.4], [ex + 1.05, 3.35, hz], mossyTileRoof, { rotZ: 0.34, uvScale: 1.5 });
    addBox(staticG, [2.5, 0.13, 2.2], [ex + 1.02, 3.38, hz - 2.4], bank.aluminum, { rotZ: 0.34 });
    // 2-Story weathered ochre-cream heritage building rising directly behind the tile roof with dark-blue louvered shutters
    addBox(staticG, [7.8, 7.6, 16.0], [ex + 5.6, 3.8, hz], bank.ochrePlaster, { uvScale: 2.6 });
    addBox(staticG, [8.1, 0.24, 16.2], [ex + 5.5, 7.65, hz], bank.dampPlinth);
    for (const dz of [-5.4, -2.6, 0.2, 3.0, 5.8]) {
      addBox(staticG, [0.16, 1.55, 1.15], [ex + 1.68, 5.55, hz + dz], darkBlueShutter);
      addBox(staticG, [0.28, 0.10, 1.35], [ex + 1.62, 6.38, hz + dz], bank.dampPlinth);
    }
  }

  // [D2] ALTAPOLE EAST SIDE LANE (আলতাপোল পূর্ব উপ-গলি) at z = -404.0, running East x = 169.8 -> 208.2
  // Stops halfway well before the pond, tightly lined with zero-gap residential buildings on BOTH sides + dead-end house!
  {
    const alleyZ = -404.0;
    const xStart = laneCenterX(alleyZ);
    const xEnd = 208.2;
    const alleyLen = xEnd - xStart;
    const alleyCx = (xStart + xEnd) * 0.5;

    // Straight weathered asphalt side lane (3.2m wide, flush at y = 0.002) + concrete sub-base + tarmac patches
    addBox(staticG, [alleyLen + 1.4, 0.05, 3.2], [alleyCx, -0.023, alleyZ], m.road, { castShadow: false, uvScale: 4.8 });
    addBox(staticG, [alleyLen + 1.6, 0.05, 4.8], [alleyCx, -0.055, alleyZ], m.darkConcrete, { castShadow: false, uvScale: 3.0 });
    for (let px = xStart + 5; px <= xEnd - 4; px += 9) {
      addBox(staticG, [2.1, 0.004, 1.05], [px, 0.003, alleyZ + ((Math.round(px) % 3) - 1) * 0.55], bank.dampPlinth, { castShadow: false, uvScale: 1.8 });
    }

    // Raised red-brick footpaths & cream curbs along BOTH North (z = -406.3) and South (z = -401.7) edges
    for (const sDir of [-1, 1]) {
      const swZ = alleyZ + sDir * 2.25;
      const curbZ = alleyZ + sDir * 1.64;
      addBox(staticG, [alleyLen - 1.6, 0.24, 1.28], [alleyCx + 0.9, 0.12, swZ], m.brick, { uvScale: 2.0 });
      addBox(staticG, [alleyLen - 1.6, 0.26, 0.14], [alleyCx + 0.9, 0.13, curbZ], bank.creamTrim);
    }
    // Narrow mossy concrete side drain along North edge
    addBox(staticG, [alleyLen - 1.4, 0.07, 0.34], [alleyCx + 0.8, 0.02, alleyZ - 1.48], drainDarkMat, { castShadow: false });

    // Keep the short mint boundary wall closing the corner behind [D] Ochre building (x = 172.6..182.2)
    // All 8 enterable residential buildings (old & new, 1-5 stories, 2 with working 3D lifts) lining
    // North, South & Dead-End of this alley are built by src/altapole-goli.js!
    addBox(staticG, [9.6, 2.1, 0.28], [177.4, 1.05, -407.0], mintLowerWall, { uvScale: 2.2 });

    // Side-lane streetlamp poles & overhead Khulna wires
    const alleyPoles = [];
    for (const [apx, tier] of [[181.5, 0], [195.5, 2], [206.8, 0]]) {
      addUtilityPoleAndLamp(staticG, dynamicG, bank, apx, alleyZ - 2.05, 1, false, alleyPoles, tier);
    }
    for (let i = 0; i < alleyPoles.length - 1; i++) {
      helpers.addWire?.(staticG, [alleyPoles[i][0], alleyPoles[i][1], alleyPoles[i][2]], [alleyPoles[i + 1][0], alleyPoles[i + 1][1], alleyPoles[i + 1][2]], m.wire, 0.35, 0.015);
      helpers.addWire?.(staticG, [alleyPoles[i][0], alleyPoles[i][1] - 2.8, alleyPoles[i][2]], [alleyPoles[i + 1][0], alleyPoles[i + 1][1] - 2.8, alleyPoles[i + 1][2]], m.wire, 0.85, 0.018);
    }
  }

  // [E] z = -401 WEST: White 2-Story House with Maroon/Red Pitched Tin Roof + Mossy Grey Boundary Wall
  {
    const rx = laneCenterX(-401);
    const hx = rx - 8.5;
    const hz = -401;
    addBox(staticG, [8.2, 6.2, 12.6], [hx, 3.1, hz], bank.modernWhite, { uvScale: 2.4 });
    addBox(staticG, [4.6, 0.12, 13.0], [hx + 2.0, 6.72, hz], maroonTinRoof, { rotZ: -0.26, uvScale: 1.6 });
    addBox(staticG, [4.6, 0.12, 13.0], [hx - 2.0, 6.72, hz], maroonTinRoof, { rotZ: 0.26, uvScale: 1.6 });
    for (const dz of [-3.4, 0, 3.4]) {
      addBox(staticG, [0.16, 1.45, 1.25], [hx + 4.14, 4.75, hz + dz], bank.windowGlass);
      addBox(staticG, [0.16, 2.05, 1.15], [hx + 4.14, 1.15, hz + dz], bank.woodBoat);
    }
    addBox(staticG, [0.28, 1.95, 12.8], [rx - 2.85, 0.98, hz], weatheredPlaster, { uvScale: 2.2 });
    helpers.addBroadleafTree?.(treesG, rx - 3.6, 0, hz - 4.5, 1.24, 9823);
  }

  // [F] z = -384 WEST: Enterable "১ আলতাপোল লেন" Classic White Colonial Veranda House is built by src/altapole-houses.js

  // [G] z = -384 EAST: Weathered Ochre Arched-Window Heritage House (1 Altapole Ln East)
  {
    const rx = laneCenterX(-384);
    const hx = rx + 7.2;
    const hz = -384;
    addBox(staticG, [8.0, 6.2, 14.0], [hx, 3.1, hz], bank.ochrePlaster, { uvScale: 2.6 });
    addBox(staticG, [8.3, 0.22, 14.2], [hx - 0.15, 3.25, hz], bank.dampPlinth);
    addBox(staticG, [8.3, 0.22, 14.2], [hx - 0.15, 6.25, hz], bank.dampPlinth);
    for (const dz of [-4.2, -0.4, 3.6]) {
      addBox(staticG, [0.18, 1.75, 1.35], [hx - 4.04, 1.45, hz + dz], bank.darkSlate);
      addBox(staticG, [0.34, 0.12, 1.65], [hx - 4.14, 2.40, hz + dz], bank.dampPlinth);
      addBox(staticG, [0.16, 1.45, 1.25], [hx - 4.04, 4.75, hz + dz], darkBlueShutter);
    }
  }

  // [H] Remaining South Residential Stretch (z = -362 .. -330): Taltola-style Houses & Tin-Roof Houses (zero shops!)
  const southRes = [
    { z: -362, side: 1, type: 'house', floors: 4, wall: bank.creamTrim, band: bank.steelBlue },
    { z: -340, side: 1, type: 'tin', tin: bank.tinBlue },
    { z: -360, side: -1, type: 'tin', tin: bank.tinRust },
    { z: -338, side: -1, type: 'house', floors: 4, wall: bank.sagePlaster, band: bank.creamTrim },
  ];
  southRes.forEach((item, i) => {
    const rx = laneCenterX(item.z);
    if (item.type === 'tin') {
      buildTinRoofHouse(staticG, bank, { cx: rx + item.side * 9.0, cz: item.z, widthX: 7.4, lengthZ: 10.6, facing: -item.side, tinMat: item.tin });
    } else {
      buildTaltolaStyleResidence(staticG, dynamicG, bank, {
        cx: rx + item.side * 9.4, cz: item.z, widthX: 9.2, lengthZ: 13.6, floors: item.floors,
        facing: -item.side, wallMat: item.wall, bandMat: item.band, seed: 9900 + i * 23,
      });
    }
  });

  // BIG High-Quality Leader Wall Posters on Residential Boundary Walls along Altapole Lane!
  for (const [wz, side, pIdx] of [[-483, 1, 0], [-456, -1, 1], [-424, 1, 2], [-392, -1, 0], [-354, 1, 1]]) {
    const rx = laneCenterX(wz);
    const wx = rx + side * 3.52;
    addBigNetaWallPoster(dynamicG, pIdx, wx, 1.38, wz, side > 0 ? -Math.PI / 2 : Math.PI / 2, 1.88);
  }

  // 4) Alternating Thick Concrete & Slim Steel Utility Poles with the 3 HD Leader Posters + Overhead Khulna Wires
  const lanePoles = [];
  const poleSpecs = [
    [-505, 2],
    [-478, 0],
    [-450, 2],
    [-422, 0],
    [-394, 2],
    [-366, 0],
    [-338, 2],
    [-310, 0],
  ];
  for (const [pz, tier] of poleSpecs) {
    const px = laneCenterX(pz) + 3.08;
    addUtilityPoleAndLamp(staticG, dynamicG, bank, px, pz, -1, pz === -450, lanePoles, tier);
  }
  for (let i = 0; i < lanePoles.length - 1; i++) {
    const wireSpecs = [
      [0.0, 0.0, 0.42, 0.016],
      [-0.30, -0.50, 0.58, 0.017],
      [0.28, -0.56, 0.54, 0.016],
      [-0.20, -2.65, 0.96, 0.022],
      [0.22, -3.05, 1.28, 0.019],
      [-0.14, -3.40, 1.48, 0.017],
      [0.18, -3.60, 1.12, 0.015],
    ];
    for (let k = 0; k < wireSpecs.length; k++) {
      const [lat, dy, sag, rad] = wireSpecs[k];
      helpers.addWire?.(
        staticG,
        [lanePoles[i][0] + lat, lanePoles[i][1] + dy, lanePoles[i][2]],
        [lanePoles[i + 1][0] + lat, lanePoles[i + 1][1] + dy, lanePoles[i + 1][2]],
        m.wire,
        sag,
        rad,
      );
    }
    for (const [sDir, dzOff, endY] of [[1, -4.5, 4.4], [-1, 3.5, 5.2], [1, 6.0, 6.1]]) {
      helpers.addWire?.(
        staticG,
        [lanePoles[i][0], lanePoles[i][1] - 3.15, lanePoles[i][2]],
        [lanePoles[i][0] + sDir * 6.5, endY, lanePoles[i][2] + dzOff],
        m.wire,
        0.65,
        0.014,
      );
    }
  }

  // Tropical Coconut Palms & Shade Trees tucked beside the residential compound walls
  for (const [tz, side, isPalm] of [
    [-490, -1, true], [-461, 1, false], [-436, 1, true], [-392, 1, false], [-374, -1, true], [-322, -1, false],
  ]) {
    const px = laneCenterX(tz) + side * 3.85;
    if (isPalm) helpers.addPalm?.(dynamicG, px, 0, tz, 6.9, (tz % 5) * 0.2, 0.35);
    else helpers.addBroadleafTree?.(treesG, px, 0, tz, 0.94, 880 + Math.abs(tz));
  }
}

/**
 * Builds the complete Taltola-House-style road network surrounding:
 *  - Khulna Boro Maath (South Upper Jessore Rd & West Fire Brigade Rd edge)
 *  - Behind Circuit House 1 & 2 & opposite Khulna Judge Court (Circuit House Rd + NE connector)
 *  - All around Khulna District Stadium (North, West VIP side, SW & SE portal links)
 * Built with seamless mitered Bangladeshi Pitch-Asphalt ribbons (zero overhanging corners /
 * zero Z-fighting), smooth circular pitch junction pads, red-brick footpaths & cream curbs.
 */
function buildCircuitStadiumRoadNetwork(staticG, dynamicG, bank, m, helpers, treesG = staticG) {
  function buildPitchStyledRoad(pts, roadWidth = 6.2, { withPoles = true, poleSide = 1, poleStep = 38 } = {}) {
    // 1) Continuous mitered Taltola House wet-asphalt carriageway (flush at y = 0.002 — ZERO wheel/foot sinking!)
    addPitchRoadAlongPolyline(staticG, pts, roadWidth * 0.5, m.road, 0.002);

    const poleCoords = [];
    let accumPole = poleStep * 0.4;

    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i];
      const [x1, z1] = pts[i + 1];
      const dx = x1 - x0;
      const dz = z1 - z0;
      const segLen = Math.hypot(dx, dz);
      if (segLen < 1.0) continue;
      const yaw = Math.atan2(dx, dz);
      // Right-hand unit normal perpendicular to travel direction
      const nx = dz / segLen;
      const nz = -dx / segLen;
      const mx = (x0 + x1) * 0.5;
      const mz = (z0 + z1) * 0.5;

      // 2) Continuous Red-Brick Footpaths + Cream Concrete Curbs on BOTH sides (micro-staggered so joints never Z-fight)
      const swOffset = roadWidth * 0.5 + 0.78;
      const curbOffset = roadWidth * 0.5 + 0.08;
      const segH = 0.14 + (i % 2) * 0.002;
      for (const side of [-1, 1]) {
        addBox(
          staticG,
          [1.42, segH, segLen + 0.45],
          [mx + nx * side * swOffset, segH * 0.5, mz + nz * side * swOffset],
          bank.redBrickFootpath,
          { rotY: yaw, castShadow: false, uvScale: 1.8 }
        );
        addBox(
          staticG,
          [0.16, segH + 0.02, segLen + 0.48],
          [mx + nx * side * curbOffset, (segH + 0.02) * 0.5, mz + nz * side * curbOffset],
          bank.creamTrim,
          { rotY: yaw, castShadow: false }
        );
      }

      // 3) Utility Poles with LED Cobra Streetlamps along one footpath edge
      if (withPoles) {
        let d = accumPole;
        while (d < segLen) {
          const t = d / segLen;
          const px = x0 + dx * t + nx * poleSide * (roadWidth * 0.5 + 1.05);
          const pz = z0 + dz * t + nz * poleSide * (roadWidth * 0.5 + 1.05);
          const armDir = -Math.sign(nx * poleSide || 1);
          const tier = (poleCoords.length % 2 === 0) ? 2 : 0;
          addUtilityPoleAndLamp(staticG, dynamicG, bank, px, pz, armDir, false, poleCoords, tier);
          d += poleStep;
        }
        accumPole = d - segLen;
      }
    }

    // Connect overhead wires cleanly between consecutive poles along this road
    for (let i = 0; i < poleCoords.length - 1; i++) {
      const a = poleCoords[i];
      const b = poleCoords[i + 1];
      if (Math.hypot(b[0] - a[0], b[2] - a[2]) > poleStep * 1.8) continue;
      helpers.addWire?.(staticG, [a[0], a[1], a[2]], [b[0], b[1], b[2]], m.wire, 0.42, 0.016);
      helpers.addWire?.(staticG, [a[0] + 0.18, a[1] - 0.48, a[2]], [b[0] + 0.18, b[1] - 0.48, b[2]], m.wire, 0.56, 0.016);
    }
  }

  // 1) South Main Road in front of Boro Maath (Upper Jessore Rd: Shamsur Rahman Rd -> Boro Maath Gate -> Circuit House Rd -> Altapole Ln)
  buildPitchStyledRoad([
    [-165, -515],
    [-110, -518],
    [-38, -516],
    [40, -522],
    [109, -521],
    [166, -519],
  ], 6.8, { withPoles: true, poleSide: -1, poleStep: 36 });

  // 2) East Road behind Circuit House 1 & 2 & in front of Khulna Judge Court (সার্কিট হাউজ রোড)
  buildPitchStyledRoad([
    [109, -521],
    [118, -567],
    [138, -651],
    [143, -684],
    [156, -727],
    [166, -760],
    [184, -814],
    [204, -862],
  ], 6.6, { withPoles: true, poleSide: 1, poleStep: 36 });

  // 3) Small Connecting Road right between Circuit House (z=-726) & Khulna District Stadium (z=-741)
  //    Runs from Circuit House Rd past Stadium Gate No. 1 all the way West to the Stadium West Side Road
  buildPitchStyledRoad([
    [156, -727],
    [142, -733.5],
    [105.5, -733.5],
    [60, -733.5],
    [16, -733.5],
    [-14, -733.5],
  ], 5.2, { withPoles: true, poleSide: -1, poleStep: 36 });

  // Short paved approach apron from the small road straight into Stadium Grand Portal Gate No. 1 (105.5, -752)
  addPitchRoadAlongPolyline(staticG, [[105.5, -733.5], [105.5, -754.0]], 4.2, m.road, 0.002);

  // 4) West Road alongside Boro Maath & wrapping cleanly along the West side of Khulna District Stadium
  buildPitchStyledRoad([
    [-38, -516],
    [-27, -551],
    [-37, -610],
    [-24, -652],
    [-14, -695],
    [-14, -733.5],
    [-14, -834],
    [-14, -938],
  ], 6.0, { withPoles: true, poleSide: -1, poleStep: 38 });

  // 5) North Stadium Perimeter Road (wrapping North of relocated Stadium from Circuit House Rd -> Shaheed Hadis Park East Rd!)
  buildPitchStyledRoad([
    [204, -862],
    [196, -915],
    [155, -940],
    [78, -942],
    [-14, -938],
    [-110, -936],
    [-188, -935],
    [-261, -935],
  ], 6.2, { withPoles: true, poleSide: -1, poleStep: 38 });

  // 6) West Link Road connecting North Stadium/Hadis corridor down to Shamsur Rahman Rd
  buildPitchStyledRoad([
    [-188, -935],
    [-188, -895],
    [-176, -825],
    [-166, -750],
    [-165, -675],
    [-166, -600],
    [-165, -515],
  ], 6.2, { withPoles: true, poleSide: 1, poleStep: 38 });

  // 7) South-West Link connecting West Link Road directly to Boro Maath West Road
  buildPitchStyledRoad([
    [-166, -635],
    [-118, -616],
    [-70, -595],
    [-37, -610],
  ], 5.8, { withPoles: true, poleSide: 1, poleStep: 38 });

  // 8) Shaheed Hadis Park South Front Road (Main Gate Road -> links straight into West Link Road!)
  buildPitchStyledRoad([
    [-384, -831],
    [-332, -831],
    [-295, -831],
    [-261, -831],
    [-176, -825],
  ], 6.6, { withPoles: true, poleSide: 1, poleStep: 38 });

  // 9) Shaheed Hadis Park East Front Road (P C Rai Rd running along Hadis Park East fence)
  buildPitchStyledRoad([
    [-261, -831],
    [-261, -885],
    [-261, -935],
    [-261, -967],
  ], 6.4, { withPoles: true, poleSide: 1, poleStep: 40 });

  // 10) Shaheed Hadis Park North Back-Gate Road (running right in front of Hadis Park Back Gate)
  buildPitchStyledRoad([
    [-384, -967],
    [-332, -967],
    [-295, -967],
    [-261, -967],
  ], 6.0, { withPoles: true, poleSide: -1, poleStep: 40 });

  // 11) Shaheed Hadis Park West Perimeter Road (wrapping West side of Hadis Park)
  buildPitchStyledRoad([
    [-384, -967],
    [-384, -900],
    [-384, -831],
  ], 6.0, { withPoles: true, poleSide: -1, poleStep: 40 });

  // Smooth Circular Bangladeshi Pitch Junction Pads at all road mouths & intersections (zero jagged corners / zero Z-fighting!)
  for (const [jx, jz, jr] of [
    [-165, -515, 5.4],
    [-38, -516, 5.2],
    [109, -521, 5.6],
    [166, -519, 5.2],
    [156, -727, 5.4],
    [105.5, -733.5, 4.4],
    [-14, -733.5, 4.8],
    [-14, -938, 5.0],
    [204, -862, 5.2],
    [-188, -935, 5.2],
    [-166, -635, 4.8],
    [-37, -610, 4.6],
    [-176, -825, 5.2],
    [-261, -831, 5.4],
    [-261, -935, 5.4],
    [-261, -967, 5.0],
    [-384, -831, 5.0],
    [-384, -967, 5.0],
  ]) {
    addPitchJunctionDisc(staticG, jx, jz, jr, m.road, 0.003);
  }

  // Authentic Khulna Asphalt Speed Breakers (স্পিড ব্রেকার) near Hadis Park Main Gate, Boro Maath Gate & Judge Court Gate
  for (const [bx, bz, w, yaw] of [
    [-295.0, -831.0, 6.4, Math.PI * 0.5],
    [40.0, -522.0, 6.6, Math.PI * 0.5],
    [143.0, -684.0, 6.4, 0.22],
  ]) {
    addBox(staticG, [w, 0.09, 0.72], [bx, 0.028, bz], bank.dampPlinth, { rotY: yaw, castShadow: false });
    addBox(staticG, [w * 0.96, 0.04, 0.34], [bx, 0.068, bz], bank.darkSlate, { rotY: yaw, castShadow: false });
  }

  // Roadside Cast-Iron Storm-Drain Grates along curbs (merged into staticG — zero extra draw calls!)
  for (const [dx, dz, yaw] of [
    [-280, -834.1, Math.PI * 0.5], [-318, -834.1, Math.PI * 0.5], [-264.1, -885, 0],
    [18, -525.1, Math.PI * 0.5], [78, -524.5, Math.PI * 0.5], [134, -636, 0.22],
    [88, -731.0, Math.PI * 0.5], [-162.5, -720, 0.02],
  ]) {
    addBox(staticG, [0.52, 0.04, 0.84], [dx, 0.062, dz], bank.darkSlate, { rotY: yaw, castShadow: false });
  }

  // Parked Authentic Khulna CNG Auto-Rickshaws at Hadis Park, Boro Maath & Judge Court Curbs (merged into staticG!)
  const cngBank = {
    tire: bank.darkSlate, rim: bank.aluminum, darkTrim: bank.darkMetal, chrome: bank.aluminum,
    windshield: bank.windowGlass, headlight: bank.lampBulb, taillight: bank.ferryOrange, amber: bank.ferryOrange,
    cngGreen: bank.deckGreen, cngYellow: bank.tinBlue, cngRexine: bank.darkSlate,
  };
  for (const [cx, cz, cyaw] of [
    [-281.5, -833.4, Math.PI * 0.52],
    [55.5, -524.6, -Math.PI * 0.48],
    [146.5, -662.0, 0.24],
  ]) {
    const cng = buildCNGAuto(cngBank);
    cng.position.set(cx, 0.06, cz);
    cng.rotation.y = cyaw;
    staticG.add(cng);
  }

  // Illuminated Bengali Street Direction Signboards at Key Landmarks
  for (const [sx, sz, srot, title, subtitle] of [
    [-264.5, -835.2, 0, 'শহীদ হাদিস পার্ক রোড · পিসি রায় রোড', 'SHAHEED HADIS PARK · STADIUM LINK'],
    [104.5, -525.2, 0, 'সার্কিট হাউজ ও খুলনা জজ কোর্ট রোড', 'CIRCUIT HOUSE · BORO MAATH · JUDGE COURT'],
    [146.0, -729.5, 0, 'খুলনা জেলা স্টেডিয়াম রোড', 'KHULNA DISTRICT STADIUM · CIRCUIT HOUSE LINK'],
  ]) {
    addCyl(staticG, 0.06, 0.08, 3.6, [sx, 1.8, sz], bank.darkMetal, 8);
    addIlluminatedSign(dynamicG, bank, { title, subtitle, bg: '#0f3d2e', accent: '#fde047' }, [sx, 3.42, sz], srot, 3.8, 1.05);
  }

  // Roadside Shade Trees & Palms framing Circuit House Rd, Stadium Ring & Hadis Park Frontage
  for (const [tx, tz, isPalm] of [
    [126, -590, false], [149.2, -642, true], [174, -775, false],
    [192, -845, true], [78, -948, false], [-22, -834, true],
    [-174, -765, false], [-174, -640, true], [-102, -605, false],
    [-253, -860, false], [-253, -915, true], [-315, -822, false], [-360, -822, true],
  ]) {
    if (isPalm) helpers.addPalm?.(dynamicG, tx, 0, tz, 7.6, (tx + tz) * 0.02, 0.35);
    else helpers.addBroadleafTree?.(treesG, tx, 0, tz, 1.04, 1400 + Math.abs(tx + tz));
  }
}

/**
 * Builds ALL five GTA-VI-quality sliced Showcase Corridors:
 * 1) Haji Mohsin Road Corridor (z = -140..+140)
 * 2) Rupsha Strand Road, Natun Bazar Launch Ghat & Rupsha Ferry Terminal
 * 3) Tootpara Taltola House Neighborhood (420, 975)
 * 4) Altapole Lane Corridor (আলতাপোল লেন · x ≈ 166, z = -519..-296)
 * 5) Hadis Park, Stadium, Boro Maath, Circuit House & Judge Court Taltola-Style Pitch Road Network
 */
export function buildKhulnaCorridors(parent, m, helpers = {}) {
  const group = new THREE.Group();
  group.name = 'KhulnaAAACorridors';
  parent.add(group);

  const bank = createCorridorBank();

  function makeSlice(name, cx, cz, maxDist) {
    const root = new THREE.Group();
    root.name = name;
    const staticG = new THREE.Group();
    const dynamicG = new THREE.Group();
    const treesG = new THREE.Group();
    root.add(staticG, dynamicG, treesG);
    group.add(root);
    return { name, cx, cz, maxDistSq: maxDist * maxDist, root, staticG, dynamicG, treesG };
  }

  const hajiSlice = makeSlice('KhulnaSlice_HajiMohsin', 0, 0, 215);
  const rupshaSlice = makeSlice('KhulnaSlice_RupshaWaterfront', 1160, 320, 440);
  const taltolaSlice = makeSlice('KhulnaSlice_TaltolaHouse', TALTOLA_HOUSE_OFFSET.x, TALTOLA_HOUSE_OFFSET.z, 320);
  const altapoleSlice = makeSlice('KhulnaSlice_AltapoleLane', 166, -408, 250);
  const circuitRoadsSlice = makeSlice('KhulnaSlice_CircuitStadiumRoads', -95, -735, 660);

  buildHajiMohsinCorridor(hajiSlice.staticG, hajiSlice.dynamicG, bank, m, helpers, hajiSlice.treesG);
  const riverVessels = buildRupshaWaterfrontCorridor(rupshaSlice.staticG, rupshaSlice.dynamicG, bank, m, helpers);
  buildTaltolaNeighborhoodCorridor(taltolaSlice.staticG, taltolaSlice.dynamicG, bank, m, helpers, taltolaSlice.treesG);
  buildAltapoleLaneCorridor(altapoleSlice.staticG, altapoleSlice.dynamicG, bank, m, helpers, altapoleSlice.treesG);
  buildCircuitStadiumRoadNetwork(circuitRoadsSlice.staticG, circuitRoadsSlice.dynamicG, bank, m, helpers, circuitRoadsSlice.treesG);

  const slices = [hajiSlice, rupshaSlice, taltolaSlice, altapoleSlice, circuitRoadsSlice];
  for (const s of slices) {
    mergeCorridorStatic(s.staticG);
    if (s !== rupshaSlice) mergeCorridorStatic(s.dynamicG);
    helpers.finalizeTrees?.(s.treesG);
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
    setNightFactor(nightFactor) {
      const nf = Math.max(0, Math.min(1, nightFactor || 0));
      for (const e of bank.emissiveMaterials) {
        e.mat.emissiveIntensity = e.day + (e.night - e.day) * nf;
      }
    },
    update(time, playerPos = null, skipSyncVisibility = false) {
      if (playerPos && !skipSyncVisibility) syncVisibility(playerPos);
      if (rupshaSlice.root.visible) {
        for (const v of riverVessels) {
          v.obj.position.y = v.baseY + Math.sin(time * v.speed + v.phase) * v.amp;
          v.obj.rotation.z = Math.cos(time * v.speed * 0.8 + v.phase) * 0.022;
        }
      }
    },
    setVisible(visible) {
      group.visible = visible;
    },
  };
}
