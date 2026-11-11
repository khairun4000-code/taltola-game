import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { box, cylinder, rodBetween, seededRandom, mergeStaticMeshes } from './scene-utils.js';
import { buildHajiMohsinRoad } from './haji-mohsin-road.js';

function leafClusterTexture() {
  const random = seededRandom(71513);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < 95; i++) {
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * 205;
    const x = 256 + Math.cos(angle) * distance;
    const y = 256 + Math.sin(angle) * distance;
    const length = 28 + random() * 42;
    const width = length * (0.32 + random() * 0.2);
    const hue = 83 + random() * 32;
    const light = 20 + random() * 22;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(random() * Math.PI * 2);
    const gradient = ctx.createLinearGradient(0, -length / 2, 0, length / 2);
    gradient.addColorStop(0, `hsl(${hue}, 48%, ${light + 12}%)`);
    gradient.addColorStop(0.55, `hsl(${hue}, 52%, ${light}%)`);
    gradient.addColorStop(1, `hsl(${hue}, 48%, ${Math.max(10, light - 8)}%)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, -length / 2);
    ctx.bezierCurveTo(width, -length * 0.28, width, length * 0.23, 0, length / 2);
    ctx.bezierCurveTo(-width, length * 0.23, -width, -length * 0.28, 0, -length / 2);
    ctx.fill();
    ctx.strokeStyle = `hsla(${hue + 8}, 45%, ${light + 18}%, .65)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -length * 0.38);
    ctx.lineTo(0, length * 0.4);
    ctx.stroke();
    ctx.restore();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createBroadleafTree(parent, position, height, seed, material) {
  const random = seededRandom(seed);
  const group = new THREE.Group();
  group.position.set(...position);
  parent.add(group);
  cylinder(group, 0.11, 0.23, height * 0.68, [0, height * 0.34, 0], new THREE.MeshStandardMaterial({ color: 0x625c46, roughness: 1 }), 9);
  const clusterCount = 24;
  const clusters = [];
  for (let i = 0; i < clusterCount; i++) {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * height * 0.32;
    const y = height * (0.55 + random() * 0.4);
    const center = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    clusters.push({ center, scale: 1.2 + random() * 1.35 });
    if (i < 10) rodBetween(group, [0, height * 0.43, 0], [center.x * 0.83, center.y - 0.35, center.z * 0.83], 0.035 + random() * 0.025, group.children[0].material, 6);
  }
  mergeStaticMeshes(group);
  const geometry = new THREE.PlaneGeometry(2.2, 2.0);
  const cards = new THREE.InstancedMesh(geometry, material, clusterCount * 3);
  const dummy = new THREE.Object3D();
  let index = 0;
  for (const cluster of clusters) {
    for (let j = 0; j < 3; j++) {
      dummy.position.copy(cluster.center);
      dummy.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
      dummy.scale.setScalar(cluster.scale * (0.8 + random() * 0.3));
      dummy.updateMatrix();
      cards.setMatrixAt(index, dummy.matrix);
      cards.setColorAt(index, new THREE.Color().setHSL(0.25 + random() * 0.055, 0.65, 0.72 + random() * 0.18));
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
  const darkBark = new THREE.MeshStandardMaterial({ color: 0x595642, roughness: 1 });
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
  box(parent, [4.2, 0.14, 84], [0, -0.07, 0], m.road, { uvScale: 5.5, castShadow: false });
  box(parent, [34, 0.18, 100], [0, -0.39, 0], m.darkConcrete, { castShadow: false });
  for (const side of [-1, 1]) {
    const x = side * 2.36;
    box(parent, [0.5, 0.08, 84], [x, -0.32, 0], m.darkConcrete, { castShadow: false });
    box(parent, [0.08, 0.34, 84], [side * 2.09, -0.15, 0], m.concrete);
    box(parent, [0.08, 0.34, 84], [side * 2.63, -0.15, 0], m.concrete);
    box(parent, [0.35, 0.012, 83.5], [x, -0.255, 0], m.drainWater, { castShadow: false });
    box(parent, [0.12, 0.1, 84], [side * 2.02, 0.005, 0], m.concrete);
  }
  box(parent, [1.0, 0.14, 4.75], [2.34, 0.01, 0], m.concrete);
  for (const z of [-31, -18, 12, 27]) {
    box(parent, [0.56, 0.09, 1.1], [-2.36, -0.02, z], m.concrete);
  }
  const random = seededRandom(8182);
  const leafGeometry = new THREE.PlaneGeometry(0.09, 0.18);
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x776a37, roughness: 1, side: THREE.DoubleSide });
  const debris = new THREE.InstancedMesh(leafGeometry, leafMaterial, 95);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 95; i++) {
    dummy.position.set((random() - 0.5) * 3.9, 0.013, (random() - 0.5) * 78);
    dummy.rotation.set(-Math.PI / 2 + (random() - 0.5) * 0.15, 0, random() * Math.PI * 2);
    dummy.scale.setScalar(0.5 + random());
    dummy.updateMatrix();
    debris.setMatrixAt(i, dummy.matrix);
  }
  debris.receiveShadow = true;
  parent.add(debris);
}

function buildNeighbourhood(parent, m) {
  // North-West brick boundary wall (z = -42 to -10; south of -10 is Haji Mohsin Road & Fakir Bari Lane)
  box(parent, [0.28, 1.55, 32], [-2.96, 0.62, -26], m.brick, { uvScale: 2.7 });
  box(parent, [0.34, 0.12, 32], [-2.96, 1.43, -26], m.concrete);
  for (let z = -40; z <= -12; z += 5.5) {
    box(parent, [0.48, 1.8, 0.48], [-2.94, 0.73, z], m.concrete);
    box(parent, [0.08, 0.42, 5.1], [-2.78, -0.05, z + 2.6], m.moss, { castShadow: false });
  }
  // North-East boundary wall (side = -1: z = -41 to -7.3; side = +1 is now the Haji Mohsin Road commercial & ASB block!)
  const center = -24;
  box(parent, [0.27, 1.85, 33.8], [2.78, 0.75, center], m.concrete);
  box(parent, [0.08, 0.4, 33.8], [2.61, -0.02, center], m.moss, { castShadow: false });
  for (let z = 7; z <= 41; z += 5.7) {
    box(parent, [0.44, 2.08, 0.44], [2.77, 0.86, -z], m.darkConcrete);
  }
  box(parent, [0.4, 0.13, 34], [2.78, 1.71, center], m.darkConcrete);

  const distant = new THREE.MeshStandardMaterial({ color: 0xc8c3af, roughness: 0.95 });
  box(parent, [9, 8, 13], [10, 3.7, -35], distant);
  box(parent, [8, 5, 12], [-9, 2.2, -35], distant);
}

function buildUtilities(parent, m) {
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x9a998b, roughness: 0.93 });
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
    createWire(parent, [[x, y, -43], [x + 0.2, y - 0.85, -16], [x - 0.1, y - 1.0, 17], [x, y - 0.2, 43]], 0.012, m.wire);
  }
  for (let i = 0; i < 4; i++) {
    createWire(parent, [[-2.42, 8.5 + i * 0.15, -16], [0.5, 7.45 + i * 0.1, -9], [5.65, 6.3 + i * 0.12, -3.4]], 0.011, m.wire);
    createWire(parent, [[-2.42, 8.55 + i * 0.13, 17], [0.8, 7.6 + i * 0.1, 11], [5.65, 6.9 + i * 0.12, 3.5]], 0.011, m.wire);
    // Overhead criss-cross fiber/electric cables across Haji Mohsin Road (connecting ASB pole z=23.8 & corner poles z=9.5..21.8)
    createWire(parent, [[-2.26, 7.1 + i * 0.14, 9.95], [0.0, 6.5 + i * 0.12, 16.8], [2.28, 7.2 + i * 0.14, 23.8]], 0.012, m.wire);
    createWire(parent, [[2.28, 6.8 + i * 0.15, 23.8], [0.2, 6.3 + i * 0.1, 22.8], [-2.95, 7.0 + i * 0.14, 21.8]], 0.012, m.wire);
  }
}

export function buildEnvironment(scene, m) {
  const group = new THREE.Group();
  group.name = 'Lane and tropical surroundings';
  scene.add(group);
  buildRoad(group, m);
  buildNeighbourhood(group, m);
  buildUtilities(group, m);
  mergeStaticMeshes(group);
  const tower = buildHajiMohsinRoad(group, m);
  const animated = [];
  const palms = [
    [-5.4, -9, 11.8, 41], [-5.2, 7.8, 12.7, 53], [-12.5, 8.2, 11.6, 65], [-5.6, -27, 12.2, 77],
    [4.9, -6.4, 10.8, 89], [5.3, 6.5, 11.5, 101], [12.5, 19.5, 13.1, 113], [9.5, -18, 12.1, 125],
  ];
  for (const [x, z, height, seed] of palms) createPalm(group, [x, 0, z], height, seed, m, animated);
  const foliageMaterial = new THREE.MeshStandardMaterial({
    map: leafClusterTexture(),
    alphaTest: 0.38,
    side: THREE.DoubleSide,
    roughness: 0.88,
    color: 0xffffff,
  });
  const trees = [
    [-5.0, -1, 8.0, 211], [-5.4, 6.2, 8.8, 223], [-5.3, -17, 8.8, 227], [-14.0, 8.5, 9.5, 229],
    [-6.7, -33, 9.2, 233], [9.5, 16.0, 8.5, 239], [6.3, -11, 7.4, 241], [12.0, 35, 9.5, 251],
  ];
  for (const [x, z, height, seed] of trees) createBroadleafTree(group, [x, 0, z], height, seed, foliageMaterial);
  return {
    tower,
    update(time) {
      for (const item of animated) {
        item.object.rotation.x = Math.sin(time * 0.55 + item.phase) * item.strength;
        item.object.rotation.z = Math.cos(time * 0.43 + item.phase) * item.strength;
      }
    },
  };
}
