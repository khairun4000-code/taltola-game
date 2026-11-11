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
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x18211e);
scene.fog = new THREE.Fog(0xcfe0e6, 55, 130);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.08, 175);

const controls = new FirstPersonControls(camera, renderer.domElement);
const clock = new THREE.Clock();
const keys = new Set();

const EYE_HEIGHT = 1.68;
const PLAYER_RADIUS = 0.34;
const playerPos = new THREE.Vector3(-0.2, EYE_HEIGHT, 2.2);
const savedCameraQuat = new THREE.Quaternion();

let inStudio = false;
let started = false;
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

let quality = localStorage.getItem('taltola_quality') || 'high';
if (!['low', 'medium', 'high', 'ultra'].includes(quality)) quality = 'high';
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
let ready = false;
let lastHudDoorOpen = null;
let lastHudCameraMode = null;
let lastHudRunOn = null;
let lastPromptText = null;
let lastZoneText = null;
let lastSyncedEmote = undefined;
const camTargetPos = new THREE.Vector3();

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
    if (brandTitle) brandTitle.textContent = 'TALTOLA';
    if (brandSubtitle) brandSubtitle.textContent = 'KHULNA · BANGLADESH';
    if (studioToggleButton) studioToggleButton.innerHTML = 'CHARACTER STUDIO <span>★</span>';

    applyQuality(quality);
    beginWalking();
  }
}

function applyQuality(nextQuality) {
  quality = nextQuality;
  try {
    localStorage.setItem('taltola_quality', quality);
  } catch {}
  const dpr = window.devicePixelRatio || 1;
  const isLow = quality === 'low';
  const ratios = {
    low: Math.min(dpr, 0.68),
    medium: Math.min(dpr * 1.15, 1.35),
    high: Math.min(Math.max(dpr * 1.4, 1.5), 2.0),
    ultra: Math.min(Math.max(dpr * 1.85, 2.0), 2.5),
  };
  const shadowSizes = { low: 512, medium: 1024, high: 2048, ultra: 4096 };
  const useShadows = !isLow;

  renderer.setPixelRatio(ratios[quality] ?? ratios.high);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = useShadows;
  renderer.shadowMap.type = (quality === 'high' || quality === 'ultra')
    ? THREE.PCFSoftShadowMap
    : THREE.BasicShadowMap;

  if (!inStudio) {
    scene.fog.near = isLow ? 36 : 48;
    scene.fog.far = isLow ? 88 : 115;
    camera.far = isLow ? 95 : 175;
    camera.updateProjectionMatrix();
  }

  // In Low (No GPU) mode, disable extra directional lights outside Studio so the GPU/CPU only computes 1 directional light
  const useExtraLights = !isLow || inStudio;
  if (studioKeyLight) studioKeyLight.visible = useExtraLights;
  if (fillDirLight) fillDirLight.visible = useExtraLights;
  if (ambientLight) ambientLight.intensity = isLow && !inStudio ? 1.26 : 0.88;
  if (hemisphereLight) hemisphereLight.intensity = isLow && !inStudio ? 1.05 : 0.82;

  if (sun) {
    sun.castShadow = useShadows;
    if (useShadows) {
      const size = shadowSizes[quality] || 2048;
      sun.shadow.mapSize.set(size, size);
      sun.shadow.bias = -0.0004;
      if (sun.shadow.map) {
        sun.shadow.map.dispose();
        sun.shadow.map = null;
      }
    }
  }

  sceneMaterials?.setQualityMode?.(quality);
  playerCharacter?.setQualityMode?.(quality);

  for (const input of qualityInputs) {
    if (input) input.value = quality;
  }
}

for (const input of qualityInputs) {
  input?.addEventListener('change', () => applyQuality(input.value));
}

function setupLighting() {
  ambientLight = new THREE.AmbientLight(0xf6f4ee, 0.88);
  scene.add(ambientLight);

  hemisphereLight = new THREE.HemisphereLight(0xe6f2f7, 0x6b7058, 0.82);
  scene.add(hemisphereLight);

  sun = new THREE.DirectionalLight(0xfff5e4, 1.85);
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

function handleDoorInteraction() {
  if (environment?.tower?.interact(playerPos)) {
    syncHUDButtons(false, true);
    return;
  }
  if (!house) return;
  house.toggleNearestDoor(playerPos);
  syncHUDButtons(false, true);
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
  window.__TALTOLA__ = { scene, camera, renderer, controls, house, playerCharacter, playerPos, setMode, ready };
  renderer.render(scene, camera);
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
  if (!controls.isLocked) {
    beginWalking();
    return;
  }
  if (event.button === 0 && controls.pointerLocked) {
    if (environment?.tower?.getPrompt(playerPos) || house?.getPrompt(playerPos)) {
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
 * Computes exact floor or staircase ground elevation under playerPos across both buildings:
 *  1) 5-Story Taltola House + Rooftop (x = 5.95..14.38, z = -5.42..5.42)
 *  2) 10-Story Sk Arshan Alif Tower + Rooftop Sky Lounge (x = -19.85..-2.85, z = 14.25..28.55)
 */
function computeGroundHeight(pos) {
  const footY = pos.y - EYE_HEIGHT;

  // --- SK ARSHAN ALIF TOWER (35 Haji Mohsin Road) ---
  const inSkArshanZone = pos.x >= -19.85 && pos.x <= -2.85 && pos.z >= 14.25 && pos.z <= 28.55;
  if (inSkArshanZone) {
    // Ground-floor Car Ramp (z = 19.1..22.9, x = -4.65..-3.15) & South Steps (z = 26.5..28.5)
    if (footY < 1.8 && pos.x > -4.6) {
      if ((pos.z >= 19.1 && pos.z <= 22.9) || (pos.z >= 26.5 && pos.z <= 28.5)) {
        const rampT = THREE.MathUtils.clamp((-3.25 - pos.x) / 1.3, 0, 1);
        return rampT * 0.50;
      }
      if (pos.x <= -3.25) return 0.50;
      return 0.0;
    }

    // Continuous Walkable Marble Staircase inside Sk Arshan Tower (x = -14.25..-9.55, z = 21.50..22.85)
    const inTowerStairs = pos.x >= -14.25 && pos.x <= -9.55 && pos.z >= 21.50 && pos.z <= 22.85;
    const L = (k) => (k === 0 ? 0.50 : 4.0 + (k - 1) * 3.0);
    if (inTowerStairs) {
      const t = THREE.MathUtils.clamp((-9.65 - pos.x) / 4.45, 0, 1);
      let bestY = 0.50;
      let bestDiff = Infinity;
      for (let k = 0; k <= 9; k++) {
        const y0 = L(k);
        const y1 = L(k + 1);
        const rampY = y0 + t * (y1 - y0);
        const diff = Math.abs(footY - rampY);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestY = rampY;
        }
      }
      if (bestDiff < 1.65) {
        return bestY;
      }
    }

    // Nearest floor slab inside Sk Arshan Tower (k = 0..10 -> 0.5m, 4.0m, 7.0m, ..., 31.0m)
    let nearestY = 0.50;
    let minDiff = Infinity;
    for (let k = 0; k <= 10; k++) {
      const fy = L(k);
      const d = Math.abs(footY - fy);
      if (d < minDiff) {
        minDiff = d;
        nearestY = fy;
      }
    }
    return nearestY;
  }

  // --- 5-STORY TALTOLA HOUSE ---
  const insideBuilding = pos.x >= 5.95 && pos.x <= 14.38 && Math.abs(pos.z) <= 5.42;
  if (!insideBuilding) {
    return 0.0;
  }

  // Check if player is walking on the continuous interior staircase (x = 7.65..12.15, z = 0.16..1.16)
  const inStairLane = pos.x >= 7.62 && pos.x <= 12.18 && pos.z >= 0.16 && pos.z <= 1.16;
  if (inStairLane) {
    const t = THREE.MathUtils.clamp((pos.x - 7.75) / (12.05 - 7.75), 0, 1);
    let bestY = 0;
    let bestDiff = Infinity;
    for (let lvl = 0; lvl < 5; lvl++) {
      const rampY = lvl * 3.05 + t * 3.05;
      const diff = Math.abs(footY - rampY);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestY = rampY;
      }
    }
    if (bestDiff < 1.35) {
      return bestY;
    }
  }

  // Otherwise player is on a floor slab (levels 0..5 -> y = 0, 3.05, 6.10, 9.15, 12.20, 15.25)
  const lvl = THREE.MathUtils.clamp(Math.round(footY / 3.05), 0, 5);
  return lvl * 3.05;
}

function applyWorldCollisions(pos) {
  // Fakir Bari Lane (z 10.2..14.25) is walkable to x = -42; Sk Arshan Tower (z 14.25..28.6) is walkable to x = -19.7
  const inFakirBariLane = pos.z > 10.0 && pos.z < 14.5;
  const inSkArshanZ = pos.z >= 14.25 && pos.z <= 28.6;
  const minXBound = inFakirBariLane ? -42.0 : (inSkArshanZ ? -19.7 : -17.8);
  pos.x = THREE.MathUtils.clamp(pos.x, minXBound, 21.05);
  pos.z = THREE.MathUtils.clamp(pos.z, -40, 40);

  const footY = pos.y - EYE_HEIGHT;
  const currentLevel = THREE.MathUtils.clamp(Math.round(footY / 3.05), 0, 5);
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
      // Rear wall (x = -19.8) & South wall (z = 28.5)
      resolveCircleAABB(pos, PLAYER_RADIUS, -20.2, -19.65, 14.2, 28.7);
      resolveCircleAABB(pos, PLAYER_RADIUS, -19.85, -3.5, 28.42, 28.8);
      // Elevator & Reception marble core wall (x = -11.55..-12.15, z = 18.6..20.6)
      resolveCircleAABB(pos, PLAYER_RADIUS, -12.15, -11.52, 18.65, 20.55);

      if (footY < 2.2) {
        // Ground-floor lane-side shop shutters wall (z = 14.48..14.75, x = -19.85..-4.45)
        resolveCircleAABB(pos, PLAYER_RADIUS, -19.85, -4.45, 14.42, 14.76);
        // Plinth stainless railings along road (leaving Car Ramp z=19.15..22.95 & South Steps z=26.55..28.45 open!)
        resolveCircleAABB(pos, PLAYER_RADIUS, -3.42, -3.22, 14.30, 19.15);
        resolveCircleAABB(pos, PLAYER_RADIUS, -3.42, -3.22, 22.95, 26.55);
        // Front ground-floor piers & closed gates (leaving Bay B z=18.9..21.9 open when gateOpen, and South Entry z=26.6..27.8 open!)
        resolveCircleAABB(pos, PLAYER_RADIUS, -4.55, -4.02, 14.55, 18.88);
        if (environment?.tower && !environment.tower.state.gateOpen) {
          resolveCircleAABB(pos, PLAYER_RADIUS, -4.45, -4.05, 18.88, 21.92);
        }
        resolveCircleAABB(pos, PLAYER_RADIUS, -4.55, -4.02, 21.92, 26.58);
        resolveCircleAABB(pos, PLAYER_RADIUS, -4.55, -4.02, 27.82, 28.60);
        // Parked Red Car & Black SUV colliders on ground floor
        resolveCircleAABB(pos, PLAYER_RADIUS, -9.2, -5.0, 24.55, 26.25);
        resolveCircleAABB(pos, PLAYER_RADIUS, -18.8, -14.5, 15.6, 17.6);
      } else if (footY < 29.5) {
        // Upper floors (k = 1..9): Lane-side wall (z = 14.48) & Front balcony outer railings
        resolveCircleAABB(pos, PLAYER_RADIUS, -19.85, -4.25, 14.42, 14.72);
        resolveCircleAABB(pos, PLAYER_RADIUS, -3.02, -2.82, 14.30, 18.60); // Bay A balcony front rail
        resolveCircleAABB(pos, PLAYER_RADIUS, -4.25, -2.85, 14.28, 14.44); // Bay A balcony north rail
        resolveCircleAABB(pos, PLAYER_RADIUS, -3.92, -3.72, 18.60, 23.55); // Bay B balcony front rail
        resolveCircleAABB(pos, PLAYER_RADIUS, -3.75, -3.55, 23.55, 28.55); // Bay C balcony front rail
      } else {
        // Rooftop Sky Lounge parapet walls (y = 31.0m)
        resolveCircleAABB(pos, PLAYER_RADIUS, -19.85, -3.65, 14.25, 14.55);
        resolveCircleAABB(pos, PLAYER_RADIUS, -3.92, -3.62, 14.30, 28.55);
      }
      continue;
    }

    // East Side Yard & Street Boundary Walls (North of Taltola House & Taltola House Front Wall)
    resolveCircleAABB(pos, PLAYER_RADIUS, 2.06, 2.86, -42, -2.06);
    resolveCircleAABB(pos, PLAYER_RADIUS, 2.06, 2.86, 2.06, 7.36);

    if (house && !house.state.gateOpen) {
      resolveCircleAABB(pos, PLAYER_RADIUS, 2.36, 2.66, -2.06, 2.06);
    }

    // Taltola House North & South Side Compound Walls (z = -7.28 and z = +7.28)
    resolveCircleAABB(pos, PLAYER_RADIUS, 2.4, 22.0, -20.0, -7.08);
    resolveCircleAABB(pos, PLAYER_RADIUS, 2.4, 22.0, 7.08, 7.48);
    resolveCircleAABB(pos, PLAYER_RADIUS, 21.25, 24.0, -15.0, 15.0);

    // Haji Mohsin Road East Side: Planter Box (z = 7.5..11.2), 4 Shutter Shops (z = 11.3..20.7),
    // Open ASB Gate Entrance (z = 23.7..26.5 lets player walk inside x = 3.0..7.2!), and Milk Vita Shops (z = 26.8..42.0)
    resolveCircleAABB(pos, PLAYER_RADIUS, 3.02, 22.0, 7.45, 20.85);
    resolveCircleAABB(pos, PLAYER_RADIUS, 2.95, 3.65, 20.85, 23.75);
    resolveCircleAABB(pos, PLAYER_RADIUS, 7.20, 22.0, 20.85, 26.80);
    resolveCircleAABB(pos, PLAYER_RADIUS, 3.05, 22.0, 26.55, 42.0);

    // Rooftop Parapet & Mumty Collisions (Level 5: y ≈ 15.25)
    if (footY >= 14.1) {
      resolveCircleAABB(pos, PLAYER_RADIUS, 5.75, 6.02, -5.50, 5.50);
      resolveCircleAABB(pos, PLAYER_RADIUS, 14.15, 14.42, -5.50, 5.50);
      resolveCircleAABB(pos, PLAYER_RADIUS, 5.85, 14.35, -5.55, -5.28);
      resolveCircleAABB(pos, PLAYER_RADIUS, 5.85, 14.35, 5.28, 5.55);
      // Stairwell guardrail on roof
      resolveCircleAABB(pos, PLAYER_RADIUS, 7.82, 11.98, 0.08, 0.24);
      continue;
    }

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
    } else {
      // Upper floors: keep player inside front/back exterior walls
      resolveCircleAABB(pos, PLAYER_RADIUS, 5.90, 6.22, -5.48, 5.48);
      resolveCircleAABB(pos, PLAYER_RADIUS, 14.14, 14.46, -5.48, 5.48);
    }

    // Left & Right Exterior Side Walls (z = -5.36 and z = +5.36)
    resolveCircleAABB(pos, PLAYER_RADIUS, 5.96, 14.40, -5.50, -5.22);
    resolveCircleAABB(pos, PLAYER_RADIUS, 5.96, 14.40, 5.22, 5.50);

    // Stairwell Handrail Divider (z = 0.18, x = 7.82..11.98) so player enters/exits stairs at ends
    resolveCircleAABB(pos, PLAYER_RADIUS, 7.82, 11.98, 0.10, 0.24);

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

    // Major Room Furniture Colliders (Sofa, Coffee Table, Bed, Dining Table, Kitchen Counter)
    resolveCircleAABB(pos, PLAYER_RADIUS, 6.80, 8.90, -5.20, -4.40);
    resolveCircleAABB(pos, PLAYER_RADIUS, 7.30, 8.40, -3.85, -3.25);
    resolveCircleAABB(pos, PLAYER_RADIUS, 11.90, 13.80, -5.15, -3.30);
    resolveCircleAABB(pos, PLAYER_RADIUS, 7.15, 8.55, 2.95, 4.15);
    resolveCircleAABB(pos, PLAYER_RADIUS, 11.60, 14.10, 4.55, 5.30);
  }
}

const FLOOR_NAMES_BN = ['নিচতলা (1st Floor)', '২য় তলা (2nd Floor)', '৩য় তলা (3rd Floor)', '৪র্থ তলা (4th Floor)', '৫ম তলা (5th Floor)', 'ছাদ (Rooftop)'];

function updateHUDPrompt() {
  if (!house || !interactPrompt) return;
  const promptText = controls.isLocked
    ? (environment?.tower?.getPrompt(playerPos) || house.getPrompt(playerPos))
    : null;
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
      if (towerFl === 0) {
        zone = 'SK ARSHAN ALIF TOWER · গ্র্যান্ড পার্কিং ও রিসেপশন লবি (নিচতলা)';
      } else if (towerFl >= 10 || footY >= 29.8) {
        zone = 'SK ARSHAN ALIF TOWER · ছাদের স্কাই লাউঞ্জ ও গার্ডেন (Rooftop)';
      } else if (x > -4.35) {
        zone = `SK ARSHAN TOWER (${towerFl + 1} তলা) · সামনের বারান্দা (Balcony View)`;
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

  const targetEyeY = computeGroundHeight(playerPos) + EYE_HEIGHT;

  if (grounded) coyoteTimer = 0.12;
  else coyoteTimer = Math.max(0, coyoteTimer - delta);

  if (jumpBuffer > 0) jumpBuffer = Math.max(0, jumpBuffer - delta);

  if (jumpBuffer > 0 && coyoteTimer > 0) {
    verticalVelocity = 5.65;
    grounded = false;
    coyoteTimer = 0;
    jumpBuffer = 0;
  }

  if (grounded && Math.abs(playerPos.y - targetEyeY) <= 0.95) {
    // Smoothly climb or descend stairs and floor transitions
    playerPos.y += (targetEyeY - playerPos.y) * Math.min(1, delta * 22.0);
    verticalVelocity = 0;
  } else {
    grounded = false;
    verticalVelocity -= 14.8 * delta;
    playerPos.y += verticalVelocity * delta;
    if (playerPos.y <= targetEyeY) {
      playerPos.y = targetEyeY;
      verticalVelocity = 0;
      grounded = true;
    }
  }

  const speedMag = horizontalVelocity.length();
  controls.euler.setFromQuaternion(camera.quaternion, 'YXZ');

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
    });
    syncEmoteUI(playerCharacter.state.emote);
  }

  if (playerCharacter && playerCharacter.state.cameraMode === 'back') {
    const insideHouse = (playerPos.x > 5.7 && playerPos.x < 14.6 && Math.abs(playerPos.z) < 5.3)
      || (playerPos.x < -3.6 && playerPos.x > -19.9 && playerPos.z > 14.3 && playerPos.z < 28.6);
    const followDist = insideHouse ? 1.15 : 1.95;
    camTargetPos.copy(playerPos).addScaledVector(forwardVec, -followDist);
    camTargetPos.y = playerPos.y + (insideHouse ? 0.12 : 0.22);
    camera.position.copy(camTargetPos);
  } else if (playerCharacter && playerCharacter.state.cameraMode === 'front') {
    camTargetPos.copy(playerPos).addScaledVector(forwardVec, 1.15);
    camTargetPos.y = playerPos.y - 0.08;
    camera.position.copy(camTargetPos);
  } else {
    if (grounded && speedMag > 0.35) {
      bobPhase += delta * (isSprinting ? 13.5 : 9.5);
      const bobOffset = Math.sin(bobPhase) * 0.036 * Math.min(1, speedMag / maxSpeed);
      camera.position.set(playerPos.x, playerPos.y + bobOffset, playerPos.z);
    } else {
      camera.position.copy(playerPos);
    }
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
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;
  const isLow = quality === 'low';

  if (inStudio) {
    updateStudioCamera(delta);
    renderer.render(scene, camera);
  } else {
    updateMovement(delta);
    if (house) house.update(delta, playerPos, isLow);
    if (environment?.tower) environment.tower.update(delta, playerPos, isLow);
    if (environment && !isLow) environment.update(elapsed);

    if (!started) {
      camera.position.z = 10.5 + Math.sin(elapsed * 0.12) * 0.25;
      camera.lookAt(4.6, 4.4, 0);
      renderer.render(scene, camera);
    } else if (playerCharacter && playerCharacter.state.cameraMode === 'front') {
      savedCameraQuat.copy(camera.quaternion);
      camera.lookAt(playerPos.x, playerPos.y - 0.12, playerPos.z);
      renderer.render(scene, camera);
      camera.quaternion.copy(savedCameraQuat);
    } else {
      renderer.render(scene, camera);
    }
  }

  fpsFrames++;
  const now = performance.now();
  if (now - fpsTime > 800) {
    const currentFps = Math.round((fpsFrames * 1000) / (now - fpsTime));
    fpsLabel.textContent = `${currentFps} FPS`;
    // Auto-adapt to Low (No GPU) mode if a machine without a GPU drops below 20 FPS
    if (ready && currentFps < 20 && quality !== 'low') {
      applyQuality('low');
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
