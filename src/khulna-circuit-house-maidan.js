import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeStaticMeshes } from './scene-utils.js';

/**
 * KHULNA CIRCUIT HOUSE MAIDAN (খুলনা সার্কিট হাউজ ময়দান — REAL STREET-VIEW & SATELLITE 3D GLB MODULE)
 *
 * Built specifically around the game's existing enterable Khulna Circuit House (leaving it 100% untouched):
 *  - Full sandy-and-grassy Maidan + Northern Extension + Blue Outdoor Sports Court + East-West Concrete Walkway
 *  - Authentic Main Entrance Gate ("খুলনা সার্কিট হাউজ ময়দান") with ribbed white ceramic tiles, posters & red-brown finials
 *  - Rusted steel A-frame/tripod pipe barriers (South & East), 6-course red-brick dwarf wall + white/red pillars (West),
 *    Liberation War Mural wall (East)
 *  - Interlocking diagonal red/cream/grey hexagonal paver footpaths, black-and-yellow striped curbs, storm drains & vendor cart
 *  - Surrounding Upper Jessore Rd, West & SE buildings (Hasan Tower, 5F Apartment, আঃ সাত্তার ম্যানসন, Heritage Colonial bldgs, Club Pavilion)
 */

export const MAIDAN_ANCHOR = {
  x: 40.0,
  z: -620.0,
};

// Spawn directly on Upper Jessore Rd (36 Upper Jessore Rd) facing North into the Main Gate!
export const MAIDAN_SPAWN = {
  x: 40.0,
  z: -520.2,
  lookX: 40.0,
  lookZ: -548.0,
};

const QUALITY_VIS_DIST = {
  low: 270,
  medium: 360,
  high: 440,
  ultra: 520,
};

function resolveCircleAABB(pos, r, minX, maxX, minZ, maxZ) {
  const cx = THREE.MathUtils.clamp(pos.x, minX, maxX);
  const cz = THREE.MathUtils.clamp(pos.z, minZ, maxZ);
  const dx = pos.x - cx;
  const dz = pos.z - cz;
  const dSq = dx * dx + dz * dz;
  if (dSq < r * r) {
    if (dSq < 1e-8) {
      const dL = Math.abs(pos.x - minX);
      const dR = Math.abs(maxX - pos.x);
      const dN = Math.abs(pos.z - minZ);
      const dS = Math.abs(maxZ - pos.z);
      const m = Math.min(dL, dR, dN, dS);
      if (m === dL) pos.x = minX - r;
      else if (m === dR) pos.x = maxX + r;
      else if (m === dN) pos.z = minZ - r;
      else pos.z = maxZ + r;
    } else {
      const d = Math.sqrt(dSq);
      pos.x += (dx / d) * (r - d);
      pos.z += (dz / d) * (r - d);
    }
    return true;
  }
  return false;
}

function resolveCircleSegment(pos, r, ax, az, bx, bz, halfThick = 0.16) {
  const vx = bx - ax;
  const vz = bz - az;
  const lenSq = vx * vx + vz * vz;
  const t = lenSq > 1e-6 ? THREE.MathUtils.clamp(((pos.x - ax) * vx + (pos.z - az) * vz) / lenSq, 0, 1) : 0;
  const cx = ax + vx * t;
  const cz = az + vz * t;
  const dx = pos.x - cx;
  const dz = pos.z - cz;
  const minDist = r + halfThick;
  const dSq = dx * dx + dz * dz;
  if (dSq < minDist * minDist) {
    const d = Math.sqrt(Math.max(dSq, 1e-8));
    pos.x = cx + (dx / d) * minDist;
    pos.z = cz + (dz / d) * minDist;
    return true;
  }
  return false;
}

export function buildKhulnaCircuitHouseMaidan(parent, _m, renderer = null) {
  const root = new THREE.Group();
  root.name = 'KhulnaCircuitHouseMaidan_RealGLB';
  root.position.set(MAIDAN_ANCHOR.x, 0.0, MAIDAN_ANCHOR.z);
  root.visible = false;
  root.matrixAutoUpdate = false;
  root.updateMatrix();
  parent.add(root);

  const state = {
    loaded: false,
    loading: false,
    qualityMode: 'medium',
    visDistSq: QUALITY_VIS_DIST.medium * QUALITY_VIS_DIST.medium,
    allMats: [],
    allMeshes: [],
  };

  function applyQualityToLoadedAssets() {
    const q = state.qualityMode;
    const isLow = q === 'low';
    const isMed = q === 'medium';
    const aniso = isLow ? 1 : (isMed ? 2 : 4);
    for (let i = 0; i < state.allMats.length; i++) {
      const mat = state.allMats[i];
      mat.envMapIntensity = isLow ? 0.0 : 0.45;
      if (mat.map && mat.map.anisotropy !== aniso) {
        mat.map.anisotropy = aniso;
        mat.map.needsUpdate = true;
      }
    }
    for (let i = 0; i < state.allMeshes.length; i++) {
      const mesh = state.allMeshes[i];
      mesh.castShadow = !isLow && Boolean(mesh.userData._canCastShadow);
      mesh.receiveShadow = !isLow && Boolean(mesh.userData._canReceiveShadow);
    }
  }

  function ensureLoaded() {
    if (state.loaded || state.loading) return;
    state.loading = true;

    const loader = new GLTFLoader();
    loader.load(
      './assets/khulna_circuit_house_maidan.glb',
      (gltf) => {
        const model = gltf.scene;
        model.name = 'KhulnaCircuitHouseMaidan_GLB_Scene';
        model.updateMatrixWorld(true);

        const seenMats = new Set();
        const tmpBox = new THREE.Box3();
        const tmpSize = new THREE.Vector3();

        model.traverse((obj) => {
          if (!obj.isMesh) return;
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const mat of mats) {
            if (!mat || seenMats.has(mat)) continue;
            seenMats.add(mat);
            if (mat.name === 'M_Blue_Mesh_Net') {
              mat.transparent = true;
              mat.opacity = 0.68;
              mat.side = THREE.DoubleSide;
              mat.depthWrite = false;
            }
            state.allMats.push(mat);
          }

          const n = obj.name || '';
          const isGroundLike = (
            n.includes('Terrain')
            || n.includes('Footpaths')
            || n.includes('Curbs')
            || n.includes('Roads')
            || n.includes('Walkway')
            || n.includes('Drain')
            || n.includes('Grass_Tufts')
          );

          let casts = false;
          if (!isGroundLike && obj.geometry) {
            if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
            if (obj.geometry.boundingBox) {
              tmpBox.copy(obj.geometry.boundingBox).applyMatrix4(obj.matrixWorld);
              tmpBox.getSize(tmpSize);
              casts = Math.max(tmpSize.x, tmpSize.y, tmpSize.z) >= 2.8;
            }
          }
          obj.castShadow = casts;
          obj.receiveShadow = true;
        });

        root.add(model);
        root.updateMatrixWorld(true);

        try {
          mergeStaticMeshes(model);
        } catch (err) {
          console.warn('[KhulnaCircuitHouseMaidan] Static batching fallback:', err);
        }

        model.traverse((obj) => {
          if (obj.isMesh) {
            obj.matrixAutoUpdate = false;
            obj.updateMatrix();
            obj.userData._canCastShadow = obj.castShadow;
            obj.userData._canReceiveShadow = obj.receiveShadow;
            state.allMeshes.push(obj);
          }
        });

        applyQualityToLoadedAssets();
        state.loaded = true;
        state.loading = false;

        if (renderer && typeof renderer.initTexture === 'function') {
          const texList = [];
          const seenTex = new Set();
          for (const mat of state.allMats) {
            for (const t of [mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap]) {
              if (t && !seenTex.has(t)) {
                seenTex.add(t);
                texList.push(t);
              }
            }
          }
          let idx = 0;
          const warmBatch = () => {
            const end = Math.min(idx + 4, texList.length);
            for (; idx < end; idx++) {
              try { renderer.initTexture(texList[idx]); } catch {}
            }
            if (idx < texList.length) requestAnimationFrame(warmBatch);
          };
          requestAnimationFrame(warmBatch);
        }
      },
      undefined,
      (err) => {
        state.loading = false;
        console.error('[KhulnaCircuitHouseMaidan] Failed to load ./assets/khulna_circuit_house_maidan.glb:', err);
      }
    );
  }

  function setQualityMode(q = 'medium') {
    state.qualityMode = q;
    const d = QUALITY_VIS_DIST[q] ?? QUALITY_VIS_DIST.medium;
    state.visDistSq = d * d;
    if (state.loaded) applyQualityToLoadedAssets();
  }

  function syncVisibility(playerPos) {
    if (!playerPos) return;
    const dx = playerPos.x - MAIDAN_ANCHOR.x;
    const dz = playerPos.z - MAIDAN_ANCHOR.z;
    const distSq = dx * dx + dz * dz;
    const vis = distSq <= state.visDistSq;
    if (vis && !state.loaded && !state.loading) ensureLoaded();
    if (root.visible !== vis) root.visible = vis;
  }

  function getZoneName(wx, wz) {
    // Never override existing Khulna Circuit House zone!
    if (wx >= 83.0 && wz <= -651.5) return null;
    if (Math.abs(wx - 40.0) <= 7.5 && wz >= -532.5 && wz <= -523.5) {
      return 'খুলনা সার্কিট হাউজ ময়দান · MAIN GATE (36 UPPER JESSORE RD)';
    }
    if (wx >= -1.0 && wx <= 17.0 && wz >= -715.0 && wz <= -685.0) {
      return 'খুলনা সার্কিট হাউজ ময়দান · BLUE SPORTS COURT';
    }
    if (wx >= -33.0 && wx <= 131.0 && wz >= -729.5 && wz <= -523.0) {
      return 'খুলনা সার্কিট হাউজ ময়দান · CIRCUIT HOUSE GROUND';
    }
    return null;
  }

  function getGroundHeight(pos) {
    if (!pos) return 0;
    const { x, z } = pos;
    if (x < -98 || x > 142 || z < -737 || z > -488) return 0;
    // Defer NE Circuit House compound entirely to khulna-circuit-house.js!
    if (x >= 83.0 && z <= -651.5) return 0;

    // 1) Main Gate smooth entrance apron (x = 36.9..43.1, z = -530.5..-524.5)
    if (x >= 36.9 && x <= 43.1 && z >= -530.5 && z <= -524.5) {
      return 0.055;
    }

    // 2) Upper Jessore Rd North & South Hex-Paver Sidewalks (curb + 2.5m footpath)
    if (x >= -94 && x <= 139 && z >= -530.0 && z <= -510.0) {
      // Interpolate road centerline z along Upper Jessore Rd
      let roadZ = -522.0;
      if (x < -38.0) {
        const t = THREE.MathUtils.clamp((x - (-95.0)) / 57.0, 0, 1);
        roadZ = -517.6 + t * 1.6;
      } else if (x < 40.0) {
        const t = (x - (-38.0)) / 78.0;
        roadZ = -516.0 + t * (-6.0);
      } else if (x < 109.0) {
        const t = (x - 40.0) / 69.0;
        roadZ = -522.0 + t * 1.0;
      } else {
        const t = THREE.MathUtils.clamp((x - 109.0) / 31.0, 0, 1);
        roadZ = -521.0 + t * 1.2;
      }
      const off = Math.abs(z - roadZ);
      if (off >= 4.2 && off <= 6.85) return 0.16;
    }

    // 3) East-West Concrete Walkway across northern Maidan
    if (x >= -20.0 && x <= 83.0 && z >= -653.5 && z <= -650.5) {
      return 0.065;
    }

    // 4) Northern Blue Basketball / Sports Court
    if (x >= -0.5 && x <= 16.5 && z >= -714.5 && z <= -685.5) {
      return 0.068;
    }

    // 5) Open Maidan Interior
    if (x >= -33.5 && x <= 131.5 && z >= -729.5 && z <= -523.0) {
      return 0.032;
    }

    return 0;
  }

  function applyCollisions(pos, radius = 0.34, footY = 0, _isVehicle = false) {
    if (!pos || footY > 34.0) return;
    const { x, z } = pos;
    if (x < -80 || x > 150 || z < -736 || z > -485) return;
    // Never interfere with existing Khulna Circuit House!
    if (x >= 83.0 && z <= -651.5) return;

    // 1) Twin Main Gate Pillars at (40.0, -528.2) — clear 5.8m opening between x=37.1 and x=42.9!
    if (footY < 4.8) {
      resolveCircleAABB(pos, radius, 36.02, 37.08, -528.75, -527.65);
      resolveCircleAABB(pos, radius, 42.92, 43.98, -528.75, -527.65);
    }

    // 2) Low Tripod Pipe Barriers & West Brick Wall (passable when jumping over footY > 1.25m)
    if (footY < 1.25) {
      // South Tripod Barrier (West of Gate & East of Gate)
      resolveCircleSegment(pos, radius, -33.5, -522.2, 0.0, -525.0, 0.15);
      resolveCircleSegment(pos, radius, 0.0, -525.0, 36.1, -528.0, 0.15);
      resolveCircleSegment(pos, radius, 43.9, -528.1, 78.0, -527.6, 0.15);
      resolveCircleSegment(pos, radius, 78.0, -527.6, 104.2, -527.2, 0.15);

      // East Tripod Barrier along Southern Circuit House Rd (stops south of existing Circuit House!)
      resolveCircleSegment(pos, radius, 104.2, -527.2, 112.4, -567.0, 0.15);
      resolveCircleSegment(pos, radius, 112.4, -567.0, 131.5, -650.5, 0.15);

      // West Red-Brick Dwarf Wall (leaving pedestrian openings at z=-652.0 walkway & z=-700 court!)
      resolveCircleSegment(pos, radius, -33.5, -522.2, -22.5, -551.0, 0.18);
      resolveCircleSegment(pos, radius, -22.5, -551.0, -32.4, -610.0, 0.18);
      resolveCircleSegment(pos, radius, -32.4, -610.0, -20.5, -649.0, 0.18);
      resolveCircleSegment(pos, radius, -18.8, -655.0, -9.6, -695.0, 0.18);
      resolveCircleSegment(pos, radius, -9.6, -703.2, -9.6, -728.8, 0.18);
    }

    // 3) East Opposite Liberation War Mural Wall (footY < 2.0)
    if (footY < 2.0) {
      resolveCircleSegment(pos, radius, 116.2, -526.0, 123.8, -562.0, 0.18);
      resolveCircleSegment(pos, radius, 123.8, -562.0, 131.0, -593.5, 0.18);
    }

    // 4) Surrounding Neighborhood Buildings (South Upper Jessore Rd, West & East)
    resolveCircleAABB(pos, radius, 30.7, 49.3, -510.6, -491.4);   // Hasan Tower (35 Lower Jessore Rd)
    resolveCircleAABB(pos, radius, 10.2, 25.8, -508.2, -492.0);   // 5F Cream Apartment
    resolveCircleAABB(pos, radius, -13.5, 5.5, -511.4, -490.0);   // A. Sattar Mansion & Terracotta Wall
    resolveCircleAABB(pos, radius, -40.0, -20.0, -506.0, -489.0); // SW Shaheen Commercial Block
    resolveCircleAABB(pos, radius, -67.3, -48.7, -508.0, -490.0); // SW 10F Concrete Tower
    resolveCircleAABB(pos, radius, 54.5, 75.5, -514.4, -493.5);   // SE White Wall & 4F Building
    resolveCircleAABB(pos, radius, 82.0, 100.0, -508.3, -494.7);  // SE White Colonial Building
    resolveCircleAABB(pos, radius, 105.7, 124.3, -508.5, -494.5); // SE Red-Brick Heritage Building
    resolveCircleAABB(pos, radius, -60.6, -41.3, -580.5, -555.5); // West Mint Institutional Compound
    resolveCircleAABB(pos, radius, -57.2, -46.8, -658.4, -617.6); // West Terracotta/White Club Pavilion
    resolveCircleAABB(pos, radius, 127.0, 141.0, -555.5, -536.5); // East Southern Bldg 1
    resolveCircleAABB(pos, radius, 131.7, 146.3, -585.3, -566.7); // East Southern Bldg 2
  }

  function update(_time, playerPos = null, skipSyncVisibility = false) {
    if (playerPos && !skipSyncVisibility) syncVisibility(playerPos);
  }

  setTimeout(() => ensureLoaded(), 320);

  return {
    root,
    preload: ensureLoaded,
    setQualityMode,
    syncVisibility,
    setNightFactor() {},
    update,
    getZoneName,
    getGroundHeight,
    applyCollisions,
  };
}
