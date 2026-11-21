import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { box, cylinder, rodBetween } from './scene-utils.js';
import { attachDerivedPBRMaps } from './aaa-shaders.js';

/**
 * KHULNA DISTRICT MODEL MOSQUE (খুলনা জেলা মডেল মসজিদ)
 *
 * Ultra-Detailed, 100% Enterable & Playable 3-Story Mosque following the iconic
 * pure-white Bangladeshi Model Mosque exterior design:
 *  - ZERO Arabic text anywhere (strictly clean Bengali & English "Model Mosque" signage only —
 *    no "Cultural Center" branding anywhere).
 *  - Exterior: Pure white marble & warm ivory stone architecture, vertical fluted pilasters,
 *    recessed deep-teal glazed Islamic pointed-arch windows with white lattice mullions,
 *    tall white-on-charcoal Islamic jaali screens, 1 Grand Central Ribbed White Dome +
 *    3 Front White Domes, 33m Pure-White Jaali Minaret (placed cleanly at NE corner plaza
 *    so it never blocks any entrance), and wide white marble front staircase.
 *  - Animated Spinning Ceiling Fans across Ground Floor, 2nd Floor Prayer Hall & 3rd Floor Gallery.
 *  - Authentic Mosque Sound System ONLY:
 *      * Imam & Azaan/Muazzin standing gooseneck microphones + compact wall PA amplifier
 *      * 6 Compact Wall-Mounted PA Echo Sound Boxes placed high up in the 4 corners & 2 mid upper side walls
 *  - Grand Lighting & Night Glow:
 *      * 1 Grand 4-Tier Brass & Crystal Central Chandelier + 2 Matching Side Chandeliers
 *      * 28+ Recessed Warm Ceiling LED Downlights + 12 Column/Wall Sconce Lanterns + Mihrab Cove Light
 *      * Real warm interior PointLights + strong emissive night-glow boost in dark/night mode [N]
 *  - Performance: All static geometry merges via mergeStaticMeshes(); animated fans & lights
 *    distance-culled for locked 60–120 FPS at full native resolution.
 */

export const MODEL_MOSQUE_POS = { x: 171.0, z: 166.0 };

const MX = MODEL_MOSQUE_POS.x; // 171.0
const MZ = MODEL_MOSQUE_POS.z; // 166.0
const W = 22.0; // X: 160.0 .. 182.0
const D = 24.0; // Z: 154.0 .. 178.0
const X_WEST = MX - W * 0.5; // 160.0
const X_EAST = MX + W * 0.5; // 182.0
const X_VERANDA = X_EAST + 4.5; // 186.5
const Z_NORTH = MZ - D * 0.5; // 154.0
const Z_SOUTH = MZ + D * 0.5; // 178.0

const Y0 = 0.30; // Ground Floor
const Y1 = 3.80; // 2nd Floor Main Prayer Hall
const Y2 = 8.40; // 3rd Floor Upper Prayer Gallery
const Y_ROOF = 13.40; // Roof Slab

// Interior Switchback Stairwell (South-West corner, clear of Mihrab & Ozu Khana)
const STAIR_X_LAND = 162.6;
const STAIR_X1 = 169.0;
const STAIR_Z0 = 173.4;
const STAIR_Z_MID = 175.4;
const STAIR_Z1 = 177.4;

// Grand Front Exterior Marble Staircase (East Veranda to Courtyard)
const FRONT_STAIR_X0 = 186.5;
const FRONT_STAIR_X1 = 193.0;
const FRONT_STAIR_Z0 = 161.0;
const FRONT_STAIR_Z1 = 171.0;

// Live animated elements & interactive state
const mosqueState = {
  mainHallOpen: true,
  mainHallAngle: Math.PI * 0.48,
  leftLeaf: null,
  rightLeaf: null,
  fans: [],
  pointLights: [],
  nightFactor: 0,
};

function seeded(seed = 202605) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ============================================================================
 * HIGH-RES PROCEDURAL PBR TEXTURES (PURE WHITE MODEL MOSQUE PALETTE)
 * ========================================================================== */

function makeWhiteMarbleWallTexture(baseHex = '#f7f5ef', veinHex = '#ddd6c7', seedVal = 20261) {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, S, S);

  // Subtle fine marble grain
  for (let i = 0; i < 3600; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.28)' : 'rgba(145,136,120,0.045)';
    ctx.fillRect(rnd() * S, rnd() * S, 1.5 + rnd() * 3.0, 1.5 + rnd() * 2.5);
  }

  // Delicate natural stone veins
  ctx.strokeStyle = veinHex;
  for (let v = 0; v < 20; v++) {
    ctx.globalAlpha = 0.12 + rnd() * 0.14;
    ctx.lineWidth = 1.0 + rnd() * 2.0;
    ctx.beginPath();
    let x = rnd() * S;
    let y = 0;
    ctx.moveTo(x, y);
    while (y < S) {
      y += 44 + rnd() * 36;
      x += (rnd() - 0.5) * 58;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  // Crisp architectural panel seams
  ctx.strokeStyle = 'rgba(138,132,120,0.24)';
  ctx.lineWidth = 2.0;
  for (let p = 0; p < S; p += 256) {
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

function makeWhiteJaaliTexture() {
  // Crisp white-on-charcoal Islamic geometric jaali matching the reference white 3D model
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#f8f7f2';
  ctx.fillRect(0, 0, S, S);

  const cell = 128;
  for (let gy = 0; gy < S; gy += cell) {
    for (let gx = 0; gx < S; gx += cell) {
      const cx = gx + cell * 0.5;
      const cy = gy + cell * 0.5;
      const r = cell * 0.43;

      // Deep dark geometric cutouts behind white filigree
      ctx.fillStyle = '#1b2429';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const rad = i % 2 === 0 ? r * 0.94 : r * 0.52;
        const px = cx + Math.cos(a) * rad;
        const py = cy + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Pure white interlocking geometric ribs
      ctx.strokeStyle = '#f8f7f2';
      ctx.lineWidth = 5.5;
      ctx.strokeRect(gx + 5, gy + 5, cell - 10, cell - 10);

      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, gy + 6);
      ctx.lineTo(cx, gy + cell - 6);
      ctx.moveTo(gx + 6, cy);
      ctx.lineTo(gx + cell - 6, cy);
      ctx.moveTo(gx + 14, gy + 14);
      ctx.lineTo(gx + cell - 14, gy + cell - 14);
      ctx.moveTo(gx + cell - 14, gy + 14);
      ctx.lineTo(gx + 14, gy + cell - 14);
      ctx.stroke();

      // Subtle center diamond boss
      ctx.fillStyle = '#f8f7f2';
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeRealisticPrayerCarpetTexture() {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(9092);

  // Rich mosque emerald woven velvet base
  ctx.fillStyle = '#0c593e';
  ctx.fillRect(0, 0, S, S);

  for (let i = 0; i < 9500; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(3,26,16,0.10)';
    ctx.fillRect(rnd() * S, rnd() * S, 2, 2);
  }

  // Golden saff row alignment bands
  for (const bandY of [0, S - 48]) {
    ctx.fillStyle = '#cfa63e';
    ctx.fillRect(0, bandY, S, 48);
    ctx.fillStyle = '#093e2b';
    ctx.fillRect(0, bandY + 10, S, 28);
    ctx.fillStyle = '#e5c15d';
    for (let x = 12; x < S; x += 32) {
      ctx.fillRect(x, bandY + 18, 16, 12);
    }
  }

  // Individual prayer arch motifs
  const matW = S / 4;
  for (let col = 0; col < 4; col++) {
    const x0 = col * matW;
    const cx = x0 + matW * 0.5;
    ctx.strokeStyle = '#d8b44c';
    ctx.lineWidth = 4;
    ctx.strokeRect(x0 + 14, 64, matW - 28, S - 128);

    ctx.beginPath();
    ctx.moveTo(x0 + 34, S - 90);
    ctx.lineTo(x0 + 34, 240);
    ctx.quadraticCurveTo(x0 + 34, 130, cx, 96);
    ctx.quadraticCurveTo(x0 + matW - 34, 130, x0 + matW - 34, 240);
    ctx.lineTo(x0 + matW - 34, S - 90);
    ctx.closePath();
    ctx.fillStyle = 'rgba(6, 65, 44, 0.52)';
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#d8b44c';
    ctx.beginPath();
    ctx.arc(cx, 255, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 6);
  tex.anisotropy = 8;
  return tex;
}

function makeOzuCeramicTileTexture() {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(4413);

  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, S, S);
  const step = 64;
  for (let y = 0; y < S; y += step) {
    for (let x = 0; x < S; x += step) {
      const checker = ((x / step) + (y / step)) % 2 === 0;
      const r = checker ? 226 : 210;
      const g = checker ? 240 : 228;
      const b = checker ? 246 : 238;
      ctx.fillStyle = `rgb(${r + Math.floor(rnd() * 6 - 3)},${g + Math.floor(rnd() * 6 - 3)},${b})`;
      ctx.fillRect(x + 2, y + 2, step - 4, step - 4);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 3);
  tex.anisotropy = 8;
  return tex;
}

function makeMosquePlaqueTexture() {
  // Strictly "মডেল মসজিদ" ONLY — zero "ইসলামিক সাংস্কৃতিক কেন্দ্র" & zero Arabic text!
  const W = 1024;
  const H = 224;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#0a3a42');
  g.addColorStop(0.5, '#0d5661');
  g.addColorStop(1, '#082f36');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#e0b84c';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.strokeStyle = 'rgba(255,255,255,0.40)';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 58px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText('খুলনা জেলা মডেল মসজিদ', W * 0.5, H * 0.39, W - 80);

  ctx.fillStyle = '#fde047';
  ctx.font = '700 25px "Manrope", "Noto Sans Bengali", sans-serif';
  ctx.fillText('KHULNA DISTRICT MODEL MOSQUE · আলিয়া মাদ্রাসা প্রাঙ্গণ, খুলনা', W * 0.5, H * 0.75, W - 80);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makePrayerTimeBoardTexture() {
  const W = 512;
  const H = 640;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#071b1a';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#d8b44c';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, W - 16, H - 16);

  ctx.fillStyle = '#0d4c45';
  ctx.fillRect(20, 20, W - 40, 88);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 34px "Noto Sans Bengali", sans-serif';
  ctx.fillText('নামাজের সময়সূচী', W * 0.5, 60);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '700 18px "Manrope", sans-serif';
  ctx.fillText('KHULNA DISTRICT MODEL MOSQUE', W * 0.5, 94);

  const rows = [
    ['ফজর (FAJR)', '০৪:৩০'],
    ['যোহর (DHUHR)', '০১:১৫'],
    ['আসর (ASR)', '০৪:৪৫'],
    ['মাগরিব (MAGHRIB)', '০৬:২০'],
    ['এশা (ISHA)', '০৮:০০'],
    ['জুম্মা (JUMMAH)', '০১:৩০'],
  ];
  rows.forEach(([name, time], idx) => {
    const ry = 136 + idx * 78;
    ctx.fillStyle = idx % 2 === 0 ? 'rgba(18, 82, 74, 0.48)' : 'rgba(12, 54, 48, 0.36)';
    ctx.fillRect(26, ry, W - 52, 64);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px "Noto Sans Bengali", sans-serif';
    ctx.fillText(name, 44, ry + 41);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 30px "Manrope", monospace';
    ctx.fillText(time, W - 44, ry + 42);
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeRoomSignTexture(title, subtitle) {
  const W = 512;
  const H = 128;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0c3f45';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#d8b44c';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, W - 12, H - 12);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px "Noto Sans Bengali", sans-serif';
  ctx.fillText(title, W * 0.5, 48, W - 40);
  ctx.fillStyle = '#fde047';
  ctx.font = '600 20px "Manrope", sans-serif';
  ctx.fillText(subtitle, W * 0.5, 90, W - 40);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeClockFaceTexture() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#faf8f2';
  ctx.beginPath();
  ctx.arc(128, 128, 122, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 10;
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = i % 3 === 0 ? 6 : 3;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(a) * 90, 128 + Math.sin(a) * 90);
    ctx.lineTo(128 + Math.cos(a) * 108, 128 + Math.sin(a) * 108);
    ctx.stroke();
  }
  // Hour & minute hands
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.lineTo(128 + 42, 128 - 46);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.lineTo(128 - 10, 128 - 78);
  ctx.stroke();
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.arc(128, 128, 8, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ============================================================================
 * ARCHITECTURAL & INTERIOR PROPS (SPINNING FANS, PA SPEAKERS, MICS, CHANDELIERS)
 * ========================================================================== */

function addPointedArchSpandrel(parent, { span, height, depth, archRise, pos, rotY = 0, mat }) {
  const hw = span * 0.5;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, 0);
  shape.lineTo(-hw, height);
  shape.lineTo(hw, height);
  shape.lineTo(hw, 0);
  const segs = 16;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const ang = t * Math.PI;
    const ax = Math.cos(ang) * hw;
    const ay = Math.pow(Math.sin(ang), 0.78) * archRise;
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

/**
 * Signature White Model Mosque Recessed Teal-Glazed Pointed-Arch Window
 * with crisp white geometric lattice mullions (matches the white 3D reference model!).
 */
function addModelMosqueWindow(staticG, dynamicG, mats, x, yBase, z, width, height, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, yBase, z);
  g.rotation.y = rotY;

  const archH = Math.min(0.72, width * 0.36);
  const rectH = height - archH;

  // Sculpted pure-white sill & outer surround frame
  box(g, [width + 0.30, 0.12, 0.38], [0, 0.06, 0], mats.pureWhite);
  box(g, [0.14, height + 0.12, 0.30], [-width * 0.5 - 0.04, height * 0.5, 0], mats.pureWhite);
  box(g, [0.14, height + 0.12, 0.30], [width * 0.5 + 0.04, height * 0.5, 0], mats.pureWhite);

  // White lattice mullions over the teal glazing
  box(g, [width, 0.08, 0.22], [0, 0.12, 0], mats.pureWhite);
  box(g, [width, 0.08, 0.22], [0, rectH, 0], mats.pureWhite);
  box(g, [width, 0.06, 0.18], [0, rectH * 0.5, 0], mats.pureWhite);
  for (const mxOff of [-width * 0.22, 0, width * 0.22]) {
    box(g, [0.055, height - 0.18, 0.18], [mxOff, height * 0.5, 0], mats.pureWhite);
  }

  // Pointed white arch header spandrel
  addPointedArchSpandrel(g, {
    span: width,
    height: archH + 0.16,
    depth: 0.30,
    archRise: archH,
    pos: [0, rectH, 0],
    rotY: 0,
    mat: mats.pureWhite,
  });
  staticG.add(g);

  // Signature deep-teal reflective glass pane (glows softly at night!)
  const glassWrap = new THREE.Group();
  glassWrap.position.set(x, yBase, z);
  glassWrap.rotation.y = rotY;
  const glass = new THREE.Mesh(new THREE.BoxGeometry(width - 0.12, height - 0.18, 0.05), mats.tealWindowGlass);
  glass.position.set(0, height * 0.5, 0);
  glassWrap.add(glass);
  dynamicG.add(glassWrap);
}

/**
 * Animated Spinning Ceiling Fan!
 * Static canopy & downrod go into staticG; rotating motor + 3 pitched white blades go into dynamicG.
 */
function addSpinningCeilingFan(staticG, dynamicG, mats, x, ceilY, z, speed = 7.4) {
  cylinder(staticG, 0.06, 0.085, 0.07, [x, ceilY - 0.035, z], mats.pureWhite, 10);
  cylinder(staticG, 0.022, 0.022, 0.52, [x, ceilY - 0.30, z], mats.bronzeMat, 8);

  const rotor = new THREE.Group();
  rotor.position.set(x, ceilY - 0.56, z);
  rotor.userData.spinSpeed = speed;

  // Motor hub + decorative gold trim ring
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.17, 0.095, 14), mats.pureWhite);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.176, 0.176, 0.022, 14), mats.brassMat);
  rotor.add(hub, ring);

  // 3 realistic slightly pitched fan blades with mounting arms
  for (let b = 0; b < 3; b++) {
    const a = (b / 3) * Math.PI * 2;
    const arm = new THREE.Group();
    arm.rotation.y = a;
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.018, 0.045), mats.brassMat);
    bracket.position.set(0.18, 0, 0);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.014, 0.145), mats.pureWhite);
    blade.position.set(0.50, 0, 0);
    blade.rotation.x = 0.14; // realistic blade pitch
    arm.add(bracket, blade);
    rotor.add(arm);
  }

  dynamicG.add(rotor);
  mosqueState.fans.push(rotor);
  return rotor;
}

/**
 * Compact Wall-Mounted Mosque PA Echo Sound Box (সাউন্ড বক্স)
 * Mounted high on upper walls/corners, angled gently downward toward the prayer hall.
 */
function addMosqueSoundBox(staticG, dynamicG, mats, x, y, z, yaw, tiltDown = 0.24) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = yaw;

  // Heavy-duty steel wall mount plate & swivel U-bracket
  box(g, [0.16, 0.22, 0.04], [0, 0.06, -0.18], mats.bronzeMat);
  box(g, [0.05, 0.05, 0.18], [0, 0.06, -0.09], mats.bronzeMat);

  // Angled compact speaker cabinet (0.32m W x 0.50m H x 0.24m D)
  const cab = new THREE.Group();
  cab.rotation.x = tiltDown;
  box(cab, [0.32, 0.50, 0.24], [0, 0, 0], mats.speakerCabinet);
  // Perforated dark acoustic front grille + beveled rim
  box(cab, [0.28, 0.44, 0.03], [0, 0, 0.12], mats.speakerGrille);
  // Subtle woofer & tweeter circles behind the mesh
  const woofer = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.02, 14), mats.bronzeMat);
  woofer.rotation.x = Math.PI * 0.5;
  woofer.position.set(0, -0.08, 0.128);
  const tweeter = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 12), mats.chromeMat);
  tweeter.rotation.x = Math.PI * 0.5;
  tweeter.position.set(0, 0.12, 0.128);
  cab.add(woofer, tweeter);
  g.add(cab);
  staticG.add(g);

  // Tiny subtle power LED dot on bottom corner of speaker (glows softly at night)
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), mats.ledGreenGlow);
  led.position.set(0.11, -0.19, 0.138);
  const ledWrap = new THREE.Group();
  ledWrap.position.set(x, y, z);
  ledWrap.rotation.y = yaw;
  const ledTilt = new THREE.Group();
  ledTilt.rotation.x = tiltDown;
  ledTilt.add(led);
  ledWrap.add(ledTilt);
  dynamicG.add(ledWrap);
}

/**
 * Standing Azaan / Imam Condenser Microphone on Heavy Base Stand
 */
function addAzaanMicrophoneStand(staticG, mats, x, yBase, z, yaw = 0) {
  const g = new THREE.Group();
  g.position.set(x, yBase, z);
  g.rotation.y = yaw;

  // Heavy cast-iron circular weighted base
  cylinder(g, 0.15, 0.17, 0.04, [0, 0.02, 0], mats.speakerCabinet, 14);
  // Telescopic chrome & matte-black vertical pole
  cylinder(g, 0.018, 0.022, 0.78, [0, 0.41, 0], mats.speakerCabinet, 8);
  cylinder(g, 0.012, 0.014, 0.58, [0, 1.05, 0], mats.chromeMat, 8);
  cylinder(g, 0.024, 0.024, 0.045, [0, 0.78, 0], mats.bronzeMat, 8); // Clutch lock
  // Angled gooseneck boom arm + condenser microphone capsule with black foam windscreen
  rodBetween(g, [0, 1.32, 0], [0.22, 1.44, 0], 0.009, mats.speakerCabinet, 6);
  const micHead = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.05, 6, 10), mats.speakerGrille);
  micHead.rotation.z = -Math.PI * 0.36;
  micHead.position.set(0.26, 1.46, 0);
  g.add(micHead);

  staticG.add(g);
}

/**
 * Ornate Multi-Tier Brass & Crystal Mosque Chandelier (ঝাড়বাতি) with Night-Glowing Globes
 */
function addOrnateChandelier(staticG, dynamicG, mats, x, ceilY, z, scale = 1.0, dropLen = 4.6) {
  // Ceiling rose & brass suspension rod
  cylinder(staticG, 0.24 * scale, 0.32 * scale, 0.14, [x, ceilY - 0.07, z], mats.brassMat, 16);
  cylinder(staticG, 0.045 * scale, 0.045 * scale, dropLen, [x, ceilY - dropLen * 0.5, z], mats.brassMat, 10);

  const baseY = ceilY - dropLen;
  const tiers = scale >= 0.9
    ? [
        { r: 2.55 * scale, y: baseY + 1.55, bulbs: 16 },
        { r: 1.85 * scale, y: baseY + 0.85, bulbs: 12 },
        { r: 1.15 * scale, y: baseY + 0.20, bulbs: 8 },
        { r: 0.52 * scale, y: baseY - 0.38, bulbs: 4 },
      ]
    : [
        { r: 1.25 * scale, y: baseY + 0.55, bulbs: 10 },
        { r: 0.65 * scale, y: baseY + 0.05, bulbs: 6 },
      ];

  for (const tier of tiers) {
    // Ornate golden filigree ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(tier.r, 0.055 * scale, 8, 28), mats.brassMat);
    ring.rotation.x = Math.PI * 0.5;
    ring.position.set(x, tier.y, z);
    staticG.add(ring);

    // 4 Radial spokes connecting ring to central brass stem
    for (let s = 0; s < 4; s++) {
      const sa = (s / 4) * Math.PI * 2;
      rodBetween(staticG, [x, tier.y + 0.28, z], [x + Math.cos(sa) * tier.r, tier.y, z + Math.sin(sa) * tier.r], 0.018 * scale, mats.brassMat, 6);
    }

    // Glowing crystal light globes around each tier
    for (let i = 0; i < tier.bulbs; i++) {
      const a = (i / tier.bulbs) * Math.PI * 2;
      const gx = x + Math.cos(a) * tier.r;
      const gz = z + Math.sin(a) * tier.r;
      cylinder(staticG, 0.04 * scale, 0.06 * scale, 0.09, [gx, tier.y + 0.07, gz], mats.brassMat, 8);
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.115 * scale, 10, 8), mats.chandelierGlow);
      globe.position.set(gx, tier.y + 0.17, gz);
      dynamicG.add(globe);
    }
  }

  // Hanging central crystal finial drop at the very bottom
  const crystalDrop = new THREE.Mesh(new THREE.OctahedronGeometry(0.24 * scale, 1), mats.chandelierGlow);
  crystalDrop.scale.set(0.75, 1.45, 0.75);
  crystalDrop.position.set(x, baseY - 0.68 * scale, z);
  dynamicG.add(crystalDrop);
}

/**
 * Ornate Brass Wall/Column Sconce Lantern (glows warmly in the dark!)
 */
function addWallSconce(staticG, dynamicG, mats, x, y, z, outX = 0, outZ = 0) {
  box(staticG, [0.10, 0.28, 0.10], [x, y, z], mats.brassMat);
  const lx = x + outX * 0.22;
  const lz = z + outZ * 0.22;
  rodBetween(staticG, [x, y - 0.04, z], [lx, y + 0.04, lz], 0.02, mats.brassMat, 6);
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), mats.sconceGlow);
  lantern.scale.set(0.85, 1.35, 0.85);
  lantern.position.set(lx, y + 0.16, lz);
  dynamicG.add(lantern);
}

/**
 * Recessed Warm Ceiling Downlight Panel (glows strongly in dark/night mode!)
 */
function addCeilingDownlight(staticG, dynamicG, mats, x, ceilY, z, radius = 0.28) {
  cylinder(staticG, radius + 0.05, radius + 0.05, 0.03, [x, ceilY - 0.015, z], mats.brassMat, 12);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.04, 12), mats.ceilingLedGlow);
  disc.position.set(x, ceilY - 0.025, z);
  dynamicG.add(disc);
}

function addCourtyardLamp(staticG, dynamicG, mats, x, z, h = 4.6, yBase = 0.08) {
  cylinder(staticG, 0.16, 0.22, 0.50, [x, yBase + 0.25, z], mats.bronzeMat, 10);
  cylinder(staticG, 0.055, 0.085, h, [x, yBase + h * 0.5 + 0.25, z], mats.bronzeMat, 8);
  box(staticG, [1.10, 0.07, 0.07], [x, yBase + h + 0.22, z], mats.bronzeMat);
  for (const sx of [-0.48, 0.48]) {
    cylinder(staticG, 0.12, 0.16, 0.08, [x + sx, yBase + h + 0.28, z], mats.brassMat, 8);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), mats.sconceGlow);
    globe.position.set(x + sx, yBase + h + 0.44, z);
    dynamicG.add(globe);
  }
}

function addMosqueSignPlaque(dynamicG, tex, pos, rotY, w, h, backlit = true, emissiveList = null) {
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: backlit ? 0xffffff : 0x000000,
    emissiveMap: backlit ? tex : null,
    emissiveIntensity: backlit ? 0.32 : 0.0,
    roughness: 0.32,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });
  if (backlit && emissiveList) {
    emissiveList.push({ mat, day: 0.30, night: 1.65 });
  }
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.10), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.y = rotY;
  dynamicG.add(mesh);
  return mesh;
}

/* ============================================================================
 * MAIN BUILDER: HIGH-QUALITY WHITE MODEL MOSQUE (EXTERIOR + FULL INTERIOR)
 * ========================================================================== */

export function buildKhulnaModelMosque3D(staticG, dynamicG, bank) {
  mosqueState.fans.length = 0;
  mosqueState.pointLights.length = 0;

  // Load the user's new repaired & textured Tripo 3D Khulna District Model Mosque exterior
  // Positioned at the exact Khulna District Model Mosque plaza (cx = 175.0, cz = 166.0) facing East (+X) toward the courtyard!
  const mosqueLoader = new GLTFLoader();
  mosqueLoader.load(
    './assets/khulna_model_mosque_tripo.glb',
    (gltf) => {
      const mScene = gltf.scene;
      mScene.updateMatrixWorld(true);
      const box3 = new THREE.Box3().setFromObject(mScene);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box3.getSize(size);
      box3.getCenter(center);

      mScene.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = false;
        child.receiveShadow = true;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const mat of mats) {
          if (!mat) continue;
          const mName = (mat.name || '').toLowerCase();
          if (mName.includes('blue_glass')) {
            // Transparent blue-tinted architectural glass so interior & exterior are visible through windows!
            mat.transparent = true;
            mat.opacity = 0.36;
            mat.depthWrite = false;
            mat.roughness = 0.12;
            mat.metalness = 0.15;
          } else if (mName.includes('white_dome')) {
            // Matte weathered concrete-plaster white dome (zero glossy plastic shine!)
            mat.roughness = 0.88;
            mat.metalness = 0.0;
          } else if (mName.includes('prayer_carpet')) {
            mat.roughness = 0.94;
            mat.metalness = 0.0;
          } else if (mName.includes('warm_light')) {
            mat.emissive = new THREE.Color(0xffe4aa);
            mat.emissiveIntensity = 1.6;
          }
          mat.side = THREE.DoubleSide;
          mat.needsUpdate = true;
        }
      });

      // Exact millimeter-accurate alignment matching build_aaa_mosque.py & getModelMosqueGroundHeight!
      // (Avoids box3.min.y lift caused by tilted stair stringer extending below Z=0!)
      const scale = MOSQUE_AAA_SCALE;
      const wrapper = new THREE.Group();
      wrapper.name = 'Khulna_Model_Mosque_Tripo_3D';

      mScene.position.set(0, 0, -0.5 * scale);
      mScene.scale.setScalar(scale);
      wrapper.add(mScene);

      // In Blender, Front faced -Y -> in glTF (+Y up), Front faces +Z.
      // Rotate +90 deg around Y (Math.PI * 0.5) so Front stairs face +X (East courtyard, toward the player!)
      wrapper.rotation.y = Math.PI * 0.5;
      wrapper.position.set(175.0, MOSQUE_BASE_Y, 166.0);
      dynamicG.add(wrapper);

      // Permanent warm interior lighting for the Grand Prayer Hall & Mihrab (never toggled visible/invisible -> zero lag!)
      const hallLight = new THREE.PointLight(0xffe8bb, 1.35, 28, 1.6);
      hallLight.position.set(168.4, 9.2, 166.0);
      dynamicG.add(hallLight);
      const mihrabLight = new THREE.PointLight(0xffdfb0, 0.85, 16, 1.7);
      mihrabLight.position.set(162.8, 6.8, 166.0);
      dynamicG.add(mihrabLight);
    },
    undefined,
    (err) => {
      console.warn('Khulna Model Mosque Tripo GLB load warning:', err);
    }
  );

  // Solid raised concrete courtyard apron so the front stairs sit cleanly above the pond water plane (fixes Swim bug!)
  const plazaMat = new THREE.MeshStandardMaterial({ color: 0xded9cf, roughness: 0.85, metalness: 0.02 });
  box(staticG, [38.0, 0.34, 38.0], [176.5, 0.17, 166.0], plazaMat, { castShadow: false });
  return;

  const whiteWallTex = makeWhiteMarbleWallTexture('#f7f5ef', '#ddd5c5', 20261);
  whiteWallTex.repeat.set(3, 2);
  const pureWhiteWallMat = new THREE.MeshPhysicalMaterial({
    map: whiteWallTex,
    roughness: 0.30,
    metalness: 0.03,
    clearcoat: 0.34,
    envMapIntensity: 0.78,
  });
  attachDerivedPBRMaps(pureWhiteWallMat, whiteWallTex, { strength: 1.35, roughBase: 0.30, normalScale: 0.42 });

  const floorMarbleTex = makeWhiteMarbleWallTexture('#efece4', '#cbc3b4', 20262);
  floorMarbleTex.repeat.set(5, 5);
  const floorMarbleMat = new THREE.MeshPhysicalMaterial({
    map: floorMarbleTex,
    roughness: 0.20,
    metalness: 0.04,
    clearcoat: 0.62,
    envMapIntensity: 0.88,
  });

  const jaaliTex = makeWhiteJaaliTexture();
  jaaliTex.repeat.set(2, 4);
  const jaaliMat = new THREE.MeshStandardMaterial({
    map: jaaliTex,
    roughness: 0.42,
    metalness: 0.06,
    envMapIntensity: 0.68,
  });
  attachDerivedPBRMaps(jaaliMat, jaaliTex, { strength: 2.2, roughBase: 0.42, normalScale: 0.75 });

  // Dedicated high-glow emissive materials for dark/night mode!
  const chandelierGlow = new THREE.MeshStandardMaterial({
    color: 0xfffbeb,
    emissive: 0xffd269,
    emissiveIntensity: 1.15,
    roughness: 0.15,
  });
  const ceilingLedGlow = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff1c9,
    emissiveIntensity: 0.95,
    roughness: 0.18,
  });
  const sconceGlow = new THREE.MeshStandardMaterial({
    color: 0xfff8dc,
    emissive: 0xffca60,
    emissiveIntensity: 0.78,
    roughness: 0.20,
  });
  const tealWindowGlass = new THREE.MeshPhysicalMaterial({
    color: 0x0d7f90,
    emissive: 0x0f6b7a,
    emissiveIntensity: 0.22,
    roughness: 0.12,
    metalness: 0.18,
    clearcoat: 0.92,
    opacity: 0.82,
    transparent: true,
  });
  const exteriorGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfff4d4,
    emissive: 0xffcf6e,
    emissiveIntensity: 0.28,
    roughness: 0.22,
  });
  const ledGreenGlow = new THREE.MeshStandardMaterial({
    color: 0x4ade80,
    emissive: 0x22c55e,
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });
  const ledRedGlow = new THREE.MeshStandardMaterial({
    color: 0xf87171,
    emissive: 0xef4444,
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });

  if (bank?.emissiveList) {
    bank.emissiveList.push(
      { mat: chandelierGlow, day: 1.15, night: 4.40 },
      { mat: ceilingLedGlow, day: 0.95, night: 3.60 },
      { mat: sconceGlow, day: 0.78, night: 3.40 },
      { mat: tealWindowGlass, day: 0.22, night: 1.65 },
      { mat: exteriorGlowMat, day: 0.28, night: 2.85 },
    );
  }

  const mats = {
    marbleWall: pureWhiteWallMat,
    floorMarble: floorMarbleMat,
    pureWhite: new THREE.MeshPhysicalMaterial({ color: 0xfbfaf6, roughness: 0.20, metalness: 0.04, clearcoat: 0.72 }),
    marbleDome: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.18, metalness: 0.04, clearcoat: 0.82 }),
    granite: bank.granite,
    jaali: jaaliMat,
    tealAccent: new THREE.MeshPhysicalMaterial({ color: 0x0d7a8a, roughness: 0.22, metalness: 0.16, clearcoat: 0.72 }),
    brassMat: new THREE.MeshPhysicalMaterial({ color: 0xd1a441, roughness: 0.22, metalness: 0.88, clearcoat: 0.62 }),
    bronzeMat: new THREE.MeshStandardMaterial({ color: 0x262320, roughness: 0.36, metalness: 0.74 }),
    chromeMat: bank.chromeMat,
    teakWood: bank.teakWood,
    lightWood: bank.lightWood,
    carpet: new THREE.MeshStandardMaterial({ map: makeRealisticPrayerCarpetTexture(), roughness: 0.92, metalness: 0.02 }),
    ozuTile: new THREE.MeshPhysicalMaterial({ map: makeOzuCeramicTileTexture(), roughness: 0.18, metalness: 0.05, clearcoat: 0.68 }),
    interiorWall: bank.interiorWall,
    mirrorMat: new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, roughness: 0.05, metalness: 0.90, clearcoat: 1.0 }),
    speakerCabinet: new THREE.MeshStandardMaterial({ color: 0x191d22, roughness: 0.48, metalness: 0.28 }),
    speakerGrille: new THREE.MeshStandardMaterial({ color: 0x2c323a, roughness: 0.62, metalness: 0.58 }),
    tealWindowGlass,
    chandelierGlow,
    ceilingLedGlow,
    sconceGlow,
    exteriorGlowMat,
    ledGreenGlow,
    ledRedGlow,
    paver: bank.paverDriveway,
    moss: bank.moss,
  };

  /* --------------------------------------------------------------------------
   * 1. COURTYARD PLAZA, TERRACOTTA APPROACH WALKWAY & WHITE MARBLE PLINTH
   * ------------------------------------------------------------------------ */
  box(staticG, [42.0, 0.10, 38.0], [MX + 4.0, 0.04, MZ], mats.floorMarble, { castShadow: false });
  box(staticG, [10.4, 0.08, 30.0], [190.5, 0.04, 141.0], mats.paver, { castShadow: false });

  // Ground floor raised white marble plinth (top at Y0 = 0.30m) + gentle step aprons at every entrance
  box(staticG, [W + 5.0, Y0, D + 0.8], [MX + 2.25, Y0 * 0.5, MZ], mats.floorMarble);
  box(staticG, [0.95, 0.15, 7.0], [X_VERANDA + 0.48, 0.075, 157.5], mats.granite);
  box(staticG, [0.95, 0.15, 7.0], [X_VERANDA + 0.48, 0.075, 174.5], mats.granite);
  box(staticG, [4.2, 0.15, 0.95], [171.75, 0.075, Z_NORTH - 0.55], mats.granite);
  box(staticG, [4.2, 0.15, 0.95], [171.75, 0.075, Z_SOUTH + 0.55], mats.granite);

  /* --------------------------------------------------------------------------
   * 2. GROUND FLOOR (y = 0.30m .. 3.80m) — PURE MOSQUE FOYER, OZU KHANA & HIFZ ROOM
   * ------------------------------------------------------------------------ */
  const gH = Y1 - Y0; // 3.50m
  const gMidY = Y0 + gH * 0.5;

  // Ground Exterior White Marble Walls with 4 WIDE UNOBSTRUCTED ENTRANCES:
  box(staticG, [0.36, gH, D], [X_WEST + 0.18, gMidY, MZ], mats.marbleWall);
  // North Wall (open entrance x = 170.0..173.5)
  box(staticG, [10.0, gH, 0.36], [165.0, gMidY, Z_NORTH + 0.18], mats.marbleWall);
  box(staticG, [8.5, gH, 0.36], [177.75, gMidY, Z_NORTH + 0.18], mats.marbleWall);
  addPointedArchSpandrel(staticG, { span: 3.5, height: 1.0, depth: 0.36, archRise: 0.62, pos: [171.75, Y1 - 1.0, Z_NORTH + 0.18], rotY: 0, mat: mats.pureWhite });
  // South Wall (open entrance x = 170.0..173.5)
  box(staticG, [10.0, gH, 0.36], [165.0, gMidY, Z_SOUTH - 0.18], mats.marbleWall);
  box(staticG, [8.5, gH, 0.36], [177.75, gMidY, Z_SOUTH - 0.18], mats.marbleWall);
  addPointedArchSpandrel(staticG, { span: 3.5, height: 1.0, depth: 0.36, archRise: 0.62, pos: [171.75, Y1 - 1.0, Z_SOUTH - 0.18], rotY: 0, mat: mats.pureWhite });
  // East Ground Wall (wide open entrances at z = 156.5..160.0 and z = 172.0..175.5)
  box(staticG, [0.36, gH, 2.5], [X_EAST - 0.18, gMidY, 155.25], mats.marbleWall);
  box(staticG, [0.36, gH, 12.0], [X_EAST - 0.18, gMidY, 166.0], mats.marbleWall);
  box(staticG, [0.36, gH, 2.5], [X_EAST - 0.18, gMidY, 176.75], mats.marbleWall);
  for (const ez of [158.25, 173.75]) {
    addPointedArchSpandrel(staticG, { span: 3.5, height: 0.95, depth: 0.36, archRise: 0.58, pos: [X_EAST - 0.18, Y1 - 0.95, ez], rotY: Math.PI * 0.5, mat: mats.pureWhite });
  }
  // Sculpted White Portico Columns under East Veranda (spaced wide so ground walkway is 100% open!)
  for (const cz of [154.6, 160.8, 171.2, 177.4]) {
    cylinder(staticG, 0.28, 0.33, gH, [X_VERANDA - 0.35, gMidY, cz], mats.pureWhite, 16);
    cylinder(staticG, 0.38, 0.40, 0.16, [X_VERANDA - 0.35, Y0 + 0.08, cz], mats.brassMat, 16);
    cylinder(staticG, 0.38, 0.38, 0.16, [X_VERANDA - 0.35, Y1 - 0.14, cz], mats.brassMat, 16);
  }

  // A) Quran & Hifz Room (North-West: x = 160.4..174.5, z = 154.4..163.8) — Pure Mosque Study Room!
  box(staticG, [14.0, gH, 0.22], [167.4, gMidY, 163.8], mats.interiorWall);
  box(staticG, [0.22, gH, 3.1], [174.5, gMidY, 155.95], mats.interiorWall);
  box(staticG, [0.22, gH, 2.6], [174.5, gMidY, 162.5], mats.interiorWall);
  box(staticG, [0.22, 0.95, 3.7], [174.5, Y1 - 0.48, 159.35], mats.interiorWall);
  box(staticG, [13.4, 0.03, 8.8], [167.4, Y0 + 0.015, 159.1], mats.carpet, { castShadow: false });
  addMosqueSignPlaque(dynamicG, makeRoomSignTexture('কুরআন শিক্ষা ও হিফজ কক্ষ', 'QURAN & HIFZ ROOM · MODEL MOSQUE'), [174.66, Y0 + 2.85, 159.35], Math.PI * 0.5, 2.5, 0.56, false);

  // Quran Bookshelves + Low Hifz Study Desks (Rehals) + Reading Tables
  const bookColors = [bank.emeraldMat, bank.flowerRed, bank.awningBlue, mats.brassMat, bank.terracotta];
  for (let shelfIdx = 0; shelfIdx < 3; shelfIdx++) {
    const bx = 162.4 + shelfIdx * 3.4;
    box(staticG, [2.6, 2.25, 0.48], [bx, Y0 + 1.125, 154.9], mats.teakWood);
    for (let row = 0; row < 4; row++) {
      const sy = Y0 + 0.36 + row * 0.46;
      for (let bi = 0; bi < 8; bi++) {
        box(staticG, [0.24, 0.32, 0.28], [bx - 1.05 + bi * 0.30, sy, 155.02], bookColors[(shelfIdx + row + bi) % bookColors.length]);
      }
    }
  }
  for (const tx of [164.6, 170.2]) {
    box(staticG, [2.8, 0.06, 1.15], [tx, Y0 + 0.76, 159.4], mats.lightWood);
    for (const [lx, lz] of [[-1.25, -0.48], [1.25, -0.48], [-1.25, 0.48], [1.25, 0.48]]) {
      box(staticG, [0.07, 0.74, 0.07], [tx + lx, Y0 + 0.37, 159.4 + lz], mats.teakWood);
    }
    // Open Quran books on study tables
    for (const qx of [-0.7, 0.7]) {
      box(staticG, [0.42, 0.05, 0.32], [tx + qx, Y0 + 0.81, 159.4], bank.chalkLine);
    }
    for (const cxOff of [-0.72, 0.72]) {
      for (const czSign of [-1, 1]) {
        const chz = 159.4 + czSign * 0.84;
        box(staticG, [0.46, 0.05, 0.44], [tx + cxOff, Y0 + 0.46, chz], mats.teakWood);
        box(staticG, [0.46, 0.44, 0.05], [tx + cxOff, Y0 + 0.70, chz + czSign * 0.20], mats.teakWood);
        for (const [clx, clz] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) {
          box(staticG, [0.04, 0.44, 0.04], [tx + cxOff + clx, Y0 + 0.22, chz + clz], mats.bronzeMat);
        }
      }
    }
  }
  addSpinningCeilingFan(staticG, dynamicG, mats, 164.8, Y1 - 0.18, 159.2, 7.2);
  addSpinningCeilingFan(staticG, dynamicG, mats, 170.6, Y1 - 0.18, 159.2, 7.8);

  // B) Ozu Khana (Ablution Hall — South-Center: x = 169.4..176.2, z = 167.8..177.5)
  box(staticG, [6.8, 0.03, 9.5], [172.8, Y0 + 0.015, 172.6], mats.ozuTile, { castShadow: false });
  box(staticG, [0.22, 2.2, 7.6], [169.4, Y0 + 1.1, 173.6], mats.ozuTile);
  addMosqueSignPlaque(dynamicG, makeRoomSignTexture('অজুখানা (OZU KHANA)', 'ABLUTION HALL · MODEL MOSQUE'), [176.2, Y0 + 2.85, 172.6], Math.PI * 0.5, 2.3, 0.54, false);

  for (let i = 0; i < 6; i++) {
    const tz = 169.0 + i * 1.38;
    // West Ozu Row
    box(staticG, [0.50, 0.42, 0.60], [171.25, Y0 + 0.21, tz], mats.ozuTile);
    box(staticG, [0.44, 0.05, 0.54], [171.25, Y0 + 0.44, tz], mats.granite);
    box(staticG, [0.46, 0.08, 1.32], [170.05, Y0 + 0.04, tz], mats.bronzeMat);
    cylinder(staticG, 0.022, 0.022, 0.24, [169.68, Y0 + 0.72, tz], mats.chromeMat, 8);
    box(staticG, [0.22, 0.035, 0.035], [169.78, Y0 + 0.80, tz], mats.chromeMat);
    // East Ozu Row
    box(staticG, [0.50, 0.42, 0.60], [173.15, Y0 + 0.21, tz], mats.ozuTile);
    box(staticG, [0.44, 0.05, 0.54], [173.15, Y0 + 0.44, tz], mats.granite);
    box(staticG, [0.46, 0.08, 1.32], [174.25, Y0 + 0.04, tz], mats.bronzeMat);
    cylinder(staticG, 0.022, 0.022, 0.24, [174.62, Y0 + 0.72, tz], mats.chromeMat, 8);
    box(staticG, [0.22, 0.035, 0.035], [174.52, Y0 + 0.80, tz], mats.chromeMat);
  }
  box(staticG, [0.28, 1.68, 8.2], [174.82, Y0 + 0.84, 172.5], mats.ozuTile);
  box(staticG, [0.04, 0.80, 6.8], [169.54, Y0 + 1.54, 172.5], mats.mirrorMat);
  box(staticG, [0.04, 0.80, 6.8], [174.66, Y0 + 1.54, 172.5], mats.mirrorMat);
  addSpinningCeilingFan(staticG, dynamicG, mats, 172.2, Y1 - 0.18, 172.5, 6.8);

  // C) East Mosque Entrance Foyer & Shoe Racks (x = 176.2..181.6)
  for (const sz of [162.0, 166.0, 170.0]) {
    box(staticG, [0.44, 1.12, 3.0], [X_EAST - 0.58, Y0 + 0.56, sz], mats.teakWood);
    for (let row = 0; row < 3; row++) {
      box(staticG, [0.38, 0.04, 2.86], [X_EAST - 0.58, Y0 + 0.25 + row * 0.30, sz], mats.lightWood);
    }
  }
  addSpinningCeilingFan(staticG, dynamicG, mats, 178.4, Y1 - 0.18, 161.5, 7.0);
  addSpinningCeilingFan(staticG, dynamicG, mats, 178.4, Y1 - 0.18, 170.5, 7.5);

  // Ground Floor Abundant Warm Recessed Ceiling Downlights (glow strongly at night!)
  for (const [lx, lz] of [
    [178.5, 157.5], [178.5, 164.0], [178.5, 168.0], [178.5, 174.5],
    [172.2, 169.5], [172.2, 175.5], [164.5, 156.5], [170.5, 156.5],
    [164.5, 161.8], [170.5, 161.8], [165.0, 168.0], [184.2, 158.2], [184.2, 173.8],
  ]) {
    addCeilingDownlight(staticG, dynamicG, mats, lx, Y1 - 0.15, lz, 0.26);
  }

  /* --------------------------------------------------------------------------
   * 3. 2ND FLOOR SLAB (y = 3.80m) & GRAND WHITE MARBLE FRONT STAIRCASE
   * ------------------------------------------------------------------------ */
  box(staticG, [W + 4.5, 0.28, 19.4], [MX + 2.25, Y1 - 0.14, 163.7], mats.pureWhite);
  box(staticG, [17.5, 0.28, 4.6], [177.75, Y1 - 0.14, 175.7], mats.pureWhite);

  // Grand Wide White Marble Front Staircase (x = 186.5..193.0, z = 161.0..171.0)
  const frontSteps = 16;
  for (let i = 0; i < frontSteps; i++) {
    const t = (i + 0.5) / frontSteps;
    const sx = THREE.MathUtils.lerp(FRONT_STAIR_X1, FRONT_STAIR_X0, t);
    const sy = THREE.MathUtils.lerp(0.08, Y1, (i + 1) / frontSteps);
    box(staticG, [0.46, sy, 10.0], [sx, sy * 0.5, MZ], mats.pureWhite);
    box(staticG, [0.06, 0.025, 10.0], [sx + 0.20, sy + 0.01, MZ], mats.granite);
  }
  for (const sz of [FRONT_STAIR_Z0 - 0.22, FRONT_STAIR_Z1 + 0.22]) {
    rodBetween(staticG, [FRONT_STAIR_X1, 1.05, sz], [FRONT_STAIR_X0, Y1 + 0.95, sz], 0.055, mats.brassMat, 10);
    box(staticG, [6.6, 0.38, 0.34], [189.75, 0.19, sz], mats.pureWhite);
    // Warm staircase corner bollard glow
    const bollard = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mats.sconceGlow);
    bollard.position.set(FRONT_STAIR_X1 + 0.1, 1.18, sz);
    dynamicG.add(bollard);
  }
  // 2nd Floor Veranda Pure-White Marble Balustrades (stair top z = 161..171 stays 100% open!)
  box(staticG, [0.24, 1.0, 6.8], [X_VERANDA - 0.12, Y1 + 0.50, 157.4], mats.pureWhite);
  box(staticG, [0.24, 1.0, 6.8], [X_VERANDA - 0.12, Y1 + 0.50, 174.6], mats.pureWhite);
  box(staticG, [4.5, 1.0, 0.24], [X_EAST + 2.25, Y1 + 0.50, Z_NORTH + 0.12], mats.pureWhite);
  box(staticG, [4.5, 1.0, 0.24], [X_EAST + 2.25, Y1 + 0.50, Z_SOUTH - 0.12], mats.pureWhite);
  // Veranda overhead canopy downlights
  for (const vz of [157.5, 162.5, 166.0, 169.5, 174.5]) {
    addCeilingDownlight(staticG, dynamicG, mats, X_EAST + 2.2, Y2 - 0.15, vz, 0.24);
  }

  /* --------------------------------------------------------------------------
   * 4. INTERIOR SWITCHBACK MARBLE STAIRCASE (GROUND -> 2ND -> 3RD FLOOR)
   * ------------------------------------------------------------------------ */
  const buildInteriorSwitchback = (yBot, yTop) => {
    const yMid = (yBot + yTop) * 0.5;
    const steps = 11;
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const sx = THREE.MathUtils.lerp(STAIR_X1, STAIR_X_LAND, t);
      const sy = THREE.MathUtils.lerp(yBot, yMid, (i + 1) / steps);
      box(staticG, [0.62, 0.24, 1.85], [sx, sy - 0.12, 174.4], mats.pureWhite);
      box(staticG, [0.05, 0.02, 1.85], [sx + 0.28, sy + 0.005, 174.4], mats.granite);
    }
    box(staticG, [2.2, 0.24, 4.0], [161.55, yMid - 0.12, 175.4], mats.pureWhite);
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const sx = THREE.MathUtils.lerp(STAIR_X_LAND, STAIR_X1, t);
      const sy = THREE.MathUtils.lerp(yMid, yTop, (i + 1) / steps);
      box(staticG, [0.62, 0.24, 1.85], [sx, sy - 0.12, 176.4], mats.pureWhite);
      box(staticG, [0.05, 0.02, 1.85], [sx - 0.28, sy + 0.005, 176.4], mats.granite);
    }
    rodBetween(staticG, [STAIR_X1, yBot + 0.92, STAIR_Z_MID], [STAIR_X_LAND, yMid + 0.92, STAIR_Z_MID], 0.036, mats.brassMat, 8);
    rodBetween(staticG, [STAIR_X_LAND, yMid + 0.92, STAIR_Z_MID], [STAIR_X1, yTop + 0.92, STAIR_Z_MID], 0.036, mats.brassMat, 8);
  };
  buildInteriorSwitchback(Y0, Y1);
  buildInteriorSwitchback(Y1, Y2);

  /* --------------------------------------------------------------------------
   * 5. 2ND FLOOR MAIN PRAYER HALL (y = 3.80m .. 8.40m) — ULTRA-DETAILED INTERIOR
   * ------------------------------------------------------------------------ */
  const h2 = Y2 - Y1; // 4.60m
  const midY2 = Y1 + h2 * 0.5;
  const upperH = Y_ROOF - Y1; // 9.60m
  const upperMidY = Y1 + upperH * 0.5;

  // Plush Emerald-Gold Saff Prayer Carpet (with stairwell cutout!)
  box(staticG, [W - 0.9, 0.035, 18.8], [MX, Y1 + 0.018, 163.8], mats.carpet, { castShadow: false });
  box(staticG, [12.4, 0.035, 4.4], [175.4, Y1 + 0.018, 175.4], mats.carpet, { castShadow: false });

  // Pure-White Sculpted Exterior Perimeter Walls (2nd & 3rd Floor)
  box(staticG, [0.38, upperH, D], [X_WEST + 0.19, upperMidY, MZ], mats.marbleWall);
  box(staticG, [W, upperH, 0.38], [MX, upperMidY, Z_NORTH + 0.19], mats.marbleWall);
  box(staticG, [W, upperH, 0.38], [MX, upperMidY, Z_SOUTH - 0.19], mats.marbleWall);

  // Interior Polished Marble Wainscoting (Dado) with Brass Top Rail along Perimeter Walls
  box(staticG, [0.06, 1.25, D - 0.8], [X_WEST + 0.41, Y1 + 0.625, MZ], mats.pureWhite);
  box(staticG, [0.08, 0.05, D - 0.8], [X_WEST + 0.42, Y1 + 1.26, MZ], mats.brassMat);
  box(staticG, [W - 0.8, 1.25, 0.06], [MX, Y1 + 0.625, Z_NORTH + 0.41], mats.pureWhite);
  box(staticG, [W - 0.8, 0.05, 0.08], [MX, Y1 + 1.26, Z_NORTH + 0.42], mats.brassMat);
  box(staticG, [W - 0.8, 1.25, 0.06], [MX, Y1 + 0.625, Z_SOUTH - 0.41], mats.pureWhite);
  box(staticG, [W - 0.8, 0.05, 0.08], [MX, Y1 + 1.26, Z_SOUTH - 0.42], mats.brassMat);

  // East Front Facade Wall (2nd Floor) with 3 WIDE ARCHED ENTRANCE PORTALS (ZERO ARABIC TEXT!)
  box(staticG, [0.42, h2, 3.5], [X_EAST - 0.21, midY2, 155.75], mats.marbleWall);
  box(staticG, [0.42, h2, 3.3], [X_EAST - 0.21, midY2, 162.15], mats.marbleWall);
  box(staticG, [0.42, h2, 3.3], [X_EAST - 0.21, midY2, 169.85], mats.marbleWall);
  box(staticG, [0.42, h2, 3.5], [X_EAST - 0.21, midY2, 176.25], mats.marbleWall);
  addPointedArchSpandrel(staticG, { span: 3.0, height: 1.5, depth: 0.44, archRise: 0.72, pos: [X_EAST - 0.21, Y1 + 3.1, 159.0], rotY: Math.PI * 0.5, mat: mats.pureWhite });
  addPointedArchSpandrel(staticG, { span: 4.4, height: 1.3, depth: 0.48, archRise: 0.88, pos: [X_EAST - 0.21, Y1 + 3.3, MZ], rotY: Math.PI * 0.5, mat: mats.pureWhite });
  addPointedArchSpandrel(staticG, { span: 3.0, height: 1.5, depth: 0.44, archRise: 0.72, pos: [X_EAST - 0.21, Y1 + 3.1, 173.0], rotY: Math.PI * 0.5, mat: mats.pureWhite });

  // Interactive Carved Teak Double Doors at the Grand Center Portal (x = 181.8, z = 163.8..168.2)
  const buildTeakDoorLeaf = (hingeZ, sign) => {
    const leaf = new THREE.Group();
    leaf.position.set(X_EAST - 0.22, Y1, hingeZ);
    box(leaf, [0.09, 3.25, 2.05], [0, 1.625, sign * 1.025], mats.teakWood);
    box(leaf, [0.12, 1.10, 1.60], [0, 0.82, sign * 1.025], mats.lightWood);
    box(leaf, [0.12, 1.35, 1.60], [0, 2.30, sign * 1.025], mats.lightWood);
    cylinder(leaf, 0.025, 0.025, 0.45, [0.08, 1.35, sign * 1.85], mats.brassMat, 8);
    cylinder(leaf, 0.025, 0.025, 0.45, [-0.08, 1.35, sign * 1.85], mats.brassMat, 8);
    dynamicG.add(leaf);
    return leaf;
  };
  mosqueState.leftLeaf = buildTeakDoorLeaf(163.9, 1);
  mosqueState.rightLeaf = buildTeakDoorLeaf(168.1, -1);
  mosqueState.leftLeaf.rotation.y = mosqueState.mainHallAngle;
  mosqueState.rightLeaf.rotation.y = -mosqueState.mainHallAngle;

  // EXTERIOR WHITE MODEL MOSQUE FACADE DETAILING (3rd Floor East + Vertical Pilasters + Jaali Screens + Teal Windows!)
  const h3 = Y_ROOF - Y2; // 5.00m
  box(staticG, [0.42, h3, D], [X_EAST - 0.21, Y2 + h3 * 0.5, MZ], mats.marbleWall);
  // Sculpted White Horizontal Cornice Bands wrapping the entire exterior
  for (const bandY of [Y1, Y2, Y_ROOF]) {
    box(staticG, [W + 0.5, 0.26, D + 0.5], [MX, bandY, MZ], mats.pureWhite);
  }
  // Tall White-on-Charcoal Laser-Cut Islamic Jaali Wing Screens framing the East Facade (signature White Model Mosque look!)
  for (const dz of [-9.4, 9.4]) {
    box(staticG, [0.22, upperH - 0.2, 3.2], [X_EAST + 0.12, upperMidY, MZ + dz], mats.jaali);
    box(staticG, [0.32, upperH + 0.1, 0.26], [X_EAST + 0.14, upperMidY, MZ + dz - 1.68], mats.pureWhite);
    box(staticG, [0.32, upperH + 0.1, 0.26], [X_EAST + 0.14, upperMidY, MZ + dz + 1.68], mats.pureWhite);
  }
  // Vertical Fluted White Exterior Pilasters along North, South & West Walls (matches sculpted white model!)
  for (const sideSign of [-1, 1]) {
    const wz = MZ + sideSign * (D * 0.5);
    for (const bx of [-9.5, -4.8, 0.0, 4.8, 9.5]) {
      box(staticG, [0.42, upperH + gH, 0.34], [MX + bx, (Y0 + Y_ROOF) * 0.5, wz + sideSign * 0.12], mats.pureWhite);
    }
    // Tall Recessed Teal-Glazed Pointed-Arch Windows along North & South Facades
    for (const bx of [-7.1, -2.4, 2.4, 7.1]) {
      addModelMosqueWindow(staticG, dynamicG, mats, MX + bx, Y1 + 0.90, wz + sideSign * 0.06, 2.2, 2.95, 0);
      addModelMosqueWindow(staticG, dynamicG, mats, MX + bx, Y2 + 0.95, wz + sideSign * 0.06, 2.2, 2.95, 0);
    }
  }
  // 3rd Floor East Facade Teal-Glazed Pointed-Arch Windows (3 grand arched bays!)
  for (const [wz, ww] of [[-5.0, 2.5], [0, 4.0], [5.0, 2.5]]) {
    addModelMosqueWindow(staticG, dynamicG, mats, X_EAST + 0.06, Y2 + 0.95, MZ + wz, ww, 3.1, Math.PI * 0.5);
  }
  // West Qibla Wall Projecting White Mihrab Exterior Bay + Flanking Jaali Screens
  box(staticG, [1.1, upperH + gH, 5.2], [X_WEST - 0.5, (Y0 + Y_ROOF) * 0.5, MZ], mats.pureWhite);
  for (const dz of [-6.8, 6.8]) {
    box(staticG, [0.22, upperH - 0.4, 2.6], [X_WEST - 0.08, upperMidY, MZ + dz], mats.jaali);
  }

  // SCULPTED RECESSED ARCHED MIHRAB (West Qibla Wall, x = 160.5, z = 166.0)
  box(staticG, [0.80, 4.2, 4.4], [X_WEST + 0.68, Y1 + 2.10, MZ], mats.pureWhite);
  box(staticG, [0.44, 3.7, 3.1], [X_WEST + 0.92, Y1 + 1.85, MZ], mats.tealAccent);
  addPointedArchSpandrel(staticG, { span: 3.1, height: 1.15, depth: 0.48, archRise: 0.82, pos: [X_WEST + 1.00, Y1 + 2.75, MZ], rotY: Math.PI * 0.5, mat: mats.pureWhite });
  for (const dz of [-1.56, 1.56]) {
    cylinder(staticG, 0.14, 0.17, 3.45, [X_WEST + 1.10, Y1 + 1.72, MZ + dz], mats.pureWhite, 14);
    cylinder(staticG, 0.19, 0.19, 0.14, [X_WEST + 1.10, Y1 + 3.45, MZ + dz], mats.brassMat, 14);
    cylinder(staticG, 0.20, 0.22, 0.16, [X_WEST + 1.10, Y1 + 0.08, MZ + dz], mats.brassMat, 14);
  }
  // Warm Glowing Mihrab Arch Cove Light
  box(dynamicG, [0.12, 0.09, 2.5], [X_WEST + 1.00, Y1 + 3.72, MZ], mats.chandelierGlow, { castShadow: false });

  // ORNATE 5-STEP CARVED TEAK MIMBAR (PULPIT) — Beside Mihrab (z = 162.2)
  const mimX = X_WEST + 1.85;
  const mimZ = MZ - 3.6;
  for (let s = 0; s < 5; s++) {
    box(staticG, [0.38, 0.28 * (s + 1), 1.18], [mimX + 1.38 - s * 0.36, Y1 + 0.14 * (s + 1), mimZ], mats.teakWood);
  }
  // Carved side stair railings on Mimbar
  rodBetween(staticG, [mimX + 1.55, Y1 + 0.95, mimZ - 0.58], [mimX - 0.02, Y1 + 2.15, mimZ - 0.58], 0.035, mats.lightWood, 8);
  rodBetween(staticG, [mimX + 1.55, Y1 + 0.95, mimZ + 0.58], [mimX - 0.02, Y1 + 2.15, mimZ + 0.58], 0.035, mats.lightWood, 8);
  box(staticG, [1.28, 1.55, 1.28], [mimX - 0.52, Y1 + 0.775, mimZ], mats.teakWood);
  for (const [cx, cz] of [[-1.08, -0.58], [-1.08, 0.58], [0.02, -0.58], [0.02, 0.58]]) {
    cylinder(staticG, 0.045, 0.05, 1.88, [mimX + cx, Y1 + 2.46, mimZ + cz], mats.teakWood, 8);
  }
  box(staticG, [1.42, 0.24, 1.42], [mimX - 0.52, Y1 + 3.44, mimZ], mats.teakWood);
  const mimDome = new THREE.Mesh(new THREE.SphereGeometry(0.56, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), mats.brassMat);
  mimDome.position.set(mimX - 0.52, Y1 + 3.56, mimZ);
  staticG.add(mimDome);

  // AUTHENTIC MOSQUE AZAAN & IMAM MICROPHONES + COMPACT WALL AMPLIFIER (NO UNRELATED ELECTRONICS!)
  // 1) Imam Standing Microphone right in front of the Mihrab
  addAzaanMicrophoneStand(staticG, mats, X_WEST + 1.85, Y1, MZ, Math.PI);
  // 2) Dedicated Azaan / Muazzin Standing Microphone right beside the Mihrab (z = 168.4)
  addAzaanMicrophoneStand(staticG, mats, X_WEST + 1.65, Y1, MZ + 2.45, Math.PI);
  // 3) Compact Wall-Mounted Mosque Azaan PA Amplifier Box (x = 160.52, z = 168.9)
  box(staticG, [0.22, 0.24, 0.44], [X_WEST + 0.52, Y1 + 1.38, MZ + 2.95], mats.speakerCabinet);
  box(staticG, [0.04, 0.18, 0.38], [X_WEST + 0.64, Y1 + 1.38, MZ + 2.95], mats.speakerGrille);
  // Glowing green power LED & red mic-live LED on the Azaan amplifier
  const ampLedG = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), mats.ledGreenGlow);
  ampLedG.position.set(X_WEST + 0.66, Y1 + 1.42, MZ + 2.82);
  const ampLedR = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), mats.ledRedGlow);
  ampLedR.position.set(X_WEST + 0.66, Y1 + 1.42, MZ + 2.88);
  dynamicG.add(ampLedG, ampLedR);

  // 6 COMPACT WALL-MOUNTED ECHO PA SOUND BOXES (4 CORNERS + 2 MID UPPER SIDE WALLS, SPACED FAR APART!)
  const spkY = Y1 + 3.45;
  addMosqueSoundBox(staticG, dynamicG, mats, X_WEST + 0.68, spkY, Z_NORTH + 0.72, Math.PI * 0.25);  // 1. NW Corner
  addMosqueSoundBox(staticG, dynamicG, mats, X_WEST + 0.68, spkY, Z_SOUTH - 0.72, Math.PI * 0.75);  // 2. SW Corner
  addMosqueSoundBox(staticG, dynamicG, mats, X_EAST - 0.68, spkY, Z_NORTH + 0.72, -Math.PI * 0.25); // 3. NE Corner
  addMosqueSoundBox(staticG, dynamicG, mats, X_EAST - 0.68, spkY, Z_SOUTH - 0.72, -Math.PI * 0.75); // 4. SE Corner
  addMosqueSoundBox(staticG, dynamicG, mats, MX, spkY, Z_NORTH + 0.60, 0);                           // 5. Mid North Upper Side Wall
  addMosqueSoundBox(staticG, dynamicG, mats, MX, spkY, Z_SOUTH - 0.60, Math.PI);                     // 6. Mid South Upper Side Wall

  // Wooden Quran Rehal Stands + Wall-Mounted Quran Shelves + Wall Clocks + Bengali Prayer Time Board
  for (const rz of [157.4, 159.4, 161.0, 170.2, 172.0, 173.8]) {
    box(staticG, [0.42, 0.28, 0.52], [X_WEST + 2.35, Y1 + 0.16, rz], mats.teakWood);
    box(staticG, [0.34, 0.045, 0.42], [X_WEST + 2.35, Y1 + 0.33, rz], bank.chalkLine);
  }
  // Wall-mounted wooden Quran racks along Qibla side bays
  for (const qz of [156.2, 171.6]) {
    box(staticG, [0.34, 0.92, 1.65], [X_WEST + 0.56, Y1 + 1.05, qz], mats.teakWood);
    for (let bi = 0; bi < 6; bi++) {
      box(staticG, [0.24, 0.30, 0.18], [X_WEST + 0.64, Y1 + 1.24, qz - 0.55 + bi * 0.22], bookColors[bi % bookColors.length]);
    }
  }
  // Digital Bengali Prayer Time Board + Classic Mosque Wall Clocks
  addMosqueSignPlaque(dynamicG, makePrayerTimeBoardTexture(), [X_WEST + 0.46, Y1 + 2.30, 158.6], Math.PI * 0.5, 1.48, 1.85, true, bank.emissiveList);
  const clockTex = makeClockFaceTexture();
  for (const cz of [155.8, 174.4]) {
    const clockMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 20), new THREE.MeshStandardMaterial({ map: clockTex, roughness: 0.35 }));
    clockMesh.rotation.z = Math.PI * 0.5;
    clockMesh.position.set(X_WEST + 0.46, Y1 + 3.15, cz);
    dynamicG.add(clockMesh);
  }

  // 8 Fluted White Marble Structural Columns with Brass Rings & Wall Sconces!
  const colCoords = [
    [MX - 5.2, MZ - 5.2], [MX - 5.2, MZ + 5.2],
    [MX + 4.8, MZ - 5.2], [MX + 4.8, MZ + 5.2],
    [MX - 5.2, MZ - 10.2], [MX - 5.2, MZ + 10.2],
    [MX + 4.8, MZ - 10.2], [MX + 4.8, MZ + 10.2],
  ];
  for (const [cx, cz] of colCoords) {
    cylinder(staticG, 0.32, 0.36, upperH, [cx, upperMidY, cz], mats.pureWhite, 16);
    cylinder(staticG, 0.44, 0.46, 0.18, [cx, Y1 + 0.09, cz], mats.brassMat, 16);
    cylinder(staticG, 0.44, 0.44, 0.18, [cx, Y2 - 0.16, cz], mats.brassMat, 16);
    cylinder(staticG, 0.44, 0.44, 0.18, [cx, Y_ROOF - 0.18, cz], mats.brassMat, 16);
    // Warm glowing brass sconce lantern mounted on each column!
    addWallSconce(staticG, dynamicG, mats, cx + 0.34, Y1 + 2.55, cz, 1, 0);
  }

  // 8 SPINNING CEILING FANS + 14 WARM RECESSED CEILING DOWNLIGHTS IN 2ND FLOOR PRAYER HALL!
  const hallFans = [
    [MX - 7.4, MZ - 7.8, 7.1], [MX - 2.2, MZ - 7.8, 7.6], [MX + 3.0, MZ - 7.8, 7.3], [MX + 7.6, MZ - 7.8, 7.9],
    [MX - 7.4, MZ + 7.8, 7.4], [MX - 2.2, MZ + 7.8, 7.0], [MX + 3.0, MZ + 7.8, 7.7], [MX + 7.6, MZ + 7.8, 7.2],
  ];
  for (const [fx, fz, spd] of hallFans) {
    addSpinningCeilingFan(staticG, dynamicG, mats, fx, Y2 - 0.16, fz, spd);
  }
  for (const lx of [MX - 8.2, MX - 4.0, MX, MX + 4.0, MX + 8.0]) {
    addCeilingDownlight(staticG, dynamicG, mats, lx, Y2 - 0.15, MZ - 9.2, 0.28);
    addCeilingDownlight(staticG, dynamicG, mats, lx, Y2 - 0.15, MZ + 9.2, 0.28);
  }
  for (const lz of [MZ - 3.0, MZ + 3.0]) {
    addCeilingDownlight(staticG, dynamicG, mats, MX - 8.0, Y2 - 0.15, lz, 0.28);
    addCeilingDownlight(staticG, dynamicG, mats, MX + 8.0, Y2 - 0.15, lz, 0.28);
  }

  // 2 Matching Side Chandeliers in North & South Prayer Hall Bays!
  addOrnateChandelier(staticG, dynamicG, mats, MX + 0.4, Y2 - 0.16, MZ - 7.8, 0.65, 1.35);
  addOrnateChandelier(staticG, dynamicG, mats, MX + 0.4, Y2 - 0.16, MZ + 7.8, 0.65, 1.35);

  /* --------------------------------------------------------------------------
   * 6. 3RD FLOOR UPPER PRAYER GALLERY (y = 8.40m) + GRAND CENTRAL CHANDELIER
   * ------------------------------------------------------------------------ */
  box(staticG, [W, 0.26, 7.0], [MX, Y2 - 0.13, 157.5], mats.pureWhite);
  box(staticG, [6.0, 0.26, 12.4], [163.0, Y2 - 0.13, 167.2], mats.pureWhite);
  box(staticG, [6.0, 0.26, 17.0], [179.0, Y2 - 0.13, 169.5], mats.pureWhite);
  box(staticG, [7.0, 0.26, 7.0], [172.5, Y2 - 0.13, 174.5], mats.pureWhite);
  box(staticG, [3.0, 0.26, 2.4], [167.5, Y2 - 0.13, 172.2], mats.pureWhite);

  // Prayer carpets on 3rd Floor Gallery
  box(staticG, [W - 1.0, 0.03, 6.2], [MX, Y2 + 0.015, 157.6], mats.carpet, { castShadow: false });
  box(staticG, [5.2, 0.03, 11.8], [163.1, Y2 + 0.015, 167.1], mats.carpet, { castShadow: false });
  box(staticG, [5.2, 0.03, 16.0], [178.9, Y2 + 0.015, 169.4], mats.carpet, { castShadow: false });
  box(staticG, [6.6, 0.03, 6.2], [172.5, Y2 + 0.015, 174.4], mats.carpet, { castShadow: false });

  // Safe Marble & Brass Atrium Balustrades around Central Dome Opening (x = 166..176, z = 161..171)
  box(staticG, [10.2, 0.96, 0.20], [MX, Y2 + 0.48, 161.0], mats.pureWhite);
  box(staticG, [10.2, 0.96, 0.20], [MX, Y2 + 0.48, 171.0], mats.pureWhite);
  box(staticG, [0.20, 0.96, 10.2], [166.0, Y2 + 0.48, MZ], mats.pureWhite);
  box(staticG, [0.20, 0.96, 10.2], [176.0, Y2 + 0.48, MZ], mats.pureWhite);
  box(staticG, [10.3, 0.07, 0.24], [MX, Y2 + 0.98, 161.0], mats.brassMat);
  box(staticG, [10.3, 0.07, 0.24], [MX, Y2 + 0.98, 171.0], mats.brassMat);
  box(staticG, [0.24, 0.07, 10.3], [166.0, Y2 + 0.98, MZ], mats.brassMat);
  box(staticG, [0.24, 0.07, 10.3], [176.0, Y2 + 0.98, MZ], mats.brassMat);

  // 6 Spinning Ceiling Fans + 10 Recessed Ceiling Downlights on 3rd Floor Upper Gallery!
  for (const [fx, fz, spd] of [
    [MX - 5.5, 157.6, 7.2], [MX + 5.5, 157.6, 7.7],
    [163.0, MZ, 7.4], [179.0, MZ, 7.1],
    [MX + 2.5, 174.4, 7.6], [MX + 7.5, 174.4, 7.3],
  ]) {
    addSpinningCeilingFan(staticG, dynamicG, mats, fx, Y_ROOF - 0.16, fz, spd);
  }
  for (const [lx, lz] of [
    [MX - 7.5, 157.5], [MX, 157.5], [MX + 7.5, 157.5],
    [163.0, 163.0], [163.0, 169.0], [179.0, 163.0], [179.0, 169.0],
    [MX + 1.5, 174.5], [MX + 7.5, 174.5],
  ]) {
    addCeilingDownlight(staticG, dynamicG, mats, lx, Y_ROOF - 0.15, lz, 0.30);
  }

  // GRAND 4-TIER BRASS & CRYSTAL CHANDELIER SUSPENDED UNDER THE CENTRAL DOME!
  addOrnateChandelier(staticG, dynamicG, mats, MX, Y_ROOF - 0.12, MZ, 1.08, 5.2);

  // REAL WARM INTERIOR POINT LIGHTS (keep pl.visible=true permanently and modulate intensity=0 outside so Three.js NEVER recompiles shaders!)
  const hallChandelierLight = new THREE.PointLight(0xffe7b3, 0, 28, 1.4);
  hallChandelierLight.position.set(MX, Y2 + 0.4, MZ);
  const mihrabWarmLight = new THREE.PointLight(0xffe0a0, 0, 16, 1.5);
  mihrabWarmLight.position.set(X_WEST + 2.5, Y1 + 2.8, MZ);
  const groundFoyerLight = new THREE.PointLight(0xfff0cc, 0, 18, 1.5);
  groundFoyerLight.position.set(174.0, Y1 - 0.6, 166.0);
  dynamicG.add(hallChandelierLight, mihrabWarmLight, groundFoyerLight);
  mosqueState.pointLights.push(
    { light: hallChandelierLight, day: 1.5, night: 4.8 },
    { light: mihrabWarmLight, day: 1.1, night: 3.4 },
    { light: groundFoyerLight, day: 1.0, night: 3.2 },
  );

  /* --------------------------------------------------------------------------
   * 7. PURE WHITE ROOF PARAPET, 4 SCULPTED RIBBED DOMES & 33m WHITE JAALI MINARET
   * ------------------------------------------------------------------------ */
  box(staticG, [W + 0.8, 0.42, D + 0.8], [MX, Y_ROOF + 0.21, MZ], mats.pureWhite);
  box(staticG, [W + 1.15, 0.22, D + 1.15], [MX, Y_ROOF + 0.48, MZ], mats.tealAccent);
  box(staticG, [W + 1.20, 0.08, D + 1.20], [MX, Y_ROOF + 0.62, MZ], mats.brassMat);
  // Sculpted White Roof Parapet with ornamental stepped battlements (merlons) & warm roof cornice glow
  box(staticG, [W + 0.6, 1.10, 0.28], [MX, Y_ROOF + 1.00, Z_NORTH], mats.pureWhite);
  box(staticG, [W + 0.6, 1.10, 0.28], [MX, Y_ROOF + 1.00, Z_SOUTH], mats.pureWhite);
  box(staticG, [0.28, 1.10, D + 0.6], [X_WEST, Y_ROOF + 1.00, MZ], mats.pureWhite);
  box(staticG, [0.28, 1.10, D + 0.6], [X_EAST, Y_ROOF + 1.00, MZ], mats.pureWhite);
  // Decorative Islamic stepped parapet merlons along East, North & South roof edges
  for (let mz = Z_NORTH + 1.2; mz <= Z_SOUTH - 1.2; mz += 1.6) {
    box(staticG, [0.32, 0.36, 0.72], [X_EAST, Y_ROOF + 1.70, mz], mats.pureWhite);
    box(staticG, [0.34, 0.16, 0.36], [X_EAST, Y_ROOF + 1.94, mz], mats.pureWhite);
  }
  for (let mx = X_WEST + 1.4; mx <= X_EAST - 1.4; mx += 1.8) {
    box(staticG, [0.76, 0.34, 0.32], [mx, Y_ROOF + 1.70, Z_NORTH], mats.pureWhite);
    box(staticG, [0.76, 0.34, 0.32], [mx, Y_ROOF + 1.70, Z_SOUTH], mats.pureWhite);
  }
  // Subtle warm architectural roofline night-glow strip along East facade
  box(dynamicG, [0.12, 0.10, D + 0.4], [X_EAST + 0.42, Y_ROOF + 0.32, MZ], mats.exteriorGlowMat, { castShadow: false });

  // Grand Sculpted Rooftop Corner Pinnacles (Guldastas) with Brass Crescent Finials
  for (const [px, pz] of [[X_WEST, Z_NORTH], [X_WEST, Z_SOUTH], [X_EAST, Z_NORTH], [X_EAST, Z_SOUTH]]) {
    box(staticG, [0.84, 2.05, 0.84], [px, Y_ROOF + 1.28, pz], mats.pureWhite);
    box(staticG, [0.92, 0.14, 0.92], [px, Y_ROOF + 2.28, pz], mats.tealAccent);
    const pinDome = new THREE.Mesh(new THREE.SphereGeometry(0.46, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mats.marbleDome);
    pinDome.position.set(px, Y_ROOF + 2.34, pz);
    staticG.add(pinDome);
    cylinder(staticG, 0.025, 0.038, 0.75, [px, Y_ROOF + 3.08, pz], mats.brassMat, 6);
    const pinCrescent = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 6, 14, Math.PI * 1.35), mats.brassMat);
    pinCrescent.position.set(px, Y_ROOF + 3.50, pz);
    pinCrescent.rotation.z = -Math.PI * 0.22;
    staticG.add(pinCrescent);
  }

  const addWhiteRibbedDome = (dx, dz, radius, drumH, withDrumWindows = false) => {
    const baseY = Y_ROOF + 0.42;
    // Octagonal stepped marble base plinth under the dome drum
    cylinder(staticG, radius * 1.12, radius * 1.16, 0.48, [dx, baseY + 0.24, dz], mats.pureWhite, 8);
    cylinder(staticG, radius * 1.02, radius * 1.06, drumH, [dx, baseY + drumH * 0.5 + 0.24, dz], mats.pureWhite, 28);
    cylinder(staticG, radius * 1.08, radius * 1.08, 0.22, [dx, baseY + drumH + 0.24, dz], mats.tealAccent, 28);
    cylinder(staticG, radius * 1.10, radius * 1.10, 0.10, [dx, baseY + drumH + 0.38, dz], mats.brassMat, 28);
    if (withDrumWindows) {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const w = box(dynamicG, [0.12, drumH * 0.58, 0.68], [dx + Math.cos(a) * (radius * 1.04), baseY + drumH * 0.5 + 0.24, dz + Math.sin(a) * (radius * 1.04)], mats.exteriorGlowMat, { castShadow: false });
        w.rotation.y = -a;
      }
    }
    const domeY = baseY + drumH + 0.32;
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.52),
      mats.marbleDome
    );
    dome.position.set(dx, domeY, dz);
    dome.castShadow = true;
    dome.receiveShadow = true;
    staticG.add(dome);

    // 12 Sculpted Architectural Dome Ribs curving cleanly up to the brass lotus finial!
    const ribCount = radius >= 4.0 ? 12 : 8;
    for (let r = 0; r < ribCount; r++) {
      const ang = (r / ribCount) * Math.PI * 2;
      const rib = new THREE.Mesh(
        new THREE.TorusGeometry(radius + 0.04, radius >= 4.0 ? 0.075 : 0.045, 6, 18, Math.PI * 0.48),
        mats.pureWhite
      );
      rib.position.set(dx, domeY, dz);
      rib.rotation.y = ang;
      staticG.add(rib);
    }

    // Lotus cap + 3-orb Brass Finial + Iconic Golden Crescent (Hilal)
    const topY = domeY + radius;
    cylinder(staticG, radius * 0.14, radius * 0.22, 0.24, [dx, topY - 0.04, dz], mats.brassMat, 14);
    cylinder(staticG, 0.055, 0.088, 2.35, [dx, topY + 1.12, dz], mats.brassMat, 10);
    for (const [oy, or] of [[0.45, 0.28], [0.98, 0.20], [1.42, 0.14]]) {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(or, 12, 8), mats.brassMat);
      orb.position.set(dx, topY + oy, dz);
      staticG.add(orb);
    }
    const crescent = new THREE.Mesh(
      new THREE.TorusGeometry(radius >= 4.0 ? 0.48 : 0.28, radius >= 4.0 ? 0.06 : 0.04, 8, 18, Math.PI * 1.4),
      mats.brassMat
    );
    crescent.position.set(dx, topY + 2.42, dz);
    crescent.rotation.z = -Math.PI * 0.22;
    staticG.add(crescent);
  };

  // 1 Grand Central Pure-White Ribbed Dome + 3 Front Pure-White Ribbed Domes
  addWhiteRibbedDome(MX, MZ, 5.6, 1.65, true);
  addWhiteRibbedDome(X_EAST - 3.0, MZ - 7.4, 2.30, 0.88, false);
  addWhiteRibbedDome(X_EAST - 3.0, MZ, 2.60, 0.98, false);
  addWhiteRibbedDome(X_EAST - 3.0, MZ + 7.4, 2.30, 0.88, false);

  // TALL 33m PURE-WHITE SQUARE JAALI MINARET (North-East Plaza x = 185.0, z = 150.2 — clear of all doors!)
  const minX = 185.0;
  const minZ = 150.2;
  const minH = 32.0;
  box(staticG, [4.2, 0.85, 4.2], [minX, 0.425, minZ], mats.granite);
  box(staticG, [3.5, minH, 3.5], [minX, minH * 0.5 + 0.4, minZ], mats.jaali);
  for (const sx of [-1.62, 1.62]) {
    for (const sz of [-1.62, 1.62]) {
      box(staticG, [0.38, minH + 0.6, 0.38], [minX + sx, minH * 0.5 + 0.4, minZ + sz], mats.pureWhite);
    }
  }
  for (const balY of [13.5, 22.5, minH - 2.6]) {
    box(staticG, [4.5, 0.34, 4.5], [minX, balY, minZ], mats.pureWhite);
    box(staticG, [4.56, 0.14, 4.56], [minX, balY + 0.22, minZ], mats.tealAccent);
    box(staticG, [4.35, 0.88, 0.16], [minX, balY + 0.62, minZ - 2.12], mats.pureWhite);
    box(staticG, [4.35, 0.88, 0.16], [minX, balY + 0.62, minZ + 2.12], mats.pureWhite);
    box(staticG, [0.16, 0.88, 4.35], [minX - 2.12, balY + 0.62, minZ], mats.pureWhite);
    box(staticG, [0.16, 0.88, 4.35], [minX + 2.12, balY + 0.62, minZ], mats.pureWhite);
    // Glowing balcony ring strip that lights up the minaret at night!
    box(dynamicG, [4.42, 0.10, 4.42], [minX, balY - 0.14, minZ], mats.exteriorGlowMat, { castShadow: false });
  }
  box(staticG, [3.7, 0.85, 3.7], [minX, minH + 0.85, minZ], mats.pureWhite);
  const minDome = new THREE.Mesh(new THREE.SphereGeometry(1.62, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), mats.marbleDome);
  minDome.position.set(minX, minH + 1.25, minZ);
  staticG.add(minDome);
  cylinder(staticG, 0.055, 0.085, 2.4, [minX, minH + 3.75, minZ], mats.brassMat, 10);
  const minCrescent = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 8, 16, Math.PI * 1.4), mats.brassMat);
  minCrescent.position.set(minX, minH + 5.10, minZ);
  minCrescent.rotation.z = -Math.PI * 0.22;
  staticG.add(minCrescent);

  // Clean Bengali & English Facade Plaque: ONLY "খুলনা জেলা মডেল মসজিদ" (ZERO Arabic, ZERO Cultural Center!)
  addMosqueSignPlaque(
    dynamicG,
    makeMosquePlaqueTexture(),
    [X_EAST + 0.36, Y2 + 0.34, MZ],
    Math.PI * 0.5,
    9.2,
    1.34,
    true,
    bank.emissiveList
  );

  // 6 Courtyard Lamp Posts & Landscaping Planters
  for (const [lx, lz] of [[194.2, 159.5], [194.2, 172.5], [188.2, 152.5], [188.2, 179.5], [176.0, 151.5], [176.0, 180.5]]) {
    addCourtyardLamp(staticG, dynamicG, mats, lx, lz, 4.6, 0.08);
  }
  for (const [px, pz] of [[193.6, 156.5], [193.6, 175.5], [180.0, 152.0], [180.0, 180.0]]) {
    box(staticG, [1.8, 0.45, 1.8], [px, 0.28, pz], mats.pureWhite);
    box(staticG, [1.4, 0.55, 1.4], [px, 0.65, pz], mats.moss);
  }
}

/* ============================================================================
 * WALKABLE MULTI-FLOOR PHYSICS, COLLISIONS, INTERACTIVE DOORS, FANS & NIGHT GLOW
 * ========================================================================== */

const MOSQUE_AAA_SCALE = 34.0 / 34.5;
const MOSQUE_BASE_Y = 0.16;

function worldToMosqueLocal(wx, wz) {
  return {
    bx: (166.0 - wz) / MOSQUE_AAA_SCALE,
    by: (175.0 - wx) / MOSQUE_AAA_SCALE - 0.5,
  };
}

function mosqueLocalToWorld(bx, by) {
  return {
    wx: 175.0 - (by + 0.5) * MOSQUE_AAA_SCALE,
    wz: 166.0 - bx * MOSQUE_AAA_SCALE,
  };
}

export function getModelMosqueGroundHeight(pos, grounded = true, verticalVelocity = 0) {
  if (!pos) return 0.0;
  if (pos.x < 156.0 || pos.x > 199.0 || pos.z < 146.0 || pos.z > 186.0) {
    return 0.0;
  }

  const { bx, by } = worldToMosqueLocal(pos.x, pos.z);
  const footY = pos.y - 1.68;
  const maxStepUp = grounded ? 0.72 : (verticalVelocity > 0 ? 0.08 : 0.45);
  const S = MOSQUE_AAA_SCALE;
  const Y_GROUND = MOSQUE_BASE_Y + 0.20 * S;       // ~0.36m (dry above water, flush with paver & ground marble!)
  const Y_MID_LANDING = MOSQUE_BASE_Y + 2.28 * S;  // ~2.41m
  const Y_TERRACE = MOSQUE_BASE_Y + 4.18 * S;      // ~4.28m (White Marble Terrace!)
  const Y_FLOOR2 = MOSQUE_BASE_Y + 4.22 * S;       // ~4.32m (2nd Floor Prayer Saf Carpet!)
  const Y_FLOOR3 = MOSQUE_BASE_Y + 9.65 * S;       // ~9.67m (3rd Floor Mezzanine Carpet!)

  let bestH = Y_GROUND;
  const tryFloor = (h) => {
    if (h <= footY + maxStepUp && h > bestH) bestH = h;
  };

  // 1) Front Lower Wide White Marble Staircase (bx = -5.6..+5.6, step nosings from by = -15.06 to -10.33)
  if (bx >= -5.75 && bx <= 5.75 && by >= -15.15 && by <= -9.55) {
    const t = THREE.MathUtils.clamp((by - (-15.06)) / (-10.33 - (-15.06)), 0, 1);
    const zStep = 0.371 + t * (2.28 - 0.371) + 0.04;
    tryFloor(MOSQUE_BASE_Y + zStep * S);
  }
  // Mid-stair landing (bx = -5.6..+5.6, by = -10.33..-6.3)
  if (bx >= -5.75 && bx <= 5.75 && by >= -10.33 && by <= -6.3) {
    tryFloor(Y_MID_LANDING + 0.02);
  }
  // 2) Front Upper Twin Stair Flights flanking central green grass planter (step nosings from by = -9.65 to -5.92)
  if (((bx >= -5.65 && bx <= -1.6) || (bx >= 1.6 && bx <= 5.65)) && by >= -9.65 && by <= -4.9) {
    const t = THREE.MathUtils.clamp((by - (-9.65)) / (-5.92 - (-9.65)), 0, 1);
    const zStep = 2.482 + t * (4.18 - 2.482) + 0.04;
    tryFloor(MOSQUE_BASE_Y + zStep * S);
  }

  // 3) Elevated White Marble Terrace Deck (bx = -15.5..+15.5, by = -13.1..-1.2, excluding central stair cutout)
  const inTerrace = bx >= -15.6 && bx <= 15.6 && by >= -13.1 && by <= -1.2;
  const inStairCutout = bx >= -5.6 && bx <= 5.6 && by >= -13.1 && by <= -5.0;
  if (inTerrace && !inStairCutout) {
    tryFloor(Y_TERRACE);
  }

  // 4) Inside Main Mosque Building (bx = -11.4..+11.4, by = -1.5..+13.4)
  const inMain = bx >= -11.4 && bx <= 11.4 && by >= -1.5 && by <= 13.4;
  if (inMain) {
    // Interior Stair Flight 1: Ground -> 2nd Floor (bx = -10.7..-8.9, by = 9.0..12.8)
    if (bx >= -10.7 && bx <= -8.9 && by >= 9.0 && by <= 12.8) {
      const t = THREE.MathUtils.clamp((by - 9.2) / (12.6 - 9.2), 0, 1);
      tryFloor(Y_GROUND + t * (Y_FLOOR2 - Y_GROUND));
    }
    // Interior Stair Flight 2: 2nd Floor -> 3rd Floor Gallery (bx = -8.9..-7.2, by = 9.0..12.8)
    if (bx >= -8.9 && bx <= -7.2 && by >= 9.0 && by <= 12.8) {
      const t = THREE.MathUtils.clamp((12.6 - by) / (12.6 - 9.2), 0, 1);
      tryFloor(Y_FLOOR2 + t * (Y_FLOOR3 - Y_FLOOR2));
    }
    // 2nd Floor Grand Main Prayer Hall (excluding stairwell cutout bx = -10.7..-7.2, by = 9.0..12.8)
    const inStairwell = bx >= -10.7 && bx <= -7.2 && by >= 9.0 && by <= 12.8;
    if (!inStairwell) {
      tryFloor(Y_FLOOR2);
    }
    // 3rd Floor Mezzanine Gallery (excluding open central dome atrium bx = -4.6..+4.6, by = 1.8..10.4 & stairwell)
    const inAtrium = bx >= -4.6 && bx <= 4.6 && by >= 1.8 && by <= 10.4;
    if (!inAtrium && !inStairwell) {
      tryFloor(Y_FLOOR3);
    }
  }

  return bestH;
}

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

function resolveLocalBox(pos, radius, bxMin, bxMax, byMin, byMax) {
  // Convert local Blender AABB to World AABB cleanly (note axis flip: bx -> -Z, by -> -X)
  const w0 = mosqueLocalToWorld(bxMax, byMax);
  const w1 = mosqueLocalToWorld(bxMin, byMin);
  resolveCircleAABB(pos, radius, Math.min(w0.wx, w1.wx), Math.max(w0.wx, w1.wx), Math.min(w0.wz, w1.wz), Math.max(w0.wz, w1.wz));
}

export function applyModelMosqueCollisions(pos, radius = 0.34, footY = 0) {
  if (!pos) return;
  if (pos.x < 156.0 || pos.x > 199.0 || pos.z < 146.0 || pos.z > 186.0) {
    return;
  }

  // 1) Ground Level Podium Rooms & Minaret Shaft (footY < 3.6m)
  if (footY < 3.6) {
    // Left ground podium block (bx = -15.5..-5.6, by = -13.0..-1.5)
    resolveLocalBox(pos, radius, -15.5, -5.6, -13.0, -1.5);
    // Right ground closed room (bx = 10.5..15.5, by = -13.0..-1.5)
    resolveLocalBox(pos, radius, 10.5, 15.5, -13.0, -1.5);
    // Central green grass planter box in middle of stairs
    resolveLocalBox(pos, radius, -1.55, 1.55, -9.4, -6.1);
  }

  // Minaret shaft (bx = 9.7..13.9, by = -5.7..-1.5, all heights)
  resolveLocalBox(pos, radius, 9.7, 13.9, -5.7, -1.5);

  // 2) Elevated Terrace Railings (when on terrace footY >= 3.5 && footY < 7.5)
  if (footY >= 3.5 && footY < 7.5) {
    resolveLocalBox(pos, radius, -15.6, -5.7, -13.1, -12.7); // Front-left terrace rail
    resolveLocalBox(pos, radius,   5.7, 15.6, -13.1, -12.7); // Front-right terrace rail
    resolveLocalBox(pos, radius, -15.6, -15.2, -13.1, -1.5); // Outer-left terrace rail
    resolveLocalBox(pos, radius,  15.2,  15.6, -13.1, -1.5); // Outer-right terrace rail
    // Central grass planter cutout guard
    resolveLocalBox(pos, radius, -1.55, 1.55, -9.4, -5.0);
  }

  // 3) Main Hollow Mosque Perimeter Walls (by = -1.5, +13.5, bx = -11.5, +11.5) with OPEN DOORWAYS!
  if (footY < 16.5) {
    const onFloor2 = footY >= 3.5 && footY < 8.0;
    const onGround = footY < 3.5;

    // Front Wall (by = -1.78 .. -1.22): OPEN at Center Portal (-1.6..+1.6) & Flanking Doors (±5.6) on 2nd Floor!
    if (onFloor2) {
      resolveLocalBox(pos, radius, -11.6, -6.55, -1.80, -1.20);
      resolveLocalBox(pos, radius, -4.65, -1.65, -1.80, -1.20);
      resolveLocalBox(pos, radius,  1.65,  4.65, -1.80, -1.20);
      resolveLocalBox(pos, radius,  6.55, 11.60, -1.80, -1.20);
    } else {
      resolveLocalBox(pos, radius, -11.6, 11.6, -1.80, -1.20);
    }

    // Back / Qibla Wall (by = 13.22 .. 13.78): OPEN at Back Ground Door (bx = 8.75..10.45) on Ground Floor!
    if (onGround) {
      resolveLocalBox(pos, radius, -11.6, 8.70, 13.20, 13.80);
      resolveLocalBox(pos, radius, 10.50, 11.6, 13.20, 13.80);
    } else {
      resolveLocalBox(pos, radius, -11.6, 11.6, 13.20, 13.80);
    }

    // Left Wall (bx = -11.78 .. -11.22)
    resolveLocalBox(pos, radius, -11.80, -11.20, -1.5, 13.5);

    // Right Wall (bx = 11.22 .. 11.78): OPEN at 2 Ground Doors (by = 4.15..5.45 & 8.55..9.85) on Ground Floor!
    if (onGround) {
      resolveLocalBox(pos, radius, 11.20, 11.80, -1.5, 4.10);
      resolveLocalBox(pos, radius, 11.20, 11.80, 5.50, 8.50);
      resolveLocalBox(pos, radius, 11.20, 11.80, 9.90, 13.5);
    } else {
      resolveLocalBox(pos, radius, 11.20, 11.80, -1.5, 13.5);
    }

    // Interior Structural Columns (8 fluted marble columns)
    for (const [cx, cy] of [[-5.0, 1.5], [5.0, 1.5], [-5.0, 6.2], [5.0, 6.2], [-5.0, 10.6], [5.0, 10.6], [-9.2, 6.2], [9.2, 6.2]]) {
      resolveLocalBox(pos, radius, cx - 0.38, cx + 0.38, cy - 0.38, cy + 0.38);
    }

    // 3rd Floor Mezzanine Atrium Railings (prevent accidentally walking off the balcony!)
    if (footY >= 8.8) {
      resolveLocalBox(pos, radius, -4.65,  4.65,  1.65,  1.95);
      resolveLocalBox(pos, radius, -4.65,  4.65, 10.25, 10.55);
      resolveLocalBox(pos, radius, -4.75, -4.45,  1.80, 10.40);
      resolveLocalBox(pos, radius,  4.45,  4.75,  1.80, 10.40);
    }
  }
}

export function isInsideModelMosque(pos) {
  if (!pos) return false;
  return pos.x >= X_WEST && pos.x <= X_EAST && pos.z >= Z_NORTH && pos.z <= Z_SOUTH && pos.y - 1.68 < Y_ROOF;
}

export function isInModelMosqueZone(pos) {
  if (!pos) return false;
  const inMainOrVeranda = pos.x >= X_WEST - 0.3 && pos.x <= X_VERANDA + 0.3 && pos.z >= Z_NORTH - 0.3 && pos.z <= Z_SOUTH + 0.3;
  const onFrontStairs = pos.x >= FRONT_STAIR_X0 - 0.2 && pos.x <= FRONT_STAIR_X1 + 0.4 && pos.z >= FRONT_STAIR_Z0 - 0.5 && pos.z <= FRONT_STAIR_Z1 + 0.5;
  return inMainOrVeranda || onFrontStairs;
}

export function getModelMosqueZoneName(x, z, footY = 0) {
  if (x < X_WEST - 1.5 || x > FRONT_STAIR_X1 + 2.0 || z < Z_NORTH - 2.0 || z > Z_SOUTH + 2.0) {
    return null;
  }
  if (footY >= Y2 - 0.6) {
    return 'KHULNA DISTRICT MODEL MOSQUE · 3RD FLOOR UPPER PRAYER GALLERY';
  }
  if (footY >= Y1 - 0.6) {
    if (x > X_EAST) return 'KHULNA DISTRICT MODEL MOSQUE · 2ND FLOOR MARBLE VERANDA';
    return 'KHULNA DISTRICT MODEL MOSQUE · 2ND FLOOR MAIN PRAYER HALL';
  }
  if (x >= 160.0 && x <= 174.5 && z >= 154.0 && z <= 163.8) {
    return 'KHULNA DISTRICT MODEL MOSQUE · QURAN & HIFZ ROOM';
  }
  if (x >= 169.4 && x <= 176.2 && z >= 167.8 && z <= 178.0) {
    return 'KHULNA DISTRICT MODEL MOSQUE · OZU KHANA';
  }
  if (x >= X_WEST && x <= X_EAST && z >= Z_NORTH && z <= Z_SOUTH) {
    return 'KHULNA DISTRICT MODEL MOSQUE · GROUND FOYER';
  }
  return 'KHULNA DISTRICT MODEL MOSQUE · COURTYARD PLAZA';
}

export function getModelMosquePrompt(pos) {
  if (!pos) return null;
  const footY = pos.y - 1.68;
  if (Math.abs(footY - Y1) < 1.2 && Math.hypot(pos.x - X_EAST, pos.z - MZ) < 3.6) {
    return mosqueState.mainHallOpen
      ? '[E] Close Model Mosque Main Door'
      : '[E] Open Model Mosque Main Door';
  }
  return null;
}

export function toggleModelMosqueDoor(pos) {
  if (!pos) return false;
  const footY = pos.y - 1.68;
  if (Math.abs(footY - Y1) < 1.2 && Math.hypot(pos.x - X_EAST, pos.z - MZ) < 3.8) {
    mosqueState.mainHallOpen = !mosqueState.mainHallOpen;
    return true;
  }
  return false;
}

export function setModelMosqueNightFactor(nightFactor = 0) {
  const nf = THREE.MathUtils.clamp(nightFactor, 0, 1);
  mosqueState.nightFactor = nf;
  for (let i = 0; i < mosqueState.pointLights.length; i++) {
    const item = mosqueState.pointLights[i];
    item.light.intensity = item.day + (item.night - item.day) * nf;
  }
}

export function updateModelMosque(dt = 0.016, playerPos = null) {
  // Smooth door swing
  const target = mosqueState.mainHallOpen ? Math.PI * 0.48 : 0.0;
  if (Math.abs(mosqueState.mainHallAngle - target) > 0.002) {
    mosqueState.mainHallAngle += (target - mosqueState.mainHallAngle) * Math.min(1, dt * 6.0);
    if (mosqueState.leftLeaf) mosqueState.leftLeaf.rotation.y = mosqueState.mainHallAngle;
    if (mosqueState.rightLeaf) mosqueState.rightLeaf.rotation.y = -mosqueState.mainHallAngle;
  }

  // Distance check so fans stay active nearby and point lights modulate intensity without toggling visible (prevents WebGL shader recompilation freeze!)
  const nearMosque = !playerPos || ((playerPos.x - MX) ** 2 + (playerPos.z - MZ) ** 2 < 65 * 65);
  const insideMosque = Boolean(playerPos && isInsideModelMosque(playerPos));
  const nf = mosqueState.nightFactor || 0;
  for (let i = 0; i < mosqueState.pointLights.length; i++) {
    const item = mosqueState.pointLights[i];
    const wantIntensity = insideMosque ? (item.day + (item.night - item.day) * nf) : 0;
    if (item.light.intensity !== wantIntensity) item.light.intensity = wantIntensity;
  }

  // Smooth spinning ceiling fans across all 3 floors!
  if (nearMosque) {
    for (let i = 0; i < mosqueState.fans.length; i++) {
      const fan = mosqueState.fans[i];
      fan.rotation.y += dt * (fan.userData.spinSpeed || 7.4);
    }
  }
}

export function findNearestModelMosqueSeat(pos) {
  if (!pos) return null;
  const footY = pos.y - 1.68;
  if (Math.abs(footY - Y0) > 1.0) return null;
  if (pos.x < 161.0 || pos.x > 175.0 || pos.z < 155.0 || pos.z > 177.5) return null;

  const seats = [];
  for (const tx of [164.6, 170.2]) {
    for (const cxOff of [-0.72, 0.72]) {
      seats.push(
        { seatX: tx + cxOff, seatZ: 158.56, seatY: 0.46, yaw: 0, fy: Y0, label: 'Quran Study Chair' },
        { seatX: tx + cxOff, seatZ: 160.24, seatY: 0.46, yaw: Math.PI, fy: Y0, label: 'Quran Study Chair' },
      );
    }
  }
  for (let i = 0; i < 6; i++) {
    const tz = 169.0 + i * 1.38;
    seats.push(
      { seatX: 171.25, seatZ: tz, seatY: 0.44, yaw: -Math.PI * 0.5, fy: Y0, label: 'Ozu Khana Bench' },
      { seatX: 173.15, seatZ: tz, seatY: 0.44, yaw: Math.PI * 0.5, fy: Y0, label: 'Ozu Khana Bench' },
    );
  }

  let best = null;
  let bestDist = 1.45;
  for (const s of seats) {
    const d = Math.hypot(pos.x - s.seatX, pos.z - s.seatZ);
    if (d < bestDist) {
      bestDist = d;
      best = { ...s, dist: d };
    }
  }
  return best;
}
