import * as THREE from 'three';
import { box, cylinder, rodBetween, mergeStaticMeshes } from './scene-utils.js';
import { attachDerivedPBRMaps } from './aaa-shaders.js';
import { decorateCorridorPole, addBigNetaWallPoster } from './khulna-street-props.js';
import { buildCNGAuto, buildEasybike } from './khulna-vehicles.js';

/**
 * KHULNA KABORKHANA MORE · HAJI MOHSIN ROAD · SOUTH CENTRAL ROAD · ALTAPOLE LINK
 * (আলিয়া মাদ্রাসা খানজাহান আলী রোড ↔ কবরখানা মোড় ↔ হাজী মহসিন রোড ↔ সাউথ সেন্ট্রাল রোড ↔ আলতাপোল লেন)
 *
 * High-graphics, 60+ FPS open-world Khulna corridor featuring:
 *  1) Continuous Bangladeshi Pitch-Asphalt Roadway + Raised Walkable Red-Brick Footpaths (0.22m)
 *  2) Kaborkhana More (কবরখানা মোড়, x = -9.9, z = 111.2):
 *       - Roundabout Island, Directional Highway Gantry, Historic Kaborkhana Cemetery Wall & Arch Gate
 *       - Mosque #1: কবরখানা মোড় কেন্দ্রীয় জামে মসজিদ (Green Dome, Tall Minaret, Arched Windows)
 *       - Corner Commercial Plazas, Pharmacies, Bakeries & Tea Stalls
 *  3) Khan Jahan Ali Road (Kaborkhana More -> Khulna Alia Kamil Madrasah & Model Mosque):
 *       - Islamic Bookstores (ইসলামি কুতুবখানা), Hardware, Clinics, Restaurants & Model Mosque Approach
 *  4) Extended Haji Mohsin Road (South z = 42..111 & North z = -28..-337):
 *       - High-detail multi-story buildings & ground-floor shops on BOTH sides
 *       - Multiple realistic concrete side alleys (গলি) branching East & West with alley houses & wires
 *       - Mosque #2: বায়তুল আমান জামে মসজিদ (x = -15.5, z = -168) with Dome, Minaret & Marble Steps
 *  5) South Central Road (x = 0, z = -337 -> x = 157.4, z = -296.2) connecting straight into Altapole Lane:
 *       - T-Junction with directional gantry, lined with high-detail shops, coaching hubs, cafes & houses
 *
 * Performance: 3 spatial distance-culled slices + mergeStaticMeshes() + PBR derived maps (locked 60+ FPS).
 */

const FOOTPATH_H = 0.22;

function seeded(seed = 2026) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ============================================================================
 * HIGH-RES PROCEDURAL PBR TEXTURES
 * ========================================================================== */

function makePitchRoadTexture({ seedVal = 401, centerStripe = null, edgeStripe = null } = {}) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  ctx.fillStyle = '#25292e';
  ctx.fillRect(0, 0, S, S);

  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = rnd() > 0.45 ? 'rgba(18,20,24,0.34)' : 'rgba(54,58,64,0.20)';
    ctx.fillRect(36 + rnd() * (S - 72), rnd() * S, 24 + rnd() * 64, 20 + rnd() * 52);
  }
  for (const lx of [S * 0.25, S * 0.39, S * 0.61, S * 0.75]) {
    const g = ctx.createLinearGradient(lx - 24, 0, lx + 24, 0);
    g.addColorStop(0, 'rgba(14,16,20,0)');
    g.addColorStop(0.5, 'rgba(10,12,16,0.28)');
    g.addColorStop(1, 'rgba(14,16,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(lx - 24, 0, 48, S);
  }
  for (let i = 0; i < 5500; i++) {
    const v = 30 + Math.floor(rnd() * 44);
    ctx.fillStyle = `rgba(${v},${v + 1},${v + 3},${0.20 + rnd() * 0.26})`;
    const sz = 1.2 + rnd() * 2.2;
    ctx.fillRect(rnd() * S, rnd() * S, sz, sz);
  }
  const leftG = ctx.createLinearGradient(0, 0, 34, 0);
  leftG.addColorStop(0, 'rgba(116,102,82,0.52)');
  leftG.addColorStop(1, 'rgba(116,102,82,0)');
  ctx.fillStyle = leftG;
  ctx.fillRect(0, 0, 34, S);
  const rightG = ctx.createLinearGradient(S, 0, S - 34, 0);
  rightG.addColorStop(0, 'rgba(116,102,82,0.52)');
  rightG.addColorStop(1, 'rgba(116,102,82,0)');
  ctx.fillStyle = rightG;
  ctx.fillRect(S - 34, 0, 34, S);

  if (edgeStripe) {
    ctx.fillStyle = edgeStripe;
    ctx.fillRect(22, 0, 7, S);
    ctx.fillRect(S - 29, 0, 7, S);
  }
  if (centerStripe) {
    ctx.fillStyle = centerStripe;
    ctx.fillRect(S * 0.5 - 6, 28, 12, 168);
    ctx.fillRect(S * 0.5 - 6, 284, 12, 168);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeRedBrickFootpathTexture(seedVal = 409) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = '#4a3228';
  ctx.fillRect(0, 0, S, S);
  const rows = 8;
  const cols = 4;
  const bh = S / rows;
  const bw = S / cols;
  for (let r = 0; r < rows; r++) {
    const xOff = (r % 2) * (bw * 0.5);
    for (let col = -1; col <= cols; col++) {
      const bx = col * bw + xOff;
      const by = r * bh;
      const red = 156 + Math.floor(rnd() * 34);
      const grn = 54 + Math.floor(rnd() * 20);
      const blu = 40 + Math.floor(rnd() * 14);
      ctx.fillStyle = `rgb(${red},${grn},${blu})`;
      ctx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
      ctx.strokeStyle = 'rgba(255,200,170,0.16)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(bx + 3, by + 3, bw - 6, bh - 6);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function makePlasterTexture(baseHex, seedVal = 421, { brick = false, streak = 0.13 } = {}) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : `rgba(28,22,16,${0.03 + rnd() * 0.055})`;
    ctx.fillRect(rnd() * S, rnd() * S, 2 + rnd() * 4, 2 + rnd() * 4);
  }
  for (let i = 0; i < 28; i++) {
    const x = rnd() * S;
    const h = 24 + rnd() * 90;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgba(24,28,24,${streak})`);
    g.addColorStop(1, 'rgba(24,28,24,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 3 + rnd() * 6, h);
  }
  if (brick) {
    ctx.strokeStyle = 'rgba(24,16,12,0.25)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < S; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(S, y);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeCurbStripeTexture(c1 = '#facc15', c2 = '#18181b') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d');
  for (let x = 0; x < 256; x += 64) {
    ctx.fillStyle = (x / 64) % 2 === 0 ? c1 : c2;
    ctx.fillRect(x, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeShutterTexture(baseHex = '#566473') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 10) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(0, y, 256, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(0, y + 6, 256, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeSignTexture({
  title,
  subtitle = '',
  bg = '#0f3d2e',
  fg = '#ffffff',
  accent = '#fde047',
  border = '#ffffff',
  width = 640,
  height = 176,
}) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, 'rgba(255,255,255,0.16)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = border;
  ctx.lineWidth = 7;
  ctx.strokeRect(7, 7, width - 14, height - 14);
  ctx.fillStyle = accent;
  ctx.fillRect(16, 16, 10, height - 32);

  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 34px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText(title, 40, subtitle ? height * 0.39 : height * 0.5, width - 60);
  if (subtitle) {
    ctx.fillStyle = accent;
    ctx.font = '600 20px "Manrope", "Noto Sans Bengali", sans-serif';
    ctx.fillText(subtitle, 40, height * 0.72, width - 60);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function createCorridorBank(m) {
  const mkPlaster = (hex, seedVal, rough = 0.80, opts = {}) => {
    const tex = makePlasterTexture(hex, seedVal, opts);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: rough, metalness: 0.03, envMapIntensity: 0.65 });
    attachDerivedPBRMaps(mat, tex, { strength: opts.brick ? 2.1 : 1.5, roughBase: rough, normalScale: 0.60 });
    return mat;
  };

  const mkPitch = (opts, poly = -2) => {
    const tex = makePitchRoadTexture(opts);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.74,
      metalness: 0.06,
      envMapIntensity: 0.52,
      polygonOffset: true,
      polygonOffsetFactor: poly,
      polygonOffsetUnits: poly,
    });
    attachDerivedPBRMaps(mat, tex, { strength: 2.0, roughBase: 0.74, normalScale: 0.65 });
    return mat;
  };

  const pitchHighway = mkPitch({ seedVal: 401, centerStripe: 'rgba(250,204,21,0.88)', edgeStripe: 'rgba(241,245,249,0.75)' }, -2);
  const pitchRoad = mkPitch({ seedVal: 403, centerStripe: 'rgba(241,245,249,0.82)', edgeStripe: 'rgba(241,245,249,0.58)' }, -2);
  const pitchLane = mkPitch({ seedVal: 405, centerStripe: null, edgeStripe: null }, -2);
  const pitchJunction = mkPitch({ seedVal: 407, centerStripe: null, edgeStripe: null }, -3);
  pitchJunction.map.repeat.set(3.5, 3.5);

  const brickWalkTex = makeRedBrickFootpathTexture(409);
  const footpathMat = new THREE.MeshStandardMaterial({ map: brickWalkTex, roughness: 0.84, metalness: 0.02 });
  attachDerivedPBRMaps(footpathMat, brickWalkTex, { strength: 2.2, roughBase: 0.84, normalScale: 0.66 });

  const curbYB = makeCurbStripeTexture('#facc15', '#18181b');
  curbYB.repeat.set(6, 1);
  const curbRW = makeCurbStripeTexture('#dc2626', '#f8fafc');
  curbRW.repeat.set(6, 1);

  const shutterBlueTex = makeShutterTexture('#2e4c6d');
  const shutterGreyTex = makeShutterTexture('#586370');
  const shutterGreenTex = makeShutterTexture('#1f5a44');

  const bank = {
    pitchHighway,
    pitchRoad,
    pitchLane,
    pitchJunction,
    footpath: footpathMat,
    curbYellowBlack: new THREE.MeshStandardMaterial({ map: curbYB, roughness: 0.76 }),
    curbRedWhite: new THREE.MeshStandardMaterial({ map: curbRW, roughness: 0.76 }),
    roadLineWhite: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.78, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }),
    shutterBlue: new THREE.MeshStandardMaterial({ map: shutterBlueTex, roughness: 0.48, metalness: 0.56 }),
    shutterGrey: new THREE.MeshStandardMaterial({ map: shutterGreyTex, roughness: 0.50, metalness: 0.54 }),
    shutterGreen: new THREE.MeshStandardMaterial({ map: shutterGreenTex, roughness: 0.48, metalness: 0.56 }),
    concrete: m.concrete || mkPlaster('#a7a59d', 411, 0.86),
    darkConcrete: m.darkConcrete || mkPlaster('#4c5054', 412, 0.88),
    brick: m.brick || mkPlaster('#9e4736', 413, 0.86, { brick: true }),
    creamWall: mkPlaster('#f2e8d4', 421, 0.78),
    sandWall: mkPlaster('#dec7a4', 422, 0.80),
    terracottaWall: mkPlaster('#b34c38', 423, 0.82, { brick: true }),
    ochreWall: mkPlaster('#d2a264', 424, 0.80),
    paleBlueWall: mkPlaster('#bfd4e8', 425, 0.76),
    mintWall: mkPlaster('#b7d3c6', 426, 0.78),
    whiteWall: mkPlaster('#eff2f5', 427, 0.72),
    peachWall: mkPlaster('#e4c0ad', 428, 0.78),
    slateTrim: mkPlaster('#334155', 429, 0.62),
    marbleWhite: new THREE.MeshPhysicalMaterial({ color: 0xf6f4ee, roughness: 0.22, metalness: 0.04, clearcoat: 0.72 }),
    mosqueGreen: new THREE.MeshPhysicalMaterial({ color: 0x0f6b47, roughness: 0.34, metalness: 0.14, clearcoat: 0.65 }),
    mosqueEmerald: new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.52, metalness: 0.12 }),
    goldMat: new THREE.MeshPhysicalMaterial({ color: 0xf5b82e, roughness: 0.22, metalness: 0.86, clearcoat: 0.65 }),
    aluminum: new THREE.MeshStandardMaterial({ color: 0xd1dae2, roughness: 0.24, metalness: 0.88 }),
    steelDark: new THREE.MeshStandardMaterial({ color: 0x1e252c, roughness: 0.44, metalness: 0.74 }),
    teakWood: new THREE.MeshStandardMaterial({ color: 0x764320, roughness: 0.72 }),
    awningGreen: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.62 }),
    awningBlue: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.62 }),
    awningRed: new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.62 }),
    awningOrange: new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.64 }),
    glassCurtain: new THREE.MeshPhysicalMaterial({ color: 0x163d57, roughness: 0.08, metalness: 0.22, clearcoat: 0.92 }),
    glassShop: new THREE.MeshPhysicalMaterial({ color: 0x22516e, roughness: 0.08, metalness: 0.16, clearcoat: 0.90 }),
    acBox: mkPlaster('#e2e6ea', 491, 0.48, { streak: 0.03 }),
    waterTank: new THREE.MeshPhysicalMaterial({ color: 0x12181f, roughness: 0.40, clearcoat: 0.35 }),
    grassTurf: new THREE.MeshStandardMaterial({ color: 0x357a38, roughness: 0.94 }),
    flowerRed: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.82 }),
    flowerGold: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.82 }),
    tireBlack: new THREE.MeshStandardMaterial({ color: 0x17191c, roughness: 0.88 }),
    wireMat: m.wire || new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 }),
    warmWindowLit: new THREE.MeshStandardMaterial({ color: 0xffebb8, emissive: 0xffcf70, emissiveIntensity: 0.24, roughness: 0.24 }),
    coolWindowLit: new THREE.MeshStandardMaterial({ color: 0xe0f2fe, emissive: 0x7dd3fc, emissiveIntensity: 0.22, roughness: 0.24 }),
    lampGlow: new THREE.MeshStandardMaterial({ color: 0xfff8e6, emissive: 0xffd98a, emissiveIntensity: 0.80 }),
    emissiveList: [],
  };

  bank.emissiveList.push(
    { mat: bank.warmWindowLit, day: 0.20, night: 1.85 },
    { mat: bank.coolWindowLit, day: 0.18, night: 1.60 },
    { mat: bank.lampGlow, day: 0.65, night: 3.20 },
  );

  return bank;
}

/* ============================================================================
 * PHYSICS REGISTRY (WALKABLE RAISED FOOTPATHS + SOLID BUILDING COLLISIONS)
 * ========================================================================== */

function createCorridorPhysics() {
  const circles = [];
  const obbs = [];
  const slabs = [];

  function addCircle(x, z, r, maxH = 12.0) {
    circles.push({ x, z, r, maxH });
  }
  function addOBB(cx, cz, width, depth, rotY = 0, maxH = 24.0) {
    obbs.push({ cx, cz, hx: width * 0.5, hz: depth * 0.5, cos: Math.cos(rotY), sin: Math.sin(rotY), maxH });
  }
  function addWalkableSlab(cx, cz, width, depth, rotY = 0, topY = FOOTPATH_H) {
    slabs.push({ cx, cz, hx: width * 0.5, hz: depth * 0.5, cos: Math.cos(rotY), sin: Math.sin(rotY), topY });
  }

  function getGroundHeight(pos) {
    if (!pos) return 0.0;
    if (pos.x < -75 || pos.x > 220 || pos.z < -390 || pos.z > 235) return 0.0;
    let bestY = 0.0;
    for (let i = 0; i < slabs.length; i++) {
      const s = slabs[i];
      const dx = pos.x - s.cx;
      const dz = pos.z - s.cz;
      if (Math.abs(dx) > s.hx + s.hz + 2 || Math.abs(dz) > s.hx + s.hz + 2) continue;
      const lx = dx * s.cos - dz * s.sin;
      const lz = dx * s.sin + dz * s.cos;
      if (Math.abs(lx) <= s.hx + 0.14 && Math.abs(lz) <= s.hz + 0.14) {
        if (s.topY > bestY) bestY = s.topY;
      }
    }
    return bestY;
  }

  function resolveOBB(pos, radius, footY, b) {
    if (footY >= b.maxH) return;
    const dx = pos.x - b.cx;
    const dz = pos.z - b.cz;
    const maxE = b.hx + b.hz + radius + 0.5;
    if (Math.abs(dx) > maxE || Math.abs(dz) > maxE) return;
    let lx = dx * b.cos - dz * b.sin;
    let lz = dx * b.sin + dz * b.cos;
    const clx = THREE.MathUtils.clamp(lx, -b.hx, b.hx);
    const clz = THREE.MathUtils.clamp(lz, -b.hz, b.hz);
    const rx = lx - clx;
    const rz = lz - clz;
    const dSq = rx * rx + rz * rz;
    if (dSq < radius * radius) {
      if (dSq > 1e-8) {
        const d = Math.sqrt(dSq);
        const push = radius - d;
        lx += (rx / d) * push;
        lz += (rz / d) * push;
      } else {
        const px = b.hx - Math.abs(lx);
        const pz = b.hz - Math.abs(lz);
        if (px < pz) lx = lx >= 0 ? (b.hx + radius) : -(b.hx + radius);
        else lz = lz >= 0 ? (b.hz + radius) : -(b.hz + radius);
      }
      pos.x = b.cx + lx * b.cos + lz * b.sin;
      pos.z = b.cz - lx * b.sin + lz * b.cos;
    }
  }

  function applyCollisions(pos, radius = 0.34, footY = 0) {
    if (!pos) return;
    if (pos.x < -75 || pos.x > 220 || pos.z < -390 || pos.z > 235) return;
    for (let i = 0; i < circles.length; i++) {
      const c = circles[i];
      if (footY >= c.maxH) continue;
      const dx = pos.x - c.x;
      const dz = pos.z - c.z;
      const minD = c.r + radius;
      const dSq = dx * dx + dz * dz;
      if (dSq < minD * minD) {
        const d = Math.sqrt(dSq);
        if (d > 1e-5) {
          pos.x += (dx / d) * (minD - d);
          pos.z += (dz / d) * (minD - d);
        } else {
          pos.x += minD;
        }
      }
    }
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < obbs.length; i++) {
        resolveOBB(pos, radius, footY, obbs[i]);
      }
    }
  }

  return { addCircle, addOBB, addWalkableSlab, getGroundHeight, applyCollisions };
}

/* ============================================================================
 * REUSABLE HIGH-DETAIL ROAD, FOOTPATH, SHOP-BUILDING, ALLEY & MOSQUE BUILDERS
 * ========================================================================== */

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
    roughness: 0.28,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });
  bank.emissiveList.push({ mat, day: 0.34, night: 1.50 });
  const grp = new THREE.Group();
  grp.position.set(pos[0], pos[1], pos[2]);
  grp.rotation.y = rotY;
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.12), bank.steelDark);
  const face = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.145), mat);
  grp.add(bezel, face);
  dynamicG.add(grp);
  return grp;
}

function addPitchRoadAlongPolyline(staticG, pts, roadHalfW, mat, yTop = 0.060) {
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
    const vCoord = distAcc * 0.11;
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

function addSidewalkAlongPolyline(staticG, bank, phys, pts, roadHalfW, sideSign, {
  walkWidth = 1.75,
  curbMat = bank.curbYellowBlack,
} = {}) {
  const offset = roadHalfW + walkWidth * 0.5 + 0.08;
  const curbOffset = roadHalfW + 0.10;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const segLen = Math.hypot(dx, dz);
    if (segLen < 0.5) continue;
    const yaw = Math.atan2(dx, dz);
    const perpX = dz / segLen;
    const perpZ = -dx / segLen;
    const mx = (x0 + x1) * 0.5;
    const mz = (z0 + z1) * 0.5;
    const sx = mx + perpX * sideSign * offset;
    const sz = mz + perpZ * sideSign * offset;
    const segH = FOOTPATH_H + (i % 2) * 0.002;
    addRotBox(staticG, [walkWidth, segH, segLen + 0.35], [sx, segH * 0.5, sz], bank.footpath, yaw, {
      castShadow: false,
      uvScale: 1.6,
    });
    phys.addWalkableSlab(sx, sz, walkWidth + 0.35, segLen + 0.45, yaw, FOOTPATH_H);
    addRotBox(
      staticG,
      [0.22, segH + 0.02, segLen + 0.38],
      [mx + perpX * sideSign * curbOffset, (segH + 0.02) * 0.5, mz + perpZ * sideSign * curbOffset],
      curbMat,
      yaw,
      { castShadow: false },
    );
  }
}

function addZebraCrosswalk(parent, bank, cx, cz, yaw, roadWidth = 7.6) {
  const grp = new THREE.Group();
  grp.position.set(cx, 0.086, cz);
  grp.rotation.y = yaw;
  const count = Math.floor(roadWidth / 0.88);
  const start = -((count - 1) * 0.88) * 0.5;
  for (let i = 0; i < count; i++) {
    box(grp, [0.42, 0.012, 2.15], [start + i * 0.88, 0, 0], bank.roadLineWhite, { castShadow: false });
  }
  parent.add(grp);
}

function addStreetLamp(staticG, dynamicG, bank, phys, x, z, rotY = 0) {
  phys.addCircle(x, z, 0.20, 7.0);
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  cylinder(g, 0.085, 0.13, 6.8, [0, 3.4, 0], bank.aluminum, 8);
  cylinder(g, 0.18, 0.22, 0.30, [0, 0.15, 0], bank.darkConcrete, 8);
  box(g, [1.35, 0.06, 0.08], [0.68, 6.68, 0], bank.aluminum);
  box(g, [0.42, 0.09, 0.18], [1.30, 6.74, 0], bank.steelDark);
  staticG.add(g);
  const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.14), bank.lampGlow);
  bulb.position.set(x + Math.cos(rotY) * 1.30, 6.68, z - Math.sin(rotY) * 1.30);
  bulb.rotation.y = rotY;
  dynamicG.add(bulb);
}

/**
 * High-Detail Bangladeshi Multi-Story Commercial + Residential Building
 * with ground-floor shops (glass fronts, roller shutters, colorful awnings, backlit Bengali signboards),
 * upper-floor balconies, window chajjas, AC outdoor units, rooftop parapets, mumty & water tanks!
 */
function addDetailedShopBuilding(staticG, dynamicG, bank, phys, {
  cx, cz, rotY = 0, w = 14.5, d = 9.5, floors = 4,
  wallMat, trimMat, accentMat, awningMat, shutterMat,
  signTitle, signSub, signBg = '#064e3b', upperSign = null,
  seed = 501,
}) {
  const rnd = seeded(seed);
  const gfH = 3.65;
  const flH = 3.0;
  const totalH = FOOTPATH_H + gfH + (floors - 1) * flH;

  phys.addOBB(cx, cz, w, d, rotY, totalH + 1.5);

  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = rotY;
  staticG.add(g);

  const dg = new THREE.Group();
  dg.position.set(cx, 0, cz);
  dg.rotation.y = rotY;
  dynamicG.add(dg);

  // Ground-floor shop base & storefront bays (facing +Z locally)
  box(g, [w + 0.35, FOOTPATH_H, d + 0.65], [0, FOOTPATH_H * 0.5, 0.2], bank.concrete, { castShadow: false });
  box(g, [w, gfH, d], [0, FOOTPATH_H + gfH * 0.5, 0], wallMat, { uvScale: 2.8 });

  const shopBays = Math.max(2, Math.floor(w / 3.4));
  const bayW = (w - 0.6) / shopBays;
  const sMat = shutterMat || bank.shutterGrey;
  for (let i = 0; i < shopBays; i++) {
    const bx = -(w - 0.6) * 0.5 + (i + 0.5) * bayW;
    const isGlassBay = i === Math.floor(shopBays * 0.5);
    // Concrete structural column between shops
    box(g, [0.28, gfH, 0.34], [bx - bayW * 0.5, FOOTPATH_H + gfH * 0.5, d * 0.5], trimMat);
    if (isGlassBay) {
      // Modern Illuminated Glass-Front Shop / Pharmacy / Clinic Bay
      box(g, [bayW - 0.28, 0.72, 0.18], [bx, FOOTPATH_H + 0.36, d * 0.5 + 0.02], accentMat);
      box(dg, [bayW - 0.30, 1.95, 0.14], [bx, FOOTPATH_H + 1.70, d * 0.5 + 0.03], bank.warmWindowLit, { castShadow: false });
      box(g, [bayW - 0.24, 0.08, 0.24], [bx, FOOTPATH_H + 2.70, d * 0.5 + 0.04], bank.aluminum);
    } else {
      // Authentic Corrugated Roller Shutter Shop Bay (half or full closed)
      box(g, [bayW - 0.28, 2.55, 0.14], [bx, FOOTPATH_H + 1.32, d * 0.5 + 0.04], sMat);
      box(g, [bayW - 0.20, 0.18, 0.24], [bx, FOOTPATH_H + 2.66, d * 0.5 + 0.08], bank.steelDark);
    }
  }
  box(g, [0.28, gfH, 0.34], [(w - 0.6) * 0.5, FOOTPATH_H + gfH * 0.5, d * 0.5], trimMat);

  // Slanted Shopfront Awning Canopy + Cornice Band
  box(g, [w + 0.25, 0.14, 1.25], [0, FOOTPATH_H + 2.86, d * 0.5 + 0.52], awningMat || bank.awningGreen);
  box(g, [w + 0.45, 0.24, d + 0.45], [0, FOOTPATH_H + gfH + 0.12, 0], trimMat);

  // Upper Floors + Balconies + Windows + Sunshades + AC Outdoor Units
  const upperH = (floors - 1) * flH;
  if (upperH > 0) {
    box(g, [w, upperH, d], [0, FOOTPATH_H + gfH + 0.24 + upperH * 0.5, 0], wallMat, { uvScale: 3.0 });
    const uBays = Math.max(3, Math.floor(w / 3.6));
    const uBayW = w / uBays;
    for (let f = 1; f < floors; f++) {
      const fy = FOOTPATH_H + gfH + 0.24 + (f - 1) * flH;
      box(g, [w + 0.36, 0.18, d + 0.36], [0, fy + flH, 0], trimMat);
      for (let b = 0; b < uBays; b++) {
        const bx = -w * 0.5 + (b + 0.5) * uBayW;
        const lit = rnd() > 0.44;
        const winM = lit ? (rnd() > 0.4 ? bank.warmWindowLit : bank.coolWindowLit) : bank.glassCurtain;
        box(lit ? dg : g, [uBayW * 0.60, 1.54, 0.14], [bx, fy + 1.48, d * 0.5 + 0.04], winM, { castShadow: false });
        if ((b + f) % 2 === 0) {
          // Cantilevered Residential Balcony + Parapet + Iron Rail
          box(g, [uBayW * 0.78, 0.15, 0.85], [bx, fy + 0.12, d * 0.5 + 0.38], trimMat);
          box(g, [uBayW * 0.78, 0.72, 0.12], [bx, fy + 0.50, d * 0.5 + 0.78], accentMat);
          box(g, [uBayW * 0.78, 0.06, 0.06], [bx, fy + 0.94, d * 0.5 + 0.78], bank.steelDark);
        } else {
          // Window Sunshade (Chajja) + Split AC Outdoor Box
          box(g, [uBayW * 0.68, 0.12, 0.34], [bx, fy + 2.32, d * 0.5 + 0.16], trimMat);
          if (rnd() > 0.45) {
            box(g, [0.66, 0.44, 0.28], [bx + uBayW * 0.20, fy + 0.46, d * 0.5 + 0.16], bank.acBox);
          }
        }
        // Rear windows
        box(g, [uBayW * 0.52, 1.45, 0.12], [bx, fy + 1.48, -d * 0.5 - 0.04], bank.glassCurtain, { castShadow: false });
      }
    }
  }

  // Rooftop Parapet, Stair Mumty & Black Gazi Water Tank
  box(g, [w + 0.24, 0.88, 0.22], [0, totalH + 0.44, d * 0.5], accentMat);
  box(g, [w + 0.24, 0.88, 0.22], [0, totalH + 0.44, -d * 0.5], accentMat);
  box(g, [0.22, 0.88, d], [-w * 0.5, totalH + 0.44, 0], accentMat);
  box(g, [0.22, 0.88, d], [w * 0.5, totalH + 0.44, 0], accentMat);
  box(g, [2.8, 2.05, 3.0], [-w * 0.16, totalH + 1.02, 0], trimMat);
  cylinder(g, 0.56, 0.60, 1.25, [w * 0.22, totalH + 1.0, -0.7], bank.waterTank, 10);

  if (signTitle) {
    addSignBox(
      dg,
      bank,
      { title: signTitle, subtitle: signSub, bg: signBg, accent: '#fde047', width: 600 },
      [0, FOOTPATH_H + 3.42, d * 0.5 + 0.24],
      0,
      Math.min(w - 0.9, 10.4),
      1.04,
    );
  }
  if (upperSign && floors >= 3) {
    addSignBox(
      dg,
      bank,
      upperSign,
      [0, FOOTPATH_H + gfH + 2.95, d * 0.5 + 0.30],
      0,
      Math.min(w - 1.4, 8.8),
      1.12,
    );
  }
}

/**
 * Builds a Realistic Khulna Side Alley (গলি) branching off Haji Mohsin Road or South Central Road
 * with concrete lane paving, boundary walls, small neighborhood houses & overhanging wire!
 */
function addSideAlley(staticG, dynamicG, bank, phys, {
  x0, z0, dirX, dirZ, len = 24.0, width = 3.6, nameBn = 'আবাসিক গলি',
}) {
  const yaw = Math.atan2(dirX, dirZ);
  const mx = x0 + dirX * (len * 0.5);
  const mz = z0 + dirZ * (len * 0.5);
  const perpX = dirZ;
  const perpZ = -dirX;

  // Paved Concrete Alley Surface
  addRotBox(staticG, [width, 0.08, len], [mx, 0.04, mz], bank.concrete, yaw, { castShadow: false, uvScale: 2.5 });

  // Low weathered boundary walls + small alley houses flanking the lane
  for (const side of [-1, 1]) {
    const wx = mx + perpX * side * (width * 0.5 + 0.22);
    const wz = mz + perpZ * side * (width * 0.5 + 0.22);
    addRotBox(staticG, [0.28, 1.85, len - 2.0], [wx, 0.925, wz], side > 0 ? bank.creamWall : bank.brick, yaw);
    phys.addOBB(wx, wz, 0.36, len - 2.0, yaw, 2.0);

    // 2-Story Inner Alley House set back down the lane
    const hx = x0 + dirX * (len * 0.62) + perpX * side * (width * 0.5 + 3.8);
    const hz = z0 + dirZ * (len * 0.62) + perpZ * side * (width * 0.5 + 3.8);
    addRotBox(staticG, [6.2, 6.4, 8.5], [hx, 3.2, hz], side > 0 ? bank.mintWall : bank.peachWall, yaw);
    addRotBox(staticG, [6.6, 0.28, 8.9], [hx, 6.5, hz], bank.terracottaWall, yaw);
    phys.addOBB(hx, hz, 6.2, 8.5, yaw, 7.0);
  }

  // Alley Entrance Nameplate Sign on Pole
  const sx = x0 + dirX * 2.5 + perpX * (width * 0.5 + 0.35);
  const sz = z0 + dirZ * 2.5 + perpZ * (width * 0.5 + 0.35);
  cylinder(staticG, 0.055, 0.07, 3.6, [sx, 1.8, sz], bank.steelDark, 6);
  addSignBox(
    dynamicG,
    bank,
    { title: nameBn, subtitle: 'হাজী মহসিন রোড শাখা গলি · খুলনা', bg: '#1e3a8a', fg: '#ffffff', accent: '#fde047', width: 460, height: 140 },
    [sx, 3.35, sz],
    yaw + Math.PI * 0.5,
    2.2,
    0.66,
  );
}

/**
 * Builds a High-Detail 3-Story Bangladeshi Neighborhood Mosque (জামে মসজিদ)
 * with marble entry steps, green dome + golden crescent finial, tall minaret with loudspeakers,
 * arched green-tinted windows, illuminated calligraphy fascia & courtyard lamps!
 */
function addNeighborhoodMosque(staticG, dynamicG, bank, phys, {
  cx, cz, rotY = 0, w = 15.0, d = 13.0, title, subtitle,
}) {
  const H = 9.4;
  phys.addOBB(cx, cz, w, d, rotY, H + 5);

  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = rotY;
  staticG.add(g);

  const dg = new THREE.Group();
  dg.position.set(cx, 0, cz);
  dg.rotation.y = rotY;
  dynamicG.add(dg);

  // White Marble Plinth & Wide Front Steps (facing +Z locally)
  box(g, [w + 1.4, 0.50, d + 1.4], [0, 0.25, 0], bank.marbleWhite);
  box(g, [5.6, 0.18, 1.6], [0, 0.09, d * 0.5 + 1.2], bank.marbleWhite);
  box(g, [5.6, 0.34, 0.9], [0, 0.17, d * 0.5 + 0.8], bank.marbleWhite);

  // 3-Story White Marble & Emerald-Green Main Mosque Structure
  box(g, [w, H, d], [0, 0.50 + H * 0.5, 0], bank.marbleWhite, { uvScale: 3.0 });
  box(g, [w + 0.55, 0.42, d + 0.55], [0, 0.50 + H + 0.21, 0], bank.mosqueGreen);
  // Decorative Roof Parapet & Corner Pinnacles
  box(g, [w + 0.3, 0.95, 0.24], [0, 0.50 + H + 0.85, d * 0.5], bank.marbleWhite);
  box(g, [w + 0.3, 0.95, 0.24], [0, 0.50 + H + 0.85, -d * 0.5], bank.marbleWhite);
  for (const sx of [-w * 0.5, w * 0.5]) {
    for (const sz of [-d * 0.5, d * 0.5]) {
      cylinder(g, 0.26, 0.32, 1.85, [sx, 0.50 + H + 1.1, sz], bank.mosqueGreen, 10);
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), bank.goldMat);
      finial.position.set(sx, 0.50 + H + 2.1, sz);
      g.add(finial);
    }
  }

  // Grand Emerald Central Dome + Golden Crescent Finial
  cylinder(g, 3.85, 3.95, 1.15, [0, 0.50 + H + 0.95, 0], bank.marbleWhite, 22);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(3.8, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.54), bank.mosqueGreen);
  dome.position.set(0, 0.50 + H + 1.50, 0);
  g.add(dome);
  cylinder(g, 0.055, 0.08, 1.85, [0, 0.50 + H + 6.1, 0], bank.goldMat, 8);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), bank.goldMat);
  orb.position.set(0, 0.50 + H + 5.7, 0);
  g.add(orb);

  // Tall 21m Corner Minaret with Balcony Gallery, Green Dome Cap & Loudspeakers
  const minX = w * 0.5 - 1.1;
  const minZ = d * 0.5 - 1.1;
  cylinder(g, 0.92, 1.15, 19.5, [minX, 9.75, minZ], bank.marbleWhite, 14);
  cylinder(g, 1.42, 1.38, 0.42, [minX, 14.5, minZ], bank.mosqueGreen, 14);
  cylinder(g, 1.36, 1.32, 0.38, [minX, 18.2, minZ], bank.mosqueGreen, 14);
  const minDome = new THREE.Mesh(new THREE.SphereGeometry(0.95, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), bank.mosqueGreen);
  minDome.position.set(minX, 19.5, minZ);
  g.add(minDome);
  cylinder(g, 0.04, 0.06, 1.5, [minX, 21.1, minZ], bank.goldMat, 6);

  // Arched Facade Windows & Illuminated Central Entrance Portal
  box(g, [3.2, 3.0, 0.24], [0, 2.0, d * 0.5 + 0.04], bank.mosqueEmerald);
  box(g, [3.5, 0.24, 0.34], [0, 3.55, d * 0.5 + 0.08], bank.goldMat);
  for (let f = 0; f < 3; f++) {
    const fy = 1.9 + f * 3.0;
    for (const wx of [-4.8, -2.4, 2.4, 4.8]) {
      box(dg, [1.35, 1.95, 0.14], [wx, fy, d * 0.5 + 0.05], f === 0 ? bank.warmWindowLit : bank.coolWindowLit, { castShadow: false });
      box(g, [1.55, 0.16, 0.22], [wx, fy + 1.05, d * 0.5 + 0.06], bank.mosqueGreen);
    }
  }

  addSignBox(
    dg,
    bank,
    { title, subtitle, bg: '#064e3b', fg: '#ffffff', accent: '#fde047', border: '#fde047', width: 640 },
    [0, 4.25, d * 0.5 + 0.28],
    0,
    9.2,
    1.22,
  );
}

/* ============================================================================
 * SLICE 1: KABORKHANA MORE & KHAN JAHAN ALI ROAD (TO ALIA MADRASAH)
 * ========================================================================== */

function buildKaborkhanaMoreAndKhanJahanAli(staticG, dynamicG, bank, phys) {
  const KX = -9.9;
  const KZ = 111.2;

  // 1) Elevated Bangladeshi Pitch-Asphalt Junction Apron at Kaborkhana More
  const jDisc = new THREE.Mesh(new THREE.CylinderGeometry(14.5, 14.8, 0.04, 40), bank.pitchJunction);
  jDisc.position.set(KX, 0.056, KZ);
  jDisc.receiveShadow = true;
  staticG.add(jDisc);

  // Central Kaborkhana More Traffic Island (radius 2.75m — 100% SOLID!)
  phys.addCircle(KX, KZ, 2.90, 6.5);
  cylinder(staticG, 2.75, 2.90, 0.28, [KX, 0.18, KZ], bank.curbYellowBlack, 22);
  cylinder(staticG, 2.45, 2.55, 0.36, [KX, 0.24, KZ], bank.marbleWhite, 22);
  cylinder(staticG, 2.05, 2.15, 0.44, [KX, 0.30, KZ], bank.grassTurf, 18);
  cylinder(staticG, 0.65, 0.85, 1.35, [KX, 1.12, KZ], bank.mosqueGreen, 8);
  cylinder(staticG, 0.16, 0.22, 3.8, [KX, 3.65, KZ], bank.steelDark, 8);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const gx = KX + Math.cos(a) * 0.82;
    const gz = KZ + Math.sin(a) * 0.82;
    rodBetween(staticG, [KX, 5.2, KZ], [gx, 5.45, gz], 0.035, bank.steelDark, 6);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.20, 10, 8), bank.lampGlow);
    globe.position.set(gx, 5.60, gz);
    dynamicG.add(globe);
  }
  const topOrb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), bank.goldMat);
  topOrb.position.set(KX, 5.78, KZ);
  staticG.add(topOrb);

  // 2) Khan Jahan Ali Road from Kaborkhana More (-9.9, 111.2) -> Khulna Alia Kamil Madrasah & Model Mosque (166, 206)!
  const kjaToAliaPts = [
    [-9.9, 111.2],
    [49.3, 144.2],
    [102.8, 174.1],
    [140.0, 194.9],
    [166.0, 208.0],
  ];
  addPitchRoadAlongPolyline(staticG, kjaToAliaPts, 5.8, bank.pitchHighway, 0.054);
  addSidewalkAlongPolyline(staticG, bank, phys, kjaToAliaPts, 5.6, 1, { walkWidth: 1.85, curbMat: bank.curbYellowBlack });
  addSidewalkAlongPolyline(staticG, bank, phys, kjaToAliaPts, 5.6, -1, { walkWidth: 1.85, curbMat: bank.curbYellowBlack });

  // Internal Alia Madrasah concrete roads & dusty brick walkways are built exclusively in alia-campus-blockout.js
  // (Removed legacy black-asphalt aliaLinkPts & gateRoadPts that were cutting across the Madrasah playground & ponds!)

  // 3) Overhead Directional Highway Gantry at Kaborkhana More
  const kjaYaw = Math.atan2(49.3 - -9.9, 144.2 - 111.2);
  const gx = 8.0;
  const gz = 121.2;
  const pX = Math.cos(kjaYaw);
  const pZ = -Math.sin(kjaYaw);
  for (const side of [-6.8, 6.8]) {
    cylinder(staticG, 0.20, 0.25, 6.5, [gx + pX * side, 3.25, gz + pZ * side], bank.steelDark, 10);
    phys.addCircle(gx + pX * side, gz + pZ * side, 0.26, 6.5);
  }
  addRotBox(staticG, [14.2, 0.34, 0.38], [gx, 6.22, gz], bank.steelDark, kjaYaw);
  addSignBox(
    dynamicG,
    bank,
    {
      title: 'কবরখানা মোড় (KABORKHANA MORE) · খুলনা',
      subtitle: '← পিটিআই মোড় / রয়্যাল মোড়  |  ↑ হাজী মহসিন রোড / সাউথ সেন্ট্রাল রোড  |  → আলিয়া মাদ্রাসা / মডেল মসজিদ',
      bg: '#065f46',
      accent: '#fef08a',
      width: 720,
      height: 176,
    },
    [gx, 6.50, gz],
    kjaYaw,
    9.6,
    1.78,
  );
  addZebraCrosswalk(staticG, bank, -7.5, 96.5, 0.14, 7.6);
  addZebraCrosswalk(staticG, bank, 4.0, 119.0, kjaYaw, 10.6);

  // 4) HISTORIC KHULNA KABORKHANA CEMETERY WALL & ARCH GATE (South-West Corner of Kaborkhana More)
  const cemX = -22.0;
  const cemZ = 126.5;
  box(staticG, [24.0, 2.25, 0.42], [cemX, 1.125, cemZ - 6.5], bank.creamWall);
  box(staticG, [24.4, 0.20, 0.54], [cemX, 2.30, cemZ - 6.5], bank.mosqueGreen);
  phys.addOBB(cemX, cemZ - 6.5, 24.0, 0.55, 0, 2.5);
  // Ornate Cemetery Arch Gate facing Kaborkhana More
  for (const ox of [-3.2, 3.2]) {
    box(staticG, [0.95, 4.6, 0.95], [cemX + ox, 2.3, cemZ - 6.5], bank.marbleWhite);
    box(staticG, [1.10, 0.26, 1.10], [cemX + ox, 4.68, cemZ - 6.5], bank.mosqueGreen);
  }
  box(staticG, [7.6, 1.25, 0.85], [cemX, 4.75, cemZ - 6.5], bank.mosqueEmerald);
  addSignBox(
    dynamicG,
    bank,
    { title: 'খুলনা কবরখানা · KABORKHANA CEMETERY', subtitle: 'ইন্না লিল্লাহি ওয়া ইন্না ইলাইহি রাজিউন · কবরখানা মোড়, খুলনা', bg: '#064e3b', fg: '#ffffff', accent: '#fde047', border: '#fde047', width: 640 },
    [cemX, 4.78, cemZ - 6.0],
    0,
    6.8,
    1.12,
  );
  // Shady Cypress Trees inside Cemetery
  for (const [tx, tz] of [[-29, 126], [-21, 130], [-14, 127], [-26, 136]]) {
    cylinder(staticG, 0.16, 0.24, 6.2, [tx, 3.1, tz], bank.teakWood, 7);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(1.85, 5.2, 8), bank.mosqueEmerald);
    crown.position.set(tx, 6.4, tz);
    staticG.add(crown);
  }

  // 5) MOSQUE #1: কবরখানা মোড় কেন্দ্রীয় জামে মসজিদ (Right beside Kaborkhana More, North-East Corner!)
  addNeighborhoodMosque(staticG, dynamicG, bank, phys, {
    cx: 15.5,
    cz: 103.5,
    rotY: kjaYaw - Math.PI * 0.5,
    w: 15.5,
    d: 13.5,
    title: 'কবরখানা মোড় কেন্দ্রীয় জামে মসজিদ',
    subtitle: 'KABORKHANA MORE JAME MASJID · খানজাহান আলী রোড, খুলনা',
  });

  // 6) High-Detail Roadside Shops along Khan Jahan Ali Road (Kaborkhana More -> Alia Madrasah!)
  const kjaBuildings = [
    {
      cx: 44.0, cz: 127.0, rotY: kjaYaw - Math.PI * 0.5, w: 16.0, d: 10.0, floors: 4,
      wallMat: bank.creamWall, trimMat: bank.marbleWhite, accentMat: bank.terracottaWall, awningMat: bank.awningGreen, shutterMat: bank.shutterGreen,
      signTitle: 'কবরখানা মোড় ফার্মেসি ও ডায়াগনস্টিক সেন্টার', signSub: '24 HR MEDICINE · KHAN JAHAN ALI RD', signBg: '#065f46', seed: 511,
    },
    {
      cx: 66.0, cz: 139.5, rotY: kjaYaw - Math.PI * 0.5, w: 16.5, d: 10.0, floors: 5,
      wallMat: bank.sandWall, trimMat: bank.marbleWhite, accentMat: bank.slateTrim, awningMat: bank.awningBlue, shutterMat: bank.shutterBlue,
      signTitle: 'আলিয়া ইসলামি কুতুবখানা ও লাইব্রেরি', signSub: 'কুরআন, হাদিস, মাদ্রাসা বই ও স্টেশনারি · খানজাহান আলী রোড', signBg: '#1e3a8a', seed: 515,
    },
    {
      cx: 90.0, cz: 153.0, rotY: kjaYaw - Math.PI * 0.5, w: 16.5, d: 10.0, floors: 4,
      wallMat: bank.ochreWall, trimMat: bank.creamWall, accentMat: bank.terracottaWall, awningMat: bank.awningRed, shutterMat: bank.shutterGrey,
      signTitle: 'মদিনা পাঞ্জাবি, টুপি ও আতর হাউস · হোটেল', signSub: 'খুলনা আলিয়া মাদ্রাসা সংলগ্ন · খানজাহান আলী রোড', signBg: '#7f1d1d', seed: 519,
    },
    {
      cx: 114.0, cz: 166.5, rotY: kjaYaw - Math.PI * 0.5, w: 16.0, d: 10.0, floors: 5,
      wallMat: bank.whiteWall, trimMat: bank.marbleWhite, accentMat: bank.mosqueGreen, awningMat: bank.awningGreen, shutterMat: bank.shutterGreen,
      signTitle: 'খুলনা ফটোকপি, কম্পিউটার ও ইসলামি বুক হাউস', signSub: '৮৮ খানজাহান আলী রোড · মডেল মসজিদ সংলগ্ন', signBg: '#0f3d2e', seed: 523,
    },
    // South side of Khan Jahan Ali Road
    {
      cx: 28.0, cz: 147.0, rotY: kjaYaw + Math.PI * 0.5, w: 16.5, d: 10.0, floors: 4,
      wallMat: bank.paleBlueWall, trimMat: bank.marbleWhite, accentMat: bank.slateTrim, awningMat: bank.awningBlue, shutterMat: bank.shutterBlue,
      signTitle: 'খুলনা টাইলস, স্যানিটারি ও হার্ডওয়্যার মার্কেট', signSub: 'কবরখানা মোড় পূর্ব পাশ · খানজাহান আলী রোড', signBg: '#0c4a6e', seed: 527,
    },
    {
      cx: 54.0, cz: 161.5, rotY: kjaYaw + Math.PI * 0.5, w: 17.0, d: 10.0, floors: 5,
      wallMat: bank.peachWall, trimMat: bank.creamWall, accentMat: bank.terracottaWall, awningMat: bank.awningOrange, shutterMat: bank.shutterGrey,
      signTitle: 'ভাই-ভাই বেকারি, মিষ্টান্ন ও কনফেকশনারি', signSub: 'KHAN JAHAN ALI RD · KABORKHANA TO ALIA MADRASAH', signBg: '#7c2d12', seed: 531,
    },
    {
      cx: 82.0, cz: 177.2, rotY: kjaYaw + Math.PI * 0.5, w: 16.5, d: 10.0, floors: 4,
      wallMat: bank.mintWall, trimMat: bank.marbleWhite, accentMat: bank.mosqueGreen, awningMat: bank.awningGreen, shutterMat: bank.shutterGreen,
      signTitle: 'আল-মদিনা ফার্মেসি ও ডেন্টাল কেয়ার', signSub: 'আলিয়া মাদ্রাসা মোড় · খানজাহান আলী রোড', signBg: '#064e3b', seed: 535,
    },
    {
      cx: 112.0, cz: 194.0, rotY: kjaYaw + Math.PI * 0.5, w: 16.5, d: 10.0, floors: 4,
      wallMat: bank.creamWall, trimMat: bank.marbleWhite, accentMat: bank.terracottaWall, awningMat: bank.awningRed, shutterMat: bank.shutterGrey,
      signTitle: 'হোটেল আল-বারাকা ও বিরিয়ানি হাউস', signSub: 'মডেল মসজিদ ও আলিয়া মাদ্রাসা সংলগ্ন', signBg: '#991b1b', seed: 539,
    },
  ];
  for (const b of kjaBuildings) {
    addDetailedShopBuilding(staticG, dynamicG, bank, phys, b);
  }

  // Streetlamps, Utility Poles with Wires & Parked CNG Auto at Kaborkhana More
  for (const [lx, lz] of [[24, 122], [58, 141], [94, 161], [130, 181], [160, 198]]) {
    addStreetLamp(staticG, dynamicG, bank, phys, lx, lz, kjaYaw);
  }
  const vBank = {
    tire: bank.tireBlack, rim: bank.aluminum, darkTrim: bank.steelDark, chrome: bank.aluminum,
    windshield: bank.glassCurtain, headlight: bank.lampGlow, taillight: bank.flowerRed, amber: bank.flowerGold,
    cngGreen: bank.mosqueGreen, cngYellow: bank.flowerGold, cngRexine: bank.steelDark,
    easyTeal: bank.awningBlue, easyCrimson: bank.terracottaWall, easyRoof: bank.whiteWall, plate: bank.flowerGold,
  };
  const kabCng = buildCNGAuto(vBank);
  kabCng.position.set(1.5, 0.05, 102.5);
  kabCng.rotation.y = 0.25;
  staticG.add(kabCng);
  phys.addOBB(1.5, 102.5, 1.5, 2.8, 0.25, 1.8);
}

/* ============================================================================
 * SLICE 2: HAJI MOHSIN ROAD EXTENDED (SOUTH z = 42..111 & NORTH z = -28..-337)
 *          WITH DETAILED BUILDINGS, SHOPS, MULTIPLE SIDE ALLEYS & MOSQUE #2!
 * ========================================================================== */

function buildHajiMohsinRoadExtended(staticG, dynamicG, bank, phys) {
  // 1) South Extension of Haji Mohsin Road (z = 40 -> Kaborkhana More -9.9, 111.2)
  const hajiSouthPts = [
    [0.0, 40.0],
    [-2.5, 65.0],
    [-6.2, 88.0],
    [-9.9, 111.2],
  ];
  addPitchRoadAlongPolyline(staticG, hajiSouthPts, 4.1, bank.pitchRoad, 0.055);
  addSidewalkAlongPolyline(staticG, bank, phys, hajiSouthPts, 3.9, 1, { walkWidth: 1.75, curbMat: bank.curbRedWhite });
  addSidewalkAlongPolyline(staticG, bank, phys, hajiSouthPts, 3.9, -1, { walkWidth: 1.75, curbMat: bank.curbRedWhite });

  // 2) North Extension of Haji Mohsin Road (z = -26 -> South Central Road Junction 0, -337)
  const hajiNorthPts = [
    [0.0, -26.0],
    [0.0, -100.0],
    [0.0, -180.0],
    [0.0, -260.0],
    [0.0, -337.0],
  ];
  addPitchRoadAlongPolyline(staticG, hajiNorthPts, 4.1, bank.pitchRoad, 0.055);
  addSidewalkAlongPolyline(staticG, bank, phys, hajiNorthPts, 3.9, 1, { walkWidth: 1.75, curbMat: bank.curbRedWhite });
  addSidewalkAlongPolyline(staticG, bank, phys, hajiNorthPts, 3.9, -1, { walkWidth: 1.75, curbMat: bank.curbRedWhite });

  // 3) South Segment Buildings & Side Alleys (z = 44..96)
  const southYaw = Math.atan2(-9.9 - 0.0, 111.2 - 40.0);
  addDetailedShopBuilding(staticG, dynamicG, bank, phys, {
    cx: 8.8, cz: 51.0, rotY: southYaw - Math.PI * 0.5, w: 15.0, d: 9.5, floors: 4,
    wallMat: bank.creamWall, trimMat: bank.marbleWhite, accentMat: bank.terracottaWall, awningMat: bank.awningGreen, shutterMat: bank.shutterGreen,
    signTitle: 'হাজী মহসিন রোড সুপার শপ ও ডিপার্টমেন্টাল স্টোর', signSub: 'গ্রোসারি, কসমেটিক্স ও বিকাশ এজেন্ট · হাজী মহসিন রোড', signBg: '#065f46', seed: 601,
  });
  addSideAlley(staticG, dynamicG, bank, phys, { x0: 2.0, z0: 66.0, dirX: 1, dirZ: 0.14, len: 22.0, width: 3.6, nameBn: 'মুন্সী পাড়া শাখা গলি' });
  addDetailedShopBuilding(staticG, dynamicG, bank, phys, {
    cx: 6.2, cz: 81.5, rotY: southYaw - Math.PI * 0.5, w: 15.0, d: 9.5, floors: 5,
    wallMat: bank.paleBlueWall, trimMat: bank.marbleWhite, accentMat: bank.slateTrim, awningMat: bank.awningBlue, shutterMat: bank.shutterBlue,
    signTitle: 'খুলনা মেডিকেল হল ও ফার্মেসি · টেইলার্স', signSub: 'কবরখানা মোড় উত্তর · হাজী মহসিন রোড', signBg: '#1e3a8a', seed: 605,
  });
  addDetailedShopBuilding(staticG, dynamicG, bank, phys, {
    cx: -13.5, cz: 53.0, rotY: southYaw + Math.PI * 0.5, w: 15.5, d: 9.5, floors: 4,
    wallMat: bank.sandWall, trimMat: bank.creamWall, accentMat: bank.terracottaWall, awningMat: bank.awningRed, shutterMat: bank.shutterGrey,
    signTitle: 'হাজী মহসিন বেকারি, টি স্টল ও ফাস্ট ফুড', signSub: 'বিকেলের নাস্তা, চা ও মিষ্টি · হাজী মহসিন রোড', signBg: '#7f1d1d', seed: 609,
  });
  addSideAlley(staticG, dynamicG, bank, phys, { x0: -9.5, z0: 71.0, dirX: -1, dirZ: -0.14, len: 22.0, width: 3.6, nameBn: 'দক্ষিণ ফকির বাড়ি গলি' });
  addDetailedShopBuilding(staticG, dynamicG, bank, phys, {
    cx: -17.5, cz: 87.5, rotY: southYaw + Math.PI * 0.5, w: 15.5, d: 9.5, floors: 5,
    wallMat: bank.ochreWall, trimMat: bank.marbleWhite, accentMat: bank.mosqueGreen, awningMat: bank.awningGreen, shutterMat: bank.shutterGreen,
    signTitle: 'রহমানিয়া হার্ডওয়্যার, ইলেকট্রিক ও পেইন্টস', signSub: 'কবরখানা মোড় সংলগ্ন · হাজী মহসিন রোড', signBg: '#0f3d2e', seed: 613,
  });

  // 4) MOSQUE #2 ON HAJI MOHSIN ROAD: বায়তুল আমান জামে মসজিদ (West Side, x = -15.2, z = -168)
  addNeighborhoodMosque(staticG, dynamicG, bank, phys, {
    cx: -15.2,
    cz: -168.0,
    rotY: Math.PI * 0.5,
    w: 15.5,
    d: 13.5,
    title: 'বায়তুল আমান জামে মসজিদ · হাজী মহসিন রোড',
    subtitle: 'BAITUL AMAN JAME MASJID · হাজী মহসিন রোড, খুলনা',
  });

  // 5) North Segment High-Detail Buildings, Shops & Multiple Side Alleys (z = -38 .. -318)
  const northEastBuildings = [
    { z: -42, w: 16.0, floors: 5, wall: bank.whiteWall, acc: bank.terracottaWall, awn: bank.awningRed, sh: bank.shutterGrey, title: 'হাজী মহসিন ডায়াগনস্টিক ও কনসালটেশন সেন্টার', sub: 'PATHOLOGY · X-RAY · ECG · HAJI MOHSIN RD', bg: '#7f1d1d', seed: 621 },
    { z: -62, w: 16.0, floors: 4, wall: bank.creamWall, acc: bank.mosqueGreen, awn: bank.awningGreen, sh: bank.shutterGreen, title: 'সততা গ্রোসারি, কনফেকশনারি ও বিকাশ কর্নার', sub: 'দৈনন্দিন বাজার ও ফ্রেশ ডেইরি · হাজী মহসিন রোড', bg: '#065f46', seed: 625 },
    // Alley at z = -80 East!
    { z: -98, w: 16.5, floors: 5, wall: bank.paleBlueWall, acc: bank.slateTrim, awn: bank.awningBlue, sh: bank.shutterBlue, title: 'খুলনা কম্পিউটার, ফটোকপি ও স্টেশনারি হাউস', sub: 'SSC · HSC COACHING NOTES & PRINT · HAJI MOHSIN RD', bg: '#1e3a8a', seed: 629 },
    { z: -118, w: 16.0, floors: 4, wall: bank.peachWall, acc: bank.terracottaWall, awn: bank.awningOrange, sh: bank.shutterGrey, title: 'নিউ মডার্ন টেইলার্স ও ফ্যাব্রিকস · আবাসিক ভবন', sub: 'পাঞ্জাবি, শার্ট, প্যান্ট ও ব্লেজার · হাজী মহসিন রোড', bg: '#7c2d12', seed: 633 },
    // Alley at z = -136 East!
    { z: -154, w: 16.5, floors: 5, wall: bank.mintWall, acc: bank.mosqueGreen, awn: bank.awningGreen, sh: bank.shutterGreen, title: 'ইসলামিয়া লাইব্রেরি ও ফার্মেসি · মহসিন ম্যানশন', sub: 'বাইতুল আমান মসজিদ বিপরীত · হাজী মহসিন রোড', bg: '#064e3b', seed: 637 },
    { z: -174, w: 16.0, floors: 4, wall: bank.sandWall, acc: bank.terracottaWall, awn: bank.awningRed, sh: bank.shutterGrey, title: 'আহমেদ ইলেকট্রনিক্স ও মোবাইল সার্ভিসিং', sub: 'LED TV · FRIDGE · MOBILE REPAIR · HAJI MOHSIN RD', bg: '#991b1b', seed: 641 },
    // Alley at z = -194 East!
    { z: -212, w: 16.5, floors: 5, wall: bank.whiteWall, acc: bank.slateTrim, awn: bank.awningBlue, sh: bank.shutterBlue, title: 'ম্যাক্স কেয়ার ফার্মেসি ও ডেন্টাল ক্লিনিক', sub: 'ডেন্টাল সার্জারি ও ২৪ ঘন্টা ফার্মেসি · হাজী মহসিন রোড', bg: '#0c4a6e', seed: 645 },
    { z: -232, w: 16.0, floors: 4, wall: bank.ochreWall, acc: bank.terracottaWall, awn: bank.awningOrange, sh: bank.shutterGrey, title: 'খুলনা মিষ্টান্ন ভান্ডার ও নাস্তা ঘর', sub: 'রসগোল্লা, সন্দেশ, পরোটা ও চা · হাজী মহসিন রোড', bg: '#78350f', seed: 649 },
    // Alley at z = -252 East!
    { z: -270, w: 16.5, floors: 5, wall: bank.creamWall, acc: bank.mosqueGreen, awn: bank.awningGreen, sh: bank.shutterGreen, title: 'হাজী মহসিন প্লাজা · কোচিং ও সুপার মার্কেট', sub: 'ব্যাংক এটিএম · কোচিং সেন্টার · রেসিডেনশিয়াল ফ্ল্যাট', bg: '#0f3d2e', seed: 653 },
    { z: -292, w: 16.5, floors: 5, wall: bank.paleBlueWall, acc: bank.slateTrim, awn: bank.awningBlue, sh: bank.shutterBlue, title: 'সাউথ সেন্ট্রাল কর্নার · ফ্যাশন ও সুজ হাউস', sub: 'হাজী মহসিন রোড উত্তর মাথা · সাউথ সেন্ট্রাল রোড সংযোগ', bg: '#1e3a8a', seed: 657 },
    { z: -312, w: 15.0, floors: 4, wall: bank.whiteWall, acc: bank.terracottaWall, awn: bank.awningRed, sh: bank.shutterGrey, title: 'কর্নার ক্যাফে ও বিরিয়ানি হাউস', sub: 'সাউথ সেন্ট্রাল রোড × হাজী মহসিন রোড মোড়', bg: '#7f1d1d', seed: 661 },
  ];

  for (const b of northEastBuildings) {
    addDetailedShopBuilding(staticG, dynamicG, bank, phys, {
      cx: 11.2, cz: b.z, rotY: -Math.PI * 0.5, w: b.w, d: 9.6, floors: b.floors,
      wallMat: b.wall, trimMat: bank.marbleWhite, accentMat: b.acc, awningMat: b.awn, shutterMat: b.sh,
      signTitle: b.title, signSub: b.sub, signBg: b.bg, seed: b.seed,
    });
  }

  const northWestBuildings = [
    { z: -42, w: 16.0, floors: 4, wall: bank.sandWall, acc: bank.terracottaWall, awn: bank.awningOrange, sh: bank.shutterGrey, title: 'মহসিন রোড হার্ডওয়্যার ও প্লাম্বিং স্টোর', sub: 'পাইপ, ফিটিংস ও ইলেকট্রিক · হাজী মহসিন রোড', bg: '#7c2d12', seed: 671 },
    // Alley at z = -60 West!
    { z: -78, w: 16.5, floors: 5, wall: bank.mintWall, acc: bank.mosqueGreen, awn: bank.awningGreen, sh: bank.shutterGreen, title: 'গ্রিন লাইফ হোমিও ও আয়ুর্বেদিক হল', sub: 'হাজী মহসিন রোড পশ্চিম পাশ · আবাসিক অ্যাপার্টমেন্ট', bg: '#065f46', seed: 675 },
    { z: -98, w: 16.0, floors: 4, wall: bank.creamWall, acc: bank.slateTrim, awn: bank.awningBlue, sh: bank.shutterBlue, title: 'সায়েন্স ও ইংলিশ প্রাইভেট একাডেমি · বুক স্টল', sub: 'SSC · HSC BATCH & STATIONERY · HAJI MOHSIN RD', bg: '#1e3a8a', seed: 679 },
    // Alley at z = -116 West!
    { z: -134, w: 16.5, floors: 5, wall: bank.whiteWall, acc: bank.terracottaWall, awn: bank.awningRed, sh: bank.shutterGrey, title: 'রয়েল সেলুন, লন্ড্রি ও ভ্যারাইটিজ স্টোর', sub: 'হাজী মহসিন রোড · খুলনা সিটি কর্পোরেশন', bg: '#991b1b', seed: 683 },
    // Mosque #2 is at z = -168 West!
    { z: -194, w: 16.0, floors: 4, wall: bank.ochreWall, acc: bank.mosqueGreen, awn: bank.awningGreen, sh: bank.shutterGreen, title: 'মসজিদ মার্কেট · আতর, টুপি ও কনফেকশনারি', sub: 'বায়তুল আমান জামে মসজিদ সংলগ্ন · হাজী মহসিন রোড', bg: '#0f3d2e', seed: 687 },
    // Alley at z = -212 West!
    { z: -230, w: 16.5, floors: 5, wall: bank.paleBlueWall, acc: bank.slateTrim, awn: bank.awningBlue, sh: bank.shutterBlue, title: 'খুলনা অপটিক্যাল, ঘড়ি ও গিফট কর্নার', sub: 'চশমা, লেন্স ও গিফট শপ · হাজী মহসিন রোড', bg: '#0c4a6e', seed: 691 },
    { z: -252, w: 16.5, floors: 4, wall: bank.peachWall, acc: bank.terracottaWall, awn: bank.awningOrange, sh: bank.shutterGrey, title: 'আবাসিক ভিলা · মদিনা বেকারি ও চা ঘর', sub: 'হাজী মহসিন রোড উত্তর · খুলনা', bg: '#78350f', seed: 695 },
    // Alley at z = -270 West!
    { z: -288, w: 16.5, floors: 5, wall: bank.whiteWall, acc: bank.mosqueGreen, awn: bank.awningGreen, sh: bank.shutterGreen, title: 'নর্থ মহসিন টাওয়ার · ফার্মেসি ও সুপার শপ', sub: 'সাউথ সেন্ট্রাল রোড সংযোগস্থল · খুলনা', bg: '#064e3b', seed: 699 },
    { z: -310, w: 15.5, floors: 5, wall: bank.creamWall, acc: bank.slateTrim, awn: bank.awningBlue, sh: bank.shutterBlue, title: 'সাউথ সেন্ট্রাল প্লাজা · কম্পিউটার ও ফটোকপি', sub: 'হাজী মহসিন রোড ও সাউথ সেন্ট্রাল রোড মোড়', bg: '#1e3a8a', seed: 703 },
  ];

  for (const b of northWestBuildings) {
    addDetailedShopBuilding(staticG, dynamicG, bank, phys, {
      cx: -11.2, cz: b.z, rotY: Math.PI * 0.5, w: b.w, d: 9.6, floors: b.floors,
      wallMat: b.wall, trimMat: bank.marbleWhite, accentMat: b.acc, awningMat: b.awn, shutterMat: b.sh,
      signTitle: b.title, signSub: b.sub, signBg: b.bg, seed: b.seed,
    });
  }

  // 6) Multiple Authentic Side Alleys (গলি) branching off BOTH sides of Haji Mohsin Road!
  addSideAlley(staticG, dynamicG, bank, phys, { x0: 6.2, z0: -80.0, dirX: 1, dirZ: 0, len: 24.0, width: 3.6, nameBn: 'পূর্ব হাজী মহসিন লেন ১' });
  addSideAlley(staticG, dynamicG, bank, phys, { x0: 6.2, z0: -136.0, dirX: 1, dirZ: 0, len: 24.0, width: 3.6, nameBn: 'মসজিদ পূর্ব গলি' });
  addSideAlley(staticG, dynamicG, bank, phys, { x0: 6.2, z0: -194.0, dirX: 1, dirZ: 0, len: 24.0, width: 3.6, nameBn: 'পূর্ব মহসিন আবাসিক গলি ২' });
  addSideAlley(staticG, dynamicG, bank, phys, { x0: 6.2, z0: -252.0, dirX: 1, dirZ: 0, len: 24.0, width: 3.6, nameBn: 'সাউথ লিংক শর্টকাট গলি' });

  addSideAlley(staticG, dynamicG, bank, phys, { x0: -6.2, z0: -60.0, dirX: -1, dirZ: 0, len: 24.0, width: 3.6, nameBn: 'পশ্চিম মহসিন পাড়া গলি ১' });
  addSideAlley(staticG, dynamicG, bank, phys, { x0: -6.2, z0: -116.0, dirX: -1, dirZ: 0, len: 24.0, width: 3.6, nameBn: 'বায়তুল আমান মসজিদ লেন' });
  addSideAlley(staticG, dynamicG, bank, phys, { x0: -6.2, z0: -212.0, dirX: -1, dirZ: 0, len: 24.0, width: 3.6, nameBn: 'কোচিং পাড়া শাখা গলি' });
  addSideAlley(staticG, dynamicG, bank, phys, { x0: -6.2, z0: -270.0, dirX: -1, dirZ: 0, len: 24.0, width: 3.6, nameBn: 'পশ্চিম মহসিন লেন ২' });

  // 7) Utility Poles with Hanging Wires, Posters & Streetlamps along Haji Mohsin Road
  const poleZs = [58, 86, -46, -86, -126, -166, -206, -246, -286, -322];
  let prevTop = null;
  for (let i = 0; i < poleZs.length; i++) {
    const pz = poleZs[i];
    const px = pz > 40 ? THREE.MathUtils.lerp(4.6, -4.5, (pz - 40) / 71.2) : 4.8;
    cylinder(staticG, 0.10, 0.14, 8.4, [px, 4.2, pz], bank.concrete, 8);
    phys.addCircle(px, pz, 0.20, 8.4);
    decorateCorridorPole(dynamicG, px, pz, -Math.PI * 0.5, 1620 + i);
    const top = [px, 8.0, pz];
    if (prevTop && Math.abs(pz - prevTop[2]) < 55) {
      const mid = [(prevTop[0] + top[0]) * 0.5, 7.45, (prevTop[2] + top[2]) * 0.5];
      rodBetween(staticG, prevTop, mid, 0.015, bank.wireMat, 5);
      rodBetween(staticG, mid, top, 0.015, bank.wireMat, 5);
    }
    prevTop = top;
    if (i % 2 === 0) {
      addStreetLamp(staticG, dynamicG, bank, phys, pz > 40 ? px - 9.2 : -4.8, pz, 0);
    }
  }
}

/* ============================================================================
 * SLICE 3: SOUTH CENTRAL ROAD (0, -337 -> 157.4, -296.2) ↔ ALTAPOLE LANE LINK
 * ========================================================================== */

function buildSouthCentralToAltapole(staticG, dynamicG, bank, phys) {
  // 1) South Central Road × Haji Mohsin Road Junction Apron (0, -337)
  const jDisc = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 10.8, 0.04, 32), bank.pitchJunction);
  jDisc.position.set(0.0, 0.056, -337.0);
  jDisc.receiveShadow = true;
  staticG.add(jDisc);

  // Overhead Directional Sign at Haji Mohsin Rd × South Central Rd Junction
  addZebraCrosswalk(staticG, bank, 0.0, -326.0, 0, 7.6);
  addSignBox(
    dynamicG,
    bank,
    {
      title: 'সাউথ সেন্ট্রাল রোড × হাজী মহসিন রোড মোড়',
      subtitle: '← পিকচার প্যালেস / সাতরাস্তা  |  ↓ হাজী মহসিন রোড / কবরখানা মোড়  |  → আলতাপোল লেন',
      bg: '#1e3a8a',
      fg: '#ffffff',
      accent: '#fde047',
      border: '#fde047',
      width: 720,
      height: 176,
    },
    [0.0, 5.85, -344.2],
    0,
    8.6,
    1.55,
  );
  for (const sx of [-4.2, 4.2]) {
    cylinder(staticG, 0.16, 0.20, 6.0, [sx, 3.0, -344.2], bank.steelDark, 8);
    phys.addCircle(sx, -344.2, 0.24, 6.0);
  }

  // 2) South Central Road Pitch-Asphalt & Raised Red-Brick Footpaths (-40,-349 -> 0,-337 -> 58.7,-319.5 -> 157.4,-296.2 -> 182,-290)
  const scPts = [
    [-42.0, -349.5],
    [0.0, -337.0],
    [58.7, -319.5],
    [110.0, -307.4],
    [157.4, -296.2],
    [182.0, -290.5],
  ];
  addPitchRoadAlongPolyline(staticG, scPts, 4.4, bank.pitchRoad, 0.054);
  addSidewalkAlongPolyline(staticG, bank, phys, scPts, 4.2, 1, { walkWidth: 1.75, curbMat: bank.curbYellowBlack });
  addSidewalkAlongPolyline(staticG, bank, phys, scPts, 4.2, -1, { walkWidth: 1.75, curbMat: bank.curbYellowBlack });

  // Clean Junction Apron where South Central Road meets Altapole Lane (157.4, -296.2)!
  const altDisc = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 8.8, 0.04, 28), bank.pitchJunction);
  altDisc.position.set(157.4, 0.057, -296.2);
  altDisc.receiveShadow = true;
  staticG.add(altDisc);
  addZebraCrosswalk(staticG, bank, 158.2, -305.0, 0.12, 5.4);
  addSignBox(
    dynamicG,
    bank,
    {
      title: 'আলতাপোল লেন মোড় · সাউথ সেন্ট্রাল রোড',
      subtitle: '↑ আলতাপোল লেন (কামিয়াব টিচিং হোম · পরশমনি)  |  ← হাজী মহসিন রোড',
      bg: '#065f46',
      fg: '#ffffff',
      accent: '#fde047',
      border: '#fde047',
      width: 680,
    },
    [157.4, 5.2, -287.5],
    Math.PI,
    7.4,
    1.35,
  );

  // 3) High-Detail Shops & Multi-Story Buildings along BOTH Sides of South Central Road!
  const scYaw1 = Math.atan2(58.7 - 0.0, -319.5 - -337.0); // East-Southeast
  const scYaw2 = Math.atan2(157.4 - 58.7, -296.2 - -319.5);

  const scBuildings = [
    // North Side (facing South toward road)
    { cx: 22.0, cz: -341.8, rotY: scYaw1 - Math.PI * 0.5, w: 16.5, d: 9.5, floors: 5, wall: bank.creamWall, acc: bank.terracottaWall, awn: bank.awningRed, sh: bank.shutterGrey, title: 'সাউথ সেন্ট্রাল ডিপার্টমেন্টাল ও বেকারি', sub: 'SOUTH CENTRAL ROAD · KHULNA', bg: '#7f1d1d', seed: 711 },
    { cx: 44.0, cz: -335.2, rotY: scYaw1 - Math.PI * 0.5, w: 16.5, d: 9.5, floors: 4, wall: bank.paleBlueWall, acc: bank.slateTrim, awn: bank.awningBlue, sh: bank.shutterBlue, title: 'খুলনা বুক হাউস ও কোচিং একাডেমি', sub: 'HSC · UNIVERSITY ADMISSION CARE · SOUTH CENTRAL RD', bg: '#1e3a8a', seed: 715 },
    { cx: 74.0, cz: -327.0, rotY: scYaw2 - Math.PI * 0.5, w: 16.5, d: 9.5, floors: 5, wall: bank.whiteWall, acc: bank.mosqueGreen, awn: bank.awningGreen, sh: bank.shutterGreen, title: 'সাউথ সেন্ট্রাল ফার্মেসি ও মেডিকেল কর্নার', sub: '24H HEALTHCARE · SOUTH CENTRAL RD', bg: '#065f46', seed: 719 },
    { cx: 100.0, cz: -320.8, rotY: scYaw2 - Math.PI * 0.5, w: 16.5, d: 9.5, floors: 4, wall: bank.sandWall, acc: bank.terracottaWall, awn: bank.awningOrange, sh: bank.shutterGrey, title: 'সেন্ট্রাল ক্যাফে, ফাস্ট ফুড ও কফি শপ', sub: 'BURGER · PASTA · COLD COFFEE · SOUTH CENTRAL RD', bg: '#7c2d12', seed: 723 },
    { cx: 128.0, cz: -314.2, rotY: scYaw2 - Math.PI * 0.5, w: 16.5, d: 9.5, floors: 5, wall: bank.mintWall, acc: bank.mosqueGreen, awn: bank.awningGreen, sh: bank.shutterGreen, title: 'আলতাপোল মার্কেট · ফটোকপি, সুজ ও টেইলার্স', sub: 'আলতাপোল লেন দক্ষিণ প্রবেশমুখ · সাউথ সেন্ট্রাল রোড', bg: '#0f3d2e', seed: 727 },
    // South Side (facing North toward road)
    { cx: 24.0, cz: -319.0, rotY: scYaw1 + Math.PI * 0.5, w: 16.5, d: 9.5, floors: 4, wall: bank.ochreWall, acc: bank.terracottaWall, awn: bank.awningOrange, sh: bank.shutterGrey, title: 'মদিনা হার্ডওয়্যার, পেইন্ট ও ইলেকট্রিক', sub: 'SOUTH CENTRAL ROAD SOUTH · KHULNA', bg: '#78350f', seed: 731 },
    { cx: 48.0, cz: -311.8, rotY: scYaw1 + Math.PI * 0.5, w: 16.5, d: 9.5, floors: 5, wall: bank.whiteWall, acc: bank.slateTrim, awn: bank.awningBlue, sh: bank.shutterBlue, title: 'রয়েল মোবাইল জোন ও কম্পিউটার সার্ভিস', sub: 'SMARTPHONE · LAPTOP · ACCESSORIES · SOUTH CENTRAL RD', bg: '#0c4a6e', seed: 735 },
    { cx: 78.0, cz: -304.2, rotY: scYaw2 + Math.PI * 0.5, w: 16.5, d: 9.5, floors: 4, wall: bank.peachWall, acc: bank.terracottaWall, awn: bank.awningRed, sh: bank.shutterGrey, title: 'খুলনা হোটেল, বিরিয়ানি ও মিষ্টান্ন ঘর', sub: 'SOUTH CENTRAL ROAD · ALTAPOLE LINK', bg: '#991b1b', seed: 739 },
    { cx: 106.0, cz: -297.6, rotY: scYaw2 + Math.PI * 0.5, w: 16.5, d: 9.5, floors: 5, wall: bank.creamWall, acc: bank.mosqueGreen, awn: bank.awningGreen, sh: bank.shutterGreen, title: 'সেন্ট্রাল রেসিডেন্স · সুপার শপ ও ফার্মেসি', sub: 'আবাসিক অ্যাপার্টমেন্ট ও মার্কেট · সাউথ সেন্ট্রাল রোড', bg: '#064e3b', seed: 743 },
    { cx: 134.0, cz: -291.0, rotY: scYaw2 + Math.PI * 0.5, w: 16.5, d: 9.5, floors: 4, wall: bank.paleBlueWall, acc: bank.slateTrim, awn: bank.awningBlue, sh: bank.shutterBlue, title: 'আলতাপোল লেন কর্নার · লাইব্রেরি ও স্টেশনারি', sub: 'ALTAPOLE LANE JUNCTION · SOUTH CENTRAL RD', bg: '#1e3a8a', seed: 747 },
  ];

  for (const b of scBuildings) {
    addDetailedShopBuilding(staticG, dynamicG, bank, phys, {
      cx: b.cx, cz: b.cz, rotY: b.rotY, w: b.w, d: b.d, floors: b.floors,
      wallMat: b.wall, trimMat: bank.marbleWhite, accentMat: b.acc, awningMat: b.awn, shutterMat: b.sh,
      signTitle: b.title, signSub: b.sub, signBg: b.bg, seed: b.seed,
    });
  }

  // Streetlamps, Utility Poles with Wires & Parked Easybike along South Central Road
  const lampPts = [[28, -334], [64, -323], [100, -315], [136, -306], [166, -299]];
  let prevTop = null;
  for (let i = 0; i < lampPts.length; i++) {
    const [lx, lz] = lampPts[i];
    addStreetLamp(staticG, dynamicG, bank, phys, lx, lz, scYaw2);
    cylinder(staticG, 0.10, 0.14, 8.4, [lx, 4.2, lz + 9.2], bank.concrete, 8);
    phys.addCircle(lx, lz + 9.2, 0.20, 8.4);
    decorateCorridorPole(dynamicG, lx, lz + 9.2, scYaw2, 1720 + i);
    const top = [lx, 8.0, lz + 9.2];
    if (prevTop) {
      const mid = [(prevTop[0] + top[0]) * 0.5, 7.45, (prevTop[2] + top[2]) * 0.5];
      rodBetween(staticG, prevTop, mid, 0.015, bank.wireMat, 5);
      rodBetween(staticG, mid, top, 0.015, bank.wireMat, 5);
    }
    prevTop = top;
  }

  const vBank = {
    tire: bank.tireBlack, rim: bank.aluminum, darkTrim: bank.steelDark, chrome: bank.aluminum,
    windshield: bank.glassCurtain, headlight: bank.lampGlow, taillight: bank.flowerRed, amber: bank.flowerGold,
    cngGreen: bank.mosqueGreen, cngYellow: bank.flowerGold, cngRexine: bank.steelDark,
    easyTeal: bank.awningBlue, easyCrimson: bank.terracottaWall, easyRoof: bank.whiteWall, plate: bank.flowerGold,
  };
  const scEasy = buildEasybike(vBank, true);
  scEasy.position.set(148.0, 0.05, -294.2);
  scEasy.rotation.y = scYaw2;
  staticG.add(scEasy);
  phys.addOBB(148.0, -294.2, 1.4, 2.7, scYaw2, 1.8);
}

/* ============================================================================
 * EXPORTED DISTRICT BUILDER (3 DISTANCE-CULLED, MERGED SLICES FOR 60+ FPS)
 * ========================================================================== */

export function buildHajiKaborkhanaCorridor(parent, m) {
  const root = new THREE.Group();
  root.name = 'KhulnaCorridor_HajiKaborkhanaSouthCentral';
  parent.add(root);

  const bank = createCorridorBank(m);
  const phys = createCorridorPhysics();
  const slices = [];

  function makeSlice(name, cx, cz, maxDist) {
    const sRoot = new THREE.Group();
    sRoot.name = name;
    const staticG = new THREE.Group();
    const dynamicG = new THREE.Group();
    sRoot.add(staticG, dynamicG);
    root.add(sRoot);
    const s = { name, cx, cz, maxDistSq: maxDist * maxDist, root: sRoot, staticG, dynamicG };
    slices.push(s);
    return s;
  }

  const kaborkhanaSlice = makeSlice('Slice_Kaborkhana_KhanJahanAli', 70, 155, 290);
  const hajiExtSlice = makeSlice('Slice_HajiMohsin_Extended', 0, -130, 310);
  const southCentralSlice = makeSlice('Slice_SouthCentral_AltapoleLink', 80, -315, 290);

  buildKaborkhanaMoreAndKhanJahanAli(kaborkhanaSlice.staticG, kaborkhanaSlice.dynamicG, bank, phys);
  buildHajiMohsinRoadExtended(hajiExtSlice.staticG, hajiExtSlice.dynamicG, bank, phys);
  buildSouthCentralToAltapole(southCentralSlice.staticG, southCentralSlice.dynamicG, bank, phys);

  for (const s of slices) {
    mergeStaticMeshes(s.staticG);
  }

  function syncVisibility(playerPos) {
    if (!playerPos) return;
    for (let i = 0; i < slices.length; i++) {
      const s = slices[i];
      const dx = playerPos.x - s.cx;
      const dz = playerPos.z - s.cz;
      const want = dx * dx + dz * dz <= s.maxDistSq;
      if (s.root.visible !== want) s.root.visible = want;
    }
  }

  return {
    root,
    getGroundHeight: phys.getGroundHeight,
    applyCollisions: phys.applyCollisions,
    syncVisibility,
    setNightFactor(nightFactor = 0) {
      const nf = THREE.MathUtils.clamp(nightFactor, 0, 1);
      for (let i = 0; i < bank.emissiveList.length; i++) {
        const item = bank.emissiveList[i];
        item.mat.emissiveIntensity = item.day + (item.night - item.day) * nf;
      }
    },
    update(time, playerPos = null) {
      if (playerPos) syncVisibility(playerPos);
    },
  };
}
