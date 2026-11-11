import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Ground offset so bottom of shoes (-1.26) rests at y = 0.0 (total height = 1.76m)
const GROUND_OFFSET_Y = 1.26;

function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Extracts the exact organic thigh contour & trouser UVs from character-source.glb
 * at y = -0.45 and lofts seamless full-length black trousers down to the ankles (y = -1.16),
 * plus tucked-in bottom cap handling so there is zero seam.
 */
function buildSeamlessTrouserGeometry(sourceGeo) {
  const posAttr = sourceGeo.attributes.position;
  const normAttr = sourceGeo.attributes.normal;
  const uvAttr = sourceGeo.attributes.uv;
  const vCount = posAttr.count;

  const leftSamples = [];
  const rightSamples = [];

  let leftSumX = 0, leftSumZ = 0, leftN = 0;
  let rightSumX = 0, rightSumZ = 0, rightN = 0;

  for (let i = 0; i < vCount; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const ny = normAttr.getY(i);
    const u = uvAttr.getX(i);
    const v = uvAttr.getY(i);

    // Never include sculpted arms/hands/fingers (which have |x| > 0.120 and u < 0.042 in the skin/cuff patches)
    const isSculptedArm = Math.abs(x) > 0.120 && u < 0.042 && ((v > 0.085 && v < 0.275) || (v > 0.680 && v < 0.718));
    if (isSculptedArm) continue;

    if (Math.abs(x) <= 0.172 && y >= -0.465 && y <= -0.425 && Math.abs(ny) < 0.5) {
      if (x < -0.01) {
        leftSumX += x;
        leftSumZ += z;
        leftN++;
      } else if (x > 0.01) {
        rightSumX += x;
        rightSumZ += z;
        rightN++;
      }
    }
  }

  const leftCenter = {
    x: leftN ? leftSumX / leftN : -0.104,
    z: leftN ? leftSumZ / leftN : 0.002,
  };
  const rightCenter = {
    x: rightN ? rightSumX / rightN : 0.106,
    z: rightN ? rightSumZ / rightN : 0.012,
  };

  for (let i = 0; i < vCount; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const ny = normAttr.getY(i);
    const u = uvAttr.getX(i);
    const v = uvAttr.getY(i);

    // Never sample or squash sculpted arms/hands/fingers!
    const isSculptedArm = Math.abs(x) > 0.120 && u < 0.042 && ((v > 0.085 && v < 0.275) || (v > 0.680 && v < 0.718));
    if (isSculptedArm) continue;

    if (Math.abs(x) <= 0.172 && y >= -0.468 && y <= -0.422 && Math.abs(ny) < 0.55) {
      if (x < -0.01) {
        const dx = x - leftCenter.x;
        const dz = z - leftCenter.z;
        leftSamples.push({ angle: Math.atan2(dz, dx), r: Math.hypot(dx, dz), u, v });
      } else if (x > 0.01) {
        const dx = x - rightCenter.x;
        const dz = z - rightCenter.z;
        rightSamples.push({ angle: Math.atan2(dz, dx), r: Math.hypot(dx, dz), u, v });
      }
    }

    // Smoothly taper the original scan's lower thigh stump (below y = -0.365) inside the seamless trouser mesh so triangles never twist or poke through
    if (y < -0.365) {
      const cx = x < 0 ? leftCenter.x : rightCenter.x;
      const cz = x < 0 ? leftCenter.z : rightCenter.z;
      const tuck = 1.0 - smoothstep(-0.425, -0.365, y);
      const shrink = 1.0 - 0.45 * tuck;
      posAttr.setXYZ(
        i,
        cx + (x - cx) * shrink,
        Math.max(y, -0.440),
        cz + (z - cz) * shrink
      );
    }
  }
  posAttr.needsUpdate = true;

  function sampleContour(samples, theta, fallbackR = 0.095) {
    if (!samples.length) return { r: fallbackR, u: 0.11, v: 0.83 };
    let bestDiff = Infinity;
    let best = samples[0];
    let sumR = 0;
    let weightSum = 0;
    for (const s of samples) {
      let diff = Math.abs(theta - s.angle);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff < bestDiff) {
        bestDiff = diff;
        best = s;
      }
      if (diff < 0.38) {
        const w = 1 / (diff + 0.04);
        sumR += s.r * w;
        weightSum += w;
      }
    }
    return {
      r: weightSum > 0 ? sumR / weightSum : best.r,
      u: best.u,
      v: best.v,
    };
  }

  const radialSegs = 36;
  const heightSegs = 28;
  const yStart = -0.382;
  const yEnd = -1.165;

  const positions = [];
  const uvs = [];
  const indices = [];

  const legConfigs = [
    { center: leftCenter, samples: leftSamples, side: -1 },
    { center: rightCenter, samples: rightSamples, side: 1 },
  ];

  for (let legIdx = 0; legIdx < 2; legIdx++) {
    const { center, samples, side } = legConfigs[legIdx];
    const baseVertexOffset = positions.length / 3;

    // Pre-sample top contour ring around thigh
    const ringProfile = [];
    for (let j = 0; j <= radialSegs; j++) {
      const theta = (j / radialSegs) * Math.PI * 2 - Math.PI;
      ringProfile.push(sampleContour(samples, theta, 0.096));
    }

    for (let iy = 0; iy <= heightSegs; iy++) {
      const t = iy / heightSegs; // 0 at upper hip (-0.382) -> 1 at ankle cuff (-1.165)
      const y = THREE.MathUtils.lerp(yStart, yEnd, t);

      // Tailored straight-fit men's trouser profile (gentle 18% taper from thigh to ankle hem)
      const taper = 1.0 - 0.18 * Math.pow(t, 0.90);
      const kneeBulge = Math.exp(-Math.pow((t - 0.44) / 0.15, 2)) * 0.035;
      const calfBulge = Math.exp(-Math.pow((t - 0.68) / 0.18, 2)) * 0.048;
      const cuffBreak = Math.exp(-Math.pow((t - 0.93) / 0.07, 2)) * 0.032;

      for (let j = 0; j <= radialSegs; j++) {
        const theta = (j / radialSegs) * Math.PI * 2 - Math.PI;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        const prof = ringProfile[j];

        // Smooth tailored trouser oval with natural upper inner-thigh fullness & flush outer-hip join
        const innerDir = Math.max(0, -side * cosT);
        const outerDir = Math.max(0, side * cosT);
        const innerThighFill = innerDir * (1.0 - smoothstep(0.0, 0.38, t)) * 0.015;
        const outerHipTuck = outerDir * (1.0 - smoothstep(0.0, 0.22, t)) * 0.022;
        const ovalR = 0.097 * Math.sqrt(Math.pow(cosT * 0.95, 2) + Math.pow(sinT * 1.06, 2)) + innerThighFill - outerHipTuck;
        const clampedProfR = THREE.MathUtils.clamp(prof.r, 0.088, 0.106) + innerThighFill - outerHipTuck;
        const baseR = THREE.MathUtils.lerp(clampedProfR, ovalR, smoothstep(0.0, 0.26, t));

        // Subtle vertical drape & knee/ankle break folds
        const clothFold = Math.sin(t * Math.PI * 8 + cosT * 2.0) * 0.0022 * smoothstep(0.12, 0.90, t);
        const directionalShape = (sinT < 0 ? -sinT * calfBulge : sinT * kneeBulge) + cuffBreak;

        const r = baseR * taper * (1 + directionalShape) + clothFold;
        // Smoothly align upper thigh with the 0.165m pelvis wall at t=0
        const centerX = center.x * (1.0 - 0.12 * (1.0 - smoothstep(0.0, 0.26, t)));
        const centerZ = center.z - Math.sin(t * Math.PI) * 0.006;

        const vx = centerX + cosT * r;
        const vz = centerZ + sinT * r;

        positions.push(vx, y, vz);
        // Contiguous cylindrical UVs inside the shaded charcoal-black trouser fabric patch
        const trouserU = 0.008 + (j / radialSegs) * 0.026;
        const trouserV = 0.860 + t * 0.080;
        uvs.push(trouserU, trouserV);
      }
    }

    const ringStride = radialSegs + 1;
    for (let iy = 0; iy < heightSegs; iy++) {
      for (let j = 0; j < radialSegs; j++) {
        const a = baseVertexOffset + iy * ringStride + j;
        const b = a + ringStride;
        const c = b + 1;
        const d = a + 1;
        indices.push(a, d, b, b, d, c);
      }
    }
  }

  const trouserGeo = new THREE.BufferGeometry();
  trouserGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  trouserGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  trouserGeo.setIndex(indices);
  trouserGeo.computeVertexNormals();

  return { trouserGeo, leftCenter, rightCenter };
}

/**
 * Builds sculpted 3D leather/mesh sneakers at the ankles (y = -1.15 to -1.26)
 */
function buildSculptedSneakers(leftCenter, rightCenter) {
  const shoeGroup = new THREE.Group();
  const upperMat = new THREE.MeshStandardMaterial({ color: 0x191b1f, roughness: 0.55, metalness: 0.08 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x2c3038, roughness: 0.48 });
  const soleMat = new THREE.MeshStandardMaterial({ color: 0xefede8, roughness: 0.65 });

  for (const [cx, cz] of [[leftCenter.x, leftCenter.z], [rightCenter.x, rightCenter.z]]) {
    // Ankle sock/collar tucking smoothly inside trouser hem
    const ankle = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.08, 18), upperMat);
    ankle.position.set(cx, -1.16, cz - 0.005);
    shoeGroup.add(ankle);

    // Sculpted shoe upper (rounded toe box + instep arch)
    const upperGeo = new THREE.SphereGeometry(0.068, 22, 16);
    const uPos = upperGeo.attributes.position;
    for (let i = 0; i < uPos.count; i++) {
      let x = uPos.getX(i);
      let y = uPos.getY(i);
      let z = uPos.getZ(i);
      x *= 0.92;
      y = y < 0 ? y * 0.35 : y * 0.72;
      z = z > 0 ? z * 1.95 : z * 1.05;
      if (z > 0.04) y -= (z - 0.04) * 0.22; // sleek tapered toe slope
      uPos.setXYZ(i, x, y, z);
    }
    upperGeo.computeVertexNormals();
    const upperMesh = new THREE.Mesh(upperGeo, upperMat);
    upperMesh.position.set(cx, -1.205, cz + 0.015);
    shoeGroup.add(upperMesh);

    // Tongue & lace saddle accent
    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.028, 0.075), accentMat);
    tongue.position.set(cx, -1.178, cz + 0.042);
    tongue.rotation.x = 0.42;
    shoeGroup.add(tongue);

    // Crisp white contoured rubber midsole/outsole
    const soleGeo = new THREE.CylinderGeometry(0.062, 0.065, 0.028, 24);
    soleGeo.scale(0.96, 1, 1.62);
    const soleMesh = new THREE.Mesh(soleGeo, soleMat);
    soleMesh.position.set(cx, -1.244, cz + 0.036);
    shoeGroup.add(soleMesh);
  }

  return shoeGroup;
}

/**
 * Applies smooth skeletal skinning weights to the combined body+trouser geometry
 * so the real 3D human mesh can walk, run, breathe, turn its head, and fight!
 */
function rigUnifiedHumanGeometry(geometry, leftCenter, rightCenter) {
  // Bone indices:
  // 0: Hips (0, -0.32, 0)
  // 1: Spine (0, -0.05, 0)
  // 2: Neck (0, 0.20, 0)
  // 3: Head (0, 0.28, 0)
  // 4: LeftArm / shoulder (-0.195, 0.12, -0.02)
  // 5: RightArm / shoulder (0.195, 0.12, -0.02)
  // 6: LeftUpLeg (leftCenter.x, -0.35, leftCenter.z)
  // 7: LeftLeg (leftCenter.x, -0.76, leftCenter.z)
  // 8: RightUpLeg (rightCenter.x, -0.35, rightCenter.z)
  // 9: RightLeg (rightCenter.x, -0.76, rightCenter.z)
  // 10: LeftForeArm / elbow (-0.240, -0.17, -0.025)
  // 11: RightForeArm / elbow (0.242, -0.17, -0.025)

  const pos = geometry.attributes.position;
  const uvAttr = geometry.attributes.uv;
  const count = pos.count;
  const skinIndices = new Uint16Array(count * 4);
  const skinWeights = new Float32Array(count * 4);

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = uvAttr ? uvAttr.getX(i) : 1;
    const v = uvAttr ? uvAttr.getY(i) : 0;

    // UV tags baked in character-source.glb:
    // - v > 1.5: 100% of 3D scanned forearm, wrist, palm, thumb & 5 fingers
    // - u >= 0.5 && v <= 1.5: 3D scanned waistband, trousers & sneakers
    // - y >= -0.052 && Math.abs(x) > 0.162 (with u < 0.5): outer polo shirt short sleeves (severed from waist so zero cloth stretches)
    const isScannedArm = v > 1.5;
    const isScannedLower = u >= 0.5 && v <= 1.5;
    const isSleeve = !isScannedLower && !isScannedArm && y >= -0.052 && Math.abs(x) > 0.162;

    let i0 = 0, i1 = 1, i2 = 0, i3 = 0;
    let w0 = 1, w1 = 0, w2 = 0, w3 = 0;

    if (!isScannedLower && !isScannedArm && !isSleeve && y > 0.17) {
      // Neck & Head region
      const headFactor = smoothstep(0.19, 0.26, y);
      const neckFactor = smoothstep(0.16, 0.21, y) * (1 - headFactor);
      const spineFactor = Math.max(0, 1 - headFactor - neckFactor);
      i0 = 3; w0 = headFactor;
      i1 = 2; w1 = neckFactor;
      i2 = 1; w2 = spineFactor;
    } else if (isScannedArm || isSleeve) {
      // Shirt sleeve (upper arm) OR 3D scanned human forearm + wrist + palm + 5 fingers
      const isLeft = x < 0;
      const upperArmBone = isLeft ? 4 : 5;
      const foreArmBone = isLeft ? 10 : 11;

      let shoulderBlend;
      let elbowBlend;
      if (isScannedArm) {
        shoulderBlend = 1.0;
        // Smooth anatomical elbow transition around y = -0.105 below the short-sleeve cuff
        elbowBlend = 1.0 - smoothstep(-0.145, -0.065, y);
      } else {
        // Outer sleeve: soft taper into the torso at the armpit/shoulder seam so the shirt never tears
        shoulderBlend = smoothstep(0.165, 0.215, Math.abs(x)) * (1.0 - 0.35 * smoothstep(0.06, 0.16, y));
        elbowBlend = 0.0;
      }

      i0 = upperArmBone; w0 = shoulderBlend * (1.0 - elbowBlend);
      i1 = foreArmBone;  w1 = shoulderBlend * elbowBlend;
      i2 = 1;            w2 = 1.0 - shoulderBlend;
    } else if (!isScannedLower && y >= -0.34) {
      // Upper Torso / Spine vs Hips
      const spineW = smoothstep(-0.31, -0.08, y);
      i0 = 1; w0 = spineW;
      i1 = 0; w1 = 1 - spineW;
    } else {
      // 3D Scanned Pelvis, Trousers & Laced Sneakers (isScannedLower)
      const hipBlend = 1 - smoothstep(-0.39, -0.32, y); // 0 at waist, 1 below hip
      const kneeBlend = 1 - smoothstep(-0.82, -0.68, y); // 0 above knee, 1 below knee (including sneakers)
      const isLeft = x < 0;
      const upLegBone = isLeft ? 6 : 8;
      const lowLegBone = isLeft ? 7 : 9;

      const wHips = 1 - hipBlend;
      const wLowLeg = hipBlend * kneeBlend;
      const wUpLeg = hipBlend * (1 - kneeBlend);

      i0 = upLegBone;  w0 = wUpLeg;
      i1 = lowLegBone; w1 = wLowLeg;
      i2 = 0;          w2 = wHips;
    }

    const sum = w0 + w1 + w2 + w3 || 1;
    const base = i * 4;
    skinIndices[base] = i0;
    skinIndices[base + 1] = i1;
    skinIndices[base + 2] = i2;
    skinIndices[base + 3] = i3;
    skinWeights[base] = w0 / sum;
    skinWeights[base + 1] = w1 / sum;
    skinWeights[base + 2] = w2 / sum;
    skinWeights[base + 3] = w3 / sum;
  }

  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
}

export function createPlayerCharacter(scene, manager) {
  const root = new THREE.Group();
  root.name = 'PlayerCharacter';
  scene.add(root);

  const modelRoot = new THREE.Group();
  modelRoot.position.set(0, GROUND_OFFSET_Y, 0);
  root.add(modelRoot);

  // Create the 12-bone humanoid skeleton (with articulated LeftForeArm & RightForeArm elbows)
  const hipsBone = new THREE.Bone();      hipsBone.position.set(0, -0.32, 0);
  const spineBone = new THREE.Bone();     spineBone.position.set(0, 0.27, 0);          // world y = -0.05
  const neckBone = new THREE.Bone();      neckBone.position.set(0, 0.25, 0);           // world y = +0.20
  const headBone = new THREE.Bone();      headBone.position.set(0, 0.08, 0);           // world y = +0.28
  const leftArmBone = new THREE.Bone();   leftArmBone.position.set(-0.195, 0.17, -0.02);// world y = +0.12
  const rightArmBone = new THREE.Bone();  rightArmBone.position.set(0.195, 0.17, -0.02);// world y = +0.12
  const leftUpLeg = new THREE.Bone();     leftUpLeg.position.set(-0.104, -0.03, 0);    // world y = -0.35
  const leftLeg = new THREE.Bone();       leftLeg.position.set(0, -0.41, 0);           // world y = -0.76
  const rightUpLeg = new THREE.Bone();    rightUpLeg.position.set(0.106, -0.03, 0);    // world y = -0.35
  const rightLeg = new THREE.Bone();      rightLeg.position.set(0, -0.41, 0);           // world y = -0.76
  const leftForeArm = new THREE.Bone();   leftForeArm.position.set(-0.035, -0.235, -0.008); // elbow world (-0.230, -0.115, -0.028)
  const rightForeArm = new THREE.Bone();  rightForeArm.position.set(0.038, -0.235, -0.008); // elbow world (+0.233, -0.115, -0.028)

  hipsBone.add(spineBone, leftUpLeg, rightUpLeg);
  spineBone.add(neckBone, leftArmBone, rightArmBone);
  neckBone.add(headBone);
  leftArmBone.add(leftForeArm);
  rightArmBone.add(rightForeArm);
  leftUpLeg.add(leftLeg);
  rightUpLeg.add(rightLeg);

  const bones = [
    hipsBone, spineBone, neckBone, headBone,
    leftArmBone, rightArmBone,
    leftUpLeg, leftLeg, rightUpLeg, rightLeg,
    leftForeArm, rightForeArm,
  ];
  const skeleton = new THREE.Skeleton(bones);

  // Attach sneaker meshes directly to the lower leg bones so they move with every step & kick!
  const leftShoeHolder = new THREE.Group();
  leftShoeHolder.position.set(0.104, 0.76, 0);
  leftLeg.add(leftShoeHolder);

  const rightShoeHolder = new THREE.Group();
  rightShoeHolder.position.set(-0.106, 0.76, 0);
  rightLeg.add(rightShoeHolder);

  const state = {
    loaded: false,
    cameraMode: 'back',
    thirdPerson: true,
    studioAnim: 'idle', // 'idle', 'walk', 'run', 'jump', 'fight', or emote name
    straightGaze: true, // true = faces straight forward (baked in GLB), false = original side photo pose
    expression: 'normal',
    attackTimer: 0,
    attackType: 0,
    emote: null,        // 'dance1' | 'dance2' | 'wave' | 'kick' | 'combo' | 'flex' | null
    emoteTimer: 0,
    emoteClock: 0,
    walkCycle: 0,
    facingYaw: 0,       // Smooth world-space character facing angle in 3rd-person game mode
  };

  function lerpAngle(current, target, t) {
    let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return current + diff * t;
  }

  let charSkinnedMesh = null;
  let stdMat = null;
  let lowMat = null;
  let currentQuality = 'high';

  function setQualityMode(nextQuality) {
    currentQuality = nextQuality;
    if (!charSkinnedMesh || !stdMat || !lowMat) return;
    const isLow = nextQuality === 'low';
    charSkinnedMesh.material = isLow ? lowMat : stdMat;
    charSkinnedMesh.castShadow = !isLow;
    charSkinnedMesh.receiveShadow = !isLow;
  }

  const loader = new GLTFLoader(manager);
  loader.load('/assets/character-source.glb?v=photoreal3', (gltf) => {
    let sourceMesh = null;
    gltf.scene.traverse((child) => {
      if (child.isMesh && !sourceMesh) sourceMesh = child;
    });
    if (!sourceMesh) return;

    const unifiedGeo = sourceMesh.geometry.clone();
    // Rotate so character faces +Z, +Y is Up, -X is Left, +X is Right
    unifiedGeo.rotateY(-Math.PI / 2);
    unifiedGeo.computeVertexNormals();

    const leftCenter = new THREE.Vector3(-0.095, -0.35, 0);
    const rightCenter = new THREE.Vector3(0.095, -0.35, 0);

    // Rig the unified full-body 3D scanned human geometry (including scanned trousers & sneakers) to our 12-bone skeleton
    rigUnifiedHumanGeometry(unifiedGeo, leftCenter, rightCenter);

    const mat = sourceMesh.material.clone();
    if (mat.map) {
      mat.map.wrapS = THREE.RepeatWrapping;
      mat.map.wrapT = THREE.RepeatWrapping;
      mat.map.anisotropy = 16;
      mat.map.minFilter = THREE.LinearMipmapLinearFilter;
      mat.map.magFilter = THREE.LinearFilter;
      mat.map.needsUpdate = true;
      mat.bumpMap = mat.map;
      mat.bumpScale = 0.0018;
    }
    mat.roughness = 0.68;
    mat.metalness = 0.04;
    mat.side = THREE.DoubleSide;
    stdMat = mat;

    // Ultra-fast per-vertex lit material for Low (Smooth · No GPU) mode
    lowMat = new THREE.MeshLambertMaterial({
      map: mat.map,
      side: THREE.DoubleSide,
    });

    const skinnedMesh = new THREE.SkinnedMesh(unifiedGeo, stdMat);
    skinnedMesh.castShadow = true;
    skinnedMesh.receiveShadow = true;
    skinnedMesh.frustumCulled = false;
    skinnedMesh.add(hipsBone);
    skinnedMesh.bind(skeleton);
    modelRoot.add(skinnedMesh);
    charSkinnedMesh = skinnedMesh;
    setQualityMode(currentQuality);

    state.loaded = true;
  });

  function setExpression(nextExpr) {
    state.expression = nextExpr;
  }

  function cycleCameraMode() {
    if (state.cameraMode === 'back') state.cameraMode = 'front';
    else if (state.cameraMode === 'front') state.cameraMode = 'first';
    else state.cameraMode = 'back';
    state.thirdPerson = state.cameraMode !== 'first';
    return state.cameraMode;
  }

  function triggerAttack(kind = null) {
    state.emote = null;
    state.emoteTimer = 0;
    if (state.attackTimer > 0.16) return;
    state.attackType = kind !== null ? kind : (state.attackType + 1) % 3;
    state.attackTimer = 0.48;
  }

  function triggerEmote(emoteName, cameraYaw = null) {
    if (!emoteName || (state.emote === emoteName && state.emoteTimer > 0.5)) {
      state.emote = null;
      state.emoteTimer = 0;
      return null;
    }
    state.emote = emoteName;
    state.emoteClock = 0;
    state.attackTimer = 0;
    // Dances last 8s in-game (or loop in Studio); pocket style pose stays for 35s until toggled/moved
    const durations = {
      dance1: 8.0,
      dance2: 8.0,
      wave: 3.0,
      kick: 1.4,
      combo: 2.6,
      flex: 3.6,
      pocket: 35.0,
    };
    state.emoteTimer = durations[emoteName] || 4.0;
    if (cameraYaw !== null && state.cameraMode === 'back') {
      // Turn character toward the camera so the player sees his face & front body during the emote!
      state.facingYaw = cameraYaw;
    }
    return state.emote;
  }

  function resetPoseBones() {
    hipsBone.position.set(0, -0.32, 0);
    hipsBone.rotation.set(0, 0, 0);
    spineBone.rotation.set(0, 0, 0);
    neckBone.rotation.set(0, 0, 0);
    headBone.rotation.set(0, 0, 0);
    leftArmBone.rotation.set(0, 0, 0);
    rightArmBone.rotation.set(0, 0, 0);
    leftForeArm.rotation.set(0, 0, 0);
    rightForeArm.rotation.set(0, 0, 0);
    leftUpLeg.rotation.set(0, 0, 0);
    leftLeg.rotation.set(0, 0, 0);
    rightUpLeg.rotation.set(0, 0, 0);
    rightLeg.rotation.set(0, 0, 0);
  }

  function update(delta, {
    position,
    yaw = 0,
    speed = 0,
    maxSpeed = 4.35,
    grounded = true,
    isSprinting = false,
    moveDirX = 0,
    moveDirZ = 0,
    inStudio = false,
  }) {
    resetPoseBones();

    // Determine active animation parameters (from Studio controls or live gameplay)
    let animSpeed = speed;
    let sprinting = isSprinting;
    let onGround = grounded;
    let activeEmote = state.emote;

    if (inStudio) {
      root.position.set(0, 0, 0);
      root.rotation.y = 0;
      root.visible = true;

      if (state.studioAnim === 'walk') {
        animSpeed = 4.2;
        sprinting = false;
        activeEmote = null;
      } else if (state.studioAnim === 'run') {
        animSpeed = 7.2;
        sprinting = true;
        activeEmote = null;
      } else if (state.studioAnim === 'jump') {
        animSpeed = 3.0;
        onGround = false;
        activeEmote = null;
      } else if (state.studioAnim === 'fight') {
        animSpeed = 0;
        activeEmote = null;
        if (state.attackTimer <= 0.02) triggerAttack();
      } else if (['dance1', 'dance2', 'wave', 'kick', 'combo', 'flex', 'pocket'].includes(state.studioAnim)) {
        animSpeed = 0;
        activeEmote = state.studioAnim;
      } else {
        animSpeed = 0;
      }
    } else {
      root.position.set(position.x, position.y - 1.68, position.z);
      root.visible = state.thirdPerson;

      // Cancel emote if player starts walking/running or jumping
      if (speed > 0.45 || !grounded) {
        state.emote = null;
        state.emoteTimer = 0;
        activeEmote = null;
      }

      if (state.cameraMode === 'front') {
        // In Front-Face mode, always face directly at the front camera
        state.facingYaw = yaw + Math.PI;
      } else if (speed > 0.22 && (Math.abs(moveDirX) > 0.01 || Math.abs(moveDirZ) > 0.01)) {
        // Smoothly rotate character to face his actual movement direction!
        // Pressing S walks toward the camera (showing his face), A/D shows side profile, W walks forward.
        const targetMoveYaw = Math.atan2(moveDirX, moveDirZ);
        state.facingYaw = lerpAngle(state.facingYaw, targetMoveYaw, Math.min(1, delta * 12.0));
      }
      root.rotation.y = state.facingYaw;
    }

    // Head Gaze & Expression Base Pose
    // Because character-source.glb now has the 3D head straightened to 0 deg, straightGaze = true uses 0.0!
    const baseHeadYaw = state.straightGaze ? 0.0 : -0.52;
    const baseHeadPitch = state.straightGaze ? 0.0 : -0.05;
    let exprPitch = 0, exprRoll = 0;
    if (state.expression === 'happy') { exprPitch = -0.04; exprRoll = 0.05; }
    else if (state.expression === 'angry') { exprPitch = 0.09; }
    else if (state.expression === 'surprised') { exprPitch = -0.07; }

    // Handle Active Emote Animation
    if (activeEmote) {
      state.emoteClock += delta;
      if (!inStudio && state.emoteTimer > 0) {
        state.emoteTimer = Math.max(0, state.emoteTimer - delta);
        if (state.emoteTimer <= 0) {
          state.emote = null;
        }
      }
      const t = state.emoteClock;

      // Shared boxing guard (fists up in front of the chin)
      const setGuard = (side, amount = 1) => {
        if (side === 'left') {
          leftArmBone.rotation.x = -0.55 * amount;
          leftArmBone.rotation.z = -0.22 * amount;
          leftForeArm.rotation.x = -2.0 * amount;
          leftForeArm.rotation.z = 0.32 * amount;
        } else {
          rightArmBone.rotation.x = -0.55 * amount;
          rightArmBone.rotation.z = 0.22 * amount;
          rightForeArm.rotation.x = -2.0 * amount;
          rightForeArm.rotation.z = -0.32 * amount;
        }
      };

      if (activeEmote === 'pocket') {
        // [P] / [7] Hands in Pockets Cool Style Pose (হাত পকেটে স্টাইল)
        const blend = smoothstep(0.0, 0.45, t);
        const breathe = Math.sin(t * 2.4);
        const sway = Math.sin(t * 1.3);

        hipsBone.position.y = -0.32 + breathe * 0.005;
        hipsBone.position.x = sway * 0.014 * blend;
        hipsBone.rotation.y = sway * 0.045 * blend;
        spineBone.rotation.x = -0.038 * blend + breathe * 0.008;
        spineBone.rotation.z = -sway * 0.028 * blend;

        // Elbows flare slightly back & out, forearms fold inward so the hands rest naturally at the front trouser pockets
        leftArmBone.rotation.x = 0.14 * blend;
        leftArmBone.rotation.z = -0.09 * blend;
        leftForeArm.rotation.x = -0.34 * blend;
        leftForeArm.rotation.z = 0.50 * blend;

        rightArmBone.rotation.x = 0.14 * blend;
        rightArmBone.rotation.z = 0.09 * blend;
        rightForeArm.rotation.x = -0.34 * blend;
        rightForeArm.rotation.z = -0.50 * blend;

        // Relaxed contrapposto leg stance
        leftUpLeg.rotation.z = 0.03 * blend;
        rightUpLeg.rotation.z = -0.03 * blend;
        rightUpLeg.rotation.x = -0.05 * blend;
        rightLeg.rotation.x = 0.09 * blend;

        headBone.rotation.y = baseHeadYaw + sway * 0.08 * blend;
        headBone.rotation.x = baseHeadPitch - 0.025 * blend + breathe * 0.012;
        headBone.rotation.z = 0.04 * blend;
        return;
      }

      if (activeEmote === 'dance1') {
        // [1] Hip-Hop Groove Dance (হিপ-হপ নাচ)
        const beat = t * 6.8;
        const bounce = Math.abs(Math.sin(beat)) * 0.05;
        const sway = Math.sin(beat * 0.5);
        hipsBone.position.y = -0.32 - bounce;
        hipsBone.position.x = sway * 0.045;
        hipsBone.rotation.y = sway * 0.20;
        spineBone.rotation.x = 0.06 + Math.sin(beat) * 0.05;
        spineBone.rotation.z = -sway * 0.08;
        spineBone.rotation.y = -sway * 0.16;

        // Bent-elbow groove: shoulders stay within natural polo-sleeve limits, forearms pump rhythmically
        const pumpL = Math.sin(beat);
        const pumpR = -pumpL;
        leftArmBone.rotation.x = -0.32 + pumpL * 0.20;
        leftArmBone.rotation.z = -0.16 - Math.cos(beat * 0.5) * 0.05;
        leftForeArm.rotation.x = -1.45 + pumpL * 0.25;
        leftForeArm.rotation.y = 0.18;
        leftForeArm.rotation.z = 0.18;

        rightArmBone.rotation.x = -0.32 + pumpR * 0.20;
        rightArmBone.rotation.z = 0.16 + Math.cos(beat * 0.5) * 0.05;
        rightForeArm.rotation.x = -1.45 + pumpR * 0.25;
        rightForeArm.rotation.y = -0.18;
        rightForeArm.rotation.z = -0.18;

        leftUpLeg.rotation.x = -Math.max(0, sway) * 0.36 - bounce * 1.6;
        leftLeg.rotation.x = Math.max(0, sway) * 0.56 + bounce * 2.2;
        rightUpLeg.rotation.x = -Math.max(0, -sway) * 0.36 - bounce * 1.6;
        rightLeg.rotation.x = Math.max(0, -sway) * 0.56 + bounce * 2.2;

        headBone.rotation.y = baseHeadYaw + sway * 0.14;
        headBone.rotation.x = baseHeadPitch + Math.sin(beat) * 0.09;
        headBone.rotation.z = sway * 0.06;
        return;
      }

      if (activeEmote === 'dance2') {
        // [2] Bhangra / Celebration Victory Dance (ভাঙড়া / বিজয় নাচ)
        const beat = t * 8.2;
        const hop = Math.abs(Math.cos(beat)) * 0.06;
        const sideStep = Math.sin(beat * 0.5);
        hipsBone.position.y = -0.32 + hop;
        hipsBone.position.x = sideStep * 0.04;
        spineBone.rotation.y = sideStep * 0.20;
        spineBone.rotation.z = Math.sin(beat) * 0.06;

        // Both hands raised high beside the shoulders with open palms facing forward & thumbs inward!
        leftArmBone.rotation.x = -0.36 + Math.sin(beat) * 0.10;
        leftArmBone.rotation.z = -0.22;
        leftForeArm.rotation.x = -2.38 + Math.sin(beat) * 0.14;
        leftForeArm.rotation.y = 0.20;
        leftForeArm.rotation.z = -0.22 + Math.cos(beat) * 0.14;

        rightArmBone.rotation.x = -0.36 + Math.cos(beat) * 0.10;
        rightArmBone.rotation.z = 0.22;
        rightForeArm.rotation.x = -2.38 + Math.cos(beat) * 0.14;
        rightForeArm.rotation.y = -0.20;
        rightForeArm.rotation.z = 0.22 - Math.sin(beat) * 0.14;

        // Alternating knee lifts
        const leftLift = Math.max(0, Math.sin(beat * 0.5));
        const rightLift = Math.max(0, -Math.sin(beat * 0.5));
        leftUpLeg.rotation.x = -leftLift * 0.68;
        leftLeg.rotation.x = leftLift * 0.88;
        rightUpLeg.rotation.x = -rightLift * 0.68;
        rightLeg.rotation.x = rightLift * 0.88;

        headBone.rotation.y = baseHeadYaw - sideStep * 0.12;
        headBone.rotation.x = baseHeadPitch - 0.05 + Math.sin(beat) * 0.06;
        headBone.rotation.z = Math.sin(beat * 0.5) * 0.07;
        return;
      }

      if (activeEmote === 'wave') {
        // [3] Friendly Wave & Salam Greet (হাই / সালাম)
        const waveCycle = t * 8.5;
        const raise = smoothstep(0.0, 0.3, t);
        hipsBone.position.y = -0.32 + Math.sin(t * 3.0) * 0.005;
        spineBone.rotation.z = 0.025 * raise;
        spineBone.rotation.y = -0.05 * raise;

        // Hand raised cleanly out beside the right shoulder: open palm + palm lines facing forward, thumb inward, pinky outward!
        rightArmBone.rotation.x = -0.28 * raise;
        rightArmBone.rotation.y = 0.0;
        rightArmBone.rotation.z = 0.22 * raise;
        rightForeArm.rotation.x = (-2.42 + Math.sin(waveCycle) * 0.06) * raise;
        rightForeArm.rotation.y = -0.20 * raise;
        rightForeArm.rotation.z = (0.26 + Math.sin(waveCycle) * 0.22) * raise;

        leftArmBone.rotation.z = -0.025;
        leftForeArm.rotation.x = -0.08;
        headBone.rotation.y = baseHeadYaw + 0.05 * raise;
        headBone.rotation.x = baseHeadPitch + Math.sin(t * 4.5) * 0.04;
        headBone.rotation.z = -0.04 * raise;
        return;
      }

      if (activeEmote === 'kick') {
        // [4] Martial Arts Flying High Kick (ফ্লাইং লাথি)
        const phase = (t % 1.35) / 1.35;
        const strike = Math.sin(phase * Math.PI);
        const snap = Math.pow(strike, 0.75);
        hipsBone.position.y = -0.32 + strike * 0.22;
        hipsBone.rotation.y = snap * 0.36;
        spineBone.rotation.x = -snap * 0.30;
        spineBone.rotation.y = snap * 0.28;
        spineBone.rotation.z = -snap * 0.12;

        // Fists stay up in guard while kicking
        setGuard('left', 0.6 + 0.4 * snap);
        setGuard('right', 0.6 + 0.4 * snap);

        // Left support leg & Right high sweeping kick
        leftUpLeg.rotation.x = 0.18 * snap;
        leftLeg.rotation.x = 0.32 * snap;
        rightUpLeg.rotation.x = -1.60 * snap;
        rightUpLeg.rotation.z = -0.20 * snap;
        rightLeg.rotation.x = Math.max(0, (0.45 - phase) * 1.4);

        headBone.rotation.y = baseHeadYaw - snap * 0.20;
        headBone.rotation.x = baseHeadPitch + snap * 0.10;
        return;
      }

      if (activeEmote === 'combo') {
        // [5] 4-Stage Boxing & Kick Fighting Combo (মারামারি কম্বো)
        const cycle = (t % 2.4) / 2.4; // 0..1 over 2.4s
        hipsBone.position.y = -0.32 - 0.03;
        leftUpLeg.rotation.x = -0.12;
        leftLeg.rotation.x = 0.18;
        rightUpLeg.rotation.x = 0.10;
        rightLeg.rotation.x = 0.14;
        setGuard('left');
        setGuard('right');

        if (cycle < 0.25) {
          // Stage 1: Fast Left Jab (arm extends straight forward)
          const p = Math.sin((cycle / 0.25) * Math.PI);
          spineBone.rotation.y = -p * 0.38;
          spineBone.rotation.x = p * 0.08;
          leftArmBone.rotation.x = -0.55 - 0.82 * p;
          leftArmBone.rotation.z = -0.20 + 0.10 * p;
          leftForeArm.rotation.x = -2.0 * (1 - p) - 0.10 * p;
          leftForeArm.rotation.z = 0.32 * (1 - p);
          headBone.rotation.y = baseHeadYaw + p * 0.22;
        } else if (cycle < 0.50) {
          // Stage 2: Heavy Right Cross
          const p = Math.sin(((cycle - 0.25) / 0.25) * Math.PI);
          spineBone.rotation.y = p * 0.44;
          spineBone.rotation.x = p * 0.10;
          rightArmBone.rotation.x = -0.55 - 0.82 * p;
          rightArmBone.rotation.z = 0.20 - 0.10 * p;
          rightForeArm.rotation.x = -2.0 * (1 - p) - 0.10 * p;
          rightForeArm.rotation.z = -0.32 * (1 - p);
          headBone.rotation.y = baseHeadYaw - p * 0.24;
        } else if (cycle < 0.72) {
          // Stage 3: Power Left Uppercut (bent arm driving upward)
          const p = Math.sin(((cycle - 0.50) / 0.22) * Math.PI);
          hipsBone.position.y = -0.32 - 0.03 + p * 0.06;
          spineBone.rotation.x = -p * 0.16;
          spineBone.rotation.y = -p * 0.40;
          leftArmBone.rotation.x = -0.40 - 0.42 * p;
          leftArmBone.rotation.z = -0.15;
          leftForeArm.rotation.x = -1.75;
          leftForeArm.rotation.z = 0.20;
          headBone.rotation.y = baseHeadYaw + p * 0.20;
        } else {
          // Stage 4: Finishing High Front Kick
          const p = Math.sin(((cycle - 0.72) / 0.28) * Math.PI);
          hipsBone.position.y = -0.32 + p * 0.14;
          spineBone.rotation.x = -p * 0.28;
          spineBone.rotation.y = p * 0.30;
          rightUpLeg.rotation.x = -1.55 * p;
          rightLeg.rotation.x = (1 - p) * 0.45;
          headBone.rotation.y = baseHeadYaw - p * 0.18;
        }
        return;
      }

      if (activeEmote === 'flex') {
        // [6] Hero Double-Bicep Power Flex (বডি ফ্লেক্স পোজ)
        const pulse = Math.sin(t * 5.5);
        const raise = smoothstep(0.0, 0.35, t);
        hipsBone.position.y = -0.32 - 0.02 + Math.abs(pulse) * 0.010;
        spineBone.rotation.x = (-0.08 - pulse * 0.02) * raise;

        // Clean front-double-bicep flex: upper arms lift slightly forward/out while forearms curl strongly upward
        leftArmBone.rotation.x = -0.38 * raise;
        leftArmBone.rotation.z = -0.24 * raise;
        leftForeArm.rotation.x = (-2.28 - pulse * 0.08) * raise;
        leftForeArm.rotation.y = 0.20 * raise;
        leftForeArm.rotation.z = -0.26 * raise;

        rightArmBone.rotation.x = -0.38 * raise;
        rightArmBone.rotation.z = 0.24 * raise;
        rightForeArm.rotation.x = (-2.28 - pulse * 0.08) * raise;
        rightForeArm.rotation.y = -0.20 * raise;
        rightForeArm.rotation.z = 0.26 * raise;

        leftUpLeg.rotation.z = 0.06;
        rightUpLeg.rotation.z = -0.06;
        headBone.rotation.y = baseHeadYaw + Math.sin(t * 2.2) * 0.06;
        headBone.rotation.x = baseHeadPitch + 0.03 + pulse * 0.02;
        return;
      }
    }

    const isMoving = animSpeed > 0.20;
    const speedRatio = isMoving
      ? Math.min(1, animSpeed / (sprinting ? 6.5 : 3.4))
      : 0;

    if (isMoving && onGround) {
      state.walkCycle += delta * (sprinting ? 14.5 : 8.2);
    } else {
      state.walkCycle += delta * 2.0;
    }

    const c = state.walkCycle;
    const swing = isMoving ? Math.sin(c) * (sprinting ? 0.88 : 0.44) * speedRatio : 0;
    const bounce = isMoving
      ? (sprinting
        ? (Math.abs(Math.sin(c)) * 0.068 - 0.018) * speedRatio
        : Math.abs(Math.cos(c)) * 0.024 * speedRatio)
      : Math.sin(c) * 0.006;

    hipsBone.position.y = -0.32 + bounce + (!onGround ? 0.14 : 0);
    hipsBone.rotation.y = isMoving ? -Math.sin(c) * (sprinting ? 0.14 : 0.05) * speedRatio : 0;
    hipsBone.rotation.z = isMoving ? Math.cos(c) * (sprinting ? 0.045 : 0.02) * speedRatio : 0;

    // Athletic forward torso lean when running, with natural chest counter-rotation
    spineBone.rotation.x = isMoving
      ? (sprinting ? 0.22 + Math.abs(Math.sin(c)) * 0.04 : 0.04) * speedRatio
      : Math.sin(c) * 0.012;
    spineBone.rotation.z = isMoving ? -Math.cos(c) * (sprinting ? 0.05 : 0.02) * speedRatio : 0;

    // Keep head counter-pitched up slightly while running so he looks straight ahead down the road
    headBone.rotation.y = baseHeadYaw + (isMoving ? Math.sin(c * 0.5) * 0.04 : Math.sin(c * 0.6) * 0.02);
    headBone.rotation.x = baseHeadPitch + exprPitch - (isMoving && sprinting ? 0.14 * speedRatio : 0);
    headBone.rotation.z = exprRoll;

    // Leg Animation (Walk vs Full Athletic Run Cycle with High Knee Drive & Heel Kick-Up)
    if (!onGround) {
      leftUpLeg.rotation.x = -0.55;
      leftLeg.rotation.x = 0.75;
      rightUpLeg.rotation.x = 0.35;
      rightLeg.rotation.x = 0.50;
    } else if (sprinting && isMoving) {
      // Realistic Running Gait:
      // Left leg phase = c, Right leg phase = c + PI
      const lSin = Math.sin(c);
      const lCos = Math.cos(c);
      const rSin = -lSin;
      const rCos = -lCos;

      // Thigh drives high forward (-0.92 rad) and pushes strongly back (+0.68 rad)
      leftUpLeg.rotation.x = (-lSin * 0.82 - Math.max(0, lSin) * 0.14) * speedRatio;
      rightUpLeg.rotation.x = (-rSin * 0.82 - Math.max(0, rSin) * 0.14) * speedRatio;

      // Knee bends sharply during forward recovery (lCos > 0) AND folds heel up after push-off
      const lKnee = Math.max(0.08, (0.55 + 0.65 * Math.max(0, lCos) + 0.25 * Math.max(0, -lSin)) * speedRatio);
      const rKnee = Math.max(0.08, (0.55 + 0.65 * Math.max(0, rCos) + 0.25 * Math.max(0, -rSin)) * speedRatio);
      leftLeg.rotation.x = lKnee;
      rightLeg.rotation.x = rKnee;
    } else {
      leftUpLeg.rotation.x = -swing;
      leftLeg.rotation.x = Math.max(0, swing * 0.88);
      rightUpLeg.rotation.x = swing;
      rightLeg.rotation.x = Math.max(0, -swing * 0.88);
    }

    // Arm & Quick Attack Animation (hands always free, outside the pockets)
    if (state.attackTimer > 0) {
      state.attackTimer = Math.max(0, state.attackTimer - delta);
      const t = 1 - state.attackTimer / 0.48;
      const strike = Math.sin(t * Math.PI);

      // Guard pose for both fists, then extend the punching arm
      leftArmBone.rotation.x = -0.55; leftArmBone.rotation.z = -0.22;
      leftForeArm.rotation.x = -2.0;  leftForeArm.rotation.z = 0.32;
      rightArmBone.rotation.x = -0.55; rightArmBone.rotation.z = 0.22;
      rightForeArm.rotation.x = -2.0;  rightForeArm.rotation.z = -0.32;

      if (state.attackType === 0) {
        spineBone.rotation.y = -strike * 0.36;
        leftArmBone.rotation.x = -0.55 - 0.90 * strike;
        leftArmBone.rotation.z = -0.22 + 0.12 * strike;
        leftForeArm.rotation.x = -2.0 * (1 - strike) - 0.08 * strike;
        leftForeArm.rotation.z = 0.32 * (1 - strike);
      } else if (state.attackType === 1) {
        spineBone.rotation.y = strike * 0.40;
        rightArmBone.rotation.x = -0.55 - 0.90 * strike;
        rightArmBone.rotation.z = 0.22 - 0.12 * strike;
        rightForeArm.rotation.x = -2.0 * (1 - strike) - 0.08 * strike;
        rightForeArm.rotation.z = -0.32 * (1 - strike);
      } else {
        // High Front Kick!
        spineBone.rotation.x = -strike * 0.26;
        rightUpLeg.rotation.x = -strike * 1.45;
        rightLeg.rotation.x = strike * 0.18;
      }
    } else if (!onGround) {
      // Mid-air jump arm balance
      leftArmBone.rotation.x = -0.50;
      leftArmBone.rotation.z = -0.35;
      leftForeArm.rotation.x = -0.70;
      rightArmBone.rotation.x = -0.30;
      rightArmBone.rotation.z = 0.35;
      rightForeArm.rotation.x = -0.70;
    } else if (sprinting && isMoving) {
      // Athletic Runner Arm Pump: 90-degree bent elbows pumping powerfully opposite to the legs!
      spineBone.rotation.y = Math.sin(c) * 0.16 * speedRatio;
      const lArmPump = Math.sin(c) * 0.85 * speedRatio;
      const rArmPump = -lArmPump;

      leftArmBone.rotation.x = -0.12 + lArmPump;
      leftArmBone.rotation.z = -0.10;
      leftForeArm.rotation.x = (-1.42 - Math.max(0, -lArmPump) * 0.45) * speedRatio;
      leftForeArm.rotation.z = 0.16 * speedRatio;

      rightArmBone.rotation.x = -0.12 + rArmPump;
      rightArmBone.rotation.z = 0.10;
      rightForeArm.rotation.x = (-1.42 - Math.max(0, -rArmPump) * 0.45) * speedRatio;
      rightForeArm.rotation.z = -0.16 * speedRatio;
    } else {
      spineBone.rotation.y = isMoving ? Math.sin(c) * 0.08 * speedRatio : 0;
      const breathArm = !isMoving ? Math.sin(c) * 0.015 : 0;
      leftArmBone.rotation.x = swing * 0.62 + breathArm;
      leftArmBone.rotation.z = -0.03;
      rightArmBone.rotation.x = -swing * 0.62 + breathArm;
      rightArmBone.rotation.z = 0.03;

      const baseElbow = isMoving ? -0.28 * Math.max(0.4, speedRatio) : -0.08;
      leftForeArm.rotation.x = baseElbow - Math.max(0, -swing) * 0.35;
      rightForeArm.rotation.x = baseElbow - Math.max(0, swing) * 0.35;
    }
  }

  return {
    root,
    state,
    triggerAttack,
    triggerEmote,
    setExpression,
    setQualityMode,
    cycleCameraMode,
    update,
  };
}
