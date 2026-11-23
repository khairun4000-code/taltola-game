import * as THREE from 'three';
import { box, cylinder, rodBetween } from './scene-utils.js';
import { attachDerivedPBRMaps } from './aaa-shaders.js';

/**
 * HOTEL ROYAL INTERNATIONAL, KHULNA — PHOTOREALISTIC 2026 STANDALONE WALKABLE 3D MODEL
 * (A-33 KDA Avenue / Khan Jahan Ali Road, Royal Mor, Khulna · Est. 1986)
 *
 * Upgraded Photorealistic Edition:
 *  - Full Layered PBR Textures (Diffuse + Sobel Normal + Roughness) with subtle realistic
 *    tropical concrete patina, micro-stucco grain, natural wood grain, honed granite speckles,
 *    Italian veined marble, stacked slate stone, pleated fabric, tufted velvet, & ACP panel seams.
 *  - ZERO unrealistic rooftop trees — clean architectural weatherproof tiled roof terrace.
 *  - 3-Story Curved Podium (Floors 1–3) seamlessly connected via walkable archways to the
 *    FULLY HOLLOW, HIGH-REALISTIC, WALKABLE 10-STORY REAR TOWER (Floors 1–10 + Rooftop):
 *      * Ground Floor Tower: Royal Grand Banquet & Conference Hall
 *      * 2nd Floor Tower: Executive Lounge & VIP Private Dining
 *      * 3rd & 4th Floors Tower: Walkable Corridors & Deluxe Balcony Guest Rooms (304, 305, 401, 402)
 *      * 5th, 7th–9th Floors Tower: Walkable Corridors, Elevators, Staircase & Furnished Window Suites
 *      * 6th Floor Tower: Royal Presidential Executive Suite (601) with KDA Ave Walk-Out Balcony
 *      * 10th Floor Tower: Royal Sky Lounge & Panoramic Observation Deck
 *      * Rooftop (y = 35.45m): Tiled Roof Deck, Stairhead, HVAC Chillers, Telecom Masts & Beacons
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
 * PHOTOREALISTIC PROCEDURAL PBR TEXTURES (WITH SUBTLE REALISTIC WEATHERING)
 * ========================================================================== */

function makePanelizedConcreteTex(baseHex = '#cfc2ad', seedVal = 301) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  // Soft plaster trowel tonal clouds (prevents flat CGI look)
  for (let i = 0; i < 65; i++) {
    const x = rnd() * 512;
    const y = rnd() * 512;
    const r = 24 + rnd() * 64;
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    const light = rnd() > 0.48;
    g.addColorStop(0, light ? 'rgba(255,250,240,0.065)' : 'rgba(62,54,44,0.06)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Fine mineral stucco aggregate grain
  for (let i = 0; i < 9500; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.055)' : 'rgba(38,32,24,0.065)';
    ctx.fillRect(rnd() * 512, rnd() * 512, 1.5 + rnd() * 2.2, 1.5 + rnd() * 2.2);
  }

  // Subtle realistic monsoon drip-edge shading at top & bottom of slab panels (clean luxury patina, NOT dirty!)
  const topWash = ctx.createLinearGradient(0, 0, 0, 58);
  topWash.addColorStop(0, 'rgba(46,42,36,0.14)');
  topWash.addColorStop(1, 'rgba(46,42,36,0)');
  ctx.fillStyle = topWash;
  ctx.fillRect(0, 0, 512, 58);

  const botWash = ctx.createLinearGradient(0, 456, 0, 512);
  botWash.addColorStop(0, 'rgba(46,42,36,0)');
  botWash.addColorStop(1, 'rgba(46,42,36,0.11)');
  ctx.fillStyle = botWash;
  ctx.fillRect(0, 456, 512, 56);

  // Delicate vertical rainwater micro-streaks (very restrained ~4-6% alpha)
  for (let s = 0; s < 18; s++) {
    const sx = rnd() * 512;
    const sw = 2 + rnd() * 5;
    const sh = 40 + rnd() * 140;
    const sg = ctx.createLinearGradient(0, 0, 0, sh);
    sg.addColorStop(0, 'rgba(54,49,42,0.08)');
    sg.addColorStop(1, 'rgba(54,49,42,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(sx, 0, sw, sh);
  }

  // Architectural concrete panel expansion joints with crisp bevel highlight
  for (let x = 0; x < 512; x += 64) {
    ctx.fillStyle = 'rgba(38,32,24,0.28)';
    ctx.fillRect(x, 0, 2, 512);
    ctx.fillStyle = 'rgba(255,252,244,0.16)';
    ctx.fillRect(x + 2, 0, 1.5, 512);
  }
  for (let y = 0; y < 512; y += 128) {
    ctx.fillStyle = 'rgba(38,32,24,0.18)';
    ctx.fillRect(0, y, 512, 1.5);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeTowerPlasterTex(baseHex = '#c5b7a2', seedVal = 409) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle exterior plaster mottling
  for (let i = 0; i < 80; i++) {
    const x = rnd() * 512;
    const y = rnd() * 512;
    const r = 20 + rnd() * 58;
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, rnd() > 0.5 ? 'rgba(255,252,246,0.06)' : 'rgba(52,46,38,0.055)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Fine exterior cement render grain
  for (let i = 0; i < 8500; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.045)' : 'rgba(32,28,22,0.05)';
    ctx.fillRect(rnd() * 512, rnd() * 512, 1.5 + rnd() * 2, 1.5 + rnd() * 2);
  }
  // Horizontal architectural floor-band reveal lines & subtle weathering shadow beneath them
  for (let y = 0; y < 512; y += 128) {
    ctx.fillStyle = 'rgba(42,36,30,0.22)';
    ctx.fillRect(0, y, 512, 2);
    const wg = ctx.createLinearGradient(0, y + 2, 0, y + 24);
    wg.addColorStop(0, 'rgba(48,44,38,0.09)');
    wg.addColorStop(1, 'rgba(48,44,38,0)');
    ctx.fillStyle = wg;
    ctx.fillRect(0, y + 2, 512, 22);
  }
  // Vertical subtle expansion groove
  for (let x = 0; x < 512; x += 128) {
    ctx.fillStyle = 'rgba(42,36,30,0.12)';
    ctx.fillRect(x, 0, 1.5, 512);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeWoodGrainTex(baseHex = '#864a24', darkHex = '#4e2610', seedVal = 515) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  // Organic flowing wood grain fibers
  for (let i = 0; i < 160; i++) {
    const y0 = rnd() * 512;
    ctx.strokeStyle = rnd() > 0.35 ? darkHex : 'rgba(235,188,132,0.16)';
    ctx.globalAlpha = 0.08 + rnd() * 0.16;
    ctx.lineWidth = 1 + rnd() * 2.5;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.bezierCurveTo(170, y0 + (rnd() - 0.5) * 26, 340, y0 + (rnd() - 0.5) * 26, 512, y0 + (rnd() - 0.5) * 14);
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;
  // Subtle veneer panel join lines
  ctx.fillStyle = 'rgba(20,10,4,0.22)';
  for (let y = 0; y < 512; y += 128) {
    ctx.fillRect(0, y, 512, 1.5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeGraniteTex(baseHex = '#191c22', seedVal = 612) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);
  // Crystalline quartz/feldspar/mica mineral flecks
  for (let i = 0; i < 4200; i++) {
    const v = rnd();
    ctx.fillStyle = v > 0.82
      ? 'rgba(195,205,220,0.22)'
      : (v > 0.45 ? 'rgba(95,105,118,0.24)' : 'rgba(8,10,14,0.38)');
    ctx.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 2.2, 1 + rnd() * 2.2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = 8;
  return tex;
}

function makeFabricTex(baseHex = '#d4b270', mode = 'velvet', seedVal = 711) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  if (mode === 'velvet') {
    // Diamond Chesterfield tufting sheen
    const step = 32;
    ctx.strokeStyle = 'rgba(72,48,16,0.22)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < 256; y += step) {
      for (let x = 0; x < 256; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + step, y + step);
        ctx.moveTo(x + step, y); ctx.lineTo(x, y + step);
        ctx.stroke();
        ctx.fillStyle = 'rgba(54,34,10,0.32)';
        ctx.beginPath(); ctx.arc(x + step * 0.5, y + step * 0.5, 2.2, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (mode === 'curtain') {
    // Vertical drapery pleats
    for (let x = 0; x < 256; x += 24) {
      const g = ctx.createLinearGradient(x, 0, x + 24, 0);
      g.addColorStop(0, 'rgba(0,0,0,0.22)');
      g.addColorStop(0.5, 'rgba(255,245,235,0.08)');
      g.addColorStop(1, 'rgba(0,0,0,0.22)');
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, 24, 256);
    }
  } else {
    // Woven hospitality carpet / leather micro-grain
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.09)';
      ctx.fillRect(rnd() * 256, rnd() * 256, 2, 2);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function makeBlackACPPanelTex() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0d1017';
  ctx.fillRect(0, 0, 512, 512);
  // Subtle metallic brushed sheen gradient per ACP cassette
  for (let y = 0; y < 512; y += 128) {
    for (let x = 0; x < 512; x += 128) {
      const g = ctx.createLinearGradient(x, y, x + 128, y + 128);
      g.addColorStop(0, 'rgba(255,255,255,0.035)');
      g.addColorStop(1, 'rgba(0,0,0,0.08)');
      ctx.fillStyle = g;
      ctx.fillRect(x + 2, y + 2, 124, 124);
      ctx.strokeStyle = 'rgba(0,0,0,0.65)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 1, y + 1, 126, 126);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeRoofTileTex() {
  // Clean architectural light-grey concrete roof tiles with subtle dust in grout joints
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  const rnd = seeded(8842);
  ctx.fillStyle = '#9ca0a4';
  ctx.fillRect(0, 0, 512, 512);
  const step = 64;
  for (let y = 0; y < 512; y += step) {
    for (let x = 0; x < 512; x += step) {
      const tone = 160 + Math.floor((rnd() - 0.5) * 18);
      ctx.fillStyle = `rgb(${tone}, ${tone - 1}, ${tone - 4})`;
      ctx.fillRect(x + 2, y + 2, step - 4, step - 4);
    }
  }
  for (let i = 0; i < 5500; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.045)' : 'rgba(42,38,34,0.06)';
    ctx.fillRect(rnd() * 512, rnd() * 512, 2, 2);
  }
  ctx.strokeStyle = 'rgba(68,64,58,0.42)';
  ctx.lineWidth = 2.5;
  for (let p = 0; p < 512; p += step) {
    ctx.beginPath();
    ctx.moveTo(p, 0); ctx.lineTo(p, 512);
    ctx.moveTo(0, p); ctx.lineTo(512, p);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.anisotropy = 8;
  return tex;
}

function makeMarbleTileTex(baseHex = '#f5f1e8', groutHex = '#cfc7b8', seedVal = 402) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);
  // Subtle tile-to-tile tonal variation
  for (let y = 0; y < 512; y += 128) {
    for (let x = 0; x < 512; x += 128) {
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(175,160,136,0.05)';
      ctx.fillRect(x, y, 128, 128);
    }
  }
  // Organic cream-gold marble veining
  for (let i = 0; i < 36; i++) {
    ctx.strokeStyle = rnd() > 0.4 ? 'rgba(178, 162, 138, 0.22)' : 'rgba(208, 192, 162, 0.18)';
    ctx.lineWidth = 0.8 + rnd() * 2.2;
    ctx.beginPath();
    const x0 = rnd() * 512;
    const y0 = rnd() * 512;
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(x0 + 80, y0 + (rnd() - 0.5) * 95, x0 + 160, y0 + (rnd() - 0.5) * 95, x0 + 250, y0 + (rnd() - 0.5) * 65);
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
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  const rnd = seeded(9912);
  ctx.fillStyle = '#3d4248';
  ctx.fillRect(0, 0, 512, 512);
  const rows = 16;
  const rh = 512 / rows;
  for (let r = 0; r < rows; r++) {
    let x = -rnd() * 40;
    while (x < 512) {
      const w = 48 + rnd() * 72;
      const v = 98 + Math.floor(rnd() * 74);
      const warm = Math.floor(rnd() * 10);
      ctx.fillStyle = `rgb(${v + warm},${v + 2},${v + 4})`;
      ctx.fillRect(x + 2, r * rh + 2, w - 4, rh - 4);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x + 2, r * rh + 2, w - 4, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.fillRect(x + 2, (r + 1) * rh - 4, w - 4, 2);
      x += w;
    }
  }
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
    ctx.fillRect(rnd() * 512, rnd() * 512, 2, 2);
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
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  const rnd = seeded(5101);
  ctx.fillStyle = '#57534e';
  ctx.fillRect(0, 0, 512, 512);
  const step = 32;
  for (let y = 0; y < 512; y += step) {
    for (let x = 0; x < 512; x += step) {
      const isRed = ((x / step) + (y / step)) % 2 === 0;
      if (isRed) {
        const R = 162 + Math.floor(rnd() * 24);
        ctx.fillStyle = `rgb(${R}, 74, 62)`;
      } else {
        const g = 142 + Math.floor(rnd() * 24);
        ctx.fillStyle = `rgb(${g}, ${g - 1}, ${g - 2})`;
      }
      ctx.fillRect(x + 2, y + 2, step - 4, step - 4);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x + 2, y + 2, step - 4, 2);
    }
  }
  // Light natural dust/sand grain in driveway joints
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(214,204,188,0.08)' : 'rgba(32,28,24,0.07)';
    ctx.fillRect(rnd() * 512, rnd() * 512, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeHammeredGoldTex() {
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
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f8f4ec';
  ctx.fillRect(0, 0, 512, 512);

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
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(256, 256, 155, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath(); ctx.arc(146, 138, 42, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(366, 138, 42, 0, Math.PI * 2); ctx.fill();
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
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.moveTo(234, 286); ctx.lineTo(278, 286); ctx.lineTo(256, 314); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.ellipse(205, 232, 18, 10, 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(307, 232, 18, 10, -0.18, 0, Math.PI * 2); ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeElevatorDoorTex() {
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
  ctx.fillStyle = '#374151';
  ctx.fillRect(126, 0, 4, 512);
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
  c.width = 192;
  c.height = 896;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#eae5da';
  ctx.fillRect(0, 0, 192, 896);
  ctx.strokeStyle = 'rgba(92,82,68,0.22)';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 184, 888);
  const letters = ['H', 'O', 'T', 'E', 'L', ' ', 'R', 'O', 'Y', 'A', 'L'];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 68px "Manrope", "Segoe UI", sans-serif';
  const step = 800 / letters.length;
  for (let i = 0; i < letters.length; i++) {
    if (letters[i] === ' ') continue;
    const y = 52 + (i + 0.5) * step;
    ctx.fillStyle = '#6b1d14';
    ctx.fillText(letters[i], 100, y + 4);
    ctx.fillStyle = '#f5b82e';
    ctx.fillText(letters[i], 96, y);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
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
 * REUSABLE INTERIOR FURNITURE & ARCHITECTURE HELPERS
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
  box(sg, [length, 0.14, 0.88], [0, 0.07, 0], mats.mahogany);
  box(sg, [length - 0.08, 0.28, 0.84], [0, 0.28, 0.02], mats.goldVelvet);
  box(sg, [length, 0.92, 0.20], [0, 0.72, -0.34], mats.goldVelvet);
  for (const sx of [-length * 0.5 + 0.12, length * 0.5 - 0.12]) {
    box(sg, [0.22, 0.52, 0.86], [sx, 0.42, 0], mats.goldVelvet);
  }
  parent.add(sg);
}

function addDiningTableSet(parent, mats, x, y, z) {
  box(parent, [1.55, 0.06, 1.05], [x, y + 0.76, z], mats.crispWhite);
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
 * Fully Furnished Hotel Royal Standard Guest Room (Room 303 & Tower Deluxe Rooms)
 */
function addRoyalGuestRoom(parent, mats, x0, y, z0, roomW, roomD, roomNum = '303', doorFaceZ = -1) {
  const cx = x0 + roomW * 0.5;
  const cz = z0 + roomD * 0.5;

  // Cherry-Mahogany Full-Width Headboard + Double & Single Beds
  box(parent, [0.10, 1.32, Math.max(2.6, roomD - 1.4)], [x0 + 0.12, y + 0.72, cz], mats.mahogany);
  box(parent, [2.10, 0.34, 1.74], [x0 + 1.20, y + 0.17, z0 + 1.42], mats.mahogany);
  box(parent, [2.00, 0.24, 1.64], [x0 + 1.20, y + 0.45, z0 + 1.42], mats.crispWhite);
  box(parent, [0.42, 0.16, 0.66], [x0 + 0.45, y + 0.64, z0 + 1.04], mats.crispWhite);
  box(parent, [0.42, 0.16, 0.66], [x0 + 0.45, y + 0.64, z0 + 1.80], mats.crispWhite);

  // Bedside Table + Phone + Tissue Box
  box(parent, [0.46, 0.54, 0.50], [x0 + 0.42, y + 0.27, z0 + 2.60], mats.mahogany);
  box(parent, [0.22, 0.10, 0.20], [x0 + 0.42, y + 0.59, z0 + 2.52], mats.blackGloss);
  box(parent, [0.14, 0.09, 0.22], [x0 + 0.42, y + 0.59, z0 + 2.72], mats.herlanRed);

  if (roomD >= 5.2) {
    // Single Bed beside it
    box(parent, [2.10, 0.34, 1.06], [x0 + 1.20, y + 0.17, z0 + 3.52], mats.mahogany);
    box(parent, [2.00, 0.24, 0.98], [x0 + 1.20, y + 0.45, z0 + 3.52], mats.crispWhite);
    box(parent, [0.42, 0.16, 0.64], [x0 + 0.45, y + 0.64, z0 + 3.52], mats.crispWhite);
  }

  // Framed Wall Art above headboard
  box(parent, [0.05, 0.72, 0.58], [x0 + 0.08, y + 1.95, z0 + 1.48], mats.mahogany);
  box(parent, [0.06, 0.58, 0.44], [x0 + 0.09, y + 1.95, z0 + 1.48], mats.goldVelvet);

  // Opposite Full-Height Cherry-Mahogany TV Wall Panel + Flat-Screen Smart TV
  const eastX = x0 + roomW - 0.14;
  box(parent, [0.10, 3.15, 1.72], [eastX, y + 1.58, z0 + 2.02], mats.mahogany);
  box(parent, [0.07, 0.76, 1.26], [eastX - 0.08, y + 1.72, z0 + 2.02], mats.blackGloss);

  // Mahogany Wardrobe + Red Mini-Fridge + Mirror Dressing Desk + Kettle + Rolling Chair
  const winZ = z0 + roomD - 0.22;
  box(parent, [0.82, 2.30, 0.62], [x0 + 0.54, y + 1.15, winZ - 0.40], mats.mahogany);
  box(parent, [0.74, 0.80, 0.65], [x0 + 0.54, y + 0.41, winZ - 0.40], mats.herlanRed);
  box(parent, [1.22, 0.76, 0.56], [x0 + 1.62, y + 0.38, winZ - 0.38], mats.mahogany);
  box(parent, [1.08, 1.14, 0.05], [x0 + 1.62, y + 1.40, winZ - 0.12], mats.mirror);
  cylinder(parent, 0.08, 0.09, 0.22, [x0 + 1.42, y + 0.88, winZ - 0.38], mats.cyanKettle, 10);

  box(parent, [0.46, 0.08, 0.46], [x0 + 1.62, y + 0.46, winZ - 1.00], mats.darkLeather);
  box(parent, [0.44, 0.44, 0.08], [x0 + 1.62, y + 0.72, winZ - 1.20], mats.darkLeather);
  cylinder(parent, 0.04, 0.04, 0.44, [x0 + 1.62, y + 0.22, winZ - 1.00], mats.blackGloss, 8);

  // Leather Accent Chair + Round Coffee Table + Dark Brown Curtains
  cylinder(parent, 0.36, 0.34, 0.50, [eastX - 1.30, y + 0.25, winZ - 0.82], mats.darkLeather, 14);
  box(parent, [0.64, 0.40, 0.64], [eastX - 0.62, y + 0.20, winZ - 0.82], mats.darkLeather);
  box(parent, [0.46, 2.30, 0.12], [x0 + 2.40, y + 1.46, winZ - 0.08], mats.brownCurtain);
  box(parent, [0.46, 2.30, 0.12], [eastX - 0.34, y + 1.46, winZ - 0.08], mats.brownCurtain);

  // Split AC Unit + Ceiling Fan
  box(parent, [1.10, 0.28, 0.24], [cx, y + 2.75, winZ - 0.16], mats.acUnit);
  addCeilingFan(parent, mats, cx, y + 3.22, cz - 0.2);

  // Attached Modern White-Tiled Bathroom
  const bx = eastX - 1.02;
  const bz = z0 + 0.82;
  box(parent, [1.80, 0.04, 1.50], [bx, y + 0.02, bz], mats.concrete);
  box(parent, [0.42, 0.44, 0.54], [bx + 0.52, y + 0.22, bz - 0.34], mats.crispWhite);
  box(parent, [0.42, 0.42, 0.22], [bx + 0.52, y + 0.62, bz - 0.52], mats.crispWhite);
  cylinder(parent, 0.23, 0.14, 0.80, [bx - 0.46, y + 0.40, bz - 0.44], mats.crispWhite, 12);
  box(parent, [0.66, 0.80, 0.04], [bx - 0.46, y + 1.46, bz - 0.66], mats.mirror);

  // Room Number Plate on Corridor Wall
  const plateTex = makeSignPlateTex(roomNum, 'ROYAL DELUXE', '#1e293b', '#f8fafc');
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.22),
    new THREE.MeshBasicMaterial({ map: plateTex, side: THREE.DoubleSide }),
  );
  plate.position.set(cx, y + 1.76, doorFaceZ < 0 ? z0 - 0.14 : z0 + roomD + 0.14);
  if (doorFaceZ < 0) plate.rotation.y = Math.PI;
  parent.add(plate);
}

/**
 * Recessed Architectural Window Bay Helper (Frame + Sill + Glass + Mullions)
 */
function addArchitecturalWindowBay(parent, mats, pos, width, height, rotY = 0, withAC = false) {
  const wg = new THREE.Group();
  wg.position.set(...pos);
  wg.rotation.y = rotY;

  // Deep Dark-Bronze/Aluminum Outer Frame & Granite Sill Ledge
  box(wg, [width + 0.16, 0.10, 0.34], [0, -height * 0.5 - 0.04, 0.05], mats.blackGranite);
  box(wg, [width + 0.12, 0.08, 0.28], [0, height * 0.5 + 0.02, 0.02], mats.chrome);
  box(wg, [0.08, height, 0.26], [-width * 0.5, 0, 0], mats.chrome);
  box(wg, [0.08, height, 0.26], [width * 0.5, 0, 0], mats.chrome);

  // Reflective Recessed Dark-Green Tinted Architectural Glass
  box(wg, [width - 0.08, height - 0.08, 0.06], [0, 0, -0.04], mats.greenGlass, { castShadow: false });

  // Vertical & Horizontal Mullions
  const cols = width >= 2.4 ? 2 : 1;
  for (let c = 1; c <= cols; c++) {
    const mx = -width * 0.5 + (c / (cols + 1)) * width;
    box(wg, [0.055, height - 0.08, 0.12], [mx, 0, -0.01], mats.chrome);
  }
  box(wg, [width - 0.08, 0.05, 0.12], [0, height * 0.18, -0.01], mats.chrome);

  // Optional Exterior Split-AC Outdoor Unit tucked neatly below sill
  if (withAC) {
    box(wg, [0.74, 0.48, 0.30], [width * 0.25, -height * 0.5 - 0.34, 0.18], mats.acUnit);
    cylinder(wg, 0.17, 0.17, 0.04, [width * 0.25 - 0.14, -height * 0.5 - 0.34, 0.34], mats.blackGloss, 10);
  }

  parent.add(wg);
}

/* ============================================================================
 * MAIN STANDALONE BUILDER: buildHotelRoyalStandalone3D()
 * ========================================================================== */

export function buildHotelRoyalStandalone3D() {
  const root = new THREE.Group();
  root.name = 'HotelRoyalInternational_Khulna_2026_Photorealistic';

  const exteriorG = new THREE.Group();
  exteriorG.name = 'ExteriorShell';
  const interiorG = new THREE.Group();
  interiorG.name = 'WalkableInterior';
  const towerShellG = new THREE.Group();
  towerShellG.name = 'TowerExteriorShell';
  const towerIntG = new THREE.Group();
  towerIntG.name = 'TowerWalkableInterior';
  root.add(exteriorG, interiorG, towerShellG, towerIntG);

  // --- Photorealistic Layered PBR Textures & Materials ---
  const concreteTex = makePanelizedConcreteTex('#cfc2ad', 301);
  const towerWhiteTex = makeTowerPlasterTex('#eae5da', 405);
  const towerTaupeTex = makeTowerPlasterTex('#bfb19c', 409);
  const marbleTex = makeMarbleTileTex('#f5f1e8', '#cfc7b8', 402);
  const reliefTex = make3DGeometricReliefTex();
  const stoneTex = makeStoneWallTex();
  const mosaicTex = makeBlueMosaicTex();
  const paverTex = makePaverDrivewayTex();
  const goldHammerTex = makeHammeredGoldTex();
  const tigerTex = makeTigerJaaliTex();
  const elevTex = makeElevatorDoorTex();
  const warmWoodTex = makeWoodGrainTex('#8b4c24', '#4e240c', 515);
  const mahoganyTex = makeWoodGrainTex('#5e211b', '#2c0c09', 525);
  const graniteTex = makeGraniteTex('#181b21', 612);
  const velvetTex = makeFabricTex('#d4b270', 'velvet', 711);
  const curtainTex = makeFabricTex('#452b20', 'curtain', 722);
  const carpetTex = makeFabricTex('#991b1b', 'carpet', 733);
  const leatherTex = makeFabricTex('#2b1d18', 'leather', 744);
  const acpTex = makeBlackACPPanelTex();
  const roofTileTex = makeRoofTileTex();

  const podiumConcMat = new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.74, metalness: 0.04 });
  attachDerivedPBRMaps(podiumConcMat, concreteTex, { strength: 2.2, roughBase: 0.74, roughSpread: 0.18, normalScale: 0.72 });

  const towerWhiteMat = new THREE.MeshStandardMaterial({ map: towerWhiteTex, roughness: 0.70, metalness: 0.03 });
  attachDerivedPBRMaps(towerWhiteMat, towerWhiteTex, { strength: 1.8, roughBase: 0.70, roughSpread: 0.16, normalScale: 0.58 });

  const towerTaupeMat = new THREE.MeshStandardMaterial({ map: towerTaupeTex, roughness: 0.76, metalness: 0.03 });
  attachDerivedPBRMaps(towerTaupeMat, towerTaupeTex, { strength: 2.0, roughBase: 0.76, roughSpread: 0.18, normalScale: 0.65 });

  const marbleFloorMat = new THREE.MeshPhysicalMaterial({ map: marbleTex, roughness: 0.15, metalness: 0.04, clearcoat: 0.85, envMapIntensity: 1.15 });
  attachDerivedPBRMaps(marbleFloorMat, marbleTex, { strength: 0.85, roughBase: 0.16, roughSpread: 0.10, normalScale: 0.28 });

  const reliefWallMat = new THREE.MeshStandardMaterial({ map: reliefTex, roughness: 0.45, metalness: 0.04 });
  attachDerivedPBRMaps(reliefWallMat, reliefTex, { strength: 2.6, roughBase: 0.45, normalScale: 0.90 });

  const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.84, metalness: 0.05 });
  attachDerivedPBRMaps(stoneMat, stoneTex, { strength: 2.6, roughBase: 0.84, normalScale: 0.88 });

  const paverMat = new THREE.MeshStandardMaterial({ map: paverTex, roughness: 0.80, metalness: 0.04 });
  attachDerivedPBRMaps(paverMat, paverTex, { strength: 2.2, roughBase: 0.80, normalScale: 0.72 });

  const roofTileMat = new THREE.MeshStandardMaterial({ map: roofTileTex, roughness: 0.82, metalness: 0.04 });
  attachDerivedPBRMaps(roofTileMat, roofTileTex, { strength: 1.9, roughBase: 0.82, normalScale: 0.62 });

  const warmWoodMat = new THREE.MeshPhysicalMaterial({ map: warmWoodTex, roughness: 0.38, clearcoat: 0.42, envMapIntensity: 0.95 });
  attachDerivedPBRMaps(warmWoodMat, warmWoodTex, { strength: 1.6, roughBase: 0.38, normalScale: 0.52 });

  const mahoganyMat = new THREE.MeshPhysicalMaterial({ map: mahoganyTex, roughness: 0.32, clearcoat: 0.52, envMapIntensity: 1.05 });
  attachDerivedPBRMaps(mahoganyMat, mahoganyTex, { strength: 1.6, roughBase: 0.32, normalScale: 0.52 });

  const blackGraniteMat = new THREE.MeshPhysicalMaterial({ map: graniteTex, roughness: 0.18, metalness: 0.14, clearcoat: 0.85, envMapIntensity: 1.2 });
  attachDerivedPBRMaps(blackGraniteMat, graniteTex, { strength: 1.2, roughBase: 0.18, normalScale: 0.35 });

  const blackGlossMat = new THREE.MeshPhysicalMaterial({ map: acpTex, roughness: 0.18, metalness: 0.35, clearcoat: 0.92, envMapIntensity: 1.35 });
  attachDerivedPBRMaps(blackGlossMat, acpTex, { strength: 1.5, roughBase: 0.18, normalScale: 0.42 });

  const goldVelvetMat = new THREE.MeshStandardMaterial({ map: velvetTex, roughness: 0.86, metalness: 0.05 });
  attachDerivedPBRMaps(goldVelvetMat, velvetTex, { strength: 1.8, roughBase: 0.86, normalScale: 0.65 });

  const brownCurtainMat = new THREE.MeshStandardMaterial({ map: curtainTex, roughness: 0.92 });
  attachDerivedPBRMaps(brownCurtainMat, curtainTex, { strength: 2.0, roughBase: 0.92, normalScale: 0.72 });

  const redCarpetMat = new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.94 });
  const darkLeatherMat = new THREE.MeshStandardMaterial({ map: leatherTex, roughness: 0.48, metalness: 0.05 });
  const mosaicMat = new THREE.MeshPhysicalMaterial({ map: mosaicTex, roughness: 0.20, clearcoat: 0.80, envMapIntensity: 1.1 });
  const hammeredGoldMat = new THREE.MeshPhysicalMaterial({ map: goldHammerTex, roughness: 0.24, metalness: 0.90, clearcoat: 0.60, envMapIntensity: 1.35 });
  attachDerivedPBRMaps(hammeredGoldMat, goldHammerTex, { strength: 2.4, roughBase: 0.24, normalScale: 0.80 });

  const mats = {
    podiumConc: podiumConcMat,
    towerWhite: towerWhiteMat,
    towerTaupe: towerTaupeMat,
    roofTile: roofTileMat,
    marbleFloor: marbleFloorMat,
    whiteWall: new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.76 }),
    crispWhite: new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.80 }),
    espressoCeiling: new THREE.MeshStandardMaterial({ color: 0x221712, roughness: 0.68 }),
    warmWood: warmWoodMat,
    mahogany: mahoganyMat,
    goldVelvet: goldVelvetMat,
    goldTrim: new THREE.MeshPhysicalMaterial({ color: 0xf5b82e, roughness: 0.20, metalness: 0.92, envMapIntensity: 1.4 }),
    blackGloss: blackGlossMat,
    blackGranite: blackGraniteMat,
    slateWall: new THREE.MeshStandardMaterial({ color: 0x2d343c, roughness: 0.78 }),
    darkLeather: darkLeatherMat,
    brownCurtain: brownCurtainMat,
    herlanRed: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.42 }),
    redCarpet: redCarpetMat,
    cyanKettle: new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.22, clearcoat: 0.75 }),
    acUnit: new THREE.MeshStandardMaterial({ color: 0xeff3f7, roughness: 0.38 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.85 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xdce3ec, roughness: 0.16, metalness: 0.92, envMapIntensity: 1.3 }),
    mirror: new THREE.MeshPhysicalMaterial({ color: 0xdbeafe, roughness: 0.04, metalness: 0.94, clearcoat: 1.0, envMapIntensity: 1.5 }),
    greenGlass: new THREE.MeshPhysicalMaterial({
      color: 0x123e3c,
      roughness: 0.05,
      metalness: 0.22,
      clearcoat: 1.0,
      reflectivity: 0.95,
      envMapIntensity: 1.55,
      transparent: true,
      opacity: 0.44,
      side: THREE.DoubleSide,
    }),
    clearGlass: new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      roughness: 0.04,
      metalness: 0.12,
      clearcoat: 1.0,
      envMapIntensity: 1.35,
      transparent: true,
      opacity: 0.26,
      side: THREE.DoubleSide,
    }),
    waterBlue: new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      roughness: 0.06,
      metalness: 0.10,
      clearcoat: 1.0,
      envMapIntensity: 1.4,
      transparent: true,
      opacity: 0.84,
    }),
    ledWarm: new THREE.MeshStandardMaterial({ color: 0xfff7dc, emissive: 0xffd782, emissiveIntensity: 1.85, roughness: 0.2 }),
    ledWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf8fafc, emissiveIntensity: 1.65, roughness: 0.2 }),
    beaconRed: new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff2a1f, emissiveIntensity: 2.2, roughness: 0.2 }),
    reliefWall: reliefWallMat,
    stoneWall: stoneMat,
    mosaic: mosaicMat,
    paver: paverMat,
    hammeredGold: hammeredGoldMat,
    tigerJaali: new THREE.MeshStandardMaterial({ map: tigerTex, emissive: 0xffffff, emissiveMap: tigerTex, emissiveIntensity: 0.35 }),
    elevDoor: new THREE.MeshStandardMaterial({ map: elevTex, roughness: 0.22, metalness: 0.85, envMapIntensity: 1.25 }),
  };

  /* ==========================================================================
   * 1. EXTERIOR FORECOURT, STONE CASCADING FOUNTAIN, ACCORDION GATE & HERLAN SHOWROOM
   * ======================================================================== */
  // Paved Forecourt Platform extending cleanly around both Podium & 10-Story Tower
  box(exteriorG, [48.0, 0.16, 54.0], [-2.0, -0.08, -4.0], mats.paver, { uvScale: 9.0, castShadow: false });

  // Stone-Cladded Cascading Blue-Mosaic Outdoor Fountain (Left of Entrance)
  box(exteriorG, [6.2, 1.45, 1.4], [-7.4, 0.72, 13.8], mats.stoneWall, { uvScale: 2.0 });
  box(exteriorG, [5.6, 0.52, 1.15], [-7.4, 0.26, 14.9], mats.stoneWall);
  box(exteriorG, [5.2, 0.36, 0.86], [-7.4, 0.36, 14.9], mats.mosaic);
  box(exteriorG, [5.0, 0.06, 0.78], [-7.4, 0.56, 14.9], mats.waterBlue);
  box(exteriorG, [2.4, 1.95, 0.28], [-7.4, 1.42, 13.8], mats.crispWhite);
  for (let i = 0; i < 9; i++) {
    cylinder(exteriorG, 0.03, 0.03, 1.65, [-11.8 + i * 0.42, 0.84, 15.6], mats.chrome, 6);
  }
  for (let bx = -4.2; bx <= 4.2; bx += 1.4) {
    if (Math.abs(bx) < 2.2) continue;
    cylinder(exteriorG, 0.11, 0.11, 0.35, [bx, 0.18, 12.6], mats.herlanRed, 8);
    cylinder(exteriorG, 0.11, 0.11, 0.22, [bx, 0.46, 12.6], mats.crispWhite, 8);
  }

  // Adjacent Red "HERLAN NEW YORK" Corner Showroom
  box(exteriorG, [5.8, 3.85, 5.2], [-13.6, 1.92, 11.2], mats.herlanRed);
  const herlanTex = makeSignPlateTex('HERLAN', 'NEW YORK · AUTHENTIC COSMETICS', '#dc2626', '#ffffff');
  const herlanSign = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 1.25),
    new THREE.MeshBasicMaterial({ map: herlanTex }),
  );
  herlanSign.position.set(-13.6, 3.15, 13.84);
  exteriorG.add(herlanSign);

  /* ==========================================================================
   * 2. HOLLOW 3-STORY CURVED BEIGE PODIUM SHELL (EXTERIOR + WALKABLE FLOORS)
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

  // Ground Floor Full Marble Slab
  box(interiorG, [24.0, 0.26, 20.0], [0, 0.12, 0.0], mats.marbleFloor, { uvScale: 6.0 });
  cylinder(interiorG, R_OUT - 0.1, R_OUT - 0.1, 0.26, [0, 0.12, 0], mats.marbleFloor, 32);

  // 2nd & 3rd Floor Slabs (with stairwell cutout at x = -4.2..-0.4, z = -9.5..-3.5)
  for (const fy of [4.05, 7.85]) {
    box(interiorG, [24.0, 0.24, 15.5], [0, fy - 0.12, 4.2], mats.marbleFloor, { uvScale: 5.0 });
    box(interiorG, [8.2, 0.24, 6.2], [-8.0, fy - 0.12, -6.5], mats.marbleFloor, { uvScale: 2.5 });
    box(interiorG, [12.4, 0.24, 6.2], [5.8, fy - 0.12, -6.5], mats.marbleFloor, { uvScale: 3.0 });
    cylinder(interiorG, R_GLASS + 0.1, R_GLASS + 0.1, 0.22, [0, fy - 0.12, 0], mats.marbleFloor, 32);
  }

  // Podium Rooftop Slab (Clean weatherproof architectural tiled deck — ZERO fake trees!)
  box(exteriorG, [24.6, 0.30, 21.0], [0, 11.50, 0.0], mats.roofTile, { uvScale: 5.0 });
  cylinder(exteriorG, R_OUT - 0.15, R_OUT - 0.15, 0.30, [0, 11.50, 0], mats.roofTile, 32);

  // Back & Side Structural Perimeter Walls of Podium — WITH WIDE WALKABLE ARCHWAYS INTO THE 10-STORY TOWER!
  // Back wall at z = -9.8 has a wide open doorway at x = -11.0..-8.2 on Floors 1, 2 & 3!
  box(exteriorG, [1.2, 11.6, 0.38], [-11.6, 5.8, -9.8], mats.podiumConc);
  box(exteriorG, [20.4, 11.6, 0.38], [2.0, 5.8, -9.8], mats.podiumConc);
  // Archway lintels & warm teak portal trim connecting Podium -> 10-Story Tower on Floors 1, 2, 3
  for (const fy of [0.25, 4.05, 7.85]) {
    box(interiorG, [2.8, 0.72, 0.42], [-9.6, fy + 3.44, -9.8], mats.podiumConc);
    box(interiorG, [0.16, 3.12, 0.48], [-11.0, fy + 1.56, -9.8], mats.warmWood);
    box(interiorG, [0.16, 3.12, 0.48], [-8.2, fy + 1.56, -9.8], mats.warmWood);
    box(interiorG, [2.96, 0.16, 0.48], [-9.6, fy + 3.08, -9.8], mats.goldTrim);
  }
  const towerPortalTex = makeSignPlateTex('TOWER WING & SUITES', 'BANQUET · ELEVATORS · FLOORS 1–10', '#1e293b', '#facc15');
  for (const fy of [0.25, 4.05, 7.85]) {
    const signM = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.56),
      new THREE.MeshStandardMaterial({ map: towerPortalTex, emissive: 0xffffff, emissiveMap: towerPortalTex, emissiveIntensity: 0.45 }),
    );
    signM.position.set(-9.6, fy + 3.36, -9.56);
    interiorG.add(signM);
  }

  // Side walls of Podium
  box(exteriorG, [0.38, 11.6, 20.0], [-12.2, 5.8, 0.0], mats.podiumConc);
  box(exteriorG, [0.38, 11.6, 20.0], [12.2, 5.8, 0.0], mats.podiumConc);

  // Iconic Curved Facade: Horizontal Concrete Slabs + Recessed Reflective Dark-Green Glass + Columns + AC Units
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

    const glassW = R_GLASS * stepAng + 0.06;
    for (let fl = 0; fl < 3; fl++) {
      if (fl === 0 && Math.abs(am) < 0.28) continue;
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

    if (i % 2 === 0 || i === SEGS - 1) {
      const colA = i === SEGS - 1 ? a0 + stepAng : a0;
      addRotBox(exteriorG, [0.38, 11.6, 0.42], [Math.sin(colA) * R_COL, 5.8, Math.cos(colA) * R_COL], mats.podiumConc, colA);
    }

    if (i >= 2 && i <= SEGS - 3 && i % 2 === 1) {
      for (const acY of [4.75, 8.55]) {
        addRotBox(exteriorG, [0.76, 0.50, 0.34], [sinA * (R_COL - 0.05), acY, cosA * (R_COL - 0.05)], mats.acUnit, am);
      }
    }
  }

  // Curved Top Rim Sign: "HOTEL ROYAL INTERNATIONAL LIMITED"
  const rimTex = makeCurvedRimBannerTex();
  const rimMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(R_OUT + 0.12, R_OUT + 0.12, 0.82, 28, 1, true, -0.92, 1.84),
    new THREE.MeshStandardMaterial({ map: rimTex, transparent: true, emissive: 0xffffff, emissiveMap: rimTex, emissiveIntensity: 0.25 }),
  );
  rimMesh.position.y = 11.68;
  exteriorG.add(rimMesh);

  // Glossy Black ACP Curved Entrance Canopy + Glowing Red-White "HOTEL ROYAL" + Glass Balustrade
  box(exteriorG, [8.4, 0.62, 4.2], [0, 3.92, 13.6], mats.podiumConc);
  box(exteriorG, [8.5, 1.15, 0.24], [0, 4.42, 15.62], mats.blackGloss);
  const blackSignTex = makeBlackCanopyHotelRoyalTex();
  const blackSign = new THREE.Mesh(
    new THREE.PlaneGeometry(8.2, 1.05),
    new THREE.MeshStandardMaterial({ map: blackSignTex, emissive: 0xffffff, emissiveMap: blackSignTex, emissiveIntensity: 0.85 }),
  );
  blackSign.position.set(0, 4.42, 15.76);
  exteriorG.add(blackSign);
  box(exteriorG, [8.2, 1.05, 0.08], [0, 4.75, 15.48], mats.clearGlass);
  for (const cx of [-3.8, 3.8]) box(exteriorG, [0.46, 3.72, 0.46], [cx, 1.86, 15.2], mats.podiumConc);
  for (const lx of [-2.4, 0, 2.4]) {
    cylinder(exteriorG, 0.16, 0.16, 0.05, [lx, 3.58, 13.8], mats.ledWhite, 10);
  }
  box(interiorG, [2.6, 0.025, 1.8], [0, 0.27, 11.6], mats.redCarpet);
  box(interiorG, [1.35, 2.75, 0.06], [-2.15, 1.65, 11.6], mats.clearGlass);
  box(interiorG, [1.35, 2.75, 0.06], [2.15, 1.65, 11.6], mats.clearGlass);

  /* ==========================================================================
   * 3. GROUND FLOOR PODIUM (y = 0.25m): 2026 RENOVATED RECEPTION LOBBY
   * ======================================================================== */
  const y0 = 0.25;
  box(interiorG, [23.6, 0.14, 21.0], [0, 3.82, 0.8], mats.espressoCeiling);
  for (const lx of [-5.5, 0, 5.5]) {
    box(interiorG, [0.42, 0.06, 16.5], [lx, 3.74, 1.8], mats.ledWhite, { castShadow: false });
  }
  box(interiorG, [0.76, 3.55, 0.76], [1.2, y0 + 1.78, 5.2], mats.warmWood);
  box(interiorG, [0.10, 3.45, 0.05], [1.2, y0 + 1.78, 5.60], mats.ledWhite);

  // Left: 3D Geometric Diamond Wall + Curved Champagne-Gold Tufted Sofa
  box(interiorG, [0.22, 3.55, 8.8], [-11.85, y0 + 1.78, 4.4], mats.reliefWall);
  addTuftedSofa(interiorG, mats, -10.85, y0, 4.4, 5.8, Math.PI * 0.5);

  // Left-Back: Warm Wooden Reception Counter (clear of Tower Portal at z = -9.8!)
  box(interiorG, [1.15, 1.12, 5.2], [-9.2, y0 + 0.56, -2.6], mats.warmWood);
  box(interiorG, [1.25, 0.08, 5.35], [-9.2, y0 + 1.14, -2.6], mats.marbleFloor);
  box(interiorG, [0.16, 0.42, 0.62], [-9.4, y0 + 1.38, -1.6], mats.blackGloss);
  box(interiorG, [0.16, 0.42, 0.62], [-9.4, y0 + 1.38, -3.5], mats.blackGloss);
  const recTex = makeSignPlateTex('RECEPTION', 'HOTEL ROYAL INTERNATIONAL LTD.', '#3b1f14', '#facc15');
  const recSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 1.05),
    new THREE.MeshStandardMaterial({ map: recTex, emissive: 0xffffff, emissiveMap: recTex, emissiveIntensity: 0.55 }),
  );
  recSign.position.set(-11.8, y0 + 2.35, -2.6);
  recSign.rotation.y = Math.PI * 0.5;
  interiorG.add(recSign);

  // Right: Backlit Vertical Wood Louvers + Tufted Sofas
  for (let lz = -3.2; lz <= 7.8; lz += 0.68) {
    box(interiorG, [0.24, 3.55, 0.14], [11.6, y0 + 1.78, lz], mats.warmWood);
  }
  box(interiorG, [0.06, 3.4, 11.4], [11.9, y0 + 1.78, 2.3], mats.ledWarm);
  addTuftedSofa(interiorG, mats, 9.6, y0, 4.8, 3.4, -Math.PI * 0.5);
  addTuftedSofa(interiorG, mats, 9.6, y0, 0.2, 3.4, -Math.PI * 0.5);
  box(interiorG, [0.85, 0.44, 1.5], [7.8, y0 + 0.22, 2.5], mats.marbleFloor);

  // Back Center: Curved Slate-Grey Indoor Fountain + Tiger Jaali Screen + Podium Elevator + Granite Stairs
  cylinder(interiorG, 2.55, 2.55, 3.55, [0.2, y0 + 1.78, -5.8], mats.slateWall, 24);
  cylinder(interiorG, 3.25, 3.25, 0.58, [0.2, y0 + 0.29, -5.8], mats.mosaic, 24);
  cylinder(interiorG, 3.05, 3.05, 0.06, [0.2, y0 + 0.56, -5.8], mats.waterBlue, 24);
  cylinder(interiorG, 3.30, 3.30, 0.08, [0.2, y0 + 0.06, -5.8], mats.ledWarm, 24);

  box(interiorG, [3.6, 2.85, 0.14], [6.6, y0 + 1.48, -6.8], mats.warmWood);
  const tigerMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 2.65), mats.tigerJaali);
  tigerMesh.position.set(6.6, y0 + 1.48, -6.70);
  interiorG.add(tigerMesh);

  for (const fy of [0.25, 4.05, 7.85]) {
    box(interiorG, [1.75, 2.45, 0.12], [-6.4, fy + 1.22, -9.55], mats.chrome);
    const elevMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 2.28), mats.elevDoor);
    elevMesh.position.set(-6.4, fy + 1.15, -9.47);
    interiorG.add(elevMesh);
    box(interiorG, [1.85, 0.025, 1.15], [-6.4, fy + 0.015, -8.8], mats.redCarpet);
  }

  // Grand Black-Granite Podium Staircase + Shimmering Hammered-Gold Wall
  box(interiorG, [0.16, 11.2, 6.4], [-4.2, 5.8, -6.6], mats.hammeredGold);
  const buildPodiumStairFlight = (yBot, yTop) => {
    const yMid = (yBot + yTop) * 0.5;
    const steps = 10;
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const sz = THREE.MathUtils.lerp(-3.6, -8.2, t);
      const sy = THREE.MathUtils.lerp(yBot, yMid, (i + 1) / steps);
      box(interiorG, [1.75, 0.22, 0.48], [-3.2, sy - 0.11, sz], mats.blackGranite);
    }
    box(interiorG, [3.6, 0.22, 1.45], [-2.3, yMid - 0.11, -8.9], mats.blackGranite);
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const sz = THREE.MathUtils.lerp(-8.2, -3.6, t);
      const sy = THREE.MathUtils.lerp(yMid, yTop, (i + 1) / steps);
      box(interiorG, [1.75, 0.22, 0.48], [-1.4, sy - 0.11, sz], mats.blackGranite);
    }
    rodBetween(interiorG, [-2.3, yBot + 0.92, -3.6], [-2.3, yMid + 0.92, -8.2], 0.035, mats.chrome);
    rodBetween(interiorG, [-2.3, yMid + 0.92, -8.2], [-2.3, yTop + 0.92, -3.6], 0.035, mats.chrome);
  };
  buildPodiumStairFlight(0.25, 4.05);
  buildPodiumStairFlight(4.05, 7.85);

  /* ==========================================================================
   * 4. 2ND FLOOR PODIUM (y = 4.05m): SAPPHIRE RESTAURANT
   * ======================================================================== */
  const y1 = 4.05;
  box(interiorG, [23.6, 0.14, 21.0], [0, y1 + 3.60, 0.8], mats.espressoCeiling);
  for (let cx = -9; cx <= 9; cx += 4.5) {
    box(interiorG, [0.36, 0.22, 18.0], [cx, y1 + 3.48, 1.2], mats.crispWhite);
    box(interiorG, [0.12, 0.06, 17.5], [cx + 0.24, y1 + 3.44, 1.2], mats.ledWarm);
  }
  for (let cz = -6; cz <= 8; cz += 4.5) {
    box(interiorG, [21.0, 0.22, 0.36], [0, y1 + 3.48, cz], mats.crispWhite);
  }

  for (let lz = -5.0; lz <= 7.0; lz += 0.42) {
    box(interiorG, [0.14, 3.5, 0.12], [11.6, y1 + 1.75, lz], mats.warmWood);
  }
  box(interiorG, [1.35, 0.98, 9.2], [9.4, y1 + 0.49, 1.2], mats.blackGranite);
  box(interiorG, [1.45, 0.08, 9.4], [9.4, y1 + 1.00, 1.2], mats.concrete);
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

  for (const [px, pz] of [[-5.5, 4.5], [3.5, 4.5], [-5.5, -1.5], [3.5, -1.5]]) {
    box(interiorG, [0.72, 3.55, 0.72], [px, y1 + 1.78, pz], mats.warmWood);
  }
  for (const [tx, tz] of [[-8.2, 6.2], [-2.0, 7.6], [4.2, 7.6], [-8.2, 1.5], [-1.5, 2.4], [4.8, 2.4]]) {
    addDiningTableSet(interiorG, mats, tx, y1, tz);
  }

  /* ==========================================================================
   * 5. 3RD FLOOR PODIUM (y = 7.85m): GUEST CORRIDOR + ROOMS 301, 302, 303
   * ======================================================================== */
  const y2 = 7.85;
  box(interiorG, [23.8, 0.24, 0.14], [0, y2 + 1.10, -3.5], mats.mahogany);
  for (const [x0, x1] of [[-12.0, -9.2], [-7.2, -1.0], [1.0, 7.2], [9.2, 12.0]]) {
    box(interiorG, [x1 - x0, 3.55, 0.22], [(x0 + x1) * 0.5, y2 + 1.78, 0.0], mats.whiteWall);
    box(interiorG, [x1 - x0, 0.22, 0.26], [(x0 + x1) * 0.5, y2 + 1.10, 0.0], mats.mahogany);
  }
  box(interiorG, [0.22, 3.55, 9.2], [-4.0, y2 + 1.78, 4.6], mats.whiteWall);
  box(interiorG, [0.22, 3.55, 9.2], [4.0, y2 + 1.78, 4.6], mats.whiteWall);
  for (const lx of [-8.0, 0.0, 8.0]) {
    box(interiorG, [0.65, 0.06, 0.65], [lx, y2 + 3.52, -1.8], mats.ledWhite);
  }

  addRoyalGuestRoom(interiorG, mats, -11.8, y2, 0.15, 7.6, 8.4, '301');
  addRoyalGuestRoom(interiorG, mats, -3.8, y2, 0.15, 7.6, 9.6, '303');
  addRoyalGuestRoom(interiorG, mats, 4.2, y2, 0.15, 7.6, 8.4, '302');

  /* ==========================================================================
   * 6. CLEAN ARCHITECTURAL PODIUM ROOF TERRACE (y = 11.65m — ZERO FAKE TREES!)
   * ======================================================================== */
  const roofY = 11.65;
  for (let i = 0; i < SEGS; i++) {
    const am = ARC_START + (i + 0.5) * stepAng;
    const segW = R_OUT * stepAng + 0.12;
    addRotBox(exteriorG, [segW, 0.92, 0.24], [Math.sin(am) * (R_OUT - 0.12), roofY + 0.46, Math.cos(am) * (R_OUT - 0.12)], mats.podiumConc, am);
    // Clean granite coping cap along parapet rim
    addRotBox(exteriorG, [segW + 0.03, 0.08, 0.32], [Math.sin(am) * (R_OUT - 0.12), roofY + 0.94, Math.cos(am) * (R_OUT - 0.12)], mats.blackGranite, am);
  }
  // Sleek Architectural Glass Skylight Lantern & Warm Deck Bollard Lights on Podium Terrace
  box(exteriorG, [6.4, 0.38, 3.4], [2.4, roofY + 0.19, 2.2], mats.blackGranite);
  box(exteriorG, [6.0, 0.56, 3.0], [2.4, roofY + 0.64, 2.2], mats.clearGlass);
  for (let sx = -0.4; sx <= 5.2; sx += 1.4) {
    box(exteriorG, [0.08, 0.58, 3.04], [sx, roofY + 0.64, 2.2], mats.chrome);
  }
  for (const [bx, bz] of [[-5.0, 7.2], [0.0, 9.0], [5.0, 7.2], [7.8, 2.6]]) {
    cylinder(exteriorG, 0.08, 0.09, 0.68, [bx, roofY + 0.34, bz], mats.blackGloss, 8);
    cylinder(exteriorG, 0.075, 0.075, 0.14, [bx, roofY + 0.72, bz], mats.ledWarm, 8);
  }

  /* ==========================================================================
   * 7. HIGH-REALISTIC, FULLY HOLLOW & WALKABLE 10-STORY MAIN TOWER
   *    Positioned cleanly behind Podium back wall:
   *      X: -14.2 .. +3.8 (width = 18.0m, center = -5.2)
   *      Z: -25.8 .. -9.8 (depth = 16.0m, center = -17.8)
   *    10 Real Walkable Floors:
   *      F1=0.25, F2=4.05, F3=7.85 (match Podium), F4=11.65 .. F10=32.05 (3.4m each), Roof=35.45
   * ======================================================================== */
  const twX0 = -14.2;
  const twX1 = 3.8;
  const twCX = (twX0 + twX1) * 0.5; // -5.2
  const twW = twX1 - twX0;          // 18.0
  const twZ0 = -25.8;
  const twZ1 = -9.8;
  const twCZ = (twZ0 + twZ1) * 0.5; // -17.8
  const twD = twZ1 - twZ0;          // 16.0

  const towerFloorYs = [0.25, 4.05, 7.85, 11.65, 15.05, 18.45, 21.85, 25.25, 28.65, 32.05];
  const towerRoofY = 35.45;

  // --- A) Hollow Floor Slabs (with real stairwell cutout at x = -14.0..-10.2, z = -25.6..-20.2) ---
  for (let f = 0; f < towerFloorYs.length; f++) {
    const fy = towerFloorYs[f];
    const slabMat = f === 0 || f === 1 || f === 9 ? mats.marbleFloor : mats.marbleFloor;
    if (f === 0) {
      // Ground floor solid marble slab
      box(towerIntG, [twW - 0.2, 0.26, twD - 0.2], [twCX, fy - 0.13, twCZ], slabMat, { uvScale: 5.5 });
    } else {
      // Upper floor slabs with stairwell cutout in Rear-Left corner (x = -14.0..-10.2, z = -25.6..-20.2)
      box(towerIntG, [twW - 0.2, 0.22, 10.4], [twCX, fy - 0.11, -15.0], slabMat, { uvScale: 4.5 });
      box(towerIntG, [13.8, 0.22, 5.6], [-3.2, fy - 0.11, -22.9], slabMat, { uvScale: 3.5 });
    }
    // Ceiling underside soffit
    const nextY = f < towerFloorYs.length - 1 ? towerFloorYs[f + 1] : towerRoofY;
    box(towerIntG, [twW - 0.4, 0.08, 10.2], [twCX, nextY - 0.24, -15.0], mats.whiteWall);
    box(towerIntG, [13.6, 0.08, 5.4], [-3.2, nextY - 0.24, -22.9], mats.whiteWall);
  }
  // Tower Rooftop Slab (with stairwell roof access opening)
  box(towerShellG, [twW + 0.2, 0.30, 10.6], [twCX, towerRoofY - 0.15, -15.0], mats.roofTile, { uvScale: 5.0 });
  box(towerShellG, [14.0, 0.30, 5.8], [-3.2, towerRoofY - 0.15, -22.9], mats.roofTile, { uvScale: 4.0 });

  // --- B) Signature Off-White Front-Left Architectural Spine + Vertical Gold "HOTEL ROYAL" Signage ---
  // Spans x = -14.2..-7.8 on Front (+Z) face above Podium (y = 11.65..35.45) + flanking piers below
  box(towerShellG, [6.4, towerRoofY - 11.4, 0.44], [-11.0, (towerRoofY + 11.4) * 0.5, twZ1 + 0.12], mats.towerWhite, { uvScale: 2.5 });
  // Vertical decorative recessed reveal bands on the white spine
  box(towerShellG, [0.16, towerRoofY - 11.4, 0.50], [-14.0, (towerRoofY + 11.4) * 0.5, twZ1 + 0.14], mats.towerTaupe);
  box(towerShellG, [0.16, towerRoofY - 11.4, 0.50], [-7.9, (towerRoofY + 11.4) * 0.5, twZ1 + 0.14], mats.towerTaupe);
  const vGoldTex = makeVerticalGoldHotelRoyalTex();
  const vGoldMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 18.2),
    new THREE.MeshStandardMaterial({ map: vGoldTex, emissive: 0xffe066, emissiveMap: vGoldTex, emissiveIntensity: 0.36 }),
  );
  vGoldMesh.position.set(-11.0, towerRoofY - 10.6, twZ1 + 0.38);
  towerShellG.add(vGoldMesh);

  // --- C) Hollow High-Realistic 4-Sided Facade with Real Window Openings, Cornices & KDA Ave Balconies ---
  for (let f = 0; f < towerFloorYs.length; f++) {
    const fy = towerFloorYs[f];
    const nextY = f < towerFloorYs.length - 1 ? towerFloorYs[f + 1] : towerRoofY;
    const flH = nextY - fy;
    const winH = Math.min(2.15, flH - 1.15);
    const sillH = 0.85;
    const winCY = fy + sillH + winH * 0.5;
    const headH = flH - sillH - winH;

    // Horizontal exterior architectural floor cornice band wrapping all 4 sides
    if (f >= 3) {
      box(towerShellG, [twW + 0.36, 0.24, 0.28], [twCX, fy, twZ1 + 0.08], mats.towerWhite);
      box(towerShellG, [twW + 0.36, 0.24, 0.28], [twCX, fy, twZ0 - 0.08], mats.towerWhite);
      box(towerShellG, [0.28, 0.24, twD + 0.36], [twX1 + 0.08, fy, twCZ], mats.towerWhite);
    }

    // 1) FRONT (+Z) WALL (Only above Podium for f >= 3; below f=3 it shares the Podium back wall with archway!)
    if (f >= 3) {
      // Right portion of front wall (x = -7.8..+3.8, width 11.6m) with 3 real recessed windows!
      box(towerShellG, [11.6, sillH, 0.34], [-2.0, fy + sillH * 0.5, twZ1], mats.towerTaupe);
      box(towerShellG, [11.6, headH, 0.34], [-2.0, nextY - headH * 0.5, twZ1], mats.towerTaupe);
      // Solid piers between front windows
      for (const [px0, px1] of [[-7.8, -6.6], [-4.2, -3.0], [-0.4, 0.8], [3.0, 3.8]]) {
        box(towerShellG, [px1 - px0, winH, 0.34], [(px0 + px1) * 0.5, winCY, twZ1], mats.towerTaupe);
      }
      // 3 Real Recessed Front Window Bays
      addArchitecturalWindowBay(towerShellG, mats, [-5.4, winCY, twZ1], 2.4, winH, 0, f % 2 === 1);
      addArchitecturalWindowBay(towerShellG, mats, [-1.7, winCY, twZ1], 2.6, winH, 0, false);
      addArchitecturalWindowBay(towerShellG, mats, [1.9, winCY, twZ1], 2.2, winH, 0, f % 2 === 0);
    }

    // 2) LEFT (-X, KDA AVENUE) WALL — Walkable Cantilevered Balconies on Floors 4–10 (f >= 3)!
    if (f >= 3) {
      // Cantilevered Balcony Slab + Clean Parapet + Glass & Chrome Top Rail
      box(towerShellG, [1.75, 0.22, twD - 0.8], [twX0 - 0.86, fy - 0.11, twCZ], mats.towerWhite);
      box(towerShellG, [0.16, 0.58, twD - 0.8], [twX0 - 1.66, fy + 0.29, twCZ], mats.towerWhite);
      box(towerShellG, [0.06, 0.44, twD - 0.9], [twX0 - 1.66, fy + 0.80, twCZ], mats.clearGlass);
      box(towerShellG, [0.08, 0.06, twD - 0.8], [twX0 - 1.66, fy + 1.04, twCZ], mats.chrome);
      // Left wall with wide glass sliding doors onto balcony (walkable gap on Floors 4, 6, 10!)
      box(towerShellG, [0.34, headH, twD], [twX0, nextY - headH * 0.5, twCZ], mats.towerTaupe);
      // Rear stairwell solid wall segment (z = -25.8..-20.0)
      box(towerShellG, [0.34, flH, 5.8], [twX0, fy + flH * 0.5, -22.9], mats.towerTaupe);
      // Pier between balcony openings
      box(towerShellG, [0.34, flH, 1.4], [twX0, fy + flH * 0.5, -14.8], mats.towerTaupe);
      box(towerShellG, [0.34, flH, 1.0], [twX0, fy + flH * 0.5, -10.3], mats.towerTaupe);
      // Wide Balcony Sliding Glass Bays (openable doorway gap on Floors 4, 6, 10 so you can walk out!)
      const isWalkableBalcony = (f === 3 || f === 5 || f === 9);
      if (!isWalkableBalcony) {
        addArchitecturalWindowBay(towerShellG, mats, [twX0, fy + (flH - headH) * 0.5, -17.6], 4.2, flH - headH, -Math.PI * 0.5, false);
        addArchitecturalWindowBay(towerShellG, mats, [twX0, fy + (flH - headH) * 0.5, -12.4], 3.2, flH - headH, -Math.PI * 0.5, false);
      } else {
        // Framed open sliding glass door panels (pushed aside so player walks right onto KDA Avenue balcony!)
        box(towerShellG, [0.08, flH - headH, 1.5], [twX0, fy + (flH - headH) * 0.5, -19.2], mats.clearGlass);
        box(towerShellG, [0.08, flH - headH, 1.2], [twX0, fy + (flH - headH) * 0.5, -11.4], mats.clearGlass);
      }
    } else {
      // Lower Floors (1–3) Left (-X) Wall with recessed windows
      box(towerShellG, [0.34, sillH, twD], [twX0, fy + sillH * 0.5, twCZ], mats.towerTaupe);
      box(towerShellG, [0.34, headH, twD], [twX0, nextY - headH * 0.5, twCZ], mats.towerTaupe);
      for (const [pz0, pz1] of [[-25.8, -20.0], [-16.6, -15.2], [-11.8, -9.8]]) {
        box(towerShellG, [0.34, winH, pz1 - pz0], [twX0, winCY, (pz0 + pz1) * 0.5], mats.towerTaupe);
      }
      addArchitecturalWindowBay(towerShellG, mats, [twX0, winCY, -18.3], 3.4, winH, -Math.PI * 0.5, false);
      addArchitecturalWindowBay(towerShellG, mats, [twX0, winCY, -13.5], 3.4, winH, -Math.PI * 0.5, false);
    }

    // 3) RIGHT (+X) WALL with 3 Recessed Windows per floor
    box(towerShellG, [0.34, sillH, twD], [twX1, fy + sillH * 0.5, twCZ], mats.towerTaupe);
    box(towerShellG, [0.34, headH, twD], [twX1, nextY - headH * 0.5, twCZ], mats.towerTaupe);
    for (const [pz0, pz1] of [[-25.8, -24.4], [-21.4, -20.0], [-16.6, -15.2], [-11.8, -9.8]]) {
      box(towerShellG, [0.34, winH, pz1 - pz0], [twX1, winCY, (pz0 + pz1) * 0.5], mats.towerTaupe);
    }
    addArchitecturalWindowBay(towerShellG, mats, [twX1, winCY, -22.9], 3.0, winH, Math.PI * 0.5, false);
    addArchitecturalWindowBay(towerShellG, mats, [twX1, winCY, -18.3], 3.4, winH, Math.PI * 0.5, f >= 3 && f % 2 === 0);
    addArchitecturalWindowBay(towerShellG, mats, [twX1, winCY, -13.5], 3.4, winH, Math.PI * 0.5, false);

    // 4) REAR (-Z) WALL with 3 Recessed Windows per floor
    box(towerShellG, [twW, sillH, 0.34], [twCX, fy + sillH * 0.5, twZ0], mats.towerTaupe);
    box(towerShellG, [twW, headH, 0.34], [twCX, nextY - headH * 0.5, twZ0], mats.towerTaupe);
    for (const [px0, px1] of [[-14.2, -9.6], [-6.6, -5.2], [-2.2, -0.8], [2.2, 3.8]]) {
      box(towerShellG, [px1 - px0, winH, 0.34], [(px0 + px1) * 0.5, winCY, twZ0], mats.towerTaupe);
    }
    addArchitecturalWindowBay(towerShellG, mats, [-8.1, winCY, twZ0], 3.0, winH, Math.PI, false);
    addArchitecturalWindowBay(towerShellG, mats, [-3.7, winCY, twZ0], 3.0, winH, Math.PI, f >= 3 && f % 2 === 1);
    addArchitecturalWindowBay(towerShellG, mats, [0.7, winCY, twZ0], 3.0, winH, Math.PI, false);
  }

  // --- D) TOWER VERTICAL CORE: 10-STORY WALKABLE GRANITE STAIRCASE + DOUBLE ELEVATORS ---
  const buildTowerStairFlight = (yBot, yTop) => {
    const yMid = (yBot + yTop) * 0.5;
    const steps = 9;
    // Flight 1 going -Z (x = -13.1, z = -20.6 -> -24.2)
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const sz = THREE.MathUtils.lerp(-20.6, -24.2, t);
      const sy = THREE.MathUtils.lerp(yBot, yMid, (i + 1) / steps);
      box(towerIntG, [1.55, 0.20, 0.42], [-13.1, sy - 0.10, sz], mats.blackGranite);
    }
    // Mid-landing (z = -24.9)
    box(towerIntG, [3.4, 0.20, 1.15], [-12.15, yMid - 0.10, -24.95], mats.blackGranite);
    // Flight 2 going +Z (x = -11.2, z = -24.2 -> -20.6)
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const sz = THREE.MathUtils.lerp(-24.2, -20.6, t);
      const sy = THREE.MathUtils.lerp(yMid, yTop, (i + 1) / steps);
      box(towerIntG, [1.55, 0.20, 0.42], [-11.2, sy - 0.10, sz], mats.blackGranite);
    }
    rodBetween(towerIntG, [-12.15, yBot + 0.88, -20.6], [-12.15, yMid + 0.88, -24.2], 0.032, mats.chrome);
    rodBetween(towerIntG, [-12.15, yMid + 0.88, -24.2], [-12.15, yTop + 0.88, -20.6], 0.032, mats.chrome);
  };
  for (let f = 0; f < towerFloorYs.length; f++) {
    const fy = towerFloorYs[f];
    const nextY = f < towerFloorYs.length - 1 ? towerFloorYs[f + 1] : towerRoofY;
    buildTowerStairFlight(fy, nextY);

    // Double Brushed-Steel Tower Elevators on Rear Wall of Elevator Lobby (x = -9.2..-5.8, z = -25.4)
    for (const ex of [-8.4, -6.4]) {
      box(towerIntG, [1.65, 2.38, 0.12], [ex, fy + 1.19, twZ0 + 0.28], mats.chrome);
      const eMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.40, 2.22), mats.elevDoor);
      eMesh.position.set(ex, fy + 1.12, twZ0 + 0.36);
      towerIntG.add(eMesh);
    }
    box(towerIntG, [3.8, 0.02, 1.2], [-7.4, fy + 0.015, twZ0 + 1.1], mats.redCarpet);
    const flPlateTex = makeSignPlateTex(`FLOOR ${String(f + 1).padStart(2, '0')}`, 'TOWER ELEVATORS', '#1e293b', '#facc15');
    const flPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(1.25, 0.34),
      new THREE.MeshStandardMaterial({ map: flPlateTex, emissive: 0xffffff, emissiveMap: flPlateTex, emissiveIntensity: 0.45 }),
    );
    flPlate.position.set(-7.4, fy + 2.62, twZ0 + 0.38);
    towerIntG.add(flPlate);

    // Corridor ceiling panel downlights on every tower floor
    for (const lx of [-10.0, -5.2, -0.5]) {
      box(towerIntG, [0.58, 0.05, 0.58], [lx, nextY - 0.30, -18.0], mats.ledWhite);
    }
  }

  // --- E) FLOOR-BY-FLOOR WALKABLE TOWER INTERIORS ---

  // 1) GROUND FLOOR TOWER (y = 0.25m): ROYAL GRAND BANQUET & CONFERENCE HALL
  {
    const fy = towerFloorYs[0];
    // Warm coffered ceiling LED beams
    for (const lx of [-9.5, -4.5, 0.5]) {
      box(towerIntG, [0.36, 0.06, 12.5], [lx, fy + 3.48, -17.2], mats.ledWarm);
    }
    // Raised Stage + Backlit Backdrop on East Side
    box(towerIntG, [2.6, 0.32, 7.6], [2.1, fy + 0.16, -17.2], mats.mahogany);
    box(towerIntG, [0.22, 3.2, 6.8], [3.3, fy + 1.75, -17.2], mats.warmWood);
    const banqTex = makeSignPlateTex('ROYAL GRAND BANQUET', 'CONFERENCE & CONVENTION HALL', '#3b1f14', '#facc15');
    const banqSign = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 1.2),
      new THREE.MeshStandardMaterial({ map: banqTex, emissive: 0xffffff, emissiveMap: banqTex, emissiveIntensity: 0.55 }),
    );
    banqSign.position.set(3.14, fy + 2.35, -17.2);
    banqSign.rotation.y = -Math.PI * 0.5;
    towerIntG.add(banqSign);
    // Speaker Lectern on Stage
    box(towerIntG, [0.55, 1.15, 0.65], [1.35, fy + 0.88, -17.2], mats.mahogany);

    // Grand Executive Conference Table + 10 Chairs
    box(towerIntG, [6.4, 0.10, 2.2], [-3.8, fy + 0.78, -16.8], mats.mahogany);
    box(towerIntG, [5.6, 0.72, 1.2], [-3.8, fy + 0.36, -16.8], mats.blackGranite);
    for (let cx = -6.2; cx <= -1.4; cx += 1.2) {
      for (const [cz, ry] of [[-18.35, 0], [-15.25, Math.PI]]) {
        const cg = new THREE.Group();
        cg.position.set(cx, fy, cz);
        cg.rotation.y = ry;
        box(cg, [0.48, 0.08, 0.48], [0, 0.45, 0], mats.goldVelvet);
        box(cg, [0.46, 0.56, 0.08], [0, 0.76, -0.20], mats.mahogany);
        cylinder(cg, 0.04, 0.04, 0.44, [0, 0.22, 0], mats.chrome, 6);
        towerIntG.add(cg);
      }
    }
    // Pre-function lounge sofa near Podium archway
    addTuftedSofa(towerIntG, mats, -11.6, fy, -14.2, 3.6, Math.PI * 0.5);
  }

  // 2) 2ND FLOOR TOWER (y = 4.05m): VIP PRIVATE DINING & EXECUTIVE LOUNGE
  {
    const fy = towerFloorYs[1];
    for (const [tx, tz] of [[-5.6, -13.6], [0.2, -13.6], [-5.6, -19.2], [0.2, -19.2]]) {
      addDiningTableSet(towerIntG, mats, tx, fy, tz);
    }
    // Coffee & Espresso Bar Counter along North-East Wall
    box(towerIntG, [5.4, 1.05, 0.95], [-1.0, fy + 0.52, -24.4], mats.blackGranite);
    box(towerIntG, [0.65, 0.55, 0.52], [-2.4, fy + 1.32, -24.4], mats.chrome);
    addTuftedSofa(towerIntG, mats, -11.6, fy, -15.0, 3.8, Math.PI * 0.5);
  }

  // 3) 3RD & 4TH FLOORS TOWER (y = 7.85m & 11.65m): WALKABLE DELUXE GUEST ROOMS
  for (const [fIdx, prefix] of [[2, '30'], [3, '40']]) {
    const fy = towerFloorYs[fIdx];
    // Central corridor bumper rail & room partition wall at z = -17.2 (with wide open doorways)
    box(towerIntG, [11.4, 3.25, 0.20], [-2.0, fy + 1.62, -17.2], mats.whiteWall);
    box(towerIntG, [0.20, 3.25, 7.2], [-2.2, fy + 1.62, -13.5], mats.whiteWall);
    addRoyalGuestRoom(towerIntG, mats, -9.2, fy, -16.8, 6.8, 6.6, `${prefix}4`, -1);
    addRoyalGuestRoom(towerIntG, mats, -2.0, fy, -16.8, 5.6, 6.6, `${prefix}5`, -1);
  }

  // 4) 6TH FLOOR TOWER (y = 18.45m): HERO ROYAL PRESIDENTIAL EXECUTIVE SUITE (ROOM 601!)
  {
    const fy = towerFloorYs[5];
    // Open-Plan Grand Living Lounge (West/Balcony Side) + King Master Bedroom (East Side)
    // Decorative walnut-slat divider screen between lounge & bedroom
    for (let lz = -16.6; lz <= -11.4; lz += 0.52) {
      box(towerIntG, [0.16, 3.25, 0.14], [-4.8, fy + 1.62, lz], mats.warmWood);
    }
    // Presidential Lounge: L-Shaped Champagne-Gold Velvet Sofas + Marble Coffee Table + Giant TV Wall
    addTuftedSofa(towerIntG, mats, -9.8, fy, -12.0, 4.4, Math.PI);
    addTuftedSofa(towerIntG, mats, -12.4, fy, -15.0, 3.8, Math.PI * 0.5);
    box(towerIntG, [1.8, 0.42, 1.1], [-9.8, fy + 0.21, -14.8], mats.marbleFloor);
    box(towerIntG, [3.6, 3.1, 0.14], [-9.8, fy + 1.55, -18.6], mats.mahogany);
    box(towerIntG, [2.2, 1.15, 0.08], [-9.8, fy + 1.72, -18.48], mats.blackGloss);
    // Warm area rug under Presidential Lounge
    box(towerIntG, [5.2, 0.025, 4.4], [-9.8, fy + 0.015, -14.6], mats.redCarpet);

    // King Master Bedroom (East Wing)
    box(towerIntG, [0.14, 1.55, 4.6], [3.5, fy + 0.85, -14.2], mats.mahogany);
    box(towerIntG, [2.4, 0.38, 2.2], [2.1, fy + 0.19, -14.2], mats.mahogany);
    box(towerIntG, [2.3, 0.28, 2.1], [2.1, fy + 0.50, -14.2], mats.crispWhite);
    box(towerIntG, [0.46, 0.18, 0.82], [2.95, fy + 0.72, -13.7], mats.crispWhite);
    box(towerIntG, [0.46, 0.18, 0.82], [2.95, fy + 0.72, -14.7], mats.crispWhite);
    // Executive Study Desk & Formal 4-Seat Suite Dining Table
    addDiningTableSet(towerIntG, mats, -0.8, fy, -21.8);
    box(towerIntG, [1.8, 0.76, 0.78], [-1.8, fy + 0.38, -11.2], mats.mahogany);
    addCeilingFan(towerIntG, mats, -9.8, fy + 3.15, -14.8);
    addCeilingFan(towerIntG, mats, 0.6, fy + 3.15, -14.2);

    const presTex = makeSignPlateTex('601 · PRESIDENTIAL SUITE', 'ROYAL EXECUTIVE FLOOR', '#3b1f14', '#facc15');
    const presSign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.44),
      new THREE.MeshStandardMaterial({ map: presTex, emissive: 0xffffff, emissiveMap: presTex, emissiveIntensity: 0.45 }),
    );
    presSign.position.set(-4.8, fy + 2.35, -18.5);
    towerIntG.add(presSign);
  }

  // 5) 5TH, 7TH, 8TH, 9TH FLOORS: FURNISHED WALKABLE CORRIDORS + SUITE DOORS + WINDOW ROOMS
  for (const fIdx of [4, 6, 7, 8]) {
    const fy = towerFloorYs[fIdx];
    const fNum = fIdx + 1;
    // Corridor mahogany bumper rail & suite door frames
    box(towerIntG, [13.2, 0.22, 0.14], [-3.0, fy + 1.05, -17.2], mats.mahogany);
    for (const [rx, rNum] of [[-7.2, `${fNum}01`], [-1.8, `${fNum}02`], [2.0, `${fNum}03`]]) {
      box(towerIntG, [1.05, 2.25, 0.12], [rx, fy + 1.12, -17.15], mats.mahogany);
      const rTex = makeSignPlateTex(rNum, 'EXECUTIVE', '#1e293b', '#f8fafc');
      const rPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.18), new THREE.MeshBasicMaterial({ map: rTex }));
      rPlate.position.set(rx, fy + 1.80, -17.24);
      rPlate.rotation.y = Math.PI;
      towerIntG.add(rPlate);
    }
    // Furnished bed & warm lounge inside visible front rooms so exterior glass looks richly inhabited
    box(towerIntG, [2.1, 0.48, 1.7], [-5.2, fy + 0.24, -12.6], mats.crispWhite);
    box(towerIntG, [2.1, 0.48, 1.7], [0.8, fy + 0.24, -12.6], mats.crispWhite);
    addTuftedSofa(towerIntG, mats, -11.4, fy, -14.2, 2.8, Math.PI * 0.5);
  }

  // 6) 10TH FLOOR TOWER (y = 32.05m): ROYAL SKY LOUNGE & PANORAMIC OBSERVATION DECK
  {
    const fy = towerFloorYs[9];
    // Warm timber ceiling slats + glowing cove LEDs
    for (let sx = -12.5; sx <= 2.5; sx += 1.5) {
      box(towerIntG, [0.22, 0.14, 13.5], [sx, fy + 3.12, -16.8], mats.warmWood);
    }
    for (const lx of [-9.0, -3.0, 1.5]) {
      box(towerIntG, [0.18, 0.05, 12.5], [lx, fy + 3.06, -16.8], mats.ledWarm);
    }
    // Panoramic Sky Café & Mocktail Bar Counter
    box(towerIntG, [6.2, 1.08, 1.05], [-1.0, fy + 0.54, -22.8], mats.blackGranite);
    box(towerIntG, [6.4, 0.08, 1.25], [-1.0, fy + 1.12, -22.8], mats.marbleFloor);
    const skyTex = makeSignPlateTex('ROYAL SKY LOUNGE', '10TH FLOOR PANORAMIC DECK · KHULNA', '#0f172a', '#facc15');
    const skySign = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 1.1),
      new THREE.MeshStandardMaterial({ map: skyTex, emissive: 0xffffff, emissiveMap: skyTex, emissiveIntensity: 0.60 }),
    );
    skySign.position.set(-1.0, fy + 2.35, -25.4);
    towerIntG.add(skySign);
    // Lounge Seating Clusters facing KDA Avenue & Royal Mor
    addTuftedSofa(towerIntG, mats, -9.2, fy, -12.4, 3.6, Math.PI);
    addTuftedSofa(towerIntG, mats, -1.8, fy, -12.4, 3.6, Math.PI);
    for (const [tx, tz] of [[-9.2, -15.6], [-1.8, -15.6], [1.4, -18.2]]) {
      addDiningTableSet(towerIntG, mats, tx, fy, tz);
    }
  }

  // --- F) HIGH-REALISTIC TOWER ROOFTOP (y = 35.45m — ZERO FAKE TREES!) ---
  // Clean Parapet Walls with Granite Coping around perimeter
  box(towerShellG, [twW + 0.4, 1.15, 0.30], [twCX, towerRoofY + 0.58, twZ1], mats.towerTaupe);
  box(towerShellG, [twW + 0.4, 1.15, 0.30], [twCX, towerRoofY + 0.58, twZ0], mats.towerTaupe);
  box(towerShellG, [0.30, 1.15, twD + 0.4], [twX0, towerRoofY + 0.58, twCZ], mats.towerTaupe);
  box(towerShellG, [0.30, 1.15, twD + 0.4], [twX1, towerRoofY + 0.58, twCZ], mats.towerTaupe);
  box(towerShellG, [twW + 0.5, 0.08, 0.38], [twCX, towerRoofY + 1.18, twZ1], mats.blackGranite);
  box(towerShellG, [twW + 0.5, 0.08, 0.38], [twCX, towerRoofY + 1.18, twZ0], mats.blackGranite);
  box(towerShellG, [0.38, 0.08, twD + 0.5], [twX0, towerRoofY + 1.18, twCZ], mats.blackGranite);
  box(towerShellG, [0.38, 0.08, twD + 0.5], [twX1, towerRoofY + 1.18, twCZ], mats.blackGranite);

  // Stairhead & Elevator Machine Room Housing (with walkable doorway onto rooftop!)
  box(towerShellG, [8.4, 3.4, 6.2], [-9.8, towerRoofY + 1.7, -22.6], mats.towerTaupe, { uvScale: 2.0 });
  box(towerShellG, [8.7, 0.22, 6.5], [-9.8, towerRoofY + 3.46, -22.6], mats.towerWhite);
  // Industrial Rooftop HVAC Chiller Units
  for (const hx of [-2.2, 0.6]) {
    box(towerShellG, [2.1, 1.45, 2.8], [hx, towerRoofY + 0.72, -22.4], mats.acUnit);
    cylinder(towerShellG, 0.62, 0.62, 0.14, [hx, towerRoofY + 1.48, -22.4], mats.blackGloss, 14);
  }
  // 3 Detailed Telecom Antenna Masts with Microwave Dishes + Red Aviation Warning Beacons
  for (const [mx, mz, mh] of [[-11.8, -21.2, 5.6], [-8.0, -23.4, 6.4], [-10.0, -24.4, 5.0]]) {
    cylinder(towerShellG, 0.08, 0.14, mh, [mx, towerRoofY + 3.5 + mh * 0.5, mz], mats.chrome, 8);
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.14, 12), mats.crispWhite);
    dish.rotation.x = Math.PI * 0.5;
    dish.position.set(mx, towerRoofY + 3.5 + mh - 0.85, mz + 0.28);
    towerShellG.add(dish);
    cylinder(towerShellG, 0.09, 0.09, 0.16, [mx, towerRoofY + 3.5 + mh + 0.12, mz], mats.beaconRed, 8);
  }

  return {
    root,
    exteriorG,
    interiorG,
    towerShellG,
    towerIntG,
    setCutaway(enabled) {
      // Hides outer shells of BOTH the 3-story curved podium AND the 10-story rear tower
      // so the user can inspect all 10 walkable floors clearly!
      exteriorG.visible = !enabled;
      towerShellG.visible = !enabled;
    },
  };
}
