import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { box, cylinder, rodBetween } from './scene-utils.js';
import { attachDerivedPBRMaps } from './aaa-shaders.js';
import { decorateCorridorPole } from './khulna-street-props.js';
import { buildCNGAuto, buildEasybike } from './khulna-vehicles.js';
import { buildHotelRoyalComplex } from './hotel-royal-complex.js';

/**
 * ROYAL MORE / CHINGRI CHATTAR (খুলনা রয়্যালের মোড় · চিংড়ি চত্বর)
 * Photo-Accurate High-Detail Rebuild from Royal-Mor-Visual-Guide (22.810253 N, 89.562292 E)
 * World center: (-716.8, -291.8) | +X = East, -Z = North
 *
 * Authentic Real-World Landmarks & Streetscape:
 *   1. Chingri Chattar Dual-Boundary Island: Black-and-yellow raised outer curb, broad paved apron,
 *      tan masonry brick basin, steel tubular railing, greenish reflective water, individual white-tiled
 *      pedestals with wet waterline, 3 blue-green Golda Prawns, full central mast & 3-sided triangular
 *      billboard truss with illuminated Khulna billboards.
 *   2. KDA Avenue Tiger Median: Separate black-and-yellow striped fenced median west of the shrimp
 *      island featuring the sculpted Royal Bengal Tiger monument.
 *   3. Hotel Royal International (WNW Corner): Iconic 3-story semicircular curved podium with cream
 *      horizontal bands, curved dark glass ribbons, AC housings, rooftop terrace garden, pale boundary
 *      wall & black entrance gate, 9-story cream tower, and red HERLAN (A-33) corner showroom.
 *   4. Hotel Castle Salam (SSE Corner): Iconic dusty-pink structural frame, reflective blue glazing,
 *      recessed balconies, dark soffit canopy with white cursive "Hotel Castle Salam" script over
 *      green-tinted entrance glass, plus adjacent pink retail row (Samsung, Xiaomi & rooftop billboard).
 *   5. Real Dated Storefronts: Rajdhani Fabrics Khulna, Satkhira Adi Jadob Ghosh Dairy (54 Khan Jahan
 *      Ali Rd — yellow Bengali sign, corrugated awning, glass sweet case), JOBAIR'S & DMC red-balcony
 *      block, TVS Showroom, Rosh Mohol Sweetmeat, Jam Jam Misti Ghar, Raj Mithai, Fatima Hospital,
 *      and the 6-counter Royal More Bus Strip + 2 parked AC coaches.
 *   6. Performance & Physics: 100% Solid Collisions, Walkable Raised Footpaths (0.16m, zero sinking),
 *      static geometry merging (single draw call per material) & distance culling for locked 60+ FPS.
 */

export const ROYAL_MORE_CENTER = { x: -716.8, z: -291.8 };

function seeded(seed = 2026) {
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
  italic = false,
  align = 'left',
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
  grad.addColorStop(1, 'rgba(0,0,0,0.24)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, width - 12, height - 12);
  }
  if (accent && align === 'left') {
    ctx.fillStyle = accent;
    ctx.fillRect(16, 16, 10, height - 32);
  }

  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.textAlign = align;
  const tx = align === 'center' ? width * 0.5 : 40;
  const fontStyle = italic ? 'italic bold' : 'bold';
  const fontFamily = italic
    ? '"Brush Script MT", "Georgia", "Times New Roman", serif'
    : '"Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.font = `${fontStyle} ${italic ? 48 : 34}px ${fontFamily}`;
  ctx.fillText(title, tx, subtitle ? height * 0.39 : height * 0.52, width - 56);
  if (subtitle) {
    ctx.fillStyle = accent || fg;
    ctx.font = '600 20px "Manrope", "Noto Sans Bengali", sans-serif';
    ctx.fillText(subtitle, tx, height * 0.74, width - 56);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeBillboardArtTexture(variant = 0) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 384;
  const ctx = c.getContext('2d');

  if (variant === 0) {
    // Khulna Royal More / Padma Bridge Nagad-style vibrant blue-red billboard (matches S08)
    const g = ctx.createLinearGradient(0, 0, 0, 384);
    g.addColorStop(0, '#0284c7');
    g.addColorStop(0.55, '#0f4c81');
    g.addColorStop(1, '#1e293b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 384);
    // Stylized cable-stayed bridge diagonal lines
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(140, 85);
      ctx.lineTo(30 + i * 52, 340);
      ctx.stroke();
    }
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(385, 225, 68, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 34px "Noto Sans Bengali", sans-serif';
    ctx.fillText('স্বপ্নের যোগাযোগ · খুলনা', 256, 52);
    ctx.font = 'bold 42px "Noto Sans Bengali", sans-serif';
    ctx.fillText('নগদ', 385, 238);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 24px "Manrope", sans-serif';
    ctx.fillText('ROYAL MORE · KHULNA CITY', 256, 356);
  } else if (variant === 1) {
    // Bold corporate telecom / smartphone billboard (matches S02/S01)
    const g = ctx.createLinearGradient(0, 0, 512, 384);
    g.addColorStop(0, '#0f172a');
    g.addColorStop(0.5, '#1d4ed8');
    g.addColorStop(1, '#0284c7');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 384);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(24, 24, 464, 14);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 46px "Manrope", sans-serif';
    ctx.fillText('KHULNA DIGITAL', 256, 130);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 34px "Noto Sans Bengali", sans-serif';
    ctx.fillText('রয়্যাল মোড় · চিংড়ি চত্বর', 256, 205);
    ctx.fillStyle = '#e0f2fe';
    ctx.font = '600 24px "Noto Sans Bengali", sans-serif';
    ctx.fillText('খুলনা সিটি কর্পোরেশন · স্বাগতম', 256, 290);
  } else {
    // Vibrant red-gold consumer brand billboard (matches B03 / S08 AKS / BPL vibe)
    const g = ctx.createLinearGradient(0, 0, 0, 384);
    g.addColorStop(0, '#991b1b');
    g.addColorStop(0.6, '#b91c1c');
    g.addColorStop(1, '#450a0a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 384);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(0, 290);
    ctx.lineTo(512, 235);
    ctx.lineTo(512, 384);
    ctx.lineTo(0, 384);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 54px "Manrope", sans-serif';
    ctx.fillText('KHULNA STEEL', 256, 135);
    ctx.font = 'bold 30px "Noto Sans Bengali", sans-serif';
    ctx.fillText('মজবুত নির্মাণের বিশ্বস্ত সঙ্গী', 256, 202);
    ctx.fillStyle = '#7f1d1d';
    ctx.font = 'bold 28px "Manrope", sans-serif';
    ctx.fillText('ROYAL MORE · KDA AVENUE', 256, 336);
  }

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 504, 376);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeVerticalTowerSignTexture(text = 'HOTEL ROYAL INTERNATIONAL', bg = '#1e3a5f', fg = '#fef08a') {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 128, 512);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6;
  ctx.strokeRect(5, 5, 118, 502);
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 22px "Manrope", sans-serif';
  const chars = text.replace(/\s+/g, ' ').split('');
  const step = 468 / Math.max(1, chars.length);
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], 64, 24 + (i + 0.5) * step);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makePlasterTexture(baseHex, seedVal = 401, { subtleBrick = false, darkStreak = 0.14 } = {}) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 2400; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.055)' : `rgba(30,24,18,${0.035 + rnd() * 0.06})`;
    ctx.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 4, 2 + rnd() * 4);
  }
  for (let i = 0; i < 36; i++) {
    const x = rnd() * 256;
    const h = 26 + rnd() * 95;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgba(22,26,22,${darkStreak})`);
    g.addColorStop(1, 'rgba(22,26,22,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 3 + rnd() * 7, h);
  }
  if (subtleBrick) {
    ctx.strokeStyle = 'rgba(24,18,14,0.22)';
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

function makeTiledPedestalTexture(seedVal = 812) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(0, 0, 256, 256);
  // Crisp white ceramic tiles (matches S09 & S11!)
  for (let y = 0; y < 256; y += 32) {
    for (let x = 0; x < 256; x += 32) {
      const v = 222 + Math.floor(rnd() * 18);
      ctx.fillStyle = `rgb(${v},${v},${v - 2})`;
      ctx.fillRect(x + 1, y + 1, 30, 30);
    }
  }
  ctx.strokeStyle = 'rgba(80,85,90,0.42)';
  ctx.lineWidth = 2;
  for (let p = 0; p < 256; p += 32) {
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(256, p); ctx.stroke();
  }
  // Authentic greenish-brown wet waterline stain at bottom (matches S09!)
  const wg = ctx.createLinearGradient(0, 175, 0, 256);
  wg.addColorStop(0, 'rgba(65,78,34,0)');
  wg.addColorStop(0.5, 'rgba(58,72,26,0.45)');
  wg.addColorStop(1, 'rgba(42,54,18,0.78)');
  ctx.fillStyle = wg;
  ctx.fillRect(0, 175, 256, 81);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeTigerCoatTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#c2591a');
  g.addColorStop(0.65, '#e07a24');
  g.addColorStop(1, '#f3d5a5');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  // Crisp Bengal tiger dark vertical stripes
  ctx.fillStyle = '#181412';
  for (let x = 10; x < 256; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 8, 0);
    ctx.lineTo(x + 4 + ((x * 7) % 9), 150 + ((x * 13) % 65));
    ctx.lineTo(x - 2, 130 + ((x * 11) % 55));
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeFootpathTileTexture(seedVal = 515) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  ctx.fillStyle = '#b4afa4';
  ctx.fillRect(0, 0, 256, 256);
  for (let gy = 0; gy < 4; gy++) {
    for (let gx = 0; gx < 4; gx++) {
      const isAccent = (gx + gy) % 2 === 0;
      const shade = 168 + Math.floor(rnd() * 22);
      ctx.fillStyle = isAccent
        ? `rgb(${shade + 10}, ${shade + 4}, ${shade - 6})`
        : `rgb(${shade - 6}, ${shade - 8}, ${shade - 12})`;
      ctx.fillRect(gx * 64 + 2, gy * 64 + 2, 60, 60);
      ctx.strokeStyle = 'rgba(45,42,38,0.42)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(gx * 64 + 1, gy * 64 + 1, 62, 62);
      for (let d = 0; d < 18; d++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.09)' : 'rgba(28,26,24,0.10)';
        ctx.fillRect(gx * 64 + 4 + rnd() * 54, gy * 64 + 4 + rnd() * 54, 2, 2);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function makeUrbanGroundTexture(seedVal = 619) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = '#7e7c76';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3200; i++) {
    const v = 104 + Math.floor(rnd() * 44);
    ctx.fillStyle = `rgba(${v},${v - 2},${v - 5},0.30)`;
    ctx.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 5, 2 + rnd() * 5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(38, 36);
  tex.anisotropy = 4;
  return tex;
}

function makeShutterTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#52606d';
  ctx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 8) {
    ctx.fillStyle = '#3e4c59';
    ctx.fillRect(0, y, 128, 3);
    ctx.fillStyle = '#7b8794';
    ctx.fillRect(0, y + 3, 128, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeChitinBumpTexture(seedVal = 777) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 8) {
    const g = ctx.createLinearGradient(0, y, 0, y + 8);
    g.addColorStop(0, '#a6a6a6');
    g.addColorStop(0.5, '#727272');
    g.addColorStop(1, '#525252');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, 256, 8);
  }
  for (let i = 0; i < 1100; i++) {
    const v = 88 + Math.floor(rnd() * 90);
    ctx.fillStyle = `rgba(${v},${v},${v},0.24)`;
    ctx.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 3, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function makeCurbStripeTexture(c1 = '#18181b', c2 = '#facc15') {
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

function makeShopfrontGlassTexture(kind = 'sweets') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (kind === 'herlan') {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#7f1d1d');
    g.addColorStop(0.5, '#b91c1c');
    g.addColorStop(1, '#450a0a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#fef2f2';
    ctx.fillRect(16, 68, 224, 148);
    for (let y = 84; y < 200; y += 34) {
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(24, y + 20, 208, 4);
      for (let x = 30; x < 220; x += 24) {
        ctx.fillStyle = ['#dc2626', '#ec4899', '#f59e0b', '#1e293b'][(x + y) % 4];
        ctx.fillRect(x, y + 4, 14, 16);
      }
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Manrope", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HERLAN STORE', 128, 44);
  } else if (kind === 'fabrics') {
    ctx.fillStyle = '#fef2f2';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, 0, 256, 48);
    for (let x = 18; x < 238; x += 30) {
      ctx.fillStyle = ['#ef4444', '#f59e0b', '#10b981', '#2563eb', '#9333ea', '#ec4899'][(x / 30) | 0 % 6];
      ctx.fillRect(x, 62, 22, 168);
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('RAJDHANI FABRICS', 128, 32);
  } else if (kind === 'electronics') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(0, 0, 256, 46);
    for (let x = 22; x < 230; x += 52) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x, 66, 40, 146);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + 6, 76, 28, 54);
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SMARTPHONES & SHOWROOM', 128, 30);
  } else if (kind === 'atm') {
    const g = ctx.createRadialGradient(128, 120, 14, 128, 128, 120);
    g.addColorStop(0, '#10b981');
    g.addColorStop(0.6, '#065f46');
    g.addColorStop(1, '#022c22');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(72, 66, 112, 154);
    ctx.fillStyle = '#6ee7b7';
    ctx.fillRect(88, 86, 80, 48);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('24/7 ATM', 128, 44);
  } else if (kind === 'bus') {
    ctx.fillStyle = '#0b2942';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(14, 16, 228, 22);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(20, 56, 216, 134);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(32, 70, 88, 56);
    ctx.fillRect(136, 70, 88, 56);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AC TICKET COUNTER', 128, 168);
  } else if (kind === 'hospital') {
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(0, 0, 256, 56);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(114, 88, 28, 84);
    ctx.fillRect(86, 116, 84, 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('EMERGENCY 24H', 128, 36);
  } else if (kind === 'pharmacy') {
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#ecfdf5';
    ctx.fillRect(16, 54, 224, 180);
    for (let y = 72; y < 220; y += 36) {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(22, y + 22, 212, 5);
      for (let x = 28; x < 220; x += 22) {
        ctx.fillStyle = ['#10b981', '#0ea5e9', '#ef4444', '#f59e0b'][(x + y) % 4];
        ctx.fillRect(x, y + 4, 15, 18);
      }
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PHARMACY 24H', 128, 34);
  } else {
    // Illuminated Bengali sweetshop / dairy display case (matches G01 Satkhira Adi Jadob Ghosh Dairy!)
    ctx.fillStyle = kind === 'kacchi' ? '#451a03' : '#713f12';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(12, 16, 232, 22);
    for (let y = 56; y < 224; y += 46) {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(16, y + 32, 224, 6);
      for (let x = 22; x < 226; x += 26) {
        ctx.fillStyle = ['#fef08a', '#fbbf24', '#f59e0b', '#fde68a', '#fb923c'][(x + y) % 5];
        ctx.fillRect(x, y + 8, 18, 22);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRoyalBank(m) {
  const mkPlaster = (hex, seedVal, rough = 0.80, opts = {}) => {
    const tex = makePlasterTexture(hex, seedVal, opts);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: rough, metalness: 0.03, envMapIntensity: 0.72 });
    attachDerivedPBRMaps(mat, tex, { strength: opts.subtleBrick ? 2.4 : 1.7, roughBase: rough, normalScale: 0.65 });
    return mat;
  };

  // Authentic Black-and-Yellow Royal More curb stripes (matches A, J, S02, S07, S08!)
  const blackYellowCurbTex = makeCurbStripeTexture('#18181b', '#facc15');
  blackYellowCurbTex.repeat.set(8, 1);
  const blackWhiteCurbTex = makeCurbStripeTexture('#18181b', '#f8fafc');
  blackWhiteCurbTex.repeat.set(8, 1);

  const footpathTex = makeFootpathTileTexture(515);
  const footpathMat = new THREE.MeshStandardMaterial({ map: footpathTex, roughness: 0.82, metalness: 0.03 });
  attachDerivedPBRMaps(footpathMat, footpathTex, { strength: 2.2, roughBase: 0.82, normalScale: 0.62 });

  const urbanGroundTex = makeUrbanGroundTexture(619);
  const urbanGroundMat = new THREE.MeshStandardMaterial({ map: urbanGroundTex, roughness: 0.90, metalness: 0.02 });

  const shutterTex = makeShutterTexture();
  const shutterMat = new THREE.MeshStandardMaterial({ map: shutterTex, roughness: 0.52, metalness: 0.58 });

  const tiledPedTex = makeTiledPedestalTexture(812);
  const tiledPedMat = new THREE.MeshStandardMaterial({ map: tiledPedTex, roughness: 0.34, metalness: 0.08 });

  const tigerTex = makeTigerCoatTexture();
  const tigerMat = new THREE.MeshStandardMaterial({ map: tigerTex, roughness: 0.62, metalness: 0.05 });

  const chitinBump = makeChitinBumpTexture(777);

  const dispHerlanTex = makeShopfrontGlassTexture('herlan');
  const dispFabricsTex = makeShopfrontGlassTexture('fabrics');
  const dispElecTex = makeShopfrontGlassTexture('electronics');
  const dispAtmTex = makeShopfrontGlassTexture('atm');
  const dispBusTex = makeShopfrontGlassTexture('bus');
  const dispHospTex = makeShopfrontGlassTexture('hospital');
  const dispKacchiTex = makeShopfrontGlassTexture('kacchi');
  const dispSweetsTex = makeShopfrontGlassTexture('sweets');
  const dispPharmTex = makeShopfrontGlassTexture('pharmacy');

  const bank = {
    asphalt: m.road || new THREE.MeshStandardMaterial({ color: 0x3b4046, roughness: 0.78, metalness: 0.05 }),
    footpath: footpathMat,
    urbanGround: urbanGroundMat,
    shutter: shutterMat,
    tiledPed: tiledPedMat,
    tigerCoat: tigerMat,
    brick: m.brick || mkPlaster('#9b4634', 101, 0.88, { subtleBrick: true }),
    concrete: m.concrete || mkPlaster('#a8a69e', 102, 0.88),
    darkConcrete: m.darkConcrete || mkPlaster('#4b4f52', 103, 0.90),
    // Hotel Royal International authentic cream/sand palette (B02, B01, B07, S03)
    royalCream: mkPlaster('#e8dfc8', 201, 0.74),
    royalSand: mkPlaster('#d2c3a4', 202, 0.78),
    royalTerracotta: mkPlaster('#b24b3a', 203, 0.82, { subtleBrick: true }),
    herlanRed: new THREE.MeshStandardMaterial({ color: 0xc81e1e, roughness: 0.36, metalness: 0.14 }),
    // Hotel Castle Salam authentic dusty-pink masonry frame & maroon canopy (B03, S13, B08, B05)
    castlePink: mkPlaster('#d99198', 211, 0.72),
    castlePinkDeep: mkPlaster('#b86d76', 212, 0.74),
    castleCanopyMaroon: new THREE.MeshStandardMaterial({ color: 0x5c2428, roughness: 0.48, metalness: 0.18 }),
    castleBlueGlass: new THREE.MeshPhysicalMaterial({
      color: 0x1e5c8c,
      roughness: 0.06,
      metalness: 0.28,
      clearcoat: 0.98,
      envMapIntensity: 1.85,
    }),
    castleGreenGlass: new THREE.MeshPhysicalMaterial({
      color: 0x1d7a64,
      roughness: 0.08,
      metalness: 0.22,
      clearcoat: 0.92,
      transparent: true,
      opacity: 0.72,
      envMapIntensity: 1.65,
    }),
    warmOchre: mkPlaster('#c9975b', 213, 0.80),
    paleBlueWall: mkPlaster('#b8cde0', 214, 0.76),
    modernWhite: mkPlaster('#eef2f6', 204, 0.68),
    modernSlate: mkPlaster('#334155', 205, 0.62),
    hospitalBlue: mkPlaster('#0284c7', 206, 0.62),
    emeraldWall: mkPlaster('#065f46', 207, 0.68),
    sageWall: mkPlaster('#9bb0a3', 208, 0.80),
    dairyYellow: mkPlaster('#eab308', 219, 0.76),
    corrugatedTin: new THREE.MeshStandardMaterial({ color: 0x7c8691, roughness: 0.50, metalness: 0.68 }),
    awningBlue: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.62, metalness: 0.14 }),
    awningGreen: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.64, metalness: 0.12 }),
    awningRed: new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.64, metalness: 0.12 }),
    marbleWhite: new THREE.MeshPhysicalMaterial({ color: 0xf4f1ea, roughness: 0.24, metalness: 0.05, clearcoat: 0.72, envMapIntensity: 1.15 }),
    blackGranite: new THREE.MeshPhysicalMaterial({ color: 0x1b1f24, roughness: 0.18, metalness: 0.12, clearcoat: 0.85, envMapIntensity: 1.35 }),
    curbBlackYellow: new THREE.MeshStandardMaterial({ map: blackYellowCurbTex, roughness: 0.74 }),
    curbBlackWhite: new THREE.MeshStandardMaterial({ map: blackWhiteCurbTex, roughness: 0.76 }),
    roadLineWhite: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.82 }),
    roadLineYellow: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.78 }),
    glassCurtain: new THREE.MeshPhysicalMaterial({
      color: 0x122c3e,
      roughness: 0.07,
      metalness: 0.25,
      clearcoat: 0.96,
      envMapIntensity: 1.75,
    }),
    glassLobby: new THREE.MeshPhysicalMaterial({
      color: 0x1e4c68,
      roughness: 0.08,
      metalness: 0.18,
      clearcoat: 0.9,
      transparent: true,
      opacity: 0.65,
      envMapIntensity: 1.6,
    }),
    warmWindowLit: new THREE.MeshStandardMaterial({
      color: 0xffebb8,
      emissive: 0xffcf70,
      emissiveIntensity: 0.35,
      roughness: 0.24,
    }),
    coolWindowLit: new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x7dd3fc,
      emissiveIntensity: 0.30,
      roughness: 0.24,
    }),
    goldMetal: new THREE.MeshPhysicalMaterial({
      color: 0xf5b82e,
      roughness: 0.20,
      metalness: 0.88,
      clearcoat: 0.70,
      envMapIntensity: 1.65,
    }),
    stainlessChrome: new THREE.MeshPhysicalMaterial({
      color: 0xe8eef4,
      roughness: 0.14,
      metalness: 0.95,
      clearcoat: 0.90,
      envMapIntensity: 1.9,
    }),
    galvanizedPole: new THREE.MeshStandardMaterial({
      color: 0xaeb7c0,
      roughness: 0.34,
      metalness: 0.76,
      envMapIntensity: 1.3,
    }),
    prawnChitin: new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.20,
      metalness: 0.16,
      clearcoat: 0.96,
      clearcoatRoughness: 0.10,
      bumpMap: chitinBump,
      bumpScale: 0.04,
      envMapIntensity: 1.65,
    }),
    prawnWhisker: new THREE.MeshPhysicalMaterial({
      color: 0x1e3a4c,
      roughness: 0.24,
      metalness: 0.25,
      clearcoat: 0.85,
    }),
    prawnEye: new THREE.MeshPhysicalMaterial({
      color: 0x0b0f14,
      roughness: 0.08,
      metalness: 0.1,
      clearcoat: 1.0,
    }),
    fountainBrickVC: new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.78,
      metalness: 0.04,
      bumpMap: chitinBump,
      bumpScale: 0.03,
    }),
    fountainBasinVC: new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.56,
      metalness: 0.06,
    }),
    fountainNozzleTeal: new THREE.MeshStandardMaterial({
      color: 0x0d7a7e,
      roughness: 0.32,
      metalness: 0.65,
    }),
    steelDark: new THREE.MeshStandardMaterial({ color: 0x1e252c, roughness: 0.44, metalness: 0.74 }),
    aluminum: new THREE.MeshStandardMaterial({ color: 0xd1dae2, roughness: 0.24, metalness: 0.88, envMapIntensity: 1.3 }),
    // Authentic greenish-teal reflective basin water (matches S09 & S10!)
    fountainWater: new THREE.MeshPhysicalMaterial({
      color: 0x3b6e4c,
      emissive: 0x133824,
      emissiveIntensity: 0.20,
      roughness: 0.06,
      metalness: 0.16,
      transparent: true,
      opacity: 0.86,
      clearcoat: 1.0,
      envMapIntensity: 1.85,
    }),
    sprayJet: new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x7dd3fc,
      emissiveIntensity: 0.42,
      transparent: true,
      opacity: 0.72,
      roughness: 0.18,
    }),
    grassTurf: new THREE.MeshStandardMaterial({ color: 0x2f7d3a, roughness: 0.92 }),
    foliageDeep: new THREE.MeshStandardMaterial({ color: 0x1f5c2e, roughness: 0.90 }),
    flowerRed: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.82 }),
    flowerGold: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.82 }),
    redCarpet: new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.86 }),
    policeBlue: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.45, metalness: 0.15 }),
    lampGlow: new THREE.MeshStandardMaterial({ color: 0xfff8e6, emissive: 0xffd98a, emissiveIntensity: 0.85 }),
    uplightCyan: new THREE.MeshStandardMaterial({ color: 0xbae6fd, emissive: 0x38bdf8, emissiveIntensity: 0.65 }),
    uplightGold: new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.75 }),
    busGreen: new THREE.MeshPhysicalMaterial({ color: 0x047857, roughness: 0.20, metalness: 0.25, clearcoat: 0.95, envMapIntensity: 1.5 }),
    busRed: new THREE.MeshPhysicalMaterial({ color: 0xb91c1c, roughness: 0.20, metalness: 0.25, clearcoat: 0.95, envMapIntensity: 1.5 }),
    carSilver: new THREE.MeshPhysicalMaterial({ color: 0xcbd5e1, roughness: 0.18, metalness: 0.72, clearcoat: 0.92 }),
    carNavy: new THREE.MeshPhysicalMaterial({ color: 0x1e3a8a, roughness: 0.20, metalness: 0.55, clearcoat: 0.92 }),
    busAccent: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 }),
    tireBlack: new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: 0.88 }),
    acBox: mkPlaster('#dde2e6', 299, 0.50, { darkStreak: 0.03 }),
    waterTank: new THREE.MeshPhysicalMaterial({ color: 0x12181f, roughness: 0.40, clearcoat: 0.35 }),
    wireBlack: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.82 }),
    dispHerlan: new THREE.MeshStandardMaterial({ map: dispHerlanTex, emissive: 0xef4444, emissiveMap: dispHerlanTex, emissiveIntensity: 0.65 }),
    dispFabrics: new THREE.MeshStandardMaterial({ map: dispFabricsTex, emissive: 0xfca5a5, emissiveMap: dispFabricsTex, emissiveIntensity: 0.55 }),
    dispElec: new THREE.MeshStandardMaterial({ map: dispElecTex, emissive: 0x38bdf8, emissiveMap: dispElecTex, emissiveIntensity: 0.65 }),
    dispAtm: new THREE.MeshStandardMaterial({ map: dispAtmTex, emissive: 0x10b981, emissiveMap: dispAtmTex, emissiveIntensity: 0.75 }),
    dispBus: new THREE.MeshStandardMaterial({ map: dispBusTex, emissive: 0x38bdf8, emissiveMap: dispBusTex, emissiveIntensity: 0.60 }),
    dispHosp: new THREE.MeshStandardMaterial({ map: dispHospTex, emissive: 0x93c5fd, emissiveMap: dispHospTex, emissiveIntensity: 0.60 }),
    dispKacchi: new THREE.MeshStandardMaterial({ map: dispKacchiTex, emissive: 0xfbbf24, emissiveMap: dispKacchiTex, emissiveIntensity: 0.70 }),
    dispSweets: new THREE.MeshStandardMaterial({ map: dispSweetsTex, emissive: 0xfde047, emissiveMap: dispSweetsTex, emissiveIntensity: 0.70 }),
    dispPharm: new THREE.MeshStandardMaterial({ map: dispPharmTex, emissive: 0x34d399, emissiveMap: dispPharmTex, emissiveIntensity: 0.65 }),
    emissiveList: [],
  };

  bank.emissiveList.push(
    { mat: bank.warmWindowLit, day: 0.22, night: 1.85 },
    { mat: bank.coolWindowLit, day: 0.18, night: 1.65 },
    { mat: bank.lampGlow, day: 0.65, night: 3.40 },
    { mat: bank.uplightCyan, day: 0.35, night: 2.60 },
    { mat: bank.uplightGold, day: 0.45, night: 2.80 },
    { mat: bank.fountainWater, day: 0.16, night: 0.95 },
    { mat: bank.sprayJet, day: 0.25, night: 1.50 },
    { mat: bank.dispHerlan, day: 0.55, night: 1.65 },
    { mat: bank.dispFabrics, day: 0.48, night: 1.50 },
    { mat: bank.dispElec, day: 0.55, night: 1.65 },
    { mat: bank.dispAtm, day: 0.65, night: 1.75 },
    { mat: bank.dispBus, day: 0.50, night: 1.55 },
    { mat: bank.dispHosp, day: 0.50, night: 1.55 },
    { mat: bank.dispKacchi, day: 0.60, night: 1.65 },
    { mat: bank.dispSweets, day: 0.60, night: 1.65 },
    { mat: bank.dispPharm, day: 0.55, night: 1.60 },
  );

  return bank;
}

/* ============================================================================
 * COLLISION & WALKABLE-FOOTPATH REGISTRY (SOLID OBSTACLES + STEP-UP FOOTPATHS)
 * ========================================================================== */
function createPhysicsRegistry() {
  const circles = [];
  const obbs = [];
  const walkableSlabs = [];

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

  function addWalkableSlab(cx, cz, width, depth, rotY = 0, topY = 0.16) {
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

  function getGroundHeight(pos) {
    const dxC = pos.x - ROYAL_MORE_CENTER.x;
    const dzC = pos.z - ROYAL_MORE_CENTER.z;
    if (dxC * dxC + dzC * dzC > 165 * 165) return 0.0;

    let bestY = 0.0;
    for (let i = 0; i < walkableSlabs.length; i++) {
      const s = walkableSlabs[i];
      const dx = pos.x - s.cx;
      const dz = pos.z - s.cz;
      const lx = dx * s.cos - dz * s.sin;
      const lz = dx * s.sin + dz * s.cos;
      if (Math.abs(lx) <= s.hx + 0.12 && Math.abs(lz) <= s.hz + 0.12) {
        if (s.topY > bestY) bestY = s.topY;
      }
    }
    return bestY;
  }

  function applyCollisions(pos, radius = 0.34, footY = 0) {
    const dxC = pos.x - ROYAL_MORE_CENTER.x;
    const dzC = pos.z - ROYAL_MORE_CENTER.z;
    if (dxC * dxC + dzC * dzC > 165 * 165) return;

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
        const b = obbs[i];
        if (footY >= b.maxH) continue;
        const dx = pos.x - b.cx;
        const dz = pos.z - b.cz;
        const maxExtent = b.hx + b.hz + radius + 0.5;
        if (Math.abs(dx) > maxExtent || Math.abs(dz) > maxExtent) continue;

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
    }
  }

  return { addCircle, addOBB, addWalkableSlab, getGroundHeight, applyCollisions };
}

function addSignBox(dynamicG, bank, opts, pos, rotY, w, h) {
  const tex = makeLightBoxTexture(opts);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: 0.42,
    roughness: 0.28,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });
  bank.emissiveList.push({ mat, day: 0.38, night: 1.55 });
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

function addRoadRibbon(parent, pts, width, y, mat, uvScale = 5.5) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz) + 0.9;
    const yaw = Math.atan2(dx, dz);
    addRotBox(parent, [width, 0.04, len], [(x0 + x1) * 0.5, y, (z0 + z1) * 0.5], mat, yaw, {
      castShadow: false,
      uvScale,
    });
  }
}

function addSidewalkAlongPolyline(staticG, bank, phys, pts, roadHalfW, sideSign, {
  walkWidth = 1.75,
  curbMat = bank.curbBlackYellow,
  addRailing = false,
} = {}) {
  const walkH = 0.16;
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

    addRotBox(staticG, [walkWidth, walkH, segLen + 0.65], [sx, walkH * 0.5, sz], bank.footpath, yaw, {
      castShadow: false,
      uvScale: 1.5,
    });
    phys.addWalkableSlab(sx, sz, walkWidth + 0.35, segLen + 0.7, yaw, walkH);

    addRotBox(
      staticG,
      [0.24, walkH + 0.015, segLen + 0.70],
      [mx + perpX * sideSign * curbOffset, (walkH + 0.015) * 0.5, mz + perpZ * sideSign * curbOffset],
      curbMat,
      yaw,
      { castShadow: false },
    );

    if (segLen > 10) {
      const grates = Math.floor(segLen / 14);
      for (let g = 0; g < grates; g++) {
        const f = ((g + 0.5) / grates - 0.5) * segLen;
        addRotBox(
          staticG,
          [0.42, 0.02, 0.65],
          [mx + (dx / segLen) * f + perpX * sideSign * (roadHalfW - 0.25), 0.048, mz + (dz / segLen) * f + perpZ * sideSign * (roadHalfW - 0.25)],
          bank.steelDark,
          yaw,
          { castShadow: false },
        );
      }
    }

    if (addRailing && segLen > 8) {
      const railOff = roadHalfW + 0.28;
      addRotBox(
        staticG,
        [0.055, 0.055, segLen - 1.4],
        [mx + perpX * sideSign * railOff, walkH + 0.78, mz + perpZ * sideSign * railOff],
        bank.steelDark,
        yaw,
      );
      const posts = Math.max(2, Math.floor(segLen / 4.4));
      for (let p = 0; p <= posts; p++) {
        const t = (p / posts - 0.5) * (segLen - 1.6);
        const px = mx + (dx / segLen) * t + perpX * sideSign * railOff;
        const pz = mz + (dz / segLen) * t + perpZ * sideSign * railOff;
        cylinder(staticG, 0.03, 0.036, 0.78, [px, walkH + 0.39, pz], bank.steelDark, 6);
      }
    }
  }
}

function addZebraCrosswalk(parent, bank, cx, cz, yaw, roadWidth = 9.2) {
  const grp = new THREE.Group();
  grp.position.set(cx, 0.044, cz);
  grp.rotation.y = yaw;
  const count = Math.floor(roadWidth / 0.92);
  const start = -((count - 1) * 0.92) * 0.5;
  for (let i = 0; i < count; i++) {
    box(grp, [0.46, 0.014, 2.35], [start + i * 0.92, 0, 0], bank.roadLineWhite, { castShadow: false });
  }
  parent.add(grp);
}

function addDoubleArmLamp(staticG, dynamicG, bank, x, z, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  cylinder(g, 0.10, 0.15, 7.6, [0, 3.8, 0], bank.aluminum, 8);
  cylinder(g, 0.22, 0.26, 0.35, [0, 0.175, 0], bank.darkConcrete, 8);
  for (const sx of [-1, 1]) {
    box(g, [1.55, 0.07, 0.08], [sx * 0.78, 7.45, 0], bank.aluminum);
    box(g, [0.48, 0.11, 0.22], [sx * 1.48, 7.52, 0], bank.steelDark);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.16), bank.lampGlow);
    bulb.position.set(
      x + Math.cos(rotY) * (sx * 1.48),
      7.45,
      z - Math.sin(rotY) * (sx * 1.48),
    );
    bulb.rotation.y = rotY;
    dynamicG.add(bulb);
  }
  staticG.add(g);
}

function addSidewalkBench(staticG, bank, x, z, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0.16, z);
  g.rotation.y = rotY;
  box(g, [1.75, 0.08, 0.45], [0, 0.42, 0], bank.royalTerracotta);
  box(g, [1.75, 0.32, 0.06], [0, 0.68, -0.20], bank.royalTerracotta);
  for (const sx of [-0.70, 0.70]) {
    box(g, [0.09, 0.42, 0.42], [sx, 0.21, 0], bank.steelDark);
  }
  staticG.add(g);
}

function addOrnamentalPalm(staticG, bank, phys, x, z, height = 6.6, seed = 11) {
  const rnd = seeded(seed);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6f553b, roughness: 0.92 });
  const leafMat = bank.grassTurf;
  const leanX = (rnd() - 0.5) * 0.55;
  const leanZ = (rnd() - 0.5) * 0.55;
  let px = x;
  let py = 0;
  let pz = z;
  for (let i = 1; i <= 4; i++) {
    const t = i / 4;
    const nx = x + leanX * t * t;
    const ny = height * t;
    const nz = z + leanZ * t * t;
    rodBetween(staticG, [px, py, pz], [nx, ny, nz], THREE.MathUtils.lerp(0.18, 0.10, t), trunkMat, 7);
    px = nx; py = ny; pz = nz;
  }
  for (let f = 0; f < 7; f++) {
    const a = (f / 7) * Math.PI * 2 + rnd() * 0.25;
    const len = 2.1 + (f % 2) * 0.35;
    const mx = px + Math.cos(a) * len * 0.55;
    const my = py + 0.42;
    const mz = pz + Math.sin(a) * len * 0.55;
    const tx = px + Math.cos(a) * len;
    const ty = py - 0.42;
    const tz = pz + Math.sin(a) * len;
    rodBetween(staticG, [px, py, pz], [mx, my, mz], 0.06, leafMat, 5);
    rodBetween(staticG, [mx, my, mz], [tx, ty, tz], 0.045, leafMat, 5);
    addRotBox(staticG, [0.44, 0.06, len * 0.65], [mx, my - 0.08, mz], leafMat, Math.atan2(tx - px, tz - pz));
  }
  phys?.addCircle(x, z, 0.24, height);
}

/* ============================================================================
 * 1. URBAN PAVED GROUND + EXACT MAP-MATCHED ROADS + WALKABLE FOOTPATHS
 * ========================================================================== */
function buildRoyalMoreRoadsAndFootpaths(staticG, dynamicG, bank, phys) {
  const CX = ROYAL_MORE_CENTER.x;
  const CZ = ROYAL_MORE_CENTER.z;

  // Dense Urban Paved Concrete Ground Deck covering entire Royal Mor district
  box(staticG, [220, 0.024, 200], [-736, 0.012, -296], bank.urbanGround, { castShadow: false });

  // Main Circular Roundabout Asphalt Ring (inner r = 5.60m outer island curb, outer r = 14.2m)
  const ringGeo = new THREE.RingGeometry(5.55, 14.2, 56);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMesh = new THREE.Mesh(ringGeo, bank.asphalt);
  ringMesh.position.set(CX, 0.036, CZ);
  ringMesh.receiveShadow = true;
  staticG.add(ringMesh);

  // Outer Roundabout Walkable Raised Footpath Collar segments (black-and-yellow curb)
  const cornerArcs = [
    [-0.18, 0.44],   // East-SE corner
    [1.06, 2.02],    // South corner (Castle Salam side)
    [3.56, 4.38],    // North-NW corner (Hotel Royal side)
    [5.02, 5.75],    // NE corner (JOBAIR'S / Police Box side)
  ];
  for (const [aStart, aEnd] of cornerArcs) {
    const segs = 10;
    const step = (aEnd - aStart) / segs;
    for (let i = 0; i < segs; i++) {
      const a0 = aStart + i * step;
      const a1 = a0 + step;
      const am = (a0 + a1) * 0.5;
      const rMid = 15.25;
      const arcLen = Math.max(0.88, rMid * step + 0.35);
      const ax = CX + Math.cos(am) * rMid;
      const az = CZ + Math.sin(am) * rMid;
      addRotBox(staticG, [1.95, 0.16, arcLen], [ax, 0.08, az], bank.footpath, -am, {
        castShadow: false,
        uvScale: 1.5,
      });
      phys.addWalkableSlab(ax, az, 2.15, arcLen + 0.2, -am, 0.16);
      addRotBox(
        staticG,
        [0.24, 0.175, arcLen + 0.08],
        [CX + Math.cos(am) * 14.32, 0.0875, CZ + Math.sin(am) * 14.32],
        bank.curbBlackYellow,
        -am,
        { castShadow: false },
      );
    }
  }

  // Dashed White Lane Ring around Roundabout (r = 9.9m)
  const dashCount = 24;
  for (let i = 0; i < dashCount; i++) {
    const a = (i / dashCount) * Math.PI * 2;
    const r = 9.9;
    addRotBox(
      staticG,
      [0.18, 0.012, 1.35],
      [CX + Math.cos(a) * r, 0.043, CZ + Math.sin(a) * r],
      bank.roadLineWhite,
      -a,
      { castShadow: false },
    );
  }

  // Exact OSM Intersecting Road Polylines (matches Page 1 site plan)
  const seKhanJahan = [[-644, -248], [-670, -264], [-686, -276], [-711, -290]];
  const nwKhanJahan = [[-716, -296], [-727.9, -317.9], [-742.2, -337.3], [-756.6, -353.9], [-778.6, -386.1]];
  const kdaSouthLane = [[-715, -285.3], [-735.8, -277.2], [-766.8, -273.0], [-801.0, -274.8], [-834.0, -283.2]];
  const kdaNorthLane = [[-721, -296.5], [-742.8, -289.1], [-770.4, -283.7], [-802.5, -284.5], [-834.0, -290.5]];
  const slipSEtoKDA = [[-686.8, -275.6], [-735.8, -277.2]];
  const slipKDAtoNW = [[-742.8, -289.1], [-735.2, -299.2], [-727.9, -317.9]];
  const localStreetENE = [[-704.0, -299.0], [-678.0, -318.0], [-652.0, -322.0]];

  addRoadRibbon(staticG, seKhanJahan, 13.4, 0.033, bank.asphalt, 5.5);
  addRoadRibbon(staticG, nwKhanJahan, 11.8, 0.033, bank.asphalt, 5.5);
  addRoadRibbon(staticG, kdaSouthLane, 8.2, 0.033, bank.asphalt, 5.5);
  addRoadRibbon(staticG, kdaNorthLane, 8.2, 0.033, bank.asphalt, 5.5);
  addRoadRibbon(staticG, slipSEtoKDA, 7.6, 0.031, bank.asphalt, 5.5);
  addRoadRibbon(staticG, slipKDAtoNW, 7.2, 0.031, bank.asphalt, 5.5);
  addRoadRibbon(staticG, localStreetENE, 6.2, 0.031, bank.asphalt, 5.0);

  // Walkable Raised Footpaths (0.16m) with Black-and-Yellow Curbs along all approaches
  const seWalkPts = [[-644, -248], [-670, -264], [-686, -276], [-699, -283.5]];
  addSidewalkAlongPolyline(staticG, bank, phys, seWalkPts, 6.7, 1, { walkWidth: 1.85, curbMat: bank.curbBlackYellow });
  addSidewalkAlongPolyline(staticG, bank, phys, seWalkPts, 6.7, -1, { walkWidth: 1.85, curbMat: bank.curbBlackYellow });

  const nwWalkPts = [[-726.5, -315.5], [-742.2, -337.3], [-756.6, -353.9], [-778.6, -386.1]];
  addSidewalkAlongPolyline(staticG, bank, phys, nwWalkPts, 5.9, 1, { walkWidth: 1.80, curbMat: bank.curbBlackYellow });
  addSidewalkAlongPolyline(staticG, bank, phys, nwWalkPts, 5.9, -1, { walkWidth: 1.80, curbMat: bank.curbBlackYellow });

  const kdaSouthWalkPts = [[-735.8, -277.2], [-766.8, -273.0], [-801.0, -274.8], [-834.0, -283.2]];
  addSidewalkAlongPolyline(staticG, bank, phys, kdaSouthWalkPts, 4.1, -1, { walkWidth: 1.95, curbMat: bank.curbBlackYellow });

  const kdaNorthWalkPts = [[-742.8, -289.1], [-770.4, -283.7], [-802.5, -284.5], [-834.0, -290.5]];
  addSidewalkAlongPolyline(staticG, bank, phys, kdaNorthWalkPts, 4.1, 1, { walkWidth: 1.95, curbMat: bank.curbBlackYellow });

  for (const [bx, bz, byaw] of [
    [-762, -267.8, Math.PI],
    [-792, -267.8, Math.PI],
    [-772, -289.2, 0],
    [-802, -289.8, 0],
  ]) {
    addSidewalkBench(staticG, bank, bx, bz, byaw);
  }

  // KDA Avenue Central Planted Median with Black-and-Yellow Curbs (Camera A, S07)
  // Note: Tiger Median sits at (-752.8, -281.3), so planted median starts west of (-758, -280.2)
  const kdaMedianPts = [[-759, -280.0], [-774, -278.4], [-802, -279.6], [-828, -286.2]];
  for (let i = 0; i < kdaMedianPts.length - 1; i++) {
    const [x0, z0] = kdaMedianPts[i];
    const [x1, z1] = kdaMedianPts[i + 1];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    const mx = (x0 + x1) * 0.5;
    const mz = (z0 + z1) * 0.5;
    addRotBox(staticG, [1.50, 0.30, len], [mx, 0.15, mz], bank.curbBlackYellow, yaw);
    addRotBox(staticG, [0.98, 0.36, len - 0.6], [mx, 0.18, mz], bank.grassTurf, yaw);
    // Waist-high trimmed green hedges & round ornamental median trees (exact match to S03 & B06!)
    addRotBox(staticG, [0.84, 0.62, Math.max(2.0, len - 1.4)], [mx, 0.62, mz], bank.foliageDeep, yaw);
    for (const f of [0.22, 0.78]) {
      const tx = x0 + dx * f;
      const tz = z0 + dz * f;
      cylinder(staticG, 0.08, 0.11, 1.55, [tx, 1.05, tz], bank.royalTerracotta, 6);
      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(0.82, 1), bank.grassTurf);
      crown.position.set(tx, 1.98, tz);
      crown.scale.set(1.0, 0.78, 1.0);
      staticG.add(crown);
    }
    phys.addOBB(mx, mz, 1.50, len, yaw, 0.95);
    addDoubleArmLamp(staticG, dynamicG, bank, mx, mz, yaw);
  }

  // SE Khan Jahan Ali Road Raised Center Divider + Median Signs (matches Camera C!)
  const seDivStart = [-695.5, -280.2];
  const seDivEnd = [-652.0, -253.5];
  const seDx = seDivEnd[0] - seDivStart[0];
  const seDz = seDivEnd[1] - seDivStart[1];
  const seLen = Math.hypot(seDx, seDz);
  const seYaw = Math.atan2(seDx, seDz);
  const seMx = (seDivStart[0] + seDivEnd[0]) * 0.5;
  const seMz = (seDivStart[1] + seDivEnd[1]) * 0.5;
  addRotBox(staticG, [1.22, 0.28, seLen], [seMx, 0.14, seMz], bank.curbBlackYellow, seYaw);
  addRotBox(staticG, [0.76, 0.34, seLen - 0.8], [seMx, 0.17, seMz], bank.grassTurf, seYaw);
  phys.addOBB(seMx, seMz, 1.22, seLen, seYaw, 0.45);
  addDoubleArmLamp(staticG, dynamicG, bank, seDivStart[0] + seDx * 0.30, seDivStart[1] + seDz * 0.30, seYaw);
  addDoubleArmLamp(staticG, dynamicG, bank, seDivStart[0] + seDx * 0.72, seDivStart[1] + seDz * 0.72, seYaw);

  // Median illuminated vertical signs along SE Khan Jahan Ali Rd (matches Camera C)
  for (let ms = 0; ms < 2; ms++) {
    const f = 0.18 + ms * 0.32;
    const sx = seDivStart[0] + seDx * f;
    const sz = seDivStart[1] + seDz * f;
    cylinder(staticG, 0.07, 0.09, 2.6, [sx, 1.3, sz], bank.steelDark, 6);
    addSignBox(
      dynamicG,
      bank,
      {
        title: ms === 0 ? 'খুলনা সিটি কর্পোরেশন' : 'রয়্যাল মোড় · ধীরে চলুন',
        subtitle: ms === 0 ? 'পরিচ্ছন্ন খুলনা গড়ুন' : 'ROYAL MORE JUNCTION',
        bg: ms === 0 ? '#065f46' : '#1e3a8a',
        accent: '#fde047',
      },
      [sx, 2.55, sz],
      seYaw,
      1.75,
      0.88,
    );
  }

  // NW Khan Jahan Ali Road Dashed Yellow Centerline
  for (let i = 0; i < nwKhanJahan.length - 1; i++) {
    const [x0, z0] = nwKhanJahan[i];
    const [x1, z1] = nwKhanJahan[i + 1];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const segLen = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    const steps = Math.max(2, Math.floor(segLen / 5.0));
    for (let s = 0; s < steps; s++) {
      const f = (s + 0.5) / steps;
      addRotBox(
        staticG,
        [0.20, 0.014, 2.2],
        [x0 + dx * f, 0.044, z0 + dz * f],
        bank.roadLineYellow,
        yaw,
        { castShadow: false },
      );
    }
  }

  // Crisp Zebra Crosswalks on all Approaches into Royal Circle
  addZebraCrosswalk(staticG, bank, -701.5, -284.2, seYaw, 11.4);
  addZebraCrosswalk(staticG, bank, -724.5, -310.2, Math.atan2(-11.9, -21.9), 10.2);
  addZebraCrosswalk(staticG, bank, -736.5, -289.8, Math.atan2(-22.0, 5.2), 7.4);
  addZebraCrosswalk(staticG, bank, -734.8, -277.6, Math.atan2(-22.0, 4.0), 7.4);
}

/* ============================================================================
 * 2. KDA AVENUE ROYAL BENGAL TIGER MEDIAN (Photo S07 — West of Shrimp Island!)
 * ========================================================================== */
function buildKdaTigerMedian(staticG, dynamicG, bank, phys) {
  const tx = -751.8;
  const tz = -281.4;
  const rotY = -0.18; // aligned with KDA Avenue W-E axis

  phys.addOBB(tx, tz, 6.0, 2.2, rotY, 2.6);

  const g = new THREE.Group();
  g.position.set(tx, 0, tz);
  g.rotation.y = rotY;
  staticG.add(g);

  // Raised black-and-yellow striped planter plinth (matches S07!)
  box(g, [5.8, 0.62, 2.05], [0, 0.31, 0], bank.curbBlackYellow);
  box(g, [5.4, 0.14, 1.72], [0, 0.66, 0], bank.grassTurf);

  // Black vertical iron perimeter fence around the median (matches S07!)
  const fenceH = 0.68;
  for (const sz of [-0.94, 0.94]) {
    box(g, [5.5, 0.045, 0.045], [0, 0.62 + fenceH, sz], bank.steelDark);
    box(g, [5.5, 0.04, 0.04], [0, 0.62 + fenceH * 0.45, sz], bank.steelDark);
    for (let x = -2.65; x <= 2.66; x += 0.38) {
      cylinder(g, 0.018, 0.02, fenceH, [x, 0.62 + fenceH * 0.5, sz], bank.steelDark, 5);
    }
  }
  for (const sx of [-2.74, 2.74]) {
    box(g, [0.045, 0.045, 1.9], [sx, 0.62 + fenceH, 0], bank.steelDark);
    for (let z = -0.82; z <= 0.83; z += 0.40) {
      cylinder(g, 0.018, 0.02, fenceH, [sx, 0.62 + fenceH * 0.5, z], bank.steelDark, 5);
    }
  }

  // Sculpted Rocky Mound + Striding Royal Bengal Tiger (Sundarbans / Khulna emblem!)
  box(g, [2.8, 0.44, 1.15], [0, 0.88, 0], bank.darkConcrete);
  box(g, [2.4, 0.24, 0.95], [0, 1.16, 0], bank.concrete);

  // Tiger body (facing +X toward the shrimp junction)
  const tiger = new THREE.Group();
  tiger.position.set(0, 1.28, 0);
  g.add(tiger);

  // Muscular torso & chest
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.05, 8, 12), bank.tigerCoat);
  torso.rotation.z = Math.PI * 0.5;
  torso.position.set(0, 0.72, 0);
  torso.castShadow = true;
  tiger.add(torso);

  // Broad shoulders & head
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 10), bank.tigerCoat);
  chest.position.set(0.54, 0.78, 0);
  chest.scale.set(1.05, 1.0, 0.92);
  tiger.add(chest);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), bank.tigerCoat);
  head.position.set(0.95, 0.96, 0);
  head.scale.set(1.18, 0.95, 0.96);
  tiger.add(head);

  // Muzzle, nose & ears
  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.22), bank.marbleWhite);
  muzzle.position.set(1.18, 0.90, 0);
  tiger.add(muzzle);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.09), bank.steelDark);
  nose.position.set(1.29, 0.94, 0);
  tiger.add(nose);
  for (const ez of [-0.15, 0.15]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.11, 6), bank.tigerCoat);
    ear.position.set(0.88, 1.18, ez);
    tiger.add(ear);
  }

  // 4 Striding Legs
  const legs = [
    [[0.52, 0.62, 0.19], [0.68, 0.26, 0.20], [0.76, 0.04, 0.20]],
    [[0.46, 0.62, -0.19], [0.38, 0.26, -0.20], [0.42, 0.04, -0.20]],
    [[-0.48, 0.62, 0.19], [-0.58, 0.26, 0.20], [-0.52, 0.04, 0.20]],
    [[-0.54, 0.62, -0.19], [-0.36, 0.26, -0.20], [-0.30, 0.04, -0.20]],
  ];
  for (const [hip, knee, paw] of legs) {
    rodBetween(tiger, hip, knee, 0.105, bank.tigerCoat, 8);
    rodBetween(tiger, knee, paw, 0.085, bank.tigerCoat, 8);
    const pawMesh = new THREE.Mesh(new THREE.SphereGeometry(0.095, 8, 6), bank.marbleWhite);
    pawMesh.position.set(paw[0] + 0.04, 0.05, paw[2]);
    pawMesh.scale.set(1.3, 0.6, 1.0);
    tiger.add(pawMesh);
  }

  // Sweeping Curved Tail
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.68, 0.78, 0),
    new THREE.Vector3(-1.02, 0.64, 0.08),
    new THREE.Vector3(-1.26, 0.42, 0.16),
    new THREE.Vector3(-1.42, 0.56, 0.12),
  ]);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 12, 0.048, 6, false), bank.tigerCoat);
  tiger.add(tail);

  // Ornamental shrubs flanking the tiger inside the fenced planter
  for (const sx of [-2.1, -1.65, 1.65, 2.15]) {
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36, 1), sx % 2 === 0 ? bank.grassTurf : bank.foliageDeep);
    bush.position.set(sx, 0.92, (sx > 0 ? 1 : -1) * 0.25);
    g.add(bush);
  }

  // Iconic Orange "WELCOME TO THE LAND OF TIGERS" sign + Geometric Cube Lattice Sculpture (exact S07 & B02!)
  cylinder(g, 0.08, 0.10, 4.4, [-2.25, 2.2, 0], bank.aluminum, 8);
  addSignBox(
    dynamicG,
    bank,
    { title: 'WELCOME TO THE LAND OF TIGERS', subtitle: 'KHULNA · KDA AVENUE', bg: '#ea580c', fg: '#ffffff', accent: '#fef08a', border: '#ffffff', width: 512, height: 224, align: 'center' },
    [tx - Math.cos(rotY) * 2.25, 2.55, tz + Math.sin(rotY) * 2.25],
    Math.PI * 0.5 + rotY,
    1.85,
    1.15,
  );
  // Geometric white-steel cube lattice sculpture atop pole (visible in B02 & S07!)
  const cubeC = [-2.25, 4.35, 0];
  for (const [ox, oy, oz] of [[0, 0, 0], [0.45, 0.45, 0.35], [-0.45, 0.45, -0.35]]) {
    const s = 0.72;
    const cx = cubeC[0] + ox;
    const cy = cubeC[1] + oy;
    const cz = cubeC[2] + oz;
    for (const dx of [-s, s]) {
      for (const dy of [-s, s]) rodBetween(g, [cx + dx, cy + dy, cz - s], [cx + dx, cy + dy, cz + s], 0.025, bank.aluminum, 4);
      for (const dz of [-s, s]) rodBetween(g, [cx + dx, cy - s, cz + dz], [cx + dx, cy + s, cz + dz], 0.025, bank.aluminum, 4);
    }
    for (const dy of [-s, s]) {
      for (const dz of [-s, s]) rodBetween(g, [cx - s, cy + dy, cz + dz], [cx + s, cy + dy, cz + dz], 0.025, bank.aluminum, 4);
    }
  }
}

/* ============================================================================
 * 3. AUTHENTIC CHINGRI CHATTAR (চিংড়ি চত্বর) — DUAL ISLAND + 3-SIDED BILLBOARD
 * Exact match to U01, S01, S02, S08, S09, S10, S11!
 * ========================================================================== */
function buildVertexColoredTube(points, radii, colors, segs = 12) {
  const n = points.length;
  const positions = [];
  const vc = [];
  const uvs = [];
  const indices = [];

  const upRef = new THREE.Vector3(0, 1, 0);
  const fallbackRef = new THREE.Vector3(1, 0, 0);

  for (let i = 0; i < n; i++) {
    const p = points[i];
    const t = new THREE.Vector3();
    if (i === 0) t.subVectors(points[1], points[0]);
    else if (i === n - 1) t.subVectors(points[n - 1], points[n - 2]);
    else t.subVectors(points[i + 1], points[i - 1]);
    if (t.lengthSq() < 1e-8) t.set(0, 1, 0);
    t.normalize();

    const ref = Math.abs(t.dot(upRef)) > 0.92 ? fallbackRef : upRef;
    const u = new THREE.Vector3().crossVectors(t, ref).normalize();
    const v = new THREE.Vector3().crossVectors(t, u).normalize();

    const rx = Array.isArray(radii[i]) ? radii[i][0] : radii[i];
    const ry = Array.isArray(radii[i]) ? radii[i][1] : radii[i];
    const c = colors[i];

    for (let j = 0; j <= segs; j++) {
      const a = (j / segs) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      positions.push(
        p.x + u.x * (ca * rx) + v.x * (sa * ry),
        p.y + u.y * (ca * rx) + v.y * (sa * ry),
        p.z + u.z * (ca * rx) + v.z * (sa * ry),
      );
      const shade = 0.88 + 0.18 * (0.5 + 0.5 * sa);
      vc.push(
        Math.min(1, c[0] * shade),
        Math.min(1, c[1] * shade),
        Math.min(1, c[2] * shade),
      );
      uvs.push(j / segs, i / Math.max(1, n - 1));
    }
  }

  const stride = segs + 1;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * stride + j;
      const b = a + 1;
      const c = (i + 1) * stride + j;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(vc, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  const nonIdx = geo.toNonIndexed();
  geo.dispose();
  nonIdx.computeVertexNormals();
  return nonIdx;
}

function colorizeGeometry(geo, rgb) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  const count = g.attributes.position.count;
  const cols = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    cols[i * 3] = rgb[0];
    cols[i * 3 + 1] = rgb[1];
    cols[i * 3 + 2] = rgb[2];
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) {
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
  }
  return g;
}

function buildSingleGoldaPrawnGeometries(rotYAngle) {
  // Authentic photo-matched blue-green/turquoise shell with golden-yellow & orange accents (U01, S10, S11!)
  const C_TURQ = [0.22, 0.72, 0.68];
  const C_MINT = [0.36, 0.80, 0.66];
  const C_TEAL = [0.12, 0.56, 0.64];
  const C_BLUE = [0.12, 0.34, 0.66];
  const C_DEEPBLUE = [0.07, 0.18, 0.42];
  const C_YELLOW = [0.92, 0.86, 0.24];
  const C_ORANGE = [0.94, 0.44, 0.14];

  const v = (bx, by, bz) => new THREE.Vector3(bx, bz, -by);
  const prawnGeos = [];
  const whiskerGeos = [];
  const eyeGeos = [];
  const rotMat = new THREE.Matrix4().makeRotationY(rotYAngle);

  const pushPrawn = (g) => {
    g.applyMatrix4(rotMat);
    prawnGeos.push(g);
  };

  // 1) 6 Bulging Segmented Abdomen Rings (curving inward at base just like S11!)
  const abdPts = [
    v(0.95, 0, 1.24),
    v(1.26, 0, 1.42),
    v(1.56, 0, 1.68),
    v(1.80, 0, 1.98),
    v(1.94, 0, 2.30),
    v(2.00, 0, 2.64),
  ];
  const abdRad = [
    [0.15, 0.17],
    [0.25, 0.28],
    [0.32, 0.36],
    [0.37, 0.42],
    [0.39, 0.44],
    [0.40, 0.45],
  ];
  const abdCol = [C_TEAL, C_MINT, C_TURQ, C_TURQ, C_TEAL, C_TEAL];

  const segPts = [];
  const segRad = [];
  const segCol = [];
  for (let i = 0; i < abdPts.length - 1; i++) {
    const p0 = abdPts[i];
    const p1 = abdPts[i + 1];
    const r0 = abdRad[i];
    const r1 = abdRad[i + 1];
    const c0 = abdCol[i];
    const c1 = abdCol[i + 1];
    segPts.push(p0.clone());
    segRad.push([r0[0] * 0.88, r0[1] * 0.88]);
    segCol.push(c0);

    segPts.push(p0.clone().lerp(p1, 0.52));
    segRad.push([(r0[0] + r1[0]) * 0.56, (r0[1] + r1[1]) * 0.56]);
    segCol.push([(c0[0] + c1[0]) * 0.5, (c0[1] + c1[1]) * 0.5, (c0[2] + c1[2]) * 0.5]);
  }
  segPts.push(abdPts[abdPts.length - 1].clone());
  segRad.push(abdRad[abdRad.length - 1]);
  segCol.push(abdCol[abdCol.length - 1]);
  pushPrawn(buildVertexColoredTube(segPts, segRad, segCol, 14));

  // 2) Smooth Cephalothorax Carapace
  const carPts = [
    v(1.99, 0, 2.58),
    v(1.97, 0, 2.98),
    v(1.86, 0, 3.38),
    v(1.68, 0, 3.70),
    v(1.48, 0, 3.94),
  ];
  const carRad = [
    [0.41, 0.46],
    [0.44, 0.50],
    [0.40, 0.46],
    [0.31, 0.36],
    [0.19, 0.22],
  ];
  pushPrawn(buildVertexColoredTube(carPts, carRad, [C_TEAL, C_TURQ, C_MINT, C_YELLOW, C_YELLOW], 14));

  // 3) Golden-Orange Rostrum Horn
  pushPrawn(buildVertexColoredTube(
    [v(1.48, 0, 3.86), v(1.36, 0, 4.22), v(1.22, 0, 4.58), v(1.06, 0, 4.92)],
    [0.13, 0.085, 0.048, 0.016],
    [C_YELLOW, C_ORANGE, C_ORANGE, C_ORANGE],
    10,
  ));

  // 4) Antennal Scales, Glossy Stalked Eyes & Sweeping Whiskers
  for (const sy of [-1, 1]) {
    pushPrawn(buildVertexColoredTube(
      [v(1.46, sy * 0.14, 3.84), v(1.32, sy * 0.26, 4.14), v(1.22, sy * 0.30, 4.40)],
      [[0.06, 0.03], [0.07, 0.025], [0.02, 0.01]],
      [C_TEAL, C_BLUE, C_ORANGE],
      8,
    ));

    const eyeSphere = new THREE.SphereGeometry(0.070, 10, 8);
    const ep = v(1.48, sy * 0.22, 3.94);
    eyeSphere.translate(ep.x, ep.y, ep.z);
    eyeSphere.applyMatrix4(rotMat);
    eyeGeos.push(eyeSphere.index ? eyeSphere.toNonIndexed() : eyeSphere);

    const wCurve = new THREE.CatmullRomCurve3([
      v(1.44, sy * 0.18, 3.90),
      v(1.24, sy * 0.62, 4.44),
      v(1.42, sy * 1.12, 4.60),
      v(1.86, sy * 1.38, 4.18),
    ]);
    const wGeo = new THREE.TubeGeometry(wCurve, 14, 0.015, 5, false);
    wGeo.applyMatrix4(rotMat);
    whiskerGeos.push(wGeo.index ? wGeo.toNonIndexed() : wGeo);
  }

  // 5) 5-Blade Inward-Curving Tail Fan
  for (let b = -2; b <= 2; b++) {
    const spread = b * 0.15;
    pushPrawn(buildVertexColoredTube(
      [v(0.96, spread * 0.3, 1.26), v(0.76, spread * 1.0, 1.12), v(0.56, spread * 1.55, 0.96)],
      [[0.07, 0.025], [0.10, 0.022], [0.04, 0.012]],
      [C_TEAL, C_BLUE, C_DEEPBLUE],
      8,
    ));
  }

  // 6) 4 Pairs of Swimmerets
  for (let s = 0; s < 4; s++) {
    const pBase = abdPts[s + 1];
    for (const sy of [-1, 1]) {
      pushPrawn(buildVertexColoredTube(
        [
          new THREE.Vector3(pBase.x - 0.14, pBase.y - 0.06, pBase.z + sy * 0.18),
          new THREE.Vector3(pBase.x - 0.36, pBase.y - 0.14, pBase.z + sy * 0.30),
          new THREE.Vector3(pBase.x - 0.50, pBase.y - 0.26, pBase.z + sy * 0.34),
        ],
        [0.045, 0.036, 0.014],
        [C_YELLOW, C_TEAL, C_BLUE],
        6,
      ));
    }
  }

  // 7) Deep-Blue Cheliped Arms & Walking Legs gripping the central billboard mast
  for (const sy of [-1, 1]) {
    pushPrawn(buildVertexColoredTube(
      [v(1.66, sy * 0.28, 3.22), v(1.18, sy * 0.52, 3.58), v(0.68, sy * 0.42, 3.94), v(0.30, sy * 0.22, 4.20)],
      [0.078, 0.070, 0.084, 0.046],
      [C_TEAL, C_BLUE, C_DEEPBLUE, C_DEEPBLUE],
      8,
    ));
    pushPrawn(buildVertexColoredTube(
      [v(0.48, sy * 0.30, 4.08), v(0.24, sy * 0.14, 4.32)],
      [0.038, 0.016],
      [C_DEEPBLUE, C_ORANGE],
      6,
    ));
    for (let l = 0; l < 3; l++) {
      const zOff = 2.66 + l * 0.32;
      pushPrawn(buildVertexColoredTube(
        [v(1.76 - l * 0.08, sy * 0.32, zOff), v(1.12, sy * 0.56, zOff + 0.12), v(0.56, sy * 0.34, zOff - 0.16), v(0.26, sy * 0.18, zOff - 0.32)],
        [0.048, 0.038, 0.030, 0.016],
        [C_MINT, C_TEAL, C_BLUE, C_DEEPBLUE],
        6,
      ));
    }
  }

  return { prawnGeos, whiskerGeos, eyeGeos };
}

function buildChingriChattarMonument(staticG, dynamicG, bank, phys) {
  const CX = ROYAL_MORE_CENTER.x;
  const CZ = ROYAL_MORE_CENTER.z;

  // Solid circular collider covering the ENTIRE outer black-and-yellow island boundary (r = 5.68m)
  phys.addCircle(CX, CZ, 5.68, 12.0);

  const mon = new THREE.Group();
  mon.position.set(CX, 0, CZ);
  dynamicG.add(mon);

  // 1) OUTER ISLAND BOUNDARY: Raised Black-and-Yellow Striped Curb + Broad Paved Apron (matches S02, S08, Camera J!)
  const outerApron = new THREE.Mesh(new THREE.CylinderGeometry(5.52, 5.60, 0.22, 48), bank.footpath);
  outerApron.position.y = 0.11;
  outerApron.receiveShadow = true;
  mon.add(outerApron);

  // Outer raised black-and-yellow striped curb ring (24 alternating segments for ultra-crisp stripes!)
  const curbSegs = 28;
  const curbBlackMat = bank.steelDark;
  const curbYellowMat = bank.roadLineYellow;
  for (let i = 0; i < curbSegs; i++) {
    const a = (i / curbSegs) * Math.PI * 2;
    const segLen = (2 * Math.PI * 5.60) / curbSegs + 0.04;
    const seg = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.28, segLen),
      i % 2 === 0 ? curbYellowMat : curbBlackMat,
    );
    seg.position.set(Math.cos(a) * 5.56, 0.14, Math.sin(a) * 5.56);
    seg.rotation.y = -a;
    seg.castShadow = true;
    seg.receiveShadow = true;
    mon.add(seg);
  }

  const brickGeos = [];
  const basinGeos = [];
  const nozzleGeos = [];
  const chromeGeos = [];
  const allPrawnGeos = [];
  const allWhiskerGeos = [];
  const allEyeGeos = [];

  // Inner basin floor & wall
  const floor = new THREE.CylinderGeometry(3.52, 3.52, 0.14, 36);
  floor.translate(0, 0.26, 0);
  basinGeos.push(colorizeGeometry(floor, [0.14, 0.34, 0.26]));

  const innerWall = new THREE.CylinderGeometry(3.52, 3.52, 0.84, 36, 1, true);
  innerWall.translate(0, 0.62, 0);
  basinGeos.push(colorizeGeometry(innerWall, [0.18, 0.42, 0.32]));

  // Tan / Sandy Masonry Brick Outer Basin Wall (matches S10, U01, S09!)
  const rnd = seeded(909);
  const courses = 7;
  const bricksPerCourse = 42;
  const courseH = 0.84 / courses;
  for (let c = 0; c < courses; c++) {
    const yMid = 0.20 + (c + 0.5) * courseH;
    const angleOffset = (c % 2) * (Math.PI / bricksPerCourse);
    for (let b = 0; b < bricksPerCourse; b++) {
      const a = (b / bricksPerCourse) * Math.PI * 2 + angleOffset;
      const br = new THREE.BoxGeometry(0.50, courseH - 0.012, 0.54);
      br.rotateY(-a);
      br.translate(Math.cos(a) * 3.76, yMid, Math.sin(a) * 3.76);
      const v = (rnd() - 0.5) * 0.08;
      brickGeos.push(colorizeGeometry(br, [0.80 + v, 0.64 + v * 0.8, 0.42 + v * 0.5]));
    }
  }

  // Pale Sandstone Coping Cap around top of basin
  for (let b = 0; b < 36; b++) {
    const a = (b / 36) * Math.PI * 2;
    const cap = new THREE.BoxGeometry(0.64, 0.08, 0.70);
    cap.rotateY(-a);
    cap.translate(Math.cos(a) * 3.76, 1.08, Math.sin(a) * 3.76);
    brickGeos.push(colorizeGeometry(cap, [0.88, 0.80, 0.65]));
  }

  // Teal Spray Ring Pipe & 48 Nozzles
  const sprayPipe = new THREE.TorusGeometry(3.38, 0.034, 8, 48);
  sprayPipe.rotateX(Math.PI / 2);
  sprayPipe.translate(0, 0.64, 0);
  nozzleGeos.push(sprayPipe.index ? sprayPipe.toNonIndexed() : sprayPipe);

  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const nz = new THREE.CylinderGeometry(0.016, 0.028, 0.14, 6);
    nz.translate(Math.cos(a) * 3.38, 0.70, Math.sin(a) * 3.38);
    nozzleGeos.push(nz.index ? nz.toNonIndexed() : nz);
  }

  // Stainless Steel Tubular Perimeter Railing (matches U01, S10, S11!)
  const railTorus = new THREE.TorusGeometry(3.76, 0.048, 10, 48);
  railTorus.rotateX(Math.PI / 2);
  railTorus.translate(0, 1.44, 0);
  chromeGeos.push(railTorus.index ? railTorus.toNonIndexed() : railTorus);

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const px = Math.cos(a) * 3.76;
    const pz = Math.sin(a) * 3.76;
    const post = new THREE.CylinderGeometry(0.034, 0.038, 0.36, 8);
    post.translate(px, 1.26, pz);
    chromeGeos.push(post.index ? post.toNonIndexed() : post);

    const flange = new THREE.CylinderGeometry(0.072, 0.08, 0.04, 8);
    flange.translate(px, 1.12, pz);
    chromeGeos.push(flange.index ? flange.toNonIndexed() : flange);
  }

  // White-Tiled Center Cylindrical Pedestal + 3 Individual Square/Octagonal White-Tiled Plinths (S09, S11!)
  const centerPed = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.60, 0.94, 16), bank.tiledPed);
  centerPed.position.y = 0.72;
  centerPed.castShadow = true;
  centerPed.receiveShadow = true;
  mon.add(centerPed);

  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.35;
    const ped = new THREE.Mesh(new THREE.BoxGeometry(0.84, 1.04, 0.84), bank.tiledPed);
    ped.position.set(Math.cos(a) * 1.44, 0.78, Math.sin(a) * 1.44);
    ped.rotation.y = -a;
    ped.castShadow = true;
    ped.receiveShadow = true;
    mon.add(ped);

    const { prawnGeos, whiskerGeos, eyeGeos } = buildSingleGoldaPrawnGeometries(-a);
    allPrawnGeos.push(...prawnGeos);
    allWhiskerGeos.push(...whiskerGeos);
    allEyeGeos.push(...eyeGeos);
  }

  // FULL CENTRAL BILLBOARD MAST + STEEL CLIMBING RUNGS (U01!) + TRIANGULAR 3-SIDED BILLBOARD BRACING
  const mastH = 10.6;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, mastH, 16), bank.galvanizedPole);
  pole.position.y = 0.95 + mastH * 0.5;
  pole.castShadow = true;
  mon.add(pole);
  // Welded steel climbing rungs up the central mast (visible clearly in U01!)
  for (let ry = 2.0; ry <= 6.0; ry += 0.55) {
    const rung = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.14), bank.steelDark);
    rung.position.set(-0.28, ry, 0);
    mon.add(rung);
  }

  // Small vertical ad panel mid-way up the mast (visible in S10 & S11!)
  addSignBox(
    mon,
    bank,
    { title: 'খুলনা', subtitle: 'KCC', bg: '#f8fafc', fg: '#b91c1c', accent: '#1e3a8a', width: 256, height: 256, align: 'center' },
    [0.29, 5.15, 0],
    Math.PI * 0.5,
    0.58,
    0.95,
  );

  // Triangular Steel Truss & Bracing Frame at top of mast (y = 6.6m to 10.4m, matches S02!)
  const trussYBottom = 6.8;
  const trussYTop = 10.3;
  const boardR = 2.05;
  const boardW = 3.65;
  const boardH = 2.95;

  // Lower collar & diagonal steel struts holding the 3-sided billboard prism
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.35, 12), bank.steelDark);
  collar.position.y = 6.25;
  mon.add(collar);

  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2 + 0.42;
    const nextAng = ((i + 1) / 3) * Math.PI * 2 + 0.42;
    const cx = Math.cos(ang) * boardR;
    const cz = Math.sin(ang) * boardR;
    const nx = Math.cos(nextAng) * boardR;
    const nz = Math.sin(nextAng) * boardR;

    // Corner vertical truss post & diagonal struts from central mast
    rodBetween(mon, [0, 6.25, 0], [cx, trussYBottom, cz], 0.065, bank.steelDark, 6);
    rodBetween(mon, [0, trussYTop + 0.3, 0], [cx, trussYTop, cz], 0.055, bank.steelDark, 6);
    rodBetween(mon, [cx, trussYBottom, cz], [cx, trussYTop, cz], 0.065, bank.steelDark, 6);
    rodBetween(mon, [cx, trussYBottom, cz], [nx, trussYBottom, nz], 0.055, bank.steelDark, 6);
    rodBetween(mon, [cx, trussYTop, cz], [nx, trussYTop, nz], 0.055, bank.steelDark, 6);
    // Triangular internal cross-bracing visible from above (S02!)
    rodBetween(mon, [0, trussYTop, 0], [(cx + nx) * 0.5, trussYTop, (cz + nz) * 0.5], 0.045, bank.steelDark, 6);

    // Illuminated Billboard Face on each of the 3 sides!
    const faceMidX = (cx + nx) * 0.5;
    const faceMidZ = (cz + nz) * 0.5;
    const faceYaw = Math.atan2(faceMidX, faceMidZ);
    const bbTex = makeBillboardArtTexture(i);
    const bbMat = new THREE.MeshStandardMaterial({
      map: bbTex,
      emissive: 0xffffff,
      emissiveMap: bbTex,
      emissiveIntensity: 0.42,
      roughness: 0.28,
      metalness: 0.08,
    });
    bank.emissiveList.push({ mat: bbMat, day: 0.38, night: 1.55 });

    const bbGroup = new THREE.Group();
    bbGroup.position.set(faceMidX, (trussYBottom + trussYTop) * 0.5, faceMidZ);
    bbGroup.rotation.y = faceYaw;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(boardW + 0.16, boardH + 0.16, 0.14), bank.steelDark);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(boardW, boardH), bbMat);
    panel.position.z = 0.08;
    // Billboard overhead floodlight arms
    for (const lx of [-1.0, 1.0]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.72), bank.steelDark);
      arm.position.set(lx, boardH * 0.5 + 0.12, 0.38);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.14), bank.lampGlow);
      lamp.position.set(lx, boardH * 0.5 + 0.08, 0.68);
      bbGroup.add(arm, lamp);
    }
    bbGroup.add(frame, panel);
    mon.add(bbGroup);
  }

  const addMerged = (geos, mat, cast = true, receive = true) => {
    if (!geos.length) return;
    const merged = mergeGeometries(geos, false);
    for (const g of geos) g.dispose();
    if (!merged) return;
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    mon.add(mesh);
  };

  addMerged(brickGeos, bank.fountainBrickVC, true, true);
  addMerged(basinGeos, bank.fountainBasinVC, true, true);
  addMerged(nozzleGeos, bank.fountainNozzleTeal, false, true);
  addMerged(chromeGeos, bank.stainlessChrome, true, true);
  addMerged(allPrawnGeos, bank.prawnChitin, true, true);
  addMerged(allWhiskerGeos, bank.prawnWhisker, false, false);
  addMerged(allEyeGeos, bank.prawnEye, false, false);

  const waterDisc = new THREE.Mesh(new THREE.CylinderGeometry(3.48, 3.48, 0.08, 36), bank.fountainWater);
  waterDisc.position.y = 0.66;
  mon.add(waterDisc);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const bulb = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.18, 0.16, 10),
      i % 2 === 0 ? bank.uplightGold : bank.uplightCyan,
    );
    bulb.position.set(Math.cos(a) * 2.55, 0.72, Math.sin(a) * 2.55);
    mon.add(bulb);
  }

  const fountainJets = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const jetCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * 3.34, 0.76, Math.sin(a) * 3.34),
      new THREE.Vector3(Math.cos(a) * 2.15, 2.30 + (i % 2) * 0.32, Math.sin(a) * 2.15),
      new THREE.Vector3(Math.cos(a) * 1.18, 0.80, Math.sin(a) * 1.18),
    ]);
    const jet = new THREE.Mesh(new THREE.TubeGeometry(jetCurve, 12, 0.036, 5, false), bank.sprayJet);
    mon.add(jet);
    fountainJets.push({ mesh: jet, phase: i * 0.55 });
  }

  return fountainJets;
}

/* ============================================================================
 * 4. HOTEL ROYAL INTERNATIONAL (WNW Corner — Exact Match to B02, B01, B07, S03)
 * Features 3-story semicircular curved podium, rooftop garden, 9-story cream
 * tower, pale boundary wall & black gate, and red HERLAN (A-33) corner bay!
 * ========================================================================== */
function buildHotelRoyalInternational(staticG, dynamicG, bank, phys) {
  // Real-world WNW placement from Page 1 map:
  // Curved podium faces ESE toward the fountain; tall tower sits behind it to WNW!
  const podX = -751.5;
  const podZ = -310.0;
  const podRotY = 0.54; // faces ESE directly toward the shrimp fountain!
  const podR = 11.2;
  const podH = 10.6;

  // Solid colliders for curved podium & rear tower
  phys.addCircle(podX, podZ, podR + 0.3, podH + 2);

  const g = new THREE.Group();
  g.position.set(podX, 0, podZ);
  g.rotation.y = podRotY;
  staticG.add(g);

  const dg = new THREE.Group();
  dg.position.set(podX, 0, podZ);
  dg.rotation.y = podRotY;
  dynamicG.add(dg);

  // --- A) 3-STORY SEMICIRCULAR CURVED PODIUM (B01, B07, S03) ---
  // Paved circular forecourt apron
  cylinder(g, podR + 1.8, podR + 2.0, 0.16, [0, 0.08, 0], bank.footpath, 28);
  // Core dark glass curved drum
  cylinder(g, podR - 0.35, podR - 0.35, podH, [0, podH * 0.5, 0], bank.glassCurtain, 28);

  // Crisp horizontal cream concrete fascia bands wrapping all 3 podium levels (B01, B07!)
  const bandYs = [0.22, 3.65, 6.95, 10.25];
  for (let i = 0; i < bandYs.length; i++) {
    const bh = i === 0 ? 0.44 : (i === 3 ? 0.92 : 0.88);
    cylinder(g, podR + 0.18, podR + 0.18, bh, [0, bandYs[i], 0], bank.royalCream, 28);
    // Subtle recessed cornice groove
    cylinder(g, podR + 0.26, podR + 0.26, 0.12, [0, bandYs[i] + bh * 0.48, 0], bank.royalSand, 28);
  }

  // Green ground-floor trim strip visible in drone photo B07
  cylinder(g, podR + 0.22, podR + 0.22, 0.42, [0, 3.32, 0], bank.awningGreen, 28);

  // Vertical structural columns & mounted white AC outdoor units along the curved podium (B01!)
  const colCount = 14;
  for (let i = 0; i < colCount; i++) {
    const a = (i / colCount) * Math.PI * 2;
    const cx = Math.cos(a) * (podR + 0.05);
    const cz = Math.sin(a) * (podR + 0.05);
    box(g, [0.44, podH, 0.44], [cx, podH * 0.5, cz], bank.royalCream);
    // Exterior white AC outdoor housings tucked on 2nd & 3rd curved ledges (B01)
    if (i % 2 === 0) {
      const acA = a + Math.PI / colCount;
      const ax = Math.cos(acA) * (podR - 0.05);
      const az = Math.sin(acA) * (podR - 0.05);
      addRotBox(g, [0.72, 0.48, 0.34], [ax, 4.38, az], bank.acBox, -acA);
      addRotBox(g, [0.72, 0.48, 0.34], [ax, 7.68, az], bank.acBox, -acA);
    }
  }

  // Illuminated warm interior glow behind curved podium windows
  cylinder(dg, podR - 0.52, podR - 0.52, 1.95, [0, 5.3, 0], bank.warmWindowLit, 20);
  cylinder(dg, podR - 0.52, podR - 0.52, 1.95, [0, 8.6, 0], bank.warmWindowLit, 20);

  // ROUNDED ROOFTOP TERRACE GARDEN on top of the 3-story curved podium (matches B07!)
  cylinder(g, podR + 0.12, podR + 0.12, 0.22, [0, podH + 0.12, 0], bank.footpath, 28);
  // Circular terrace parapet rim
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const len = (2 * Math.PI * podR) / 20 + 0.1;
    addRotBox(g, [0.24, 0.92, len], [Math.cos(a) * (podR - 0.02), podH + 0.62, Math.sin(a) * (podR - 0.02)], bank.royalCream, -a);
  }
  // Lush rooftop terrace shrubs, planters & café patio umbrellas (B07)
  const rndTerrace = seeded(207);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const rr = podR - 1.45;
    const px = Math.cos(a) * rr;
    const pz = Math.sin(a) * rr;
    box(g, [1.25, 0.52, 0.72], [px, podH + 0.42, pz], bank.royalTerracotta);
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55 + rndTerrace() * 0.25, 1), i % 2 === 0 ? bank.grassTurf : bank.foliageDeep);
    bush.position.set(px, podH + 0.92, pz);
    g.add(bush);
  }
  for (const [ux, uz] of [[3.2, 4.2], [-2.8, 5.2], [5.4, -1.2]]) {
    cylinder(g, 0.05, 0.06, 2.3, [ux, podH + 1.25, uz], bank.steelDark, 6);
    const umb = new THREE.Mesh(new THREE.ConeGeometry(1.45, 0.55, 8), bank.awningRed);
    umb.position.set(ux, podH + 2.42, uz);
    g.add(umb);
  }

  // "HOTEL ROYAL" bold red-accented fascia on curved podium rim (matches B01 & U01!)
  addSignBox(
    dg,
    bank,
    { title: 'HOTEL ROYAL INTERNATIONAL', subtitle: 'হোটেল রয়েল ইন্টারন্যাশনাল · KHULNA', bg: '#e8dfc8', fg: '#b91c1c', accent: '#1e293b', border: '#991b1b', width: 640, align: 'center' },
    [0, 10.35, podR + 0.34],
    0,
    9.2,
    1.15,
  );

  // --- B) RED HERLAN (A-33) CORNER SHOWROOM AT GROUND LEVEL (matches S03 & Camera A!) ---
  // Positioned on the south-facing curve toward KDA Avenue & junction
  const herlanG = new THREE.Group();
  herlanG.position.set(-2.4, 0, podR - 0.15);
  herlanG.rotation.y = -0.22;
  g.add(herlanG);
  const herlanDG = new THREE.Group();
  herlanDG.position.set(-2.4, 0, podR - 0.15);
  herlanDG.rotation.y = -0.22;
  dg.add(herlanDG);

  box(herlanG, [7.6, 3.45, 2.2], [0, 1.725, 0], bank.herlanRed);
  box(herlanDG, [6.6, 2.35, 0.16], [0, 1.32, 1.12], bank.dispHerlan, { castShadow: false });
  addSignBox(
    herlanDG,
    bank,
    { title: 'HERLAN', subtitle: 'A-33 KDA AVENUE · AUTHENTIC COSMETICS', bg: '#dc2626', fg: '#ffffff', accent: '#fef08a', border: '#ffffff', width: 512, align: 'center' },
    [0, 3.12, 1.18],
    0,
    7.4,
    1.05,
  );

  // --- C) 9-STORY CREAM/GREY MAIN HOTEL TOWER BEHIND THE CURVED PODIUM (matches B02, B06, B07, S03!) ---
  const twX = -763.5;
  const twZ = -319.5;
  const twRotY = 0.22;
  const twW = 22.0;
  const twD = 14.5;
  const twFloors = 9;
  const twFlH = 3.15;
  const twH = 4.2 + (twFloors - 1) * twFlH; // ~29.4m

  phys.addOBB(twX, twZ, twW, twD, twRotY, twH + 4);

  const tg = new THREE.Group();
  tg.position.set(twX, 0, twZ);
  tg.rotation.y = twRotY;
  staticG.add(tg);

  const tdg = new THREE.Group();
  tdg.position.set(twX, 0, twZ);
  tdg.rotation.y = twRotY;
  dynamicG.add(tdg);

  box(tg, [twW, twH, twD], [0, twH * 0.5, 0], bank.royalCream, { uvScale: 3.0 });
  // Vertical architectural fins matching B02 & S03
  for (const fx of [-10.8, -5.4, 0, 5.4, 10.8]) {
    box(tg, [0.58, twH + 0.6, 0.58], [fx, twH * 0.5 + 0.3, twD * 0.5 + 0.15], bank.royalSand);
  }
  const rnd = seeded(1986);
  for (let f = 1; f < twFloors; f++) {
    const fy = 4.2 + (f - 1) * twFlH;
    box(tg, [twW + 0.45, 0.22, twD + 0.45], [0, fy, 0], bank.royalSand);
    for (const wx of [-8.2, -2.7, 2.7, 8.2]) {
      const lit = rnd() > 0.40;
      const wMat = lit ? (rnd() > 0.4 ? bank.warmWindowLit : bank.coolWindowLit) : bank.glassCurtain;
      box(lit ? tdg : tg, [3.6, 1.55, 0.16], [wx, fy + 1.55, twD * 0.5 + 0.04], wMat, { castShadow: false });
      box(tg, [3.6, 1.55, 0.16], [wx, fy + 1.55, -twD * 0.5 - 0.04], bank.glassCurtain, { castShadow: false });
    }
    for (const sx of [-1, 1]) {
      for (const wz of [-4.2, 0, 4.2]) {
        const litS = rnd() > 0.5;
        box(litS ? tdg : tg, [0.16, 1.55, 2.2], [sx * (twW * 0.5 + 0.04), fy + 1.55, wz], litS ? bank.warmWindowLit : bank.glassCurtain, { castShadow: false });
      }
    }
  }

  // Rooftop stairhead & parapet (matches B02!)
  box(tg, [twW + 0.6, 1.15, twD + 0.6], [0, twH + 0.58, 0], bank.royalSand);
  box(tg, [7.5, 2.8, 6.2], [-2.5, twH + 2.4, -1.5], bank.royalCream);
  cylinder(tg, 0.72, 0.76, 1.45, [5.5, twH + 1.8, -2.0], bank.waterTank, 10);

  // Iconic Vertical Signboard on Tower Facade (matches B02 & S03!)
  const vTex = makeVerticalTowerSignTexture('HOTEL ROYAL INTL', '#1e3a5f', '#fef08a');
  const vMat = new THREE.MeshStandardMaterial({ map: vTex, emissive: 0xffffff, emissiveMap: vTex, emissiveIntensity: 0.35, roughness: 0.3 });
  bank.emissiveList.push({ mat: vMat, day: 0.32, night: 1.45 });
  const vSign = new THREE.Mesh(new THREE.BoxGeometry(2.2, 11.5, 0.24), vMat);
  vSign.position.set(8.8, twH - 6.8, twD * 0.5 + 0.32);
  tdg.add(vSign);

  addSignBox(
    tdg,
    bank,
    { title: 'HOTEL ROYAL INTERNATIONAL', subtitle: 'হোটেল রয়েল ইন্টারন্যাশনাল · খুলনা', bg: '#0f172a', fg: '#fef08a', accent: '#f59e0b', border: '#f59e0b', width: 640, align: 'center' },
    [0, twH + 1.8, twD * 0.5 + 0.42],
    0,
    14.5,
    2.1,
  );

  // --- D) PALE BOUNDARY WALL & BLACK ENTRANCE GATE ON KHAN JAHAN ALI RD SIDE (matches Camera B!) ---
  const wallX = -737.5;
  const wallZ = -319.0;
  const wallRotY = -0.54;
  addRotBox(staticG, [0.32, 2.15, 11.0], [wallX, 1.075, wallZ], bank.royalCream, wallRotY);
  addRotBox(staticG, [0.44, 0.18, 11.2], [wallX, 2.20, wallZ], bank.royalSand, wallRotY);
  // Black iron entrance gate bay
  addRotBox(staticG, [0.18, 2.35, 4.2], [-734.2, 1.18, -313.5], bank.steelDark, wallRotY);
  phys.addOBB(wallX, wallZ, 0.6, 11.0, wallRotY, 2.4);
}

/* ============================================================================
 * 5. HOTEL CASTLE SALAM (SSE Corner — Exact Match to B03, S13, B08, S08, B05)
 * Iconic Pink Masonry Frame + Reflective Blue Glazing + Recessed Balconies +
 * Dark Maroon Canopy with White Cursive "Hotel Castle Salam" & Green Glass!
 * ========================================================================== */
function addParkedSedan(parent, bank, x, y, z, rotY, bodyMat) {
  const car = new THREE.Group();
  car.position.set(x, y, z);
  car.rotation.y = rotY;
  box(car, [1.72, 0.62, 4.15], [0, 0.52, 0], bodyMat);
  box(car, [1.50, 0.52, 2.05], [0, 1.04, -0.15], bank.glassCurtain);
  for (const [wx, wz] of [[-0.84, 1.25], [0.84, 1.25], [-0.84, -1.25], [0.84, -1.25]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12), bank.tireBlack);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.32, wz);
    car.add(w);
  }
  parent.add(car);
}

function buildHotelCastleSalam(staticG, dynamicG, bank, phys) {
  // Real-world SSE footprint from Page 1 map (East +12m, North -36m -> world -704.8, -255.8)!
  const hx = -704.8;
  const hz = -255.8;
  const rotY = Math.PI - 0.16; // faces NNW directly across the junction toward Royal & Camera J!
  const W = 24.5;
  const D = 14.5;
  const gfH = 4.6;
  const flH = 3.25;
  const floors = 7;
  const totalH = gfH + (floors - 1) * flH;

  phys.addOBB(hx, hz, W, D, rotY, totalH + 4);

  const g = new THREE.Group();
  g.position.set(hx, 0, hz);
  g.rotation.y = rotY;
  staticG.add(g);

  const dg = new THREE.Group();
  dg.position.set(hx, 0, hz);
  dg.rotation.y = rotY;
  dynamicG.add(dg);

  // Forecourt apron & red carpet entry
  box(g, [W + 3.0, 0.16, D + 4.0], [0, 0.08, 1.4], bank.footpath, { castShadow: false, uvScale: 2.2 });
  box(g, [3.6, 0.18, 3.0], [-2.5, 0.10, D * 0.5 + 1.2], bank.redCarpet, { castShadow: false });

  // Ground Floor: Recessed Lobby with Green-Tinted Entrance Glass (B08!) + Open Guest Parking Bay on right
  box(g, [W, gfH, D - 3.8], [0, gfH * 0.5, -1.9], bank.castlePink, { uvScale: 2.6 });
  box(g, [13.5, gfH, 3.8], [-5.2, gfH * 0.5, D * 0.5 - 1.9], bank.castlePinkDeep, { uvScale: 2.4 });
  // Green-tinted recessed glass entrance (matches B08!)
  box(g, [8.6, 3.6, 0.28], [-3.2, 1.95, D * 0.5 - 0.35], bank.castleGreenGlass);
  box(dg, [7.8, 3.1, 0.14], [-3.2, 1.90, D * 0.5 - 0.58], bank.warmWindowLit, { castShadow: false });

  // Open Side Parking Bay with structural pillars & 2 parked cars
  box(g, [9.2, 0.14, 4.0], [7.4, 0.14, D * 0.5 - 1.9], bank.darkConcrete, { castShadow: false });
  for (const gx of [2.8, 7.4, 11.8]) {
    cylinder(g, 0.28, 0.32, gfH, [gx, gfH * 0.5, D * 0.5 - 0.25], bank.castlePink, 10);
  }
  addParkedSedan(g, bank, 5.1, 0.18, D * 0.5 - 2.0, 0.05, bank.carNavy);
  addParkedSedan(g, bank, 9.6, 0.18, D * 0.5 - 2.0, -0.05, bank.carSilver);

  // Iconic Dark Maroon Entrance Canopy with White Cursive Script "Hotel Castle Salam" (matches B08!)
  box(g, [11.6, 0.62, 2.8], [-3.0, 4.35, D * 0.5 + 1.15], bank.castleCanopyMaroon);
  box(g, [11.8, 0.14, 2.95], [-3.0, 4.70, D * 0.5 + 1.15], bank.marbleWhite);
  for (const cx of [-8.2, 2.2]) {
    box(g, [0.55, 4.2, 0.55], [cx, 2.1, D * 0.5 + 2.15], bank.castlePink);
  }
  addSignBox(
    dg,
    bank,
    {
      title: 'Hotel Castle Salam',
      subtitle: '',
      bg: '#5c2428',
      fg: '#ffffff',
      accent: null,
      border: '#e5e7eb',
      width: 640,
      height: 156,
      italic: true,
      align: 'center',
    },
    [-3.0, 4.36, D * 0.5 + 2.60],
    0,
    9.2,
    0.84,
  );

  // 7-Story Dusty-Pink Masonry Frame + Reflective Blue Glazing Curtain Wall (matches B03 & S13!)
  box(g, [W, totalH - gfH, D], [0, gfH + (totalH - gfH) * 0.5, 0], bank.castlePink, { uvScale: 3.0 });
  // Wide central & side reflective blue curtain-glass bays (B03, S13)
  box(g, [W - 3.2, totalH - gfH - 0.4, 0.34], [0, gfH + (totalH - gfH) * 0.5, D * 0.5 + 0.05], bank.castleBlueGlass);

  // Pink structural vertical pilasters & horizontal balcony slabs framing the blue glass (B03, S13!)
  for (const px of [-W * 0.5 + 0.7, -6.2, 0.0, 6.2, W * 0.5 - 0.7]) {
    box(g, [1.25, totalH + 1.2, 1.05], [px, (totalH + 1.2) * 0.5, D * 0.5 + 0.18], bank.castlePink);
  }
  const rnd = seeded(1996);
  for (let f = 1; f < floors; f++) {
    const fy = gfH + (f - 1) * flH;
    // Projecting pink/white horizontal balcony slabs across front elevation
    box(g, [W + 0.55, 0.34, D + 0.75], [0, fy, 0.15], bank.castlePink);
    box(g, [W + 0.60, 0.12, 0.95], [0, fy + 0.22, D * 0.5 + 0.45], bank.marbleWhite);
    for (const wx of [-9.0, -3.1, 3.1, 9.0]) {
      const lit = rnd() > 0.45;
      if (lit) {
        box(dg, [3.6, 1.75, 0.12], [wx, fy + 1.65, D * 0.5 + 0.24], bank.warmWindowLit, { castShadow: false });
      }
      // Balcony railing band
      box(g, [4.6, 0.68, 0.10], [wx, fy + 0.58, D * 0.5 + 0.86], bank.castlePinkDeep);
      box(g, [3.4, 1.65, 0.16], [wx, fy + 1.65, -D * 0.5 - 0.04], bank.castleBlueGlass, { castShadow: false });
    }
    for (const sx of [-1, 1]) {
      for (const wz of [-4.2, 0, 4.2]) {
        box(g, [0.16, 1.65, 2.2], [sx * (W * 0.5 + 0.04), fy + 1.65, wz], bank.castleBlueGlass, { castShadow: false });
      }
    }
  }

  // Rooftop Pink Parapet & Crown
  box(g, [W + 0.8, 1.35, D + 0.8], [0, totalH + 0.68, 0], bank.castlePinkDeep);
  box(g, [W + 0.95, 0.22, D + 0.95], [0, totalH + 1.40, 0], bank.marbleWhite);
  box(g, [8.0, 2.6, 6.0], [0, totalH + 2.4, -1.0], bank.castlePink);

  addSignBox(
    dg,
    bank,
    {
      title: 'HOTEL CASTLE SALAM',
      subtitle: 'হোটেল ক্যাসেল সালাম · রয়্যাল মোড়, খুলনা',
      bg: '#5c2428',
      fg: '#ffffff',
      accent: '#fde047',
      border: '#f59e0b',
      width: 640,
      align: 'center',
    },
    [0, totalH + 2.15, D * 0.5 + 0.58],
    0,
    14.0,
    2.1,
  );
}

/* ============================================================================
 * 6. ADJACENT PINK RETAIL ROW BESIDE CASTLE SALAM + GIANT BILLBOARD FRAME
 * Matches B05, B03, S08 & Camera J (Samsung, Xiaomi, Rosh Mohol S1)!
 * ========================================================================== */
function buildCastleAdjacentShopRow(staticG, dynamicG, bank, phys) {
  // West/right-from-junction side of Castle Salam (around Pin S1: East +4m, North -27m -> -724, -259)
  const cx = -724.5;
  const cz = -258.5;
  const rotY = Math.PI - 0.16;
  const W = 17.5;
  const D = 11.2;
  const H = 10.2;

  phys.addOBB(cx, cz, W, D, rotY, H + 8);

  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = rotY;
  staticG.add(g);

  const dg = new THREE.Group();
  dg.position.set(cx, 0, cz);
  dg.rotation.y = rotY;
  dynamicG.add(dg);

  // Pink masonry 3-story retail block matching B05 & S08!
  box(g, [W + 0.8, 0.16, D + 1.6], [0, 0.08, 0.5], bank.footpath, { castShadow: false, uvScale: 2.0 });
  box(g, [W, H, D], [0, H * 0.5, 0], bank.castlePink, { uvScale: 2.8 });
  for (const fy of [3.8, 7.0, 10.2]) {
    box(g, [W + 0.4, 0.24, D + 0.4], [0, fy, 0], bank.marbleWhite);
  }

  // 3 Narrow Dated Shop Bays: SAMSUNG, XIAOMI, ROSH MOHOL SWEETMEAT (S1)
  const shops = [
    { x: -5.6, title: 'SAMSUNG', sub: 'SMARTPHONE GALLERY · ROYAL MOR', bg: '#1e3a8a', accent: '#ffffff', mat: bank.dispElec },
    { x: 0.0, title: 'Xiaomi · Mi STORE', sub: 'AUTHORIZED SHOWROOM · KHULNA', bg: '#ea580c', accent: '#ffffff', mat: bank.dispElec },
    { x: 5.6, title: 'রসমহল সুইটমিট শপ', sub: 'ROSH MOHOL SWEETMEAT · ROYAL MOR', bg: '#7c2d12', accent: '#fde047', mat: bank.dispSweets },
  ];
  for (const s of shops) {
    box(dg, [5.0, 2.55, 0.14], [s.x, 1.42, D * 0.5 + 0.04], s.mat, { castShadow: false });
    box(g, [5.2, 0.14, 0.95], [s.x, 2.86, D * 0.5 + 0.35], bank.corrugatedTin);
    addSignBox(
      dg,
      bank,
      { title: s.title, subtitle: s.sub, bg: s.bg, accent: s.accent, width: 448, height: 156, align: 'center' },
      [s.x, 3.48, D * 0.5 + 0.24],
      0,
      5.3,
      0.98,
    );
    // Upper floor windows
    for (const fy of [5.3, 8.5]) {
      box(g, [3.6, 1.5, 0.16], [s.x, fy, D * 0.5 + 0.06], bank.glassCurtain, { castShadow: false });
    }
  }

  // GIANT STEEL ROOFTOP BILLBOARD FRAME above Xiaomi/Samsung row (matches S08, B03, Camera J!)
  for (const px of [-6.0, 0.0, 6.0]) {
    cylinder(g, 0.14, 0.16, 7.6, [px, H + 3.8, D * 0.5 - 0.8], bank.steelDark, 6);
    rodBetween(g, [px, H, D * 0.5 - 3.2], [px, H + 6.8, D * 0.5 - 0.8], 0.08, bank.steelDark, 5);
  }
  const bigBBTex = makeBillboardArtTexture(2);
  const bigBBMat = new THREE.MeshStandardMaterial({ map: bigBBTex, emissive: 0xffffff, emissiveMap: bigBBTex, emissiveIntensity: 0.38, roughness: 0.3 });
  bank.emissiveList.push({ mat: bigBBMat, day: 0.35, night: 1.45 });
  const bbMesh = new THREE.Mesh(new THREE.BoxGeometry(14.5, 6.8, 0.24), bigBBMat);
  bbMesh.position.set(0, H + 4.4, D * 0.5 - 0.65);
  dg.add(bbMesh);
}

/* ============================================================================
 * 7. SATKHIRA ADI JADOB GHOSH DAIRY (Photo G01 — 54 Khan Jahan Ali Rd, Pin S3)
 * Authentic yellow Bengali sign, corrugated metal awning, glass sweet case,
 * plus adjacent "গোল্ডেন লাইফ" & "মাহা" signs!
 * ========================================================================== */
function buildSatkhiraJadobGhoshDairy(staticG, dynamicG, bank, phys) {
  // Real pin S3 (~39m E, 9m S of fountain) tucked cleanly behind NE footpath of SE Khan Jahan Ali Rd!
  const cx = -675.0;
  const cz = -284.5;
  const seAngle = Math.atan2(-67, -42);
  const rotY = seAngle + Math.PI * 0.5;
  const W = 16.5;
  const D = 10.5;
  const H = 12.8;

  phys.addOBB(cx, cz, W, D, rotY, H + 2);

  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = rotY;
  staticG.add(g);

  const dg = new THREE.Group();
  dg.position.set(cx, 0, cz);
  dg.rotation.y = rotY;
  dynamicG.add(dg);

  box(g, [W + 0.6, 0.16, D + 1.4], [0, 0.08, 0.45], bank.footpath, { castShadow: false, uvScale: 2.0 });
  box(g, [W, H, D], [0, H * 0.5, 0], bank.royalSand, { uvScale: 2.8 });

  // Ground-floor blue header & illuminated glass sweet display case (matches G01!)
  box(g, [6.4, 3.4, 0.25], [0, 1.7, D * 0.5 + 0.02], bank.awningBlue);
  box(dg, [5.6, 2.35, 0.16], [0, 1.25, D * 0.5 + 0.12], bank.dispSweets, { castShadow: false });
  // Glass showcase counter projecting slightly onto the storefront
  box(g, [4.6, 1.05, 0.82], [0, 0.62, D * 0.5 + 0.52], bank.glassLobby);
  box(g, [4.7, 0.08, 0.88], [0, 1.16, D * 0.5 + 0.52], bank.aluminum);

  // Slanted corrugated tin awning across the entire frontage (matches G01!)
  const awning = addRotBox(g, [W - 0.4, 0.10, 1.85], [0, 2.95, D * 0.5 + 0.82], bank.corrugatedTin, 0);
  awning.rotation.x = 0.22;

  // Adjacent shuttered shop bays left & right
  box(dg, [4.4, 2.45, 0.14], [-5.6, 1.35, D * 0.5 + 0.06], bank.dispPharm, { castShadow: false });
  box(g, [4.4, 2.45, 0.14], [5.6, 1.35, D * 0.5 + 0.06], bank.shutter, { castShadow: false });

  // Iconic Yellow Bengali Signboard: সাতক্ষীরা আদি যাদব ঘোষ ডেইরী (matches G01!)
  addSignBox(
    dg,
    bank,
    {
      title: 'আদি যাদব ঘোষ ডেইরী',
      subtitle: '৫৪ খান জাহান আলী রোড · সাতক্ষীরার ঐতিহ্যবাহী মিষ্টান্ন',
      bg: '#eab308',
      fg: '#7f1d1d',
      accent: '#1e3a8a',
      border: '#78350f',
      width: 576,
      height: 184,
      align: 'center',
    },
    [0, 4.15, D * 0.5 + 0.26],
    0,
    6.4,
    1.55,
  );
  // Flanking signs visible in G01: "মাহা" (left) & "গোল্ডেন লাইফ" (right)
  addSignBox(
    dg,
    bank,
    { title: 'মাহা টেলিকম', subtitle: 'ROYAL MORE', bg: '#b91c1c', fg: '#ffffff', accent: '#fde047', width: 384, height: 156, align: 'center' },
    [-5.6, 4.05, D * 0.5 + 0.24],
    0,
    4.3,
    1.25,
  );
  addSignBox(
    dg,
    bank,
    { title: 'গোল্ডেন লাইফ', subtitle: '৫৪ খান জাহান আলী রোড', bg: '#d4b483', fg: '#1e293b', accent: '#7c2d12', border: '#475569', width: 384, height: 156, align: 'center' },
    [5.6, 4.05, D * 0.5 + 0.24],
    0,
    4.3,
    1.25,
  );

  // Upper 3 floors with balconies & AC boxes
  for (let f = 1; f < 4; f++) {
    const fy = 4.6 + (f - 1) * 2.8;
    box(g, [W + 0.35, 0.20, D + 0.35], [0, fy, 0], bank.marbleWhite);
    for (const wx of [-5.2, 0, 5.2]) {
      box(g, [3.2, 1.55, 0.16], [wx, fy + 1.35, D * 0.5 + 0.06], bank.glassCurtain, { castShadow: false });
      box(g, [3.6, 0.65, 0.62], [wx, fy + 0.42, D * 0.5 + 0.34], bank.royalTerracotta);
    }
  }
}

/* ============================================================================
 * 8. AUTHENTIC ROYAL MORE BUS COUNTER STRIP (Original-Style Brand Logos & Banners)
 * ========================================================================== */
function makeBusCounterBannerTexture(cInfo) {
  const W = 640;
  const H = 224;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, cInfo.bg);
  grad.addColorStop(0.65, cInfo.bg2 || cInfo.bg);
  grad.addColorStop(1, '#090d16');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.moveTo(W - 170, 0);
  ctx.lineTo(W - 70, 0);
  ctx.lineTo(W - 140, H);
  ctx.lineTo(W - 240, H);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = cInfo.accent || '#fde047';
  ctx.lineWidth = 7;
  ctx.strokeRect(5, 5, W - 10, H - 10);

  // Original-style Brand Emblem Circle Logo on Left
  const lx = 78;
  const ly = 96;
  ctx.save();
  ctx.fillStyle = cInfo.logoBg || '#ffffff';
  ctx.beginPath();
  ctx.arc(lx, ly, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = cInfo.accent || '#fde047';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = cInfo.logoFg || cInfo.bg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 34px "Manrope", "Arial Black", sans-serif';
  ctx.fillText(cInfo.mono, lx, ly - 5);
  ctx.fillStyle = cInfo.logoSubFg || '#dc2626';
  ctx.font = 'bold 13px "Manrope", sans-serif';
  ctx.fillText(cInfo.badge, lx, ly + 24);
  ctx.restore();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText(cInfo.name, 148, 62, W - 170);

  ctx.fillStyle = cInfo.accent || '#fde047';
  ctx.font = '800 22px "Manrope", sans-serif';
  ctx.fillText(cInfo.enBrand, 148, 108, W - 170);

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(12, 152, W - 24, 58);
  ctx.fillStyle = cInfo.accent || '#fde047';
  ctx.fillRect(12, 152, 8, 58);
  ctx.fillStyle = '#f8fafc';
  ctx.font = '600 19px "Noto Sans Bengali", "Manrope", sans-serif';
  ctx.fillText(cInfo.route, 30, 174, W - 50);
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 17px "Manrope", "Noto Sans Bengali", sans-serif';
  ctx.fillText(`রয়্যাল মোড় কাউন্টার · ${cInfo.hotline}`, 30, 198, W - 50);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function buildBusCounterStrip(staticG, dynamicG, bank, phys) {
  const bx = -797.5;
  const bz = -260.0;
  const rotY = Math.PI - 0.11;
  const counters = [
    {
      name: 'গ্রীন লাইন পরিবহন',
      enBrand: 'GREEN LINE PARIBAHAN · SCANIA / VOLVO AC',
      mono: 'GL',
      badge: 'AC COACH',
      route: 'খুলনা ⇄ ঢাকা (পদ্মা সেতু) · চট্টগ্রাম · কক্সবাজার',
      hotline: 'হটলাইন: ১৬৫৫৭',
      bg: '#046c4e', bg2: '#064e3b', accent: '#fde047', logoBg: '#ffffff', logoFg: '#046c4e', logoSubFg: '#dc2626',
    },
    {
      name: 'সোহাগ পরিবহন (প্রাঃ) লিঃ',
      enBrand: 'SHOHAGH PARIBAHAN · BUSINESS CLASS AC',
      mono: 'SP',
      badge: 'SCANIA',
      route: 'খুলনা ⇄ ঢাকা · যশোর · বেনাপোল · কলকাতা',
      hotline: 'হটলাইন: ০৯৬০৬-৪৪৪৭৭৭',
      bg: '#b91c1c', bg2: '#7f1d1d', accent: '#fef08a', logoBg: '#fef08a', logoFg: '#991b1b', logoSubFg: '#1e293b',
    },
    {
      name: 'হানিফ এন্টারপ্রাইজ',
      enBrand: 'HANIF ENTERPRISE · NON-STOP AC / NON-AC',
      mono: 'HE',
      badge: 'EXPRESS',
      route: 'খুলনা ⇄ ঢাকা (গাবতলী · সায়েদাবাদ) · সিলেট',
      hotline: 'রয়্যাল মোড় কাউন্টার নং-৩',
      bg: '#1d4ed8', bg2: '#1e3a8a', accent: '#38bdf8', logoBg: '#ffffff', logoFg: '#1d4ed8', logoSubFg: '#ea580c',
    },
    {
      name: 'এনা ট্রান্সপোর্ট (প্রাঃ) লিঃ',
      enBrand: 'ENA TRANSPORT · HYUNDAI UNIVERSE AC',
      mono: 'ENA',
      badge: 'HYUNDAI',
      route: 'খুলনা ⇄ ঢাকা (মহাখালী · উত্তরা) · চট্টগ্রাম',
      hotline: '২৪ ঘণ্টা টিকেট বুকিং',
      bg: '#9a3412', bg2: '#7c2d12', accent: '#fde047', logoBg: '#fde047', logoFg: '#7c2d12', logoSubFg: '#0f172a',
    },
    {
      name: 'ঈগল পরিবহন',
      enBrand: 'EAGLE PARIBAHAN · ROYAL COACH',
      mono: 'EG',
      badge: 'ROYAL',
      route: 'খুলনা ⇄ ঢাকা · কুষ্টিয়া · রাজশাহী · বগুড়া',
      hotline: 'রয়্যাল মোড় কাউন্টার নং-৫',
      bg: '#0f766e', bg2: '#115e59', accent: '#a7f3d0', logoBg: '#ffffff', logoFg: '#0f766e', logoSubFg: '#b91c1c',
    },
    {
      name: 'টুঙ্গিপাড়া এক্সপ্রেস',
      enBrand: 'TUNGIPARA EXPRESS · PADMA BRIDGE SPECIAL',
      mono: 'TE',
      badge: 'EXPRESS',
      route: 'খুলনা ⇄ গোপালগঞ্জ ⇄ ঢাকা (গুলিস্তান · সায়েদাবাদ)',
      hotline: 'প্রতি ৩০ মিনিটে বাস ছাড়ে',
      bg: '#5b21b6', bg2: '#3b0764', accent: '#fde047', logoBg: '#ffffff', logoFg: '#5b21b6', logoSubFg: '#dc2626',
    },
  ];

  const bayW = 7.4;
  const W = counters.length * bayW;
  const D = 11.5;
  const gfH = 4.2;
  const totalH = gfH + 6.4;

  phys.addOBB(bx, bz, W, D, rotY, totalH + 2);

  const g = new THREE.Group();
  g.position.set(bx, 0, bz);
  g.rotation.y = rotY;
  staticG.add(g);

  const dg = new THREE.Group();
  dg.position.set(bx, 0, bz);
  dg.rotation.y = rotY;
  dynamicG.add(dg);

  box(g, [W + 1.5, 0.16, D + 3.4], [0, 0.08, 1.3], bank.footpath, { castShadow: false, uvScale: 2.0 });
  box(g, [W, gfH, D - 0.8], [0, gfH * 0.5, -0.4], bank.modernWhite, { uvScale: 2.8 });
  box(g, [W + 0.8, 0.24, 2.5], [0, 3.25, D * 0.5 + 0.95], bank.steelDark);

  box(g, [W, totalH - gfH, D], [0, gfH + (totalH - gfH) * 0.5, 0], bank.royalCream, { uvScale: 3.0 });
  box(g, [W + 0.5, 0.24, D + 0.5], [0, gfH, 0], bank.marbleWhite);
  box(g, [W + 0.5, 0.24, D + 0.5], [0, gfH + 3.2, 0], bank.marbleWhite);
  box(g, [W + 0.5, 0.85, D + 0.5], [0, totalH + 0.42, 0], bank.emeraldWall);

  const rnd = seeded(955);
  for (let i = 0; i < counters.length; i++) {
    const cx = -W * 0.5 + (i + 0.5) * bayW;
    const cInfo = counters[i];

    box(g, [0.42, gfH, 0.55], [cx - bayW * 0.5, gfH * 0.5, D * 0.5 - 0.25], bank.modernSlate);
    cylinder(g, 0.10, 0.12, 3.2, [cx - bayW * 0.5 + 0.25, 1.6, D * 0.5 + 1.90], bank.aluminum, 8);

    box(dg, [bayW - 0.85, 2.55, 0.14], [cx, 1.45, D * 0.5 - 0.65], bank.dispBus, { castShadow: false });
    box(g, [bayW - 1.2, 0.12, 0.58], [cx, 1.05, D * 0.5 - 0.35], bank.marbleWhite);
    // Passenger waiting bench under canopy
    box(g, [2.4, 0.08, 0.42], [cx, 0.46, D * 0.5 + 1.05], bank.steelDark);
    box(g, [0.08, 0.42, 0.38], [cx - 0.95, 0.23, D * 0.5 + 1.05], bank.aluminum);
    box(g, [0.08, 0.42, 0.38], [cx + 0.95, 0.23, D * 0.5 + 1.05], bank.aluminum);

    // Original-Style Branded Lightbox Banner with Logo Emblem!
    const bTex = makeBusCounterBannerTexture(cInfo);
    const bMat = new THREE.MeshStandardMaterial({
      map: bTex,
      emissive: 0xffffff,
      emissiveMap: bTex,
      emissiveIntensity: 0.48,
      roughness: 0.24,
      side: THREE.DoubleSide,
    });
    bank.emissiveList.push({ mat: bMat, day: 0.44, night: 1.75 });
    const bannerGrp = new THREE.Group();
    bannerGrp.position.set(cx, 3.92, D * 0.5 + 2.15);
    bannerGrp.add(new THREE.Mesh(new THREE.BoxGeometry(bayW - 0.14, 1.56, 0.16), bank.steelDark));
    bannerGrp.add(new THREE.Mesh(new THREE.BoxGeometry(bayW - 0.24, 1.46, 0.185), bMat));
    dg.add(bannerGrp);

    for (let f = 0; f < 2; f++) {
      const fy = gfH + f * 3.2 + 1.55;
      const lit = rnd() > 0.42;
      box(lit ? dg : g, [bayW * 0.66, 1.6, 0.16], [cx, fy, D * 0.5 + 0.04], lit ? bank.warmWindowLit : bank.glassCurtain, { castShadow: false });
    }
  }
  box(g, [0.42, gfH, 0.55], [W * 0.5, gfH * 0.5, D * 0.5 - 0.25], bank.modernSlate);

  addSignBox(
    dg,
    bank,
    {
      title: 'রয়্যালের মোড় আন্তঃজেলা বাস কাউন্টার সমূহ',
      subtitle: 'ROYAL MORE BUS COUNTERS · KHULNA — DHAKA — CHATTOGRAM — SYLHET',
      bg: '#064e3b',
      fg: '#ffffff',
      accent: '#fde047',
      border: '#fde047',
      width: 640,
    },
    [0, totalH + 1.55, D * 0.5 + 0.32],
    0,
    18.0,
    1.8,
  );
}

function buildLuxuryCoachBus(staticG, dynamicG, bank, phys, { x, z, rotY, bodyMat, title, subtitle, bg }) {
  phys.addOBB(x, z, 2.6, 11.6, rotY, 3.4);

  const bus = new THREE.Group();
  bus.position.set(x, 0.04, z);
  bus.rotation.y = rotY;
  staticG.add(bus);

  for (const [wx, wz] of [[-1.18, 3.3], [1.18, 3.3], [-1.18, -3.1], [1.18, -3.1]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.30, 14), bank.tireBlack);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.48, wz);
    bus.add(w);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.32, 10), bank.aluminum);
    rim.rotation.z = Math.PI / 2;
    rim.position.set(wx, 0.48, wz);
    bus.add(rim);
  }
  box(bus, [2.52, 2.55, 11.4], [0, 1.78, 0], bodyMat);
  box(bus, [2.56, 0.22, 11.45], [0, 1.22, 0], bank.busAccent);
  box(bus, [2.36, 1.05, 0.14], [0, 2.25, 5.72], bank.glassCurtain);
  for (const sx of [-1.27, 1.27]) {
    box(bus, [0.06, 1.05, 9.8], [sx, 2.28, -0.2], bank.glassCurtain);
  }
  box(bus, [1.65, 0.34, 3.4], [0, 3.22, 0.4], bank.modernWhite);
  for (const sx of [-0.85, 0.85]) {
    box(bus, [0.36, 0.18, 0.08], [sx, 0.85, 5.72], bank.lampGlow);
  }
  addSignBox(
    dynamicG,
    bank,
    { title, subtitle, bg, accent: '#fde047' },
    [x + Math.cos(rotY) * 1.32, 1.55, z - Math.sin(rotY) * 1.32],
    rotY + Math.PI * 0.5,
    4.6,
    0.58,
  );
}

/* ============================================================================
 * 9. DENSE ARTICULATED BANGLADESHI COMMERCIAL BUILDINGS & REAL STOREFRONTS
 * ========================================================================== */
function buildRoyalCornerBuilding(staticG, dynamicG, bank, phys, cfg) {
  const {
    cx, cz, rotY = 0, w = 18, d = 12, floors = 5,
    wallMat = bank.royalSand,
    trimMat = bank.marbleWhite,
    accentMat = bank.royalTerracotta,
    awningMat = bank.awningGreen,
    shopMat = bank.dispSweets,
    signTitle,
    signSub,
    signBg = '#064e3b',
    signFg = '#ffffff',
    signAccent = '#fde047',
    secondSign = null,
    seed = 301,
  } = cfg;

  const gfH = 4.0;
  const flH = 3.05;
  const totalH = gfH + (floors - 1) * flH;

  phys.addOBB(cx, cz, w, d, rotY, totalH + 2);

  const rnd = seeded(seed);
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = rotY;
  staticG.add(g);

  const dg = new THREE.Group();
  dg.position.set(cx, 0, cz);
  dg.rotation.y = rotY;
  dynamicG.add(dg);

  box(g, [w + 0.6, 0.16, d + 1.4], [0, 0.08, 0.45], bank.footpath, { castShadow: false, uvScale: 2.0 });
  box(g, [w + 0.16, 0.42, d + 0.16], [0, 0.21, 0], bank.darkConcrete);

  box(g, [w, gfH, d - 0.5], [0, gfH * 0.5, -0.25], trimMat, { uvScale: 2.8 });
  const bays = Math.max(3, Math.floor(w / 3.8));
  const bayW = w / bays;
  for (let i = 0; i <= bays; i++) {
    const bx = -w * 0.5 + i * bayW;
    box(g, [0.42, gfH, 0.48], [bx, gfH * 0.5, d * 0.5 - 0.24], accentMat);
  }
  for (let b = 0; b < bays; b++) {
    const bx = -w * 0.5 + (b + 0.5) * bayW;
    const isShutter = b === bays - 1 && bays >= 4 && rnd() > 0.45;
    box(isShutter ? g : dg, [bayW - 0.58, 2.55, 0.12], [bx, 1.42, d * 0.5 - 0.48], isShutter ? bank.shutter : shopMat, { castShadow: false });
    box(g, [bayW - 0.40, 0.14, 1.05], [bx, 2.86, d * 0.5 + 0.22], awningMat);
  }

  box(g, [w, totalH - gfH, d], [0, gfH + (totalH - gfH) * 0.5, 0], wallMat, { uvScale: 3.0 });
  box(g, [w + 0.5, 0.24, d + 0.5], [0, gfH, 0], trimMat);

  for (let f = 1; f < floors; f++) {
    const fy = gfH + (f - 1) * flH;
    box(g, [w + 0.40, 0.18, d + 0.40], [0, fy + flH, 0], trimMat);
    for (let b = 0; b < bays; b++) {
      const bx = -w * 0.5 + (b + 0.5) * bayW;
      const lit = rnd() > 0.42;
      const winM = lit ? (rnd() > 0.35 ? bank.warmWindowLit : bank.coolWindowLit) : bank.glassCurtain;
      box(lit ? dg : g, [bayW * 0.64, 1.62, 0.16], [bx, fy + 1.52, d * 0.5 + 0.04], winM, { castShadow: false });
      if ((b + f) % 2 === 0) {
        box(g, [bayW * 0.78, 0.16, 0.80], [bx, fy + 0.12, d * 0.5 + 0.38], trimMat);
        box(g, [bayW * 0.78, 0.76, 0.12], [bx, fy + 0.52, d * 0.5 + 0.74], accentMat);
      } else {
        box(g, [bayW * 0.72, 0.12, 0.32], [bx, fy + 2.40, d * 0.5 + 0.15], trimMat);
        if (rnd() > 0.40) {
          box(g, [0.70, 0.48, 0.32], [bx + bayW * 0.22, fy + 0.46, d * 0.5 + 0.18], bank.acBox);
        }
      }
      box(g, [bayW * 0.58, 1.55, 0.14], [bx, fy + 1.52, -d * 0.5 - 0.04], bank.glassCurtain, { castShadow: false });
    }
  }

  box(g, [w + 0.30, 0.92, 0.22], [0, totalH + 0.46, d * 0.5], accentMat);
  box(g, [w + 0.30, 0.92, 0.22], [0, totalH + 0.46, -d * 0.5], accentMat);
  box(g, [0.22, 0.92, d], [-w * 0.5, totalH + 0.46, 0], accentMat);
  box(g, [0.22, 0.92, d], [w * 0.5, totalH + 0.46, 0], accentMat);
  box(g, [3.2, 2.25, 3.4], [-w * 0.18, totalH + 1.12, 0], trimMat);
  cylinder(g, 0.62, 0.66, 1.35, [w * 0.22, totalH + 1.12, -1.0], bank.waterTank, 10);

  if (signTitle) {
    addSignBox(
      dg,
      bank,
      { title: signTitle, subtitle: signSub, bg: signBg, fg: signFg, accent: signAccent, width: 576 },
      [0, 3.48, d * 0.5 + 0.26],
      0,
      Math.min(w - 1.0, 11.2),
      1.12,
    );
  }
  if (secondSign) {
    addSignBox(
      dg,
      bank,
      secondSign,
      [0, totalH + 1.55, d * 0.5 + 0.28],
      0,
      Math.min(w - 1.6, 9.6),
      1.32,
    );
  }
}

function buildKmpTrafficBox(staticG, dynamicG, bank, phys, x, z) {
  phys.addCircle(x, z, 1.68, 3.5);

  const g = new THREE.Group();
  g.position.set(x, 0, z);
  staticG.add(g);

  cylinder(g, 1.55, 1.65, 0.28, [0, 0.14, 0], bank.concrete, 8);
  cylinder(g, 1.28, 1.32, 1.05, [0, 0.80, 0], bank.modernWhite, 8);
  cylinder(g, 1.34, 1.34, 0.22, [0, 1.24, 0], bank.policeBlue, 8);
  cylinder(g, 1.15, 1.15, 1.15, [0, 1.92, 0], bank.glassLobby, 8);
  cylinder(g, 1.85, 1.92, 0.18, [0, 2.60, 0], bank.policeBlue, 8);
  cylinder(g, 0.85, 1.55, 0.48, [0, 2.92, 0], bank.modernWhite, 8);

  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.24, 10), bank.uplightCyan);
  beacon.position.set(x, 3.28, z);
  dynamicG.add(beacon);

  addSignBox(
    dynamicG,
    bank,
    { title: 'KMP ট্রাফিক পুলিশ বক্স', subtitle: 'ROYAL MORE · খুলনা মেট্রোপলিটন পুলিশ', bg: '#1e3a8a', accent: '#fde047' },
    [x - 0.85, 2.66, z + 0.95],
    -Math.PI * 0.24,
    2.2,
    0.52,
  );
}

/**
 * Builds the complete Photo-Accurate, Ultra-Detailed, 60+ FPS Royal More District.
 */
export function buildRoyalMoreDistrict(parent, m) {
  const root = new THREE.Group();
  root.name = 'KhulnaLandmark_RoyalMore';
  const staticG = new THREE.Group();
  const dynamicG = new THREE.Group();
  root.add(staticG, dynamicG);
  parent.add(root);

  const bank = createRoyalBank(m);
  const phys = createPhysicsRegistry();

  // 1) Urban Paved Ground + Exact OSM Roads + Walkable Raised Footpaths
  buildRoyalMoreRoadsAndFootpaths(staticG, dynamicG, bank, phys);

  // 2) Authentic Chingri Chattar Dual-Boundary Island + 3 Prawns + Full 3-Sided Billboard Mast
  const fountainJets = buildChingriChattarMonument(staticG, dynamicG, bank, phys);

  // 3) KDA Avenue Royal Bengal Tiger Median (Photo S07)
  buildKdaTigerMedian(staticG, dynamicG, bank, phys);

  // 4) 1:1 Photo-Accurate Hotel Royal International + Frontier/Fatima Twin Tower Complex (B01, B02, B06, B07, S03, S07, S10, U01)
  buildHotelRoyalComplex(staticG, dynamicG, bank, phys);

  // 5) Hotel Castle Salam — SSE Corner with Pink Frame, Blue Glazing & White Script Canopy (B03, S13, B08, S08)
  buildHotelCastleSalam(staticG, dynamicG, bank, phys);

  // 6) Adjacent Pink Retail Row beside Castle Salam (Samsung, Xiaomi, Rosh Mohol S1 + Giant Billboard Frame — B05, S08, J)
  buildCastleAdjacentShopRow(staticG, dynamicG, bank, phys);

  // 7) Satkhira Adi Jadob Ghosh Dairy — 54 Khan Jahan Ali Rd (Photo G01, Pin S3)
  buildSatkhiraJadobGhoshDairy(staticG, dynamicG, bank, phys);

  // 8) Complete 6-Counter Royal More Bus Counter Strip (Placeholder buses removed for future custom 3D bus models!)
  buildBusCounterStrip(staticG, dynamicG, bank, phys);

  // 9) REAL DATED STOREFRONTS & WALL-TO-WALL KHULNA URBAN BLOCKS

  // --- KDA AVENUE SOUTH FILLERS (between Castle Adjacent Row & Bus Counter Strip) ---
  buildRoyalCornerBuilding(staticG, dynamicG, bank, phys, {
    cx: -754.5,
    cz: -259.2,
    rotY: Math.PI - 0.12,
    w: 22.0,
    d: 12.0,
    floors: 5,
    wallMat: bank.warmOchre,
    trimMat: bank.royalCream,
    accentMat: bank.emeraldWall,
    awningMat: bank.awningGreen,
    shopMat: bank.dispPharm,
    signTitle: 'রয়েল মডেল ফার্মেসি · ট্রাভেল এজেন্সি · বিকাশ',
    signSub: 'KDA AVENUE SOUTH · ROYAL MORE',
    signBg: '#065f46',
    seed: 401,
  });

  buildRoyalCornerBuilding(staticG, dynamicG, bank, phys, {
    cx: -828.0,
    cz: -267.0,
    rotY: Math.PI - 0.24,
    w: 17.5,
    d: 12.0,
    floors: 5,
    wallMat: bank.paleBlueWall,
    trimMat: bank.marbleWhite,
    accentMat: bank.modernSlate,
    awningMat: bank.awningBlue,
    shopMat: bank.dispSweets,
    signTitle: 'খুলনা সুপার মার্কেট · টেলিকম ও কম্পিউটার',
    signSub: 'KDA AVENUE WEST · SONADANGA LINK',
    signBg: '#1e3a8a',
    seed: 409,
  });

  // --- KDA AVENUE NORTH FILLERS (west of Hotel Royal International) ---
  buildRoyalCornerBuilding(staticG, dynamicG, bank, phys, {
    cx: -792.5,
    cz: -299.0,
    rotY: 0.05,
    w: 24.0,
    d: 12.5,
    floors: 5,
    wallMat: bank.sageWall,
    trimMat: bank.marbleWhite,
    accentMat: bank.modernSlate,
    awningMat: bank.awningRed,
    shopMat: bank.dispKacchi,
    signTitle: 'কাচ্চি ঘর · প্রাইম ব্যাংক এটিএম · ব্যাংক প্লাজা',
    signSub: 'KACCHI GHOR & PRIME BANK 24/7 ATM · KDA AVENUE',
    signBg: '#78350f',
    secondSign: { title: 'PRIME BANK · 24/7 ATM', subtitle: 'ROYAL MORE · KDA AVENUE', bg: '#065f46', accent: '#6ee7b7' },
    seed: 711,
  });

  buildRoyalCornerBuilding(staticG, dynamicG, bank, phys, {
    cx: -819.5,
    cz: -302.2,
    rotY: 0.16,
    w: 22.0,
    d: 12.0,
    floors: 6,
    wallMat: bank.modernWhite,
    trimMat: bank.marbleWhite,
    accentMat: bank.hospitalBlue,
    awningMat: bank.awningBlue,
    shopMat: bank.dispAtm,
    signTitle: 'ডাচ-বাংলা ব্যাংক বুথ · ওয়ালটন শোরুম · ইলেকট্রনিক্স',
    signSub: 'DBBL FAST TRACK & ELECTRONICS · KDA AVENUE',
    signBg: '#1e3a8a',
    seed: 722,
  });

  // --- NE CORNER BESIDE FOUNTAIN: JOBAIR'S & DMC RED-BALCONY SHOP ROW (Photo S04!) ---
  buildRoyalCornerBuilding(staticG, dynamicG, bank, phys, {
    cx: -694.5,
    cz: -309.5,
    rotY: -0.68,
    w: 21.5,
    d: 12.0,
    floors: 5,
    wallMat: bank.modernWhite,
    trimMat: bank.royalCream,
    accentMat: bank.royalTerracotta, // distinctive red balconies from S04!
    awningMat: bank.awningRed,
    shopMat: bank.dispElec,
    signTitle: "JOBAIR'S · DMC · রয়েল কমার্শিয়াল আর্কেড",
    signSub: 'ROYAL MORE EAST CORNER · KHAN JAHAN ALI RD',
    signBg: '#991b1b',
    secondSign: { title: "JOBAIR'S & DMC", subtitle: 'KHULNA ROYAL MOR', bg: '#1e293b', accent: '#fde047' },
    seed: 519,
  });

  // --- SE KHAN JAHAN ALI ROAD (NE side: TVS behind island, Satkhira Adi Jadob Ghosh Dairy S3, Raj Mithai) ---
  const seAngle = Math.atan2(-67, -42);

  // TVS Showroom row behind the island (matches Camera J!)
  buildRoyalCornerBuilding(staticG, dynamicG, bank, phys, {
    cx: -691.5,
    cz: -294.5,
    rotY: seAngle + Math.PI * 0.5,
    w: 17.5,
    d: 11.0,
    floors: 5,
    wallMat: bank.royalCream,
    trimMat: bank.marbleWhite,
    accentMat: bank.hospitalBlue,
    awningMat: bank.awningBlue,
    shopMat: bank.dispElec,
    signTitle: 'TVS · টিভিএস মোটরসাইকেল শোরুম',
    signSub: 'KHAN JAHAN ALI ROAD · BEHIND SHRIMP ISLAND',
    signBg: '#1e3a8a',
    signAccent: '#ffffff',
    seed: 425,
  });

  // Raj Mithai - Royal Mor (along SE Khan Jahan Ali Rd beyond Satkhira Adi Jadob Ghosh Dairy)
  buildRoyalCornerBuilding(staticG, dynamicG, bank, phys, {
    cx: -657.0,
    cz: -272.5,
    rotY: seAngle + Math.PI * 0.5,
    w: 18.0,
    d: 11.2,
    floors: 5,
    wallMat: bank.paleBlueWall,
    trimMat: bank.marbleWhite,
    accentMat: bank.royalTerracotta,
    awningMat: bank.awningRed,
    shopMat: bank.dispSweets,
    signTitle: 'রাজ মিঠাই · রয়্যাল মোড় (RAJ MITHAI)',
    signSub: 'KHAN JAHAN ALI ROAD · KHULNA',
    signBg: '#7f1d1d',
    seed: 441,
  });

  // --- SE KHAN JAHAN ALI ROAD (SW side: Jam Jam Misti Ghar Pin S2 beside Castle Salam + Commercial Plaza) ---
  // Jam Jam Misti Ghar (Pin S2: East +33m, North -32m -> -683.8, -259.8)
  buildRoyalCornerBuilding(staticG, dynamicG, bank, phys, {
    cx: -682.5,
    cz: -249.5,
    rotY: seAngle - Math.PI * 0.5,
    w: 18.5,
    d: 11.2,
    floors: 5,
    wallMat: bank.royalSand,
    trimMat: bank.marbleWhite,
    accentMat: bank.royalTerracotta,
    awningMat: bank.awningGreen,
    shopMat: bank.dispSweets,
    signTitle: 'জমজম মিষ্টি ঘর · JAM JAM MISTI GHAR',
    signSub: 'ROYAL MORE · BESIDE HOTEL CASTLE SALAM',
    signBg: '#065f46',
    seed: 455,
  });

  buildRoyalCornerBuilding(staticG, dynamicG, bank, phys, {
    cx: -663.5,
    cz: -239.0,
    rotY: seAngle - Math.PI * 0.5,
    w: 18.5,
    d: 11.2,
    floors: 6,
    wallMat: bank.modernWhite,
    trimMat: bank.marbleWhite,
    accentMat: bank.hospitalBlue,
    awningMat: bank.awningBlue,
    shopMat: bank.dispAtm,
    signTitle: 'ইসলামী ব্যাংক এজেন্ট · প্রিন্টিং প্রেস · স্টেশনারি',
    signSub: 'KHAN JAHAN ALI ROAD EAST · KHULNA',
    signBg: '#0f172a',
    seed: 467,
  });

  // --- NW KHAN JAHAN ALI ROAD (East side: Rajdhani Fabrics Khulna from Camera B + Fatima Hospital + Shantidham Plaza) ---
  // Rajdhani Fabrics Khulna (on left when approaching from Camera B, opposite Royal's side wall — white/red bilingual fascia!)
  buildRoyalCornerBuilding(staticG, dynamicG, bank, phys, {
    cx: -721.0,
    cz: -333.5,
    rotY: -Math.PI * 0.36,
    w: 21.0,
    d: 11.8,
    floors: 5,
    wallMat: bank.modernWhite,
    trimMat: bank.marbleWhite,
    accentMat: bank.awningRed,
    awningMat: bank.awningRed,
    shopMat: bank.dispFabrics,
    signTitle: 'রাজধানী ফেব্রিক্স খুলনা · RAJDHANI FABRICS',
    signSub: 'KHAN JAHAN ALI ROAD · OPPOSITE HOTEL ROYAL',
    signBg: '#ffffff',
    signFg: '#b91c1c',
    signAccent: '#1e293b',
    secondSign: { title: 'RAJDHANI FABRICS KHULNA', subtitle: 'রাজধানী ফেব্রিক্স · রয়্যাল মোড়', bg: '#b91c1c', fg: '#ffffff', accent: '#fef08a' },
    seed: 607,
  });

  buildRoyalCornerBuilding(staticG, dynamicG, bank, phys, {
    cx: -737.0,
    cz: -355.0,
    rotY: -Math.PI * 0.34,
    w: 21.0,
    d: 12.0,
    floors: 6,
    wallMat: bank.modernWhite,
    trimMat: bank.marbleWhite,
    accentMat: bank.hospitalBlue,
    awningMat: bank.awningBlue,
    shopMat: bank.dispHosp,
    signTitle: 'ফাতেমা হাসপাতাল এন্ড ডায়াগনস্টিক সেন্টার',
    signSub: 'FATIMA HOSPITAL · 24/7 EMERGENCY & DIAGNOSTIC',
    signBg: '#0c4a6e',
    secondSign: { title: 'FATIMA HOSPITAL · 24H', subtitle: 'KHAN JAHAN ALI ROAD, KHULNA', bg: '#991b1b', accent: '#ffffff' },
    seed: 621,
  });

  buildRoyalCornerBuilding(staticG, dynamicG, bank, phys, {
    cx: -753.0,
    cz: -376.5,
    rotY: -Math.PI * 0.33,
    w: 21.0,
    d: 12.0,
    floors: 6,
    wallMat: bank.warmOchre,
    trimMat: bank.royalCream,
    accentMat: bank.royalTerracotta,
    awningMat: bank.awningRed,
    shopMat: bank.dispSweets,
    signTitle: 'শান্তিধাম প্লাজা · বুক হাউস ও গার্মেন্টস',
    signSub: 'KHAN JAHAN ALI ROAD NORTH · KHULNA',
    signBg: '#7c2d12',
    seed: 635,
  });

  // --- NW KHAN JAHAN ALI ROAD (West side north of Frontier/Fatima Twin Tower: City Medical & Shantidham) ---
  buildRoyalCornerBuilding(staticG, dynamicG, bank, phys, {
    cx: -768.0,
    cz: -350.0,
    rotY: Math.PI * 0.66,
    w: 18.5,
    d: 11.5,
    floors: 5,
    wallMat: bank.paleBlueWall,
    trimMat: bank.marbleWhite,
    accentMat: bank.hospitalBlue,
    awningMat: bank.awningGreen,
    shopMat: bank.dispPharm,
    signTitle: 'সিটি মেডিকেল হল · ডায়াগনস্টিক · কুরিয়ার',
    signSub: 'KHAN JAHAN ALI ROAD · KHULNA',
    signBg: '#0f766e',
    seed: 662,
  });

  buildRoyalCornerBuilding(staticG, dynamicG, bank, phys, {
    cx: -777.0,
    cz: -365.0,
    rotY: Math.PI * 0.66,
    w: 21.0,
    d: 11.5,
    floors: 6,
    wallMat: bank.royalCream,
    trimMat: bank.marbleWhite,
    accentMat: bank.royalTerracotta,
    awningMat: bank.awningRed,
    shopMat: bank.dispKacchi,
    signTitle: 'খুলনা কমার্শিয়াল কমপ্লেক্স · রেস্টুরেন্ট',
    signSub: 'KHAN JAHAN ALI ROAD · SHANTIDHAM',
    signBg: '#78350f',
    seed: 678,
  });

  // 10) KMP Traffic Police Control Box on NE Roundabout Apron
  buildKmpTrafficBox(staticG, dynamicG, bank, phys, -701.2, -301.8);

  // 11) Roadside Utility Poles + Overhead Wires (matches S06 backdrop!) + Bengali Posters
  const poleSpots = [
    [-703.5, -274.5, 0.5],
    [-684.0, -288.0, 2.5],
    [-732.0, -308.0, -0.8],
    [-752.0, -290.5, 1.5],
    [-754.0, -267.5, -1.5],
    [-796.0, -268.2, -1.5],
  ];
  for (let i = 0; i < poleSpots.length; i++) {
    const [px, pz, pyaw] = poleSpots[i];
    cylinder(staticG, 0.10, 0.15, 8.8, [px, 4.4, pz], bank.concrete, 8);
    phys.addCircle(px, pz, 0.22, 8.8);
    decorateCorridorPole(dynamicG, px, pz, pyaw, 910 + i);
  }
  // Overhead hanging Bangladeshi power/cable wires spanning perimeter poles (S06)
  const wirePairs = [[0, 1], [2, 3], [4, 5]];
  for (const [ia, ib] of wirePairs) {
    const [ax, az] = poleSpots[ia];
    const [bx, bz] = poleSpots[ib];
    for (const wy of [7.6, 8.15]) {
      const mx = (ax + bx) * 0.5;
      const mz = (az + bz) * 0.5;
      rodBetween(staticG, [ax, wy, az], [mx, wy - 0.55, mz], 0.016, bank.wireBlack, 4);
      rodBetween(staticG, [mx, wy - 0.55, mz], [bx, wy, bz], 0.016, bank.wireBlack, 4);
    }
  }

  // Parked CNG Auto & Easybike at the corner passenger stand
  const vBank = {
    tire: bank.tireBlack,
    rim: bank.aluminum,
    darkTrim: bank.steelDark,
    chrome: bank.aluminum,
    windshield: bank.glassCurtain,
    headlight: bank.lampGlow,
    taillight: bank.flowerRed,
    amber: bank.flowerGold,
    cngGreen: bank.emeraldWall,
    cngYellow: bank.busAccent,
    cngRexine: bank.steelDark,
    easyTeal: bank.hospitalBlue,
    easyCrimson: bank.royalTerracotta,
    easyRoof: bank.modernWhite,
    plate: bank.busAccent,
  };
  const standCng = buildCNGAuto(vBank);
  standCng.position.set(-703.2, 0.05, -306.5);
  standCng.rotation.y = -2.2;
  staticG.add(standCng);
  phys.addOBB(-703.2, -306.5, 1.5, 2.8, -2.2, 1.8);

  const standEasy = buildEasybike(vBank, false);
  standEasy.position.set(-758.0, 0.05, -268.6);
  standEasy.rotation.y = 1.65;
  staticG.add(standEasy);
  phys.addOBB(-758.0, -268.6, 1.4, 2.7, 1.65, 1.8);

  // Batch all static meshes by material for locked 60+ FPS even in Ultra mode!
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

  const maxDistSq = 380 * 380;

  return {
    root,
    getGroundHeight: phys.getGroundHeight,
    applyCollisions: phys.applyCollisions,
    setNightFactor(nightFactor = 0) {
      const nf = THREE.MathUtils.clamp(nightFactor, 0, 1);
      for (let i = 0; i < bank.emissiveList.length; i++) {
        const item = bank.emissiveList[i];
        item.mat.emissiveIntensity = item.day + (item.night - item.day) * nf;
      }
    },
    syncVisibility(playerPos) {
      if (!playerPos) return;
      const dx = playerPos.x - ROYAL_MORE_CENTER.x;
      const dz = playerPos.z - ROYAL_MORE_CENTER.z;
      const want = dx * dx + dz * dz <= maxDistSq;
      if (root.visible !== want) root.visible = want;
    },
    update(time, playerPos = null) {
      if (playerPos) this.syncVisibility(playerPos);
      if (!root.visible) return;
      for (let i = 0; i < fountainJets.length; i++) {
        const j = fountainJets[i];
        const s = 0.94 + Math.sin(time * 5.4 + j.phase) * 0.09;
        j.mesh.scale.set(1, s, 1);
      }
    },
  };
}
