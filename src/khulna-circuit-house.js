import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * KHULNA CIRCUIT HOUSE (খুলনা সার্কিট হাউজ — GTA-READY ENTERABLE 3D GLB MODULE)
 *
 * Replaces the legacy blockout concept on Circuit House Rd (K.D. Ghos Rd) opposite Khulna Judge Court
 * with the full-fidelity, color-graded, enterable Khulna Circuit House 3D GLB asset:
 *  - Exact street-aligned footpath (interlocking zig-zag pavers, storm grates, black-yellow curb)
 *  - Left-side entrance with 3D sculpted red-brick signage wall, gold inauguration plaque & 1971 memorial
 *  - Interactive mechanical sliding gate (`Main_Sliding_Gate_Leaf`, toggle with [E] on foot or in vehicle)
 *  - Tall dark-green protective security fence lining the right side of the entrance driveway
 *  - Alpha-cutout botanical trees with gentle live wind sway (shade trees, Norfolk pine, palms, bushes)
 *  - Fully walkable interiors:
 *      1) Central Porte-Cochere & Reception Lobby (open sliding doors -> rear ceremonial courtyard)
 *      2) 3-Story Modern Annex Ground-Floor VIP Guest Suite (bed, lamps, desk, AC, ceiling fan)
 *      3) Historic British-Colonial Red-Brick Wing VIP Conference Hall (terrazzo floor, teak table & chairs)
 *      4) Security Guard Post at the Main Gate
 *  - Full day/night lighting synced with Taltola Game's sky & night factor ([N])
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

const GATE_OPEN_Z = 16.85;   // Fully retracted behind right brick pier (100% clear opening on 8.2..20.0 track!)
const GATE_CLOSED_Z = 11.25; // Completely closed across the 8.45..14.05 entrance opening!

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
      // Deep inside box — push out along shallowest axis
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

export function buildKhulnaCircuitHouse(parent, m) {
  const root = new THREE.Group();
  root.name = 'KhulnaCircuitHouse_RealGLB_District';
  parent.add(root);

  // Oriented compound container matching exact Circuit House Rd alignment
  const compound = new THREE.Group();
  compound.name = 'KhulnaCircuitHouse_CompoundRoot';
  compound.position.set(ANCHOR_X, 0.015, ANCHOR_Z);
  compound.rotation.y = ROT_Y;
  compound.scale.setScalar(SCALE);
  root.add(compound);

  // Flush threshold concrete apron bridging right up to the west asphalt edge of Circuit House Rd (zero road protrusion!)
  const bridgeMat = new THREE.MeshStandardMaterial({
    color: 0x8d887e,
    map: m?.concrete?.map || null,
    roughness: 0.9,
    metalness: 0.0,
  });
  const apronBridge = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.03, 6.5), bridgeMat);
  apronBridge.name = 'CircuitHouse_RoadToFootpathApron';
  apronBridge.position.set(-26.45, 0.015, 11.25);
  apronBridge.receiveShadow = true;
  compound.add(apronBridge);

  const state = {
    loaded: false,
    gateOpen: false,      // Starts closed; automatically slides OPEN when player/vehicle approaches!
    manualHoldUntil: 0,   // Respects manual [E] toggle briefly before resuming automatic proximity sensor
    slidingGateNode: null,
    swayNodes: [],
    nightFactor: 0,
    lastTime: 0,
    nightLights: [],
    interiorLights: [],
    lightsEnabled: false,
  };

  // Architectural Night & Warm Interior Lights (attached inside local compound space for exact positioning!)
  const lightsGroup = new THREE.Group();
  lightsGroup.name = 'KhulnaCircuitHouse_Lights';
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
    const l = new THREE.PointLight(color, dayInt, distance * SCALE, 1.6);
    l.position.set(lx, ly, lz);
    l.userData.dayIntensity = dayInt;
    l.userData.nightIntensity = nightInt;
    lightsGroup.add(l);
    state.interiorLights.push(l);
    return l;
  }

  // Gate canopy overhead warm downlights + front brick wall uplight
  addNightPoint(-20.2, 4.4, 8.6, 0xffe2b0, 26, 17);
  addNightPoint(-20.2, 4.4, 12.6, 0xffe2b0, 26, 17);
  addNightPoint(-23.2, 2.2, 6.5, 0xffdfb0, 14, 11);
  // Central Portico floodlight & interior portico wash
  addNightPoint(2.0, 5.5, -6.5, 0xffffff, 22, 16);
  addNightPoint(2.0, 4.1, -11.4, 0xffeed0, 30, 20);
  // 3-Story Annex corner floodlight & illuminated rooftop sign wash
  addNightPoint(-8.1, 10.9, 4.7, 0xe8f4ff, 34, 24);
  // Driveway bollard glow cluster
  addNightPoint(-14.0, 1.2, 7.8, 0xffcc7a, 10, 12);
  // Colonial wing veranda warm wash
  addNightPoint(24.0, 3.3, -6.8, 0xffd7a3, 20, 18);

  // Always-warm interior lights inside walkable Lobby, 3-Story VIP Suite & Colonial Conference Hall
  addInteriorPoint(2.0, 4.0, -18.2, 0xfff0d6, 9, 24, 14);
  addInteriorPoint(-11.8, 3.0, -0.5, 0xffe8c2, 8, 22, 12);
  addInteriorPoint(24.0, 3.8, -13.0, 0xffebc7, 9, 24, 16);

  // Load our freshly built GTA-ready enterable Khulna Circuit House GLB!
  const loader = new GLTFLoader();
  loader.load(
    './assets/khulna_circuit_house.glb',
    (gltf) => {
      const model = gltf.scene;
      model.name = 'KhulnaCircuitHouse_GLB_Scene';

      model.traverse((obj) => {
        if (obj.name === 'Main_Sliding_Gate_Leaf') {
          state.slidingGateNode = obj;
          obj.position.z = state.gateOpen ? GATE_OPEN_Z : GATE_CLOSED_Z;
        }
        if (obj.name && obj.name.startsWith('FoliageSway_')) {
          state.swayNodes.push({
            obj,
            phase: state.swayNodes.length * 1.37,
            baseRotZ: obj.rotation.z,
            baseRotX: obj.rotation.x,
          });
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
            if (mat.map) mat.map.anisotropy = 8;
            if (mat.normalMap) mat.normalMap.anisotropy = 8;
            mat.envMapIntensity = isFoliage ? 0.55 : 0.72;
          }
          obj.castShadow = !isAO;
          obj.receiveShadow = !isAO;
        }
      });

      compound.add(model);
      state.loaded = true;
    },
    undefined,
    (err) => {
      console.error('[KhulnaCircuitHouse] Failed to load ./assets/khulna_circuit_house.glb:', err);
    }
  );

  // Precompute world gate position for proximity prompt & [E] interaction
  const gateWorldPos = localToWorld(-21.0, 1.5, 11.25);

  function syncVisibility(playerPos) {
    if (!playerPos) return;
    const dx = playerPos.x - ANCHOR_X;
    const dz = playerPos.z - ANCHOR_Z;
    const distSq = dx * dx + dz * dz;
    const vis = distSq <= 680 * 680;
    if (root.visible !== vis) root.visible = vis;

    // Activate point lights only when player is near Circuit House (keeps 60-120 FPS city-wide!)
    const nearLights = distSq <= 115 * 115;
    if (state.lightsEnabled !== nearLights) {
      state.lightsEnabled = nearLights;
      lightsGroup.visible = nearLights;
    }
  }

  function setNightFactor(nf) {
    state.nightFactor = THREE.MathUtils.clamp(nf, 0, 1);
    for (const l of state.nightLights) {
      l.intensity = l.userData.nightIntensity * state.nightFactor;
    }
    for (const l of state.interiorLights) {
      l.intensity = THREE.MathUtils.lerp(l.userData.dayIntensity, l.userData.nightIntensity, state.nightFactor);
    }
  }

  function update(time, playerPos = null) {
    const dt = state.lastTime > 0 ? Math.min(Math.max(time - state.lastTime, 0.001), 0.05) : 0.016;
    state.lastTime = time;

    if (playerPos) {
      syncVisibility(playerPos);

      // Automatic Proximity Sensor for the Mechanical Sliding Gate!
      // Starts 100% CLOSED; automatically slides fully OPEN when player/vehicle approaches within 6.8m,
      // and smoothly slides shut again once they move past 10.5m away!
      if (time >= state.manualHoldUntil) {
        const distToGate = Math.hypot(playerPos.x - gateWorldPos.x, playerPos.z - gateWorldPos.z);
        if (!state.gateOpen && distToGate <= 6.8) {
          state.gateOpen = true;
        } else if (state.gateOpen && distToGate >= 10.5) {
          state.gateOpen = false;
        }
      }
    }
    if (!root.visible) return;

    // Smooth mechanical sliding gate glide along steel floor track!
    if (state.slidingGateNode) {
      const targetZ = state.gateOpen ? GATE_OPEN_Z : GATE_CLOSED_Z;
      state.slidingGateNode.position.z += (targetZ - state.slidingGateNode.position.z) * Math.min(1, dt * 4.2);
    }

    // Gentle tropical breeze swaying botanical foliage leaf cards when nearby
    if (state.lightsEnabled && state.swayNodes.length > 0) {
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
      state.manualHoldUntil = state.lastTime + 8.0; // Hold manual [E] override for 8s
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
    // Central Reception Lobby
    if (lx >= -2.2 && lx <= 6.2 && lz >= -21.4 && lz <= -15.4) return true;
    // 3-Story Annex Ground-Floor VIP Suite
    if (lx >= -16.0 && lx <= -8.5 && lz >= -12.8 && lz <= 3.8) return true;
    // Historic Colonial Conference Hall
    if (lx >= 15.0 && lx <= 33.2 && lz >= -15.5 && lz <= -10.4) return true;
    // Guard Post
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
    if (lx < -27 || lx > 37 || lz < -35 || lz > 35) return 0;

    let ly = 0.04;
    // Raised interlocking zig-zag footpath (outside gate opening)
    if (lx >= -25.6 && lx <= -22.4 && (lz <= 8.0 || lz >= 14.5)) {
      ly = Math.max(ly, 0.16);
    }
    // Central Portico tiled floor & marble entry steps -> elevated Reception Lobby floor
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
    // Rear Ceremonial Stage platform & steps
    if (lx >= -0.9 && lx <= 4.9 && lz >= -28.8 && lz <= -25.0) {
      if (lz >= -25.8 && Math.abs(lx - 2.0) <= 1.0) {
        const t = THREE.MathUtils.clamp((-25.0 - lz) / 0.8, 0, 1);
        ly = Math.max(ly, 0.06 + t * 0.56);
      } else if (lz <= -25.7) {
        ly = Math.max(ly, 0.62);
      }
    }
    // 3-Story Annex Ground-Floor VIP Suite & entry steps
    if (lx >= -16.0 && lx <= -8.5 && lz >= -12.8 && lz <= 3.8) {
      ly = Math.max(ly, 0.62);
    } else if (lx >= -8.6 && lx <= -7.6 && lz >= -3.3 && lz <= -0.9) {
      const t = THREE.MathUtils.clamp((-7.6 - lx) / 1.0, 0, 1);
      ly = Math.max(ly, 0.05 + t * 0.57);
    }
    // Historic Colonial Red-Brick Wing Veranda & Conference Hall + center open entry steps
    if (lx >= 15.0 && lx <= 33.2 && lz >= -15.5 && lz <= -8.5) {
      ly = Math.max(ly, 0.48);
    } else if (lx >= 23.0 && lx <= 25.2 && lz >= -8.6 && lz <= -7.6) {
      const t = THREE.MathUtils.clamp((-7.6 - lz) / 1.0, 0, 1);
      ly = Math.max(ly, 0.05 + t * 0.43);
    }
    // Guard Post interior floor
    if (lx >= -21.0 && lx <= -18.8 && lz >= 2.2 && lz <= 4.5) {
      ly = Math.max(ly, 0.14);
    }
    return ly * SCALE;
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

    // 1) Street-side Perimeter Fence + 1971 Memorial Pillar + Main Gate Brick Piers
    block(-22.5, -22.0, -21.6, 4.45);  // Left/South perimeter fence
    block(-22.5, -22.0, 15.65, 33.6);  // Right/North perimeter fence
    block(-23.8, -22.5, 1.75, 3.15);   // 1971 Memorial Pillar
    block(-22.2, -21.5, 4.55, 8.45);   // Left 3D Red-Brick Gate Signage Wall
    block(-22.2, -21.5, 14.05, 15.65); // Right Slotted Red-Brick Gate Pier

    // Sliding Gate Leaf — blocks ONLY when closed! (OPEN by default so players & vehicles enter smoothly!)
    if (!state.gateOpen) {
      block(-20.4, -19.95, 8.35, 14.15);
    }

    // 2) Tall Right-Side Interior Protective Security Fence (along right edge of entrance driveway!)
    block(-21.2, 35.6, 14.35, 14.80);
    block(14.8, 15.2, 14.6, 32.0);

    // 3) Circular Landscaped Garden Island Curb (keeps cars/players cleanly circling around the garden!)
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

    // 4) Vehicles stay cleanly outside building interiors (while able to drive into compound & forecourt!)
    if (isVehicle) {
      block(-16.2, -8.3, -13.0, 4.1);   // 3-Story Annex footprint
      block(-2.4, 6.4, -21.8, -14.8);   // Reception Lobby & marble steps
      block(14.8, 33.5, -15.8, -8.3);   // Historic Colonial Wing
      block(-21.2, -18.7, 2.1, 4.6);    // Guard Post
    } else {
      // 5) PEDESTRIAN WALKABLE BUILDING COLLISIONS (All main entrances OPEN & ENTERABLE!)
      // Guard Post walls (Open rear doorway at lx = -18.85, lz = 3.4..4.4)
      block(-21.1, -20.8, 2.2, 4.5);
      block(-21.1, -18.8, 2.15, 2.40);
      block(-21.1, -18.8, 4.30, 4.55);
      block(-19.0, -18.75, 2.2, 3.35);

      // Central Reception Lobby exterior walls (Open Front Glass Doors lx=0.9..3.1 & Open Rear Arch lx=0.7..3.3!)
      block(-2.35, -2.05, -21.3, -15.5); // Left wall
      block(6.05, 6.35, -21.3, -15.5);   // Right wall
      block(-2.3, 0.85, -15.8, -15.45);  // Front wall left of open doors
      block(3.15, 6.3, -15.8, -15.45);   // Front wall right of open doors
      block(-2.3, 0.65, -21.4, -21.0);   // Rear wall left of open courtyard arch
      block(3.35, 6.3, -21.4, -21.0);    // Rear wall right of open courtyard arch
      // Reception Desk inside lobby
      block(4.2, 5.1, -19.5, -16.8);

      // 3-Story Annex Ground-Floor VIP Suite exterior walls (Open Walkable Entry at lz = -3.2..-1.0!)
      block(-16.1, -15.7, -12.8, 3.8);   // Back (-X) wall
      block(-16.0, -8.5, 3.55, 3.9);     // South (+Z) wall
      block(-16.0, -8.5, -12.9, -12.55); // North (-Z) wall
      block(-8.85, -8.45, -12.8, -3.25); // Front (+X) wall north of open door
      block(-8.85, -8.45, -0.95, 3.8);   // Front (+X) wall south of open door
      block(-15.8, -9.8, -6.35, -6.05);  // Interior partition wall (open passage on east side)

      // Historic Colonial Red-Brick Wing walls (Open Center Veranda & Double Louvered Doors at lx = 23.1..25.1!)
      block(15.0, 33.2, -15.5, -15.1);   // Rear wall
      block(14.9, 15.3, -15.4, -8.6);    // Left end wall
      block(32.9, 33.3, -15.4, -8.6);    // Right end wall
      block(15.0, 23.1, -10.65, -10.3);  // Inner veranda wall left of open center doors
      block(25.1, 33.2, -10.65, -10.3);  // Inner veranda wall right of open center doors
      block(15.0, 23.1, -8.85, -8.4);    // Outer veranda balusters left of open center bay
      block(25.1, 33.2, -8.85, -8.4);    // Outer veranda balusters right of open center bay
      // Grand 6.8m teak conference table inside hall
      block(20.6, 27.6, -13.9, -12.1);
    }

    if (moved) {
      pos.x = ANCHOR_X + SCALE * (pt.lx * COS_R + pt.lz * SIN_R);
      pos.z = ANCHOR_Z + SCALE * (-pt.lx * SIN_R + pt.lz * COS_R);
    }
  }

  return {
    root,
    compound,
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
