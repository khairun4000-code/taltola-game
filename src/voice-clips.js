/**
 * Central registry for Huzzatullah & Sabit ElevenLabs MP3 voice lines,
 * plus a global one-by-one turn coordinator (VOICE_BUS) so both characters
 * NEVER talk over each other at the same time.
 */

const voiceBusState = {
  activeSpeaker: null,
  activeStopFn: null,
  cooldownUntil: 0,
};

export const VOICE_BUS = {
  get activeSpeaker() {
    return voiceBusState.activeSpeaker;
  },
  isAnySpeaking() {
    return Boolean(voiceBusState.activeSpeaker) || performance.now() < voiceBusState.cooldownUntil;
  },
  canSpeak(speakerId, { interruptSelf = false } = {}) {
    if (!voiceBusState.activeSpeaker) {
      return performance.now() >= voiceBusState.cooldownUntil || interruptSelf;
    }
    if (interruptSelf && voiceBusState.activeSpeaker === speakerId) {
      return true;
    }
    return false;
  },
  claim(speakerId, stopFn) {
    if (voiceBusState.activeSpeaker && voiceBusState.activeSpeaker !== speakerId) {
      return false;
    }
    voiceBusState.activeSpeaker = speakerId || 'unknown';
    voiceBusState.activeStopFn = stopFn || null;
    return true;
  },
  release(speakerId, stopFn = null, gapMs = 150) {
    if (
      voiceBusState.activeSpeaker === (speakerId || 'unknown')
      && (!stopFn || !voiceBusState.activeStopFn || voiceBusState.activeStopFn === stopFn)
    ) {
      voiceBusState.activeSpeaker = null;
      voiceBusState.activeStopFn = null;
      voiceBusState.cooldownUntil = performance.now() + gapMs;
    }
  },
  stopAll() {
    const fn = voiceBusState.activeStopFn;
    voiceBusState.activeSpeaker = null;
    voiceBusState.activeStopFn = null;
    voiceBusState.cooldownUntil = 0;
    try { fn?.(); } catch {}
  },
};

export const VOICE_CLIPS = {
  // 1) Huzzatullah angry reaction when Sabit punches or bothers him while standing calmly
  huzzatullahAnnoyed: [
    './assets/audio/huzzatullah_angry_01.mp3',
  ],

  // 2) Huzzatullah angry fighting voices (plays when Huzzatullah punches/kicks)
  huzzatullahFight: [
    ['./assets/audio/huzzatullah_fight_01.mp3'],
    ['./assets/audio/huzzatullah_fight_02.mp3'],
  ],

  // 3) Huzzatullah Funny Voices inside Huzzatullah's Blue iFruit Phone ([P])
  huzzatullahFunny: [
    {
      id: 'huzzatullah_funny_pacha',
      speakerId: 'kurta_blue',
      speakerName: 'হুজ্জাতুল্লাহ',
      title: '😂 একি রে, তোর পাছা দেখা যায় তো!',
      subtitle: 'হুজ্জাতুল্লাহ · ফানি ভয়েস ১',
      expression: 'happy',
      urls: ['./assets/audio/huzzatullah_funny_01.mp3'],
    },
    {
      id: 'huzzatullah_funny_pakhi',
      speakerId: 'kurta_blue',
      speakerName: 'হুজ্জাতুল্লাহ',
      title: '🐦 এ তোর পাখি কই? উড়ে গিয়েছে নাকি?',
      subtitle: 'হুজ্জাতুল্লাহ · ফানি ভয়েস ২',
      expression: 'happy',
      urls: ['./assets/audio/huzzatullah_funny_02.mp3'],
    },
  ],

  // 4) Sabit scared/crying fighting voices (4 clips — strictly for combat!)
  sabitPanicFight: [
    ['./assets/audio/sabit_voice_01.mp3'],
    ['./assets/audio/sabit_voice_02.mp3'],
    ['./assets/audio/sabit_voice_03.mp3'],
    ['./assets/audio/sabit_voice_04.mp3'],
  ],

  // 5) Sabit Funny Voice inside Sabit's Green iFruit Phone ([P]) — strictly #5 only!
  sabitFunny: [
    {
      id: 'sabit_funny_pakhi',
      speakerId: 'sabit',
      speakerName: 'সাবিদ',
      title: '🐦 পাখি উড়ে গেছে!',
      subtitle: 'সাবিদ · ফানি ভয়েস',
      expression: 'happy',
      urls: ['./assets/audio/sabit_voice_05.mp3'],
    },
  ],

  // Optional future Emote voice slots
  emotes: {
    wave: ['./assets/audio/emote_wave.mp3'],
    laugh: ['./assets/audio/emote_laugh.mp3'],
    dance1: ['./assets/audio/emote_dance1.mp3'],
    dance2: ['./assets/audio/emote_dance2.mp3'],
    flex: ['./assets/audio/emote_flex.mp3'],
    combo: ['./assets/audio/emote_combo.mp3'],
    phone: ['./assets/audio/emote_phone.mp3'],
  },
};
