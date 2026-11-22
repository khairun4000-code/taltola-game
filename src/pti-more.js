import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { box, cylinder, rodBetween } from './scene-utils.js';
import { attachDerivedPBRMaps } from './aaa-shaders.js';
import { decorateCorridorPole, addBigNetaWallPoster } from './khulna-street-props.js';
import { buildCNGAuto, buildEasybike } from './khulna-vehicles.js';

/**
 * PTI MORE & AHSAN AHMED ROAD DISTRICT — FULL ENTERABLE EDITION
 * (খুলনা পিটিআই মোড় · আহসান আহমেদ রোড · সেন্ট জোসেফ্স উচ্চ বিদ্যালয় · চাইনিজ প্যালেস)
 *
 * Features:
 *   - Raised Walkable Red-Brick Footpaths (0.24m height, red interlocking brick texture, ZERO foot sinking)
 *   - Enterable Classrooms inside Primary Teachers Training Institute (PTI) & St. Joseph's High School
 *   - Enterable Coaching Batch Classrooms along Ahsan Ahmed Road & PTI More
 *   - Enterable Shops with high-detail interiors (NO random NPCs):
 *       * Photocopy & Computer Shops (3D Xerox/Photocopy machines, paper stacks, desktop PCs, keyboards, printers)
 *       * Shoe Shops (illuminated wall racks with pairs of 3D shoes/sneakers/sandals, shoe boxes, try-on bench)
 *       * Chinese Palace & Ahsan Ahmed Rd Restaurants/Cafes (dining tables, chairs, bakery/coffee counters, lanterns)
 *       * Pharmacy, Book House & Residential House Rooms (beds, wardrobes, desks, TVs, ceiling fans)
 *   - Standing Animated 3D KMP Traffic Police Officer at PTI More corner + KMP Police Box
 *   - 100% Solid Wall Collisions (with open doorways) + Merged Static Draw Calls + 340m Distance Culling (60+ FPS)
 */

export const PTI_MORE_CENTER = { x: -304.0, z: -120.0 };
const FOOTPATH_H = 0.24; // Noticeably raised, walkable red-brick footpath height

function seeded(seed = 2305) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeLightBoxTexture({
  title,
  subtitle = '',
  bg = '#0f3d2e',
  fg = '#ffffff',
  accent = '#fde047',
  border = '#ffffff',
  width = 512,
  height = 176,
}) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, 'rgba(255,255,255,0.18)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.28)');
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
  ctx.fillText(title, 40, subtitle ? height * 0.38 : height * 0.5, width - 60);
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

function makePlasterTexture(baseHex, seedVal = 801, { subtleBrick = false, darkStreak = 0.14 } = {}) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.055)' : `rgba(30,24,18,${0.035 + rnd() * 0.06})`;
    ctx.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 4, 2 + rnd() * 4);
  }
  for (let i = 0; i < 32; i++) {
    const x = rnd() * 256;
    const h = 24 + rnd() * 90;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgba(22,26,22,${darkStreak})`);
    g.addColorStop(1, 'rgba(22,26,22,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 3 + rnd() * 7, h);
  }
  if (subtleBrick) {
    ctx.strokeStyle = 'rgba(24,18,14,0.24)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < 256; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Authentic Red Clay Brick Footpath Texture (লাল ইটের ফুটপাত — Khulna Herringbone/Running-Bond Bricks!)
 */
function makeRedBrickFootpathTexture(seedVal = 819) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  // Dark sandy mortar joints between red bricks
  ctx.fillStyle = '#4a3228';
  ctx.fillRect(0, 0, 256, 256);

  const rows = 8;
  const cols = 4;
  const bh = 256 / rows;
  const bw = 256 / cols;

  for (let r = 0; r < rows; r++) {
    const xOff = (r % 2) * (bw * 0.5);
    for (let col = -1; col <= cols; col++) {
      const bx = col * bw + xOff;
      const by = r * bh;
      const red = 158 + Math.floor(rnd() * 34);
      const grn = 54 + Math.floor(rnd() * 22);
      const blu = 40 + Math.floor(rnd() * 16);
      ctx.fillStyle = `rgb(${red}, ${grn}, ${blu})`;
      ctx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);

      // Subtle bevel highlight & brick grain
      ctx.strokeStyle = 'rgba(255, 195, 160, 0.16)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(bx + 3, by + 3, bw - 6, bh - 6);
      for (let d = 0; d < 14; d++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,220,200,0.08)' : 'rgba(25,12,8,0.12)';
        ctx.fillRect(bx + 4 + rnd() * (bw - 8), by + 4 + rnd() * (bh - 8), 2, 2);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function makeInteriorTileTexture(baseHex = '#e6e0d4', lineHex = '#b8b0a2') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = lineHex;
  ctx.lineWidth = 2;
  for (let p = 0; p < 256; p += 64) {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, 256);
    ctx.moveTo(0, p);
    ctx.lineTo(256, p);
    ctx.stroke();
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

/**
 * Authentic Bangladeshi Pitch-Asphalt Road Texture (বাংলাদেশি পিচ ঢালাই রাস্তা)
 * Deep charcoal bitumen pitch + crushed stone aggregate grain + subtle tire tracks + dusty shoulders + crisp markings!
 */
function makeBangladeshiPitchRoadTexture({ seedVal = 841, centerStripe = null, edgeStripe = null, dustyShoulder = true } = {}) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  // Rich dark charcoal freshly-laid Bangladeshi pitch-bitumen base
  ctx.fillStyle = '#25292e';
  ctx.fillRect(0, 0, S, S);

  // Subtle darker bitumen tar patches (authentic BD road maintenance texture)
  for (let i = 0; i < 18; i++) {
    const px = 40 + rnd() * (S - 80);
    const py = rnd() * S;
    const rw = 26 + rnd() * 68;
    const rh = 20 + rnd() * 54;
    ctx.fillStyle = rnd() > 0.45 ? 'rgba(18, 20, 24, 0.34)' : 'rgba(54, 58, 64, 0.22)';
    ctx.fillRect(px, py, rw, rh);
  }

  // Subtle longitudinal tire-wear polish tracks along left & right lanes
  for (const lx of [S * 0.24, S * 0.38, S * 0.62, S * 0.76]) {
    const g = ctx.createLinearGradient(lx - 26, 0, lx + 26, 0);
    g.addColorStop(0, 'rgba(16,18,22,0)');
    g.addColorStop(0.5, 'rgba(12,14,18,0.28)');
    g.addColorStop(1, 'rgba(16,18,22,0)');
    ctx.fillStyle = g;
    ctx.fillRect(lx - 26, 0, 52, S);
  }

  // Fine crushed stone aggregate grit (পাথরকুচি + পিচ ঢালাই)
  for (let i = 0; i < 6500; i++) {
    const v = 32 + Math.floor(rnd() * 44);
    const a = 0.22 + rnd() * 0.28;
    ctx.fillStyle = `rgba(${v},${v + 1},${v + 3},${a})`;
    const sz = 1.2 + rnd() * 2.4;
    ctx.fillRect(rnd() * S, rnd() * S, sz, sz);
  }

  // Realistic dusty sandy-earth Bangladesh road edge shoulders near curbs
  if (dustyShoulder) {
    const leftG = ctx.createLinearGradient(0, 0, 38, 0);
    leftG.addColorStop(0, 'rgba(116, 102, 82, 0.56)');
    leftG.addColorStop(1, 'rgba(116, 102, 82, 0)');
    ctx.fillStyle = leftG;
    ctx.fillRect(0, 0, 38, S);
    const rightG = ctx.createLinearGradient(S, 0, S - 38, 0);
    rightG.addColorStop(0, 'rgba(116, 102, 82, 0.56)');
    rightG.addColorStop(1, 'rgba(116, 102, 82, 0)');
    ctx.fillStyle = rightG;
    ctx.fillRect(S - 38, 0, 38, S);
  }

  // Solid painted white edge markings
  if (edgeStripe) {
    ctx.fillStyle = edgeStripe;
    ctx.fillRect(24, 0, 7, S);
    ctx.fillRect(S - 31, 0, 7, S);
  }

  // Crisp dashed centerline (yellow for N7 Highway, white for Ahsan Ahmed Rd)
  if (centerStripe) {
    ctx.fillStyle = centerStripe;
    const cw = 12;
    const cx = Math.floor(S * 0.5 - cw * 0.5);
    ctx.fillRect(cx, 28, cw, 168);
    ctx.fillRect(cx, 284, cw, 168);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function createPtiBank(m) {
  const mkPlaster = (hex, seedVal, rough = 0.80, opts = {}) => {
    const tex = makePlasterTexture(hex, seedVal, opts);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: rough, metalness: 0.03, envMapIntensity: 0.7 });
    attachDerivedPBRMaps(mat, tex, { strength: opts.subtleBrick ? 2.2 : 1.6, roughBase: rough, normalScale: 0.62 });
    return mat;
  };

  const mkPitchMat = (opts, polyFactor = -2) => {
    const tex = makeBangladeshiPitchRoadTexture(opts);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.74,
      metalness: 0.06,
      envMapIntensity: 0.55,
      polygonOffset: true,
      polygonOffsetFactor: polyFactor,
      polygonOffsetUnits: polyFactor,
    });
    attachDerivedPBRMaps(mat, tex, { strength: 2.1, roughBase: 0.74, normalScale: 0.68 });
    return mat;
  };

  const pitchJunctionMat = mkPitchMat({ seedVal: 841, centerStripe: null, edgeStripe: null, dustyShoulder: false }, -3);
  pitchJunctionMat.map.repeat.set(4.5, 4.5);
  const pitchHighwayMat = mkPitchMat({ seedVal: 843, centerStripe: 'rgba(250, 204, 21, 0.88)', edgeStripe: 'rgba(241, 245, 249, 0.76)', dustyShoulder: true }, -2);
  const pitchAhsanMat = mkPitchMat({ seedVal: 845, centerStripe: 'rgba(241, 245, 249, 0.82)', edgeStripe: 'rgba(241, 245, 249, 0.62)', dustyShoulder: true }, -2);
  const pitchLaneMat = mkPitchMat({ seedVal: 847, centerStripe: null, edgeStripe: null, dustyShoulder: true }, -2);

  const yellowBlackCurbTex = makeCurbStripeTexture('#facc15', '#18181b');
  yellowBlackCurbTex.repeat.set(7, 1);
  const redWhiteCurbTex = makeCurbStripeTexture('#dc2626', '#f8fafc');
  redWhiteCurbTex.repeat.set(6, 1);

  const redBrickTex = makeRedBrickFootpathTexture(819);
  const redBrickFootpathMat = new THREE.MeshStandardMaterial({ map: redBrickTex, roughness: 0.84, metalness: 0.02 });
  attachDerivedPBRMaps(redBrickFootpathMat, redBrickTex, { strength: 2.3, roughBase: 0.84, normalScale: 0.68 });

  const interiorTileTex = makeInteriorTileTexture('#e8e2d5', '#b9b1a3');
  const interiorTileMat = new THREE.MeshStandardMaterial({ map: interiorTileTex, roughness: 0.42, metalness: 0.04 });

  const taltolaRoad = m?.road || pitchJunctionMat;
  const bank = {
    asphalt: taltolaRoad,
    pitchJunction: taltolaRoad,
    pitchHighway: taltolaRoad,
    pitchAhsan: taltolaRoad,
    pitchLane: taltolaRoad,
    footpath: redBrickFootpathMat, // Red brick walkable footpath!
    interiorFloor: interiorTileMat,
    brick: m.brick || mkPlaster('#9b4634', 811, 0.88, { subtleBrick: true }),
    concrete: m.concrete || mkPlaster('#a8a69e', 812, 0.88),
    darkConcrete: m.darkConcrete || mkPlaster('#4b4f52', 813, 0.90),
    ptiCream: mkPlaster('#f3ead8', 821, 0.76),
    ptiTerracotta: mkPlaster('#b24b37', 822, 0.82, { subtleBrick: true }),
    ptiEmerald: mkPlaster('#0f5132', 823, 0.68),
    chineseRed: mkPlaster('#8c1515', 831, 0.56),
    stJosephRed: mkPlaster('#a83b2d', 832, 0.78, { subtleBrick: true }),
    coffeeEspresso: mkPlaster('#3c2418', 833, 0.68),
    warmOchre: mkPlaster('#cfa062', 824, 0.80),
    sandWall: mkPlaster('#dcc4a0', 825, 0.78),
    paleBlue: mkPlaster('#bdd2e6', 826, 0.76),
    modernWhite: mkPlaster('#eef2f6', 827, 0.68),
    interiorWall: mkPlaster('#f5f1e8', 838, 0.82, { darkStreak: 0.04 }),
    sageWall: mkPlaster('#9db3a6', 828, 0.80),
    slateTrim: mkPlaster('#334155', 829, 0.62),
    teakWood: new THREE.MeshStandardMaterial({ color: 0x7c4a24, roughness: 0.72, metalness: 0.04 }),
    lightWood: new THREE.MeshStandardMaterial({ color: 0xc89963, roughness: 0.70, metalness: 0.04 }),
    bedSheetBlue: new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.85 }),
    bedSheetMaroon: new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.85 }),
    pillowWhite: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.88 }),
    chalkboardGreen: new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.82 }),
    whiteboardMat: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.05 }),
    copierBody: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.36, metalness: 0.14 }),
    copierDark: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.35 }),
    pcScreenGlow: new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.95, roughness: 0.2 }),
    copierLedGreen: new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x22c55e, emissiveIntensity: 1.8 }),
    shoeRed: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.48 }),
    shoeBlue: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.48 }),
    shoeBlack: new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.36 }),
    shoeBrown: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.52 }),
    shoeWhite: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.45 }),
    shoeYellow: new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.50 }),
    marbleWhite: new THREE.MeshPhysicalMaterial({ color: 0xf4f1ea, roughness: 0.24, metalness: 0.05, clearcoat: 0.7 }),
    curbYellowBlack: new THREE.MeshStandardMaterial({ map: yellowBlackCurbTex, roughness: 0.76 }),
    curbRedWhite: new THREE.MeshStandardMaterial({ map: redWhiteCurbTex, roughness: 0.76 }),
    roadLineWhite: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.78, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }),
    roadLineYellow: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.78 }),
    awningGreen: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.64, metalness: 0.12 }),
    awningBlue: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.62, metalness: 0.14 }),
    awningRed: new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.64, metalness: 0.12 }),
    steelDark: new THREE.MeshStandardMaterial({ color: 0x1e252c, roughness: 0.44, metalness: 0.74 }),
    aluminum: new THREE.MeshStandardMaterial({ color: 0xd1dae2, roughness: 0.24, metalness: 0.88 }),
    goldMetal: new THREE.MeshPhysicalMaterial({ color: 0xf5b82e, roughness: 0.22, metalness: 0.86, clearcoat: 0.65 }),
    gateIron: new THREE.MeshStandardMaterial({ color: 0x164e3f, roughness: 0.38, metalness: 0.72 }),
    glassCurtain: new THREE.MeshPhysicalMaterial({ color: 0x163d57, roughness: 0.08, metalness: 0.24, clearcoat: 0.94 }),
    glassClear: new THREE.MeshPhysicalMaterial({ color: 0xcbe8f6, roughness: 0.08, metalness: 0.12, transparent: true, opacity: 0.34 }),
    glassLobby: new THREE.MeshPhysicalMaterial({ color: 0x1e4c68, roughness: 0.08, metalness: 0.18, transparent: true, opacity: 0.55 }),
    warmWindowLit: new THREE.MeshStandardMaterial({ color: 0xffebb8, emissive: 0xffcf70, emissiveIntensity: 0.30, roughness: 0.24 }),
    coolWindowLit: new THREE.MeshStandardMaterial({ color: 0xe0f2fe, emissive: 0x7dd3fc, emissiveIntensity: 0.26, roughness: 0.24 }),
    tubeLightGlow: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfefce8, emissiveIntensity: 1.65, roughness: 0.2 }),
    lanternGlow: new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 1.4, roughness: 0.28 }),
    grassTurf: new THREE.MeshStandardMaterial({ color: 0x357a38, roughness: 0.94 }),
    flowerRed: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.82 }),
    flowerGold: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.82 }),
    policeBlue: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.45, metalness: 0.15 }),
    policeShirt: new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.72 }),
    policeNavy: new THREE.MeshStandardMaterial({ color: 0x172554, roughness: 0.75 }),
    policeVest: new THREE.MeshStandardMaterial({ color: 0xa3e635, emissive: 0x65a30d, emissiveIntensity: 0.32, roughness: 0.45 }),
    policeSkin: new THREE.MeshStandardMaterial({ color: 0xc68652, roughness: 0.68 }),
    policeBatonGlow: new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff1e1e, emissiveIntensity: 1.8, roughness: 0.25 }),
    lampGlow: new THREE.MeshStandardMaterial({ color: 0xfff8e6, emissive: 0xffd98a, emissiveIntensity: 0.85 }),
    uplightCyan: new THREE.MeshStandardMaterial({ color: 0xbae6fd, emissive: 0x38bdf8, emissiveIntensity: 0.65 }),
    acBox: mkPlaster('#dde2e6', 899, 0.50, { darkStreak: 0.03 }),
    waterTank: new THREE.MeshPhysicalMaterial({ color: 0x12181f, roughness: 0.40, clearcoat: 0.35 }),
    tireBlack: new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: 0.88 }),
    wireMat: m.wire || new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 }),
    emissiveList: [],
  };

  bank.emissiveList.push(
    { mat: bank.warmWindowLit, day: 0.22, night: 1.80 },
    { mat: bank.coolWindowLit, day: 0.18, night: 1.60 },
    { mat: bank.tubeLightGlow, day: 1.10, night: 2.30 },
    { mat: bank.lanternGlow, day: 0.95, night: 2.80 },
    { mat: bank.lampGlow, day: 0.65, night: 3.30 },
    { mat: bank.uplightCyan, day: 0.35, night: 2.55 },
    { mat: bank.policeBatonGlow, day: 1.40, night: 3.20 },
  );

  return bank;
}

/* ============================================================================
 * SOLID PHYSICS & WALKABLE FOOTPATH/INTERIOR SLAB REGISTRY
 * ========================================================================== */
function createPhysicsRegistry() {
  const circles = [];
  const obbs = [];
  const walkableSlabs = [];
  let ptiGateOpenRatio = 0;
  let sjGateOpenRatio = 0;
  const ptiGateCollider = { cx: -291.5, cz: -66.0, hx: 0.35, hz: 2.8, cos: 1, sin: 0, maxH: 3.2 };
  const sjGateCollider = { cx: -292.6, cz: -130.0, hx: 0.35, hz: 3.1, cos: 1, sin: 0, maxH: 3.4 };

  function addCircle(x, z, r, maxH = 12.0) {
    circles.push({ x, z, r, maxH });
  }

  function addOBB(cx, cz, width, depth, rotY = 0, maxH = 24.0) {
    obbs.push({
      cx,
      cz,
      hx: width * 0.5,
      hz: depth * 0.5,
      cos: Math.cos(rotY),
      sin: Math.sin(rotY),
      maxH,
    });
  }

  function addLocalOBB(baseX, baseZ, rotY, lx, lz, width, depth, maxH = 24.0) {
    const c = Math.cos(rotY);
    const s = Math.sin(rotY);
    addOBB(baseX + lx * c + lz * s, baseZ - lx * s + lz * c, width, depth, rotY, maxH);
  }

  function addWalkableSlab(cx, cz, width, depth, rotY = 0, topY = FOOTPATH_H) {
    walkableSlabs.push({
      cx,
      cz,
      hx: width * 0.5,
      hz: depth * 0.5,
      cos: Math.cos(rotY),
      sin: Math.sin(rotY),
      topY,
    });
  }

  function setGateRatios(ptiR, sjR) {
    ptiGateOpenRatio = ptiR;
    sjGateOpenRatio = sjR;
  }

  function getGroundHeight(pos) {
    const dxC = pos.x - PTI_MORE_CENTER.x;
    const dzC = pos.z - PTI_MORE_CENTER.z;
    if (dxC * dxC + dzC * dzC > 195 * 195) return 0.0;

    let bestY = 0.0;
    for (let i = 0; i < walkableSlabs.length; i++) {
      const s = walkableSlabs[i];
      const dx = pos.x - s.cx;
      const dz = pos.z - s.cz;
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
    const maxExtent = b.hx + b.hz + radius + 0.5;
    if (Math.abs(dx) > maxExtent || Math.abs(dz) > maxExtent) return;

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
    const dxC = pos.x - PTI_MORE_CENTER.x;
    const dzC = pos.z - PTI_MORE_CENTER.z;
    if (dxC * dxC + dzC * dzC > 195 * 195) return;

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
          const push = minD - d;
          pos.x += (dx / d) * push;
          pos.z += (dz / d) * push;
        } else {
          pos.x += minD;
        }
      }
    }

    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < obbs.length; i++) {
        resolveOBB(pos, radius, footY, obbs[i]);
      }
      if (ptiGateOpenRatio < 0.55) resolveOBB(pos, radius, footY, ptiGateCollider);
      if (sjGateOpenRatio < 0.55) resolveOBB(pos, radius, footY, sjGateCollider);
    }
  }

  return { addCircle, addOBB, addLocalOBB, addWalkableSlab, setGateRatios, getGroundHeight, applyCollisions };
}

function addSignBox(dynamicG, bank, opts, pos, rotY, w, h) {
  const tex = makeLightBoxTexture(opts);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: 0.40,
    roughness: 0.28,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });
  bank.emissiveList.push({ mat, day: 0.36, night: 1.50 });
  const grp = new THREE.Group();
  grp.position.set(pos[0], pos[1], pos[2]);
  grp.rotation.y = rotY;
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.12), bank.steelDark);
  const face = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.145), mat);
  grp.add(bezel, face);
  dynamicG.add(grp);
  return grp;
}

function addRotBox(parent, size, pos, mat, rotY = 0, opts = {}) {
  const mesh = box(parent, size, pos, mat, opts);
  if (rotY) mesh.rotation.y = rotY;
  return mesh;
}

function addCeilingFan(parent, bank, x, y, z) {
  cylinder(parent, 0.024, 0.024, 0.36, [x, y - 0.18, z], bank.steelDark, 6);
  cylinder(parent, 0.12, 0.12, 0.07, [x, y - 0.38, z], bank.modernWhite, 8);
  for (let b = 0; b < 3; b++) {
    const a = (b / 3) * Math.PI * 2;
    addRotBox(parent, [0.54, 0.018, 0.11], [x + Math.cos(a) * 0.32, y - 0.38, z + Math.sin(a) * 0.32], bank.modernWhite, -a);
  }
}

/* ============================================================================
 * DETAILED ENTERABLE INTERIOR FURNISHERS (ZERO NPCs — PURE HIGH-DETAIL PROPS)
 * ========================================================================== */

/**
 * 1) PHOTOCOPY & COMPUTER SHOP INTERIOR (ফটোকপি মেশিন ও কম্পিউটার দোকান)
 *    3D Xerox/Photocopy machines with scanner lid & paper stacks + Desktop Computers + Printers!
 */
function furnishPhotocopyComputerShop(g, dg, bank, x0, x1, z0, z1, floorY, ceilY) {
  const cx = (x0 + x1) * 0.5;
  const cz = (z0 + z1) * 0.5;
  const w = x1 - x0;

  // Ceiling LED Tube Lights + Fan
  box(dg, [Math.min(w - 1.2, 2.2), 0.06, 0.12], [cx, ceilY - 0.08, cz], bank.tubeLightGlow, { castShadow: false });
  addCeilingFan(g, bank, cx, ceilY, cz + 0.6);

  // Two Heavy-Duty Commercial 3D Photocopy / Xerox Machines along back wall!
  for (const mx of [cx - 1.5, cx + 0.3]) {
    const mz = z0 + 1.05;
    // Main cabinet + 3 paper trays
    box(g, [1.05, 0.92, 0.78], [mx, floorY + 0.46, mz], bank.copierBody);
    box(g, [0.82, 0.16, 0.04], [mx, floorY + 0.24, mz + 0.39], bank.copierDark);
    box(g, [0.82, 0.16, 0.04], [mx, floorY + 0.46, mz + 0.39], bank.copierDark);
    box(g, [0.82, 0.16, 0.04], [mx, floorY + 0.68, mz + 0.39], bank.copierDark);
    // Scanner glass bed + raised document feeder lid
    box(g, [0.96, 0.04, 0.66], [mx, floorY + 0.94, mz], bank.glassCurtain);
    box(g, [0.98, 0.12, 0.68], [mx, floorY + 1.04, mz - 0.04], bank.copierDark);
    // Side paper output tray + control panel with glowing green ready LED
    box(g, [0.42, 0.05, 0.44], [mx + 0.68, floorY + 0.76, mz], bank.copierDark);
    box(g, [0.28, 0.08, 0.22], [mx + 0.34, floorY + 0.96, mz + 0.30], bank.copierDark);
    box(dg, [0.06, 0.04, 0.04], [mx + 0.36, floorY + 1.01, mz + 0.36], bank.copierLedGreen, { castShadow: false });
    // Stacks of white A4 paper reams beside copier
    box(g, [0.28, 0.24, 0.34], [mx - 0.72, floorY + 0.12, mz], bank.pillowWhite);
    box(g, [0.28, 0.18, 0.34], [mx - 0.72, floorY + 0.33, mz], bank.pillowWhite);
  }

  // Long Computer Workstations Counter along Left/Right side with 3 Glowing Desktop PCs!
  const deskX = x0 + 0.75;
  box(g, [0.85, 0.76, (z1 - z0) - 2.6], [deskX, floorY + 0.38, cz - 0.2], bank.lightWood);
  for (let i = 0; i < 3; i++) {
    const pz = z0 + 2.2 + i * 1.85;
    if (pz > z1 - 1.4) break;
    // Widescreen Monitor + Stand + Glowing Desktop Screen
    box(g, [0.06, 0.36, 0.56], [deskX - 0.18, floorY + 1.02, pz], bank.copierDark);
    box(dg, [0.03, 0.30, 0.50], [deskX - 0.14, floorY + 1.02, pz], bank.pcScreenGlow, { castShadow: false });
    box(g, [0.14, 0.10, 0.14], [deskX - 0.18, floorY + 0.81, pz], bank.copierDark);
    // Keyboard + Mouse + CPU Tower
    box(g, [0.18, 0.025, 0.40], [deskX + 0.14, floorY + 0.78, pz], bank.copierDark);
    box(g, [0.09, 0.025, 0.06], [deskX + 0.14, floorY + 0.78, pz + 0.28], bank.copierDark);
    box(g, [0.22, 0.44, 0.42], [deskX - 0.10, floorY + 0.98, pz - 0.56], bank.steelDark);
    // Operator Chair in front of PC
    box(g, [0.46, 0.07, 0.46], [deskX + 0.76, floorY + 0.44, pz], bank.copierDark);
    box(g, [0.07, 0.46, 0.44], [deskX + 0.96, floorY + 0.68, pz], bank.copierDark);
    cylinder(g, 0.035, 0.045, 0.42, [deskX + 0.76, floorY + 0.21, pz], bank.steelDark, 6);
  }

  // Front Service Counter + Color Inkjet Printer & Spiral Binding Machine
  box(g, [w * 0.45, 0.92, 0.68], [x1 - w * 0.28, floorY + 0.46, z1 - 1.8], bank.teakWood);
  box(g, [0.48, 0.22, 0.36], [x1 - w * 0.28, floorY + 1.03, z1 - 1.8], bank.copierDark);
}

/**
 * 2) SHOE SHOP INTERIOR (জুতার দোকান — Wall Display Racks with Pairs of 3D Shoes, Boxes & Try-on Bench)
 */
function furnishShoeShop(g, dg, bank, x0, x1, z0, z1, floorY, ceilY) {
  const cx = (x0 + x1) * 0.5;
  const cz = (z0 + z1) * 0.5;
  const w = x1 - x0;
  const shoeMats = [bank.shoeRed, bank.shoeBlue, bank.shoeBlack, bank.shoeBrown, bank.shoeWhite, bank.shoeYellow];

  box(dg, [Math.min(w - 1.2, 2.4), 0.06, 0.12], [cx, ceilY - 0.08, cz], bank.tubeLightGlow, { castShadow: false });
  addCeilingFan(g, bank, cx, ceilY, cz);

  // Back Wall Multi-Tier Shoe Display Rack packed with colorful 3D shoe pairs!
  const backZ = z0 + 0.42;
  box(g, [w - 0.8, 2.35, 0.42], [cx, floorY + 1.18, backZ], bank.modernWhite);
  for (let tier = 0; tier < 4; tier++) {
    const sy = floorY + 0.52 + tier * 0.48;
    box(g, [w - 0.9, 0.04, 0.46], [cx, sy, backZ + 0.08], bank.lightWood);
    let idx = tier * 3;
    for (let sx = x0 + 0.9; sx <= x1 - 0.9; sx += 0.85) {
      const sm = shoeMats[idx % shoeMats.length];
      idx++;
      // Pair of 3D shoes (left + right sole & upper)
      for (const off of [-0.11, 0.11]) {
        box(g, [0.11, 0.05, 0.26], [sx + off, sy + 0.045, backZ + 0.12], bank.pillowWhite);
        box(g, [0.10, 0.09, 0.20], [sx + off, sy + 0.10, backZ + 0.09], sm);
      }
    }
  }

  // Left & Right Side Wall Shoe Racks + Stacked Shoe Boxes underneath
  for (const side of [-1, 1]) {
    const rx = side < 0 ? (x0 + 0.42) : (x1 - 0.42);
    box(g, [0.40, 2.20, (z1 - z0) - 2.6], [rx, floorY + 1.10, cz - 0.2], bank.modernWhite);
    for (let tier = 0; tier < 3; tier++) {
      const sy = floorY + 0.72 + tier * 0.50;
      for (let sz = z0 + 1.4; sz <= z1 - 2.0; sz += 0.95) {
        const sm = shoeMats[Math.abs(Math.round(sz + tier)) % shoeMats.length];
        box(g, [0.24, 0.09, 0.11], [rx - side * 0.10, sy + 0.06, sz - 0.09], sm);
        box(g, [0.24, 0.09, 0.11], [rx - side * 0.10, sy + 0.06, sz + 0.09], sm);
      }
    }
    // Stacked shoe boxes at bottom
    for (let sz = z0 + 1.5; sz <= z1 - 2.2; sz += 0.75) {
      box(g, [0.34, 0.18, 0.42], [rx - side * 0.08, floorY + 0.09, sz], bank.warmOchre);
      box(g, [0.34, 0.18, 0.42], [rx - side * 0.08, floorY + 0.28, sz], bank.ptiTerracotta);
    }
  }

  // Central Cushioned Customer Shoe Try-On Bench + Billing Counter
  box(g, [1.85, 0.42, 0.62], [cx, floorY + 0.21, cz + 0.4], bank.bedSheetMaroon);
  box(g, [1.4, 0.94, 0.62], [x1 - 1.2, floorY + 0.47, z1 - 1.6], bank.teakWood);
}

/**
 * 3) COACHING BATCH CLASSROOM INTERIOR (কোচিং ব্যাচ ক্লাসরুম)
 */
function furnishCoachingBatchRoom(g, dg, bank, x0, x1, z0, z1, floorY, ceilY, titleText = 'এসএসসি · এইচএসসি স্পেশাল ব্যাচ') {
  const cx = (x0 + x1) * 0.5;
  const cz = (z0 + z1) * 0.5;
  const w = x1 - x0;

  box(dg, [Math.min(w - 1.2, 2.4), 0.06, 0.12], [cx, ceilY - 0.08, cz - 1.0], bank.tubeLightGlow, { castShadow: false });
  box(dg, [Math.min(w - 1.2, 2.4), 0.06, 0.12], [cx, ceilY - 0.08, cz + 1.2], bank.tubeLightGlow, { castShadow: false });
  addCeilingFan(g, bank, cx, ceilY, cz);

  // Large Whiteboard on back wall + Teacher Desk
  box(g, [Math.min(w - 1.6, 3.6), 1.32, 0.08], [cx, floorY + 1.65, z0 + 0.24], bank.whiteboardMat);
  addSignBox(
    dg,
    bank,
    { title: titleText, subtitle: 'PHYSICS · MATH · CHEMISTRY · ENGLISH', bg: '#f8fafc', fg: '#0f172a', accent: '#1d4ed8', border: '#334155' },
    [cx, floorY + 1.65, z0 + 0.30],
    0,
    Math.min(w - 1.8, 3.4),
    1.18,
  );
  // Split AC above whiteboard
  box(g, [1.1, 0.30, 0.24], [cx, floorY + 2.85, z0 + 0.32], bank.acBox);
  // Teacher's Desk & Chair
  box(g, [1.35, 0.78, 0.68], [cx - 0.8, floorY + 0.39, z0 + 1.45], bank.teakWood);
  box(g, [0.46, 0.46, 0.46], [cx - 0.8, floorY + 0.23, z0 + 0.92], bank.steelDark);

  // 3 Rows of Student Coaching High-Desks & Sitting Benches
  const benchW = Math.min(w - 1.8, 4.4);
  for (let row = 0; row < 3; row++) {
    const rz = z0 + 2.75 + row * 1.55;
    if (rz > z1 - 1.4) break;
    box(g, [benchW, 0.06, 0.44], [cx, floorY + 0.74, rz], bank.teakWood);
    for (const lx of [-benchW * 0.44, benchW * 0.44]) {
      box(g, [0.06, 0.74, 0.42], [cx + lx, floorY + 0.37, rz], bank.steelDark);
      box(g, [0.06, 0.44, 0.32], [cx + lx, floorY + 0.22, rz + 0.46], bank.steelDark);
    }
    box(g, [benchW, 0.05, 0.32], [cx, floorY + 0.44, rz + 0.46], bank.lightWood);
    // Open notebooks on desk
    box(g, [0.28, 0.025, 0.20], [cx - 0.9, floorY + 0.78, rz], bank.pillowWhite);
    box(g, [0.28, 0.025, 0.20], [cx + 0.7, floorY + 0.78, rz], bank.pillowWhite);
  }
}

/**
 * 4) RESIDENTIAL HOUSE ROOM INTERIOR (বাড়ির কক্ষ — Bed, Wardrobe, Study Table, TV & Fan)
 */
function furnishResidentialRoom(g, dg, bank, x0, x1, z0, z1, floorY, ceilY) {
  const cx = (x0 + x1) * 0.5;
  const cz = (z0 + z1) * 0.5;
  const w = x1 - x0;

  box(dg, [1.8, 0.06, 0.12], [cx, ceilY - 0.08, cz], bank.tubeLightGlow, { castShadow: false });
  addCeilingFan(g, bank, cx, ceilY, cz);

  // Double Bed against back-left corner with Pillows & Blanket
  const bx = x0 + 1.65;
  const bz = z0 + 1.45;
  box(g, [2.10, 0.44, 1.85], [bx, floorY + 0.22, bz], bank.teakWood);
  box(g, [2.12, 1.05, 0.12], [bx, floorY + 0.52, bz - 0.90], bank.teakWood); // Headboard
  box(g, [1.96, 0.16, 1.72], [bx, floorY + 0.50, bz + 0.02], bank.bedSheetBlue);
  box(g, [0.58, 0.12, 0.36], [bx - 0.45, floorY + 0.62, bz - 0.56], bank.pillowWhite);
  box(g, [0.58, 0.12, 0.36], [bx + 0.45, floorY + 0.62, bz - 0.56], bank.pillowWhite);

  // Tall Wooden Wardrobe / Almirah against back-right wall
  box(g, [1.45, 2.15, 0.62], [x1 - 1.05, floorY + 1.075, z0 + 0.55], bank.teakWood);

  // Study Table + Chair + Wall TV
  box(g, [1.25, 0.76, 0.64], [x1 - 0.95, floorY + 0.38, cz + 0.65], bank.lightWood);
  box(g, [0.46, 0.44, 0.46], [x1 - 1.65, floorY + 0.22, cz + 0.65], bank.steelDark);
  box(g, [0.08, 0.78, 1.35], [x0 + 0.22, floorY + 1.55, cz + 0.85], bank.copierDark);
  box(dg, [0.04, 0.68, 1.24], [x0 + 0.26, floorY + 1.55, cz + 0.85], bank.pcScreenGlow, { castShadow: false });
}

/**
 * 5) RESTAURANT / CAFE / BAKERY / PHARMACY / BOOKSHOP INTERIOR
 */
function furnishRestaurantOrShop(g, dg, bank, x0, x1, z0, z1, floorY, ceilY, kind = 'restaurant') {
  const cx = (x0 + x1) * 0.5;
  const cz = (z0 + z1) * 0.5;
  const w = x1 - x0;

  box(dg, [Math.min(w - 1.2, 2.4), 0.06, 0.12], [cx, ceilY - 0.08, cz], bank.tubeLightGlow, { castShadow: false });
  addCeilingFan(g, bank, cx, ceilY, cz);

  if (kind === 'pharmacy' || kind === 'books') {
    // Wall shelves packed with colorful medicine boxes or books
    const itemCols = [bank.shoeRed, bank.shoeBlue, bank.ptiEmerald, bank.shoeYellow, bank.modernWhite];
    box(g, [w - 0.8, 2.35, 0.42], [cx, floorY + 1.18, z0 + 0.42], bank.modernWhite);
    for (let t = 0; t < 4; t++) {
      const sy = floorY + 0.52 + t * 0.46;
      for (let sx = x0 + 0.8; sx <= x1 - 0.8; sx += 0.42) {
        box(g, [0.24, 0.28, 0.22], [sx, sy + 0.12, z0 + 0.52], itemCols[Math.abs(Math.round(sx * 3 + t)) % itemCols.length]);
      }
    }
    // Front Glass Sales Counter
    box(g, [w - 1.6, 0.98, 0.65], [cx, floorY + 0.49, cz + 0.6], bank.teakWood);
    box(g, [w - 1.7, 0.35, 0.68], [cx, floorY + 0.80, cz + 0.6], bank.glassClear);
    return;
  }

  // Restaurant / Cafe / Chinese / Bakery Counter + Dining Tables & Chairs
  const counterMat = kind === 'chinese' ? bank.chineseRed : (kind === 'cafe' ? bank.coffeeEspresso : bank.teakWood);
  box(g, [w - 1.4, 1.02, 0.78], [cx, floorY + 0.51, z0 + 0.85], counterMat);
  if (kind === 'bakery') {
    box(g, [w - 1.6, 0.55, 0.72], [cx, floorY + 1.25, z0 + 0.85], bank.glassClear);
  }
  const tableCol = kind === 'chinese' ? bank.bedSheetMaroon : bank.lightWood;
  const cols = w > 7.5 ? 2 : 1;
  for (let ci = 0; ci < cols; ci++) {
    const tx = cols === 2 ? (cx + (ci === 0 ? -1.8 : 1.8)) : cx;
    for (let ri = 0; ri < 2; ri++) {
      const tz = z0 + 2.75 + ri * 2.15;
      if (tz > z1 - 1.5) break;
      box(g, [1.25, 0.07, 0.85], [tx, floorY + 0.76, tz], tableCol);
      cylinder(g, 0.06, 0.08, 0.74, [tx, floorY + 0.37, tz], bank.steelDark, 6);
      for (const czOff of [-0.62, 0.62]) {
        box(g, [0.42, 0.44, 0.42], [tx, floorY + 0.22, tz + czOff], bank.teakWood);
      }
    }
  }
}

/* ============================================================================
 * 1. PTI MORE JUNCTION, CENTRAL ISLAND, RAISED RED-BRICK FOOTPATHS & N7 GANTRY
 * ========================================================================== */
function addSidewalkAlongPolyline(staticG, bank, phys, pts, roadHalfW, sideSign, {
  walkWidth = 1.85,
  curbMat = bank.curbYellowBlack,
} = {}) {
  const walkH = FOOTPATH_H;
  const offset = roadHalfW + walkWidth * 0.5 + 0.10;
  const curbOffset = roadHalfW + 0.12;

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

    // Raised Red-Brick Walkable Footpath (0.24m tall, micro-staggered per segment so curved joints never Z-fight!)
    const segH = walkH + (i % 2) * 0.002;
    addRotBox(staticG, [walkWidth, segH, segLen + 0.45], [sx, segH * 0.5, sz], bank.footpath, yaw, {
      castShadow: false,
      uvScale: 1.6,
    });
    phys.addWalkableSlab(sx, sz, walkWidth + 0.45, segLen + 0.6, yaw, walkH);
    addRotBox(
      staticG,
      [0.24, segH + 0.02, segLen + 0.48],
      [mx + perpX * sideSign * curbOffset, (segH + 0.02) * 0.5, mz + perpZ * sideSign * curbOffset],
      curbMat,
      yaw,
      { castShadow: false },
    );
  }
}

function addZebraCrosswalk(parent, bank, cx, cz, yaw, roadWidth = 8.4) {
  const grp = new THREE.Group();
  grp.position.set(cx, 0.005, cz);
  grp.rotation.y = yaw;
  const count = Math.floor(roadWidth / 0.90);
  const start = -((count - 1) * 0.90) * 0.5;
  for (let i = 0; i < count; i++) {
    box(grp, [0.44, 0.004, 2.25], [start + i * 0.90, 0, 0], bank.roadLineWhite, { castShadow: false });
  }
  parent.add(grp);
}

/**
 * Builds one continuous, ZERO-Z-fighting Taltola-style wet-asphalt road ribbon flush at yTop = 0.002!
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

function addDoubleArmLamp(staticG, dynamicG, bank, x, z, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  cylinder(g, 0.09, 0.14, 7.2, [0, 3.6, 0], bank.aluminum, 8);
  cylinder(g, 0.20, 0.24, 0.32, [0, 0.16, 0], bank.darkConcrete, 8);
  for (const sx of [-1, 1]) {
    box(g, [1.45, 0.07, 0.08], [sx * 0.72, 7.05, 0], bank.aluminum);
    box(g, [0.44, 0.10, 0.20], [sx * 1.38, 7.12, 0], bank.steelDark);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.15), bank.lampGlow);
    bulb.position.set(
      x + Math.cos(rotY) * (sx * 1.38),
      7.05,
      z - Math.sin(rotY) * (sx * 1.38),
    );
    bulb.rotation.y = rotY;
    dynamicG.add(bulb);
  }
  staticG.add(g);
}

function buildPtiJunctionAndFootpaths(staticG, dynamicG, bank, phys) {
  // Single flat Taltola-style wet-asphalt Junction Circle flush at ground level (y = 0.003m)
  const jDiscGeo = new THREE.CircleGeometry(16.8, 48);
  jDiscGeo.rotateX(-Math.PI * 0.5);
  const jPos = jDiscGeo.attributes.position;
  const jUv = jDiscGeo.attributes.uv;
  for (let i = 0; i < jPos.count; i++) {
    jUv.setXY(i, (-307.2 + jPos.getX(i)) / 5.5, (-48.0 + jPos.getZ(i)) / 5.5);
  }
  jUv.needsUpdate = true;
  const jDisc = new THREE.Mesh(jDiscGeo, bank.pitchJunction);
  jDisc.position.set(-307.2, 0.003, -48.0);
  jDisc.receiveShadow = true;
  staticG.add(jDisc);

  // Central PTI More Roundabout Island (-307.2, -48.0, radius 3.05m) — 100% SOLID!
  const IX = -307.2;
  const IZ = -48.0;
  phys.addCircle(IX, IZ, 3.15, 7.5);

  cylinder(staticG, 3.05, 3.18, 0.30, [IX, 0.22, IZ], bank.curbYellowBlack, 24);
  cylinder(staticG, 2.75, 2.86, 0.38, [IX, 0.28, IZ], bank.marbleWhite, 24);
  cylinder(staticG, 2.35, 2.45, 0.46, [IX, 0.33, IZ], bank.grassTurf, 20);

  cylinder(staticG, 0.85, 1.05, 0.85, [IX, 0.87, IZ], bank.ptiTerracotta, 8);
  cylinder(staticG, 0.55, 0.72, 1.45, [IX, 1.92, IZ], bank.marbleWhite, 8);
  cylinder(staticG, 0.18, 0.24, 3.85, [IX, 4.52, IZ], bank.steelDark, 10);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
    const gx = IX + Math.cos(a) * 0.88;
    const gz = IZ + Math.sin(a) * 0.88;
    rodBetween(staticG, [IX, 6.02, IZ], [gx, 6.29, gz], 0.04, bank.steelDark, 6);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), bank.lampGlow);
    globe.position.set(gx, 6.45, gz);
    dynamicG.add(globe);
  }
  const topFinial = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), bank.goldMetal);
  topFinial.position.set(IX, 6.62, IZ);
  staticG.add(topFinial);

  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    cylinder(staticG, 0.045, 0.055, 0.72, [IX + Math.cos(a) * 2.68, 0.73, IZ + Math.sin(a) * 2.68], bank.steelDark, 6);
    if (i % 2 === 0) {
      box(
        staticG,
        [0.48, 0.34, 0.48],
        [IX + Math.cos(a) * 1.65, 0.63, IZ + Math.sin(a) * 1.65],
        i % 4 === 0 ? bank.flowerRed : bank.flowerGold,
      );
    }
  }

  // Clean, Non-Overlapping Bangladeshi Pitch-Asphalt Road Arms (y = 0.052m, cleanly bridging outside city roads to the 16.8m junction circle!)
  const kjaSePts = [[-252.0, 16.0], [-284.0, -22.0], [-298.5, -36.5]];
  addPitchRoadAlongPolyline(staticG, [[-236.0, 34.0], ...kjaSePts], 6.0, bank.pitchHighway, 0.002);
  addSidewalkAlongPolyline(staticG, bank, phys, kjaSePts, 5.8, 1, { walkWidth: 1.9, curbMat: bank.curbYellowBlack });
  addSidewalkAlongPolyline(staticG, bank, phys, kjaSePts, 5.8, -1, { walkWidth: 1.9, curbMat: bank.curbYellowBlack });

  const kjaNwPts = [[-321.0, -52.0], [-338.0, -61.8], [-372.0, -82.0]];
  addPitchRoadAlongPolyline(staticG, [...kjaNwPts, [-390.0, -93.0]], 5.9, bank.pitchHighway, 0.002);
  addSidewalkAlongPolyline(staticG, bank, phys, kjaNwPts, 5.7, 1, { walkWidth: 1.9, curbMat: bank.curbYellowBlack });
  addSidewalkAlongPolyline(staticG, bank, phys, kjaNwPts, 5.7, -1, { walkWidth: 1.9, curbMat: bank.curbYellowBlack });

  const ahsanPts = [[-299.6, -59.5], [-298.9, -76.0], [-298.3, -95.0], [-301.5, -162.0], [-304.7, -230.0]];
  addPitchRoadAlongPolyline(staticG, [...ahsanPts, [-305.5, -244.0]], 4.05, bank.pitchAhsan, 0.002);
  addSidewalkAlongPolyline(staticG, bank, phys, ahsanPts, 3.85, 1, { walkWidth: 1.95, curbMat: bank.curbRedWhite });
  addSidewalkAlongPolyline(staticG, bank, phys, ahsanPts, 3.85, -1, { walkWidth: 1.95, curbMat: bank.curbRedWhite });

  const miaPts = [[-313.8, -34.0], [-313.4, -10.0], [-313.1, 14.0]];
  addPitchRoadAlongPolyline(staticG, [...miaPts, [-312.8, 28.0]], 2.55, bank.pitchLane, 0.002);
  addSidewalkAlongPolyline(staticG, bank, phys, miaPts, 2.35, 1, { walkWidth: 1.55, curbMat: bank.curbYellowBlack });
  addSidewalkAlongPolyline(staticG, bank, phys, miaPts, 2.35, -1, { walkWidth: 1.55, curbMat: bank.curbYellowBlack });

  const seYaw = Math.atan2(-298.5 - -252.0, -36.5 - 16.0);
  const nwYaw = Math.atan2(-372.0 - -321.0, -82.0 - -52.0);
  addZebraCrosswalk(staticG, bank, -296.5, -35.8, seYaw, 10.6);
  addZebraCrosswalk(staticG, bank, -321.5, -52.5, nwYaw, 10.2);
  addZebraCrosswalk(staticG, bank, -299.5, -60.0, 0.03, 7.0);
  addZebraCrosswalk(staticG, bank, -313.6, -34.2, 0.02, 4.2);
  addZebraCrosswalk(staticG, bank, -300.0, -130.0, 0.04, 7.0);

  // Overhead Steel Directional Highway Gantry on Khan Jahan Ali Rd SE Approach
  const gx = -290.5;
  const gz = -29.2;
  const gPerpX = Math.cos(seYaw);
  const gPerpZ = -Math.sin(seYaw);
  for (const side of [-7.0, 7.0]) {
    const px = gx + gPerpX * side;
    const pz = gz + gPerpZ * side;
    cylinder(staticG, 0.20, 0.26, 6.6, [px, 3.3, pz], bank.steelDark, 10);
    phys.addCircle(px, pz, 0.28, 6.6);
  }
  addRotBox(staticG, [14.6, 0.34, 0.38], [gx, 6.28, gz], bank.steelDark, seYaw);
  addSignBox(
    dynamicG,
    bank,
    {
      title: 'পিটিআই মোড় (PTI MORE) · খুলনা N7',
      subtitle: '← রয়্যাল মোড় / পিটিআই মসজিদ  |  ↑ আহসান আহমেদ রোড (সেন্ট জোসেফ)  |  → হাজী মহসিন রোড',
      bg: '#065f46',
      accent: '#fef08a',
      width: 680,
      height: 176,
    },
    [gx, 6.55, gz],
    seYaw,
    9.4,
    1.82,
  );
}

/* ============================================================================
 * 2. ANIMATED 3D KMP TRAFFIC POLICE OFFICER ON DUTY AT PTI MORE CORNER
 * ========================================================================== */
function buildStandingTrafficPolice(dynamicG, bank, phys, x, z, rotY = 0.55) {
  phys.addCircle(x, z, 0.48, 2.0);
  const officer = new THREE.Group();
  officer.position.set(x, FOOTPATH_H, z);
  officer.rotation.y = rotY;
  dynamicG.add(officer);

  cylinder(officer, 0.44, 0.50, 0.10, [0, 0.05, 0], bank.curbYellowBlack, 16);
  for (const sx of [-0.11, 0.11]) {
    box(officer, [0.11, 0.12, 0.22], [sx, 0.16, 0.03], bank.tireBlack);
    cylinder(officer, 0.068, 0.078, 0.78, [sx, 0.58, 0], bank.policeNavy, 8);
  }
  box(officer, [0.34, 0.07, 0.20], [0, 0.99, 0], bank.tireBlack);
  box(officer, [0.07, 0.06, 0.215], [0, 0.99, 0], bank.aluminum);

  const torso = new THREE.Group();
  torso.position.set(0, 1.02, 0);
  officer.add(torso);
  box(torso, [0.34, 0.48, 0.20], [0, 0.24, 0], bank.policeShirt);
  box(torso, [0.36, 0.42, 0.22], [0, 0.23, 0], bank.policeVest);
  box(torso, [0.37, 0.045, 0.23], [0, 0.14, 0], bank.aluminum);
  box(torso, [0.37, 0.045, 0.23], [0, 0.30, 0], bank.aluminum);
  for (const sx of [-0.16, 0.16]) {
    box(torso, [0.08, 0.03, 0.10], [sx, 0.48, 0], bank.policeNavy);
  }

  const head = new THREE.Group();
  head.position.set(0, 0.54, 0);
  torso.add(head);
  cylinder(head, 0.052, 0.058, 0.10, [0, 0.02, 0], bank.policeSkin, 8);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 10), bank.policeSkin);
  skull.position.set(0, 0.13, 0);
  head.add(skull);
  box(head, [0.16, 0.042, 0.06], [0, 0.145, 0.092], bank.tireBlack);
  box(head, [0.065, 0.016, 0.02], [0, 0.088, 0.105], bank.tireBlack);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.128, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.56), bank.modernWhite);
  cap.position.set(0, 0.165, 0);
  head.add(cap);
  cylinder(head, 0.126, 0.126, 0.045, [0, 0.185, 0], bank.policeNavy, 12);
  box(head, [0.15, 0.022, 0.09], [0, 0.17, 0.12], bank.tireBlack);
  box(head, [0.035, 0.035, 0.02], [0, 0.21, 0.124], bank.goldMetal);

  const leftArm = new THREE.Group();
  leftArm.position.set(0.22, 0.43, 0);
  torso.add(leftArm);
  cylinder(leftArm, 0.052, 0.058, 0.28, [0, -0.14, 0], bank.policeShirt, 8);
  cylinder(leftArm, 0.044, 0.048, 0.24, [0, -0.38, 0.06], bank.policeSkin, 8);
  box(leftArm, [0.065, 0.09, 0.05], [0, -0.52, 0.09], bank.modernWhite);

  const rightArm = new THREE.Group();
  rightArm.position.set(-0.22, 0.43, 0);
  torso.add(rightArm);
  cylinder(rightArm, 0.052, 0.058, 0.28, [0, -0.14, 0], bank.policeShirt, 8);
  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.27, 0);
  rightArm.add(rightForearm);
  cylinder(rightForearm, 0.044, 0.048, 0.24, [0, 0.08, 0.10], bank.policeSkin, 8);
  box(rightForearm, [0.065, 0.085, 0.06], [0, 0.18, 0.17], bank.modernWhite);
  cylinder(rightForearm, 0.020, 0.022, 0.12, [0, 0.26, 0.20], bank.tireBlack, 8);
  cylinder(rightForearm, 0.022, 0.022, 0.34, [0, 0.48, 0.25], bank.policeBatonGlow, 8);

  return { officer, torso, head, leftArm, rightArm, rightForearm };
}

/* ============================================================================
 * 3. ENTERABLE SCHOOL / INSTITUTE CLASSROOM BUILDER (PTI & ST. JOSEPH'S)
 * ========================================================================== */
function buildEnterableCampusAcademicBuilding(staticG, dynamicG, bank, phys, {
  bx, bz, W, D, floors = 3, wallMat, trimMat, roomCount = 3,
  signTitle, signSub, signBg = '#0f3d2e', roomPrefix = 'ক্লাসরুম',
}) {
  const floorY = 0.28;
  const gfH = 3.65;
  const flH = 3.35;
  const upperH = (floors - 1) * flH;
  const totalH = floorY + gfH + upperH;

  // Walkable ground floor slab + front entrance verandah
  box(staticG, [W + 1.8, floorY, D + 0.8], [bx - 0.6, floorY * 0.5, bz], bank.interiorFloor, { uvScale: 3.0 });
  phys.addWalkableSlab(bx - 0.6, bz, W + 2.0, D + 1.0, 0, floorY);

  const xWest = bx - W * 0.5;
  const xEast = bx + W * 0.5;
  const zNorth = bz - D * 0.5;
  const zSouth = bz + D * 0.5;
  const corridorX = xWest + 2.6; // 2.6m wide walkable West hallway along classrooms

  // Solid Outer Back (East), North & South walls on ground floor
  box(staticG, [0.34, gfH, D], [xEast - 0.17, floorY + gfH * 0.5, bz], wallMat);
  phys.addOBB(xEast - 0.17, bz, 0.42, D, 0, gfH + 1);
  box(staticG, [W, gfH, 0.34], [bx, floorY + gfH * 0.5, zNorth + 0.17], wallMat);
  phys.addOBB(bx, zNorth + 0.17, W, 0.42, 0, gfH + 1);
  box(staticG, [W, gfH, 0.34], [bx, floorY + gfH * 0.5, zSouth - 0.17], wallMat);
  phys.addOBB(bx, zSouth - 0.17, W, 0.42, 0, gfH + 1);

  // Open West Colonnade Pillars (completely open entry into the hallway!)
  const pillarCount = Math.max(4, Math.floor(D / 4.2));
  for (let i = 0; i <= pillarCount; i++) {
    const pz = zNorth + 0.4 + (i / pillarCount) * (D - 0.8);
    box(staticG, [0.42, gfH, 0.42], [xWest + 0.21, floorY + gfH * 0.5, pz], trimMat);
    phys.addCircle(xWest + 0.21, pz, 0.28, gfH + 1);
  }

  // Interior Ground-Floor Classrooms along the Hallway (each with open 1.8m doorway + full classroom furniture!)
  const roomSpan = (D - 0.68) / roomCount;
  for (let r = 0; r < roomCount; r++) {
    const rz0 = zNorth + 0.34 + r * roomSpan;
    const rz1 = rz0 + roomSpan;
    const rMid = (rz0 + rz1) * 0.5;
    // Divider wall between classrooms
    if (r > 0) {
      box(staticG, [xEast - corridorX, gfH, 0.22], [(corridorX + xEast) * 0.5, floorY + gfH * 0.5, rz0], bank.interiorWall);
      phys.addOBB((corridorX + xEast) * 0.5, rz0, xEast - corridorX, 0.28, 0, gfH + 1);
    }
    // Corridor-to-classroom partition wall with open 1.9m doorway at rMid!
    const doorHalf = 0.95;
    const seg1 = (rMid - doorHalf) - rz0;
    const seg2 = rz1 - (rMid + doorHalf);
    if (seg1 > 0.2) {
      box(staticG, [0.22, gfH, seg1], [corridorX, floorY + gfH * 0.5, rz0 + seg1 * 0.5], bank.interiorWall);
      phys.addOBB(corridorX, rz0 + seg1 * 0.5, 0.28, seg1, 0, gfH + 1);
    }
    if (seg2 > 0.2) {
      box(staticG, [0.22, gfH, seg2], [corridorX, floorY + gfH * 0.5, rMid + doorHalf + seg2 * 0.5], bank.interiorWall);
      phys.addOBB(corridorX, rMid + doorHalf + seg2 * 0.5, 0.28, seg2, 0, gfH + 1);
    }
    // Door lintel
    box(staticG, [0.22, gfH - 2.35, doorHalf * 2], [corridorX, floorY + 2.35 + (gfH - 2.35) * 0.5, rMid], bank.interiorWall);

    // Classroom Furniture: Green Chalkboard on East wall, Teacher Desk, 3 Rows of Student High-Desks & Benches, Fans & Lights!
    const roomX0 = corridorX + 0.3;
    const roomX1 = xEast - 0.35;
    const roomCx = (roomX0 + roomX1) * 0.5;

    box(dynamicG, [2.4, 0.06, 0.14], [roomCx, floorY + gfH - 0.10, rMid - 1.4], bank.tubeLightGlow, { castShadow: false });
    box(dynamicG, [2.4, 0.06, 0.14], [roomCx, floorY + gfH - 0.10, rMid + 1.4], bank.tubeLightGlow, { castShadow: false });
    addCeilingFan(staticG, bank, roomCx, floorY + gfH, rMid);

    // Framed Green Chalkboard on East Wall (facing West toward students)
    box(staticG, [0.10, 1.38, 3.4], [roomX1 - 0.05, floorY + 1.65, rMid], bank.teakWood);
    addSignBox(
      dynamicG,
      bank,
      { title: `${roomPrefix} ১০${r + 1}`, subtitle: 'আজকের পাঠ · গণিত, বিজ্ঞান ও ইংরেজি', bg: '#14532d', fg: '#f8fafc', accent: '#fde68a', border: '#7c4a24' },
      [roomX1 - 0.14, floorY + 1.65, rMid],
      -Math.PI * 0.5,
      3.2,
      1.22,
    );
    // Teacher Podium + Desk + Chair
    box(staticG, [1.25, 0.14, 2.8], [roomX1 - 0.95, floorY + 0.07, rMid], bank.lightWood);
    box(staticG, [0.70, 0.78, 1.30], [roomX1 - 1.15, floorY + 0.53, rMid], bank.teakWood);
    box(staticG, [0.44, 0.44, 0.44], [roomX1 - 0.55, floorY + 0.36, rMid], bank.steelDark);

    // 3 Rows of Student High-Desks & Sitting Benches facing East Chalkboard
    const benchLen = Math.min(roomSpan - 2.2, 5.2);
    for (let row = 0; row < 3; row++) {
      const rx = roomX1 - 2.6 - row * 1.45;
      if (rx < roomX0 + 0.9) break;
      box(staticG, [0.44, 0.06, benchLen], [rx, floorY + 0.74, rMid], bank.teakWood);
      box(staticG, [0.32, 0.05, benchLen], [rx - 0.46, floorY + 0.44, rMid], bank.lightWood);
      for (const lz of [-benchLen * 0.44, benchLen * 0.44]) {
        box(staticG, [0.42, 0.74, 0.06], [rx, floorY + 0.37, rMid + lz], bank.steelDark);
        box(staticG, [0.30, 0.44, 0.06], [rx - 0.46, floorY + 0.22, rMid + lz], bank.steelDark);
      }
      box(staticG, [0.22, 0.025, 0.28], [rx, floorY + 0.78, rMid - 0.8], bank.pillowWhite);
      box(staticG, [0.22, 0.025, 0.28], [rx, floorY + 0.78, rMid + 0.8], bank.pillowWhite);
    }
  }

  // Upper Floors (2nd & 3rd floor solid architectural massing + windows + cornice)
  box(staticG, [W + 0.5, 0.28, D + 0.5], [bx, floorY + gfH + 0.14, bz], bank.marbleWhite);
  box(staticG, [W, upperH, D], [bx, floorY + gfH + 0.28 + upperH * 0.5, bz], wallMat, { uvScale: 3.2 });
  box(staticG, [W + 0.9, 0.56, D + 0.9], [bx, totalH + 0.28, bz], trimMat);

  const rnd = seeded(1940 + Math.round(Math.abs(bz)));
  for (let f = 1; f < floors; f++) {
    const fy = floorY + gfH + 0.28 + (f - 1) * flH;
    box(staticG, [W + 0.45, 0.22, D + 0.45], [bx, fy + flH, bz], bank.marbleWhite);
    for (let wz = -D * 0.42; wz <= D * 0.42; wz += 3.6) {
      const lit = rnd() > 0.38;
      box(lit ? dynamicG : staticG, [0.18, 1.80, 2.1], [xWest - 0.05, fy + 1.75, bz + wz], lit ? bank.warmWindowLit : bank.glassCurtain, { castShadow: false });
      box(staticG, [0.16, 1.70, 2.0], [xEast + 0.05, fy + 1.75, bz + wz], bank.glassCurtain, { castShadow: false });
    }
  }

  addSignBox(
    dynamicG,
    bank,
    { title: signTitle, subtitle: signSub, bg: signBg, accent: '#fde047', border: '#fde047', width: 640 },
    [xWest - 0.25, floorY + gfH + 1.2, bz],
    -Math.PI * 0.5,
    Math.min(D * 0.55, 9.2),
    1.35,
  );
}

/* ============================================================================
 * 4. PTI KHULNA CAMPUS & ST. JOSEPH'S HIGH SCHOOL CAMPUS
 * ========================================================================== */
function buildPtiCampus(staticG, dynamicG, bank, phys) {
  box(staticG, [48.5, 0.04, 47.0], [-266.8, 0.02, -74.0], bank.grassTurf, { castShadow: false });
  box(staticG, [24.0, 0.08, 5.4], [-279.0, 0.04, -66.0], bank.footpath, { castShadow: false, uvScale: 2.0 });
  box(staticG, [10.0, 0.08, 20.0], [-268.0, 0.04, -76.0], bank.footpath, { castShadow: false, uvScale: 2.0 });

  const addWallSpan = (x0, z0, x1, z1, withPosters = false) => {
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    const mx = (x0 + x1) * 0.5;
    const mz = (z0 + z1) * 0.5;
    addRotBox(staticG, [0.34, 1.35, len], [mx, 0.675, mz], bank.ptiCream, yaw);
    addRotBox(staticG, [0.42, 0.14, len + 0.1], [mx, 1.40, mz], bank.ptiTerracotta, yaw);
    addRotBox(staticG, [0.08, 0.08, len], [mx, 2.08, mz], bank.gateIron, yaw);
    const pillars = Math.max(2, Math.floor(len / 5.5));
    for (let i = 0; i <= pillars; i++) {
      const f = i / pillars;
      addRotBox(staticG, [0.50, 2.25, 0.50], [x0 + dx * f, 1.125, z0 + dz * f], bank.ptiCream, yaw);
      addRotBox(staticG, [0.58, 0.16, 0.58], [x0 + dx * f, 2.30, z0 + dz * f], bank.ptiTerracotta, yaw);
    }
    phys.addOBB(mx, mz, 0.55, len, yaw, 2.4);
    if (withPosters && len > 10) {
      addBigNetaWallPoster(dynamicG, 0, mx - Math.cos(yaw) * 0.24, 1.15, mz + Math.sin(yaw) * 0.24, yaw + Math.PI * 0.5, 1.45);
    }
  };

  addWallSpan(-291.5, -50.5, -291.5, -63.0, false);
  addWallSpan(-291.5, -69.0, -291.5, -97.5, false);
  addWallSpan(-291.5, -50.5, -242.5, -50.5, true);
  addWallSpan(-242.5, -50.5, -242.5, -97.5, false);
  addWallSpan(-242.5, -97.5, -291.5, -97.5, false);

  for (const gz of [-69.1, -62.9]) {
    box(staticG, [0.92, 4.4, 0.92], [-291.5, 2.2, gz], bank.ptiCream);
    box(staticG, [1.08, 0.28, 1.08], [-291.5, 4.45, gz], bank.ptiTerracotta);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), bank.lampGlow);
    lamp.position.set(-291.5, 4.78, gz);
    dynamicG.add(lamp);
    phys.addCircle(-291.5, gz, 0.55, 4.6);
  }
  box(staticG, [0.72, 1.15, 7.2], [-291.5, 4.55, -66.0], bank.ptiEmerald);
  box(staticG, [0.82, 0.16, 7.4], [-291.5, 5.18, -66.0], bank.goldMetal);
  addSignBox(
    dynamicG,
    bank,
    {
      title: 'প্রাথমিক শিক্ষক প্রশিক্ষণ ইন্সটিটিউট (পিটিআই), খুলনা',
      subtitle: 'PRIMARY TEACHERS TRAINING INSTITUTE · ১৩৮ খান জাহান আলী রোড · স্থাপিত: ১৯৫৩',
      bg: '#065f46',
      fg: '#ffffff',
      accent: '#fde047',
      border: '#fde047',
      width: 640,
      height: 168,
    },
    [-291.96, 4.62, -66.0],
    -Math.PI * 0.5,
    6.8,
    1.12,
  );

  const leftLeaf = new THREE.Group();
  leftLeaf.position.set(-291.5, 0, -68.6);
  const rightLeaf = new THREE.Group();
  rightLeaf.position.set(-291.5, 0, -63.4);
  const buildGateLeaf = (leaf, sign) => {
    box(leaf, [0.09, 2.25, 2.52], [0, 1.25, sign * 1.26], bank.gateIron);
    for (let i = 0; i < 6; i++) {
      box(leaf, [0.12, 2.45, 0.05], [0, 1.35, sign * (0.22 + i * 0.42)], bank.goldMetal);
    }
    box(leaf, [0.12, 0.65, 2.46], [0, 0.45, sign * 1.26], bank.ptiEmerald);
  };
  buildGateLeaf(leftLeaf, 1);
  buildGateLeaf(rightLeaf, -1);
  dynamicG.add(leftLeaf, rightLeaf);

  // ENTERABLE 3-Story PTI Main Academic Building with 3 Furnished Classrooms!
  buildEnterableCampusAcademicBuilding(staticG, dynamicG, bank, phys, {
    bx: -258.0,
    bz: -68.0,
    W: 13.5,
    D: 26.0,
    floors: 3,
    wallMat: bank.ptiCream,
    trimMat: bank.ptiTerracotta,
    roomCount: 3,
    signTitle: 'পিটিআই একাডেমিক ভবন · প্রবেশযোগ্য ক্লাসরুম',
    signSub: 'PTI KHULNA · TEACHER TRAINING CLASSROOMS',
    signBg: '#0f3d2e',
    roomPrefix: 'পিটিআই ক্লাসরুম',
  });

  // 2-Story PTI Experimental Primary School
  const sx = -271.5;
  const sz = -89.5;
  phys.addOBB(sx, sz, 22.0, 9.5, 0, 8.5);
  box(staticG, [22.0, 7.2, 9.5], [sx, 3.6, sz], bank.ptiCream, { uvScale: 2.8 });
  box(staticG, [22.6, 0.45, 10.0], [sx, 7.4, sz], bank.ptiEmerald);
  for (let f = 0; f < 2; f++) {
    const fy = 0.4 + f * 3.35;
    for (let wx = -8.5; wx <= 8.5; wx += 3.4) {
      box(staticG, [2.1, 1.65, 0.18], [sx + wx, fy + 1.7, sz + 4.78], bank.glassCurtain, { castShadow: false });
    }
  }
  addSignBox(
    dynamicG,
    bank,
    { title: 'পিটিআই সংলগ্ন পরীক্ষণ বিদ্যালয়', subtitle: 'PTI EXPERIMENTAL PRIMARY SCHOOL · KHULNA', bg: '#1e3a8a', accent: '#fde047' },
    [sx, 4.1, sz + 4.92],
    0,
    6.2,
    0.98,
  );

  box(staticG, [3.2, 0.36, 3.2], [-276.0, 0.18, -76.5], bank.marbleWhite);
  cylinder(staticG, 0.05, 0.07, 7.5, [-276.0, 3.9, -76.5], bank.aluminum, 8);
  box(staticG, [1.55, 0.95, 0.04], [-275.2, 7.1, -76.5], bank.ptiEmerald);
  const redDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 16), bank.flowerRed);
  redDisc.rotation.x = Math.PI * 0.5;
  redDisc.position.set(-275.25, 7.1, -76.5);
  staticG.add(redDisc);

  return { leftLeaf, rightLeaf };
}

function buildStJosephsSchoolCampus(staticG, dynamicG, bank, phys) {
  box(staticG, [53.0, 0.04, 56.0], [-265.5, 0.02, -130.0], bank.grassTurf, { castShadow: false });
  box(staticG, [28.0, 0.08, 5.8], [-278.5, 0.04, -130.0], bank.footpath, { castShadow: false, uvScale: 2.0 });
  box(staticG, [18.0, 0.02, 0.24], [-277.0, 0.05, -142.0], bank.roadLineWhite, { castShadow: false });
  box(staticG, [18.0, 0.02, 0.24], [-277.0, 0.05, -118.0], bank.roadLineWhite, { castShadow: false });
  for (const gz of [-152.0, -108.0]) {
    for (const gx of [-280.0, -274.0]) {
      cylinder(staticG, 0.055, 0.055, 2.2, [gx, 1.1, gz], bank.modernWhite, 6);
    }
    box(staticG, [6.1, 0.10, 0.10], [-277.0, 2.2, gz], bank.modernWhite);
  }

  const addSchoolWall = (x0, z0, x1, z1) => {
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    const mx = (x0 + x1) * 0.5;
    const mz = (z0 + z1) * 0.5;
    addRotBox(staticG, [0.36, 1.55, len], [mx, 0.775, mz], bank.stJosephRed, yaw);
    addRotBox(staticG, [0.46, 0.16, len + 0.1], [mx, 1.60, mz], bank.marbleWhite, yaw);
    addRotBox(staticG, [0.08, 0.08, len], [mx, 2.25, mz], bank.steelDark, yaw);
    const pillars = Math.max(2, Math.floor(len / 6.0));
    for (let i = 0; i <= pillars; i++) {
      const f = i / pillars;
      addRotBox(staticG, [0.54, 2.45, 0.54], [x0 + dx * f, 1.225, z0 + dz * f], bank.ptiCream, yaw);
      addRotBox(staticG, [0.62, 0.16, 0.62], [x0 + dx * f, 2.50, z0 + dz * f], bank.stJosephRed, yaw);
    }
    phys.addOBB(mx, mz, 0.55, len, yaw, 2.5);
  };

  addSchoolWall(-292.6, -102.0, -292.6, -126.8);
  addSchoolWall(-292.6, -133.2, -292.6, -158.0);
  addSchoolWall(-292.6, -102.0, -239.0, -102.0);
  addSchoolWall(-292.6, -158.0, -239.0, -158.0);
  addSchoolWall(-239.0, -102.0, -239.0, -158.0);

  for (const gz of [-133.4, -126.6]) {
    box(staticG, [1.05, 4.9, 1.05], [-292.6, 2.45, gz], bank.ptiCream);
    box(staticG, [1.22, 0.30, 1.22], [-292.6, 4.95, gz], bank.stJosephRed);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), bank.lampGlow);
    globe.position.set(-292.6, 5.30, gz);
    dynamicG.add(globe);
    phys.addCircle(-292.6, gz, 0.62, 5.2);
  }
  box(staticG, [0.80, 1.35, 8.0], [-292.6, 5.10, -130.0], bank.stJosephRed);
  box(staticG, [0.88, 0.18, 8.2], [-292.6, 5.82, -130.0], bank.goldMetal);
  box(staticG, [0.14, 1.15, 0.14], [-292.6, 6.45, -130.0], bank.goldMetal);
  box(staticG, [0.14, 0.14, 0.72], [-292.6, 6.62, -130.0], bank.goldMetal);

  addSignBox(
    dynamicG,
    bank,
    {
      title: 'সেন্ট জোসেফ্স উচ্চ বিদ্যালয়, খুলনা',
      subtitle: "ST. JOSEPH'S HIGH SCHOOL · EST. 1940 · 3 AHSAN AHMED RD",
      bg: '#7f1d1d',
      fg: '#ffffff',
      accent: '#fde047',
      border: '#fde047',
      width: 640,
      height: 176,
    },
    [-293.08, 5.12, -130.0],
    -Math.PI * 0.5,
    7.6,
    1.25,
  );

  const leftLeaf = new THREE.Group();
  leftLeaf.position.set(-292.6, 0, -132.9);
  const rightLeaf = new THREE.Group();
  rightLeaf.position.set(-292.6, 0, -127.1);
  const buildLeaf = (leaf, sign) => {
    box(leaf, [0.09, 2.35, 2.82], [0, 1.30, sign * 1.41], bank.steelDark);
    for (let i = 0; i < 7; i++) {
      box(leaf, [0.12, 2.55, 0.05], [0, 1.40, sign * (0.22 + i * 0.40)], bank.goldMetal);
    }
    box(leaf, [0.12, 0.70, 2.76], [0, 0.48, sign * 1.41], bank.stJosephRed);
  };
  buildLeaf(leftLeaf, 1);
  buildLeaf(rightLeaf, -1);
  dynamicG.add(leftLeaf, rightLeaf);

  // ENTERABLE 3-Story Heritage Red-Brick St. Joseph's Main Building with 4 Furnished Classrooms!
  buildEnterableCampusAcademicBuilding(staticG, dynamicG, bank, phys, {
    bx: -255.0,
    bz: -130.0,
    W: 14.5,
    D: 44.0,
    floors: 3,
    wallMat: bank.stJosephRed,
    trimMat: bank.ptiCream,
    roomCount: 4,
    signTitle: "ST. JOSEPH'S HIGH SCHOOL · প্রবেশযোগ্য ক্লাসরুম",
    signSub: 'সেন্ট জোসেফ্স উচ্চ বিদ্যালয় · মূল একাডেমিক ভবন · স্থাপিত ১৯৪০',
    signBg: '#1e3a8a',
    roomPrefix: 'সেন্ট জোসেফ্স শ্রেণিকক্ষ',
  });

  return { leftLeaf, rightLeaf };
}

/* ============================================================================
 * 5. ENTERABLE REALISTIC CHINESE PALACE RESTAURANT (৪৫/১ আহসান আহমেদ রোড)
 * ========================================================================== */
function buildChinesePalaceRestaurant(staticG, dynamicG, bank, phys) {
  const cx = -312.0;
  const cz = -110.5;
  const rotY = Math.PI * 0.5;
  const w = 18.0;
  const d = 11.5;
  const floorY = FOOTPATH_H;
  const gfH = 4.2;
  const totalH = floorY + gfH + 3 * 3.1;

  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = rotY;
  staticG.add(g);

  const dg = new THREE.Group();
  dg.position.set(cx, 0, cz);
  dg.rotation.y = rotY;
  dynamicG.add(dg);

  // Walkable Marble Floor Slab flush with 0.24m Red-Brick Footpath!
  box(g, [w + 0.8, floorY, d + 2.2], [0, floorY * 0.5, 0.8], bank.interiorFloor, { castShadow: false, uvScale: 2.5 });
  box(g, [3.6, 0.02, 2.6], [0, floorY + 0.015, d * 0.5 + 0.6], bank.chineseRed, { castShadow: false });
  phys.addWalkableSlab(cx, cz, w + 0.8, d + 2.2, rotY, floorY);

  // Solid Back, Left, Right Walls + Front Wall with WIDE 3.4m OPEN ENTRANCE!
  box(g, [w, gfH, 0.34], [0, floorY + gfH * 0.5, -d * 0.5 + 0.17], bank.chineseRed);
  phys.addLocalOBB(cx, cz, rotY, 0, -d * 0.5 + 0.17, w, 0.42, gfH + 1);
  box(g, [0.34, gfH, d], [-w * 0.5 + 0.17, floorY + gfH * 0.5, 0], bank.chineseRed);
  phys.addLocalOBB(cx, cz, rotY, -w * 0.5 + 0.17, 0, 0.42, d, gfH + 1);
  box(g, [0.34, gfH, d], [w * 0.5 - 0.17, floorY + gfH * 0.5, 0], bank.chineseRed);
  phys.addLocalOBB(cx, cz, rotY, w * 0.5 - 0.17, 0, 0.42, d, gfH + 1);

  // Front Left & Right Glass Wall Segments (leaving center -1.7..+1.7 wide open to walk straight inside!)
  const sideSeg = w * 0.5 - 1.7;
  for (const side of [-1, 1]) {
    const sx = side * (1.7 + sideSeg * 0.5);
    box(g, [sideSeg, 0.95, 0.26], [sx, floorY + 0.475, d * 0.5 - 0.13], bank.chineseRed);
    box(g, [sideSeg, gfH - 0.95, 0.12], [sx, floorY + 0.95 + (gfH - 0.95) * 0.5, d * 0.5 - 0.13], bank.glassClear);
    phys.addLocalOBB(cx, cz, rotY, sx, d * 0.5 - 0.13, sideSeg, 0.36, gfH + 1);
  }
  box(g, [3.4, gfH - 2.75, 0.28], [0, floorY + 2.75 + (gfH - 2.75) * 0.5, d * 0.5 - 0.14], bank.chineseRed);

  // Furnish Enterable Chinese Palace Dining Hall inside!
  furnishRestaurantOrShop(g, dg, bank, -w * 0.5 + 0.4, w * 0.5 - 0.4, -d * 0.5 + 0.4, d * 0.5 - 0.4, floorY, floorY + gfH, 'chinese');

  // Crimson & Gold Columns + Projecting Pagoda Canopy + Swaying Red Lanterns
  for (const px of [-8.4, -4.4, -2.0, 2.0, 4.4, 8.4]) {
    cylinder(g, 0.24, 0.28, gfH, [px, floorY + gfH * 0.5, d * 0.5 + 0.25], bank.chineseRed, 10);
    cylinder(g, 0.30, 0.30, 0.20, [px, floorY + 0.25, d * 0.5 + 0.25], bank.goldMetal, 10);
    cylinder(g, 0.30, 0.30, 0.22, [px, floorY + gfH - 0.20, d * 0.5 + 0.25], bank.goldMetal, 10);
  }
  box(g, [w + 1.2, 0.32, 2.6], [0, floorY + gfH + 0.05, d * 0.5 + 0.95], bank.chineseRed);
  box(g, [w + 1.5, 0.14, 2.85], [0, floorY + gfH + 0.28, d * 0.5 + 0.95], bank.goldMetal);
  for (const sx of [-1, 1]) {
    box(g, [1.8, 0.20, 2.6], [sx * (w * 0.5 + 0.75), floorY + gfH + 0.38, d * 0.5 + 0.95], bank.chineseRed);
    box(g, [0.45, 0.45, 0.45], [sx * (w * 0.5 + 1.25), floorY + gfH + 0.62, d * 0.5 + 2.05], bank.goldMetal);
  }

  const lanterns = [];
  for (const lx of [-6.6, -3.2, 0, 3.2, 6.6]) {
    const lGrp = new THREE.Group();
    lGrp.position.set(lx, floorY + gfH - 0.10, d * 0.5 + 1.85);
    cylinder(lGrp, 0.015, 0.015, 0.36, [0, -0.18, 0], bank.goldMetal, 6);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), bank.lanternGlow);
    orb.scale.set(1.0, 1.18, 1.0);
    orb.position.y = -0.52;
    lGrp.add(orb);
    cylinder(lGrp, 0.14, 0.14, 0.07, [0, -0.26, 0], bank.goldMetal, 8);
    cylinder(lGrp, 0.12, 0.12, 0.07, [0, -0.78, 0], bank.goldMetal, 8);
    dg.add(lGrp);
    lanterns.push({ mesh: lGrp, phase: lx * 0.7 });
  }

  // Upper Floors
  box(g, [w, totalH - (floorY + gfH), d], [0, floorY + gfH + (totalH - (floorY + gfH)) * 0.5, 0], bank.ptiCream, { uvScale: 2.8 });
  for (let f = 1; f < 4; f++) {
    const fy = floorY + gfH + (f - 1) * 3.1;
    box(g, [w + 0.45, 0.24, d + 0.45], [0, fy + 3.1, 0], bank.chineseRed);
    for (const wx of [-6.4, -2.2, 2.2, 6.4]) {
      box(dg, [2.8, 1.72, 0.16], [wx, fy + 1.60, d * 0.5 + 0.04], f === 1 ? bank.warmWindowLit : bank.glassCurtain, { castShadow: false });
      box(g, [3.0, 0.12, 0.35], [wx, fy + 2.52, d * 0.5 + 0.18], bank.goldMetal);
    }
  }
  box(g, [w + 0.6, 1.05, d + 0.6], [0, totalH + 0.52, 0], bank.chineseRed);
  box(g, [w + 0.8, 0.20, d + 0.8], [0, totalH + 1.12, 0], bank.goldMetal);

  addSignBox(
    dg,
    bank,
    { title: 'চাইনিজ প্যালেস · CHINESE PALACE', subtitle: '৪৫/১ আহসান আহমেদ রোড, খুলনা · AUTHENTIC CHINESE & THAI', bg: '#7f1d1d', fg: '#fef08a', accent: '#f59e0b', border: '#facc15', width: 640, height: 176 },
    [0, floorY + gfH + 0.95, d * 0.5 + 2.15],
    0,
    12.4,
    1.45,
  );
  addSignBox(
    dg,
    bank,
    { title: 'CHINESE PALACE · চাইনিজ প্যালেস', subtitle: 'AC FAMILY DINING · PARTY CENTER · AHSAN AHMED ROAD', bg: '#450a0a', fg: '#ffffff', accent: '#facc15', border: '#f59e0b', width: 640 },
    [0, totalH + 1.85, d * 0.5 + 0.35],
    0,
    13.2,
    1.85,
  );

  return lanterns;
}

/* ============================================================================
 * 6. ENTERABLE MULTI-STORY COMMERCIAL / BATCH / RESIDENTIAL BUILDING BUILDER
 *    Every building along Ahsan Ahmed Rd & PTI More has 2 OPEN, WALKABLE
 *    ground-floor units (shops, photocopy/computer, shoe store, coaching batch,
 *    restaurant, or residential house room)!
 * ========================================================================== */
function buildEnterableBuilding(staticG, dynamicG, bank, phys, cfg) {
  const {
    cx, cz, rotY = 0, w = 16, d = 10.5, floors = 4,
    wallMat = bank.sandWall,
    trimMat = bank.marbleWhite,
    accentMat = bank.ptiTerracotta,
    awningMat = bank.awningGreen,
    leftUnit = 'restaurant',   // 'photocopy' | 'shoes' | 'batch' | 'house' | 'restaurant' | 'bakery' | 'cafe' | 'chinese' | 'pharmacy' | 'books'
    rightUnit = 'house',
    batchTitle = 'এসএসসি · এইচএসসি স্পেশাল ব্যাচ',
    signTitle,
    signSub,
    signBg = '#064e3b',
    secondSign = null,
    thirdSign = null,
    seed = 901,
  } = cfg;

  const floorY = FOOTPATH_H;
  const gfH = 3.85;
  const flH = 3.0;
  const totalH = floorY + gfH + (floors - 1) * flH;

  const rnd = seeded(seed);
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = rotY;
  staticG.add(g);

  const dg = new THREE.Group();
  dg.position.set(cx, 0, cz);
  dg.rotation.y = rotY;
  dynamicG.add(dg);

  // Walkable Interior Floor Slab flush with 0.24m Red-Brick Footpath!
  box(g, [w + 0.5, floorY, d + 1.4], [0, floorY * 0.5, 0.5], bank.interiorFloor, { castShadow: false, uvScale: 2.2 });
  phys.addWalkableSlab(cx, cz, w + 0.6, d + 1.5, rotY, floorY);

  // Ground-Floor Shell Walls (Back, Left, Right, Central Unit Partition) — 100% SOLID!
  box(g, [w, gfH, 0.32], [0, floorY + gfH * 0.5, -d * 0.5 + 0.16], bank.interiorWall);
  phys.addLocalOBB(cx, cz, rotY, 0, -d * 0.5 + 0.16, w, 0.40, gfH + 1);
  box(g, [0.32, gfH, d], [-w * 0.5 + 0.16, floorY + gfH * 0.5, 0], bank.interiorWall);
  phys.addLocalOBB(cx, cz, rotY, -w * 0.5 + 0.16, 0, 0.40, d, gfH + 1);
  box(g, [0.32, gfH, d], [w * 0.5 - 0.16, floorY + gfH * 0.5, 0], bank.interiorWall);
  phys.addLocalOBB(cx, cz, rotY, w * 0.5 - 0.16, 0, 0.40, d, gfH + 1);
  // Central divider wall between Left Unit & Right Unit
  box(g, [0.24, gfH, d - 0.32], [0, floorY + gfH * 0.5, 0], bank.interiorWall);
  phys.addLocalOBB(cx, cz, rotY, 0, 0, 0.32, d - 0.32, gfH + 1);

  // Front Wall with 2 WIDE OPEN WALKABLE DOORWAYS (Left Unit center = -w/4, Right Unit center = +w/4, each doorway 2.4m wide!)
  const halfW = w * 0.5;
  const leftDoorC = -w * 0.25;
  const rightDoorC = w * 0.25;
  const doorHalf = 1.25;
  const frontZ = d * 0.5 - 0.15;

  const frontPiers = [
    [-halfW, leftDoorC - doorHalf],
    [leftDoorC + doorHalf, rightDoorC - doorHalf],
    [rightDoorC + doorHalf, halfW],
  ];
  for (const [px0, px1] of frontPiers) {
    const segW = px1 - px0;
    if (segW < 0.2) continue;
    const pmx = (px0 + px1) * 0.5;
    box(g, [segW, 0.92, 0.26], [pmx, floorY + 0.46, frontZ], accentMat);
    box(g, [segW, gfH - 0.92, 0.10], [pmx, floorY + 0.92 + (gfH - 0.92) * 0.5, frontZ], bank.glassClear);
    phys.addLocalOBB(cx, cz, rotY, pmx, frontZ, segW, 0.34, gfH + 1);
  }
  // Doorway lintels & slanted shop awnings
  box(g, [w, gfH - 2.65, 0.28], [0, floorY + 2.65 + (gfH - 2.65) * 0.5, frontZ], trimMat);
  box(g, [w + 0.2, 0.14, 1.15], [0, floorY + 2.95, d * 0.5 + 0.42], awningMat);

  // Furnish BOTH Enterable Ground-Floor Units!
  const furnishUnit = (uType, ux0, ux1) => {
    const uz0 = -d * 0.5 + 0.36;
    const uz1 = d * 0.5 - 0.36;
    if (uType === 'photocopy') furnishPhotocopyComputerShop(g, dg, bank, ux0, ux1, uz0, uz1, floorY, floorY + gfH);
    else if (uType === 'shoes') furnishShoeShop(g, dg, bank, ux0, ux1, uz0, uz1, floorY, floorY + gfH);
    else if (uType === 'batch') furnishCoachingBatchRoom(g, dg, bank, ux0, ux1, uz0, uz1, floorY, floorY + gfH, batchTitle);
    else if (uType === 'house') furnishResidentialRoom(g, dg, bank, ux0, ux1, uz0, uz1, floorY, floorY + gfH);
    else furnishRestaurantOrShop(g, dg, bank, ux0, ux1, uz0, uz1, floorY, floorY + gfH, uType);
  };
  furnishUnit(leftUnit, -halfW + 0.36, -0.16);
  furnishUnit(rightUnit, 0.16, halfW - 0.36);

  // Upper Floors + Balconies + Windows + AC Units
  box(g, [w + 0.45, 0.24, d + 0.45], [0, floorY + gfH + 0.12, 0], trimMat);
  box(g, [w, totalH - (floorY + gfH + 0.24), d], [0, floorY + gfH + 0.24 + (totalH - (floorY + gfH + 0.24)) * 0.5, 0], wallMat, { uvScale: 3.0 });

  const bays = Math.max(3, Math.floor(w / 3.8));
  const bayW = w / bays;
  for (let f = 1; f < floors; f++) {
    const fy = floorY + gfH + 0.24 + (f - 1) * flH;
    box(g, [w + 0.36, 0.18, d + 0.36], [0, fy + flH, 0], trimMat);
    for (let b = 0; b < bays; b++) {
      const bx = -w * 0.5 + (b + 0.5) * bayW;
      const lit = rnd() > 0.42;
      const winM = lit ? (rnd() > 0.38 ? bank.warmWindowLit : bank.coolWindowLit) : bank.glassCurtain;
      box(lit ? dg : g, [bayW * 0.62, 1.58, 0.16], [bx, fy + 1.50, d * 0.5 + 0.04], winM, { castShadow: false });
      if ((b + f) % 2 === 0) {
        box(g, [bayW * 0.76, 0.15, 0.78], [bx, fy + 0.12, d * 0.5 + 0.36], trimMat);
        box(g, [bayW * 0.76, 0.74, 0.12], [bx, fy + 0.50, d * 0.5 + 0.72], accentMat);
      } else {
        box(g, [bayW * 0.70, 0.12, 0.30], [bx, fy + 2.36, d * 0.5 + 0.14], trimMat);
        if (rnd() > 0.42) {
          box(g, [0.68, 0.46, 0.30], [bx + bayW * 0.20, fy + 0.45, d * 0.5 + 0.16], bank.acBox);
        }
      }
      box(g, [bayW * 0.56, 1.50, 0.14], [bx, fy + 1.50, -d * 0.5 - 0.04], bank.glassCurtain, { castShadow: false });
    }
  }

  // Rooftop Parapet, Mumty & Black Gazi Water Tank
  box(g, [w + 0.28, 0.88, 0.22], [0, totalH + 0.44, d * 0.5], accentMat);
  box(g, [w + 0.28, 0.88, 0.22], [0, totalH + 0.44, -d * 0.5], accentMat);
  box(g, [0.22, 0.88, d], [-w * 0.5, totalH + 0.44, 0], accentMat);
  box(g, [0.22, 0.88, d], [w * 0.5, totalH + 0.44, 0], accentMat);
  box(g, [3.0, 2.15, 3.2], [-w * 0.16, totalH + 1.08, 0], trimMat);
  cylinder(g, 0.58, 0.62, 1.30, [w * 0.22, totalH + 1.05, -0.8], bank.waterTank, 10);

  if (signTitle) {
    addSignBox(
      dg,
      bank,
      { title: signTitle, subtitle: signSub, bg: signBg, accent: '#fde047', width: 600 },
      [0, floorY + 3.45, d * 0.5 + 0.24],
      0,
      Math.min(w - 0.9, 10.8),
      1.10,
    );
  }
  if (secondSign) {
    addSignBox(
      dg,
      bank,
      secondSign,
      [0, floorY + gfH + 3.05, d * 0.5 + 0.30],
      0,
      Math.min(w - 1.4, 9.2),
      1.15,
    );
  }
  if (thirdSign) {
    addSignBox(
      dg,
      bank,
      thirdSign,
      [0, totalH + 1.48, d * 0.5 + 0.26],
      0,
      Math.min(w - 1.4, 9.4),
      1.28,
    );
  }
}

/* ============================================================================
 * 7. PTI JAAM E MASJID & KMP TRAFFIC POLICE BOX
 * ========================================================================== */
function buildPtiJameMasjid(staticG, dynamicG, bank, phys) {
  const mx = -345.0;
  const mz = -28.0;
  const W = 16.0;
  const D = 14.0;
  const H = 8.4;
  phys.addOBB(mx, mz, W, D, 0, H + 6);

  box(staticG, [W + 1.2, 0.42, D + 1.2], [mx, 0.21, mz], bank.marbleWhite);
  box(staticG, [W, H, D], [mx, H * 0.5 + 0.42, mz], bank.modernWhite, { uvScale: 2.8 });
  box(staticG, [W + 0.5, 0.45, D + 0.5], [mx, H + 0.65, mz], bank.ptiEmerald);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(4.2, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), bank.ptiEmerald);
  dome.position.set(mx, H + 0.85, mz);
  staticG.add(dome);
  cylinder(staticG, 0.08, 0.10, 1.8, [mx, H + 5.6, mz], bank.goldMetal, 8);
  cylinder(staticG, 0.95, 1.15, 16.5, [mx + 7.2, 8.25, mz - 6.2], bank.modernWhite, 12);
  cylinder(staticG, 1.35, 1.35, 0.35, [mx + 7.2, 13.5, mz - 6.2], bank.ptiEmerald, 12);
  const minDome = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), bank.ptiEmerald);
  minDome.position.set(mx + 7.2, 16.5, mz - 6.2);
  staticG.add(minDome);

  for (let wx = -5.5; wx <= 5.5; wx += 2.75) {
    box(dynamicG, [1.55, 2.2, 0.16], [mx + wx, 2.6, mz - D * 0.5 - 0.04], bank.warmWindowLit, { castShadow: false });
    box(dynamicG, [1.55, 2.0, 0.16], [mx + wx, 6.2, mz - D * 0.5 - 0.04], bank.coolWindowLit, { castShadow: false });
  }

  addSignBox(
    dynamicG,
    bank,
    { title: 'পিটিআই জামে মসজিদ ও মসজিদ কমপ্লেক্স', subtitle: 'PTI JAAM E MASJID · নিউরন নার্সিং ও ওশান এডমিশন কোচিং', bg: '#064e3b', fg: '#ffffff', accent: '#fde047', border: '#fde047', width: 640 },
    [mx, 4.7, mz - D * 0.5 - 0.25],
    Math.PI,
    10.5,
    1.35,
  );
}

function buildPtiPoliceBox(staticG, dynamicG, bank, phys, x, z) {
  phys.addCircle(x, z, 1.55, 3.5);
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  staticG.add(g);

  cylinder(g, 1.42, 1.52, 0.26, [0, 0.13, 0], bank.concrete, 8);
  cylinder(g, 1.18, 1.22, 1.02, [0, 0.78, 0], bank.modernWhite, 8);
  cylinder(g, 1.24, 1.24, 0.20, [0, 1.20, 0], bank.policeBlue, 8);
  cylinder(g, 1.06, 1.06, 1.10, [0, 1.86, 0], bank.glassLobby, 8);
  cylinder(g, 1.72, 1.78, 0.18, [0, 2.52, 0], bank.policeBlue, 8);
  cylinder(g, 0.78, 1.42, 0.44, [0, 2.82, 0], bank.modernWhite, 8);

  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.22, 10), bank.uplightCyan);
  beacon.position.set(x, 3.16, z);
  dynamicG.add(beacon);

  addSignBox(
    dynamicG,
    bank,
    { title: 'KMP ট্রাফিক পুলিশ বক্স', subtitle: 'পিটিআই মোড় · খুলনা মেট্রোপলিটন পুলিশ', bg: '#1e3a8a', accent: '#fde047' },
    [x + 0.72, 2.58, z + 0.88],
    Math.PI * 0.22,
    2.1,
    0.50,
  );
}

/**
 * Builds the complete Hand-Crafted Real-World ENTERABLE PTI More + Ahsan Ahmed Road District (খুলনা).
 */
export function buildPtiMoreDistrict(parent, m) {
  const root = new THREE.Group();
  root.name = 'KhulnaLandmark_PtiMore';
  const staticG = new THREE.Group();
  const dynamicG = new THREE.Group();
  root.add(staticG, dynamicG);
  parent.add(root);

  const bank = createPtiBank(m);
  const phys = createPhysicsRegistry();

  // 1) Junction Asphalt, Central Island, Raised 0.24m RED-BRICK Footpaths & N7 Gantry
  buildPtiJunctionAndFootpaths(staticG, dynamicG, bank, phys);

  // 2) Enterable Primary Teachers Training Institute (PTI), Khulna Campus + [E] Gate
  const ptiGate = buildPtiCampus(staticG, dynamicG, bank, phys);
  let ptiGateTarget = 0;
  let ptiGateRatio = 0;

  // 3) Enterable St. Joseph's High School, Khulna Campus (3 Ahsan Ahmed Rd) + [E] Gate
  const sjGate = buildStJosephsSchoolCampus(staticG, dynamicG, bank, phys);
  let sjGateTarget = 0;
  let sjGateRatio = 0;

  // 4) Enterable Realistic Chinese Palace Restaurant (45/1 Ahsan Ahmed Rd)
  const chineseLanterns = buildChinesePalaceRestaurant(staticG, dynamicG, bank, phys);

  // 5) PTI Jaam E Masjid & Masjid Complex
  buildPtiJameMasjid(staticG, dynamicG, bank, phys);

  // 6) KMP Traffic Police Box + Standing Animated 3D KMP Traffic Police Officer at PTI More corner
  buildPtiPoliceBox(staticG, dynamicG, bank, phys, -306.8, -59.0);
  const trafficOfficer = buildStandingTrafficPolice(dynamicG, bank, phys, -304.2, -55.8, 0.58);

  const nwAngle = Math.atan2(-372.0 - -321.0, -82.0 - -52.0);
  const seAngle = Math.atan2(-298.5 - -252.0, -36.5 - 16.0);

  // ============================================================================
  // 7) ALL ENTERABLE SHOPS, PHOTOCOPY/PC STORES, SHOE SHOPS, BATCHES & HOUSES
  // ============================================================================

  // --- WEST SIDE OF AHSAN AHMED ROAD (South -> North) ---
  // 33, PTI More, 1 Ahsan Ahmed Rd: Road Home Chinese (Enterable) + Science/Math Batch (Enterable)
  buildEnterableBuilding(staticG, dynamicG, bank, phys, {
    cx: -312.8,
    cz: -71.5,
    rotY: Math.PI * 0.5,
    w: 16.5,
    d: 10.5,
    floors: 5,
    wallMat: bank.modernWhite,
    trimMat: bank.marbleWhite,
    accentMat: bank.chineseRed,
    awningMat: bank.awningRed,
    leftUnit: 'chinese',
    rightUnit: 'batch',
    batchTitle: 'বিজ্ঞান ও গণিত স্পেশাল ব্যাচ (SSC · HSC)',
    signTitle: 'রোড হোম চাইনিজ · ৩৩ পিটিআই মোড় · বিজ্ঞান ব্যাচ',
    signSub: 'ROAD HOME CHINESE & RESTAURANT · 1 AHSAN AHMED RD',
    signBg: '#7f1d1d',
    secondSign: { title: 'বিজ্ঞান ও গণিত স্পেশাল ব্যাচ (SSC · HSC)', subtitle: 'ফিজিক্স · কেমিস্ট্রি · হায়ার ম্যাথ · পিটিআই মোড়', bg: '#1e3a8a', accent: '#fde047' },
    seed: 911,
  });

  // 35 Ahsan Ahmed Rd: Tasty Treat & Hariyal (Enterable Bakery/Dining) + PTI Shoe House (Enterable Shoe Shop!)
  buildEnterableBuilding(staticG, dynamicG, bank, phys, {
    cx: -312.2,
    cz: -90.0,
    rotY: Math.PI * 0.5,
    w: 17.5,
    d: 10.5,
    floors: 5,
    wallMat: bank.ptiCream,
    trimMat: bank.marbleWhite,
    accentMat: bank.awningRed,
    awningMat: bank.awningRed,
    leftUnit: 'bakery',
    rightUnit: 'shoes',
    signTitle: 'টেস্টি ট্রিট · হাড়িয়াল · খুলনা সু হাউস (জুতার দোকান)',
    signSub: '৩৫ আহসান আহমেদ রোড · কেক, নিহারি, হালিম ও জুতার শোরুম',
    signBg: '#b91c1c',
    secondSign: { title: 'ইংলিশ ও আইসিটি স্পেশাল প্রাইভেট ব্যাচ', subtitle: 'SSC · HSC · IELTS PREPARATION · 35 AHSAN AHMED RD', bg: '#0f172a', accent: '#38bdf8' },
    seed: 917,
  });

  // (z = -110.5 is our ENTERABLE HERO Chinese Palace Restaurant — 45/1 Ahsan Ahmed Road!)

  // z = -131.5 (Right opposite St. Joseph's High School Gate): Cafe Rimjhim + St. Joseph Photocopy & Computer Shop!
  buildEnterableBuilding(staticG, dynamicG, bank, phys, {
    cx: -313.2,
    cz: -131.5,
    rotY: Math.PI * 0.5,
    w: 17.5,
    d: 10.5,
    floors: 4,
    wallMat: bank.warmOchre,
    trimMat: bank.ptiCream,
    accentMat: bank.coffeeEspresso,
    awningMat: bank.awningGreen,
    leftUnit: 'cafe',
    rightUnit: 'photocopy',
    signTitle: 'ক্যাফে রিমঝিম · সেন্ট জোসেফ ফটোকপি ও কম্পিউটার',
    signSub: 'CAFE RIMJHIM · PHOTOCOPY MACHINE, COMPUTER COMPOSE & PRINT',
    signBg: '#451a03',
    secondSign: { title: 'সেন্ট জোসেফ রোড একাডেমিক ব্যাচ (৬ষ্ঠ–১০ম শ্রেণি)', subtitle: 'গণিত, ইংরেজি ও বিজ্ঞান প্রাইভেট ব্যাচ', bg: '#1e3a8a', accent: '#fde047' },
    seed: 981,
  });

  // z = -152.0: Enterable Ahsan Ahmed Road Coaching Batch Hub + Enterable Residential Room
  buildEnterableBuilding(staticG, dynamicG, bank, phys, {
    cx: -314.0,
    cz: -152.0,
    rotY: Math.PI * 0.5,
    w: 18.0,
    d: 10.5,
    floors: 5,
    wallMat: bank.paleBlue,
    trimMat: bank.marbleWhite,
    accentMat: bank.policeBlue,
    awningMat: bank.awningBlue,
    leftUnit: 'batch',
    rightUnit: 'house',
    batchTitle: 'কেমিস্ট্রি ও বায়োলজি স্পেশাল ব্যাচ (HSC)',
    signTitle: 'আহসান আহমেদ কোচিং ব্যাচ কমপ্লেক্স · আবাসিক বাসা',
    signSub: 'CHEMISTRY & BIOLOGY BATCH · ENTERABLE ROOMS & CLASSROOM',
    signBg: '#1e3a8a',
    secondSign: { title: 'মেডিকেল ও ইঞ্জিনিয়ারিং ভর্তি প্রস্তুতি ব্যাচ', subtitle: 'AHSAN AHMED ROAD · KHULNA', bg: '#065f46', accent: '#fde047' },
    seed: 985,
  });

  // z = -173.0: Enterable Pharmacy + Enterable Shoe Showroom (এপেক্স ও বাটা জুতার দোকান)
  buildEnterableBuilding(staticG, dynamicG, bank, phys, {
    cx: -315.0,
    cz: -173.0,
    rotY: Math.PI * 0.5,
    w: 17.5,
    d: 10.5,
    floors: 4,
    wallMat: bank.modernWhite,
    trimMat: bank.marbleWhite,
    accentMat: bank.ptiEmerald,
    awningMat: bank.awningGreen,
    leftUnit: 'pharmacy',
    rightUnit: 'shoes',
    signTitle: 'আহসান আহমেদ ফার্মেসি · এপেক্স ও বাটা জুতার শোরুম',
    signSub: '24H PHARMACY & KHULNA SHOE COLLECTION · AHSAN AHMED RD',
    signBg: '#064e3b',
    secondSign: { title: 'অ্যাকাউন্টিং, ফিন্যান্স ও বিবিএ স্পেশাল ব্যাচ', subtitle: 'COMMERCE & UNIVERSITY ADMISSION BATCH', bg: '#0f172a', accent: '#fde047' },
    seed: 989,
  });

  // z = -194.0: Enterable Student Photocopy & Computer Shop + Enterable Book House
  buildEnterableBuilding(staticG, dynamicG, bank, phys, {
    cx: -316.0,
    cz: -194.0,
    rotY: Math.PI * 0.5,
    w: 17.5,
    d: 10.5,
    floors: 4,
    wallMat: bank.sandWall,
    trimMat: bank.marbleWhite,
    accentMat: bank.slateTrim,
    awningMat: bank.awningBlue,
    leftUnit: 'photocopy',
    rightUnit: 'books',
    signTitle: 'স্টুডেন্ট ফটোকপি ও কম্পিউটার · লাইব্রেরি',
    signSub: 'PHOTOCOPY, COMPUTER COMPOSE, NOTES & BOOKS · AHSAN AHMED RD',
    signBg: '#1e3a8a',
    seed: 991,
  });

  // z = -215.0: Enterable Residential House Rooms + Shoe & Fashion Shop
  buildEnterableBuilding(staticG, dynamicG, bank, phys, {
    cx: -317.0,
    cz: -215.0,
    rotY: Math.PI * 0.5,
    w: 17.5,
    d: 10.5,
    floors: 5,
    wallMat: bank.sageWall,
    trimMat: bank.ptiCream,
    accentMat: bank.ptiTerracotta,
    awningMat: bank.awningRed,
    leftUnit: 'house',
    rightUnit: 'shoes',
    signTitle: 'আহসান আহমেদ ভিলা (বাসা) · সুপার সুজ কর্নার',
    signSub: 'RESIDENTIAL ROOMS & FOOTWEAR SHOP · AHSAN AHMED RD NORTH',
    signBg: '#7c2d12',
    seed: 995,
  });

  // --- EAST SIDE OF AHSAN AHMED ROAD NORTH OF ST. JOSEPH'S HIGH SCHOOL ---
  // 17 Ahsan Ahmed Rd: Enterable Q Q Bubbles Khulna + Enterable HSC Science Batch
  buildEnterableBuilding(staticG, dynamicG, bank, phys, {
    cx: -288.8,
    cz: -172.0,
    rotY: -Math.PI * 0.5,
    w: 17.5,
    d: 10.5,
    floors: 4,
    wallMat: bank.modernWhite,
    trimMat: bank.marbleWhite,
    accentMat: bank.awningRed,
    awningMat: bank.awningRed,
    leftUnit: 'cafe',
    rightUnit: 'batch',
    batchTitle: 'এইচএসসি সায়েন্স ও ইংলিশ ব্যাচ',
    signTitle: 'কিউ কিউ বাবলস খুলনা (Q Q Bubbles) · সায়েন্স ব্যাচ',
    signSub: '১৭ আহসান আহমেদ রোড · FAST FOOD, PASTA & COACHING',
    signBg: '#991b1b',
    seed: 997,
  });

  // 62/2 Ahsan Ahmed Rd: Enterable Coffee Bank + Enterable Residential Apartment Room
  buildEnterableBuilding(staticG, dynamicG, bank, phys, {
    cx: -289.8,
    cz: -192.5,
    rotY: -Math.PI * 0.5,
    w: 17.5,
    d: 10.5,
    floors: 5,
    wallMat: bank.coffeeEspresso,
    trimMat: bank.ptiCream,
    accentMat: bank.warmOchre,
    awningMat: bank.awningGreen,
    leftUnit: 'cafe',
    rightUnit: 'house',
    signTitle: 'কফি ব্যাংক (Coffee Bank) · ৬২/২ আহসান আহমেদ রোড',
    signSub: 'COLD COFFEE, SHAKE & RESIDENTIAL APARTMENTS',
    signBg: '#291c14',
    secondSign: { title: 'মেডিকেল ও ভার্সিটি এডমিশন স্পেশাল ব্যাচ', subtitle: 'DU · KUET · RU · MEDICAL ADMISSION CARE', bg: '#065f46', accent: '#fde047' },
    seed: 999,
  });

  // Enterable Dhaba - Ahsan Ahmed Road + Enterable IELTS Batch
  buildEnterableBuilding(staticG, dynamicG, bank, phys, {
    cx: -290.8,
    cz: -213.0,
    rotY: -Math.PI * 0.5,
    w: 18.0,
    d: 10.5,
    floors: 4,
    wallMat: bank.ptiTerracotta,
    trimMat: bank.ptiCream,
    accentMat: bank.warmOchre,
    awningMat: bank.awningRed,
    leftUnit: 'restaurant',
    rightUnit: 'batch',
    batchTitle: 'আইইএলটিএস ও স্পোকেন ইংলিশ ব্যাচ',
    signTitle: 'ধাবা (Dhaba) · আহসান আহমেদ রোড · IELTS ব্যাচ',
    signSub: 'DOSA · TANDOORI · CHOWMEIN · SPOKEN ENGLISH',
    signBg: '#78350f',
    seed: 1003,
  });

  // ============================================================================
  // 8) ENTERABLE PTI MORE KHAN JAHAN ALI RD & MIA PARA RD BUILDINGS
  // ============================================================================
  buildEnterableBuilding(staticG, dynamicG, bank, phys, {
    cx: -332.5,
    cz: -72.8,
    rotY: nwAngle - Math.PI * 0.5,
    w: 17.0,
    d: 10.5,
    floors: 4,
    wallMat: bank.sandWall,
    trimMat: bank.marbleWhite,
    accentMat: bank.ptiTerracotta,
    awningMat: bank.awningRed,
    leftUnit: 'bakery',
    rightUnit: 'shoes',
    signTitle: 'ভাই-ভাই টি স্টল ও বেকারি · পিটিআই সুজ হাউস',
    signSub: 'KHAN JAHAN ALI RD · PTI MORE TO ROYAL MORE',
    signBg: '#7c2d12',
    seed: 923,
  });
  buildEnterableBuilding(staticG, dynamicG, bank, phys, {
    cx: -350.5,
    cz: -83.2,
    rotY: nwAngle - Math.PI * 0.5,
    w: 17.5,
    d: 10.5,
    floors: 5,
    wallMat: bank.paleBlue,
    trimMat: bank.marbleWhite,
    accentMat: bank.slateTrim,
    awningMat: bank.awningBlue,
    leftUnit: 'pharmacy',
    rightUnit: 'house',
    signTitle: 'সোনালী ফার্মেসি ও ডেন্টাল · আবাসিক ভবন',
    signSub: 'KHAN JAHAN ALI ROAD · KHULNA',
    signBg: '#0c4a6e',
    seed: 929,
  });

  // SW Quadrant (Mia Para Rd & PTI Masjid Complex Coaching Strip)
  buildEnterableBuilding(staticG, dynamicG, bank, phys, {
    cx: -324.2,
    cz: -33.5,
    rotY: Math.PI * 0.5,
    w: 15.0,
    d: 10.0,
    floors: 4,
    wallMat: bank.ptiCream,
    trimMat: bank.marbleWhite,
    accentMat: bank.slateTrim,
    awningMat: bank.awningBlue,
    leftUnit: 'batch',
    rightUnit: 'photocopy',
    batchTitle: 'নিউরন নার্সিং ভর্তি কোচিং · পিটিআই শাখা',
    signTitle: 'নিউরন নার্সিং কোচিং · মিয়া পাড়া ফটোকপি ও কম্পিউটার',
    signSub: 'MOSJID COMPLEX · MIA PARA RD CORNER, PTI MORE',
    signBg: '#065f46',
    seed: 937,
  });
  buildEnterableBuilding(staticG, dynamicG, bank, phys, {
    cx: -323.5,
    cz: -14.5,
    rotY: Math.PI * 0.5,
    w: 16.5,
    d: 10.0,
    floors: 3,
    wallMat: bank.sageWall,
    trimMat: bank.ptiCream,
    accentMat: bank.ptiEmerald,
    awningMat: bank.awningGreen,
    leftUnit: 'house',
    rightUnit: 'house',
    signTitle: 'মিয়া পাড়া আবাসিক বাসা · ভ্যারাইটিজ স্টোর',
    signSub: 'MIA PARA ROAD · WARD 23, KHULNA (ENTERABLE ROOMS)',
    signBg: '#064e3b',
    seed: 941,
  });
  buildEnterableBuilding(staticG, dynamicG, bank, phys, {
    cx: -341.0,
    cz: -48.5,
    rotY: nwAngle + Math.PI * 0.5,
    w: 16.5,
    d: 10.5,
    floors: 5,
    wallMat: bank.modernWhite,
    trimMat: bank.marbleWhite,
    accentMat: bank.ptiEmerald,
    awningMat: bank.awningGreen,
    leftUnit: 'photocopy',
    rightUnit: 'batch',
    batchTitle: 'ওশান ইউনিভার্সিটি এডমিশন কোচিং',
    signTitle: 'খুলনা কম্পিউটার ও ফটোকপি · ওশান এডমিশন কোচিং',
    signSub: 'KHAN JAHAN ALI RD · PTI MORE WEST',
    signBg: '#1e3a8a',
    seed: 947,
  });
  buildEnterableBuilding(staticG, dynamicG, bank, phys, {
    cx: -359.0,
    cz: -59.0,
    rotY: nwAngle + Math.PI * 0.5,
    w: 16.5,
    d: 10.5,
    floors: 4,
    wallMat: bank.warmOchre,
    trimMat: bank.ptiCream,
    accentMat: bank.ptiTerracotta,
    awningMat: bank.awningRed,
    leftUnit: 'restaurant',
    rightUnit: 'house',
    signTitle: 'মদিনা বিরিয়ানি হাউস ও হোটেল · আবাসিক বাসা',
    signSub: 'KHAN JAHAN ALI ROAD · KHULNA',
    signBg: '#7f1d1d',
    seed: 953,
  });

  // SE / South Wedge
  buildEnterableBuilding(staticG, dynamicG, bank, phys, {
    cx: -301.2,
    cz: -13.5,
    rotY: seAngle - Math.PI * 0.5,
    w: 15.5,
    d: 9.8,
    floors: 4,
    wallMat: bank.sandWall,
    trimMat: bank.marbleWhite,
    accentMat: bank.ptiTerracotta,
    awningMat: bank.awningRed,
    leftUnit: 'restaurant',
    rightUnit: 'shoes',
    signTitle: 'পিটিআই মোড় হোটেল ও মিষ্টান্ন · জুতার দোকান',
    signSub: 'KHAN JAHAN ALI ROAD · PTI MORE SOUTH',
    signBg: '#78350f',
    seed: 961,
  });
  buildEnterableBuilding(staticG, dynamicG, bank, phys, {
    cx: -288.2,
    cz: 4.5,
    rotY: seAngle - Math.PI * 0.5,
    w: 16.5,
    d: 10.2,
    floors: 5,
    wallMat: bank.paleBlue,
    trimMat: bank.marbleWhite,
    accentMat: bank.slateTrim,
    awningMat: bank.awningBlue,
    leftUnit: 'house',
    rightUnit: 'books',
    signTitle: 'খুলনা বুক ও হার্ডওয়্যার · আবাসিক ভবন',
    signSub: 'KHAN JAHAN ALI ROAD · HAJI MOHSIN LINK',
    signBg: '#1e3a8a',
    seed: 967,
  });

  // East Side of Khan Jahan Ali Rd SE
  buildEnterableBuilding(staticG, dynamicG, bank, phys, {
    cx: -272.5,
    cz: -34.5,
    rotY: seAngle + Math.PI * 0.5,
    w: 17.0,
    d: 10.5,
    floors: 5,
    wallMat: bank.modernWhite,
    trimMat: bank.marbleWhite,
    accentMat: bank.ptiEmerald,
    awningMat: bank.awningGreen,
    leftUnit: 'pharmacy',
    rightUnit: 'photocopy',
    signTitle: 'পিটিআই প্লাজা · ফার্মেসি ও ফটোকপি সেন্টার',
    signSub: 'PTI MORE EAST · 138 KHAN JAHAN ALI ROAD',
    signBg: '#065f46',
    seed: 971,
  });
  buildEnterableBuilding(staticG, dynamicG, bank, phys, {
    cx: -258.0,
    cz: -18.0,
    rotY: seAngle + Math.PI * 0.5,
    w: 16.5,
    d: 10.2,
    floors: 4,
    wallMat: bank.ptiCream,
    trimMat: bank.marbleWhite,
    accentMat: bank.ptiTerracotta,
    awningMat: bank.awningBlue,
    leftUnit: 'house',
    rightUnit: 'shoes',
    signTitle: 'রয়েল বাসা ও সুজ শোরুম · খান জাহান আলী রোড',
    signSub: 'KHAN JAHAN ALI ROAD · KHULNA',
    signBg: '#0f172a',
    seed: 977,
  });

  // 9) Roadside Street Lamps, Utility Poles with Overhead Wires & Bengali Posters
  const lampSpots = [
    [-293.0, -49.2, 0.0],
    [-316.0, -56.5, nwAngle],
    [-334.0, -67.0, nwAngle],
    [-276.0, -24.5, seAngle],
    [-294.5, -108.0, 0.0],
    [-295.5, -148.0, 0.0],
    [-297.0, -188.0, 0.0],
    [-298.5, -222.0, 0.0],
  ];
  for (const [lx, lz, lyaw] of lampSpots) {
    addDoubleArmLamp(staticG, dynamicG, bank, lx, lz, lyaw);
    phys.addCircle(lx, lz, 0.22, 7.2);
  }

  const poleSpots = [
    [-293.8, -56.5, -Math.PI * 0.5],
    [-304.8, -68.0, Math.PI * 0.5],
    [-318.0, -41.0, 0.6],
    [-286.5, -36.5, -2.2],
    [-298.5, -24.5, 0.8],
    [-305.4, -106.0, Math.PI * 0.5],
    [-306.8, -142.0, Math.PI * 0.5],
    [-308.5, -182.0, Math.PI * 0.5],
    [-310.2, -218.0, Math.PI * 0.5],
  ];
  const poleTops = [];
  for (let i = 0; i < poleSpots.length; i++) {
    const [px, pz, pyaw] = poleSpots[i];
    cylinder(staticG, 0.10, 0.15, 8.6, [px, 4.3, pz], bank.concrete, 8);
    phys.addCircle(px, pz, 0.22, 8.6);
    decorateCorridorPole(dynamicG, px, pz, pyaw, 1410 + i);
    poleTops.push([px, 8.2, pz]);
  }
  for (const [aIdx, bIdx] of [[0, 1], [0, 3], [2, 4], [3, 4], [1, 5], [5, 6], [6, 7], [7, 8]]) {
    const a = poleTops[aIdx];
    const b = poleTops[bIdx];
    const mid = [(a[0] + b[0]) * 0.5, 7.65, (a[2] + b[2]) * 0.5];
    rodBetween(staticG, a, mid, 0.015, bank.wireMat, 5);
    rodBetween(staticG, mid, b, 0.015, bank.wireMat, 5);
  }

  // 10) Parked Bangladeshi CNG Auto & Easybike Stands
  const vBank = {
    tire: bank.tireBlack,
    rim: bank.aluminum,
    darkTrim: bank.steelDark,
    chrome: bank.aluminum,
    windshield: bank.glassCurtain,
    headlight: bank.lampGlow,
    taillight: bank.flowerRed,
    amber: bank.flowerGold,
    cngGreen: bank.ptiEmerald,
    cngYellow: bank.roadLineYellow,
    cngRexine: bank.steelDark,
    easyTeal: bank.awningBlue,
    easyCrimson: bank.ptiTerracotta,
    easyRoof: bank.modernWhite,
    plate: bank.roadLineYellow,
  };
  const standCng = buildCNGAuto(vBank);
  standCng.position.set(-296.0, 0.05, -24.5);
  standCng.rotation.y = seAngle;
  staticG.add(standCng);
  phys.addOBB(-296.0, -24.5, 1.5, 2.8, seAngle, 1.8);

  const standEasy = buildEasybike(vBank, false);
  standEasy.position.set(-303.8, 0.05, -64.5);
  standEasy.rotation.y = 0.04;
  staticG.add(standEasy);
  phys.addOBB(-303.8, -64.5, 1.4, 2.7, 0.04, 1.8);

  const schoolEasy = buildEasybike(vBank, true);
  schoolEasy.position.set(-296.0, 0.05, -124.0);
  schoolEasy.rotation.y = Math.PI + 0.04;
  staticG.add(schoolEasy);
  phys.addOBB(-296.0, -124.0, 1.4, 2.7, Math.PI + 0.04, 1.8);

  // Merge all static meshes by material for locked 60+ FPS across Low, Medium, High & Ultra!
  staticG.updateWorldMatrix(true, true);
  const invRoot = staticG.matrixWorld.clone().invert();
  const buckets = new Map();
  staticG.traverse((obj) => {
    if (!obj.isMesh || obj.isInstancedMesh || Array.isArray(obj.material) || !obj.material) return;
    const key = `${obj.material.uuid}-${obj.castShadow}-${obj.receiveShadow}`;
    if (!buckets.has(key)) {
      buckets.set(key, { material: obj.material, cast: obj.castShadow, receive: obj.receiveShadow, meshes: [], geometries: [] });
    }
    const b = buckets.get(key);
    const g = obj.geometry.index ? obj.geometry.toNonIndexed() : obj.geometry.clone();
    g.applyMatrix4(invRoot.clone().multiply(obj.matrixWorld));
    g.clearGroups();
    for (const attr of Object.keys(g.attributes)) {
      if (attr !== 'position' && attr !== 'normal' && attr !== 'uv') g.deleteAttribute(attr);
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) {
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    }
    b.meshes.push(obj);
    b.geometries.push(g);
  });
  for (const b of buckets.values()) {
    if (b.meshes.length < 2) continue;
    const merged = mergeGeometries(b.geometries, false);
    for (const g of b.geometries) g.dispose();
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, b.material);
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.receive;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    for (const orig of b.meshes) orig.removeFromParent();
    staticG.add(mesh);
  }

  const maxDistSq = 340 * 340;

  function getNearbyPrompt(pos) {
    if (!pos || pos.y > 3.2) return null;
    if (Math.hypot(pos.x - -291.5, pos.z - -66.0) < 4.5) {
      return ptiGateTarget > 0.5 ? '[E] Close PTI Main Gate' : '[E] Open PTI Main Gate';
    }
    if (Math.hypot(pos.x - -292.6, pos.z - -130.0) < 4.8) {
      return sjGateTarget > 0.5 ? "[E] Close St. Joseph's School Gate" : "[E] Open St. Joseph's School Gate";
    }
    return null;
  }

  function toggleGate(pos) {
    if (!pos || pos.y > 3.2) return false;
    if (Math.hypot(pos.x - -291.5, pos.z - -66.0) < 5.2) {
      ptiGateTarget = ptiGateTarget > 0.5 ? 0 : 1;
      return true;
    }
    if (Math.hypot(pos.x - -292.6, pos.z - -130.0) < 5.5) {
      sjGateTarget = sjGateTarget > 0.5 ? 0 : 1;
      return true;
    }
    return false;
  }

  return {
    root,
    getGroundHeight: phys.getGroundHeight,
    applyCollisions: phys.applyCollisions,
    getNearbyPrompt,
    toggleGate,
    setNightFactor(nightFactor = 0) {
      const nf = THREE.MathUtils.clamp(nightFactor, 0, 1);
      for (let i = 0; i < bank.emissiveList.length; i++) {
        const item = bank.emissiveList[i];
        item.mat.emissiveIntensity = item.day + (item.night - item.day) * nf;
      }
    },
    syncVisibility(playerPos) {
      if (!playerPos) return;
      const dx = playerPos.x - PTI_MORE_CENTER.x;
      const dz = playerPos.z - PTI_MORE_CENTER.z;
      const want = dx * dx + dz * dz <= maxDistSq;
      if (root.visible !== want) root.visible = want;
    },
    update(time, playerPos = null, dt = 0.016) {
      if (playerPos) this.syncVisibility(playerPos);
      if (!root.visible) return;

      if (Math.abs(ptiGateRatio - ptiGateTarget) > 0.002) {
        ptiGateRatio += (ptiGateTarget - ptiGateRatio) * Math.min(1, dt * 4.5);
        ptiGate.leftLeaf.rotation.y = ptiGateRatio * (Math.PI * 0.46);
        ptiGate.rightLeaf.rotation.y = -ptiGateRatio * (Math.PI * 0.46);
        phys.setGateRatios(ptiGateRatio, sjGateRatio);
      }
      if (Math.abs(sjGateRatio - sjGateTarget) > 0.002) {
        sjGateRatio += (sjGateTarget - sjGateRatio) * Math.min(1, dt * 4.5);
        sjGate.leftLeaf.rotation.y = sjGateRatio * (Math.PI * 0.46);
        sjGate.rightLeaf.rotation.y = -sjGateRatio * (Math.PI * 0.46);
        phys.setGateRatios(ptiGateRatio, sjGateRatio);
      }

      const wave = Math.sin(time * 2.4);
      trafficOfficer.rightArm.rotation.x = -0.85 + wave * 0.32;
      trafficOfficer.rightArm.rotation.z = -0.25 + Math.sin(time * 1.2) * 0.16;
      trafficOfficer.rightForearm.rotation.x = -0.35 + Math.cos(time * 2.4) * 0.28;
      trafficOfficer.leftArm.rotation.x = -0.38 + Math.sin(time * 0.8) * 0.18;
      trafficOfficer.head.rotation.y = Math.sin(time * 0.7) * 0.42;
      trafficOfficer.torso.position.y = 1.02 + Math.sin(time * 2.0) * 0.008;

      for (let i = 0; i < chineseLanterns.length; i++) {
        const l = chineseLanterns[i];
        l.mesh.rotation.z = Math.sin(time * 1.6 + l.phase) * 0.07;
      }
    },
  };
}
