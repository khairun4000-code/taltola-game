import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const MODEL_URL = './assets/player-bangladeshi.glb?v=v8clean';
const DRACO_PATH = './draco/gltf/';
const PLAYER_EYE_HEIGHT = 1.68;

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
export function createPlayerCharacter(scene, manager) {
  const root = new THREE.Group();
  root.name = 'PlayerCharacter';
  scene.add(root);

  const modelHolder = new THREE.Group();
  modelHolder.name = 'PlayerModelHolder';
  root.add(modelHolder);

  const state = {
    loaded: false,
    cameraMode: 'back',
    thirdPerson: true,
    studioAnim: 'idle',
    straightGaze: true,
    expression: 'normal',
    talking: false,
    micActive: false,
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
  let spineBone = null;
  let spine1Bone = null;
  let leftUpLeg = null;
  let leftLeg = null;
  let leftFoot = null;
  let rightUpLeg = null;
  let rightLeg = null;
  let rightFoot = null;
  let leftArm = null;
  let leftForeArm = null;
  let rightArm = null;
  let rightForeArm = null;
  const jawRestQ = new THREE.Quaternion();
  const lLidRestQ = new THREE.Quaternion();
  const rLidRestQ = new THREE.Quaternion();

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

  function setTalking(enabled) {
    state.talking = Boolean(enabled);
    if (state.talking && state.micActive) stopMicLipSync();
    return state.talking;
  }

  function toggleTalking() {
    return setTalking(!state.talking);
  }

  function setMorphWeights(targets, dt) {
    if (!morphMeshes.length) return;
    for (const key of ARKIT_MORPH_KEYS) {
      const tgt = THREE.MathUtils.clamp(targets[key] || 0, 0, 1);
      let atk = 19.0;
      let rel = 13.0;
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

  function applyMeshQuality(quality) {
    currentQuality = quality || 'high';
    const cast = currentQuality !== 'low';
    // Keep crisp PBR shader on the single player mesh even on Low Graphics (1 draw call = ~0.05ms, keeps 4K face crystal clear!)
    for (const entry of meshEntries) {
      entry.mesh.castShadow = cast && !entry.skipShadowCast;
      entry.mesh.receiveShadow = cast;
      entry.mesh.material = entry.pbrMat;
    }
  }

  function playClip(clipName, { fade = 0.16, loopOnce = false, timeScale = 1.0, restart = false } = {}) {
    const action = actions[clipName] || actions.Idle;
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

  loader.load(MODEL_URL, (gltf) => {
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
      if (srcMat.map) {
        srcMat.map.anisotropy = 4;
        srcMat.map.minFilter = THREE.LinearMipmapLinearFilter;
        srcMat.map.magFilter = THREE.LinearFilter;
        srcMat.map.needsUpdate = true;
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
    spineBone = findBoneBySuffix(model, 'Spine');
    spine1Bone = findBoneBySuffix(model, 'Spine1');
    leftUpLeg = findBoneBySuffix(model, 'LeftUpLeg');
    leftLeg = findBoneBySuffix(model, 'LeftLeg');
    leftFoot = findBoneBySuffix(model, 'LeftFoot');
    rightUpLeg = findBoneBySuffix(model, 'RightUpLeg');
    rightLeg = findBoneBySuffix(model, 'RightLeg');
    rightFoot = findBoneBySuffix(model, 'RightFoot');
    leftArm = findBoneBySuffix(model, 'LeftArm');
    leftForeArm = findBoneBySuffix(model, 'LeftForeArm');
    rightArm = findBoneBySuffix(model, 'RightArm');
    rightForeArm = findBoneBySuffix(model, 'RightForeArm');
    if (jawBone) jawRestQ.copy(jawBone.quaternion);
    if (lLidTop) lLidRestQ.copy(lLidTop.quaternion);
    if (rLidTop) rLidRestQ.copy(rLidTop.quaternion);

    mixer = new THREE.AnimationMixer(model);
    for (const clip of gltf.animations) {
      actions[clip.name] = mixer.clipAction(clip);
    }

    playClip('Idle', { fade: 0.01 });
    mixer.update(0);

    // Preserve Blender's Z=0 shoe-sole grounding
    const box = new THREE.Box3().setFromObject(model);
    if (Number.isFinite(box.min.y) && Math.abs(box.min.y) < 0.08) {
      baseGroundY = -box.min.y;
      modelHolder.position.y = baseGroundY;
    }

    applyMeshQuality(currentQuality);
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
    const nextKind = kind !== null ? kind : state.attackType % 4;
    state.attackType = (nextKind + 1) % 4;
    state.attackTimer = nextKind >= 2 ? 0.68 : 0.46;
    state.emote = null;
    if (mixer) {
      const clipName = nextKind === 3 ? 'Kick2' : nextKind === 2 ? 'Kick' : nextKind === 1 ? 'PunchR' : 'PunchL';
      playClip(clipName, { fade: 0.08, loopOnce: true, restart: true });
    }
    return nextKind;
  }

  function triggerEmote(emoteName, cameraYaw = null) {
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
    return state.emote;
  }

  function setExpression(nextExpr) {
    state.expression = nextExpr || 'normal';
    return state.expression;
  }

  function applyProceduralHeadAndFace(dt) {
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

    // 4-Band Formant FFT Live Mic / Audio Lip-Sync -> Full Apple ARKit Visemes!
    let audioDriven = false;
    if ((state.micActive || externalAudioSource) && audioAnalyser && audioFreqData) {
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

      if (energy > 0.042) {
        audioDriven = true;
        const norm = THREE.MathUtils.clamp((energy - 0.042) * 3.1, 0, 1);
        const f1Open = THREE.MathUtils.clamp((mid1 * 0.75 + low * 0.45) * 2.2, 0, 1);
        const roundO = THREE.MathUtils.clamp((low - mid2 * 1.15) * 2.8, 0, 1);
        const wideE  = THREE.MathUtils.clamp((mid2 - low * 0.55) * 2.8, 0, 1);
        const fric   = THREE.MathUtils.clamp((high - low * 0.40) * 3.8, 0, 1);

        m.jawOpen = Math.min(0.60, norm * (0.28 + f1Open * 0.34));
        const ld = Math.min(0.32, m.jawOpen * 0.50);
        const uu = Math.min(0.28, norm * 0.14 + wideE * 0.16 + fric * 0.16);
        m.mouthLowerDownLeft = ld;
        m.mouthLowerDownRight = ld;
        m.mouthUpperUpLeft = uu;
        m.mouthUpperUpRight = uu;
        m.mouthFunnel = roundO * norm * 0.72;
        m.mouthPucker = Math.max(0, roundO - 0.32) * norm * 0.70;
        m.mouthStretchLeft = wideE * norm * 0.56;
        m.mouthStretchRight = wideE * norm * 0.56;
        m.mouthRollLower = fric * norm * 0.72;
        m.mouthShrugLower = (roundO * 0.25 + fric * 0.22) * norm;
        m.mouthSmileLeft = 0.08 + wideE * norm * 0.22;
        m.mouthSmileRight = 0.06 + wideE * norm * 0.20;
        m.browInnerUp = THREE.MathUtils.clamp((norm - 0.32) * 0.65, 0, 0.44);
        m.browOuterUpLeft = m.browInnerUp * 0.45;
        m.browOuterUpRight = m.browInnerUp * 0.45;
        m.cheekSquintLeft = norm * 0.16;
        m.cheekSquintRight = norm * 0.16;
        speechStress = norm;
      } else if (state.micActive) {
        audioDriven = true;
        if (prevAudioEnergy > 0.07) {
          m.mouthClose = 0.48;
          m.mouthPressLeft = 0.56;
          m.mouthPressRight = 0.56;
        }
      }
      prevAudioEnergy = energy;
    }

    // Co-Articulated Natural Human Phoneme Timeline (when Talk toggle OR PhoneCall is active!)
    const isAutoTalking = !audioDriven && (state.talking || activeClipName === 'PhoneCall');
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

      const usedKeys = new Set([...Object.keys(curPose), ...Object.keys(nxtPose)]);
      for (const k of usedKeys) {
        const v0 = curPose[k] || 0;
        const v1 = nxtPose[k] || 0;
        m[k] = v0 + (v1 - v0) * sBlend;
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

    if (headBone && neckBone) {
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

  function applyRickshawRidingPose(ride) {
    if (!ride || !ride.active) return;
    const phase = ride.pedalPhase || 0;
    const steer = ride.steerAngle || 0;
    const moveFactor = Math.min(1, Math.abs(ride.speed || 0) / 1.5);

    // Slight forward lean toward the handlebars + subtle rhythmic pedaling sway
    const sway = Math.sin(phase) * 0.045 * moveFactor;
    if (spineBone) {
      eulerTemp.set(0.18, -steer * 0.14, sway);
      qTempA.setFromEuler(eulerTemp);
      spineBone.quaternion.multiply(qTempA);
    }
    if (spine1Bone) {
      eulerTemp.set(0.14, -steer * 0.10, sway * 0.5);
      qTempA.setFromEuler(eulerTemp);
      spine1Bone.quaternion.multiply(qTempA);
    }

    // Synchronized 2-bone cycling leg motion matched 1:1 with Crank_Assembly (Pedal_L at phase, Pedal_R at phase + PI)
    const pL = phase;
    const pR = phase + Math.PI;
    const hipL = -1.02 + 0.44 * Math.sin(pL) - 0.14 * Math.cos(pL);
    const kneeL = 1.12 - 0.62 * Math.sin(pL) + 0.16 * Math.cos(pL);
    const footL = -(hipL + kneeL) * 0.42 + 0.22;

    const hipR = -1.02 + 0.44 * Math.sin(pR) - 0.14 * Math.cos(pR);
    const kneeR = 1.12 - 0.62 * Math.sin(pR) + 0.16 * Math.cos(pR);
    const footR = -(hipR + kneeR) * 0.42 + 0.22;

    if (leftUpLeg) {
      eulerTemp.set(hipL, 0.06, -0.08);
      qTempA.setFromEuler(eulerTemp);
      leftUpLeg.quaternion.multiply(qTempA);
    }
    if (leftLeg) {
      eulerTemp.set(kneeL, 0, 0);
      qTempA.setFromEuler(eulerTemp);
      leftLeg.quaternion.multiply(qTempA);
    }
    if (leftFoot) {
      eulerTemp.set(footL, 0, 0);
      qTempA.setFromEuler(eulerTemp);
      leftFoot.quaternion.multiply(qTempA);
    }
    if (rightUpLeg) {
      eulerTemp.set(hipR, -0.06, 0.08);
      qTempA.setFromEuler(eulerTemp);
      rightUpLeg.quaternion.multiply(qTempA);
    }
    if (rightLeg) {
      eulerTemp.set(kneeR, 0, 0);
      qTempA.setFromEuler(eulerTemp);
      rightLeg.quaternion.multiply(qTempA);
    }
    if (rightFoot) {
      eulerTemp.set(footR, 0, 0);
      qTempA.setFromEuler(eulerTemp);
      rightFoot.quaternion.multiply(qTempA);
    }

    // Both arms reaching forward to hold the green rickshaw handlebars, tracking steering smoothly
    if (leftArm) {
      eulerTemp.set(-0.92 + steer * 0.18, 0.10, -0.18);
      qTempA.setFromEuler(eulerTemp);
      leftArm.quaternion.multiply(qTempA);
    }
    if (leftForeArm) {
      eulerTemp.set(-0.28, 0.18, 0);
      qTempA.setFromEuler(eulerTemp);
      leftForeArm.quaternion.multiply(qTempA);
    }
    if (rightArm) {
      eulerTemp.set(-0.92 - steer * 0.18, -0.10, 0.18);
      qTempA.setFromEuler(eulerTemp);
      rightArm.quaternion.multiply(qTempA);
    }
    if (rightForeArm) {
      eulerTemp.set(-0.28, -0.18, 0);
      qTempA.setFromEuler(eulerTemp);
      rightForeArm.quaternion.multiply(qTempA);
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
    hideMesh = false,
    rickshawRide = null,
  }) {
    const dt = Math.min(Math.max(delta || 0.016, 0.001), 0.05);
    const isRidingRickshaw = Boolean(rickshawRide && rickshawRide.active);
    const shouldShow = !hideMesh && (inStudio || isRidingRickshaw || state.cameraMode !== 'first');
    root.visible = shouldShow;

    if (!inStudio && position) {
      root.position.set(position.x, position.y - PLAYER_EYE_HEIGHT, position.z);
    } else if (inStudio) {
      root.position.set(0, 0, 0);
      root.rotation.y = 0;
    }

    // Smooth vertical holder offset for horizontal swimming so head & swimming arms sit cleanly on the water surface
    const targetHolderY = (!inStudio && isSwimming) ? (baseGroundY - 0.42) : baseGroundY;
    modelHolder.position.y += (targetHolderY - modelHolder.position.y) * Math.min(1, dt * 10.0);

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

    const horizSpeed = Math.hypot(moveDirX, moveDirZ) * speed;
    if (!inStudio) {
      if (isClimbing || isDiving || isSwimming || !grounded) {
        if (state.emote && state.emote !== 'sit') state.emote = null;
      } else if (state.emote && state.emote !== 'sit' && (horizSpeed > 0.45 && (state.emote !== 'pocket' || isSprinting))) {
        state.emote = null;
      }

      if (isRidingRickshaw) {
        state.facingYaw = rickshawRide.heading;
      } else if (isClimbing || isDiving) {
        // Keep facing toward climb/dive direction
      } else if (horizSpeed > 0.15) {
        state.walkCycle += dt * (isSprinting ? 10.5 : 7.2);
        const moveYaw = Math.atan2(moveDirX, moveDirZ);
        state.facingYaw += wrapAngleDelta(moveYaw - state.facingYaw) * Math.min(1, dt * 12.0);
      } else if (state.emote && state.emote !== 'sit' && state.cameraMode === 'back') {
        // Keep facing toward camera while emoting
      } else if (state.emote !== 'sit') {
        const defaultFacing = yaw + Math.PI;
        state.facingYaw += wrapAngleDelta(defaultFacing - state.facingYaw) * Math.min(1, dt * 9.0);
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

    if (isRidingRickshaw) {
      if (rickshawRide.seat === 'passenger') {
        targetClip = 'Sit';
        targetScale = 0.6;
        loopOnce = false;
        fadeTime = 0.12;
      } else {
        targetClip = 'Idle';
        targetScale = 0.25;
        loopOnce = false;
        fadeTime = 0.08;
      }
    }

    playClip(targetClip, {
      fade: fadeTime,
      loopOnce,
      timeScale: targetScale,
    });
    if (activeAction) {
      activeAction.timeScale = targetScale;
    }

    mixer.update(dt);
    if (isRidingRickshaw && rickshawRide.seat !== 'passenger') {
      applyRickshawRidingPose(rickshawRide);
    }
    applyProceduralHeadAndFace(dt);
  }

  return {
    root,
    state,
    morphMeshes,
    triggerAttack,
    triggerEmote,
    setExpression,
    setTalking,
    toggleTalking,
    startMicLipSync,
    stopMicLipSync,
    toggleMicLipSync,
    connectAudioElement,
    setQualityMode,
    cycleCameraMode,
    update,
  };
}
