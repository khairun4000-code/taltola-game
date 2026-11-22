import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * KHULNA CHIEF JUDICIAL MAGISTRATE COURT & DISTRICT JUDGE COURT COMPLEX
 * (খুলনা চীফ জুডিসিয়াল ম্যাজিস্ট্রেট আদালত ও জেলা জজ কোর্ট কমপ্লেক্স — GTA-READY ENTERABLE 3D GLB MODULE)
 *
 * Replaces the legacy procedural blockout opposite Khulna Circuit House on Circuit House Rd (K.D. Ghos Rd)
 * with the full-fidelity, Street-View-accurate, 100% enterable 10-Story CJM Court & Historic Red-Brick
 * Clock Tower Judge Court 3D GLB asset (`./assets/khulna_judge_court.glb`):
 *  - Exact Street-View Monumental Main Gate:
 *      * Towering concrete Ogee-Arch Mughal Jali Gate Pylons + Creamy-White Globe Lamps
 *      * Polished Black-Granite Nameplate Pylons ("জেলা ও দায়রা জজ আদালত, খুলনা" & "চীফ জুডিসিয়াল ম্যাজিস্ট্রেট আদালত, খুলনা")
 *      * Workable Animated Silver-Grey Steel Double Vehicle Gates & Pedestrian Gates ([E] or auto-proximity)
 *      * Khulna Red-White-Charcoal Striped Zigzag Footpath & Yellow-Black Curbstones
 *      * Courtyard Golden Scales of Justice Monument & Water Reflection Fountain + Bangladesh National Flag
 *  - 10-Story Chief Judicial Magistrate Court (ALL 10 FLOORS ENTERABLE!):
 *      * Bold 3D Brushed Stainless-Steel Bangla Portico Signage ("চীফ জুডিসিয়াল ম্যাজিস্ট্রেট আদালত, খুলনা")
 *      * Warm Dusty Terracotta Facing Bricks (with 3D sculpted lower courses & Floor 5/10 arches) + Cool Grey Concrete
 *      * Ground Floor Grand Marble Lobby, Reception Desk, 10-Floor Directory, 1 No. Main Courtroom (এজলাস), Judge's Chamber & Law Library
 *      * Workable 10-Floor Luxury Elevator (`Workable_Lift_Cabin` + animated cabin & landing doors on Floors 1..10 + Rooftop!)
 *      * Modern 10-Floor Open-Well Marble Staircase with Brushed Stainless-Steel & Glass Handrails
 *  - North Historic Red-Brick Clock Tower Judge Court Wing:
 *      * 5 Central Semicircular Arches, 3D Sculpted Weathered Red Bricks, Bold 3D Steel Frieze Sign, 4-Sided Clock Tower & Enterable Arched Corridor
 */

export const JUDGE_COURT_ANCHOR = {
  x: 171.2,
  z: -676.0,
  scale: 0.88,
  rotY: -Math.PI * 0.5, // Local +Z (Front Gate & Facade) faces WEST (-X) directly onto Circuit House Rd!
};

export const JUDGE_COURT_SPAWN = {
  x: 144.5,
  z: -676.0,
  lookX: 188.0,
  lookZ: -676.0,
};

const { x: ANCHOR_X, z: ANCHOR_Z, scale: SCALE, rotY: ROT_Y } = JUDGE_COURT_ANCHOR;
const COS_R = Math.cos(ROT_Y); // 0
const SIN_R = Math.sin(ROT_Y); // -1

function localToWorld(lx, ly, lz, out = new THREE.Vector3()) {
  out.set(
    ANCHOR_X + SCALE * (lx * COS_R + lz * SIN_R),
    ly * SCALE,
    ANCHOR_Z + SCALE * (-lx * SIN_R + lz * COS_R)
  );
  return out;
}

function worldToLocalXZ(wx, wz) {
  const dx = (wx - ANCHOR_X) / SCALE;
  const dz = (wz - ANCHOR_Z) / SCALE;
  return {
    lx: dx * COS_R - dz * SIN_R,
    lz: dx * SIN_R + dz * COS_R,
  };
}

// Local floor elevations matching geometry.mjs (Ground = 0.45m, Floors 2..10 = 4.45 + (f-2)*3.35m, Roof = 34.80m)
const LOCAL_FLOOR_YS = [
  0.45, 4.45, 7.80, 11.15, 14.50, 17.85, 21.20, 24.55, 27.90, 31.25, 34.80,
];

const LIFT_STOPS = [
  { code: 'GF', label: 'Ground Lobby & 1 No. এজলাস', localY: LOCAL_FLOOR_YS[0], y: LOCAL_FLOOR_YS[0] * SCALE },
  { code: '2F', label: '2F নেজারত ও রেকর্ড রুম', localY: LOCAL_FLOOR_YS[1], y: LOCAL_FLOOR_YS[1] * SCALE },
  { code: '3F', label: '3F সিজেএম আদালত (CJM)', localY: LOCAL_FLOOR_YS[2], y: LOCAL_FLOOR_YS[2] * SCALE },
  { code: '4F', label: '4F অতিরিক্ত সিজেএম আদালত', localY: LOCAL_FLOOR_YS[3], y: LOCAL_FLOOR_YS[3] * SCALE },
  { code: '5F', label: '5F সিনিয়র জুডিসিয়াল ম্যাজিস্ট্রেট', localY: LOCAL_FLOOR_YS[4], y: LOCAL_FLOOR_YS[4] * SCALE },
  { code: '6F', label: '6F জুডিসিয়াল ম্যাজিস্ট্রেট আদালত', localY: LOCAL_FLOOR_YS[5], y: LOCAL_FLOOR_YS[5] * SCALE },
  { code: '7F', label: '7F জুডিসিয়াল ম্যাজিস্ট্রেট আদালত', localY: LOCAL_FLOOR_YS[6], y: LOCAL_FLOOR_YS[6] * SCALE },
  { code: '8F', label: '8F জুডিসিয়াল ম্যাজিস্ট্রেট আদালত', localY: LOCAL_FLOOR_YS[7], y: LOCAL_FLOOR_YS[7] * SCALE },
  { code: '9F', label: '9F বিচারিক সম্মেলন কক্ষ', localY: LOCAL_FLOOR_YS[8], y: LOCAL_FLOOR_YS[8] * SCALE },
  { code: '10F', label: '10F আইন গ্রন্থাগার ও এজলাস', localY: LOCAL_FLOOR_YS[9], y: LOCAL_FLOOR_YS[9] * SCALE },
  { code: 'RF', label: 'Rooftop Observatory (ছাদ)', localY: LOCAL_FLOOR_YS[10], y: LOCAL_FLOOR_YS[10] * SCALE },
];

// Local Lift #1 Cabin center (-1.65, y, -6.48) and Lobby exit (-1.65, y, -3.95)
const LIFT_CENTER_WORLD = localToWorld(-1.65, 0, -6.48);
const LIFT_EXIT_WORLD = localToWorld(-1.65, 0, -3.95);
const GATE_WORLD = localToWorld(0, 1.5, 22.0);

function resolveCircleAABBLocal(pt, r, minX, maxX, minZ, maxZ) {
  const cx = THREE.MathUtils.clamp(pt.lx, minX, maxX);
  const cz = THREE.MathUtils.clamp(pt.lz, minZ, maxZ);
  const dx = pt.lx - cx;
  const dz = pt.lz - cz;
  const dSq = dx * dx + dz * dz;
  if (dSq < r * r) {
    if (dSq < 1e-8) {
      const dL = Math.abs(pt.lx - minX);
      const dR = Math.abs(maxX - pt.lx);
      const dN = Math.abs(pt.lz - minZ);
      const dS = Math.abs(maxZ - pt.lz);
      const m = Math.min(dL, dR, dN, dS);
      if (m === dL) pt.lx = minX - r;
      else if (m === dR) pt.lx = maxX + r;
      else if (m === dN) pt.lz = minZ - r;
      else pt.lz = maxZ + r;
    } else {
      const d = Math.sqrt(dSq);
      pt.lx += (dx / d) * (r - d);
      pt.lz += (dz / d) * (r - d);
    }
    return true;
  }
  return false;
}

export function buildKhulnaJudgeCourt(parent, m) {
  const root = new THREE.Group();
  root.name = 'KhulnaJudgeCourt_RealGLB_District';
  parent.add(root);

  const compound = new THREE.Group();
  compound.name = 'KhulnaJudgeCourt_CompoundRoot';
  compound.position.set(ANCHOR_X, 0.012, ANCHOR_Z);
  compound.rotation.y = ROT_Y;
  compound.scale.setScalar(SCALE);
  root.add(compound);

  // Flush concrete threshold apron bridging East asphalt edge of Circuit House Rd smoothly into Main Gate!
  const apronMat = new THREE.MeshStandardMaterial({
    color: 0x8b867d,
    map: m?.concrete?.map || null,
    roughness: 0.9,
    metalness: 0.0,
  });
  const apron = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.03, 2.2), apronMat);
  apron.name = 'JudgeCourt_RoadToGateApron';
  apron.position.set(0, 0.015, 25.4);
  apron.receiveShadow = true;
  compound.add(apron);

  const state = {
    loaded: false,
    mainGateOpen: true, // Starts open & welcoming; toggles cleanly with [E] or proximity sensor!
    gateProgress: 1.0,
    manualHoldUntil: 0,
    gateL: null,
    gateR: null,
    pedL: null,
    pedR: null,

    // Working 10-Floor Judicial Elevator state (100% compatible with main.js Lift Keypad!)
    liftCabin: null,
    cabDoorL: null,
    cabDoorR: null,
    landingDoors: {}, // 1..10 -> { L, R }
    liftY: LIFT_STOPS[0].y,
    liftLocalY: LIFT_STOPS[0].localY,
    liftFloorIndex: 0,
    liftTargetIndex: 0,
    liftDirection: 0,
    liftPhase: 'idle', // 'idle' | 'closing' | 'moving' | 'opening'
    liftDoorOpen: 1.0,

    nightFactor: 0,
    lastTime: 0,
    lightsEnabled: false,
    nightLights: [],
    interiorLights: [],
    cabinLight: null,
    activeFloorLight: null,
  };

  // Architectural Night & Warm Judicial Interior Point Lights (local compound space!)
  const lightsGroup = new THREE.Group();
  lightsGroup.name = 'KhulnaJudgeCourt_Lights';
  compound.add(lightsGroup);

  function addNightPoint(lx, ly, lz, color, intensity, distance) {
    const l = new THREE.PointLight(color, 0, distance * SCALE, 1.65);
    l.position.set(lx, ly, lz);
    l.userData.nightIntensity = intensity;
    lightsGroup.add(l);
    state.nightLights.push(l);
    return l;
  }

  function addInteriorPoint(lx, ly, lz, color, dayInt, nightInt, distance) {
    const l = new THREE.PointLight(color, dayInt, distance * SCALE, 1.55);
    l.position.set(lx, ly, lz);
    l.userData.dayIntensity = dayInt;
    l.userData.nightIntensity = nightInt;
    lightsGroup.add(l);
    state.interiorLights.push(l);
    return l;
  }

  // Exterior Night Illumination (Gate Globe Lamps, Black-Granite Signs, Portico Steel Sign, Flag, Clock Tower)
  addNightPoint(-4.5, 5.5, 22.0, 0xffe0a8, 24, 18);
  addNightPoint(4.5, 5.5, 22.0, 0xffe0a8, 24, 18);
  addNightPoint(-8.6, 3.6, 23.8, 0xfff0d0, 16, 12);
  addNightPoint(8.6, 3.6, 23.8, 0xfff0d0, 16, 12);
  addNightPoint(0, 3.8, 10.2, 0xffecc4, 34, 22);
  addNightPoint(0, 5.8, 14.5, 0xffffff, 22, 16);
  addNightPoint(15.5, 4.6, 14.5, 0xffe59e, 18, 16); // Golden Scales Monument
  addNightPoint(-40.5, 11.4, 6.0, 0xffe2a2, 26, 22); // North Historic Clock Tower

  // Always-Warm Interior Illumination (Ground Lobby, 1 No. Courtroom, Judge Chamber, Historic Corridor, Lift & Active Upper Floor)
  addInteriorPoint(0.0, 3.7, 0.5, 0xfff3dc, 14, 28, 18);
  addInteriorPoint(16.0, 3.7, -3.2, 0xfff4df, 18, 32, 22);
  addInteriorPoint(-18.2, 3.7, -3.2, 0xfff1d6, 12, 24, 16);
  addInteriorPoint(-40.5, 4.5, 2.2, 0xffdfb0, 14, 26, 18);
  state.cabinLight = addInteriorPoint(-1.65, 2.45, -6.48, 0xfff6e4, 10, 18, 9);
  state.activeFloorLight = addInteriorPoint(15.5, 7.2, -3.2, 0xfff4df, 16, 28, 22);

  // Sittable Judicial Seats (converted to World Space for main.js findNearestSeat!)
  const seats = [];
  function registerLocalSeat(lx, lz, localSeatY, localFloorY, localYaw, label) {
    const wp = localToWorld(lx, localFloorY, lz);
    seats.push({
      seatX: wp.x,
      seatZ: wp.z,
      seatY: localSeatY * SCALE,
      fy: localFloorY * SCALE,
      yaw: localYaw + ROT_Y,
      label,
    });
  }
  // Ground Floor 1 No. Courtroom: Judge's Chair + Public Gallery Benches + Lobby Waiting Benches + Chamber Chair
  registerLocalSeat(21.65, -3.2, 0.98, 0.45, -Math.PI * 0.5, 'Judge Chair (বিচারকের আসন)');
  registerLocalSeat(11.4, -7.4, 0.48, 0.45, Math.PI * 0.5, 'Courtroom Gallery Bench');
  registerLocalSeat(11.4, -2.8, 0.48, 0.45, Math.PI * 0.5, 'Courtroom Gallery Bench');
  registerLocalSeat(10.1, -7.4, 0.48, 0.45, Math.PI * 0.5, 'Courtroom Gallery Bench');
  registerLocalSeat(10.1, -2.8, 0.48, 0.45, Math.PI * 0.5, 'Courtroom Gallery Bench');
  registerLocalSeat(-5.8, -2.5, 0.46, 0.45, Math.PI * 0.5, 'Court Lobby Waiting Bench');
  registerLocalSeat(5.8, -2.5, 0.46, 0.45, -Math.PI * 0.5, 'Court Lobby Waiting Bench');
  registerLocalSeat(-20.5, -3.2, 0.48, 0.45, Math.PI * 0.5, 'Judge Chamber Chair (খাস কামরা)');
  // Upper Floors (2F..10F) Judge Chairs!
  for (let fl = 1; fl <= 9; fl++) {
    registerLocalSeat(21.6, -3.5, 0.90, LOCAL_FLOOR_YS[fl], -Math.PI * 0.5, `${fl + 1}F Judge Chair (বিচারকের আসন)`);
  }

  // Load our GTA-Ready Enterable Khulna Judge Court & CJM Court GLB!
  const loader = new GLTFLoader();
  loader.load(
    './assets/khulna_judge_court.glb',
    (gltf) => {
      const model = gltf.scene;
      model.name = 'KhulnaJudgeCourt_GLB_Scene';

      model.traverse((obj) => {
        if (obj.name === 'Main_Gate_Leaf_Left') state.gateL = obj;
        else if (obj.name === 'Main_Gate_Leaf_Right') state.gateR = obj;
        else if (obj.name === 'Pedestrian_Gate_Left') state.pedL = obj;
        else if (obj.name === 'Pedestrian_Gate_Right') state.pedR = obj;
        else if (obj.name === 'Workable_Lift_Cabin') state.liftCabin = obj;
        else if (obj.name === 'Lift_Cabin_Door_L') state.cabDoorL = obj;
        else if (obj.name === 'Lift_Cabin_Door_R') state.cabDoorR = obj;
        else if (obj.name && obj.name.startsWith('Lift_Floor_')) {
          const match = obj.name.match(/^Lift_Floor_(\d+)_Door_(L|R)$/);
          if (match) {
            const fl = Number(match[1]);
            state.landingDoors[fl] = state.landingDoors[fl] || {};
            state.landingDoors[fl][match[2]] = obj;
          }
        }

        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const mat of mats) {
            if (!mat) continue;
            if (mat.map) mat.map.anisotropy = 8;
            if (mat.normalMap) mat.normalMap.anisotropy = 8;
            if (mat.roughnessMap) mat.roughnessMap.anisotropy = 8;
            mat.envMapIntensity = 0.78;
          }
        }
      });

      compound.add(model);
      state.loaded = true;
    },
    undefined,
    (err) => {
      console.error('[KhulnaJudgeCourt] Failed to load ./assets/khulna_judge_court.glb:', err);
    }
  );

  /* --------------------------------------------------------------------------
   * ELEVATOR & FOOTPRINT HELPERS
   * ------------------------------------------------------------------------ */
  function isInTowerFootprint(pos, pad = 2.0) {
    if (!pos) return false;
    const { lx, lz } = worldToLocalXZ(pos.x, pos.z);
    const p = pad / SCALE;
    return lx >= -24.5 - p && lx <= 24.5 + p && lz >= -12.5 - p && lz <= 13.0 + p;
  }

  function isInsideLift(pos) {
    if (!pos) return false;
    const { lx, lz } = worldToLocalXZ(pos.x, pos.z);
    return lx >= -2.75 && lx <= -0.55 && lz >= -7.55 && lz <= -5.30;
  }

  function isNearLiftLobby(pos) {
    if (!pos) return false;
    const { lx, lz } = worldToLocalXZ(pos.x, pos.z);
    return Math.hypot(lx - (-1.65), lz - (-4.2)) < 2.9;
  }

  function isLiftOpenAtY(footY) {
    return state.liftPhase !== 'moving' && state.liftDoorOpen > 0.60 && Math.abs(footY - state.liftY) < 1.35;
  }

  function nearestFloorIndex(footY) {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < LIFT_STOPS.length; i++) {
      const d = Math.abs(footY - LIFT_STOPS[i].y);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  function goToFloor(idx) {
    const clamped = THREE.MathUtils.clamp(Math.round(idx), 0, LIFT_STOPS.length - 1);
    state.liftTargetIndex = clamped;
    if (Math.abs(state.liftY - LIFT_STOPS[clamped].y) < 0.05) {
      state.liftFloorIndex = clamped;
      state.liftPhase = 'opening';
      state.liftDirection = 0;
    } else {
      state.liftDirection = LIFT_STOPS[clamped].y > state.liftY ? 1 : -1;
      state.liftPhase = 'closing';
    }
    if (state.activeFloorLight) {
      state.activeFloorLight.position.y = LIFT_STOPS[clamped].localY + 2.4;
    }
  }

  function openDoors() {
    if (state.liftPhase !== 'moving') state.liftPhase = 'opening';
  }

  function closeDoors() {
    if (state.liftPhase !== 'moving') state.liftPhase = 'closing';
  }

  function toggleGate(pos) {
    if (!pos) return false;
    if (Math.hypot(pos.x - GATE_WORLD.x, pos.z - GATE_WORLD.z) < 11.5) {
      state.mainGateOpen = !state.mainGateOpen;
      state.manualHoldUntil = state.lastTime + 10.0;
      return true;
    }
    return false;
  }

  /* --------------------------------------------------------------------------
   * MULTI-FLOOR WALKABLE GROUND HEIGHTS (ALL 10 FLOORS + STAIRS + LIFT + HISTORIC COURT!)
   * ------------------------------------------------------------------------ */
  function getGroundHeight(pos, grounded = true, verticalVelocity = 0) {
    if (!pos) return 0;
    const { lx, lz } = worldToLocalXZ(pos.x, pos.z);
    if (lx < -56.5 || lx > 46.5 || lz < -21.5 || lz > 26.5) return 0;

    const footLocalY = (pos.y - 1.68) / SCALE;
    const maxStepUp = (grounded ? 0.68 : (verticalVelocity > 0 ? 0.10 : 0.45)) / SCALE;
    let bestLY = 0.04;
    const tryLY = (ly) => {
      if (ly <= footLocalY + maxStepUp && ly > bestLY) bestLY = ly;
    };

    // Inside Workable 10-Floor Elevator Cabin
    if (isInsideLift(pos) && Math.abs(footLocalY - state.liftLocalY) < 2.6) {
      return state.liftY;
    }

    // Raised Striped Footpath outside gate
    if (lz >= 22.3 && lz <= 24.9 && Math.abs(lx) > 4.6) {
      tryLY(0.16);
    }

    // Front Portico Granite Steps rising smoothly to Ground Floor (local Z: 8.2 -> 5.8, X: -5.8..+5.8)
    if (lx >= -5.8 && lx <= 5.8 && lz >= 5.7 && lz <= 8.4) {
      const t = THREE.MathUtils.clamp((8.3 - lz) / 2.3, 0, 1);
      tryLY(0.04 + t * 0.41);
    }

    // Inside 10-Story Chief Judicial Magistrate Court Building (local X: -24..+24, Z: -12..+7.2)
    if (lx >= -24.0 && lx <= 24.0 && lz >= -12.0 && lz <= 7.2) {
      tryLY(LOCAL_FLOOR_YS[0]); // Ground Floor Marble Lobby, Courtroom & Chamber!

      // Elevated Judge's Dais inside 1 No. Main Courtroom (Ground Floor East Wing)
      if (footLocalY < 2.5 && lx >= 18.4 && lx <= 23.2 && lz >= -6.5 && lz <= 0.1) {
        if (lx >= 19.6) tryLY(0.45 + 0.56);
        else {
          const t = THREE.MathUtils.clamp((lx - 18.4) / 1.2, 0, 1);
          tryLY(0.45 + t * 0.56);
        }
      }

      // MODERN 10-FLOOR OPEN-WELL MARBLE STAIRCASE (local X: -12.5..-8.5, Z: -11.0..-3.8)
      const inStairs = lx >= -12.5 && lx <= -8.5 && lz >= -11.0 && lz <= -3.8;
      if (inStairs) {
        for (let fl = 0; fl < 9; fl++) {
          const yBot = LOCAL_FLOOR_YS[fl];
          const yTop = LOCAL_FLOOR_YS[fl + 1];
          const yMid = (yBot + yTop) * 0.5;
          if (lz <= -7.26) {
            tryLY(yMid); // Mid-landing
          } else if (lx <= -10.55) {
            // Flight 1 (West side, climbs toward -Z from -4.0 -> -7.26)
            const t = THREE.MathUtils.clamp((-4.0 - lz) / 3.26, 0, 1);
            tryLY(yBot + t * (yMid - yBot));
          } else {
            // Flight 2 (East side, climbs back toward +Z from -7.26 -> -4.0)
            const t = THREE.MathUtils.clamp((lz - (-7.26)) / 3.26, 0, 1);
            tryLY(yMid + t * (yTop - yMid));
          }
        }
      }

      // Upper Floor Slabs (Floors 2..10 + Rooftop Observatory, excluding stairwell & lift shaft cutouts!)
      const inCutout = (lx >= -12.4 && lx <= -8.6 && lz >= -11.2 && lz <= -4.0)
        || (lx >= -3.1 && lx <= 3.1 && lz >= -7.7 && lz <= -5.2);
      if (!inCutout) {
        for (let fl = 1; fl <= 10; fl++) {
          tryLY(LOCAL_FLOOR_YS[fl]);
        }
      }
    }

    // North Historic Red-Brick Clock Tower Judge Court (local X: -54..-27, Z: -12..+5.6)
    if (lx >= -54.2 && lx <= -26.8 && lz >= -12.2 && lz <= 6.2) {
      if (lz >= 4.7 && Math.abs(lx - (-40.5)) <= 5.0) {
        const t = THREE.MathUtils.clamp((6.1 - lz) / 1.4, 0, 1);
        tryLY(0.04 + t * 0.38);
      } else if (lz <= 4.9) {
        tryLY(0.45);
      }
    }

    return bestLY * SCALE;
  }

  /* --------------------------------------------------------------------------
   * PEDESTRIAN & VEHICLE COLLISIONS (ALL ENTRANCES, COURTYARD, ROOMS & LIFT ENTERABLE!)
   * ------------------------------------------------------------------------ */
  function applyCollisions(pos, radius = 0.34, footY = 0, isVehicle = false) {
    if (!pos) return;
    const pt = worldToLocalXZ(pos.x, pos.z);
    if (pt.lx < -57 || pt.lx > 47 || pt.lz < -22 || pt.lz > 26.5) return;

    const r = radius / SCALE;
    const footLY = footY / SCALE;
    let moved = false;
    const block = (x0, x1, z0, z1) => {
      if (resolveCircleAABBLocal(pt, r, x0, x1, z0, z1)) moved = true;
    };

    // 1) Perimeter Boundary Wall & Workable Main Gate (ground level)
    if (footLY < 3.4) {
      // Front fence along Circuit House Rd (leaving wide vehicle gate gap local X: -3.7..+3.7!)
      block(-55.2, -3.85, 21.6, 22.4);
      block(3.85, 44.8, 21.6, 22.4);
      if (!state.mainGateOpen) {
        block(-3.85, 3.85, 21.65, 22.15);
      }
      // Side compound walls
      block(-55.4, -54.6, -20.2, 22.2);
      block(44.1, 44.9, -20.2, 22.2);
      // Courtyard Judicial Scales Water Monument circular curb (local X = 15.5, Z = 14.5, radius 3.45m)
      {
        const dx = pt.lx - 15.5;
        const dz = pt.lz - 14.5;
        const dist = Math.hypot(dx, dz);
        const minDist = 3.55 + r;
        if (dist < minDist) {
          const inv = dist > 1e-4 ? 1 / dist : 1;
          pt.lx = 15.5 + (dist > 1e-4 ? dx * inv : 1) * minDist;
          pt.lz = 14.5 + (dist > 1e-4 ? dz * inv : 0) * minDist;
          moved = true;
        }
      }
      // Security Sentry Post (local X: -11.6..-9.2, Z: 18.1..20.3)
      block(-11.6, -9.2, 18.0, 20.4);
    }

    // 2) Vehicles can drive cleanly through the Main Gate right up to the Portico & North Plaza,
    //    while staying outside building footprints!
    if (isVehicle) {
      block(-24.2, 24.2, -12.2, 6.2);     // 10-Story CJM Court footprint (portico drive-through at Z: 6.2..12.8 stays DRIVABLE!)
      block(-54.3, -26.7, -12.2, 5.2);    // North Historic Red-Brick Clock Tower Court
      for (const px of [-6.7, -3.1, 3.1, 6.7]) block(px - 0.5, px + 0.5, 11.6, 12.7); // Portico pillars
      if (moved) {
        const w = localToWorld(pt.lx, 0, pt.lz);
        pos.x = w.x; pos.z = w.z;
      }
      return;
    }

    // 3) Pedestrian Walkable 10-Story CJM Court Collisions (Doors OPEN & Enterable!)
    if (footLY < LOCAL_FLOOR_YS[10] - 0.8) {
      // Outer Rear, Left, Right Walls of 10-Story CJM Court
      block(-24.1, 24.1, -12.1, -11.55);
      block(-24.1, -23.55, -12.0, 6.0);
      block(23.55, 24.1, -12.0, 6.0);

      // Front Wall (Ground Floor OPEN at X = -2.2..+2.2!)
      if (footLY < 3.8) {
        block(-24.0, -2.25, 5.55, 6.05);
        block(2.25, 24.0, 5.55, 6.05);
        // Lobby-to-Courtroom East partition (open wide double doorway at Z = -0.2..+2.6!)
        block(8.3, 8.7, 2.65, 5.8);
        block(8.3, 8.7, -11.8, -0.25);
        // Reception Desk inside Lobby
        block(-6.65, -5.7, 0.15, 3.45);
      } else {
        // Upper floors front glazing wall & lobby-to-courtroom partition (open doorway Z = -0.2..+2.6!)
        block(-24.0, 24.0, 4.3, 4.65);
        block(8.3, 8.7, 2.55, 4.5);
        block(8.3, 8.7, -11.8, -0.35);
      }

      // Workable Lift Shaft Walls (Rear, Left, Right + Front Door Guard when lift isn't open at this floor!)
      block(-3.35, 3.35, -7.95, -7.60);
      block(-3.4, -3.05, -7.8, -5.1);
      block(3.05, 3.4, -7.8, -5.1);
      block(-0.18, 0.18, -7.8, -5.1);
      // Companion Lift #2 closed doors
      block(0.15, 3.2, -5.35, -5.05);
      // Workable Lift #1 front door guard when moving or closed!
      if (!isLiftOpenAtY(footY)) {
        block(-3.1, -0.15, -5.35, -5.05);
      }
    } else {
      // Rooftop Observatory Safe Parapet Guardrail!
      if (footLY - LOCAL_FLOOR_YS[10] < 0.85) {
        block(-24.1, 24.1, -12.0, -11.5);
        block(-24.1, 24.1, 5.5, 6.0);
        block(-24.1, -23.5, -12.0, 6.0);
        block(23.5, 24.1, -12.0, 6.0);
      }
    }

    // 4) North Historic Red-Brick Clock Tower Judge Court Collisions (Front Arches & Central Chamber Door OPEN!)
    if (footLY < 5.5 && pt.lx < -25.0) {
      block(-54.2, -26.8, -12.1, -11.5); // Rear brick wall
      block(-54.2, -53.6, -12.0, 4.5);   // North brick end wall
      block(-27.4, -26.8, -12.0, 4.5);   // South brick end wall
      // Inner corridor wall with wide 3.8m central open doorway at X = -42.4..-38.6!
      block(-53.8, -42.4, -0.15, 0.35);
      block(-38.6, -27.2, -0.15, 0.35);
    }

    if (moved) {
      const w = localToWorld(pt.lx, 0, pt.lz);
      pos.x = w.x;
      pos.z = w.z;
    }
  }

  /* --------------------------------------------------------------------------
   * INTERACTION PROMPTS, LIFT KEYPAD, GATE & ZONES
   * ------------------------------------------------------------------------ */
  function getPrompt(pos) {
    if (!pos) return null;
    const footY = pos.y - 1.68;
    if (isInsideLift(pos) || (isNearLiftLobby(pos) && isInTowerFootprint(pos, 2.0))) {
      return '[E / L] Khulna CJM Court 10-Floor Lift (GF–10F · Rooftop)';
    }
    if (footY < 3.4 && Math.hypot(pos.x - GATE_WORLD.x, pos.z - GATE_WORLD.z) < 8.5) {
      return state.mainGateOpen
        ? '[E] Close Judge Court Main Gate (জজ কোর্ট মেইন গেট বন্ধ করুন)'
        : '[E] Open Judge Court Main Gate (জজ কোর্ট মেইন গেট খুলুন)';
    }
    return null;
  }

  function interact(pos) {
    if (!pos) return false;
    const footY = pos.y - 1.68;
    if (isInsideLift(pos) || (isNearLiftLobby(pos) && isInTowerFootprint(pos, 2.0))) {
      openDoors();
      return 'open_lift_keypad';
    }
    if (footY < 3.4 && Math.hypot(pos.x - GATE_WORLD.x, pos.z - GATE_WORLD.z) < 9.5) {
      toggleGate(pos);
      return {
        handled: true,
        message: state.mainGateOpen
          ? 'খুলনা জজ কোর্ট মেইন গেট খোলা হয়েছে'
          : 'খুলনা জজ কোর্ট মেইন গেট বন্ধ করা হয়েছে',
      };
    }
    return false;
  }

  function findNearestSeat(pos) {
    if (!pos) return null;
    if (!isInTowerFootprint(pos, 4.0)) return null;
    const footY = pos.y - 1.68;
    let best = null;
    let bestDist = 1.65;
    for (const s of seats) {
      if (Math.abs(footY - s.fy) > 1.2) continue;
      const d = Math.hypot(pos.x - s.seatX, pos.z - s.seatZ);
      if (d < bestDist) {
        bestDist = d;
        best = { ...s, dist: d };
      }
    }
    return best;
  }

  function isInsideBuilding(pos) {
    if (!pos) return false;
    const { lx, lz } = worldToLocalXZ(pos.x, pos.z);
    const footLY = (pos.y - 1.68) / SCALE;
    const inCJM = lx >= -24.0 && lx <= 24.0 && lz >= -12.0 && lz <= 6.0 && footLY < LOCAL_FLOOR_YS[10] - 0.6;
    const inHist = lx >= -54.0 && lx <= -27.0 && lz >= -12.0 && lz <= 4.8 && footLY < 5.5;
    return inCJM || inHist;
  }

  function getZoneName(wx, wz, footY = 0) {
    const { lx, lz } = worldToLocalXZ(wx, wz);
    if (lx < -56 || lx > 46 || lz < -21 || lz > 25.5) return null;
    const footLY = footY / SCALE;

    if (lx <= -26.5 && lz <= 6.0) {
      return 'KHULNA HISTORIC JUDGE COURT · RED-BRICK CLOCK TOWER & ARCHED CORRIDOR';
    }
    if (lx >= -24.2 && lx <= 24.2 && lz >= -12.2 && lz <= 7.0) {
      if (footLY >= LOCAL_FLOOR_YS[10] - 1.0) return 'KHULNA CJM COURT · 10TH FLOOR ROOFTOP OBSERVATORY';
      const flIdx = nearestFloorIndex(footY);
      if (flIdx === 0) {
        if (lx >= 8.5) return 'KHULNA CJM COURT (GF) · ১ নং এজলাস (MAIN COURTROOM)';
        if (lx <= -12.5) return 'KHULNA CJM COURT (GF) · JUDGE CHAMBER & LAW LIBRARY';
        return 'KHULNA CJM COURT (GF) · GRAND MARBLE LOBBY & LIFTS';
      }
      if (lx >= 8.5) return `KHULNA CJM COURT (${flIdx + 1}F) · JUDICIAL MAGISTRATE COURTROOM`;
      return `KHULNA CJM COURT (${flIdx + 1}F) · LIFT LOBBY & MODERN STAIRCASE`;
    }
    if (lz >= 18.0) {
      return 'KHULNA JUDGE COURT & CJM COURT · MAIN GATE (K.D. GHOS RD)';
    }
    return 'KHULNA CJM & DISTRICT JUDGE COURT · COURTYARD PLAZA';
  }

  function syncVisibility(playerPos) {
    if (!playerPos) return;
    const dSq = (playerPos.x - ANCHOR_X) ** 2 + (playerPos.z - ANCHOR_Z) ** 2;
    const wantVis = dSq <= 780 * 780;
    if (root.visible !== wantVis) root.visible = wantVis;

    const nearLights = dSq <= 125 * 125;
    if (state.lightsEnabled !== nearLights) {
      state.lightsEnabled = nearLights;
      lightsGroup.visible = nearLights;
    }
  }

  function setNightFactor(nf = 0) {
    state.nightFactor = THREE.MathUtils.clamp(nf, 0, 1);
    for (const l of state.nightLights) {
      l.intensity = l.userData.nightIntensity * state.nightFactor;
    }
    for (const l of state.interiorLights) {
      l.intensity = THREE.MathUtils.lerp(l.userData.dayIntensity, l.userData.nightIntensity, state.nightFactor);
    }
  }

  function update(time, playerPos = null) {
    const dt = state.lastTime > 0 ? THREE.MathUtils.clamp(time - state.lastTime, 0.001, 0.05) : 0.016;
    state.lastTime = time;

    if (playerPos) {
      syncVisibility(playerPos);
      // Automatic Proximity Sensor for Workable Main Gate (opens smoothly when player/car approaches!)
      if (time >= state.manualHoldUntil) {
        const distToGate = Math.hypot(playerPos.x - GATE_WORLD.x, playerPos.z - GATE_WORLD.z);
        if (!state.mainGateOpen && distToGate <= 8.5) {
          state.mainGateOpen = true;
        }
      }
    }
    if (!root.visible) return;

    // 1) Animate Workable Main & Pedestrian Steel Gates
    const targetGate = state.mainGateOpen ? 1.0 : 0.0;
    state.gateProgress += (targetGate - state.gateProgress) * Math.min(1, dt * 4.0);
    if (state.gateL) state.gateL.rotation.y = state.gateProgress * 1.32;
    if (state.gateR) state.gateR.rotation.y = -state.gateProgress * 1.32;
    if (state.pedL) state.pedL.rotation.y = state.gateProgress * 0.90;
    if (state.pedR) state.pedR.rotation.y = -state.gateProgress * 0.90;

    // 2) Animate Workable 10-Floor Elevator Cabin + Cabin & Landing Doors!
    if (state.liftPhase === 'closing') {
      state.liftDoorOpen = Math.max(0, state.liftDoorOpen - dt * 1.6);
      if (state.liftDoorOpen <= 0.01) {
        state.liftDoorOpen = 0;
        const tgtLY = LIFT_STOPS[state.liftTargetIndex].localY;
        state.liftPhase = Math.abs(tgtLY - state.liftLocalY) > 0.05 ? 'moving' : 'idle';
      }
    } else if (state.liftPhase === 'moving') {
      const tgtLY = LIFT_STOPS[state.liftTargetIndex].localY;
      const diff = tgtLY - state.liftLocalY;
      const speed = 5.4;
      if (Math.abs(diff) <= speed * dt) {
        state.liftLocalY = tgtLY;
        state.liftY = tgtLY * SCALE;
        state.liftFloorIndex = state.liftTargetIndex;
        state.liftDirection = 0;
        state.liftPhase = 'opening';
      } else {
        state.liftLocalY += Math.sign(diff) * speed * dt;
        state.liftY = state.liftLocalY * SCALE;
        state.liftFloorIndex = nearestFloorIndex(state.liftY);
      }
    } else if (state.liftPhase === 'opening') {
      state.liftDoorOpen = Math.min(1, state.liftDoorOpen + dt * 1.6);
      if (state.liftDoorOpen >= 0.99) {
        state.liftDoorOpen = 1;
        state.liftPhase = 'idle';
      }
    }

    if (state.liftCabin) {
      state.liftCabin.position.y = Math.min(state.liftLocalY, LOCAL_FLOOR_YS[9]);
    }
    if (state.cabinLight) {
      state.cabinLight.position.y = Math.min(state.liftLocalY, LOCAL_FLOOR_YS[9]) + 2.0;
    }

    const slide = state.liftDoorOpen * 0.68;
    if (state.cabDoorL) state.cabDoorL.position.x = -0.38 - slide;
    if (state.cabDoorR) state.cabDoorR.position.x = 0.38 + slide;

    const activeFloorNum = state.liftFloorIndex + 1; // 1..10
    for (let fl = 1; fl <= 10; fl++) {
      const pair = state.landingDoors[fl];
      if (!pair) continue;
      const s = (fl === activeFloorNum && state.liftPhase !== 'moving') ? slide : 0;
      if (pair.L) pair.L.position.x = -2.03 - s;
      if (pair.R) pair.R.position.x = -1.27 + s;
    }
  }

  return {
    group: root,
    eyebrowTitle: 'KHULNA CJM & DISTRICT JUDGE COURT',
    stops: LIFT_STOPS,
    state,
    liftCabinCenter: { x: LIFT_CENTER_WORLD.x, z: LIFT_CENTER_WORLD.z },
    liftExitPos: { x: LIFT_EXIT_WORLD.x, z: LIFT_EXIT_WORLD.z },
    isInTowerFootprint,
    isInsideLift,
    isNearLiftLobby,
    isLiftOpenAtY,
    nearestFloorIndex,
    goToFloor,
    openDoors,
    closeDoors,
    toggleGate,
    getGroundHeight,
    applyCollisions,
    getPrompt,
    interact,
    findNearestSeat,
    isInsideBuilding,
    getZoneName,
    setNightFactor,
    update,
    syncVisibility,
  };
}
