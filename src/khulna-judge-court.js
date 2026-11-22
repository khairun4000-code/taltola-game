import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeStaticMeshes } from './scene-utils.js';

/**
 * KHULNA CHIEF JUDICIAL MAGISTRATE COURT & DISTRICT JUDGE COURT COMPLEX
 * (খুলনা চীফ জুডিসিয়াল ম্যাজিস্ট্রেট আদালত ও জেলা জজ কোর্ট কমপ্লেক্স — GTA-READY ENTERABLE 3D GLB MODULE)
 *
 * Ultra-optimized, bloom-calibrated, 100% enterable 10-Story CJM Court & Historic Red-Brick
 * Clock Tower Judge Court 3D GLB asset (`./assets/khulna_judge_court.glb`):
 *  - Zero heavy PointLights + bloom-safe emissive & envMap calibration (crisp in Ultra Sunset/Evening [N]!)
 *  - Batched static geometry via mergeStaticMeshes() + lazy loading + large-mesh shadow culling (locked 60–120 FPS!)
 *  - Exact visual-matched walkable floor heights across courtyard, footpath, portico steps, Ground Lobby,
 *    1 No. Main Courtroom, Judge Chamber, 10-Floor Modern Staircase, Workable 10-Floor Lift & North Clock Tower Court
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
const COMPOUND_Y = 0.012;
const COS_R = Math.cos(ROT_Y); // 0
const SIN_R = Math.sin(ROT_Y); // -1

const QUALITY_VIS_DIST = {
  low: 220,
  medium: 330,
  high: 460,
  ultra: 600,
};

function localToWorld(lx, ly, lz, out = new THREE.Vector3()) {
  out.set(
    ANCHOR_X + SCALE * (lx * COS_R + lz * SIN_R),
    COMPOUND_Y + ly * SCALE,
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

// Exact visual top-of-slab elevations in local coordinates (matching src/geometry.mjs!)
// Ground Marble Floor box top = 0.45 + 0.08 = 0.53m; Upper floors = 4.45 + (fl-1)*3.35m; Roof top = 34.95m
const LOCAL_FLOOR_YS = [
  0.53, 4.45, 7.80, 11.15, 14.50, 17.85, 21.20, 24.55, 27.90, 31.25, 34.95,
];
// Local cabin floor offsets (cabin base sits at localY - 0.08 so cabin floor top matches slab top!)
const LOCAL_CABIN_YS = [
  0.45, 4.37, 7.72, 11.07, 14.42, 17.77, 21.12, 24.47, 27.82, 31.17, 31.17,
];

const LIFT_STOPS = [
  { code: 'GF', label: 'Ground Lobby & 1 No. এজলাস', localY: LOCAL_FLOOR_YS[0], cabinLocalY: LOCAL_CABIN_YS[0], y: COMPOUND_Y + LOCAL_FLOOR_YS[0] * SCALE },
  { code: '2F', label: '2F নেজারত ও রেকর্ড রুম', localY: LOCAL_FLOOR_YS[1], cabinLocalY: LOCAL_CABIN_YS[1], y: COMPOUND_Y + LOCAL_FLOOR_YS[1] * SCALE },
  { code: '3F', label: '3F সিজেএম আদালত (CJM)', localY: LOCAL_FLOOR_YS[2], cabinLocalY: LOCAL_CABIN_YS[2], y: COMPOUND_Y + LOCAL_FLOOR_YS[2] * SCALE },
  { code: '4F', label: '4F অতিরিক্ত সিজেএম আদালত', localY: LOCAL_FLOOR_YS[3], cabinLocalY: LOCAL_CABIN_YS[3], y: COMPOUND_Y + LOCAL_FLOOR_YS[3] * SCALE },
  { code: '5F', label: '5F সিনিয়র জুডিসিয়াল ম্যাজিস্ট্রেট', localY: LOCAL_FLOOR_YS[4], cabinLocalY: LOCAL_CABIN_YS[4], y: COMPOUND_Y + LOCAL_FLOOR_YS[4] * SCALE },
  { code: '6F', label: '6F জুডিসিয়াল ম্যাজিস্ট্রেট আদালত', localY: LOCAL_FLOOR_YS[5], cabinLocalY: LOCAL_CABIN_YS[5], y: COMPOUND_Y + LOCAL_FLOOR_YS[5] * SCALE },
  { code: '7F', label: '7F জুডিসিয়াল ম্যাজিস্ট্রেট আদালত', localY: LOCAL_FLOOR_YS[6], cabinLocalY: LOCAL_CABIN_YS[6], y: COMPOUND_Y + LOCAL_FLOOR_YS[6] * SCALE },
  { code: '8F', label: '8F জুডিসিয়াল ম্যাজিস্ট্রেট আদালত', localY: LOCAL_FLOOR_YS[7], cabinLocalY: LOCAL_CABIN_YS[7], y: COMPOUND_Y + LOCAL_FLOOR_YS[7] * SCALE },
  { code: '9F', label: '9F বিচারিক সম্মেলন কক্ষ', localY: LOCAL_FLOOR_YS[8], cabinLocalY: LOCAL_CABIN_YS[8], y: COMPOUND_Y + LOCAL_FLOOR_YS[8] * SCALE },
  { code: '10F', label: '10F আইন গ্রন্থাগার ও এজলাস', localY: LOCAL_FLOOR_YS[9], cabinLocalY: LOCAL_CABIN_YS[9], y: COMPOUND_Y + LOCAL_FLOOR_YS[9] * SCALE },
  { code: 'RF', label: 'Rooftop Observatory (ছাদ)', localY: LOCAL_FLOOR_YS[10], cabinLocalY: LOCAL_CABIN_YS[10], y: COMPOUND_Y + LOCAL_FLOOR_YS[10] * SCALE },
];

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
  root.visible = false;
  parent.add(root);

  const compound = new THREE.Group();
  compound.name = 'KhulnaJudgeCourt_CompoundRoot';
  compound.position.set(ANCHOR_X, COMPOUND_Y, ANCHOR_Z);
  compound.rotation.y = ROT_Y;
  compound.scale.setScalar(SCALE);
  root.add(compound);

  // Flush concrete threshold apron bridging East asphalt edge of Circuit House Rd smoothly into Gate_Apron (zero Z-fighting!)
  const apronMat = new THREE.MeshStandardMaterial({
    color: 0x7d7a72,
    map: m?.concrete?.map || null,
    roughness: 0.92,
    metalness: 0.0,
    envMapIntensity: 0.25,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const apron = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.025, 1.75), apronMat);
  apron.name = 'JudgeCourt_RoadToGateApron';
  apron.position.set(0, 0.0125, 25.92);
  apron.receiveShadow = true;
  apron.matrixAutoUpdate = false;
  apron.updateMatrix();
  compound.add(apron);
  compound.matrixAutoUpdate = false;
  compound.updateMatrix();

  const state = {
    loaded: false,
    loading: false,
    mainGateOpen: true,
    gateProgress: 1.0,
    manualHoldUntil: 0,
    gateL: null,
    gateR: null,
    pedL: null,
    pedR: null,

    // Working 10-Floor Judicial Elevator state
    liftCabin: null,
    cabDoorL: null,
    cabDoorR: null,
    landingDoors: {}, // 1..10 -> { L, R }
    liftY: LIFT_STOPS[0].y,
    liftLocalY: LIFT_STOPS[0].localY,
    liftFloorIndex: 0,
    liftTargetIndex: 0,
    liftDirection: 0,
    liftPhase: 'idle',
    liftDoorOpen: 1.0,

    // Bloom-calibrated emissive materials (ZERO global PointLights -> zero Ultra Sunset bloom blow-out & high FPS!)
    emissiveMats: [],
    allMats: [],
    allMeshes: [],
    lastDoorSlide: -1,
    lastActiveFloor: -1,
    nightFactor: 0,
    lastTime: 0,
    qualityMode: 'medium',
    visDistSq: QUALITY_VIS_DIST.medium * QUALITY_VIS_DIST.medium,
  };

  function applyQualityToLoadedAssets() {
    const q = state.qualityMode;
    const isLow = q === 'low';
    const isMed = q === 'medium';
    const aniso = isLow ? 1 : (isMed ? 2 : 4);
    for (let i = 0; i < state.allMats.length; i++) {
      const mat = state.allMats[i];
      const wantNorm = isLow ? null : (mat.userData._origNormalMap || null);
      const wantRough = (isLow || isMed) ? null : (mat.userData._origRoughnessMap || null);
      let dirty = false;
      if (mat.normalMap !== wantNorm) { mat.normalMap = wantNorm; dirty = true; }
      if (mat.roughnessMap !== wantRough) { mat.roughnessMap = wantRough; dirty = true; }
      mat.envMapIntensity = isLow ? 0.0 : (mat.userData._origEnvInt ?? 0.30);
      if (mat.map && mat.map.anisotropy !== aniso) { mat.map.anisotropy = aniso; mat.map.needsUpdate = true; }
      if (mat.normalMap && mat.normalMap.anisotropy !== aniso) { mat.normalMap.anisotropy = aniso; mat.normalMap.needsUpdate = true; }
      if (dirty) mat.needsUpdate = true;
    }
    for (let i = 0; i < state.allMeshes.length; i++) {
      const mesh = state.allMeshes[i];
      mesh.castShadow = !isLow && Boolean(mesh.userData._canCastShadow);
      mesh.receiveShadow = !isLow;
    }
  }

  function applyEmissiveNightFactor() {
    const nf = state.nightFactor;
    // Smooth evening-to-night curve: warm gentle glow in Sunset dusk, rich crisp glow at Night (zero blow-out!)
    const nightGlow = Math.pow(nf, 1.45);
    for (let i = 0; i < state.emissiveMats.length; i++) {
      const e = state.emissiveMats[i];
      e.mat.emissiveIntensity = e.day + (e.night - e.day) * nightGlow;
    }
  }

  // Sittable Judicial Seats (exact world elevations synced with top-of-floor!)
  const seats = [];
  function registerLocalSeat(lx, lz, localSeatOffsetY, localFloorY, localYaw, label) {
    const wp = localToWorld(lx, localFloorY, lz);
    seats.push({
      seatX: wp.x,
      seatZ: wp.z,
      seatY: localSeatOffsetY * SCALE,
      fy: COMPOUND_Y + localFloorY * SCALE,
      yaw: localYaw + ROT_Y,
      label,
    });
  }
  registerLocalSeat(21.65, -3.2, 0.90, LOCAL_FLOOR_YS[0], -Math.PI * 0.5, 'Judge Chair (বিচারকের আসন)');
  registerLocalSeat(11.4, -7.4, 0.44, LOCAL_FLOOR_YS[0], Math.PI * 0.5, 'Courtroom Gallery Bench');
  registerLocalSeat(11.4, -2.8, 0.44, LOCAL_FLOOR_YS[0], Math.PI * 0.5, 'Courtroom Gallery Bench');
  registerLocalSeat(10.1, -7.4, 0.44, LOCAL_FLOOR_YS[0], Math.PI * 0.5, 'Courtroom Gallery Bench');
  registerLocalSeat(10.1, -2.8, 0.44, LOCAL_FLOOR_YS[0], Math.PI * 0.5, 'Courtroom Gallery Bench');
  registerLocalSeat(-5.8, -2.5, 0.44, LOCAL_FLOOR_YS[0], Math.PI * 0.5, 'Court Lobby Waiting Bench');
  registerLocalSeat(5.8, -2.5, 0.44, LOCAL_FLOOR_YS[0], -Math.PI * 0.5, 'Court Lobby Waiting Bench');
  registerLocalSeat(-20.5, -3.2, 0.44, LOCAL_FLOOR_YS[0], Math.PI * 0.5, 'Judge Chamber Chair (খাস কামরা)');
  for (let fl = 1; fl <= 9; fl++) {
    registerLocalSeat(21.6, -3.5, 0.86, LOCAL_FLOOR_YS[fl], -Math.PI * 0.5, `${fl + 1}F Judge Chair (বিচারকের আসন)`);
  }

  function ensureLoaded() {
    if (state.loaded || state.loading) return;
    state.loading = true;

    const loader = new GLTFLoader();
    loader.load(
      './assets/khulna_judge_court.glb',
      (gltf) => {
        const model = gltf.scene;
        model.name = 'KhulnaJudgeCourt_GLB_Scene';
        model.updateMatrixWorld(true);

        const dynamicRoot = new THREE.Group();
        dynamicRoot.name = 'KhulnaJudgeCourt_Dynamic';
        const dynamicToDetach = [];
        const seenMats = new Set();
        const tmpBox = new THREE.Box3();
        const tmpSize = new THREE.Vector3();

        model.traverse((obj) => {
          if (obj.name === 'Main_Gate_Leaf_Left') {
            state.gateL = obj;
            dynamicToDetach.push(obj);
          } else if (obj.name === 'Main_Gate_Leaf_Right') {
            state.gateR = obj;
            dynamicToDetach.push(obj);
          } else if (obj.name === 'Pedestrian_Gate_Left') {
            state.pedL = obj;
            dynamicToDetach.push(obj);
          } else if (obj.name === 'Pedestrian_Gate_Right') {
            state.pedR = obj;
            dynamicToDetach.push(obj);
          } else if (obj.name === 'Workable_Lift_Cabin') {
            state.liftCabin = obj;
            dynamicToDetach.push(obj);
          } else if (obj.name === 'Lift_Cabin_Door_L') {
            state.cabDoorL = obj;
          } else if (obj.name === 'Lift_Cabin_Door_R') {
            state.cabDoorR = obj;
          } else if (obj.name && obj.name.startsWith('Lift_Floor_')) {
            const match = obj.name.match(/^Lift_Floor_(\d+)_Door_(L|R)$/);
            if (match) {
              const fl = Number(match[1]);
              state.landingDoors[fl] = state.landingDoors[fl] || {};
              state.landingDoors[fl][match[2]] = obj;
              dynamicToDetach.push(obj);
            }
          }

          if (obj.isMesh) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const mat of mats) {
              if (!mat || seenMats.has(mat)) continue;
              seenMats.add(mat);

              const mName = mat.name || '';
              mat.userData._origNormalMap = mat.normalMap || null;
              mat.userData._origRoughnessMap = mat.roughnessMap || null;

              // BLOOM-SAFE ULTRA EVENING / NIGHT CALIBRATION:
              // Crisp in Daylight/Golden Hour, warm tasteful glow in Sunset dusk & Night!
              if (mName === 'Gate_Frosted_Globe_Lamp') {
                mat.color.setHex(0xe8e0cc);
                mat.roughness = 0.42;
                mat.envMapIntensity = 0.20;
                state.emissiveMats.push({ mat, day: 0.04, night: 0.78 });
              } else if (mName === 'Interior_LED_Panel') {
                mat.color.setHex(0xe6e3da);
                mat.roughness = 0.48;
                mat.envMapIntensity = 0.16;
                state.emissiveMats.push({ mat, day: 0.12, night: 0.66 });
              } else if (mName === 'Clock_Tower_Dial') {
                mat.envMapIntensity = 0.22;
                state.emissiveMats.push({ mat, day: 0.02, night: 0.56 });
              } else if (mName === 'Lift_LED_Display') {
                mat.envMapIntensity = 0.16;
                state.emissiveMats.push({ mat, day: 0.24, night: 0.54 });
              } else if (
                mName.includes('White_Concrete') ||
                mName.includes('Concrete_CJM') ||
                mName.includes('Marble') ||
                mName.includes('Plaster') ||
                mName.includes('Ceiling')
              ) {
                mat.color.multiplyScalar(0.84);
                mat.roughness = Math.max(mat.roughness || 0.75, 0.78);
                mat.envMapIntensity = 0.24;
              } else if (
                mName.includes('Steel') ||
                mName.includes('Brass') ||
                mName.includes('Fence') ||
                mName.includes('Sign_')
              ) {
                mat.envMapIntensity = 0.34;
                if (mName.includes('Sign_')) {
                  mat.color.multiplyScalar(0.88);
                }
              } else {
                mat.envMapIntensity = 0.36;
              }
              mat.userData._origEnvInt = mat.envMapIntensity;
              state.allMats.push(mat);
            }

            // Only major exterior architectural shells cast shadows (cuts Ultra 2048 shadow-pass tris dramatically with zero visual change!)
            const oName = obj.name || '';
            const skipShadow = /Interior|LED|Glass|Chair|Bench|Desk|Stair|Rail|Sign|Floor|Footpath|Apron|Driveway|Curb/i.test(oName);
            let largeEnough = false;
            if (!skipShadow && obj.geometry) {
              if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
              if (obj.geometry.boundingBox) {
                tmpBox.copy(obj.geometry.boundingBox).applyMatrix4(obj.matrixWorld);
                tmpBox.getSize(tmpSize);
                largeEnough = Math.max(tmpSize.x, tmpSize.y, tmpSize.z) >= 5.8;
              }
            }
            obj.castShadow = largeEnough;
            obj.receiveShadow = true;
          }
        });

        compound.add(model);
        compound.add(dynamicRoot);
        compound.updateMatrixWorld(true);

        // Detach animated gates, lift cabin & landing doors BEFORE merging ~1,000 static meshes into ~40 draw calls!
        for (const node of dynamicToDetach) {
          dynamicRoot.attach(node);
        }
        try {
          mergeStaticMeshes(model);
        } catch (mergeErr) {
          console.warn('[KhulnaJudgeCourt] Static batching fallback:', mergeErr);
        }
        model.traverse((obj) => {
          if (obj.isMesh) {
            obj.matrixAutoUpdate = false;
            obj.updateMatrix();
          }
        });

        compound.traverse((obj) => {
          if (obj.isMesh) {
            obj.userData._canCastShadow = obj.castShadow;
            state.allMeshes.push(obj);
          }
        });
        applyQualityToLoadedAssets();
        applyEmissiveNightFactor();
        state.loaded = true;
        state.loading = false;
      },
      undefined,
      (err) => {
        state.loading = false;
        console.error('[KhulnaJudgeCourt] Failed to load ./assets/khulna_judge_court.glb:', err);
      }
    );
  }

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
   * EXACT VISUAL-MATCHED MULTI-FLOOR WALKABLE GROUND HEIGHTS (ZERO ANKLE SINKING OR GLITCH!)
   * ------------------------------------------------------------------------ */
  function getGroundHeight(pos, grounded = true, verticalVelocity = 0) {
    if (!pos) return 0;
    const { lx, lz } = worldToLocalXZ(pos.x, pos.z);
    // Clean cutoff right at outer edge of road-to-gate apron (lz > 26.8 stays on flat asphalt road y = 0!)
    if (lx < -55.8 || lx > 45.2 || lz < -21.0 || lz > 26.8) return 0;
    if (lz > 25.05 && Math.abs(lx) > 5.1) return 0;

    const footLocalY = (pos.y - 1.68 - COMPOUND_Y) / SCALE;
    const maxStepUp = (grounded ? 0.65 : (verticalVelocity > 0 ? 0.08 : 0.42)) / SCALE;

    // Exact GLB-matched smooth entry ramp: asphalt (lz=26.8, 0m) -> Gate_Apron (lz=25.05..22.15, 0.065m) -> Main_Courtyard_Driveway (0.06m)
    let bestLY = 0.06;
    if (lz > 25.05) {
      bestLY = THREE.MathUtils.clamp((26.8 - lz) / 1.75, 0, 1) * 0.065;
    } else if (lz > 22.15 && Math.abs(lx) <= 4.75) {
      bestLY = 0.065;
    }
    const tryLY = (ly) => {
      if (ly <= footLocalY + maxStepUp && ly > bestLY) bestLY = ly;
    };

    // Inside Workable 10-Floor Elevator Cabin
    if (isInsideLift(pos) && Math.abs(footLocalY - state.liftLocalY) < 2.6) {
      return state.liftY;
    }

    // Raised Striped Footpath outside gate (exact GLB top 0.16m with smooth curb & gate-edge bevels!)
    if (lz >= 22.30 && lz <= 24.90 && Math.abs(lx) > 4.55) {
      const edgeT = THREE.MathUtils.clamp((Math.abs(lx) - 4.55) / 0.45, 0, 1);
      const outerCurbT = THREE.MathUtils.clamp((24.90 - lz) / 0.30, 0, 1);
      const innerCurbT = THREE.MathUtils.clamp((lz - 22.30) / 0.25, 0, 1);
      tryLY(0.06 + 0.10 * edgeT * Math.min(outerCurbT, innerCurbT));
    }

    // Front Portico Granite Steps rising smoothly to Ground Floor Marble Top (0.53m)
    if (lx >= -5.8 && lx <= 5.8 && lz >= 5.7 && lz <= 8.4) {
      const t = THREE.MathUtils.clamp((8.35 - lz) / 2.35, 0, 1);
      tryLY(0.06 + t * (LOCAL_FLOOR_YS[0] - 0.06));
    }

    // Inside 10-Story Chief Judicial Magistrate Court Building
    if (lx >= -24.0 && lx <= 24.0 && lz >= -12.0 && lz <= 6.2) {
      tryLY(LOCAL_FLOOR_YS[0]); // Exact marble floor top (0.53m -> 0.478m world!)

      // Elevated Judge's Dais inside 1 No. Main Courtroom (Ground Floor East Wing)
      if (footLocalY < 2.5 && lx >= 18.4 && lx <= 23.2 && lz >= -6.5 && lz <= 0.1) {
        if (lx >= 19.6) tryLY(LOCAL_FLOOR_YS[0] + 0.48);
        else {
          const t = THREE.MathUtils.clamp((lx - 18.4) / 1.2, 0, 1);
          tryLY(LOCAL_FLOOR_YS[0] + t * 0.48);
        }
      }

      // MODERN 10-FLOOR OPEN-WELL MARBLE STAIRCASE (smooth, non-oscillating ramp!)
      const inStairs = lx >= -12.45 && lx <= -8.55 && lz >= -10.8 && lz <= -3.85;
      if (inStairs) {
        for (let fl = 0; fl < 9; fl++) {
          const yBot = LOCAL_FLOOR_YS[fl];
          const yTop = LOCAL_FLOOR_YS[fl + 1];
          const yMid = (yBot + yTop) * 0.5;
          if (lz <= -7.26) {
            tryLY(yMid);
          } else if (lx <= -10.55) {
            const t = THREE.MathUtils.clamp((-4.15 - lz) / 3.11, 0, 1);
            tryLY(yBot + t * (yMid - yBot));
          } else {
            const t = THREE.MathUtils.clamp((lz - (-7.26)) / 3.11, 0, 1);
            tryLY(yMid + t * (yTop - yMid));
          }
        }
      }

      // Upper Floor Slabs (Floors 2..10 + Rooftop, excluding stairwell & lift shaft cutouts!)
      const inCutout = (lx >= -12.35 && lx <= -8.65 && lz >= -10.8 && lz <= -4.15)
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
        tryLY(0.06 + t * 0.42);
      } else if (lz <= 4.9) {
        tryLY(0.48);
      }
    }

    return COMPOUND_Y + bestLY * SCALE;
  }

  /* --------------------------------------------------------------------------
   * SNAG-FREE PEDESTRIAN & VEHICLE COLLISIONS
   * ------------------------------------------------------------------------ */
  function applyCollisions(pos, radius = 0.34, footY = 0, isVehicle = false) {
    if (!pos) return;
    const pt = worldToLocalXZ(pos.x, pos.z);
    if (pt.lx < -57 || pt.lx > 47 || pt.lz < -22 || pt.lz > 26.5) return;

    const r = radius / SCALE;
    const footLY = (footY - COMPOUND_Y) / SCALE;
    let moved = false;
    const block = (x0, x1, z0, z1) => {
      if (resolveCircleAABBLocal(pt, r, x0, x1, z0, z1)) moved = true;
    };

    // 1) Perimeter Boundary Wall & Workable Main + Pedestrian Gates (ground level)
    if (footLY < 3.4) {
      // Leave Main Gate (-3.85..+3.85) AND both Pedestrian Gates (-7.35..-5.75, +5.75..+7.35) cleanly walkable when open!
      block(-55.2, -7.35, 21.6, 22.35);
      block(-5.75, -3.85, 21.6, 22.35);
      block(3.85, 5.75, 21.6, 22.35);
      block(7.35, 44.8, 21.6, 22.35);
      if (!state.mainGateOpen) {
        block(-3.85, 3.85, 21.65, 22.15);
        block(-7.35, -5.75, 21.65, 22.15);
        block(5.75, 7.35, 21.65, 22.15);
      }
      block(-55.4, -54.6, -20.2, 22.2);
      block(44.1, 44.9, -20.2, 22.2);

      // Courtyard Judicial Scales Water Monument circular curb
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
      // Security Sentry Post
      block(-11.6, -9.2, 18.0, 20.4);
    }

    // 2) Vehicles drive cleanly into forecourt & under portico drop-off, staying outside interiors
    if (isVehicle) {
      block(-24.2, 24.2, -12.2, 6.2);
      block(-54.3, -26.7, -12.2, 5.2);
      for (const px of [-6.7, -3.1, 3.1, 6.7]) block(px - 0.5, px + 0.5, 11.6, 12.7);
      if (moved) {
        const w = localToWorld(pt.lx, 0, pt.lz);
        pos.x = w.x; pos.z = w.z;
      }
      return;
    }

    // 3) Pedestrian Walkable 10-Story CJM Court Collisions (generous doorway clearances!)
    if (footLY < LOCAL_FLOOR_YS[10] - 0.8) {
      // Portico support pillars at ground level
      if (footLY < 3.8) {
        for (const px of [-6.7, -3.1, 3.1, 6.7]) block(px - 0.42, px + 0.42, 11.73, 12.57);
      }

      // Outer Rear, Left, Right Walls
      block(-24.1, 24.1, -12.1, -11.55);
      block(-24.1, -23.55, -12.0, 6.0);
      block(23.55, 24.1, -12.0, 6.0);

      if (footLY < 3.8) {
        // Front Wall (Ground Floor wide open doorway at X = -2.2..+2.2)
        block(-24.0, -2.28, 5.58, 6.02);
        block(2.28, 24.0, 5.58, 6.02);
        // Lobby-to-Courtroom East partition (wide open doorway at Z = -0.25..+2.65)
        block(8.32, 8.68, 2.68, 5.8);
        block(8.32, 8.68, -11.8, -0.28);
        // Reception Desk
        block(-6.65, -5.7, 0.15, 3.45);
      } else {
        // Upper floors front glazing wall & lobby-to-courtroom partition
        block(-24.0, 24.0, 4.32, 4.64);
        block(8.32, 8.68, 2.60, 4.5);
        block(8.32, 8.68, -11.8, -0.35);
      }

      // Workable Lift Shaft Walls
      block(-3.35, 3.35, -7.95, -7.60);
      block(-3.4, -3.05, -7.8, -5.1);
      block(3.05, 3.4, -7.8, -5.1);
      block(-0.18, 0.18, -7.8, -5.1);
      block(0.15, 3.2, -5.35, -5.05);
      if (!isLiftOpenAtY(footY)) {
        block(-3.1, -0.15, -5.35, -5.05);
      }
    } else if (footLY - LOCAL_FLOOR_YS[10] < 0.85) {
      // Rooftop Parapet Guardrail
      block(-24.1, 24.1, -12.0, -11.5);
      block(-24.1, 24.1, 5.5, 6.0);
      block(-24.1, -23.5, -12.0, 6.0);
      block(23.5, 24.1, -12.0, 6.0);
    }

    // 4) North Historic Red-Brick Clock Tower Judge Court Collisions
    if (footLY < 5.5 && pt.lx < -25.0) {
      block(-54.2, -26.8, -12.1, -11.5);
      block(-54.2, -53.6, -12.0, 4.5);
      block(-27.4, -26.8, -12.0, 4.5);
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
   * INTERACTION PROMPTS, LIFT KEYPAD, GATE, ZONES & QUALITY MODE
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
    const footLY = (pos.y - 1.68 - COMPOUND_Y) / SCALE;
    // Only enclosed interiors trigger indoor camera pull-in (open-air portico stays smooth without sudden zoom snap!)
    const inCJM = lx >= -24.0 && lx <= 24.0 && lz >= -12.0 && lz <= 5.6 && footLY < LOCAL_FLOOR_YS[10] - 0.6;
    const inHist = lx >= -54.0 && lx <= -27.0 && lz >= -12.0 && lz <= 4.8 && footLY < 5.5;
    return inCJM || inHist;
  }

  function getZoneName(wx, wz, footY = 0) {
    const { lx, lz } = worldToLocalXZ(wx, wz);
    if (lx < -56 || lx > 46 || lz < -21 || lz > 25.0) return null;
    const footLY = (footY - COMPOUND_Y) / SCALE;

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

  function setQualityMode(q = 'medium') {
    state.qualityMode = q;
    const d = QUALITY_VIS_DIST[q] || QUALITY_VIS_DIST.medium;
    state.visDistSq = d * d;
    if (state.loaded) applyQualityToLoadedAssets();
  }

  function syncVisibility(playerPos) {
    if (!playerPos) return;
    const dSq = (playerPos.x - ANCHOR_X) ** 2 + (playerPos.z - ANCHOR_Z) ** 2;
    const wantVis = dSq <= state.visDistSq;
    if (wantVis && !state.loaded && !state.loading) {
      ensureLoaded();
    }
    if (root.visible !== wantVis) root.visible = wantVis;
  }

  function setNightFactor(nf = 0) {
    state.nightFactor = THREE.MathUtils.clamp(nf, 0, 1);
    applyEmissiveNightFactor();
  }

  function update(time, playerPos = null) {
    const dt = state.lastTime > 0 ? THREE.MathUtils.clamp(time - state.lastTime, 0.001, 0.05) : 0.016;
    state.lastTime = time;

    if (playerPos) {
      syncVisibility(playerPos);
      if (time >= state.manualHoldUntil) {
        const distToGate = Math.hypot(playerPos.x - GATE_WORLD.x, playerPos.z - GATE_WORLD.z);
        if (!state.mainGateOpen && distToGate <= 8.5) {
          state.mainGateOpen = true;
        }
      }
    }
    if (!root.visible || !state.loaded) return;

    // 1) Animate Workable Main & Pedestrian Steel Gates
    const targetGate = state.mainGateOpen ? 1.0 : 0.0;
    state.gateProgress += (targetGate - state.gateProgress) * Math.min(1, dt * 4.0);
    if (state.gateL) state.gateL.rotation.y = state.gateProgress * 1.32;
    if (state.gateR) state.gateR.rotation.y = -state.gateProgress * 1.32;
    if (state.pedL) state.pedL.rotation.y = state.gateProgress * 0.90;
    if (state.pedR) state.pedR.rotation.y = -state.gateProgress * 0.90;

    // 2) Animate Workable 10-Floor Elevator Cabin + Cabin & Landing Doors
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
        state.liftY = COMPOUND_Y + tgtLY * SCALE;
        state.liftFloorIndex = state.liftTargetIndex;
        state.liftDirection = 0;
        state.liftPhase = 'opening';
      } else {
        state.liftLocalY += Math.sign(diff) * speed * dt;
        state.liftY = COMPOUND_Y + state.liftLocalY * SCALE;
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
      const cabY = Math.min(state.liftLocalY - 0.08, LOCAL_CABIN_YS[9]);
      state.liftCabin.position.y = Math.max(LOCAL_CABIN_YS[0], cabY);
    }

    const slide = state.liftDoorOpen * 0.68;
    const activeFloorNum = state.liftFloorIndex + 1;
    if (Math.abs(slide - state.lastDoorSlide) > 0.001 || activeFloorNum !== state.lastActiveFloor) {
      state.lastDoorSlide = slide;
      state.lastActiveFloor = activeFloorNum;
      if (state.cabDoorL) state.cabDoorL.position.x = -0.38 - slide;
      if (state.cabDoorR) state.cabDoorR.position.x = 0.38 + slide;
      for (let fl = 1; fl <= 10; fl++) {
        const pair = state.landingDoors[fl];
        if (!pair) continue;
        const s = (fl === activeFloorNum && state.liftPhase !== 'moving') ? slide : 0;
        if (pair.L) pair.L.position.x = -2.03 - s;
        if (pair.R) pair.R.position.x = -1.27 + s;
      }
    }
  }

  // Non-blocking background preload so warping to Judge Court via Map is 100% instant (stays hidden until in range!)
  const scheduleBgPreload = () => {
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => ensureLoaded(), { timeout: 2500 });
    } else {
      ensureLoaded();
    }
  };
  setTimeout(scheduleBgPreload, 900);

  return {
    group: root,
    eyebrowTitle: 'KHULNA CJM & DISTRICT JUDGE COURT',
    stops: LIFT_STOPS,
    state,
    liftCabinCenter: { x: LIFT_CENTER_WORLD.x, z: LIFT_CENTER_WORLD.z },
    liftExitPos: { x: LIFT_EXIT_WORLD.x, z: LIFT_EXIT_WORLD.z },
    preload: ensureLoaded,
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
    setQualityMode,
    setNightFactor,
    update,
    syncVisibility,
  };
}
