import * as THREE from 'three';

/**
 * KHULNA CITYWIDE BOTANICAL FOLIAGE SYSTEM (GPU-INSTANCED + REALISTIC WIND MOTION)
 *
 * Extracts the exact high-realism botanical trees, Norfolk Island Pines, Palms & swaying
 * ornamental topiary bushes directly from `khulna_circuit_house.glb` (zero extra downloads!)
 * and populates all of Khulna City via GPU-instanced `THREE.InstancedMesh` (~9 total draw calls!)
 * with smooth GPU vertex wind-sway motion driven by per-instance world phase.
 */

function seeded01(seed) {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function applyBotanicalWindShader(mat, windUniform, { swayAmp = 0.14, swaySpeed = 1.35, minHeight = 0.25 } = {}) {
  if (!mat || mat.userData._botanicalWindApplied) return mat;
  const cloned = mat.clone();
  cloned.userData._botanicalWindApplied = true;
  cloned.alphaTest = Math.max(cloned.alphaTest || 0, 0.38);
  cloned.side = THREE.DoubleSide;
  cloned.roughness = Math.max(cloned.roughness ?? 0.78, 0.72);
  cloned.metalness = 0.0;
  cloned.envMapIntensity = 0.42;

  cloned.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = windUniform;
    shader.uniforms.uSwayAmp = { value: swayAmp };
    shader.uniforms.uSwaySpeed = { value: swaySpeed };
    shader.uniforms.uMinHeight = { value: minHeight };

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uWindTime;
        uniform float uSwayAmp;
        uniform float uSwaySpeed;
        uniform float uMinHeight;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float hMask = clamp((position.y - uMinHeight) / 4.5, 0.0, 1.4);
        #ifdef USE_INSTANCING
          vec2 instPos = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
        #else
          vec2 instPos = vec2(0.0, 0.0);
        #endif
        float phase = instPos.x * 0.11 + instPos.y * 0.13 + position.x * 0.45 + position.z * 0.45;
        float tW = uWindTime * uSwaySpeed + phase;
        float gust = 0.72 + 0.28 * sin(uWindTime * 0.42 + instPos.x * 0.03 + instPos.y * 0.03);
        transformed.x += (sin(tW) * 0.75 + sin(tW * 2.13) * 0.25) * uSwayAmp * hMask * gust;
        transformed.z += (cos(tW * 0.87) * 0.75 + cos(tW * 1.91) * 0.25) * uSwayAmp * hMask * gust;
        transformed.y += sin(tW * 1.45) * (uSwayAmp * 0.18) * hMask;`,
      );
  };
  cloned.customProgramCacheKey = () => `botanical_wind_${swayAmp}_${swaySpeed}_${minHeight}`;
  return cloned;
}

function cloneBakedGeometry(mesh, rootInverseMatrix) {
  const geo = mesh.geometry.clone();
  const relMat = new THREE.Matrix4().multiplyMatrices(rootInverseMatrix, mesh.matrixWorld);
  geo.applyMatrix4(relMat);
  return geo;
}

export function createCityBotanicalFoliage(parent, renderer = null) {
  const root = new THREE.Group();
  root.name = 'KhulnaCity_BotanicalFoliage_Instanced';
  root.matrixAutoUpdate = false;
  root.updateMatrix();
  parent.add(root);

  const windUniform = { value: 0 };
  const placements = {
    shadeA: [],
    shadeB: [],
    norfolk: [],
    bush: [],
    palm: [],
  };

  let built = false;
  let qualityMode = 'high';
  const builtMeshes = []; // { mesh, isTrunk, isFoliage }
  const builtMaterials = [];

  function addPlacement(kind, x, y, z, scale, rotY) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    // Skip any placements directly inside Circuit House or Judge Court GLB compounds (they already have their own!)
    if (x > 84 && x < 140 && z > -716 && z < -640) return;
    if (x > 149 && x < 204 && z > -726 && z < -634) return;
    placements[kind].push({ x, y: y || 0, z, scale, rotY });
  }

  function addShadeTree(x, y = 0, z = 0, scale = 0.82, seed = 0, { withBushes = true } = {}) {
    const r1 = seeded01(seed + x * 0.17 + z * 0.23);
    const r2 = seeded01(seed * 1.9 + x * 0.31 - z * 0.13);
    const rotY = r1 * Math.PI * 2;
    const clampedScale = THREE.MathUtils.clamp(scale * (0.88 + r2 * 0.24), 0.52, 1.25);

    // Natural Khulna variety: ~46% ShadeTree A, ~42% ShadeTree B, ~12% Ornamental Norfolk Pine
    if (r2 > 0.88) {
      addPlacement('norfolk', x, y, z, clampedScale * 0.78, rotY);
    } else if (r1 < 0.52) {
      addPlacement('shadeA', x, y, z, clampedScale, rotY);
    } else {
      addPlacement('shadeB', x, y, z, clampedScale, rotY);
    }

    // Add 1 realistic swaying ornamental Circuit House bush nestled naturally near ~45% of shade trees
    if (withBushes && r2 > 0.55) {
      const ang = rotY + 1.1;
      const dist = 1.65 + r1 * 0.85;
      addPlacement('bush', x + Math.cos(ang) * dist, y, z + Math.sin(ang) * dist, 0.44 + r1 * 0.22, rotY * 1.3);
    }
  }

  function addNorfolkPine(x, y = 0, z = 0, scale = 0.68, seed = 0) {
    const r = seeded01(seed + x * 0.19 + z * 0.29);
    addPlacement('norfolk', x, y, z, THREE.MathUtils.clamp(scale * (0.90 + r * 0.20), 0.45, 1.05), r * Math.PI * 2);
  }

  function addBush(x, y = 0, z = 0, scale = 0.56, seed = 0) {
    const r = seeded01(seed + x * 0.27 + z * 0.11);
    addPlacement('bush', x, y, z, THREE.MathUtils.clamp(scale * (0.86 + r * 0.28), 0.28, 1.05), r * Math.PI * 2);
  }

  function addPalm(x, y = 0, z = 0, height = 7.8, seed = 0) {
    const r = seeded01(seed + x * 0.13 + z * 0.37);
    // Circuit House GLB Palm is ~13.6m tall at scale 1.0
    const scale = THREE.MathUtils.clamp((height / 13.6) * (0.92 + r * 0.16), 0.46, 1.15);
    addPlacement('palm', x, y, z, scale, r * Math.PI * 2);
  }

  function applyQuality() {
    const isLow = qualityMode === 'low';
    const aniso = isLow ? 1 : 2;
    for (let i = 0; i < builtMeshes.length; i++) {
      const entry = builtMeshes[i];
      // Whole-city frustumCulled=false instanced foliage skips shadow pass & 9-tap PCF leaf lookup (massive 60 FPS GPU boost!)
      entry.mesh.castShadow = false;
      entry.mesh.receiveShadow = false;
    }
    for (let i = 0; i < builtMaterials.length; i++) {
      const mat = builtMaterials[i];
      if (mat.map && mat.map.anisotropy !== aniso) {
        mat.map.anisotropy = aniso;
        mat.map.needsUpdate = true;
      }
    }
  }

  function buildInstancedPair(kind, trunkGeo, trunkMat, foliageGeo, foliageMat) {
    const list = placements[kind];
    if (!list || list.length === 0) return;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    const makeInst = (geo, mat, isTrunk) => {
      if (!geo || !mat) return;
      const inst = new THREE.InstancedMesh(geo, mat, list.length);
      inst.name = `KhulnaBotanical_${kind}_${isTrunk ? 'Trunk' : 'Foliage'}`;
      inst.frustumCulled = false; // Spans full city — single draw call!
      inst.matrixAutoUpdate = false;
      inst.updateMatrix();
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(0, p.rotY, 0);
        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
        if (!isTrunk) {
          // Subtle natural leaf shade variation across trees so no two look identical
          const v = 0.88 + seeded01(i * 7.3 + p.x) * 0.22;
          color.setRGB(v * 0.98, v, v * 0.96);
          inst.setColorAt(i, color);
        }
      }
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      root.add(inst);
      builtMeshes.push({ mesh: inst, isTrunk, isFoliage: !isTrunk });
    };

    makeInst(trunkGeo, trunkMat, true);
    makeInst(foliageGeo, foliageMat, false);
  }

  function extractTreePair(parentNode, swayOpts) {
    if (!parentNode) return null;
    parentNode.updateWorldMatrix(true, true);
    const invParent = parentNode.matrixWorld.clone().invert();
    let trunkMesh = null;
    let foliageMesh = null;
    parentNode.traverse((child) => {
      if (!child.isMesh) return;
      if (child.name && child.name.startsWith('FoliageSway_')) {
        foliageMesh = child;
      } else if (!trunkMesh) {
        trunkMesh = child;
      }
    });
    if (!foliageMesh) return null;

    const foliageGeo = cloneBakedGeometry(foliageMesh, invParent);
    const trunkGeo = trunkMesh ? cloneBakedGeometry(trunkMesh, invParent) : null;

    // Normalize ground pivot cleanly to y = 0
    const bbox = new THREE.Box3();
    if (trunkGeo) {
      trunkGeo.computeBoundingBox();
      bbox.union(trunkGeo.boundingBox);
    }
    foliageGeo.computeBoundingBox();
    bbox.union(foliageGeo.boundingBox);

    const cx = (bbox.min.x + bbox.max.x) * 0.5;
    const cz = (bbox.min.z + bbox.max.z) * 0.5;
    const minY = Number.isFinite(bbox.min.y) ? bbox.min.y : 0;

    // Only center XZ for bush (trees already have trunk anchored at local 0,0)
    const shiftX = swayOpts.centerXZ ? -cx : 0;
    const shiftZ = swayOpts.centerXZ ? -cz : 0;
    const shiftY = -minY;
    if (Math.abs(shiftX) > 1e-4 || Math.abs(shiftY) > 1e-4 || Math.abs(shiftZ) > 1e-4) {
      foliageGeo.translate(shiftX, shiftY, shiftZ);
      if (trunkGeo) trunkGeo.translate(shiftX, shiftY, shiftZ);
    }

    const trunkMat = trunkMesh ? (Array.isArray(trunkMesh.material) ? trunkMesh.material[0] : trunkMesh.material).clone() : null;
    if (trunkMat) {
      trunkMat.envMapIntensity = 0.35;
      builtMaterials.push(trunkMat);
    }
    const rawFolMat = Array.isArray(foliageMesh.material) ? foliageMesh.material[0] : foliageMesh.material;
    const foliageMat = applyBotanicalWindShader(rawFolMat, windUniform, swayOpts);
    builtMaterials.push(foliageMat);

    return { trunkGeo, trunkMat, foliageGeo, foliageMat };
  }

  function ingestCircuitHouseGLB(gltfScene) {
    if (built || !gltfScene) return;
    built = true;
    gltfScene.updateMatrixWorld(true);

    // 1) Find prototype parent groups inside khulna_circuit_house.glb
    const shadeParents = [];
    let norfolkParent = null;
    let palmParent = null;
    let bushFoliageNode = null;
    let bushCoreNode = null;

    gltfScene.traverse((obj) => {
      if (obj.name === 'Norfolk_Island_Pine_Tree' && !norfolkParent) {
        norfolkParent = obj;
      } else if (obj.name === 'FoliageSway_ShadeTree' && obj.parent && shadeParents.length < 2) {
        if (!shadeParents.includes(obj.parent)) shadeParents.push(obj.parent);
      } else if (obj.name === 'FoliageSway_Palm' && obj.parent && !palmParent) {
        palmParent = obj.parent;
      } else if (obj.name === 'FoliageSway_Bush' && !bushFoliageNode) {
        bushFoliageNode = obj;
      }
    });

    // Find matching core mesh right before FoliageSway_Bush inside Circular_Garden_Island
    if (bushFoliageNode && bushFoliageNode.parent) {
      const siblings = bushFoliageNode.parent.children;
      const bIdx = siblings.indexOf(bushFoliageNode);
      if (bIdx > 0 && siblings[bIdx - 1]?.isMesh) {
        bushCoreNode = siblings[bIdx - 1];
      }
    }

    const protoShadeA = extractTreePair(shadeParents[0], { swayAmp: 0.16, swaySpeed: 1.25, minHeight: 3.0 });
    const protoShadeB = extractTreePair(shadeParents[1] || shadeParents[0], { swayAmp: 0.16, swaySpeed: 1.32, minHeight: 3.0 });
    const protoNorfolk = extractTreePair(norfolkParent, { swayAmp: 0.18, swaySpeed: 1.18, minHeight: 1.2 });
    const protoPalm = extractTreePair(palmParent, { swayAmp: 0.22, swaySpeed: 1.45, minHeight: 8.5 });

    // Extract ornamental swaying bush (FoliageSway_Bush + optional inner core)
    let protoBush = null;
    if (bushFoliageNode && bushFoliageNode.isMesh) {
      bushFoliageNode.updateWorldMatrix(true, false);
      const invId = new THREE.Matrix4();
      const fGeo = cloneBakedGeometry(bushFoliageNode, invId);
      const cGeo = bushCoreNode ? cloneBakedGeometry(bushCoreNode, invId) : null;
      fGeo.computeBoundingBox();
      const bb = fGeo.boundingBox.clone();
      if (cGeo) { cGeo.computeBoundingBox(); bb.union(cGeo.boundingBox); }
      const cx = (bb.min.x + bb.max.x) * 0.5;
      const cz = (bb.min.z + bb.max.z) * 0.5;
      const minY = bb.min.y;
      fGeo.translate(-cx, -minY, -cz);
      if (cGeo) cGeo.translate(-cx, -minY, -cz);

      const rawFMat = Array.isArray(bushFoliageNode.material) ? bushFoliageNode.material[0] : bushFoliageNode.material;
      const fMat = applyBotanicalWindShader(rawFMat, windUniform, { swayAmp: 0.085, swaySpeed: 1.55, minHeight: 0.12 });
      builtMaterials.push(fMat);
      let cMat = null;
      if (bushCoreNode) {
        cMat = (Array.isArray(bushCoreNode.material) ? bushCoreNode.material[0] : bushCoreNode.material).clone();
        cMat.envMapIntensity = 0.28;
        builtMaterials.push(cMat);
      }
      protoBush = { trunkGeo: cGeo, trunkMat: cMat, foliageGeo: fGeo, foliageMat: fMat };
    }

    if (protoShadeA) buildInstancedPair('shadeA', protoShadeA.trunkGeo, protoShadeA.trunkMat, protoShadeA.foliageGeo, protoShadeA.foliageMat);
    if (protoShadeB) buildInstancedPair('shadeB', protoShadeB.trunkGeo, protoShadeB.trunkMat, protoShadeB.foliageGeo, protoShadeB.foliageMat);
    if (protoNorfolk) buildInstancedPair('norfolk', protoNorfolk.trunkGeo, protoNorfolk.trunkMat, protoNorfolk.foliageGeo, protoNorfolk.foliageMat);
    if (protoBush) buildInstancedPair('bush', protoBush.trunkGeo, protoBush.trunkMat, protoBush.foliageGeo, protoBush.foliageMat);
    if (protoPalm) buildInstancedPair('palm', protoPalm.trunkGeo, protoPalm.trunkMat, protoPalm.foliageGeo, protoPalm.foliageMat);

    applyQuality();

    // Warm-upload the shared botanical leaf/bark textures immediately so zero stutter!
    if (renderer && typeof renderer.initTexture === 'function') {
      const seen = new Set();
      for (const mat of builtMaterials) {
        for (const t of [mat.map, mat.normalMap, mat.roughnessMap]) {
          if (t && !seen.has(t)) {
            seen.add(t);
            try { renderer.initTexture(t); } catch {}
          }
        }
      }
    }
  }

  function setQualityMode(q = 'high') {
    qualityMode = q;
    if (built) applyQuality();
  }

  function update(time) {
    windUniform.value = time;
  }

  return {
    root,
    addShadeTree,
    addNorfolkPine,
    addBush,
    addPalm,
    ingestCircuitHouseGLB,
    setQualityMode,
    update,
  };
}
