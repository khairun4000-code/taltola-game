/**
 * Central registry for Huzzatullah's ElevenLabs MP3 voice lines with real-time ARKit lip-sync.
 * All audio files are stored in `/public/assets/audio/` with clean URL-safe filenames.
 */
export const VOICE_CLIPS = {
  // 1) Huzzatullah angry reaction when Sabit punches or bothers him while standing calmly
  huzzatullahAnnoyed: [
    './assets/audio/huzzatullah_angry_01.mp3',
  ],

  // 2) Huzzatullah angry fighting voices (plays with angry mouth lip-sync when Huzzatullah punches/kicks)
  huzzatullahFight: [
    ['./assets/audio/huzzatullah_fight_01.mp3'],
    ['./assets/audio/huzzatullah_fight_02.mp3'],
  ],

  // 3) Huzzatullah Funny Voices inside the in-game iFruit Phone "ফানি ভয়েস" App ([P])
  huzzatullahFunny: [
    {
      id: 'huzzatullah_funny_pacha',
      title: '😂 একি রে, তোর পাছা দেখা যায় তো!',
      subtitle: 'হুজ্জাতুল্লাহ · ফানি ভয়েস ১',
      expression: 'happy',
      urls: ['./assets/audio/huzzatullah_funny_01.mp3'],
    },
    {
      id: 'huzzatullah_funny_pakhi',
      title: '🐦 এ তোর পাখি কই? উড়ে গিয়েছে নাকি?',
      subtitle: 'হুজ্জাতুল্লাহ · ফানি ভয়েস ২',
      expression: 'happy',
      urls: ['./assets/audio/huzzatullah_funny_02.mp3'],
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
