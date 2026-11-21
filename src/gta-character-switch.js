import * as THREE from 'three';

const CHARACTER_WHEEL_META = [
  {
    id: 'sabit',
    bnName: 'সাবিত',
    enName: 'SABIT',
    accent: '#38bdf8',
    accentSoft: 'rgba(56, 189, 248, 0.28)',
    role: 'ক্রিম পাঞ্জাবি · খুলনা',
    slot: 'left',
  },
  {
    id: 'kurta_blue',
    bnName: 'হুজ্জাতুল্লাহ',
    enName: 'HUJJATULLAH',
    accent: '#f59e0b',
    accentSoft: 'rgba(245, 158, 11, 0.28)',
    role: 'নীল পাঞ্জাবি · খুলনা',
    slot: 'right',
  },
];

const BUSY_SCENARIOS = [
  { clip: 'PhoneCall', phone: true, duration: 2.85, caption: 'ফোনে জরুরি কথা বলছিল...' },
  { clip: 'MobileGame', phone: true, duration: 2.85, caption: 'মোবাইলে গেম খেলছিল...' },
  { clip: 'WarmUp', phone: false, duration: 2.75, caption: 'রাস্তায় ওয়ার্ম-আপ করছিল...' },
  { clip: 'Flex', phone: false, duration: 2.65, caption: 'মাসল ফ্লেক্স করে স্টাইল মারছিল...' },
  { clip: 'StandingRelax', phone: false, duration: 2.6, caption: 'খুলনার রাস্তায় দাঁড়িয়ে বিশ্রাম নিচ্ছিল...' },
  { clip: 'Pocket', phone: false, duration: 2.6, caption: 'পকেটে হাত দিয়ে আশপাশ দেখছিল...' },
  { clip: 'Laugh', phone: false, duration: 2.55, caption: 'মজার কিছু ভেবে হাসছিল...' },
];

function createPortraitSVG(id) {
  if (id === 'sabit') {
    return `
      <svg viewBox="0 0 88 88" class="gta-sw-avatar-svg" aria-hidden="true">
        <defs>
          <radialGradient id="sabitBg" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#1e3a5f"/>
            <stop offset="100%" stop-color="#0b1524"/>
          </radialGradient>
        </defs>
        <circle cx="44" cy="44" r="42" fill="url(#sabitBg)"/>
        <path d="M16 84 C18 65, 29 58, 44 58 C59 58, 70 65, 72 84 Z" fill="#efe6d2"/>
        <path d="M38 58 L44 68 L50 58" fill="none" stroke="#c8b896" stroke-width="2.2" stroke-linecap="round"/>
        <rect x="38.5" y="48" width="11" height="12" rx="4" fill="#c9936d"/>
        <ellipse cx="44" cy="36" rx="14.5" ry="17" fill="#d8a27b"/>
        <path d="M29 33 C29 19, 36 14, 45 14 C55 14, 60 21, 59 33 C56 26, 51 22, 43 22 C36 22, 32 26, 29 33 Z" fill="#17171a"/>
        <path d="M32 42 C34 50, 39 53, 44 53 C49 53, 54 50, 56 42 C53 47, 49 49, 44 49 C39 49, 35 47, 32 42 Z" fill="#1d1b1e" opacity="0.82"/>
        <circle cx="38.5" cy="35.5" r="1.8" fill="#121214"/>
        <circle cx="49.5" cy="35.5" r="1.8" fill="#121214"/>
        <path d="M35.5 32.5 Q38.5 30.8 41.5 32.2" fill="none" stroke="#18181b" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M46.5 32.2 Q49.5 30.8 52.5 32.5" fill="none" stroke="#18181b" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M40.5 43.5 Q44 45.8 47.5 43.5" fill="none" stroke="#7c4b34" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`;
  }
  return `
    <svg viewBox="0 0 88 88" class="gta-sw-avatar-svg" aria-hidden="true">
      <defs>
        <radialGradient id="huzBg" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#3b2a14"/>
          <stop offset="100%" stop-color="#140f09"/>
        </radialGradient>
      </defs>
      <circle cx="44" cy="44" r="42" fill="url(#huzBg)"/>
      <path d="M16 84 C18 65, 29 58, 44 58 C59 58, 70 65, 72 84 Z" fill="#2563eb"/>
      <path d="M38 58 L44 69 L50 58" fill="none" stroke="#93c5fd" stroke-width="2.2" stroke-linecap="round"/>
      <rect x="38.5" y="48" width="11" height="12" rx="4" fill="#c28c66"/>
      <ellipse cx="44" cy="36" rx="14.5" ry="17" fill="#d19a74"/>
      <path d="M28.5 34 C28 19, 35 13, 44 13 C54 13, 60 20, 59.5 34 C56 25, 50 21, 44 21 C37 21, 32 25, 28.5 34 Z" fill="#141418"/>
      <path d="M30.5 40 C32 51, 38 55, 44 55 C50 55, 56 51, 57.5 40 C54 46, 50 49, 44 49 C38 49, 34 46, 30.5 40 Z" fill="#161518" opacity="0.92"/>
      <circle cx="38.5" cy="35.5" r="1.8" fill="#121214"/>
      <circle cx="49.5" cy="35.5" r="1.8" fill="#121214"/>
      <path d="M35.5 32.3 Q38.5 30.5 41.5 32" fill="none" stroke="#18181b" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M46.5 32 Q49.5 30.5 52.5 32.3" fill="none" stroke="#18181b" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M40.8 43.6 Q44 45.2 47.2 43.6" fill="none" stroke="#6f412c" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
}

function injectStyles() {
  if (document.getElementById('gta-char-switch-styles')) return;
  const style = document.createElement('style');
  style.id = 'gta-char-switch-styles';
  style.textContent = `
    #gta-sw-slowmo-fx {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 640;
      opacity: 0;
      transition: opacity 0.22s ease;
      background:
        radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.04) 44%, rgba(7, 15, 30, 0.56) 100%);
      box-shadow: inset 0 0 90px rgba(56, 189, 248, 0.16);
    }
    #gta-sw-slowmo-fx.active {
      opacity: 1;
    }

    #gta-sw-sky-fx {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 645;
      opacity: 0;
      backdrop-filter: blur(0px) saturate(1.12);
      -webkit-backdrop-filter: blur(0px) saturate(1.12);
      background: radial-gradient(circle at 50% 50%, rgba(186, 230, 253, 0.06) 25%, rgba(8, 17, 32, 0.34) 100%);
      transition: opacity 0.12s linear;
    }
    #gta-sw-sky-flash {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 646;
      opacity: 0;
      background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.52) 0%, rgba(56, 189, 248, 0.24) 55%, rgba(15, 23, 42, 0.32) 100%);
      transition: opacity 0.14s ease-out;
    }

    #gta-sw-wheel {
      position: fixed;
      right: 26px;
      bottom: 26px;
      z-index: 660;
      width: 268px;
      padding: 14px 14px 12px;
      border-radius: 22px;
      background: linear-gradient(155deg, rgba(10, 16, 28, 0.90), rgba(15, 23, 42, 0.82));
      border: 1px solid rgba(148, 163, 184, 0.28);
      box-shadow: 0 22px 48px rgba(0, 0, 0, 0.58), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      color: #f8fafc;
      font-family: Manrope, system-ui, -apple-system, sans-serif;
      opacity: 0;
      transform: scale(0.88) translateY(14px);
      pointer-events: none;
      transition: opacity 0.16s ease, transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
      user-select: none;
    }
    #gta-sw-wheel.open {
      opacity: 1;
      transform: scale(1) translateY(0);
      pointer-events: auto;
    }

    .gta-sw-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      padding: 0 4px;
    }
    .gta-sw-title {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #cbd5e1;
    }
    .gta-sw-gravity-pill {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      background: rgba(56, 189, 248, 0.18);
      border: 1px solid rgba(56, 189, 248, 0.45);
      color: #7dd3fc;
      letter-spacing: 0.06em;
    }

    .gta-sw-dial {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding: 8px 4px 10px;
    }
    .gta-sw-dial::before {
      content: '';
      position: absolute;
      left: 50%;
      top: 14%;
      bottom: 14%;
      width: 1px;
      background: linear-gradient(180deg, transparent, rgba(148, 163, 184, 0.35), transparent);
      pointer-events: none;
    }

    .gta-sw-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 10px 8px 9px;
      border-radius: 16px;
      border: 2px solid rgba(148, 163, 184, 0.22);
      background: rgba(15, 23, 42, 0.62);
      cursor: pointer;
      transition: transform 0.14s ease, border-color 0.14s ease, background 0.14s ease, box-shadow 0.14s ease;
    }
    .gta-sw-slot:hover {
      transform: translateY(-2px);
    }
    .gta-sw-slot.selected {
      transform: scale(1.05);
      border-color: var(--slot-accent, #38bdf8);
      background: linear-gradient(180deg, var(--slot-accent-soft, rgba(56,189,248,0.22)), rgba(15, 23, 42, 0.88));
      box-shadow: 0 0 22px var(--slot-accent-soft, rgba(56,189,248,0.34));
    }

    .gta-sw-avatar-ring {
      position: relative;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      padding: 3px;
      background: rgba(255, 255, 255, 0.12);
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.45);
      transition: background 0.14s ease;
    }
    .gta-sw-slot.selected .gta-sw-avatar-ring {
      background: var(--slot-accent, #38bdf8);
    }
    .gta-sw-avatar-svg {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      display: block;
    }
    .gta-sw-key-badge {
      position: absolute;
      top: -4px;
      left: -4px;
      width: 21px;
      height: 21px;
      border-radius: 50%;
      background: #0f172a;
      border: 1.5px solid rgba(248, 250, 252, 0.45);
      color: #f8fafc;
      font-size: 11px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .gta-sw-current-dot {
      position: absolute;
      bottom: 0;
      right: 0;
      font-size: 9px;
      font-weight: 800;
      padding: 2px 5px;
      border-radius: 999px;
      background: #22c55e;
      color: #052e16;
      display: none;
    }
    .gta-sw-slot.is-current .gta-sw-current-dot {
      display: block;
    }

    .gta-sw-name {
      font-size: 13.5px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.1;
      text-align: center;
    }
    .gta-sw-sub {
      font-size: 10px;
      font-weight: 600;
      color: #94a3b8;
      text-align: center;
      line-height: 1.25;
      min-height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .gta-sw-slot.selected .gta-sw-sub {
      color: #e2e8f0;
    }

    .gta-sw-hint {
      margin-top: 6px;
      padding-top: 8px;
      border-top: 1px solid rgba(148, 163, 184, 0.18);
      font-size: 10.5px;
      font-weight: 600;
      color: #94a3b8;
      text-align: center;
      line-height: 1.35;
    }
    .gta-sw-hint strong {
      color: #f8fafc;
    }

    #gta-sw-banner {
      position: fixed;
      left: 50%;
      bottom: 44px;
      transform: translateX(-50%) translateY(16px);
      z-index: 655;
      padding: 11px 22px;
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(9, 14, 24, 0.90), rgba(15, 23, 42, 0.84));
      border: 1px solid rgba(148, 163, 184, 0.32);
      border-left: 4px solid #38bdf8;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.52);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color: #f8fafc;
      font-family: Manrope, system-ui, -apple-system, sans-serif;
      text-align: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease, transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
    }
    #gta-sw-banner.visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    .gta-sw-banner-name {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.04em;
      color: #ffffff;
    }
    .gta-sw-banner-action {
      font-size: 12.5px;
      font-weight: 600;
      color: #cbd5e1;
      margin-top: 2px;
    }
    .gta-sw-banner-skip {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 4px;
      letter-spacing: 0.04em;
    }
  `;
  document.head.appendChild(style);
}

function createSwitchAudio() {
  let ctx = null;
  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function playTick(pitch = 520) {
    const ac = getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.65, now + 0.045);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  function playSlowMoWhoosh(opening = true) {
    const ac = getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(opening ? 190 : 95, now);
    osc.frequency.exponentialRampToValueAtTime(opening ? 72 : 165, now + 0.16);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  function playThoom(stepIndex = 0, descending = false) {
    const ac = getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    const baseFreq = descending
      ? (82 - stepIndex * 10)
      : (66 + stepIndex * 7);

    // Deep GTA V sub-bass percussive punch
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * 1.45, now);
    osc.frequency.exponentialRampToValueAtTime(26, now + 0.24);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.30);

    // Mid-low metallic air snap
    const osc2 = ac.createOscillator();
    const gain2 = ac.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 2.2, now);
    osc2.frequency.exponentialRampToValueAtTime(48, now + 0.11);
    gain2.gain.setValueAtTime(0.11, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc2.connect(gain2).connect(ac.destination);
    osc2.start(now);
    osc2.stop(now + 0.13);
  }

  return { playTick, playSlowMoWhoosh, playThoom };
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

export function createGTACharacterSwitch(hooks) {
  injectStyles();
  const audio = createSwitchAudio();

  // Build DOM elements
  const slowMoFx = document.createElement('div');
  slowMoFx.id = 'gta-sw-slowmo-fx';

  const skyFx = document.createElement('div');
  skyFx.id = 'gta-sw-sky-fx';

  const skyFlash = document.createElement('div');
  skyFlash.id = 'gta-sw-sky-flash';

  const wheelEl = document.createElement('div');
  wheelEl.id = 'gta-sw-wheel';
  wheelEl.innerHTML = `
    <div class="gta-sw-header">
      <span class="gta-sw-title">CHARACTER SWITCH</span>
      <span class="gta-sw-gravity-pill">SLOW-MO</span>
    </div>
    <div class="gta-sw-dial">
      ${CHARACTER_WHEEL_META.map((m, idx) => `
        <button type="button" class="gta-sw-slot" data-sw-char="${m.id}" style="--slot-accent:${m.accent};--slot-accent-soft:${m.accentSoft}">
          <div class="gta-sw-avatar-ring">
            ${createPortraitSVG(m.id)}
            <span class="gta-sw-key-badge">${idx + 1}</span>
            <span class="gta-sw-current-dot">ON</span>
          </div>
          <div class="gta-sw-name">${m.bnName}</div>
          <div class="gta-sw-sub" data-sw-sub="${m.id}">${m.role}</div>
        </button>
      `).join('')}
    </div>
    <div class="gta-sw-hint">
      <strong>Ctrl</strong> ধরে রেখে <strong>Mouse</strong> (উপরে/নিচে/ডানে/বামে) বা <strong>Arrow / 1-2</strong> দিয়ে বেছে <strong>Ctrl</strong> ছেড়ে দিন
    </div>
  `;

  const bannerEl = document.createElement('div');
  bannerEl.id = 'gta-sw-banner';
  bannerEl.innerHTML = `
    <div class="gta-sw-banner-name"></div>
    <div class="gta-sw-banner-action"></div>
    <div class="gta-sw-banner-skip">WASD চাপলেই সরাসরি কন্ট্রোল পাবেন</div>
  `;

  document.body.append(slowMoFx, skyFx, skyFlash, wheelEl, bannerEl);

  const slotEls = new Map();
  const subEls = new Map();
  wheelEl.querySelectorAll('[data-sw-char]').forEach((el) => {
    const cid = el.dataset.swChar;
    slotEls.set(cid, el);
    subEls.set(cid, el.querySelector(`[data-sw-sub="${cid}"]`));
    el.addEventListener('mouseenter', () => {
      if (!state.wheelOpen) return;
      setHighlighted(cid);
    });
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!state.wheelOpen) return;
      setHighlighted(cid);
      confirmWheelSelection();
    });
  });

  const bannerNameEl = bannerEl.querySelector('.gta-sw-banner-name');
  const bannerActionEl = bannerEl.querySelector('.gta-sw-banner-action');

  const state = {
    wheelOpen: false,
    ctrlHeld: false,
    highlightedId: 'sabit',
    mouseAccumX: 0,
    mouseAccumY: 0,
    timeScale: 1.0,
    phase: 'idle', // 'idle' | 'sky_switch' | 'busy_intro'
    elapsed: 0,
    targetCharId: null,
    swapped: false,
    lastStepFired: -1,
    fromPos: new THREE.Vector3(),
    fromCamPos: new THREE.Vector3(),
    toPos: new THREE.Vector3(),
    toYaw: 0,
    camPos: new THREE.Vector3(),
    lookAt: new THREE.Vector3(),
    savedFar: 520,
    busyScenario: null,
    busyTimer: 0,
    busyDuration: 2.7,
    busyYaw: 0,
  };

  let flashTimeout = null;
  function pulseFlash(intensity = 0.72) {
    skyFlash.style.opacity = String(intensity);
    if (flashTimeout) clearTimeout(flashTimeout);
    flashTimeout = setTimeout(() => {
      skyFlash.style.opacity = '0';
    }, 115);
  }

  function updateWheelUI() {
    const activeId = hooks.getActiveCharId();
    const statuses = hooks.getCharacterSummaries?.() || {};
    for (const meta of CHARACTER_WHEEL_META) {
      const slot = slotEls.get(meta.id);
      const sub = subEls.get(meta.id);
      if (slot) {
        slot.classList.toggle('selected', state.highlightedId === meta.id);
        slot.classList.toggle('is-current', activeId === meta.id);
      }
      if (sub) {
        sub.textContent = statuses[meta.id] || meta.role;
      }
    }
  }

  function setHighlighted(charId) {
    if (state.highlightedId === charId) return;
    state.highlightedId = charId;
    audio.playTick(charId === 'sabit' ? 540 : 450);
    updateWheelUI();
  }

  function toggleHighlighted() {
    const next = state.highlightedId === 'sabit' ? 'kurta_blue' : 'sabit';
    setHighlighted(next);
  }

  function openWheel() {
    if (state.phase === 'sky_switch') return;
    if (!hooks.canOpenWheel()) return;
    if (state.phase === 'busy_intro') finishBusyIntro();

    state.wheelOpen = true;
    state.ctrlHeld = true;
    state.highlightedId = hooks.getActiveCharId();
    state.mouseAccumX = 0;
    state.mouseAccumY = 0;
    updateWheelUI();
    wheelEl.classList.add('open');
    slowMoFx.classList.add('active');
    audio.playSlowMoWhoosh(true);
  }

  function cancelWheel() {
    if (!state.wheelOpen) return;
    state.wheelOpen = false;
    state.ctrlHeld = false;
    wheelEl.classList.remove('open');
    slowMoFx.classList.remove('active');
    audio.playSlowMoWhoosh(false);
  }

  function confirmWheelSelection() {
    if (!state.wheelOpen) return;
    const chosenId = state.highlightedId;
    const activeId = hooks.getActiveCharId();
    state.wheelOpen = false;
    state.ctrlHeld = false;
    wheelEl.classList.remove('open');
    slowMoFx.classList.remove('active');

    if (chosenId && chosenId !== activeId) {
      startSkySwitch(chosenId);
    } else {
      audio.playSlowMoWhoosh(false);
    }
  }

  function startSkySwitch(targetCharId) {
    const info = hooks.getSwitchEndpoints(targetCharId);
    if (!info) return;

    state.phase = 'sky_switch';
    state.elapsed = 0;
    state.targetCharId = targetCharId;
    state.swapped = false;
    state.lastStepFired = -1;
    state.fromPos.copy(info.fromPos);
    state.fromCamPos.copy(info.fromCamPos);
    state.toPos.copy(info.toPos);
    state.toYaw = info.toYaw ?? 0;
    state.savedFar = hooks.camera.far;
    state.busyScenario = BUSY_SCENARIOS[Math.floor(Math.random() * BUSY_SCENARIOS.length)];

    // Temporarily extend far plane during high-altitude aerial glide so Khulna stays crisp from the sky
    if (hooks.camera.far < 960) {
      hooks.camera.far = 960;
      hooks.camera.updateProjectionMatrix();
    }

    hooks.onSkySwitchStart?.(targetCharId);
  }

  function finishBusyIntro() {
    if (state.phase !== 'busy_intro') return;
    state.phase = 'idle';
    state.busyScenario = null;
    bannerEl.classList.remove('visible');
    hooks.onBusyIntroEnd?.();
  }

  function handleKeyDown(event) {
    // Open wheel when holding ControlLeft or ControlRight
    if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
      if (!event.repeat && !state.wheelOpen && state.phase !== 'sky_switch') {
        openWheel();
      }
      return state.wheelOpen;
    }

    // Allow player to break out of busy intro immediately on WASD / Space movement
    if (state.phase === 'busy_intro') {
      if (
        event.code === 'KeyW' || event.code === 'KeyA' || event.code === 'KeyS' || event.code === 'KeyD'
        || event.code === 'Space'
      ) {
        finishBusyIntro();
        return false;
      }
    }

    // Lock out movement keys during the aerial sky-zoom transition
    if (state.phase === 'sky_switch') {
      return true;
    }

    if (!state.wheelOpen) return false;

    // Keypad / Keyboard selection while wheel is open
    if (
      event.code === 'ArrowLeft' || event.code === 'ArrowUp'
      || event.code === 'Digit1' || event.code === 'Numpad1'
      || event.code === 'Numpad4' || event.code === 'Numpad8'
    ) {
      event.preventDefault();
      setHighlighted('sabit');
      return true;
    }
    if (
      event.code === 'ArrowRight' || event.code === 'ArrowDown'
      || event.code === 'Digit2' || event.code === 'Numpad2'
      || event.code === 'Numpad6'
    ) {
      event.preventDefault();
      setHighlighted('kurta_blue');
      return true;
    }
    if (event.code === 'Tab' || event.code === 'Space') {
      event.preventDefault();
      toggleHighlighted();
      return true;
    }
    if (event.code === 'Enter' || event.code === 'NumpadEnter') {
      event.preventDefault();
      confirmWheelSelection();
      return true;
    }
    if (event.code === 'Escape') {
      event.preventDefault();
      cancelWheel();
      return true;
    }
    return false;
  }

  function handleKeyUp(event) {
    if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
      if (state.wheelOpen) {
        confirmWheelSelection();
        return true;
      }
      state.ctrlHeld = false;
    }
    return false;
  }

  function handleMouseMove(event) {
    if (!state.wheelOpen) return false;
    const dx = event.movementX || 0;
    const dy = event.movementY || 0;
    if (Math.abs(dx) > 220 || Math.abs(dy) > 220) return true;
    state.mouseAccumX += dx;
    state.mouseAccumY += dy;

    const thresh = 24;
    if (Math.abs(state.mouseAccumX) >= thresh || Math.abs(state.mouseAccumY) >= thresh) {
      // Left or Up -> Sabit; Right or Down -> Huzzatullah
      if (Math.abs(state.mouseAccumX) >= Math.abs(state.mouseAccumY)) {
        setHighlighted(state.mouseAccumX < 0 ? 'sabit' : 'kurta_blue');
      } else {
        setHighlighted(state.mouseAccumY < 0 ? 'sabit' : 'kurta_blue');
      }
      state.mouseAccumX = 0;
      state.mouseAccumY = 0;
    }
    return true;
  }

  function handleBlur() {
    if (state.wheelOpen) cancelWheel();
  }

  function update(rawDelta) {
    // Smooth slow-mo ("motion-gravity") timeScale when wheel is open
    const targetScale = state.wheelOpen ? 0.16 : 1.0;
    state.timeScale += (targetScale - state.timeScale) * Math.min(1, rawDelta * 14.0);
    if (Math.abs(state.timeScale - targetScale) < 0.005) state.timeScale = targetScale;

    if (state.wheelOpen) {
      updateWheelUI();
    }

    if (state.phase === 'sky_switch') {
      state.elapsed += rawDelta;
      const t = state.elapsed;
      const camera = hooks.camera;

      // 3-step pull-out -> high-altitude aerial glide -> 3-step zoom-in
      const H1 = 44;
      const H2 = 128;
      const H3 = 242;

      // Fire percussive GTA V "THOOM" + flash on each step transition
      const stepTimes = [0.0, 0.28, 0.56, 1.50, 1.78, 2.06];
      for (let i = 0; i < stepTimes.length; i++) {
        if (t >= stepTimes[i] && state.lastStepFired < i) {
          state.lastStepFired = i;
          const descending = i >= 3;
          audio.playThoom(descending ? i - 3 : i, descending);
          pulseFlash(descending ? 0.48 : 0.62);
        }
      }

      let blurPx = 0;
      let fxOpacity = 0;

      if (t < 0.28) {
        const p = easeOutCubic(t / 0.28);
        state.camPos.set(
          THREE.MathUtils.lerp(state.fromCamPos.x, state.fromPos.x - 6, p),
          THREE.MathUtils.lerp(state.fromCamPos.y, state.fromPos.y + H1, p),
          THREE.MathUtils.lerp(state.fromCamPos.z, state.fromPos.z + 10, p),
        );
        state.lookAt.set(state.fromPos.x, state.fromPos.y + 1.0, state.fromPos.z);
        blurPx = THREE.MathUtils.lerp(0.8, 3.2, p);
        fxOpacity = THREE.MathUtils.lerp(0.25, 0.58, p);
      } else if (t < 0.56) {
        const p = easeOutCubic((t - 0.28) / 0.28);
        state.camPos.set(
          THREE.MathUtils.lerp(state.fromPos.x - 6, state.fromPos.x - 10, p),
          THREE.MathUtils.lerp(state.fromPos.y + H1, state.fromPos.y + H2, p),
          THREE.MathUtils.lerp(state.fromPos.z + 10, state.fromPos.z + 16, p),
        );
        state.lookAt.set(state.fromPos.x, state.fromPos.y, state.fromPos.z);
        blurPx = THREE.MathUtils.lerp(2.4, 5.0, p);
        fxOpacity = THREE.MathUtils.lerp(0.55, 0.78, p);
      } else if (t < 0.88) {
        const p = easeOutCubic((t - 0.56) / 0.32);
        state.camPos.set(
          THREE.MathUtils.lerp(state.fromPos.x - 10, state.fromPos.x, p),
          THREE.MathUtils.lerp(state.fromPos.y + H2, state.fromPos.y + H3, p),
          THREE.MathUtils.lerp(state.fromPos.z + 16, state.fromPos.z + 18, p),
        );
        state.lookAt.set(state.fromPos.x, state.fromPos.y, state.fromPos.z);
        blurPx = THREE.MathUtils.lerp(4.0, 6.2, p);
        fxOpacity = 0.85;
      } else if (t < 1.50) {
        // High-altitude aerial glide over Khulna to the target character!
        const p = easeInOutCubic((t - 0.88) / 0.62);
        const gx = THREE.MathUtils.lerp(state.fromPos.x, state.toPos.x, p);
        const gz = THREE.MathUtils.lerp(state.fromPos.z, state.toPos.z, p);
        const arcLift = Math.sin(p * Math.PI) * 28;
        state.camPos.set(gx, Math.max(state.fromPos.y, state.toPos.y) + H3 + arcLift, gz + 18);
        state.lookAt.set(gx, state.toPos.y, gz);
        blurPx = 5.6 + Math.sin(p * Math.PI) * 2.4;
        fxOpacity = 0.88;

        // Swap the live characters right at midpoint of the aerial glide
        if (p >= 0.48 && !state.swapped) {
          state.swapped = true;
          const swappedPose = hooks.onPerformSwap(state.targetCharId, state.busyScenario);
          if (swappedPose) {
            state.toPos.copy(swappedPose.pos);
            state.toYaw = swappedPose.yaw;
          }
        }
      } else if (t < 1.78) {
        const p = easeOutCubic((t - 1.50) / 0.28);
        state.camPos.set(
          THREE.MathUtils.lerp(state.toPos.x, state.toPos.x - 10, p),
          THREE.MathUtils.lerp(state.toPos.y + H3, state.toPos.y + H2, p),
          THREE.MathUtils.lerp(state.toPos.z + 18, state.toPos.z + 14, p),
        );
        state.lookAt.set(state.toPos.x, state.toPos.y + 0.8, state.toPos.z);
        blurPx = THREE.MathUtils.lerp(5.5, 3.4, p);
        fxOpacity = THREE.MathUtils.lerp(0.82, 0.56, p);
      } else if (t < 2.06) {
        const p = easeOutCubic((t - 1.78) / 0.28);
        state.camPos.set(
          THREE.MathUtils.lerp(state.toPos.x - 10, state.toPos.x - Math.sin(state.toYaw) * 4.5, p),
          THREE.MathUtils.lerp(state.toPos.y + H2, state.toPos.y + H1, p),
          THREE.MathUtils.lerp(state.toPos.z + 14, state.toPos.z - Math.cos(state.toYaw) * 4.5, p),
        );
        state.lookAt.set(state.toPos.x, state.toPos.y + 0.9, state.toPos.z);
        blurPx = THREE.MathUtils.lerp(3.2, 1.4, p);
        fxOpacity = THREE.MathUtils.lerp(0.52, 0.24, p);
      } else if (t < 2.48) {
        const p = easeOutCubic((t - 2.06) / 0.42);
        // Swoop into a cinematic 3/4 side-front framing for the busy-activity intro
        const introAngle = state.toYaw + 0.72;
        const endX = state.toPos.x + Math.sin(introAngle) * 2.55;
        const endY = state.toPos.y + 0.15;
        const endZ = state.toPos.z + Math.cos(introAngle) * 2.55;
        state.camPos.set(
          THREE.MathUtils.lerp(state.toPos.x - Math.sin(state.toYaw) * 4.5, endX, p),
          THREE.MathUtils.lerp(state.toPos.y + H1, endY, p),
          THREE.MathUtils.lerp(state.toPos.z - Math.cos(state.toYaw) * 4.5, endZ, p),
        );
        state.lookAt.set(state.toPos.x, state.toPos.y - 0.12, state.toPos.z);
        blurPx = THREE.MathUtils.lerp(1.4, 0, p);
        fxOpacity = THREE.MathUtils.lerp(0.24, 0, p);
      } else {
        // Transition landed -> enter Busy-Activity Intro Phase!
        skyFx.style.opacity = '0';
        skyFx.style.backdropFilter = 'blur(0px)';
        skyFx.style.webkitBackdropFilter = 'blur(0px)';
        hooks.camera.far = state.savedFar;
        hooks.camera.updateProjectionMatrix();

        state.phase = 'busy_intro';
        state.busyTimer = 0;
        state.busyDuration = state.busyScenario?.duration || 2.7;
        state.busyYaw = state.toYaw;

        const meta = CHARACTER_WHEEL_META.find((m) => m.id === state.targetCharId) || CHARACTER_WHEEL_META[0];
        if (bannerEl) bannerEl.style.borderLeftColor = meta.accent;
        if (bannerNameEl) bannerNameEl.textContent = `${meta.bnName} (${meta.enName})`;
        if (bannerActionEl) bannerActionEl.textContent = state.busyScenario?.caption || 'ব্যস্ত ছিল...';
        bannerEl.classList.add('visible');

        hooks.onSkySwitchLanded?.(state.targetCharId, state.busyScenario);
        return;
      }

      skyFx.style.opacity = fxOpacity.toFixed(3);
      skyFx.style.backdropFilter = `blur(${blurPx.toFixed(1)}px) saturate(1.16)`;
      skyFx.style.webkitBackdropFilter = `blur(${blurPx.toFixed(1)}px) saturate(1.16)`;

      camera.position.copy(state.camPos);
      camera.lookAt(state.lookAt);
      return;
    }

    if (state.phase === 'busy_intro') {
      state.busyTimer += rawDelta;
      const p = THREE.MathUtils.clamp(state.busyTimer / state.busyDuration, 0, 1);
      const ease = easeInOutCubic(p);
      const camera = hooks.camera;

      // Gently orbit from 3/4 side-front view around to right behind the switched character's shoulder
      const startAngle = state.busyYaw + 0.72;
      const endAngle = state.busyYaw + Math.PI;
      const curAngle = THREE.MathUtils.lerp(startAngle, endAngle, ease);
      const dist = THREE.MathUtils.lerp(2.55, 1.92, ease);
      const camH = THREE.MathUtils.lerp(0.15, 0.08, ease);

      camera.position.set(
        state.toPos.x + Math.sin(curAngle) * dist,
        state.toPos.y + camH,
        state.toPos.z + Math.cos(curAngle) * dist,
      );
      camera.lookAt(state.toPos.x, state.toPos.y - 0.14, state.toPos.z);

      hooks.onBusyIntroTick?.(rawDelta, state.busyScenario, state.busyYaw);

      if (p >= 1.0) {
        finishBusyIntro();
      }
    }
  }

  return {
    handleKeyDown,
    handleKeyUp,
    handleMouseMove,
    handleBlur,
    update,
    openWheel,
    cancelWheel,
    confirmWheelSelection,
    startSkySwitch,
    finishBusyIntro,
    get isWheelOpen() { return state.wheelOpen; },
    get isTransitioning() { return state.phase === 'sky_switch'; },
    get isBusyIntro() { return state.phase === 'busy_intro'; },
    get isCameraOverridden() { return state.phase === 'sky_switch' || state.phase === 'busy_intro'; },
    get timeScale() { return state.timeScale; },
    get phase() { return state.phase; },
  };
}
