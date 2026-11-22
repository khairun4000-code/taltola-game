import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { VOICE_CLIPS, VOICE_BUS } from './voice-clips.js';

const MODEL_URL = './assets/player-bangladeshi.glb?v=v8clean';
const DRACO_PATH = './draco/gltf/';
const PLAYER_EYE_HEIGHT = 1.68;

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
  let baseGroundY = 0;
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
  let phoneActive = false;
  let phoneTapTimer = 0;
  const phoneHoldTarget = new THREE.Vector3();
  const phoneTapTarget = new THREE.Vector3();
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
  const restRightArmQ = new THREE.Quaternion();
  const restRightForeArmQ = new THREE.Quaternion();

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
      const phoneGroup = new THREE.Group();
      phoneGroup.name = 'HandheldSmartphoneProp';
      // Realistic flagship titanium chassis + glass OLED screen + triple-lens rear camera island
      const chassisMat = new THREE.MeshStandardMaterial({ color: 0x1e2530, roughness: 0.22, metalness: 0.88 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.076, 0.156, 0.0095), chassisMat);
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 128; pCanvas.height = 256;
      const pCtx = pCanvas.getContext('2d');
      const grd = pCtx.createLinearGradient(0, 0, 128, 256);
      grd.addColorStop(0, '#0f172a'); grd.addColorStop(0.45, '#0ea5e9'); grd.addColorStop(1, '#10b981');
      pCtx.fillStyle = grd; pCtx.fillRect(0, 0, 128, 256);
      pCtx.fillStyle = '#020617'; pCtx.fillRect(42, 8, 44, 10);
      pCtx.fillStyle = '#ffffff'; pCtx.font = 'bold 24px sans-serif'; pCtx.textAlign = 'center'; pCtx.fillText('12:00', 64, 58);
      const iconCols = ['#22c55e', '#38bdf8', '#f472b6', '#f59e0b', '#a855f7', '#ef4444'];
      for (let i = 0; i < 6; i++) {
        pCtx.fillStyle = iconCols[i];
        pCtx.fillRect(16 + (i % 3) * 36, 92 + Math.floor(i / 3) * 40, 24, 24);
      }
      pCtx.fillStyle = 'rgba(255,255,255,0.45)'; pCtx.fillRect(36, 238, 56, 4);
      const screenTex = new THREE.CanvasTexture(pCanvas);
      screenTex.colorSpace = THREE.SRGBColorSpace;
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.068, 0.144),
        new THREE.MeshBasicMaterial({ map: screenTex }),
      );
      screen.position.z = 0.0052;
      const camIsland = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, 0.034, 0.003),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25, metalness: 0.7 }),
      );
      camIsland.position.set(-0.017, 0.052, -0.0055);
      const lensMat = new THREE.MeshStandardMaterial({ color: 0x05080f, roughness: 0.08, metalness: 0.95 });
      for (const [lx, ly] of [[-0.007, 0.008], [-0.007, -0.008], [0.007, 0.0]]) {
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.003, 12), lensMat);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(lx, ly, -0.0018);
        camIsland.add(lens);
      }
      const flash = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0028, 0.0028, 0.0025, 10),
        new THREE.MeshBasicMaterial({ color: 0xfef3c7 }),
      );
      flash.rotation.x = Math.PI / 2;
      flash.position.set(0.007, 0.010, -0.0016);
      camIsland.add(flash);
      phoneGroup.add(body, screen, camIsland);
      phoneGroup.position.set(0.012, 0.068, 0.028);
      phoneGroup.rotation.set(-0.98, 0.14, 0.06);
      phoneGroup.visible = false;
      rightHand.add(phoneGroup);
      handheldPhoneMesh = phoneGroup;
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
    if (rightArm) restRightArmQ.copy(rightArm.quaternion);
    if (rightForeArm) restRightForeArmQ.copy(rightForeArm.quaternion);

    // Preserve Blender's Z=0 shoe-sole grounding
    const box = new THREE.Box3().setFromObject(model);
    if (Number.isFinite(box.min.y) && Math.abs(box.min.y) < 0.08) {
      baseGroundY = -box.min.y;
      modelHolder.position.y = baseGroundY;
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
    const dist = THREE.MathUtils.clamp(rawDist, Math.abs(l1 - l2) + 0.02, (l1 + l2) * 0.992);
    ikDirAT.multiplyScalar(1 / rawDist);

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

    // 2. Rotate lowerBone in world space so C -> targetWorldPos
    upperBone.updateWorldMatrix(false, true);
    lowerBone.getWorldPosition(ikB);
    endBone.getWorldPosition(ikC);
    ikDirAB.subVectors(ikC, ikB).normalize();
    ikDirAK.subVectors(targetWorldPos, ikB).normalize();
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
    if (hipsBone) hipsBone.quaternion.copy(restHipsQ);
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
    if (rightArm) rightArm.quaternion.copy(restRightArmQ);
    if (rightForeArm) rightForeArm.quaternion.copy(restRightForeArmQ);
  }

  function lockHeadAndNeckStraight() {
    if (neckBone) neckBone.quaternion.copy(restNeckQ);
    if (headBone) headBone.quaternion.copy(restHeadQ);
  }

  function applyRickshawRidingPose(ride) {
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
      if (spineBone) {
        eulerTemp.set(isBikePass ? 0.06 : (isVanPass ? 0.04 : -0.08), 0, 0);
        qTempA.setFromEuler(eulerTemp);
        spineBone.quaternion.copy(restSpineQ).multiply(qTempA);
      }
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

    // 2. Natural riding posture: bicycle/van rider twists torso smoothly into turns so BOTH hands stay 100% locked on grips!
    const isBike = Boolean(ride.isBicycle);
    const isVan = Boolean(ride.isVan);
    const stand = THREE.MathUtils.clamp(ride.standingBlend || 0, 0, 1);
    const steerYaw = (isBike || isVan) ? THREE.MathUtils.clamp(ride.steerAngle || 0, -0.60, 0.60) : 0;
    const leanRoll = isBike ? THREE.MathUtils.clamp(ride.roll || 0, -0.25, 0.25) : 0;
    if (hipsBone && isBike && Math.abs(leanRoll) > 0.0005) {
      eulerTemp.set(0, 0, leanRoll);
      qTempA.setFromEuler(eulerTemp);
      hipsBone.quaternion.copy(restHipsQ).multiply(qTempA);
    }
    const bikeFwdLean = (isBike ? 0.30 : 0.22) + stand * 0.14 + Math.abs(steerYaw) * 0.14;
    if (spineBone) {
      eulerTemp.set(bikeFwdLean, steerYaw * 0.24, 0);
      qTempA.setFromEuler(eulerTemp);
      spineBone.quaternion.copy(restSpineQ).multiply(qTempA);
    }
    if (spine1Bone) {
      eulerTemp.set((isBike ? 0.14 : 0.10) + stand * 0.08, steerYaw * 0.28, 0);
      qTempA.setFromEuler(eulerTemp);
      spine1Bone.quaternion.copy(restSpine1Q).multiply(qTempA);
    }
    lockHeadAndNeckStraight();
    root.updateMatrixWorld(true);

    // 3. Seat hips directly covering the leather saddle (rises smoothly on [SHIFT] standing sprint!)
    ikTarget.copy(a.saddle).addScaledVector(ikFwd, stand * 0.10);
    ikTarget.y += 0.02 + stand * 0.22;
    alignHipsToWorldPoint(ikTarget);

    // 4. Exact 2-Bone World-Space IK: lock Left & Right shoes directly onto the spinning 3D Pedals!
    ikPole.copy(ikTarget).addScaledVector(ikFwd, 0.78).addScaledVector(ikRight, 0.18);
    ikPole.y += 0.12;
    solveTwoBoneIK(leftUpLeg, leftLeg, leftFoot, a.pedalL, ikPole);

    ikPole.copy(ikTarget).addScaledVector(ikFwd, 0.78).addScaledVector(ikRight, -0.18);
    ikPole.y += 0.12;
    solveTwoBoneIK(rightUpLeg, rightLeg, rightFoot, a.pedalR, ikPole);

    // 5. Exact 2-Bone World-Space IK: guarantee BOTH hands stay 100% glued directly onto the handlebar grips even at full steering lock!
    if (a.gripL && a.gripR && leftArm && leftForeArm && leftHand && rightArm && rightForeArm && rightHand) {
      const elbowFwd = isBike ? 0.12 : 0.14;
      const elbowOut = isBike ? 0.42 : 0.48;
      const elbowDrop = isBike ? 0.14 : 0.08;
      ikPole.copy(ikTarget).addScaledVector(ikFwd, elbowFwd).addScaledVector(ikRight, elbowOut);
      ikPole.y -= elbowDrop;
      solveTwoBoneIK(leftArm, leftForeArm, leftHand, a.gripL, ikPole);

      ikPole.copy(ikTarget).addScaledVector(ikFwd, elbowFwd).addScaledVector(ikRight, -elbowOut);
      ikPole.y -= elbowDrop;
      solveTwoBoneIK(rightArm, rightForeArm, rightHand, a.gripR, ikPole);
    }
    if (isBike) {
      const turnLook = THREE.MathUtils.clamp(steerYaw * 0.18, -0.15, 0.15);
      if (neckBone) {
        eulerTemp.set(-bikeFwdLean * 0.35, -steerYaw * 0.22 + turnLook * 0.4, -leanRoll * 0.25);
        qTempA.setFromEuler(eulerTemp);
        neckBone.quaternion.copy(restNeckQ).multiply(qTempA);
      }
      if (headBone) {
        eulerTemp.set(-bikeFwdLean * 0.55, -steerYaw * 0.25 + turnLook * 0.6, -leanRoll * 0.30);
        qTempA.setFromEuler(eulerTemp);
        headBone.quaternion.copy(restHeadQ).multiply(qTempA);
      }
    } else {
      lockHeadAndNeckStraight();
    }
  }

  function applyCarDrivingPose(cd) {
    if (!cd || !cd.active || !cd.anchors) return;
    const a = cd.anchors;
    const h = cd.heading || 0;
    ikFwd.set(Math.sin(h), 0, Math.cos(h));
    ikRight.set(Math.cos(h), 0, -Math.sin(h));

    // 1. Clean rest reset (zero drift/spin)
    resetUpperAndLimbBonesToRest();

    // 2. Natural reclined car-seat posture so driver sits deep inside the cabin below the roof
    if (spineBone) {
      eulerTemp.set(-0.16, 0, 0);
      qTempA.setFromEuler(eulerTemp);
      spineBone.quaternion.copy(restSpineQ).multiply(qTempA);
    }
    if (spine1Bone) {
      eulerTemp.set(-0.08, 0, 0);
      qTempA.setFromEuler(eulerTemp);
      spine1Bone.quaternion.copy(restSpine1Q).multiply(qTempA);
    }
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
    }

    // 6. Keep head & neck 100% straight forward while driving (never tilts sideways toward window)
    lockHeadAndNeckStraight();
  }

  function applyBikeRidingPose(bike) {
    if (!bike || !bike.active || !bike.anchors) return;
    const a = bike.anchors;
    const h = bike.heading || 0;
    ikFwd.set(Math.sin(h), 0, Math.cos(h));
    ikRight.set(Math.cos(h), 0, -Math.sin(h));

    // 1. Clean rest reset (symmetric motorcycle posture)
    resetUpperAndLimbBonesToRest();

    // 2. Natural motorcycle torso lean + smooth corner banking
    const leanRoll = THREE.MathUtils.clamp(bike.roll || 0, -0.40, 0.40);
    if (hipsBone) {
      eulerTemp.set(0, 0, leanRoll);
      qTempA.setFromEuler(eulerTemp);
      hipsBone.quaternion.copy(restHipsQ).multiply(qTempA);
    }
    const fwdLean = bike.sportLean ? 0.28 : 0.18;
    if (spineBone) {
      eulerTemp.set(fwdLean, 0, 0);
      qTempA.setFromEuler(eulerTemp);
      spineBone.quaternion.copy(restSpineQ).multiply(qTempA);
    }
    if (spine1Bone) {
      eulerTemp.set(fwdLean * 0.40, 0, 0);
      qTempA.setFromEuler(eulerTemp);
      spine1Bone.quaternion.copy(restSpine1Q).multiply(qTempA);
    }
    lockHeadAndNeckStraight();
    root.updateMatrixWorld(true);

    // 3. Seat hips firmly onto the motorcycle saddle
    ikTarget.copy(a.seat);
    alignHipsToWorldPoint(ikTarget);

    // 4. 2-Bone IK bending both knees forward & outward, locking both boots cleanly onto the footpegs (পাদানি)!
    ikPole.copy(a.seat).addScaledVector(ikFwd, 0.68).addScaledVector(ikRight, 0.32);
    ikPole.y += 0.08;
    solveTwoBoneIK(leftUpLeg, leftLeg, leftFoot, a.footL, ikPole);

    ikPole.copy(a.seat).addScaledVector(ikFwd, 0.68).addScaledVector(ikRight, -0.32);
    ikPole.y += 0.08;
    solveTwoBoneIK(rightUpLeg, rightLeg, rightFoot, a.footR, ikPole);

    // 5. 2-Bone IK locking Left & Right hands firmly onto the motorcycle handlebar grips!
    if (a.gripL && a.gripR && leftArm && leftForeArm && leftHand && rightArm && rightForeArm && rightHand) {
      ikPole.copy(a.seat).addScaledVector(ikFwd, 0.16).addScaledVector(ikRight, 0.50);
      ikPole.y += 0.04;
      solveTwoBoneIK(leftArm, leftForeArm, leftHand, a.gripL, ikPole);

      ikPole.copy(a.seat).addScaledVector(ikFwd, 0.16).addScaledVector(ikRight, -0.50);
      ikPole.y += 0.04;
      solveTwoBoneIK(rightArm, rightForeArm, rightHand, a.gripR, ikPole);
    }
    // 6. Keep head looking straight forward along the road (compensating torso forward lean)
    lockHeadAndNeckStraight();
    const turnLook = THREE.MathUtils.clamp((bike.steerAngle || 0) * 0.25, -0.20, 0.20);
    if (neckBone) {
      eulerTemp.set(-fwdLean * 0.45, turnLook * 0.35, -leanRoll * 0.25);
      qTempA.setFromEuler(eulerTemp);
      neckBone.quaternion.copy(restNeckQ).multiply(qTempA);
    }
    if (headBone) {
      eulerTemp.set(-fwdLean * 0.72, turnLook * 0.65, -leanRoll * 0.30);
      qTempA.setFromEuler(eulerTemp);
      headBone.quaternion.copy(restHeadQ).multiply(qTempA);
    }
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
      const u = va.type === 'bike_dismount' ? (1 - p) : p;
      const swingArc = Math.sin(u * Math.PI);
      if (spineBone) {
        eulerTemp.set(u * 0.22, 0, 0);
        qTempA.setFromEuler(eulerTemp);
        spineBone.quaternion.copy(restSpineQ).multiply(qTempA);
      }
      root.updateMatrixWorld(true);
      if (va.anchors) {
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
        if (u > 0.18 && leftArm && leftForeArm && leftHand && rightArm && rightForeArm && rightHand) {
          ikPole.copy(va.anchors.seat).addScaledVector(ikFwd, 0.16).addScaledVector(ikRight, 0.50);
          ikPole.y += 0.06;
          solveTwoBoneIK(leftArm, leftForeArm, leftHand, va.anchors.gripL, ikPole);
          ikPole.copy(va.anchors.seat).addScaledVector(ikFwd, 0.16).addScaledVector(ikRight, -0.50);
          ikPole.y += 0.06;
          solveTwoBoneIK(rightArm, rightForeArm, rightHand, va.anchors.gripR, ikPole);
        }
      }
      lockHeadAndNeckStraight();
    } else if (va.type === 'rickshaw_mount_driver' || va.type === 'rickshaw_dismount_driver') {
      resetUpperAndLimbBonesToRest();
      const u = va.type === 'rickshaw_dismount_driver' ? (1 - p) : p;
      const isBike = Boolean(va.isBicycle);
      if (spineBone) {
        eulerTemp.set(u * (isBike ? 0.26 : 0.22), 0, 0);
        qTempA.setFromEuler(eulerTemp);
        spineBone.quaternion.copy(restSpineQ).multiply(qTempA);
      }
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
        const elbowOut = isBike ? 0.42 : 0.50;
        const elbowY = isBike ? -0.14 : 0.12;
        ikPole.copy(va.anchors.saddle).addScaledVector(ikFwd, 0.12).addScaledVector(ikRight, elbowOut);
        ikPole.y += elbowY;
        solveTwoBoneIK(leftArm, leftForeArm, leftHand, va.anchors.gripL, ikPole);
        ikPole.copy(va.anchors.saddle).addScaledVector(ikFwd, 0.12).addScaledVector(ikRight, -elbowOut);
        ikPole.y += elbowY;
        solveTwoBoneIK(rightArm, rightForeArm, rightHand, va.anchors.gripR, ikPole);
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
      } else if (isRidingRickshaw) {
        state.facingYaw = rickshawRide.heading;
      } else if (isRidingBike) {
        state.facingYaw = bikeRide.heading;
      } else if (isDrivingCar) {
        state.facingYaw = carDrive.heading;
      } else if (isLedgeHanging) {
        state.facingYaw = ledgeHang.yaw;
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
    }

    if (isVehicleAnim) {
      applyVehicleAnimPose(vehicleAnim);
      lockHeadAndNeckStraight();
    } else if (isRidingRickshaw) {
      applyRickshawRidingPose(rickshawRide);
    } else if (isRidingBike) {
      applyBikeRidingPose(bikeRide);
    } else if (isDrivingCar) {
      applyCarDrivingPose(carDrive);
    } else if (isLedgeHanging) {
      applyLedgeHangPose(ledgeHang);
    }

    // Persistent right-hand smartphone hold + looking down at phone + left-hand finger-tap acting!
    const holdingPhoneNow = phoneActive && !inStudio && !isRidingRickshaw && !isRidingBike && !isDrivingCar && !isVehicleAnim;
    if (phoneTapTimer > 0) phoneTapTimer = Math.max(0, phoneTapTimer - dt);
    if (holdingPhoneNow && spine2Bone && rightArm && rightForeArm && rightHand) {
      root.updateMatrixWorld(true);
      const h = state.facingYaw || 0;
      ikFwd.set(Math.sin(h), 0, Math.cos(h));
      ikRight.set(Math.cos(h), 0, -Math.sin(h));
      spine2Bone.getWorldPosition(phoneHoldTarget);
      // Natural real-human chest-level phone hold (elbow relaxed at side, forearm raised cleanly in front of chest)
      phoneHoldTarget.addScaledVector(ikFwd, 0.34).addScaledVector(ikRight, -0.05);
      phoneHoldTarget.y -= 0.05;
      ikPole.copy(phoneHoldTarget).addScaledVector(ikRight, -0.26).addScaledVector(ikFwd, -0.14);
      ikPole.y -= 0.38;
      solveTwoBoneIK(rightArm, rightForeArm, rightHand, phoneHoldTarget, ikPole);

      // Natural gentle head & neck gaze down at the smartphone screen
      if (neckBone) {
        eulerTemp.set(0.14, -0.05, 0);
        qTempA.setFromEuler(eulerTemp);
        neckBone.quaternion.copy(restNeckQ).multiply(qTempA);
      }
      if (headBone) {
        eulerTemp.set(0.20, -0.06, 0);
        qTempA.setFromEuler(eulerTemp);
        headBone.quaternion.copy(restHeadQ).multiply(qTempA);
      }

      // Finger-tap acting: left hand gently lifts up to tap the phone screen whenever user presses a button!
      if (phoneTapTimer > 0 && leftArm && leftForeArm && leftHand) {
        const tapWave = Math.sin((phoneTapTimer / 0.28) * Math.PI);
        phoneTapTarget.copy(phoneHoldTarget)
          .addScaledVector(ikFwd, -0.01 - (1 - tapWave) * 0.07)
          .addScaledVector(ikRight, 0.04 + (1 - tapWave) * 0.12);
        phoneTapTarget.y += 0.03 - (1 - tapWave) * 0.10;
        ikPole.copy(phoneHoldTarget).addScaledVector(ikRight, 0.28).addScaledVector(ikFwd, -0.14);
        ikPole.y -= 0.36;
        solveTwoBoneIK(leftArm, leftForeArm, leftHand, phoneTapTarget, ikPole);
      }
    }

    if (root.visible) {
      applyProceduralHeadAndFace(dt, Boolean(isRidingRickshaw || isRidingBike || isDrivingCar || isVehicleAnim || holdingPhoneNow));
      if ((isRidingRickshaw && !rickshawRide.isBicycle) || isDrivingCar || isVehicleAnim) {
        lockHeadAndNeckStraight();
      }
    }
  }

  function setPhoneInHand(visible) {
    phoneActive = Boolean(visible);
    if (handheldPhoneMesh) handheldPhoneMesh.visible = phoneActive;
    if (!phoneActive) phoneTapTimer = 0;
  }

  function triggerPhoneTap() {
    if (phoneActive) phoneTapTimer = 0.28;
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
