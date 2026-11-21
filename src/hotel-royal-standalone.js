import * as THREE from 'three';
import { box, cylinder, rodBetween } from './scene-utils.js';
import { attachDerivedPBRMaps } from './aaa-shaders.js';

/**
 * HOTEL ROYAL INTERNATIONAL, KHULNA — STANDALONE 2026 RENOVATED WALKABLE 3D MODEL
 * (A-33 KDA Avenue / Khan Jahan Ali Road, Royal Mor, Khulna · Est. 1986)
 *
 * Built 1:1 from 2026 walkthrough video (BMcurDBYm1M) & official photography:
 *  - EXTERIOR: 3-story curved beige concrete podium + recessed dark-green glass +
 *    glossy black curved entrance canopy with glowing 3D RED-WHITE "HOTEL ROYAL" letters & glass railing +
 *    stone-cladded blue-mosaic outdoor cascading fountain + accordion gate + HERLAN corner showroom +
 *    6-row radial rooftop terrace garden + 10-story cream/taupe main tower with vertical gold
 *    "HOTEL ROYAL" sign, cantilevered KDA Avenue balconies & rooftop telecom masts.
 *  - GROUND FLOOR (y = 0.25m): Walkable 2026 Reception Lobby (glossy cream marble floor, curved LED coffered ceiling,
 *    3D white geometric wall + curved gold velvet tufted sofa, wooden reception desk + laser-cut jaali pillars,
 *    backlit wood louver slats + Chesterfield sofas, curved slate/blue-mosaic indoor fountain,
 *    black laser-cut Royal Bengal Tiger screen with red eyes, etched palm-leaf stainless elevator,
 *    black-granite staircase backed by hammered-gold 3D metallic feature wall).
 *  - 2ND FLOOR (y = 4.05m): Walkable Sapphire Restaurant (crisscrossing geometric coffered ceiling,
 *    vertical wood-slat wall, granite buffet counter with juice dispenser, toaster & chafing dishes,
 *    6 formal carved-wood dining table sets overlooking the curved panoramic glass).
 *  - 3RD FLOOR (y = 7.85m): Walkable Guest Floor Corridor (cream tiles + mahogany bumper rail + lift + stairs)
 *    and 3 Fully Furnished Guest Rooms including Room 303 Royal Standard Suite (cherry-mahogany headboard,
 *    double + single bed, full-height TV panel, split AC, ceiling fan, brown curtains, mahogany wardrobe +
 *    red mini-fridge + mirror desk + kettle/tea set + modern white-tiled attached bathroom).
 */

function seeded(seed = 1986) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function addRotBox(parent, size, pos, mat, rotY = 0, opts = {}) {
  const mesh = box(parent, size, pos, mat, opts);
  if (rotY) mesh.rotation.y = rotY;
  return mesh;
}

/* ============================================================================
 * PROCEDURAL PHOTO-MATCHED PBR TEXTURES (EXTERIOR + 2026 RENOVATED INTERIOR)
 * ========================================================================== */

function makePanelizedConcreteTex(baseHex = '#d1c4af', seedVal = 301) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4800; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(28,24,18,0.055)';
    ctx.fillRect(rnd() * 512, rnd() * 512, 2 + rnd() * 3, 2 + rnd() * 3);
  }
  ctx.strokeStyle = 'rgba(42,36,28,0.28)';
  ctx.lineWidth = 2;
  for (let x = 0; x < 512; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeMarbleTileTex(baseHex = '#f5f1e8', groutHex = '#d5cec0', seedVal = 402) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);
  // Subtle cream marble veining
  ctx.strokeStyle = 'rgba(182, 168, 146, 0.22)';
  for (let i = 0; i < 24; i++) {
    ctx.lineWidth = 1 + rnd() * 2.5;
    ctx.beginPath();
    const x0 = rnd() * 512;
    const y0 = rnd() * 512;
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(x0 + 80, y0 + (rnd() - 0.5) * 90, x0 + 160, y0 + (rnd() - 0.5) * 90, x0 + 240, y0 + (rnd() - 0.5) * 60);
    ctx.stroke();
  }
  ctx.strokeStyle = groutHex;
  ctx.lineWidth = 2;
  for (let p = 0; p < 512; p += 128) {
    ctx.beginPath();
    ctx.moveTo(p, 0); ctx.lineTo(p, 512);
    ctx.moveTo(0, p); ctx.lineTo(512, p);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function make3DGeometricReliefTex() {
  // White 3D diamond geometric wall behind the curved gold lobby sofa (video 00:23-00:25!)
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f2efe9';
  ctx.fillRect(0, 0, 256, 256);
  const step = 32;
  for (let y = 0; y < 256; y += step) {
    for (let x = 0; x < 256; x += step) {
      const cx = x + step * 0.5;
      const cy = y + step * 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx, y); ctx.lineTo(x + step, cy); ctx.lineTo(cx, cy); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#dad3c7';
      ctx.beginPath();
      ctx.moveTo(x + step, cy); ctx.lineTo(cx, y + step); ctx.lineTo(cx, cy); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e8e3da';
      ctx.beginPath();
      ctx.moveTo(x, cy); ctx.lineTo(cx, y); ctx.lineTo(cx, cy); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#cbc3b6';
      ctx.beginPath();
      ctx.moveTo(x, cy); ctx.lineTo(cx, y + step); ctx.lineTo(cx, cy); ctx.closePath();
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 2.5);
  tex.anisotropy = 8;
  return tex;
}

function makeStoneWallTex() {
  // Grey stacked-stone cladding on outdoor fountain wall (video 00:00-00:12!)
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  const rnd = seeded(9912);
  ctx.fillStyle = '#474c52';
  ctx.fillRect(0, 0, 512, 512);
  const rows = 16;
  const rh = 512 / rows;
  for (let r = 0; r < rows; r++) {
    let x = -rnd() * 40;
    while (x < 512) {
      const w = 48 + rnd() * 72;
      const v = 108 + Math.floor(rnd() * 68);
      ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
      ctx.fillRect(x + 2, r * rh + 2, w - 4, rh - 4);
      x += w;
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeBlueMosaicTex() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(3301);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, 256, 256);
  const cols = ['#0284c7', '#0369a1', '#38bdf8', '#0ea5e9', '#1d4ed8', '#7dd3fc'];
  for (let y = 0; y < 256; y += 16) {
    for (let x = 0; x < 256; x += 16) {
      ctx.fillStyle = cols[Math.floor(rnd() * cols.length)];
      ctx.fillRect(x + 1.5, y + 1.5, 13, 13);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  return tex;
}

function makePaverDrivewayTex() {
  // Red-and-grey interlocking pavers outside entrance (video 00:12-00:22)
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  const rnd = seeded(5101);
  ctx.fillStyle = '#525252';
  ctx.fillRect(0, 0, 512, 512);
  const step = 32;
  for (let y = 0; y < 512; y += step) {
    for (let x = 0; x < 512; x += step) {
      const isRed = ((x / step) + (y / step)) % 2 === 0;
      if (isRed) {
        const R = 172 + Math.floor(rnd() * 24);
        ctx.fillStyle = `rgb(${R}, 74, 62)`;
      } else {
        const g = 148 + Math.floor(rnd() * 24);
        ctx.fillStyle = `rgb(${g}, ${g}, ${g + 2})`;
      }
      ctx.fillRect(x + 2, y + 2, step - 4, step - 4);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeHammeredGoldTex() {
  // Shimmering 3D hammered-gold metallic staircase feature wall (video 00:36-00:38!)
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(7979);
  ctx.fillStyle = '#c49635';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 420; i++) {
    const x = rnd() * 256;
    const y = rnd() * 256;
    const r = 6 + rnd() * 14;
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, rnd() > 0.4 ? '#fce07a' : '#8a6214');
    g.addColorStop(1, 'rgba(196,150,53,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

function makeTigerJaaliTex() {
  // Iconic black laser-cut Royal Bengal Tiger face screen with glowing red eyes (video 00:39-00:40!)
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f8f4ec'; // backlit warm white behind laser-cut screen
  ctx.fillRect(0, 0, 512, 512);

  // Outer black metal frame & geometric branches
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 18;
  ctx.strokeRect(10, 10, 492, 492);
  ctx.lineWidth = 10;
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(ang) * 140, 256 + Math.sin(ang) * 140);
    ctx.lineTo(256 + Math.cos(ang) * 260, 256 + Math.sin(ang) * 260);
    ctx.stroke();
  }
  // Stylized Tiger Head Silhouette & Stripes
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(256, 256, 155, 0, Math.PI * 2);
  ctx.fill();
  // Ears
  ctx.beginPath(); ctx.arc(146, 138, 42, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(366, 138, 42, 0, Math.PI * 2); ctx.fill();
  // Cutout white stripes across tiger face
  ctx.fillStyle = '#f8f4ec';
  ctx.beginPath(); ctx.ellipse(256, 305, 62, 46, 0, 0, Math.PI * 2); ctx.fill();
  for (const [sx, sy, rw, rh, rot] of [
    [176, 210, 36, 12, 0.3], [336, 210, 36, 12, -0.3],
    [164, 258, 42, 12, 0.1], [348, 258, 42, 12, -0.1],
    [256, 152, 16, 48, 0], [220, 162, 14, 38, -0.25], [292, 162, 14, 38, 0.25],
  ]) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(rot);
    ctx.fillRect(-rw * 0.5, -rh * 0.5, rw, rh);
    ctx.restore();
  }
  // Black nose & fierce mouth
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.moveTo(234, 286); ctx.lineTo(278, 286); ctx.lineTo(256, 314); ctx.closePath();
  ctx.fill();
  // Glowing Red Tiger Eyes!
  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.ellipse(205, 232, 18, 10, 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(307, 232, 18, 10, -0.18, 0, Math.PI * 2); ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeElevatorDoorTex() {
  // Brushed stainless steel with etched botanical palm-leaf lines (video 00:34 & 00:41!)
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, '#9ca3af');
  g.addColorStop(0.5, '#e5e7eb');
  g.addColorStop(1, '#9ca3af');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 512);
  // Center door seam
  ctx.fillStyle = '#374151';
  ctx.fillRect(126, 0, 4, 512);
  // Etched curved palm fronds
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    ctx.moveTo(128, 512);
    ctx.quadraticCurveTo(40 + i * 16, 260 - i * 12, (i % 2 === 0 ? 10 : 246), 60 + i * 24);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeBlackCanopyHotelRoyalTex() {
  // 2026 Renovated Glossy Black Curved Canopy with glowing 3D Red-White "HOTEL ROYAL" (video 00:13-00:21!)
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 192;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#090b10';
  ctx.fillRect(0, 0, 1024, 192);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 1016, 184);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 94px "Manrope", "Arial Black", sans-serif';
  // Glowing red outer stroke + crisp bright-red/white lettering
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#ef4444';
  ctx.fillText('HOTEL ROYAL', 512, 98);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeText('HOTEL ROYAL', 512, 98);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeCurvedRimBannerTex() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 96;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 1024, 96);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 42px "Manrope", "Segoe UI", sans-serif';
  ctx.fillStyle = '#292524';
  ctx.fillText('HOTEL ROYAL INTERNATIONAL LIMITED', 515, 52);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('HOTEL ROYAL INTERNATIONAL LIMITED', 512, 48);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeVerticalGoldHotelRoyalTex() {
  const c = document.createElement('canvas');
  c.width = 160;
  c.height = 768;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ece9e0';
  ctx.fillRect(0, 0, 160, 768);
  const letters = ['H', 'O', 'T', 'E', 'L', ' ', 'R', 'O', 'Y', 'A', 'L'];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 58px "Manrope", "Segoe UI", sans-serif';
  const step = 680 / letters.length;
  for (let i = 0; i < letters.length; i++) {
    if (letters[i] === ' ') continue;
    const y = 48 + (i + 0.5) * step;
    ctx.fillStyle = '#7f1d1d';
    ctx.fillText(letters[i], 84, y + 4);
    ctx.fillStyle = '#facc15';
    ctx.fillText(letters[i], 80, y);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeSignPlateTex(text, sub = '', bg = '#1e293b', fg = '#facc15') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 144;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 144);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 132);
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 42px "Manrope", "Noto Sans Bengali", sans-serif';
  ctx.fillText(text, 256, sub ? 54 : 72, 470);
  if (sub) {
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 22px "Manrope", sans-serif';
    ctx.fillText(sub, 256, 106, 470);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ============================================================================
 * REUSABLE INTERIOR FURNITURE HELPERS
 * ========================================================================== */

function addCeilingFan(parent, mats, x, y, z) {
  cylinder(parent, 0.06, 0.08, 0.08, [x, y - 0.04, z], mats.whiteWall, 10);
  cylinder(parent, 0.02, 0.02, 0.36, [x, y - 0.22, z], mats.chrome, 8);
  cylinder(parent, 0.14, 0.14, 0.08, [x, y - 0.42, z], mats.whiteWall, 12);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    addRotBox(parent, [0.56, 0.016, 0.11], [x + Math.cos(a) * 0.38, y - 0.42, z + Math.sin(a) * 0.38], mats.whiteWall, -a);
  }
}

function addTuftedSofa(parent, mats, x, y, z, length = 3.2, rotY = 0) {
  const sg = new THREE.Group();
  sg.position.set(x, y, z);
  sg.rotation.y = rotY;
  // Wood base plinth
  box(sg, [length, 0.14, 0.88], [0, 0.07, 0], mats.mahogany);
  // Plush tufted champagne-gold seat cushion & tall diamond-tufted backrest
  box(sg, [length - 0.08, 0.28, 0.84], [0, 0.28, 0.02], mats.goldVelvet);
  box(sg, [length, 0.92, 0.20], [0, 0.72, -0.34], mats.goldVelvet);
  // Rolled Chesterfield armrests
  for (const sx of [-length * 0.5 + 0.12, length * 0.5 - 0.12]) {
    box(sg, [0.22, 0.52, 0.86], [sx, 0.42, 0], mats.goldVelvet);
  }
  parent.add(sg);
}

function addDiningTableSet(parent, mats, x, y, z) {
  // White-and-black clothed table + centerpiece vase + 4 carved wood oval-back beige chairs (Sapphire Restaurant!)
  box(parent, [1.55, 0.06, 1.05], [x, y + 0.76, z], mats.whiteWall);
  box(parent, [1.58, 0.22, 1.08], [x, y + 0.64, z], mats.blackGloss);
  cylinder(parent, 0.08, 0.12, 0.68, [x, y + 0.34, z], mats.mahogany, 8);
  cylinder(parent, 0.06, 0.04, 0.22, [x, y + 0.90, z], mats.goldTrim, 8);
  for (const [cx, cz, ry] of [
    [-0.95, 0, Math.PI * 0.5], [0.95, 0, -Math.PI * 0.5],
    [0, -0.78, 0], [0, 0.78, Math.PI],
  ]) {
    const cg = new THREE.Group();
    cg.position.set(x + cx, y, z + cz);
    cg.rotation.y = ry;
    box(cg, [0.46, 0.08, 0.46], [0, 0.45, 0], mats.goldVelvet);
    box(cg, [0.46, 0.58, 0.07], [0, 0.78, -0.20], mats.mahogany);
    box(cg, [0.34, 0.44, 0.09], [0, 0.78, -0.19], mats.goldVelvet);
    for (const [lx, lz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) {
      box(cg, [0.05, 0.44, 0.05], [lx, 0.22, lz], mats.mahogany);
    }
    parent.add(cg);
  }
}

/**
 * Fully Furnished Hotel Royal Standard Guest Room (1:1 from 2026 video Room 303!):
 * Cherry-mahogany full-width headboard, Queen + Single beds, opposite mahogany TV panel + flat TV,
 * split AC, ceiling fan, brown curtains, mahogany wardrobe + red mini-fridge + mirror desk + kettle,
 * leather armchair & coffee table, plus attached white-tiled modern bathroom!
 */
function addRoyalGuestRoom(parent, mats, x0, y, z0, roomW, roomD, roomNum = '303') {
  const cx = x0 + roomW * 0.5;
  const cz = z0 + roomD * 0.5;

  // 1) Cherry-Mahogany Full-Width Headboard along West/Back wall + Queen Bed & Single Bed!
  box(parent, [0.10, 1.32, roomD - 1.2], [x0 + 0.12, y + 0.72, cz], mats.mahogany);
  // Double Bed
  box(parent, [2.15, 0.34, 1.78], [x0 + 1.22, y + 0.17, z0 + 1.45], mats.mahogany);
  box(parent, [2.05, 0.24, 1.68], [x0 + 1.22, y + 0.45, z0 + 1.45], mats.crispWhite);
  box(parent, [0.42, 0.16, 0.68], [x0 + 0.45, y + 0.64, z0 + 1.05], mats.crispWhite);
  box(parent, [0.42, 0.16, 0.68], [x0 + 0.45, y + 0.64, z0 + 1.85], mats.crispWhite);
  // Bedside Table + Landline Phone + Tissue Box
  box(parent, [0.48, 0.54, 0.52], [x0 + 0.42, y + 0.27, z0 + 2.68], mats.mahogany);
  box(parent, [0.22, 0.10, 0.20], [x0 + 0.42, y + 0.59, z0 + 2.58], mats.blackGloss);
  box(parent, [0.14, 0.09, 0.22], [x0 + 0.42, y + 0.59, z0 + 2.80], mats.herlanRed);
  // Single Bed beside it (matching Room 303!)
  box(parent, [2.15, 0.34, 1.10], [x0 + 1.22, y + 0.17, z0 + 3.60], mats.mahogany);
  box(parent, [2.05, 0.24, 1.02], [x0 + 1.22, y + 0.45, z0 + 3.60], mats.crispWhite);
  box(parent, [0.42, 0.16, 0.66], [x0 + 0.45, y + 0.64, z0 + 3.60], mats.crispWhite);

  // Framed Floral Wall Art above headboard
  box(parent, [0.05, 0.72, 0.58], [x0 + 0.08, y + 1.95, z0 + 1.5], mats.mahogany);
  box(parent, [0.06, 0.58, 0.44], [x0 + 0.09, y + 1.95, z0 + 1.5], mats.goldVelvet);

  // 2) Opposite Full-Height Cherry-Mahogany TV Wall Panel + Flat-Screen Smart TV (video 01:09-01:10!)
  const eastX = x0 + roomW - 0.14;
  box(parent, [0.10, 3.35, 1.75], [eastX, y + 1.68, z0 + 2.05], mats.mahogany);
  box(parent, [0.07, 0.78, 1.28], [eastX - 0.08, y + 1.78, z0 + 2.05], mats.blackGloss);

  // 3) Mahogany Wardrobe + Red Mini-Fridge + Mirror Dressing/Study Desk + Rolling Chair + Kettle (video 01:23-01:42!)
  const winZ = z0 + roomD - 0.22;
  box(parent, [0.85, 2.35, 0.65], [x0 + 0.55, y + 1.18, winZ - 0.42], mats.mahogany);
  box(parent, [0.76, 0.82, 0.68], [x0 + 0.55, y + 0.42, winZ - 0.42], mats.herlanRed); // Red Mini-Fridge!
  box(parent, [1.25, 0.76, 0.58], [x0 + 1.65, y + 0.38, winZ - 0.40], mats.mahogany); // Dressing/study desk
  box(parent, [1.10, 1.18, 0.05], [x0 + 1.65, y + 1.42, winZ - 0.12], mats.mirror);   // Mirror
  cylinder(parent, 0.08, 0.09, 0.22, [x0 + 1.45, y + 0.88, winZ - 0.40], mats.cyanKettle, 10); // Electric kettle
  // Rolling Office Chair
  box(parent, [0.48, 0.08, 0.48], [x0 + 1.65, y + 0.46, winZ - 1.05], mats.darkLeather);
  box(parent, [0.46, 0.46, 0.08], [x0 + 1.65, y + 0.74, winZ - 1.26], mats.darkLeather);
  cylinder(parent, 0.04, 0.04, 0.44, [x0 + 1.65, y + 0.22, winZ - 1.05], mats.blackGloss, 8);

  // Leather Accent Chair + Round Coffee Table near Street-View Window
  cylinder(parent, 0.38, 0.36, 0.52, [eastX - 1.35, y + 0.26, winZ - 0.85], mats.darkLeather, 14);
  box(parent, [0.68, 0.42, 0.68], [eastX - 0.65, y + 0.21, winZ - 0.85], mats.darkLeather);
  // Dark Brown Curtains framing window
  box(parent, [0.48, 2.35, 0.12], [x0 + 2.45, y + 1.48, winZ - 0.08], mats.brownCurtain);
  box(parent, [0.48, 2.35, 0.12], [eastX - 0.35, y + 1.48, winZ - 0.08], mats.brownCurtain);

  // 4) Split AC Unit + Ceiling Fan + Ceiling Downlights
  box(parent, [1.12, 0.30, 0.24], [cx, y + 2.85, winZ - 0.16], mats.acUnit);
  addCeilingFan(parent, mats, cx, y + 3.45, cz - 0.2);

  // 5) Attached Modern White-Tiled Bathroom (Back-Right Corner of Room — video 02:22-02:38!)
  const bx = eastX - 1.05;
  const bz = z0 + 0.85;
  box(parent, [1.85, 0.04, 1.55], [bx, y + 0.02, bz], mats.concrete);
  // White commode + pedestal wash basin + mirror
  box(parent, [0.42, 0.44, 0.56], [bx + 0.55, y + 0.22, bz - 0.35], mats.crispWhite);
  box(parent, [0.42, 0.42, 0.22], [bx + 0.55, y + 0.62, bz - 0.54], mats.crispWhite);
  cylinder(parent, 0.24, 0.14, 0.82, [bx - 0.48, y + 0.41, bz - 0.45], mats.crispWhite, 12);
  box(parent, [0.68, 0.82, 0.04], [bx - 0.48, y + 1.48, bz - 0.68], mats.mirror);

  // Room Number Plate on Corridor Door Frame
  const plateTex = makeSignPlateTex(roomNum, 'ROYAL STANDARD', '#1e293b', '#f8fafc');
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.22),
    new THREE.MeshBasicMaterial({ map: plateTex, side: THREE.DoubleSide }),
  );
  plate.position.set(cx, y + 1.78, z0 - 0.14);
  plate.rotation.y = Math.PI;
  parent.add(plate);
}

/* ============================================================================
 * MAIN STANDALONE BUILDER: buildHotelRoyalStandalone3D()
 * ========================================================================== */

export function buildHotelRoyalStandalone3D() {
  const root = new THREE.Group();
  root.name = 'HotelRoyalInternational_Khulna_2026';

  const exteriorG = new THREE.Group();
  exteriorG.name = 'ExteriorShell';
  const interiorG = new THREE.Group();
  interiorG.name = 'WalkableInterior';
  const towerG = new THREE.Group();
  towerG.name = 'Upper10StoryTower';
  root.add(exteriorG, interiorG, towerG);

  // --- Photo-Matched High-Res PBR Materials ---
  const concreteTex = makePanelizedConcreteTex('#cfc2ac', 301);
  const marbleTex = makeMarbleTileTex('#f5f1e8', '#d5cec0', 402);
  const reliefTex = make3DGeometricReliefTex();
  const stoneTex = makeStoneWallTex();
  const mosaicTex = makeBlueMosaicTex();
  const paverTex = makePaverDrivewayTex();
  const goldHammerTex = makeHammeredGoldTex();
  const tigerTex = makeTigerJaaliTex();
  const elevTex = makeElevatorDoorTex();

  const podiumConcMat = new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.72, metalness: 0.04 });
  attachDerivedPBRMaps(podiumConcMat, concreteTex, { strength: 2.0, roughBase: 0.72, normalScale: 0.68 });

  const marbleFloorMat = new THREE.MeshPhysicalMaterial({ map: marbleTex, roughness: 0.16, metalness: 0.04, clearcoat: 0.82 });
  const reliefWallMat = new THREE.MeshStandardMaterial({ map: reliefTex, roughness: 0.45, metalness: 0.04 });
  attachDerivedPBRMaps(reliefWallMat, reliefTex, { strength: 2.4, roughBase: 0.45, normalScale: 0.85 });

  const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.86, metalness: 0.04 });
  attachDerivedPBRMaps(stoneMat, stoneTex, { strength: 2.2, roughBase: 0.86, normalScale: 0.78 });

  const paverMat = new THREE.MeshStandardMaterial({ map: paverTex, roughness: 0.78, metalness: 0.04 });
  const mosaicMat = new THREE.MeshPhysicalMaterial({ map: mosaicTex, roughness: 0.22, clearcoat: 0.75 });
  const hammeredGoldMat = new THREE.MeshPhysicalMaterial({ map: goldHammerTex, roughness: 0.26, metalness: 0.88, clearcoat: 0.55 });

  const mats = {
    podiumConc: podiumConcMat,
    towerWhite: new THREE.MeshStandardMaterial({ color: 0xece9e0, roughness: 0.68, metalness: 0.03 }),
    towerTaupe: new THREE.MeshStandardMaterial({ color: 0xbcae97, roughness: 0.74, metalness: 0.03 }),
    marbleFloor: marbleFloorMat,
    whiteWall: new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.76 }),
    crispWhite: new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.82 }),
    espressoCeiling: new THREE.MeshStandardMaterial({ color: 0x221712, roughness: 0.68 }),
    warmWood: new THREE.MeshPhysicalMaterial({ color: 0x8b4c24, roughness: 0.42, clearcoat: 0.35 }),
    mahogany: new THREE.MeshPhysicalMaterial({ color: 0x5c1f1a, roughness: 0.36, clearcoat: 0.45 }),
    goldVelvet: new THREE.MeshStandardMaterial({ color: 0xd4b270, roughness: 0.86 }),
    goldTrim: new THREE.MeshPhysicalMaterial({ color: 0xf5b82e, roughness: 0.22, metalness: 0.90 }),
    blackGloss: new THREE.MeshPhysicalMaterial({ color: 0x0c0e14, roughness: 0.18, metalness: 0.25, clearcoat: 0.92 }),
    blackGranite: new THREE.MeshPhysicalMaterial({ color: 0x16181e, roughness: 0.18, metalness: 0.14, clearcoat: 0.82 }),
    slateWall: new THREE.MeshStandardMaterial({ color: 0x2d343c, roughness: 0.78 }),
    darkLeather: new THREE.MeshStandardMaterial({ color: 0x2b1d18, roughness: 0.55 }),
    brownCurtain: new THREE.MeshStandardMaterial({ color: 0x452b20, roughness: 0.92 }),
    herlanRed: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.42 }),
    redCarpet: new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.94 }),
    cyanKettle: new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.25, clearcoat: 0.65 }),
    acUnit: new THREE.MeshStandardMaterial({ color: 0xeff3f7, roughness: 0.38 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.85 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xdce3ec, roughness: 0.16, metalness: 0.92 }),
    mirror: new THREE.MeshPhysicalMaterial({ color: 0xdbeafe, roughness: 0.04, metalness: 0.92, clearcoat: 1.0 }),
    greenGlass: new THREE.MeshPhysicalMaterial({
      color: 0x164240,
      roughness: 0.06,
      metalness: 0.20,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
    }),
    clearGlass: new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      roughness: 0.05,
      metalness: 0.10,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.26,
      side: THREE.DoubleSide,
    }),
    waterBlue: new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      roughness: 0.08,
      metalness: 0.10,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.82,
    }),
    ledWarm: new THREE.MeshStandardMaterial({ color: 0xfff7dc, emissive: 0xffd782, emissiveIntensity: 1.85, roughness: 0.2 }),
    ledWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf8fafc, emissiveIntensity: 1.65, roughness: 0.2 }),
    foliage: new THREE.MeshStandardMaterial({ color: 0x1f6b32, roughness: 0.85 }),
    terracotta: new THREE.MeshStandardMaterial({ color: 0xb4533c, roughness: 0.82 }),
    blueDrum: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.45 }),
    reliefWall: reliefWallMat,
    stoneWall: stoneMat,
    mosaic: mosaicMat,
    paver: paverMat,
    hammeredGold: hammeredGoldMat,
    tigerJaali: new THREE.MeshStandardMaterial({ map: tigerTex, emissive: 0xffffff, emissiveMap: tigerTex, emissiveIntensity: 0.35 }),
    elevDoor: new THREE.MeshStandardMaterial({ map: elevTex, roughness: 0.24, metalness: 0.82 }),
  };

  /* ==========================================================================
   * 1. EXTERIOR FORECOURT, STONE CASCADING FOUNTAIN, ACCORDION GATE & HERLAN SHOWROOM
   * ======================================================================== */
  // Paved Forecourt Platform
  box(exteriorG, [44.0, 0.16, 40.0], [0, -0.08, 2.0], mats.paver, { uvScale: 8.0, castShadow: false });

  // Stone-Cladded Cascading Blue-Mosaic Outdoor Fountain (Left of Entrance — video 00:00-00:12!)
  box(exteriorG, [6.2, 1.45, 1.4], [-7.4, 0.72, 13.8], mats.stoneWall, { uvScale: 2.0 });
  box(exteriorG, [5.6, 0.52, 1.15], [-7.4, 0.26, 14.9], mats.stoneWall);
  box(exteriorG, [5.2, 0.36, 0.86], [-7.4, 0.36, 14.9], mats.mosaic);
  box(exteriorG, [5.0, 0.06, 0.78], [-7.4, 0.56, 14.9], mats.waterBlue);
  // White stone centerpiece plaque behind fountain
  box(exteriorG, [2.4, 1.95, 0.28], [-7.4, 1.42, 13.8], mats.crispWhite);
  // Expandable Stainless-Steel Accordion Security Gate (video 00:00-00:08)
  for (let i = 0; i < 9; i++) {
    cylinder(exteriorG, 0.03, 0.03, 1.65, [-11.8 + i * 0.42, 0.84, 15.6], mats.chrome, 6);
  }
  // Red-and-White Entrance Safety Bollards (video 00:12-00:21)
  for (let bx = -4.2; bx <= 4.2; bx += 1.4) {
    if (Math.abs(bx) < 2.2) continue;
    cylinder(exteriorG, 0.11, 0.11, 0.35, [bx, 0.18, 12.6], mats.herlanRed, 8);
    cylinder(exteriorG, 0.11, 0.11, 0.22, [bx, 0.46, 12.6], mats.crispWhite, 8);
  }

  // Adjacent Red "HERLAN NEW YORK" Corner Showroom (Left of Stone Wall — video 00:01-00:08!)
  box(exteriorG, [5.8, 3.85, 5.2], [-13.6, 1.92, 11.2], mats.herlanRed);
  const herlanTex = makeSignPlateTex('HERLAN', 'NEW YORK · AUTHENTIC COSMETICS', '#dc2626', '#ffffff');
  const herlanSign = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 1.25),
    new THREE.MeshBasicMaterial({ map: herlanTex }),
  );
  herlanSign.position.set(-13.6, 3.15, 13.84);
  exteriorG.add(herlanSign);

  /* ==========================================================================
   * 2. HOLLOW 3-STORY CURVED BEIGE PODIUM SHELL (EXTERIOR + WALKABLE FLOORS!)
   *    Floors: Ground y0 = 0.25m, 2nd y1 = 4.05m, 3rd y2 = 7.85m, Roof y3 = 11.65m
   * ======================================================================== */
  const R_OUT = 13.2;
  const R_COL = 12.6;
  const R_GLASS = 11.85;
  const ARC_START = -Math.PI * 0.56;
  const ARC_END = Math.PI * 0.56;
  const SEGS = 20;
  const stepAng = (ARC_END - ARC_START) / SEGS;
  const floorYs = [0.25, 4.05, 7.85, 11.65];

  // Solid Walkable Interior Floor Slabs for Ground, 2nd, 3rd & Rooftop (with stairwell cutouts on 2nd & 3rd!)
  // Ground Floor Full Marble Slab
  const gfShape = new THREE.Shape();
  gfShape.absarc(0, 0, R_OUT, -Math.PI * 0.5, Math.PI * 0.5, false);
  gfShape.lineTo(-12.5, 13.2);
  gfShape.lineTo(-12.5, -13.2);
  gfShape.closePath();
  // Clean rectangular + semicircular floor plates
  box(interiorG, [24.0, 0.26, 20.0], [0, 0.12, 0.0], mats.marbleFloor, { uvScale: 6.0 });
  cylinder(interiorG, R_OUT - 0.1, R_OUT - 0.1, 0.26, [0, 0.12, 0], mats.marbleFloor, 32);

  // 2nd Floor Slab (y = 4.05m) & 3rd Floor Slab (y = 7.85m) — with stairwell opening at x = -4.2..-0.4, z = -9.5..-3.5!
  for (const fy of [4.05, 7.85]) {
    box(interiorG, [24.0, 0.24, 15.5], [0, fy - 0.12, 4.2], mats.marbleFloor, { uvScale: 5.0 });
    box(interiorG, [8.2, 0.24, 6.2], [-8.0, fy - 0.12, -6.5], mats.marbleFloor, { uvScale: 2.5 });
    box(interiorG, [12.4, 0.24, 6.2], [5.8, fy - 0.12, -6.5], mats.marbleFloor, { uvScale: 3.0 });
    cylinder(interiorG, R_GLASS + 0.1, R_GLASS + 0.1, 0.22, [0, fy - 0.12, 0], mats.marbleFloor, 32);
  }
  // Podium Rooftop Slab (y = 11.65m)
  box(exteriorG, [24.6, 0.30, 21.0], [0, 11.50, 0.0], mats.concrete);
  cylinder(exteriorG, R_OUT - 0.15, R_OUT - 0.15, 0.30, [0, 11.50, 0], mats.concrete, 32);

  // Back & Side Structural Perimeter Walls of the 3-Story Podium
  box(exteriorG, [24.4, 11.6, 0.38], [0, 5.8, -9.8], mats.podiumConc);
  box(exteriorG, [0.38, 11.6, 20.0], [-12.2, 5.8, 0.0], mats.podiumConc);
  box(exteriorG, [0.38, 11.6, 20.0], [12.2, 5.8, 0.0], mats.podiumConc);

  // Iconic Curved Facade: Horizontal Concrete Slabs + Recessed Transparent Dark-Green Glass + Columns + AC Units!
  for (let i = 0; i < SEGS; i++) {
    const a0 = ARC_START + i * stepAng;
    const am = a0 + stepAng * 0.5;
    const sinA = Math.sin(am);
    const cosA = Math.cos(am);

    for (let fl = 0; fl < floorYs.length; fl++) {
      const fy = floorYs[fl];
      const slabH = fl === 0 ? 0.32 : (fl === 3 ? 0.88 : 0.72);
      const slabD = 2.4;
      const rMid = R_OUT - slabD * 0.5;
      const segW = rMid * stepAng + 0.16;
      addRotBox(exteriorG, [segW, slabH, slabD], [sinA * rMid, fy, cosA * rMid], mats.podiumConc, am, { uvScale: 1.5 });
      addRotBox(exteriorG, [segW + 0.04, 0.10, 0.22], [sinA * (R_OUT + 0.04), fy + slabH * 0.44, cosA * (R_OUT + 0.04)], mats.towerWhite, am);
    }

    // Recessed Curved Dark-Green Glass on Floors 1, 2 & 3 (Leave wide open entrance doorway on Ground Floor center!)
    const glassW = R_GLASS * stepAng + 0.06;
    for (let fl = 0; fl < 3; fl++) {
      if (fl === 0 && Math.abs(am) < 0.28) continue; // Wide open frameless glass lobby entrance!
      const yBot = floorYs[fl] + 0.26;
      const yTop = floorYs[fl + 1] - 0.34;
      const gh = yTop - yBot;
      const gy = (yBot + yTop) * 0.5;
      addRotBox(exteriorG, [glassW, gh, 0.10], [sinA * R_GLASS, gy, cosA * R_GLASS], mats.greenGlass, am, { castShadow: false });
      for (const mOff of [-0.25, 0.25]) {
        const ma = am + mOff * stepAng;
        addRotBox(exteriorG, [0.06, gh, 0.16], [Math.sin(ma) * (R_GLASS + 0.03), gy, Math.cos(ma) * (R_GLASS + 0.03)], mats.chrome, ma);
      }
    }

    // Slender Square Concrete Columns
    if (i % 2 === 0 || i === SEGS - 1) {
      const colA = i === SEGS - 1 ? a0 + stepAng : a0;
      addRotBox(exteriorG, [0.38, 11.6, 0.42], [Math.sin(colA) * R_COL, 5.8, Math.cos(colA) * R_COL], mats.podiumConc, colA);
    }

    // Exterior Split-AC Compressor Units on 2nd & 3rd floor ledges (video 00:08-00:21)
    if (i >= 2 && i <= SEGS - 3 && i % 2 === 1) {
      for (const acY of [4.75, 8.55]) {
        addRotBox(exteriorG, [0.76, 0.50, 0.34], [sinA * (R_COL - 0.05), acY, cosA * (R_COL - 0.05)], mats.acUnit, am);
      }
    }
  }

  // Curved Top Rim Sign: "HOTEL ROYAL INTERNATIONAL LIMITED" (video 00:09-00:21!)
  const rimTex = makeCurvedRimBannerTex();
  const rimMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(R_OUT + 0.12, R_OUT + 0.12, 0.82, 28, 1, true, -0.92, 1.84),
    new THREE.MeshStandardMaterial({ map: rimTex, transparent: true, emissive: 0xffffff, emissiveMap: rimTex, emissiveIntensity: 0.25 }),
  );
  rimMesh.position.y = 11.68;
  exteriorG.add(rimMesh);

  // 2026 RENOVATED GLOSSY BLACK CURVED ENTRANCE CANOPY + GLOWING RED "HOTEL ROYAL" + GLASS BALUSTRADE (video 00:12-00:21!)
  box(exteriorG, [8.4, 0.62, 4.2], [0, 3.92, 13.6], mats.podiumConc);
  box(exteriorG, [8.5, 1.15, 0.24], [0, 4.42, 15.62], mats.blackGloss);
  const blackSignTex = makeBlackCanopyHotelRoyalTex();
  const blackSign = new THREE.Mesh(
    new THREE.PlaneGeometry(8.2, 1.05),
    new THREE.MeshStandardMaterial({ map: blackSignTex, emissive: 0xffffff, emissiveMap: blackSignTex, emissiveIntensity: 0.85 }),
  );
  blackSign.position.set(0, 4.42, 15.76);
  exteriorG.add(blackSign);
  // Glass canopy upper balustrade + recessed canopy soffit downlights
  box(exteriorG, [8.2, 1.05, 0.08], [0, 4.75, 15.48], mats.clearGlass);
  for (const cx of [-3.8, 3.8]) box(exteriorG, [0.46, 3.72, 0.46], [cx, 1.86, 15.2], mats.podiumConc);
  for (const lx of [-2.4, 0, 2.4]) {
    cylinder(exteriorG, 0.16, 0.16, 0.05, [lx, 3.58, 13.8], mats.ledWhite, 10);
  }
  // Automatic Frameless Double Glass Entrance Doors (ajar/open so you can walk right in!) + Red Welcome Mat
  box(interiorG, [2.6, 0.025, 1.8], [0, 0.27, 11.6], mats.redCarpet);
  box(interiorG, [1.35, 2.75, 0.06], [-2.15, 1.65, 11.6], mats.clearGlass);
  box(interiorG, [1.35, 2.75, 0.06], [2.15, 1.65, 11.6], mats.clearGlass);

  /* ==========================================================================
   * 3. GROUND FLOOR (y = 0.25m): 2026 RENOVATED RECEPTION LOBBY (video 00:23-00:40!)
   * ======================================================================== */
  const y0 = 0.25;
  // Dark Espresso Coffered Ceiling with Bright Linear White LED Strips
  box(interiorG, [23.6, 0.14, 21.0], [0, 3.82, 0.8], mats.espressoCeiling);
  for (const lx of [-5.5, 0, 5.5]) {
    box(interiorG, [0.42, 0.06, 16.5], [lx, 3.74, 1.8], mats.ledWhite, { castShadow: false });
  }

  // Central Wood-Clad Square Pillar with Sleek White LED Strip (video 00:28!)
  box(interiorG, [0.76, 3.55, 0.76], [1.2, y0 + 1.78, 5.2], mats.warmWood);
  box(interiorG, [0.10, 3.45, 0.05], [1.2, y0 + 1.78, 5.60], mats.ledWhite);

  // LEFT SIDE: 3D White Geometric Diamond Relief Wall + Long Curved Champagne-Gold Tufted Sofa (video 00:23-00:25!)
  box(interiorG, [0.22, 3.55, 8.8], [-11.85, y0 + 1.78, 4.4], mats.reliefWall);
  addTuftedSofa(interiorG, mats, -10.85, y0, 4.4, 5.8, Math.PI * 0.5);

  // LEFT-BACK: Warm Wooden Reception Counter + Backlit Sign + Computers + Decorative Jaali Pillars (video 00:28-00:29!)
  box(interiorG, [1.15, 1.12, 6.2], [-9.2, y0 + 0.56, -3.0], mats.warmWood);
  box(interiorG, [1.25, 0.08, 6.35], [-9.2, y0 + 1.14, -3.0], mats.marbleFloor);
  box(interiorG, [0.16, 0.42, 0.62], [-9.4, y0 + 1.38, -2.0], mats.blackGloss); // Reception monitor
  box(interiorG, [0.16, 0.42, 0.62], [-9.4, y0 + 1.38, -4.0], mats.blackGloss);
  const recTex = makeSignPlateTex('RECEPTION', 'HOTEL ROYAL INTERNATIONAL LTD.', '#3b1f14', '#facc15');
  const recSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 1.05),
    new THREE.MeshStandardMaterial({ map: recTex, emissive: 0xffffff, emissiveMap: recTex, emissiveIntensity: 0.55 }),
  );
  recSign.position.set(-11.8, y0 + 2.35, -3.0);
  recSign.rotation.y = Math.PI * 0.5;
  interiorG.add(recSign);

  // RIGHT SIDE: Vertical Backlit Wooden Louver Slats + Tufted Chesterfield Sofas (video 00:27, 00:31-00:33!)
  for (let lz = -3.2; lz <= 7.8; lz += 0.68) {
    box(interiorG, [0.24, 3.55, 0.14], [11.6, y0 + 1.78, lz], mats.warmWood);
  }
  box(interiorG, [0.06, 3.4, 11.4], [11.9, y0 + 1.78, 2.3], mats.ledWarm); // Warm golden backlight behind wood louvers!
  addTuftedSofa(interiorG, mats, 9.6, y0, 4.8, 3.4, -Math.PI * 0.5);
  addTuftedSofa(interiorG, mats, 9.6, y0, 0.2, 3.4, -Math.PI * 0.5);
  box(interiorG, [0.85, 0.44, 1.5], [7.8, y0 + 0.22, 2.5], mats.marbleFloor);

  // BACK CENTER: Curved Dark Slate-Grey Indoor Water Fountain with Blue-Mosaic Rim & Warm Underglow (video 00:29-00:32!)
  cylinder(interiorG, 2.55, 2.55, 3.55, [0.2, y0 + 1.78, -5.8], mats.slateWall, 24);
  cylinder(interiorG, 3.25, 3.25, 0.58, [0.2, y0 + 0.29, -5.8], mats.mosaic, 24);
  cylinder(interiorG, 3.05, 3.05, 0.06, [0.2, y0 + 0.56, -5.8], mats.waterBlue, 24);
  cylinder(interiorG, 3.30, 3.30, 0.08, [0.2, y0 + 0.06, -5.8], mats.ledWarm, 24);

  // ICONIC BLACK LASER-CUT ROYAL BENGAL TIGER JAALI SCREEN WITH RED EYES (video 00:39-00:40!)
  box(interiorG, [3.6, 2.85, 0.14], [6.6, y0 + 1.48, -6.8], mats.warmWood);
  const tigerMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 2.65), mats.tigerJaali);
  tigerMesh.position.set(6.6, y0 + 1.48, -6.70);
  interiorG.add(tigerMesh);

  // BRUSHED STAINLESS-STEEL ETCHED PALM-LEAF ELEVATOR (Ground, 2nd & 3rd Floors — video 00:34 & 00:41!)
  for (const fy of [0.25, 4.05, 7.85]) {
    box(interiorG, [1.75, 2.45, 0.12], [-6.8, fy + 1.22, -9.55], mats.chrome);
    const elevMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 2.28), mats.elevDoor);
    elevMesh.position.set(-6.8, fy + 1.15, -9.47);
    interiorG.add(elevMesh);
    box(interiorG, [1.85, 0.025, 1.15], [-6.8, fy + 0.015, -8.8], mats.redCarpet);
  }

  // GRAND BLACK-GRANITE STAIRCASE + SHIMMERING 3D HAMMERED-GOLD FEATURE WALL (Climbs Ground -> 2nd -> 3rd!)
  box(interiorG, [0.16, 11.2, 6.4], [-4.2, 5.8, -6.6], mats.hammeredGold); // Hammered-gold metallic accent wall!
  const buildStairFlight = (yBot, yTop) => {
    const yMid = (yBot + yTop) * 0.5;
    const steps = 10;
    // Lower half flight going -Z
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const sz = THREE.MathUtils.lerp(-3.6, -8.2, t);
      const sy = THREE.MathUtils.lerp(yBot, yMid, (i + 1) / steps);
      box(interiorG, [1.75, 0.22, 0.48], [-3.2, sy - 0.11, sz], mats.blackGranite);
    }
    // Mid landing
    box(interiorG, [3.6, 0.22, 1.45], [-2.3, yMid - 0.11, -8.9], mats.blackGranite);
    // Upper half flight going +Z
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const sz = THREE.MathUtils.lerp(-8.2, -3.6, t);
      const sy = THREE.MathUtils.lerp(yMid, yTop, (i + 1) / steps);
      box(interiorG, [1.75, 0.22, 0.48], [-1.4, sy - 0.11, sz], mats.blackGranite);
    }
    rodBetween(interiorG, [-2.3, yBot + 0.92, -3.6], [-2.3, yMid + 0.92, -8.2], 0.035, mats.chrome);
    rodBetween(interiorG, [-2.3, yMid + 0.92, -8.2], [-2.3, yTop + 0.92, -3.6], 0.035, mats.chrome);
  };
  buildStairFlight(0.25, 4.05);
  buildStairFlight(4.05, 7.85);

  /* ==========================================================================
   * 4. 2ND FLOOR (y = 4.05m): SAPPHIRE RESTAURANT (Photo-Matched!)
   * ======================================================================== */
  const y1 = 4.05;
  // Geometric White-and-Black Crisscrossing Coffered Ceiling with Warm LED Coves
  box(interiorG, [23.6, 0.14, 21.0], [0, y1 + 3.60, 0.8], mats.espressoCeiling);
  for (let cx = -9; cx <= 9; cx += 4.5) {
    box(interiorG, [0.36, 0.22, 18.0], [cx, y1 + 3.48, 1.2], mats.crispWhite);
    box(interiorG, [0.12, 0.06, 17.5], [cx + 0.24, y1 + 3.44, 1.2], mats.ledWarm);
  }
  for (let cz = -6; cz <= 8; cz += 4.5) {
    box(interiorG, [21.0, 0.22, 0.36], [0, y1 + 3.48, cz], mats.crispWhite);
  }

  // Right Side: Vertical Wooden-Slat Feature Wall + Granite-Top Buffet Counter + Juice Dispenser & Toaster!
  for (let lz = -5.0; lz <= 7.0; lz += 0.42) {
    box(interiorG, [0.14, 3.5, 0.12], [11.6, y1 + 1.75, lz], mats.warmWood);
  }
  box(interiorG, [1.35, 0.98, 9.2], [9.4, y1 + 0.49, 1.2], mats.blackGranite);
  box(interiorG, [1.45, 0.08, 9.4], [9.4, y1 + 1.00, 1.2], mats.concrete);
  // Stainless-steel Juice Dispenser, Toaster & 3 Silver Buffet Chafing Dishes
  box(interiorG, [0.55, 0.62, 0.88], [9.4, y1 + 1.34, 4.2], mats.goldTrim);
  box(interiorG, [0.48, 0.42, 0.52], [9.4, y1 + 1.24, 2.4], mats.chrome);
  for (const cz of [0.6, -1.0, -2.6]) {
    box(interiorG, [0.52, 0.28, 0.72], [9.4, y1 + 1.18, cz], mats.chrome);
  }
  const restSignTex = makeSignPlateTex('SAPPHIRE RESTAURANT', 'MULTI-CUISINE DINING & BREAKFAST BUFFET', '#1e293b', '#facc15');
  const restSign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 1.1),
    new THREE.MeshBasicMaterial({ map: restSignTex }),
  );
  restSign.position.set(11.4, y1 + 2.55, 1.2);
  restSign.rotation.y = -Math.PI * 0.5;
  interiorG.add(restSign);

  // Horizontally-Slatted Wood Columns + 6 Formal Carved-Wood Dining Table Sets!
  for (const [px, pz] of [[-5.5, 4.5], [3.5, 4.5], [-5.5, -1.5], [3.5, -1.5]]) {
    box(interiorG, [0.72, 3.55, 0.72], [px, y1 + 1.78, pz], mats.warmWood);
  }
  for (const [tx, tz] of [[-8.2, 6.2], [-2.0, 7.6], [4.2, 7.6], [-8.2, 1.5], [-1.5, 2.4], [4.8, 2.4]]) {
    addDiningTableSet(interiorG, mats, tx, y1, tz);
  }

  /* ==========================================================================
   * 5. 3RD FLOOR (y = 7.85m): GUEST CORRIDOR + 3 FULL FURNISHED GUEST ROOMS (ROOM 303!)
   * ======================================================================== */
  const y2 = 7.85;
  // Wide Cream-Tiled Corridor running East-West at z = -3.4..-0.2 with Mahogany Bumper Rail (video 00:44-00:57!)
  box(interiorG, [23.8, 0.24, 0.14], [0, y2 + 1.10, -3.5], mats.mahogany);
  // Corridor-to-Rooms Partition Wall at z = 0.0 (with 3 wide open doorways into Rooms 301, 302, 303!)
  for (const [x0, x1] of [[-12.0, -9.2], [-7.2, -1.0], [1.0, 7.2], [9.2, 12.0]]) {
    box(interiorG, [x1 - x0, 3.55, 0.22], [(x0 + x1) * 0.5, y2 + 1.78, 0.0], mats.whiteWall);
    box(interiorG, [x1 - x0, 0.22, 0.26], [(x0 + x1) * 0.5, y2 + 1.10, 0.0], mats.mahogany);
  }
  // Room Divider Walls separating 301 | 302 | 303
  box(interiorG, [0.22, 3.55, 9.2], [-4.0, y2 + 1.78, 4.6], mats.whiteWall);
  box(interiorG, [0.22, 3.55, 9.2], [4.0, y2 + 1.78, 4.6], mats.whiteWall);
  // Corridor ceiling LED panel lights
  for (const lx of [-8.0, 0.0, 8.0]) {
    box(interiorG, [0.65, 0.06, 0.65], [lx, y2 + 3.52, -1.8], mats.ledWhite);
  }

  // 3 Fully Furnished Walkable Guest Rooms!
  addRoyalGuestRoom(interiorG, mats, -11.8, y2, 0.15, 7.6, 8.4, '301');
  addRoyalGuestRoom(interiorG, mats, -3.8, y2, 0.15, 7.6, 9.6, '303'); // Hero Center Suite (Room 303!)
  addRoyalGuestRoom(interiorG, mats, 4.2, y2, 0.15, 7.6, 8.4, '302');

  /* ==========================================================================
   * 6. PODIUM ROOFTOP: 6-ROW RADIAL TERRACE GARDEN (y = 11.65m)
   * ======================================================================== */
  const roofY = 11.65;
  for (let i = 0; i < SEGS; i++) {
    const am = ARC_START + (i + 0.5) * stepAng;
    const segW = R_OUT * stepAng + 0.12;
    addRotBox(exteriorG, [segW, 0.85, 0.24], [Math.sin(am) * (R_OUT - 0.12), roofY + 0.42, Math.cos(am) * (R_OUT - 0.12)], mats.podiumConc, am);
  }
  const rndG = seeded(2077);
  for (const ra of [-0.90, -0.50, -0.12, 0.24, 0.62, 0.98]) {
    for (let p = 0; p < 5; p++) {
      const dist = 4.6 + p * 1.5;
      const px = Math.sin(ra) * dist;
      const pz = Math.cos(ra) * dist;
      cylinder(exteriorG, 0.24, 0.18, 0.38, [px, roofY + 0.19, pz], p % 2 === 0 ? mats.terracotta : mats.crispWhite, 7);
      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42 + rndG() * 0.18, 1), mats.foliage);
      bush.position.set(px, roofY + 0.58, pz);
      exteriorG.add(bush);
    }
  }

  /* ==========================================================================
   * 7. 10-STORY HOTEL ROYAL MAIN TOWER (LEFT-REAR WING, y = 0..34.2m)
   * ======================================================================== */
  const twX = -9.6;
  const twZ = -13.4;
  const twW = 14.2;
  const twD = 16.5;
  const twH = 33.6;

  box(towerG, [twW, twH, twD], [twX, twH * 0.5, twZ], mats.towerTaupe, { uvScale: 3.0 });
  // Signature Bright Off-White Front Left Panel + Vertical Gold "HOTEL ROYAL" Signage!
  box(towerG, [6.4, twH + 0.2, 0.34], [twX - twW * 0.5 + 3.2, twH * 0.5, twZ + twD * 0.5 + 0.12], mats.towerWhite);
  const vGoldTex = makeVerticalGoldHotelRoyalTex();
  const vGoldMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 16.5),
    new THREE.MeshStandardMaterial({ map: vGoldTex, emissive: 0xffe066, emissiveMap: vGoldTex, emissiveIntensity: 0.28 }),
  );
  vGoldMesh.position.set(twX - twW * 0.5 + 3.2, twH - 9.4, twZ + twD * 0.5 + 0.32);
  towerG.add(vGoldMesh);

  // Upper Tower Front Windows + Cantilevered Left KDA Avenue Balconies (Floors 4–10)
  for (let f = 4; f <= 10; f++) {
    const fy = 11.4 + (f - 4) * 3.1;
    // Front 2 recessed window columns
    box(towerG, [1.65, 1.95, 0.24], [twX + 1.2, fy + 1.5, twZ + twD * 0.5 + 0.08], mats.greenGlass);
    box(towerG, [2.55, 1.75, 0.24], [twX + 4.3, fy + 1.5, twZ + twD * 0.5 + 0.08], mats.greenGlass);
    // Left KDA Avenue cantilevered balcony slab + parapet
    box(towerG, [1.55, 0.24, twD - 1.2], [twX - twW * 0.5 - 0.72, fy, twZ], mats.towerWhite);
    box(towerG, [0.18, 0.92, twD - 1.2], [twX - twW * 0.5 - 1.42, fy + 0.52, twZ], mats.towerWhite);
  }

  // Rooftop Parapet, Stairhead & 3 Cellular Telecom Antenna Masts with Microwave Dishes
  box(towerG, [twW + 0.4, 1.15, twD + 0.4], [twX, twH + 0.58, twZ], mats.towerTaupe);
  box(towerG, [6.2, 3.2, 6.4], [twX + 2.4, twH + 2.2, twZ + 2.2], mats.towerTaupe);
  for (const [mx, mz, mh] of [[twX + 1.0, twZ + 3.2, 5.4], [twX + 4.2, twZ + 1.8, 6.0], [twX + 2.6, twZ - 0.6, 4.8]]) {
    cylinder(towerG, 0.09, 0.14, mh, [mx, twH + 3.6 + mh * 0.5, mz], mats.chrome, 6);
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 10), mats.crispWhite);
    dish.rotation.x = Math.PI * 0.5;
    dish.position.set(mx, twH + 3.6 + mh - 0.8, mz + 0.26);
    towerG.add(dish);
  }

  return {
    root,
    exteriorG,
    interiorG,
    towerG,
    setCutaway(enabled) {
      // Hides outer front curved podium shell & upper tower so user can inspect all 3 walkable interior floors cleanly!
      exteriorG.visible = !enabled;
      towerG.visible = !enabled;
    },
  };
}
