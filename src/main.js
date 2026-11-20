import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FirstPersonControls } from './controls.js';
import { createMaterials } from './materials.js';
import { buildHouse } from './house.js';
import { buildEnvironment } from './environment.js';
import { createPlayerCharacter } from './character.js';
import { TALTOLA_HOUSE_OFFSET } from './khulna-geo.js';
import { createKhulnaMapUI } from './khulna-map-ui.js';
import { createAtmosphericSkyAndPMREM, TIME_OF_DAY_PRESETS } from './aaa-shaders.js';
import { createDrivableCarFleet } from './car.js';
import './style.css';

const canvas = document.querySelector('#scene');
const loading = document.querySelector('#loading');
const loadingBar = document.querySelector('#loading-bar');
const loadingStatus = document.querySelector('#loading-status');
const studioPanel = document.querySelector('#studio-panel');
const intro = document.querySelector('#intro');
const pause = document.querySelector('#pause');
const header = document.querySelector('#hud-header');
const walkHud = document.querySelector('#walk-hud');
const enterStreetButton = document.querySelector('#enter-street-button');
const studioToggleButton = document.querySelector('#studio-toggle-button');
const enterButton = document.querySelector('#enter-button');
const resumeButton = document.querySelector('#resume-button');
const gateToggleButton = document.querySelector('#gate-toggle-button');
const cameraToggleButton = document.querySelector('#camera-toggle-button');
const runToggleButton = document.querySelector('#run-toggle-button');
const runPillButton = document.querySelector('#run-pill-button');
const carToggleButton = document.querySelector('#car-toggle-button');
const carHud = document.querySelector('#car-hud');
const carBadgeEl = document.querySelector('#car-badge');
const carSpeedEl = document.querySelector('#car-speed');
const carGearEl = document.querySelector('#car-gear');
const carRpmFill = document.querySelector('#car-rpm-fill');
const carSeatBtn = document.querySelector('#car-seat-btn');
const carSeatLabelEl = document.querySelector('#car-seat-label');
const carPaintBtn = document.querySelector('#car-paint-btn');
const carPaintNameEl = document.querySelector('#car-paint-name');
const carCamBtn = document.querySelector('#car-cam-btn');
const carHornBtn = document.querySelector('#car-horn-btn');
const carExitBtn = document.querySelector('#car-exit-btn');
const hudToggleButton = document.querySelector('#hud-toggle-button');
const emoteBar = document.querySelector('#emote-bar');
const liftHudButton = document.querySelector('#lift-hud-button');
const timeToggleButton = document.querySelector('#time-toggle-button');
const mapHudButton = document.querySelector('#map-hud-button');
const minimapDock = document.querySelector('#minimap-dock');
const spawnSelect = document.querySelector('#spawn-select');
const liftKeypad = document.querySelector('#lift-keypad');
const liftCloseUiButton = document.querySelector('#lift-close-ui');
const liftLedArrow = document.querySelector('#lift-led-arrow');
const liftLedCode = document.querySelector('#lift-led-code');
const liftLedName = document.querySelector('#lift-led-name');
const liftLedStatus = document.querySelector('#lift-led-status');
const liftFloorButtons = Array.from(document.querySelectorAll('[data-lift-floor]'));
const liftDoorOpenBtn = document.querySelector('#lift-door-open-btn');
const liftDoorCloseBtn = document.querySelector('#lift-door-close-btn');
const liftExitBtn = document.querySelector('#lift-exit-btn');
const interactPrompt = document.querySelector('#interact-prompt');
const locationTagText = document.querySelector('.location-tag');
const qualityInputs = [
  document.querySelector('#quality'),
  document.querySelector('#pause-quality'),
  document.querySelector('#studio-quality'),
  document.querySelector('#hud-quality'),
];
const referenceModal = document.querySelector('#reference-modal');
const fpsLabel = document.querySelector('#fps');
const crosshairEl = document.querySelector('.crosshair');
const brandTitle = document.querySelector('#brand-title');
const brandSubtitle = document.querySelector('#brand-subtitle');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x18211e);
scene.fog = new THREE.Fog(0xcfe0e6, 160, 480);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.18, 620);

const TIME_ORDER = ['golden', 'sunset', 'night', 'daylight'];
let timeOfDayId = localStorage.getItem('taltola_time_of_day') || 'golden';
if (!TIME_OF_DAY_PRESETS[timeOfDayId]) timeOfDayId = 'golden';
let skySystem = null;
let composer = null;
let bloomPass = null;

function setupPostProcessing() {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(
      Math.max(256, Math.floor(window.innerWidth * 0.5)),
      Math.max(144, Math.floor(window.innerHeight * 0.5))
    ),
    0.24,
    0.38,
    0.86
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
}

function updateSunPositionFromAnchor(ax, az) {
  if (!sun) return;
  const preset = skySystem?.getActivePreset?.() || TIME_OF_DAY_PRESETS.golden;
  const [sx, sy, sz] = preset.sunPos;
  const scale = 38 / Math.max(1, Math.hypot(sx, sy, sz));
  sun.target.position.set(ax, 1, az);
  sun.position.set(ax + sx * scale, Math.max(8, sy * scale), az + sz * scale);
  sun.target.updateMatrixWorld();
}

function applyTimeOfDay(nextId) {
  if (!TIME_OF_DAY_PRESETS[nextId]) return;
  timeOfDayId = nextId;
  try {
    localStorage.setItem('taltola_time_of_day', timeOfDayId);
  } catch {}
  const preset = skySystem?.applyPreset?.(timeOfDayId, {
    sun,
    hemisphereLight,
    ambientLight,
    composerPasses: { bloom: bloomPass },
    quality,
  }) || TIME_OF_DAY_PRESETS[timeOfDayId];

  if (!inStudio) {
    updateSunPositionFromAnchor(lastSunAnchorX, lastSunAnchorZ);
    if (sun?.castShadow) renderer.shadowMap.needsUpdate = true;
    environment?.setNightFactor?.(preset.nightFactor);
  }
  if (timeToggleButton) {
    timeToggleButton.innerHTML = `TIME: ${preset.shortLabel} <span>[N]</span>`;
  }
}

function cycleTimeOfDay() {
  const idx = TIME_ORDER.indexOf(timeOfDayId);
  const next = TIME_ORDER[(idx + 1) % TIME_ORDER.length];
  applyTimeOfDay(next);
}

timeToggleButton?.addEventListener('click', cycleTimeOfDay);

function renderActiveScene() {
  const needsBloom = Boolean(
    bloomPass && bloomPass.strength > 0.05
    && (quality === 'ultra' || timeOfDayId === 'sunset' || timeOfDayId === 'night')
  );
  if (composer && !inStudio && !ultraFastMode && quality !== 'low' && needsBloom) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}

const controls = new FirstPersonControls(camera, renderer.domElement);
const clock = new THREE.Clock();
const keys = new Set();

const EYE_HEIGHT = 1.68;
const PLAYER_RADIUS = 0.34;
const playerPos = new THREE.Vector3(TALTOLA_HOUSE_OFFSET.x - 0.2, EYE_HEIGHT, TALTOLA_HOUSE_OFFSET.z + 0.8);
const savedCameraQuat = new THREE.Quaternion();
const camShoulderProbe = new THREE.Vector3();

let inStudio = false;
let started = false;
let liftKeypadOpen = false;
let wasInsideLift = false;
let verticalVelocity = 0;
let grounded = true;
let jumpBuffer = 0;
let coyoteTimer = 0;
let bobPhase = 0;
let runModeToggle = false;
let shiftHeld = false;
let doubleTapSprint = false;
let lastForwardDownTime = 0;
let airPeakY = EYE_HEIGHT;
let isFlipping = false;
let landRecoveryTimer = 0;
let landRecoveryClip = null;
let inWater = false;
let wallAhead = false;
const wallProbePos = new THREE.Vector3();
const climbState = {
  active: false,
  timer: 0,
  duration: 1.05,
  startX: 0,
  startY: 0,
  startZ: 0,
  targetX: 0,
  targetY: 0,
  targetZ: 0,
  yaw: 0,
};
const diveState = {
  active: false,
  timer: 0,
  duration: 0.90,
  dirX: 0,
  dirZ: 0,
};
const horizontalVelocity = new THREE.Vector2(0, 0);
const forwardVec = new THREE.Vector3();
const rightVec = new THREE.Vector3();
const wishDir = new THREE.Vector3();

// Studio Orbit Camera State
const studioOrbit = {
  angle: 0.0,
  pitch: 0.05,
  distance: 2.65,
  targetY: 0.86,
  targetAngle: 0.0,
  targetPitch: 0.05,
  targetDistance: 2.65,
  targetLookY: 0.86,
  autoSpin: false,
  dragging: false,
  lastX: 0,
  lastY: 0,
};

let quality = localStorage.getItem('taltola_quality') || 'high';
if (!['low', 'medium', 'high', 'ultra'].includes(quality)) quality = 'high';
let sceneMaterials;
let environment;
let house;
let studioGroup;
let playerCharacter;
let cars = [];
let bmwCar;
function getDrivingCar() {
  return cars.find((c) => c.state.driving) || null;
}
function findNearestCar(pos) {
  let best = null;
  let bestDist = Infinity;
  for (const c of cars) {
    const d = c.distanceToPlayer(pos);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}
function findNearestEnterableCar(pos) {
  const c = findNearestCar(pos);
  return c && c.isPlayerNear(pos) ? c : null;
}
const carCamDesired = new THREE.Vector3();
const carCamLookTarget = new THREE.Vector3();
let sun;
let ambientLight;
let hemisphereLight;
let studioKeyLight;
let fillDirLight;
let indoorLight;
let ready = false;
let lastHudDoorOpen = null;
let lastHudCameraMode = null;
let lastHudRunOn = null;
let lastPromptText = null;
let lastZoneText = null;
let lastSyncedEmote = undefined;
const camTargetPos = new THREE.Vector3();
const camDesiredPos = new THREE.Vector3();
const camPivotPos = new THREE.Vector3();
const camRayDelta = new THREE.Vector3();
const camSideVec = new THREE.Vector3();
const camUpVec = new THREE.Vector3(0, 1, 0);
const camSpreadDir = new THREE.Vector3();
let baseCamNear = 0;
let smoothedCamDist = 1.95;
let camHideMeshState = false;
let isThirdPersonEyeFallback = false;
let lastResolvedCamMode = null;
let ultraFastMode = false;
let lowFpsStreak = 0;
let khulnaMapUI = null;
let lastMinimapUpdate = 0;
let lastSunAnchorX = 0;
let lastSunAnchorZ = 0;
const camGroundProbePos = new THREE.Vector3();

const MAX_CAM_BOXES = 128;
const camBoxData = new Float32Array(MAX_CAM_BOXES * 6);
let camBoxCount = 0;

function pushCamBox(x0, x1, y0, y1, z0, z1) {
  if (camBoxCount >= MAX_CAM_BOXES) return;
  const idx = camBoxCount * 6;
  camBoxData[idx] = x0 < x1 ? x0 : x1;
  camBoxData[idx + 1] = x0 > x1 ? x0 : x1;
  camBoxData[idx + 2] = y0 < y1 ? y0 : y1;
  camBoxData[idx + 3] = y0 > y1 ? y0 : y1;
  camBoxData[idx + 4] = z0 < z1 ? z0 : z1;
  camBoxData[idx + 5] = z0 > z1 ? z0 : z1;
  camBoxCount++;
}

function pushTowerSlabCutouts(xWest, xEast, y0, y1, zNorth, zSouth) {
  pushCamBox(xWest, xEast, y0, y1, zNorth, 18.70);
  pushCamBox(-11.55, xEast, y0, y1, 18.70, 20.40);
  pushCamBox(xWest, -13.38, y0, y1, 18.70, 20.40);
  pushCamBox(xWest, xEast, y0, y1, 20.40, 21.55);
  pushCamBox(-9.60, xEast, y0, y1, 21.55, 22.80);
  pushCamBox(xWest, -14.20, y0, y1, 21.55, 22.80);
  pushCamBox(xWest, xEast, y0, y1, 22.80, zSouth);
}

function pushHouseSlabCutouts(y0, y1, hx = 0, hz = 0) {
  pushCamBox(6.0 + hx, 14.35 + hx, y0, y1, -5.40 + hz, 0.16 + hz);
  pushCamBox(6.0 + hx, 14.35 + hx, y0, y1, 1.16 + hz, 5.40 + hz);
  pushCamBox(6.0 + hx, 7.65 + hx, y0, y1, 0.16 + hz, 1.16 + hz);
  pushCamBox(12.10 + hx, 14.35 + hx, y0, y1, 0.16 + hz, 1.16 + hz);
}

function collectCameraObstacleBoxes(pivot, footY) {
  camBoxCount = 0;

  // 0. Outdoor street ground plane centered under pivot so camera never dips under Khulna roads/earth
  pushCamBox(pivot.x - 80, pivot.x + 80, -1.5, -0.02, pivot.z - 80, pivot.z + 80);

  // 1. Haji Mohsin Rd outdoor roadside structures & compound boundaries (when near (0,0) and below rooftop)
  if (footY < 16.0 && Math.abs(pivot.x) < 60 && Math.abs(pivot.z) < 60) {
    pushCamBox(-46.0, -2.92, 0, 2.2, -10.5, 10.22);
    pushCamBox(-46.0, -19.85, 0, 14.0, 14.26, 42.0);
    pushCamBox(-19.85, -3.22, 0, 15.0, 28.58, 42.0);
    pushCamBox(-46.0, -42.45, 0, 12.0, 9.0, 15.5);
    pushCamBox(3.20, 22.0, 0, 12.5, -28.0, 7.45);
    pushCamBox(3.02, 22.0, 0, 7.0, 7.45, 20.85);
    pushCamBox(7.20, 22.0, 0, 8.5, 20.85, 26.80);
    pushCamBox(3.05, 22.0, 0, 12.5, 26.55, 42.0);
  }

  // 2. SK Arshan Alif Tower (active whenever player is inside or nearby)
  if (pivot.x < 3.5 && pivot.z > 8.5 && pivot.z < 34.5) {
    const L = (k) => (k === 0 ? 0.50 : 4.0 + (k - 1) * 3.0);
    let towerK = 0;
    let towerFy = 0.50;
    for (let k = 0; k <= 10; k++) {
      const y = L(k);
      if (y <= footY + 0.55) {
        towerK = k;
        towerFy = y;
      }
    }

    // Perimeter outer walls (West rear, South party wall, North lane facade)
    pushCamBox(-19.85, -19.43, 0, 31.1, 14.25, 28.60);
    pushCamBox(-19.85, -3.65, 0, 31.1, 28.22, 28.60);
    pushCamBox(-19.85, -4.25, 0, 31.1, 14.28, 14.76);

    // Full-height 3D Elevator Shaft walls
    pushCamBox(-13.40, -13.25, 0.4, 34.0, 18.68, 20.42);
    pushCamBox(-13.40, -11.52, 0.4, 34.0, 18.68, 18.80);
    pushCamBox(-13.40, -11.52, 0.4, 34.0, 20.28, 20.42);
    pushCamBox(-11.68, -11.52, 0.4, 34.0, 18.68, 18.96);
    pushCamBox(-11.68, -11.52, 0.4, 34.0, 20.14, 20.42);

    const towerSt = environment?.tower?.state;
    const inLift = Boolean(environment?.tower?.isInsideLift(pivot));
    const liftDoorClear = Boolean(environment?.tower?.isLiftOpenAtY(footY)) && (!towerSt || towerSt.liftDoorOpen > 0.72);
    if (inLift && towerSt) {
      pushCamBox(-13.34, -11.56, towerSt.liftY - 0.16, towerSt.liftY + 0.025, 18.74, 20.36);
      pushCamBox(-13.34, -11.58, towerSt.liftY + 2.35, towerSt.liftY + 2.58, 18.74, 20.36);
      if (!liftDoorClear) {
        pushCamBox(-11.66, -11.54, towerSt.liftY, towerSt.liftY + 2.42, 18.74, 20.36);
      }
    } else if (!liftDoorClear) {
      pushCamBox(-11.68, -11.52, 0.4, 34.0, 18.94, 20.16);
    }

    if (towerK === 0 && footY < 3.4) {
      // Ground floor plinth, front piers, closed gate & ceiling slab
      pushCamBox(-19.85, -3.25, 0.0, 0.50, 14.25, 28.60);
      pushTowerSlabCutouts(-19.85, -3.95, 3.74, 4.02, 14.25, 28.60);
      pushCamBox(-4.55, -4.02, 0.50, 4.0, 14.55, 18.88);
      pushCamBox(-4.55, -4.02, 0.50, 4.0, 21.92, 26.58);
      pushCamBox(-4.55, -4.02, 0.50, 4.0, 27.82, 28.60);
      if (towerSt && !towerSt.gateOpen) {
        pushCamBox(-4.45, -4.05, 0.50, 3.80, 18.88, 21.92);
      }
    } else if (towerK >= 1 && towerK <= 9 && footY < 29.8) {
      // Floor & ceiling slabs (with shaft + stairwell cutouts) + cantilever balcony slabs
      pushTowerSlabCutouts(-19.85, -5.50, towerFy - 0.26, towerFy + 0.02, 14.65, 28.35);
      pushCamBox(-4.45, -2.85, towerFy - 0.26, towerFy + 0.02, 14.30, 18.60);
      pushCamBox(-5.60, -3.75, towerFy - 0.26, towerFy + 0.02, 18.90, 23.30);
      pushCamBox(-5.15, towerK % 2 === 0 ? -3.65 : -4.30, towerFy - 0.26, towerFy + 0.02, 23.60, 28.25);

      const ceilY = towerFy + 3.0;
      const nextK = towerK + 1;
      if (nextK <= 9) {
        pushTowerSlabCutouts(-19.85, -5.50, ceilY - 0.26, ceilY + 0.02, 14.65, 28.35);
        pushCamBox(-4.45, -2.85, ceilY - 0.26, ceilY + 0.02, 14.30, 18.60);
        pushCamBox(-5.60, -3.75, ceilY - 0.26, ceilY + 0.02, 18.90, 23.30);
        pushCamBox(-5.15, nextK % 2 === 0 ? -3.65 : -4.30, ceilY - 0.26, ceilY + 0.02, 23.60, 28.25);
      } else {
        pushTowerSlabCutouts(-19.85, -3.65, 30.76, 31.04, 14.30, 28.60);
      }

      // Interior partition & facade walls for current floor (and next floor if climbing stairs)
      const maxK = (footY - towerFy > 1.35 && towerK < 9) ? towerK + 1 : towerK;
      for (let fk = towerK; fk <= maxK; fk++) {
        const fy = L(fk);
        const wTop = fy + 2.98;

        // Front balcony walls (with open walkable doorways)
        pushCamBox(-4.46, -4.18, fy, wTop, 14.58, 15.20);
        pushCamBox(-4.46, -4.18, fy, wTop, 16.35, 18.60);
        pushCamBox(-4.46, -4.18, fy + 2.32, wTop, 15.20, 16.35);

        pushCamBox(-5.62, -3.75, fy, wTop, 18.58, 18.90);
        pushCamBox(-5.62, -3.75, fy, wTop, 23.30, 23.60);
        pushCamBox(-5.72, -5.48, fy, wTop, 18.88, 19.30);
        pushCamBox(-5.72, -5.48, fy, wTop, 20.45, 23.32);
        pushCamBox(-5.72, -5.48, fy + 2.30, wTop, 19.30, 20.45);

        pushCamBox(-5.22, -4.94, fy, wTop, 23.58, 24.10);
        pushCamBox(-5.22, -4.94, fy, wTop, 25.30, 28.50);
        pushCamBox(-5.22, -4.94, fy + 2.30, wTop, 24.10, 25.30);

        // North Lobby / Flat A Wall (z = 18.63, open Flat A door x=-8.60..-7.20 & West Bath door x=-18.30..-17.10)
        pushCamBox(-7.20, -5.50, fy, wTop, 18.50, 18.76);
        pushCamBox(-17.10, -8.60, fy, wTop, 18.50, 18.76);
        pushCamBox(-19.85, -18.30, fy, wTop, 18.50, 18.76);
        pushCamBox(-8.60, -7.20, fy + 2.22, wTop, 18.50, 18.76);
        pushCamBox(-18.30, -17.10, fy + 2.22, wTop, 18.50, 18.76);
        pushCamBox(-8.67, -8.53, fy, fy + 2.22, 17.35, 18.55);

        // South Lobby / Flat B Wall (z = 23.26, open Flat B door x=-8.60..-7.20)
        pushCamBox(-7.20, -5.05, fy, wTop, 23.13, 23.40);
        pushCamBox(-19.85, -8.60, fy, wTop, 23.13, 23.40);
        pushCamBox(-8.60, -7.20, fy + 2.22, wTop, 23.13, 23.40);
        pushCamBox(-8.67, -8.53, fy, fy + 2.22, 23.35, 24.55);

        // North Wing Living / Bedroom Wall (x = -13.30, open door z=16.00..17.30)
        pushCamBox(-13.40, -13.20, fy, wTop, 14.68, 16.00);
        pushCamBox(-13.40, -13.20, fy, wTop, 17.30, 18.63);
        pushCamBox(-13.40, -13.20, fy + 2.22, wTop, 16.00, 17.30);

        // South Wing Dining / RGB Gaming Wall (x = -13.30, open door z=24.90..26.30)
        pushCamBox(-13.40, -13.20, fy, wTop, 23.26, 24.90);
        pushCamBox(-13.40, -13.20, fy, wTop, 26.30, 28.50);
        pushCamBox(-13.40, -13.20, fy + 2.22, wTop, 24.90, 26.30);

        // West En-Suite Attached Bathroom Walls (open door x=-18.30..-17.20) + shower glass
        pushCamBox(-16.75, -16.50, fy, wTop, 18.63, 21.40);
        pushCamBox(-17.20, -16.50, fy, wTop, 21.20, 21.44);
        pushCamBox(-19.80, -18.30, fy, wTop, 21.20, 21.44);
        pushCamBox(-18.30, -17.20, fy + 2.22, wTop, 21.20, 21.44);
        pushCamBox(-18.38, -18.24, fy, fy + 2.15, 18.65, 19.65);

        // Landing lintel above elevator door
        pushCamBox(-11.68, -11.52, fy + 2.28, wTop, 18.96, 20.14);

        // Tall furniture (>= 1.75m like Fridges & Wardrobes) so camera stays cleanly in front
        const fBoxes = getFurnitureBoxesForFloor('tower', fy);
        for (const box of fBoxes) {
          if (box.h >= 1.75) {
            pushCamBox(box.minX, box.maxX, fy, fy + box.h, box.minZ, box.maxZ);
          }
        }
      }
    } else if (footY >= 29.8) {
      // Rooftop Sky Lounge & Penthouse Mumty Room
      pushTowerSlabCutouts(-19.85, -3.65, 30.76, 31.04, 14.30, 28.60);
      pushCamBox(-16.62, -16.30, 31.0, 34.0, 18.20, 23.10);
      pushCamBox(-16.55, -9.40, 31.0, 34.0, 18.18, 18.48);
      pushCamBox(-16.55, -9.40, 31.0, 34.0, 22.82, 23.12);
      pushCamBox(-9.68, -9.38, 31.0, 34.0, 18.20, 18.90);
      pushCamBox(-9.68, -9.38, 31.0, 34.0, 21.40, 23.10);
      pushCamBox(-9.68, -9.38, 33.2, 34.0, 18.90, 21.40);
      pushCamBox(-16.62, -9.38, 33.8, 34.2, 18.18, 23.12);
    }
  }

  // 3. 5-Story Taltola House (at Tootpara Taltola Hospital Cross Rd, active whenever player is inside or nearby)
  const hx = TALTOLA_HOUSE_OFFSET.x;
  const hz = TALTOLA_HOUSE_OFFSET.z;
  const lxPivot = pivot.x - hx;
  const lzPivot = pivot.z - hz;
  if (lxPivot > -6.0 && lxPivot < 26.0 && Math.abs(lzPivot) < 12.0) {
    const pushHouseCamBox = (x0, x1, y0, y1, z0, z1) => pushCamBox(x0 + hx, x1 + hx, y0, y1, z0 + hz, z1 + hz);
    let currentLevel = 0;
    for (let sLvl = 0; sLvl <= 5; sLvl++) {
      if (sLvl * 3.05 <= footY + 0.55) currentLevel = sLvl;
    }

    if (footY < 3.4) {
      pushHouseCamBox(2.36, 2.66, 0, 2.35, -7.48, -2.06);
      pushHouseCamBox(2.36, 2.66, 0, 2.35, 2.06, 7.36);
      if (house && !house.state.gateOpen) {
        pushHouseCamBox(2.36, 2.66, 0, 2.35, -2.06, 2.06);
      }
      pushHouseCamBox(2.4, 22.0, 0, 2.45, -7.48, -7.08);
      pushHouseCamBox(2.4, 22.0, 0, 2.45, 7.08, 7.48);
    }

    if (footY < 15.6) {
      // Side walls & Back wall across all 5 floors
      pushHouseCamBox(5.96, 14.40, 0, 15.30, -5.50, -5.22);
      pushHouseCamBox(5.96, 14.40, 0, 15.30, 5.22, 5.50);
      pushHouseCamBox(14.12, 14.46, 3.05, 15.30, -5.48, 5.48);

      // Ground floor front & back walls with openable doors
      pushHouseCamBox(5.92, 6.24, 0, 3.05, -5.48, -0.60);
      pushHouseCamBox(5.92, 6.24, 0, 3.05, 0.60, 5.48);
      pushHouseCamBox(5.92, 6.24, 2.30, 3.05, -0.64, 0.64);
      if (house && !house.state.frontDoorOpen) {
        pushHouseCamBox(5.88, 6.20, 0, 2.35, -0.64, 0.64);
      }
      pushHouseCamBox(14.12, 14.44, 0, 3.05, -5.48, -0.60);
      pushHouseCamBox(14.12, 14.44, 0, 3.05, 0.60, 5.48);
      pushHouseCamBox(14.12, 14.44, 2.30, 3.05, -0.64, 0.64);
      if (house && !house.state.backDoorOpen) {
        pushHouseCamBox(14.16, 14.48, 0, 2.35, -0.64, 0.64);
      }

      if (currentLevel === 0) {
        pushHouseCamBox(6.0, 14.35, -0.05, 0.08, -5.40, 5.40);
      } else if (currentLevel >= 1 && currentLevel <= 4) {
        const floorY = currentLevel * 3.05;
        pushHouseSlabCutouts(floorY - 0.14, floorY + 0.09, hx, hz);
        pushHouseCamBox(4.72, 6.08, floorY - 0.14, floorY + 0.09, -5.20, -1.38);
        pushHouseCamBox(4.72, 6.08, floorY - 0.14, floorY + 0.09, 1.44, 5.20);
      }
      if (currentLevel <= 4) {
        const ceilY = (currentLevel + 1) * 3.05;
        pushHouseSlabCutouts(ceilY - 0.14, ceilY + 0.09, hx, hz);
        if (currentLevel < 4) {
          pushHouseCamBox(4.72, 6.08, ceilY - 0.14, ceilY + 0.09, -5.20, -1.38);
          pushHouseCamBox(4.72, 6.08, ceilY - 0.14, ceilY + 0.09, 1.44, 5.20);
        }
      }

      const maxLvl = Math.min(4, (footY - currentLevel * 3.05 > 1.35) ? currentLevel + 1 : currentLevel);
      for (let lvl = Math.min(4, currentLevel); lvl <= maxLvl; lvl++) {
        const fy = lvl * 3.05;
        const wTop = fy + 3.05;

        if (lvl >= 1) {
          // Upper floor front exterior wall with open balcony doorways
          pushHouseCamBox(5.94, 6.22, fy, wTop, -5.48, -3.25);
          pushHouseCamBox(5.94, 6.22, fy, wTop, -1.90, 1.90);
          pushHouseCamBox(5.94, 6.22, fy, wTop, 3.25, 5.48);
          pushHouseCamBox(5.94, 6.22, fy + 2.32, wTop, -3.25, -1.90);
          pushHouseCamBox(5.94, 6.22, fy + 2.32, wTop, 1.90, 3.25);
          pushHouseCamBox(4.72, 6.08, fy, wTop, -5.20, -5.02);
          pushHouseCamBox(4.72, 6.08, fy, wTop, -1.56, -1.38);
          pushHouseCamBox(4.72, 6.08, fy, wTop, 1.44, 1.62);
          pushHouseCamBox(4.72, 6.08, fy, wTop, 5.02, 5.20);
        }

        // Corridor walls (with doorways & openable flat doors)
        pushHouseCamBox(6.05, 7.18, fy, wTop, -1.27, -1.09);
        pushHouseCamBox(8.30, 12.10, fy, wTop, -1.27, -1.09);
        pushHouseCamBox(13.20, 14.32, fy, wTop, -1.27, -1.09);
        pushHouseCamBox(7.18, 8.30, fy + 2.24, wTop, -1.27, -1.09);
        pushHouseCamBox(12.10, 13.20, fy + 2.24, wTop, -1.27, -1.09);
        if (house && !house.isFlatDoorOpen(lvl, -1)) {
          pushHouseCamBox(7.18, 8.30, fy, fy + 2.26, -1.27, -1.09);
        }

        pushHouseCamBox(6.05, 6.38, fy, wTop, 1.09, 1.27);
        pushHouseCamBox(7.50, 12.20, fy, wTop, 1.09, 1.27);
        pushHouseCamBox(13.30, 14.32, fy, wTop, 1.09, 1.27);
        pushHouseCamBox(6.38, 7.50, fy + 2.24, wTop, 1.09, 1.27);
        pushHouseCamBox(12.20, 13.30, fy + 2.24, wTop, 1.09, 1.27);
        if (house && !house.isFlatDoorOpen(lvl, 1)) {
          pushHouseCamBox(6.38, 7.50, fy, fy + 2.26, 1.09, 1.27);
        }

        // Interior room & bathroom partitions
        for (const side of [-1, 1]) {
          const zMin = side === -1 ? -5.36 : 2.40;
          const zMax = side === -1 ? -2.40 : 5.36;
          const bz = side * 2.55;
          pushHouseCamBox(9.56, 9.74, fy, wTop, zMin, zMax);
          pushHouseCamBox(11.36, 11.54, fy, wTop, zMin, zMax);
          pushHouseCamBox(9.56, 9.74, fy + 2.28, wTop, side * 1.27, side * 2.40);
          pushHouseCamBox(11.36, 11.54, fy + 2.28, wTop, side * 1.27, side * 2.40);
          pushHouseCamBox(9.65, 10.10, fy, wTop, bz - 0.08, bz + 0.08);
          pushHouseCamBox(11.00, 11.45, fy, wTop, bz - 0.08, bz + 0.08);
          pushHouseCamBox(10.10, 11.00, fy + 2.24, wTop, bz - 0.08, bz + 0.08);
        }

        const fBoxes = getFurnitureBoxesForFloor('house', fy);
        for (const box of fBoxes) {
          if (box.h >= 1.75) {
            pushHouseCamBox(box.minX, box.maxX, fy, fy + box.h, box.minZ, box.maxZ);
          }
        }
      }
    }

    // House rooftop slab & mumty room
    if (footY >= 14.0) {
      pushHouseSlabCutouts(15.11, 15.34, hx, hz);
      pushHouseCamBox(7.50, 13.65, 15.25, 18.0, -1.30, -1.12);
      pushHouseCamBox(7.50, 13.65, 15.25, 18.0, 1.15, 1.32);
      pushHouseCamBox(13.45, 13.68, 15.25, 18.0, -1.25, 1.25);
    }
  }
}

function castCamRaySingle(ox, oy, oz, dx, dy, dz, basePad, maxT = 1.0) {
  let minT = maxT;
  for (let i = 0; i < camBoxCount; i++) {
    const idx = i * 6;
    const bMinX = camBoxData[idx];
    const bMaxX = camBoxData[idx + 1];
    const bMinY = camBoxData[idx + 2];
    const bMaxY = camBoxData[idx + 3];
    const bMinZ = camBoxData[idx + 4];
    const bMaxZ = camBoxData[idx + 5];

    const cx = ox < bMinX ? bMinX - ox : (ox > bMaxX ? ox - bMaxX : 0);
    const cy = oy < bMinY ? bMinY - oy : (oy > bMaxY ? oy - bMaxY : 0);
    const cz = oz < bMinZ ? bMinZ - oz : (oz > bMaxZ ? oz - bMaxZ : 0);
    const dPivot = Math.hypot(cx, cy, cz);
    const pad = dPivot > 0.025 ? Math.min(basePad, dPivot - 0.02) : 0.0;

    const x0 = bMinX - pad;
    const x1 = bMaxX + pad;
    const y0 = bMinY - pad;
    const y1 = bMaxY + pad;
    const z0 = bMinZ - pad;
    const z1 = bMaxZ + pad;

    let tMin = 0.0;
    let tMax = minT;

    if (Math.abs(dx) < 1e-6) {
      if (ox < x0 || ox > x1) continue;
    } else {
      const inv = 1 / dx;
      let t1 = (x0 - ox) * inv;
      let t2 = (x1 - ox) * inv;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      if (t1 > tMin) tMin = t1;
      if (t2 < tMax) tMax = t2;
      if (tMin > tMax) continue;
    }

    if (Math.abs(dy) < 1e-6) {
      if (oy < y0 || oy > y1) continue;
    } else {
      const inv = 1 / dy;
      let t1 = (y0 - oy) * inv;
      let t2 = (y1 - oy) * inv;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      if (t1 > tMin) tMin = t1;
      if (t2 < tMax) tMax = t2;
      if (tMin > tMax) continue;
    }

    if (Math.abs(dz) < 1e-6) {
      if (oz < z0 || oz > z1) continue;
    } else {
      const inv = 1 / dz;
      let t1 = (z0 - oz) * inv;
      let t2 = (z1 - oz) * inv;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      if (t1 > tMin) tMin = t1;
      if (t2 < tMax) tMax = t2;
      if (tMin > tMax) continue;
    }

    if (tMin >= 0 && tMin < minT) {
      minT = tMin;
    }
  }
  return minT;
}

function castCamFrustumRay(ox, oy, oz, tx, ty, tz, basePad) {
  const dx = tx - ox;
  const dy = ty - oy;
  const dz = tz - oz;
  const dist = Math.hypot(dx, dy, dz);
  if (dist < 0.001) return 1.0;

  let minT = castCamRaySingle(ox, oy, oz, dx, dy, dz, basePad, 1.0);
  camSpreadDir.set(dx, dy, dz).divideScalar(dist);
  camSideVec.crossVectors(camSpreadDir, camUpVec);
  if (camSideVec.lengthSq() > 1e-4) {
    camSideVec.normalize();
    const spreadPad = Math.max(0.12, basePad - 0.09);
    const sx = camSideVec.x * 0.13;
    const sz = camSideVec.z * 0.13;
    const sy = 0.08;
    minT = Math.min(minT, castCamRaySingle(ox, oy, oz, dx + sx, dy + sy, dz + sz, spreadPad, minT));
    minT = Math.min(minT, castCamRaySingle(ox, oy, oz, dx - sx, dy + sy, dz - sz, spreadPad, minT));
    minT = Math.min(minT, castCamRaySingle(ox, oy, oz, dx + sx, dy - sy, dz + sz, spreadPad, minT));
    minT = Math.min(minT, castCamRaySingle(ox, oy, oz, dx - sx, dy - sy, dz - sz, spreadPad, minT));
  }
  return minT;
}

function minWallClearDist(pos, refY) {
  let minD = 99;
  for (let i = 0; i < camBoxCount; i++) {
    const idx = i * 6;
    const bMinY = camBoxData[idx + 2];
    const bMaxY = camBoxData[idx + 3];
    if (bMaxY - bMinY < 1.10 || refY < bMinY - 0.18 || refY > bMaxY + 0.18) continue;
    const bMinX = camBoxData[idx];
    const bMaxX = camBoxData[idx + 1];
    const bMinZ = camBoxData[idx + 4];
    const bMaxZ = camBoxData[idx + 5];
    const clx = pos.x < bMinX ? bMinX - pos.x : (pos.x > bMaxX ? pos.x - bMaxX : 0);
    const clz = pos.z < bMinZ ? bMinZ - pos.z : (pos.z > bMaxZ ? pos.z - bMaxZ : 0);
    const d = Math.hypot(clx, clz);
    if (d < minD) minD = d;
  }
  return minD;
}

function resolveCamXZClearance(pos, clearDist, refY, pivot) {
  const startX = pos.x;
  const startY = pos.y;
  const startZ = pos.z;

  for (let pass = 0; pass < 2; pass++) {
    let pushPosX = 0;
    let pushNegX = 0;
    let pushPosZ = 0;
    let pushNegZ = 0;

    for (let i = 0; i < camBoxCount; i++) {
      const idx = i * 6;
      const bMinY = camBoxData[idx + 2];
      const bMaxY = camBoxData[idx + 3];
      if (bMaxY - bMinY < 1.10 || refY < bMinY - 0.18 || refY > bMaxY + 0.18) continue;
      const exMinX = camBoxData[idx] - clearDist;
      const exMaxX = camBoxData[idx + 1] + clearDist;
      const exMinZ = camBoxData[idx + 4] - clearDist;
      const exMaxZ = camBoxData[idx + 5] + clearDist;
      if (pos.x <= exMinX || pos.x >= exMaxX || pos.z <= exMinZ || pos.z >= exMaxZ) continue;

      const dxL = pos.x - exMinX;
      const dxR = exMaxX - pos.x;
      const dzN = pos.z - exMinZ;
      const dzF = exMaxZ - pos.z;
      const minPen = Math.min(dxL, dxR, dzN, dzF);

      if (minPen === dxL) {
        if (dxL > pushNegX) pushNegX = dxL;
      } else if (minPen === dxR) {
        if (dxR > pushPosX) pushPosX = dxR;
      } else if (minPen === dzN) {
        if (dzN > pushNegZ) pushNegZ = dzN;
      } else {
        if (dzF > pushPosZ) pushPosZ = dzF;
      }
    }

    pos.x += (pushPosX > 0 && pushNegX > 0) ? (pushPosX - pushNegX) * 0.5 : (pushPosX - pushNegX);
    pos.z += (pushPosZ > 0 && pushNegZ > 0) ? (pushPosZ - pushNegZ) * 0.5 : (pushPosZ - pushNegZ);
  }

  if (pivot && (pos.x !== startX || pos.z !== startZ)) {
    const los = castCamRaySingle(
      pivot.x, pivot.y, pivot.z,
      pos.x - pivot.x, pos.y - pivot.y, pos.z - pivot.z,
      0.02, 1.0,
    );
    if (los < 0.998) {
      pos.set(startX, startY, startZ);
    }
  }
}

function syncCameraNear(targetNear) {
  if (Math.abs(camera.near - targetNear) > 0.002) {
    camera.near = targetNear;
    camera.updateProjectionMatrix();
  }
}

function resolveThirdPersonCamera(pivot, desiredPos, footY, delta, bypassSmoothing = false, allowEyeFallback = true) {
  if (baseCamNear === 0) baseCamNear = camera.near;
  collectCameraObstacleBoxes(pivot, footY);
  camRayDelta.subVectors(desiredPos, pivot);
  const desiredDist = camRayDelta.length();
  if (desiredDist < 0.001) {
    isThirdPersonEyeFallback = false;
    syncCameraNear(baseCamNear);
    return { camPos: desiredPos, hidePlayerMesh: false };
  }

  const ox = pivot.x;
  const oy = pivot.y;
  const oz = pivot.z;
  const dx = camRayDelta.x;
  const dy = camRayDelta.y;
  const dz = camRayDelta.z;

  // Tight frustum sweep strictly along the user's mouse aim ray (1:1 yaw/pitch, zero angle lock or snap)
  const minT = castCamFrustumRay(ox, oy, oz, desiredPos.x, desiredPos.y, desiredPos.z, 0.22);
  const hardT = castCamRaySingle(ox, oy, oz, dx, dy, dz, 0.06, 1.0);
  const hitDist = desiredDist * minT;
  const hardMaxDist = desiredDist * hardT;

  if (bypassSmoothing) {
    smoothedCamDist = hitDist;
  } else if (hitDist <= smoothedCamDist) {
    // Clamp strictly inside physical wall surface (hardMaxDist) while smoothing across sudden jamb/corner edges
    const clampedCap = Math.min(smoothedCamDist, hardMaxDist);
    smoothedCamDist = Math.max(
      hitDist,
      clampedCap - Math.max(0.03, (clampedCap - hitDist) * Math.min(1, delta * 24.0)),
    );
  } else {
    smoothedCamDist = Math.min(
      hitDist,
      smoothedCamDist + Math.max(0.03, (hitDist - smoothedCamDist) * Math.min(1, delta * 14.0)),
    );
  }

  const finalT = Math.min(hardT, smoothedCamDist / desiredDist);
  camTargetPos.set(ox + dx * finalT, oy + dy * finalT, oz + dz * finalT);

  // Gradual lateral wall cushion (up to 0.28m < PLAYER_RADIUS 0.34m) with no binary 0.42m pop
  const currentArmDist = desiredDist * finalT;
  const clearRadius = THREE.MathUtils.clamp((currentArmDist - 0.22) / 0.40, 0.15, 1.0) * 0.28;
  resolveCamXZClearance(camTargetPos, clearRadius, oy, pivot);

  // Prevent camera from dipping below staircase flights or sloped ramps
  camGroundProbePos.set(camTargetPos.x, footY + EYE_HEIGHT - 0.6, camTargetPos.z);
  const groundAtCam = computeGroundHeight(camGroundProbePos);
  if (groundAtCam > -10 && camTargetPos.y < groundAtCam + 0.24 && Math.abs(groundAtCam - footY) < 2.2) {
    camTargetPos.y = groundAtCam + 0.24;
  }

  // Continuous spring distance right up to the head/wall (zero 0.44m -> 0.0m teleport jump!)
  const usedDist = camTargetPos.distanceTo(pivot);
  if (usedDist < 0.25) camHideMeshState = true;
  else if (usedDist > 0.31) camHideMeshState = false;

  const hidePlayerMesh = allowEyeFallback && camHideMeshState;
  isThirdPersonEyeFallback = hidePlayerMesh;

  const finalWallClear = minWallClearDist(camTargetPos, camTargetPos.y);
  syncCameraNear((hidePlayerMesh || finalWallClear < 0.40) ? 0.045 : baseCamNear);

  return { camPos: camTargetPos, hidePlayerMesh };
}
const sittingState = {
  active: false,
  seat: null,
  prevCameraMode: null,
};

function buildStudioEnvironment() {
  const group = new THREE.Group();
  group.name = 'CharacterStudioStage';
  scene.add(group);

  // Sleek circular studio turntable platform
  const platformMat = new THREE.MeshLambertMaterial({ color: 0x232e2a });
  const rimMat = new THREE.MeshBasicMaterial({ color: 0xd9ed9c });
  const innerMat = new THREE.MeshLambertMaterial({ color: 0x2c3934 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.08, 40), platformMat);
  base.position.set(0, -0.04, 0);
  group.add(base);

  const topDisc = new THREE.Mesh(new THREE.CylinderGeometry(1.06, 1.06, 0.015, 40), innerMat);
  topDisc.position.set(0, 0.002, 0);
  group.add(topDisc);

  const ring = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.08, 48), rimMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, 0.011, 0);
  group.add(ring);

  return group;
}

function setMode(studioMode) {
  inStudio = studioMode;
  if (inStudio) {
    liftKeypadOpen = false;
    liftKeypad?.classList.add('hidden');
    khulnaMapUI?.closeMap?.();
    if (controls.isLocked) controls.unlock();
    started = false;
    scene.background.setHex(0x18211e);
    scene.fog.near = 200;
    scene.fog.far = 300;
    camera.fov = 39;
    camera.updateProjectionMatrix();

    const drivingCar = getDrivingCar();
    if (drivingCar) {
      drivingCar.exitCar(playerPos);
      carHud?.classList.add('hidden');
      emoteBar?.classList.remove('hidden');
    }
    if (house?.group) house.group.visible = false;
    if (environment?.group) environment.group.visible = false;
    for (const c of cars) {
      if (c?.group) c.group.visible = false;
    }
    if (studioGroup) studioGroup.visible = true;

    studioPanel?.classList.remove('hidden');
    intro?.classList.add('hidden');
    pause?.classList.add('hidden');
    walkHud?.classList.add('hidden');
    timeToggleButton?.classList.add('hidden');
    mapHudButton?.classList.add('hidden');
    cameraToggleButton?.classList.add('hidden');
    gateToggleButton?.classList.add('hidden');
    runToggleButton?.classList.add('hidden');
    liftHudButton?.classList.add('hidden');
    carToggleButton?.classList.add('hidden');
    hudToggleButton?.classList.add('hidden');
    document.body.classList.remove('hud-hidden');
    if (skySystem?.skyDome) skySystem.skyDome.visible = false;
    scene.environment = null;
    if (brandTitle) brandTitle.textContent = 'CHARACTER STUDIO';
    if (brandSubtitle) brandSubtitle.textContent = 'FULL HUMAN 3D MODEL · DRAG TO ROTATE 360°';
    if (studioToggleButton) studioToggleButton.innerHTML = 'PLAY STREET GAME <span>→</span>';
    applyQuality(quality);
  } else {
    scene.background.setHex(0xdccbb6);
    camera.fov = 60;
    camera.updateProjectionMatrix();

    if (house?.group) house.group.visible = true;
    if (environment?.group) environment.group.visible = true;
    for (const c of cars) {
      if (c?.group) c.group.visible = true;
    }
    if (skySystem?.skyDome) skySystem.skyDome.visible = true;
    if (studioGroup) studioGroup.visible = false;

    studioPanel?.classList.add('hidden');
    timeToggleButton?.classList.remove('hidden');
    mapHudButton?.classList.remove('hidden');
    cameraToggleButton?.classList.remove('hidden');
    gateToggleButton?.classList.remove('hidden');
    runToggleButton?.classList.remove('hidden');
    liftHudButton?.classList.remove('hidden');
    carToggleButton?.classList.remove('hidden');
    hudToggleButton?.classList.remove('hidden');
    if (brandTitle) brandTitle.textContent = 'TALTOLA';
    if (brandSubtitle) brandSubtitle.textContent = 'KHULNA · BANGLADESH';
    if (studioToggleButton) studioToggleButton.innerHTML = 'CHARACTER STUDIO <span>★</span>';

    applyQuality(quality);
    camHideMeshState = false;
    isThirdPersonEyeFallback = false;
    smoothedCamDist = 1.95;
    beginWalking();
  }
}

function setUltraFastPerf(enabled) {
  ultraFastMode = enabled;
  if (!enabled) lowFpsStreak = 0;
  if (inStudio) return;
  const dpr = window.devicePixelRatio || 1;
  const isLow = quality === 'low';
  if (enabled && isLow) {
    // Keep crisp readable resolution (>= 0.85) & shadowless sun so Sabit's face never looks blurry!
    renderer.setPixelRatio(Math.min(dpr, 0.85));
    renderer.setSize(window.innerWidth, window.innerHeight);
    scene.fog.near = 135;
    scene.fog.far = 310;
    camera.far = 360;
    camera.updateProjectionMatrix();
    if (sun) {
      sun.visible = true;
      sun.castShadow = false;
    }
    if (hemisphereLight) hemisphereLight.intensity = 1.25;
    document.body.classList.add('low-perf-ui');
  }
}

function updateSunShadowTarget(focusPos) {
  if (!sun || inStudio) return;
  const radius = quality === 'ultra' ? 44 : (quality === 'high' ? 38 : 28);
  const mapSize = sun.shadow.mapSize.x || 2048;
  const worldUnitsPerTexel = (radius * 2) / mapSize;

  // Texel-snap shadow frustum center to eliminate shadow edge shimmer while walking or driving!
  const snapX = Math.round(focusPos.x / worldUnitsPerTexel) * worldUnitsPerTexel;
  const snapZ = Math.round(focusPos.z / worldUnitsPerTexel) * worldUnitsPerTexel;

  lastSunAnchorX = snapX;
  lastSunAnchorZ = snapZ;
  updateSunPositionFromAnchor(snapX, snapZ);
  sun.target.updateMatrixWorld();
}

function applyQuality(nextQuality) {
  quality = nextQuality;
  if (quality !== 'low') {
    ultraFastMode = false;
    lowFpsStreak = 0;
  }
  try {
    localStorage.setItem('taltola_quality', quality);
  } catch {}
  const dpr = window.devicePixelRatio || 1;
  const isLow = quality === 'low';
  const isUltra = quality === 'ultra';
  const isHigh = quality === 'high';
  // Crisp native pixel ratio even on Low (0.95) for sharp character faces, up to 2.0x on Ultra 4K!
  const ratios = {
    low: Math.min(dpr, ultraFastMode ? 0.85 : 0.95),
    medium: Math.min(dpr, 1.1),
    high: Math.min(Math.max(dpr, 1.25), 1.5),
    ultra: Math.min(Math.max(dpr * 1.4, 1.75), 2.0),
  };
  const shadowSizes = { low: 512, medium: 1024, high: 2048, ultra: 4096 };
  const useShadows = !isLow;
  const activeRatio = ratios[quality] ?? ratios.high;

  renderer.setPixelRatio(activeRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMappingExposure = isUltra ? 1.12 : (isHigh ? 1.08 : 1.04);
  if (composer) {
    composer.setPixelRatio(activeRatio);
    composer.setSize(window.innerWidth, window.innerHeight);
    bloomPass?.setSize?.(
      Math.max(256, Math.floor(window.innerWidth * 0.5)),
      Math.max(144, Math.floor(window.innerHeight * 0.5))
    );
  }
  renderer.shadowMap.enabled = useShadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Real-time dynamic shadow map updates so buildings, cars, doors & character always cast live shadows!
  renderer.shadowMap.autoUpdate = useShadows;
  if (useShadows) renderer.shadowMap.needsUpdate = true;

  document.body.classList.toggle('low-perf-ui', isLow);

  if (!inStudio) {
    scene.fog.near = ultraFastMode ? 135 : (isLow ? 150 : (quality === 'medium' ? 175 : (isUltra ? 240 : 195)));
    scene.fog.far = ultraFastMode ? 310 : (isLow ? 340 : (quality === 'medium' ? 440 : (isUltra ? 760 : 560)));
    camera.far = ultraFastMode ? 360 : (isLow ? 390 : (quality === 'medium' ? 500 : (isUltra ? 880 : 640)));
    camera.updateProjectionMatrix();
    environment?.setFogBounds?.(scene.fog.near, scene.fog.far);
  }

  // Keep clean shadowless sun + soft fill light even on Low so Sabit's face stays sharp, well-lit & vibrant
  const useExtraLights = !isLow || inStudio;
  if (studioKeyLight) studioKeyLight.visible = useExtraLights;
  if (fillDirLight) {
    fillDirLight.visible = true;
    fillDirLight.intensity = isLow && !inStudio ? 0.34 : (isUltra ? 0.72 : 0.55);
  }
  if (ambientLight) {
    ambientLight.visible = true;
    ambientLight.intensity = isLow && !inStudio ? 0.42 : (isUltra ? 0.45 : 0.38);
  }
  if (hemisphereLight) {
    hemisphereLight.visible = true;
    hemisphereLight.intensity = ultraFastMode && !inStudio ? 1.75 : (isLow && !inStudio ? 1.38 : (isUltra ? 0.92 : 0.86));
    hemisphereLight.color.setHex(isLow && !inStudio ? 0xf6f2ea : 0xbad9f7);
    hemisphereLight.groundColor.setHex(isLow && !inStudio ? 0x8e806e : 0x625645);
  }
  if (sun) {
    sun.visible = !ultraFastMode || inStudio;
    sun.intensity = isUltra ? 2.25 : (isHigh ? 2.05 : (isLow ? 1.35 : 1.75));
    sun.castShadow = useShadows;
    if (useShadows) {
      const size = shadowSizes[quality] || 2048;
      const radius = isUltra ? 44 : (isHigh ? 38 : 28);
      sun.shadow.camera.left = -radius;
      sun.shadow.camera.right = radius;
      sun.shadow.camera.top = radius;
      sun.shadow.camera.bottom = -radius;
      sun.shadow.camera.near = 2;
      sun.shadow.camera.far = 135;
      sun.shadow.camera.updateProjectionMatrix();

      if (sun.shadow.mapSize.x !== size || sun.shadow.mapSize.y !== size) {
        sun.shadow.mapSize.set(size, size);
        if (sun.shadow.map) {
          sun.shadow.map.dispose();
          sun.shadow.map = null;
        }
      }
      sun.shadow.bias = -0.0005;
      sun.shadow.normalBias = 0.035;
      renderer.shadowMap.needsUpdate = true;
    }
  }

  sceneMaterials?.setQualityMode?.(quality);
  environment?.setQualityMode?.(quality);
  environment?.tower?.setQualityMode?.(quality);
  environment?.city?.refreshActiveChunks?.(playerPos.x, playerPos.z, quality);
  playerCharacter?.setQualityMode?.(quality);
  for (const c of cars) {
    c?.setQualityMode?.(quality);
  }
  if (environment?.farGroup) environment.farGroup.visible = !isLow;
  if (!inStudio && skySystem) {
    if (skySystem.skyDome) skySystem.skyDome.visible = true;
    applyTimeOfDay(timeOfDayId);
  }

  for (const input of qualityInputs) {
    if (input) input.value = quality;
  }
}

for (const input of qualityInputs) {
  input?.addEventListener('change', () => {
    try {
      localStorage.setItem('taltola_quality_manual', '1');
    } catch {}
    applyQuality(input.value);
  });
}

function setupLighting() {
  ambientLight = new THREE.AmbientLight(0xf6f0e4, 0.58);
  scene.add(ambientLight);

  hemisphereLight = new THREE.HemisphereLight(0xd9ecfa, 0x6b6052, 0.74);
  scene.add(hemisphereLight);

  sun = new THREE.DirectionalLight(0xfff1d6, 2.05);
  sun.position.set(TALTOLA_HOUSE_OFFSET.x + 26, 42, TALTOLA_HOUSE_OFFSET.z + 20);
  sun.target.position.set(TALTOLA_HOUSE_OFFSET.x, 0, TALTOLA_HOUSE_OFFSET.z);
  sun.castShadow = true;
  sun.shadow.camera.left = -38;
  sun.shadow.camera.right = 38;
  sun.shadow.camera.top = 38;
  sun.shadow.camera.bottom = -38;
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 135;
  scene.add(sun, sun.target);
  lastSunAnchorX = TALTOLA_HOUSE_OFFSET.x;
  lastSunAnchorZ = TALTOLA_HOUSE_OFFSET.z;

  // Dedicated studio key & rim lights so the 3D character's face, hands, fingers & cloth folds have crisp depth
  studioKeyLight = new THREE.DirectionalLight(0xfffaf0, 0.72);
  studioKeyLight.position.set(1.8, 3.2, 4.5);
  scene.add(studioKeyLight);

  fillDirLight = new THREE.DirectionalLight(0xd4e6ee, 0.78);
  fillDirLight.position.set(-8, 6, -6);
  scene.add(fillDirLight);

  // Dynamic warm indoor point light that illuminates room furniture, PBR velvet/wood & ceramic tiles when indoors
  indoorLight = new THREE.PointLight(0xfff3d8, 1.45, 11.5, 1.35);
  indoorLight.visible = false;
  scene.add(indoorLight);

  applyQuality(quality);
}

function syncHUDButtons(activeSprint = false, force = false) {
  if (house && gateToggleButton) {
    const isOpen = Boolean(house.state.gateOpen && house.state.frontDoorOpen);
    if (force || isOpen !== lastHudDoorOpen) {
      lastHudDoorOpen = isOpen;
      gateToggleButton.innerHTML = isOpen ? 'CLOSE DOORS <span>[G]</span>' : 'OPEN DOORS <span>[G]</span>';
    }
  }
  if (playerCharacter && cameraToggleButton) {
    const mode = playerCharacter.state.cameraMode || 'back';
    if (force || mode !== lastHudCameraMode) {
      lastHudCameraMode = mode;
      const labels = {
        back: 'VIEW: BACK <span>[V]</span>',
        front: 'VIEW: FACE <span>[V]</span>',
        first: 'VIEW: 1ST <span>[V]</span>',
      };
      cameraToggleButton.innerHTML = labels[mode] || labels.back;
    }
  }
  const runOn = Boolean(runModeToggle || activeSprint);
  if (force || runOn !== lastHudRunOn) {
    lastHudRunOn = runOn;
    if (runToggleButton) {
      runToggleButton.innerHTML = runOn ? 'RUN: ON <span>[SHIFT/R]</span>' : 'RUN: OFF <span>[SHIFT/R]</span>';
    }
    if (runPillButton) {
      runPillButton.classList.toggle('active', runOn);
      runPillButton.innerHTML = runOn
        ? '<kbd>SHIFT / R</kbd> দৌড়ানো: চালু (Running)'
        : '<kbd>SHIFT / R</kbd> দৌড়ানো (Run)';
    }
  }
}

function toggleRunMode() {
  runModeToggle = !runModeToggle;
  syncHUDButtons(runModeToggle, true);
}

function syncLiftKeypadUI() {
  const tower = environment?.tower;
  if (!tower || !liftKeypad) return;
  const st = tower.state;
  const stops = tower.stops || [];
  const curStop = stops[st.liftFloorIndex] || { code: 'GF', label: 'নিচতলা (Ground Lobby)' };
  const tgtStop = stops[st.liftTargetIndex] || curStop;
  const isMoving = st.liftPhase === 'moving' || st.liftPhase === 'closing';
  const curName = curStop.nameBn || curStop.label || 'নিচতলা';
  const tgtName = tgtStop.nameBn || tgtStop.label || curName;

  if (liftLedArrow) {
    liftLedArrow.textContent = isMoving
      ? (st.liftDirection >= 0 ? '▲' : '▼')
      : (st.liftDoorOpen > 0.6 ? '●' : '■');
  }
  if (liftLedCode) {
    liftLedCode.textContent = curStop.code;
  }
  if (liftLedName) {
    liftLedName.textContent = curName;
  }
  if (liftLedStatus) {
    if (st.liftPhase === 'moving') {
      liftLedStatus.textContent = `লিফট চলছে → গন্তব্য: ${tgtName}`;
    } else if (st.liftPhase === 'opening') {
      liftLedStatus.textContent = 'দরজা খুলছে... (Doors Opening)';
    } else if (st.liftPhase === 'closing') {
      liftLedStatus.textContent = 'দরজা বন্ধ হচ্ছে... (Doors Closing)';
    } else if (st.liftDoorOpen >= 0.85) {
      liftLedStatus.textContent = 'দরজা খোলা · ফ্লোর নাম্বার ক্লিক করুন';
    } else {
      liftLedStatus.textContent = 'প্রস্তুত · ফ্লোর নাম্বার ক্লিক করুন';
    }
  }

  for (const btn of liftFloorButtons) {
    const fIdx = Number(btn.dataset.liftFloor);
    const isCurrent = fIdx === st.liftFloorIndex && !isMoving;
    const isTarget = fIdx === st.liftTargetIndex && isMoving;
    btn.classList.toggle('current-floor', isCurrent);
    btn.classList.toggle('active-target', isTarget);
  }
}

function openLiftKeypad() {
  if (inStudio) return;
  liftKeypadOpen = true;
  liftKeypad?.classList.remove('hidden');
  pause?.classList.add('hidden');
  walkHud?.classList.remove('hidden');
  if (controls.isLocked) {
    controls.unlock();
  }
  syncLiftKeypadUI();
}

function closeLiftKeypad(relock = true) {
  liftKeypadOpen = false;
  liftKeypad?.classList.add('hidden');
  if (relock && started && !inStudio && !referenceModal?.open) {
    pause?.classList.add('hidden');
    walkHud?.classList.remove('hidden');
    controls.lock();
  }
}

function selectLiftFloor(floorIndex) {
  const tower = environment?.tower;
  if (!tower) return false;
  const stops = tower.stops || [];
  const idx = THREE.MathUtils.clamp(Math.round(floorIndex), 0, stops.length - 1);

  // If the player is standing in Sk Arshan Tower or near the lift lobby, step them smoothly inside the 3D cabin so they ride with it!
  const insideTower = playerPos.x <= -2.8 && playerPos.x >= -19.9 && playerPos.z >= 14.25 && playerPos.z <= 28.6;
  if (insideTower && !tower.isInsideLift(playerPos)) {
    if (sittingState.active) standUpFromSeat();
    const footY = playerPos.y - EYE_HEIGHT;
    const nearK = tower.nearestFloorIndex(footY);
    if (tower.state.liftPhase !== 'moving' && tower.state.liftFloorIndex !== nearK) {
      tower.state.liftFloorIndex = nearK;
      tower.state.liftY = stops[nearK].y;
    }
    playerPos.set(-12.38, tower.state.liftY + EYE_HEIGHT, 19.55);
    horizontalVelocity.set(0, 0);
    verticalVelocity = 0;
    grounded = true;
    controls.euler.set(-0.04, -Math.PI / 2, 0, 'YXZ');
    camera.quaternion.setFromEuler(controls.euler);
  }

  tower.goToFloor(idx);
  syncLiftKeypadUI();
  return true;
}

function standUpFromSeat() {
  if (!sittingState.active) return false;
  const seat = sittingState.seat;
  sittingState.active = false;
  sittingState.seat = null;
  if (playerCharacter) {
    playerCharacter.state.emote = null;
    if (sittingState.prevCameraMode) {
      playerCharacter.state.cameraMode = sittingState.prevCameraMode;
      sittingState.prevCameraMode = null;
    }
  }
  if (seat) {
    // Step slightly forward from the seat when standing up so the player is clear
    const stepDist = 0.42;
    playerPos.x = seat.seatX + Math.sin(seat.yaw) * stepDist;
    playerPos.z = seat.seatZ + Math.cos(seat.yaw) * stepDist;
    playerPos.y = seat.fy + EYE_HEIGHT;
  }
  syncEmoteUI(null);
  syncHUDButtons(false, true);
  return true;
}

function sitOnSeat(seat) {
  if (!seat) return false;
  sittingState.active = true;
  sittingState.seat = seat;
  horizontalVelocity.set(0, 0);
  verticalVelocity = 0;
  grounded = true;
  playerPos.x = seat.seatX;
  playerPos.z = seat.seatZ;
  playerPos.y = seat.fy + seat.seatY + EYE_HEIGHT - 0.42;
  // Orient camera yaw to face out from the seat (+Y rotation in Three.js looks along -Z when euler.y=0, so euler.y = seat.yaw + Math.PI)
  controls.euler.set(-0.06, seat.yaw + Math.PI, 0, 'YXZ');
  camera.quaternion.setFromEuler(controls.euler);
  if (playerCharacter) {
    if (playerCharacter.state.cameraMode === 'first') {
      sittingState.prevCameraMode = 'first';
      playerCharacter.state.cameraMode = 'back';
    }
    playerCharacter.state.emote = 'sit';
    playerCharacter.state.emoteClock = 0;
    playerCharacter.state.facingYaw = seat.yaw;
  }
  syncHUDButtons(false, true);
  return true;
}

function probeWallAhead() {
  if (!started || inStudio || sittingState.active || climbState.active) return false;
  controls.getHorizontalVectors(forwardVec, rightVec);
  const stepDist = 0.64;
  // 1) Must be blocked horizontally right ahead at current height
  wallProbePos.set(
    playerPos.x + forwardVec.x * stepDist,
    playerPos.y,
    playerPos.z + forwardVec.z * stepDist,
  );
  const bx1 = wallProbePos.x;
  const bz1 = wallProbePos.z;
  applyWorldCollisions(wallProbePos);
  const blockedLow = Math.hypot(wallProbePos.x - bx1, wallProbePos.z - bz1) > 0.08;
  if (!blockedLow) return false;

  // 2) Must be OPEN AIR at +2.35m above (only low compound walls/railings are climbable — NEVER tall house/tower walls!)
  const mantleDist = 0.96;
  wallProbePos.set(
    playerPos.x + forwardVec.x * mantleDist,
    playerPos.y + 2.35,
    playerPos.z + forwardVec.z * mantleDist,
  );
  const bx2 = wallProbePos.x;
  const bz2 = wallProbePos.z;
  applyWorldCollisions(wallProbePos);
  const blockedHigh = Math.hypot(wallProbePos.x - bx2, wallProbePos.z - bz2) > 0.06;
  return !blockedHigh;
}

function startWallClimb() {
  if (inStudio || !started || sittingState.active || climbState.active || diveState.active) return false;
  // Refuse climb if facing a tall solid house/tower wall so player can NEVER clip inside upper rooms!
  if (!probeWallAhead()) return false;
  controls.getHorizontalVectors(forwardVec, rightVec);
  const climbYaw = Math.atan2(forwardVec.x, forwardVec.z);
  climbState.active = true;
  climbState.timer = 0;
  climbState.duration = 1.05;
  climbState.startX = playerPos.x;
  climbState.startY = playerPos.y;
  climbState.startZ = playerPos.z;
  climbState.targetX = playerPos.x + forwardVec.x * 0.92;
  climbState.targetY = playerPos.y + 2.32;
  climbState.targetZ = playerPos.z + forwardVec.z * 0.92;
  climbState.yaw = climbYaw;
  grounded = false;
  inWater = false;
  isFlipping = false;
  landRecoveryTimer = 0;
  landRecoveryClip = null;
  verticalVelocity = 0;
  horizontalVelocity.set(0, 0);
  if (playerCharacter) {
    playerCharacter.state.emote = null;
    playerCharacter.state.facingYaw = climbYaw;
  }
  syncEmoteUI(null);
  return true;
}

function startParkourDive() {
  if (inStudio || !started || sittingState.active || climbState.active || diveState.active) return false;
  controls.getHorizontalVectors(forwardVec, rightVec);
  const diveYaw = Math.atan2(forwardVec.x, forwardVec.z);
  diveState.active = true;
  diveState.timer = 0;
  diveState.duration = 0.90;
  diveState.dirX = forwardVec.x;
  diveState.dirZ = forwardVec.z;
  landRecoveryTimer = 0;
  landRecoveryClip = null;
  if (playerCharacter) {
    playerCharacter.state.emote = null;
    playerCharacter.state.facingYaw = diveYaw;
  }
  syncEmoteUI(null);
  return true;
}

function toggleHudVisibility(forceHidden = null) {
  if (inStudio) return;
  const nextHidden = forceHidden !== null ? Boolean(forceHidden) : !document.body.classList.contains('hud-hidden');
  document.body.classList.toggle('hud-hidden', nextHidden);
  if (hudToggleButton) {
    hudToggleButton.innerHTML = nextHidden ? 'SHOW UI <span>[TAB]</span>' : 'HIDE UI <span>[TAB]</span>';
  }
}

function syncCarHUD() {
  if (!cars.length) return;
  const activeCar = getDrivingCar();
  const driving = Boolean(activeCar);
  if (carToggleButton) {
    carToggleButton.innerHTML = driving
      ? (activeCar.state.isRickshaw ? 'EXIT RICKSHAW <span>[T]</span>' : 'EXIT CAR <span>[T]</span>')
      : 'DRIVE CAR <span>[T]</span>';
  }
  carHud?.classList.toggle('hidden', !driving);
  emoteBar?.classList.toggle('hidden', driving);
  if (driving && activeCar) {
    const isRick = Boolean(activeCar.state.isRickshaw);
    const isPass = isRick && activeCar.state.rideSeat === 'passenger';
    if (carBadgeEl) {
      carBadgeEl.textContent = isRick
        ? (isPass ? 'RICKSHAW · প্যাসেঞ্জার সিট' : 'RICKSHAW · প্যাডেল ড্রাইভ')
        : activeCar.state.badge;
    }
    if (carSeatBtn) carSeatBtn.classList.toggle('hidden', !isRick);
    if (carSeatLabelEl && isRick) {
      carSeatLabelEl.textContent = isPass ? 'ড্রাইভার সিট' : 'প্যাসেঞ্জার সিট';
    }
    if (carSpeedEl) carSpeedEl.textContent = String(Math.round(Math.abs(activeCar.state.speed) * 3.6));
    if (carGearEl) carGearEl.textContent = isRick ? (isPass ? 'P' : 'D') : String(activeCar.state.gear);
    if (carRpmFill) {
      const pct = THREE.MathUtils.clamp(((activeCar.state.rpm - 900) / 6900) * 100, 8, 100);
      carRpmFill.style.width = `${pct.toFixed(1)}%`;
    }
    if (carPaintNameEl) {
      carPaintNameEl.textContent = activeCar.state.paintName.split(' ').pop();
    }
  }
}

const vehicleTransition = {
  active: false,
  type: null, // 'rickshaw_mount_driver' | 'rickshaw_dismount_driver' | 'rickshaw_mount_passenger' | 'rickshaw_dismount_passenger' | 'car_enter' | 'car_exit'
  car: null,
  seatMode: 'driver',
  elapsed: 0,
  duration: 0.75,
  doorOpenedCue: false,
  doorClosedCue: false,
  beltCue: false,
  startPos: new THREE.Vector3(),
  endPos: new THREE.Vector3(),
  handTarget: new THREE.Vector3(),
};

function startVehicleTransition(type, car, seatMode = 'driver') {
  const st = car.state;
  const sinH = Math.sin(st.heading);
  const cosH = Math.cos(st.heading);
  const rx = cosH;
  const rz = -sinH;

  vehicleTransition.active = true;
  vehicleTransition.type = type;
  vehicleTransition.car = car;
  vehicleTransition.seatMode = seatMode;
  vehicleTransition.elapsed = 0;
  vehicleTransition.doorOpenedCue = false;
  vehicleTransition.doorClosedCue = false;
  vehicleTransition.beltCue = false;

  if (type === 'rickshaw_mount_driver') {
    vehicleTransition.duration = 0.78;
    vehicleTransition.startPos.set(st.pos.x + rx * 0.78 - sinH * 0.05, st.pos.y + EYE_HEIGHT, st.pos.z + rz * 0.78 - cosH * 0.05);
    vehicleTransition.endPos.set(st.pos.x - sinH * 0.05, st.pos.y + 0.16 + EYE_HEIGHT, st.pos.z - cosH * 0.05);
  } else if (type === 'rickshaw_dismount_driver') {
    vehicleTransition.duration = 0.68;
    vehicleTransition.startPos.set(st.pos.x - sinH * 0.05, st.pos.y + 0.16 + EYE_HEIGHT, st.pos.z - cosH * 0.05);
    vehicleTransition.endPos.set(st.pos.x + rx * 0.92 - sinH * 0.05, st.pos.y + EYE_HEIGHT, st.pos.z + rz * 0.92 - cosH * 0.05);
  } else if (type === 'rickshaw_mount_passenger') {
    vehicleTransition.duration = 0.68;
    vehicleTransition.startPos.set(st.pos.x + rx * 0.95 - sinH * 0.62, st.pos.y + EYE_HEIGHT, st.pos.z + rz * 0.95 - cosH * 0.62);
    vehicleTransition.endPos.set(st.pos.x - sinH * 0.62, st.pos.y + 0.34 + EYE_HEIGHT, st.pos.z - cosH * 0.62);
  } else if (type === 'rickshaw_dismount_passenger') {
    vehicleTransition.duration = 0.62;
    vehicleTransition.startPos.set(st.pos.x - sinH * 0.62, st.pos.y + 0.34 + EYE_HEIGHT, st.pos.z - cosH * 0.62);
    vehicleTransition.endPos.set(st.pos.x + rx * 1.05 - sinH * 0.62, st.pos.y + EYE_HEIGHT, st.pos.z + rz * 1.05 - cosH * 0.62);
  } else if (type === 'car_enter') {
    vehicleTransition.duration = 1.85;
    vehicleTransition.startPos.set(st.pos.x + rx * 1.38 + sinH * 0.10, st.pos.y + EYE_HEIGHT, st.pos.z + rz * 1.38 + cosH * 0.10);
    vehicleTransition.endPos.set(st.pos.x + rx * 0.36 + sinH * 0.10, st.pos.y - 0.18 + EYE_HEIGHT, st.pos.z + rz * 0.36 + cosH * 0.10);
  } else if (type === 'car_exit') {
    vehicleTransition.duration = 1.15;
    vehicleTransition.startPos.set(st.pos.x + rx * 0.36 + sinH * 0.10, st.pos.y - 0.18 + EYE_HEIGHT, st.pos.z + rz * 0.36 + cosH * 0.10);
    vehicleTransition.endPos.set(st.pos.x + rx * 1.48 + sinH * 0.10, st.pos.y + EYE_HEIGHT, st.pos.z + rz * 1.48 + cosH * 0.10);
  }
}

function updateVehicleTransition(delta) {
  if (!vehicleTransition.active || !vehicleTransition.car) return false;
  const vt = vehicleTransition;
  const car = vt.car;
  const st = car.state;
  vt.elapsed += Math.min(delta, 0.05);
  const p = THREE.MathUtils.clamp(vt.elapsed / vt.duration, 0, 1);
  const ease = p * p * (3 - 2 * p);
  const sinH = Math.sin(st.heading);
  const cosH = Math.cos(st.heading);
  const rx = cosH;
  const rz = -sinH;

  let clip = 'Idle';
  let timeScale = 0.4;
  let phase = '';
  let phaseProgress = 0;
  let facingYaw = st.heading;
  let hideMesh = false;

  if (vt.type === 'rickshaw_mount_driver' || vt.type === 'rickshaw_dismount_driver') {
    playerPos.lerpVectors(vt.startPos, vt.endPos, ease);
    clip = 'Idle';
    timeScale = 0.0;
    facingYaw = st.heading;
  } else if (vt.type === 'rickshaw_mount_passenger' || vt.type === 'rickshaw_dismount_passenger') {
    // Crisp parabolic hop up into the floral passenger seat (or hop down onto the road!)
    playerPos.lerpVectors(vt.startPos, vt.endPos, ease);
    const hopArc = Math.sin(p * Math.PI) * 0.52;
    playerPos.y += hopArc;
    clip = p < 0.78 ? 'Jump' : (vt.type === 'rickshaw_mount_passenger' ? 'Sit' : 'Idle');
    timeScale = p < 0.78 ? 1.15 : 0.6;
    facingYaw = vt.type === 'rickshaw_mount_passenger'
      ? THREE.MathUtils.lerp(st.heading - Math.PI * 0.5, st.heading, ease)
      : THREE.MathUtils.lerp(st.heading, st.heading + Math.PI * 0.5, ease);
  } else if (vt.type === 'car_enter') {
    // 4-Stage realistic Car Entry: 1) Open Door -> 2) Sit Inside -> 3) Close Door -> 4) Buckle Seatbelt
    vt.handTarget.set(st.pos.x + rx * 0.92 - sinH * 0.15, st.pos.y + 0.92, st.pos.z + rz * 0.92 - cosH * 0.15);
    if (p < 0.24) {
      phase = 'open_door';
      phaseProgress = p / 0.24;
      if (!vt.doorOpenedCue) { vt.doorOpenedCue = true; car.playDoorSound?.(false); }
      car.setDriverDoorOpen?.(phaseProgress);
      playerPos.copy(vt.startPos);
      facingYaw = st.heading - Math.PI * 0.5;
      clip = 'Idle';
      timeScale = 0.2;
      if (interactPrompt) { interactPrompt.textContent = 'দরজা খোলা হচ্ছে... (Opening Door)'; interactPrompt.classList.remove('hidden'); }
    } else if (p < 0.57) {
      phase = 'sit_in';
      phaseProgress = (p - 0.24) / 0.33;
      const sEase = phaseProgress * phaseProgress * (3 - 2 * phaseProgress);
      car.setDriverDoorOpen?.(1.0);
      playerPos.lerpVectors(vt.startPos, vt.endPos, sEase);
      facingYaw = THREE.MathUtils.lerp(st.heading - Math.PI * 0.5, st.heading, sEase);
      clip = phaseProgress > 0.45 ? 'Sit' : 'Walk';
      timeScale = 0.85;
      if (interactPrompt) { interactPrompt.textContent = 'ভিতরে বসা হচ্ছে... (Getting In)'; interactPrompt.classList.remove('hidden'); }
    } else if (p < 0.78) {
      phase = 'close_door';
      phaseProgress = (p - 0.57) / 0.21;
      car.setDriverDoorOpen?.(1.0 - phaseProgress);
      if (phaseProgress > 0.82 && !vt.doorClosedCue) { vt.doorClosedCue = true; car.playDoorSound?.(true); }
      playerPos.copy(vt.endPos);
      facingYaw = st.heading;
      clip = 'Sit';
      timeScale = 0.3;
      if (interactPrompt) { interactPrompt.textContent = 'দরজা লাগানো হচ্ছে... (Closing Door)'; interactPrompt.classList.remove('hidden'); }
    } else {
      phase = 'seatbelt';
      phaseProgress = (p - 0.78) / 0.22;
      car.setDriverDoorOpen?.(0.0);
      if (phaseProgress > 0.65 && !vt.beltCue) { vt.beltCue = true; car.playSeatbeltSound?.(); }
      playerPos.copy(vt.endPos);
      facingYaw = st.heading;
      clip = 'Sit';
      timeScale = 0.15;
      if (interactPrompt) { interactPrompt.textContent = 'সিটবেল্ট বাঁধা হচ্ছে... (Buckling Seatbelt ✓)'; interactPrompt.classList.remove('hidden'); }
    }
  } else if (vt.type === 'car_exit') {
    vt.handTarget.set(st.pos.x + rx * 0.92 - sinH * 0.15, st.pos.y + 0.92, st.pos.z + rz * 0.92 - cosH * 0.15);
    if (p < 0.22) {
      phase = 'seatbelt';
      phaseProgress = 1.0 - p / 0.22;
      if (!vt.beltCue) { vt.beltCue = true; car.playSeatbeltSound?.(); }
      playerPos.copy(vt.startPos);
      facingYaw = st.heading;
      clip = 'Sit';
    } else if (p < 0.48) {
      phase = 'open_door';
      phaseProgress = (p - 0.22) / 0.26;
      if (!vt.doorOpenedCue) { vt.doorOpenedCue = true; car.playDoorSound?.(false); }
      car.setDriverDoorOpen?.(phaseProgress);
      playerPos.copy(vt.startPos);
      facingYaw = st.heading;
      clip = 'Sit';
    } else if (p < 0.78) {
      phase = 'step_out';
      phaseProgress = (p - 0.48) / 0.30;
      const sEase = phaseProgress * phaseProgress * (3 - 2 * phaseProgress);
      car.setDriverDoorOpen?.(1.0);
      playerPos.lerpVectors(vt.startPos, vt.endPos, sEase);
      facingYaw = THREE.MathUtils.lerp(st.heading, st.heading + Math.PI * 0.5, sEase);
      clip = 'Walk';
    } else {
      phase = 'close_door';
      phaseProgress = (p - 0.78) / 0.22;
      car.setDriverDoorOpen?.(1.0 - phaseProgress);
      if (phaseProgress > 0.82 && !vt.doorClosedCue) { vt.doorClosedCue = true; car.playDoorSound?.(true); }
      playerPos.copy(vt.endPos);
      facingYaw = st.heading - Math.PI * 0.5;
      clip = 'Idle';
    }
  }

  // Smooth cinematic camera framing the mount/dismount/door-open/seatbelt animation clearly!
  const camDist = st.isRickshaw ? 3.2 : 4.2;
  const camSide = st.isRickshaw ? 1.85 : 2.35;
  carCamDesired.set(
    st.pos.x + rx * camSide - sinH * (camDist * 0.55),
    st.pos.y + 1.85,
    st.pos.z + rz * camSide - cosH * (camDist * 0.55),
  );
  carCamLookTarget.set(playerPos.x, playerPos.y - 0.45, playerPos.z);
  camera.position.lerp(carCamDesired, Math.min(1, delta * 7.5));
  camera.lookAt(carCamLookTarget);

  if (playerCharacter) {
    playerCharacter.update(delta, {
      position: playerPos,
      yaw: facingYaw + Math.PI,
      speed: 0,
      maxSpeed: 3.45,
      grounded: true,
      isSprinting: false,
      inStudio: false,
      hideMesh,
      vehicleAnim: {
        type: vt.type,
        progress: p,
        phase,
        phaseProgress,
        heading: st.heading,
        facingYaw,
        clip,
        timeScale,
        anchors: st.isRickshaw ? car.getRickshawAnchors?.() : null,
        handTarget: vt.handTarget,
      },
    });
  }

  if (p >= 1.0) {
    const doneType = vt.type;
    const doneSeat = vt.seatMode;
    vt.active = false;
    vt.type = null;
    car.setDriverDoorOpen?.(0);
    if (doneType === 'rickshaw_mount_driver' || doneType === 'rickshaw_mount_passenger' || doneType === 'car_enter') {
      car.enterCar(doneSeat);
      syncCarHUD();
      updateHUDPrompt();
    } else {
      playerPos.copy(vt.endPos);
      controls.euler.set(-0.04, st.heading + Math.PI, 0, 'YXZ');
      camera.quaternion.setFromEuler(controls.euler);
      syncCarHUD();
      updateHUDPrompt();
    }
  }
  return true;
}

function toggleCarDriving(targetCar = null, seatMode = 'driver') {
  if (!cars.length || inStudio || vehicleTransition.active) return;
  const activeCar = getDrivingCar();
  if (activeCar) {
    const wasRick = Boolean(activeCar.state.isRickshaw);
    const wasPass = wasRick && activeCar.state.rideSeat === 'passenger';
    activeCar.exitCar(playerPos);
    syncCarHUD();
    startVehicleTransition(
      wasRick ? (wasPass ? 'rickshaw_dismount_passenger' : 'rickshaw_dismount_driver') : 'car_exit',
      activeCar,
      'driver',
    );
    return;
  }
  const carToEnter = targetCar || findNearestCar(playerPos) || bmwCar;
  if (!carToEnter) return;
  if (sittingState.active) standUpFromSeat();
  if (liftKeypadOpen) closeLiftKeypad(false);
  if (!started) beginWalking();
  const isRick = Boolean(carToEnter.state.isRickshaw);
  startVehicleTransition(
    isRick ? (seatMode === 'passenger' ? 'rickshaw_mount_passenger' : 'rickshaw_mount_driver') : 'car_enter',
    carToEnter,
    seatMode,
  );
}

function handleDoorInteraction(allowClimbFallback = false) {
  if (getDrivingCar()) {
    toggleCarDriving();
    return true;
  }
  if (sittingState.active) {
    standUpFromSeat();
    return true;
  }
  const nearSeat = findNearestSeat(playerPos);
  const nearCar = findNearestEnterableCar(playerPos);
  const hasDoorOrLiftPrompt = Boolean(environment?.tower?.getPrompt(playerPos) || house?.getPrompt(playerPos));
  // Prioritize entering a nearby drivable car or rickshaw when standing right next to it (< 3.2m)
  if (nearCar && (!hasDoorOrLiftPrompt || nearCar.distanceToPlayer(playerPos) < 3.2) && !nearSeat) {
    toggleCarDriving(nearCar, 'driver');
    return true;
  }
  // If near a seat and either no door/lift is active or seat is very close (< 1.25m), sit down!
  if (nearSeat && (!hasDoorOrLiftPrompt || nearSeat.dist < 1.25)) {
    sitOnSeat(nearSeat);
    return true;
  }
  const towerRes = environment?.tower?.interact(playerPos);
  if (towerRes) {
    if (towerRes === 'open_lift_keypad' || environment?.tower?.isInsideLift(playerPos)) {
      openLiftKeypad();
    } else if (environment?.tower?.isNearLiftLobby(playerPos)) {
      openLiftKeypad();
    }
    syncHUDButtons(false, true);
    return true;
  }
  if (house?.getPrompt(playerPos)) {
    house.toggleNearestDoor(playerPos);
    syncHUDButtons(false, true);
    return true;
  }
  if (nearCar) {
    toggleCarDriving(nearCar, 'driver');
    return true;
  }
  if (nearSeat) {
    sitOnSeat(nearSeat);
    return true;
  }
  if (allowClimbFallback) {
    return startWallClimb();
  }
  return false;
}

function toggleCameraView() {
  if (!playerCharacter) return;
  playerCharacter.cycleCameraMode();
  camHideMeshState = false;
  isThirdPersonEyeFallback = false;
  smoothedCamDist = playerCharacter.state.cameraMode === 'front' ? 1.15 : 1.95;
  syncHUDButtons(false, true);
}

async function initialize() {
  const manager = new THREE.LoadingManager();
  manager.onProgress = (url, loaded, total) => {
    loadingBar.style.width = `${Math.max(4, (loaded / total) * 100)}%`;
    loadingStatus.textContent = `${loaded} / ${total} assets loaded`;
  };
  manager.onError = (url) => {
    loadingStatus.textContent = `Could not load ${url}`;
  };
  const allLoaded = new Promise((resolve) => { manager.onLoad = resolve; });

  const materials = createMaterials(renderer, manager);
  sceneMaterials = materials;
  skySystem = createAtmosphericSkyAndPMREM(scene, renderer);
  setupPostProcessing();
  setupLighting();
  studioGroup = buildStudioEnvironment();
  house = buildHouse(scene, materials);
  environment = buildEnvironment(scene, materials, renderer, skySystem);
  // Keep reference to environment group so we can hide/show it cleanly
  environment.group = scene.getObjectByName('Lane and tropical surroundings');
  playerCharacter = createPlayerCharacter(scene, manager);
  khulnaMapUI = createKhulnaMapUI({
    onWarpToLandmark: (lm) => warpToLandmark(lm),
    onOpenChange: (isOpen) => {
      if (isOpen) {
        if (controls.isLocked) controls.unlock();
        pause?.classList.add('hidden');
      } else {
        pause?.classList.add('hidden');
        if (started && !inStudio) {
          walkHud?.classList.remove('hidden');
        }
      }
    },
  });
  cars = createDrivableCarFleet(scene, manager);
  bmwCar = cars[0];

  await allLoaded;

  const params = new URLSearchParams(window.location.search);
  const qParam = params.get('quality');
  if (qParam && ['low', 'medium', 'high', 'ultra'].includes(qParam)) {
    quality = qParam;
    try {
      localStorage.setItem('taltola_quality', quality);
      localStorage.setItem('taltola_quality_manual', '1');
    } catch {}
  } else {
    try {
      const gl = renderer.getContext();
      const dbgExt = gl.getExtension('WEBGL_debug_renderer_info');
      const glRenderer = dbgExt ? gl.getParameter(dbgExt.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      if (/SwiftShader|llvmpipe|Basic Render|Software|Subzero/i.test(String(glRenderer || ''))
        && !localStorage.getItem('taltola_quality_manual')) {
        quality = 'low';
        ultraFastMode = true;
      }
    } catch {}
  }

  const tParam = params.get('time');
  if (tParam && TIME_OF_DAY_PRESETS[tParam]) {
    timeOfDayId = tParam;
  }

  const spawnParam = params.get('spawn');
  if (spawnParam && spawnSelect) {
    const hasOpt = Array.from(spawnSelect.options).some((o) => o.value === spawnParam);
    if (hasOpt) spawnSelect.value = spawnParam;
  }

  applyQuality(quality);
  // Set default studio camera preset: Full Body view so both the straightened head and freed hands are immediately visible
  setStudioCameraPreset('full');
  const startInStudio = params.get('studio') === '1';
  setMode(startInStudio);
  syncHUDButtons(false, true);

  loadingBar.style.width = '100%';
  loadingStatus.textContent = '3D Human Character Ready.';
  ready = true;
  window.__TALTOLA__ = {
    scene,
    camera,
    renderer,
    composer,
    skySystem,
    controls,
    house,
    environment,
    playerCharacter,
    bmwCar,
    cars,
    getDrivingCar,
    toggleCarDriving,
    playerPos,
    sittingState,
    sitOnSeat,
    standUpFromSeat,
    findNearestSeat,
    startWallClimb,
    startParkourDive,
    climbState,
    diveState,
    openLiftKeypad,
    closeLiftKeypad,
    selectLiftFloor,
    warpToLandmark,
    khulnaMapUI,
    setQuality: applyQuality,
    setTimeOfDay: applyTimeOfDay,
    measureSceneStats() {
      syncSceneVisibility();
      renderer.render(scene, camera);
      const r = renderer.info.render;
      const m = renderer.info.memory;
      return { calls: r.calls, tris: r.triangles, geometries: m.geometries, textures: m.textures };
    },
    setMode,
    ready,
  };
  renderActiveScene();
  loading.classList.add('complete');
  header.classList.remove('hidden');
  setTimeout(() => loading.classList.add('hidden'), 450);
}

function setStudioCameraPreset(preset) {
  studioOrbit.autoSpin = preset === 'spin';
  if (preset === 'face') {
    studioOrbit.targetAngle = 0.0;
    studioOrbit.targetPitch = 0.04;
    studioOrbit.targetDistance = 1.28;
    studioOrbit.targetLookY = 1.54;
  } else if (preset === 'side') {
    studioOrbit.targetAngle = 0.78;
    studioOrbit.targetPitch = 0.05;
    studioOrbit.targetDistance = 2.35;
    studioOrbit.targetLookY = 0.90;
  } else {
    // 'full' or 'spin'
    studioOrbit.targetAngle = 0.0;
    studioOrbit.targetPitch = 0.05;
    studioOrbit.targetDistance = 2.65;
    studioOrbit.targetLookY = 0.86;
  }
}

// Studio UI Button Listeners
document.querySelectorAll('[data-cam]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-cam]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    setStudioCameraPreset(btn.dataset.cam);
  });
});

document.querySelectorAll('[data-anim]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-anim]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    if (playerCharacter) {
      playerCharacter.state.studioAnim = btn.dataset.anim;
      playerCharacter.state.emoteClock = 0;
      if (btn.dataset.anim === 'fight') playerCharacter.triggerAttack();
    }
  });
});

document.querySelectorAll('[data-gaze]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-gaze]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    if (playerCharacter) {
      playerCharacter.state.straightGaze = btn.dataset.gaze === 'straight';
    }
  });
});

const studioTalkBtn = document.querySelector('#studio-talk-btn');
const studioMicBtn = document.querySelector('#studio-mic-btn');
const gameTalkBtn = document.querySelector('#talk-pill-button');

function syncTalkUI() {
  const talking = Boolean(playerCharacter?.state?.talking);
  const mic = Boolean(playerCharacter?.state?.micActive);
  studioTalkBtn?.classList.toggle('active', talking);
  if (studioTalkBtn) studioTalkBtn.textContent = talking ? '🗣️ কথা বলা: চালু (ON)' : '🗣️ কথা বলা (Talk)';
  studioMicBtn?.classList.toggle('active', mic);
  if (studioMicBtn) studioMicBtn.textContent = mic ? '🎙️ মাইক চালু (Listening)' : '🎙️ মাইক লিপ-সিঙ্ক (Mic)';
  gameTalkBtn?.classList.toggle('active', talking || mic);
}

studioTalkBtn?.addEventListener('click', () => {
  if (!playerCharacter) return;
  playerCharacter.toggleTalking();
  syncTalkUI();
});

studioMicBtn?.addEventListener('click', async () => {
  if (!playerCharacter) return;
  const ok = await playerCharacter.toggleMicLipSync();
  if (!ok && !playerCharacter.state.micActive) {
    studioMicBtn.textContent = '🎙️ মাইক পারমিশন দিন';
    setTimeout(syncTalkUI, 2200);
    return;
  }
  syncTalkUI();
});

gameTalkBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!playerCharacter) return;
  playerCharacter.toggleTalking();
  syncTalkUI();
});

// Studio Orbit Drag & Wheel Zoom
canvas.addEventListener('pointerdown', (event) => {
  if (inStudio) {
    studioOrbit.dragging = true;
    studioOrbit.autoSpin = false;
    studioOrbit.lastX = event.clientX;
    studioOrbit.lastY = event.clientY;
    canvas.setPointerCapture?.(event.pointerId);
    return;
  }
  if (liftKeypadOpen) {
    // Clicking the 3D scene while lift keypad is open closes the keypad & locks pointer back to walking
    closeLiftKeypad(true);
    return;
  }
  if (!controls.isLocked) {
    beginWalking();
    return;
  }
  if (event.button === 0 && controls.pointerLocked) {
    const activeCar = getDrivingCar();
    if (activeCar) {
      activeCar.playHorn();
    } else if (sittingState.active || findNearestSeat(playerPos) || findNearestEnterableCar(playerPos) || environment?.tower?.getPrompt(playerPos) || house?.getPrompt(playerPos)) {
      handleDoorInteraction();
    } else {
      playerCharacter?.triggerAttack();
    }
  }
});

window.addEventListener('pointermove', (event) => {
  if (!inStudio || !studioOrbit.dragging) return;
  const dx = event.clientX - studioOrbit.lastX;
  const dy = event.clientY - studioOrbit.lastY;
  studioOrbit.lastX = event.clientX;
  studioOrbit.lastY = event.clientY;
  studioOrbit.targetAngle -= dx * 0.007;
  studioOrbit.targetPitch = THREE.MathUtils.clamp(studioOrbit.targetPitch + dy * 0.005, -0.35, 0.65);
});

window.addEventListener('pointerup', () => {
  studioOrbit.dragging = false;
});

canvas.addEventListener('wheel', (event) => {
  if (!inStudio) return;
  event.preventDefault();
  studioOrbit.targetDistance = THREE.MathUtils.clamp(
    studioOrbit.targetDistance + event.deltaY * 0.0018,
    0.92,
    3.6
  );
  // Automatically shift vertical focus between face (1.54m) and full body (0.86m) as user zooms in/out
  const zoomT = THREE.MathUtils.clamp((studioOrbit.targetDistance - 1.18) / 1.48, 0, 1);
  studioOrbit.targetLookY = THREE.MathUtils.lerp(1.54, 0.86, zoomT);
}, { passive: false });

function syncSceneVisibility() {
  const isLow = quality === 'low';
  const fyNow = playerPos.y - EYE_HEIGHT;
  const distHouseSq = (playerPos.x - TALTOLA_HOUSE_OFFSET.x) ** 2 + (playerPos.z - TALTOLA_HOUSE_OFFSET.z) ** 2;
  const nearTaltolaVis = distHouseSq < 215 * 215;
  const deepInTowerUpper = fyNow >= 3.2 && playerPos.x < -5.8 && playerPos.z > 14.7;
  if (house?.group) {
    const wantHouse = nearTaltolaVis && !deepInTowerUpper;
    if (house.group.visible !== wantHouse) house.group.visible = wantHouse;
  }
  const distHajiSq = playerPos.x * playerPos.x + playerPos.z * playerPos.z;
  const deepInTowerRoom = fyNow >= 3.2 && fyNow < 29.8 && playerPos.x < -7.0 && playerPos.z > 15.0;
  if (environment?.tower?.districtGroup) {
    const wantHajiDistrict = distHajiSq < 215 * 215;
    if (environment.tower.districtGroup.visible !== wantHajiDistrict) {
      environment.tower.districtGroup.visible = wantHajiDistrict;
    }
  }
  if (environment?.detailsGroup) {
    const wantDetails = distHajiSq < 195 * 195 && !deepInTowerRoom;
    if (environment.detailsGroup.visible !== wantDetails) {
      environment.detailsGroup.visible = wantDetails;
    }
  }
  const inTowerUpperSpan = fyNow >= 3.2 && fyNow < 29.8;
  const inEnclosedLobbyX = (isLow || ultraFastMode) ? -9.2 : -11.6;
  const inWindowlessTower = inTowerUpperSpan && (
    (playerPos.x <= inEnclosedLobbyX && playerPos.z >= 18.72 && playerPos.z <= 23.12) ||
    (playerPos.x <= -16.65 && playerPos.z >= 18.72 && playerPos.z <= 21.30) ||
    (ultraFastMode && playerPos.x <= -13.5 && playerPos.z >= 23.45 && playerPos.z <= 28.10)
  );
  if (environment?.tower?.exteriorStaticGroup && environment.tower.exteriorStaticGroup.visible === inWindowlessTower) {
    environment.tower.exteriorStaticGroup.visible = !inWindowlessTower;
  }
  if (environment?.roadBaseGroup) {
    const wantRoadBase = distHajiSq < 195 * 195 && !inWindowlessTower;
    if (environment.roadBaseGroup.visible !== wantRoadBase) {
      environment.roadBaseGroup.visible = wantRoadBase;
    }
  }
  if (environment?.farGroup) {
    const wantFar = !isLow && !inWindowlessTower && distHajiSq < 240 * 240;
    if (environment.farGroup.visible !== wantFar) {
      environment.farGroup.visible = wantFar;
    }
  }
  if (environment?.city) {
    environment.city.setVisible(!inWindowlessTower);
    if (!inWindowlessTower) {
      environment.city.refreshActiveChunks(playerPos.x, playerPos.z, quality);
    }
  }
  environment?.syncVisibility?.(playerPos);
  return { nearTaltolaVis, deepInTowerUpper, isLow };
}

function warpToLandmark(lm, lockControls = false) {
  if (!lm) return;
  const activeCar = getDrivingCar();
  if (activeCar) {
    activeCar.exitCar(playerPos);
    syncCarHUD();
  }
  if (sittingState.active) standUpFromSeat();
  liftKeypadOpen = false;
  liftKeypad?.classList.add('hidden');
  started = true;

  let sx = typeof lm.spawnX === 'number' ? lm.spawnX : (lm.x ?? TALTOLA_HOUSE_OFFSET.x);
  let sz = typeof lm.spawnZ === 'number' ? lm.spawnZ : (lm.z ?? TALTOLA_HOUSE_OFFSET.z);
  let lx = typeof lm.lookX === 'number' ? lm.lookX : sx + 8;
  let lz = typeof lm.lookZ === 'number' ? lm.lookZ : sz;

  if (lm.id === 'taltola_house') {
    sx = TALTOLA_HOUSE_OFFSET.x - 0.2;
    sz = TALTOLA_HOUSE_OFFSET.z + 0.8;
    lx = TALTOLA_HOUSE_OFFSET.x + 5.0;
    lz = TALTOLA_HOUSE_OFFSET.z;
  }

  playerPos.set(sx, EYE_HEIGHT, sz);
  horizontalVelocity.set(0, 0);
  verticalVelocity = 0;
  grounded = true;
  environment?.city?.refreshActiveChunks?.(playerPos.x, playerPos.z, quality);
  const groundY = computeGroundHeight(playerPos);
  playerPos.y = groundY + EYE_HEIGHT;
  syncSceneVisibility();
  if (sun?.castShadow && quality !== 'low') {
    lastSunAnchorX = Math.round(playerPos.x / 4) * 4;
    lastSunAnchorZ = Math.round(playerPos.z / 4) * 4;
    updateSunPositionFromAnchor(lastSunAnchorX, lastSunAnchorZ);
    renderer.shadowMap.needsUpdate = true;
  }
  camera.position.copy(playerPos);
  camera.lookAt(lx, groundY + 1.8, lz);
  controls.syncRotationFromCamera();
  camHideMeshState = false;
  isThirdPersonEyeFallback = false;
  smoothedCamDist = 1.95;
  if (playerCharacter) {
    playerCharacter.state.facingYaw = controls.euler.y + Math.PI;
    if (playerCharacter.state.cameraMode === 'back') {
      controls.getHorizontalVectors(forwardVec, rightVec);
      camDesiredPos.copy(playerPos).addScaledVector(forwardVec, -1.95);
      camDesiredPos.y = playerPos.y + 0.22;
      const camRes = resolveThirdPersonCamera(playerPos, camDesiredPos, groundY, 0.016, true, true);
      camera.position.copy(camRes.camPos);
      playerCharacter.update(0.016, {
        position: playerPos,
        yaw: controls.euler.y,
        speed: 0,
        maxSpeed: 3.45,
        grounded: true,
        isSprinting: false,
        inStudio: false,
        hideMesh: camRes.hidePlayerMesh,
      });
    }
  }
  crosshairEl?.classList.toggle('hidden', !playerCharacter || playerCharacter.state.cameraMode !== 'first');
  if (spawnSelect && lm.id) {
    const hasOpt = Array.from(spawnSelect.options).some((o) => o.value === lm.id);
    if (hasOpt) spawnSelect.value = lm.id;
  }
  lastZoneText = null;
  lastPromptText = null;
  updateHUDPrompt();
  if (khulnaMapUI) {
    const info = environment?.city?.findNearestRoadAndDistrict?.(playerPos.x, playerPos.z);
    khulnaMapUI.renderMinimap(playerPos, controls.euler.y, info);
  }
  intro?.classList.add('hidden');
  pause?.classList.add('hidden');
  walkHud?.classList.remove('hidden');
  if (lockControls && !inStudio) {
    controls.lock();
  }
}

function beginWalking() {
  if (!started) {
    const spawnId = spawnSelect?.value || 'taltola_house';
    const lm = khulnaMapUI?.landmarks?.find((l) => l.id === spawnId) || { id: 'taltola_house' };
    warpToLandmark(lm, true);
    return;
  }
  liftKeypadOpen = false;
  liftKeypad?.classList.add('hidden');
  intro?.classList.add('hidden');
  pause?.classList.add('hidden');
  walkHud?.classList.remove('hidden');
  controls.lock();
}

enterStreetButton?.addEventListener('click', () => setMode(false));
studioToggleButton?.addEventListener('click', () => setMode(!inStudio));
enterButton?.addEventListener('click', beginWalking);
resumeButton?.addEventListener('click', beginWalking);
mapHudButton?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (inStudio) return;
  controls.euler.setFromQuaternion(camera.quaternion, 'YXZ');
  khulnaMapUI?.toggleMap(playerPos, controls.euler.y);
});
minimapDock?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (inStudio) return;
  controls.euler.setFromQuaternion(camera.quaternion, 'YXZ');
  khulnaMapUI?.openMap(playerPos, controls.euler.y);
});
spawnSelect?.addEventListener('change', () => {
  const lm = khulnaMapUI?.landmarks?.find((l) => l.id === spawnSelect.value);
  if (lm) {
    playerPos.set(
      lm.id === 'taltola_house' ? TALTOLA_HOUSE_OFFSET.x - 0.2 : lm.spawnX,
      EYE_HEIGHT,
      lm.id === 'taltola_house' ? TALTOLA_HOUSE_OFFSET.z + 0.8 : lm.spawnZ,
    );
    environment?.city?.refreshActiveChunks?.(playerPos.x, playerPos.z, quality);
  }
});
gateToggleButton?.addEventListener('click', () => {
  if (!house) return;
  house.toggleAllDoors();
  syncHUDButtons();
});
cameraToggleButton?.addEventListener('click', () => {
  toggleCameraView();
});
runToggleButton?.addEventListener('click', () => {
  toggleRunMode();
});
runPillButton?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleRunMode();
});
hudToggleButton?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleHudVisibility();
});
carToggleButton?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleCarDriving();
});
carSeatBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  const activeCar = getDrivingCar();
  if (activeCar?.state.isRickshaw) {
    activeCar.toggleRideSeat();
    syncCarHUD();
    updateHUDPrompt();
  }
});
carPaintBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  getDrivingCar()?.cyclePaintColor();
  syncCarHUD();
});
carCamBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  getDrivingCar()?.cycleCameraMode();
});
carHornBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  getDrivingCar()?.playHorn();
});
carExitBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (getDrivingCar()) toggleCarDriving();
});
liftHudButton?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (liftKeypadOpen) {
    closeLiftKeypad(true);
  } else {
    openLiftKeypad();
  }
});
liftCloseUiButton?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeLiftKeypad(true);
});
liftDoorOpenBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  environment?.tower?.openDoors();
  syncLiftKeypadUI();
});
liftDoorCloseBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  environment?.tower?.closeDoors();
  syncLiftKeypadUI();
});
liftExitBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (environment?.tower) {
    environment.tower.openDoors();
    if (environment.tower.isInsideLift(playerPos)) {
      playerPos.x = -10.85;
      playerPos.z = 19.55;
      playerPos.y = environment.tower.state.liftY + EYE_HEIGHT;
      controls.euler.set(-0.04, -Math.PI / 2, 0, 'YXZ');
      camera.quaternion.setFromEuler(controls.euler);
    }
  }
  closeLiftKeypad(true);
});
liftFloorButtons.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const floorIdx = Number(btn.dataset.liftFloor);
    selectLiftFloor(floorIdx);
  });
});
interactPrompt?.addEventListener('click', () => {
  handleDoorInteraction();
});

controls.addEventListener('lock', () => {
  if (inStudio) return;
  started = true;
  document.querySelector('#look-control kbd').textContent = controls.fallback ? 'DRAG' : 'MOUSE';
  intro.classList.add('hidden');
  pause.classList.add('hidden');
  walkHud.classList.remove('hidden');
});

controls.addEventListener('unlock', () => {
  keys.clear();
  if (liftKeypadOpen || khulnaMapUI?.isOpen) {
    pause.classList.add('hidden');
    walkHud.classList.remove('hidden');
    return;
  }
  if (!inStudio && started && !referenceModal.open) {
    // GTA-style [ESC]: unlocking pointer opens the Khulna City Map directly instead of a pause screen!
    pause.classList.add('hidden');
    controls.euler.setFromQuaternion(camera.quaternion, 'YXZ');
    khulnaMapUI?.openMap(playerPos, controls.euler.y);
    return;
  }
  walkHud.classList.add('hidden');
});

document.querySelector('#reference-button').addEventListener('click', () => {
  if (controls.isLocked) controls.unlock();
  pause.classList.add('hidden');
  referenceModal.showModal();
});
document.querySelector('#close-reference').addEventListener('click', () => referenceModal.close());
referenceModal.addEventListener('click', (event) => {
  if (event.target === referenceModal) referenceModal.close();
});
referenceModal.addEventListener('close', () => {
  if (!inStudio && started) pause.classList.remove('hidden');
});

const EMOTE_KEY_MAP = {
  Digit1: 'dance1',
  Numpad1: 'dance1',
  Digit2: 'dance2',
  Numpad2: 'dance2',
  Digit3: 'wave',
  Numpad3: 'wave',
  Digit4: 'kick',
  Numpad4: 'kick',
  Digit5: 'combo',
  Numpad5: 'combo',
  Digit6: 'flex',
  Numpad6: 'flex',
  Digit7: 'phone',
  Numpad7: 'phone',
  Digit8: 'mobile',
  Numpad8: 'mobile',
  Digit9: 'laugh',
  Numpad9: 'laugh',
  Digit0: 'warmup',
  Numpad0: 'warmup',
  KeyP: 'pocket',
};

const LIFT_FLOOR_KEY_MAP = {
  Digit0: 0,
  Numpad0: 0,
  Digit1: 1,
  Numpad1: 1,
  Digit2: 2,
  Numpad2: 2,
  Digit3: 3,
  Numpad3: 3,
  Digit4: 4,
  Numpad4: 4,
  Digit5: 5,
  Numpad5: 5,
  Digit6: 6,
  Numpad6: 6,
  Digit7: 7,
  Numpad7: 7,
  Digit8: 8,
  Numpad8: 8,
  Digit9: 9,
  Numpad9: 9,
};

const gameEmoteButtons = Array.from(document.querySelectorAll('[data-game-emote]'));

function syncEmoteUI(activeEmote) {
  if (activeEmote === lastSyncedEmote) return;
  lastSyncedEmote = activeEmote;
  for (const btn of gameEmoteButtons) {
    btn.classList.toggle('active', btn.dataset.gameEmote === activeEmote);
  }
}

gameEmoteButtons.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const emoteName = btn.dataset.gameEmote;
    if (!playerCharacter) return;
    controls.euler.setFromQuaternion(camera.quaternion, 'YXZ');
    const next = playerCharacter.triggerEmote(emoteName, controls.euler.y);
    syncEmoteUI(next);
  });
});

window.addEventListener('keydown', (event) => {
  if (referenceModal.open) return;

  const mappedEmote = EMOTE_KEY_MAP[event.code];

  if (inStudio) {
    if (mappedEmote && playerCharacter) {
      const nextAnim = playerCharacter.state.studioAnim === mappedEmote ? 'idle' : mappedEmote;
      playerCharacter.state.studioAnim = nextAnim;
      playerCharacter.state.emoteClock = 0;
      document.querySelectorAll('[data-anim]').forEach((b) => {
        b.classList.toggle('active', b.dataset.anim === nextAnim);
      });
    } else if (event.code === 'KeyY') {
      playerCharacter?.toggleTalking();
      syncTalkUI();
    } else if (event.code === 'KeyX' || event.code === 'KeyC') {
      playerCharacter?.triggerAttack(event.code === 'KeyC' ? 2 : null);
    }
    return;
  }

  if (!started) return;

  // [TAB] Hide / Show all HUD buttons cleanly anytime
  if (event.code === 'Tab') {
    event.preventDefault();
    if (!event.repeat) toggleHudVisibility();
    return;
  }

  // GTA-style [ESC]: opens & closes the Khulna City Map directly (no [M] key needed!)
  if (event.code === 'Escape' && !event.repeat) {
    event.preventDefault();
    if (khulnaMapUI?.isOpen) {
      khulnaMapUI.closeMap();
      if (!inStudio && started) controls.lock();
    } else if (!liftKeypadOpen) {
      controls.euler.setFromQuaternion(camera.quaternion, 'YXZ');
      khulnaMapUI?.openMap(playerPos, controls.euler.y);
    }
    return;
  }
  if (khulnaMapUI?.isOpen) return;

  if (event.code === 'KeyN' && !event.repeat) {
    event.preventDefault();
    cycleTimeOfDay();
    return;
  }

  // Toggle Drivable Vehicle / Rickshaw Mode with [T] anytime
  if (event.code === 'KeyT' && !event.repeat) {
    event.preventDefault();
    toggleCarDriving();
    return;
  }

  // [U] Sit directly in Rickshaw Passenger Seat (when near a rickshaw) OR switch Driver <-> Passenger Seat!
  if (event.code === 'KeyU' && !event.repeat) {
    const curCar = getDrivingCar();
    if (curCar?.state.isRickshaw) {
      event.preventDefault();
      curCar.toggleRideSeat();
      syncCarHUD();
      updateHUDPrompt();
      return;
    }
    if (!curCar) {
      const nearCar = findNearestEnterableCar(playerPos);
      if (nearCar?.state.isRickshaw) {
        event.preventDefault();
        toggleCarDriving(nearCar, 'passenger');
        return;
      }
    }
  }

  // Dedicated Driving Controls when inside any drivable car or rickshaw
  const activeCar = getDrivingCar();
  if (activeCar) {
    if ((event.code === 'KeyE' || event.code === 'KeyF') && !event.repeat) {
      event.preventDefault();
      toggleCarDriving();
      return;
    }
    if (event.code === 'KeyC' && !event.repeat) {
      event.preventDefault();
      activeCar.cyclePaintColor();
      syncCarHUD();
      return;
    }
    if (event.code === 'KeyH' && !event.repeat) {
      event.preventDefault();
      activeCar.playHorn();
      return;
    }
    if ((event.code === 'KeyV' || event.code === 'KeyB') && !event.repeat) {
      event.preventDefault();
      activeCar.cycleCameraMode();
      return;
    }
    if (event.code === 'KeyG' && !event.repeat) {
      event.preventDefault();
      house?.toggleAllDoors();
      environment?.tower?.toggleGate?.();
      syncHUDButtons();
      return;
    }
    if (event.code === 'Space') {
      event.preventDefault();
    }
    keys.add(event.code);
    return;
  }

  // Toggle Lift Keypad with [L] key anytime
  if (event.code === 'KeyL') {
    event.preventDefault();
    if (liftKeypadOpen) {
      closeLiftKeypad(true);
    } else {
      openLiftKeypad();
    }
    return;
  }

  const insideOrNearLift = Boolean(
    liftKeypadOpen
    || environment?.tower?.isInsideLift(playerPos)
    || environment?.tower?.isNearLiftLobby(playerPos)
  );

  // When inside the lift, near the lift, or when the lift keypad is open, number keys 0-9 / G / R select lift floors!
  if (insideOrNearLift && event.code in LIFT_FLOOR_KEY_MAP) {
    event.preventDefault();
    selectLiftFloor(LIFT_FLOOR_KEY_MAP[event.code]);
    if (!liftKeypadOpen) openLiftKeypad();
    return;
  }
  if ((liftKeypadOpen || environment?.tower?.isInsideLift(playerPos)) && event.code === 'KeyG') {
    event.preventDefault();
    selectLiftFloor(0);
    return;
  }
  if ((liftKeypadOpen || environment?.tower?.isInsideLift(playerPos)) && event.code === 'KeyR') {
    event.preventDefault();
    selectLiftFloor(10);
    return;
  }

  // If the player presses W/A/S/D while the lift keypad is open and the lift doors are open, close the keypad so they can walk out smoothly
  if (
    liftKeypadOpen &&
    environment?.tower?.state?.liftPhase !== 'moving' &&
    (event.code === 'KeyW' || event.code === 'KeyS' || event.code === 'KeyA' || event.code === 'KeyD' ||
     event.code === 'ArrowUp' || event.code === 'ArrowDown' || event.code === 'ArrowLeft' || event.code === 'ArrowRight')
  ) {
    closeLiftKeypad(true);
  }

  if (mappedEmote && playerCharacter) {
    event.preventDefault();
    controls.euler.setFromQuaternion(camera.quaternion, 'YXZ');
    const next = playerCharacter.triggerEmote(mappedEmote, controls.euler.y);
    syncEmoteUI(next);
    return;
  }

  if (event.code === 'KeyE') {
    event.preventDefault();
    handleDoorInteraction(false);
  } else if (event.code === 'KeyF') {
    event.preventDefault();
    handleDoorInteraction(true);
  } else if (event.code === 'KeyQ') {
    event.preventDefault();
    startParkourDive();
  } else if (event.code === 'KeyG') {
    event.preventDefault();
    house?.toggleAllDoors();
    syncHUDButtons();
  } else if (event.code === 'KeyV' || event.code === 'KeyB') {
    event.preventDefault();
    toggleCameraView();
  } else if (event.code === 'KeyR' || event.code === 'CapsLock') {
    event.preventDefault();
    toggleRunMode();
  } else if (event.code === 'KeyX' || event.code === 'KeyC') {
    event.preventDefault();
    playerCharacter?.triggerAttack(event.code === 'KeyC' ? 2 : null);
    syncEmoteUI(null);
  }

  shiftHeld = event.shiftKey || event.code === 'ShiftLeft' || event.code === 'ShiftRight';

  // Double-tap W or ArrowUp to automatically sprint!
  if ((event.code === 'KeyW' || event.code === 'ArrowUp') && !event.repeat) {
    const now = performance.now();
    if (now - lastForwardDownTime < 360) {
      doubleTapSprint = true;
    }
    lastForwardDownTime = now;
  }

  keys.add(event.code);
  if (event.code === 'Space' && controls.isLocked) {
    event.preventDefault();
    jumpBuffer = 0.15;
  }
});
window.addEventListener('keyup', (event) => {
  keys.delete(event.code);
  shiftHeld = event.shiftKey && event.code !== 'ShiftLeft' && event.code !== 'ShiftRight';
  if (event.code === 'KeyW' || event.code === 'ArrowUp') {
    doubleTapSprint = false;
  }
});
window.addEventListener('blur', () => {
  keys.clear();
  shiftHeld = false;
  doubleTapSprint = false;
});

function resolveCircleAABB(pos, radius, minX, maxX, minZ, maxZ) {
  const closestX = THREE.MathUtils.clamp(pos.x, minX, maxX);
  const closestZ = THREE.MathUtils.clamp(pos.z, minZ, maxZ);
  const dx = pos.x - closestX;
  const dz = pos.z - closestZ;
  const distSq = dx * dx + dz * dz;
  if (distSq < radius * radius) {
    if (distSq > 1e-8) {
      const dist = Math.sqrt(distSq);
      const overlap = radius - dist;
      pos.x += (dx / dist) * overlap;
      pos.z += (dz / dist) * overlap;
    } else {
      const leftPen = Math.abs(pos.x - minX);
      const rightPen = Math.abs(maxX - pos.x);
      const backPen = Math.abs(pos.z - minZ);
      const frontPen = Math.abs(pos.z - maxZ);
      const minPen = Math.min(leftPen, rightPen, backPen, frontPen);
      if (minPen === leftPen) pos.x = minX - radius;
      else if (minPen === rightPen) pos.x = maxX + radius;
      else if (minPen === backPen) pos.z = minZ - radius;
      else pos.z = maxZ + radius;
    }
  }
}

/**
 * Returns all jumpable & sittable furniture / bathroom fixtures on a floor (`fy`)
 * for either `'tower'` (Sk Arshan Alif Tower) or `'house'` (5-Story Taltola House).
 */
function getFurnitureBoxesForFloor(building, fy) {
  if (building === 'tower') {
    if (fy < 2.0) {
      // Ground-floor Parking & Reception Lobby (fy = 0.50)
      return [
        { minX: -9.20, maxX: -5.00, minZ: 24.55, maxZ: 26.25, h: 1.44, seat: false }, // Red Sedan Car
        { minX: -18.80, maxX: -14.50, minZ: 15.60, maxZ: 17.60, h: 1.82, seat: false }, // Black Prado SUV
        { minX: -10.90, maxX: -9.10, minZ: 17.10, maxZ: 18.60, h: 1.20, seat: false }, // Reception Desk
      ];
    }
    if (fy >= 30.0) {
      // Rooftop Sky Lounge (fy = 31.0)
      return [
        {
          minX: -7.80, maxX: -4.80, minZ: 15.80, maxZ: 16.50, h: 0.52,
          seat: true, seatX: -6.25, seatZ: 16.18, seatY: 0.50, yaw: 0,
          label: 'ছাদের স্কাই লাউঞ্জ সোফা (Rooftop Sofa)',
        },
        {
          minX: -7.80, maxX: -7.10, minZ: 16.50, maxZ: 19.20, h: 0.52,
          seat: true, seatX: -7.42, seatZ: 17.85, seatY: 0.50, yaw: Math.PI / 2,
          label: 'ছাদের স্কাই লাউঞ্জ সোফা (Rooftop Sofa)',
        },
        { minX: -6.80, maxX: -5.40, minZ: 17.20, maxZ: 18.60, h: 0.44, seat: false },
      ];
    }
    // Apartment Floors 1..9 (fy = 4.0, 7.0, ..., 28.0)
    const items = [
      // 1) Attached Luxury Bathroom (West En-Suite: x ∈ [-19.65, -16.65], z ∈ [18.63, 21.35]) — Western Porcelain Commode & Vanity
      {
        minX: -19.47, maxX: -18.67, minZ: 20.38, maxZ: 20.92, h: 0.48,
        seat: true, seatX: -18.91, seatZ: 20.65, seatY: 0.46, yaw: Math.PI / 2,
        label: 'বাথরুমের কমোড (Toilet Commode)',
      },
      { minX: -17.33, maxX: -16.75, minZ: 19.56, maxZ: 20.48, h: 0.88, seat: false },
      // 2) Master Bedroom — King-Size Luxury Bed & Wardrobe
      {
        minX: -19.50, maxX: -16.60, minZ: 15.25, maxZ: 17.45, h: 0.68,
        seat: true, seatX: -17.35, seatZ: 16.35, seatY: 0.64, yaw: Math.PI / 2,
        label: 'মাস্টার বেডরুমের খাট (King Bed)',
      },
      { minX: -16.50, maxX: -14.00, minZ: 17.92, maxZ: 18.52, h: 2.45, seat: false }, // Wardrobe
      // 3) Living Lounge — Royal Blue Tufted Velvet L-Sofa, Marble Coffee Table & TV Console
      {
        minX: -11.02, maxX: -6.58, minZ: 15.02, maxZ: 15.98, h: 0.48,
        seat: true, seatX: -8.40, seatZ: 15.55, seatY: 0.46, yaw: 0,
        label: 'ড্রয়িং রুমের ভেলভেট সোফা (Velvet Sofa)',
      },
      {
        minX: -11.02, maxX: -10.08, minZ: 15.95, maxZ: 17.70, h: 0.48,
        seat: true, seatX: -10.45, seatZ: 16.75, seatY: 0.46, yaw: Math.PI / 2,
        label: 'ড্রয়িং রুমের কর্নার সোফা (L-Sofa)',
      },
      { minX: -9.35, maxX: -7.45, minZ: 16.32, maxZ: 17.28, h: 0.48, seat: false }, // Coffee Table
      { minX: -10.22, maxX: -6.78, minZ: 18.00, maxZ: 18.53, h: 0.56, seat: false }, // TV Console
      // 4) Dining & Modular Kitchen — 6-Seater Marble Dining Table, Kitchen Counter & Fridge
      { minX: -9.80, maxX: -7.00, minZ: 24.60, maxZ: 26.20, h: 0.84, seat: false }, // Dining Table
      { minX: -12.25, maxX: -7.15, minZ: 27.50, maxZ: 28.26, h: 0.96, seat: false }, // Kitchen Counter
      { minX: -13.15, maxX: -12.25, minZ: 27.45, maxZ: 28.25, h: 1.95, seat: false }, // Smart Fridge
      // 5) VIP RGB Gaming & Study Suite — Ergonomic Gaming Chair & L-Desk
      {
        minX: -18.42, maxX: -17.70, minZ: 25.48, maxZ: 26.12, h: 0.54,
        seat: true, seatX: -18.08, seatZ: 25.80, seatY: 0.52, yaw: -Math.PI / 2,
        label: 'আরজিবি গেমিং চেয়ার (Gaming Chair)',
      },
      { minX: -19.55, maxX: -18.60, minZ: 24.20, maxZ: 27.60, h: 0.80, seat: false },
    ];
    // Add all 6 Emerald Velvet Dining Chairs
    for (const cx of [-7.5, -8.4, -9.3]) {
      items.push(
        {
          minX: cx - 0.26, maxX: cx + 0.26, minZ: 24.00, maxZ: 24.48, h: 0.48,
          seat: true, seatX: cx, seatZ: 24.25, seatY: 0.46, yaw: 0,
          label: 'ডাইনিং চেয়ার (Dining Chair)',
        },
        {
          minX: cx - 0.26, maxX: cx + 0.26, minZ: 26.32, maxZ: 26.80, h: 0.48,
          seat: true, seatX: cx, seatZ: 26.55, seatY: 0.46, yaw: Math.PI,
          label: 'ডাইনিং চেয়ার (Dining Chair)',
        }
      );
    }
    return items;
  }

  // --- 5-STORY TALTOLA HOUSE (levels 0..4, fy = 0, 3.05, 6.10, 9.15, 12.20) ---
  if (fy > 13.5) return [];
  return [
    // Unit A Drawing Room Sofa & Coffee Table
    {
      minX: 6.80, maxX: 8.90, minZ: -5.18, maxZ: -4.40, h: 0.48,
      seat: true, seatX: 7.85, seatZ: -4.68, seatY: 0.46, yaw: 0,
      label: 'বসার ঘরের সোফা (Living Room Sofa)',
    },
    { minX: 7.28, maxX: 8.42, minZ: -3.86, maxZ: -3.24, h: 0.48, seat: false },
    // Unit A Master Bedroom King Bed & Almirah
    {
      minX: 11.88, maxX: 13.82, minZ: -5.08, maxZ: -3.28, h: 0.56,
      seat: true, seatX: 12.85, seatZ: -3.95, seatY: 0.54, yaw: 0,
      label: 'মাস্টার বেডরুমের খাট (Master Bed)',
    },
    { minX: 11.55, maxX: 12.10, minZ: -3.74, maxZ: -2.56, h: 2.02, seat: false },
    // Unit A & Unit B Attached Bathroom Western Toilet Commodes (কমোড)
    {
      minX: 9.72, maxX: 10.32, minZ: -4.98, maxZ: -4.46, h: 0.52,
      seat: true, seatX: 10.06, seatZ: -4.72, seatY: 0.50, yaw: Math.PI / 2,
      label: 'বাথরুমের কমোড (Toilet Commode)',
    },
    {
      minX: 9.72, maxX: 10.32, minZ: 4.46, maxZ: 4.98, h: 0.52,
      seat: true, seatX: 10.06, seatZ: 4.72, seatY: 0.50, yaw: Math.PI / 2,
      label: 'বাথরুমের কমোড (Toilet Commode)',
    },
    // Unit B Dining Table & 4 Dining Chairs
    { minX: 7.10, maxX: 8.60, minZ: 3.04, maxZ: 4.06, h: 0.79, seat: false },
    {
      minX: 7.28, maxX: 7.72, minZ: 2.56, maxZ: 3.00, h: 0.48,
      seat: true, seatX: 7.50, seatZ: 2.78, seatY: 0.46, yaw: 0,
      label: 'ডাইনিং চেয়ার (Dining Chair)',
    },
    {
      minX: 7.98, maxX: 8.42, minZ: 2.56, maxZ: 3.00, h: 0.48,
      seat: true, seatX: 8.20, seatZ: 2.78, seatY: 0.46, yaw: 0,
      label: 'ডাইনিং চেয়ার (Dining Chair)',
    },
    {
      minX: 7.28, maxX: 7.72, minZ: 4.10, maxZ: 4.54, h: 0.48,
      seat: true, seatX: 7.50, seatZ: 4.32, seatY: 0.46, yaw: Math.PI,
      label: 'ডাইনিং চেয়ার (Dining Chair)',
    },
    {
      minX: 7.98, maxX: 8.42, minZ: 4.10, maxZ: 4.54, h: 0.48,
      seat: true, seatX: 8.20, seatZ: 4.32, seatY: 0.46, yaw: Math.PI,
      label: 'ডাইনিং চেয়ার (Dining Chair)',
    },
    // Unit B Kitchen Counter & Fridge
    { minX: 11.60, maxX: 14.10, minZ: 4.58, maxZ: 5.26, h: 0.95, seat: false },
    { minX: 11.55, maxX: 12.22, minZ: 2.72, maxZ: 3.38, h: 1.76, seat: false },
  ];
}

/**
 * Finds the nearest interactive seat (chair, sofa, bed, or toilet commode) near `pos`.
 */
function findNearestSeat(pos) {
  const footY = pos.y - EYE_HEIGHT;
  let building = null;
  let fy = 0;
  let testX = pos.x;
  let testZ = pos.z;
  let offsetX = 0;
  let offsetZ = 0;

  const lx = pos.x - TALTOLA_HOUSE_OFFSET.x;
  const lz = pos.z - TALTOLA_HOUSE_OFFSET.z;

  if (pos.x >= -19.85 && pos.x <= -2.85 && pos.z >= 14.25 && pos.z <= 28.55) {
    building = 'tower';
    const L = (k) => (k === 0 ? 0.50 : 4.0 + (k - 1) * 3.0);
    let bestDiff = Infinity;
    for (let k = 0; k <= 10; k++) {
      const y = L(k);
      const d = Math.abs(footY - y);
      if (d < bestDiff) {
        bestDiff = d;
        fy = y;
      }
    }
  } else if (lx >= 5.95 && lx <= 14.38 && Math.abs(lz) <= 5.42) {
    building = 'house';
    offsetX = TALTOLA_HOUSE_OFFSET.x;
    offsetZ = TALTOLA_HOUSE_OFFSET.z;
    testX = lx;
    testZ = lz;
    const lvl = THREE.MathUtils.clamp(Math.round(footY / 3.05), 0, 5);
    fy = lvl * 3.05;
  } else {
    return null;
  }

  const boxes = getFurnitureBoxesForFloor(building, fy);
  let bestSeat = null;
  let bestDist = 1.65;
  for (const item of boxes) {
    if (!item.seat) continue;
    const cx = THREE.MathUtils.clamp(testX, item.minX, item.maxX);
    const cz = THREE.MathUtils.clamp(testZ, item.minZ, item.maxZ);
    const dist = Math.hypot(testX - cx, testZ - cz);
    if (dist < bestDist && Math.abs(footY - fy) < 1.35) {
      bestDist = dist;
      bestSeat = {
        ...item,
        seatX: item.seatX + offsetX,
        seatZ: item.seatZ + offsetZ,
        fy,
        dist,
      };
    }
  }
  return bestSeat;
}

/**
 * Computes exact floor, elevator cabin, staircase, or furniture top elevation under playerPos across both buildings:
 *  1) 5-Story Taltola House + Balconies + Rooftop (x = 4.72..14.38, z = -5.42..5.42)
 *  2) 10-Story Sk Arshan Alif Tower + Balconies + Rooftop Sky Lounge (x = -19.85..-2.85, z = 14.25..28.55)
 *
 * Uses `maxStepUp` and stairwell/shaft cutouts so jumping on stairs or indoors NEVER snaps the player to the floor above.
 */
function computeGroundHeight(pos) {
  const footY = pos.y - EYE_HEIGHT;
  const maxStepUp = grounded ? 0.55 : (verticalVelocity > 0 ? 0.08 : 0.38);

  // --- SK ARSHAN ALIF TOWER (35 Haji Mohsin Road) ---
  const inSkArshanZone = pos.x >= -19.85 && pos.x <= -2.85 && pos.z >= 14.28 && pos.z <= 28.55;
  if (inSkArshanZone) {
    // 1) Inside the 3D Moving Elevator Cabin (x ∈ [-13.28, -11.52], z ∈ [18.78, 20.32])
    if (environment?.tower?.isInsideLift(pos)) {
      const liftY = environment.tower.state.liftY;
      if (Math.abs(footY - liftY) < 2.4) {
        return liftY;
      }
    }

    // 2) Ground-floor Car Ramp (z = 19.1..22.9, x = -4.65..-3.15) & South Steps (z = 26.5..28.5)
    if (footY < 1.8 && pos.x > -4.6) {
      if ((pos.z >= 19.1 && pos.z <= 22.9) || (pos.z >= 26.5 && pos.z <= 28.5)) {
        const rampT = THREE.MathUtils.clamp((-3.25 - pos.x) / 1.3, 0, 1);
        return rampT * 0.50;
      }
      if (pos.x <= -3.25) return 0.50;
      return 0.0;
    }

    const L = (k) => (k === 0 ? 0.50 : 4.0 + (k - 1) * 3.0);
    let bestGroundY = 0.0;

    // 3) Continuous Walkable Marble Staircase inside Sk Arshan Tower (x = -14.25..-9.55, z = 21.50..22.85)
    const inTowerStairs = pos.x >= -14.25 && pos.x <= -9.55 && pos.z >= 21.50 && pos.z <= 22.85;
    const inMiddleOfTowerStairHole = pos.x > -13.92 && pos.x < -9.78 && pos.z >= 21.55 && pos.z <= 22.80;
    if (inTowerStairs) {
      const t = THREE.MathUtils.clamp((-9.65 - pos.x) / 4.45, 0, 1);
      for (let k = 0; k <= 9; k++) {
        const y0 = L(k);
        const y1 = L(k + 1);
        const rampY = y0 + t * (y1 - y0);
        if (rampY <= footY + maxStepUp) {
          bestGroundY = Math.max(bestGroundY, rampY);
        }
      }
    }

    // 4) Floor slabs k = 0..10 (with stairwell cutout on k >= 1 so jumping on stairs never snaps to a slab!)
    for (let k = 0; k <= 10; k++) {
      const fy = L(k);
      if (fy > footY + maxStepUp) continue;

      let onSlab = true;
      if (k >= 10) {
        if (pos.x > -3.65 || pos.z < 14.30 || pos.z > 28.55) onSlab = false;
      } else if (k >= 1) {
        let maxBalconyX = -3.65;
        if (pos.z < 18.60) maxBalconyX = -2.85; // Bay A corner balcony
        else if (pos.z < 23.55) maxBalconyX = -3.75; // Bay B recessed balcony
        else maxBalconyX = k % 2 === 0 ? -3.65 : -4.30; // Bay C stepped balcony
        if (pos.x > maxBalconyX) onSlab = false;
      } else {
        if (pos.x > -3.25) onSlab = false;
      }
      if (!onSlab) continue;

      if (k >= 1 && inMiddleOfTowerStairHole) continue;

      bestGroundY = Math.max(bestGroundY, fy);

      // 5) Check if player is standing or landing on top of any furniture/commode/bed/sofa/table/car on this floor
      if (!inTowerStairs) {
        const boxes = getFurnitureBoxesForFloor('tower', fy);
        for (const box of boxes) {
          if (
            pos.x >= box.minX - 0.16 && pos.x <= box.maxX + 0.16 &&
            pos.z >= box.minZ - 0.16 && pos.z <= box.maxZ + 0.16
          ) {
            const boxTop = fy + box.h;
            if (boxTop <= footY + maxStepUp && footY >= fy + box.h * 0.42) {
              bestGroundY = Math.max(bestGroundY, boxTop);
            }
          }
        }
      }
    }
    return bestGroundY;
  }

  // --- 5-STORY TALTOLA HOUSE (at Tootpara Taltola Hospital Cross Rd) ---
  const lx = pos.x - TALTOLA_HOUSE_OFFSET.x;
  const lz = pos.z - TALTOLA_HOUSE_OFFSET.z;
  const insideMainSlab = lx >= 5.95 && lx <= 14.38 && Math.abs(lz) <= 5.42;
  const inFrontBalconyZone = lx >= 4.74 && lx <= 6.08 &&
    ((lz >= -5.12 && lz <= -1.48) || (lz >= 1.52 && lz <= 5.12));

  if (!insideMainSlab && !inFrontBalconyZone) {
    return 0.0;
  }

  let bestHouseY = 0.0;
  const inStairLane = lx >= 7.62 && lx <= 12.18 && lz >= 0.16 && lz <= 1.16;
  const inMiddleOfHouseStairHole = lx > 7.82 && lx < 11.96 && lz >= 0.16 && lz <= 1.16;

  if (inStairLane) {
    const t = THREE.MathUtils.clamp((lx - 7.75) / (12.05 - 7.75), 0, 1);
    for (let sLvl = 0; sLvl < 5; sLvl++) {
      const rampY = sLvl * 3.05 + t * 3.05;
      if (rampY <= footY + maxStepUp) {
        bestHouseY = Math.max(bestHouseY, rampY);
      }
    }
  }

  for (let sLvl = 0; sLvl <= 5; sLvl++) {
    const fy = sLvl * 3.05;
    if (fy > footY + maxStepUp) continue;
    const onBalcony = sLvl >= 1 && sLvl <= 4 && inFrontBalconyZone;
    if (!insideMainSlab && !onBalcony) continue;
    if (sLvl >= 1 && inMiddleOfHouseStairHole) continue;

    bestHouseY = Math.max(bestHouseY, fy);

    if (!inStairLane && sLvl <= 4) {
      const boxes = getFurnitureBoxesForFloor('house', fy);
      for (const box of boxes) {
        if (
          lx >= box.minX - 0.16 && lx <= box.maxX + 0.16 &&
          lz >= box.minZ - 0.16 && lz <= box.maxZ + 0.16
        ) {
          const boxTop = fy + box.h;
          if (boxTop <= footY + maxStepUp && footY >= fy + box.h * 0.42) {
            bestHouseY = Math.max(bestHouseY, boxTop);
          }
        }
      }
    }
  }
  return bestHouseY;
}

function applyWorldCollisions(pos) {
  environment?.city?.applyCityCollisions?.(pos, PLAYER_RADIUS);

  const footY = pos.y - EYE_HEIGHT;
  // Global live & parked Khulna vehicles (CNGs, Easybikes, Sedans, Trucks) — solid everywhere on map!
  environment?.traffic?.applyVehicleCollisions?.(pos, PLAYER_RADIUS, footY);

  const hx = TALTOLA_HOUSE_OFFSET.x;
  const hz = TALTOLA_HOUSE_OFFSET.z;

  // Static corridor/landmark parked CNG autos & roadside utility poles
  if (footY < 1.75) {
    for (const [cx, cz, hw, hd] of [
      [hx - 1.9, hz + 29.0, 0.78, 1.42],   // Taltola Cross Rd parked CNG
      [-286.5, -45.5, 0.85, 1.45],         // PTI More parked CNG
      [1217.5, 649.8, 1.42, 0.82],         // Rupsha Ferry Terminal queue CNG
      [1117.0, 17.0, 1.10, 1.25],          // Rupsha Launch Ghat parked CNG
    ]) {
      if (Math.abs(pos.x - cx) < 4.5 && Math.abs(pos.z - cz) < 4.5) {
        resolveCircleAABB(pos, PLAYER_RADIUS, cx - hw, cx + hw, cz - hd, cz + hd);
      }
    }
  }

  // Parked drivable car body colliders when walking on foot anywhere in Khulna
  if (footY < 1.9 && cars.length) {
    for (const car of cars) {
      if (!car || car.state.driving) continue;
      const cx = car.state.pos.x;
      const cz = car.state.pos.z;
      if (Math.abs(pos.x - cx) > 6.5 || Math.abs(pos.z - cz) > 6.5) continue;
      const cosH = Math.abs(Math.cos(car.state.heading));
      const sinH = Math.abs(Math.sin(car.state.heading));
      const halfX = car.state.halfWidth * cosH + car.state.halfLength * sinH;
      const halfZ = car.state.halfLength * cosH + car.state.halfWidth * sinH;
      resolveCircleAABB(pos, PLAYER_RADIUS, cx - halfX, cx + halfX, cz - halfZ, cz + halfZ);
    }
  }

  const nearHajiMohsin = Math.abs(pos.x) < 55 && Math.abs(pos.z) < 55;
  const nearTaltolaHouse = Math.abs(pos.x - hx) < 28 && Math.abs(pos.z - hz) < 22;

  if (!nearHajiMohsin && !nearTaltolaHouse) return;

  if (nearHajiMohsin) {
    for (let iter = 0; iter < 2; iter++) {
      // Haji Mohsin Rd boundary wall (West sidewalk z = -10.5..10.22)
      if (footY < 2.6) {
        resolveCircleAABB(pos, PLAYER_RADIUS, -46.0, -2.92, -10.5, 10.22);
      }
      // Old buildings west of Sk Arshan Tower along Fakir Bari Lane (x <= -19.85, z >= 14.26)
      resolveCircleAABB(pos, PLAYER_RADIUS, -46.0, -19.85, 14.26, 42.0);
      // Under-construction building south of Sk Arshan Tower (z >= 28.58, x <= -3.22)
      resolveCircleAABB(pos, PLAYER_RADIUS, -19.85, -3.22, 28.58, 42.0);
      // Lane end building
      resolveCircleAABB(pos, PLAYER_RADIUS, -46.0, -42.45, 9.0, 15.5);

      // Haji Mohsin Road East Side Commercial & Diagnostic Clinics (Ankur, Prime Bank, Caynika, Reza Medical) + Planter/ASB/Milk Vita
      resolveCircleAABB(pos, PLAYER_RADIUS, 3.20, 22.0, -28.0, 7.45);
      resolveCircleAABB(pos, PLAYER_RADIUS, 3.02, 22.0, 7.45, 20.85);
      resolveCircleAABB(pos, PLAYER_RADIUS, 2.95, 3.65, 20.85, 23.75);
      resolveCircleAABB(pos, PLAYER_RADIUS, 7.20, 22.0, 20.85, 26.80);
      resolveCircleAABB(pos, PLAYER_RADIUS, 3.05, 22.0, 26.55, 42.0);

      // Haji Mohsin Rd Utility Poles, ASB Ceramic Gate Pillars & Parked Cycle Rickshaw (0.85, 31.0)
      resolveCircleAABB(pos, PLAYER_RADIUS, -2.62, -2.22, -16.20, -15.80);
      resolveCircleAABB(pos, PLAYER_RADIUS, -2.62, -2.22, 16.80, 17.20);
      resolveCircleAABB(pos, PLAYER_RADIUS, 3.08, 3.62, 23.32, 23.88);
      resolveCircleAABB(pos, PLAYER_RADIUS, 3.08, 3.62, 26.32, 26.88);
      if (footY < 1.75) {
        resolveCircleAABB(pos, PLAYER_RADIUS, 0.25, 1.45, 30.05, 31.95);
      }

      // --- SK ARSHAN ALIF TOWER COLLISIONS (x ∈ [-19.85, -2.85], z ∈ [14.25, 28.58]) ---
    if (pos.x < -2.6 && pos.z >= 14.1 && pos.z <= 28.8) {
      const L = (k) => (k === 0 ? 0.50 : 4.0 + (k - 1) * 3.0);
      let towerK = 0;
      let towerFy = 0.50;
      for (let k = 0; k <= 10; k++) {
        const y = L(k);
        if (y <= footY + 0.55) {
          towerK = k;
          towerFy = y;
        }
      }
      const inTowerStairLane = pos.x >= -14.25 && pos.x <= -9.55 && pos.z >= 21.50 && pos.z <= 22.85;

      // Rear wall (x = -19.8) & South party wall (z = 28.5)
      resolveCircleAABB(pos, PLAYER_RADIUS, -20.2, -19.65, 14.2, 28.7);
      resolveCircleAABB(pos, PLAYER_RADIUS, -19.85, -3.5, 28.42, 28.8);

      // Hollow 3D Elevator Shaft & Sliding Doorway (x ∈ [-13.38, -11.55], z ∈ [18.70, 20.40], open doorway at x = -11.55, z ∈ [18.96, 20.14])
      resolveCircleAABB(pos, 0.22, -13.44, -13.24, 18.68, 20.42); // Rear West shaft wall
      resolveCircleAABB(pos, 0.22, -13.44, -11.50, 18.68, 18.82); // North shaft wall
      resolveCircleAABB(pos, 0.22, -13.44, -11.50, 20.28, 20.42); // South shaft wall
      resolveCircleAABB(pos, 0.18, -11.66, -11.48, 18.68, 18.96); // North door jamb
      resolveCircleAABB(pos, 0.18, -11.66, -11.48, 20.14, 20.42); // South door jamb
      if (!environment?.tower?.isLiftOpenAtY(footY)) {
        // When elevator is moving or on another floor or doors are closed, block doorway so player cannot fall into shaft or walk out mid-flight!
        resolveCircleAABB(pos, 0.24, -11.66, -11.48, 18.94, 20.16);
      }

      if (towerK === 0) {
        // Ground-floor lane-side shop shutters wall (ALWAYS solid up to 1st floor slab!)
        resolveCircleAABB(pos, PLAYER_RADIUS, -19.85, -4.45, 14.42, 14.76);
        // Plinth stainless railings along road (leaving Car Ramp z=19.15..22.95 & South Steps z=26.55..28.45 open!)
        if (footY - 0.50 < 0.68) {
          resolveCircleAABB(pos, PLAYER_RADIUS, -3.42, -3.22, 14.30, 19.15);
          resolveCircleAABB(pos, PLAYER_RADIUS, -3.42, -3.22, 22.95, 26.55);
        }
        // Front ground-floor piers & closed gates (ALWAYS solid up to 1st floor slab!)
        resolveCircleAABB(pos, PLAYER_RADIUS, -4.58, -4.00, 14.55, 18.88);
        if (environment?.tower && !environment.tower.state.gateOpen) {
          resolveCircleAABB(pos, PLAYER_RADIUS, -4.45, -4.05, 18.88, 21.92);
        }
        resolveCircleAABB(pos, PLAYER_RADIUS, -4.58, -4.00, 21.92, 26.58);
        resolveCircleAABB(pos, PLAYER_RADIUS, -4.58, -4.00, 27.82, 28.60);

        // 4 Yellow/Black Structural Columns inside Ground-Floor Parking Deck (ALWAYS SOLID!)
        for (const [cx, cz] of [[-8.8, 17.5], [-8.8, 23.6], [-15.2, 17.5], [-15.2, 23.6]]) {
          resolveCircleAABB(pos, PLAYER_RADIUS, cx - 0.29, cx + 0.29, cz - 0.29, cz + 0.29);
        }
        // Reception & Concierge Desk + Lobby Signboard Wall Column
        resolveCircleAABB(pos, PLAYER_RADIUS, -10.92, -9.08, 17.08, 18.62);
        resolveCircleAABB(pos, PLAYER_RADIUS, -12.12, -11.48, 15.98, 18.74);
        // Parked Red Sedan (Bay C) & Luxury Black Prado SUV (NW Bay) — solid vehicles!
        if (footY < 1.98) {
          resolveCircleAABB(pos, PLAYER_RADIUS, -9.26, -4.94, 24.50, 26.32);
        }
        if (footY < 2.36) {
          resolveCircleAABB(pos, PLAYER_RADIUS, -18.86, -14.44, 15.54, 17.66);
        }
      } else if (towerK >= 1 && towerK <= 9 && footY < 29.8) {
        // UPPER FLOORS (k = 1..9):
        // 1) Lane-side exterior wall (z = 14.48..14.74)
        resolveCircleAABB(pos, PLAYER_RADIUS, -19.85, -4.25, 14.42, 14.74);

        // 2) Front walls between rooms and balconies (with open sliding glass doorways!)
        // Bay A front wall (x = -4.32, open balcony doorway at z = 15.20..16.35)
        resolveCircleAABB(pos, PLAYER_RADIUS, -4.46, -4.18, 14.58, 15.20);
        resolveCircleAABB(pos, PLAYER_RADIUS, -4.46, -4.18, 16.35, 18.60);
        // Bay B front wall (x = -5.60, open balcony doorway at z = 19.30..20.45) & side walls of recessed balcony
        resolveCircleAABB(pos, PLAYER_RADIUS, -5.62, -3.75, 18.58, 18.90);
        resolveCircleAABB(pos, PLAYER_RADIUS, -5.62, -3.75, 23.30, 23.60);
        resolveCircleAABB(pos, PLAYER_RADIUS, -5.72, -5.48, 18.88, 19.30);
        resolveCircleAABB(pos, PLAYER_RADIUS, -5.72, -5.48, 20.45, 23.32);
        // Bay C front wall (x = -5.08, open balcony doorway at z = 24.10..25.30)
        resolveCircleAABB(pos, PLAYER_RADIUS, -5.22, -4.94, 23.58, 24.10);
        resolveCircleAABB(pos, PLAYER_RADIUS, -5.22, -4.94, 25.30, 28.50);

        // 3) Interior Partition Walls (100% solid with exact doorway openings & wide-open stairwell landing!)
        if (!inTowerStairLane) {
          // North Lobby / Flat A Wall (z = 18.63): open Flat A door at x = -8.60..-7.20 & West Bathroom door at x = -18.30..-17.10
          resolveCircleAABB(pos, PLAYER_RADIUS, -7.20, -5.50, 18.53, 18.74);
          resolveCircleAABB(pos, PLAYER_RADIUS, -17.10, -8.60, 18.53, 18.74);
          resolveCircleAABB(pos, PLAYER_RADIUS, -19.85, -18.30, 18.53, 18.74);

          // South Lobby / Flat B Wall (z = 23.26): open Flat B door at x = -8.60..-7.20
          resolveCircleAABB(pos, PLAYER_RADIUS, -7.20, -5.05, 23.16, 23.37);
          resolveCircleAABB(pos, PLAYER_RADIUS, -19.85, -8.60, 23.16, 23.37);

          // North Wing: Living Lounge / Master Bedroom Wall (x = -13.30, open doorway at z = 16.00..17.30)
          resolveCircleAABB(pos, PLAYER_RADIUS, -13.40, -13.20, 14.68, 16.00);
          resolveCircleAABB(pos, PLAYER_RADIUS, -13.40, -13.20, 17.30, 18.63);

          // West En-Suite Attached Luxury Bathroom Walls (x = -16.65, x = -19.65, z = 21.32 with open doorway at x = -18.30..-17.20)
          // Leaves x = -16.55..-14.10 completely open in front of the top stair landing!
          resolveCircleAABB(pos, PLAYER_RADIUS, -16.75, -16.56, 18.63, 21.40);
          resolveCircleAABB(pos, PLAYER_RADIUS, -19.75, -19.55, 18.63, 21.40);
          resolveCircleAABB(pos, PLAYER_RADIUS, -17.20, -16.56, 21.22, 21.42);
          resolveCircleAABB(pos, PLAYER_RADIUS, -19.75, -18.30, 21.22, 21.42);
          resolveCircleAABB(pos, 0.20, -18.38, -18.24, 18.65, 19.60);

          // South Wing: Dining Room / RGB Gaming Suite Wall (x = -13.30, open doorway at z = 24.90..26.30)
          resolveCircleAABB(pos, PLAYER_RADIUS, -13.40, -13.20, 23.26, 24.90);
          resolveCircleAABB(pos, PLAYER_RADIUS, -13.40, -13.20, 26.30, 28.50);
        }

        // Stairwell handrails along z = 21.58 & z = 22.78 (slim 0.15m radius so stairs are wide and never snag at landings)
        resolveCircleAABB(pos, 0.15, -13.90, -9.85, 21.55, 21.61);
        resolveCircleAABB(pos, 0.15, -13.90, -9.85, 22.75, 22.81);

        // 4) Balcony Outer Railings — only block horizontally when not jumping over them (footY - towerFy < 0.68)!
        if (footY - towerFy < 0.68) {
          resolveCircleAABB(pos, PLAYER_RADIUS, -3.02, -2.82, 14.30, 18.60); // Bay A balcony front rail
          resolveCircleAABB(pos, PLAYER_RADIUS, -4.25, -2.85, 14.28, 14.44); // Bay A balcony north rail
          resolveCircleAABB(pos, PLAYER_RADIUS, -3.92, -3.72, 18.60, 23.55); // Bay B balcony front rail
          const bayCRailX = towerK % 2 === 0 ? -3.75 : -4.40;
          resolveCircleAABB(pos, PLAYER_RADIUS, bayCRailX - 0.10, bayCRailX + 0.10, 23.55, 28.55); // Bay C balcony front rail
        }
      } else {
        // ROOFTOP SKY LOUNGE (y = 31.0m):
        // Rooftop Lift & Stair Penthouse Room walls (x = -16.45..-9.4, z = 18.2..23.1, open door at x = -9.4, z = 18.9..21.4)
        resolveCircleAABB(pos, PLAYER_RADIUS, -16.62, -16.30, 18.20, 23.10);
        resolveCircleAABB(pos, PLAYER_RADIUS, -16.55, -9.40, 18.18, 18.48);
        resolveCircleAABB(pos, PLAYER_RADIUS, -16.55, -9.40, 22.82, 23.12);
        resolveCircleAABB(pos, PLAYER_RADIUS, -9.68, -9.38, 18.20, 18.90);
        resolveCircleAABB(pos, PLAYER_RADIUS, -9.68, -9.38, 21.40, 23.10);
        // Rooftop Parapet Walls — only block horizontally when not jumping over them (footY - 31.0 < 0.68)!
        if (footY - 31.0 < 0.68) {
          resolveCircleAABB(pos, PLAYER_RADIUS, -19.85, -3.65, 14.25, 14.55);
          resolveCircleAABB(pos, PLAYER_RADIUS, -3.92, -3.62, 14.30, 28.55);
        }
      }

      // 5) Furniture Horizontal Colliders inside Sk Arshan Tower (only block when footY is below 50% of furniture height so player can jump onto any bed/commode/sofa/chair/table/car!)
      if (!inTowerStairLane && !environment?.tower?.isInsideLift(pos)) {
        const fBoxes = getFurnitureBoxesForFloor('tower', towerFy);
        for (const box of fBoxes) {
          if (footY < towerFy + box.h * 0.50) {
            resolveCircleAABB(pos, PLAYER_RADIUS * 0.85, box.minX, box.maxX, box.minZ, box.maxZ);
          }
        }
      }
      continue;
      }
    }
  }

  if (!nearTaltolaHouse) return;

  const lpos = { x: pos.x - hx, y: pos.y, z: pos.z - hz };
  let currentLevel = 0;
  for (let sLvl = 0; sLvl <= 5; sLvl++) {
    if (sLvl * 3.05 <= footY + 0.55) currentLevel = sLvl;
  }
  const onStairs = lpos.x >= 7.68 && lpos.x <= 12.12 && lpos.z >= 0.16 && lpos.z <= 1.16;

  for (let iter = 0; iter < 2; iter++) {
    // Taltola House Front Compound Wall & Main Gate (climbable up to y=2.25, Gate Pillars solid up to 3.15!)
    if (footY < 2.22) {
      resolveCircleAABB(lpos, PLAYER_RADIUS, 2.06, 2.86, -7.36, -2.06);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 2.06, 2.86, 2.06, 7.36);

      if (house && !house.state.gateOpen) {
        resolveCircleAABB(lpos, PLAYER_RADIUS, 2.36, 2.66, -2.06, 2.06);
      }

      // Taltola House North, South & Rear Compound Walls + Perimeter Structural Pillars
      resolveCircleAABB(lpos, PLAYER_RADIUS, 2.4, 22.0, -7.52, -7.04);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 2.4, 22.0, 7.04, 7.52);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 21.25, 24.0, -7.52, 7.52);
    }
    // Tall Gate Pillars (with Lamps) & Corner Pillars stay solid up to 3.15m
    if (footY < 3.15) {
      for (const side of [-1, 1]) {
        resolveCircleAABB(lpos, PLAYER_RADIUS, 2.30, 2.96, side * 2.43 - 0.33, side * 2.43 + 0.33);
        resolveCircleAABB(lpos, PLAYER_RADIUS, 2.34, 2.96, side * 7.28 - 0.32, side * 7.28 + 0.32);
      }
    }
    // Courtyard & Backyard Solid Obstacles (Ground Level):
    // 1) Front Entrance Porch Pillars ([5.68, ±0.96])
    // 2) Backyard Clothesline Rack & Poles (x=17.6, z=-4.8..-1.6 — কাপড় নাড়ানোর স্ট্যান্ড!)
    // 3) Backyard Water Tap Pillar & Concrete Basin (x=14.7..15.65, z=3.95..4.88)
    // 4) Backyard Raised Brick Flower Bed (x=20.2..21.3, z=-4.3..4.3)
    // 5) 8 Terracotta Potted Plants & Roadside Utility Poles
    if (footY < 2.65) {
      resolveCircleAABB(lpos, PLAYER_RADIUS, 5.53, 5.83, -1.09, -0.83);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 5.53, 5.83, 0.83, 1.09);
      // Roadside utility poles outside Taltola House
      resolveCircleAABB(lpos, PLAYER_RADIUS, -2.56, -2.14, -18.22, -17.78);
      resolveCircleAABB(lpos, PLAYER_RADIUS, -2.56, -2.14, 17.78, 18.22);
    }
    if (footY < 2.28) {
      // Backyard Clothesline Rack & Hanging Clothes (solid poles & line!)
      resolveCircleAABB(lpos, PLAYER_RADIUS, 17.44, 17.76, -4.86, -1.54);
    }
    if (footY < 0.98) {
      // Backyard Water Tap Pillar & Basin
      resolveCircleAABB(lpos, PLAYER_RADIUS, 14.58, 15.68, 3.92, 4.88);
    }
    if (footY < 0.46) {
      // Backyard Brick Flower Planter Bed
      resolveCircleAABB(lpos, PLAYER_RADIUS, 20.18, 21.32, -4.35, 4.35);
    }
    if (footY < 0.72) {
      for (const [px, pz] of [
        [15.6, -2.1], [15.6, 2.1], [14.7, -4.8], [14.7, 4.8],
        [5.4, -1.45], [5.4, 1.45], [3.3, -3.5], [3.3, 3.5],
      ]) {
        resolveCircleAABB(lpos, PLAYER_RADIUS * 0.85, px - 0.24, px + 0.24, pz - 0.24, pz + 0.24);
      }
    }

    // Rooftop Parapet & Mumty Collisions (Level 5: y ≈ 15.25)
    if (footY >= 14.1) {
      // Stairwell guardrail & Mumty walls on roof
      resolveCircleAABB(lpos, 0.14, 7.86, 11.94, 0.14, 0.20);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 7.50, 13.65, -1.30, -1.12);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 7.50, 13.65, 1.15, 1.32);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 13.45, 13.68, -1.25, 1.25);
      // Rooftop Parapet Walls — only block horizontally when not jumping over them (footY - 15.25 < 0.68)!
      if (footY - 15.25 < 0.68) {
        resolveCircleAABB(lpos, PLAYER_RADIUS, 5.75, 6.02, -5.50, 5.50);
        resolveCircleAABB(lpos, PLAYER_RADIUS, 14.15, 14.42, -5.50, 5.50);
        resolveCircleAABB(lpos, PLAYER_RADIUS, 5.85, 14.35, -5.55, -5.28);
        resolveCircleAABB(lpos, PLAYER_RADIUS, 5.85, 14.35, 5.28, 5.55);
      }
      continue;
    }

    const houseFy = currentLevel * 3.05;

    // Building Exterior Front & Back Walls (x = 6.08 and x = 14.28) — ALWAYS SOLID at ALL jump heights!
    if (currentLevel === 0) {
      resolveCircleAABB(lpos, PLAYER_RADIUS, 5.90, 6.26, -5.50, -0.60);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 5.90, 6.26, 0.60, 5.50);
      if (house && !house.state.frontDoorOpen) {
        resolveCircleAABB(lpos, PLAYER_RADIUS, 5.88, 6.24, -0.64, 0.64);
      }

      resolveCircleAABB(lpos, PLAYER_RADIUS, 14.10, 14.46, -5.50, -0.60);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 14.10, 14.46, 0.60, 5.50);
      if (house && !house.state.backDoorOpen) {
        resolveCircleAABB(lpos, PLAYER_RADIUS, 14.14, 14.48, -0.64, 0.64);
      }
    } else if (currentLevel >= 1 && currentLevel <= 4 && lpos.x >= 4.5 && lpos.x <= 14.6 && Math.abs(lpos.z) <= 5.55) {
      // Upper floors: Front wall (x = 6.08) has open balcony doorways at z ∈ [-3.25, -1.90] (Unit A) and z ∈ [1.90, 3.25] (Unit B)!
      resolveCircleAABB(lpos, PLAYER_RADIUS, 5.94, 6.22, -5.48, -3.25);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 5.94, 6.22, -1.90, 1.90);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 5.94, 6.22, 3.25, 5.48);
      // Back wall
      resolveCircleAABB(lpos, PLAYER_RADIUS, 14.14, 14.46, -5.48, 5.48);
      // Front balcony side walls & jumpable front railing (x = 4.77)
      resolveCircleAABB(lpos, PLAYER_RADIUS, 4.72, 6.08, -5.20, -5.02);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 4.72, 6.08, -1.56, -1.38);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 4.72, 6.08, 1.44, 1.62);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 4.72, 6.08, 5.02, 5.20);
      if (footY - houseFy < 0.68) {
        resolveCircleAABB(lpos, PLAYER_RADIUS, 4.68, 4.86, -5.15, -1.45);
        resolveCircleAABB(lpos, PLAYER_RADIUS, 4.68, 4.86, 1.50, 5.15);
      }
    }

    // Left & Right Exterior Side Walls (z = -5.36 and z = +5.36)
    resolveCircleAABB(lpos, PLAYER_RADIUS, 5.96, 14.40, -5.50, -5.22);
    resolveCircleAABB(lpos, PLAYER_RADIUS, 5.96, 14.40, 5.22, 5.50);

    // Stairwell Handrail Divider (z = 0.17, x = 7.86..11.94, slim 0.14m radius so stair lane has generous width)
    resolveCircleAABB(lpos, 0.14, 7.86, 11.94, 0.14, 0.20);

    // Left Corridor Wall (z = -1.18):
    // Doorway 1 at x = 7.18..8.30 (Flat A Main Door), Doorway 2 at x = 12.10..13.20
    resolveCircleAABB(lpos, PLAYER_RADIUS, 6.05, 7.18, -1.27, -1.09);
    resolveCircleAABB(lpos, PLAYER_RADIUS, 8.30, 12.10, -1.27, -1.09);
    resolveCircleAABB(lpos, PLAYER_RADIUS, 13.20, 14.32, -1.27, -1.09);
    if (house && !house.isFlatDoorOpen(currentLevel, -1)) {
      resolveCircleAABB(lpos, PLAYER_RADIUS, 7.18, 8.30, -1.27, -1.09);
    }

    // Right Corridor Wall (z = +1.18):
    // Doorway 1 at x = 6.38..7.50 (Flat B Main Door), Doorway 2 at x = 12.20..13.30
    resolveCircleAABB(lpos, PLAYER_RADIUS, 6.05, 6.38, 1.09, 1.27);
    resolveCircleAABB(lpos, PLAYER_RADIUS, 7.50, 12.20, 1.09, 1.27);
    resolveCircleAABB(lpos, PLAYER_RADIUS, 13.30, 14.32, 1.09, 1.27);
    if (house && !house.isFlatDoorOpen(currentLevel, 1)) {
      resolveCircleAABB(lpos, PLAYER_RADIUS, 6.38, 7.50, 1.09, 1.27);
    }

    if (onStairs) continue;

    // Interior Room & Bathroom Partitions (x = 9.65, x = 11.45, and Bathroom front wall z = ±2.55)
    for (const side of [-1, 1]) {
      const zSign = side;
      const zMin = zSign === -1 ? -5.36 : 2.40;
      const zMax = zSign === -1 ? -2.40 : 5.36;
      resolveCircleAABB(lpos, PLAYER_RADIUS, 9.56, 9.74, zMin, zMax);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 11.36, 11.54, zMin, zMax);

      // Bathroom wall at z = side * 2.55 with open doorway at x = 10.10..11.00
      const bz = side * 2.55;
      resolveCircleAABB(lpos, PLAYER_RADIUS, 9.65, 10.10, bz - 0.08, bz + 0.08);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 11.00, 11.45, bz - 0.08, bz + 0.08);
    }

    // Furniture Horizontal Colliders inside Taltola House (only block when footY < houseFy + box.h * 0.50 so player can jump onto any bed, commode, sofa, chair, table, or counter!)
    if (lpos.x >= 5.95 && lpos.x <= 14.38 && Math.abs(lpos.z) <= 5.42) {
      const fBoxes = getFurnitureBoxesForFloor('house', houseFy);
      for (const box of fBoxes) {
        if (footY < houseFy + box.h * 0.50) {
          resolveCircleAABB(lpos, PLAYER_RADIUS * 0.85, box.minX, box.maxX, box.minZ, box.maxZ);
        }
      }
    }
  }

  pos.x = lpos.x + hx;
  pos.z = lpos.z + hz;
}

const FLOOR_NAMES_BN = ['নিচতলা (1st Floor)', '২য় তলা (2nd Floor)', '৩য় তলা (3rd Floor)', '৪র্থ তলা (4th Floor)', '৫ম তলা (5th Floor)', 'ছাদ (Rooftop)'];

function updateHUDPrompt() {
  if (!house || !interactPrompt) return;
  let promptText = null;
  if (controls.isLocked || liftKeypadOpen) {
    if (getDrivingCar()) {
      promptText = null;
    } else if (sittingState.active) {
      promptText = `[E / F / SPACE] উঠে দাঁড়ান — ${sittingState.seat?.label || 'আসন'} (Stand Up)`;
    } else {
      const nearSeat = findNearestSeat(playerPos);
      const nearCar = findNearestEnterableCar(playerPos);
      const carPrompt = nearCar ? nearCar.getPrompt(playerPos) : null;
      const doorOrLiftPrompt = environment?.tower?.getPrompt(playerPos) || house.getPrompt(playerPos);
      if (carPrompt && !doorOrLiftPrompt && !nearSeat) {
        promptText = carPrompt;
      } else if (nearSeat && (!doorOrLiftPrompt || nearSeat.dist < 1.25)) {
        promptText = `[E / F] এখানে বসুন: ${nearSeat.label} (Sit Down)`;
      } else if (doorOrLiftPrompt) {
        promptText = doorOrLiftPrompt;
      } else if (nearSeat) {
        promptText = `[E / F] এখানে বসুন: ${nearSeat.label} (Sit Down)`;
      } else if (inWater) {
        promptText = '[SPACE] পানি থেকে লাফিয়ে উঠুন · [WASD] সাঁতার (Swim)';
      } else if (wallAhead && !climbState.active) {
        promptText = '[F / SPACE] দেয়াল বেয়ে উঠুন (Wall Climb)';
      } else {
        promptText = carPrompt || null;
      }
    }
  }
  if (promptText !== lastPromptText) {
    lastPromptText = promptText;
    if (promptText) {
      interactPrompt.textContent = promptText;
      interactPrompt.classList.remove('hidden');
    } else {
      interactPrompt.classList.add('hidden');
    }
  }

  if (locationTagText) {
    const x = playerPos.x;
    const z = playerPos.z;
    const footY = playerPos.y - EYE_HEIGHT;
    const lvl = THREE.MathUtils.clamp(Math.round(footY / 3.05), 0, 5);
    const flName = FLOOR_NAMES_BN[lvl] || FLOOR_NAMES_BN[0];
    const lx = x - TALTOLA_HOUSE_OFFSET.x;
    const lz = z - TALTOLA_HOUSE_OFFSET.z;

    let zone = '';
    if (x < -3.0 && x > -46.0 && z >= 10.0 && z <= 14.25) {
      zone = 'FAKIR BARI LANE · ফকির বাড়ি লেন (পাশের গলি)';
    } else if (x > 3.1 && x < 24.0 && z >= 20.8 && z <= 26.8) {
      zone = "AVIJIT'S SPECIAL BATCH (ASB) · কোচিং কম্পাউন্ড";
    } else if (x > 1.8 && x < 24.0 && z > -28.0 && z < 20.8) {
      zone = 'HAJI MOHSIN RD SHOPS · অঙ্কুর ডায়াগনস্টিক ও দোকানপাট';
    } else if (x <= -2.8 && x >= -19.9 && z >= 14.25 && z <= 28.6) {
      const towerFl = footY < 2.2 ? 0 : Math.min(10, Math.round((footY - 4.0) / 3.0) + 1);
      if (environment?.tower?.isInsideLift(playerPos)) {
        const stopName = environment.tower.stops?.[environment.tower.state.liftFloorIndex]?.nameBn || `${towerFl + 1} তলা`;
        zone = `SK ARSHAN TOWER · ভিআইপি প্যাসেঞ্জার লিফট কেবিন (${stopName})`;
      } else if (towerFl === 0) {
        zone = 'SK ARSHAN ALIF TOWER · গ্র্যান্ড পার্কিং ও রিসেপশন লবি (নিচতলা)';
      } else if (towerFl >= 10 || footY >= 29.8) {
        zone = 'SK ARSHAN ALIF TOWER · ছাদের স্কাই লাউঞ্জ ও গার্ডেন (Rooftop)';
      } else if (x > -4.35 || (x > -5.55 && z >= 18.6 && z <= 23.5)) {
        zone = `SK ARSHAN TOWER (${towerFl + 1} তলা) · সামনের বারান্দা (Balcony View)`;
      } else if (x <= -16.55 && x >= -19.75 && z >= 18.63 && z <= 21.4) {
        zone = `SK ARSHAN TOWER (${towerFl + 1} তলা) · অ্যাটাচড লাক্সারি বাথরুম (Attached Bathroom)`;
      } else if (z >= 18.55 && z <= 23.3) {
        zone = `SK ARSHAN TOWER (${towerFl + 1} তলা) · হাই-স্পিড লিফট ও সিঁড়ি লবি`;
      } else if (z < 18.55) {
        zone = x > -13.3
          ? `SK ARSHAN TOWER (${towerFl + 1} তলা) · নর্থ ফ্ল্যাট — ড্রয়িং রুম ও ৪কে স্মার্ট টিভি লাউঞ্জ`
          : `SK ARSHAN TOWER (${towerFl + 1} তলা) · নর্থ ফ্ল্যাট — মাস্টার বেডরুম`;
      } else {
        zone = x > -13.3
          ? `SK ARSHAN TOWER (${towerFl + 1} তলা) · সাউথ ফ্ল্যাট — ডাইনিং ও মডুলার কিচেন`
          : `SK ARSHAN TOWER (${towerFl + 1} তলা) · সাউথ ফ্ল্যাট — আরজিবি গেমিং ও স্টাডি স্যুট`;
      }
    } else if (lx >= 2.55 && lx <= 22.0 && Math.abs(lz) <= 7.4) {
      if (lvl === 5 && lx >= 5.9 && lx <= 14.4) {
        zone = `TALTOLA HOUSE ROOFTOP · বাড়ির ছাদ (${flName})`;
      } else if (lx > 14.4) {
        zone = 'TALTOLA HOUSE BACKYARD · ঘরের পিছনের উঠান';
      } else if (lvl >= 1 && lvl <= 4 && lx >= 4.72 && lx < 6.08 && Math.abs(lz) <= 5.2) {
        zone = `FLAT ${lvl + 1}${lz < 0 ? 'A' : 'B'} · সামনের বারান্দা (Front Balcony · ${flName})`;
      } else if (lx >= 6.08 && lx <= 14.28 && lz < -1.2 && lz > -5.3 && Math.abs(lz) < 7.2) {
        if (lx < 9.65) zone = `FLAT ${lvl + 1}A · বসার ঘর ও টিভি রুম (${flName})`;
        else if (lx < 11.45 && lz < -2.5) zone = `FLAT ${lvl + 1}A · অ্যাটাচড বাথরুম (${flName})`;
        else zone = `FLAT ${lvl + 1}A · মাস্টার বেডরুম (${flName})`;
      } else if (lx >= 6.08 && lx <= 14.28 && lz > 1.2 && lz < 5.3 && Math.abs(lz) < 7.2) {
        if (lx < 9.65) zone = `FLAT ${lvl + 1}B · ডাইনিং ও ফ্যামিলি রুম (${flName})`;
        else if (lx < 11.45 && lz > 2.5) zone = `FLAT ${lvl + 1}B · অ্যাটাচড বাথরুম (${flName})`;
        else zone = `FLAT ${lvl + 1}B · রান্নাঘর (${flName})`;
      } else if (lx >= 6.0 && lx <= 14.35 && lz <= -5.2 && lz >= -7.3) {
        zone = 'TALTOLA HOUSE · বাম পাশের গলি';
      } else if (lx >= 6.0 && lx <= 14.35 && lz >= 5.2 && lz <= 7.3) {
        zone = 'TALTOLA HOUSE · ডান পাশের গলি';
      } else if (lx >= 6.0 && lx <= 14.35 && Math.abs(lz) < 5.3) {
        zone = `STAIRWELL & CORRIDOR · তালতলার বাসা সিঁড়ি (${flName})`;
      } else {
        zone = 'তালতলার বাসা · FRONT COURTYARD (Tootpara Cross Rd)';
      }
    } else if (Math.abs(lx) < 16 && Math.abs(lz) < 16) {
      zone = 'তালতলার বাসা · TOOTPARA TALTOLA HOSPITAL CROSS RD';
    } else if (Math.abs(x) < 35 && Math.abs(z) < 42) {
      zone = 'HAJI MOHSIN ROAD · হাজী মহসিন রোড, খুলনা';
    } else {
      const info = environment?.city?.findNearestRoadAndDistrict?.(x, z);
      if (info) {
        const sub = info.poi || info.road || 'KHULNA CITY';
        zone = `${info.district} · ${sub}`;
      } else {
        zone = 'KHULNA CITY · OPEN WORLD STREET';
      }
    }
    const drivingCar = getDrivingCar();
    if (drivingCar) {
      zone = `${drivingCar.state.name.toUpperCase()} DRIVING · ${zone}`;
    }
    if (zone !== lastZoneText) {
      lastZoneText = zone;
      locationTagText.innerHTML = `<span class="location-dot"></span> ${zone}`;
    }
  }
}

function updateStudioCamera(delta) {
  if (studioOrbit.autoSpin) {
    studioOrbit.targetAngle += delta * 0.55;
  }
  const smooth = Math.min(1, delta * 9.0);
  studioOrbit.angle += (studioOrbit.targetAngle - studioOrbit.angle) * smooth;
  studioOrbit.pitch += (studioOrbit.targetPitch - studioOrbit.pitch) * smooth;
  studioOrbit.distance += (studioOrbit.targetDistance - studioOrbit.distance) * smooth;
  studioOrbit.targetY += (studioOrbit.targetLookY - studioOrbit.targetY) * smooth;

  const r = studioOrbit.distance;
  // DSLR 85mm portrait lens FOV (24° close-up -> 39° full-body) eliminates wide-angle selfie distortion!
  const fovT = THREE.MathUtils.clamp((r - 1.12) / 1.53, 0, 1);
  const studioFov = THREE.MathUtils.lerp(24.0, 39.0, fovT);
  if (Math.abs(camera.fov - studioFov) > 0.05) {
    camera.fov += (studioFov - camera.fov) * smooth;
    camera.updateProjectionMatrix();
  }
  const cx = Math.sin(studioOrbit.angle) * Math.cos(studioOrbit.pitch) * r;
  const cz = Math.cos(studioOrbit.angle) * Math.cos(studioOrbit.pitch) * r;
  const cy = studioOrbit.targetY + Math.sin(studioOrbit.pitch) * r;

  camera.position.set(cx, cy, cz);
  camera.lookAt(0, studioOrbit.targetY, 0);

  if (playerCharacter) {
    playerCharacter.update(delta, {
      position: playerPos,
      yaw: 0,
      speed: 0,
      maxSpeed: 4.35,
      grounded: true,
      isSprinting: false,
      inStudio: true,
    });
  }
}

function updateMovement(delta) {
  if (!started || (pause && !pause.classList.contains('hidden'))) return;

  // Always update all drivable cars & rickshaws
  if (cars.length) {
    for (const car of cars) {
      car.update(delta, keys, house, environment, cars);
    }
    if (updateVehicleTransition(delta)) {
      return;
    }
    const drivingCar = getDrivingCar();
    if (drivingCar) {
      const st = drivingCar.state;
      playerPos.set(st.pos.x, st.pos.y + EYE_HEIGHT, st.pos.z);

      const sinH = Math.sin(st.heading);
      const cosH = Math.cos(st.heading);
      const speedKmh = Math.abs(st.speed) * 3.6;

      // Dynamic speed-rush FOV while driving
      const targetFov = THREE.MathUtils.clamp(60 + speedKmh * 0.12, 60, 75);
      if (Math.abs(camera.fov - targetFov) > 0.05) {
        camera.fov += (targetFov - camera.fov) * Math.min(1, delta * 7.5);
        camera.updateProjectionMatrix();
      }

      if (st.cameraMode === 'hood') {
        const eyeBack = (st.isRickshaw && st.rideSeat === 'passenger') ? -0.58 : st.hoodForward;
        const eyeH = (st.isRickshaw && st.rideSeat === 'passenger') ? 1.48 : st.hoodHeight;
        carCamDesired.set(st.pos.x + sinH * eyeBack, st.pos.y + eyeH, st.pos.z + cosH * eyeBack);
        carCamLookTarget.set(st.pos.x + sinH * 14.0, st.pos.y + eyeH - 0.16, st.pos.z + cosH * 14.0);
        camera.position.copy(carCamDesired);
        camera.lookAt(carCamLookTarget);
      } else if (st.cameraMode === 'front') {
        carCamDesired.set(st.pos.x + sinH * 4.4, st.pos.y + 1.55, st.pos.z + cosH * 4.4);
        carCamLookTarget.set(st.pos.x, st.pos.y + 1.0, st.pos.z);
        camera.position.lerp(carCamDesired, Math.min(1, delta * 9.0));
        camera.lookAt(carCamLookTarget);
      } else {
        // Dynamic smooth Chase Cam behind the active car or rickshaw
        const backDist = st.camBack + Math.min(1.4, speedKmh * 0.014);
        carCamDesired.set(st.pos.x - sinH * backDist, st.pos.y + st.camHeight, st.pos.z - cosH * backDist);
        carCamLookTarget.set(st.pos.x + sinH * 4.5, st.pos.y + 1.05, st.pos.z + cosH * 4.5);
        camera.position.lerp(carCamDesired, Math.min(1, delta * 8.5));
        camera.lookAt(carCamLookTarget);
      }

      if (playerCharacter) {
        if (st.isRickshaw) {
          const anchors = drivingCar.getRickshawAnchors?.();
          const isPassenger = st.rideSeat === 'passenger';
          const seatBackOffset = isPassenger ? 0.62 : 0.05;
          const riderPos = {
            x: st.pos.x - sinH * seatBackOffset,
            y: st.pos.y + EYE_HEIGHT,
            z: st.pos.z - cosH * seatBackOffset,
          };
          playerCharacter.update(delta, {
            position: riderPos,
            yaw: st.heading + Math.PI,
            speed: Math.abs(st.speed),
            maxSpeed: 8.0,
            grounded: true,
            isSprinting: false,
            inStudio: false,
            hideMesh: st.cameraMode === 'hood',
            rickshawRide: {
              active: true,
              seat: st.rideSeat,
              heading: st.heading,
              pedalPhase: st.pedalPhase,
              steerAngle: st.steerAngle,
              speed: st.speed,
              anchors,
            },
          });
        } else {
          playerCharacter.update(delta, {
            position: playerPos,
            yaw: st.heading + Math.PI,
            speed: 0,
            maxSpeed: 3.45,
            grounded: true,
            isSprinting: false,
            inStudio: false,
            hideMesh: true,
          });
        }
      }

      syncCarHUD();
      updateHUDPrompt();
      return;
    }
  }

  const turnInput = Number(keys.has('KeyQ'));
  if (turnInput !== 0) {
    controls.euler.setFromQuaternion(camera.quaternion, 'YXZ');
    controls.euler.y += turnInput * 1.8 * delta;
    camera.quaternion.setFromEuler(controls.euler);
  }

  const forwardInput = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown'));
  const rightInput = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));

  // If currently seated on a chair, sofa, bed, or toilet commode:
  if (sittingState.active && sittingState.seat) {
    if (forwardInput !== 0 || rightInput !== 0 || jumpBuffer > 0) {
      jumpBuffer = 0;
      standUpFromSeat();
    } else {
      const seat = sittingState.seat;
      playerPos.x = seat.seatX;
      playerPos.z = seat.seatZ;
      playerPos.y = seat.fy + seat.seatY + EYE_HEIGHT - 0.42;
      controls.getHorizontalVectors(forwardVec, rightVec);
      controls.euler.setFromQuaternion(camera.quaternion, 'YXZ');

      let sitHideMesh = false;
      if (playerCharacter && playerCharacter.state.cameraMode !== 'first') {
        // Place camera in front of the seat (into the open room) and clamp against any nearby walls!
        const angleOffset = playerCharacter.state.cameraMode === 'front' ? 0.16 : -0.36;
        const camAngle = seat.yaw + angleOffset;
        const camDist = 1.48;
        camPivotPos.set(seat.seatX, seat.fy + 1.38, seat.seatZ);
        camDesiredPos.set(
          seat.seatX + Math.sin(camAngle) * camDist,
          seat.fy + 1.38,
          seat.seatZ + Math.cos(camAngle) * camDist
        );
        const camRes = resolveThirdPersonCamera(camPivotPos, camDesiredPos, seat.fy, delta, true, false);
        sitHideMesh = camPivotPos.distanceTo(camRes.camPos) < 0.34;
        if (sitHideMesh) camRes.camPos.set(seat.seatX, seat.fy + 1.28, seat.seatZ);
        isThirdPersonEyeFallback = sitHideMesh;
        lastResolvedCamMode = playerCharacter.state.cameraMode;
        camera.position.copy(camRes.camPos);
      } else {
        isThirdPersonEyeFallback = false;
        lastResolvedCamMode = 'first';
        camera.position.copy(playerPos);
      }
      crosshairEl?.classList.toggle('hidden', !isThirdPersonEyeFallback && (!playerCharacter || playerCharacter.state.cameraMode !== 'first'));

      if (playerCharacter) {
        playerCharacter.state.emote = 'sit';
        playerCharacter.state.facingYaw = seat.yaw;
        playerCharacter.update(delta, {
          position: { x: seat.seatX, y: seat.fy + EYE_HEIGHT + (seat.seatY - 0.34), z: seat.seatZ },
          yaw: controls.euler.y,
          speed: 0,
          maxSpeed: 3.45,
          grounded: true,
          isSprinting: false,
          inStudio: false,
          hideMesh: sitHideMesh,
        });
      }

      if (indoorLight) {
        indoorLight.visible = quality !== 'low' && quality !== 'medium';
        indoorLight.position.set(playerPos.x, playerPos.y + 0.65, playerPos.z);
      }
      updateHUDPrompt();
      return;
    }
  }

  controls.getHorizontalVectors(forwardVec, rightVec);
  wishDir.set(0, 0, 0)
    .addScaledVector(forwardVec, forwardInput)
    .addScaledVector(rightVec, rightInput);
  if (wishDir.lengthSq() > 1) wishDir.normalize();

  if (landRecoveryTimer > 0) {
    landRecoveryTimer = Math.max(0, landRecoveryTimer - delta);
    if (landRecoveryTimer <= 0) landRecoveryClip = null;
  }

  const isMovingInput = wishDir.lengthSq() > 0.01;
  const isSprinting = isMovingInput && !climbState.active && !diveState.active && (
    shiftHeld
    || keys.has('ShiftLeft')
    || keys.has('ShiftRight')
    || runModeToggle
    || doubleTapSprint
  );

  let maxSpeed = inWater ? (isSprinting ? 4.4 : 2.9) : (isSprinting ? 7.65 : 3.45);
  if (landRecoveryTimer > 0) maxSpeed *= 0.45;

  if (climbState.active) {
    climbState.timer += delta;
    const t = Math.min(1, climbState.timer / climbState.duration);
    // Smooth climb curve: rise vertically up wall first, then mantle forward onto ledge
    const liftT = Math.min(1, t / 0.78);
    const mantleT = Math.max(0, (t - 0.55) / 0.45);
    const easeLift = liftT * (2 - liftT);
    const easeMantle = mantleT * mantleT * (3 - 2 * mantleT);
    playerPos.x = THREE.MathUtils.lerp(climbState.startX, climbState.targetX, easeMantle);
    playerPos.z = THREE.MathUtils.lerp(climbState.startZ, climbState.targetZ, easeMantle);
    playerPos.y = THREE.MathUtils.lerp(climbState.startY, climbState.targetY, easeLift);
    if (t > 0.55) {
      applyWorldCollisions(playerPos);
    }
    horizontalVelocity.set(0, 0);
    verticalVelocity = 0;
    grounded = false;
    airPeakY = playerPos.y;
    if (t >= 1) {
      climbState.active = false;
      verticalVelocity = 1.1;
    }
  } else if (diveState.active) {
    diveState.timer += delta;
    const t = Math.min(1, diveState.timer / diveState.duration);
    const lungeSpeed = (1 - t * 0.65) * 6.4;
    horizontalVelocity.set(diveState.dirX * lungeSpeed, diveState.dirZ * lungeSpeed);
    playerPos.x += horizontalVelocity.x * delta;
    playerPos.z += horizontalVelocity.y * delta;
    applyWorldCollisions(playerPos);
    if (t >= 1) {
      diveState.active = false;
    }
  } else {
    const targetVx = wishDir.x * maxSpeed;
    const targetVz = wishDir.z * maxSpeed;
    const accel = (isMovingInput ? (inWater ? 10.0 : 24.0) : (inWater ? 6.0 : 15.0)) * delta;
    horizontalVelocity.x += (targetVx - horizontalVelocity.x) * Math.min(1, accel);
    horizontalVelocity.y += (targetVz - horizontalVelocity.y) * Math.min(1, accel);

    playerPos.x += horizontalVelocity.x * delta;
    playerPos.z += horizontalVelocity.y * delta;
    applyWorldCollisions(playerPos);
  }

  // Smooth dynamic speed-rush FOV boost (and natural portrait FOV when viewing face in Front camera!)
  const isFrontCam = playerCharacter?.state?.cameraMode === 'front';
  const targetFov = isFrontCam ? (isSprinting ? 48.0 : 42.0) : (isSprinting ? 67.5 : 60.0);
  if (Math.abs(camera.fov - targetFov) > 0.05) {
    camera.fov += (targetFov - camera.fov) * Math.min(1, delta * 8.5);
    camera.updateProjectionMatrix();
  }
  syncHUDButtons(isSprinting);

  const insideLiftNow = Boolean(environment?.tower?.isInsideLift(playerPos));
  if (insideLiftNow && !wasInsideLift) {
    openLiftKeypad();
  } else if (!insideLiftNow && wasInsideLift && liftKeypadOpen) {
    closeLiftKeypad(true);
  }
  wasInsideLift = insideLiftNow;

  if (liftKeypadOpen) {
    syncLiftKeypadUI();
  }

  const groundY = computeGroundHeight(playerPos);
  const targetEyeY = groundY + EYE_HEIGHT;

  // Detect water entry (Hadis Park Lake, Alia Madrasah Pond, Rupsha River — only when not standing high on piers/bridges!)
  const overWaterPoly = Boolean(environment?.city?.isInWater?.(playerPos.x, playerPos.z));
  inWater = overWaterPoly && groundY <= 0.22 && !climbState.active && playerPos.y <= EYE_HEIGHT + 0.35;

  // Probe wall ahead for interactive Wall Climb ([SPACE] against wall or [F] Wall Climb)
  wallAhead = !inWater && !climbState.active && probeWallAhead();

  if (grounded || inWater) coyoteTimer = 0.12;
  else coyoteTimer = Math.max(0, coyoteTimer - delta);

  if (jumpBuffer > 0) jumpBuffer = Math.max(0, jumpBuffer - delta);

  if (!climbState.active && jumpBuffer > 0 && coyoteTimer > 0 && !(insideLiftNow && environment?.tower?.state?.liftPhase === 'moving')) {
    if (wallAhead && forwardInput > 0.2 && !inWater) {
      // Automatic Wall Climb when jumping forward into a wall/railing/compound wall!
      jumpBuffer = 0;
      coyoteTimer = 0;
      startWallClimb();
    } else {
      const doFlip = isSprinting && !inWater && !diveState.active;
      verticalVelocity = inWater ? 6.45 : (doFlip ? 6.95 : 6.25);
      isFlipping = doFlip;
      grounded = false;
      inWater = false;
      coyoteTimer = 0;
      jumpBuffer = 0;
      airPeakY = playerPos.y;
      landRecoveryTimer = 0;
      landRecoveryClip = null;
    }
  }

  if (climbState.active) {
    // Climb arc controls playerPos.y directly
  } else if (inWater) {
    const waterEyeY = EYE_HEIGHT - 0.55;
    playerPos.y += (waterEyeY - playerPos.y) * Math.min(1, delta * 9.0);
    verticalVelocity = 0;
    grounded = true;
    isFlipping = false;
    airPeakY = playerPos.y;
  } else if (insideLiftNow && grounded) {
    playerPos.y = targetEyeY;
    verticalVelocity = 0;
    airPeakY = playerPos.y;
  } else if (grounded && Math.abs(playerPos.y - targetEyeY) <= 0.95) {
    playerPos.y += (targetEyeY - playerPos.y) * Math.min(1, delta * 22.0);
    verticalVelocity = 0;
    airPeakY = playerPos.y;
  } else {
    grounded = false;
    verticalVelocity -= 14.8 * delta;
    playerPos.y += verticalVelocity * delta;
    if (playerPos.y > airPeakY) airPeakY = playerPos.y;
    if (verticalVelocity <= 0 && playerPos.y <= targetEyeY) {
      const dropH = airPeakY - targetEyeY;
      playerPos.y = targetEyeY;
      verticalVelocity = 0;
      grounded = true;
      isFlipping = false;
      if (dropH > 5.2) {
        landRecoveryClip = 'HitBody';
        landRecoveryTimer = 0.72;
      } else if (dropH > 1.55) {
        landRecoveryClip = 'JumpDown';
        landRecoveryTimer = 0.85;
      }
      airPeakY = playerPos.y;
    }
  }

  const speedMag = horizontalVelocity.length();
  controls.euler.setFromQuaternion(camera.quaternion, 'YXZ');

  const camFootY = playerPos.y - EYE_HEIGHT;
  const lxCam = playerPos.x - TALTOLA_HOUSE_OFFSET.x;
  const lzCam = playerPos.z - TALTOLA_HOUSE_OFFSET.z;
  const insideHouse = (lxCam > 4.7 && lxCam < 14.6 && Math.abs(lzCam) < 5.3)
    || (playerPos.x < -2.8 && playerPos.x > -19.9 && playerPos.z > 14.3 && playerPos.z < 28.6);

  if (indoorLight) {
    indoorLight.visible = insideHouse && quality !== 'low' && quality !== 'medium';
    if (indoorLight.visible) {
      indoorLight.position.set(playerPos.x, playerPos.y + 0.55, playerPos.z);
    }
  }

  const activeCamMode = playerCharacter ? playerCharacter.state.cameraMode : 'first';
  const camModeChanged = activeCamMode !== lastResolvedCamMode;
  lastResolvedCamMode = activeCamMode;
  let hidePlayerMesh = false;

  if (playerCharacter && activeCamMode === 'back') {
    const followDist = insideLiftNow ? 0.72 : (insideHouse ? 1.15 : 1.95);
    const pitchLift = THREE.MathUtils.clamp(-controls.euler.x * 0.42, -0.32, 0.42);
    camDesiredPos.copy(playerPos).addScaledVector(forwardVec, -followDist);
    camDesiredPos.y = THREE.MathUtils.clamp(
      playerPos.y + (insideHouse ? 0.12 : 0.22) + pitchLift,
      camFootY + 0.40,
      camFootY + (insideHouse ? 2.26 : 2.85),
    );
    // If direct behind-the-back arm hits a curb/wall within < 0.85m, gently peek over open shoulder first
    if (!insideLiftNow) {
      const centerT = castCamFrustumRay(playerPos.x, playerPos.y, playerPos.z, camDesiredPos.x, camDesiredPos.y, camDesiredPos.z, 0.22);
      if (centerT * followDist < 0.85) {
        let bestT = centerT;
        for (const sideSign of [1, -1]) {
          camShoulderProbe.copy(camDesiredPos).addScaledVector(rightVec, sideSign * 0.46);
          const sideT = castCamFrustumRay(playerPos.x, playerPos.y, playerPos.z, camShoulderProbe.x, camShoulderProbe.y, camShoulderProbe.z, 0.22);
          if (sideT > bestT + 0.12) {
            bestT = sideT;
            camDesiredPos.copy(camShoulderProbe);
          }
        }
      }
    }
    const camRes = resolveThirdPersonCamera(playerPos, camDesiredPos, camFootY, delta, camModeChanged, true);
    hidePlayerMesh = camRes.hidePlayerMesh;
    camera.position.copy(camRes.camPos);
  } else if (playerCharacter && activeCamMode === 'front') {
    camDesiredPos.copy(playerPos).addScaledVector(forwardVec, insideLiftNow ? 0.72 : 1.15);
    camDesiredPos.y = playerPos.y - 0.08;
    const camRes = resolveThirdPersonCamera(playerPos, camDesiredPos, camFootY, delta, camModeChanged, true);
    hidePlayerMesh = camRes.hidePlayerMesh;
    camera.position.copy(camRes.camPos);
  } else {
    isThirdPersonEyeFallback = false;
    smoothedCamDist = 0.0;
    camHideMeshState = false;
    if (baseCamNear > 0) syncCameraNear(baseCamNear);
    if (grounded && speedMag > 0.35) {
      bobPhase += delta * (isSprinting ? 13.5 : 9.5);
      const bobOffset = Math.sin(bobPhase) * 0.036 * Math.min(1, speedMag / maxSpeed);
      camera.position.set(playerPos.x, playerPos.y + bobOffset, playerPos.z);
    } else {
      camera.position.copy(playerPos);
    }
  }
  crosshairEl?.classList.toggle('hidden', activeCamMode !== 'first' && !isThirdPersonEyeFallback);

  const isFallingNow = !grounded && !inWater && !climbState.active && !isFlipping && (
    verticalVelocity < -3.6
    || (verticalVelocity < -1.4 && (playerPos.y - targetEyeY) > 1.35)
    || (airPeakY - playerPos.y) > 1.45
  );

  if (playerCharacter) {
    playerCharacter.update(delta, {
      position: playerPos,
      yaw: controls.euler.y,
      speed: speedMag,
      maxSpeed,
      grounded,
      isSprinting,
      isFalling: isFallingNow,
      isFlipping,
      isClimbing: climbState.active,
      isDiving: diveState.active,
      isSwimming: inWater,
      landRecoveryClip: landRecoveryTimer > 0 ? landRecoveryClip : null,
      moveDirX: wishDir.x,
      moveDirZ: wishDir.z,
      inStudio: false,
      hideMesh: hidePlayerMesh,
    });
    syncEmoteUI(playerCharacter.state.emote);
  }

  updateHUDPrompt();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer?.setSize(window.innerWidth, window.innerHeight);
  bloomPass?.setSize?.(
    Math.max(256, Math.floor(window.innerWidth * 0.5)),
    Math.max(144, Math.floor(window.innerHeight * 0.5))
  );
});

let fpsFrames = 0;
let fpsTime = performance.now();
function animate() {
  if (!ready) return;
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;
  const isLow = quality === 'low';

  if (inStudio) {
    updateStudioCamera(delta);
    renderer.render(scene, camera);
  } else {
    if (environment?.tower) environment.tower.update(delta, playerPos, isLow);
    updateMovement(delta);
    // Smart indoor building & exterior culling + active chunk streaming across Khulna City
    const { nearTaltolaVis, deepInTowerUpper } = syncSceneVisibility();
    const activeCar = getDrivingCar();
    if (sun?.castShadow && !isLow) {
      updateSunShadowTarget(activeCar ? activeCar.state.pos : playerPos);
    }
    if (house && nearTaltolaVis && !deepInTowerUpper) house.update(delta, playerPos, isLow);
    if (skySystem) skySystem.update(elapsed, camera.position);
    if (environment && !isLow && !deepInTowerUpper) environment.update(elapsed, playerPos);

    const nowPerf = performance.now();
    if (khulnaMapUI && !khulnaMapUI.isOpen && nowPerf - lastMinimapUpdate > 100) {
      lastMinimapUpdate = nowPerf;
      controls.euler.setFromQuaternion(camera.quaternion, 'YXZ');
      const info = environment?.city?.findNearestRoadAndDistrict?.(playerPos.x, playerPos.z);
      khulnaMapUI.renderMinimap(playerPos, controls.euler.y, info);
    }

    if (!started) {
      const orbitCx = TALTOLA_HOUSE_OFFSET.x;
      const orbitCz = TALTOLA_HOUSE_OFFSET.z;
      camera.position.set(orbitCx - 6.0, 4.6, orbitCz + 10.5 + Math.sin(elapsed * 0.12) * 0.25);
      camera.lookAt(orbitCx + 4.6, 4.4, orbitCz);
      renderActiveScene();
    } else if (sittingState.active && sittingState.seat && playerCharacter && playerCharacter.state.cameraMode !== 'first' && !isThirdPersonEyeFallback) {
      savedCameraQuat.copy(camera.quaternion);
      camera.lookAt(sittingState.seat.seatX, sittingState.seat.fy + 0.92, sittingState.seat.seatZ);
      renderActiveScene();
      camera.quaternion.copy(savedCameraQuat);
    } else if (!activeCar && playerCharacter && playerCharacter.state.cameraMode === 'front' && !isThirdPersonEyeFallback) {
      savedCameraQuat.copy(camera.quaternion);
      camera.lookAt(playerPos.x, playerPos.y - 0.12, playerPos.z);
      renderActiveScene();
      camera.quaternion.copy(savedCameraQuat);
    } else {
      renderActiveScene();
    }
  }

  fpsFrames++;
  const now = performance.now();
  if (now - fpsTime > 800) {
    const currentFps = Math.round((fpsFrames * 1000) / (now - fpsTime));
    fpsLabel.textContent = `${currentFps} FPS`;
    // Smooth GPU/UI perf adaptation ONLY when user has NOT manually locked High HD / Ultra 4K
    const manualQualityLock = Boolean(localStorage.getItem('taltola_quality_manual'));
    if (ready && !inStudio && !manualQualityLock) {
      if (currentFps < 20 && quality !== 'low') {
        lowFpsStreak++;
        if (lowFpsStreak >= 3) {
          applyQuality(quality === 'ultra' ? 'high' : (quality === 'high' ? 'medium' : 'low'));
          lowFpsStreak = 0;
        }
      } else if (quality === 'low' && !ultraFastMode) {
        if (currentFps < 15) {
          lowFpsStreak++;
          if (lowFpsStreak >= 3) {
            setUltraFastPerf(true);
          }
        } else {
          lowFpsStreak = 0;
        }
      } else {
        lowFpsStreak = 0;
      }
    }
    fpsFrames = 0;
    fpsTime = now;
  }
}

renderer.setAnimationLoop(animate);
initialize().catch((error) => {
  console.error(error);
  loadingStatus.textContent = 'The scene could not be initialized. Check the console for details.';
});
