import * as THREE from 'three';
import { createConfiguredGLTFLoader } from './gltf-loader.js';
import { box, cylinder, rodBetween, mergeStaticMeshes } from './scene-utils.js';
import { attachDerivedPBRMaps } from './aaa-shaders.js';
import {
  buildKhulnaModelMosque3D,
  getModelMosqueGroundHeight,
  applyModelMosqueCollisions,
  getModelMosquePrompt,
  toggleModelMosqueDoor,
  updateModelMosque,
  setModelMosqueNightFactor,
  getModelMosqueZoneName,
  isInsideModelMosque,
  isInModelMosqueZone,
  findNearestModelMosqueSeat,
} from './khulna-model-mosque.js';
import { buildAliaCampusBlockoutAndRoads } from './alia-campus-blockout.js';

/**
 * KHULNA ALIA KAMIL MADRASAH & KHULNA DISTRICT MODEL MOSQUE CAMPUS
 * (খুলনা আলিয়া কামিল মাদ্রাসা · ৮৮ খানজাহান আলী রোড · স্থাপিত: ২ এপ্রিল ১৯৫২)
 *
 * GTA-Level Photorealistic Full-Scale Recreation based on real campus photographs:
 *  1) Grand 64m Walkable 3-Story Main Administrative & Classroom Building (x = 177..190, z = 76..140)
 *     - Real-photo semicircular brick-tiled central portico with twin pairs of speckled grey
 *       granite columns + chrome collars, true curved pointed arch, curved embossed Bengali/Arabic/English
 *       fascia lettering, curved black iron railings & corrugated tin-shed 3rd-floor wing
 *     - 16 true curved colonnade arches along the 64m ground veranda + vertical slotted balustrades
 *     - Recessed multi-pane grilled windows with concrete sunshades (chhajjas)
 *     - All 3 floors walkable via grand S-shaped marble switchback staircase:
 *       * Ground Floor: 6 Furnished Offices (Principal, Vice Principal, Teachers' Common Room,
 *         Registrar, Accounts, Library)
 *       * 2nd Floor: 6 Ultra-High-Detail Classrooms (১০১–১০৩, ২০১–২০৩) with tubular-steel &
 *         varnished-wood Bangladeshi bench-desk sets, chalkboards, podiums, fans & grilled windows
 *       * 3rd Floor: Walkable Corrugated Tin-Shed Wing (Exam Hall & Computer Lab) + Terrace Veranda
 *  2) Real-Photo 4-Story Cream & Deep-Green Arched Academic Building (South, z = 148) with true curved arches
 *  3) Modern 6-Story White & Terracotta Academic Building (North, z = 64)
 *  4) Walkable 4-Story Khulna District Model Mosque & Islamic Cultural Center (cx = 171, cz = 166)
 *  5) Grand East Main Gate (x = 232, interactive [E]), Red-Green Fence, Pond Ghat & 5,400 3D Grass Clumps
 *
 * Performance: mergeStaticMeshes() + GPU Instancing + 300m distance culling (locked 60–120 FPS).
 */

export const ALIA_CAMPUS_CENTER = { x: 198.0, z: 118.0 };

function seeded(seed = 1952) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ============================================================================
 * HIGH-RESOLUTION PROCEDURAL PBR TEXTURES (ZERO CARTOON LOOK)
 * ========================================================================== */

function makePorticoBrickTileTexture(seedVal = 1952) {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  // Fine cement grout lines
  ctx.fillStyle = '#c8afa0';
  ctx.fillRect(0, 0, S, S);

  const rows = 24;
  const cols = 12;
  const bh = S / rows;
  const bw = S / cols;

  for (let r = 0; r < rows; r++) {
    const xOff = (r % 2) * (bw * 0.5);
    for (let col = -1; col <= cols; col++) {
      const bx = col * bw + xOff;
      const by = r * bh;
      // Authentic pinkish-peach terracotta ceramic cladding tiles from real photo
      const R = 208 + Math.floor(rnd() * 26 - 13);
      const G = 160 + Math.floor(rnd() * 22 - 11);
      const B = 144 + Math.floor(rnd() * 20 - 10);
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fillRect(bx + 2.5, by + 2.5, bw - 5, bh - 5);

      // Subtle ceramic bevel highlight & bottom shadow
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(bx + 3, by + 3, bw - 6, 4);
      ctx.fillStyle = 'rgba(65,30,20,0.12)';
      ctx.fillRect(bx + 3, by + bh - 6, bw - 6, 3);

      // Micro stone/clay grain inside each tile
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(60,30,20,0.06)';
        ctx.fillRect(bx + 6 + rnd() * (bw - 14), by + 6 + rnd() * (bh - 14), 3, 2);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeGraniteTexture(seedVal = 1966) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = '#6f757e';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 8500; i++) {
    const v = 40 + Math.floor(rnd() * 175);
    ctx.fillStyle = `rgba(${v},${v + 2},${v + 6},${0.25 + rnd() * 0.50})`;
    ctx.fillRect(rnd() * S, rnd() * S, 1.5 + rnd() * 3.0, 1.5 + rnd() * 3.0);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeWoodGrainTexture(baseHex = '#7c431f', grainHex = '#4a250e', seedVal = 1953) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 2) {
    ctx.fillStyle = rnd() > 0.45 ? 'rgba(255,220,170,0.06)' : 'rgba(35,15,5,0.12)';
    ctx.fillRect(0, y, S, 1 + rnd() * 2);
  }
  ctx.strokeStyle = grainHex;
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 42; i++) {
    const y0 = rnd() * S;
    ctx.lineWidth = 1 + rnd() * 2.2;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.bezierCurveTo(S * 0.33, y0 + (rnd() - 0.5) * 18, S * 0.66, y0 + (rnd() - 0.5) * 18, S, y0 + (rnd() - 0.5) * 10);
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeCorrugatedTinTexture(seedVal = 1984) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = '#36414d';
  ctx.fillRect(0, 0, S, S);
  const ribs = 32;
  const rw = S / ribs;
  for (let i = 0; i < ribs; i++) {
    const x = i * rw;
    const g = ctx.createLinearGradient(x, 0, x + rw, 0);
    g.addColorStop(0.0, '#1e262e');
    g.addColorStop(0.35, '#4c5966');
    g.addColorStop(0.65, '#647280');
    g.addColorStop(1.0, '#1e262e');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, rw, S);
  }
  // Subtle weathering & rust specks
  for (let i = 0; i < 650; i++) {
    ctx.fillStyle = rnd() > 0.7 ? 'rgba(130,72,42,0.14)' : 'rgba(255,255,255,0.04)';
    ctx.fillRect(rnd() * S, rnd() * S, 2 + rnd() * 5, 2 + rnd() * 14);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeWeatheredPlasterTexture(baseHex, seedVal = 1955, streakAlpha = 0.12) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 5200; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(38,28,20,0.05)';
    ctx.fillRect(rnd() * S, rnd() * S, 2 + rnd() * 4, 2 + rnd() * 4);
  }
  // Monsoon rainwater weathering streaks along top & bottom edges
  for (let i = 0; i < 42; i++) {
    const x = rnd() * S;
    const h = 45 + rnd() * 150;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgba(36,42,34,${streakAlpha})`);
    g.addColorStop(1, 'rgba(36,42,34,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 3 + rnd() * 8, h);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function makeMosaicFloorTexture(baseHex = '#eae4d8', groutHex = '#b2aa9a', seedVal = 1971) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, S, S);
  const chipCols = ['rgba(120,112,98,0.22)', 'rgba(90,85,78,0.18)', 'rgba(255,255,255,0.28)', 'rgba(158,136,112,0.16)'];
  for (let i = 0; i < 2400; i++) {
    ctx.fillStyle = chipCols[Math.floor(rnd() * chipCols.length)];
    ctx.fillRect(rnd() * S, rnd() * S, 2 + rnd() * 4, 2 + rnd() * 4);
  }
  ctx.strokeStyle = groutHex;
  ctx.lineWidth = 2.5;
  for (let p = 0; p < S; p += 128) {
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
  tex.anisotropy = 8;
  return tex;
}

function makeChalkboardTexture() {
  const W = 1024;
  const H = 448;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const rnd = seeded(19527);

  ctx.fillStyle = '#124030';
  ctx.fillRect(0, 0, W, H);
  // Subtle chalk dust smudges
  for (let i = 0; i < 380; i++) {
    ctx.fillStyle = `rgba(240,250,245,${0.015 + rnd() * 0.035})`;
    ctx.fillRect(rnd() * W, rnd() * H, 12 + rnd() * 48, 6 + rnd() * 24);
  }
  ctx.strokeStyle = '#6f4222';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, W - 14, H - 14);

  ctx.fillStyle = '#fef08a';
  ctx.textAlign = 'center';
  ctx.font = 'bold 34px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText('বিসমিল্লাহির রাহমানির রাহিম', W * 0.5, 62);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 30px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText('খুলনা আলিয়া কামিল মাদ্রাসা · আজকের পাঠ', W * 0.5, 114);

  ctx.strokeStyle = 'rgba(248,250,252,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 140);
  ctx.lineTo(W - 60, 140);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '26px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText('১। আল-কুরআন ও তাফসীর: সূরা আল-বাকারা (আয়াত ১–৫)', 68, 194);
  ctx.fillText('২। আরবি ব্যাকরণ ও সাহিত্য: ইলমুস সরফ ও নাহু', 68, 244);
  ctx.fillText('৩। গণিত ও বিজ্ঞান: (a + b)² = a² + 2ab + b²', 68, 294);
  ctx.fillStyle = '#bae6fd';
  ctx.fillText('বাড়ির কাজ: আগামীকাল অনুশীলনী ৩.১ সমাধান করে আনবে।', 68, 356);

  // Small geometry triangle diagram on right
  ctx.strokeStyle = '#fde68a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(810, 330);
  ctx.lineTo(950, 330);
  ctx.lineTo(810, 200);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = '#fde68a';
  ctx.font = '20px Manrope, sans-serif';
  ctx.fillText('90°', 820, 318);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
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

  const step = 64;
  ctx.lineWidth = 3.2;
  for (let y = 0; y < S; y += step) {
    for (let x = 0; x < S; x += step) {
      const cx = x + step * 0.5;
      const cy = y + step * 0.5;
      ctx.strokeStyle = patternHex;
      ctx.strokeRect(x + 4, y + 4, step - 8, step - 8);
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

function makeHerringbonePaverTexture(seedVal = 1958) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = '#3f3b38';
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
      const isRed = (r + col) % 3 !== 0;
      if (isRed) {
        const R = 164 + Math.floor(rnd() * 26);
        const G = 64 + Math.floor(rnd() * 18);
        const B = 52 + Math.floor(rnd() * 14);
        ctx.fillStyle = `rgb(${R},${G},${B})`;
      } else {
        const v = 132 + Math.floor(rnd() * 28);
        ctx.fillStyle = `rgb(${v},${v - 2},${v - 6})`;
      }
      ctx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
      ctx.strokeStyle = 'rgba(255,235,215,0.16)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(bx + 3, by + 3, bw - 6, bh - 6);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeCurvedFasciaTexture({ line1, line2, fg = '#3b150e', subFg = '#1f2937' }) {
  const W = 1024;
  const H = 224;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const rnd = seeded(19529);

  ctx.fillStyle = '#c8afa0';
  ctx.fillRect(0, 0, W, H);
  const bh = 28;
  const bw = 64;
  for (let r = 0; r < H / bh; r++) {
    const off = (r % 2) * (bw * 0.5);
    for (let col = -1; col <= W / bw; col++) {
      const R = 212 + Math.floor(rnd() * 18 - 9);
      const G = 164 + Math.floor(rnd() * 16 - 8);
      const B = 148 + Math.floor(rnd() * 16 - 8);
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fillRect(col * bw + off + 2, r * bh + 2, bw - 4, bh - 4);
    }
  }
  ctx.fillStyle = '#ece6dc';
  ctx.fillRect(0, 0, W, 12);
  ctx.fillRect(0, H - 12, W, 12);

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

/**
 * True smooth ExtrudeGeometry Arch Spandrel (zero blocky rectangle arches!)
 * Creates a solid spandrel wall of width `span`, height `height`, thickness `depth`,
 * with a true semicircular or pointed arch cutout underneath of height `archRise`.
 */
function addTrueArchSpandrel(parent, { span, height, depth, archRise, pos, rotY = 0, mat }) {
  const hw = span * 0.5;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, 0);
  shape.lineTo(-hw, height);
  shape.lineTo(hw, height);
  shape.lineTo(hw, 0);
  // Smooth arch curve from +hw back to -hw
  const segs = 14;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const ang = t * Math.PI;
    const ax = Math.cos(ang) * hw;
    const ay = Math.sin(ang) * archRise;
    shape.lineTo(ax, ay);
  }
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 10 });
  geom.translate(0, 0, -depth * 0.5);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.y = rotY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function createAliaMaterialBank(m) {
  const mkPlaster = (hex, seedVal, rough = 0.80, streak = 0.12) => {
    const tex = makeWeatheredPlasterTexture(hex, seedVal, streak);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: rough, metalness: 0.02, envMapIntensity: 0.55 });
    attachDerivedPBRMaps(mat, tex, { strength: 1.6, roughBase: rough, normalScale: 0.58 });
    return mat;
  };

  const porticoBrickTex = makePorticoBrickTileTexture(1952);
  const porticoBrickMat = new THREE.MeshPhysicalMaterial({
    map: porticoBrickTex,
    roughness: 0.38,
    metalness: 0.06,
    clearcoat: 0.42,
    envMapIntensity: 0.85,
  });
  attachDerivedPBRMaps(porticoBrickMat, porticoBrickTex, { strength: 2.3, roughBase: 0.38, normalScale: 0.74 });

  const graniteTex = makeGraniteTexture(1966);
  const graniteMat = new THREE.MeshPhysicalMaterial({
    map: graniteTex,
    roughness: 0.24,
    metalness: 0.14,
    clearcoat: 0.72,
    envMapIntensity: 0.95,
  });

  const woodTex = makeWoodGrainTexture('#7c431f', '#3d1c08', 1953);
  const teakWoodMat = new THREE.MeshPhysicalMaterial({
    map: woodTex,
    roughness: 0.46,
    metalness: 0.04,
    clearcoat: 0.35,
    envMapIntensity: 0.6,
  });
  attachDerivedPBRMaps(teakWoodMat, woodTex, { strength: 1.6, roughBase: 0.46, normalScale: 0.5 });

  const lightWoodTex = makeWoodGrainTexture('#c49058', '#855628', 1954);
  const lightWoodMat = new THREE.MeshPhysicalMaterial({
    map: lightWoodTex,
    roughness: 0.44,
    metalness: 0.04,
    clearcoat: 0.38,
    envMapIntensity: 0.65,
  });
  attachDerivedPBRMaps(lightWoodMat, lightWoodTex, { strength: 1.4, roughBase: 0.44, normalScale: 0.45 });

  const tinTex = makeCorrugatedTinTexture(1984);
  tinTex.repeat.set(6, 3);
  const corrugatedTinMat = new THREE.MeshStandardMaterial({
    map: tinTex,
    roughness: 0.42,
    metalness: 0.68,
    envMapIntensity: 0.9,
  });
  attachDerivedPBRMaps(corrugatedTinMat, tinTex, { strength: 2.5, roughBase: 0.42, normalScale: 0.85 });

  const mosaicTex = makeMosaicFloorTexture('#ece6da', '#b0a899', 1971);
  const mosaicFloorMat = new THREE.MeshPhysicalMaterial({
    map: mosaicTex,
    roughness: 0.28,
    metalness: 0.04,
    clearcoat: 0.52,
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

  const paverTex = makeHerringbonePaverTexture(1958);
  const paverDrivewayMat = new THREE.MeshStandardMaterial({
    map: paverTex,
    roughness: 0.78,
    metalness: 0.04,
  });
  attachDerivedPBRMaps(paverDrivewayMat, paverTex, { strength: 2.2, roughBase: 0.78, normalScale: 0.72 });

  const chalkboardTex = makeChalkboardTexture();
  const chalkboardMat = new THREE.MeshStandardMaterial({
    map: chalkboardTex,
    roughness: 0.86,
    metalness: 0.02,
  });

  // High-detail vibrant Durba grass lawn ground texture so the entire field is lush green turf
  const durbaCanvas = document.createElement('canvas');
  durbaCanvas.width = 512;
  durbaCanvas.height = 512;
  const dctx = durbaCanvas.getContext('2d');
  const drnd = seeded(19529);
  dctx.fillStyle = '#3d7424';
  dctx.fillRect(0, 0, 512, 512);
  const turfColors = ['#4d8a2c', '#35681d', '#5c9c36', '#468028', '#68ab3f', '#2d5918'];
  for (let i = 0; i < 18000; i++) {
    dctx.strokeStyle = turfColors[Math.floor(drnd() * turfColors.length)];
    dctx.lineWidth = 1.0 + drnd() * 1.4;
    const bx = drnd() * 512;
    const by = drnd() * 512;
    const ang = (drnd() - 0.5) * 2.2 - Math.PI * 0.5;
    const len = 4 + drnd() * 9;
    dctx.beginPath();
    dctx.moveTo(bx, by);
    dctx.lineTo(bx + Math.cos(ang) * len, by + Math.sin(ang) * len);
    dctx.stroke();
  }
  const durbaTurfTex = new THREE.CanvasTexture(durbaCanvas);
  durbaTurfTex.colorSpace = THREE.SRGBColorSpace;
  durbaTurfTex.wrapS = durbaTurfTex.wrapT = THREE.RepeatWrapping;
  durbaTurfTex.anisotropy = 8;
  const durbaTurfMat = new THREE.MeshStandardMaterial({
    map: durbaTurfTex,
    roughness: 0.88,
    metalness: 0.0,
  });
  attachDerivedPBRMaps(durbaTurfMat, durbaTurfTex, { strength: 1.5, roughBase: 0.88, normalScale: 0.55 });

  const bank = {
    porticoBrick: porticoBrickMat,
    granite: graniteMat,
    mosaicFloor: mosaicFloorMat,
    paverDriveway: paverDrivewayMat,
    mosqueJaali: mosqueJaaliMat,
    minaretJaali: minaretJaaliMat,
    prayerCarpet: prayerCarpetMat,
    corrugatedTin: corrugatedTinMat,
    chalkboard: chalkboardMat,
    colonialCream: mkPlaster('#f2e6cf', 1953, 0.78, 0.11),
    academicCream: mkPlaster('#f5edd9', 1954, 0.76, 0.10),
    whitePlaster: mkPlaster('#f0f1ed', 1955, 0.74, 0.08),
    interiorWall: mkPlaster('#f6f3eb', 1956, 0.80, 0.04),
    terracotta: mkPlaster('#b24634', 1957, 0.82, 0.12),
    warmOchre: mkPlaster('#d4a165', 1958, 0.78, 0.08),
    stonePlinth: mkPlaster('#cfcbc2', 1959, 0.84, 0.10),
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
    chromeMat: new THREE.MeshStandardMaterial({ color: 0xdce3ec, roughness: 0.18, metalness: 0.92 }),
    steelDark: new THREE.MeshStandardMaterial({ color: 0x1e242b, roughness: 0.38, metalness: 0.78 }),
    benchSteel: new THREE.MeshStandardMaterial({ color: 0x1b3b2b, roughness: 0.44, metalness: 0.68 }),
    ironRail: new THREE.MeshStandardMaterial({ color: 0x261515, roughness: 0.44, metalness: 0.68 }),
    teakWood: teakWoodMat,
    lightWood: lightWoodMat,
    officeDado: new THREE.MeshStandardMaterial({ color: 0x27665c, roughness: 0.76 }),
    classDado: new THREE.MeshStandardMaterial({ color: 0x416987, roughness: 0.78 }),
    rugRed: new THREE.MeshStandardMaterial({ color: 0x7c2d2d, roughness: 0.92 }),
    cushionDark: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 }),
    glassCurtain: new THREE.MeshPhysicalMaterial({ color: 0x183f56, roughness: 0.08, metalness: 0.24, clearcoat: 0.94, opacity: 0.78, transparent: true }),
    cavityMat: new THREE.MeshStandardMaterial({ color: 0x0a1512, roughness: 0.94 }),
    flowerRed: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.82 }),
    flowerGold: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.82 }),
    moss: m.moss || new THREE.MeshStandardMaterial({ color: 0x2e6f3e, roughness: 0.90 }),
    grassTurf: durbaTurfMat,
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
 * REUSABLE ARCHITECTURAL PROPS (HIGH-DETAIL, ZERO CARTOON)
 * ========================================================================== */

function addCeilingFan(staticG, bank, x, y, z) {
  cylinder(staticG, 0.055, 0.075, 0.06, [x, y - 0.03, z], bank.whitePlaster, 10);
  cylinder(staticG, 0.022, 0.022, 0.42, [x, y - 0.24, z], bank.steelDark, 8);
  cylinder(staticG, 0.15, 0.16, 0.09, [x, y - 0.47, z], bank.whitePlaster, 14);
  cylinder(staticG, 0.165, 0.165, 0.02, [x, y - 0.47, z], bank.goldMat, 14);
  for (let b = 0; b < 3; b++) {
    const a = (b / 3) * Math.PI * 2;
    addRotBox(staticG, [0.18, 0.015, 0.04], [x + Math.cos(a) * 0.16, y - 0.47, z + Math.sin(a) * 0.16], bank.chromeMat, -a);
    addRotBox(staticG, [0.58, 0.016, 0.12], [x + Math.cos(a) * 0.42, y - 0.47, z + Math.sin(a) * 0.42], bank.whitePlaster, -a);
  }
}

function addWallClock(staticG, dynamicG, bank, x, y, z, rotY = Math.PI * 0.5) {
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.045, 16), bank.teakWood);
  rim.rotation.z = Math.PI * 0.5;
  rim.rotation.y = rotY - Math.PI * 0.5;
  rim.position.set(x, y, z);
  staticG.add(rim);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.05, 16), bank.chalkLine);
  face.rotation.z = Math.PI * 0.5;
  face.rotation.y = rotY - Math.PI * 0.5;
  face.position.set(x, y, z);
  staticG.add(face);
}

/**
 * Recessed Bangladeshi School Window with Wooden Frame, Iron Security Grilles,
 * Glass Pane, Concrete Sill & Concrete Sunshade (Chhajja).
 */
function addGrilledWindow(staticG, dynamicG, bank, x, fy, z, width = 1.9, height = 1.6, facingX = -1, lit = false) {
  const frameDepth = 0.22;
  const cx = x;
  const cy = fy + 1.68;
  // Concrete Sunshade (Chhajja) above window
  box(staticG, [0.52, 0.09, width + 0.34], [cx + facingX * 0.22, cy + height * 0.5 + 0.14, z], bank.colonialCream);
  // Concrete Sill below window
  box(staticG, [0.28, 0.09, width + 0.22], [cx + facingX * 0.06, cy - height * 0.5 - 0.06, z], bank.stonePlinth);
  // Outer Teak Window Frame
  box(staticG, [frameDepth, 0.08, width], [cx, cy + height * 0.5 - 0.04, z], bank.teakWood);
  box(staticG, [frameDepth, 0.08, width], [cx, cy - height * 0.5 + 0.04, z], bank.teakWood);
  box(staticG, [frameDepth, height, 0.08], [cx, cy, z - width * 0.5 + 0.04], bank.teakWood);
  box(staticG, [frameDepth, height, 0.08], [cx, cy, z + width * 0.5 - 0.04], bank.teakWood);
  box(staticG, [frameDepth, height, 0.06], [cx, cy, z], bank.teakWood); // Center mullion

  // Iron Security Grille Bars (authentic vertical + horizontal rods)
  for (let gz = -width * 0.36; gz <= width * 0.37; gz += 0.24) {
    box(staticG, [0.025, height - 0.12, 0.025], [cx + facingX * 0.04, cy, z + gz], bank.steelDark);
  }
  for (let gy = -height * 0.30; gy <= height * 0.32; gy += 0.35) {
    box(staticG, [0.025, 0.025, width - 0.12], [cx + facingX * 0.04, cy + gy, z], bank.steelDark);
  }

  // Tinted Glass Pane (shares static material; emissiveIntensity updates dynamically at night with 1 batched draw call!)
  box(staticG, [0.03, height - 0.12, width - 0.12], [cx - facingX * 0.03, cy, z], lit ? bank.warmWindowLit : bank.glassCurtain, { castShadow: false });
}

function addCoconutPalm(staticG, bank, x, z, height = 11.2, leanX = 0.5, leanZ = 0.3) {
  const segs = 5;
  let px = x;
  let py = 0;
  let pz = z;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const nx = x + leanX * t * t;
    const ny = height * t;
    const nz = z + leanZ * t * t;
    rodBetween(staticG, [px, py, pz], [nx, ny, nz], THREE.MathUtils.lerp(0.24, 0.12, t), bank.teakWood, 7);
    px = nx; py = ny; pz = nz;
  }
  for (let f = 0; f < 8; f++) {
    const ang = (f / 8) * Math.PI * 2;
    const frondLen = 2.8 + (f % 2) * 0.55;
    const midX = px + Math.cos(ang) * frondLen * 0.55;
    const midY = py + 0.55;
    const midZ = pz + Math.sin(ang) * frondLen * 0.55;
    const tipX = px + Math.cos(ang) * frondLen;
    const tipY = py - 0.55;
    const tipZ = pz + Math.sin(ang) * frondLen;
    rodBetween(staticG, [px, py, pz], [midX, midY, midZ], 0.075, bank.emeraldMat, 5);
    rodBetween(staticG, [midX, midY, midZ], [tipX, tipY, tipZ], 0.055, bank.emeraldMat, 5);
    addRotBox(staticG, [0.58, 0.08, frondLen * 0.72], [midX, midY - 0.12, midZ], bank.emeraldMat, Math.atan2(tipX - px, tipZ - pz));
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

function addCampusLamp(staticG, dynamicG, bank, x, z, h = 4.4, yBase = 0.0) {
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
 * 1. ULTRA-HIGH-DETAIL OFFICES & CLASSROOMS (GROUND, 2ND & 3RD FLOORS)
 *    Main Building Footprint: x = 177.0..190.0 (13m deep!), z = 76.0..140.0 (64m long!)
 *    Rooms: x = 177.2..186.6 (9.4m deep!), Corridor: x = 186.6..190.0 (3.4m wide!)
 * ========================================================================== */

function addAliaOfficeFurniture(staticG, dynamicG, bank, cx, cz, fy, labelTitle, roomLen = 8.6) {
  const wallX = 177.26;
  const doorX = 186.68;
  const halfLen = roomLen * 0.5 - 0.15;

  // Teal-Green Dado Paneling + Trim + Patterned Office Rug
  box(staticG, [0.06, 1.20, roomLen - 0.3], [wallX, fy + 0.60, cz], bank.officeDado);
  box(staticG, [9.2, 1.20, 0.06], [cx, fy + 0.60, cz - halfLen], bank.officeDado);
  box(staticG, [9.2, 1.20, 0.06], [cx, fy + 0.60, cz + halfLen], bank.officeDado);
  box(staticG, [4.2, 0.025, 4.8], [cx - 0.4, fy + 0.015, cz], bank.rugRed);

  // Executive Teak Desk with Modesty Panel, Brass Handles, Monitor, Keyboard, Files & Nameplate
  box(staticG, [1.85, 0.78, 0.96], [cx - 0.85, fy + 0.39, cz], bank.teakWood);
  box(staticG, [1.94, 0.06, 1.04], [cx - 0.85, fy + 0.79, cz], bank.lightWood);
  box(staticG, [0.06, 0.36, 0.58], [cx - 1.08, fy + 1.05, cz - 0.05], bank.steelDark);
  box(staticG, [0.03, 0.30, 0.52], [cx - 1.04, fy + 1.05, cz - 0.05], bank.screenGlow, { castShadow: false });
  box(staticG, [0.16, 0.08, 0.14], [cx - 1.08, fy + 0.85, cz - 0.05], bank.steelDark);
  box(staticG, [0.18, 0.025, 0.42], [cx - 0.78, fy + 0.83, cz - 0.05], bank.steelDark);
  box(staticG, [0.09, 0.025, 0.06], [cx - 0.78, fy + 0.83, cz + 0.24], bank.steelDark);
  box(staticG, [0.30, 0.04, 0.24], [cx - 0.72, fy + 0.84, cz - 0.36], bank.awningBlue);
  box(staticG, [0.30, 0.04, 0.24], [cx - 0.70, fy + 0.88, cz - 0.36], bank.flowerRed);
  box(staticG, [0.30, 0.04, 0.24], [cx - 0.73, fy + 0.92, cz - 0.36], bank.emeraldMat);
  cylinder(staticG, 0.038, 0.038, 0.10, [cx - 0.62, fy + 0.86, cz + 0.36], bank.goldMat, 8);
  box(staticG, [0.09, 0.10, 0.32], [cx - 0.36, fy + 0.86, cz], bank.goldMat);

  // Cushioned Executive Chair + 2 Visitor Chairs + Waiting Guest Sofa & Coffee Table
  box(staticG, [0.64, 0.12, 0.64], [cx - 2.08, fy + 0.46, cz], bank.cushionDark);
  box(staticG, [0.12, 0.72, 0.58], [cx - 2.36, fy + 0.84, cz], bank.cushionDark);
  cylinder(staticG, 0.04, 0.05, 0.42, [cx - 2.08, fy + 0.22, cz], bank.chromeMat, 8);
  for (const vz of [-0.66, 0.66]) {
    box(staticG, [0.52, 0.08, 0.52], [cx + 0.52, fy + 0.44, cz + vz], bank.cushionDark);
    box(staticG, [0.08, 0.50, 0.50], [cx + 0.76, fy + 0.70, cz + vz], bank.cushionDark);
    for (const [lx, lz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) {
      box(staticG, [0.04, 0.42, 0.04], [cx + 0.52 + lx, fy + 0.21, cz + vz + lz], bank.chromeMat);
    }
  }
  box(staticG, [2.3, 0.42, 0.76], [cx + 0.4, fy + 0.21, cz - halfLen + 0.55], bank.cushionDark);
  box(staticG, [2.3, 0.48, 0.16], [cx + 0.4, fy + 0.62, cz - halfLen + 0.22], bank.cushionDark);
  box(staticG, [1.2, 0.42, 0.58], [cx + 0.4, fy + 0.21, cz - halfLen + 1.55], bank.teakWood);

  // Bookshelf + Steel Almirah + Water Dispenser + Potted Plant
  box(staticG, [0.58, 2.25, 2.3], [wallX + 0.34, fy + 1.125, cz - 1.8], bank.teakWood);
  const bookCols = [bank.flowerRed, bank.awningBlue, bank.emeraldMat, bank.flowerGold, bank.terracotta];
  for (let shelf = 0; shelf < 4; shelf++) {
    const sy = fy + 0.36 + shelf * 0.48;
    for (let bi = 0; bi < 8; bi++) {
      box(staticG, [0.26, 0.32, 0.22], [wallX + 0.58, sy, cz - 2.68 + bi * 0.25], bookCols[(shelf + bi) % bookCols.length]);
    }
  }
  box(staticG, [0.60, 2.25, 1.9], [wallX + 0.34, fy + 1.125, cz + 1.9], bank.steelDark);
  box(staticG, [0.38, 0.94, 0.38], [wallX + 0.40, fy + 0.47, cz + halfLen - 0.55], bank.chalkLine);
  cylinder(staticG, 0.15, 0.15, 0.44, [wallX + 0.40, fy + 1.15, cz + halfLen - 0.55], bank.awningBlue, 10);
  cylinder(staticG, 0.20, 0.15, 0.38, [cx + 3.0, fy + 0.19, cz + halfLen - 0.55], bank.terracotta, 8);
  box(staticG, [0.58, 0.74, 0.58], [cx + 3.0, fy + 0.68, cz + halfLen - 0.55], bank.emeraldMat);

  // 2 Ceiling Fans + Split AC + LED Tube Lights + Wall Clock + Notice Board
  addCeilingFan(staticG, bank, cx - 1.1, fy + 3.45, cz);
  addCeilingFan(staticG, bank, cx + 1.8, fy + 3.45, cz);
  box(staticG, [0.26, 0.34, 1.15], [wallX + 0.14, fy + 2.92, cz], bank.acMat);
  addWallClock(staticG, dynamicG, bank, wallX + 0.05, fy + 2.65, cz - 2.3, Math.PI * 0.5);
  box(staticG, [1.8, 0.07, 0.12], [cx - 0.4, fy + 3.44, cz - 2.0], bank.tubeGlow, { castShadow: false });
  box(staticG, [1.8, 0.07, 0.12], [cx - 0.4, fy + 3.44, cz + 2.0], bank.tubeGlow, { castShadow: false });
  addSignBox(
    dynamicG,
    bank,
    { title: 'নোটিশ বোর্ড · খুলনা আলিয়া মাদ্রাসা', subtitle: 'অফিস সময়: সকাল ৮:৩০ – বিকাল ৪:০০ · ৮৮ খানজাহান আলী রোড', bg: '#0f3d2e', fg: '#ffffff', accent: '#fde047' },
    [cx - 0.4, fy + 1.80, cz + halfLen - 0.08],
    Math.PI,
    2.2,
    0.88,
    false
  );
  if (labelTitle) {
    addSignBox(
      dynamicG,
      bank,
      { title: labelTitle, subtitle: 'KHULNA ALIA KAMIL MADRASAH', bg: '#064e3b', fg: '#ffffff', accent: '#fde047' },
      [doorX + 0.14, fy + 2.65, cz],
      Math.PI * 0.5,
      2.15,
      0.54,
      true
    );
  }
}

/**
 * High-Quality Bangladeshi School Bench & Desk Unit:
 * Tubular powder-coated steel frame, under-desk book-rack shelf,
 * varnished wooden tabletop with front modesty skirt, and separate
 * backrest-equipped wooden sitting bench + books/notebooks.
 */
function addHighQualityBenchDeskSet(staticG, bank, rx, colZ, fy, seedIdx) {
  const deskLen = 2.45;
  const deskW = 0.50;
  const deskH = 0.76;
  const benchX = rx + 0.50;
  const benchH = 0.44;
  const bookCols = [bank.awningBlue, bank.flowerRed, bank.emeraldMat, bank.flowerGold];

  // 1) Varnished Teak Wooden Desktop + Front Modesty Skirt + Book-Rack Shelf
  box(staticG, [deskW, 0.045, deskLen], [rx, fy + deskH, colZ], bank.lightWood, { uvScale: 1.5 });
  box(staticG, [0.028, 0.24, deskLen - 0.10], [rx - deskW * 0.5 + 0.04, fy + deskH - 0.14, colZ], bank.teakWood);
  box(staticG, [deskW - 0.08, 0.03, deskLen - 0.14], [rx, fy + 0.52, colZ], bank.teakWood); // Under-desk shelf

  // 2) Tubular Steel Desk Frame (4 vertical legs, side bottom runners, crossbars)
  for (const lz of [-deskLen * 0.45, 0, deskLen * 0.45]) {
    box(staticG, [0.04, deskH, 0.04], [rx - deskW * 0.42, fy + deskH * 0.5, colZ + lz], bank.benchSteel);
    box(staticG, [0.04, deskH, 0.04], [rx + deskW * 0.42, fy + deskH * 0.5, colZ + lz], bank.benchSteel);
    box(staticG, [deskW - 0.04, 0.035, 0.035], [rx, fy + 0.04, colZ + lz], bank.benchSteel);
  }
  box(staticG, [0.035, 0.035, deskLen - 0.08], [rx, fy + 0.14, colZ], bank.benchSteel); // Footrest bar

  // 3) Wooden Sitting Bench (Seat Planks + Ergonomic Angled Backrest + Tubular Steel Legs)
  box(staticG, [0.34, 0.045, deskLen], [benchX, fy + benchH, colZ], bank.lightWood, { uvScale: 1.5 });
  // Angled Backrest Plank + Steel Backrest Uprights
  addRotBox(staticG, [0.035, 0.24, deskLen - 0.04], [benchX + 0.18, fy + benchH + 0.30, colZ], bank.teakWood, 0);
  for (const lz of [-deskLen * 0.45, 0, deskLen * 0.45]) {
    box(staticG, [0.038, benchH, 0.038], [benchX - 0.13, fy + benchH * 0.5, colZ + lz], bank.benchSteel);
    box(staticG, [0.038, benchH + 0.40, 0.038], [benchX + 0.15, fy + (benchH + 0.40) * 0.5, colZ + lz], bank.benchSteel);
    box(staticG, [0.30, 0.032, 0.032], [benchX, fy + 0.035, colZ + lz], bank.benchSteel);
  }

  // 4) Open Student Notebooks, Stacked Textbooks & Pens on Desktop
  box(staticG, [0.24, 0.024, 0.32], [rx + 0.02, fy + deskH + 0.035, colZ - 0.68], bank.chalkLine);
  box(staticG, [0.21, 0.034, 0.27], [rx - 0.02, fy + deskH + 0.04, colZ + 0.52], bookCols[seedIdx % bookCols.length]);
  box(staticG, [0.20, 0.028, 0.25], [rx - 0.02, fy + deskH + 0.07, colZ + 0.52], bookCols[(seedIdx + 2) % bookCols.length]);
  cylinder(staticG, 0.008, 0.008, 0.15, [rx + 0.08, fy + deskH + 0.03, colZ - 0.38], bank.steelDark, 6);
}

function addAliaClassroomFurniture(staticG, dynamicG, bank, cx, cz, fy, roomName, roomLen = 8.6) {
  const wallX = 177.26;
  const doorX = 186.68;
  const halfLen = roomLen * 0.5 - 0.15;

  // 1) Classroom Lower Dado Wall Band + Raised Teak Teacher Podium (Dais)
  box(staticG, [0.06, 1.15, roomLen - 0.3], [wallX, fy + 0.58, cz], bank.classDado);
  box(staticG, [9.2, 1.15, 0.06], [cx, fy + 0.58, cz - halfLen], bank.classDado);
  box(staticG, [9.2, 1.15, 0.06], [cx, fy + 0.58, cz + halfLen], bank.classDado);
  box(staticG, [1.85, 0.18, 4.8], [wallX + 1.05, fy + 0.09, cz], bank.lightWood);
  box(staticG, [0.32, 0.09, 1.8], [wallX + 2.12, fy + 0.045, cz], bank.teakWood); // Step onto podium

  // 2) Large Framed Green Chalkboard with High-Res Chalk Lesson Texture + Tray + Duster & Chalk
  box(staticG, [0.10, 1.58, 4.10], [wallX + 0.05, fy + 1.72, cz], bank.teakWood);
  const boardFace = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.44, 3.92), bank.chalkboard);
  boardFace.position.set(wallX + 0.11, fy + 1.72, cz);
  boardFace.rotation.y = 0;
  staticG.add(boardFace);
  box(staticG, [0.20, 0.07, 4.00], [wallX + 0.15, fy + 0.96, cz], bank.teakWood);
  box(staticG, [0.07, 0.04, 0.18], [wallX + 0.19, fy + 1.02, cz - 0.65], bank.warmOchre);
  box(staticG, [0.03, 0.03, 0.12], [wallX + 0.19, fy + 1.01, cz + 0.45], bank.chalkLine);

  // 3) Teacher's Desk + Cushioned Chair + Attendance Register + Water Bottle
  box(staticG, [0.82, 0.80, 1.52], [wallX + 1.38, fy + 0.58, cz], bank.teakWood);
  box(staticG, [0.88, 0.05, 1.58], [wallX + 1.38, fy + 0.99, cz], bank.lightWood);
  box(staticG, [0.36, 0.04, 0.46], [wallX + 1.40, fy + 1.04, cz - 0.18], bank.chalkLine);
  cylinder(staticG, 0.042, 0.042, 0.24, [wallX + 1.48, fy + 1.13, cz + 0.45], bank.awningBlue, 8);
  box(staticG, [0.48, 0.48, 0.48], [wallX + 0.68, fy + 0.42, cz], bank.cushionDark);
  box(staticG, [0.08, 0.50, 0.48], [wallX + 0.46, fy + 0.74, cz], bank.cushionDark);

  // 4) 4 Rows x 2 Columns (8 High-Quality Bench-Desk Sets = 24+ Student Seats per Classroom!)
  for (let row = 0; row < 4; row++) {
    const rx = cx - 1.35 + row * 1.42;
    for (let ci = 0; ci < 2; ci++) {
      const colZ = ci === 0 ? (cz - 1.82) : (cz + 1.82);
      addHighQualityBenchDeskSet(staticG, bank, rx, colZ, fy, row + ci);
    }
  }

  // 5) 2 Detailed Ceiling Fans + 4 LED Tube Lights + Wall Clock + Routine Board + Dustbin
  addCeilingFan(staticG, bank, cx - 0.5, fy + 3.45, cz - 1.85);
  addCeilingFan(staticG, bank, cx - 0.5, fy + 3.45, cz + 1.85);
  for (const lx of [cx - 1.4, cx + 1.4]) {
    box(staticG, [1.8, 0.06, 0.12], [lx, fy + 3.44, cz - 2.6], bank.tubeGlow, { castShadow: false });
    box(staticG, [1.8, 0.06, 0.12], [lx, fy + 3.44, cz + 2.6], bank.tubeGlow, { castShadow: false });
  }
  addWallClock(staticG, dynamicG, bank, wallX + 0.05, fy + 2.82, cz + 2.85, Math.PI * 0.5);
  cylinder(staticG, 0.16, 0.13, 0.38, [doorX - 0.65, fy + 0.19, cz - halfLen + 0.45], bank.steelDark, 8);
  addSignBox(
    dynamicG,
    bank,
    { title: 'ক্লাস রুটিন ও সময়সূচী', subtitle: 'সকাল ৯:০০ – দুপুর ২:৩০ · আলিয়া মাদ্রাসা', bg: '#1e3a8a', fg: '#ffffff', accent: '#fde047' },
    [cx + 0.2, fy + 1.80, cz - halfLen + 0.08],
    0,
    1.95,
    0.82,
    false
  );
  addSignBox(
    dynamicG,
    bank,
    { title: roomName, subtitle: 'KHULNA ALIA KAMIL MADRASAH', bg: '#1e3a8a', fg: '#ffffff', accent: '#fde047' },
    [doorX + 0.14, fy + 2.65, cz],
    Math.PI * 0.5,
    2.15,
    0.54,
    true
  );
}

/* ============================================================================
 * 2. GRAND 64m REAL-PHOTO MAIN BUILDING + SEMICIRCULAR BRICK-TILED PORTICO
 *    Footprint: x = 177.0..190.0 (13m deep!), z = 76.0..140.0 (64m long!)
 *    Floors: y0 = 0.50m, y1 = 4.20m, y2 = 7.90m, yRoof = 11.60m
 * ========================================================================== */

const MAIN_OLD_CX = 183.5;
const MAIN_OLD_CZ = 108.0;
// Aligned directly STRAIGHT AHEAD of the Main Gate (gx = 184.0, gz = 207.5), facing SOUTH (+Z)!
const MAIN_NEW_CX = 184.0;
const MAIN_NEW_CZ = 76.0;

function mainLocalToWorldXZ(oldX, oldZ) {
  return {
    x: MAIN_NEW_CX - (oldZ - MAIN_OLD_CZ),
    z: MAIN_NEW_CZ + (oldX - MAIN_OLD_CX),
  };
}

function mainWorldToLocalXZ(wx, wz) {
  return {
    x: MAIN_OLD_CX + (wz - MAIN_NEW_CZ),
    z: MAIN_OLD_CZ - (wx - MAIN_NEW_CX),
  };
}

function buildMainPorticoBuilding(outerStaticG, outerDynamicG, bank) {
  const mainStaticRoot = new THREE.Group();
  mainStaticRoot.position.set(MAIN_NEW_CX, 0, MAIN_NEW_CZ);
  mainStaticRoot.rotation.y = -Math.PI * 0.5;
  outerStaticG.add(mainStaticRoot);
  const staticG = new THREE.Group();
  staticG.position.set(-MAIN_OLD_CX, 0, -MAIN_OLD_CZ);
  mainStaticRoot.add(staticG);

  const mainDynRoot = new THREE.Group();
  mainDynRoot.position.set(MAIN_NEW_CX, 0, MAIN_NEW_CZ);
  mainDynRoot.rotation.y = -Math.PI * 0.5;
  outerDynamicG.add(mainDynRoot);
  const dynamicG = new THREE.Group();
  dynamicG.position.set(-MAIN_OLD_CX, 0, -MAIN_OLD_CZ);
  mainDynRoot.add(dynamicG);

  const mainX = MAIN_OLD_CX;
  const mainZ = MAIN_OLD_CZ;
  const y0 = 0.50;
  const y1 = 4.20;
  const y2 = 7.90;
  const yRoof = 11.60;

  // Ground Plinth with Polished Terrazzo Mosaic Tile Surface + Wide Entry Ramp (x = 189.8..192.6, z = 105.0..111.0)
  box(staticG, [13.4, y0 - 0.04, 64.4], [mainX, (y0 - 0.04) * 0.5, mainZ], bank.stonePlinth);
  box(staticG, [13.2, 0.04, 64.2], [mainX, y0 - 0.02, mainZ], bank.mosaicFloor, { castShadow: false, uvScale: 5.5 });
  box(staticG, [2.8, 0.24, 6.2], [191.2, 0.16, mainZ], bank.stonePlinth);

  // 2nd Floor Slab (y1 = 4.20m, with stairwell cutout at x = 177.4..186.4, z = 105.0..111.0)
  box(staticG, [13.2, 0.26, 29.0], [mainX, y1 - 0.14, 90.5], bank.colonialCream);
  box(staticG, [13.2, 0.26, 29.0], [mainX, y1 - 0.14, 125.5], bank.colonialCream);
  box(staticG, [3.6, 0.26, 6.2], [188.3, y1 - 0.14, mainZ], bank.colonialCream);
  box(staticG, [13.0, 0.03, 28.8], [mainX, y1 - 0.015, 90.5], bank.mosaicFloor, { castShadow: false, uvScale: 4.5 });
  box(staticG, [13.0, 0.03, 28.8], [mainX, y1 - 0.015, 125.5], bank.mosaicFloor, { castShadow: false, uvScale: 4.5 });
  box(staticG, [3.5, 0.03, 6.1], [188.3, y1 - 0.015, mainZ], bank.mosaicFloor, { castShadow: false, uvScale: 2.0 });

  // 3rd Floor Slab (y2 = 7.90m, ALSO walkable!) + Terracotta Roof Cornice (yRoof = 11.60m)
  box(staticG, [13.2, 0.26, 29.0], [mainX, y2 - 0.14, 90.5], bank.colonialCream);
  box(staticG, [13.2, 0.26, 29.0], [mainX, y2 - 0.14, 125.5], bank.colonialCream);
  box(staticG, [3.6, 0.26, 6.2], [188.3, y2 - 0.14, mainZ], bank.colonialCream);
  box(staticG, [13.0, 0.03, 28.8], [mainX, y2 - 0.015, 90.5], bank.mosaicFloor, { castShadow: false, uvScale: 4.5 });
  box(staticG, [13.0, 0.03, 28.8], [mainX, y2 - 0.015, 125.5], bank.mosaicFloor, { castShadow: false, uvScale: 4.5 });
  box(staticG, [3.5, 0.03, 6.1], [188.3, y2 - 0.015, mainZ], bank.mosaicFloor, { castShadow: false, uvScale: 2.0 });

  // Roof Slab & Terracotta Cornice (South Wing concrete roof + North Wing authentic corrugated tin-shed roof!)
  box(staticG, [13.6, 0.34, 34.4], [mainX, yRoof, 123.0], bank.colonialCream);
  box(staticG, [14.0, 0.48, 34.8], [mainX, yRoof + 0.36, 123.0], bank.terracotta);
  box(staticG, [13.8, 0.18, 34.6], [mainX, yRoof + 0.68, 123.0], bank.whitePlaster);
  // Real-Photo Corrugated Steel Tin-Shed Roof on North Wing (z = 75.8..105.5) with steel trusses!
  addRotBox(staticG, [14.2, 0.16, 30.2], [mainX, yRoof + 0.85, 90.8], bank.corrugatedTin, 0);
  for (let pz = 76.5; pz <= 104.5; pz += 4.6) {
    cylinder(staticG, 0.06, 0.07, 1.15, [189.6, yRoof + 0.32, pz], bank.steelDark, 6);
    box(staticG, [13.4, 0.14, 0.14], [mainX, yRoof + 0.65, pz], bank.steelDark);
  }

  // Outer Perimeter Walls (West back wall, North & South end walls) across ALL 3 STORIES
  box(staticG, [0.38, yRoof - y0, 64.2], [177.0, (y0 + yRoof) * 0.5, mainZ], bank.colonialCream);
  box(staticG, [13.2, yRoof - y0, 0.38], [mainX, (y0 + yRoof) * 0.5, 76.0], bank.colonialCream);
  box(staticG, [13.2, yRoof - y0, 0.38], [mainX, (y0 + yRoof) * 0.5, 140.0], bank.colonialCream);

  // Exterior Recessed Grilled Windows with Concrete Chhajjas along West back wall across all 3 floors
  for (const fy of [y0, y1, y2]) {
    for (let wz = 79.0; wz <= 137.0; wz += 4.4) {
      if (Math.abs(wz - mainZ) < 3.6) continue;
      addGrilledWindow(staticG, dynamicG, bank, 176.82, fy, wz, 1.95, 1.65, -1, Math.round(wz) % 2 === 0);
    }
  }

  // Real-Photo East Front TRUE ARCHED COLONNADE + Vertical Slotted Concrete Balustrades (`| | | | |`) on 2nd & 3rd Floors!
  const bayWidth = 3.5;
  for (let wz = -28.0; wz <= 28.0; wz += bayWidth) {
    if (Math.abs(wz) < 3.4) continue;
    const pz = mainZ + wz;
    // Vertical colonnade piers across all 3 stories
    box(staticG, [0.42, yRoof - y0, 0.44], [189.85, (y0 + yRoof) * 0.5, pz], bank.colonialCream);
    box(staticG, [0.48, 0.24, 0.50], [189.85, y1 - 0.10, pz], bank.whitePlaster);
    box(staticG, [0.48, 0.24, 0.50], [189.85, y2 - 0.10, pz], bank.whitePlaster);

    const nextZ = pz + bayWidth;
    if (wz < 27.5 && Math.abs(wz + bayWidth * 0.5) > 3.4) {
      const midBayZ = (pz + nextZ) * 0.5;
      // TRUE CURVED GROUND-FLOOR COLONNADE ARCH (ExtrudeGeometry, zero blocky boxes!)
      addTrueArchSpandrel(staticG, {
        span: bayWidth - 0.38,
        height: 1.05,
        depth: 0.36,
        archRise: 0.72,
        pos: [189.85, y1 - 1.18, midBayZ],
        rotY: Math.PI * 0.5,
        mat: bank.colonialCream,
      });

      // 2nd & 3rd Floor Real-Photo Vertical Slotted Concrete Balustrades (`| | | | |`) + Top Iron Railings
      for (const fy of [y1, y2]) {
        box(staticG, [0.24, 0.14, bayWidth - 0.36], [189.85, fy + 0.08, midBayZ], bank.colonialCream);
        box(staticG, [0.24, 0.16, bayWidth - 0.36], [189.85, fy + 0.98, midBayZ], bank.colonialCream);
        box(staticG, [0.06, 0.05, bayWidth - 0.36], [189.88, fy + 1.14, midBayZ], bank.ironRail);
        for (let slot = -1.25; slot <= 1.26; slot += 0.42) {
          box(staticG, [0.20, 0.78, 0.18], [189.85, fy + 0.52, midBayZ + slot], bank.colonialCream);
        }
      }
    }
  }

  // Interior Hallway Partition Walls (at x = 186.65) + Grilled Classroom Windows + Teak Doors across ALL 3 FLOORS!
  // 3 Rooms South (z = 111.5..121.0, 121.0..130.5, 130.5..139.8) & 3 Rooms North (z = 95.0..104.5, 85.5..95.0, 76.2..85.5)
  const roomCentersSouth = [116.25, 125.75, 135.15];
  const roomCentersNorth = [99.75, 90.25, 80.85];
  const doorZs = [80.85, 90.25, 99.75, 116.25, 125.75, 135.15];

  for (const fy of [y0, y1, y2]) {
    const wallH = 3.48;
    const midY = fy + wallH * 0.5;
    // Corridor wall segments between open doorways (2.1m wide open doors at each room center!)
    const wallSpans = [
      [76.2, 79.8], [81.9, 89.2], [91.3, 98.7], [100.8, 104.5],
      [111.5, 115.2], [117.3, 124.7], [126.8, 134.1], [136.2, 139.8],
    ];
    for (const [z0, z1] of wallSpans) {
      box(staticG, [0.24, wallH, z1 - z0], [186.65, midY, (z0 + z1) * 0.5], bank.interiorWall);
    }
    // Doorway lintels, teak frames, swung-open doors & corridor grilled windows
    for (const dz of doorZs) {
      box(staticG, [0.24, wallH - 2.38, 2.14], [186.65, fy + 2.38 + (wallH - 2.38) * 0.5, dz], bank.interiorWall);
      box(staticG, [0.28, 2.38, 0.08], [186.65, fy + 1.19, dz - 1.03], bank.teakWood);
      box(staticG, [0.28, 2.38, 0.08], [186.65, fy + 1.19, dz + 1.03], bank.teakWood);
      box(staticG, [0.28, 0.08, 2.14], [186.65, fy + 2.36, dz], bank.teakWood);
      box(staticG, [0.96, 2.28, 0.06], [186.15, fy + 1.14, dz - 0.96], bank.teakWood);
      // Grilled window looking out onto the veranda next to each door
      addGrilledWindow(staticG, dynamicG, bank, 186.65, fy, dz + 2.4, 1.55, 1.45, 1, false);
      box(staticG, [0.14, 0.05, 1.55], [188.3, fy + 3.42, dz], bank.tubeGlow, { castShadow: false });
    }
    // Room divider walls
    for (const divZ of [85.5, 95.0, 104.5, 111.5, 121.0, 130.5]) {
      box(staticG, [9.5, wallH, 0.24], [181.9, midY, divZ], bank.interiorWall);
    }
  }

  // GRAND S-SHAPED (SWITCHBACK) MARBLE STAIRCASE (x = 177.5..186.4, z = 104.7..111.3) — Climbs ALL 3 FLOORS!
  const buildSwitchbackFlight = (yBot, yTop) => {
    const yMid = (yBot + yTop) * 0.5;
    const steps = 11;
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const sx = THREE.MathUtils.lerp(186.2, 179.8, t);
      const sy = THREE.MathUtils.lerp(yBot, yMid, (i + 1) / steps);
      box(staticG, [0.62, 0.24, 2.65], [sx, sy - 0.12, 109.6], bank.marbleWhite);
      box(staticG, [0.06, 0.025, 2.65], [sx + 0.28, sy + 0.005, 109.6], bank.granite);
    }
    box(staticG, [2.2, 0.24, 6.2], [178.6, yMid - 0.12, mainZ], bank.marbleWhite);
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const sx = THREE.MathUtils.lerp(179.8, 186.2, t);
      const sy = THREE.MathUtils.lerp(yMid, yTop, (i + 1) / steps);
      box(staticG, [0.62, 0.24, 2.65], [sx, sy - 0.12, 106.4], bank.marbleWhite);
      box(staticG, [0.06, 0.025, 2.65], [sx - 0.28, sy + 0.005, 106.4], bank.granite);
    }
    rodBetween(staticG, [186.2, yBot + 0.95, 108.15], [179.8, yMid + 0.95, 108.15], 0.04, bank.chromeMat);
    rodBetween(staticG, [179.8, yMid + 0.95, 107.85], [186.2, yTop + 0.95, 107.85], 0.04, bank.chromeMat);
  };
  buildSwitchbackFlight(y0, y1);
  buildSwitchbackFlight(y1, y2);

  // Furnished Rooms across Ground, 2nd & 3rd Floors!
  addAliaOfficeFurniture(staticG, dynamicG, bank, 181.9, roomCentersSouth[0], y0, 'অধ্যক্ষের কার্যালয় (PRINCIPAL OFFICE)', 9.2);

  // Principal's Office Campus PA Announcement Microphone + Ahuja Amplifier + Glowing ON-AIR LED
  const principalMicPos = new THREE.Vector3(181.25, y0 + 0.96, roomCentersSouth[0] + 0.24);
  const principalMicLedMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x22c55e,
    emissiveIntensity: 0.75,
    roughness: 0.25,
  });
  {
    const mx = principalMicPos.x;
    const deskY = y0 + 0.82;
    const mz = principalMicPos.z;
    // Heavy desktop PA mic base + push-to-talk switch
    box(staticG, [0.16, 0.042, 0.20], [mx, deskY + 0.021, mz], bank.steelDark);
    box(staticG, [0.055, 0.018, 0.045], [mx + 0.035, deskY + 0.046, mz], bank.chromeMat);
    // Curved gooseneck stem + foam windscreen head facing the Principal's chair
    rodBetween(staticG, [mx - 0.02, deskY + 0.04, mz], [mx - 0.05, deskY + 0.24, mz], 0.008, bank.steelDark);
    rodBetween(staticG, [mx - 0.05, deskY + 0.24, mz], [mx - 0.13, deskY + 0.30, mz], 0.007, bank.steelDark);
    const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), bank.steelDark);
    micHead.position.set(mx - 0.145, deskY + 0.305, mz);
    staticG.add(micHead);
    // Glowing status LED ring on mic base (pulses bright red when LIVE ON AIR)
    const ledMesh = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), principalMicLedMat);
    ledMesh.position.set(mx + 0.055, deskY + 0.052, mz + 0.055);
    dynamicG.add(ledMesh);
    // Classic Ahuja-style PA Amplifier box right beside the mic on Principal's desk
    box(staticG, [0.28, 0.12, 0.36], [mx - 0.12, deskY + 0.06, mz + 0.34], bank.steelDark);
    box(staticG, [0.015, 0.08, 0.30], [mx + 0.025, deskY + 0.065, mz + 0.34], bank.chromeMat);
    for (let ki = 0; ki < 4; ki++) {
      cylinder(staticG, 0.012, 0.012, 0.02, [mx + 0.035, deskY + 0.065, mz + 0.23 + ki * 0.07], bank.goldMat, 8);
    }
    // Twin Campus PA Horn Loudspeakers high on the main veranda facing the Alia Madrasah courtyard & field
    for (const hz of [mainZ - 5.2, mainZ + 5.2]) {
      box(staticG, [0.16, 0.14, 0.14], [190.45, 9.15, hz], bank.steelDark);
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.44, 14, 1, true), bank.whitePlaster);
      horn.rotation.z = -Math.PI * 0.44;
      horn.position.set(190.72, 9.08, hz);
      staticG.add(horn);
    }
  }
  const principalMicWorldXZ = mainLocalToWorldXZ(principalMicPos.x, principalMicPos.z);
  const principalMicWorldPos = new THREE.Vector3(principalMicWorldXZ.x, principalMicPos.y, principalMicWorldXZ.z);
  function isNearPrincipalMic(pos, maxDist = 3.8) {
    if (!pos) return false;
    if (pos.y > y0 + 2.8) return false;
    return Math.hypot(pos.x - principalMicWorldPos.x, pos.z - principalMicWorldPos.z) <= maxDist;
  }
  function setPrincipalMicActive(isOn, level = 0) {
    if (isOn) {
      principalMicLedMat.color.setHex(0xff2a2a);
      principalMicLedMat.emissive.setHex(0xff1a1a);
      principalMicLedMat.emissiveIntensity = 1.6 + Math.min(1, level) * 2.6;
    } else {
      principalMicLedMat.color.setHex(0x22c55e);
      principalMicLedMat.emissive.setHex(0x22c55e);
      principalMicLedMat.emissiveIntensity = 0.65;
    }
  }
  addAliaOfficeFurniture(staticG, dynamicG, bank, 181.9, roomCentersSouth[1], y0, 'উপাধ্যক্ষের কার্যালয় (VICE PRINCIPAL)', 9.2);
  addAliaOfficeFurniture(staticG, dynamicG, bank, 181.9, roomCentersSouth[2], y0, 'একাডেমিক ও পরীক্ষা নিয়ন্ত্রক অফিস', 9.2);
  addAliaOfficeFurniture(staticG, dynamicG, bank, 181.9, roomCentersNorth[0], y0, 'শিক্ষক মিলনায়তন (TEACHERS COMMON ROOM)', 9.2);
  addAliaOfficeFurniture(staticG, dynamicG, bank, 181.9, roomCentersNorth[1], y0, 'হিসাব ও রেজিস্ট্রার অফিস', 9.2);
  addAliaOfficeFurniture(staticG, dynamicG, bank, 181.9, roomCentersNorth[2], y0, 'কেন্দ্রীয় গ্রন্থাগার (CENTRAL LIBRARY)', 9.2);

  addAliaClassroomFurniture(staticG, dynamicG, bank, 181.9, roomCentersSouth[0], y1, 'শ্রেণিকক্ষ ১০১ (দাখিল ৯ম বিজ্ঞান)', 9.2);
  addAliaClassroomFurniture(staticG, dynamicG, bank, 181.9, roomCentersSouth[1], y1, 'শ্রেণিকক্ষ ১০২ (দাখিল ১০ম বিজ্ঞান)', 9.2);
  addAliaClassroomFurniture(staticG, dynamicG, bank, 181.9, roomCentersSouth[2], y1, 'শ্রেণিকক্ষ ১০৩ (আলিম ১ম বর্ষ)', 9.2);
  addAliaClassroomFurniture(staticG, dynamicG, bank, 181.9, roomCentersNorth[0], y1, 'শ্রেণিকক্ষ ২০১ (আলিম ২য় বর্ষ)', 9.2);
  addAliaClassroomFurniture(staticG, dynamicG, bank, 181.9, roomCentersNorth[1], y1, 'শ্রেণিকক্ষ ২০২ (ফাজিল অনার্স)', 9.2);
  addAliaClassroomFurniture(staticG, dynamicG, bank, 181.9, roomCentersNorth[2], y1, 'শ্রেণিকক্ষ ২০৩ (কামিল হাদিস বিভাগ)', 9.2);

  addAliaClassroomFurniture(staticG, dynamicG, bank, 181.9, roomCentersSouth[0], y2, 'কামিল লেকচার হল ৩০১', 9.2);
  addAliaClassroomFurniture(staticG, dynamicG, bank, 181.9, roomCentersSouth[1], y2, 'অনার্স সেমিনার কক্ষ ৩০২', 9.2);
  addAliaClassroomFurniture(staticG, dynamicG, bank, 181.9, roomCentersNorth[0], y2, 'আইসিটি ও কম্পিউটার ল্যাব', 9.2);

  // ============================================================================
  // ICONIC REAL-PHOTO SEMICIRCULAR BRICK-TILED CENTRAL PORTICO TOWER!
  // Matches exact photograph (`Khulna-Alia-Kamil-Madrasah-1.jpg`):
  //   - Larger 5.2m radius semicircular portico matching the 64m facade!
  //   - Twin pairs of speckled grey granite columns with chrome collars
  //   - True curved pointed entrance arch spandrel (zero blocky boxes!)
  //   - Curved embossed Bengali/Arabic/English fascia lettering & black railings
  // ============================================================================
  const portX = 190.4;
  cylinder(staticG, 5.15, 5.28, 0.38, [portX, 0.19, mainZ], bank.stonePlinth, 32);

  // 4 Speckled Grey Granite Columns with Polished Chrome Collar Rings
  for (const ang of [-1.18, -0.60, 0.60, 1.18]) {
    const px = portX + Math.cos(ang) * 4.78;
    const pz = mainZ + Math.sin(ang) * 4.78;
    cylinder(staticG, 0.28, 0.31, 3.85, [px, 2.15, pz], bank.granite, 14);
    cylinder(staticG, 0.34, 0.36, 0.18, [px, 0.48, pz], bank.chromeMat, 14);
    cylinder(staticG, 0.33, 0.33, 0.16, [px, 3.98, pz], bank.chromeMat, 14);
  }

  // True Curved Arch Spandrel over Ground Entrance Portal
  addTrueArchSpandrel(staticG, {
    span: 5.4,
    height: 1.25,
    depth: 0.42,
    archRise: 0.88,
    pos: [portX + 4.02, 2.95, mainZ],
    rotY: Math.PI * 0.5,
    mat: bank.porticoBrick,
  });

  // 2nd-Floor Curved Brick-Tiled Parapet Band + Recessed Veranda + Curved Black Handrail
  cylinder(staticG, 5.32, 5.32, 1.28, [portX, 4.35, mainZ], bank.porticoBrick, 32);
  cylinder(staticG, 5.42, 5.42, 0.14, [portX, 5.04, mainZ], bank.whitePlaster, 32);
  cylinder(staticG, 5.36, 5.36, 0.05, [portX, 5.28, mainZ], bank.ironRail, 32);

  // 2nd-Floor Shaded Veranda + Inner Columns
  cylinder(staticG, 4.88, 4.88, 2.48, [portX, 6.25, mainZ], bank.emeraldDark, 28);
  for (const ang of [-1.05, -0.45, 0.45, 1.05]) {
    cylinder(staticG, 0.18, 0.20, 2.55, [portX + Math.cos(ang) * 5.08, 6.25, mainZ + Math.sin(ang) * 5.08], bank.whitePlaster, 10);
  }

  // 3rd-Floor Curved Brick-Tiled Parapet Band + Railings
  cylinder(staticG, 5.36, 5.36, 1.32, [portX, 8.05, mainZ], bank.porticoBrick, 32);
  cylinder(staticG, 5.46, 5.46, 0.14, [portX, 8.76, mainZ], bank.whitePlaster, 32);
  cylinder(staticG, 5.40, 5.40, 0.05, [portX, 8.98, mainZ], bank.ironRail, 32);

  // 3rd-Floor Shaded Curved Veranda + Columns + Top Crown
  cylinder(staticG, 4.88, 4.88, 2.42, [portX, 9.95, mainZ], bank.emeraldDark, 28);
  for (const ang of [-1.05, -0.45, 0.45, 1.05]) {
    cylinder(staticG, 0.18, 0.20, 2.45, [portX + Math.cos(ang) * 5.08, 9.95, mainZ + Math.sin(ang) * 5.08], bank.whitePlaster, 10);
  }
  cylinder(staticG, 5.44, 5.44, 1.65, [portX, 11.95, mainZ], bank.porticoBrick, 32);
  cylinder(staticG, 5.58, 5.58, 0.28, [portX, 12.88, mainZ], bank.terracotta, 32);

  // Recessed Portico Entry Ceiling Downlights
  for (const [lx, lz] of [[portX + 2.0, mainZ - 1.6], [portX + 2.0, mainZ + 1.6], [portX + 3.4, mainZ]]) {
    const downlight = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 10), bank.bulbGlow);
    downlight.position.set(lx, 3.72, lz);
    dynamicG.add(downlight);
  }

  // CURVED EMBOSSED LETTERING WRAPPED DIRECTLY ONTO THE SEMICIRCULAR PORTICO FASCIA!
  const arcSpan = Math.PI * 0.68;
  const arcStart = Math.PI * 0.5 - arcSpan * 0.5;
  const fascia1Tex = makeCurvedFasciaTexture({
    line1: 'খুলনা আলিয়া কামিল মাদ্রাসা (অনার্স)',
    line2: 'KHULNA ALIA KAMIL MADRASA (HONOURS) · স্থাপিত: ১৯৫২',
  });
  const fascia1Mat = new THREE.MeshStandardMaterial({ map: fascia1Tex, emissive: 0xffffff, emissiveMap: fascia1Tex, emissiveIntensity: 0.22, roughness: 0.42, metalness: 0.08 });
  bank.emissiveList.push({ mat: fascia1Mat, day: 0.18, night: 0.95 });
  const fascia1Mesh = new THREE.Mesh(new THREE.CylinderGeometry(5.38, 5.38, 1.24, 32, 1, true, arcStart, arcSpan), fascia1Mat);
  fascia1Mesh.position.set(portX, 4.35, mainZ);
  dynamicG.add(fascia1Mesh);

  const fascia2Tex = makeCurvedFasciaTexture({
    line1: 'খুলনা আলিয়া কামিল মাদ্রাসা (অনার্স)',
    line2: 'KHULNA ALIA KAMIL MADRASAH · ৮৮ খানজাহান আলী রোড, খুলনা',
  });
  const fascia2Mat = new THREE.MeshStandardMaterial({ map: fascia2Tex, emissive: 0xffffff, emissiveMap: fascia2Tex, emissiveIntensity: 0.22, roughness: 0.42, metalness: 0.08 });
  bank.emissiveList.push({ mat: fascia2Mat, day: 0.18, night: 0.95 });
  const fascia2Mesh = new THREE.Mesh(new THREE.CylinderGeometry(5.42, 5.42, 1.28, 32, 1, true, arcStart, arcSpan), fascia2Mat);
  fascia2Mesh.position.set(portX, 8.05, mainZ);
  dynamicG.add(fascia2Mesh);
  return { principalMicPos: principalMicWorldPos, isNearPrincipalMic, setPrincipalMicActive };
}

/* ============================================================================
 * 3. REAL-PHOTO 4-STORY ARCHED ACADEMIC BUILDING (EAST SIDE OF PLAYGROUND, FACING WEST!)
 *    & MODERN 6-STORY ACADEMIC BUILDING (NORTH RIGHT OF MAIN PORTICO, FACING SOUTH!)
 * ========================================================================== */

function buildAcademicBuildings(staticG, dynamicG, bank) {
  // A) REAL-PHOTO 4-STORY CREAM & DEEP-GREEN ARCHED ACADEMIC BUILDING
  //    Placed on the EAST edge of the Big Playground (x = 247.5, z = 96.5), rotated -90° to face WEST (-X) across the field!
  const b4StaticRoot = new THREE.Group();
  b4StaticRoot.position.set(247.5, 0, 96.5);
  b4StaticRoot.rotation.y = -Math.PI * 0.5;
  staticG.add(b4StaticRoot);
  const b4DynRoot = new THREE.Group();
  b4DynRoot.position.set(247.5, 0, 96.5);
  b4DynRoot.rotation.y = -Math.PI * 0.5;
  dynamicG.add(b4DynRoot);

  const b4x = 0;
  const b4z = 0;
  const b4H = 13.6;
  box(b4StaticRoot, [32.4, 0.48, 10.2], [b4x, 0.24, b4z], bank.stonePlinth);
  box(b4StaticRoot, [31.6, b4H, 9.2], [b4x, b4H * 0.5 + 0.44, b4z], bank.academicCream, { uvScale: 3.4 });
  box(b4StaticRoot, [32.2, 0.50, 9.8], [b4x, b4H + 0.66, b4z], bank.terracotta);
  box(b4StaticRoot, [31.8, 0.90, 0.26], [b4x, b4H + 1.32, b4z - 4.6], bank.academicCream);
  box(b4StaticRoot, [31.8, 0.90, 0.26], [b4x, b4H + 1.32, b4z + 4.6], bank.academicCream);
  box(b4StaticRoot, [5.0, 3.6, 5.8], [b4x - 12.8, b4H + 2.3, b4z], bank.academicCream);
  box(b4StaticRoot, [5.3, 0.28, 6.1], [b4x - 12.8, b4H + 4.18, b4z], bank.terracotta);
  cylinder(b4StaticRoot, 0.68, 0.72, 1.45, [b4x - 12.8, b4H + 5.02, b4z], bank.waterTank, 10);

  for (let fl = 0; fl < 4; fl++) {
    const fy = 0.48 + fl * 3.28;
    box(b4StaticRoot, [32.0, 0.24, 9.6], [b4x, fy + 3.14, b4z], bank.terracotta);
    for (let bx = -12.0; bx <= 12.1; bx += 3.0) {
      const bayX = b4x + bx;
      box(b4StaticRoot, [2.56, 2.22, 0.46], [bayX, fy + 1.78, b4z + 4.44], bank.emeraldDark);
      box(b4StaticRoot, [1.45, 1.24, 0.08], [bayX, fy + 1.72, b4z + 4.62], bank.warmWindowLit, { castShadow: false });
      addTrueArchSpandrel(b4StaticRoot, {
        span: 2.66,
        height: 0.72,
        depth: 0.24,
        archRise: 0.48,
        pos: [bayX, fy + 2.34, b4z + 4.60],
        rotY: 0,
        mat: bank.academicCream,
      });
      box(b4StaticRoot, [2.72, 0.80, 0.24], [bayX, fy + 0.48, b4z + 4.60], bank.academicCream);
      box(b4StaticRoot, [2.74, 0.14, 0.26], [bayX, fy + 0.90, b4z + 4.60], bank.emeraldMat);
    }
    for (let cx = -13.5; cx <= 13.6; cx += 3.0) {
      box(b4StaticRoot, [0.38, 3.28, 0.40], [b4x + cx, fy + 1.64, b4z + 4.60], bank.academicCream);
    }
  }
  box(b4StaticRoot, [6.8, 0.24, 2.0], [b4x - 10.6, 3.40, b4z + 5.35], bank.terracotta);
  addSignBox(
    b4DynRoot,
    bank,
    { title: 'খুলনা আলিয়া কামিল মাদ্রাসা · পূর্ব একাডেমিক ভবন', subtitle: 'দাখিল ও আলিম একাডেমিক ভবন · ৪-তলা ভবন', bg: '#0f3d2e', fg: '#ffffff', accent: '#fde047' },
    [b4x + 2.5, 4.35, b4z + 4.84],
    0,
    7.4,
    1.15,
    true
  );

  // B) MODERN 6-STORY WHITE & TERRACOTTA ACADEMIC BUILDING (North Right of Main Portico, x = 218.0, z = 61.5, facing SOUTH!)
  const b6x = 218.0;
  const b6z = 61.5;
  const b6H = 19.8;
  box(staticG, [35.4, 0.50, 10.8], [b6x, 0.25, b6z], bank.terracotta);
  box(staticG, [34.4, b6H, 9.8], [b6x, b6H * 0.5 + 0.45, b6z], bank.whitePlaster, { uvScale: 3.6 });
  box(staticG, [35.4, 0.72, 10.6], [b6x, b6H + 0.65, b6z], bank.terracotta);
  box(staticG, [5.4, 2.8, 4.8], [b6x, b6H + 2.1, b6z], bank.whitePlaster);
  cylinder(staticG, 0.68, 0.72, 1.45, [b6x + 9.2, b6H + 1.6, b6z], bank.waterTank, 10);

  for (let fl = 0; fl < 6; fl++) {
    const fy = 0.55 + fl * 3.2;
    box(staticG, [35.0, 0.26, 10.4], [b6x, fy + 3.05, b6z], bank.terracotta);
    box(staticG, [34.6, 0.94, 0.24], [b6x, fy + 0.56, b6z + 5.02], bank.whitePlaster);
    box(staticG, [34.6, 0.08, 0.26], [b6x, fy + 1.06, b6z + 5.02], bank.steelDark);
    for (let bx = -15.0; bx <= 15.0; bx += 3.0) {
      box(staticG, [2.30, 1.98, 0.36], [b6x + bx, fy + 1.92, b6z + 4.80], bank.cavityMat);
      if ((fl + Math.round(bx)) % 2 === 0) {
        box(staticG, [1.60, 1.35, 0.08], [b6x + bx, fy + 1.92, b6z + 4.94], bank.warmWindowLit, { castShadow: false });
      } else {
        box(staticG, [1.60, 1.35, 0.08], [b6x + bx, fy + 1.92, b6z + 4.94], bank.glassCurtain, { castShadow: false });
      }
    }
  }
  for (let cx = -16.5; cx <= 16.5; cx += 3.0) {
    box(staticG, [0.36, b6H + 0.4, 0.44], [b6x + cx, b6H * 0.5 + 0.45, b6z + 5.04], bank.terracotta);
  }
  addSignBox(
    dynamicG,
    bank,
    { title: 'খুলনা আলিয়া কামিল মাদ্রাসা', subtitle: 'নতুন ৬-তলা একাডেমিক ভবন · অনার্স ও কামিল বিভাগ', bg: '#065f46', fg: '#ffffff', accent: '#fde047', border: '#fde047' },
    [b6x, 7.9, b6z + 5.34],
    0,
    6.8,
    1.40,
    true
  );
}

// Model Mosque builder lives in ./khulna-model-mosque.js (buildKhulnaModelMosque3D)

/* ============================================================================
 * 5. GRAND EAST MAIN GATE (x = 231.5, INTERACTIVE [E]), BOUNDARY WALLS & POND GHAT
 * ========================================================================== */

function buildMainGateAndPondGhat(staticG, dynamicG, bank) {
  // Full 4-sided Central Pond embankment, Pukurpar promenade & twin stepped ghats live in alia-campus-blockout.js
}

/* ============================================================================
 * 6. MAIN EXPORTED CAMPUS BUILDER (WITH PHYSICS, 3 WALKABLE FLOORS & 60+ FPS)
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

export function buildAliaMadrasahDistrict(parent, m, waterHub = null) {
  const root = new THREE.Group();
  root.name = 'KhulnaLandmark_Alia';
  const staticG = new THREE.Group();
  const dynamicG = new THREE.Group();
  root.add(staticG, dynamicG);
  parent.add(root);

  const bank = createAliaMaterialBank(m);

  // 1) High-Graphics Central Play Ground (Real OSM Location: x = 197.5..234.5, z = 82.0..130.0 — 37m x 48m!)
  box(staticG, [37.6, 0.04, 48.6], [216.0, 0.012, 106.0], bank.grassTurf, { castShadow: false, uvScale: 18.0 });

  // GPU-Instanced Real 3D Durba Grass Clumps (ultra-fast 260 instances over the real Central Play Ground!)
  const grassLoader = createConfiguredGLTFLoader();
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
        map: srcMat?.map || null,
        color: srcMat?.map ? new THREE.Color(0xffffff) : (srcMat?.color ? srcMat.color.clone() : new THREE.Color(0x3f7d24)),
        roughness: 0.85,
        metalness: 0.0,
        side: THREE.DoubleSide,
      });
      clumpTemplates.push({ geom, mat });
    });
    if (!clumpTemplates.length) return;

    const rand = seeded(195201);
    const perClumpCount = 84;
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();

    for (let ci = 0; ci < clumpTemplates.length; ci++) {
      const { geom, mat } = clumpTemplates[ci];
      const inst = new THREE.InstancedMesh(geom, mat, perClumpCount);
      inst.castShadow = false;
      inst.receiveShadow = false;
      for (let i = 0; i < perClumpCount; i++) {
        const gx = 197.8 + rand() * 36.4;
        const gz = 82.4 + rand() * 47.2;
        dummy.position.set(gx, 0.02, gz);
        dummy.rotation.set((rand() - 0.5) * 0.06, rand() * Math.PI * 2, (rand() - 0.5) * 0.06);
        const sx = 1.65 + rand() * 0.75;
        const sy = 0.09 + rand() * 0.045;
        const sz = 1.65 + rand() * 0.75;
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
  }, undefined, (err) => {
    console.warn('Alia Madrasah grass_field GLB load warning:', err);
  });

  // 2) Grand 64m Main Walkable Portico Building (All 3 Floors Walkable!)
  const { principalMicPos, isNearPrincipalMic, setPrincipalMicActive } = buildMainPorticoBuilding(staticG, dynamicG, bank);

  // 3) 4-Story Arched Academic Building (North-West) & 6-Story Modern Academic Building (North)
  buildAcademicBuildings(staticG, dynamicG, bank);

  // 4) High-Graphics 3D Khulna District Model Mosque & Islamic Cultural Center (8K/4K PBR)
  buildKhulnaModelMosque3D(staticG, dynamicG, bank);

  // 5) Central Pond Brick Ghat + High-Graphics Campus Roads + SW Main Gate + Darwan Post + Walkable Etimkhana
  buildMainGateAndPondGhat(staticG, dynamicG, bank);
  const blockout = buildAliaCampusBlockoutAndRoads(staticG, dynamicG, bank, waterHub);
  const mainGate = blockout.swMainGate;
  let gateTarget = 1;
  let gateRatio = 1;
  mainGate.leftLeaf.rotation.y = gateRatio * (Math.PI * 0.46);
  mainGate.rightLeaf.rotation.y = -gateRatio * (Math.PI * 0.46);

  // 6) Stone Foundation Plaque & Flagpole placed cleanly in front of the Main Portico (flanking the straight gate axis x=184!)
  box(staticG, [2.2, 1.05, 1.0], [176.0, 0.52, 92.0], bank.stonePlinth);
  addSignBox(
    dynamicG,
    bank,
    { title: 'খুলনা আলিয়া কামিল মাদ্রাসা', subtitle: 'স্থাপিত: ২ এপ্রিল ১৯৫২ · খুলনা', bg: '#e5e7eb', fg: '#111827', accent: '#b94a38', border: '#475569' },
    [176.0, 1.08, 92.62],
    0,
    2.0,
    0.70,
    false
  );

  const flX = 192.0;
  const flZ = 92.0;
  box(staticG, [2.6, 0.26, 2.6], [flX, 0.13, flZ], bank.marbleWhite);
  box(staticG, [1.8, 0.24, 1.8], [flX, 0.38, flZ], bank.terracotta);
  cylinder(staticG, 0.06, 0.085, 9.6, [flX, 5.2, flZ], bank.chromeMat, 10);
  const flagPivot = new THREE.Group();
  flagPivot.position.set(flX, 9.35, flZ);
  box(flagPivot, [2.25, 1.35, 0.04], [1.12, 0, 0], bank.emeraldMat);
  const flagSun = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.40, 0.055, 18), bank.flowerRed);
  flagSun.rotation.x = Math.PI * 0.5;
  flagSun.position.set(0.98, 0, 0);
  flagPivot.add(flagSun);
  dynamicG.add(flagPivot);

  // Real 3D Upgraded Krishnachura (Royal Poinciana / Delonix regia) Trees (cleanly off the main road & gate corner!)
  const krishnaLoader = createConfiguredGLTFLoader();
  krishnaLoader.load(
    './assets/krishnachura_tree.glb',
    (gltf) => {
      const template = gltf.scene;
      template.updateMatrixWorld(true);
      const box3 = new THREE.Box3().setFromObject(template);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box3.getSize(size);
      box3.getCenter(center);

      template.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = false;
        child.receiveShadow = true;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const mat of mats) {
          if (!mat) continue;
          if (child.name.includes('Foliage') || mat.transparent || mat.alphaMap || (mat.name && mat.name.includes('Canopy')) || (mat.name && mat.name.includes('Atlas'))) {
            mat.transparent = false;
            mat.alphaTest = 0.32;
            mat.side = THREE.DoubleSide;
            mat.depthWrite = true;
            mat.roughness = 0.68;
            mat.metalness = 0.0;
          } else {
            mat.roughness = 0.88;
            mat.metalness = 0.0;
          }
          mat.needsUpdate = true;
        }
      });

      const baseH = Math.max(0.1, size.y);
      const placements = [
        // 1) South-West Corner outside Big Playground (clear of road & flower avenue)
        { x: 204.0, z: 132.5, targetH: 8.2, rotY: Math.PI * 0.45 },
        // 2) North-East Courtyard Corner near 6-Story Building
        { x: 237.5, z: 78.0, targetH: 8.2, rotY: Math.PI * 0.85 },
      ];

      mergeStaticMeshes(template);
      for (const p of placements) {
        const tree = template.clone(true);
        const s = p.targetH / baseH;
        tree.scale.setScalar(s);
        tree.rotation.y = p.rotY;
        tree.position.set(p.x, -box3.min.y * s, p.z);
        dynamicG.add(tree);
      }
    },
    undefined,
    (err) => {
      console.warn('Krishnachura tree GLB load warning:', err);
    }
  );

  // Subtle perimeter lamps only along the west road edge (ZERO benches or lamps inside the open football field!)
  for (const [lx, lz] of [
    [196.2, 82.0], [196.2, 106.0], [196.2, 130.0],
  ]) {
    addCampusLamp(staticG, dynamicG, bank, lx, lz, 4.4, 0.02);
  }

  mergeStaticMeshes(staticG);

  const maxDistSq = 260 * 260;

  function getGroundHeight(pos, grounded = true, verticalVelocity = 0) {
    if (!pos) return 0.0;
    const dx = pos.x - ALIA_CAMPUS_CENTER.x;
    const dz = pos.z - ALIA_CAMPUS_CENTER.z;
    if (dx * dx + dz * dz > 140 * 140) return 0.0;

    const footY = pos.y - 1.68;
    const maxStepUp = grounded ? 0.55 : (verticalVelocity > 0 ? 0.08 : 0.38);

    // 1) Grand 64m Main Building (rotated -90° at NW slot x = 131.8..196.2, z = 54.8..70.6, facing SOUTH!) — All 3 Floors + S-Stairs!
    const ml = mainWorldToLocalXZ(pos.x, pos.z);
    if (ml.x >= 176.8 && ml.x <= 192.6 && ml.z >= 75.8 && ml.z <= 140.2) {
      if (ml.x > 190.0 && ml.z >= 104.8 && ml.z <= 111.2 && footY < 1.5) {
        const rt = THREE.MathUtils.clamp((192.6 - ml.x) / 2.6, 0, 1);
        return rt * 0.50;
      }
      if (ml.x <= 190.1) {
        let bestY = 0.50;
        const inStairs = ml.x >= 177.5 && ml.x <= 186.4 && ml.z >= 104.7 && ml.z <= 111.3;
        if (inStairs) {
          for (const [yBot, yTop] of [[0.50, 4.20], [4.20, 7.90]]) {
            const yMid = (yBot + yTop) * 0.5;
            if (ml.x <= 179.8) {
              if (yMid <= footY + maxStepUp) bestY = Math.max(bestY, yMid);
            } else if (ml.z >= 108.0) {
              const t = THREE.MathUtils.clamp((186.2 - ml.x) / 6.4, 0, 1);
              const sy = yBot + t * (yMid - yBot);
              if (sy <= footY + maxStepUp) bestY = Math.max(bestY, sy);
            } else {
              const t = THREE.MathUtils.clamp((ml.x - 179.8) / 6.4, 0, 1);
              const sy = yMid + t * (yTop - yMid);
              if (sy <= footY + maxStepUp) bestY = Math.max(bestY, sy);
            }
          }
        } else {
          if (4.20 <= footY + maxStepUp) bestY = Math.max(bestY, 4.20);
          if (7.90 <= footY + maxStepUp) bestY = Math.max(bestY, 7.90);
        }
        return bestY;
      }
    }

    // 2) Covered Tin-Shed Pukur Ghat Platform & Stepped Entry into Clean Bathing Pond (x = 194.0..203.2, z = 150.0..161.0)
    if (pos.x >= 194.0 && pos.x <= 203.2 && pos.z >= 150.0 && pos.z <= 161.0) {
      if (pos.x <= 199.8) return 0.22;
      const st = THREE.MathUtils.clamp((pos.x - 199.8) / 3.2, 0, 1);
      return 0.22 * (1.0 - st);
    }

    // 3) Khulna District Model Mosque 3-Level Walkable Interior & Grand Staircase
    const mosqueY = getModelMosqueGroundHeight(pos, grounded, verticalVelocity);
    if (mosqueY > 0) return mosqueY;
    return 0.0;
  }

  function applyCollisions(pos, radius = 0.34, footY = 0, isVehicle = false) {
    if (!pos) return;
    const dx = pos.x - ALIA_CAMPUS_CENTER.x;
    const dz = pos.z - ALIA_CAMPUS_CENTER.z;
    if (dx * dx + dz * dz > 140 * 140) return;

    // 0) Grand 64m Main Building Interior & Exterior Collisions (transformed into -90° rotated NW local frame!)
    const ml = mainWorldToLocalXZ(pos.x, pos.z);
    if (ml.x >= 175.8 && ml.x <= 192.0 && ml.z >= 75.0 && ml.z <= 141.0 && footY < 11.4) {
      resolveCircleAABB(ml, radius, 176.6, 177.25, 75.8, 140.2); // North back wall
      resolveCircleAABB(ml, radius, 176.8, 190.2, 75.6, 76.25);  // East end wall
      resolveCircleAABB(ml, radius, 176.8, 190.2, 139.75, 140.4); // West end wall
      if (footY > 3.2) {
        resolveCircleAABB(ml, radius, 189.65, 190.15, 76.0, 140.0); // South balcony railing on 2nd & 3rd floor
      }
      for (const [z0, z1] of [
        [76.0, 79.8], [81.9, 89.2], [91.3, 98.7], [100.8, 104.5],
        [111.5, 115.2], [117.3, 124.7], [126.8, 134.1], [136.2, 140.0],
      ]) {
        resolveCircleAABB(ml, radius, 186.50, 186.80, z0, z1);
      }
      for (const divZ of [85.5, 95.0, 104.5, 111.5, 121.0, 130.5]) {
        resolveCircleAABB(ml, radius, 177.1, 186.65, divZ - 0.15, divZ + 0.15);
      }
      const mw = mainLocalToWorldXZ(ml.x, ml.z);
      pos.x = mw.x;
      pos.z = mw.z;
    }

    // 1) 6-Story North Academic Building (x = 200.2..235.8, z = 56.1..66.9 — RIGHT of Main Portico!)
    if (footY < 20.5) {
      resolveCircleAABB(pos, radius, 200.2, 235.8, 56.1, 66.9);
    }
    // 2) 4-Story East Arched Academic Building (x = 242.4..252.6, z = 80.3..112.7 — East of Big Playground!)
    if (footY < 14.5) {
      resolveCircleAABB(pos, radius, 242.4, 252.6, 80.3, 112.7);
    }
    // 3) South-West Khan Jahan Ali Rd Main Gate & Demo Blockout Building Collisions
    if (footY < 2.8 && gateRatio < 0.55) {
      resolveCircleAABB(pos, radius, mainGate.gx - 4.5, mainGate.gx + 4.5, mainGate.gz - 0.35, mainGate.gz + 0.35);
    }
    if (footY < 6.0) {
      resolveCircleAABB(pos, radius, mainGate.gx - 6.0, mainGate.gx - 4.4, mainGate.gz - 0.8, mainGate.gz + 0.8);
      resolveCircleAABB(pos, radius, mainGate.gx + 4.4, mainGate.gx + 6.0, mainGate.gz - 0.8, mainGate.gz + 0.8);
    }
    for (let i = 0; i < blockout.demoColliders.length; i++) {
      const c = blockout.demoColliders[i];
      if (footY < c.maxY) resolveCircleAABB(pos, radius, c.minX, c.maxX, c.minZ, c.maxZ);
    }

    // 4) Khulna District Model Mosque 3D Collisions (delegated to khulna-model-mosque.js)
    applyModelMosqueCollisions(pos, radius, footY, isVehicle);

    // 5) Krishnachura Tree Trunks inside Campus (clean corners well off main entrance axis)
    if (footY < 6.0) {
      for (const [tx, tz] of [
        [204.0, 132.5], [237.5, 78.0],
      ]) {
        resolveCircleAABB(pos, radius, tx - 0.42, tx + 0.42, tz - 0.42, tz + 0.42);
      }
    }
  }

  function getNearbyPrompt(pos) {
    if (!pos) return null;
    const mosquePrompt = getModelMosquePrompt(pos);
    if (mosquePrompt) return mosquePrompt;
    if (pos.y <= 3.2 && Math.hypot(pos.x - mainGate.gx, pos.z - mainGate.gz) < 6.0) {
      return gateTarget > 0.5 ? '[E] Close Alia Madrasah Main Gate' : '[E] Open Alia Madrasah Main Gate';
    }
    return null;
  }

  function toggleGate(pos) {
    if (!pos) return false;
    if (toggleModelMosqueDoor(pos)) return true;
    if (pos.y <= 3.2 && Math.hypot(pos.x - mainGate.gx, pos.z - mainGate.gz) < 6.5) {
      gateTarget = gateTarget > 0.5 ? 0 : 1;
      return true;
    }
    return false;
  }

  let lastUpdateTime = 0;

  return {
    root,
    getGroundHeight,
    applyCollisions,
    getNearbyPrompt,
    toggleGate,
    getModelMosqueZoneName,
    isInsideModelMosque,
    isInModelMosqueZone,
    findNearestModelMosqueSeat,
    principalMicPos,
    isNearPrincipalMic,
    setPrincipalMicActive,
    setNightFactor(nightFactor = 0) {
      const nf = THREE.MathUtils.clamp(nightFactor, 0, 1);
      for (let i = 0; i < bank.emissiveList.length; i++) {
        const item = bank.emissiveList[i];
        item.mat.emissiveIntensity = item.day + (item.night - item.day) * nf;
      }
      setModelMosqueNightFactor(nf);
    },
    syncVisibility(playerPos) {
      if (!playerPos) return;
      const dx = playerPos.x - ALIA_CAMPUS_CENTER.x;
      const dz = playerPos.z - ALIA_CAMPUS_CENTER.z;
      const want = dx * dx + dz * dz <= maxDistSq;
      if (root.visible !== want) root.visible = want;
    },
    update(time, playerPos = null, dt = null) {
      if (playerPos) this.syncVisibility(playerPos);
      if (!root.visible) return;
      const stepDt = typeof dt === 'number'
        ? dt
        : (lastUpdateTime > 0 ? Math.min(0.05, Math.max(0.001, time - lastUpdateTime)) : 0.016);
      lastUpdateTime = time;
      flagPivot.rotation.y = Math.sin(time * 2.2) * 0.18 + Math.cos(time * 1.1) * 0.08;
      if (Math.abs(gateRatio - gateTarget) > 0.002) {
        gateRatio += (gateTarget - gateRatio) * Math.min(1, stepDt * 4.5);
        mainGate.leftLeaf.rotation.y = gateRatio * (Math.PI * 0.46);
        mainGate.rightLeaf.rotation.y = -gateRatio * (Math.PI * 0.46);
      }
      updateModelMosque(stepDt, playerPos);
    },
  };
}
