import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

/**
 * KHULNA LIVING WILDLIFE SYSTEM (কাক, পাখি ও স্নো গূজ / হাঁস)
 * - Uses user's animated `birds.glb` (wing-flapping crows & city birds) across ALL main Khulna landmarks:
 *   intermittent appearances (not always present — flocks arrive, circle with realistic banking flight,
 *   swoop down to perch on building ledges/rooftops/gates, rest & look around, then take off again).
 * - Uses user's `snow_goose.glb` (facing +X in raw GLB -> rotated -90 deg Y to swim beak-first along +Z)
 *   swimming & floating gracefully on Shaheed Hadis Park Lake (right beside Shaheed Minar),
 *   plus Alia Madrasah Pond, Rupsha Waterfront cove, and intermittent visiting spots.
 * - Strictly distance-culled (< 240m) & geometry/material-shared for ZERO FPS drop!
 */

const CROW_SPOTS = [
  // Taltola House & Hospital Cross Rd (soaring high in the open sky above the 5-story rooftops, swooping down to perch on roof parapets!)
  {
    name: 'TaltolaHouseA',
    center: [422, 975],
    radius: 32,
    cruiseY: 22.5,
    isCrow: true,
    perches: [[426.5, 15.6, 971.0], [430.5, 15.6, 978.5], [428.0, 15.6, 975.0]],
    phase: 0.0,
    initState: 'FLYING',
  },
  {
    name: 'TaltolaHouseB',
    center: [418, 970],
    radius: 42,
    cruiseY: 26.5,
    isCrow: true,
    perches: [[425.0, 15.6, 980.0], [432.0, 15.6, 972.0]],
    phase: 3.1,
    initState: 'FLYING',
  },

  // Haji Mohsin Rd & SK Arshan Alif Tower (2 flocks: 1 crow, 1 city birds)
  {
    name: 'HajiMohsinA',
    center: [0, 4],
    radius: 34,
    cruiseY: 22.0,
    isCrow: true,
    perches: [[8.2, 12.6, -18.0], [-8.0, 11.4, 22.0], [7.2, 13.0, 56.0]],
    phase: 1.4,
    initState: 'FLYING',
  },
  {
    name: 'HajiMohsinB',
    center: [-4, 18],
    radius: 44,
    cruiseY: 27.5,
    isCrow: false,
    perches: [[-10.5, 29.8, 22.0], [9.0, 12.8, 4.0]],
    phase: 4.5,
    initState: 'PERCHED',
  },

  // PTI More & Ahsan Ahmed Rd (2 crow flocks)
  {
    name: 'PtiMoreA',
    center: [-304, -68],
    radius: 38,
    cruiseY: 22.5,
    isCrow: true,
    perches: [[-258.0, 11.6, -68.0], [-312.0, 14.8, -110.5], [-292.6, 12.2, -130.0]],
    phase: 2.7,
    initState: 'FLYING',
  },
  {
    name: 'PtiMoreB',
    center: [-298, -56],
    radius: 44,
    cruiseY: 25.5,
    isCrow: true,
    perches: [[-283.2, 12.2, -52.5], [-312.2, 14.2, -63.2], [-304.3, 13.1, -56.7]],
    phase: 5.8,
    initState: 'FLYING',
  },

  // Royal More, Chingri Chattar & Hotel Royal (2 flocks)
  {
    name: 'RoyalMoreA',
    center: [-535, -365],
    radius: 42,
    cruiseY: 23.0,
    isCrow: true,
    perches: [[-515.0, 14.6, -355.0], [-555.0, 13.2, -378.0]],
    phase: 3.9,
    initState: 'FLYING',
  },
  {
    name: 'RoyalMoreB',
    center: [-545, -350],
    radius: 50,
    cruiseY: 27.0,
    isCrow: false,
    perches: [[-522.0, 18.2, -360.0], [-562.0, 14.0, -342.0]],
    phase: 0.9,
    initState: 'AWAY',
  },

  // Satrasta More & Kaborkhana More (2 crow flocks)
  {
    name: 'SatrastaMore',
    center: [-240, 260],
    radius: 46,
    cruiseY: 22.5,
    isCrow: true,
    perches: [[-228.0, 11.5, 250.0], [-252.0, 12.2, 272.0]],
    phase: 2.1,
    initState: 'AWAY',
  },
  {
    name: 'KaborkhanaMore',
    center: [-28, 106],
    radius: 42,
    cruiseY: 21.8,
    isCrow: true,
    perches: [[-18.0, 11.4, 96.0], [-40.0, 10.8, 114.0]],
    phase: 4.8,
    initState: 'FLYING',
  },

  // Khulna Alia Kamil Madrasah & Model Mosque (2 crow flocks)
  {
    name: 'AliaMadrasahA',
    center: [204, 108],
    radius: 44,
    cruiseY: 23.0,
    isCrow: true,
    perches: [[185.0, 11.0, 108.0], [204.0, 20.1, 76.0], [204.0, 13.9, 138.0]],
    phase: 5.1,
    initState: 'FLYING',
  },
  {
    name: 'AliaMadrasahB',
    center: [214, 118],
    radius: 52,
    cruiseY: 26.5,
    isCrow: true,
    perches: [[190.4, 11.8, 108.0], [204.0, 13.9, 134.0]],
    phase: 1.9,
    initState: 'PERCHED',
  },

  // Boro Maath, Circuit House & Judge Court (2 flocks)
  {
    name: 'BoroMaathCourtA',
    center: [90, -640],
    radius: 54,
    cruiseY: 24.0,
    isCrow: true,
    perches: [[104.0, 10.6, -661.0], [170.2, 12.4, -676.0], [38.0, 10.8, -664.0]],
    phase: 6.3,
    initState: 'FLYING',
  },
  {
    name: 'BoroMaathCourtB',
    center: [120, -675],
    radius: 52,
    cruiseY: 28.0,
    isCrow: true,
    perches: [[188.0, 28.5, -676.0], [107.0, 12.6, -706.0], [128.0, 12.4, -684.0]],
    phase: 2.5,
    initState: 'AWAY',
  },

  // Khulna District Stadium (1 flock of birds)
  {
    name: 'KhulnaStadium',
    center: [-60, -740],
    radius: 62,
    cruiseY: 26.0,
    isCrow: false,
    perches: [[-134.0, 12.6, -740.0], [-60.0, 11.4, -654.0], [-60.0, 17.8, -829.5]],
    phase: 7.8,
    initState: 'FLYING',
  },

  // Shaheed Hadis Park (2 crow flocks high over the lake & Shaheed Minar!)
  {
    name: 'ShaheedHadisParkA',
    center: [-322, -886],
    radius: 38,
    cruiseY: 21.5,
    isCrow: true,
    perches: [[-295.0, 8.8, -840.0], [-332.0, 14.5, -916.0], [-284.0, 11.6, -892.0]],
    phase: 9.2,
    initState: 'FLYING',
  },
  {
    name: 'ShaheedHadisParkB',
    center: [-332, -910],
    radius: 44,
    cruiseY: 25.5,
    isCrow: true,
    perches: [[-295.0, 11.2, -840.0], [-326.0, 14.5, -916.0]],
    phase: 0.4,
    initState: 'FLYING',
  },

  // Altapole Lane & Rupsha Ghat (2 crow flocks)
  {
    name: 'AltapoleLane',
    center: [166, -410],
    radius: 34,
    cruiseY: 22.0,
    isCrow: true,
    perches: [[175.0, 12.5, -442.0], [158.0, 11.6, -401.0]],
    phase: 10.5,
    initState: 'FLYING',
  },
  {
    name: 'RupshaGhat',
    center: [1155, 72],
    radius: 48,
    cruiseY: 24.0,
    isCrow: false,
    perches: [[1132.0, 11.5, 64.0], [1144.0, 10.8, 86.0]],
    phase: 6.9,
    initState: 'FLYING',
  },
];

// Snow Goose / Duck swimming & roaming zones:
// Primary: Shaheed Hadis Park Lake right beside Shaheed Minar (10 geese floating clearly on top of open water!)
// Secondary: Alia Madrasah Pond, Rupsha Waterfront cove, plus occasional intermittent visits elsewhere!
const GOOSE_SPOTS = [
  // Shaheed Hadis Park Lake — South-West open water basin right in front/left of Shaheed Minar (x: -350..-323, z: -898..-862)
  { cx: -336.0, cz: -876.0, rx: 9.0, rz: 7.5, y: 0.01, speed: 0.22, phase: 0.2, scale: 1.18, zone: 'hadis' },
  { cx: -340.0, cz: -885.0, rx: 7.8, rz: 6.8, y: 0.01, speed: 0.19, phase: 1.5, scale: 1.10, zone: 'hadis' },
  { cx: -332.0, cz: -869.0, rx: 7.2, rz: 5.8, y: 0.01, speed: 0.24, phase: 2.8, scale: 1.15, zone: 'hadis' },
  { cx: -343.0, cz: -891.0, rx: 6.2, rz: 5.2, y: 0.01, speed: 0.20, phase: 4.1, scale: 1.06, zone: 'hadis' },
  { cx: -328.0, cz: -882.0, rx: 5.8, rz: 6.2, y: 0.01, speed: 0.23, phase: 5.2, scale: 1.14, zone: 'hadis' },
  { cx: -345.0, cz: -872.0, rx: 5.0, rz: 6.5, y: 0.01, speed: 0.21, phase: 0.9, scale: 1.08, zone: 'hadis' },

  // Shaheed Hadis Park Lake — South-East open water basin right beside the Causeway Bridge (x: -310..-300, z: -896..-864)
  { cx: -304.5, cz: -879.0, rx: 3.6, rz: 8.5, y: 0.01, speed: 0.20, phase: 1.9, scale: 1.16, zone: 'hadis' },
  { cx: -305.5, cz: -870.0, rx: 3.2, rz: 6.2, y: 0.01, speed: 0.23, phase: 3.6, scale: 1.08, zone: 'hadis' },
  { cx: -304.0, cz: -888.0, rx: 3.0, rz: 5.5, y: 0.01, speed: 0.18, phase: 5.0, scale: 1.12, zone: 'hadis' },
  { cx: -316.0, cz: -872.0, rx: 4.5, rz: 5.5, y: 0.01, speed: 0.22, phase: 2.4, scale: 1.14, zone: 'hadis' },

  // Swimming geese at Alia Madrasah Pond (4 geese)
  { cx: 256.0, cz: 128.0, rx: 8.0, rz: 9.5, y: 0.01, speed: 0.21, phase: 0.7, scale: 1.15, zone: 'alia', intermittent: false, cycleOffset: 0 },
  { cx: 260.0, cz: 136.0, rx: 7.5, rz: 8.0, y: 0.01, speed: 0.18, phase: 2.5, scale: 1.08, zone: 'alia', intermittent: false, cycleOffset: 0 },
  { cx: 252.0, cz: 140.0, rx: 6.5, rz: 7.0, y: 0.01, speed: 0.24, phase: 4.4, scale: 1.12, zone: 'alia', intermittent: true, cycleOffset: 12 },
  { cx: 258.0, cz: 120.0, rx: 6.0, rz: 6.5, y: 0.01, speed: 0.20, phase: 5.8, scale: 1.05, zone: 'alia', intermittent: true, cycleOffset: 12 },

  // Swimming geese at Rupsha Waterfront calm edge (3 geese)
  { cx: 1184.0, cz: 66.0, rx: 6.5, rz: 9.0, y: -0.32, speed: 0.20, phase: 1.1, scale: 1.18, zone: 'rupsha', intermittent: false, cycleOffset: 24 },
  { cx: 1188.0, cz: 78.0, rx: 6.0, rz: 8.5, y: -0.32, speed: 0.22, phase: 3.3, scale: 1.12, zone: 'rupsha', intermittent: false, cycleOffset: 24 },
  { cx: 1180.0, cz: 56.0, rx: 5.5, rz: 7.0, y: -0.32, speed: 0.19, phase: 4.9, scale: 1.08, zone: 'rupsha', intermittent: true, cycleOffset: 24 },

  // Occasional visiting geese gliding/roaming near Boro Maath lawn & Hadis Park garden shore
  { cx: 22.0, cz: -560.0, rx: 7.0, rz: 6.0, y: 0.02, speed: 0.16, phase: 0.4, scale: 0.60, zone: 'boro_lawn', intermittent: true, cycleOffset: 32 },
  { cx: 26.0, cz: -565.0, rx: 6.5, rz: 5.5, y: 0.02, speed: 0.15, phase: 2.2, scale: 0.56, zone: 'boro_lawn', intermittent: true, cycleOffset: 32 },
];

export function buildKhulnaWildlife(parent) {
  const root = new THREE.Group();
  root.name = 'KhulnaLivingWildlife';
  parent.add(root);

  const loader = new GLTFLoader();
  const flocks = [];
  const geese = [];
  const mixers = [];

  // Shared glossy charcoal-black crow materials with subtle wing-tip contrast so birds read clearly against sky & trees
  const crowBlackMat = new THREE.MeshStandardMaterial({
    color: 0x1d2330,
    roughness: 0.48,
    metalness: 0.18,
  });
  const crowAccentMat = new THREE.MeshStandardMaterial({
    color: 0x475266,
    roughness: 0.55,
    metalness: 0.12,
  });

  // 1) Load animated wing-flapping birds/crows GLB (`./assets/birds.glb`)
  loader.load('./assets/birds.glb', (gltf) => {
    const template = gltf.scene;
    template.updateMatrixWorld(true);
    const rawBox = new THREE.Box3().setFromObject(template);
    const rawSize = new THREE.Vector3();
    const rawCenter = new THREE.Vector3();
    rawBox.getSize(rawSize);
    rawBox.getCenter(rawCenter);
    const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z, 0.001);
    // Normalize the 5-bird flock to a natural, realistic size (~3.4m flock span -> ~0.85m wingspan per crow, visible in the sky without ever looking giant!)
    const baseScale = 3.4 / maxDim;
    const clip = gltf.animations && gltf.animations[0] ? gltf.animations[0] : null;

    for (let i = 0; i < CROW_SPOTS.length; i++) {
      const spot = CROW_SPOTS[i];
      const flockObj = SkeletonUtils.clone(template);
      const scaleMult = spot.isCrow ? (0.94 + (i % 3) * 0.08) : 0.86;
      const s = baseScale * scaleMult;
      flockObj.scale.setScalar(s);
      // Center flock pivot horizontally & align feet to y=0 so perched birds land cleanly on rooftops/ledges!
      flockObj.position.set(-rawCenter.x * s, -rawBox.min.y * s, -rawCenter.z * s);

      flockObj.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false; // Zero shadow-pass FPS overhead for flying birds!
          child.receiveShadow = false;
          child.frustumCulled = false; // Prevent animated SkinnedMesh popping at screen edges (already distance-culled at 240m!)
          if (spot.isCrow) {
            const matName = child.material?.name || '';
            child.material = matName.includes('.001') ? crowAccentMat : crowBlackMat;
          }
        }
      });

      const holder = new THREE.Group();
      const initState = spot.initState || 'FLYING';
      const startPerch = spot.perches[i % spot.perches.length];
      const initPos = initState === 'PERCHED' && startPerch
        ? new THREE.Vector3(startPerch[0], startPerch[1], startPerch[2])
        : new THREE.Vector3(spot.center[0], spot.cruiseY, spot.center[1]);

      holder.position.copy(initPos);
      holder.visible = initState !== 'AWAY';
      holder.add(flockObj);
      root.add(holder);

      let mixer = null;
      let action = null;
      if (clip) {
        mixer = new THREE.AnimationMixer(flockObj);
        action = mixer.clipAction(clip);
        action.timeScale = initState === 'PERCHED'
          ? 0.06
          : (spot.isCrow ? (1.20 + (i % 3) * 0.12) : (1.38 + (i % 3) * 0.14));
        action.play();
        mixer.setTime((i * 0.43) % (clip.duration || 1));
        mixers.push(mixer);
      }

      flocks.push({
        spot,
        holder,
        flockObj,
        mixer,
        action,
        state: initState, // 'FLYING' | 'DESCENDING' | 'PERCHED' | 'TAKING_OFF' | 'AWAY'
        stateTimer: initState === 'AWAY' ? (8.0 + (i % 4) * 5.0) : (10.0 + (i % 4) * 5.0),
        perchIdx: i % spot.perches.length,
        angle: spot.phase,
        angularSpeed: (spot.isCrow ? 0.28 : 0.34) * (i % 2 === 0 ? 1 : -1),
        pos: initPos.clone(),
        prevPos: initPos.clone(),
        targetPos: new THREE.Vector3(),
      });
    }
  }, undefined, (err) => {
    console.warn('Khulna birds.glb load warning:', err);
  });

  // 2) Load Snow Goose / Duck GLB (`./assets/snow_goose.glb`) for Hadis Park Lake & other ponds
  loader.load('./assets/snow_goose.glb', (gltf) => {
    const template = gltf.scene;
    // Raw snow_goose.glb is already oriented lengthwise along Z (width X=0.56, length Z=1.0) — no 90° sideways rotation!
    template.updateMatrixWorld(true);
    const rawBox = new THREE.Box3().setFromObject(template);
    const rawSize = new THREE.Vector3();
    rawBox.getSize(rawSize);
    const rawCenter = new THREE.Vector3();
    rawBox.getCenter(rawCenter);
    const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z, 0.001);

    // Center & waterline-align the template once so every clone floats cleanly on the water!
    const pivot = new THREE.Group();
    template.position.set(-rawCenter.x, -rawBox.min.y, -rawCenter.z);
    template.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = true;
      }
    });
    pivot.add(template);

    for (let i = 0; i < GOOSE_SPOTS.length; i++) {
      const cfg = GOOSE_SPOTS[i];
      const gooseMesh = pivot.clone(true);
      const s = cfg.scale / maxDim;
      gooseMesh.scale.setScalar(s);

      const holder = new THREE.Group();
      holder.position.set(cfg.cx, cfg.y, cfg.cz);
      holder.add(gooseMesh);
      root.add(holder);

      geese.push({
        cfg,
        holder,
        gooseMesh,
        prevX: cfg.cx,
        prevZ: cfg.cz,
      });
    }
  }, undefined, (err) => {
    console.warn('Khulna snow_goose.glb load warning:', err);
  });

  let lastTime = 0;
  const maxActiveDistSq = 240 * 240;

  function update(time, playerPos = null) {
    const dt = lastTime > 0 ? Math.min(0.05, Math.max(0.001, time - lastTime)) : 0.016;
    lastTime = time;

    // 1) Update Animated Crows & Birds (intermittent appearances + swooping to perch on buildings!)
    for (let i = 0; i < flocks.length; i++) {
      const f = flocks[i];
      const s = f.spot;

      // Strict distance culling for 0 FPS impact when player is in another district
      if (playerPos) {
        const dxP = playerPos.x - s.center[0];
        const dzP = playerPos.z - s.center[1];
        const near = (dxP * dxP + dzP * dzP) <= maxActiveDistSq;
        if (!near) {
          if (f.holder.visible) f.holder.visible = false;
          continue;
        }
      }

      f.stateTimer -= dt;

      if (f.state === 'AWAY') {
        // Intermittent absence ("সবসময় হবে না, মাঝে মাঝে হবে কাকের আনাগোনা")
        f.holder.visible = false;
        if (f.stateTimer <= 0) {
          f.state = 'FLYING';
          f.stateTimer = 18.0 + (i % 3) * 6.0;
          f.angle = s.phase + time * 0.1;
          f.pos.set(
            s.center[0] + Math.cos(f.angle) * (s.radius * 1.35),
            s.cruiseY + 12.0,
            s.center[1] + Math.sin(f.angle) * (s.radius * 1.35)
          );
          f.holder.visible = true;
          if (f.action) f.action.timeScale = s.isCrow ? 1.25 : 1.4;
        }
        continue;
      }

      f.holder.visible = true;
      f.prevPos.copy(f.pos);

      if (f.state === 'FLYING') {
        f.angle += f.angularSpeed * dt;
        const rMod = s.radius * (0.82 + 0.22 * Math.sin(time * 0.35 + s.phase));
        const tx = s.center[0] + Math.cos(f.angle) * rMod;
        const tz = s.center[1] + Math.sin(f.angle * 1.05) * rMod;
        const ty = s.cruiseY + Math.sin(time * 0.72 + s.phase) * 2.6;
        f.pos.lerp(f.targetPos.set(tx, ty, tz), Math.min(1, dt * 1.8));
        if (f.mixer) f.mixer.update(dt);

        if (f.stateTimer <= 0) {
          // ~67% chance to swoop down and perch on a building ledge/rooftop, ~33% chance to fly away for a bit
          if ((i + Math.floor(time)) % 3 !== 0 && s.perches.length > 0) {
            f.perchIdx = (f.perchIdx + 1) % s.perches.length;
            f.state = 'DESCENDING';
            f.stateTimer = 6.5;
          } else {
            f.state = 'AWAY';
            f.stateTimer = 14.0 + (i % 4) * 5.0;
          }
        }
      } else if (f.state === 'DESCENDING') {
        const p = s.perches[f.perchIdx];
        f.targetPos.set(p[0], p[1], p[2]);
        f.pos.lerp(f.targetPos, Math.min(1, dt * 1.35));
        if (f.mixer) f.mixer.update(dt);
        if (f.pos.distanceTo(f.targetPos) < 0.45 || f.stateTimer <= 0) {
          f.pos.copy(f.targetPos);
          f.state = 'PERCHED';
          f.stateTimer = 9.0 + (i % 3) * 4.5;
          // Slow/settle wing-flap into calm perched resting pose
          if (f.action) f.action.timeScale = 0.06;
        }
      } else if (f.state === 'PERCHED') {
        // Gently looking around while perched on the building/rooftop!
        f.holder.rotation.y += Math.sin(time * 1.1 + s.phase) * 0.35 * dt;
        f.holder.rotation.z = THREE.MathUtils.lerp(f.holder.rotation.z, 0, Math.min(1, dt * 5));
        f.holder.rotation.x = THREE.MathUtils.lerp(f.holder.rotation.x, 0, Math.min(1, dt * 5));
        if (f.mixer) f.mixer.update(dt * 0.10);

        if (f.stateTimer <= 0) {
          f.state = 'TAKING_OFF';
          f.stateTimer = 4.5;
          if (f.action) f.action.timeScale = s.isCrow ? 1.55 : 1.65;
        }
      } else if (f.state === 'TAKING_OFF') {
        f.angle += f.angularSpeed * dt * 1.25;
        f.targetPos.set(
          s.center[0] + Math.cos(f.angle) * (s.radius * 0.7),
          s.cruiseY + 2.0,
          s.center[1] + Math.sin(f.angle) * (s.radius * 0.7)
        );
        f.pos.lerp(f.targetPos, Math.min(1, dt * 1.4));
        if (f.mixer) f.mixer.update(dt);
        if (f.pos.y >= s.cruiseY - 1.5 || f.stateTimer <= 0) {
          f.state = 'FLYING';
          f.stateTimer = 18.0 + (i % 3) * 6.0;
          if (f.action) f.action.timeScale = s.isCrow ? 1.2 : 1.35;
        }
      }

      f.holder.position.copy(f.pos);

      // Smooth heading + realistic banking roll into flight turns
      if (f.state !== 'PERCHED') {
        const vx = f.pos.x - f.prevPos.x;
        const vy = f.pos.y - f.prevPos.y;
        const vz = f.pos.z - f.prevPos.z;
        const hSpd = Math.hypot(vx, vz);
        if (hSpd > 0.002) {
          const targetYaw = Math.atan2(vx, vz);
          let diff = targetYaw - f.holder.rotation.y;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          f.holder.rotation.y += diff * Math.min(1, dt * 5.0);
          const bankRoll = THREE.MathUtils.clamp(-diff * 1.6, -0.45, 0.45);
          f.holder.rotation.z = THREE.MathUtils.lerp(f.holder.rotation.z, bankRoll, Math.min(1, dt * 4.5));
          const pitch = THREE.MathUtils.clamp(-vy / Math.max(0.05, hSpd) * 0.45, -0.35, 0.35);
          f.holder.rotation.x = THREE.MathUtils.lerp(f.holder.rotation.x, pitch, Math.min(1, dt * 4.5));
        }
      }
    }

    // 2) Update Swimming & Floating Snow Geese / Ducks (Hadis Park Lake primary + occasional other spots!)
    for (let i = 0; i < geese.length; i++) {
      const g = geese[i];
      const c = g.cfg;

      if (playerPos) {
        const dxP = playerPos.x - c.cx;
        const dzP = playerPos.z - c.cz;
        let show = (dxP * dxP + dzP * dzP) <= maxActiveDistSq;
        // Occasional intermittent presence outside Hadis Park Lake ("মাঝে মাঝে বিভিন্ন জায়গায় ছাড়বে")
        if (show && c.intermittent) {
          const cycle = ((time + (c.cycleOffset || 0)) % 90.0);
          show = cycle < 58.0;
        }
        if (g.holder.visible !== show) g.holder.visible = show;
        if (!show) continue;
      }

      // Gentle figure-8 / elliptical swimming loop on the water surface
      const t = time * c.speed + c.phase;
      const nx = c.cx + Math.cos(t) * c.rx;
      const nz = c.cz + Math.sin(t * 1.35) * c.rz;
      const bobY = c.y + Math.sin(time * 2.4 + c.phase * 2.0) * (c.zone === 'boro_lawn' ? 0.014 : 0.026);

      g.holder.position.set(nx, bobY, nz);

      const dx = nx - g.prevX;
      const dz = nz - g.prevZ;
      if (Math.hypot(dx, dz) > 0.0008) {
        const swimYaw = Math.atan2(dx, dz);
        g.holder.rotation.y = swimYaw;
      }
      // Subtle buoyant water rocking & paddling waddle
      g.gooseMesh.rotation.z = Math.sin(time * 3.1 + c.phase) * 0.065;
      g.gooseMesh.rotation.x = Math.cos(time * 2.2 + c.phase) * 0.04;

      g.prevX = nx;
      g.prevZ = nz;
    }
  }

  return {
    root,
    update,
    setVisible(visible) {
      root.visible = visible;
    },
  };
}
