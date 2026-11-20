import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TALTOLA_HOUSE_OFFSET } from './khulna-geo.js';
import { rigAllCarDoors, createInteriorCockpitRig } from './car-interior.js';

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

export const TOWNACE_PAINT_PRESETS = [
  { name: 'Factory Original', hex: '#ffffff' },
  { name: 'Pearl White', hex: '#f2f5f8' },
  { name: 'Silver Metallic', hex: '#bfc6ce' },
  { name: 'Champagne Beige', hex: '#dcd0b8' },
  { name: 'Khulna Sky Blue', hex: '#8db4d8' },
  { name: 'Emerald Green', hex: '#4a7c66' },
];

export const RICKSHAW_PAINT_PRESETS = [
  { name: 'Classic Art', hex: '#ffffff' },
  { name: 'Dhaka Red', hex: '#ffd6d6' },
  { name: 'Khulna Green', hex: '#d4ffe2' },
  { name: 'Golden Bangla', hex: '#fff0c4' },
  { name: 'Royal Blue', hex: '#d4e8ff' },
  { name: 'Sunset Rose', hex: '#ffe0f2' },
];

export const BIKE_PAINT_PRESETS = [
  { name: 'Factory Original', hex: '#ffffff' },
  { name: 'Racing Red', hex: '#d91e2a' },
  { name: 'Yamaha Blue', hex: '#1448b8' },
  { name: 'Stealth Black', hex: '#181c24' },
  { name: 'Kawasaki Green', hex: '#1db954' },
  { name: 'Pearl White', hex: '#eef3f8' },
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
    doorSplitRegions: [
      { key: 'FL', side: 1, minAbsX: 0.62, minY: 0.30, maxY: 1.32, minZ: -0.10, maxZ: 0.88 },
      { key: 'FR', side: -1, minAbsX: 0.62, minY: 0.30, maxY: 1.32, minZ: -0.10, maxZ: 0.88 },
      { key: 'RL', side: 1, minAbsX: 0.62, minY: 0.30, maxY: 1.32, minZ: -1.02, maxZ: -0.10 },
      { key: 'RR', side: -1, minAbsX: 0.62, minY: 0.30, maxY: 1.32, minZ: -1.02, maxZ: -0.10 },
    ],
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
    wheelMatRegex: /^C_tire$/i,
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
    doorSplitMode: 'mesh',
    doorSplitRegions: [
      { key: 'FL', side: 1, minAbsX: 0.68, minY: 0.34, maxY: 1.86, minZ: 0.38, maxZ: 1.44 },
      { key: 'FR', side: -1, minAbsX: 0.68, minY: 0.34, maxY: 1.86, minZ: 0.38, maxZ: 1.44 },
      { key: 'RL', side: 1, minAbsX: 0.68, minY: 0.34, maxY: 1.86, minZ: -0.96, maxZ: 0.38, sliding: true },
      { key: 'RR', side: -1, minAbsX: 0.68, minY: 0.34, maxY: 1.86, minZ: -0.96, maxZ: 0.38, sliding: true },
    ],
  },
  {
    id: 'toyota_corolla',
    name: 'Toyota Corolla 2017',
    badge: 'TOYOTA COROLLA 2017',
    assetUrl: './assets/toyota_corolla.glb',
    targetLength: 4.55,
    width: 1.82,
    rotateY: 0, // Raw Corolla already faces +Z
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 0.35, 0.01, TALTOLA_HOUSE_OFFSET.z + 17.5],
    spawnHeading: 0.0,
    paintPresets: COROLLA_PAINT_PRESETS,
    bodyPaintMats: ['e180body'],
    glassMats: ['e180_glass', 'e180_glass_out'],
    tailMats: ['e180_tail', 'e180_glassred', 'e180_red'],
    headlightMats: ['e180_lights', 'e180_fog'],
    chromeMats: ['e180_chrome', 'mirror'],
    dashGlowMats: ['e180_gauge', 'displaye180', 'e180_intlight'],
    khulnaPlateText: ['খুলনা মেট্রো-গ', '১২-৪৫৭৮'],
    khulnaPlatePos: { front: [0, 0.43, 2.27], rear: [0, 0.66, -2.27] },
    hasBuiltInSteeringWheel: true,
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
    doorRegexMap: {
      FL: /door_FL|doorglass_FL/i,
      FR: /door_FR|doorglass_FR/i,
      RL: /door_RL|doorglass_RL/i,
      RR: /door_RR|doorglass_RR/i,
    },
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
    doorGroupNames: {
      FL: 'Dummy003',
      FR: 'Dummy001',
      RL: 'Dummy005',
      RR: 'Dummy004',
    },
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
    doorSplitRegions: [
      { key: 'FL', side: 1, minAbsX: 0.66, minY: 0.32, maxY: 1.92, minZ: 0.72, maxZ: 1.92 },
      { key: 'FR', side: -1, minAbsX: 0.66, minY: 0.32, maxY: 1.92, minZ: 0.72, maxZ: 1.92 },
      { key: 'RL', side: 1, minAbsX: 0.66, minY: 0.32, maxY: 1.92, minZ: -0.82, maxZ: 0.72, sliding: true },
      { key: 'RR', side: -1, minAbsX: 0.66, minY: 0.32, maxY: 1.92, minZ: -0.82, maxZ: 0.72, sliding: true },
    ],
  },
  {
    id: 'toyota_townace',
    name: 'Toyota TownAce GL 2005',
    badge: 'TOYOTA TOWNACE GL 2005',
    assetUrl: './assets/toyota_townace.glb',
    targetLength: 4.50,
    width: 1.78,
    rotateY: 0, // Raw TownAce already faces +Z
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 0.35, 0.01, TALTOLA_HOUSE_OFFSET.z - 17.8],
    spawnHeading: 0.0,
    paintPresets: TOWNACE_PAINT_PRESETS,
    bodyPaintMats: ['Material'],
    glassMats: ['Material.004'],
    tailMats: ['Material.002'],
    headlightMats: ['Material.006'],
    chromeMats: ['Material.005'],
    rimMats: ['Material.007'],
    tireMats: ['Material.009'],
    plateMats: ['Material.003'],
    khulnaPlateText: ['খুলনা মেট্রো-চ', '১১-৩২৯০'],
    hasBuiltInSteeringWheel: true,
    wheelNameRegex: /^Cylinder(\.?\d+)?$/i,
    maxSpeed: 21.0,
    boostMaxSpeed: 28.5,
    engineForce: 12.0,
    engineBaseFreq: 32,
    engineRangeFreq: 112,
    hornFreqs: [400, 505],
    camBack: 5.8,
    camHeight: 2.42,
    hoodHeight: 1.52,
    hoodForward: 1.15,
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
  {
    id: 'bike_125cc',
    name: '125cc Naked Sport',
    badge: '125CC NAKED MOTORCYCLE',
    assetUrl: './assets/bike_125cc.glb',
    targetLength: 2.08,
    width: 0.76,
    rotateY: 0,
    rotateX: 0.071,
    hideMats: ['ground'],
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 1.55, 0.01, TALTOLA_HOUSE_OFFSET.z + 2.9],
    spawnHeading: 0.0,
    paintPresets: BIKE_PAINT_PRESETS,
    maxSpeed: 29.0,
    boostMaxSpeed: 40.5,
    engineForce: 19.5,
    engineBaseFreq: 56,
    engineRangeFreq: 215,
    hornFreqs: [520, 660],
    camBack: 3.35,
    camHeight: 1.72,
    hoodHeight: 1.38,
    hoodForward: 0.12,
    isBMW: false,
    isBike: true,
    bikeSportLean: true,
    bikeSplitMergedWheels: false,
    bikeRig: {
      seat: [0, 0.75, -0.26],
      footL: [0.20, 0.33, -0.16],
      footR: [-0.20, 0.33, -0.16],
      steerPivot: [0, 0.96, 0.32],
      gripL: [0.33, 0.02, -0.04],
      gripR: [-0.33, 0.02, -0.04],
      dash: [0, 1.10, 0.44],
      povEye: [0, 1.35, -0.20],
      povLook: [0, 1.16, 2.4],
    },
  },
  {
    id: 'honda_nxr_bros',
    name: 'Honda NXR Bros 2003',
    badge: 'HONDA NXR BROS 2003',
    assetUrl: './assets/honda_nxr_bros.glb',
    targetLength: 2.12,
    width: 0.82,
    rotateY: Math.PI,
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 2.15, 0.01, TALTOLA_HOUSE_OFFSET.z - 1.6],
    spawnHeading: 0.0,
    paintPresets: BIKE_PAINT_PRESETS,
    bodyPaintMats: ['FairingGasTank'],
    maxSpeed: 27.5,
    boostMaxSpeed: 38.0,
    engineForce: 18.2,
    engineBaseFreq: 48,
    engineRangeFreq: 190,
    hornFreqs: [480, 610],
    camBack: 3.45,
    camHeight: 1.78,
    hoodHeight: 1.44,
    hoodForward: 0.10,
    isBMW: false,
    isBike: true,
    bikeSportLean: false,
    bikeSplitMergedWheels: true,
    bikeRig: {
      seat: [0, 0.72, -0.24],
      footL: [0.21, 0.31, -0.14],
      footR: [-0.21, 0.31, -0.14],
      steerPivot: [0, 1.00, 0.32],
      gripL: [0.37, 0.04, -0.04],
      gripR: [-0.37, 0.04, -0.04],
      dash: [0, 1.12, 0.42],
      povEye: [0, 1.38, -0.20],
      povLook: [0, 1.18, 2.4],
    },
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
  return new THREE.MeshStandardMaterial({
    name: source.name,
    color: new THREE.Color(colorHex),
    map: source.map || null,
    normalMap: source.normalMap || null,
    side: THREE.FrontSide,
    metalness: 0.88,
    roughness: 0.15,
    envMapIntensity: 1.55,
  });
}

function ensureIndexedForBatch(geom) {
  if (geom.index) return geom;
  const count = geom.attributes.position?.count || 0;
  const idx = count > 65535 ? new Uint32Array(count) : new Uint16Array(count);
  for (let i = 0; i < count; i++) idx[i] = i;
  geom.setIndex(new THREE.BufferAttribute(idx, 1));
  return geom;
}

function toFloat32Attr(attr) {
  if (!attr) return null;
  if (attr.array instanceof Float32Array && !attr.normalized) return attr.clone();
  const itemSize = attr.itemSize;
  const count = attr.count;
  const out = new Float32Array(count * itemSize);
  for (let i = 0; i < count; i++) {
    out[i * itemSize] = attr.getX(i);
    if (itemSize >= 2) out[i * itemSize + 1] = attr.getY(i);
    if (itemSize >= 3) out[i * itemSize + 2] = attr.getZ(i);
    if (itemSize >= 4) out[i * itemSize + 3] = attr.getW(i);
  }
  return new THREE.BufferAttribute(out, itemSize, false);
}

function batchStaticCarMeshes(orientedWrapper, skipMeshesSet) {
  orientedWrapper.updateMatrixWorld(true);
  const invRoot = new THREE.Matrix4().copy(orientedWrapper.matrixWorld).invert();
  const mat4 = new THREE.Matrix4();
  const buckets = new Map();

  orientedWrapper.traverse((child) => {
    if (!child.isMesh || !child.visible || child.isSkinnedMesh) return;
    if (skipMeshesSet.has(child) || Array.isArray(child.material) || !child.material) return;
    const mat = child.material;
    const src = child.geometry;
    if (!src || !src.attributes?.position) return;

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', toFloat32Attr(src.attributes.position));
    if (src.attributes.normal) g.setAttribute('normal', toFloat32Attr(src.attributes.normal));
    if (src.attributes.uv) g.setAttribute('uv', toFloat32Attr(src.attributes.uv));
    if (mat.vertexColors && src.attributes.color) {
      g.setAttribute('color', toFloat32Attr(src.attributes.color));
    }
    if (src.index) g.setIndex(src.index.clone());
    if (!g.attributes.normal) g.computeVertexNormals();

    mat4.multiplyMatrices(invRoot, child.matrixWorld);
    g.applyMatrix4(mat4);
    if (mat4.determinant() < 0) {
      ensureIndexedForBatch(g);
      const idx = g.index;
      for (let i = 0; i < idx.count; i += 3) {
        const b = idx.getX(i + 1);
        const c = idx.getX(i + 2);
        idx.setX(i + 1, c);
        idx.setX(i + 2, b);
      }
      idx.needsUpdate = true;
    }

    const attrKey = `${Boolean(g.attributes.uv)}|${Boolean(mat.vertexColors && g.attributes.color)}`;
    const bucketKey = `${mat.uuid}|${child.castShadow}|${child.receiveShadow}|${child.renderOrder}|${attrKey}`;
    let b = buckets.get(bucketKey);
    if (!b) {
      b = { mat, cast: child.castShadow, receive: child.receiveShadow, order: child.renderOrder, meshes: [], geoms: [] };
      buckets.set(bucketKey, b);
    }
    b.meshes.push(child);
    b.geoms.push(g);
  });

  const staticGroup = new THREE.Group();
  staticGroup.name = 'CarStaticBatched';
  staticGroup.matrixAutoUpdate = false;
  staticGroup.updateMatrix();
  orientedWrapper.add(staticGroup);

  for (const b of buckets.values()) {
    if (b.meshes.length < 2) {
      for (const g of b.geoms) g.dispose();
      b.meshes[0].matrixAutoUpdate = false;
      b.meshes[0].updateMatrix();
      continue;
    }
    const hasAnyIndex = b.geoms.some((geom) => Boolean(geom.index));
    if (hasAnyIndex) {
      for (const geom of b.geoms) ensureIndexedForBatch(geom);
    }
    const merged = mergeGeometries(b.geoms, false);
    for (const g of b.geoms) g.dispose();
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, b.mat);
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.receive;
    mesh.renderOrder = b.order;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    for (const old of b.meshes) old.removeFromParent();
    staticGroup.add(mesh);
  }
}

function createCarShadowProxy(orientedWrapper) {
  orientedWrapper.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(orientedWrapper);
  const sz = box.getSize(new THREE.Vector3());
  const ct = box.getCenter(new THREE.Vector3());
  const invRoot = new THREE.Matrix4().copy(orientedWrapper.matrixWorld).invert();
  const minLocal = box.min.clone().applyMatrix4(invRoot);
  ct.applyMatrix4(invRoot);

  const w = Math.max(1.2, sz.x * 0.90);
  const h = Math.max(0.9, sz.y * 0.92);
  const l = Math.max(2.4, sz.z * 0.92);

  const lower = new THREE.BoxGeometry(w, h * 0.48, l);
  lower.translate(ct.x, minLocal.y + h * 0.30, ct.z);
  const upper = new THREE.BoxGeometry(w * 0.84, h * 0.42, l * 0.56);
  upper.translate(ct.x, minLocal.y + h * 0.72, ct.z - l * 0.04);
  const proxyGeo = mergeGeometries([lower, upper], false);
  lower.dispose();
  upper.dispose();

  const proxyMat = new THREE.MeshBasicMaterial({
    colorWrite: false,
    depthWrite: false,
    side: THREE.FrontSide,
    shadowSide: THREE.DoubleSide,
  });
  const proxyMesh = new THREE.Mesh(proxyGeo, proxyMat);
  proxyMesh.name = 'CarShadowProxy';
  proxyMesh.castShadow = true;
  proxyMesh.receiveShadow = false;
  proxyMesh.matrixAutoUpdate = false;
  proxyMesh.updateMatrix();
  return proxyMesh;
}

/**
 * Automatically groups named wheel meshes (e.g. Toyota Corolla e180_wheel* & e180_brakedisc_*)
 * into 4 steering/spinning pivots (FL, FR, RL, RR) in normalized car space (+Z forward, +Y up).
 */
function rigGenericCarWheels(orientedWrapper, wheelRegex, wheelMatRegex = null) {
  if (!wheelRegex && !wheelMatRegex) return { wheels: [], wheelRadius: 0.34 };
  orientedWrapper.updateMatrixWorld(true);

  const wheelMeshes = [];
  const allNonSkinned = [];
  orientedWrapper.traverse((child) => {
    if (!child.isMesh) return;
    if (!child.isSkinnedMesh) allNonSkinned.push(child);
    let matched = false;
    if (wheelRegex) {
      let cur = child;
      while (cur && cur !== orientedWrapper) {
        if (wheelRegex.test(cur.name || '')) {
          matched = true;
          break;
        }
        cur = cur.parent;
      }
    }
    if (!matched && wheelMatRegex && child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      matched = mats.some((m) => wheelMatRegex.test(m?.name || ''));
    }
    if (matched) wheelMeshes.push(child);
  });

  if (wheelMeshes.length === 0) return { wheels: [], wheelRadius: 0.34 };

  const buckets = {
    FL: { isFront: true, meshes: [], box: new THREE.Box3() },
    FR: { isFront: true, meshes: [], box: new THREE.Box3() },
    RL: { isFront: false, meshes: [], box: new THREE.Box3() },
    RR: { isFront: false, meshes: [], box: new THREE.Box3() },
  };

  const tmpBox = new THREE.Box3();
  const tmpCenter = new THREE.Vector3();
  const tmpSize = new THREE.Vector3();
  const invWrapper = new THREE.Matrix4().copy(orientedWrapper.matrixWorld).invert();
  const matchedSet = new Set();

  for (const mesh of wheelMeshes) {
    tmpBox.setFromObject(mesh);
    if (tmpBox.isEmpty()) continue;
    tmpBox.applyMatrix4(invWrapper);
    tmpBox.getCenter(tmpCenter);
    if (Math.abs(tmpCenter.x) < 0.35 || tmpCenter.y > 0.85) continue;

    const isFront = tmpCenter.z >= 0;
    const isLeft = tmpCenter.x >= 0;
    const key = (isFront ? 'F' : 'R') + (isLeft ? 'L' : 'R');
    buckets[key].meshes.push(mesh);
    buckets[key].box.union(tmpBox);
    matchedSet.add(mesh);
  }

  // When matching by tire material (e.g. Alphard), capture inner chrome alloy rim, center cap, lug nuts & brake disc
  if (wheelMatRegex) {
    const centers = {};
    for (const [k, b] of Object.entries(buckets)) {
      if (b.meshes.length > 0) centers[k] = b.box.getCenter(new THREE.Vector3());
    }
    for (const mesh of allNonSkinned) {
      if (matchedSet.has(mesh)) continue;
      const mName = Array.isArray(mesh.material) ? (mesh.material[0]?.name || '') : (mesh.material?.name || '');
      if (mName === 'C_089') continue;
      tmpBox.setFromObject(mesh);
      if (tmpBox.isEmpty()) continue;
      tmpBox.applyMatrix4(invWrapper);
      tmpBox.getCenter(tmpCenter);
      tmpBox.getSize(tmpSize);
      if (Math.max(tmpSize.x, tmpSize.y, tmpSize.z) > 0.72) continue;
      for (const [k, wc] of Object.entries(centers)) {
        if (Math.abs(tmpCenter.x - wc.x) < 0.14 && Math.abs(tmpCenter.y - wc.y) < 0.18 && Math.abs(tmpCenter.z - wc.z) < 0.18) {
          buckets[k].meshes.push(mesh);
          matchedSet.add(mesh);
          break;
        }
      }
    }
  }

  const builtWheels = [];
  let radiusSum = 0;
  let radiusCount = 0;
  const tmpPos = new THREE.Vector3();
  const tmpQuat = new THREE.Quaternion();
  const tmpScale = new THREE.Vector3();
  for (const b of Object.values(buckets)) {
    if (b.meshes.length === 0) continue;
    const center = b.box.getCenter(new THREE.Vector3());
    b.box.getSize(tmpSize);
    const wheelR = THREE.MathUtils.clamp(tmpSize.y * 0.5, 0.26, 0.48);
    radiusSum += wheelR;
    radiusCount++;

    const steerPivot = new THREE.Group();
    steerPivot.position.copy(center);
    orientedWrapper.add(steerPivot);

    const spinPivot = new THREE.Group();
    steerPivot.add(spinPivot);
    orientedWrapper.updateMatrixWorld(true);

    for (const mesh of b.meshes) {
      if (mesh.isSkinnedMesh) {
        // Convert SkinnedMesh wheel (e.g. HiAce) into a safe rigid Mesh at the exact world matrix so it spins without SkinnedMesh errors!
        mesh.updateMatrixWorld(true);
        const rigid = new THREE.Mesh(mesh.geometry, mesh.material);
        rigid.castShadow = mesh.castShadow;
        rigid.receiveShadow = mesh.receiveShadow;
        mesh.matrixWorld.decompose(tmpPos, tmpQuat, tmpScale);
        rigid.position.copy(tmpPos);
        rigid.quaternion.copy(tmpQuat);
        rigid.scale.copy(tmpScale);
        rigid.updateMatrixWorld(true);
        spinPivot.attach(rigid);
        mesh.visible = false;
      } else {
        spinPivot.attach(mesh);
      }
    }

    builtWheels.push({
      wheelRoot: steerPivot,
      spinGroup: spinPivot,
      isFront: b.isFront,
      steerAxis: 'y',
      spinAxis: 'x',
    });
  }

  return {
    wheels: builtWheels,
    wheelRadius: radiusCount > 0 ? radiusSum / radiusCount : 0.34,
  };
}

function splitMergedBikeMesh(mesh, invWrapper, frontC, rearC, wheelR, stemPivotPos, opts = {}) {
  const srcGeom = mesh.geometry;
  const posAttr = srcGeom?.attributes?.position;
  if (!posAttr) return null;
  const normAttr = srcGeom.attributes.normal;
  const uvAttr = srcGeom.attributes.uv;
  const indexAttr = srcGeom.index;

  const toWrapper = new THREE.Matrix4().multiplyMatrices(invWrapper, mesh.matrixWorld);
  const v0 = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const triC = new THREE.Vector3();

  const frontWheelTris = [];
  const rearWheelTris = [];
  const frontSteerTris = [];
  const bodyTris = [];

  const allowWheel = Boolean(opts.allowWheel);
  const strictRimOnly = Boolean(opts.strictRimOnly);
  const allowFrontSteer = Boolean(opts.allowFrontSteer);
  const wheelMaxX = strictRimOnly ? 0.080 : 0.135;
  const rLim = strictRimOnly ? (wheelR * 0.86) : (wheelR + 0.035);
  const rSq = rLim * rLim;
  const triCount = indexAttr ? indexAttr.count / 3 : posAttr.count / 3;

  for (let t = 0; t < triCount; t++) {
    const i0 = indexAttr ? indexAttr.getX(t * 3) : t * 3;
    const i1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;
    v0.fromBufferAttribute(posAttr, i0).applyMatrix4(toWrapper);
    v1.fromBufferAttribute(posAttr, i1).applyMatrix4(toWrapper);
    v2.fromBufferAttribute(posAttr, i2).applyMatrix4(toWrapper);
    triC.copy(v0).add(v1).add(v2).multiplyScalar(1 / 3);

    const dFrontSq = (triC.y - frontC.y) ** 2 + (triC.z - frontC.z) ** 2;
    const dRearSq = (triC.y - rearC.y) ** 2 + (triC.z - rearC.z) ** 2;

    if (allowWheel && Math.abs(triC.x) <= wheelMaxX && dFrontSq <= rSq && triC.z > 0.28) {
      frontWheelTris.push(i0, i1, i2);
    } else if (allowWheel && Math.abs(triC.x) <= wheelMaxX && dRearSq <= rSq && triC.z < -0.28) {
      rearWheelTris.push(i0, i1, i2);
    } else if (allowFrontSteer) {
      const isHandlebarOrMirror = triC.y > 0.86 && triC.z > 0.14;
      const isForkOrHeadlight = triC.z > (0.24 + Math.max(0, 1.0 - triC.y) * 0.30);
      if (isHandlebarOrMirror || isForkOrHeadlight) {
        frontSteerTris.push(i0, i1, i2);
      } else {
        bodyTris.push(i0, i1, i2);
      }
    } else {
      bodyTris.push(i0, i1, i2);
    }
  }
  if (!frontWheelTris.length && !rearWheelTris.length && !frontSteerTris.length) return null;

  function buildSub(indices, centerOffset) {
    if (!indices.length) return null;
    const map = new Map();
    const outPos = [];
    const outNorm = [];
    const outUv = [];
    const outIdx = [];
    const tmp = new THREE.Vector3();
    const normMat = new THREE.Matrix3().getNormalMatrix(toWrapper);
    const nTmp = new THREE.Vector3();
    for (let k = 0; k < indices.length; k++) {
      const old = indices[k];
      let ni = map.get(old);
      if (ni === undefined) {
        ni = outPos.length / 3;
        map.set(old, ni);
        tmp.fromBufferAttribute(posAttr, old).applyMatrix4(toWrapper);
        if (centerOffset) tmp.sub(centerOffset);
        outPos.push(tmp.x, tmp.y, tmp.z);
        if (normAttr) {
          nTmp.fromBufferAttribute(normAttr, old).applyMatrix3(normMat).normalize();
          outNorm.push(nTmp.x, nTmp.y, nTmp.z);
        }
        if (uvAttr) outUv.push(uvAttr.getX(old), uvAttr.getY(old));
      }
      outIdx.push(ni);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(outPos, 3));
    if (outNorm.length) g.setAttribute('normal', new THREE.Float32BufferAttribute(outNorm, 3));
    else g.computeVertexNormals();
    if (outUv.length) g.setAttribute('uv', new THREE.Float32BufferAttribute(outUv, 2));
    g.setIndex(outIdx);
    const mOut = new THREE.Mesh(g, mesh.material);
    mOut.castShadow = mesh.castShadow;
    mOut.receiveShadow = mesh.receiveShadow;
    return mOut;
  }

  return {
    frontWheelMesh: buildSub(frontWheelTris, frontC),
    rearWheelMesh: buildSub(rearWheelTris, rearC),
    frontSteerMesh: buildSub(frontSteerTris, stemPivotPos),
    bodyMesh: buildSub(bodyTris, null),
  };
}

function rigMotorcycleWheels(orientedWrapper, config) {
  orientedWrapper.updateMatrixWorld(true);
  const invWrapper = new THREE.Matrix4().copy(orientedWrapper.matrixWorld).invert();
  const tmpBox = new THREE.Box3();
  const tmpC = new THREE.Vector3();
  const tmpS = new THREE.Vector3();

  const stemPos = config.bikeRig?.steerPivot || [0, 0.96, 0.32];
  const frontAssemblyPivot = new THREE.Group();
  frontAssemblyPivot.name = 'BikeFrontSteeringAssembly';
  frontAssemblyPivot.position.set(0, stemPos[1] - 0.08, stemPos[2]);
  orientedWrapper.add(frontAssemblyPivot);
  orientedWrapper.updateMatrixWorld(true);

  if (config.bikeSplitMergedWheels) {
    const fBox = new THREE.Box3();
    const rBox = new THREE.Box3();
    const vTmp = new THREE.Vector3();
    const toW = new THREE.Matrix4();
    orientedWrapper.traverse((ch) => {
      if (!ch.isMesh || !ch.visible || !ch.geometry?.attributes?.position) return;
      const mName = Array.isArray(ch.material) ? (ch.material[0]?.name || '') : (ch.material?.name || '');
      if (!/TireMat/i.test(mName)) return;
      toW.multiplyMatrices(invWrapper, ch.matrixWorld);
      const posA = ch.geometry.attributes.position;
      for (let i = 0; i < posA.count; i++) {
        vTmp.fromBufferAttribute(posA, i).applyMatrix4(toW);
        if (Math.abs(vTmp.x) > 0.16 || vTmp.y > 0.78) continue;
        if (vTmp.z > 0.22) fBox.expandByPoint(vTmp);
        else if (vTmp.z < -0.22) rBox.expandByPoint(vTmp);
      }
    });
    const frontC = !fBox.isEmpty()
      ? new THREE.Vector3(0, (fBox.min.y + fBox.max.y) * 0.5, (fBox.min.z + fBox.max.z) * 0.5)
      : new THREE.Vector3(0, 0.33, 0.69);
    const rearC = !rBox.isEmpty()
      ? new THREE.Vector3(0, (rBox.min.y + rBox.max.y) * 0.5, (rBox.min.z + rBox.max.z) * 0.5)
      : new THREE.Vector3(0, 0.33, -0.69);
    const fRad = !fBox.isEmpty() ? THREE.MathUtils.clamp((fBox.max.y - fBox.min.y) * 0.5, 0.26, 0.42) : 0.335;
    const rRad = !rBox.isEmpty() ? THREE.MathUtils.clamp((rBox.max.y - rBox.min.y) * 0.5, 0.26, 0.42) : 0.335;
    const wheelR = (fRad + rRad) * 0.5;

    const frontSteer = new THREE.Group();
    frontSteer.position.copy(frontC).sub(frontAssemblyPivot.position);
    frontAssemblyPivot.add(frontSteer);
    const frontSpin = new THREE.Group();
    frontSteer.add(frontSpin);

    const rearSteer = new THREE.Group();
    rearSteer.position.copy(rearC);
    orientedWrapper.add(rearSteer);
    const rearSpin = new THREE.Group();
    rearSteer.add(rearSpin);

    const allMeshes = [];
    orientedWrapper.traverse((ch) => {
      if (ch.isMesh && ch.visible) allMeshes.push(ch);
    });
    for (const ch of allMeshes) {
      const mName = Array.isArray(ch.material) ? (ch.material[0]?.name || '') : (ch.material?.name || '');
      const isPureWheel = /TireMat|BrakeDisk|Sprocket/i.test(mName);
      const isRimCandidate = /Chrome|ScratchedSteel/i.test(mName);
      const isFrontSteerCandidate = !/Engine|Carburettor|ChainMat|Sprocket|BrakeDisk|TireMat/i.test(mName);
      if (!isPureWheel && !isRimCandidate && !isFrontSteerCandidate) continue;

      const res = splitMergedBikeMesh(ch, invWrapper, frontC, rearC, Math.max(fRad, rRad), frontAssemblyPivot.position, {
        allowWheel: isPureWheel || isRimCandidate,
        strictRimOnly: isRimCandidate,
        allowFrontSteer: isFrontSteerCandidate,
      });
      if (!res) continue;
      if (res.frontWheelMesh) frontSpin.add(res.frontWheelMesh);
      if (res.rearWheelMesh) rearSpin.add(res.rearWheelMesh);
      if (res.frontSteerMesh) frontAssemblyPivot.add(res.frontSteerMesh);
      if (res.bodyMesh) orientedWrapper.add(res.bodyMesh);
      ch.visible = false;
    }

    return {
      wheels: [
        { wheelRoot: frontSteer, spinGroup: frontSpin, isFront: true, steerAxis: 'y', spinAxis: 'x', restY: frontSteer.position.y, parentSteers: true },
        { wheelRoot: rearSteer, spinGroup: rearSpin, isFront: false, steerAxis: 'y', spinAxis: 'x', restY: rearC.y },
      ],
      frontAssemblyPivot,
      wheelRadius: wheelR,
    };
  }

  const frontBucket = { meshes: [], tireBox: new THREE.Box3(), allBox: new THREE.Box3() };
  const rearBucket = { meshes: [], tireBox: new THREE.Box3(), allBox: new THREE.Box3() };
  const allSmallMeshes = [];
  orientedWrapper.traverse((ch) => {
    if (!ch.isMesh || !ch.visible) return;
    tmpBox.setFromObject(ch);
    if (tmpBox.isEmpty()) return;
    tmpBox.applyMatrix4(invWrapper);
    tmpBox.getCenter(tmpC);
    tmpBox.getSize(tmpS);
    if (Math.abs(tmpC.x) > 0.16 || tmpC.y > 0.62 || Math.max(tmpS.x, tmpS.y, tmpS.z) > 0.72) return;
    const aspectYZ = Math.max(tmpS.y, tmpS.z) / Math.max(0.01, Math.min(tmpS.y, tmpS.z));
    const isCircularWheelPart = tmpS.y > 0.24 && tmpS.z > 0.24 && aspectYZ < 1.24 && tmpS.x < 0.28;
    allSmallMeshes.push({ mesh: ch, box: tmpBox.clone(), center: tmpC.clone(), size: tmpS.clone(), isCircularWheelPart });
    if (isCircularWheelPart && tmpBox.min.y < 0.24) {
      if (tmpC.z > 0.38) {
        frontBucket.meshes.push(ch);
        frontBucket.tireBox.union(tmpBox);
        frontBucket.allBox.union(tmpBox);
      } else if (tmpC.z < -0.32) {
        rearBucket.meshes.push(ch);
        rearBucket.tireBox.union(tmpBox);
        rearBucket.allBox.union(tmpBox);
      }
    }
  });

  const fCenter = !frontBucket.tireBox.isEmpty() ? frontBucket.tireBox.getCenter(new THREE.Vector3()) : null;
  const rCenter = !rearBucket.tireBox.isEmpty() ? rearBucket.tireBox.getCenter(new THREE.Vector3()) : null;
  const usedSet = new Set([...frontBucket.meshes, ...rearBucket.meshes]);
  for (const item of allSmallMeshes) {
    if (usedSet.has(item.mesh)) continue;
    if (fCenter && Math.hypot(item.center.y - fCenter.y, item.center.z - fCenter.z) < 0.13 && item.size.y < 0.60 && item.size.z < 0.60) {
      frontBucket.meshes.push(item.mesh);
      usedSet.add(item.mesh);
    } else if (rCenter && Math.hypot(item.center.y - rCenter.y, item.center.z - rCenter.z) < 0.13 && item.size.y < 0.60 && item.size.z < 0.60) {
      rearBucket.meshes.push(item.mesh);
      usedSet.add(item.mesh);
    }
  }

  const builtWheels = [];
  let rSum = 0;
  let rCnt = 0;
  for (const [isFront, b] of [[true, frontBucket], [false, rearBucket]]) {
    if (!b.meshes.length) continue;
    const refBox = !b.tireBox.isEmpty() ? b.tireBox : b.allBox;
    const center = new THREE.Vector3(0, (refBox.min.y + refBox.max.y) * 0.5, (refBox.min.z + refBox.max.z) * 0.5);
    refBox.getSize(tmpS);
    const wr = THREE.MathUtils.clamp(tmpS.y * 0.5, 0.25, 0.42);
    rSum += wr; rCnt++;
    const steerPivot = new THREE.Group();
    if (isFront) {
      steerPivot.position.copy(center).sub(frontAssemblyPivot.position);
      frontAssemblyPivot.add(steerPivot);
    } else {
      steerPivot.position.copy(center);
      orientedWrapper.add(steerPivot);
    }
    const spinPivot = new THREE.Group();
    steerPivot.add(spinPivot);
    orientedWrapper.updateMatrixWorld(true);
    for (const m of b.meshes) spinPivot.attach(m);
    builtWheels.push({ wheelRoot: steerPivot, spinGroup: spinPivot, isFront, steerAxis: 'y', spinAxis: 'x', restY: steerPivot.position.y, parentSteers: isFront });
  }

  orientedWrapper.updateMatrixWorld(true);
  const frontTurnMeshes = [];
  orientedWrapper.traverse((ch) => {
    if (!ch.isMesh || !ch.visible || usedSet.has(ch)) return;
    tmpBox.setFromObject(ch);
    if (tmpBox.isEmpty()) return;
    tmpBox.applyMatrix4(invWrapper);
    tmpBox.getCenter(tmpC);
    tmpBox.getSize(tmpS);
    const isHandlebarOrMirror = tmpC.y > 0.84 && tmpC.z > 0.14 && tmpS.z < 0.65;
    const isFrontForkOrLamp = tmpBox.min.z > 0.10 && tmpC.z > 0.24 && tmpS.z < 0.85;
    if (isHandlebarOrMirror || isFrontForkOrLamp) {
      frontTurnMeshes.push(ch);
    }
  });
  for (const fm of frontTurnMeshes) frontAssemblyPivot.attach(fm);

  return { wheels: builtWheels, frontAssemblyPivot, wheelRadius: rCnt ? rSum / rCnt : 0.32 };
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
    standingPedal: false,
    standingBlend: 0,
    boostStamina: 10.0,
    boostCooldown: 0.0,
    rpm: 920,
    gear: 'N',
    pitch: 0,
    roll: 0,
    frontSuspOffset: 0,
    frontSuspVel: 0,
    rearSuspOffset: 0,
    rearSuspVel: 0,
    roadTravelDist: 0,
    paintIndex: 0,
    paintName: paintPresets[0].name,
    isRickshaw: Boolean(config.isRickshaw),
    isBike: Boolean(config.isBike),
    bikeSportLean: Boolean(config.bikeSportLean),
    rideSeat: 'driver',
    halfWidth: (config.width || 1.88) * 0.48,
    halfLength: (config.targetLength || 4.4) * 0.48,
    camBack: config.camBack || 5.4,
    camHeight: config.camHeight || 2.15,
    hoodHeight: config.hoodHeight || 1.28,
    hoodForward: config.hoodForward || 0.65,
  };

  let riggedWheels = [];
  let bikeFrontAssembly = null;
  let measuredWheelRadius = config.isRickshaw ? 0.365 : (config.isBike ? 0.32 : 0.34);
  let rickshawParts = null;
  let bikeDriverRig = null;
  let carDoors = {};
  let driverDoorOverride = null;
  let exteriorWrapper = null;
  const cockpitRig = (config.isRickshaw || config.isBike) ? null : createInteriorCockpitRig(config, paintPresets[0].hex);
  if (cockpitRig) bodyTiltGroup.add(cockpitRig.group);

  // Interactive 3D Motorcycle Rider Rig + Live Working Digital/Analog POV Speedometer Dashboard!
  if (config.isBike) {
    const br = config.bikeRig || {};
    const rigGroup = new THREE.Group();
    rigGroup.name = `BikeRiderRig_${config.id}`;
    bodyTiltGroup.add(rigGroup);

    const seatAnchor = new THREE.Object3D();
    seatAnchor.position.set(...(br.seat || [0, 0.82, -0.22]));
    rigGroup.add(seatAnchor);
    const footL = new THREE.Object3D();
    footL.position.set(...(br.footL || [0.24, 0.34, -0.08]));
    rigGroup.add(footL);
    const footR = new THREE.Object3D();
    footR.position.set(...(br.footR || [-0.24, 0.34, -0.08]));
    rigGroup.add(footR);

    const steerPivot = new THREE.Group();
    steerPivot.position.set(...(br.steerPivot || [0, 1.06, 0.34]));
    rigGroup.add(steerPivot);
    const gripL = new THREE.Object3D();
    gripL.position.set(...(br.gripL || [0.34, 0.02, -0.04]));
    steerPivot.add(gripL);
    const gripR = new THREE.Object3D();
    gripR.position.set(...(br.gripR || [-0.34, 0.02, -0.04]));
    steerPivot.add(gripR);

    const dashCanvas = document.createElement('canvas');
    dashCanvas.width = 256;
    dashCanvas.height = 144;
    const dashCtx = dashCanvas.getContext('2d');
    const dashTex = new THREE.CanvasTexture(dashCanvas);
    dashTex.colorSpace = THREE.SRGBColorSpace;

    const dashHousing = new THREE.Group();
    dashHousing.position.set(...(br.dash || [0, 1.13, 0.43]));
    dashHousing.rotation.x = -0.58;
    dashHousing.rotation.y = Math.PI;
    rigGroup.add(dashHousing);
    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.19, 0.11, 0.022),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.65 }),
    );
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.172, 0.094),
      new THREE.MeshBasicMaterial({ map: dashTex }),
    );
    screen.position.z = 0.012;
    dashHousing.add(bezel, screen);

    const povEyeLocal = new THREE.Vector3(...(br.povEye || [0, 1.40, -0.15]));
    const povLookLocal = new THREE.Vector3(...(br.povLook || [0, 1.20, 2.4]));

    function drawBikeSpeedo(kmh, rpm, gear) {
      const c = dashCtx;
      c.fillStyle = '#07111f';
      c.fillRect(0, 0, 256, 144);
      c.strokeStyle = '#38bdf8';
      c.lineWidth = 3;
      c.strokeRect(4, 4, 248, 136);

      const rpmFrac = THREE.MathUtils.clamp((rpm - 900) / 7200, 0.04, 1.0);
      const segs = 16;
      for (let i = 0; i < segs; i++) {
        const on = (i + 1) / segs <= rpmFrac;
        c.fillStyle = on ? (i >= 13 ? '#ef4444' : (i >= 9 ? '#facc15' : '#22c55e')) : '#1e293b';
        c.fillRect(14 + i * 14.2, 14, 11, 16);
      }

      c.fillStyle = '#f8fafc';
      c.font = 'bold 62px monospace';
      c.textAlign = 'center';
      c.fillText(String(Math.round(kmh)).padStart(2, '0'), 112, 98);
      c.fillStyle = '#94a3b8';
      c.font = 'bold 16px sans-serif';
      c.fillText('KM/H', 112, 122);

      c.fillStyle = '#d9ed9c';
      c.fillRect(190, 48, 48, 52);
      c.fillStyle = '#0f172a';
      c.font = 'bold 36px monospace';
      c.fillText(String(gear), 214, 86);
      c.fillStyle = '#38bdf8';
      c.font = 'bold 13px sans-serif';
      c.fillText('GEAR', 214, 118);

      dashTex.needsUpdate = true;
    }
    drawBikeSpeedo(0, 920, 'N');

    bikeDriverRig = {
      rigGroup, seatAnchor, footL, footR, steerPivot, gripL, gripR,
      dashHousing, povEyeLocal, povLookLocal, drawBikeSpeedo, lastDashDraw: 0,
    };
  }

  // Interactive 3D Driver Seat + Rotating Steering Wheel with Left/Right Hand IK Grips for non-rickshaw cars
  let carDriverRig = null;
  if (!config.isRickshaw && !config.isBike) {
    const seatPresets = {
      bmw_m3:          { x:  0.36, y: 0.38, z: -0.12, wy: 0.24, wz: 0.42 },
      toyota_corolla:  { x:  0.34, y: 0.46, z:  0.08, wy: 0.30, wz: 0.42 },
      toyota_fortuner: { x: -0.38, y: 0.58, z:  0.08, wy: 0.26, wz: 0.44 },
      toyota_alphard:  { x: -0.38, y: 0.60, z:  0.34, wy: 0.26, wz: 0.44 },
      toyota_hiace:    { x: -0.38, y: 0.62, z:  0.84, wy: 0.26, wz: 0.44 },
      toyota_townace:  { x: -0.39, y: 0.84, z:  0.18, wy: 0.34, wz: 0.42 },
    };
    const sp = seatPresets[config.id] || { x: -0.36, y: 0.42, z: 0.0, wy: 0.24, wz: 0.42 };
    const seatX = sp.x;
    const seatY = sp.y;
    const seatZ = sp.z;

    const rigGroup = new THREE.Group();
    rigGroup.name = `DriverSteeringRig_${config.id}`;
    bodyTiltGroup.add(rigGroup);

    const seatAnchor = new THREE.Object3D();
    seatAnchor.position.set(seatX, seatY, seatZ);
    rigGroup.add(seatAnchor);

    const footL = new THREE.Object3D();
    footL.position.set(seatX + 0.13, Math.max(0.18, seatY - 0.22), seatZ + 0.54);
    rigGroup.add(footL);
    const footR = new THREE.Object3D();
    footR.position.set(seatX - 0.13, Math.max(0.18, seatY - 0.22), seatZ + 0.54);
    rigGroup.add(footR);

    // Visible 3D steering wheel right in front of the driver inside the cabin
    const wheelPivot = new THREE.Group();
    wheelPivot.position.set(seatX, seatY + sp.wy, seatZ + sp.wz);
    wheelPivot.rotation.x = 0.36;
    rigGroup.add(wheelPivot);

    const wheelSpin = new THREE.Group();
    wheelPivot.add(wheelSpin);

    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1e24, roughness: 0.45, metalness: 0.35 });
    const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.019, 10, 24), wheelMat);
    const hubMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.032, 16), wheelMat);
    hubMesh.rotation.x = Math.PI / 2;
    const spokeH = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.024, 0.018), wheelMat);
    const spokeV = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.15, 0.018), wheelMat);
    spokeV.position.y = -0.085;
    const topMarker = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.026, 0.026),
      new THREE.MeshStandardMaterial({ color: 0xd93829, roughness: 0.35 }),
    );
    topMarker.position.y = 0.175;
    if (!config.hasBuiltInSteeringWheel) {
      wheelSpin.add(rimMesh, hubMesh, spokeH, spokeV, topMarker);
    }

    const gripL = new THREE.Object3D();
    gripL.position.set(0.165, 0.025, -0.02);
    wheelSpin.add(gripL);
    const gripR = new THREE.Object3D();
    gripR.position.set(-0.165, 0.025, -0.02);
    wheelSpin.add(gripR);

    carDriverRig = { rigGroup, seatAnchor, footL, footR, wheelSpin, gripL, gripR };
  }

  // Realistic soft wispy radial-cloud tire-to-road friction smoke sprites
  const tireSmokePuffs = [];
  const smokeCanvas = document.createElement('canvas');
  smokeCanvas.width = 128;
  smokeCanvas.height = 128;
  const sCtx = smokeCanvas.getContext('2d');
  const blobs = [
    [64, 64, 52, 0.42], [46, 56, 36, 0.30], [82, 60, 34, 0.28],
    [58, 78, 34, 0.26], [70, 44, 30, 0.24], [44, 74, 28, 0.22],
  ];
  for (const [bx, by, br, ba] of blobs) {
    const g = sCtx.createRadialGradient(bx, by, 2, bx, by, br);
    g.addColorStop(0, `rgba(215, 218, 222, ${ba})`);
    g.addColorStop(0.55, `rgba(182, 188, 196, ${ba * 0.52})`);
    g.addColorStop(1, 'rgba(160, 166, 174, 0)');
    sCtx.fillStyle = g;
    sCtx.beginPath();
    sCtx.arc(bx, by, br, 0, Math.PI * 2);
    sCtx.fill();
  }
  const smokeTex = new THREE.CanvasTexture(smokeCanvas);
  let smokeCooldown = 0;

  function spawnTireFrictionPuff(worldX, worldY, worldZ) {
    if (tireSmokePuffs.length > 34) return;
    const mat = new THREE.SpriteMaterial({
      map: smokeTex,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      color: new THREE.Color(0xcbd1d9),
      rotation: Math.random() * Math.PI * 2,
    });
    const sp = new THREE.Sprite(mat);
    sp.position.set(worldX + (Math.random() - 0.5) * 0.14, worldY + 0.16, worldZ + (Math.random() - 0.5) * 0.14);
    sp.scale.setScalar(0.38 + Math.random() * 0.22);
    scene.add(sp);
    tireSmokePuffs.push({
      mesh: sp,
      age: 0,
      maxAge: 0.72 + Math.random() * 0.38,
      vx: (Math.random() - 0.5) * 0.85,
      vy: 0.38 + Math.random() * 0.36,
      vz: (Math.random() - 0.5) * 0.85,
      rotSpeed: (Math.random() - 0.5) * 1.4,
      startScale: 0.38 + Math.random() * 0.18,
    });
  }

  function updateTireSmoke(dt) {
    for (let i = tireSmokePuffs.length - 1; i >= 0; i--) {
      const p = tireSmokePuffs[i];
      p.age += dt;
      if (p.age >= p.maxAge) {
        scene.remove(p.mesh);
        p.mesh.material.dispose();
        tireSmokePuffs.splice(i, 1);
        continue;
      }
      const t = p.age / p.maxAge;
      const drag = Math.max(0, 1 - dt * 2.2);
      p.vx *= drag; p.vz *= drag;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.scale.setScalar(p.startScale + Math.pow(t, 0.72) * 1.75);
      p.mesh.material.rotation += p.rotSpeed * dt;
      p.mesh.material.opacity = Math.pow(1 - t, 1.8) * 0.28;
    }
  }
  let paintMaterials = [];
  let glossyMaterials = [];
  let carShadowMeshes = [];
  let tailMats = [];
  let drlMats = [];
  let currentQuality = 'high';
  let shadowInRange = true;
  let activeEnvMap = null;

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
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load(
    config.assetUrl,
    (gltf) => {
      const model = gltf.scene;
      model.updateMatrixWorld(true);

      if (config.hideMats && config.hideMats.length) {
        const hideSet = new Set(config.hideMats);
        model.traverse((ch) => {
          if (!ch.isMesh || !ch.material) return;
          const mats = Array.isArray(ch.material) ? ch.material : [ch.material];
          if (mats.some((mm) => hideSet.has(mm?.name || ''))) {
            ch.visible = false;
          }
        });
      }

      const orientedWrapper = new THREE.Group();
      orientedWrapper.add(model);

      if (config.rotateY) model.rotation.y = config.rotateY;
      if (config.rotateX) model.rotation.x = config.rotateX;
      if (config.rotateY || config.rotateX) model.updateMatrixWorld(true);

      const bounds = new THREE.Box3();
      orientedWrapper.traverse((ch) => {
        if (ch.isMesh && ch.visible) bounds.expandByObject(ch);
      });
      if (bounds.isEmpty()) bounds.setFromObject(orientedWrapper);
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
          child.castShadow = false;
          child.receiveShadow = firstName !== 'Meshesheadlight51Mtl' && firstName !== 'Mesheswindows1Mtl';

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
                opacity: 0.32,
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
              const trimMat = new THREE.MeshStandardMaterial({
                name: mName,
                color: mName === 'Meshespillars1Mtl' ? new THREE.Color('#15181d') : new THREE.Color('#eef2f6'),
                map: mat.map || null,
                roughness: 0.22,
                metalness: 0.48,
                envMapIntensity: 1.25,
                side: THREE.FrontSide,
              });
              return trimMat;
            }

            const cloned = mat.clone();
            if ('transmission' in cloned && cloned.transmission > 0) cloned.transmission = 0;
            if (!cloned.transparent && !cloned.alphaTest && /int|black|dash|seat|pillar|rim|tire|caliper|chrome|logo/i.test(mName)) {
              cloned.side = THREE.FrontSide;
            }
            cloned.envMapIntensity = 1.15;
            if (/chrome|rim|mirror|logo/i.test(mName) || (cloned.metalness ?? 0) >= 0.45) {
              glossyMaterials.push(cloned);
            }
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
            subRim.castShadow = false;
            subTire.castShadow = false;
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
        // Generic high-detail Sketchfab car setup (Toyota Alphard 2025, Toyota Corolla 2017, Toyota TownAce GL 2005, etc.)
        const bodySet = new Set(config.bodyPaintMats || []);
        const glassSet = new Set(config.glassMats || []);
        const tailSet = new Set(config.tailMats || []);
        const hlSet = new Set(config.headlightMats || []);
        const chromeSet = new Set(config.chromeMats || []);
        const rimSet = new Set(config.rimMats || []);
        const tireSet = new Set(config.tireMats || []);
        const dashGlowSet = new Set(config.dashGlowMats || []);
        const plateSet = new Set(config.plateMats || []);
        const clonedMatCache = new Map();

        let khulnaPlateTex = null;
        if (config.khulnaPlateText) {
          const pc = document.createElement('canvas');
          pc.width = 256;
          pc.height = 128;
          const pctx = pc.getContext('2d');
          pctx.fillStyle = '#f8fafc';
          pctx.fillRect(0, 0, 256, 128);
          pctx.strokeStyle = '#0f172a';
          pctx.lineWidth = 8;
          pctx.strokeRect(5, 5, 246, 118);
          pctx.fillStyle = '#065f46';
          pctx.fillRect(10, 10, 236, 12);
          pctx.fillStyle = '#0f172a';
          pctx.textAlign = 'center';
          pctx.font = 'bold 34px sans-serif';
          pctx.fillText(config.khulnaPlateText[0], 128, 64);
          pctx.font = 'bold 38px sans-serif';
          pctx.fillText(config.khulnaPlateText[1], 128, 108);
          khulnaPlateTex = new THREE.CanvasTexture(pc);
          khulnaPlateTex.colorSpace = THREE.SRGBColorSpace;
          khulnaPlateTex.anisotropy = 4;
        }

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
          const shouldCast = Boolean(config.isRickshaw) && !isGlass && (
            !config.shadowOnlyExterior || isBody || /hood|frame|wheel|spoke|seat/i.test(firstName)
          );

          child.castShadow = shouldCast && shadowInRange;
          child.receiveShadow = !isGlass;
          if (shouldCast) carShadowMeshes.push(child);

          const outMats = srcMats.map((mat) => {
            if (clonedMatCache.has(mat)) return clonedMatCache.get(mat);
            const mName = mat.name || '';
            let out;

            if (bodySet.has(mName)) {
              out = createBodyMaterial(mat, paintColorHex);
              if (config.id === 'toyota_townace') {
                out.metalness = 0.42;
                out.roughness = 0.15;
                out.clearcoat = 1.0;
                out.clearcoatRoughness = 0.05;
                out.envMapIntensity = 1.75;
              }
              paintMaterials.push(out);
              glossyMaterials.push(out);
            } else if (glassSet.has(mName)) {
              out = new THREE.MeshPhysicalMaterial({
                name: mName,
                color: new THREE.Color('#0c1724'),
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.34,
                depthWrite: false,
                metalness: 0.35,
                roughness: 0.06,
                clearcoat: 1.0,
                clearcoatRoughness: 0.04,
                reflectivity: 1.0,
                envMapIntensity: 1.85,
              });
              glossyMaterials.push(out);
            } else if (chromeSet.has(mName)) {
              out = new THREE.MeshPhysicalMaterial({
                name: mName,
                color: new THREE.Color('#eef4fa'),
                metalness: 0.96,
                roughness: 0.08,
                clearcoat: 0.8,
                envMapIntensity: 2.1,
              });
              glossyMaterials.push(out);
            } else if (rimSet.has(mName)) {
              out = createWheelMaterial(mat, '#dce7f3');
              glossyMaterials.push(out);
            } else if (tireSet.has(mName)) {
              out = new THREE.MeshStandardMaterial({
                name: mName,
                color: new THREE.Color('#1a1d22'),
                map: mat.map || null,
                normalMap: mat.normalMap || null,
                roughness: 0.82,
                metalness: 0.05,
                envMapIntensity: 0.55,
              });
            } else if (plateSet.has(mName) && khulnaPlateTex) {
              out = new THREE.MeshStandardMaterial({
                name: mName,
                map: khulnaPlateTex,
                roughness: 0.32,
                metalness: 0.25,
                envMapIntensity: 1.0,
              });
            } else if (dashGlowSet.has(mName)) {
              out = mat.clone();
              out.emissive = new THREE.Color('#38bdf8');
              out.emissiveIntensity = 1.15;
              out.roughness = 0.25;
            } else if (tailSet.has(mName)) {
              out = mat.clone();
              if ('transmission' in out && out.transmission > 0) out.transmission = 0;
              out.color = new THREE.Color('#d61424');
              out.emissive = new THREE.Color('#ff1228');
              out.emissiveIntensity = 2.1;
              tailMats.push(out);
            } else if (hlSet.has(mName)) {
              out = mat.clone();
              if ('transmission' in out && out.transmission > 0) out.transmission = 0;
              out.emissive = new THREE.Color('#f4f9ff');
              out.emissiveIntensity = 2.0;
              drlMats.push(out);
            } else {
              out = mat.clone();
              if ('transmission' in out && out.transmission > 0) out.transmission = 0;
              if (!config.isRickshaw && !out.transparent && !out.alphaTest
                && /int|leather|stitch|seat|dash|black|gray|dark|chrome|rim|tire|engine|brake|sunburst|carpet|wood/i.test(mName)) {
                out.side = THREE.FrontSide;
              }
              if ('envMapIntensity' in out) {
                out.envMapIntensity = /chrome|cr|rim|mirror/i.test(mName) ? 1.55 : 1.0;
                if (/chrome|cr|rim|mirror|wheel|alloy/i.test(mName) || (out.metalness ?? 0) >= 0.45) {
                  glossyMaterials.push(out);
                }
              }
            }
            if (out.map && out.map.anisotropy < 4) {
              out.map.anisotropy = 4;
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
            // Exact measured center of the green rubber handlebar grips in Steering_Assembly local space
            gripAnchorL = new THREE.Object3D();
            gripAnchorL.position.set(0.294, 0.245, -0.137);
            steering.add(gripAnchorL);
            gripAnchorR = new THREE.Object3D();
            gripAnchorR.position.set(-0.291, 0.245, -0.138);
            steering.add(gripAnchorR);
          }
          const saddleAnchor = new THREE.Object3D();
          // Attach to orientedWrapper (normalized world space) right on top-center of saddle_leather so pelvis covers saddle & hands easily grip handlebars!
          saddleAnchor.position.set(0, 1.09, -0.14);
          orientedWrapper.add(saddleAnchor);
          const passengerAnchor = new THREE.Object3D();
          passengerAnchor.position.set(0, 0.88, -0.78);
          orientedWrapper.add(passengerAnchor);
          const passengerFootL = new THREE.Object3D();
          passengerFootL.position.set(0.15, 0.59, -0.34);
          orientedWrapper.add(passengerFootL);
          const passengerFootR = new THREE.Object3D();
          passengerFootR.position.set(-0.15, 0.59, -0.34);
          orientedWrapper.add(passengerFootR);
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
            passengerFootL,
            passengerFootR,
            pedalFootL,
            pedalFootR,
          };
        } else if (config.isBike) {
          const res = rigMotorcycleWheels(orientedWrapper, config);
          riggedWheels = res.wheels;
          bikeFrontAssembly = res.frontAssemblyPivot || null;
          measuredWheelRadius = res.wheelRadius;
        } else {
          if (config.wheelNameRegex || config.wheelMatRegex) {
            const res = rigGenericCarWheels(orientedWrapper, config.wheelNameRegex, config.wheelMatRegex);
            riggedWheels = res.wheels;
            measuredWheelRadius = res.wheelRadius;
          }
        }
      }

      // Keep original full-detail exterior car geometry intact (black fade transition used instead of door animation)
      carDoors = {};

      // Batch all static chassis/interior child meshes by material (cuts 4,098 Alphard draw calls down to ~35!)
      const dynamicNodes = new Set();
      for (const w of riggedWheels) {
        w.wheelRoot?.traverse((o) => {
          if (o.isMesh) dynamicNodes.add(o);
        });
      }
      if (bikeFrontAssembly) {
        bikeFrontAssembly.traverse((o) => {
          if (o.isMesh) dynamicNodes.add(o);
        });
      }
      if (rickshawParts) {
        for (const v of Object.values(rickshawParts)) {
          if (v?.isObject3D) {
            v.traverse((o) => {
              if (o.isMesh) dynamicNodes.add(o);
            });
          }
        }
      }
      batchStaticCarMeshes(orientedWrapper, dynamicNodes);

      // Attach a single 24-triangle shadow hull proxy for non-rickshaw cars (saves millions of shadow triangles!)
      if (!config.isRickshaw) {
        const proxy = createCarShadowProxy(orientedWrapper);
        orientedWrapper.add(proxy);
        carShadowMeshes.push(proxy);
      }

      exteriorWrapper = orientedWrapper;
      bodyTiltGroup.add(orientedWrapper);
      state.loaded = true;
      setQualityMode(currentQuality);
      if (activeEnvMap) setEnvironmentMap(activeEnvMap);
      syncTransform();
    },
    undefined,
    (err) => {
      console.warn(`Could not load car model (${config.name}):`, err);
    },
  );

  const steerAxisY = new THREE.Vector3(0, 1, 0);
  const steerDeltaQ = new THREE.Quaternion();

  function applyDoorPose(door) {
    if (!door || !door.pivot) return;
    const amt = THREE.MathUtils.clamp(door.current, 0, 1);
    if (door.sliding) {
      const popOut = Math.min(1, amt * 3.5) * 0.11;
      door.pivot.position.set(
        door.restPos.x + door.side * popOut,
        door.restPos.y,
        door.restPos.z - amt * 0.80,
      );
    } else {
      door.pivot.rotation.y = door.side * amt * 1.10;
    }
  }

  function setDriverDoorOpen(amount) {
    if (amount === null || amount === undefined) {
      driverDoorOverride = null;
      return;
    }
    const clamped = THREE.MathUtils.clamp(amount, 0, 1);
    driverDoorOverride = clamped;
    if (carDoors.FL) {
      carDoors.FL.current = clamped;
      carDoors.FL.target = clamped > 0.05 ? 1 : 0;
      applyDoorPose(carDoors.FL);
    }
    if (clamped <= 0.001) driverDoorOverride = null;
  }

  function toggleDoor(key) {
    if (config.isRickshaw) return false;
    const door = carDoors[key];
    if (!door) return false;
    driverDoorOverride = null;
    const nextOpen = door.target < 0.5 ? 1 : 0;
    door.target = nextOpen;
    playDoorSound(nextOpen === 0);
    return nextOpen === 1;
  }

  function toggleAllDoors() {
    if (config.isRickshaw) return false;
    const list = Object.values(carDoors);
    if (!list.length) return false;
    driverDoorOverride = null;
    const anyClosed = list.some((d) => d.target < 0.5);
    const nextTarget = anyClosed ? 1 : 0;
    for (const d of list) d.target = nextTarget;
    playDoorSound(nextTarget === 0);
    return nextTarget === 1;
  }

  function getDoorStates() {
    const out = { FL: false, FR: false, RL: false, RR: false, anyOpen: false, allOpen: false, count: 0 };
    const keysList = ['FL', 'FR', 'RL', 'RR'];
    let openCount = 0;
    for (const k of keysList) {
      if (carDoors[k]) {
        out.count++;
        const isOpen = carDoors[k].target >= 0.5;
        out[k] = isOpen;
        if (isOpen) openCount++;
      }
    }
    out.anyOpen = openCount > 0;
    out.allOpen = out.count > 0 && openCount === out.count;
    return out;
  }

  function syncInteriorVisibility() {
    const inInterior = Boolean(state.driving && state.cameraMode === 'interior' && cockpitRig);
    if (cockpitRig) cockpitRig.group.visible = inInterior;
    if (exteriorWrapper) exteriorWrapper.visible = !inInterior;
  }

  function getInteriorCameraPose(outEye, outLook) {
    if (!cockpitRig) return false;
    root.updateMatrixWorld(true);
    outEye.copy(cockpitRig.getEyeLocal());
    outLook.copy(cockpitRig.getLookLocal());
    bodyTiltGroup.localToWorld(outEye);
    bodyTiltGroup.localToWorld(outLook);
    return true;
  }

  const anchorCache = {
    saddle: new THREE.Vector3(),
    passengerSeat: new THREE.Vector3(),
    passengerFootL: new THREE.Vector3(),
    passengerFootR: new THREE.Vector3(),
    pedalL: new THREE.Vector3(),
    pedalR: new THREE.Vector3(),
    gripL: new THREE.Vector3(),
    gripR: new THREE.Vector3(),
  };

  const carDriverAnchorCache = {
    seat: new THREE.Vector3(),
    footL: new THREE.Vector3(),
    footR: new THREE.Vector3(),
    gripL: new THREE.Vector3(),
    gripR: new THREE.Vector3(),
  };

  function getCarDriverAnchors() {
    if (!carDriverRig) return null;
    root.updateMatrixWorld(true);
    carDriverRig.seatAnchor.getWorldPosition(carDriverAnchorCache.seat);
    carDriverRig.footL.getWorldPosition(carDriverAnchorCache.footL);
    carDriverRig.footR.getWorldPosition(carDriverAnchorCache.footR);
    carDriverRig.gripL.getWorldPosition(carDriverAnchorCache.gripL);
    carDriverRig.gripR.getWorldPosition(carDriverAnchorCache.gripR);
    return carDriverAnchorCache;
  }

  function getBikeRiderAnchors() {
    if (!bikeDriverRig) return null;
    root.updateMatrixWorld(true);
    bikeDriverRig.seatAnchor.getWorldPosition(carDriverAnchorCache.seat);
    bikeDriverRig.footL.getWorldPosition(carDriverAnchorCache.footL);
    bikeDriverRig.footR.getWorldPosition(carDriverAnchorCache.footR);
    bikeDriverRig.gripL.getWorldPosition(carDriverAnchorCache.gripL);
    bikeDriverRig.gripR.getWorldPosition(carDriverAnchorCache.gripR);
    return carDriverAnchorCache;
  }

  function getBikePovCameraPose(outEye, outLook) {
    if (!bikeDriverRig) return false;
    root.updateMatrixWorld(true);
    outEye.copy(bikeDriverRig.povEyeLocal);
    outLook.copy(bikeDriverRig.povLookLocal);
    bodyTiltGroup.localToWorld(outEye);
    bodyTiltGroup.localToWorld(outLook);
    return true;
  }

  function getRickshawAnchors() {
    if (!rickshawParts) return null;
    root.updateMatrixWorld(true);
    rickshawParts.saddleAnchor.getWorldPosition(anchorCache.saddle);
    rickshawParts.passengerAnchor.getWorldPosition(anchorCache.passengerSeat);
    if (rickshawParts.passengerFootL) rickshawParts.passengerFootL.getWorldPosition(anchorCache.passengerFootL);
    if (rickshawParts.passengerFootR) rickshawParts.passengerFootR.getWorldPosition(anchorCache.passengerFootR);
    if (rickshawParts.pedalFootL) rickshawParts.pedalFootL.getWorldPosition(anchorCache.pedalL);
    if (rickshawParts.pedalFootR) rickshawParts.pedalFootR.getWorldPosition(anchorCache.pedalR);
    if (rickshawParts.gripAnchorL) rickshawParts.gripAnchorL.getWorldPosition(anchorCache.gripL);
    if (rickshawParts.gripAnchorR) rickshawParts.gripAnchorR.getWorldPosition(anchorCache.gripR);
    return anchorCache;
  }

  function syncTransform() {
    root.position.copy(state.pos);
    root.rotation.y = state.heading;
    bodyTiltGroup.position.y = config.isBike ? (state.frontSuspOffset * 0.42 + state.rearSuspOffset * 0.58) : 0;
    bodyTiltGroup.rotation.x = state.pitch;
    bodyTiltGroup.rotation.z = state.roll;
    if (carDriverRig) {
      carDriverRig.rigGroup.visible = state.driving && state.cameraMode !== 'interior';
      carDriverRig.wheelSpin.rotation.z = -state.steerAngle * 2.65;
    }
    if (bikeDriverRig) {
      bikeDriverRig.steerPivot.rotation.y = state.steerAngle * 0.95;
      bikeDriverRig.dashHousing.visible = state.driving && state.cameraMode === 'pov';
      if (bikeDriverRig.dashHousing.visible) {
        const nowD = performance.now();
        if (nowD - bikeDriverRig.lastDashDraw > 45) {
          bikeDriverRig.lastDashDraw = nowD;
          bikeDriverRig.drawBikeSpeedo(Math.abs(state.speed) * 3.6, state.rpm, state.gear);
        }
      }
    }
    if (bikeFrontAssembly) {
      bikeFrontAssembly.rotation.y = state.steerAngle * 0.95;
    }
    for (const d of Object.values(carDoors)) {
      applyDoorPose(d);
    }
    syncInteriorVisibility();
    if (cockpitRig && cockpitRig.group.visible) {
      cockpitRig.update(state);
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
      if (w.isFront && !w.parentSteers) {
        if (w.steerAxis === 'y') {
          w.wheelRoot.rotation.y = state.steerAngle;
        } else {
          w.wheelRoot.rotation.z = -state.steerAngle;
        }
      }
      if (config.isBike && typeof w.restY === 'number') {
        const suspComp = w.isFront ? state.frontSuspOffset : state.rearSuspOffset;
        w.wheelRoot.position.y = w.restY - suspComp * 0.72;
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
    cockpitRig?.setPaintColor(preset.hex);
    return preset;
  }

  function cycleCameraMode() {
    const order = config.isBike ? ['chase', 'pov', 'front'] : ['chase', 'hood', 'front'];
    const idx = order.indexOf(state.cameraMode);
    state.cameraMode = order[(idx + 1) % order.length];
    syncInteriorVisibility();
    return state.cameraMode;
  }

  function setCameraMode(mode) {
    const allowed = config.isBike ? ['chase', 'pov', 'front'] : ['chase', 'hood', 'front'];
    if (allowed.includes(mode)) {
      state.cameraMode = mode;
      syncInteriorVisibility();
    }
    return state.cameraMode;
  }

  function enterCar(seatMode = 'driver') {
    state.driving = true;
    state.cameraMode = 'chase';
    state.rideSeat = (config.isRickshaw && seatMode === 'passenger') ? 'passenger' : 'driver';
    ensureAudio();
    for (const m of drlMats) m.emissiveIntensity = 4.5;
    syncInteriorVisibility();
  }

  function toggleRideSeat() {
    if (!config.isRickshaw || !state.driving) return state.rideSeat;
    state.rideSeat = state.rideSeat === 'passenger' ? 'driver' : 'passenger';
    return state.rideSeat;
  }

  function exitCar(playerPos) {
    state.driving = false;
    state.rideSeat = 'driver';
    syncInteriorVisibility();
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
          ? '[G] রিকশা থেকে নামুন · [F] সামনের ড্রাইভার সিটে যান'
          : '[F] রিকশা থেকে নামুন · [G] পেছনের প্যাসেঞ্জার সিটে বসুন';
      }
      if (config.isBike) {
        return `[F] ${state.name} বাইক থেকে নামুন · [V] POV স্পিডোমিটার`;
      }
      return `[F] ${state.name} গাড়ি থেকে নামুন · [E] গেট খুলুন`;
    }
    if (isPlayerNear(playerPos)) {
      if (config.isRickshaw) {
        return '[F] সামনের সিটে উঠে চালান (Drive) · [G] পেছনের প্যাসেঞ্জার সিটে বসুন (Sit)';
      }
      if (config.isBike) {
        return `[F] ${state.name} বাইকে উঠুন ও চালান (Ride Bike)`;
      }
      return `[F] ${state.name} গাড়িতে উঠুন ও চালান (Drive ${state.name})`;
    }
    return null;
  }

  const fwd = new THREE.Vector3();
  const rgt = new THREE.Vector3();

  function update(delta, keys, houseRef, envRef, allCars = []) {
    const dt = Math.min(delta, 0.05);
    if (tireSmokePuffs.length > 0) updateTireSmoke(dt);

    // Smoothly animate all 4 doors whether parked or driving
    for (const d of Object.values(carDoors)) {
      if (d.key === 'FL' && driverDoorOverride !== null) continue;
      d.current = THREE.MathUtils.lerp(d.current, d.target, Math.min(1, dt * 8.5));
      if (Math.abs(d.current - d.target) < 0.002) d.current = d.target;
    }

    const isPassengerSitting = config.isRickshaw && state.rideSeat === 'passenger';
    if (!state.driving || isPassengerSitting) {
      let moved = false;
      if (Math.abs(state.speed) > 0.05) {
        state.speed *= Math.max(0, 1 - dt * 4.2);
        fwd.set(Math.sin(state.heading), 0, Math.cos(state.heading));
        state.pos.addScaledVector(fwd, state.speed * dt);
        state.wheelSpin += (state.speed / measuredWheelRadius) * dt;
        applyCarCollisions(houseRef, envRef, allCars);
        moved = true;
      } else if (state.speed !== 0) {
        state.speed = 0;
        moved = true;
      }
      if (Math.abs(state.pitch) > 0.001 || Math.abs(state.roll) > 0.001 || Math.abs(state.frontSuspOffset) > 0.0005 || Math.abs(state.rearSuspOffset) > 0.0005) {
        state.pitch = THREE.MathUtils.lerp(state.pitch, 0, Math.min(1, dt * 8));
        state.roll = THREE.MathUtils.lerp(state.roll, 0, Math.min(1, dt * 8));
        state.frontSuspOffset = THREE.MathUtils.lerp(state.frontSuspOffset, 0, Math.min(1, dt * 10));
        state.rearSuspOffset = THREE.MathUtils.lerp(state.rearSuspOffset, 0, Math.min(1, dt * 12));
        state.frontSuspVel = 0;
        state.rearSuspVel = 0;
        moved = true;
      }
      updateEngineAudio(false, 920, 0);
      if (moved || isPassengerSitting) syncTransform();
      return;
    }

    const throttle = (keys.has('KeyW') || keys.has('ArrowUp')) ? 1 : 0;
    const brake = (keys.has('KeyS') || keys.has('ArrowDown')) ? 1 : 0;
    const steerInput = (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0)
      - (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0);
    const handbrake = keys.has('Space');
    const shiftPressed = keys.has('ShiftLeft') || keys.has('ShiftRight');
    let boost = 1.0;
    if (config.isRickshaw) {
      if (state.boostCooldown > 0) {
        state.boostCooldown = Math.max(0, state.boostCooldown - dt);
        state.standingPedal = false;
        if (state.boostCooldown <= 0) state.boostStamina = 10.0;
      } else if (shiftPressed && throttle > 0 && state.boostStamina > 0) {
        state.standingPedal = true;
        state.boostStamina = Math.max(0, state.boostStamina - dt);
        if (state.boostStamina <= 0) {
          state.standingPedal = false;
          state.boostCooldown = 20.0;
        }
      } else {
        state.standingPedal = false;
        if (state.boostStamina < 10.0) {
          state.boostStamina = Math.min(10.0, state.boostStamina + 0.5 * dt);
        }
      }
      state.standingBlend = THREE.MathUtils.lerp(state.standingBlend, state.standingPedal ? 1.0 : 0.0, Math.min(1, dt * 7.5));
      boost = state.standingPedal ? 1.55 : 1.0;
    } else {
      boost = shiftPressed && throttle > 0 ? 1.42 : 1.0;
    }

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

    const wheelRadius = measuredWheelRadius;
    state.wheelSpin += (state.speed / wheelRadius) * dt;

    // Tire-to-road friction smoke on hard launch, hard braking, or handbrake drifting
    if (!config.isRickshaw) {
      smokeCooldown = Math.max(0, smokeCooldown - dt);
      const hardLaunch = throttle > 0 && boost > 1.0 && Math.abs(state.speed) < 6.5;
      const hardBrake = (brake > 0 || handbrake) && Math.abs(state.speed) > 6.5;
      if ((isDrifting || hardLaunch || hardBrake) && smokeCooldown <= 0) {
        smokeCooldown = isDrifting ? 0.045 : 0.085;
        const rearDist = state.halfLength * 0.62;
        const trackHalf = state.halfWidth * 0.78;
        for (const side of [-1, 1]) {
          spawnTireFrictionPuff(
            state.pos.x - fwd.x * rearDist + rgt.x * trackHalf * side,
            state.pos.y,
            state.pos.z - fwd.z * rearDist + rgt.z * trackHalf * side,
          );
        }
      }
    }
    if (config.isRickshaw) {
      const pedalRate = (throttle > 0 || state.speed > 0.15)
        ? Math.max(throttle * 3.8, (state.speed / wheelRadius) * 0.72)
        : (state.speed < -0.15 ? (state.speed / wheelRadius) * 0.5 : 0);
      state.pedalPhase += pedalRate * dt;
    }
    if (config.isBike) {
      // Realistic visibly workable Front Telescopic Fork Suspension (compresses on brake/bumps & rebounds smoothly, zero rear hopping!)
      state.roadTravelDist += Math.abs(state.speed) * dt;
      const speedBlend = THREE.MathUtils.clamp(Math.abs(state.speed) / 10.0, 0, 1);
      const frontRoadBump = (Math.sin(state.roadTravelDist * 1.9) * 0.024 + Math.sin(state.roadTravelDist * 4.3) * 0.012) * speedBlend;
      const rearRoadBump = Math.sin((state.roadTravelDist - 1.38) * 1.9) * 0.006 * speedBlend;
      const frontBrakeDive = (brake > 0 || handbrake) && state.speed > 0.9 ? -0.078 : (throttle > 0 ? 0.028 : 0);
      const rearAccelSquat = throttle > 0 ? -0.016 : 0;
      const targetFrontSusp = THREE.MathUtils.clamp(frontBrakeDive + frontRoadBump, -0.088, 0.044);
      const targetRearSusp = THREE.MathUtils.clamp(rearAccelSquat + rearRoadBump, -0.024, 0.014);

      const fForce = (targetFrontSusp - state.frontSuspOffset) * 78.0 - state.frontSuspVel * 10.5;
      state.frontSuspVel += fForce * dt;
      state.frontSuspOffset = THREE.MathUtils.clamp(state.frontSuspOffset + state.frontSuspVel * dt, -0.092, 0.048);

      // Critically over-damped rear mono-shock: smooth planted ride, zero rear hopping!
      state.rearSuspOffset = THREE.MathUtils.lerp(state.rearSuspOffset, targetRearSusp, Math.min(1, dt * 11.0));
    }
    const suspPitch = config.isBike ? THREE.MathUtils.clamp((state.rearSuspOffset - state.frontSuspOffset) * 1.05, -0.085, 0.075) : 0;
    const targetPitch = config.isBike
      ? THREE.MathUtils.clamp(-accel * 0.0024 + suspPitch, -0.075, 0.065)
      : THREE.MathUtils.clamp(-accel * 0.0022, -0.045, 0.045);
    const pedalSway = config.isRickshaw ? Math.sin(state.pedalPhase) * 0.028 * Math.min(1, Math.abs(state.speed) / 2.5) : 0;
    const targetRoll = config.isBike
      ? THREE.MathUtils.clamp(-turnRate * Math.min(Math.abs(state.speed), 24) * 0.017, -0.40, 0.40)
      : THREE.MathUtils.clamp(-turnRate * state.speed * 0.0025 + pedalSway, -0.065, 0.065);
    state.pitch = THREE.MathUtils.lerp(state.pitch, targetPitch, Math.min(1, dt * 10));
    state.roll = THREE.MathUtils.lerp(state.roll, targetRoll, Math.min(1, dt * (config.isBike ? 7.5 : 10)));

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

  function syncShadowCasters() {
    const castNow = shadowInRange;
    for (const mesh of carShadowMeshes) {
      if (mesh.castShadow !== castNow) mesh.castShadow = castNow;
    }
  }

  function setQualityMode(nextQuality) {
    currentQuality = nextQuality;
    const envIntensity = nextQuality === 'ultra' ? 2.1 : (nextQuality === 'high' ? 1.7 : (nextQuality === 'medium' ? 1.35 : 1.2));
    const clearcoatVal = nextQuality === 'low' ? 0.65 : 1.0;

    syncShadowCasters();
    for (const mesh of carShadowMeshes) {
      if (mesh.name !== 'CarShadowProxy') {
        mesh.receiveShadow = true;
      }
    }
    for (const mat of glossyMaterials) {
      if ('envMapIntensity' in mat) mat.envMapIntensity = envIntensity;
      if ('clearcoat' in mat) mat.clearcoat = clearcoatVal;
      mat.needsUpdate = true;
    }
    contactShadow.visible = nextQuality === 'low' || nextQuality === 'medium';
  }

  function setEnvironmentMap(envTex) {
    activeEnvMap = envTex || null;
    for (const mat of glossyMaterials) {
      if ('envMap' in mat && mat.envMap !== activeEnvMap) {
        mat.envMap = activeEnvMap;
        mat.needsUpdate = true;
      }
    }
  }

  function setVisibilityAndShadow(visible, nearShadow) {
    if (root.visible !== visible) root.visible = visible;
    const wantShadow = Boolean(visible && nearShadow);
    if (shadowInRange !== wantShadow) {
      shadowInRange = wantShadow;
      syncShadowCasters();
    }
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
    setCameraMode,
    toggleDoor,
    toggleAllDoors,
    getDoorStates,
    getInteriorCameraPose,
    playHorn,
    playDoorSound,
    playSeatbeltSound,
    setDriverDoorOpen,
    getRickshawAnchors,
    getCarDriverAnchors,
    getBikeRiderAnchors,
    getBikePovCameraPose,
    spawnAt(x, z, heading = 0) {
      state.pos.set(x, 0.01, z);
      state.heading = heading;
      state.speed = 0;
      state.lateralVel = 0;
      state.steerAngle = 0;
      state.pitch = 0;
      state.roll = 0;
      syncTransform();
    },
    setVisibilityAndShadow,
    setEnvironmentMap,
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
