import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  attachDerivedPBRMaps,
  upgradeReflectiveBuildingFacade,
  applyFoliageWindShader,
} from './aaa-shaders.js';
import { TALTOLA_HOUSE_OFFSET } from './khulna-geo.js';

function seeded(seed = 9187) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Generates paired Diffuse + Explicit Roughness maps for Thai-Glass Curtain-Wall Towers.
 * Glass cells have ultra-low roughness (#121212 -> ~0.07) so upgradeReflectiveBuildingFacade
 * activates mirror sky/skyline PMREM reflections + 3D interior-mapped parallax rooms!
 */
function createCurtainWallMaps() {
  const W = 512;
  const H = 512;
  const diffC = document.createElement('canvas');
  diffC.width = W;
  diffC.height = H;
  const dCtx = diffC.getContext('2d');

  const roughC = document.createElement('canvas');
  roughC.width = W;
  roughC.height = H;
  const rCtx = roughC.getContext('2d');

  // Matte-metallic structural spandrel & mullion base
  dCtx.fillStyle = '#cbd5e1';
  dCtx.fillRect(0, 0, W, H);
  rCtx.fillStyle = '#969696'; // roughness ~0.59 on mullions/spandrels
  rCtx.fillRect(0, 0, W, H);

  // 4 horizontal bays x 4 floor rows per tile
  const cols = 4;
  const rows = 4;
  const cellW = W / cols;
  const cellH = H / rows;

  const tints = [
    ['#0f3b57', '#1d688a'], // Deep Khulna Thai sapphire glass
    ['#0c4447', '#177573'], // Teal-emerald reflective glass
    ['#16334d', '#285980'], // Steel-blue corporate curtain glass
    ['#133e4c', '#1f6e82'], // Cyan-slate hotel curtain glass
  ];

  for (let r = 0; r < rows; r++) {
    const y0 = r * cellH;
    // Concrete/ACP floor spandrel band at top & bottom of each floor
    dCtx.fillStyle = r % 2 === 0 ? '#dce3ea' : '#c9d3dc';
    dCtx.fillRect(0, y0, W, 20);
    dCtx.fillStyle = '#334155';
    dCtx.fillRect(0, y0 + 18, W, 4);
    rCtx.fillStyle = '#d4d4d4'; // matte concrete band (~0.83)
    rCtx.fillRect(0, y0, W, 22);

    for (let c = 0; c < cols; c++) {
      const x0 = c * cellW;
      const [cTop, cBot] = tints[(r + c) % tints.length];
      const gx = x0 + 7;
      const gy = y0 + 24;
      const gw = cellW - 14;
      const gh = cellH - 30;

      const grad = dCtx.createLinearGradient(gx, gy, gx + gw * 0.6, gy + gh);
      grad.addColorStop(0, cTop);
      grad.addColorStop(0.55, cBot);
      grad.addColorStop(1, cTop);
      dCtx.fillStyle = grad;
      dCtx.fillRect(gx, gy, gw, gh);

      // Subtle diagonal architectural reflection highlight
      dCtx.fillStyle = 'rgba(205, 238, 255, 0.14)';
      dCtx.beginPath();
      dCtx.moveTo(gx + 4, gy + gh - 4);
      dCtx.lineTo(gx + gw * 0.48, gy + 4);
      dCtx.lineTo(gx + gw * 0.72, gy + 4);
      dCtx.lineTo(gx + 26, gy + gh - 4);
      dCtx.closePath();
      dCtx.fill();

      // Dark anodized aluminum sub-frame
      dCtx.strokeStyle = '#1e293b';
      dCtx.lineWidth = 3;
      dCtx.strokeRect(gx, gy, gw, gh);
      dCtx.lineWidth = 1.8;
      dCtx.beginPath();
      dCtx.moveTo(gx + gw * 0.5, gy);
      dCtx.lineTo(gx + gw * 0.5, gy + gh);
      dCtx.stroke();

      // Ultra-smooth mirror glass roughness (~0.06) inside window pane!
      rCtx.fillStyle = '#101010';
      rCtx.fillRect(gx + 2, gy + 2, gw - 4, gh - 4);
    }
  }

  const map = new THREE.CanvasTexture(diffC);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8;

  const roughnessMap = new THREE.CanvasTexture(roughC);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = 4;

  return { map, roughnessMap, diffC };
}

/**
 * Generates paired Diffuse + Roughness maps for Khulna Residential & Apartment Buildings
 * (plaster/brick walls, recessed sliding Thai windows, grille bars, floor cornice bands).
 */
function createResidentialFacadeMaps() {
  const W = 512;
  const H = 512;
  const diffC = document.createElement('canvas');
  diffC.width = W;
  diffC.height = H;
  const dCtx = diffC.getContext('2d');

  const roughC = document.createElement('canvas');
  roughC.width = W;
  roughC.height = H;
  const rCtx = roughC.getContext('2d');

  // Warm plaster base (tinted per building via vertex colors!)
  dCtx.fillStyle = '#eee8dc';
  dCtx.fillRect(0, 0, W, H);
  rCtx.fillStyle = '#dedede'; // matte plaster (~0.87)
  rCtx.fillRect(0, 0, W, H);

  // Subtle tropical weathering & plaster grain
  const rnd = seeded(4411);
  for (let i = 0; i < 1800; i++) {
    const v = 215 + Math.floor(rnd() * 34);
    dCtx.fillStyle = `rgba(${v},${v - 3},${v - 8},0.22)`;
    dCtx.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 4, 2 + rnd() * 3);
  }

  const cols = 4;
  const rows = 4;
  const cellW = W / cols;
  const cellH = H / rows;

  for (let r = 0; r < rows; r++) {
    const y0 = r * cellH;
    // Floor slab ledge & monsoon drip groove
    dCtx.fillStyle = '#f8f6f0';
    dCtx.fillRect(0, y0, W, 12);
    dCtx.fillStyle = 'rgba(40, 36, 30, 0.22)';
    dCtx.fillRect(0, y0 + 12, W, 4);

    for (let c = 0; c < cols; c++) {
      const x0 = c * cellW;
      const wx = x0 + 20;
      const wy = y0 + 28;
      const ww = cellW - 40;
      const wh = cellH - 48;

      // White concrete window sunshade (chajja) & sill
      dCtx.fillStyle = '#d6cfc2';
      dCtx.fillRect(wx - 6, wy - 7, ww + 12, 7);
      dCtx.fillRect(wx - 4, wy + wh, ww + 8, 5);

      // Dark reflective sliding Thai-aluminum window glass
      const wGrad = dCtx.createLinearGradient(wx, wy, wx + ww, wy + wh);
      wGrad.addColorStop(0, '#122c3d');
      wGrad.addColorStop(0.5, '#1e4961');
      wGrad.addColorStop(1, '#0f2433');
      dCtx.fillStyle = wGrad;
      dCtx.fillRect(wx, wy, ww, wh);

      // Center sliding mullion & subtle security grille lines
      dCtx.strokeStyle = '#cbd5e1';
      dCtx.lineWidth = 3;
      dCtx.strokeRect(wx, wy, ww, wh);
      dCtx.beginPath();
      dCtx.moveTo(wx + ww * 0.5, wy);
      dCtx.lineTo(wx + ww * 0.5, wy + wh);
      dCtx.stroke();

      dCtx.strokeStyle = 'rgba(203, 213, 225, 0.28)';
      dCtx.lineWidth = 1.2;
      for (let gy = wy + 14; gy < wy + wh - 6; gy += 14) {
        dCtx.beginPath();
        dCtx.moveTo(wx + 2, gy);
        dCtx.lineTo(wx + ww - 2, gy);
        dCtx.stroke();
      }

      // Smooth glass roughness (~0.07) strictly on window panes!
      rCtx.fillStyle = '#121212';
      rCtx.fillRect(wx + 2, wy + 2, ww - 4, wh - 4);
    }
  }

  const map = new THREE.CanvasTexture(diffC);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8;

  const roughnessMap = new THREE.CanvasTexture(roughC);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = 4;

  return { map, roughnessMap, diffC };
}

/**
 * Generates a Ground-Floor Khulna Commercial Shopfront Atlas (4 shops wide)
 * with Bengali signboards & corrugated shutters/glass showrooms.
 */
function createGroundShopAtlas() {
  const W = 1024;
  const H = 256;
  const diffC = document.createElement('canvas');
  diffC.width = W;
  diffC.height = H;
  const ctx = diffC.getContext('2d');

  const roughC = document.createElement('canvas');
  roughC.width = W;
  roughC.height = H;
  const rCtx = roughC.getContext('2d');

  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, W, H);
  rCtx.fillStyle = '#c8c8c8';
  rCtx.fillRect(0, 0, W, H);

  const shops = [
    { title: 'খুলনা ইলেকট্রনিক্স ও মোবাইল', sub: 'VISION · WALTON · SAMSUNG', bg: '#0f172a', acc: '#38bdf8', glass: true },
    { title: 'সুন্দরবন মডেল ফার্মেসি', sub: '২৪ ঘণ্টা ঔষধ ও সার্জিক্যাল', bg: '#065f46', acc: '#fde047', glass: true },
    { title: 'সাতক্ষীরা ঘোষ ডেয়ারি ও সুইটস', sub: 'খাঁটি মিষ্টি · দই · ঘি · খুলনা', bg: '#991b1b', acc: '#fef08a', glass: false },
    { title: 'সিটি ব্যাংক ও এটিএম বুথ', sub: '24/7 ATM · ONLINE BANKING', bg: '#1e3a8a', acc: '#ffffff', glass: true },
  ];

  const sw = W / shops.length;
  for (let i = 0; i < shops.length; i++) {
    const s = shops[i];
    const x0 = i * sw;

    // Concrete pilasters left/right
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x0, 0, 14, H);
    ctx.fillRect(x0 + sw - 14, 0, 14, H);

    // Top illuminated Bengali signboard
    ctx.fillStyle = s.bg;
    ctx.fillRect(x0 + 10, 12, sw - 20, 68);
    ctx.strokeStyle = s.acc;
    ctx.lineWidth = 4;
    ctx.strokeRect(x0 + 13, 15, sw - 26, 62);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 21px "Noto Sans Bengali", "Segoe UI", sans-serif';
    ctx.fillText(s.title, x0 + sw * 0.5, 42, sw - 36);
    ctx.fillStyle = s.acc;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(s.sub, x0 + sw * 0.5, 65, sw - 36);

    if (s.glass) {
      // Reflective glass showroom front with warm display interior
      const gGrad = ctx.createLinearGradient(x0 + 20, 88, x0 + sw - 20, H - 8);
      gGrad.addColorStop(0, '#133145');
      gGrad.addColorStop(0.5, '#25536e');
      gGrad.addColorStop(1, '#1a2e3b');
      ctx.fillStyle = gGrad;
      ctx.fillRect(x0 + 18, 88, sw - 36, H - 96);

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.strokeRect(x0 + 18, 88, sw - 36, H - 96);
      ctx.beginPath();
      ctx.moveTo(x0 + sw * 0.5, 88);
      ctx.lineTo(x0 + sw * 0.5, H - 8);
      ctx.stroke();

      rCtx.fillStyle = '#141414';
      rCtx.fillRect(x0 + 20, 90, sw - 40, H - 100);
    } else {
      // Half-open corrugated steel shutter + warm sweet-shop counter
      ctx.fillStyle = '#475569';
      ctx.fillRect(x0 + 18, 88, sw - 36, H - 96);
      for (let sy = 92; sy < H - 10; sy += 8) {
        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        ctx.fillRect(x0 + 18, sy, sw - 36, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(x0 + 18, sy + 4, sw - 36, 3);
      }
      rCtx.fillStyle = '#707070';
      rCtx.fillRect(x0 + 18, 88, sw - 36, H - 96);
    }
  }

  const map = new THREE.CanvasTexture(diffC);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8;

  const roughnessMap = new THREE.CanvasTexture(roughC);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = 4;

  return { map, roughnessMap };
}

/** Rooftop Bengali Commercial Billboard Atlas (Shah Cement / Telecom / City Plaza) */
function createRooftopBillboardTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');

  const ads = [
    { bg: '#b91c1c', fg: '#ffffff', sub: '#fde047', t1: 'শাহ্ সিমেন্ট · নির্মাণে অবিচল', t2: 'SHAH CEMENT · KHULNA METRO' },
    { bg: '#0369a1', fg: '#ffffff', sub: '#bae6fd', t1: 'খুলনা সিটি কমার্শিয়াল টাওয়ার', t2: 'DAKBANGLA · KDA AVENUE · KHULNA' },
  ];
  for (let i = 0; i < 2; i++) {
    const y0 = i * 128;
    const a = ads[i];
    ctx.fillStyle = a.bg;
    ctx.fillRect(0, y0, 512, 128);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, y0 + 6, 500, 116);
    ctx.fillStyle = a.fg;
    ctx.textAlign = 'center';
    ctx.font = 'bold 31px "Noto Sans Bengali", "Segoe UI", sans-serif';
    ctx.fillText(a.t1, 256, y0 + 56, 476);
    ctx.fillStyle = a.sub;
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText(a.t2, 256, y0 + 96, 476);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function createTreeFoliageTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(6029);
  ctx.fillStyle = '#2d5a27';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 280; i++) {
    const g = 75 + Math.floor(rnd() * 68);
    const r = 34 + Math.floor(rnd() * 36);
    ctx.fillStyle = `rgb(${r}, ${g}, ${24 + Math.floor(rnd() * 24)})`;
    ctx.beginPath();
    ctx.ellipse(rnd() * 256, rnd() * 256, 7 + rnd() * 11, 4 + rnd() * 7, rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
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

function pointInFlatPoly(x, z, flat) {
  let inside = false;
  const n = flat.length;
  for (let i = 0, j = n - 2; i < n; j = i, i += 2) {
    const xi = flat[i];
    const zi = flat[i + 1];
    const xj = flat[j];
    const zj = flat[j + 1];
    const intersect = ((zi > z) !== (zj > z)) && (x < ((xj - xi) * (z - zi)) / (zj - zi + 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function pushColoredBox(list, sizeX, sizeY, sizeZ, cx, cy, cz, rotY, colorHex, uvScaleX = 1, uvScaleY = 1, uvOffsetY = 0, uvRangeY = 1) {
  const g = new THREE.BoxGeometry(sizeX, sizeY, sizeZ).toNonIndexed();
  const pos = g.attributes.position;
  const norm = g.attributes.normal;
  const uv = g.attributes.uv;

  // World-scaled UVs on vertical walls so window bays & floors match real meters!
  for (let i = 0; i < pos.count; i++) {
    const nx = norm.getX(i);
    const ny = norm.getY(i);
    const nz = norm.getZ(i);
    if (Math.abs(ny) > 0.5) {
      uv.setXY(i, (pos.getX(i) / Math.max(1, sizeX) + 0.5) * uvScaleX, (pos.getZ(i) / Math.max(1, sizeZ) + 0.5) * uvScaleY);
    } else {
      const u0 = uv.getX(i);
      const v0 = uv.getY(i);
      const wallSpan = Math.abs(nx) > 0.5 ? sizeZ : sizeX;
      uv.setXY(
        i,
        u0 * Math.max(1, Math.round(wallSpan / 13.2)) * uvScaleX,
        uvOffsetY + v0 * uvRangeY * uvScaleY
      );
    }
  }

  if (rotY) g.rotateY(rotY);
  g.translate(cx, cy, cz);

  const col = new THREE.Color(colorHex);
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  list.push(g);
}

function pushColoredCyl(list, rTop, rBot, h, segs, cx, cy, cz, colorHex) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, segs).toNonIndexed();
  g.translate(cx, cy, cz);
  const pos = g.attributes.position;
  const col = new THREE.Color(colorHex);
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  list.push(g);
}

/**
 * Chunk-streamed, high-graphics Khulna City Buildings & Street Foliage System.
 * Populates the 101 spatial chunks of Khulna City with reflective Thai-glass commercial towers,
 * balcony apartments, ground-floor Bengali shops, rooftop water tanks/billboards, and lush trees,
 * while strictly respecting all existing hero landmarks, corridors, roads, parks, and rivers.
 */
export function createKhulnaCityBuildingsSystem(parentGroup, worldData, skySystem, materialUniforms, isInWaterFn) {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'KhulnaCityReflectiveBuildings';
  parentGroup.add(rootGroup);

  const skyUniforms = skySystem?.sharedUniforms || null;
  const chunkSize = worldData.meta?.chunkSize || 240;

  // 1. Shared PBR Reflective Materials (only 6 materials across the entire city -> minimal draw calls!)
  const curtainMaps = createCurtainWallMaps();
  const curtainMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: curtainMaps.map,
    roughnessMap: curtainMaps.roughnessMap,
    roughness: 1.0,
    metalness: 0.12,
    envMapIntensity: 1.95,
    vertexColors: true,
  });
  attachDerivedPBRMaps(curtainMat, curtainMaps.map, { strength: 1.4, roughBase: 0.4, normalScale: 0.42 });
  // Preserve explicit glass roughnessMap after attachDerivedPBRMaps!
  curtainMat.roughnessMap = curtainMaps.roughnessMap;
  curtainMat.userData.pbrRoughnessMap = curtainMaps.roughnessMap;
  upgradeReflectiveBuildingFacade(curtainMat, skyUniforms, {
    roomWidth: 3.35,
    roomHeight: 3.35,
    roomDepth: 3.4,
    glassMetalness: 0.42,
  });

  const resMaps = createResidentialFacadeMaps();
  const residentialMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: resMaps.map,
    roughnessMap: resMaps.roughnessMap,
    roughness: 1.0,
    metalness: 0.04,
    envMapIntensity: 1.65,
    vertexColors: true,
  });
  attachDerivedPBRMaps(residentialMat, resMaps.map, { strength: 1.7, roughBase: 0.82, normalScale: 0.52 });
  residentialMat.roughnessMap = resMaps.roughnessMap;
  residentialMat.userData.pbrRoughnessMap = resMaps.roughnessMap;
  upgradeReflectiveBuildingFacade(residentialMat, skyUniforms, {
    roomWidth: 3.30,
    roomHeight: 3.15,
    roomDepth: 3.0,
    glassMetalness: 0.28,
  });

  const shopMaps = createGroundShopAtlas();
  const shopMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: shopMaps.map,
    roughnessMap: shopMaps.roughnessMap,
    roughness: 1.0,
    metalness: 0.08,
    envMapIntensity: 1.45,
    emissive: 0xfff1d0,
    emissiveMap: shopMaps.map,
    emissiveIntensity: 0.14,
    vertexColors: true,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.68,
    metalness: 0.14,
    envMapIntensity: 0.85,
    vertexColors: true,
  });

  const billboardTex = createRooftopBillboardTexture();
  const billboardMat = new THREE.MeshStandardMaterial({
    map: billboardTex,
    emissive: 0xffffff,
    emissiveMap: billboardTex,
    emissiveIntensity: 0.22,
    roughness: 0.48,
    metalness: 0.08,
    side: THREE.DoubleSide,
    vertexColors: true,
  });

  const canopyTex = createTreeFoliageTexture();
  const canopyMat = new THREE.MeshStandardMaterial({
    map: canopyTex,
    roughness: 0.76,
    metalness: 0.02,
    envMapIntensity: 0.45,
    vertexColors: true,
  });
  applyFoliageWindShader(canopyMat, materialUniforms);

  // 2. Fast Spatial Road Grid (cell = 32m) so NO building or tree ever overlaps any Khulna road!
  const roadCellSize = 32;
  const roadGrid = new Map();
  const majorJunctions = [];
  for (const r of worldData.roads) {
    const pts = r.p;
    if (!pts || pts.length < 4) continue;
    const hw = (r.w || 6.0) * 0.5 + (r.t <= 2 ? 2.4 : 1.75);
    const isMajor = r.t <= 2;
    for (let i = 0; i < pts.length - 2; i += 2) {
      const ax = pts[i];
      const az = pts[i + 1];
      const bx = pts[i + 2];
      const bz = pts[i + 3];
      if (isMajor && i === 0) majorJunctions.push([ax, az]);
      const minX = Math.min(ax, bx) - hw - 18;
      const maxX = Math.max(ax, bx) + hw + 18;
      const minZ = Math.min(az, bz) - hw - 18;
      const maxZ = Math.max(az, bz) + hw + 18;
      const c0x = Math.floor(minX / roadCellSize);
      const c1x = Math.floor(maxX / roadCellSize);
      const c0z = Math.floor(minZ / roadCellSize);
      const c1z = Math.floor(maxZ / roadCellSize);
      const seg = { ax, az, bx, bz, hw, roadType: r.t, yaw: Math.atan2(bx - ax, bz - az) };
      for (let gx = c0x; gx <= c1x; gx++) {
        for (let gz = c0z; gz <= c1z; gz++) {
          const gk = `${gx},${gz}`;
          let arr = roadGrid.get(gk);
          if (!arr) {
            arr = [];
            roadGrid.set(gk, arr);
          }
          arr.push(seg);
        }
      }
    }
  }

  // Park / Field polygons from worldData.greens
  const greenPolys = (worldData.greens || []).map((gr) => {
    const flat = gr.p;
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (let i = 0; i < flat.length; i += 2) {
      if (flat[i] < minX) minX = flat[i];
      if (flat[i] > maxX) maxX = flat[i];
      if (flat[i + 1] < minZ) minZ = flat[i + 1];
      if (flat[i + 1] > maxZ) maxZ = flat[i + 1];
    }
    return { flat, minX: minX - 3, maxX: maxX + 3, minZ: minZ - 3, maxZ: maxZ + 3 };
  });

  // Hero corridor polylines that already have custom hand-crafted roadside buildings
  const heroCorridorSegs = [
    // South Central Road (Haji Mohsin -> Altapole)
    [0.0, -337.0, 58.7, -319.5, 30.0],
    [58.7, -319.5, 158.0, -296.0, 30.0],
    // Khan Jahan Ali Road (Royal More -> PTI More -> Babu Khan -> Kaborkhana -> Alia Approach)
    [-655.0, -254.0, -516.0, -168.0, 32.0],
    [-516.0, -168.0, -384.0, -90.0, 32.0],
    [-242.0, 30.0, -182.0, 93.0, 32.0],
    [-182.0, 93.0, -12.0, 107.0, 32.0],
    [-12.0, 107.0, 55.0, 145.0, 32.0],
  ];

  const tOx = TALTOLA_HOUSE_OFFSET.x;
  const tOz = TALTOLA_HOUSE_OFFSET.z;

  function isInHeroSafeZone(x, z, pad = 0) {
    // 1. Taltola House & Taltola Hospital Cross Rd
    if (x > tOx - 46 - pad && x < tOx + 54 + pad && z > tOz - 66 - pad && z < tOz + 68 + pad) return true;
    // 2. Haji Mohsin Road (North, Central & South)
    if (x > -48 - pad && x < 48 + pad && z > -354 - pad && z < 145 + pad) return true;
    // 3. Alia Madrasah & Khulna Model Mosque Campus
    if (x > 120 - pad && x < 270 + pad && z > 42 - pad && z < 252 + pad) return true;
    // 4. Altapole Lane, Enterable Houses, 6-Story Head Tower & Opposite Goli
    if (x > 134 - pad && x < 234 + pad && z > -532 - pad && z < -278 + pad) return true;
    // 5. Khulna Circuit House, Circuit House Maidan (.glb), Judge Court & District Stadium
    if (x > -78 - pad && x < 222 + pad && z > -944 - pad && z < -482 + pad) return true;
    // 6. Shaheed Hadis Park
    if (x > -394 - pad && x < -256 + pad && z > -972 - pad && z < -826 + pad) return true;
    // 7. PTI More, Govt. Coronation School & PTI Mosque
    if ((x + 304.3) ** 2 + (z + 56.7) ** 2 < (94 + pad) ** 2) return true;
    if (x > -348 - pad && x < -262 + pad && z > -156 - pad && z < 4 + pad) return true;
    // 8. Royal More & Hotel Royal International
    if ((x + 716.8) ** 2 + (z + 291.8) ** 2 < (112 + pad) ** 2) return true;
    // 9. Satrasta More
    if ((x + 920.0) ** 2 + (z + 292.0) ** 2 < (112 + pad) ** 2) return true;
    // 10. Rupsha Waterfront, Ferry Ghat & Khan Jahan Ali Bridge
    if (x > 1048 - pad) return true;

    // 11. Custom Corridor Polyline Buffers
    for (let i = 0; i < heroCorridorSegs.length; i++) {
      const [ax, az, bx, bz, rad] = heroCorridorSegs[i];
      if (pointToSegDistSq(x, z, ax, az, bx, bz) < (rad + pad) ** 2) return true;
    }

    // 12. Water bodies & City Green Parks/Fields
    if (isInWaterFn && isInWaterFn(x, z)) return true;
    for (let i = 0; i < greenPolys.length; i++) {
      const gp = greenPolys[i];
      if (x >= gp.minX - pad && x <= gp.maxX + pad && z >= gp.minZ - pad && z <= gp.maxZ + pad) {
        if (pointInFlatPoly(x, z, gp.flat)) return true;
      }
    }
    return false;
  }

  function queryRoadClearance(x, z) {
    const gx = Math.floor(x / roadCellSize);
    const gz = Math.floor(z / roadCellSize);
    const segs = roadGrid.get(`${gx},${gz}`);
    let minMargin = Infinity;
    let nearestMajorDistSq = Infinity;
    let nearestYaw = 0;
    if (segs) {
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        const dSq = pointToSegDistSq(x, z, s.ax, s.az, s.bx, s.bz);
        const dist = Math.sqrt(dSq);
        const margin = dist - s.hw;
        if (margin < minMargin) {
          minMargin = margin;
          nearestYaw = s.yaw;
        }
        if (s.roadType <= 2 && dSq < nearestMajorDistSq) {
          nearestMajorDistSq = dSq;
        }
      }
    }
    return { minMargin, nearestMajorDistSq, nearestYaw };
  }

  // Palette for Khulna plaster & glass buildings
  const resWallPalette = [
    0xf5efe4, // Warm cream
    0xebe2d0, // Sandstone beige
    0xe5d0c1, // Soft terracotta peach
    0xdce8e2, // Pale tropical mint
    0xe2e8f0, // Crisp modern white-grey
    0xf2e4ce, // Golden ochre cream
    0xdbeafe, // Cool sky-white apartment
  ];
  const glassTowerPalette = [
    0xdbeafe, // Sapphire curtain tint
    0xccfbf1, // Emerald-teal Thai glass tint
    0xe0f2fe, // Crisp sky-mirror glass tint
    0xe2e8f0, // Silver-blue corporate tower
  ];

  // Cache of built chunks: chunkKey -> { group, colliders }
  const chunkCache = new Map();
  const activeChunkKeys = new Set();
  let lastStreamKey = '';

  function buildChunk(ck) {
    const rawList = worldData.chunks?.[ck];
    const chunkGroup = new THREE.Group();
    chunkGroup.name = `KhulnaBldgChunk_${ck}`;
    chunkGroup.matrixAutoUpdate = false;

    const colliders = [];
    if (!rawList || !rawList.length) {
      return { group: chunkGroup, colliders };
    }

    const curtainGeos = [];
    const resGeos = [];
    const shopGeos = [];
    const trimGeos = [];
    const billboardGeos = [];
    const canopyGeos = [];

    const [cxIdx, czIdx] = ck.split(',').map(Number);
    const rnd = seeded(((cxIdx + 50) * 73856093) ^ ((czIdx + 50) * 19349663));
    const placedCenters = [];

    for (let i = 0; i < rawList.length; i++) {
      const item = rawList[i];
      const bx = item[0];
      const bz = item[1];
      let bw = Math.min(28, Math.max(6.2, item[2] * 0.90));
      let bd = Math.min(26, Math.max(6.2, item[3] * 0.90));
      let rot = item[4] || 0;
      const osmFloors = item[5] || 3;
      const osmStyle = item[6] || 1;

      const halfDiag = 0.5 * Math.hypot(bw, bd);
      if (isInHeroSafeZone(bx, bz, halfDiag + 1.5)) continue;

      const { minMargin, nearestMajorDistSq, nearestYaw } = queryRoadClearance(bx, bz);
      if (minMargin < 3.6) continue;

      // Shrink footprint if needed so building corners NEVER touch sidewalks or roads!
      const maxAllowedDiag = (minMargin - 0.6) * 2.0;
      if (halfDiag * 2.0 > maxAllowedDiag) {
        const shrink = maxAllowedDiag / (halfDiag * 2.0);
        if (shrink < 0.55) continue;
        bw *= shrink;
        bd *= shrink;
      }

      // Prevent overlapping neighbors inside chunk
      const minSep = 0.42 * (bw + bd);
      let overlapsNeighbor = false;
      for (let j = 0; j < placedCenters.length; j++) {
        const p = placedCenters[j];
        const dx = bx - p.x;
        const dz = bz - p.z;
        const req = (minSep + p.rad) * 0.68;
        if (dx * dx + dz * dz < req * req) {
          overlapsNeighbor = true;
          break;
        }
      }
      if (overlapsNeighbor) continue;
      placedCenters.push({ x: bx, z: bz, rad: minSep });

      // Align street-front buildings cleanly with nearest road when close to an avenue
      const nearAvenue = nearestMajorDistSq < 34 * 34;
      const inCommercialCore = (
        (bx > -880 && bx < 120 && bz > -880 && bz < -360) // Dakbangla, Picture Palace, KDA Ave, Moylapota
        || (bx > -650 && bx < -120 && bz > -340 && bz < 320) // Sonadanga, Nirala, Babu Khan
      );
      if (nearAvenue && rnd() < 0.65) {
        rot = nearestYaw;
      }

      // Determine authentic Khulna floor count & archetype
      let floors = osmFloors;
      if (nearAvenue && inCommercialCore) {
        floors = Math.max(floors, 4 + Math.floor(rnd() * 6)); // 4..9 story commercial avenues!
      } else if (nearAvenue) {
        floors = Math.max(floors, 3 + Math.floor(rnd() * 4)); // 3..6 story main road buildings
      } else {
        floors = Math.max(2, Math.min(7, floors + (rnd() > 0.62 ? 1 : 0)));
      }

      const floorH = 3.22;
      const plinthH = 0.36;
      const totalH = floors * floorH;

      // Choose Archetype:
      // 0 = Reflective Thai-Glass Curtain-Wall Commercial Tower / Hotel (like flyingcarsimulator.io & Khulna hotels)
      // 1 = Street-Front Commercial Shop Building + Reflective Upper Apartments/Offices
      // 2 = Khulna Mid-Rise Balcony Apartment with AC Units & Rooftop Water Tank
      let archetype = 2;
      if ((floors >= 5 && (nearAvenue || osmStyle >= 4) && rnd() < 0.48) || (floors >= 7 && rnd() < 0.72)) {
        archetype = 0;
      } else if (nearAvenue || (floors >= 3 && rnd() < 0.36)) {
        archetype = 1;
      }

      // Concrete foundation plinth
      pushColoredBox(trimGeos, bw + 0.36, plinthH, bd + 0.36, bx, plinthH * 0.5, bz, rot, 0x94a3b8);

      if (archetype === 0) {
        // --- ARCHETYPE 0: MODERN THAI-GLASS CURTAIN-WALL TOWER ---
        const glassTint = glassTowerPalette[Math.floor(rnd() * glassTowerPalette.length)];
        pushColoredBox(
          curtainGeos,
          bw,
          totalH,
          bd,
          bx,
          plinthH + totalH * 0.5,
          bz,
          rot,
          glassTint,
          1,
          floors * 0.25
        );

        // Corner ACP structural columns & architectural crown parapet
        const cosR = Math.cos(rot);
        const sinR = Math.sin(rot);
        for (const sx of [-1, 1]) {
          for (const sz of [-1, 1]) {
            const lx = sx * (bw * 0.5 - 0.18);
            const lz = sz * (bd * 0.5 - 0.18);
            const wx = bx + lx * cosR + lz * sinR;
            const wz = bz - lx * sinR + lz * cosR;
            pushColoredBox(trimGeos, 0.55, totalH + 0.6, 0.55, wx, plinthH + (totalH + 0.6) * 0.5, wz, rot, 0xe2e8f0);
          }
        }
        // Crown fascia band + elevator machine penthouse
        const roofY = plinthH + totalH;
        pushColoredBox(trimGeos, bw + 0.48, 0.68, bd + 0.48, bx, roofY + 0.34, bz, rot, 0xcbd5e1);
        pushColoredBox(trimGeos, bw * 0.38, 2.45, bd * 0.36, bx, roofY + 1.85, bz, rot, 0xdbe2ea);

        // Rooftop commercial billboard on tall avenue towers
        if (floors >= 6 && rnd() < 0.42) {
          const bbW = Math.min(9.5, bw * 0.72);
          const bbH = 2.8;
          const adHalf = rnd() < 0.5 ? 0.0 : 0.5;
          pushColoredBox(billboardGeos, bbW, bbH, 0.18, bx, roofY + 0.8 + bbH * 0.5, bz, rot, 0xffffff, 1, 1, adHalf, 0.5);
        }
      } else if (archetype === 1) {
        // --- ARCHETYPE 1: KHULNA GROUND-FLOOR BENGALI SHOPS + UPPER REFLECTIVE FLOORS ---
        const gfH = 3.55;
        const upperFloors = Math.max(1, floors - 1);
        const upperH = upperFloors * floorH;
        const wallCol = resWallPalette[Math.floor(rnd() * resWallPalette.length)];

        // Ground-floor retail shopfront
        pushColoredBox(shopGeos, bw, gfH, bd, bx, plinthH + gfH * 0.5, bz, rot, 0xffffff, 0.5, 1);

        // Protruding colorful retail awning canopy around street-facing sides
        const awnColors = [0xb91c1c, 0x047857, 0x1d4ed8, 0xc2410c];
        const awnCol = awnColors[Math.floor(rnd() * awnColors.length)];
        pushColoredBox(trimGeos, bw + 0.95, 0.22, bd + 0.95, bx, plinthH + gfH - 0.12, bz, rot, awnCol);

        // Upper reflective office / apartment stories
        pushColoredBox(
          resGeos,
          bw + 0.16,
          upperH,
          bd + 0.16,
          bx,
          plinthH + gfH + upperH * 0.5,
          bz,
          rot,
          wallCol,
          1,
          upperFloors * 0.25
        );

        const roofY = plinthH + gfH + upperH;
        pushColoredBox(trimGeos, bw + 0.42, 0.85, bd + 0.42, bx, roofY + 0.42, bz, rot, 0xe2e8f0);
        // Black cylindrical Gazi rooftop water tank
        pushColoredCyl(trimGeos, 0.68, 0.68, 1.45, 8, bx + bw * 0.18, roofY + 1.15, bz - bd * 0.16, 0x1e293b);
      } else {
        // --- ARCHETYPE 2: KHULNA MID-RISE BALCONY APARTMENT ---
        const wallCol = resWallPalette[Math.floor(rnd() * resWallPalette.length)];
        pushColoredBox(
          resGeos,
          bw,
          totalH,
          bd,
          bx,
          plinthH + totalH * 0.5,
          bz,
          rot,
          wallCol,
          1,
          floors * 0.25
        );

        const cosR = Math.cos(rot);
        const sinR = Math.sin(rot);
        const balW = Math.min(3.6, bw * 0.44);
        // Projecting front balconies + split-AC outdoor compressor boxes per upper floor!
        for (let f = 1; f < floors; f++) {
          const fy = plinthH + f * floorH;
          const lz = bd * 0.5 + 0.48;
          const wx = bx + lz * sinR;
          const wz = bz + lz * cosR;
          // Balcony floor slab & painted railing wall
          pushColoredBox(trimGeos, balW, 0.16, 1.02, wx, fy + 0.08, wz, rot, 0xe2e8f0);
          pushColoredBox(trimGeos, balW, 0.92, 0.12, bx + (lz + 0.44) * sinR, fy + 0.58, bz + (lz + 0.44) * cosR, rot, 0x94a3b8);

          // Exterior white Split-AC compressor unit mounted beside window
          if (f % 2 === 1 && bw > 8.0) {
            const acLx = bw * 0.34;
            const acLz = bd * 0.5 + 0.18;
            const acX = bx + acLx * cosR + acLz * sinR;
            const acZ = bz - acLx * sinR + acLz * cosR;
            pushColoredBox(trimGeos, 0.78, 0.54, 0.34, acX, fy + 2.05, acZ, rot, 0xf1f5f9);
          }
        }

        const roofY = plinthH + totalH;
        // Rooftop parapet wall, stair mumty room & black water tank
        pushColoredBox(trimGeos, bw + 0.34, 0.92, bd + 0.34, bx, roofY + 0.46, bz, rot, wallCol);
        pushColoredBox(trimGeos, Math.min(3.4, bw * 0.35), 2.35, Math.min(3.2, bd * 0.35), bx - bw * 0.15, roofY + 1.62, bz, rot, wallCol);
        pushColoredCyl(trimGeos, 0.65, 0.65, 1.42, 8, bx + bw * 0.20, roofY + 1.45, bz + bd * 0.15, 0x18222c);
      }

      // Register exact OBB collider for solid player & car collisions
      colliders.push({
        cx: bx,
        cz: bz,
        hw: bw * 0.5 + 0.18,
        hd: bd * 0.5 + 0.18,
        cosY: Math.cos(rot),
        sinY: Math.sin(rot),
        topY: plinthH + totalH + 1.0,
      });

      // Plant lush roadside shade tree in yard/verge next to ~28% of buildings when clear of roads!
      if (rnd() < 0.28) {
        const ang = rnd() * Math.PI * 2;
        const dist = halfDiag + 2.8 + rnd() * 2.5;
        const tx = bx + Math.cos(ang) * dist;
        const tz = bz + Math.sin(ang) * dist;
        if (!isInHeroSafeZone(tx, tz, 3.0)) {
          const rc = queryRoadClearance(tx, tz);
          if (rc.minMargin > 2.2) {
            const th = 6.2 + rnd() * 3.8;
            pushColoredCyl(trimGeos, 0.13, 0.24, th * 0.54, 6, tx, th * 0.27, tz, 0x5c4d3c);
            const crownCol = rnd() > 0.45 ? 0x3b7a33 : 0x2e6929;
            pushColoredCyl(canopyGeos, th * 0.18, th * 0.36, th * 0.48, 7, tx, th * 0.68, tz, crownCol);
            pushColoredCyl(canopyGeos, 0.08, th * 0.26, th * 0.34, 7, tx, th * 0.94, tz, 0x498c3e);
          }
        }
      }
    }

    const addMerged = (geos, mat, castShadow = true, receiveShadow = true) => {
      if (!geos.length) return;
      const merged = mergeGeometries(geos, false);
      for (let i = 0; i < geos.length; i++) geos[i].dispose();
      if (!merged) return;
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      chunkGroup.add(mesh);
    };

    addMerged(curtainGeos, curtainMat, true, true);
    addMerged(resGeos, residentialMat, true, true);
    addMerged(shopGeos, shopMat, true, true);
    addMerged(trimGeos, trimMat, true, true);
    addMerged(billboardGeos, billboardMat, false, false);
    addMerged(canopyGeos, canopyMat, true, true);

    chunkGroup.updateMatrix();
    return { group: chunkGroup, colliders };
  }

  function refreshActiveChunks(playerX, playerZ, qualityMode = 'high') {
    const cx = Math.floor(playerX / chunkSize);
    const cz = Math.floor(playerZ / chunkSize);
    const rad = qualityMode === 'low' ? 1 : 2;
    const maxDist = qualityMode === 'low' ? 280 : (qualityMode === 'medium' ? 380 : (qualityMode === 'high' ? 460 : 540));
    const maxDistSq = maxDist * maxDist;

    const streamKey = `${cx},${cz},${rad},${maxDist}`;
    if (streamKey === lastStreamKey) return;
    lastStreamKey = streamKey;

    const nextKeys = new Set();
    for (let dx = -rad; dx <= rad; dx++) {
      for (let dz = -rad; dz <= rad; dz++) {
        const ncx = cx + dx;
        const ncz = cz + dz;
        const centerDistSq = ((ncx + 0.5) * chunkSize - playerX) ** 2 + ((ncz + 0.5) * chunkSize - playerZ) ** 2;
        if (centerDistSq > maxDistSq + chunkSize * chunkSize * 0.75) continue;
        const ck = `${ncx},${ncz}`;
        if (!worldData.chunks?.[ck]) continue;
        nextKeys.add(ck);

        let entry = chunkCache.get(ck);
        if (!entry) {
          entry = buildChunk(ck);
          chunkCache.set(ck, entry);
        }
        if (!entry.group.parent) {
          rootGroup.add(entry.group);
        }
        entry.group.visible = true;
      }
    }

    for (const oldKey of activeChunkKeys) {
      if (!nextKeys.has(oldKey)) {
        const entry = chunkCache.get(oldKey);
        if (entry) entry.group.visible = false;
      }
    }
    activeChunkKeys.clear();
    for (const k of nextKeys) activeChunkKeys.add(k);
  }

  function resolveOBB(pos, radius, c) {
    const dx = pos.x - c.cx;
    const dz = pos.z - c.cz;
    if (Math.abs(dx) > c.hw + radius + 2 || Math.abs(dz) > c.hd + radius + 2) return;
    const lx = dx * c.cosY - dz * c.sinY;
    const lz = dx * c.sinY + dz * c.cosY;
    const clx = Math.max(-c.hw, Math.min(c.hw, lx));
    const clz = Math.max(-c.hd, Math.min(c.hd, lz));
    const ox = lx - clx;
    const oz = lz - clz;
    const d2 = ox * ox + oz * oz;
    if (d2 >= radius * radius) return;

    let px = 0;
    let pz = 0;
    if (d2 > 1e-8) {
      const dist = Math.sqrt(d2);
      const push = radius - dist;
      px = (ox / dist) * push;
      pz = (oz / dist) * push;
    } else {
      const penX = c.hw - Math.abs(lx);
      const penZ = c.hd - Math.abs(lz);
      if (penX < penZ) px = (lx >= 0 ? 1 : -1) * (penX + radius);
      else pz = (lz >= 0 ? 1 : -1) * (penZ + radius);
    }
    pos.x += px * c.cosY + pz * c.sinY;
    pos.z += -px * c.sinY + pz * c.cosY;
  }

  function applyBuildingCollisions(pos, radius = 0.4, footY = 0) {
    if (!rootGroup.visible) return;
    const cx = Math.floor(pos.x / chunkSize);
    const cz = Math.floor(pos.z / chunkSize);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const entry = chunkCache.get(`${cx + dx},${cz + dz}`);
        if (!entry || !entry.group.visible) continue;
        const cols = entry.colliders;
        for (let i = 0; i < cols.length; i++) {
          const c = cols[i];
          if (footY < c.topY) {
            resolveOBB(pos, radius, c);
          }
        }
      }
    }
  }

  function setNightFactor(nightFactor = 0) {
    const nf = THREE.MathUtils.clamp(nightFactor, 0, 1);
    shopMat.emissiveIntensity = 0.14 + nf * 0.92;
    billboardMat.emissiveIntensity = 0.18 + nf * 1.15;
  }

  function setQualityMode(qualityMode = 'high') {
    const isLow = qualityMode === 'low';
    const envMult = qualityMode === 'ultra' ? 2.15 : (qualityMode === 'high' ? 1.85 : (isLow ? 0.0 : 1.35));
    curtainMat.envMapIntensity = envMult;
    residentialMat.envMapIntensity = envMult * 0.86;
    shopMat.envMapIntensity = envMult * 0.76;
    lastStreamKey = ''; // Force chunk radius refresh on next update
  }

  return {
    group: rootGroup,
    refreshActiveChunks,
    applyBuildingCollisions,
    setNightFactor,
    setQualityMode,
    setVisible(v) {
      rootGroup.visible = v;
    },
  };
}
