import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * TATA LPT 2515 (10-WHEELER TRUCK) — HIGH-QUALITY EXTERIOR, STEEL/METAL, INTERIOR,
 * SPINNING 10-WHEEL RIG, OPENABLE CAB DOORS, UPGRADED TRAILER & FULL LIGHTING SYSTEM
 *
 * Raw GLB orientation: X = width, Y = front(-46) to rear(+45), Z = height(0..37).
 * Normalized game-ready space (S = 0.098):
 *   +Z = Front (+4.50m), -Z = Rear (-4.42m), +Y = Up (0..3.63m), +X = Left, -X = Right
 */

const TRUCK_SCALE = 0.098;

function makeTruckTireTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#181b20';
  ctx.fillRect(0, 0, 512, 256);

  // Heavy highway lug tread blocks
  for (let x = 0; x < 512; x += 24) {
    ctx.fillStyle = '#252a32';
    ctx.fillRect(x + 2, 14, 15, 64);
    ctx.fillRect(x + 12, 96, 14, 64);
    ctx.fillRect(x + 2, 178, 15, 64);
    ctx.fillStyle = '#0f1216';
    ctx.fillRect(x + 18, 0, 4, 256);
  }
  // Circumferential drainage grooves
  ctx.fillStyle = '#0d0f13';
  ctx.fillRect(0, 82, 512, 10);
  ctx.fillRect(0, 164, 512, 10);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeGaugeClusterTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 192;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0b1018';
  ctx.fillRect(0, 0, 512, 192);

  // 4 backlit Tata instrument dials (Speedo, RPM, Air Pressure, Fuel/Temp)
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
    // Needle
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
    ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#f8fafc';
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
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 256, 96);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 244, 84);
  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TATA 2515', 128, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds a high-detail 10.00-20 heavy truck wheel (single front or dual tandem rear)
 * Axle = X axis so `wheelGroup.rotation.x` spins forward/backward cleanly.
 */
function buildRealisticTruckWheel({
  radius = 0.505,
  width = 0.27,
  isDual = false,
  outboardSign = 1,
  tireMat,
  chromeMat,
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

    const rimMesh = new THREE.Mesh(rimGeo, chromeMat);
    rimMesh.position.x = ox;
    rimMesh.castShadow = true;
    group.add(rimMesh);

    const outerFaceX = ox + outboardSign * (hw * 0.74);
    const dishRing = new THREE.Mesh(dishRingGeo, chromeMat);
    dishRing.position.x = outerFaceX;
    group.add(dishRing);

    // Outer face details on the visible outboard wheel
    if (!isDual || idx === 1) {
      // Heavy hub cap + 10 chrome lug nuts + 8 cooling vents
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.135, 0.14, 18), hubMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.x = ox + outboardSign * (hw * 0.65);
      group.add(hub);

      const capRing = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 8, 20), chromeMat);
      capRing.rotation.y = Math.PI / 2;
      capRing.position.x = ox + outboardSign * (hw * 0.88);
      group.add(capRing);

      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const lug = new THREE.Mesh(lugGeo, chromeMat);
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

  // Brake drum on inboard side
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(rimR * 0.78, rimR * 0.78, 0.22, 18), darkSteelMat);
  drum.rotation.z = Math.PI / 2;
  drum.position.x = -outboardSign * (isDual ? 0.30 : 0.10);
  group.add(drum);

  return group;
}

/**
 * Slices out cab side-door triangles from raw GLB meshes (so opening the door reveals the real interior!)
 */
function cutDoorOpeningsFromGeometry(geometry) {
  const pos = geometry.attributes.position;
  if (!pos) return;
  const idx = geometry.index;
  const keepTris = [];
  const isInsideDoorWindow = (vx, vy, vz) => {
    // Raw space: X = width (±12.2), Y = front(-46) to rear(+45), Z = height(0..37)
    // Door opening on both left & right cab sides: |X| > 10.6, Y in [-36.2, -24.2], Z in [11.6, 26.6]
    return Math.abs(vx) > 10.6 && vy >= -36.2 && vy <= -24.2 && vz >= 11.6 && vz <= 26.6;
  };
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

/**
 * Builds an openable high-detail steel-trimmed truck cab door with window glass,
 * interior trim panel, door pocket, armrest, chrome handle, and mirror arm.
 */
function buildCabDoor(sideSign, mats) {
  // Hinge at front A-pillar: X = sideSign * 1.205, Y = 1.15, Z = 3.56
  // Door extends backward toward -Z by 1.18m (from Z = 0 to Z = -1.18 in local hinge space)
  const pivot = new THREE.Group();
  pivot.name = sideSign > 0 ? 'Door_FL' : 'Door_FR';
  pivot.position.set(sideSign * 1.205, 1.15, 3.56);

  const doorLen = 1.18;
  const lowerH = 0.88;
  const upperH = 0.62;
  const thick = 0.085;
  const midZ = -doorLen * 0.5;

  // Lower solid painted steel door skin
  const lowerPanel = new THREE.Mesh(new THREE.BoxGeometry(thick, lowerH, doorLen), mats.cabPaint);
  lowerPanel.position.set(0, lowerH * 0.5, midZ);
  lowerPanel.castShadow = true;
  lowerPanel.receiveShadow = true;
  pivot.add(lowerPanel);

  // Decorative stainless steel beltline trim strip
  const trimStrip = new THREE.Mesh(new THREE.BoxGeometry(thick + 0.018, 0.045, doorLen - 0.02), mats.chrome);
  trimStrip.position.set(sideSign * 0.004, lowerH - 0.08, midZ);
  pivot.add(trimStrip);

  // Window frame pillars (front, rear, top)
  const fPillar = new THREE.Mesh(new THREE.BoxGeometry(thick * 0.85, upperH, 0.075), mats.cabPaint);
  fPillar.position.set(0, lowerH + upperH * 0.5, -0.04);
  pivot.add(fPillar);

  const rPillar = new THREE.Mesh(new THREE.BoxGeometry(thick * 0.85, upperH, 0.085), mats.cabPaint);
  rPillar.position.set(0, lowerH + upperH * 0.5, -doorLen + 0.045);
  pivot.add(rPillar);

  const topRail = new THREE.Mesh(new THREE.BoxGeometry(thick * 0.85, 0.075, doorLen), mats.cabPaint);
  topRail.position.set(0, lowerH + upperH - 0.035, midZ);
  pivot.add(topRail);

  // Clear tinted door window glass
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.016, upperH - 0.08, doorLen - 0.16), mats.glass);
  glass.position.set(0, lowerH + upperH * 0.48, midZ);
  pivot.add(glass);

  // Exterior chrome door handle + keyhole
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.045, 0.16), mats.chrome);
  handle.position.set(sideSign * (thick * 0.5 + 0.02), lowerH - 0.20, -doorLen + 0.22);
  pivot.add(handle);

  // Interior door trim card, padded armrest & pull handle
  const innerCard = new THREE.Mesh(new THREE.BoxGeometry(0.025, lowerH - 0.10, doorLen - 0.08), mats.interiorTrim);
  innerCard.position.set(-sideSign * (thick * 0.5 + 0.008), lowerH * 0.5, midZ);
  pivot.add(innerCard);

  const armrest = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.42), mats.seatLeather);
  armrest.position.set(-sideSign * (thick * 0.5 + 0.04), lowerH * 0.56, midZ - 0.06);
  pivot.add(armrest);

  // Heavy chrome west-coast truck side mirror frame mounted on door!
  const armTop = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.34, 8), mats.chrome);
  armTop.rotation.z = Math.PI / 2;
  armTop.position.set(sideSign * 0.18, lowerH + upperH - 0.08, -0.14);
  pivot.add(armTop);

  const armBot = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.34, 8), mats.chrome);
  armBot.rotation.z = Math.PI / 2;
  armBot.position.set(sideSign * 0.18, lowerH + 0.08, -0.14);
  pivot.add(armBot);

  const mirrorBar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.56, 8), mats.chrome);
  mirrorBar.position.set(sideSign * 0.33, lowerH + upperH * 0.5, -0.14);
  pivot.add(mirrorBar);

  const mirrorBack = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.38, 0.16), mats.chrome);
  mirrorBack.position.set(sideSign * 0.34, lowerH + upperH * 0.52, -0.16);
  mirrorBack.rotation.y = sideSign * -0.18;
  pivot.add(mirrorBack);

  const mirrorGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.35), mats.mirror);
  mirrorGlass.position.set(sideSign * 0.34, lowerH + upperH * 0.52, -0.178);
  mirrorGlass.rotation.y = Math.PI + sideSign * -0.18;
  pivot.add(mirrorGlass);

  return pivot;
}

/**
 * Builds the detailed Tata 2515 Driver Cabin Interior (RHD Bangladeshi Truck Layout)
 */
function buildTruckInterior(parent, mats) {
  const g = new THREE.Group();
  g.name = 'Tata2515_Interior';
  parent.add(g);

  // 1) Textured Cabin Floor & Engine Tunnel Hump
  const floor = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.08, 1.95), mats.floorMat);
  floor.position.set(0, 1.15, 3.16);
  g.add(floor);

  const engineHump = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.34, 1.32), mats.dashMat);
  engineHump.position.set(0.0, 1.34, 3.35);
  g.add(engineHump);

  // 2) Full-Width Sculpted Tata Dashboard + Backlit Gauge Cluster
  const dashMain = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.38, 0.52), mats.dashMat);
  dashMain.position.set(0, 1.88, 3.88);
  g.add(dashMain);

  const dashTop = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.07, 0.58), mats.interiorTrim);
  dashTop.position.set(0, 2.09, 3.86);
  g.add(dashTop);

  // Illuminated Gauge Cluster on Right-Hand Driver Side (X = -0.58)
  const clusterHood = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.16), mats.dashMat);
  clusterHood.position.set(-0.58, 2.08, 3.68);
  g.add(clusterHood);

  const clusterScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.18), mats.gaugeMat);
  clusterScreen.position.set(-0.58, 2.06, 3.595);
  clusterScreen.rotation.y = Math.PI;
  clusterScreen.rotation.x = 0.22;
  g.add(clusterScreen);

  // Center switches, AC vents & radio head unit
  const centerPanel = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.24, 0.06), mats.darkMetal);
  centerPanel.position.set(0.0, 1.88, 3.61);
  g.add(centerPanel);

  // 3) Steering Column + Rotating 3-Spoke Tata Steering Wheel
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.62, 12), mats.darkMetal);
  col.position.set(-0.58, 1.72, 3.62);
  col.rotation.x = 0.55;
  g.add(col);

  const steeringPivot = new THREE.Group();
  steeringPivot.name = 'Steering_Wheel';
  steeringPivot.position.set(-0.58, 1.94, 3.40);
  steeringPivot.rotation.x = -0.58;
  g.add(steeringPivot);

  const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.022, 12, 28), mats.seatLeather);
  steeringPivot.add(wheelRim);
  const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.04, 16), mats.dashMat);
  wheelHub.rotation.x = Math.PI / 2;
  steeringPivot.add(wheelHub);
  for (const ang of [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3]) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.20, 0.02), mats.chrome);
    spoke.position.set(Math.cos(ang) * 0.10, Math.sin(ang) * 0.10, 0);
    spoke.rotation.z = ang - Math.PI / 2;
    steeringPivot.add(spoke);
  }

  // 4) Chrome Gear Lever + Handbrake + 3 Metal Pedals
  const gearStick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.52, 8), mats.chrome);
  gearStick.position.set(-0.22, 1.62, 3.36);
  gearStick.rotation.x = -0.18;
  gearStick.rotation.z = 0.12;
  g.add(gearStick);
  const gearKnob = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 10), mats.seatLeather);
  gearKnob.position.set(-0.25, 1.87, 3.31);
  g.add(gearKnob);

  for (const px of [-0.42, -0.56, -0.70]) {
    const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.11, 0.02), mats.chrome);
    pedal.position.set(px, 1.32, 3.74);
    pedal.rotation.x = -0.35;
    g.add(pedal);
  }

  // 5) Driver Seat (Right, X = -0.58) + Co-Driver Bench (Left, X = +0.58) + Sleeper Berth (Rear)
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

  // Rear Sleeper Berth (Authentic Bangladeshi Long-Haul Tata 2515 Cabin!)
  const sleeper = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.16, 0.56), mats.seatAccent);
  sleeper.position.set(0, 1.66, 2.42);
  g.add(sleeper);

  // 6) Roof Liner + Warm Interior Cabin Dome Light + Sun Visors + Rearview Mirror
  const liner = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.05, 1.88), mats.roofLiner);
  liner.position.set(0, 2.78, 3.16);
  g.add(liner);

  const domeHousing = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.14), mats.chrome);
  domeHousing.position.set(0, 2.74, 3.32);
  g.add(domeHousing);
  const domeLens = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.02, 0.11), mats.domeLight);
  domeLens.position.set(0, 2.715, 3.32);
  g.add(domeLens);

  const domePoint = new THREE.PointLight(0xffe6b3, 1.15, 3.2, 1.8);
  domePoint.position.set(0, 2.64, 3.30);
  g.add(domePoint);

  const rvMirror = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.03), mats.darkMetal);
  rvMirror.position.set(-0.08, 2.64, 3.84);
  g.add(rvMirror);

  return { steeringPivot, domePoint };
}

/**
 * Builds High-Quality Chrome/Steel Exterior Detailing, Trailer Upgrades & Full Lighting
 */
function buildExteriorSteelAndLights(parent, mats) {
  const g = new THREE.Group();
  g.name = 'Tata2515_ExteriorSteelAndLights';
  parent.add(g);

  // 1) Heavy Chrome/Steel Front Bumper + Bullbar + Front Grille Slats + TATA 2515 Badge
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.34, 0.22), mats.chrome);
  frontBumper.position.set(0, 0.72, 4.44);
  frontBumper.castShadow = true;
  g.add(frontBumper);

  const bumperStep = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.05, 0.28), mats.darkMetal);
  bumperStep.position.set(0, 0.89, 4.46);
  g.add(bumperStep);

  // Stainless steel tubular bullbar guard
  for (const bx of [-0.62, 0.62]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.62, 10), mats.chrome);
    post.position.set(bx, 1.16, 4.50);
    g.add(post);
  }
  for (const by of [1.02, 1.24, 1.44]) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 1.56, 10), mats.chrome);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, by, 4.50);
    g.add(bar);
  }

  // Front Grille Chrome Slats & TATA 2515 Emblem
  for (let i = 0; i < 4; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.032, 0.04), mats.chrome);
    slat.position.set(0, 1.28 + i * 0.13, 4.38);
    g.add(slat);
  }
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.18, 0.04), mats.tataBadge);
  badge.position.set(0, 1.88, 4.36);
  g.add(badge);

  // Dual Windshield Wipers
  for (const wx of [-0.46, 0.42]) {
    const wiper = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.022, 0.022), mats.darkMetal);
    wiper.position.set(wx, 2.08, 4.18);
    wiper.rotation.z = 0.22;
    g.add(wiper);
  }

  // 2) Cab Roof Steel Luggage Carrier + Dual Chrome Air Horns + 5 Roof Amber Marker Lights
  const rackRailL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.72, 8), mats.chrome);
  rackRailL.rotation.x = Math.PI / 2;
  rackRailL.position.set(1.02, 3.06, 3.12);
  g.add(rackRailL);
  const rackRailR = rackRailL.clone();
  rackRailR.position.x = -1.02;
  g.add(rackRailR);
  for (const rz of [2.32, 3.12, 3.92]) {
    const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.06, 8), mats.chrome);
    cross.rotation.z = Math.PI / 2;
    cross.position.set(0, 3.06, rz);
    g.add(cross);
  }
  // Dual Chrome Trumpet Air Horns on Roof
  for (const hx of [-0.72, 0.72]) {
    const hornBody = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.02, 0.48, 12), mats.chrome);
    hornBody.rotation.x = Math.PI / 2;
    hornBody.position.set(hx, 3.04, 3.88);
    g.add(hornBody);
  }

  // 3) Chrome Vertical Exhaust Stack with Perforated Steel Heat Shield (Behind Cab Right)
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 2.45, 14), mats.chrome);
  exhaust.position.set(-1.14, 2.15, 2.12);
  g.add(exhaust);
  const exhaustTip = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.065, 0.24, 14), mats.chrome);
  exhaustTip.position.set(-1.14, 3.42, 2.07);
  exhaustTip.rotation.x = -0.35;
  g.add(exhaustTip);
  const heatShield = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.092, 1.35, 14, 1, true), mats.brushedSteel);
  heatShield.position.set(-1.14, 2.02, 2.12);
  g.add(heatShield);

  // 4) Side Stainless Steel Footsteps + Grab Handles + Cylindrical Fuel Tank + Air Tanks + Side Guards
  for (const sx of [-1, 1]) {
    for (const sy of [0.56, 0.84]) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.56), mats.chrome);
      step.position.set(sx * 1.18, sy, 3.08);
      g.add(step);
    }
    const grab = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.56, 8), mats.chrome);
    grab.position.set(sx * 1.24, 1.72, 2.34);
    g.add(grab);

    // Side Under-Run Stainless Steel Protection Bars (between front & rear wheels)
    for (const gy of [0.52, 0.72]) {
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 2.55), mats.chrome);
      guard.position.set(sx * 1.24, gy, 0.92);
      g.add(guard);
    }
  }

  // Polished Stainless Steel Fuel Tank (Left Side) with Chrome Straps
  const fuelTank = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.35, 20), mats.chrome);
  fuelTank.rotation.x = Math.PI / 2;
  fuelTank.position.set(0.98, 0.68, 1.02);
  g.add(fuelTank);
  for (const fz of [0.62, 1.42]) {
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.018, 8, 20), mats.darkMetal);
    strap.position.set(0.98, 0.68, fz);
    g.add(strap);
  }

  // Dual Air Brake Reservoir Tanks (Right Side) + Battery Box
  for (const az of [0.55, 1.25]) {
    const airT = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.62, 14), mats.darkMetal);
    airT.rotation.x = Math.PI / 2;
    airT.position.set(-0.96, 0.68, az);
    g.add(airT);
  }

  // 5) Upgraded Rear Trailer / Cargo Body Reinforcement (Steel Side Ribs, Subframe, Reflective Tape, Rear Bumper, Mudflaps)
  // Twin Heavy I-Beam Chassis Rails under trailer
  for (const rx of [-0.46, 0.46]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 6.8), mats.darkMetal);
    rail.position.set(rx, 0.66, -1.05);
    g.add(rail);
  }
  // Vertical Steel Cargo Body Structural Ribs along both sides
  for (const sx of [-1, 1]) {
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 6.58), mats.brushedSteel);
    topBar.position.set(sx * 1.215, 3.04, -1.12);
    g.add(topBar);
    const botBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 6.58), mats.brushedSteel);
    botBar.position.set(sx * 1.215, 0.96, -1.12);
    g.add(botBar);
    // Red-white highway safety reflective tape along lower trailer skirt
    const sideTape = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.065, 6.52), mats.reflectiveTape);
    sideTape.position.set(sx * 1.258, 0.96, -1.12);
    g.add(sideTape);

    for (let z = -4.25; z <= 2.0; z += 0.90) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.08, 0.075), mats.brushedSteel);
      rib.position.set(sx * 1.218, 2.00, z);
      g.add(rib);
    }
  }
  // Rear Tailgate Steel Frame, Hinges, Reflective Tape & Chrome Underrun Bumper
  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.20, 0.16), mats.chrome);
  rearBumper.position.set(0, 0.56, -4.46);
  g.add(rearBumper);

  const rearTape = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.08, 0.02), mats.reflectiveTape);
  rearTape.position.set(0, 0.94, -4.43);
  g.add(rearTape);

  // Heavy Rubber Mudflaps behind rear tandem wheels
  for (const mx of [-1.20, 1.20]) {
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.48, 0.03), mats.floorMat);
    flap.position.set(mx, 0.36, -3.12);
    g.add(flap);
  }

  // 6) FULL LIGHTING SYSTEM (Headlights, Fog Lamps, Taillights, Brake Lights, Reverse, Left/Right Indicators, Roof Markers)
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
    roughness: 0.12,
    metalness: 0.15,
  });

  // Front Headlights (Dual High-Power Lamps inside Chrome Bezels)
  for (const sx of [-1, 1]) {
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.08), mats.chrome);
    bezel.position.set(sx * 0.88, 0.78, 4.53);
    g.add(bezel);

    const hlMat = makeLensMat(0xf8fafc, 0xfff3d1, 2.2);
    lights.headlightMats.push(hlMat);
    const hlLens = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.04), hlMat);
    hlLens.position.set(sx * 0.88, 0.78, 4.56);
    g.add(hlLens);

    // Lower Fog Lamp
    const fogMat = makeLensMat(0xfef08a, 0xfde047, 1.4);
    lights.fogMats.push(fogMat);
    const fogLens = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.04, 14), fogMat);
    fogLens.rotation.x = Math.PI / 2;
    fogLens.position.set(sx * 0.56, 0.62, 4.55);
    g.add(fogLens);

    // Front Bumper + Side Fender Amber Indicators
    const indMat = makeLensMat(0xf59e0b, 0xff8c00, 0.0);
    if (sx > 0) lights.indLeftMats.push(indMat);
    else lights.indRightMats.push(indMat);

    const frontInd = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.05), indMat);
    frontInd.position.set(sx * 1.12, 0.78, 4.55);
    g.add(frontInd);

    const sideInd = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.18), indMat);
    sideInd.position.set(sx * 1.24, 1.04, 3.92);
    g.add(sideInd);

    // Rear Taillight + Brake + Indicator + Reverse Cluster
    const rearHousing = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.18, 0.08), mats.darkMetal);
    rearHousing.position.set(sx * 0.82, 0.74, -4.44);
    g.add(rearHousing);

    const tailMat = makeLensMat(0xb91c1c, 0xff1a1a, 1.5);
    lights.taillightMats.push(tailMat);
    const tailLens = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.13, 0.04), tailMat);
    tailLens.position.set(sx * 0.70, 0.74, -4.47);
    g.add(tailLens);

    const brkMat = makeLensMat(0xdc2626, 0xff0000, 0.4);
    lights.brakeMats.push(brkMat);
    const brkLens = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.13, 0.04), brkMat);
    brkLens.position.set(sx * 0.86, 0.74, -4.47);
    g.add(brkLens);

    const rearIndLens = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.04), indMat);
    rearIndLens.position.set(sx * 1.00, 0.74, -4.47);
    g.add(rearIndLens);

    const revMat = makeLensMat(0xe2e8f0, 0xffffff, 0.0);
    lights.reverseMats.push(revMat);
    const revLens = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.04), revMat);
    revLens.position.set(sx * 0.56, 0.74, -4.47);
    g.add(revLens);
  }

  // 5 Cab Roof Amber Marker Lights
  const markerMat = makeLensMat(0xf59e0b, 0xff9900, 1.6);
  lights.markerMats.push(markerMat);
  for (const mx of [-0.92, -0.46, 0, 0.46, 0.92]) {
    const mk = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.055, 0.07), markerMat);
    mk.position.set(mx, 2.98, 4.02);
    g.add(mk);
  }

  // Real Front Headlight SpotLights
  for (const sx of [-1, 1]) {
    const spot = new THREE.SpotLight(0xfff4d6, 3.8, 34, Math.PI * 0.24, 0.45, 1.3);
    spot.position.set(sx * 0.88, 0.82, 4.62);
    const target = new THREE.Object3D();
    target.position.set(sx * 0.72, 0.0, 16.0);
    g.add(target);
    spot.target = target;
    g.add(spot);
    if (sx > 0) lights.headSpotL = spot;
    else lights.headSpotR = spot;
  }

  // Subtle Rear Red Glow Light
  const tailGlow = new THREE.PointLight(0xff2222, 0.8, 4.5, 1.8);
  tailGlow.position.set(0, 0.76, -4.75);
  g.add(tailGlow);
  lights.tailGlow = tailGlow;

  return lights;
}

/**
 * Loads tata_2515.glb and upgrades it into a High-Quality, Game-Ready Tata 2515 Truck Rig.
 */
export function loadHighQualityTata2515(assetUrl = './assets/tata_2515.glb') {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      assetUrl,
      (gltf) => {
        const root = new THREE.Group();
        root.name = 'Tata_2515_HighQuality';

        // Shared High-Quality PBR Materials
        const cabPaint = new THREE.MeshPhysicalMaterial({
          name: 'Tata_Cab_Paint',
          color: 0xb91c1c, // Iconic Bangladeshi Highway Crimson Red (customizable!)
          metalness: 0.35,
          roughness: 0.22,
          clearcoat: 1.0,
          clearcoatRoughness: 0.08,
          envMapIntensity: 1.55,
        });
        const trailerPaint = new THREE.MeshStandardMaterial({
          name: 'Tata_Trailer_Body',
          color: 0x1e3a8a, // Classic Deep Highway Blue + Steel Frame
          metalness: 0.28,
          roughness: 0.44,
          envMapIntensity: 1.15,
        });
        const chrome = new THREE.MeshPhysicalMaterial({
          name: 'Tata_Mirror_Chrome_Steel',
          color: 0xf1f5f9,
          metalness: 0.96,
          roughness: 0.08,
          clearcoat: 1.0,
          clearcoatRoughness: 0.04,
          envMapIntensity: 2.1,
        });
        const brushedSteel = new THREE.MeshStandardMaterial({
          name: 'Tata_Brushed_Steel',
          color: 0xcbd5e1,
          metalness: 0.86,
          roughness: 0.26,
          envMapIntensity: 1.65,
        });
        const darkMetal = new THREE.MeshStandardMaterial({
          name: 'Tata_Chassis_DarkMetal',
          color: 0x1e242c,
          metalness: 0.68,
          roughness: 0.42,
          envMapIntensity: 1.1,
        });
        const glass = new THREE.MeshPhysicalMaterial({
          name: 'Tata_Cab_Glass',
          color: 0x93c5fd,
          transparent: true,
          opacity: 0.32,
          roughness: 0.06,
          metalness: 0.12,
          clearcoat: 1.0,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        const mirror = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          metalness: 1.0,
          roughness: 0.02,
          envMapIntensity: 2.4,
        });
        const dashMat = new THREE.MeshStandardMaterial({ color: 0x1e2530, roughness: 0.68, metalness: 0.12 });
        const interiorTrim = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.62, metalness: 0.08 });
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x14171c, roughness: 0.92, metalness: 0.05 });
        const seatLeather = new THREE.MeshStandardMaterial({ color: 0x5c2d16, roughness: 0.56, metalness: 0.06 });
        const seatAccent = new THREE.MeshStandardMaterial({ color: 0x7c3f1d, roughness: 0.60, metalness: 0.05 });
        const roofLiner = new THREE.MeshStandardMaterial({ color: 0xd6d3cb, roughness: 0.88, metalness: 0.02 });
        const domeLight = new THREE.MeshStandardMaterial({ color: 0xfff8dc, emissive: 0xffe08a, emissiveIntensity: 1.8 });
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
          emissive: 0x441111,
          emissiveIntensity: 0.35,
          roughness: 0.25,
          metalness: 0.25,
        });
        const tataBadge = new THREE.MeshStandardMaterial({
          map: makeTataBadgeTexture(),
          roughness: 0.22,
          metalness: 0.65,
        });
        const tireMat = new THREE.MeshStandardMaterial({
          map: makeTruckTireTexture(),
          color: 0x22262d,
          roughness: 0.84,
          metalness: 0.06,
        });
        const hubMat = new THREE.MeshStandardMaterial({
          color: 0x991b1b,
          metalness: 0.62,
          roughness: 0.28,
        });

        const mats = {
          cabPaint, trailerPaint, chrome, brushedSteel, darkMetal, glass, mirror,
          dashMat, interiorTrim, floorMat, seatLeather, seatAccent, roofLiner,
          domeLight, gaugeMat, reflectiveTape, tataBadge, tireMat, hubMat,
        };

        // Extract raw meshes from Node 1 (skipping Sketchfab tilted root matrix) and align cleanly to +Z Front, +Y Up
        const rawHolder = new THREE.Group();
        rawHolder.name = 'Tata_Base_Shell';
        // Raw: (x, y, z) -> World: (x * S, z * S, -y * S) achieved by rotation.x = -Math.PI/2 + scale S
        rawHolder.rotation.x = -Math.PI / 2;
        rawHolder.scale.setScalar(TRUCK_SCALE);

        const innerNode = gltf.scene.getObjectByName('TATA2515.obj.cleaner.materialmerger.gles') || gltf.scene;
        const meshesToMove = [];
        innerNode.traverse((ch) => {
          if (ch.isMesh) meshesToMove.push(ch);
        });

        for (const m of meshesToMove) {
          const matName = m.material?.name || '';
          // Hide old merged low-detail wheels (replaced with 10 realistic spinning wheels!)
          if (matName === 'WHEEL' || m.name === 'Object_6') {
            continue;
          }
          const clonedGeo = m.geometry.clone();
          // Cut open side door frames on cab shell & cab glass so doors open into the real interior!
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

        // 1) Openable Left & Right Cab Doors (Hinged at Front A-Pillar)
        const doorFL = buildCabDoor(1, mats);
        const doorFR = buildCabDoor(-1, mats);
        root.add(doorFL, doorFR);

        // 2) High-Detail Driver Cabin Interior
        const { steeringPivot, domePoint } = buildTruckInterior(root, mats);

        // 3) Exterior Chrome/Steel Detailing, Trailer Upgrades & Full Lighting System
        const lights = buildExteriorSteelAndLights(root, mats);

        // 4) 10 Realistic Spinning Truck Wheels (2 Steerable Front + 8 Dual Tandem Rear!)
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

        // Front Left & Right (Steerable!)
        wheelNodes.flSteer.name = 'Wheel_FL_Steer';
        wheelNodes.flSteer.position.set(1.16, wheelRadius, 3.07);
        wheelNodes.fl = buildRealisticTruckWheel({ radius: wheelRadius, width: 0.27, isDual: false, outboardSign: 1, tireMat, chromeMat: chrome, darkSteelMat: darkMetal, hubMat });
        wheelNodes.fl.name = 'Wheel_FL';
        wheelNodes.flSteer.add(wheelNodes.fl);
        root.add(wheelNodes.flSteer);

        wheelNodes.frSteer.name = 'Wheel_FR_Steer';
        wheelNodes.frSteer.position.set(-1.16, wheelRadius, 3.07);
        wheelNodes.fr = buildRealisticTruckWheel({ radius: wheelRadius, width: 0.27, isDual: false, outboardSign: -1, tireMat, chromeMat: chrome, darkSteelMat: darkMetal, hubMat });
        wheelNodes.fr.name = 'Wheel_FR';
        wheelNodes.frSteer.add(wheelNodes.fr);
        root.add(wheelNodes.frSteer);

        // Rear Tandem Axle 1 (Dual Wheels — 4 tires)
        wheelNodes.rl1 = buildRealisticTruckWheel({ radius: wheelRadius, width: 0.26, isDual: true, outboardSign: 1, tireMat, chromeMat: chrome, darkSteelMat: darkMetal, hubMat });
        wheelNodes.rl1.name = 'Wheel_RL1';
        wheelNodes.rl1.position.set(1.16, wheelRadius, -1.06);
        root.add(wheelNodes.rl1);

        wheelNodes.rr1 = buildRealisticTruckWheel({ radius: wheelRadius, width: 0.26, isDual: true, outboardSign: -1, tireMat, chromeMat: chrome, darkSteelMat: darkMetal, hubMat });
        wheelNodes.rr1.name = 'Wheel_RR1';
        wheelNodes.rr1.position.set(-1.16, wheelRadius, -1.06);
        root.add(wheelNodes.rr1);

        // Rear Tandem Axle 2 (Dual Wheels — 4 tires)
        wheelNodes.rl2 = buildRealisticTruckWheel({ radius: wheelRadius, width: 0.26, isDual: true, outboardSign: 1, tireMat, chromeMat: chrome, darkSteelMat: darkMetal, hubMat });
        wheelNodes.rl2.name = 'Wheel_RL2';
        wheelNodes.rl2.position.set(1.16, wheelRadius, -2.43);
        root.add(wheelNodes.rl2);

        wheelNodes.rr2 = buildRealisticTruckWheel({ radius: wheelRadius, width: 0.26, isDual: true, outboardSign: -1, tireMat, chromeMat: chrome, darkSteelMat: darkMetal, hubMat });
        wheelNodes.rr2.name = 'Wheel_RR2';
        wheelNodes.rr2.position.set(-1.16, wheelRadius, -2.43);
        root.add(wheelNodes.rr2);

        // Rear Axle Diff Tubes
        for (const az of [-1.06, -2.43]) {
          const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 2.0, 12), darkMetal);
          axle.rotation.z = Math.PI / 2;
          axle.position.set(0, wheelRadius, az);
          root.add(axle);
          const diff = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), darkMetal);
          diff.position.set(0, wheelRadius, az);
          root.add(diff);
        }

        // Control API for Preview Studio & In-Game Integration
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
            const hlVal = headlights ? (highBeam ? 4.2 : 2.2) : 0.0;
            for (const m of lights.headlightMats) m.emissiveIntensity = hlVal;
            for (const m of lights.fogMats) m.emissiveIntensity = headlights ? 1.5 : 0.0;
            for (const m of lights.taillightMats) m.emissiveIntensity = headlights ? 1.8 : 0.25;
            for (const m of lights.markerMats) m.emissiveIntensity = headlights ? 1.8 : 0.2;
            for (const m of lights.brakeMats) m.emissiveIntensity = brake ? 4.2 : (headlights ? 0.6 : 0.0);
            for (const m of lights.reverseMats) m.emissiveIntensity = reverse ? 3.2 : 0.0;

            const leftActive = (indLeft || hazard) && blinkOn;
            const rightActive = (indRight || hazard) && blinkOn;
            for (const m of lights.indLeftMats) m.emissiveIntensity = leftActive ? 4.5 : 0.0;
            for (const m of lights.indRightMats) m.emissiveIntensity = rightActive ? 4.5 : 0.0;

            if (lights.headSpotL) lights.headSpotL.intensity = headlights ? (highBeam ? 8.5 : 4.2) : 0.0;
            if (lights.headSpotR) lights.headSpotR.intensity = headlights ? (highBeam ? 8.5 : 4.2) : 0.0;
            if (lights.tailGlow) lights.tailGlow.intensity = brake ? 2.2 : (headlights ? 0.8 : 0.0);
            domePoint.intensity = cabinLight ? 1.25 : 0.0;
            domeLight.emissiveIntensity = cabinLight ? 1.9 : 0.1;
          },
        };

        resolve(api);
      },
      undefined,
      reject,
    );
  });
}
