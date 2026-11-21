import * as THREE from 'three';
import { TALTOLA_HOUSE_OFFSET } from './khulna-geo.js';
import { VOICE_CLIPS, VOICE_BUS } from './voice-clips.js';

const AI_EYE_HEIGHT = 1.68;
const STATIONARY_CLIPS = ['StandingRelax', 'PhoneCall', 'MobileGame', 'Pocket', 'WarmUp', 'Laugh'];

/**
 * Keeps the inactive character (Huzzatullah or Sabit) calmly stationed in ONE place
 * with natural stationary idle/phone/relax animations.
 *
 * SYNCED PROXIMITY COMBAT VOICE SYSTEM:
 * - Fighting voices NEVER spam in empty air or just by walking nearby.
 * - ONLY when Sabit & Huzzatullah are within 4.6m AND throwing punches/kicks,
 *   they perform a clean, synced 2-turn back-and-forth dialogue (first the attacker,
 *   then a crisp 380ms-paused reply from the other character via VOICE_BUS), followed
 *   by a comfortable 6.5s cooldown so the gamer hears both voices clearly and enjoys it!
 */
export function createAutonomousPartner() {
  let actor = null;
  let profile = { id: 'kurta_blue', shortName: 'Huzzatullah' };

  const pos = new THREE.Vector3(TALTOLA_HOUSE_OFFSET.x - 2.6, AI_EYE_HEIGHT, TALTOLA_HOUSE_OFFSET.z + 7.2);
  let yaw = Math.PI * 0.15;
  let actionClip = 'StandingRelax';
  let actionTimer = 9.0;
  let statusText = 'এক জায়গায় দাঁড়িয়ে আছে';

  // Synced Combat Exchange State (non-spammy, turn-based)
  let exchangeCooldown = 0;
  let exchangeActive = false;
  let replyTimer = 0;
  let pendingReplyFn = null;
  let angryReactTimer = 0;
  let angryClipName = 'Angry1';
  let huzzatullahStep = 0;
  let sabitStep = 0;

  function updateStatusLabel(clip) {
    if (angryReactTimer > 0) statusText = 'মারপিটে জবাব দিচ্ছে!';
    else if (clip === 'PhoneCall') statusText = 'ফোনে কথা বলছে';
    else if (clip === 'MobileGame') statusText = 'মোবাইলে ব্যস্ত';
    else if (clip === 'WarmUp') statusText = 'ওয়ার্ম-আপ করছে';
    else if (clip === 'Pocket') statusText = 'দাঁড়িয়ে আশপাশ দেখছে';
    else if (clip === 'Laugh') statusText = 'হাসছে';
    else statusText = 'এক জায়গায় দাঁড়িয়ে আছে';
  }
  updateStatusLabel(actionClip);

  function cancelPendingExchange() {
    exchangeActive = false;
    replyTimer = 0;
    pendingReplyFn = null;
  }

  function setActor(nextActor, nextProfile) {
    actor = nextActor;
    profile = nextProfile || profile;
    angryReactTimer = 0;
    cancelPendingExchange();
    if (actor) {
      actor.state.cameraMode = 'back';
      actor.state.thirdPerson = true;
      actor.state.straightGaze = true;
      actor.state.facingYaw = yaw;
      if (actor.root) {
        actor.root.position.set(pos.x, pos.y - AI_EYE_HEIGHT, pos.z);
        actor.root.rotation.y = yaw;
      }
    }
  }

  function relocateNearPlayer(playerPos, _cars, _envRef, _preferCar = false) {
    const sx = (playerPos?.x ?? TALTOLA_HOUSE_OFFSET.x) - 2.6;
    const sz = (playerPos?.z ?? TALTOLA_HOUSE_OFFSET.z) + 5.8;
    pos.set(sx, playerPos?.y ?? AI_EYE_HEIGHT, sz);
    yaw = playerPos ? Math.atan2(playerPos.x - sx, playerPos.z - sz) : 0;
    actionClip = 'StandingRelax';
    actionTimer = 10.0;
    angryReactTimer = 0;
    cancelPendingExchange();
    updateStatusLabel(actionClip);
    if (actor?.root) {
      actor.state.facingYaw = yaw;
      actor.root.position.set(pos.x, pos.y - AI_EYE_HEIGHT, pos.z);
      actor.root.rotation.y = yaw;
    }
  }

  function placeAt(x, y, z, nextYaw = 0, _nextMode = 'chill') {
    pos.set(x, Math.max(AI_EYE_HEIGHT, y), z);
    yaw = nextYaw;
    actionClip = STATIONARY_CLIPS[Math.floor(Math.random() * STATIONARY_CLIPS.length)];
    actionTimer = 10.0 + Math.random() * 6.0;
    angryReactTimer = 0;
    cancelPendingExchange();
    updateStatusLabel(actionClip);
    if (actor?.root) {
      actor.state.facingYaw = yaw;
      actor.root.position.set(pos.x, pos.y - AI_EYE_HEIGHT, pos.z);
      actor.root.rotation.y = yaw;
    }
  }

  function onPlayerEnterCar() {
    cancelPendingExchange();
  }

  function nextHuzzatullahClip() {
    const pool = [
      VOICE_CLIPS.huzzatullahAnnoyed,
      ...(VOICE_CLIPS.huzzatullahFight || []),
    ].filter((v) => v && v.length);
    if (!pool.length) return null;
    return pool[huzzatullahStep++ % pool.length];
  }

  function nextSabitClip() {
    const pool = (VOICE_CLIPS.sabitPanicFight || []).filter((v) => v && v.length);
    if (!pool.length) return null;
    return pool[sabitStep++ % pool.length];
  }

  function startSyncedCombatExchange(playerPos, playerCharacter) {
    if (!actor || !playerCharacter) return;
    if (exchangeActive || exchangeCooldown > 0 || VOICE_BUS.isAnySpeaking()) return;

    const partnerIsHuzzatullah = profile?.id === 'kurta_blue';
    const playerIsHuzzatullah = !partnerIsHuzzatullah;

    const firstClip = playerIsHuzzatullah ? nextHuzzatullahClip() : nextSabitClip();
    const secondClip = partnerIsHuzzatullah ? nextHuzzatullahClip() : nextSabitClip();
    if (!firstClip && !secondClip) return;

    exchangeActive = true;
    exchangeCooldown = 6.5; // Comfortable cooldown so voices stay fun and never annoying!
    angryReactTimer = 5.5;
    angryClipName = partnerIsHuzzatullah ? (Math.random() < 0.5 ? 'Angry1' : 'Angry2') : 'HitBody';
    if (playerPos) {
      yaw = Math.atan2(playerPos.x - pos.x, playerPos.z - pos.z);
    }
    actor.setPhoneInHand?.(false);
    actor.setExpression?.(partnerIsHuzzatullah ? 'angry' : 'surprised');
    updateStatusLabel(angryClipName);

    const schedulePartnerReply = () => {
      if (!secondClip) {
        exchangeActive = false;
        return;
      }
      replyTimer = 0.38; // Clean 380ms natural breath pause between Turn 1 & Turn 2!
      pendingReplyFn = () => {
        if (!actor) {
          exchangeActive = false;
          return;
        }
        angryReactTimer = Math.max(angryReactTimer, 3.6);
        actor.setExpression?.(partnerIsHuzzatullah ? 'angry' : 'surprised');
        actor.playVoiceClip?.(secondClip, {
          expression: partnerIsHuzzatullah ? 'angry' : 'surprised',
          volume: 0.90,
          onEnd: () => {
            exchangeActive = false;
            angryReactTimer = Math.min(angryReactTimer, 0.35);
            actor?.setExpression?.('normal');
          },
        });
      };
    };

    // Turn 1: Player character speaks clearly first, then Turn 2: Partner replies in sync!
    if (firstClip) {
      playerCharacter.playVoiceClip?.(firstClip, {
        expression: playerIsHuzzatullah ? 'angry' : 'surprised',
        volume: 0.88,
        onEnd: () => {
          schedulePartnerReply();
        },
      });
    } else {
      schedulePartnerReply();
    }
  }

  function triggerAnnoyedReaction(playerPos, fromFight = false, playerCharacter = null) {
    if (!fromFight) return; // Never annoyingly yell just for standing near!
    startSyncedCombatExchange(playerPos, playerCharacter);
  }

  function update(delta, ctx) {
    if (!actor || !actor.state.loaded) return;
    const { playerPos, playerCharacter, environment, inStudio, quality } = ctx;
    if (inStudio) return;

    const dt = Math.min(delta, 0.09);
    if (exchangeCooldown > 0) exchangeCooldown = Math.max(0, exchangeCooldown - dt);

    const partnerInMosque = Boolean(environment?.landmarks?.aliaMadrasah?.isInModelMosqueZone?.(pos));
    const playerInMosque = Boolean(environment?.landmarks?.aliaMadrasah?.isInModelMosqueZone?.(playerPos));
    actor.setSacredSilence?.(partnerInMosque);

    const distToPlayer = Math.hypot((playerPos?.x ?? 0) - pos.x, (playerPos?.z ?? 0) - pos.z);

    if (partnerInMosque || playerInMosque) {
      angryReactTimer = 0;
      cancelPendingExchange();
      if (actor.isVoicePlaying?.()) actor.stopVoiceClip?.();
    } else {
      // Handle scheduled Turn 2 synced reply cleanly after Turn 1 finishes
      if (pendingReplyFn && replyTimer > 0) {
        replyTimer -= dt;
        if (replyTimer <= 0) {
          const fn = pendingReplyFn;
          pendingReplyFn = null;
          if (distToPlayer < 7.0) {
            fn();
          } else {
            exchangeActive = false;
          }
        }
      }

      // ONLY trigger synced combat voices when Sabit & Huzzatullah are close (< 4.6m) AND actually fighting!
      const playerAttacking = Boolean(
        playerCharacter?.state?.attackTimer > 0
        || playerCharacter?.state?.emote === 'kick'
        || playerCharacter?.state?.emote === 'kick2'
        || playerCharacter?.state?.emote === 'combo'
      );
      if (playerAttacking && distToPlayer < 4.6) {
        startSyncedCombatExchange(playerPos, playerCharacter);
      }
    }

    const isFunnyVoicePlaying = Boolean(!partnerInMosque && !playerInMosque && actor.isVoicePlaying?.() && actor.state?.voiceExpression === 'happy');
    if (angryReactTimer > 0 || isFunnyVoicePlaying) {
      if (angryReactTimer > 0) angryReactTimer = Math.max(0, angryReactTimer - dt);
      if (playerPos) {
        const targetYaw = Math.atan2(playerPos.x - pos.x, playerPos.z - pos.z);
        const diff = Math.atan2(Math.sin(targetYaw - yaw), Math.cos(targetYaw - yaw));
        yaw += diff * Math.min(1, dt * 8.0);
      }
      if (angryReactTimer <= 0 && !actor.isVoicePlaying?.()) {
        actor.setExpression?.('normal');
        updateStatusLabel(actionClip);
      }
    } else {
      actionTimer -= dt;
      if (actionTimer <= 0) {
        actionClip = STATIONARY_CLIPS[Math.floor(Math.random() * STATIONARY_CLIPS.length)];
        actionTimer = 9.0 + Math.random() * 7.0;
        updateStatusLabel(actionClip);
      }
    }

    if (distToPlayer < 120 || quality !== 'low') {
      const isAngryReacting = !partnerInMosque && !playerInMosque && (angryReactTimer > 0 || (actor.isVoicePlaying?.() && actor.state?.voiceExpression === 'angry'));
      const activeClipNow = isAngryReacting ? angryClipName : (isFunnyVoicePlaying ? 'StandingRelax' : actionClip);
      actor.state.facingYaw = yaw;
      actor.setPhoneInHand?.(!isAngryReacting && !isFunnyVoicePlaying && (actionClip === 'PhoneCall' || actionClip === 'MobileGame'));
      actor.update(dt, {
        position: pos,
        yaw: yaw + Math.PI,
        speed: 0,
        maxSpeed: 3.45,
        grounded: true,
        isSprinting: false,
        moveDirX: 0,
        moveDirZ: 0,
        inStudio: false,
        hideMesh: false,
        customClip: { name: activeClipNow, loopOnce: false, timeScale: 1.0 },
      });
    } else if (actor.root) {
      actor.root.position.set(pos.x, pos.y - AI_EYE_HEIGHT, pos.z);
      actor.root.rotation.y = yaw;
    }
  }

  function getHUDStatus() {
    if (!actor || !actor.state.loaded) return null;
    return {
      visible: true,
      name: profile?.shortName || 'Huzzatullah',
      statusText,
      x: pos.x,
      z: pos.z,
      yaw,
      inCar: null,
    };
  }

  return {
    setActor,
    relocateNearPlayer,
    placeAt,
    onPlayerEnterCar,
    triggerAnnoyedReaction,
    update,
    getHUDStatus,
    get position() { return pos; },
    get yaw() { return yaw; },
    get mode() { return 'chill'; },
    get activeCar() { return null; },
  };
}
