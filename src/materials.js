import * as THREE from 'three';
import {
  attachDerivedPBRMaps,
  upgradeWetAsphaltMaterial,
  applyFoliageWindShader,
  applyWireWindShader,
} from './aaa-shaders.js';

function diffTexture(loader, name, anisotropy) {
  const texture = loader.load(`./assets/${name}-diff.jpg`);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function tiledMaterial(diffMap, options = {}) {
  const roughness = options.roughness ?? 0.82;
  const material = new THREE.MeshStandardMaterial({
    map: diffMap,
    color: options.color ?? 0xffffff,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissive ? (options.emissiveIntensity ?? 0.55) : 0.0,
    roughness,
    metalness: options.metalness ?? 0.02,
    envMapIntensity: options.envMapIntensity ?? 0.72,
    side: options.side ?? THREE.FrontSide,
  });
  material.userData.uvScale = options.uvScale ?? 2;
  material.userData.origBumpMap = diffMap;
  if (options.derivePBR !== false) {
    attachDerivedPBRMaps(material, diffMap, {
      strength: options.normalStrength ?? 2.1,
      roughBase: roughness,
      roughSpread: options.roughSpread ?? 0.20,
      normalScale: options.normalScale ?? 0.78,
    });
  }
  return material;
}

function createCourtyardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b9b4a6';
  ctx.fillRect(0, 0, 256, 256);
  const colors = ['#d6d1bf', '#9e4131', '#283b3a', '#d2a56f'];
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const cx = x * 64 + 32;
      const cy = y * 64 + 32;
      ctx.strokeStyle = '#77766e';
      ctx.lineWidth = 2;
      ctx.strokeRect(x * 64 + 1, y * 64 + 1, 62, 62);
      for (let ring = 0; ring < 3; ring++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);
        ctx.strokeStyle = colors[(x + y + ring) % colors.length];
        ctx.lineWidth = 3;
        const size = 21 - ring * 5;
        ctx.strokeRect(-size / 2, -size / 2, size, size);
        ctx.restore();
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createPillarTileTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e8dfd0';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const px = x * 64;
      const py = y * 64;
      ctx.fillStyle = (x + y) % 2 === 0 ? '#f3ece0' : '#ebe2d3';
      ctx.fillRect(px + 2, py + 2, 60, 60);
      ctx.strokeStyle = '#c8beab';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 1, py + 1, 62, 62);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createBathTileTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#cce7ec';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const px = x * 32;
      const py = y * 32;
      ctx.fillStyle = (x + y) % 2 === 0 ? '#e3f4f7' : '#d2ecf0';
      ctx.fillRect(px + 1, py + 1, 30, 30);
      ctx.strokeStyle = '#9dc6cf';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 0.5, py + 0.5, 31, 31);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createTVScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 288;
  const ctx = canvas.getContext('2d');

  // Vibrant scenic nature & stadium broadcast on the Smart TV screen
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 175);
  skyGrad.addColorStop(0, '#0c4a6e');
  skyGrad.addColorStop(0.55, '#0284c7');
  skyGrad.addColorStop(1, '#bae6fd');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 512, 175);

  // Glowing sun & clouds
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(390, 58, 28, 0, Math.PI * 2);
  ctx.fill();

  // Distant mountains
  ctx.fillStyle = '#1e3a5f';
  ctx.beginPath();
  ctx.moveTo(0, 175);
  ctx.lineTo(95, 92);
  ctx.lineTo(195, 148);
  ctx.lineTo(310, 78);
  ctx.lineTo(430, 142);
  ctx.lineTo(512, 105);
  ctx.lineTo(512, 175);
  ctx.closePath();
  ctx.fill();

  // Lush green field / river foreground
  const landGrad = ctx.createLinearGradient(0, 170, 0, 244);
  landGrad.addColorStop(0, '#15803d');
  landGrad.addColorStop(1, '#166534');
  ctx.fillStyle = landGrad;
  ctx.fillRect(0, 170, 512, 74);

  // Top-right LIVE HD channel badge
  ctx.fillStyle = 'rgba(220, 38, 38, 0.92)';
  ctx.fillRect(30, 20, 68, 26);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px Arial';
  ctx.fillText('● LIVE', 38, 38);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  ctx.fillRect(104, 20, 95, 26);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('SOMOY 4K', 114, 38);

  // Bottom broadcast news ticker bar (clearly recognizable as a Television!)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 236, 512, 52);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 236, 118, 52);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 17px Arial';
  ctx.fillText('BREAKING', 16, 268);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('খুলনা তালতলা লাইভ টিভি · SMART LED TV HD', 132, 268);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createWallArtTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 256, 160);
  grad.addColorStop(0, '#134e4a');
  grad.addColorStop(0.5, '#0f766e');
  grad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 160);
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.arc(185, 52, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#042f2e';
  ctx.fillRect(0, 112, 256, 48);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 248, 152);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createFurnitureWoodTexture(baseHex = '#6e4023', darkHex = '#432512') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 80; i++) {
    const y = (i / 80) * 256;
    ctx.strokeStyle = i % 2 === 0 ? darkHex : 'rgba(255,225,190,0.08)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(85, y + Math.sin(i) * 6, 170, y - Math.cos(i) * 6, 256, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createQuiltedClothTexture(baseHex = '#1e5666', seamHex = '#11333d') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = seamHex;
  ctx.lineWidth = 3;
  for (let y = 0; y <= 256; y += 64) {
    for (let x = 0; x <= 256; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, y - 32);
      ctx.lineTo(x + 32, y);
      ctx.lineTo(x, y + 32);
      ctx.lineTo(x - 32, y);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = seamHex;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createCarpetRugTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#8c2d27';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 8;
  ctx.strokeRect(12, 12, 232, 232);
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 10;
  ctx.strokeRect(26, 26, 204, 204);
  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.ellipse(128, 128, 55, 38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fde68a';
  ctx.lineWidth = 4;
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createMaterials(renderer, manager) {
  const loader = new THREE.TextureLoader(manager);
  const anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  const sharedUniforms = {
    uTime: { value: 0 },
  };
  const asphalt = diffTexture(loader, 'asphalt', anisotropy);
  const brick = diffTexture(loader, 'brick', anisotropy);
  const plaster = diffTexture(loader, 'plaster', anisotropy);
  const concrete = diffTexture(loader, 'concrete', anisotropy);
  const courtyard = createCourtyardTexture();
  const pillarTile = createPillarTileTexture();
  const bathTile = createBathTileTexture();
  const tvScreen = createTVScreenTexture();
  const wallArt = createWallArtTexture();
  const woodTex = createFurnitureWoodTexture('#6e4023', '#432512');
  const darkWoodTex = createFurnitureWoodTexture('#3d2314', '#221209');
  const sofaTex = createQuiltedClothTexture('#1e5666', '#0f313b');
  const cushionTex = createQuiltedClothTexture('#e09f3e', '#9c6818');
  const rugTex = createCarpetRugTexture();

  const materials = {
    road: tiledMaterial(asphalt, { color: 0xcdcbc4, uvScale: 5.5, roughness: 0.78, normalStrength: 2.3, normalScale: 0.72 }),
    brick: tiledMaterial(brick, { color: 0xc97b63, uvScale: 2.3, roughness: 0.88, normalStrength: 3.1, normalScale: 0.92 }),
    plaster: tiledMaterial(plaster, { color: 0xf4ead8, uvScale: 3.4, roughness: 0.84, normalStrength: 1.6, normalScale: 0.55 }),
    warmPlaster: tiledMaterial(plaster, { color: 0xe6dac8, emissive: 0x221e18, emissiveIntensity: 0.50, uvScale: 3.0, roughness: 0.82, normalStrength: 1.5, normalScale: 0.52 }),
    whiteBand: tiledMaterial(plaster, { color: 0xf7f6f2, uvScale: 2.8, roughness: 0.72, normalStrength: 1.3, normalScale: 0.45 }),
    concrete: tiledMaterial(concrete, { color: 0xd7d4c8, uvScale: 3.2, roughness: 0.88, normalStrength: 2.5, normalScale: 0.82 }),
    trim: tiledMaterial(plaster, { color: 0xe5dcc4, uvScale: 2.8, roughness: 0.74, normalStrength: 1.4, normalScale: 0.50 }),
    wall: tiledMaterial(plaster, { color: 0xece3d2, uvScale: 2.4, roughness: 0.84, normalStrength: 1.6, normalScale: 0.55 }),
    darkConcrete: tiledMaterial(concrete, { color: 0x7c837c, uvScale: 2.5, roughness: 0.90, normalStrength: 2.6, normalScale: 0.85 }),
    pillarTile: new THREE.MeshStandardMaterial({
      map: pillarTile,
      emissive: 0x353128,
      emissiveIntensity: 0.42,
      roughness: 0.28,
      metalness: 0.05,
      envMapIntensity: 0.95,
      side: THREE.DoubleSide,
    }),
    bathTile: new THREE.MeshStandardMaterial({
      map: bathTile,
      emissive: 0x2c3e42,
      emissiveIntensity: 0.42,
      roughness: 0.22,
      metalness: 0.05,
      envMapIntensity: 1.0,
      side: THREE.DoubleSide,
    }),
    blackTile: new THREE.MeshPhysicalMaterial({ color: 0x1a1917, roughness: 0.16, metalness: 0.08, clearcoat: 0.75, clearcoatRoughness: 0.12, envMapIntensity: 1.25 }),
    gate: new THREE.MeshStandardMaterial({ color: 0x6f8486, roughness: 0.36, metalness: 0.68, envMapIntensity: 1.1 }),
    gateInset: new THREE.MeshStandardMaterial({ color: 0x45585a, roughness: 0.44, metalness: 0.58, envMapIntensity: 0.95 }),
    orange: new THREE.MeshStandardMaterial({ color: 0xb85224, roughness: 0.52, metalness: 0.18, envMapIntensity: 0.78 }),
    rail: new THREE.MeshStandardMaterial({ color: 0xdce3df, roughness: 0.22, metalness: 0.88, envMapIntensity: 1.35 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: 0x1e2423, roughness: 0.42, metalness: 0.72, envMapIntensity: 0.92 }),
    aluminum: new THREE.MeshStandardMaterial({ color: 0xd6ded9, emissive: 0x141817, emissiveIntensity: 0.25, roughness: 0.26, metalness: 0.85, envMapIntensity: 1.3 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x67a69c, roughness: 0.07, metalness: 0.10, clearcoat: 0.95, clearcoatRoughness: 0.06, envMapIntensity: 1.65, transparent: true, opacity: 0.42 }),
    frostedGlass: new THREE.MeshPhysicalMaterial({ color: 0xa2bcc0, roughness: 0.34, metalness: 0.05, clearcoat: 0.4, envMapIntensity: 1.15, transparent: true, opacity: 0.66 }),
    interior: new THREE.MeshStandardMaterial({ color: 0x26322d, roughness: 0.88, metalness: 0.02 }),
    // Bright, warm, self-lit residential interior walls & ceilings (never looks like a dark bunker!)
    hallWall: tiledMaterial(plaster, { color: 0xfdf9f0, emissive: 0x4e493e, emissiveIntensity: 0.68, uvScale: 2.5, roughness: 0.78, normalStrength: 1.1, normalScale: 0.35 }),
    roomWall: tiledMaterial(plaster, { color: 0xfaf3e6, emissive: 0x4a453b, emissiveIntensity: 0.68, uvScale: 2.5, roughness: 0.78, normalStrength: 1.1, normalScale: 0.35 }),
    ceilingMat: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x5c5a54, emissiveIntensity: 0.72, roughness: 0.84 }),
    wood: new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.56, metalness: 0.04, envMapIntensity: 0.7 }),
    darkWood: new THREE.MeshStandardMaterial({ map: darkWoodTex, roughness: 0.52, metalness: 0.05, envMapIntensity: 0.75 }),
    porcelain: new THREE.MeshPhysicalMaterial({ color: 0xffffff, emissive: 0x26292b, emissiveIntensity: 0.38, roughness: 0.14, clearcoat: 0.85, clearcoatRoughness: 0.08, envMapIntensity: 1.2 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.12, metalness: 0.96, envMapIntensity: 1.6 }),
    sofaFabric: new THREE.MeshStandardMaterial({ map: sofaTex, roughness: 0.88, metalness: 0.02 }),
    cushionMat: new THREE.MeshStandardMaterial({ map: cushionTex, roughness: 0.84, metalness: 0.02 }),
    rugMat: new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.92, metalness: 0.01 }),
    mattressMat: new THREE.MeshStandardMaterial({ map: createQuiltedClothTexture('#f8f6f0', '#cbd5e1'), roughness: 0.88 }),
    blanketMat: new THREE.MeshStandardMaterial({ map: createQuiltedClothTexture('#9e2a3b', '#631420'), roughness: 0.86 }),
    curtainMat: new THREE.MeshStandardMaterial({ color: 0xc89d66, roughness: 0.85, side: THREE.DoubleSide }),
    bucketMat: new THREE.MeshPhysicalMaterial({ color: 0x0284c7, roughness: 0.34, clearcoat: 0.45 }),
    tvScreen: new THREE.MeshBasicMaterial({ map: tvScreen, toneMapped: false }),
    wallArt: new THREE.MeshBasicMaterial({ map: wallArt }),
    blueTarp: new THREE.MeshStandardMaterial({ color: 0x0570a8, roughness: 0.62, metalness: 0.04, side: THREE.DoubleSide }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xfff9e6, emissive: 0xffe6aa, emissiveIntensity: 1.65 }),
    ledGreen: new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.8 }),
    ledRed: new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.8 }),
    stoveFlame: new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 2.1 }),
    mirrorMat: new THREE.MeshPhysicalMaterial({ color: 0xcbe2fb, roughness: 0.05, metalness: 0.92, clearcoat: 1.0, envMapIntensity: 1.8 }),
    drainWater: new THREE.MeshPhysicalMaterial({ color: 0x1b332d, roughness: 0.08, metalness: 0.12, clearcoat: 0.9, envMapIntensity: 1.4 }),
    moss: new THREE.MeshStandardMaterial({ color: 0x385239, roughness: 0.92 }),
    grass: tiledMaterial(concrete, { color: 0x456934, uvScale: 2.2, roughness: 0.90, normalStrength: 2.0 }),
    terracotta: new THREE.MeshStandardMaterial({ color: 0x9c4a2d, roughness: 0.82, metalness: 0.02 }),
    waterTank: new THREE.MeshPhysicalMaterial({ color: 0x182226, roughness: 0.38, clearcoat: 0.35, clearcoatRoughness: 0.32, envMapIntensity: 0.85 }),
    pvcPipe: new THREE.MeshStandardMaterial({ color: 0xb8c0bc, roughness: 0.42, metalness: 0.05 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x35682a, roughness: 0.68, metalness: 0.02, envMapIntensity: 0.65, side: THREE.DoubleSide, vertexColors: true }),
    trunk: tiledMaterial(concrete, { color: 0x766c50, uvScale: 1.8, roughness: 0.92, normalStrength: 2.8 }),
    wire: new THREE.MeshStandardMaterial({ color: 0x161a18, roughness: 0.58, metalness: 0.12 }),
    courtyard: new THREE.MeshStandardMaterial({ map: courtyard, roughness: 0.72, metalness: 0.04, envMapIntensity: 0.85 }),
  };

  materials.courtyard.userData.uvScale = 2.1;
  materials.pillarTile.userData.uvScale = 1.6;
  materials.bathTile.userData.uvScale = 1.8;

  attachDerivedPBRMaps(materials.pillarTile, pillarTile, { strength: 1.6, roughBase: 0.28, normalScale: 0.55 });
  attachDerivedPBRMaps(materials.bathTile, bathTile, { strength: 1.5, roughBase: 0.22, normalScale: 0.50 });
  attachDerivedPBRMaps(materials.courtyard, courtyard, { strength: 2.0, roughBase: 0.72, normalScale: 0.68 });
  attachDerivedPBRMaps(materials.wood, woodTex, { strength: 1.4, roughBase: 0.56, normalScale: 0.42 });
  attachDerivedPBRMaps(materials.darkWood, darkWoodTex, { strength: 1.4, roughBase: 0.52, normalScale: 0.42 });
  upgradeWetAsphaltMaterial(materials.road, sharedUniforms, 0.72);
  applyFoliageWindShader(materials.leaf, sharedUniforms);
  applyWireWindShader(materials.wire, sharedUniforms);

  const allMaterials = Object.values(materials);
  materials.shaderUniforms = sharedUniforms;

  materials.setShaderTime = (time) => {
    sharedUniforms.uTime.value = time;
  };

  materials.setNightFactor = (nightFactor) => {
    const nf = Math.max(0, Math.min(1, nightFactor || 0));
    materials.lamp.emissiveIntensity = 1.2 + nf * 1.4;
    materials.hallWall.emissiveIntensity = 0.55 + nf * 0.40;
    materials.roomWall.emissiveIntensity = 0.55 + nf * 0.40;
    if (materials.road.userData.wetUniforms) {
      materials.road.userData.wetUniforms.uWetness.value = 0.64 + nf * 0.24;
    }
  };

  materials.setQualityMode = (quality, softwareFast = false) => {
    const isLow = quality === 'low';
    const isUltra = quality === 'ultra';
    const nextAniso = softwareFast ? 1 : (isLow ? Math.min(4, anisotropy) : (quality === 'medium' ? Math.min(4, anisotropy) : (quality === 'high' ? Math.min(8, anisotropy) : anisotropy)));
    const normMult = isUltra ? 1.18 : 1.0;
    const envMult = softwareFast ? 0.0 : (isUltra ? 1.22 : (isLow ? 0.65 : 1.0));
    for (const mat of allMaterials) {
      if (!mat || typeof mat !== 'object' || !mat.isMaterial) continue;
      if (mat.userData && mat.userData.pbrNormalMap) {
        const nextNorm = softwareFast ? null : mat.userData.pbrNormalMap;
        const nextRough = (isLow || quality === 'medium' || softwareFast) ? null : mat.userData.pbrRoughnessMap;
        if (mat.normalMap !== nextNorm || mat.roughnessMap !== nextRough) {
          mat.normalMap = nextNorm;
          mat.roughnessMap = nextRough;
          mat.needsUpdate = true;
        }
        if (mat.normalScale && nextNorm) {
          if (mat.userData._origNormalScale === undefined) {
            mat.userData._origNormalScale = mat.normalScale.x;
          }
          const s = mat.userData._origNormalScale * normMult;
          mat.normalScale.set(s, s);
        }
      }
      if ('envMapIntensity' in mat && typeof mat.envMapIntensity === 'number') {
        if (mat.userData._origEnvIntensity === undefined) {
          mat.userData._origEnvIntensity = mat.envMapIntensity;
        }
        mat.envMapIntensity = mat.userData._origEnvIntensity * envMult;
      }
      if (mat.map && mat.map.anisotropy !== nextAniso) {
        mat.map.anisotropy = nextAniso;
        mat.map.needsUpdate = true;
      }
    }
    if (materials.road.userData.wetUniforms) {
      materials.road.userData.wetUniforms.uWetness.value = isUltra ? 0.82 : (quality === 'high' ? 0.72 : 0.65);
    }
  };

  const reflectiveMaterials = [
    materials.pillarTile,
    materials.bathTile,
    materials.blackTile,
    materials.gate,
    materials.gateInset,
    materials.rail,
    materials.darkMetal,
    materials.aluminum,
    materials.glass,
    materials.frostedGlass,
    materials.porcelain,
    materials.chrome,
    materials.mirrorMat,
    materials.drainWater,
    materials.waterTank,
    materials.bucketMat,
  ].filter(Boolean);

  materials.setEnvironmentMap = (envTex) => {
    for (const mat of reflectiveMaterials) {
      if (mat.envMap !== envTex) {
        mat.envMap = envTex;
        mat.needsUpdate = true;
      }
    }
  };

  return materials;
}
