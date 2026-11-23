import * as THREE from 'three';
import { box, cylinder } from './scene-utils.js';

/**
 * HOTEL ROYAL INTERNATIONAL — MODULAR HIGH-DETAIL 3D FURNITURE ASSET LIBRARY
 *
 * Dedicated photorealistic 3D furniture builders with:
 *  - Beveled ExtrudeGeometry cushions, mattresses, pillows & tabletops (NO blocky flat boxes!)
 *  - LatheGeometry turned pedestals, table lamps, vases, porcelain cups & vessel basins
 *  - Strict non-overlapping clearances so there is ZERO Z-fighting / black flickering on chairs or tables
 *  - Realistic 4K Hotel Smart TV welcome screen, quilted fabric, brass hardware & warm accent lighting
 */

function makeRoundedRectShape(w, d, r) {
  const hw = w * 0.5;
  const hd = d * 0.5;
  const rad = Math.min(r, hw * 0.45, hd * 0.45);
  const s = new THREE.Shape();
  s.moveTo(-hw + rad, -hd);
  s.lineTo(hw - rad, -hd);
  s.quadraticCurveTo(hw, -hd, hw, -hd + rad);
  s.lineTo(hw, hd - rad);
  s.quadraticCurveTo(hw, hd, hw - rad, hd);
  s.lineTo(-hw + rad, hd);
  s.quadraticCurveTo(-hw, hd, -hw, hd - rad);
  s.lineTo(-hw, -hd + rad);
  s.quadraticCurveTo(-hw, -hd, -hw + rad, -hd);
  return s;
}

/**
 * Creates a smooth beveled cushion/mattress/tabletop oriented flat on the XZ plane.
 */
function createBeveledSlab(w, h, d, r, bevel, mat) {
  const innerH = Math.max(0.01, h - bevel * 2);
  const geo = new THREE.ExtrudeGeometry(makeRoundedRectShape(w - bevel * 2, d - bevel * 2, r), {
    depth: innerH,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 8,
  });
  geo.rotateX(-Math.PI * 0.5);
  geo.translate(0, -innerH * 0.5, 0);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Creates a soft plump 3D pillow using a sculpted squashed sphere.
 */
function createPlumpPillow(w, h, d, mat) {
  const geo = new THREE.SphereGeometry(0.5, 16, 12);
  geo.scale(w, h, d);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/* ============================================================================
 * SPECIALIZED FURNITURE CANVAS TEXTURES (QUILTED LINEN, 4K HOTEL TV, ARTWORK)
 * ========================================================================== */

let _cachedFurnTextures = null;

function getFurnitureTextures() {
  if (_cachedFurnTextures) return _cachedFurnTextures;

  // 1) Quilted Crisp Hotel Duvet Texture
  const qc = document.createElement('canvas');
  qc.width = 256;
  qc.height = 256;
  const qctx = qc.getContext('2d');
  qctx.fillStyle = '#fbfaf7';
  qctx.fillRect(0, 0, 256, 256);
  qctx.strokeStyle = 'rgba(186, 178, 166, 0.28)';
  qctx.lineWidth = 1.5;
  for (let i = 0; i < 256; i += 24) {
    qctx.beginPath();
    qctx.moveTo(i, 0); qctx.lineTo(i, 256);
    qctx.stroke();
  }
  const quiltTex = new THREE.CanvasTexture(qc);
  quiltTex.colorSpace = THREE.SRGBColorSpace;
  quiltTex.wrapS = quiltTex.wrapT = THREE.RepeatWrapping;
  quiltTex.repeat.set(3, 3);

  // 2) Luxury Woven Burgundy-Gold Bed Runner Texture
  const rc = document.createElement('canvas');
  rc.width = 256;
  rc.height = 256;
  const rctx = rc.getContext('2d');
  rctx.fillStyle = '#6e1d24';
  rctx.fillRect(0, 0, 256, 256);
  rctx.fillStyle = '#d4af37';
  rctx.fillRect(0, 14, 256, 10);
  rctx.fillRect(0, 232, 256, 10);
  rctx.strokeStyle = 'rgba(212, 175, 55, 0.28)';
  rctx.lineWidth = 2;
  for (let y = 36; y < 220; y += 22) {
    for (let x = 0; x < 256; x += 22) {
      rctx.strokeRect(x + 3, y + 3, 16, 16);
    }
  }
  const runnerTex = new THREE.CanvasTexture(rc);
  runnerTex.colorSpace = THREE.SRGBColorSpace;
  runnerTex.wrapS = runnerTex.wrapT = THREE.RepeatWrapping;

  // 3) 4K Hotel Royal Smart TV Welcome Screen Texture
  const tc = document.createElement('canvas');
  tc.width = 512;
  tc.height = 288;
  const tctx = tc.getContext('2d');
  const bgGrad = tctx.createLinearGradient(0, 0, 512, 288);
  bgGrad.addColorStop(0, '#0c192c');
  bgGrad.addColorStop(0.55, '#172e4d');
  bgGrad.addColorStop(1, '#2a1f16');
  tctx.fillStyle = bgGrad;
  tctx.fillRect(0, 0, 512, 288);
  // Warm golden top bar
  tctx.fillStyle = 'rgba(250, 204, 21, 0.9)';
  tctx.fillRect(28, 28, 120, 4);
  tctx.fillStyle = '#facc15';
  tctx.font = 'bold 26px "Manrope", sans-serif';
  tctx.fillText('HOTEL ROYAL', 28, 66);
  tctx.fillStyle = '#e2e8f0';
  tctx.font = '600 13px "Manrope", sans-serif';
  tctx.fillText('INTERNATIONAL · KHULNA', 28, 86);
  tctx.fillStyle = '#ffffff';
  tctx.font = 'bold 20px "Manrope", sans-serif';
  tctx.fillText('Welcome, Distinguished Guest', 28, 138);
  tctx.fillStyle = '#cbd5e1';
  tctx.font = '13px "Manrope", sans-serif';
  tctx.fillText('Khulna 28°C · Clear Evening · Wi-Fi Ready', 28, 162);
  // App tiles along bottom
  const tiles = [
    ['LIVE TV', '#2563eb'],
    ['ROOM SERVICE', '#b45309'],
    ['SAPPHIRE DINING', '#047857'],
    ['KHULNA GUIDE', '#7c3aed'],
  ];
  tiles.forEach(([label, col], idx) => {
    const tx = 28 + idx * 116;
    tctx.fillStyle = col;
    tctx.fillRect(tx, 198, 106, 58);
    tctx.fillStyle = '#ffffff';
    tctx.font = 'bold 11px "Manrope", sans-serif';
    tctx.fillText(label, tx + 8, 232);
  });
  const tvTex = new THREE.CanvasTexture(tc);
  tvTex.colorSpace = THREE.SRGBColorSpace;

  // 4) Framed Gold-Foil Abstract Botanical Artwork Texture
  const ac = document.createElement('canvas');
  ac.width = 256;
  ac.height = 320;
  const actx = ac.getContext('2d');
  actx.fillStyle = '#1b2638';
  actx.fillRect(0, 0, 256, 320);
  actx.strokeStyle = '#d4af37';
  actx.lineWidth = 4;
  actx.strokeRect(14, 14, 228, 292);
  const g = actx.createRadialGradient(128, 145, 10, 128, 145, 95);
  g.addColorStop(0, 'rgba(250, 204, 21, 0.85)');
  g.addColorStop(0.5, 'rgba(180, 130, 42, 0.35)');
  g.addColorStop(1, 'rgba(27, 38, 56, 0)');
  actx.fillStyle = g;
  actx.beginPath(); actx.arc(128, 145, 95, 0, Math.PI * 2); actx.fill();
  actx.strokeStyle = '#fde047';
  actx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    actx.beginPath();
    actx.moveTo(128, 260);
    actx.quadraticCurveTo(60 + i * 28, 170, 50 + i * 32, 68 + (i % 2) * 28);
    actx.stroke();
  }
  const artTex = new THREE.CanvasTexture(ac);
  artTex.colorSpace = THREE.SRGBColorSpace;

  _cachedFurnTextures = {
    quiltMat: new THREE.MeshStandardMaterial({ map: quiltTex, roughness: 0.86, metalness: 0.02 }),
    runnerMat: new THREE.MeshStandardMaterial({ map: runnerTex, roughness: 0.78, metalness: 0.08 }),
    tvScreenMat: new THREE.MeshStandardMaterial({ map: tvTex, emissive: 0xffffff, emissiveMap: tvTex, emissiveIntensity: 0.42, roughness: 0.14, metalness: 0.1 }),
    artMat: new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.48, metalness: 0.25 }),
    lampShadeMat: new THREE.MeshStandardMaterial({ color: 0xfff4dc, emissive: 0xffd280, emissiveIntensity: 0.55, roughness: 0.72 }),
    porcelainMat: new THREE.MeshPhysicalMaterial({ color: 0xfafafa, roughness: 0.12, clearcoat: 0.9 }),
  };
  return _cachedFurnTextures;
}

/* ============================================================================
 * 1. SCULPTED 3D TABLE LAMP (LatheGeometry base + glowing linen shade)
 * ========================================================================== */

export function createTableLamp(mats) {
  const ft = getFurnitureTextures();
  const g = new THREE.Group();
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.085, 0.0),
    new THREE.Vector2(0.08, 0.025),
    new THREE.Vector2(0.035, 0.05),
    new THREE.Vector2(0.068, 0.14),
    new THREE.Vector2(0.055, 0.24),
    new THREE.Vector2(0.022, 0.29),
    new THREE.Vector2(0.022, 0.34),
  ];
  const baseGeo = new THREE.LatheGeometry(pts, 16);
  const base = new THREE.Mesh(baseGeo, mats.goldTrim);
  base.castShadow = true;
  g.add(base);

  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.145, 0.19, 18, 1, true), ft.lampShadeMat);
  shade.position.y = 0.40;
  shade.material.side = THREE.DoubleSide;
  g.add(shade);
  return g;
}

/* ============================================================================
 * 2. LUXURY 3D HOTEL BED (Carved Frame, Padded Tufted Headboard, Beveled
 *    Quilted Mattress, Draped Bed Runner, Sculpted Plump Pillows, Nightstands)
 *    Oriented so headboard is at local -X and foot of bed faces +X.
 * ========================================================================== */

export function createLuxuryHotelBed(mats, options = {}) {
  const {
    width = 1.95,      // Z span (King = 2.05, Queen = 1.78, Single = 1.12)
    length = 2.18,     // X span
    withNightstands = true,
  } = options;
  const ft = getFurnitureTextures();
  const g = new THREE.Group();

  // 1) Solid Mahogany Bed Frame + 4 Tapered Corner Legs (no flat solid box on the floor!)
  const legH = 0.14;
  for (const [lx, lz] of [
    [-length * 0.5 + 0.10, -width * 0.5 + 0.10],
    [length * 0.5 - 0.10, -width * 0.5 + 0.10],
    [-length * 0.5 + 0.10, width * 0.5 - 0.10],
    [length * 0.5 - 0.10, width * 0.5 - 0.10],
  ]) {
    cylinder(g, 0.038, 0.024, legH, [lx, legH * 0.5, lz], mats.mahogany, 10);
  }
  // Carved wooden side & foot rails
  const frameBase = createBeveledSlab(length, 0.22, width + 0.08, 0.04, 0.015, mats.mahogany);
  frameBase.position.set(0, legH + 0.11, 0);
  g.add(frameBase);

  // 2) Tall Architectural Mahogany & Tufted Velvet Headboard (at -X end)
  const hbX = -length * 0.5 - 0.04;
  box(g, [0.10, 1.38, width + 0.24], [hbX, 0.70, 0], mats.mahogany);
  // Inset padded champagne-gold tufted cushion panel (strict +0.025m forward clearance — zero Z-fighting!)
  const hbPad = createBeveledSlab(0.07, 0.92, width + 0.02, 0.04, 0.02, mats.goldVelvet);
  hbPad.position.set(hbX + 0.07, 0.84, 0);
  g.add(hbPad);
  // Subtle brass inlay accent trim along top of headboard
  box(g, [0.025, 0.035, width + 0.20], [hbX + 0.055, 1.35, 0], mats.goldTrim);

  // 3) Thick Beveled Quilted Mattress + Crisp White Folded Duvet
  const mattress = createBeveledSlab(length - 0.08, 0.26, width - 0.04, 0.08, 0.04, ft.quiltMat);
  mattress.position.set(0.02, legH + 0.34, 0);
  g.add(mattress);

  // Plush Top Duvet Blanket (slightly wider & draped cleanly over mattress, non-overlapping)
  const duvet = createBeveledSlab(length * 0.72, 0.075, width + 0.04, 0.06, 0.03, ft.quiltMat);
  duvet.position.set(length * 0.14, legH + 0.49, 0);
  g.add(duvet);

  // Luxury Woven Burgundy-Gold Bed Runner draped at foot of bed (with real side overhang flaps!)
  const runnerX = length * 0.34;
  const runnerTop = createBeveledSlab(0.56, 0.024, width + 0.08, 0.02, 0.008, ft.runnerMat);
  runnerTop.position.set(runnerX, legH + 0.535, 0);
  g.add(runnerTop);
  // Side drape flaps hanging down cleanly outside mattress sides
  box(g, [0.54, 0.26, 0.022], [runnerX, legH + 0.40, width * 0.5 + 0.042], ft.runnerMat);
  box(g, [0.54, 0.26, 0.022], [runnerX, legH + 0.40, -width * 0.5 - 0.042], ft.runnerMat);

  // 4) Sculpted Plump 3D Pillows + Accent Throw Cushions (angled naturally against headboard!)
  const pillowCount = width >= 1.5 ? 2 : 1;
  const pSpan = pillowCount === 2 ? [-width * 0.24, width * 0.24] : [0];
  for (const pz of pSpan) {
    const mainP = createPlumpPillow(0.42, 0.16, 0.68, ft.quiltMat);
    mainP.position.set(-length * 0.5 + 0.34, legH + 0.54, pz);
    mainP.rotation.z = -0.26;
    g.add(mainP);

    const accentP = createPlumpPillow(0.28, 0.13, 0.40, ft.runnerMat);
    accentP.position.set(-length * 0.5 + 0.52, legH + 0.52, pz);
    accentP.rotation.z = -0.45;
    g.add(accentP);
  }

  // 5) Optional Matching Carved Nightstands with Brass Pulls & Glowing Table Lamps
  if (withNightstands) {
    for (const side of [-1, 1]) {
      const nz = side * (width * 0.5 + 0.44);
      const nx = -length * 0.5 + 0.28;
      // Legs + drawer cabinet
      box(g, [0.46, 0.44, 0.48], [nx, 0.30, nz], mats.mahogany);
      // Top bevel slab
      const nsTop = createBeveledSlab(0.50, 0.036, 0.52, 0.02, 0.008, mats.mahogany);
      nsTop.position.set(nx, 0.535, nz);
      g.add(nsTop);
      // 2 Recessed Drawer Fronts + Brass Handles (offset +0.015m cleanly)
      for (const dy of [0.21, 0.39]) {
        box(g, [0.02, 0.14, 0.40], [nx + 0.24, dy, nz], mats.warmWood);
        box(g, [0.024, 0.018, 0.12], [nx + 0.26, dy, nz], mats.goldTrim);
      }
      // Sculpted Table Lamp on Nightstand
      const lamp = createTableLamp(mats);
      lamp.position.set(nx - 0.04, 0.555, nz);
      g.add(lamp);

      // Hotel landline phone on one side, tissue box on the other
      if (side === 1) {
        box(g, [0.16, 0.055, 0.18], [nx + 0.08, 0.58, nz - 0.12], mats.blackGloss);
        box(g, [0.045, 0.035, 0.16], [nx + 0.05, 0.62, nz - 0.12], mats.blackGloss);
      } else {
        box(g, [0.13, 0.075, 0.20], [nx + 0.08, 0.59, nz + 0.10], mats.goldTrim);
      }
    }
  }

  // 6) Framed Botanical Gold-Foil Artwork above Headboard
  box(g, [0.04, 0.86, 0.70], [hbX - 0.01, 2.02, 0], mats.mahogany);
  const artPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.74), ft.artMat);
  artPlane.position.set(hbX + 0.015, 2.02, 0);
  artPlane.rotation.y = Math.PI * 0.5;
  g.add(artPlane);

  return g;
}

/* ============================================================================
 * 3. ZERO-Z-FIGHTING CARVED 3D DINING CHAIR (Tapered Legs, Beveled Cushion,
 *    Sculpted Oval-Back Mahogany Frame with Cleanly Inset Tufted Pad)
 * ========================================================================== */

export function createCarvedDiningChair(mats) {
  const g = new THREE.Group();

  // 4 Tapered Solid-Mahogany Legs
  for (const [lx, lz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) {
    cylinder(g, 0.024, 0.016, 0.43, [lx, 0.215, lz], mats.mahogany, 8);
  }
  // Wooden Seat Apron Frame (y = 0.40..0.445)
  box(g, [0.44, 0.045, 0.44], [0, 0.422, 0], mats.mahogany);

  // Beveled Plush Velvet Seat Cushion sitting CLEANLY ON TOP of apron (y = 0.445..0.515 — zero overlap!)
  const seat = createBeveledSlab(0.45, 0.07, 0.45, 0.06, 0.02, mats.goldVelvet);
  seat.position.set(0, 0.48, 0.005);
  g.add(seat);

  // Two Vertical Backrest Stiles rising from rear legs (y = 0.44..0.94 at z = -0.205)
  for (const sx of [-0.195, 0.195]) {
    cylinder(g, 0.022, 0.024, 0.50, [sx, 0.69, -0.205], mats.mahogany, 8);
  }
  // Curved Top Crown Rail & Lower Rail
  const topRail = createBeveledSlab(0.44, 0.055, 0.045, 0.02, 0.01, mats.mahogany);
  topRail.position.set(0, 0.96, -0.205);
  g.add(topRail);
  box(g, [0.38, 0.04, 0.04], [0, 0.56, -0.205], mats.mahogany);

  // Sculpted Oval Medallion Backrest Pad — STRICTLY SEPARATED along Z so ZERO Z-fighting!
  // Solid wood backing plate at z = -0.218 (depth 0.024 -> -0.230 to -0.206)
  // Soft upholstered cushion in front at z = -0.186 (depth 0.036 -> -0.204 to -0.168) -> 2mm clean gap, ZERO coplanar faces!
  const backWood = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.024, 18), mats.mahogany);
  backWood.rotation.x = Math.PI * 0.5;
  backWood.scale.set(1.0, 1.0, 1.18);
  backWood.position.set(0, 0.76, -0.218);
  g.add(backWood);

  const backPad = new THREE.Mesh(new THREE.SphereGeometry(0.155, 16, 12), mats.goldVelvet);
  backPad.scale.set(0.95, 1.15, 0.22);
  backPad.position.set(0, 0.76, -0.184);
  backPad.castShadow = true;
  g.add(backPad);

  return g;
}

/* ============================================================================
 * 4. LUXURY 3D DINING TABLE SET (Turned Pedestal, Beveled Top, Tableware &
 *    4 Carved Zero-Z-Fighting Dining Chairs)
 * ========================================================================== */

export function createLuxuryDiningTableSet(mats) {
  const ft = getFurnitureTextures();
  const g = new THREE.Group();

  // Turned Pedestal Base + Splayed Plinth
  const pedPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.32, 0.0),
    new THREE.Vector2(0.28, 0.05),
    new THREE.Vector2(0.11, 0.10),
    new THREE.Vector2(0.085, 0.34),
    new THREE.Vector2(0.125, 0.42),
    new THREE.Vector2(0.085, 0.56),
    new THREE.Vector2(0.18, 0.70),
  ];
  const ped = new THREE.Mesh(new THREE.LatheGeometry(pedPts, 18), mats.mahogany);
  ped.castShadow = true;
  g.add(ped);

  // Under-table structural apron (y = 0.66..0.72)
  box(g, [1.28, 0.06, 0.84], [0, 0.69, 0], mats.mahogany);

  // Beveled Marble/Wood Tabletop (y = 0.72..0.78 — clean separation above apron!)
  const top = createBeveledSlab(1.62, 0.06, 1.08, 0.08, 0.015, mats.marbleFloor);
  top.position.set(0, 0.75, 0);
  g.add(top);

  // Woven Burgundy-Gold Center Table Runner (cleanly elevated at y = 0.785, zero Z-fighting!)
  box(g, [1.56, 0.010, 0.32], [0, 0.786, 0], ft.runnerMat);

  // Brass Centerpiece Vase (LatheGeometry)
  const vasePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.05, 0.0),
    new THREE.Vector2(0.075, 0.08),
    new THREE.Vector2(0.038, 0.18),
    new THREE.Vector2(0.055, 0.24),
  ];
  const vase = new THREE.Mesh(new THREE.LatheGeometry(vasePts, 14), mats.goldTrim);
  vase.position.set(0, 0.792, 0);
  g.add(vase);

  // 4 Porcelain Place Settings & Drinking Glasses
  for (const [px, pz] of [[-0.56, 0], [0.56, 0], [0, -0.34], [0, 0.34]]) {
    cylinder(g, 0.115, 0.085, 0.018, [px, 0.795, pz], ft.porcelainMat, 14);
    cylinder(g, 0.028, 0.022, 0.09, [px + 0.14, 0.83, pz - 0.06], mats.clearGlass, 10);
  }

  // 4 Sculpted Carved Dining Chairs
  for (const [cx, cz, ry] of [
    [-0.98, 0, Math.PI * 0.5],
    [0.98, 0, -Math.PI * 0.5],
    [0, -0.78, 0],
    [0, 0.78, Math.PI],
  ]) {
    const ch = createCarvedDiningChair(mats);
    ch.position.set(cx, 0, cz);
    ch.rotation.y = ry;
    g.add(ch);
  }

  return g;
}

/* ============================================================================
 * 5. SCULPTED CHESTERFIELD TUFTED SOFA (Segmented Plush Cushions, Rolled
 *    Cylindrical Armrests, Wooden Legs & Throw Pillows — NO flat box!)
 * ========================================================================== */

export function createChesterfieldSofa(mats, length = 3.2) {
  const ft = getFurnitureTextures();
  const g = new THREE.Group();

  // 4 Turned Wooden Legs
  for (const [lx, lz] of [
    [-length * 0.5 + 0.14, -0.32], [length * 0.5 - 0.14, -0.32],
    [-length * 0.5 + 0.14, 0.32], [length * 0.5 - 0.14, 0.32],
  ]) {
    cylinder(g, 0.036, 0.022, 0.12, [lx, 0.06, lz], mats.mahogany, 8);
  }

  // Mahogany Base Plinth (y = 0.12..0.22)
  const base = createBeveledSlab(length - 0.04, 0.10, 0.86, 0.04, 0.012, mats.mahogany);
  base.position.set(0, 0.17, 0);
  g.add(base);

  // Segmented Individual Plush Seat Cushions (y = 0.22..0.44 — real cushion seams!)
  const innerW = length - 0.44;
  const numCushions = Math.max(2, Math.round(innerW / 0.82));
  const cW = innerW / numCushions - 0.025;
  for (let i = 0; i < numCushions; i++) {
    const cx = -innerW * 0.5 + (i + 0.5) * (innerW / numCushions);
    const cush = createBeveledSlab(cW, 0.22, 0.76, 0.07, 0.035, mats.goldVelvet);
    cush.position.set(cx, 0.33, 0.05);
    g.add(cush);
  }

  // Tall Beveled Diamond-Tufted Backrest (z = -0.35, y = 0.22..1.14)
  const back = createBeveledSlab(length - 0.10, 0.90, 0.20, 0.06, 0.035, mats.goldVelvet);
  back.position.set(0, 0.68, -0.34);
  g.add(back);

  // Rolled Cylindrical Chesterfield Armrests on both ends
  for (const side of [-1, 1]) {
    const ax = side * (length * 0.5 - 0.13);
    const armBody = createBeveledSlab(0.22, 0.44, 0.84, 0.04, 0.02, mats.goldVelvet);
    armBody.position.set(ax, 0.44, 0.0);
    g.add(armBody);
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.84, 14), mats.goldVelvet);
    roll.rotation.x = Math.PI * 0.5;
    roll.position.set(ax, 0.66, 0.0);
    roll.castShadow = true;
    g.add(roll);

    // Decorative Burgundy-Gold Accent Throw Pillow tucked in each corner
    const tp = createPlumpPillow(0.32, 0.30, 0.14, ft.runnerMat);
    tp.position.set(ax - side * 0.26, 0.58, -0.14);
    tp.rotation.y = side * 0.42;
    tp.rotation.x = -0.18;
    g.add(tp);
  }

  return g;
}

/* ============================================================================
 * 6. REALISTIC 4K SMART TV MEDIA WALL + FLOATING CONSOLE + SOUNDBAR
 *    Oriented with TV facing +Z (rotate group as needed).
 * ========================================================================== */

export function createSmartTVConsole(mats, panelW = 2.4, tvW = 1.48) {
  const ft = getFurnitureTextures();
  const g = new THREE.Group();

  // Full-height walnut/mahogany acoustic slat feature wall
  box(g, [panelW, 3.05, 0.06], [0, 1.525, 0], mats.mahogany);
  const slatCount = Math.floor(panelW / 0.18);
  for (let i = 0; i <= slatCount; i++) {
    const sx = -panelW * 0.5 + 0.08 + i * ((panelW - 0.16) / Math.max(1, slatCount));
    box(g, [0.055, 3.02, 0.035], [sx, 1.52, 0.045], mats.warmWood);
  }
  // Recessed warm LED backlight glow strips along left & right edges
  box(g, [0.03, 2.95, 0.02], [-panelW * 0.5 - 0.02, 1.52, 0.02], mats.ledWarm);
  box(g, [0.03, 2.95, 0.02], [panelW * 0.5 + 0.02, 1.52, 0.02], mats.ledWarm);

  // Ultra-Slim 4K Smart TV (Brushed Dark Bezel + Glowing Hotel Royal Welcome Screen!)
  const tvH = tvW * 0.5625;
  const tvY = 1.68;
  box(g, [tvW + 0.06, tvH + 0.06, 0.045], [0, tvY, 0.095], mats.blackGloss);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(tvW, tvH), ft.tvScreenMat);
  screen.position.set(0, tvY, 0.122);
  g.add(screen);

  // Sleek Soundbar below TV
  const sb = createBeveledSlab(tvW * 0.72, 0.075, 0.09, 0.02, 0.01, mats.blackGloss);
  sb.position.set(0, tvY - tvH * 0.5 - 0.14, 0.11);
  g.add(sb);

  // Floating Mahogany Media Credenza Console with 3 Drawers & Brass Handles
  const cW = Math.max(panelW * 0.88, tvW + 0.45);
  box(g, [cW, 0.36, 0.44], [0, 0.54, 0.26], mats.mahogany);
  const cTop = createBeveledSlab(cW + 0.04, 0.036, 0.48, 0.02, 0.008, mats.marbleFloor);
  cTop.position.set(0, 0.74, 0.26);
  g.add(cTop);
  for (const dx of [-cW * 0.31, 0, cW * 0.31]) {
    box(g, [cW * 0.28, 0.24, 0.022], [dx, 0.54, 0.49], mats.warmWood);
    box(g, [0.16, 0.018, 0.024], [dx, 0.56, 0.51], mats.goldTrim);
  }
  // Set-top box + decorative books on console
  box(g, [0.24, 0.045, 0.18], [-0.45, 0.78, 0.26], mats.blackGloss);
  box(g, [0.22, 0.035, 0.28], [0.48, 0.775, 0.28], ft.runnerMat);

  return g;
}

/* ============================================================================
 * 7. EXECUTIVE STUDY / DRESSING DESK + ERGONOMIC CHAIR + BACKLIT MIRROR + KETTLE
 *    Oriented so user sits on +Z side facing -Z.
 * ========================================================================== */

export function createExecutiveStudyDesk(mats) {
  const ft = getFurnitureTextures();
  const g = new THREE.Group();

  // Desk Legs + Side Drawer Pedestal
  box(g, [0.44, 0.72, 0.58], [-0.52, 0.36, 0], mats.mahogany);
  for (const dy of [0.20, 0.42, 0.62]) {
    box(g, [0.36, 0.16, 0.02], [-0.52, dy, 0.30], mats.warmWood);
    box(g, [0.12, 0.016, 0.022], [-0.52, dy, 0.32], mats.goldTrim);
  }
  for (const lz of [-0.24, 0.24]) {
    cylinder(g, 0.025, 0.020, 0.72, [0.68, 0.36, lz], mats.mahogany, 8);
  }
  // Beveled Desk Tabletop
  const top = createBeveledSlab(1.52, 0.048, 0.64, 0.03, 0.01, mats.mahogany);
  top.position.set(0.02, 0.744, 0);
  g.add(top);

  // Leather Desk Pad + Electric Kettle + 2 Porcelain Tea Cups
  box(g, [0.58, 0.010, 0.36], [0.22, 0.775, 0.04], mats.darkLeather);
  box(g, [0.38, 0.022, 0.26], [-0.46, 0.78, -0.06], mats.blackGranite);
  cylinder(g, 0.075, 0.088, 0.20, [-0.52, 0.89, -0.06], mats.cyanKettle, 14);
  for (const cz of [-0.14, 0.02]) {
    cylinder(g, 0.038, 0.030, 0.075, [-0.34, 0.83, cz], ft.porcelainMat, 12);
  }

  // Backlit Wall Mirror above Desk
  box(g, [1.18, 1.18, 0.03], [0.05, 1.56, -0.27], mats.ledWarm);
  box(g, [1.12, 1.12, 0.04], [0.05, 1.56, -0.24], mats.mirror);

  // 5-Star Rolling Ergonomic Leather Chair (Zero Z-fighting!)
  const cg = new THREE.Group();
  cg.position.set(0.22, 0, 0.66);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const arm = box(cg, [0.26, 0.025, 0.032], [Math.cos(a) * 0.13, 0.05, Math.sin(a) * 0.13], mats.chrome);
    arm.rotation.y = -a;
  }
  cylinder(cg, 0.026, 0.030, 0.38, [0, 0.24, 0], mats.chrome, 10);
  const cSeat = createBeveledSlab(0.48, 0.075, 0.46, 0.06, 0.02, mats.darkLeather);
  cSeat.position.set(0, 0.46, 0);
  cg.add(cSeat);
  const cBack = createBeveledSlab(0.46, 0.46, 0.075, 0.06, 0.02, mats.darkLeather);
  cBack.position.set(0, 0.74, 0.21);
  cg.add(cBack);
  g.add(cg);

  return g;
}

/* ============================================================================
 * 8. MAHOGANY WARDROBE + GLOSSY RED MINI-FRIDGE + LUGGAGE BENCH
 *    Faces +Z.
 * ========================================================================== */

export function createWardrobeAndMinibar(mats) {
  const g = new THREE.Group();

  // Tall Paneled Mahogany Wardrobe (left)
  box(g, [1.10, 2.28, 0.60], [-0.45, 1.14, 0], mats.mahogany);
  for (const dx of [-0.72, -0.18]) {
    box(g, [0.48, 2.12, 0.024], [dx, 1.14, 0.315], mats.warmWood);
    cylinder(g, 0.012, 0.012, 0.42, [dx + (dx < -0.45 ? 0.18 : -0.18), 1.15, 0.345], mats.goldTrim, 8);
  }
  // Minibar Cabinet + Glossy Red Mini-Fridge (right)
  box(g, [0.76, 0.94, 0.60], [0.52, 0.47, 0], mats.mahogany);
  const fridgeDoor = createBeveledSlab(0.68, 0.80, 0.06, 0.04, 0.018, mats.herlanRed);
  fridgeDoor.position.set(0.52, 0.47, 0.32);
  g.add(fridgeDoor);
  cylinder(g, 0.012, 0.012, 0.26, [0.26, 0.54, 0.37], mats.chrome, 8);

  return g;
}

/* ============================================================================
 * 9. MODERN LUXURY ATTACHED BATHROOM (Glass Walk-In Shower, Vessel Basin
 *    Vanity, Backlit Mirror & Sculpted Ceramic Toilet)
 * ========================================================================== */

export function createModernBathroom(mats) {
  const ft = getFurnitureTextures();
  const g = new THREE.Group();

  // Raised tiled bathroom wet floor
  box(g, [2.25, 0.04, 1.85], [0, 0.02, 0], mats.concrete);

  // Frameless Glass Walk-In Shower Enclosure (left corner)
  box(g, [0.95, 0.06, 0.95], [-0.62, 0.06, -0.42], mats.marbleFloor);
  box(g, [0.04, 2.15, 0.95], [-0.14, 1.12, -0.42], mats.clearGlass);
  cylinder(g, 0.018, 0.018, 1.45, [-0.62, 1.45, -0.84], mats.chrome, 8);
  cylinder(g, 0.12, 0.10, 0.03, [-0.62, 2.16, -0.68], mats.chrome, 14);

  // Floating Marble Vanity + Porcelain Vessel Basin + Chrome Faucet + Backlit Mirror (center-right)
  box(g, [0.92, 0.14, 0.50], [0.46, 0.78, -0.64], mats.blackGranite);
  const basinPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.14, 0.0),
    new THREE.Vector2(0.21, 0.08),
    new THREE.Vector2(0.22, 0.14),
    new THREE.Vector2(0.19, 0.14),
    new THREE.Vector2(0.16, 0.04),
    new THREE.Vector2(0.0, 0.03),
  ];
  const basin = new THREE.Mesh(new THREE.LatheGeometry(basinPts, 16), ft.porcelainMat);
  basin.position.set(0.46, 0.85, -0.60);
  g.add(basin);
  cylinder(g, 0.014, 0.016, 0.22, [0.46, 0.96, -0.78], mats.chrome, 8);
  box(g, [0.88, 0.86, 0.03], [0.46, 1.52, -0.88], mats.ledWarm);
  box(g, [0.82, 0.80, 0.04], [0.46, 1.52, -0.85], mats.mirror);

  // Sculpted Porcelain Toilet (right-front)
  cylinder(g, 0.18, 0.14, 0.36, [0.76, 0.22, 0.38], ft.porcelainMat, 14);
  const seatRing = createBeveledSlab(0.40, 0.06, 0.48, 0.16, 0.02, ft.porcelainMat);
  seatRing.position.set(0.76, 0.42, 0.36);
  g.add(seatRing);
  const tank = createBeveledSlab(0.40, 0.42, 0.18, 0.04, 0.02, ft.porcelainMat);
  tank.position.set(0.76, 0.65, 0.62);
  g.add(tank);

  return g;
}
