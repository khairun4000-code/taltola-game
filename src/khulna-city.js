import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import worldData from './data/khulna-world-data.json';
import { clampToKhulnaBounds, worldXZToLatLon } from './khulna-geo.js';
import {
  generateNormalAndRoughnessMaps,
  attachDerivedPBRMaps,
  createRupshaRiverShader,
  upgradeWetAsphaltMaterial,
} from './aaa-shaders.js';

const FLOOR_HEIGHT = 3.05;
const COLLISION_CELL = 32.0;

function seeded(seed) {
  let s = (seed | 0) + 131071;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Generates shared procedural architectural window/balcony facade textures once.
 * Returns { highRiseTex, lowRiseTex, roadTex, waterTex, pitchTex }.
 */
function createCityTextures(renderer) {
  const maxAniso = Math.min(8, renderer?.capabilities?.getMaxAnisotropy?.() || 4);

  function buildFacadeTex(cols, rows, isLowRise) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const rnd = seeded(isLowRise ? 4109 : 8821);

    ctx.fillStyle = '#e5e2dc';
    ctx.fillRect(0, 0, 256, 256);

    // Subtle tropical dampness & plaster streak variation
    for (let i = 0; i < 42; i++) {
      const y = rnd() * 256;
      ctx.fillStyle = `rgba(55, 62, 58, ${0.02 + rnd() * 0.045})`;
      ctx.fillRect(0, y, 256, 4 + rnd() * 14);
    }

    const cw = 256 / cols;
    const rh = 256 / rows;
    for (let r = 0; r < rows; r++) {
      // Concrete slab/cornice band per floor
      ctx.fillStyle = 'rgba(30, 35, 38, 0.16)';
      ctx.fillRect(0, r * rh, 256, Math.max(2, rh * 0.1));
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.fillRect(0, r * rh + Math.max(2, rh * 0.1), 256, 2);

      for (let c = 0; c < cols; c++) {
        const wx = c * cw + cw * 0.18;
        const wy = r * rh + rh * 0.25;
        const ww = cw * 0.64;
        const wh = rh * 0.56;

        // Sill shadow & recessed balcony/window cavity
        ctx.fillStyle = 'rgba(20, 26, 32, 0.22)';
        ctx.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);

        const lit = rnd() > 0.78;
        ctx.fillStyle = isLowRise
          ? (lit ? '#3e4e58' : '#243038')
          : (lit ? '#537080' : '#1f2b36');
        ctx.fillRect(wx, wy, ww, wh);

        // Glass mullion cross & grill lines
        ctx.fillStyle = 'rgba(220, 230, 236, 0.35)';
        ctx.fillRect(wx + ww * 0.48, wy, 2, wh);
        ctx.fillRect(wx, wy + wh * 0.5, ww, 2);

        // Occasional AC outdoor compressor box or awning
        if (!isLowRise && rnd() > 0.72) {
          ctx.fillStyle = '#d4d8dc';
          ctx.fillRect(wx + ww * 0.62, wy + wh - 7, ww * 0.32, 6);
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = maxAniso;
    return tex;
  }

  const aniso = renderer ? Math.min(4, renderer.capabilities.getMaxAnisotropy()) : 4;

  function buildRoadTexture({
    baseHex,
    grainBase,
    grainSpan,
    shoulderHex,
    edgeStripeHex,
    centerStripeHex,
    dashStart = 18,
    dashEnd = 118,
    centerWidth = 8,
  }) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const rnd = seeded(9931);
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 256, 256);

    if (shoulderHex) {
      ctx.fillStyle = shoulderHex;
      ctx.fillRect(0, 0, 14, 256);
      ctx.fillRect(242, 0, 14, 256);
    }

    for (let i = 0; i < 1100; i++) {
      const v = grainBase + Math.floor((rnd() - 0.5) * grainSpan);
      ctx.fillStyle = `rgba(${v},${v},${v + 2},0.32)`;
      ctx.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 3, 2 + rnd() * 3);
    }

    if (edgeStripeHex) {
      ctx.fillStyle = edgeStripeHex;
      ctx.fillRect(16, 0, 4, 256);
      ctx.fillRect(236, 0, 4, 256);
    }

    if (centerStripeHex) {
      ctx.fillStyle = centerStripeHex;
      const cx = Math.floor(128 - centerWidth * 0.5);
      ctx.fillRect(cx, dashStart, centerWidth, dashEnd - dashStart);
      ctx.fillRect(cx, dashStart + 128, centerWidth, dashEnd - dashStart);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = aniso;
    tex.repeat.set(1, 1);
    return tex;
  }

  function buildSidewalkTex() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const rnd = seeded(7717);
    ctx.fillStyle = '#a89683';
    ctx.fillRect(0, 0, 256, 256);
    const tile = 32;
    for (let y = 0; y < 256; y += tile) {
      const shift = ((y / tile) % 2) * 16;
      for (let x = -tile; x < 256 + tile; x += tile) {
        const tone = 152 + Math.floor(rnd() * 24);
        ctx.fillStyle = `rgb(${tone + 14},${tone},${tone - 14})`;
        ctx.fillRect(x + shift + 2, y + 2, tile - 3, tile - 3);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = aniso;
    return tex;
  }

  function buildLandTex() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const rnd = seeded(4319);
    // Warm tropical Bengal mossy earth & courtyard soil base (prevents flat concrete grey horizon)
    ctx.fillStyle = '#6f7954';
    ctx.fillRect(0, 0, 512, 512);

    // Macro organic vegetation, monsoon moss & warm clay plot variations (stays visible at distance!)
    for (let i = 0; i < 140; i++) {
      const x = rnd() * 512;
      const y = rnd() * 512;
      const r = 18 + rnd() * 42;
      const tone = rnd();
      const col = tone < 0.44
        ? 'rgba(72, 108, 52, 0.30)'
        : (tone < 0.78 ? 'rgba(132, 112, 82, 0.26)' : 'rgba(58, 72, 44, 0.26)');
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtle Khulna neighborhood plot & courtyard paving subdivisions
    ctx.strokeStyle = 'rgba(84, 76, 62, 0.22)';
    ctx.lineWidth = 3;
    for (let g = 64; g < 512; g += 128) {
      ctx.beginPath();
      ctx.moveTo(0, g);
      ctx.lineTo(512, g);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(g, 0);
      ctx.lineTo(g, 512);
      ctx.stroke();
    }

    // Medium grass clusters & brick-earth grit
    for (let i = 0; i < 2400; i++) {
      const x = rnd() * 512;
      const y = rnd() * 512;
      const w = 2.0 + rnd() * 5.0;
      const tone = rnd();
      ctx.fillStyle = tone < 0.42
        ? 'rgba(86, 124, 62, 0.24)'
        : (tone < 0.74 ? 'rgba(124, 104, 78, 0.24)' : 'rgba(156, 146, 118, 0.18)');
      ctx.fillRect(x, y, w, w);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(0.055, 0.055);
    tex.anisotropy = aniso;
    return tex;
  }

  function buildGrassTex() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const rnd = seeded(6113);
    ctx.fillStyle = '#4f7a3c';
    ctx.fillRect(0, 0, 512, 512);

    // Broad manicured lawn stripes + organic turf variation
    for (let s = 0; s < 8; s++) {
      ctx.fillStyle = s % 2 === 0 ? 'rgba(92, 134, 66, 0.20)' : 'rgba(54, 88, 42, 0.18)';
      ctx.fillRect(s * 64, 0, 64, 512);
    }
    for (let i = 0; i < 420; i++) {
      const gx = rnd() * 512;
      const gy = rnd() * 512;
      const r = 12 + rnd() * 34;
      const g = ctx.createRadialGradient(gx, gy, 1, gx, gy, r);
      const warm = rnd() > 0.42;
      g.addColorStop(0, warm ? 'rgba(104, 132, 68, 0.22)' : 'rgba(62, 92, 46, 0.24)');
      g.addColorStop(1, 'rgba(79, 122, 60, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(gx - r, gy - r, r * 2, r * 2);
    }
    // Crisp Bermuda grass blades + dry soil flecks
    for (let i = 0; i < 4200; i++) {
      const x = rnd() * 512;
      const y = rnd() * 512;
      const pick = rnd();
      ctx.fillStyle = pick < 0.44
        ? 'rgba(128, 166, 86, 0.34)'
        : (pick < 0.82 ? 'rgba(58, 92, 42, 0.34)' : 'rgba(132, 114, 78, 0.28)');
      ctx.fillRect(x, y, 1.5 + rnd() * 2.2, 2.5 + rnd() * 5.0);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = aniso;
    return tex;
  }

  function buildWaterTex() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const rnd = seeded(5512);
    ctx.fillStyle = '#2e7288';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 160; i++) {
      const y = rnd() * 256;
      const x = rnd() * 256;
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(145, 210, 224, 0.18)' : 'rgba(18, 56, 70, 0.18)';
      ctx.fillRect(x, y, 14 + rnd() * 36, 2 + rnd() * 3);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    return tex;
  }

  function buildPitchTex() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const rnd = seeded(8841);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#518b42' : '#447937';
      ctx.fillRect(0, i * 64, 512, 64);
    }
    for (let i = 0; i < 2800; i++) {
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(122, 166, 86, 0.22)' : 'rgba(48, 86, 38, 0.22)';
      ctx.fillRect(rnd() * 512, rnd() * 512, 2 + rnd() * 2.5, 2 + rnd() * 3.5);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    tex.anisotropy = aniso;
    return tex;
  }

  const highRiseTex = buildFacadeTex(3, 5, false);
  const lowRiseTex = buildFacadeTex(3, 2, true);
  highRiseTex.anisotropy = aniso;
  lowRiseTex.anisotropy = aniso;

  return {
    highRiseTex,
    lowRiseTex,
    roadMajorTex: buildRoadTexture({
      baseHex: '#555c64',
      grainBase: 92,
      grainSpan: 34,
      shoulderHex: '#464c53',
      edgeStripeHex: 'rgba(232, 238, 245, 0.72)',
      centerStripeHex: 'rgba(245, 247, 250, 0.88)',
      dashStart: 16,
      dashEnd: 112,
      centerWidth: 9,
    }),
    roadMidTex: buildRoadTexture({
      baseHex: '#636970',
      grainBase: 104,
      grainSpan: 34,
      shoulderHex: '#54595f',
      edgeStripeHex: null,
      centerStripeHex: 'rgba(220, 226, 232, 0.60)',
      dashStart: 22,
      dashEnd: 102,
      centerWidth: 6,
    }),
    roadLaneTex: buildRoadTexture({
      baseHex: '#7c7972',
      grainBase: 124,
      grainSpan: 34,
      shoulderHex: '#68645c',
      edgeStripeHex: null,
      centerStripeHex: null,
    }),
    sidewalkTex: buildSidewalkTex(),
    landTex: buildLandTex(),
    grassTex: buildGrassTex(),
    waterTex: buildWaterTex(),
    pitchTex: buildPitchTex(),
  };
}

/**
 * Builds one merged non-indexed/indexed BufferGeometry for all road polylines
 * matching `tierPredicate`, adding circular junction caps to eliminate seam gaps.
 */
function buildMergedRoadGeometry(roadList, tierPredicate, yHeight, extraWidth = 0) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  let vBase = 0;

  const addTriQuad = (ax, az, bx, bz, cx, cz, dx, dz, uLen) => {
    positions.push(
      ax, yHeight, az,
      bx, yHeight, bz,
      cx, yHeight, cz,
      dx, yHeight, dz
    );
    for (let k = 0; k < 4; k++) normals.push(0, 1, 0);
    uvs.push(0, 0, 1, 0, 1, uLen, 0, uLen);
    indices.push(vBase, vBase + 1, vBase + 2, vBase, vBase + 2, vBase + 3);
    vBase += 4;
  };

  const addCap = (cx, cz, radius, segs = 8) => {
    const centerIdx = vBase;
    positions.push(cx, yHeight, cz);
    normals.push(0, 1, 0);
    uvs.push(0.5, 0.5);
    vBase += 1;
    for (let s = 0; s <= segs; s++) {
      const ang = (s / segs) * Math.PI * 2;
      positions.push(cx + Math.cos(ang) * radius, yHeight, cz + Math.sin(ang) * radius);
      normals.push(0, 1, 0);
      uvs.push(0.5 + 0.5 * Math.cos(ang), 0.5 + 0.5 * Math.sin(ang));
      vBase += 1;
    }
    for (let s = 0; s < segs; s++) {
      indices.push(centerIdx, centerIdx + 1 + s + 1, centerIdx + 1 + s);
    }
  };

  for (const r of roadList) {
    if (!tierPredicate(r)) continue;
    const pts = r.p;
    const halfW = (r.w + extraWidth) * 0.5;
    for (let i = 0; i < pts.length - 2; i += 2) {
      const x0 = pts[i];
      const z0 = pts[i + 1];
      const x1 = pts[i + 2];
      const z1 = pts[i + 3];
      const dx = x1 - x0;
      const dz = z1 - z0;
      const len = Math.hypot(dx, dz);
      if (len < 0.25) continue;
      const nx = (-dz / len) * halfW;
      const nz = (dx / len) * halfW;
      addTriQuad(
        x0 - nx, z0 - nz,
        x0 + nx, z0 + nz,
        x1 + nx, z1 + nz,
        x1 - nx, z1 - nz,
        len * 0.1
      );
      if (i > 0) addCap(x0, z0, halfW * 0.99, 8);
    }
    if (pts.length >= 4) {
      addCap(pts[0], pts[1], halfW * 0.99, 8);
      addCap(pts[pts.length - 2], pts[pts.length - 1], halfW * 0.99, 8);
    }
  }

  if (indices.length === 0) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

function buildFlatPolygonShape(flatCoords) {
  if (!flatCoords || flatCoords.length < 6) return null;
  const pts = [];
  for (let i = 0; i < flatCoords.length; i += 2) {
    pts.push(new THREE.Vector2(flatCoords[i], -flatCoords[i + 1]));
  }
  const shape = new THREE.Shape(pts);
  return shape;
}

function resolveCircleOBB(pos, radius, cx, cz, hw, hd, cosY, sinY) {
  const dx = pos.x - cx;
  const dz = pos.z - cz;
  // Project into building local frame (note Three rotation.y = -yaw around Y maps X->(cos, -sin))
  const lx = dx * cosY + dz * sinY;
  const lz = -dx * sinY + dz * cosY;

  const clx = THREE.MathUtils.clamp(lx, -hw, hw);
  const clz = THREE.MathUtils.clamp(lz, -hd, hd);
  const ox = lx - clx;
  const oz = lz - clz;
  const distSq = ox * ox + oz * oz;

  if (distSq >= radius * radius) return;

  let pushLx = 0;
  let pushLz = 0;
  if (distSq > 1e-6) {
    const dist = Math.sqrt(distSq);
    const push = radius - dist;
    pushLx = (ox / dist) * push;
    pushLz = (oz / dist) * push;
  } else {
    const px = hw - Math.abs(lx);
    const pz = hd - Math.abs(lz);
    if (px < pz) pushLx = (lx >= 0 ? 1 : -1) * (px + radius);
    else pushLz = (lz >= 0 ? 1 : -1) * (pz + radius);
  }

  const nlx = lx + pushLx;
  const nlz = lz + pushLz;
  pos.x = cx + nlx * cosY - nlz * sinY;
  pos.z = cz + nlx * sinY + nlz * cosY;
}

function pointInFlatPoly(x, z, flat) {
  let inside = false;
  const n = flat.length;
  for (let i = 0, j = n - 2; i < n; j = i, i += 2) {
    const xi = flat[i], zi = flat[i + 1];
    const xj = flat[j], zj = flat[j + 1];
    if (((zi > z) !== (zj > z)) && (x < ((xj - xi) * (z - zi)) / (zj - zi + 1e-9) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

export function buildKhulnaCity(parent, renderer, skySystem = null) {
  const group = new THREE.Group();
  group.name = 'KhulnaCityWorld';
  parent.add(group);

  const tex = createCityTextures(renderer);
  const [minX, maxX, minZ, maxZ] = worldData.meta.bounds;

  // 1. Sub-surface Riverbed + Khulna City Landmass (punched cleanly along major River channel!)
  const subFloorMat = new THREE.MeshStandardMaterial({ color: 0x1e3844, roughness: 0.92, metalness: 0.04 });
  const subFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(maxX - minX + 600, maxZ - minZ + 600),
    subFloorMat
  );
  subFloor.rotation.x = -Math.PI / 2;
  subFloor.position.set((minX + maxX) * 0.5, -0.75, (minZ + maxZ) * 0.5);
  group.add(subFloor);

  const landShape = new THREE.Shape([
    new THREE.Vector2(minX - 250, -(minZ - 250)),
    new THREE.Vector2(maxX + 250, -(minZ - 250)),
    new THREE.Vector2(maxX + 250, -(maxZ + 250)),
    new THREE.Vector2(minX - 250, -(maxZ + 250)),
  ]);

  const riverPolys = [];
  const waterMeshes = [];
  const waterLowMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    map: tex.waterTex,
    polygonOffset: true,
    polygonOffsetFactor: 3,
    polygonOffsetUnits: 3,
  });
  const waterShaderMat = skySystem?.sharedUniforms
    ? createRupshaRiverShader(skySystem.sharedUniforms)
    : null;
  const waterMat = waterShaderMat || waterLowMat;

  // Sort waters largest-first; punch only giant river channels safely into landShape.holes
  const riverWaters = worldData.waters.filter((w) => w.k === 'river');
  const pondWaters = worldData.waters.filter((w) => w.k !== 'river');

  for (const w of riverWaters) {
    riverPolys.push(w.p);
    const hole = new THREE.Path();
    for (let i = 0; i < w.p.length; i += 2) {
      const vx = w.p[i];
      const vy = -w.p[i + 1];
      if (i === 0) hole.moveTo(vx, vy);
      else hole.lineTo(vx, vy);
    }
    hole.closePath();
    landShape.holes.push(hole);

    const wShape = buildFlatPolygonShape(w.p);
    if (wShape) {
      const wGeo = new THREE.ShapeGeometry(wShape);
      wGeo.rotateX(-Math.PI / 2);
      const uv = wGeo.attributes.uv;
      const pos = wGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) * 0.035, pos.getZ(i) * 0.035);
      const wm = new THREE.Mesh(wGeo, waterMat);
      wm.position.y = -0.34;
      wm.receiveShadow = true;
      waterMeshes.push(wm);
      group.add(wm);
    }
  }

  const landGeo = new THREE.ShapeGeometry(landShape);
  landGeo.rotateX(-Math.PI / 2);
  const landMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: tex.landTex,
    roughness: 0.98,
    metalness: 0.01,
    envMapIntensity: 0.16,
    polygonOffset: true,
    polygonOffsetFactor: 4,
    polygonOffsetUnits: 4,
  });
  attachDerivedPBRMaps(landMat, tex.landTex, { strength: 1.5, roughBase: 0.98, normalScale: 0.45 });
  const landMesh = new THREE.Mesh(landGeo, landMat);
  landMesh.position.y = -0.09;
  landMesh.receiveShadow = true;
  group.add(landMesh);

  // Merge Ponds into 1 draw call + store polygons for real-time swimming detection
  const pondGeos = [];
  const pondPolys = [];
  for (const pw of pondWaters) {
    pondPolys.push(pw.p);
    const s = buildFlatPolygonShape(pw.p);
    if (s) {
      const g = new THREE.ShapeGeometry(s).toNonIndexed();
      g.rotateX(-Math.PI / 2);
      g.translate(0, -0.012, 0);
      pondGeos.push(g);
    }
  }
  if (pondGeos.length > 0) {
    const mergedPonds = mergeGeometries(pondGeos, false);
    if (mergedPonds) {
      const uv = mergedPonds.attributes.uv;
      const pos = mergedPonds.attributes.position;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) * 0.05, pos.getZ(i) * 0.05);
      const m = new THREE.Mesh(mergedPonds, waterMat);
      m.receiveShadow = true;
      waterMeshes.push(m);
      group.add(m);
    }
  }

  // 2. City Parks, Circuit House Ground (Boro Maath), Khulna Stadium Pitch & Madrasah Playgrounds (2 draw calls)
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: tex.grassTex,
    roughness: 0.96,
    metalness: 0.01,
    envMapIntensity: 0.16,
    polygonOffset: true,
    polygonOffsetFactor: 2,
    polygonOffsetUnits: 2,
  });
  attachDerivedPBRMaps(grassMat, tex.grassTex, { strength: 1.6, roughBase: 0.95, normalScale: 0.38 });
  const pitchMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: tex.pitchTex,
    roughness: 0.94,
    metalness: 0.01,
    envMapIntensity: 0.16,
  });
  attachDerivedPBRMaps(pitchMat, tex.pitchTex, { strength: 1.5, roughBase: 0.93, normalScale: 0.32 });
  const grassGeos = [];
  const pitchGeos = [];
  for (const gr of worldData.greens) {
    const gs = buildFlatPolygonShape(gr.p);
    if (!gs) continue;
    const gGeo = new THREE.ShapeGeometry(gs).toNonIndexed();
    gGeo.rotateX(-Math.PI / 2);
    const uv = gGeo.attributes.uv;
    const pos = gGeo.attributes.position;
    if (gr.k === 'pitch') {
      for (let i = 0; i < pos.count; i++) {
        uv.setXY(i, pos.getX(i) * 0.04, pos.getZ(i) * 0.04);
      }
      pitchGeos.push(gGeo);
    } else {
      for (let i = 0; i < pos.count; i++) {
        uv.setXY(i, pos.getX(i) * 0.11, pos.getZ(i) * 0.11);
      }
      grassGeos.push(gGeo);
    }
  }
  if (grassGeos.length > 0) {
    const mergedGrass = mergeGeometries(grassGeos, false);
    if (mergedGrass) {
      const gm = new THREE.Mesh(mergedGrass, grassMat);
      gm.position.y = -0.05;
      gm.receiveShadow = true;
      group.add(gm);
    }
  }
  if (pitchGeos.length > 0) {
    const mergedPitch = mergeGeometries(pitchGeos, false);
    if (mergedPitch) {
      const pm = new THREE.Mesh(mergedPitch, pitchMat);
      pm.position.y = -0.03;
      pm.receiveShadow = true;
      group.add(pm);
    }
  }

  // 3. Merged Road Network Ribbons (only 4 draw calls for all 349 Khulna streets!)
  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: tex.sidewalkTex,
    roughness: 0.88,
    metalness: 0.03,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  attachDerivedPBRMaps(sidewalkMat, tex.sidewalkTex, { strength: 2.0, roughBase: 0.88, normalScale: 0.65 });
  const roadMajorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex.roadMajorTex, roughness: 0.78, metalness: 0.04 });
  const roadMidMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex.roadMidTex, roughness: 0.80, metalness: 0.04 });
  const roadLaneMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex.roadLaneTex, roughness: 0.82, metalness: 0.03 });
  attachDerivedPBRMaps(roadMajorMat, tex.roadMajorTex, { strength: 1.8, roughBase: 0.78, normalScale: 0.6 });
  attachDerivedPBRMaps(roadMidMat, tex.roadMidTex, { strength: 1.8, roughBase: 0.80, normalScale: 0.6 });
  upgradeWetAsphaltMaterial(roadMajorMat, skySystem?.sharedUniforms, 0.68);
  upgradeWetAsphaltMaterial(roadMidMat, skySystem?.sharedUniforms, 0.56);

  const sidewalkGeo = buildMergedRoadGeometry(worldData.roads, (r) => r.t <= 3, -0.002, 1.5);
  const majorGeo = buildMergedRoadGeometry(worldData.roads, (r) => r.t <= 1, 0.024, 0.0);
  const midGeo = buildMergedRoadGeometry(worldData.roads, (r) => r.t === 2 || r.t === 3, 0.016, 0.0);
  const laneGeo = buildMergedRoadGeometry(worldData.roads, (r) => r.t >= 4, 0.008, 0.0);

  for (const [geo, mat] of [
    [sidewalkGeo, sidewalkMat],
    [majorGeo, roadMajorMat],
    [midGeo, roadMidMat],
    [laneGeo, roadLaneMat],
  ]) {
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // 4. Generic 12,756 OSM cube buildings removed per user request: keep only clean map, roads, parks/fields & showcase buildings.
  const collisionGrid = new Map();
  function refreshActiveChunks() {}
  refreshActiveChunks(420, 975, 'high');

  function applyCityCollisions(pos, radius) {
    clampToKhulnaBounds(pos, worldData.meta.bounds);

    // Allow swimming out into Rupsha River near ghats while preventing leaving world east edge
    if (pos.x > 1285) {
      pos.x = 1285;
    }
  }

  function isInWater(x, z) {
    for (let i = 0; i < pondPolys.length; i++) {
      if (pointInFlatPoly(x, z, pondPolys[i])) return true;
    }
    if (x > 960 || z < -780) {
      for (let i = 0; i < riverPolys.length; i++) {
        if (pointInFlatPoly(x, z, riverPolys[i])) return true;
      }
    }
    return false;
  }

  function findNearestRoadAndDistrict(x, z) {
    let bestRoad = null;
    let bestD2 = 2400; // within ~49m
    for (const r of worldData.roads) {
      if (!r.n) continue;
      const pts = r.p;
      for (let i = 0; i < pts.length - 2; i += 2) {
        const mx = 0.5 * (pts[i] + pts[i + 2]);
        const mz = 0.5 * (pts[i + 1] + pts[i + 3]);
        const d2 = (x - mx) * (x - mx) + (z - mz) * (z - mz);
        if (d2 < bestD2) {
          bestD2 = d2;
          bestRoad = r.n;
        }
      }
    }
    let bestPoi = null;
    let bestPoiD2 = 11000;
    for (const p of worldData.pois) {
      const d2 = (x - p.x) * (x - p.x) + (z - p.z) * (z - p.z);
      if (d2 < bestPoiD2) {
        bestPoiD2 = d2;
        bestPoi = p;
      }
    }
    let district = 'KHULNA CITY';
    if (z > 740) district = 'SOUTH TOOTPARA · TALTOLA';
    else if (x > 920) district = 'RUPSHA GHAT & STRAND RD';
    else if (z < -420) district = x < -200 ? 'HADIS PARK · JESSORE RD' : 'CIRCUIT HOUSE & BORO MAATH';
    else if (x < -210) district = z < -210 ? 'ROYAL MORE · TALTOLA LN' : 'PTI MORE · BABU KHAN RD';
    else if (x > 90 && z > 20 && z < 450) district = 'ALIA MADRASAH · KABORKHANA';
    else district = 'HAJI MOHSIN RD · TOOTPARA';

    const { lat, lon } = worldXZToLatLon(x, z);
    return {
      district,
      road: bestRoad,
      poi: bestPoi?.bn || bestPoi?.n || null,
      lat,
      lon,
    };
  }

  function animateWater(time) {
    if (!waterShaderMat) {
      tex.waterTex.offset.x = (time * 0.015) % 1;
      tex.waterTex.offset.y = (time * 0.008) % 1;
    }
  }

  function setQualityMode(qualityMode) {
    const nextWaterMat = waterShaderMat || waterLowMat;
    for (const wm of waterMeshes) {
      if (wm.material !== nextWaterMat) wm.material = nextWaterMat;
    }
    const nextAniso = qualityMode === 'low' ? 4 : (qualityMode === 'medium' ? 6 : 8);
    for (const t of [tex.roadMajorTex, tex.roadMidTex, tex.roadLaneTex, tex.sidewalkTex, tex.grassTex, tex.pitchTex, tex.landTex]) {
      if (t && t.anisotropy !== nextAniso) {
        t.anisotropy = nextAniso;
        t.needsUpdate = true;
      }
    }
  }

  for (const child of group.children) {
    child.matrixAutoUpdate = false;
    child.updateMatrix();
  }

  function setFogBounds(near, far) {
    if (waterShaderMat?.uniforms) {
      waterShaderMat.uniforms.uFogNear.value = near;
      waterShaderMat.uniforms.uFogFar.value = far;
    }
  }

  return {
    group,
    data: worldData,
    refreshActiveChunks,
    applyCityCollisions,
    isInWater,
    findNearestRoadAndDistrict,
    animateWater,
    setQualityMode,
    setFogBounds,
    setVisible(visible) {
      group.visible = visible;
    },
  };
}
