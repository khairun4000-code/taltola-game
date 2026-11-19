import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const BODY_PAINT_MATS = ['Mesheszx1Mtl', 'Meshesbody151Mtl'];
const WHEEL_RIM_MATS = ['Meshesm8rim1Mtl'];
const TIRE_MATS = ['Meshesm8rim0011Mtl'];

const WHEEL_QUADRANTS = [
  { key: 'FL', isFront: true, side: 1, cx: 288.9585, cy: -159.0625, cz: -1.5731 },
  { key: 'FR', isFront: true, side: -1, cx: 282.4390, cy: -159.0625, cz: -1.5731 },
  { key: 'RL', isFront: false, side: 1, cx: 289.0730, cy: -170.8565, cz: -1.5335 },
  { key: 'RR', isFront: false, side: -1, cx: 282.3225, cy: -170.8565, cz: -1.5335 },
];

export const BMW_PAINT_PRESETS = [
  { name: 'Isle of Man Green', hex: '#0c4d26' },
  { name: 'Toronto Red', hex: '#b3121e' },
  { name: 'Portimao Blue', hex: '#143c8c' },
  { name: 'Sao Paulo Yellow', hex: '#d9c61e' },
  { name: 'Alpine White', hex: '#eef2f6' },
  { name: 'Jet Black', hex: '#16181c' },
];

function createUnderbodyContactShadow(width, length) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(64, 128, 12, 64, 128, 118);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  grad.addColorStop(0.66, 'rgba(0, 0, 0, 0.62)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 256);

  const tex = new THREE.CanvasTexture(canvas);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 1.24, length * 1.12),
    new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
  );
  plane.rotation.x = -Math.PI * 0.5;
  plane.position.y = 0.025;
  return plane;
}

function splitMergedWheelMeshByQuadrant(mesh, q) {
  const srcGeom = mesh.geometry;
  const posAttr = srcGeom.attributes.position;
  const normAttr = srcGeom.attributes.normal;
  const uvAttr = srcGeom.attributes.uv;
  const indexAttr = srcGeom.index;

  const newIndices = [];
  const vertexMap = new Map();
  const newPositions = [];
  const newNormals = [];
  const newUVs = [];

  function addVertex(oldIdx) {
    if (vertexMap.has(oldIdx)) return vertexMap.get(oldIdx);
    const newIdx = newPositions.length / 3;
    vertexMap.set(oldIdx, newIdx);

    newPositions.push(
      posAttr.getX(oldIdx) - q.cx,
      posAttr.getY(oldIdx) - q.cy,
      posAttr.getZ(oldIdx) - q.cz,
    );
    if (normAttr) {
      newNormals.push(
        normAttr.getX(oldIdx),
        normAttr.getY(oldIdx),
        normAttr.getZ(oldIdx),
      );
    }
    if (uvAttr) {
      newUVs.push(uvAttr.getX(oldIdx), uvAttr.getY(oldIdx));
    }
    return newIdx;
  }

  const triCount = indexAttr ? indexAttr.count / 3 : posAttr.count / 3;
  for (let t = 0; t < triCount; t++) {
    const i0 = indexAttr ? indexAttr.getX(t * 3) : t * 3;
    const i1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;

    const vx = posAttr.getX(i0);
    const vy = posAttr.getY(i0);
    const isLeft = vx > 285.7;
    const isFront = vy > -165.0;

    if (isLeft === (q.side === 1) && isFront === q.isFront) {
      newIndices.push(addVertex(i0), addVertex(i1), addVertex(i2));
    }
  }

  const subGeom = new THREE.BufferGeometry();
  subGeom.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
  if (newNormals.length > 0) {
    subGeom.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3));
  } else {
    subGeom.computeVertexNormals();
  }
  if (newUVs.length > 0) {
    subGeom.setAttribute('uv', new THREE.Float32BufferAttribute(newUVs, 2));
  }
  subGeom.setIndex(newIndices);

  const subMesh = new THREE.Mesh(subGeom, mesh.material);
  subMesh.castShadow = true;
  subMesh.receiveShadow = true;
  return subMesh;
}

function createBodyMaterial(source, colorHex) {
  return new THREE.MeshPhysicalMaterial({
    name: source.name,
    color: new THREE.Color(colorHex),
    map: source.map || null,
    normalMap: source.normalMap || null,
    normalScale: source.normalScale ? source.normalScale.clone() : new THREE.Vector2(1, 1),
    aoMap: source.aoMap || null,
    side: source.side,
    transparent: source.transparent,
    opacity: source.opacity,
    alphaTest: source.alphaTest,
    metalness: 0.72,
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    ior: 1.52,
    reflectivity: 1.0,
    envMapIntensity: 1.65,
  });
}

function createWheelMaterial(source, colorHex = '#d8ebff') {
  return new THREE.MeshPhysicalMaterial({
    name: source.name,
    color: new THREE.Color(colorHex),
    map: source.map || null,
    normalMap: source.normalMap || null,
    side: source.side,
    metalness: 0.90,
    roughness: 0.14,
    clearcoat: 0.85,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.75,
  });
}

/**
 * Builds the full 30-mesh drivable 3D BMW M3/M4 Competition (imported from shutoko-car-sim)
 * with 4-wheel spin & steer rigging, paint color cycling, engine/horn audio, and Taltola street collisions.
 */
export function createDrivableBMW(scene, manager) {
  const root = new THREE.Group();
  root.name = 'DrivableBMWM3';
  scene.add(root);

  const bodyTiltGroup = new THREE.Group();
  root.add(bodyTiltGroup);

  // Soft contact shadow so the BMW looks grounded at 60-120 FPS even when shadows are off
  const contactShadow = createUnderbodyContactShadow(1.88, 4.35);
  root.add(contactShadow);

  // Spawn right on Taltola / Haji Mohsin Road in front of the house, facing South (+Z)
  const state = {
    loaded: false,
    driving: false,
    cameraMode: 'chase', // 'chase' | 'hood' | 'front'
    pos: new THREE.Vector3(-0.35, 0.01, 4.8),
    heading: 0.0, // 0 faces +Z (down Haji Mohsin Road)
    speed: 0,
    lateralVel: 0,
    steerAngle: 0,
    wheelSpin: 0,
    rpm: 920,
    gear: 'N',
    pitch: 0,
    roll: 0,
    paintIndex: 0,
    paintName: BMW_PAINT_PRESETS[0].name,
  };

  let riggedWheels = [];
  let paintMaterials = [];
  let glossyMaterials = [];
  let carShadowMeshes = [];
  let tailMat = null;
  let drlMat = null;
  let currentQuality = 'high';

  // Web Audio BMW inline-6 Engine + Horn
  let audioCtx = null;
  let osc1 = null;
  let osc2 = null;
  let engineGain = null;

  function ensureAudio() {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      audioCtx = new AudioContextClass();
      osc1 = audioCtx.createOscillator();
      osc2 = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      engineGain = audioCtx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.value = 52;
      osc2.frequency.value = 78;

      filter.type = 'lowpass';
      filter.frequency.value = 320;
      engineGain.gain.value = 0.0;

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(engineGain);
      engineGain.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
    } catch {}
  }

  function updateEngineAudio(active, rpm, throttle) {
    if (!audioCtx || !engineGain || !osc1 || !osc2) return;
    const now = audioCtx.currentTime;
    if (!active) {
      engineGain.gain.setTargetAtTime(0.0, now, 0.08);
      return;
    }
    const baseFreq = 32 + (rpm / 7500) * 155;
    osc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
    osc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.04);
    const targetGain = 0.032 + throttle * 0.048;
    engineGain.gain.setTargetAtTime(targetGain, now, 0.06);
  }

  function playHorn() {
    ensureAudio();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.11, now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      g.connect(audioCtx.destination);

      for (const freq of [415, 520]) {
        const o = audioCtx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = freq;
        const filt = audioCtx.createBiquadFilter();
        filt.type = 'bandpass';
        filt.frequency.value = 950;
        o.connect(filt);
        filt.connect(g);
        o.start(now);
        o.stop(now + 0.36);
      }
    } catch {}
  }

  // Load the real 30-mesh BMW M3/M4 Competition GLB asynchronously so startup stays instant
  const loader = new GLTFLoader(manager);
  loader.load(
    './assets/bmw_m3.glb',
    (gltf) => {
      const model = gltf.scene;
      model.updateMatrixWorld(true);

      const bounds = new THREE.Box3().setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 0.001);
      // Scale to 4.35m length so it matches real 1.76m human scale & fits Taltola lane cleanly
      const scale = 4.35 / maxDim;

      model.scale.setScalar(scale);
      model.position.set(
        -center.x * scale,
        -bounds.min.y * scale,
        -center.z * scale,
      );

      const paintColorHex = BMW_PAINT_PRESETS[state.paintIndex].hex;
      let caliperMeshObj = null;
      let rimMeshObj = null;
      let tireMeshObj = null;
      let wheelsParentNode = null;

      model.traverse((child) => {
        if (child.name === 'WHeelsandrims_2') {
          wheelsParentNode = child;
        }
        if (!child.isMesh || !child.material) return;

        const isArray = Array.isArray(child.material);
        const srcMats = isArray ? child.material : [child.material];

        const firstName = srcMats[0]?.name || '';
        const shouldCast = firstName !== 'Meshesheadlight51Mtl' && firstName !== 'Mesheswindows1Mtl';
        child.castShadow = shouldCast && currentQuality !== 'low';
        child.receiveShadow = true;
        if (shouldCast) carShadowMeshes.push(child);

        const outMats = srcMats.map((mat) => {
          const mName = mat.name || '';

          if (BODY_PAINT_MATS.includes(mName)) {
            const pMat = createBodyMaterial(mat, paintColorHex);
            paintMaterials.push(pMat);
            glossyMaterials.push(pMat);
            return pMat;
          }
          if (mName === 'Mesheslivery1Mtl') {
            const lMat = createBodyMaterial(mat, paintColorHex);
            lMat.map = null;
            paintMaterials.push(lMat);
            glossyMaterials.push(lMat);
            return lMat;
          }
          if (mName === 'Meshesheadlight51Mtl') {
            const hlMat = new THREE.MeshPhysicalMaterial({
              name: mName,
              color: new THREE.Color('#10151e'),
              transparent: true,
              opacity: 0.18,
              depthWrite: false,
              roughness: 0.03,
              metalness: 0.15,
              clearcoat: 1.0,
              envMapIntensity: 1.6,
            });
            glossyMaterials.push(hlMat);
            return hlMat;
          }
          if (mName === 'Meshesled111Mtl') {
            const dMat = new THREE.MeshStandardMaterial({
              name: mName,
              color: new THREE.Color('#ffee22'),
              emissive: new THREE.Color('#ffdd00'),
              emissiveIntensity: 4.5,
              roughness: 0.08,
            });
            drlMat = dMat;
            return dMat;
          }
          if (mName === 'Mesheslight51Mtl') {
            const pLightMat = mat.clone();
            pLightMat.emissive = new THREE.Color('#d8eeff');
            pLightMat.emissiveIntensity = 1.4;
            pLightMat.envMapIntensity = 1.4;
            return pLightMat;
          }
          if (mName === 'Meshesredlight1Mtl' || mName === 'Meshestail71Mtl') {
            const tMat = new THREE.MeshStandardMaterial({
              name: mName,
              color: new THREE.Color('#ff1128'),
              emissive: new THREE.Color('#ff0820'),
              emissiveIntensity: 3.4,
              roughness: 0.10,
            });
            if (mName === 'Meshesredlight1Mtl') tailMat = tMat;
            return tMat;
          }
          if (mName === 'Meshesled11Mtl') {
            const ledMat = mat.clone();
            ledMat.emissive = new THREE.Color('#ffffff');
            ledMat.emissiveIntensity = 1.8;
            return ledMat;
          }
          if (mName === 'Mesheswindows1Mtl') {
            const winMat = new THREE.MeshPhysicalMaterial({
              name: mName,
              color: new THREE.Color('#0a1524'),
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.48,
              depthWrite: false,
              metalness: 0.45,
              roughness: 0.06,
              clearcoat: 1.0,
              clearcoatRoughness: 0.04,
              reflectivity: 1.0,
              envMapIntensity: 1.8,
            });
            glossyMaterials.push(winMat);
            return winMat;
          }
          if (WHEEL_RIM_MATS.includes(mName)) {
            const rMat = createWheelMaterial(mat, '#d8ebff');
            glossyMaterials.push(rMat);
            return rMat;
          }
          if (TIRE_MATS.includes(mName)) {
            return new THREE.MeshStandardMaterial({
              name: mName,
              color: new THREE.Color('#1d2025'),
              map: mat.map || null,
              normalMap: mat.normalMap || null,
              roughness: 0.76,
              metalness: 0.06,
              envMapIntensity: 0.6,
              side: mat.side,
            });
          }
          if (mName === 'Caliper1Mtl') {
            const cMat = mat.clone();
            cMat.color.set('#087fd7');
            cMat.metalness = 0.42;
            cMat.roughness = 0.24;
            cMat.envMapIntensity = 1.1;
            return cMat;
          }
          if (
            mName === 'Meshesblack151Mtl'
            || mName === 'Meshesff41Mtl'
            || mName === 'Meshespillars1Mtl'
            || mName === 'Meshesblack161Mtl'
          ) {
            const trimMat = new THREE.MeshPhysicalMaterial({
              name: mName,
              color: mName === 'Meshespillars1Mtl' ? new THREE.Color('#15181d') : new THREE.Color('#eef2f6'),
              map: mat.map || null,
              roughness: 0.18,
              metalness: 0.50,
              clearcoat: 0.9,
              clearcoatRoughness: 0.10,
              envMapIntensity: 1.4,
              side: mat.side,
            });
            glossyMaterials.push(trimMat);
            return trimMat;
          }

          const cloned = mat.clone();
          cloned.envMapIntensity = 1.15;
          return cloned;
        });

        if (!child.geometry.attributes.normal) {
          child.geometry.computeVertexNormals();
        }
        child.material = isArray ? outMats : outMats[0];

        const finalMatName = (Array.isArray(child.material) ? child.material[0].name : child.material.name) || '';
        if (finalMatName === 'Caliper1Mtl') caliperMeshObj = child;
        if (finalMatName === 'Meshesm8rim1Mtl') rimMeshObj = child;
        if (finalMatName === 'Meshesm8rim0011Mtl') tireMeshObj = child;
      });

      if (wheelsParentNode && rimMeshObj && tireMeshObj) {
        const builtWheels = [];
        for (const q of WHEEL_QUADRANTS) {
          const steerPivot = new THREE.Group();
          steerPivot.position.set(q.cx, q.cy, q.cz);
          wheelsParentNode.add(steerPivot);

          if (caliperMeshObj) {
            steerPivot.add(splitMergedWheelMeshByQuadrant(caliperMeshObj, q));
          }

          const spinPivot = new THREE.Group();
          steerPivot.add(spinPivot);
          const subRim = splitMergedWheelMeshByQuadrant(rimMeshObj, q);
          const subTire = splitMergedWheelMeshByQuadrant(tireMeshObj, q);
          subRim.castShadow = currentQuality !== 'low';
          subTire.castShadow = currentQuality !== 'low';
          carShadowMeshes.push(subRim, subTire);
          spinPivot.add(subRim);
          spinPivot.add(subTire);

          builtWheels.push({
            wheelRoot: steerPivot,
            spinGroup: spinPivot,
            isFront: q.isFront,
          });
        }

        if (caliperMeshObj) caliperMeshObj.visible = false;
        rimMeshObj.visible = false;
        tireMeshObj.visible = false;
        riggedWheels = builtWheels;
      }

      bodyTiltGroup.add(model);
      state.loaded = true;
      syncTransform();
    },
    undefined,
    (err) => {
      console.warn('Could not load BMW M3 model:', err);
    },
  );

  function syncTransform() {
    root.position.copy(state.pos);
    root.rotation.y = state.heading;
    bodyTiltGroup.rotation.x = state.pitch;
    bodyTiltGroup.rotation.z = state.roll;

    for (const w of riggedWheels) {
      if (w.isFront) {
        w.wheelRoot.rotation.z = -state.steerAngle;
      }
      w.spinGroup.rotation.x = state.wheelSpin;
    }
  }

  function applyCarCollisions(houseRef, envRef) {
    const p = state.pos;
    let hitWall = false;

    // Overall drivable street bounds
    if (p.z < -37.2) {
      p.z = -37.2;
      hitWall = true;
    } else if (p.z > 37.2) {
      p.z = 37.2;
      hitWall = true;
    }

    // Check which open street/alley corridor the car is currently in
    const inFakirBariLane = p.z >= 10.65 && p.z <= 13.75;
    const houseGateOpen = Boolean(houseRef?.state?.gateOpen);
    const inHouseGateZ = houseGateOpen && p.z >= -1.4 && p.z <= 1.4;
    const towerGateOpen = Boolean(envRef?.tower?.state?.gateOpen);
    const inTowerRampZ = towerGateOpen && p.z >= 19.3 && p.z <= 22.6;
    const inASBOpenZ = p.z >= 24.0 && p.z <= 26.2;

    // West side (-X) road edge / Fakir Bari Lane / SK Arshan Parking
    const minX = inFakirBariLane ? -39.5 : (inTowerRampZ ? -9.0 : -1.55);
    // East side (+X) road edge / Taltola House Courtyard / ASB Courtyard
    const maxX = inHouseGateZ ? 4.35 : (inASBOpenZ ? 5.2 : 1.55);

    if (p.x < minX) {
      p.x = minX;
      hitWall = true;
    } else if (p.x > maxX) {
      p.x = maxX;
      hitWall = true;
    }

    // Keep car inside Fakir Bari Lane walls once turned West past x < -2.2
    if (p.x < -2.2 && !inTowerRampZ) {
      if (p.z < 11.15) {
        p.z = 11.15;
        hitWall = true;
      } else if (p.z > 13.35) {
        p.z = 13.35;
        hitWall = true;
      }
    }

    // Ground elevation: smoothly climb SK Arshan Parking ramp when driving inside
    if (inTowerRampZ && p.x < -2.6) {
      const rampT = THREE.MathUtils.clamp((-2.6 - p.x) / 1.75, 0, 1);
      p.y = 0.01 + rampT * 0.50;
    } else {
      p.y = 0.01;
    }

    if (hitWall) {
      state.speed *= 0.65;
      state.lateralVel *= -0.2;
    }
  }

  function cyclePaintColor() {
    state.paintIndex = (state.paintIndex + 1) % BMW_PAINT_PRESETS.length;
    const preset = BMW_PAINT_PRESETS[state.paintIndex];
    state.paintName = preset.name;
    for (const mat of paintMaterials) {
      mat.color.set(preset.hex);
    }
    return preset;
  }

  function cycleCameraMode() {
    const order = ['chase', 'hood', 'front'];
    const idx = order.indexOf(state.cameraMode);
    state.cameraMode = order[(idx + 1) % order.length];
    return state.cameraMode;
  }

  function enterCar() {
    state.driving = true;
    ensureAudio();
    if (drlMat) drlMat.emissiveIntensity = 5.0;
  }

  function exitCar(playerPos) {
    state.driving = false;
    updateEngineAudio(false, 920, 0);
    if (drlMat) drlMat.emissiveIntensity = 2.6;
    if (tailMat) tailMat.emissiveIntensity = 1.6;

    // Place player cleanly next to the left (driver) door or right side if left is tight
    const rightVec = new THREE.Vector3(Math.cos(state.heading), 0, -Math.sin(state.heading));
    const exitOffset = state.pos.x < -0.6 ? 1.55 : -1.55;
    playerPos.set(
      state.pos.x + rightVec.x * exitOffset,
      state.pos.y + 1.68,
      state.pos.z + rightVec.z * exitOffset,
    );
  }

  function isPlayerNear(playerPos) {
    if (playerPos.y - 1.68 > 2.0) return false;
    return Math.hypot(playerPos.x - state.pos.x, playerPos.z - state.pos.z) < 3.6;
  }

  function getPrompt(playerPos) {
    if (state.driving) {
      return '[E / T] BMW M3 গাড়ি থেকে নামুন (Exit Car)';
    }
    if (isPlayerNear(playerPos)) {
      return '[E / F] BMW M3 গাড়িতে উঠুন ও চালান (Drive BMW M3)';
    }
    return null;
  }

  const fwd = new THREE.Vector3();
  const rgt = new THREE.Vector3();

  function update(delta, keys, houseRef, envRef) {
    const dt = Math.min(delta, 0.05);

    if (!state.driving) {
      // Gently coast to a stop if player exited while rolling
      if (Math.abs(state.speed) > 0.05) {
        state.speed *= Math.max(0, 1 - dt * 4.2);
        fwd.set(Math.sin(state.heading), 0, Math.cos(state.heading));
        state.pos.addScaledVector(fwd, state.speed * dt);
        state.wheelSpin += (state.speed / 0.34) * dt;
        applyCarCollisions(houseRef, envRef);
      } else {
        state.speed = 0;
      }
      state.pitch = THREE.MathUtils.lerp(state.pitch, 0, Math.min(1, dt * 8));
      state.roll = THREE.MathUtils.lerp(state.roll, 0, Math.min(1, dt * 8));
      updateEngineAudio(false, 920, 0);
      syncTransform();
      return;
    }

    const throttle = (keys.has('KeyW') || keys.has('ArrowUp')) ? 1 : 0;
    const brake = (keys.has('KeyS') || keys.has('ArrowDown')) ? 1 : 0;
    const steerInput = (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0)
      - (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0);
    const handbrake = keys.has('Space');
    const boost = (keys.has('ShiftLeft') || keys.has('ShiftRight')) && throttle > 0 ? 1.45 : 1.0;

    // Street-tuned BMW M3 speed & responsive cornering for Khulna roads (up to ~135 km/h with boost)
    const maxForwardSpeed = boost > 1 ? 37.5 : 26.5;
    const engineForce = 15.5 * boost;
    const brakeForce = 24.0;
    const drag = 0.012 * state.speed * Math.abs(state.speed) + 0.55 * state.speed;

    let accel = 0;
    if (throttle > 0) accel += engineForce;
    if (brake > 0) {
      if (state.speed > 0.6) accel -= brakeForce;
      else accel -= 9.5; // Reverse gear
    }
    if (handbrake && Math.abs(state.speed) > 0.4) {
      accel -= Math.sign(state.speed) * 14.0;
    }

    state.speed += (accel - drag) * dt;
    state.speed = THREE.MathUtils.clamp(state.speed, -11.5, maxForwardSpeed);
    if (!throttle && !brake && Math.abs(state.speed) < 0.14) {
      state.speed = 0;
    }

    const maxSteer = THREE.MathUtils.lerp(0.54, 0.22, Math.min(1, Math.abs(state.speed) / 28));
    state.steerAngle = THREE.MathUtils.lerp(state.steerAngle, steerInput * maxSteer, Math.min(1, dt * 11));

    const isDrifting = handbrake && Math.abs(state.speed) > 5.5;
    const grip = isDrifting ? 2.6 : 8.5;

    const turnRate = state.steerAngle
      * (state.speed / 2.65)
      * (isDrifting ? 1.42 : 1.0)
      * (1.0 / (1.0 + Math.abs(state.speed) * 0.025));

    state.heading += turnRate * dt;

    const centrifugal = turnRate * state.speed * (isDrifting ? 0.36 : 0.10);
    state.lateralVel = THREE.MathUtils.lerp(state.lateralVel, centrifugal, Math.min(1, dt * grip));

    fwd.set(Math.sin(state.heading), 0, Math.cos(state.heading));
    rgt.set(Math.cos(state.heading), 0, -Math.sin(state.heading));

    state.pos.addScaledVector(fwd, state.speed * dt);
    state.pos.addScaledVector(rgt, state.lateralVel * dt);

    applyCarCollisions(houseRef, envRef);

    // Wheel spin & suspension pitch/roll
    state.wheelSpin += (state.speed / 0.34) * dt;
    const targetPitch = THREE.MathUtils.clamp(-accel * 0.0022, -0.045, 0.045);
    const targetRoll = THREE.MathUtils.clamp(-turnRate * state.speed * 0.0025, -0.055, 0.055);
    state.pitch = THREE.MathUtils.lerp(state.pitch, targetPitch, Math.min(1, dt * 10));
    state.roll = THREE.MathUtils.lerp(state.roll, targetRoll, Math.min(1, dt * 10));

    // Gear & RPM telemetry
    const absKmh = Math.abs(state.speed) * 3.6;
    const gearThresholds = [0, 26, 52, 78, 104, 130, 165];
    let g = 1;
    for (let i = 1; i <= 6; i++) {
      if (absKmh >= gearThresholds[i - 1]) g = i;
    }
    state.gear = state.speed < -0.4 ? 'R' : (absKmh < 1 ? 'N' : g);

    const gMin = gearThresholds[(typeof g === 'number' ? g : 1) - 1] || 0;
    const gMax = gearThresholds[typeof g === 'number' ? g : 1] || 30;
    const gearProgress = (absKmh - gMin) / Math.max(1, gMax - gMin);
    const targetRpm = absKmh < 1
      ? 920 + throttle * 3800
      : THREE.MathUtils.clamp(2000 + gearProgress * 5400, 1100, 7800);
    state.rpm = THREE.MathUtils.lerp(state.rpm, targetRpm, Math.min(1, dt * 12));

    // Brighten brake lights when braking or handbraking
    if (tailMat) {
      tailMat.emissiveIntensity = (brake > 0 || handbrake) ? 7.5 : 2.8;
    }

    updateEngineAudio(true, state.rpm, throttle);
    syncTransform();
  }

  function setQualityMode(nextQuality) {
    currentQuality = nextQuality;
    const castShadows = nextQuality !== 'low';
    const envIntensity = nextQuality === 'ultra' ? 2.1 : (nextQuality === 'high' ? 1.7 : (nextQuality === 'medium' ? 1.25 : 0.85));
    const clearcoatVal = nextQuality === 'low' ? 0.3 : 1.0;

    for (const mesh of carShadowMeshes) {
      mesh.castShadow = castShadows;
      mesh.receiveShadow = castShadows;
    }
    for (const mat of glossyMaterials) {
      if ('envMapIntensity' in mat) mat.envMapIntensity = envIntensity;
      if ('clearcoat' in mat) mat.clearcoat = clearcoatVal;
      mat.needsUpdate = true;
    }
    contactShadow.visible = nextQuality === 'low' || nextQuality === 'medium';
  }

  return {
    group: root,
    state,
    enterCar,
    exitCar,
    isPlayerNear,
    getPrompt,
    cyclePaintColor,
    cycleCameraMode,
    playHorn,
    setQualityMode,
    update,
  };
}
