import * as THREE from 'three';

/**
 * KHULNA CIRCUIT HOUSE (খুলনা সার্কিট হাউস) — ULTRA-REALISTIC STANDALONE 3D MODEL
 *
 * Faithfully modeled from:
 *  1) Real Google Street View of Khulna Circuit House Main Gate (K.D. Ghos Rd, Khulna):
 *     - Bold modernist slanted cantilevered concrete canopy with charcoal fascia & recessed LED downlights
 *     - 4 cylindrical grey concrete support columns
 *     - Left exposed red-brick monument wall with recessed grey panel, raised bronze-gold Bengali lettering
 *       ("খুলনা সার্কিট হাউস · খুলনা") & black granite inauguration plaque
 *     - Grey plastered Security Guard Room tucked behind the left brick pier
 *     - Right exposed red-brick gate pier with pedestrian wicket portal & openable steel gate leaves
 *     - Low grey plinth boundary wall with dark-green vertical tubular palisade fence
 *     - Historic grey stone Liberation War memorial monument ("একাত্তরের নির্যাতন কেন্দ্র") on the left
 *  2) Real 1922 Heritage Khulna Circuit House Building (British Colonial Red-Brick Bungalow):
 *     - Dark charcoal plinth base + exposed red-brick piers & true ExtrudeGeometry semicircular arches
 *     - Crisp white-painted arch spandrels, classical slatted white veranda balustrades & tiled verandas
 *     - Grand projecting arched car portico (porte-cochère) with baluster parapet & 4 corner finial piers
 *     - Recessed 2nd-story red-brick heritage roof suite with white clerestory bands & cornice
 *     - Walkable central VIP Reception / Conference Hall interior with warm chandeliers, teak furniture & fans
 *     - Raised red-brick ceremonial podium with Bangladesh National Flagpole, manicured lawn & tropical trees
 */

function seeded(seed = 192201) {
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

function makeRedBrickTexture(seedVal = 1922) {
  const c = makeCanvas(512, 512);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = '#c8bfb4'; // Mortar joints
  ctx.fillRect(0, 0, 512, 512);
  const rows = 16;
  const cols = 8;
  const bh = 512 / rows;
  const bw = 512 / cols;
  for (let r = 0; r < rows; r++) {
    const xOff = (r % 2) * (bw * 0.5);
    for (let col = -1; col <= cols; col++) {
      const bx = col * bw + xOff;
      const by = r * bh;
      const R = 148 + Math.floor((rnd() - 0.5) * 34);
      const G = 64 + Math.floor((rnd() - 0.5) * 18);
      const B = 44 + Math.floor((rnd() - 0.5) * 14);
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fillRect(bx + 2.5, by + 2.5, bw - 5, bh - 5);
      // Subtle top highlight & monsoon grit
      ctx.fillStyle = 'rgba(255,220,200,0.08)';
      ctx.fillRect(bx + 3, by + 3, bw - 6, 4);
      for (let k = 0; k < 5; k++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(35,16,10,0.14)' : 'rgba(240,210,190,0.07)';
        ctx.fillRect(bx + 4 + rnd() * (bw - 10), by + 4 + rnd() * (bh - 10), 3, 2);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeConcreteTexture(baseHex = '#a8aba6', seedVal = 2024) {
  const c = makeCanvas(512, 512);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6500; i++) {
    const dark = rnd() > 0.45;
    ctx.fillStyle = dark ? `rgba(38,40,36,${0.04 + rnd() * 0.08})` : `rgba(255,255,255,${0.04 + rnd() * 0.06})`;
    ctx.fillRect(rnd() * 512, rnd() * 512, 2 + rnd() * 4, 2 + rnd() * 4);
  }
  // Subtle monsoon rain weathering streaks
  for (let i = 0; i < 28; i++) {
    const x = rnd() * 512;
    const h = 40 + rnd() * 140;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(34,38,32,0.14)');
    g.addColorStop(1, 'rgba(34,38,32,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 3 + rnd() * 7, h);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeDrivewayTexture(seedVal = 5151) {
  const c = makeCanvas(512, 512);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = '#7e7670';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    const v = 90 + Math.floor(rnd() * 55);
    ctx.fillStyle = `rgba(${v + 6},${v},${v - 4},0.28)`;
    ctx.fillRect(rnd() * 512, rnd() * 512, 2 + rnd() * 3, 2 + rnd() * 3);
  }
  // Subtle reddish-earth dusty patches near edges
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = 'rgba(130,88,68,0.10)';
    ctx.beginPath();
    ctx.arc(rnd() * 512, rnd() * 512, 16 + rnd() * 38, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeGrassTexture(seedVal = 8844) {
  const c = makeCanvas(512, 512);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = '#477c34';
  ctx.fillRect(0, 0, 512, 512);
  for (let s = 0; s < 8; s++) {
    ctx.fillStyle = s % 2 === 0 ? 'rgba(92,148,62,0.18)' : 'rgba(38,76,28,0.16)';
    ctx.fillRect(0, s * 64, 512, 64);
  }
  for (let i = 0; i < 10000; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(128,176,84,0.28)' : 'rgba(36,72,24,0.28)';
    ctx.fillRect(rnd() * 512, rnd() * 512, 1.6, 3.5 + rnd() * 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeGatePanelSignTexture() {
  const c = makeCanvas(512, 640);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(2026);
  // Smooth weathered light-grey concrete inner panel (exact match to Street View!)
  ctx.fillStyle = '#a4a7a4';
  ctx.fillRect(0, 0, 512, 640);
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(30,32,28,0.06)';
    ctx.fillRect(rnd() * 512, rnd() * 640, 2, 2);
  }
  // Raised metallic bronze-gold Bengali lettering: "খুলনা সার্কিট হাউস / খুলনা"
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 54px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(20,16,10,0.55)';
  ctx.fillText('খুলনা সার্কিট হাউস', 259, 134);
  ctx.fillStyle = '#c89e52';
  ctx.fillText('খুলনা সার্কিট হাউস', 256, 130);

  ctx.font = 'bold 42px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(20,16,10,0.55)';
  ctx.fillText('খুলনা', 259, 198);
  ctx.fillStyle = '#c89e52';
  ctx.fillText('খুলনা', 256, 194);

  // Black Granite Foundation Inauguration Plaque mounted below!
  ctx.fillStyle = '#18181b';
  ctx.fillRect(142, 315, 228, 162);
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 4;
  ctx.strokeRect(142, 315, 228, 162);

  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 21px "Noto Sans Bengali", sans-serif';
  ctx.fillText('খুলনা সার্কিট হাউস গেট', 256, 355);
  ctx.fillStyle = '#e5e7eb';
  ctx.font = '600 15px "Noto Sans Bengali", sans-serif';
  ctx.fillText('গণপূর্ত বিভাগ-১, খুলনা', 256, 392);
  ctx.fillText('খুলনা জেলা প্রশাসন', 256, 422);
  ctx.fillStyle = '#d4af37';
  ctx.font = '600 13px "Manrope", sans-serif';
  ctx.fillText('KHULNA CIRCUIT HOUSE · K.D. GHOS RD', 256, 452);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeMemorialPlaqueTexture() {
  const c = makeCanvas(512, 512);
  if (!c) return null;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, 492, 492);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#991b1b';
  ctx.font = 'bold 34px "Noto Sans Bengali", sans-serif';
  ctx.fillText('একাত্তরের নির্যাতন কেন্দ্র', 256, 78);
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 24px "Noto Sans Bengali", sans-serif';
  ctx.fillText('খুলনা সার্কিট হাউস · ১৯৭১', 256, 126);
  ctx.fillStyle = '#334155';
  ctx.font = '600 19px "Noto Sans Bengali", sans-serif';
  const lines = [
    'মহান মুক্তিযুদ্ধের স্মৃতিবিজড়িত',
    'ঐতিহাসিক খুলনা সার্কিট হাউস প্রাঙ্গণ।',
    '১৯৭১ সালে স্বাধীনতা সংগ্রামে',
    'শহীদ বীর মুক্তিযোদ্ধা ও নিরীহ',
    'মানুষের স্মৃতির প্রতি গভীর শ্রদ্ধা।',
  ];
  lines.forEach((ln, idx) => {
    ctx.fillText(ln, 256, 198 + idx * 44);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
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

function addCyl(parent, rt, rb, h, pos, mat, seg = 16) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * True smooth semicircular colonial arch spandrel (zero blocky rectangular arches!)
 */
function addSemicircularArch(parent, { span, height, depth, archRise, pos, rotY = 0, mat, trimMat = null }) {
  const hw = span * 0.5;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, 0);
  shape.lineTo(-hw, height);
  shape.lineTo(hw, height);
  shape.lineTo(hw, 0);
  const segs = 18;
  for (let i = 0; i <= segs; i++) {
    const ang = (i / segs) * Math.PI;
    shape.lineTo(Math.cos(ang) * hw, Math.sin(ang) * archRise);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 12 });
  geo.translate(0, 0, -depth * 0.5);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.y = rotY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  // Red-brick semicircular arch trim ring (extrados) around the arch curve (exact match to 1922 Circuit House!)
  if (trimMat) {
    const ringShape = new THREE.Shape();
    const rOut = hw + 0.14;
    const rIn = hw - 0.04;
    for (let i = 0; i <= segs; i++) {
      const ang = (i / segs) * Math.PI;
      const x = Math.cos(ang) * rOut;
      const y = Math.sin(ang) * (archRise + 0.14);
      if (i === 0) ringShape.moveTo(x, y);
      else ringShape.lineTo(x, y);
    }
    for (let i = segs; i >= 0; i--) {
      const ang = (i / segs) * Math.PI;
      ringShape.lineTo(Math.cos(ang) * rIn, Math.sin(ang) * (archRise - 0.04));
    }
    ringShape.closePath();
    const rGeo = new THREE.ExtrudeGeometry(ringShape, { depth: depth + 0.08, bevelEnabled: false });
    rGeo.translate(0, 0, -(depth + 0.08) * 0.5);
    const rMesh = new THREE.Mesh(rGeo, trimMat);
    rMesh.position.set(pos[0], pos[1], pos[2]);
    rMesh.rotation.y = rotY;
    rMesh.castShadow = true;
    parent.add(rMesh);
  }
  return mesh;
}

/**
 * Adds a realistic tropical rain-tree / mahogany tree (slim trunk + layered airy foliage)
 */
function addTropicalTree(parent, x, z, scale = 1.0, trunkMat, leafMat1, leafMat2, seedVal = 1) {
  const rnd = seeded(seedVal);
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const h = 4.6 * scale;
  addCyl(g, 0.16 * scale, 0.28 * scale, h, [0, h * 0.5, 0], trunkMat, 8);
  const puffs = [
    [0, h + 1.1 * scale, 0, 2.3 * scale, leafMat1],
    [-1.4 * scale, h + 0.6 * scale, 0.8 * scale, 1.75 * scale, leafMat2],
    [1.5 * scale, h + 0.7 * scale, -0.7 * scale, 1.85 * scale, leafMat1],
    [0.4 * scale, h + 1.6 * scale, 1.1 * scale, 1.6 * scale, leafMat2],
    [-0.9 * scale, h + 1.4 * scale, -1.2 * scale, 1.55 * scale, leafMat1],
  ];
  for (const [px, py, pz, r, mat] of puffs) {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), mat);
    m.position.set(px + (rnd() - 0.5) * 0.3, py, pz + (rnd() - 0.5) * 0.3);
    m.scale.set(1.15, 0.78, 1.15);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  parent.add(g);
}

export function buildKhulnaCircuitHouseStandalone3D() {
  const root = new THREE.Group();
  root.name = 'KhulnaCircuitHouse_3D_Complex';

  const brickTex = makeRedBrickTexture(1922);
  const concTex = makeConcreteTexture('#a7aba6', 2024);
  const darkConcTex = makeConcreteTexture('#585e62', 2025);
  const whiteTex = makeConcreteTexture('#f4f2ec', 2026);
  const driveTex = makeDrivewayTexture(5151);
  const grassTex = makeGrassTexture(8844);
  const gateSignTex = makeGatePanelSignTexture();
  const memorialTex = makeMemorialPlaqueTexture();

  const mats = {
    redBrick: new THREE.MeshStandardMaterial({ map: brickTex, color: brickTex ? 0xffffff : 0x9e4330, roughness: 0.86, metalness: 0.04 }),
    greyConcrete: new THREE.MeshStandardMaterial({ map: concTex, color: concTex ? 0xffffff : 0xa5a9a4, roughness: 0.82, metalness: 0.05 }),
    darkFascia: new THREE.MeshStandardMaterial({ map: darkConcTex, color: darkConcTex ? 0xffffff : 0x4b5258, roughness: 0.72, metalness: 0.12 }),
    whitePlaster: new THREE.MeshStandardMaterial({ map: whiteTex, color: whiteTex ? 0xffffff : 0xf4f2ec, roughness: 0.76, metalness: 0.02 }),
    charcoalPlinth: new THREE.MeshStandardMaterial({ color: 0x26292d, roughness: 0.88, metalness: 0.06 }),
    greenFence: new THREE.MeshStandardMaterial({ color: 0x175a31, roughness: 0.42, metalness: 0.62 }),
    steelGate: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.36, metalness: 0.76 }),
    darkIron: new THREE.MeshStandardMaterial({ color: 0x1e242b, roughness: 0.44, metalness: 0.72 }),
    driveway: new THREE.MeshStandardMaterial({ map: driveTex, color: driveTex ? 0xffffff : 0x7d7670, roughness: 0.88, metalness: 0.03 }),
    asphalt: new THREE.MeshStandardMaterial({ color: 0x3b3f45, roughness: 0.86, metalness: 0.05 }),
    grass: new THREE.MeshStandardMaterial({ map: grassTex, color: grassTex ? 0xffffff : 0x457b33, roughness: 0.92, metalness: 0.01 }),
    verandaTile: new THREE.MeshStandardMaterial({ color: 0xded8cc, roughness: 0.45, metalness: 0.05 }),
    teakWood: new THREE.MeshStandardMaterial({ color: 0x6f3e1e, roughness: 0.56, metalness: 0.04 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x1d3f52, roughness: 0.10, metalness: 0.20, clearcoat: 0.9, transparent: true, opacity: 0.82 }),
    ledGlow: new THREE.MeshStandardMaterial({ color: 0xfff8e6, emissive: 0xffdf99, emissiveIntensity: 1.5, roughness: 0.2 }),
    goldMat: new THREE.MeshStandardMaterial({ color: 0xd4a644, roughness: 0.28, metalness: 0.86 }),
    chromeMat: new THREE.MeshStandardMaterial({ color: 0xdce3ec, roughness: 0.20, metalness: 0.90 }),
    flagGreen: new THREE.MeshStandardMaterial({ color: 0x006a4e, roughness: 0.72, side: THREE.DoubleSide }),
    flagRed: new THREE.MeshStandardMaterial({ color: 0xf42a41, roughness: 0.68, side: THREE.DoubleSide }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x5c402d, roughness: 0.92 }),
    leaf1: new THREE.MeshStandardMaterial({ color: 0x266b32, roughness: 0.82 }),
    leaf2: new THREE.MeshStandardMaterial({ color: 0x358240, roughness: 0.80 }),
    carpet: new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.92 }),
    gateSignPanel: new THREE.MeshStandardMaterial({ map: gateSignTex, color: 0xffffff, roughness: 0.65, metalness: 0.08 }),
    memorialPanel: new THREE.MeshStandardMaterial({ map: memorialTex, color: 0xffffff, roughness: 0.70 }),
  };

  /* ============================================================================
   * 1. COMPOUND GROUNDS, K.D. GHOS ROAD FRONTAGE & PAVED DRIVEWAY
   *    Coordinate System:
   *      Z = +26  -> K.D. Ghos Road (Front Street View)
   *      Z = +18  -> Khulna Circuit House Main Gate (Slanted Canopy & Brick Piers)
   *      Z = -8   -> Heritage 1922 Khulna Circuit House Building (facing +Z toward Gate!)
   * ========================================================================== */
  // Lush Compound Lawn
  addBox(root, [68.0, 0.16, 62.0], [0, -0.08, -2.0], mats.grass, { castShadow: false, uvScale: 8.0 });
  // K.D. Ghos Road outside the Main Gate (Z = +22.5 .. +31.5)
  addBox(root, [68.0, 0.12, 9.0], [0, -0.04, 27.0], mats.asphalt, { castShadow: false });
  // Road shoulder curb & footpath outside gate
  addBox(root, [68.0, 0.16, 3.8], [0, 0.01, 20.8], mats.driveway, { castShadow: false, uvScale: 3.5 });
  // Main Entrance Paved Driveway from K.D. Ghos Rd -> Under Canopy -> Circular Forecourt -> Car Portico!
  addBox(root, [11.6, 0.10, 26.0], [1.6, 0.02, 10.5], mats.driveway, { castShadow: false, uvScale: 3.6 });
  // Broad Circular/Elliptical Turning Apron right in front of the Heritage Building Portico
  const apron = new THREE.Mesh(new THREE.CylinderGeometry(11.5, 11.8, 0.10, 36), mats.driveway);
  apron.position.set(0, 0.02, 2.0);
  apron.receiveShadow = true;
  root.add(apron);
  // Central manicured circular flower island inside the turning apron
  const island = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.1, 0.24, 28), mats.redBrick);
  island.position.set(0, 0.12, 3.2);
  island.receiveShadow = true;
  root.add(island);
  const islandGrass = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 0.28, 28), mats.grass);
  islandGrass.position.set(0, 0.14, 3.2);
  root.add(islandGrass);

  /* ============================================================================
   * 2. KHULNA CIRCUIT HOUSE MAIN GATE (Z = +18.2) — EXACT MATCH TO STREET VIEW!
   * ========================================================================== */
  const gateG = new THREE.Group();
  gateG.name = 'CircuitHouse_MainGate';
  gateG.position.set(0, 0, 18.2);
  root.add(gateG);

  // A) ICONIC MODERNIST SLANTED CANTILEVERED CONCRETE CANOPY
  //    Slopes upward toward the Left (-X, higher at ~6.4m) and lower on the Right (+X, ~4.7m), just like the photo!
  const canopyShape = new THREE.Shape();
  canopyShape.moveTo(-7.8, 5.75); // Left high cantilever tip
  canopyShape.lineTo(10.6, 4.35); // Right lower tip
  canopyShape.lineTo(10.6, 4.78); // Right top edge
  canopyShape.lineTo(-7.8, 6.52); // Left high top edge (thicker sculpted wedge profile!)
  canopyShape.closePath();

  const canopyDepth = 6.2;
  const canopyGeo = new THREE.ExtrudeGeometry(canopyShape, { depth: canopyDepth, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2 });
  canopyGeo.translate(0, 0, -canopyDepth * 0.5);
  const canopyMesh = new THREE.Mesh(canopyGeo, mats.greyConcrete);
  canopyMesh.castShadow = true;
  canopyMesh.receiveShadow = true;
  gateG.add(canopyMesh);

  // Crisp Dark-Grey Architectural Fascia Trim along Front & Back of the Slanted Canopy
  const fasciaShape = new THREE.Shape();
  fasciaShape.moveTo(-7.9, 5.70);
  fasciaShape.lineTo(10.7, 4.30);
  fasciaShape.lineTo(10.7, 4.82);
  fasciaShape.lineTo(-7.9, 6.58);
  fasciaShape.closePath();
  const fasciaGeo = new THREE.ExtrudeGeometry(fasciaShape, { depth: 0.14, bevelEnabled: false });
  for (const fz of [canopyDepth * 0.5 + 0.02, -canopyDepth * 0.5 - 0.16]) {
    const fm = new THREE.Mesh(fasciaGeo, mats.darkFascia);
    fm.position.z = fz;
    gateG.add(fm);
  }

  // Rows of Recessed Circular Warm LED Downlights on the Canopy Underside!
  for (let lx = -4.5; lx <= 8.5; lx += 3.25) {
    const t = (lx - (-7.8)) / (10.6 - (-7.8));
    const ly = THREE.MathUtils.lerp(5.74, 4.34, t);
    for (const lz of [-1.4, 1.4]) {
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 12), mats.ledGlow);
      lamp.position.set(lx, ly - 0.02, lz);
      gateG.add(lamp);
    }
  }

  // 4 Sleek Cylindrical Grey Concrete Support Columns holding up the Slanted Canopy
  for (const [cx, cz, h] of [
    [-3.2, -1.6, 5.55],
    [-3.2,  1.4, 5.55],
    [ 6.2, -1.6, 4.80],
    [ 6.2,  1.4, 4.80],
  ]) {
    addCyl(gateG, 0.28, 0.32, h, [cx, h * 0.5, cz], mats.greyConcrete, 16);
  }

  // B) LEFT GRAND EXPOSED RED-BRICK MONUMENT WALL (X = -6.2 .. -1.6, H = 4.35m)
  //    Red brick surround + recessed light-grey inner panel + "খুলনা সার্কিট হাউস / খুলনা" + Black Granite Plaque!
  addBox(gateG, [4.6, 4.35, 0.64], [-3.9, 2.175, 0.45], mats.redBrick, { uvScale: 2.0 });
  // Smooth concrete cap coping
  addBox(gateG, [4.76, 0.12, 0.74], [-3.9, 4.40, 0.45], mats.greyConcrete);
  // Recessed inner panel with authentic Bengali signage & black granite inauguration plaque
  addBox(gateG, [2.75, 3.65, 0.08], [-3.85, 2.02, 0.76], mats.gateSignPanel, { castShadow: false });
  // Side return brick pier depth on driveway edge
  addBox(gateG, [0.75, 4.35, 1.35], [-1.75, 2.175, 0.15], mats.redBrick, { uvScale: 2.0 });

  // C) SECURITY GUARD ROOM / SENTRY POST TUCKED BEHIND LEFT BRICK PIER (exact match to photo!)
  addBox(gateG, [3.6, 2.95, 3.4], [-5.2, 1.475, -1.75], mats.greyConcrete, { uvScale: 2.5 });
  addBox(gateG, [4.1, 0.20, 3.9], [-5.2, 3.04, -1.75], mats.darkFascia);
  addBox(gateG, [1.3, 1.15, 0.10], [-5.2, 1.78, -0.02], mats.glass, { castShadow: false });
  addBox(gateG, [1.45, 0.10, 0.22], [-5.2, 2.40, 0.04], mats.darkIron);
  addBox(gateG, [0.10, 2.15, 1.05], [-3.38, 1.08, -2.05], mats.darkIron); // Guard door facing driveway

  // D) RIGHT EXPOSED RED-BRICK GATE PIER + PEDESTRIAN WICKET PORTAL (X = +5.6 .. +9.2)
  addBox(gateG, [1.15, 3.65, 1.15], [5.85, 1.825, 0.15], mats.redBrick, { uvScale: 2.0 });
  addBox(gateG, [1.28, 0.12, 1.28], [5.85, 3.70, 0.15], mats.greyConcrete);
  // Overhead red-brick lintel over pedestrian wicket bay (X = 5.85 .. 8.85)
  addBox(gateG, [3.2, 0.65, 0.88], [7.35, 3.32, 0.15], mats.redBrick, { uvScale: 2.0 });
  addBox(gateG, [1.05, 3.65, 1.05], [8.85, 1.825, 0.15], mats.redBrick, { uvScale: 2.0 });
  addBox(gateG, [1.18, 0.12, 1.18], [8.85, 3.70, 0.15], mats.greyConcrete);

  // E) SILVER-GREY TUBULAR STEEL MAIN GATE LEAVES (partially open so driveway is inviting!) & WICKET GATE
  const buildSteelGateLeaf = (w, h, x, z, rotY) => {
    const lg = new THREE.Group();
    lg.position.set(x, 0, z);
    lg.rotation.y = rotY;
    addBox(lg, [w, 0.08, 0.08], [w * 0.5, 0.20, 0], mats.steelGate);
    addBox(lg, [w, 0.08, 0.08], [w * 0.5, h - 0.10, 0], mats.steelGate);
    addBox(lg, [w, 0.07, 0.07], [w * 0.5, h * 0.50, 0], mats.steelGate);
    for (let bx = 0.12; bx <= w - 0.10; bx += 0.22) {
      addBox(lg, [0.04, h - 0.16, 0.04], [bx, h * 0.5, 0], mats.steelGate);
    }
    gateG.add(lg);
  };
  // Left & Right main driveway steel gates swung inward open!
  buildSteelGateLeaf(3.2, 2.35, -1.35, -0.35, -1.32);
  buildSteelGateLeaf(3.2, 2.35,  5.25, -0.35,  Math.PI + 1.32);
  // Pedestrian wicket gate inside right red-brick portal
  buildSteelGateLeaf(1.85, 2.35, 6.45, 0.15, -0.35);

  // F) GREEN VERTICAL TUBULAR BOUNDARY FENCE + LOW GREY PLINTH (Left & Right of Main Gate!)
  const addBoundaryFenceSpan = (x0, x1) => {
    const len = Math.abs(x1 - x0);
    const mx = (x0 + x1) * 0.5;
    addBox(gateG, [len, 0.65, 0.34], [mx, 0.325, 0.20], mats.greyConcrete, { uvScale: 2.2 });
    addBox(gateG, [len + 0.06, 0.10, 0.42], [mx, 0.68, 0.20], mats.whitePlaster);
    // Green iron fence rails & vertical bars
    addBox(gateG, [len, 0.06, 0.06], [mx, 2.25, 0.20], mats.greenFence);
    addBox(gateG, [len, 0.05, 0.05], [mx, 1.48, 0.20], mats.greenFence);
    addBox(gateG, [len, 0.05, 0.05], [mx, 0.82, 0.20], mats.greenFence);
    const barCount = Math.floor(len / 0.22);
    for (let i = 0; i <= barCount; i++) {
      const bx = x0 + (x1 - x0) * (i / Math.max(1, barCount));
      addBox(gateG, [0.035, 1.55, 0.035], [bx, 1.50, 0.20], mats.greenFence);
    }
    // Concrete fence posts every 4.5m
    for (let px = x0; px <= x1 + 0.05; px += 4.5) {
      addBox(gateG, [0.34, 2.45, 0.38], [px, 1.225, 0.20], mats.greyConcrete);
    }
  };
  addBoundaryFenceSpan(-32.0, -11.4);
  addBoundaryFenceSpan(-8.4, -6.2);
  addBoundaryFenceSpan(9.4, 32.0);

  // G) HISTORIC LIBERATION WAR MEMORIAL PILLAR ("একাত্তরের নির্যাতন কেন্দ্র") ON THE LEFT OF GATE!
  addBox(gateG, [2.75, 2.65, 0.65], [-9.9, 1.325, 0.28], mats.greyConcrete, { uvScale: 2.0 });
  addBox(gateG, [2.95, 0.16, 0.82], [-9.9, 2.72, 0.28], mats.darkFascia);
  addBox(gateG, [2.25, 2.05, 0.06], [-9.9, 1.38, 0.62], mats.memorialPanel, { castShadow: false });

  /* ============================================================================
   * 3. REAL 1922 HERITAGE KHULNA CIRCUIT HOUSE BUILDING (Z = -11.5, facing +Z)
   *    Exact match to PWD photograph: Red-brick arched colonnade, white spandrels,
   *    white slatted veranda balustrades, dark plinth, projecting arched car portico,
   *    and recessed 2nd-story red-brick heritage roof suite!
   * ========================================================================== */
  const bldgG = new THREE.Group();
  bldgG.name = 'CircuitHouse_HeritageBuilding';
  bldgG.position.set(0, 0, -11.5);
  root.add(bldgG);

  const mainW = 38.0; // Wide grand colonial bungalow facade
  const mainD = 16.5;
  const plinthH = 0.68;
  const floor1H = 4.65;
  const roofY = plinthH + floor1H; // 5.33m

  // A) Dark Charcoal Colonial Plinth Base + Raised Veranda Floor
  addBox(bldgG, [mainW + 0.8, plinthH, mainD + 0.8], [0, plinthH * 0.5, 0], mats.charcoalPlinth);
  addBox(bldgG, [mainW + 0.2, 0.06, mainD + 0.2], [0, plinthH + 0.02, 0], mats.verandaTile, { castShadow: false });

  // B) Inner Building Structural Core (recessed behind the 2.8m-deep front arched colonnade veranda!)
  const coreZ = -1.6;
  const coreD = mainD - 3.6; // 12.9m deep interior rooms
  const frontWallZ = coreZ + coreD * 0.5; // +4.85m
  // Left & Right Wings + Rear Wall (hollow central VIP Reception Hall for cutaway/walkthrough!)
  const roofGroup = new THREE.Group();
  bldgG.add(roofGroup);

  // Back wall, Left & Right exterior walls
  addBox(bldgG, [mainW - 0.6, floor1H, 0.42], [0, plinthH + floor1H * 0.5, -mainD * 0.5 + 0.21], mats.redBrick, { uvScale: 2.2 });
  addBox(bldgG, [0.42, floor1H, coreD], [-mainW * 0.5 + 0.21, plinthH + floor1H * 0.5, coreZ], mats.redBrick, { uvScale: 2.2 });
  addBox(bldgG, [0.42, floor1H, coreD], [ mainW * 0.5 - 0.21, plinthH + floor1H * 0.5, coreZ], mats.redBrick, { uvScale: 2.2 });

  // Front Interior Wall facing the Veranda (wide open double teak doorway at center X = -1.6..+1.6!)
  addBox(bldgG, [16.8, floor1H, 0.36], [-10.0, plinthH + floor1H * 0.5, frontWallZ], mats.whitePlaster, { uvScale: 2.5 });
  addBox(bldgG, [16.8, floor1H, 0.36], [ 10.0, plinthH + floor1H * 0.5, frontWallZ], mats.whitePlaster, { uvScale: 2.5 });
  addBox(bldgG, [3.6, floor1H - 3.1, 0.36], [0, plinthH + 3.1 + (floor1H - 3.1) * 0.5, frontWallZ], mats.whitePlaster);
  // Carved teak double entrance doors swung open + colonial shuttered windows along the veranda wall
  addBox(bldgG, [0.09, 3.05, 1.45], [-1.62, plinthH + 1.525, frontWallZ - 0.72], mats.teakWood);
  addBox(bldgG, [0.09, 3.05, 1.45], [ 1.62, plinthH + 1.525, frontWallZ - 0.72], mats.teakWood);
  for (const wx of [-14.2, -9.8, -5.4, 5.4, 9.8, 14.2]) {
    addBox(bldgG, [1.85, 2.25, 0.14], [wx, plinthH + 2.05, frontWallZ + 0.12], mats.teakWood);
    addBox(bldgG, [1.52, 1.92, 0.18], [wx, plinthH + 2.05, frontWallZ + 0.12], mats.glass, { castShadow: false });
  }

  // C) FRONT ARCHED COLONNADE VERANDA (Z = +8.05) — 4 Arches Left + 4 Arches Right (Exact 1922 Photo!)
  const verZ = mainD * 0.5 - 0.25; // +8.0m
  const baySpecs = [
    -16.2, -11.8, -7.4, // Left wing 3 grand arches (plus portico side)
      7.4,  11.8, 16.2, // Right wing 3 grand arches
  ];
  const baySpan = 4.4;
  // Red-brick colonnade piers between every arch
  for (const px of [-18.4, -14.0, -9.6, -5.2, 5.2, 9.6, 14.0, 18.4]) {
    addBox(bldgG, [0.82, floor1H, 0.82], [px, plinthH + floor1H * 0.5, verZ], mats.redBrick, { uvScale: 1.8 });
    addBox(bldgG, [0.94, 0.16, 0.94], [px, plinthH + 2.85, verZ], mats.whitePlaster); // Classical impost cap
  }
  // Semicircular Arches with Crisp White Spandrels + Red-Brick Extrados + White Slatted Balustrades!
  for (const bx of baySpecs) {
    addSemicircularArch(bldgG, {
      span: baySpan - 0.78,
      height: 1.80,
      depth: 0.46,
      archRise: 1.32,
      pos: [bx, plinthH + 2.85, verZ],
      rotY: 0,
      mat: mats.whitePlaster,
      trimMat: mats.redBrick,
    });
    // White classical slatted veranda balustrade railing (matching photo's bright white railings!)
    addBox(bldgG, [baySpan - 0.76, 0.12, 0.24], [bx, plinthH + 0.08, verZ], mats.whitePlaster);
    addBox(bldgG, [baySpan - 0.76, 0.14, 0.26], [bx, plinthH + 0.96, verZ], mats.whitePlaster);
    for (let sx = -1.45; sx <= 1.46; sx += 0.36) {
      addBox(bldgG, [0.14, 0.78, 0.16], [bx + sx, plinthH + 0.52, verZ], mats.whitePlaster);
    }
  }

  // D) GRAND CENTRAL PROJECTING ARCHED CAR PORTICO (PORTE-COCHÈRE, Z = +8.0 .. +14.2)
  const portD = 6.2;
  const portZ = verZ + portD * 0.5; // +11.1m
  const portH = 5.65;
  // Wide Portico Driveway Slab (flush with driveway for VIP cars to drive right underneath!)
  addBox(bldgG, [9.8, 0.16, portD + 0.4], [0, 0.08, portZ], mats.driveway, { castShadow: false });
  // 4 Grand Exposed Red-Brick Corner Piers of the Portico with White Horizontal Impost Bands
  for (const [px, pz] of [[-4.7, verZ], [4.7, verZ], [-4.7, verZ + portD], [4.7, verZ + portD]]) {
    addBox(bldgG, [1.15, portH, 1.15], [px, portH * 0.5, pz], mats.redBrick, { uvScale: 1.8 });
    addBox(bldgG, [1.28, 0.18, 1.28], [px, 3.25, pz], mats.whitePlaster);
  }
  // Front Grand Semicircular Car Arch (facing +Z)
  addSemicircularArch(bldgG, {
    span: 8.3,
    height: 2.40,
    depth: 0.62,
    archRise: 1.85,
    pos: [0, 3.25, verZ + portD],
    rotY: 0,
    mat: mats.whitePlaster,
    trimMat: mats.redBrick,
  });
  // Left & Right Drive-Through Semicircular Side Arches on the Portico!
  for (const sx of [-4.7, 4.7]) {
    addSemicircularArch(bldgG, {
      span: portD - 1.1,
      height: 2.40,
      depth: 0.62,
      archRise: 1.65,
      pos: [sx, 3.25, portZ],
      rotY: Math.PI * 0.5,
      mat: mats.whitePlaster,
      trimMat: mats.redBrick,
    });
  }
  // Portico Roof Slab + Crisp White Baluster Parapet + 4 Red-Brick Corner Finial Piers (exact photo match!)
  addBox(bldgG, [10.8, 0.34, portD + 1.4], [0, portH + 0.17, portZ], mats.redBrick, { uvScale: 2.0 });
  addBox(bldgG, [10.6, 0.92, 0.24], [0, portH + 0.78, verZ + portD + 0.45], mats.whitePlaster);
  addBox(bldgG, [0.24, 0.92, portD + 1.0], [-5.15, portH + 0.78, portZ], mats.whitePlaster);
  addBox(bldgG, [0.24, 0.92, portD + 1.0], [ 5.15, portH + 0.78, portZ], mats.whitePlaster);
  for (const [fx, fz] of [[-5.1, verZ + portD + 0.45], [5.1, verZ + portD + 0.45], [-5.1, verZ], [5.1, verZ]]) {
    addBox(bldgG, [0.68, 1.38, 0.68], [fx, portH + 0.95, fz], mats.redBrick, { uvScale: 1.6 });
    addBox(bldgG, [0.80, 0.14, 0.80], [fx, portH + 1.68, fz], mats.whitePlaster);
  }
  // Entry steps climbing from Car Portico up to the Veranda Floor
  for (let s = 0; s < 3; s++) {
    addBox(bldgG, [5.6, 0.22, 0.42], [0, 0.11 + s * 0.22, verZ - 0.1 + (2 - s) * 0.40], mats.verandaTile);
  }

  // E) MAIN ROOF SLAB, CORNICE & RECESSED 2ND-STORY RED-BRICK HERITAGE SUITE (inside roofGroup for cutaway!)
  addBox(roofGroup, [mainW + 1.0, 0.34, mainD + 1.0], [0, roofY + 0.17, 0], mats.redBrick, { uvScale: 2.2 });
  addBox(roofGroup, [mainW + 0.6, 0.88, 0.28], [0, roofY + 0.74,  mainD * 0.5 + 0.1], mats.whitePlaster);
  addBox(roofGroup, [mainW + 0.6, 0.88, 0.28], [0, roofY + 0.74, -mainD * 0.5 - 0.1], mats.whitePlaster);
  addBox(roofGroup, [0.28, 0.88, mainD + 0.6], [-mainW * 0.5 - 0.1, roofY + 0.74, 0], mats.whitePlaster);
  addBox(roofGroup, [0.28, 0.88, mainD + 0.6], [ mainW * 0.5 + 0.1, roofY + 0.74, 0], mats.whitePlaster);
  // Corner red-brick roof finials along main wing parapet
  for (const fx of [-18.9, -9.6, 9.6, 18.9]) {
    addBox(roofGroup, [0.64, 1.25, 0.64], [fx, roofY + 0.88, mainD * 0.5 + 0.1], mats.redBrick);
    addBox(roofGroup, [0.76, 0.14, 0.76], [fx, roofY + 1.54, mainD * 0.5 + 0.1], mats.whitePlaster);
  }
  // Recessed 2nd-Story Red-Brick Heritage Suite (Right-Center, exact match to PWD photo!)
  const s2x = 5.5;
  const s2z = -2.2;
  const s2W = 21.0;
  const s2D = 10.6;
  const s2H = 3.85;
  addBox(roofGroup, [s2W, s2H, s2D], [s2x, roofY + 0.34 + s2H * 0.5, s2z], mats.redBrick, { uvScale: 2.2 });
  addBox(roofGroup, [s2W + 0.6, 0.28, s2D + 0.6], [s2x, roofY + 0.34 + s2H + 0.14, s2z], mats.whitePlaster);
  addBox(roofGroup, [s2W + 0.4, 0.65, s2D + 0.4], [s2x, roofY + 0.34 + s2H + 0.58, s2z], mats.redBrick, { uvScale: 2.0 });
  for (const wx of [-7.0, -2.4, 2.2, 6.8]) {
    addBox(roofGroup, [2.4, 1.65, 0.18], [s2x + wx, roofY + 2.35, s2z + s2D * 0.5 + 0.05], mats.whitePlaster);
    addBox(roofGroup, [1.95, 1.35, 0.22], [s2x + wx, roofY + 2.35, s2z + s2D * 0.5 + 0.06], mats.glass, { castShadow: false });
  }

  // F) FURNISHED VIP RECEPTION HALL & CONFERENCE ROOM INTERIOR (visible when walking in or Cutaway!)
  addBox(bldgG, [10.0, 0.04, 8.2], [0, plinthH + 0.05, -0.8], mats.carpet, { castShadow: false });
  // Grand VIP Conference Table & Chairs
  addBox(bldgG, [5.4, 0.78, 2.2], [0, plinthH + 0.39, -1.6], mats.teakWood);
  for (let cx = -2.0; cx <= 2.01; cx += 1.0) {
    for (const cz of [-3.05, -0.15]) {
      addBox(bldgG, [0.52, 0.48, 0.52], [cx, plinthH + 0.24, cz], mats.darkIron);
      addBox(bldgG, [0.52, 0.52, 0.10], [cx, plinthH + 0.68, cz + (cz < -1.6 ? -0.22 : 0.22)], mats.teakWood);
    }
  }
  // Warm Glowing Hall Chandelier
  addCyl(roofGroup, 0.04, 0.04, 1.2, [0, roofY - 0.6, -1.6], mats.goldMat, 8);
  const chanRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.05, 8, 20), mats.goldMat);
  chanRing.rotation.x = Math.PI * 0.5;
  chanRing.position.set(0, roofY - 1.25, -1.6);
  roofGroup.add(chanRing);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), mats.ledGlow);
    bulb.position.set(Math.cos(a) * 0.95, roofY - 1.15, -1.6 + Math.sin(a) * 0.95);
    roofGroup.add(bulb);
  }

  /* ============================================================================
   * 4. CEREMONIAL FLAGPOLE, GARDENS, CAMPUS LAMPS & TROPICAL TREES
   * ========================================================================== */
  // Raised Red-Brick Ceremonial Podium & Bangladesh National Flagpole in front of Left Wing (exact PWD photo!)
  const fx = -10.2;
  const fz = 1.6;
  addBox(root, [4.6, 0.42, 3.8], [fx, 0.21, fz], mats.redBrick, { uvScale: 1.8 });
  addBox(root, [4.8, 0.08, 4.0], [fx, 0.45, fz], mats.whitePlaster);
  addCyl(root, 0.055, 0.095, 9.8, [fx, 5.35, fz], mats.chromeMat, 12);
  const flagPivot = new THREE.Group();
  flagPivot.position.set(fx, 9.55, fz);
  addBox(flagPivot, [2.2, 1.32, 0.04], [1.12, 0, 0], mats.flagGreen);
  const flagSun = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.055, 18), mats.flagRed);
  flagSun.rotation.x = Math.PI * 0.5;
  flagSun.position.set(0.98, 0, 0);
  flagPivot.add(flagSun);
  root.add(flagPivot);

  // Tropical Rain-Trees framing the Gate & Circuit House Lawn (matching Street View & PWD photo!)
  const treePlacements = [
    [-16.5, 14.5, 1.25, 11],
    [ 13.5, 14.8, 1.35, 22],
    [ 22.0, 12.5, 1.15, 33],
    [-23.5,  6.5, 1.20, 44],
    [ 24.5, -2.5, 1.30, 55],
    [-25.0, -9.5, 1.25, 66],
    [ 25.5, -14.0, 1.20, 77],
  ];
  for (const [tx, tz, sc, sd] of treePlacements) {
    addTropicalTree(root, tx, tz, sc, mats.trunk, mats.leaf1, mats.leaf2, sd);
  }

  // Ornamental Campus Lamp Posts along the Entrance Driveway
  for (const [lx, lz] of [[-4.8, 12.0], [8.0, 12.0], [-7.5, 4.5], [8.5, 4.5]]) {
    addCyl(root, 0.06, 0.09, 3.8, [lx, 1.9, lz], mats.darkIron, 8);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.20, 10, 8), mats.ledGlow);
    globe.position.set(lx, 3.95, lz);
    root.add(globe);
  }

  return {
    root,
    flagPivot,
    setCutaway(enabled) {
      roofGroup.visible = !enabled;
    },
    update(time) {
      flagPivot.rotation.y = Math.sin(time * 2.1) * 0.18 + Math.cos(time * 1.1) * 0.08;
    },
  };
}
