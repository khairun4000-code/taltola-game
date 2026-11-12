import * as THREE from 'three';
import { FirstPersonControls } from './controls.js';
import { createMaterials } from './materials.js';
import { buildHouse } from './house.js';
import { buildEnvironment } from './environment.js';
import { createPlayerCharacter } from './character.js';
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
const liftHudButton = document.querySelector('#lift-hud-button');
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
];
const referenceModal = document.querySelector('#reference-modal');
const fpsLabel = document.querySelector('#fps');
const brandTitle = document.querySelector('#brand-title');
const brandSubtitle = document.querySelector('#brand-subtitle');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.shadowMap.enabled = false;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x18211e);
scene.fog = new THREE.Fog(0xcfe0e6, 55, 130);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.08, 175);

function renderActiveScene() {
  renderer.render(scene, camera);
}

const controls = new FirstPersonControls(camera, renderer.domElement);
const clock = new THREE.Clock();
const keys = new Set();

const EYE_HEIGHT = 1.68;
const PLAYER_RADIUS = 0.34;
const playerPos = new THREE.Vector3(-0.2, EYE_HEIGHT, 2.2);
const savedCameraQuat = new THREE.Quaternion();

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
const horizontalVelocity = new THREE.Vector2(0, 0);
const forwardVec = new THREE.Vector3();
const rightVec = new THREE.Vector3();
const wishDir = new THREE.Vector3();

// Studio Orbit Camera State
const studioOrbit = {
  angle: 0.0,
  pitch: 0.05,
  distance: 1.95,
  targetY: 1.02,
  targetAngle: 0.0,
  targetPitch: 0.05,
  targetDistance: 1.95,
  targetLookY: 1.02,
  autoSpin: false,
  dragging: false,
  lastX: 0,
  lastY: 0,
};

let quality = localStorage.getItem('taltola_quality') || 'medium';
if (!['low', 'medium', 'high', 'ultra'].includes(quality)) quality = 'medium';
let sceneMaterials;
let environment;
let house;
let studioGroup;
let playerCharacter;
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
const camSlideCandPos = new THREE.Vector3();
const camBestPos = new THREE.Vector3();
const camTmpPos = new THREE.Vector3();
const camSideVec = new THREE.Vector3();
const camUpVec = new THREE.Vector3(0, 1, 0);
const camSpreadDir = new THREE.Vector3();
const camLookAtQuat = new THREE.Quaternion();
const camLookTarget = new THREE.Vector3();
let baseCamNear = 0;
let smoothedCamDist = 1.95;
let camSlideOffsetX = 0;
let camSlideOffsetZ = 0;
let prevSlideSign = 0;
let camLookAtPlayerAlpha = 0;
let camHideMeshState = false;
let isThirdPersonEyeFallback = false;
let lastResolvedCamMode = null;
let ultraFastMode = false;
let lowFpsStreak = 0;

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

function pushHouseSlabCutouts(y0, y1) {
  pushCamBox(6.0, 14.35, y0, y1, -5.40, 0.16);
  pushCamBox(6.0, 14.35, y0, y1, 1.16, 5.40);
  pushCamBox(6.0, 7.65, y0, y1, 0.16, 1.16);
  pushCamBox(12.10, 14.35, y0, y1, 0.16, 1.16);
}

function collectCameraObstacleBoxes(pivot, footY) {
  camBoxCount = 0;

  // 0. Outdoor street ground plane so camera never dips under roads/earth
  pushCamBox(-60, 40, -1.5, -0.02, -50, 50);

  // 1. Outdoor roadside structures & compound boundaries (when below rooftop elevation)
  if (footY < 16.0) {
    pushCamBox(-46.0, -2.92, 0, 2.2, -42.0, 10.22);
    pushCamBox(-46.0, -19.85, 0, 14.0, 14.26, 42.0);
    pushCamBox(-19.85, -3.22, 0, 15.0, 28.58, 42.0);
    pushCamBox(-46.0, -42.45, 0, 12.0, 9.0, 15.5);
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

  // 3. 5-Story Taltola House (active whenever player is inside or nearby)
  if (pivot.x > 0.2 && Math.abs(pivot.z) < 12.0) {
    let currentLevel = 0;
    for (let sLvl = 0; sLvl <= 5; sLvl++) {
      if (sLvl * 3.05 <= footY + 0.55) currentLevel = sLvl;
    }

    if (footY < 3.4) {
      pushCamBox(2.36, 2.66, 0, 2.35, -42, -2.06);
      pushCamBox(2.36, 2.66, 0, 2.35, 2.06, 7.36);
      if (house && !house.state.gateOpen) {
        pushCamBox(2.36, 2.66, 0, 2.35, -2.06, 2.06);
      }
      pushCamBox(2.4, 22.0, 0, 2.45, -20.0, -7.08);
      pushCamBox(2.4, 22.0, 0, 2.45, 7.08, 7.48);
    }

    if (footY < 15.6) {
      // Side walls & Back wall across all 5 floors
      pushCamBox(5.96, 14.40, 0, 15.30, -5.50, -5.22);
      pushCamBox(5.96, 14.40, 0, 15.30, 5.22, 5.50);
      pushCamBox(14.12, 14.46, 3.05, 15.30, -5.48, 5.48);

      // Ground floor front & back walls with openable doors
      pushCamBox(5.92, 6.24, 0, 3.05, -5.48, -0.60);
      pushCamBox(5.92, 6.24, 0, 3.05, 0.60, 5.48);
      pushCamBox(5.92, 6.24, 2.30, 3.05, -0.64, 0.64);
      if (house && !house.state.frontDoorOpen) {
        pushCamBox(5.88, 6.20, 0, 2.35, -0.64, 0.64);
      }
      pushCamBox(14.12, 14.44, 0, 3.05, -5.48, -0.60);
      pushCamBox(14.12, 14.44, 0, 3.05, 0.60, 5.48);
      pushCamBox(14.12, 14.44, 2.30, 3.05, -0.64, 0.64);
      if (house && !house.state.backDoorOpen) {
        pushCamBox(14.16, 14.48, 0, 2.35, -0.64, 0.64);
      }

      if (currentLevel === 0) {
        pushCamBox(6.0, 14.35, -0.05, 0.08, -5.40, 5.40);
      } else if (currentLevel >= 1 && currentLevel <= 4) {
        const floorY = currentLevel * 3.05;
        pushHouseSlabCutouts(floorY - 0.14, floorY + 0.09);
        pushCamBox(4.72, 6.08, floorY - 0.14, floorY + 0.09, -5.20, -1.38);
        pushCamBox(4.72, 6.08, floorY - 0.14, floorY + 0.09, 1.44, 5.20);
      }
      if (currentLevel <= 4) {
        const ceilY = (currentLevel + 1) * 3.05;
        pushHouseSlabCutouts(ceilY - 0.14, ceilY + 0.09);
        if (currentLevel < 4) {
          pushCamBox(4.72, 6.08, ceilY - 0.14, ceilY + 0.09, -5.20, -1.38);
          pushCamBox(4.72, 6.08, ceilY - 0.14, ceilY + 0.09, 1.44, 5.20);
        }
      }

      const maxLvl = Math.min(4, (footY - currentLevel * 3.05 > 1.35) ? currentLevel + 1 : currentLevel);
      for (let lvl = Math.min(4, currentLevel); lvl <= maxLvl; lvl++) {
        const fy = lvl * 3.05;
        const wTop = fy + 3.05;

        if (lvl >= 1) {
          // Upper floor front exterior wall with open balcony doorways
          pushCamBox(5.94, 6.22, fy, wTop, -5.48, -3.25);
          pushCamBox(5.94, 6.22, fy, wTop, -1.90, 1.90);
          pushCamBox(5.94, 6.22, fy, wTop, 3.25, 5.48);
          pushCamBox(5.94, 6.22, fy + 2.32, wTop, -3.25, -1.90);
          pushCamBox(5.94, 6.22, fy + 2.32, wTop, 1.90, 3.25);
          pushCamBox(4.72, 6.08, fy, wTop, -5.20, -5.02);
          pushCamBox(4.72, 6.08, fy, wTop, -1.56, -1.38);
          pushCamBox(4.72, 6.08, fy, wTop, 1.44, 1.62);
          pushCamBox(4.72, 6.08, fy, wTop, 5.02, 5.20);
        }

        // Corridor walls (with doorways & openable flat doors)
        pushCamBox(6.05, 7.18, fy, wTop, -1.27, -1.09);
        pushCamBox(8.30, 12.10, fy, wTop, -1.27, -1.09);
        pushCamBox(13.20, 14.32, fy, wTop, -1.27, -1.09);
        pushCamBox(7.18, 8.30, fy + 2.24, wTop, -1.27, -1.09);
        pushCamBox(12.10, 13.20, fy + 2.24, wTop, -1.27, -1.09);
        if (house && !house.isFlatDoorOpen(lvl, -1)) {
          pushCamBox(7.18, 8.30, fy, fy + 2.26, -1.27, -1.09);
        }

        pushCamBox(6.05, 6.38, fy, wTop, 1.09, 1.27);
        pushCamBox(7.50, 12.20, fy, wTop, 1.09, 1.27);
        pushCamBox(13.30, 14.32, fy, wTop, 1.09, 1.27);
        pushCamBox(6.38, 7.50, fy + 2.24, wTop, 1.09, 1.27);
        pushCamBox(12.20, 13.30, fy + 2.24, wTop, 1.09, 1.27);
        if (house && !house.isFlatDoorOpen(lvl, 1)) {
          pushCamBox(6.38, 7.50, fy, fy + 2.26, 1.09, 1.27);
        }

        // Interior room & bathroom partitions
        for (const side of [-1, 1]) {
          const zMin = side === -1 ? -5.36 : 2.40;
          const zMax = side === -1 ? -2.40 : 5.36;
          const bz = side * 2.55;
          pushCamBox(9.56, 9.74, fy, wTop, zMin, zMax);
          pushCamBox(11.36, 11.54, fy, wTop, zMin, zMax);
          pushCamBox(9.56, 9.74, fy + 2.28, wTop, side * 1.27, side * 2.40);
          pushCamBox(11.36, 11.54, fy + 2.28, wTop, side * 1.27, side * 2.40);
          pushCamBox(9.65, 10.10, fy, wTop, bz - 0.08, bz + 0.08);
          pushCamBox(11.00, 11.45, fy, wTop, bz - 0.08, bz + 0.08);
          pushCamBox(10.10, 11.00, fy + 2.24, wTop, bz - 0.08, bz + 0.08);
        }

        const fBoxes = getFurnitureBoxesForFloor('house', fy);
        for (const box of fBoxes) {
          if (box.h >= 1.75) {
            pushCamBox(box.minX, box.maxX, fy, fy + box.h, box.minZ, box.maxZ);
          }
        }
      }
    }

    // House rooftop slab & mumty room
    if (footY >= 14.0) {
      pushHouseSlabCutouts(15.11, 15.34);
      pushCamBox(7.50, 13.65, 15.25, 18.0, -1.30, -1.12);
      pushCamBox(7.50, 13.65, 15.25, 18.0, 1.15, 1.32);
      pushCamBox(13.45, 13.68, 15.25, 18.0, -1.25, 1.25);
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
    const spreadPad = Math.max(0.14, basePad - 0.07);
    const sx = camSideVec.x * 0.22;
    const sz = camSideVec.z * 0.22;
    const sy = 0.13;
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

const CAM_ESCAPE_ANGLES = [
  Math.PI / 6, -Math.PI / 6,
  Math.PI / 3, -Math.PI / 3,
  Math.PI * 0.48, -Math.PI * 0.48,
  Math.PI * 0.64, -Math.PI * 0.64,
];

function resolveThirdPersonCamera(pivot, desiredPos, footY, delta, bypassSmoothing = false, allowEyeFallback = true, canSlide = false) {
  if (baseCamNear === 0) baseCamNear = camera.near;
  collectCameraObstacleBoxes(pivot, footY);
  camRayDelta.subVectors(desiredPos, pivot);
  const desiredDist = camRayDelta.length();
  if (desiredDist < 0.001) {
    isThirdPersonEyeFallback = false;
    camLookAtPlayerAlpha = 0;
    syncCameraNear(baseCamNear);
    return { camPos: desiredPos, hidePlayerMesh: false };
  }

  if (bypassSmoothing) {
    camSlideOffsetX = 0;
    camSlideOffsetZ = 0;
    prevSlideSign = 0;
    camLookAtPlayerAlpha = 0;
  }

  const ox = pivot.x;
  const oy = pivot.y;
  const oz = pivot.z;
  const dx = camRayDelta.x;
  const dy = camRayDelta.y;
  const dz = camRayDelta.z;

  // Keep target endpoint clear of parallel side walls BEFORE casting so narrow corridors don't false-clip
  camSlideCandPos.copy(desiredPos);
  resolveCamXZClearance(camSlideCandPos, 0.39, oy, pivot);
  const rawT = castCamFrustumRay(ox, oy, oz, desiredPos.x, desiredPos.y, desiredPos.z, 0.22);
  const adjT = castCamFrustumRay(ox, oy, oz, camSlideCandPos.x, camSlideCandPos.y, camSlideCandPos.z, 0.22);

  camBestPos.set(
    ox + (camSlideCandPos.x - ox) * adjT,
    oy + (camSlideCandPos.y - oy) * adjT,
    oz + (camSlideCandPos.z - oz) * adjT,
  );
  resolveCamXZClearance(camBestPos, 0.38, oy, pivot);

  camTmpPos.set(ox + dx * rawT, oy + dy * rawT, oz + dz * rawT);
  resolveCamXZClearance(camTmpPos, 0.38, oy, pivot);

  let chosenDist = camBestPos.distanceTo(pivot);
  const rawPostDist = camTmpPos.distanceTo(pivot);
  if (rawPostDist > chosenDist + 0.05 && minWallClearDist(camTmpPos, oy) >= minWallClearDist(camBestPos, oy) - 0.03) {
    camBestPos.copy(camTmpPos);
    chosenDist = rawPostDist;
  }

  let chosenAngle = 0;
  let chosenScore = chosenDist + Math.min(minWallClearDist(camBestPos, oy), 0.55) * 0.7;

  // Tangential corner escape: find clear shoulder/corridor angle before collapsing to eye fallback
  if (canSlide && chosenDist < 0.62) {
    for (let i = 0; i < CAM_ESCAPE_ANGLES.length; i++) {
      const ang = CAM_ESCAPE_ANGLES[i];
      const cosA = Math.cos(ang);
      const sinA = Math.sin(ang);
      const rx = dx * cosA - dz * sinA;
      const rz = dx * sinA + dz * cosA;
      camSlideCandPos.set(ox + rx, oy + dy * 0.7, oz + rz);
      resolveCamXZClearance(camSlideCandPos, 0.39, oy, pivot);

      const candT = castCamFrustumRay(ox, oy, oz, camSlideCandPos.x, camSlideCandPos.y, camSlideCandPos.z, 0.20);
      camTmpPos.set(
        ox + (camSlideCandPos.x - ox) * candT,
        oy + (camSlideCandPos.y - oy) * candT,
        oz + (camSlideCandPos.z - oz) * candT,
      );
      resolveCamXZClearance(camTmpPos, 0.36, oy, pivot);
      const dCand = camTmpPos.distanceTo(pivot);
      if (dCand < Math.max(0.56, chosenDist + 0.14)) continue;

      const cClear = minWallClearDist(camTmpPos, oy);
      if (cClear < 0.24) continue;
      const signPenalty = prevSlideSign !== 0 && Math.sign(ang) !== prevSlideSign ? 0.18 : 0;
      const score = dCand + Math.min(cClear, 0.55) * 0.7 - Math.abs(ang) * 0.14 - signPenalty;
      if (score > chosenScore) {
        chosenScore = score;
        chosenAngle = ang;
        camBestPos.copy(camTmpPos);
        chosenDist = dCand;
      }
    }
  }

  prevSlideSign = chosenAngle !== 0 ? Math.sign(chosenAngle) : 0;
  const targetLookAlpha = chosenAngle !== 0 ? Math.min(1, Math.abs(chosenAngle) / 1.15 + 0.22) : 0;
  camLookAtPlayerAlpha += (targetLookAlpha - camLookAtPlayerAlpha) * (bypassSmoothing ? 1 : Math.min(1, delta * 12));

  const hitDist = camBestPos.distanceTo(pivot);
  if (bypassSmoothing || hitDist <= smoothedCamDist) {
    smoothedCamDist = hitDist;
  } else {
    const recoverRate = chosenAngle !== 0 ? 15.0 : 9.5;
    smoothedCamDist = Math.min(
      hitDist,
      Math.max(
        chosenAngle !== 0 ? Math.min(0.56, hitDist) : 0,
        smoothedCamDist + Math.max(0.05, (hitDist - smoothedCamDist) * Math.min(1, delta * recoverRate)),
      ),
    );
  }

  const scaleToSmoothed = hitDist > 0.001 ? Math.min(1, smoothedCamDist / hitDist) : 1;
  const goalRelX = (camBestPos.x - ox) * scaleToSmoothed;
  const goalRelY = (camBestPos.y - oy) * scaleToSmoothed;
  const goalRelZ = (camBestPos.z - oz) * scaleToSmoothed;

  if (bypassSmoothing || (camSlideOffsetX === 0 && camSlideOffsetZ === 0 && chosenAngle === 0)) {
    camSlideOffsetX = goalRelX;
    camSlideOffsetZ = goalRelZ;
  } else {
    const slideRate = Math.min(1, delta * (chosenAngle !== 0 ? 14 : 11));
    camSlideOffsetX += (goalRelX - camSlideOffsetX) * slideRate;
    camSlideOffsetZ += (goalRelZ - camSlideOffsetZ) * slideRate;
    const interpLos = castCamRaySingle(ox, oy, oz, camSlideOffsetX, goalRelY, camSlideOffsetZ, 0.14, 1.0);
    if (interpLos < 0.995) {
      camSlideOffsetX = goalRelX;
      camSlideOffsetZ = goalRelZ;
    }
  }

  camTargetPos.set(ox + camSlideOffsetX, oy + goalRelY, oz + camSlideOffsetZ);
  resolveCamXZClearance(camTargetPos, 0.37, oy, pivot);

  // Prevent camera from dipping below staircase flights or sloped ramps
  const groundAtCam = computeGroundHeight(camTargetPos.x, camTargetPos.z, footY - 0.6, 0.8);
  if (groundAtCam > -10 && camTargetPos.y < groundAtCam + 0.24 && Math.abs(groundAtCam - footY) < 2.2) {
    camTargetPos.y = groundAtCam + 0.24;
  }

  const usedDist = camTargetPos.distanceTo(pivot);
  if (usedDist < 0.44) camHideMeshState = true;
  else if (usedDist > 0.50) camHideMeshState = false;

  const hidePlayerMesh = allowEyeFallback && camHideMeshState;
  isThirdPersonEyeFallback = hidePlayerMesh;
  if (hidePlayerMesh) {
    camLookAtPlayerAlpha = 0;
    camTargetPos.copy(pivot);
    resolveCamXZClearance(camTargetPos, 0.34, oy, pivot);
  }

  const finalWallClear = minWallClearDist(camTargetPos, camTargetPos.y);
  syncCameraNear((hidePlayerMesh || finalWallClear < 0.42) ? 0.045 : baseCamNear);

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
    if (controls.isLocked) controls.unlock();
    started = false;
    scene.background.setHex(0x18211e);
    scene.fog.near = 200;
    scene.fog.far = 300;
    camera.fov = 45;
    camera.updateProjectionMatrix();

    if (house?.group) house.group.visible = false;
    if (environment?.group) environment.group.visible = false;
    if (studioGroup) studioGroup.visible = true;

    studioPanel?.classList.remove('hidden');
    intro?.classList.add('hidden');
    pause?.classList.add('hidden');
    walkHud?.classList.add('hidden');
    cameraToggleButton?.classList.add('hidden');
    gateToggleButton?.classList.add('hidden');
    runToggleButton?.classList.add('hidden');
    liftHudButton?.classList.add('hidden');
    if (brandTitle) brandTitle.textContent = 'CHARACTER STUDIO';
    if (brandSubtitle) brandSubtitle.textContent = 'FULL HUMAN 3D MODEL · DRAG TO ROTATE 360°';
    if (studioToggleButton) studioToggleButton.innerHTML = 'PLAY STREET GAME <span>→</span>';
    applyQuality(quality);
  } else {
    const isLow = quality === 'low';
    scene.background.setHex(0xcfe0e6);
    scene.fog.near = isLow ? 36 : 48;
    scene.fog.far = isLow ? 88 : 115;
    camera.far = isLow ? 95 : 175;
    camera.fov = 60;
    camera.updateProjectionMatrix();

    if (house?.group) house.group.visible = true;
    if (environment?.group) environment.group.visible = true;
    if (studioGroup) studioGroup.visible = false;

    studioPanel?.classList.add('hidden');
    cameraToggleButton?.classList.remove('hidden');
    gateToggleButton?.classList.remove('hidden');
    runToggleButton?.classList.remove('hidden');
    liftHudButton?.classList.remove('hidden');
    if (brandTitle) brandTitle.textContent = 'TALTOLA';
    if (brandSubtitle) brandSubtitle.textContent = 'KHULNA · BANGLADESH';
    if (studioToggleButton) studioToggleButton.innerHTML = 'CHARACTER STUDIO <span>★</span>';

    applyQuality(quality);
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
    renderer.setPixelRatio(Math.min(dpr, 0.54));
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (sun) sun.visible = false;
    if (hemisphereLight) hemisphereLight.intensity = 1.65;
    document.body.classList.add('low-perf-ui');
  }
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
  const isFast = isLow || quality === 'medium';
  const ratios = {
    low: Math.min(dpr, ultraFastMode ? 0.54 : 0.62),
    medium: Math.min(dpr, 0.85),
    high: Math.min(dpr, 1.0),
    ultra: Math.min(dpr * 1.15, 1.25),
  };
  const shadowSizes = { low: 512, medium: 1024, high: 1536, ultra: 2048 };
  const useShadows = quality === 'high' || quality === 'ultra';
  const activeRatio = ratios[quality] ?? ratios.high;

  renderer.setPixelRatio(activeRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = useShadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  if (useShadows) renderer.shadowMap.needsUpdate = true;

  document.body.classList.toggle('low-perf-ui', isLow);

  if (!inStudio) {
    scene.fog.near = isLow ? 26 : 46;
    scene.fog.far = isLow ? 60 : 112;
    camera.far = isLow ? 66 : 145;
    camera.updateProjectionMatrix();
  }

  // Use a lean 2-light rig (Hemisphere + Sun) on low/medium (single hemisphere if ultraFastMode)
  const useExtraLights = !isFast || inStudio;
  if (studioKeyLight) studioKeyLight.visible = useExtraLights;
  if (fillDirLight) {
    fillDirLight.visible = useExtraLights;
    fillDirLight.intensity = 0.68;
  }
  if (ambientLight) {
    ambientLight.visible = useExtraLights;
    ambientLight.intensity = 0.62;
  }
  if (hemisphereLight) {
    hemisphereLight.visible = true;
    hemisphereLight.intensity = ultraFastMode && !inStudio ? 1.65 : (isFast && !inStudio ? 1.14 : 0.58);
    hemisphereLight.color.setHex(isFast && !inStudio ? 0xf6f2ea : 0xdcebf2);
    hemisphereLight.groundColor.setHex(isFast && !inStudio ? 0x857868 : 0x5c5346);
  }
  if (sun) {
    sun.visible = !ultraFastMode || inStudio;
    sun.intensity = isFast && !inStudio ? 1.08 : 1.45;
  }

  if (sun) {
    sun.castShadow = useShadows;
    if (useShadows) {
      const size = shadowSizes[quality] || 1536;
      sun.shadow.mapSize.set(size, size);
      sun.shadow.bias = -0.0014;
      sun.shadow.normalBias = 0.04;
      if (sun.shadow.map) {
        sun.shadow.map.dispose();
        sun.shadow.map = null;
      }
      renderer.shadowMap.needsUpdate = true;
    }
  }

  sceneMaterials?.setQualityMode?.(quality);
  environment?.tower?.setQualityMode?.(quality);
  playerCharacter?.setQualityMode?.(quality);
  if (environment?.farGroup) environment.farGroup.visible = !isLow;

  for (const input of qualityInputs) {
    if (input) input.value = quality;
  }
}

for (const input of qualityInputs) {
  input?.addEventListener('change', () => applyQuality(input.value));
}

function setupLighting() {
  ambientLight = new THREE.AmbientLight(0xf6f0e4, 0.56);
  scene.add(ambientLight);

  hemisphereLight = new THREE.HemisphereLight(0xdcebf2, 0x5c5346, 0.52);
  scene.add(hemisphereLight);

  sun = new THREE.DirectionalLight(0xfff2dc, 1.45);
  sun.position.set(4, 14, 12);
  sun.target.position.set(0, 1, 0);
  sun.castShadow = true;
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -22;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 80;
  scene.add(sun, sun.target);

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

function handleDoorInteraction() {
  if (sittingState.active) {
    standUpFromSeat();
    return;
  }
  const nearSeat = findNearestSeat(playerPos);
  const hasDoorOrLiftPrompt = Boolean(environment?.tower?.getPrompt(playerPos) || house?.getPrompt(playerPos));
  // If near a seat and either no door/lift is active or seat is very close (< 1.25m), sit down!
  if (nearSeat && (!hasDoorOrLiftPrompt || nearSeat.dist < 1.25)) {
    sitOnSeat(nearSeat);
    return;
  }
  const towerRes = environment?.tower?.interact(playerPos);
  if (towerRes) {
    if (towerRes === 'open_lift_keypad' || environment?.tower?.isInsideLift(playerPos)) {
      openLiftKeypad();
    } else if (environment?.tower?.isNearLiftLobby(playerPos)) {
      openLiftKeypad();
    }
    syncHUDButtons(false, true);
    return;
  }
  if (house?.getPrompt(playerPos)) {
    house.toggleNearestDoor(playerPos);
    syncHUDButtons(false, true);
    return;
  }
  if (nearSeat) {
    sitOnSeat(nearSeat);
  }
}

function toggleCameraView() {
  if (!playerCharacter) return;
  playerCharacter.cycleCameraMode();
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
  setupLighting();
  studioGroup = buildStudioEnvironment();
  house = buildHouse(scene, materials);
  environment = buildEnvironment(scene, materials);
  // Keep reference to environment group so we can hide/show it cleanly
  environment.group = scene.getObjectByName('Lane and tropical surroundings');
  playerCharacter = createPlayerCharacter(scene, manager);

  await allLoaded;

  applyQuality(quality);
  // Set default studio camera preset: Full Body view so both the straightened head and freed hands are immediately visible
  setStudioCameraPreset('full');
  const startInStudio = new URLSearchParams(window.location.search).get('studio') === '1';
  setMode(startInStudio);
  syncHUDButtons(false, true);

  loadingBar.style.width = '100%';
  loadingStatus.textContent = '3D Human Character Ready.';
  ready = true;
  window.__TALTOLA__ = {
    scene,
    camera,
    renderer,
    composer: null,
    controls,
    house,
    environment,
    playerCharacter,
    playerPos,
    sittingState,
    sitOnSeat,
    standUpFromSeat,
    findNearestSeat,
    openLiftKeypad,
    closeLiftKeypad,
    selectLiftFloor,
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
    studioOrbit.targetDistance = 0.72;
    studioOrbit.targetLookY = 1.54;
  } else if (preset === 'side') {
    studioOrbit.targetAngle = 0.78;
    studioOrbit.targetPitch = 0.05;
    studioOrbit.targetDistance = 1.65;
    studioOrbit.targetLookY = 1.08;
  } else {
    // 'full' or 'spin'
    studioOrbit.targetAngle = 0.0;
    studioOrbit.targetPitch = 0.05;
    studioOrbit.targetDistance = 1.85;
    studioOrbit.targetLookY = 1.02;
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
    if (sittingState.active || findNearestSeat(playerPos) || environment?.tower?.getPrompt(playerPos) || house?.getPrompt(playerPos)) {
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
    studioOrbit.targetDistance + event.deltaY * 0.0015,
    0.52,
    3.2
  );
  // Automatically shift vertical focus between face (1.54m) and full body (0.95m) as user zooms in/out
  const zoomT = THREE.MathUtils.clamp((studioOrbit.targetDistance - 0.65) / 1.4, 0, 1);
  studioOrbit.targetLookY = THREE.MathUtils.lerp(1.54, 0.95, zoomT);
}, { passive: false });

function beginWalking() {
  if (!started) {
    started = true;
    playerPos.set(-0.2, EYE_HEIGHT, 0.8);
    camera.position.copy(playerPos);
    camera.lookAt(5.0, 2.0, 0);
    controls.syncRotationFromCamera();
    if (playerCharacter) {
      playerCharacter.state.facingYaw = controls.euler.y + Math.PI;
    }
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
  if (liftKeypadOpen) {
    pause.classList.add('hidden');
    walkHud.classList.remove('hidden');
    return;
  }
  walkHud.classList.add('hidden');
  if (!inStudio && started && !referenceModal.open) pause.classList.remove('hidden');
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
  Digit7: 'pocket',
  Numpad7: 'pocket',
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
    } else if (event.code === 'KeyX' || event.code === 'KeyC') {
      playerCharacter?.triggerAttack(event.code === 'KeyC' ? 2 : null);
    }
    return;
  }

  if (!started) return;

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

  if (event.code === 'KeyE' || event.code === 'KeyF') {
    event.preventDefault();
    handleDoorInteraction();
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
  } else if (pos.x >= 5.95 && pos.x <= 14.38 && Math.abs(pos.z) <= 5.42) {
    building = 'house';
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
    const cx = THREE.MathUtils.clamp(pos.x, item.minX, item.maxX);
    const cz = THREE.MathUtils.clamp(pos.z, item.minZ, item.maxZ);
    const dist = Math.hypot(pos.x - cx, pos.z - cz);
    if (dist < bestDist && Math.abs(footY - fy) < 1.35) {
      bestDist = dist;
      bestSeat = { ...item, fy, dist };
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

  // --- 5-STORY TALTOLA HOUSE ---
  const insideMainSlab = pos.x >= 5.95 && pos.x <= 14.38 && Math.abs(pos.z) <= 5.42;
  const inFrontBalconyZone = pos.x >= 4.74 && pos.x <= 6.08 &&
    ((pos.z >= -5.12 && pos.z <= -1.48) || (pos.z >= 1.52 && pos.z <= 5.12));

  if (!insideMainSlab && !inFrontBalconyZone) {
    return 0.0;
  }

  let bestHouseY = 0.0;
  const inStairLane = pos.x >= 7.62 && pos.x <= 12.18 && pos.z >= 0.16 && pos.z <= 1.16;
  const inMiddleOfHouseStairHole = pos.x > 7.82 && pos.x < 11.96 && pos.z >= 0.16 && pos.z <= 1.16;

  if (inStairLane) {
    const t = THREE.MathUtils.clamp((pos.x - 7.75) / (12.05 - 7.75), 0, 1);
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
          pos.x >= box.minX - 0.16 && pos.x <= box.maxX + 0.16 &&
          pos.z >= box.minZ - 0.16 && pos.z <= box.maxZ + 0.16
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
  // Fakir Bari Lane (z 10.2..14.25) is walkable to x = -42; Sk Arshan Tower (z 14.25..28.6) is walkable to x = -19.7
  const inFakirBariLane = pos.z > 10.0 && pos.z < 14.5;
  const inSkArshanZ = pos.z >= 14.25 && pos.z <= 28.6;
  const minXBound = inFakirBariLane ? -42.0 : (inSkArshanZ ? -19.7 : -17.8);
  pos.x = THREE.MathUtils.clamp(pos.x, minXBound, 21.05);
  pos.z = THREE.MathUtils.clamp(pos.z, -40, 40);

  const footY = pos.y - EYE_HEIGHT;
  let currentLevel = 0;
  for (let sLvl = 0; sLvl <= 5; sLvl++) {
    if (sLvl * 3.05 <= footY + 0.55) currentLevel = sLvl;
  }
  const onStairs = pos.x >= 7.68 && pos.x <= 12.12 && pos.z >= 0.16 && pos.z <= 1.16;

  for (let iter = 0; iter < 2; iter++) {
    // North boundary wall of Fakir Bari Lane (z <= 10.22)
    resolveCircleAABB(pos, PLAYER_RADIUS, -46.0, -2.92, -42.0, 10.22);
    // Old buildings west of Sk Arshan Tower along Fakir Bari Lane (x <= -19.85, z >= 14.26)
    resolveCircleAABB(pos, PLAYER_RADIUS, -46.0, -19.85, 14.26, 42.0);
    // Under-construction building south of Sk Arshan Tower (z >= 28.58, x <= -3.22)
    resolveCircleAABB(pos, PLAYER_RADIUS, -19.85, -3.22, 28.58, 42.0);
    // Lane end building
    resolveCircleAABB(pos, PLAYER_RADIUS, -46.0, -42.45, 9.0, 15.5);

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

      if (towerK === 0 && footY < 2.6) {
        // Ground-floor lane-side shop shutters wall (z = 14.48..14.75, x = -19.85..-4.45)
        resolveCircleAABB(pos, PLAYER_RADIUS, -19.85, -4.45, 14.42, 14.76);
        // Plinth stainless railings along road (leaving Car Ramp z=19.15..22.95 & South Steps z=26.55..28.45 open!)
        if (footY - 0.50 < 0.68) {
          resolveCircleAABB(pos, PLAYER_RADIUS, -3.42, -3.22, 14.30, 19.15);
          resolveCircleAABB(pos, PLAYER_RADIUS, -3.42, -3.22, 22.95, 26.55);
        }
        // Front ground-floor piers & closed gates (leaving Bay B z=18.9..21.9 open when gateOpen, and South Entry z=26.6..27.8 open!)
        resolveCircleAABB(pos, PLAYER_RADIUS, -4.55, -4.02, 14.55, 18.88);
        if (environment?.tower && !environment.tower.state.gateOpen) {
          resolveCircleAABB(pos, PLAYER_RADIUS, -4.45, -4.05, 18.88, 21.92);
        }
        resolveCircleAABB(pos, PLAYER_RADIUS, -4.55, -4.02, 21.92, 26.58);
        resolveCircleAABB(pos, PLAYER_RADIUS, -4.55, -4.02, 27.82, 28.60);
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

    // East Side Yard & Street Boundary Walls (North of Taltola House & Taltola House Front Wall)
    if (footY < 2.2) {
      resolveCircleAABB(pos, PLAYER_RADIUS, 2.06, 2.86, -42, -2.06);
      resolveCircleAABB(pos, PLAYER_RADIUS, 2.06, 2.86, 2.06, 7.36);

      if (house && !house.state.gateOpen) {
        resolveCircleAABB(pos, PLAYER_RADIUS, 2.36, 2.66, -2.06, 2.06);
      }

      // Taltola House North & South Side Compound Walls (z = -7.28 and z = +7.28)
      resolveCircleAABB(pos, PLAYER_RADIUS, 2.4, 22.0, -20.0, -7.08);
      resolveCircleAABB(pos, PLAYER_RADIUS, 2.4, 22.0, 7.08, 7.48);
      resolveCircleAABB(pos, PLAYER_RADIUS, 21.25, 24.0, -15.0, 15.0);
    }

    // Haji Mohsin Road East Side: Planter Box (z = 7.5..11.2), 4 Shutter Shops (z = 11.3..20.7),
    // Open ASB Gate Entrance (z = 23.7..26.5 lets player walk inside x = 3.0..7.2!), and Milk Vita Shops (z = 26.8..42.0)
    resolveCircleAABB(pos, PLAYER_RADIUS, 3.02, 22.0, 7.45, 20.85);
    resolveCircleAABB(pos, PLAYER_RADIUS, 2.95, 3.65, 20.85, 23.75);
    resolveCircleAABB(pos, PLAYER_RADIUS, 7.20, 22.0, 20.85, 26.80);
    resolveCircleAABB(pos, PLAYER_RADIUS, 3.05, 22.0, 26.55, 42.0);

    // Rooftop Parapet & Mumty Collisions (Level 5: y ≈ 15.25)
    if (footY >= 14.1) {
      // Stairwell guardrail & Mumty walls on roof
      resolveCircleAABB(pos, 0.14, 7.86, 11.94, 0.14, 0.20);
      resolveCircleAABB(pos, PLAYER_RADIUS, 7.50, 13.65, -1.30, -1.12);
      resolveCircleAABB(pos, PLAYER_RADIUS, 7.50, 13.65, 1.15, 1.32);
      resolveCircleAABB(pos, PLAYER_RADIUS, 13.45, 13.68, -1.25, 1.25);
      // Rooftop Parapet Walls — only block horizontally when not jumping over them (footY - 15.25 < 0.68)!
      if (footY - 15.25 < 0.68) {
        resolveCircleAABB(pos, PLAYER_RADIUS, 5.75, 6.02, -5.50, 5.50);
        resolveCircleAABB(pos, PLAYER_RADIUS, 14.15, 14.42, -5.50, 5.50);
        resolveCircleAABB(pos, PLAYER_RADIUS, 5.85, 14.35, -5.55, -5.28);
        resolveCircleAABB(pos, PLAYER_RADIUS, 5.85, 14.35, 5.28, 5.55);
      }
      continue;
    }

    const houseFy = currentLevel * 3.05;

    // Building Exterior Front & Back Walls (x = 6.08 and x = 14.28)
    if (currentLevel === 0 && footY < 1.6) {
      resolveCircleAABB(pos, PLAYER_RADIUS, 5.92, 6.24, -5.48, -0.60);
      resolveCircleAABB(pos, PLAYER_RADIUS, 5.92, 6.24, 0.60, 5.48);
      if (house && !house.state.frontDoorOpen) {
        resolveCircleAABB(pos, PLAYER_RADIUS, 5.88, 6.20, -0.64, 0.64);
      }

      resolveCircleAABB(pos, PLAYER_RADIUS, 14.12, 14.44, -5.48, -0.60);
      resolveCircleAABB(pos, PLAYER_RADIUS, 14.12, 14.44, 0.60, 5.48);
      if (house && !house.state.backDoorOpen) {
        resolveCircleAABB(pos, PLAYER_RADIUS, 14.16, 14.48, -0.64, 0.64);
      }
    } else if (currentLevel >= 1 && currentLevel <= 4 && pos.x >= 4.5 && pos.x <= 14.6 && Math.abs(pos.z) <= 5.55) {
      // Upper floors: Front wall (x = 6.08) has open balcony doorways at z ∈ [-3.25, -1.90] (Unit A) and z ∈ [1.90, 3.25] (Unit B)!
      resolveCircleAABB(pos, PLAYER_RADIUS, 5.94, 6.22, -5.48, -3.25);
      resolveCircleAABB(pos, PLAYER_RADIUS, 5.94, 6.22, -1.90, 1.90);
      resolveCircleAABB(pos, PLAYER_RADIUS, 5.94, 6.22, 3.25, 5.48);
      // Back wall
      resolveCircleAABB(pos, PLAYER_RADIUS, 14.14, 14.46, -5.48, 5.48);
      // Front balcony side walls & jumpable front railing (x = 4.77)
      resolveCircleAABB(pos, PLAYER_RADIUS, 4.72, 6.08, -5.20, -5.02);
      resolveCircleAABB(pos, PLAYER_RADIUS, 4.72, 6.08, -1.56, -1.38);
      resolveCircleAABB(pos, PLAYER_RADIUS, 4.72, 6.08, 1.44, 1.62);
      resolveCircleAABB(pos, PLAYER_RADIUS, 4.72, 6.08, 5.02, 5.20);
      if (footY - houseFy < 0.68) {
        resolveCircleAABB(pos, PLAYER_RADIUS, 4.68, 4.86, -5.15, -1.45);
        resolveCircleAABB(pos, PLAYER_RADIUS, 4.68, 4.86, 1.50, 5.15);
      }
    }

    // Left & Right Exterior Side Walls (z = -5.36 and z = +5.36)
    resolveCircleAABB(pos, PLAYER_RADIUS, 5.96, 14.40, -5.50, -5.22);
    resolveCircleAABB(pos, PLAYER_RADIUS, 5.96, 14.40, 5.22, 5.50);

    // Stairwell Handrail Divider (z = 0.17, x = 7.86..11.94, slim 0.14m radius so stair lane has generous width)
    resolveCircleAABB(pos, 0.14, 7.86, 11.94, 0.14, 0.20);

    // Left Corridor Wall (z = -1.18):
    // Doorway 1 at x = 7.18..8.30 (Flat A Main Door), Doorway 2 at x = 12.10..13.20
    resolveCircleAABB(pos, PLAYER_RADIUS, 6.05, 7.18, -1.27, -1.09);
    resolveCircleAABB(pos, PLAYER_RADIUS, 8.30, 12.10, -1.27, -1.09);
    resolveCircleAABB(pos, PLAYER_RADIUS, 13.20, 14.32, -1.27, -1.09);
    if (house && !house.isFlatDoorOpen(currentLevel, -1)) {
      resolveCircleAABB(pos, PLAYER_RADIUS, 7.18, 8.30, -1.27, -1.09);
    }

    // Right Corridor Wall (z = +1.18):
    // Doorway 1 at x = 6.38..7.50 (Flat B Main Door), Doorway 2 at x = 12.20..13.30
    resolveCircleAABB(pos, PLAYER_RADIUS, 6.05, 6.38, 1.09, 1.27);
    resolveCircleAABB(pos, PLAYER_RADIUS, 7.50, 12.20, 1.09, 1.27);
    resolveCircleAABB(pos, PLAYER_RADIUS, 13.30, 14.32, 1.09, 1.27);
    if (house && !house.isFlatDoorOpen(currentLevel, 1)) {
      resolveCircleAABB(pos, PLAYER_RADIUS, 6.38, 7.50, 1.09, 1.27);
    }

    if (onStairs) continue;

    // Interior Room & Bathroom Partitions (x = 9.65, x = 11.45, and Bathroom front wall z = ±2.55)
    for (const side of [-1, 1]) {
      const zSign = side;
      const zMin = zSign === -1 ? -5.36 : 2.40;
      const zMax = zSign === -1 ? -2.40 : 5.36;
      resolveCircleAABB(pos, PLAYER_RADIUS, 9.56, 9.74, zMin, zMax);
      resolveCircleAABB(pos, PLAYER_RADIUS, 11.36, 11.54, zMin, zMax);

      // Bathroom wall at z = side * 2.55 with open doorway at x = 10.10..11.00
      const bz = side * 2.55;
      resolveCircleAABB(pos, PLAYER_RADIUS, 9.65, 10.10, bz - 0.08, bz + 0.08);
      resolveCircleAABB(pos, PLAYER_RADIUS, 11.00, 11.45, bz - 0.08, bz + 0.08);
    }

    // Furniture Horizontal Colliders inside Taltola House (only block when footY < houseFy + box.h * 0.50 so player can jump onto any bed, commode, sofa, chair, table, or counter!)
    if (pos.x >= 5.95 && pos.x <= 14.38 && Math.abs(pos.z) <= 5.42) {
      const fBoxes = getFurnitureBoxesForFloor('house', houseFy);
      for (const box of fBoxes) {
        if (footY < houseFy + box.h * 0.50) {
          resolveCircleAABB(pos, PLAYER_RADIUS * 0.85, box.minX, box.maxX, box.minZ, box.maxZ);
        }
      }
    }
  }
}

const FLOOR_NAMES_BN = ['নিচতলা (1st Floor)', '২য় তলা (2nd Floor)', '৩য় তলা (3rd Floor)', '৪র্থ তলা (4th Floor)', '৫ম তলা (5th Floor)', 'ছাদ (Rooftop)'];

function updateHUDPrompt() {
  if (!house || !interactPrompt) return;
  let promptText = null;
  if (controls.isLocked || liftKeypadOpen) {
    if (sittingState.active) {
      promptText = `[E / F / SPACE] উঠে দাঁড়ান — ${sittingState.seat?.label || 'আসন'} (Stand Up)`;
    } else {
      const nearSeat = findNearestSeat(playerPos);
      const doorOrLiftPrompt = environment?.tower?.getPrompt(playerPos) || house.getPrompt(playerPos);
      if (nearSeat && (!doorOrLiftPrompt || nearSeat.dist < 1.25)) {
        promptText = `[E / F] এখানে বসুন: ${nearSeat.label} (Sit Down)`;
      } else {
        promptText = doorOrLiftPrompt || (nearSeat ? `[E / F] এখানে বসুন: ${nearSeat.label} (Sit Down)` : null);
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

    let zone = 'TALTOLA HOSPITAL CROSS RD · STREET';
    if (x < -3.0 && z >= 10.0 && z <= 14.25) {
      zone = 'FAKIR BARI LANE · ফকির বাড়ি লেন (পাশের গলি)';
    } else if (x > 3.1 && z >= 20.8 && z <= 26.8) {
      zone = "AVIJIT'S SPECIAL BATCH (ASB) · কোচিং কম্পাউন্ড";
    } else if (x > 1.8 && z > 11.2 && z < 20.8) {
      zone = 'HAJI MOHSIN RD SHOPS · হাজী মহসিন রোড মার্কেট ও দোকানপাট';
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
    } else if (z > 7.45) {
      zone = 'HAJI MOHSIN ROAD · হাজী মহসিন রোড, খুলনা';
    } else if (lvl === 5 && x >= 5.9 && x <= 14.4) {
      zone = `ROOFTOP · বাড়ির ছাদ (${flName})`;
    } else if (x > 14.4) {
      zone = 'HOUSE BACKYARD · ঘরের পিছনের উঠান';
    } else if (lvl >= 1 && lvl <= 4 && x >= 4.72 && x < 6.08 && Math.abs(z) <= 5.2) {
      zone = `FLAT ${lvl + 1}${z < 0 ? 'A' : 'B'} · সামনের বারান্দা (Front Balcony · ${flName})`;
    } else if (x >= 6.08 && x <= 14.28 && z < -1.2 && z > -5.3 && Math.abs(z) < 7.2) {
      if (x < 9.65) zone = `FLAT ${lvl + 1}A · বসার ঘর ও টিভি রুম (${flName})`;
      else if (x < 11.45 && z < -2.5) zone = `FLAT ${lvl + 1}A · অ্যাটাচড বাথরুম (${flName})`;
      else zone = `FLAT ${lvl + 1}A · মাস্টার বেডরুম (${flName})`;
    } else if (x >= 6.08 && x <= 14.28 && z > 1.2 && z < 5.3 && Math.abs(z) < 7.2) {
      if (x < 9.65) zone = `FLAT ${lvl + 1}B · ডাইনিং ও ফ্যামিলি রুম (${flName})`;
      else if (x < 11.45 && z > 2.5) zone = `FLAT ${lvl + 1}B · অ্যাটাচড বাথরুম (${flName})`;
      else zone = `FLAT ${lvl + 1}B · রান্নাঘর (${flName})`;
    } else if (x >= 6.0 && x <= 14.35 && z <= -5.2 && z >= -7.3) {
      zone = 'LEFT SIDE PASSAGE · বাম পাশের গলি';
    } else if (x >= 6.0 && x <= 14.35 && z >= 5.2 && z <= 7.3) {
      zone = 'RIGHT SIDE PASSAGE · ডান পাশের গলি';
    } else if (x >= 6.0 && x <= 14.35 && Math.abs(z) < 5.3) {
      zone = `STAIRWELL & CORRIDOR · করিডোর ও সিঁড়ি (${flName})`;
    } else if (x > 2.55 && Math.abs(z) <= 7.35) {
      zone = 'FRONT COURTYARD · বাড়ির সামনের উঠান';
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

  const isMovingInput = wishDir.lengthSq() > 0.01;
  const isSprinting = isMovingInput && (
    shiftHeld
    || keys.has('ShiftLeft')
    || keys.has('ShiftRight')
    || runModeToggle
    || doubleTapSprint
  );
  const maxSpeed = isSprinting ? 7.65 : 3.45;
  const targetVx = wishDir.x * maxSpeed;
  const targetVz = wishDir.z * maxSpeed;

  const accel = (isMovingInput ? 24.0 : 15.0) * delta;
  horizontalVelocity.x += (targetVx - horizontalVelocity.x) * Math.min(1, accel);
  horizontalVelocity.y += (targetVz - horizontalVelocity.y) * Math.min(1, accel);

  // Smooth dynamic speed-rush FOV boost while running!
  const targetFov = isSprinting ? 67.5 : 60.0;
  if (Math.abs(camera.fov - targetFov) > 0.05) {
    camera.fov += (targetFov - camera.fov) * Math.min(1, delta * 8.5);
    camera.updateProjectionMatrix();
  }
  syncHUDButtons(isSprinting);

  playerPos.x += horizontalVelocity.x * delta;
  playerPos.z += horizontalVelocity.y * delta;

  applyWorldCollisions(playerPos);

  const insideLiftNow = Boolean(environment?.tower?.isInsideLift(playerPos));
  // Auto-open the interactive floor keypad when the player steps inside the 3D Elevator Cabin!
  if (insideLiftNow && !wasInsideLift) {
    openLiftKeypad();
  } else if (!insideLiftNow && wasInsideLift && liftKeypadOpen) {
    closeLiftKeypad(true);
  }
  wasInsideLift = insideLiftNow;

  if (liftKeypadOpen) {
    syncLiftKeypadUI();
  }

  const targetEyeY = computeGroundHeight(playerPos) + EYE_HEIGHT;

  if (grounded) coyoteTimer = 0.12;
  else coyoteTimer = Math.max(0, coyoteTimer - delta);

  if (jumpBuffer > 0) jumpBuffer = Math.max(0, jumpBuffer - delta);

  if (jumpBuffer > 0 && coyoteTimer > 0 && !(insideLiftNow && environment?.tower?.state?.liftPhase === 'moving')) {
    verticalVelocity = 6.25;
    grounded = false;
    coyoteTimer = 0;
    jumpBuffer = 0;
  }

  if (insideLiftNow && grounded) {
    // Lock player directly to the 3D moving elevator cabin floor so riding up/down 10 floors is 100% smooth
    playerPos.y = targetEyeY;
    verticalVelocity = 0;
  } else if (grounded && Math.abs(playerPos.y - targetEyeY) <= 0.95) {
    // Smoothly climb or descend stairs and floor transitions
    playerPos.y += (targetEyeY - playerPos.y) * Math.min(1, delta * 22.0);
    verticalVelocity = 0;
  } else {
    grounded = false;
    verticalVelocity -= 14.8 * delta;
    playerPos.y += verticalVelocity * delta;
    if (verticalVelocity <= 0 && playerPos.y <= targetEyeY) {
      playerPos.y = targetEyeY;
      verticalVelocity = 0;
      grounded = true;
    }
  }

  const speedMag = horizontalVelocity.length();
  controls.euler.setFromQuaternion(camera.quaternion, 'YXZ');

  const camFootY = playerPos.y - EYE_HEIGHT;
  const insideHouse = (playerPos.x > 4.7 && playerPos.x < 14.6 && Math.abs(playerPos.z) < 5.3)
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
    const camRes = resolveThirdPersonCamera(playerPos, camDesiredPos, camFootY, delta, camModeChanged, true, !sittingState.active);
    hidePlayerMesh = camRes.hidePlayerMesh;
    camera.position.copy(camRes.camPos);
  } else if (playerCharacter && activeCamMode === 'front') {
    camDesiredPos.copy(playerPos).addScaledVector(forwardVec, insideLiftNow ? 0.72 : 1.15);
    camDesiredPos.y = playerPos.y - 0.08;
    const camRes = resolveThirdPersonCamera(playerPos, camDesiredPos, camFootY, delta, camModeChanged, true, false);
    hidePlayerMesh = camRes.hidePlayerMesh;
    camera.position.copy(camRes.camPos);
  } else {
    isThirdPersonEyeFallback = false;
    smoothedCamDist = 0.0;
    camHideMeshState = false;
    camLookAtPlayerAlpha = 0;
    camSlideOffsetX = 0;
    camSlideOffsetZ = 0;
    prevSlideSign = 0;
    if (baseCamNear > 0) syncCameraNear(baseCamNear);
    if (grounded && speedMag > 0.35) {
      bobPhase += delta * (isSprinting ? 13.5 : 9.5);
      const bobOffset = Math.sin(bobPhase) * 0.036 * Math.min(1, speedMag / maxSpeed);
      camera.position.set(playerPos.x, playerPos.y + bobOffset, playerPos.z);
    } else {
      camera.position.copy(playerPos);
    }
  }

  if (playerCharacter) {
    playerCharacter.update(delta, {
      position: playerPos,
      yaw: controls.euler.y,
      speed: speedMag,
      maxSpeed,
      grounded,
      isSprinting,
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
    // Smart indoor building & exterior culling for steady 60-120 FPS inside upper rooms
    const fyNow = playerPos.y - EYE_HEIGHT;
    const deepInTowerUpper = fyNow >= 3.2 && playerPos.x < -5.8 && playerPos.z > 14.7;
    if (house?.group && house.group.visible === deepInTowerUpper) {
      house.group.visible = !deepInTowerUpper;
    }
    const deepInTowerRoom = fyNow >= 3.2 && fyNow < 29.8 && playerPos.x < -7.0 && playerPos.z > 15.0;
    if (environment?.detailsGroup && environment.detailsGroup.visible === deepInTowerRoom) {
      environment.detailsGroup.visible = !deepInTowerRoom;
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
    if (environment?.roadBaseGroup && environment.roadBaseGroup.visible === inWindowlessTower) {
      environment.roadBaseGroup.visible = !inWindowlessTower;
    }
    if (environment?.farGroup) {
      const wantFar = !isLow && !inWindowlessTower;
      if (environment.farGroup.visible !== wantFar) {
        environment.farGroup.visible = wantFar;
      }
    }
    if (house && !deepInTowerUpper) house.update(delta, playerPos, isLow);
    if (environment && !isLow && !deepInTowerUpper) environment.update(elapsed);

    if (!started) {
      camera.position.z = 10.5 + Math.sin(elapsed * 0.12) * 0.25;
      camera.lookAt(4.6, 4.4, 0);
      renderActiveScene();
    } else if (sittingState.active && sittingState.seat && playerCharacter && playerCharacter.state.cameraMode !== 'first' && !isThirdPersonEyeFallback) {
      savedCameraQuat.copy(camera.quaternion);
      camera.lookAt(sittingState.seat.seatX, sittingState.seat.fy + 0.92, sittingState.seat.seatZ);
      renderActiveScene();
      camera.quaternion.copy(savedCameraQuat);
    } else if (playerCharacter && playerCharacter.state.cameraMode === 'front' && !isThirdPersonEyeFallback) {
      savedCameraQuat.copy(camera.quaternion);
      camera.lookAt(playerPos.x, playerPos.y - 0.12, playerPos.z);
      renderActiveScene();
      camera.quaternion.copy(savedCameraQuat);
    } else if (playerCharacter && playerCharacter.state.cameraMode === 'back' && !isThirdPersonEyeFallback && camLookAtPlayerAlpha > 0.02) {
      savedCameraQuat.copy(camera.quaternion);
      camLookTarget.set(playerPos.x + forwardVec.x * 0.18, playerPos.y - 0.12, playerPos.z + forwardVec.z * 0.18);
      camera.lookAt(camLookTarget);
      camLookAtQuat.copy(camera.quaternion);
      camera.quaternion.copy(savedCameraQuat).slerp(camLookAtQuat, camLookAtPlayerAlpha);
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
    // Auto-adapt to Low / Fast 60-120 FPS mode if FPS drops below 54 FPS, and single-light mode if still < 34 FPS (e.g. software WebGL)
    if (ready && !inStudio) {
      if (currentFps < 54 && quality !== 'low') {
        applyQuality('low');
      } else if (quality === 'low' && !ultraFastMode) {
        if (currentFps < 34) {
          lowFpsStreak++;
          if (lowFpsStreak >= 2) {
            setUltraFastPerf(true);
          }
        } else {
          lowFpsStreak = 0;
        }
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
