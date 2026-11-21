/**
 * GTA V-Style Player Health System (100 HP)
 * - Max Health: 100
 * - Developer Setting: Unlimited Health (ON by default in Settings tab; ready to wire to dial pad later)
 * - Damage sources: Fall damage, close-range fighting/combat, high-speed vehicle crashes
 * - GTA V-Style Auto-Recovery: After 4.5s without taking damage, smoothly regenerates HP back up to 100
 * - Visual feedback: HUD health bar above Special Ability bar, red damage vignette, and WASTED hospital respawn
 */

const STORAGE_KEY_UNLIMITED = 'taltola_unlimited_health';

export function createHealthSystem({ onToast, onWastedRespawn } = {}) {
  const MAX_HEALTH = 100;
  const REGEN_DELAY = 4.5; // seconds after last hit before GTA V-style recovery begins
  const REGEN_RATE_LOW = 9.0; // faster recovery up to 50 HP (GTA V style)
  const REGEN_RATE_HIGH = 5.5; // steady recovery from 50 to 100 HP

  let health = MAX_HEALTH;
  let unlimitedHealth = (() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UNLIMITED);
      // Developer default: ON unless explicitly turned OFF
      return saved === null ? true : saved === 'on';
    } catch {
      return true;
    }
  })();

  let timeSinceDamage = REGEN_DELAY + 1;
  let damageFlashAlpha = 0;
  let combatDamageCooldown = 0;
  let crashDamageCooldown = 0;
  let isWasted = false;
  let wastedTimer = 0;

  const hudBarEl = document.querySelector('#health-hud-bar');
  const hudValEl = document.querySelector('#health-hud-val');
  const hudFillEl = document.querySelector('#health-hud-fill');
  const hudTagEl = document.querySelector('#health-hud-tag');
  const damageOverlayEl = document.querySelector('#damage-fx-overlay');
  const wastedOverlayEl = document.querySelector('#wasted-overlay');

  let lastRenderedHp = -1;
  let lastRenderedUnlim = null;
  let lastRenderedRegen = null;

  function syncHUD(force = false) {
    const roundedHp = Math.max(0, Math.min(MAX_HEALTH, Math.round(health)));
    const isRegening = !unlimitedHealth && !isWasted && health < MAX_HEALTH && timeSinceDamage >= REGEN_DELAY;

    if (!force && roundedHp === lastRenderedHp && unlimitedHealth === lastRenderedUnlim && isRegening === lastRenderedRegen) {
      return;
    }
    lastRenderedHp = roundedHp;
    lastRenderedUnlim = unlimitedHealth;
    lastRenderedRegen = isRegening;

    if (hudFillEl) {
      hudFillEl.style.width = `${(Math.max(0, Math.min(MAX_HEALTH, health)) / MAX_HEALTH) * 100}%`;
    }
    if (hudValEl) {
      hudValEl.textContent = unlimitedHealth ? '∞ 100' : `${roundedHp}/100`;
    }
    if (hudTagEl) {
      hudTagEl.textContent = unlimitedHealth
        ? '❤️ HEALTH · GOD'
        : (isRegening ? '❤️ RECOVERING+' : '❤️ HEALTH');
    }
    if (hudBarEl) {
      hudBarEl.classList.toggle('is-unlimited', unlimitedHealth);
      hudBarEl.classList.toggle('is-regenerating', isRegening);
      hudBarEl.classList.toggle('is-mid', !unlimitedHealth && roundedHp <= 50 && roundedHp > 25);
      hudBarEl.classList.toggle('is-critical', !unlimitedHealth && roundedHp <= 25);
    }
  }

  function setUnlimitedHealth(enabled, { silent = false } = {}) {
    unlimitedHealth = Boolean(enabled);
    try {
      localStorage.setItem(STORAGE_KEY_UNLIMITED, unlimitedHealth ? 'on' : 'off');
    } catch {}
    if (unlimitedHealth) {
      health = MAX_HEALTH;
      damageFlashAlpha = 0;
      if (damageOverlayEl) damageOverlayEl.style.opacity = '0';
      if (isWasted) {
        isWasted = false;
        wastedTimer = 0;
        wastedOverlayEl?.classList.add('hidden');
      }
    }
    syncHUD(true);
    if (!silent) {
      onToast?.(
        unlimitedHealth
          ? '🛡️ Unlimited Health: ON (Developer Mode · 100 HP Locked)'
          : '❤️ Unlimited Health: OFF (GTA V Health & Auto-Recovery Active)',
      );
    }
  }

  function takeDamage(amount, reason = 'impact') {
    if (isWasted || amount <= 0) return false;
    if (unlimitedHealth) {
      // In Developer Unlimited Health mode, health never drops below 100
      health = MAX_HEALTH;
      syncHUD();
      return false;
    }

    const dmg = Math.max(1, amount);
    health = Math.max(0, health - dmg);
    timeSinceDamage = 0;
    damageFlashAlpha = Math.min(0.88, Math.max(damageFlashAlpha, 0.28 + (dmg / 45) * 0.52));

    if (hudBarEl) {
      hudBarEl.classList.remove('hit-shake');
      void hudBarEl.offsetWidth;
      hudBarEl.classList.add('hit-shake');
    }

    if (health <= 0) {
      isWasted = true;
      wastedTimer = 2.6;
      wastedOverlayEl?.classList.remove('hidden');
      onToast?.('🏥 WASTED! তালতলা হাসপাতালে নেওয়া হচ্ছে...');
    } else if (reason === 'fall' && dmg >= 15) {
      onToast?.(`🤕 পড়ে গিয়ে -${Math.round(dmg)} HP (${Math.round(health)}/100)`);
    }

    syncHUD(true);
    return true;
  }

  function onFallLanding(dropHeightMeters, inWater = false) {
    if (inWater || dropHeightMeters <= 2.75) return false;
    // Realistic GTA V fall curve: light bruise from 3m, heavy hit from rooftop drops
    const excess = dropHeightMeters - 2.5;
    const dmg = Math.min(92, Math.round(5 + excess * 6.4 + (excess > 5 ? (excess - 5) * 4.5 : 0)));
    return takeDamage(dmg, 'fall');
  }

  function onCombatAction(nearPartner = false) {
    if (combatDamageCooldown > 0) return false;
    combatDamageCooldown = nearPartner ? 1.05 : 1.45;
    // Slight health drain during fights / trading blows so player sees GTA V recovery in action
    const dmg = nearPartner ? (5 + Math.floor(Math.random() * 4)) : (3 + Math.floor(Math.random() * 3));
    return takeDamage(dmg, 'fight');
  }

  function onVehicleImpact(intensity = 0) {
    if (crashDamageCooldown > 0 || intensity < 0.36) return false;
    crashDamageCooldown = 1.1;
    const dmg = Math.min(24, Math.round(5 + (intensity - 0.32) * 26));
    return takeDamage(dmg, 'crash');
  }

  function resetHealth() {
    health = MAX_HEALTH;
    timeSinceDamage = REGEN_DELAY + 1;
    damageFlashAlpha = 0;
    isWasted = false;
    wastedTimer = 0;
    if (damageOverlayEl) damageOverlayEl.style.opacity = '0';
    wastedOverlayEl?.classList.add('hidden');
    syncHUD(true);
  }

  function update(delta, { inStudio = false, paused = false } = {}) {
    if (inStudio || paused) return;
    const dt = Math.min(delta, 0.05);

    if (combatDamageCooldown > 0) combatDamageCooldown = Math.max(0, combatDamageCooldown - dt);
    if (crashDamageCooldown > 0) crashDamageCooldown = Math.max(0, crashDamageCooldown - dt);

    if (isWasted) {
      wastedTimer -= dt;
      if (wastedTimer <= 0) {
        isWasted = false;
        health = MAX_HEALTH;
        timeSinceDamage = REGEN_DELAY + 1;
        damageFlashAlpha = 0;
        wastedOverlayEl?.classList.add('hidden');
        if (damageOverlayEl) damageOverlayEl.style.opacity = '0';
        onWastedRespawn?.();
        syncHUD(true);
      }
      return;
    }

    if (unlimitedHealth) {
      if (health < MAX_HEALTH) health = MAX_HEALTH;
    } else {
      timeSinceDamage += dt;
      if (health < MAX_HEALTH && timeSinceDamage >= REGEN_DELAY) {
        const rate = health < 50 ? REGEN_RATE_LOW : REGEN_RATE_HIGH;
        health = Math.min(MAX_HEALTH, health + rate * dt);
      }
    }

    // Smoothly decay damage red flash (keep subtle low-HP pulse when HP <= 25)
    if (damageFlashAlpha > 0) {
      damageFlashAlpha = Math.max(0, damageFlashAlpha - dt * 1.45);
    }
    if (damageOverlayEl) {
      let targetOp = damageFlashAlpha;
      if (!unlimitedHealth && health <= 25 && health > 0) {
        const pulse = 0.18 + Math.abs(Math.sin(performance.now() * 0.006)) * 0.22;
        targetOp = Math.max(targetOp, pulse);
      }
      damageOverlayEl.style.opacity = targetOp > 0.01 ? targetOp.toFixed(3) : '0';
    }

    syncHUD();
  }

  syncHUD(true);

  return {
    get health() { return health; },
    get maxHealth() { return MAX_HEALTH; },
    get unlimitedHealth() { return unlimitedHealth; },
    get isWasted() { return isWasted; },
    setUnlimitedHealth,
    takeDamage,
    onFallLanding,
    onCombatAction,
    onVehicleImpact,
    resetHealth,
    update,
    syncHUD,
  };
}
