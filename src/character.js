import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { VOICE_CLIPS, VOICE_BUS } from './voice-clips.js';

const MODEL_URL = './assets/player-bangladeshi.glb?v=v8clean';
const IPHONE_MODEL_URL = './assets/iphone_18_pro_max_burgundy.glb';
const DRACO_PATH = './draco/gltf/';
const PLAYER_EYE_HEIGHT = 1.68;

let sharedBurgundyIphonePromise = null;
function loadSharedBurgundyIPhone() {
  if (!sharedBurgundyIphonePromise) {
    const phoneLoader = new GLTFLoader();
    sharedBurgundyIphonePromise = new Promise((resolve) => {
      phoneLoader.load(
        IPHONE_MODEL_URL,
        (gltf) => {
          const src = gltf.scene;
          src.traverse((ch) => {
            if (!ch.isMesh) return;
            ch.castShadow = false;
            ch.receiveShadow = false;
            const mats = Array.isArray(ch.material) ? ch.material : [ch.material];
            for (let i = 0; i < mats.length; i++) {
              const m = mats[i];
              if (!m) continue;
              if (/Screen/i.test(m.name || '')) {
                // Keep OLED Burgundy iPhone 18 Pro Max screen vividly lit & crisp!
                m.emissiveIntensity = Math.max(m.emissiveIntensity || 1.0, 1.35);
                m.roughness = 0.08;
              } else if (/Cherry_Backpanel|Cherry_Side|Cherry_Apple|Lens|Glass/i.test(m.name || '')) {
                m.envMapIntensity = 1.45;
              }
            }
          });
          resolve(src);
        },
        undefined,
        () => resolve(null),
      );
    });
  }
  return sharedBurgundyIphonePromise;
}

export const CHARACTER_ROSTER = [
  {
    id: 'sabit',
    name: 'Sabit · Cream Panjabi',
    shortName: 'Sabit',
    subtitle: 'Classic Hero · Cream Panjabi',
    modelUrl: './assets/player-bangladeshi.glb?v=v8clean',
    studioX: -0.68,
    studioYaw: 0.14,
  },
  {
    id: 'kurta_blue',
    name: 'Huzzatullah · Blue Panjabi',
    shortName: 'Huzzatullah',
    subtitle: 'HD Face · Blue Panjabi',
    modelUrl: './assets/player-kurta-blue.glb?v=v2hd',
    studioX: 0.68,
    studioYaw: -0.14,
  },
];

const CLIP_FALLBACKS = {
  Angry1: 'Flex',
  Angry2: 'Combo',
  Greet: 'Wave',
  StandingRelax: 'Idle',
  Dribble: 'Dance1',
};

// Full Apple ARKit 52-Blendshape speech visemes (driven across AvatarHead, AvatarEyelashes & AvatarTeethLower!)
const SPEECH_VISEMES = {
  SIL: { jawOpen: 0.00, mouthClose: 0.04, mouthSmileLeft: 0.08, mouthSmileRight: 0.07 },
  AA:  { jawOpen: 0.44, mouthLowerDownLeft: 0.24, mouthLowerDownRight: 0.24, mouthUpperUpLeft: 0.14, mouthUpperUpRight: 0.14, cheekSquintLeft: 0.10, cheekSquintRight: 0.10 },
  AH:  { jawOpen: 0.30, mouthStretchLeft: 0.20, mouthStretchRight: 0.20, mouthUpperUpLeft: 0.12, mouthUpperUpRight: 0.12, mouthLowerDownLeft: 0.14, mouthLowerDownRight: 0.14 },
  EE:  { jawOpen: 0.18, mouthStretchLeft: 0.56, mouthStretchRight: 0.56, mouthSmileLeft: 0.28, mouthSmileRight: 0.26, mouthUpperUpLeft: 0.22, mouthUpperUpRight: 0.22, cheekSquintLeft: 0.16, cheekSquintRight: 0.16 },
  OH:  { jawOpen: 0.28, mouthFunnel: 0.72, mouthPucker: 0.28, mouthShrugLower: 0.16 },
  OO:  { jawOpen: 0.14, mouthFunnel: 0.42, mouthPucker: 0.78, mouthShrugUpper: 0.14, mouthShrugLower: 0.18 },
  PP:  { jawOpen: 0.00, mouthClose: 0.55, mouthPressLeft: 0.72, mouthPressRight: 0.72, mouthRollLower: 0.26, mouthRollUpper: 0.22 },
  FF:  { jawOpen: 0.10, mouthRollLower: 0.78, mouthUpperUpLeft: 0.26, mouthUpperUpRight: 0.26, mouthShrugLower: 0.20 },
  TH:  { jawOpen: 0.26, mouthLowerDownLeft: 0.22, mouthLowerDownRight: 0.22, mouthUpperUpLeft: 0.18, mouthUpperUpRight: 0.18, jawForward: 0.12 },
  SS:  { jawOpen: 0.14, mouthStretchLeft: 0.38, mouthStretchRight: 0.38, mouthUpperUpLeft: 0.26, mouthUpperUpRight: 0.26, mouthLowerDownLeft: 0.20, mouthLowerDownRight: 0.20, mouthDimpleLeft: 0.14, mouthDimpleRight: 0.14 },
  KK:  { jawOpen: 0.34, mouthLowerDownLeft: 0.18, mouthLowerDownRight: 0.18, mouthUpperUpLeft: 0.12, mouthUpperUpRight: 0.12, mouthFunnel: 0.15 },
};

// Realistic Bengali/conversational speech syllable timeline: [viseme, durationSec, stress(0..1)]
const SPEECH_TIMELINE = [
  ['PP', 0.085, 0.2], ['AA', 0.150, 0.9], ['TH', 0.095, 0.3], ['OH', 0.155, 0.7],
  ['SS', 0.095, 0.2], ['EE', 0.140, 0.6], ['PP', 0.080, 0.1], ['AH', 0.125, 0.5],
  ['TH', 0.090, 0.3], ['OO', 0.145, 0.8], ['SIL', 0.280, 0.0],
  ['KK', 0.115, 0.6], ['EE', 0.135, 0.7], ['FF', 0.095, 0.3], ['AA', 0.160, 1.0],
  ['TH', 0.090, 0.4], ['AH', 0.120, 0.4], ['PP', 0.085, 0.2], ['OH', 0.155, 0.8],
  ['SS', 0.090, 0.2], ['AA', 0.140, 0.6], ['TH', 0.090, 0.3], ['EE', 0.130, 0.5],
  ['SIL', 0.360, 0.0],
  ['AA', 0.140, 0.8], ['PP', 0.085, 0.2], ['AH', 0.125, 0.5], ['TH', 0.095, 0.4],
  ['OO', 0.145, 0.7], ['FF', 0.095, 0.3], ['EE', 0.135, 0.7], ['KK', 0.115, 0.5],
  ['OH', 0.150, 0.9], ['TH', 0.090, 0.3], ['AA', 0.135, 0.6], ['PP', 0.080, 0.2],
  ['SIL', 0.320, 0.0],
];
const SPEECH_TOTAL_DUR = SPEECH_TIMELINE.reduce((acc, s) => acc + s[1], 0);

const ARKIT_MORPH_KEYS = [
  'jawOpen', 'jawForward', 'jawLeft', 'jawRight',
  'mouthClose', 'mouthFunnel', 'mouthPucker',
  'mouthSmileLeft', 'mouthSmileRight',
  'mouthStretchLeft', 'mouthStretchRight',
  'mouthUpperUpLeft', 'mouthUpperUpRight',
  'mouthLowerDownLeft', 'mouthLowerDownRight',
  'mouthRollLower', 'mouthRollUpper',
  'mouthPressLeft', 'mouthPressRight',
  'mouthShrugLower', 'mouthShrugUpper',
  'mouthDimpleLeft', 'mouthDimpleRight',
  'mouthFrownLeft', 'mouthFrownRight',
  'cheekSquintLeft', 'cheekSquintRight', 'cheekPuff',
  'noseSneerLeft', 'noseSneerRight',
  'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight', 'browDownLeft', 'browDownRight',
  'eyeBlinkLeft', 'eyeBlinkRight', 'eyeSquintLeft', 'eyeSquintRight', 'eyeWideLeft', 'eyeWideRight',
  'eyeLookInLeft', 'eyeLookOutLeft', 'eyeLookInRight', 'eyeLookOutRight',
  'eyeLookUpLeft', 'eyeLookUpRight', 'eyeLookDownLeft', 'eyeLookDownRight',
];

const EMOTE_CLIP_MAP = {
  pocket: 'Pocket',
  wave: 'Wave',
  kick: 'Kick',
  kick2: 'Kick2',
  combo: 'Combo',
  flex: 'Flex',
  dance1: 'Dance1',
  dance2: 'Dance2',
  cheer: 'Cheer',
  clap: 'Clap',
  phone: 'PhoneCall',
  mobile: 'MobileGame',
  laugh: 'Laugh',
  warmup: 'WarmUp',
  hug: 'Hug',
  sit: 'Sit',
  climb: 'Climb',
  fall: 'Fall',
  jumpdown: 'JumpDown',
  flip: 'Flip',
  dive: 'Dive',
  swim: 'Swim',
  hit: 'HitBody',
  idlelook: 'IdleLook',
  greet: 'Greet',
  angry1: 'Angry1',
  angry2: 'Angry2',
  dribble: 'Dribble',
  relax: 'StandingRelax',
};

const EMOTE_DURATIONS = {
  dance1: 8.0,
  dance2: 9.0,
  cheer: 5.5,
  clap: 5.5,
  wave: 3.4,
  kick: 1.4,
  kick2: 1.2,
  combo: 2.6,
  flex: 3.6,
  phone: 9.0,
  mobile: 9.0,
  laugh: 5.0,
  warmup: 7.0,
  hug: 4.5,
  pocket: 35.0,
  sit: 3600.0,
  climb: 2.8,
  fall: 3.0,
  jumpdown: 1.6,
  flip: 2.4,
  dive: 2.2,
  swim: 8.0,
  hit: 1.2,
};

const ONCE_CLIPS = new Set(['PunchL', 'PunchR', 'Kick', 'Kick2', 'JumpDown', 'HitBody', 'Dive', 'Flip']);

function wrapAngleDelta(diff) {
  return Math.atan2(Math.sin(diff), Math.cos(diff));
}

function findBoneBySuffix(rootObj, suffix) {
  let found = null;
  const target = suffix.toLowerCase();
  rootObj.traverse((obj) => {
    if (!found && obj.isBone && obj.name.toLowerCase().endsWith(target)) {
      found = obj;
    }
  });
  return found;
}

/**
 * Loads the rigged Bangladeshi character GLB (Mixamo skeleton + 30 NLA mocap clips)
 * and drives locomotion, parkour (Climb, Fall, JumpDown, Flip, Dive, Swim),
 * 4-move combat, lifestyle emotes, and crisp 4K PBR rendering across all quality tiers.
 */
export function createPlayerCharacter(scene, manager, options = {}) {
  const modelUrl = options.modelUrl || MODEL_URL;
  const root = new THREE.Group();
  root.name = options.id ? `PlayerCharacter_${options.id}` : 'PlayerCharacter';
  scene.add(root);

  const modelHolder = new THREE.Group();
  modelHolder.name = 'PlayerModelHolder';
  root.add(modelHolder);

  // Soft underfoot contact shadow disc for instant grounding even on Low · Smooth HD
  const cCanvas = document.createElement('canvas');
  cCanvas.width = cCanvas.height = 64;
  const cCtx = cCanvas.getContext('2d');
  const cGrad = cCtx.createRadialGradient(32, 32, 4, 32, 32, 30);
  cGrad.addColorStop(0, 'rgba(6, 10, 12, 0.56)');
  cGrad.addColorStop(0.55, 'rgba(6, 10, 12, 0.28)');
  cGrad.addColorStop(1, 'rgba(6, 10, 12, 0)');
  cCtx.fillStyle = cGrad;
  cCtx.fillRect(0, 0, 64, 64);
  const cTex = new THREE.CanvasTexture(cCanvas);
  const contactShadowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.95),
    new THREE.MeshBasicMaterial({ map: cTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }),
  );
  contactShadowMesh.rotation.x = -Math.PI / 2;
  contactShadowMesh.position.y = 0.018;
  contactShadowMesh.visible = false;
  root.add(contactShadowMesh);

  const state = {
    loaded: false,
    cameraMode: 'back',
    thirdPerson: true,
    studioAnim: 'idle',
    straightGaze: true,
    expression: 'normal',
    talking: false,
    micActive: false,
    voicePlaying: false,
    voiceExpression: null,
    sacredSilence: false,
    speechLevel: 0,
    attackTimer: 0,
    attackType: 0,
    emote: null,
    emoteTimer: 0,
    emoteClock: 0,
    walkCycle: 0,
    facingYaw: Math.PI,
    activeClip: 'Idle',
  };

  let mixer = null;
  let activeClipName = null;
  let activeAction = null;
  let currentQuality = 'high';
  let blinkClock = 0.8;
  let idleStillClock = 0;
  let idleFootDownBlend = 0;
  let reverseWalkBlend = 0;
  let reverseWalkPhase = 0;
  let baseGroundY = 0.005;
  let calibratedFootToSole = 0.095;
  const _footCheckL = new THREE.Vector3();
  const _footCheckR = new THREE.Vector3();
  let headBone = null;
  let neckBone = null;
  let jawBone = null;
  let lLidTop = null;
  let rLidTop = null;
  let hipsBone = null;
  let spineBone = null;
  let spine1Bone = null;
  let spine2Bone = null;
  let leftUpLeg = null;
  let leftLeg = null;
  let leftFoot = null;
  let rightUpLeg = null;
  let rightLeg = null;
  let rightFoot = null;
  let leftArm = null;
  let leftForeArm = null;
  let leftHand = null;
  let rightArm = null;
  let rightForeArm = null;
  let rightHand = null;
  let handheldPhoneMesh = null;
  let phonePalmFrame = null;
  let phoneActive = false;
  let phoneDrawBlend = 0; // 0 = stowed in pocket, 1 = held in front of chest (fast GTA V draw/stow!)
  let phoneScrollClock = 0;
  let phoneTapTimer = 0;
  const phonePocketPos = new THREE.Vector3();
  const phoneHoldTarget = new THREE.Vector3();
  const phoneCurrTarget = new THREE.Vector3();
  const phoneRestWristPos = new THREE.Vector3();
  const phoneGripFingersR = [];
  let rightThumb1 = null;
  let rightThumb2 = null;
  let rightThumb3 = null;
  const restRightThumb1Q = new THREE.Quaternion();
  const restRightThumb2Q = new THREE.Quaternion();
  const restRightThumb3Q = new THREE.Quaternion();
  const phoneEnvMaterials = [];
  const jawRestQ = new THREE.Quaternion();
  const lLidRestQ = new THREE.Quaternion();
  const rLidRestQ = new THREE.Quaternion();
  const restHipsQ = new THREE.Quaternion();
  const restHipsPos = new THREE.Vector3();
  const _hipsParentQuat = new THREE.Quaternion();
  const restHipsUpLocal = new THREE.Vector3(0, 1, 0);
  const _hipsDelta = new THREE.Vector3();
  const restSpineQ = new THREE.Quaternion();
  const restSpine1Q = new THREE.Quaternion();
  const restSpine2Q = new THREE.Quaternion();
  const restNeckQ = new THREE.Quaternion();
  const restHeadQ = new THREE.Quaternion();
  const restLeftUpLegQ = new THREE.Quaternion();
  const restLeftLegQ = new THREE.Quaternion();
  const restLeftFootQ = new THREE.Quaternion();
  const restRightUpLegQ = new THREE.Quaternion();
  const restRightLegQ = new THREE.Quaternion();
  const restRightFootQ = new THREE.Quaternion();
  const restLeftArmQ = new THREE.Quaternion();
  const restLeftForeArmQ = new THREE.Quaternion();
  const restLeftHandQ = new THREE.Quaternion();
  const restRightArmQ = new THREE.Quaternion();
  const restRightForeArmQ = new THREE.Quaternion();
  const restRightHandQ = new THREE.Quaternion();
  const fingerGripEntries = [];
  const leftHandLocalBasisInv = new THREE.Matrix4();
  const rightHandLocalBasisInv = new THREE.Matrix4();
  let hasLeftHandBasis = false;
  let hasRightHandBasis = false;

  const actions = {};
  const meshEntries = [];
  const morphMeshes = [];

  // Full 52-ARKit Morph Target smoothing & co-articulated speech / Web Audio Formant Lip-Sync state
  const morphCur = Object.fromEntries(ARKIT_MORPH_KEYS.map((k) => [k, 0]));
  let talkClock = 0;
  let gazeClock = 0;
  let headNodPhase = 0;
  let headPitchSmooth = 0;
  let headYawSmooth = 0;
  let headRollSmooth = 0;
  let prevAudioEnergy = 0;
  let nextBlinkTime = 2.6;
  let blinkElapsed = 0;
  let audioCtx = null;
  let audioAnalyser = null;
  let audioFreqData = null;
  let micStream = null;
  let externalAudioSource = null;

  function ensureAudioAnalyser() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    if (!audioAnalyser) {
      audioAnalyser = audioCtx.createAnalyser();
      audioAnalyser.fftSize = 256;
      audioAnalyser.smoothingTimeConstant = 0.55;
      audioFreqData = new Uint8Array(audioAnalyser.frequencyBinCount);
    }
    return audioAnalyser;
  }

  async function startMicLipSync() {
    if (state.micActive) return true;
    if (!navigator.mediaDevices?.getUserMedia) return false;
    try {
      const analyser = ensureAudioAnalyser();
      if (!analyser) return false;
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const micSource = audioCtx.createMediaStreamSource(micStream);
      micSource.connect(analyser);
      state.micActive = true;
      state.talking = false;
      return true;
    } catch {
      state.micActive = false;
      return false;
    }
  }

  function stopMicLipSync() {
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
      micStream = null;
    }
    state.micActive = false;
    state.speechLevel = 0;
  }

  async function toggleMicLipSync() {
    if (state.micActive) {
      stopMicLipSync();
      return false;
    }
    return await startMicLipSync();
  }

  function connectAudioElement(audioEl) {
    const analyser = ensureAudioAnalyser();
    if (!analyser || !audioEl) return false;
    try {
      externalAudioSource = audioCtx.createMediaElementSource(audioEl);
      externalAudioSource.connect(analyser);
      analyser.connect(audioCtx.destination);
      return true;
    } catch {
      return false;
    }
  }

  let voiceAudioEl = null;
  let voiceSourceNode = null;
  let voiceOnEndCb = null;
  let voicePlayToken = 0;
  const decodedBufferCache = new Map();
  const missingVoiceUrls = new Set();
  let fightVoiceCooldownUntil = 0;
  let fightVoiceIdx = 0;

  // Unlock AudioContext synchronously on first user click/key so Web Audio voices NEVER get blocked!
  function unlockVoiceAudio() {
    ensureAudioAnalyser();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  }
  window.addEventListener('pointerdown', unlockVoiceAudio, { capture: true, passive: true });
  window.addEventListener('keydown', unlockVoiceAudio, { capture: true, passive: true });

  function finishVoicePlayback(token) {
    if (token !== voicePlayToken) return;
    voiceSourceNode = null;
    state.voicePlaying = false;
    state.voiceExpression = null;
    state.speechLevel = 0;
    VOICE_BUS.release(options.id, stopVoiceClip);
    const cb = voiceOnEndCb;
    voiceOnEndCb = null;
    cb?.();
  }

  function stopVoiceClip() {
    voicePlayToken++;
    if (voiceSourceNode) {
      try {
        voiceSourceNode.onended = null;
        voiceSourceNode.stop();
        voiceSourceNode.disconnect();
      } catch {}
      voiceSourceNode = null;
    }
    if (voiceAudioEl) {
      try {
        voiceAudioEl.onended = null;
        voiceAudioEl.pause();
        voiceAudioEl.currentTime = 0;
      } catch {}
    }
    state.voicePlaying = false;
    state.voiceExpression = null;
    state.speechLevel = 0;
    voiceOnEndCb = null;
    VOICE_BUS.release(options.id, stopVoiceClip, 80);
  }

  async function loadDecodedAudioBuffer(url) {
    if (decodedBufferCache.has(url)) return decodedBufferCache.get(url);
    const res = await fetch(url);
    if (!res.ok) {
      missingVoiceUrls.add(url);
      throw new Error(`HTTP ${res.status}`);
    }
    const arrBuf = await res.arrayBuffer();
    const decoded = await audioCtx.decodeAudioData(arrBuf.slice(0));
    decodedBufferCache.set(url, decoded);
    return decoded;
  }

  async function playVoiceClip(urls, { expression = null, volume = 1.0, onEnd = null, interruptSelf = false } = {}) {
    if (state.sacredSilence) {
      onEnd?.();
      return false;
    }
    if (!VOICE_BUS.canSpeak(options.id, { interruptSelf })) {
      onEnd?.();
      return false;
    }
    const candidates = (Array.isArray(urls) ? urls : [urls]).filter((u) => u && !missingVoiceUrls.has(u));
    if (!candidates.length) {
      onEnd?.();
      return false;
    }
    stopVoiceClip();
    if (!VOICE_BUS.claim(options.id, stopVoiceClip)) {
      onEnd?.();
      return false;
    }
    const token = ++voicePlayToken;
    voiceOnEndCb = onEnd || null;
    const clampedVol = THREE.MathUtils.clamp(volume, 0, 1);

    const analyser = ensureAudioAnalyser();
    if (audioCtx && audioCtx.state === 'suspended') {
      try { await audioCtx.resume(); } catch {}
    }

    // Primary path: Web Audio API AudioBufferSourceNode ONLY when AudioContext is actually running!
    // (Prevents silent playback if AudioContext stayed suspended outside a direct user gesture.)
    if (audioCtx && analyser && audioCtx.state === 'running') {
      for (const url of candidates) {
        if (token !== voicePlayToken) return false;
        try {
          const resolvedUrl = new URL(url, window.location.href).href;
          const buffer = await loadDecodedAudioBuffer(resolvedUrl);
          if (token !== voicePlayToken) return false;
          if (audioCtx.state !== 'running') {
            try { await audioCtx.resume(); } catch {}
          }
          if (audioCtx.state !== 'running') break;
          const src = audioCtx.createBufferSource();
          src.buffer = buffer;
          const gainNode = audioCtx.createGain();
          gainNode.gain.value = clampedVol;
          src.connect(gainNode);
          gainNode.connect(analyser);
          analyser.connect(audioCtx.destination);
          voiceSourceNode = src;
          state.voicePlaying = true;
          state.voiceExpression = expression || null;
          src.onended = () => finishVoicePlayback(token);
          src.start(0);
          return true;
        } catch {}
      }
    }

    // Reliable fallback path: direct HTML5 Audio element (never muted by suspended AudioContext!)
    for (const url of candidates) {
      if (token !== voicePlayToken) return false;
      try {
        const resolvedUrl = new URL(url, window.location.href).href;
        if (!voiceAudioEl) {
          voiceAudioEl = new Audio();
          voiceAudioEl.preload = 'auto';
        }
        voiceAudioEl.volume = clampedVol;
        voiceAudioEl.src = resolvedUrl;
        voiceAudioEl.currentTime = 0;
        voiceAudioEl.onended = () => finishVoicePlayback(token);
        voiceAudioEl.onerror = () => finishVoicePlayback(token);
        state.voicePlaying = true;
        state.voiceExpression = expression || null;
        await voiceAudioEl.play();
        return true;
      } catch {
        state.voicePlaying = false;
        state.voiceExpression = null;
      }
    }

    finishVoicePlayback(token);
    return false;
  }

  function playCombatVoice({ force = false } = {}) {
    if (state.sacredSilence) return false;
    const now = performance.now();
    if (!force && now < fightVoiceCooldownUntil) return false;
    if (!VOICE_BUS.canSpeak(options.id, { interruptSelf: false })) return false;
    const isSabit = options.id !== 'kurta_blue';
    const pool = isSabit
      ? (VOICE_CLIPS.sabitPanicFight || [])
      : (VOICE_CLIPS.huzzatullahFight || []);
    if (!pool.length) return false;
    const urls = pool[fightVoiceIdx++ % pool.length];
    const expr = isSabit ? 'surprised' : 'angry';
    fightVoiceCooldownUntil = now + 4500;
    setExpression(expr);
    playVoiceClip(urls, {
      expression: expr,
      volume: 1.0,
      onEnd: () => {
        if (state.expression === expr) setExpression('normal');
      },
    });
    return true;
  }

  function isVoicePlaying() {
    return Boolean(state.voicePlaying);
  }

  function setTalking(enabled) {
    if (enabled && state.sacredSilence) return false;
    state.talking = Boolean(enabled);
    if (state.talking && state.micActive) stopMicLipSync();
    return state.talking;
  }

  function toggleTalking() {
    if (state.sacredSilence) return false;
    return setTalking(!state.talking);
  }

  function setSacredSilence(enabled) {
    const next = Boolean(enabled);
    state.sacredSilence = next;
    if (next) {
      if (state.voicePlaying) stopVoiceClip();
      if (state.talking) state.talking = false;
      if (state.attackTimer > 0) state.attackTimer = 0;
      if (state.emote === 'kick' || state.emote === 'kick2' || state.emote === 'combo' || state.emote === 'angry1' || state.emote === 'angry2') {
        state.emote = null;
        state.emoteTimer = 0;
      }
      if (state.expression === 'angry') state.expression = 'normal';
    }
    return state.sacredSilence;
  }



  function setMorphWeights(targets, dt) {
    if (!morphMeshes.length) return;
    for (const key of ARKIT_MORPH_KEYS) {
      const tgt = THREE.MathUtils.clamp(targets[key] || 0, 0, 1);
      let atk = 22.0;
      let rel = 15.0;
      if (key.startsWith('eyeBlink') || key.startsWith('mouthPress') || key === 'mouthClose' || key.startsWith('mouthRoll')) {
        atk = 28.0;
        rel = 18.0;
      } else if (key.startsWith('brow') || key.startsWith('cheek') || key.startsWith('eyeSquint') || key.startsWith('mouthSmile')) {
        atk = 9.0;
        rel = 7.0;
      } else if (key.startsWith('eyeLook')) {
        atk = 14.0;
        rel = 10.0;
      }
      const speed = tgt > morphCur[key] ? atk : rel;
      morphCur[key] += (tgt - morphCur[key]) * Math.min(1, dt * speed);
    }
    for (const mesh of morphMeshes) {
      const dict = mesh.morphTargetDictionary;
      const infl = mesh.morphTargetInfluences;
      if (!dict || !infl) continue;
      for (const key of ARKIT_MORPH_KEYS) {
        const idx = dict[key];
        if (idx !== undefined) {
          infl[idx] = morphCur[key];
        }
      }
    }
  }

  const qTempA = new THREE.Quaternion();
  const qTempB = new THREE.Quaternion();
  const eulerTemp = new THREE.Euler(0, 0, 0, 'XYZ');

  let pendingEnvMap = null;
  function applyMeshQuality(quality) {
    currentQuality = quality || 'high';
    // NEVER compromise character detailing, PBR textures, normal maps, or material quality on ANY tier!
    const cast = currentQuality !== 'low';
    contactShadowMesh.visible = !cast;
    for (const entry of meshEntries) {
      entry.mesh.castShadow = !entry.skipShadowCast;
      entry.mesh.receiveShadow = true;
      entry.mesh.material = entry.pbrMat;
    }
  }
  function setEnvironmentMap(envTex) {
    pendingEnvMap = envTex || null;
    for (const entry of meshEntries) {
      const m = entry.pbrMat;
      if (m && 'envMap' in m && m.envMap !== pendingEnvMap) {
        m.envMap = pendingEnvMap;
        m.needsUpdate = true;
      }
    }
    for (let i = 0; i < phoneEnvMaterials.length; i++) {
      const m = phoneEnvMaterials[i];
      if (m && 'envMap' in m && m.envMap !== pendingEnvMap) {
        m.envMap = pendingEnvMap;
        m.needsUpdate = true;
      }
    }
  }

  function resolveClipAction(clipName) {
    if (actions[clipName]) return actions[clipName];
    const fb = CLIP_FALLBACKS[clipName];
    if (fb && actions[fb]) return actions[fb];
    return actions.Idle || null;
  }

  function playClip(clipName, { fade = 0.16, loopOnce = false, timeScale = 1.0, restart = false } = {}) {
    const action = resolveClipAction(clipName);
    if (!action) return;

    action.timeScale = timeScale;
    action.setLoop(loopOnce ? THREE.LoopOnce : THREE.LoopRepeat, loopOnce ? 1 : Infinity);
    action.clampWhenFinished = loopOnce;

    if (activeAction === action && !restart) {
      return;
    }

    action.enabled = true;
    if (restart || activeAction !== action) {
      action.reset();
    }
    action.play();
    if (activeAction && activeAction !== action) {
      activeAction.crossFadeTo(action, fade, true);
    }
    activeAction = action;
    activeClipName = clipName;
    state.activeClip = clipName;
  }

  const dracoLoader = new DRACOLoader(manager);
  dracoLoader.setDecoderPath(DRACO_PATH);
  const loader = new GLTFLoader(manager);
  loader.setDRACOLoader(dracoLoader);

  loader.load(modelUrl, (gltf) => {
    const model = gltf.scene;
    model.name = 'BangladeshiPlayerRig';
    modelHolder.add(model);

    model.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.frustumCulled = false;
      const srcMat = obj.material;
      const matName = (srcMat?.name || obj.name || '').toLowerCase();
      const isHair = matName.includes('hair') || matName.includes('short');
      const isEyelash = matName.includes('eyelash') || matName.includes('lash');
      const isFacialHair = matName.includes('brow');
      const isAlphaDetail = isHair || isFacialHair;
      const isEyeBall = matName.includes('eyeball') || (!isFacialHair && matName.includes('low-poly'));

      const isInnerMouth = matName.includes('innermouth');
      const isTeeth = matName.includes('teeth');
      const isTongue = matName.includes('tongue');

      srcMat.transparent = false;
      srcMat.depthWrite = true;
      srcMat.alphaTest = isHair ? 0.34 : isFacialHair ? 0.20 : 0;
      // DoubleSide keeps open-hem panjabi & lashes solid; keep eyeballs & oral teeth FrontSide for crisp studio shading
      srcMat.side = (isTeeth || isTongue || isEyeBall) ? THREE.FrontSide : THREE.DoubleSide;
      if (options.id === 'kurta_blue' && 'metalness' in srcMat) {
        srcMat.metalness = 0.0;
      }
      obj.userData._isCharacterMesh = true;
      if (srcMat.map) {
        srcMat.map.anisotropy = 8;
        srcMat.map.minFilter = THREE.LinearMipmapLinearFilter;
        srcMat.map.magFilter = THREE.LinearFilter;
        srcMat.map.needsUpdate = true;
      }
      if (srcMat.normalMap) {
        srcMat.normalMap.anisotropy = 8;
        srcMat.normalMap.needsUpdate = true;
      }
      if (srcMat.roughnessMap) {
        srcMat.roughnessMap.anisotropy = 8;
        srcMat.roughnessMap.needsUpdate = true;
      }
      if ((isAlphaDetail || isEyeBall || isInnerMouth || isTeeth || isTongue) && 'envMapIntensity' in srcMat) {
        srcMat.envMapIntensity = isInnerMouth ? 0.16 : isTongue ? 0.24 : isTeeth ? 0.32 : isEyeBall ? 0.85 : 0.55;
      }
      if (isEyeBall && typeof srcMat.roughness === 'number') {
        srcMat.roughness = 0.14;
      }
      if ((isTeeth || isTongue) && typeof srcMat.roughness === 'number') {
        srcMat.roughness = isTeeth ? 0.34 : 0.42;
      }
      if ('normalScale' in srcMat && srcMat.normalScale) {
        srcMat.normalScale.set(0.75, 0.75);
      }

      if (obj.morphTargetDictionary && obj.morphTargetInfluences) {
        morphMeshes.push(obj);
      }

      meshEntries.push({
        mesh: obj,
        skipShadowCast: isFacialHair || isEyelash || isEyeBall || isInnerMouth || isTeeth || isTongue,
        pbrMat: srcMat,
      });
    });

    headBone = findBoneBySuffix(model, 'Head');
    neckBone = findBoneBySuffix(model, 'Neck');
    jawBone = findBoneBySuffix(model, 'Jaw');
    lLidTop = findBoneBySuffix(model, 'LeftOrbicularisTop');
    rLidTop = findBoneBySuffix(model, 'RightOrbicularisTop');
    hipsBone = findBoneBySuffix(model, 'Hips');
    spineBone = findBoneBySuffix(model, 'Spine');
    spine1Bone = findBoneBySuffix(model, 'Spine1');
    spine2Bone = findBoneBySuffix(model, 'Spine2');
    leftUpLeg = findBoneBySuffix(model, 'LeftUpLeg');
    leftLeg = findBoneBySuffix(model, 'LeftLeg');
    leftFoot = findBoneBySuffix(model, 'LeftFoot');
    rightUpLeg = findBoneBySuffix(model, 'RightUpLeg');
    rightLeg = findBoneBySuffix(model, 'RightLeg');
    rightFoot = findBoneBySuffix(model, 'RightFoot');
    leftArm = findBoneBySuffix(model, 'LeftArm');
    leftForeArm = findBoneBySuffix(model, 'LeftForeArm');
    leftHand = findBoneBySuffix(model, 'LeftHand');
    rightArm = findBoneBySuffix(model, 'RightArm');
    rightForeArm = findBoneBySuffix(model, 'RightForeArm');
    rightHand = findBoneBySuffix(model, 'RightHand');
    if (rightHand) {
      // Calibrated anatomical palm frame (rotated to exact RightHand local basis once knuckle bones are read below!)
      // Inside phonePalmFrame: +X = pinky side, +Y = wrist->fingertips, -Z = palm normal (toward eyes), +Z = back of hand
      phonePalmFrame = new THREE.Group();
      phonePalmFrame.name = 'RightPalmCalibratedFrame';
      rightHand.add(phonePalmFrame);

      const phoneGroup = new THREE.Group();
      phoneGroup.name = 'HandheldSmartphoneProp';
      // Seated cleanly INSIDE the cupped fold of the right palm (Z = -0.029 puts rear Burgundy back at -0.021 inside inner palm skin,
      // ZERO clipping through back of hand, and glowing OLED screen at -0.033 right under the right thumb!)
      phoneGroup.position.set(0.012, 0.022, -0.029);
      phoneGroup.visible = false;
      phonePalmFrame.add(phoneGroup);
      handheldPhoneMesh = phoneGroup;

      // Load real Burgundy iPhone 18 Pro Max 3D GLB model into the calibrated, scale-normalized right palm frame!
      loadSharedBurgundyIPhone().then((srcModel) => {
        if (!srcModel || !handheldPhoneMesh) return;
        const phoneClone = srcModel.clone(true);
        // Exact true-to-life iPhone 18 Pro Max smartphone size (~13.7cm tall x 6.6cm wide — NOT tiny, NOT a tablet!)
        // (phonePalmFrame compensates for KurtaBlueArmature's 1.71x scale so Sabit & Huzzatullah get identical real-world size!)
        phoneClone.scale.setScalar(0.84);
        // Flip 180 deg around Y so OLED screen (+Z in GLB) faces -Z (out of palm toward character's eyes!)
        // and the deep glossy Burgundy triple-camera rear sits cleanly against the cradled fingers!
        phoneClone.rotation.set(0.0, Math.PI, -0.02);
        phoneClone.position.set(0, 0, 0);
        phoneClone.traverse((ch) => {
          if (!ch.isMesh || !ch.material) return;
          const mats = Array.isArray(ch.material) ? ch.material : [ch.material];
          for (let i = 0; i < mats.length; i++) {
            const m = mats[i];
            if (!m) continue;
            if ('envMap' in m) {
              phoneEnvMaterials.push(m);
              if (pendingEnvMap) {
                m.envMap = pendingEnvMap;
                m.needsUpdate = true;
              }
            }
          }
        });
        handheldPhoneMesh.add(phoneClone);
      });
    }
    if (jawBone) jawRestQ.copy(jawBone.quaternion);
    if (lLidTop) lLidRestQ.copy(lLidTop.quaternion);
    if (rLidTop) rLidRestQ.copy(rLidTop.quaternion);

    mixer = new THREE.AnimationMixer(model);
    for (const clip of gltf.animations) {
      actions[clip.name] = mixer.clipAction(clip);
    }

    playClip('Idle', { fade: 0.01 });
    mixer.update(0);

    // Snapshot exact clean straight-ahead Idle rest quaternions & upright armature up-axis so IK, head lock & root-motion stripping NEVER drift or sink into the ground!
    if (hipsBone) {
      restHipsQ.copy(hipsBone.quaternion);
      restHipsPos.copy(hipsBone.position);
      if (hipsBone.parent) {
        root.updateMatrixWorld(true);
        hipsBone.parent.getWorldQuaternion(_hipsParentQuat).invert();
        restHipsUpLocal.set(0, 1, 0).applyQuaternion(_hipsParentQuat).normalize();
      }
    }
    if (spineBone) restSpineQ.copy(spineBone.quaternion);
    if (spine1Bone) restSpine1Q.copy(spine1Bone.quaternion);
    if (spine2Bone) restSpine2Q.copy(spine2Bone.quaternion);
    if (neckBone) restNeckQ.copy(neckBone.quaternion);
    if (headBone) restHeadQ.copy(headBone.quaternion);
    if (leftUpLeg) restLeftUpLegQ.copy(leftUpLeg.quaternion);
    if (leftLeg) restLeftLegQ.copy(leftLeg.quaternion);
    if (leftFoot) restLeftFootQ.copy(leftFoot.quaternion);
    if (rightUpLeg) restRightUpLegQ.copy(rightUpLeg.quaternion);
    if (rightLeg) restRightLegQ.copy(rightLeg.quaternion);
    if (rightFoot) restRightFootQ.copy(rightFoot.quaternion);
    if (leftArm) restLeftArmQ.copy(leftArm.quaternion);
    if (leftForeArm) restLeftForeArmQ.copy(leftForeArm.quaternion);
    if (leftHand) restLeftHandQ.copy(leftHand.quaternion);
    if (rightArm) restRightArmQ.copy(rightArm.quaternion);
    if (rightForeArm) restRightForeArmQ.copy(rightForeArm.quaternion);
    if (rightHand) restRightHandQ.copy(rightHand.quaternion);

    // Snapshot all finger bones so hands wrap & clench tightly around motorcycle/bicycle/rickshaw handlebar grips + phone cradling!
    fingerGripEntries.length = 0;
    phoneGripFingersR.length = 0;
    const fingerNames = ['Index', 'Middle', 'Ring', 'Pinky'];
    for (const side of ['Left', 'Right']) {
      const sign = side === 'Left' ? -1 : 1;
      for (const fName of fingerNames) {
        for (let seg = 1; seg <= 3; seg++) {
          const b = findBoneBySuffix(model, `${side}Hand${fName}${seg}`);
          if (b) {
            const curl = seg === 1 ? 1.02 : (seg === 2 ? 1.28 : 0.88);
            fingerGripEntries.push({ bone: b, restQ: b.quaternion.clone(), axis: 'x', angle: sign * curl });
            if (side === 'Right') {
              // Mixamo Idle fingers are already pre-curved into the palm (-Z = -0.047m);
              // slightly open seg 1 (-0.28) so fingers cradle cleanly BEHIND the Burgundy rear glass,
              // and gently hook seg 2/3 around the left edge so ZERO fingers clip through the phone or screen!
              const pCurl = fName === 'Pinky'
                ? (seg === 1 ? -0.14 : (seg === 2 ? 0.14 : 0.18))
                : (seg === 1 ? -0.28 : (seg === 2 ? 0.08 : 0.16));
              phoneGripFingersR.push({ bone: b, restQ: b.quaternion.clone(), angle: pCurl });
            }
          }
        }
      }
      const th1 = findBoneBySuffix(model, `${side}HandThumb1`);
      const th2 = findBoneBySuffix(model, `${side}HandThumb2`);
      const th3 = findBoneBySuffix(model, `${side}HandThumb3`);
      if (th1) fingerGripEntries.push({ bone: th1, restQ: th1.quaternion.clone(), axis: 'z', angle: sign * 0.42 });
      if (th2) fingerGripEntries.push({ bone: th2, restQ: th2.quaternion.clone(), axis: 'x', angle: sign * 0.62 });
      if (th3) fingerGripEntries.push({ bone: th3, restQ: th3.quaternion.clone(), axis: 'x', angle: sign * 0.68 });
      if (side === 'Right') {
        rightThumb1 = th1;
        rightThumb2 = th2;
        rightThumb3 = th3;
        if (th1) restRightThumb1Q.copy(th1.quaternion);
        if (th2) restRightThumb2Q.copy(th2.quaternion);
        if (th3) restRightThumb3Q.copy(th3.quaternion);
      }

      // Measure exact orthonormal anatomical local basis of LeftHand & RightHand from child knuckle bones
      // (eliminates Mixamo RightHand ~52 deg axial twist so BOTH hands sit 100% flat & symmetric on handlebar grips & iPhone!)
      const idx1 = findBoneBySuffix(model, `${side}HandIndex1`);
      const mid1 = findBoneBySuffix(model, `${side}HandMiddle1`);
      const pky1 = findBoneBySuffix(model, `${side}HandPinky1`);
      if (idx1 && mid1 && pky1) {
        const lFwd = mid1.position.clone().normalize();
        const lThumb = new THREE.Vector3().subVectors(idx1.position, pky1.position);
        lThumb.addScaledVector(lFwd, -lThumb.dot(lFwd)).normalize();
        const lX = side === 'Left' ? lThumb.clone() : lThumb.clone().negate();
        const lBack = new THREE.Vector3().crossVectors(lX, lFwd).normalize();
        lX.crossVectors(lFwd, lBack).normalize();
        const basisM = new THREE.Matrix4().makeBasis(lX, lFwd, lBack);
        if (side === 'Left') {
          leftHandLocalBasisInv.copy(basisM).transpose();
          hasLeftHandBasis = true;
        } else {
          rightHandLocalBasisInv.copy(basisM).transpose();
          hasRightHandBasis = true;
          if (phonePalmFrame && rightHand) {
            root.updateMatrixWorld(true);
            const handWorldScale = new THREE.Vector3();
            rightHand.getWorldScale(handWorldScale);
            const invS = 1 / Math.max(0.2, handWorldScale.y || 1);
            phonePalmFrame.quaternion.setFromRotationMatrix(basisM);
            phonePalmFrame.scale.setScalar(invS);
          }
        }
      }
    }

    // Measure TRUE skinned shoe-sole lowest Y in live Idle pose (Box3.setFromObject ignores bone skinning!)
    root.updateMatrixWorld(true);
    const invHolder = new THREE.Matrix4().copy(modelHolder.matrixWorld).invert();
    const skinnedVert = new THREE.Vector3();
    let trueMinY = Infinity;
    model.traverse((obj) => {
      if (!obj.isMesh || !obj.geometry?.attributes?.position) return;
      const posAttr = obj.geometry.attributes.position;
      const step = posAttr.count > 6000 ? 3 : 1;
      if (obj.isSkinnedMesh && typeof obj.getVertexPosition === 'function') {
        for (let i = 0; i < posAttr.count; i += step) {
          obj.getVertexPosition(i, skinnedVert);
          skinnedVert.applyMatrix4(obj.matrixWorld).applyMatrix4(invHolder);
          if (skinnedVert.y < trueMinY) trueMinY = skinnedVert.y;
        }
      } else {
        for (let i = 0; i < posAttr.count; i += step) {
          skinnedVert.fromBufferAttribute(posAttr, i).applyMatrix4(obj.matrixWorld).applyMatrix4(invHolder);
          if (skinnedVert.y < trueMinY) trueMinY = skinnedVert.y;
        }
      }
    });
    const ROAD_FLUSH_CLEARANCE = 0.005; // Keeps shoe soles flush ON TOP of +0.002..+0.0035m road asphalt (zero sinking, zero floating!)
    if (Number.isFinite(trueMinY) && Math.abs(trueMinY) < 0.45) {
      baseGroundY = -trueMinY + ROAD_FLUSH_CLEARANCE;
      modelHolder.position.y = baseGroundY;
    } else {
      const box = new THREE.Box3().setFromObject(model);
      if (Number.isFinite(box.min.y) && Math.abs(box.min.y) < 0.25) {
        baseGroundY = -box.min.y + ROAD_FLUSH_CLEARANCE;
        modelHolder.position.y = baseGroundY;
      }
    }
    // Calibrate exact ankle-bone-to-sole vertical height in Idle so live Walk/Run/IdleLook animations NEVER dip soles into asphalt!
    root.updateMatrixWorld(true);
    if (leftFoot && rightFoot) {
      leftFoot.getWorldPosition(_footCheckL);
      rightFoot.getWorldPosition(_footCheckR);
      const minFootRelY = Math.min(_footCheckL.y, _footCheckR.y) - root.position.y;
      if (Number.isFinite(minFootRelY) && minFootRelY > 0.02 && minFootRelY < 0.28) {
        calibratedFootToSole = Math.max(0.02, minFootRelY - ROAD_FLUSH_CLEARANCE);
      }
    }

    applyMeshQuality(currentQuality);
    if (pendingEnvMap) setEnvironmentMap(pendingEnvMap);
    state.loaded = true;
  });

  function setQualityMode(nextQuality) {
    applyMeshQuality(nextQuality);
  }

  function cycleCameraMode() {
    const order = ['back', 'front', 'first'];
    const idx = order.indexOf(state.cameraMode);
    const next = order[(idx + 1) % order.length];
    state.cameraMode = next;
    state.thirdPerson = next !== 'first';
    return next;
  }

  function triggerAttack(kind = null) {
    if (state.sacredSilence) return null;
    const nextKind = kind !== null ? kind : state.attackType % 4;
    state.attackType = (nextKind + 1) % 4;
    state.attackTimer = nextKind >= 2 ? 0.68 : 0.46;
    state.emote = null;
    if (mixer) {
      const clipName = nextKind === 3 ? 'Kick2' : nextKind === 2 ? 'Kick' : nextKind === 1 ? 'PunchR' : 'PunchL';
      playClip(clipName, { fade: 0.08, loopOnce: true, restart: true });
    }
    // Fight voices are NOT played blindly in empty air — they trigger strictly in synced
    // back-and-forth turns via autonomous-partner.js when Sabit & Huzzatullah fight nearby!
    return nextKind;
  }

  function triggerEmote(emoteName, cameraYaw = null) {
    if (state.sacredSilence && (emoteName === 'kick' || emoteName === 'kick2' || emoteName === 'combo' || emoteName === 'angry1' || emoteName === 'angry2')) {
      return null;
    }
    if (state.emote === emoteName) {
      state.emote = null;
      state.emoteTimer = 0;
      return null;
    }
    state.emote = emoteName;
    state.emoteClock = 0;
    state.attackTimer = 0;
    state.emoteTimer = EMOTE_DURATIONS[emoteName] || 4.0;
    if (cameraYaw !== null && state.cameraMode === 'back') {
      state.facingYaw = cameraYaw;
    }
    if (mixer && EMOTE_CLIP_MAP[emoteName]) {
      const clipName = EMOTE_CLIP_MAP[emoteName];
      const oneShot = ONCE_CLIPS.has(clipName) && emoteName !== 'combo';
      playClip(clipName, { fade: 0.14, loopOnce: oneShot, restart: true });
    }
    const isFightMove = emoteName === 'kick' || emoteName === 'kick2' || emoteName === 'combo' || emoteName === 'angry1' || emoteName === 'angry2';
    if (!isFightMove) {
      const emoteVoices = VOICE_CLIPS.emotes?.[emoteName];
      if (emoteVoices?.length && !state.voicePlaying && !VOICE_BUS.isAnySpeaking()) {
        const expr = emoteName === 'laugh' || emoteName === 'wave' ? 'happy' : 'normal';
        playVoiceClip(emoteVoices, { expression: expr, volume: 0.90 });
      }
    }
    return state.emote;
  }

  function setExpression(nextExpr) {
    state.expression = nextExpr || 'normal';
    return state.expression;
  }

  function applyProceduralHeadAndFace(dt, lockHeadStraight = false) {
    // 1. Natural involuntary eye blink every 3.0 - 5.4s (crisp close, soft open, tiny micro-asymmetry)
    blinkElapsed += dt;
    let blinkAmt = 0;
    const blinkDur = 0.18;
    if (blinkElapsed >= nextBlinkTime) {
      const p = (blinkElapsed - nextBlinkTime) / blinkDur;
      if (p >= 1.0) {
        blinkElapsed = 0;
        nextBlinkTime = 2.9 + ((Math.sin(blinkClock * 7.13) * 0.5 + 0.5) * 2.5);
      } else {
        blinkAmt = p < 0.36 ? (p / 0.36) : (1.0 - (p - 0.36) / 0.64);
        blinkAmt = blinkAmt * blinkAmt * (3 - 2 * blinkAmt);
      }
    }
    blinkClock += dt;

    // 2. Real-time Full 52-ARKit Facial Performance (synced across AvatarHead, AvatarEyelashes & AvatarTeethLower!)
    const m = {
      eyeBlinkLeft: blinkAmt,
      eyeBlinkRight: blinkAmt,
    };

    // Subtle organic living eye micro-saccades so gaze never looks frozen like a mannequin
    gazeClock += dt;
    const lookX = Math.sin(gazeClock * 0.73) * Math.sin(gazeClock * 0.31) * 0.14;
    const lookY = Math.sin(gazeClock * 0.57 + 1.2) * 0.08;
    if (lookX > 0) {
      m.eyeLookOutLeft = lookX;
      m.eyeLookInRight = lookX;
    } else if (lookX < 0) {
      m.eyeLookInLeft = -lookX;
      m.eyeLookOutRight = -lookX;
    }
    if (lookY > 0) {
      m.eyeLookUpLeft = lookY;
      m.eyeLookUpRight = lookY;
    } else if (lookY < 0) {
      m.eyeLookDownLeft = -lookY;
      m.eyeLookDownRight = -lookY;
    }

    let speechStress = 0;

    // 4-Band Formant FFT Live Mic / ElevenLabs Voice Audio Lip-Sync -> Full Apple ARKit Visemes!
    let audioDriven = false;
    const hasLiveWebAudio = Boolean(state.micActive || voiceSourceNode || externalAudioSource);
    if (hasLiveWebAudio && audioAnalyser && audioFreqData) {
      audioAnalyser.getByteFrequencyData(audioFreqData);
      let bLow = 0, bMid1 = 0, bMid2 = 0, bHigh = 0;
      for (let i = 1; i < 6; i++) bLow += audioFreqData[i];       // ~170-900 Hz (O/U + fundamental)
      for (let i = 6; i < 14; i++) bMid1 += audioFreqData[i];     // ~1.0-2.2 kHz (AA/AH open vowel F1)
      for (let i = 14; i < 28; i++) bMid2 += audioFreqData[i];    // ~2.2-4.5 kHz (EE/EH front vowel F2)
      for (let i = 28; i < 58; i++) bHigh += audioFreqData[i];    // ~4.5-9.5 kHz (S/F/Sh/T fricatives)
      const low = bLow / (5 * 255);
      const mid1 = bMid1 / (8 * 255);
      const mid2 = bMid2 / (14 * 255);
      const high = bHigh / (30 * 255);
      const energy = low * 0.34 + mid1 * 0.38 + mid2 * 0.20 + high * 0.08;
      state.speechLevel = energy;

      if (energy > 0.022) {
        audioDriven = true;
        talkClock += dt;
        const norm = THREE.MathUtils.clamp((energy - 0.022) * 4.2, 0, 1);
        const syllableWave = 0.72 + 0.28 * Math.sin(talkClock * 17.5);
        const f1Open = THREE.MathUtils.clamp((mid1 * 0.78 + low * 0.48) * 2.4, 0, 1);
        const roundO = THREE.MathUtils.clamp((low - mid2 * 1.10) * 3.0, 0, 1);
        const wideE  = THREE.MathUtils.clamp((mid2 - low * 0.50) * 3.0, 0, 1);
        const fric   = THREE.MathUtils.clamp((high - low * 0.38) * 4.0, 0, 1);

        m.jawOpen = Math.min(0.95, norm * (0.48 + f1Open * 0.48) * syllableWave);
        const ld = Math.min(0.45, m.jawOpen * 0.62);
        const uu = Math.min(0.38, norm * 0.18 + wideE * 0.20 + fric * 0.18);
        m.mouthLowerDownLeft = ld;
        m.mouthLowerDownRight = ld;
        m.mouthUpperUpLeft = uu;
        m.mouthUpperUpRight = uu;
        m.mouthFunnel = roundO * norm * 0.78;
        m.mouthPucker = Math.max(0, roundO - 0.28) * norm * 0.76;
        m.mouthStretchLeft = wideE * norm * 0.64;
        m.mouthStretchRight = wideE * norm * 0.64;
        m.mouthRollLower = fric * norm * 0.75;
        m.mouthShrugLower = (roundO * 0.25 + fric * 0.22) * norm;
        m.mouthSmileLeft = 0.08 + wideE * norm * 0.24;
        m.mouthSmileRight = 0.06 + wideE * norm * 0.22;
        const activeVoiceExpr = state.voiceExpression || state.expression;
        if (activeVoiceExpr === 'angry') {
          m.jawOpen = Math.min(0.92, (m.jawOpen || 0) * 1.32);
          m.browDownLeft = 0.85;
          m.browDownRight = 0.85;
          m.noseSneerLeft = 0.45;
          m.noseSneerRight = 0.45;
          m.mouthFrownLeft = 0.40;
          m.mouthFrownRight = 0.40;
          m.eyeSquintLeft = 0.28;
          m.eyeSquintRight = 0.28;
          m.mouthSmileLeft = 0;
          m.mouthSmileRight = 0;
        } else if (activeVoiceExpr === 'happy') {
          m.jawOpen = Math.min(0.86, (m.jawOpen || 0) * 1.25);
          m.mouthSmileLeft = 0.82;
          m.mouthSmileRight = 0.80;
          m.cheekSquintLeft = 0.52;
          m.cheekSquintRight = 0.50;
          m.eyeSquintLeft = 0.30;
          m.eyeSquintRight = 0.28;
          m.browInnerUp = THREE.MathUtils.clamp(norm * 0.52, 0, 0.44);
        } else {
          m.browInnerUp = THREE.MathUtils.clamp((norm - 0.28) * 0.68, 0, 0.46);
          m.browOuterUpLeft = m.browInnerUp * 0.45;
          m.browOuterUpRight = m.browInnerUp * 0.45;
          m.cheekSquintLeft = norm * 0.16;
          m.cheekSquintRight = norm * 0.16;
        }
        speechStress = norm;
      } else if (state.micActive || voiceSourceNode) {
        audioDriven = true;
        if (prevAudioEnergy > 0.05) {
          m.mouthClose = 0.48;
          m.mouthPressLeft = 0.56;
          m.mouthPressRight = 0.56;
        }
        if ((state.voiceExpression || state.expression) === 'angry') {
          m.browDownLeft = 0.78;
          m.browDownRight = 0.78;
          m.noseSneerLeft = 0.34;
          m.noseSneerRight = 0.34;
          m.mouthFrownLeft = 0.32;
          m.mouthFrownRight = 0.32;
        } else if ((state.voiceExpression || state.expression) === 'happy') {
          m.mouthSmileLeft = 0.68;
          m.mouthSmileRight = 0.66;
        }
      }
      prevAudioEnergy = energy;
    }

    // Co-Articulated Natural Human Phoneme Timeline (when Talk toggle, PhoneCall, OR HTML5 fallback voice is active!)
    const isAutoTalking = !audioDriven && (state.talking || state.voicePlaying || activeClipName === 'PhoneCall');
    if (isAutoTalking) {
      talkClock += dt;
      const tLoop = talkClock % SPEECH_TOTAL_DUR;
      let acc = 0;
      let curIdx = 0;
      let localT = 0;
      for (let i = 0; i < SPEECH_TIMELINE.length; i++) {
        const dur = SPEECH_TIMELINE[i][1];
        if (tLoop <= acc + dur) {
          curIdx = i;
          localT = (tLoop - acc) / dur;
          break;
        }
        acc += dur;
      }
      const nextIdx = (curIdx + 1) % SPEECH_TIMELINE.length;
      const [curCode, , curStress] = SPEECH_TIMELINE[curIdx];
      const [nxtCode, , nxtStress] = SPEECH_TIMELINE[nextIdx];
      const curPose = SPEECH_VISEMES[curCode] || SPEECH_VISEMES.SIL;
      const nxtPose = SPEECH_VISEMES[nxtCode] || SPEECH_VISEMES.SIL;

      const coBlend = localT > 0.65 ? ((localT - 0.65) / 0.35) : 0;
      const sBlend = coBlend * coBlend * (3 - 2 * coBlend);

      for (const k in curPose) {
        const v0 = curPose[k] || 0;
        const v1 = nxtPose[k] || 0;
        m[k] = v0 + (v1 - v0) * sBlend;
      }
      for (const k in nxtPose) {
        if (k in curPose) continue;
        m[k] = (nxtPose[k] || 0) * sBlend;
      }
      speechStress = curStress + (nxtStress - curStress) * sBlend;
      const browPulse = speechStress * (0.22 + 0.14 * Math.sin(talkClock * 2.1));
      m.browInnerUp = Math.max(m.browInnerUp || 0, browPulse);
      m.browOuterUpLeft = browPulse * 0.45;
      m.browOuterUpRight = browPulse * 0.45;
      m.cheekSquintLeft = Math.max(m.cheekSquintLeft || 0, 0.06 + speechStress * 0.12);
      m.cheekSquintRight = Math.max(m.cheekSquintRight || 0, 0.06 + speechStress * 0.12);
      state.speechLevel = Math.max(m.jawOpen || 0, (m.mouthFunnel || 0) * 0.7, (m.mouthStretchLeft || 0) * 0.5);
    } else if (!audioDriven) {
      state.speechLevel = 0;
      if (activeClipName === 'Laugh') {
        talkClock += dt;
        const chuckle = 0.28 + Math.max(0, Math.sin(talkClock * 12.5)) * 0.32;
        m.jawOpen = chuckle;
        m.mouthUpperUpLeft = 0.32;
        m.mouthUpperUpRight = 0.32;
        m.mouthLowerDownLeft = 0.18;
        m.mouthLowerDownRight = 0.18;
        m.mouthSmileLeft = 0.88;
        m.mouthSmileRight = 0.85;
        m.cheekSquintLeft = 0.62;
        m.cheekSquintRight = 0.60;
        m.eyeSquintLeft = 0.38;
        m.eyeSquintRight = 0.36;
        m.browInnerUp = 0.18;
      } else if (activeClipName === 'Wave' || activeClipName === 'Cheer' || activeClipName === 'Clap') {
        talkClock += dt;
        m.mouthSmileLeft = 0.66;
        m.mouthSmileRight = 0.62;
        m.cheekSquintLeft = 0.32;
        m.cheekSquintRight = 0.30;
        m.eyeSquintLeft = 0.18;
        m.eyeSquintRight = 0.18;
        if (activeClipName === 'Wave') {
          m.jawOpen = Math.max(0, Math.sin(talkClock * 8.2)) * 0.22;
          m.mouthUpperUpLeft = 0.14;
          m.mouthUpperUpRight = 0.14;
        }
      } else if ((state.voiceExpression || state.expression) === 'angry') {
        m.browDownLeft = 0.76;
        m.browDownRight = 0.76;
        m.noseSneerLeft = 0.38;
        m.noseSneerRight = 0.38;
        m.mouthFrownLeft = 0.36;
        m.mouthFrownRight = 0.36;
        m.eyeSquintLeft = 0.26;
        m.eyeSquintRight = 0.26;
      } else if (state.expression === 'happy') {
        m.mouthSmileLeft = 0.74;
        m.mouthSmileRight = 0.70;
        m.cheekSquintLeft = 0.38;
        m.cheekSquintRight = 0.36;
      } else if (state.expression === 'surprised') {
        m.jawOpen = 0.44;
        m.mouthFunnel = 0.36;
        m.browInnerUp = 0.75;
        m.browOuterUpLeft = 0.60;
        m.browOuterUpRight = 0.60;
        m.eyeWideLeft = 0.45;
        m.eyeWideRight = 0.45;
      } else {
        // Gentle relaxed micro-warmth at rest so face feels alive
        m.mouthSmileLeft = 0.06;
        m.mouthSmileRight = 0.05;
      }
    }

    setMorphWeights(m, dt);

    // 3. Natural Conversational Head & Neck Micro-Motion (nods & subtle tilts synced to speech stress!)
    let targetPitch = 0;
    let targetYaw = 0;
    let targetRoll = 0;
    if (speechStress > 0.05) {
      headNodPhase += dt * (2.6 + speechStress * 1.4);
      targetPitch = Math.sin(headNodPhase * 1.65) * 0.032 * speechStress + 0.012 * speechStress;
      targetYaw = Math.sin(headNodPhase * 0.72 + 0.8) * 0.038 * (0.4 + speechStress * 0.6);
      targetRoll = Math.cos(headNodPhase * 0.95) * 0.024 * (0.4 + speechStress * 0.6);
    }
    const nodLerp = Math.min(1, dt * 6.5);
    headPitchSmooth += (targetPitch - headPitchSmooth) * nodLerp;
    headYawSmooth += (targetYaw - headYawSmooth) * nodLerp;
    headRollSmooth += (targetRoll - headRollSmooth) * nodLerp;

    if (headBone && neckBone && !lockHeadStraight) {
      const basePitch = state.straightGaze ? 0 : 0.03;
      const baseYaw   = state.straightGaze ? 0 : 0.22;
      const baseRoll  = state.straightGaze ? 0 : -0.04;
      const p = basePitch + headPitchSmooth;
      const y = baseYaw + headYawSmooth;
      const r = baseRoll + headRollSmooth;
      if (Math.abs(p) + Math.abs(y) + Math.abs(r) > 0.001) {
        eulerTemp.set(p, y, r);
        qTempA.setFromEuler(eulerTemp);
        headBone.quaternion.multiply(qTempA);
        eulerTemp.set(p * 0.42, y * 0.45, r * 0.35);
        qTempB.setFromEuler(eulerTemp);
        neckBone.quaternion.multiply(qTempB);
      }
    }

    let lidOffset = -0.02 - blinkAmt * 0.28;
    let jawPitch = 0;
    if (state.expression === 'angry') lidOffset -= 0.09;
    else if (state.expression === 'surprised') {
      lidOffset = 0.08;
      jawPitch = 0.08;
    } else if (state.expression === 'happy') {
      lidOffset -= 0.025;
      jawPitch = 0.03;
    }

    if (lLidTop && rLidTop) {
      lLidTop.quaternion.copy(lLidRestQ);
      rLidTop.quaternion.copy(rLidRestQ);
      if (Math.abs(lidOffset) > 0.002) {
        eulerTemp.set(lidOffset, 0, 0);
        qTempA.setFromEuler(eulerTemp);
        lLidTop.quaternion.multiply(qTempA);
        rLidTop.quaternion.multiply(qTempA);
      }
    }
    if (jawBone) {
      jawBone.quaternion.copy(jawRestQ);
      if (Math.abs(jawPitch) > 0.002) {
        eulerTemp.set(jawPitch, 0, 0);
        qTempA.setFromEuler(eulerTemp);
        jawBone.quaternion.multiply(qTempA);
      }
    }
  }

  // Reusable scratch math objects for exact World-Space 2-Bone Analytical IK (zero Mixamo axis glitches!)
  const ikA = new THREE.Vector3();
  const ikB = new THREE.Vector3();
  const ikC = new THREE.Vector3();
  const ikDirAT = new THREE.Vector3();
  const ikDirAB = new THREE.Vector3();
  const ikDirAK = new THREE.Vector3();
  const ikPolePerp = new THREE.Vector3();
  const ikK = new THREE.Vector3();
  const ikParentQ = new THREE.Quaternion();
  const ikCurQ = new THREE.Quaternion();
  const ikDeltaQ = new THREE.Quaternion();
  const ikHipsWorld = new THREE.Vector3();
  const ikFwd = new THREE.Vector3();
  const ikRight = new THREE.Vector3();
  const ikUp = new THREE.Vector3(0, 1, 0);
  const ikTarget = new THREE.Vector3();
  const ikPole = new THREE.Vector3();
  const ikClampedTarget = new THREE.Vector3();

  function solveTwoBoneIK(upperBone, lowerBone, endBone, targetWorldPos, poleWorldPos) {
    if (!upperBone || !lowerBone || !endBone || !upperBone.parent) return;
    upperBone.parent.updateWorldMatrix(true, false);
    upperBone.updateWorldMatrix(false, true);

    upperBone.getWorldPosition(ikA);
    lowerBone.getWorldPosition(ikB);
    endBone.getWorldPosition(ikC);

    const l1 = ikA.distanceTo(ikB);
    const l2 = ikB.distanceTo(ikC);
    if (l1 < 0.01 || l2 < 0.01) return;

    ikDirAT.subVectors(targetWorldPos, ikA);
    const rawDist = ikDirAT.length();
    if (rawDist < 0.001) return;
    const minDist = Math.abs(l1 - l2) + 0.025;
    const maxDist = (l1 + l2) * 0.976;
    // Soft-knee distance clamp prevents sudden elbow/knee snap & high-frequency vibration near full reach!
    let dist = rawDist;
    if (dist < minDist) {
      dist = minDist;
    } else if (dist > maxDist * 0.94) {
      const kneeStart = maxDist * 0.94;
      const span = Math.max(0.001, maxDist - kneeStart);
      dist = kneeStart + span * Math.tanh((dist - kneeStart) / span);
    }
    ikDirAT.multiplyScalar(1 / rawDist);
    ikClampedTarget.copy(ikA).addScaledVector(ikDirAT, dist);

    ikPolePerp.subVectors(poleWorldPos, ikA);
    const proj = ikPolePerp.dot(ikDirAT);
    ikPolePerp.addScaledVector(ikDirAT, -proj);
    if (ikPolePerp.lengthSq() < 1e-6) {
      ikPolePerp.set(0, 1, 0);
    } else {
      ikPolePerp.normalize();
    }

    const cosAlpha = THREE.MathUtils.clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1);
    const sinAlpha = Math.sqrt(Math.max(0, 1 - cosAlpha * cosAlpha));
    ikK.copy(ikA).addScaledVector(ikDirAT, l1 * cosAlpha).addScaledVector(ikPolePerp, l1 * sinAlpha);

    // 1. Rotate upperBone in world space so B -> K
    ikDirAB.subVectors(ikB, ikA).normalize();
    ikDirAK.subVectors(ikK, ikA).normalize();
    ikDeltaQ.setFromUnitVectors(ikDirAB, ikDirAK);
    upperBone.parent.getWorldQuaternion(ikParentQ);
    upperBone.getWorldQuaternion(ikCurQ);
    ikCurQ.premultiply(ikDeltaQ);
    upperBone.quaternion.copy(ikParentQ).invert().multiply(ikCurQ);

    // 2. Rotate lowerBone in world space so C -> ikClampedTarget (exact C1 continuity, zero near-reach jitter!)
    upperBone.updateWorldMatrix(false, true);
    lowerBone.getWorldPosition(ikB);
    endBone.getWorldPosition(ikC);
    ikDirAB.subVectors(ikC, ikB).normalize();
    ikDirAK.subVectors(ikClampedTarget, ikB).normalize();
    if (ikDirAB.lengthSq() > 1e-6 && ikDirAK.lengthSq() > 1e-6) {
      ikDeltaQ.setFromUnitVectors(ikDirAB, ikDirAK);
      lowerBone.parent.getWorldQuaternion(ikParentQ);
      lowerBone.getWorldQuaternion(ikCurQ);
      ikCurQ.premultiply(ikDeltaQ);
      lowerBone.quaternion.copy(ikParentQ).invert().multiply(ikCurQ);
    }
  }

  function alignHipsToWorldPoint(targetPoint) {
    if (!hipsBone || !targetPoint) return;
    root.updateMatrixWorld(true);
    hipsBone.getWorldPosition(ikHipsWorld);
    root.position.x += targetPoint.x - ikHipsWorld.x;
    root.position.y += targetPoint.y - ikHipsWorld.y;
    root.position.z += targetPoint.z - ikHipsWorld.z;
    root.updateMatrixWorld(true);
  }

  function resetUpperAndLimbBonesToRest() {
    if (hipsBone) {
      hipsBone.quaternion.copy(restHipsQ);
      hipsBone.position.copy(restHipsPos);
    }
    if (spineBone) spineBone.quaternion.copy(restSpineQ);
    if (spine1Bone) spine1Bone.quaternion.copy(restSpine1Q);
    if (spine2Bone) spine2Bone.quaternion.copy(restSpine2Q);
    if (neckBone) neckBone.quaternion.copy(restNeckQ);
    if (headBone) headBone.quaternion.copy(restHeadQ);
    if (leftUpLeg) leftUpLeg.quaternion.copy(restLeftUpLegQ);
    if (leftLeg) leftLeg.quaternion.copy(restLeftLegQ);
    if (leftFoot) leftFoot.quaternion.copy(restLeftFootQ);
    if (rightUpLeg) rightUpLeg.quaternion.copy(restRightUpLegQ);
    if (rightLeg) rightLeg.quaternion.copy(restRightLegQ);
    if (rightFoot) rightFoot.quaternion.copy(restRightFootQ);
    if (leftArm) leftArm.quaternion.copy(restLeftArmQ);
    if (leftForeArm) leftForeArm.quaternion.copy(restLeftForeArmQ);
    if (leftHand) leftHand.quaternion.copy(restLeftHandQ);
    if (rightArm) rightArm.quaternion.copy(restRightArmQ);
    if (rightForeArm) rightForeArm.quaternion.copy(restRightForeArmQ);
    if (rightHand) rightHand.quaternion.copy(restRightHandQ);
    for (let i = 0; i < fingerGripEntries.length; i++) {
      const f = fingerGripEntries[i];
      f.bone.quaternion.copy(f.restQ);
    }
  }

  const _hgPos = new THREE.Vector3();
  const _hgY = new THREE.Vector3();
  const _hgZ = new THREE.Vector3();
  const _hgX = new THREE.Vector3();
  const _hgMat = new THREE.Matrix4();
  const _hgWorldQ = new THREE.Quaternion();
  const _hgParentQ = new THREE.Quaternion();

  // Orient a Mixamo hand in TRUE WORLD SPACE using exact skeleton-measured anatomical basis
  // so BOTH palms sit 100% flat face-down ON TOP of the horizontal handlebar tube and all 10 curled fingers wrap tightly around the rubber grips!
  function orientHandOverGrip(handBone, gripPos, otherGripPos, isLeft) {
    if (!handBone || !handBone.parent || !gripPos) return;
    handBone.parent.updateWorldMatrix(true, false);
    handBone.updateMatrixWorld(false);
    handBone.getWorldPosition(_hgPos);

    // wX points along the live rotated handlebar tube from LEFT grip -> RIGHT grip (negative ikRight at h=0)
    if (otherGripPos) {
      if (isLeft) _hgX.subVectors(otherGripPos, gripPos);
      else _hgX.subVectors(gripPos, otherGripPos);
      _hgX.y *= 0.25; // keep knuckles cleanly aligned with horizontal grip cylinder
    } else {
      _hgX.copy(ikRight).negate();
    }
    if (_hgX.lengthSq() < 1e-6) _hgX.copy(ikRight).negate();
    else _hgX.normalize();

    // wZ = back of hand pointing UPWARD and slightly forward over the grip tube
    _hgZ.set(0, 0.92, 0).addScaledVector(ikFwd, 0.34);
    _hgZ.addScaledVector(_hgX, -_hgZ.dot(_hgX));
    if (_hgZ.lengthSq() < 1e-6) _hgZ.set(0, 1, 0);
    else _hgZ.normalize();

    // wY = wrist -> fingertips (wZ × wX points forward over the handlebar!)
    _hgY.crossVectors(_hgZ, _hgX).normalize();
    _hgZ.crossVectors(_hgX, _hgY).normalize();

    _hgMat.makeBasis(_hgX, _hgY, _hgZ);
    if (isLeft && hasLeftHandBasis) {
      _hgMat.multiply(leftHandLocalBasisInv);
    } else if (!isLeft && hasRightHandBasis) {
      _hgMat.multiply(rightHandLocalBasisInv);
    }
    _hgWorldQ.setFromRotationMatrix(_hgMat);
    handBone.parent.getWorldQuaternion(_hgParentQ);
    handBone.quaternion.copy(_hgParentQ).invert().multiply(_hgWorldQ);
  }

  function applyHandlebarFingerGrip(gripL = null, gripR = null) {
    // Orient BOTH palms cleanly face-down over the horizontal handlebar grips (world space) and tightly clench all 10 fingers!
    if (gripL && leftHand) {
      orientHandOverGrip(leftHand, gripL, gripR, true);
    } else if (leftHand) {
      eulerTemp.set(-0.24, 0.14, 0.32);
      qTempA.setFromEuler(eulerTemp);
      leftHand.quaternion.copy(restLeftHandQ).multiply(qTempA);
    }
    if (gripR && rightHand) {
      orientHandOverGrip(rightHand, gripR, gripL, false);
    } else if (rightHand) {
      eulerTemp.set(0.24, -0.14, -0.32);
      qTempA.setFromEuler(eulerTemp);
      rightHand.quaternion.copy(restRightHandQ).multiply(qTempA);
    }
    for (let i = 0; i < fingerGripEntries.length; i++) {
      const f = fingerGripEntries[i];
      if (f.axis === 'z') eulerTemp.set(0, 0, f.angle);
      else eulerTemp.set(f.angle, 0, 0);
      qTempA.setFromEuler(eulerTemp);
      f.bone.quaternion.copy(f.restQ).multiply(qTempA);
    }
  }

  function lockHeadAndNeckStraight() {
    if (neckBone) neckBone.quaternion.copy(restNeckQ);
    if (headBone) headBone.quaternion.copy(restHeadQ);
  }

  const _wParentQ = new THREE.Quaternion();
  const _wCurQ = new THREE.Quaternion();
  const _wRotQ = new THREE.Quaternion();
  const _wAxis = new THREE.Vector3();
  const _armShL = new THREE.Vector3();
  const _armShR = new THREE.Vector3();
  const _armElL = new THREE.Vector3();
  const _armHdL = new THREE.Vector3();
  const _gripTgtL = new THREE.Vector3();
  const _gripTgtR = new THREE.Vector3();
  const _idleFootL = new THREE.Vector3();
  const _blendFootL = new THREE.Vector3();
  const _idleFootR = new THREE.Vector3();
  const _blendFootR = new THREE.Vector3();

  // Apply pitch (forward lean > 0, recline < 0), yaw (turn left > 0), and roll (bank matching bodyTiltGroup.rotation.z)
  // in TRUE WORLD SPACE relative to character heading (immune to mixamorig:Hips -90° Y bind rotation!)
  function applyWorldBoneDelta(bone, restQ, heading, pitchFwd = 0, yawLeft = 0, rollBank = 0) {
    if (!bone || !bone.parent) return;
    bone.quaternion.copy(restQ);
    if (Math.abs(pitchFwd) < 1e-4 && Math.abs(yawLeft) < 1e-4 && Math.abs(rollBank) < 1e-4) return;
    bone.parent.updateWorldMatrix(true, false);
    bone.updateMatrixWorld(false);
    bone.parent.getWorldQuaternion(_wParentQ);
    bone.getWorldQuaternion(_wCurQ);
    if (Math.abs(rollBank) >= 1e-4) {
      _wAxis.set(Math.sin(heading), 0, Math.cos(heading));
      _wRotQ.setFromAxisAngle(_wAxis, rollBank);
      _wCurQ.premultiply(_wRotQ);
    }
    if (Math.abs(pitchFwd) >= 1e-4) {
      _wAxis.set(Math.cos(heading), 0, -Math.sin(heading));
      _wRotQ.setFromAxisAngle(_wAxis, pitchFwd);
      _wCurQ.premultiply(_wRotQ);
    }
    if (Math.abs(yawLeft) >= 1e-4) {
      _wAxis.set(0, 1, 0);
      _wRotQ.setFromAxisAngle(_wAxis, yawLeft);
      _wCurQ.premultiply(_wRotQ);
    }
    bone.quaternion.copy(_wParentQ).invert().multiply(_wCurQ);
  }

  function applyRickshawRidingPose(ride, dt = 0.016) {
    if (!ride || !ride.active || !ride.anchors) return;
    const a = ride.anchors;
    const h = ride.heading || 0;
    ikFwd.set(Math.sin(h), 0, Math.cos(h));
    ikRight.set(Math.cos(h), 0, -Math.sin(h));

    if (ride.seat === 'passenger') {
      const isBikePass = Boolean(ride.isBicycle);
      const isVanPass = Boolean(ride.isVan);
      const seatYaw = h + (a.passengerYawOffset || 0);
      if (isVanPass && Math.abs(a.passengerYawOffset || 0) > 0.001) {
        state.facingYaw = seatYaw;
        root.rotation.y = seatYaw;
        ikFwd.set(Math.sin(seatYaw), 0, Math.cos(seatYaw));
        ikRight.set(Math.cos(seatYaw), 0, -Math.sin(seatYaw));
      }
      resetUpperAndLimbBonesToRest();
      const passHeading = isVanPass ? seatYaw : h;
      applyWorldBoneDelta(spineBone, restSpineQ, passHeading, isBikePass ? 0.06 : (isVanPass ? 0.04 : -0.08), 0, 0);
      lockHeadAndNeckStraight();
      root.updateMatrixWorld(true);

      ikTarget.copy(a.passengerSeat);
      alignHipsToWorldPoint(ikTarget);

      // Lock BOTH passenger shoes cleanly on rickshaw footwell, bicycle footrests, or dangling cleanly off the van flatbed edge!
      if (a.passengerFootL && a.passengerFootR) {
        const kneeFwd = isBikePass ? 0.52 : (isVanPass ? 0.56 : 0.78);
        const kneeOut = isBikePass ? 0.28 : 0.16;
        const kneeLift = isBikePass ? 0.10 : (isVanPass ? 0.08 : 0.22);
        ikPole.copy(a.passengerSeat).addScaledVector(ikFwd, kneeFwd).addScaledVector(ikRight, kneeOut);
        ikPole.y += kneeLift;
        solveTwoBoneIK(leftUpLeg, leftLeg, leftFoot, a.passengerFootL, ikPole);

        ikPole.copy(a.passengerSeat).addScaledVector(ikFwd, kneeFwd).addScaledVector(ikRight, -kneeOut);
        ikPole.y += kneeLift;
        solveTwoBoneIK(rightUpLeg, rightLeg, rightFoot, a.passengerFootR, ikPole);
      }

      // Rest passenger hands naturally on lap/knees, bicycle carrier, or wooden van flatbed edge!
      const handFwd = isBikePass ? 0.14 : (isVanPass ? 0.06 : 0.24);
      const handOut = isBikePass ? 0.18 : (isVanPass ? 0.23 : 0.16);
      const handDrop = isBikePass ? 0.06 : (isVanPass ? 0.05 : 0.04);
      ikTarget.copy(a.passengerSeat).addScaledVector(ikFwd, handFwd).addScaledVector(ikRight, handOut);
      ikTarget.y -= handDrop;
      ikPole.copy(a.passengerSeat).addScaledVector(ikRight, 0.34).addScaledVector(ikFwd, -0.06);
      ikPole.y -= 0.12;
      solveTwoBoneIK(leftArm, leftForeArm, leftHand, ikTarget, ikPole);

      ikTarget.copy(a.passengerSeat).addScaledVector(ikFwd, handFwd).addScaledVector(ikRight, -handOut);
      ikTarget.y -= handDrop;
      ikPole.copy(a.passengerSeat).addScaledVector(ikRight, -0.34).addScaledVector(ikFwd, -0.06);
      ikPole.y -= 0.12;
      solveTwoBoneIK(rightArm, rightForeArm, rightHand, ikTarget, ikPole);
      lockHeadAndNeckStraight();
      return;
    }

    // 1. Hard-reset ALL torso/head/limb bones to exact neutral symmetric pose
    resetUpperAndLimbBonesToRest();

    // 2. Straight, dignified, natural Bangladeshi cycling posture (NEVER hunched waist or sideways tilt!)
    const isBike = Boolean(ride.isBicycle);
    const isVan = Boolean(ride.isVan);
    const stand = THREE.MathUtils.clamp(ride.standingBlend || 0, 0, 1);
    const steerYaw = THREE.MathUtils.clamp(ride.steerAngle || 0, -0.60, 0.60);
    // GTA V-style two-foot alternating reverse duck-walk when reversing on Bicycle, or single left-foot-down when stopped idle!
    const wantRevWalk = isBike && Boolean(ride.isReversing || (ride.speed || 0) < -0.06) && !ride.standingPedal;
    const wantFootDown = isBike && !wantRevWalk && Math.abs(ride.speed || 0) < 0.38 && !ride.standingPedal;
    reverseWalkBlend = THREE.MathUtils.lerp(reverseWalkBlend, wantRevWalk ? 1.0 : 0.0, Math.min(1, dt * 9.0));
    idleFootDownBlend = THREE.MathUtils.lerp(idleFootDownBlend, wantFootDown ? 1.0 : 0.0, Math.min(1, dt * 8.5));
    if (reverseWalkBlend > 0.02) {
      reverseWalkPhase += Math.max(2.6, Math.abs(ride.speed || 0) * 4.8) * dt;
    }
    const revSwayRoll = isBike ? (Math.sin(reverseWalkPhase) * 0.028 * reverseWalkBlend) : 0;
    const idleFootRoll = isBike ? (-0.045 * idleFootDownBlend) : 0;
    const leanRoll = isBike ? THREE.MathUtils.clamp((ride.roll || 0) + idleFootRoll + revSwayRoll, -0.20, 0.20) : 0;

    // Gentle straight-back forward lean (~16 deg straight, smoothly up to ~21 deg on sharp turns — zero waist hunching!)
    const totalPitch = THREE.MathUtils.clamp(
      (isBike ? 0.29 : (isVan ? 0.27 : 0.25)) + stand * 0.06 + Math.abs(steerYaw) * 0.14 - idleFootDownBlend * 0.04 - reverseWalkBlend * 0.06,
      0.18,
      0.39,
    );
    const totalYaw = steerYaw * 0.48;
    if (hipsBone) {
      applyWorldBoneDelta(hipsBone, restHipsQ, h, 0, 0, leanRoll);
    }
    applyWorldBoneDelta(spineBone, restSpineQ, h, totalPitch * 0.36, totalYaw * 0.38, 0);
    applyWorldBoneDelta(spine1Bone, restSpine1Q, h, totalPitch * 0.34, totalYaw * 0.34, 0);
    applyWorldBoneDelta(spine2Bone, restSpine2Q, h, totalPitch * 0.30, totalYaw * 0.28, 0);
    lockHeadAndNeckStraight();
    root.updateMatrixWorld(true);

    // Seat hips ergonomically over the saddle (smoothly rises on [SHIFT] standing sprint, saddle hides cleanly while seated!)
    ikTarget.copy(a.saddle).addScaledVector(ikFwd, stand * 0.09);
    ikTarget.y += 0.08 + stand * 0.18 - idleFootDownBlend * 0.05 - reverseWalkBlend * 0.05;
    alignHipsToWorldPoint(ikTarget);

    // 3. Exact 2-Bone World-Space Leg IK: GTA V two-foot reverse duck-walk OR idle left-foot-down OR pedaling!
    const groundY = typeof ride.groundY === 'number' ? ride.groundY : Math.max(0, a.saddle.y - 0.93);
    if (isBike && reverseWalkBlend > 0.005) {
      const phL = reverseWalkPhase;
      const phR = reverseWalkPhase + Math.PI;
      const strideL = Math.sin(phL) * 0.21;
      const liftL = Math.max(0, Math.cos(phL)) * 0.085;
      _idleFootL.copy(a.saddle).addScaledVector(ikRight, 0.35).addScaledVector(ikFwd, 0.12 + strideL);
      _idleFootL.y = groundY + 0.105 + liftL;
      _blendFootL.lerpVectors(a.pedalL, _idleFootL, reverseWalkBlend);
      ikPole.copy(ikTarget).addScaledVector(ikFwd, 0.54 + strideL * 0.45).addScaledVector(ikRight, 0.38);
      ikPole.y -= 0.08;
      solveTwoBoneIK(leftUpLeg, leftLeg, leftFoot, _blendFootL, ikPole);

      const strideR = Math.sin(phR) * 0.21;
      const liftR = Math.max(0, Math.cos(phR)) * 0.085;
      _idleFootR.copy(a.saddle).addScaledVector(ikRight, -0.35).addScaledVector(ikFwd, 0.12 + strideR);
      _idleFootR.y = groundY + 0.105 + liftR;
      _blendFootR.lerpVectors(a.pedalR, _idleFootR, reverseWalkBlend);
      ikPole.copy(ikTarget).addScaledVector(ikFwd, 0.54 + strideR * 0.45).addScaledVector(ikRight, -0.38);
      ikPole.y -= 0.08;
      solveTwoBoneIK(rightUpLeg, rightLeg, rightFoot, _blendFootR, ikPole);
    } else {
      if (isBike && idleFootDownBlend > 0.005) {
        _idleFootL.copy(a.saddle).addScaledVector(ikRight, 0.34).addScaledVector(ikFwd, 0.16);
        _idleFootL.y = groundY + 0.105;
        _blendFootL.lerpVectors(a.pedalL, _idleFootL, idleFootDownBlend);
        ikPole.copy(ikTarget).addScaledVector(ikFwd, THREE.MathUtils.lerp(0.78, 0.56, idleFootDownBlend)).addScaledVector(ikRight, THREE.MathUtils.lerp(0.17, 0.36, idleFootDownBlend));
        ikPole.y += THREE.MathUtils.lerp(0.14, -0.10, idleFootDownBlend);
        solveTwoBoneIK(leftUpLeg, leftLeg, leftFoot, _blendFootL, ikPole);
      } else {
        ikPole.copy(ikTarget).addScaledVector(ikFwd, 0.78).addScaledVector(ikRight, 0.17);
        ikPole.y += 0.14;
        solveTwoBoneIK(leftUpLeg, leftLeg, leftFoot, a.pedalL, ikPole);
      }

      ikPole.copy(ikTarget).addScaledVector(ikFwd, 0.78).addScaledVector(ikRight, -0.17);
      ikPole.y += 0.14;
      solveTwoBoneIK(rightUpLeg, rightLeg, rightFoot, a.pedalR, ikPole);
    }

    // 4. Exact 2-Bone World-Space Arm IK + realistic curled handlebar grip so BOTH hands stay 100% locked onto the rubber grips!
    if (a.gripL && a.gripR && leftArm && leftForeArm && leftHand && rightArm && rightForeArm && rightHand) {
      // Place wrist ~4.8cm behind grip toward shoulder so the center of the palm & curled fingers lock directly onto the rubber grip tube!
      leftArm.getWorldPosition(_armShL);
      rightArm.getWorldPosition(_armShR);
      _gripTgtL.subVectors(_armShL, a.gripL).normalize().multiplyScalar(0.048).add(a.gripL);
      _gripTgtL.y += 0.008;
      _gripTgtR.subVectors(_armShR, a.gripR).normalize().multiplyScalar(0.048).add(a.gripR);
      _gripTgtR.y += 0.008;

      const elbowFwd = isBike ? 0.08 : 0.10;
      const elbowOut = isBike ? 0.38 : 0.42;
      const elbowDrop = isBike ? 0.18 : 0.14;
      ikPole.copy(ikTarget).addScaledVector(ikFwd, elbowFwd).addScaledVector(ikRight, elbowOut);
      ikPole.y -= elbowDrop;
      solveTwoBoneIK(leftArm, leftForeArm, leftHand, _gripTgtL, ikPole);

      ikPole.copy(ikTarget).addScaledVector(ikFwd, elbowFwd).addScaledVector(ikRight, -elbowOut);
      ikPole.y -= elbowDrop;
      solveTwoBoneIK(rightArm, rightForeArm, rightHand, _gripTgtR, ikPole);

      applyHandlebarFingerGrip(a.gripL, a.gripR);
    }

    // 5. Keep neck & head upright and straight forward down the road!
    const turnLook = THREE.MathUtils.clamp(steerYaw * 0.22, -0.18, 0.18);
    applyWorldBoneDelta(neckBone, restNeckQ, h, -totalPitch * 0.45, -totalYaw * 0.45 + turnLook * 0.4, -leanRoll * 0.25);
    applyWorldBoneDelta(headBone, restHeadQ, h, -totalPitch * 0.48, -totalYaw * 0.50 + turnLook * 0.6, -leanRoll * 0.30);
  }

  function applyCarDrivingPose(cd) {
    if (!cd || !cd.active || !cd.anchors) return;
    const a = cd.anchors;
    const h = cd.heading || 0;
    ikFwd.set(Math.sin(h), 0, Math.cos(h));
    ikRight.set(Math.cos(h), 0, -Math.sin(h));

    // 1. Clean rest reset (zero drift/spin)
    resetUpperAndLimbBonesToRest();

    // 2. Natural reclined car-seat posture in true world space (zero sideways tilt!)
    applyWorldBoneDelta(spineBone, restSpineQ, h, -0.14, 0, 0);
    applyWorldBoneDelta(spine1Bone, restSpine1Q, h, -0.06, 0, 0);
    lockHeadAndNeckStraight();
    root.updateMatrixWorld(true);

    // 3. Seat hips directly on the car driver seat
    ikTarget.copy(a.seat);
    alignHipsToWorldPoint(ikTarget);

    // 4. 2-Bone IK for both legs seated toward the pedals
    ikPole.copy(a.seat).addScaledVector(ikFwd, 0.72).addScaledVector(ikRight, 0.16);
    ikPole.y += 0.18;
    solveTwoBoneIK(leftUpLeg, leftLeg, leftFoot, a.footL, ikPole);

    ikPole.copy(a.seat).addScaledVector(ikFwd, 0.72).addScaledVector(ikRight, -0.16);
    ikPole.y += 0.18;
    solveTwoBoneIK(rightUpLeg, rightLeg, rightFoot, a.footR, ikPole);

    // 5. 2-Bone IK locking Left & Right hands onto the live rotating 3D steering wheel grips!
    if (a.gripL && a.gripR) {
      ikPole.copy(a.seat).addScaledVector(ikFwd, 0.12).addScaledVector(ikRight, 0.56);
      ikPole.y -= 0.04;
      solveTwoBoneIK(leftArm, leftForeArm, leftHand, a.gripL, ikPole);

      ikPole.copy(a.seat).addScaledVector(ikFwd, 0.12).addScaledVector(ikRight, -0.56);
      ikPole.y -= 0.04;
      solveTwoBoneIK(rightArm, rightForeArm, rightHand, a.gripR, ikPole);
      applyHandlebarFingerGrip();
    }

    // 6. Keep head & neck 100% straight forward while driving (never tilts sideways toward window)
    applyWorldBoneDelta(neckBone, restNeckQ, h, 0.09, 0, 0);
    applyWorldBoneDelta(headBone, restHeadQ, h, 0.09, 0, 0);
  }

  function applyBikeRidingPose(bike, dt = 0.016) {
    if (!bike || !bike.active || !bike.anchors) return;
    const a = bike.anchors;
    const h = bike.heading || 0;
    ikFwd.set(Math.sin(h), 0, Math.cos(h));
    ikRight.set(Math.cos(h), 0, -Math.sin(h));

    // 1. Clean rest reset (symmetric motorcycle posture)
    resetUpperAndLimbBonesToRest();

    // 2. Natural motorcycle forward lean + corner banking + GTA V two-foot reverse duck-walk OR idle left-foot-down!
    const wantRevWalk = Boolean(bike.isReversing || (bike.speed || 0) < -0.06);
    const wantFootDown = !wantRevWalk && Math.abs(bike.speed || 0) < 0.45;
    reverseWalkBlend = THREE.MathUtils.lerp(reverseWalkBlend, wantRevWalk ? 1.0 : 0.0, Math.min(1, dt * 9.0));
    idleFootDownBlend = THREE.MathUtils.lerp(idleFootDownBlend, wantFootDown ? 1.0 : 0.0, Math.min(1, dt * 8.5));
    if (reverseWalkBlend > 0.02) {
      reverseWalkPhase += Math.max(2.8, Math.abs(bike.speed || 0) * 4.8) * dt;
    }
    const revSwayRoll = Math.sin(reverseWalkPhase) * 0.030 * reverseWalkBlend;
    const steerYaw = THREE.MathUtils.clamp(bike.steerAngle || 0, -0.55, 0.55);
    const leanRoll = THREE.MathUtils.clamp((bike.roll || 0) - 0.045 * idleFootDownBlend + revSwayRoll, -0.34, 0.34);
    // Rock-steady sport-naked / trail torso with smooth steering yaw follow so BOTH hands stay 100% locked onto grips without outer-arm IK twitch!
    const fwdLean = THREE.MathUtils.clamp((bike.sportLean ? 0.34 : 0.25) + Math.abs(steerYaw) * 0.07 - 0.03 * idleFootDownBlend - 0.06 * reverseWalkBlend, 0.18, 0.42);
    const torsoYaw = steerYaw * 0.42;
    applyWorldBoneDelta(hipsBone, restHipsQ, h, 0, 0, leanRoll);
    applyWorldBoneDelta(spineBone, restSpineQ, h, fwdLean * 0.42, torsoYaw * 0.38, 0);
    applyWorldBoneDelta(spine1Bone, restSpine1Q, h, fwdLean * 0.34, torsoYaw * 0.34, 0);
    applyWorldBoneDelta(spine2Bone, restSpine2Q, h, fwdLean * 0.24, torsoYaw * 0.28, 0);
    lockHeadAndNeckStraight();
    root.updateMatrixWorld(true);

    // 3. Seat hips squarely in the middle of the motorcycle saddle (cleanly behind fuel tank so panjabi never clips!)
    ikTarget.copy(a.seat);
    ikTarget.y -= 0.025 * idleFootDownBlend + 0.035 * reverseWalkBlend;
    alignHipsToWorldPoint(ikTarget);

    // 4. 2-Bone IK: GTA V two-foot alternating reverse duck-walk OR idle left-foot-down OR both boots locked on footpegs!
    const groundY = typeof bike.groundY === 'number' ? bike.groundY : Math.max(0, a.seat.y - 1.00);
    if (reverseWalkBlend > 0.005) {
      const phL = reverseWalkPhase;
      const phR = reverseWalkPhase + Math.PI;
      const strideL = Math.sin(phL) * 0.22;
      const liftL = Math.max(0, Math.cos(phL)) * 0.09;
      _idleFootL.copy(a.seat).addScaledVector(ikRight, 0.39).addScaledVector(ikFwd, 0.14 + strideL);
      _idleFootL.y = groundY + 0.105 + liftL;
      _blendFootL.lerpVectors(a.footL, _idleFootL, reverseWalkBlend);
      ikPole.copy(a.seat).addScaledVector(ikFwd, 0.50 + strideL * 0.45).addScaledVector(ikRight, 0.44);
      ikPole.y -= 0.08;
      solveTwoBoneIK(leftUpLeg, leftLeg, leftFoot, _blendFootL, ikPole);

      const strideR = Math.sin(phR) * 0.22;
      const liftR = Math.max(0, Math.cos(phR)) * 0.09;
      _idleFootR.copy(a.seat).addScaledVector(ikRight, -0.39).addScaledVector(ikFwd, 0.14 + strideR);
      _idleFootR.y = groundY + 0.105 + liftR;
      _blendFootR.lerpVectors(a.footR, _idleFootR, reverseWalkBlend);
      ikPole.copy(a.seat).addScaledVector(ikFwd, 0.50 + strideR * 0.45).addScaledVector(ikRight, -0.44);
      ikPole.y -= 0.08;
      solveTwoBoneIK(rightUpLeg, rightLeg, rightFoot, _blendFootR, ikPole);
    } else {
      if (idleFootDownBlend > 0.005) {
        _idleFootL.copy(a.seat).addScaledVector(ikRight, 0.40).addScaledVector(ikFwd, 0.18);
        _idleFootL.y = groundY + 0.105;
        _blendFootL.lerpVectors(a.footL, _idleFootL, idleFootDownBlend);
        ikPole.copy(a.seat).addScaledVector(ikFwd, THREE.MathUtils.lerp(0.68, 0.50, idleFootDownBlend)).addScaledVector(ikRight, THREE.MathUtils.lerp(0.32, 0.44, idleFootDownBlend));
        ikPole.y += THREE.MathUtils.lerp(0.08, -0.10, idleFootDownBlend);
        solveTwoBoneIK(leftUpLeg, leftLeg, leftFoot, _blendFootL, ikPole);
      } else {
        ikPole.copy(a.seat).addScaledVector(ikFwd, 0.68).addScaledVector(ikRight, 0.32);
        ikPole.y += 0.08;
        solveTwoBoneIK(leftUpLeg, leftLeg, leftFoot, a.footL, ikPole);
      }

      ikPole.copy(a.seat).addScaledVector(ikFwd, 0.68).addScaledVector(ikRight, -0.32);
      ikPole.y += 0.08;
      solveTwoBoneIK(rightUpLeg, rightLeg, rightFoot, a.footR, ikPole);
    }

    // 5. Exact 2-Bone Arm IK (bicycle-matched tight wrist offset + skeleton-calibrated world-space palm-down grip + tightly clenched fingers!)
    if (a.gripL && a.gripR && leftArm && leftForeArm && leftHand && rightArm && rightForeArm && rightHand) {
      leftArm.getWorldPosition(_armShL);
      rightArm.getWorldPosition(_armShR);
      // Place wrist 4.8cm behind grip toward shoulder so the center of the palm & curled fingers lock directly around the rubber grip tube!
      _gripTgtL.subVectors(_armShL, a.gripL).normalize().multiplyScalar(0.048).add(a.gripL);
      _gripTgtL.y += 0.008;
      _gripTgtR.subVectors(_armShR, a.gripR).normalize().multiplyScalar(0.048).add(a.gripR);
      _gripTgtR.y += 0.008;

      ikPole.copy(a.seat).addScaledVector(ikFwd, 0.14).addScaledVector(ikRight, 0.38);
      ikPole.y -= 0.12;
      solveTwoBoneIK(leftArm, leftForeArm, leftHand, _gripTgtL, ikPole);

      ikPole.copy(a.seat).addScaledVector(ikFwd, 0.14).addScaledVector(ikRight, -0.38);
      ikPole.y -= 0.12;
      solveTwoBoneIK(rightArm, rightForeArm, rightHand, _gripTgtR, ikPole);
      applyHandlebarFingerGrip(a.gripL, a.gripR);
    }
    // 6. Keep head looking straight forward along the road (compensating torso forward lean & steering yaw in world space)
    const turnLook = THREE.MathUtils.clamp((bike.steerAngle || 0) * 0.22, -0.18, 0.18);
    applyWorldBoneDelta(neckBone, restNeckQ, h, -fwdLean * 0.45, -torsoYaw * 0.45 + turnLook * 0.35, -leanRoll * 0.25);
    applyWorldBoneDelta(headBone, restHeadQ, h, -fwdLean * 0.50, -torsoYaw * 0.50 + turnLook * 0.65, -leanRoll * 0.30);
  }

  function applyLedgeHangPose(lh) {
    if (!lh || !lh.active) return;
    const h = lh.yaw || 0;
    ikFwd.set(Math.sin(h), 0, Math.cos(h));
    ikRight.set(Math.cos(h), 0, -Math.sin(h));

    resetUpperAndLimbBonesToRest();
    lockHeadAndNeckStraight();
    root.updateMatrixWorld(true);

    if (hipsBone) hipsBone.getWorldPosition(ikHipsWorld);
    else ikHipsWorld.copy(root.position).setY(root.position.y + 0.95);

    // Both arms raised high above the head gripping the wall top edge!
    if (leftArm && leftForeArm && leftHand && rightArm && rightForeArm && rightHand) {
      ikTarget.copy(ikHipsWorld).addScaledVector(ikFwd, 0.26).addScaledVector(ikRight, 0.24);
      ikTarget.y += 0.96;
      ikPole.copy(ikHipsWorld).addScaledVector(ikFwd, 0.35).addScaledVector(ikRight, 0.42);
      ikPole.y += 0.60;
      solveTwoBoneIK(leftArm, leftForeArm, leftHand, ikTarget, ikPole);

      ikTarget.copy(ikHipsWorld).addScaledVector(ikFwd, 0.26).addScaledVector(ikRight, -0.24);
      ikTarget.y += 0.96;
      ikPole.copy(ikHipsWorld).addScaledVector(ikFwd, 0.35).addScaledVector(ikRight, -0.42);
      ikPole.y += 0.60;
      solveTwoBoneIK(rightArm, rightForeArm, rightHand, ikTarget, ikPole);
    }
    // Knees slightly bent against the wall while hanging
    if (leftUpLeg && leftLeg && leftFoot && rightUpLeg && rightLeg && rightFoot) {
      ikTarget.copy(ikHipsWorld).addScaledVector(ikFwd, 0.08).addScaledVector(ikRight, 0.12);
      ikTarget.y -= 0.72;
      ikPole.copy(ikHipsWorld).addScaledVector(ikFwd, 0.55).addScaledVector(ikRight, 0.14);
      ikPole.y -= 0.32;
      solveTwoBoneIK(leftUpLeg, leftLeg, leftFoot, ikTarget, ikPole);

      ikTarget.copy(ikHipsWorld).addScaledVector(ikFwd, 0.02).addScaledVector(ikRight, -0.12);
      ikTarget.y -= 0.78;
      ikPole.copy(ikHipsWorld).addScaledVector(ikFwd, 0.55).addScaledVector(ikRight, -0.14);
      ikPole.y -= 0.36;
      solveTwoBoneIK(rightUpLeg, rightLeg, rightFoot, ikTarget, ikPole);
    }
    lockHeadAndNeckStraight();
  }

  function applyVehicleAnimPose(va) {
    if (!va || !va.type) return;
    const h = va.heading || 0;
    ikFwd.set(Math.sin(h), 0, Math.cos(h));
    ikRight.set(Math.cos(h), 0, -Math.sin(h));
    const p = THREE.MathUtils.clamp(va.progress || 0, 0, 1);

    if (va.type === 'bike_mount' || va.type === 'bike_dismount') {
      resetUpperAndLimbBonesToRest();
      root.updateMatrixWorld(true);
      const phase = va.phase || '';
      const pp = THREE.MathUtils.clamp(va.phaseProgress || 0, 0, 1);
      const isKickPhase = phase === 'kickstand_up' || phase === 'kickstand_down';
      const u = isKickPhase ? 1.0 : (phase === 'dismount_leg' ? (1 - pp) : pp);
      const swingArc = Math.sin(u * Math.PI);
      applyWorldBoneDelta(spineBone, restSpineQ, h, u * 0.22, 0, 0);
      root.updateMatrixWorld(true);
      if (va.anchors) {
        if (isKickPhase) {
          // Seated on motorcycle: right boot on footpeg, left boot reaches down to flick side-stand UP or push it DOWN!
          alignHipsToWorldPoint(va.anchors.seat);
          if (rightUpLeg && rightLeg && rightFoot) {
            ikPole.copy(va.anchors.seat).addScaledVector(ikFwd, 0.68).addScaledVector(ikRight, -0.32);
            ikPole.y += 0.08;
            solveTwoBoneIK(rightUpLeg, rightLeg, rightFoot, va.anchors.footR, ikPole);
          }
          if (leftUpLeg && leftLeg && leftFoot) {
            const kickReach = Math.sin(pp * Math.PI);
            if (va.anchors.hasKickstandTip && va.anchors.kickstandTip) {
              ikTarget.lerpVectors(va.anchors.footL, va.anchors.kickstandTip, Math.min(1, kickReach * 1.35));
              ikTarget.y = Math.max(0.08, ikTarget.y + 0.04);
            } else {
              ikTarget.copy(va.anchors.footL).addScaledVector(ikRight, kickReach * 0.16).addScaledVector(ikFwd, -kickReach * 0.18);
              ikTarget.y = THREE.MathUtils.lerp(va.anchors.footL.y, 0.10, kickReach);
            }
            ikPole.copy(va.anchors.seat).addScaledVector(ikFwd, 0.42).addScaledVector(ikRight, 0.44);
            ikPole.y += 0.04;
            solveTwoBoneIK(leftUpLeg, leftLeg, leftFoot, ikTarget, ikPole);
          }
        } else {
          if (rightUpLeg && rightLeg && rightFoot) {
            ikTarget.copy(va.anchors.footR);
            ikTarget.addScaledVector(ikRight, (1 - u) * 0.72);
            ikTarget.addScaledVector(ikFwd, -swingArc * 0.28);
            ikTarget.y = THREE.MathUtils.lerp(0.10, va.anchors.footR.y, u) + swingArc * 0.68;
            ikPole.copy(va.anchors.seat).addScaledVector(ikFwd, 0.60).addScaledVector(ikRight, -0.35);
            ikPole.y += 0.22;
            solveTwoBoneIK(rightUpLeg, rightLeg, rightFoot, ikTarget, ikPole);
          }
          if (u > 0.35 && leftUpLeg && leftLeg && leftFoot) {
            const lu = (u - 0.35) / 0.65;
            ikTarget.copy(va.anchors.footL);
            ikTarget.addScaledVector(ikRight, (1 - lu) * 0.32);
            ikTarget.y = THREE.MathUtils.lerp(0.10, va.anchors.footL.y, lu);
            ikPole.copy(va.anchors.seat).addScaledVector(ikFwd, 0.68).addScaledVector(ikRight, 0.32);
            ikPole.y += 0.08;
            solveTwoBoneIK(leftUpLeg, leftLeg, leftFoot, ikTarget, ikPole);
          }
        }
        if ((isKickPhase || u > 0.14) && leftArm && leftForeArm && leftHand && rightArm && rightForeArm && rightHand) {
          ikPole.copy(va.anchors.seat).addScaledVector(ikFwd, 0.16).addScaledVector(ikRight, 0.50);
          ikPole.y += 0.06;
          solveTwoBoneIK(leftArm, leftForeArm, leftHand, va.anchors.gripL, ikPole);
          ikPole.copy(va.anchors.seat).addScaledVector(ikFwd, 0.16).addScaledVector(ikRight, -0.50);
          ikPole.y += 0.06;
          solveTwoBoneIK(rightArm, rightForeArm, rightHand, va.anchors.gripR, ikPole);
          applyHandlebarFingerGrip();
        }
      }
      lockHeadAndNeckStraight();
    } else if (va.type === 'rickshaw_mount_driver' || va.type === 'rickshaw_dismount_driver') {
      resetUpperAndLimbBonesToRest();
      const isBike = Boolean(va.isBicycle);
      const phase = va.phase || '';
      const pp = THREE.MathUtils.clamp(va.phaseProgress || 0, 0, 1);

      if (isBike && (phase === 'kickstand_up' || phase === 'kickstand_down')) {
        // Standing beside LEFT (+ikRight) kickstand: hold left handlebar steady while right foot flicks rear kickstand UP or pushes it DOWN!
        const kickReach = Math.sin(pp * Math.PI);
        applyWorldBoneDelta(spineBone, restSpineQ, h, 0.10 + kickReach * 0.08, -0.16, 0);
        root.updateMatrixWorld(true);
        if (va.anchors && rightUpLeg && rightLeg && rightFoot) {
          if (va.anchors.hasKickstandTip && va.anchors.kickstandTip) {
            rightFoot.getWorldPosition(ikTarget);
            ikTarget.lerp(va.anchors.kickstandTip, Math.min(1, kickReach * 1.35));
            ikTarget.y = Math.max(0.11, ikTarget.y + 0.03);
          } else {
            rightFoot.getWorldPosition(ikTarget);
            ikTarget.addScaledVector(ikFwd, -kickReach * 0.24).addScaledVector(ikRight, -kickReach * 0.18);
            ikTarget.y += kickReach * 0.14;
          }
          ikPole.copy(ikTarget).addScaledVector(ikFwd, 0.58).addScaledVector(ikRight, 0.14);
          ikPole.y += 0.30;
          solveTwoBoneIK(rightUpLeg, rightLeg, rightFoot, ikTarget, ikPole);
        }
        if (va.anchors && rightArm && rightForeArm && rightHand) {
          // Right hand steadies the left handlebar grip while kicking the left-side rear stand
          ikPole.copy(va.anchors.saddle).addScaledVector(ikFwd, 0.10).addScaledVector(ikRight, 0.35);
          ikPole.y -= 0.10;
          solveTwoBoneIK(rightArm, rightForeArm, rightHand, va.anchors.gripL, ikPole);
          applyHandlebarFingerGrip();
        }
        lockHeadAndNeckStraight();
      } else if (isBike) {
        // Bicycle leg swing from LEFT (+ikRight) kickstand side cleanly over saddle onto pedals!
        const u = phase === 'dismount_leg' ? (1 - pp) : pp;
        const swingArc = Math.sin(u * Math.PI);
        applyWorldBoneDelta(spineBone, restSpineQ, h, u * 0.28, 0, 0);
        root.updateMatrixWorld(true);
        if (va.anchors && rightUpLeg && rightLeg && rightFoot) {
          ikTarget.copy(va.anchors.pedalR);
          ikTarget.addScaledVector(ikRight, (1 - u) * 0.64);
          ikTarget.addScaledVector(ikFwd, -swingArc * 0.24);
          ikTarget.y = THREE.MathUtils.lerp(0.11, va.anchors.pedalR.y, u) + swingArc * 0.58;
          ikPole.copy(va.anchors.saddle).addScaledVector(ikFwd, 0.62).addScaledVector(ikRight, -0.26);
          ikPole.y += 0.22;
          solveTwoBoneIK(rightUpLeg, rightLeg, rightFoot, ikTarget, ikPole);
        }
        if (va.anchors && u > 0.38 && leftUpLeg && leftLeg && leftFoot) {
          const lu = (u - 0.38) / 0.62;
          ikTarget.copy(va.anchors.pedalL);
          ikTarget.addScaledVector(ikRight, (1 - lu) * 0.34);
          ikTarget.y = THREE.MathUtils.lerp(0.11, va.anchors.pedalL.y, lu);
          ikPole.copy(va.anchors.saddle).addScaledVector(ikFwd, 0.64).addScaledVector(ikRight, 0.22);
          ikPole.y += 0.14;
          solveTwoBoneIK(leftUpLeg, leftLeg, leftFoot, ikTarget, ikPole);
        }
        if (va.anchors && u > 0.12 && leftArm && leftForeArm && leftHand && rightArm && rightForeArm && rightHand) {
          ikPole.copy(va.anchors.saddle).addScaledVector(ikFwd, 0.10).addScaledVector(ikRight, 0.40);
          ikPole.y -= 0.14;
          solveTwoBoneIK(leftArm, leftForeArm, leftHand, va.anchors.gripL, ikPole);
          ikPole.copy(va.anchors.saddle).addScaledVector(ikFwd, 0.10).addScaledVector(ikRight, -0.40);
          ikPole.y -= 0.14;
          solveTwoBoneIK(rightArm, rightForeArm, rightHand, va.anchors.gripR, ikPole);
          applyHandlebarFingerGrip();
        }
        lockHeadAndNeckStraight();
      } else {
        // Rickshaw & Cargo Van (no kickstand): standard mount/dismount
        const u = va.type === 'rickshaw_dismount_driver' ? (1 - p) : p;
        applyWorldBoneDelta(spineBone, restSpineQ, h, u * 0.24, 0, 0);
        root.updateMatrixWorld(true);
        const swingArc = Math.sin(u * Math.PI);
        if (va.anchors && rightUpLeg && rightLeg && rightFoot) {
          root.updateMatrixWorld(true);
          ikTarget.copy(va.anchors.pedalR);
          ikTarget.addScaledVector(ikRight, (1 - u) * 0.65);
          ikTarget.y = THREE.MathUtils.lerp(0.12, va.anchors.pedalR.y, u) + swingArc * 0.58;
          ikPole.copy(va.anchors.saddle).addScaledVector(ikFwd, 0.65).addScaledVector(ikRight, -0.25);
          ikPole.y += 0.25;
          solveTwoBoneIK(rightUpLeg, rightLeg, rightFoot, ikTarget, ikPole);
        }
        if (va.anchors && u > 0.45 && leftUpLeg && leftLeg && leftFoot) {
          const lu = (u - 0.45) / 0.55;
          ikTarget.copy(va.anchors.pedalL);
          ikTarget.addScaledVector(ikRight, (1 - lu) * 0.35);
          ikTarget.y = THREE.MathUtils.lerp(0.12, va.anchors.pedalL.y, lu);
          ikPole.copy(va.anchors.saddle).addScaledVector(ikFwd, 0.65).addScaledVector(ikRight, 0.20);
          ikPole.y += 0.15;
          solveTwoBoneIK(leftUpLeg, leftLeg, leftFoot, ikTarget, ikPole);
        }
        if (va.anchors && u > 0.22 && leftArm && leftForeArm && leftHand && rightArm && rightForeArm && rightHand) {
          ikPole.copy(va.anchors.saddle).addScaledVector(ikFwd, 0.12).addScaledVector(ikRight, 0.50);
          ikPole.y += 0.12;
          solveTwoBoneIK(leftArm, leftForeArm, leftHand, va.anchors.gripL, ikPole);
          ikPole.copy(va.anchors.saddle).addScaledVector(ikFwd, 0.12).addScaledVector(ikRight, -0.50);
          ikPole.y += 0.12;
          solveTwoBoneIK(rightArm, rightForeArm, rightHand, va.anchors.gripR, ikPole);
          applyHandlebarFingerGrip();
        }
      }
    } else if (va.type === 'car_enter' || va.type === 'car_exit') {
      // Reach hand to car door handle (phase 1) or pull seatbelt diagonally across chest (phase 4)
      if (va.phase === 'open_door' || va.phase === 'close_door') {
        if (va.handTarget && rightArm && rightForeArm && rightHand) {
          root.updateMatrixWorld(true);
          rightArm.getWorldPosition(ikPole);
          ikPole.addScaledVector(ikRight, -0.35).addScaledVector(ikUp, -0.30);
          solveTwoBoneIK(rightArm, rightForeArm, rightHand, va.handTarget, ikPole);
        }
      } else if (va.phase === 'seatbelt') {
        // Right hand reaches up to left shoulder and pulls seatbelt diagonally down to right hip!
        if (leftArm && rightArm && rightForeArm && rightHand && spine1Bone) {
          root.updateMatrixWorld(true);
          const tBelt = THREE.MathUtils.clamp(va.phaseProgress || 0, 0, 1);
          spine1Bone.getWorldPosition(ikTarget);
          // Sweep from upper-left shoulder across chest to right hip buckle
          ikTarget.addScaledVector(ikRight, THREE.MathUtils.lerp(0.24, -0.22, tBelt));
          ikTarget.y += THREE.MathUtils.lerp(0.26, -0.24, tBelt);
          ikTarget.addScaledVector(ikFwd, 0.22);
          ikPole.copy(ikTarget).addScaledVector(ikRight, -0.45).addScaledVector(ikFwd, 0.25);
          solveTwoBoneIK(rightArm, rightForeArm, rightHand, ikTarget, ikPole);
        }
      }
    }
  }

  function update(delta, {
    position,
    yaw = 0,
    speed = 0,
    maxSpeed = 4.35,
    grounded = true,
    isSprinting = false,
    isFalling = false,
    isFlipping = false,
    isClimbing = false,
    isDiving = false,
    isSwimming = false,
    landRecoveryClip = null,
    moveDirX = 0,
    moveDirZ = 0,
    inStudio = false,
    studioPos = null,
    studioYaw = 0,
    hideMesh = false,
    rickshawRide = null,
    bikeRide = null,
    carDrive = null,
    ledgeHang = null,
    vehicleAnim = null,
    customClip = null,
  }) {
    const dt = Math.min(Math.max(delta || 0.016, 0.001), 0.05);
    const isRidingRickshaw = Boolean(rickshawRide && rickshawRide.active);
    const isRidingBike = Boolean(bikeRide && bikeRide.active);
    const isDrivingCar = Boolean(carDrive && carDrive.active);
    const isLedgeHanging = Boolean(ledgeHang && ledgeHang.active);
    const isVehicleAnim = Boolean(vehicleAnim && vehicleAnim.type);
    const shouldShow = !hideMesh && (inStudio || isRidingRickshaw || isRidingBike || isDrivingCar || isLedgeHanging || isVehicleAnim || state.cameraMode !== 'first');
    root.visible = shouldShow;
    // Only show Low-quality ground contact shadow when standing/walking on solid ground (NEVER floating through bicycles/bikes/vehicles or in mid-air!)
    contactShadowMesh.visible = Boolean(
      shouldShow
      && currentQuality === 'low'
      && grounded
      && !isSwimming
      && !inStudio
      && !isRidingRickshaw
      && !isRidingBike
      && !isDrivingCar
      && !isLedgeHanging
      && !isVehicleAnim
    );

    if (!inStudio && position) {
      root.position.set(position.x, position.y - PLAYER_EYE_HEIGHT, position.z);
    } else if (inStudio) {
      if (studioPos) {
        root.position.set(studioPos.x || 0, studioPos.y || 0, studioPos.z || 0);
      } else {
        root.position.set(0, 0, 0);
      }
      root.rotation.y = studioYaw || 0;
    }

    // Smooth vertical holder offset for swimming (zero tilt-lift vertical bouncing while walking/running!)
    const targetHolderY = (!inStudio && isSwimming) ? (baseGroundY - 0.42) : baseGroundY;
    modelHolder.position.y += (targetHolderY - modelHolder.position.y) * Math.min(1, dt * 12.0);

    if (state.attackTimer > 0) {
      state.attackTimer = Math.max(0, state.attackTimer - dt);
    }
    if (state.emote && !inStudio) {
      state.emoteClock += dt;
      state.emoteTimer -= dt;
      if (state.emoteTimer <= 0) {
        state.emote = null;
      }
    }

    const dirLen = Math.hypot(moveDirX, moveDirZ);
    const horizSpeed = dirLen > 0.05 ? speed : 0;
    if (!inStudio) {
      if (isClimbing || isDiving || isSwimming || !grounded) {
        if (state.emote && state.emote !== 'sit') state.emote = null;
      } else if (state.emote && state.emote !== 'sit' && (horizSpeed > 0.45 && (state.emote !== 'pocket' || isSprinting))) {
        state.emote = null;
      }

      if (isVehicleAnim) {
        state.facingYaw = vehicleAnim.facingYaw ?? vehicleAnim.heading ?? state.facingYaw;
        modelHolder.rotation.z = 0;
        modelHolder.rotation.x = 0;
      } else if (isRidingRickshaw) {
        state.facingYaw = rickshawRide.heading;
        modelHolder.rotation.z = 0;
        modelHolder.rotation.x = 0;
      } else if (isRidingBike) {
        state.facingYaw = bikeRide.heading;
        modelHolder.rotation.z = 0;
        modelHolder.rotation.x = 0;
      } else if (isDrivingCar) {
        state.facingYaw = carDrive.heading;
        modelHolder.rotation.z = 0;
        modelHolder.rotation.x = 0;
      } else if (isLedgeHanging) {
        state.facingYaw = ledgeHang.yaw;
        modelHolder.rotation.z = 0;
        modelHolder.rotation.x = 0;
      } else if (isClimbing || isDiving) {
        // Keep facing toward climb/dive direction
      } else if (horizSpeed > 0.15) {
        state.walkCycle += dt * (isSprinting ? 10.5 : 7.2);
        const moveYaw = Math.atan2(moveDirX, moveDirZ);
        const yawDiff = wrapAngleDelta(moveYaw - state.facingYaw);
        state.facingYaw += yawDiff * Math.min(1, dt * 12.0);
        // Subtle, rock-steady sprint banking without jarring forward pitch wobble
        const speedFrac = THREE.MathUtils.clamp((horizSpeed - 1.5) / 6.0, 0, 1);
        const targetBank = THREE.MathUtils.clamp(-yawDiff * 0.18 * speedFrac, -0.10, 0.10);
        const targetFwdLean = (isSprinting ? 0.032 : 0.0) * speedFrac;
        modelHolder.rotation.z = THREE.MathUtils.lerp(modelHolder.rotation.z, targetBank, Math.min(1, dt * 8.0));
        modelHolder.rotation.x = THREE.MathUtils.lerp(modelHolder.rotation.x, targetFwdLean, Math.min(1, dt * 8.0));
      } else if (state.emote && state.emote !== 'sit' && state.cameraMode === 'back') {
        modelHolder.rotation.z = THREE.MathUtils.lerp(modelHolder.rotation.z, 0, Math.min(1, dt * 10.0));
        modelHolder.rotation.x = THREE.MathUtils.lerp(modelHolder.rotation.x, 0, Math.min(1, dt * 10.0));
      } else if (state.emote !== 'sit' && state.cameraMode === 'first') {
        const defaultFacing = yaw + Math.PI;
        state.facingYaw += wrapAngleDelta(defaultFacing - state.facingYaw) * Math.min(1, dt * 9.0);
        modelHolder.rotation.z = THREE.MathUtils.lerp(modelHolder.rotation.z, 0, Math.min(1, dt * 10.0));
        modelHolder.rotation.x = THREE.MathUtils.lerp(modelHolder.rotation.x, 0, Math.min(1, dt * 10.0));
      } else {
        modelHolder.rotation.z = THREE.MathUtils.lerp(modelHolder.rotation.z, 0, Math.min(1, dt * 10.0));
        modelHolder.rotation.x = THREE.MathUtils.lerp(modelHolder.rotation.x, 0, Math.min(1, dt * 10.0));
      }
      root.rotation.y = state.facingYaw;
    }

    if (!state.loaded || !mixer) return;

    let targetClip = 'Idle';
    let targetScale = 1.0;
    let loopOnce = false;
    let fadeTime = 0.16;

    if (inStudio) {
      const a = state.studioAnim || 'idle';
      if (state.attackTimer > 0) {
        const idx = (state.attackType + 3) % 4;
        targetClip = idx === 3 ? 'Kick2' : idx === 2 ? 'Kick' : idx === 1 ? 'PunchR' : 'PunchL';
        loopOnce = true;
      } else if (a === 'walk') {
        targetClip = 'Walk';
      } else if (a === 'run') {
        targetClip = 'Run';
      } else if (a === 'jump') {
        targetClip = 'Jump';
      } else if (a === 'fight') {
        targetClip = 'Combo';
      } else {
        targetClip = EMOTE_CLIP_MAP[a] || 'Idle';
      }
      // In Studio, always loop previews so the user can inspect Climb/Fall/JumpDown/Dive/Flip continuously!
      loopOnce = state.attackTimer > 0;
    } else if (isClimbing) {
      targetClip = 'Climb';
      targetScale = 1.25;
      fadeTime = 0.10;
      idleStillClock = 0;
    } else if (isDiving) {
      targetClip = 'Dive';
      targetScale = 1.15;
      loopOnce = true;
      fadeTime = 0.08;
      idleStillClock = 0;
    } else if (isSwimming) {
      targetClip = 'Swim';
      targetScale = horizSpeed > 0.25 ? 1.15 : 0.65;
      fadeTime = 0.20;
      idleStillClock = 0;
    } else if (!grounded) {
      idleStillClock = 0;
      if (isFlipping && actions.Flip) {
        targetClip = 'Flip';
        targetScale = 1.35;
        loopOnce = true;
        fadeTime = 0.08;
      } else if (isFalling && actions.Fall) {
        targetClip = 'Fall';
        targetScale = 1.05;
        fadeTime = 0.14;
      } else {
        targetClip = 'Jump';
        targetScale = 1.1;
        fadeTime = 0.10;
      }
    } else if (landRecoveryClip && actions[landRecoveryClip]) {
      targetClip = landRecoveryClip;
      targetScale = 1.12;
      loopOnce = true;
      fadeTime = 0.08;
      idleStillClock = 0;
    } else if (state.attackTimer > 0) {
      const idx = (state.attackType + 3) % 4;
      targetClip = idx === 3 ? 'Kick2' : idx === 2 ? 'Kick' : idx === 1 ? 'PunchR' : 'PunchL';
      loopOnce = true;
      fadeTime = 0.08;
      idleStillClock = 0;
    } else if (state.emote === 'sit') {
      targetClip = 'Sit';
      idleStillClock = 0;
    } else if (customClip) {
      idleStillClock = 0;
      targetClip = typeof customClip === 'string' ? customClip : (customClip.name || 'Idle');
      loopOnce = typeof customClip === 'object' ? Boolean(customClip.loopOnce) : false;
      targetScale = (typeof customClip === 'object' && customClip.timeScale) ? customClip.timeScale : 1.0;
      fadeTime = 0.16;
    } else if (horizSpeed > 0.18) {
      idleStillClock = 0;
      const sprint = isSprinting || horizSpeed > maxSpeed * 1.06;
      targetClip = sprint ? 'Run' : 'Walk';
      const refSpeed = sprint ? Math.max(maxSpeed * 1.45, 6.4) : Math.max(maxSpeed * 0.92, 3.8);
      targetScale = Math.min(1.42, Math.max(0.70, horizSpeed / refSpeed));
    } else if (state.emote && EMOTE_CLIP_MAP[state.emote]) {
      idleStillClock = 0;
      targetClip = EMOTE_CLIP_MAP[state.emote];
      loopOnce = ONCE_CLIPS.has(targetClip) && state.emote !== 'combo';
    } else {
      // Gently look around naturally after standing idle > 5.5s
      idleStillClock += dt;
      const cycle = idleStillClock % 14.0;
      targetClip = (cycle > 5.5 && cycle < 11.5 && actions.IdleLook) ? 'IdleLook' : 'Idle';
      fadeTime = 0.35;
    }

    const needsCleanIdleReset = isRidingRickshaw
      || isRidingBike
      || isDrivingCar
      || isLedgeHanging
      || (isVehicleAnim && (vehicleAnim.type === 'rickshaw_mount_driver' || vehicleAnim.type === 'rickshaw_dismount_driver' || vehicleAnim.type === 'bike_mount' || vehicleAnim.type === 'bike_dismount'));

    if (isVehicleAnim) {
      if (vehicleAnim.clip) {
        targetClip = vehicleAnim.clip;
        targetScale = vehicleAnim.timeScale ?? 1.0;
        loopOnce = Boolean(vehicleAnim.loopOnce);
        fadeTime = 0.0;
      }
    } else if (isRidingRickshaw) {
      if (rickshawRide.seat === 'passenger') {
        targetClip = 'Sit';
        targetScale = 0.45;
        loopOnce = false;
        fadeTime = 0.0;
      } else {
        targetClip = 'Idle';
        targetScale = 1.0;
        loopOnce = false;
        fadeTime = 0.0;
      }
    } else if (isDrivingCar) {
      targetClip = 'Idle';
      targetScale = 1.0;
      loopOnce = false;
      fadeTime = 0.0;
    }

    if (needsCleanIdleReset) {
      mixer.stopAllAction();
      activeAction = null;
      activeClipName = null;
    } else {
      playClip(targetClip, {
        fade: fadeTime,
        loopOnce,
        timeScale: targetScale,
      });
      if (activeAction) {
        activeAction.timeScale = targetScale;
      }
      mixer.update(dt);
      // Lock root horizontal drift in armature upright space (ignoring dynamic sprint lean/bank tilt) so sprinting/turning NEVER sinks the character into the ground!
      if (hipsBone && hipsBone.parent && !isVehicleAnim && !isRidingRickshaw && !isRidingBike && !isDrivingCar) {
        _hipsDelta.copy(hipsBone.position).sub(restHipsPos);
        const vert = _hipsDelta.dot(restHipsUpLocal);
        hipsBone.position.copy(restHipsPos).addScaledVector(restHipsUpLocal, vert);
      }
      // Real-time shoe-sole anti-sinking floor guard: keeps both soles cleanly ON TOP of asphalt during Idle, Walk, Run & IdleLook!
      if (grounded && !isSwimming && !inStudio && !isVehicleAnim && !isRidingRickshaw && !isRidingBike && !isDrivingCar && !isLedgeHanging && state.emote !== 'sit' && leftFoot && rightFoot) {
        root.updateMatrixWorld(true);
        leftFoot.getWorldPosition(_footCheckL);
        rightFoot.getWorldPosition(_footCheckR);
        const minSoleY = Math.min(_footCheckL.y, _footCheckR.y) - calibratedFootToSole;
        const roadFloorY = root.position.y + 0.0045;
        if (minSoleY < roadFloorY) {
          const lift = Math.min(0.12, roadFloorY - minSoleY);
          modelHolder.position.y += lift;
        }
      }
    }

    if (isVehicleAnim) {
      idleFootDownBlend = 0;
      reverseWalkBlend = 0;
      applyVehicleAnimPose(vehicleAnim);
      lockHeadAndNeckStraight();
    } else if (isRidingRickshaw) {
      applyRickshawRidingPose(rickshawRide, dt);
    } else if (isRidingBike) {
      applyBikeRidingPose(bikeRide, dt);
    } else if (isDrivingCar) {
      idleFootDownBlend = 0;
      reverseWalkBlend = 0;
      applyCarDrivingPose(carDrive);
    } else if (isLedgeHanging) {
      idleFootDownBlend = 0;
      reverseWalkBlend = 0;
      applyLedgeHangPose(ledgeHang);
    } else {
      idleFootDownBlend = 0;
      reverseWalkBlend = 0;
    }

    // Fast GTA V-style pocket draw/stow + single-hand Burgundy iPhone 18 Pro Max hold + right-thumb scrolling + direct gaze!
    const canHoldPhone = !inStudio && !isRidingRickshaw && !isRidingBike && !isDrivingCar && !isVehicleAnim && !isLedgeHanging;
    const wantPhoneOut = phoneActive && canHoldPhone;
    const prevDraw = phoneDrawBlend;
    if (wantPhoneOut) {
      // Snappy ~0.30s GTA V pocket draw (fast, smooth, never jerky!)
      phoneDrawBlend = Math.min(1, phoneDrawBlend + dt * 3.35);
    } else if (canHoldPhone && phoneDrawBlend > 0) {
      // Crisp ~0.24s pocket stow when closing [P]
      phoneDrawBlend = Math.max(0, phoneDrawBlend - dt * 4.2);
    } else {
      phoneDrawBlend = 0;
    }
    if (phoneTapTimer > 0) phoneTapTimer = Math.max(0, phoneTapTimer - dt);
    if (wantPhoneOut) phoneScrollClock += dt;

    const phoneAnimActive = phoneDrawBlend > 0.005 && canHoldPhone;
    if (handheldPhoneMesh) {
      // Appears right as the right hand pulls out of the pocket (blend >= 0.28) and hides cleanly as it enters pocket!
      const showMesh = phoneAnimActive && phoneDrawBlend >= 0.28;
      if (handheldPhoneMesh.visible !== showMesh) handheldPhoneMesh.visible = showMesh;
      if (showMesh) {
        const popT = THREE.MathUtils.clamp((phoneDrawBlend - 0.28) / 0.26, 0, 1);
        const sc = THREE.MathUtils.lerp(0.84, 1.0, popT * (2 - popT));
        handheldPhoneMesh.scale.setScalar(sc);
      }
    }

    if (phoneAnimActive && spine2Bone && hipsBone && rightArm && rightForeArm && rightHand) {
      root.updateMatrixWorld(true);
      const h = state.facingYaw || 0;
      ikFwd.set(Math.sin(h), 0, Math.cos(h));
      ikRight.set(Math.cos(h), 0, -Math.sin(h)); // +ikRight = character's LEFT, -ikRight = character's RIGHT!

      // Capture the animated natural wrist position before IK so draw-in & stow-out blend seamlessly (zero snap/glitch!)
      rightHand.getWorldPosition(phoneRestWristPos);

      // Right trouser/panjabi pocket position
      hipsBone.getWorldPosition(phonePocketPos);
      phonePocketPos.addScaledVector(ikRight, -0.19).addScaledVector(ikFwd, 0.06);
      phonePocketPos.y -= 0.07;

      // Natural GTA V upright chest-level smartphone hold (high enough in frame to clearly see phone & hand!)
      spine2Bone.getWorldPosition(phoneHoldTarget);
      phoneHoldTarget.addScaledVector(ikFwd, 0.34).addScaledVector(ikRight, -0.07);
      phoneHoldTarget.y += 0.03;

      // Two-stage GTA V trajectory:
      // Stage 1 (0.00 -> 0.30): right hand dips briskly to right pocket
      // Stage 2 (0.30 -> 1.00): right hand sweeps out & up in a clean natural arc to reading height (zero torso clipping!)
      if (phoneDrawBlend < 0.30) {
        const u = phoneDrawBlend / 0.30;
        const e = u * u * (3 - 2 * u);
        phoneCurrTarget.lerpVectors(phoneRestWristPos, phonePocketPos, e);
      } else {
        const u = (phoneDrawBlend - 0.30) / 0.70;
        const easeOut = 1 - Math.pow(1 - u, 3);
        phoneCurrTarget.lerpVectors(phonePocketPos, phoneHoldTarget, easeOut);
        // Subtle outward sweep around hip/chest as phone clears pocket
        const arcOut = Math.sin(u * Math.PI);
        phoneCurrTarget.addScaledVector(ikRight, -0.055 * arcOut);
        phoneCurrTarget.addScaledVector(ikFwd, 0.045 * arcOut);
      }

      // Natural relaxed elbow pole slightly out to the right & down
      ikPole.copy(phoneCurrTarget).addScaledVector(ikRight, -0.26).addScaledVector(ikFwd, -0.16);
      ikPole.y -= 0.36;
      solveTwoBoneIK(rightArm, rightForeArm, rightHand, phoneCurrTarget, ikPole);

      // Orient RightHand in TRUE WORLD SPACE using exact calibrated rightHandLocalBasisInv
      // so palm faces cleanly UP & BACK toward the character's eyes (zero wrist twist or clipping!)
      const holdWeight = THREE.MathUtils.clamp((phoneDrawBlend - 0.25) / 0.55, 0, 1);
      if (holdWeight > 0.01 && rightHand.parent) {
        const smoothW = holdWeight * holdWeight * (3 - 2 * holdWeight);
        rightHand.parent.updateWorldMatrix(true, false);
        rightHand.updateMatrixWorld(false);
        rightHand.parent.getWorldQuaternion(_hgParentQ);

        // Hold phone UPRIGHT in the cupped fold of the right palm (NOT flat from underneath!):
        // Pinky side (+wX) -> character's left (+ikRight) turned naturally inward toward chest center
        _hgX.copy(ikRight).multiplyScalar(0.90).addScaledVector(ikFwd, 0.42).normalize();
        // Back of hand (+wZ) -> mostly forward (+0.88) & slightly down (-0.46) so phone stands UPRIGHT (~63 deg)
        // with glowing screen (-wZ) facing cleanly back & slightly up into the character's eyes!
        _hgZ.copy(ikFwd).multiplyScalar(0.88);
        _hgZ.y -= 0.46;
        _hgZ.addScaledVector(_hgX, -_hgZ.dot(_hgX)).normalize();
        // Wrist -> fingertips (+wY) = wZ × wX -> UPRIGHT (+0.88 Y, +0.46 Fwd)!
        _hgY.crossVectors(_hgZ, _hgX).normalize();
        _hgZ.crossVectors(_hgX, _hgY).normalize();

        _hgMat.makeBasis(_hgX, _hgY, _hgZ);
        if (hasRightHandBasis) {
          _hgMat.multiply(rightHandLocalBasisInv);
        }
        _hgWorldQ.setFromRotationMatrix(_hgMat);
        qTempA.copy(_hgParentQ).invert().multiply(_hgWorldQ);
        rightHand.quaternion.slerp(qTempA, smoothW);

        // Gently cradle the rear & left edge of the Burgundy iPhone with right 4 fingers (zero screen clipping!)
        for (let i = 0; i < phoneGripFingersR.length; i++) {
          const f = phoneGripFingersR[i];
          eulerTemp.set(f.angle * smoothW, 0, 0);
          qTempB.setFromEuler(eulerTemp);
          qTempA.copy(f.restQ).multiply(qTempB);
          f.bone.quaternion.slerp(qTempA, smoothW);
        }

        // Live Right-Thumb scrolling & tapping directly on the glowing iPhone screen!
        // Idle: smooth natural thumb micro-scroll across screen; Button press (triggerPhoneTap): crisp thumb tap + swipe!
        const idleScroll = Math.sin(phoneScrollClock * 2.6) * 0.14 + Math.sin(phoneScrollClock * 5.8) * 0.05;
        const tapPulse = phoneTapTimer > 0 ? Math.sin((phoneTapTimer / 0.30) * Math.PI) : 0;
        const thumbSweepZ = (0.34 + idleScroll * 0.55 + tapPulse * 0.24) * smoothW;
        const thumbPressX = (0.32 + Math.max(0, Math.sin(phoneScrollClock * 2.6 - 0.5)) * 0.16 + tapPulse * 0.42) * smoothW;
        const thumbTipX = (0.36 + tapPulse * 0.48) * smoothW;
        if (rightThumb1) {
          eulerTemp.set(thumbPressX * 0.35, 0, thumbSweepZ);
          qTempB.setFromEuler(eulerTemp);
          rightThumb1.quaternion.copy(restRightThumb1Q).multiply(qTempB);
        }
        if (rightThumb2) {
          eulerTemp.set(thumbPressX, 0, 0);
          qTempB.setFromEuler(eulerTemp);
          rightThumb2.quaternion.copy(restRightThumb2Q).multiply(qTempB);
        }
        if (rightThumb3) {
          eulerTemp.set(thumbTipX, 0, 0);
          qTempB.setFromEuler(eulerTemp);
          rightThumb3.quaternion.copy(restRightThumb3Q).multiply(qTempB);
        }
      }

      // Direct world-space downward gaze directly at the glowing iPhone 18 Pro Max screen (zero sideways tilt!)
      const gazeW = THREE.MathUtils.clamp((phoneDrawBlend - 0.15) / 0.65, 0, 1);
      const gazeSmooth = gazeW * gazeW * (3 - 2 * gazeW);
      if (gazeSmooth > 0.01) {
        applyWorldBoneDelta(neckBone, restNeckQ, h, 0.25 * gazeSmooth, -0.08 * gazeSmooth, 0);
        applyWorldBoneDelta(headBone, restHeadQ, h, 0.34 * gazeSmooth, -0.10 * gazeSmooth, 0);
      }
    } else if (prevDraw > 0 && !phoneAnimActive) {
      // Cleanly restore right thumb & finger bones on the frame stowing completes
      for (let i = 0; i < phoneGripFingersR.length; i++) {
        phoneGripFingersR[i].bone.quaternion.copy(phoneGripFingersR[i].restQ);
      }
      if (rightThumb1) rightThumb1.quaternion.copy(restRightThumb1Q);
      if (rightThumb2) rightThumb2.quaternion.copy(restRightThumb2Q);
      if (rightThumb3) rightThumb3.quaternion.copy(restRightThumb3Q);
    }

    if (root.visible) {
      applyProceduralHeadAndFace(dt, Boolean(isRidingRickshaw || isRidingBike || isDrivingCar || isVehicleAnim || phoneAnimActive));
      if (isVehicleAnim) {
        lockHeadAndNeckStraight();
      }
    }
  }

  function setPhoneInHand(visible) {
    phoneActive = Boolean(visible);
    if (!phoneActive) phoneTapTimer = 0;
  }

  function triggerPhoneTap() {
    if (phoneActive) phoneTapTimer = 0.30;
  }

  return {
    root,
    state,
    morphMeshes,
    setPhoneInHand,
    triggerPhoneTap,
    triggerAttack,
    triggerEmote,
    setExpression,
    setSacredSilence,
    setTalking,
    toggleTalking,
    playVoiceClip,
    playCombatVoice,
    stopVoiceClip,
    isVoicePlaying,
    startMicLipSync,
    stopMicLipSync,
    toggleMicLipSync,
    connectAudioElement,
    setQualityMode,
    setEnvironmentMap,
    cycleCameraMode,
    getPickMeshes: () => meshEntries.map((m) => m.mesh),
    update,
  };
}
