import * as THREE from 'three';
import { attachDerivedPBRMaps } from './aaa-shaders.js';

/**
 * KHULNA CIRCUIT HOUSE (খুলনা সার্কিট হাউস) — PHOTOREALISTIC AAA 3D MODEL
 *
 * Rebuilt with micro-detailed 1024x1024 PBR textures (Sobel normal + roughness maps),
 * true 3D brick masonry relief, and accurate LEFT-SIDE entrance road layout:
 *  - Main Gate on K.D. Ghos Rd (Z = +18.2):
 *      * Modernist slanted cantilevered concrete canopy (sloping high on left, lower on right)
 *        with recessed dark fascia, soffit border ribs & recessed circular LED downlight housings
 *      * 4 cylindrical concrete columns with base collars
 *      * Left exposed red-brick monument wall with physically recessed grey plaster panel,
 *        metallic bronze-gold Bengali lettering ("খুলনা সার্কিট হাউস · খুলনা") & 3D beveled black granite plaque
 *      * Grey plastered Security Guard Room behind the left brick pier
 *      * Right exposed red-brick gate pier + pedestrian wicket portal + steel gate leaves
 *      * Low grey concrete plinth with dark-green spear-tip iron palisade fence
 *      * Historic grey stone Liberation War Memorial ("একাত্তরের নির্যাতন কেন্দ্র") on the left
 *  - LEFT-SIDE CURVED ENTRANCE DRIVEWAY (বাম দিক থেকে ঢোকার পথ):
 *      * Upon entering the Main Gate, the paved driveway sweeps smoothly to the LEFT (-X)
 *        past the Guard Room & manicured green lawn into the Heritage 1922 Circuit House Building!
 *  - 1922 Heritage Khulna Circuit House Building (British Colonial Red-Brick Bungalow):
 *      * Dark plinth, exposed red-brick piers with 3D pilasters, smooth semicircular arches with
 *        3D brick extrados moldings, crisp weathered white spandrels & classical white balustrades,
 *        projecting drive-through arched car portico with corner finials, recessed 2nd-story red-brick
 *        suite, walkable veranda & furnished VIP Reception Hall interior, and ceremonial BD flagpole.
 */

function seeded(seed = 192209) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeCanvas(w, h) {
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  return null;
}

/**
 * 1024x1024 Photorealistic Hand-Laid Bangladeshi Red Kiln Brick Texture:
 * Individual terracotta brick color variation, burnt headers, recessed cement mortar joints,
 * clay pores, chipped micro-edges, subtle white efflorescence & monsoon rain patina.
 */
function makePhotorealRedBrickTexture(seedVal = 1922) {
  const S = 1024;
  const c = makeCanvas(S, S);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  // Recessed sandy-grey cement mortar bed
  ctx.fillStyle = '#9c9489';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 6000; i++) {
    const v = 135 + Math.floor(rnd() * 45);
    ctx.fillStyle = `rgba(${v},${v - 4},${v - 9},0.35)`;
    ctx.fillRect(rnd() * S, rnd() * S, 2, 2);
  }

  const rows = 24;
  const cols = 10;
  const bh = S / rows;
  const bw = S / cols;

  for (let r = 0; r < rows; r++) {
    const xOff = (r % 2) * (bw * 0.5);
    for (let col = -1; col <= cols; col++) {
      const bx = col * bw + xOff;
      const by = r * bh;
      const m = 3.2; // crisp mortar gap
      const w = bw - m * 2;
      const h = bh - m * 2;

      // Natural Bangladeshi kiln-fired clay brick shades (deep terracotta, burnt sienna, occasional over-fired dark brick)
      const kilnRoll = rnd();
      let R, G, B;
      if (kilnRoll < 0.14) {
        // Slightly over-fired dark maroon-brown brick
        R = 104 + Math.floor(rnd() * 22);
        G = 46 + Math.floor(rnd() * 14);
        B = 36 + Math.floor(rnd() * 12);
      } else if (kilnRoll < 0.78) {
        // Classic Khulna red-terracotta brick
        R = 148 + Math.floor(rnd() * 34);
        G = 62 + Math.floor(rnd() * 20);
        B = 42 + Math.floor(rnd() * 15);
      } else {
        // Sun-baked warm orange-ochre brick
        R = 168 + Math.floor(rnd() * 24);
        G = 78 + Math.floor(rnd() * 18);
        B = 52 + Math.floor(rnd() * 14);
      }

      // Base brick fill
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fillRect(bx + m, by + m, w, h);

      // Subtle inner clay gradient (darker bottom shadow, sunlit top lip for 3D depth)
      const bg = ctx.createLinearGradient(0, by + m, 0, by + m + h);
      bg.addColorStop(0.0, 'rgba(255,225,205,0.16)');
      bg.addColorStop(0.18, 'rgba(255,255,255,0.0)');
      bg.addColorStop(0.82, 'rgba(0,0,0,0.0)');
      bg.addColorStop(1.0, 'rgba(20,8,4,0.28)');
      ctx.fillStyle = bg;
      ctx.fillRect(bx + m, by + m, w, h);

      // Micro clay pits, sand grains & kiln scorch marks on EVERY brick!
      for (let p = 0; p < 18; p++) {
        const px = bx + m + 2 + rnd() * (w - 4);
        const py = by + m + 2 + rnd() * (h - 4);
        const pw = 1.5 + rnd() * 4.5;
        const ph = 1.2 + rnd() * 2.8;
        ctx.fillStyle = rnd() > 0.45 ? 'rgba(28,12,8,0.22)' : 'rgba(235,195,168,0.14)';
        ctx.fillRect(px, py, pw, ph);
      }

      // Occasional subtle white salt efflorescence or monsoon moss smudge
      if (rnd() > 0.86) {
        ctx.fillStyle = 'rgba(225,222,212,0.13)';
        ctx.fillRect(bx + m + rnd() * (w * 0.4), by + m + rnd() * (h * 0.4), w * 0.45, h * 0.4);
      } else if (rnd() > 0.90) {
        ctx.fillStyle = 'rgba(38,54,30,0.18)';
        ctx.fillRect(bx + m, by + m + h * 0.55, w, h * 0.45);
      }
    }
  }

  // Subtle vertical rainwater weathering streaks across the brickwork
  for (let i = 0; i < 42; i++) {
    const x = rnd() * S;
    const h = 80 + rnd() * 260;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(22,20,16,0.16)');
    g.addColorStop(1, 'rgba(22,20,16,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 4 + rnd() * 12, h);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/**
 * 1024x1024 Photorealistic Weathered Architectural Concrete / Plaster Texture
 */
function makePhotorealConcreteTexture(baseHex = '#a6aaa5', seedVal = 2024, streakAlpha = 0.16) {
  const S = 1024;
  const c = makeCanvas(S, S);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, S, S);

  // Broad trowel & moisture patches
  for (let i = 0; i < 160; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const r = 24 + rnd() * 84;
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    const dark = rnd() > 0.42;
    g.addColorStop(0, dark ? 'rgba(38,42,36,0.09)' : 'rgba(255,255,255,0.08)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Fine sand aggregate & concrete micro-pores
  for (let i = 0; i < 22000; i++) {
    const dark = rnd() > 0.46;
    ctx.fillStyle = dark ? `rgba(34,36,32,${0.05 + rnd() * 0.09})` : `rgba(255,255,255,${0.04 + rnd() * 0.07})`;
    ctx.fillRect(rnd() * S, rnd() * S, 1.5 + rnd() * 3.0, 1.5 + rnd() * 3.0);
  }

  // Subtle vertical tropical monsoon rainwater streaks from top coping
  for (let i = 0; i < 55; i++) {
    const x = rnd() * S;
    const h = 90 + rnd() * 320;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgba(28,32,26,${streakAlpha})`);
    g.addColorStop(1, 'rgba(28,32,26,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 4 + rnd() * 14, h);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/**
 * 1024x1024 Photorealistic Weathered Concrete & Dusty Earth Driveway Texture
 */
function makePhotorealDrivewayTexture(seedVal = 5151) {
  const S = 1024;
  const c = makeCanvas(S, S);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  ctx.fillStyle = '#7b746d';
  ctx.fillRect(0, 0, S, S);

  // Subtle concrete paving expansion joints
  ctx.strokeStyle = 'rgba(42,38,34,0.28)';
  ctx.lineWidth = 3;
  for (let p = 0; p < S; p += 256) {
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(S, p);
    ctx.moveTo(p, 0);
    ctx.lineTo(p, S);
    ctx.stroke();
  }

  // Crushed stone aggregate, warm dust patches & tire polish
  for (let i = 0; i < 24000; i++) {
    const v = 80 + Math.floor(rnd() * 68);
    ctx.fillStyle = `rgba(${v + 8},${v + 2},${v - 4},0.28)`;
    ctx.fillRect(rnd() * S, rnd() * S, 1.5 + rnd() * 3.0, 1.5 + rnd() * 3.0);
  }
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = rnd() > 0.45 ? 'rgba(132,96,72,0.10)' : 'rgba(35,38,34,0.10)';
    ctx.beginPath();
    ctx.arc(rnd() * S, rnd() * S, 20 + rnd() * 58, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makePhotorealGrassTexture(seedVal = 8844) {
  const S = 1024;
  const c = makeCanvas(S, S);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = '#427630';
  ctx.fillRect(0, 0, S, S);
  for (let s = 0; s < 12; s++) {
    ctx.fillStyle = s % 2 === 0 ? 'rgba(86,142,56,0.16)' : 'rgba(32,68,24,0.16)';
    ctx.fillRect(0, s * (S / 12), S, S / 12);
  }
  for (let i = 0; i < 240; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const r = 16 + rnd() * 48;
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, rnd() > 0.4 ? 'rgba(98,142,58,0.16)' : 'rgba(104,88,54,0.14)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 26000; i++) {
    const p = rnd();
    ctx.fillStyle = p < 0.45 ? 'rgba(124,174,76,0.30)' : (p < 0.85 ? 'rgba(32,68,22,0.32)' : 'rgba(142,126,76,0.22)');
    ctx.fillRect(rnd() * S, rnd() * S, 1.5, 3.5 + rnd() * 4.5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/**
 * High-Res 1024x1280 Weathered Concrete Gate Panel with Embossed Metallic Bronze-Gold
 * "খুলনা সার্কিট হাউস / খুলনা" Lettering (exact match to Street View!)
 */
function makeGateSignPanelTexture() {
  const W = 1024;
  const H = 1280;
  const c = makeCanvas(W, H);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(2026);

  // Authentic weathered grey plaster inner panel
  ctx.fillStyle = '#9ea29e';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 16000; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(32,34,30,0.07)';
    ctx.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 3, 2 + rnd() * 3);
  }
  // Monsoon rain-streaks from top brick overhang
  for (let i = 0; i < 38; i++) {
    const x = rnd() * W;
    const h = 140 + rnd() * 360;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(30,32,28,0.22)');
    g.addColorStop(1, 'rgba(30,32,28,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 6 + rnd() * 18, h);
  }

  // Embossed 3D-shaded Bronze-Gold Bengali Lettering ("খুলনা সার্কিট হাউস" / "খুলনা")
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 104px "Noto Sans Bengali", "Segoe UI", sans-serif';
  // Deep cast drop shadow behind raised letters
  ctx.fillStyle = 'rgba(18,14,10,0.68)';
  ctx.fillText('খুলনা সার্কিট হাউস', W * 0.5 + 6, 268);
  // Metallic gold-bronze face
  const goldGrad = ctx.createLinearGradient(0, 200, 0, 320);
  goldGrad.addColorStop(0, '#e5c172');
  goldGrad.addColorStop(0.5, '#b8893c');
  goldGrad.addColorStop(1, '#7a5820');
  ctx.fillStyle = goldGrad;
  ctx.fillText('খুলনা সার্কিট হাউস', W * 0.5, 260);

  ctx.font = 'bold 82px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(18,14,10,0.68)';
  ctx.fillText('খুলনা', W * 0.5 + 5, 396);
  ctx.fillStyle = goldGrad;
  ctx.fillText('খুলনা', W * 0.5, 388);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Dedicated High-Res Black Granite Foundation Inauguration Plaque Texture
 */
function makeBlackGranitePlaqueTexture() {
  const W = 512;
  const H = 384;
  const c = makeCanvas(W, H);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(9191);

  ctx.fillStyle = '#141518';
  ctx.fillRect(0, 0, W, H);
  // Polished granite mineral flecks
  for (let i = 0; i < 1800; i++) {
    const v = 35 + Math.floor(rnd() * 65);
    ctx.fillStyle = `rgba(${v},${v},${v + 5},0.35)`;
    ctx.fillRect(rnd() * W, rnd() * H, 2, 2);
  }
  ctx.strokeStyle = '#c8a24c';
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, W - 24, H - 24);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 36px "Noto Sans Bengali", sans-serif';
  ctx.fillText('খুলনা সার্কিট হাউস গেট', W * 0.5, 92);
  ctx.fillStyle = '#e5e7eb';
  ctx.font = '600 24px "Noto Sans Bengali", sans-serif';
  ctx.fillText('শুভ উদ্বোধন · গণপূর্ত বিভাগ-১', W * 0.5, 166);
  ctx.fillText('জেলা প্রশাসন, খুলনা', W * 0.5, 224);
  ctx.fillStyle = '#d4af37';
  ctx.font = '700 20px "Manrope", sans-serif';
  ctx.fillText('KHULNA CIRCUIT HOUSE · K.D. GHOS RD', W * 0.5, 298);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeMemorialPlaqueTexture() {
  const W = 512;
  const H = 640;
  const c = makeCanvas(W, H);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(1971);
  ctx.fillStyle = '#d6d8d5';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(30,32,30,0.08)';
    ctx.fillRect(rnd() * W, rnd() * H, 2, 2);
  }
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 14;
  ctx.strokeRect(12, 12, W - 24, H - 24);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#881313';
  ctx.font = 'bold 36px "Noto Sans Bengali", sans-serif';
  ctx.fillText('একাত্তরের নির্যাতন কেন্দ্র', W * 0.5, 86);
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 26px "Noto Sans Bengali", sans-serif';
  ctx.fillText('খুলনা সার্কিট হাউস · ১৯৭১', W * 0.5, 140);
  ctx.fillStyle = '#1f2937';
  ctx.font = '600 21px "Noto Sans Bengali", sans-serif';
  const lines = [
    'মহান মুক্তিযুদ্ধের স্মৃতিবিজড়িত',
    'ঐতিহাসিক খুলনা সার্কিট হাউস।',
    '১৯৭১ সালে স্বাধীনতা সংগ্রামে',
    'পাকিস্তানি হানাদার বাহিনীর হাতে',
    'শহীদ বীর মুক্তিযোদ্ধা ও নিরীহ',
    'মানুষের স্মৃতির প্রতি গভীর শ্রদ্ধা।',
  ];
  lines.forEach((ln, idx) => {
    ctx.fillText(ln, W * 0.5, 224 + idx * 54);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function addBox(parent, size, pos, mat, opts = {}) {
  const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
  if (opts.uvScale) {
    const p = geo.attributes.position;
    const n = geo.attributes.normal;
    const u = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const nx = Math.abs(n.getX(i));
      const ny = Math.abs(n.getY(i));
      const nz = Math.abs(n.getZ(i));
      if (nx >= ny && nx >= nz) u.setXY(i, p.getZ(i) / opts.uvScale, p.getY(i) / opts.uvScale);
      else if (ny >= nx && ny >= nz) u.setXY(i, p.getX(i) / opts.uvScale, p.getZ(i) / opts.uvScale);
      else u.setXY(i, p.getX(i) / opts.uvScale, p.getY(i) / opts.uvScale);
    }
    u.needsUpdate = true;
  }
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (opts.rotX) mesh.rotation.x = opts.rotX;
  if (opts.rotY) mesh.rotation.y = opts.rotY;
  if (opts.rotZ) mesh.rotation.z = opts.rotZ;
  mesh.castShadow = opts.castShadow ?? true;
  mesh.receiveShadow = opts.receiveShadow ?? true;
  parent.add(mesh);
  return mesh;
}

function addCyl(parent, rt, rb, h, pos, mat, seg = 20) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * Smooth ribbon road along a curved polyline (zero jagged corners, clean curb borders!)
 */
function addCurvedDriveway(parent, pts, halfW, roadMat, curbMat, yTop = 0.032) {
  const buildStrip = (hw, y, mat, uvMul = 0.16) => {
    const pos = [];
    const norm = [];
    const uvs = [];
    const idx = [];
    let distAcc = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i];
      let nx = 0, nz = 0;
      if (i > 0) {
        const dx = x - pts[i - 1][0], dz = z - pts[i - 1][1];
        const l = Math.hypot(dx, dz) || 1;
        distAcc += l;
        nx += -dz / l; nz += dx / l;
      }
      if (i < pts.length - 1) {
        const dx = pts[i + 1][0] - x, dz = pts[i + 1][1] - z;
        const l = Math.hypot(dx, dz) || 1;
        nx += -dz / l; nz += dx / l;
      }
      const nl = Math.hypot(nx, nz) || 1;
      nx /= nl; nz /= nl;
      pos.push(x - nx * hw, y, z - nz * hw, x + nx * hw, y, z + nz * hw);
      norm.push(0, 1, 0, 0, 1, 0);
      uvs.push(0, distAcc * uvMul, 1, distAcc * uvMul);
      if (i > 0) {
        const b = (i - 1) * 2;
        idx.push(b, b + 1, b + 3, b, b + 3, b + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    parent.add(mesh);
  };
  if (curbMat) buildStrip(halfW + 0.36, yTop - 0.012, curbMat, 0.25);
  buildStrip(halfW, yTop, roadMat, 0.16);
}

/**
 * True smooth semicircular colonial arch spandrel + 3D red-brick extrados ring
 */
function addSemicircularArch(parent, { span, height, depth, archRise, pos, rotY = 0, mat, trimMat = null }) {
  const hw = span * 0.5;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, 0);
  shape.lineTo(-hw, height);
  shape.lineTo(hw, height);
  shape.lineTo(hw, 0);
  const segs = 22;
  for (let i = 0; i <= segs; i++) {
    const ang = (i / segs) * Math.PI;
    shape.lineTo(Math.cos(ang) * hw, Math.sin(ang) * archRise);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 14 });
  geo.translate(0, 0, -depth * 0.5);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.y = rotY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  if (trimMat) {
    const ringShape = new THREE.Shape();
    const rOut = hw + 0.16;
    const rIn = hw - 0.03;
    for (let i = 0; i <= segs; i++) {
      const ang = (i / segs) * Math.PI;
      const x = Math.cos(ang) * rOut;
      const y = Math.sin(ang) * (archRise + 0.16);
      if (i === 0) ringShape.moveTo(x, y);
      else ringShape.lineTo(x, y);
    }
    for (let i = segs; i >= 0; i--) {
      const ang = (i / segs) * Math.PI;
      ringShape.lineTo(Math.cos(ang) * rIn, Math.sin(ang) * (archRise - 0.03));
    }
    ringShape.closePath();
    const rGeo = new THREE.ExtrudeGeometry(ringShape, { depth: depth + 0.10, bevelEnabled: false });
    rGeo.translate(0, 0, -(depth + 0.10) * 0.5);
    const rMesh = new THREE.Mesh(rGeo, trimMat);
    rMesh.position.set(pos[0], pos[1], pos[2]);
    rMesh.rotation.y = rotY;
    rMesh.castShadow = true;
    parent.add(rMesh);
  }
  return mesh;
}

export function buildKhulnaCircuitHouseStandalone3D() {
  const root = new THREE.Group();
  root.name = 'KhulnaCircuitHouse_AAA_Complex';

  const brickTex = makePhotorealRedBrickTexture(1922);
  const concTex = makePhotorealConcreteTexture('#a6aaa5', 2024, 0.16);
  const darkFasciaTex = makePhotorealConcreteTexture('#52585e', 2025, 0.14);
  const whiteTex = makePhotorealConcreteTexture('#f1eee6', 2026, 0.10);
  const driveTex = makePhotorealDrivewayTexture(5151);
  const grassTex = makePhotorealGrassTexture(8844);
  const gateSignTex = makeGateSignPanelTexture();
  const granitePlaqueTex = makeBlackGranitePlaqueTexture();
  const memorialTex = makeMemorialPlaqueTexture();

  const mats = {
    redBrick: new THREE.MeshStandardMaterial({ map: brickTex, color: brickTex ? 0xffffff : 0x9b422e, roughness: 0.86, metalness: 0.03 }),
    greyConcrete: new THREE.MeshStandardMaterial({ map: concTex, color: concTex ? 0xffffff : 0xa5a9a4, roughness: 0.84, metalness: 0.04 }),
    darkFascia: new THREE.MeshStandardMaterial({ map: darkFasciaTex, color: darkFasciaTex ? 0xffffff : 0x4d5359, roughness: 0.72, metalness: 0.10 }),
    whitePlaster: new THREE.MeshStandardMaterial({ map: whiteTex, color: whiteTex ? 0xffffff : 0xf1eee6, roughness: 0.78, metalness: 0.02 }),
    charcoalPlinth: new THREE.MeshStandardMaterial({ color: 0x24272b, roughness: 0.88, metalness: 0.06 }),
    greenFence: new THREE.MeshStandardMaterial({ color: 0x165a30, roughness: 0.36, metalness: 0.68 }),
    steelGate: new THREE.MeshStandardMaterial({ color: 0x9aa6b2, roughness: 0.30, metalness: 0.82 }),
    darkIron: new THREE.MeshStandardMaterial({ color: 0x1c2229, roughness: 0.40, metalness: 0.76 }),
    driveway: new THREE.MeshStandardMaterial({ map: driveTex, color: driveTex ? 0xffffff : 0x7b746d, roughness: 0.88, metalness: 0.03 }),
    asphalt: new THREE.MeshStandardMaterial({ color: 0x35393f, roughness: 0.84, metalness: 0.06 }),
    grass: new THREE.MeshStandardMaterial({ map: grassTex, color: grassTex ? 0xffffff : 0x427630, roughness: 0.94, metalness: 0.01 }),
    verandaTile: new THREE.MeshStandardMaterial({ color: 0xddd6c9, roughness: 0.38, metalness: 0.05 }),
    teakWood: new THREE.MeshStandardMaterial({ color: 0x6b3a1b, roughness: 0.50, metalness: 0.04 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x1a3b4e, roughness: 0.08, metalness: 0.18, clearcoat: 0.95, transparent: true, opacity: 0.80 }),
    ledGlow: new THREE.MeshStandardMaterial({ color: 0xfff8e6, emissive: 0xffdf99, emissiveIntensity: 1.6, roughness: 0.2 }),
    goldMat: new THREE.MeshStandardMaterial({ color: 0xd4a644, roughness: 0.24, metalness: 0.88 }),
    chromeMat: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.16, metalness: 0.92 }),
    flagGreen: new THREE.MeshStandardMaterial({ color: 0x006a4e, roughness: 0.72, side: THREE.DoubleSide }),
    flagRed: new THREE.MeshStandardMaterial({ color: 0xf42a41, roughness: 0.68, side: THREE.DoubleSide }),
    carpet: new THREE.MeshStandardMaterial({ color: 0x7c1d1d, roughness: 0.92 }),
    gateSignPanel: new THREE.MeshStandardMaterial({ map: gateSignTex, color: 0xffffff, roughness: 0.76, metalness: 0.06 }),
    granitePlaque: new THREE.MeshPhysicalMaterial({ map: granitePlaqueTex, color: 0xffffff, roughness: 0.16, metalness: 0.12, clearcoat: 0.90 }),
    memorialPanel: new THREE.MeshStandardMaterial({ map: memorialTex, color: 0xffffff, roughness: 0.72 }),
  };

  // Attach true Sobel tangent-space Normal Maps + Roughness Maps on all architectural materials!
  if (typeof document !== 'undefined') {
    attachDerivedPBRMaps(mats.redBrick, brickTex, { size: 512, strength: 3.4, roughBase: 0.86, normalScale: 1.15 });
    attachDerivedPBRMaps(mats.greyConcrete, concTex, { size: 512, strength: 2.2, roughBase: 0.84, normalScale: 0.75 });
    attachDerivedPBRMaps(mats.darkFascia, darkFasciaTex, { size: 512, strength: 2.0, roughBase: 0.72, normalScale: 0.65 });
    attachDerivedPBRMaps(mats.whitePlaster, whiteTex, { size: 512, strength: 1.6, roughBase: 0.78, normalScale: 0.55 });
    attachDerivedPBRMaps(mats.driveway, driveTex, { size: 512, strength: 2.6, roughBase: 0.88, normalScale: 0.85 });
    attachDerivedPBRMaps(mats.grass, grassTex, { size: 512, strength: 2.0, roughBase: 0.94, normalScale: 0.65 });
    attachDerivedPBRMaps(mats.gateSignPanel, gateSignTex, { size: 512, strength: 2.4, roughBase: 0.76, normalScale: 0.80 });
  }

  /* ============================================================================
   * 1. COMPOUND GROUNDS, K.D. GHOS RD & LEFT-SIDE CURVED ENTRANCE DRIVEWAY!
   *    (বাম দিক থেকে ঢোকার পথ: Main Gate is at X = +12, Z = +18.2;
   *     entering the gate, the driveway curves smoothly to the LEFT (-X)
   *     past the Guard Room & green lawn into the 1922 Heritage Building at X = -8, Z = -10!)
   * ========================================================================== */
  const GATE_X = 10.0;
  const GATE_Z = 18.2;
  const BLDG_X = -8.5;
  const BLDG_Z = -10.5;

  // Lush Compound Lawn
  addBox(root, [84.0, 0.16, 68.0], [0, -0.08, -2.0], mats.grass, { castShadow: false, uvScale: 8.5 });
  // K.D. Ghos Road outside the Main Gate (Z = +22.5 .. +31.5)
  addBox(root, [84.0, 0.12, 9.0], [0, -0.04, 27.0], mats.asphalt, { castShadow: false });
  // Concrete road edge curb & sidewalk along K.D. Ghos Rd
  addBox(root, [84.0, 0.16, 3.8], [0, 0.01, 20.8], mats.driveway, { castShadow: false, uvScale: 3.2 });
  addBox(root, [84.0, 0.14, 0.24], [0, 0.05, 22.6], mats.greyConcrete, { castShadow: false });

  // LEFT-TURNING ENTRANCE DRIVEWAY (Enters Main Gate at X=+11.6, Z=+22.5, curves smoothly LEFT to Heritage Building Portico at X=-8.5, Z=+0.5!)
  addCurvedDriveway(root, [
    [GATE_X + 1.8, 22.6],
    [GATE_X + 1.8, 17.5],
    [GATE_X + 0.8, 12.0],
    [GATE_X - 3.2,  7.4],
    [GATE_X - 9.5,  5.0],
    [BLDG_X + 2.5,  3.8],
    [BLDG_X,        1.5],
    [BLDG_X,       -1.5],
  ], 3.85, mats.driveway, mats.greyConcrete, 0.032);

  // Broad Circular Turning Forecourt right in front of the Heritage Building Portico (entered from the left!)
  const apron = new THREE.Mesh(new THREE.CylinderGeometry(10.8, 11.1, 0.08, 40), mats.driveway);
  apron.position.set(BLDG_X, 0.025, 2.2);
  apron.receiveShadow = true;
  root.add(apron);
  // Manicured red-brick circular garden island in front of the portico
  const islandRim = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.9, 0.26, 32), mats.redBrick);
  islandRim.position.set(BLDG_X, 0.13, 3.8);
  islandRim.receiveShadow = true;
  root.add(islandRim);
  const islandGrass = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 0.30, 32), mats.grass);
  islandGrass.position.set(BLDG_X, 0.15, 3.8);
  root.add(islandGrass);

  /* ============================================================================
   * 2. KHULNA CIRCUIT HOUSE MAIN GATE (X = +10.0, Z = +18.2) — STREET VIEW 1:1
   * ========================================================================== */
  const gateG = new THREE.Group();
  gateG.name = 'CircuitHouse_MainGate';
  gateG.position.set(GATE_X, 0, GATE_Z);
  root.add(gateG);

  // A) MODERNIST SLANTED CANTILEVERED CONCRETE CANOPY (high on Left -X, sloping down to Right +X!)
  const canopyShape = new THREE.Shape();
  canopyShape.moveTo(-7.8, 5.75);
  canopyShape.lineTo(10.8, 4.30);
  canopyShape.lineTo(10.8, 4.74);
  canopyShape.lineTo(-7.8, 6.56);
  canopyShape.closePath();

  const canopyDepth = 6.4;
  const canopyGeo = new THREE.ExtrudeGeometry(canopyShape, { depth: canopyDepth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 2 });
  canopyGeo.translate(0, 0, -canopyDepth * 0.5);
  const canopyMesh = new THREE.Mesh(canopyGeo, mats.greyConcrete);
  canopyMesh.castShadow = true;
  canopyMesh.receiveShadow = true;
  gateG.add(canopyMesh);

  // Sculpted Dark-Grey Architectural Fascia Border along Front, Back & Drip-Edge Soffit!
  const fasciaShape = new THREE.Shape();
  fasciaShape.moveTo(-7.92, 5.68);
  fasciaShape.lineTo(10.92, 4.24);
  fasciaShape.lineTo(10.92, 4.78);
  fasciaShape.lineTo(-7.92, 6.62);
  fasciaShape.closePath();
  const fasciaGeo = new THREE.ExtrudeGeometry(fasciaShape, { depth: 0.16, bevelEnabled: false });
  for (const fz of [canopyDepth * 0.5 + 0.01, -canopyDepth * 0.5 - 0.17]) {
    const fm = new THREE.Mesh(fasciaGeo, mats.darkFascia);
    fm.position.z = fz;
    gateG.add(fm);
  }

  // Recessed Circular LED Downlight Housings (bezel ring + glowing lens) across the slanted soffit!
  for (let lx = -5.0; lx <= 8.5; lx += 2.7) {
    const t = (lx - (-7.8)) / (10.8 - (-7.8));
    const ly = THREE.MathUtils.lerp(5.73, 4.28, t);
    for (const lz of [-1.65, 0.0, 1.65]) {
      addCyl(gateG, 0.21, 0.21, 0.04, [lx, ly - 0.01, lz], mats.darkIron, 14);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 14), mats.ledGlow);
      lens.position.set(lx, ly - 0.025, lz);
      gateG.add(lens);
    }
  }

  // 4 Sleek Cylindrical Concrete Support Columns with Base Plinth Collars
  for (const [cx, cz, h] of [
    [-3.1, -1.7, 5.52],
    [-3.1,  1.5, 5.52],
    [ 6.2, -1.7, 4.76],
    [ 6.2,  1.5, 4.76],
  ]) {
    addCyl(gateG, 0.28, 0.31, h, [cx, h * 0.5, cz], mats.greyConcrete, 22);
    addCyl(gateG, 0.35, 0.37, 0.22, [cx, 0.11, cz], mats.charcoalPlinth, 22);
  }

  // B) LEFT GRAND EXPOSED RED-BRICK MONUMENT WALL (3D stepped brick frame + physically recessed grey panel!)
  //    Back backing wall
  addBox(gateG, [4.65, 4.38, 0.52], [-3.85, 2.19, 0.36], mats.redBrick, { uvScale: 1.45 });
  // 3D Projecting Red-Brick Outer Frame Pillars & Header (creating real 0.16m physical recess around the grey panel!)
  addBox(gateG, [0.92, 4.38, 0.26], [-5.72, 2.19, 0.72], mats.redBrick, { uvScale: 1.45 }); // Left brick jamb
  addBox(gateG, [0.92, 4.38, 0.26], [-1.98, 2.19, 0.72], mats.redBrick, { uvScale: 1.45 }); // Right brick jamb
  addBox(gateG, [4.65, 0.56, 0.26], [-3.85, 4.10, 0.72], mats.redBrick, { uvScale: 1.45 }); // Top brick lintel
  addBox(gateG, [4.65, 0.36, 0.28], [-3.85, 0.18, 0.73], mats.charcoalPlinth);               // Damp dark base plinth
  // Chamfered concrete cap coping
  addBox(gateG, [4.86, 0.14, 0.94], [-3.85, 4.44, 0.48], mats.greyConcrete);
  // Recessed smooth weathered grey plaster panel with raised bronze-gold "খুলনা সার্কিট হাউস / খুলনা"
  addBox(gateG, [2.82, 3.46, 0.08], [-3.85, 2.09, 0.64], mats.gateSignPanel, { castShadow: false });
  // 3D Beveled Polished Black Granite Inauguration Plaque mounted physically proud of the grey panel!
  addBox(gateG, [1.26, 0.94, 0.07], [-3.85, 1.44, 0.71], mats.granitePlaque);
  // 4 Tiny Brass Corner Mounting Studs on the Black Granite Plaque
  for (const [bx, by] of [[-0.56, 0.40], [0.56, 0.40], [-0.56, -0.40], [0.56, -0.40]]) {
    addCyl(gateG, 0.022, 0.022, 0.03, [-3.85 + bx, 1.44 + by, 0.75], mats.goldMat, 8);
  }
  // Thick side return brick pier on driveway edge
  addBox(gateG, [0.85, 4.38, 1.45], [-1.72, 2.19, 0.16], mats.redBrick, { uvScale: 1.45 });

  // C) SECURITY GUARD ROOM TUCKED BEHIND LEFT BRICK PIER (exact Street View match!)
  addBox(gateG, [3.8, 3.05, 3.6], [-5.3, 1.525, -1.85], mats.greyConcrete, { uvScale: 2.2 });
  addBox(gateG, [4.35, 0.22, 4.15], [-5.3, 3.14, -1.85], mats.darkFascia);
  addBox(gateG, [1.35, 1.18, 0.12], [-5.3, 1.82, -0.02], mats.glass, { castShadow: false });
  addBox(gateG, [1.48, 0.08, 0.20], [-5.3, 2.44, 0.04], mats.darkIron);
  addBox(gateG, [0.10, 2.15, 1.05], [-3.38, 1.08, -2.10], mats.darkIron);

  // D) RIGHT EXPOSED RED-BRICK GATE PIER + PEDESTRIAN WICKET PORTAL + FAR-RIGHT PILLAR
  addBox(gateG, [1.18, 3.72, 1.18], [5.85, 1.86, 0.16], mats.redBrick, { uvScale: 1.45 });
  addBox(gateG, [1.32, 0.14, 1.32], [5.85, 3.78, 0.16], mats.greyConcrete);
  addBox(gateG, [3.25, 0.68, 0.90], [7.38, 3.38, 0.16], mats.redBrick, { uvScale: 1.45 });
  addBox(gateG, [1.08, 3.72, 1.08], [8.88, 1.86, 0.16], mats.redBrick, { uvScale: 1.45 });
  addBox(gateG, [1.22, 0.14, 1.22], [8.88, 3.78, 0.16], mats.greyConcrete);

  // E) DETAILED GALVANIZED STEEL MAIN GATE & PEDESTRIAN WICKET GATE LEAVES
  const buildSteelGateLeaf = (w, h, x, z, rotY) => {
    const lg = new THREE.Group();
    lg.position.set(x, 0, z);
    lg.rotation.y = rotY;
    addBox(lg, [w, 0.09, 0.08], [w * 0.5, 0.18, 0], mats.steelGate);
    addBox(lg, [w, 0.09, 0.08], [w * 0.5, h - 0.10, 0], mats.steelGate);
    addBox(lg, [w, 0.07, 0.07], [w * 0.5, h * 0.50, 0], mats.steelGate);
    addBox(lg, [0.08, h, 0.08], [0.04, h * 0.5, 0], mats.steelGate);
    addBox(lg, [0.08, h, 0.08], [w - 0.04, h * 0.5, 0], mats.steelGate);
    for (let bx = 0.16; bx <= w - 0.14; bx += 0.20) {
      addBox(lg, [0.036, h - 0.18, 0.036], [bx, h * 0.5, 0], mats.steelGate);
    }
    gateG.add(lg);
  };
  // Steel gate leaves swung open inward along the driveway edges
  buildSteelGateLeaf(3.25, 2.38, -1.25, -0.35, -1.38);
  buildSteelGateLeaf(3.25, 2.38,  5.25, -0.35,  Math.PI + 1.38);
  buildSteelGateLeaf(1.88, 2.38,  6.48,  0.16, -0.32);

  // F) DARK-GREEN SPEAR-TIP IRON PALISADE BOUNDARY FENCE + WEATHERED CONCRETE PLINTH
  const addBoundaryFenceSpan = (x0, x1) => {
    const len = Math.abs(x1 - x0);
    const mx = (x0 + x1) * 0.5;
    addBox(gateG, [len, 0.68, 0.36], [mx, 0.34, 0.20], mats.greyConcrete, { uvScale: 2.0 });
    addBox(gateG, [len + 0.06, 0.11, 0.44], [mx, 0.72, 0.20], mats.whitePlaster);
    addBox(gateG, [len, 0.06, 0.06], [mx, 2.28, 0.20], mats.greenFence);
    addBox(gateG, [len, 0.05, 0.05], [mx, 1.50, 0.20], mats.greenFence);
    addBox(gateG, [len, 0.05, 0.05], [mx, 0.86, 0.20], mats.greenFence);
    const barCount = Math.floor(len / 0.20);
    for (let i = 0; i <= barCount; i++) {
      const bx = x0 + (x1 - x0) * (i / Math.max(1, barCount));
      addBox(gateG, [0.032, 1.62, 0.032], [bx, 1.55, 0.20], mats.greenFence);
    }
    for (let px = x0; px <= x1 + 0.05; px += 4.4) {
      addBox(gateG, [0.36, 2.50, 0.40], [px, 1.25, 0.20], mats.greyConcrete, { uvScale: 1.8 });
      addBox(gateG, [0.44, 0.10, 0.48], [px, 2.54, 0.20], mats.darkFascia);
    }
  };
  // Long left fence running all the way past the Heritage Building lawn + right fence
  addBoundaryFenceSpan(-46.0, -11.5);
  addBoundaryFenceSpan(-8.4, -6.2);
  addBoundaryFenceSpan(9.4, 28.0);

  // G) HISTORIC LIBERATION WAR MEMORIAL MONUMENT ("একাত্তরের নির্যাতন কেন্দ্র") ON THE LEFT OF GATE!
  addBox(gateG, [3.15, 0.32, 1.05], [-9.95, 0.16, 0.28], mats.charcoalPlinth);
  addBox(gateG, [2.78, 2.68, 0.68], [-9.95, 1.62, 0.28], mats.greyConcrete, { uvScale: 1.8 });
  addBox(gateG, [3.02, 0.18, 0.86], [-9.95, 3.04, 0.28], mats.darkFascia);
  addBox(gateG, [2.22, 2.15, 0.06], [-9.95, 1.66, 0.64], mats.memorialPanel, { castShadow: false });

  // Interior Green Divider Fence visible straight behind the Main Gate (just like in the Street View photo!)
  addBox(gateG, [12.0, 0.45, 0.28], [4.5, 0.225, -8.5], mats.greyConcrete);
  addBox(gateG, [12.0, 0.05, 0.05], [4.5, 1.65, -8.5], mats.greenFence);
  addBox(gateG, [12.0, 0.05, 0.05], [4.5, 0.95, -8.5], mats.greenFence);
  for (let bx = -1.4; bx <= 10.4; bx += 0.26) {
    addBox(gateG, [0.03, 1.30, 0.03], [bx, 1.08, -8.5], mats.greenFence);
  }

  /* ============================================================================
   * 3. REAL 1922 HERITAGE KHULNA CIRCUIT HOUSE BUILDING (X = -8.5, Z = -10.5)
   *    Approached from the LEFT-turning driveway! Exposed red-brick piers,
   *    3D brick pilasters, smooth semicircular arches, crisp white spandrels & balustrades,
   *    projecting drive-through arched car portico, and recessed 2nd-story suite.
   * ========================================================================== */
  const bldgG = new THREE.Group();
  bldgG.name = 'CircuitHouse_HeritageBuilding';
  bldgG.position.set(BLDG_X, 0, BLDG_Z);
  root.add(bldgG);

  const mainW = 38.0;
  const mainD = 16.5;
  const plinthH = 0.72;
  const floor1H = 4.68;
  const roofY = plinthH + floor1H; // 5.40m

  addBox(bldgG, [mainW + 0.8, plinthH, mainD + 0.8], [0, plinthH * 0.5, 0], mats.charcoalPlinth);
  addBox(bldgG, [mainW + 0.2, 0.06, mainD + 0.2], [0, plinthH + 0.02, 0], mats.verandaTile, { castShadow: false });

  const coreZ = -1.6;
  const coreD = mainD - 3.6;
  const frontWallZ = coreZ + coreD * 0.5;
  const roofGroup = new THREE.Group();
  bldgG.add(roofGroup);

  addBox(bldgG, [mainW - 0.6, floor1H, 0.44], [0, plinthH + floor1H * 0.5, -mainD * 0.5 + 0.22], mats.redBrick, { uvScale: 1.55 });
  addBox(bldgG, [0.44, floor1H, coreD], [-mainW * 0.5 + 0.22, plinthH + floor1H * 0.5, coreZ], mats.redBrick, { uvScale: 1.55 });
  addBox(bldgG, [0.44, floor1H, coreD], [ mainW * 0.5 - 0.22, plinthH + floor1H * 0.5, coreZ], mats.redBrick, { uvScale: 1.55 });

  // Veranda inner wall with grand open teak double doorway & colonial shuttered windows
  addBox(bldgG, [16.8, floor1H, 0.36], [-10.0, plinthH + floor1H * 0.5, frontWallZ], mats.whitePlaster, { uvScale: 2.2 });
  addBox(bldgG, [16.8, floor1H, 0.36], [ 10.0, plinthH + floor1H * 0.5, frontWallZ], mats.whitePlaster, { uvScale: 2.2 });
  addBox(bldgG, [3.6, floor1H - 3.1, 0.36], [0, plinthH + 3.1 + (floor1H - 3.1) * 0.5, frontWallZ], mats.whitePlaster);
  addBox(bldgG, [0.10, 3.08, 1.48], [-1.62, plinthH + 1.54, frontWallZ - 0.72], mats.teakWood);
  addBox(bldgG, [0.10, 3.08, 1.48], [ 1.62, plinthH + 1.54, frontWallZ - 0.72], mats.teakWood);
  for (const wx of [-14.2, -9.8, -5.4, 5.4, 9.8, 14.2]) {
    addBox(bldgG, [1.92, 2.30, 0.16], [wx, plinthH + 2.08, frontWallZ + 0.12], mats.teakWood);
    addBox(bldgG, [1.56, 1.94, 0.20], [wx, plinthH + 2.08, frontWallZ + 0.12], mats.glass, { castShadow: false });
  }

  // Front Arched Colonnade Veranda (6 grand semicircular bays + 3D red-brick pilasters + white slatted balustrades)
  const verZ = mainD * 0.5 - 0.25;
  const baySpecs = [-16.2, -11.8, -7.4, 7.4, 11.8, 16.2];
  const baySpan = 4.4;
  for (const px of [-18.4, -14.0, -9.6, -5.2, 5.2, 9.6, 14.0, 18.4]) {
    addBox(bldgG, [0.86, floor1H, 0.86], [px, plinthH + floor1H * 0.5, verZ], mats.redBrick, { uvScale: 1.45 });
    addBox(bldgG, [0.98, 0.16, 0.98], [px, plinthH + 2.86, verZ], mats.whitePlaster);
    addBox(bldgG, [0.96, 0.14, 0.96], [px, plinthH + 0.08, verZ], mats.charcoalPlinth);
  }
  for (const bx of baySpecs) {
    addSemicircularArch(bldgG, {
      span: baySpan - 0.82,
      height: 1.82,
      depth: 0.48,
      archRise: 1.34,
      pos: [bx, plinthH + 2.86, verZ],
      rotY: 0,
      mat: mats.whitePlaster,
      trimMat: mats.redBrick,
    });
    // White classical slatted balustrade railing
    addBox(bldgG, [baySpan - 0.80, 0.12, 0.24], [bx, plinthH + 0.08, verZ], mats.whitePlaster);
    addBox(bldgG, [baySpan - 0.80, 0.14, 0.26], [bx, plinthH + 0.98, verZ], mats.whitePlaster);
    for (let sx = -1.44; sx <= 1.45; sx += 0.36) {
      addBox(bldgG, [0.14, 0.80, 0.16], [bx + sx, plinthH + 0.53, verZ], mats.whitePlaster);
    }
  }

  // Grand Projecting Arched Car Portico (Porte-Cochère)
  const portD = 6.2;
  const portZ = verZ + portD * 0.5;
  const portH = 5.70;
  addBox(bldgG, [9.8, 0.14, portD + 0.4], [0, 0.07, portZ], mats.driveway, { castShadow: false });
  for (const [px, pz] of [[-4.7, verZ], [4.7, verZ], [-4.7, verZ + portD], [4.7, verZ + portD]]) {
    addBox(bldgG, [1.18, portH, 1.18], [px, portH * 0.5, pz], mats.redBrick, { uvScale: 1.45 });
    addBox(bldgG, [1.32, 0.18, 1.32], [px, 3.28, pz], mats.whitePlaster);
  }
  addSemicircularArch(bldgG, {
    span: 8.26,
    height: 2.42,
    depth: 0.64,
    archRise: 1.86,
    pos: [0, 3.28, verZ + portD],
    rotY: 0,
    mat: mats.whitePlaster,
    trimMat: mats.redBrick,
  });
  for (const sx of [-4.7, 4.7]) {
    addSemicircularArch(bldgG, {
      span: portD - 1.14,
      height: 2.42,
      depth: 0.64,
      archRise: 1.66,
      pos: [sx, 3.28, portZ],
      rotY: Math.PI * 0.5,
      mat: mats.whitePlaster,
      trimMat: mats.redBrick,
    });
  }
  addBox(bldgG, [10.8, 0.34, portD + 1.4], [0, portH + 0.17, portZ], mats.redBrick, { uvScale: 1.55 });
  addBox(bldgG, [10.6, 0.94, 0.24], [0, portH + 0.80, verZ + portD + 0.45], mats.whitePlaster);
  addBox(bldgG, [0.24, 0.94, portD + 1.0], [-5.15, portH + 0.80, portZ], mats.whitePlaster);
  addBox(bldgG, [0.24, 0.94, portD + 1.0], [ 5.15, portH + 0.80, portZ], mats.whitePlaster);
  for (const [fx, fz] of [[-5.1, verZ + portD + 0.45], [5.1, verZ + portD + 0.45], [-5.1, verZ], [5.1, verZ]]) {
    addBox(bldgG, [0.70, 1.40, 0.70], [fx, portH + 0.98, fz], mats.redBrick, { uvScale: 1.4 });
    addBox(bldgG, [0.82, 0.14, 0.82], [fx, portH + 1.72, fz], mats.whitePlaster);
  }
  for (let s = 0; s < 3; s++) {
    addBox(bldgG, [5.6, 0.23, 0.42], [0, 0.115 + s * 0.23, verZ - 0.1 + (2 - s) * 0.40], mats.verandaTile);
  }

  // Roof Slab, Parapet & Recessed 2nd-Story Red-Brick Heritage Suite
  addBox(roofGroup, [mainW + 1.0, 0.34, mainD + 1.0], [0, roofY + 0.17, 0], mats.redBrick, { uvScale: 1.6 });
  addBox(roofGroup, [mainW + 0.6, 0.90, 0.28], [0, roofY + 0.75,  mainD * 0.5 + 0.1], mats.whitePlaster);
  addBox(roofGroup, [mainW + 0.6, 0.90, 0.28], [0, roofY + 0.75, -mainD * 0.5 - 0.1], mats.whitePlaster);
  addBox(roofGroup, [0.28, 0.90, mainD + 0.6], [-mainW * 0.5 - 0.1, roofY + 0.75, 0], mats.whitePlaster);
  addBox(roofGroup, [0.28, 0.90, mainD + 0.6], [ mainW * 0.5 + 0.1, roofY + 0.75, 0], mats.whitePlaster);
  for (const fx of [-18.9, -9.6, 9.6, 18.9]) {
    addBox(roofGroup, [0.66, 1.28, 0.66], [fx, roofY + 0.90, mainD * 0.5 + 0.1], mats.redBrick, { uvScale: 1.4 });
    addBox(roofGroup, [0.78, 0.14, 0.78], [fx, roofY + 1.58, mainD * 0.5 + 0.1], mats.whitePlaster);
  }
  const s2x = 5.5, s2z = -2.2, s2W = 21.0, s2D = 10.6, s2H = 3.9;
  addBox(roofGroup, [s2W, s2H, s2D], [s2x, roofY + 0.34 + s2H * 0.5, s2z], mats.redBrick, { uvScale: 1.55 });
  addBox(roofGroup, [s2W + 0.6, 0.28, s2D + 0.6], [s2x, roofY + 0.34 + s2H + 0.14, s2z], mats.whitePlaster);
  addBox(roofGroup, [s2W + 0.4, 0.66, s2D + 0.4], [s2x, roofY + 0.34 + s2H + 0.58, s2z], mats.redBrick, { uvScale: 1.55 });
  for (const wx of [-7.0, -2.4, 2.2, 6.8]) {
    addBox(roofGroup, [2.4, 1.65, 0.18], [s2x + wx, roofY + 2.38, s2z + s2D * 0.5 + 0.05], mats.whitePlaster);
    addBox(roofGroup, [1.95, 1.35, 0.22], [s2x + wx, roofY + 2.38, s2z + s2D * 0.5 + 0.06], mats.glass, { castShadow: false });
  }

  // Furnished VIP Conference Hall Interior
  addBox(bldgG, [10.4, 0.04, 8.4], [0, plinthH + 0.05, -0.8], mats.carpet, { castShadow: false });
  addBox(bldgG, [5.4, 0.78, 2.2], [0, plinthH + 0.39, -1.6], mats.teakWood);
  for (let cx = -2.0; cx <= 2.01; cx += 1.0) {
    for (const cz of [-3.05, -0.15]) {
      addBox(bldgG, [0.52, 0.48, 0.52], [cx, plinthH + 0.24, cz], mats.darkIron);
      addBox(bldgG, [0.52, 0.52, 0.10], [cx, plinthH + 0.68, cz + (cz < -1.6 ? -0.22 : 0.22)], mats.teakWood);
    }
  }
  addCyl(roofGroup, 0.04, 0.04, 1.2, [0, roofY - 0.6, -1.6], mats.goldMat, 10);
  const chanRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.05, 8, 24), mats.goldMat);
  chanRing.rotation.x = Math.PI * 0.5;
  chanRing.position.set(0, roofY - 1.25, -1.6);
  roofGroup.add(chanRing);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), mats.ledGlow);
    bulb.position.set(Math.cos(a) * 0.95, roofY - 1.15, -1.6 + Math.sin(a) * 0.95);
    roofGroup.add(bulb);
  }

  /* ============================================================================
   * 4. CEREMONIAL FLAGPOLE & CAMPUS LAMP POSTS (Trees loaded as high-res 3D GLB!)
   * ========================================================================== */
  const fx = BLDG_X - 10.4;
  const fz = 2.6;
  addBox(root, [4.6, 0.42, 3.8], [fx, 0.21, fz], mats.redBrick, { uvScale: 1.45 });
  addBox(root, [4.8, 0.08, 4.0], [fx, 0.45, fz], mats.whitePlaster);
  addCyl(root, 0.055, 0.095, 9.8, [fx, 5.35, fz], mats.chromeMat, 14);
  const flagPivot = new THREE.Group();
  flagPivot.position.set(fx, 9.55, fz);
  addBox(flagPivot, [2.2, 1.32, 0.04], [1.12, 0, 0], mats.flagGreen);
  const flagSun = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.055, 18), mats.flagRed);
  flagSun.rotation.x = Math.PI * 0.5;
  flagSun.position.set(0.98, 0, 0);
  flagPivot.add(flagSun);
  root.add(flagPivot);

  // Ornamental Campus Lamp Posts along the Left-Turning Entrance Driveway
  for (const [lx, lz] of [
    [GATE_X - 2.5, 12.2],
    [GATE_X - 9.2,  8.8],
    [BLDG_X + 7.2,  6.8],
    [BLDG_X - 7.5,  6.8],
  ]) {
    addCyl(root, 0.06, 0.09, 3.8, [lx, 1.9, lz], mats.darkIron, 10);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.20, 12, 10), mats.ledGlow);
    globe.position.set(lx, 3.95, lz);
    root.add(globe);
  }

  // Exact real-world tree placement coordinates (loaded with real high-detail 3D tree GLB in preview!)
  const treeSpots = [
    { x: GATE_X - 13.5, z: 14.5, h: 11.5, rotY: 0.4 },
    { x: GATE_X + 12.2, z: 14.2, h: 12.2, rotY: 1.7 },
    { x: GATE_X +  6.5, z:  4.5, h: 10.8, rotY: 2.5 },
    { x: BLDG_X - 22.5, z:  7.0, h: 11.2, rotY: 0.9 },
    { x: BLDG_X + 22.5, z: -4.0, h: 12.0, rotY: 3.8 },
    { x: BLDG_X - 23.0, z: -12.0, h: 11.8, rotY: 5.1 },
  ];

  return {
    root,
    flagPivot,
    treeSpots,
    setCutaway(enabled) {
      roofGroup.visible = !enabled;
    },
    update(time) {
      flagPivot.rotation.y = Math.sin(time * 2.1) * 0.18 + Math.cos(time * 1.1) * 0.08;
    },
  };
}
