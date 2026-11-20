import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { attachDerivedPBRMaps, upgradeWetAsphaltMaterial } from './aaa-shaders.js';
import { buildBanglaTruck, buildCNGAuto } from './khulna-vehicles.js';

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
    if (b.meshes.length < 2) continue;
    const merged = mergeGeometries(b.geometries, false);
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, b.material);
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.receive;
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

function addUtilityPoleAndLamp(staticG, dynamicG, bank, px, pz, armDirX = 1, hasTransformer = false, wireTargets = null) {
  addCyl(staticG, 0.11, 0.16, 9.2, [px, 4.6, pz], bank.poleConcrete, 8);
  // Concrete footing collar
  addCyl(staticG, 0.22, 0.24, 0.32, [px, 0.16, pz], bank.dampPlinth, 8);
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
  torus.position.set(px + armDirX * 0.22, 5.4, pz);
  torus.rotation.y = Math.PI / 2;
  staticG.add(torus);

  if (hasTransformer) {
    addBox(staticG, [0.75, 0.12, 1.2], [px + armDirX * 0.38, 6.2, pz], bank.darkMetal);
    addCyl(staticG, 0.34, 0.34, 1.05, [px + armDirX * 0.45, 6.82, pz - 0.25], bank.transformerMat, 10);
    addCyl(staticG, 0.28, 0.28, 0.92, [px + armDirX * 0.45, 6.76, pz + 0.32], bank.transformerMat, 10);
  }
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
    addBox(staticG, [width, 0.05, len], [(x0 + x1) * 0.5, y, (z0 + z1) * 0.5], mat, {
      rotY: yaw,
      castShadow: false,
      uvScale,
    });
  }
}

function buildHajiMohsinCorridor(staticG, dynamicG, bank, m, helpers, treesG = staticG) {
  const wireMat = m.wire;

  // 1) Wet-puddle continuous road aprons north (-140..-38) & south (38..140) matching OSM curves
  const northRoadPts = [[0, -37], [3.2, -55.3], [11.5, -94], [21.5, -142]];
  const southRoadPts = [[0, 37], [-4.5, 52.4], [-8.8, 82], [-15.2, 140]];
  buildPavedSegmentRoad(staticG, northRoadPts, 5.2, 0.028, m.road, 5.5);
  buildPavedSegmentRoad(staticG, southRoadPts, 5.2, 0.028, m.road, 5.5);
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
  for (const arr of [eastWires, westWires]) {
    for (let i = 0; i < arr.length - 1; i++) {
      helpers.addWire?.(staticG, arr[i], arr[i + 1], wireMat, 0.45, 0.016);
      helpers.addWire?.(staticG, [arr[i][0], arr[i][1] - 0.65, arr[i][2]], [arr[i + 1][0], arr[i + 1][1] - 0.65, arr[i + 1][2]], wireMat, 0.52, 0.022);
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
  buildPavedSegmentRoad(staticG, strandRoadPts, 7.6, 0.032, m.road, 5.5);

  // 3) Natun Bazar Launch Ghat Plaza, Ticket Shed, Stepped Ghat & Moored MV RUPSHA LAUNCH (z = -18..64, bank x ~ 1163)
  const ghatBankX = getRiverWestBankX(34); // ~1163.4
  // Broad paved asphalt + concrete port forecourt spanning from Strand Rd right out to embankment (covers z = -18..64)
  addBox(staticG, [74, 0.12, 82], [ghatBankX - 38, 0.015, 23], m.road, { castShadow: false, uvScale: 5.5 });
  addBox(staticG, [46, 0.14, 48], [ghatBankX - 24, 0.045, 34], m.concrete, { castShadow: false, uvScale: 3.2 });
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
  // Broad paved marshalling yard spanning both sides of Ferry Approach Rd so no bare land edge shows north of gate!
  addBox(staticG, [104, 0.08, 62], [1188, 0.025, 646], m.road, { castShadow: false, uvScale: 5.5 });
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
  // Surrounds enterable 5-Story Taltola House at (420, 975) along Tootpara Taltola Hospital Cross Rd
  const ox = 420.0;
  const oz = 975.0;

  // Curbed paved lane following real OSM spline & continuing south into Tootpara Cross Junction
  const crossLanePts = [
    [414.2, 922],
    [415.3, 936.2],
    [419.2, 967.2],
    [420.9, 990.8],
    [421.1, 1013.2],
    [418.2, 1034.0],
  ];
  buildPavedSegmentRoad(staticG, crossLanePts, 5.8, 0.028, m.road, 5.2);
  buildPavedSegmentRoad(staticG, [[421.1, 1013.2], [396.0, 1011.8]], 4.8, 0.024, m.road, 5.2);

  // Continuous red-brick footpaths on East (leaving driveway gap at house gate z=971..979) and West
  addBox(staticG, [1.45, 0.13, 35.5], [ox + 2.35, 0.02, oz - 21.25], m.brick, { uvScale: 2.2 });
  addBox(staticG, [1.45, 0.13, 35.5], [ox + 2.35, 0.02, oz + 21.25], m.brick, { uvScale: 2.2 });
  addBox(staticG, [1.35, 0.13, 74.0], [ox - 3.95, 0.02, oz], m.brick, { uvScale: 2.2 });

  // Green tropical roadside verges, tea-garden lawn & shaded compound plots
  addBox(staticG, [9.2, 0.08, 22.5], [ox - 9.0, 0.015, oz + 4.2], m.grass, { castShadow: false, uvScale: 2.6 });
  addBox(staticG, [4.0, 0.08, 12.0], [ox + 4.8, 0.015, oz - 9.5], m.grass, { castShadow: false, uvScale: 2.2 });
  addBox(staticG, [4.6, 0.08, 7.6], [ox + 5.2, 0.015, oz + 10.6], m.grass, { castShadow: false, uvScale: 2.2 });
  addBox(staticG, [7.2, 0.08, 10.5], [ox - 7.8, 0.015, oz + 38.5], m.grass, { castShadow: false, uvScale: 2.5 });

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
  cornerCng.position.set(ox - 1.9, 0.08, oz + 29.0);
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
  const poles = [];
  for (const pz of [oz - 28, oz - 4, oz + 20, oz + 42]) {
    const poleX = Math.min(ox - 3.65, crossLaneRoadX(pz) - 3.45);
    addUtilityPoleAndLamp(staticG, dynamicG, bank, poleX, pz, 1, false, poles);
  }
  for (let i = 0; i < poles.length - 1; i++) {
    helpers.addWire?.(staticG, poles[i], poles[i + 1], m.wire, 0.42, 0.016);
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
 * Builds ALL three GTA-VI-quality sliced Showcase Corridors:
 * 1) Haji Mohsin Road Corridor (z = -140..+140)
 * 2) Rupsha Strand Road, Natun Bazar Launch Ghat & Rupsha Ferry Terminal
 * 3) Tootpara Taltola House Neighborhood (420, 975)
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
  const taltolaSlice = makeSlice('KhulnaSlice_TaltolaHouse', 420, 975, 260);

  buildHajiMohsinCorridor(hajiSlice.staticG, hajiSlice.dynamicG, bank, m, helpers, hajiSlice.treesG);
  const riverVessels = buildRupshaWaterfrontCorridor(rupshaSlice.staticG, rupshaSlice.dynamicG, bank, m, helpers);
  buildTaltolaNeighborhoodCorridor(taltolaSlice.staticG, taltolaSlice.dynamicG, bank, m, helpers, taltolaSlice.treesG);

  const slices = [hajiSlice, rupshaSlice, taltolaSlice];
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
    update(time, playerPos = null) {
      if (playerPos) syncVisibility(playerPos);
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
