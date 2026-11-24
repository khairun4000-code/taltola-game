import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { box, cylinder, rodBetween, facadeShape, polygonShape, mergeStaticMeshes } from './scene-utils.js';
import { TALTOLA_HOUSE_OFFSET } from './khulna-geo.js';

const TV_CHANNELS = [
  { id: 'news', name: 'SOMOY NEWS 24', accent: '#dc2626', bgTop: '#0c4a6e', bgBot: '#0f172a' },
  { id: 'cricket', name: 'BD CRICKET LIVE', accent: '#16a34a', bgTop: '#065f46', bgBot: '#14532d' },
  { id: 'music', name: 'KHULNA MUSIC HD', accent: '#9333ea', bgTop: '#312e81', bgBot: '#0f172a' },
  { id: 'cinema', name: 'BANGLA CINEMA', accent: '#ea580c', bgTop: '#9a3412', bgBot: '#1e3a5f' },
];

function playRemoteClickBeep(freq = 1280, dur = 0.045) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!window.__taltolaRemoteAudioCtx) window.__taltolaRemoteAudioCtx = new AC();
    const ctx = window.__taltolaRemoteAudioCtx;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch {}
}

function createLiveTVBroadcastSystem() {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 216;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const tvOnMat = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
  const tvOffMat = new THREE.MeshStandardMaterial({
    color: 0x0b0e13,
    roughness: 0.14,
    metalness: 0.25,
    envMapIntensity: 0.9,
  });

  let lastDrawMs = 0;

  function drawChannel(channelIndex, timeSec) {
    const ch = TV_CHANNELS[channelIndex % TV_CHANNELS.length] || TV_CHANNELS[0];
    const W = canvas.width;
    const H = canvas.height;

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, ch.bgTop);
    grad.addColorStop(1, ch.bgBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    if (ch.id === 'news') {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(18, 42, W - 36, 120);
      ctx.strokeStyle = 'rgba(56,189,248,0.28)';
      ctx.lineWidth = 2;
      const shift = (timeSec * 22) % 36;
      for (let gx = 20 + shift; gx < W - 20; gx += 36) {
        ctx.beginPath();
        ctx.moveTo(gx, 44);
        ctx.lineTo(gx, 160);
        ctx.stroke();
      }
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(W * 0.5, 92, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(W * 0.5 - 32, 112, 64, 50, 14);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(W * 0.5 - 4, 116, 8, 26);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 174, W, 42);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 174, 92, 42);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Arial';
      ctx.fillText('BREAKING', 12, 200);
      ctx.save();
      ctx.beginPath();
      ctx.rect(96, 174, W - 96, 42);
      ctx.clip();
      const tickerText = 'খুলনা তালতলা লাইভ নিউজ  •  KHULNA VI OPEN WORLD  •  ROYAL MORE & ALIA MADRASAH LIVE  •  ';
      const tx = W - ((timeSec * 58) % (W + 460));
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 13px Arial';
      ctx.fillText(tickerText, tx, 200);
      ctx.restore();
    } else if (ch.id === 'cricket') {
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 88, W, 128);
      ctx.fillStyle = '#d4b483';
      ctx.fillRect(W * 0.42, 100, W * 0.16, 86);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      for (let i = 0; i < 28; i++) {
        ctx.fillRect(10 + i * 13, 62 + ((i * 7) % 18), 7, 7);
      }
      const bx = W * 0.5 + Math.sin(timeSec * 3.8) * 110;
      const by = 135 - Math.abs(Math.cos(timeSec * 3.8)) * 42;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(15,23,42,0.92)';
      ctx.fillRect(0, 178, W, 38);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, 178, 82, 38);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('BAN', 22, 202);
      const runs = 184 + (Math.floor(timeSec * 0.4) % 12);
      ctx.fillText(`${runs}/3  (17.4 OV)  •  KHULNA STADIUM`, 94, 202);
    } else if (ch.id === 'music') {
      const bars = 18;
      const bw = (W - 48) / bars;
      for (let i = 0; i < bars; i++) {
        const amp = 0.25 + 0.75 * Math.abs(Math.sin(timeSec * 4.2 + i * 0.55));
        const bh = amp * 110;
        ctx.fillStyle = i % 2 === 0 ? '#ec4899' : '#38bdf8';
        ctx.fillRect(24 + i * bw, 168 - bh, bw - 4, bh);
      }
      ctx.fillStyle = 'rgba(15,23,42,0.85)';
      ctx.fillRect(0, 176, W, 40);
      ctx.fillStyle = '#f472b6';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('♪ NOW PLAYING: KHULNA NIGHTS (LIVE HD)', 22, 201);
    } else {
      const sunY = 74 + Math.sin(timeSec * 0.6) * 4;
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(W * 0.72, sunY, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0c4a6e';
      ctx.fillRect(0, 128, W, 88);
      const boatX = ((timeSec * 28) % (W + 100)) - 50;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(boatX, 148);
      ctx.lineTo(boatX + 54, 148);
      ctx.lineTo(boatX + 44, 160);
      ctx.lineTo(boatX + 10, 160);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.fillRect(boatX + 16, 136, 22, 12);
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 182, W, 34);
      ctx.fillStyle = '#fed7aa';
      ctx.font = 'bold 13px Arial';
      ctx.fillText('★ BANGLA CINEMA HD · রূপসা নদীর গল্প', 22, 204);
    }

    const pulse = Math.sin(timeSec * 5.0) > -0.2;
    ctx.fillStyle = pulse ? ch.accent : '#7f1d1d';
    ctx.fillRect(14, 12, 56, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Arial';
    ctx.fillText('● LIVE', 20, 26);
    ctx.fillStyle = 'rgba(15,23,42,0.82)';
    ctx.fillRect(74, 12, 132, 20);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(ch.name, 82, 26);

    texture.needsUpdate = true;
  }

  drawChannel(0, 0);

  return {
    tvOnMat,
    tvOffMat,
    update(channelIndex, nowMs) {
      if (nowMs - lastDrawMs < 110) return;
      lastDrawMs = nowMs;
      drawChannel(channelIndex, nowMs * 0.001);
    },
  };
}

function frontWindow(group, m, { x = 6.16, y, z, width, height, grill = false, frosted = false, openable = true }) {
  if (!openable) {
    box(group, [0.09, height + 0.14, width + 0.14], [x, y, z], m.interior);
  }
  box(group, [0.045, height, width], [x - 0.065, y, z], frosted ? m.frostedGlass : m.glass);
  const frameX = x - 0.105;
  box(group, [0.07, 0.055, width + 0.12], [frameX, y - height / 2, z], m.aluminum);
  box(group, [0.07, 0.055, width + 0.12], [frameX, y + height / 2, z], m.aluminum);
  box(group, [0.07, height, 0.055], [frameX, y, z - width / 2], m.aluminum);
  box(group, [0.07, height, 0.055], [frameX, y, z + width / 2], m.aluminum);
  box(group, [0.075, height, 0.045], [frameX - 0.005, y, z], m.aluminum);
  if (!frosted) box(group, [0.075, 0.04, width], [frameX - 0.008, y + height * 0.12, z], m.aluminum);
  if (grill) {
    const grillX = x - 0.21;
    const count = Math.floor(width / 0.18);
    for (let i = 0; i <= count; i++) {
      const gz = z - width / 2 + (i / count) * width;
      rodBetween(group, [grillX, y - height / 2 - 0.08, gz], [grillX, y + height / 2 + 0.08, gz], 0.012, m.rail, 6);
    }
    for (let gy = y - height / 2; gy <= y + height / 2 + 0.01; gy += 0.42) {
      rodBetween(group, [grillX, gy, z - width / 2 - 0.07], [grillX, gy, z + width / 2 + 0.07], 0.012, m.rail, 6);
    }
  }
}

function backWindow(group, m, { x = 14.24, y, z, width, height, grill = false, frosted = false, canopy = false, openable = true }) {
  if (!openable) {
    box(group, [0.09, height + 0.14, width + 0.14], [x, y, z], m.interior);
  }
  box(group, [0.045, height, width], [x + 0.065, y, z], frosted ? m.frostedGlass : m.glass);
  const frameX = x + 0.105;
  box(group, [0.07, 0.055, width + 0.12], [frameX, y - height / 2, z], m.aluminum);
  box(group, [0.07, 0.055, width + 0.12], [frameX, y + height / 2, z], m.aluminum);
  box(group, [0.07, height, 0.055], [frameX, y, z - width / 2], m.aluminum);
  box(group, [0.07, height, 0.055], [frameX, y, z + width / 2], m.aluminum);
  box(group, [0.075, height, 0.045], [frameX + 0.005, y, z], m.aluminum);
  if (!frosted) box(group, [0.075, 0.04, width], [frameX + 0.008, y + height * 0.12, z], m.aluminum);
  if (grill) {
    const grillX = x + 0.19;
    const count = Math.floor(width / 0.18);
    for (let i = 0; i <= count; i++) {
      const gz = z - width / 2 + (i / count) * width;
      rodBetween(group, [grillX, y - height / 2 - 0.06, gz], [grillX, y + height / 2 + 0.06, gz], 0.011, m.rail, 6);
    }
    for (let gy = y - height / 2; gy <= y + height / 2 + 0.01; gy += 0.42) {
      rodBetween(group, [grillX, gy, z - width / 2 - 0.06], [grillX, gy, z + width / 2 + 0.06], 0.011, m.rail, 6);
    }
  }
  if (canopy) {
    box(group, [0.46, 0.09, width + 0.45], [x + 0.26, y + height / 2 + 0.14, z], m.trim);
  }
}

function sideWindow(group, m, { x, y, z, side, width, height, grill = true, frosted = false, canopy = true, openable = true }) {
  const dir = side;
  if (!openable) {
    box(group, [width + 0.14, height + 0.14, 0.09], [x, y, z], m.interior);
  }
  box(group, [width, height, 0.045], [x, y, z + dir * 0.055], frosted ? m.frostedGlass : m.glass);
  const frameZ = z + dir * 0.095;
  box(group, [width + 0.12, 0.055, 0.07], [x, y - height / 2, frameZ], m.aluminum);
  box(group, [width + 0.12, 0.055, 0.07], [x, y + height / 2, frameZ], m.aluminum);
  box(group, [0.055, height, 0.07], [x - width / 2, y, frameZ], m.aluminum);
  box(group, [0.055, height, 0.07], [x + width / 2, y, frameZ], m.aluminum);
  if (!frosted) {
    box(group, [0.045, height, 0.075], [x, y, frameZ + dir * 0.005], m.aluminum);
    box(group, [width, 0.04, 0.075], [x, y + height * 0.14, frameZ + dir * 0.006], m.aluminum);
  } else {
    for (let ly = y - height * 0.32; ly <= y + height * 0.34; ly += 0.24) {
      rodBetween(group, [x - width * 0.45, ly, frameZ + dir * 0.02], [x + width * 0.45, ly, frameZ + dir * 0.02], 0.009, m.aluminum, 5);
    }
  }
  if (grill) {
    const grillZ = z + dir * 0.17;
    const count = Math.max(2, Math.floor(width / 0.18));
    for (let i = 0; i <= count; i++) {
      const gx = x - width / 2 + (i / count) * width;
      rodBetween(group, [gx, y - height / 2 - 0.05, grillZ], [gx, y + height / 2 + 0.05, grillZ], 0.011, m.rail, 6);
    }
    for (let gy = y - height / 2; gy <= y + height / 2 + 0.01; gy += 0.4) {
      rodBetween(group, [x - width / 2 - 0.05, gy, grillZ], [x + width / 2 + 0.05, gy, grillZ], 0.011, m.rail, 6);
    }
  }
  if (canopy) {
    box(group, [width + 0.44, 0.09, 0.46], [x, y + height / 2 + 0.13, z + dir * 0.24], m.trim);
    box(group, [width + 0.48, 0.04, 0.06], [x, y + height / 2 + 0.09, z + dir * 0.45], m.whiteBand);
  }
}

function balconyRail(group, m, floorY, zCenter, width, solid = false) {
  const frontX = 4.84;
  const baseY = floorY + 0.15;
  if (solid) {
    box(group, [0.16, 0.58, width], [frontX + 0.05, baseY + 0.29, zCenter], m.plaster);
    box(group, [0.24, 0.08, width + 0.12], [frontX + 0.03, baseY + 0.61, zCenter], m.trim);
  }
  const startY = solid ? baseY + 0.62 : baseY;
  const topY = baseY + 1.05;
  for (const y of solid ? [startY + 0.12, topY] : [startY + 0.12, startY + 0.36, startY + 0.62, topY]) {
    rodBetween(group, [frontX - 0.04, y, zCenter - width / 2], [frontX - 0.04, y, zCenter + width / 2], 0.022, m.rail, 10);
  }
  const posts = Math.ceil(width / 0.58);
  for (let i = 0; i <= posts; i++) {
    const z = zCenter - width / 2 + (i / posts) * width;
    rodBetween(group, [frontX - 0.04, startY, z], [frontX - 0.04, topY, z], i === 0 || i === posts ? 0.032 : 0.02, m.rail, 8);
  }
  for (const z of [zCenter - width / 2, zCenter + width / 2]) {
    rodBetween(group, [frontX, topY, z], [6.15, topY, z], 0.025, m.rail, 10);
    rodBetween(group, [frontX, startY + 0.12, z], [6.15, startY + 0.12, z], 0.02, m.rail, 8);
  }
}

function backBalconyRail(group, m, floorY, zCenter, width, hasGrill = false) {
  const backX = 15.36;
  const baseY = floorY + 0.12;
  box(group, [0.14, 0.45, width], [backX - 0.04, baseY + 0.22, zCenter], m.plaster);
  box(group, [0.22, 0.07, width + 0.08], [backX - 0.02, baseY + 0.48, zCenter], m.trim);
  const startY = baseY + 0.5;
  const topY = baseY + 1.04;
  for (const y of [startY + 0.15, startY + 0.35, topY]) {
    rodBetween(group, [backX + 0.02, y, zCenter - width / 2], [backX + 0.02, y, zCenter + width / 2], 0.022, m.rail, 8);
  }
  const posts = Math.ceil(width / 0.6);
  for (let i = 0; i <= posts; i++) {
    const z = zCenter - width / 2 + (i / posts) * width;
    rodBetween(group, [backX + 0.02, startY, z], [backX + 0.02, topY, z], i === 0 || i === posts ? 0.03 : 0.018, m.rail, 8);
  }
  if (hasGrill) {
    const topGrill = floorY + 2.72;
    for (let z = zCenter - width / 2; z <= zCenter + width / 2 + 0.01; z += 0.2) {
      rodBetween(group, [backX + 0.03, topY, z], [backX + 0.03, topGrill, z], 0.012, m.rail, 6);
    }
    for (let y = topY + 0.42; y <= topGrill; y += 0.45) {
      rodBetween(group, [backX + 0.03, y, zCenter - width / 2], [backX + 0.03, y, zCenter + width / 2], 0.013, m.rail, 6);
    }
  }
}

function securityGrill(group, m, floorY, zCenter, width, x = 4.79) {
  const bottom = floorY + 0.17;
  const top = floorY + 2.72;
  for (let z = zCenter - width / 2; z <= zCenter + width / 2 + 0.01; z += 0.18) {
    rodBetween(group, [x, bottom, z], [x, top, z], 0.013, m.rail, 6);
  }
  for (let y = bottom; y <= top; y += 0.38) {
    rodBetween(group, [x, y, zCenter - width / 2], [x, y, zCenter + width / 2], 0.014, m.rail, 6);
  }
}

function addBlueTarp(group, m) {
  const geometry = new THREE.PlaneGeometry(1.75, 1.12, 18, 10);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    positions.setZ(i, Math.sin(positions.getX(i) * 25) * 0.02 + Math.sin(positions.getY(i) * 8) * 0.014);
  }
  geometry.computeVertexNormals();
  geometry.rotateY(-Math.PI / 2);
  const tarp = new THREE.Mesh(geometry, m.blueTarp);
  tarp.position.set(4.72, 7.16, -3.55);
  tarp.castShadow = true;
  group.add(tarp);
  rodBetween(group, [4.75, 7.74, -4.48], [4.75, 7.74, -2.62], 0.018, m.rail);
}

function bandShape(u1, v1, u2, v2, width) {
  const dx = u2 - u1;
  const dy = v2 - v1;
  const length = Math.hypot(dx, dy);
  const px = (-dy / length) * width * 0.5;
  const py = (dx / length) * width * 0.5;
  return polygonShape([
    [u1 + px, v1 + py], [u2 + px, v2 + py], [u2 - px, v2 - py], [u1 - px, v1 - py],
  ]);
}

function diamondShape(u, v, radiusX, radiusY = radiusX) {
  return polygonShape([[u, v + radiusY], [u + radiusX, v], [u, v - radiusY], [u - radiusX, v]]);
}

function buildGateWing(m, side) {
  const wingPivot = new THREE.Group();
  wingPivot.position.set(2.48, 0, side * 2.12);

  const wingStatic = new THREE.Group();
  wingPivot.add(wingStatic);

  const dir = -side;
  const zOuterCenter = dir * 0.53;
  const zInnerCenter = dir * 1.57;

  for (const pCenter of [zOuterCenter, zInnerCenter]) {
    box(wingStatic, [0.055, 1.62, 1.0], [0.03, 1.07, pCenter], m.gate);
    for (const edge of [-0.5, 0.5]) {
      box(wingStatic, [0.075, 2.08, 0.042], [0.01, 1.15, pCenter + edge], m.gateInset);
    }
    for (const y of [0.26, 1.88]) {
      box(wingStatic, [0.072, 0.045, 1.02], [0.01, y, pCenter], m.gateInset);
    }
  }

  for (const y of [1.98, 2.08, 2.18]) {
    rodBetween(wingStatic, [0.01, y, dir * 0.02], [0.01, y, dir * 2.09], 0.015, m.rail, 8);
  }
  for (const y of [0.11, 0.19]) {
    rodBetween(wingStatic, [0.01, y, dir * 0.02], [0.01, y, dir * 2.09], 0.016, m.gateInset, 8);
  }
  cylinder(wingStatic, 0.045, 0.045, 0.04, [0.05, 0.045, dir * 1.85], m.darkMetal, 10).rotation.z = Math.PI / 2;

  for (let i = 0; i < 4; i++) {
    const barY = 1.12 - i * 0.068;
    const uStart = zOuterCenter - 0.46;
    const uEnd = zOuterCenter + 0.46;
    facadeShape(wingStatic, bandShape(uStart, barY, uEnd, barY, 0.048), -0.004, m.darkMetal);
    facadeShape(wingStatic, bandShape(uStart, barY + 0.003, uEnd, barY + 0.003, 0.016), -0.009, m.rail);
  }
  for (const dy of [1.51, 0.56]) {
    facadeShape(wingStatic, diamondShape(zOuterCenter, dy, 0.25, 0.19), -0.005, m.rail);
    facadeShape(wingStatic, diamondShape(zOuterCenter, dy, 0.21, 0.155), -0.01, m.orange);
  }

  const uEdge = dir * 1.09;
  const uMid = dir * 2.05;
  for (let i = 0; i < 4; i++) {
    const topOuterY = 1.83 - i * 0.072;
    const topInnerY = 1.38 - i * 0.072;
    facadeShape(wingStatic, bandShape(uEdge, topOuterY, uMid, topInnerY, 0.052), -0.004, m.darkMetal);
    facadeShape(wingStatic, bandShape(uEdge, topOuterY + 0.003, uMid, topInnerY + 0.003, 0.017), -0.009, m.rail);

    const botOuterY = 0.94 - i * 0.072;
    const botInnerY = 0.49 - i * 0.072;
    facadeShape(wingStatic, bandShape(uEdge, botOuterY, uMid, botInnerY, 0.052), -0.004, m.darkMetal);
    facadeShape(wingStatic, bandShape(uEdge, botOuterY + 0.003, uMid, botInnerY + 0.003, 0.017), -0.009, m.rail);
  }

  const pU1 = dir * 1.24;
  const pU2 = dir * 1.91;
  const outerParallelogram = polygonShape([
    [pU1, 1.41], [pU2, 1.12], [pU2, 0.72], [pU1, 1.01],
  ]);
  facadeShape(wingStatic, outerParallelogram, -0.005, m.rail);
  const innerParallelogram = polygonShape([
    [dir * 1.27, 1.36], [dir * 1.88, 1.09], [dir * 1.88, 0.77], [dir * 1.27, 1.04],
  ]);
  facadeShape(wingStatic, innerParallelogram, -0.01, m.orange);

  if (side === -1) {
    const weatherPatch = polygonShape([
      [1.46, 1.23], [1.67, 1.14], [1.67, 0.91], [1.46, 0.99],
    ]);
    facadeShape(wingStatic, weatherPatch, -0.013, m.gate);
  }

  const rivetGeometry = new THREE.SphereGeometry(0.02, 7, 5);
  const rivetPositions = [
    [zOuterCenter, 1.51], [zOuterCenter, 0.56],
    [zOuterCenter - 0.32, 1.74], [zOuterCenter + 0.32, 1.74],
    [zOuterCenter - 0.32, 1.28], [zOuterCenter + 0.32, 1.28],
    [zOuterCenter - 0.32, 0.78], [zOuterCenter + 0.32, 0.78],
    [zOuterCenter - 0.32, 0.36], [zOuterCenter + 0.32, 0.36],
    [zInnerCenter, 1.06],
    [dir * 1.28, 1.52], [dir * 1.85, 1.26],
    [dir * 1.28, 0.56], [dir * 1.85, 0.34],
  ];
  for (const [rz, ry] of rivetPositions) {
    const rivet = new THREE.Mesh(rivetGeometry, m.rail);
    rivet.position.set(-0.014, ry, rz);
    wingStatic.add(rivet);
  }

  if (side === 1) {
    box(wingStatic, [0.12, 0.16, 0.08], [-0.01, 1.04, dir * 1.98], m.rail);
    cylinder(wingStatic, 0.03, 0.03, 0.12, [-0.04, 1.04, dir * 1.98], m.darkMetal, 10).rotation.z = Math.PI / 2;
  }

  mergeStaticMeshes(wingStatic);
  return wingPivot;
}

/**
 * Exterior Front/Back Entrance Door (hinged along Z axis)
 */
function buildWoodenDoor(m, position, hingeSide = 1) {
  const pivot = new THREE.Group();
  pivot.position.set(...position);
  const doorStatic = new THREE.Group();
  pivot.add(doorStatic);

  const w = 1.22;
  const h = 2.34;
  const zCenter = hingeSide * (w / 2);
  box(doorStatic, [0.075, h, w], [0, h / 2, zCenter], m.wood);
  for (const py of [0.56, 1.3, 1.94]) {
    const ph = py > 1.7 ? 0.36 : 0.54;
    for (const pz of [-0.26, 0.26]) {
      box(doorStatic, [0.095, ph, 0.38], [0, py, zCenter + pz], m.gateInset);
      box(doorStatic, [0.108, ph - 0.06, 0.32], [0, py, zCenter + pz], m.wood);
    }
  }
  const handleZ = zCenter + hingeSide * 0.44;
  box(doorStatic, [0.15, 0.26, 0.045], [0, 1.08, handleZ], m.chrome);
  cylinder(doorStatic, 0.02, 0.02, 0.2, [0, 1.08, handleZ], m.chrome, 8).rotation.z = Math.PI / 2;

  mergeStaticMeshes(doorStatic);
  return pivot;
}

/**
 * Interior Apartment Flat Door (aligned along X axis on corridor walls z = ±1.18)
 */
function buildApartmentDoor(m, position) {
  const pivot = new THREE.Group();
  pivot.position.set(...position);
  const doorStatic = new THREE.Group();
  pivot.add(doorStatic);

  const w = 1.12;
  const h = 2.26;
  const xCenter = w / 2;
  box(doorStatic, [w, h, 0.07], [xCenter, h / 2, 0], m.wood);
  for (const py of [0.55, 1.28, 1.88]) {
    const ph = py > 1.65 ? 0.34 : 0.52;
    for (const px of [-0.24, 0.24]) {
      box(doorStatic, [0.34, ph, 0.09], [xCenter + px, py, 0], m.gateInset);
      box(doorStatic, [0.28, ph - 0.06, 0.102], [xCenter + px, py, 0], m.wood);
    }
  }
  // Golden/Chrome nameplate & handle
  box(doorStatic, [0.22, 0.08, 0.09], [xCenter, 1.62, 0], m.chrome);
  const handleX = xCenter + 0.42;
  box(doorStatic, [0.045, 0.24, 0.14], [handleX, 1.05, 0], m.chrome);
  cylinder(doorStatic, 0.018, 0.018, 0.18, [handleX, 1.05, 0], m.chrome, 8).rotation.x = Math.PI / 2;

  mergeStaticMeshes(doorStatic);
  return pivot;
}

function createCeilingFan(parent, position, m, animatedFans = null) {
  if (!animatedFans) {
    // Static merged ceiling fan for upper floors to save draw calls
    cylinder(parent, 0.02, 0.02, 0.32, [position[0], position[1] - 0.16, position[2]], m.whiteBand, 8);
    cylinder(parent, 0.14, 0.14, 0.06, [position[0], position[1] - 0.32, position[2]], m.whiteBand, 12);
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const bx = position[0] + Math.cos(angle) * 0.36;
      const bz = position[2] + Math.sin(angle) * 0.36;
      box(parent, [0.52, 0.012, 0.12], [bx, position[1] - 0.32, bz], m.whiteBand);
    }
    return;
  }
  const fanGroup = new THREE.Group();
  fanGroup.position.set(...position);
  parent.add(fanGroup);

  cylinder(fanGroup, 0.02, 0.02, 0.32, [0, -0.16, 0], m.whiteBand, 8);
  const rotor = new THREE.Group();
  rotor.position.set(0, -0.32, 0);
  fanGroup.add(rotor);

  cylinder(rotor, 0.14, 0.14, 0.06, [0, 0, 0], m.whiteBand, 14);
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.012, 0.11), m.whiteBand);
    blade.position.set(Math.cos(angle) * 0.36, 0, Math.sin(angle) * 0.36);
    blade.rotation.y = -angle;
    rotor.add(blade);
  }
  animatedFans.push(rotor);
}

/**
 * Builds a complete, realistic 55-inch 4K Smart TV + Media Console + Soundbar + Live Screen
 * wallSide = 1 means screen faces -X (mounted on x = wallX), wallSide = -1 means screen faces +X
 */
function buildSmartTVUnit(staticGroup, dynamicParent, m, tvSystem, interactiveTVs, { x, fy, z, faceDir = -1, lvl = 0, unitLabel = '1A', defaultOn = true, defaultChannel = 0 }) {
  // Wooden Media Console Table underneath
  box(staticGroup, [0.42, 0.46, 1.76], [x + faceDir * 0.18, fy + 0.27, z], m.wood);
  box(staticGroup, [0.45, 0.04, 1.82], [x + faceDir * 0.18, fy + 0.51, z], m.blackTile);
  // Set-top box / Wi-Fi router with green LED
  box(staticGroup, [0.22, 0.05, 0.34], [x + faceDir * 0.22, fy + 0.56, z - 0.42], m.darkMetal);
  box(staticGroup, [0.02, 0.02, 0.04], [x + faceDir * 0.33, fy + 0.56, z - 0.36], m.ledGreen);
  // TV Remote Control resting neatly on the media console
  box(staticGroup, [0.16, 0.022, 0.055], [x + faceDir * 0.24, fy + 0.545, z + 0.48], m.darkMetal);
  box(staticGroup, [0.02, 0.026, 0.02], [x + faceDir * 0.30, fy + 0.548, z + 0.48], m.ledRed);
  // Soundbar Speaker below TV
  box(staticGroup, [0.09, 0.08, 1.05], [x + faceDir * 0.15, fy + 0.62, z], m.darkMetal);
  box(staticGroup, [0.095, 0.02, 0.96], [x + faceDir * 0.15, fy + 0.62, z], m.chrome);

  // Wall mount bracket & 55-inch 4K Bezel Frame
  const tvY = fy + 1.42;
  const tvW = 1.48;
  const tvH = 0.86;
  box(staticGroup, [0.06, tvH + 0.08, tvW + 0.08], [x + faceDir * 0.04, tvY, z], m.darkMetal);
  box(staticGroup, [0.07, tvH + 0.02, tvW + 0.02], [x + faceDir * 0.055, tvY, z], m.blackTile);

  // Dynamic Interactive Screen Plane (separate from merged meshes so Remote turns it ON/OFF live!)
  const screenGeo = new THREE.PlaneGeometry(tvW - 0.04, tvH - 0.04);
  screenGeo.rotateY(faceDir * (Math.PI / 2));
  const screenPlane = new THREE.Mesh(screenGeo, defaultOn ? tvSystem.tvOnMat : tvSystem.tvOffMat);
  screenPlane.position.set(x + faceDir * 0.096, tvY, z);
  dynamicParent.add(screenPlane);

  // Dynamic Power Indicator LED (Green = ON, Red = Standby OFF)
  const ledMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.022, 0.036),
    defaultOn ? m.ledGreen : m.ledRed
  );
  ledMesh.position.set(x + faceDir * 0.094, tvY - tvH / 2 - 0.015, z + 0.62);
  dynamicParent.add(ledMesh);

  interactiveTVs.push({
    level: lvl,
    unit: unitLabel,
    x,
    y: fy,
    z,
    isOn: defaultOn,
    channel: defaultChannel % TV_CHANNELS.length,
    screenMesh: screenPlane,
    ledMesh,
  });
}

/**
 * Builds a fully equipped attached Bathroom (বাথরুম) with ceramic tiles, Western commode,
 * wash basin, REAL reflective mirror slot, chrome overhead shower, towel rack, and blue plastic bucket & mug.
 */
function buildAttachedBathroom(staticGroup, m, fy, side, lvl, mirrorSlots) {
  // side = -1 (Unit A Bathroom: x = 9.65..11.45, z = -5.28..-2.55)
  // side = +1 (Unit B Bathroom: x = 9.65..11.45, z = +2.55..+5.28)
  const zMin = side === -1 ? -5.26 : 2.58;
  const zMax = side === -1 ? -2.58 : 5.26;
  const zCenter = (zMin + zMax) * 0.5; // -3.92 or +3.92
  const zOuter = side === -1 ? -5.18 : 5.18;

  // Aqua non-slip ceramic bathroom floor tile & dado wall tile wainscoting (inset 2cm from wall faces to prevent z-fighting)
  box(staticGroup, [1.62, 0.03, 2.60], [10.55, fy + 0.085, zCenter], m.bathTile);
  box(staticGroup, [1.62, 1.45, 0.03], [10.55, fy + 0.82, zOuter - side * 0.04], m.bathTile);
  box(staticGroup, [0.03, 1.45, 2.58], [9.74, fy + 0.82, zCenter], m.bathTile);
  box(staticGroup, [0.03, 1.45, 2.58], [11.36, fy + 0.82, zCenter], m.bathTile);

  // 1. Western Porcelain Commode / Toilet (কমোড) along x = 9.98, near outer wall
  const commodeZ = side === -1 ? -4.72 : 4.72;
  cylinder(staticGroup, 0.19, 0.15, 0.38, [10.02, fy + 0.27, commodeZ], m.porcelain, 14);
  cylinder(staticGroup, 0.23, 0.20, 0.08, [10.05, fy + 0.46, commodeZ], m.porcelain, 14);
  cylinder(staticGroup, 0.22, 0.22, 0.03, [10.05, fy + 0.51, commodeZ], m.whiteBand, 14);
  // Water Cistern Tank & Chrome Flush Button
  box(staticGroup, [0.20, 0.42, 0.42], [9.82, fy + 0.72, commodeZ], m.porcelain);
  box(staticGroup, [0.22, 0.04, 0.44], [9.82, fy + 0.94, commodeZ], m.porcelain);
  cylinder(staticGroup, 0.03, 0.03, 0.03, [9.82, fy + 0.97, commodeZ], m.chrome, 10);

  // 2. Porcelain Pedestal Wash Basin & Real-Time Mirror (বেসিন ও আসল আয়না) at x = 9.95, z = -3.38 / +3.38
  const basinZ = side === -1 ? -3.38 : 3.38;
  cylinder(staticGroup, 0.11, 0.13, 0.68, [9.92, fy + 0.42, basinZ], m.porcelain, 12);
  box(staticGroup, [0.42, 0.14, 0.52], [9.96, fy + 0.82, basinZ], m.porcelain);
  // Chrome Faucet Tap
  cylinder(staticGroup, 0.018, 0.018, 0.14, [9.80, fy + 0.94, basinZ], m.chrome, 8);
  rodBetween(staticGroup, [9.80, fy + 1.0, basinZ], [9.92, fy + 0.98, basinZ], 0.014, m.chrome, 8);
  // Framed Wall Mirror above Wash Basin (fallback + live real-time Reflector slot)
  box(staticGroup, [0.03, 0.78, 0.58], [9.71, fy + 1.48, basinZ], m.chrome);
  box(staticGroup, [0.032, 0.72, 0.52], [9.72, fy + 1.48, basinZ], m.mirrorMat);
  mirrorSlots.push({
    kind: 'bath',
    level: lvl,
    x: 9.752,
    y: fy + 1.48,
    z: basinZ,
    rotY: Math.PI / 2,
    fy,
  });

  // 3. Overhead Chrome Shower (শাওয়ার) + Mixer Tap + Blue Bucket & Mug at x = 11.15
  const showerZ = side === -1 ? -4.65 : 4.65;
  rodBetween(staticGroup, [11.34, fy + 0.95, showerZ], [11.34, fy + 2.18, showerZ], 0.015, m.chrome, 8);
  rodBetween(staticGroup, [11.34, fy + 2.18, showerZ], [11.05, fy + 2.12, showerZ], 0.015, m.chrome, 8);
  cylinder(staticGroup, 0.11, 0.09, 0.03, [11.05, fy + 2.09, showerZ], m.chrome, 12);
  box(staticGroup, [0.08, 0.06, 0.18], [11.32, fy + 1.02, showerZ], m.chrome);
  // Chrome Towel Rail
  rodBetween(staticGroup, [11.34, fy + 1.35, zCenter - 0.35], [11.34, fy + 1.35, zCenter + 0.35], 0.014, m.chrome, 8);
  // Blue Plastic Bathroom Bucket & Mug (বালতি ও মগ)
  cylinder(staticGroup, 0.18, 0.14, 0.36, [11.05, fy + 0.27, showerZ - side * 0.52], m.bucketMat, 12);
  cylinder(staticGroup, 0.06, 0.05, 0.12, [10.82, fy + 0.15, showerZ - side * 0.42], m.bucketMat, 10);

  // Glowing Ceiling Dome Light inside Bathroom
  box(staticGroup, [0.32, 0.04, 0.32], [10.55, fy + 2.89, zCenter], m.lamp);
}

/**
 * Builds the complete interior architecture, stairs, rooms, bathrooms, and furniture
 * for ALL 5 FLOORS (levels 0..4: y = 0, 3.05, 6.10, 9.15, 12.20) + Rooftop access (y = 15.25).
 */
function buildAllFloorsAndInteriors(staticGroup, dynamicParent, m, animatedFans, flatDoors, floorInteriors, tvSystem, interactiveTVs, mirrorSlots) {
  const levelBaseYs = [0, 3.05, 6.10, 9.15, 12.20];
  const wallH = 3.06;

  for (let lvl = 0; lvl < levelBaseYs.length; lvl++) {
    const fy = levelBaseYs[lvl];
    const midY = fy + wallH / 2;

    // ==========================================================================
    // 1. FLOOR SLAB & CEILING SLAB (with Stairwell Cutout x = 7.65..12.10, z = 0.16..1.16)
    // ==========================================================================
    if (lvl === 0) {
      // Ground floor continuous polished tile slab (inset inside exterior wall faces)
      box(staticGroup, [8.14, 0.10, 10.58], [10.18, fy + 0.03, 0], m.pillarTile, { uvScale: 1.5 });
    } else {
      // Upper floor slab with stairwell opening at x ∈ [7.65, 12.10], z ∈ [0.16, 1.16]
      // Left half + corridor walkway (z = -5.28 .. +0.16, width 5.44, center -2.56)
      box(staticGroup, [8.14, 0.12, 5.44], [10.18, fy + 0.03, -2.56], m.pillarTile, { uvScale: 1.5 });
      // Right apartment wing (z = +1.16 .. +5.28, width 4.12, center +3.22)
      box(staticGroup, [8.14, 0.12, 4.12], [10.18, fy + 0.03, 3.22], m.pillarTile, { uvScale: 1.5 });
      // Front stair landing strip (x = 6.11 .. 7.65, z = 0.16 .. 1.16)
      box(staticGroup, [1.54, 0.12, 1.00], [6.88, fy + 0.03, 0.66], m.pillarTile);
      // Rear stair landing strip (x = 12.10 .. 14.25, z = 0.16 .. 1.16)
      box(staticGroup, [2.15, 0.12, 1.00], [13.175, fy + 0.03, 0.66], m.pillarTile);
    }

    // Bright Self-Lit White Ceiling Slab (with matching stairwell cutout, strictly inside exterior walls)
    box(staticGroup, [8.14, 0.08, 5.44], [10.18, fy + 2.94, -2.56], m.ceilingMat);
    box(staticGroup, [8.14, 0.08, 4.12], [10.18, fy + 2.94, 3.22], m.ceilingMat);
    box(staticGroup, [1.54, 0.08, 1.00], [6.88, fy + 2.94, 0.66], m.ceilingMat);
    box(staticGroup, [2.15, 0.08, 1.00], [13.175, fy + 2.94, 0.66], m.ceilingMat);

    // ==========================================================================
    // 2. EXTERIOR PERIMETER WALLS (with Real Window Openings on Every Floor!)
    // ==========================================================================
    // Front Exterior Wall (x = 6.08)
    // Windows at z = -3.28 (w=2.85, h=2.0) and z = +3.35 (w=2.85, h=2.0)
    if (lvl === 0) {
      // Ground floor has Central Entrance Doorway (z = -0.64..+0.64)
      box(staticGroup, [0.22, wallH, 0.66], [6.08, midY, -5.03], m.warmPlaster);
      box(staticGroup, [0.22, wallH, 1.22], [6.08, midY, -1.25], m.warmPlaster);
      box(staticGroup, [0.22, 0.52, 2.85], [6.08, fy + 0.26, -3.28], m.warmPlaster);
      box(staticGroup, [0.22, 0.60, 2.85], [6.08, fy + 2.76, -3.28], m.warmPlaster);

      box(staticGroup, [0.22, wallH, 0.66], [6.08, midY, 5.03], m.warmPlaster);
      box(staticGroup, [0.22, wallH, 1.22], [6.08, midY, 1.25], m.warmPlaster);
      box(staticGroup, [0.22, 0.52, 2.85], [6.08, fy + 0.26, 3.28], m.warmPlaster);
      box(staticGroup, [0.22, 0.60, 2.85], [6.08, fy + 2.76, 3.28], m.warmPlaster);
      box(staticGroup, [0.22, 0.72, 1.32], [6.08, fy + 2.70, 0], m.warmPlaster);
    } else {
      // Upper floors have walkable balcony doorway at inner half (z = ±2.55) & window at outer half (z = ±4.02)
      box(staticGroup, [0.22, wallH, 0.66], [6.08, midY, -5.03], m.plaster);
      box(staticGroup, [0.22, wallH, 3.78], [6.08, midY, 0.03], m.plaster);
      box(staticGroup, [0.22, wallH, 0.64], [6.08, midY, 5.08], m.plaster);
      for (const side of [-1, 1]) {
        const wz = side === -1 ? -3.28 : 3.35;
        // Sill only under the outer window half so the inner half (z = side * 2.55) is a walk-through balcony doorway!
        box(staticGroup, [0.22, 0.45, 1.44], [6.08, fy + 0.225, side * 4.02], m.plaster);
        box(staticGroup, [0.22, 0.58, 2.88], [6.08, fy + 2.77, wz], m.plaster);
      }
    }

    // Back Exterior Wall (x = 14.28) — Open Stainless Lift Entrance Doorway (z = -0.64..+0.64) on ALL 5 FLOORS!
    const backWallMat = lvl === 0 ? m.warmPlaster : m.plaster;
    box(staticGroup, [0.22, wallH, 0.72], [14.28, midY, -5.02], backWallMat);
    box(staticGroup, [0.22, wallH, 1.26], [14.28, midY, -1.27], backWallMat);
    box(staticGroup, [0.22, 0.52, 2.76], [14.28, fy + 0.26, -3.28], backWallMat);
    box(staticGroup, [0.22, 0.60, 2.76], [14.28, fy + 2.76, -3.28], backWallMat);

    box(staticGroup, [0.22, wallH, 0.72], [14.28, midY, 5.02], backWallMat);
    box(staticGroup, [0.22, wallH, 1.26], [14.28, midY, 1.27], backWallMat);
    box(staticGroup, [0.22, 0.52, 2.76], [14.28, fy + 0.26, 3.28], backWallMat);
    box(staticGroup, [0.22, 0.60, 2.76], [14.28, fy + 2.76, 3.28], backWallMat);
    box(staticGroup, [0.22, 0.72, 1.32], [14.28, fy + 2.70, 0], backWallMat);
    // Brushed Steel Lift Door Frame & Floor Call Button Panel beside doorway
    box(staticGroup, [0.26, 2.34, 0.08], [14.26, fy + 1.17, -0.64], m.chrome);
    box(staticGroup, [0.26, 2.34, 0.08], [14.26, fy + 1.17, 0.64], m.chrome);
    box(staticGroup, [0.26, 0.10, 1.36], [14.26, fy + 2.36, 0], m.chrome);
    box(staticGroup, [0.06, 0.16, 0.42], [14.14, fy + 2.48, 0], m.darkMetal);
    box(staticGroup, [0.07, 0.06, 0.26], [14.13, fy + 2.48, 0], m.ledGreen);
    box(staticGroup, [0.05, 0.24, 0.11], [14.15, fy + 1.22, -0.82], m.chrome);
    box(staticGroup, [0.06, 0.04, 0.04], [14.14, fy + 1.26, -0.82], m.ledGreen);

    // Left & Right Exterior Side Walls (z = -5.36 and z = +5.36) with Window Openings
    for (const side of [-1, 1]) {
      const wz = side * 5.36;
      const extMat = lvl === 0 ? m.warmPlaster : m.plaster;
      // Solid piers between side windows (windows at x = 8.0 [w=1.85], x = 10.55 [w=0.72], x = 12.65 [w=1.85])
      box(staticGroup, [1.02, wallH, 0.20], [6.56, midY, wz], extMat);
      box(staticGroup, [1.26, wallH, 0.20], [9.55, midY, wz], extMat);
      box(staticGroup, [0.82, wallH, 0.20], [11.32, midY, wz], extMat);
      box(staticGroup, [0.75, wallH, 0.20], [13.95, midY, wz], extMat);
      // Window sills & headers at x = 8.0 and x = 12.65
      for (const wx of [8.0, 12.65]) {
        box(staticGroup, [1.86, 0.72, 0.20], [wx, fy + 0.36, wz], extMat);
        box(staticGroup, [1.86, 0.78, 0.20], [wx, fy + 2.67, wz], extMat);
      }
      // Bathroom ventilator window sill & header at x = 10.55
      box(staticGroup, [0.74, 1.26, 0.20], [10.55, fy + 0.63, wz], extMat);
      box(staticGroup, [0.74, 0.88, 0.20], [10.55, fy + 2.62, wz], extMat);
    }

    // ==========================================================================
    // 3. CENTRAL CORRIDOR WALLS (z = -1.18 and z = +1.18) & OPENABLE FLAT DOORS
    // ==========================================================================
    // Left Corridor Wall (z = -1.18):
    // - Main Flat A Doorway at x = 7.18..8.30 (center 7.74) with interactive wooden door!
    // - Rear Bedroom Doorway at x = 12.10..13.20 (center 12.65)
    box(staticGroup, [1.10, wallH, 0.15], [6.63, midY, -1.18], m.hallWall);
    box(staticGroup, [1.12, 0.80, 0.15], [7.74, fy + 2.66, -1.18], m.hallWall);
    box(staticGroup, [0.08, 2.28, 0.19], [7.18, fy + 1.14, -1.18], m.wood);
    box(staticGroup, [0.08, 2.28, 0.19], [8.30, fy + 1.14, -1.18], m.wood);
    box(staticGroup, [1.20, 0.08, 0.19], [7.74, fy + 2.28, -1.18], m.wood);
    box(staticGroup, [3.80, wallH, 0.15], [10.20, midY, -1.18], m.hallWall);
    box(staticGroup, [1.10, 0.80, 0.15], [12.65, fy + 2.66, -1.18], m.hallWall);
    box(staticGroup, [0.08, 2.28, 0.19], [12.10, fy + 1.14, -1.18], m.wood);
    box(staticGroup, [0.08, 2.28, 0.19], [13.20, fy + 1.14, -1.18], m.wood);
    box(staticGroup, [1.18, 0.08, 0.19], [12.65, fy + 2.28, -1.18], m.wood);
    box(staticGroup, [1.08, wallH, 0.15], [13.74, midY, -1.18], m.hallWall);

    // Right Corridor Wall (z = +1.18):
    // - Main Flat B Doorway at x = 6.38..7.50 (center 6.94) on the front landing (clear of stairs!)
    // - Rear Kitchen Doorway at x = 12.20..13.30 (center 12.75) on the rear landing
    box(staticGroup, [0.30, wallH, 0.15], [6.23, midY, 1.18], m.hallWall);
    box(staticGroup, [1.12, 0.80, 0.15], [6.94, fy + 2.66, 1.18], m.hallWall);
    box(staticGroup, [0.08, 2.28, 0.19], [6.38, fy + 1.14, 1.18], m.wood);
    box(staticGroup, [0.08, 2.28, 0.19], [7.50, fy + 1.14, 1.18], m.wood);
    box(staticGroup, [1.20, 0.08, 0.19], [6.94, fy + 2.28, 1.18], m.wood);
    box(staticGroup, [4.70, wallH, 0.15], [9.85, midY, 1.18], m.hallWall);
    box(staticGroup, [1.10, 0.80, 0.15], [12.75, fy + 2.66, 1.18], m.hallWall);
    box(staticGroup, [0.08, 2.28, 0.19], [12.20, fy + 1.14, 1.18], m.wood);
    box(staticGroup, [0.08, 2.28, 0.19], [13.30, fy + 1.14, 1.18], m.wood);
    box(staticGroup, [1.18, 0.08, 0.19], [12.75, fy + 2.28, 1.18], m.wood);
    box(staticGroup, [0.98, wallH, 0.15], [13.79, midY, 1.18], m.hallWall);

    // Interactive Hinged Apartment Doors for Unit A & Unit B on this floor!
    const doorA = buildApartmentDoor(m, [7.18, fy + 0.04, -1.18]);
    const doorB = buildApartmentDoor(m, [6.38, fy + 0.04, 1.18]);
    dynamicParent.add(doorA, doorB);
    flatDoors.push(
      {
        level: lvl,
        unit: `${lvl + 1}A`,
        pivot: doorA,
        x: 7.74,
        y: fy,
        z: -1.18,
        open: false,
        angle: 0,
        openDir: 1, // swings into Unit A (-Z)
      },
      {
        level: lvl,
        unit: `${lvl + 1}B`,
        pivot: doorB,
        x: 6.94,
        y: fy,
        z: 1.18,
        open: false,
        angle: 0,
        openDir: -1, // swings into Unit B (+Z)
      }
    );

    // Glowing Corridor Ceiling Lights
    box(staticGroup, [0.65, 0.04, 0.28], [6.95, fy + 2.89, -0.45], m.lamp);
    box(staticGroup, [0.65, 0.04, 0.28], [13.05, fy + 2.89, -0.45], m.lamp);

    // ==========================================================================
    // 4. CONTINUOUS WALKABLE STAIRCASE (সিঁড়ি: x = 7.75..12.05, z = 0.18..1.12)
    // Rises +3.05m per floor from x = 7.75 (bottom) to x = 12.05 (top landing)
    // ==========================================================================
    const numSteps = 15;
    const stepRun = (12.05 - 7.75) / numSteps; // 0.2867m
    const stepRise = 3.05 / numSteps;          // 0.2033m
    for (let s = 0; s < numSteps; s++) {
      const sx = 7.75 + (s + 0.5) * stepRun;
      const sy = fy + (s + 1) * stepRise;
      // Step tread & riser
      box(staticGroup, [stepRun + 0.03, 0.16, 0.92], [sx, sy - 0.08, 0.65], m.pillarTile);
      box(staticGroup, [0.04, stepRise, 0.92], [sx - stepRun * 0.45, sy - stepRise * 0.5, 0.65], m.concrete);
    }
    // Sloped concrete stringer beam tucked cleanly underneath the stair treads (never poking through steps)
    rodBetween(staticGroup, [7.75, fy - 0.16, 0.35], [12.05, fy + 2.81, 0.35], 0.075, m.concrete, 6);
    rodBetween(staticGroup, [7.75, fy - 0.16, 0.95], [12.05, fy + 2.81, 0.95], 0.075, m.concrete, 6);
    // Staircase Handrail & Balusters along z = 0.18
    rodBetween(staticGroup, [7.75, fy + 0.92, 0.18], [12.05, fy + 3.92, 0.18], 0.024, m.rail, 8);
    for (let b = 0; b <= 5; b++) {
      const bx = 7.75 + (b / 5) * 4.30;
      const by = fy + (b / 5) * 3.05;
      rodBetween(staticGroup, [bx, by + 0.05, 0.18], [bx, by + 0.92, 0.18], 0.018, m.rail, 6);
    }

    // ==========================================================================
    // 5. INTERIOR ROOM & BATHROOM PARTITIONS (for both Unit A & Unit B)
    // Put each floor's interior rooms & furniture into its own culled group!
    // ==========================================================================
    const floorInterior = new THREE.Group();
    floorInterior.name = `FloorInterior_${lvl}`;

    for (const side of [-1, 1]) {
      // Partition 1 at x = 9.65 (separates Front Living/Dining from Bathroom + Inner Passage)
      // Doorway at z ∈ [side*1.22, side*2.40] with flush ceiling header & framed trim
      box(floorInterior, [0.15, wallH, 2.86], [9.65, midY, side * 3.83], m.roomWall);
      box(floorInterior, [0.15, 0.78, 1.24], [9.65, fy + 2.67, side * 1.80], m.roomWall);
      box(floorInterior, [0.18, 2.26, 0.06], [9.65, fy + 1.13, side * 2.38], m.wood);
      box(floorInterior, [0.18, 2.26, 0.06], [9.65, fy + 1.13, side * 1.26], m.wood);
      box(floorInterior, [0.18, 0.06, 1.18], [9.65, fy + 2.26, side * 1.82], m.wood);

      // Partition 2 at x = 11.45 (separates Bathroom from Rear Bedroom/Kitchen)
      // Doorway at z ∈ [side*1.22, side*2.40] with flush ceiling header & framed trim
      box(floorInterior, [0.15, wallH, 2.86], [11.45, midY, side * 3.83], m.roomWall);
      box(floorInterior, [0.15, 0.78, 1.24], [11.45, fy + 2.67, side * 1.80], m.roomWall);
      box(floorInterior, [0.18, 2.26, 0.06], [11.45, fy + 1.13, side * 2.38], m.wood);
      box(floorInterior, [0.18, 2.26, 0.06], [11.45, fy + 1.13, side * 1.26], m.wood);
      box(floorInterior, [0.18, 0.06, 1.18], [11.45, fy + 2.26, side * 1.82], m.wood);

      // Bathroom Front Wall at z = side * 2.55 (between x = 9.65 and x = 11.45)
      // Bathroom Doorway at x = 10.10 .. 11.00 (center 10.55, width 0.90m)
      box(floorInterior, [0.46, wallH, 0.14], [9.88, midY, side * 2.55], m.roomWall);
      box(floorInterior, [0.46, wallH, 0.14], [11.22, midY, side * 2.55], m.roomWall);
      box(floorInterior, [0.90, 0.82, 0.14], [10.55, fy + 2.65, side * 2.55], m.roomWall);
      box(floorInterior, [0.06, 2.24, 0.17], [10.10, fy + 1.12, side * 2.55], m.wood);
      box(floorInterior, [0.06, 2.24, 0.17], [11.00, fy + 1.12, side * 2.55], m.wood);
      box(floorInterior, [0.96, 0.06, 0.17], [10.55, fy + 2.24, side * 2.55], m.wood);

      // Build the complete Attached Bathroom (বাথরুম)
      buildAttachedBathroom(floorInterior, m, fy, side, lvl, mirrorSlots);
    }

    // ==========================================================================
    // 6. FURNISH UNIT A: DRAWING / LIVING ROOM (x = 6.20..9.55, z = -5.25..-1.25)
    // ==========================================================================
    // Woven Carpet Rug
    box(floorInterior, [2.15, 0.02, 1.85], [7.85, fy + 0.09, -3.55], m.rugMat);
    // 3-Seater Plush Teal Sofa along left wall (z = -4.82)
    box(floorInterior, [2.05, 0.40, 0.76], [7.85, fy + 0.28, -4.78], m.sofaFabric);
    box(floorInterior, [2.05, 0.52, 0.18], [7.85, fy + 0.66, -5.08], m.sofaFabric);
    box(floorInterior, [0.18, 0.36, 0.76], [6.88, fy + 0.50, -4.78], m.sofaFabric);
    box(floorInterior, [0.18, 0.36, 0.76], [8.82, fy + 0.50, -4.78], m.sofaFabric);
    for (const cx of [7.28, 7.85, 8.42]) {
      box(floorInterior, [0.40, 0.28, 0.14], [cx, fy + 0.60, -4.88], m.cushionMat);
    }
    // Center Wooden Coffee Table with Porcelain Teacups
    box(floorInterior, [1.12, 0.05, 0.60], [7.85, fy + 0.45, -3.55], m.wood);
    for (const [lx, lz] of [[7.36, -3.80], [8.34, -3.80], [7.36, -3.30], [8.34, -3.30]]) {
      box(floorInterior, [0.05, 0.38, 0.05], [lx, fy + 0.24, lz], m.wood);
    }
    cylinder(floorInterior, 0.045, 0.035, 0.07, [7.72, fy + 0.51, -3.52], m.porcelain, 10);
    cylinder(floorInterior, 0.045, 0.035, 0.07, [7.98, fy + 0.51, -3.58], m.porcelain, 10);

    // 55" 4K Smart TV & Media Unit on partition wall x = 9.56 (half ON, half OFF by default + Remote Control!)
    const tvDynamicGroupA = new THREE.Group();
    buildSmartTVUnit(floorInterior, tvDynamicGroupA, m, tvSystem, interactiveTVs, {
      x: 9.56,
      fy,
      z: -3.65,
      faceDir: -1,
      lvl,
      unitLabel: `${lvl + 1}A`,
      defaultOn: lvl % 2 === 0,
      defaultChannel: lvl % TV_CHANNELS.length,
    });

    // Framed Landscape Painting on Front Wall & Window Curtains
    box(floorInterior, [0.04, 0.68, 0.96], [6.22, fy + 1.62, -3.28], m.wood);
    box(floorInterior, [0.05, 0.60, 0.88], [6.23, fy + 1.62, -3.28], m.wallArt);
    box(floorInterior, [0.22, 1.85, 0.08], [6.95, fy + 1.52, -5.20], m.curtainMat);
    box(floorInterior, [0.22, 1.85, 0.08], [8.95, fy + 1.52, -5.20], m.curtainMat);
    // Glowing Ceiling LED Panel & Fan
    box(floorInterior, [0.55, 0.04, 0.55], [7.85, fy + 2.89, -3.45], m.lamp);
    createCeilingFan(lvl === 0 ? dynamicParent : floorInterior, [7.85, fy + 2.88, -3.45], m, lvl === 0 ? animatedFans : null);

    // ==========================================================================
    // 7. FURNISH UNIT A: MASTER BEDROOM (x = 11.55..14.18, z = -5.25..-1.25)
    // ==========================================================================
    // King-size Wooden Bed against left-back wall
    box(floorInterior, [1.95, 0.30, 1.80], [12.85, fy + 0.23, -4.18], m.wood);
    box(floorInterior, [1.85, 0.18, 1.70], [12.85, fy + 0.45, -4.15], m.mattressMat);
    box(floorInterior, [1.87, 0.19, 1.02], [12.85, fy + 0.46, -3.78], m.blanketMat);
    box(floorInterior, [1.98, 1.02, 0.10], [12.85, fy + 0.60, -5.04], m.wood);
    for (const px of [12.42, 13.28]) {
      box(floorInterior, [0.62, 0.13, 0.36], [px, fy + 0.58, -4.68], m.porcelain);
    }
    // Bedside Nightstand with Glowing Lamp
    box(floorInterior, [0.42, 0.48, 0.42], [11.72, fy + 0.32, -4.85], m.wood);
    cylinder(floorInterior, 0.10, 0.14, 0.22, [11.72, fy + 0.68, -4.85], m.lamp, 10);
    // Wooden Wardrobe / Almirah with Full-Length Real-Time Dressing Mirror
    box(floorInterior, [0.54, 2.02, 1.18], [11.82, fy + 1.08, -3.15], m.wood);
    box(floorInterior, [0.56, 1.54, 0.52], [11.82, fy + 1.15, -3.15], m.chrome);
    box(floorInterior, [0.57, 1.48, 0.46], [11.82, fy + 1.15, -3.15], m.mirrorMat);
    mirrorSlots.push({
      kind: 'wardrobe',
      level: lvl,
      x: 12.116,
      y: fy + 1.15,
      z: -3.15,
      rotY: Math.PI / 2,
      fy,
    });
    // Bedroom Curtains, Ceiling LED Panel & Fan
    box(floorInterior, [0.22, 1.85, 0.08], [11.80, fy + 1.52, -5.20], m.curtainMat);
    box(floorInterior, [0.22, 1.85, 0.08], [13.55, fy + 1.52, -5.20], m.curtainMat);
    box(floorInterior, [0.55, 0.04, 0.55], [12.85, fy + 2.89, -3.35], m.lamp);
    createCeilingFan(lvl === 0 ? dynamicParent : floorInterior, [12.85, fy + 2.88, -3.35], m, lvl === 0 ? animatedFans : null);

    // ==========================================================================
    // 8. FURNISH UNIT B: DINING & FAMILY LOUNGE (x = 6.20..9.55, z = +1.25..+5.25)
    // ==========================================================================
    // 6-Seater Wooden Dining Table with Porcelain Plates & Water Jug
    box(floorInterior, [1.50, 0.06, 1.02], [7.85, fy + 0.76, 3.55], m.wood);
    for (const [lx, lz] of [[7.20, 3.12], [8.50, 3.12], [7.20, 3.98], [8.50, 3.98]]) {
      box(floorInterior, [0.06, 0.70, 0.06], [lx, fy + 0.40, lz], m.wood);
    }
    for (const [px, pz] of [[7.50, 3.30], [8.20, 3.30], [7.50, 3.80], [8.20, 3.80]]) {
      cylinder(floorInterior, 0.13, 0.10, 0.02, [px, fy + 0.80, pz], m.porcelain, 12);
    }
    cylinder(floorInterior, 0.07, 0.08, 0.22, [7.85, fy + 0.90, 3.55], m.porcelain, 10);
    // 4 Dining Chairs
    for (const [cx, cz, backOff] of [[7.50, 2.78, -0.18], [8.20, 2.78, -0.18], [7.50, 4.32, 0.18], [8.20, 4.32, 0.18]]) {
      box(floorInterior, [0.42, 0.05, 0.42], [cx, fy + 0.45, cz], m.wood);
      box(floorInterior, [0.42, 0.46, 0.05], [cx, fy + 0.70, cz + backOff], m.wood);
      box(floorInterior, [0.05, 0.40, 0.05], [cx - 0.16, fy + 0.24, cz - 0.16], m.wood);
      box(floorInterior, [0.05, 0.40, 0.05], [cx + 0.16, fy + 0.24, cz + 0.16], m.wood);
    }
    // Smart TV mounted on partition wall x = 9.56 in Unit B Family/Dining Room (alternating ON/OFF + Remote Control!)
    const tvDynamicGroupB = new THREE.Group();
    buildSmartTVUnit(floorInterior, tvDynamicGroupB, m, tvSystem, interactiveTVs, {
      x: 9.56,
      fy,
      z: 3.75,
      faceDir: -1,
      lvl,
      unitLabel: `${lvl + 1}B`,
      defaultOn: lvl % 2 === 1,
      defaultChannel: (lvl + 1) % TV_CHANNELS.length,
    });
    // Glowing Ceiling LED Panel & Fan
    box(floorInterior, [0.55, 0.04, 0.55], [7.85, fy + 2.89, 3.45], m.lamp);
    createCeilingFan(lvl === 0 ? dynamicParent : floorInterior, [7.85, fy + 2.88, 3.45], m, lvl === 0 ? animatedFans : null);

    // ==========================================================================
    // 9. FURNISH UNIT B: MODERN KITCHEN (x = 11.55..14.18, z = +1.25..+5.25)
    // ==========================================================================
    // Kitchen Counter with Black Granite Top
    box(floorInterior, [2.45, 0.84, 0.62], [12.85, fy + 0.48, 4.92], m.pillarTile);
    box(floorInterior, [2.50, 0.05, 0.66], [12.85, fy + 0.92, 4.92], m.blackTile);
    // Double-Burner Gas Stove with Glowing Blue Flames & Cooking Pot
    box(floorInterior, [0.68, 0.05, 0.42], [12.30, fy + 0.97, 4.90], m.chrome);
    cylinder(floorInterior, 0.09, 0.09, 0.02, [12.14, fy + 1.00, 4.90], m.stoveFlame, 12);
    cylinder(floorInterior, 0.09, 0.09, 0.02, [12.46, fy + 1.00, 4.90], m.stoveFlame, 12);
    cylinder(floorInterior, 0.12, 0.10, 0.14, [12.14, fy + 1.08, 4.90], m.aluminum, 12);
    // Stainless Sink & Chrome Faucet
    box(floorInterior, [0.58, 0.04, 0.42], [13.35, fy + 0.95, 4.90], m.darkMetal);
    rodBetween(floorInterior, [13.35, fy + 0.96, 5.12], [13.35, fy + 1.22, 5.00], 0.016, m.chrome, 8);
    // Overhead Wooden Kitchen Cabinets
    box(floorInterior, [2.35, 0.58, 0.36], [12.85, fy + 2.12, 5.04], m.wood);
    // Double-Door Silver Refrigerator (ফ্রিজ)
    box(floorInterior, [0.66, 1.76, 0.66], [11.88, fy + 0.95, 3.05], m.aluminum);
    box(floorInterior, [0.68, 0.02, 0.68], [11.88, fy + 1.24, 3.05], m.darkMetal);
    // Kitchen Ceiling LED Light
    box(floorInterior, [0.52, 0.04, 0.52], [12.85, fy + 2.89, 3.35], m.lamp);

    floorInterior.traverse((obj) => {
      if (obj.isMesh) obj.castShadow = false;
    });
    mergeStaticMeshes(floorInterior);
    floorInterior.add(tvDynamicGroupA, tvDynamicGroupB);
    floorInterior.visible = false;
    dynamicParent.add(floorInterior);
    floorInteriors.push(floorInterior);
  }

  // ============================================================================
  // GROUND FLOOR PORCHES & ROOFTOP SLAB (ছাদ y = 15.25)
  // ============================================================================
  // Grand Front Entrance Porch Frame, Step, Pillars & Glowing Lamp (Ground Floor)
  box(staticGroup, [0.85, 0.14, 2.15], [5.72, 0.05, 0], m.pillarTile);
  box(staticGroup, [0.92, 0.18, 2.75], [5.74, 2.52, 0.22], m.whiteBand);
  // Structural tie-beam & corbel pedestal bridging porch slab (y=2.60) seamlessly up to upper brick column (y=3.06) without any floating air gap
  box(staticGroup, [0.64, 0.48, 2.15], [5.78, 2.83, 0.45], m.trim);
  for (const side of [-1, 1]) {
    box(staticGroup, [0.22, 2.48, 0.18], [5.95, 1.24, side * 0.68], m.wood);
    box(staticGroup, [0.26, 2.52, 0.22], [5.68, 1.26, side * 0.96], m.pillarTile);
  }
  box(staticGroup, [0.24, 0.12, 1.52], [5.95, 2.42, 0], m.wood);
  const porchGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), m.lamp);
  porchGlobe.position.set(5.62, 2.68, 0);
  staticGroup.add(porchGlobe);

  // Rear Veranda Porch & Steps outside the back door (Ground Floor)
  for (const side of [-1, 1]) {
    box(staticGroup, [0.22, 2.48, 0.18], [14.34, 1.24, side * 0.68], m.wood);
  }
  box(staticGroup, [0.24, 0.12, 1.52], [14.34, 2.42, 0], m.wood);
  box(staticGroup, [1.15, 0.16, 2.7], [14.85, 0.06, 0], m.pillarTile);
  box(staticGroup, [0.42, 0.09, 2.2], [15.55, 0.03, 0], m.concrete);
  box(staticGroup, [1.25, 0.18, 2.85], [14.9, 2.86, 0], m.trim);
  for (const side of [-1, 1]) {
    box(staticGroup, [0.24, 2.76, 0.24], [15.32, 1.38, side * 1.18], m.trim);
  }

  // Ground-floor Front & Back Windows
  frontWindow(staticGroup, m, { y: 1.48, z: -3.28, width: 2.85, height: 1.95, grill: true, openable: true });
  frontWindow(staticGroup, m, { y: 1.48, z: 3.28, width: 2.85, height: 1.95, grill: true, openable: true });
  backWindow(staticGroup, m, { y: 1.48, z: -3.28, width: 2.75, height: 1.9, grill: true, canopy: true, openable: true });
  backWindow(staticGroup, m, { y: 1.48, z: 3.28, width: 2.75, height: 1.9, grill: true, canopy: true, openable: true });

  // Rooftop Walkable Slab at y = 15.25 (with stairwell cutout x = 7.65..12.10, z = 0.16..1.16)
  const rfY = 15.25;
  box(staticGroup, [8.42, 0.16, 5.58], [10.175, rfY, -2.63], m.concrete, { uvScale: 2.0 });
  box(staticGroup, [8.42, 0.16, 4.26], [10.175, rfY, 3.29], m.concrete, { uvScale: 2.0 });
  box(staticGroup, [1.68, 0.16, 1.00], [6.82, rfY, 0.66], m.concrete);
  box(staticGroup, [2.28, 0.16, 1.00], [13.22, rfY, 0.66], m.concrete);
}

function buildBoundaryAndBackyard(staticGroup, m) {
  box(staticGroup, [3.65, 0.08, 14.4], [4.42, 0.015, 0], m.courtyard, { uvScale: 2.1 });
  for (const side of [-1, 1]) {
    box(staticGroup, [16.5, 0.08, 1.95], [12.2, 0.015, side * 6.32], m.concrete, { uvScale: 2.5 });
  }
  box(staticGroup, [4.4, 0.08, 11.2], [16.4, 0.015, 0], m.courtyard, { uvScale: 2.1 });
  box(staticGroup, [3.1, 0.07, 14.4], [19.95, 0.01, 0], m.grass, { uvScale: 2.2 });
  for (let x = 18.8; x <= 20.6; x += 0.6) {
    box(staticGroup, [0.42, 0.09, 0.95], [x, 0.02, 0], m.trim);
  }

  box(staticGroup, [0.54, 0.42, 14.85], [2.63, 2.48, 0], m.trim, { uvScale: 2.4 });
  for (let z = -7.25; z <= 7.25; z += 0.14) {
    box(staticGroup, [0.03, 0.38, 0.05], [2.35, 2.48, z], m.wall, { castShadow: false });
  }

  for (const side of [-1, 1]) {
    const centerZ = side * 4.88;
    box(staticGroup, [0.28, 2.18, 4.35], [2.68, 1.09, centerZ], m.wall);
    for (let z = 2.82; z <= 6.94; z += 0.22) {
      box(staticGroup, [0.11, 1.96, 0.085], [2.49, 1.02, side * z], m.trim, { castShadow: false });
    }
    box(staticGroup, [0.38, 0.1, 4.4], [2.64, 2.16, centerZ], m.trim);

    const gatePillarZ = side * 2.43;
    box(staticGroup, [0.62, 2.32, 0.62], [2.63, 1.16, gatePillarZ], m.pillarTile);
    for (const y of [0.42, 1.98]) {
      box(staticGroup, [0.64, 0.095, 0.64], [2.63, y, gatePillarZ], m.blackTile, { castShadow: false });
    }
    box(staticGroup, [0.58, 2.75, 0.58], [2.65, 1.375, side * 7.28], m.trim);

    cylinder(staticGroup, 0.15, 0.18, 0.11, [2.63, 2.74, gatePillarZ], m.darkMetal, 16);
    cylinder(staticGroup, 0.05, 0.065, 0.18, [2.63, 2.86, gatePillarZ], m.darkMetal, 12);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.21, 24, 16), m.lamp);
    globe.position.set(2.63, 3.06, gatePillarZ);
    globe.castShadow = false;
    staticGroup.add(globe);

    rodBetween(staticGroup, [2.44, 2.34, side * 2.76], [2.44, 2.34, side * 7.05], 0.022, m.rail);
    rodBetween(staticGroup, [2.44, 2.52, side * 2.76], [2.44, 2.52, side * 7.05], 0.02, m.rail);
    rodBetween(staticGroup, [2.44, 2.7, side * 2.76], [2.44, 2.7, side * 7.05], 0.024, m.rail);
    for (let z = 2.85; z < 7.0; z += 0.55) {
      rodBetween(staticGroup, [2.44, 2.22, side * z], [2.44, 2.72, side * z], 0.02, m.rail);
    }

    box(staticGroup, [18.9, 2.15, 0.26], [12.1, 1.075, side * 7.28], m.wall);
    box(staticGroup, [19.0, 0.1, 0.34], [12.1, 2.18, side * 7.28], m.trim);
    box(staticGroup, [18.8, 0.28, 0.06], [12.1, 0.14, side * 7.12], m.moss, { castShadow: false });
    for (let x = 6.5; x <= 21.5; x += 3.75) {
      box(staticGroup, [0.42, 2.35, 0.42], [x, 1.175, side * 7.28], m.trim);
    }
  }

  box(staticGroup, [0.28, 2.2, 14.6], [21.5, 1.1, 0], m.wall);
  box(staticGroup, [0.36, 0.1, 14.7], [21.5, 2.23, 0], m.trim);
  box(staticGroup, [0.06, 0.3, 14.4], [21.33, 0.15, 0], m.moss, { castShadow: false });
  for (let z = -7.28; z <= 7.29; z += 3.64) {
    box(staticGroup, [0.44, 2.42, 0.44], [21.5, 1.21, z], m.trim);
  }

  for (const z of [-4.8, -1.6]) {
    cylinder(staticGroup, 0.035, 0.04, 2.25, [17.6, 1.12, z], m.darkMetal, 8);
  }
  rodBetween(staticGroup, [17.6, 2.15, -4.8], [17.6, 2.15, -1.6], 0.012, m.rail, 6);
  const backyardClothes = [0xd94f43, 0x2d7a9c, 0xf2c94c, 0x4b9363];
  for (let i = 0; i < 4; i++) {
    const clothMat = new THREE.MeshLambertMaterial({ color: backyardClothes[i], side: THREE.DoubleSide });
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.88 + (i % 2) * 0.2, 4, 4), clothMat);
    cloth.geometry.rotateY(Math.PI / 2);
    cloth.position.set(17.6, 1.68, -4.2 + i * 0.78);
    cloth.castShadow = false;
    staticGroup.add(cloth);
  }

  box(staticGroup, [1.8, 0.16, 1.8], [16.6, 0.09, 3.3], m.concrete);
  box(staticGroup, [0.75, 0.05, 0.75], [16.6, 0.19, 3.3], m.darkMetal);
  box(staticGroup, [0.95, 0.18, 0.95], [15.2, 0.1, 4.4], m.concrete);
  box(staticGroup, [0.16, 0.85, 0.16], [14.7, 0.45, 4.4], m.pillarTile);
  rodBetween(staticGroup, [14.78, 0.75, 4.4], [14.98, 0.75, 4.4], 0.022, m.rail, 8);

  box(staticGroup, [1.1, 0.42, 8.6], [20.75, 0.21, 0], m.brick);
  box(staticGroup, [1.18, 0.07, 8.7], [20.75, 0.44, 0], m.trim);
  const potPositions = [
    [15.6, -2.1], [15.6, 2.1], [14.7, -4.8], [14.7, 4.8],
    [5.4, -1.45], [5.4, 1.45], [3.3, -3.5], [3.3, 3.5],
  ];
  for (const [px, pz] of potPositions) {
    cylinder(staticGroup, 0.22, 0.15, 0.36, [px, 0.2, pz], m.terracotta, 10);
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 1), m.moss);
    bush.position.set(px, 0.52, pz);
    bush.castShadow = false;
    staticGroup.add(bush);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#14445c';
  ctx.fillRect(0, 0, 512, 180);
  ctx.strokeStyle = '#d7e6ec';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 164);
  ctx.fillStyle = '#f4f8fa';
  ctx.font = 'bold 92px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TO-LET', 256, 94);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const signMaterial = new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.44), signMaterial);
  sign.geometry.rotateY(-Math.PI / 2);
  sign.position.set(2.37, 2.66, 6.12);
  staticGroup.add(sign);
  rodBetween(staticGroup, [2.4, 2.42, 5.78], [2.4, 2.9, 5.78], 0.018, m.darkMetal);
  rodBetween(staticGroup, [2.4, 2.42, 6.46], [2.4, 2.9, 6.46], 0.018, m.darkMetal);
}

function buildSideAndRearElevations(staticGroup, m, floors) {
  // Building corner pilasters pushed slightly outward so they never jut into interior rooms or z-fight walls
  for (const x of [6.00, 14.36]) {
    for (const z of [-5.40, 5.40]) {
      box(staticGroup, [0.26, 15.35, 0.26], [x, 7.675, z], m.trim);
    }
  }

  const levelBaseYs = [0, ...floors];
  for (const side of [-1, 1]) {
    const wallZ = side * 5.4;
    for (let lvl = 0; lvl < levelBaseYs.length; lvl++) {
      const fy = levelBaseYs[lvl];
      sideWindow(staticGroup, m, { x: 8.0, y: fy + 1.5, z: wallZ, side, width: 1.85, height: 1.55, grill: true, canopy: true, openable: true });
      sideWindow(staticGroup, m, { x: 12.65, y: fy + 1.5, z: wallZ, side, width: 1.85, height: 1.55, grill: true, canopy: true, openable: true });
      sideWindow(staticGroup, m, { x: 10.55, y: fy + 1.72, z: wallZ, side, width: 0.72, height: 0.92, grill: true, frosted: true, canopy: true, openable: true });
    }

    for (const px of [9.35, 11.15]) {
      cylinder(staticGroup, 0.048, 0.048, 15.2, [px, 7.6, side * 5.52], m.pvcPipe, 8);
      for (const y of [1.8, 4.5, 7.5, 10.5, 13.5]) {
        box(staticGroup, [0.14, 0.05, 0.16], [px, y, side * 5.47], m.darkMetal);
      }
    }

    for (const acY of [4.1, 7.15]) {
      const acX = side === -1 ? 6.95 : 13.4;
      box(staticGroup, [0.78, 0.54, 0.32], [acX, acY, side * 5.62], m.whiteBand);
      cylinder(staticGroup, 0.19, 0.19, 0.34, [acX - 0.12, acY, side * 5.62], m.darkMetal, 12).rotation.x = Math.PI / 2;
      for (const bx of [-0.3, 0.3]) {
        box(staticGroup, [0.05, 0.35, 0.36], [acX + bx, acY - 0.28, side * 5.58], m.darkMetal);
      }
    }
  }

  // REAR ELEVATION: Panoramic 5-Story + Rooftop 3D Elevator Shaft (x = 14.34..16.04, z = -0.92..+0.92) + Rear Balconies!
  for (let level = 0; level < floors.length; level++) {
    const floorY = floors[level];
    for (const side of [-1, 1]) {
      const zCenter = side * 3.32;
      const width = 3.55;
      box(staticGroup, [1.18, 0.22, width + 0.1], [14.88, floorY, zCenter], m.trim);
      box(staticGroup, [1.08, 2.85, 0.15], [14.85, floorY + 1.47, zCenter + side * (width / 2)], m.plaster);
      backWindow(staticGroup, m, { x: 14.24, y: floorY + 1.42, z: zCenter, width: 2.75, height: 2.02, grill: level === 0, openable: true });
      backBalconyRail(staticGroup, m, floorY, zCenter, width, level === 0);
    }
  }
  // Panoramic Brushed-Steel & Glass Elevator Shaft Frame rising from GF (y=0) to Rooftop (y=18.2)
  for (const [cx, cz] of [[14.38, -0.90], [14.38, 0.90], [16.02, -0.90], [16.02, 0.90]]) {
    box(staticGroup, [0.14, 18.20, 0.14], [cx, 9.10, cz], m.darkMetal);
  }
  for (const side of [-1, 1]) {
    box(staticGroup, [1.66, 18.10, 0.06], [15.20, 9.05, side * 0.90], m.glass);
  }
  box(staticGroup, [0.06, 18.10, 1.80], [16.02, 9.05, 0], m.glass);
  box(staticGroup, [1.80, 0.26, 2.00], [15.20, 18.18, 0], m.concrete);
  for (const ry of [3.05, 6.10, 9.15, 12.20, 15.25, 17.95]) {
    box(staticGroup, [1.72, 0.12, 0.10], [15.20, ry, -0.90], m.chrome);
    box(staticGroup, [1.72, 0.12, 0.10], [15.20, ry, 0.90], m.chrome);
    box(staticGroup, [0.10, 0.12, 1.88], [16.02, ry, 0], m.chrome);
  }

  const rearClothColors = [0x2b6cb0, 0xc53030, 0xd69e2e, 0x319795];
  for (let i = 0; i < 4; i++) {
    const mat = new THREE.MeshLambertMaterial({ color: rearClothColors[i], side: THREE.DoubleSide });
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.85, 3, 4), mat);
    cloth.geometry.rotateY(Math.PI / 2);
    cloth.position.set(15.22, 4.85 + (i % 2) * 3.05, -2.55 - i * 0.45);
    staticGroup.add(cloth);
  }

  // Hollow Walkable Rooftop Stairwell & Lift Mumty Room (চিলেকোঠা y = 15.25..17.95) & Overhead Water Tank
  // Front roof exit at x = 7.55, z = -0.95..+0.15; Rear Lift Entrance at x = 14.28, z = -0.64..+0.64!
  box(staticGroup, [6.78, 2.65, 0.18], [10.94, 16.60, -1.22], m.plaster);
  box(staticGroup, [6.78, 2.65, 0.18], [10.94, 16.60, 1.24], m.plaster);
  box(staticGroup, [0.22, 2.65, 0.62], [14.28, 16.60, -0.94], m.brick);
  box(staticGroup, [0.22, 2.65, 0.62], [14.28, 16.60, 0.94], m.brick);
  box(staticGroup, [0.22, 0.44, 1.32], [14.28, 17.70, 0], m.brick);
  box(staticGroup, [0.26, 2.34, 0.08], [14.26, 16.42, -0.64], m.chrome);
  box(staticGroup, [0.26, 2.34, 0.08], [14.26, 16.42, 0.64], m.chrome);
  box(staticGroup, [0.26, 0.10, 1.36], [14.26, 17.61, 0], m.chrome);
  box(staticGroup, [0.18, 2.65, 1.05], [7.55, 16.60, 0.72], m.plaster);
  box(staticGroup, [0.18, 0.45, 1.42], [7.55, 17.70, -0.50], m.plaster);
  box(staticGroup, [6.98, 0.18, 2.75], [10.94, 18.00, 0], m.trim);
  box(staticGroup, [0.65, 0.04, 0.35], [11.20, 17.88, 0], m.lamp);

  for (const sx of [11.1, 12.5]) {
    for (const sz of [-0.65, 0.65]) {
      box(staticGroup, [0.18, 0.55, 0.18], [sx, 18.35, sz], m.concrete);
    }
  }
  box(staticGroup, [1.75, 0.12, 1.65], [11.8, 18.65, 0], m.concrete);
  cylinder(staticGroup, 0.68, 0.68, 1.55, [11.8, 19.48, 0], m.waterTank, 18);
  cylinder(staticGroup, 0.28, 0.32, 0.18, [11.8, 20.32, 0], m.waterTank, 12);
}

export function buildHouse(scene, m) {
  const ox = TALTOLA_HOUSE_OFFSET.x;
  const oz = TALTOLA_HOUSE_OFFSET.z;
  const group = new THREE.Group();
  group.name = 'Reference house and property';
  group.position.set(ox, 0, oz);
  scene.add(group);
  const toLocal = (p) => (p ? { x: p.x - ox, y: p.y, z: p.z - oz } : null);

  const staticGroup = new THREE.Group();
  group.add(staticGroup);

  const animatedFans = [];
  const flatDoors = [];
  const floorInteriors = [];
  const tvSystem = createLiveTVBroadcastSystem();
  const interactiveTVs = [];
  const mirrorSlots = [];

  // Build ALL 5 floors hollow & furnished + continuous staircase + 10 openable flats + interactive TVs + real mirrors!
  buildAllFloorsAndInteriors(staticGroup, group, m, animatedFans, flatDoors, floorInteriors, tvSystem, interactiveTVs, mirrorSlots);

  // Front Red-Brick Vertical Column rests cleanly on the porch beam (y = 3.05..15.65) and attaches flush into front wall x=6.08
  box(staticGroup, [0.56, 12.6, 2.05], [5.82, 9.35, 0.45], m.brick, { uvScale: 2.5 });
  box(staticGroup, [0.26, 0.92, 5.15], [4.76, 5.72, -2.85], m.whiteBand);
  box(staticGroup, [0.26, 3.22, 0.78], [4.76, 4.58, -5.02], m.whiteBand);

  const floors = [3.05, 6.1, 9.15, 12.2];
  for (let level = 0; level < floors.length; level++) {
    const floorY = floors[level];
    for (const side of [-1, 1]) {
      const zCenter = side === -1 ? -3.28 : 3.35;
      const width = side === -1 ? 3.65 : 3.55;
      box(staticGroup, [1.34, 0.22, width + 0.14], [5.34, floorY, zCenter], m.whiteBand);
      box(staticGroup, [0.18, 0.44, width + 0.12], [4.77, floorY - 0.09, zCenter], side === 1 ? m.whiteBand : m.plaster);
      box(staticGroup, [1.45, 2.85, 0.16], [5.48, floorY + 1.47, zCenter + side * (width / 2)], m.plaster);
      frontWindow(staticGroup, m, { y: floorY + 1.42, z: side * 4.02, width: 1.42, height: 2.05, grill: false, openable: true });

      if (level === 0 && side === -1) {
        securityGrill(staticGroup, m, floorY, -4.18, 1.82, 4.78);
        balconyRail(staticGroup, m, floorY, -2.38, 1.82, false);
      } else if (level === 0 && side === 1) {
        balconyRail(staticGroup, m, floorY, zCenter, width, false);
        securityGrill(staticGroup, m, floorY, zCenter, width, 4.79);
      } else {
        balconyRail(staticGroup, m, floorY, zCenter, width, side === -1 && level > 1);
      }
    }
    frontWindow(staticGroup, m, { x: 5.53, y: floorY + 1.47, z: 0.72, width: 0.44, height: 2.18, frosted: true, openable: true });
    for (let i = 0; i < 6; i++) {
      rodBetween(staticGroup, [5.39, floorY + 0.52 + i * 0.34, 0.51], [5.39, floorY + 0.68 + i * 0.34, 0.93], 0.009, m.aluminum, 5);
    }
  }

  addBlueTarp(staticGroup, m);
  const clothColors = [0x9b3d36, 0x386b68, 0xe0d6c5, 0x7b2940];
  const clothMats = clothColors.map((color) => new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }));
  for (let i = 0; i < 5; i++) {
    const clothMaterial = clothMats[i % clothMats.length];
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.82 + (i % 2) * 0.3, 3, 5), clothMaterial);
    cloth.geometry.rotateY(-Math.PI / 2);
    cloth.position.set(5.65, 4.88, 2.25 + i * 0.48);
    staticGroup.add(cloth);
  }

  // Rooftop Parapet Walls (ছাদের রেলিং দেয়াল — leaving Rooftop Lift Entrance open at x=14.28, z=-0.64..+0.64)
  box(staticGroup, [0.22, 0.92, 11.1], [5.88, 15.72, 0], m.plaster);
  for (const z of [-5.46, 5.46]) box(staticGroup, [8.48, 0.92, 0.22], [10.12, 15.72, z], m.plaster);
  box(staticGroup, [0.22, 0.92, 4.34], [14.28, 15.72, -3.38], m.plaster);
  box(staticGroup, [0.22, 0.92, 4.34], [14.28, 15.72, 3.38], m.plaster);
  for (let z = -1.05; z <= 1.06; z += 0.3) {
    rodBetween(staticGroup, [5.48, 15.3, z], [5.48, 16.45, z], 0.035, m.aluminum);
  }
  rodBetween(staticGroup, [5.48, 16.43, -1.15], [5.48, 16.43, 1.15], 0.045, m.aluminum);
  rodBetween(staticGroup, [5.48, 16.43, -1.15], [8.0, 16.43, -1.15], 0.045, m.aluminum);
  rodBetween(staticGroup, [5.48, 16.43, 1.15], [8.0, 16.43, 1.15], 0.045, m.aluminum);

  cylinder(staticGroup, 0.055, 0.055, 14.9, [5.82, 7.45, 5.05], m.darkConcrete, 10);
  for (const y of floors) {
    rodBetween(staticGroup, [5.82, y + 0.2, 5.05], [4.73, y + 0.2, 5.05], 0.045, m.darkConcrete, 10);
  }

  buildSideAndRearElevations(staticGroup, m, floors);
  buildBoundaryAndBackyard(staticGroup, m);

  mergeStaticMeshes(staticGroup);

  // ==========================================================================
  // REAL-TIME REFLECTIVE MIRRORS (Shows your 3D Character LIVE at 60 FPS!)
  // ==========================================================================
  let bathReflector = null;
  let wardrobeReflector = null;
  try {
    bathReflector = new Reflector(new THREE.PlaneGeometry(0.50, 0.70), {
      clipBias: 0.003,
      textureWidth: 512,
      textureHeight: 512,
      color: 0xd8e2ec,
    });
    bathReflector.visible = false;
    group.add(bathReflector);

    wardrobeReflector = new Reflector(new THREE.PlaneGeometry(0.46, 1.48), {
      clipBias: 0.003,
      textureWidth: 512,
      textureHeight: 512,
      color: 0xd8e2ec,
    });
    wardrobeReflector.visible = false;
    group.add(wardrobeReflector);
  } catch {}

  // ==========================================================================
  // WORKING 5-STORY + ROOFTOP 3D ELEVATOR / LIFT (x = 14.36..15.98, z = -0.86..+0.86)
  // ==========================================================================
  const stops = [
    { code: 'GF', label: 'Ground Floor (1F)', y: 0.0 },
    { code: '2F', label: '2nd Floor (2A/2B)', y: 3.05 },
    { code: '3F', label: '3rd Floor (3A/3B)', y: 6.10 },
    { code: '4F', label: '4th Floor (4A/4B)', y: 9.15 },
    { code: '5F', label: '5th Floor (5A/5B)', y: 12.20 },
    { code: 'RF', label: 'Rooftop Terrace', y: 15.25 },
  ];

  const liftCabin = new THREE.Group();
  liftCabin.position.set(15.18, 0.0, 0.0);
  group.add(liftCabin);

  box(liftCabin, [1.56, 0.12, 1.68], [0, -0.02, 0], m.blackTile);
  box(liftCabin, [1.56, 0.12, 1.68], [0, 2.38, 0], m.darkMetal);
  box(liftCabin, [1.10, 0.03, 1.10], [0, 2.30, 0], m.lamp);
  box(liftCabin, [1.54, 2.36, 0.06], [0, 1.18, -0.82], m.aluminum);
  box(liftCabin, [1.54, 2.36, 0.06], [0, 1.18, 0.82], m.aluminum);
  box(liftCabin, [0.06, 0.90, 1.64], [0.76, 0.45, 0], m.aluminum);
  box(liftCabin, [0.04, 1.42, 1.56], [0.76, 1.62, 0], m.glass);
  rodBetween(liftCabin, [-0.55, 0.95, -0.74], [0.65, 0.95, -0.74], 0.02, m.chrome, 8);
  rodBetween(liftCabin, [-0.55, 0.95, 0.74], [0.65, 0.95, 0.74], 0.02, m.chrome, 8);
  rodBetween(liftCabin, [0.68, 0.95, -0.70], [0.68, 0.95, 0.70], 0.02, m.chrome, 8);
  box(liftCabin, [0.06, 0.52, 0.18], [-0.58, 1.24, -0.75], m.darkMetal);
  box(liftCabin, [0.07, 0.10, 0.12], [-0.58, 1.42, -0.75], m.ledGreen);

  const liftDoorLeft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.28, 0.62), m.chrome);
  liftDoorLeft.position.set(-0.77, 1.16, -0.31);
  const liftDoorRight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.28, 0.62), m.chrome);
  liftDoorRight.position.set(-0.77, 1.16, 0.31);
  liftCabin.add(liftDoorLeft, liftDoorRight);

  const leftGateWing = buildGateWing(m, -1);
  const rightGateWing = buildGateWing(m, 1);
  const frontDoorPivot = buildWoodenDoor(m, [5.98, 0.04, -0.61], 1);
  group.add(leftGateWing, rightGateWing, frontDoorPivot);

  const state = {
    gateOpen: false,
    frontDoorOpen: false,
    backDoorOpen: true,
    gateAngle: 0,
    frontDoorAngle: 0,
    backDoorAngle: 0,
    flatDoors,
    liftY: 0.0,
    liftFloorIndex: 0,
    liftTargetIndex: 0,
    liftPhase: 'idle',
    liftDoorOpen: 1.0,
    liftDirection: 1,
    liftHoldTimer: 0,
  };

  function nearestFloorIndex(footY) {
    let bestIdx = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < stops.length; i++) {
      const d = Math.abs(footY - stops[i].y);
      if (d < bestDiff) {
        bestDiff = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  function isInTowerFootprint(worldPos, pad = 2.5) {
    const lp = toLocal(worldPos);
    if (!lp) return false;
    return lp.x >= 5.5 - pad && lp.x <= 16.5 + pad && Math.abs(lp.z) <= 6.2 + pad;
  }

  function isInsideLift(worldPos) {
    const lp = toLocal(worldPos);
    if (!lp) return false;
    return lp.x >= 14.30 && lp.x <= 16.02 && Math.abs(lp.z) <= 0.88;
  }

  function isNearLiftLobby(worldPos) {
    const lp = toLocal(worldPos);
    if (!lp) return false;
    return lp.x >= 12.1 && lp.x <= 14.55 && Math.abs(lp.z) <= 1.35;
  }

  function isLiftOpenAtY(footY) {
    return state.liftPhase !== 'moving' && state.liftDoorOpen > 0.65 && Math.abs(footY - state.liftY) < 0.85;
  }

  function goToFloor(index) {
    const idx = THREE.MathUtils.clamp(Math.round(index), 0, stops.length - 1);
    state.liftTargetIndex = idx;
    if (idx === state.liftFloorIndex && Math.abs(state.liftY - stops[idx].y) < 0.05) {
      state.liftPhase = 'opening';
      state.liftHoldTimer = 5.0;
    } else {
      state.liftDirection = stops[idx].y >= state.liftY ? 1 : -1;
      state.liftPhase = state.liftDoorOpen > 0.05 ? 'closing' : 'moving';
    }
  }

  function openDoors() {
    if (state.liftPhase !== 'moving') {
      state.liftPhase = 'opening';
      state.liftHoldTimer = 5.0;
    }
  }

  function closeDoors() {
    if (state.liftPhase !== 'moving') {
      state.liftPhase = 'closing';
    }
  }

  function findNearestTV(worldPos, maxDist = 3.2) {
    const lp = toLocal(worldPos);
    if (!lp) return null;
    const footY = lp.y - 1.68;
    let best = null;
    let bestDist = maxDist;
    for (const tv of interactiveTVs) {
      if (Math.abs(footY - tv.y) > 1.5) continue;
      const d = Math.hypot(lp.x - tv.x, lp.z - tv.z);
      if (d < bestDist) {
        bestDist = d;
        best = tv;
      }
    }
    return best ? { tv: best, dist: bestDist } : null;
  }

  function toggleNearestTV(worldPos) {
    const hit = findNearestTV(worldPos, 3.3);
    if (!hit) return null;
    const { tv } = hit;
    tv.isOn = !tv.isOn;
    tv.screenMesh.material = tv.isOn ? tvSystem.tvOnMat : tvSystem.tvOffMat;
    tv.ledMesh.material = tv.isOn ? m.ledGreen : m.ledRed;
    playRemoteClickBeep(tv.isOn ? 1420 : 880, 0.05);
    const chName = TV_CHANNELS[tv.channel]?.name || 'LIVE HD';
    return { unit: tv.unit, isOn: tv.isOn, channelName: chName };
  }

  function cycleNearestTVChannel(worldPos) {
    const hit = findNearestTV(worldPos, 3.3);
    if (!hit) return null;
    const { tv } = hit;
    if (!tv.isOn) {
      tv.isOn = true;
      tv.screenMesh.material = tvSystem.tvOnMat;
      tv.ledMesh.material = m.ledGreen;
    } else {
      tv.channel = (tv.channel + 1) % TV_CHANNELS.length;
    }
    playRemoteClickBeep(1640, 0.04);
    const chName = TV_CHANNELS[tv.channel]?.name || 'LIVE HD';
    return { unit: tv.unit, isOn: tv.isOn, channelName: chName };
  }

  function findNearestFlatDoor(localPos) {
    const footY = localPos.y - 1.68;
    let best = null;
    let bestDist = Infinity;
    for (const fd of flatDoors) {
      if (Math.abs(footY - fd.y) > 1.65) continue;
      const d = Math.hypot(localPos.x - fd.x, localPos.z - fd.z);
      if (d < bestDist) {
        bestDist = d;
        best = fd;
      }
    }
    return { door: best, dist: bestDist };
  }

  return {
    group,
    offset: TALTOLA_HOUSE_OFFSET,
    eyebrowTitle: 'TALTOLA 5-STORY HOUSE · LIFT',
    stops,
    state,
    liftCabinCenter: { x: ox + 15.18, z: oz },
    liftExitPos: { x: ox + 13.45, z: oz },
    isInTowerFootprint,
    isInsideLift,
    isNearLiftLobby,
    isLiftOpenAtY,
    nearestFloorIndex,
    goToFloor,
    openDoors,
    closeDoors,
    findNearestTV,
    toggleNearestTV,
    cycleNearestTVChannel,
    interact(playerPosition) {
      if (isInsideLift(playerPosition)) {
        return 'open_lift_keypad';
      }
      if (isNearLiftLobby(playerPosition)) {
        const lp = toLocal(playerPosition);
        const nearK = nearestFloorIndex(lp.y - 1.68);
        if (state.liftFloorIndex !== nearK || state.liftDoorOpen < 0.7) {
          goToFloor(nearK);
        }
        return 'open_lift_keypad';
      }
      return null;
    },
    isFlatDoorOpen(level, side) {
      const unit = `${level + 1}${side < 0 ? 'A' : 'B'}`;
      const found = flatDoors.find((d) => d.unit === unit);
      return found ? found.open : true;
    },
    toggleNearestDoor(playerPosition) {
      const lp = toLocal(playerPosition);
      const footY = lp.y - 1.68;
      const { door: nearestFlat, dist: dFlat } = findNearestFlatDoor(lp);

      if (footY < 1.5) {
        const dGate = Math.hypot(lp.x - 2.48, lp.z);
        const dFront = Math.hypot(lp.x - 5.98, lp.z);

        if (nearestFlat && dFlat < 2.2 && dFlat < dFront) {
          nearestFlat.open = !nearestFlat.open;
          return { target: nearestFlat.unit, open: nearestFlat.open };
        }
        if (dGate <= dFront && dGate < 6.5) {
          state.gateOpen = !state.gateOpen;
          return { target: 'gate', open: state.gateOpen };
        }
        if (dFront < 5.5) {
          state.frontDoorOpen = !state.frontDoorOpen;
          return { target: 'frontDoor', open: state.frontDoorOpen };
        }
      }

      if (nearestFlat && dFlat < 3.6) {
        nearestFlat.open = !nearestFlat.open;
        return { target: nearestFlat.unit, open: nearestFlat.open };
      }

      state.gateOpen = !state.gateOpen;
      return { target: 'gate', open: state.gateOpen };
    },
    toggleAllDoors() {
      const next = !(state.gateOpen && state.frontDoorOpen);
      state.gateOpen = next;
      state.frontDoorOpen = next;
      for (const fd of flatDoors) fd.open = next;
      return next;
    },
    getPrompt(playerPosition) {
      const lp = toLocal(playerPosition);
      const footY = lp.y - 1.68;
      if (isInsideLift(playerPosition)) {
        const curStop = stops[state.liftFloorIndex] || stops[0];
        return `[L / E] House Lift Keypad (${curStop.code}) · Press 0-5`;
      }
      if (isNearLiftLobby(playerPosition)) {
        return '[E / L] Call & Enter Taltola House Lift';
      }
      const tvHit = findNearestTV(playerPosition, 3.1);
      if (tvHit) {
        const { tv } = tvHit;
        const chName = TV_CHANNELS[tv.channel]?.name || 'LIVE HD';
        return tv.isOn
          ? `📺 [E] Remote: Turn TV OFF · [K] Channel (${chName})`
          : `📺 [E] Remote: Turn TV ON (Flat ${tv.unit})`;
      }
      const { door: nearestFlat, dist: dFlat } = findNearestFlatDoor(lp);

      if (nearestFlat && dFlat < 2.15) {
        return nearestFlat.open
          ? `[E] Close Flat ${nearestFlat.unit} Door`
          : `[E] Open Flat ${nearestFlat.unit} Door`;
      }

      if (footY < 1.5) {
        const dGate = Math.hypot(lp.x - 2.48, lp.z);
        const dFront = Math.hypot(lp.x - 5.98, lp.z);
        if (dGate < 4.5 && dGate <= dFront) {
          return state.gateOpen ? '[E] Close Main Gate' : '[E] Open Main Gate';
        }
        if (dFront < 4.0) {
          return state.frontDoorOpen ? '[E] Close Front Door' : '[E] Open Front Door';
        }
      }
      return null;
    },
    update(delta, playerPosition = null, isLowQuality = false) {
      const lp = toLocal(playerPosition);
      if (lp) {
        const nearHouseDistrict = (lp.x * lp.x + lp.z * lp.z) <= 285 * 285;
        if (group.visible !== nearHouseDistrict) group.visible = nearHouseDistrict;
        if (!nearHouseDistrict) {
          if (bathReflector) bathReflector.visible = false;
          if (wardrobeReflector) wardrobeReflector.visible = false;
          return;
        }
      }
      const step = Math.min(1, 6.0 * delta);
      const targetGate = state.gateOpen ? Math.PI * 0.48 : 0;
      const targetFront = state.frontDoorOpen ? Math.PI * 0.54 : 0;

      if (Math.abs(targetGate - state.gateAngle) > 0.0005) {
        state.gateAngle += (targetGate - state.gateAngle) * step;
        leftGateWing.rotation.y = state.gateAngle;
        rightGateWing.rotation.y = -state.gateAngle;
      }
      if (Math.abs(targetFront - state.frontDoorAngle) > 0.0005) {
        state.frontDoorAngle += (targetFront - state.frontDoorAngle) * step;
        frontDoorPivot.rotation.y = state.frontDoorAngle;
      }

      for (const fd of flatDoors) {
        const target = fd.open ? fd.openDir * Math.PI * 0.52 : 0;
        if (Math.abs(target - fd.angle) > 0.0005) {
          fd.angle += (target - fd.angle) * step;
          fd.pivot.rotation.y = fd.angle;
        }
      }

      // Update 5-Story + Rooftop Lift Cabin & Sliding Doors smoothly
      if (state.liftPhase === 'closing') {
        state.liftDoorOpen = Math.max(0, state.liftDoorOpen - delta * 2.1);
        if (state.liftDoorOpen <= 0.001) {
          state.liftDoorOpen = 0;
          const targetY = stops[state.liftTargetIndex].y;
          if (Math.abs(state.liftY - targetY) > 0.05) {
            state.liftPhase = 'moving';
          } else {
            state.liftPhase = 'idle';
          }
        }
      } else if (state.liftPhase === 'moving') {
        const targetY = stops[state.liftTargetIndex].y;
        const diff = targetY - state.liftY;
        const speed = 3.2;
        if (Math.abs(diff) <= speed * delta) {
          state.liftY = targetY;
          state.liftFloorIndex = state.liftTargetIndex;
          state.liftPhase = 'opening';
          state.liftHoldTimer = 5.0;
        } else {
          state.liftY += Math.sign(diff) * speed * delta;
          state.liftFloorIndex = nearestFloorIndex(state.liftY);
        }
      } else if (state.liftPhase === 'opening') {
        state.liftDoorOpen = Math.min(1, state.liftDoorOpen + delta * 2.1);
        if (state.liftDoorOpen >= 0.999) {
          state.liftDoorOpen = 1;
          state.liftPhase = 'idle';
        }
      }
      liftCabin.position.y = state.liftY;
      liftDoorLeft.position.z = -0.31 - state.liftDoorOpen * 0.56;
      liftDoorRight.position.z = 0.31 + state.liftDoorOpen * 0.56;

      // Cull interior furniture of floors the player cannot see + activate nearest real-time Mirror & live TV!
      if (lp) {
        const insideOrNear = lp.x > 3.8 && lp.x < 16.5 && Math.abs(lp.z) < 6.8;
        const footY = lp.y - 1.68;
        const playerLvl = Math.round(footY / 3.05);
        const maxLvlDiff = isLowQuality ? 0 : 1;
        for (let i = 0; i < floorInteriors.length; i++) {
          const shouldShow = insideOrNear && Math.abs(i - playerLvl) <= maxLvlDiff;
          if (floorInteriors[i].visible !== shouldShow) {
            floorInteriors[i].visible = shouldShow;
          }
        }

        // Animate live TV broadcast ONLY when player is inside the house near an ON TV (ZERO FPS cost outside!)
        if (insideOrNear) {
          let activeChannel = null;
          for (const tv of interactiveTVs) {
            if (tv.isOn && Math.abs(footY - tv.y) < 1.8) {
              activeChannel = tv.channel;
              break;
            }
          }
          if (activeChannel !== null) {
            tvSystem.update(activeChannel, performance.now());
          }
        }

        // Real-Time Reflective Mirror: snap single Reflector to the closest mirror within 3.2m indoors!
        if (bathReflector && wardrobeReflector) {
          let bestMirror = null;
          let bestMDist = 3.2;
          if (insideOrNear && !isLowQuality) {
            for (const ms of mirrorSlots) {
              if (Math.abs(footY - ms.fy) > 1.55) continue;
              const d = Math.hypot(lp.x - ms.x, lp.z - ms.z);
              if (d < bestMDist) {
                bestMDist = d;
                bestMirror = ms;
              }
            }
          }
          if (bestMirror && bestMirror.kind === 'bath') {
            bathReflector.position.set(bestMirror.x, bestMirror.y, bestMirror.z);
            bathReflector.rotation.set(0, bestMirror.rotY, 0);
            bathReflector.visible = true;
            wardrobeReflector.visible = false;
          } else if (bestMirror && bestMirror.kind === 'wardrobe') {
            wardrobeReflector.position.set(bestMirror.x, bestMirror.y, bestMirror.z);
            wardrobeReflector.rotation.set(0, bestMirror.rotY, 0);
            wardrobeReflector.visible = true;
            bathReflector.visible = false;
          } else {
            bathReflector.visible = false;
            wardrobeReflector.visible = false;
          }
        }
      }

      // Skip spinning ceiling fans when in Low Smooth mode outside the building
      if (isLowQuality && lp && (lp.x < 5.5 || lp.x > 14.8)) {
        return;
      }
      const rotDelta = delta * 6.5;
      for (const fan of animatedFans) {
        fan.rotation.y += rotDelta;
      }
    },
  };
}
