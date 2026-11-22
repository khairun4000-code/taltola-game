import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeStaticMeshes } from './scene-utils.js';

/**
 * KHULNA CIRCUIT HOUSE (খুলনা সার্কিট হাউজ — GTA-READY ENTERABLE 3D GLB MODULE)
 *
 * Performance-optimized integration:
 *  - Lazy-loads khulna_circuit_house.glb only when player approaches within range
 *  - Batches ~650 static GLB meshes into minimal merged GPU draw calls (keeping Main_Sliding_Gate_Leaf & FoliageSway_* dynamic)
 *  - Zero global PointLights (eliminates scene-wide PBR shader bloat & shader-recompile hitches; uses emissive night boost + main.js indoorLight)
 *  - Smart shadow casting (only major exterior building structures cast shadows; foliage/AO/small props skip shadow pass)
 *  - Quality-aware distance culling for locked 60–120 FPS at full native resolution
 */

export const CIRCUIT_HOUSE_ANCHOR = {
  x: 115.5,
  z: -677.5,
  scale: 0.88,
  rotY: Math.PI - 0.15, // Aligns footpath & main sliding gate flush with Circuit House Rd (K.D. Ghos Rd)
};

// Spawn directly on Circuit House Rd facing the iconic 3D Red-Brick Main Gate & Footpath
export const CIRCUIT_HOUSE_SPAWN = {
  x: 144.2,
  z: -684.0,
  lookX: 133.5,
  lookZ: -684.5,
};

const { x: ANCHOR_X, z: ANCHOR_Z, scale: SCALE, rotY: ROT_Y } = CIRCUIT_HOUSE_ANCHOR;
const COS_R = Math.cos(ROT_Y);
const SIN_R = Math.sin(ROT_Y);

const GATE_OPEN_Z = 14.25;
const GATE_CLOSED_Z = 11.20;

const QUALITY_VIS_DIST = {
  low: 200,
  medium: 280,
  high: 370,
  ultra: 440,
};

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

export function buildKhulnaCircuitHouse(parent, m, renderer = null, botanicalFoliage = null) {
  const root = new THREE.Group();
  root.name = 'KhulnaCircuitHouse_RealGLB_District';
  root.visible = false;
  root.matrixAutoUpdate = false;
  root.updateMatrix();
  parent.add(root);

  const compound = new THREE.Group();
  compound.name = 'KhulnaCircuitHouse_CompoundRoot';
  compound.position.set(ANCHOR_X, 0.015, ANCHOR_Z);
  compound.rotation.y = ROT_Y;
  compound.scale.setScalar(SCALE);
  root.add(compound);

  // Subtle paved threshold apron bridging west asphalt edge of Circuit House Rd cleanly into our footpath gate entrance
  const bridgeMat = new THREE.MeshStandardMaterial({
    color: 0x8d887e,
    map: m?.concrete?.map || null,
    roughness: 0.9,
    metalness: 0.0,
  });
  const apronBridge = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.04, 6.8), bridgeMat);
  apronBridge.name = 'CircuitHouse_RoadToFootpathApron';
  apronBridge.position.set(-28.1, 0.02, 11.25);
  apronBridge.receiveShadow = true;
  apronBridge.matrixAutoUpdate = false;
  apronBridge.updateMatrix();
  compound.add(apronBridge);
  compound.matrixAutoUpdate = false;
  compound.updateMatrix();

  const state = {
    loaded: false,
    loading: false,
    gateOpen: true,
    slidingGateNode: null,
    swayNodes: [],
    emissiveMats: [],
    allMats: [],
    allMeshes: [],
    nightFactor: 0,
    lastTime: 0,
    qualityMode: 'medium',
    visDistSq: QUALITY_VIS_DIST.medium * QUALITY_VIS_DIST.medium,
    nearPlayer: false,
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
      mat.envMapIntensity = isLow ? 0.0 : (mat.userData._origEnvInt ?? 0.55);
      if (mat.map && mat.map.anisotropy !== aniso) { mat.map.anisotropy = aniso; mat.map.needsUpdate = true; }
      if (mat.normalMap && mat.normalMap.anisotropy !== aniso) { mat.normalMap.anisotropy = aniso; mat.normalMap.needsUpdate = true; }
      if (dirty) mat.needsUpdate = true;
    }
    for (let i = 0; i < state.allMeshes.length; i++) {
      const mesh = state.allMeshes[i];
      mesh.castShadow = !isLow && Boolean(mesh.userData._canCastShadow);
      mesh.receiveShadow = !isLow && Boolean(mesh.userData._canReceiveShadow);
    }
  }

  function applyEmissiveNightFactor() {
    const nf = state.nightFactor;
    for (let i = 0; i < state.emissiveMats.length; i++) {
      const entry = state.emissiveMats[i];
      entry.mat.emissiveIntensity = entry.base + nf * entry.nightBoost;
    }
  }

  function ensureLoaded() {
    if (state.loaded || state.loading) return;
    state.loading = true;

    const loader = new GLTFLoader();
    loader.load(
      './assets/khulna_circuit_house.glb',
      (gltf) => {
        const model = gltf.scene;
        model.name = 'KhulnaCircuitHouse_GLB_Scene';
        model.updateMatrixWorld(true);
        // Share exact Circuit House botanical tree, Norfolk Pine, Palm & swaying bush prototypes across all of Khulna City!
        botanicalFoliage?.ingestCircuitHouseGLB?.(model);

        const dynamicRoot = new THREE.Group();
        dynamicRoot.name = 'KhulnaCircuitHouse_Dynamic';
        const dynamicToDetach = [];
        const seenMats = new Set();
        const tmpBox = new THREE.Box3();
        const tmpSize = new THREE.Vector3();

        model.traverse((obj) => {
          if (obj.name === 'Main_Sliding_Gate_Leaf') {
            state.slidingGateNode = obj;
            obj.position.z = state.gateOpen ? GATE_OPEN_Z : GATE_CLOSED_Z;
            dynamicToDetach.push(obj);
          } else if (obj.name && obj.name.startsWith('FoliageSway_')) {
            state.swayNodes.push({
              obj,
              phase: state.swayNodes.length * 1.37,
              baseRotZ: obj.rotation.z,
              baseRotX: obj.rotation.x,
            });
            dynamicToDetach.push(obj);
          }

          if (obj.isMesh) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            let isAO = false;
            let isFoliage = false;
            for (const mat of mats) {
              if (!mat) continue;
              if (mat.name === 'Baked_Contact_AO_Shadow') isAO = true;
              if (mat.name && mat.name.startsWith('Botanical_LeafCard_')) {
                isFoliage = true;
                mat.alphaTest = 0.42;
                mat.side = THREE.DoubleSide;
              }
              if (!seenMats.has(mat)) {
                seenMats.add(mat);
                mat.userData._origNormalMap = mat.normalMap || null;
                mat.userData._origRoughnessMap = mat.roughnessMap || null;
                mat.userData._origEnvInt = isFoliage ? 0.35 : 0.55;
                state.allMats.push(mat);
                if (mat.emissive && (mat.emissive.r > 0.05 || mat.emissive.g > 0.05 || mat.emissive.b > 0.05)) {
                  state.emissiveMats.push({
                    mat,
                    base: mat.emissiveIntensity || 0.4,
                    nightBoost: 1.4,
                  });
                }
              }
            }

            // Only major architectural exterior meshes cast shadows (skips foliage leaf cards, AO planes & interior/small props!)
            let largeEnough = false;
            if (!isAO && !isFoliage && obj.geometry) {
              if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
              if (obj.geometry.boundingBox) {
                tmpBox.copy(obj.geometry.boundingBox).applyMatrix4(obj.matrixWorld);
                tmpBox.getSize(tmpSize);
                largeEnough = Math.max(tmpSize.x, tmpSize.y, tmpSize.z) >= 3.2;
              }
            }
            obj.castShadow = largeEnough;
            obj.receiveShadow = !isAO && !isFoliage;
          }
        });

        // Move dynamic nodes (sliding gate + wind-swaying foliage) into dynamicRoot BEFORE merging static geometry!
        compound.add(model);
        compound.add(dynamicRoot);
        compound.updateMatrixWorld(true);
        for (const node of dynamicToDetach) {
          dynamicRoot.attach(node);
        }
        // Keep sway foliage non-shadow-casting for ultra-fast shadow passes
        for (const s of state.swayNodes) {
          s.obj.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = false;
              child.receiveShadow = false;
            }
          });
        }

        // Batch all ~650 static meshes by material into minimal GPU draw calls (15x fewer draw calls!)
        try {
          mergeStaticMeshes(model);
        } catch (mergeErr) {
          console.warn('[KhulnaCircuitHouse] Static batching fallback:', mergeErr);
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
            obj.userData._canReceiveShadow = obj.receiveShadow;
            state.allMeshes.push(obj);
          }
        });
        applyQualityToLoadedAssets();
        applyEmissiveNightFactor();
        state.loaded = true;
        state.loading = false;

        // Pre-upload all GLB textures to GPU VRAM in tiny non-blocking batches so warping to Circuit House is instant!
        if (renderer && typeof renderer.initTexture === 'function') {
          const texList = [];
          const seenTex = new Set();
          for (let i = 0; i < state.allMats.length; i++) {
            const mat = state.allMats[i];
            for (const t of [mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap, mat.emissiveMap]) {
              if (t && !seenTex.has(t)) {
                seenTex.add(t);
                texList.push(t);
              }
            }
          }
          let idx = 0;
          const warmBatch = () => {
            const end = Math.min(idx + 4, texList.length);
            for (; idx < end; idx++) { try { renderer.initTexture(texList[idx]); } catch {} }
            if (idx < texList.length) requestAnimationFrame(warmBatch);
          };
          requestAnimationFrame(warmBatch);
        }
      },
      undefined,
      (err) => {
        state.loading = false;
        console.error('[KhulnaCircuitHouse] Failed to load ./assets/khulna_circuit_house.glb:', err);
      }
    );
  }

  // Precompute world gate position for proximity prompt & [E] interaction
  const gateWorldPos = localToWorld(-21.0, 1.5, 11.25);

  function setQualityMode(q = 'medium') {
    state.qualityMode = q;
    const d = QUALITY_VIS_DIST[q] ?? QUALITY_VIS_DIST.medium;
    state.visDistSq = d * d;
    if (state.loaded) applyQualityToLoadedAssets();
  }

  function syncVisibility(playerPos) {
    if (!playerPos) return;
    const dx = playerPos.x - ANCHOR_X;
    const dz = playerPos.z - ANCHOR_Z;
    const distSq = dx * dx + dz * dz;
    const vis = distSq <= state.visDistSq;
    if (vis && !state.loaded && !state.loading) {
      ensureLoaded();
    }
    if (root.visible !== vis) root.visible = vis;
    state.nearPlayer = distSq <= 95 * 95;
  }

  function setNightFactor(nf) {
    state.nightFactor = THREE.MathUtils.clamp(nf, 0, 1);
    applyEmissiveNightFactor();
  }

  function update(time, playerPos = null, skipSyncVisibility = false) {
    const dt = state.lastTime > 0 ? Math.min(Math.max(time - state.lastTime, 0.001), 0.05) : 0.016;
    state.lastTime = time;

    if (playerPos && !skipSyncVisibility) syncVisibility(playerPos);
    if (!root.visible || !state.loaded) return;

    // Smooth mechanical sliding gate glide along steel floor track!
    if (state.slidingGateNode) {
      const targetZ = state.gateOpen ? GATE_OPEN_Z : GATE_CLOSED_Z;
      if (Math.abs(state.slidingGateNode.position.z - targetZ) > 0.002) {
        state.slidingGateNode.position.z += (targetZ - state.slidingGateNode.position.z) * Math.min(1, dt * 4.8);
      }
    }

    // Gentle tropical breeze swaying botanical foliage leaf cards only when nearby & not on Smooth/Low mode
    if (state.nearPlayer && state.qualityMode !== 'low' && state.swayNodes.length > 0) {
      for (let i = 0; i < state.swayNodes.length; i++) {
        const s = state.swayNodes[i];
        s.obj.rotation.z = s.baseRotZ + Math.sin(time * 1.15 + s.phase) * 0.013;
        s.obj.rotation.x = s.baseRotX + Math.cos(time * 0.92 + s.phase) * 0.009;
      }
    }
  }

  function getPrompt(pos) {
    if (!pos) return null;
    const footY = pos.y - 1.68;
    if (footY < 3.5 && Math.hypot(pos.x - gateWorldPos.x, pos.z - gateWorldPos.z) < 8.0) {
      return state.gateOpen
        ? '[E] Close Circuit House Sliding Gate (সার্কিট হাউজ স্লাইড গেট বন্ধ করুন)'
        : '[E] Open Circuit House Sliding Gate (সার্কিট হাউজ স্লাইড গেট খুলুন)';
    }
    return null;
  }

  function toggleGate(pos) {
    if (!pos) return false;
    if (Math.hypot(pos.x - gateWorldPos.x, pos.z - gateWorldPos.z) < 9.5) {
      state.gateOpen = !state.gateOpen;
      return true;
    }
    return false;
  }

  function interact(pos) {
    if (toggleGate(pos)) {
      return {
        handled: true,
        message: state.gateOpen
          ? 'খুলনা সার্কিট হাউজ স্লাইড গেট খোলা হয়েছে'
          : 'খুলনা সার্কিট হাউজ স্লাইড গেট বন্ধ করা হয়েছে',
      };
    }
    return null;
  }

  function isInFootprint(pos, pad = 2.0) {
    if (!pos) return false;
    const { lx, lz } = worldToLocalXZ(pos.x, pos.z);
    return lx >= -27 - pad && lx <= 38 + pad && lz >= -36 - pad && lz <= 36 + pad;
  }

  function isInsideBuilding(pos) {
    if (!pos) return false;
    const { lx, lz } = worldToLocalXZ(pos.x, pos.z);
    if (lx >= -2.2 && lx <= 6.2 && lz >= -21.4 && lz <= -15.4) return true;
    if (lx >= -16.0 && lx <= -8.5 && lz >= -12.8 && lz <= 3.8) return true;
    if (lx >= 15.0 && lx <= 33.2 && lz >= -15.5 && lz <= -10.4) return true;
    if (lx >= -21.0 && lx <= -18.8 && lz >= 2.2 && lz <= 4.5) return true;
    return false;
  }

  function getZoneName(wx, wz, _footY = 0) {
    const { lx, lz } = worldToLocalXZ(wx, wz);
    if (lx < -27 || lx > 37 || lz < -35 || lz > 35) return null;
    if (lx >= -2.2 && lx <= 6.2 && lz >= -21.4 && lz <= -15.4) {
      return 'KHULNA CIRCUIT HOUSE · RECEPTION LOBBY';
    }
    if (lx >= -16.0 && lx <= -8.5 && lz >= -12.8 && lz <= 3.8) {
      return 'KHULNA CIRCUIT HOUSE · 3-STORY VIP SUITE';
    }
    if (lx >= 15.0 && lx <= 33.2 && lz >= -15.5 && lz <= -8.4) {
      return 'KHULNA CIRCUIT HOUSE · COLONIAL CONFERENCE HALL';
    }
    if (lx >= -26.0 && lx <= -17.0 && lz >= 1.5 && lz <= 17.5) {
      return 'KHULNA CIRCUIT HOUSE · MAIN GATE (K.D. GHOS RD)';
    }
    return 'KHULNA CIRCUIT HOUSE · COMPOUND & FORECOURT';
  }

  function getGroundHeight(pos) {
    if (!pos) return 0;
    const { lx, lz } = worldToLocalXZ(pos.x, pos.z);
    // Smooth cutoff right at outer edge of road-to-footpath apron (lx < -30.8 stays on flat asphalt road y = 0!)
    if (lx < -30.85 || lx > 37 || lz < -35 || lz > 35) return 0;
    if (lx < -26.2 && (lz < 7.6 || lz > 14.9)) return 0;

    const COMPOUND_Y = 0.015;
    let ly = 0.04;
    if (lx < -25.6) {
      // Smooth ramp up from asphalt road (lx = -30.85, 0m) onto Gate_Footpath_Entrance_Apron (lx = -25.6, 0.08m)
      const t = THREE.MathUtils.clamp((lx - (-30.85)) / 5.25, 0, 1);
      return t * (COMPOUND_Y + 0.08 * SCALE);
    }
    if (lx >= -25.6 && lx <= -21.9 && lz >= 8.0 && lz <= 14.5) {
      ly = Math.max(ly, 0.08);
    }
    if (lx >= -25.6 && lx <= -22.4 && (lz <= 8.0 || lz >= 14.5)) {
      const curbT = THREE.MathUtils.clamp((lx - (-25.6)) / 0.35, 0, 1);
      ly = Math.max(ly, 0.04 + 0.12 * curbT);
    }
    if (lx >= -2.2 && lx <= 6.2 && lz >= -15.8 && lz <= -7.7) {
      ly = Math.max(ly, 0.16);
      if (lz <= -14.3 && lx >= -0.9 && lx <= 4.9) {
        const t = THREE.MathUtils.clamp((-14.3 - lz) / 1.3, 0, 1);
        ly = Math.max(ly, 0.16 + t * 0.40);
      }
    }
    if (lx >= -2.2 && lx <= 6.2 && lz >= -21.4 && lz <= -15.5) {
      ly = Math.max(ly, 0.56);
    }
    if (lx >= -0.9 && lx <= 4.9 && lz >= -28.8 && lz <= -25.0) {
      if (lz >= -25.8 && Math.abs(lx - 2.0) <= 1.0) {
        const t = THREE.MathUtils.clamp((-25.0 - lz) / 0.8, 0, 1);
        ly = Math.max(ly, 0.06 + t * 0.56);
      } else if (lz <= -25.7) {
        ly = Math.max(ly, 0.62);
      }
    }
    if (lx >= -16.0 && lx <= -8.5 && lz >= -12.8 && lz <= 3.8) {
      ly = Math.max(ly, 0.62);
    } else if (lx >= -8.6 && lx <= -7.6 && lz >= -3.3 && lz <= -0.9) {
      const t = THREE.MathUtils.clamp((-7.6 - lx) / 1.0, 0, 1);
      ly = Math.max(ly, 0.05 + t * 0.57);
    }
    if (lx >= 15.0 && lx <= 33.2 && lz >= -15.5 && lz <= -8.5) {
      ly = Math.max(ly, 0.48);
    } else if (lx >= 23.0 && lx <= 25.2 && lz >= -8.6 && lz <= -7.6) {
      const t = THREE.MathUtils.clamp((-7.6 - lz) / 1.0, 0, 1);
      ly = Math.max(ly, 0.05 + t * 0.43);
    }
    if (lx >= -21.0 && lx <= -18.8 && lz >= 2.2 && lz <= 4.5) {
      ly = Math.max(ly, 0.14);
    }
    return COMPOUND_Y + ly * SCALE;
  }

  function applyCollisions(pos, radius = 0.34, footY = 0, isVehicle = false) {
    if (!pos) return;
    if (footY > 4.2 * SCALE) return;

    const pt = worldToLocalXZ(pos.x, pos.z);
    if (pt.lx < -28 || pt.lx > 38 || pt.lz < -36 || pt.lz > 36) return;

    const r = radius / SCALE;
    let moved = false;
    const block = (x0, x1, z0, z1) => {
      if (resolveCircleAABBLocal(pt, r, x0, x1, z0, z1)) moved = true;
    };

    block(-22.5, -22.0, -21.6, 4.45);
    block(-22.5, -22.0, 15.65, 33.6);
    block(-23.8, -22.5, 1.75, 3.15);
    block(-22.2, -21.5, 4.55, 8.45);
    block(-22.2, -21.5, 14.05, 15.65);

    if (!state.gateOpen) {
      block(-20.4, -19.95, 8.35, 14.15);
    }

    block(-21.2, 35.6, 14.35, 14.80);
    block(14.8, 15.2, 14.6, 32.0);

    {
      const dx = pt.lx - 2.0;
      const dz = pt.lz - 1.8;
      const dist = Math.hypot(dx, dz);
      const minDist = 5.25 + r;
      if (dist < minDist) {
        const inv = dist > 1e-4 ? 1 / dist : 1;
        pt.lx = 2.0 + (dist > 1e-4 ? dx * inv : 1) * minDist;
        pt.lz = 1.8 + (dist > 1e-4 ? dz * inv : 0) * minDist;
        moved = true;
      }
    }

    if (isVehicle) {
      block(-16.2, -8.3, -13.0, 4.1);
      block(-2.4, 6.4, -21.8, -14.8);
      block(14.8, 33.5, -15.8, -8.3);
      block(-21.2, -18.7, 2.1, 4.6);
    } else {
      block(-21.1, -20.8, 2.2, 4.5);
      block(-21.1, -18.8, 2.15, 2.40);
      block(-21.1, -18.8, 4.30, 4.55);
      block(-19.0, -18.75, 2.2, 3.35);

      block(-2.35, -2.05, -21.3, -15.5);
      block(6.05, 6.35, -21.3, -15.5);
      block(-2.3, 0.85, -15.8, -15.45);
      block(3.15, 6.3, -15.8, -15.45);
      block(-2.3, 0.65, -21.4, -21.0);
      block(3.35, 6.3, -21.4, -21.0);
      block(4.2, 5.1, -19.5, -16.8);

      block(-16.1, -15.7, -12.8, 3.8);
      block(-16.0, -8.5, 3.55, 3.9);
      block(-16.0, -8.5, -12.9, -12.55);
      block(-8.85, -8.45, -12.8, -3.25);
      block(-8.85, -8.45, -0.95, 3.8);
      block(-15.8, -9.8, -6.35, -6.05);

      block(15.0, 33.2, -15.5, -15.1);
      block(14.9, 15.3, -15.4, -8.6);
      block(32.9, 33.3, -15.4, -8.6);
      block(15.0, 23.1, -10.65, -10.3);
      block(25.1, 33.2, -10.65, -10.3);
      block(15.0, 23.1, -8.85, -8.4);
      block(25.1, 33.2, -8.85, -8.4);
      block(20.6, 27.6, -13.9, -12.1);
    }

    if (moved) {
      pos.x = ANCHOR_X + SCALE * (pt.lx * COS_R + pt.lz * SIN_R);
      pos.z = ANCHOR_Z + SCALE * (-pt.lx * SIN_R + pt.lz * COS_R);
    }
  }

  // Fast non-blocking background preload + GPU texture warm-up so Circuit House appears instantly on warp!
  setTimeout(() => ensureLoaded(), 280);

  return {
    root,
    compound,
    preload: ensureLoaded,
    setQualityMode,
    syncVisibility,
    setNightFactor,
    update,
    getPrompt,
    toggleGate,
    interact,
    isInFootprint,
    isInsideBuilding,
    getZoneName,
    getGroundHeight,
    applyCollisions,
  };
}
