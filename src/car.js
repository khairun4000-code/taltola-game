import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TALTOLA_HOUSE_OFFSET } from './khulna-geo.js';
import { rigAllCarDoors, createInteriorCockpitRig } from './car-interior.js';
import { loadHighQualityTata2515 } from './tata-2515-truck.js';

// Mastered GTA VI-grade real pedal-drivetrain multi-stem audio assets (shared across Bicycle, Rickshaw & Van!)
const BICYCLE_AUDIO_URLS = {
  cruise: './assets/audio/bicycle_pedal_cruise.wav?v=2',
  sprint: './assets/audio/bicycle_pedal_sprint.wav?v=2',
  fwMid: './assets/audio/bicycle_freewheel_mid.wav?v=2',
  fwFast: './assets/audio/bicycle_freewheel_fast.wav?v=2',
  engage: './assets/audio/bicycle_pedal_engage.wav?v=2',
};
let bicycleAudioRawPromise = null;
function loadBicycleAudioRawBuffers() {
  if (!bicycleAudioRawPromise) {
    const entries = Object.entries(BICYCLE_AUDIO_URLS);
    bicycleAudioRawPromise = Promise.all(
      entries.map(async ([key, url]) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return [key, null];
          return [key, await res.arrayBuffer()];
        } catch {
          return [key, null];
        }
      }),
    ).then((pairs) => Object.fromEntries(pairs));
  }
  return bicycleAudioRawPromise;
}

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

export const PRIUS_PAINT_PRESETS = [
  { name: 'Blizzard Pearl White', hex: '#eef2f6' },
  { name: 'Midnight Black', hex: '#15181e' },
  { name: 'Barcelona Red', hex: '#b31824' },
  { name: 'Nautical Blue', hex: '#183c7a' },
  { name: 'Classic Silver', hex: '#b4bcc4' },
  { name: 'Sea Glass Pearl', hex: '#7a9490' },
];

export const NISSAN_SUNNY_PAINT_PRESETS = [
  { name: 'Classic Silver Metallic', hex: '#b4bcc6' },
  { name: 'Pearl White', hex: '#eef2f6' },
  { name: 'Midnight Black', hex: '#181a20' },
  { name: 'Sapphire Blue', hex: '#1b3f7a' },
  { name: 'Ruby Red', hex: '#9e1622' },
  { name: 'Champagne Gold', hex: '#c8b694' },
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

export const CNG_PAINT_PRESETS = [
  { name: 'Dhaka/Khulna Green', hex: '#ffffff' },
  { name: 'Emerald Green', hex: '#d4ffe2' },
  { name: 'Golden Yellow', hex: '#fff0c4' },
  { name: 'Sky Blue', hex: '#d4e8ff' },
  { name: 'Crimson Red', hex: '#ffd6d6' },
];

export const BICYCLE_PAINT_PRESETS = [
  { name: 'Atlas Jet Black', hex: '#101318' },
  { name: 'Heritage Green', hex: '#0f4c32' },
  { name: 'Royal Maroon', hex: '#7f1d1d' },
  { name: 'Navy Blue', hex: '#162d54' },
  { name: 'Vintage Silver', hex: '#8b95a5' },
];

export const VAN_PAINT_PRESETS = [
  { name: 'Classic Red & Green', hex: '#ffffff' },
  { name: 'Khulna Brick Red', hex: '#f2cccc' },
  { name: 'Forest Green', hex: '#ccebd6' },
  { name: 'Golden Teak', hex: '#f7e5c1' },
  { name: 'Royal Blue', hex: '#cce0f7' },
];

export const VAN_CORNER_SEAT_SPECS = [
  {
    id: 'front_left',
    label: 'Front-Left Corner',
    seat: [0.34, 0.915, -0.22],
    footL: [0.58, 0.38, -0.29],
    footR: [0.58, 0.38, -0.13],
    dismount: [1.05, 0, -0.22],
    yawOffset: Math.PI * 0.5,
  },
  {
    id: 'front_right',
    label: 'Front-Right Corner',
    seat: [-0.34, 0.915, -0.22],
    footL: [-0.58, 0.38, -0.13],
    footR: [-0.58, 0.38, -0.29],
    dismount: [-1.05, 0, -0.22],
    yawOffset: -Math.PI * 0.5,
  },
  {
    id: 'rear_left',
    label: 'Rear-Left Corner',
    seat: [0.26, 0.915, -1.06],
    footL: [0.16, 0.38, -1.30],
    footR: [0.36, 0.38, -1.30],
    dismount: [0.48, 0, -1.58],
    yawOffset: Math.PI,
  },
  {
    id: 'rear_right',
    label: 'Rear-Right Corner',
    seat: [-0.26, 0.915, -1.06],
    footL: [-0.36, 0.38, -1.30],
    footR: [-0.16, 0.38, -1.30],
    dismount: [-0.48, 0, -1.58],
    yawOffset: Math.PI,
  },
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
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 1.18, 0.01, TALTOLA_HOUSE_OFFSET.z - 10.3],
    spawnHeading: 0.0,
    paintPresets: BMW_PAINT_PRESETS,
    gearCount: 8,
    maxSpeed: 44.5,
    boostMaxSpeed: 52.8,
    engineForce: 16.8,
    engineBaseFreq: 44,
    engineRangeFreq: 165,
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
    soundProfile: 'sports_i6',
  },
  {
    id: 'toyota_alphard',
    name: 'Toyota Alphard 2025',
    badge: 'TOYOTA ALPHARD 2025',
    assetUrl: './assets/toyota_alphard.glb',
    targetLength: 4.92,
    width: 1.92,
    rotateY: -Math.PI / 2, // Raw Alphard faces +X; rotate -90 deg Y so it faces +Z
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 1.15, 0.01, TALTOLA_HOUSE_OFFSET.z - 22.0],
    spawnHeading: 0.0,
    paintPresets: ALPHARD_PAINT_PRESETS,
    bodyPaintMats: ['C_089'],
    glassMats: ['C_ClearGlass', 'C_PV_Glass', 'C_IR_GreenGlass__1', 'C_SmokeGlass_GR003', 'C_SuriGlass'],
    tailMats: ['C_red_glass'],
    headlightMats: ['C_13TR01__headlight_3'],
    wheelMatRegex: /^C_tire$/i,
    gearCount: 7,
    maxSpeed: 50.0,
    boostMaxSpeed: 53.5,
    engineForce: 16.5,
    engineBaseFreq: 34,
    engineRangeFreq: 118,
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
    soundProfile: 'luxury_v6',
  },
  {
    id: 'toyota_corolla',
    name: 'Toyota Corolla 2017',
    badge: 'TOYOTA COROLLA 2017',
    assetUrl: './assets/toyota_corolla_game_ready.glb?v=4',
    targetLength: 4.55,
    width: 1.82,
    rotateY: Math.PI, // Game-ready GLB faces -Z; rotate 180deg so front faces +Z
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 1.18, 0.01, TALTOLA_HOUSE_OFFSET.z + 6.4],
    spawnHeading: 0.0,
    paintPresets: COROLLA_PAINT_PRESETS,
    bodyPaintMats: ['body'],
    glassMats: ['d_glass', 'glass'],
    tailMats: ['emit_taillight', 'emit_brake'],
    headlightMats: ['emit_headlight', 'emit_fog'],
    chromeMats: ['chrome', 'int_chrome'],
    dashGlowMats: ['tex_gauges', 'tex_console'],
    khulnaPlateText: ['খুলনা মেট্রো-গ', '১২-৪৫৭৮'],
    khulnaPlatePos: { front: [0, 0.43, 2.27], rear: [0, 0.66, -2.27] },
    hasBuiltInSteeringWheel: true,
    isGameReadyCorolla: true,
    exhaustTip: [-0.54, 0.27, -2.18],
    wheelNameRegex: /wheel|brakedisc/i,
    gearCount: 6,
    maxSpeed: 52.8,
    boostMaxSpeed: 56.5,
    engineForce: 17.5,
    engineBaseFreq: 38,
    engineRangeFreq: 135,
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
    soundProfile: 'sedan_i4',
  },
  {
    id: 'toyota_prius',
    name: 'Toyota Prius 2012',
    badge: 'TOYOTA PRIUS 2012',
    assetUrl: './assets/toyota_prius_game_ready.glb?v=4',
    targetLength: 4.48,
    width: 1.76,
    rotateY: Math.PI, // Game-ready GLB faces -Z; rotate 180deg so front faces +Z
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 1.18, 0.01, TALTOLA_HOUSE_OFFSET.z + 0.8],
    spawnHeading: 0.0,
    paintPresets: PRIUS_PAINT_PRESETS,
    bodyPaintMats: ['Color.002'],
    glassMats: ['Windows.002'],
    tailMats: ['Brake.005', 'Light0041Mtl', 'Lightglass0031Mtl.002'],
    headlightMats: ['Headlight', 'Head_light.001'],
    reverseMats: ['Reverse.005'],
    chromeMats: ['Mirror.002', 'guong_trong.002'],
    dashGlowMats: ['Interiorbadge1Mtl'],
    khulnaPlateText: ['খুলনা মেট্রো-গ', '১৫-২০১২'],
    hasBuiltInSteeringWheel: true,
    isGameReadyPrius: true,
    exhaustTip: [-0.46, 0.24, -2.10],
    gearCount: 6,
    maxSpeed: 50.0,
    boostMaxSpeed: 53.0,
    engineForce: 16.8,
    engineBaseFreq: 35,
    engineRangeFreq: 105,
    hornFreqs: [440, 554],
    camBack: 5.4,
    camHeight: 2.12,
    hoodHeight: 1.24,
    hoodForward: 0.72,
    isBMW: false,
    doorRegexMap: {
      FL: /^Door_FL$/i,
      FR: /^Door_FR$/i,
      RL: /^Door_RL$/i,
      RR: /^Door_RR$/i,
    },
    soundProfile: 'hybrid_ecvt',
  },
  {
    id: 'nissan_sunny',
    name: 'Nissan Sunny (N16) 2000',
    badge: 'NISSAN SUNNY N16 2000',
    assetUrl: './assets/nissan_sunny_game_ready.glb',
    targetLength: 4.50,
    width: 1.76,
    rotateY: Math.PI, // Game-ready GLB faces -Z; rotate 180 deg Y so it faces +Z in-game
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 1.18, 0.01, TALTOLA_HOUSE_OFFSET.z - 4.8],
    spawnHeading: 0.0,
    groundOffset: 0.0,
    exhaustTip: [-0.447, 0.253, -2.145],
    builtInSteeringNode: 'Steering_Wheel',
    paintPresets: NISSAN_SUNNY_PAINT_PRESETS,
    bodyPaintMats: ['Nissan_Metallic_Paint'],
    glassMats: ['Window_Tinted_Glass'],
    tailMats: ['emit_taillight', 'emit_brake'],
    headlightMats: ['emit_headlight', 'emit_fog'],
    chromeMats: ['Chrome_Polished'],
    dashGlowMats: ['tex_gauges', 'tex_console'],
    hasBuiltInSteeringWheel: true,
    wheelNameRegex: /^Wheel_(FL|FR|RL|RR)$/i,
    gearCount: 5,
    maxSpeed: 48.6,
    boostMaxSpeed: 51.5,
    engineForce: 15.8,
    engineBaseFreq: 40,
    engineRangeFreq: 132,
    hornFreqs: [430, 540],
    camBack: 5.4,
    camHeight: 2.12,
    hoodHeight: 1.24,
    hoodForward: 0.72,
    isBMW: false,
    hasNativeDoors: true,
    doorRegexMap: {
      FL: /^Door_FL$/i,
      FR: /^Door_FR$/i,
      RL: /^Door_RL$/i,
      RR: /^Door_RR$/i,
    },
    soundProfile: 'compact_i4',
  },
  {
    id: 'toyota_land_cruiser',
    name: 'Toyota Land Cruiser LC300 VXR',
    badge: 'TOYOTA LAND CRUISER LC300 VXR',
    assetUrl: './assets/toyota_land_cruiser_lc300.glb',
    targetLength: 5.00,
    width: 2.10,
    rotateY: 0,
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 1.12, 0.01, TALTOLA_HOUSE_OFFSET.z + 12.2],
    spawnHeading: 0.0,
    groundOffset: 0.0,
    exhaustTip: [-0.62, 0.30, -2.42],
    paintPresets: FORTUNER_PAINT_PRESETS,
    bodyPaintMats: ['CarPaint'],
    glassMats: ['ClearGlass', 'Light_glass'],
    tailMats: ['Light_Red_Back', 'Light_Red_Back_Lower', 'BackSpotLight'],
    headlightMats: ['SpotLight', 'LC300_Headlight_LED'],
    reverseMats: ['Light_White_Back'],
    chromeMats: ['Chrome', 'Mirror'],
    dashGlowMats: ['Screens', 'Buttons'],
    wheelNameRegex: /^Wheel_(FL|FR|RL|RR)$/i,
    hasNativeDoors: true,
    gearCount: 7,
    maxSpeed: 58.3,
    boostMaxSpeed: 62.5,
    engineForce: 20.5,
    engineBaseFreq: 30,
    engineRangeFreq: 122,
    hornFreqs: [360, 450],
    camBack: 6.1,
    camHeight: 2.55,
    hoodHeight: 1.52,
    hoodForward: 0.72,
    isBMW: false,
    doorRegexMap: {
      FL: /^Door_FL$/i,
      FR: /^Door_FR$/i,
      RL: /^Door_RL$/i,
      RR: /^Door_RR$/i,
    },
    soundProfile: 'suv_v6',
  },
  {
    id: 'toyota_fortuner',
    name: 'Toyota Fortuner 2021',
    badge: 'TOYOTA FORTUNER 2021',
    assetUrl: './assets/toyota_fortuner.glb',
    targetLength: 4.80,
    width: 1.90,
    rotateY: 0, // Raw Fortuner already faces +Z
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 1.15, 0.01, TALTOLA_HOUSE_OFFSET.z - 16.0],
    spawnHeading: 0.0,
    paintPresets: FORTUNER_PAINT_PRESETS,
    bodyPaintMats: ['carpaint'],
    glassMats: ['windows_glass', 'r_glass'],
    tailMats: ['r_tailight', 'ind_tailighjt'],
    headlightMats: ['indicator_signal', 'indicator_arrow'],
    wheelNameRegex: /^WHEEL_(LF|RF|LR|RR)$/i,
    gearCount: 6,
    maxSpeed: 51.4,
    boostMaxSpeed: 55.0,
    engineForce: 17.8,
    engineBaseFreq: 28,
    engineRangeFreq: 110,
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
    soundProfile: 'suv_diesel',
  },
  {
    id: 'toyota_hiace',
    name: 'Toyota HiAce 2005',
    badge: 'TOYOTA HIACE 2005',
    assetUrl: './assets/toyota_hiace.glb',
    targetLength: 4.85,
    width: 1.88,
    rotateY: -Math.PI / 2, // Raw HiAce grill faces +X; rotate -90 deg Y so it faces +Z
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 1.15, 0.01, TALTOLA_HOUSE_OFFSET.z - 28.0],
    spawnHeading: 0.0,
    paintPresets: HIACE_PAINT_PRESETS,
    bodyPaintMats: ['paint'],
    glassMats: ['glass', 'glass2'],
    tailMats: [],
    headlightMats: [],
    wheelNameRegex: /hiace_wheel/i,
    gearCount: 5,
    maxSpeed: 41.7,
    boostMaxSpeed: 44.5,
    engineForce: 14.5,
    engineBaseFreq: 30,
    engineRangeFreq: 102,
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
    soundProfile: 'van_diesel',
  },
  {
    id: 'toyota_townace',
    name: 'Toyota TownAce GL 2005',
    badge: 'TOYOTA TOWNACE GL 2005',
    assetUrl: './assets/toyota_townace.glb',
    targetLength: 4.50,
    width: 1.78,
    rotateY: 0, // Raw TownAce already faces +Z
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 1.18, 0.01, TALTOLA_HOUSE_OFFSET.z - 33.8],
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
    hasBuiltInSteeringWheel: false,
    wheelNameRegex: /^Cylinder(\.?\d+)?$/i,
    gearCount: 5,
    maxSpeed: 40.3,
    boostMaxSpeed: 43.0,
    engineForce: 14.0,
    engineBaseFreq: 34,
    engineRangeFreq: 108,
    hornFreqs: [400, 505],
    camBack: 5.8,
    camHeight: 2.42,
    hoodHeight: 1.52,
    hoodForward: 1.15,
    isBMW: false,
    soundProfile: 'van_petrol',
  },
  {
    id: 'bangladeshi_rickshaw_taltola',
    name: 'Bangladeshi Rickshaw',
    badge: 'BANGLADESHI RICKSHAW',
    assetUrl: './assets/bangladeshi_rickshaw.glb',
    targetLength: 2.44,
    width: 1.04,
    rotateY: 0,
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 1.40, 0.01, TALTOLA_HOUSE_OFFSET.z - 48.2],
    spawnHeading: 0.0,
    paintPresets: RICKSHAW_PAINT_PRESETS,
    maxSpeed: 7.2,
    boostMaxSpeed: 9.5,
    engineForce: 9.2,
    camBack: 3.45,
    camHeight: 2.02,
    hoodHeight: 1.68,
    hoodForward: 0.14,
    isBMW: false,
    isRickshaw: true,
    soundProfile: 'pedal_rickshaw',
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
    maxSpeed: 7.2,
    boostMaxSpeed: 9.5,
    engineForce: 9.2,
    camBack: 3.45,
    camHeight: 2.02,
    hoodHeight: 1.68,
    hoodForward: 0.14,
    isBMW: false,
    isRickshaw: true,
    soundProfile: 'pedal_rickshaw',
  },
  {
    id: 'bike_125cc',
    name: '125cc Naked Sport',
    badge: '125CC NAKED MOTORCYCLE',
    assetUrl: './assets/bike_125cc.glb?v=2',
    targetLength: 2.08,
    width: 0.76,
    rotateY: 0,
    rotateX: 0.071,
    hideMats: ['ground'],
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 1.50, 0.006, TALTOLA_HOUSE_OFFSET.z - 1.2],
    spawnHeading: 0.0,
    paintPresets: BIKE_PAINT_PRESETS,
    maxSpeed: 31.9,
    boostMaxSpeed: 35.0,
    engineForce: 18.5,
    engineBaseFreq: 58,
    engineRangeFreq: 210,
    hornFreqs: [520, 660],
    camBack: 3.90,
    camHeight: 1.86,
    hoodHeight: 1.40,
    hoodForward: 0.10,
    exhaustTip: [-0.178, 0.422, -0.805],
    isBMW: false,
    isBike: true,
    bikeSportLean: true,
    bikeSplitMergedWheels: false,
    bikeRig: {
      seat: [0, 1.00, -0.27],
      footL: [0.165, 0.425, 0.015],
      footR: [-0.165, 0.425, 0.015],
      steerPivot: [0, 1.02, 0.38],
      gripL: [0.248, 0.044, -0.128],
      gripR: [-0.248, 0.044, -0.128],
      headlight: { pos: [0, 0.918, 0.592], radius: 0.072, shape: 'round' },
      taillight: { pos: [0, 0.821, -0.912], width: 0.116, height: 0.042 },
      frontDisc: { sideX: -0.047, radius: 0.122 },
      dash: [0, 1.12, 0.46],
      povEye: [0, 1.56, -0.38],
      povLook: [0, 1.24, 2.6],
    },
    gearCount: 5,
    soundProfile: 'bike_sport',
  },
  {
    id: 'honda_nxr_bros',
    name: 'Honda NXR Bros 2003',
    badge: 'HONDA NXR BROS 2003',
    assetUrl: './assets/honda_nxr_bros.glb',
    targetLength: 2.12,
    width: 0.82,
    rotateY: Math.PI,
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 1.45, 0.01, TALTOLA_HOUSE_OFFSET.z - 44.9],
    spawnHeading: 0.0,
    paintPresets: BIKE_PAINT_PRESETS,
    bodyPaintMats: ['FairingGasTank'],
    maxSpeed: 30.6,
    boostMaxSpeed: 33.5,
    engineForce: 17.2,
    engineBaseFreq: 50,
    engineRangeFreq: 185,
    hornFreqs: [480, 610],
    camBack: 4.00,
    camHeight: 1.92,
    hoodHeight: 1.46,
    hoodForward: 0.08,
    exhaustTip: [-0.120, 0.805, -0.892],
    isBMW: false,
    isBike: true,
    bikeSportLean: false,
    bikeSplitMergedWheels: true,
    bikeRig: {
      seat: [0, 1.01, -0.26],
      footL: [0.175, 0.420, 0.00],
      footR: [-0.175, 0.420, 0.00],
      steerPivot: [0, 1.04, 0.38],
      gripL: [0.345, 0.128, -0.125],
      gripR: [-0.345, 0.128, -0.125],
      headlight: { pos: [0, 0.988, 0.525], width: 0.108, height: 0.062, shape: 'rect' },
      taillight: { pos: [0, 0.946, -0.930], width: 0.124, height: 0.056 },
      frontDisc: { sideX: -0.044, radius: 0.130 },
      dash: [0, 1.14, 0.44],
      povEye: [0, 1.60, -0.37],
      povLook: [0, 1.28, 2.6],
    },
    gearCount: 5,
    soundProfile: 'bike_dirt',
  },
  {
    id: 'bangladeshi_cng',
    name: 'Bangladeshi CNG Auto',
    badge: 'BANGLADESHI CNG AUTO',
    assetUrl: './assets/bangladeshi_cng.glb',
    targetLength: 2.65,
    width: 1.32,
    rotateY: 0,
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 1.35, 0.01, TALTOLA_HOUSE_OFFSET.z - 38.4],
    spawnHeading: 0.0,
    paintPresets: CNG_PAINT_PRESETS,
    glassMats: ['CNG_Glass'],
    hasBuiltInSteeringWheel: true,
    gearCount: 4,
    maxSpeed: 17.5,
    boostMaxSpeed: 19.2,
    engineForce: 12.8,
    engineBaseFreq: 42,
    engineRangeFreq: 95,
    hornFreqs: [460, 580],
    camBack: 3.65,
    camHeight: 1.92,
    hoodHeight: 1.48,
    hoodForward: 0.36,
    isBMW: false,
    isCNG: true,
    soundProfile: 'cng_putput',
  },
  {
    id: 'atlas_roadster_bicycle',
    name: 'Atlas Roadster Bicycle',
    badge: 'ATLAS ROADSTER BICYCLE',
    assetUrl: './assets/atlas_roadster_bicycle.glb?v=2',
    targetLength: 1.88,
    width: 0.63,
    rotateY: 0,
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 1.50, 0.006, TALTOLA_HOUSE_OFFSET.z + 2.4],
    spawnHeading: 0.0,
    paintPresets: BICYCLE_PAINT_PRESETS,
    bodyPaintMats: ['Atlas_Frame_Black'],
    maxSpeed: 8.9,
    boostMaxSpeed: 11.5,
    engineForce: 10.5,
    camBack: 2.95,
    camHeight: 1.72,
    hoodHeight: 1.42,
    hoodForward: 0.14,
    isBMW: false,
    isRickshaw: true,
    isBicycle: true,
    soundProfile: 'pedal_bicycle',
  },
  {
    id: 'bangladeshi_cargo_van',
    name: 'Bangladeshi Cargo Van',
    badge: 'BANGLADESHI CARGO VAN',
    assetUrl: './assets/bangladeshi_cargo_van.glb',
    targetLength: 2.395,
    width: 1.042,
    rotateY: 0,
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 1.40, 0.01, TALTOLA_HOUSE_OFFSET.z - 51.6],
    spawnHeading: 0.0,
    paintPresets: VAN_PAINT_PRESETS,
    maxSpeed: 6.7,
    boostMaxSpeed: 8.8,
    engineForce: 9.0,
    camBack: 3.55,
    camHeight: 2.02,
    hoodHeight: 1.62,
    hoodForward: 0.16,
    isBMW: false,
    isRickshaw: true,
    isVan: true,
    soundProfile: 'pedal_van',
  },
  {
    id: 'tata_2515',
    name: 'Tata LPT 2515 Truck',
    badge: 'TATA LPT 2515 (10-WHEELER)',
    assetUrl: './assets/tata_2515.glb',
    targetLength: 8.92,
    width: 2.45,
    rotateY: 0,
    spawnPos: [TALTOLA_HOUSE_OFFSET.x - 1.00, 0.01, TALTOLA_HOUSE_OFFSET.z + 20.5],
    spawnHeading: 0.0,
    paintPresets: [
      { name: 'BD Highway Red', hex: '#b91c1c', trailerHex: '#1e3a8a' },
      { name: 'BD Emerald Green', hex: '#15803d', trailerHex: '#eab308' },
      { name: 'Tata Saffron', hex: '#d97706', trailerHex: '#1e293b' },
      { name: 'Highway Sky Blue', hex: '#0284c7', trailerHex: '#e2e8f0' },
      { name: 'Pearl White', hex: '#f8fafc', trailerHex: '#1e3a8a' },
    ],
    hasBuiltInSteeringWheel: true,
    gearCount: 6,
    maxSpeed: 24.4,
    boostMaxSpeed: 26.5,
    engineForce: 13.5,
    engineBaseFreq: 24,
    engineRangeFreq: 64,
    hornFreqs: [215, 275],
    camBack: 11.2,
    camHeight: 4.35,
    hoodHeight: 2.35,
    hoodForward: 3.15,
    isBMW: false,
    isTata2515: true,
    soundProfile: 'truck_diesel',
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
  const mat = new THREE.MeshPhysicalMaterial({
    name: source.name,
    color: source.map ? (source.color ? source.color.clone() : new THREE.Color('#ffffff')) : new THREE.Color(colorHex),
    map: source.map || null,
    normalMap: source.normalMap || null,
    normalScale: source.normalScale ? source.normalScale.clone() : new THREE.Vector2(1, 1),
    roughnessMap: source.roughnessMap || null,
    metalnessMap: source.metalnessMap || null,
    aoMap: source.aoMap || null,
    side: source.side,
    transparent: source.transparent,
    opacity: source.opacity,
    alphaTest: source.alphaTest,
    metalness: source.metalnessMap ? 1.0 : 0.68,
    roughness: source.roughnessMap ? 1.0 : 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    ior: 1.52,
    reflectivity: 1.0,
    envMapIntensity: 1.85,
  });
  if (mat.map) mat.map.anisotropy = 8;
  if (mat.normalMap) mat.normalMap.anisotropy = 8;
  return mat;
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
  const matName = String(opts.matName || '');
  const isPureFrontSteerMat = /FrontSuspension|FrontLight|Dashboard/i.test(matName);
  const isTankFairingMat = /FairingGasTank/i.test(matName);
  const wheelMaxX = strictRimOnly ? 0.082 : 0.135;
  const rLim = strictRimOnly ? (wheelR * 0.88) : (wheelR + 0.035);
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
      let steers = false;
      if (isPureFrontSteerMat) {
        steers = true;
      } else if (isTankFairingMat) {
        // Keep the entire fuel tank & tank shrouds (z <= 0.39) strictly fixed on the frame;
        // only turn the headlight cowl/mask and high front mudguard!
        const isHeadlightMask = triC.z > 0.39 && triC.y > 0.84;
        const isFrontMudguard = triC.z > 0.42 && triC.y > 0.72 && Math.abs(triC.x) < 0.105;
        steers = isHeadlightMask || isFrontMudguard;
      } else {
        // Handlebars, grips, mirrors, front indicators & fork clamps only (never touching tank z<=0.39, y<=1.01, |x|<=0.14)
        const isHandlebarOrMirror = triC.y > 1.04 && triC.z > 0.14;
        const isOuterGripOrLever = Math.abs(triC.x) > 0.19 && triC.y > 0.96 && triC.z > 0.12;
        const isFrontForkOrLamp = triC.z > 0.40 && triC.y > 0.30;
        steers = isHandlebarOrMirror || isOuterGripOrLever || isFrontForkOrLamp;
      }
      if (steers) {
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

  const stemPos = config.bikeRig?.steerPivot || [0, 1.02, 0.38];
  const frontAssemblyPivot = new THREE.Group();
  frontAssemblyPivot.name = 'BikeFrontSteeringAssembly';
  frontAssemblyPivot.position.set(0, stemPos[1], stemPos[2]);
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
      const isRimCandidate = /Chrome|ScratchedSteel|Mirror/i.test(mName);
      const isFrontSteerCandidate = !/Engine|Carburettor|ChainMat|Sprocket|BrakeDisk|TireMat/i.test(mName);
      if (!isPureWheel && !isRimCandidate && !isFrontSteerCandidate) continue;

      const res = splitMergedBikeMesh(ch, invWrapper, frontC, rearC, Math.max(fRad, rRad), frontAssemblyPivot.position, {
        allowWheel: isPureWheel || isRimCandidate,
        strictRimOnly: isRimCandidate,
        allowFrontSteer: isFrontSteerCandidate,
        matName: mName,
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
    // Add subtle metallic alloy rim spoke accents & valve stem so wheel rotation is crisp and unmistakable in motion
    const spokeAccentMat = new THREE.MeshStandardMaterial({ color: 0xdbeafe, metalness: 0.85, roughness: 0.24 });
    const rimR = wr * 0.72;
    const spokeGeo = new THREE.BoxGeometry(0.036, rimR * 1.92, 0.011);
    for (let k = 0; k < 3; k++) {
      const sp = new THREE.Mesh(spokeGeo, spokeAccentMat);
      sp.rotation.x = (k * Math.PI) / 3;
      spinPivot.add(sp);
      usedSet.add(sp);
    }
    const markerGeo = new THREE.BoxGeometry(0.052, 0.022, 0.034);
    const markerMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.65, roughness: 0.28 });
    for (let s = 0; s < 2; s++) {
      const mk = new THREE.Mesh(markerGeo, markerMat);
      const ang = s * Math.PI;
      mk.position.set(0, Math.cos(ang) * (wr * 0.77), Math.sin(ang) * (wr * 0.77));
      mk.rotation.x = ang;
      spinPivot.add(mk);
      usedSet.add(mk);
    }
    builtWheels.push({ wheelRoot: steerPivot, spinGroup: spinPivot, isFront, steerAxis: 'y', spinAxis: 'x', restY: steerPivot.position.y, parentSteers: isFront });
  }

  orientedWrapper.updateMatrixWorld(true);
  const frontTurnMeshes = [];
  const frontMudguardMeshes = [];
  const rearChainMeshes = [];
  const frontSteerRoot = builtWheels.find((w) => w.isFront)?.wheelRoot || null;
  const rearSteerRoot = builtWheels.find((w) => !w.isFront)?.wheelRoot || null;
  orientedWrapper.traverse((ch) => {
    if (!ch.isMesh || !ch.visible || usedSet.has(ch)) return;
    tmpBox.setFromObject(ch);
    if (tmpBox.isEmpty()) return;
    tmpBox.applyMatrix4(invWrapper);
    tmpBox.getCenter(tmpC);
    tmpBox.getSize(tmpS);
    // Attach front mudguard directly to frontSteerRoot (moves vertically WITH front wheel, NEVER clips into tire during suspension travel!)
    const isFrontMudguard = frontSteerRoot && tmpBox.max.z > 0.72 && tmpBox.min.z > 0.30 && tmpBox.min.y > 0.25 && tmpBox.max.y < 0.72 && Math.abs(tmpC.x) < 0.08 && tmpS.z > 0.32;
    if (isFrontMudguard) {
      frontMudguardMeshes.push(ch);
      return;
    }
    // Attach drive chain directly to rearSteerRoot (outside spinPivot) so the chain stays 100% aligned & seated on the rear sprocket!
    const isDriveChain = rearSteerRoot && tmpBox.min.z < -0.66 && tmpBox.max.z > -0.12 && tmpBox.min.x > 0.042 && tmpBox.max.x < 0.074 && tmpBox.min.y > 0.15 && tmpBox.max.y < 0.48;
    if (isDriveChain) {
      rearChainMeshes.push(ch);
      return;
    }
    // Turn the ENTIRE front steering assembly: handlebars + rubber grips + riser clamp + upper triple-tree + levers + mirrors + gauges + headlight + forks!
    // Strictly exclude fuel tank (cZ=0.110), tank cap (cZ=0.179), frame, and cables (minY<0.90).
    const isHandlebarOrMirror = tmpBox.min.y >= 0.905 && tmpC.z >= 0.25 && tmpC.z <= 0.55 && tmpS.z < 0.35;
    const isFrontForkOrLamp = tmpC.z >= 0.42 && tmpBox.min.z >= 0.34 && tmpS.z < 0.65;
    if (isHandlebarOrMirror || isFrontForkOrLamp) {
      frontTurnMeshes.push(ch);
    }
  });
  for (const fm of frontTurnMeshes) frontAssemblyPivot.attach(fm);
  if (frontSteerRoot) {
    for (const mg of frontMudguardMeshes) frontSteerRoot.attach(mg);
  }
  if (rearSteerRoot) {
    for (const chM of rearChainMeshes) rearSteerRoot.attach(chM);
  }

  return { wheels: builtWheels, frontAssemblyPivot, wheelRadius: rCnt ? rSum / rCnt : 0.32 };
}

let cachedCNGTireTex = null;
function getCNGTireTexture() {
  if (cachedCNGTireTex) return cachedCNGTireTex;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1b1e23';
  ctx.fillRect(0, 0, 256, 256);
  // Crisp circumferential Bajaj 4.00-8 tread grooves & shoulder blocks so spinning is clearly visible!
  ctx.fillStyle = '#101216';
  for (const gx of [46, 98, 158, 210]) {
    ctx.fillRect(gx - 5, 0, 10, 256);
  }
  ctx.strokeStyle = '#0d0f12';
  ctx.lineWidth = 5;
  for (let y = 0; y < 256; y += 22) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(44, y + 10);
    ctx.moveTo(256, y);
    ctx.lineTo(212, y + 10);
    ctx.moveTo(52, y + 5);
    ctx.lineTo(94, y + 13);
    ctx.moveTo(204, y + 5);
    ctx.lineTo(162, y + 13);
    ctx.moveTo(106, y);
    ctx.lineTo(150, y + 8);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  for (let y = 0; y < 256; y += 22) {
    ctx.fillRect(110, y + 11, 36, 5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 5);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  cachedCNGTireTex = tex;
  return tex;
}

function buildRealisticCNGWheel(radius = 0.245, width = 0.132, isFront = false, outboardSign = 1) {
  const wheelGroup = new THREE.Group();
  const hw = width * 0.5;
  const rimR = radius * 0.54; // Authentic chunky 8-inch Bajaj RE CNG wheel ratio

  const tireTex = getCNGTireTexture();
  const tireMat = new THREE.MeshStandardMaterial({
    name: 'CNG_Proc_Tire',
    color: 0x20242a,
    map: tireTex,
    roughness: 0.84,
    metalness: 0.06,
    envMapIntensity: 0.55,
  });
  tireMat.userData = { keepMaterial: true };

  const rimMat = new THREE.MeshStandardMaterial({
    name: 'CNG_Proc_Rim',
    color: 0xc2cbd4,
    roughness: 0.34,
    metalness: 0.66,
    envMapIntensity: 1.45,
  });
  rimMat.userData = { keepMaterial: true };

  const darkSteelMat = new THREE.MeshStandardMaterial({
    name: 'CNG_Proc_DarkSteel',
    color: 0x1d2228,
    roughness: 0.52,
    metalness: 0.55,
  });
  darkSteelMat.userData = { keepMaterial: true };

  const chromeLugMat = new THREE.MeshStandardMaterial({
    name: 'CNG_Proc_Lug',
    color: 0xe6edf4,
    roughness: 0.20,
    metalness: 0.90,
    envMapIntensity: 1.7,
  });
  chromeLugMat.userData = { keepMaterial: true };

  // 1) Rounded balloon tire profile (LatheGeometry around Y, rotated around Z so wheel axle = X!)
  const tirePts = [
    new THREE.Vector2(rimR - 0.004, -hw * 0.72),
    new THREE.Vector2(rimR + 0.022, -hw * 0.92),
    new THREE.Vector2(radius * 0.82, -hw * 1.02),
    new THREE.Vector2(radius * 0.96, -hw * 0.84),
    new THREE.Vector2(radius, -hw * 0.48),
    new THREE.Vector2(radius, hw * 0.48),
    new THREE.Vector2(radius * 0.96, hw * 0.84),
    new THREE.Vector2(radius * 0.82, hw * 1.02),
    new THREE.Vector2(rimR + 0.022, hw * 0.92),
    new THREE.Vector2(rimR - 0.004, hw * 0.72),
  ];
  const tireGeo = new THREE.LatheGeometry(tirePts, 32);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMesh = new THREE.Mesh(tireGeo, tireMat);
  tireMesh.castShadow = true;
  tireMesh.receiveShadow = true;
  wheelGroup.add(tireMesh);

  // Subtle raised sidewall molding ring on both sides
  for (const s of [-1, 1]) {
    const swRing = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.76, 0.004, 8, 28), darkSteelMat);
    swRing.rotation.y = Math.PI / 2;
    swRing.position.x = s * hw * 0.97;
    wheelGroup.add(swRing);
  }

  // 2) Stamped steel deep-dish split rim (authentic Bajaj RE CNG silver-grey steel rim)
  const rimPts = [
    new THREE.Vector2(0.018, -hw * 0.30),
    new THREE.Vector2(rimR * 0.56, -hw * 0.30),
    new THREE.Vector2(rimR * 0.78, -hw * 0.62),
    new THREE.Vector2(rimR + 0.006, -hw * 0.74),
    new THREE.Vector2(rimR + 0.010, -hw * 0.64),
    new THREE.Vector2(rimR - 0.008, -hw * 0.52),
    new THREE.Vector2(rimR - 0.008, hw * 0.52),
    new THREE.Vector2(rimR + 0.010, hw * 0.64),
    new THREE.Vector2(rimR + 0.006, hw * 0.74),
    new THREE.Vector2(rimR * 0.78, hw * 0.62),
    new THREE.Vector2(rimR * 0.56, hw * 0.30),
    new THREE.Vector2(0.018, hw * 0.30),
  ];
  const rimGeo = new THREE.LatheGeometry(rimPts, 28);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  wheelGroup.add(rimMesh);

  // 3) Wheel face details: dark vent cutouts, domed center hubcap & 4 chrome lug nuts
  const faceSides = isFront ? [-1, 1] : [outboardSign];
  for (const s of faceSides) {
    // 6 radial cooling slots around the stamped steel disc
    const slotGeo = new THREE.BoxGeometry(0.008, 0.022, 0.014);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const slot = new THREE.Mesh(slotGeo, darkSteelMat);
      slot.position.set(s * hw * 0.44, Math.cos(ang) * rimR * 0.72, Math.sin(ang) * rimR * 0.72);
      slot.rotation.x = ang;
      wheelGroup.add(slot);
    }
    // Raised center hubcap dome
    const hubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.036, 0.026, 16), rimMat);
    hubCap.rotation.z = Math.PI / 2;
    hubCap.position.x = s * (hw * 0.38);
    wheelGroup.add(hubCap);

    const dustCap = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.020, 0.018, 12), darkSteelMat);
    dustCap.rotation.z = Math.PI / 2;
    dustCap.position.x = s * (hw * 0.50);
    wheelGroup.add(dustCap);

    // 4 chrome lug nuts around bolt circle
    const lugGeo = new THREE.CylinderGeometry(0.0075, 0.0075, 0.016, 6);
    lugGeo.rotateZ(Math.PI / 2);
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
      const lug = new THREE.Mesh(lugGeo, chromeLugMat);
      lug.position.set(s * (hw * 0.36), Math.cos(ang) * 0.056, Math.sin(ang) * 0.056);
      wheelGroup.add(lug);
    }
  }

  // 4) Inboard dark iron brake drum
  const brakeDrum = new THREE.Mesh(new THREE.CylinderGeometry(rimR * 0.78, rimR * 0.78, hw * 0.78, 18), darkSteelMat);
  brakeDrum.rotation.z = Math.PI / 2;
  brakeDrum.position.x = isFront ? 0 : -outboardSign * hw * 0.22;
  wheelGroup.add(brakeDrum);

  return wheelGroup;
}

// Single shared scene-level headlight SpotLight (1 permanently-visible SpotLight with intensity=0 when off).
// Eliminates ~20 per-vehicle SpotLights & PointLights so NUM_SPOT_LIGHTS=1 NEVER changes at runtime
// -> ZERO full-scene WebGL shader recompilation freezes + ~20% faster world fragment shaders!
const sharedHeadlightPoolByScene = new WeakMap();
function getSharedHeadlightPool(scene) {
  let pool = sharedHeadlightPoolByScene.get(scene);
  if (pool) return pool;
  const spot = new THREE.SpotLight(0xfff6dc, 0, 56, Math.PI * 0.28, 0.56, 1.35);
  spot.castShadow = false;
  spot.visible = true; // Permanently true -> ZERO shader recompiles!
  const tgt = new THREE.Object3D();
  scene.add(spot, tgt);
  spot.target = tgt;
  pool = { spots: [{ spot, tgt }], ownerId: null, tmpPos: new THREE.Vector3(), tmpTgt: new THREE.Vector3(), tmpPosB: new THREE.Vector3(), tmpTgtB: new THREE.Vector3() };
  sharedHeadlightPoolByScene.set(scene, pool);
  return pool;
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

  const contactShadow = createUnderbodyContactShadow(
    (config.isBike || config.isBicycle) ? 0.36 : (config.width || 1.88),
    config.targetLength || 4.4,
  );
  root.add(contactShadow);

  const state = {
    id: config.id,
    name: config.name,
    badge: config.badge || config.name.toUpperCase(),
    loaded: false,
    driving: false,
    aiDriving: false,
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
    velY: 0,
    grounded: true,
    pitch: 0,
    roll: 0,
    terrainPitch: 0,
    terrainRoll: 0,
    dynPitch: 0,
    dynPitchVel: 0,
    dynRoll: 0,
    dynRollVel: 0,
    suspHeave: 0,
    suspHeaveVel: 0,
    lastGroundY: 0.01,
    frontSuspOffset: 0,
    frontSuspVel: 0,
    rearSuspOffset: 0,
    rearSuspVel: 0,
    riderSag: 0,
    roadTravelDist: 0,
    paintIndex: 0,
    paintName: paintPresets[0].name,
    isRickshaw: Boolean(config.isRickshaw),
    isBicycle: Boolean(config.isBicycle),
    isVan: Boolean(config.isVan),
    isBike: Boolean(config.isBike),
    hasKickstand: Boolean(config.isBicycle || config.isBike),
    kickstandDeploy: (config.isBicycle || config.isBike) ? 1.0 : 0.0,
    isCNG: Boolean(config.isCNG),
    bikeSportLean: Boolean(config.bikeSportLean),
    rideSeat: 'driver',
    passengerSeatIndex: 0,
    halfWidth: (config.width || 1.88) * 0.48,
    halfLength: (config.targetLength || 4.4) * 0.48,
    camBack: config.camBack || 5.4,
    camHeight: config.camHeight || 2.15,
    hoodHeight: config.hoodHeight || 1.28,
    hoodForward: config.hoodForward || 0.65,
    gearCount: config.gearCount || 6,
    headlightsMode: 0, // 0 = OFF, 1 = LOW BEAM, 2 = HIGH BEAM
    lastImpactIntensity: 0,
    crashCooldown: 0,
    poleHitCooldown: 0,
    health: 100,
    maxHealth: 100,
    slipIntensity: 0,
    lastGear: 'N',
  };

  // Lightweight local headlight beam anchors backed by ONE shared scene-level SpotLight pool (zero shader bloat!)
  const sharedHeadlightPool = getSharedHeadlightPool(scene);
  const headlightBeams = [];
  if (!config.isRickshaw) {
    const hlOffsets = (config.isBike || config.isCNG) ? [0] : [-(config.width || 1.85) * 0.34, (config.width || 1.85) * 0.34];
    const hlZ = (config.targetLength || 4.4) * 0.48;
    const hlY = config.isBike ? 0.88 : (config.isCNG ? 0.72 : 0.76);
    for (const ox of hlOffsets) {
      const src = new THREE.Object3D();
      src.position.set(ox, hlY, hlZ);
      const tgt = new THREE.Object3D();
      tgt.position.set(ox * 0.85, 0.15, hlZ + 18);
      bodyTiltGroup.add(src, tgt);
      headlightBeams.push({ src, tgt, hlZ, ox, intensity: 0, distance: 52, angle: Math.PI * 0.24 });
    }
  }

  let riggedWheels = [];
  let builtInSteeringWheel = null;
  let bikeFrontAssembly = null;
  let measuredWheelRadius = config.isRickshaw ? 0.365 : (config.isBike ? 0.32 : (config.isCNG ? 0.255 : 0.34));
  let rickshawParts = null;
  let cngParts = null;
  let tataTruckApi = null;
  let corollaParts = null;
  let bikeDriverRig = null;
  let bikeKickstandPivot = null;
  let bikeKickstandTipAnchor = null;
  let bikeHeadlightUnit = null;
  let bikeTaillightUnit = null;
  let bikeSteelDiscMat = null;
  let carDoors = {};
  let driverDoorOverride = null;
  let exteriorWrapper = null;
  const cockpitRig = (config.isRickshaw || config.isBike || config.isGameReadyCorolla || config.isGameReadyPrius) ? null : createInteriorCockpitRig(config, paintPresets[0].hex);
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

    // Authentic forged-steel Left-Side Motorcycle Kickstand bolted FLUSH to the lower frame cradle (zero air gap, strictly motorcycles!)
    const ksSteelMat = new THREE.MeshStandardMaterial({ color: 0x1e2228, metalness: 0.80, roughness: 0.30 });
    // Solid steel mounting gusset & clevis welded directly into the motorcycle frame (x = 0.00 -> +0.095)
    const ksMountArm = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.036, 0.044), ksSteelMat);
    ksMountArm.position.set(0.044, 0.314, -0.13);
    rigGroup.add(ksMountArm);
    const ksClevis = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.044, 0.042), ksSteelMat);
    ksClevis.position.set(0.088, 0.310, -0.13);
    rigGroup.add(ksClevis);

    const ksPivot = new THREE.Group();
    ksPivot.name = `BikeKickstandPivot_${config.id}`;
    ksPivot.position.set(0.088, 0.310, -0.13);
    ksPivot.rotation.order = 'ZYX';
    const ksBolt = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.034, 10), ksSteelMat);
    ksBolt.rotation.z = Math.PI * 0.5;
    ksPivot.add(ksBolt);
    // Leg stowed flush along left lower frame/swingarm when deploy=0; swings STRAIGHT DOWN & splays cleanly touching ground flush (y=0.000) when deploy=1
    const ksLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.009, 0.295, 10), ksSteelMat);
    ksLeg.rotation.x = Math.PI * 0.5;
    ksLeg.position.set(0, -0.008, -0.148);
    ksPivot.add(ksLeg);
    // Flat ground footpad at tip (tilted to lie 100% horizontal flush on the asphalt when deployed!)
    const ksPad = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.044, 0.010), ksSteelMat);
    ksPad.position.set(0, -0.010, -0.295);
    ksPad.rotation.z = -0.16;
    ksPivot.add(ksPad);
    // Short heel kick-spur sticking outward (+X) so rider's left boot catches it cleanly
    const ksSpur = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.062, 8), ksSteelMat);
    ksSpur.rotation.z = Math.PI * 0.5;
    ksSpur.position.set(0.032, -0.010, -0.215);
    ksPivot.add(ksSpur);
    const ksTip = new THREE.Object3D();
    ksTip.position.set(0.038, -0.010, -0.245);
    ksPivot.add(ksTip);
    rigGroup.add(ksPivot);
    bikeKickstandPivot = ksPivot;
    bikeKickstandTipAnchor = ksTip;

    const steerPivot = new THREE.Group();
    steerPivot.position.set(...(br.steerPivot || [0, 1.06, 0.34]));
    rigGroup.add(steerPivot);
    const gripL = new THREE.Object3D();
    gripL.position.set(...(br.gripL || [0.34, 0.02, -0.04]));
    steerPivot.add(gripL);
    const gripR = new THREE.Object3D();
    gripR.position.set(...(br.gripR || [-0.34, 0.02, -0.04]));
    steerPivot.add(gripR);

    const povEyeLocal = new THREE.Vector3(...(br.povEye || [0, 1.40, -0.15]));
    const povLookLocal = new THREE.Vector3(...(br.povLook || [0, 1.20, 2.4]));

    bikeDriverRig = {
      rigGroup, seatAnchor, footL, footR, steerPivot, gripL, gripR,
      povEyeLocal, povLookLocal,
    };
  }

  // Interactive 3D Driver Seat + Rotating Steering Wheel with Left/Right Hand IK Grips for non-rickshaw cars
  let carDriverRig = null;
  if (!config.isRickshaw && !config.isBike) {
    const baseCarId = String(config.id || '').replace(/_spawn_.*$/, '');
    const seatPresets = {
      bmw_m3:          { x:  0.33, y: 0.34, z:  0.04, wy: 0.30, wz: 0.42 },
      toyota_corolla:  { x:  0.32, y: 0.40, z:  0.14, wy: 0.32, wz: 0.42 },
      toyota_prius:    { x:  0.35, y: 0.42, z:  0.10, wy: 0.32, wz: 0.40 },
      nissan_sunny:    { x:  0.36, y: 0.42, z:  0.14, wy: 0.32, wz: 0.42 },
      toyota_fortuner: { x:  0.34, y: 0.56, z:  0.18, wy: 0.32, wz: 0.44 },
      toyota_alphard:  { x:  0.34, y: 0.60, z:  0.46, wy: 0.32, wz: 0.44 },
      toyota_hiace:    { x:  0.34, y: 0.62, z:  0.88, wy: 0.32, wz: 0.44 },
      toyota_townace:  { x:  0.33, y: 0.78, z:  0.38, wy: 0.34, wz: 0.42 },
      bangladeshi_cng: { x:  0.00, y: 0.84, z:  0.22, wy: 0.26, wz: 0.32 },
    };
    const sp = seatPresets[baseCarId] || { x: 0.33, y: 0.40, z: 0.14, wy: 0.32, wz: 0.42 };
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
    footL.position.set(
      config.isCNG ? 0.14 : seatX + 0.13,
      config.isCNG ? 0.32 : Math.max(0.18, seatY - 0.22),
      config.isCNG ? 0.64 : seatZ + 0.54,
    );
    rigGroup.add(footL);
    const footR = new THREE.Object3D();
    footR.position.set(
      config.isCNG ? -0.14 : seatX - 0.13,
      config.isCNG ? 0.32 : Math.max(0.18, seatY - 0.22),
      config.isCNG ? 0.64 : seatZ + 0.54,
    );
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

    // CNG Back Passenger Seat Anchors (professionally seated on rear bench with shoes flat on floorboard!)
    let passengerSeat = null;
    let passengerFootL = null;
    let passengerFootR = null;
    if (config.isCNG) {
      passengerSeat = new THREE.Object3D();
      passengerSeat.position.set(-0.05, 0.85, -0.44);
      rigGroup.add(passengerSeat);
      passengerFootL = new THREE.Object3D();
      passengerFootL.position.set(0.09, 0.38, -0.14);
      rigGroup.add(passengerFootL);
      passengerFootR = new THREE.Object3D();
      passengerFootR.position.set(-0.19, 0.38, -0.14);
      rigGroup.add(passengerFootR);
    }

    carDriverRig = { rigGroup, seatAnchor, footL, footR, wheelSpin, gripL, gripR, passengerSeat, passengerFootL, passengerFootR };
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

  // GTA V-style ultra-subtle silencer/exhaust wisps (starts when player enters / engine runs; barely visible from afar, clear up close)
  const exhaustTipLocal = Array.isArray(config.exhaustTip) ? new THREE.Vector3(...config.exhaustTip) : null;
  const exhaustSmokePuffs = [];
  const exhaustWorldPos = new THREE.Vector3();
  let exhaustSmokeCooldown = 0;

  function spawnExhaustSmokePuff(throttleAmt, speedAbs) {
    if (!exhaustTipLocal || !state.loaded || exhaustSmokePuffs.length > 26) return;
    root.updateMatrixWorld(true);
    exhaustWorldPos.copy(exhaustTipLocal);
    bodyTiltGroup.localToWorld(exhaustWorldPos);

    const isRevving = throttleAmt > 0 || speedAbs > 1.2;
    const isMoto = Boolean(config.isBike);
    // Clearly noticeable, realistic motorcycle silencer exhaust smoke (gentle delicate wisp at idle, lively light exhaust while riding!)
    const peakOpacity = isMoto
      ? (isRevving ? (0.30 + Math.random() * 0.10) : (0.17 + Math.random() * 0.06))
      : (isRevving ? (0.068 + Math.random() * 0.024) : (0.048 + Math.random() * 0.018));
    const startScale = isMoto
      ? (isRevving ? (0.105 + Math.random() * 0.032) : (0.082 + Math.random() * 0.024))
      : (isRevving ? (0.095 + Math.random() * 0.030) : (0.075 + Math.random() * 0.028));
    const mat = new THREE.SpriteMaterial({
      map: smokeTex,
      transparent: true,
      opacity: 0.001,
      depthWrite: false,
      color: new THREE.Color(isMoto ? 0xd5dfe9 : 0xdbe1e8),
      rotation: Math.random() * Math.PI * 2,
    });
    const sp = new THREE.Sprite(mat);
    sp.position.set(
      exhaustWorldPos.x + (Math.random() - 0.5) * 0.016,
      exhaustWorldPos.y + (Math.random() - 0.5) * 0.014,
      exhaustWorldPos.z + (Math.random() - 0.5) * 0.016,
    );
    sp.scale.setScalar(startScale);
    scene.add(sp);

    const backPush = isRevving ? (1.10 + Math.min(speedAbs * 0.12, 1.8)) : (isMoto ? 0.52 : 0.42);
    const fx = Math.sin(state.heading);
    const fz = Math.cos(state.heading);
    exhaustSmokePuffs.push({
      mesh: sp,
      age: 0,
      maxAge: isMoto
        ? (isRevving ? (0.68 + Math.random() * 0.26) : (0.92 + Math.random() * 0.30))
        : (isRevving ? (0.62 + Math.random() * 0.30) : (0.80 + Math.random() * 0.34)),
      vx: -fx * backPush + (Math.random() - 0.5) * 0.12,
      vy: (isRevving ? 0.20 : 0.18) + Math.random() * 0.09,
      vz: -fz * backPush + (Math.random() - 0.5) * 0.12,
      rotSpeed: (Math.random() - 0.5) * 0.9,
      startScale,
      growScale: isMoto
        ? (isRevving ? (0.46 + Math.random() * 0.16) : (0.34 + Math.random() * 0.12))
        : (isRevving ? (0.34 + Math.random() * 0.12) : (0.28 + Math.random() * 0.10)),
      peakOpacity,
    });
  }

  function updateExhaustSmoke(dt) {
    for (let i = exhaustSmokePuffs.length - 1; i >= 0; i--) {
      const p = exhaustSmokePuffs[i];
      p.age += dt;
      if (p.age >= p.maxAge) {
        scene.remove(p.mesh);
        p.mesh.material.dispose();
        exhaustSmokePuffs.splice(i, 1);
        continue;
      }
      const t = p.age / p.maxAge;
      const drag = Math.max(0, 1 - dt * 2.8);
      p.vx *= drag;
      p.vz *= drag;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.scale.setScalar(p.startScale + Math.pow(t, 0.78) * p.growScale);
      p.mesh.material.rotation += p.rotSpeed * dt;
      const fadeIn = Math.min(1, t / 0.16);
      const fadeOut = Math.pow(1 - t, 1.85);
      p.mesh.material.opacity = fadeIn * fadeOut * p.peakOpacity;
    }
  }
  let paintMaterials = [];
  let glossyMaterials = [];
  let carShadowMeshes = [];
  let tailMats = [];
  let drlMats = [];
  let reverseMats = [];
  let currentQuality = 'high';
  let shadowInRange = true;
  let activeEnvMap = null;

  // Multi-Profile Realistic Web Audio Synthesizer (distinct voice per vehicle class, zero harsh limiter bounce!)
  const soundProfile = config.soundProfile || (
    config.isTata2515 ? 'truck_diesel'
      : (config.isCNG ? 'cng_putput'
        : (config.isBicycle ? 'pedal_bicycle'
          : (config.isVan ? 'pedal_van'
            : (config.isRickshaw ? 'pedal_rickshaw'
              : (config.isBMW ? 'sports_i6'
                : (config.isGameReadyPrius ? 'hybrid_ecvt'
                  : (config.isBike ? 'bike_sport' : 'sedan_i4')))))))
  );
  const isPedalProfile = soundProfile.startsWith('pedal_');
  if (isPedalProfile) {
    loadBicycleAudioRawBuffers();
  }

  let audioCtx = null;
  let osc1 = null;
  let osc2 = null;
  let osc3 = null;
  let lfoOsc = null;
  let lfoGain = null;
  let engineFilter = null;
  let engineGain = null;
  let pedalNoiseBuf = null;
  let pedalNoiseSrc = null;
  let pedalFilter = null;
  let pedalGain = null;
  let lastCrankPhase = 0;
  let lastHubPhase = 0;
  let crankStrokeIdx = 0;
  let wasPedalingAudio = false;

  // GTA VI Multi-Layer Sampled Real Bicycle Audio Engine (seamless pedaling <-> freewheel coasting <-> engage)
  let bikeAudioReady = false;
  let bikeAudioLoading = false;
  let bikeMasterGain = null;
  let bikeToneLPF = null;
  let bikeCruiseSrc = null;
  let bikeCruiseGain = null;
  let bikeSprintSrc = null;
  let bikeSprintGain = null;
  let bikeFwMidSrc = null;
  let bikeFwMidGain = null;
  let bikeFwFastSrc = null;
  let bikeFwFastGain = null;
  let bikeEngageBuf = null;
  let lastEngageAt = -10;

  function initBicycleSampledAudio() {
    if (!isPedalProfile || !audioCtx || bikeAudioReady || bikeAudioLoading) return;
    bikeAudioLoading = true;
    const ctxRef = audioCtx;
    loadBicycleAudioRawBuffers()
      .then(async (rawMap) => {
        if (!ctxRef || ctxRef !== audioCtx || ctxRef.state === 'closed') {
          bikeAudioLoading = false;
          return;
        }
        const decoded = {};
        for (const [k, raw] of Object.entries(rawMap || {})) {
          if (!raw) continue;
          try {
            // Clone ArrayBuffer because decodeAudioData detaches its input buffer
            decoded[k] = await ctxRef.decodeAudioData(raw.slice(0));
          } catch {}
        }
        if (!ctxRef || ctxRef !== audioCtx || ctxRef.state === 'closed') {
          bikeAudioLoading = false;
          return;
        }
        if (!decoded.cruise || !decoded.fwMid) {
          bikeAudioLoading = false;
          return;
        }

        const comp = ctxRef.createDynamicsCompressor();
        comp.threshold.value = -16;
        comp.knee.value = 14;
        comp.ratio.value = 2.8;
        comp.attack.value = 0.008;
        comp.release.value = 0.16;

        bikeToneLPF = ctxRef.createBiquadFilter();
        bikeToneLPF.type = 'lowpass';
        bikeToneLPF.frequency.value = 4200;
        bikeToneLPF.Q.value = 0.62;

        bikeMasterGain = ctxRef.createGain();
        bikeMasterGain.gain.value = 0.42;

        bikeMasterGain.connect(bikeToneLPF);
        bikeToneLPF.connect(comp);
        comp.connect(ctxRef.destination);

        const mkLoop = (buf) => {
          const src = ctxRef.createBufferSource();
          src.buffer = buf;
          src.loop = true;
          const g = ctxRef.createGain();
          g.gain.value = 0.0;
          src.connect(g);
          g.connect(bikeMasterGain);
          src.start(0);
          return { src, g };
        };

        const c = mkLoop(decoded.cruise);
        bikeCruiseSrc = c.src;
        bikeCruiseGain = c.g;

        const sp = mkLoop(decoded.sprint || decoded.cruise);
        bikeSprintSrc = sp.src;
        bikeSprintGain = sp.g;

        const fm = mkLoop(decoded.fwMid);
        bikeFwMidSrc = fm.src;
        bikeFwMidGain = fm.g;

        const ff = mkLoop(decoded.fwFast || decoded.fwMid);
        bikeFwFastSrc = ff.src;
        bikeFwFastGain = ff.g;

        bikeEngageBuf = decoded.engage || null;
        bikeAudioReady = true;
        bikeAudioLoading = false;
      })
      .catch(() => {
        bikeAudioLoading = false;
      });
  }

  function playBicycleEngage(spdRatio = 0.4, fromCoast = true) {
    if (!audioCtx || !bikeMasterGain || !bikeEngageBuf || !state.driving) return;
    const now = audioCtx.currentTime;
    if (now - lastEngageAt < 0.24) return;
    lastEngageAt = now;
    try {
      const src = audioCtx.createBufferSource();
      src.buffer = bikeEngageBuf;
      src.playbackRate.value = THREE.MathUtils.clamp(0.88 + spdRatio * 0.26, 0.86, 1.20);
      const g = audioCtx.createGain();
      const peak = fromCoast ? (0.24 + spdRatio * 0.12) : 0.16;
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(peak, now + 0.022);
      g.gain.exponentialRampToValueAtTime(0.001, now + Math.min(0.48, bikeEngageBuf.duration));
      src.connect(g);
      g.connect(bikeMasterGain);
      src.start(now);
    } catch {}
  }

  function ensureAudio() {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      if (isPedalProfile && !bikeAudioReady && !bikeAudioLoading) {
        initBicycleSampledAudio();
      }
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      audioCtx = new AudioContextClass();

      if (isPedalProfile) {
        // Subtle asphalt tire-roll noise bed for Bicycle / Rickshaw / Cargo Van
        const bufLen = audioCtx.sampleRate * 1.5;
        const nBuf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
        const ch = nBuf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) ch[i] = (Math.random() * 2 - 1) * 0.55;
        pedalNoiseBuf = nBuf;
        pedalNoiseSrc = audioCtx.createBufferSource();
        pedalNoiseSrc.buffer = nBuf;
        pedalNoiseSrc.loop = true;

        pedalFilter = audioCtx.createBiquadFilter();
        pedalFilter.type = 'bandpass';
        pedalFilter.frequency.value = 540;
        pedalFilter.Q.value = 1.3;

        pedalGain = audioCtx.createGain();
        pedalGain.gain.value = 0.0;

        pedalNoiseSrc.connect(pedalFilter);
        pedalFilter.connect(pedalGain);
        pedalGain.connect(audioCtx.destination);
        pedalNoiseSrc.start();

        initBicycleSampledAudio();
        return;
      }

      osc1 = audioCtx.createOscillator();
      osc2 = audioCtx.createOscillator();
      osc3 = audioCtx.createOscillator();
      engineFilter = audioCtx.createBiquadFilter();
      engineGain = audioCtx.createGain();
      engineGain.gain.value = 0.0;

      if (soundProfile === 'cng_putput') {
        // Authentic Bangladeshi Bajaj RE CNG: rhythmic single-cylinder "put-put-put-put" pulse!
        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc3.type = 'triangle';
        engineFilter.type = 'bandpass';
        engineFilter.frequency.value = 260;
        engineFilter.Q.value = 1.9;

        lfoOsc = audioCtx.createOscillator();
        lfoOsc.type = 'sine';
        lfoOsc.frequency.value = 11.5;
        lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 0.022;
        lfoOsc.connect(lfoGain);
        lfoGain.connect(engineGain.gain);
        lfoOsc.start();
      } else if (soundProfile === 'truck_diesel') {
        // Heavy 6.7L Tata 2515 Diesel: deep throaty sub-bass rumble + low cylinder chug + subtle turbo whistle
        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc3.type = 'sine';
        engineFilter.type = 'lowpass';
        engineFilter.frequency.value = 195;
        engineFilter.Q.value = 2.2;

        lfoOsc = audioCtx.createOscillator();
        lfoOsc.type = 'sine';
        lfoOsc.frequency.value = 9.0;
        lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 0.012;
        lfoOsc.connect(lfoGain);
        lfoGain.connect(engineGain.gain);
        lfoOsc.start();
      } else if (soundProfile === 'hybrid_ecvt') {
        // Toyota Prius Hybrid: silky quiet electric inverter whine + gentle refined 4-cyl hum
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc3.type = 'sine';
        engineFilter.type = 'lowpass';
        engineFilter.frequency.value = 520;
        engineFilter.Q.value = 0.9;
      } else if (soundProfile === 'sports_i6') {
        // BMW M3 Competition: rich smooth twin-turbo inline-6 harmonics
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc3.type = 'triangle';
        engineFilter.type = 'lowpass';
        engineFilter.frequency.value = 460;
        engineFilter.Q.value = 1.4;
      } else if (soundProfile === 'suv_v6' || soundProfile === 'suv_diesel' || soundProfile === 'luxury_v6') {
        // Muscular V6 / Turbo-Diesel SUV / Executive MPV
        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc3.type = 'sine';
        engineFilter.type = 'lowpass';
        engineFilter.frequency.value = soundProfile === 'suv_diesel' ? 245 : 310;
        engineFilter.Q.value = 1.5;
      } else if (soundProfile === 'bike_sport' || soundProfile === 'bike_dirt') {
        // Crisp single-cylinder motorcycle revving note
        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc3.type = 'triangle';
        engineFilter.type = 'lowpass';
        engineFilter.frequency.value = soundProfile === 'bike_sport' ? 540 : 380;
        engineFilter.Q.value = 1.6;
      } else {
        // Crisp Japanese 4-cylinder sedan / commercial van
        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc3.type = 'sine';
        engineFilter.type = 'lowpass';
        engineFilter.frequency.value = soundProfile === 'van_diesel' ? 240 : 350;
        engineFilter.Q.value = 1.1;
      }

      const g1 = audioCtx.createGain();
      const g2 = audioCtx.createGain();
      const g3 = audioCtx.createGain();
      g1.gain.value = soundProfile === 'hybrid_ecvt' ? 0.35 : 0.55;
      g2.gain.value = soundProfile === 'cng_putput' ? 0.30 : 0.32;
      g3.gain.value = soundProfile === 'truck_diesel' ? 0.25 : (soundProfile === 'hybrid_ecvt' ? 0.28 : 0.16);

      osc1.connect(g1); g1.connect(engineFilter);
      osc2.connect(g2); g2.connect(engineFilter);
      osc3.connect(g3); g3.connect(engineFilter);
      engineFilter.connect(engineGain);
      engineGain.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
      osc3.start();
    } catch {}
  }

  // Authentic Bangladeshi Bicycle / Rickshaw / Cargo Van Crank 'প্যাচ... প্যাচ...' creak under pedal load
  function playCrankPach(strokeIndex = 0, isSprint = false) {
    if (!audioCtx || !state.driving) return;
    try {
      const now = audioCtx.currentTime;
      const isLeftFoot = strokeIndex % 2 === 0;
      const footJitter = (isLeftFoot ? 1.04 : 0.94) * (0.97 + Math.random() * 0.06);
      const isBikePedal = soundProfile === 'pedal_bicycle';
      const isVanPedal = soundProfile === 'pedal_van';
      const baseF = (isBikePedal ? 630 : (isVanPedal ? 405 : 510)) * footJitter;
      const dur = isBikePedal ? 0.115 : (isVanPedal ? 0.145 : 0.128);
      const sprintGain = isSprint ? 1.25 : 1.0;

      // Layer 1: Resonant crank bottom-bracket metallic creak ('প্যাচ')
      const osc = audioCtx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseF * 0.92, now);
      osc.frequency.linearRampToValueAtTime(baseF * 1.14, now + dur * 0.28);
      osc.frequency.exponentialRampToValueAtTime(baseF * 0.62, now + dur);

      const bp = audioCtx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(baseF * 1.45, now);
      bp.frequency.exponentialRampToValueAtTime(baseF * 0.95, now + dur);
      bp.Q.value = isBikePedal ? 7.8 : (isVanPedal ? 6.2 : 7.0);

      const hp = audioCtx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 230;

      const g = audioCtx.createGain();
      const peak = (isBikePedal ? 0.058 : (isVanPedal ? 0.068 : 0.064)) * sprintGain;
      g.gain.setValueAtTime(0.0008, now);
      g.gain.exponentialRampToValueAtTime(peak, now + 0.016);
      g.gain.exponentialRampToValueAtTime(peak * 0.55, now + dur * 0.58);
      g.gain.exponentialRampToValueAtTime(0.0005, now + dur);

      osc.connect(bp);
      bp.connect(hp);
      hp.connect(g);
      g.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.015);

      // Layer 2: Short dry bearing/chain-tooth 'চ' friction scrape
      if (pedalNoiseBuf) {
        const nSrc = audioCtx.createBufferSource();
        nSrc.buffer = pedalNoiseBuf;
        const nBp = audioCtx.createBiquadFilter();
        nBp.type = 'bandpass';
        nBp.frequency.value = isBikePedal ? 2250 : (isVanPedal ? 1450 : 1850);
        nBp.Q.value = 4.6;
        const nG = audioCtx.createGain();
        nG.gain.setValueAtTime(0.0005, now + 0.01);
        nG.gain.exponentialRampToValueAtTime(0.024 * sprintGain, now + 0.028);
        nG.gain.exponentialRampToValueAtTime(0.0005, now + 0.065);
        nSrc.connect(nBp);
        nBp.connect(nG);
        nG.connect(audioCtx.destination);
        nSrc.start(now + 0.008, Math.random() * 0.8, 0.065);
      }
    } catch {}
  }

  // Authentic Freewheel Rear Hub 'ঝিন ঝিন ঝিন...' metallic pawl ratchet when coasting (pedals released)
  function playHubZhin(speedRatio = 0.6) {
    if (!audioCtx || !state.driving) return;
    try {
      const now = audioCtx.currentTime;
      const jitter = 0.97 + Math.random() * 0.06;
      const isBikePedal = soundProfile === 'pedal_bicycle';
      const isVanPedal = soundProfile === 'pedal_van';
      const f1 = (isBikePedal ? 3450 : (isVanPedal ? 2380 : 2850)) * jitter;
      const f2 = (isBikePedal ? 5280 : (isVanPedal ? 3680 : 4380)) * jitter;
      const volScale = THREE.MathUtils.clamp(0.45 + speedRatio * 0.65, 0.35, 1.1);
      const dur = isBikePedal ? 0.038 : (isVanPedal ? 0.044 : 0.041);

      // Metallic ringing pawl partials ('ঝিন')
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.0008, now);
      g.gain.exponentialRampToValueAtTime(0.028 * volScale, now + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0005, now + dur);
      g.connect(audioCtx.destination);

      const o1 = audioCtx.createOscillator();
      o1.type = 'triangle';
      o1.frequency.setValueAtTime(f1, now);
      o1.frequency.exponentialRampToValueAtTime(f1 * 0.92, now + dur);
      o1.connect(g);
      o1.start(now);
      o1.stop(now + dur + 0.008);

      const o2 = audioCtx.createOscillator();
      o2.type = 'sine';
      o2.frequency.setValueAtTime(f2, now);
      o2.frequency.exponentialRampToValueAtTime(f2 * 0.95, now + dur);
      const g2 = audioCtx.createGain();
      g2.gain.value = 0.55;
      o2.connect(g2);
      g2.connect(g);
      o2.start(now);
      o2.stop(now + dur + 0.008);

      // Crisp micro metallic click transient
      if (pedalNoiseBuf) {
        const cSrc = audioCtx.createBufferSource();
        cSrc.buffer = pedalNoiseBuf;
        const cBp = audioCtx.createBiquadFilter();
        cBp.type = 'bandpass';
        cBp.frequency.value = isBikePedal ? 5400 : (isVanPedal ? 3900 : 4600);
        cBp.Q.value = 3.8;
        const cG = audioCtx.createGain();
        cG.gain.setValueAtTime(0.0005, now);
        cG.gain.exponentialRampToValueAtTime(0.022 * volScale, now + 0.0015);
        cG.gain.exponentialRampToValueAtTime(0.0004, now + 0.011);
        cSrc.connect(cBp);
        cBp.connect(cG);
        cG.connect(audioCtx.destination);
        cSrc.start(now, Math.random() * 0.9, 0.015);
      }
    } catch {}
  }

  let screechNoiseSrc = null;
  let screechFilter = null;
  let screechGain = null;

  function updateEngineAudio(active, rpm, throttle, slip = 0) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (isPedalProfile) {
      if (!pedalGain || !pedalFilter) return;
      const spd = Math.abs(state.speed);

      // GTA VI-grade Multi-Stem Real Sampled Pedal Drivetrain Audio (shared across Bicycle, Rickshaw & Van!)
      if (bikeAudioReady && bikeCruiseGain && bikeSprintGain && bikeFwMidGain && bikeFwFastGain) {
        const isPedaling = throttle > 0.05;
        const spdRatio = THREE.MathUtils.clamp(spd / (config.maxSpeed || 9.0), 0, 1.35);
        const stand = THREE.MathUtils.clamp(state.standingBlend || 0, 0, 1);

        if (!active || (spd < 0.10 && !isPedaling)) {
          bikeCruiseGain.gain.setTargetAtTime(0.0, now, 0.085);
          bikeSprintGain.gain.setTargetAtTime(0.0, now, 0.085);
          bikeFwMidGain.gain.setTargetAtTime(0.0, now, 0.085);
          bikeFwFastGain.gain.setTargetAtTime(0.0, now, 0.085);
          pedalGain.gain.setTargetAtTime(0.0, now, 0.085);
          wasPedalingAudio = false;
          return;
        }

        // Smooth natural oiled-chain pickup when engaging pedals from coasting or standstill
        if (isPedaling && !wasPedalingAudio) {
          playBicycleEngage(Math.min(1, spdRatio), state.speed > 0.70);
        }
        wasPedalingAudio = isPedaling;

        // Subtle rubber tire-on-asphalt roll bed underneath all stems
        const rollBedVol = THREE.MathUtils.clamp(spd * 0.0010, 0, 0.0085);
        pedalFilter.frequency.setTargetAtTime(310 + spd * 38, now, 0.10);
        pedalGain.gain.setTargetAtTime(rollBedVol, now, 0.10);

        if (isPedaling) {
          // Warm, silky oiled-chain tone while pedaling (zero rusty harshness!) + gentle crank-cadence breathing
          const pedalLPF = THREE.MathUtils.clamp(2500 + spdRatio * 2000 + stand * 450, 2300, 4800);
          bikeToneLPF?.frequency.setTargetAtTime(pedalLPF, now, 0.09);

          bikeFwMidGain.gain.setTargetAtTime(0.0, now, 0.068);
          bikeFwFastGain.gain.setTargetAtTime(0.0, now, 0.068);

          const cadencePulse = 0.90 + 0.10 * Math.abs(Math.sin(state.pedalPhase));
          const sprintMix = THREE.MathUtils.clamp((spdRatio - 0.52) * 1.40 + stand * 0.82, 0, 1);
          const pedalEnergy = THREE.MathUtils.clamp(0.26 + spdRatio * 0.34 + stand * 0.12, 0.24, 0.70) * cadencePulse;
          const cruiseVol = pedalEnergy * Math.cos(sprintMix * Math.PI * 0.5);
          const sprintVol = pedalEnergy * Math.sin(sprintMix * Math.PI * 0.5);

          bikeCruiseSrc.playbackRate.setTargetAtTime(THREE.MathUtils.clamp(0.76 + spdRatio * 0.40, 0.74, 1.28), now, 0.10);
          bikeSprintSrc.playbackRate.setTargetAtTime(THREE.MathUtils.clamp(0.84 + spdRatio * 0.32 + stand * 0.12, 0.80, 1.34), now, 0.10);
          bikeCruiseGain.gain.setTargetAtTime(cruiseVol, now, 0.088);
          bikeSprintGain.gain.setTargetAtTime(sprintVol, now, 0.088);
        } else if (state.speed > 0.18) {
          // Pedals released while rolling forward -> crisp, silky freewheel hub ratchet ('tik-tik-tik-tik')!
          const coastLPF = THREE.MathUtils.clamp(4200 + spdRatio * 3400 - (state.isBraking ? 1200 : 0), 3000, 7800);
          bikeToneLPF?.frequency.setTargetAtTime(coastLPF, now, 0.09);

          bikeCruiseGain.gain.setTargetAtTime(0.0, now, 0.095);
          bikeSprintGain.gain.setTargetAtTime(0.0, now, 0.095);

          const fastT = THREE.MathUtils.smoothstep(spd, 2.8, 8.4);
          const brakeDamp = state.isBraking ? 0.78 : 1.0;
          const coastVol = THREE.MathUtils.clamp(0.18 + Math.min(1, spd / 7.2) * 0.38, 0.12, 0.56) * brakeDamp;
          const midVol = coastVol * Math.cos(fastT * Math.PI * 0.5);
          const fastVol = coastVol * Math.sin(fastT * Math.PI * 0.5);

          const midRate = THREE.MathUtils.clamp(0.42 + (spd / 5.6) * 0.76, 0.40, 1.34);
          const fastRate = THREE.MathUtils.clamp(0.72 + spdRatio * 0.46, 0.70, 1.34);
          bikeFwMidSrc.playbackRate.setTargetAtTime(midRate, now, 0.09);
          bikeFwFastSrc.playbackRate.setTargetAtTime(fastRate, now, 0.09);
          bikeFwMidGain.gain.setTargetAtTime(midVol, now, 0.095);
          bikeFwFastGain.gain.setTargetAtTime(fastVol, now, 0.095);
        } else {
          bikeCruiseGain.gain.setTargetAtTime(0.0, now, 0.08);
          bikeSprintGain.gain.setTargetAtTime(0.0, now, 0.08);
          bikeFwMidGain.gain.setTargetAtTime(0.0, now, 0.08);
          bikeFwFastGain.gain.setTargetAtTime(0.0, now, 0.08);
        }
        return;
      }

      if (!active || spd < 0.14) {
        pedalGain.gain.setTargetAtTime(0.0, now, 0.06);
        lastCrankPhase = state.pedalPhase;
        lastHubPhase = state.wheelSpin;
        return;
      }
      const isPedaling = throttle > 0.05;
      if (isPedaling !== wasPedalingAudio) {
        wasPedalingAudio = isPedaling;
        lastCrankPhase = state.pedalPhase;
        lastHubPhase = state.wheelSpin;
      }
      const spdRatio = THREE.MathUtils.clamp(spd / (config.maxSpeed || 8.5), 0, 1);

      if (isPedaling) {
        // Soft chain-roller hum + rhythmic crank 'প্যাচ... প্যাচ...' on every half pedal turn
        const chainVol = THREE.MathUtils.clamp(0.008 + spdRatio * 0.018, 0.008, 0.028);
        const centerF = (soundProfile === 'pedal_bicycle' ? 1350 : (soundProfile === 'pedal_van' ? 680 : 920)) + spd * 65;
        pedalFilter.frequency.setTargetAtTime(centerF, now, 0.06);
        pedalGain.gain.setTargetAtTime(chainVol, now, 0.06);

        if (Math.abs(state.pedalPhase - lastCrankPhase) >= Math.PI) {
          lastCrankPhase = state.pedalPhase;
          crankStrokeIdx += 1;
          playCrankPach(crankStrokeIdx, Boolean(state.standingPedal));
        }
      } else if (state.speed > 0.22) {
        // Pedals released while rolling forward -> Freewheel Hub 'ঝিন ঝিন ঝিন...' ratchet!
        const shimmerVol = THREE.MathUtils.clamp(0.005 + spdRatio * 0.010, 0.004, 0.015);
        const shimmerF = (soundProfile === 'pedal_bicycle' ? 4200 : (soundProfile === 'pedal_van' ? 2900 : 3500)) + spd * 85;
        pedalFilter.frequency.setTargetAtTime(shimmerF, now, 0.05);
        pedalGain.gain.setTargetAtTime(shimmerVol, now, 0.05);

        const hubStepRad = soundProfile === 'pedal_bicycle' ? 0.78 : (soundProfile === 'pedal_van' ? 0.92 : 0.85);
        if (Math.abs(state.wheelSpin - lastHubPhase) >= hubStepRad) {
          lastHubPhase = state.wheelSpin;
          playHubZhin(spdRatio);
        }
      } else {
        pedalGain.gain.setTargetAtTime(0.0, now, 0.06);
      }
      return;
    }

    if (!engineGain || !osc1 || !osc2 || !osc3 || !engineFilter) return;
    if (!active) {
      engineGain.gain.setTargetAtTime(0.0, now, 0.09);
      if (lfoGain) lfoGain.gain.setTargetAtTime(0.0, now, 0.09);
      if (screechGain) screechGain.gain.setTargetAtTime(0.0, now, 0.05);
      return;
    }

    const rpmNorm = THREE.MathUtils.clamp((rpm - 800) / 6200, 0, 1);
    const baseFreq = (config.engineBaseFreq || 34) + rpmNorm * (config.engineRangeFreq || 130);

    if (soundProfile === 'cng_putput') {
      // Rhythmic put-put-put-put single-cylinder Bajaj RE CNG chug!
      osc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
      osc2.frequency.setTargetAtTime(baseFreq * 2.0, now, 0.05);
      osc3.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.05);
      engineFilter.frequency.setTargetAtTime(210 + rpmNorm * 420 + throttle * 90, now, 0.06);
      const putRate = 10.5 + rpmNorm * 22.0; // 10.5 Hz idle put-put -> 32 Hz cruising chug
      if (lfoOsc) lfoOsc.frequency.setTargetAtTime(putRate, now, 0.05);
      if (lfoGain) lfoGain.gain.setTargetAtTime(0.018 + throttle * 0.014, now, 0.06);
      engineGain.gain.setTargetAtTime(0.030 + throttle * 0.026, now, 0.07);
    } else if (soundProfile === 'truck_diesel') {
      // Deep, heavy, throaty Tata 2515 6.7L diesel + subtle turbocharger whistle under load
      osc1.frequency.setTargetAtTime(baseFreq, now, 0.07);
      osc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.07);
      osc3.frequency.setTargetAtTime(340 + rpmNorm * 580, now, 0.09); // gentle turbo whistle
      engineFilter.frequency.setTargetAtTime(145 + rpmNorm * 210 + throttle * 65, now, 0.08);
      if (lfoOsc) lfoOsc.frequency.setTargetAtTime(7.5 + rpmNorm * 14.0, now, 0.07);
      if (lfoGain) lfoGain.gain.setTargetAtTime(0.010 + throttle * 0.008, now, 0.08);
      engineGain.gain.setTargetAtTime(0.044 + throttle * 0.036, now, 0.08);
    } else if (soundProfile === 'hybrid_ecvt') {
      // Silky quiet Prius electric motor whir + smooth low-volume petrol hum at higher speeds
      osc1.frequency.setTargetAtTime(baseFreq, now, 0.08);
      osc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.08);
      osc3.frequency.setTargetAtTime(220 + rpmNorm * 460, now, 0.08); // soft EV inverter hum
      engineFilter.frequency.setTargetAtTime(280 + rpmNorm * 360, now, 0.09);
      engineGain.gain.setTargetAtTime(0.018 + throttle * 0.020, now, 0.09);
    } else if (soundProfile === 'sports_i6') {
      // Smooth, rich twin-turbo BMW M3 inline-6 growl (silky at 290 km/h, zero limiter stutter!)
      osc1.frequency.setTargetAtTime(baseFreq, now, 0.06);
      osc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.06);
      osc3.frequency.setTargetAtTime(baseFreq * 2.0, now, 0.06);
      engineFilter.frequency.setTargetAtTime(280 + rpmNorm * 680 + throttle * 140, now, 0.07);
      engineGain.gain.setTargetAtTime(0.034 + throttle * 0.040, now, 0.08);
    } else {
      // Smooth, distinct vehicle-specific engine voices (SUV V6, Diesel SUV, Sedan I4, Vans, Bikes)
      const h2 = (soundProfile === 'bike_sport' || soundProfile === 'bike_dirt') ? 2.0 : 1.5;
      const h3 = (soundProfile === 'suv_v6' || soundProfile === 'luxury_v6') ? 0.5 : 2.0;
      osc1.frequency.setTargetAtTime(baseFreq, now, 0.06);
      osc2.frequency.setTargetAtTime(baseFreq * h2, now, 0.06);
      osc3.frequency.setTargetAtTime(baseFreq * h3, now, 0.06);
      const fBase = (soundProfile === 'suv_diesel' || soundProfile === 'van_diesel') ? 190 : 250;
      engineFilter.frequency.setTargetAtTime(fBase + rpmNorm * 440 + throttle * 100, now, 0.07);
      engineGain.gain.setTargetAtTime(0.028 + throttle * 0.034, now, 0.08);
    }

    // Realistic filtered-noise rubber tire skid ONLY during true handbrake drift / extreme slides (ZERO chirping on normal steering!)
    if (slip > 0.45) {
      if (!screechNoiseSrc) {
        try {
          const nLen = Math.floor(audioCtx.sampleRate * 1.2);
          const nBuf = audioCtx.createBuffer(1, nLen, audioCtx.sampleRate);
          const ch = nBuf.getChannelData(0);
          for (let i = 0; i < nLen; i++) ch[i] = (Math.random() * 2 - 1) * 0.55;
          screechNoiseSrc = audioCtx.createBufferSource();
          screechNoiseSrc.buffer = nBuf;
          screechNoiseSrc.loop = true;
          screechFilter = audioCtx.createBiquadFilter();
          screechFilter.type = 'bandpass';
          screechFilter.frequency.value = 1050;
          screechFilter.Q.value = 1.15;
          const sLow = audioCtx.createBiquadFilter();
          sLow.type = 'lowpass';
          sLow.frequency.value = 2400;
          screechGain = audioCtx.createGain();
          screechGain.gain.value = 0.0;
          screechNoiseSrc.connect(screechFilter);
          screechFilter.connect(sLow);
          sLow.connect(screechGain);
          screechGain.connect(audioCtx.destination);
          screechNoiseSrc.start();
        } catch {}
      }
      if (screechFilter && screechGain) {
        screechFilter.frequency.setTargetAtTime(920 + slip * 360, now, 0.08);
        screechGain.gain.setTargetAtTime(Math.min(0.032, (slip - 0.45) * 0.055), now, 0.08);
      }
    } else if (screechGain) {
      screechGain.gain.setTargetAtTime(0.0, now, 0.08);
    }
  }

  function playCrashSound(intensity) {
    if (!state.driving) return;
    ensureAudio();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const vol = THREE.MathUtils.clamp(intensity * 0.24, 0.05, 0.28);
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(vol, now + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      g.connect(audioCtx.destination);
      const thud = audioCtx.createOscillator();
      thud.type = 'triangle';
      thud.frequency.setValueAtTime(115 + intensity * 40, now);
      thud.frequency.exponentialRampToValueAtTime(28, now + 0.22);
      thud.connect(g);
      thud.start(now);
      thud.stop(now + 0.27);
    } catch {}
  }

  function playGearShiftPop() {
    // Smooth, refined automatic/manual shift without harsh rev-limiter "pew-pew" stutter
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

  function playKickstandSound(isDown = false) {
    if (!state.hasKickstand) return;
    ensureAudio();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      // Crisp metallic spring snap + steel stop clack (deeper solid clank on motorcycle, lighter spring clack on bicycle)
      const isMoto = Boolean(config.isBike);
      const hits = isDown
        ? [[0.0, isMoto ? 540 : 880, 0.09], [0.045, isMoto ? 195 : 310, 0.12]]
        : [[0.0, isMoto ? 720 : 1120, 0.10], [0.032, isMoto ? 1420 : 2150, 0.08]];
      for (const [offset, freq, dur] of hits) {
        const t0 = now + offset;
        const o = audioCtx.createOscillator();
        const f = audioCtx.createBiquadFilter();
        const g = audioCtx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, t0);
        o.frequency.exponentialRampToValueAtTime(freq * 0.42, t0 + dur);
        f.type = 'bandpass';
        f.frequency.setValueAtTime(freq * 1.15, t0);
        f.Q.value = 3.2;
        g.gain.setValueAtTime(0.001, t0);
        g.gain.exponentialRampToValueAtTime(isMoto ? 0.16 : 0.12, t0 + 0.004);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        o.connect(f);
        f.connect(g);
        g.connect(audioCtx.destination);
        o.start(t0);
        o.stop(t0 + dur + 0.015);
      }
    } catch {}
  }

  function setKickstandDeploy(val, playSound = false) {
    if (!state.hasKickstand) {
      state.kickstandDeploy = 0;
      return;
    }
    const next = THREE.MathUtils.clamp(Number(val) || 0, 0, 1);
    const prev = state.kickstandDeploy;
    state.kickstandDeploy = next;
    if (playSound && Math.abs(next - prev) > 0.01) {
      playKickstandSound(next > prev);
    }
    syncTransform();
  }

  // Custom High-Quality Tata LPT 2515 10-Wheeler Truck Rig (10 spinning wheels, openable cab doors, chrome steel & full lighting)
  // Pass enableRealLights: false so parked truck never adds 4 always-on dynamic lights to the open-world scene!
  if (config.isTata2515) {
    measuredWheelRadius = 0.505;
    loadHighQualityTata2515(config.assetUrl, { enableRealLights: false })
      .then((api) => {
        tataTruckApi = api;
        exteriorWrapper = api.root;
        bodyTiltGroup.add(exteriorWrapper);
        carDoors = {
          FL: { key: 'FL', pivot: api.doors.fl, openSign: -1, maxAngle: THREE.MathUtils.degToRad(64), current: 0, target: 0 },
          FR: { key: 'FR', pivot: api.doors.fr, openSign: 1, maxAngle: THREE.MathUtils.degToRad(64), current: 0, target: 0 },
        };
        state.loaded = true;
        setQualityMode(currentQuality);
      })
      .catch((err) => {
        console.warn('Tata 2515 load warning:', err);
      });
  }

  // Load GLB asynchronously so startup stays fast (do not pass LoadingManager for optional extra cars so loading screen doesn't hang on 84MB Alphard)
  const loader = new GLTFLoader(config.isBMW ? manager : undefined);
  loader.setMeshoptDecoder(MeshoptDecoder);
  if (!config.isTata2515) loader.load(
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
      // Remove the built-in bottom Double Center-Stand meshes from 125cc Naked Sport (replaced by our flush working left side-stand!)
      if (config.id === 'bike_125cc') {
        const doubleStandNodes = new Set(['Cylinder.028', 'Cube.021', 'Cylinder.041', 'BezierCircle.001']);
        model.traverse((ch) => {
          if (doubleStandNodes.has(ch.name || '')) {
            ch.visible = false;
            ch.traverse((sub) => { sub.visible = false; });
          }
        });
      }
      // Hide any stray right-hand-drive steering wheel node (e.g. TownAce st00) so only the front-left steering wheel is shown
      if (String(config.id || '').startsWith('toyota_townace')) {
        model.traverse((ch) => {
          if (/^st00/i.test(ch.name || '')) ch.visible = false;
        });
      }

      const orientedWrapper = new THREE.Group();
      orientedWrapper.add(model);

      let cngProcWheelFront = null;
      let cngProcWheelRearL = null;
      let cngProcWheelRearR = null;
      if (config.isCNG) {
        // Perfectly center & level the CNG body/windshield so rear symmetry is dead-even, and mount symmetrical Bajaj RE 4.00-8 wheels!
        const cngBody = model.getObjectByName('CNG_Body');
        const cngGlass = model.getObjectByName('CNG_Windshield_Glass');
        if (cngBody) {
          cngBody.rotation.z = 0;
          cngBody.updateMatrixWorld(true);
          const bodyBox = new THREE.Box3().setFromObject(cngBody);
          const bodyCenterX = (bodyBox.min.x + bodyBox.max.x) * 0.5;
          if (Math.abs(bodyCenterX) > 0.002 && Math.abs(bodyCenterX) < 0.35) {
            cngBody.position.x -= bodyCenterX;
            if (cngGlass) cngGlass.position.x -= bodyCenterX;
          }
        }
        if (cngGlass) cngGlass.rotation.z = 0;
        const fs = model.getObjectByName('CNG_Front_Steer');
        const wf = model.getObjectByName('Wheel_Front');
        const wrl = model.getObjectByName('Wheel_Rear_L');
        const wrr = model.getObjectByName('Wheel_Rear_R');
        if (fs) fs.position.x = 0;

        // Hide the warped/lumpy raw GLB wheel meshes so our crisp symmetrical procedural wheels define exact ground contact (y = 0.000) & spin cleanly
        for (const oldW of [wf, wrl, wrr]) {
          if (oldW) {
            oldW.visible = false;
            oldW.traverse((o) => { o.visible = false; });
          }
        }

        const cngR = 0.245;
        const rearZ = -0.82;
        // Exact left-right symmetric rear track (0.54m each side from centerline X=0!)
        const rearHalfTrack = 0.54;
        const rearLX = rearHalfTrack;
        const rearRX = -rearHalfTrack;

        if (fs) {
          cngProcWheelFront = buildRealisticCNGWheel(cngR, 0.125, true, 1);
          cngProcWheelFront.name = 'CNG_Proc_Wheel_Front';
          cngProcWheelFront.position.set(0, -(fs.position.y - cngR), 0.04);
          fs.add(cngProcWheelFront);
        }
        cngProcWheelRearL = buildRealisticCNGWheel(cngR, 0.136, false, 1);
        cngProcWheelRearL.name = 'CNG_Proc_Wheel_Rear_L';
        cngProcWheelRearL.position.set(rearLX, cngR, rearZ);
        model.add(cngProcWheelRearL);

        cngProcWheelRearR = buildRealisticCNGWheel(cngR, 0.136, false, -1);
        cngProcWheelRearR.name = 'CNG_Proc_Wheel_Rear_R';
        cngProcWheelRearR.position.set(rearRX, cngR, rearZ);
        model.add(cngProcWheelRearR);

        // Symmetrical dark-steel rear axle beam + centered differential housing + twin rear shock struts
        const axleMat = new THREE.MeshStandardMaterial({
          name: 'CNG_Proc_Axle',
          color: 0x1b2026,
          roughness: 0.52,
          metalness: 0.62,
        });
        axleMat.userData = { keepMaterial: true };
        const axleSpan = rearHalfTrack * 2 - 0.06;
        const axleTube = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, axleSpan, 12), axleMat);
        axleTube.rotation.z = Math.PI / 2;
        axleTube.position.set(0, cngR, rearZ);
        model.add(axleTube);
        const diffBox = new THREE.Mesh(new THREE.SphereGeometry(0.072, 12, 10), axleMat);
        diffBox.scale.set(1.15, 0.92, 1.05);
        diffBox.position.set(0, cngR + 0.01, rearZ);
        model.add(diffBox);
        for (const sx of [rearHalfTrack - 0.12, -(rearHalfTrack - 0.12)]) {
          const shock = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.26, 10), axleMat);
          shock.position.set(sx, cngR + 0.14, rearZ);
          model.add(shock);
        }
      }
      if (config.rotateY) model.rotation.y = config.rotateY;
      if (config.rotateX) model.rotation.x = config.rotateX;
      if (config.rotateY || config.rotateX || config.isCNG) model.updateMatrixWorld(true);

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
        const reverseSet = new Set(config.reverseMats || []);
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
          const isTinyDetail = /spoke|chain|bolt|nut|rivet|nipple/i.test(`${child.name || ''} ${firstName}`);
          const shouldCast = Boolean(config.isRickshaw) && !isGlass && !isTinyDetail && (
            !config.shadowOnlyExterior || isBody || /hood|frame|wheel|tire|wood|bed|seat/i.test(firstName)
          );

          child.castShadow = shouldCast && shadowInRange;
          child.receiveShadow = !isGlass;
          if (shouldCast) carShadowMeshes.push(child);

          const outMats = srcMats.map((mat) => {
            if (mat.userData?.keepMaterial) {
              if ((mat.metalness ?? 0) >= 0.45) glossyMaterials.push(mat);
              return mat;
            }
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
              } else if (config.isGameReadyPrius) {
                // True 2-layer automotive pearl paint (low metalness so it looks painted, NOT bare steel!)
                out.metalness = 0.16;
                out.roughness = 0.22;
                out.clearcoat = 1.0;
                out.clearcoatRoughness = 0.05;
                out.envMapIntensity = 1.25;
              }
              paintMaterials.push(out);
              glossyMaterials.push(out);
            } else if (mName === 'Kit_GlossBlack') {
              out = new THREE.MeshPhysicalMaterial({
                name: mName,
                color: new THREE.Color('#0c0e13'),
                side: THREE.DoubleSide,
                metalness: 0.18,
                roughness: 0.14,
                clearcoat: 1.0,
                clearcoatRoughness: 0.04,
                envMapIntensity: 1.45,
              });
              glossyMaterials.push(out);
            } else if (glassSet.has(mName)) {
              if (config.isGameReadyCorolla) {
                const isHeadlightLens = mName === 'glass';
                out = new THREE.MeshPhysicalMaterial({
                  name: mName,
                  color: new THREE.Color(isHeadlightLens ? '#f4f8ff' : '#d8e4ee'),
                  side: THREE.DoubleSide,
                  transparent: true,
                  opacity: isHeadlightLens ? 0.11 : 0.16,
                  depthWrite: false,
                  metalness: 0.08,
                  roughness: 0.04,
                  clearcoat: 1.0,
                  clearcoatRoughness: 0.03,
                  reflectivity: 0.9,
                  envMapIntensity: 1.35,
                });
              } else {
                out = new THREE.MeshPhysicalMaterial({
                  name: mName,
                  color: new THREE.Color(config.isCNG ? '#142433' : '#0c1724'),
                  side: THREE.DoubleSide,
                  transparent: true,
                  opacity: config.isCNG ? 0.30 : 0.34,
                  depthWrite: false,
                  metalness: 0.35,
                  roughness: config.isCNG ? 0.05 : 0.06,
                  clearcoat: 1.0,
                  clearcoatRoughness: 0.04,
                  reflectivity: 1.0,
                  envMapIntensity: 1.85,
                });
              }
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
              if (config.isGameReadyCorolla) {
                out.emissiveIntensity = 1.05;
                out.roughness = 0.28;
              } else {
                out.emissive = new THREE.Color('#38bdf8');
                out.emissiveIntensity = 1.15;
                out.roughness = 0.25;
              }
            } else if (tailSet.has(mName)) {
              out = mat.clone();
              if ('transmission' in out && out.transmission > 0) out.transmission = 0;
              out.color = new THREE.Color('#d61424');
              out.emissive = new THREE.Color('#ff1228');
              out.emissiveIntensity = config.isGameReadyCorolla ? 1.5 : 2.1;
              tailMats.push(out);
            } else if (hlSet.has(mName)) {
              out = mat.clone();
              if ('transmission' in out && out.transmission > 0) out.transmission = 0;
              out.emissive = new THREE.Color('#fff5e0');
              out.emissiveIntensity = config.isGameReadyCorolla ? 1.55 : 2.0;
              drlMats.push(out);
            } else if (reverseSet.has(mName)) {
              out = mat.clone();
              if ('transmission' in out && out.transmission > 0) out.transmission = 0;
              out.emissive = new THREE.Color('#ffffff');
              out.emissiveIntensity = 0.0;
              reverseMats.push(out);
            } else {
              out = mat.clone();
              if ('transmission' in out && out.transmission > 0) out.transmission = 0;
              if (!config.isRickshaw && !config.isGameReadyCorolla && !out.transparent && !out.alphaTest
                && /int|leather|stitch|seat|dash|black|gray|dark|chrome|rim|tire|engine|brake|sunburst|carpet|wood/i.test(mName)) {
                out.side = THREE.FrontSide;
              }
              if (config.isGameReadyCorolla && /int_leather|seat|bolster|door/i.test(mName)) {
                out.side = THREE.DoubleSide;
              }
              if ('envMapIntensity' in out) {
                out.envMapIntensity = /chrome|cr|rim|mirror/i.test(mName) ? 1.55 : 1.0;
                if (/chrome|cr|rim|mirror|wheel|alloy/i.test(mName) || (out.metalness ?? 0) >= 0.45) {
                  glossyMaterials.push(out);
                }
              }
            }
            if (out.map && out.map.anisotropy < 8) {
              out.map.anisotropy = 8;
            }
            if (out.normalMap && out.normalMap.anisotropy < 8) {
              out.normalMap.anisotropy = 8;
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
              if (/chrome|spoke|aluminum|footwell|wheel_steel_rim|handlebar_steel/.test(mn)) {
                mat.metalness = Math.max(mat.metalness ?? 0.5, 0.88);
                mat.roughness = Math.min(mat.roughness ?? 0.5, 0.18);
                if ('envMapIntensity' in mat) mat.envMapIntensity = 1.9;
                glossyMaterials.push(mat);
              } else if (/hood_top|hood_side|hood_back|body_|van_wood_red|van_wood_green/.test(mn)) {
                mat.roughness = /van_wood/.test(mn) ? 0.52 : Math.min(mat.roughness ?? 0.6, 0.34);
                if ('envMapIntensity' in mat) mat.envMapIntensity = /van_wood/.test(mn) ? 0.95 : 1.35;
                paintMaterials.push(mat);
                glossyMaterials.push(mat);
              } else if (/paint_|frame_black|chassis_black|mudguard_steel/.test(mn)) {
                mat.roughness = Math.min(mat.roughness ?? 0.5, 0.28);
                mat.metalness = Math.max(mat.metalness ?? 0.2, 0.35);
                if ('envMapIntensity' in mat) mat.envMapIntensity = 1.45;
                glossyMaterials.push(mat);
              }
            }
          });

          const steering = model.getObjectByName('Steering_Assembly');
          const wheelFront = model.getObjectByName('Wheel_Front');
          const wheelRear = model.getObjectByName('Wheel_Rear');
          const wheelRearL = model.getObjectByName('Wheel_Rear_L');
          const wheelRearR = model.getObjectByName('Wheel_Rear_R');
          const rearSprocket = model.getObjectByName('Rear_Sprocket');
          const crank = model.getObjectByName('Crank_Assembly');
          const pedalL = model.getObjectByName('Pedal_L');
          const pedalR = model.getObjectByName('Pedal_R');
          const chainGroup = model.getObjectByName('Chain_Links');
          let chainLinks = null;
          let chainCurve = null;
          let chainLength = 1.0;
          if (chainGroup && chainGroup.children.length >= 8) {
            chainLinks = chainGroup.children.slice();
            const pts = chainLinks.map((ch) => ch.position.clone());
            chainCurve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.12);
            chainLength = Math.max(0.25, chainCurve.getLength());
          }
          if (config.isBicycle || config.isVan) {
            measuredWheelRadius = 0.355;
          }
          let gripAnchorL = null;
          let gripAnchorR = null;
          if (steering) {
            gripAnchorL = new THREE.Object3D();
            gripAnchorR = new THREE.Object3D();
            if (config.isBicycle) {
              gripAnchorL.position.set(0.286, 0.206, -0.150);
              gripAnchorR.position.set(-0.286, 0.206, -0.150);
            } else if (config.isVan) {
              gripAnchorL.position.set(0.293, 0.187, -0.155);
              gripAnchorR.position.set(-0.293, 0.187, -0.155);
            } else {
              gripAnchorL.position.set(0.294, 0.245, -0.137);
              gripAnchorR.position.set(-0.291, 0.245, -0.138);
            }
            steering.add(gripAnchorL);
            steering.add(gripAnchorR);
          }
          // Collect saddle meshes (Saddle_Assembly + any /saddle/i material mesh) so the saddle cleanly hides while the
          // rider's long panjabi covers it (zero back/cloth clipping!) and reappears automatically on [SHIFT] standing or dismount.
          const saddleMeshes = [];
          const saddleAsm = model.getObjectByName('Saddle_Assembly');
          if (saddleAsm) {
            saddleAsm.traverse((ch) => {
              if (ch.isMesh) saddleMeshes.push(ch);
            });
          }
          model.traverse((ch) => {
            if (!ch.isMesh || !ch.material || saddleMeshes.includes(ch)) return;
            const mats = Array.isArray(ch.material) ? ch.material : [ch.material];
            if (mats.some((mm) => /saddle/i.test(mm?.name || ''))) {
              saddleMeshes.push(ch);
            }
          });
          // Ergonomic upright seating anchor so back stays straight (16-20 deg) AND both hands lock 100% onto handlebar grips!
          const saddleAnchor = new THREE.Object3D();
          saddleAnchor.position.set(
            0,
            config.isBicycle ? 0.93 : (config.isVan ? 0.93 : 1.00),
            config.isBicycle ? -0.20 : (config.isVan ? 0.03 : -0.02),
          );
          orientedWrapper.add(saddleAnchor);
          const passengerAnchor = new THREE.Object3D();
          passengerAnchor.position.set(0, config.isBicycle ? 0.895 : 0.945, config.isBicycle ? -0.62 : -0.78);
          orientedWrapper.add(passengerAnchor);
          const passengerFootL = new THREE.Object3D();
          passengerFootL.position.set(config.isBicycle ? 0.22 : 0.15, config.isBicycle ? 0.42 : 0.62, config.isBicycle ? -0.50 : -0.34);
          orientedWrapper.add(passengerFootL);
          const passengerFootR = new THREE.Object3D();
          passengerFootR.position.set(config.isBicycle ? -0.22 : -0.15, config.isBicycle ? 0.42 : 0.62, config.isBicycle ? -0.50 : -0.34);
          orientedWrapper.add(passengerFootR);
          let vanSeats = null;
          if (config.isVan) {
            vanSeats = VAN_CORNER_SEAT_SPECS.map((spec) => {
              const seatObj = new THREE.Object3D();
              seatObj.position.set(...spec.seat);
              orientedWrapper.add(seatObj);
              const footLObj = new THREE.Object3D();
              footLObj.position.set(...spec.footL);
              orientedWrapper.add(footLObj);
              const footRObj = new THREE.Object3D();
              footRObj.position.set(...spec.footR);
              orientedWrapper.add(footRObj);
              const dismountObj = new THREE.Object3D();
              dismountObj.position.set(...spec.dismount);
              orientedWrapper.add(dismountObj);
              return {
                id: spec.id,
                label: spec.label,
                yawOffset: spec.yawOffset,
                seat: seatObj,
                footL: footLObj,
                footR: footRObj,
                dismount: dismountObj,
              };
            });
          }
          // Place ankle IK target at exact shoe-sole-to-ankle height (+0.118m) above pedal spindle so shoes rest cleanly ON TOP OF the pedals!
          const pedalFootL = new THREE.Object3D();
          pedalFootL.position.set(0.058, config.isBicycle ? 0.118 : (config.isVan ? 0.116 : 0.114), -0.026);
          if (pedalL) pedalL.add(pedalFootL);
          const pedalFootR = new THREE.Object3D();
          pedalFootR.position.set(-0.058, config.isBicycle ? 0.118 : (config.isVan ? 0.116 : 0.114), -0.026);
          if (pedalR) pedalR.add(pedalFootR);
          // Rig the EXISTING black rear kickstand meshes inside Frame_Static (Atlas Roadster Bicycle ONLY — zero extra geometry, NEVER on rickshaws/vans!)
          let kickstandPivot = null;
          let kickstandTipAnchor = null;
          if (config.isBicycle) {
            const frameStatic = model.getObjectByName('Frame_Static');
            if (frameStatic) {
              const ksMeshes = [];
              for (let i = 0; i < frameStatic.children.length; i++) {
                const ch = frameStatic.children[i];
                if (
                  ch.isMesh
                  && ch.position.x < -0.058
                  && ch.position.y > 0.18
                  && ch.position.y < 0.33
                  && ch.position.z < -0.70
                ) {
                  ksMeshes.push(ch);
                }
              }
              if (ksMeshes.length > 0) {
                // Mirror the existing GLB kickstand rod + rubber cap cleanly onto the OPPOSITE (+X, LEFT non-chain side!)
                // with positive normals (flip x position & y/z quaternion components — zero extra geometry, zero negative scale!)
                for (let i = 0; i < ksMeshes.length; i++) {
                  const m = ksMeshes[i];
                  m.position.x = -m.position.x;
                  m.quaternion.y = -m.quaternion.y;
                  m.quaternion.z = -m.quaternion.z;
                }
                model.updateMatrixWorld(true);
                kickstandPivot = new THREE.Group();
                kickstandPivot.name = 'BicycleKickstandPivot';
                kickstandPivot.position.set(0.062, 0.355, -0.575);
                kickstandPivot.rotation.order = 'ZYX';
                frameStatic.add(kickstandPivot);
                kickstandPivot.updateMatrixWorld(true);
                for (let i = 0; i < ksMeshes.length; i++) {
                  kickstandPivot.attach(ksMeshes[i]);
                }
                kickstandTipAnchor = new THREE.Object3D();
                kickstandTipAnchor.name = 'BicycleKickstandTip';
                kickstandTipAnchor.position.set(0.010, -0.105, -0.310);
                kickstandPivot.add(kickstandTipAnchor);
              }
            }
          }
          rickshawParts = {
            steering,
            steerRestQ: steering ? steering.quaternion.clone() : null,
            wheelFront,
            wheelRear,
            wheelRearL,
            wheelRearR,
            rearSprocket,
            crank,
            pedalL,
            pedalR,
            chainGroup,
            chainLinks,
            chainCurve,
            chainLength,
            gripAnchorL,
            gripAnchorR,
            saddleAnchor,
            saddleMeshes,
            passengerAnchor,
            passengerFootL,
            passengerFootR,
            vanSeats,
            pedalFootL,
            pedalFootR,
            kickstandPivot,
            kickstandTipAnchor,
          };
        } else if (config.isBike) {
          const res = rigMotorcycleWheels(orientedWrapper, config);
          riggedWheels = res.wheels;
          bikeFrontAssembly = res.frontAssemblyPivot || null;
          measuredWheelRadius = res.wheelRadius;

          // Build real 3D Transparent Headlight Glass + Chrome Reflector + Glowing Inner Bulb + Steering Beam toggled by [L]!
          const hlSpec = config.bikeRig?.headlight;
          const hlParent = bikeFrontAssembly || orientedWrapper;
          if (hlSpec && hlParent) {
            // Make existing GLB headlight lens transparent glass (FrontLight on Honda Bros, Cylinder001 front face on 125cc)
            orientedWrapper.traverse((ch) => {
              if (!ch.isMesh || !ch.material) return;
              const mats = Array.isArray(ch.material) ? ch.material : [ch.material];
              const mName = mats.map((mm) => mm?.name || '').join(' ');
              if (/FrontLight/i.test(mName)) {
                const glassMat = new THREE.MeshPhysicalMaterial({
                  color: 0xf4f8ff,
                  transparent: true,
                  opacity: 0.28,
                  roughness: 0.05,
                  metalness: 0.08,
                  clearcoat: 1.0,
                  clearcoatRoughness: 0.04,
                  depthWrite: false,
                });
                ch.material = glassMat;
              }
            });

            const stemP = config.bikeRig?.steerPivot || [0, 1.02, 0.38];
            const hlGroup = new THREE.Group();
            hlGroup.name = `BikeHeadlightAssembly_${config.id}`;
            if (bikeFrontAssembly) {
              hlGroup.position.set(hlSpec.pos[0] - stemP[0], hlSpec.pos[1] - stemP[1], hlSpec.pos[2] - stemP[2]);
            } else {
              hlGroup.position.set(hlSpec.pos[0], hlSpec.pos[1], hlSpec.pos[2]);
            }

            const reflectorMat = new THREE.MeshStandardMaterial({
              color: 0xeaf2fb,
              metalness: 0.96,
              roughness: 0.08,
              side: THREE.DoubleSide,
            });
            const bulbMat = new THREE.MeshStandardMaterial({
              color: 0xfff8e6,
              emissive: new THREE.Color(0xfff1c9),
              emissiveIntensity: 0.0,
              roughness: 0.12,
              metalness: 0.15,
            });
            const lensGlassMat = new THREE.MeshPhysicalMaterial({
              color: 0xf5f9ff,
              transparent: true,
              opacity: 0.26,
              roughness: 0.04,
              metalness: 0.05,
              clearcoat: 1.0,
              clearcoatRoughness: 0.03,
              depthWrite: false,
            });
            const haloMat = new THREE.MeshBasicMaterial({
              color: 0xfff4cf,
              transparent: true,
              opacity: 0.0,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              side: THREE.DoubleSide,
            });

            if (hlSpec.shape === 'round') {
              const r = hlSpec.radius || 0.072;
              const refl = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r * 0.45, 0.024, 24, 1, true), reflectorMat);
              refl.rotation.x = Math.PI * 0.5;
              refl.position.z = -0.004;
              hlGroup.add(refl);

              const backDish = new THREE.Mesh(new THREE.CircleGeometry(r * 0.88, 24), reflectorMat);
              backDish.position.z = -0.012;
              hlGroup.add(backDish);

              const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), bulbMat);
              bulb.scale.set(1.0, 1.0, 1.35);
              bulb.position.z = 0.004;
              hlGroup.add(bulb);

              const glass = new THREE.Mesh(new THREE.SphereGeometry(r * 0.96, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.42), lensGlassMat);
              glass.rotation.x = Math.PI * 0.5;
              glass.scale.set(1, 0.34, 1);
              glass.position.z = 0.012;
              hlGroup.add(glass);

              const halo = new THREE.Mesh(new THREE.CircleGeometry(r * 1.15, 24), haloMat);
              halo.position.z = 0.024;
              hlGroup.add(halo);
            } else {
              const hw = hlSpec.width || 0.108;
              const hh = hlSpec.height || 0.062;
              const backDish = new THREE.Mesh(new THREE.PlaneGeometry(hw * 0.94, hh * 0.92), reflectorMat);
              backDish.position.z = -0.008;
              hlGroup.add(backDish);

              const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.018, 14, 10), bulbMat);
              bulb.scale.set(1.15, 0.95, 1.25);
              bulb.position.z = 0.002;
              hlGroup.add(bulb);

              const glass = new THREE.Mesh(new THREE.PlaneGeometry(hw, hh), lensGlassMat);
              glass.position.z = 0.014;
              hlGroup.add(glass);

              const halo = new THREE.Mesh(new THREE.PlaneGeometry(hw * 1.25, hh * 1.35), haloMat);
              halo.position.z = 0.018;
              hlGroup.add(halo);
            }

            // Re-parent motorcycle headlight beam anchor onto steering headlight assembly so pooled beam turns with handlebar!
            if (headlightBeams.length > 0) {
              const b = headlightBeams[0];
              b.src.position.set(0, 0, 0.04);
              b.tgt.position.set(0, -0.78, 18);
              b.hlZ = 0;
              b.ox = 0;
              hlGroup.add(b.src, b.tgt);
            }
            hlParent.add(hlGroup);
            bikeHeadlightUnit = { group: hlGroup, bulbMat, haloMat, reflectorMat };
          }

          // 2) AAA CNC Machined Stainless-Steel Front Brake Disc + Drilled Ventilation Ring + Anodized Caliper + Ultra Steel Sheen!
          const steelDiscMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#e2ebf5'),
            metalness: 0.96,
            roughness: 0.14,
            clearcoat: 0.65,
            clearcoatRoughness: 0.08,
            envMapIntensity: 2.35,
            emissive: new THREE.Color('#2c3f57'),
            emissiveIntensity: currentQuality === 'ultra' ? 0.16 : (currentQuality === 'high' ? 0.07 : 0.0),
            side: THREE.DoubleSide,
          });
          glossyMaterials.push(steelDiscMat);
          bikeSteelDiscMat = steelDiscMat;

          const chromeForkMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#edf4fc'),
            metalness: 0.98,
            roughness: 0.08,
            clearcoat: 0.85,
            clearcoatRoughness: 0.04,
            envMapIntensity: 2.4,
          });
          glossyMaterials.push(chromeForkMat);

          // Upgrade existing front brake disc & chrome/steel parts directly on the GLB!
          orientedWrapper.traverse((ch) => {
            if (!ch.isMesh || !ch.material) return;
            const nName = ch.name || '';
            const pName = ch.parent?.name || '';
            const mats = Array.isArray(ch.material) ? ch.material : [ch.material];
            const mName = mats.map((mm) => mm?.name || '').join(' ');
            if (/BrakeDisk/i.test(mName) || /Cylinder056/i.test(pName) || /Cylinder056/i.test(nName)) {
              ch.material = steelDiscMat;
            } else if (/Chrome|Mirror/i.test(mName)) {
              for (const mm of mats) {
                mm.metalness = 0.96;
                mm.roughness = 0.10;
                if ('envMapIntensity' in mm) mm.envMapIntensity = 2.3;
                glossyMaterials.push(mm);
              }
            } else if (/ScratchedSteel/i.test(mName)) {
              for (const mm of mats) {
                mm.metalness = 0.90;
                mm.roughness = 0.22;
                if ('envMapIntensity' in mm) mm.envMapIntensity = 1.95;
                glossyMaterials.push(mm);
              }
            }
          });

          // Mount CNC Drilled Stainless-Steel Outer Rotor + Carrier Bolts onto front spinPivot & Metallic Caliper onto front wheelRoot!
          const frontWheelEntry = riggedWheels.find((w) => w.isFront);
          const discSpec = config.bikeRig?.frontDisc;
          if (frontWheelEntry && discSpec) {
            const discGroup = new THREE.Group();
            discGroup.name = `BikeSteelBrakeDisc_${config.id}`;
            discGroup.position.set(discSpec.sideX, 0, 0);
            const rOut = discSpec.radius || 0.122;
            const rMid = rOut * 0.66;
            const rotorRing = new THREE.Mesh(new THREE.RingGeometry(rMid, rOut, 32), steelDiscMat);
            rotorRing.rotation.y = Math.PI * 0.5;
            discGroup.add(rotorRing);
            const rotorEdge = new THREE.Mesh(new THREE.CylinderGeometry(rOut, rOut, 0.0055, 32, 1, true), steelDiscMat);
            rotorEdge.rotation.z = Math.PI * 0.5;
            discGroup.add(rotorEdge);
            // Dark gunmetal inner floating carrier + 6 stainless bobbins & vent slots
            const carrierMat = new THREE.MeshStandardMaterial({ color: 0x222831, metalness: 0.82, roughness: 0.28 });
            const carrier = new THREE.Mesh(new THREE.RingGeometry(rOut * 0.30, rMid + 0.004, 24), carrierMat);
            carrier.rotation.y = Math.PI * 0.5;
            discGroup.add(carrier);
            const holeMat = new THREE.MeshStandardMaterial({ color: 0x10141b, roughness: 0.7, metalness: 0.3 });
            const boltGeo = new THREE.CylinderGeometry(0.0055, 0.0055, 0.009, 8);
            const holeGeo = new THREE.CylinderGeometry(0.0042, 0.0042, 0.007, 6);
            for (let k = 0; k < 6; k++) {
              const a = (k / 6) * Math.PI * 2;
              const bobbin = new THREE.Mesh(boltGeo, chromeForkMat);
              bobbin.rotation.z = Math.PI * 0.5;
              bobbin.position.set(0, Math.cos(a) * rMid, Math.sin(a) * rMid);
              discGroup.add(bobbin);
              // Drilled rotor cooling holes (2 per sector)
              for (let h = 0; h < 2; h++) {
                const ha = a + 0.24 + h * 0.26;
                const hr = rMid + (rOut - rMid) * (h === 0 ? 0.38 : 0.72);
                const vent = new THREE.Mesh(holeGeo, holeMat);
                vent.rotation.z = Math.PI * 0.5;
                vent.position.set(0, Math.cos(ha) * hr, Math.sin(ha) * hr);
                discGroup.add(vent);
              }
            }
            frontWheelEntry.spinGroup.add(discGroup);

            // Anodized Gold/Bronze Nissin-style front brake caliper fixed to frontSteer gripping rear edge of spinning steel disc!
            const caliperMat = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color('#c89d3c'),
              metalness: 0.85,
              roughness: 0.24,
              clearcoat: 0.6,
              envMapIntensity: 1.85,
            });
            glossyMaterials.push(caliperMat);
            const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.072, 0.048), caliperMat);
            caliper.position.set(discSpec.sideX - 0.005, 0.025, -rOut * 0.82);
            caliper.rotation.x = 0.22;
            frontWheelEntry.wheelRoot.add(caliper);
          }

          // 3) Real 3D Transparent Ruby-Red Taillight + Chrome Reflector + Inner LED Bulb + Dynamic Brake Light Flare!
          const tlSpec = config.bikeRig?.taillight;
          if (tlSpec) {
            const tlGroup = new THREE.Group();
            tlGroup.name = `BikeTaillightAssembly_${config.id}`;
            tlGroup.position.set(tlSpec.pos[0], tlSpec.pos[1], tlSpec.pos[2]);

            const tw = tlSpec.width || 0.118;
            const th = tlSpec.height || 0.044;
            const tlReflMat = new THREE.MeshStandardMaterial({
              color: 0xf1f5f9,
              metalness: 0.96,
              roughness: 0.09,
              side: THREE.DoubleSide,
            });
            const tlBulbMat = new THREE.MeshStandardMaterial({
              color: 0xff2a2a,
              emissive: new THREE.Color(0xff1414),
              emissiveIntensity: 0.0,
              roughness: 0.14,
              metalness: 0.1,
            });
            const tlGlassMat = new THREE.MeshPhysicalMaterial({
              color: 0xcc0c18,
              emissive: new THREE.Color(0x660008),
              emissiveIntensity: 0.0,
              transparent: true,
              opacity: 0.34,
              roughness: 0.05,
              metalness: 0.05,
              clearcoat: 1.0,
              clearcoatRoughness: 0.03,
              depthWrite: false,
            });
            const tlHaloMat = new THREE.MeshBasicMaterial({
              color: 0xff2222,
              transparent: true,
              opacity: 0.0,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              side: THREE.DoubleSide,
            });

            // Make existing GLB rear taillight lens transparent ruby glass too
            orientedWrapper.traverse((ch) => {
              if (!ch.isMesh || !ch.material) return;
              const pName = ch.parent?.name || '';
              if (config.id === 'bike_125cc' && /Cube022/i.test(pName)) {
                ch.material = tlGlassMat;
              }
            });

            const tlBack = new THREE.Mesh(new THREE.PlaneGeometry(tw * 0.90, th * 0.84), tlReflMat);
            tlBack.rotation.y = Math.PI;
            tlBack.position.z = 0.008;
            tlGroup.add(tlBack);

            // Inner glowing dual-LED / filament bulb visible through the transparent ruby lens!
            const tlBulbL = new THREE.Mesh(new THREE.SphereGeometry(Math.min(tw, th) * 0.34, 12, 10), tlBulbMat);
            tlBulbL.position.set(-tw * 0.22, 0, -0.002);
            const tlBulbR = new THREE.Mesh(new THREE.SphereGeometry(Math.min(tw, th) * 0.34, 12, 10), tlBulbMat);
            tlBulbR.position.set(tw * 0.22, 0, -0.002);
            tlGroup.add(tlBulbL, tlBulbR);

            const tlLens = new THREE.Mesh(new THREE.BoxGeometry(tw, th, 0.016), tlGlassMat);
            tlLens.position.z = -0.012;
            tlGroup.add(tlLens);

            const tlHalo = new THREE.Mesh(new THREE.PlaneGeometry(tw * 1.12, th * 1.22), tlHaloMat);
            tlHalo.rotation.y = Math.PI;
            tlHalo.position.z = -0.024;
            tlGroup.add(tlHalo);

            // Emissive dual LEDs + ruby lens + halo cleanly illuminate taillight with ZERO PointLight shader bloat or number-plate washout!
            bodyTiltGroup.add(tlGroup);
            bikeTaillightUnit = { group: tlGroup, bulbMat: tlBulbMat, glassMat: tlGlassMat, haloMat: tlHaloMat, glowLight: null };
          }

          // 4) Extra Showroom Motorcycle Detailing: Stainless Exhaust End-Cap & Dark Bore + Rear CNC Disc + Amber Turn-Signal Lenses!
          if (exhaustTipLocal) {
            const exhaustDetail = new THREE.Group();
            exhaustDetail.name = `BikeExhaustMuzzle_${config.id}`;
            exhaustDetail.position.copy(exhaustTipLocal);
            // Polished stainless steel outer exhaust bevel ring
            const tipRing = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.032, 16, 1, true), chromeForkMat);
            tipRing.rotation.x = Math.PI * 0.5;
            tipRing.position.z = 0.012;
            exhaustDetail.add(tipRing);
            // Recessed matte-black inner exhaust bore where smoke physically exits!
            const boreMat = new THREE.MeshStandardMaterial({ color: 0x0b0d11, roughness: 0.92, metalness: 0.25 });
            const bore = new THREE.Mesh(new THREE.CircleGeometry(0.022, 14), boreMat);
            bore.rotation.y = Math.PI;
            bore.position.z = -0.002;
            exhaustDetail.add(bore);
            bodyTiltGroup.add(exhaustDetail);
          }

          // Matching Rear CNC Stainless-Steel Brake Rotor & Gold Caliper on rear wheel right side (-X)!
          const rearWheelEntry = riggedWheels.find((w) => !w.isFront);
          if (rearWheelEntry && discSpec) {
            const rDisc = new THREE.Group();
            rDisc.name = `BikeRearSteelDisc_${config.id}`;
            rDisc.position.set(-0.044, 0, 0);
            const rR = (discSpec.radius || 0.122) * 0.80;
            const rRing = new THREE.Mesh(new THREE.RingGeometry(rR * 0.62, rR, 28), steelDiscMat);
            rRing.rotation.y = Math.PI * 0.5;
            rDisc.add(rRing);
            const rEdge = new THREE.Mesh(new THREE.CylinderGeometry(rR, rR, 0.005, 28, 1, true), steelDiscMat);
            rEdge.rotation.z = Math.PI * 0.5;
            rDisc.add(rEdge);
            rearWheelEntry.spinGroup.add(rDisc);

            const rCaliperMat = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color('#c89d3c'),
              metalness: 0.85,
              roughness: 0.24,
              clearcoat: 0.6,
              envMapIntensity: 1.8,
            });
            glossyMaterials.push(rCaliperMat);
            const rCal = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.054, 0.042), rCaliperMat);
            rCal.position.set(-0.048, rR * 0.78, 0.025);
            rearWheelEntry.wheelRoot.add(rCal);
          }

          // Glossy translucent amber turn-signal lenses flanking headlight & taillight!
          const amberLensMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#f59e0b'),
            emissive: new THREE.Color('#78350f'),
            emissiveIntensity: 0.12,
            transparent: true,
            opacity: 0.78,
            roughness: 0.10,
            metalness: 0.08,
            clearcoat: 1.0,
          });
          if (hlSpec && hlParent) {
            const stemP = config.bikeRig?.steerPivot || [0, 1.02, 0.38];
            const baseZ = bikeFrontAssembly ? (hlSpec.pos[2] - stemP[2] - 0.02) : (hlSpec.pos[2] - 0.02);
            const baseY = bikeFrontAssembly ? (hlSpec.pos[1] - stemP[1] - 0.01) : (hlSpec.pos[1] - 0.01);
            for (const sx of [-1, 1]) {
              const indF = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 8), amberLensMat);
              indF.scale.set(1.25, 0.85, 1.15);
              indF.position.set(sx * 0.135, baseY, baseZ);
              hlParent.add(indF);
            }
          }
          if (tlSpec) {
            for (const sx of [-1, 1]) {
              const indR = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 8), amberLensMat);
              indR.scale.set(1.25, 0.85, 1.15);
              indR.position.set(sx * 0.125, tlSpec.pos[1] - 0.02, tlSpec.pos[2] + 0.01);
              bodyTiltGroup.add(indR);
            }
          }
        } else if (config.isCNG) {
          const frontSteer = model.getObjectByName('CNG_Front_Steer');
          const wheelFront = model.getObjectByName('Wheel_Front');
          const handlebar = model.getObjectByName('CNG_Handlebar');
          const wheelRearL = model.getObjectByName('Wheel_Rear_L');
          const wheelRearR = model.getObjectByName('Wheel_Rear_R');
          let gripL = null;
          let gripR = null;
          if (handlebar) {
            gripL = new THREE.Object3D();
            gripL.position.set(0.22, 0.04, -0.16);
            handlebar.add(gripL);
            gripR = new THREE.Object3D();
            gripR.position.set(-0.22, 0.04, -0.16);
            handlebar.add(gripR);
          }
          measuredWheelRadius = 0.245;
          cngParts = {
            frontSteer,
            wheelFront: cngProcWheelFront || wheelFront,
            handlebar,
            wheelRearL: cngProcWheelRearL || wheelRearL,
            wheelRearR: cngProcWheelRearR || wheelRearR,
            gripL,
            gripR,
          };
        } else if (config.isGameReadyCorolla || config.isGameReadyPrius) {
          const find = (n) => orientedWrapper.getObjectByName(n) || null;
          const wheelFL = find('Wheel_FL');
          const wheelFR = find('Wheel_FR');
          const wheelRL = find('Wheel_RL');
          const wheelRR = find('Wheel_RR');
          const wheelFLSteer = find('Wheel_FL_Steer');
          const wheelFRSteer = find('Wheel_FR_Steer');
          const steeringWheel = find('Steering_Wheel');
          const lightsGroup = find('Lights');
          corollaParts = {
            wheelFL, wheelFR, wheelRL, wheelRR,
            wheelFLSteer, wheelFRSteer,
            steeringWheel,
            lightsGroup,
            headlights: [find('Light_Headlight_L'), find('Light_Headlight_R')].filter(Boolean),
            fogLights: [find('Light_Fog_L'), find('Light_Fog_R')].filter(Boolean),
            taillights: [find('Light_Taillight_L'), find('Light_Taillight_R')].filter(Boolean),
            brakeLights: [find('Light_Brake_L'), find('Light_Brake_R'), find('Light_Brake_Center')].filter(Boolean),
            reverseLights: [find('Light_Reverse_L'), find('Light_Reverse_R')].filter(Boolean),
            indLeft: [find('Light_Indicator_FL'), find('Light_Indicator_RL')].filter(Boolean),
            indRight: [find('Light_Indicator_FR'), find('Light_Indicator_RR')].filter(Boolean),
            domeLight: find('Light_Interior_Dome'),
            dashLight: find('Light_Dash_Cluster'),
          };
          for (const grp of [corollaParts.headlights, corollaParts.fogLights, corollaParts.taillights, corollaParts.brakeLights, corollaParts.reverseLights, corollaParts.indLeft, corollaParts.indRight]) {
            for (const obj of grp) obj.visible = false;
          }
          if (corollaParts.domeLight) corollaParts.domeLight.visible = false;
          if (corollaParts.dashLight) corollaParts.dashLight.visible = false;
          measuredWheelRadius = 0.32;
        } else {
          if (config.wheelNameRegex || config.wheelMatRegex) {
            const res = rigGenericCarWheels(orientedWrapper, config.wheelNameRegex, config.wheelMatRegex);
            riggedWheels = res.wheels;
            measuredWheelRadius = res.wheelRadius;
          }
        }
      }

      // Keep original full-detail exterior car geometry intact; wire native hinged doors for game-ready vehicles
      carDoors = {};
      if (config.isGameReadyCorolla || config.isGameReadyPrius || config.hasNativeDoors) {
        const doorDefs = [
          { key: 'FL', nodeName: 'Door_FL', side: -1 },
          { key: 'FR', nodeName: 'Door_FR', side: 1 },
          { key: 'RL', nodeName: 'Door_RL', side: -1 },
          { key: 'RR', nodeName: 'Door_RR', side: 1 },
        ];
        for (const def of doorDefs) {
          const pivot = orientedWrapper.getObjectByName(def.nodeName);
          if (pivot) {
            carDoors[def.key] = {
              key: def.key,
              pivot,
              side: def.side,
              sliding: false,
              restPos: pivot.position.clone(),
              current: 0,
              target: 0,
            };
          }
        }
      }

      if (config.builtInSteeringNode) {
        builtInSteeringWheel = model.getObjectByName(config.builtInSteeringNode) || null;
      }

      // Batch all static chassis/interior child meshes by material (cuts 4,098 Alphard draw calls down to ~35!)
      const dynamicNodes = new Set();
      if (builtInSteeringWheel) {
        builtInSteeringWheel.traverse((o) => {
          if (o.isMesh) dynamicNodes.add(o);
        });
      }
      for (const w of riggedWheels) {
        w.wheelRoot?.traverse((o) => {
          if (o.isMesh) dynamicNodes.add(o);
        });
      }
      for (const d of Object.values(carDoors)) {
        d.pivot?.traverse((o) => {
          if (o.isMesh) dynamicNodes.add(o);
        });
      }
      if (corollaParts) {
        const dynRoots = [
          corollaParts.wheelFLSteer, corollaParts.wheelFRSteer,
          corollaParts.wheelFL, corollaParts.wheelFR, corollaParts.wheelRL, corollaParts.wheelRR,
          corollaParts.steeringWheel, corollaParts.lightsGroup,
        ];
        for (const r of dynRoots) {
          r?.traverse((o) => {
            if (o.isMesh) dynamicNodes.add(o);
          });
        }
      }
      if (bikeFrontAssembly) {
        bikeFrontAssembly.traverse((o) => {
          if (o.isMesh) dynamicNodes.add(o);
        });
      }
      if (rickshawParts) {
        // Batch static child meshes inside each rigid spinning/steering sub-assembly (cuts 450+ spoke/fork/crank draw calls down to ~15!)
        const emptySkip = new Set();
        for (const wheelNode of [rickshawParts.wheelFront, rickshawParts.wheelRear, rickshawParts.wheelRearL, rickshawParts.wheelRearR, rickshawParts.rearSprocket, rickshawParts.pedalL, rickshawParts.pedalR]) {
          if (wheelNode?.isObject3D) batchStaticCarMeshes(wheelNode, emptySkip);
        }
        if (rickshawParts.crank?.isObject3D) {
          const pedalSkip = new Set();
          for (const pNode of [rickshawParts.pedalL, rickshawParts.pedalR]) {
            pNode?.traverse?.((o) => { if (o.isMesh) pedalSkip.add(o); });
          }
          batchStaticCarMeshes(rickshawParts.crank, pedalSkip);
        }
        if (rickshawParts.steering?.isObject3D) {
          const wheelSkip = new Set();
          rickshawParts.wheelFront?.traverse?.((o) => { if (o.isMesh) wheelSkip.add(o); });
          batchStaticCarMeshes(rickshawParts.steering, wheelSkip);
        }
        for (const v of Object.values(rickshawParts)) {
          if (v?.isObject3D) {
            v.traverse((o) => {
              if (o.isMesh) dynamicNodes.add(o);
            });
          }
        }
        if (rickshawParts.saddleMeshes) {
          for (const sm of rickshawParts.saddleMeshes) dynamicNodes.add(sm);
        }
      }
      if (cngParts) {
        for (const v of Object.values(cngParts)) {
          if (v?.isObject3D) {
            v.traverse((o) => {
              if (o.isMesh) dynamicNodes.add(o);
            });
          }
        }
      }
      // Preserve full un-merged steel/chrome mudguards, forks & frames on bicycles/rickshaws so curved steel parts never deform!
      if (!config.isBicycle && !config.isRickshaw) {
        batchStaticCarMeshes(orientedWrapper, dynamicNodes);
      }

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
    if (config.isGameReadyCorolla || config.isGameReadyPrius) {
      root.updateMatrixWorld(true);
      outEye.set(0.36, 1.18, -0.05);
      outLook.set(0.36, 1.12, 8.0);
      bodyTiltGroup.localToWorld(outEye);
      bodyTiltGroup.localToWorld(outLook);
      return true;
    }
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
    passengerYawOffset: 0,
    passengerSeatIndex: 0,
    passengerSeatLabel: '',
    pedalL: new THREE.Vector3(),
    pedalR: new THREE.Vector3(),
    gripL: new THREE.Vector3(),
    gripR: new THREE.Vector3(),
    kickstandTip: new THREE.Vector3(),
    hasKickstandTip: false,
  };

  const carDriverAnchorCache = {
    seat: new THREE.Vector3(),
    footL: new THREE.Vector3(),
    footR: new THREE.Vector3(),
    gripL: new THREE.Vector3(),
    gripR: new THREE.Vector3(),
    kickstandTip: new THREE.Vector3(),
    hasKickstandTip: false,
  };

  function getCarDriverAnchors() {
    if (!carDriverRig) return null;
    root.updateMatrixWorld(true);
    carDriverRig.seatAnchor.getWorldPosition(carDriverAnchorCache.seat);
    carDriverRig.footL.getWorldPosition(carDriverAnchorCache.footL);
    carDriverRig.footR.getWorldPosition(carDriverAnchorCache.footR);
    if (cngParts?.gripL && cngParts?.gripR) {
      cngParts.gripL.getWorldPosition(carDriverAnchorCache.gripL);
      cngParts.gripR.getWorldPosition(carDriverAnchorCache.gripR);
    } else {
      carDriverRig.gripL.getWorldPosition(carDriverAnchorCache.gripL);
      carDriverRig.gripR.getWorldPosition(carDriverAnchorCache.gripR);
    }
    carDriverAnchorCache.hasKickstandTip = false;
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
    if (bikeKickstandTipAnchor) {
      bikeKickstandTipAnchor.getWorldPosition(carDriverAnchorCache.kickstandTip);
      carDriverAnchorCache.hasKickstandTip = true;
    } else {
      carDriverAnchorCache.hasKickstandTip = false;
    }
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

  const tmpVanSeatPos = new THREE.Vector3();
  function findNearestVanSeatIndex(worldPos) {
    if (!config.isVan || !rickshawParts?.vanSeats?.length || !worldPos) return 0;
    root.updateMatrixWorld(true);
    let bestIdx = 0;
    let bestDistSq = Infinity;
    for (let i = 0; i < rickshawParts.vanSeats.length; i++) {
      rickshawParts.vanSeats[i].seat.getWorldPosition(tmpVanSeatPos);
      const dx = worldPos.x - tmpVanSeatPos.x;
      const dz = worldPos.z - tmpVanSeatPos.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  function getVanSeatPose(seatIdx = state.passengerSeatIndex) {
    if (!config.isVan || !rickshawParts?.vanSeats?.length) return null;
    root.updateMatrixWorld(true);
    const idx = ((seatIdx % 4) + 4) % 4;
    const s = rickshawParts.vanSeats[idx];
    const seatPos = new THREE.Vector3();
    const dismountPos = new THREE.Vector3();
    s.seat.getWorldPosition(seatPos);
    s.dismount.getWorldPosition(dismountPos);
    return {
      index: idx,
      id: s.id,
      label: s.label,
      yawOffset: s.yawOffset,
      seatPos,
      dismountPos,
    };
  }

  function getRickshawAnchors() {
    if (!rickshawParts) return null;
    root.updateMatrixWorld(true);
    rickshawParts.saddleAnchor.getWorldPosition(anchorCache.saddle);
    if (config.isVan && rickshawParts.vanSeats?.length) {
      const idx = ((state.passengerSeatIndex % rickshawParts.vanSeats.length) + rickshawParts.vanSeats.length) % rickshawParts.vanSeats.length;
      const s = rickshawParts.vanSeats[idx];
      s.seat.getWorldPosition(anchorCache.passengerSeat);
      s.footL.getWorldPosition(anchorCache.passengerFootL);
      s.footR.getWorldPosition(anchorCache.passengerFootR);
      anchorCache.passengerYawOffset = s.yawOffset;
      anchorCache.passengerSeatIndex = idx;
      anchorCache.passengerSeatLabel = s.label;
    } else {
      rickshawParts.passengerAnchor.getWorldPosition(anchorCache.passengerSeat);
      if (rickshawParts.passengerFootL) rickshawParts.passengerFootL.getWorldPosition(anchorCache.passengerFootL);
      if (rickshawParts.passengerFootR) rickshawParts.passengerFootR.getWorldPosition(anchorCache.passengerFootR);
      anchorCache.passengerYawOffset = 0;
      anchorCache.passengerSeatIndex = 0;
      anchorCache.passengerSeatLabel = '';
    }
    if (rickshawParts.pedalFootL) rickshawParts.pedalFootL.getWorldPosition(anchorCache.pedalL);
    if (rickshawParts.pedalFootR) rickshawParts.pedalFootR.getWorldPosition(anchorCache.pedalR);
    if (rickshawParts.gripAnchorL) rickshawParts.gripAnchorL.getWorldPosition(anchorCache.gripL);
    if (rickshawParts.gripAnchorR) rickshawParts.gripAnchorR.getWorldPosition(anchorCache.gripR);
    if (config.isBicycle && rickshawParts.kickstandTipAnchor) {
      rickshawParts.kickstandTipAnchor.getWorldPosition(anchorCache.kickstandTip);
      anchorCache.hasKickstandTip = true;
    } else {
      anchorCache.hasKickstandTip = false;
    }
    return anchorCache;
  }

  const chainPt = new THREE.Vector3();
  const chainTan = new THREE.Vector3();

  function syncTransform() {
    root.position.copy(state.pos);
    root.rotation.y = state.heading;
    const ks = state.hasKickstand ? THREE.MathUtils.clamp(state.kickstandDeploy || 0, 0, 1) : 0;
    // Parked kickstand lean ONLY for Bicycle & Motorcycle (both lean gently onto LEFT +X kickstand side), NEVER Rickshaw/Van!
    const parkedLeanRoll = config.isBicycle ? (-0.140 * ks) : (config.isBike ? (-0.145 * ks) : 0);
    const totalRoll = state.roll + parkedLeanRoll;
    // Exact geometric non-penetration tire-contact guard: keeps tires flush & gripping asphalt (NEVER sinking underground during braking, leaning, cornering, or bumps!)
    const wheelbaseHalf = Math.max(0.55, state.halfLength * 0.68);
    const trackHalf = (config.isBike || config.isBicycle)
      ? 0.068
      : (config.isCNG ? 0.54 : Math.max(0.42, state.halfWidth * 0.86));
    const pitchDrop = Math.abs(Math.sin(state.pitch)) * wheelbaseHalf;
    const rollDrop = Math.abs(Math.sin(totalRoll)) * trackHalf;
    const minSafeBodyY = pitchDrop + rollDrop;
    const rawHeave = config.isBike
      ? THREE.MathUtils.clamp(state.frontSuspOffset * 0.45 + state.rearSuspOffset * 0.55 + state.suspHeave * 0.35 + (state.riderSag || 0), -0.018, 0.014)
      : ((config.isRickshaw || config.isBicycle) ? 0 : state.suspHeave);
    bodyTiltGroup.position.y = Math.max(minSafeBodyY, minSafeBodyY + Math.max(0, rawHeave));
    bodyTiltGroup.rotation.x = state.pitch;
    bodyTiltGroup.rotation.z = totalRoll;
    if (bikeKickstandPivot) {
      // Straight-down stance (-1.48 rad ≈ 85 deg) with crisp outward splay (+0.32 rad) so flat pad touches asphalt flush (y = 0.000)!
      bikeKickstandPivot.rotation.x = -1.48 * ks;
      bikeKickstandPivot.rotation.z = 0.32 * ks;
    }
    if (contactShadow) {
      contactShadow.rotation.x = -Math.PI * 0.5 + state.terrainPitch;
      contactShadow.rotation.y = -state.terrainRoll;
      contactShadow.position.y = Math.max(0.012, 0.012 + Math.abs(Math.sin(state.terrainPitch)) * 0.12);
    }
    if (carDriverRig) {
      carDriverRig.rigGroup.visible = (state.driving && state.cameraMode !== 'interior') || state.aiDriving;
      carDriverRig.wheelSpin.rotation.z = -state.steerAngle * 2.65;
    }
    if (builtInSteeringWheel) {
      builtInSteeringWheel.rotation.z = state.steerAngle * 2.65;
    }
    if (bikeDriverRig) {
      bikeDriverRig.steerPivot.rotation.y = state.steerAngle * 0.95;
    }
    if (bikeFrontAssembly) {
      bikeFrontAssembly.rotation.y = state.steerAngle * 0.95;
    }
    syncPooledHeadlights();
    for (const d of Object.values(carDoors)) {
      applyDoorPose(d);
    }
    syncInteriorVisibility();
    if (cockpitRig && cockpitRig.group.visible) {
      cockpitRig.update(state);
    }

    if (rickshawParts) {
      if (config.isBicycle && rickshawParts.kickstandPivot) {
        // Nearly straight vertical downward stance on LEFT (+X) side with rubber foot touching asphalt flush (y ≈ 0.00)!
        rickshawParts.kickstandPivot.rotation.x = -1.00 * ks;
        rickshawParts.kickstandPivot.rotation.z = 0.65 * ks;
      }
      if (rickshawParts.saddleMeshes?.length) {
        const hideSaddle = Boolean(state.driving && state.rideSeat === 'driver' && (state.standingBlend || 0) < 0.25);
        for (let i = 0; i < rickshawParts.saddleMeshes.length; i++) {
          rickshawParts.saddleMeshes[i].visible = !hideSaddle;
        }
      }
      if (rickshawParts.steering && rickshawParts.steerRestQ) {
        steerDeltaQ.setFromAxisAngle(steerAxisY, state.steerAngle * (config.isBicycle ? 0.78 : (config.isVan ? 1.0 : 1.15)));
        rickshawParts.steering.quaternion.copy(rickshawParts.steerRestQ).multiply(steerDeltaQ);
      }
      if (rickshawParts.wheelFront) rickshawParts.wheelFront.rotation.x = state.wheelSpin;
      if (rickshawParts.wheelRear) rickshawParts.wheelRear.rotation.x = state.wheelSpin;
      if (rickshawParts.wheelRearL) rickshawParts.wheelRearL.rotation.x = state.wheelSpin;
      if (rickshawParts.wheelRearR) rickshawParts.wheelRearR.rotation.x = state.wheelSpin;
      if (rickshawParts.rearSprocket) rickshawParts.rearSprocket.rotation.x = state.wheelSpin;
      if (rickshawParts.crank) rickshawParts.crank.rotation.x = state.pedalPhase;
      if (rickshawParts.pedalL) rickshawParts.pedalL.rotation.x = -state.pedalPhase;
      if (rickshawParts.pedalR) rickshawParts.pedalR.rotation.x = -state.pedalPhase;
      if (rickshawParts.chainLinks && rickshawParts.chainCurve) {
        const n = rickshawParts.chainLinks.length;
        const advance = (state.pedalPhase * (config.isBicycle ? 0.096 : (config.isVan ? 0.094 : 0.092))) / rickshawParts.chainLength;
        for (let i = 0; i < n; i++) {
          let u = (i / n + advance) % 1;
          if (u < 0) u += 1;
          rickshawParts.chainCurve.getPointAt(u, chainPt);
          rickshawParts.chainCurve.getTangentAt(u, chainTan);
          const lnk = rickshawParts.chainLinks[i];
          lnk.position.copy(chainPt);
          lnk.rotation.x = Math.atan2(-chainTan.y, chainTan.z);
        }
      }
      return;
    }

    if (tataTruckApi) {
      const w = tataTruckApi.wheels;
      for (const wn of ['fl', 'fr', 'rl1', 'rr1', 'rl2', 'rr2']) {
        if (w[wn]) w[wn].rotation.x = state.wheelSpin;
      }
      if (w.flSteer) w.flSteer.rotation.y = state.steerAngle;
      if (w.frSteer) w.frSteer.rotation.y = state.steerAngle;
      if (tataTruckApi.steeringWheel) tataTruckApi.steeringWheel.rotation.z = -state.steerAngle * 4.5;
      if (carDoors.FL?.pivot) carDoors.FL.pivot.rotation.y = carDoors.FL.current * carDoors.FL.openSign;
      if (carDoors.FR?.pivot) carDoors.FR.pivot.rotation.y = carDoors.FR.current * carDoors.FR.openSign;
      tataTruckApi.applyLights({
        headlights: state.headlightsMode > 0,
        highBeam: state.headlightsMode >= 2,
        brake: state.driving && (state.isBraking || state.speed < -0.05 || state.lastImpactIntensity > 0.08),
        reverse: state.gear === 'R' || state.speed < -0.25,
        indLeft: false,
        indRight: false,
        hazard: false,
        blinkOn: false,
        cabinLight: state.headlightsMode > 0 || state.driving,
      });
      return;
    }

    syncReverseAndBrakeLights();

    if (cngParts) {
      if (cngParts.frontSteer) cngParts.frontSteer.rotation.y = state.steerAngle;
      if (cngParts.handlebar) cngParts.handlebar.rotation.y = state.steerAngle * 0.95;
      if (cngParts.wheelFront) cngParts.wheelFront.rotation.x = state.wheelSpin;
      if (cngParts.wheelRearL) cngParts.wheelRearL.rotation.x = state.wheelSpin;
      if (cngParts.wheelRearR) cngParts.wheelRearR.rotation.x = state.wheelSpin;
      return;
    }

    if (corollaParts) {
      // Spin all 4 wheels + locked lug nuts & Toyota hub logos together
      if (corollaParts.wheelFL) corollaParts.wheelFL.rotation.x = -state.wheelSpin;
      if (corollaParts.wheelFR) corollaParts.wheelFR.rotation.x = -state.wheelSpin;
      if (corollaParts.wheelRL) corollaParts.wheelRL.rotation.x = -state.wheelSpin;
      if (corollaParts.wheelRR) corollaParts.wheelRR.rotation.x = -state.wheelSpin;
      // Steer front wheels & turn the real 3-spoke steering wheel in sync
      if (corollaParts.wheelFLSteer) corollaParts.wheelFLSteer.rotation.y = state.steerAngle;
      if (corollaParts.wheelFRSteer) corollaParts.wheelFRSteer.rotation.y = state.steerAngle;
      if (corollaParts.steeringWheel) corollaParts.steeringWheel.rotation.z = state.steerAngle * 5.2;
      // Sync workable bulbs (headlights, fog, taillights, brake, reverse, dome, dash)
      const engineOn = Boolean(state.driving || state.aiDriving);
      const hlOn = state.headlightsMode > 0;
      const hlHigh = state.headlightsMode === 2;
      const anyDoorOpen = Object.values(carDoors).some((d) => d.current > 0.06);
      for (const obj of corollaParts.headlights) obj.visible = hlOn;
      for (const obj of corollaParts.fogLights) obj.visible = hlHigh;
      for (const obj of corollaParts.taillights) obj.visible = engineOn || hlOn;
      for (const obj of corollaParts.brakeLights) obj.visible = Boolean(state.isBraking);
      for (const obj of corollaParts.reverseLights) obj.visible = engineOn && (state.gear === 'R' || state.speed < -0.25);
      for (const obj of corollaParts.indLeft) obj.visible = false;
      for (const obj of corollaParts.indRight) obj.visible = false;
      if (corollaParts.dashLight) corollaParts.dashLight.visible = engineOn || hlOn;
      if (corollaParts.domeLight) corollaParts.domeLight.visible = anyDoorOpen;
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
        // Keep motorcycle wheels seated cleanly at restY; bodyTiltGroup non-penetration lift handles road contact with zero tire clipping or mudguard collision!
        w.wheelRoot.position.y = w.restY;
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

    // 3b. Altapole Lane Head 6-Story Tower Empty Car Garage & [E] Main Car Gate + Opposite Goli Buildings
    const altGarageRes = envRef?.altapoleTower?.applyCarCollisions?.(p, state);
    if (altGarageRes?.hitWall) hitWall = true;
    const altGoliRes = envRef?.altapoleGoli?.applyCarCollisions?.(p, state);
    if (altGoliRes?.hitWall) hitWall = true;

    // 3c. Solid Landmark & City Building Collisions (slim two-wheeler radius on bikes/bicycles so fast riding never snags invisible car-wide walls!)
    const preX = p.x;
    const preZ = p.z;
    const landmarkColRad = (config.isBike || config.isBicycle) ? Math.max(state.halfWidth, 0.44) : Math.max(state.halfWidth, 0.95);
    envRef?.landmarks?.applyCollisions?.(p, landmarkColRad, Math.max(0, p.y), true);
    envRef?.city?.applyCityCollisions?.(p, landmarkColRad, Math.max(0, p.y));
    if (Math.abs(p.x - preX) > 0.005 || Math.abs(p.z - preZ) > 0.005) hitWall = true;

    // 3d. Solid Roadside Utility Poles — pole sways & recovers + slight vehicle damage (invisible 100% health system)
    const impactSpdForPole = Math.hypot(state.speed, state.lateralVel);
    const poleColRad = (config.isBike || config.isBicycle) ? Math.max(state.halfWidth, 0.40) : Math.max(state.halfWidth, 0.72);
    const poleHit = envRef?.city?.applyPoleCollisions?.(p, poleColRad, {
      impactSpeed: impactSpdForPole,
      isVehicle: true,
      dirX: Math.sin(state.heading) * Math.sign(state.speed || 1),
      dirZ: Math.cos(state.heading) * Math.sign(state.speed || 1),
    });
    if (poleHit?.hit) {
      hitWall = true;
      if (state.poleHitCooldown <= 0 && impactSpdForPole > 0.8) {
        const slightDamage = THREE.MathUtils.clamp(0.8 + impactSpdForPole * 0.16, 0.8, 4.0);
        state.health = Math.max(0, Number((state.health - slightDamage).toFixed(1)));
        state.poleHitCooldown = 0.45;
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

    // 5. Realistic car-to-car separation & momentum impulse transfer
    for (const other of allCars) {
      if (!other || other.state === state) continue;
      const dx = p.x - other.state.pos.x;
      const dz = p.z - other.state.pos.z;
      const minSepX = state.halfWidth + other.state.halfWidth + 0.12;
      const minSepZ = state.halfLength + other.state.halfLength + 0.15;
      const overlapX = minSepX - Math.abs(dx);
      const overlapZ = minSepZ - Math.abs(dz);
      if (overlapX > 0 && overlapZ > 0) {
        const myMass = config.isBike || config.isRickshaw ? 0.35 : (config.isCNG ? 0.65 : 1.15);
        const otherMass = other.state.isBike || other.state.isRickshaw ? 0.35 : (other.state.isCNG ? 0.65 : 1.15);
        const pushShare = otherMass / (myMass + otherMass);
        if (overlapX < overlapZ) {
          const dir = dx >= 0 ? 1 : -1;
          p.x += dir * overlapX * pushShare;
          other.state.pos.x -= dir * overlapX * (1 - pushShare);
        } else {
          const dir = dz >= 0 ? 1 : -1;
          p.z += dir * overlapZ * pushShare;
          other.state.pos.z -= dir * overlapZ * (1 - pushShare);
        }
        // Transfer longitudinal bump impulse to the struck vehicle & jolt its suspension
        if (Math.abs(state.speed) > 2.0) {
          const oFwdX = Math.sin(other.state.heading);
          const oFwdZ = Math.cos(other.state.heading);
          const myFwdX = Math.sin(state.heading);
          const myFwdZ = Math.cos(state.heading);
          const align = myFwdX * oFwdX + myFwdZ * oFwdZ;
          const impulse = THREE.MathUtils.clamp(state.speed * 0.38 * (myMass / otherMass), -8.5, 8.5);
          other.state.speed += impulse * align;
          if (!other.state.isRickshaw && !other.state.isBicycle) {
            other.state.suspHeaveVel -= Math.min(0.38, Math.abs(state.speed) * 0.025);
            other.state.dynPitchVel += Math.sign(impulse || 1) * Math.min(0.18, Math.abs(state.speed) * 0.014);
          }
        }
        hitWall = true;
      }
    }

    if (hitWall) {
      const impactSpeed = Math.hypot(state.speed, state.lateralVel);
      if (impactSpeed > 2.4 && state.crashCooldown <= 0) {
        const severity = THREE.MathUtils.clamp((impactSpeed - 2.0) / 18.0, 0.12, 1.0);
        state.lastImpactIntensity = Math.max(state.lastImpactIntensity, severity);
        state.crashCooldown = 0.26;
        if (!config.isRickshaw && !config.isBicycle) {
          state.frontSuspVel -= severity * 0.38;
          state.suspHeaveVel -= severity * 0.30;
          state.dynPitchVel += Math.sign(state.speed || 1) * severity * 0.24;
        }
        playCrashSound(severity);
      }
      if (config.isBike || config.isBicycle) {
        // Smooth glancing slide on two-wheelers instead of violent reverse-bouncing that glitches fast riding!
        state.speed *= 0.62;
        state.lateralVel *= 0.25;
      } else {
        state.speed = Math.abs(state.speed) > 5.0 ? -state.speed * 0.20 : state.speed * 0.50;
        state.lateralVel *= -0.32;
      }
    }
    return { onTowerRamp, inGarage: Boolean(altGarageRes?.inGarage || altGoliRes?.inGarage) };
  }

  const probeVec = new THREE.Vector3();
  function sampleWheelGroundY(wx, wz, refFootY, envRef, groundHeightFn) {
    let bestY = 0.0;
    if (envRef?.tower?.state?.gateOpen && wz >= 19.3 && wz <= 22.6 && wx < -2.6 && wx >= -9.2) {
      const rampT = THREE.MathUtils.clamp((-2.6 - wx) / 1.75, 0, 1);
      bestY = Math.max(bestY, rampT * 0.50);
    }
    probeVec.set(wx, refFootY + 1.68, wz);
    if (typeof groundHeightFn === 'function') {
      const gy = groundHeightFn(probeVec, true, 0);
      if (typeof gy === 'number' && Number.isFinite(gy) && gy <= refFootY + 0.72) {
        bestY = Math.max(bestY, gy);
      }
    } else {
      const ly = envRef?.landmarks?.getGroundHeight?.(probeVec) ?? 0;
      if (typeof ly === 'number' && Number.isFinite(ly) && ly <= refFootY + 0.72) {
        bestY = Math.max(bestY, ly);
      }
    }
    return bestY;
  }

  function update4WheelTerrainAndSuspension(dt, envRef, groundHeightFn, { accel = 0, turnRate = 0, brake = 0, handbrake = false, throttle = 0 } = {}) {
    const wb = Math.max(0.75, state.halfLength * 0.70);
    const tw = (config.isBike || config.isBicycle) ? 0.14 : Math.max(0.45, state.halfWidth * 0.82);
    const fx = Math.sin(state.heading);
    const fz = Math.cos(state.heading);
    const lx = Math.cos(state.heading);  // local +X (Left side of vehicle)
    const lz = -Math.sin(state.heading);
    const refY = Math.max(0, state.pos.y);

    const isTwoWheeler = Boolean(config.isBike || config.isBicycle);
    let hFront, hRear, hLeft, hRight, avgWheelY;
    const hC = sampleWheelGroundY(state.pos.x, state.pos.z, refY, envRef, groundHeightFn);
    if (isTwoWheeler) {
      // 3-point centerline ground sampling for motorcycles & bicycles (40% faster CPU + zero side-seam roll jitter!)
      hFront = sampleWheelGroundY(state.pos.x + fx * wb, state.pos.z + fz * wb, refY, envRef, groundHeightFn);
      hRear = sampleWheelGroundY(state.pos.x - fx * wb, state.pos.z - fz * wb, refY, envRef, groundHeightFn);
      hLeft = hC;
      hRight = hC;
      avgWheelY = (hFront + hRear) * 0.5;
    } else {
      const hFL = sampleWheelGroundY(state.pos.x + fx * wb + lx * tw, state.pos.z + fz * wb + lz * tw, refY, envRef, groundHeightFn);
      const hFR = sampleWheelGroundY(state.pos.x + fx * wb - lx * tw, state.pos.z + fz * wb - lz * tw, refY, envRef, groundHeightFn);
      const hRL = sampleWheelGroundY(state.pos.x - fx * wb + lx * tw, state.pos.z - fz * wb + lz * tw, refY, envRef, groundHeightFn);
      const hRR = sampleWheelGroundY(state.pos.x - fx * wb - lx * tw, state.pos.z - fz * wb - lz * tw, refY, envRef, groundHeightFn);
      hFront = (hFL + hFR) * 0.5;
      hRear = (hRL + hRR) * 0.5;
      hLeft = (hFL + hRL) * 0.5;
      hRight = (hFR + hRR) * 0.5;
      avgWheelY = (hFL + hFR + hRL + hRR) * 0.25;
    }
    const groundOffset = typeof config.groundOffset === 'number' ? Math.max(0.0075, config.groundOffset) : 0.0075;
    let targetGroundY = Math.max(hC, avgWheelY) + groundOffset;
    // Deadzone sub-1.2cm asphalt seam micro-steps while grounded so vehicle & rider never vertically vibrate on flat roads!
    if (state.grounded && Math.abs(state.velY) < 0.05 && Math.abs(targetGroundY - state.pos.y) < 0.012) {
      targetGroundY = state.pos.y;
    }

    // 1) Real Vertical Gravity, Climbing & Airborne Launch/Landing Physics
    const stepDelta = targetGroundY - state.lastGroundY;
    if (state.pos.y > targetGroundY + 0.045 || state.velY > 0.25) {
      state.grounded = false;
      state.velY -= 19.6 * dt;
      state.pos.y += state.velY * dt;
      if (state.pos.y <= targetGroundY) {
        const impactSpeed = -state.velY;
        state.pos.y = targetGroundY;
        state.velY = 0;
        state.grounded = true;
        if (impactSpeed > 0.8) {
          state.suspHeaveVel -= Math.min(0.65, impactSpeed * 0.11);
          state.dynPitchVel += Math.min(0.26, impactSpeed * 0.035);
        }
      }
    } else {
      const launchStepThresh = isTwoWheeler ? 0.34 : 0.08;
      if (stepDelta > launchStepThresh && Math.abs(state.speed) > 10.5) {
        state.velY = Math.min(3.8, (stepDelta / Math.max(dt, 0.016)) * 0.14);
      }
      const climbAlpha = Math.min(1, dt * (targetGroundY > state.pos.y ? 20.0 : 14.0));
      state.pos.y = THREE.MathUtils.lerp(state.pos.y, targetGroundY, climbAlpha);
      if (Math.abs(state.pos.y - targetGroundY) < 0.004) state.pos.y = targetGroundY;
      state.velY = 0;
      state.grounded = true;

      if (stepDelta > 0.035 && Math.abs(state.speed) > 0.6) {
        state.suspHeaveVel -= Math.min(0.45, stepDelta * 1.4);
        state.dynPitchVel -= Math.min(0.22, stepDelta * 0.65);
      }
    }
    state.lastGroundY = targetGroundY;

    // Unconditionally stable critically-damped analytical spring (zero jitter/glitching at ANY FPS!)
    const dampSpring = (cur, tgt, vel, smoothTime, lim) => {
      const omega = 2.0 / Math.max(0.02, smoothTime);
      const x = omega * dt;
      const exp = 1.0 / (1.0 + x + 0.48 * x * x + 0.235 * x * x * x);
      const diff = cur - tgt;
      const tmp = (vel + omega * diff) * dt;
      const nextVel = (vel - omega * tmp) * exp;
      let nextVal = tgt + (diff + tmp) * exp;
      if (Math.abs(nextVal) > lim) {
        nextVal = Math.sign(nextVal) * lim;
        return { val: nextVal, vel: 0 };
      }
      return { val: nextVal, vel: nextVel };
    };

    // 2) Real 4-Wheel Terrain Pitch & Roll (deadzoned on flat roads to eliminate micro-jitter)
    const dPitchH = Math.abs(hFront - hRear) < 0.015 ? 0 : (hFront - hRear);
    const dRollH = Math.abs(hLeft - hRight) < 0.015 ? 0 : (hLeft - hRight);
    const rawTerrainPitch = state.grounded
      ? THREE.MathUtils.clamp(-Math.atan2(dPitchH, wb * 2.0), -0.48, 0.48)
      : THREE.MathUtils.clamp(-state.velY * 0.032, -0.36, 0.36);
    const rawTerrainRoll = (state.grounded && !config.isBicycle && !config.isBike)
      ? THREE.MathUtils.clamp(Math.atan2(dRollH, Math.max(0.65, tw * 2.0)), -0.24, 0.24)
      : 0;
    const alignRate = state.grounded ? 10.0 : 5.0;
    state.terrainPitch = THREE.MathUtils.lerp(state.terrainPitch, rawTerrainPitch, Math.min(1, dt * alignRate));
    state.terrainRoll = THREE.MathUtils.lerp(state.terrainRoll, rawTerrainRoll, Math.min(1, dt * alignRate));

    // Bicycles & rickshaws: planted rigid wheels + silky-smooth light weight-transfer pitch & natural corner lean
    if (config.isRickshaw || config.isBicycle) {
      state.suspHeave = 0;
      state.suspHeaveVel = 0;
      state.frontSuspOffset = 0;
      state.frontSuspVel = 0;
      state.rearSuspOffset = 0;
      state.rearSuspVel = 0;
      const speedMag = Math.abs(state.speed);
      const targetCyclePitch = THREE.MathUtils.clamp(
        ((brake > 0 || handbrake) && state.speed > 0.5 ? 0.010 : (throttle > 0 ? -0.008 : 0)),
        -0.012,
        0.012,
      );
      const cp = dampSpring(state.dynPitch, targetCyclePitch, state.dynPitchVel, 0.22, 0.014);
      state.dynPitch = cp.val;
      state.dynPitchVel = cp.vel;
      const targetDynRoll = config.isBicycle
        ? THREE.MathUtils.clamp(-turnRate * Math.min(speedMag, 14) * 0.018, -0.22, 0.22)
        : 0;
      state.dynRoll = THREE.MathUtils.lerp(state.dynRoll, targetDynRoll, Math.min(1, dt * 9.0));
      state.dynRollVel = 0;
      state.pitch = state.terrainPitch + state.dynPitch;
      state.roll = state.terrainRoll + state.dynRoll;
      return;
    }

    // Vehicle-class critically-damped suspension profile (zero bounce-glitching at any framerate)
    const isHeavyTall = /alphard|fortuner|hiace|townace/i.test(config.id || '');
    const heaveTime = config.isCNG ? 0.14 : (config.isBMW ? 0.15 : (isHeavyTall ? 0.22 : (config.isBike ? 0.16 : 0.18)));
    const pitchTime = config.isCNG ? 0.14 : (config.isBMW ? 0.16 : (isHeavyTall ? 0.23 : (config.isBike ? 0.17 : 0.19)));
    const rollTime = config.isCNG ? 0.14 : (config.isBMW ? 0.16 : (isHeavyTall ? 0.22 : (config.isBike ? 0.18 : 0.19)));
    const cngScale = config.isCNG ? 0.35 : 1.0;

    // 3) Chassis Vertical Suspension (ZERO high-frequency road-sine shaking on motorcycles so rider & bike stay 100% rock-steady at 120 km/h!)
    const speedMag = Math.abs(state.speed);
    const speedRatio = Math.min(1, speedMag / 16.0);
    if (config.isBike) {
      state.suspHeave = 0;
      state.suspHeaveVel = 0;
    } else {
      const heaveRoadBump = state.grounded && speedMag > 1.2
        ? (Math.sin(state.roadTravelDist * 2.05) * 0.0038 + Math.sin(state.roadTravelDist * 4.9) * 0.0018) * speedRatio * cngScale
        : 0;
      const maxHeave = config.isCNG ? 0.014 : 0.042;
      const hv = dampSpring(state.suspHeave, heaveRoadBump, state.suspHeaveVel, heaveTime, maxHeave);
      state.suspHeave = hv.val;
      state.suspHeaveVel = hv.vel;
    }

    // 4) Smooth Critically-Damped Weight-Transfer Pitch on Speed-Up/Braking & Body Roll / Bike Lean
    const pitchRoadBump = (!config.isBike && state.grounded && speedMag > 1.2)
      ? (Math.sin(state.roadTravelDist * 2.15) * 0.0020 + Math.sin(state.roadTravelDist * 5.4) * 0.0010) * speedRatio * cngScale
      : 0;
    const diveScale = config.isCNG ? 0.50 : (config.isBMW ? 0.70 : (isHeavyTall ? 1.05 : 0.85));
    const brakeDive = (brake > 0 || handbrake) && state.speed > 0.6 ? (config.isBike ? 0.018 : 0.015 * diveScale) : 0;
    const accelLift = throttle > 0 ? (config.isBike ? -0.015 : -0.011 * diveScale) : 0;
    const maxPitchLim = config.isCNG ? 0.024 : (config.isBike ? 0.030 : 0.036);
    const targetDynPitch = THREE.MathUtils.clamp(
      -accel * (config.isCNG ? 0.00045 : (config.isBike ? 0.00055 : 0.00075 * diveScale)) + brakeDive + accelLift + pitchRoadBump,
      -maxPitchLim,
      maxPitchLim,
    );
    const pt = dampSpring(state.dynPitch, targetDynPitch, state.dynPitchVel, pitchTime, maxPitchLim);
    state.dynPitch = pt.val;
    state.dynPitchVel = pt.vel;

    // Speed-breaker suspension impulse near Hadis Park, Boro Maath & Judge Court speed humps
    if (speedMag > 2.0 && !config.isRickshaw) {
      const nearHump =
        (Math.abs(state.pos.x - -295.0) < 3.6 && Math.abs(state.pos.z - -831.0) < 0.65)
        || (Math.abs(state.pos.x - 40.0) < 3.6 && Math.abs(state.pos.z - -522.0) < 0.65)
        || (Math.abs(state.pos.x - 143.0) < 3.6 && Math.abs(state.pos.z - -684.0) < 0.75);
      if (nearHump) {
        const humpScale = config.isCNG ? 0.30 : 0.48;
        state.suspHeaveVel += Math.min(0.55, speedMag * 0.032) * dt * 14.0 * humpScale;
        state.dynPitchVel -= Math.min(0.55, speedMag * 0.035) * dt * 12.0 * humpScale;
        if (config.isBike) state.frontSuspVel -= Math.min(0.45, speedMag * 0.032) * dt * 14.0;
      }
    }

    // Real-world centrifugal body roll:
    // - Motorcycles (isBike) lean INTO the turn (right turn -> lean right, left turn -> lean left).
    // - All cars/SUVs/vans/trucks/CNG roll OUTWARD from centrifugal force (right turn -> roll left, left turn -> roll right).
    const rollGain = config.isCNG ? 0.0022 : (config.isBMW ? 0.0030 : (isHeavyTall ? 0.0052 : 0.0040));
    const maxRollLim = config.isBike ? 0.42 : (config.isCNG ? 0.038 : (isHeavyTall ? 0.085 : 0.068));
    const targetDynRoll = config.isBike
      ? THREE.MathUtils.clamp(-turnRate * Math.min(speedMag, 26) * (config.bikeSportLean ? 0.022 : 0.019), -0.42, 0.42)
      : THREE.MathUtils.clamp(turnRate * state.speed * rollGain, -maxRollLim, maxRollLim);
    if (config.isBike) {
      // Smooth critically-damped lean INTO turns with ZERO overshoot wobble (rock-steady rider!)
      const targetBikeRoll = THREE.MathUtils.clamp(-turnRate * Math.min(speedMag, 24) * (config.bikeSportLean ? 0.019 : 0.017), -0.32, 0.32);
      state.dynRoll = THREE.MathUtils.lerp(state.dynRoll, targetBikeRoll, Math.min(1, dt * 8.0));
      state.dynRollVel = 0;
    } else {
      const rl = dampSpring(state.dynRoll, targetDynRoll, state.dynRollVel || 0, rollTime, maxRollLim);
      state.dynRoll = rl.val;
      state.dynRollVel = rl.vel;
    }

    // Combine Terrain Slope Orientation + Dynamic Suspension Tilt
    const suspPitch = config.isBike ? THREE.MathUtils.clamp((state.rearSuspOffset - state.frontSuspOffset) * 0.34, -0.018, 0.016) : 0;
    state.pitch = state.terrainPitch + state.dynPitch + suspPitch;
    state.roll = state.terrainRoll + state.dynRoll;
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

  function syncPooledHeadlights() {
    if (!headlightBeams.length) return;
    const activeOn = Boolean(state.driving && state.headlightsMode > 0);
    const slot = sharedHeadlightPool.spots[0];
    if (activeOn) {
      sharedHeadlightPool.ownerId = state.id;
      root.updateMatrixWorld(true);
      const b0 = headlightBeams[0];
      const b1 = headlightBeams[1];
      if (b0 && b0.intensity > 0) {
        b0.src.getWorldPosition(sharedHeadlightPool.tmpPos);
        b0.tgt.getWorldPosition(sharedHeadlightPool.tmpTgt);
        if (b1 && b1.intensity > 0) {
          b1.src.getWorldPosition(sharedHeadlightPool.tmpPosB);
          b1.tgt.getWorldPosition(sharedHeadlightPool.tmpTgtB);
          sharedHeadlightPool.tmpPos.lerp(sharedHeadlightPool.tmpPosB, 0.5);
          sharedHeadlightPool.tmpTgt.lerp(sharedHeadlightPool.tmpTgtB, 0.5);
          slot.spot.intensity = b0.intensity * 1.45;
          slot.spot.angle = Math.min(Math.PI * 0.36, b0.angle * 1.18);
        } else {
          slot.spot.intensity = b0.intensity;
          slot.spot.angle = b0.angle;
        }
        slot.spot.position.copy(sharedHeadlightPool.tmpPos);
        slot.tgt.position.copy(sharedHeadlightPool.tmpTgt);
        slot.tgt.updateMatrixWorld();
        slot.spot.distance = b0.distance;
      } else {
        slot.spot.intensity = 0;
      }
    } else if (sharedHeadlightPool.ownerId === state.id) {
      sharedHeadlightPool.ownerId = null;
      slot.spot.intensity = 0;
    }
  }

  function toggleHeadlights() {
    if (config.isRickshaw) return 0;
    state.headlightsMode = (state.headlightsMode + 1) % 3; // 0=OFF -> 1=LOW -> 2=HIGH
    const isOn = state.headlightsMode > 0;
    const isHigh = state.headlightsMode === 2;
    for (const b of headlightBeams) {
      if (config.isBike) {
        b.intensity = isHigh ? 34.0 : (isOn ? 18.0 : 0);
        b.distance = isHigh ? 95 : 58;
        b.angle = isHigh ? Math.PI * 0.28 : Math.PI * 0.22;
        b.tgt.position.set(0, isHigh ? -0.35 : -0.82, isHigh ? 28 : 18);
      } else if (config.isGameReadyCorolla) {
        b.intensity = isHigh ? 13.5 : (isOn ? 7.0 : 0);
        b.distance = isHigh ? 82 : 48;
        b.angle = isHigh ? Math.PI * 0.30 : Math.PI * 0.23;
        b.tgt.position.set(b.ox * 0.85, isHigh ? 0.55 : 0.12, b.hlZ + (isHigh ? 28 : 16));
      } else {
        b.intensity = isHigh ? 24.0 : (isOn ? 11.5 : 0);
        b.distance = isHigh ? 82 : 48;
        b.angle = isHigh ? Math.PI * 0.30 : Math.PI * 0.23;
        b.tgt.position.set(b.ox * 0.85, isHigh ? 0.55 : 0.12, b.hlZ + (isHigh ? 28 : 16));
      }
    }
    if (bikeHeadlightUnit) {
      bikeHeadlightUnit.bulbMat.emissiveIntensity = isHigh ? 16.0 : (isOn ? 8.5 : 0.0);
      bikeHeadlightUnit.haloMat.opacity = isHigh ? 0.52 : (isOn ? 0.28 : 0.0);
    }
    if (config.isGameReadyCorolla) {
      for (const m of drlMats) m.emissiveIntensity = isHigh ? 2.4 : (isOn ? 1.55 : 0.0);
      for (const m of tailMats) m.emissiveIntensity = isOn ? 2.0 : 1.3;
    } else {
      for (const m of drlMats) m.emissiveIntensity = isHigh ? 9.5 : (isOn ? 6.0 : 2.0);
      for (const m of tailMats) m.emissiveIntensity = isOn ? 4.2 : 1.8;
    }
    syncTransform();
    return state.headlightsMode;
  }

  function syncReverseAndBrakeLights() {
    if (reverseMats.length) {
      const revOn = Boolean(state.driving || state.aiDriving) && (state.gear === 'R' || state.speed < -0.25);
      for (const m of reverseMats) m.emissiveIntensity = revOn ? 4.8 : 0.0;
    }
    if (bikeTaillightUnit) {
      // Backlight ONLY lights up when Headlight [L] is ON or while actively Braking (NEVER always-on, NEVER glows number plate!)
      const tailOn = Boolean(state.headlightsMode > 0);
      const brakeNow = Boolean(state.driving && state.isBraking && state.speed > 0.25);
      bikeTaillightUnit.bulbMat.emissiveIntensity = brakeNow ? 15.0 : (tailOn ? 5.2 : 0.0);
      bikeTaillightUnit.glassMat.emissiveIntensity = brakeNow ? 1.8 : (tailOn ? 0.55 : 0.0);
      bikeTaillightUnit.haloMat.opacity = brakeNow ? 0.56 : (tailOn ? 0.20 : 0.0);
      if (bikeTaillightUnit.glowLight) {
        bikeTaillightUnit.glowLight.intensity = currentQuality === 'low' ? 0 : (brakeNow ? 1.15 : 0.0);
      }
    }
    if (tailMats.length && !config.isGameReadyCorolla) {
      const baseTail = state.headlightsMode > 0 ? 4.2 : (state.driving ? 2.1 : 1.6);
      const targetTail = state.isBraking ? Math.max(baseTail + 3.2, 6.2) : baseTail;
      for (const m of tailMats) m.emissiveIntensity = targetTail;
    }
  }

  let aiControlInput = null;

  function enterAICar() {
    if (state.driving || config.isRickshaw || config.isBike) return false;
    state.aiDriving = true;
    aiControlInput = { throttle: 0, brake: 0, steerInput: 0, handbrake: false };
    if (!config.isGameReadyCorolla) {
      for (const m of drlMats) m.emissiveIntensity = 3.8;
    }
    return true;
  }

  function exitAICar() {
    state.aiDriving = false;
    aiControlInput = null;
    state.isBraking = false;
    if (!config.isGameReadyCorolla) {
      for (const m of drlMats) m.emissiveIntensity = 1.8;
      for (const m of tailMats) m.emissiveIntensity = 1.6;
    }
    syncTransform();
  }

  function setAIControl(input) {
    if (!state.aiDriving) return;
    aiControlInput = input || { throttle: 0, brake: 0, steerInput: 0, handbrake: false };
  }

  function enterCar(seatMode = 'driver', passengerSeatIdx = null) {
    state.aiDriving = false;
    aiControlInput = null;
    state.driving = true;
    state.cameraMode = 'chase';
    state.rideSeat = (config.isRickshaw && seatMode === 'passenger') ? 'passenger' : 'driver';
    if (state.hasKickstand) {
      state.kickstandDeploy = (config.isBicycle && state.rideSeat === 'passenger') ? 1.0 : 0.0;
    }
    if (config.isVan && typeof passengerSeatIdx === 'number' && Number.isFinite(passengerSeatIdx)) {
      state.passengerSeatIndex = ((passengerSeatIdx % 4) + 4) % 4;
    }
    ensureAudio();
    if (!config.isGameReadyCorolla) {
      for (const m of drlMats) m.emissiveIntensity = 4.5;
    }
    if (exhaustTipLocal && state.loaded) {
      spawnExhaustSmokePuff(0.4, 0);
      exhaustSmokeCooldown = 0.08;
    }
    syncInteriorVisibility();
    syncTransform();
  }

  function setPassengerSeatIndex(idx) {
    if (!config.isVan) return 0;
    state.passengerSeatIndex = ((idx % 4) + 4) % 4;
    return state.passengerSeatIndex;
  }

  function cyclePassengerSeat() {
    if (!config.isVan) return 0;
    state.passengerSeatIndex = (state.passengerSeatIndex + 1) % 4;
    return state.passengerSeatIndex;
  }

  function toggleRideSeat() {
    if (!config.isRickshaw || !state.driving) return state.rideSeat;
    state.rideSeat = state.rideSeat === 'passenger' ? 'driver' : 'passenger';
    if (config.isBicycle) {
      state.kickstandDeploy = state.rideSeat === 'passenger' ? 1.0 : 0.0;
      syncTransform();
    }
    return state.rideSeat;
  }

  function exitCar(playerPos) {
    const wasVanPass = Boolean(config.isVan && state.rideSeat === 'passenger');
    const vanPose = wasVanPass ? getVanSeatPose(state.passengerSeatIndex) : null;
    state.driving = false;
    state.isBraking = false;
    state.rideSeat = 'driver';
    syncInteriorVisibility();
    updateEngineAudio(false, 920, 0);
    if (!config.isGameReadyCorolla) {
      for (const m of drlMats) m.emissiveIntensity = 1.8;
      for (const m of tailMats) m.emissiveIntensity = 1.6;
    }
    syncTransform();

    if (vanPose?.dismountPos) {
      playerPos.set(vanPose.dismountPos.x, state.pos.y + 1.68, vanPose.dismountPos.z);
      return;
    }
    const rightVec = new THREE.Vector3(Math.cos(state.heading), 0, -Math.sin(state.heading));
    const exitDist = config.isBicycle ? 0.95 : (config.isRickshaw ? 1.15 : 1.60);
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
      if (config.isVan) {
        const cornerName = VAN_CORNER_SEAT_SPECS[state.passengerSeatIndex % 4]?.label || 'Corner';
        return state.rideSeat === 'passenger'
          ? `[1-4] Switch 4 Corner Seats (${state.passengerSeatIndex + 1}/4 ${cornerName}) · [F] Drive Van · [G] Get Off`
          : `[F] Dismount ${state.name} · [G] Sit in Back (4 Corner Seats) · [H] Bell`;
      }
      if (config.isBicycle) {
        return state.rideSeat === 'passenger'
          ? '[G] Get Off Back Seat · [F] Switch to Rider Seat'
          : `[F] Dismount ${state.name} · [G] Sit on Back Seat · [H] Bell`;
      }
      if (config.isRickshaw) {
        return state.rideSeat === 'passenger'
          ? '[G] Exit Rickshaw · [F] Switch to Driver Seat'
          : '[F] Exit Rickshaw · [G] Sit in Passenger Seat';
      }
      if (config.isBike) {
        return `[F] Dismount ${state.name} · [L] Headlight · [V] POV Cam`;
      }
      return `[F] Exit ${state.name} · [E] Open Gate`;
    }
    if (isPlayerNear(playerPos)) {
      if (config.isVan) {
        return `[F] Drive ${state.name} · [G] Sit in Back (4 Corners)`;
      }
      if (config.isBicycle) {
        return `[F] Ride ${state.name} · [G] Sit on Back Seat`;
      }
      if (config.isRickshaw) {
        return '[F] Drive Rickshaw · [G] Sit in Passenger Seat';
      }
      if (config.isBike) {
        return `[F] Ride ${state.name}`;
      }
      if (state.aiDriving) {
        return `[F] Take Over & Drive ${state.name}`;
      }
      return `[F] Enter & Drive ${state.name}`;
    }
    return null;
  }

  const fwd = new THREE.Vector3();
  const rgt = new THREE.Vector3();

  function update(delta, keys, houseRef, envRef, allCars = [], groundHeightFn = null) {
    const dt = Math.min(delta, 0.05);
    const isPassengerSitting = config.isRickshaw && state.rideSeat === 'passenger';
    const isAIDriven = Boolean(state.aiDriving && !state.driving);
    // Ultra-fast skip for distant/hidden parked vehicles with zero motion or particles (saves per-frame CPU across 16 parked vehicles!)
    if (!state.driving && !isAIDriven && !isPassengerSitting && !root.visible && tireSmokePuffs.length === 0 && exhaustSmokePuffs.length === 0 && Math.abs(state.speed) < 0.05) {
      return;
    }
    if (tireSmokePuffs.length > 0) updateTireSmoke(dt);
    if (exhaustSmokePuffs.length > 0) updateExhaustSmoke(dt);

    // Smoothly animate all 4 doors whether parked or driving
    let doorMoved = false;
    for (const d of Object.values(carDoors)) {
      if (d.key === 'FL' && driverDoorOverride !== null) continue;
      const prev = d.current;
      d.current = THREE.MathUtils.lerp(d.current, d.target, Math.min(1, dt * 8.5));
      if (Math.abs(d.current - d.target) < 0.002) d.current = d.target;
      if (Math.abs(d.current - prev) > 0.0005) doorMoved = true;
    }

    if ((!state.driving && !isAIDriven) || isPassengerSitting) {
      let moved = false;
      if (Math.abs(state.speed) > 0.05) {
        state.speed *= Math.max(0, 1 - dt * 4.2);
        fwd.set(Math.sin(state.heading), 0, Math.cos(state.heading));
        state.pos.addScaledVector(fwd, state.speed * dt);
        state.wheelSpin += (state.speed / measuredWheelRadius) * dt;
        applyCarCollisions(houseRef, envRef, allCars);
        update4WheelTerrainAndSuspension(dt, envRef, groundHeightFn, {});
        moved = true;
      } else if (state.speed !== 0) {
        state.speed = 0;
        moved = true;
      }
      if (!state.grounded || Math.abs(state.suspHeave) > 0.001 || Math.abs(state.dynPitch) > 0.001 || Math.abs(state.dynRoll) > 0.001 || Math.abs(state.frontSuspOffset) > 0.0005 || Math.abs(state.rearSuspOffset) > 0.0005 || Math.abs(state.riderSag || 0) > 0.0005) {
        update4WheelTerrainAndSuspension(dt, envRef, groundHeightFn, {});
        state.frontSuspOffset = THREE.MathUtils.lerp(state.frontSuspOffset, 0, Math.min(1, dt * 10));
        state.rearSuspOffset = THREE.MathUtils.lerp(state.rearSuspOffset, 0, Math.min(1, dt * 12));
        state.riderSag = THREE.MathUtils.lerp(state.riderSag || 0, 0, Math.min(1, dt * 8));
        if (Math.abs(state.riderSag) < 0.0004) state.riderSag = 0;
        state.frontSuspVel = 0;
        state.rearSuspVel = 0;
        moved = true;
      }
      updateEngineAudio(false, 920, 0);
      if (moved || doorMoved || isPassengerSitting) syncTransform();
      return;
    }

    // Never allow kickstand to remain down while actively riding a bicycle or motorcycle!
    if (state.driving && state.hasKickstand && !isPassengerSitting && state.kickstandDeploy > 0.001) {
      state.kickstandDeploy = Math.max(0, state.kickstandDeploy - dt * 8.0);
    }

    const throttle = isAIDriven
      ? (aiControlInput?.throttle || 0)
      : ((keys.has('KeyW') || keys.has('ArrowUp')) ? 1 : 0);
    const brake = isAIDriven
      ? (aiControlInput?.brake || 0)
      : ((keys.has('KeyS') || keys.has('ArrowDown')) ? 1 : 0);
    const steerInput = isAIDriven
      ? (aiControlInput?.steerInput || 0)
      : ((keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0)
        - (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0));
    const handbrake = isAIDriven ? Boolean(aiControlInput?.handbrake) : keys.has('Space');
    const shiftPressed = isAIDriven ? Boolean(aiControlInput?.shift) : (keys.has('ShiftLeft') || keys.has('ShiftRight'));
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
    // Realistic progressive torque curve + proportional aerodynamic drag so EVERY vehicle smoothly climbs through ALL gears to its true top speed!
    const speedFrac = THREE.MathUtils.clamp(Math.abs(state.speed) / Math.max(1, maxForwardSpeed), 0, 1);
    const torqueCurve = config.isRickshaw ? 1.0 : (1.18 - 0.28 * speedFrac * speedFrac);
    state.shiftDipTimer = Math.max(0, (state.shiftDipTimer || 0) - dt);
    const shiftMult = state.shiftDipTimer > 0 ? 0.86 : 1.0;
    const baseEngineF = (config.engineForce || 14.5) * (boost > 1 ? 1.18 : 1.0);
    const engineForce = baseEngineF * torqueCurve * shiftMult;
    const brakeForce = config.isBike ? 26.5 : (config.isTata2515 ? 20.5 : 25.5);
    // Realistic tire-asphalt rolling resistance + Coulomb low-speed stiction + lateral tire-scrub friction + aero drag
    const rollingCoeff = config.isBicycle ? 0.26 : (config.isRickshaw ? 0.34 : (config.isTata2515 ? 0.36 : 0.30));
    const rollingDrag = rollingCoeff * state.speed;
    const coulombStiction = (!throttle && state.grounded && Math.abs(state.speed) > 0.02 && Math.abs(state.speed) < 2.2)
      ? (0.55 * Math.sign(state.speed))
      : 0;
    const lateralScrubDrag = (state.grounded && Math.abs(state.lateralVel) > 0.35 && Math.abs(state.speed) > 0.5)
      ? (Math.min(4.8, Math.abs(state.lateralVel) * (handbrake ? 0.58 : 0.28)) * Math.sign(state.speed))
      : 0;
    const aeroDrag = (baseEngineF * 0.86) * Math.pow(speedFrac, 1.9) * Math.sign(state.speed);
    const drag = throttle > 0
      ? (aeroDrag + lateralScrubDrag)
      : (rollingDrag + coulombStiction + lateralScrubDrag + aeroDrag * 0.35);

    let accel = 0;
    if (throttle > 0) accel += engineForce;
    if (brake > 0) {
      if (state.speed > 0.6) accel -= brakeForce;
      else accel -= (config.isBike ? 4.4 : (config.isBicycle ? 3.2 : 9.5));
    }
    if (handbrake && Math.abs(state.speed) > 0.25) {
      accel -= Math.sign(state.speed) * (Math.abs(state.speed) > 2.0 ? 16.5 : 11.0);
    }

    // Realistic hill/stair slope gravity component (nose up = uphill load, nose down = downhill push)
    const slopeGravity = state.grounded ? Math.sin(state.terrainPitch) * 8.8 : 0;
    const prevSpeedSign = Math.sign(state.speed);
    state.speed += (accel + slopeGravity - drag) * dt;
    // Prevent Coulomb/handbrake friction from overshooting past zero into reverse jitter
    if (!throttle && !brake && prevSpeedSign !== 0 && Math.sign(state.speed) !== prevSpeedSign && Math.abs(state.terrainPitch) < 0.04) {
      state.speed = 0;
    }
    // Realistic foot-push reverse speed cap on Motorcycles (-2.35 m/s) & Bicycles (-1.75 m/s) for GTA V reverse duck-walk!
    const maxReverseSpeed = config.isBike ? -2.35 : (config.isBicycle ? -1.75 : -11.5);
    state.speed = THREE.MathUtils.clamp(state.speed, maxReverseSpeed, maxForwardSpeed);
    if (!throttle && !brake && Math.abs(state.speed) < 0.10 && Math.abs(state.terrainPitch) < 0.04) {
      state.speed = 0;
    }
    state.isReversing = Boolean(state.driving && (state.speed < -0.06 || (brake > 0 && state.speed <= 0.15)));

    if (state.crashCooldown > 0) state.crashCooldown = Math.max(0, state.crashCooldown - dt);
    if (state.poleHitCooldown > 0) state.poleHitCooldown = Math.max(0, state.poleHitCooldown - dt);
    if (state.lastImpactIntensity > 0) state.lastImpactIntensity = Math.max(0, state.lastImpactIntensity - dt * 3.4);

    // GTA VI Speed-Sensitive Progressive Steering + Self-Centering Return Torque
    const absSpd = Math.abs(state.speed);
    const maxSteer = THREE.MathUtils.lerp(0.56, 0.19, Math.min(1, absSpd / 32));
    const steerResp = steerInput !== 0 ? (config.isBMW ? 11.5 : 8.8) : (6.5 + Math.min(8.0, absSpd * 0.45));
    state.steerAngle = THREE.MathUtils.lerp(state.steerAngle, steerInput * maxSteer, Math.min(1, dt * steerResp));

    // Progressive Pacejka-Style Tire Grip, Weight-Transfer Bite & BMW Power-Oversteer Drift
    const isDrifting = handbrake && absSpd > 4.8;
    const powerSlide = config.isBMW && throttle > 0 && boost > 1.0 && Math.abs(state.steerAngle) > 0.18 && absSpd > 8.0;
    const baseGrip = config.isBMW ? 9.6 : (config.isBike ? 10.4 : (config.isCNG ? 7.0 : 8.0));
    const brakeWeightBite = (brake > 0 && absSpd > 3.0) ? 1.14 : 1.0;
    const grip = isDrifting ? 2.15 : (powerSlide ? 4.2 : baseGrip * brakeWeightBite);

    const turnRate = state.steerAngle
      * (state.speed / (config.isBike ? 2.35 : 2.60))
      * (isDrifting ? 1.48 : (powerSlide ? 1.18 : 1.0))
      * (1.0 / (1.0 + absSpd * 0.024));

    state.heading += turnRate * dt;

    const slipFactor = isDrifting ? 0.42 : (powerSlide ? 0.24 : (absSpd > 14 ? 0.13 : 0.08));
    const centrifugal = absSpd > 0.35 ? (turnRate * state.speed * slipFactor) : 0;
    state.lateralVel = THREE.MathUtils.lerp(state.lateralVel, centrifugal, Math.min(1, dt * (absSpd <= 0.35 ? 16.0 : grip)));
    if (absSpd <= 0.20 && Math.abs(state.lateralVel) < 0.03) state.lateralVel = 0;
    state.slipIntensity = THREE.MathUtils.clamp((Math.abs(state.lateralVel) - 0.80) / 5.2 + (isDrifting ? 0.45 : 0), 0, 1);

    fwd.set(Math.sin(state.heading), 0, Math.cos(state.heading));
    rgt.set(Math.cos(state.heading), 0, -Math.sin(state.heading));

    // Substep high-speed motorcycle movement so fast riding NEVER tunnels into curbs/poles or glitches!
    const moveSteps = (config.isBike && Math.abs(state.speed) * dt > 0.45) ? 2 : 1;
    const stepDt = dt / moveSteps;
    for (let ms = 0; ms < moveSteps; ms++) {
      state.pos.addScaledVector(fwd, state.speed * stepDt);
      state.pos.addScaledVector(rgt, state.lateralVel * stepDt);
      applyCarCollisions(houseRef, envRef, allCars);
    }
    state.roadTravelDist += Math.abs(state.speed) * dt;

    const wheelRadius = measuredWheelRadius;
    state.wheelSpin += (state.speed / wheelRadius) * dt;

    // Tire-to-road friction smoke for 4-wheelers & CNGs (NO braking tire smoke on motorcycles!)
    if (!config.isRickshaw && !config.isBike) {
      smokeCooldown = Math.max(0, smokeCooldown - dt);
      const hardLaunch = throttle > 0 && (boost > 1.0 || (config.isCNG && Math.abs(state.speed) > 0.6 && Math.abs(state.speed) < 4.5)) && Math.abs(state.speed) < 6.5;
      const hardBrake = (brake > 0 || handbrake) && Math.abs(state.speed) > (config.isCNG ? 3.8 : 6.5);
      const cornerFriction = (config.isCNG && Math.abs(state.speed) > 5.0 && Math.abs(state.steerAngle) > 0.28) || (state.slipIntensity > 0.35 && Math.abs(state.speed) > 7.5);
      if ((isDrifting || hardLaunch || hardBrake || cornerFriction) && smokeCooldown <= 0) {
        smokeCooldown = isDrifting ? 0.045 : (config.isCNG ? 0.075 : 0.085);
        const rearDist = config.isCNG ? 0.82 : state.halfLength * 0.62;
        const trackHalf = config.isCNG ? 0.54 : state.halfWidth * 0.78;
        for (const side of [-1, 1]) {
          spawnTireFrictionPuff(
            state.pos.x - fwd.x * rearDist + rgt.x * trackHalf * side,
            state.pos.y,
            state.pos.z - fwd.z * rearDist + rgt.z * trackHalf * side,
          );
        }
      }
    }
    if (exhaustTipLocal && state.loaded) {
      exhaustSmokeCooldown -= dt;
      if (exhaustSmokeCooldown <= 0) {
        const speedAbs = Math.abs(state.speed);
        const isRevving = throttle > 0 || speedAbs > 1.2;
        if (config.isBike) {
          exhaustSmokeCooldown = isRevving
            ? (0.060 + Math.random() * 0.028)
            : (0.145 + Math.random() * 0.065);
        } else {
          exhaustSmokeCooldown = isRevving
            ? (0.085 + Math.random() * 0.035)
            : (0.145 + Math.random() * 0.065);
        }
        spawnExhaustSmokePuff(throttle, speedAbs);
      }
    }
    if (config.isRickshaw) {
      const gearRatio = config.isBicycle ? 0.50 : (config.isVan ? 0.62 : 0.72);
      // Turn crank only when pedaling (throttle > 0); when pedals are released while rolling forward, freewheel hub coasts!
      const pedalRate = throttle > 0
        ? Math.max(throttle * 3.8, (state.speed / wheelRadius) * gearRatio)
        : (state.speed < -0.15 ? (state.speed / wheelRadius) * 0.5 : 0);
      state.pedalPhase += pedalRate * dt;
    }
    if (config.isBike) {
      // Silky-smooth Motorcycle Front Fork + Rear Monoshock Suspension + gentle Rider Weight Sag (ZERO high-frequency road-sine shaking!)
      const targetRiderSag = state.driving ? -0.011 : 0.0;
      state.riderSag = THREE.MathUtils.lerp(state.riderSag || 0, targetRiderSag, Math.min(1, dt * 6.5));

      const frontBrakeDive = (brake > 0 || handbrake) && state.speed > 0.9 ? -0.014 : (throttle > 0 ? 0.007 : 0);
      const rearAccelSquat = throttle > 0 ? -0.010 : ((brake > 0 || handbrake) && state.speed > 0.9 ? 0.004 : 0);
      const targetFrontSusp = THREE.MathUtils.clamp(frontBrakeDive, -0.016, 0.009);
      const targetRearSusp = THREE.MathUtils.clamp(rearAccelSquat, -0.013, 0.007);

      state.frontSuspOffset = THREE.MathUtils.lerp(state.frontSuspOffset, targetFrontSusp, Math.min(1, dt * 8.5));
      state.rearSuspOffset = THREE.MathUtils.lerp(state.rearSuspOffset, targetRearSusp, Math.min(1, dt * 8.5));
      state.frontSuspVel = 0;
      state.rearSuspVel = 0;
    }
    update4WheelTerrainAndSuspension(dt, envRef, groundHeightFn, { accel, turnRate, brake, handbrake, throttle });

    const absKmh = Math.abs(state.speed) * 3.6;
    const totalGears = state.gearCount || 6;
    // Scale gear thresholds to each vehicle's true maxSpeed so normal full-throttle driving cleanly shifts 1 -> 2 -> ... -> top gear!
    const topKmh = Math.max(25, (config.maxSpeed || 30.0) * 3.6);
    const gearThresholds = [0];
    for (let i = 1; i <= totalGears; i++) {
      gearThresholds.push(topKmh * Math.pow(i / totalGears, 1.18));
    }
    let g = 1;
    for (let i = 1; i <= totalGears; i++) {
      if (absKmh >= gearThresholds[i - 1]) g = i;
    }
    // Smooth gear hysteresis prevents rapid upshift/downshift chatter
    const prevG = typeof state.lastGear === 'number' ? state.lastGear : 1;
    if (g < prevG && absKmh > gearThresholds[prevG - 1] - Math.max(3.5, topKmh * 0.035)) {
      g = prevG;
    }
    state.gear = state.speed < -0.4 ? 'R' : (absKmh < 1 ? 'N' : g);
    if (typeof state.gear === 'number' && typeof state.lastGear === 'number' && state.gear > state.lastGear && throttle > 0) {
      if (!config.isRickshaw) {
        state.shiftDipTimer = 0.07;
        state.dynPitchVel -= config.isBike ? 0.08 : 0.045;
      }
    }
    state.lastGear = state.gear;

    const gIdx = typeof g === 'number' ? g : 1;
    const gMin = gearThresholds[gIdx - 1] || 0;
    const gMax = gearThresholds[gIdx] || topKmh;
    const gearProgress = THREE.MathUtils.clamp((absKmh - gMin) / Math.max(1, gMax - gMin), 0, 1);
    const maxRpm = config.isTata2515 ? 2550 : (config.isBMW ? 7200 : (config.isCNG ? 5200 : 6200));
    const idleRpm = config.isTata2515 ? 650 : 880;
    // Smooth, steady top-gear highway cruise RPM (never bounces off a rev limiter!)
    const targetRpm = absKmh < 1
      ? idleRpm + throttle * (config.isTata2515 ? 950 : 2200)
      : THREE.MathUtils.clamp(idleRpm + 900 + gearProgress * (maxRpm - idleRpm - 1100) + (gIdx === totalGears ? throttle * 220 : 0), idleRpm, maxRpm);
    state.rpm = THREE.MathUtils.lerp(state.rpm, targetRpm, Math.min(1, dt * 6.5));

    state.isBraking = Boolean(brake > 0 || handbrake);
    if (config.isGameReadyCorolla) {
      for (const m of tailMats) {
        m.emissiveIntensity = state.isBraking ? 3.2 : 1.45;
      }
    } else {
      for (const m of tailMats) {
        m.emissiveIntensity = state.isBraking ? 7.0 : 2.2;
      }
    }

    updateEngineAudio(true, state.rpm, throttle, state.slipIntensity);
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
    const envIntensity = nextQuality === 'ultra' ? 2.40 : (nextQuality === 'high' ? 2.00 : (nextQuality === 'medium' ? 1.55 : 1.25));
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
    if (bikeSteelDiscMat) {
      // Crisp metallic CNC stainless-steel sheen on Ultra/High!
      bikeSteelDiscMat.envMapIntensity = nextQuality === 'ultra' ? 2.55 : (nextQuality === 'high' ? 2.15 : 1.5);
      bikeSteelDiscMat.emissiveIntensity = nextQuality === 'ultra' ? 0.17 : (nextQuality === 'high' ? 0.07 : 0.0);
      bikeSteelDiscMat.needsUpdate = true;
    }
    contactShadow.visible = true;
    if (contactShadow.material) {
      contactShadow.material.opacity = (nextQuality === 'ultra' || nextQuality === 'high') ? 0.58 : 0.78;
    }
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
    enterAICar,
    exitAICar,
    setAIControl,
    toggleRideSeat,
    setPassengerSeatIndex,
    cyclePassengerSeat,
    findNearestVanSeatIndex,
    getVanSeatPose,
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
    toggleHeadlights,
    playHorn,
    playDoorSound,
    playSeatbeltSound,
    playKickstandSound,
    setKickstandDeploy,
    setDriverDoorOpen,
    getRickshawAnchors,
    getCarDriverAnchors,
    getBikeRiderAnchors,
    getBikePovCameraPose,
    spawnAt(x, z, heading = 0) {
      const groundOffset = typeof config.groundOffset === 'number' ? Math.max(0.0075, config.groundOffset) : 0.0075;
      state.pos.set(x, groundOffset, z);
      state.heading = heading;
      state.speed = 0;
      state.lateralVel = 0;
      state.steerAngle = 0;
      state.velY = 0;
      state.grounded = true;
      state.pitch = 0;
      state.roll = 0;
      state.terrainPitch = 0;
      state.terrainRoll = 0;
      state.dynPitch = 0;
      state.dynPitchVel = 0;
      state.dynRoll = 0;
      state.dynRollVel = 0;
      state.suspHeave = 0;
      state.suspHeaveVel = 0;
      state.lastGroundY = groundOffset;
      state.frontSuspOffset = 0;
      state.frontSuspVel = 0;
      state.rearSuspOffset = 0;
      state.rearSuspVel = 0;
      state.lastImpactIntensity = 0;
      state.crashCooldown = 0;
      state.poleHitCooldown = 0;
      state.health = state.maxHealth;
      state.slipIntensity = 0;
      state.kickstandDeploy = (state.hasKickstand && !state.driving) ? 1.0 : 0.0;
      syncTransform();
    },
    destroy() {
      state.driving = false;
      updateEngineAudio(false, 920, 0);
      try { osc1?.stop?.(); } catch {}
      try { osc2?.stop?.(); } catch {}
      try { osc3?.stop?.(); } catch {}
      try { lfoOsc?.stop?.(); } catch {}
      try { pedalNoiseSrc?.stop?.(); } catch {}
      try { bikeCruiseSrc?.stop?.(); } catch {}
      try { bikeSprintSrc?.stop?.(); } catch {}
      try { bikeFwMidSrc?.stop?.(); } catch {}
      try { bikeFwFastSrc?.stop?.(); } catch {}
      try { screechNoiseSrc?.stop?.(); } catch {}
      osc1 = null;
      osc2 = null;
      osc3 = null;
      lfoOsc = null;
      pedalNoiseSrc = null;
      bikeCruiseSrc = null;
      bikeSprintSrc = null;
      bikeFwMidSrc = null;
      bikeFwFastSrc = null;
      bikeAudioReady = false;
      bikeAudioLoading = false;
      screechNoiseSrc = null;
      screechFilter = null;
      if (audioCtx) {
        try { audioCtx.close?.(); } catch {}
        audioCtx = null;
      }
      for (const p of tireSmokePuffs) {
        scene.remove(p.mesh);
        p.mesh.geometry?.dispose?.();
        p.mesh.material?.dispose?.();
      }
      tireSmokePuffs.length = 0;
      for (const p of exhaustSmokePuffs) {
        scene.remove(p.mesh);
        p.mesh.geometry?.dispose?.();
        p.mesh.material?.dispose?.();
      }
      exhaustSmokePuffs.length = 0;
      smokeTex?.dispose?.();
      root.traverse((obj) => {
        if (!obj.isMesh) return;
        obj.geometry?.dispose?.();
        if (Array.isArray(obj.material)) {
          for (const m of obj.material) m?.dispose?.();
        } else {
          obj.material?.dispose?.();
        }
      });
      if (root.parent) root.parent.remove(root);
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
