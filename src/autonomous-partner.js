import * as THREE from 'three';
import worldData from './data/khulna-world-data.json';
import { TALTOLA_HOUSE_OFFSET } from './khulna-geo.js';

const AI_EYE_HEIGHT = 1.68;

function wrapAngleDelta(diff) {
  return Math.atan2(Math.sin(diff), Math.cos(diff));
}

function buildRoadGraph() {
  const nodes = [];
  const edges = [];

  for (const r of worldData.roads) {
    if (r.t > 3) continue;
    const pts = r.p;
    if (!pts || pts.length < 4) continue;
    let prevNodeIdx = -1;
    for (let i = 0; i < pts.length; i += 2) {
      const x = pts[i];
      const z = pts[i + 1];
      // Skip points tightly inside Haji Mohsin compound or outside main playable road bounds
      if (x < -780 || x > 1180 || z < -940 || z > 1180) {
        prevNodeIdx = -1;
        continue;
      }
      const idx = nodes.length;
      nodes.push({ x, z, neighbors: [] });
      if (prevNodeIdx >= 0) {
        const dist = Math.hypot(x - nodes[prevNodeIdx].x, z - nodes[prevNodeIdx].z);
        if (dist > 2.5 && dist < 140) {
          edges.push([prevNodeIdx, idx]);
        }
      }
      prevNodeIdx = idx;
    }
  }

  for (const [a, b] of edges) {
    if (!nodes[a].neighbors.includes(b)) nodes[a].neighbors.push(b);
    if (!nodes[b].neighbors.includes(a)) nodes[b].neighbors.push(a);
  }

  // Stitch nearby road intersections within 14m using spatial hashing so AI can loop seamlessly across Khulna!
  const CELL = 16;
  const grid = new Map();
  for (let i = 0; i < nodes.length; i++) {
    const cx = Math.floor(nodes[i].x / CELL);
    const cz = Math.floor(nodes[i].z / CELL);
    const key = `${cx},${cz}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(i);
  }

  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    const cx = Math.floor(a.x / CELL);
    const cz = Math.floor(a.z / CELL);
    for (let ox = -1; ox <= 1; ox++) {
      for (let oz = -1; oz <= 1; oz++) {
        const bucket = grid.get(`${cx + ox},${cz + oz}`);
        if (!bucket) continue;
        for (const j of bucket) {
          if (j <= i) continue;
          if (a.neighbors.includes(j)) continue;
          const b = nodes[j];
          const d2 = (a.x - b.x) ** 2 + (a.z - b.z) ** 2;
          if (d2 < 14 * 14 && d2 > 1.0) {
            a.neighbors.push(j);
            b.neighbors.push(i);
          }
        }
      }
    }
  }

  function findNearestNode(x, z, maxDist = 260) {
    let best = -1;
    let bestD2 = maxDist * maxDist;
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].neighbors.length === 0) continue;
      const d2 = (nodes[i].x - x) ** 2 + (nodes[i].z - z) ** 2;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = i;
      }
    }
    return best;
  }

  function pickNextNode(curIdx, prevIdx, heading) {
    const cur = nodes[curIdx];
    if (!cur || !cur.neighbors.length) return -1;
    const candidates = cur.neighbors.filter((n) => n !== prevIdx);
    const pool = candidates.length ? candidates : cur.neighbors;
    const fx = Math.sin(heading);
    const fz = Math.cos(heading);
    let best = pool[0];
    let bestScore = -999;
    for (const ni of pool) {
      const nb = nodes[ni];
      const dx = nb.x - cur.x;
      const dz = nb.z - cur.z;
      const len = Math.max(0.01, Math.hypot(dx, dz));
      const dot = (dx * fx + dz * fz) / len;
      // Favor continuing smoothly forward with slight exploration jitter
      const score = dot + (Math.random() - 0.5) * 0.48;
      if (score > bestScore) {
        bestScore = score;
        best = ni;
      }
    }
    return best;
  }

  return { nodes, findNearestNode, pickNextNode };
}

function isBlockedForPedestrian(x, z, envRef) {
  if (envRef?.city?.isInWater?.(x, z)) return true;
  // Taltola 5-Story House walls
  const lx = x - TALTOLA_HOUSE_OFFSET.x;
  const lz = z - TALTOLA_HOUSE_OFFSET.z;
  if (lx > 1.8 && lx < 22.5 && Math.abs(lz) < 8.8) return true;
  // SK Arshan Alif Tower / Haji Mohsin interior structure footprint
  if (x <= -2.4 && x >= -21.0 && z >= 13.5 && z <= 29.0) return true;
  return false;
}

export function createAutonomousPartner() {
  const roadGraph = buildRoadGraph();
  let actor = null;
  let profile = { id: 'kurta_blue', shortName: 'Huzzatullah' };

  const pos = new THREE.Vector3(TALTOLA_HOUSE_OFFSET.x - 2.6, AI_EYE_HEIGHT, TALTOLA_HOUSE_OFFSET.z + 9.0);
  let yaw = 0;
  let speed = 0;

  let mode = 'gunda'; // 'chill' | 'patrol' | 'gunda' | 'approach_car' | 'entering_car' | 'driving_car' | 'exiting_car'
  let stateTimer = 0;
  let actionClip = null;
  let actionTimer = 0;
  let gundaPhase = 0;
  let targetSpot = new THREE.Vector3(pos.x, AI_EYE_HEIGHT, pos.z);
  let activeCar = null;
  let roadCurIdx = -1;
  let roadPrevIdx = -1;
  let hitCooldown = 0;
  let hornCooldown = 0;
  let stuckTimer = 0;
  let reverseTimer = 0;
  let statusText = 'Roaming Khulna streets';
  const tempSteerInput = { throttle: 0, brake: 0, steerInput: 0, handbrake: false };

  function setActor(nextActor, nextProfile) {
    if (activeCar && activeCar.state.aiDriving) {
      activeCar.exitAICar?.();
      activeCar.setDriverDoorOpen?.(0);
    }
    activeCar = null;
    actor = nextActor;
    profile = nextProfile || profile;
    if (actor) {
      actor.state.cameraMode = 'back';
      actor.state.thirdPerson = true;
      actor.state.straightGaze = true;
    }
  }

  function releaseCarCleanly() {
    if (activeCar) {
      if (activeCar.state.aiDriving) {
        activeCar.exitAICar?.();
      }
      activeCar.setDriverDoorOpen?.(0);
      activeCar = null;
    }
  }

  function pickWalkTargetNear(originX, originZ, minR = 5, maxR = 19, envRef = null) {
    for (let tries = 0; tries < 14; tries++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = minR + Math.random() * (maxR - minR);
      const tx = originX + Math.sin(ang) * dist;
      const tz = originZ + Math.cos(ang) * dist;
      if (!isBlockedForPedestrian(tx, tz, envRef)) {
        targetSpot.set(tx, AI_EYE_HEIGHT, tz);
        return;
      }
    }
    const rn = roadGraph.findNearestNode(originX, originZ, 180);
    if (rn >= 0) {
      targetSpot.set(roadGraph.nodes[rn].x, AI_EYE_HEIGHT, roadGraph.nodes[rn].z);
    }
  }

  function pickAvailableCar(cars, playerPos) {
    if (!cars || !cars.length) return null;
    const candidates = [];
    for (const c of cars) {
      if (!c || !c.state || !c.state.loaded) continue;
      if (c.state.isRickshaw || c.state.isBike) continue;
      if (c.state.driving || c.state.aiDriving) continue;
      const distPlayer = Math.hypot(c.state.pos.x - playerPos.x, c.state.pos.z - playerPos.z);
      const distSelf = Math.hypot(c.state.pos.x - pos.x, c.state.pos.z - pos.z);
      // Avoid snatching a car the player is practically touching unless far enough
      if (distPlayer < 3.6) continue;
      if (distSelf < 140) {
        candidates.push({ car: c, distSelf });
      }
    }
    if (!candidates.length) return null;
    candidates.sort((a, b) => a.distSelf - b.distSelf);
    const pickIdx = Math.min(candidates.length - 1, Math.floor(Math.random() * Math.min(2, candidates.length)));
    return candidates[pickIdx].car;
  }

  function chooseNextBehavior(playerPos, cars, envRef) {
    releaseCarCleanly();
    actionClip = null;
    actionTimer = 0;

    const r = Math.random();
    const carCandidate = pickAvailableCar(cars, playerPos);
    if (carCandidate && r < 0.44) {
      activeCar = carCandidate;
      mode = 'approach_car';
      stateTimer = 16.0;
      statusText = `Heading to ${carCandidate.state.name}`;
      return;
    }

    if (r < 0.74) {
      // Street Boss "gunda" mode!
      mode = 'gunda';
      gundaPhase = 0;
      stateTimer = 9.0 + Math.random() * 6.0;
      const distP = Math.hypot(playerPos.x - pos.x, playerPos.z - pos.z);
      if (distP > 14 && distP < 48 && Math.random() < 0.6) {
        const ang = Math.atan2(pos.x - playerPos.x, pos.z - playerPos.z);
        targetSpot.set(playerPos.x + Math.sin(ang) * 4.2, AI_EYE_HEIGHT, playerPos.z + Math.cos(ang) * 4.2);
      } else {
        pickWalkTargetNear(pos.x, pos.z, 4, 14, envRef);
      }
      statusText = 'Causing street trouble';
      return;
    }

    if (r < 0.90) {
      mode = 'patrol';
      stateTimer = 6.0 + Math.random() * 5.0;
      const anchorX = Math.hypot(playerPos.x - pos.x, playerPos.z - pos.z) < 55 ? playerPos.x : pos.x;
      const anchorZ = Math.hypot(playerPos.x - pos.x, playerPos.z - pos.z) < 55 ? playerPos.z : pos.z;
      pickWalkTargetNear(anchorX, anchorZ, 5, 16, envRef);
      statusText = 'Patrolling the neighborhood';
      return;
    }

    mode = 'chill';
    stateTimer = 6.0 + Math.random() * 5.0;
    const chillClips = ['PhoneCall', 'MobileGame', 'WarmUp', 'Dance1', 'Dribble', 'Pocket', 'StandingRelax', 'Laugh'];
    actionClip = chillClips[Math.floor(Math.random() * chillClips.length)];
    actionTimer = stateTimer;
    statusText = actionClip === 'PhoneCall'
      ? 'On a phone call'
      : actionClip === 'MobileGame'
        ? 'Playing mobile game'
        : 'Chilling on the street';
  }

  function relocateNearPlayer(playerPos, cars, envRef, preferCar = false) {
    releaseCarCleanly();
    // Place on nearest open road or courtyard ~10-16m from player
    const rn = roadGraph.findNearestNode(playerPos.x, playerPos.z, 180);
    let sx = playerPos.x - 5.5;
    let sz = playerPos.z + 9.0;
    if (rn >= 0) {
      const n = roadGraph.nodes[rn];
      const dx = n.x - playerPos.x;
      const dz = n.z - playerPos.z;
      const d = Math.hypot(dx, dz);
      if (d > 7 && d < 32 && !isBlockedForPedestrian(n.x, n.z, envRef)) {
        sx = n.x;
        sz = n.z;
      }
    }
    if (isBlockedForPedestrian(sx, sz, envRef)) {
      sx = TALTOLA_HOUSE_OFFSET.x - 2.4;
      sz = TALTOLA_HOUSE_OFFSET.z + 8.5;
    }
    pos.set(sx, AI_EYE_HEIGHT, sz);
    yaw = Math.atan2(playerPos.x - sx, playerPos.z - sz);
    speed = 0;

    if (preferCar) {
      const carCandidate = pickAvailableCar(cars, playerPos);
      if (carCandidate && Math.hypot(carCandidate.state.pos.x - pos.x, carCandidate.state.pos.z - pos.z) < 75 && Math.random() < 0.72) {
        activeCar = carCandidate;
        mode = 'approach_car';
        stateTimer = 16.0;
        statusText = `Heading to ${carCandidate.state.name}`;
      } else {
        mode = 'gunda';
        stateTimer = 5.5;
        gundaPhase = 1;
        actionClip = 'Angry1';
        actionTimer = 2.4;
        statusText = 'Causing street trouble';
      }
    } else {
      mode = 'gunda';
      stateTimer = 8.0;
      gundaPhase = 1;
      actionClip = 'Angry1';
      actionTimer = 2.4;
      statusText = 'Causing street trouble';
    }
  }

  function onPlayerEnterCar(car) {
    if (!car) return;
    if (activeCar === car) {
      const st = car.state;
      const rx = Math.cos(st.heading);
      const rz = -Math.sin(st.heading);
      pos.set(st.pos.x - rx * 1.9, AI_EYE_HEIGHT, st.pos.z - rz * 1.9);
      releaseCarCleanly();
      mode = 'gunda';
      stateTimer = 5.5;
      gundaPhase = 1;
      actionClip = 'Angry2';
      actionTimer = 2.2;
      statusText = 'Stepped out & arguing!';
    }
  }

  function steerPedestrianToward(tx, tz, moveSpeed, dt, envRef, playerPos, cars) {
    const dx = tx - pos.x;
    const dz = tz - pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.75) {
      speed = 0;
      return true;
    }
    const dirX = dx / dist;
    const dirZ = dz / dist;
    const targetYaw = Math.atan2(dirX, dirZ);
    yaw += wrapAngleDelta(targetYaw - yaw) * Math.min(1, dt * 8.0);

    let nx = pos.x + dirX * moveSpeed * dt;
    let nz = pos.z + dirZ * moveSpeed * dt;

    // Gentle separation from player & parked cars
    const pdx = nx - playerPos.x;
    const pdz = nz - playerPos.z;
    const pDist = Math.hypot(pdx, pdz);
    if (pDist > 0.01 && pDist < 1.15) {
      nx += (pdx / pDist) * (1.15 - pDist);
      nz += (pdz / pDist) * (1.15 - pDist);
    }
    for (const c of cars) {
      if (!c?.state || c === activeCar) continue;
      const cdx = nx - c.state.pos.x;
      const cdz = nz - c.state.pos.z;
      const minR = (c.state.halfWidth || 0.95) + 0.55;
      const cd = Math.hypot(cdx, cdz);
      if (cd > 0.01 && cd < minR) {
        nx += (cdx / cd) * (minR - cd);
        nz += (cdz / cd) * (minR - cd);
      }
    }

    if (isBlockedForPedestrian(nx, nz, envRef)) {
      speed = 0;
      return true;
    }
    pos.x = nx;
    pos.z = nz;
    speed = moveSpeed;
    return false;
  }

  function update(delta, ctx) {
    if (!actor || !actor.state.loaded) return;
    const { playerPos, playerCharacter, cars, environment, inStudio, quality } = ctx;
    if (inStudio) return;

    const dt = Math.min(delta, 0.09);
    const timerDt = Math.min(delta, 0.25);
    hitCooldown = Math.max(0, hitCooldown - timerDt);
    hornCooldown = Math.max(0, hornCooldown - timerDt);
    stateTimer -= timerDt;

    // If player walked very far (>220m) and AI isn't driving, keep partner roaming in the active district!
    const distToPlayer = Math.hypot(playerPos.x - pos.x, playerPos.z - pos.z);
    if (distToPlayer > 240 && mode !== 'driving_car') {
      relocateNearPlayer(playerPos, cars, environment, true);
    }

    // Playful reaction if player throws a punch/kick right next to the AI partner!
    if (
      mode !== 'driving_car'
      && hitCooldown <= 0
      && playerCharacter?.state?.attackTimer > 0.15
      && distToPlayer < 2.35
    ) {
      hitCooldown = 1.6;
      mode = 'gunda';
      stateTimer = 6.5;
      gundaPhase = 1;
      actionClip = 'HitBody';
      actionTimer = 0.95;
      yaw = Math.atan2(playerPos.x - pos.x, playerPos.z - pos.z);
      statusText = 'Fighting back in action mode!';
    }

    // State machine
    if (mode === 'approach_car') {
      if (!activeCar || activeCar.state.driving || activeCar.state.aiDriving || stateTimer <= 0) {
        chooseNextBehavior(playerPos, cars, environment);
      } else {
        const st = activeCar.state;
        const rx = Math.cos(st.heading);
        const rz = -Math.sin(st.heading);
        const doorX = st.pos.x + rx * ((st.halfWidth || 0.95) + 0.55);
        const doorZ = st.pos.z + rz * ((st.halfWidth || 0.95) + 0.55);
        const arrived = steerPedestrianToward(doorX, doorZ, 3.6, dt, environment, playerPos, cars);
        if (arrived || Math.hypot(doorX - pos.x, doorZ - pos.z) < 1.05) {
          mode = 'entering_car';
          stateTimer = 0.85;
          speed = 0;
          activeCar.setDriverDoorOpen?.(1.0);
          yaw = st.heading;
          actionClip = 'Sit';
          actionTimer = 0.85;
          statusText = `Getting into ${st.name}`;
        }
      }
    } else if (mode === 'entering_car') {
      if (!activeCar || activeCar.state.driving) {
        chooseNextBehavior(playerPos, cars, environment);
      } else if (stateTimer <= 0) {
        activeCar.setDriverDoorOpen?.(0);
        if (activeCar.enterAICar?.()) {
          mode = 'driving_car';
          stateTimer = 18.0 + Math.random() * 10.0;
          roadCurIdx = roadGraph.findNearestNode(activeCar.state.pos.x, activeCar.state.pos.z, 220);
          roadPrevIdx = -1;
          stuckTimer = 0;
          reverseTimer = 0;
          actionClip = null;
          statusText = `Cruising Khulna in ${activeCar.state.name}`;
        } else {
          chooseNextBehavior(playerPos, cars, environment);
        }
      }
    } else if (mode === 'driving_car') {
      if (!activeCar || activeCar.state.driving || !activeCar.state.aiDriving) {
        chooseNextBehavior(playerPos, cars, environment);
      } else {
        const st = activeCar.state;
        pos.set(st.pos.x, st.pos.y + AI_EYE_HEIGHT, st.pos.z);
        yaw = st.heading;

        if (roadCurIdx < 0 || !roadGraph.nodes[roadCurIdx]) {
          roadCurIdx = roadGraph.findNearestNode(st.pos.x, st.pos.z, 260);
        }

        if (stateTimer <= 0 && Math.abs(st.speed) < 3.5) {
          // Stop & park smoothly on the street, then hop out!
          const rx = Math.cos(st.heading);
          const rz = -Math.sin(st.heading);
          activeCar.exitAICar?.();
          activeCar.setDriverDoorOpen?.(1.0);
          pos.set(st.pos.x + rx * 1.55, AI_EYE_HEIGHT, st.pos.z + rz * 1.55);
          mode = 'exiting_car';
          stateTimer = 0.75;
          actionClip = 'Idle';
          actionTimer = 0.75;
          statusText = `Stepping out of ${st.name}`;
        } else if (stateTimer <= 0) {
          // Brake cleanly before exiting
          tempSteerInput.throttle = 0;
          tempSteerInput.brake = 1;
          tempSteerInput.steerInput = 0;
          tempSteerInput.handbrake = true;
          activeCar.setAIControl?.(tempSteerInput);
        } else if (roadCurIdx >= 0) {
          const wp = roadGraph.nodes[roadCurIdx];
          const dx = wp.x - st.pos.x;
          const dz = wp.z - st.pos.z;
          const dWp = Math.hypot(dx, dz);
          if (dWp < 10.5) {
            const nxt = roadGraph.pickNextNode(roadCurIdx, roadPrevIdx, st.heading);
            if (nxt >= 0) {
              roadPrevIdx = roadCurIdx;
              roadCurIdx = nxt;
            }
          }
          const tgt = roadGraph.nodes[roadCurIdx] || wp;
          const angToTgt = Math.atan2(tgt.x - st.pos.x, tgt.z - st.pos.z);
          const diff = wrapAngleDelta(angToTgt - st.heading);
          const steerCmd = THREE.MathUtils.clamp(diff * 1.65, -1, 1);

          // Slow for sharp corners or if player / parked car sits right in front
          const fwdX = Math.sin(st.heading);
          const fwdZ = Math.cos(st.heading);
          const toPlayerX = playerPos.x - st.pos.x;
          const toPlayerZ = playerPos.z - st.pos.z;
          const aheadDist = toPlayerX * fwdX + toPlayerZ * fwdZ;
          const sideDist = Math.abs(toPlayerX * fwdZ - toPlayerZ * fwdX);
          const playerInFront = aheadDist > 0 && aheadDist < 9.5 && sideDist < 3.2;

          if (playerInFront && hornCooldown <= 0 && distToPlayer < 16) {
            hornCooldown = 5.5;
            activeCar.playHorn?.();
          }

          const targetCruise = playerInFront ? 0.0 : (Math.abs(diff) > 0.65 ? 5.5 : 12.2);
          if (!playerInFront && Math.abs(st.speed) < 0.35 && targetCruise > 2.0) {
            stuckTimer += dt;
            if (stuckTimer > 2.1 && reverseTimer <= 0) {
              reverseTimer = 1.25;
              stuckTimer = 0;
            }
          } else {
            stuckTimer = Math.max(0, stuckTimer - dt * 0.5);
          }

          if (reverseTimer > 0) {
            reverseTimer -= dt;
            tempSteerInput.throttle = 0;
            tempSteerInput.brake = 0.85;
            tempSteerInput.steerInput = -steerCmd || 0.7;
            tempSteerInput.handbrake = false;
            activeCar.setAIControl?.(tempSteerInput);
          } else {
            if (st.speed < targetCruise - 0.8) {
              tempSteerInput.throttle = 0.72;
              tempSteerInput.brake = 0;
            } else if (st.speed > targetCruise + 1.4 || playerInFront) {
              tempSteerInput.throttle = 0;
              tempSteerInput.brake = playerInFront ? 0.9 : 0.45;
            } else {
              tempSteerInput.throttle = 0.25;
              tempSteerInput.brake = 0;
            }
            tempSteerInput.steerInput = steerCmd;
            tempSteerInput.handbrake = false;
            activeCar.setAIControl?.(tempSteerInput);
          }
        }
      }
    } else if (mode === 'exiting_car') {
      if (stateTimer <= 0) {
        releaseCarCleanly();
        chooseNextBehavior(playerPos, cars, environment);
      }
    } else if (mode === 'gunda') {
      if (gundaPhase === 0) {
        const arrived = steerPedestrianToward(targetSpot.x, targetSpot.z, 2.35, dt, environment, playerPos, cars);
        if (arrived || stateTimer <= 3.5) {
          gundaPhase = 1;
          speed = 0;
          yaw = distToPlayer < 16 ? Math.atan2(playerPos.x - pos.x, playerPos.z - pos.z) : yaw;
          const gundaSequence = ['Angry1', 'Combo', 'Kick', 'Flex', 'Angry2', 'Kick2', 'PunchL', 'Laugh'];
          actionClip = gundaSequence[Math.floor(Math.random() * gundaSequence.length)];
          actionTimer = 2.0 + Math.random() * 1.4;
        }
      } else {
        speed = 0;
        actionTimer -= timerDt;
        if (actionTimer <= 0) {
          if (stateTimer <= 0) {
            chooseNextBehavior(playerPos, cars, environment);
          } else {
            const gundaSequence = ['Combo', 'Kick', 'PunchR', 'Angry1', 'Flex', 'Kick2', 'Laugh', 'Angry2'];
            actionClip = gundaSequence[Math.floor(Math.random() * gundaSequence.length)];
            actionTimer = 1.8 + Math.random() * 1.4;
            if (distToPlayer < 14) {
              yaw += wrapAngleDelta(Math.atan2(playerPos.x - pos.x, playerPos.z - pos.z) - yaw) * 0.65;
            }
          }
        }
      }
    } else if (mode === 'patrol') {
      const arrived = steerPedestrianToward(targetSpot.x, targetSpot.z, 1.85, dt, environment, playerPos, cars);
      if (arrived || stateTimer <= 0) {
        chooseNextBehavior(playerPos, cars, environment);
      }
    } else {
      // 'chill'
      speed = 0;
      actionTimer -= timerDt;
      if (distToPlayer < 4.5 && Math.random() < 0.04) {
        yaw += wrapAngleDelta(Math.atan2(playerPos.x - pos.x, playerPos.z - pos.z) - yaw) * Math.min(1, dt * 6);
        if (actionClip !== 'Greet' && actionClip !== 'Wave') {
          actionClip = 'Greet';
          actionTimer = 2.2;
        }
      }
      if (stateTimer <= 0 || actionTimer <= 0) {
        chooseNextBehavior(playerPos, cars, environment);
      }
    }

    // Distance LOD check: keep full bone update when within 115m or inside a car, lightweight position tracking otherwise
    if (mode === 'driving_car' && activeCar) {
      actor.update(dt, {
        position: pos,
        yaw: activeCar.state.heading + Math.PI,
        speed: Math.abs(activeCar.state.speed),
        maxSpeed: 28.0,
        grounded: true,
        isSprinting: false,
        inStudio: false,
        hideMesh: false,
        carDrive: {
          active: true,
          heading: activeCar.state.heading,
          steerAngle: activeCar.state.steerAngle,
          speed: activeCar.state.speed,
          anchors: activeCar.getCarDriverAnchors?.(),
        },
      });
    } else if (distToPlayer < 115 || quality !== 'low') {
      const dirX = speed > 0.05 ? Math.sin(yaw) : 0;
      const dirZ = speed > 0.05 ? Math.cos(yaw) : 0;
      actor.state.facingYaw = yaw;
      actor.update(dt, {
        position: pos,
        yaw: yaw + Math.PI,
        speed,
        maxSpeed: 4.0,
        grounded: true,
        isSprinting: speed > 2.8,
        moveDirX: dirX,
        moveDirZ: dirZ,
        inStudio: false,
        hideMesh: false,
        customClip: actionClip && speed < 0.1
          ? { name: actionClip, loopOnce: ['Kick', 'Kick2', 'PunchL', 'PunchR', 'HitBody'].includes(actionClip), timeScale: 1.0 }
          : null,
      });
    } else {
      actor.root.position.set(pos.x, pos.y - AI_EYE_HEIGHT, pos.z);
      actor.root.rotation.y = yaw;
    }
  }

  function getHUDStatus() {
    if (!actor || !actor.state.loaded) return null;
    return {
      visible: true,
      name: profile?.shortName || 'Partner',
      statusText,
      x: pos.x,
      z: pos.z,
      yaw,
      inCar: mode === 'driving_car' && activeCar ? activeCar.state.name : null,
    };
  }

  return {
    setActor,
    relocateNearPlayer,
    onPlayerEnterCar,
    update,
    getHUDStatus,
    get position() { return pos; },
    get mode() { return mode; },
    get activeCar() { return activeCar; },
  };
}
