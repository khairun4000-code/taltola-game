import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import worldData from './data/khulna-world-data.json';
import { clampToKhulnaBounds, worldXZToLatLon } from './khulna-geo.js';
import { createKhulnaStreetPropsSystem } from './khulna-street-props.js';
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

  function buildFacadeTexPair(cols, rows, isLowRise) {
    const S = 512;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');

    const eCanvas = document.createElement('canvas');
    eCanvas.width = S;
    eCanvas.height = S;
    const eCtx = eCanvas.getContext('2d');
    eCtx.fillStyle = '#000000';
    eCtx.fillRect(0, 0, S, S);

    const rnd = seeded(isLowRise ? 4109 : 8821);
    ctx.fillStyle = '#ebe6dc';
    ctx.fillRect(0, 0, S, S);

    for (let i = 0; i < 65; i++) {
      const y = rnd() * S;
      ctx.fillStyle = `rgba(48, 54, 46, ${0.025 + rnd() * 0.055})`;
      ctx.fillRect(0, y, S, 4 + rnd() * 16);
    }
    for (let i = 0; i < 42; i++) {
      const x = rnd() * S;
      const h = 26 + rnd() * 110;
      ctx.fillStyle = `rgba(38, 42, 34, ${0.03 + rnd() * 0.06})`;
      ctx.fillRect(x, rnd() * (S - h), 3 + rnd() * 7, h);
    }

    const cw = S / cols;
    const rh = S / rows;
    for (let r = 0; r < rows; r++) {
      const isGround = r === rows - 1;
      ctx.fillStyle = 'rgba(28, 32, 36, 0.24)';
      ctx.fillRect(0, r * rh, S, Math.max(5, rh * 0.11));
      ctx.fillStyle = 'rgba(255, 255, 255, 0.34)';
      ctx.fillRect(0, r * rh + Math.max(5, rh * 0.11), S, 4);
      for (let c = 0; c <= cols; c++) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.fillRect(c * cw - 6, r * rh, 12, rh);
      }

      for (let c = 0; c < cols; c++) {
        const wx = c * cw + cw * 0.16;
        const wy = r * rh + rh * 0.22;
        const ww = cw * 0.68;
        const wh = rh * 0.60;

        if (isGround && !isLowRise && c % 2 === 0) {
          ctx.fillStyle = '#334155';
          ctx.fillRect(wx - 4, wy - 6, ww + 8, wh + 14);
          for (let sy = wy; sy < wy + wh + 6; sy += 8) {
            ctx.fillStyle = sy % 16 === 0 ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.22)';
            ctx.fillRect(wx - 2, sy, ww + 4, 4);
          }
          ctx.fillStyle = (c % 4 === 0) ? '#065f46' : '#991b1b';
          ctx.fillRect(wx - 6, wy - 18, ww + 12, 16);
          eCtx.fillStyle = '#fde68a';
          eCtx.fillRect(wx - 4, wy - 16, ww + 8, 12);
          continue;
        }

        ctx.fillStyle = 'rgba(18, 24, 30, 0.34)';
        ctx.fillRect(wx - 5, wy - 6, ww + 10, 8);
        ctx.fillStyle = '#d6d3cb';
        ctx.fillRect(wx - 4, wy - 3, ww + 8, wh + 8);

        const lit = rnd() > 0.34;
        const warmLight = rnd() > 0.30;
        const grad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
        if (lit) {
          grad.addColorStop(0, warmLight ? '#5a503a' : '#3d5668');
          grad.addColorStop(1, '#1d2730');
        } else {
          grad.addColorStop(0, '#1e2c38');
          grad.addColorStop(1, '#111920');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(wx, wy, ww, wh);

        ctx.fillStyle = warmLight ? 'rgba(196, 152, 112, 0.32)' : 'rgba(120, 158, 182, 0.28)';
        ctx.fillRect(wx + 2, wy + 2, ww * 0.16, wh - 4);
        ctx.fillRect(wx + ww * 0.82, wy + 2, ww * 0.16, wh - 4);

        if (lit) {
          const eGrad = eCtx.createLinearGradient(wx, wy, wx, wy + wh);
          if (warmLight) {
            eGrad.addColorStop(0, '#ffdf8c');
            eGrad.addColorStop(0.65, '#f59e0b');
            eGrad.addColorStop(1, '#92400e');
          } else {
            eGrad.addColorStop(0, '#e0f2fe');
            eGrad.addColorStop(0.65, '#7dd3fc');
            eGrad.addColorStop(1, '#1e3a8a');
          }
          eCtx.fillStyle = eGrad;
          eCtx.fillRect(wx + 4, wy + 4, ww - 8, wh - 8);
          eCtx.fillStyle = '#090d14';
          eCtx.fillRect(wx + 2, wy + 2, ww * 0.14, wh - 4);
          eCtx.fillRect(wx + ww * 0.84, wy + 2, ww * 0.14, wh - 4);
          eCtx.fillRect(wx + ww * 0.48, wy, 4, wh);
          eCtx.fillRect(wx, wy + wh * 0.50, ww, 4);
        }

        ctx.fillStyle = 'rgba(22, 28, 34, 0.65)';
        for (let gx = 0.25; gx < 0.9; gx += 0.25) { ctx.fillRect(wx + ww * gx, wy, 2, wh); }
        for (let gy = 0.33; gy < 0.9; gy += 0.33) { ctx.fillRect(wx, wy + wh * gy, ww, 2); }
        ctx.fillStyle = 'rgba(232, 238, 244, 0.55)';
        ctx.fillRect(wx + ww * 0.48, wy, 4, wh);
        ctx.fillRect(wx, wy + wh * 0.50, ww, 3);
      }
    }

    const mapTex = new THREE.CanvasTexture(canvas);
    mapTex.colorSpace = THREE.SRGBColorSpace;
    mapTex.wrapS = mapTex.wrapT = THREE.RepeatWrapping;
    mapTex.anisotropy = maxAniso;

    const emissiveTex = new THREE.CanvasTexture(eCanvas);
    emissiveTex.colorSpace = THREE.SRGBColorSpace;
    emissiveTex.wrapS = emissiveTex.wrapT = THREE.RepeatWrapping;
    emissiveTex.anisotropy = maxAniso;
    return { mapTex, emissiveTex };
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

  const highPair = buildFacadeTexPair(3, 5, false);
  const lowPair = buildFacadeTexPair(3, 2, true);
  const highRiseTex = highPair.mapTex;
  const lowRiseTex = lowPair.mapTex;
  const highEmissiveTex = highPair.emissiveTex;
  const lowEmissiveTex = lowPair.emissiveTex;
  highRiseTex.anisotropy = aniso;
  lowRiseTex.anisotropy = aniso;

  return {
    highRiseTex,
    lowRiseTex,
    highEmissiveTex,
    lowEmissiveTex,
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


  // 4. Instanced City Building Pools (6 architectural palettes × 2 LOD heights + parapet trim = max 13 draw calls!)
  const STYLE_COLORS = [
    0xece3d3, // 0: Warm Cream Plaster
    0xc46750, // 1: Khulna Red Brick
    0xd4a46b, // 2: Terracotta / Ochre
    0xf2f5f8, // 3: Modern White / Concrete Glass
    0xb8cec6, // 4: Mint / Seafoam Mid-rise
    0x9ba6ad, // 5: Low Semi-Pucca / Tin Shop
  ];

  // Use two unit BoxGeometries with origin at y=0 (scale Y directly by total height!)
  const makeUnitBox = (repX, repY) => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) * repX, uv.getY(i) * repY);
    }
    return g;
  };
  const lowBoxGeo = makeUnitBox(2, 2);
  const highBoxGeo = makeUnitBox(3, 5);
  const roofBoxGeo = makeUnitBox(1, 1);

  const MAX_INST_LOW = 2800;
  const MAX_INST_HIGH = 2800;
  const MAX_INST_ROOF = 4500;

  const lowPools = [];
  const highPools = [];
  const buildingNightMats = [];
  const lowPBR = generateNormalAndRoughnessMaps(tex.lowRiseTex.image, { strength: 2.2, roughBase: 0.80 });
  const highPBR = generateNormalAndRoughnessMaps(tex.highRiseTex.image, { strength: 2.2, roughBase: 0.72 });
  for (let s = 0; s < 6; s++) {
    const lowMat = new THREE.MeshStandardMaterial({
      color: STYLE_COLORS[s],
      map: tex.lowRiseTex,
      emissive: new THREE.Color(0xffdfa0),
      emissiveMap: tex.lowEmissiveTex,
      emissiveIntensity: 0.10,
      normalMap: lowPBR.normalMap,
      roughnessMap: lowPBR.roughnessMap,
      normalScale: new THREE.Vector2(0.95, 0.95),
      roughness: 0.78,
      metalness: 0.05,
      envMapIntensity: 0.85,
    });
    const highMat = new THREE.MeshStandardMaterial({
      color: STYLE_COLORS[s],
      map: tex.highRiseTex,
      emissive: new THREE.Color(0xffe4a8),
      emissiveMap: tex.highEmissiveTex,
      emissiveIntensity: 0.12,
      normalMap: highPBR.normalMap,
      roughnessMap: highPBR.roughnessMap,
      normalScale: new THREE.Vector2(0.95, 0.95),
      roughness: 0.70,
      metalness: 0.10,
      envMapIntensity: 1.05,
    });
    buildingNightMats.push(lowMat, highMat);

    const mLow = new THREE.InstancedMesh(lowBoxGeo, lowMat, MAX_INST_LOW);
    const mHigh = new THREE.InstancedMesh(highBoxGeo, highMat, MAX_INST_HIGH);
    mLow.count = 0;
    mHigh.count = 0;
    mLow.frustumCulled = false;
    mHigh.frustumCulled = false;
    mLow.receiveShadow = true;
    mHigh.receiveShadow = true;
    mHigh.castShadow = false;
    group.add(mLow, mHigh);
    lowPools.push(mLow);
    highPools.push(mHigh);
  }

  const roofMat = new THREE.MeshStandardMaterial({ color: 0x5c5e61, roughness: 0.90, metalness: 0.04 });
  const roofPool = new THREE.InstancedMesh(roofBoxGeo, roofMat, MAX_INST_ROOF);
  roofPool.count = 0;
  roofPool.frustumCulled = false;
  group.add(roofPool);

  // 4B. 3D Architectural Detail Pools on Khulna City Houses (Balconies, Shop Awnings, Rooftop Mumties, Gazi Water Tanks, AC Units — 5 draw calls!)
  const MAX_DET = 1600;
  const balconyMat = new THREE.MeshStandardMaterial({ color: 0xded7c8, roughness: 0.82, metalness: 0.08 });
  const balconyPool = new THREE.InstancedMesh(roofBoxGeo, balconyMat, MAX_DET);
  const awningMat = new THREE.MeshStandardMaterial({ color: 0x1d5f7a, roughness: 0.58, metalness: 0.25 });
  const awningPool = new THREE.InstancedMesh(roofBoxGeo, awningMat, MAX_DET);
  const mumtyMat = new THREE.MeshStandardMaterial({ color: 0xd9d2c5, roughness: 0.86, metalness: 0.04 });
  const mumtyPool = new THREE.InstancedMesh(roofBoxGeo, mumtyMat, MAX_DET);
  const tankGeo = new THREE.CylinderGeometry(0.55, 0.58, 1.25, 8);
  tankGeo.translate(0, 0.625, 0);
  const tankMat = new THREE.MeshStandardMaterial({ color: 0x141a20, roughness: 0.42, metalness: 0.15 });
  const waterTankPool = new THREE.InstancedMesh(tankGeo, tankMat, MAX_DET);
  const acMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.48, metalness: 0.25 });
  const acPool = new THREE.InstancedMesh(roofBoxGeo, acMat, MAX_DET);
  for (const p of [balconyPool, awningPool, mumtyPool, waterTankPool, acPool]) {
    p.count = 0;
    p.frustumCulled = false;
    group.add(p);
  }

  // 4C. Khulna Citywide Utility Poles, Tangled Overhead Wires, House Drop Lines, Posters & Election Banners!
  const streetProps = createKhulnaStreetPropsSystem(group, worldData);

  // Fast Spatial Road-Segment Grid so ZERO buildings ever sit in the middle of any Khulna road!
  const ROAD_CELL = 40;
  const roadSegGrid = new Map();
  for (const r of worldData.roads) {
    const pts = r.p;
    if (!pts || pts.length < 4) continue;
    const roadHW = r.w ? (r.w * 0.5) : (r.t <= 1 ? 6.5 : (r.t <= 3 ? 4.8 : 3.2));
    for (let i = 0; i < pts.length - 2; i += 2) {
      const ax = pts[i], az = pts[i + 1], bx = pts[i + 2], bz = pts[i + 3];
      const pad = roadHW + 8.0;
      const c0 = Math.floor((Math.min(ax, bx) - pad) / ROAD_CELL);
      const c1 = Math.floor((Math.max(ax, bx) + pad) / ROAD_CELL);
      const r0 = Math.floor((Math.min(az, bz) - pad) / ROAD_CELL);
      const r1 = Math.floor((Math.max(az, bz) + pad) / ROAD_CELL);
      const seg = { ax, az, bx, bz, hw: roadHW };
      for (let gx = c0; gx <= c1; gx++) {
        for (let gz = r0; gz <= r1; gz++) {
          const k = (gx + 500) * 1000 + (gz + 500);
          let arr = roadSegGrid.get(k);
          if (!arr) { arr = []; roadSegGrid.set(k, arr); }
          arr.push(seg);
        }
      }
    }
  }

  function isOverlappingAnyRoad(cx, cz, bw = 8, bd = 8) {
    const gx = Math.floor(cx / ROAD_CELL);
    const gz = Math.floor(cz / ROAD_CELL);
    const segs = roadSegGrid.get((gx + 500) * 1000 + (gz + 500));
    if (!segs) return false;
    const bRadius = Math.min(bw, bd) * 0.44 + 1.15;
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      const vx = s.bx - s.ax;
      const vz = s.bz - s.az;
      const lenSq = vx * vx + vz * vz;
      let t = 0;
      if (lenSq > 1e-4) {
        t = THREE.MathUtils.clamp(((cx - s.ax) * vx + (cz - s.az) * vz) / lenSq, 0, 1);
      }
      const px = s.ax + vx * t;
      const pz = s.az + vz * t;
      const dx = cx - px;
      const dz = cz - pz;
      const clearDist = s.hw + bRadius;
      if (dx * dx + dz * dz < clearDist * clearDist) return true;
    }
    return false;
  }

  // Exclude generic raw OSM placeholder cubes inside all AAA Showcase Corridors, Landmarks, AND any road!
  function isHeroExcludedBuilding(cx, cz, bw = 8, bd = 8) {
    // 1) AAA Slice 3: Taltola House compound + tight Cross Rd neighborhood frontage (keeps nearby OSM blocks intact!)
    if (cx >= 401 && cx <= 439 && cz >= 942 && cz <= 1012) return true;
    // 2) AAA Slice 1: Haji Mohsin Road Extended AAA Corridor (z = -150..+150, East & West flanks)
    if (cx >= -66 && cx <= 70 && cz >= -152 && cz <= 152) return true;
    // 3) Khulna Alia Kamil Madrasah full 3D campus footprint
    if (cx >= 134 && cx <= 232 && cz >= 62 && cz <= 156) return true;
    // 4) Khulna District Stadium ring stands & floodlight towers
    if (cx >= -152 && cx <= 24 && cz >= -828 && cz <= -646) return true;
    // 5) Khulna Circuit House heritage pavilions & Boro Maath foreground
    if (cx >= 72 && cx <= 136 && cz >= -720 && cz <= -648) return true;
    // 6) PTI More roundabout traffic island
    if (cx >= -318 && cx <= -280 && cz >= -78 && cz <= -42) return true;
    // 7) AAA Slice 2: Rupsha Strand Road, Natun Bazar Launch Ghat & Rupsha Ferry Terminal Waterfront
    if (cx >= 1038 && cx <= 1290 && cz >= -55 && cz <= 695) return true;
    // 8) Remove any building whose footprint falls inside a road!
    if (isOverlappingAnyRoad(cx, cz, bw, bd)) return true;
    return false;
  }

  // 5. Spatial Hash for O(1) Building Collision Lookup across all 12,756 buildings
  const collisionGrid = new Map();
  for (const [, list] of Object.entries(worldData.chunks)) {
    for (const b of list) {
      const [cx, cz, bw, bd, yaw, floors] = b;
      if (isHeroExcludedBuilding(cx, cz, bw, bd)) continue;
      const cosY = Math.cos(-yaw);
      const sinY = Math.sin(-yaw);
      const hw = bw * 0.5;
      const hd = bd * 0.5;
      const maxR = Math.hypot(hw, hd) + 0.5;
      const c0 = Math.floor((cx - maxR) / COLLISION_CELL);
      const c1 = Math.floor((cx + maxR) / COLLISION_CELL);
      const r0 = Math.floor((cz - maxR) / COLLISION_CELL);
      const r1 = Math.floor((cz + maxR) / COLLISION_CELL);
      const entry = { cx, cz, hw, hd, cosY, sinY, h: floors * FLOOR_HEIGHT };
      for (let gx = c0; gx <= c1; gx++) {
        for (let gz = r0; gz <= r1; gz++) {
          const k = (gx + 500) * 1000 + (gz + 500);
          let arr = collisionGrid.get(k);
          if (!arr) {
            arr = [];
            collisionGrid.set(k, arr);
          }
          arr.push(entry);
        }
      }
    }
  }

  // 6. Chunk Streaming State (rebuild InstancedMesh buffers ONLY when crossing 240m chunk boundary or quality change)
  const chunkSize = worldData.meta.chunkSize || 240;
  let lastChunkKey = '';
  const dummy = new THREE.Object3D();

  function refreshActiveChunks(playerX, playerZ, qualityMode = 'high') {
    streetProps.refreshActiveChunks(playerX, playerZ, qualityMode);
    const ringRadius = qualityMode === 'low' ? 1 : (qualityMode === 'medium' ? 1 : 2);
    const maxDistSq = Math.pow((ringRadius + 0.85) * chunkSize, 2);
    const detailDistSq = qualityMode === 'low' ? 155 * 155 : 260 * 260;
    const pCx = Math.floor(playerX / chunkSize);
    const pCz = Math.floor(playerZ / chunkSize);
    const nextKey = `${pCx},${pCz},${ringRadius},${qualityMode}`;
    if (nextKey === lastChunkKey) return;
    lastChunkKey = nextKey;

    const lowCounts = [0, 0, 0, 0, 0, 0];
    const highCounts = [0, 0, 0, 0, 0, 0];
    let roofCount = 0;
    let balCount = 0;
    let awnCount = 0;
    let mumCount = 0;
    let tankCount = 0;
    let acCount = 0;

    for (let dx = -ringRadius; dx <= ringRadius; dx++) {
      for (let dz = -ringRadius; dz <= ringRadius; dz++) {
        const list = worldData.chunks[`${pCx + dx},${pCz + dz}`];
        if (!list) continue;
        for (let i = 0; i < list.length; i++) {
          const [cx, cz, bw, bd, yaw, floors, style] = list[i];
          if (isHeroExcludedBuilding(cx, cz, bw, bd)) continue;
          const d2 = (cx - playerX) * (cx - playerX) + (cz - playerZ) * (cz - playerZ);
          if (d2 > maxDistSq) continue;

          const h = floors * FLOOR_HEIGHT;
          dummy.position.set(cx, 0, cz);
          dummy.rotation.set(0, -yaw, 0);
          dummy.scale.set(bw, h, bd);
          dummy.updateMatrix();

          const st = style % 6;
          if (floors <= 2) {
            const idx = lowCounts[st];
            if (idx < MAX_INST_LOW) {
              lowPools[st].setMatrixAt(idx, dummy.matrix);
              lowCounts[st]++;
            }
          } else {
            const idx = highCounts[st];
            if (idx < MAX_INST_HIGH) {
              highPools[st].setMatrixAt(idx, dummy.matrix);
              highCounts[st]++;
            }
            if (roofCount < MAX_INST_ROOF && d2 < 260000) {
              dummy.position.set(cx, h, cz);
              dummy.scale.set(Math.max(0.6, bw + 0.30), 0.72, Math.max(0.6, bd + 0.30));
              dummy.updateMatrix();
              roofPool.setMatrixAt(roofCount++, dummy.matrix);
            }
          }

          if (d2 < detailDistSq) {
            const cosY = Math.cos(-yaw);
            const sinY = Math.sin(-yaw);
            if (floors >= 3 && balCount < MAX_DET) {
              const offZ = bd * 0.5 + 0.45;
              dummy.position.set(cx + sinY * offZ, FLOOR_HEIGHT * 1.98, cz + cosY * offZ);
              dummy.rotation.set(0, -yaw, 0);
              dummy.scale.set(Math.max(2.2, bw * 0.62), 0.95, 0.92);
              dummy.updateMatrix();
              balconyPool.setMatrixAt(balCount++, dummy.matrix);
            }
            if (awnCount < MAX_DET && (i & 1) === 0) {
              const offZ = bd * 0.5 + 0.55;
              dummy.position.set(cx + sinY * offZ, 2.85, cz + cosY * offZ);
              dummy.rotation.set(0.22, -yaw, 0);
              dummy.scale.set(Math.max(2.4, bw * 0.78), 0.14, 1.15);
              dummy.updateMatrix();
              awningPool.setMatrixAt(awnCount++, dummy.matrix);
            }
            if (floors >= 3 && mumCount < MAX_DET) {
              dummy.position.set(cx, h + 0.35, cz);
              dummy.rotation.set(0, -yaw, 0);
              dummy.scale.set(Math.min(3.4, bw * 0.36), 2.25, Math.min(3.4, bd * 0.36));
              dummy.updateMatrix();
              mumtyPool.setMatrixAt(mumCount++, dummy.matrix);
            }
            if (floors >= 2 && tankCount < MAX_DET) {
              const tx = cx + cosY * (bw * 0.24);
              const tz = cz - sinY * (bw * 0.24);
              dummy.position.set(tx, h + 0.45, tz);
              dummy.rotation.set(0, 0, 0);
              dummy.scale.set(1, 1, 1);
              dummy.updateMatrix();
              waterTankPool.setMatrixAt(tankCount++, dummy.matrix);
            }
            if (floors >= 3 && acCount < MAX_DET && (i % 3 === 0)) {
              const offX = bw * 0.5 + 0.20;
              dummy.position.set(cx + cosY * offX, FLOOR_HEIGHT * 1.45, cz - sinY * offX);
              dummy.rotation.set(0, -yaw, 0);
              dummy.scale.set(0.36, 0.56, 0.80);
              dummy.updateMatrix();
              acPool.setMatrixAt(acCount++, dummy.matrix);
            }
          }
        }
      }
    }

    for (let s = 0; s < 6; s++) {
      lowPools[s].count = lowCounts[s];
      lowPools[s].instanceMatrix.needsUpdate = true;
      highPools[s].count = highCounts[s];
      highPools[s].instanceMatrix.needsUpdate = true;
    }
    roofPool.count = roofCount;
    roofPool.instanceMatrix.needsUpdate = true;
    balconyPool.count = balCount; balconyPool.instanceMatrix.needsUpdate = true;
    awningPool.count = awnCount; awningPool.instanceMatrix.needsUpdate = true;
    mumtyPool.count = mumCount; mumtyPool.instanceMatrix.needsUpdate = true;
    waterTankPool.count = tankCount; waterTankPool.instanceMatrix.needsUpdate = true;
    acPool.count = acCount; acPool.instanceMatrix.needsUpdate = true;
  }

  // Initialize around Taltola House or Origin cleanly on frame 0
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

  function setNightFactor(nightFactor = 0) {
    const nf = THREE.MathUtils.clamp(nightFactor, 0, 1);
    const glow = 0.08 + nf * 1.55;
    for (let i = 0; i < buildingNightMats.length; i++) {
      buildingNightMats[i].emissiveIntensity = glow;
    }
    streetProps.setNightFactor(nf);
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
    setNightFactor,
    setQualityMode,
    setFogBounds,
    setVisible(visible) {
      group.visible = visible;
      streetProps.setVisible(visible);
    },
  };
}
