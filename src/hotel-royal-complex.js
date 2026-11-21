import * as THREE from 'three';
import { box, cylinder, rodBetween } from './scene-utils.js';
import { attachDerivedPBRMaps } from './aaa-shaders.js';

/**
 * HOTEL ROYAL INTERNATIONAL & FRONTIER/FATIMA TWIN-TOWER COMPLEX
 * 1:1 Photo-Accurate GTA-Level Architectural Build from Real Photos:
 *   B01 (curved podium close-up), B02 (full tower + KDA balconies), B06 (drone wide),
 *   B07 (podium radial rooftop garden + Frontier/Fatima tower), S03 (HERLAN + UCB + vivo),
 *   S07 (KDA rainy frontage + gate), S10 & U01 (from Chingri Chattar fountain).
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

function makePanelizedConcreteTexture(baseHex = '#cdc0ab', seedVal = 301) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle architectural concrete micro-grain
  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(28,24,18,0.055)';
    ctx.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 3, 2 + rnd() * 3);
  }
  // Vertical architectural fascia panel seams (visible clearly in B01!)
  ctx.strokeStyle = 'rgba(42,36,28,0.34)';
  ctx.lineWidth = 2;
  for (let x = 0; x < 256; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(x + 2, 0);
    ctx.lineTo(x + 2, 256);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(42,36,28,0.34)';
  }
  // Monsoon drip weathering from top edge
  for (let i = 0; i < 28; i++) {
    const x = rnd() * 256;
    const h = 24 + rnd() * 88;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(30,28,22,0.16)');
    g.addColorStop(1, 'rgba(30,28,22,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 3 + rnd() * 6, h);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function makeACUnitTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 96;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e8ecef';
  ctx.fillRect(0, 0, 128, 96);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 124, 92);
  // Circular dark fan grille on left (matches B01!)
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(44, 48, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  for (let r = 10; r <= 28; r += 9) {
    ctx.beginPath();
    ctx.arc(44, 48, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Right-side vents & logo stripe
  ctx.fillStyle = '#334155';
  for (let y = 18; y <= 76; y += 8) {
    ctx.fillRect(86, y, 30, 3);
  }
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(86, 10, 22, 4);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeVerticalGoldHotelRoyalTexture() {
  // Exact vertical golden-yellow "HOTEL ROYAL" letters with red shadow on white panel (U01!)
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
    const ch = letters[i];
    if (ch === ' ') continue;
    const y = 48 + (i + 0.5) * step;
    // Deep crimson-brown 3D drop shadow
    ctx.fillStyle = '#7f1d1d';
    ctx.fillText(ch, 84, y + 4);
    // Bright metallic gold face
    ctx.fillStyle = '#facc15';
    ctx.fillText(ch, 80, y);
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 2;
    ctx.strokeText(ch, 80, y);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeCurvedRimBannerTexture(text = 'HOTEL ROYAL INTERNATIONAL LIMITED') {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 96;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 1024, 96);
  ctx.fillStyle = 'rgba(205, 192, 171, 0.0)';
  ctx.fillRect(0, 0, 1024, 96);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 42px "Manrope", "Segoe UI", sans-serif';
  ctx.fillStyle = '#3f362c';
  ctx.fillText(text, 515, 52);
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(text, 512, 48);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeCanopyHotelRoyalTexture() {
  // Exact B01 white fascia with raised black "HOTEL" and bold red "ROYAL" letters!
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e5e0d5';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 508, 124);
  ctx.textBaseline = 'middle';
  ctx.font = '900 66px "Manrope", "Arial Black", sans-serif';
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillText('HOTEL', 38, 69);
  ctx.fillText('ROYAL', 268, 69);
  // Crisp Black HOTEL + Bold Red ROYAL
  ctx.fillStyle = '#111827';
  ctx.fillText('HOTEL', 34, 64);
  ctx.fillStyle = '#b91c1c';
  ctx.fillText('ROYAL', 264, 64);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeVerticalBannerTexture(kind = 'bkash') {
  const c = document.createElement('canvas');
  c.width = 192;
  c.height = 512;
  const ctx = c.getContext('2d');
  if (kind === 'bkash') {
    // Matches S03 tall blue/red vertical telecom/bKash banner between the two towers!
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#1e40af');
    g.addColorStop(0.5, '#1d4ed8');
    g.addColorStop(1, '#312e81');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 192, 512);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(14, 72, 164, 96);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 42px "Noto Sans Bengali", sans-serif';
    ctx.fillText('বাংলা', 96, 134);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 44px "Manrope", sans-serif';
    ctx.fillText('bKash', 96, 240);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Noto Sans Bengali", sans-serif';
    ctx.fillText('অনলাইন', 96, 318);
    ctx.fillText('পেমেন্ট', 96, 368);
    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold 24px "Manrope", sans-serif';
    ctx.fillText('16247', 96, 456);
  } else {
    // Matches U01 & B07 tall blue Fatima Hospital vertical doctor/diagnostic board!
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, 192, 512);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, 10, 172, 492);
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(10, 10, 172, 74);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px "Noto Sans Bengali", sans-serif';
    ctx.fillText('ফাতেমা হাসপাতাল', 96, 44);
    ctx.font = 'bold 15px "Manrope", sans-serif';
    ctx.fillText('DIAGNOSTIC CENTER', 96, 68);
    ctx.fillStyle = '#0f172a';
    for (let y = 108; y < 440; y += 34) {
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(18, y - 16, 156, 24);
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(22, y - 10, 10, 12);
      ctx.fillStyle = '#334155';
      ctx.fillRect(38, y - 8, 126, 8);
    }
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(10, 446, 172, 56);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Manrope", sans-serif';
    ctx.fillText('24/7 EMERGENCY', 96, 480);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeShopSignTex({ title, subtitle = '', bg = '#dc2626', fg = '#ffffff', accent = '#fde047', width = 512, height = 144 }) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, 'rgba(255,255,255,0.16)');
  g.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 44px "Manrope", "Noto Sans Bengali", sans-serif';
  ctx.fillText(title, width * 0.5, subtitle ? height * 0.40 : height * 0.52, width - 32);
  if (subtitle) {
    ctx.fillStyle = accent;
    ctx.font = '600 22px "Manrope", "Noto Sans Bengali", sans-serif';
    ctx.fillText(subtitle, width * 0.5, height * 0.76, width - 32);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeMobileMultiBrandTexture() {
  // Exact S03 / S07 multi-brand mobile shop fascia (vivo, oppo, Samsung, Tecno, Infinix, Apple)
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 128);
  const brands = [
    { name: 'vivo', bg: '#2563eb', fg: '#ffffff' },
    { name: 'oppo', bg: '#15803d', fg: '#ffffff' },
    { name: 'SAMSUNG', bg: '#1e3a8a', fg: '#ffffff' },
    { name: 'TECNO', bg: '#0284c7', fg: '#ffffff' },
    { name: 'Infinix', bg: '#16a34a', fg: '#ffffff' },
    { name: 'Xiaomi', bg: '#ea580c', fg: '#ffffff' },
  ];
  const bw = 512 / brands.length;
  for (let i = 0; i < brands.length; i++) {
    ctx.fillStyle = brands[i].bg;
    ctx.fillRect(i * bw + 3, 10, bw - 6, 56);
    ctx.fillStyle = brands[i].fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 17px "Manrope", sans-serif';
    ctx.fillText(brands[i].name, i * bw + bw * 0.5, 38, bw - 10);
  }
  ctx.fillStyle = '#facc15';
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px "Noto Sans Bengali", sans-serif';
  ctx.fillText('রয়েল মোবাইল জোন · A-33 কেডিএ অ্যাভিনিউ, খুলনা', 256, 98);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function addParkedVanOrCar(parent, bank, x, y, z, rotY, isVan = true, bodyMat = null) {
  const v = new THREE.Group();
  v.position.set(x, y, z);
  v.rotation.y = rotY;
  const mat = bodyMat || bank.modernWhite;
  if (isVan) {
    // White HiAce-style hotel guest van (seen parked in B06 & B07 courtyard!)
    box(v, [1.82, 1.55, 4.65], [0, 1.05, 0], mat);
    box(v, [1.72, 0.62, 3.85], [0, 1.38, -0.1], bank.glassCurtain);
    box(v, [1.70, 0.64, 0.14], [0, 1.38, 2.30], bank.glassCurtain);
  } else {
    box(v, [1.74, 0.64, 4.15], [0, 0.54, 0], mat);
    box(v, [1.50, 0.52, 2.05], [0, 1.06, -0.12], bank.glassCurtain);
  }
  for (const [wx, wz] of [[-0.86, 1.35], [0.86, 1.35], [-0.86, -1.35], [0.86, -1.35]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 10), bank.tireBlack);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.32, wz);
    v.add(w);
  }
  parent.add(v);
}

/**
 * Builds the complete 1:1 photo-accurate Hotel Royal International + Frontier/Fatima Twin Tower complex.
 */
export function buildHotelRoyalComplex(staticG, dynamicG, bank, phys) {
  // Complex origin at the center of the 3-story curved podium arc.
  // rotY = 0.90 rad => local +Z points ESE directly toward Chingri Chattar (-716.8, -291.8)!
  // local -X points SW (KDA Avenue), local +X points NE (Khan Jahan Ali Rd).
  const CX = -751.5;
  const CZ = -311.2;
  const ROT_Y = 0.90;
  const cosR = Math.cos(ROT_Y);
  const sinR = Math.sin(ROT_Y);
  const toWorld = (lx, lz) => [CX + lx * cosR + lz * sinR, CZ - lx * sinR + lz * cosR];

  const g = new THREE.Group();
  g.position.set(CX, 0, CZ);
  g.rotation.y = ROT_Y;
  staticG.add(g);

  const dg = new THREE.Group();
  dg.position.set(CX, 0, CZ);
  dg.rotation.y = ROT_Y;
  dynamicG.add(dg);

  // --- Dedicated Photo-Matched High-Resolution PBR Materials ---
  const podiumConcTex = makePanelizedConcreteTexture('#cfc2ac', 301);
  const podiumConcMat = new THREE.MeshStandardMaterial({ map: podiumConcTex, roughness: 0.74, metalness: 0.04, envMapIntensity: 0.78 });
  attachDerivedPBRMaps(podiumConcMat, podiumConcTex, { strength: 2.1, roughBase: 0.74, normalScale: 0.72 });

  const towerWhiteMat = new THREE.MeshStandardMaterial({ color: 0xece9e0, roughness: 0.70, metalness: 0.03, envMapIntensity: 0.75 });
  const towerTaupeMat = new THREE.MeshStandardMaterial({ color: 0xbcae97, roughness: 0.76, metalness: 0.03, envMapIntensity: 0.72 });
  const frontierSageMat = new THREE.MeshStandardMaterial({ color: 0x95a59e, roughness: 0.72, metalness: 0.04, envMapIntensity: 0.76 });
  const frontierCreamMat = new THREE.MeshStandardMaterial({ color: 0xe2ddd4, roughness: 0.70, metalness: 0.03, envMapIntensity: 0.76 });
  const greenGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x173c3b,
    roughness: 0.05,
    metalness: 0.28,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.95,
  });
  const blueReflectGlass = new THREE.MeshPhysicalMaterial({
    color: 0x122c4a,
    roughness: 0.05,
    metalness: 0.34,
    clearcoat: 1.0,
    envMapIntensity: 2.0,
  });
  const acUnitTex = makeACUnitTexture();
  const acUnitMat = new THREE.MeshStandardMaterial({ map: acUnitTex, roughness: 0.45, metalness: 0.25 });
  const terracottaPotMat = new THREE.MeshStandardMaterial({ color: 0xb4533c, roughness: 0.85 });
  const blueDrumMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.42, metalness: 0.12 });
  const greenAwningMat = new THREE.MeshStandardMaterial({ color: 0x157347, roughness: 0.52, metalness: 0.38 });
  const stoneWallMat = new THREE.MeshStandardMaterial({ color: 0xa8a29e, roughness: 0.88, metalness: 0.02 });
  const redBrickPillarMat = new THREE.MeshStandardMaterial({ color: 0x8f2d2d, roughness: 0.82 });

  // Solid colliders for the 3 integrated architectural masses
  phys.addCircle(CX, CZ, 12.6, 12.0);
  const [twWX, twWZ] = toWorld(-11.2, -3.2);
  phys.addOBB(twWX, twWZ, 13.8, 21.5, ROT_Y, 34.0);
  const [frWX, frWZ] = toWorld(9.8, -9.8);
  phys.addOBB(frWX, frWZ, 18.5, 16.5, ROT_Y, 34.0);

  /* ==========================================================================
   * PART A: 3-STORY OPEN-FRAME CURVED PODIUM (B01, B02, B06, B07, S03, U01)
   * ======================================================================== */
  const R_OUT = 12.75;      // outer edge of horizontal concrete slabs
  const R_COL = 12.20;      // slender beige structural columns
  const R_GLASS = 11.45;    // deeply recessed curved dark-green glass curtain
  const R_INNER = 9.80;     // inner core wall behind glass
  const ARC_START = -1.28;  // SW side (merges into 9-story tower & KDA shops)
  const ARC_END = 1.42;     // NE side (wraps toward Khan Jahan Ali Rd courtyard)
  const SEGS = 18;
  const podFloorYs = [0.24, 3.65, 6.95, 10.25];
  const podH = 10.55;

  // Paved semicircular forecourt & hotel parking courtyard
  cylinder(g, R_OUT + 2.4, R_OUT + 2.6, 0.16, [0, 0.08, 0], bank.footpath, 32);
  // Inner solid core behind the recessed curved glass so nothing looks hollow
  cylinder(g, R_INNER, R_INNER, podH - 0.2, [0, (podH - 0.2) * 0.5, 0], towerTaupeMat, 24);

  // Build crisp 150° curved horizontal floor slabs + recessed dark-green glass + mullions + columns!
  const stepAng = (ARC_END - ARC_START) / SEGS;
  for (let i = 0; i < SEGS; i++) {
    const a0 = ARC_START + i * stepAng;
    const a1 = a0 + stepAng;
    const am = (a0 + a1) * 0.5;
    const sinA = Math.sin(am);
    const cosA = Math.cos(am);

    // 4 Horizontal Curved Concrete Floor Slabs (Ground, 2nd, 3rd, Roof Fascia — B01, S03, U01!)
    for (let fl = 0; fl < podFloorYs.length; fl++) {
      const fy = podFloorYs[fl];
      const slabH = fl === 0 ? 0.36 : (fl === 3 ? 0.86 : 0.74);
      const slabDepth = fl === 0 ? 3.2 : 2.8;
      const rMid = R_OUT - slabDepth * 0.5;
      const segW = rMid * stepAng + 0.18;
      addRotBox(g, [segW, slabH, slabDepth], [sinA * rMid, fy, cosA * rMid], podiumConcMat, am, { uvScale: 1.6 });
      // Crisp projecting concrete drip lip along top edge of each curved slab (B01!)
      addRotBox(g, [segW + 0.04, 0.10, 0.24], [sinA * (R_OUT + 0.04), fy + slabH * 0.45, cosA * (R_OUT + 0.04)], bank.royalCream, am);
    }

    // Recessed Curved Dark-Green Tinted Glass Wall on Floors 1, 2 & 3 (set 1.3m inside slab rim!)
    const glassW = R_GLASS * stepAng + 0.06;
    for (let fl = 0; fl < 3; fl++) {
      const yBot = podFloorYs[fl] + 0.36;
      const yTop = podFloorYs[fl + 1] - 0.36;
      const gh = yTop - yBot;
      const gy = (yBot + yTop) * 0.5;
      addRotBox(g, [glassW, gh, 0.14], [sinA * R_GLASS, gy, cosA * R_GLASS], greenGlassMat, am, { castShadow: false });
      // Warm interior hotel glow visible behind glass at dusk/night
      if ((i + fl) % 3 !== 0) {
        addRotBox(dg, [glassW * 0.82, gh * 0.72, 0.08], [sinA * (R_GLASS - 0.25), gy, cosA * (R_GLASS - 0.25)], bank.warmWindowLit, am, { castShadow: false });
      }
      // Slim vertical aluminum window mullions (2 per segment -> crisp 4-pane look matching S03 & U01!)
      for (const mOff of [-0.25, 0.25]) {
        const ma = am + mOff * stepAng;
        addRotBox(g, [0.06, gh, 0.18], [Math.sin(ma) * (R_GLASS + 0.03), gy, Math.cos(ma) * (R_GLASS + 0.03)], bank.aluminum, ma);
      }
    }

    // Slender Square Beige Structural Columns standing proud of the glass (every 2 segments = 10 bays, matches S03, U01, B07!)
    if (i % 2 === 0 || i === SEGS - 1) {
      const colA = i === SEGS - 1 ? a1 : a0;
      addRotBox(g, [0.36, podH, 0.42], [Math.sin(colA) * R_COL, podH * 0.5, Math.cos(colA) * R_COL], podiumConcMat, colA);
    }

    // Detailed White Split-AC Outdoor Compressor Units mounted on 2nd & 3rd floor ledges (matches B01, S03, U01!)
    if (i >= 1 && i <= SEGS - 2 && i % 2 === 1) {
      for (const acY of [4.38, 7.68]) {
        const acA = am + (acY > 6 ? 0.03 : -0.03);
        const acMesh = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.52, 0.34), acUnitMat);
        acMesh.position.set(Math.sin(acA) * (R_COL - 0.04), acY, Math.cos(acA) * (R_COL - 0.04));
        acMesh.rotation.y = acA;
        acMesh.castShadow = true;
        g.add(acMesh);
      }
    }
  }

  // Curved 3D Rim Sign: "HOTEL ROYAL INTERNATIONAL LIMITED" along top fascia (matches U01 & B02!)
  const rimTex = makeCurvedRimBannerTexture('HOTEL ROYAL INTERNATIONAL LIMITED');
  const rimMat = new THREE.MeshStandardMaterial({
    map: rimTex,
    transparent: true,
    roughness: 0.35,
    metalness: 0.25,
    emissive: 0xffffff,
    emissiveMap: rimTex,
    emissiveIntensity: 0.18,
  });
  bank.emissiveList.push({ mat: rimMat, day: 0.15, night: 0.95 });
  const rimGeo = new THREE.CylinderGeometry(R_OUT + 0.12, R_OUT + 0.12, 0.82, 24, 1, true, -0.92, 1.84);
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.position.y = 10.28;
  dg.add(rimMesh);

  // Projecting Hotel Main Entrance Canopy with Raised Black "HOTEL" & Red "ROYAL" (matches B01, B02, B06!)
  const canA = 0.28; // slightly right of center facing the shrimp fountain
  const canG = new THREE.Group();
  canG.position.set(Math.sin(canA) * (R_OUT + 1.4), 0, Math.cos(canA) * (R_OUT + 1.4));
  canG.rotation.y = canA;
  g.add(canG);
  const canDG = new THREE.Group();
  canDG.position.copy(canG.position);
  canDG.rotation.y = canA;
  dg.add(canDG);

  box(canG, [6.4, 0.58, 3.6], [0, 3.62, 0], podiumConcMat);
  box(canG, [6.2, 0.12, 3.4], [0, 3.32, 0], bank.steelDark); // dark soffit underside
  for (const cx of [-2.8, 2.8]) {
    box(canG, [0.42, 3.45, 0.42], [cx, 1.72, 1.45], podiumConcMat);
  }
  const canopyTex = makeCanopyHotelRoyalTexture();
  const canopySignMat = new THREE.MeshStandardMaterial({
    map: canopyTex,
    emissive: 0xffffff,
    emissiveMap: canopyTex,
    emissiveIntensity: 0.24,
    roughness: 0.32,
  });
  bank.emissiveList.push({ mat: canopySignMat, day: 0.22, night: 1.25 });
  const canopySign = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.92, 0.16), canopySignMat);
  canopySign.position.set(0, 3.82, 1.84);
  canDG.add(canopySign);

  // Red-brick entrance pillar with black vintage globe lamp & hanging vines (matches B01 & S07!)
  box(canG, [0.76, 2.15, 0.76], [-3.65, 1.075, 1.75], redBrickPillarMat);
  box(canG, [0.90, 0.16, 0.90], [-3.65, 2.22, 1.75], redBrickPillarMat);
  cylinder(canG, 0.18, 0.22, 0.52, [-3.65, 2.58, 1.75], bank.steelDark, 10);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), bank.lampGlow);
  globe.position.set(-3.65, 2.68, 1.75);
  canDG.add(globe);
  // Lush bougainvillea vines draping over the right corner of canopy (B01!)
  for (const [vx, vy, vz, r] of [[2.6, 3.85, 1.9, 0.48], [3.0, 3.35, 1.85, 0.42], [2.2, 4.10, 1.75, 0.36]]) {
    const vine = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), bank.foliageDeep);
    vine.position.set(vx, vy, vz);
    canG.add(vine);
  }

  /* ==========================================================================
   * PART B: RADIAL 6-ROW ROOFTOP TERRACE GARDEN ON PODIUM ROOF (Photo B07!)
   * ======================================================================== */
  const roofY = podH + 0.14;
  // Curved rooftop concrete terrace deck
  cylinder(g, R_OUT - 0.15, R_OUT - 0.15, 0.24, [0, roofY - 0.12, 0], bank.darkConcrete, 28);
  // Curved parapet wall around the terrace rim (B07)
  for (let i = 0; i < SEGS; i++) {
    const am = ARC_START + (i + 0.5) * stepAng;
    const segW = R_OUT * stepAng + 0.12;
    addRotBox(g, [segW, 0.85, 0.24], [Math.sin(am) * (R_OUT - 0.12), roofY + 0.42, Math.cos(am) * (R_OUT - 0.12)], podiumConcMat, am);
  }
  // 6 Neat Radial Spoke Rows of Potted Plants, Shrubs & Flowers fanning out across the terrace (exact B07!)
  const rndGard = seeded(2077);
  const rowAngles = [-0.92, -0.52, -0.14, 0.24, 0.62, 1.00];
  for (let rIdx = 0; rIdx < rowAngles.length; rIdx++) {
    const ra = rowAngles[rIdx];
    for (let p = 0; p < 5; p++) {
      const dist = 4.6 + p * 1.48;
      const px = Math.sin(ra) * dist;
      const pz = Math.cos(ra) * dist;
      // Terracotta / white flower pot
      cylinder(g, 0.24, 0.18, 0.38, [px, roofY + 0.19, pz], p % 2 === 0 ? terracottaPotMat : bank.marbleWhite, 7);
      // Foliage & occasional red/gold flower bloom
      const foliage = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.38 + rndGard() * 0.22, 1),
        (rIdx + p) % 2 === 0 ? bank.grassTurf : bank.foliageDeep,
      );
      foliage.position.set(px, roofY + 0.58, pz);
      g.add(foliage);
      if ((rIdx + p) % 3 === 0) {
        const flw = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), p % 2 === 0 ? bank.flowerRed : bank.flowerGold);
        flw.position.set(px + 0.14, roofY + 0.82, pz);
        g.add(flw);
      }
    }
    // Blue plastic garden water drum tucked between radial rows (visible in B07!)
    if (rIdx % 2 === 1) {
      cylinder(g, 0.26, 0.26, 0.66, [Math.sin(ra + 0.18) * 6.5, roofY + 0.33, Math.cos(ra + 0.18) * 6.5], blueDrumMat, 8);
    }
  }
  // Corrugated-roof beige utility/generator shed on the right (+X) side of the terrace (exact B07!)
  addRotBox(g, [5.6, 2.85, 4.4], [6.4, roofY + 1.42, 2.8], towerTaupeMat, 0.35);
  addRotBox(g, [5.9, 0.18, 4.7], [6.4, roofY + 2.92, 2.8], bank.corrugatedTin, 0.35);

  /* ==========================================================================
   * PART C: 9-STORY HOTEL ROYAL MAIN TOWER — LEFT (-X) SIDE (B02, B06, B07, S03, U01)
   * ======================================================================== */
  const twLX = -11.2;
  const twLZ = -3.2;
  const twW = 13.4;  // narrow front face toward shrimp fountain (matches U01 & B07!)
  const twD = 21.2;  // deep building extending along KDA Avenue (matches B02 & B06!)
  const twFloors = 9;
  const twFlH = 3.20;
  const twBaseY = 0.0;
  const twH = 4.0 + (twFloors - 1) * twFlH; // 29.6m tall

  const twG = new THREE.Group();
  twG.position.set(twLX, twBaseY, twLZ);
  g.add(twG);
  const twDG = new THREE.Group();
  twDG.position.set(twLX, twBaseY, twLZ);
  dg.add(twDG);

  // Main tower core (taupe-beige right half + bright off-white left front panel — exact U01 & B07!)
  box(twG, [twW, twH, twD], [0, twH * 0.5, 0], towerTaupeMat, { uvScale: 3.0 });
  // Signature Bright Off-White Smooth Front Left Panel (left 6.2m of front face — exact U01 & B07!)
  box(twG, [6.2, twH + 0.2, 0.32], [-twW * 0.5 + 3.1, twH * 0.5, twD * 0.5 + 0.12], towerWhiteMat);

  // Signature VERTICAL GOLDEN-YELLOW 3D "HOTEL ROYAL" SIGN on the white front panel (exact U01!)
  const vGoldTex = makeVerticalGoldHotelRoyalTexture();
  const vGoldMat = new THREE.MeshStandardMaterial({
    map: vGoldTex,
    emissive: 0xffe066,
    emissiveMap: vGoldTex,
    emissiveIntensity: 0.22,
    roughness: 0.32,
  });
  bank.emissiveList.push({ mat: vGoldMat, day: 0.20, night: 1.35 });
  const vGoldMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 15.8), vGoldMat);
  vGoldMesh.position.set(-twW * 0.5 + 3.1, twH - 9.2, twD * 0.5 + 0.30);
  twDG.add(vGoldMesh);

  // Front Right Half: EXACT 2 Vertical Columns of Deeply Recessed Dark-Framed Windows (matches U01, B07, S03!)
  const rndTw = seeded(198601);
  for (let f = 3; f < twFloors; f++) {
    const fy = 4.0 + (f - 1) * twFlH;
    // Left narrow vertical stairwell/corridor window column (x = +1.2)
    box(twG, [1.55, 2.05, 0.28], [1.15, fy + 1.55, twD * 0.5 + 0.04], bank.steelDark);
    box(twG, [1.35, 1.85, 0.16], [1.15, fy + 1.55, twD * 0.5 + 0.14], greenGlassMat, { castShadow: false });
    // Right wider 2-pane hotel room window column (x = +4.25)
    box(twG, [2.45, 1.75, 0.28], [4.25, fy + 1.55, twD * 0.5 + 0.04], bank.steelDark);
    const isLit = rndTw() > 0.52;
    box(isLit ? twDG : twG, [2.25, 1.55, 0.16], [4.25, fy + 1.55, twD * 0.5 + 0.14], isLit ? bank.warmWindowLit : greenGlassMat, { castShadow: false });
    box(twG, [0.08, 1.65, 0.20], [4.25, fy + 1.55, twD * 0.5 + 0.18], bank.steelDark); // center mullion
  }

  // KDA AVENUE LEFT SIDE (-X face of 9-story tower): DEEP CANTILEVERED BALCONIES + WINDOW ACs (exact B02 & S03!)
  for (let f = 1; f < twFloors; f++) {
    const fy = 4.0 + (f - 1) * twFlH;
    if (f >= 3) {
      // Deep projecting cream balcony slab running the length of KDA facade (B02, S03)
      box(twG, [1.55, 0.24, twD - 1.2], [-twW * 0.5 - 0.72, fy, 0], towerWhiteMat);
      // Solid cream balcony parapet wall
      box(twG, [0.18, 0.92, twD - 1.2], [-twW * 0.5 - 1.42, fy + 0.52, 0], towerWhiteMat);
      // Recessed dark-green glass doors & dark window AC boxes tucked along each balcony bay!
      for (let bz = -7.6; bz <= 7.6; bz += 3.8) {
        const litB = rndTw() > 0.45;
        box(litB ? twDG : twG, [0.18, 1.95, 2.55], [-twW * 0.5 - 0.04, fy + 1.45, bz], litB ? bank.warmWindowLit : greenGlassMat, { castShadow: false });
        // Structural partition fin between hotel room balconies
        box(twG, [1.35, twFlH, 0.22], [-twW * 0.5 - 0.68, fy + twFlH * 0.5, bz + 1.9], towerTaupeMat);
        // Dark window AC box mounted high on each balcony wall (exact S03 & B02!)
        box(twG, [0.52, 0.42, 0.68], [-twW * 0.5 - 0.26, fy + 2.55, bz - 0.6], bank.steelDark);
      }
    } else {
      // Lower 2nd & 3rd floor ribbon windows + exterior white AC boxes (B02, S03)
      for (let bz = -7.6; bz <= 7.6; bz += 3.8) {
        box(twG, [0.18, 1.65, 2.85], [-twW * 0.5 - 0.04, fy + 1.55, bz], greenGlassMat, { castShadow: false });
        const acMesh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.48, 0.72), acUnitMat);
        acMesh.position.set(-twW * 0.5 - 0.22, fy + 0.48, bz + 0.8);
        twG.add(acMesh);
      }
    }
  }

  // Rooftop Parapet, Stairhead Penthouse & Telecom Antenna/Dish Masts (exact B02 & B06!)
  box(twG, [twW + 0.4, 1.15, twD + 0.4], [0, twH + 0.58, 0], towerTaupeMat);
  box(twG, [6.4, 3.2, 7.2], [2.8, twH + 2.2, 4.2], towerTaupeMat);
  // 3 Cellular Telecom Masts & Microwave Dishes on the tower roof (B02, B06)
  for (const [mx, mz, mh] of [[1.2, 5.5, 5.2], [4.5, 4.0, 5.8], [3.0, 1.8, 4.6]]) {
    cylinder(twG, 0.09, 0.14, mh, [mx, twH + 3.6 + mh * 0.5, mz], bank.aluminum, 6);
    // Microwave dish & vertical GSM sector panels
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 10), bank.modernWhite);
    dish.rotation.x = Math.PI * 0.5;
    dish.position.set(mx, twH + 3.6 + mh - 0.8, mz + 0.26);
    twG.add(dish);
    box(twG, [0.18, 1.15, 0.12], [mx + 0.28, twH + 3.6 + mh - 0.4, mz], bank.modernWhite);
  }

  /* ==========================================================================
   * PART D: 9-STORY SAGE-GREEN & CREAM FRONTIER / FATIMA TWIN TOWER (RIGHT +X)
   * Matches B06, B07, S03, U01 — completes the iconic Royal Mor twin-tower skyline!
   * ======================================================================== */
  const frLX = 9.8;
  const frLZ = -9.8;
  const frH = 30.2;

  const frG = new THREE.Group();
  frG.position.set(frLX, 0, frLZ);
  g.add(frG);
  const frDG = new THREE.Group();
  frDG.position.set(frLX, 0, frLZ);
  dg.add(frDG);

  // Rear Left Sage-Green Wing (visible between Royal tower & right wing in U01 & S03!)
  box(frG, [8.5, frH, 12.5], [-5.2, frH * 0.5, -2.5], frontierSageMat, { uvScale: 3.0 });
  // Center Cream Wing
  box(frG, [7.2, frH - 2.4, 11.5], [1.8, (frH - 2.4) * 0.5, -1.8], frontierCreamMat, { uvScale: 3.0 });
  // Right Sage-Green Front Wing facing Khan Jahan Ali Rd
  box(frG, [7.6, frH - 1.2, 13.5], [7.2, (frH - 1.2) * 0.5, 0.6], frontierSageMat, { uvScale: 3.0 });

  // Signature Cantilevered Dark-Blue Reflective Curtain-Glass Upper Corner (exact B06 & U01!)
  box(frG, [5.8, 10.5, 5.4], [8.8, frH - 7.8, 5.6], blueReflectGlass);
  box(frG, [6.2, 0.45, 5.8], [8.8, frH - 2.4, 5.6], frontierCreamMat);
  box(frG, [6.2, 0.45, 5.8], [8.8, frH - 13.1, 5.6], frontierCreamMat);

  // Recessed modern horizontal window grid across all 3 wings (B07, S03, U01)
  for (let f = 2; f < 9; f++) {
    const fy = 3.6 + (f - 1) * 3.1;
    for (const wx of [-6.8, -3.2, 1.8, 6.8]) {
      box(frG, [1.85, 1.45, 0.18], [wx, fy + 1.4, 6.85], bank.glassCurtain, { castShadow: false });
      box(frG, [2.05, 0.12, 0.24], [wx, fy + 0.65, 6.88], frontierCreamMat);
    }
    // Right (+X) side windows facing Khan Jahan Ali Rd
    for (const wz of [-3.5, 0.5, 4.5]) {
      box(frG, [0.18, 1.55, 2.2], [11.06, fy + 1.4, wz], bank.glassCurtain, { castShadow: false });
    }
  }

  // Ground-Floor Dark "FRONTIER" Showroom & Tall Vertical Blue "Fatima Hospital" Sign (exact B07 & U01!)
  box(frG, [6.8, 3.8, 2.4], [7.6, 1.9, 6.8], bank.steelDark);
  const frontTex = makeShopSignTex({ title: 'FRONTIER', subtitle: 'KHULNA · ROYAL MORE', bg: '#0f172a', fg: '#e2e8f0', accent: '#38bdf8' });
  const frontMat = new THREE.MeshStandardMaterial({ map: frontTex, emissive: 0xffffff, emissiveMap: frontTex, emissiveIntensity: 0.35 });
  bank.emissiveList.push({ mat: frontMat, day: 0.32, night: 1.4 });
  const frontSign = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.05, 0.16), frontMat);
  frontSign.position.set(7.6, 3.45, 8.05);
  frDG.add(frontSign);

  // Vertical Blue Fatima Hospital Signboard (exact U01 & B07!)
  const fatimaTex = makeVerticalBannerTexture('fatima');
  const fatimaMat = new THREE.MeshStandardMaterial({ map: fatimaTex, emissive: 0xffffff, emissiveMap: fatimaTex, emissiveIntensity: 0.36 });
  bank.emissiveList.push({ mat: fatimaMat, day: 0.32, night: 1.45 });
  const fatimaMesh = new THREE.Mesh(new THREE.BoxGeometry(2.6, 8.2, 0.20), fatimaMat);
  fatimaMesh.position.set(6.4, 9.2, 7.6);
  frDG.add(fatimaMesh);

  // Tall Blue/Red bKash Vertical Banner on Left Sage Wing (exact S03!)
  const bkashTex = makeVerticalBannerTexture('bkash');
  const bkashMat = new THREE.MeshStandardMaterial({ map: bkashTex, emissive: 0xffffff, emissiveMap: bkashTex, emissiveIntensity: 0.38 });
  bank.emissiveList.push({ mat: bkashMat, day: 0.35, night: 1.50 });
  const bkashMesh = new THREE.Mesh(new THREE.BoxGeometry(3.4, 11.2, 0.22), bkashMat);
  bkashMesh.position.set(-7.6, 20.5, 3.88);
  frDG.add(bkashMesh);

  /* ==========================================================================
   * PART E: KDA AVENUE GROUND-FLOOR SHOP STRIP UNDER HOTEL ROYAL (S03, S07, B07, U01)
   * Exact order: Corner Stone Wall + Accordion Gate -> HERLAN -> UCB -> vivo/oppo!
   * ======================================================================== */
  const shopRowG = new THREE.Group();
  // Aligned cleanly along the SW/KDA Avenue frontage right in front of the 9-story tower!
  shopRowG.position.set(-10.5, 0, 8.6);
  shopRowG.rotation.y = -0.82;
  g.add(shopRowG);
  const shopRowDG = new THREE.Group();
  shopRowDG.position.copy(shopRowG.position);
  shopRowDG.rotation.y = shopRowG.rotation.y;
  dg.add(shopRowDG);

  // 1) Grey Stone/Brick Transition Wall & Silver Metal Accordion Gate at Corner (exact U01 & S07!)
  box(shopRowG, [4.2, 2.25, 0.45], [5.4, 1.125, 1.25], stoneWallMat);
  box(shopRowG, [3.6, 1.85, 0.14], [1.4, 0.925, 1.35], bank.aluminum); // silver collapsible gate

  // 2) RED "HERLAN NEW YORK" CORNER COSMETICS SHOWROOM (exact S03 & U01!)
  box(shopRowG, [5.6, 3.55, 2.8], [-3.2, 1.775, 0.1], bank.herlanRed);
  box(shopRowDG, [4.6, 2.35, 0.16], [-3.2, 1.25, 1.52], bank.dispHerlan, { castShadow: false });
  const herlanTex = makeShopSignTex({ title: 'HERLAN', subtitle: 'NEW YORK · AUTHENTIC COSMETICS', bg: '#dc2626', fg: '#ffffff', accent: '#fef08a' });
  const herlanSignMat = new THREE.MeshStandardMaterial({ map: herlanTex, emissive: 0xffffff, emissiveMap: herlanTex, emissiveIntensity: 0.50 });
  bank.emissiveList.push({ mat: herlanSignMat, day: 0.45, night: 1.65 });
  const herlanBoard = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.15, 0.18), herlanSignMat);
  herlanBoard.position.set(-3.2, 3.12, 1.56);
  shopRowDG.add(herlanBoard);
  // Red vertical side feather-banners flanking HERLAN entrance (visible in S03!)
  for (const fx of [-5.2, -1.2]) {
    box(shopRowG, [0.36, 2.15, 0.10], [fx, 1.12, 1.72], bank.herlanRed);
  }

  // 3) DARK NAVY "UCB" ATM BOOTH + STACKED WHITE AC UNITS (exact S03 & S07!)
  box(shopRowG, [4.6, 3.35, 2.6], [-8.4, 1.675, 0.1], bank.steelDark);
  box(shopRowDG, [3.8, 2.25, 0.16], [-8.4, 1.20, 1.42], bank.dispAtm, { castShadow: false });
  const ucbTex = makeShopSignTex({ title: 'UCB', subtitle: 'ইউনাইটেড কমার্শিয়াল ব্যাংক · ATM', bg: '#111827', fg: '#ffffff', accent: '#ef4444' });
  const ucbSignMat = new THREE.MeshStandardMaterial({ map: ucbTex, emissive: 0xffffff, emissiveMap: ucbTex, emissiveIntensity: 0.42 });
  bank.emissiveList.push({ mat: ucbSignMat, day: 0.38, night: 1.55 });
  const ucbBoard = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.88, 0.18), ucbSignMat);
  ucbBoard.position.set(-8.4, 2.95, 1.46);
  shopRowDG.add(ucbBoard);
  // 3 White AC outdoor units stacked neatly right above UCB booth (exact S03 & S07!)
  for (const [ax, ay] of [[-9.2, 3.68], [-7.6, 3.68], [-8.4, 4.25]]) {
    const ac = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.50, 0.34), acUnitMat);
    ac.position.set(ax, ay, 1.25);
    shopRowG.add(ac);
  }

  // 4) MULTI-BRAND MOBILE SHOP ROW ("vivo / oppo / Samsung / Tecno") + SLANTED GREEN TIN AWNING (exact S03, S07, B07!)
  box(shopRowG, [9.2, 3.25, 2.5], [-15.4, 1.625, 0.1], bank.modernSlate);
  box(shopRowG, [4.1, 2.25, 0.14], [-13.1, 1.20, 1.38], bank.shutter, { castShadow: false });
  box(shopRowDG, [4.1, 2.25, 0.14], [-17.7, 1.20, 1.38], bank.dispElec, { castShadow: false });
  const mobTex = makeMobileMultiBrandTexture();
  const mobMat = new THREE.MeshStandardMaterial({ map: mobTex, emissive: 0xffffff, emissiveMap: mobTex, emissiveIntensity: 0.42 });
  bank.emissiveList.push({ mat: mobMat, day: 0.38, night: 1.50 });
  const mobBoard = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.96, 0.18), mobMat);
  mobBoard.position.set(-15.4, 2.95, 1.42);
  shopRowDG.add(mobBoard);
  // Long slanted dark-green corrugated tin roof awning extending west (exact B07 & S03!)
  const greenAwning = addRotBox(shopRowG, [10.4, 0.12, 2.3], [-15.8, 3.65, 1.95], greenAwningMat, 0);
  greenAwning.rotation.x = 0.24;

  /* ==========================================================================
   * PART F: NE PARKING COURTYARD, WHITE-AND-RED BOUNDARY WALL & PARKED VANS (B06, B07, S10)
   * ======================================================================== */
  // White-and-red low perimeter wall with black entrance gate along Khan Jahan Ali Rd edge
  addRotBox(g, [0.30, 1.95, 16.5], [14.6, 0.975, 4.2], bank.modernWhite, 0.08);
  addRotBox(g, [0.38, 0.22, 16.6], [14.6, 2.02, 4.2], redBrickPillarMat, 0.08);
  // Black iron entrance gate near front NE corner
  addRotBox(g, [0.16, 2.15, 4.4], [13.2, 1.075, 11.4], bank.steelDark, -0.45);
  // Parked White Hotel HiAce Vans & SUVs neatly lined in the NE courtyard (exact B06 & B07!)
  addParkedVanOrCar(g, bank, 11.2, 0.12, 7.6, -1.42, true, bank.modernWhite);
  addParkedVanOrCar(g, bank, 11.8, 0.12, 4.4, -1.42, true, bank.carSilver);
  addParkedVanOrCar(g, bank, 12.2, 0.12, 1.2, -1.42, false, bank.carNavy);
}
