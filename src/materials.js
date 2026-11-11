import * as THREE from 'three';

function diffTexture(loader, name, anisotropy) {
  const texture = loader.load(`./assets/${name}-diff.jpg`);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function tiledMaterial(diffMap, options = {}) {
  const material = new THREE.MeshLambertMaterial({
    map: diffMap,
    bumpMap: diffMap,
    bumpScale: options.bumpScale ?? 0.006,
    color: options.color ?? 0xffffff,
    emissive: options.emissive ?? 0x000000,
    side: THREE.FrontSide,
  });
  material.userData.uvScale = options.uvScale ?? 2;
  material.userData.origBumpMap = diffMap;
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

export function createMaterials(renderer, manager) {
  const loader = new THREE.TextureLoader(manager);
  const anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  const asphalt = diffTexture(loader, 'asphalt', anisotropy);
  const brick = diffTexture(loader, 'brick', anisotropy);
  const plaster = diffTexture(loader, 'plaster', anisotropy);
  const concrete = diffTexture(loader, 'concrete', anisotropy);
  const courtyard = createCourtyardTexture();
  const pillarTile = createPillarTileTexture();
  const bathTile = createBathTileTexture();
  const tvScreen = createTVScreenTexture();
  const wallArt = createWallArtTexture();

  const materials = {
    road: tiledMaterial(asphalt, { color: 0xd8d6ce, uvScale: 5.5 }),
    brick: tiledMaterial(brick, { color: 0xc97b63, uvScale: 2.3 }),
    plaster: tiledMaterial(plaster, { color: 0xf4ead8, uvScale: 3.4 }),
    warmPlaster: tiledMaterial(plaster, { color: 0xe6dac8, emissive: 0x221e18, uvScale: 3.0 }),
    whiteBand: tiledMaterial(plaster, { color: 0xf7f6f2, uvScale: 2.8 }),
    concrete: tiledMaterial(concrete, { color: 0xd7d4c8, uvScale: 3.2 }),
    trim: tiledMaterial(plaster, { color: 0xe5dcc4, uvScale: 2.8 }),
    wall: tiledMaterial(plaster, { color: 0xece3d2, uvScale: 2.4 }),
    darkConcrete: tiledMaterial(concrete, { color: 0x7c837c, uvScale: 2.5 }),
    pillarTile: new THREE.MeshLambertMaterial({ map: pillarTile, emissive: 0x353128, side: THREE.DoubleSide }),
    bathTile: new THREE.MeshLambertMaterial({ map: bathTile, emissive: 0x2c3e42, side: THREE.DoubleSide }),
    blackTile: new THREE.MeshLambertMaterial({ color: 0x1d1b18 }),
    gate: new THREE.MeshLambertMaterial({ color: 0x7a8d8f }),
    gateInset: new THREE.MeshLambertMaterial({ color: 0x4e6062 }),
    orange: new THREE.MeshLambertMaterial({ color: 0xb85224 }),
    rail: new THREE.MeshLambertMaterial({ color: 0xdce3df }),
    darkMetal: new THREE.MeshLambertMaterial({ color: 0x1e2423 }),
    aluminum: new THREE.MeshLambertMaterial({ color: 0xd6ded9, emissive: 0x1e2220 }),
    glass: new THREE.MeshLambertMaterial({ color: 0x528c78, transparent: true, opacity: 0.42 }),
    frostedGlass: new THREE.MeshLambertMaterial({ color: 0x9db6ba, transparent: true, opacity: 0.65 }),
    interior: new THREE.MeshLambertMaterial({ color: 0x26322d }),
    // Bright, warm, self-lit residential interior walls & ceilings (never looks like a dark bunker!)
    hallWall: tiledMaterial(plaster, { color: 0xfdf9f0, emissive: 0x4e493e, uvScale: 2.5 }),
    roomWall: tiledMaterial(plaster, { color: 0xfaf3e6, emissive: 0x4a453b, uvScale: 2.5 }),
    ceilingMat: new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x5c5a54 }),
    wood: new THREE.MeshLambertMaterial({ color: 0x6e4023, emissive: 0x180d06 }),
    darkWood: new THREE.MeshLambertMaterial({ color: 0x3d2314, emissive: 0x0f0804 }),
    porcelain: new THREE.MeshLambertMaterial({ color: 0xf8fafc, emissive: 0x464a4d }),
    chrome: new THREE.MeshLambertMaterial({ color: 0xe2e8f0, emissive: 0x33383d }),
    sofaFabric: new THREE.MeshLambertMaterial({ color: 0x1e5666, emissive: 0x0c242b }),
    cushionMat: new THREE.MeshLambertMaterial({ color: 0xe09f3e, emissive: 0x2e1f09 }),
    rugMat: new THREE.MeshLambertMaterial({ color: 0x8c2d27, emissive: 0x240a08 }),
    mattressMat: new THREE.MeshLambertMaterial({ color: 0xf8f6f0, emissive: 0x3b3935 }),
    blanketMat: new THREE.MeshLambertMaterial({ color: 0x9e2a3b, emissive: 0x26090e }),
    curtainMat: new THREE.MeshLambertMaterial({ color: 0xc89d66, emissive: 0x291f12, side: THREE.DoubleSide }),
    bucketMat: new THREE.MeshLambertMaterial({ color: 0x0284c7, emissive: 0x05263b }),
    tvScreen: new THREE.MeshBasicMaterial({ map: tvScreen }),
    wallArt: new THREE.MeshBasicMaterial({ map: wallArt }),
    blueTarp: new THREE.MeshLambertMaterial({ color: 0x0570a8, side: THREE.DoubleSide }),
    lamp: new THREE.MeshBasicMaterial({ color: 0xfff9e6 }),
    ledGreen: new THREE.MeshBasicMaterial({ color: 0x22c55e }),
    ledRed: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
    stoveFlame: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
    mirrorMat: new THREE.MeshLambertMaterial({ color: 0xcbe8f6, emissive: 0x45606e }),
    drainWater: new THREE.MeshLambertMaterial({ color: 0x203a33 }),
    moss: new THREE.MeshLambertMaterial({ color: 0x385239 }),
    grass: tiledMaterial(concrete, { color: 0x456934, uvScale: 2.2 }),
    terracotta: new THREE.MeshLambertMaterial({ color: 0x9c4a2d }),
    waterTank: new THREE.MeshLambertMaterial({ color: 0x182226 }),
    pvcPipe: new THREE.MeshLambertMaterial({ color: 0xb8c0bc }),
    leaf: new THREE.MeshLambertMaterial({ color: 0x315e27, side: THREE.DoubleSide, vertexColors: true }),
    trunk: new THREE.MeshLambertMaterial({ color: 0x766c50 }),
    wire: new THREE.MeshBasicMaterial({ color: 0x171b19 }),
    courtyard: new THREE.MeshLambertMaterial({ map: courtyard }),
  };
  materials.courtyard.userData.uvScale = 2.1;
  materials.pillarTile.userData.uvScale = 1.6;
  materials.bathTile.userData.uvScale = 1.8;

  const allMaterials = Object.values(materials);
  materials.setQualityMode = (quality) => {
    const isLow = quality === 'low';
    for (const mat of allMaterials) {
      if (!mat || !mat.userData || !mat.userData.origBumpMap) continue;
      const nextBump = isLow ? null : mat.userData.origBumpMap;
      if (mat.bumpMap !== nextBump) {
        mat.bumpMap = nextBump;
        mat.needsUpdate = true;
      }
    }
  };

  return materials;
}
