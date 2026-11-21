import * as THREE from 'three';
import { TALTOLA_HOUSE_OFFSET } from './khulna-geo.js';

const AI_EYE_HEIGHT = 1.68;
const STATIONARY_CLIPS = ['StandingRelax', 'PhoneCall', 'MobileGame', 'Pocket', 'WarmUp', 'Laugh'];

/**
 * Keeps the inactive character (e.g. Huzzatullah or Sabit) calmly stationed in ONE place
 * with natural stationary idle/phone/relax animations (NO random wandering or car stealing).
 * When the player triggers GTA V Character Switch, the inactive character stays right at their
 * spot performing a live activity animation during the sky-zoom-in transition!
 */
export function createAutonomousPartner() {
  let actor = null;
  let profile = { id: 'kurta_blue', shortName: 'Huzzatullah' };

  // Default stationary spot near Taltola House courtyard/street edge (never wanders off!)
  const pos = new THREE.Vector3(TALTOLA_HOUSE_OFFSET.x - 2.6, AI_EYE_HEIGHT, TALTOLA_HOUSE_OFFSET.z + 7.2);
  let yaw = Math.PI * 0.15;
  let actionClip = 'StandingRelax';
  let actionTimer = 9.0;
  let statusText = 'Standing nearby';

  function updateStatusLabel(clip) {
    if (clip === 'PhoneCall') statusText = 'ফোনে কথা বলছে';
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
    // Only position cleanly once on initial game start — never wanders afterwards!
    const sx = (playerPos?.x ?? TALTOLA_HOUSE_OFFSET.x) - 2.6;
    const sz = (playerPos?.z ?? TALTOLA_HOUSE_OFFSET.z) + 5.8;
    pos.set(sx, playerPos?.y ?? AI_EYE_HEIGHT, sz);
    yaw = playerPos ? Math.atan2(playerPos.x - sx, playerPos.z - sz) : 0;
    actionClip = 'StandingRelax';
    actionTimer = 10.0;
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

  function update(delta, ctx) {
    if (!actor || !actor.state.loaded) return;
    const { playerPos, inStudio, quality } = ctx;
    if (inStudio) return;

    const dt = Math.min(delta, 0.09);
    actionTimer -= dt;
    if (actionTimer <= 0) {
      actionClip = STATIONARY_CLIPS[Math.floor(Math.random() * STATIONARY_CLIPS.length)];
      actionTimer = 9.0 + Math.random() * 7.0;
      updateStatusLabel(actionClip);
    }

    const distToPlayer = Math.hypot((playerPos?.x ?? 0) - pos.x, (playerPos?.z ?? 0) - pos.z);
    if (distToPlayer < 120 || quality !== 'low') {
      actor.state.facingYaw = yaw;
      actor.setPhoneInHand?.(actionClip === 'PhoneCall' || actionClip === 'MobileGame');
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
        customClip: { name: actionClip, loopOnce: false, timeScale: 1.0 },
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
    update,
    getHUDStatus,
    get position() { return pos; },
    get yaw() { return yaw; },
    get mode() { return 'chill'; },
    get activeCar() { return null; },
  };
}
