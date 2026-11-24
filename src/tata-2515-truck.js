import * as THREE from 'three';
import { createConfiguredGLTFLoader } from './gltf-loader.js';

/**
 * TATA LPT 2515 (10-WHEELER HIGHWAY TRUCK) — PHOTOREALISTIC PBR UPGRADE
 * - Weathered highway metal cab paint + panel seams + road dust patina + bump map
 * - Realistic riveted steel & hardwood plank cargo body + bump map (zero cartoon flat colors)
 * - Dark smoke-tinted automotive windshield/door glass + realistic brushed highway steel
 * - Heavy mud-dusted 10.00-20 highway lug tires + bump map + 10-wheel spinning/steering rig
 * - Openable steel-trimmed cab doors, detailed RHD driver interior, full lighting system
 */

const TRUCK_SCALE = 0.098;

function makeWeatheredCabTextures() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  // Subtle vertical weathered highway paint gradient (richer top, slight road-dust haze near bottom)
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0.0, '#ffffff');
  g.addColorStop(0.70, '#f3f1ee');
  g.addColorStop(0.90, '#d8d0c6');
  g.addColorStop(1.0, '#b5a898');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle metallic micro-grain & weathered road grime speckles
  for (let i = 0; i < 4200; i++) {
    const x = (i * 197) % 512;
    const y = (i * 353) % 512;
    const dust = y > 360 ? 0.09 : 0.03;
    ctx.fillStyle = (i % 2 === 0) ? `rgba(35,28,22,${dust})` : `rgba(255,250,242,${dust * 0.5})`;
    ctx.fillRect(x, y, 2, 2);
  }
  // Subtle sheet-metal panel seam lines & rivet dots
  ctx.strokeStyle = 'rgba(20,18,16,0.22)';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, 496, 496);
  ctx.beginPath();
  ctx.moveTo(0, 260); ctx.lineTo(512, 260);
  ctx.moveTo(256, 0); ctx.lineTo(256, 512);
  ctx.stroke();

  const map = new THREE.CanvasTexture(c);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  // Matching subtle metal bump map
  const bc = document.createElement('canvas');
  bc.width = 256;
  bc.height = 256;
  const bctx = bc.getContext('2d');
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, 256, 256);
  bctx.strokeStyle = '#404040';
  bctx.lineWidth = 2;
  bctx.strokeRect(4, 4, 248, 248);
  bctx.beginPath();
  bctx.moveTo(0, 130); bctx.lineTo(256, 130);
  bctx.stroke();
  for (let i = 0; i < 1600; i++) {
    const x = (i * 73) % 256;
    const y = (i * 139) % 256;
    bctx.fillStyle = i % 2 === 0 ? '#787878' : '#888888';
    bctx.fillRect(x, y, 2, 2);
  }
  const bumpMap = new THREE.CanvasTexture(bc);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  return { map, bumpMap };
}

function makeCargoBodyTextures() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  // Authentic Bangladeshi heavy timber & corrugated iron cargo body (neutral tintable base)
  ctx.fillStyle = '#dcdad5';
  ctx.fillRect(0, 0, 512, 512);

  // Horizontal steel/timber planks with subtle shade variation & seam shadows
  const plankH = 42;
  for (let y = 0; y < 512; y += plankH) {
    const shade = 212 + ((y * 17) % 24) - 12;
    ctx.fillStyle = `rgb(${shade},${shade - 2},${shade - 6})`;
    ctx.fillRect(0, y, 512, plankH - 3);
    ctx.fillStyle = 'rgba(22, 24, 28, 0.45)';
    ctx.fillRect(0, y + plankH - 3, 512, 3);
    // Horizontal grain scratches
    ctx.fillStyle = 'rgba(40, 36, 30, 0.08)';
    for (let s = 0; s < 5; s++) {
      ctx.fillRect(((y * 29 + s * 91) % 420), y + 6 + s * 6, 85, 1.5);
    }
  }
  // Vertical riveted iron reinforcement bands
  for (let x = 0; x < 512; x += 128) {
    ctx.fillStyle = 'rgba(30, 34, 42, 0.20)';
    ctx.fillRect(x, 0, 14, 512);
    for (let ry = 18; ry < 512; ry += 42) {
      ctx.beginPath();
      ctx.arc(x + 7, ry, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(18, 20, 24, 0.55)';
      ctx.fill();
    }
  }
  // Subtle lower-skirt highway mud & road dust weathering
  const dust = ctx.createLinearGradient(0, 340, 0, 512);
  dust.addColorStop(0, 'rgba(92, 78, 62, 0)');
  dust.addColorStop(1, 'rgba(72, 60, 46, 0.42)');
  ctx.fillStyle = dust;
  ctx.fillRect(0, 340, 512, 172);

  const map = new THREE.CanvasTexture(c);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3, 1);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  // Matching plank & rivet bump map
  const bc = document.createElement('canvas');
  bc.width = 512;
  bc.height = 512;
  const bctx = bc.getContext('2d');
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += plankH) {
    bctx.fillStyle = '#262626';
    bctx.fillRect(0, y + plankH - 3, 512, 3);
    bctx.fillStyle = '#9a9a9a';
    bctx.fillRect(0, y, 512, 2);
  }
  for (let x = 0; x < 512; x += 128) {
    bctx.fillStyle = '#a4a4a4';
    bctx.fillRect(x, 0, 14, 512);
  }
  const bumpMap = new THREE.CanvasTexture(bc);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3, 1);
  return { map, bumpMap };
}

function makeBrushedSteelTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#bcc4cc';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    const v = 172 + ((y * 31) % 28);
    ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
    ctx.fillRect(0, y, 256, 1);
  }
  for (let i = 0; i < 600; i++) {
    ctx.fillStyle = 'rgba(40,42,46,0.06)';
    ctx.fillRect((i * 53) % 256, (i * 97) % 256, 18, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeTruckTireTextures() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#14161a';
  ctx.fillRect(0, 0, 512, 256);

  // Heavy dusty 10.00-20 highway lug tread blocks
  for (let x = 0; x < 512; x += 24) {
    ctx.fillStyle = '#1f2329';
    ctx.fillRect(x + 2, 14, 15, 64);
    ctx.fillRect(x + 12, 96, 14, 64);
    ctx.fillRect(x + 2, 178, 15, 64);
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(x + 18, 0, 4, 256);
  }
  ctx.fillStyle = '#090b0e';
  ctx.fillRect(0, 82, 512, 10);
  ctx.fillRect(0, 164, 512, 10);
  // Subtle road dust inside grooves
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = 'rgba(98, 88, 76, 0.14)';
    ctx.fillRect((i * 89) % 512, (i * 173) % 256, 2, 2);
  }

  const map = new THREE.CanvasTexture(c);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3, 1);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  const bc = document.createElement('canvas');
  bc.width = 512;
  bc.height = 256;
  const bctx = bc.getContext('2d');
  bctx.fillStyle = '#202020';
  bctx.fillRect(0, 0, 512, 256);
  bctx.fillStyle = '#d8d8d8';
  for (let x = 0; x < 512; x += 24) {
    bctx.fillRect(x + 2, 14, 15, 64);
    bctx.fillRect(x + 12, 96, 14, 64);
    bctx.fillRect(x + 2, 178, 15, 64);
  }
  const bumpMap = new THREE.CanvasTexture(bc);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3, 1);
  return { map, bumpMap };
}

function makeGaugeClusterTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 192;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0b1018';
  ctx.fillRect(0, 0, 512, 192);

  const dials = [
    { cx: 100, cy: 98, r: 66, label: 'KM/H', color: '#38bdf8', needle: -0.7 },
    { cx: 245, cy: 98, r: 66, label: 'RPM', color: '#f97316', needle: -1.1 },
    { cx: 365, cy: 98, r: 44, label: 'AIR', color: '#22c55e', needle: 0.4 },
    { cx: 455, cy: 98, r: 44, label: 'FUEL', color: '#eab308', needle: 0.25 },
  ];
  for (const d of dials) {
    ctx.beginPath();
    ctx.arc(d.cx, d.cy, d.r, 0, Math.PI * 2);
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#94a3b8';
    ctx.stroke();

    for (let i = 0; i <= 10; i++) {
      const a = Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
      ctx.beginPath();
      ctx.moveTo(d.cx + Math.cos(a) * (d.r - 12), d.cy + Math.sin(a) * (d.r - 12));
      ctx.lineTo(d.cx + Math.cos(a) * (d.r - 4), d.cy + Math.sin(a) * (d.r - 4));
      ctx.strokeStyle = i >= 8 ? '#ef4444' : d.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(d.cx, d.cy);
    ctx.lineTo(d.cx + Math.cos(d.needle) * (d.r - 14), d.cy + Math.sin(d.needle) * (d.r - 14));
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, d.cx, d.cy + d.r * 0.45);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeReflectiveTapeTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 64;
  const ctx = c.getContext('2d');
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#a81c1c' : '#d6d4ce';
    ctx.fillRect(i * 32, 0, 32, 64);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeTataBadgeTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 96;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#11161e';
  ctx.fillRect(0, 0, 256, 96);
  ctx.strokeStyle = '#b8c0c8';
  ctx.lineWidth = 5;
  ctx.strokeRect(6, 6, 244, 84);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '900 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TATA 2515', 128, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildRealisticTruckWheel({
  radius = 0.505,
  width = 0.27,
  isDual = false,
  outboardSign = 1,
  tireMat,
  rimSteelMat,
  darkSteelMat,
  hubMat,
}) {
  const group = new THREE.Group();
  const singleOffsets = isDual ? [-0.175 * outboardSign, 0.175 * outboardSign] : [0];

  const hw = width * 0.5;
  const rimR = radius * 0.55;
  const tirePts = [
    new THREE.Vector2(rimR - 0.01, -hw * 0.80),
    new THREE.Vector2(rimR + 0.05, -hw * 0.98),
    new THREE.Vector2(radius * 0.86, -hw * 1.02),
    new THREE.Vector2(radius * 0.98, -hw * 0.86),
    new THREE.Vector2(radius, -hw * 0.52),
    new THREE.Vector2(radius, hw * 0.52),
    new THREE.Vector2(radius * 0.98, hw * 0.86),
    new THREE.Vector2(radius * 0.86, hw * 1.02),
    new THREE.Vector2(rimR + 0.05, hw * 0.98),
    new THREE.Vector2(rimR - 0.01, hw * 0.80),
  ];
  const tireGeo = new THREE.LatheGeometry(tirePts, 32);
  tireGeo.rotateZ(Math.PI / 2);

  const rimGeo = new THREE.CylinderGeometry(rimR, rimR, width * 0.78, 28);
  rimGeo.rotateZ(Math.PI / 2);

  const dishRingGeo = new THREE.TorusGeometry(rimR * 0.93, 0.022, 10, 28);
  dishRingGeo.rotateY(Math.PI / 2);

  const lugGeo = new THREE.CylinderGeometry(0.016, 0.018, 0.045, 6);
  lugGeo.rotateZ(Math.PI / 2);

  const holeGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.02, 10);
  holeGeo.rotateZ(Math.PI / 2);

  for (let idx = 0; idx < singleOffsets.length; idx++) {
    const ox = singleOffsets[idx];
    const tireMesh = new THREE.Mesh(tireGeo, tireMat);
    tireMesh.position.x = ox;
    tireMesh.castShadow = true;
    tireMesh.receiveShadow = true;
    group.add(tireMesh);

    const rimMesh = new THREE.Mesh(rimGeo, rimSteelMat);
    rimMesh.position.x = ox;
    rimMesh.castShadow = true;
    group.add(rimMesh);

    const outerFaceX = ox + outboardSign * (hw * 0.74);
    const dishRing = new THREE.Mesh(dishRingGeo, rimSteelMat);
    dishRing.position.x = outerFaceX;
    group.add(dishRing);

    if (!isDual || idx === 1) {
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.135, 0.14, 18), hubMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.x = ox + outboardSign * (hw * 0.65);
      group.add(hub);

      const capRing = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 8, 20), rimSteelMat);
      capRing.rotation.y = Math.PI / 2;
      capRing.position.x = ox + outboardSign * (hw * 0.88);
      group.add(capRing);

      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const lug = new THREE.Mesh(lugGeo, rimSteelMat);
        lug.position.set(ox + outboardSign * (hw * 0.72), Math.cos(a) * 0.175, Math.sin(a) * 0.175);
        group.add(lug);
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.2;
        const vent = new THREE.Mesh(holeGeo, darkSteelMat);
        vent.position.set(ox + outboardSign * (hw * 0.68), Math.cos(a) * (rimR * 0.76), Math.sin(a) * (rimR * 0.76));
        group.add(vent);
      }
    }
  }

  const drum = new THREE.Mesh(new THREE.CylinderGeometry(rimR * 0.78, rimR * 0.78, 0.22, 18), darkSteelMat);
  drum.rotation.z = Math.PI / 2;
  drum.position.x = -outboardSign * (isDual ? 0.30 : 0.10);
  group.add(drum);

  return group;
}

function cutDoorOpeningsFromGeometry(geometry) {
  const pos = geometry.attributes.position;
  if (!pos) return;
  const idx = geometry.index;
  const keepTris = [];
  const isInsideDoorWindow = (vx, vy, vz) => (
    Math.abs(vx) > 10.6 && vy >= -36.2 && vy <= -24.2 && vz >= 11.6 && vz <= 26.6
  );
  const count = idx ? idx.count : pos.count;
  for (let i = 0; i < count; i += 3) {
    const a = idx ? idx.getX(i) : i;
    const b = idx ? idx.getX(i + 1) : i + 1;
    const c = idx ? idx.getX(i + 2) : i + 2;
    const cx = (pos.getX(a) + pos.getX(b) + pos.getX(c)) / 3;
    const cy = (pos.getY(a) + pos.getY(b) + pos.getY(c)) / 3;
    const cz = (pos.getZ(a) + pos.getZ(b) + pos.getZ(c)) / 3;
    if (!isInsideDoorWindow(cx, cy, cz)) {
      keepTris.push(a, b, c);
    }
  }
  if (keepTris.length > 0 && keepTris.length < count) {
    geometry.setIndex(keepTris);
  }
}

function buildCabDoor(sideSign, mats) {
  const pivot = new THREE.Group();
  pivot.name = sideSign > 0 ? 'Door_FL' : 'Door_FR';
  pivot.position.set(sideSign * 1.205, 1.15, 3.56);

  const doorLen = 1.18;
  const lowerH = 0.88;
  const upperH = 0.62;
  const thick = 0.085;
  const midZ = -doorLen * 0.5;

  const lowerPanel = new THREE.Mesh(new THREE.BoxGeometry(thick, lowerH, doorLen), mats.cabPaint);
  lowerPanel.position.set(0, lowerH * 0.5, midZ);
  lowerPanel.castShadow = true;
  lowerPanel.receiveShadow = true;
  pivot.add(lowerPanel);

  // Subtle dark-rubber weatherstrip & brushed aluminum beltline trim
  const trimStrip = new THREE.Mesh(new THREE.BoxGeometry(thick + 0.016, 0.036, doorLen - 0.02), mats.darkMetal);
  trimStrip.position.set(sideSign * 0.004, lowerH - 0.02, midZ);
  pivot.add(trimStrip);

  const fPillar = new THREE.Mesh(new THREE.BoxGeometry(thick * 0.85, upperH, 0.075), mats.cabPaint);
  fPillar.position.set(0, lowerH + upperH * 0.5, -0.04);
  pivot.add(fPillar);

  const rPillar = new THREE.Mesh(new THREE.BoxGeometry(thick * 0.85, upperH, 0.085), mats.cabPaint);
  rPillar.position.set(0, lowerH + upperH * 0.5, -doorLen + 0.045);
  pivot.add(rPillar);

  const topRail = new THREE.Mesh(new THREE.BoxGeometry(thick * 0.85, 0.075, doorLen), mats.cabPaint);
  topRail.position.set(0, lowerH + upperH - 0.035, midZ);
  pivot.add(topRail);

  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.016, upperH - 0.08, doorLen - 0.16), mats.glass);
  glass.position.set(0, lowerH + upperH * 0.48, midZ);
  pivot.add(glass);

  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.042, 0.15), mats.darkMetal);
  handle.position.set(sideSign * (thick * 0.5 + 0.02), lowerH - 0.20, -doorLen + 0.22);
  pivot.add(handle);

  const innerCard = new THREE.Mesh(new THREE.BoxGeometry(0.025, lowerH - 0.10, doorLen - 0.08), mats.interiorTrim);
  innerCard.position.set(-sideSign * (thick * 0.5 + 0.008), lowerH * 0.5, midZ);
  pivot.add(innerCard);

  const armrest = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.42), mats.seatLeather);
  armrest.position.set(-sideSign * (thick * 0.5 + 0.04), lowerH * 0.56, midZ - 0.06);
  pivot.add(armrest);

  // Realistic commercial tubular steel West-Coast side mirrors
  const armTop = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.34, 8), mats.brushedSteel);
  armTop.rotation.z = Math.PI / 2;
  armTop.position.set(sideSign * 0.18, lowerH + upperH - 0.08, -0.14);
  pivot.add(armTop);

  const armBot = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.34, 8), mats.brushedSteel);
  armBot.rotation.z = Math.PI / 2;
  armBot.position.set(sideSign * 0.18, lowerH + 0.08, -0.14);
  pivot.add(armBot);

  const mirrorBar = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.56, 8), mats.brushedSteel);
  mirrorBar.position.set(sideSign * 0.33, lowerH + upperH * 0.5, -0.14);
  pivot.add(mirrorBar);

  const mirrorBack = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.38, 0.16), mats.darkMetal);
  mirrorBack.position.set(sideSign * 0.34, lowerH + upperH * 0.52, -0.16);
  mirrorBack.rotation.y = sideSign * -0.18;
  pivot.add(mirrorBack);

  const mirrorGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.35), mats.mirror);
  mirrorGlass.position.set(sideSign * 0.34, lowerH + upperH * 0.52, -0.178);
  mirrorGlass.rotation.y = Math.PI + sideSign * -0.18;
  pivot.add(mirrorGlass);

  return pivot;
}

function buildTruckInterior(parent, mats, enableRealLights = true) {
  const g = new THREE.Group();
  g.name = 'Tata2515_Interior';
  parent.add(g);

  const floor = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.08, 1.95), mats.floorMat);
  floor.position.set(0, 1.15, 3.16);
  g.add(floor);

  const engineHump = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.34, 1.32), mats.dashMat);
  engineHump.position.set(0.0, 1.34, 3.35);
  g.add(engineHump);

  const dashMain = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.38, 0.52), mats.dashMat);
  dashMain.position.set(0, 1.88, 3.88);
  g.add(dashMain);

  const dashTop = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.07, 0.58), mats.interiorTrim);
  dashTop.position.set(0, 2.09, 3.86);
  g.add(dashTop);

  const clusterHood = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.16), mats.dashMat);
  clusterHood.position.set(-0.58, 2.08, 3.68);
  g.add(clusterHood);

  const clusterScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.18), mats.gaugeMat);
  clusterScreen.position.set(-0.58, 2.06, 3.595);
  clusterScreen.rotation.y = Math.PI;
  clusterScreen.rotation.x = 0.22;
  g.add(clusterScreen);

  const centerPanel = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.24, 0.06), mats.darkMetal);
  centerPanel.position.set(0.0, 1.88, 3.61);
  g.add(centerPanel);

  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.62, 12), mats.darkMetal);
  col.position.set(-0.58, 1.72, 3.62);
  col.rotation.x = 0.55;
  g.add(col);

  const steeringPivot = new THREE.Group();
  steeringPivot.name = 'Steering_Wheel';
  steeringPivot.position.set(-0.58, 1.94, 3.40);
  steeringPivot.rotation.x = -0.58;
  g.add(steeringPivot);

  const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.022, 12, 28), mats.floorMat);
  steeringPivot.add(wheelRim);
  const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.04, 16), mats.dashMat);
  wheelHub.rotation.x = Math.PI / 2;
  steeringPivot.add(wheelHub);
  for (const ang of [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3]) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.20, 0.02), mats.darkMetal);
    spoke.position.set(Math.cos(ang) * 0.10, Math.sin(ang) * 0.10, 0);
    spoke.rotation.z = ang - Math.PI / 2;
    steeringPivot.add(spoke);
  }

  const gearStick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.52, 8), mats.brushedSteel);
  gearStick.position.set(-0.22, 1.62, 3.36);
  gearStick.rotation.x = -0.18;
  gearStick.rotation.z = 0.12;
  g.add(gearStick);
  const gearKnob = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 10), mats.floorMat);
  gearKnob.position.set(-0.25, 1.87, 3.31);
  g.add(gearKnob);

  for (const px of [-0.42, -0.56, -0.70]) {
    const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.11, 0.02), mats.darkMetal);
    pedal.position.set(px, 1.32, 3.74);
    pedal.rotation.x = -0.35;
    g.add(pedal);
  }

  const addSeat = (sx, w) => {
    const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, 0.54), mats.seatLeather);
    base.position.set(sx, 1.56, 2.98);
    g.add(base);
    const back = new THREE.Mesh(new THREE.BoxGeometry(w, 0.68, 0.14), mats.seatLeather);
    back.position.set(sx, 1.96, 2.74);
    back.rotation.x = -0.12;
    g.add(back);
    const head = new THREE.Mesh(new THREE.BoxGeometry(w * 0.52, 0.18, 0.11), mats.seatAccent);
    head.position.set(sx, 2.38, 2.70);
    g.add(head);
    const ped = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 0.34, 0.42), mats.darkMetal);
    ped.position.set(sx, 1.34, 2.98);
    g.add(ped);
  };
  addSeat(-0.58, 0.54);
  addSeat(0.56, 0.76);

  const sleeper = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.16, 0.56), mats.seatAccent);
  sleeper.position.set(0, 1.66, 2.42);
  g.add(sleeper);

  const liner = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.05, 1.88), mats.roofLiner);
  liner.position.set(0, 2.78, 3.16);
  g.add(liner);

  const domeHousing = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.14), mats.darkMetal);
  domeHousing.position.set(0, 2.74, 3.32);
  g.add(domeHousing);
  const domeLens = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.02, 0.11), mats.domeLight);
  domeLens.position.set(0, 2.715, 3.32);
  g.add(domeLens);

  let domePoint = null;
  if (enableRealLights) {
    domePoint = new THREE.PointLight(0xffe6b3, 1.0, 3.0, 1.8);
    domePoint.position.set(0, 2.64, 3.30);
    g.add(domePoint);
  }

  const rvMirror = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.03), mats.darkMetal);
  rvMirror.position.set(-0.08, 2.64, 3.84);
  g.add(rvMirror);

  return { steeringPivot, domePoint };
}

function buildExteriorSteelAndLights(parent, mats, enableRealLights = true) {
  const g = new THREE.Group();
  g.name = 'Tata2515_ExteriorSteelAndLights';
  parent.add(g);

  // 1) Heavy Commercial Steel Front Bumper + Dark Radiator Grille Backing + Chrome Slats + TATA 2515 Badge
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.34, 0.22), mats.darkMetal);
  frontBumper.position.set(0, 0.72, 4.44);
  frontBumper.castShadow = true;
  frontBumper.receiveShadow = true;
  g.add(frontBumper);

  // Galvanized steel bumper face strip
  const bumperFace = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.10, 0.03), mats.brushedSteel);
  bumperFace.position.set(0, 0.72, 4.545);
  g.add(bumperFace);

  const bumperStep = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.05, 0.28), mats.darkMetal);
  bumperStep.position.set(0, 0.89, 4.46);
  g.add(bumperStep);

  // Heavy galvanized tubular bullbar guard
  for (const bx of [-0.62, 0.62]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.62, 10), mats.brushedSteel);
    post.position.set(bx, 1.16, 4.50);
    g.add(post);
  }
  for (const by of [1.02, 1.24, 1.44]) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.56, 10), mats.brushedSteel);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, by, 4.50);
    g.add(bar);
  }

  // Dark Recessed Radiator Mesh Grille behind brushed-steel slats
  const grilleBack = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.56, 0.03), mats.floorMat);
  grilleBack.position.set(0, 1.48, 4.355);
  g.add(grilleBack);

  for (let i = 0; i < 4; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.030, 0.038), mats.brushedSteel);
    slat.position.set(0, 1.28 + i * 0.13, 4.38);
    g.add(slat);
  }
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.18, 0.04), mats.tataBadge);
  badge.position.set(0, 1.88, 4.36);
  g.add(badge);

  for (const wx of [-0.46, 0.42]) {
    const wiper = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.022, 0.022), mats.floorMat);
    wiper.position.set(wx, 2.08, 4.18);
    wiper.rotation.z = 0.22;
    g.add(wiper);
  }

  // 2) Cab Roof Steel Luggage Carrier + Air Horns
  const rackRailL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.72, 8), mats.darkMetal);
  rackRailL.rotation.x = Math.PI / 2;
  rackRailL.position.set(1.02, 3.06, 3.12);
  g.add(rackRailL);
  const rackRailR = rackRailL.clone();
  rackRailR.position.x = -1.02;
  g.add(rackRailR);
  for (const rz of [2.32, 3.12, 3.92]) {
    const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.06, 8), mats.darkMetal);
    cross.rotation.z = Math.PI / 2;
    cross.position.set(0, 3.06, rz);
    g.add(cross);
  }
  for (const hx of [-0.72, 0.72]) {
    const hornBody = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.02, 0.48, 12), mats.chrome);
    hornBody.rotation.x = Math.PI / 2;
    hornBody.position.set(hx, 3.04, 3.88);
    g.add(hornBody);
  }

  // 3) Heat-Weathered Vertical Diesel Exhaust Stack + Perforated Steel Shield + Soot-Tipped Top
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 2.45, 14), mats.brushedSteel);
  exhaust.position.set(-1.14, 2.15, 2.12);
  g.add(exhaust);
  const exhaustTip = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.065, 0.24, 14), mats.darkMetal);
  exhaustTip.position.set(-1.14, 3.42, 2.07);
  exhaustTip.rotation.x = -0.35;
  g.add(exhaustTip);
  const heatShield = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.092, 1.35, 14, 1, true), mats.darkMetal);
  heatShield.position.set(-1.14, 2.02, 2.12);
  g.add(heatShield);

  // 4) Commercial Footsteps, Grab Handles, Galvanized Fuel Tank, Air Tanks & Side Underrun Guards
  for (const sx of [-1, 1]) {
    for (const sy of [0.56, 0.84]) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.56), mats.darkMetal);
      step.position.set(sx * 1.18, sy, 3.08);
      g.add(step);
    }
    const grab = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.56, 8), mats.darkMetal);
    grab.position.set(sx * 1.24, 1.72, 2.34);
    g.add(grab);

    for (const gy of [0.52, 0.72]) {
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 2.55), mats.brushedSteel);
      guard.position.set(sx * 1.24, gy, 0.92);
      g.add(guard);
    }
  }

  const fuelTank = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.35, 20), mats.brushedSteel);
  fuelTank.rotation.x = Math.PI / 2;
  fuelTank.position.set(0.98, 0.68, 1.02);
  g.add(fuelTank);
  for (const fz of [0.62, 1.42]) {
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.018, 8, 20), mats.darkMetal);
    strap.position.set(0.98, 0.68, fz);
    g.add(strap);
  }

  for (const az of [0.55, 1.25]) {
    const airT = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.62, 14), mats.darkMetal);
    airT.rotation.x = Math.PI / 2;
    airT.position.set(-0.96, 0.68, az);
    g.add(airT);
  }

  // 5) Heavy Chassis I-Beams, Central Driveshaft, Leaf Spring Packs & Riveted Cargo Steel Ribs
  for (const rx of [-0.46, 0.46]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 6.8), mats.darkMetal);
    rail.position.set(rx, 0.66, -1.05);
    g.add(rail);
  }
  // Heavy Steel Driveshaft running to rear tandem axles
  const driveshaft = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 4.6, 10), mats.darkMetal);
  driveshaft.rotation.x = Math.PI / 2;
  driveshaft.position.set(0, 0.56, 0.25);
  g.add(driveshaft);

  for (const sx of [-1, 1]) {
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 6.58), mats.darkMetal);
    topBar.position.set(sx * 1.215, 3.04, -1.12);
    g.add(topBar);
    const botBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 6.58), mats.darkMetal);
    botBar.position.set(sx * 1.215, 0.96, -1.12);
    g.add(botBar);
    const sideTape = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.06, 6.52), mats.reflectiveTape);
    sideTape.position.set(sx * 1.258, 0.96, -1.12);
    g.add(sideTape);

    for (let z = -4.25; z <= 2.0; z += 0.90) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.08, 0.075), mats.darkMetal);
      rib.position.set(sx * 1.218, 2.00, z);
      g.add(rib);
    }
  }

  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.20, 0.16), mats.darkMetal);
  rearBumper.position.set(0, 0.56, -4.46);
  g.add(rearBumper);

  const rearTape = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.075, 0.02), mats.reflectiveTape);
  rearTape.position.set(0, 0.94, -4.43);
  g.add(rearTape);

  for (const mx of [-1.20, 1.20]) {
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.48, 0.03), mats.floorMat);
    flap.position.set(mx, 0.36, -3.12);
    g.add(flap);
  }

  // 6) Realistic Recessed Lighting System (balanced brightness, not neon cartoon blocks)
  const lights = {
    headlightMats: [],
    fogMats: [],
    taillightMats: [],
    brakeMats: [],
    reverseMats: [],
    indLeftMats: [],
    indRightMats: [],
    markerMats: [],
    headSpotL: null,
    headSpotR: null,
    tailGlow: null,
  };

  const makeLensMat = (color, emissive, intensity = 0) => new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: intensity,
    roughness: 0.14,
    metalness: 0.18,
  });

  for (const sx of [-1, 1]) {
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.08), mats.darkMetal);
    bezel.position.set(sx * 0.88, 0.78, 4.53);
    g.add(bezel);

    const hlMat = makeLensMat(0xeef2f6, 0xfff0cc, 1.6);
    lights.headlightMats.push(hlMat);
    const hlLens = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.03), hlMat);
    hlLens.position.set(sx * 0.88, 0.78, 4.56);
    g.add(hlLens);

    const fogMat = makeLensMat(0xe5d88a, 0xf5d65c, 1.1);
    lights.fogMats.push(fogMat);
    const fogLens = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.04, 14), fogMat);
    fogLens.rotation.x = Math.PI / 2;
    fogLens.position.set(sx * 0.56, 0.62, 4.55);
    g.add(fogLens);

    const indMat = makeLensMat(0xd97706, 0xff8c00, 0.0);
    if (sx > 0) lights.indLeftMats.push(indMat);
    else lights.indRightMats.push(indMat);

    const frontInd = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.05), indMat);
    frontInd.position.set(sx * 1.12, 0.78, 4.55);
    g.add(frontInd);

    const sideInd = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.18), indMat);
    sideInd.position.set(sx * 1.24, 1.04, 3.92);
    g.add(sideInd);

    const rearHousing = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.18, 0.08), mats.floorMat);
    rearHousing.position.set(sx * 0.82, 0.74, -4.44);
    g.add(rearHousing);

    const tailMat = makeLensMat(0x991b1b, 0xff1a1a, 1.2);
    lights.taillightMats.push(tailMat);
    const tailLens = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.13, 0.04), tailMat);
    tailLens.position.set(sx * 0.70, 0.74, -4.47);
    g.add(tailLens);

    const brkMat = makeLensMat(0xb91c1c, 0xff0000, 0.35);
    lights.brakeMats.push(brkMat);
    const brkLens = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.13, 0.04), brkMat);
    brkLens.position.set(sx * 0.86, 0.74, -4.47);
    g.add(brkLens);

    const rearIndLens = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.04), indMat);
    rearIndLens.position.set(sx * 1.00, 0.74, -4.47);
    g.add(rearIndLens);

    const revMat = makeLensMat(0xd1d5db, 0xffffff, 0.0);
    lights.reverseMats.push(revMat);
    const revLens = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.04), revMat);
    revLens.position.set(sx * 0.56, 0.74, -4.47);
    g.add(revLens);
  }

  const markerMat = makeLensMat(0xd97706, 0xff9900, 1.2);
  lights.markerMats.push(markerMat);
  for (const mx of [-0.92, -0.46, 0, 0.46, 0.92]) {
    const mk = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.055, 0.07), markerMat);
    mk.position.set(mx, 2.98, 4.02);
    g.add(mk);
  }

  if (enableRealLights) {
    for (const sx of [-1, 1]) {
      const spot = new THREE.SpotLight(0xfff4d6, 3.2, 34, Math.PI * 0.24, 0.45, 1.3);
      spot.position.set(sx * 0.88, 0.82, 4.62);
      const target = new THREE.Object3D();
      target.position.set(sx * 0.72, 0.0, 16.0);
      g.add(target);
      spot.target = target;
      g.add(spot);
      if (sx > 0) lights.headSpotL = spot;
      else lights.headSpotR = spot;
    }

    const tailGlow = new THREE.PointLight(0xff2222, 0.65, 4.2, 1.8);
    tailGlow.position.set(0, 0.76, -4.75);
    g.add(tailGlow);
    lights.tailGlow = tailGlow;
  }

  return lights;
}

export function loadHighQualityTata2515(assetUrl = './assets/tata_2515.glb', { enableRealLights = true } = {}) {
  return new Promise((resolve, reject) => {
    const loader = createConfiguredGLTFLoader();
    loader.load(
      assetUrl,
      (gltf) => {
        const root = new THREE.Group();
        root.name = 'Tata_2515_HighQuality';

        const cabTex = makeWeatheredCabTextures();
        const cargoTex = makeCargoBodyTextures();
        const steelTex = makeBrushedSteelTexture();
        const tireTex = makeTruckTireTextures();

        // Photorealistic Weathered Highway PBR Materials (ZERO flat cartoon plastic!)
        const cabPaint = new THREE.MeshPhysicalMaterial({
          name: 'Tata_Cab_Paint',
          color: 0x8f1d1d, // Deep realistic Bangladeshi highway crimson
          map: cabTex.map,
          bumpMap: cabTex.bumpMap,
          bumpScale: 0.012,
          metalness: 0.22,
          roughness: 0.30,
          clearcoat: 0.82,
          clearcoatRoughness: 0.14,
          envMapIntensity: 1.25,
        });
        const trailerPaint = new THREE.MeshStandardMaterial({
          name: 'Tata_Trailer_Body',
          color: 0x1e324a, // Weathered deep slate-navy steel/timber cargo body
          map: cargoTex.map,
          bumpMap: cargoTex.bumpMap,
          bumpScale: 0.028,
          metalness: 0.16,
          roughness: 0.62,
          envMapIntensity: 0.85,
        });
        const chrome = new THREE.MeshPhysicalMaterial({
          name: 'Tata_Mirror_Chrome_Steel',
          color: 0xcbd2da,
          map: steelTex,
          metalness: 0.86,
          roughness: 0.20,
          clearcoat: 0.5,
          envMapIntensity: 1.55,
        });
        const brushedSteel = new THREE.MeshStandardMaterial({
          name: 'Tata_Brushed_Steel',
          color: 0x9aa4ae,
          map: steelTex,
          metalness: 0.72,
          roughness: 0.38,
          envMapIntensity: 1.20,
        });
        const darkMetal = new THREE.MeshStandardMaterial({
          name: 'Tata_Chassis_DarkMetal',
          color: 0x1a1e24,
          metalness: 0.52,
          roughness: 0.56,
          envMapIntensity: 0.85,
        });
        const glass = new THREE.MeshPhysicalMaterial({
          name: 'Tata_Cab_Glass',
          color: 0x16222a, // Realistic dark smoke-tinted truck windshield glass (NOT cartoon sky-blue!)
          transparent: true,
          opacity: 0.44,
          roughness: 0.05,
          metalness: 0.12,
          clearcoat: 1.0,
          clearcoatRoughness: 0.04,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        const mirror = new THREE.MeshPhysicalMaterial({
          color: 0xe6edf4,
          metalness: 0.96,
          roughness: 0.04,
          envMapIntensity: 2.0,
        });
        const dashMat = new THREE.MeshStandardMaterial({ color: 0x191d24, roughness: 0.74, metalness: 0.08 });
        const interiorTrim = new THREE.MeshStandardMaterial({ color: 0x262d38, roughness: 0.68, metalness: 0.06 });
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x121418, roughness: 0.94, metalness: 0.04 });
        const seatLeather = new THREE.MeshStandardMaterial({ color: 0x2c1f17, roughness: 0.64, metalness: 0.05 });
        const seatAccent = new THREE.MeshStandardMaterial({ color: 0x3d2a1e, roughness: 0.68, metalness: 0.04 });
        const roofLiner = new THREE.MeshStandardMaterial({ color: 0x9e9a92, roughness: 0.90, metalness: 0.02 });
        const domeLight = new THREE.MeshStandardMaterial({ color: 0xfff8dc, emissive: 0xffe08a, emissiveIntensity: 1.6 });
        const gaugeTex = makeGaugeClusterTexture();
        const gaugeMat = new THREE.MeshStandardMaterial({
          map: gaugeTex,
          emissive: 0xffffff,
          emissiveMap: gaugeTex,
          emissiveIntensity: 0.95,
          roughness: 0.18,
        });
        const reflectiveTape = new THREE.MeshStandardMaterial({
          map: makeReflectiveTapeTexture(),
          emissive: 0x330d0d,
          emissiveIntensity: 0.25,
          roughness: 0.35,
          metalness: 0.18,
        });
        const tataBadge = new THREE.MeshStandardMaterial({
          map: makeTataBadgeTexture(),
          roughness: 0.28,
          metalness: 0.55,
        });
        const tireMat = new THREE.MeshStandardMaterial({
          map: tireTex.map,
          bumpMap: tireTex.bumpMap,
          bumpScale: 0.032,
          color: 0x1e2126,
          roughness: 0.88,
          metalness: 0.03,
        });
        const hubMat = new THREE.MeshStandardMaterial({
          color: 0x6b1818,
          metalness: 0.48,
          roughness: 0.38,
        });

        const mats = {
          cabPaint, trailerPaint, chrome, brushedSteel, darkMetal, glass, mirror,
          dashMat, interiorTrim, floorMat, seatLeather, seatAccent, roofLiner,
          domeLight, gaugeMat, reflectiveTape, tataBadge, tireMat, hubMat,
        };

        const rawHolder = new THREE.Group();
        rawHolder.name = 'Tata_Base_Shell';
        rawHolder.rotation.x = -Math.PI / 2;
        rawHolder.scale.setScalar(TRUCK_SCALE);

        const innerNode = gltf.scene.getObjectByName('TATA2515.obj.cleaner.materialmerger.gles') || gltf.scene;
        const meshesToMove = [];
        innerNode.traverse((ch) => {
          if (ch.isMesh) meshesToMove.push(ch);
        });

        for (const m of meshesToMove) {
          const matName = m.material?.name || '';
          if (matName === 'WHEEL' || m.name === 'Object_6') {
            continue;
          }
          const clonedGeo = m.geometry.clone();
          if (matName === 'material_3' || matName === 'Mat_1') {
            cutDoorOpeningsFromGeometry(clonedGeo);
          }

          let nextMat = m.material;
          if (matName === 'material_3') {
            nextMat = cabPaint;
          } else if (matName === 'material') {
            nextMat = trailerPaint;
          } else if (matName === 'Mat_1') {
            nextMat = glass;
          } else if (matName === 'Mat_2') {
            nextMat = seatLeather;
          }

          const cleanMesh = new THREE.Mesh(clonedGeo, nextMat);
          cleanMesh.name = m.name;
          cleanMesh.castShadow = matName !== 'Mat_1';
          cleanMesh.receiveShadow = true;
          rawHolder.add(cleanMesh);
        }
        root.add(rawHolder);

        const doorFL = buildCabDoor(1, mats);
        const doorFR = buildCabDoor(-1, mats);
        root.add(doorFL, doorFR);

        const { steeringPivot, domePoint } = buildTruckInterior(root, mats, enableRealLights);
        const lights = buildExteriorSteelAndLights(root, mats, enableRealLights);

        const wheelNodes = {
          flSteer: new THREE.Group(),
          frSteer: new THREE.Group(),
          fl: null,
          fr: null,
          rl1: null,
          rr1: null,
          rl2: null,
          rr2: null,
        };
        const wheelRadius = 0.505;

        wheelNodes.flSteer.name = 'Wheel_FL_Steer';
        wheelNodes.flSteer.position.set(1.16, wheelRadius, 3.07);
        wheelNodes.fl = buildRealisticTruckWheel({ radius: wheelRadius, width: 0.27, isDual: false, outboardSign: 1, tireMat, rimSteelMat: brushedSteel, darkSteelMat: darkMetal, hubMat });
        wheelNodes.fl.name = 'Wheel_FL';
        wheelNodes.flSteer.add(wheelNodes.fl);
        root.add(wheelNodes.flSteer);

        wheelNodes.frSteer.name = 'Wheel_FR_Steer';
        wheelNodes.frSteer.position.set(-1.16, wheelRadius, 3.07);
        wheelNodes.fr = buildRealisticTruckWheel({ radius: wheelRadius, width: 0.27, isDual: false, outboardSign: -1, tireMat, rimSteelMat: brushedSteel, darkSteelMat: darkMetal, hubMat });
        wheelNodes.fr.name = 'Wheel_FR';
        wheelNodes.frSteer.add(wheelNodes.fr);
        root.add(wheelNodes.frSteer);

        wheelNodes.rl1 = buildRealisticTruckWheel({ radius: wheelRadius, width: 0.26, isDual: true, outboardSign: 1, tireMat, rimSteelMat: brushedSteel, darkSteelMat: darkMetal, hubMat });
        wheelNodes.rl1.name = 'Wheel_RL1';
        wheelNodes.rl1.position.set(1.16, wheelRadius, -1.06);
        root.add(wheelNodes.rl1);

        wheelNodes.rr1 = buildRealisticTruckWheel({ radius: wheelRadius, width: 0.26, isDual: true, outboardSign: -1, tireMat, rimSteelMat: brushedSteel, darkSteelMat: darkMetal, hubMat });
        wheelNodes.rr1.name = 'Wheel_RR1';
        wheelNodes.rr1.position.set(-1.16, wheelRadius, -1.06);
        root.add(wheelNodes.rr1);

        wheelNodes.rl2 = buildRealisticTruckWheel({ radius: wheelRadius, width: 0.26, isDual: true, outboardSign: 1, tireMat, rimSteelMat: brushedSteel, darkSteelMat: darkMetal, hubMat });
        wheelNodes.rl2.name = 'Wheel_RL2';
        wheelNodes.rl2.position.set(1.16, wheelRadius, -2.43);
        root.add(wheelNodes.rl2);

        wheelNodes.rr2 = buildRealisticTruckWheel({ radius: wheelRadius, width: 0.26, isDual: true, outboardSign: -1, tireMat, rimSteelMat: brushedSteel, darkSteelMat: darkMetal, hubMat });
        wheelNodes.rr2.name = 'Wheel_RR2';
        wheelNodes.rr2.position.set(-1.16, wheelRadius, -2.43);
        root.add(wheelNodes.rr2);

        for (const az of [-1.06, -2.43]) {
          const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 2.0, 12), darkMetal);
          axle.rotation.z = Math.PI / 2;
          axle.position.set(0, wheelRadius, az);
          root.add(axle);
          const diff = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), darkMetal);
          diff.position.set(0, wheelRadius, az);
          root.add(diff);
        }

        const api = {
          root,
          mats,
          doors: { fl: doorFL, fr: doorFR },
          wheels: wheelNodes,
          steeringWheel: steeringPivot,
          domePoint,
          lights,
          setCabPaint(cabHex, trailerHex) {
            cabPaint.color.set(cabHex);
            if (trailerHex) trailerPaint.color.set(trailerHex);
          },
          applyLights({ headlights = true, highBeam = false, brake = false, reverse = false, indLeft = false, indRight = false, hazard = false, blinkOn = true, cabinLight = true } = {}) {
            const hlVal = headlights ? (highBeam ? 3.2 : 1.7) : 0.0;
            for (const m of lights.headlightMats) m.emissiveIntensity = hlVal;
            for (const m of lights.fogMats) m.emissiveIntensity = headlights ? 1.2 : 0.0;
            for (const m of lights.taillightMats) m.emissiveIntensity = headlights ? 1.5 : 0.22;
            for (const m of lights.markerMats) m.emissiveIntensity = headlights ? 1.3 : 0.18;
            for (const m of lights.brakeMats) m.emissiveIntensity = brake ? 3.5 : (headlights ? 0.5 : 0.0);
            for (const m of lights.reverseMats) m.emissiveIntensity = reverse ? 2.6 : 0.0;

            const leftActive = (indLeft || hazard) && blinkOn;
            const rightActive = (indRight || hazard) && blinkOn;
            for (const m of lights.indLeftMats) m.emissiveIntensity = leftActive ? 3.8 : 0.0;
            for (const m of lights.indRightMats) m.emissiveIntensity = rightActive ? 3.8 : 0.0;

            if (lights.headSpotL) lights.headSpotL.intensity = headlights ? (highBeam ? 7.5 : 3.6) : 0.0;
            if (lights.headSpotR) lights.headSpotR.intensity = headlights ? (highBeam ? 7.5 : 3.6) : 0.0;
            if (lights.tailGlow) lights.tailGlow.intensity = brake ? 1.8 : (headlights ? 0.65 : 0.0);
            if (domePoint) domePoint.intensity = cabinLight ? 1.0 : 0.0;
            domeLight.emissiveIntensity = cabinLight ? 1.6 : 0.1;
          },
        };

        resolve(api);
      },
      undefined,
      reject,
    );
  });
}
