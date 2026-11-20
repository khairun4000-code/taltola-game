import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TALTOLA_HOUSE_OFFSET } from './khulna-geo.js';

const BMW_BODY_PAINT_MATS = ['Mesheszx1Mtl', 'Meshesbody151Mtl'];
const BMW_WHEEL_RIM_MATS = ['Meshesm8rim1Mtl'];
const BMW_TIRE_MATS = ['Meshesm8rim0011Mtl'];

const BMW_WHEEL_QUADRANTS = [
  { key: 'FL', isFront: true, side: 1, cx: 288.9585, cy: -159.0625, cz: -1.5731 },
  { key: 'FR', isFront: true, side: -1, cx: 282.4390, cy: -159.0625, cz: -1.5731 },
  { key: 'RL', isFront: false, side: 1, cx: 289.0730, cy: -170.8565, cz: -1.5335 },
  { key: 'RR', isFront: false, side: -1, cx: 282.3225, cy: -170.8565, cz: -1.5335 },
];

export const BMW_PAINT_PRESETS = [
  { name: 'Isle of Man Green', hex: '#0c4d26' },
  { name: 'Toronto Red', hex: '#b3121e' },
  { name: 'Portimao Blue', hex: '#143c8c' },
  { name: 'Sao Paulo Yellow', hex: '#d9c61e' },
  { name: 'Alpine White', hex: '#eef2f6' },
  { name: 'Jet Black', hex: '#16181c' },
];

export const ALPHARD_PAINT_PRESETS = [
  { name: 'Platinum White', hex: '#f2f5f8' },
  { name: 'Burning Black', hex: '#15171c' },
  { name: 'Precious Gold', hex: '#b89b6a' },
  { name: 'Dark Emerald', hex: '#12352c' },
  { name: 'Silver Metallic', hex: '#b6bcc4' },
  { name: 'Royal Red', hex: '#8a1622' },
];

export const COROLLA_PAINT_PRESETS = [
  { name: 'Super White', hex: '#f1f4f7' },
  { name: 'Classic Silver', hex: '#aeb5bd' },
  { name: 'Black Sand', hex: '#181a1f' },
  { name: 'Barcelona Red', hex: '#a81622' },
  { name: 'Blueprint Blue', hex: '#1b3d7a' },
  { name: 'Slate Gray', hex: '#4b535e' },
];

export const FORTUNER_PAINT_PRESETS = [
  { name: 'Attitude Black', hex: '#14171c' },
  { name: 'Platinum White', hex: '#f0f3f7' },
  { name: 'Silver Metallic', hex: '#b4bbc3' },
  { name: 'Avant-Garde Bronze', hex: '#594a3c' },
  { name: 'Super Red', hex: '#9c1722' },
  { name: 'Phantom Brown', hex: '#332822' },
];

export const HIACE_PAINT_PRESETS = [
  { name: 'Pearl White', hex: '#f4f6f9' },
  { name: 'Silver Metallic', hex: '#c2c8cf' },
  { name: 'Champagne Gold', hex: '#d6c7a9' },
  { name: 'Ocean Blue', hex: '#264c7d' },
  { name: 'Midnight Black', hex: '#22262e' },
  { name: 'Forest Green', hex: '#244a38' },
];

export const RICKSHAW_PAINT_PRESETS = [
  { name: 'Classic Art', hex: '#ffffff' },
  { name: 'Dhaka Red', hex: '#ffd6d6' },
  { name: 'Khulna Green', hex: '#d4ffe2' },
  { name: 'Golden Bangla', hex: '#fff0c4' },
  { name: 'Royal Blue', hex: '#d4e8ff' },
  { name: 'Sunset Rose', hex: '#ffe0f2' },
];

export const CAR_FLEET_CONFIGS = [
  {
    id: 'bmw_m3',
    name: 'BMW M3',
    badge: 'BMW M3 COMPETITION',
    assetUrl: './assets/bmw_m3.glb',
    targetLength: 4.35,
    width: 1.88,
    rotateY: 0,
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 0.35, 0.01, TALTOLA_HOUSE_OFFSET.z + 5.2],
    spawnHeading: 0.0,
    paintPresets: BMW_PAINT_PRESETS,
    maxSpeed: 26.5,
    boostMaxSpeed: 37.5,
    engineForce: 15.5,
    engineBaseFreq: 32,
    engineRangeFreq: 155,
    hornFreqs: [415, 520],
    camBack: 5.4,
    camHeight: 2.15,
    hoodHeight: 1.28,
    hoodForward: 0.65,
    isBMW: true,
  },
  {
    id: 'toyota_alphard',
    name: 'Toyota Alphard 2025',
    badge: 'TOYOTA ALPHARD 2025',
    assetUrl: './assets/toyota_alphard.glb',
    targetLength: 4.92,
    width: 1.92,
    rotateY: -Math.PI / 2, // Raw Alphard faces +X; rotate -90 deg Y so it faces +Z
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 0.35, 0.01, TALTOLA_HOUSE_OFFSET.z - 5.2],
    spawnHeading: 0.0,
    paintPresets: ALPHARD_PAINT_PRESETS,
    bodyPaintMats: ['C_089'],
    glassMats: ['C_ClearGlass', 'C_PV_Glass', 'C_IR_GreenGlass__1', 'C_SmokeGlass_GR003', 'C_SuriGlass'],
    tailMats: ['C_red_glass'],
    headlightMats: ['C_13TR01__headlight_3'],
    maxSpeed: 23.5,
    boostMaxSpeed: 32.0,
    engineForce: 13.5,
    engineBaseFreq: 28,
    engineRangeFreq: 120,
    hornFreqs: [370, 466],
    camBack: 5.9,
    camHeight: 2.48,
    hoodHeight: 1.56,
    hoodForward: 0.95,
    isBMW: false,
    shadowOnlyExterior: true,
  },
  {
    id: 'toyota_corolla',
    name: 'Toyota Corolla 2017',
    badge: 'TOYOTA COROLLA 2017',
    assetUrl: './assets/toyota_corolla.glb',
    targetLength: 4.55,
    width: 1.82,
    rotateY: 0, // Raw Corolla already faces +Z
    spawnPos: [-0.35, 0.01, 4.8],
    spawnHeading: 0.0,
    paintPresets: COROLLA_PAINT_PRESETS,
    bodyPaintMats: ['e180body'],
    glassMats: ['e180_glass', 'e180_glass_out'],
    tailMats: ['e180_tails', 'e180_RL', 'e180_tail'],
    headlightMats: ['e180_fog', 'e180_short', 'e180_long'],
    wheelNameRegex: /wheel|brakedisc/i,
    maxSpeed: 24.5,
    boostMaxSpeed: 33.5,
    engineForce: 14.2,
    engineBaseFreq: 36,
    engineRangeFreq: 140,
    hornFreqs: [440, 554],
    camBack: 5.5,
    camHeight: 2.15,
    hoodHeight: 1.28,
    hoodForward: 0.72,
    isBMW: false,
  },
  {
    id: 'toyota_fortuner',
    name: 'Toyota Fortuner 2021',
    badge: 'TOYOTA FORTUNER 2021',
    assetUrl: './assets/toyota_fortuner.glb',
    targetLength: 4.80,
    width: 1.90,
    rotateY: 0, // Raw Fortuner already faces +Z
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 0.35, 0.01, TALTOLA_HOUSE_OFFSET.z + 11.4],
    spawnHeading: 0.0,
    paintPresets: FORTUNER_PAINT_PRESETS,
    bodyPaintMats: ['carpaint'],
    glassMats: ['windows_glass', 'r_glass'],
    tailMats: ['r_tailight', 'ind_tailighjt'],
    headlightMats: ['indicator_signal', 'indicator_arrow'],
    wheelNameRegex: /^WHEEL_(LF|RF|LR|RR)$/i,
    maxSpeed: 24.0,
    boostMaxSpeed: 33.0,
    engineForce: 14.0,
    engineBaseFreq: 26,
    engineRangeFreq: 115,
    hornFreqs: [360, 450],
    camBack: 5.8,
    camHeight: 2.42,
    hoodHeight: 1.54,
    hoodForward: 0.85,
    isBMW: false,
    shadowOnlyExterior: true,
  },
  {
    id: 'toyota_hiace',
    name: 'Toyota HiAce 2005',
    badge: 'TOYOTA HIACE 2005',
    assetUrl: './assets/toyota_hiace.glb',
    targetLength: 4.85,
    width: 1.88,
    rotateY: -Math.PI / 2, // Raw HiAce grill faces +X; rotate -90 deg Y so it faces +Z
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 0.35, 0.01, TALTOLA_HOUSE_OFFSET.z - 11.6],
    spawnHeading: 0.0,
    paintPresets: HIACE_PAINT_PRESETS,
    bodyPaintMats: ['paint'],
    glassMats: ['glass', 'glass2'],
    tailMats: [],
    headlightMats: [],
    wheelNameRegex: /hiace_wheel/i,
    maxSpeed: 21.5,
    boostMaxSpeed: 29.0,
    engineForce: 12.2,
    engineBaseFreq: 30,
    engineRangeFreq: 110,
    hornFreqs: [390, 490],
    camBack: 6.1,
    camHeight: 2.55,
    hoodHeight: 1.58,
    hoodForward: 1.45,
    isBMW: false,
  },
  {
    id: 'bangladeshi_rickshaw_taltola',
    name: 'Bangladeshi Rickshaw',
    badge: 'BANGLADESHI RICKSHAW',
    assetUrl: './assets/bangladeshi_rickshaw.glb',
    targetLength: 2.44,
    width: 1.04,
    rotateY: 0,
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 1.15, 0.01, TALTOLA_HOUSE_OFFSET.z + 0.6],
    spawnHeading: 0.0,
    paintPresets: RICKSHAW_PAINT_PRESETS,
    maxSpeed: 7.8,
    boostMaxSpeed: 11.8,
    engineForce: 9.2,
    camBack: 3.45,
    camHeight: 2.02,
    hoodHeight: 1.68,
    hoodForward: 0.14,
    isBMW: false,
    isRickshaw: true,
  },
  {
    id: 'bangladeshi_rickshaw_haji',
    name: 'Bangladeshi Rickshaw',
    badge: 'BANGLADESHI RICKSHAW',
    assetUrl: './assets/bangladeshi_rickshaw.glb',
    targetLength: 2.44,
    width: 1.04,
    rotateY: 0,
    spawnPos: [1.05, 0.01, 1.8],
    spawnHeading: 0.0,
    paintPresets: RICKSHAW_PAINT_PRESETS,
    maxSpeed: 7.8,
    boostMaxSpeed: 11.8,
    engineForce: 9.2,
    camBack: 3.45,
    camHeight: 2.02,
    hoodHeight: 1.68,
    hoodForward: 0.14,
    isBMW: false,
    isRickshaw: true,
  },
];

function createUnderbodyContactShadow(width, length) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(64, 128, 12, 64, 128, 118);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  grad.addColorStop(0.66, 'rgba(0, 0, 0, 0.62)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 256);

  const tex = new THREE.CanvasTexture(canvas);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 1.24, length * 1.12),
    new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
  );
  plane.rotation.x = -Math.PI * 0.5;
  plane.position.y = 0.025;
  return plane;
}

function splitMergedWheelMeshByQuadrant(mesh, q) {
  const srcGeom = mesh.geometry;
  const posAttr = srcGeom.attributes.position;
  const normAttr = srcGeom.attributes.normal;
  const uvAttr = srcGeom.attributes.uv;
  const indexAttr = srcGeom.index;

  const newIndices = [];
  const vertexMap = new Map();
  const newPositions = [];
  const newNormals = [];
  const newUVs = [];

  function addVertex(oldIdx) {
    if (vertexMap.has(oldIdx)) return vertexMap.get(oldIdx);
    const newIdx = newPositions.length / 3;
    vertexMap.set(oldIdx, newIdx);

    newPositions.push(
      posAttr.getX(oldIdx) - q.cx,
      posAttr.getY(oldIdx) - q.cy,
      posAttr.getZ(oldIdx) - q.cz,
    );
    if (normAttr) {
      newNormals.push(
        normAttr.getX(oldIdx),
        normAttr.getY(oldIdx),
        normAttr.getZ(oldIdx),
      );
    }
    if (uvAttr) {
      newUVs.push(uvAttr.getX(oldIdx), uvAttr.getY(oldIdx));
    }
    return newIdx;
  }

  const triCount = indexAttr ? indexAttr.count / 3 : posAttr.count / 3;
  for (let t = 0; t < triCount; t++) {
    const i0 = indexAttr ? indexAttr.getX(t * 3) : t * 3;
    const i1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;

    const vx = posAttr.getX(i0);
    const vy = posAttr.getY(i0);
    const isLeft = vx > 285.7;
    const isFront = vy > -165.0;

    if (isLeft === (q.side === 1) && isFront === q.isFront) {
      newIndices.push(addVertex(i0), addVertex(i1), addVertex(i2));
    }
  }

  const subGeom = new THREE.BufferGeometry();
  subGeom.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
  if (newNormals.length > 0) {
    subGeom.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3));
  } else {
    subGeom.computeVertexNormals();
  }
  if (newUVs.length > 0) {
    subGeom.setAttribute('uv', new THREE.Float32BufferAttribute(newUVs, 2));
  }
  subGeom.setIndex(newIndices);

  const subMesh = new THREE.Mesh(subGeom, mesh.material);
  subMesh.castShadow = true;
  subMesh.receiveShadow = true;
  return subMesh;
}

function createBodyMaterial(source, colorHex) {
  return new THREE.MeshPhysicalMaterial({
    name: source.name,
    color: new THREE.Color(colorHex),
    map: source.map || null,
    normalMap: source.normalMap || null,
    normalScale: source.normalScale ? source.normalScale.clone() : new THREE.Vector2(1, 1),
    aoMap: source.aoMap || null,
    side: source.side,
    transparent: source.transparent,
    opacity: source.opacity,
    alphaTest: source.alphaTest,
    metalness: 0.72,
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    ior: 1.52,
    reflectivity: 1.0,
    envMapIntensity: 1.65,
  });
}

function createWheelMaterial(source, colorHex = '#d8ebff') {
  return new THREE.MeshPhysicalMaterial({
    name: source.name,
    color: new THREE.Color(colorHex),
    map: source.map || null,
    normalMap: source.normalMap || null,
    side: source.side,
    metalness: 0.90,
    roughness: 0.14,
    clearcoat: 0.85,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.75,
  });
}

/**
 * Automatically groups named wheel meshes (e.g. Toyota Corolla e180_wheel* & e180_brakedisc_*)
 * into 4 steering/spinning pivots (FL, FR, RL, RR) in normalized car space (+Z forward, +Y up).
 */
function rigGenericCarWheels(orientedWrapper, wheelRegex) {
  if (!wheelRegex) return [];
  orientedWrapper.updateMatrixWorld(true);

  const wheelMeshes = [];
  orientedWrapper.traverse((child) => {
    if (!child.isMesh) return;
    let cur = child;
    let matched = false;
    while (cur && cur !== orientedWrapper) {
      if (wheelRegex.test(cur.name || '')) {
        matched = true;
        break;
      }
      cur = cur.parent;
    }
    if (matched) wheelMeshes.push(child);
  });

  if (wheelMeshes.length === 0) return [];

  const buckets = {
    FL: { isFront: true, meshes: [], box: new THREE.Box3() },
    FR: { isFront: true, meshes: [], box: new THREE.Box3() },
    RL: { isFront: false, meshes: [], box: new THREE.Box3() },
    RR: { isFront: false, meshes: [], box: new THREE.Box3() },
  };

  const tmpBox = new THREE.Box3();
  const tmpCenter = new THREE.Vector3();
  const invWrapper = new THREE.Matrix4().copy(orientedWrapper.matrixWorld).invert();

  for (const mesh of wheelMeshes) {
    tmpBox.setFromObject(mesh);
    if (tmpBox.isEmpty()) continue;
    tmpBox.applyMatrix4(invWrapper);
    tmpBox.getCenter(tmpCenter);
    // Ignore spare wheel or center hub meshes that sit on x ≈ 0
    if (Math.abs(tmpCenter.x) < 0.35 || tmpCenter.y > 0.85) continue;

    const isFront = tmpCenter.z >= 0;
    const isLeft = tmpCenter.x >= 0;
    const key = (isFront ? 'F' : 'R') + (isLeft ? 'L' : 'R');
    buckets[key].meshes.push(mesh);
    buckets[key].box.union(tmpBox);
  }

  const builtWheels = [];
  for (const b of Object.values(buckets)) {
    if (b.meshes.length === 0) continue;
    const center = b.box.getCenter(new THREE.Vector3());

    const steerPivot = new THREE.Group();
    steerPivot.position.copy(center);
    orientedWrapper.add(steerPivot);

    const spinPivot = new THREE.Group();
    steerPivot.add(spinPivot);
    orientedWrapper.updateMatrixWorld(true);

    for (const mesh of b.meshes) {
      spinPivot.attach(mesh);
    }

    builtWheels.push({
      wheelRoot: steerPivot,
      spinGroup: spinPivot,
      isFront: b.isFront,
      steerAxis: 'y',
      spinAxis: 'x',
    });
  }

  return builtWheels;
}

/**
 * Creates a drivable 3D car (BMW M3, Toyota Alphard 2025, Toyota Corolla 2017, etc.)
 * with 4-wheel rigging, clearcoat reflections, engine/horn audio, and Khulna street collisions.
 */
export function createDrivableCar(scene, manager, config) {
  const paintPresets = config.paintPresets || BMW_PAINT_PRESETS;
  const root = new THREE.Group();
  root.name = `DrivableCar_${config.id}`;
  scene.add(root);

  const bodyTiltGroup = new THREE.Group();
  root.add(bodyTiltGroup);

  const contactShadow = createUnderbodyContactShadow(config.width || 1.88, config.targetLength || 4.4);
  root.add(contactShadow);

  const state = {
    id: config.id,
    name: config.name,
    badge: config.badge || config.name.toUpperCase(),
    loaded: false,
    driving: false,
    cameraMode: 'chase', // 'chase' | 'hood' | 'front'
    pos: new THREE.Vector3(...(config.spawnPos || [-0.35, 0.01, 4.8])),
    heading: config.spawnHeading ?? 0.0,
    speed: 0,
    lateralVel: 0,
    steerAngle: 0,
    wheelSpin: 0,
    pedalPhase: 0,
    rpm: 920,
    gear: 'N',
    pitch: 0,
    roll: 0,
    paintIndex: 0,
    paintName: paintPresets[0].name,
    isRickshaw: Boolean(config.isRickshaw),
    rideSeat: 'driver',
    halfWidth: (config.width || 1.88) * 0.48,
    halfLength: (config.targetLength || 4.4) * 0.48,
    camBack: config.camBack || 5.4,
    camHeight: config.camHeight || 2.15,
    hoodHeight: config.hoodHeight || 1.28,
    hoodForward: config.hoodForward || 0.65,
  };

  let riggedWheels = [];
  let rickshawParts = null;
  let driverDoorPivot = null;
  let driverDoorOpen = 0;
  let paintMaterials = [];
  let glossyMaterials = [];
  let carShadowMeshes = [];
  let tailMats = [];
  let drlMats = [];
  let currentQuality = 'high';

  // Web Audio Engine + Horn
  let audioCtx = null;
  let osc1 = null;
  let osc2 = null;
  let engineGain = null;

  function ensureAudio() {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      audioCtx = new AudioContextClass();
      osc1 = audioCtx.createOscillator();
      osc2 = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      engineGain = audioCtx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.value = 52;
      osc2.frequency.value = 78;

      filter.type = 'lowpass';
      filter.frequency.value = 320;
      engineGain.gain.value = 0.0;

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(engineGain);
      engineGain.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
    } catch {}
  }

  function updateEngineAudio(active, rpm, throttle) {
    if (config.isRickshaw) return;
    if (!audioCtx || !engineGain || !osc1 || !osc2) return;
    const now = audioCtx.currentTime;
    if (!active) {
      engineGain.gain.setTargetAtTime(0.0, now, 0.08);
      return;
    }
    const baseFreq = (config.engineBaseFreq || 32) + (rpm / 7500) * (config.engineRangeFreq || 150);
    osc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
    osc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.04);
    const targetGain = 0.030 + throttle * 0.045;
    engineGain.gain.setTargetAtTime(targetGain, now, 0.06);
  }

  function playHorn() {
    ensureAudio();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      if (config.isRickshaw) {
        for (const strikeOffset of [0, 0.14]) {
          const t0 = now + strikeOffset;
          const g = audioCtx.createGain();
          g.gain.setValueAtTime(0.001, t0);
          g.gain.exponentialRampToValueAtTime(0.13, t0 + 0.008);
          g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.32);
          g.connect(audioCtx.destination);
          for (const freq of [2680, 5360, 3920]) {
            const o = audioCtx.createOscillator();
            o.type = 'sine';
            o.frequency.value = freq;
            o.connect(g);
            o.start(t0);
            o.stop(t0 + 0.34);
          }
        }
        return;
      }
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.11, now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      g.connect(audioCtx.destination);

      for (const freq of (config.hornFreqs || [415, 520])) {
        const o = audioCtx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = freq;
        const filt = audioCtx.createBiquadFilter();
        filt.type = 'bandpass';
        filt.frequency.value = 950;
        o.connect(filt);
        filt.connect(g);
        o.start(now);
        o.stop(now + 0.36);
      }
    } catch {}
  }

  function playDoorSound(closing = false) {
    ensureAudio();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const g = audioCtx.createGain();
      const o = audioCtx.createOscillator();
      if (closing) {
        o.type = 'triangle';
        o.frequency.setValueAtTime(145, now);
        o.frequency.exponentialRampToValueAtTime(42, now + 0.14);
        g.gain.setValueAtTime(0.001, now);
        g.gain.exponentialRampToValueAtTime(0.22, now + 0.012);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(now);
        o.stop(now + 0.2);
      } else {
        o.type = 'square';
        o.frequency.setValueAtTime(920, now);
        o.frequency.exponentialRampToValueAtTime(340, now + 0.055);
        g.gain.setValueAtTime(0.001, now);
        g.gain.exponentialRampToValueAtTime(0.09, now + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(now);
        o.stop(now + 0.08);
      }
    } catch {}
  }

  function playSeatbeltSound() {
    ensureAudio();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      for (const [offset, freq] of [[0, 2150], [0.055, 3100]]) {
        const t0 = now + offset;
        const g = audioCtx.createGain();
        const o = audioCtx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(0.001, t0);
        g.gain.exponentialRampToValueAtTime(0.11, t0 + 0.004);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.06);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(t0);
        o.stop(t0 + 0.07);
      }
    } catch {}
  }

  // Load GLB asynchronously so startup stays fast (do not pass LoadingManager for optional extra cars so loading screen doesn't hang on 84MB Alphard)
  const loader = new GLTFLoader(config.isBMW ? manager : undefined);
  loader.load(
    config.assetUrl,
    (gltf) => {
      const model = gltf.scene;
      model.updateMatrixWorld(true);

      const orientedWrapper = new THREE.Group();
      orientedWrapper.add(model);

      if (config.rotateY) {
        model.rotation.y = config.rotateY;
        model.updateMatrixWorld(true);
      }

      const bounds = new THREE.Box3().setFromObject(orientedWrapper);
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 0.001);
      const scale = (config.targetLength || 4.35) / maxDim;

      model.scale.setScalar(scale);
      model.position.set(
        -center.x * scale,
        -bounds.min.y * scale,
        -center.z * scale,
      );
      orientedWrapper.updateMatrixWorld(true);

      const paintColorHex = paintPresets[state.paintIndex].hex;

      if (config.isBMW) {
        let caliperMeshObj = null;
        let rimMeshObj = null;
        let tireMeshObj = null;
        let wheelsParentNode = null;

        model.traverse((child) => {
          if (child.name === 'WHeelsandrims_2') {
            wheelsParentNode = child;
          }
          if (!child.isMesh || !child.material) return;

          const isArray = Array.isArray(child.material);
          const srcMats = isArray ? child.material : [child.material];

          const firstName = srcMats[0]?.name || '';
          const shouldCast = firstName !== 'Meshesheadlight51Mtl' && firstName !== 'Mesheswindows1Mtl';
          child.castShadow = shouldCast && currentQuality !== 'low';
          child.receiveShadow = true;
          if (shouldCast) carShadowMeshes.push(child);

          const outMats = srcMats.map((mat) => {
            const mName = mat.name || '';

            if (BMW_BODY_PAINT_MATS.includes(mName)) {
              const pMat = createBodyMaterial(mat, paintColorHex);
              paintMaterials.push(pMat);
              glossyMaterials.push(pMat);
              return pMat;
            }
            if (mName === 'Mesheslivery1Mtl') {
              const lMat = createBodyMaterial(mat, paintColorHex);
              lMat.map = null;
              paintMaterials.push(lMat);
              glossyMaterials.push(lMat);
              return lMat;
            }
            if (mName === 'Meshesheadlight51Mtl') {
              const hlMat = new THREE.MeshPhysicalMaterial({
                name: mName,
                color: new THREE.Color('#10151e'),
                transparent: true,
                opacity: 0.18,
                depthWrite: false,
                roughness: 0.03,
                metalness: 0.15,
                clearcoat: 1.0,
                envMapIntensity: 1.6,
              });
              glossyMaterials.push(hlMat);
              return hlMat;
            }
            if (mName === 'Meshesled111Mtl') {
              const dMat = new THREE.MeshStandardMaterial({
                name: mName,
                color: new THREE.Color('#ffee22'),
                emissive: new THREE.Color('#ffdd00'),
                emissiveIntensity: 4.5,
                roughness: 0.08,
              });
              drlMats.push(dMat);
              return dMat;
            }
            if (mName === 'Mesheslight51Mtl') {
              const pLightMat = mat.clone();
              pLightMat.emissive = new THREE.Color('#d8eeff');
              pLightMat.emissiveIntensity = 1.4;
              pLightMat.envMapIntensity = 1.4;
              return pLightMat;
            }
            if (mName === 'Meshesredlight1Mtl' || mName === 'Meshestail71Mtl') {
              const tMat = new THREE.MeshStandardMaterial({
                name: mName,
                color: new THREE.Color('#ff1128'),
                emissive: new THREE.Color('#ff0820'),
                emissiveIntensity: 3.4,
                roughness: 0.10,
              });
              if (mName === 'Meshesredlight1Mtl') tailMats.push(tMat);
              return tMat;
            }
            if (mName === 'Meshesled11Mtl') {
              const ledMat = mat.clone();
              ledMat.emissive = new THREE.Color('#ffffff');
              ledMat.emissiveIntensity = 1.8;
              return ledMat;
            }
            if (mName === 'Mesheswindows1Mtl') {
              const winMat = new THREE.MeshPhysicalMaterial({
                name: mName,
                color: new THREE.Color('#0a1524'),
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.48,
                depthWrite: false,
                metalness: 0.45,
                roughness: 0.06,
                clearcoat: 1.0,
                clearcoatRoughness: 0.04,
                reflectivity: 1.0,
                envMapIntensity: 1.8,
              });
              glossyMaterials.push(winMat);
              return winMat;
            }
            if (BMW_WHEEL_RIM_MATS.includes(mName)) {
              const rMat = createWheelMaterial(mat, '#d8ebff');
              glossyMaterials.push(rMat);
              return rMat;
            }
            if (BMW_TIRE_MATS.includes(mName)) {
              return new THREE.MeshStandardMaterial({
                name: mName,
                color: new THREE.Color('#1d2025'),
                map: mat.map || null,
                normalMap: mat.normalMap || null,
                roughness: 0.76,
                metalness: 0.06,
                envMapIntensity: 0.6,
                side: mat.side,
              });
            }
            if (mName === 'Caliper1Mtl') {
              const cMat = mat.clone();
              cMat.color.set('#087fd7');
              cMat.metalness = 0.42;
              cMat.roughness = 0.24;
              cMat.envMapIntensity = 1.1;
              return cMat;
            }
            if (
              mName === 'Meshesblack151Mtl'
              || mName === 'Meshesff41Mtl'
              || mName === 'Meshespillars1Mtl'
              || mName === 'Meshesblack161Mtl'
            ) {
              const trimMat = new THREE.MeshPhysicalMaterial({
                name: mName,
                color: mName === 'Meshespillars1Mtl' ? new THREE.Color('#15181d') : new THREE.Color('#eef2f6'),
                map: mat.map || null,
                roughness: 0.18,
                metalness: 0.50,
                clearcoat: 0.9,
                clearcoatRoughness: 0.10,
                envMapIntensity: 1.4,
                side: mat.side,
              });
              glossyMaterials.push(trimMat);
              return trimMat;
            }

            const cloned = mat.clone();
            cloned.envMapIntensity = 1.15;
            return cloned;
          });

          if (!child.geometry.attributes.normal) {
            child.geometry.computeVertexNormals();
          }
          child.material = isArray ? outMats : outMats[0];

          const finalMatName = (Array.isArray(child.material) ? child.material[0].name : child.material.name) || '';
          if (finalMatName === 'Caliper1Mtl') caliperMeshObj = child;
          if (finalMatName === 'Meshesm8rim1Mtl') rimMeshObj = child;
          if (finalMatName === 'Meshesm8rim0011Mtl') tireMeshObj = child;
        });

        if (wheelsParentNode && rimMeshObj && tireMeshObj) {
          const builtWheels = [];
          for (const q of BMW_WHEEL_QUADRANTS) {
            const steerPivot = new THREE.Group();
            steerPivot.position.set(q.cx, q.cy, q.cz);
            wheelsParentNode.add(steerPivot);

            if (caliperMeshObj) {
              steerPivot.add(splitMergedWheelMeshByQuadrant(caliperMeshObj, q));
            }

            const spinPivot = new THREE.Group();
            steerPivot.add(spinPivot);
            const subRim = splitMergedWheelMeshByQuadrant(rimMeshObj, q);
            const subTire = splitMergedWheelMeshByQuadrant(tireMeshObj, q);
            subRim.castShadow = currentQuality !== 'low';
            subTire.castShadow = currentQuality !== 'low';
            carShadowMeshes.push(subRim, subTire);
            spinPivot.add(subRim);
            spinPivot.add(subTire);

            builtWheels.push({
              wheelRoot: steerPivot,
              spinGroup: spinPivot,
              isFront: q.isFront,
              steerAxis: 'z',
              spinAxis: 'x',
            });
          }

          if (caliperMeshObj) caliperMeshObj.visible = false;
          rimMeshObj.visible = false;
          tireMeshObj.visible = false;
          riggedWheels = builtWheels;
        }
      } else {
        // Generic high-detail Sketchfab car setup (Toyota Alphard 2025, Toyota Corolla 2017, etc.)
        const bodySet = new Set(config.bodyPaintMats || []);
        const glassSet = new Set(config.glassMats || []);
        const tailSet = new Set(config.tailMats || []);
        const hlSet = new Set(config.headlightMats || []);
        const clonedMatCache = new Map();

        model.traverse((child) => {
          if (!child.isMesh || !child.material) return;
          if (!child.geometry.attributes.normal) {
            child.geometry.computeVertexNormals();
          }

          const isArray = Array.isArray(child.material);
          const srcMats = isArray ? child.material : [child.material];
          const firstName = srcMats[0]?.name || '';

          const isGlass = glassSet.has(firstName);
          const isBody = bodySet.has(firstName);
          const shouldCast = !isGlass && (!config.shadowOnlyExterior || isBody || /chrome|rim|tire|wheel|C_11CR29/i.test(firstName));

          child.castShadow = shouldCast && currentQuality !== 'low';
          child.receiveShadow = !isGlass;
          if (shouldCast) carShadowMeshes.push(child);

          const outMats = srcMats.map((mat) => {
            if (clonedMatCache.has(mat)) return clonedMatCache.get(mat);
            const mName = mat.name || '';
            let out;

            if (bodySet.has(mName)) {
              out = createBodyMaterial(mat, paintColorHex);
              paintMaterials.push(out);
              glossyMaterials.push(out);
            } else if (glassSet.has(mName)) {
              out = new THREE.MeshPhysicalMaterial({
                name: mName,
                color: new THREE.Color('#0c1724'),
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.45,
                depthWrite: false,
                metalness: 0.35,
                roughness: 0.06,
                clearcoat: 1.0,
                clearcoatRoughness: 0.04,
                reflectivity: 1.0,
                envMapIntensity: 1.7,
              });
              glossyMaterials.push(out);
            } else if (tailSet.has(mName)) {
              out = mat.clone();
              out.color = new THREE.Color('#d61424');
              out.emissive = new THREE.Color('#ff1228');
              out.emissiveIntensity = 1.8;
              tailMats.push(out);
            } else if (hlSet.has(mName)) {
              out = mat.clone();
              out.emissive = new THREE.Color('#eef6ff');
              out.emissiveIntensity = 1.6;
              drlMats.push(out);
            } else {
              out = mat.clone();
              if ('envMapIntensity' in out) {
                out.envMapIntensity = /chrome|cr|rim|mirror/i.test(mName) ? 1.65 : 1.05;
              }
            }

            clonedMatCache.set(mat, out);
            return out;
          });

          child.material = isArray ? outMats : outMats[0];
        });

        if (config.isRickshaw) {
          model.traverse((child) => {
            if (!child.isMesh || !child.material) return;
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            for (const mat of mats) {
              const mn = (mat.name || '').toLowerCase();
              if (mat.map) {
                mat.map.anisotropy = 8;
                mat.map.needsUpdate = true;
              }
              if (/chrome|spoke|aluminum|footwell/.test(mn)) {
                mat.metalness = Math.max(mat.metalness ?? 0.5, 0.88);
                mat.roughness = Math.min(mat.roughness ?? 0.5, 0.18);
                if ('envMapIntensity' in mat) mat.envMapIntensity = 1.9;
                glossyMaterials.push(mat);
              } else if (/hood_top|hood_side|hood_back|body_/.test(mn)) {
                mat.roughness = Math.min(mat.roughness ?? 0.6, 0.34);
                if ('envMapIntensity' in mat) mat.envMapIntensity = 1.35;
                paintMaterials.push(mat);
                glossyMaterials.push(mat);
              } else if (/paint_|frame_black/.test(mn)) {
                mat.roughness = Math.min(mat.roughness ?? 0.5, 0.28);
                mat.metalness = Math.max(mat.metalness ?? 0.2, 0.35);
                if ('envMapIntensity' in mat) mat.envMapIntensity = 1.45;
                glossyMaterials.push(mat);
              }
            }
          });

          const steering = model.getObjectByName('Steering_Assembly');
          const wheelFront = model.getObjectByName('Wheel_Front');
          const wheelRearL = model.getObjectByName('Wheel_Rear_L');
          const wheelRearR = model.getObjectByName('Wheel_Rear_R');
          const crank = model.getObjectByName('Crank_Assembly');
          const pedalL = model.getObjectByName('Pedal_L');
          const pedalR = model.getObjectByName('Pedal_R');
          let gripAnchorL = null;
          let gripAnchorR = null;
          if (steering) {
            gripAnchorL = new THREE.Object3D();
            gripAnchorL.position.set(0.28, 0.24, -0.17);
            steering.add(gripAnchorL);
            gripAnchorR = new THREE.Object3D();
            gripAnchorR.position.set(-0.28, 0.24, -0.17);
            steering.add(gripAnchorR);
          }
          const saddleAnchor = new THREE.Object3D();
          saddleAnchor.position.set(0, 1.03, -0.02);
          model.add(saddleAnchor);
          const passengerAnchor = new THREE.Object3D();
          passengerAnchor.position.set(0, 0.72, -0.62);
          model.add(passengerAnchor);
          const pedalFootL = new THREE.Object3D();
          pedalFootL.position.set(0.055, 0.02, 0.0);
          if (pedalL) pedalL.add(pedalFootL);
          const pedalFootR = new THREE.Object3D();
          pedalFootR.position.set(-0.055, 0.02, 0.0);
          if (pedalR) pedalR.add(pedalFootR);
          rickshawParts = {
            steering,
            steerRestQ: steering ? steering.quaternion.clone() : null,
            wheelFront,
            wheelRearL,
            wheelRearR,
            crank,
            pedalL,
            pedalR,
            gripAnchorL,
            gripAnchorR,
            saddleAnchor,
            passengerAnchor,
            pedalFootL,
            pedalFootR,
          };
        } else {
          if (config.wheelNameRegex) {
            riggedWheels = rigGenericCarWheels(orientedWrapper, config.wheelNameRegex);
          }
          const doorParts = [];
          orientedWrapper.traverse((ch) => {
            if (ch.name && /door_FL|doorglass_FL/i.test(ch.name)) {
              doorParts.push(ch);
            }
          });
          if (doorParts.length > 0) {
            orientedWrapper.updateMatrixWorld(true);
            const doorBox = new THREE.Box3();
            const invW = new THREE.Matrix4().copy(orientedWrapper.matrixWorld).invert();
            const tmpB = new THREE.Box3();
            for (const dp of doorParts) {
              tmpB.setFromObject(dp);
              if (!tmpB.isEmpty()) {
                tmpB.applyMatrix4(invW);
                doorBox.union(tmpB);
              }
            }
            if (!doorBox.isEmpty()) {
              const hingePivot = new THREE.Group();
              hingePivot.name = 'DriverDoorHinge';
              hingePivot.position.set(doorBox.max.x, (doorBox.min.y + doorBox.max.y) * 0.5, doorBox.max.z);
              orientedWrapper.add(hingePivot);
              orientedWrapper.updateMatrixWorld(true);
              for (const dp of doorParts) {
                hingePivot.attach(dp);
              }
              driverDoorPivot = hingePivot;
            }
          }
        }
      }

      bodyTiltGroup.add(orientedWrapper);
      state.loaded = true;
      setQualityMode(currentQuality);
      syncTransform();
    },
    undefined,
    (err) => {
      console.warn(`Could not load car model (${config.name}):`, err);
    },
  );

  const steerAxisY = new THREE.Vector3(0, 1, 0);
  const steerDeltaQ = new THREE.Quaternion();

  function setDriverDoorOpen(amount) {
    driverDoorOpen = THREE.MathUtils.clamp(amount, 0, 1);
    if (driverDoorPivot) {
      driverDoorPivot.rotation.y = driverDoorOpen * 1.08;
    }
  }

  const anchorCache = {
    saddle: new THREE.Vector3(),
    passengerSeat: new THREE.Vector3(),
    pedalL: new THREE.Vector3(),
    pedalR: new THREE.Vector3(),
    gripL: new THREE.Vector3(),
    gripR: new THREE.Vector3(),
  };

  function getRickshawAnchors() {
    if (!rickshawParts) return null;
    root.updateMatrixWorld(true);
    rickshawParts.saddleAnchor.getWorldPosition(anchorCache.saddle);
    rickshawParts.passengerAnchor.getWorldPosition(anchorCache.passengerSeat);
    if (rickshawParts.pedalFootL) rickshawParts.pedalFootL.getWorldPosition(anchorCache.pedalL);
    if (rickshawParts.pedalFootR) rickshawParts.pedalFootR.getWorldPosition(anchorCache.pedalR);
    if (rickshawParts.gripAnchorL) rickshawParts.gripAnchorL.getWorldPosition(anchorCache.gripL);
    if (rickshawParts.gripAnchorR) rickshawParts.gripAnchorR.getWorldPosition(anchorCache.gripR);
    return anchorCache;
  }

  function syncTransform() {
    root.position.copy(state.pos);
    root.rotation.y = state.heading;
    bodyTiltGroup.rotation.x = state.pitch;
    bodyTiltGroup.rotation.z = state.roll;
    if (driverDoorPivot) {
      driverDoorPivot.rotation.y = driverDoorOpen * 1.08;
    }

    if (rickshawParts) {
      if (rickshawParts.steering && rickshawParts.steerRestQ) {
        steerDeltaQ.setFromAxisAngle(steerAxisY, state.steerAngle * 1.15);
        rickshawParts.steering.quaternion.copy(rickshawParts.steerRestQ).multiply(steerDeltaQ);
      }
      if (rickshawParts.wheelFront) rickshawParts.wheelFront.rotation.x = state.wheelSpin;
      if (rickshawParts.wheelRearL) rickshawParts.wheelRearL.rotation.x = state.wheelSpin;
      if (rickshawParts.wheelRearR) rickshawParts.wheelRearR.rotation.x = state.wheelSpin;
      if (rickshawParts.crank) rickshawParts.crank.rotation.x = state.pedalPhase;
      if (rickshawParts.pedalL) rickshawParts.pedalL.rotation.x = -state.pedalPhase;
      if (rickshawParts.pedalR) rickshawParts.pedalR.rotation.x = -state.pedalPhase;
      return;
    }

    for (const w of riggedWheels) {
      if (w.isFront) {
        if (w.steerAxis === 'y') {
          w.wheelRoot.rotation.y = state.steerAngle;
        } else {
          w.wheelRoot.rotation.z = -state.steerAngle;
        }
      }
      w.spinGroup.rotation.x = state.wheelSpin;
    }
  }

  function applyCarCollisions(houseRef, envRef, allCars = []) {
    const p = state.pos;
    let hitWall = false;

    // 1. Open-World Khulna City bounds (allows driving freely across the entire city!)
    const bounds = envRef?.city?.bounds || [-1500, 1500, -1500, 1500];
    if (p.x < bounds[0] + 6) { p.x = bounds[0] + 6; hitWall = true; }
    else if (p.x > bounds[1] - 6) { p.x = bounds[1] - 6; hitWall = true; }
    if (p.z < bounds[2] + 6) { p.z = bounds[2] + 6; hitWall = true; }
    else if (p.z > bounds[3] - 6) { p.z = bounds[3] - 6; hitWall = true; }

    // 2. Haji Mohsin Road, Fakir Bari Lane & SK Arshan Alif Tower local zone (leaves North/South Khulna roads open!)
    const inHajiZone = Math.abs(p.x) < 44 && Math.abs(p.z) < 34;
    let onTowerRamp = false;
    if (inHajiZone) {
      const inFakirBariLane = p.z >= 10.65 && p.z <= 13.75;
      const towerGateOpen = Boolean(envRef?.tower?.state?.gateOpen);
      const inTowerRampZ = towerGateOpen && p.z >= 19.3 && p.z <= 22.6;
      const inASBOpenZ = p.z >= 24.0 && p.z <= 26.2;

      const minX = inFakirBariLane ? -39.5 : (inTowerRampZ ? -9.0 : -2.15);
      const maxX = inASBOpenZ ? 5.2 : 2.15;

      if (p.x < minX) {
        p.x = minX;
        hitWall = true;
      } else if (p.x > maxX) {
        p.x = maxX;
        hitWall = true;
      }

      if (p.x < -2.4 && !inTowerRampZ) {
        if (p.z < 11.15) { p.z = 11.15; hitWall = true; }
        else if (p.z > 13.35) { p.z = 13.35; hitWall = true; }
      }
      if (inTowerRampZ && p.x < -2.6) {
        onTowerRamp = true;
        const rampT = THREE.MathUtils.clamp((-2.6 - p.x) / 1.75, 0, 1);
        p.y = 0.01 + rampT * 0.50;
      }
    }

    // 3. Taltola 5-Story House compound collision at TALTOLA_HOUSE_OFFSET
    const lx = p.x - TALTOLA_HOUSE_OFFSET.x;
    const lz = p.z - TALTOLA_HOUSE_OFFSET.z;
    if (Math.abs(lx) < 26 && Math.abs(lz) < 14) {
      const houseGateOpen = Boolean(houseRef?.state?.gateOpen);
      const inHouseGateZ = houseGateOpen && Math.abs(lz) <= 1.5;
      const wallMinX = inHouseGateZ ? 4.35 : 2.10;
      if (lx > wallMinX && lx < 22.0 && Math.abs(lz) < 8.4) {
        p.x = TALTOLA_HOUSE_OFFSET.x + wallMinX;
        hitWall = true;
      }
    }

    // 4. Prevent driving into Khulna lakes/ponds/river water
    if (envRef?.city?.isInWater?.(p.x, p.z)) {
      const fwdX = Math.sin(state.heading);
      const fwdZ = Math.cos(state.heading);
      p.x -= fwdX * Math.sign(state.speed || 1) * 1.2;
      p.z -= fwdZ * Math.sign(state.speed || 1) * 1.2;
      state.speed *= -0.25;
      hitWall = true;
    }

    // 5. Car-to-car separation so vehicles don't overlap each other
    for (const other of allCars) {
      if (!other || other.state === state) continue;
      const dx = p.x - other.state.pos.x;
      const dz = p.z - other.state.pos.z;
      const minSepX = state.halfWidth + other.state.halfWidth + 0.12;
      const minSepZ = state.halfLength + other.state.halfLength + 0.15;
      const overlapX = minSepX - Math.abs(dx);
      const overlapZ = minSepZ - Math.abs(dz);
      if (overlapX > 0 && overlapZ > 0) {
        if (overlapX < overlapZ) {
          p.x += (dx >= 0 ? 1 : -1) * overlapX;
        } else {
          p.z += (dz >= 0 ? 1 : -1) * overlapZ;
        }
        hitWall = true;
      }
    }

    if (!onTowerRamp) {
      p.y = 0.01;
    }

    if (hitWall) {
      state.speed *= 0.65;
      state.lateralVel *= -0.2;
    }
  }

  function cyclePaintColor() {
    state.paintIndex = (state.paintIndex + 1) % paintPresets.length;
    const preset = paintPresets[state.paintIndex];
    state.paintName = preset.name;
    for (const mat of paintMaterials) {
      mat.color.set(preset.hex);
    }
    return preset;
  }

  function cycleCameraMode() {
    const order = ['chase', 'hood', 'front'];
    const idx = order.indexOf(state.cameraMode);
    state.cameraMode = order[(idx + 1) % order.length];
    return state.cameraMode;
  }

  function enterCar(seatMode = 'driver') {
    state.driving = true;
    state.rideSeat = (config.isRickshaw && seatMode === 'passenger') ? 'passenger' : 'driver';
    ensureAudio();
    for (const m of drlMats) m.emissiveIntensity = 4.5;
  }

  function toggleRideSeat() {
    if (!config.isRickshaw || !state.driving) return state.rideSeat;
    state.rideSeat = state.rideSeat === 'passenger' ? 'driver' : 'passenger';
    return state.rideSeat;
  }

  function exitCar(playerPos) {
    state.driving = false;
    state.rideSeat = 'driver';
    updateEngineAudio(false, 920, 0);
    for (const m of drlMats) m.emissiveIntensity = 1.8;
    for (const m of tailMats) m.emissiveIntensity = 1.6;

    const rightVec = new THREE.Vector3(Math.cos(state.heading), 0, -Math.sin(state.heading));
    const exitDist = config.isRickshaw ? 1.15 : 1.60;
    const exitOffset = state.pos.x < -0.6 ? exitDist : -exitDist;
    playerPos.set(
      state.pos.x + rightVec.x * exitOffset,
      state.pos.y + 1.68,
      state.pos.z + rightVec.z * exitOffset,
    );
  }

  function distanceToPlayer(playerPos) {
    if (playerPos.y - 1.68 > 2.2) return Infinity;
    return Math.hypot(playerPos.x - state.pos.x, playerPos.z - state.pos.z);
  }

  function isPlayerNear(playerPos) {
    return distanceToPlayer(playerPos) < 3.8;
  }

  function getPrompt(playerPos) {
    if (state.driving) {
      if (config.isRickshaw) {
        return state.rideSeat === 'passenger'
          ? '[G / E] রিকশা থেকে নামুন · [F] সামনের ড্রাইভার সিটে যান'
          : '[F / E] রিকশা থেকে নামুন · [G] পেছনের প্যাসেঞ্জার সিটে বসুন';
      }
      return `[E / T] ${state.name} গাড়ি থেকে নামুন (Exit Car)`;
    }
    if (isPlayerNear(playerPos)) {
      return config.isRickshaw
        ? '[F] সামনের সিটে উঠে চালান (Drive) · [G] পেছনের প্যাসেঞ্জার সিটে বসুন (Sit)'
        : `[E / F] ${state.name} গাড়িতে উঠুন ও চালান (Drive ${state.name})`;
    }
    return null;
  }

  const fwd = new THREE.Vector3();
  const rgt = new THREE.Vector3();

  function update(delta, keys, houseRef, envRef, allCars = []) {
    const dt = Math.min(delta, 0.05);

    const isPassengerSitting = config.isRickshaw && state.rideSeat === 'passenger';
    if (!state.driving || isPassengerSitting) {
      if (Math.abs(state.speed) > 0.05) {
        state.speed *= Math.max(0, 1 - dt * 4.2);
        fwd.set(Math.sin(state.heading), 0, Math.cos(state.heading));
        state.pos.addScaledVector(fwd, state.speed * dt);
        state.wheelSpin += (state.speed / 0.34) * dt;
        applyCarCollisions(houseRef, envRef, allCars);
      } else {
        state.speed = 0;
      }
      state.pitch = THREE.MathUtils.lerp(state.pitch, 0, Math.min(1, dt * 8));
      state.roll = THREE.MathUtils.lerp(state.roll, 0, Math.min(1, dt * 8));
      updateEngineAudio(false, 920, 0);
      syncTransform();
      return;
    }

    const throttle = (keys.has('KeyW') || keys.has('ArrowUp')) ? 1 : 0;
    const brake = (keys.has('KeyS') || keys.has('ArrowDown')) ? 1 : 0;
    const steerInput = (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0)
      - (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0);
    const handbrake = keys.has('Space');
    const boost = (keys.has('ShiftLeft') || keys.has('ShiftRight')) && throttle > 0 ? 1.42 : 1.0;

    const maxForwardSpeed = boost > 1 ? (config.boostMaxSpeed || 35.0) : (config.maxSpeed || 25.0);
    const engineForce = (config.engineForce || 14.5) * boost;
    const brakeForce = 24.0;
    const drag = 0.012 * state.speed * Math.abs(state.speed) + 0.55 * state.speed;

    let accel = 0;
    if (throttle > 0) accel += engineForce;
    if (brake > 0) {
      if (state.speed > 0.6) accel -= brakeForce;
      else accel -= 9.5;
    }
    if (handbrake && Math.abs(state.speed) > 0.4) {
      accel -= Math.sign(state.speed) * 14.0;
    }

    state.speed += (accel - drag) * dt;
    state.speed = THREE.MathUtils.clamp(state.speed, -11.5, maxForwardSpeed);
    if (!throttle && !brake && Math.abs(state.speed) < 0.14) {
      state.speed = 0;
    }

    const maxSteer = THREE.MathUtils.lerp(0.54, 0.22, Math.min(1, Math.abs(state.speed) / 28));
    state.steerAngle = THREE.MathUtils.lerp(state.steerAngle, steerInput * maxSteer, Math.min(1, dt * 11));

    const isDrifting = handbrake && Math.abs(state.speed) > 5.5;
    const grip = isDrifting ? 2.6 : 8.5;

    const turnRate = state.steerAngle
      * (state.speed / 2.65)
      * (isDrifting ? 1.42 : 1.0)
      * (1.0 / (1.0 + Math.abs(state.speed) * 0.025));

    state.heading += turnRate * dt;

    const centrifugal = turnRate * state.speed * (isDrifting ? 0.36 : 0.10);
    state.lateralVel = THREE.MathUtils.lerp(state.lateralVel, centrifugal, Math.min(1, dt * grip));

    fwd.set(Math.sin(state.heading), 0, Math.cos(state.heading));
    rgt.set(Math.cos(state.heading), 0, -Math.sin(state.heading));

    state.pos.addScaledVector(fwd, state.speed * dt);
    state.pos.addScaledVector(rgt, state.lateralVel * dt);

    applyCarCollisions(houseRef, envRef, allCars);

    const wheelRadius = config.isRickshaw ? 0.365 : 0.34;
    state.wheelSpin += (state.speed / wheelRadius) * dt;
    if (config.isRickshaw) {
      const pedalRate = (throttle > 0 || state.speed > 0.15)
        ? Math.max(throttle * 3.8, (state.speed / wheelRadius) * 0.72)
        : (state.speed < -0.15 ? (state.speed / wheelRadius) * 0.5 : 0);
      state.pedalPhase += pedalRate * dt;
    }
    const targetPitch = THREE.MathUtils.clamp(-accel * 0.0022, -0.045, 0.045);
    const pedalSway = config.isRickshaw ? Math.sin(state.pedalPhase) * 0.028 * Math.min(1, Math.abs(state.speed) / 2.5) : 0;
    const targetRoll = THREE.MathUtils.clamp(-turnRate * state.speed * 0.0025 + pedalSway, -0.065, 0.065);
    state.pitch = THREE.MathUtils.lerp(state.pitch, targetPitch, Math.min(1, dt * 10));
    state.roll = THREE.MathUtils.lerp(state.roll, targetRoll, Math.min(1, dt * 10));

    const absKmh = Math.abs(state.speed) * 3.6;
    const gearThresholds = [0, 26, 52, 78, 104, 130, 165];
    let g = 1;
    for (let i = 1; i <= 6; i++) {
      if (absKmh >= gearThresholds[i - 1]) g = i;
    }
    state.gear = state.speed < -0.4 ? 'R' : (absKmh < 1 ? 'N' : g);

    const gMin = gearThresholds[(typeof g === 'number' ? g : 1) - 1] || 0;
    const gMax = gearThresholds[(typeof g === 'number' ? g : 1)] || 30;
    const gearProgress = (absKmh - gMin) / Math.max(1, gMax - gMin);
    const targetRpm = absKmh < 1
      ? 920 + throttle * 3800
      : THREE.MathUtils.clamp(2000 + gearProgress * 5400, 1100, 7800);
    state.rpm = THREE.MathUtils.lerp(state.rpm, targetRpm, Math.min(1, dt * 12));

    for (const m of tailMats) {
      m.emissiveIntensity = (brake > 0 || handbrake) ? 7.0 : 2.2;
    }

    updateEngineAudio(true, state.rpm, throttle);
    syncTransform();
  }

  function setQualityMode(nextQuality) {
    currentQuality = nextQuality;
    const castShadows = nextQuality !== 'low';
    const envIntensity = nextQuality === 'ultra' ? 2.1 : (nextQuality === 'high' ? 1.7 : (nextQuality === 'medium' ? 1.25 : 0.85));
    const clearcoatVal = nextQuality === 'low' ? 0.3 : 1.0;

    for (const mesh of carShadowMeshes) {
      mesh.castShadow = castShadows;
      mesh.receiveShadow = castShadows;
    }
    for (const mat of glossyMaterials) {
      if ('envMapIntensity' in mat) mat.envMapIntensity = envIntensity;
      if ('clearcoat' in mat) mat.clearcoat = clearcoatVal;
      mat.needsUpdate = true;
    }
    contactShadow.visible = nextQuality === 'low' || nextQuality === 'medium';
  }

  return {
    group: root,
    state,
    enterCar,
    toggleRideSeat,
    exitCar,
    distanceToPlayer,
    isPlayerNear,
    getPrompt,
    cyclePaintColor,
    cycleCameraMode,
    playHorn,
    playDoorSound,
    playSeatbeltSound,
    setDriverDoorOpen,
    getRickshawAnchors,
    setQualityMode,
    update,
  };
}

/**
 * Builds the entire drivable car fleet (BMW M3, Toyota Alphard 2025, Toyota Corolla 2017).
 */
export function createDrivableCarFleet(scene, manager) {
  return CAR_FLEET_CONFIGS.map((cfg) => createDrivableCar(scene, manager, cfg));
}

export function createDrivableBMW(scene, manager) {
  return createDrivableCar(scene, manager, CAR_FLEET_CONFIGS[0]);
}
