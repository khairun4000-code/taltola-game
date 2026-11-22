import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { box, cylinder, rodBetween, seededRandom, mergeStaticMeshes } from './scene-utils.js';
import { buildHajiMohsinRoad } from './haji-mohsin-road.js';
import { buildKhulnaCity } from './khulna-city.js';
import { buildKhulnaLandmarks } from './khulna-landmarks.js';
import { buildKhulnaCorridors } from './khulna-corridors.js';
import { buildAltapoleEnterableHouses } from './altapole-houses.js';
import { buildAltapoleHeadTower } from './altapole-tower.js';
import { buildAltapoleOppositeGoli } from './altapole-goli.js';
import { createKhulnaTraffic } from './khulna-vehicles.js';
import { buildKhulnaWildlife } from './khulna-wildlife.js';
import { applyFoliageWindShader } from './aaa-shaders.js';
import { TALTOLA_HOUSE_OFFSET } from './khulna-geo.js';

function leafClusterTexture() {
  const random = seededRandom(71513);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Subtle dark woody interior twigs radiating from cluster center for realistic silhouette depth
  ctx.strokeStyle = 'rgba(54, 42, 28, 0.85)';
  ctx.lineWidth = 3.2;
  for (let b = 0; b < 9; b++) {
    const a = (b / 9) * Math.PI * 2 + random() * 0.4;
    const r = 90 + random() * 85;
    ctx.beginPath();
    ctx.moveTo(256, 256);
    ctx.quadraticCurveTo(256 + Math.cos(a + 0.25) * r * 0.5, 256 + Math.sin(a + 0.25) * r * 0.5, 256 + Math.cos(a) * r, 256 + Math.sin(a) * r);
    ctx.stroke();
  }

  // 180 layered tropical mango / rain-tree leaves (deep shaded core -> lush sunlit outer tips!)
  for (let i = 0; i < 180; i++) {
    const isOuter = i >= 75;
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * (isOuter ? 218 : 148);
    const x = 256 + Math.cos(angle) * distance;
    const y = 256 + Math.sin(angle) * distance;
    const length = (isOuter ? 26 : 32) + random() * 38;
    const width = length * (0.28 + random() * 0.18);
    const hue = 84 + random() * 34;
    const sat = 46 + random() * 18;
    const light = (isOuter ? 24 : 15) + random() * (isOuter ? 22 : 12);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + (random() - 0.5) * 1.4);
    const gradient = ctx.createLinearGradient(0, -length * 0.5, 0, length * 0.5);
    gradient.addColorStop(0, `hsl(${hue + 4}, ${sat}%, ${light + 14}%)`);
    gradient.addColorStop(0.5, `hsl(${hue}, ${sat + 4}%, ${light}%)`);
    gradient.addColorStop(1, `hsl(${hue - 4}, ${sat}%, ${Math.max(8, light - 10)}%)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, -length * 0.5);
    ctx.bezierCurveTo(width, -length * 0.26, width * 0.92, length * 0.24, 0, length * 0.5);
    ctx.bezierCurveTo(-width * 0.92, length * 0.24, -width, -length * 0.26, 0, -length * 0.5);
    ctx.fill();

    // Crisp central midrib & delicate side veins
    ctx.strokeStyle = `hsla(${hue + 10}, 48%, ${light + 22}%, 0.58)`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, -length * 0.40);
    ctx.lineTo(0, length * 0.42);
    ctx.stroke();
    ctx.restore();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function barkTexture() {
  const random = seededRandom(51931);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#574c3b';
  ctx.fillRect(0, 0, 256, 512);
  // Vertical tropical bark ridges, fissures & subtle monsoon moss patches
  for (let i = 0; i < 160; i++) {
    const x = random() * 256;
    const y = random() * 512;
    const w = 2 + random() * 6;
    const h = 36 + random() * 140;
    const dark = random() > 0.42;
    ctx.fillStyle = dark
      ? `rgba(38, 31, 22, ${0.28 + random() * 0.32})`
      : `rgba(116, 102, 80, ${0.18 + random() * 0.24})`;
    ctx.fillRect(x, y, w, h);
  }
  for (let m = 0; m < 26; m++) {
    ctx.fillStyle = `rgba(54, 78, 38, ${0.14 + random() * 0.16})`;
    ctx.beginPath();
    ctx.ellipse(random() * 256, random() * 512, 8 + random() * 14, 14 + random() * 26, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 3);
  tex.anisotropy = 4;
  return tex;
}

const sharedBarkTex = barkTexture();
const sharedBarkMat = new THREE.MeshStandardMaterial({ color: 0x9b8e78, map: sharedBarkTex, roughness: 0.95, metalness: 0.02 });
const sharedDarkBarkMat = new THREE.MeshStandardMaterial({ color: 0x7d7260, map: sharedBarkTex, roughness: 0.96, metalness: 0.02 });

function createBroadleafTree(parent, position, height, seed, material) {
  const random = seededRandom(seed);
  const group = new THREE.Group();
  group.position.set(...position);
  parent.add(group);
  // Natural tapered trunk + subtle root flare + forked boughs
  cylinder(group, 0.11, 0.26, height * 0.68, [0, height * 0.34, 0], sharedBarkMat, 9);
  cylinder(group, 0.24, 0.38, height * 0.12, [0, height * 0.06, 0], sharedDarkBarkMat, 8);
  const clusterCount = 30;
  const clusters = [];
  for (let i = 0; i < clusterCount; i++) {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * height * 0.35;
    const yFrac = 0.52 + random() * 0.44;
    const y = height * yFrac;
    const center = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    clusters.push({ center, yFrac, scale: 1.15 + random() * 1.4 });
    if (i < 12) rodBetween(group, [0, height * 0.42, 0], [center.x * 0.84, center.y - 0.32, center.z * 0.84], 0.036 + random() * 0.026, sharedBarkMat, 6);
  }
  mergeStaticMeshes(group);
  const geometry = new THREE.PlaneGeometry(2.3, 2.1);
  const cards = new THREE.InstancedMesh(geometry, material, clusterCount * 3);
  const dummy = new THREE.Object3D();
  let index = 0;
  for (const cluster of clusters) {
    // Realistic vertical ambient occlusion: darker shaded lower canopy, sunlit brighter upper crown!
    const crownBright = 0.58 + (cluster.yFrac - 0.52) * 0.72;
    for (let j = 0; j < 3; j++) {
      dummy.position.copy(cluster.center);
      dummy.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
      dummy.scale.setScalar(cluster.scale * (0.82 + random() * 0.28));
      dummy.updateMatrix();
      cards.setMatrixAt(index, dummy.matrix);
      cards.setColorAt(index, new THREE.Color().setHSL(0.245 + random() * 0.06, 0.62 + random() * 0.12, THREE.MathUtils.clamp(crownBright + random() * 0.14, 0.46, 0.92)));
      index++;
    }
  }
  cards.castShadow = true;
  cards.receiveShadow = true;
  group.add(cards);
  return group;
}

function taperedSegment(parent, start, end, bottomRadius, topRadius, material) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(topRadius, bottomRadius, direction.length(), 10), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

function createPalm(parent, position, height, seed, m, animated) {
  const random = seededRandom(seed);
  const group = new THREE.Group();
  group.position.set(...position);
  parent.add(group);
  const leanX = (random() - 0.5) * 1.3;
  const leanZ = (random() - 0.5) * 1.3;
  const segments = 15;
  const darkBark = sharedDarkBarkMat;
  let previous = [0, 0, 0];
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const next = [leanX * t * t, height * t, leanZ * t * t];
    taperedSegment(group, previous, next, 0.19 - t * 0.065, 0.19 - t * 0.065 - 0.004, i % 2 ? m.trunk : darkBark);
    previous = next;
  }
  mergeStaticMeshes(group);
  const crown = new THREE.Group();
  crown.position.set(...previous);
  group.add(crown);
  const geometries = [];
  const rachisPoints = [];
  const frondCount = 13;
  for (let f = 0; f < frondCount; f++) {
    const angle = (f / frondCount) * Math.PI * 2 + random() * 0.25;
    const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const side = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
    const length = 3.1 + random() * 1.25;
    const lift = 0.55 + random() * 0.65;
    const droop = 0.85 + random() * 0.8;
    const positions = [];
    const colors = [];
    const indices = [];
    let vertex = 0;
    let lastCenter = new THREE.Vector3();
    for (let s = 0; s <= 18; s++) {
      const t = s / 18;
      const center = direction.clone().multiplyScalar(length * t);
      center.y = Math.sin(t * Math.PI) * lift - t * t * droop;
      if (s > 0) rachisPoints.push(lastCenter.x, lastCenter.y, lastCenter.z, center.x, center.y, center.z);
      lastCenter = center;
      if (s < 2 || s > 17) continue;
      const span = (0.18 + Math.sin(Math.PI * t) * 0.68) * (0.85 + random() * 0.25);
      for (const sign of [-1, 1]) {
        const base = center.clone();
        const tip = center.clone().add(side.clone().multiplyScalar(sign * span)).add(direction.clone().multiplyScalar(0.25 + (1 - t) * 0.25));
        tip.y -= 0.08 + t * 0.28 + random() * 0.08;
        const halfWidth = 0.026 + (1 - t) * 0.025;
        const p0 = base.clone().add(direction.clone().multiplyScalar(-halfWidth));
        const p1 = base.clone().add(direction.clone().multiplyScalar(halfWidth));
        const p2 = tip.clone().add(direction.clone().multiplyScalar(halfWidth * 0.12));
        const p3 = tip.clone().add(direction.clone().multiplyScalar(-halfWidth * 0.12));
        for (const p of [p0, p1, p2, p3]) positions.push(p.x, p.y, p.z);
        const color = new THREE.Color().setHSL(0.25 + random() * 0.045, 0.55 + random() * 0.2, 0.22 + random() * 0.13);
        for (let k = 0; k < 4; k++) colors.push(color.r, color.g, color.b);
        indices.push(vertex, vertex + 1, vertex + 2, vertex, vertex + 2, vertex + 3);
        vertex += 4;
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometries.push(geometry);
  }
  const crownGeometry = mergeGeometries(geometries);
  const leaves = new THREE.Mesh(crownGeometry, m.leaf);
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  crown.add(leaves);
  const rachisGeometry = new THREE.BufferGeometry();
  rachisGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rachisPoints, 3));
  crown.add(new THREE.LineSegments(rachisGeometry, new THREE.LineBasicMaterial({ color: 0x607a35 })));
  animated.push({ object: crown, phase: random() * Math.PI * 2, strength: 0.008 + random() * 0.008 });
}

function createWire(parent, points, radius, material) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, radius, 5, false), material);
  parent.add(mesh);
  return mesh;
}

function buildRoad(parent, m) {
  box(parent, [4.2, 0.14, 84], [0, -0.068, 0], m.road, { uvScale: 5.5, castShadow: false });
  box(parent, [34, 0.18, 86], [0, -0.39, 0], m.darkConcrete, { castShadow: false });
  for (const side of [-1, 1]) {
    const x = side * 2.36;
    box(parent, [0.5, 0.08, 84], [x, -0.32, 0], m.darkConcrete, { castShadow: false });
    box(parent, [0.08, 0.34, 84], [side * 2.09, -0.15, 0], m.concrete);
    box(parent, [0.08, 0.34, 84], [side * 2.63, -0.15, 0], m.concrete);
    box(parent, [0.35, 0.012, 83.5], [x, -0.255, 0], m.drainWater, { castShadow: false });
    box(parent, [0.12, 0.1, 84], [side * 2.02, 0.005, 0], m.concrete);
  }
  for (const z of [-31, -18, 12, 27]) {
    box(parent, [0.56, 0.09, 1.1], [-2.36, -0.02, z], m.concrete);
  }
}

function buildNeighbourhood(parent, m) {
  // North-West brick boundary wall along Haji Mohsin Rd (z = -40 to -10 north of Fakir Bari Lane)
  box(parent, [0.28, 1.55, 30], [-2.96, 0.62, -25], m.brick, { uvScale: 2.7 });
  box(parent, [0.34, 0.12, 30], [-2.96, 1.43, -25], m.concrete);
  for (let z = -39; z <= -12; z += 5.5) {
    box(parent, [0.48, 1.8, 0.48], [-2.94, 0.73, z], m.concrete);
    box(parent, [0.08, 0.42, 5.1], [-2.78, -0.05, z + 2.6], m.moss, { castShadow: false });
  }
}

function buildUtilities(parent, m, wireParent = parent, taltolaWireParent = wireParent) {
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x9a998b, roughness: 0.88, metalness: 0.04 });
  for (const z of [-16, 17]) {
    cylinder(parent, 0.105, 0.17, 9.6, [-2.42, 4.45, z], poleMaterial, 12);
    box(parent, [0.14, 0.12, 2.0], [-2.42, 8.65, z], m.darkMetal);
    for (const offset of [-0.75, -0.25, 0.25, 0.75]) {
      cylinder(parent, 0.045, 0.05, 0.18, [-2.42, 8.79, z + offset], m.lamp, 8);
    }
    rodBetween(parent, [-2.42, 7.5, z], [-2.0, 7.8, z], 0.045, m.darkMetal);
    rodBetween(parent, [-2.0, 7.8, z], [-1.82, 7.8, z + 0.5], 0.04, m.darkMetal);
    box(parent, [0.22, 0.09, 0.5], [-1.82, 7.77, z + 0.55], m.darkMetal);
  }
  for (let i = 0; i < 5; i++) {
    const x = -2.47 + i * 0.065;
    const y = 8.72 + i * 0.11;
    createWire(wireParent, [[x, y, -43], [x + 0.2, y - 0.85, -16], [x - 0.1, y - 1.0, 17], [x, y - 0.2, 43]], 0.012, m.wire);
  }
  for (let i = 0; i < 4; i++) {
    // Haji Mohsin Rd cross-cables connecting into East clinic/shop buildings and ASB gate pole
    createWire(wireParent, [[-2.42, 8.5 + i * 0.15, -16], [0.5, 7.45 + i * 0.1, -9], [4.1, 6.4 + i * 0.12, -3.4]], 0.011, m.wire);
    createWire(wireParent, [[-2.26, 7.1 + i * 0.14, 9.95], [0.0, 6.5 + i * 0.12, 16.8], [2.28, 7.2 + i * 0.14, 23.8]], 0.012, m.wire);
    createWire(wireParent, [[2.28, 6.8 + i * 0.15, 23.8], [0.2, 6.3 + i * 0.1, 22.8], [-2.95, 7.0 + i * 0.14, 21.8]], 0.012, m.wire);

    // Taltola Hospital Cross Rd utility drop cables anchored directly from footpath poles to Taltola House
    const tx = TALTOLA_HOUSE_OFFSET.x;
    const tz = TALTOLA_HOUSE_OFFSET.z;
    createWire(taltolaWireParent, [[tx - 3.92, 8.2 + i * 0.12, tz - 4], [tx + 0.9, 7.1 + i * 0.1, tz - 3.7], [tx + 5.65, 6.3 + i * 0.12, tz - 3.4]], 0.011, m.wire);
    createWire(taltolaWireParent, [[tx - 3.65, 8.2 + i * 0.12, tz + 20], [tx + 1.0, 7.4 + i * 0.1, tz + 11.8], [tx + 5.65, 6.9 + i * 0.12, tz + 3.5]], 0.011, m.wire);
  }
}

export function buildEnvironment(scene, m, renderer = null, skySystem = null) {
  const group = new THREE.Group();
  group.name = 'Lane and tropical surroundings';
  scene.add(group);
  const roadBaseGroup = new THREE.Group();
  roadBaseGroup.name = 'ExteriorRoadAndPoles';
  group.add(roadBaseGroup);
  const farGroup = new THREE.Group();
  farGroup.name = 'ExteriorFarNeighbourhood';
  group.add(farGroup);
  const detailsGroup = new THREE.Group();
  detailsGroup.name = 'ExteriorFoliageAndWires';
  group.add(detailsGroup);
  const wiresStaticGroup = new THREE.Group();
  wiresStaticGroup.name = 'ExteriorUtilityWires';
  detailsGroup.add(wiresStaticGroup);

  const tx = TALTOLA_HOUSE_OFFSET.x;
  const tz = TALTOLA_HOUSE_OFFSET.z;

  const taltolaDetailsGroup = new THREE.Group();
  taltolaDetailsGroup.name = 'TaltolaFoliageAndWires';
  group.add(taltolaDetailsGroup);
  const taltolaWiresGroup = new THREE.Group();
  taltolaWiresGroup.name = 'TaltolaUtilityWires';
  taltolaDetailsGroup.add(taltolaWiresGroup);

  buildRoad(roadBaseGroup, m);
  buildNeighbourhood(farGroup, m);
  buildUtilities(roadBaseGroup, m, wiresStaticGroup, taltolaWiresGroup);
  mergeStaticMeshes(roadBaseGroup);
  mergeStaticMeshes(farGroup);
  mergeStaticMeshes(wiresStaticGroup);
  mergeStaticMeshes(taltolaWiresGroup);

  const city = buildKhulnaCity(group, renderer, skySystem, m.shaderUniforms, m.road);
  const landmarks = buildKhulnaLandmarks(group, m);
  const tower = buildHajiMohsinRoad(group, m);
  const wildlife = buildKhulnaWildlife(group);

  const foliageMaterial = new THREE.MeshStandardMaterial({
    map: leafClusterTexture(),
    alphaTest: 0.38,
    side: THREE.DoubleSide,
    transparent: false,
    roughness: 0.72,
    metalness: 0.02,
    envMapIntensity: 0.65,
    color: 0xffffff,
  });
  applyFoliageWindShader(foliageMaterial, m.shaderUniforms);

  const animated = [];
  const zoneFoliageSlices = [];
  function makeFoliageZone(name, parentG, cx, cz, maxDist, palmCoords, treeCoords) {
    const zRoot = parentG || new THREE.Group();
    if (!parentG) {
      zRoot.name = name;
      group.add(zRoot);
    }
    const treeGroup = new THREE.Group();
    treeGroup.name = `${name}_Trees`;
    zRoot.add(treeGroup);
    for (const [x, z, height, seed] of palmCoords) {
      createPalm(zRoot, [x, 0, z], height, seed, m, animated);
    }
    for (const [x, z, height, seed] of treeCoords) {
      createBroadleafTree(treeGroup, [x, 0, z], height, seed, foliageMaterial);
    }
    mergeStaticMeshes(treeGroup);
    zoneFoliageSlices.push({ root: zRoot, cx, cz, maxDistSq: maxDist * maxDist });
    return zRoot;
  }

  // Haji Mohsin local palms & trees stay inside detailsGroup (culled at distHaji >= 190m)
  const treesStaticGroup = new THREE.Group();
  treesStaticGroup.name = 'ExteriorBroadleafTrees';
  detailsGroup.add(treesStaticGroup);
  for (const [x, z, height, seed] of [
    [-5.4, -9, 11.8, 41], [-5.2, 7.8, 12.7, 53], [-12.5, 8.2, 11.6, 65], [-5.6, -27, 12.2, 77],
  ]) createPalm(detailsGroup, [x, 0, z], height, seed, m, animated);
  for (const [x, z, height, seed] of [
    [-5.0, -1, 8.0, 211], [-5.4, 6.2, 8.8, 223], [-5.3, -17, 8.8, 227], [-14.0, 8.5, 9.5, 229], [-6.7, -33, 9.2, 233],
  ]) createBroadleafTree(treesStaticGroup, [x, 0, z], height, seed, foliageMaterial);
  mergeStaticMeshes(treesStaticGroup);

  // Per-zone foliage groups so off-screen districts cost zero GPU draw calls
  makeFoliageZone(
    'TaltolaDistrictFoliage',
    taltolaDetailsGroup,
    tx,
    tz,
    210,
    [[tx + 4.9, tz - 6.4, 10.8, 89], [tx + 5.3, tz + 6.5, 11.5, 101], [tx + 12.5, tz + 19.5, 13.1, 113], [tx - 5.4, tz - 9.0, 11.9, 125]],
    [[tx + 9.5, tz + 16.0, 8.5, 239], [tx + 15.2, tz - 11.0, 7.8, 241], [tx - 4.8, tz - 12.5, 8.2, 251]]
  );
  makeFoliageZone(
    'AliaDistrictFoliage',
    null,
    215,
    140,
    260,
    [[195, 132, 12.5, 137], [238, 146, 13.2, 149], [198, 94, 12.2, 155], [229, 95, 12.8, 163]],
    [[192, 152, 8.6, 277], [184, 134, 7.6, 283], [228, 138, 8.2, 289], [230, 88, 7.9, 291]]
  );
  makeFoliageZone(
    'CircuitHadisDistrictFoliage',
    null,
    -145,
    -690,
    480,
    [[16, -540, 12.6, 161], [66, -540, 12.8, 167], [78, -650, 12.4, 169], [78, -700, 12.6, 175], [-277, -837, 12.2, 171], [-386, -885, 13.0, 179]],
    [
      [-388, -870, 9.2, 263], [-384, -928, 9.6, 265], [-264, -858, 8.8, 269], [-276, -834, 9.0, 273],
      [15, -620, 9.4, 271], [-18, -565, 8.6, 275], [88, -555, 8.9, 279], [82, -625, 9.2, 285], [-22, -640, 8.8, 287],
    ]
  );
  makeFoliageZone(
    'PtiDistrictFoliage',
    null,
    -304,
    -57,
    250,
    [[-290, -45, 11.8, 173], [-318, -44, 12.4, 177], [-279, -68, 12.1, 181]],
    [[-295, -75, 8.8, 281], [-322, -62, 8.5, 295], [-274, -40, 8.4, 299], [-322, -24, 8.7, 303]]
  );
  makeFoliageZone(
    'RupshaDistrictFoliage',
    null,
    1080,
    320,
    460,
    [[1082, 38, 12.2, 185]],
    [[1072, 608, 9.0, 293]]
  );

  const corridorHelpers = {
    addWire(targetG, pA, pB, wireMat, sag = 0.45, radius = 0.016) {
      const mid = [(pA[0] + pB[0]) * 0.5, (pA[1] + pB[1]) * 0.5 - sag, (pA[2] + pB[2]) * 0.5];
      return createWire(targetG, [pA, mid, pB], radius, wireMat);
    },
    addBroadleafTree(targetG, x, y, z, scale = 1.0, seed = 500) {
      return createBroadleafTree(targetG || treesStaticGroup, [x, y, z], 7.8 * scale, seed, foliageMaterial);
    },
    finalizeTrees(targetG) {
      if (targetG) mergeStaticMeshes(targetG);
    },
    addPalm(targetG, x, y, z, height = 7.2, _lean = 0, s = 0) {
      return createPalm(targetG || detailsGroup, [x, y, z], height, Math.abs(Math.round((x + z) * 10 + s * 100)) + 17, m, animated);
    },
  };
  const corridors = buildKhulnaCorridors(group, m, corridorHelpers);
  const altapole = buildAltapoleEnterableHouses(group, m, corridorHelpers);
  const altapoleTower = buildAltapoleHeadTower(group, m);
  const altapoleGoli = buildAltapoleOppositeGoli(group, m, corridorHelpers);
  const traffic = createKhulnaTraffic(group);
  let lastEnvUpdateTime = null;

  function syncVisibility(playerPos = null) {
    if (!playerPos) return;
    landmarks.syncVisibility?.(playerPos);
    corridors.syncVisibility?.(playerPos);
    for (const z of zoneFoliageSlices) {
      const dx = playerPos.x - z.cx;
      const dz = playerPos.z - z.cz;
      const want = dx * dx + dz * dz <= z.maxDistSq;
      if (z.root.visible !== want) z.root.visible = want;
    }
  }

  return {
    city,
    landmarks,
    corridors,
    altapole,
    altapoleTower,
    altapoleGoli,
    traffic,
    wildlife,
    tower,
    detailsGroup,
    roadBaseGroup,
    farGroup,
    syncVisibility,
    setNightFactor(nf) {
      city.setNightFactor?.(nf);
      landmarks.setNightFactor?.(nf);
      corridors.setNightFactor(nf);
      traffic.setNightFactor(nf);
      m.setNightFactor?.(nf);
    },
    setQualityMode(qualityMode) {
      city.setQualityMode?.(qualityMode);
      landmarks.setQualityMode?.(qualityMode);
      traffic.setVisible?.(true);
    },
    setFogBounds(near, far) {
      city.setFogBounds?.(near, far);
    },
    update(time, playerPos = null, isLow = false, skipSyncVisibility = false) {
      const envDt = lastEnvUpdateTime === null ? 0.016 : THREE.MathUtils.clamp(time - lastEnvUpdateTime, 0.001, 0.05);
      lastEnvUpdateTime = time;
      m.setShaderTime?.(time);
      city.animateWater(time);
      city.updatePoles?.(envDt);
      landmarks.update(time, playerPos, skipSyncVisibility);
      if (!skipSyncVisibility) syncVisibility(playerPos);
      corridors.update(time, playerPos, true);
      traffic.update(time, playerPos);
      wildlife.update(time, playerPos);
      if (!isLow) {
        const gustEnv = 0.65 + 0.55 * Math.sin(time * 0.38);
        for (const item of animated) {
          item.object.rotation.x = Math.sin(time * 0.85 + item.phase) * item.strength * 2.2 * gustEnv;
          item.object.rotation.z = Math.cos(time * 0.68 + item.phase) * item.strength * 2.0 * gustEnv;
        }
      }
    },
  };
}
