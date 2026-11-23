import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FirstPersonControls } from './controls.js';
import { createMaterials } from './materials.js';
import { buildHouse } from './house.js';
import { buildEnvironment } from './environment.js';
import { createPlayerCharacter, CHARACTER_ROSTER } from './character.js';
import { createAutonomousPartner } from './autonomous-partner.js';
import { TALTOLA_HOUSE_OFFSET } from './khulna-geo.js';
import { createKhulnaMapUI } from './khulna-map-ui.js';
import { createGTAPhoneUI } from './gta-phone.js';
import { VOICE_CLIPS, VOICE_BUS } from './voice-clips.js';
import { createAliaPrincipalMic } from './alia-pa-mic.js';
import { createGTACharacterSwitch } from './gta-character-switch.js';
import { createSpecialAbilitySystem } from './special-abilities.js';
import { createHealthSystem } from './health-system.js';
import { createAtmosphericSkyAndPMREM, TIME_OF_DAY_PRESETS } from './aaa-shaders.js';
import { CAR_FLEET_CONFIGS, createDrivableCar, createDrivableCarFleet } from './car.js';
import './style.css';

const canvas = document.querySelector('#scene');
const vehicleFadeEl = document.querySelector('#vehicle-fade');
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
const forzaTachoCanvas = document.querySelector('#forza-tacho-canvas');
const forzaTachoCtx = forzaTachoCanvas ? forzaTachoCanvas.getContext('2d') : null;
const carDamageWrapEl = document.querySelector('#car-damage-wrap');
const carDamageFillEl = document.querySelector('#car-damage-fill');
const carDamagePctEl = document.querySelector('#car-damage-pct');
const carSeatBtn = document.querySelector('#car-seat-btn');
const carSeatLabelEl = document.querySelector('#car-seat-label');
const carPaintBtn = document.querySelector('#car-paint-btn');
const carPaintNameEl = document.querySelector('#car-paint-name');
const carPovBtn = document.querySelector('#car-pov-btn');
const carCamLabelEl = document.querySelector('#car-cam-label');
const carHudDoorsEl = document.querySelector('#car-hud-doors');
const carDoorPanel = document.querySelector('#car-door-panel');
const carDoorTitle = document.querySelector('#car-door-title');
const carDoorAllBtn = document.querySelector('#car-door-all-btn');
const carDoorButtons = Array.from(document.querySelectorAll('[data-car-door]'));
const carHornBtn = document.querySelector('#car-horn-btn');
const carExitBtn = document.querySelector('#car-exit-btn');
let carDoorCursorMode = false;
let freeCursorMode = true;
let lastCanvasClickTime = 0;
let mouseAttackHeld = false;
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
const partnerStatusPill = document.querySelector('#partner-status-pill');
const partnerStatusText = document.querySelector('#partner-status-text');
const charSelectCards = Array.from(document.querySelectorAll('[data-char-select]'));
const qualityInputs = [
  document.querySelector('#quality'),
  document.querySelector('#pause-quality'),
  document.querySelector('#studio-quality'),
  document.querySelector('#hud-quality'),
];
const referenceModal = document.querySelector('#reference-modal');
const fpsLabel = document.querySelector('#fps');
const cornerFpsEl = document.querySelector('#corner-fps');
const cornerFpsValEl = document.querySelector('#corner-fps-val');
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
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;

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
  // WebGL2 2x MSAA HalfFloat render target + quarter-res UnrealBloomPass gives razor-sharp Ultra 4K glow at 2x higher FPS!
  const isWebGL2 = Boolean(renderer.capabilities?.isWebGL2);
  const composerRT = new THREE.WebGLRenderTarget(
    Math.max(1, window.innerWidth),
    Math.max(1, window.innerHeight),
    {
      type: THREE.HalfFloatType,
      samples: isWebGL2 ? 2 : 0,
    }
  );
  composer = new EffectComposer(renderer, composerRT);
  composer.addPass(new RenderPass(scene, camera));
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(
      Math.max(192, Math.floor(window.innerWidth * 0.25)),
      Math.max(108, Math.floor(window.innerHeight * 0.25))
    ),
    0.34,
    0.48,
    0.80
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
    if (sun?.castShadow) {
      renderer.shadowMap.needsUpdate = true;
      lastShadowUpdateAt = performance.now();
    }
    environment?.setNightFactor?.(preset.nightFactor);
  }
  // Full real PBR sky environment reflections on Ultra & High (and keep hero character clean across ALL tiers including Low!)
  const selectiveEnv = quality === 'low' ? null : (skySystem?.getEnvTexture?.() || null);
  const heroEnv = skySystem?.getEnvTexture?.() || null;
  const staticEnv = (quality === 'ultra' || quality === 'high') ? selectiveEnv : null;
  sceneMaterials?.setEnvironmentMap?.(staticEnv);
  environment?.tower?.setEnvironmentMap?.(staticEnv);
  if (Object.keys(characterActors).length) {
    for (const actor of Object.values(characterActors)) {
      actor?.setEnvironmentMap?.(heroEnv);
    }
  } else {
    playerCharacter?.setEnvironmentMap?.(heroEnv);
  }
  const vehicleEnv = skySystem?.getEnvTexture?.() || null;
  for (const c of cars) c?.setEnvironmentMap?.(vehicleEnv);
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
  // Full-resolution 4x MSAA EffectComposer + half-res UnrealBloomPass glow on Ultra & High across ALL times of day!
  const useBloom = Boolean(
    !inStudio
    && composer
    && bloomPass
    && (quality === 'ultra' || quality === 'high')
    && bloomPass.strength > 0.02
  );
  if (useBloom) {
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
let lastSpaceDownTime = 0;
let doubleSpaceJumpPending = false;
let airPeakY = EYE_HEIGHT;
let isFlipping = false;
let landRecoveryTimer = 0;
let landRecoveryClip = null;
let landingCamDip = 0;
let landingCamDipVel = 0;
let inWater = false;
let wallAhead = false;
const wallProbePos = new THREE.Vector3();
const ledgeHangState = {
  active: false,
  yaw: 0,
  dirX: 0,
  dirZ: 0,
  grabX: 0,
  grabY: 0,
  grabZ: 0,
  ledgeTopY: 0,
};
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
  distance: 3.45,
  targetY: 0.88,
  lookX: 0.0,
  targetAngle: 0.0,
  targetPitch: 0.05,
  targetDistance: 3.45,
  targetLookY: 0.88,
  targetLookX: 0.0,
  autoSpin: false,
  dragging: false,
  lastX: 0,
  lastY: 0,
  downX: 0,
  downY: 0,
  _lastMs: 0,
};

let quality = localStorage.getItem('taltola_quality') || 'medium';
if (!['low', 'medium', 'high', 'ultra'].includes(quality)) quality = 'medium';
let baseWalkFov = THREE.MathUtils.clamp(Number(localStorage.getItem('taltola_fov')) || 60, 48, 75);
let mouseSensitivity = THREE.MathUtils.clamp(Number(localStorage.getItem('taltola_mouse_sens')) || 1.0, 0.4, 2.4);
let shadowsOverride = localStorage.getItem('taltola_shadows') || 'auto'; // 'auto' | 'on' | 'off'
controls.setSensitivity(mouseSensitivity);
let sceneMaterials;
let environment;
let house;
let studioGroup;
let playerCharacter;
const characterActors = {};
let selectedCharacterId = (() => {
  try {
    return localStorage.getItem('taltola_character') || 'sabit';
  } catch {
    return 'sabit';
  }
})();
if (!CHARACTER_ROSTER.some((c) => c.id === selectedCharacterId)) selectedCharacterId = 'sabit';
const autonomousPartner = createAutonomousPartner();
const studioRaycaster = new THREE.Raycaster();
const studioPointerNdc = new THREE.Vector2();
let studioPadRings = {};
let currentStudioCamPreset = 'full';
let lastPartnerHudText = '';
let cars = [];
const MAX_CHEAT_SPAWNED_VEHICLES = 4;
const cheatSpawnedCars = [];
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
let carOrbitYaw = 0;
let carOrbitPitch = 0.24;
let carOrbitLastMove = 0;
let carChaseHeading = null;
const freeCamBokehEl = document.querySelector('#freecam-bokeh');
const freeCam = {
  active: false,
  pos: new THREE.Vector3(),
  euler: new THREE.Euler(0, 0, 0, 'YXZ'),
  fwd: new THREE.Vector3(),
  right: new THREE.Vector3(),
  fov: 60,
  targetFov: 60,
  speed: 12.0,
};

function syncFreeCamBokeh() {
  if (!freeCamBokehEl) return;
  const zoomFrac = freeCam.active ? THREE.MathUtils.clamp((54 - freeCam.fov) / 36, 0, 1) : 0;
  freeCamBokehEl.style.setProperty('--bokeh-blur', `${(zoomFrac * 9.5).toFixed(1)}px`);
  freeCamBokehEl.classList.toggle('active', zoomFrac > 0.05);
}

function syncCursorVisibility() {
  const hasModalOpen = Boolean(
    inStudio
    || !started
    || freeCursorMode
    || carDoorCursorMode
    || liftKeypadOpen
    || khulnaMapUI?.isOpen
    || gtaPhoneUI?.isOpen
    || referenceModal?.open
    || (pause && !pause.classList.contains('hidden'))
  );
  const hideCursor = !hasModalOpen;
  document.documentElement.classList.toggle('gta-cursor-hidden', hideCursor);
  document.body.classList.toggle('gta-cursor-hidden', hideCursor);
  controls.setFreeMoveHover?.(hideCursor && started);
  controls.setMouseLookEnabled?.(hideCursor && started && !getDrivingCar() && !freeCam.active);
}

function toggleFreeCursorMode() {
  if (inStudio || khulnaMapUI?.isOpen || liftKeypadOpen || referenceModal?.open) return;
  if (gtaPhoneUI?.isOpen) return;
  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur?.();
  }
  // Clean deterministic [?] toggle: show cursor when hidden, hide & lock cursor when shown!
  if (freeCursorMode || carDoorCursorMode) {
    freeCursorMode = false;
    carDoorCursorMode = false;
    if (started) controls.lock();
    syncCursorVisibility();
    gtaPhoneUI?.showToast?.('🎮 Free Move — Mouse Hidden ([?] to show cursor)');
  } else {
    freeCursorMode = true;
    controls.unlock();
    syncCursorVisibility();
    gtaPhoneUI?.showToast?.('🖱️ Mouse Cursor ON — Press [?] to hide');
  }
}

function toggleFreeCam() {
  if (inStudio || !started) return;
  freeCam.active = !freeCam.active;
  document.body.classList.toggle('freecam-active', freeCam.active);
  if (freeCam.active) {
    freeCam.pos.copy(camera.position);
    freeCam.euler.setFromQuaternion(camera.quaternion, 'YXZ');
    freeCam.fov = 60;
    freeCam.targetFov = 60;
    freeCam.speed = 12.0;
    freeCursorMode = false;
    if (!controls.pointerLocked) controls.lock();
  } else {
    camera.fov = 60;
    camera.updateProjectionMatrix();
    syncFreeCamBokeh();
  }
  syncCursorVisibility();
}

function getLiveMapHeadingYaw() {
  const drivingCar = getDrivingCar();
  if (drivingCar) return drivingCar.state.heading + Math.PI;
  if (freeCam.active) return freeCam.euler.y;
  controls.euler.setFromQuaternion(camera.quaternion, 'YXZ');
  return controls.euler.y;
}

function getLiveMapPos() {
  const drivingCar = getDrivingCar();
  if (drivingCar) return drivingCar.state.pos;
  if (freeCam.active) return freeCam.pos;
  return playerPos;
}

const FIGHT_EMOTE_NAMES = new Set(['kick', 'kick2', 'combo', 'angry1', 'angry2']);
let lastMosqueToastAt = 0;
let wasPlayerInModelMosque = false;

function isPosInModelMosque(pos) {
  if (!pos || inStudio) return false;
  return Boolean(environment?.landmarks?.aliaMadrasah?.isInModelMosqueZone?.(pos));
}

function isFightEmote(emoteName) {
  return FIGHT_EMOTE_NAMES.has(emoteName);
}

function notifyMosqueSilence(msg = '🕌 মডেল মসজিদে ফাইট ও কথা বলা বন্ধ আছে — রাস্তায় বের হলে আবার চালু হবে।') {
  const now = performance.now();
  if (now - lastMosqueToastAt < 1800) return;
  lastMosqueToastAt = now;
  gtaPhoneUI?.showToast?.(msg);
}

function triggerPlayerCombatVoice() {
  if (!playerCharacter || isPosInModelMosque(playerPos)) return;
  specialAbility?.onCombatHit?.(playerPos);
  const distToPartner = Math.hypot(
    playerPos.x - (autonomousPartner.position?.x ?? 9999),
    playerPos.z - (autonomousPartner.position?.z ?? 9999),
  );
  healthSystem?.onCombatAction?.(distToPartner < 5.5);
  const startedPartnerExchange = autonomousPartner.triggerAnnoyedReaction(playerPos, true, playerCharacter);
  if (!startedPartnerExchange) {
    playerCharacter.playCombatVoice?.();
  }
}
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
let softwareRendererDetected = false;
let lowFpsStreak = 0;
let khulnaMapUI = null;
let gtaPhoneUI = null;
let aliaPrincipalMic = null;
let gtaCharacterSwitch = null;
let specialAbility = null;
let healthSystem = null;
let selfiePrevCamMode = null;
let lastMinimapUpdate = 0;
let lastUnlockMapOpenAt = 0;
let lastSunAnchorX = 0;
let lastSunAnchorZ = 0;
let lastShadowUpdateAt = 0;
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

  // Dual side-by-side studio stage for choosing between Sabit & Huzzatullah
  const platformMat = new THREE.MeshLambertMaterial({ color: 0x202a27 });
  const innerMat = new THREE.MeshLambertMaterial({ color: 0x2a3631 });

  const stage = new THREE.Mesh(new THREE.CylinderGeometry(1.78, 1.92, 0.08, 48), platformMat);
  stage.position.set(0, -0.04, 0);
  stage.scale.set(1.12, 1.0, 0.72);
  group.add(stage);

  studioPadRings = {};
  for (const cfg of CHARACTER_ROSTER) {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.60, 0.60, 0.015, 36), innerMat);
    disc.position.set(cfg.studioX, 0.002, 0);
    group.add(disc);

    const ringMat = new THREE.MeshBasicMaterial({ color: 0x4c625a });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.585, 0.615, 42), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(cfg.studioX, 0.012, 0);
    group.add(ring);
    studioPadRings[cfg.id] = ring;
  }

  return group;
}

function selectActiveCharacter(charId, { triggerGreeting = true, refreshCam = true } = {}) {
  const targetProfile = CHARACTER_ROSTER.find((c) => c.id === charId) || CHARACTER_ROSTER[0];
  const partnerProfile = CHARACTER_ROSTER.find((c) => c.id !== targetProfile.id) || CHARACTER_ROSTER[1];
  const prevActor = playerCharacter;

  selectedCharacterId = targetProfile.id;
  try {
    localStorage.setItem('taltola_character', selectedCharacterId);
  } catch {}

  const nextActor = characterActors[targetProfile.id];
  const partnerActor = characterActors[partnerProfile.id];
  if (nextActor) {
    if (prevActor && prevActor !== nextActor) {
      nextActor.state.studioAnim = prevActor.state.studioAnim || 'idle';
      nextActor.state.cameraMode = prevActor.state.cameraMode || 'back';
      nextActor.state.straightGaze = prevActor.state.straightGaze;
      nextActor.state.talking = prevActor.state.talking;
      nextActor.state.expression = prevActor.state.expression;
    }
    playerCharacter = nextActor;
    if (triggerGreeting && inStudio) {
      nextActor.state.studioAnim = 'greet';
      nextActor.state.emoteClock = 0;
      document.querySelectorAll('[data-anim]').forEach((b) => {
        b.classList.toggle('active', b.dataset.anim === 'greet');
      });
    }
  }
  if (partnerActor) {
    partnerActor.state.talking = false;
    partnerActor.state.expression = 'normal';
    partnerActor.state.studioAnim = 'idle';
    if (!inStudio) {
      autonomousPartner.setActor(partnerActor, partnerProfile);
    } else {
      autonomousPartner.setActor(partnerActor, partnerProfile);
    }
  }

  gtaPhoneUI?.setCharacterTheme?.(targetProfile.id);
  specialAbility?.setCharacter?.(targetProfile.id);

  for (const card of charSelectCards) {
    card.classList.toggle('active', card.dataset.charSelect === targetProfile.id);
  }
  for (const [id, ring] of Object.entries(studioPadRings)) {
    const active = id === targetProfile.id;
    ring.material.color.setHex(active ? 0xd9ed9c : 0x455852);
    ring.scale.setScalar(active ? 1.04 : 0.96);
  }
  if (inStudio && refreshCam) {
    studioOrbit.dragging = false;
    setStudioCameraPreset(currentStudioCamPreset);
  }
}

function setMode(studioMode) {
  const wasInStudio = inStudio;
  inStudio = studioMode;
  document.body.classList.toggle('in-game', !inStudio);
  if (inStudio) {
    liftKeypadOpen = false;
    liftKeypad?.classList.add('hidden');
    khulnaMapUI?.closeMap?.();
    partnerStatusPill?.classList.add('hidden');
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
    for (const actor of Object.values(characterActors)) {
      actor?.setEnvironmentMap?.(null);
      actor?.setSacredSilence?.(false);
    }
    if (brandTitle) brandTitle.textContent = 'CHARACTER STUDIO';
    if (brandSubtitle) brandSubtitle.textContent = 'SELECT HERO · DRAG TO ROTATE 360°';
    if (studioToggleButton) studioToggleButton.innerHTML = 'PLAY STREET GAME <span>→</span>';
    setStudioCameraPreset('full');
    selectActiveCharacter(selectedCharacterId, { triggerGreeting: false, refreshCam: true });
    applyQuality(quality);
    syncCursorVisibility();
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
    beginWalking(true);
    syncCursorVisibility();
    if (wasInStudio || Math.hypot(autonomousPartner.position.x, autonomousPartner.position.z) < 2.0) {
      autonomousPartner.relocateNearPlayer(playerPos, cars, environment, true);
    }
  }
}

function setUltraFastPerf(enabled) {
  ultraFastMode = enabled;
  if (!enabled) lowFpsStreak = 0;
  if (inStudio) return;
  const dpr = window.devicePixelRatio || 1;
  const isLow = quality === 'low';
  if (enabled && isLow && softwareRendererDetected) {
    // Never drop resolution below native 1.0x
    renderer.setPixelRatio(Math.min(dpr, 1.0));
    renderer.setSize(window.innerWidth, window.innerHeight);
    scene.fog.near = 140;
    scene.fog.far = 330;
    camera.far = 390;
    camera.updateProjectionMatrix();
    if (sun) {
      sun.visible = true;
      sun.castShadow = false;
    }
    renderer.shadowMap.enabled = false;
    if (hemisphereLight) hemisphereLight.intensity = 1.15;
    document.body.classList.add('low-perf-ui');
  }
}

function updateSunShadowTarget(focusPos, nowPerf = performance.now(), forceDynamic = false) {
  if (!sun || inStudio) return;
  const radius = quality === 'ultra' ? 38 : (quality === 'high' ? 30 : (quality === 'medium' ? 22 : 18));
  const mapSize = sun.shadow.mapSize.x || 1536;
  const worldUnitsPerTexel = (radius * 2) / mapSize;

  // Texel-snap shadow frustum center to eliminate shadow edge shimmer while walking or driving!
  const snapX = Math.round(focusPos.x / worldUnitsPerTexel) * worldUnitsPerTexel;
  const snapZ = Math.round(focusPos.z / worldUnitsPerTexel) * worldUnitsPerTexel;

  const moveThresh = quality === 'ultra' ? 0.45 : (quality === 'high' ? 0.55 : 0.70);
  const anchorMoved = Math.abs(snapX - lastSunAnchorX) > moveThresh || Math.abs(snapZ - lastSunAnchorZ) > moveThresh;
  const activeDrivingSpeed = Math.abs(getDrivingCar()?.state?.speed || 0);
  const baseCadence = quality === 'ultra' ? 110 : (quality === 'high' ? 140 : (quality === 'medium' ? 180 : 240));
  const driveCadence = quality === 'ultra' ? 160 : (quality === 'high' ? 200 : 240);
  const shadowCadenceMs = activeDrivingSpeed > 4.0 ? Math.max(baseCadence, driveCadence) : baseCadence;
  const elapsedSinceShadow = nowPerf - lastShadowUpdateAt;
  if (anchorMoved && (lastShadowUpdateAt === 0 || elapsedSinceShadow >= shadowCadenceMs)) {
    lastSunAnchorX = snapX;
    lastSunAnchorZ = snapZ;
    updateSunPositionFromAnchor(snapX, snapZ);
    sun.target.updateMatrixWorld();
    renderer.shadowMap.needsUpdate = true;
    lastShadowUpdateAt = nowPerf;
    return;
  }

  if (lastShadowUpdateAt === 0 || (forceDynamic && elapsedSinceShadow >= shadowCadenceMs)) {
    renderer.shadowMap.needsUpdate = true;
    lastShadowUpdateAt = nowPerf;
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
  const isUltra = quality === 'ultra';
  const isHigh = quality === 'high';
  // 4 Game-Style Presets: Low Smooth (crisp high-detail at 60 FPS), Medium, High, Ultra 4K (full native resolution + glow + soft shadows)
  const ratios = {
    low: Math.min(dpr, 1.15),
    medium: Math.min(dpr, 1.35),
    high: Math.min(dpr, 1.60),
    ultra: Math.min(dpr, 2.0),
  };
  const shadowSizes = { low: 1024, medium: 1024, high: 1536, ultra: 2048 };
  const useShadows = shadowsOverride === 'on' ? true : (shadowsOverride === 'off' ? false : !isLow);
  const activeRatio = ratios[quality] ?? ratios.high;

  renderer.setPixelRatio(activeRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMappingExposure = isUltra ? 1.12 : (isHigh ? 1.09 : (isLow ? 1.06 : 1.07));
  if (composer) {
    composer.setPixelRatio(activeRatio);
    composer.setSize(window.innerWidth, window.innerHeight);
    bloomPass?.setSize?.(
      Math.max(192, Math.floor(window.innerWidth * 0.25)),
      Math.max(108, Math.floor(window.innerHeight * 0.25))
    );
  }
  renderer.shadowMap.enabled = useShadows;
  renderer.shadowMap.type = (isUltra || isHigh) ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  if (useShadows) {
    renderer.shadowMap.needsUpdate = true;
    lastShadowUpdateAt = 0;
  }

  document.body.classList.toggle('low-perf-ui', isLow);

  if (!inStudio) {
    scene.fog.near = isLow ? 145 : (quality === 'medium' ? 185 : (isUltra ? 260 : 215));
    scene.fog.far = isLow ? 340 : (quality === 'medium' ? 430 : (isUltra ? 620 : 510));
    camera.far = isLow ? 390 : (quality === 'medium' ? 480 : (isUltra ? 660 : 550));
    camera.updateProjectionMatrix();
    environment?.setFogBounds?.(scene.fog.near, scene.fog.far);
  }

  // Keep studioKeyLight & fillDirLight strictly in Character Studio (folding outdoor fill into hemisphereLight saves a full PBR directional light pass on EVERY pixel!)
  if (studioKeyLight) studioKeyLight.visible = inStudio;
  if (fillDirLight) {
    fillDirLight.visible = inStudio;
    fillDirLight.intensity = isUltra ? 0.76 : 0.60;
  }
  if (indoorLight) {
    indoorLight.visible = !isLow;
    if (isLow) indoorLight.intensity = 0;
  }
  if (ambientLight) {
    ambientLight.visible = true;
    ambientLight.intensity = isLow && !inStudio ? 0.56 : (isUltra ? 0.52 : 0.46);
  }
  if (hemisphereLight) {
    hemisphereLight.visible = true;
    hemisphereLight.intensity = isLow && !inStudio ? 1.18 : (isUltra ? 1.12 : 1.06);
    hemisphereLight.color.setHex(0xbad9f7);
    hemisphereLight.groundColor.setHex(0x685b4a);
  }
  if (sun) {
    sun.visible = true;
    sun.intensity = isUltra ? 2.58 : (isHigh ? 2.28 : 2.02);
    sun.castShadow = useShadows;
    if (useShadows) {
      const size = shadowSizes[quality] || 2048;
      const radius = isUltra ? 38 : (isHigh ? 30 : (quality === 'medium' ? 22 : 18));
      sun.shadow.camera.left = -radius;
      sun.shadow.camera.right = radius;
      sun.shadow.camera.top = radius;
      sun.shadow.camera.bottom = -radius;
      sun.shadow.camera.near = 2;
      sun.shadow.camera.far = isUltra ? 165 : 140;
      sun.shadow.camera.updateProjectionMatrix();

      if (sun.shadow.mapSize.x !== size || sun.shadow.mapSize.y !== size) {
        sun.shadow.mapSize.set(size, size);
        if (sun.shadow.map) {
          sun.shadow.map.dispose();
          sun.shadow.map = null;
        }
      }
      sun.shadow.bias = isUltra ? -0.00035 : -0.0005;
      sun.shadow.normalBias = isUltra ? 0.028 : 0.035;
      renderer.shadowMap.needsUpdate = true;
      lastShadowUpdateAt = 0;
    }
  }

  // Keep showroom dual-lobe clearcoat strictly on hero vehicles & hero character (saves ~40% fragment shader cost across static world buildings!)
  const seenPhysMats = new Set();
  const isInsideVehicle = (obj) => {
    let cur = obj;
    while (cur) {
      if (cur.name && cur.name.startsWith('DrivableCar_')) return true;
      cur = cur.parent;
    }
    return false;
  };
  scene.traverse((obj) => {
    if (!obj.isMesh || !obj.material || obj.userData?._isCharacterMesh) return;
    const isVeh = isInsideVehicle(obj);
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (let i = 0; i < mats.length; i++) {
      const mat = mats[i];
      if (!mat || !mat.isMeshPhysicalMaterial || seenPhysMats.has(mat)) continue;
      seenPhysMats.add(mat);
      if (mat.userData._origClearcoat === undefined) {
        mat.userData._origClearcoat = mat.clearcoat || 0;
      }
      const wantCC = (!isLow && isVeh) ? mat.userData._origClearcoat : 0;
      if (mat.clearcoat !== wantCC) {
        mat.clearcoat = wantCC;
        mat.needsUpdate = true;
      }
    }
  });

  sceneMaterials?.setQualityMode?.(quality);
  environment?.setQualityMode?.(quality);
  environment?.tower?.setQualityMode?.(quality);
  environment?.city?.refreshActiveChunks?.(playerPos.x, playerPos.z, quality);
  if (Object.keys(characterActors).length) {
    for (const actor of Object.values(characterActors)) {
      actor?.setQualityMode?.(quality);
    }
  } else {
    playerCharacter?.setQualityMode?.(quality);
  }
  for (const c of cars) {
    c?.setQualityMode?.(quality);
  }
  if (environment?.farGroup) environment.farGroup.visible = true;
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

  // Single pooled warm indoor PointLight (permanently visible=true, intensity modulated so ZERO shader recompilation hitches!)
  indoorLight = new THREE.PointLight(0xfff3d8, 0, 14.5, 1.35);
  indoorLight.visible = true;
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
        ? '<kbd>SHIFT / R</kbd> SPRINT: ON'
        : '<kbd>SHIFT / R</kbd> SPRINT';
    }
  }
}

function toggleRunMode() {
  runModeToggle = !runModeToggle;
  syncHUDButtons(runModeToggle, true);
}

function getActiveLiftTower() {
  if (house?.isInTowerFootprint?.(playerPos, 3.0)) {
    return house;
  }
  if (environment?.landmarks?.judgeCourt?.isInTowerFootprint?.(playerPos, 6.0)) {
    return environment.landmarks.judgeCourt;
  }
  if (environment?.altapoleTower?.isInTowerFootprint?.(playerPos, 10.0)) {
    return environment.altapoleTower;
  }
  const goliLift = environment?.altapoleGoli?.getActiveLiftTower?.(playerPos);
  if (goliLift) return goliLift;
  return environment?.tower || null;
}

let lastLiftKeypadUiKey = '';
function syncLiftKeypadUI() {
  const tower = getActiveLiftTower();
  if (!tower || !liftKeypad) return;
  const st = tower.state;
  const stops = tower.stops || [];
  const uiKey = `${tower.eyebrowTitle || ''}|${st.liftFloorIndex}|${st.liftTargetIndex}|${st.liftPhase}|${st.liftDirection}|${st.liftDoorOpen >= 0.85 ? 2 : (st.liftDoorOpen > 0.6 ? 1 : 0)}|${stops.length}`;
  if (uiKey === lastLiftKeypadUiKey) return;
  lastLiftKeypadUiKey = uiKey;
  const curStop = stops[st.liftFloorIndex] || { code: 'GF', label: 'Ground Lobby' };
  const tgtStop = stops[st.liftTargetIndex] || curStop;
  const isMoving = st.liftPhase === 'moving' || st.liftPhase === 'closing';
  const curName = curStop.label || curStop.nameBn || 'Ground Lobby';
  const tgtName = tgtStop.label || tgtStop.nameBn || curName;

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
      liftLedStatus.textContent = `MOVING → ${tgtName}`;
    } else if (st.liftPhase === 'opening') {
      liftLedStatus.textContent = 'DOORS OPENING...';
    } else if (st.liftPhase === 'closing') {
      liftLedStatus.textContent = 'DOORS CLOSING...';
    } else if (st.liftDoorOpen >= 0.85) {
      liftLedStatus.textContent = 'DOORS OPEN · SELECT A FLOOR';
    } else {
      liftLedStatus.textContent = 'READY · SELECT A FLOOR';
    }
  }

  const liftEyebrow = liftKeypad.querySelector('.lift-eyebrow');
  if (liftEyebrow) {
    liftEyebrow.textContent = tower.eyebrowTitle
      || (tower === environment?.altapoleTower
        ? '29 UPPER JESSORE RD · ALTAPOLE LANE'
        : 'SK ARSHAN ALIF TOWER');
  }

  const roofIdx = stops.length - 1;
  for (const btn of liftFloorButtons) {
    const rawIdx = Number(btn.dataset.liftFloor);
    const isRoofBtn = rawIdx === 10;
    const mappedIdx = isRoofBtn ? roofIdx : rawIdx;
    const showBtn = isRoofBtn || rawIdx < roofIdx;
    btn.style.display = showBtn ? '' : 'none';
    if (showBtn && stops[mappedIdx]) {
      const lblEl = btn.querySelector('.lift-btn-label');
      if (lblEl) lblEl.textContent = stops[mappedIdx].label;
    }
    const isCurrent = showBtn && mappedIdx === st.liftFloorIndex && !isMoving;
    const isTarget = showBtn && mappedIdx === st.liftTargetIndex && isMoving;
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
  syncCursorVisibility();
}

function closeLiftKeypad(relock = true) {
  liftKeypadOpen = false;
  liftKeypad?.classList.add('hidden');
  if (relock && started && !inStudio && !referenceModal?.open) {
    freeCursorMode = false;
    pause?.classList.add('hidden');
    walkHud?.classList.remove('hidden');
    controls.lock();
  }
  syncCursorVisibility();
}

function selectLiftFloor(floorIndex) {
  const tower = getActiveLiftTower();
  if (!tower) return false;
  const stops = tower.stops || [];
  const rawIdx = Math.round(floorIndex);
  const idx = rawIdx === 10 ? (stops.length - 1) : THREE.MathUtils.clamp(rawIdx, 0, stops.length - 1);

  const isCustomTower = tower !== environment?.tower;
  const insideTower = isCustomTower
    ? tower.isInTowerFootprint(playerPos, 2.0)
    : (playerPos.x <= -2.8 && playerPos.x >= -19.9 && playerPos.z >= 14.25 && playerPos.z <= 28.6);
  if (insideTower && !tower.isInsideLift(playerPos)) {
    if (sittingState.active) standUpFromSeat();
    const footY = playerPos.y - EYE_HEIGHT;
    const nearK = tower.nearestFloorIndex(footY);
    if (tower.state.liftPhase !== 'moving' && tower.state.liftFloorIndex !== nearK) {
      tower.state.liftFloorIndex = nearK;
      tower.state.liftY = stops[nearK].y;
    }
    const cx = isCustomTower ? tower.liftCabinCenter.x : -12.38;
    const cz = isCustomTower ? tower.liftCabinCenter.z : 19.55;
    playerPos.set(cx, tower.state.liftY + EYE_HEIGHT, cz);
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

let lastWallProbeAt = 0;
function probeWallAhead() {
  if (!started || inStudio || sittingState.active || climbState.active) return false;
  controls.getHorizontalVectors(forwardVec, rightVec);
  const stepDist = 0.64;
  // 1) Must be blocked horizontally right ahead at current height (read-only probe — never mutates pole sway!)
  wallProbePos.set(
    playerPos.x + forwardVec.x * stepDist,
    playerPos.y,
    playerPos.z + forwardVec.z * stepDist,
  );
  const bx1 = wallProbePos.x;
  const bz1 = wallProbePos.z;
  applyWorldCollisions(wallProbePos, true);
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
  applyWorldCollisions(wallProbePos, true);
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

function getTargetCarForDoors() {
  const driving = getDrivingCar();
  if (driving && !driving.state.isRickshaw) return driving;
  const near = findNearestEnterableCar(playerPos);
  if (near && !near.state.isRickshaw) return near;
  return null;
}

let lastCarDoorUiKey = '';
function syncCarDoorUI() {
  const driving = getDrivingCar();
  const nearCar = (!driving && started && !inStudio) ? findNearestEnterableCar(playerPos) : null;
  const showNearbyPanel = Boolean(nearCar && !nearCar.state.isRickshaw && !liftKeypadOpen && !khulnaMapUI?.isOpen);
  const targetCar = (driving && !driving.state.isRickshaw) ? driving : (showNearbyPanel ? nearCar : null);
  const ds = targetCar?.getDoorStates?.() || { FL: false, FR: false, RL: false, RR: false, anyOpen: false, allOpen: false };
  const uiKey = `${showNearbyPanel ? 1 : 0}|${nearCar?.state?.name || ''}|${ds.FL ? 1 : 0}${ds.FR ? 1 : 0}${ds.RL ? 1 : 0}${ds.RR ? 1 : 0}${ds.allOpen ? 1 : 0}`;
  if (uiKey === lastCarDoorUiKey) return;
  lastCarDoorUiKey = uiKey;
  carDoorPanel?.classList.toggle('hidden', !showNearbyPanel);
  if (showNearbyPanel && carDoorTitle) {
    carDoorTitle.textContent = `${nearCar.state.name} · Doors`;
  }
  for (const btn of carDoorButtons) {
    const key = btn.dataset.carDoor;
    if (key === 'ALL') btn.classList.toggle('open', Boolean(ds.allOpen));
    else btn.classList.toggle('open', Boolean(ds[key]));
  }
  if (carDoorAllBtn) {
    carDoorAllBtn.classList.toggle('open', Boolean(ds.allOpen));
    carDoorAllBtn.textContent = ds.allOpen ? 'CLOSE ALL DOORS' : 'OPEN ALL DOORS';
  }
}

let lastCarToggleHtml = '';
let lastCarDrivingFlag = null;
let lastCarBadgeText = '';
let lastCarSpeedText = '';
let lastCarGearText = '';
let lastCarRpmWidth = '';
let lastCarCamLabelText = '';
let lastCarSeatLabelText = '';
let lastCarPaintText = '';
let lastTachoKey = '';
let lastTachoDrawAt = 0;
let cachedTachoGradCar = null;
let cachedTachoGradRick = null;

function syncCarHUD() {
  if (!cars.length) return;
  const activeCar = getDrivingCar();
  const driving = Boolean(activeCar);
  if (carToggleButton) {
    const nextToggleHtml = driving
      ? (activeCar.state.isVan ? 'EXIT VAN <span>[T]</span>' : (activeCar.state.isBicycle ? 'EXIT BICYCLE <span>[T]</span>' : (activeCar.state.isRickshaw ? 'EXIT RICKSHAW <span>[T]</span>' : (activeCar.state.isBike ? 'EXIT BIKE <span>[T]</span>' : 'EXIT CAR <span>[T]</span>'))))
      : 'DRIVE CAR <span>[T]</span>';
    if (nextToggleHtml !== lastCarToggleHtml) {
      lastCarToggleHtml = nextToggleHtml;
      carToggleButton.innerHTML = nextToggleHtml;
    }
  }
  if (driving !== lastCarDrivingFlag) {
    lastCarDrivingFlag = driving;
    carHud?.classList.toggle('hidden', !driving);
    emoteBar?.classList.toggle('hidden', driving);
  }
  if (driving && activeCar) {
    const isRick = Boolean(activeCar.state.isRickshaw);
    const isBicycle = Boolean(activeCar.state.isBicycle);
    const isVan = Boolean(activeCar.state.isVan);
    const isBike = Boolean(activeCar.state.isBike);
    const isPass = isRick && activeCar.state.rideSeat === 'passenger';
    if (carBadgeEl) {
      let nextBadge = '';
      if (isRick) {
        const stR = activeCar.state;
        const pedLabel = isVan ? 'CARGO VAN' : (isBicycle ? 'ATLAS BICYCLE' : 'RICKSHAW');
        nextBadge = isPass
          ? (isVan ? `CARGO VAN · BACK SEAT (${stR.passengerSeatIndex + 1}/4)` : (isBicycle ? 'ATLAS BICYCLE · BACK SEAT' : 'RICKSHAW · PASSENGER SEAT'))
          : (stR.boostCooldown > 0
            ? `${pedLabel} · COOLDOWN (${Math.ceil(stR.boostCooldown)}s)`
            : (stR.standingPedal
              ? `${pedLabel} · STANDING SPRINT (${Math.ceil(stR.boostStamina)}s)`
              : `${pedLabel} · SPRINT READY [SHIFT]`));
      } else {
        nextBadge = activeCar.state.badge;
      }
      if (nextBadge !== lastCarBadgeText) {
        lastCarBadgeText = nextBadge;
        carBadgeEl.textContent = nextBadge;
      }
    }
    if (carSeatBtn) carSeatBtn.classList.toggle('hidden', !isRick);
    if (carHudDoorsEl) carHudDoorsEl.classList.toggle('hidden', isRick || isBike);
    if (carSeatLabelEl && isRick) {
      const nextSeatLabel = isPass
        ? (isVan ? `CORNER ${activeCar.state.passengerSeatIndex + 1}/4` : (isBicycle ? 'RIDER SEAT' : 'DRIVER SEAT'))
        : (isVan ? 'BACK SEATS (4)' : (isBicycle ? 'BACK SEAT' : 'PASSENGER SEAT'));
      if (nextSeatLabel !== lastCarSeatLabelText) {
        lastCarSeatLabelText = nextSeatLabel;
        carSeatLabelEl.textContent = nextSeatLabel;
      }
    }
    if (carCamLabelEl) {
      const camNames = { chase: '3RD PERSON', hood: 'HOOD CAM', pov: 'POV SPEEDO', front: 'FRONT CAM' };
      const nextCamLabel = isRick ? 'CAMERA' : (camNames[activeCar.state.cameraMode] || '3RD PERSON');
      if (nextCamLabel !== lastCarCamLabelText) {
        lastCarCamLabelText = nextCamLabel;
        carCamLabelEl.textContent = nextCamLabel;
      }
    }
    carPovBtn?.classList.remove('active');
    const liveKmh = Math.round(Math.abs(activeCar.state.speed) * 3.6);
    const liveGear = isRick ? (isPass ? 'P' : (activeCar.state.standingPedal ? 'S' : 'D')) : String(activeCar.state.gear);
    const rpmPct = isRick
      ? (activeCar.state.boostCooldown > 0
        ? THREE.MathUtils.clamp((20 - activeCar.state.boostCooldown) / 20, 0.02, 1)
        : THREE.MathUtils.clamp(activeCar.state.boostStamina / 10, 0.02, 1))
      : THREE.MathUtils.clamp((activeCar.state.rpm - 800) / 7200, 0.02, 1);
    const liveKmhStr = String(liveKmh);
    if (carSpeedEl && liveKmhStr !== lastCarSpeedText) {
      lastCarSpeedText = liveKmhStr;
      carSpeedEl.textContent = liveKmhStr;
    }
    if (carGearEl && liveGear !== lastCarGearText) {
      lastCarGearText = liveGear;
      carGearEl.textContent = liveGear;
    }
    const nextRpmWidth = `${(rpmPct * 100).toFixed(1)}%`;
    if (carRpmFill && nextRpmWidth !== lastCarRpmWidth) {
      lastCarRpmWidth = nextRpmWidth;
      carRpmFill.style.width = nextRpmWidth;
    }
    const nowTacho = performance.now();
    const tachoKey = `${liveKmh}|${liveGear}|${Math.round(rpmPct * 120)}|${isRick ? 1 : 0}`;
    if (forzaTachoCtx && forzaTachoCanvas && tachoKey !== lastTachoKey && (nowTacho - lastTachoDrawAt >= 32 || lastTachoDrawAt === 0)) {
      lastTachoKey = tachoKey;
      lastTachoDrawAt = nowTacho;
      const ctx = forzaTachoCtx;
      const W = forzaTachoCanvas.width;
      const H = forzaTachoCanvas.height;
      const cx = W * 0.5;
      const cy = H * 0.56;
      const rOuter = 94;
      const startA = Math.PI * 0.78;
      const endA = Math.PI * 2.22;
      const spanA = endA - startA;
      const redStart = startA + spanA * 0.79;
      const valA = startA + spanA * rpmPct;

      ctx.clearRect(0, 0, W, H);
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter + 7, startA - 0.06, endA + 0.06);
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, rOuter - 4, startA, endA);
      ctx.strokeStyle = 'rgba(148,163,184,0.22)';
      ctx.lineWidth = 11;
      ctx.lineCap = 'butt';
      ctx.stroke();

      if (!isRick) {
        ctx.beginPath();
        ctx.arc(cx, cy, rOuter - 4, redStart, endA);
        ctx.strokeStyle = 'rgba(239,68,68,0.42)';
        ctx.lineWidth = 11;
        ctx.stroke();
      }

      if (!cachedTachoGradCar) {
        cachedTachoGradCar = ctx.createLinearGradient(cx - rOuter, cy, cx + rOuter, cy);
        cachedTachoGradCar.addColorStop(0, '#38bdf8');
        cachedTachoGradCar.addColorStop(0.65, '#f8fafc');
        cachedTachoGradCar.addColorStop(0.84, '#f97316');
        cachedTachoGradCar.addColorStop(1, '#ef4444');
        cachedTachoGradRick = ctx.createLinearGradient(cx - rOuter, cy, cx + rOuter, cy);
        cachedTachoGradRick.addColorStop(0, '#22c55e');
        cachedTachoGradRick.addColorStop(1, '#facc15');
      }
      const grad = isRick ? cachedTachoGradRick : cachedTachoGradCar;
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter - 4, startA, valA);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 11;
      ctx.stroke();

      for (let i = 0; i <= 16; i++) {
        const frac = i / 16;
        const ang = startA + spanA * frac;
        const isMajor = i % 2 === 0;
        const isRed = !isRick && frac >= 0.79;
        const rIn = rOuter - (isMajor ? 20 : 14);
        const rOut = rOuter + 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * rIn, cy + Math.sin(ang) * rIn);
        ctx.lineTo(cx + Math.cos(ang) * rOut, cy + Math.sin(ang) * rOut);
        ctx.strokeStyle = isRed ? '#ef4444' : (isMajor ? '#f8fafc' : 'rgba(226,232,240,0.45)');
        ctx.lineWidth = isMajor ? 2.4 : 1.2;
        ctx.stroke();
        if (isMajor) {
          const rTxt = rOuter - 32;
          ctx.font = '700 13px Manrope, sans-serif';
          ctx.fillStyle = isRed ? '#f87171' : '#e2e8f0';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(i / 2), cx + Math.cos(ang) * rTxt, cy + Math.sin(ang) * rTxt);
        }
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(valA);
      ctx.beginPath();
      ctx.moveTo(-14, -2.5);
      ctx.lineTo(rOuter - 8, 0);
      ctx.lineTo(-14, 2.5);
      ctx.closePath();
      ctx.fillStyle = (!isRick && rpmPct >= 0.79) ? '#ef4444' : '#f97316';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();

      // Transparent Forza Horizon center readout (no dark solid box — crisp drop-shadow text over the game!)
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.92)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 42px Manrope, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(liveKmh).padStart(2, '0'), cx, cy - 4);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '700 11px Manrope, sans-serif';
      ctx.fillText('KM/H', cx, cy + 23);
      ctx.restore();

      ctx.fillStyle = (!isRick && rpmPct >= 0.82) ? '#ef4444' : '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(cx - 19, cy + 44, 38, 26, 7);
      ctx.fill();
      ctx.fillStyle = '#06101c';
      ctx.font = '800 16px Manrope, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(liveGear, cx, cy + 58);

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 5;
      ctx.fillStyle = 'rgba(241,245,249,0.92)';
      ctx.font = '700 10px Manrope, sans-serif';
      ctx.fillText(isRick ? 'STAMINA' : 'RPM x1000', cx, cy + 82);
      if (!isRick) {
        ctx.fillStyle = '#4ade80';
        ctx.font = '700 9.5px Manrope, sans-serif';
        ctx.fillText('ABS', cx - 44, cy + 58);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('TCS', cx + 44, cy + 58);
      }
      ctx.restore();
    }
    if (carPaintNameEl) {
      const nextPaint = activeCar.state.paintName.split(' ').pop();
      if (nextPaint !== lastCarPaintText) {
        lastCarPaintText = nextPaint;
        carPaintNameEl.textContent = nextPaint;
      }
    }
    if (carDamageWrapEl) {
      const hp = Math.round(activeCar.state.health ?? 100);
      const hpStr = String(hp);
      if (carDamageWrapEl.dataset.health !== hpStr) {
        carDamageWrapEl.dataset.health = hpStr;
        if (carDamageFillEl) carDamageFillEl.style.width = `${hp}%`;
        if (carDamagePctEl) carDamagePctEl.textContent = `${hp}%`;
      }
    }
  }
  syncCarDoorUI();
}

const vehicleTransition = {
  active: false,
  type: null, // 'rickshaw_mount_driver' | 'rickshaw_dismount_driver' | 'rickshaw_mount_passenger' | 'rickshaw_dismount_passenger' | 'car_enter' | 'car_exit'
  car: null,
  seatMode: 'driver',
  passengerSeatIndex: 0,
  elapsed: 0,
  duration: 0.75,
  fadeSwapped: false,
  doorOpenedCue: false,
  doorClosedCue: false,
  beltCue: false,
  kickstandCue: false,
  startPos: new THREE.Vector3(),
  endPos: new THREE.Vector3(),
  handTarget: new THREE.Vector3(),
};

function startVehicleTransition(type, car, seatMode = 'driver', passengerSeatIndex = 0) {
  const st = car.state;
  const sinH = Math.sin(st.heading);
  const cosH = Math.cos(st.heading);
  const rx = cosH;
  const rz = -sinH;

  vehicleTransition.active = true;
  vehicleTransition.type = type;
  vehicleTransition.car = car;
  vehicleTransition.seatMode = seatMode;
  vehicleTransition.passengerSeatIndex = passengerSeatIndex;
  vehicleTransition.elapsed = 0;
  vehicleTransition.fadeSwapped = false;
  vehicleTransition.doorOpenedCue = false;
  vehicleTransition.doorClosedCue = false;
  vehicleTransition.beltCue = false;
  vehicleTransition.kickstandCue = false;
  if (vehicleFadeEl) vehicleFadeEl.style.opacity = '0';

  if (type === 'bike_mount') {
    vehicleTransition.duration = 1.15;
    vehicleTransition.startPos.set(st.pos.x + rx * 0.72 - sinH * 0.22, st.pos.y + EYE_HEIGHT, st.pos.z + rz * 0.72 - cosH * 0.22);
    vehicleTransition.endPos.set(st.pos.x - sinH * 0.22, st.pos.y + 0.04 + EYE_HEIGHT, st.pos.z - cosH * 0.22);
  } else if (type === 'bike_dismount') {
    vehicleTransition.duration = 1.12;
    vehicleTransition.startPos.set(st.pos.x - sinH * 0.22, st.pos.y + 0.04 + EYE_HEIGHT, st.pos.z - cosH * 0.22);
    vehicleTransition.endPos.set(st.pos.x + rx * 0.84 - sinH * 0.22, st.pos.y + EYE_HEIGHT, st.pos.z + rz * 0.84 - cosH * 0.22);
  } else if (type === 'rickshaw_mount_driver') {
    const seatBack = st.isBicycle ? 0.30 : (st.isVan ? 0.08 : 0.05);
    const seatLift = st.isBicycle ? 0.08 : (st.isVan ? 0.10 : 0.16);
    if (st.isBicycle) {
      // Stand right beside LEFT (+rx) rear kickstand so right foot hooks & flicks it UP smoothly with zero over-reach!
      vehicleTransition.duration = 1.18;
      vehicleTransition.startPos.set(st.pos.x + rx * 0.54 - sinH * 0.50, st.pos.y + EYE_HEIGHT, st.pos.z + rz * 0.54 - cosH * 0.50);
      vehicleTransition.endPos.set(st.pos.x - sinH * seatBack, st.pos.y + seatLift + EYE_HEIGHT, st.pos.z - cosH * seatBack);
    } else {
      vehicleTransition.duration = 0.78;
      vehicleTransition.startPos.set(st.pos.x + rx * 0.78 - sinH * seatBack, st.pos.y + EYE_HEIGHT, st.pos.z + rz * 0.78 - cosH * seatBack);
      vehicleTransition.endPos.set(st.pos.x - sinH * seatBack, st.pos.y + seatLift + EYE_HEIGHT, st.pos.z - cosH * seatBack);
    }
  } else if (type === 'rickshaw_dismount_driver') {
    const seatBack = st.isBicycle ? 0.30 : (st.isVan ? 0.08 : 0.05);
    const seatLift = st.isBicycle ? 0.08 : (st.isVan ? 0.10 : 0.16);
    if (st.isBicycle) {
      vehicleTransition.duration = 1.12;
      vehicleTransition.startPos.set(st.pos.x - sinH * seatBack, st.pos.y + seatLift + EYE_HEIGHT, st.pos.z - cosH * seatBack);
      vehicleTransition.endPos.set(st.pos.x + rx * 0.56 - sinH * 0.50, st.pos.y + EYE_HEIGHT, st.pos.z + rz * 0.56 - cosH * 0.50);
    } else {
      vehicleTransition.duration = 0.68;
      vehicleTransition.startPos.set(st.pos.x - sinH * seatBack, st.pos.y + seatLift + EYE_HEIGHT, st.pos.z - cosH * seatBack);
      vehicleTransition.endPos.set(st.pos.x + rx * 0.92 - sinH * seatBack, st.pos.y + EYE_HEIGHT, st.pos.z + rz * 0.92 - cosH * seatBack);
    }
  } else if (type === 'rickshaw_mount_passenger') {
    vehicleTransition.duration = 0.54;
    const vanPose = st.isVan ? car.getVanSeatPose?.(passengerSeatIndex) : null;
    if (vanPose) {
      vehicleTransition.startPos.set(vanPose.dismountPos.x, st.pos.y + EYE_HEIGHT, vanPose.dismountPos.z);
      vehicleTransition.endPos.set(vanPose.seatPos.x, st.pos.y + 0.22 + EYE_HEIGHT, vanPose.seatPos.z);
    } else {
      vehicleTransition.startPos.set(st.pos.x + rx * 0.92 - sinH * 0.62, st.pos.y + EYE_HEIGHT, st.pos.z + rz * 0.92 - cosH * 0.62);
      vehicleTransition.endPos.set(st.pos.x - sinH * 0.62, st.pos.y + 0.24 + EYE_HEIGHT, st.pos.z - cosH * 0.62);
    }
  } else if (type === 'rickshaw_dismount_passenger') {
    vehicleTransition.duration = 0.50;
    const vanPose = st.isVan ? car.getVanSeatPose?.(passengerSeatIndex) : null;
    if (vanPose) {
      vehicleTransition.startPos.set(vanPose.seatPos.x, st.pos.y + 0.22 + EYE_HEIGHT, vanPose.seatPos.z);
      vehicleTransition.endPos.set(vanPose.dismountPos.x, st.pos.y + EYE_HEIGHT, vanPose.dismountPos.z);
    } else {
      vehicleTransition.startPos.set(st.pos.x - sinH * 0.62, st.pos.y + 0.24 + EYE_HEIGHT, st.pos.z - cosH * 0.62);
      vehicleTransition.endPos.set(st.pos.x + rx * 1.00 - sinH * 0.62, st.pos.y + EYE_HEIGHT, st.pos.z + rz * 1.00 - cosH * 0.62);
    }
  } else if (type === 'car_enter' || type === 'car_exit') {
    vehicleTransition.duration = 0.78;
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

  // Smooth black-screen fade-in -> instant swap -> fade-out into 3rd-person car view (or walking on exit)
  if (vt.type === 'car_enter' || vt.type === 'car_exit') {
    let alpha = 0;
    if (p < 0.44) alpha = p / 0.44;
    else if (p < 0.56) alpha = 1.0;
    else alpha = Math.max(0, 1.0 - (p - 0.56) / 0.44);
    if (vehicleFadeEl) vehicleFadeEl.style.opacity = alpha.toFixed(3);

    if (p >= 0.45 && !vt.fadeSwapped) {
      vt.fadeSwapped = true;
      car.playDoorSound?.(true);
      if (vt.type === 'car_enter') {
        carOrbitYaw = 0;
        carOrbitPitch = 0.22;
        carOrbitLastMove = 0;
        carChaseHeading = st.heading;
        car.enterCar('driver');
        playerPos.set(st.pos.x, st.pos.y + EYE_HEIGHT, st.pos.z);
        camera.position.set(st.pos.x - sinH * st.camBack, st.pos.y + st.camHeight, st.pos.z - cosH * st.camBack);
        camera.lookAt(st.pos.x + sinH * 4.5, st.pos.y + 1.05, st.pos.z + cosH * 4.5);
        if (playerCharacter) {
          playerCharacter.update(delta, {
            position: playerPos,
            yaw: st.heading + Math.PI,
            speed: 0,
            maxSpeed: 3.45,
            grounded: true,
            isSprinting: false,
            inStudio: false,
            hideMesh: false,
            carDrive: {
              active: true,
              heading: st.heading,
              steerAngle: st.steerAngle,
              speed: st.speed,
              anchors: car.getCarDriverAnchors?.(),
            },
          });
        }
        syncCarHUD();
        updateHUDPrompt();
      } else {
        car.exitCar(playerPos);
        controls.euler.set(-0.04, st.heading + Math.PI, 0, 'YXZ');
        camera.quaternion.setFromEuler(controls.euler);
        if (baseCamNear > 0) syncCameraNear(baseCamNear);
        if (playerCharacter) {
          playerCharacter.state.facingYaw = st.heading;
          controls.getHorizontalVectors(forwardVec, rightVec);
          camDesiredPos.copy(playerPos).addScaledVector(forwardVec, -1.95);
          camDesiredPos.y = playerPos.y + 0.22;
          const camRes = resolveThirdPersonCamera(playerPos, camDesiredPos, st.pos.y, 0.016, true, true);
          camera.position.copy(camRes.camPos);
          playerCharacter.update(delta, {
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
        syncCarHUD();
        updateHUDPrompt();
      }
    }

    if (vt.fadeSwapped && vt.type === 'car_enter') {
      camera.position.set(st.pos.x - sinH * st.camBack, st.pos.y + st.camHeight, st.pos.z - cosH * st.camBack);
      camera.lookAt(st.pos.x + sinH * 4.5, st.pos.y + 1.05, st.pos.z + cosH * 4.5);
    }

    if (p >= 1.0) {
      vt.active = false;
      vt.type = null;
      vt.fadeSwapped = false;
      if (vehicleFadeEl) vehicleFadeEl.style.opacity = '0';
    }
    return true;
  }

  let clip = 'Idle';
  let timeScale = 0.4;
  let phase = '';
  let phaseProgress = 0;
  let facingYaw = st.heading;
  let hideMesh = false;

  if (vt.type === 'bike_mount') {
    // Motorcycle Mount: 1) Swing right leg over seat & sit (0..0.56) -> 2) Left boot flicks side-stand UP (0.56..1.0)
    if (p < 0.56) {
      phase = 'mount_leg';
      phaseProgress = p / 0.56;
      const mEase = phaseProgress * phaseProgress * (3 - 2 * phaseProgress);
      playerPos.lerpVectors(vt.startPos, vt.endPos, mEase);
      car.setKickstandDeploy?.(1.0, false);
    } else {
      phase = 'kickstand_up';
      phaseProgress = (p - 0.56) / 0.44;
      playerPos.copy(vt.endPos);
      const ksU = THREE.MathUtils.clamp((phaseProgress - 0.18) / 0.54, 0, 1);
      const ksEase = ksU * ksU * (3 - 2 * ksU);
      if (ksU > 0.05 && !vt.kickstandCue) {
        vt.kickstandCue = true;
        car.playKickstandSound?.(false);
      }
      car.setKickstandDeploy?.(1.0 - ksEase, false);
    }
    clip = 'Idle';
    timeScale = 0.0;
    facingYaw = st.heading;
  } else if (vt.type === 'bike_dismount') {
    // Motorcycle Dismount: 1) Left boot kicks side-stand DOWN (0..0.44) -> 2) Swing right leg off & step down (0.44..1.0)
    if (p < 0.44) {
      phase = 'kickstand_down';
      phaseProgress = p / 0.44;
      playerPos.copy(vt.startPos);
      const ksU = THREE.MathUtils.clamp((phaseProgress - 0.20) / 0.56, 0, 1);
      const ksEase = ksU * ksU * (3 - 2 * ksU);
      if (ksU > 0.05 && !vt.kickstandCue) {
        vt.kickstandCue = true;
        car.playKickstandSound?.(true);
      }
      car.setKickstandDeploy?.(ksEase, false);
    } else {
      phase = 'dismount_leg';
      phaseProgress = (p - 0.44) / 0.56;
      const dEase = phaseProgress * phaseProgress * (3 - 2 * phaseProgress);
      playerPos.lerpVectors(vt.startPos, vt.endPos, dEase);
      car.setKickstandDeploy?.(1.0, false);
    }
    clip = 'Idle';
    timeScale = 0.0;
    facingYaw = st.heading;
  } else if (vt.type === 'rickshaw_mount_driver' && st.isBicycle) {
    // Bicycle Mount: 1) Stand on right side & flick existing rear kickstand UP with foot (0..0.42) -> 2) Swing leg over & mount (0.42..1.0)
    if (p < 0.42) {
      phase = 'kickstand_up';
      phaseProgress = p / 0.42;
      playerPos.copy(vt.startPos);
      const ksU = THREE.MathUtils.clamp((phaseProgress - 0.28) / 0.56, 0, 1);
      const ksEase = ksU * ksU * (3 - 2 * ksU);
      if (ksU > 0.05 && !vt.kickstandCue) {
        vt.kickstandCue = true;
        car.playKickstandSound?.(false);
      }
      car.setKickstandDeploy?.(1.0 - ksEase, false);
    } else {
      phase = 'mount_leg';
      phaseProgress = (p - 0.42) / 0.58;
      const mEase = phaseProgress * phaseProgress * (3 - 2 * phaseProgress);
      playerPos.lerpVectors(vt.startPos, vt.endPos, mEase);
      car.setKickstandDeploy?.(0.0, false);
    }
    clip = 'Idle';
    timeScale = 0.0;
    facingYaw = st.heading;
  } else if (vt.type === 'rickshaw_dismount_driver' && st.isBicycle) {
    // Bicycle Dismount: 1) Swing leg off onto right side (0..0.52) -> 2) Push existing rear kickstand DOWN with foot (0.52..1.0)
    if (p < 0.52) {
      phase = 'dismount_leg';
      phaseProgress = p / 0.52;
      const dEase = phaseProgress * phaseProgress * (3 - 2 * phaseProgress);
      playerPos.lerpVectors(vt.startPos, vt.endPos, dEase);
      car.setKickstandDeploy?.(0.0, false);
    } else {
      phase = 'kickstand_down';
      phaseProgress = (p - 0.52) / 0.48;
      playerPos.copy(vt.endPos);
      const ksU = THREE.MathUtils.clamp((phaseProgress - 0.22) / 0.58, 0, 1);
      const ksEase = ksU * ksU * (3 - 2 * ksU);
      if (ksU > 0.05 && !vt.kickstandCue) {
        vt.kickstandCue = true;
        car.playKickstandSound?.(true);
      }
      car.setKickstandDeploy?.(ksEase, false);
    }
    clip = 'Idle';
    timeScale = 0.0;
    facingYaw = st.heading;
  } else if (vt.type === 'rickshaw_mount_driver' || vt.type === 'rickshaw_dismount_driver') {
    // Rickshaw & Cargo Van: direct mount/dismount with ZERO kickstand
    playerPos.lerpVectors(vt.startPos, vt.endPos, ease);
    clip = 'Idle';
    timeScale = 0.0;
    facingYaw = st.heading;
  } else if (vt.type === 'rickshaw_mount_passenger' || vt.type === 'rickshaw_dismount_passenger') {
    playerPos.lerpVectors(vt.startPos, vt.endPos, ease);
    const hopArc = Math.sin(p * Math.PI) * 0.28;
    playerPos.y += hopArc;
    clip = p < 0.65 ? 'Jump' : (vt.type === 'rickshaw_mount_passenger' ? 'Sit' : 'Idle');
    timeScale = p < 0.65 ? 1.0 : 0.5;
    facingYaw = vt.type === 'rickshaw_mount_passenger'
      ? THREE.MathUtils.lerp(st.heading - Math.PI * 0.45, st.heading, ease)
      : THREE.MathUtils.lerp(st.heading, st.heading + Math.PI * 0.45, ease);
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
      if (interactPrompt) { interactPrompt.textContent = 'Opening Door...'; interactPrompt.classList.remove('hidden'); }
    } else if (p < 0.57) {
      phase = 'sit_in';
      phaseProgress = (p - 0.24) / 0.33;
      const sEase = phaseProgress * phaseProgress * (3 - 2 * phaseProgress);
      car.setDriverDoorOpen?.(1.0);
      playerPos.lerpVectors(vt.startPos, vt.endPos, sEase);
      facingYaw = THREE.MathUtils.lerp(st.heading - Math.PI * 0.5, st.heading, sEase);
      clip = phaseProgress > 0.45 ? 'Sit' : 'Walk';
      timeScale = 0.85;
      if (interactPrompt) { interactPrompt.textContent = 'Getting In...'; interactPrompt.classList.remove('hidden'); }
    } else if (p < 0.78) {
      phase = 'close_door';
      phaseProgress = (p - 0.57) / 0.21;
      car.setDriverDoorOpen?.(1.0 - phaseProgress);
      if (phaseProgress > 0.82 && !vt.doorClosedCue) { vt.doorClosedCue = true; car.playDoorSound?.(true); }
      playerPos.copy(vt.endPos);
      facingYaw = st.heading;
      clip = 'Sit';
      timeScale = 0.3;
      if (interactPrompt) { interactPrompt.textContent = 'Closing Door...'; interactPrompt.classList.remove('hidden'); }
    } else {
      phase = 'seatbelt';
      phaseProgress = (p - 0.78) / 0.22;
      car.setDriverDoorOpen?.(0.0);
      if (phaseProgress > 0.65 && !vt.beltCue) { vt.beltCue = true; car.playSeatbeltSound?.(); }
      playerPos.copy(vt.endPos);
      facingYaw = st.heading;
      clip = 'Sit';
      timeScale = 0.15;
      if (interactPrompt) { interactPrompt.textContent = 'Buckling Seatbelt ✓'; interactPrompt.classList.remove('hidden'); }
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

  // Smooth cinematic camera framing the mount/dismount/kickstand/door-open/seatbelt animation clearly!
  const camDist = (st.isRickshaw || st.isBike) ? 3.0 : 4.2;
  const camSide = (st.isRickshaw || st.isBike) ? 1.95 : 2.35; // Both Bicycle & Motorcycle kickstands sit on LEFT (+rx) side!
  const camH = st.isBicycle ? 1.38 : (st.isBike ? 1.46 : 1.75);
  carCamDesired.set(
    st.pos.x + rx * camSide - sinH * (camDist * 0.58),
    st.pos.y + camH,
    st.pos.z + rz * camSide - cosH * (camDist * 0.58),
  );
  carCamLookTarget.set(playerPos.x, playerPos.y - (st.isBicycle || st.isBike ? 0.68 : 0.50), playerPos.z);
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
        isBicycle: Boolean(st.isBicycle),
        anchors: st.isRickshaw ? car.getRickshawAnchors?.() : (st.isBike ? car.getBikeRiderAnchors?.() : null),
        handTarget: vt.handTarget,
      },
    });
  }

  if (p >= 1.0) {
    const doneType = vt.type;
    const doneSeat = vt.seatMode;
    const donePassIdx = vt.passengerSeatIndex;
    vt.active = false;
    vt.type = null;
    car.setDriverDoorOpen?.(0);
    if (doneType === 'bike_mount' || doneType === 'rickshaw_mount_driver' || doneType === 'rickshaw_mount_passenger' || doneType === 'car_enter') {
      car.enterCar(doneSeat, donePassIdx);
      syncCursorVisibility();
      syncCarHUD();
      updateHUDPrompt();
    } else {
      playerPos.copy(vt.endPos);
      if (st.hasKickstand && (doneType === 'bike_dismount' || (doneType === 'rickshaw_dismount_driver' && st.isBicycle))) {
        car.setKickstandDeploy?.(1.0, false);
      }
      controls.euler.set(-0.04, st.heading + Math.PI, 0, 'YXZ');
      camera.quaternion.setFromEuler(controls.euler);
      if (baseCamNear > 0) syncCameraNear(baseCamNear);
      syncCursorVisibility();
      syncCarHUD();
      updateHUDPrompt();
    }
  }
  return true;
}

function toggleCarDriving(targetCar = null, seatMode = 'driver') {
  if (inStudio || vehicleTransition.active) return;
  if (!cars.length) {
    gtaPhoneUI?.open('dial');
    gtaPhoneUI?.showToast?.('📞 Spawn a vehicle first via iFruit Phone [P] (max 4)!');
    return;
  }
  const activeCar = getDrivingCar();
  if (activeCar) {
    const wasRick = Boolean(activeCar.state.isRickshaw);
    const wasBike = Boolean(activeCar.state.isBike);
    const wasPass = wasRick && activeCar.state.rideSeat === 'passenger';
    const passIdx = activeCar.state.passengerSeatIndex || 0;
    if (wasBike) {
      activeCar.exitCar(playerPos);
      syncCarHUD();
      startVehicleTransition('bike_dismount', activeCar, 'driver');
    } else if (wasRick) {
      activeCar.exitCar(playerPos);
      syncCarHUD();
      startVehicleTransition(
        wasPass ? 'rickshaw_dismount_passenger' : 'rickshaw_dismount_driver',
        activeCar,
        'driver',
        passIdx,
      );
    } else {
      startVehicleTransition('car_exit', activeCar, 'driver');
    }
    return;
  }
  const carToEnter = targetCar || findNearestCar(playerPos) || bmwCar;
  if (!carToEnter) return;
  autonomousPartner.onPlayerEnterCar(carToEnter);
  if (sittingState.active) standUpFromSeat();
  if (liftKeypadOpen) closeLiftKeypad(false);
  if (!started) beginWalking();
  const isRick = Boolean(carToEnter.state.isRickshaw);
  const isBike = Boolean(carToEnter.state.isBike);
  const passIdx = (carToEnter.state.isVan && seatMode === 'passenger')
    ? (carToEnter.findNearestVanSeatIndex?.(playerPos) ?? 0)
    : 0;
  startVehicleTransition(
    isBike ? 'bike_mount' : (isRick ? (seatMode === 'passenger' ? 'rickshaw_mount_passenger' : 'rickshaw_mount_driver') : 'car_enter'),
    carToEnter,
    seatMode,
    passIdx,
  );
}

function handleVehicleInteraction() {
  if (getDrivingCar()) {
    toggleCarDriving();
    return true;
  }
  const nearCar = findNearestEnterableCar(playerPos);
  if (nearCar) {
    toggleCarDriving(nearCar, 'driver');
    return true;
  }
  return false;
}

function handleDoorInteraction(allowClimbFallback = false) {
  if (sittingState.active) {
    standUpFromSeat();
    return true;
  }
  const nearSeat = findNearestSeat(playerPos);
  const hasDoorOrLiftPrompt = Boolean(environment?.tower?.getPrompt(playerPos) || environment?.altapoleTower?.getPrompt(playerPos) || environment?.altapoleGoli?.getPrompt(playerPos) || environment?.landmarks?.circuitHouse?.getPrompt?.(playerPos) || environment?.landmarks?.judgeCourt?.getPrompt?.(playerPos) || environment?.landmarks?.aliaMadrasah?.getNearbyPrompt?.(playerPos) || environment?.landmarks?.ptiMore?.getNearbyPrompt?.(playerPos) || environment?.landmarks?.satrastaMore?.getPrompt?.(playerPos) || environment?.altapole?.getPrompt(playerPos) || house?.getPrompt(playerPos));
  if (nearSeat && (!hasDoorOrLiftPrompt || nearSeat.dist < 1.25)) {
    sitOnSeat(nearSeat);
    return true;
  }
  const circuitRes = environment?.landmarks?.circuitHouse?.interact?.(playerPos);
  if (circuitRes) {
    if (circuitRes.message) gtaPhoneUI?.showToast?.(`🏛️ ${circuitRes.message}`);
    syncHUDButtons(false, true);
    return true;
  }
  const judgeRes = environment?.landmarks?.judgeCourt?.interact?.(playerPos);
  if (judgeRes) {
    if (judgeRes === 'open_lift_keypad') openLiftKeypad();
    syncHUDButtons(false, true);
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
  const altTowerRes = environment?.altapoleTower?.interact(playerPos);
  if (altTowerRes) {
    if (altTowerRes === 'open_lift_keypad' || environment?.altapoleTower?.isInsideLift(playerPos)) {
      openLiftKeypad();
    }
    syncHUDButtons(false, true);
    return true;
  }
  const goliRes = environment?.altapoleGoli?.interact(playerPos);
  if (goliRes) {
    if (goliRes.action === 'open_lift_keypad' || goliRes.tower?.isInsideLift?.(playerPos)) {
      openLiftKeypad();
    }
    syncHUDButtons(false, true);
    return true;
  }
  if (environment?.landmarks?.aliaMadrasah?.toggleGate?.(playerPos)) {
    syncHUDButtons(false, true);
    return true;
  }
  if (environment?.landmarks?.ptiMore?.toggleGate?.(playerPos)) {
    syncHUDButtons(false, true);
    return true;
  }
  if (environment?.landmarks?.satrastaMore?.interact?.(playerPos)) {
    syncHUDButtons(false, true);
    return true;
  }
  if (environment?.altapole?.interact(playerPos)) {
    syncHUDButtons(false, true);
    return true;
  }
  const houseLiftRes = house?.interact?.(playerPos);
  if (houseLiftRes === 'open_lift_keypad') {
    openLiftKeypad();
    syncHUDButtons(false, true);
    return true;
  }
  const tvRes = house?.toggleNearestTV?.(playerPos);
  if (tvRes) {
    playerCharacter?.triggerPhoneTap?.();
    gtaPhoneUI?.showToast?.(
      tvRes.isOn
        ? `📺 TV ON (Flat ${tvRes.unit}) — ${tvRes.channelName} · [K] চ্যানেল পাল্টাও`
        : `📺 TV OFF (Flat ${tvRes.unit}) — রিমোট দিয়ে বন্ধ করা হয়েছে`
    );
    syncHUDButtons(false, true);
    return true;
  }
  if (house?.getPrompt(playerPos)) {
    house.toggleNearestDoor(playerPos);
    syncHUDButtons(false, true);
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

function syncGtaPauseSettingsUI() {
  document.querySelectorAll('[data-gta-quality]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.gtaQuality === quality);
  });
  document.querySelectorAll('[data-gta-time]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.gtaTime === timeOfDayId);
  });
  const shadowsOn = shadowsOverride === 'on' ? true : (shadowsOverride === 'off' ? false : quality !== 'low');
  document.querySelectorAll('[data-gta-shadow]').forEach((btn) => {
    btn.classList.toggle('active', (btn.dataset.gtaShadow === 'on') === shadowsOn);
  });
  const isHudHidden = document.body.classList.contains('hud-hidden');
  document.querySelectorAll('[data-gta-hud]').forEach((btn) => {
    btn.classList.toggle('active', (btn.dataset.gtaHud === 'hide') === isHudHidden);
  });
  const activeCam = playerCharacter?.state?.cameraMode || 'back';
  document.querySelectorAll('[data-gta-cam]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.gtaCam === activeCam);
  });
  document.querySelectorAll('[data-gta-run]').forEach((btn) => {
    btn.classList.toggle('active', (btn.dataset.gtaRun === 'on') === Boolean(runModeToggle));
  });
  const isUnlimitedHp = healthSystem ? healthSystem.unlimitedHealth : true;
  document.querySelectorAll('[data-gta-unlimited-hp]').forEach((btn) => {
    btn.classList.toggle('active', (btn.dataset.gtaUnlimitedHp === 'on') === isUnlimitedHp);
  });
  const fovSlider = document.querySelector('#gta-fov-slider');
  const fovVal = document.querySelector('#gta-fov-value');
  if (fovSlider) fovSlider.value = String(Math.round(baseWalkFov));
  if (fovVal) fovVal.textContent = `${Math.round(baseWalkFov)}°`;

  const sensSlider = document.querySelector('#gta-sens-slider');
  const sensVal = document.querySelector('#gta-sens-value');
  if (sensSlider) sensSlider.value = mouseSensitivity.toFixed(1);
  if (sensVal) sensVal.textContent = `${mouseSensitivity.toFixed(1)}x`;
}

function bindGtaPauseSettingsUI() {
  document.querySelectorAll('[data-gta-quality]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      try { localStorage.setItem('taltola_quality_manual', '1'); } catch {}
      applyQuality(btn.dataset.gtaQuality);
      syncGtaPauseSettingsUI();
    });
  });

  document.querySelectorAll('[data-gta-time]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      applyTimeOfDay(btn.dataset.gtaTime);
      syncGtaPauseSettingsUI();
    });
  });

  document.querySelectorAll('[data-gta-shadow]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      shadowsOverride = btn.dataset.gtaShadow === 'on' ? 'on' : 'off';
      try { localStorage.setItem('taltola_shadows', shadowsOverride); } catch {}
      applyQuality(quality);
      syncGtaPauseSettingsUI();
    });
  });

  document.querySelectorAll('[data-gta-hud]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleHudVisibility(btn.dataset.gtaHud === 'hide');
      syncGtaPauseSettingsUI();
    });
  });

  document.querySelectorAll('[data-gta-cam]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!playerCharacter) return;
      playerCharacter.state.cameraMode = btn.dataset.gtaCam;
      camHideMeshState = false;
      isThirdPersonEyeFallback = false;
      smoothedCamDist = btn.dataset.gtaCam === 'front' ? 1.15 : 1.95;
      syncHUDButtons(false, true);
      syncGtaPauseSettingsUI();
    });
  });

  document.querySelectorAll('[data-gta-run]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      runModeToggle = btn.dataset.gtaRun === 'on';
      syncHUDButtons(runModeToggle, true);
      syncGtaPauseSettingsUI();
    });
  });

  document.querySelectorAll('[data-gta-unlimited-hp]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      healthSystem?.setUnlimitedHealth?.(btn.dataset.gtaUnlimitedHp === 'on');
      syncGtaPauseSettingsUI();
    });
  });

  const fovSlider = document.querySelector('#gta-fov-slider');
  const fovVal = document.querySelector('#gta-fov-value');
  fovSlider?.addEventListener('input', (e) => {
    e.stopPropagation();
    baseWalkFov = THREE.MathUtils.clamp(Number(fovSlider.value) || 60, 48, 75);
    try { localStorage.setItem('taltola_fov', String(baseWalkFov)); } catch {}
    if (fovVal) fovVal.textContent = `${Math.round(baseWalkFov)}°`;
    if (!inStudio && playerCharacter?.state?.cameraMode !== 'front') {
      camera.fov = baseWalkFov;
      camera.updateProjectionMatrix();
    }
  });

  const sensSlider = document.querySelector('#gta-sens-slider');
  const sensVal = document.querySelector('#gta-sens-value');
  sensSlider?.addEventListener('input', (e) => {
    e.stopPropagation();
    mouseSensitivity = THREE.MathUtils.clamp(Number(sensSlider.value) || 1.0, 0.4, 2.4);
    controls.setSensitivity(mouseSensitivity);
    try { localStorage.setItem('taltola_mouse_sens', mouseSensitivity.toFixed(1)); } catch {}
    if (sensVal) sensVal.textContent = `${mouseSensitivity.toFixed(1)}x`;
  });

  document.querySelector('#gta-open-studio-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    khulnaMapUI?.closeMap?.();
    setMode(true);
  });

  document.querySelector('#gta-drive-car-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    khulnaMapUI?.closeMap?.();
    toggleCarDriving();
  });

  document.querySelector('#gta-open-phone-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    khulnaMapUI?.closeMap?.();
    gtaPhoneUI?.open?.();
  });

  document.querySelector('#gta-lift-panel-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    khulnaMapUI?.closeMap?.();
    openLiftKeypad();
  });

  document.querySelector('#gta-toggle-doors-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    house?.toggleAllDoors?.();
    environment?.tower?.toggleGate?.();
    environment?.altapoleTower?.toggleGate?.();
    environment?.altapoleGoli?.toggleAllDoors?.();
    syncHUDButtons(false, true);
    gtaPhoneUI?.showToast?.('🚪 All doors & gates toggled!');
  });

  document.querySelector('#gta-freecam-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    khulnaMapUI?.closeMap?.();
    toggleFreeCam();
  });

  document.querySelector('#gta-reference-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    khulnaMapUI?.closeMap?.();
    referenceModal?.showModal?.();
  });

  document.querySelectorAll('[data-gta-emote]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const emoteName = btn.dataset.gtaEmote;
      if (isFightEmote(emoteName) && isPosInModelMosque(playerPos)) {
        notifyMosqueSilence();
        return;
      }
      khulnaMapUI?.closeMap?.();
      if (started && !inStudio) controls.lock();
      if (playerCharacter && emoteName) {
        controls.euler.setFromQuaternion(camera.quaternion, 'YXZ');
        const next = playerCharacter.triggerEmote(emoteName, controls.euler.y);
        syncEmoteUI(next);
      }
    });
  });

  document.querySelector('#gta-reset-settings-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    baseWalkFov = 60;
    mouseSensitivity = 1.0;
    shadowsOverride = 'auto';
    runModeToggle = false;
    controls.setSensitivity(1.0);
    try {
      localStorage.removeItem('taltola_fov');
      localStorage.removeItem('taltola_mouse_sens');
      localStorage.removeItem('taltola_shadows');
      localStorage.removeItem('taltola_unlimited_health');
    } catch {}
    healthSystem?.setUnlimitedHealth?.(true, { silent: true });
    toggleHudVisibility(false);
    if (playerCharacter) playerCharacter.state.cameraMode = 'back';
    applyQuality('medium');
    applyTimeOfDay('golden');
    syncHUDButtons(false, true);
    syncGtaPauseSettingsUI();
  });

  syncGtaPauseSettingsUI();
}

const LOADING_SLIDE_DURATION_MS = 7500;
function startGtaLoadingShowcase() {
  const slides = Array.from(document.querySelectorAll('.gta-loading-slide'));
  const totalSlides = Math.max(1, slides.length);
  const totalDurationMs = totalSlides * LOADING_SLIDE_DURATION_MS;
  const startedAt = performance.now();
  let currentIndex = 0;
  let assetProgress = 0.03;
  let assetsReady = false;
  let finished = false;

  const showSlide = (nextIdx) => {
    if (nextIdx === currentIndex || !slides.length) return;
    const prevSlide = slides[currentIndex];
    const nextSlide = slides[nextIdx];
    if (prevSlide) {
      prevSlide.classList.remove('is-active');
      prevSlide.classList.add('is-exiting');
      setTimeout(() => prevSlide.classList.remove('is-exiting'), 1150);
    }
    if (nextSlide) {
      nextSlide.classList.remove('is-exiting');
      // Restart Ken Burns motion cleanly on entry
      void nextSlide.offsetWidth;
      nextSlide.classList.add('is-active');
    }
    currentIndex = nextIdx;
  };

  const updateBar = () => {
    if (initFailed || finished) return;
    const elapsed = performance.now() - startedAt;
    const timeProgress = Math.min(1, elapsed / totalDurationMs);
    const combined = assetsReady
      ? Math.max(assetProgress * 0.45 + timeProgress * 0.55, timeProgress)
      : (assetProgress * 0.45 + timeProgress * 0.52);
    if (loadingBar) {
      loadingBar.style.width = `${Math.min(99, Math.max(3, combined * 100)).toFixed(1)}%`;
    }
  };

  const progressTimer = setInterval(updateBar, 120);

  const allSlidesDone = new Promise((resolve) => {
    if (slides.length <= 1) {
      setTimeout(resolve, LOADING_SLIDE_DURATION_MS);
      return;
    }
    let step = 0;
    const advance = () => {
      step++;
      if (step < slides.length) {
        showSlide(step);
        setTimeout(advance, LOADING_SLIDE_DURATION_MS);
      } else {
        resolve();
      }
    };
    setTimeout(advance, LOADING_SLIDE_DURATION_MS);
  });

  return {
    setAssetProgress(ratio, statusText) {
      assetProgress = Math.max(assetProgress, Math.min(1, ratio));
      if (statusText && loadingStatus && !initFailed) {
        loadingStatus.textContent = statusText;
      }
      updateBar();
    },
    markAssetsReady() {
      assetsReady = true;
      assetProgress = 1;
      if (loadingStatus && !initFailed) {
        loadingStatus.textContent = 'Khulna City Ready · Finishing scene…';
      }
      updateBar();
    },
    async waitForAllSlides() {
      await allSlidesDone;
      finished = true;
      clearInterval(progressTimer);
      if (loadingBar) loadingBar.style.width = '100%';
      if (loadingStatus && !initFailed) {
        loadingStatus.textContent = 'Entering Khulna City…';
      }
    },
  };
}

let initFailed = false;
async function initialize() {
  const loadingShowcase = startGtaLoadingShowcase();
  const manager = new THREE.LoadingManager();
  manager.onProgress = (url, loaded, total) => {
    if (initFailed) return;
    const ratio = total > 0 ? loaded / total : 0.05;
    loadingShowcase.setAssetProgress(ratio, `${loaded} / ${total} assets loaded`);
  };
  manager.onError = (url) => {
    if (initFailed) return;
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
  for (const cfg of CHARACTER_ROSTER) {
    characterActors[cfg.id] = createPlayerCharacter(scene, manager, cfg);
  }
  selectActiveCharacter(selectedCharacterId, { triggerGreeting: false, refreshCam: false });
  khulnaMapUI = createKhulnaMapUI({
    onWarpToLandmark: (lm) => warpToLandmark(lm, true),
    onSyncSettings: () => syncGtaPauseSettingsUI(),
    onResumeGame: () => {
      if (started && !inStudio) {
        freeCursorMode = false;
        carDoorCursorMode = false;
        pause?.classList.add('hidden');
        walkHud?.classList.remove('hidden');
        controls.lock();
        syncCursorVisibility();
      }
    },
    onOpenChange: (isOpen) => {
      if (isOpen) {
        if (controls.isLocked) controls.unlock();
        pause?.classList.add('hidden');
        syncGtaPauseSettingsUI();
      } else {
        freeCursorMode = false;
        carDoorCursorMode = false;
        pause?.classList.add('hidden');
        if (started && !inStudio) {
          walkHud?.classList.remove('hidden');
          if (!controls.isLocked) controls.enableFallback?.();
        }
      }
      syncCursorVisibility();
    },
  });
  bindGtaPauseSettingsUI();
  gtaPhoneUI = createGTAPhoneUI({
    onOpenChange: (open) => {
      playerCharacter?.setPhoneInHand?.(open);
      if (open) {
        freeCursorMode = true;
        if (controls.isLocked) controls.unlock();
        pause?.classList.add('hidden');
      } else {
        freeCursorMode = false;
        if (started && !inStudio && !khulnaMapUI?.isOpen && !liftKeypadOpen && !referenceModal?.open) {
          controls.lock();
        }
      }
      syncCursorVisibility();
    },
    onPhoneInteract: () => playerCharacter?.triggerPhoneTap?.(),
    getSpawnLimitInfo: () => ({
      count: cheatSpawnedCars.length,
      max: MAX_CHEAT_SPAWNED_VEHICLES,
      vehicles: cheatSpawnedCars.map((c) => ({ id: c.state.id, name: c.state.name })),
    }),
    onDespawnCheatVehicle: (spawnId) => {
      const idxSpawn = cheatSpawnedCars.findIndex((c) => c.state.id === spawnId);
      if (idxSpawn === -1) return { ok: false, count: cheatSpawnedCars.length, max: MAX_CHEAT_SPAWNED_VEHICLES };
      const target = cheatSpawnedCars[idxSpawn];
      const name = target.state.name;
      if (target.state.driving) target.exitCar(playerPos);
      const carIdx = cars.indexOf(target);
      if (carIdx !== -1) cars.splice(carIdx, 1);
      cheatSpawnedCars.splice(idxSpawn, 1);
      target.destroy?.();
      syncCarHUD();
      updateHUDPrompt();
      return { ok: true, name, count: cheatSpawnedCars.length, max: MAX_CHEAT_SPAWNED_VEHICLES };
    },
    onClearSpawnedVehicles: () => {
      const cleared = cheatSpawnedCars.length;
      for (const sc of cheatSpawnedCars) {
        if (sc.state.driving) {
          sc.exitCar(playerPos);
        }
        const idx = cars.indexOf(sc);
        if (idx !== -1) cars.splice(idx, 1);
        sc.destroy?.();
      }
      cheatSpawnedCars.length = 0;
      syncCarHUD();
      updateHUDPrompt();
      return { cleared, count: 0, max: MAX_CHEAT_SPAWNED_VEHICLES };
    },
    onSpawnCheatVehicle: (carId) => {
      const baseCfg = CAR_FLEET_CONFIGS.find((c) => c.id === carId);
      if (!baseCfg) {
        return { ok: false, reason: 'not_found', count: cheatSpawnedCars.length, max: MAX_CHEAT_SPAWNED_VEHICLES };
      }
      // FIFO Auto-Despawn: if 4 vehicles are already spawned, despawn the oldest (first-spawned) vehicle automatically!
      let replacedName = null;
      while (cheatSpawnedCars.length >= MAX_CHEAT_SPAWNED_VEHICLES) {
        const oldest = cheatSpawnedCars.shift();
        if (oldest) {
          replacedName = oldest.state.name;
          if (oldest.state.driving) oldest.exitCar(playerPos);
          const oldIdx = cars.indexOf(oldest);
          if (oldIdx !== -1) cars.splice(oldIdx, 1);
          oldest.destroy?.();
        }
      }
      controls.getHorizontalVectors(forwardVec, rightVec);
      const dist = baseCfg.isRickshaw ? 3.8 : 5.6;
      const sideStep = baseCfg.isRickshaw ? 2.2 : 3.4;
      let sx = playerPos.x + forwardVec.x * dist;
      let sz = playerPos.z + forwardVec.z * dist;
      for (const slot of [0, 1, -1, 2, -2]) {
        const candX = playerPos.x + forwardVec.x * dist + rightVec.x * sideStep * slot;
        const candZ = playerPos.z + forwardVec.z * dist + rightVec.z * sideStep * slot;
        if (!cheatSpawnedCars.some((c) => Math.hypot(c.state.pos.x - candX, c.state.pos.z - candZ) < 3.2)) {
          sx = candX;
          sz = candZ;
          break;
        }
      }
      const heading = Math.atan2(forwardVec.x, forwardVec.z) + Math.PI * 0.5;
      const spawnedCar = createDrivableCar(scene, undefined, {
        ...baseCfg,
        id: `${baseCfg.id}_spawn_${Date.now()}_${cheatSpawnedCars.length + 1}`,
        spawnPos: [sx, 0.01, sz],
        spawnHeading: heading,
      });
      spawnedCar.setQualityMode?.(quality);
      const vehicleEnv = skySystem?.getEnvTexture?.() || null;
      spawnedCar.setEnvironmentMap?.(vehicleEnv);
      cars.push(spawnedCar);
      cheatSpawnedCars.push(spawnedCar);
      syncCarHUD();
      updateHUDPrompt();
      return { ok: true, replacedName, count: cheatSpawnedCars.length, max: MAX_CHEAT_SPAWNED_VEHICLES };
    },
    onTeleportLandmark: (lm) => warpToLandmark(lm, false),
    onEnterSelfieMode: () => {
      if (!playerCharacter) return;
      selfiePrevCamMode = playerCharacter.state.cameraMode;
      playerCharacter.state.cameraMode = 'front';
      playerCharacter.setExpression?.('happy');
      camHideMeshState = false;
      isThirdPersonEyeFallback = false;
      smoothedCamDist = 1.15;
      syncHUDButtons(false, true);
    },
    onExitSelfieMode: () => {
      if (!playerCharacter) return;
      if (selfiePrevCamMode) {
        playerCharacter.state.cameraMode = selfiePrevCamMode;
        selfiePrevCamMode = null;
      }
      playerCharacter.setExpression?.('normal');
      syncHUDButtons(false, true);
    },
    onSetExpression: (expr) => playerCharacter?.setExpression?.(expr),
    onCaptureSelfieDataUrl: () => {
      renderActiveScene();
      return canvas.toDataURL('image/png');
    },
    getLandmarks: () => khulnaMapUI?.landmarks || [],
    getFunnyVoices: () => (selectedCharacterId === 'kurta_blue' ? VOICE_CLIPS.huzzatullahFunny : VOICE_CLIPS.sabitFunny) || [],
    onPlayFunnyVoice: async (clip) => {
      const speakerId = clip?.speakerId || selectedCharacterId || 'sabit';
      const speakerActor = characterActors[speakerId] || playerCharacter;
      if (!speakerActor || !clip?.urls) return false;
      const inMosque = isPosInModelMosque(playerPos)
        || (speakerActor !== playerCharacter && isPosInModelMosque(autonomousPartner.position));
      if (inMosque || speakerActor.state?.sacredSilence) {
        notifyMosqueSilence('🕌 মডেল মসজিদে ভয়েস বন্ধ আছে — বাইরে বের হলে আবার বলবে।');
        return 'mosque';
      }
      if (!VOICE_BUS.canSpeak(speakerId, { interruptSelf: true })) {
        return 'busy';
      }
      speakerActor.setExpression?.(clip.expression || 'happy');
      return await speakerActor.playVoiceClip?.(clip.urls, {
        expression: clip.expression || 'happy',
        volume: 1.0,
        interruptSelf: true,
        onEnd: () => speakerActor.setExpression?.('normal'),
      });
    },
  });
  gtaPhoneUI?.setCharacterTheme?.(selectedCharacterId);
  aliaPrincipalMic = createAliaPrincipalMic({
    onStatusToast: (msg) => gtaPhoneUI?.showToast?.(msg),
  });
  specialAbility = createSpecialAbilitySystem({
    scene,
    onToast: (msg) => gtaPhoneUI?.showToast?.(msg),
  });
  specialAbility.setCharacter(selectedCharacterId);
  healthSystem = createHealthSystem({
    onToast: (msg) => gtaPhoneUI?.showToast?.(msg),
    onWastedRespawn: () => {
      const activeCar = getDrivingCar();
      if (activeCar) {
        activeCar.exitCar(playerPos);
        syncCarHUD();
      }
      const hospitalLm = khulnaMapUI?.landmarks?.find((l) => l.id === 'taltola_house') || { id: 'taltola_house' };
      warpToLandmark(hospitalLm, true);
      gtaPhoneUI?.showToast?.('🏥 তালতলা হাসপাতাল থেকে সুস্থ হয়ে ফিরেছ (100/100 HP)');
    },
  });
  syncGtaPauseSettingsUI();
  document.querySelector('#ability-hud-bar')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!started || inStudio) return;
    controls.getHorizontalVectors(forwardVec, rightVec);
    specialAbility?.toggle({
      pos: getDrivingCar()?.state?.pos || playerPos,
      forwardVec,
      isDriving: Boolean(getDrivingCar()),
      inMosque: isPosInModelMosque(playerPos),
      playerCharacter,
    });
  });
  gtaCharacterSwitch = createGTACharacterSwitch({
    camera,
    getActiveCharId: () => selectedCharacterId,
    canOpenWheel: () => (
      started
      && !inStudio
      && !freeCam.active
      && !khulnaMapUI?.isOpen
      && !gtaPhoneUI?.isOpen
      && !liftKeypadOpen
      && !vehicleTransition.active
      && (!pause || pause.classList.contains('hidden'))
    ),
    getCharacterSummaries: () => {
      const partnerInfo = autonomousPartner.getHUDStatus();
      const activeZone = environment?.city?.findNearestRoadAndDistrict?.(playerPos.x, playerPos.z)?.district || 'খুলনা শহর';
      const partnerId = selectedCharacterId === 'sabit' ? 'kurta_blue' : 'sabit';
      return {
        [selectedCharacterId]: activeZone,
        [partnerId]: partnerInfo?.statusText || 'খুলনায় ঘুরছে',
      };
    },
    getSwitchEndpoints: () => {
      const partnerPos = autonomousPartner.position;
      const partnerYaw = autonomousPartner.yaw || 0;
      return {
        fromPos: playerPos.clone(),
        fromCamPos: camera.position.clone(),
        toPos: partnerPos.clone(),
        toYaw: partnerYaw,
      };
    },
    onSkySwitchStart: () => {
      keys.clear();
      controls.setSensitivity(mouseSensitivity);
    },
    onPerformSwap: (targetCharId, busyScenario) => {
      const activeCarNow = getDrivingCar();
      if (activeCarNow) {
        activeCarNow.exitCar(playerPos);
        if (activeCarNow.state.hasKickstand) activeCarNow.setKickstandDeploy?.(1.0, false);
        syncCarHUD();
      }
      if (sittingState.active) standUpFromSeat();

      const oldX = playerPos.x;
      const oldY = playerPos.y;
      const oldZ = playerPos.z;
      const oldYaw = playerCharacter?.state?.facingYaw ?? (controls.euler.y + Math.PI);

      const targetX = autonomousPartner.position.x;
      const targetZ = autonomousPartner.position.z;
      const targetYaw = autonomousPartner.yaw ?? 0;

      selectActiveCharacter(targetCharId, { triggerGreeting: false, refreshCam: false });
      autonomousPartner.placeAt(oldX, oldY, oldZ, oldYaw, 'chill');

      playerPos.set(targetX, EYE_HEIGHT, targetZ);
      horizontalVelocity.set(0, 0);
      verticalVelocity = 0;
      grounded = true;
      environment?.city?.refreshActiveChunks?.(playerPos.x, playerPos.z, quality);
      const groundY = computeGroundHeight(playerPos);
      playerPos.y = groundY + EYE_HEIGHT;

      if (playerCharacter) {
        playerCharacter.state.cameraMode = 'back';
        playerCharacter.state.emote = null;
        playerCharacter.state.facingYaw = targetYaw;
        playerCharacter.setPhoneInHand?.(Boolean(busyScenario?.phone));
      }
      syncSceneVisibility(true);
      if (sun?.castShadow) {
        lastSunAnchorX = Math.round(playerPos.x / 4) * 4;
        lastSunAnchorZ = Math.round(playerPos.z / 4) * 4;
        updateSunPositionFromAnchor(lastSunAnchorX, lastSunAnchorZ);
        renderer.shadowMap.needsUpdate = true;
        lastShadowUpdateAt = performance.now();
      }
      syncHUDButtons(false, true);
      updateHUDPrompt();
      return { pos: playerPos.clone(), yaw: targetYaw };
    },
    onBusyIntroTick: (rawDelta, busyScenario, busyYaw) => {
      if (!playerCharacter) return;
      playerCharacter.state.facingYaw = busyYaw;
      playerCharacter.update(rawDelta, {
        position: playerPos,
        yaw: busyYaw + Math.PI,
        speed: 0,
        maxSpeed: 3.45,
        grounded: true,
        isSprinting: false,
        inStudio: false,
        hideMesh: false,
        customClip: busyScenario?.clip
          ? { name: busyScenario.clip, loopOnce: false, timeScale: 1.0 }
          : null,
      });
    },
    onBusyIntroEnd: () => {
      playerCharacter?.setPhoneInHand?.(false);
      controls.syncRotationFromCamera();
      controls.euler.x = THREE.MathUtils.clamp(controls.euler.x, -0.22, 0.14);
      camera.quaternion.setFromEuler(controls.euler);
      camHideMeshState = false;
      isThirdPersonEyeFallback = false;
      smoothedCamDist = 1.92;
      syncHUDButtons(false, true);
      updateHUDPrompt();
    },
  });
  // Spawn starter Atlas Roadster Bicycle + 125cc Naked Sport Motorcycle right in front of Taltola House; all 16 vehicles spawn on demand via [P] iFruit Phone!
  cars = [];
  bmwCar = null;
  const starterVehicleIds = ['atlas_roadster_bicycle', 'bike_125cc'];
  const vehicleEnvStartup = skySystem?.getEnvTexture?.() || null;
  for (const vid of starterVehicleIds) {
    const vCfg = CAR_FLEET_CONFIGS.find((c) => c.id === vid);
    if (!vCfg) continue;
    const starterVeh = createDrivableCar(scene, undefined, vCfg);
    starterVeh.setQualityMode?.(quality);
    starterVeh.setEnvironmentMap?.(vehicleEnvStartup);
    cars.push(starterVeh);
  }

  await Promise.race([
    allLoaded,
    new Promise((resolve) => setTimeout(resolve, 12000)),
  ]);

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
        softwareRendererDetected = true;
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
  if (!startInStudio && spawnParam) {
    const lm = khulnaMapUI?.landmarks?.find((l) => l.id === spawnParam);
    if (lm) warpToLandmark(lm, false);
  }
  if (!startInStudio) {
    autonomousPartner.relocateNearPlayer(playerPos, cars, environment, true);
  }
  syncHUDButtons(false, true);
  if (typeof renderer.compileAsync === 'function') {
    // Temporarily reveal all static world districts/corridors/landmarks during startup shader warmup
    // so 100% of Khulna City shaders compile BEFORE gameplay (eliminates first-visit freezes on Haji Mohsin Rd & South Central Rd!)
    const prevVis = [];
    const revealForWarmup = (obj) => {
      if (!obj || obj.visible) return;
      prevVis.push(obj);
      obj.visible = true;
    };
    revealForWarmup(environment?.tower?.districtGroup);
    revealForWarmup(environment?.detailsGroup);
    revealForWarmup(environment?.roadBaseGroup);
    revealForWarmup(environment?.farGroup);
    if (environment?.corridors?.group) {
      for (const ch of environment.corridors.group.children) revealForWarmup(ch);
    }
    if (environment?.landmarks?.group) {
      for (const ch of environment.landmarks.group.children) {
        revealForWarmup(ch);
        for (const sub of ch.children) revealForWarmup(sub);
      }
    }
    await Promise.race([
      renderer.compileAsync(scene, camera).catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, 2200)),
    ]);
    for (let i = 0; i < prevVis.length; i++) prevVis[i].visible = false;
    syncSceneVisibility(true);
  }

  loadingShowcase.markAssetsReady();
  renderActiveScene();
  await loadingShowcase.waitForAllSlides();
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
    get playerCharacter() { return playerCharacter; },
    characterActors,
    autonomousPartner,
    gtaCharacterSwitch,
    healthSystem,
    selectActiveCharacter,
    get selectedCharacterId() { return selectedCharacterId; },
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
      syncSceneVisibility(true);
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
  header?.classList.toggle('hidden', !inStudio);
  setTimeout(() => loading.classList.add('hidden'), 880);
}

function setStudioCameraPreset(preset) {
  currentStudioCamPreset = preset || 'full';
  studioOrbit.autoSpin = preset === 'spin';
  const activeCfg = CHARACTER_ROSTER.find((c) => c.id === selectedCharacterId) || CHARACTER_ROSTER[0];
  const isNarrowMobile = window.innerWidth <= 760;
  const wideOffset = window.innerWidth > 860 ? 0.36 : 0.0;
  if (preset === 'face') {
    studioOrbit.targetAngle = activeCfg.studioYaw ? -activeCfg.studioYaw * 0.5 : 0.0;
    studioOrbit.targetPitch = 0.04;
    studioOrbit.targetDistance = 1.28;
    studioOrbit.targetLookY = isNarrowMobile ? 1.38 : 1.54;
    studioOrbit.targetLookX = activeCfg.studioX + wideOffset * 0.45;
  } else if (preset === 'side') {
    studioOrbit.targetAngle = 0.78;
    studioOrbit.targetPitch = 0.05;
    studioOrbit.targetDistance = isNarrowMobile ? 3.05 : 2.85;
    studioOrbit.targetLookY = isNarrowMobile ? 0.72 : 0.90;
    studioOrbit.targetLookX = activeCfg.studioX + wideOffset * 0.20;
  } else {
    // 'full' or 'spin': frame BOTH characters side-by-side clear of the Studio control card!
    studioOrbit.targetAngle = 0.0;
    studioOrbit.targetPitch = 0.05;
    studioOrbit.targetDistance = isNarrowMobile ? 5.35 : (window.innerWidth > 860 ? 3.45 : 3.75);
    studioOrbit.targetLookY = isNarrowMobile ? 0.56 : 0.88;
    studioOrbit.targetLookX = wideOffset;
  }
}

// Dual-Character Hero Selection (Side-by-Side cards in Studio)
for (const card of charSelectCards) {
  card.addEventListener('click', () => {
    const cid = card.dataset.charSelect;
    if (cid) selectActiveCharacter(cid, { triggerGreeting: true, refreshCam: true });
  });
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
  if (studioTalkBtn) studioTalkBtn.textContent = talking ? '🗣️ Talk: ON' : '🗣️ Talk';
  studioMicBtn?.classList.toggle('active', mic);
  if (studioMicBtn) studioMicBtn.textContent = mic ? '🎙️ Mic Active (Listening)' : '🎙️ Mic Lip-Sync';
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
    studioMicBtn.textContent = '🎙️ Allow Mic Permission';
    setTimeout(syncTalkUI, 2200);
    return;
  }
  syncTalkUI();
});

gameTalkBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!playerCharacter) return;
  if (isPosInModelMosque(playerPos)) {
    notifyMosqueSilence('🕌 মডেল মসজিদে কথা বলা বন্ধ আছে — বাইরে বের হলে আবার চালু হবে।');
    syncTalkUI();
    return;
  }
  playerCharacter.toggleTalking();
  syncTalkUI();
});

// Studio Orbit Drag & Wheel Zoom
canvas.addEventListener('pointerdown', (event) => {
  if (inStudio) {
    if (event.button === 0) {
      studioOrbit.dragging = true;
      studioOrbit.autoSpin = false;
      studioOrbit.lastX = event.clientX;
      studioOrbit.lastY = event.clientY;
      studioOrbit.downX = event.clientX;
      studioOrbit.downY = event.clientY;
    }
    return;
  }
  if (liftKeypadOpen) {
    // Clicking the 3D scene while lift keypad is open closes the keypad & locks pointer back to walking
    closeLiftKeypad(true);
    return;
  }
  if (freeCursorMode || carDoorCursorMode) {
    // Cursor is intentionally shown via [?] mode (NO double-tap toggle — press [?] again to hide cursor!)
    return;
  }
  // GTA V Free Move mode (mouse cursor hidden): single click engages full 360° pointer lock seamlessly without firing punch
  if (event.button === 0) {
    if (!started) {
      beginWalking();
      return;
    }
    if (!controls.pointerLocked) {
      controls.lock();
      syncCursorVisibility();
      return;
    }
    const activeCar = getDrivingCar();
    if (activeCar) {
      activeCar.playHorn();
    } else if (sittingState.active || findNearestSeat(playerPos) || findNearestEnterableCar(playerPos) || environment?.tower?.getPrompt(playerPos) || house?.getPrompt(playerPos)) {
      handleDoorInteraction();
    } else if (isPosInModelMosque(playerPos)) {
      notifyMosqueSilence();
    } else {
      mouseAttackHeld = true;
      playerCharacter?.triggerAttack();
      triggerPlayerCombatVoice();
    }
  }
});

let lastWinLookX = null;
let lastWinLookY = null;
window.addEventListener('blur', () => {
  lastWinLookX = null;
  lastWinLookY = null;
});
document.addEventListener('pointerlockchange', () => {
  lastWinLookX = null;
  lastWinLookY = null;
});
window.addEventListener('mousemove', (event) => {
  if (inStudio || !started) return;
  if (gtaCharacterSwitch?.handleMouseMove(event)) return;
  const canFreeLook = controls.pointerLocked || (controls.isLocked && !freeCursorMode && !carDoorCursorMode);
  if (!canFreeLook) {
    lastWinLookX = null;
    lastWinLookY = null;
    return;
  }
  let mx = 0;
  let my = 0;
  if (controls.pointerLocked) {
    mx = event.movementX || 0;
    my = event.movementY || 0;
    lastWinLookX = null;
    lastWinLookY = null;
  } else {
    if (lastWinLookX === null) {
      lastWinLookX = event.clientX;
      lastWinLookY = event.clientY;
      return;
    }
    mx = event.clientX - lastWinLookX;
    my = event.clientY - lastWinLookY;
    lastWinLookX = event.clientX;
    lastWinLookY = event.clientY;
  }
  if (Math.abs(mx) > 120 || Math.abs(my) > 120) return;
  if (freeCam.active) {
    freeCam.euler.y -= mx * 0.0024 * mouseSensitivity;
    freeCam.euler.x = THREE.MathUtils.clamp(freeCam.euler.x - my * 0.0024 * mouseSensitivity, -Math.PI * 0.48, Math.PI * 0.48);
    return;
  }
  if (!getDrivingCar()) return;
  carOrbitYaw -= mx * 0.0034 * mouseSensitivity;
  carOrbitPitch = THREE.MathUtils.clamp(carOrbitPitch + my * 0.0026 * mouseSensitivity, 0.04, 0.78);
  carOrbitLastMove = performance.now();
});

window.addEventListener('pointermove', (event) => {
  if (!inStudio || !studioOrbit.dragging) return;
  if ((event.buttons & 1) === 0) {
    studioOrbit.dragging = false;
    return;
  }
  const dx = event.clientX - studioOrbit.lastX;
  const dy = event.clientY - studioOrbit.lastY;
  studioOrbit.lastX = event.clientX;
  studioOrbit.lastY = event.clientY;
  studioOrbit.targetAngle -= dx * 0.007;
  studioOrbit.targetPitch = THREE.MathUtils.clamp(studioOrbit.targetPitch + dy * 0.005, -0.35, 0.65);
});

window.addEventListener('pointerup', (event) => {
  if (event.button === 0) mouseAttackHeld = false;
  if (inStudio && studioOrbit.dragging && event.button === 0) {
    const moveDist = Math.hypot(event.clientX - studioOrbit.downX, event.clientY - studioOrbit.downY);
    if (moveDist <= 6 && event.target === canvas) {
      const rect = canvas.getBoundingClientRect();
      studioPointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      studioPointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      studioRaycaster.setFromCamera(studioPointerNdc, camera);
      const targets = [];
      const ownerByMesh = new Map();
      for (const cfg of CHARACTER_ROSTER) {
        const actor = characterActors[cfg.id];
        if (!actor) continue;
        for (const m of actor.getPickMeshes?.() || []) {
          targets.push(m);
          ownerByMesh.set(m, cfg.id);
        }
      }
      const hits = studioRaycaster.intersectObjects(targets, false);
      if (hits.length) {
        const hitId = ownerByMesh.get(hits[0].object);
        if (hitId) {
          selectActiveCharacter(hitId, { triggerGreeting: true, refreshCam: true });
        }
      }
    }
  }
  studioOrbit.dragging = false;
});

canvas.addEventListener('wheel', (event) => {
  if (freeCam.active && !inStudio) {
    event.preventDefault();
    freeCam.targetFov = THREE.MathUtils.clamp(freeCam.targetFov + event.deltaY * 0.045, 18, 82);
    return;
  }
  if (!inStudio) return;
  event.preventDefault();
  studioOrbit.targetDistance = THREE.MathUtils.clamp(
    studioOrbit.targetDistance + event.deltaY * 0.0018,
    0.92,
    3.6
  );
  const zoomT = THREE.MathUtils.clamp((studioOrbit.targetDistance - 1.18) / 1.48, 0, 1);
  studioOrbit.targetLookY = THREE.MathUtils.lerp(1.54, 0.86, zoomT);
}, { passive: false });

let lastVisSyncAt = 0;
let lastVisSyncX = 1e9;
let lastVisSyncZ = 1e9;
let lastVisSyncResult = { nearTaltolaVis: true, deepInTowerUpper: false, isLow: false };
function syncSceneVisibility(force = false) {
  const nowVis = performance.now();
  const isDrivingNow = Boolean(getDrivingCar());
  const distThresh = isDrivingNow ? 8.0 : 1.8;
  const minInterval = isDrivingNow ? 120 : 140;
  const movedVis = Math.abs(playerPos.x - lastVisSyncX) > distThresh || Math.abs(playerPos.z - lastVisSyncZ) > distThresh;
  if (!force && ((nowVis - lastVisSyncAt) < minInterval && !movedVis)) {
    return lastVisSyncResult;
  }
  if (!force && (nowVis - lastVisSyncAt) < 90) {
    return lastVisSyncResult;
  }
  lastVisSyncAt = nowVis;
  lastVisSyncX = playerPos.x;
  lastVisSyncZ = playerPos.z;
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
    const wantFar = !inWindowlessTower && distHajiSq < 240 * 240;
    if (environment.farGroup.visible !== wantFar) {
      environment.farGroup.visible = wantFar;
    }
  }
  const parkedCarVisSq = (quality === 'ultra' ? (isDrivingNow ? 105 : 130) : (isDrivingNow ? 68 : 92)) ** 2;
  const vehShadowSq = (quality === 'ultra' ? 46 : (quality === 'high' ? 30 : 15)) ** 2;
  for (let i = 0; i < cars.length; i++) {
    const c = cars[i];
    if (!c) continue;
    const cPos = c.state.pos;
    const dx = cPos.x - playerPos.x;
    const dz = cPos.z - playerPos.z;
    const dSq = dx * dx + dz * dz;
    const wantVis = Boolean(c.state.driving) || dSq < parkedCarVisSq;
    const wantShadow = Boolean(c.state.driving) || (quality === 'ultra' ? dSq < vehShadowSq : (!isDrivingNow && dSq < vehShadowSq));
    c.setVisibilityAndShadow?.(wantVis, wantShadow);
  }
  if (environment?.city) {
    environment.city.setVisible(!inWindowlessTower);
    if (!inWindowlessTower) {
      environment.city.refreshActiveChunks(playerPos.x, playerPos.z, quality);
    }
  }
  environment?.syncVisibility?.(playerPos);
  lastVisSyncResult = { nearTaltolaVis, deepInTowerUpper, isLow };
  return lastVisSyncResult;
}

function warpToLandmark(lm, lockControls = false) {
  if (!lm) return;
  const activeCar = getDrivingCar();
  if (sittingState.active) standUpFromSeat();
  liftKeypadOpen = false;
  liftKeypad?.classList.add('hidden');
  started = true;

  let sx = typeof lm.spawnX === 'number' ? lm.spawnX : (lm.x ?? TALTOLA_HOUSE_OFFSET.x);
  let sz = typeof lm.spawnZ === 'number' ? lm.spawnZ : (lm.z ?? TALTOLA_HOUSE_OFFSET.z);
  let lx = typeof lm.lookX === 'number' ? lm.lookX : sx + 8;
  let lz = typeof lm.lookZ === 'number' ? lm.lookZ : sz;

  if (lm.id === 'taltola_house') {
    if (activeCar) {
      // Spawn vehicle cleanly on the open road in front of Taltola House
      sx = TALTOLA_HOUSE_OFFSET.x - 1.25;
      sz = TALTOLA_HOUSE_OFFSET.z + 2.8;
      lx = TALTOLA_HOUSE_OFFSET.x - 1.25;
      lz = TALTOLA_HOUSE_OFFSET.z + 14.0;
    } else {
      sx = TALTOLA_HOUSE_OFFSET.x - 0.2;
      sz = TALTOLA_HOUSE_OFFSET.z + 0.8;
      lx = TALTOLA_HOUSE_OFFSET.x + 5.0;
      lz = TALTOLA_HOUSE_OFFSET.z;
    }
  } else if (lm.id === 'khulna_model_mosque') {
    sx = 195.5;
    sz = 166.0;
    lx = 171.0;
    lz = 166.0;
  } else if (lm.id === 'khulna_judge_court') {
    sx = 144.5;
    sz = -676.0;
    lx = 188.0;
    lz = -676.0;
  } else if (lm.id === 'circuit_house') {
    sx = 144.2;
    sz = -684.0;
    lx = 133.5;
    lz = -684.5;
  }

  if (activeCar) {
    // Teleport WITH the active car, bike, or rickshaw into a clean open drivable spot!
    const dxLook = lx - sx;
    const dzLook = lz - sz;
    const heading = (Math.hypot(dxLook, dzLook) > 0.2) ? Math.atan2(dxLook, dzLook) : 0.0;

    environment?.city?.refreshActiveChunks?.(sx, sz, quality);
    // Find an open drivable spot if the landmark pin itself sits near water or a wall
    const probeOffsets = [
      [0, 0], [0, 3.2], [0, -3.2], [3.2, 0], [-3.2, 0],
      [4.5, 4.5], [-4.5, 4.5], [4.5, -4.5], [-4.5, -4.5],
    ];
    let bestX = sx;
    let bestZ = sz;
    const probeVec = new THREE.Vector3();
    for (const [ox, oz] of probeOffsets) {
      const tx = sx + ox;
      const tz = sz + oz;
      if (environment?.city?.isInWater?.(tx, tz)) continue;
      probeVec.set(tx, EYE_HEIGHT, tz);
      const beforeX = probeVec.x;
      const beforeZ = probeVec.z;
      environment?.landmarks?.applyCollisions?.(probeVec, Math.max(activeCar.state.halfWidth, 1.05), 0);
      environment?.altapoleGoli?.applyPlayerCollisions?.(probeVec, Math.max(activeCar.state.halfWidth, 1.05), 0);
      if (Math.hypot(probeVec.x - beforeX, probeVec.z - beforeZ) < 0.08) {
        bestX = tx;
        bestZ = tz;
        break;
      }
    }

    activeCar.spawnAt(bestX, bestZ, heading);
    const groundY = Math.max(0, computeGroundHeight(new THREE.Vector3(bestX, EYE_HEIGHT, bestZ)));
    if (groundY > 0.02 && groundY < 2.2) {
      activeCar.state.pos.y = groundY + 0.01;
      activeCar.group.position.y = groundY + 0.01;
    }

    playerPos.set(bestX, activeCar.state.pos.y + EYE_HEIGHT, bestZ);
    horizontalVelocity.set(0, 0);
    verticalVelocity = 0;
    grounded = true;
    syncSceneVisibility(true);
    if (sun?.castShadow) {
      lastSunAnchorX = Math.round(bestX / 4) * 4;
      lastSunAnchorZ = Math.round(bestZ / 4) * 4;
      updateSunPositionFromAnchor(lastSunAnchorX, lastSunAnchorZ);
      renderer.shadowMap.needsUpdate = true;
      lastShadowUpdateAt = performance.now();
    }

    carOrbitYaw = 0;
    carOrbitPitch = 0.22;
    carOrbitLastMove = 0;
    carChaseHeading = heading;
    const sinH = Math.sin(heading);
    const cosH = Math.cos(heading);
    const st = activeCar.state;
    const backDist = Math.max(st.isBike ? 2.65 : 3.85, st.camBack * 0.88);
    camera.position.set(bestX - sinH * backDist, st.pos.y + st.camHeight, bestZ - cosH * backDist);
    camera.lookAt(bestX + sinH * 4.5, st.pos.y + 1.05, bestZ + cosH * 4.5);
    controls.syncRotationFromCamera();

    syncCarHUD();
    crosshairEl?.classList.add('hidden');
    if (spawnSelect && lm.id) {
      const hasOpt = Array.from(spawnSelect.options).some((o) => o.value === lm.id);
      if (hasOpt) spawnSelect.value = lm.id;
    }
    lastZoneText = null;
    lastPromptText = null;
    updateHUDPrompt();
    if (khulnaMapUI) {
      const info = environment?.city?.findNearestRoadAndDistrict?.(bestX, bestZ);
      khulnaMapUI.renderMinimap(activeCar.state.pos, heading + Math.PI, info);
    }
    intro?.classList.add('hidden');
    pause?.classList.add('hidden');
    walkHud?.classList.remove('hidden');
    if (lockControls && !inStudio) {
      controls.lock();
    } else if (!inStudio) {
      controls.enableFallback?.();
    }
    syncCursorVisibility();
    return;
  }

  playerPos.set(sx, EYE_HEIGHT, sz);
  horizontalVelocity.set(0, 0);
  verticalVelocity = 0;
  grounded = true;
  environment?.city?.refreshActiveChunks?.(playerPos.x, playerPos.z, quality);
  const groundY = computeGroundHeight(playerPos);
  playerPos.y = groundY + EYE_HEIGHT;
  syncSceneVisibility(true);
  if (sun?.castShadow) {
    lastSunAnchorX = Math.round(playerPos.x / 4) * 4;
    lastSunAnchorZ = Math.round(playerPos.z / 4) * 4;
    updateSunPositionFromAnchor(lastSunAnchorX, lastSunAnchorZ);
    renderer.shadowMap.needsUpdate = true;
    lastShadowUpdateAt = performance.now();
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
  } else if (!inStudio) {
    controls.enableFallback?.();
  }
  syncCursorVisibility();
}

function beginWalking(preserveCursor = false) {
  if (!preserveCursor) {
    freeCursorMode = false;
  }
  carDoorCursorMode = false;
  if (!started) {
    const spawnId = spawnSelect?.value || 'taltola_house';
    const lm = khulnaMapUI?.landmarks?.find((l) => l.id === spawnId) || { id: 'taltola_house' };
    warpToLandmark(lm, !freeCursorMode);
    syncCursorVisibility();
    return;
  }
  liftKeypadOpen = false;
  liftKeypad?.classList.add('hidden');
  intro?.classList.add('hidden');
  pause?.classList.add('hidden');
  walkHud?.classList.remove('hidden');
  if (!freeCursorMode) controls.lock();
  else controls.enableFallback?.();
  syncCursorVisibility();
}

enterStreetButton?.addEventListener('click', () => setMode(false));
studioToggleButton?.addEventListener('click', () => setMode(!inStudio));
enterButton?.addEventListener('click', beginWalking);
resumeButton?.addEventListener('click', beginWalking);
mapHudButton?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (inStudio) return;
  khulnaMapUI?.toggleMap(getLiveMapPos(), getLiveMapHeadingYaw());
});
minimapDock?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (inStudio) return;
  khulnaMapUI?.openMap(getLiveMapPos(), getLiveMapHeadingYaw());
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
  if (activeCar?.state.isVan) {
    if (activeCar.state.rideSeat === 'driver') {
      activeCar.setPassengerSeatIndex?.(0);
      activeCar.toggleRideSeat();
    } else if (activeCar.state.passengerSeatIndex < 3) {
      activeCar.cyclePassengerSeat?.();
    } else {
      activeCar.toggleRideSeat();
    }
    syncCarHUD();
    updateHUDPrompt();
  } else if (activeCar?.state.isRickshaw) {
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
carPovBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  getDrivingCar()?.cycleCameraMode();
  syncCarHUD();
});
for (const btn of carDoorButtons) {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const targetCar = getTargetCarForDoors();
    if (!targetCar) return;
    const key = btn.dataset.carDoor;
    if (key === 'ALL') targetCar.toggleAllDoors?.();
    else targetCar.toggleDoor?.(key);
    syncCarDoorUI();
  });
}
carDoorAllBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  const targetCar = getTargetCarForDoors();
  if (!targetCar) return;
  targetCar.toggleAllDoors?.();
  syncCarDoorUI();
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
  getActiveLiftTower()?.openDoors();
  syncLiftKeypadUI();
});
liftDoorCloseBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  getActiveLiftTower()?.closeDoors();
  syncLiftKeypadUI();
});
liftExitBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  const activeT = getActiveLiftTower();
  if (activeT) {
    activeT.openDoors();
    if (activeT.isInsideLift(playerPos)) {
      const ex = activeT.liftExitPos ? activeT.liftExitPos.x : -10.85;
      const ez = activeT.liftExitPos ? activeT.liftExitPos.z : 19.55;
      playerPos.x = ex;
      playerPos.z = ez;
      playerPos.y = activeT.state.liftY + EYE_HEIGHT;
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
  if (aliaPrincipalMic?.active || environment?.landmarks?.aliaMadrasah?.isNearPrincipalMic?.(playerPos)) {
    aliaPrincipalMic.toggle();
    return;
  }
  handleDoorInteraction();
});

controls.addEventListener('lock', () => {
  if (inStudio) return;
  carDoorCursorMode = false;
  if (controls.pointerLocked) freeCursorMode = false;
  started = true;
  const lookKbd = document.querySelector('#look-control kbd');
  if (lookKbd) lookKbd.textContent = '?';
  intro.classList.add('hidden');
  pause.classList.add('hidden');
  walkHud.classList.remove('hidden');
  syncCursorVisibility();
});

controls.addEventListener('unlock', () => {
  keys.clear();
  if (liftKeypadOpen || khulnaMapUI?.isOpen || gtaPhoneUI?.isOpen || getDrivingCar() || vehicleTransition.active || carDoorCursorMode || freeCursorMode) {
    pause.classList.add('hidden');
    walkHud.classList.remove('hidden');
    syncCursorVisibility();
    return;
  }
  if (!inStudio && started && !referenceModal.open) {
    // GTA-style [ESC]: unlocking pointer opens the Khulna City Map directly instead of a pause screen!
    pause.classList.add('hidden');
    lastUnlockMapOpenAt = performance.now();
    khulnaMapUI?.openMap(getLiveMapPos(), getLiveMapHeadingYaw());
    syncCursorVisibility();
    return;
  }
  walkHud.classList.add('hidden');
  syncCursorVisibility();
});

document.querySelector('#reference-button')?.addEventListener('click', () => {
  if (controls.isLocked) controls.unlock();
  pause.classList.add('hidden');
  referenceModal.showModal();
  syncCursorVisibility();
});
document.querySelector('#close-reference').addEventListener('click', () => referenceModal.close());
referenceModal.addEventListener('click', (event) => {
  if (event.target === referenceModal) referenceModal.close();
});
referenceModal.addEventListener('close', () => {
  if (!inStudio && started) pause.classList.remove('hidden');
  syncCursorVisibility();
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
    if (isFightEmote(emoteName) && isPosInModelMosque(playerPos)) {
      notifyMosqueSilence();
      return;
    }
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

  // [?] / [/] GTA V-style Mouse Cursor Toggle (hidden by default from initial loading screen onward)
  const activeTag = document.activeElement?.tagName;
  const isTypingField = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || Boolean(document.activeElement?.isContentEditable);
  if (!isTypingField && !event.repeat && (event.code === 'Slash' || event.code === 'NumpadDivide' || event.key === '?' || event.key === '/')) {
    event.preventDefault();
    toggleFreeCursorMode();
    return;
  }

  if (!ready || !started) return;

  // GTA V-style Character Switch Wheel ([Hold Ctrl] + Mouse / Arrows / 1-2)
  if (!freeCam.active && gtaCharacterSwitch?.handleKeyDown(event)) {
    controls.setSensitivity(gtaCharacterSwitch.isWheelOpen ? mouseSensitivity * 0.14 : mouseSensitivity);
    return;
  }

  // [TAB] Hide / Show all HUD buttons cleanly anytime
  if (event.code === 'Tab') {
    event.preventDefault();
    if (!event.repeat) toggleHudVisibility();
    return;
  }

  // GTA-style [ESC] & [M]: ALWAYS opens & closes the Khulna City Map (works while walking, driving, AND inside [C] Free Cam!)
  if ((event.code === 'Escape' || (event.code === 'KeyM' && !isTypingField)) && !event.repeat) {
    event.preventDefault();
    if (khulnaMapUI?.isOpen) {
      // Guard against browser firing pointerlockchange->unlock->openMap AND Escape keydown in the same press!
      if (event.code === 'Escape' && (performance.now() - lastUnlockMapOpenAt) < 300) return;
      khulnaMapUI.closeMap();
      if (!inStudio && started) controls.lock();
    } else if (!liftKeypadOpen) {
      if (freeCam.active) toggleFreeCam();
      khulnaMapUI?.openMap(getLiveMapPos(), getLiveMapHeadingYaw());
      if (controls.isLocked) controls.unlock();
    }
    return;
  }
  if (khulnaMapUI?.isOpen) return;

  // [C] (or [Shift + C]) Dedicated Free Cam Toggle (works both on foot & while driving!)
  if (event.code === 'KeyC' && !event.repeat && !khulnaMapUI?.isOpen && !gtaPhoneUI?.isOpen) {
    event.preventDefault();
    toggleFreeCam();
    return;
  }
  if (freeCam.active) {
    if (event.code === 'Space' || event.code.startsWith('Arrow')) event.preventDefault();
    if (event.code === 'ArrowUp' || event.code === 'ArrowRight') {
      freeCam.speed = THREE.MathUtils.clamp(freeCam.speed * 1.32, 1.5, 90.0);
    } else if (event.code === 'ArrowDown' || event.code === 'ArrowLeft') {
      freeCam.speed = THREE.MathUtils.clamp(freeCam.speed / 1.32, 1.5, 90.0);
    } else if (event.code === 'Equal' || event.code === 'NumpadAdd') {
      freeCam.targetFov = THREE.MathUtils.clamp(freeCam.targetFov - 5, 18, 82);
    } else if (event.code === 'Minus' || event.code === 'NumpadSubtract') {
      freeCam.targetFov = THREE.MathUtils.clamp(freeCam.targetFov + 5, 18, 82);
    }
    keys.add(event.code);
    return;
  }

  // [P] GTA V-Style Smartphone Pop-up Toggle
  if (event.code === 'KeyP' && !event.repeat && !khulnaMapUI?.isOpen) {
    event.preventDefault();
    gtaPhoneUI?.toggle();
    return;
  }
  if (gtaPhoneUI?.isOpen && gtaPhoneUI.handleKeyDown(event)) {
    return;
  }

  if (event.code === 'KeyN' && !event.repeat) {
    event.preventDefault();
    cycleTimeOfDay();
    return;
  }

  // GTA V Special Ability Toggle ([CapsLock] or [Z])
  if ((event.code === 'CapsLock' || event.code === 'KeyZ') && !event.repeat) {
    event.preventDefault();
    controls.getHorizontalVectors(forwardVec, rightVec);
    specialAbility?.toggle({
      pos: getDrivingCar()?.state?.pos || playerPos,
      forwardVec,
      isDriving: Boolean(getDrivingCar()),
      inMosque: isPosInModelMosque(playerPos),
      playerCharacter,
    });
    return;
  }

  // Toggle Drivable Vehicle / Rickshaw Mode with [T] anytime
  if (event.code === 'KeyT' && !event.repeat) {
    event.preventDefault();
    toggleCarDriving();
    return;
  }

  // [G] Sit directly in Rickshaw / Bicycle Back Passenger Seat!
  if (event.code === 'KeyG' && !event.repeat) {
    const curCar = getDrivingCar();
    if (!curCar) {
      const nearCar = findNearestEnterableCar(playerPos);
      if (nearCar?.state.isRickshaw) {
        event.preventDefault();
        toggleCarDriving(nearCar, 'passenger');
        return;
      }
    }
  }

  // Dedicated Driving Controls when inside any drivable car, rickshaw or bicycle
  const activeCar = getDrivingCar();
  if (activeCar) {
    if (event.code === 'KeyE' && !event.repeat) {
      // [E] strictly for opening/closing gates & doors (never exits vehicle!)
      event.preventDefault();
      house?.toggleAllDoors();
      environment?.tower?.toggleGate?.();
      environment?.altapoleTower?.toggleGate?.();
      if (!environment?.altapoleGoli?.interact?.(activeCar.state.pos)) {
        environment?.altapoleGoli?.toggleAllDoors?.();
      }
      environment?.landmarks?.circuitHouse?.toggleGate?.(activeCar.state.pos);
      environment?.landmarks?.judgeCourt?.toggleGate?.(activeCar.state.pos);
      environment?.landmarks?.aliaMadrasah?.toggleGate?.(activeCar.state.pos);
      environment?.landmarks?.ptiMore?.toggleGate?.(activeCar.state.pos);
      syncHUDButtons();
      return;
    }
    if (activeCar.state.isRickshaw) {
      if (activeCar.state.isVan && activeCar.state.rideSeat === 'passenger' && !event.repeat) {
        const vanCornerKeyMap = { Digit1: 0, Numpad1: 0, Digit2: 1, Numpad2: 1, Digit3: 2, Numpad3: 2, Digit4: 3, Numpad4: 3 };
        if (event.code in vanCornerKeyMap) {
          event.preventDefault();
          activeCar.setPassengerSeatIndex?.(vanCornerKeyMap[event.code]);
          syncCarHUD();
          updateHUDPrompt();
          return;
        }
      }
      if (event.code === 'KeyF' && !event.repeat) {
        event.preventDefault();
        if (activeCar.state.rideSeat === 'passenger') {
          activeCar.toggleRideSeat();
          syncCarHUD();
          updateHUDPrompt();
        } else {
          toggleCarDriving();
        }
        return;
      }
      if (event.code === 'KeyG' && !event.repeat) {
        event.preventDefault();
        if (activeCar.state.rideSeat === 'driver') {
          if (activeCar.state.isVan) activeCar.setPassengerSeatIndex?.(0);
          activeCar.toggleRideSeat();
          syncCarHUD();
          updateHUDPrompt();
        } else {
          toggleCarDriving();
        }
        return;
      }
    } else if (event.code === 'KeyF' && !event.repeat) {
      // [F] strictly for entering/exiting cars & bikes
      event.preventDefault();
      toggleCarDriving();
      return;
    }
    if (event.code === 'KeyL' && !event.repeat) {
      event.preventDefault();
      const mode = activeCar.toggleHeadlights?.() ?? 0;
      const labels = ['Headlights OFF', 'Headlights ON · Low Beam', 'Headlights · High Beam'];
      gtaPhoneUI?.showToast?.(`💡 ${labels[mode] || labels[0]}`);
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
      syncCarHUD();
      return;
    }
    if (!activeCar.state.isRickshaw && !event.repeat) {
      const doorKeyMap = { Digit1: 'FL', Digit2: 'FR', Digit3: 'RL', Digit4: 'RR' };
      if (doorKeyMap[event.code]) {
        event.preventDefault();
        activeCar.toggleDoor?.(doorKeyMap[event.code]);
        syncCarDoorUI();
        return;
      }
      if (event.code === 'Digit0' || event.code === 'KeyO') {
        event.preventDefault();
        activeCar.toggleAllDoors?.();
        syncCarDoorUI();
        return;
      }
    }
    if (!activeCar.state.isRickshaw && event.code === 'KeyG' && !event.repeat) {
      event.preventDefault();
      house?.toggleAllDoors();
      environment?.tower?.toggleGate?.();
      environment?.altapoleTower?.toggleGate?.();
      if (!environment?.altapoleGoli?.interact?.(activeCar.state.pos)) {
        environment?.altapoleGoli?.toggleAllDoors?.();
      }
      environment?.landmarks?.circuitHouse?.toggleGate?.(activeCar.state.pos);
      environment?.landmarks?.judgeCourt?.toggleGate?.(activeCar.state.pos);
      environment?.landmarks?.aliaMadrasah?.toggleGate?.(activeCar.state.pos);
      environment?.landmarks?.ptiMore?.toggleGate?.(activeCar.state.pos);
      syncHUDButtons();
      return;
    }
    if (event.code === 'Space') {
      event.preventDefault();
    }
    keys.add(event.code);
    return;
  }

  // [O] Free mouse cursor when standing near a car to click Door Buttons directly!
  if (event.code === 'KeyO' && !event.repeat) {
    const nearCar = findNearestEnterableCar(playerPos);
    if (nearCar && !nearCar.state.isRickshaw) {
      event.preventDefault();
      if (controls.isLocked) {
        carDoorCursorMode = true;
        controls.unlock();
      } else {
        carDoorCursorMode = false;
        controls.lock();
      }
      syncCarDoorUI();
      syncCursorVisibility();
      return;
    }
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

  const activeLiftT = getActiveLiftTower();
  const insideOrNearLift = Boolean(
    liftKeypadOpen
    || activeLiftT?.isInsideLift(playerPos)
    || activeLiftT?.isNearLiftLobby(playerPos)
  );

  // When inside the lift, near the lift, or when the lift keypad is open, number keys 0-9 / G / R select lift floors!
  if (insideOrNearLift && event.code in LIFT_FLOOR_KEY_MAP) {
    event.preventDefault();
    selectLiftFloor(LIFT_FLOOR_KEY_MAP[event.code]);
    if (!liftKeypadOpen) openLiftKeypad();
    return;
  }
  if ((liftKeypadOpen || activeLiftT?.isInsideLift(playerPos)) && event.code === 'KeyG') {
    event.preventDefault();
    selectLiftFloor(0);
    return;
  }
  if ((liftKeypadOpen || activeLiftT?.isInsideLift(playerPos)) && event.code === 'KeyR') {
    event.preventDefault();
    selectLiftFloor(10);
    return;
  }

  // If the player presses W/A/S/D while the lift keypad is open and the lift doors are open, close the keypad so they can walk out smoothly
  if (
    liftKeypadOpen &&
    activeLiftT?.state?.liftPhase !== 'moving' &&
    (event.code === 'KeyW' || event.code === 'KeyS' || event.code === 'KeyA' || event.code === 'KeyD' ||
     event.code === 'ArrowUp' || event.code === 'ArrowDown' || event.code === 'ArrowLeft' || event.code === 'ArrowRight')
  ) {
    closeLiftKeypad(true);
  }

  if (event.code === 'KeyM' && !inStudio && started && !getDrivingCar() && !khulnaMapUI?.isOpen && !gtaPhoneUI?.isOpen) {
    if (aliaPrincipalMic?.active || environment?.landmarks?.aliaMadrasah?.isNearPrincipalMic?.(playerPos)) {
      event.preventDefault();
      aliaPrincipalMic.toggle();
      return;
    }
  }

  if (mappedEmote && playerCharacter) {
    event.preventDefault();
    if (isFightEmote(mappedEmote) && isPosInModelMosque(playerPos)) {
      notifyMosqueSilence();
      return;
    }
    controls.euler.setFromQuaternion(camera.quaternion, 'YXZ');
    const next = playerCharacter.triggerEmote(mappedEmote, controls.euler.y);
    if (next && isFightEmote(mappedEmote)) {
      triggerPlayerCombatVoice();
    }
    syncEmoteUI(next);
    return;
  }

  if (event.code === 'KeyE') {
    // [E] strictly for doors, gates, lift, TV remote & sitting
    event.preventDefault();
    handleDoorInteraction(false);
  } else if (event.code === 'KeyK' && !event.repeat) {
    // [K] TV Remote: Next Channel
    const chRes = house?.cycleNearestTVChannel?.(playerPos);
    if (chRes) {
      event.preventDefault();
      playerCharacter?.triggerPhoneTap?.();
      gtaPhoneUI?.showToast?.(`📺 Flat ${chRes.unit} TV · Channel: ${chRes.channelName}`);
    }
  } else if (event.code === 'KeyF') {
    // [F] strictly for entering/exiting vehicles (falls back to wall climb if no vehicle nearby)
    event.preventDefault();
    if (!handleVehicleInteraction()) startWallClimb();
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
  } else if (event.code === 'KeyR') {
    event.preventDefault();
    toggleRunMode();
  } else if (event.code === 'KeyX') {
    event.preventDefault();
    if (isPosInModelMosque(playerPos)) {
      notifyMosqueSilence();
    } else {
      playerCharacter?.triggerAttack(null);
      triggerPlayerCombatVoice();
      syncEmoteUI(null);
    }
  } else if (event.code === 'KeyY' && !event.repeat) {
    event.preventDefault();
    if (isPosInModelMosque(playerPos)) {
      notifyMosqueSilence('🕌 মডেল মসজিদে ভয়েস বন্ধ আছে — বাইরে বের হলে আবার বলবে।');
    } else {
      playerCharacter?.playCombatVoice?.({ force: true });
    }
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
  if (event.code === 'Space') {
    event.preventDefault();
    if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
      document.activeElement.blur();
    }
    if (!event.repeat) {
      const nowSp = performance.now();
      if (nowSp - lastSpaceDownTime < 360) {
        doubleSpaceJumpPending = true;
        if (!grounded && !ledgeHangState.active && !climbState.active && verticalVelocity > 0.5) {
          verticalVelocity = Math.max(verticalVelocity, 8.35);
        }
      } else {
        doubleSpaceJumpPending = false;
      }
      lastSpaceDownTime = nowSp;
    }
    jumpBuffer = 0.20;
  }
});
window.addEventListener('keyup', (event) => {
  if (gtaCharacterSwitch?.handleKeyUp(event)) {
    controls.setSensitivity(mouseSensitivity);
  }
  keys.delete(event.code);
  shiftHeld = event.shiftKey && event.code !== 'ShiftLeft' && event.code !== 'ShiftRight';
  if (event.code === 'KeyW' || event.code === 'ArrowUp') {
    doubleTapSprint = false;
  }
});
window.addEventListener('blur', () => {
  gtaCharacterSwitch?.handleBlur();
  controls.setSensitivity(mouseSensitivity);
  keys.clear();
  shiftHeld = false;
  doubleTapSprint = false;
  mouseAttackHeld = false;
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
          label: 'Rooftop Sky Lounge Sofa',
        },
        {
          minX: -7.80, maxX: -7.10, minZ: 16.50, maxZ: 19.20, h: 0.52,
          seat: true, seatX: -7.42, seatZ: 17.85, seatY: 0.50, yaw: Math.PI / 2,
          label: 'Rooftop Sky Lounge Sofa',
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
        label: 'Toilet Commode',
      },
      { minX: -17.33, maxX: -16.75, minZ: 19.56, maxZ: 20.48, h: 0.88, seat: false },
      // 2) Master Bedroom — King-Size Luxury Bed & Wardrobe
      {
        minX: -19.50, maxX: -16.60, minZ: 15.25, maxZ: 17.45, h: 0.68,
        seat: true, seatX: -17.35, seatZ: 16.35, seatY: 0.64, yaw: Math.PI / 2,
        label: 'Master King Bed',
      },
      { minX: -16.50, maxX: -14.00, minZ: 17.92, maxZ: 18.52, h: 2.45, seat: false }, // Wardrobe
      // 3) Living Lounge — Royal Blue Tufted Velvet L-Sofa, Marble Coffee Table & TV Console
      {
        minX: -11.02, maxX: -6.58, minZ: 15.02, maxZ: 15.98, h: 0.48,
        seat: true, seatX: -8.40, seatZ: 15.55, seatY: 0.46, yaw: 0,
        label: 'Living Room Velvet Sofa',
      },
      {
        minX: -11.02, maxX: -10.08, minZ: 15.95, maxZ: 17.70, h: 0.48,
        seat: true, seatX: -10.45, seatZ: 16.75, seatY: 0.46, yaw: Math.PI / 2,
        label: 'Corner L-Sofa',
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
        label: 'RGB Gaming Chair',
      },
      { minX: -19.55, maxX: -18.60, minZ: 24.20, maxZ: 27.60, h: 0.80, seat: false },
    ];
    // Add all 6 Emerald Velvet Dining Chairs
    for (const cx of [-7.5, -8.4, -9.3]) {
      items.push(
        {
          minX: cx - 0.26, maxX: cx + 0.26, minZ: 24.00, maxZ: 24.48, h: 0.48,
          seat: true, seatX: cx, seatZ: 24.25, seatY: 0.46, yaw: 0,
          label: 'Dining Chair',
        },
        {
          minX: cx - 0.26, maxX: cx + 0.26, minZ: 26.32, maxZ: 26.80, h: 0.48,
          seat: true, seatX: cx, seatZ: 26.55, seatY: 0.46, yaw: Math.PI,
          label: 'Dining Chair',
        }
      );
    }
    return items;
  }

  // --- 5-STORY TALTOLA HOUSE (levels 0..4, fy = 0, 3.05, 6.10, 9.15, 12.20) ---
  if (fy > 13.5) return [];
  return [
    // Unit A Drawing Room Sofa, Coffee Table & TV Media Console
    {
      minX: 6.80, maxX: 8.90, minZ: -5.18, maxZ: -4.40, h: 0.48,
      seat: true, seatX: 7.85, seatZ: -4.68, seatY: 0.46, yaw: 0,
      label: 'Living Room Sofa',
    },
    { minX: 7.28, maxX: 8.42, minZ: -3.86, maxZ: -3.24, h: 0.48, seat: false },
    { minX: 9.14, maxX: 9.62, minZ: -4.58, maxZ: -2.72, h: 0.68, seat: false },
    // Unit A Master Bedroom King Bed, Nightstand & Almirah Wardrobe
    {
      minX: 11.88, maxX: 13.82, minZ: -5.08, maxZ: -3.28, h: 0.56,
      seat: true, seatX: 12.85, seatZ: -3.95, seatY: 0.54, yaw: 0,
      label: 'Master Bed',
    },
    { minX: 11.48, maxX: 11.98, minZ: -5.08, maxZ: -4.62, h: 0.58, seat: false },
    { minX: 11.55, maxX: 12.10, minZ: -3.74, maxZ: -2.56, h: 2.02, seat: false },
    // Unit A & Unit B Attached Bathroom Commodes, Pedestal Wash Basins & Buckets
    {
      minX: 9.72, maxX: 10.32, minZ: -4.98, maxZ: -4.46, h: 0.52,
      seat: true, seatX: 10.06, seatZ: -4.72, seatY: 0.50, yaw: Math.PI / 2,
      label: 'Toilet Commode',
    },
    { minX: 9.70, maxX: 10.22, minZ: -3.66, maxZ: -3.10, h: 0.92, seat: false },
    { minX: 10.82, maxX: 11.24, minZ: -4.38, maxZ: -3.96, h: 0.44, seat: false },
    {
      minX: 9.72, maxX: 10.32, minZ: 4.46, maxZ: 4.98, h: 0.52,
      seat: true, seatX: 10.06, seatZ: 4.72, seatY: 0.50, yaw: Math.PI / 2,
      label: 'Toilet Commode',
    },
    { minX: 9.70, maxX: 10.22, minZ: 3.10, maxZ: 3.66, h: 0.92, seat: false },
    { minX: 10.82, maxX: 11.24, minZ: 3.96, maxZ: 4.38, h: 0.44, seat: false },
    // Unit B Dining Table, 4 Dining Chairs & TV Media Console
    { minX: 7.10, maxX: 8.60, minZ: 3.04, maxZ: 4.06, h: 0.79, seat: false },
    { minX: 9.14, maxX: 9.62, minZ: 2.82, maxZ: 4.68, h: 0.68, seat: false },
    {
      minX: 7.28, maxX: 7.72, minZ: 2.56, maxZ: 3.00, h: 0.48,
      seat: true, seatX: 7.50, seatZ: 2.78, seatY: 0.46, yaw: 0,
      label: 'Dining Chair',
    },
    {
      minX: 7.98, maxX: 8.42, minZ: 2.56, maxZ: 3.00, h: 0.48,
      seat: true, seatX: 8.20, seatZ: 2.78, seatY: 0.46, yaw: 0,
      label: 'Dining Chair',
    },
    {
      minX: 7.28, maxX: 7.72, minZ: 4.10, maxZ: 4.54, h: 0.48,
      seat: true, seatX: 7.50, seatZ: 4.32, seatY: 0.46, yaw: Math.PI,
      label: 'Dining Chair',
    },
    {
      minX: 7.98, maxX: 8.42, minZ: 4.10, maxZ: 4.54, h: 0.48,
      seat: true, seatX: 8.20, seatZ: 4.32, seatY: 0.46, yaw: Math.PI,
      label: 'Dining Chair',
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
  const altSeat = environment?.altapoleTower?.findNearestSeat?.(pos);
  if (altSeat) return altSeat;
  const goliSeat = environment?.altapoleGoli?.findNearestSeat?.(pos);
  if (goliSeat) return goliSeat;
  const judgeSeat = environment?.landmarks?.judgeCourt?.findNearestSeat?.(pos);
  if (judgeSeat) return judgeSeat;
  const mosqueSeat = environment?.landmarks?.aliaMadrasah?.findNearestModelMosqueSeat?.(pos);
  if (mosqueSeat) return mosqueSeat;
  const satrastaSeat = environment?.landmarks?.satrastaMore?.findNearestSeat?.(pos);
  if (satrastaSeat) return satrastaSeat;
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
function computeGroundHeight(pos, isGroundedOverride = grounded, velYOverride = verticalVelocity) {
  const footY = pos.y - EYE_HEIGHT;
  const maxStepUp = isGroundedOverride ? 0.55 : (velYOverride > 0 ? 0.08 : 0.38);

  const altTowerY = environment?.altapoleTower?.computeGroundHeight?.(pos, isGroundedOverride, velYOverride);
  if (altTowerY !== null && altTowerY !== undefined) return altTowerY;
  const altGoliY = environment?.altapoleGoli?.computeGroundHeight?.(pos, isGroundedOverride, velYOverride);
  if (altGoliY !== null && altGoliY !== undefined) return altGoliY;

  // --- KHULNA DISTRICT & SESSIONS JUDGE COURT WALKABLE INTERIORS (delegated to khulna-judge-court.js) ---
  if (pos.x >= 146.5 && pos.x <= 206.0 && pos.z >= -728.0 && pos.z <= -632.0) {
    const judgeY = environment?.landmarks?.judgeCourt?.getGroundHeight?.(pos, isGroundedOverride, velYOverride);
    if (typeof judgeY === 'number' && judgeY > 0) return judgeY;
  }

  // --- KHULNA ALIA KAMIL MADRASAH & MODEL MOSQUE WALKABLE INTERIORS (delegated to alia-madrasah.js) ---
  if (pos.x >= 156.0 && pos.x <= 196.0 && pos.z >= 74.0 && pos.z <= 184.0) {
    const aliaY = environment?.landmarks?.aliaMadrasah?.getGroundHeight?.(pos, isGroundedOverride, velYOverride);
    if (typeof aliaY === 'number' && aliaY > 0) return aliaY;
  }

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
  // Inside Taltola House 3D Elevator Cabin (lx ∈ [14.30, 16.02], |lz| ≤ 0.88)
  if (house?.isInsideLift?.(pos)) {
    const liftY = house.state.liftY;
    if (Math.abs(footY - liftY) < 2.4) {
      return liftY;
    }
  }
  const insideMainSlab = lx >= 5.95 && lx <= 14.38 && Math.abs(lz) <= 5.42;
  const inFrontBalconyZone = lx >= 4.74 && lx <= 6.08 &&
    ((lz >= -5.12 && lz <= -1.48) || (lz >= 1.52 && lz <= 5.12));

  if (!insideMainSlab && !inFrontBalconyZone) {
    return environment?.landmarks?.getGroundHeight?.(pos) ?? 0.0;
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

function applyWorldCollisions(pos, isProbe = false) {
  environment?.city?.applyCityCollisions?.(pos, PLAYER_RADIUS);
  if (!isProbe) {
    environment?.city?.applyPoleCollisions?.(pos, PLAYER_RADIUS, {
      impactSpeed: horizontalVelocity.length(),
      isVehicle: false,
    });
  }

  const footY = pos.y - EYE_HEIGHT;
  // Solid showcase landmark colliders (Chingri Chattar, Royal More buildings, buses & medians)
  environment?.landmarks?.applyCollisions?.(pos, PLAYER_RADIUS, footY);
  // Enterable Altapole Lane realistic houses, 6-story head tower & opposite goli colliders
  environment?.altapole?.applyCollisions?.(pos, PLAYER_RADIUS, footY);
  environment?.altapoleTower?.applyPlayerCollisions?.(pos, PLAYER_RADIUS, footY);
  environment?.altapoleGoli?.applyPlayerCollisions?.(pos, PLAYER_RADIUS, footY);
  // Global live & parked Khulna vehicles (CNGs, Easybikes, Sedans, Trucks) — solid everywhere on map!
  environment?.traffic?.applyVehicleCollisions?.(pos, PLAYER_RADIUS, footY);

  const hx = TALTOLA_HOUSE_OFFSET.x;
  const hz = TALTOLA_HOUSE_OFFSET.z;

  // Static corridor/landmark parked CNG autos & roadside utility poles
  if (footY < 1.75) {
    for (const [cx, cz, hw, hd] of [
      [hx - 1.9, hz + 29.0, 0.78, 1.42],   // Taltola Cross Rd parked CNG
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

  // Walkable Khulna Alia Kamil Madrasah Main Building collisions are handled in alia-madrasah.js applyCollisions()

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

  for (let iter = 0; iter < 3; iter++) {
    // Taltola House 3D Elevator Shaft Solid Walls (x ∈ [14.34, 16.06], z ∈ [-0.94, +0.94]) across ALL floors + Rooftop!
    resolveCircleAABB(lpos, 0.22, 15.92, 16.14, -0.96, 0.96); // Rear East glass wall
    resolveCircleAABB(lpos, 0.22, 14.32, 16.08, -0.96, -0.82); // North shaft wall
    resolveCircleAABB(lpos, 0.22, 14.32, 16.08, 0.82, 0.96); // South shaft wall
    if (!house?.isLiftOpenAtY?.(footY)) {
      // Block lift doorway when cabin is moving or on another floor so player never falls into shaft or clips out mid-ride!
      resolveCircleAABB(lpos, 0.22, 14.24, 14.44, -0.66, 0.66);
    }

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
    // Courtyard & Backyard Solid Obstacles (Ground Level)
    if (footY < 2.65) {
      resolveCircleAABB(lpos, PLAYER_RADIUS, 5.53, 5.83, -1.09, -0.83);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 5.53, 5.83, 0.83, 1.09);
      resolveCircleAABB(lpos, PLAYER_RADIUS, -2.56, -2.14, -18.22, -17.78);
      resolveCircleAABB(lpos, PLAYER_RADIUS, -2.56, -2.14, 17.78, 18.22);
    }
    if (footY < 2.28) {
      resolveCircleAABB(lpos, PLAYER_RADIUS, 17.44, 17.76, -4.86, -1.54);
    }
    if (footY < 0.98) {
      resolveCircleAABB(lpos, PLAYER_RADIUS, 14.58, 15.68, 3.92, 4.88);
    }
    if (footY < 0.46) {
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
      resolveCircleAABB(lpos, 0.14, 7.86, 11.94, 0.14, 0.20);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 7.50, 14.32, -1.30, -1.12);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 7.50, 14.32, 1.15, 1.32);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 14.15, 14.42, -1.25, -0.64);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 14.15, 14.42, 0.64, 1.25);
      if (footY - 15.25 < 0.68) {
        resolveCircleAABB(lpos, PLAYER_RADIUS, 5.75, 6.02, -5.50, 5.50);
        resolveCircleAABB(lpos, PLAYER_RADIUS, 14.15, 14.42, -5.50, -0.64);
        resolveCircleAABB(lpos, PLAYER_RADIUS, 14.15, 14.42, 0.64, 5.50);
        resolveCircleAABB(lpos, PLAYER_RADIUS, 5.85, 14.35, -5.55, -5.28);
        resolveCircleAABB(lpos, PLAYER_RADIUS, 5.85, 14.35, 5.28, 5.55);
      }
      continue;
    }

    const houseFy = currentLevel * 3.05;

    // Building Exterior Front & Back Walls (x = 6.08 and x = 14.28) — ALWAYS SOLID at ALL jump heights!
    // Rear wall leaves open lift doorway at z ∈ [-0.64, +0.64] on ALL 5 floors!
    if (currentLevel === 0) {
      resolveCircleAABB(lpos, PLAYER_RADIUS, 5.90, 6.26, -5.50, -0.60);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 5.90, 6.26, 0.60, 5.50);
      if (house && !house.state.frontDoorOpen) {
        resolveCircleAABB(lpos, PLAYER_RADIUS, 5.88, 6.24, -0.64, 0.64);
      }
      resolveCircleAABB(lpos, PLAYER_RADIUS, 14.10, 14.46, -5.50, -0.64);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 14.10, 14.46, 0.64, 5.50);
    } else if (currentLevel >= 1 && currentLevel <= 4 && lpos.x >= 4.5 && lpos.x <= 16.2 && Math.abs(lpos.z) <= 5.55) {
      // Upper floors: Front wall (x = 6.08) has open balcony doorways at z ∈ [-3.25, -1.90] (Unit A) and z ∈ [1.90, 3.25] (Unit B)!
      resolveCircleAABB(lpos, PLAYER_RADIUS, 5.94, 6.22, -5.48, -3.25);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 5.94, 6.22, -1.90, 1.90);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 5.94, 6.22, 3.25, 5.48);
      // Back wall leaves Lift Doorway open at z ∈ [-0.64, +0.64]
      resolveCircleAABB(lpos, PLAYER_RADIUS, 14.14, 14.46, -5.48, -0.64);
      resolveCircleAABB(lpos, PLAYER_RADIUS, 14.14, 14.46, 0.64, 5.48);
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

const FLOOR_NAMES_EN = ['1st Floor (Ground)', '2nd Floor', '3rd Floor', '4th Floor', '5th Floor', 'Rooftop'];

let lastHudPromptUpdateAt = 0;
function updateHUDPrompt(force = true) {
  if (!house || !interactPrompt) return;
  const nowHud = performance.now();
  if (!force && nowHud - lastHudPromptUpdateAt < 65) return;
  lastHudPromptUpdateAt = nowHud;
  syncCarDoorUI();
  let promptText = null;
  if (controls.isLocked || liftKeypadOpen) {
    if (getDrivingCar()) {
      promptText = null;
    } else if (sittingState.active) {
      promptText = `[E / F / SPACE] Stand Up — ${sittingState.seat?.label || 'Seat'}`;
    } else {
      const nearSeat = findNearestSeat(playerPos);
      const nearCar = findNearestEnterableCar(playerPos);
      const carPrompt = nearCar ? nearCar.getPrompt(playerPos) : null;
      const nearPrincipalMic = Boolean(environment?.landmarks?.aliaMadrasah?.isNearPrincipalMic?.(playerPos));
      const micPrompt = nearPrincipalMic
        ? (aliaPrincipalMic?.active
          ? '🔴 ON AIR · কথা বলুন (ইকো চালু) — [M] মাইক বন্ধ করুন'
          : '🎙️ [M] প্রিন্সিপালের মাইক অন করুন (পুরো আলিয়া মাদ্রাসায় ইকো শোনা যাবে)')
        : null;
      const doorOrLiftPrompt = micPrompt || environment?.tower?.getPrompt(playerPos) || environment?.altapoleTower?.getPrompt(playerPos) || environment?.altapoleGoli?.getPrompt(playerPos) || environment?.landmarks?.circuitHouse?.getPrompt?.(playerPos) || environment?.landmarks?.judgeCourt?.getPrompt?.(playerPos) || environment?.landmarks?.aliaMadrasah?.getNearbyPrompt?.(playerPos) || environment?.landmarks?.ptiMore?.getNearbyPrompt?.(playerPos) || environment?.landmarks?.satrastaMore?.getPrompt?.(playerPos) || environment?.altapole?.getPrompt(playerPos) || house.getPrompt(playerPos);
      if (micPrompt) {
        promptText = micPrompt;
      } else if (carPrompt && !doorOrLiftPrompt && !nearSeat) {
        promptText = carPrompt;
      } else if (nearSeat && (!doorOrLiftPrompt || nearSeat.dist < 1.25)) {
        promptText = `[E / F] Sit on ${nearSeat.label}`;
      } else if (doorOrLiftPrompt) {
        promptText = doorOrLiftPrompt;
      } else if (nearSeat) {
        promptText = `[E / F] Sit on ${nearSeat.label}`;
      } else if (inWater) {
        promptText = '[SPACE] Jump Out · [WASD] Swim';
      } else if (ledgeHangState.active) {
        promptText = '[W / SPACE] Climb Over · [S] Drop';
      } else if (wallAhead && !climbState.active) {
        promptText = '[SPACE / F] Grab Ledge';
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
    const flName = FLOOR_NAMES_EN[lvl] || FLOOR_NAMES_EN[0];
    const lx = x - TALTOLA_HOUSE_OFFSET.x;
    const lz = z - TALTOLA_HOUSE_OFFSET.z;

    let zone = '';
    if (x < -3.0 && x > -46.0 && z >= 10.0 && z <= 14.25) {
      zone = 'FAKIR BARI LANE · SIDE ALLEY';
    } else if (x > 3.1 && x < 24.0 && z >= 20.8 && z <= 26.8) {
      zone = "AVIJIT'S SPECIAL BATCH (ASB) · COACHING COMPOUND";
    } else if (x > 1.8 && x < 24.0 && z > -28.0 && z < 20.8) {
      zone = 'HAJI MOHSIN RD · SHOPS & CLINICS';
    } else if (x <= -2.8 && x >= -19.9 && z >= 14.25 && z <= 28.6) {
      const towerFl = footY < 2.2 ? 0 : Math.min(10, Math.round((footY - 4.0) / 3.0) + 1);
      if (environment?.tower?.isInsideLift(playerPos)) {
        const stopCode = environment.tower.stops?.[environment.tower.state.liftFloorIndex]?.code || `F${towerFl}`;
        zone = `SK ARSHAN TOWER · VIP ELEVATOR CABIN (${stopCode})`;
      } else if (towerFl === 0) {
        zone = 'SK ARSHAN ALIF TOWER · GRAND PARKING & LOBBY';
      } else if (towerFl >= 10 || footY >= 29.8) {
        zone = 'SK ARSHAN ALIF TOWER · ROOFTOP SKY LOUNGE';
      } else if (x > -4.35 || (x > -5.55 && z >= 18.6 && z <= 23.5)) {
        zone = `SK ARSHAN TOWER (FLOOR ${towerFl + 1}) · FRONT BALCONY`;
      } else if (x <= -16.55 && x >= -19.75 && z >= 18.63 && z <= 21.4) {
        zone = `SK ARSHAN TOWER (FLOOR ${towerFl + 1}) · ATTACHED LUXURY BATHROOM`;
      } else if (z >= 18.55 && z <= 23.3) {
        zone = `SK ARSHAN TOWER (FLOOR ${towerFl + 1}) · HIGH-SPEED LIFT & STAIR LOBBY`;
      } else if (z < 18.55) {
        zone = x > -13.3
          ? `SK ARSHAN TOWER (FLOOR ${towerFl + 1}) · NORTH FLAT · LIVING LOUNGE & 4K TV`
          : `SK ARSHAN TOWER (FLOOR ${towerFl + 1}) · NORTH FLAT · MASTER BEDROOM`;
      } else {
        zone = x > -13.3
          ? `SK ARSHAN TOWER (FLOOR ${towerFl + 1}) · SOUTH FLAT · DINING & KITCHEN`
          : `SK ARSHAN TOWER (FLOOR ${towerFl + 1}) · SOUTH FLAT · RGB GAMING SUITE`;
      }
    } else if (lx >= 2.55 && lx <= 22.0 && Math.abs(lz) <= 7.4) {
      if (lvl === 5 && lx >= 5.9 && lx <= 14.4) {
        zone = `TALTOLA HOUSE · ROOFTOP TERRACE`;
      } else if (lx > 14.4) {
        zone = 'TALTOLA HOUSE · BACKYARD';
      } else if (lvl >= 1 && lvl <= 4 && lx >= 4.72 && lx < 6.08 && Math.abs(lz) <= 5.2) {
        zone = `FLAT ${lvl + 1}${lz < 0 ? 'A' : 'B'} · FRONT BALCONY (${flName})`;
      } else if (lx >= 6.08 && lx <= 14.28 && lz < -1.2 && lz > -5.3 && Math.abs(lz) < 7.2) {
        if (lx < 9.65) zone = `FLAT ${lvl + 1}A · LIVING & TV ROOM (${flName})`;
        else if (lx < 11.45 && lz < -2.5) zone = `FLAT ${lvl + 1}A · ATTACHED BATHROOM (${flName})`;
        else zone = `FLAT ${lvl + 1}A · MASTER BEDROOM (${flName})`;
      } else if (lx >= 6.08 && lx <= 14.28 && lz > 1.2 && lz < 5.3 && Math.abs(lz) < 7.2) {
        if (lx < 9.65) zone = `FLAT ${lvl + 1}B · DINING & FAMILY ROOM (${flName})`;
        else if (lx < 11.45 && lz > 2.5) zone = `FLAT ${lvl + 1}B · ATTACHED BATHROOM (${flName})`;
        else zone = `FLAT ${lvl + 1}B · KITCHEN (${flName})`;
      } else if (lx >= 6.0 && lx <= 14.35 && lz <= -5.2 && lz >= -7.3) {
        zone = 'TALTOLA HOUSE · LEFT SIDE ALLEY';
      } else if (lx >= 6.0 && lx <= 14.35 && lz >= 5.2 && lz <= 7.3) {
        zone = 'TALTOLA HOUSE · RIGHT SIDE ALLEY';
      } else if (lx >= 6.0 && lx <= 14.35 && Math.abs(lz) < 5.3) {
        zone = `TALTOLA HOUSE · STAIRWELL & CORRIDOR (${flName})`;
      } else {
        zone = 'TALTOLA HOUSE · FRONT COURTYARD (TOOTPARA CROSS RD)';
      }
    } else if (Math.abs(lx) < 16 && Math.abs(lz) < 16) {
      zone = 'TALTOLA HOUSE · TOOTPARA TALTOLA HOSPITAL CROSS RD';
    } else if (x >= 158 && x <= 196 && z >= 150 && z <= 181) {
      zone = environment?.landmarks?.aliaMadrasah?.getModelMosqueZoneName?.(x, z, footY) || 'KHULNA DISTRICT MODEL MOSQUE · ALIA MADRASAH';
    } else if (x >= 144 && x <= 222 && z >= -524 && z <= -292) {
      zone = environment?.altapoleGoli?.getZoneName?.(x, z, footY) || environment?.altapoleTower?.getZoneName?.(x, z, footY) || environment?.altapole?.getZoneName?.(x, z) || 'ALTAPOLE LANE · KHULNA';
    } else if (environment?.landmarks?.circuitHouse?.getZoneName?.(x, z, footY)) {
      zone = environment.landmarks.circuitHouse.getZoneName(x, z, footY);
    } else if (environment?.landmarks?.judgeCourt?.getZoneName?.(x, z, footY)) {
      zone = environment.landmarks.judgeCourt.getZoneName(x, z, footY);
    } else if (environment?.landmarks?.satrastaMore?.getZoneName?.(x, z, footY)) {
      zone = environment.landmarks.satrastaMore.getZoneName(x, z, footY);
    } else if (Math.abs(x) < 35 && Math.abs(z) < 42) {
      zone = 'HAJI MOHSIN ROAD · KHULNA';
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
  const nowCam = performance.now();
  const camDt = studioOrbit._lastMs
    ? Math.min(0.35, Math.max(delta, (nowCam - studioOrbit._lastMs) / 1000))
    : Math.max(delta, 0.016);
  studioOrbit._lastMs = nowCam;
  if (studioOrbit.autoSpin) {
    studioOrbit.targetAngle += camDt * 0.55;
  }
  const smooth = 1 - Math.exp(-10.0 * camDt);
  studioOrbit.angle += (studioOrbit.targetAngle - studioOrbit.angle) * smooth;
  studioOrbit.pitch += (studioOrbit.targetPitch - studioOrbit.pitch) * smooth;
  studioOrbit.distance += (studioOrbit.targetDistance - studioOrbit.distance) * smooth;
  studioOrbit.targetY += (studioOrbit.targetLookY - studioOrbit.targetY) * smooth;
  studioOrbit.lookX += (studioOrbit.targetLookX - studioOrbit.lookX) * smooth;

  const r = studioOrbit.distance;
  // DSLR 85mm portrait lens FOV (24° close-up -> 39° full-body) eliminates wide-angle selfie distortion!
  const fovT = THREE.MathUtils.clamp((r - 1.12) / 1.53, 0, 1);
  const studioFov = THREE.MathUtils.lerp(24.0, 39.0, fovT);
  if (Math.abs(camera.fov - studioFov) > 0.05) {
    camera.fov += (studioFov - camera.fov) * smooth;
    camera.updateProjectionMatrix();
  }
  const cx = studioOrbit.lookX + Math.sin(studioOrbit.angle) * Math.cos(studioOrbit.pitch) * r;
  const cz = Math.cos(studioOrbit.angle) * Math.cos(studioOrbit.pitch) * r;
  const cy = studioOrbit.targetY + Math.sin(studioOrbit.pitch) * r;

  camera.position.set(cx, cy, cz);
  camera.lookAt(studioOrbit.lookX, studioOrbit.targetY, 0);

  for (const cfg of CHARACTER_ROSTER) {
    const actor = characterActors[cfg.id];
    if (!actor) continue;
    actor.update(delta, {
      position: playerPos,
      yaw: 0,
      speed: 0,
      maxSpeed: 4.35,
      grounded: true,
      isSprinting: false,
      inStudio: true,
      studioPos: { x: cfg.studioX, y: 0, z: 0 },
      studioYaw: cfg.studioYaw,
    });
  }
}

function updateMovement(delta) {
  if (!started || (pause && !pause.classList.contains('hidden'))) return;

  // Dedicated [C] Free Cam flying mode (WASD fly, Arrow keys speed slow/fast, Scroll/+/- zoom + Portrait Mode bokeh!)
  if (freeCam.active) {
    const dt = Math.min(delta, 0.05);
    camera.quaternion.setFromEuler(freeCam.euler);
    freeCam.fwd.set(0, 0, -1).applyQuaternion(camera.quaternion);
    freeCam.right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    const fIn = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
    const rIn = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
    const uIn = Number(keys.has('KeyE') || keys.has('Space')) - Number(keys.has('KeyQ') || keys.has('ControlLeft'));
    const flySpeed = freeCam.speed * ((keys.has('ShiftLeft') || keys.has('ShiftRight')) ? 2.4 : 1.0);
    freeCam.pos.addScaledVector(freeCam.fwd, fIn * flySpeed * dt);
    freeCam.pos.addScaledVector(freeCam.right, rIn * flySpeed * dt);
    freeCam.pos.y = Math.max(0.35, freeCam.pos.y + uIn * flySpeed * dt);
    camera.position.copy(freeCam.pos);
    freeCam.fov = THREE.MathUtils.lerp(freeCam.fov, freeCam.targetFov, Math.min(1, dt * 10));
    if (Math.abs(camera.fov - freeCam.fov) > 0.04) {
      camera.fov = freeCam.fov;
      camera.updateProjectionMatrix();
    }
    syncFreeCamBokeh();
    return;
  }

  // Always update all drivable cars, bikes & rickshaws (distance-cull far parked vehicles for 60 FPS!)
  if (cars.length) {
    const activeRef = getDrivingCar();
    const refX = activeRef ? activeRef.state.pos.x : playerPos.x;
    const refZ = activeRef ? activeRef.state.pos.z : playerPos.z;
    for (const car of cars) {
      const dxV = car.state.pos.x - refX;
      const dzV = car.state.pos.z - refZ;
      const dSq = dxV * dxV + dzV * dzV;
      const vis = car.state.driving || car.state.aiDriving || dSq < 150 * 150;
      if (car.group.visible !== vis) car.group.visible = vis;
      if (vis || Math.abs(car.state.speed) > 0.05) {
        car.update(delta, keys, house, environment, cars, computeGroundHeight);
      }
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

      const isBikePov = st.isBike && st.cameraMode === 'pov';
      const isInteriorPov = st.cameraMode === 'interior' && !st.isRickshaw && !st.isBike;
      const targetFov = isBikePov
        ? THREE.MathUtils.clamp(74 + speedKmh * 0.055, 74, 80)
        : (isInteriorPov
          ? THREE.MathUtils.clamp(68 + speedKmh * 0.05, 68, 75)
          : THREE.MathUtils.clamp(57 + speedKmh * 0.025, 57, 62));
      if (Math.abs(camera.fov - targetFov) > 0.05) {
        camera.fov += (targetFov - camera.fov) * Math.min(1, delta * 7.5);
        camera.updateProjectionMatrix();
      }

      if (isBikePov && drivingCar.getBikePovCameraPose?.(carCamDesired, carCamLookTarget)) {
        if (baseCamNear === 0) baseCamNear = camera.near;
        syncCameraNear(0.045);
        camera.position.copy(carCamDesired);
        camera.lookAt(carCamLookTarget);
      } else if (isInteriorPov && drivingCar.getInteriorCameraPose?.(carCamDesired, carCamLookTarget)) {
        if (baseCamNear === 0) baseCamNear = camera.near;
        syncCameraNear(0.045);
        camera.position.copy(carCamDesired);
        camera.lookAt(carCamLookTarget);
      } else {
        if (baseCamNear > 0) syncCameraNear(baseCamNear);
        if (st.cameraMode === 'hood') {
          const eyeBack = (st.isRickshaw && st.rideSeat === 'passenger') ? -0.58 : st.hoodForward;
          const eyeH = (st.isRickshaw && st.rideSeat === 'passenger') ? 1.48 : st.hoodHeight;
          carCamDesired.set(st.pos.x + sinH * eyeBack, st.pos.y + eyeH, st.pos.z + cosH * eyeBack);
          carCamLookTarget.set(st.pos.x + sinH * 14.0, st.pos.y + eyeH - 0.16, st.pos.z + cosH * 14.0);
          camera.position.copy(carCamDesired);
          camera.lookAt(carCamLookTarget);
        } else if (st.cameraMode === 'front') {
          carCamDesired.set(st.pos.x + sinH * (st.isBike ? 3.0 : 4.1), st.pos.y + (st.isBike ? 1.32 : 1.50), st.pos.z + cosH * (st.isBike ? 3.0 : 4.1));
          carCamLookTarget.set(st.pos.x, st.pos.y + 0.95, st.pos.z);
          camera.position.copy(carCamDesired);
          camera.lookAt(carCamLookTarget);
        } else {
          const nowOrbit = performance.now();
          const recentlyMovedMouse = (nowOrbit - carOrbitLastMove) < 2200;
          if (Math.abs(st.speed) > 1.4 && !recentlyMovedMouse) {
            const yawDiff = Math.atan2(Math.sin(-carOrbitYaw), Math.cos(-carOrbitYaw));
            carOrbitYaw += yawDiff * Math.min(1, delta * 3.6);
            carOrbitPitch += (0.22 - carOrbitPitch) * Math.min(1, delta * 3.6);
          }
          const targetChaseHeading = st.heading + carOrbitYaw;
          if (carChaseHeading === null) {
            carChaseHeading = targetChaseHeading;
          } else {
            const hDiff = Math.atan2(Math.sin(targetChaseHeading - carChaseHeading), Math.cos(targetChaseHeading - carChaseHeading));
            carChaseHeading += hDiff * Math.min(1, delta * (recentlyMovedMouse ? 18.0 : 10.5));
          }
          const sinO = Math.sin(carChaseHeading);
          const cosO = Math.cos(carChaseHeading);
          // Keep 3rd-person camera comfortably framed (never too cramped on bikes or cars!)
          const backDist = Math.max(st.isBike ? 3.25 : 3.85, st.camBack * 0.90 - Math.min(0.45, speedKmh * 0.0035));
          const horizDist = backDist * Math.cos(carOrbitPitch);
          const camY = Math.max(st.pos.y + 0.65, st.pos.y + 0.94 + backDist * Math.sin(carOrbitPitch) + (st.camHeight - 2.15) * 0.42);
          carCamDesired.set(st.pos.x - sinO * horizDist, camY, st.pos.z - cosO * horizDist);
          const lookFwd = recentlyMovedMouse ? 1.2 : 3.6;
          carCamLookTarget.set(st.pos.x + sinO * lookFwd, st.pos.y + 1.02, st.pos.z + cosO * lookFwd);
          camera.position.copy(carCamDesired);
          // GTA VI visceral vehicle impact jolt on wall/car collisions
          if (st.lastImpactIntensity > 0.02) {
            const jolt = st.lastImpactIntensity * 0.14;
            camera.position.x += (Math.random() - 0.5) * jolt;
            camera.position.y += (Math.random() - 0.5) * jolt;
            healthSystem?.onVehicleImpact?.(st.lastImpactIntensity);
          }
          camera.lookAt(carCamLookTarget);
        }
      }

      if (playerCharacter) {
        if (st.isBike) {
          playerCharacter.update(delta, {
            position: playerPos,
            yaw: st.heading + Math.PI,
            speed: Math.abs(st.speed),
            maxSpeed: 30.0,
            grounded: true,
            isSprinting: false,
            inStudio: false,
            hideMesh: isBikePov,
            bikeRide: {
              active: true,
              heading: st.heading,
              steerAngle: st.steerAngle,
              roll: st.roll,
              sportLean: Boolean(st.bikeSportLean),
              speed: st.speed,
              isReversing: Boolean(st.isReversing),
              groundY: st.pos.y,
              anchors: drivingCar.getBikeRiderAnchors?.(),
            },
          });
        } else if (st.isRickshaw) {
          const anchors = drivingCar.getRickshawAnchors?.();
          const isPassenger = st.rideSeat === 'passenger';
          const seatBackOffset = isPassenger ? 0.62 : (st.isBicycle ? 0.28 : (st.isVan ? 0.08 : 0.05));
          const riderPos = (st.isVan && isPassenger && anchors?.passengerSeat)
            ? {
              x: anchors.passengerSeat.x,
              y: st.pos.y + EYE_HEIGHT,
              z: anchors.passengerSeat.z,
            }
            : {
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
              isBicycle: Boolean(st.isBicycle),
              isVan: Boolean(st.isVan),
              heading: st.heading,
              pedalPhase: st.pedalPhase,
              steerAngle: st.steerAngle,
              roll: st.roll,
              standingBlend: st.standingBlend || 0,
              standingPedal: Boolean(st.standingPedal),
              speed: st.speed,
              isReversing: Boolean(st.isReversing),
              groundY: st.pos.y,
              anchors,
            },
          });
        } else {
          playerCharacter.update(delta, {
            position: playerPos,
            yaw: st.heading + Math.PI,
            speed: Math.abs(st.speed),
            maxSpeed: 28.0,
            grounded: true,
            isSprinting: false,
            inStudio: false,
            hideMesh: st.cameraMode === 'hood' || st.cameraMode === 'interior',
            carDrive: {
              active: true,
              heading: st.heading,
              steerAngle: st.steerAngle,
              speed: st.speed,
              anchors: drivingCar.getCarDriverAnchors?.(),
            },
          });
        }
      }

      syncCarHUD();
      updateHUDPrompt(false);
      return;
    }
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
        const wantI = quality !== 'low' ? 1.55 : 0;
        if (indoorLight.intensity !== wantI) indoorLight.intensity = wantI;
        if (wantI > 0) indoorLight.position.set(playerPos.x, playerPos.y + 0.65, playerPos.z);
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
  maxSpeed *= (specialAbility?.speedMultiplier ?? 1.0);
  if (landRecoveryTimer > 0) maxSpeed *= 0.45;
  if (specialAbility?.dashActive && !inWater && !climbState.active && !ledgeHangState.active) {
    playerPos.x += specialAbility.dashDirX * 15.5 * delta;
    playerPos.z += specialAbility.dashDirZ * 15.5 * delta;
    applyWorldCollisions(playerPos);
  }

  if (ledgeHangState.active) {
    playerPos.set(ledgeHangState.grabX, ledgeHangState.grabY, ledgeHangState.grabZ);
    horizontalVelocity.set(0, 0);
    verticalVelocity = 0;
    grounded = false;
    if (forwardInput > 0.2 || jumpBuffer > 0) {
      jumpBuffer = 0;
      ledgeHangState.active = false;
      climbState.active = true;
      climbState.timer = 0;
      climbState.duration = 0.72;
      climbState.startX = ledgeHangState.grabX;
      climbState.startY = ledgeHangState.grabY;
      climbState.startZ = ledgeHangState.grabZ;
      climbState.targetX = ledgeHangState.grabX + ledgeHangState.dirX * 0.96;
      climbState.targetY = ledgeHangState.ledgeTopY;
      climbState.targetZ = ledgeHangState.grabZ + ledgeHangState.dirZ * 0.96;
      climbState.yaw = ledgeHangState.yaw;
    } else if (forwardInput < -0.2) {
      ledgeHangState.active = false;
      verticalVelocity = -0.6;
    }
  } else if (climbState.active) {
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
    // GTA VI weighted character momentum: grounded start/stop inertia + realistic mid-air steering
    const airFactor = (!grounded && !inWater) ? (specialAbility?.active && specialAbility?.charId === 'sabit' ? 0.85 : 0.42) : 1.0;
    const curSpd = horizontalVelocity.length();
    const sharpPivot = isMovingInput && curSpd > 3.5 && ((horizontalVelocity.x * wishDir.x + horizontalVelocity.y * wishDir.z) < 0.25);
    const baseRate = isMovingInput
      ? (inWater ? 9.5 : (sharpPivot ? 10.5 : (isSprinting ? 14.5 : 18.5)))
      : (inWater ? 5.5 : 12.5);
    const accel = baseRate * airFactor * delta;
    horizontalVelocity.x += (targetVx - horizontalVelocity.x) * Math.min(1, accel);
    horizontalVelocity.y += (targetVz - horizontalVelocity.y) * Math.min(1, accel);

    playerPos.x += horizontalVelocity.x * delta;
    playerPos.z += horizontalVelocity.y * delta;
    applyWorldCollisions(playerPos);
  }

  // Smooth dynamic speed-rush FOV boost (and natural portrait FOV when viewing face in Front camera!)
  const isFrontCam = playerCharacter?.state?.cameraMode === 'front';
  const targetFov = isFrontCam ? (isSprinting ? 48.0 : 42.0) : THREE.MathUtils.clamp((isSprinting ? Math.min(82.0, baseWalkFov + 7.5) : baseWalkFov) + (specialAbility?.fovKick ?? 0), 46.0, 86.0);
  if (Math.abs(camera.fov - targetFov) > 0.05) {
    camera.fov += (targetFov - camera.fov) * Math.min(1, delta * 8.5);
    camera.updateProjectionMatrix();
  }
  syncHUDButtons(isSprinting);

  const activeLiftTowerNow = getActiveLiftTower();
  const insideLiftNow = Boolean(activeLiftTowerNow?.isInsideLift(playerPos));
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

  // Probe wall ahead for interactive Wall Climb ([SPACE] against wall or [F] Wall Climb) — throttled to ~20Hz
  if (inWater || climbState.active) {
    wallAhead = false;
  } else {
    const nowWallProbe = performance.now();
    if (nowWallProbe - lastWallProbeAt >= 50) {
      lastWallProbeAt = nowWallProbe;
      wallAhead = probeWallAhead();
    }
  }

  if (grounded || inWater) coyoteTimer = 0.16;
  else coyoteTimer = Math.max(0, coyoteTimer - delta);

  if (jumpBuffer > 0) jumpBuffer = Math.max(0, jumpBuffer - delta);

  if (!climbState.active && !ledgeHangState.active && jumpBuffer > 0 && coyoteTimer > 0 && !(insideLiftNow && activeLiftTowerNow?.state?.liftPhase === 'moving')) {
    if (wallAhead && !inWater && forwardInput > 0.2) {
      // Grab the wall top with both hands & hang! Press [W] to vault/climb over!
      jumpBuffer = 0;
      coyoteTimer = 0;
      controls.getHorizontalVectors(forwardVec, rightVec);
      ledgeHangState.active = true;
      ledgeHangState.dirX = forwardVec.x;
      ledgeHangState.dirZ = forwardVec.z;
      ledgeHangState.yaw = Math.atan2(forwardVec.x, forwardVec.z);
      ledgeHangState.grabX = playerPos.x;
      ledgeHangState.grabY = groundY + EYE_HEIGHT + 0.92;
      ledgeHangState.grabZ = playerPos.z;
      ledgeHangState.ledgeTopY = groundY + EYE_HEIGHT + 2.35;
      grounded = false;
      verticalVelocity = 0;
      horizontalVelocity.set(0, 0);
      if (playerCharacter) playerCharacter.state.emote = null;
    } else {
      const isHighJump = doubleSpaceJumpPending;
      doubleSpaceJumpPending = false;
      const doFlip = isSprinting && !inWater && !diveState.active && !isHighJump;
      const jumpBoost = specialAbility?.jumpMultiplier ?? 1.0;
      verticalVelocity = (inWater ? 6.45 : (isHighJump ? 8.35 : (doFlip ? 6.95 : 6.25))) * jumpBoost;
      isFlipping = doFlip;
      grounded = false;
      inWater = false;
      coyoteTimer = 0;
      jumpBuffer = 0;
      airPeakY = playerPos.y;
      landRecoveryTimer = 0;
      landRecoveryClip = null;
    }
  } else if (!grounded && !climbState.active && !ledgeHangState.active && !inWater && wallAhead && playerPos.y > groundY + EYE_HEIGHT + 0.45 && forwardInput > 0.15) {
    // Mid-air wall grab when jumping toward a wall!
    controls.getHorizontalVectors(forwardVec, rightVec);
    ledgeHangState.active = true;
    ledgeHangState.dirX = forwardVec.x;
    ledgeHangState.dirZ = forwardVec.z;
    ledgeHangState.yaw = Math.atan2(forwardVec.x, forwardVec.z);
    ledgeHangState.grabX = playerPos.x;
    ledgeHangState.grabY = groundY + EYE_HEIGHT + 0.92;
    ledgeHangState.grabZ = playerPos.z;
    ledgeHangState.ledgeTopY = groundY + EYE_HEIGHT + 2.35;
    verticalVelocity = 0;
    horizontalVelocity.set(0, 0);
  }

  if (climbState.active || ledgeHangState.active) {
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
  } else if (!grounded && !climbState.active && !ledgeHangState.active && !inWater && jumpBuffer > 0 && specialAbility?.consumeAirJump?.(playerPos)) {
    jumpBuffer = 0;
    verticalVelocity = 7.4;
    isFlipping = true;
    airPeakY = playerPos.y;
  } else if (grounded && Math.abs(playerPos.y - targetEyeY) <= 0.95) {
    playerPos.y += (targetEyeY - playerPos.y) * Math.min(1, delta * 22.0);
    verticalVelocity = 0;
    airPeakY = playerPos.y;
  } else {
    grounded = false;
    verticalVelocity -= 15.8 * delta;
    playerPos.y += verticalVelocity * delta;
    // Solid Indoor Ceiling Clamp: jumping inside Taltola House or Sk Arshan Tower NEVER clips through to the floor above!
    if (verticalVelocity > 0) {
      const lxCeil = playerPos.x - TALTOLA_HOUSE_OFFSET.x;
      const lzCeil = playerPos.z - TALTOLA_HOUSE_OFFSET.z;
      if (lxCeil >= 5.85 && lxCeil <= 14.42 && Math.abs(lzCeil) <= 5.42 && groundY < 14.5) {
        const inHouseStairOpen = lxCeil >= 7.62 && lxCeil <= 12.18 && lzCeil >= 0.16 && lzCeil <= 1.16;
        if (!inHouseStairOpen) {
          const floorLvl = Math.max(0, Math.min(4, Math.floor((groundY + 0.35) / 3.05)));
          const maxEyeY = (floorLvl + 1) * 3.05 - 0.34;
          if (playerPos.y > maxEyeY) {
            playerPos.y = maxEyeY;
            verticalVelocity = 0;
          }
        }
      } else if (playerPos.x >= -19.85 && playerPos.x <= -3.4 && playerPos.z >= 14.28 && playerPos.z <= 28.55 && groundY < 29.8) {
        const inTowerStairOpen = playerPos.x >= -14.25 && playerPos.x <= -9.55 && playerPos.z >= 21.50 && playerPos.z <= 22.85;
        if (!inTowerStairOpen && !environment?.tower?.isInsideLift?.(playerPos)) {
          const nextSlabY = groundY < 2.2 ? 4.0 : (4.0 + (Math.floor((groundY - 4.0 + 0.35) / 3.0) + 1) * 3.0);
          const maxEyeY = nextSlabY - 0.36;
          if (playerPos.y > maxEyeY) {
            playerPos.y = maxEyeY;
            verticalVelocity = 0;
          }
        }
      }
    }
    if (playerPos.y > airPeakY) airPeakY = playerPos.y;
    if (verticalVelocity <= 0 && playerPos.y <= targetEyeY) {
      const dropH = airPeakY - targetEyeY;
      playerPos.y = targetEyeY;
      verticalVelocity = 0;
      grounded = true;
      isFlipping = false;
      specialAbility?.onGrounded?.();
      if (dropH > 0.35) {
        landingCamDipVel -= THREE.MathUtils.clamp(dropH * 0.92, 0.35, 2.35);
      }
      healthSystem?.onFallLanding?.(dropH, inWater);
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
  const insideHouse = (lxCam > 4.7 && lxCam < 16.3 && Math.abs(lzCam) < 5.3)
    || (playerPos.x < -2.8 && playerPos.x > -19.9 && playerPos.z > 14.3 && playerPos.z < 28.6)
    || Boolean(environment?.altapole?.isInsideAnyHouse?.(playerPos))
    || Boolean(environment?.altapoleTower?.isInsideAnyRoom?.(playerPos))
    || Boolean(environment?.altapoleGoli?.isInsideAnyRoom?.(playerPos))
    || Boolean(environment?.landmarks?.circuitHouse?.isInsideBuilding?.(playerPos))
    || Boolean(environment?.landmarks?.judgeCourt?.isInsideBuilding?.(playerPos))
    || Boolean(environment?.landmarks?.aliaMadrasah?.isInsideModelMosque?.(playerPos))
    || Boolean(environment?.landmarks?.satrastaMore?.getZoneName?.(playerPos.x, playerPos.z, camFootY) && !environment?.landmarks?.satrastaMore?.getZoneName?.(playerPos.x, playerPos.z, camFootY)?.includes('KDA AVENUE'));

  if (indoorLight) {
    const wantI = (insideHouse && quality !== 'low') ? 1.55 : 0;
    if (indoorLight.intensity !== wantI) indoorLight.intensity = wantI;
    if (wantI > 0) {
      indoorLight.position.set(playerPos.x, playerPos.y + 0.55, playerPos.z);
    }
  }

  const activeCamMode = playerCharacter ? playerCharacter.state.cameraMode : 'first';
  const camModeChanged = activeCamMode !== lastResolvedCamMode;
  lastResolvedCamMode = activeCamMode;
  let hidePlayerMesh = false;

  if (playerCharacter && activeCamMode === 'back') {
    const followDist = insideLiftNow ? 0.72 : (insideHouse ? 1.15 : 1.88);
    const pitchLift = THREE.MathUtils.clamp(-controls.euler.x * 0.42, -0.32, 0.42);
    camDesiredPos.copy(playerPos).addScaledVector(forwardVec, -followDist);
    camDesiredPos.y = THREE.MathUtils.clamp(
      playerPos.y + (insideHouse ? -0.10 : -0.16) + pitchLift,
      camFootY + 0.40,
      camFootY + (insideHouse ? 2.18 : 2.65),
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
    // Smooth damped spring landing dip for realistic physical jump weight
    const dipForce = -landingCamDip * 78.0 - landingCamDipVel * 14.0;
    landingCamDipVel += dipForce * delta;
    landingCamDip = THREE.MathUtils.clamp(landingCamDip + landingCamDipVel * delta, -0.26, 0.08);
    camera.position.copy(camRes.camPos);
    camera.position.y += landingCamDip;
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

  const playerInMosque = isPosInModelMosque(playerPos);
  if (playerCharacter) {
    playerCharacter.setSacredSilence?.(playerInMosque);
  }
  if (aliaPrincipalMic?.active) {
    if (inStudio || !environment?.landmarks?.aliaMadrasah?.isNearPrincipalMic?.(playerPos, 5.5)) {
      aliaPrincipalMic.stop(false);
    } else {
      environment?.landmarks?.aliaMadrasah?.setPrincipalMicActive?.(true, aliaPrincipalMic.getLevel());
    }
  } else {
    environment?.landmarks?.aliaMadrasah?.setPrincipalMicActive?.(false, 0);
  }
  if (playerInMosque !== wasPlayerInModelMosque) {
    wasPlayerInModelMosque = playerInMosque;
    if (playerInMosque) {
      mouseAttackHeld = false;
      syncTalkUI();
      syncEmoteUI(playerCharacter?.state?.emote || null);
    }
  }

  if (
    mouseAttackHeld
    && !playerInMosque
    && !inStudio
    && started
    && !freeCursorMode
    && !carDoorCursorMode
    && !getDrivingCar()
    && !sittingState.active
    && !liftKeypadOpen
    && !khulnaMapUI?.isOpen
    && !gtaPhoneUI?.isOpen
    && playerCharacter
    && playerCharacter.state.attackTimer <= 0.06
  ) {
    playerCharacter.triggerAttack();
    triggerPlayerCombatVoice();
  }

  if (playerCharacter) {
    // Drive character locomotion direction & speed from actual smooth velocity (zero 1-frame Walk/Run/Idle snap on key release or frame hitch!)
    const velMag = horizontalVelocity.length();
    const effDirX = isMovingInput ? wishDir.x : (velMag > 0.12 ? horizontalVelocity.x / velMag : 0);
    const effDirZ = isMovingInput ? wishDir.z : (velMag > 0.12 ? horizontalVelocity.y / velMag : 0);
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
      moveDirX: effDirX,
      moveDirZ: effDirZ,
      inStudio: false,
      hideMesh: hidePlayerMesh,
      ledgeHang: ledgeHangState.active ? ledgeHangState : null,
    });
    syncEmoteUI(playerCharacter.state.emote);
  }

  updateHUDPrompt(false);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer?.setSize(window.innerWidth, window.innerHeight);
  bloomPass?.setSize?.(
    Math.max(192, Math.floor(window.innerWidth * 0.25)),
    Math.max(108, Math.floor(window.innerHeight * 0.25))
  );
});

let fpsFrames = 0;
let fpsTime = performance.now();
let shadowFrameCounter = 0;
let lastFullMapUpdate = 0;
let smoothedRawDelta = 0.016;
function animate() {
  if (!ready) return;
  const instDelta = Math.min(clock.getDelta(), 0.036);
  // Smooth frame delta so single-frame Ultra micro-spikes NEVER cause character/camera teleporting or jitter!
  smoothedRawDelta += (instDelta - smoothedRawDelta) * 0.35;
  const rawDelta = smoothedRawDelta;
  specialAbility?.update?.(rawDelta, {
    isDriving: Boolean(getDrivingCar()),
    inStudio,
    inMosque: isPosInModelMosque(playerPos),
    playerCharacter,
  });
  healthSystem?.update?.(rawDelta, {
    inStudio,
    paused: Boolean(pause && !pause.classList.contains('hidden')) || Boolean(khulnaMapUI?.isOpen),
  });
  const delta = rawDelta * (gtaCharacterSwitch?.timeScale ?? 1.0) * (specialAbility?.timeScale ?? 1.0);
  const elapsed = clock.elapsedTime;
  const isLow = quality === 'low';

  if (inStudio) {
    updateStudioCamera(rawDelta);
    renderer.render(scene, camera);
  } else {
    const distHajiSqNow = playerPos.x * playerPos.x + playerPos.z * playerPos.z;
    const distAltapoleSqNow = (playerPos.x - 166) ** 2 + (playerPos.z + 408) ** 2;
    if (environment?.tower && distHajiSqNow < 155 * 155) environment.tower.update(delta, playerPos, isLow);
    if (gtaCharacterSwitch?.isCameraOverridden) {
      gtaCharacterSwitch.update(rawDelta);
    } else {
      gtaCharacterSwitch?.update(rawDelta);
      updateMovement(delta);
    }
    autonomousPartner.update(delta, {
      playerPos,
      playerCharacter,
      cars,
      environment,
      inStudio,
      quality,
    });
    // Smart indoor building & exterior culling + active chunk streaming across Khulna City
    const { nearTaltolaVis, deepInTowerUpper } = syncSceneVisibility();
    const activeCar = getDrivingCar();
    const nowPerf = performance.now();
    const partnerLive = autonomousPartner.getHUDStatus();
    if (partnerStatusPill && partnerStatusText) {
      if (started && partnerLive) {
        partnerStatusPill.classList.remove('hidden');
        const nextText = `${partnerLive.name} · ${partnerLive.statusText}`;
        if (nextText !== lastPartnerHudText) {
          lastPartnerHudText = nextText;
          partnerStatusText.textContent = nextText;
        }
      } else {
        partnerStatusPill.classList.add('hidden');
      }
    }
    khulnaMapUI?.setPartnerInfo?.(
      partnerLive ? { name: partnerLive.name, x: partnerLive.x, z: partnerLive.z, inCar: partnerLive.inCar } : null,
    );
    const isShadowSceneDynamic = (
      !started
      || horizontalVelocity.lengthSq() > 0.01
      || Math.abs(verticalVelocity) > 0.05
      || Boolean(activeCar && Math.abs(activeCar.state.speed) > 0.08)
      || Boolean(playerCharacter?.state?.emote || playerCharacter?.state?.attackTimer > 0)
    );
    if (sun?.castShadow) {
      updateSunShadowTarget(activeCar ? activeCar.state.pos : playerPos, nowPerf, isShadowSceneDynamic);
    }
    if (started && !khulnaMapUI?.isOpen && !freeCursorMode && !carDoorCursorMode) {
      controls.updateEdgeTurn?.(delta);
    }
    if (house && nearTaltolaVis && !deepInTowerUpper) house.update(delta, playerPos, isLow);
    if (distAltapoleSqNow < 185 * 185 && !deepInTowerUpper) {
      if (environment?.altapole) environment.altapole.update(delta, playerPos, isLow);
      if (environment?.altapoleTower) environment.altapoleTower.update(delta, playerPos, isLow);
      if (environment?.altapoleGoli) environment.altapoleGoli.update(delta, playerPos, isLow);
    }
    if (skySystem) skySystem.update(elapsed, camera.position);
    if (environment && !deepInTowerUpper) environment.update(elapsed, playerPos, isLow, true);

    const liveYaw = getLiveMapHeadingYaw();
    const mapPos = getLiveMapPos();
    if (khulnaMapUI && khulnaMapUI.isOpen && nowPerf - lastFullMapUpdate > 45) {
      lastFullMapUpdate = nowPerf;
      khulnaMapUI.renderFullMap(mapPos, liveYaw);
    } else if (khulnaMapUI && !khulnaMapUI.isOpen && nowPerf - lastMinimapUpdate > 140) {
      lastMinimapUpdate = nowPerf;
      const info = environment?.city?.findNearestRoadAndDistrict?.(mapPos.x, mapPos.z);
      khulnaMapUI.renderMinimap(mapPos, liveYaw, info);
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
      specialAbility?.applyCameraShake?.(camera);
      renderActiveScene();
    }
  }

  fpsFrames++;
  const now = performance.now();
  if (now - fpsTime > 450) {
    const currentFps = Math.round((fpsFrames * 1000) / (now - fpsTime));
    const fpsText = `${currentFps} FPS`;
    if (fpsLabel) fpsLabel.textContent = fpsText;
    if (cornerFpsValEl) cornerFpsValEl.textContent = fpsText;
    if (cornerFpsEl) {
      cornerFpsEl.classList.toggle('fps-mid', currentFps >= 35 && currentFps < 50);
      cornerFpsEl.classList.toggle('fps-low', currentFps < 35);
    }
    // Smooth GPU/UI perf adaptation ONLY when user has NOT manually locked quality & after shader warmup
    const manualQualityLock = Boolean(localStorage.getItem('taltola_quality_manual'));
    if (ready && !inStudio && !manualQualityLock && elapsed > 6.0) {
      if (currentFps < 18 && quality !== 'low') {
        lowFpsStreak++;
        if (lowFpsStreak >= 4) {
          applyQuality(quality === 'ultra' ? 'high' : (quality === 'high' ? 'medium' : 'low'));
          lowFpsStreak = 0;
        }
      } else if (quality === 'low' && !ultraFastMode && softwareRendererDetected) {
        if (currentFps < 14) {
          lowFpsStreak++;
          if (lowFpsStreak >= 4) {
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
  initFailed = true;
  console.error(error);
  loadingStatus.textContent = `The scene could not be initialized: ${error?.message || error}`;
});
