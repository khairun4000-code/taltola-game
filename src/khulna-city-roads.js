import * as THREE from 'three';
import {
  attachDerivedPBRMaps,
  upgradeWetAsphaltMaterial,
} from './aaa-shaders.js';
import { TALTOLA_HOUSE_OFFSET } from './khulna-geo.js';

function seeded(seed = 6019) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function pointToSegDistSq(px, pz, ax, az, bx, bz) {
  const vx = bx - ax;
  const vz = bz - az;
  const l2 = vx * vx + vz * vz;
  const t = l2 > 1e-6 ? Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / l2)) : 0;
  const dx = px - (ax + vx * t);
  const dz = pz - (az + vz * t);
  return dx * dx + dz * dz;
}

/**
 * Generates 1024x1024 Circuit-House-Maidan-grade Dark Pitch Asphalt textures:
 *  - 'major': Double-yellow center lines + crisp white edge stripes + sandy Khulna curb dust + dual wheel-wear tracks
 *  - 'mid':   Dashed yellow-white center line + crisp white edge stripes + sandy curb dust + wheel-wear tracks
 *  - 'lane':  Rich dark pitch lane with wheel-path polish & dusty edges
 *  - 'apron': Clean unmarked dark pitch asphalt for smooth intersection hubs (zero clashing lines!)
 */
function createCircuitGradeAsphaltTex(mode = 'major', maxAniso = 8) {
  const W = mode === 'lane' || mode === 'apron' ? 512 : 1024;
  const H = mode === 'lane' || mode === 'apron' ? 512 : 1024;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(W, H);
  const data = img.data;

  // Deterministic tileable value noise table
  const N = 64;
  const grid = new Float32Array(N * N);
  const rnd = seeded(mode === 'major' ? 6011 : (mode === 'mid' ? 6029 : 6047));
  for (let i = 0; i < N * N; i++) grid[i] = rnd();

  const sampleTileNoise = (fx, fy, freq) => {
    const gx = ((fx * freq) % N + N) % N;
    const gy = ((fy * freq) % N + N) % N;
    const x0 = gx | 0;
    const y0 = gy | 0;
    const x1 = (x0 + 1) % N;
    const y1 = (y0 + 1) % N;
    const tx = gx - x0;
    const ty = gy - y0;
    const ux = tx * tx * (3 - 2 * tx);
    const uy = ty * ty * (3 - 2 * ty);
    const a = grid[y0 * N + x0];
    const b = grid[y0 * N + x1];
    const cc = grid[y1 * N + x0];
    const d = grid[y1 * N + x1];
    return (a + (b - a) * ux) * (1 - uy) + (cc + (d - cc) * ux) * uy;
  };

  for (let y = 0; y < H; y++) {
    const v = y / H;
    for (let x = 0; x < W; x++) {
      const u = x / (W - 1);
      const nMacro = sampleTileNoise(u, v, 8);
      const nMid = sampleTileNoise(u + 0.37, v + 0.19, 24);
      const grain = (((x * 73856093) ^ (y * 19349663)) >>> 0) / 4294967296;

      // Rich dark Khulna pitch-asphalt base (matches Circuit House & Maidan road_asphalt_albedo!)
      let base = 0.255 + (nMacro - 0.5) * 0.055 + (nMid - 0.5) * 0.042 + (grain - 0.5) * 0.052;

      if (mode !== 'apron') {
        // Dual darkened rubber tire wear tracks at u = 0.28 and u = 0.72
        const d1 = (u - 0.28) / 0.105;
        const d2 = (u - 0.72) / 0.105;
        const wear = Math.exp(-d1 * d1) + Math.exp(-d2 * d2);
        base -= wear * 0.038;
      }

      let r = base;
      let g = base + 0.002;
      let b = base + 0.012;

      if (mode !== 'apron') {
        // Authentic sandy Khulna road-shoulder dust along outer curb gutters
        const edgeD = Math.min(u, 1.0 - u);
        const dustWidth = mode === 'lane' ? 0.10 : 0.115;
        if (edgeD < dustWidth) {
          const dust = Math.pow((dustWidth - edgeD) / dustWidth, 1.45) * (0.48 + nMacro * 0.34);
          r = r * (1.0 - dust) + 0.56 * dust;
          g = g * (1.0 - dust) + 0.52 * dust;
          b = b * (1.0 - dust) + 0.45 * dust;
        }

        // Crisp painted white edge stripes on Major & Mid city streets
        if (mode === 'major' || mode === 'mid') {
          const onEdgeLine = Math.abs(u - 0.082) < 0.0085 || Math.abs(u - 0.918) < 0.0085;
          if (onEdgeLine) {
            const pw = 0.78 + (nMid - 0.5) * 0.16;
            r = r * (1.0 - pw) + 0.89 * pw;
            g = g * (1.0 - pw) + 0.89 * pw;
            b = b * (1.0 - pw) + 0.86 * pw;
          }
        }

        // Center lane markings
        if (mode === 'major') {
          // Continuous Double-Yellow Highway/Avenue Center Lines (exact Maidan match!)
          const onDoubleYellow = Math.abs(u - 0.486) < 0.0078 || Math.abs(u - 0.514) < 0.0078;
          if (onDoubleYellow) {
            const py = 0.85 + (nMid - 0.5) * 0.14;
            r = r * (1.0 - py) + 0.92 * py;
            g = g * (1.0 - py) + 0.72 * py;
            b = b * (1.0 - py) + 0.16 * py;
          }
        } else if (mode === 'mid') {
          // Crisp Dashed Yellow Center Line on secondary streets
          const inDash = (v % 0.5) > 0.08 && (v % 0.5) < 0.38;
          if (inDash && Math.abs(u - 0.50) < 0.0085) {
            const py = 0.80 + (nMid - 0.5) * 0.15;
            r = r * (1.0 - py) + 0.90 * py;
            g = g * (1.0 - py) + 0.74 * py;
            b = b * (1.0 - py) + 0.22 * py;
          }
        }
      }

      const idx = (y * W + x) * 4;
      data[idx] = Math.max(0, Math.min(255, (r * 255) | 0));
      data[idx + 1] = Math.max(0, Math.min(255, (g * 255) | 0));
      data[idx + 2] = Math.max(0, Math.min(255, (b * 255) | 0));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAniso;
  return tex;
}

/**
 * Generates 1024x1024 Interlocking Diagonal Red / Cream / Grey Hexagonal Sidewalk Pavers
 * matching Khulna Circuit House & Circuit House Maidan (`gen_hex_pavers` in generate_textures.py)!
 */
function createHexPaverSidewalkTex(maxAniso = 8) {
  const W = 512;
  const H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(W, H);
  const data = img.data;

  const cols = 12;
  const rows = 14;
  const cellW = W / cols;
  const cellH = H / rows;

  for (let y = 0; y < H; y++) {
    const gy = y / cellH;
    const baseR = Math.floor(gy);
    for (let x = 0; x < W; x++) {
      const gx = x / cellW;
      const baseC = Math.floor(gx);

      let bestD = 1e9;
      let secondD = 1e9;
      let bestCid = 0;
      let bestRid = 0;

      for (let dr = -1; dr <= 1; dr++) {
        const rr = baseR + dr;
        const odd = (rr & 1) * 0.5;
        for (let dc = -1; dc <= 1; dc++) {
          const cc = baseC + dc;
          const cx = cc + 0.5 + odd;
          const cy = rr + 0.5;
          const dx = Math.abs(gx - cx);
          const dy = Math.abs(gy - cy) * 0.8660254;
          // True hexagonal norm
          const dHex = Math.max(dx, dx * 0.5 + dy);
          if (dHex < bestD) {
            secondD = bestD;
            bestD = dHex;
            bestCid = ((cc % cols) + cols) % cols;
            bestRid = ((rr % rows) + rows) % rows;
          } else if (dHex < secondD) {
            secondD = dHex;
          }
        }
      }

      const edge = secondD - bestD;
      const mortar = Math.max(0, Math.min(1, (0.065 - edge) / 0.042));

      // Diagonal chevron bands of Terracotta-Red, Warm Cream-Beige, and Slate-Grey!
      const diag = (bestCid + bestRid) % 6;
      const cellJit = (((bestCid * 73 + bestRid * 179) % 31) / 31.0 - 0.5) * 0.065;
      const fine = ((((x * 1597334677) ^ (y * 3812015801)) >>> 0) / 4294967296 - 0.5) * 0.045;

      let r = (diag < 2 ? 0.68 : (diag < 4 ? 0.81 : 0.55)) + cellJit + fine;
      let g = (diag < 2 ? 0.35 : (diag < 4 ? 0.77 : 0.56)) + cellJit + fine;
      let b = (diag < 2 ? 0.31 : (diag < 4 ? 0.70 : 0.57)) + cellJit + fine;

      r = r * (1.0 - mortar) + 0.23 * mortar;
      g = g * (1.0 - mortar) + 0.22 * mortar;
      b = b * (1.0 - mortar) + 0.21 * mortar;

      const idx = (y * W + x) * 4;
      data[idx] = Math.max(0, Math.min(255, (r * 255) | 0));
      data[idx + 1] = Math.max(0, Math.min(255, (g * 255) | 0));
      data[idx + 2] = Math.max(0, Math.min(255, (b * 255) | 0));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAniso;
  return tex;
}

/**
 * Generates Black-and-Yellow Striped Concrete Curb texture (repeats every 0.96m along road length:
 * 0.48m Matte Black #191b1f + 0.48m Highway Yellow #e5ad1c + concrete mortar seam).
 */
function createStripedCurbTex(maxAniso = 8) {
  const W = 128;
  const H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  // Top half: Highway Yellow block; Bottom half: Matte Black block
  ctx.fillStyle = '#e2a91b';
  ctx.fillRect(0, 0, W, 128);
  ctx.fillStyle = '#181a1f';
  ctx.fillRect(0, 128, W, 128);

  // Concrete mortar joints between curb stones
  ctx.fillStyle = '#475569';
  ctx.fillRect(0, 0, W, 5);
  ctx.fillRect(0, 125, W, 6);

  // Subtle top-bevel highlight & lower gutter grime
  const rnd = seeded(9021);
  for (let i = 0; i < 900; i++) {
    const x = rnd() * W;
    const y = rnd() * H;
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)';
    ctx.fillRect(x, y, 2 + rnd() * 3, 2 + rnd() * 3);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAniso;
  return tex;
}

function createDrainGrateTex() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3f464d';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#586069';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 118, 118);
  ctx.fillStyle = '#0f1317';
  for (let y = 18; y <= 102; y += 16) {
    ctx.fillRect(16, y, 42, 9);
    ctx.fillRect(70, y, 42, 9);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds the unified Circuit-House-Maidan-Grade Road, Junction Apron, Zebra Crosswalk,
 * 3D Black-and-Yellow Striped Curb, 3D Raised Hex-Paver Sidewalk, and Storm-Drain System
 * across ALL 349 streets of Khulna City in only 8 merged static draw calls!
 */
export function buildCircuitGradeCityRoadSystem(parentGroup, worldData, renderer, skySystem, shaderUniforms, isInWaterFn) {
  const maxAniso = renderer ? Math.min(12, renderer.capabilities.getMaxAnisotropy()) : 8;
  const envTex = skySystem?.getEnvTexture?.() || null;

  // 1. Create PBR Road, Curb, Hex-Paver & Crosswalk Materials
  const majorTex = createCircuitGradeAsphaltTex('major', maxAniso);
  const midTex = createCircuitGradeAsphaltTex('mid', maxAniso);
  const laneTex = createCircuitGradeAsphaltTex('lane', maxAniso);
  const apronTex = createCircuitGradeAsphaltTex('apron', maxAniso);
  const hexPaverTex = createHexPaverSidewalkTex(maxAniso);
  const curbStripedTex = createStripedCurbTex(maxAniso);
  const drainGrateTex = createDrainGrateTex();

  const makeAsphaltMat = (tex, wetness = 0.72) => {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: tex,
      roughness: 0.76,
      metalness: 0.04,
      envMap: envTex,
      envMapIntensity: 1.22,
    });
    attachDerivedPBRMaps(mat, tex, { strength: 2.2, roughBase: 0.76, normalScale: 0.68 });
    upgradeWetAsphaltMaterial(mat, shaderUniforms, wetness);
    return mat;
  };

  const roadMajorMat = makeAsphaltMat(majorTex, 0.74);
  const roadMidMat = makeAsphaltMat(midTex, 0.70);
  const roadLaneMat = makeAsphaltMat(laneTex, 0.62);
  const junctionApronMat = makeAsphaltMat(apronTex, 0.74);

  const zebraMat = new THREE.MeshStandardMaterial({
    color: 0xeae8e1,
    roughness: 0.72,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const hexPaverMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: hexPaverTex,
    roughness: 0.80,
    metalness: 0.02,
    envMap: envTex,
    envMapIntensity: 0.45,
  });
  attachDerivedPBRMaps(hexPaverMat, hexPaverTex, { strength: 2.1, roughBase: 0.80, normalScale: 0.62 });

  const curbStripedMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: curbStripedTex,
    roughness: 0.72,
    metalness: 0.04,
    envMap: envTex,
    envMapIntensity: 0.48,
  });
  attachDerivedPBRMaps(curbStripedMat, curbStripedTex, { strength: 1.6, roughBase: 0.72, normalScale: 0.45 });

  const drainGrateMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: drainGrateTex,
    roughness: 0.52,
    metalness: 0.68,
    envMap: envTex,
    envMapIntensity: 0.85,
  });

  // 2. Spatial Grid of ALL Road Carriageways (cell = 24m) for instant intersection & curb-cut detection!
  const cellSize = 24;
  const roadSegGrid = new Map();
  const nodeDegreeMap = new Map();

  const registerNode = (x, z, halfW, roadType, yaw) => {
    const qx = Math.round(x * 0.5) * 2;
    const qz = Math.round(z * 0.5) * 2;
    const key = `${qx},${qz}`;
    let entry = nodeDegreeMap.get(key);
    if (!entry) {
      entry = { x, z, count: 0, maxHalfW: halfW, minTier: roadType, yaws: [] };
      nodeDegreeMap.set(key, entry);
    }
    entry.count += 1;
    if (halfW > entry.maxHalfW) entry.maxHalfW = halfW;
    if (roadType < entry.minTier) entry.minTier = roadType;
    entry.yaws.push(yaw);
  };

  for (let rIdx = 0; rIdx < worldData.roads.length; rIdx++) {
    const r = worldData.roads[rIdx];
    const pts = r.p;
    if (!pts || pts.length < 4) continue;
    if (r.n === 'Alia Madrasah Approach Road') continue;
    const halfW = (r.w || 6.0) * 0.5;

    for (let i = 0; i < pts.length - 2; i += 2) {
      const ax = pts[i];
      const az = pts[i + 1];
      const bx = pts[i + 2];
      const bz = pts[i + 3];
      const segYaw = Math.atan2(bx - ax, bz - az);
      if (i === 0) registerNode(ax, az, halfW, r.t, segYaw);
      if (i === pts.length - 4) registerNode(bx, bz, halfW, r.t, segYaw);

      const pad = halfW + 4.0;
      const c0x = Math.floor((Math.min(ax, bx) - pad) / cellSize);
      const c1x = Math.floor((Math.max(ax, bx) + pad) / cellSize);
      const c0z = Math.floor((Math.min(az, bz) - pad) / cellSize);
      const c1z = Math.floor((Math.max(az, bz) + pad) / cellSize);
      const seg = { rIdx, ax, az, bx, bz, halfW, tier: r.t };
      for (let gx = c0x; gx <= c1x; gx++) {
        for (let gz = c0z; gz <= c1z; gz++) {
          const gk = `${gx},${gz}`;
          let list = roadSegGrid.get(gk);
          if (!list) {
            list = [];
            roadSegGrid.set(gk, list);
          }
          list.push(seg);
        }
      }
    }
  }

  // Zones that already have custom high-detail road ribbons at y > 0
  const isInsideCustomRoadZone = (x, z, roadName = '') => {
    if (x >= -370 && x <= -256 && z >= -228 && z <= 12) return true; // PTI More
    if (roadName === 'Khan Jahan Ali Road' && x >= -652 && x <= 52 && z >= -262 && z <= 150) return true;
    if (x >= -56 && x <= 4 && z >= 90 && z <= 120) return true;
    if (x >= -202 && x <= -172 && z >= 76 && z <= 104) return true;
    if (
      x >= TALTOLA_HOUSE_OFFSET.x - 16 && x <= TALTOLA_HOUSE_OFFSET.x + 26
      && z >= TALTOLA_HOUSE_OFFSET.z - 56 && z <= TALTOLA_HOUSE_OFFSET.z + 62
    ) return true;
    if (roadName === 'Alia Madrasah Approach Road') return true;
    const stDx = (x - 78.0) / 84.0;
    const stDz = (z + 834.0) / 96.0;
    if (stDx * stDx + stDz * stDz <= 1.0) return true;
    return false;
  };

  // Hero corridors & compounds that already have their own custom 3D sidewalks/curbs/gates
  const customSidewalkPolylines = [
    [0.0, -337.0, 58.7, -319.5, 16.0],
    [58.7, -319.5, 158.0, -296.0, 16.0],
    [-655.0, -254.0, -516.0, -168.0, 22.0],
    [-516.0, -168.0, -384.0, -90.0, 22.0],
    [-242.0, 30.0, -182.0, 93.0, 20.0],
    [-182.0, 93.0, -12.0, 107.0, 20.0],
    [-12.0, 107.0, 55.0, 145.0, 20.0],
  ];

  const isInsideCustomSidewalkZone = (x, z) => {
    // 1. Circuit House Maidan GLB (already has exact Hex_Paver_Footpaths & Black_And_Yellow_Striped_Curbs!)
    if (x >= -94 && x <= 138 && z >= -734 && z <= -510) return true;
    // 2. Existing Circuit House & Judge Court compound & entrance aprons along K.D. Ghosh Rd
    if (x >= 82 && x <= 145 && z >= -716 && z <= -642) return true;
    if (x >= 145 && x <= 206 && z >= -728 && z <= -622) return true;
    // 3. Khulna District Stadium
    if (((x - 78.0) / 88.0) ** 2 + ((z + 834.0) / 99.0) ** 2 <= 1.0) return true;
    // 4. Shaheed Hadis Park compound + its existing north-side brick footpath
    if (x >= -384 && x <= -264 && z >= -964 && z <= -831) return true;
    // 5. Taltola House & Haji Mohsin Road (North, Central & South)
    if (
      x >= TALTOLA_HOUSE_OFFSET.x - 20 && x <= TALTOLA_HOUSE_OFFSET.x + 28
      && z >= TALTOLA_HOUSE_OFFSET.z - 58 && z <= TALTOLA_HOUSE_OFFSET.z + 64
    ) return true;
    if (x >= -26 && x <= 30 && z >= -346 && z <= 138) return true;
    // 6. Alia Madrasah, Model Mosque & Altapole Lane
    if (x >= 132 && x <= 258 && z >= 52 && z <= 240) return true;
    if (x >= 145 && x <= 222 && z >= -526 && z <= -286) return true;
    // 7. PTI More, Royal More, Satrasta More & Rupsha Waterfront
    if (x >= -372 && x <= -254 && z >= -230 && z <= 14) return true;
    if ((x + 716.8) ** 2 + (z + 291.8) ** 2 < 92 * 92) return true;
    if ((x + 920.0) ** 2 + (z + 292.0) ** 2 < 92 * 92) return true;
    if (x > 1065) return true;

    for (let i = 0; i < customSidewalkPolylines.length; i++) {
      const [ax, az, bx, bz, rad] = customSidewalkPolylines[i];
      if (pointToSegDistSq(x, z, ax, az, bx, bz) < rad * rad) return true;
    }
    if (isInWaterFn && isInWaterFn(x, z)) return true;
    return false;
  };

  // Returns true if (px, pz) encroaches on ANY OTHER road's asphalt carriageway (used for clean intersection curb cuts!)
  const isPointInOtherRoadCarriageway = (px, pz, selfRoadIdx, margin = 0.45) => {
    const gx = Math.floor(px / cellSize);
    const gz = Math.floor(pz / cellSize);
    const list = roadSegGrid.get(`${gx},${gz}`);
    if (!list) return false;
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      if (s.rIdx === selfRoadIdx) continue;
      const req = s.halfW + margin;
      if (pointToSegDistSq(px, pz, s.ax, s.az, s.bx, s.bz) < req * req) return true;
    }
    return false;
  };

  // 3. Build Ribbon-Mapped Road Carriageway Geometries (u=[0..1] across road width, v along road length!)
  function buildRibbonRoadGeo(tierPred, yBase, vRepeatMeters) {
    const pos = [];
    const norm = [];
    const uv = [];
    const idx = [];
    let vCount = 0;

    const addDiscCap = (cx, cz, radius, capY, segs = 10) => {
      const cIdx = vCount;
      pos.push(cx, capY, cz);
      norm.push(0, 1, 0);
      uv.push(0.28, 0.5); // Sample clean dark asphalt lane area (avoids center stripe pinwheel on end caps!)
      vCount++;
      for (let s = 0; s <= segs; s++) {
        const a = (s / segs) * Math.PI * 2;
        pos.push(cx + Math.cos(a) * radius, capY, cz + Math.sin(a) * radius);
        norm.push(0, 1, 0);
        uv.push(0.22 + 0.12 * Math.cos(a), 0.5 + 0.12 * Math.sin(a));
        vCount++;
      }
      for (let s = 0; s < segs; s++) {
        idx.push(cIdx, cIdx + 1 + s + 1, cIdx + 1 + s);
      }
    };

    for (let rIdx = 0; rIdx < worldData.roads.length; rIdx++) {
      const r = worldData.roads[rIdx];
      if (!tierPred(r)) continue;
      const pts = r.p;
      if (!pts || pts.length < 4) continue;
      const halfW = (r.w || 6.0) * 0.5;
      const roadY = yBase + (rIdx % 5) * 0.00028;
      let runV = 0;

      for (let i = 0; i < pts.length - 2; i += 2) {
        const x0 = pts[i];
        const z0 = pts[i + 1];
        const x1 = pts[i + 2];
        const z1 = pts[i + 3];
        if (isInsideCustomRoadZone(x0, z0, r.n) && isInsideCustomRoadZone(x1, z1, r.n)) continue;
        const dx = x1 - x0;
        const dz = z1 - z0;
        const len = Math.hypot(dx, dz);
        if (len < 0.25) continue;

        const nx = (-dz / len) * halfW;
        const nz = (dx / len) * halfW;
        const v0 = runV / vRepeatMeters;
        const v1 = (runV + len) / vRepeatMeters;
        runV += len;

        pos.push(
          x0 - nx, roadY, z0 - nz,
          x0 + nx, roadY, z0 + nz,
          x1 + nx, roadY, z1 + nz,
          x1 - nx, roadY, z1 - nz
        );
        for (let k = 0; k < 4; k++) norm.push(0, 1, 0);
        uv.push(0, v0, 1, v0, 1, v1, 0, v1);
        idx.push(vCount, vCount + 1, vCount + 2, vCount, vCount + 2, vCount + 3);
        vCount += 4;

        if (i > 0) addDiscCap(x0, z0, halfW * 0.98, roadY - 0.0006, 10);
      }
      if (!isInsideCustomRoadZone(pts[0], pts[1], r.n)) {
        addDiscCap(pts[0], pts[1], halfW * 0.98, roadY - 0.0006, 10);
      }
      const lx = pts[pts.length - 2];
      const lz = pts[pts.length - 1];
      if (!isInsideCustomRoadZone(lx, lz, r.n)) {
        addDiscCap(lx, lz, halfW * 0.98, roadY - 0.0006, 10);
      }
    }

    if (!idx.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  }

  // 4. Build Clean Intersection Pitch Aprons + Zebra Pedestrian Crosswalks at Major Junctions!
  function buildIntersectionsAndCrosswalks() {
    const apronPos = [];
    const apronNorm = [];
    const apronUv = [];
    const apronIdx = [];
    let aBase = 0;

    const zebraPos = [];
    const zebraNorm = [];
    const zebraUv = [];
    const zebraIdx = [];
    let zBase = 0;

    const pushFlatQuad = (pArr, nArr, uArr, iArr, base, cx, cz, y, w, d, yaw) => {
      const c = Math.cos(yaw);
      const s = Math.sin(yaw);
      const hw = w * 0.5;
      const hd = d * 0.5;
      const corners = [
        [-hw, -hd],
        [hw, -hd],
        [hw, hd],
        [-hw, hd],
      ];
      for (let k = 0; k < 4; k++) {
        const lx = corners[k][0];
        const lz = corners[k][1];
        pArr.push(cx + lx * c + lz * s, y, cz - lx * s + lz * c);
        nArr.push(0, 1, 0);
      }
      uArr.push(0, 0, 1, 0, 1, 1, 0, 1);
      iArr.push(base, base + 1, base + 2, base, base + 2, base + 3);
      return base + 4;
    };

    for (const node of nodeDegreeMap.values()) {
      if (node.count < 2) continue;
      if (isInsideCustomRoadZone(node.x, node.z, '')) continue;
      if (isInsideCustomSidewalkZone(node.x, node.z)) continue;

      // Smooth circular pitch-asphalt junction apron so crossing centerlines blend cleanly like real Khulna more/junctions!
      const rad = node.maxHalfW * 1.12;
      const ay = -0.0002;
      const segs = 14;
      const centerIdx = aBase;
      apronPos.push(node.x, ay, node.z);
      apronNorm.push(0, 1, 0);
      apronUv.push(0.5, 0.5);
      aBase++;
      for (let s = 0; s <= segs; s++) {
        const ang = (s / segs) * Math.PI * 2;
        const vx = node.x + Math.cos(ang) * rad;
        const vz = node.z + Math.sin(ang) * rad;
        apronPos.push(vx, ay, vz);
        apronNorm.push(0, 1, 0);
        apronUv.push(0.5 + Math.cos(ang) * 0.45, 0.5 + Math.sin(ang) * 0.45);
        aBase++;
      }
      for (let s = 0; s < segs; s++) {
        apronIdx.push(centerIdx, centerIdx + 1 + s + 1, centerIdx + 1 + s);
      }

      // Add crisp white Zebra Pedestrian Crosswalk + Stop Bar on major junctions (exact Maidan style!)
      if (node.minTier <= 2 && node.count >= 3 && node.yaws.length > 0) {
        const yaw = node.yaws[0];
        const dirX = Math.sin(yaw);
        const dirZ = Math.cos(yaw);
        const crossDist = rad + 2.4;
        const zx = node.x + dirX * crossDist;
        const zz = node.z + dirZ * crossDist;
        if (!isInsideCustomSidewalkZone(zx, zz)) {
          const roadW = node.maxHalfW * 1.72;
          const stripeCount = Math.max(4, Math.floor(roadW / 0.95));
          const perpX = Math.cos(yaw);
          const perpZ = -Math.sin(yaw);
          for (let k = 0; k < stripeCount; k++) {
            const off = (k - (stripeCount - 1) * 0.5) * 0.92;
            zBase = pushFlatQuad(
              zebraPos, zebraNorm, zebraUv, zebraIdx, zBase,
              zx + perpX * off, zz + perpZ * off, 0.0025,
              0.46, 2.35, yaw
            );
          }
          // White stop bar 2.1m before zebra crosswalk
          zBase = pushFlatQuad(
            zebraPos, zebraNorm, zebraUv, zebraIdx, zBase,
            zx - dirX * 2.1, zz - dirZ * 2.1, 0.0025,
            roadW * 0.46, 0.34, yaw
          );
        }
      }
    }

    const buildBuf = (p, n, u, i) => {
      if (!i.length) return null;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2));
      g.setIndex(i);
      return g;
    };

    return {
      apronGeo: buildBuf(apronPos, apronNorm, apronUv, apronIdx),
      zebraGeo: buildBuf(zebraPos, zebraNorm, zebraUv, zebraIdx),
    };
  }

  // 5. Build 3D Raised Black-and-Yellow Striped Curbs + 3D Interlocking Hex-Paver Footpaths + Storm Drains!
  const FOOTPATH_TOP_Y = 0.14;
  const CURB_TOP_Y = 0.155;
  const CURB_W = 0.20;

  function build3DSidewalksAndCurbs() {
    const fpPos = [];
    const fpNorm = [];
    const fpUv = [];
    const fpIdx = [];
    let fpBase = 0;

    const cbPos = [];
    const cbNorm = [];
    const cbUv = [];
    const cbIdx = [];
    let cbBase = 0;

    const drPos = [];
    const drNorm = [];
    const drUv = [];
    const drIdx = [];
    let drBase = 0;

    const pushQuad3D = (pArr, nArr, uArr, iArr, base, p0, p1, p2, p3, nx, ny, nz, u0, v0, u1, v1) => {
      pArr.push(
        p0[0], p0[1], p0[2],
        p1[0], p1[1], p1[2],
        p2[0], p2[1], p2[2],
        p3[0], p3[1], p3[2]
      );
      for (let k = 0; k < 4; k++) nArr.push(nx, ny, nz);
      uArr.push(u0, v0, u1, v0, u1, v1, u0, v1);
      iArr.push(base, base + 1, base + 2, base, base + 2, base + 3);
      return base + 4;
    };

    let drainCounter = 0;

    for (let rIdx = 0; rIdx < worldData.roads.length; rIdx++) {
      const r = worldData.roads[rIdx];
      if (r.t > 3) continue; // Major, secondary & tertiary city avenues/streets get full 3D curbs + hex-paver footpaths!
      const pts = r.p;
      if (!pts || pts.length < 4) continue;
      if (r.n === 'Alia Madrasah Approach Road') continue;

      const roadHalfW = (r.w || 6.0) * 0.5;
      const fpWidth = r.t <= 1 ? 2.15 : (r.t === 2 ? 1.75 : 1.40);

      for (const side of [-1, 1]) {
        let runDist = 0;
        for (let i = 0; i < pts.length - 2; i += 2) {
          const x0 = pts[i];
          const z0 = pts[i + 1];
          const x1 = pts[i + 2];
          const z1 = pts[i + 3];
          const dx = x1 - x0;
          const dz = z1 - z0;
          const segLen = Math.hypot(dx, dz);
          if (segLen < 1.2) continue;

          const dirX = dx / segLen;
          const dirZ = dz / segLen;
          // Outward unit normal pointing away from road center on `side`
          const outX = (-dirZ) * side;
          const outZ = dirX * side;

          // Subdivide into ~3.2m steps so curbs & footpaths break cleanly at every side-street intersection!
          const steps = Math.max(1, Math.ceil(segLen / 3.2));
          const stepLen = segLen / steps;

          for (let s = 0; s < steps; s++) {
            const t0 = s / steps;
            const t1 = (s + 1) / steps;
            const tm = (s + 0.5) / steps;

            const mx = x0 + dx * tm;
            const mz = z0 + dz * tm;
            const curbTestX = mx + outX * (roadHalfW + CURB_W * 0.5);
            const curbTestZ = mz + outZ * (roadHalfW + CURB_W * 0.5);
            const outerTestX = mx + outX * (roadHalfW + CURB_W + fpWidth * 0.75);
            const outerTestZ = mz + outZ * (roadHalfW + CURB_W + fpWidth * 0.75);

            if (isInsideCustomSidewalkZone(curbTestX, curbTestZ) || isInsideCustomSidewalkZone(outerTestX, outerTestZ)) {
              runDist += stepLen;
              continue;
            }
            if (
              isPointInOtherRoadCarriageway(curbTestX, curbTestZ, rIdx, 0.55)
              || isPointInOtherRoadCarriageway(outerTestX, outerTestZ, rIdx, 0.35)
            ) {
              runDist += stepLen;
              continue;
            }

            const sx0 = x0 + dx * t0;
            const sz0 = z0 + dz * t0;
            const sx1 = x0 + dx * t1;
            const sz1 = z0 + dz * t1;

            // Curb inner (road-facing) & outer edges
            const ci0x = sx0 + outX * roadHalfW;
            const ci0z = sz0 + outZ * roadHalfW;
            const ci1x = sx1 + outX * roadHalfW;
            const ci1z = sz1 + outZ * roadHalfW;

            const co0x = sx0 + outX * (roadHalfW + CURB_W);
            const co0z = sz0 + outZ * (roadHalfW + CURB_W);
            const co1x = sx1 + outX * (roadHalfW + CURB_W);
            const co1z = sz1 + outZ * (roadHalfW + CURB_W);

            // Footpath outer edge
            const fo0x = sx0 + outX * (roadHalfW + CURB_W + fpWidth);
            const fo0z = sz0 + outZ * (roadHalfW + CURB_W + fpWidth);
            const fo1x = sx1 + outX * (roadHalfW + CURB_W + fpWidth);
            const fo1z = sz1 + outZ * (roadHalfW + CURB_W + fpWidth);

            const cv0 = runDist / 0.96;
            const cv1 = (runDist + stepLen) / 0.96;

            // Ensure outward CCW winding regardless of side = -1 or +1
            if (side === 1) {
              // 1) Curb Top Face
              cbBase = pushQuad3D(
                cbPos, cbNorm, cbUv, cbIdx, cbBase,
                [ci0x, CURB_TOP_Y, ci0z], [co0x, CURB_TOP_Y, co0z],
                [co1x, CURB_TOP_Y, co1z], [ci1x, CURB_TOP_Y, ci1z],
                0, 1, 0, 0, cv0, 1, cv1
              );
              // 2) Curb Road-Facing Vertical Riser
              cbBase = pushQuad3D(
                cbPos, cbNorm, cbUv, cbIdx, cbBase,
                [ci0x, -0.02, ci0z], [ci0x, CURB_TOP_Y, ci0z],
                [ci1x, CURB_TOP_Y, ci1z], [ci1x, -0.02, ci1z],
                -outX, 0, -outZ, 0, cv0, 1, cv1
              );
              // 3) Hex-Paver Sidewalk Top Face
              fpBase = pushQuad3D(
                fpPos, fpNorm, fpUv, fpIdx, fpBase,
                [co0x, FOOTPATH_TOP_Y, co0z], [fo0x, FOOTPATH_TOP_Y, fo0z],
                [fo1x, FOOTPATH_TOP_Y, fo1z], [co1x, FOOTPATH_TOP_Y, co1z],
                0, 1, 0, 0, runDist * 0.42, fpWidth * 0.42, (runDist + stepLen) * 0.42
              );
              // 4) Hex-Paver Outer Skirt (prevents floating gap on outer terrain!)
              fpBase = pushQuad3D(
                fpPos, fpNorm, fpUv, fpIdx, fpBase,
                [fo0x, FOOTPATH_TOP_Y, fo0z], [fo0x, -0.08, fo0z],
                [fo1x, -0.08, fo1z], [fo1x, FOOTPATH_TOP_Y, fo1z],
                outX, 0, outZ, 0, runDist * 0.42, 0.12, (runDist + stepLen) * 0.42
              );
            } else {
              // Reversed vertex order for side === -1 so face normals stay +Y / outward!
              cbBase = pushQuad3D(
                cbPos, cbNorm, cbUv, cbIdx, cbBase,
                [co0x, CURB_TOP_Y, co0z], [ci0x, CURB_TOP_Y, ci0z],
                [ci1x, CURB_TOP_Y, ci1z], [co1x, CURB_TOP_Y, co1z],
                0, 1, 0, 0, cv0, 1, cv1
              );
              cbBase = pushQuad3D(
                cbPos, cbNorm, cbUv, cbIdx, cbBase,
                [ci1x, -0.02, ci1z], [ci1x, CURB_TOP_Y, ci1z],
                [ci0x, CURB_TOP_Y, ci0z], [ci0x, -0.02, ci0z],
                -outX, 0, -outZ, 0, cv1, 1, cv0
              );
              fpBase = pushQuad3D(
                fpPos, fpNorm, fpUv, fpIdx, fpBase,
                [fo0x, FOOTPATH_TOP_Y, fo0z], [co0x, FOOTPATH_TOP_Y, co0z],
                [co1x, FOOTPATH_TOP_Y, co1z], [fo1x, FOOTPATH_TOP_Y, fo1z],
                0, 1, 0, 0, runDist * 0.42, fpWidth * 0.42, (runDist + stepLen) * 0.42
              );
              fpBase = pushQuad3D(
                fpPos, fpNorm, fpUv, fpIdx, fpBase,
                [fo1x, FOOTPATH_TOP_Y, fo1z], [fo1x, -0.08, fo1z],
                [fo0x, -0.08, fo0z], [fo0x, FOOTPATH_TOP_Y, fo0z],
                outX, 0, outZ, 0, (runDist + stepLen) * 0.42, 0.12, runDist * 0.42
              );
            }

            // Embedded Cast-Iron Storm-Drain Grate every ~16m on major avenues (r.t <= 2)
            drainCounter++;
            if (r.t <= 2 && fpWidth >= 1.7 && (drainCounter % 5 === 0)) {
              const gx = mx + outX * (roadHalfW + CURB_W + 0.52);
              const gz = mz + outZ * (roadHalfW + CURB_W + 0.52);
              const hw = 0.32;
              const hd = 0.34;
              const pA = [gx - dirX * hd - outX * hw, FOOTPATH_TOP_Y + 0.004, gz - dirZ * hd - outZ * hw];
              const pB = [gx - dirX * hd + outX * hw, FOOTPATH_TOP_Y + 0.004, gz - dirZ * hd + outZ * hw];
              const pC = [gx + dirX * hd + outX * hw, FOOTPATH_TOP_Y + 0.004, gz + dirZ * hd + outZ * hw];
              const pD = [gx + dirX * hd - outX * hw, FOOTPATH_TOP_Y + 0.004, gz + dirZ * hd - outZ * hw];
              if (side === 1) {
                drBase = pushQuad3D(drPos, drNorm, drUv, drIdx, drBase, pA, pB, pC, pD, 0, 1, 0, 0, 0, 1, 1);
              } else {
                drBase = pushQuad3D(drPos, drNorm, drUv, drIdx, drBase, pB, pA, pD, pC, 0, 1, 0, 0, 0, 1, 1);
              }
            }

            runDist += stepLen;
          }
        }
      }
    }

    const buildBuf = (p, n, u, i) => {
      if (!i.length) return null;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2));
      g.setIndex(i);
      return g;
    };

    return {
      footpathGeo: buildBuf(fpPos, fpNorm, fpUv, fpIdx),
      curbGeo: buildBuf(cbPos, cbNorm, cbUv, cbIdx),
      drainGeo: buildBuf(drPos, drNorm, drUv, drIdx),
    };
  }

  const majorGeo = buildRibbonRoadGeo((r) => r.t <= 1, -0.001, 12.5);
  const midGeo = buildRibbonRoadGeo((r) => r.t === 2 || r.t === 3, -0.003, 11.0);
  const laneGeo = buildRibbonRoadGeo((r) => r.t >= 4, -0.005, 9.0);
  const { apronGeo, zebraGeo } = buildIntersectionsAndCrosswalks();
  const { footpathGeo, curbGeo, drainGeo } = build3DSidewalksAndCurbs();

  for (const [geo, mat] of [
    [majorGeo, roadMajorMat],
    [midGeo, roadMidMat],
    [laneGeo, roadLaneMat],
    [apronGeo, junctionApronMat],
    [zebraGeo, zebraMat],
    [footpathGeo, hexPaverMat],
    [curbGeo, curbStripedMat],
    [drainGeo, drainGrateMat],
  ]) {
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    parentGroup.add(mesh);
  }

  // Fast O(1) spatial footpath ground height query so walking & driving onto citywide hex-paver sidewalks feels 100% physical!
  function getGroundHeight(pos) {
    if (!pos) return 0;
    const px = pos.x;
    const pz = pos.z;
    if (isInsideCustomSidewalkZone(px, pz)) return 0;

    const gx = Math.floor(px / cellSize);
    const gz = Math.floor(pz / cellSize);
    const list = roadSegGrid.get(`${gx},${gz}`);
    if (!list) return 0;

    // First check if point is on any asphalt carriageway -> stay flush at y = 0!
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      if (pointToSegDistSq(px, pz, s.ax, s.az, s.bx, s.bz) <= s.halfW * s.halfW) {
        return 0;
      }
    }

    // Otherwise check if point stands on a raised 3D curb or hex-paver footpath along a tier <= 3 street!
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      if (s.tier > 3) continue;
      const fpW = s.tier <= 1 ? 2.15 : (s.tier === 2 ? 1.75 : 1.40);
      const maxOuter = s.halfW + CURB_W + fpW;
      const dSq = pointToSegDistSq(px, pz, s.ax, s.az, s.bx, s.bz);
      if (dSq > s.halfW * s.halfW && dSq <= maxOuter * maxOuter) {
        return FOOTPATH_TOP_Y;
      }
    }
    return 0;
  }

  function setQualityMode(qualityMode = 'high') {
    const isLow = qualityMode === 'low';
    const isUltra = qualityMode === 'ultra';
    const nextEnv = isLow ? null : (skySystem?.getEnvTexture?.() || null);
    for (const m of [roadMajorMat, roadMidMat, roadLaneMat, junctionApronMat, hexPaverMat, curbStripedMat, drainGrateMat]) {
      if (m.envMap !== nextEnv) {
        m.envMap = nextEnv;
        m.needsUpdate = true;
      }
    }
    const wetVal = isUltra ? 0.80 : (qualityMode === 'high' ? 0.72 : 0.62);
    for (const m of [roadMajorMat, roadMidMat, roadLaneMat, junctionApronMat]) {
      if (m.userData?.wetUniforms) {
        m.userData.wetUniforms.uWetness.value = wetVal;
      }
    }
    const nextAniso = isLow ? 2 : (qualityMode === 'medium' ? Math.min(4, maxAniso) : (qualityMode === 'high' ? Math.min(8, maxAniso) : maxAniso));
    for (const t of [majorTex, midTex, laneTex, apronTex, hexPaverTex, curbStripedTex]) {
      if (t.anisotropy !== nextAniso) {
        t.anisotropy = nextAniso;
        t.needsUpdate = true;
      }
    }
  }

  function setNightFactor(nightFactor = 0) {
    const nf = THREE.MathUtils.clamp(nightFactor, 0, 1);
    for (const m of [roadMajorMat, roadMidMat, roadLaneMat, junctionApronMat]) {
      if (m.userData?.wetUniforms) {
        m.userData.wetUniforms.uWetness.value = 0.68 + nf * 0.22;
      }
    }
  }

  return {
    getGroundHeight,
    setQualityMode,
    setNightFactor,
  };
}
