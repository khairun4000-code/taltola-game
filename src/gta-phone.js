/**
 * GTA V-Style Smartphone System (opens with [P] key):
 *  - Home Screen with 3 Apps:
 *      1) Dial Pad (Cheat Codes to spawn BMW M3, Alphard, Corolla, Fortuner, HiAce, Rickshaw)
 *      2) Teleport App (instant teleport to any Khulna Landmark)
 *      3) Selfie Camera App (front face cam, expressions, shutter flash & PNG download)
 */

export const PHONE_CHEAT_CODES = [
  { code: '2012', carId: 'toyota_prius', label: 'Toyota Prius 2012 (Body Kit)' },
  { code: '3333', carId: 'toyota_corolla', label: 'Toyota Corolla 2017 (Workable)' },
  { code: '2000', carId: 'nissan_sunny', label: 'Nissan Sunny (N16) 2000' },
  { code: '3000', carId: 'toyota_land_cruiser', label: 'Toyota Land Cruiser LC300 VXR' },
  { code: '2515', carId: 'tata_2515', label: 'Tata LPT 2515 Truck (10-Wheeler)' },
  { code: '1111', carId: 'bmw_m3', label: 'BMW M3 Competition' },
  { code: '2222', carId: 'toyota_alphard', label: 'Toyota Alphard 2025' },
  { code: '4444', carId: 'toyota_fortuner', label: 'Toyota Fortuner 2021' },
  { code: '5555', carId: 'toyota_hiace', label: 'Toyota HiAce 2005' },
  { code: '9999', carId: 'toyota_townace', label: 'Toyota TownAce GL 2005' },
  { code: '6666', carId: 'bangladeshi_rickshaw_taltola', label: 'Bangladeshi Rickshaw' },
  { code: '7777', carId: 'bike_125cc', label: '125cc Naked Motorcycle' },
  { code: '8888', carId: 'honda_nxr_bros', label: 'Honda NXR Bros 2003' },
  { code: '0000', carId: 'bangladeshi_cng', label: 'Bangladeshi CNG Auto' },
  { code: '1234', carId: 'atlas_roadster_bicycle', label: 'Atlas Roadster Bicycle' },
  { code: '5678', carId: 'bangladeshi_cargo_van', label: 'Bangladeshi Cargo Van' },
];

export function createGTAPhoneUI({
  onOpenChange,
  onPhoneInteract,
  onSpawnCheatVehicle,
  onDespawnCheatVehicle,
  onClearSpawnedVehicles,
  getSpawnLimitInfo,
  onTeleportLandmark,
  onEnterSelfieMode,
  onExitSelfieMode,
  onSetExpression,
  onCaptureSelfieDataUrl,
  getLandmarks,
  getFunnyVoices,
  onPlayFunnyVoice,
}) {
  const phoneEl = document.querySelector('#gta-phone');
  const phoneTitleEl = document.querySelector('.phone-title');
  const toastEl = document.querySelector('#gta-cheat-toast');
  const flashEl = document.querySelector('#selfie-flash');
  const clockEl = document.querySelector('#phone-clock');
  const closeBtn = document.querySelector('#phone-close-btn');
  const backBtn = document.querySelector('#phone-back-btn');
  const homeScreen = document.querySelector('#phone-home');
  const dialScreen = document.querySelector('#phone-dial');
  const teleportScreen = document.querySelector('#phone-teleport');
  const selfieScreen = document.querySelector('#phone-selfie');
  const funnyScreen = document.querySelector('#phone-funny');
  const funnyListEl = document.querySelector('#phone-funny-list');
  const funnyStatusEl = document.querySelector('#phone-funny-status');
  const socialScreen = document.querySelector('#phone-social');
  const socialStoriesEl = document.querySelector('#phone-social-stories');
  const socialFeedEl = document.querySelector('#phone-social-feed');
  const socialComposerForm = document.querySelector('#phone-social-composer');
  const socialInputEl = document.querySelector('#phone-social-input');
  const dialDisplay = document.querySelector('#phone-dial-display');
  const dialStatus = document.querySelector('#phone-dial-status');
  const cheatListEl = document.querySelector('#phone-cheat-list');
  const teleportListEl = document.querySelector('#phone-teleport-list');
  const selfiePreviewImg = document.querySelector('#phone-selfie-preview');
  const selfieDownloadLink = document.querySelector('#phone-selfie-download');
  const selfieShutterBtn = document.querySelector('#phone-selfie-shutter');

  let isOpen = false;
  let activeApp = 'home'; // 'home' | 'dial' | 'teleport' | 'selfie' | 'funny' | 'social'
  let dialValue = '';

  const SOCIAL_STORIES = [
    { id: 'sabit', name: 'সাবিদ', emoji: '⚡', bg: 'linear-gradient(135deg,#10b981,#06b6d4)', status: '⚡ সাবিদ স্টোরি: রয়্যাল মোড়ে নতুন BMW নিয়ে ঘুরছি!' },
    { id: 'huzza', name: 'হুজ্জাতুল্লাহ', emoji: '🔥', bg: 'linear-gradient(135deg,#3b82f6,#f97316)', status: '🔥 হুজ্জাতুল্লাহ স্টোরি: SK Arshan Tower-এর ছাদে বাতাস খাচ্ছি।' },
    { id: 'royal', name: 'রয়্যাল মোড়', emoji: '🦐', bg: 'linear-gradient(135deg,#f59e0b,#ef4444)', status: '🦐 চিংড়ি চত্বর লাইভ: বিকেলে দারুণ ভিড় জমেছে!' },
    { id: 'taltola', name: 'তালতলা', emoji: '🏠', bg: 'linear-gradient(135deg,#8b5cf6,#ec4899)', status: '🏠 টুটপাড়া তালতলা: ৫ তলার ছাদ থেকে সূর্যাস্ত দেখা যাচ্ছে।' },
    { id: 'hadis', name: 'হাদিস পার্ক', emoji: '🦆', bg: 'linear-gradient(135deg,#22c55e,#15803d)', status: '🦆 হাদিস পার্ক: পুকুরে হাঁসগুলো আরাম করছে!' },
    { id: 'rupsha', name: 'রূপসা ঘাট', emoji: '🌊', bg: 'linear-gradient(135deg,#0284c7,#1e3a8a)', status: '🌊 রূপসা ফেরি ঘাট: গরম চা আর পেঁয়াজু রেডি!' },
  ];

  const socialPosts = [
    {
      id: 'p1',
      handle: '@khulna_vibes',
      avatar: '🦐',
      avatarBg: 'linear-gradient(135deg,#f97316,#ef4444)',
      location: 'রয়্যাল মোড় · চিংড়ি চত্বর',
      time: '২ মিনিট আগে',
      mediaBg: 'linear-gradient(135deg,#7c2d12 0%,#ea580c 48%,#facc15 100%)',
      mediaTag: '🌇 GOLDEN HOUR · ROYAL MORE',
      mediaEmoji: '🦐🚗',
      caption: 'বিকেলের রয়্যাল মোড় আর চিংড়ি চত্বরের বাতাসটা আজকে অসাধারণ! কে কে আছো এখানে?',
      likes: 248,
      liked: false,
      saved: false,
      showComments: false,
      comments: [
        { user: 'taltola_boy', text: 'ভাই ৫ মিনিটে রিকশা নিয়ে আসতেছি!' },
        { user: 'sabit_khulna', text: 'চিংড়ি চত্বরে ফটোসেশন হবে নাকি? 📸' },
      ],
    },
    {
      id: 'p2',
      handle: '@taltola_adda',
      avatar: '🚗',
      avatarBg: 'linear-gradient(135deg,#0ea5e9,#2563eb)',
      location: 'টুটপাড়া তালতলা ক্রস রোড',
      time: '৯ মিনিট আগে',
      mediaBg: 'linear-gradient(135deg,#0f172a 0%,#1d4ed8 55%,#38bdf8 100%)',
      mediaTag: '🔥 SPOTTED AT TALTOLA HOUSE',
      mediaEmoji: '🏎️💨',
      caption: 'তালতলার ৫ তলা বাড়ির সামনে আবার কে যেন BMW M3 পার্ক করে রাখছে! ভাই চিট কোড 1111 মারছো নাকি? 😂',
      likes: 412,
      liked: false,
      saved: false,
      showComments: false,
      comments: [
        { user: 'huzzatullah_hd', text: 'আমি তো শুধু ফরচুনার 4444 চালাই 😎' },
        { user: 'khulna_rider', text: 'একটা রাউন্ড দাও ভাই হাজী মহসিন রোডে!' },
      ],
    },
    {
      id: 'p3',
      handle: '@sabit_official',
      avatar: '⚡',
      avatarBg: 'linear-gradient(135deg,#10b981,#059669)',
      location: 'খুলনা জেলা স্টেডিয়াম',
      time: '১৮ মিনিট আগে',
      mediaBg: 'linear-gradient(135deg,#064e3b 0%,#10b981 60%,#22d3ee 100%)',
      mediaTag: '⚡ REFLEX MODE ACTIVATED',
      mediaEmoji: '🥊⚡',
      caption: 'আজকে হুজ্জাতুল্লাহর সাথে আবার মারামারি লেগে গেছিল, রিফ্লেক্স মোড অন করে কোনোরকমে পালাইছি! 😅',
      likes: 539,
      liked: false,
      saved: false,
      showComments: false,
      comments: [
        { user: 'huzzatullah_hd', text: 'দাঁড়া তোরে আজকে সাতরাস্তায় ধরতেছি 😤' },
        { user: 'altapole_crew', text: 'ভিডিও কই ভাই? 😂🔥' },
      ],
    },
    {
      id: 'p4',
      handle: '@rupsha_ghat_diaries',
      avatar: '🌊',
      avatarBg: 'linear-gradient(135deg,#0284c7,#0f766e)',
      location: 'রূপসা ফেরি ও লঞ্চ ঘাট',
      time: '৩৫ মিনিট আগে',
      mediaBg: 'linear-gradient(135deg,#0c4a6e 0%,#0284c7 55%,#38bdf8 100%)',
      mediaTag: '☕ RUPSHA RIVER BREEZE',
      mediaEmoji: '⛴️☕',
      caption: 'রূপসা নদীর পাড়ে দাঁড়িয়ে গরম চা আর পেঁয়াজু—খুলনার আসল শান্তি এখানেই! 🌊',
      likes: 319,
      liked: false,
      saved: false,
      showComments: false,
      comments: [
        { user: 'khulna_foodies', text: 'সাথে দুইটা সিঙ্গারা হইলে জমে যেত!' },
      ],
    },
    {
      id: 'p5',
      handle: '@huzzatullah_khulna',
      avatar: '🏙️',
      avatarBg: 'linear-gradient(135deg,#6366f1,#3b82f6)',
      location: 'হাজী মহসিন রোড · SK Arshan Tower',
      time: '১ ঘণ্টা আগে',
      mediaBg: 'linear-gradient(135deg,#1e1b4b 0%,#4338ca 55%,#818cf8 100%)',
      mediaTag: '🛗 10TH FLOOR ROOFTOP VIEW',
      mediaEmoji: '🏙️✨',
      caption: 'SK Arshan Alif Tower-এর লিফটে উঠে ছাদ থেকে পুরো খুলনা দেখা যায়! কেউ লাফ দিও না আবার 😂',
      likes: 287,
      liked: false,
      saved: false,
      showComments: false,
      comments: [
        { user: 'dev_khulna', text: 'Unlimited Health অন থাকলে সমস্যা নাই 😎' },
        { user: 'taltola_boy', text: 'লিফটটা অনেক স্মুথ!' },
      ],
    },
    {
      id: 'p6',
      handle: '@hadis_park_clicks',
      avatar: '🦆',
      avatarBg: 'linear-gradient(135deg,#22c55e,#65a30d)',
      location: 'শহীদ হাদিস পার্ক',
      time: '২ ঘণ্টা আগে',
      mediaBg: 'linear-gradient(135deg,#14532d 0%,#16a34a 55%,#86efac 100%)',
      mediaTag: '🌿 SHAHEED HADIS PARK',
      mediaEmoji: '🦆🌳',
      caption: 'হাদিস পার্কের পুকুরে হাঁসগুলো আজকে একদম চিল মুডে সাঁতার কাটছে 🦆🌿',
      likes: 194,
      liked: false,
      saved: false,
      showComments: false,
      comments: [
        { user: 'nature_bd', text: 'খুলনার সবচেয়ে সুন্দর পার্ক ❤️' },
      ],
    },
    {
      id: 'p7',
      handle: '@altapole_boys',
      avatar: '🚲',
      avatarBg: 'linear-gradient(135deg,#ec4899,#f43f5e)',
      location: 'আলতাপোল লেন · ওয়ার্ড ২৩',
      time: '৩ ঘণ্টা আগে',
      mediaBg: 'linear-gradient(135deg,#4c0519 0%,#be123c 55%,#fb7185 100%)',
      mediaTag: '🚲 ALTAPOLE LANE VIBES',
      mediaEmoji: '🚲🏠',
      caption: 'আলতাপোল গলিতে বড় গাড়ি নিয়ে ঢোকার চেষ্টা করবেন না ভাই, সাইকেল বা রিকশাই সেরা! 😆',
      likes: 163,
      liked: false,
      saved: false,
      showComments: false,
      comments: [
        { user: 'rickshaw_mama', text: '৬৬৬৬ ডায়াল করে রিকশা নামাও মামা!' },
      ],
    },
    {
      id: 'p8',
      handle: '@khulna_traffic_live',
      avatar: '🛺',
      avatarBg: 'linear-gradient(135deg,#eab308,#ca8a04)',
      location: 'সাতরাস্তা মোড় · KDA Avenue',
      time: '৪ ঘণ্টা আগে',
      mediaBg: 'linear-gradient(135deg,#422006 0%,#ca8a04 55%,#fde047 100%)',
      mediaTag: '🚨 BREAKING KHULNA DRIFT',
      mediaEmoji: '🛺💨',
      caption: 'ব্রেকিং: সাতরাস্তা মোড়ে এক পাগলা ড্রাইভার CNG নিয়ে ড্রিফ্ট মারতেছে! কেউ ভিডিও করছো? 🛺🔥',
      likes: 621,
      liked: false,
      saved: false,
      showComments: false,
      comments: [
        { user: 'khulna_vibes', text: 'নিশ্চয়ই সাবিদ নাইলে হুজ্জাতুল্লাহ 😂' },
        { user: 'cng_boss', text: '০০০০ কোডের সিএনজি আলাদা লেভেল!' },
      ],
    },
  ];
  let toastTimer = null;
  let audioCtx = null;
  let currentCharId = 'sabit';

  const funnyTileLabelEl = document.querySelector('[data-phone-app="funny"] small');
  const funnyTitleEl = document.querySelector('#phone-funny .phone-section-title');

  function setCharacterTheme(charId = 'sabit') {
    currentCharId = charId === 'kurta_blue' ? 'kurta_blue' : 'sabit';
    const isBlue = currentCharId === 'kurta_blue';
    phoneEl?.classList.toggle('theme-blue', isBlue);
    phoneEl?.classList.toggle('theme-green', !isBlue);
    if (phoneTitleEl) {
      phoneTitleEl.textContent = isBlue ? 'iFruit · হুজ্জাতুল্লাহ' : 'iFruit · সাবিদ';
    }
    if (funnyTileLabelEl) {
      funnyTileLabelEl.textContent = isBlue ? 'Huzzatullah' : 'Sabit';
    }
    if (funnyTitleEl) {
      funnyTitleEl.textContent = isBlue ? '😂 হুজ্জাতুল্লাহর ফানি ভয়েস' : '😂 সাবিদের ফানি ভয়েস';
    }
    if (funnyStatusEl) {
      funnyStatusEl.textContent = isBlue
        ? 'ট্যাপ করলেই হুজ্জাতুল্লাহ ফানি ভয়েস বলবে'
        : 'ট্যাপ করলেই সাবিদ পাখির ফানি ভয়েস বলবে';
    }
    if (activeApp === 'funny') populateFunnyList();
  }
  setCharacterTheme('sabit');

  function ensureAudio() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx?.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
  }

  function playTone(freq1, freq2 = null, dur = 0.08, vol = 0.08) {
    const ctx = ensureAudio();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(vol, now + 0.006);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      g.connect(ctx.destination);
      for (const f of (freq2 ? [freq1, freq2] : [freq1])) {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = f;
        o.connect(g);
        o.start(now);
        o.stop(now + dur + 0.01);
      }
    } catch {}
  }

  function playShutterSound() {
    playTone(1420, 2100, 0.045, 0.12);
    setTimeout(() => playTone(880, 1240, 0.055, 0.09), 55);
  }

  function showToast(text) {
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.add('hidden');
    }, 3400);
  }

  function updateClock() {
    if (!clockEl) return;
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm}`;
  }
  updateClock();
  setInterval(updateClock, 15000);

  function populateCheatList() {
    if (!cheatListEl) return;
    const info = getSpawnLimitInfo?.() || { count: 0, max: 4, vehicles: [] };
    cheatListEl.innerHTML = '';

    const headerRow = document.createElement('div');
    headerRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:4px 6px 6px;font-size:11px;color:#cbd5e1;border-bottom:1px solid rgba(255,255,255,0.12);margin-bottom:4px;';
    headerRow.innerHTML = `<span>SPAWNED: <strong style="color:${info.count >= info.max ? '#facc15' : '#86efac'}">${info.count}/${info.max}</strong></span>`;
    if (info.count > 0 && onClearSpawnedVehicles) {
      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.textContent = 'DESPAWN ALL';
      clearBtn.style.cssText = 'background:#ef4444;color:#fff;border:none;border-radius:6px;padding:3px 8px;font-size:10px;font-weight:800;cursor:pointer;letter-spacing:0.3px;';
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onPhoneInteract?.();
        const res = onClearSpawnedVehicles();
        playTone(440, 330, 0.1, 0.07);
        populateCheatList();
        if (dialStatus) dialStatus.textContent = `✓ All vehicles despawned (0/${res?.max ?? 4})`;
        showToast(`🗑️ ALL SPAWNED VEHICLES DESPAWNED (0/${res?.max ?? 4})`);
      });
      headerRow.appendChild(clearBtn);
    }
    cheatListEl.appendChild(headerRow);

    if (Array.isArray(info.vehicles) && info.vehicles.length > 0 && onDespawnCheatVehicle) {
      for (const v of info.vehicles) {
        const vRow = document.createElement('div');
        vRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:6px;padding:4px 6px;margin-bottom:4px;border-radius:7px;background:rgba(239,68,68,0.14);border:1px solid rgba(239,68,68,0.34);font-size:11px;color:#f8fafc;';
        const labelSpan = document.createElement('span');
        labelSpan.textContent = `🚗 ${v.name}`;
        labelSpan.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700;';
        const despawnBtn = document.createElement('button');
        despawnBtn.type = 'button';
        despawnBtn.textContent = 'DESPAWN';
        despawnBtn.style.cssText = 'background:#dc2626;color:#fff;border:none;border-radius:5px;padding:2px 7px;font-size:9.5px;font-weight:800;cursor:pointer;flex-shrink:0;';
        despawnBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onPhoneInteract?.();
          const res = onDespawnCheatVehicle(v.id);
          playTone(420, 310, 0.09, 0.07);
          populateCheatList();
          if (dialStatus) dialStatus.textContent = `✓ ${v.name} despawned (${res?.count ?? 0}/${res?.max ?? 2})`;
          showToast(`🗑️ DESPAWNED: ${v.name} (${res?.count ?? 0}/${res?.max ?? 2})`);
        });
        vRow.appendChild(labelSpan);
        vRow.appendChild(despawnBtn);
        cheatListEl.appendChild(vRow);
      }
    }

    for (const item of PHONE_CHEAT_CODES) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'phone-cheat-row';
      row.innerHTML = `<span class="cheat-code">${item.code}</span><span class="cheat-name">${item.label}</span>`;
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        onPhoneInteract?.();
        dialValue = item.code;
        if (dialDisplay) dialDisplay.textContent = dialValue;
        triggerDialCall();
      });
      cheatListEl.appendChild(row);
    }
  }
  populateCheatList();

  function populateTeleportList() {
    if (!teleportListEl) return;
    const landmarks = getLandmarks?.() || [];
    teleportListEl.innerHTML = '';
    for (const lm of landmarks) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'phone-tp-row';
      btn.innerHTML = `<strong>${lm.n || lm.name || lm.id}</strong><small>${lm.sub || lm.n || lm.name || 'Khulna City'}</small>`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        onPhoneInteract?.();
        playTone(660, 990, 0.12, 0.09);
        close();
        onTeleportLandmark?.(lm);
        showToast(`📍 FAST TRAVEL: ${lm.n || lm.name || 'Destination'}`);
      });
      teleportListEl.appendChild(btn);
    }
  }

  function populateFunnyList() {
    if (!funnyListEl) return;
    const clips = getFunnyVoices?.() || [];
    funnyListEl.innerHTML = '';
    for (const clip of clips) {
      const speakerLabel = clip.speakerName || (currentCharId === 'kurta_blue' ? 'হুজ্জাতুল্লাহ' : 'সাবিদ');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'phone-funny-row';
      btn.innerHTML = `<strong>${clip.title}</strong><small>${clip.subtitle || speakerLabel}</small>`;
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        onPhoneInteract?.();
        if (funnyStatusEl) funnyStatusEl.textContent = `🔊 বাজছে: ${clip.title}`;
        const res = await onPlayFunnyVoice?.(clip);
        if (res === true) {
          showToast(`😂 ${speakerLabel}: ${clip.title}`);
        } else if (res === 'busy') {
          if (funnyStatusEl) funnyStatusEl.textContent = '⏳ আরেকজন কথা বলছে — শেষ হলেই ট্যাপ করো';
          showToast('⏳ একজন কথা বলছে — শেষ হলেই আরেকজন বলবে!');
        } else if (res === 'mosque') {
          if (funnyStatusEl) funnyStatusEl.textContent = '🕌 মডেল মসজিদে ভয়েস বন্ধ আছে';
        } else {
          if (funnyStatusEl) funnyStatusEl.textContent = '⚠️ অডিও ফাইল পাওয়া যায়নি';
          showToast('⚠️ অডিও ফাইল পাওয়া যায়নি');
        }
      });
      funnyListEl.appendChild(btn);
    }
  }

  function renderSocialStories() {
    if (!socialStoriesEl) return;
    socialStoriesEl.innerHTML = '';
    for (const st of SOCIAL_STORIES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'social-story-chip';
      btn.innerHTML = `<span class="story-ring" style="background:${st.bg}">${st.emoji}</span><small>${st.name}</small>`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        onPhoneInteract?.();
        playTone(760, 960, 0.06, 0.05);
        showToast(st.status);
      });
      socialStoriesEl.appendChild(btn);
    }
  }

  function renderSocialFeed() {
    if (!socialFeedEl) return;
    socialFeedEl.innerHTML = '';
    for (const post of socialPosts) {
      const card = document.createElement('article');
      card.className = 'social-post-card';

      const head = document.createElement('div');
      head.className = 'social-post-head';
      head.innerHTML = `
        <span class="social-avatar" style="background:${post.avatarBg}">${post.avatar}</span>
        <div class="social-post-meta">
          <strong>${post.handle}</strong>
          <small>${post.location} · ${post.time}</small>
        </div>
      `;
      card.appendChild(head);

      const media = document.createElement('div');
      media.className = 'social-post-media';
      media.style.background = post.mediaBg;
      media.innerHTML = `<span class="social-media-emoji">${post.mediaEmoji}</span><span class="social-media-tag">${post.mediaTag}</span>`;
      media.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (!post.liked) {
          post.liked = true;
          post.likes += 1;
          onPhoneInteract?.();
          playTone(880, 1180, 0.07, 0.06);
          renderSocialFeed();
        }
      });
      card.appendChild(media);

      const actions = document.createElement('div');
      actions.className = 'social-post-actions';

      const likeBtn = document.createElement('button');
      likeBtn.type = 'button';
      likeBtn.className = `social-act-btn${post.liked ? ' liked' : ''}`;
      likeBtn.textContent = `${post.liked ? '❤️' : '🤍'} ${post.likes}`;
      likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onPhoneInteract?.();
        post.liked = !post.liked;
        post.likes += post.liked ? 1 : -1;
        playTone(post.liked ? 880 : 520, null, 0.05, 0.05);
        renderSocialFeed();
      });

      const cmtBtn = document.createElement('button');
      cmtBtn.type = 'button';
      cmtBtn.className = 'social-act-btn';
      cmtBtn.textContent = `💬 ${post.comments.length}`;
      cmtBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onPhoneInteract?.();
        post.showComments = !post.showComments;
        playTone(640, null, 0.04, 0.04);
        renderSocialFeed();
      });

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = `social-act-btn social-save-btn${post.saved ? ' saved' : ''}`;
      saveBtn.textContent = post.saved ? '🔖 Saved' : '🔖';
      saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onPhoneInteract?.();
        post.saved = !post.saved;
        playTone(720, null, 0.04, 0.04);
        renderSocialFeed();
      });

      actions.append(likeBtn, cmtBtn, saveBtn);
      card.appendChild(actions);

      const cap = document.createElement('p');
      cap.className = 'social-post-caption';
      const userStrong = document.createElement('strong');
      userStrong.textContent = `${post.handle} `;
      cap.appendChild(userStrong);
      cap.appendChild(document.createTextNode(post.caption));
      card.appendChild(cap);

      if (post.showComments && post.comments.length) {
        const cList = document.createElement('div');
        cList.className = 'social-comments-box';
        for (const c of post.comments) {
          const row = document.createElement('div');
          row.className = 'social-comment-row';
          const u = document.createElement('strong');
          u.textContent = `@${c.user}: `;
          row.appendChild(u);
          row.appendChild(document.createTextNode(c.text));
          cList.appendChild(row);
        }
        card.appendChild(cList);
      }

      socialFeedEl.appendChild(card);
    }
  }

  socialInputEl?.addEventListener('keydown', (e) => {
    e.stopPropagation();
  });

  socialComposerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const text = (socialInputEl?.value || '').trim();
    if (!text) return;
    const isBlue = currentCharId === 'kurta_blue';
    socialPosts.unshift({
      id: `user_${Date.now()}`,
      handle: isBlue ? '@huzzatullah_live' : '@sabit_live',
      avatar: isBlue ? '🔥' : '⚡',
      avatarBg: isBlue ? 'linear-gradient(135deg,#38bdf8,#2563eb)' : 'linear-gradient(135deg,#22c55e,#10b981)',
      location: 'খুলনা সিটি · এখন',
      time: 'এইমাত্র',
      mediaBg: isBlue ? 'linear-gradient(135deg,#0c4a6e 0%,#2563eb 55%,#38bdf8 100%)' : 'linear-gradient(135deg,#064e3b 0%,#16a34a 55%,#4ade80 100%)',
      mediaTag: isBlue ? '🔥 HUZZATULLAH LIVE UPDATE' : '⚡ SABIT LIVE UPDATE',
      mediaEmoji: isBlue ? '😎🏙️' : '⚡🚗',
      caption: text,
      likes: 1,
      liked: true,
      saved: false,
      showComments: false,
      comments: [
        { user: isBlue ? 'sabit_official' : 'huzzatullah_hd', text: 'জোস পোস্ট ভাই! 🔥' },
      ],
    });
    if (socialInputEl) socialInputEl.value = '';
    onPhoneInteract?.();
    playTone(880, 1320, 0.1, 0.08);
    renderSocialFeed();
    if (socialFeedEl) socialFeedEl.scrollTop = 0;
    showToast('🌐 KhulnaGram-এ তোমার পোস্ট শেয়ার হয়েছে!');
  });

  function showApp(appName) {
    if (activeApp === 'selfie' && appName !== 'selfie') {
      onExitSelfieMode?.();
    }
    activeApp = appName;
    homeScreen?.classList.toggle('hidden', appName !== 'home');
    dialScreen?.classList.toggle('hidden', appName !== 'dial');
    teleportScreen?.classList.toggle('hidden', appName !== 'teleport');
    selfieScreen?.classList.toggle('hidden', appName !== 'selfie');
    funnyScreen?.classList.toggle('hidden', appName !== 'funny');
    socialScreen?.classList.toggle('hidden', appName !== 'social');
    backBtn?.classList.toggle('hidden', appName === 'home');

    if (appName === 'teleport') {
      populateTeleportList();
    } else if (appName === 'funny') {
      populateFunnyList();
    } else if (appName === 'social') {
      renderSocialStories();
      renderSocialFeed();
    } else if (appName === 'selfie') {
      onEnterSelfieMode?.();
    } else if (appName === 'dial') {
      populateCheatList();
      const info = getSpawnLimitInfo?.() || { count: 0, max: 4 };
      if (dialStatus) {
        dialStatus.textContent = info.count >= info.max
          ? `Max ${info.max} active · New spawn replaces oldest (${info.count}/${info.max})`
          : `Tap a vehicle or dial code (${info.count}/${info.max})`;
      }
    }
  }

  function triggerDialCall() {
    const code = dialValue.trim();
    if (!code) return;
    const match = PHONE_CHEAT_CODES.find((c) => c.code === code);
    if (match) {
      const raw = onSpawnCheatVehicle?.(match.carId, match.label);
      const res = typeof raw === 'object' && raw !== null ? raw : { ok: Boolean(raw), count: 1, max: 4 };
      if (res.ok) {
        playTone(880, 1320, 0.16, 0.10);
        populateCheatList();
        const swapNote = res.replacedName ? ` · Replaced ${res.replacedName}` : '';
        if (dialStatus) dialStatus.textContent = `✓ ${match.label} spawned! (${res.count}/${res.max})${swapNote}`;
        showToast(`🚗 SPAWNED: ${match.label} (${res.count}/${res.max})${swapNote}`);
        dialValue = '';
        if (dialDisplay) dialDisplay.textContent = '—';
        setTimeout(() => close(), 420);
      } else if (dialStatus) {
        playTone(320, 240, 0.18, 0.09);
        dialStatus.textContent = 'Vehicle not found';
      }
    } else {
      playTone(320, 240, 0.18, 0.09);
      if (dialStatus) dialStatus.textContent = `Invalid cheat code (${code}) · Check list below`;
    }
  }

  function open(appName = 'home') {
    if (isOpen) return;
    isOpen = true;
    updateClock();
    phoneEl?.classList.remove('hidden');
    requestAnimationFrame(() => phoneEl?.classList.add('open'));
    playTone(587, 880, 0.09, 0.07);
    showApp(appName);
    onOpenChange?.(true);
  }

  function close() {
    if (!isOpen) return;
    if (activeApp === 'selfie') {
      onExitSelfieMode?.();
    }
    isOpen = false;
    activeApp = 'home';
    phoneEl?.classList.remove('open');
    setTimeout(() => {
      if (!isOpen) phoneEl?.classList.add('hidden');
    }, 220);
    playTone(440, 330, 0.07, 0.06);
    onOpenChange?.(false);
  }

  function toggle() {
    if (isOpen) close();
    else open('home');
  }

  // App icon triggers
  document.querySelectorAll('[data-phone-app]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onPhoneInteract?.();
      playTone(698, null, 0.06, 0.06);
      showApp(btn.dataset.phoneApp);
    });
  });

  backBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    onPhoneInteract?.();
    playTone(520, null, 0.05, 0.06);
    showApp('home');
  });

  closeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    close();
  });

  // Dial pad buttons
  document.querySelectorAll('[data-dial-key]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onPhoneInteract?.();
      const k = btn.dataset.dialKey;
      if (k === 'BACK') {
        dialValue = dialValue.slice(0, -1);
        playTone(400, null, 0.05, 0.06);
      } else if (k === 'CALL') {
        triggerDialCall();
        return;
      } else if (dialValue.length < 8) {
        dialValue += k;
        const digit = Number(k);
        playTone(697 + (Number.isFinite(digit) ? (digit % 4) * 75 : 220), 1209, 0.065, 0.06);
      }
      if (dialDisplay) dialDisplay.textContent = dialValue || '—';
    });
  });

  // Selfie expressions
  document.querySelectorAll('[data-selfie-expr]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onPhoneInteract?.();
      document.querySelectorAll('[data-selfie-expr]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      onSetExpression?.(btn.dataset.selfieExpr);
      playTone(740, null, 0.05, 0.05);
    });
  });

  // Selfie shutter button
  selfieShutterBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    onPhoneInteract?.();
    playShutterSound();
    if (flashEl) {
      flashEl.classList.add('flash');
      setTimeout(() => flashEl.classList.remove('flash'), 220);
    }
    const dataUrl = onCaptureSelfieDataUrl?.();
    if (dataUrl) {
      if (selfiePreviewImg) {
        selfiePreviewImg.src = dataUrl;
        selfiePreviewImg.classList.remove('hidden');
      }
      if (selfieDownloadLink) {
        selfieDownloadLink.href = dataUrl;
        selfieDownloadLink.download = `khulna-selfie-${Date.now()}.png`;
        selfieDownloadLink.classList.remove('hidden');
      }
      showToast('📸 SNAPMATIC PHOTO CAPTURED — Ready to save!');
    }
  });

  function handleKeyDown(event) {
    if (!isOpen) return false;
    if (activeApp === 'dial') {
      if (/^Digit[0-9]$/.test(event.code) || /^Numpad[0-9]$/.test(event.code)) {
        event.preventDefault();
        onPhoneInteract?.();
        const ch = event.code.slice(-1);
        if (dialValue.length < 8) {
          dialValue += ch;
          if (dialDisplay) dialDisplay.textContent = dialValue;
          playTone(697 + (Number(ch) % 4) * 75, 1209, 0.065, 0.06);
        }
        return true;
      }
      if (event.code === 'Backspace') {
        event.preventDefault();
        onPhoneInteract?.();
        dialValue = dialValue.slice(0, -1);
        if (dialDisplay) dialDisplay.textContent = dialValue || '—';
        return true;
      }
      if (event.code === 'Enter' || event.code === 'NumpadEnter') {
        event.preventDefault();
        onPhoneInteract?.();
        triggerDialCall();
        return true;
      }
    }
    if (event.code === 'Backspace' || event.code === 'Escape') {
      event.preventDefault();
      if (activeApp !== 'home') showApp('home');
      else close();
      return true;
    }
    return false;
  }

  return {
    get isOpen() { return isOpen; },
    get activeApp() { return activeApp; },
    open,
    close,
    toggle,
    showToast,
    setCharacterTheme,
    handleKeyDown,
  };
}
