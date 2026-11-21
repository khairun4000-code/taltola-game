import * as THREE from 'three';
import { TALTOLA_HOUSE_OFFSET } from './khulna-geo.js';
import { VOICE_CLIPS } from './voice-clips.js';

const AI_EYE_HEIGHT = 1.68;
const STATIONARY_CLIPS = ['StandingRelax', 'PhoneCall', 'MobileGame', 'Pocket', 'WarmUp', 'Laugh'];

/**
 * Keeps the inactive character (e.g. Huzzatullah or Sabit) calmly stationed in ONE place
 * with natural stationary idle/phone/relax animations (NO random wandering or car stealing).
 * When Sabit punches, kicks, or crowds/bothers Huzzatullah while he is standing calmly,
 * Huzzatullah turns to face Sabit, puts on an angry expression, and speaks his ElevenLabs
 * voice line with real-time ARKit mouth lip-sync!
 */
export function createAutonomousPartner() {
  let actor = null;
  let profile = { id: 'kurta_blue', shortName: 'Huzzatullah' };

  // Default stationary spot near Taltola House courtyard/street edge (never wanders off!)
  const pos = new THREE.Vector3(TALTOLA_HOUSE_OFFSET.x - 2.6, AI_EYE_HEIGHT, TALTOLA_HOUSE_OFFSET.z + 7.2);
  let yaw = Math.PI * 0.15;
  let actionClip = 'StandingRelax';
  let actionTimer = 9.0;
  let statusText = 'এক জায়গায় দাঁড়িয়ে আছে';

  // Annoyance & Angry Voice Reaction state
  let annoyCooldown = 0;
  let crowdTimer = 0;
  let angryReactTimer = 0;
  let angryClipName = 'Angry1';
  let annoyedVoiceStep = 0;

  function updateStatusLabel(clip) {
    if (angryReactTimer > 0) statusText = 'রেগে বকা দিচ্ছে!';
    else if (clip === 'PhoneCall') statusText = 'ফোনে কথা বলছে';
    else if (clip === 'MobileGame') statusText = 'মোবাইলে ব্যস্ত';
    else if (clip === 'WarmUp') statusText = 'ওয়ার্ম-আপ করছে';
    else if (clip === 'Pocket') statusText = 'দাঁড়িয়ে আশপাশ দেখছে';
    else if (clip === 'Laugh') statusText = 'হাসছে';
    else statusText = 'এক জায়গায় দাঁড়িয়ে আছে';
  }
  updateStatusLabel(actionClip);

  function setActor(nextActor, nextProfile) {
    actor = nextActor;
    profile = nextProfile || profile;
    angryReactTimer = 0;
    crowdTimer = 0;
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
    crowdTimer = 0;
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
    crowdTimer = 0;
    updateStatusLabel(actionClip);
    if (actor?.root) {
      actor.state.facingYaw = yaw;
      actor.root.position.set(pos.x, pos.y - AI_EYE_HEIGHT, pos.z);
      actor.root.rotation.y = yaw;
    }
  }

  function onPlayerEnterCar() {
    // Partner stays stationary at their spot; does not react or chase cars
  }

  function triggerAnnoyedReaction(playerPos, fromFight = false) {
    if (!actor || annoyCooldown > 0 || actor.isVoicePlaying?.()) return;
    // Only Huzzatullah (kurta_blue) plays his angry/fight reaction voice lines when bothered by Sabit
    const isHuzzatullah = profile?.id === 'kurta_blue';
    if (!isHuzzatullah) return;

    annoyCooldown = fromFight ? 1.6 : 4.0;
    angryReactTimer = 4.2;
    crowdTimer = 0;
    angryClipName = Math.random() < 0.5 ? 'Angry1' : 'Angry2';
    if (playerPos) {
      yaw = Math.atan2(playerPos.x - pos.x, playerPos.z - pos.z);
    }
    actor.setPhoneInHand?.(false);
    actor.setExpression?.('angry');
    updateStatusLabel(angryClipName);

    const fightPool = [
      VOICE_CLIPS.huzzatullahAnnoyed,
      ...(VOICE_CLIPS.huzzatullahFight || []),
    ].filter((v) => v && v.length);
    const clipUrls = fromFight && fightPool.length
      ? fightPool[annoyedVoiceStep++ % fightPool.length]
      : VOICE_CLIPS.huzzatullahAnnoyed;

    actor.playVoiceClip?.(clipUrls, {
      expression: 'angry',
      volume: 1.0,
      onEnd: () => {
        angryReactTimer = Math.min(angryReactTimer, 0.35);
        actor?.setExpression?.('normal');
      },
    });
  }

  function update(delta, ctx) {
    if (!actor || !actor.state.loaded) return;
    const { playerPos, playerCharacter, inStudio, quality } = ctx;
    if (inStudio) return;

    const dt = Math.min(delta, 0.09);
    if (annoyCooldown > 0) annoyCooldown = Math.max(0, annoyCooldown - dt);

    const distToPlayer = Math.hypot((playerPos?.x ?? 0) - pos.x, (playerPos?.z ?? 0) - pos.z);

    // Detect if Sabit is punching/kicking nearby OR persistently crowding/bothering Huzzatullah
    const playerAttacking = Boolean(
      playerCharacter?.state?.attackTimer > 0
      || playerCharacter?.state?.emote === 'kick'
      || playerCharacter?.state?.emote === 'kick2'
      || playerCharacter?.state?.emote === 'combo'
    );
    if (playerAttacking && distToPlayer < 4.8) {
      triggerAnnoyedReaction(playerPos, true);
    } else if (distToPlayer < 1.18) {
      crowdTimer += dt;
      if (crowdTimer >= 0.75) {
        triggerAnnoyedReaction(playerPos, false);
      }
    } else {
      crowdTimer = Math.max(0, crowdTimer - dt * 1.5);
    }

    const isFunnyVoicePlaying = Boolean(actor.isVoicePlaying?.() && actor.state?.voiceExpression === 'happy');
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
      const isAngryReacting = angryReactTimer > 0 || (actor.isVoicePlaying?.() && actor.state?.voiceExpression === 'angry');
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
