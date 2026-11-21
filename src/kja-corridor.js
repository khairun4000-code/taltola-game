import * as THREE from 'three';
import { box, cylinder, rodBetween, mergeStaticMeshes } from './scene-utils.js';
import { attachDerivedPBRMaps } from './aaa-shaders.js';

/**
 * KHAN JAHAN ALI ROAD (N7) CONTINUOUS CORRIDOR:
 * ROYAL MORE (রয়্যাল মোড়) <-> PTI MORE (পিটিআই মোড়) <-> KABORKHANA MORE (কবরখানা মোড়)
 *
 * Connects:
 *  - Segment A: Royal More SE [-648, -250.5] <-> PTI More NW [-388, -91.8]
 *  - Segment B: PTI More SE [-238, 31.8] <-> Babu Khan Rd [-195, 88] <-> Tutpara Main Rd [-50.6, 101.8]
 *               <-> Kaborkhana More / Haji Mohsin Rd [-10.6, 107.7] -> SE taper [49.3, 142.0]
 *  - Kaborkhana More Landmark Junction: KCC highway gantry, Tootpara Central Graveyard gate & wall,
 *    zebra crosswalks, smooth circular pitch junction pads, and Haji Mohsin / Tutpara / Babu Khan links.
 *
 * Built with single continuous mitered pitch-asphalt ribbons (ZERO Z-fighting), raised walkable
 * red-brick footpaths with black-yellow curbs, KCC center median with double-arm LED streetlamps,
 * static mesh batching, and 2 spatial culling slices for locked 60+ FPS.
 */

export const KABORKHANA_MORE_CENTER = { x: -20.0, z: 104.5 };

const FOOTPATH_H = 0.20;

const ROYAL_TO_PTI_PTS = [
  [-648.0, -250.5],
  [-620.0, -231.5],
  [-582.0, -207.5],
  [-548.5, -187.5],
  [-515.5, -167.5],
  [-477.5, -144.5],
  [-450.0, -128.0],
  [-409.5, -104.2],
  [-388.0, -91.8],
];

const PTI_TO_KABORKHANA_PTS = [
  [-238.0, 31.8],
  [-211.0, 64.5],
  [-195.0, 88.0],
  [-179.4, 94.2],
  [-159.1, 95.5],
  [-110.0, 99.0],
  [-50.6, 101.8],
  [-24.3, 103.5],
  [-10.6, 107.7],
  [49.3, 142.0],
];

const HAJI_MOHSIN_LINK_PTS = [
  [-10.6, 107.7],
  [-7.8, 83.5],
  [-4.5, 52.4],
  [-1.0, 41.0],
];

const TUTPARA_LINK_PTS = [
  [-50.6, 101.8],
  [-39.0, 124.0],
  [-28.0, 144.0],
];

const BABU_KHAN_LINK_PTS = [
  [-193.0, 87.0],
  [-190.5, 56.0],
];

const CENTRAL_RD_LINK_PTS = [
  [-179.0, 94.2],
  [-175.0, 126.0],
];

function seeded(seed = 2026) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makePitchTexture({ seedVal = 4071, centerDash = true, edgeLines = true, dustyShoulder = true } = {}) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  ctx.fillStyle = '#25292e';
  ctx.fillRect(0, 0, S, S);

  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(16, 18, 22, 0.30)' : 'rgba(54, 58, 66, 0.22)';
    ctx.fillRect(34 + rnd() * (S - 68), rnd() * S, 24 + rnd() * 64, 22 + rnd() * 58);
  }

  for (const lx of [S * 0.24, S * 0.37, S * 0.63, S * 0.76]) {
    const g = ctx.createLinearGradient(lx - 24, 0, lx + 24, 0);
    g.addColorStop(0, 'rgba(14,16,20,0)');
    g.addColorStop(0.5, 'rgba(12,14,18,0.28)');
    g.addColorStop(1, 'rgba(14,16,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(lx - 24, 0, 48, S);
  }

  for (let i = 0; i < 6200; i++) {
    const v = 30 + Math.floor(rnd() * 44);
    ctx.fillStyle = `rgba(${v},${v + 1},${v + 3},${0.20 + rnd() * 0.28})`;
    const sz = 1.2 + rnd() * 2.3;
    ctx.fillRect(rnd() * S, rnd() * S, sz, sz);
  }

  if (dustyShoulder) {
    const lg = ctx.createLinearGradient(0, 0, 34, 0);
    lg.addColorStop(0, 'rgba(116, 102, 82, 0.50)');
    lg.addColorStop(1, 'rgba(116, 102, 82, 0)');
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, 34, S);
    const rg = ctx.createLinearGradient(S, 0, S - 34, 0);
    rg.addColorStop(0, 'rgba(116, 102, 82, 0.50)');
    rg.addColorStop(1, 'rgba(116, 102, 82, 0)');
    ctx.fillStyle = rg;
    ctx.fillRect(S - 34, 0, 34, S);
  }

  if (edgeLines) {
    ctx.fillStyle = 'rgba(241, 245, 249, 0.76)';
    ctx.fillRect(22, 0, 7, S);
    ctx.fillRect(S - 29, 0, 7, S);
  }

  if (centerDash) {
    ctx.fillStyle = 'rgba(250, 204, 21, 0.88)';
    ctx.fillRect(S * 0.5 - 5, 24, 10, 176);
    ctx.fillRect(S * 0.5 - 5, 280, 10, 176);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeFootpathPaverTexture(seedVal = 4079) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = '#4c3e35';
  ctx.fillRect(0, 0, S, S);
  const rows = 8;
  const cols = 4;
  const bh = S / rows;
  const bw = S / cols;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (bw * 0.5);
    for (let col = -1; col <= cols; col++) {
      const bx = col * bw + off;
      const by = r * bh;
      const isRed = (r + col) % 3 !== 0;
      if (isRed) {
        ctx.fillStyle = `rgb(${156 + Math.floor(rnd() * 28)},${62 + Math.floor(rnd() * 18)},${48 + Math.floor(rnd() * 14)})`;
      } else {
        const v = 136 + Math.floor(rnd() * 26);
        ctx.fillStyle = `rgb(${v},${v - 2},${v - 6})`;
      }
      ctx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function makeCurbStripeTexture(colorA = '#facc15', colorB = '#18181b') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d');
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 === 0 ? colorA : colorB;
    ctx.fillRect(i * 64, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeSignTexture({ title, subtitle = '', bg = '#065f46', fg = '#ffffff', accent = '#fde047', border = '#ffffff' }) {
  const W = 768;
  const H = 200;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = border;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.fillStyle = accent;
  ctx.fillRect(20, 20, 12, H - 40);

  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 42px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText(title, 48, subtitle ? H * 0.38 : H * 0.50, W - 72);
  if (subtitle) {
    ctx.fillStyle = accent;
    ctx.font = '600 24px "Manrope", "Noto Sans Bengali", sans-serif';
    ctx.fillText(subtitle, 48, H * 0.72, W - 72);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function createCorridorBank(m) {
  const mkPitch = (opts, polyFactor) => {
    const tex = makePitchTexture(opts);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.74,
      metalness: 0.05,
      envMapIntensity: 0.50,
      polygonOffset: true,
      polygonOffsetFactor: polyFactor,
      polygonOffsetUnits: polyFactor,
    });
    attachDerivedPBRMaps(mat, tex, { strength: 2.0, roughBase: 0.74, normalScale: 0.64 });
    return mat;
  };

  const pitchHighway = mkPitch({ seedVal: 4071, centerDash: true, edgeLines: true, dustyShoulder: true }, -2);
  const pitchSideRoad = mkPitch({ seedVal: 4073, centerDash: false, edgeLines: true, dustyShoulder: true }, -2);
  const pitchJunction = mkPitch({ seedVal: 4075, centerDash: false, edgeLines: false, dustyShoulder: false }, -3);
  pitchJunction.map.repeat.set(3.2, 3.2);

  const fpTex = makeFootpathPaverTexture(4079);
  const footpathMat = new THREE.MeshStandardMaterial({ map: fpTex, roughness: 0.84, metalness: 0.02 });
  attachDerivedPBRMaps(footpathMat, fpTex, { strength: 2.2, roughBase: 0.84, normalScale: 0.66 });

  const curbHazardTex = makeCurbStripeTexture('#facc15', '#18181b');
  const curbMedianTex = makeCurbStripeTexture('#f8fafc', '#18181b');

  const bank = {
    pitchHighway,
    pitchSideRoad,
    pitchJunction,
    footpath: footpathMat,
    curbHazard: new THREE.MeshStandardMaterial({ map: curbHazardTex, roughness: 0.72 }),
    curbMedian: new THREE.MeshStandardMaterial({ map: curbMedianTex, roughness: 0.72 }),
    roadWhite: new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.76,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    }),
    steelDark: new THREE.MeshStandardMaterial({ color: 0x1e252c, roughness: 0.44, metalness: 0.74 }),
    aluminum: new THREE.MeshStandardMaterial({ color: 0xd0d8e0, roughness: 0.26, metalness: 0.86 }),
    poleConcrete: new THREE.MeshStandardMaterial({ color: 0x8f9490, roughness: 0.90 }),
    whitePlaster: m.whiteBand || new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.80 }),
    brick: m.brick || new THREE.MeshStandardMaterial({ color: 0x9b4634, roughness: 0.86 }),
    emeraldDark: new THREE.MeshStandardMaterial({ color: 0x0f3d2e, roughness: 0.60 }),
    emeraldMat: new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.50 }),
    foliage: new THREE.MeshStandardMaterial({ color: 0x2c6b36, roughness: 0.88 }),
    trunk: m.trunk || new THREE.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.90 }),
    goldMat: new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.30, metalness: 0.82 }),
    wire: m.wire || new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 }),
    lampBulb: new THREE.MeshStandardMaterial({ color: 0xfff8e6, emissive: 0xffdf99, emissiveIntensity: 1.25 }),
    emissiveList: [],
  };
  bank.emissiveList.push({ mat: bank.lampBulb, day: 0.9, night: 3.4 });
  return bank;
}

/**
 * Single continuous mitered Bangladeshi pitch-asphalt ribbon along a polyline.
 * Eliminates overhanging box corners and Z-fighting at curves.
 */
function addPitchRoadAlongPolyline(staticG, pts, roadHalfW, mat, yTop = 0.052) {
  if (!pts || pts.length < 2) return;
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  let distAcc = 0;

  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i];
    let nx = 0;
    let nz = 0;
    if (i > 0) {
      const dx = x - pts[i - 1][0];
      const dz = z - pts[i - 1][1];
      const l = Math.hypot(dx, dz) || 1;
      distAcc += l;
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

    positions.push(x - nx * roadHalfW, yTop, z - nz * roadHalfW);
    positions.push(x + nx * roadHalfW, yTop, z + nz * roadHalfW);
    normals.push(0, 1, 0, 0, 1, 0);
    const vCoord = distAcc * 0.095;
    uvs.push(0, vCoord, 1, vCoord);

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

function addPitchJunctionDisc(staticG, cx, cz, radius, mat, yTop = 0.058) {
  const geo = new THREE.CircleGeometry(radius, 36);
  geo.rotateX(-Math.PI * 0.5);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(cx, yTop, cz);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  staticG.add(mesh);
}

function addRotBox(parent, size, pos, mat, rotY = 0, opts = {}) {
  const mesh = box(parent, size, pos, mat, opts);
  if (rotY) mesh.rotation.y = rotY;
  return mesh;
}

function addSignBox(dynamicG, bank, opts, pos, rotY, w, h) {
  const tex = makeSignTexture(opts);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: 0.36,
    roughness: 0.30,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });
  bank.emissiveList.push({ mat, day: 0.34, night: 1.50 });
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);
  g.rotation.y = rotY;
  g.add(
    new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.12), bank.steelDark),
    new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.145), mat),
  );
  dynamicG.add(g);
  return g;
}

/**
 * Adds raised walkable red-brick footpaths + black-yellow curbs along a polyline,
 * automatically skipping any segment that overlaps a cross-street junction clearance disc.
 */
function addFootpathsAlongPolyline(staticG, bank, pts, roadHalfW, walkW, clearanceDiscs, footpathZones) {
  const curbW = 0.24;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const totalLen = Math.hypot(dx, dz);
    if (totalLen < 1.0) continue;
    const ux = dx / totalLen;
    const uz = dz / totalLen;
    const nx = -uz;
    const nz = ux;
    const yaw = Math.atan2(dx, dz);

    // Subdivide into ~8m chunks so footpaths cleanly break right around side-road mouths
    const steps = Math.max(1, Math.ceil(totalLen / 8.0));
    const chunkLen = totalLen / steps;
    for (let s = 0; s < steps; s++) {
      const tMid = (s + 0.5) / steps;
      const cx = x0 + dx * tMid;
      const cz = z0 + dz * tMid;

      for (const side of [-1, 1]) {
        const fpOff = roadHalfW + curbW + walkW * 0.5;
        const curbOff = roadHalfW + curbW * 0.5;
        const fx = cx + nx * side * fpOff;
        const fz = cz + nz * side * fpOff;

        let blocked = false;
        for (const [jx, jz, jr] of clearanceDiscs) {
          if (Math.hypot(fx - jx, fz - jz) < jr) {
            blocked = true;
            break;
          }
        }
        if (blocked) continue;

        const hStagger = FOOTPATH_H + ((i + s) % 2) * 0.002;
        addRotBox(
          staticG,
          [walkW, hStagger, chunkLen + 0.35],
          [fx, hStagger * 0.5, fz],
          bank.footpath,
          yaw,
          { castShadow: false, uvScale: 2.0 },
        );
        addRotBox(
          staticG,
          [curbW, hStagger + 0.02, chunkLen + 0.38],
          [cx + nx * side * curbOff, (hStagger + 0.02) * 0.5, cz + nz * side * curbOff],
          bank.curbHazard,
          yaw,
          { castShadow: false, uvScale: 1.8 },
        );

        footpathZones.push({
          x0: x0 + dx * (s / steps) + nx * side * fpOff,
          z0: z0 + dz * (s / steps) + nz * side * fpOff,
          x1: x0 + dx * ((s + 1) / steps) + nx * side * fpOff,
          z1: z0 + dz * ((s + 1) / steps) + nz * side * fpOff,
          halfW: walkW * 0.5 + 0.25,
        });
      }
    }
  }
}

/**
 * Adds KCC central median divider with double-arm LED streetlamps along straight highway runs.
 */
function addMedianAndLamps(staticG, dynamicG, bank, pts, clearanceDiscs, colliders, { lampSpacing = 36, withMedian = true } = {}) {
  let distSinceLamp = lampSpacing * 0.45;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const segLen = Math.hypot(dx, dz);
    if (segLen < 1.0) continue;
    const ux = dx / segLen;
    const uz = dz / segLen;
    const nx = -uz;
    const nz = ux;
    const yaw = Math.atan2(dx, dz);

    if (withMedian) {
      const steps = Math.max(1, Math.ceil(segLen / 10.0));
      const chunkLen = segLen / steps;
      for (let s = 0; s < steps; s++) {
        const tMid = (s + 0.5) / steps;
        const mx = x0 + dx * tMid;
        const mz = z0 + dz * tMid;
        let blocked = false;
        for (const [jx, jz, jr] of clearanceDiscs) {
          if (Math.hypot(mx - jx, mz - jz) < jr + 4.0) {
            blocked = true;
            break;
          }
        }
        if (blocked) continue;
        addRotBox(staticG, [0.76, 0.24, chunkLen - 0.15], [mx, 0.12, mz], bank.curbMedian, yaw, { castShadow: false, uvScale: 2.0 });
        if ((i + s) % 2 === 0) {
          const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), bank.foliage);
          bush.position.set(mx, 0.48, mz);
          bush.scale.set(0.9, 0.72, 1.3);
          staticG.add(bush);
        }
      }
    }

    let d = distSinceLamp;
    while (d < segLen) {
      const px = x0 + ux * d;
      const pz = z0 + uz * d;
      let blocked = false;
      for (const [jx, jz, jr] of clearanceDiscs) {
        if (Math.hypot(px - jx, pz - jz) < jr + 3.0) {
          blocked = true;
          break;
        }
      }
      if (!blocked) {
        if (withMedian) {
          // Double-arm highway LED streetlamp on center median
          cylinder(staticG, 0.09, 0.14, 8.2, [px, 4.1, pz], bank.steelDark, 8);
          addRotBox(staticG, [2.6, 0.08, 0.08], [px, 8.15, pz], bank.aluminum, yaw);
          for (const side of [-1, 1]) {
            const lx = px + nx * side * 1.25;
            const lz = pz + nz * side * 1.25;
            addRotBox(staticG, [0.46, 0.10, 0.22], [lx, 8.12, lz], bank.steelDark, yaw);
            addRotBox(dynamicG, [0.36, 0.05, 0.16], [lx, 8.05, lz], bank.lampBulb, yaw, { castShadow: false });
          }
          colliders.push({ x: px, z: pz, r: 0.45 });
        } else {
          // Single-arm roadside cobra streetlamp on North footpath
          const lx = px + nx * 7.25;
          const lz = pz + nz * 7.25;
          cylinder(staticG, 0.08, 0.12, 8.0, [lx, 4.0, lz], bank.poleConcrete, 8);
          addRotBox(staticG, [1.5, 0.07, 0.08], [lx - nx * 0.72, 7.85, lz - nz * 0.72], bank.aluminum, yaw);
          addRotBox(dynamicG, [0.38, 0.06, 0.18], [lx - nx * 1.42, 7.80, lz - nz * 1.42], bank.lampBulb, yaw, { castShadow: false });
          colliders.push({ x: lx, z: lz, r: 0.35 });
        }
      }
      d += lampSpacing;
    }
    distSinceLamp = d - segLen;
  }
}

function addShadeTreesAlongPolyline(staticG, bank, pts, offsetDist, clearanceDiscs, step = 42, seedVal = 5101) {
  const rnd = seeded(seedVal);
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    if (len < 12) continue;
    const nx = -dz / len;
    const nz = dx / len;
    const count = Math.max(1, Math.floor(len / step));
    for (let k = 0; k < count; k++) {
      const t = (k + 0.5) / count;
      const side = ((i + k) % 2 === 0) ? 1 : -1;
      const tx = x0 + dx * t + nx * side * offsetDist;
      const tz = z0 + dz * t + nz * side * offsetDist;
      let blocked = false;
      for (const [jx, jz, jr] of clearanceDiscs) {
        if (Math.hypot(tx - jx, tz - jz) < jr + 4.5) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;
      const h = 4.2 + rnd() * 2.2;
      cylinder(staticG, 0.22, 0.34, h * 0.58, [tx, h * 0.29, tz], bank.trunk, 7);
      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(2.1 + rnd() * 0.7, 1), bank.foliage);
      crown.position.set(tx, h * 0.72, tz);
      crown.scale.set(1.1, 0.85, 1.1);
      staticG.add(crown);
    }
  }
}

function addZebraCrosswalk(staticG, bank, cx, cz, yaw, width = 9.6, depth = 2.6) {
  const count = Math.floor(width / 0.95);
  const start = -(count - 1) * 0.475;
  for (let i = 0; i < count; i++) {
    const off = start + i * 0.95;
    const sx = cx + Math.cos(yaw) * off;
    const sz = cz - Math.sin(yaw) * off;
    addRotBox(staticG, [0.42, 0.012, depth], [sx, 0.068, sz], bank.roadWhite, yaw, { castShadow: false });
  }
}

/**
 * Builds the recognizable Kaborkhana More (টুটপাড়া কবরখানা মোড়) Junction Landmark:
 * - Overhead KCC highway directional gantry spanning Khan Jahan Ali Road
 * - Tootpara Central Graveyard (টুটপাড়া কেন্দ্রীয় কবরখানা) Islamic arched gateway & compound wall
 *   at real OSM location (-23.9, 109.9), cleanly set back from the road edge!
 */
function buildKaborkhanaMoreLandmark(staticG, dynamicG, bank, colliders) {
  // 1) Overhead Highway Directional Gantry spanning Khan Jahan Ali Road just west of Haji Mohsin Rd mouth
  const gx = -26.0;
  const gz = 103.5;
  const gYaw = Math.atan2(13.7, 4.2); // aligned with Khan Jahan Ali Rd tangent
  const nx = -Math.sin(gYaw);
  const nz = Math.cos(gYaw);
  // Twin steel gantry pylons placed cleanly on the footpaths (7.4m from centerline)
  for (const side of [-7.5, 7.5]) {
    const px = gx + nx * side;
    const pz = gz + nz * side;
    cylinder(staticG, 0.20, 0.26, 6.8, [px, 3.4, pz], bank.steelDark, 10);
    box(staticG, [0.72, 0.55, 0.72], [px, 0.28, pz], bank.curbHazard);
    colliders.push({ x: px, z: pz, r: 0.55 });
  }
  addRotBox(staticG, [0.32, 0.45, 15.6], [gx, 6.45, gz], bank.steelDark, gYaw);
  addSignBox(
    dynamicG,
    bank,
    {
      title: 'কবরখানা মোড় (KABORKHANA MORE) · N7',
      subtitle: '← পিটিআই মোড় / রয়্যাল মোড়  |  ↑ হাজী মহসিন রোড  |  → আলিয়া মাদ্রাসা / রূপসা',
      bg: '#065f46',
      fg: '#ffffff',
      accent: '#fde047',
      border: '#ffffff',
    },
    [gx, 6.45, gz],
    gYaw + Math.PI * 0.5,
    8.6,
    1.75,
  );

  // 2) Tootpara Central Graveyard (টুটপাড়া কেন্দ্রীয় কবরখানা) Front Compound Wall & Arched Gate (z = 114.5, x = -38..-12)
  const wallZ = 114.6;
  const gateX = -24.5;
  // Left & right white-and-brick compound wall wings with iron grill top
  for (const [x0, x1] of [[-40.0, gateX - 2.6], [gateX + 2.6, -11.5]]) {
    const len = x1 - x0;
    const midX = (x0 + x1) * 0.5;
    box(staticG, [len, 1.55, 0.34], [midX, 0.78, wallZ], bank.whitePlaster);
    box(staticG, [len + 0.1, 0.16, 0.44], [midX, 1.62, wallZ], bank.emeraldDark);
    box(staticG, [len, 0.06, 0.08], [midX, 2.25, wallZ], bank.steelDark);
    for (let px = x0 + 0.6; px <= x1 - 0.4; px += 1.4) {
      box(staticG, [0.05, 0.65, 0.05], [px, 1.94, wallZ], bank.steelDark);
    }
    colliders.push({ minX: x0, maxX: x1, minZ: wallZ - 0.35, maxZ: wallZ + 0.35 });
  }
  // Ornate Emerald & White Arched Graveyard Entrance Pillars + Header Beam
  for (const dx of [-2.45, 2.45]) {
    box(staticG, [0.85, 4.4, 0.85], [gateX + dx, 2.2, wallZ], bank.whitePlaster);
    box(staticG, [0.98, 0.28, 0.98], [gateX + dx, 4.48, wallZ], bank.emeraldDark);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), bank.goldMat);
    dome.position.set(gateX + dx, 4.82, wallZ);
    staticG.add(dome);
    colliders.push({ x: gateX + dx, z: wallZ, r: 0.65 });
  }
  box(staticG, [5.8, 1.15, 0.68], [gateX, 4.55, wallZ], bank.emeraldDark);
  box(staticG, [6.0, 0.18, 0.76], [gateX, 5.18, wallZ], bank.goldMat);
  addSignBox(
    dynamicG,
    bank,
    {
      title: 'টুটপাড়া কেন্দ্রীয় কবরখানা',
      subtitle: 'TOOTPARA CENTRAL GRAVEYARD · KABORKHANA MORE, KHULNA',
      bg: '#064e3b',
      fg: '#ffffff',
      accent: '#fde047',
      border: '#fde047',
    },
    [gateX, 4.55, wallZ - 0.40],
    Math.PI,
    5.2,
    0.96,
  );
  // Shade trees & calm green lawn inside graveyard compound behind the wall
  box(staticG, [29.0, 0.06, 18.0], [-25.5, 0.02, wallZ + 9.4], bank.emeraldMat, { castShadow: false });
  for (const [tx, tz] of [[-35.0, wallZ + 5.5], [-16.0, wallZ + 6.0], [-29.0, wallZ + 12.5], [-20.0, wallZ + 13.0]]) {
    cylinder(staticG, 0.24, 0.36, 3.6, [tx, 1.8, tz], bank.trunk, 7);
    const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(2.5, 1), bank.foliage);
    crown.position.set(tx, 4.4, tz);
    staticG.add(crown);
  }
}

function pointToSegmentDistSq(px, pz, x0, z0, x1, z1) {
  const vx = x1 - x0;
  const vz = z1 - z0;
  const wx = px - x0;
  const wz = pz - z0;
  const lenSq = vx * vx + vz * vz;
  const t = lenSq > 1e-6 ? THREE.MathUtils.clamp((wx * vx + wz * vz) / lenSq, 0, 1) : 0;
  const cx = x0 + vx * t;
  const cz = z0 + vz * t;
  return (px - cx) * (px - cx) + (pz - cz) * (pz - cz);
}

export function buildKjaCorridorDistrict(parent, m) {
  const group = new THREE.Group();
  group.name = 'KhulnaCorridor_RoyalPtiKaborkhana';
  parent.add(group);

  const bank = createCorridorBank(m);
  const footpathZones = [];
  const colliders = [];

  // Two spatial slices so both halves stay visible with zero gaps while keeping GPU draw calls low
  const slices = [
    {
      name: 'KjaSlice_RoyalToPti',
      cx: -518.0,
      cz: -170.0,
      maxDistSq: 440 * 440,
      root: new THREE.Group(),
      staticG: new THREE.Group(),
      dynamicG: new THREE.Group(),
    },
    {
      name: 'KjaSlice_PtiToKaborkhana',
      cx: -115.0,
      cz: 74.0,
      maxDistSq: 440 * 440,
      root: new THREE.Group(),
      staticG: new THREE.Group(),
      dynamicG: new THREE.Group(),
    },
  ];
  for (const s of slices) {
    s.root.name = s.name;
    s.root.add(s.staticG, s.dynamicG);
    group.add(s.root);
  }

  // ============================================================================
  // SLICE 1: ROYAL MORE SE [-648, -250.5] <-> PTI MORE NW [-388, -91.8]
  // ============================================================================
  {
    const { staticG, dynamicG } = slices[0];
    const clearance1 = [
      [-648.0, -250.5, 11.0],
      [-388.0, -91.8, 10.0],
    ];
    addPitchRoadAlongPolyline(staticG, ROYAL_TO_PTI_PTS, 6.2, bank.pitchHighway, 0.052);
    // Smooth transition pads at both ends (matches Royal More & PTI More seamlessly)
    addPitchJunctionDisc(staticG, -646.0, -249.2, 7.0, bank.pitchJunction, 0.048);
    addPitchJunctionDisc(staticG, -389.0, -92.4, 6.4, bank.pitchJunction, 0.054);

    addFootpathsAlongPolyline(staticG, bank, ROYAL_TO_PTI_PTS, 6.2, 1.85, clearance1, footpathZones);
    addMedianAndLamps(staticG, dynamicG, bank, ROYAL_TO_PTI_PTS, clearance1, colliders, { lampSpacing: 36, withMedian: true });
    addShadeTreesAlongPolyline(staticG, bank, ROYAL_TO_PTI_PTS, 10.2, clearance1, 44, 5101);

    // Mid-corridor zebra crosswalk & directional sign
    const midYaw = Math.atan2(ROYAL_TO_PTI_PTS[5][0] - ROYAL_TO_PTI_PTS[4][0], ROYAL_TO_PTI_PTS[5][1] - ROYAL_TO_PTI_PTS[4][1]);
    addZebraCrosswalk(staticG, bank, -515.5, -167.5, midYaw, 10.8, 2.5);
  }

  // ============================================================================
  // SLICE 2: PTI MORE SE [-238, 31.8] <-> KABORKHANA MORE [-10.6, 107.7] -> [49.3, 142]
  // ============================================================================
  {
    const { staticG, dynamicG } = slices[1];
    const clearance2 = [
      [-238.0, 31.8, 10.0],
      [-193.5, 87.5, 12.5], // Babu Khan Rd / Central Rd junction
      [-179.0, 94.2, 10.5],
      [-50.6, 101.8, 12.5], // Tutpara Main Rd fork
      [-14.5, 106.0, 14.5], // Kaborkhana More / Haji Mohsin Rd junction
      [49.3, 142.0, 10.0],
    ];

    // Main Khan Jahan Ali Road continuous pitch highway
    addPitchRoadAlongPolyline(staticG, PTI_TO_KABORKHANA_PTS, 6.0, bank.pitchHighway, 0.052);
    // Side road pitch connectors (slightly lower so junction discs sit cleanly on top)
    addPitchRoadAlongPolyline(staticG, HAJI_MOHSIN_LINK_PTS, 3.4, bank.pitchSideRoad, 0.048);
    addPitchRoadAlongPolyline(staticG, TUTPARA_LINK_PTS, 3.4, bank.pitchSideRoad, 0.048);
    addPitchRoadAlongPolyline(staticG, BABU_KHAN_LINK_PTS, 3.4, bank.pitchSideRoad, 0.048);
    addPitchRoadAlongPolyline(staticG, CENTRAL_RD_LINK_PTS, 3.2, bank.pitchSideRoad, 0.048);

    // Seamless circular pitch junction pads at every intersection (ZERO jagged corners / ZERO Z-fighting!)
    addPitchJunctionDisc(staticG, -237.0, 33.0, 6.5, bank.pitchJunction, 0.054);
    addPitchJunctionDisc(staticG, -193.5, 87.5, 10.5, bank.pitchJunction, 0.058);
    addPitchJunctionDisc(staticG, -179.0, 94.2, 8.2, bank.pitchJunction, 0.058);
    addPitchJunctionDisc(staticG, -50.6, 101.8, 10.5, bank.pitchJunction, 0.058);
    addPitchJunctionDisc(staticG, -13.0, 106.5, 13.5, bank.pitchJunction, 0.059);

    addFootpathsAlongPolyline(staticG, bank, PTI_TO_KABORKHANA_PTS, 6.0, 1.85, clearance2, footpathZones);
    addMedianAndLamps(staticG, dynamicG, bank, PTI_TO_KABORKHANA_PTS, clearance2, colliders, { lampSpacing: 36, withMedian: false });
    addShadeTreesAlongPolyline(staticG, bank, PTI_TO_KABORKHANA_PTS, 10.0, clearance2, 46, 5207);

    // Kaborkhana More Landmark (Overhead Highway Gantry + Tootpara Central Graveyard Gate & Wall)
    buildKaborkhanaMoreLandmark(staticG, dynamicG, bank, colliders);

    // Crisp zebra crosswalks at Kaborkhana More & Babu Khan Rd junction
    addZebraCrosswalk(staticG, bank, -34.0, 102.8, Math.atan2(26.3, 1.7), 10.4, 2.5);
    addZebraCrosswalk(staticG, bank, -9.2, 93.0, Math.atan2(-2.8, -24.2), 6.2, 2.2);
    addZebraCrosswalk(staticG, bank, -168.0, 95.0, Math.atan2(20.3, 1.3), 10.4, 2.4);
  }

  for (const s of slices) {
    mergeStaticMeshes(s.staticG);
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

  function getGroundHeight(pos) {
    if (!pos) return 0.0;
    if (pos.x < -662 || pos.x > 64 || pos.z < -265 || pos.z > 158) return 0.0;
    for (let i = 0; i < footpathZones.length; i++) {
      const f = footpathZones[i];
      if (pointToSegmentDistSq(pos.x, pos.z, f.x0, f.z0, f.x1, f.z1) <= f.halfW * f.halfW) {
        return FOOTPATH_H;
      }
    }
    return 0.0;
  }

  function applyCollisions(pos, radius = 0.34, footY = 0) {
    if (!pos || footY > 3.2) return;
    if (pos.x < -662 || pos.x > 64 || pos.z < -265 || pos.z > 158) return;
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (c.r !== undefined) {
        const dx = pos.x - c.x;
        const dz = pos.z - c.z;
        const minR = c.r + radius;
        const dSq = dx * dx + dz * dz;
        if (dSq < minR * minR && dSq > 1e-8) {
          const d = Math.sqrt(dSq);
          pos.x += (dx / d) * (minR - d);
          pos.z += (dz / d) * (minR - d);
        }
      } else {
        const cx = THREE.MathUtils.clamp(pos.x, c.minX, c.maxX);
        const cz = THREE.MathUtils.clamp(pos.z, c.minZ, c.maxZ);
        const dx = pos.x - cx;
        const dz = pos.z - cz;
        const dSq = dx * dx + dz * dz;
        if (dSq < radius * radius && dSq > 1e-8) {
          const d = Math.sqrt(dSq);
          pos.x += (dx / d) * (radius - d);
          pos.z += (dz / d) * (radius - d);
        }
      }
    }
  }

  return {
    group,
    syncVisibility,
    getGroundHeight,
    applyCollisions,
    setNightFactor(nightFactor = 0) {
      const nf = THREE.MathUtils.clamp(nightFactor, 0, 1);
      for (let i = 0; i < bank.emissiveList.length; i++) {
        const item = bank.emissiveList[i];
        item.mat.emissiveIntensity = item.day + (item.night - item.day) * nf;
      }
    },
    update(_time, playerPos = null) {
      if (playerPos) syncVisibility(playerPos);
    },
  };
}
