import * as THREE from 'three';
import { attachDerivedPBRMaps } from './aaa-shaders.js';

/**
 * KHULNA CIRCUIT HOUSE — "36 UPPER JESSORE RD" WHITE COLONIAL PALACE (খুলনা সার্কিট হাউস)
 *
 * A detailed reconstruction of the white two-storey colonial building seen on the
 * Upper Jessore Road street view (May 2024 capture):
 *  - Sun-bleached white lime-plaster facade with moulded string courses, dentils
 *    and a deep flat parapet.
 *  - Ground floor: raised plinth, wide stone steps and a veranda carried by eight
 *    tall round columns (square base, flared capital, abacus) with plastered arches,
 *    deep green louvered doors behind them and low stone balustrades between bays.
 *  - First floor: arched openings framed by flat pilasters, green louvered shutters,
 *    arched fanlights and a slim balcony rail on every bay.
 *  - Compound: an ornate pierced boundary screen wall with lotus medallions, urns on
 *    the piers, a dark-green iron gate, lawn behind, and the street outside with the
 *    black-and-yellow painted curb, utility pole with posters and overhead wires.
 *
 * Everything is procedural geometry plus canvas-painted PBR maps — no external
 * model files are required by this module.
 */

/* ========================================================================== */
/* Deterministic noise + canvas helpers                                       */
/* ========================================================================== */

function seeded(seed = 1922) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeCanvas(w, h) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function canvasTexture(canvas, repeatX = 1, repeatY = 1) {
  if (!canvas) return null;
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 8;
  return t;
}

/* ========================================================================== */
/* Procedural PBR textures                                                    */
/* ========================================================================== */

/** Weathered white lime plaster: soft tonal patches, grain, hairline cracks, rain streaks. */
function makeLimePlasterCanvas(base = '#efece2', seed = 4101) {
  const S = 1024;
  const c = makeCanvas(S, S);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(seed);

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);

  // Broad trowel patches and damp bloom
  for (let i = 0; i < 220; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const r = 30 + rnd() * 120;
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    const dark = rnd() > 0.46;
    g.addColorStop(0, dark ? 'rgba(96,92,78,0.055)' : 'rgba(255,255,255,0.075)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Fine lime grain
  for (let i = 0; i < 30000; i++) {
    const dark = rnd() > 0.5;
    ctx.fillStyle = dark
      ? `rgba(86,82,70,${0.03 + rnd() * 0.06})`
      : `rgba(255,255,255,${0.04 + rnd() * 0.08})`;
    ctx.fillRect(rnd() * S, rnd() * S, 1.4 + rnd() * 2.2, 1.4 + rnd() * 2.2);
  }

  // Hairline plaster cracks
  for (let i = 0; i < 28; i++) {
    let x = rnd() * S;
    let y = rnd() * S;
    ctx.strokeStyle = `rgba(104,96,82,${0.10 + rnd() * 0.14})`;
    ctx.lineWidth = 0.8 + rnd() * 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const steps = 6 + Math.floor(rnd() * 12);
    for (let s = 0; s < steps; s++) {
      x += (rnd() - 0.5) * 46;
      y += rnd() * 34;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Monsoon rainwater streaks running down from the parapet
  for (let i = 0; i < 60; i++) {
    const x = rnd() * S;
    const h = 120 + rnd() * 420;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgba(78,80,70,${0.07 + rnd() * 0.1})`);
    g.addColorStop(1, 'rgba(78,80,70,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 3 + rnd() * 13, h);
  }

  // Slight warm dirt accumulation
  const dirt = ctx.createLinearGradient(0, S * 0.55, 0, S);
  dirt.addColorStop(0, 'rgba(126,110,86,0)');
  dirt.addColorStop(1, 'rgba(126,110,86,0.10)');
  ctx.fillStyle = dirt;
  ctx.fillRect(0, S * 0.55, S, S * 0.45);

  return c;
}

/** Deep green louvered shutter/shutter-door panel, two leaves with a centre stile. */
function makeLouverShutterCanvas(seed = 771) {
  const W = 512;
  const H = 512;
  const c = makeCanvas(W, H);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(seed);

  ctx.fillStyle = '#12331f';
  ctx.fillRect(0, 0, W, H);

  const frame = 26;
  ctx.fillStyle = '#1d4d33';
  ctx.fillRect(frame, frame, W - frame * 2, H - frame * 2);

  // Two leaves
  const leafW = (W - frame * 2 - 10) / 2;
  for (let leaf = 0; leaf < 2; leaf++) {
    const x0 = frame + leaf * (leafW + 10);
    ctx.fillStyle = '#1a5133';
    ctx.fillRect(x0, frame, leafW, H - frame * 2);

    // Louver slats
    const slatH = 13;
    for (let y = frame + 10; y < H - frame - 10; y += slatH) {
      const g = ctx.createLinearGradient(0, y, 0, y + slatH);
      g.addColorStop(0, '#2b6c47');
      g.addColorStop(0.55, '#1d5436');
      g.addColorStop(1, '#0e2b1c');
      ctx.fillStyle = g;
      ctx.fillRect(x0 + 8, y, leafW - 16, slatH - 2.4);
    }

    // Leaf stiles/rails
    ctx.strokeStyle = '#0f3322';
    ctx.lineWidth = 9;
    ctx.strokeRect(x0 + 4, frame + 4, leafW - 8, H - frame * 2 - 8);

    // Weathered paint flecks
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = rnd() > 0.55 ? 'rgba(214,222,210,0.10)' : 'rgba(6,20,12,0.16)';
      ctx.fillRect(x0 + 8 + rnd() * (leafW - 16), frame + 12 + rnd() * (H - frame * 2 - 24), 2, 2);
    }
  }

  // Mid rail across both leaves
  ctx.fillStyle = '#123a26';
  ctx.fillRect(frame, H * 0.46, W - frame * 2, 16);

  // Brass handles
  for (const hx of [W * 0.5 - 22, W * 0.5 + 22]) {
    ctx.beginPath();
    ctx.fillStyle = '#8d7a48';
    ctx.arc(hx, H * 0.55, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }

  return c;
}

/** Cream stone paving slabs for the veranda and terrace. */
function makeStonePavingCanvas(seed = 3312) {
  const S = 1024;
  const c = makeCanvas(S, S);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(seed);

  ctx.fillStyle = '#8f8879';
  ctx.fillRect(0, 0, S, S);

  const cells = 4;
  const cs = S / cells;
  for (let iy = 0; iy < cells; iy++) {
    for (let ix = 0; ix < cells; ix++) {
      const v = 208 + Math.floor(rnd() * 26);
      ctx.fillStyle = `rgb(${v},${v - 5},${v - 17})`;
      ctx.fillRect(ix * cs + 4, iy * cs + 4, cs - 8, cs - 8);

      const g = ctx.createLinearGradient(0, iy * cs, 0, iy * cs + cs);
      g.addColorStop(0, 'rgba(255,255,255,0.10)');
      g.addColorStop(1, 'rgba(70,64,52,0.10)');
      ctx.fillStyle = g;
      ctx.fillRect(ix * cs + 4, iy * cs + 4, cs - 8, cs - 8);

      for (let i = 0; i < 500; i++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(96,88,70,0.10)';
        ctx.fillRect(ix * cs + rnd() * cs, iy * cs + rnd() * cs, 2, 2);
      }
    }
  }

  return c;
}

/** Damp grey asphalt with aggregate, patches and cracks. */
function makeAsphaltCanvas(seed = 6601) {
  const S = 1024;
  const c = makeCanvas(S, S);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(seed);

  ctx.fillStyle = '#4a4844';
  ctx.fillRect(0, 0, S, S);

  for (let i = 0; i < 36000; i++) {
    const v = 58 + Math.floor(rnd() * 82);
    ctx.fillStyle = `rgba(${v},${v - 2},${v - 6},0.5)`;
    ctx.fillRect(rnd() * S, rnd() * S, 1.4 + rnd() * 3.4, 1.4 + rnd() * 3.4);
  }

  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(28,28,26,0.16)' : 'rgba(148,140,126,0.10)';
    ctx.beginPath();
    ctx.ellipse(rnd() * S, rnd() * S, 24 + rnd() * 90, 14 + rnd() * 60, rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cracks
  for (let i = 0; i < 24; i++) {
    let x = rnd() * S;
    let y = rnd() * S;
    ctx.strokeStyle = 'rgba(22,22,20,0.42)';
    ctx.lineWidth = 1 + rnd() * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 10; s++) {
      x += (rnd() - 0.5) * 90;
      y += (rnd() - 0.3) * 60;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  return c;
}

/** Dusty, sun-bleached footpath / road shoulder with tyre polish and sand drifts. */
function makeDustPathCanvas(seed = 9017) {
  const S = 1024;
  const c = makeCanvas(S, S);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(seed);

  ctx.fillStyle = '#a89c88';
  ctx.fillRect(0, 0, S, S);

  for (let i = 0; i < 30000; i++) {
    const v = 150 + Math.floor(rnd() * 62);
    ctx.fillStyle = `rgba(${v},${v - 8},${v - 24},0.32)`;
    ctx.fillRect(rnd() * S, rnd() * S, 1.6 + rnd() * 3.4, 1.6 + rnd() * 3.4);
  }

  for (let i = 0; i < 120; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const r = 20 + rnd() * 70;
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, rnd() > 0.5 ? 'rgba(122,100,72,0.13)' : 'rgba(212,204,186,0.16)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  return c;
}

/** Clipped lawn with mowing bands, dry patches and grass blade speckle. */
function makeLawnCanvas(seed = 2277) {
  const S = 1024;
  const c = makeCanvas(S, S);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(seed);

  ctx.fillStyle = '#557a34';
  ctx.fillRect(0, 0, S, S);

  for (let b = 0; b < 14; b++) {
    ctx.fillStyle = b % 2 === 0 ? 'rgba(96,140,56,0.16)' : 'rgba(38,68,26,0.14)';
    ctx.fillRect(0, b * (S / 14), S, S / 14);
  }

  for (let i = 0; i < 26000; i++) {
    const p = rnd();
    ctx.fillStyle = p < 0.45 ? 'rgba(132,182,78,0.28)' : p < 0.85 ? 'rgba(34,66,24,0.30)' : 'rgba(150,132,84,0.20)';
    ctx.fillRect(rnd() * S, rnd() * S, 1.6, 3 + rnd() * 5);
  }

  for (let i = 0; i < 60; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const r = 18 + rnd() * 60;
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, 'rgba(160,140,84,0.16)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  return c;
}

/** Street poster plaster (utility pole): layered torn handbills in faded ink. */
function makePosterCanvas(seed = 5512) {
  const W = 512;
  const H = 1024;
  const c = makeCanvas(W, H);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(seed);

  ctx.fillStyle = '#8a8578';
  ctx.fillRect(0, 0, W, H);

  const palette = ['#c33b32', '#e0b23a', '#2f6fa8', '#d8d2c2', '#8a3f8f', '#2f7e4f', '#e8e0cf'];
  for (let i = 0; i < 16; i++) {
    const w = 110 + rnd() * 280;
    const h = 70 + rnd() * 190;
    const x = rnd() * (W - w);
    const y = rnd() * (H - h);
    ctx.fillStyle = palette[Math.floor(rnd() * palette.length)];
    ctx.globalAlpha = 0.82 + rnd() * 0.18;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;

    // Fake Bengali-style lettering blocks
    const lines = 3 + Math.floor(rnd() * 5);
    for (let l = 0; l < lines; l++) {
      ctx.fillStyle = rnd() > 0.4 ? 'rgba(24,22,20,0.72)' : 'rgba(255,255,255,0.78)';
      const ly = y + 14 + l * (h / (lines + 1));
      let lx = x + 10;
      const maxX = x + w - 12;
      while (lx < maxX) {
        const seg = 8 + rnd() * 34;
        ctx.fillRect(lx, ly, Math.min(seg, maxX - lx), 4 + rnd() * 5);
        lx += seg + 6;
      }
    }
  }

  // Torn edges and grime
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = 'rgba(90,84,70,0.12)';
    ctx.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 6, 2 + rnd() * 10);
  }

  return c;
}

/** Bare concrete for neighbouring blocks and the utility pole. */
function makeConcreteCanvas(base = '#b9b3a7', seed = 7133) {
  const S = 512;
  const c = makeCanvas(S, S);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(seed);

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);

  for (let i = 0; i < 16000; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(58,54,46,0.07)';
    ctx.fillRect(rnd() * S, rnd() * S, 1.6 + rnd() * 3, 1.6 + rnd() * 3);
  }
  for (let i = 0; i < 34; i++) {
    const x = rnd() * S;
    const g = ctx.createLinearGradient(0, 0, 0, 80 + rnd() * 260);
    g.addColorStop(0, 'rgba(50,50,44,0.14)');
    g.addColorStop(1, 'rgba(50,50,44,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 4 + rnd() * 12, 80 + rnd() * 260);
  }

  return c;
}

/** Neighbour facade texture: plaster field with window openings and AC boxes. */
function makeNeighbourFacadeCanvas(baseHex = '#c98a7c', seed = 8123) {
  const W = 512;
  const H = 512;
  const c = makeCanvas(W, H);
  if (!c) return null;
  const ctx = c.getContext('2d');
  const rnd = seeded(seed);

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 12000; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(40,34,30,0.08)';
    ctx.fillRect(rnd() * W, rnd() * H, 2, 2);
  }

  const cols = 4;
  const rows = 4;
  const cw = W / cols;
  const ch = H / rows;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const w = cw * 0.42;
      const h = ch * 0.48;
      const x = col * cw + (cw - w) / 2;
      const y = r * ch + (ch - h) / 2;
      ctx.fillStyle = 'rgba(38,44,46,0.92)';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(196,206,204,0.55)';
      ctx.fillRect(x, y, w, h * 0.18);
      ctx.strokeStyle = 'rgba(240,238,230,0.8)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
      if (rnd() > 0.7) {
        ctx.fillStyle = 'rgba(228,228,222,0.9)';
        ctx.fillRect(x + w + 8, y + h * 0.5, 22, 16);
      }
    }
  }

  return c;
}

/* ========================================================================== */
/* Geometry helpers                                                           */
/* ========================================================================== */

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
  if (opts.name) mesh.name = opts.name;
  parent.add(mesh);
  return mesh;
}

function addCyl(parent, rt, rb, h, pos, mat, seg = 22, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.castShadow = opts.castShadow ?? true;
  mesh.receiveShadow = opts.receiveShadow ?? true;
  parent.add(mesh);
  return mesh;
}

/** "Tombstone" arched opening: rectangle with a semicircular head. */
function archShape(w, h) {
  const r = w * 0.5;
  const s = new THREE.Shape();
  s.moveTo(-r, 0);
  s.lineTo(-r, h);
  s.absarc(0, h, r, Math.PI, 0, true);
  s.lineTo(r, 0);
  s.lineTo(-r, 0);
  return s;
}

/** Flat arched panel (used for recessed backings / green screens). */
function addArchPanel(parent, { w, h, depth = 0.06, pos, rotY = 0, mat }) {
  const geo = new THREE.ExtrudeGeometry(archShape(w, h), {
    depth,
    bevelEnabled: false,
    curveSegments: 26,
  });
  geo.translate(0, 0, -depth * 0.5);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.y = rotY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Moulded plaster arch surround: outer tombstone shape with an inner hole. */
function addArchFrame(parent, { w, h, thickness = 0.2, depth = 0.26, pos, rotY = 0, mat }) {
  const outer = archShape(w, h);
  const innerW = Math.max(0.24, w - thickness * 2);
  const innerR = innerW * 0.5;
  const holeY = thickness * 0.65;
  const hole = new THREE.Path();
  hole.moveTo(-innerR, holeY);
  hole.lineTo(-innerR, h);
  hole.absarc(0, h, innerR, Math.PI, 0, true);
  hole.lineTo(innerR, holeY);
  hole.lineTo(-innerR, holeY);
  outer.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(outer, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments: 26,
  });
  geo.translate(0, 0, -depth * 0.5);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.y = rotY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Semicircular fanlight pane that sits in the head of an arched opening. */
function addSemicirclePanel(parent, { radius, depth = 0.04, pos, rotY = 0, mat }) {
  const shape = new THREE.Shape();
  shape.moveTo(-radius, 0);
  shape.absarc(0, 0, radius, Math.PI, 0, true);
  shape.lineTo(-radius, 0);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 26,
  });
  geo.translate(0, 0, -depth * 0.5);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.y = rotY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Pointed (multifoil-ish) niche outline used by the pierced screen wall. */
function pointedNicheShape(w, h) {
  const s = new THREE.Shape();
  s.moveTo(-w * 0.5, 0);
  s.lineTo(w * 0.5, 0);
  s.lineTo(w * 0.5, h * 0.52);
  s.quadraticCurveTo(w * 0.36, h * 0.86, 0, h);
  s.quadraticCurveTo(-w * 0.36, h * 0.86, -w * 0.5, h * 0.52);
  s.lineTo(-w * 0.5, 0);
  return s;
}

/** One ornate pierced balustrade panel of the boundary wall (holes + lotus relief). */
function makeScreenPanelGeometry(w, h, thickness) {
  const shape = new THREE.Shape();
  const r = 0.06;
  shape.moveTo(-w * 0.5 + r, 0);
  shape.lineTo(w * 0.5 - r, 0);
  shape.quadraticCurveTo(w * 0.5, 0, w * 0.5, r);
  shape.lineTo(w * 0.5, h - r);
  shape.quadraticCurveTo(w * 0.5, h, w * 0.5 - r, h);
  shape.lineTo(-w * 0.5 + r, h);
  shape.quadraticCurveTo(-w * 0.5, h, -w * 0.5, h - r);
  shape.lineTo(-w * 0.5, r);
  shape.quadraticCurveTo(-w * 0.5, 0, -w * 0.5 + r, 0);

  // Pierced niches: two on each side of the central lotus medallion
  const nicheW = w * 0.17;
  const nicheH = h * 0.62;
  for (const nx of [-w * 0.34, -w * 0.15, w * 0.15, w * 0.34]) {
    const hole = pointedNicheShape(nicheW, nicheH);
    const path = new THREE.Path();
    const pts = hole.getPoints(26);
    path.moveTo(pts[0].x + nx, pts[0].y + h * 0.16);
    for (let i = 1; i < pts.length; i++) path.lineTo(pts[i].x + nx, pts[i].y + h * 0.16);
    path.closePath();
    shape.holes.push(path);
  }

  // Small pierced diamonds flanking the medallion
  for (const dx of [-w * 0.24, w * 0.24]) {
    const d = 0.075;
    const hole = new THREE.Path();
    hole.moveTo(dx, h * 0.44);
    hole.lineTo(dx + d, h * 0.44 + d);
    hole.lineTo(dx, h * 0.44 + d * 2);
    hole.lineTo(dx - d, h * 0.44 + d);
    hole.closePath();
    shape.holes.push(hole);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.018,
    bevelSegments: 1,
    curveSegments: 16,
  });
  geo.translate(0, 0, -thickness * 0.5);
  geo.computeVertexNormals();
  return geo;
}

/** Lathe-turned urn finial for the gate piers. */
function makeUrnGeometry(scale = 1) {
  const pts = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.13, 0.0),
    new THREE.Vector2(0.17, 0.05),
    new THREE.Vector2(0.15, 0.1),
    new THREE.Vector2(0.2, 0.2),
    new THREE.Vector2(0.25, 0.36),
    new THREE.Vector2(0.22, 0.52),
    new THREE.Vector2(0.13, 0.62),
    new THREE.Vector2(0.11, 0.68),
    new THREE.Vector2(0.15, 0.72),
    new THREE.Vector2(0.1, 0.76),
    new THREE.Vector2(0.02, 0.8),
  ].map((v) => v.clone().multiplyScalar(scale));
  return new THREE.LatheGeometry(pts, 26);
}

/** Catenary-ish overhead cable between two points. */
function addCable(parent, a, b, sag, mat) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const span = start.distanceTo(end);
  mid.y -= sag;
  const curve = new THREE.CatmullRomCurve3([start, mid, end]);
  const geo = new THREE.TubeGeometry(curve, Math.max(10, Math.round(span * 0.6)), 0.017, 5, false);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

/* ========================================================================== */
/* Main builder                                                               */
/* ========================================================================== */

export function buildWhiteHeritagePalace3D() {
  const root = new THREE.Group();
  root.name = 'CircuitHouse_WhiteColonialPalace_UpperJessoreRd';

  /* ---------------------------------- materials --------------------------- */

  const limeCanvas = makeLimePlasterCanvas('#efece2', 4101);
  const limeTex = canvasTexture(limeCanvas);
  const trimTex = canvasTexture(makeLimePlasterCanvas('#f7f4ec', 4102));
  const shutterTex = canvasTexture(makeLouverShutterCanvas(771));
  const pavingTex = canvasTexture(makeStonePavingCanvas(3312));
  const asphaltTex = canvasTexture(makeAsphaltCanvas(6601));
  const dustTex = canvasTexture(makeDustPathCanvas(9017));
  const lawnTex = canvasTexture(makeLawnCanvas(2277));
  const posterTex = canvasTexture(makePosterCanvas(5512));
  const concreteTex = canvasTexture(makeConcreteCanvas('#b4aea2', 7133));

  const mat = {
    white: new THREE.MeshStandardMaterial({
      map: limeTex,
      color: limeTex ? 0xffffff : 0xefece2,
      roughness: 0.86,
      metalness: 0.02,
    }),
    trim: new THREE.MeshStandardMaterial({
      map: trimTex,
      color: trimTex ? 0xffffff : 0xf7f4ec,
      roughness: 0.78,
      metalness: 0.02,
    }),
    stoneBase: new THREE.MeshStandardMaterial({ color: 0xcfc8b8, roughness: 0.8, metalness: 0.03 }),
    shutter: new THREE.MeshStandardMaterial({
      map: shutterTex,
      color: shutterTex ? 0xffffff : 0x1d4d33,
      roughness: 0.62,
      metalness: 0.08,
    }),
    greenPaint: new THREE.MeshStandardMaterial({ color: 0x1d4d33, roughness: 0.48, metalness: 0.24 }),
    interior: new THREE.MeshStandardMaterial({ color: 0x1b1f1d, roughness: 0.94 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x0e1a18,
      roughness: 0.14,
      metalness: 0.25,
      clearcoat: 0.8,
      transparent: true,
      opacity: 0.86,
    }),
    paving: new THREE.MeshStandardMaterial({
      map: pavingTex,
      color: pavingTex ? 0xffffff : 0xddd6c9,
      roughness: 0.6,
      metalness: 0.05,
    }),
    asphalt: new THREE.MeshStandardMaterial({
      map: asphaltTex,
      color: asphaltTex ? 0xffffff : 0x4a4844,
      roughness: 0.92,
      metalness: 0.04,
    }),
    dust: new THREE.MeshStandardMaterial({
      map: dustTex,
      color: dustTex ? 0xffffff : 0xa89c88,
      roughness: 0.95,
      metalness: 0.02,
    }),
    lawn: new THREE.MeshStandardMaterial({
      map: lawnTex,
      color: lawnTex ? 0xffffff : 0x557a34,
      roughness: 0.95,
      metalness: 0.01,
    }),
    curbBlack: new THREE.MeshStandardMaterial({ color: 0x23262a, roughness: 0.72 }),
    curbYellow: new THREE.MeshStandardMaterial({ color: 0xd8ac2a, roughness: 0.66 }),
    poster: new THREE.MeshStandardMaterial({
      map: posterTex,
      color: posterTex ? 0xffffff : 0x8a8578,
      roughness: 0.88,
    }),
    concrete: new THREE.MeshStandardMaterial({
      map: concreteTex,
      color: concreteTex ? 0xffffff : 0xb4aea2,
      roughness: 0.9,
    }),
    bark: new THREE.MeshStandardMaterial({ color: 0x4a3f34, roughness: 0.95 }),
    barkLight: new THREE.MeshStandardMaterial({ color: 0x6b5c4a, roughness: 0.93 }),
    leafA: new THREE.MeshStandardMaterial({ color: 0x2e5324, roughness: 0.9, flatShading: true }),
    leafB: new THREE.MeshStandardMaterial({ color: 0x3d6b2b, roughness: 0.9, flatShading: true }),
    leafC: new THREE.MeshStandardMaterial({ color: 0x527f34, roughness: 0.9, flatShading: true }),
    cable: new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.8 }),
    windowGlow: new THREE.MeshStandardMaterial({
      color: 0xfff2cf,
      emissive: 0xffbe6a,
      emissiveIntensity: 0,
      roughness: 0.5,
    }),
  };

  if (typeof document !== 'undefined') {
    attachDerivedPBRMaps(mat.white, limeTex, { size: 512, strength: 1.4, roughBase: 0.86, normalScale: 0.5 });
    attachDerivedPBRMaps(mat.trim, trimTex, { size: 512, strength: 1.2, roughBase: 0.78, normalScale: 0.42 });
    attachDerivedPBRMaps(mat.paving, pavingTex, { size: 512, strength: 1.8, roughBase: 0.6, normalScale: 0.55 });
    attachDerivedPBRMaps(mat.asphalt, asphaltTex, { size: 512, strength: 2.2, roughBase: 0.92, normalScale: 0.8 });
    attachDerivedPBRMaps(mat.dust, dustTex, { size: 512, strength: 2.0, roughBase: 0.95, normalScale: 0.7 });
    attachDerivedPBRMaps(mat.lawn, lawnTex, { size: 512, strength: 1.6, roughBase: 0.95, normalScale: 0.55 });
  }

  /* --------------------------------- dimensions --------------------------- */

  const W = 30; // facade width
  const D = 13; // building depth
  const PLINTH_H = 1.05;
  const GF_H = 4.5; // veranda storey height (plinth top -> architrave)
  const BAND_H = 0.55; // belt course between storeys
  const FF_H = 4.0;
  const ENTAB_H = 0.8;
  const FF_BASE = PLINTH_H + GF_H + BAND_H; // 6.10
  const FF_TOP = FF_BASE + FF_H; // 10.10
  const ROOF_TOP = FF_TOP + ENTAB_H; // 10.90
  const PARAPET_H = 1.15;

  const VERANDA_DEPTH = 3.4;
  const COL_Z = VERANDA_DEPTH - 0.55; // 2.85
  const BAYS = 8;
  const BAY_W = W / BAYS; // 3.75
  const colXs = [];
  for (let i = 0; i <= BAYS; i++) colXs.push(-W * 0.5 + i * BAY_W);

  const WALL_Z = 14.3; // boundary wall centre
  const SIDEWALK_Z = 16.9;
  const ROAD_Z = 18.0;

  /* ---------------------------------- ground ------------------------------ */

  // Compound lawn (inside the wall)
  addBox(root, [62, 0.18, 34], [0, -0.09, -1.0], mat.lawn, { castShadow: false, uvScale: 6.5 });
  // Front garden strip between building and wall
  addBox(root, [62, 0.1, 10.5], [0, 0.02, 8.5], mat.lawn, { castShadow: false, uvScale: 5 });

  // Footpath (inside the wall line up to the curb)
  addBox(root, [120, 0.16, 2.6], [0, 0.06, WALL_Z + 1.3], mat.dust, { castShadow: false, uvScale: 3.2 });
  // Road
  addBox(root, [120, 0.12, 13], [0, -0.02, ROAD_Z + 6.5], mat.asphalt, { castShadow: false, uvScale: 2.4 });
  // Far shoulder
  addBox(root, [120, 0.12, 8], [0, 0.0, ROAD_Z + 17], mat.dust, { castShadow: false, uvScale: 3.6 });

  // Black-and-yellow painted curb along the road edge
  const curbGeoBlack = new THREE.BoxGeometry(1.18, 0.26, 0.34);
  const curbGeoYellow = new THREE.BoxGeometry(1.18, 0.26, 0.34);
  const curbCount = 50;
  for (let i = 0; i < curbCount; i++) {
    const x = -29.5 + i * 1.2;
    const geo = i % 2 === 0 ? curbGeoBlack : curbGeoYellow;
    const m = new THREE.Mesh(geo, i % 2 === 0 ? mat.curbBlack : mat.curbYellow);
    m.position.set(x, 0.13, SIDEWALK_Z + 0.17);
    m.castShadow = false;
    m.receiveShadow = true;
    root.add(m);
  }
  // Curb concrete backing so the paint does not float
  addBox(root, [120, 0.2, 0.2], [0, 0.1, SIDEWALK_Z + 0.02], mat.concrete, { castShadow: false, uvScale: 2 });

  /* ---------------------------------- plinth ------------------------------ */

  addBox(root, [W + 3.2, PLINTH_H, 18.3], [0, PLINTH_H * 0.5, -4.85], mat.stoneBase);
  // Plinth face mouldings along the street side
  addBox(root, [W + 3.5, 0.16, 0.38], [0, PLINTH_H - 0.14, 4.3], mat.trim);
  addBox(root, [W + 3.5, 0.1, 0.44], [0, 0.12, 4.3], mat.trim);

  // Veranda stone floor
  addBox(root, [W + 2.4, 0.08, VERANDA_DEPTH + 0.6], [0, PLINTH_H + 0.01, VERANDA_DEPTH * 0.5], mat.paving, {
    castShadow: false,
    uvScale: 2.2,
  });

  // Grand stone steps in front of the entrance
  for (let s = 0; s < 4; s++) {
    const sw = 9.2 - s * 0.55;
    const topY = PLINTH_H - 0.24 * (s + 1);
    addBox(root, [sw, 0.24, 0.68], [0, topY - 0.12, VERANDA_DEPTH + 0.34 + s * 0.62], mat.stoneBase);
  }
  // Side steps at the east end (as in the street view, a small flight to a side door)
  for (let s = 0; s < 3; s++) {
    addBox(root, [0.62, 0.28, 2.4], [W * 0.5 + 1.9 + s * 0.6, PLINTH_H - 0.28 * (s + 1) + 0.14, 1.2], mat.stoneBase);
  }

  /* ------------------------------ ground floor ---------------------------- */

  const COL_BASE_Y = PLINTH_H;
  const COL_SHAFT_H = 3.05;
  const COL_CAP_H = 0.4;

  // Veranda back wall with arched openings and green doors
  addBox(root, [W, GF_H, 0.4], [0, COL_BASE_Y + GF_H * 0.5, -0.2], mat.white, { uvScale: 2.2 });

  // Interior darkness behind the openings
  addBox(root, [W - 1.5, GF_H - 0.5, 0.4], [0, COL_BASE_Y + GF_H * 0.5, -0.72], mat.interior, {
    castShadow: false,
    receiveShadow: false,
  });

  // Build each ground-floor bay: arch frame + shutter doors + transom
  for (let i = 0; i < BAYS; i++) {
    const bx = -W * 0.5 + BAY_W * (i + 0.5);
    const isEntrance = Math.abs(bx) < BAY_W * 0.6;

    const baseY = COL_BASE_Y + 0.88;
    if (isEntrance) {
      // Central double-leaf green entrance opening
      addArchPanel(root, { w: BAY_W - 1.35, h: 1.85, depth: 0.05, pos: [bx, baseY, 0.02], mat: mat.interior });
      addArchPanel(root, { w: BAY_W - 1.4, h: 1.78, depth: 0.06, pos: [bx, baseY, 0.05], mat: mat.shutter });
      addArchFrame(root, {
        w: BAY_W - 0.75,
        h: 1.95,
        thickness: 0.22,
        depth: 0.3,
        pos: [bx, baseY, 0.14],
        mat: mat.trim,
      });
      addBox(root, [BAY_W - 1.45, 0.1, 0.26], [bx, baseY + 0.02, 0.16], mat.greenPaint);
    } else {
      addArchPanel(root, { w: 2.0, h: 1.7, depth: 0.05, pos: [bx, baseY, 0.02], mat: mat.interior });
      addArchPanel(root, { w: 1.7, h: 1.6, depth: 0.06, pos: [bx, baseY, 0.05], mat: mat.shutter });
      addArchFrame(root, { w: 2.1, h: 1.8, thickness: 0.2, depth: 0.26, pos: [bx, baseY, 0.13], mat: mat.trim });
      // Sill
      addBox(root, [2.26, 0.12, 0.36], [bx, baseY - 0.02, 0.13], mat.trim);
    }
  }

  // Round columns with base, shaft, flared capital and abacus
  for (const x of colXs) {
    addBox(root, [0.86, 0.24, 0.86], [x, COL_BASE_Y + 0.12, COL_Z], mat.trim);
    addCyl(root, 0.34, 0.38, 0.2, [x, COL_BASE_Y + 0.32, COL_Z], mat.trim, 24);
    addCyl(root, 0.3, 0.33, COL_SHAFT_H, [x, COL_BASE_Y + 0.42 + COL_SHAFT_H * 0.5, COL_Z], mat.trim, 26);
    // Flared capital
    addCyl(root, 0.44, 0.3, 0.24, [x, COL_BASE_Y + 0.42 + COL_SHAFT_H + 0.12, COL_Z], mat.trim, 26);
    addBox(root, [0.92, 0.16, 0.92], [x, COL_BASE_Y + 0.42 + COL_SHAFT_H + 0.32, COL_Z], mat.trim);
    // Shadow/dirt ring where the base meets the floor
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 6, 20), mat.stoneBase);
    ring.rotation.x = Math.PI * 0.5;
    ring.position.set(x, COL_BASE_Y + 0.26, COL_Z);
    root.add(ring);
  }

  // Architrave beam over the columns + dentil course
  const ARCH_BEAM_Y = COL_BASE_Y + 0.42 + COL_SHAFT_H + 0.4; // 5.37
  addBox(root, [W + 1.2, 0.3, 1.15], [0, ARCH_BEAM_Y + 0.15, COL_Z], mat.trim);
  addBox(root, [W + 1.0, 0.16, 0.5], [0, ARCH_BEAM_Y + 0.06, COL_Z - 0.55], mat.trim);
  for (let x = -W * 0.5 + 0.3; x < W * 0.5; x += 0.44) {
    addBox(root, [0.18, 0.14, 0.16], [x, ARCH_BEAM_Y - 0.04, COL_Z + 0.4], mat.trim, { castShadow: false });
  }

  // Low stone balustrade between the column bases (open at the entrance bays)
  for (let i = 0; i < BAYS; i++) {
    const bx = -W * 0.5 + BAY_W * (i + 0.5);
    if (Math.abs(bx) < BAY_W * 0.6) continue;
    addBox(root, [BAY_W - 1.0, 0.1, 0.2], [bx, COL_BASE_Y + 0.62, COL_Z], mat.trim);
    addBox(root, [BAY_W - 1.0, 0.12, 0.22], [bx, COL_BASE_Y + 0.18, COL_Z], mat.trim);
    for (let sx = -(BAY_W - 1.2) * 0.5; sx <= (BAY_W - 1.2) * 0.5 + 0.01; sx += 0.34) {
      addCyl(root, 0.055, 0.075, 0.4, [bx + sx, COL_BASE_Y + 0.4, COL_Z], mat.trim, 10, { castShadow: false });
    }
  }

  /* --------------------------- belt course between floors ----------------- */

  addBox(root, [W + 2.2, BAND_H - 0.1, VERANDA_DEPTH + 1.1], [0, PLINTH_H + GF_H + (BAND_H - 0.1) * 0.5 + 0.05, VERANDA_DEPTH * 0.5 - 0.2], mat.trim);
  addBox(root, [W + 2.5, 0.14, VERANDA_DEPTH + 1.5], [0, PLINTH_H + GF_H + BAND_H - 0.07, VERANDA_DEPTH * 0.5 - 0.2], mat.trim);
  // Dentils under the belt course
  for (let x = -W * 0.5 - 0.6; x < W * 0.5 + 0.6; x += 0.42) {
    addBox(root, [0.17, 0.15, 0.18], [x, PLINTH_H + GF_H + 0.02, COL_Z + 0.35], mat.trim, { castShadow: false });
  }

  /* ------------------------------- first floor ---------------------------- */

  // Upper storey front wall, set slightly back over the veranda
  addBox(root, [W, FF_H, 0.55], [0, FF_BASE + FF_H * 0.5, 2.5], mat.white, { uvScale: 2.2 });
  // Body of the building behind the open veranda
  addBox(root, [W - 0.4, 10.8, D], [0, 5.4, -D * 0.5], mat.white, { uvScale: 2.4 });

  const FF_FRONT_Z = 2.79;
  const ARCH_W = BAY_W - 1.05;
  const ARCH_H = 1.8;
  const ARCH_Y = FF_BASE + 0.62;

  for (let i = 0; i < BAYS; i++) {
    const bx = -W * 0.5 + BAY_W * (i + 0.5);

    // Dark reveal so the arch reads as a deep opening
    addArchPanel(root, { w: ARCH_W - 0.05, h: ARCH_H, depth: 0.04, pos: [bx, ARCH_Y, FF_FRONT_Z], mat: mat.interior });
    // Deep green louvered shutter leaves
    addArchPanel(root, {
      w: ARCH_W - 0.28,
      h: ARCH_H - 0.04,
      depth: 0.06,
      pos: [bx, ARCH_Y, FF_FRONT_Z + 0.03],
      mat: mat.shutter,
    });
    // Semicircular fanlight in the arch head
    addSemicirclePanel(root, {
      radius: (ARCH_W - 0.44) * 0.5,
      pos: [bx, ARCH_Y + ARCH_H, FF_FRONT_Z + 0.04],
      mat: mat.windowGlow,
      depth: 0.03,
    });
    // Moulded plaster arch surround
    addArchFrame(root, {
      w: ARCH_W,
      h: ARCH_H,
      thickness: 0.2,
      depth: 0.28,
      pos: [bx, ARCH_Y, FF_FRONT_Z + 0.12],
      mat: mat.trim,
    });
    // Window sill
    addBox(root, [ARCH_W + 0.24, 0.14, 0.4], [bx, ARCH_Y - 0.06, FF_FRONT_Z + 0.06], mat.trim);
    // Slim balcony rail
    addBox(root, [ARCH_W - 0.1, 0.06, 0.06], [bx, FF_BASE + 1.02, FF_FRONT_Z + 0.24], mat.greenPaint);
    addBox(root, [ARCH_W - 0.1, 0.05, 0.05], [bx, FF_BASE + 0.78, FF_FRONT_Z + 0.24], mat.greenPaint);
    for (let sx = -(ARCH_W - 0.3) * 0.5; sx <= (ARCH_W - 0.3) * 0.5 + 0.01; sx += 0.22) {
      addBox(root, [0.028, 0.5, 0.028], [bx + sx, FF_BASE + 0.8, FF_FRONT_Z + 0.24], mat.greenPaint, { castShadow: false });
    }
  }

  // Flat pilasters between the bays with capitals and bases
  for (const x of colXs) {
    addBox(root, [0.58, FF_H - 0.55, 0.34], [x, FF_BASE + (FF_H - 0.55) * 0.5 + 0.28, FF_FRONT_Z + 0.02], mat.trim);
    addBox(root, [0.74, 0.18, 0.44], [x, FF_BASE + FF_H - 0.42, FF_FRONT_Z + 0.06], mat.trim);
    addBox(root, [0.7, 0.16, 0.42], [x, FF_BASE + 0.14, FF_FRONT_Z + 0.05], mat.trim);
  }

  // Upper-storey side returns that close the terrace above the veranda
  for (const side of [-1, 1]) {
    addBox(root, [0.5, FF_H, 2.85], [side * (W * 0.5 - 0.25), FF_BASE + FF_H * 0.5, 1.4], mat.white, { uvScale: 2 });
  }

  /* ------------------------------- entablature ---------------------------- */

  addBox(root, [W + 1.4, 0.34, 1.0], [0, FF_TOP + 0.17, FF_FRONT_Z - 0.1], mat.trim);
  // Dentil band
  for (let x = -W * 0.5 - 0.5; x < W * 0.5 + 0.5; x += 0.4) {
    addBox(root, [0.16, 0.16, 0.18], [x, FF_TOP - 0.02, FF_FRONT_Z + 0.2], mat.trim, { castShadow: false });
  }
  // Projecting cornice with two mouldings
  addBox(root, [W + 2.2, 0.22, 1.45], [0, FF_TOP + 0.45, FF_FRONT_Z - 0.2], mat.trim);
  addBox(root, [W + 2.4, 0.12, 1.6], [0, FF_TOP + 0.62, FF_FRONT_Z - 0.24], mat.trim);

  /* --------------------------------- roof --------------------------------- */

  const roofGroup = new THREE.Group();
  roofGroup.name = 'CircuitHouse_Roof_And_Parapet';
  root.add(roofGroup);

  // Roof slab
  addBox(roofGroup, [W + 1.0, 0.3, D + VERANDA_DEPTH + 0.6], [0, ROOF_TOP + 0.15, (VERANDA_DEPTH - D) * 0.5 + 0.1], mat.concrete, {
    uvScale: 3,
  });
  // Parapet walls + coping
  const parapetY = ROOF_TOP + 0.3 + PARAPET_H * 0.5;
  addBox(roofGroup, [W + 1.0, PARAPET_H, 0.34], [0, parapetY, 2.9], mat.white, { uvScale: 2 });
  addBox(roofGroup, [W + 1.0, PARAPET_H, 0.34], [0, parapetY, -D - 0.2], mat.white, { uvScale: 2 });
  addBox(roofGroup, [0.34, PARAPET_H, D + 3.3], [W * 0.5 + 0.33, parapetY, (2.9 - D) * 0.5], mat.white, { uvScale: 2 });
  addBox(roofGroup, [0.34, PARAPET_H, D + 3.3], [-W * 0.5 - 0.33, parapetY, (2.9 - D) * 0.5], mat.white, { uvScale: 2 });
  // Coping stones
  const copY = ROOF_TOP + 0.3 + PARAPET_H + 0.08;
  addBox(roofGroup, [W + 1.4, 0.16, 0.5], [0, copY, 2.9], mat.trim);
  addBox(roofGroup, [W + 1.4, 0.16, 0.5], [0, copY, -D - 0.2], mat.trim);
  addBox(roofGroup, [0.5, 0.16, D + 3.6], [W * 0.5 + 0.33, copY, (2.9 - D) * 0.5], mat.trim);
  addBox(roofGroup, [0.5, 0.16, D + 3.6], [-W * 0.5 - 0.33, copY, (2.9 - D) * 0.5], mat.trim);

  // Corner piers with urns on the parapet
  for (const [px, pz] of [
    [-W * 0.5 - 0.33, 2.9],
    [W * 0.5 + 0.33, 2.9],
    [-W * 0.5 - 0.33, -D - 0.2],
    [W * 0.5 + 0.33, -D - 0.2],
  ]) {
    addBox(roofGroup, [0.72, PARAPET_H + 0.5, 0.72], [px, ROOF_TOP + 0.3 + (PARAPET_H + 0.5) * 0.5, pz], mat.trim);
    const urn = new THREE.Mesh(makeUrnGeometry(0.85), mat.trim);
    urn.position.set(px, ROOF_TOP + 0.3 + PARAPET_H + 0.58, pz);
    urn.castShadow = true;
    roofGroup.add(urn);
  }

  // Stair head, water tank and a few roof pipes so the silhouette is not bare
  addBox(roofGroup, [4.4, 3.0, 3.2], [-7.0, ROOF_TOP + 0.3 + 1.5, -8.5], mat.white, { uvScale: 2 });
  addBox(roofGroup, [4.9, 0.22, 3.7], [-7.0, ROOF_TOP + 0.3 + 3.1, -8.5], mat.trim);
  addBox(roofGroup, [0.9, 2.1, 0.9], [-6.4, ROOF_TOP + 0.3 + 1.05, -6.7], mat.greenPaint);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 1.7, 20), mat.concrete);
  tank.position.set(7.6, ROOF_TOP + 0.3 + 1.15, -7.4);
  tank.castShadow = true;
  tank.receiveShadow = true;
  roofGroup.add(tank);

  /* ------------------------------ side & rear ----------------------------- */

  // Side facades with tall arched windows
  for (const side of [-1, 1]) {
    const sx = side * (W * 0.5);
    for (let i = 0; i < 3; i++) {
      const wz = -2.0 - i * 3.6;
      // Ground floor
      addArchFrame(root, {
        w: 1.5,
        h: 1.2,
        thickness: 0.16,
        depth: 0.2,
        pos: [sx + side * 0.02, PLINTH_H + 1.2, wz],
        rotY: side * Math.PI * 0.5,
        mat: mat.trim,
      });
      addArchPanel(root, { w: 1.18, h: 1.05, depth: 0.05, pos: [sx, PLINTH_H + 1.18, wz], rotY: side * Math.PI * 0.5, mat: mat.interior });
      // First floor with shutters
      addArchFrame(root, {
        w: 1.6,
        h: 1.35,
        thickness: 0.17,
        depth: 0.22,
        pos: [sx + side * 0.02, FF_BASE + 0.85, wz],
        rotY: side * Math.PI * 0.5,
        mat: mat.trim,
      });
      addArchPanel(root, { w: 1.26, h: 1.2, depth: 0.05, pos: [sx, FF_BASE + 0.83, wz], rotY: side * Math.PI * 0.5, mat: mat.shutter });
    }
    // Side veranda return wall
    addBox(root, [0.4, GF_H, 3.0], [sx - side * 0.2, PLINTH_H + GF_H * 0.5, 1.4], mat.white, { uvScale: 2 });
    // Side gate in the compound wall
    addBox(root, [0.9, 2.3, 1.2], [sx, 1.15, 8.2], mat.white, { uvScale: 2 });
  }

  // Rear wall
  addBox(root, [W, GF_H + FF_H + PLINTH_H, 0.4], [0, (GF_H + FF_H + PLINTH_H) * 0.5, -D + 0.2], mat.white, { uvScale: 2.4 });

  /* ------------------------- pierced boundary screen wall ----------------- */

  const wallG = new THREE.Group();
  wallG.name = 'CircuitHouse_BoundaryScreenWall';
  wallG.position.set(0, 0, WALL_Z);
  root.add(wallG);

  const WALL_X0 = -30;
  const WALL_X1 = 30;
  const GATE_X0 = 15.2;
  const GATE_X1 = 20.0;
  const PANEL_W = 2.55;
  const PIER_W = 0.72;
  const BASE_H = 0.52;
  const PANEL_H = 1.42;
  const COPING_H = 0.22;

  const screenGeo = makeScreenPanelGeometry(PANEL_W, PANEL_H, 0.24);

  const buildWallRun = (x0, x1) => {
    // Continuous base and coping
    addBox(wallG, [x1 - x0, BASE_H, 0.62], [(x0 + x1) * 0.5, BASE_H * 0.5, 0], mat.white, { uvScale: 2 });
    addBox(wallG, [x1 - x0, 0.12, 0.74], [(x0 + x1) * 0.5, 0.06, 0], mat.trim);

    let x = x0;
    // pier first
    while (x + PIER_W <= x1) {
      addBox(wallG, [PIER_W, 2.5, PIER_W], [x + PIER_W * 0.5, 0.12 + 1.25, 0], mat.white, { uvScale: 1.8 });
      addBox(wallG, [PIER_W + 0.18, 0.14, PIER_W + 0.18], [x + PIER_W * 0.5, 2.72, 0], mat.trim);
      addBox(wallG, [PIER_W + 0.06, 0.1, PIER_W + 0.06], [x + PIER_W * 0.5, 2.16, 0], mat.trim);
      const urn = new THREE.Mesh(makeUrnGeometry(0.6), mat.trim);
      urn.position.set(x + PIER_W * 0.5, 2.79, 0);
      urn.castShadow = true;
      wallG.add(urn);
      x += PIER_W;

      // Panel after each pier (if it fits)
      if (x + PANEL_W > x1) break;

      const panel = new THREE.Mesh(screenGeo, mat.white);
      panel.position.set(x + PANEL_W * 0.5, BASE_H + 0.06, 0);
      panel.castShadow = true;
      panel.receiveShadow = true;
      wallG.add(panel);

      // Lotus medallion relief on both faces
      for (const face of [1, -1]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.045, 8, 22), mat.trim);
        ring.position.set(x + PANEL_W * 0.5, BASE_H + 0.06 + PANEL_H * 0.56, face * 0.14);
        wallG.add(ring);
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), mat.trim);
        core.position.set(x + PANEL_W * 0.5, BASE_H + 0.06 + PANEL_H * 0.56, face * 0.15);
        wallG.add(core);
        for (let p = 0; p < 8; p++) {
          const a = (p / 8) * Math.PI * 2;
          const petal = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), mat.trim);
          petal.scale.set(0.55, 1.0, 0.5);
          petal.position.set(
            x + PANEL_W * 0.5 + Math.cos(a) * 0.22,
            BASE_H + 0.06 + PANEL_H * 0.56 + Math.sin(a) * 0.22,
            face * 0.14,
          );
          petal.rotation.z = a;
          wallG.add(petal);
        }
      }

      // Coping over the panel with a small overhang
      addBox(wallG, [PANEL_W, COPING_H, 0.5], [x + PANEL_W * 0.5, BASE_H + 0.06 + PANEL_H + COPING_H * 0.5, 0], mat.trim);
      addBox(wallG, [PANEL_W + 0.08, 0.08, 0.62], [x + PANEL_W * 0.5, BASE_H + 0.06 + PANEL_H + COPING_H + 0.02, 0], mat.trim);

      x += PANEL_W;
    }
  };

  buildWallRun(WALL_X0, GATE_X0);
  buildWallRun(GATE_X1, WALL_X1);

  // Gate piers
  for (const gx of [GATE_X0, GATE_X1]) {
    addBox(wallG, [0.95, 3.0, 0.95], [gx, 1.5, 0], mat.white, { uvScale: 1.6 });
    addBox(wallG, [1.15, 0.16, 1.15], [gx, 3.08, 0], mat.trim);
    addBox(wallG, [1.05, 0.12, 1.05], [gx, 2.15, 0], mat.trim);
    addBox(wallG, [0.62, 0.05, 0.05], [gx, 1.8, 0.5], mat.greenPaint, { castShadow: false });
  }

  // Dark green iron gate leaves with spear finials
  const gateG = new THREE.Group();
  gateG.name = 'CircuitHouse_Gate';
  gateG.position.set((GATE_X0 + GATE_X1) * 0.5, 0, 0);
  wallG.add(gateG);

  const gateW = GATE_X1 - GATE_X0 - 0.95;
  const leafW = gateW * 0.5;
  for (const side of [-1, 1]) {
    const leaf = new THREE.Group();
    leaf.position.set(side * gateW * 0.5, 0, 0);
    leaf.rotation.y = side * -0.06;
    // Frame
    addBox(leaf, [leafW, 0.09, 0.1], [-side * leafW * 0.5, 0.28, 0], mat.greenPaint);
    addBox(leaf, [leafW, 0.09, 0.1], [-side * leafW * 0.5, 2.35, 0], mat.greenPaint);
    addBox(leaf, [leafW, 0.06, 0.08], [-side * leafW * 0.5, 1.55, 0], mat.greenPaint);
    addBox(leaf, [0.1, 2.3, 0.1], [0, 1.2, 0], mat.greenPaint);
    // Bars + spear tips
    for (let bx = 0.14; bx < leafW - 0.08; bx += 0.19) {
      addBox(leaf, [0.035, 2.2, 0.035], [-side * (leafW - bx), 1.25, 0], mat.greenPaint, { castShadow: false });
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16, 8), mat.greenPaint);
      tip.position.set(-side * (leafW - bx), 2.42, 0);
      leaf.add(tip);
    }
    gateG.add(leaf);
  }
  // Gate posts / hinges
  for (const side of [-1, 1]) {
    addCyl(gateG, 0.05, 0.05, 2.4, [side * gateW * 0.5, 1.2, 0], mat.greenPaint, 10);
  }

  // Compound side returns so the wall does not end abruptly
  for (const side of [-1, 1]) {
    addBox(root, [0.62, 2.5, 26], [side * 30, 1.25, WALL_Z - 13], mat.white, { uvScale: 2.2 });
    addBox(root, [0.74, 0.2, 26], [side * 30, 2.6, WALL_Z - 13], mat.trim);
  }

  /* ----------------------------- garden planting -------------------------- */

  // Shrubs along the wall and steps
  const shrubGeo = new THREE.IcosahedronGeometry(0.62, 1);
  const shrubSpots = [
    [-11.5, 8.4, 0.9],
    [-8.6, 9.2, 0.75],
    [-4.0, 8.8, 0.85],
    [5.2, 9.0, 0.8],
    [10.4, 8.6, 0.95],
    [13.6, 9.2, 0.7],
    [-14.6, 5.6, 0.8],
    [14.8, 5.4, 0.85],
  ];
  for (let i = 0; i < shrubSpots.length; i++) {
    const [sx, sz, s] = shrubSpots[i];
    const shrub = new THREE.Mesh(shrubGeo, i % 2 === 0 ? mat.leafA : mat.leafB);
    const jitter = seeded(900 + i);
    shrub.scale.set(s * (0.9 + jitter() * 0.3), s * (0.75 + jitter() * 0.35), s * (0.9 + jitter() * 0.3));
    shrub.position.set(sx, 0.1 + s * 0.55, sz);
    shrub.rotation.y = jitter() * Math.PI;
    shrub.castShadow = true;
    shrub.receiveShadow = true;
    root.add(shrub);
  }

  /* ------------------------------- trees ---------------------------------- */

  const treeSpots = [
    { x: 17.6, z: 15.4, h: 13.5, rotY: 0.4, r: 1.05 }, // the big foreground tree in the photo
    { x: -16.0, z: 12.8, h: 10.5, rotY: 1.7, r: 0.8 },
    { x: 24.5, z: 20.0, h: 11.0, rotY: 2.5, r: 0.85 },
    { x: -26.0, z: -4.0, h: 12.0, rotY: 3.8, r: 0.9 },
    { x: 26.0, z: -8.0, h: 11.5, rotY: 5.1, r: 0.85 },
    { x: -6.0, z: -17.0, h: 12.5, rotY: 0.9, r: 0.9 },
  ];

  const addProceduralTree = ({ x, z, h, rotY = 0, r = 0.9, seed = 1 }) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;

    const rnd = seeded(1000 + seed * 37);
    const trunkH = h * 0.52;
    const trunkR = 0.18 * r;

    // Buttress roots
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + rnd() * 0.4;
      const root = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * r, 0.24 * r, 1.3 * r, 7), mat.bark);
      root.position.set(Math.cos(a) * 0.42 * r, 0.5 * r, Math.sin(a) * 0.42 * r);
      root.rotation.z = Math.cos(a) * 0.5;
      root.rotation.x = -Math.sin(a) * 0.5;
      root.castShadow = true;
      g.add(root);
    }

    // Main trunk in three tapering segments for a slight lean
    let baseY = 0;
    let baseR = 0.55 * r;
    let leanX = 0;
    let leanZ = 0;
    for (let seg = 0; seg < 3; seg++) {
      const segH = trunkH / 3;
      const topR = baseR * 0.72;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(topR, baseR, segH, 12), seg === 0 ? mat.bark : mat.barkLight);
      trunk.position.set(leanX, baseY + segH * 0.5, leanZ);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      g.add(trunk);
      baseY += segH;
      baseR = topR;
      leanX += (rnd() - 0.5) * 0.5;
      leanZ += (rnd() - 0.5) * 0.4;
    }

    // Branches
    const branchCount = 6 + Math.floor(rnd() * 3);
    for (let i = 0; i < branchCount; i++) {
      const a = (i / branchCount) * Math.PI * 2 + rnd() * 0.5;
      const len = h * (0.3 + rnd() * 0.22);
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * r, 0.2 * r, len, 8), mat.barkLight);
      br.position.set(leanX + Math.cos(a) * len * 0.26, baseY + len * 0.32, leanZ + Math.sin(a) * len * 0.26);
      br.rotation.z = Math.cos(a) * (0.55 + rnd() * 0.35);
      br.rotation.x = -Math.sin(a) * (0.55 + rnd() * 0.35);
      br.castShadow = true;
      g.add(br);
    }

    // Foliage clusters in a broad umbrella canopy
    const canopyCenterY = h * 0.76;
    const clusterCount = 26 + Math.floor(rnd() * 10);
    for (let i = 0; i < clusterCount; i++) {
      const a = rnd() * Math.PI * 2;
      const rad = Math.pow(rnd(), 0.6) * h * 0.30;
      const geo = new THREE.IcosahedronGeometry(h * (0.09 + rnd() * 0.055), 1);
      const pos = geo.attributes.position;
      for (let v = 0; v < pos.count; v++) {
        pos.setXYZ(
          v,
          pos.getX(v) * (0.85 + rnd() * 0.35),
          pos.getY(v) * (0.6 + rnd() * 0.3),
          pos.getZ(v) * (0.85 + rnd() * 0.35),
        );
      }
      geo.computeVertexNormals();
      const leafMat = rnd() > 0.66 ? mat.leafC : rnd() > 0.4 ? mat.leafB : mat.leafA;
      const puff = new THREE.Mesh(geo, leafMat);
      puff.position.set(
        leanX + Math.cos(a) * rad,
        canopyCenterY + (rnd() - 0.42) * h * 0.26,
        leanZ + Math.sin(a) * rad,
      );
      puff.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
      puff.castShadow = true;
      puff.receiveShadow = true;
      g.add(puff);
    }

    root.add(g);
    return g;
  };

  treeSpots.forEach((spot, i) => addProceduralTree({ ...spot, seed: i + 1 }));

  /* --------------------------- utility pole + wires ----------------------- */

  const poleX = 9.4;
  const poleZ = 15.5;
  const POLE_H = 9.6;

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, POLE_H, 12), mat.concrete);
  pole.position.set(poleX, POLE_H * 0.5, poleZ);
  pole.castShadow = true;
  pole.receiveShadow = true;
  root.add(pole);

  // Poster-wrapped lower section
  const posterWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.23, 2.9, 18, 1, true), mat.poster);
  posterWrap.position.set(poleX, 1.55, poleZ);
  posterWrap.castShadow = false;
  root.add(posterWrap);

  // Cross-arms and insulators
  for (let a = 0; a < 2; a++) {
    const ay = POLE_H - 0.6 - a * 0.85;
    addBox(root, [2.1, 0.09, 0.09], [poleX, ay, poleZ], mat.bark, { castShadow: true });
    for (const ix of [-0.85, -0.3, 0.3, 0.85]) {
      addCyl(root, 0.055, 0.07, 0.16, [poleX + ix, ay + 0.13, poleZ], mat.concrete, 8, { castShadow: false });
    }
  }

  // Overhead catenary cables along the street
  for (const [dx, dy] of [
    [-0.85, 0],
    [0.85, 0],
    [-0.3, -0.85],
    [0.3, -0.85],
  ]) {
    addCable(root, [poleX + dx - 34, POLE_H - 0.45 + dy, poleZ], [poleX + dx, POLE_H - 0.45 + dy, poleZ], 1.1, mat.cable);
    addCable(root, [poleX + dx, POLE_H - 0.45 + dy, poleZ], [poleX + dx + 34, POLE_H - 0.1 + dy, poleZ + 0.6], 1.3, mat.cable);
  }
  // A couple of service drops towards the buildings
  addCable(root, [poleX, POLE_H - 2.2, poleZ], [-2.0, 7.4, 8.0], 1.6, mat.cable);
  addCable(root, [poleX, POLE_H - 1.6, poleZ], [16.0, 6.2, 6.0], 1.2, mat.cable);

  /* --------------------------- neighbouring blocks ------------------------- */

  const neighbourMats = [
    new THREE.MeshStandardMaterial({ map: canvasTexture(makeNeighbourFacadeCanvas('#c98a7c', 8123)), roughness: 0.86 }),
    new THREE.MeshStandardMaterial({ map: canvasTexture(makeNeighbourFacadeCanvas('#b8a49a', 8124)), roughness: 0.88 }),
    new THREE.MeshStandardMaterial({ map: canvasTexture(makeNeighbourFacadeCanvas('#a9b2a6', 8125)), roughness: 0.88 }),
  ];

  // Right-side neighbour behind the wall (the pink/red block visible in the photo)
  addBox(root, [9.0, 15.0, 9.0], [34.0, 7.5, 3.0], neighbourMats[0], { uvScale: 3.4 });
  addBox(root, [9.6, 0.35, 9.6], [34.0, 15.1, 3.0], mat.concrete, { uvScale: 3 });
  // Left-side neighbours
  addBox(root, [11.0, 12.0, 9.0], [-38.0, 6.0, 2.0], neighbourMats[1], { uvScale: 3.4 });
  addBox(root, [11.6, 0.3, 9.6], [-38.0, 12.1, 2.0], mat.concrete, { uvScale: 3 });
  // Unfinished concrete frame on the left (bare columns/slabs, as in the street view)
  const frameG = new THREE.Group();
  frameG.position.set(-45.0, 0, -3.0);
  root.add(frameG);
  for (let fl = 0; fl < 5; fl++) {
    addBox(frameG, [10.0, 0.28, 9.0], [0, 1.2 + fl * 3.0, 0], mat.concrete, { uvScale: 3 });
    for (const cx of [-4.6, 0, 4.6]) {
      for (const cz of [-4.1, 4.1]) {
        addCyl(frameG, 0.18, 0.18, 3.0, [cx, 1.2 + fl * 3.0 + 1.5, cz], mat.concrete, 8);
      }
    }
  }
  // Far side of the road: low shop row silhouettes
  for (let i = 0; i < 5; i++) {
    const bx = -34 + i * 15.5;
    addBox(root, [12.5, 8 + (i % 3) * 2.4, 8], [bx, 4 + (i % 3) * 1.2, ROAD_Z + 24], neighbourMats[(i + 1) % 3], { uvScale: 3.6 });
  }

  /* --------------------------------- street lights ------------------------ */

  // Warm veranda lights (kept off during the day, lit at night)
  const nightLampMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d4,
    emissive: 0xffb35e,
    emissiveIntensity: 0.0,
    roughness: 0.4,
  });
  const wallLights = [];
  for (let i = 0; i < 5; i++) {
    const lx = -12 + i * 6;
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), nightLampMat);
    lamp.position.set(lx, PLINTH_H + 4.05, 2.6);
    root.add(lamp);
    wallLights.push(lamp);
  }

  /* ------------------------------ public API ------------------------------ */

  let nightFactor = 0;

  return {
    root,
    treeSpots,
    /** 0 = bright day, 1 = full night: drives window/lamp emissive. */
    setNightFactor(v) {
      nightFactor = THREE.MathUtils.clamp(v, 0, 1);
      mat.windowGlow.emissiveIntensity = nightFactor * 1.35;
      nightLampMat.emissiveIntensity = nightFactor * 2.2;
      for (const lamp of wallLights) lamp.visible = true;
    },
    get nightFactor() {
      return nightFactor;
    },
    /** Small idle animation: gate leaves breathe slightly in the breeze. */
    update(t) {
      gateG.rotation.y = Math.sin(t * 0.6) * 0.012;
    },
    dispose() {
      root.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry?.dispose?.();
        }
      });
      for (const key of Object.keys(mat)) mat[key]?.dispose?.();
    },
  };
}
