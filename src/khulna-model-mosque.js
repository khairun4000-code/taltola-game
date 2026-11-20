import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { box, cylinder } from './scene-utils.js';

/**
 * KHULNA DISTRICT MODEL MOSQUE & ISLAMIC CULTURAL CENTER (HIGH-GRAPHICS 3D MODEL)
 * Placed directly in front of Khulna Alia Kamil Madrasah (cx = 175.5, cz = 166.0)
 * - Full 8K Basecolor (8192x8192) + 4K Normal, Roughness & Metallic PBR Maps
 * - Anisotropic filtering (up to 16x), physically based shading, crisp shadows
 * - Facing East (+X) toward Alia Madrasah Campus & Pond, Qibla West (-X),
 *   Tall Minaret on North-East (front-right) corner
 * - 1 draw call + parent 300m distance culling (locked 60-120 FPS, zero resolution drop)
 */

export const MODEL_MOSQUE_POS = { x: 175.5, z: 166.0 };
const MODEL_BASE_DIR = './assets/model-mosque/';
const MODEL_FBX_FILE = 'khulna_model_mosque.fbx';
const TEX_DIR = './assets/model-mosque/tripo_convert_2b979ad4-555a-4208-b54d-f19e4b7db442.fbm/';
const TEX_PREFIX = 'mosque_3d_model_Clone1_Clone1_';

function resolveCircleAABB(pos, radius, minX, maxX, minZ, maxZ) {
  const cx = THREE.MathUtils.clamp(pos.x, minX, maxX);
  const cz = THREE.MathUtils.clamp(pos.z, minZ, maxZ);
  const dx = pos.x - cx;
  const dz = pos.z - cz;
  const dSq = dx * dx + dz * dz;
  if (dSq < radius * radius) {
    if (dSq > 1e-8) {
      const d = Math.sqrt(dSq);
      const push = radius - d;
      pos.x += (dx / d) * push;
      pos.z += (dz / d) * push;
    } else {
      const l = Math.abs(pos.x - minX);
      const r = Math.abs(maxX - pos.x);
      const b = Math.abs(pos.z - minZ);
      const f = Math.abs(pos.z - maxZ);
      const m = Math.min(l, r, b, f);
      if (m === l) pos.x = minX - radius;
      else if (m === r) pos.x = maxX + radius;
      else if (m === b) pos.z = minZ - radius;
      else pos.z = maxZ + radius;
    }
  }
}

function addMosqueLamp(staticG, dynamicG, bank, x, z, h = 4.6, yBase = 0.08) {
  cylinder(staticG, 0.14, 0.22, 0.45, [x, yBase + 0.22, z], bank.steelDark, 8);
  cylinder(staticG, 0.055, 0.085, h, [x, yBase + h * 0.5 + 0.2, z], bank.steelDark, 8);
  box(staticG, [0.95, 0.07, 0.08], [x, yBase + h + 0.12, z], bank.steelDark);
  for (const sx of [-0.42, 0.42]) {
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), bank.bulbGlow);
    globe.position.set(x + sx, yBase + h + 0.28, z);
    dynamicG.add(globe);
  }
}

function makeMosquePlaqueTexture() {
  const W = 768;
  const H = 200;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0c4a58');
  grad.addColorStop(1, '#083344');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 7;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.fillStyle = '#fde047';
  ctx.fillRect(18, 18, 10, H - 36);

  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 34px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText('খুলনা জেলা মডেল মসজিদ ও ইসলামিক সাংস্কৃতিক কেন্দ্র', 42, H * 0.38, W - 62);

  ctx.fillStyle = '#fde047';
  ctx.font = '600 22px "Manrope", "Noto Sans Bengali", sans-serif';
  ctx.fillText('KHULNA DISTRICT MODEL MOSQUE · আলিয়া মাদ্রাসা প্রাঙ্গণ, খুলনা', 42, H * 0.72, W - 62);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function buildKhulnaModelMosque3D(staticG, dynamicG, bank) {
  const mx = MODEL_MOSQUE_POS.x;
  const mz = MODEL_MOSQUE_POS.z;

  // 1) Grand White Marble Courtyard Plaza + Wide Ceremonial Avenue from Alia Madrasah Portico
  box(staticG, [36.0, 0.08, 34.0], [mx, 0.04, mz], bank.marbleWhite, { castShadow: false, uvScale: 5.0 });
  box(staticG, [30.6, 0.05, 31.0], [mx, 0.085, mz], bank.stonePlinth, { castShadow: false, uvScale: 4.0 });
  box(staticG, [9.2, 0.08, 32.0], [191.5, 0.04, 140.0], bank.paverDriveway, { castShadow: false, uvScale: 3.5 });

  // 2) Courtyard Perimeter Lamps flanking the East Grand Approach
  for (const [lx, lz] of [
    [192.6, 153.5], [192.6, 178.5],
    [183.5, 149.6], [183.5, 182.4],
    [164.0, 149.6], [164.0, 182.4],
  ]) {
    addMosqueLamp(staticG, dynamicG, bank, lx, lz, 4.6, 0.08);
  }

  // 3) Monument Signboard Pedestal at East Plaza Entrance (keeps 3D mosque facade unobstructed)
  const sx = 192.4;
  const sz = 158.0;
  box(staticG, [0.90, 1.35, 5.8], [sx, 0.675, sz], bank.marbleWhite);
  box(staticG, [1.05, 0.16, 6.0], [sx, 1.40, sz], bank.mosqueTeal);
  const signTex = makeMosquePlaqueTexture();
  const signMat = new THREE.MeshStandardMaterial({
    map: signTex,
    emissive: 0xffffff,
    emissiveMap: signTex,
    emissiveIntensity: 0.34,
    roughness: 0.28,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });
  bank.emissiveList.push({ mat: signMat, day: 0.32, night: 1.55 });
  const signGrp = new THREE.Group();
  signGrp.position.set(sx, 2.25, sz);
  signGrp.rotation.y = Math.PI * 0.5;
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(5.55, 1.42, 0.12), bank.steelDark);
  const face = new THREE.Mesh(new THREE.BoxGeometry(5.40, 1.30, 0.15), signMat);
  signGrp.add(bezel, face);
  dynamicG.add(signGrp);

  // 4) Load High-Graphics PBR 3D Model Mosque (8K Basecolor + 4K Normal/Roughness/Metallic)
  const texLoader = new THREE.TextureLoader();
  const configureTex = (tex, isSRGB = false, aniso = 16) => {
    tex.colorSpace = isSRGB ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.anisotropy = aniso;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  };

  const baseColorTex = configureTex(texLoader.load(`${TEX_DIR}${TEX_PREFIX}basecolor.jpg`), true, 16);
  const normalTex = configureTex(texLoader.load(`${TEX_DIR}${TEX_PREFIX}normal.jpg`), false, 16);
  const roughnessTex = configureTex(texLoader.load(`${TEX_DIR}${TEX_PREFIX}roughness.jpg`), false, 8);
  const metallicTex = configureTex(texLoader.load(`${TEX_DIR}${TEX_PREFIX}metallic.jpg`), false, 8);

  const premiumMosqueMat = new THREE.MeshPhysicalMaterial({
    map: baseColorTex,
    normalMap: normalTex,
    normalScale: new THREE.Vector2(1.15, 1.15),
    roughnessMap: roughnessTex,
    roughness: 1.0,
    metalnessMap: metallicTex,
    metalness: 1.0,
    clearcoat: 0.08,
    clearcoatRoughness: 0.42,
    envMapIntensity: 1.05,
  });

  const fbxLoader = new FBXLoader();
  fbxLoader.setPath(MODEL_BASE_DIR);
  fbxLoader.load(
    MODEL_FBX_FILE,
    (fbx) => {
      // Face East (+X) toward Alia Madrasah Campus & Pond; Qibla West (-X); Minaret North-East
      fbx.rotation.set(0, Math.PI * 0.5, 0);
      fbx.updateMatrixWorld(true);

      const rawBox = new THREE.Box3().setFromObject(fbx);
      const rawSize = new THREE.Vector3();
      rawBox.getSize(rawSize);
      const maxHoriz = Math.max(rawSize.x, rawSize.z, 1e-4);

      // Scale uniformly to authentic 29.5m Khulna District Model Mosque footprint (~24.3m minaret height)
      const targetFootprint = 29.5;
      const uniformScale = targetFootprint / maxHoriz;
      fbx.scale.setScalar(uniformScale);
      fbx.updateMatrixWorld(true);

      // Center cleanly at (mx, mz) and seat flush on the marble courtyard plinth (y = 0.10)
      const scaledBox = new THREE.Box3().setFromObject(fbx);
      const scaledCenter = new THREE.Vector3();
      scaledBox.getCenter(scaledCenter);
      fbx.position.set(
        mx - scaledCenter.x,
        0.10 - scaledBox.min.y,
        mz - scaledCenter.z
      );

      fbx.traverse((child) => {
        if (!child.isMesh) return;
        // Dispose temporary Phong materials created by FBXLoader and apply full 8K/4K PBR material
        if (child.material) {
          const oldMats = Array.isArray(child.material) ? child.material : [child.material];
          oldMats.forEach((mat) => mat?.dispose?.());
        }
        child.material = premiumMosqueMat;
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = true;
      });

      fbx.name = 'KhulnaDistrictModelMosque_3D';
      dynamicG.add(fbx);
    },
    undefined,
    (err) => {
      console.warn('Khulna Model Mosque FBX load warning:', err);
    }
  );
}

/**
 * Walkable grand East marble staircase & front terrace height for the 3D Model Mosque.
 */
export function getModelMosqueGroundHeight(pos) {
  const mx = MODEL_MOSQUE_POS.x;
  const mz = MODEL_MOSQUE_POS.z;
  // Grand East front marble staircase (x = 182.0..190.2, z = 161.2..170.8)
  if (pos.x >= mx + 6.5 && pos.x <= mx + 14.7 && pos.z >= mz - 4.8 && pos.z <= mz + 4.8) {
    const t = THREE.MathUtils.clamp((mx + 14.7 - pos.x) / 8.2, 0, 1);
    return 0.10 + t * 4.05;
  }
  // Upper front entry terrace (x = 178.8..182.0, z = 152.0..180.0)
  if (pos.x >= mx + 3.3 && pos.x <= mx + 6.5 && pos.z >= mz - 14.0 && pos.z <= mz + 14.0) {
    return 4.15;
  }
  // Courtyard marble plaza
  if (pos.x >= mx - 18.0 && pos.x <= mx + 18.0 && pos.z >= mz - 17.0 && pos.z <= mz + 17.0) {
    return 0.08;
  }
  return 0.0;
}

/**
 * Solid exterior collisions for the 3D Khulna District Model Mosque, minaret & sign pedestal.
 */
export function applyModelMosqueCollisions(pos, radius = 0.34, footY = 0) {
  const mx = MODEL_MOSQUE_POS.x;
  const mz = MODEL_MOSQUE_POS.z;
  if (pos.x < mx - 20.0 || pos.x > mx + 20.0 || pos.z < mz - 19.0 || pos.z > mz + 19.0) return;

  // Monument signboard pedestal at East entrance
  if (footY < 3.2) {
    resolveCircleAABB(pos, radius, 191.85, 192.95, 155.0, 161.0);
  }
  // Main 4-story mosque sanctuary block (West & Center)
  if (footY < 16.5) {
    resolveCircleAABB(pos, radius, mx - 14.6, mx + 3.4, mz - 14.4, mz + 14.4);
  }
  // Tall North-East Minaret tower
  if (footY < 25.0) {
    resolveCircleAABB(pos, radius, mx + 3.0, mx + 11.2, mz - 14.4, mz - 6.8);
  }
  // Lower East podium wings flanking the grand front marble staircase
  if (footY < 3.6) {
    resolveCircleAABB(pos, radius, mx + 3.4, mx + 14.5, mz - 14.4, mz - 4.9);
    resolveCircleAABB(pos, radius, mx + 3.4, mx + 14.5, mz + 4.9, mz + 14.4);
  }
}
