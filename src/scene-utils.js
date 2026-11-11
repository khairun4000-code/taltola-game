import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const up = new THREE.Vector3(0, 1, 0);

export function worldUV(geometry, scale = 1) {
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const uv = geometry.attributes.uv;
  if (!uv) return geometry;
  for (let i = 0; i < position.count; i++) {
    const nx = Math.abs(normal.getX(i));
    const ny = Math.abs(normal.getY(i));
    const nz = Math.abs(normal.getZ(i));
    if (nx >= ny && nx >= nz) uv.setXY(i, position.getZ(i) / scale, position.getY(i) / scale);
    else if (ny >= nx && ny >= nz) uv.setXY(i, position.getX(i) / scale, position.getZ(i) / scale);
    else uv.setXY(i, position.getX(i) / scale, position.getY(i) / scale);
  }
  uv.needsUpdate = true;
  return geometry;
}

export function box(parent, size, position, material, options = {}) {
  const geometry = new THREE.BoxGeometry(...size);
  worldUV(geometry, options.uvScale ?? material.userData.uvScale ?? 1);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  parent.add(mesh);
  return mesh;
}

export function cylinder(parent, radiusTop, radiusBottom, height, position, material, segments = 12) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function rodBetween(parent, start, end, radius, material, segments = 8) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), segments), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(up, direction.normalize());
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

export function facadeShape(parent, shape, x, material, z = 0, y = 0) {
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateY(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

export function polygonShape(points) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1]);
  shape.closePath();
  return shape;
}

export function seededRandom(seed = 1234567) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function mergeStaticMeshes(root) {
  root.updateWorldMatrix(true, true);
  const inverseRoot = root.matrixWorld.clone().invert();
  const buckets = new Map();
  root.traverse((object) => {
    if (!object.isMesh || object.isInstancedMesh || Array.isArray(object.material)) return;
    const key = `${object.material.uuid}-${object.castShadow}-${object.receiveShadow}`;
    if (!buckets.has(key)) buckets.set(key, { material: object.material, cast: object.castShadow, receive: object.receiveShadow, meshes: [], geometries: [] });
    const bucket = buckets.get(key);
    const transform = inverseRoot.clone().multiply(object.matrixWorld);
    const geometry = object.geometry.clone().applyMatrix4(transform);
    geometry.clearGroups();
    bucket.meshes.push(object);
    bucket.geometries.push(geometry);
  });
  for (const bucket of buckets.values()) {
    if (bucket.meshes.length < 2) continue;
    const geometry = mergeGeometries(bucket.geometries, false);
    if (!geometry) throw new Error('Static geometry batching failed');
    const mesh = new THREE.Mesh(geometry, bucket.material);
    mesh.castShadow = bucket.cast;
    mesh.receiveShadow = bucket.receive;
    for (const original of bucket.meshes) original.removeFromParent();
    root.add(mesh);
  }
}
