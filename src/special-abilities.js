import * as THREE from 'three';

/**
 * Character-Specific Special Ability System (GTA V [CapsLock] / [Z] key):
 *  - Huzzatullah (`kurta_blue`): "হুজ্জা শকওয়েভ ও বড়া ভাই পাওয়ার"
 *      Expanding 3D orange-gold shockwave ring, deep Web Audio sonic boom,
 *      cinematic camera micro-shake, fiery screen vignette & heavy combat slams.
 *  - Sabit (`sabit`): "সাবিদ রিফ্লেক্স ও গলি-মাস্টার পার্কোর"
 *      On foot: Instant Turbo Dash burst, boosted parkour speed, super high jump & mid-air double jump!
 *      Driving: Smooth GTA-style slow-motion driving (0.55x) for razor-sharp Khulna street turns!
 *
 * 100% GPU-lightweight (reusable 3D ring pool + pure CSS vignette overlay) — zero resolution drop, 60 FPS safe.
 */
export function createSpecialAbilitySystem({ scene, onToast }) {
  const overlayEl = document.querySelector('#ability-fx-overlay');
  const hudBarEl = document.querySelector('#ability-hud-bar');
  const hudLabelEl = document.querySelector('#ability-hud-label');
  const hudFillEl = document.querySelector('#ability-hud-fill');
  const hudPctEl = document.querySelector('#ability-hud-pct');

  let charId = 'sabit';
  let active = false;
  let charge = 100; // 0..100
  let dashTimer = 0;
  let dashDirX = 0;
  let dashDirZ = 0;
  let airJumpUsed = false;
  let shakeTimer = 0;
  let shakeIntensity = 0;
  let flashTimer = 0;
  let currentTimeScale = 1.0;
  let lastHudPct = -1;
  let lastHudActive = null;

  // Lightweight pooled 3D shockwave rings (zero per-frame allocations!)
  const ringGroup = new THREE.Group();
  ringGroup.name = 'SpecialAbilityFXRings';
  scene.add(ringGroup);

  const ringGeo = new THREE.RingGeometry(0.45, 0.82, 36);
  ringGeo.rotateX(-Math.PI / 2);
  const ringPool = [];
  for (let i = 0; i < 4; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff8c24,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(ringGeo, mat);
    mesh.visible = false;
    ringGroup.add(mesh);
    ringPool.push({ mesh, mat, age: 0, maxAge: 0.75, maxScale: 9.0, active: false });
  }
  let ringCursor = 0;

  let fxAudioCtx = null;
  function getAudioCtx() {
    if (!fxAudioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) fxAudioCtx = new Ctx();
    }
    if (fxAudioCtx?.state === 'suspended') {
      fxAudioCtx.resume().catch(() => {});
    }
    return fxAudioCtx;
  }

  function playAbilitySound(kind) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const g = ctx.createGain();
      g.connect(ctx.destination);

      if (kind === 'huzza_on') {
        // Deep cinematic sonic boom + authoritative bass drop
        g.gain.setValueAtTime(0.001, now);
        g.gain.exponentialRampToValueAtTime(0.22, now + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(145, now);
        sub.frequency.exponentialRampToValueAtTime(42, now + 0.55);
        sub.connect(g);
        sub.start(now);
        sub.stop(now + 0.66);

        const grit = ctx.createOscillator();
        grit.type = 'sawtooth';
        grit.frequency.setValueAtTime(220, now);
        grit.frequency.exponentialRampToValueAtTime(68, now + 0.38);
        const filt = ctx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.value = 520;
        grit.connect(filt);
        filt.connect(g);
        grit.start(now);
        grit.stop(now + 0.42);
      } else if (kind === 'huzza_slam') {
        g.gain.setValueAtTime(0.001, now);
        g.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.30);
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(36, now + 0.28);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.32);
      } else if (kind === 'sabit_on') {
        // Crisp GTA-style reflex time-warp chime + upward shimmer
        g.gain.setValueAtTime(0.001, now);
        g.gain.exponentialRampToValueAtTime(0.14, now + 0.025);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

        const o1 = ctx.createOscillator();
        o1.type = 'sine';
        o1.frequency.setValueAtTime(360, now);
        o1.frequency.exponentialRampToValueAtTime(740, now + 0.22);
        o1.connect(g);
        o1.start(now);
        o1.stop(now + 0.48);

        const o2 = ctx.createOscillator();
        o2.type = 'triangle';
        o2.frequency.setValueAtTime(540, now + 0.05);
        o2.frequency.exponentialRampToValueAtTime(1080, now + 0.32);
        o2.connect(g);
        o2.start(now + 0.05);
        o2.stop(now + 0.48);
      } else if (kind === 'off') {
        // Clean power-down sweep
        g.gain.setValueAtTime(0.001, now);
        g.gain.exponentialRampToValueAtTime(0.10, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(460, now);
        o.frequency.exponentialRampToValueAtTime(190, now + 0.26);
        o.connect(g);
        o.start(now);
        o.stop(now + 0.29);
      }
    } catch {}
  }

  function spawnRing(pos, { color = 0xff8c24, maxScale = 9.0, maxAge = 0.72 } = {}) {
    if (!pos) return;
    const slot = ringPool[ringCursor++ % ringPool.length];
    slot.active = true;
    slot.age = 0;
    slot.maxAge = maxAge;
    slot.maxScale = maxScale;
    slot.mat.color.setHex(color);
    slot.mat.opacity = 0.85;
    slot.mesh.position.set(pos.x, Math.max(0.08, (pos.y ?? 1.68) - 1.56), pos.z);
    slot.mesh.scale.setScalar(0.5);
    slot.mesh.visible = true;
  }

  function syncThemeUI() {
    const isHuzza = charId === 'kurta_blue';
    hudBarEl?.classList.toggle('theme-huzza', isHuzza);
    hudBarEl?.classList.toggle('theme-sabit', !isHuzza);
    overlayEl?.classList.toggle('theme-huzza', isHuzza);
    overlayEl?.classList.toggle('theme-sabit', !isHuzza);
    if (hudLabelEl) {
      hudLabelEl.textContent = isHuzza
        ? '🔥 হুজ্জা শকওয়েভ [CAPS]'
        : '⚡ সাবিদ রিফ্লেক্স [CAPS]';
    }
  }

  function syncMeterUI(force = false) {
    const pct = Math.round(THREE.MathUtils.clamp(charge, 0, 100));
    if (!force && pct === lastHudPct && active === lastHudActive) return;
    lastHudPct = pct;
    lastHudActive = active;
    if (hudFillEl) hudFillEl.style.width = `${pct}%`;
    if (hudPctEl) hudPctEl.textContent = `${pct}%`;
    hudBarEl?.classList.toggle('is-active', active);
    hudBarEl?.classList.toggle('is-low', pct < 20 && !active);
    overlayEl?.classList.toggle('active', active);
  }

  function setCharacter(nextCharId) {
    const normalized = nextCharId === 'kurta_blue' ? 'kurta_blue' : 'sabit';
    if (normalized !== charId) {
      deactivate(true);
      charId = normalized;
      syncThemeUI();
      syncMeterUI(true);
    } else {
      syncThemeUI();
    }
  }

  function triggerPulseFlash() {
    flashTimer = 0.28;
    overlayEl?.classList.add('pulse-flash');
  }

  function deactivate(silent = false, playerCharacter = null) {
    if (!active) return;
    active = false;
    dashTimer = 0;
    airJumpUsed = false;
    if (playerCharacter?.state?.expression === 'angry' && charId === 'kurta_blue') {
      playerCharacter.setExpression?.('normal');
    }
    if (!silent) playAbilitySound('off');
    syncMeterUI(true);
  }

  function toggle({ pos, forwardVec, isDriving = false, inMosque = false, playerCharacter = null } = {}) {
    if (active) {
      deactivate(false, playerCharacter);
      return false;
    }
    if (inMosque) {
      onToast?.('🕌 মডেল মসজিদে স্পেশাল অ্যাবিলিটি বন্ধ আছে — বাইরে বের হলে চালু হবে।');
      return false;
    }
    if (charge < 16) {
      onToast?.('⏳ অ্যাবিলিটি চার্জ হচ্ছে — একটু অপেক্ষা করো!');
      return false;
    }

    active = true;
    airJumpUsed = false;
    triggerPulseFlash();

    const isHuzza = charId === 'kurta_blue';
    if (isHuzza) {
      playAbilitySound('huzza_on');
      shakeTimer = 0.42;
      shakeIntensity = 0.085;
      spawnRing(pos, { color: 0xff7b1c, maxScale: 11.5, maxAge: 0.78 });
      playerCharacter?.setExpression?.('angry');
      onToast?.(isDriving
        ? '🔥 হুজ্জা পাওয়ার অন! (হাই টর্ক ও শকওয়েভ)'
        : '🔥 হুজ্জা শকওয়েভ অন! (সুপার পাওয়ার ফাইট)');
    } else {
      playAbilitySound('sabit_on');
      spawnRing(pos, { color: 0x10e8b8, maxScale: 7.5, maxAge: 0.58 });
      if (!isDriving && forwardVec) {
        dashTimer = 0.28;
        dashDirX = forwardVec.x;
        dashDirZ = forwardVec.z;
      }
      onToast?.(isDriving
        ? '⚡ সাবিদ স্লো-মো ড্রাইভিং অন! (শার্প কর্নারিং)'
        : '⚡ সাবিদ গলি-মাস্টার পার্কোর ও টার্বো ড্যাশ অন!');
    }

    syncThemeUI();
    syncMeterUI(true);
    return true;
  }

  function onCombatHit(pos) {
    if (!active || charId !== 'kurta_blue') return;
    playAbilitySound('huzza_slam');
    shakeTimer = Math.max(shakeTimer, 0.20);
    shakeIntensity = Math.max(shakeIntensity, 0.048);
    spawnRing(pos, { color: 0xff9e2c, maxScale: 6.5, maxAge: 0.48 });
    triggerPulseFlash();
  }

  function onGrounded() {
    airJumpUsed = false;
  }

  function consumeAirJump(pos) {
    if (!active || charId !== 'sabit' || airJumpUsed) return false;
    airJumpUsed = true;
    spawnRing(pos, { color: 0x22f5c4, maxScale: 4.8, maxAge: 0.42 });
    playAbilitySound('sabit_on');
    return true;
  }

  function update(rawDelta, { isDriving = false, inStudio = false, inMosque = false, playerCharacter = null } = {}) {
    const dt = Math.min(Math.max(rawDelta || 0.016, 0.001), 0.05);

    if (inStudio || inMosque) {
      if (active) deactivate(true, playerCharacter);
    }

    if (flashTimer > 0) {
      flashTimer = Math.max(0, flashTimer - dt);
      if (flashTimer <= 0) overlayEl?.classList.remove('pulse-flash');
    }

    if (dashTimer > 0) {
      dashTimer = Math.max(0, dashTimer - dt);
    }

    if (shakeTimer > 0) {
      shakeTimer = Math.max(0, shakeTimer - dt);
    }

    if (active) {
      // Drains ~10.5% per second (~9.5s full bar duration)
      charge = Math.max(0, charge - dt * 10.5);
      if (charge <= 0) {
        deactivate(false, playerCharacter);
      }
    } else if (!inStudio) {
      // Recharges ~9% per second (~11s to full)
      charge = Math.min(100, charge + dt * 9.0);
    }

    // Smooth GTA-style time dilation (Sabit slow-mo driving 0.55x; Huzzatullah subtle power weight 0.88x)
    const targetScale = !active
      ? 1.0
      : (charId === 'sabit' ? (isDriving ? 0.55 : 0.92) : (isDriving ? 0.85 : 0.90));
    currentTimeScale += (targetScale - currentTimeScale) * Math.min(1, dt * 10.0);

    // Update active 3D shockwave rings
    for (const slot of ringPool) {
      if (!slot.active) continue;
      slot.age += dt;
      const t = slot.age / slot.maxAge;
      if (t >= 1.0) {
        slot.active = false;
        slot.mesh.visible = false;
      } else {
        const ease = 1 - Math.pow(1 - t, 3);
        slot.mesh.scale.setScalar(0.5 + ease * slot.maxScale);
        slot.mat.opacity = (1 - t) * (1 - t) * 0.82;
      }
    }

    syncMeterUI(false);
  }

  function applyCameraShake(camera) {
    if (!camera || shakeTimer <= 0) return;
    const decay = THREE.MathUtils.clamp(shakeTimer / 0.42, 0, 1);
    const amp = shakeIntensity * decay;
    camera.position.x += (Math.random() - 0.5) * amp;
    camera.position.y += (Math.random() - 0.5) * amp;
  }

  syncThemeUI();
  syncMeterUI(true);

  return {
    get active() { return active; },
    get charge() { return charge; },
    get charId() { return charId; },
    get timeScale() { return currentTimeScale; },
    get speedMultiplier() {
      if (!active) return 1.0;
      return charId === 'sabit' ? 1.44 : 1.18;
    },
    get jumpMultiplier() {
      if (!active) return 1.0;
      return charId === 'sabit' ? 1.38 : 1.14;
    },
    get fovKick() {
      if (!active) return 0;
      return charId === 'sabit' ? 6.5 : -3.5;
    },
    get dashActive() { return active && charId === 'sabit' && dashTimer > 0; },
    get dashDirX() { return dashDirX; },
    get dashDirZ() { return dashDirZ; },
    setCharacter,
    toggle,
    deactivate,
    onCombatHit,
    onGrounded,
    consumeAirJump,
    update,
    applyCameraShake,
  };
}
