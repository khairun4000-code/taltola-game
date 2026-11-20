import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { box, cylinder, rodBetween, mergeStaticMeshes } from './scene-utils.js';
import { attachDerivedPBRMaps } from './aaa-shaders.js';

/**
 * KHULNA ALIA KAMIL MADRASAH & KHULNA DISTRICT MODEL MOSQUE CAMPUS
 * (খুলনা আলিয়া কামিল মাদ্রাসা · ৮৮ খানজাহান আলী রোড · স্থাপিত: ২ এপ্রিল ১৯৫২)
 *
 * Real-world high-graphics recreation based on official campus photographs:
 *  1) Iconic Walkable Main Administrative & Classroom Building (x = 180..190, z = 88..128)
 *     - Real-photo semicircular brick-tiled central portico with twin grey granite columns,
 *       pointed entrance arch, curved embossed Bengali/English/Arabic fascia lettering & railings
 *     - Vertical slotted concrete balcony balustrades & arched ground-floor colonnade
 *     - Full furnished interiors: 4 Ground-Floor Offices + S-Shaped Marble Switchback Stairs
 *       + 4 Second-Floor Classrooms with mosaic tile floors, wooden doors, fans, ACs & lights
 *  2) Real-photo 4-Story Cream & Deep-Green Arched Academic Building (South, z = 138)
 *  3) Modern 6-Story White & Terracotta Academic Building (North, z = 76)
 *  4) Walkable 4-Story Khulna District Model Mosque & Islamic Cultural Center (cx = 171, cz = 160)
 *     - Grand wide white marble staircase with central green grass planter
 *     - 1 Large Central Dome + 3 Smaller Domes with golden crescent finials
 *     - Tall ornate square geometric-lattice minaret (24m)
 *     - Turquoise-blue pointed-arch windows & Islamic jaali mosaic panels
 *     - Enterable 2nd-floor Prayer Hall with saf prayer carpets, Mihrab, Mimbar & chandelier
 *  5) Grand East Main Gate (interactive [E] gate), Central Pond Brick Ghat, Red-Green Fence,
 *     Foundation Plaque, Red Ixora Flowers, Coconut Palms & 4,050 GPU-Instanced 3D Grass Clumps
 *
 * Performance: mergeStaticMeshes() + GPU Instancing + 280m distance culling (locked 60+ FPS).
 */

export const ALIA_CAMPUS_CENTER = { x: 196.0, z: 122.0 };

function seeded(seed = 1952) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ============================================================================
 * HIGH-RESOLUTION PROCEDURAL PBR TEXTURES
 * ========================================================================== */

function makePorticoBrickTileTexture(seedVal = 1952) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  // Warm pale grout lines
  ctx.fillStyle = '#d4b8a8';
  ctx.fillRect(0, 0, S, S);

  const rows = 16;
  const cols = 8;
  const bh = S / rows;
  const bw = S / cols;

  for (let r = 0; r < rows; r++) {
    const xOff = (r % 2) * (bw * 0.5);
    for (let col = -1; col <= cols; col++) {
      const bx = col * bw + xOff;
      const by = r * bh;
      // Authentic pinkish-peach terracotta ceramic cladding tiles from the real photo
      const R = 212 + Math.floor(rnd() * 24 - 12);
      const G = 164 + Math.floor(rnd() * 22 - 11);
      const B = 148 + Math.floor(rnd() * 20 - 10);
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);

      // Subtle ceramic sheen & stone speckle
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(bx + 3, by + 3, bw - 6, 4);
      ctx.fillStyle = 'rgba(70,35,25,0.10)';
      ctx.fillRect(bx + 3, by + bh - 6, bw - 6, 3);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeGraniteTexture(seedVal = 1966) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = '#737982';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 3200; i++) {
    const v = 55 + Math.floor(rnd() * 140);
    ctx.fillStyle = `rgba(${v},${v + 2},${v + 5},${0.25 + rnd() * 0.45})`;
    ctx.fillRect(rnd() * S, rnd() * S, 1.5 + rnd() * 2.5, 1.5 + rnd() * 2.5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function makeWeatheredPlasterTexture(baseHex, seedVal = 1955, streakAlpha = 0.11) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(40,30,22,0.045)';
    ctx.fillRect(rnd() * S, rnd() * S, 2 + rnd() * 4, 2 + rnd() * 4);
  }
  for (let i = 0; i < 24; i++) {
    const x = rnd() * S;
    const h = 30 + rnd() * 90;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgba(38,42,36,${streakAlpha})`);
    g.addColorStop(1, 'rgba(38,42,36,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 3 + rnd() * 6, h);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeMosaicFloorTexture(baseHex = '#eae4d8', groutHex = '#b8b0a0', seedVal = 1971) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(130,120,105,0.16)' : 'rgba(255,255,255,0.22)';
    ctx.fillRect(rnd() * S, rnd() * S, 2 + rnd() * 3, 2 + rnd() * 3);
  }
  ctx.strokeStyle = groutHex;
  ctx.lineWidth = 2;
  for (let p = 0; p < S; p += 64) {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, S);
    ctx.moveTo(0, p);
    ctx.lineTo(S, p);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function makeIslamicJaaliTexture(bgHex = '#f5f4f0', patternHex = '#0e7490', accentHex = '#0891b2') {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, S, S);

  // Geometric 8-point Islamic star & octagon mosaic lattice (matching Model Mosque facade!)
  const step = 64;
  ctx.lineWidth = 3.2;
  for (let y = 0; y < S; y += step) {
    for (let x = 0; x < S; x += step) {
      const cx = x + step * 0.5;
      const cy = y + step * 0.5;
      ctx.strokeStyle = patternHex;
      ctx.strokeRect(x + 4, y + 4, step - 8, step - 8);

      // Diamond + 8-point star
      ctx.beginPath();
      ctx.moveTo(cx, y + 6);
      ctx.lineTo(x + step - 6, cy);
      ctx.lineTo(cx, y + step - 6);
      ctx.lineTo(x + 6, cy);
      ctx.closePath();
      ctx.fillStyle = 'rgba(14, 116, 144, 0.22)';
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = accentHex;
      ctx.beginPath();
      ctx.arc(cx, cy, step * 0.19, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function makePrayerCarpetTexture() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0c5c3e';
  ctx.fillRect(0, 0, S, S);

  // Gold saf border stripes & arched prayer-mat niches
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(0, 0, S, 10);
  ctx.fillRect(0, S - 10, S, 10);

  for (let x = 0; x < S; x += 64) {
    ctx.strokeStyle = '#e5c158';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 6, 18, 52, S - 36);
    ctx.beginPath();
    ctx.arc(x + 32, 66, 18, Math.PI, 0);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function makeCurvedFasciaTexture({ line1, line2, bg = '#d6a694', fg = '#3b150e', subFg = '#1f2937' }) {
  const W = 1024;
  const H = 224;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const rnd = seeded(19529);

  // Brick tile background matching the curved portico
  ctx.fillStyle = '#d4b8a8';
  ctx.fillRect(0, 0, W, H);
  const bh = 28;
  const bw = 64;
  for (let r = 0; r < H / bh; r++) {
    const off = (r % 2) * (bw * 0.5);
    for (let col = -1; col <= W / bw; col++) {
      const R = 214 + Math.floor(rnd() * 18 - 9);
      const G = 166 + Math.floor(rnd() * 16 - 8);
      const B = 150 + Math.floor(rnd() * 16 - 8);
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fillRect(col * bw + off + 2, r * bh + 2, bw - 4, bh - 4);
    }
  }
  // Subtle top & bottom plaster trim band
  ctx.fillStyle = '#ece6dc';
  ctx.fillRect(0, 0, W, 12);
  ctx.fillRect(0, H - 12, W, 12);

  // Embossed shadow + crisp metallic dark lettering
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 54px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText(line1, W * 0.5 + 2, H * 0.38 + 2, W - 90);
  ctx.fillStyle = fg;
  ctx.fillText(line1, W * 0.5, H * 0.38, W - 90);

  if (line2) {
    ctx.font = 'bold 34px "Manrope", "Noto Sans Bengali", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText(line2, W * 0.5 + 1.5, H * 0.72 + 1.5, W - 100);
    ctx.fillStyle = subFg;
    ctx.fillText(line2, W * 0.5, H * 0.72, W - 100);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
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
  height = 192,
}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, 'rgba(255,255,255,0.16)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = border;
  ctx.lineWidth = 7;
  ctx.strokeRect(8, 8, width - 16, height - 16);
  ctx.fillStyle = accent;
  ctx.fillRect(18, 18, 10, height - 36);

  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 36px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText(title, 44, subtitle ? height * 0.39 : height * 0.50, width - 64);

  if (subtitle) {
    ctx.fillStyle = accent;
    ctx.font = '600 22px "Manrope", "Noto Sans Bengali", sans-serif';
    ctx.fillText(subtitle, 44, height * 0.73, width - 64);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function addSignBox(dynamicG, bank, opts, pos, rotY, w, h, backlit = true) {
  const tex = makeSignTexture(opts);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: backlit ? 0xffffff : 0x000000,
    emissiveMap: backlit ? tex : null,
    emissiveIntensity: backlit ? 0.34 : 0.0,
    roughness: 0.32,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });
  if (backlit) bank.emissiveList.push({ mat, day: 0.32, night: 1.45 });
  const grp = new THREE.Group();
  grp.position.set(pos[0], pos[1], pos[2]);
  grp.rotation.y = rotY;
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.10), bank.steelDark);
  const face = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.125), mat);
  grp.add(bezel, face);
  dynamicG.add(grp);
  return grp;
}

function addRotBox(parent, size, pos, mat, rotY = 0, opts = {}) {
  const mesh = box(parent, size, pos, mat, opts);
  if (rotY) mesh.rotation.y = rotY;
  return mesh;
}

function createAliaMaterialBank(m) {
  const mkPlaster = (hex, seedVal, rough = 0.80, streak = 0.11) => {
    const tex = makeWeatheredPlasterTexture(hex, seedVal, streak);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: rough, metalness: 0.02, envMapIntensity: 0.55 });
    attachDerivedPBRMaps(mat, tex, { strength: 1.5, roughBase: rough, normalScale: 0.55 });
    return mat;
  };

  const porticoBrickTex = makePorticoBrickTileTexture(1952);
  const porticoBrickMat = new THREE.MeshPhysicalMaterial({
    map: porticoBrickTex,
    roughness: 0.42,
    metalness: 0.06,
    clearcoat: 0.35,
    envMapIntensity: 0.8,
  });
  attachDerivedPBRMaps(porticoBrickMat, porticoBrickTex, { strength: 2.2, roughBase: 0.42, normalScale: 0.72 });

  const graniteTex = makeGraniteTexture(1966);
  const graniteMat = new THREE.MeshPhysicalMaterial({
    map: graniteTex,
    roughness: 0.28,
    metalness: 0.12,
    clearcoat: 0.65,
    envMapIntensity: 0.9,
  });

  const mosaicTex = makeMosaicFloorTexture('#ece6da', '#b9b1a3', 1971);
  const mosaicFloorMat = new THREE.MeshPhysicalMaterial({
    map: mosaicTex,
    roughness: 0.34,
    metalness: 0.04,
    clearcoat: 0.45,
  });

  const jaaliTex = makeIslamicJaaliTexture('#f4f4f0', '#0e7490', '#14b8a6');
  const mosqueJaaliMat = new THREE.MeshStandardMaterial({
    map: jaaliTex,
    roughness: 0.45,
    metalness: 0.08,
    envMapIntensity: 0.7,
  });
  attachDerivedPBRMaps(mosqueJaaliMat, jaaliTex, { strength: 2.0, roughBase: 0.45, normalScale: 0.7 });

  const minaretJaaliTex = makeIslamicJaaliTexture('#f2efe8', '#94a3b8', '#64748b');
  const minaretJaaliMat = new THREE.MeshStandardMaterial({
    map: minaretJaaliTex,
    roughness: 0.52,
    metalness: 0.05,
  });
  attachDerivedPBRMaps(minaretJaaliMat, minaretJaaliTex, { strength: 1.9, roughBase: 0.52, normalScale: 0.68 });

  const carpetTex = makePrayerCarpetTexture();
  carpetTex.repeat.set(5, 6);
  const prayerCarpetMat = new THREE.MeshStandardMaterial({
    map: carpetTex,
    roughness: 0.92,
    metalness: 0.02,
  });

  const bank = {
    porticoBrick: porticoBrickMat,
    granite: graniteMat,
    mosaicFloor: mosaicFloorMat,
    mosqueJaali: mosqueJaaliMat,
    minaretJaali: minaretJaaliMat,
    prayerCarpet: prayerCarpetMat,
    colonialCream: mkPlaster('#f3e8d2', 1953, 0.78, 0.10),
    academicCream: mkPlaster('#f6eedc', 1954, 0.76, 0.09),
    whitePlaster: mkPlaster('#f2f3f0', 1955, 0.74, 0.08),
    interiorWall: mkPlaster('#f7f4ec', 1956, 0.80, 0.04),
    terracotta: mkPlaster('#b54936', 1957, 0.82, 0.12),
    warmOchre: mkPlaster('#d6a468', 1958, 0.78, 0.08),
    stonePlinth: mkPlaster('#d4d0c7', 1959, 0.84, 0.10),
    brick: m.brick || mkPlaster('#9e4736', 1960, 0.86, 0.14),
    concrete: m.concrete || mkPlaster('#a8a69e', 1961, 0.86, 0.10),
    darkConcrete: m.darkConcrete || mkPlaster('#4d5256', 1962, 0.88, 0.12),
    marbleWhite: new THREE.MeshPhysicalMaterial({ color: 0xf8f7f3, roughness: 0.22, metalness: 0.04, clearcoat: 0.75 }),
    marbleDome: new THREE.MeshPhysicalMaterial({ color: 0xfbfaf6, roughness: 0.20, metalness: 0.05, clearcoat: 0.80 }),
    mosqueTeal: new THREE.MeshPhysicalMaterial({ color: 0x0d7377, roughness: 0.24, metalness: 0.18, clearcoat: 0.7 }),
    mosqueTurquoise: new THREE.MeshPhysicalMaterial({ color: 0x14919b, roughness: 0.20, metalness: 0.16, clearcoat: 0.8 }),
    emeraldDark: new THREE.MeshStandardMaterial({ color: 0x0f3d2e, roughness: 0.62, metalness: 0.10 }),
    emeraldMat: new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.48, metalness: 0.12 }),
    goldMat: new THREE.MeshPhysicalMaterial({ color: 0xf5b82e, roughness: 0.22, metalness: 0.88, clearcoat: 0.65 }),
    chromeMat: new THREE.MeshStandardMaterial({ color: 0xdce3ec, roughness: 0.20, metalness: 0.90 }),
    steelDark: new THREE.MeshStandardMaterial({ color: 0x22272e, roughness: 0.42, metalness: 0.72 }),
    ironRail: new THREE.MeshStandardMaterial({ color: 0x2d1818, roughness: 0.46, metalness: 0.65 }),
    teakWood: new THREE.MeshStandardMaterial({ color: 0x733e1c, roughness: 0.68, metalness: 0.04 }),
    lightWood: new THREE.MeshStandardMaterial({ color: 0xc89962, roughness: 0.70, metalness: 0.04 }),
    officeDado: new THREE.MeshStandardMaterial({ color: 0x2a6b60, roughness: 0.76 }),
    classDado: new THREE.MeshStandardMaterial({ color: 0x456e8c, roughness: 0.78 }),
    rugRed: new THREE.MeshStandardMaterial({ color: 0x7c2d2d, roughness: 0.92 }),
    cushionDark: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 }),
    glassCurtain: new THREE.MeshPhysicalMaterial({ color: 0x163c52, roughness: 0.08, metalness: 0.22, clearcoat: 0.92 }),
    cavityMat: new THREE.MeshStandardMaterial({ color: 0x0a1512, roughness: 0.94 }),
    flowerRed: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.82 }),
    flowerGold: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.82 }),
    moss: m.moss || new THREE.MeshStandardMaterial({ color: 0x2e6f3e, roughness: 0.90 }),
    grassTurf: new THREE.MeshStandardMaterial({ color: 0x3b7d35, roughness: 0.94 }),
    soilBed: new THREE.MeshStandardMaterial({ color: 0x261d14, roughness: 0.99 }),
    chalkLine: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.92 }),
    awningBlue: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.62 }),
    acMat: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.34 }),
    waterTank: new THREE.MeshPhysicalMaterial({ color: 0x12181f, roughness: 0.38, clearcoat: 0.35 }),
    wire: m.wire || new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 }),
    screenGlow: new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.85, roughness: 0.2 }),
    bulbGlow: new THREE.MeshStandardMaterial({ color: 0xfff8e2, emissive: 0xffd782, emissiveIntensity: 1.0, roughness: 0.24 }),
    tubeGlow: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfefce8, emissiveIntensity: 1.15, roughness: 0.2 }),
    warmWindowLit: new THREE.MeshStandardMaterial({ color: 0xffebb8, emissive: 0xffcf70, emissiveIntensity: 0.22, roughness: 0.24 }),
    mosqueGlow: new THREE.MeshStandardMaterial({ color: 0xe0f2fe, emissive: 0x38bdf8, emissiveIntensity: 0.32, roughness: 0.22 }),
    emissiveList: [],
  };

  bank.emissiveList.push(
    { mat: bank.bulbGlow, day: 0.65, night: 3.10 },
    { mat: bank.tubeGlow, day: 1.05, night: 2.40 },
    { mat: bank.warmWindowLit, day: 0.18, night: 1.85 },
    { mat: bank.mosqueGlow, day: 0.26, night: 2.15 },
  );

  return bank;
}

/* ============================================================================
 * REUSABLE ARCHITECTURAL PROPS
 * ========================================================================== */

function addCeilingFan(staticG, bank, x, y, z) {
  cylinder(staticG, 0.024, 0.024, 0.40, [x, y - 0.20, z], bank.steelDark, 6);
  cylinder(staticG, 0.14, 0.14, 0.08, [x, y - 0.42, z], bank.whitePlaster, 10);
  for (let b = 0; b < 3; b++) {
    const a = (b / 3) * Math.PI * 2;
    addRotBox(staticG, [0.56, 0.018, 0.11], [x + Math.cos(a) * 0.34, y - 0.42, z + Math.sin(a) * 0.34], bank.whitePlaster, -a);
  }
}

function addWallClock(staticG, dynamicG, bank, x, y, z, rotY = Math.PI * 0.5) {
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 14), bank.teakWood);
  rim.rotation.z = Math.PI * 0.5;
  rim.rotation.y = rotY - Math.PI * 0.5;
  rim.position.set(x, y, z);
  staticG.add(rim);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.045, 14), bank.chalkLine);
  face.rotation.z = Math.PI * 0.5;
  face.rotation.y = rotY - Math.PI * 0.5;
  face.position.set(x, y, z);
  dynamicG.add(face);
}

function addCoconutPalm(staticG, bank, x, z, height = 10.5, leanX = 0.5, leanZ = 0.3) {
  const segs = 5;
  let px = x;
  let py = 0;
  let pz = z;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const nx = x + leanX * t * t;
    const ny = height * t;
    const nz = z + leanZ * t * t;
    rodBetween(staticG, [px, py, pz], [nx, ny, nz], THREE.MathUtils.lerp(0.22, 0.11, t), bank.teakWood, 7);
    px = nx; py = ny; pz = nz;
  }
  for (let f = 0; f < 8; f++) {
    const ang = (f / 8) * Math.PI * 2;
    const frondLen = 2.6 + (f % 2) * 0.55;
    const midX = px + Math.cos(ang) * frondLen * 0.55;
    const midY = py + 0.55;
    const midZ = pz + Math.sin(ang) * frondLen * 0.55;
    const tipX = px + Math.cos(ang) * frondLen;
    const tipY = py - 0.55;
    const tipZ = pz + Math.sin(ang) * frondLen;
    rodBetween(staticG, [px, py, pz], [midX, midY, midZ], 0.075, bank.emeraldMat, 5);
    rodBetween(staticG, [midX, midY, midZ], [tipX, tipY, tipZ], 0.055, bank.emeraldMat, 5);
    addRotBox(staticG, [0.56, 0.08, frondLen * 0.72], [midX, midY - 0.12, midZ], bank.emeraldMat, Math.atan2(tipX - px, tipZ - pz));
  }
}

function addParkBench(staticG, bank, x, z, rotY = 0) {
  const bench = new THREE.Group();
  bench.position.set(x, 0, z);
  bench.rotation.y = rotY;
  for (const lx of [-0.72, 0.72]) {
    box(bench, [0.10, 0.45, 0.52], [lx, 0.225, 0], bank.steelDark);
    box(bench, [0.08, 0.48, 0.08], [lx, 0.64, -0.22], bank.steelDark);
  }
  box(bench, [1.65, 0.06, 0.46], [0, 0.44, 0.03], bank.teakWood);
  box(bench, [1.65, 0.34, 0.06], [0, 0.70, -0.22], bank.teakWood);
  staticG.add(bench);
}

function addCampusLamp(staticG, dynamicG, bank, x, z, h = 4.2, yBase = 0.0) {
  cylinder(staticG, 0.14, 0.22, 0.45, [x, yBase + 0.22, z], bank.steelDark, 8);
  cylinder(staticG, 0.055, 0.085, h, [x, yBase + h * 0.5 + 0.2, z], bank.steelDark, 8);
  box(staticG, [0.95, 0.07, 0.08], [x, yBase + h + 0.12, z], bank.steelDark);
  for (const sx of [-0.42, 0.42]) {
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), bank.bulbGlow);
    globe.position.set(x + sx, yBase + h + 0.28, z);
    dynamicG.add(globe);
  }
}

function addRedGreenFenceSpan(staticG, bank, x0, z0, x1, z1, posts = 14) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  const yaw = Math.atan2(dx, dz);
  const midX = (x0 + x1) * 0.5;
  const midZ = (z0 + z1) * 0.5;
  addRotBox(staticG, [0.06, 0.06, len], [midX, 0.96, midZ], bank.flowerRed, yaw);
  addRotBox(staticG, [0.05, 0.05, len], [midX, 0.50, midZ], bank.emeraldMat, yaw);
  addRotBox(staticG, [0.06, 0.06, len], [midX, 0.14, midZ], bank.flowerRed, yaw);
  for (let i = 0; i <= posts; i++) {
    const t = i / posts;
    const mat = i % 2 === 0 ? bank.flowerRed : bank.emeraldMat;
    box(staticG, [0.06, 0.98, 0.06], [x0 + dx * t, 0.52, z0 + dz * t], mat);
  }
}

function addRailingSpan(staticG, bank, x0, z0, x1, z1, posts = 6, height = 0.92, yBase = 0.03) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  const yaw = Math.atan2(dx, dz);
  const midX = (x0 + x1) * 0.5;
  const midZ = (z0 + z1) * 0.5;
  for (let i = 0; i <= posts; i++) {
    const t = i / posts;
    cylinder(staticG, 0.035, 0.042, height, [x0 + dx * t, yBase + height * 0.5, z0 + dz * t], bank.steelDark, 6);
  }
  addRotBox(staticG, [0.06, 0.06, len], [midX, yBase + height - 0.04, midZ], bank.steelDark, yaw);
  addRotBox(staticG, [0.04, 0.04, len], [midX, yBase + height * 0.52, midZ], bank.steelDark, yaw);
}

/* ============================================================================
 * 1. MAIN WALKABLE BUILDING INTERIORS (OFFICES + CLASSROOMS)
 * ========================================================================== */

function addAliaOfficeFurniture(staticG, dynamicG, bank, cx, cz, fy, labelTitle) {
  // Teal-Green Dado Paneling + Patterned Office Rug
  box(staticG, [0.06, 1.15, 7.8], [180.22, fy + 0.58, cz], bank.officeDado);
  box(staticG, [6.8, 1.15, 0.06], [cx - 0.1, fy + 0.58, cz - 3.95], bank.officeDado);
  box(staticG, [6.8, 1.15, 0.06], [cx - 0.1, fy + 0.58, cz + 3.95], bank.officeDado);
  box(staticG, [3.6, 0.025, 4.4], [cx - 0.2, fy + 0.015, cz], bank.rugRed);

  // Executive Teak Desk + Computer Monitor + Keyboard + Files + Pen Cup + Nameplate
  box(staticG, [1.75, 0.78, 0.92], [cx - 0.55, fy + 0.39, cz], bank.teakWood);
  box(staticG, [1.82, 0.06, 0.98], [cx - 0.55, fy + 0.79, cz], bank.warmOchre);
  box(staticG, [0.06, 0.34, 0.54], [cx - 0.78, fy + 1.04, cz - 0.05], bank.steelDark);
  box(dynamicG, [0.03, 0.28, 0.48], [cx - 0.74, fy + 1.04, cz - 0.05], bank.screenGlow, { castShadow: false });
  box(staticG, [0.16, 0.08, 0.14], [cx - 0.78, fy + 0.85, cz - 0.05], bank.steelDark);
  box(staticG, [0.16, 0.025, 0.38], [cx - 0.48, fy + 0.83, cz - 0.05], bank.steelDark);
  box(staticG, [0.09, 0.025, 0.06], [cx - 0.48, fy + 0.83, cz + 0.22], bank.steelDark);
  box(staticG, [0.28, 0.04, 0.22], [cx - 0.45, fy + 0.84, cz - 0.34], bank.awningBlue);
  box(staticG, [0.28, 0.04, 0.22], [cx - 0.44, fy + 0.88, cz - 0.34], bank.flowerRed);
  box(staticG, [0.28, 0.04, 0.22], [cx - 0.46, fy + 0.92, cz - 0.34], bank.emeraldMat);
  cylinder(staticG, 0.035, 0.035, 0.09, [cx - 0.36, fy + 0.86, cz + 0.34], bank.goldMat, 8);
  cylinder(staticG, 0.035, 0.03, 0.07, [cx - 0.22, fy + 0.85, cz + 0.24], bank.chalkLine, 8);
  box(staticG, [0.08, 0.09, 0.28], [cx - 0.12, fy + 0.86, cz], bank.goldMat);

  // Executive Chair + 2 Visitor Chairs + Waiting Guest Sofa & Coffee Table
  box(staticG, [0.60, 0.12, 0.60], [cx - 1.72, fy + 0.46, cz], bank.cushionDark);
  box(staticG, [0.12, 0.68, 0.56], [cx - 1.98, fy + 0.82, cz], bank.cushionDark);
  cylinder(staticG, 0.04, 0.05, 0.42, [cx - 1.72, fy + 0.22, cz], bank.steelDark, 8);
  for (const vz of [-0.62, 0.62]) {
    box(staticG, [0.50, 0.08, 0.50], [cx + 0.72, fy + 0.44, cz + vz], bank.cushionDark);
    box(staticG, [0.08, 0.48, 0.48], [cx + 0.94, fy + 0.70, cz + vz], bank.cushionDark);
    for (const [lx, lz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) {
      box(staticG, [0.04, 0.42, 0.04], [cx + 0.72 + lx, fy + 0.21, cz + vz + lz], bank.steelDark);
    }
  }
  box(staticG, [2.1, 0.42, 0.72], [cx + 0.4, fy + 0.21, cz - 3.35], bank.cushionDark);
  box(staticG, [2.1, 0.46, 0.16], [cx + 0.4, fy + 0.62, cz - 3.65], bank.cushionDark);
  box(staticG, [1.1, 0.42, 0.55], [cx + 0.4, fy + 0.21, cz - 2.35], bank.teakWood);

  // Bookshelf + Steel Almirah + Water Dispenser + Potted Plant
  box(staticG, [0.56, 2.15, 2.2], [cx - 2.95, fy + 1.075, cz - 1.7], bank.teakWood);
  const bookCols = [bank.flowerRed, bank.awningBlue, bank.emeraldMat, bank.flowerGold, bank.terracotta];
  for (let shelf = 0; shelf < 4; shelf++) {
    const sy = fy + 0.35 + shelf * 0.46;
    for (let bi = 0; bi < 7; bi++) {
      box(staticG, [0.24, 0.30, 0.22], [cx - 2.72, sy, cz - 2.45 + bi * 0.25], bookCols[(shelf + bi) % bookCols.length]);
    }
  }
  box(staticG, [0.58, 2.15, 1.8], [cx - 2.95, fy + 1.075, cz + 1.8], bank.steelDark);
  box(staticG, [0.36, 0.92, 0.36], [cx - 2.85, fy + 0.46, cz + 3.25], bank.chalkLine);
  cylinder(staticG, 0.14, 0.14, 0.42, [cx - 2.85, fy + 1.12, cz + 3.25], bank.awningBlue, 10);
  cylinder(staticG, 0.18, 0.14, 0.36, [cx + 2.45, fy + 0.18, cz + 3.25], bank.terracotta, 8);
  box(staticG, [0.55, 0.72, 0.55], [cx + 2.45, fy + 0.66, cz + 3.25], bank.emeraldMat);

  // Ceiling Fan + Split AC + LED Tube Lights + Wall Clock + Signboards
  addCeilingFan(staticG, bank, cx - 0.1, fy + 3.25, cz);
  box(staticG, [0.24, 0.32, 1.05], [180.32, fy + 2.72, cz], bank.acMat);
  addWallClock(staticG, dynamicG, bank, 180.26, fy + 2.45, cz - 2.2, Math.PI * 0.5);
  box(dynamicG, [1.6, 0.07, 0.12], [cx - 0.2, fy + 3.24, cz - 1.8], bank.tubeGlow, { castShadow: false });
  box(dynamicG, [1.6, 0.07, 0.12], [cx - 0.2, fy + 3.24, cz + 1.8], bank.tubeGlow, { castShadow: false });
  addSignBox(
    dynamicG,
    bank,
    { title: 'নোটিশ বোর্ড · খুলনা আলিয়া মাদ্রাসা', subtitle: 'অফিস সময়: সকাল ৮:৩০ – বিকাল ৪:০০ · ৮৮ খানজাহান আলী রোড', bg: '#0f3d2e', fg: '#ffffff', accent: '#fde047' },
    [cx - 0.2, fy + 1.75, cz + 3.84],
    Math.PI,
    2.1,
    0.85,
    false
  );
  if (labelTitle) {
    addSignBox(
      dynamicG,
      bank,
      { title: labelTitle, subtitle: 'KHULNA ALIA KAMIL MADRASAH', bg: '#064e3b', fg: '#ffffff', accent: '#fde047' },
      [187.52, fy + 2.55, cz],
      Math.PI * 0.5,
      1.95,
      0.52,
      true
    );
  }
}

function addAliaClassroomFurniture(staticG, dynamicG, bank, cx, cz, fy, roomName) {
  // Lower Classroom Dado + Raised Wooden Teacher Podium
  box(staticG, [0.06, 1.12, 7.8], [180.22, fy + 0.56, cz], bank.classDado);
  box(staticG, [6.8, 1.12, 0.06], [cx - 0.1, fy + 0.56, cz - 3.95], bank.classDado);
  box(staticG, [6.8, 1.12, 0.06], [cx - 0.1, fy + 0.56, cz + 3.95], bank.classDado);
  box(staticG, [1.55, 0.16, 4.4], [cx - 2.35, fy + 0.08, cz], bank.warmOchre);

  // Framed Green Chalkboard + Chalk Tray + Duster & Chalk
  box(staticG, [0.12, 1.45, 3.65], [180.28, fy + 1.62, cz], bank.teakWood);
  addSignBox(
    dynamicG,
    bank,
    {
      title: 'বিসমিল্লাহির রাহমানির রাহিম · আল-কুরআন ও হাদিস',
      subtitle: 'খুলনা আলিয়া কামিল মাদ্রাসা · আজকের পাঠ ও তারিখ',
      bg: '#134e3a',
      fg: '#f8fafc',
      accent: '#fde68a',
      border: '#784421',
    },
    [180.38, fy + 1.62, cz],
    Math.PI * 0.5,
    3.45,
    1.28,
    false
  );
  box(staticG, [0.18, 0.07, 3.55], [180.38, fy + 0.92, cz], bank.teakWood);
  box(staticG, [0.06, 0.04, 0.18], [180.42, fy + 0.98, cz - 0.6], bank.warmOchre);
  box(staticG, [0.03, 0.03, 0.12], [180.42, fy + 0.97, cz + 0.4], bank.chalkLine);

  // Teacher's Desk + Chair + Attendance Register
  box(staticG, [0.78, 0.80, 1.42], [cx - 1.95, fy + 0.56, cz], bank.teakWood);
  box(staticG, [0.34, 0.04, 0.44], [cx - 1.92, fy + 0.98, cz - 0.15], bank.chalkLine);
  cylinder(staticG, 0.04, 0.04, 0.22, [cx - 1.85, fy + 1.07, cz + 0.42], bank.awningBlue, 8);
  box(staticG, [0.46, 0.46, 0.46], [cx - 2.55, fy + 0.39, cz], bank.steelDark);
  box(staticG, [0.08, 0.48, 0.46], [cx - 2.76, fy + 0.72, cz], bank.steelDark);

  // 3 Rows x 2 Columns of Bangladeshi High-Desk & Low-Bench Sets with Open Books
  const bookCols = [bank.awningBlue, bank.flowerRed, bank.emeraldMat, bank.flowerGold];
  for (let row = 0; row < 3; row++) {
    const rx = cx - 0.55 + row * 1.18;
    for (let ci = 0; ci < 2; ci++) {
      const colZ = ci === 0 ? (cz - 1.62) : (cz + 1.62);
      box(staticG, [0.46, 0.05, 2.25], [rx, fy + 0.74, colZ], bank.teakWood);
      box(staticG, [0.38, 0.04, 2.15], [rx, fy + 0.54, colZ], bank.warmOchre);
      for (const lz of [-1.02, 1.02]) {
        box(staticG, [0.44, 0.74, 0.06], [rx, fy + 0.37, colZ + lz], bank.teakWood);
        box(staticG, [0.32, 0.44, 0.06], [rx + 0.46, fy + 0.22, colZ + lz], bank.teakWood);
      }
      box(staticG, [0.34, 0.05, 2.25], [rx + 0.46, fy + 0.44, colZ], bank.warmOchre);
      box(staticG, [0.22, 0.025, 0.30], [rx, fy + 0.78, colZ - 0.55], bank.chalkLine);
      box(staticG, [0.20, 0.035, 0.26], [rx, fy + 0.785, colZ + 0.48], bookCols[(row + ci) % bookCols.length]);
    }
  }

  // 2 Ceiling Fans + 2 LED Tube Lights + Wall Clock + Routine Board + Dustbin
  addCeilingFan(staticG, bank, cx - 0.2, fy + 3.25, cz - 1.65);
  addCeilingFan(staticG, bank, cx - 0.2, fy + 3.25, cz + 1.65);
  box(dynamicG, [2.1, 0.06, 0.12], [cx + 0.2, fy + 3.24, cz - 2.6], bank.tubeGlow, { castShadow: false });
  box(dynamicG, [2.1, 0.06, 0.12], [cx + 0.2, fy + 3.24, cz + 2.6], bank.tubeGlow, { castShadow: false });
  addWallClock(staticG, dynamicG, bank, 180.26, fy + 2.62, cz + 2.65, Math.PI * 0.5);
  cylinder(staticG, 0.16, 0.13, 0.36, [cx + 2.55, fy + 0.18, cz - 3.35], bank.steelDark, 8);
  addSignBox(
    dynamicG,
    bank,
    { title: 'ক্লাস রুটিন ও সময়সূচী', subtitle: 'সকাল ৯:০০ – দুপুর ২:৩০ · আলিয়া মাদ্রাসা', bg: '#1e3a8a', fg: '#ffffff', accent: '#fde047' },
    [cx + 0.4, fy + 1.75, cz - 3.84],
    0,
    1.85,
    0.78,
    false
  );
  addSignBox(
    dynamicG,
    bank,
    { title: roomName, subtitle: '২য় তলা · CLASSROOM', bg: '#1e3a8a', fg: '#ffffff', accent: '#fde047' },
    [187.52, fy + 2.55, cz],
    Math.PI * 0.5,
    1.95,
    0.52,
    true
  );
}

/* ============================================================================
 * 2. REAL-PHOTO MAIN BUILDING + SEMICIRCULAR BRICK-TILED PORTICO
 * ========================================================================== */

function buildMainPorticoBuilding(staticG, dynamicG, bank) {
  const mainX = 185.0;
  const mainZ = 108.0;
  const y0 = 0.45;
  const y1 = 3.85;
  const y2 = 7.25;
  const yRoof = 10.65;

  // Ground Plinth with Polished Mosaic Tile Surface + Wide Entry Ramp (x = 189.8..192.4, z = 105.4..110.6)
  box(staticG, [10.4, y0 - 0.04, 40.4], [mainX, (y0 - 0.04) * 0.5, mainZ], bank.stonePlinth);
  box(staticG, [10.2, 0.04, 40.2], [mainX, y0 - 0.02, mainZ], bank.mosaicFloor, { castShadow: false, uvScale: 4.0 });
  box(staticG, [2.6, 0.22, 5.4], [191.1, 0.14, mainZ], bank.stonePlinth);

  // 2nd Floor Slab (with stairwell cutout at x = 180.4..187.2, z = 105.4..110.6)
  box(staticG, [10.2, 0.24, 17.4], [mainX, y1 - 0.14, 96.7], bank.colonialCream);
  box(staticG, [10.2, 0.24, 17.4], [mainX, y1 - 0.14, 119.3], bank.colonialCream);
  box(staticG, [3.0, 0.24, 5.6], [188.6, y1 - 0.14, mainZ], bank.colonialCream);
  // Mosaic top surface on 2nd floor
  box(staticG, [10.0, 0.03, 17.2], [mainX, y1 - 0.015, 96.7], bank.mosaicFloor, { castShadow: false, uvScale: 3.5 });
  box(staticG, [10.0, 0.03, 17.2], [mainX, y1 - 0.015, 119.3], bank.mosaicFloor, { castShadow: false, uvScale: 3.5 });
  box(staticG, [2.9, 0.03, 5.5], [188.6, y1 - 0.015, mainZ], bank.mosaicFloor, { castShadow: false, uvScale: 2.0 });

  // 3rd Floor Slab, Exterior Massing & Terracotta Roof Cornice
  box(staticG, [10.4, 0.28, 40.2], [mainX, y2 - 0.14, mainZ], bank.colonialCream);
  box(staticG, [10.4, 3.25, 40.0], [mainX, y2 + 1.62, mainZ], bank.colonialCream);
  box(staticG, [11.0, 0.52, 40.8], [mainX, yRoof, mainZ], bank.terracotta);
  box(staticG, [10.8, 0.20, 40.6], [mainX, yRoof + 0.34, mainZ], bank.whitePlaster);

  // Outer Perimeter Walls (West back wall, North & South end walls) across Ground & 2nd Floor
  box(staticG, [0.36, y2 - y0, 40.2], [180.0, (y0 + y2) * 0.5, mainZ], bank.colonialCream);
  box(staticG, [10.2, y2 - y0, 0.36], [mainX, (y0 + y2) * 0.5, 88.0], bank.colonialCream);
  box(staticG, [10.2, y2 - y0, 0.36], [mainX, (y0 + y2) * 0.5, 128.0], bank.colonialCream);

  // Exterior Recessed Windows with Iron Grilles along West back wall & North/South end walls
  for (const fy of [y0, y1, y2]) {
    for (let wz = 91.0; wz <= 125.0; wz += 4.2) {
      if (Math.abs(wz - mainZ) < 3.4) continue;
      box(staticG, [0.16, 1.55, 1.85], [179.78, fy + 1.72, wz], bank.glassCurtain, { castShadow: false });
      box(staticG, [0.24, 0.12, 2.05], [179.75, fy + 2.55, wz], bank.whitePlaster);
      box(staticG, [0.24, 0.10, 2.05], [179.75, fy + 0.90, wz], bank.whitePlaster);
    }
  }

  // Real-Photo East Front Arched Colonnade + Vertical Slotted Concrete Balustrades (`| | | | |`) on 2nd & 3rd Floors!
  const bayWidth = 3.4;
  for (let wz = -17.0; wz <= 17.0; wz += bayWidth) {
    if (Math.abs(wz) < 3.2) continue;
    const pz = mainZ + wz;
    // Vertical colonnade piers across all 3 stories
    box(staticG, [0.40, yRoof - y0, 0.42], [189.85, (y0 + yRoof) * 0.5, pz], bank.colonialCream);
    box(staticG, [0.46, 0.24, 0.48], [189.85, y1 - 0.10, pz], bank.whitePlaster);
    box(staticG, [0.46, 0.24, 0.48], [189.85, y2 - 0.10, pz], bank.whitePlaster);

    // Arched spandrel headers between columns on Ground & 2nd Floor
    const nextZ = pz + bayWidth;
    if (wz < 16.5 && Math.abs(wz + bayWidth * 0.5) > 3.2) {
      const midBayZ = (pz + nextZ) * 0.5;
      // Ground floor subtle arch spandrels
      box(staticG, [0.34, 0.42, bayWidth - 0.38], [189.85, y1 - 0.42, midBayZ], bank.colonialCream);
      // 2nd Floor Real-Photo Vertical Slotted Concrete Balustrade (`| | | | |`)!
      box(staticG, [0.24, 0.14, bayWidth - 0.36], [189.85, y1 + 0.08, midBayZ], bank.colonialCream);
      box(staticG, [0.24, 0.16, bayWidth - 0.36], [189.85, y1 + 0.96, midBayZ], bank.colonialCream);
      box(staticG, [0.06, 0.05, bayWidth - 0.36], [189.88, y1 + 1.12, midBayZ], bank.ironRail);
      for (let slot = -1.2; slot <= 1.21; slot += 0.40) {
        box(staticG, [0.20, 0.78, 0.18], [189.85, y1 + 0.52, midBayZ + slot], bank.colonialCream);
      }
      // 3rd Floor Shaded Veranda Cavity + Slotted Parapet + Warm Lit Windows
      box(staticG, [0.26, 2.05, bayWidth - 0.44], [189.62, y2 + 1.98, midBayZ], bank.emeraldDark, { castShadow: false });
      box(dynamicG, [0.10, 1.35, 1.35], [189.45, y2 + 1.92, midBayZ], bank.warmWindowLit, { castShadow: false });
      box(staticG, [0.24, 0.14, bayWidth - 0.36], [189.85, y2 + 0.08, midBayZ], bank.colonialCream);
      box(staticG, [0.24, 0.16, bayWidth - 0.36], [189.85, y2 + 0.96, midBayZ], bank.colonialCream);
      for (let slot = -1.2; slot <= 1.21; slot += 0.40) {
        box(staticG, [0.20, 0.78, 0.18], [189.85, y2 + 0.52, midBayZ + slot], bank.colonialCream);
      }
    }
  }

  // Interior Hallway Partition Walls + Wooden Door Frames (Ground & 2nd Floors)
  for (const fy of [y0, y1]) {
    const wallH = 3.25;
    const midY = fy + wallH * 0.5;
    // South wing rooms (z = 111.0..127.8) — open doors at z = 114.2..116.2 and z = 122.2..124.2
    box(staticG, [0.24, wallH, 3.2], [187.3, midY, 112.6], bank.interiorWall);
    box(staticG, [0.24, wallH, 6.0], [187.3, midY, 119.2], bank.interiorWall);
    box(staticG, [0.24, wallH, 3.6], [187.3, midY, 126.0], bank.interiorWall);
    // North wing rooms (z = 88.2..105.0) — open doors at z = 91.8..93.8 and z = 99.8..101.8
    box(staticG, [0.24, wallH, 3.6], [187.3, midY, 90.0], bank.interiorWall);
    box(staticG, [0.24, wallH, 6.0], [187.3, midY, 96.8], bank.interiorWall);
    box(staticG, [0.24, wallH, 3.2], [187.3, midY, 103.4], bank.interiorWall);
    // Doorway lintels & teak door frames + swung-open wooden door leaves!
    for (const dz of [92.8, 100.8, 115.2, 123.2]) {
      box(staticG, [0.24, wallH - 2.30, 2.04], [187.3, fy + 2.30 + (wallH - 2.30) * 0.5, dz], bank.interiorWall);
      box(staticG, [0.28, 2.30, 0.08], [187.3, fy + 1.15, dz - 0.98], bank.teakWood);
      box(staticG, [0.28, 2.30, 0.08], [187.3, fy + 1.15, dz + 0.98], bank.teakWood);
      box(staticG, [0.28, 0.08, 2.04], [187.3, fy + 2.28, dz], bank.teakWood);
      // Open wooden door swung inward
      box(staticG, [0.92, 2.22, 0.06], [186.80, fy + 1.11, dz - 0.92], bank.teakWood);
    }
    // Corridor ceiling LED lights
    for (const lz of [93.0, 101.0, 115.0, 123.0]) {
      box(dynamicG, [0.14, 0.05, 1.45], [188.6, fy + 3.22, lz], bank.tubeGlow, { castShadow: false });
    }
    // Room divider walls
    box(staticG, [7.2, wallH, 0.24], [183.7, midY, 111.0], bank.interiorWall);
    box(staticG, [7.2, wallH, 0.24], [183.7, midY, 119.4], bank.interiorWall);
    box(staticG, [7.2, wallH, 0.24], [183.7, midY, 105.0], bank.interiorWall);
    box(staticG, [7.2, wallH, 0.24], [183.7, midY, 96.6], bank.interiorWall);
  }

  // GRAND S-SHAPED (SWITCHBACK) MARBLE STAIRCASE (x = 180.4..187.2, z = 105.4..110.6)
  const stepsPerFlight = 10;
  for (let i = 0; i < stepsPerFlight; i++) {
    const t = (i + 0.5) / stepsPerFlight;
    const sx = THREE.MathUtils.lerp(187.2, 182.2, t);
    const sy = THREE.MathUtils.lerp(y0, 2.15, (i + 1) / stepsPerFlight);
    box(staticG, [0.54, sy - y0, 2.25], [sx, y0 + (sy - y0) * 0.5, 109.3], bank.marbleWhite);
    box(staticG, [0.06, 0.025, 2.25], [sx + 0.25, sy + 0.005, 109.3], bank.granite);
  }
  box(staticG, [2.0, 0.24, 5.4], [181.25, 2.04, mainZ], bank.marbleWhite);
  for (let i = 0; i < stepsPerFlight; i++) {
    const t = (i + 0.5) / stepsPerFlight;
    const sx = THREE.MathUtils.lerp(182.2, 187.2, t);
    const sy = THREE.MathUtils.lerp(2.15, y1, (i + 1) / stepsPerFlight);
    box(staticG, [0.54, 0.24, 2.25], [sx, sy - 0.12, 106.7], bank.marbleWhite);
    box(staticG, [0.06, 0.025, 2.25], [sx - 0.25, sy + 0.005, 106.7], bank.granite);
  }
  rodBetween(staticG, [187.2, y0 + 0.95, 108.05], [182.2, 2.15 + 0.95, 108.05], 0.04, bank.chromeMat);
  rodBetween(staticG, [182.2, 2.15 + 0.95, 107.95], [187.2, y1 + 0.95, 107.95], 0.04, bank.chromeMat);

  // Furnished Rooms: Ground Floor Offices + 2nd Floor Classrooms
  addAliaOfficeFurniture(staticG, dynamicG, bank, 183.8, 115.2, y0, 'অধ্যক্ষের কার্যালয় (PRINCIPAL OFFICE)');
  addAliaOfficeFurniture(staticG, dynamicG, bank, 183.8, 123.6, y0, 'একাডেমিক অফিস রুম (OFFICE ROOM)');
  addAliaOfficeFurniture(staticG, dynamicG, bank, 183.8, 100.8, y0, 'শিক্ষক মিলনায়তন (TEACHERS ROOM)');
  addAliaOfficeFurniture(staticG, dynamicG, bank, 183.8, 92.4, y0, 'হিসাব ও রেজিস্ট্রার অফিস');

  addAliaClassroomFurniture(staticG, dynamicG, bank, 183.8, 115.2, y1, 'শ্রেণিকক্ষ ১০১ (CLASSROOM 101)');
  addAliaClassroomFurniture(staticG, dynamicG, bank, 183.8, 123.6, y1, 'শ্রেণিকক্ষ ১০২ (CLASSROOM 102)');
  addAliaClassroomFurniture(staticG, dynamicG, bank, 183.8, 100.8, y1, 'শ্রেণিকক্ষ ২০১ (CLASSROOM 201)');
  addAliaClassroomFurniture(staticG, dynamicG, bank, 183.8, 92.4, y1, 'শ্রেণিকক্ষ ২০২ (CLASSROOM 202)');

  // ============================================================================
  // ICONIC REAL-PHOTO SEMICIRCULAR BRICK-TILED CENTRAL PORTICO TOWER!
  // Matches exact photograph: pinkish-terracotta ceramic brick tiles, twin pairs
  // of grey granite columns with steel rings, arched ground portal, curved embossed
  // Bengali/English/Arabic fascia lettering, and curved black top railings!
  // ============================================================================
  const portX = 190.4;
  cylinder(staticG, 4.55, 4.68, 0.34, [portX, 0.17, mainZ], bank.stonePlinth, 28);

  // 4 Speckled Grey Granite Columns with Polished Steel Collar Rings (wide open center portal!)
  for (const ang of [-1.18, -0.62, 0.62, 1.18]) {
    const px = portX + Math.cos(ang) * 4.22;
    const pz = mainZ + Math.sin(ang) * 4.22;
    cylinder(staticG, 0.25, 0.28, 3.55, [px, 1.98, pz], bank.granite, 12);
    cylinder(staticG, 0.31, 0.33, 0.16, [px, 0.42, pz], bank.chromeMat, 12);
    cylinder(staticG, 0.30, 0.30, 0.14, [px, 3.65, pz], bank.chromeMat, 12);
  }

  // Curved Arch Fascia Spandrel over Ground Entrance Portal
  const archSpan = 16;
  for (let i = 0; i < archSpan; i++) {
    const t = i / (archSpan - 1);
    const a = THREE.MathUtils.lerp(-0.62, 0.62, t);
    const archDip = Math.cos(t * Math.PI - Math.PI * 0.5) * 0.72; // higher at center!
    const hBand = 1.05 - archDip * 0.72;
    const ax = portX + Math.cos(a) * 4.34;
    const az = mainZ + Math.sin(a) * 4.34;
    addRotBox(staticG, [0.34, hBand, 0.42], [ax, 3.65 - hBand * 0.5, az], bank.porticoBrick, -a);
  }

  // 1st-Floor & 2nd-Floor Curved Brick-Tiled Parapet Bands + Recessed Shaded Verandas + Curved Iron Railings
  cylinder(staticG, 4.72, 4.72, 1.18, [portX, 4.02, mainZ], bank.porticoBrick, 28);
  cylinder(staticG, 4.82, 4.82, 0.12, [portX, 4.65, mainZ], bank.whitePlaster, 28);
  cylinder(staticG, 4.76, 4.76, 0.05, [portX, 4.88, mainZ], bank.ironRail, 28); // Curved black top handrail

  // Deep Shaded 2nd-Floor Curved Veranda + Inner Columns + Ceiling Glow
  cylinder(staticG, 4.32, 4.32, 2.28, [portX, 5.75, mainZ], bank.emeraldDark, 24);
  for (const ang of [-1.05, -0.45, 0.45, 1.05]) {
    cylinder(staticG, 0.16, 0.18, 2.35, [portX + Math.cos(ang) * 4.52, 5.75, mainZ + Math.sin(ang) * 4.52], bank.whitePlaster, 10);
  }

  // 2nd-Floor Curved Brick-Tiled Parapet Band + Railings
  cylinder(staticG, 4.76, 4.76, 1.24, [portX, 7.38, mainZ], bank.porticoBrick, 28);
  cylinder(staticG, 4.86, 4.86, 0.12, [portX, 8.04, mainZ], bank.whitePlaster, 28);
  cylinder(staticG, 4.80, 4.80, 0.05, [portX, 8.26, mainZ], bank.ironRail, 28);

  // 3rd-Floor Shaded Curved Veranda + Columns + Top Crown
  cylinder(staticG, 4.32, 4.32, 2.22, [portX, 9.10, mainZ], bank.emeraldDark, 24);
  for (const ang of [-1.05, -0.45, 0.45, 1.05]) {
    cylinder(staticG, 0.16, 0.18, 2.25, [portX + Math.cos(ang) * 4.52, 9.10, mainZ + Math.sin(ang) * 4.52], bank.whitePlaster, 10);
  }
  cylinder(staticG, 4.84, 4.84, 1.55, [portX, 10.95, mainZ], bank.porticoBrick, 28);
  cylinder(staticG, 4.96, 4.96, 0.26, [portX, 11.82, mainZ], bank.terracotta, 28);

  // Recessed Portico Entry Ceiling Downlights
  for (const [lx, lz] of [[portX + 1.8, mainZ - 1.4], [portX + 1.8, mainZ + 1.4], [portX + 3.0, mainZ]]) {
    const downlight = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 10), bank.bulbGlow);
    downlight.position.set(lx, 3.42, lz);
    dynamicG.add(downlight);
  }

  // CURVED EMBOSSED LETTERING WRAPPED DIRECTLY ONTO THE SEMICIRCULAR PORTICO FASCIA!
  // Three.js CylinderGeometry arc facing +X: thetaStart = Math.PI * 0.5 - span/2
  const arcSpan = Math.PI * 0.68;
  const arcStart = Math.PI * 0.5 - arcSpan * 0.5;
  const fascia1Tex = makeCurvedFasciaTexture({
    line1: 'খুলনা আলিয়া কামিল মাদ্রাসা (অনার্স)',
    line2: 'KHULNA ALIA KAMIL MADRASA (HONOURS) · স্থাপিত: ১৯৫২',
  });
  const fascia1Mat = new THREE.MeshStandardMaterial({ map: fascia1Tex, roughness: 0.45, metalness: 0.08 });
  const fascia1Mesh = new THREE.Mesh(new THREE.CylinderGeometry(4.75, 4.75, 1.12, 28, 1, true, arcStart, arcSpan), fascia1Mat);
  fascia1Mesh.position.set(portX, 4.02, mainZ);
  dynamicG.add(fascia1Mesh);

  const fascia2Tex = makeCurvedFasciaTexture({
    line1: 'المدرسة العالية كامل خولنا · খুলনা আলিয়া কামিল মাদ্রাসা',
    line2: 'KHULNA ALIA KAMIL MADRASAH · ৮৮ খানজাহান আলী রোড, খুলনা',
  });
  const fascia2Mat = new THREE.MeshStandardMaterial({ map: fascia2Tex, roughness: 0.45, metalness: 0.08 });
  const fascia2Mesh = new THREE.Mesh(new THREE.CylinderGeometry(4.79, 4.79, 1.18, 28, 1, true, arcStart, arcSpan), fascia2Mat);
  fascia2Mesh.position.set(portX, 7.38, mainZ);
  dynamicG.add(fascia2Mesh);
}

/* ============================================================================
 * 3. REAL-PHOTO 4-STORY ARCHED ACADEMIC BUILDING (SOUTH, z = 138)
 *    & MODERN 6-STORY ACADEMIC BUILDING (NORTH, z = 76)
 * ========================================================================== */

function buildAcademicBuildings(staticG, dynamicG, bank) {
  // A) REAL-PHOTO 4-STORY CREAM & DEEP-GREEN ARCHED ACADEMIC BUILDING (South Courtyard Side, z = 138)
  const b4x = 204.0;
  const b4z = 138.0;
  const b4H = 13.0;
  box(staticG, [32.4, 0.45, 9.4], [b4x, 0.225, b4z], bank.stonePlinth);
  box(staticG, [31.4, b4H, 8.4], [b4x, b4H * 0.5 + 0.40, b4z], bank.academicCream, { uvScale: 3.2 });
  box(staticG, [32.2, 0.48, 9.1], [b4x, b4H + 0.62, b4z], bank.terracotta);
  // Rooftop Parapet + Iconic Right-Side Stair Tower (just like the kakm.edu.bd photo!)
  box(staticG, [31.6, 0.85, 0.24], [b4x, b4H + 1.25, b4z - 4.2], bank.academicCream);
  box(staticG, [31.6, 0.85, 0.24], [b4x, b4H + 1.25, b4z + 4.2], bank.academicCream);
  box(staticG, [4.8, 3.4, 5.4], [b4x - 12.8, b4H + 2.2, b4z], bank.academicCream);
  box(staticG, [5.1, 0.26, 5.7], [b4x - 12.8, b4H + 3.98, b4z], bank.terracotta);
  cylinder(staticG, 0.62, 0.65, 1.35, [b4x - 12.8, b4H + 4.78, b4z], bank.waterTank, 10);

  // 4 Stories of Repeating Curved Shallow-Arched Veranda Bays painted deep forest-green inside!
  for (let fl = 0; fl < 4; fl++) {
    const fy = 0.45 + fl * 3.12;
    box(staticG, [31.8, 0.24, 8.9], [b4x, fy + 2.98, b4z], bank.terracotta);
    for (let bx = -13.0; bx <= 13.0; bx += 3.25) {
      const bayX = b4x + bx;
      // Deep emerald-green shaded veranda bay
      box(staticG, [2.45, 2.08, 0.42], [bayX, fy + 1.68, b4z - 4.08], bank.emeraldDark);
      // Warm interior classroom window glow inside the bay
      box(dynamicG, [1.35, 1.18, 0.08], [bayX, fy + 1.65, b4z - 4.26], bank.warmWindowLit, { castShadow: false });
      // Curved shallow arch corners (spandrels) framing the top of each bay
      box(staticG, [0.46, 0.34, 0.22], [bayX - 1.02, fy + 2.60, b4z - 4.24], bank.academicCream);
      box(staticG, [0.46, 0.34, 0.22], [bayX + 1.02, fy + 2.60, b4z - 4.24], bank.academicCream);
      box(staticG, [0.28, 0.56, 0.22], [bayX - 1.15, fy + 2.40, b4z - 4.24], bank.academicCream);
      box(staticG, [0.28, 0.56, 0.22], [bayX + 1.15, fy + 2.40, b4z - 4.24], bank.academicCream);
      // Cream veranda parapet with dark green horizontal accent band
      box(staticG, [2.72, 0.78, 0.22], [bayX, fy + 0.48, b4z - 4.26], bank.academicCream);
      box(staticG, [2.74, 0.14, 0.24], [bayX, fy + 0.88, b4z - 4.26], bank.emeraldMat);
    }
    // Vertical columns between arched bays
    for (let cx = -14.62; cx <= 14.65; cx += 3.25) {
      box(staticG, [0.36, 3.12, 0.38], [b4x + cx, fy + 1.56, b4z - 4.24], bank.academicCream);
    }
  }
  // Entrance canopy on right side (West end facing courtyard)
  box(staticG, [7.2, 0.24, 1.9], [b4x - 10.5, 3.30, b4z - 4.95], bank.terracotta);
  addSignBox(
    dynamicG,
    bank,
    { title: 'খুলনা আলিয়া কামিল মাদ্রাসা · একাডেমিক ভবন ২', subtitle: 'দাখিল ও আলিম বিজ্ঞান ভবন · ৪-তলা একাডেমিক ভবন', bg: '#0f3d2e', fg: '#ffffff', accent: '#fde047' },
    [b4x + 2.5, 4.15, b4z - 4.46],
    Math.PI,
    6.4,
    1.10,
    true
  );

  // B) MODERN 6-STORY WHITE & TERRACOTTA ACADEMIC BUILDING (North Courtyard Side, z = 76)
  const b6x = 204.0;
  const b6z = 76.0;
  const b6H = 19.2;
  box(staticG, [32.4, 0.50, 10.4], [b6x, 0.25, b6z], bank.terracotta);
  box(staticG, [31.4, b6H, 9.4], [b6x, b6H * 0.5 + 0.45, b6z], bank.whitePlaster, { uvScale: 3.4 });
  box(staticG, [32.4, 0.72, 10.2], [b6x, b6H + 0.65, b6z], bank.terracotta);
  box(staticG, [5.2, 2.8, 4.6], [b6x, b6H + 2.1, b6z], bank.whitePlaster);
  cylinder(staticG, 0.65, 0.68, 1.4, [b6x + 8.5, b6H + 1.6, b6z], bank.waterTank, 10);

  for (let fl = 0; fl < 6; fl++) {
    const fy = 0.55 + fl * 3.1;
    box(staticG, [32.0, 0.26, 10.0], [b6x, fy + 2.95, b6z], bank.terracotta);
    box(staticG, [31.6, 0.92, 0.24], [b6x, fy + 0.55, b6z + 4.82], bank.whitePlaster);
    box(staticG, [31.6, 0.08, 0.26], [b6x, fy + 1.04, b6z + 4.82], bank.steelDark);
    for (let bx = -13.5; bx <= 13.5; bx += 3.0) {
      box(staticG, [2.25, 1.95, 0.36], [b6x + bx, fy + 1.88, b6z + 4.60], bank.cavityMat);
      if ((fl + Math.round(bx)) % 2 === 0) {
        box(dynamicG, [1.55, 1.32, 0.08], [b6x + bx, fy + 1.88, b6z + 4.74], bank.warmWindowLit, { castShadow: false });
      } else {
        box(staticG, [1.55, 1.32, 0.08], [b6x + bx, fy + 1.88, b6z + 4.74], bank.glassCurtain, { castShadow: false });
      }
    }
  }
  for (let cx = -15.0; cx <= 15.0; cx += 3.0) {
    box(staticG, [0.36, b6H + 0.4, 0.44], [b6x + cx, b6H * 0.5 + 0.45, b6z + 4.84], bank.terracotta);
  }
  addSignBox(
    dynamicG,
    bank,
    { title: 'খুলনা আলিয়া কামিল মাদ্রাসা', subtitle: 'নতুন ৬-তলা একাডেমিক ভবন · অনার্স ও কামিল বিভাগ', bg: '#065f46', fg: '#ffffff', accent: '#fde047', border: '#fde047' },
    [b6x, 7.6, b6z + 5.12],
    0,
    6.4,
    1.35,
    true
  );
}

/* ============================================================================
 * 4. WALKABLE 4-STORY KHULNA DISTRICT MODEL MOSQUE & ISLAMIC CULTURAL CENTER
 *    (cx = 171.0, cz = 160.0 — facing East toward Pond & Campus, Qibla West!)
 *    Exact real-world aerial-photo recreation:
 *      - Grand White Marble Front Staircase with Central Green Grass Planter
 *      - 4-Story White Marble + Turquoise Arched Windows + Blue Geometric Jaali
 *      - 1 Large Central White Dome + 3 Smaller White Domes + Golden Crescents
 *      - Tall 24m Ornate Square Geometric-Lattice Minaret on NE Corner
 *      - Walkable 2nd-Floor Prayer Hall (y = 3.2m) with Saf Carpet, Mihrab,
 *        Mimbar & Glowing Chandelier!
 * ========================================================================== */

function buildKhulnaModelMosque(staticG, dynamicG, bank) {
  const mx = 171.0;
  const mz = 160.0;
  const W = 20.0; // X-span: 161.0..181.0
  const D = 22.0; // Z-span: 149.0..171.0
  const yPodium = 3.20; // 2nd-Floor Main Prayer Hall level!
  const yRoof = 14.80;

  // Paved Mosque Courtyard Plaza connecting to Main Campus & Pond Side
  box(staticG, [34.0, 0.08, 30.0], [mx + 3.5, 0.04, mz], bank.marbleWhite, { castShadow: false, uvScale: 4.5 });

  // Ground Floor Podium Base (Parking, Imam Training & Ablution/Ojukhana Colonnade, y = 0..3.2m)
  box(staticG, [W + 1.2, yPodium, D + 1.2], [mx, yPodium * 0.5, mz], bank.marbleWhite, { uvScale: 3.0 });
  // East Podium Terrace Deck (x = 181.0..185.0, z = 149.0..171.0)
  box(staticG, [4.2, yPodium, D + 0.8], [mx + W * 0.5 + 2.1, yPodium * 0.5, mz], bank.marbleWhite);
  // Decorative Arched Ground-Floor Entrances on East Podium Flanks
  for (const dz of [-7.8, 7.8]) {
    box(staticG, [0.35, 2.35, 3.2], [mx + W * 0.5 + 4.15, 1.25, mz + dz], bank.mosqueTeal);
    box(staticG, [0.42, 0.20, 3.5], [mx + W * 0.5 + 4.18, 2.48, mz + dz], bank.marbleWhite);
  }

  // GRAND WIDE WHITE MARBLE FRONT STAIRCASE (x = 185.0..190.6, z = 154.0..166.0)
  // Climbs West from ground (x = 190.6, y = 0) up to Podium Deck (x = 185.0, y = 3.20m)
  const stairSteps = 14;
  for (let i = 0; i < stairSteps; i++) {
    const t = (i + 0.5) / stairSteps;
    const sx = THREE.MathUtils.lerp(190.6, 185.0, t);
    const sy = THREE.MathUtils.lerp(0.0, yPodium, (i + 1) / stairSteps);
    box(staticG, [0.46, sy, 12.0], [sx, sy * 0.5, mz], bank.marbleWhite);
  }
  // Iconic Central Green Grass Planter embedded right in the middle of the grand marble stairs (just like aerial photo!)
  box(staticG, [2.6, 0.45, 3.4], [187.8, yPodium * 0.52, mz], bank.marbleWhite);
  box(staticG, [2.2, 0.14, 3.0], [187.8, yPodium * 0.52 + 0.25, mz], bank.grassTurf);
  // Staircase Flanking Marble Balustrades
  for (const sz of [mz - 6.1, mz + 6.1]) {
    box(staticG, [5.8, yPodium + 0.4, 0.36], [187.8, (yPodium + 0.4) * 0.5, sz], bank.marbleWhite);
  }
  // Podium Terrace Balustrade (leaving staircase entry z = 154..166 open!)
  box(staticG, [0.28, 0.95, 5.2], [mx + W * 0.5 + 4.0, yPodium + 0.48, mz - 8.6], bank.marbleWhite);
  box(staticG, [0.28, 0.95, 5.2], [mx + W * 0.5 + 4.0, yPodium + 0.48, mz + 8.6], bank.marbleWhite);

  // ==========================================================================
  // WALKABLE 2ND-FLOOR MAIN PRAYER HALL (x = 161.5..180.5, z = 149.5..170.5, y = 3.2m)
  // ==========================================================================
  const hallH = 4.2;
  // Prayer Carpet Floor (emerald green & gold saf rows!)
  box(staticG, [W - 1.0, 0.04, D - 1.0], [mx, yPodium + 0.02, mz], bank.prayerCarpet, { castShadow: false });

  // Outer Perimeter Walls of Main Prayer Hall (West Qibla Wall, North & South Walls)
  box(staticG, [0.42, yRoof - yPodium, D], [mx - W * 0.5 + 0.21, (yPodium + yRoof) * 0.5, mz], bank.marbleWhite);
  box(staticG, [W, yRoof - yPodium, 0.42], [mx, (yPodium + yRoof) * 0.5, mz - D * 0.5 + 0.21], bank.marbleWhite);
  box(staticG, [W, yRoof - yPodium, 0.42], [mx, (yPodium + yRoof) * 0.5, mz + D * 0.5 - 0.21], bank.marbleWhite);

  // East Main Facade Wall with WIDE OPEN 4.4m Central Prayer Hall Entrance (z = 157.8..162.2)!
  box(staticG, [0.44, hallH, 8.6], [mx + W * 0.5 - 0.22, yPodium + hallH * 0.5, mz - 6.6], bank.marbleWhite);
  box(staticG, [0.44, hallH, 8.6], [mx + W * 0.5 - 0.22, yPodium + hallH * 0.5, mz + 6.6], bank.marbleWhite);
  // Upper East Facade (Floors 3 & 4 above Prayer Hall entrance)
  box(staticG, [0.46, yRoof - (yPodium + hallH), D], [mx + W * 0.5 - 0.23, (yPodium + hallH + yRoof) * 0.5, mz], bank.marbleWhite);
  // Prayer Hall Ceiling Slab & Roof Slab
  box(staticG, [W, 0.34, D], [mx, yPodium + hallH + 0.17, mz], bank.marbleWhite);
  box(staticG, [W + 0.8, 0.45, D + 0.8], [mx, yRoof + 0.22, mz], bank.marbleWhite);
  // Decorative Roof Parapet
  box(staticG, [W + 0.5, 1.05, 0.26], [mx, yRoof + 0.95, mz - D * 0.5], bank.marbleWhite);
  box(staticG, [W + 0.5, 1.05, 0.26], [mx, yRoof + 0.95, mz + D * 0.5], bank.marbleWhite);
  box(staticG, [0.26, 1.05, D + 0.5], [mx - W * 0.5, yRoof + 0.95, mz], bank.marbleWhite);
  box(staticG, [0.26, 1.05, D + 0.5], [mx + W * 0.5, yRoof + 0.95, mz], bank.marbleWhite);

  // ICONIC EAST FACADE: TURQUOISE ARCHED WINDOWS + BLUE GEOMETRIC JAALI PANELS (Matches Aerial Photo!)
  const fX = mx + W * 0.5 + 0.08;
  // Tall Vertical Turquoise Jaali Mosaic Side Columns (North & South edges of East facade)
  for (const dz of [-8.8, 8.8]) {
    box(staticG, [0.16, 10.6, 2.2], [fX, yPodium + 5.6, mz + dz], bank.mosqueJaali);
    box(staticG, [0.20, 10.8, 0.18], [fX + 0.02, yPodium + 5.6, mz + dz - 1.15], bank.marbleWhite);
    box(staticG, [0.20, 10.8, 0.18], [fX + 0.02, yPodium + 5.6, mz + dz + 1.15], bank.marbleWhite);
  }
  // Geometric Jaali Backdrop Panel across the center facade
  box(staticG, [0.10, 10.4, 15.0], [fX - 0.04, yPodium + 5.6, mz], bank.mosqueJaali);

  // 3 Tiers of Turquoise Pointed-Arch Windows across East Facade
  for (let tier = 0; tier < 3; tier++) {
    const ty = yPodium + 1.9 + tier * 3.45;
    for (const [wz, ww, wh] of [[-5.0, 2.2, 2.3], [0, 3.6, 2.65], [5.0, 2.2, 2.3]]) {
      if (tier === 0 && wz === 0) continue; // Keep ground/podium central entrance open to walk inside!
      box(staticG, [0.18, wh, ww], [fX + 0.05, ty, mz + wz], bank.mosqueTurquoise);
      box(dynamicG, [0.08, wh - 0.35, ww - 0.35], [fX + 0.14, ty, mz + wz], bank.mosqueGlow, { castShadow: false });
      // White pointed-arch cap framing each turquoise window
      box(staticG, [0.22, 0.24, ww + 0.24], [fX + 0.06, ty + wh * 0.5 + 0.10, mz + wz], bank.marbleWhite);
    }
  }

  // Interior Prayer Hall Columns + Ornate West Qibla Mihrab + Carved Wooden Mimbar + Golden Chandelier!
  for (const [cx, cz] of [[mx - 4.5, mz - 5.5], [mx - 4.5, mz + 5.5], [mx + 3.5, mz - 5.5], [mx + 3.5, mz + 5.5]]) {
    cylinder(staticG, 0.34, 0.38, hallH, [cx, yPodium + hallH * 0.5, cz], bank.marbleWhite, 12);
    cylinder(staticG, 0.42, 0.42, 0.16, [cx, yPodium + 0.12, cz], bank.goldMat, 12);
    cylinder(staticG, 0.42, 0.42, 0.16, [cx, yPodium + hallH - 0.12, cz], bank.goldMat, 12);
  }
  // West Qibla Wall Mihrab Niche
  box(staticG, [0.65, 3.6, 3.4], [mx - W * 0.5 + 0.65, yPodium + 1.8, mz], bank.mosqueTeal);
  box(staticG, [0.72, 3.8, 0.24], [mx - W * 0.5 + 0.68, yPodium + 1.9, mz - 1.75], bank.goldMat);
  box(staticG, [0.72, 3.8, 0.24], [mx - W * 0.5 + 0.68, yPodium + 1.9, mz + 1.75], bank.goldMat);
  box(staticG, [0.72, 0.24, 3.74], [mx - W * 0.5 + 0.68, yPodium + 3.72, mz], bank.goldMat);
  // Carved Teak Mimbar (steps + pulpit beside Mihrab)
  box(staticG, [1.6, 1.35, 1.15], [mx - W * 0.5 + 1.4, yPodium + 0.68, mz - 3.2], bank.teakWood);
  box(staticG, [0.85, 0.65, 1.15], [mx - W * 0.5 + 2.4, yPodium + 0.33, mz - 3.2], bank.teakWood);

  // Glowing Golden Central Chandelier inside Prayer Hall
  cylinder(staticG, 0.04, 0.04, 1.15, [mx, yPodium + hallH - 0.58, mz], bank.goldMat, 8);
  cylinder(staticG, 1.15, 1.15, 0.10, [mx, yPodium + hallH - 1.18, mz], bank.goldMat, 16);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), bank.bulbGlow);
    bulb.position.set(mx + Math.cos(a) * 1.05, yPodium + hallH - 1.30, mz + Math.sin(a) * 1.05);
    dynamicG.add(bulb);
  }

  // ==========================================================================
  // 1 LARGE CENTRAL WHITE DOME + 3 SMALLER WHITE DOMES + GOLDEN FINIALS
  // ==========================================================================
  const addMosqueDome = (dx, dz, radius, drumH) => {
    cylinder(staticG, radius * 1.02, radius * 1.05, drumH, [dx, yRoof + 0.45 + drumH * 0.5, dz], bank.marbleWhite, 24);
    cylinder(staticG, radius * 1.06, radius * 1.06, 0.16, [dx, yRoof + 0.45 + drumH, dz], bank.mosqueTurquoise, 24);
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
      bank.marbleDome
    );
    dome.position.set(dx, yRoof + 0.45 + drumH, dz);
    staticG.add(dome);
    // Golden spire & crescent finial
    const topY = yRoof + 0.45 + drumH + radius;
    cylinder(staticG, 0.05, 0.08, 1.65, [dx, topY + 0.82, dz], bank.goldMat, 8);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), bank.goldMat);
    orb.position.set(dx, topY + 0.55, dz);
    staticG.add(orb);
  };
  // 1 Large Central Dome + 3 Smaller White Domes (matching real aerial photo!)
  addMosqueDome(mx - 0.5, mz, 5.2, 1.45);
  addMosqueDome(mx + 6.5, mz - 7.0, 2.35, 0.85);
  addMosqueDome(mx + 6.5, mz + 7.0, 2.35, 0.85);
  addMosqueDome(mx + 6.5, mz, 2.10, 0.78);

  // ==========================================================================
  // TALL 24m SQUARE ORNATE GEOMETRIC-LATTICE MINARET ON NORTH-EAST CORNER!
  // ==========================================================================
  const minX = mx + W * 0.5 + 1.8;
  const minZ = mz - D * 0.5 + 1.6;
  const minH = 23.5;
  box(staticG, [3.4, minH, 3.4], [minX, minH * 0.5, minZ], bank.minaretJaali, { uvScale: 2.2 });
  // Corner white marble ribs on the tall square minaret
  for (const sx of [-1.62, 1.62]) {
    for (const sz of [-1.62, 1.62]) {
      box(staticG, [0.34, minH + 0.4, 0.34], [minX + sx, minH * 0.5, minZ + sz], bank.marbleWhite);
    }
  }
  // Upper Minaret Balcony Gallery + Crown + Dome Cap + Golden Finial
  box(staticG, [4.2, 0.55, 4.2], [minX, minH - 3.6, minZ], bank.marbleWhite);
  box(staticG, [4.0, 0.95, 4.0], [minX, minH + 0.45, minZ], bank.marbleWhite);
  const minDome = new THREE.Mesh(
    new THREE.SphereGeometry(1.55, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    bank.marbleDome
  );
  minDome.position.set(minX, minH + 0.90, minZ);
  staticG.add(minDome);
  cylinder(staticG, 0.05, 0.08, 1.8, [minX, minH + 3.25, minZ], bank.goldMat, 8);

  // Illuminated Model Mosque Signboard over Entrance
  addSignBox(
    dynamicG,
    bank,
    {
      title: 'খুলনা জেলা মডেল মসজিদ ও ইসলামিক সাংস্কৃতিক কেন্দ্র',
      subtitle: 'KHULNA DISTRICT MODEL MOSQUE · আলিয়া মাদ্রাসা প্রাঙ্গণ, খুলনা',
      bg: '#0e4f5c',
      fg: '#ffffff',
      accent: '#fde047',
      border: '#38bdf8',
      width: 680,
    },
    [mx + W * 0.5 + 0.42, yPodium + hallH + 0.45, mz],
    Math.PI * 0.5,
    8.2,
    1.22,
    true
  );

  // Mosque Courtyard Lamps
  for (const [lx, lz] of [[191.8, 152.0], [191.8, 168.0], [184.5, 146.5], [184.5, 173.5]]) {
    addCampusLamp(staticG, dynamicG, bank, lx, lz, 4.4, 0.06);
  }
}

/* ============================================================================
 * 5. GRAND EAST MAIN GATE (INTERACTIVE [E]), BOUNDARY WALLS & POND GHAT
 * ========================================================================== */

function buildMainGateAndPondGhat(staticG, dynamicG, bank) {
  // Grand Campus Main Gate at East End of Driveway (x = 225.5, z = 108.0)
  const gx = 225.5;
  const gz = 108.0;
  for (const dz of [-3.6, 3.6]) {
    box(staticG, [1.15, 5.2, 1.15], [gx, 2.6, gz + dz], bank.colonialCream);
    box(staticG, [1.32, 0.34, 1.32], [gx, 5.25, gz + dz], bank.terracotta);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), bank.bulbGlow);
    lamp.position.set(gx, 5.64, gz + dz);
    dynamicG.add(lamp);
  }
  // Overhead Ornamental Gate Arch Beam + Signboard
  box(staticG, [0.95, 1.45, 8.6], [gx, 5.35, gz], bank.emeraldDark);
  box(staticG, [1.08, 0.22, 8.9], [gx, 6.18, gz], bank.goldMat);
  addSignBox(
    dynamicG,
    bank,
    {
      title: 'খুলনা আলিয়া কামিল মাদ্রাসা (অনার্স)',
      subtitle: '৮৮ খানজাহান আলী রোড, খুলনা · স্থাপিত: ২ এপ্রিল ১৯৫২ · ইআইআইএন: ১১৭১৬২',
      bg: '#064e3b',
      fg: '#ffffff',
      accent: '#fde047',
      border: '#fde047',
      width: 720,
      height: 176,
    },
    [gx + 0.56, 5.38, gz],
    Math.PI * 0.5,
    7.8,
    1.28,
    true
  );

  // Interactive Double Iron Gate Leaves ([E] to Open / Close!)
  const leftLeaf = new THREE.Group();
  leftLeaf.position.set(gx, 0, gz - 3.05);
  const rightLeaf = new THREE.Group();
  rightLeaf.position.set(gx, 0, gz + 3.05);
  const buildGateLeaf = (leaf, sign) => {
    box(leaf, [0.09, 2.45, 2.95], [0, 1.32, sign * 1.48], bank.emeraldDark);
    for (let i = 0; i < 7; i++) {
      box(leaf, [0.12, 2.68, 0.05], [0, 1.42, sign * (0.22 + i * 0.42)], bank.goldMat);
    }
    box(leaf, [0.12, 0.72, 2.88], [0, 0.45, sign * 1.48], bank.emeraldMat);
  };
  buildGateLeaf(leftLeaf, 1);
  buildGateLeaf(rightLeaf, -1);
  dynamicG.add(leftLeaf, rightLeaf);

  // East Campus Boundary Wall flanking the Main Gate (z = 80..104.2 & z = 111.8..136)
  for (const [z0, z1] of [[80.0, 104.2], [111.8, 136.0]]) {
    const len = z1 - z0;
    const midZ = (z0 + z1) * 0.5;
    box(staticG, [0.36, 1.55, len], [gx, 0.775, midZ], bank.colonialCream);
    box(staticG, [0.46, 0.16, len + 0.1], [gx, 1.62, midZ], bank.terracotta);
    box(staticG, [0.08, 0.08, len], [gx, 2.22, midZ], bank.steelDark);
    const posts = Math.max(3, Math.floor(len / 4.8));
    for (let i = 0; i <= posts; i++) {
      const pz = z0 + (i / posts) * len;
      box(staticG, [0.54, 2.38, 0.54], [gx, 1.19, pz], bank.colonialCream);
      box(staticG, [0.62, 0.16, 0.62], [gx, 2.42, pz], bank.terracotta);
    }
  }

  // CENTRAL POND BRICK GHAT (পুকুরঘাট) on North Bank of Khulna Alia Central Pond (x = 204..216, z = 144.5..149.5)
  box(staticG, [12.5, 0.24, 3.2], [210.0, 0.12, 144.8], bank.brick, { uvScale: 2.5 });
  for (let s = 0; s < 4; s++) {
    box(staticG, [10.8, 0.20, 0.55], [210.0, 0.10 - s * 0.14, 146.6 + s * 0.55], bank.stonePlinth);
  }
  addRailingSpan(staticG, bank, 203.8, 143.4, 203.8, 146.2, 3, 0.90, 0.22);
  addRailingSpan(staticG, bank, 216.2, 143.4, 216.2, 146.2, 3, 0.90, 0.22);
  addCampusLamp(staticG, dynamicG, bank, 203.8, 144.2, 3.8, 0.20);
  addCampusLamp(staticG, dynamicG, bank, 216.2, 144.2, 3.8, 0.20);

  return { leftLeaf, rightLeaf };
}

/* ============================================================================
 * 6. MAIN EXPORTED CAMPUS BUILDER (WITH PHYSICS, WALKABLE FLOORS & 60 FPS)
 * ========================================================================== */

function resolveCircleAABB(pos, radius, minX, maxX, minZ, maxZ) {
  const cx = THREE.MathUtils.clamp(pos.x, minX, maxX);
  const cz = THREE.MathUtils.clamp(pos.z, minZ, maxZ);
  const dx = pos.x - cx;
  const dz = pos.z - cz;
  const dSq = dx * dx + dz * dz;
  if (dSq < radius * radius) {
    if (dSq > 1e-8) {
      const d = Math.sqrt(dSq);
      const push = radius - d;
      pos.x += (dx / d) * push;
      pos.z += (dz / d) * push;
    } else {
      const l = Math.abs(pos.x - minX);
      const r = Math.abs(maxX - pos.x);
      const b = Math.abs(pos.z - minZ);
      const f = Math.abs(pos.z - maxZ);
      const m = Math.min(l, r, b, f);
      if (m === l) pos.x = minX - radius;
      else if (m === r) pos.x = maxX + radius;
      else if (m === b) pos.z = minZ - radius;
      else pos.z = maxZ + radius;
    }
  }
}

export function buildAliaMadrasahDistrict(parent, m) {
  const root = new THREE.Group();
  root.name = 'KhulnaLandmark_Alia';
  const staticG = new THREE.Group();
  const dynamicG = new THREE.Group();
  root.add(staticG, dynamicG);
  parent.add(root);

  const bank = createAliaMaterialBank(m);

  // 1) Concrete Entrance Driveway + Red-Green Fencing + Soil Beds
  box(staticG, [36.5, 0.07, 5.8], [208.5, 0.025, 108.0], bank.stonePlinth, { castShadow: false, uvScale: 2.8 });
  box(staticG, [34.0, 0.22, 0.36], [208.5, 0.11, 105.0], bank.darkConcrete);
  box(staticG, [34.0, 0.22, 0.36], [208.5, 0.11, 111.0], bank.darkConcrete);
  addRedGreenFenceSpan(staticG, bank, 195.0, 105.0, 222.0, 105.0, 14);
  addRedGreenFenceSpan(staticG, bank, 195.0, 111.0, 222.0, 111.0, 14);

  // Natural soil beds under the 4,050 3D Grass Clumps
  box(staticG, [32.0, 0.04, 22.8], [208.0, 0.012, 93.2], bank.soilBed, { castShadow: false });
  box(staticG, [32.0, 0.04, 22.8], [208.0, 0.012, 122.8], bank.soilBed, { castShadow: false });

  // GPU-Instanced 4,050 Real 3D Grass Clumps (just 3 draw calls!)
  const grassLoader = new GLTFLoader();
  grassLoader.load('./assets/alia_grass_clumps.glb', (gltf) => {
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
        color: srcMat?.color ? srcMat.color.clone() : new THREE.Color(0x3f7d24),
        roughness: 0.92,
        metalness: 0.0,
        side: THREE.DoubleSide,
      });
      clumpTemplates.push({ geom, mat });
    });
    if (!clumpTemplates.length) return;

    const rand = seeded(195201);
    const fieldRects = [
      { x0: 192.4, x1: 223.6, z0: 82.0, z1: 104.4 },
      { x0: 192.4, x1: 223.6, z0: 111.6, z1: 134.0 },
    ];
    const perClumpCount = 1350;
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();

    for (let ci = 0; ci < clumpTemplates.length; ci++) {
      const { geom, mat } = clumpTemplates[ci];
      const inst = new THREE.InstancedMesh(geom, mat, perClumpCount);
      inst.castShadow = false;
      inst.receiveShadow = true;
      for (let i = 0; i < perClumpCount; i++) {
        const rect = fieldRects[i % 2];
        const gx = rect.x0 + rand() * (rect.x1 - rect.x0);
        const gz = rect.z0 + rand() * (rect.z1 - rect.z0);
        if (gx > 200.2 && gx < 204.2 && gz > 102.0 && gz < 104.5) {
          dummy.position.set(gx + 6.5, 0.025, gz - 4.0);
        } else {
          dummy.position.set(gx, 0.025, gz);
        }
        dummy.rotation.set((rand() - 0.5) * 0.14, rand() * Math.PI * 2, (rand() - 0.5) * 0.14);
        const sx = 0.13 + rand() * 0.085;
        const sy = 0.055 + rand() * 0.048;
        const sz = 0.13 + rand() * 0.085;
        dummy.scale.set(sx, sy, sz);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
        col.setHSL(0.26 + (rand() - 0.5) * 0.05, 0.54 + rand() * 0.18, 0.30 + rand() * 0.15);
        inst.setColorAt(i, col);
      }
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      dynamicG.add(inst);
    }
  }, undefined, (err) => {
    console.warn('Alia Madrasah grass_field GLB load warning:', err);
  });

  // Tall Coconut Palms flanking the main building & courtyard (real photo!)
  addCoconutPalm(staticG, bank, 196.5, 101.2, 11.4, 0.8, -0.5);
  addCoconutPalm(staticG, bank, 204.5, 101.0, 10.6, 0.5, 0.4);
  addCoconutPalm(staticG, bank, 196.0, 115.0, 11.8, 0.7, 0.6);
  addCoconutPalm(staticG, bank, 205.5, 116.0, 9.8, -0.4, 0.5);
  addCoconutPalm(staticG, bank, 189.0, 144.0, 11.2, -0.5, -0.4);

  // Concrete Utility Pole with Overhead Wires on right side of portico (just like the real photo!)
  cylinder(staticG, 0.11, 0.16, 9.6, [196.2, 4.8, 104.2], bank.stonePlinth, 10);
  box(staticG, [0.16, 0.14, 1.8], [196.2, 8.9, 104.2], bank.steelDark);
  rodBetween(staticG, [196.2, 8.85, 104.2], [224.5, 8.35, 104.2], 0.016, bank.wire, 6);
  rodBetween(staticG, [196.2, 8.55, 104.2], [224.5, 8.05, 104.2], 0.016, bank.wire, 6);

  // 2) Main Walkable Portico Building (Real-Photo Brick-Tiled Portico + Furnished Offices & Classrooms)
  buildMainPorticoBuilding(staticG, dynamicG, bank);

  // 3) 4-Story Arched Academic Building (South) & 6-Story Modern Academic Building (North)
  buildAcademicBuildings(staticG, dynamicG, bank);

  // 4) Walkable 4-Story Khulna District Model Mosque & Islamic Cultural Center
  buildKhulnaModelMosque(staticG, dynamicG, bank);

  // 5) Grand Interactive East Main Gate, Boundary Wall & Central Pond Brick Ghat
  const mainGate = buildMainGateAndPondGhat(staticG, dynamicG, bank);
  let gateTarget = 1; // Starts open so players/cars can drive straight in; press [E] to close/open!
  let gateRatio = 1;
  mainGate.leftLeaf.rotation.y = gateRatio * (Math.PI * 0.46);
  mainGate.rightLeaf.rotation.y = -gateRatio * (Math.PI * 0.46);

  // 6) Stone Foundation Plaque + Red Ixora (রঙ্গন) Flower Bushes + Benches + Lamps
  box(staticG, [2.4, 1.05, 1.2], [202.0, 0.52, 103.0], bank.stonePlinth);
  addSignBox(
    dynamicG,
    bank,
    { title: 'খুলনা আলিয়া কামিল মাদ্রাসা', subtitle: 'স্থাপিত: ২ এপ্রিল ১৯৫২ · খুলনা', bg: '#e5e7eb', fg: '#111827', accent: '#b94a38', border: '#475569' },
    [202.0, 1.08, 103.66],
    0,
    2.1,
    0.72,
    false
  );
  for (const [fx, fz] of [[200.5, 103.2], [203.5, 103.2], [198.0, 104.0], [208.0, 104.0], [198.0, 112.0], [208.0, 112.0]]) {
    box(staticG, [0.9, 0.55, 0.9], [fx, 0.28, fz], bank.moss);
    box(staticG, [0.55, 0.35, 0.55], [fx, 0.62, fz], bank.flowerRed);
  }
  for (const [bx, bz, ry] of [
    [203.0, 103.5, 0],
    [214.0, 103.5, 0],
    [203.0, 112.5, Math.PI],
    [214.0, 112.5, Math.PI],
  ]) {
    addParkBench(staticG, bank, bx, bz, ry);
  }
  for (const [lx, lz] of [
    [196.0, 104.4],
    [212.0, 104.4],
    [196.0, 111.6],
    [212.0, 111.6],
  ]) {
    addCampusLamp(staticG, dynamicG, bank, lx, lz, 4.0, 0.02);
  }

  // Merge all static meshes by material for locked 60+ FPS!
  mergeStaticMeshes(staticG);

  const maxDistSq = 285 * 285;

  function getGroundHeight(pos) {
    if (!pos) return 0.0;
    const dx = pos.x - ALIA_CAMPUS_CENTER.x;
    const dz = pos.z - ALIA_CAMPUS_CENTER.z;
    if (dx * dx + dz * dz > 120 * 120) return 0.0;

    // 1) Khulna District Model Mosque Grand Marble Staircase & 2nd-Floor Prayer Hall (x = 161..191, z = 149..171)
    if (pos.x >= 161.0 && pos.x <= 191.0 && pos.z >= 149.0 && pos.z <= 171.0) {
      // Grand East Front Staircase (x = 185.0..190.8, z = 154.0..166.0)
      if (pos.x >= 184.8 && pos.x <= 190.8 && pos.z >= 153.8 && pos.z <= 166.2) {
        const t = THREE.MathUtils.clamp((190.6 - pos.x) / 5.6, 0, 1);
        return t * 3.20;
      }
      // Podium Deck & Main Prayer Hall Floor (y = 3.20m)
      if (pos.x >= 161.2 && pos.x <= 185.2 && pos.z >= 149.2 && pos.z <= 170.8) {
        return 3.20;
      }
    }
    return 0.0;
  }

  function applyCollisions(pos, radius = 0.34, footY = 0) {
    if (!pos) return;
    const dx = pos.x - ALIA_CAMPUS_CENTER.x;
    const dz = pos.z - ALIA_CAMPUS_CENTER.z;
    if (dx * dx + dz * dz > 120 * 120) return;

    // 1) 6-Story North Academic Building (x = 188..220, z = 71..81)
    if (footY < 20.0) {
      resolveCircleAABB(pos, radius, 187.8, 220.2, 70.8, 81.2);
    }
    // 2) 4-Story South Arched Academic Building (x = 188..220, z = 133.4..142.8)
    if (footY < 14.0) {
      resolveCircleAABB(pos, radius, 187.8, 220.2, 133.4, 142.8);
    }
    // 3) East Campus Boundary Wall & Closed Main Gate (x = 225.5)
    if (footY < 2.6) {
      resolveCircleAABB(pos, radius, 225.1, 225.9, 80.0, 104.2);
      resolveCircleAABB(pos, radius, 225.1, 225.9, 111.8, 136.0);
      if (gateRatio < 0.55) {
        resolveCircleAABB(pos, radius, 225.2, 225.8, 104.5, 111.5);
      }
    }
    // Main Gate Pillars
    if (footY < 5.5) {
      resolveCircleAABB(pos, radius, 224.8, 226.2, 103.8, 105.0);
      resolveCircleAABB(pos, radius, 224.8, 226.2, 111.0, 112.2);
    }

    // 4) Khulna District Model Mosque Collisions (x = 160.5..191.5, z = 148.5..171.5)
    if (pos.x >= 159.5 && pos.x <= 192.0 && pos.z >= 147.5 && pos.z <= 172.5) {
      // Minaret base on NE corner (minX = 182.8, minZ = 150.6)
      resolveCircleAABB(pos, radius, 181.0, 184.6, 148.8, 152.4);
      // Central staircase grass planter obstacle
      if (footY < 2.6) {
        resolveCircleAABB(pos, radius, 186.4, 189.2, 158.2, 161.8);
      }
      if (footY < 2.5) {
        // Ground-floor podium walls (except the open East staircase mouth x = 185..191, z = 154..166)
        resolveCircleAABB(pos, radius, 160.5, 185.2, 148.5, 153.8);
        resolveCircleAABB(pos, radius, 160.5, 185.2, 166.2, 171.5);
        resolveCircleAABB(pos, radius, 160.5, 184.8, 153.8, 166.2);
      } else if (footY < 8.0) {
        // 2nd-Floor Prayer Hall Perimeter Walls (West Qibla, North, South, and East with wide 4.4m open entrance z = 157.8..162.2!)
        resolveCircleAABB(pos, radius, 160.8, 161.5, 149.0, 171.0);
        resolveCircleAABB(pos, radius, 161.0, 181.0, 148.8, 149.5);
        resolveCircleAABB(pos, radius, 161.0, 181.0, 170.5, 171.2);
        resolveCircleAABB(pos, radius, 180.5, 181.2, 149.0, 157.8);
        resolveCircleAABB(pos, radius, 180.5, 181.2, 162.2, 171.0);
        // Podium terrace side balustrades
        resolveCircleAABB(pos, radius, 184.8, 185.3, 149.0, 154.0);
        resolveCircleAABB(pos, radius, 184.8, 185.3, 166.0, 171.0);
      }
    }
  }

  function getNearbyPrompt(pos) {
    if (!pos || pos.y > 3.2) return null;
    if (Math.hypot(pos.x - 225.5, pos.z - 108.0) < 5.2) {
      return gateTarget > 0.5 ? '[E] আলিয়া মাদ্রাসা গেট বন্ধ করো' : '[E] আলিয়া মাদ্রাসা গেট খোলো';
    }
    return null;
  }

  function toggleGate(pos) {
    if (!pos || pos.y > 3.2) return false;
    if (Math.hypot(pos.x - 225.5, pos.z - 108.0) < 5.8) {
      gateTarget = gateTarget > 0.5 ? 0 : 1;
      return true;
    }
    return false;
  }

  return {
    root,
    getGroundHeight,
    applyCollisions,
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
      const dx = playerPos.x - ALIA_CAMPUS_CENTER.x;
      const dz = playerPos.z - ALIA_CAMPUS_CENTER.z;
      const want = dx * dx + dz * dz <= maxDistSq;
      if (root.visible !== want) root.visible = want;
    },
    update(time, playerPos = null, dt = 0.016) {
      if (playerPos) this.syncVisibility(playerPos);
      if (!root.visible) return;
      if (Math.abs(gateRatio - gateTarget) > 0.002) {
        gateRatio += (gateTarget - gateRatio) * Math.min(1, dt * 4.5);
        mainGate.leftLeaf.rotation.y = gateRatio * (Math.PI * 0.46);
        mainGate.rightLeaf.rotation.y = -gateRatio * (Math.PI * 0.46);
      }
    },
  };
}
