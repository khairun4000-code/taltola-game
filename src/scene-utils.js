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

export function mergeStaticMeshes(root, { skipPredicate = null } = {}) {
  root.updateWorldMatrix(true, true);
  const inverseRoot = root.matrixWorld.clone().invert();
  const buckets = new Map();

  const shouldSkip = (obj) => {
    if (!skipPredicate) return false;
    let cur = obj;
    while (cur && cur !== root) {
      if (skipPredicate(cur)) return true;
      cur = cur.parent;
    }
    return false;
  };

  root.traverse((object) => {
    if (!object.isMesh || object.isInstancedMesh || object.isSkinnedMesh) return;
    if (shouldSkip(object)) return;
    const mat = Array.isArray(object.material)
      ? (object.material.length === 1 ? object.material[0] : null)
      : object.material;
    if (!mat || !object.geometry || !object.geometry.attributes?.position) return;

    const transform = inverseRoot.clone().multiply(object.matrixWorld);
    let geometry = object.geometry.clone();
    geometry.clearGroups();
    geometry.morphAttributes = {};

    // De-interleave any InterleavedBufferAttribute before matrix transform / merging
    for (const attrName of Object.keys(geometry.attributes)) {
      const attr = geometry.attributes[attrName];
      if (attr && attr.isInterleavedBufferAttribute) {
        const count = attr.count;
        const itemSize = attr.itemSize;
        const out = new Float32Array(count * itemSize);
        for (let i = 0; i < count; i++) {
          for (let c = 0; c < itemSize; c++) {
            out[i * itemSize + c] = attr.getComponent(i, c);
          }
        }
        geometry.setAttribute(attrName, new THREE.BufferAttribute(out, itemSize, false));
      }
    }

    if (!mat.vertexTangents && geometry.attributes.tangent) {
      geometry.deleteAttribute('tangent');
    }

    geometry.applyMatrix4(transform);

    const attrSig = Object.keys(geometry.attributes)
      .sort()
      .map((k) => {
        const a = geometry.attributes[k];
        return `${k}:${a.itemSize}:${a.normalized ? 1 : 0}:${a.array?.constructor?.name || 'Arr'}`;
      })
      .join('|');

    const key = `${mat.uuid}-${object.castShadow}-${object.receiveShadow}-${attrSig}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        material: mat,
        cast: object.castShadow,
        receive: object.receiveShadow,
        meshes: [],
        geometries: [],
      });
    }
    const bucket = buckets.get(key);
    bucket.meshes.push(object);
    bucket.geometries.push(geometry);
  });

  for (const bucket of buckets.values()) {
    if (bucket.meshes.length < 2) {
      for (const g of bucket.geometries) g.dispose();
      const single = bucket.meshes[0];
      if (single) {
        single.matrixAutoUpdate = false;
        single.updateMatrix();
      }
      continue;
    }
    let geoms = bucket.geometries;
    const hasIndexed = geoms.some((g) => Boolean(g.index));
    const hasNonIndexed = geoms.some((g) => !g.index);
    if (hasIndexed && hasNonIndexed) {
      geoms = geoms.map((g) => {
        if (!g.index) return g;
        const ni = g.toNonIndexed();
        g.dispose();
        return ni;
      });
    }
    let geometry = null;
    try {
      geometry = mergeGeometries(geoms, false);
    } catch {
      geometry = null;
    }
    for (const g of geoms) g.dispose();
    if (!geometry) {
      for (const m of bucket.meshes) {
        m.matrixAutoUpdate = false;
        m.updateMatrix();
      }
      continue;
    }
    const mesh = new THREE.Mesh(geometry, bucket.material);
    mesh.castShadow = bucket.cast;
    mesh.receiveShadow = bucket.receive;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    for (const original of bucket.meshes) original.removeFromParent();
    root.add(mesh);
  }
}
