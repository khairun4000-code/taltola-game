import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  attachDerivedPBRMaps,
  upgradeWetAsphaltMaterial,
  applyFoliageWindShader,
  applyWireWindShader,
} from './aaa-shaders.js';
import {
  buildCNGAuto,
  buildEasybike,
  buildSedanCar,
  buildBanglaTruck,
} from './khulna-vehicles.js';
import { buildKhanJahanAliBridge } from './khan-jahan-ali-bridge.js';

function seeded(seed = 202611) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Custom Next-Gen Rupsha River Water Shader (Standalone Center Coordinates: bank around x = 24..30)
 * Multi-wave analytical normals, physical Fresnel sky & sun reflection, Bengal silt-emerald depth gradient,
 * shoreline foam shimmer, and warm evening bridge/ghat water reflections.
 */
function createStandaloneRupshaRiverMaterial(sharedUniforms) {
  const uniforms = {
    uTime: sharedUniforms.uTime,
    uSunDir: sharedUniforms.uSunDir,
    uSunColor: sharedUniforms.uSunColor,
    uSkyTop: sharedUniforms.uSkyTop,
    uSkyHorizon: sharedUniforms.uSkyHorizon,
    uFogColor: sharedUniforms.uFogColor,
    uNightFactor: sharedUniforms.uNightFactor,
    uFogNear: { value: 220.0 },
    uFogFar: { value: 640.0 },
  };

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        wp.y += sin(wp.x * 0.14 + wp.z * 0.11 + uTime * 1.45) * 0.045
              + cos(wp.z * 0.24 - wp.x * 0.09 - uTime * 1.85) * 0.028;
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform vec3 uSkyTop;
      uniform vec3 uSkyHorizon;
      uniform vec3 uFogColor;
      uniform float uNightFactor;
      uniform float uFogNear;
      uniform float uFogFar;
      varying vec3 vWorldPos;

      float hash2(vec2 p) {
        p = fract(p * vec2(127.1, 311.7));
        p += dot(p, p + 34.12);
        return fract(p.x * p.y);
      }

      float noise2(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash2(i), hash2(i + vec2(1.0, 0.0)), u.x),
          mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float waveHeight(vec2 p, float t) {
        float h = 0.0;
        h += sin(p.x * 0.28 + p.y * 0.15 + t * 1.45) * 0.24;
        h += sin(p.x * -0.19 + p.y * 0.38 - t * 1.18) * 0.19;
        h += sin(p.x * 0.72 + p.y * 0.56 + t * 2.25) * 0.10;
        h += noise2(p * 0.45 + vec2(t * 0.32, -t * 0.28)) * 0.36;
        h += noise2(p * 1.75 + vec2(-t * 0.68, t * 0.44)) * 0.16;
        return h;
      }

      void main() {
        vec2 p = vWorldPos.xz;
        float e = 0.15;
        float h0 = waveHeight(p, uTime);
        float hx = waveHeight(p + vec2(e, 0.0), uTime);
        float hz = waveHeight(p + vec2(0.0, e), uTime);
        vec3 N = normalize(vec3((h0 - hx) * 1.45, 1.0, (h0 - hz) * 1.45));

        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 L = normalize(uSunDir);

        float NoV = clamp(dot(N, V), 0.001, 1.0);
        float fresnel = 0.03 + 0.97 * pow(1.0 - NoV, 4.4);

        vec3 R = reflect(-V, N);
        float rUp = clamp(R.y, 0.0, 1.0);
        vec3 reflSky = mix(uSkyHorizon, uSkyTop, pow(rUp, 0.52));
        float reflSun = max(dot(R, L), 0.0);
        reflSky += uSunColor * pow(reflSun, 42.0) * 0.95;

        // Sharp sun & moon specular sparkle across wavelets
        vec3 H = normalize(L + V);
        float NoH = max(dot(N, H), 0.0);
        float specTight = pow(NoH, 220.0) * 3.1;
        float specBroad = pow(NoH, 28.0) * 0.26;
        vec3 specular = uSunColor * (specTight + specBroad);

        // Authentic Rupsha River turbidity (shallower silty-teal near West bank x=24..46 & East bank x=230..255)
        float westBank = 1.0 - smoothstep(23.0, 56.0, vWorldPos.x);
        float eastBank = smoothstep(215.0, 248.0, vWorldPos.x);
        float shallowMask = clamp(westBank + eastBank, 0.0, 1.0);

        vec3 shallowColor = vec3(0.088, 0.205, 0.175);
        vec3 deepColor = vec3(0.025, 0.095, 0.128);
        vec3 waterBody = mix(deepColor, shallowColor, clamp(shallowMask * 0.72 + h0 * 0.16, 0.0, 1.0));

        // Gentle white bank foam & wind wave crests
        float shoreRipple = sin(vWorldPos.x * 1.6 - uTime * 2.2 + noise2(p * 0.4) * 3.0) * 0.5 + 0.5;
        float shoreFoam = (1.0 - smoothstep(22.0, 30.5, vWorldPos.x)) * shoreRipple * 0.48;
        float crestFoam = smoothstep(0.76, 0.95, h0) * 0.22;
        vec3 foamColor = mix(uSkyHorizon, vec3(0.92, 0.96, 0.95), 0.5);

        // Warm dusk/night reflections of Rupsha Ghat, Rupsha Park Cafe & Rupsha Bridge lights on water!
        float ghatGlow = exp(-pow((vWorldPos.x - 32.0) * 0.045, 2.0)) * exp(-pow((vWorldPos.z + 10.0) * 0.025, 2.0));
        float parkGlow = exp(-pow((vWorldPos.x - 30.0) * 0.055, 2.0)) * exp(-pow((vWorldPos.z - 68.0) * 0.028, 2.0));
        float bridgeGlow = exp(-pow((vWorldPos.z - 192.0) * 0.032, 2.0)) * smoothstep(20.0, 50.0, vWorldPos.x);
        float lightShimmer = 0.65 + 0.35 * sin(vWorldPos.z * 1.8 + h0 * 8.0 + uTime * 2.5);
        vec3 nightRefl = vec3(1.0, 0.72, 0.32) * (ghatGlow * 0.55 + parkGlow * 0.48 + bridgeGlow * 0.62) * lightShimmer * uNightFactor;

        float fresnelMix = clamp(fresnel * 0.78, 0.06, 0.74);
        vec3 color = mix(waterBody, reflSky, fresnelMix) + specular + nightRefl;
        color = mix(color, foamColor, clamp((shoreFoam + crestFoam) * 0.42, 0.0, 0.42));

        float dist = length(cameraPosition - vWorldPos);
        float fogT = smoothstep(uFogNear, uFogFar, dist);
        color = mix(color, uFogColor, fogT);

        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
}

// ============================================================================
// PROCEDURAL HIGH-RES PBR TEXTURE GENERATORS
// ============================================================================

function makePitchRoadTexture(seedVal = 901, withCenterLine = true) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  ctx.fillStyle = '#21252a';
  ctx.fillRect(0, 0, S, S);

  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = rnd() > 0.45 ? 'rgba(14,16,20,0.34)' : 'rgba(54,58,66,0.22)';
    ctx.fillRect(40 + rnd() * (S - 80), rnd() * S, 24 + rnd() * 68, 22 + rnd() * 60);
  }
  for (let i = 0; i < 7000; i++) {
    const v = 26 + Math.floor(rnd() * 50);
    ctx.fillStyle = `rgba(${v},${v + 1},${v + 3},${0.22 + rnd() * 0.25})`;
    ctx.fillRect(rnd() * S, rnd() * S, 1.5, 1.5);
  }
  // Dusty Khulna road edges
  const lg = ctx.createLinearGradient(0, 0, 36, 0);
  lg.addColorStop(0, 'rgba(118,100,78,0.58)');
  lg.addColorStop(1, 'rgba(118,100,78,0)');
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, 36, S);

  const rg = ctx.createLinearGradient(S, 0, S - 36, 0);
  rg.addColorStop(0, 'rgba(118,100,78,0.58)');
  rg.addColorStop(1, 'rgba(118,100,78,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(S - 36, 0, 36, S);

  if (withCenterLine) {
    ctx.fillStyle = 'rgba(241,245,249,0.78)';
    ctx.fillRect(S * 0.5 - 6, 36, 12, 165);
    ctx.fillRect(S * 0.5 - 6, 290, 12, 165);
    ctx.fillStyle = 'rgba(241,245,249,0.50)';
    ctx.fillRect(24, 0, 6, S);
    ctx.fillRect(S - 30, 0, 6, S);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeBrickPaverTexture(seedVal = 711, redTone = true) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  ctx.fillStyle = redTone ? '#3f2a20' : '#4a4e49';
  ctx.fillRect(0, 0, S, S);

  const rows = 12;
  const cols = 6;
  const bh = S / rows;
  const bw = S / cols;

  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (bw * 0.5);
    for (let col = -1; col <= cols; col++) {
      const x = col * bw + off;
      const y = r * bh;
      if (redTone) {
        const rr = 148 + Math.floor(rnd() * 38);
        const gg = 54 + Math.floor(rnd() * 24);
        const bb = 38 + Math.floor(rnd() * 18);
        ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
      } else {
        const v = 132 + Math.floor(rnd() * 34);
        ctx.fillStyle = `rgb(${v + 4},${v + 2},${v - 4})`;
      }
      ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
      if (rnd() > 0.72) {
        ctx.fillStyle = 'rgba(42,68,36,0.20)';
        ctx.fillRect(x + 2, y + 2, bw - 4, 6);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeLushGrassTexture(seedVal = 515) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);

  ctx.fillStyle = '#2d5a27';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 6500; i++) {
    const g = 75 + Math.floor(rnd() * 68);
    const r = 30 + Math.floor(rnd() * 34);
    const b = 22 + Math.floor(rnd() * 22);
    ctx.fillStyle = `rgba(${r},${g},${b},${0.35 + rnd() * 0.4})`;
    ctx.fillRect(rnd() * S, rnd() * S, 2 + rnd() * 4, 3 + rnd() * 7);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeStuccoTexture(baseHex, seedVal = 301, { brick = false, darkStreak = 0.14 } = {}) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = rnd() > 0.48 ? 'rgba(255,255,255,0.06)' : `rgba(34,28,22,${0.03 + rnd() * 0.06})`;
    ctx.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 5, 2 + rnd() * 5);
  }
  for (let i = 0; i < 32; i++) {
    const x = rnd() * 256;
    const h = 24 + rnd() * 88;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgba(26,28,22,${darkStreak})`);
    g.addColorStop(1, 'rgba(26,28,22,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 3 + rnd() * 7, h);
  }
  if (brick) {
    ctx.strokeStyle = 'rgba(24,16,12,0.24)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < 256; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
      const off = ((y / 16) % 2) * 16;
      for (let x = off; x < 256; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 16);
        ctx.stroke();
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeCorrugatedTexture(tint = '#286480') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 10) {
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(0, y, 256, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, y + 6, 256, 4);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeHazardTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#18181b';
  for (let x = -128; x < 384; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 128);
    ctx.lineTo(x + 24, 128);
    ctx.lineTo(x + 68, 0);
    ctx.lineTo(x + 44, 0);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  return tex;
}

function makeWoodDeckTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(612);
  ctx.fillStyle = '#7c4d2c';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) {
    const shade = Math.floor((rnd() - 0.5) * 26);
    ctx.fillStyle = `rgb(${124 + shade},${77 + Math.floor(shade * 0.7)},${44 + Math.floor(shade * 0.5)})`;
    ctx.fillRect(0, y + 2, 256, 28);
    ctx.fillStyle = 'rgba(24,14,8,0.45)';
    ctx.fillRect(0, y, 256, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeSignTexture({ title, subtitle = '', bg = '#0f3d2e', fg = '#ffffff', accent = '#fde047', border = '#ffffff' }) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 176;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 176);

  const grad = ctx.createLinearGradient(0, 0, 0, 176);
  grad.addColorStop(0, 'rgba(255,255,255,0.14)');
  grad.addColorStop(1, 'rgba(0,0,0,0.26)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 176);

  ctx.strokeStyle = border;
  ctx.lineWidth = 7;
  ctx.strokeRect(7, 7, 498, 162);
  ctx.fillStyle = accent;
  ctx.fillRect(16, 16, 10, 144);

  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 34px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText(title, 40, subtitle ? 66 : 88, 446);
  if (subtitle) {
    ctx.fillStyle = accent;
    ctx.font = '600 20px "Manrope", "Noto Sans Bengali", sans-serif';
    ctx.fillText(subtitle, 40, 126, 446);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeShopDisplayTexture(kind = 'shop') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = kind === 'bakery' ? '#3b150c' : '#162436';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = kind === 'bakery' ? '#fef3c7' : '#e0f2fe';
  ctx.fillRect(12, 14, 232, 16);
  for (let y = 52; y < 224; y += 44) {
    ctx.fillStyle = '#475569';
    ctx.fillRect(16, y + 30, 224, 5);
    for (let x = 22; x < 224; x += 24) {
      ctx.fillStyle = kind === 'bakery'
        ? ['#f59e0b', '#fb7185', '#fde047', '#d97706', '#f43f5e'][(x + y) % 5]
        : ['#38bdf8', '#22c55e', '#facc15', '#ef4444', '#a855f7'][(x + y) % 5];
      ctx.fillRect(x, y + 8, 16, 22);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeRevetmentTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const rnd = seeded(9099);
  ctx.fillStyle = '#5c5a52';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) {
    for (let x = ((y / 32) % 2) * 16; x < 256; x += 32) {
      const shade = 78 + Math.floor(rnd() * 34);
      ctx.fillStyle = `rgb(${shade + 4},${shade},${shade - 6})`;
      ctx.fillRect(x + 2, y + 2, 28, 28);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ============================================================================
// MATERIAL BANK & GEOMETRY HELPERS
// ============================================================================

function createMaterials(sharedUniforms) {
  const roadTex = makePitchRoadTexture(901, true);
  const roadPlainTex = makePitchRoadTexture(905, false);
  const brickTex = makeBrickPaverTexture(711, true);
  const stoneTex = makeBrickPaverTexture(722, false);
  const grassTex = makeLushGrassTexture(515);
  const woodTex = makeWoodDeckTexture();
  const revetTex = makeRevetmentTexture();
  const tinBlueTex = makeCorrugatedTexture('#1d5b79');
  const tinTealTex = makeCorrugatedTexture('#0f766e');
  const tinRustTex = makeCorrugatedTexture('#854d37');
  const shutterTex = makeCorrugatedTexture('#52606a');
  const hazardTex = makeHazardTexture();

  const mkPlaster = (hex, seedVal, rough = 0.82, opts = {}) => {
    const tex = makeStuccoTexture(hex, seedVal, opts);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: rough, metalness: 0.02, envMapIntensity: 0.78 });
    attachDerivedPBRMaps(mat, tex, { strength: opts.brick ? 2.6 : 1.9, roughBase: rough, normalScale: 0.72 });
    return mat;
  };

  const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.68, metalness: 0.08, envMapIntensity: 0.85 });
  attachDerivedPBRMaps(roadMat, roadTex, { size: 256, strength: 2.3, roughBase: 0.68, normalScale: 0.72 });
  upgradeWetAsphaltMaterial(roadMat, sharedUniforms, 0.52);

  const roadPlainMat = new THREE.MeshStandardMaterial({ map: roadPlainTex, roughness: 0.68, metalness: 0.08, envMapIntensity: 0.85 });
  attachDerivedPBRMaps(roadPlainMat, roadPlainTex, { size: 256, strength: 2.3, roughBase: 0.68, normalScale: 0.72 });
  upgradeWetAsphaltMaterial(roadPlainMat, sharedUniforms, 0.52);

  const brickMat = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.84, metalness: 0.02, envMapIntensity: 0.5 });
  attachDerivedPBRMaps(brickMat, brickTex, { size: 256, strength: 2.4, roughBase: 0.84, normalScale: 0.75 });

  const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.82, metalness: 0.03, envMapIntensity: 0.55 });
  attachDerivedPBRMaps(stoneMat, stoneTex, { size: 256, strength: 2.2, roughBase: 0.82, normalScale: 0.7 });

  const grassMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.92, metalness: 0.0, envMapIntensity: 0.35 });
  const woodDeckMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.72, metalness: 0.04, envMapIntensity: 0.55 });
  attachDerivedPBRMaps(woodDeckMat, woodTex, { size: 256, strength: 2.0, roughBase: 0.72, normalScale: 0.65 });

  const revetMat = new THREE.MeshStandardMaterial({ map: revetTex, roughness: 0.92, metalness: 0.02, envMapIntensity: 0.45 });
  attachDerivedPBRMaps(revetMat, revetTex, { size: 256, strength: 2.5, roughBase: 0.92, normalScale: 0.85 });

  const foliageDeep = new THREE.MeshStandardMaterial({ color: 0x245c2a, roughness: 0.78, metalness: 0.0, envMapIntensity: 0.45 });
  const foliageBright = new THREE.MeshStandardMaterial({ color: 0x357a34, roughness: 0.76, metalness: 0.0, envMapIntensity: 0.48 });
  const palmLeaf = new THREE.MeshStandardMaterial({ color: 0x2d6e2e, roughness: 0.72, metalness: 0.0, side: THREE.DoubleSide, envMapIntensity: 0.5 });
  applyFoliageWindShader(foliageDeep, sharedUniforms);
  applyFoliageWindShader(foliageBright, sharedUniforms);
  applyFoliageWindShader(palmLeaf, sharedUniforms);

  const wireMat = new THREE.MeshStandardMaterial({ color: 0x15181d, roughness: 0.6, metalness: 0.4 });
  applyWireWindShader(wireMat, sharedUniforms);

  const dispBakery = makeShopDisplayTexture('bakery');
  const dispShop = makeShopDisplayTexture('shop');

  const bank = {
    road: roadMat,
    roadPlain: roadPlainMat,
    brick: brickMat,
    stone: stoneMat,
    grass: grassMat,
    woodDeck: woodDeckMat,
    revetment: revetMat,
    cream: mkPlaster('#ebe1ce', 101, 0.78),
    terracotta: mkPlaster('#b86549', 102, 0.84),
    sage: mkPlaster('#98b0a2', 103, 0.82),
    ochre: mkPlaster('#c99a5d', 104, 0.84),
    brickWall: mkPlaster('#9b4532', 105, 0.88, { brick: true }),
    whiteWall: mkPlaster('#edf1f5', 106, 0.72),
    dampPlinth: mkPlaster('#3c3e38', 107, 0.93, { darkStreak: 0.25 }),
    concrete: mkPlaster('#a2a6a0', 108, 0.86),
    mosqueGreen: mkPlaster('#15803d', 109, 0.58),
    tastyRed: mkPlaster('#dc2626', 110, 0.52),
    tinBlue: new THREE.MeshStandardMaterial({ map: tinBlueTex, roughness: 0.46, metalness: 0.48, envMapIntensity: 0.95 }),
    tinTeal: new THREE.MeshStandardMaterial({ map: tinTealTex, roughness: 0.46, metalness: 0.48, envMapIntensity: 0.95 }),
    tinRust: new THREE.MeshStandardMaterial({ map: tinRustTex, roughness: 0.70, metalness: 0.35, envMapIntensity: 0.65 }),
    shutter: new THREE.MeshStandardMaterial({ map: shutterTex, roughness: 0.48, metalness: 0.58, envMapIntensity: 0.95 }),
    hazard: new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.76 }),
    darkSlate: new THREE.MeshStandardMaterial({ color: 0x1e252b, roughness: 0.54, metalness: 0.36 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: 0x20262c, roughness: 0.44, metalness: 0.78 }),
    aluminum: new THREE.MeshStandardMaterial({ color: 0xd4dde3, roughness: 0.22, metalness: 0.90, envMapIntensity: 1.3 }),
    steelBlue: new THREE.MeshStandardMaterial({ color: 0x1e4f6e, roughness: 0.40, metalness: 0.55, envMapIntensity: 1.0 }),
    goldAccent: new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.28, metalness: 0.82, envMapIntensity: 1.35 }),
    waterTank: new THREE.MeshPhysicalMaterial({ color: 0x141d22, roughness: 0.36, clearcoat: 0.4 }),
    acBox: new THREE.MeshStandardMaterial({ color: 0xdde3e8, roughness: 0.50, metalness: 0.12 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x1b4257, roughness: 0.08, metalness: 0.16, clearcoat: 0.95, envMapIntensity: 1.7 }),
    glassRail: new THREE.MeshPhysicalMaterial({ color: 0x67e8f9, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.36, clearcoat: 1.0 }),
    hullNavy: new THREE.MeshPhysicalMaterial({ color: 0x172e4f, roughness: 0.36, metalness: 0.28, clearcoat: 0.5 }),
    launchWhite: new THREE.MeshPhysicalMaterial({ color: 0xf4f7fa, roughness: 0.32, clearcoat: 0.55 }),
    deckGreen: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.72 }),
    ferryOrange: new THREE.MeshPhysicalMaterial({ color: 0xc2410c, roughness: 0.40, clearcoat: 0.5 }),
    woodBoat: mkPlaster('#6b3f23', 111, 0.86),
    bamboo: mkPlaster('#8c6f4b', 112, 0.92),
    rope: new THREE.MeshStandardMaterial({ color: 0xa18864, roughness: 0.95 }),
    bark: mkPlaster('#4c3828', 113, 0.94),
    foliageDeep,
    foliageBright,
    palmLeaf,
    wire: wireMat,
    flowerRed: new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.65 }),
    flowerYellow: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.65 }),
    flowerPink: new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.65 }),
    fountainWater: new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
      roughness: 0.12,
      transparent: true,
      opacity: 0.82,
    }),
    // Emissive lights (scaled dynamically by nightFactor!)
    lampWarm: new THREE.MeshStandardMaterial({ color: 0xfff8e6, emissive: 0xffd27d, emissiveIntensity: 1.3 }),
    fairyBulb: new THREE.MeshStandardMaterial({ color: 0xfffbeb, emissive: 0xffb74d, emissiveIntensity: 1.6 }),
    warmWindow: new THREE.MeshStandardMaterial({ color: 0xffebb8, emissive: 0xffc864, emissiveIntensity: 0.5 }),
    beaconRed: new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xff2222, emissiveIntensity: 1.8 }),
    fountainLed: new THREE.MeshStandardMaterial({ color: 0x67e8f9, emissive: 0x22d3ee, emissiveIntensity: 1.2 }),
    dispBakery: new THREE.MeshStandardMaterial({ map: dispBakery, emissive: 0xffd28a, emissiveMap: dispBakery, emissiveIntensity: 0.75, roughness: 0.16 }),
    dispShop: new THREE.MeshStandardMaterial({ map: dispShop, emissive: 0xbae6fd, emissiveMap: dispShop, emissiveIntensity: 0.7, roughness: 0.18 }),
    emissives: [],
  };

  bank.emissives.push(
    { mat: bank.lampWarm, day: 0.9, night: 4.2 },
    { mat: bank.fairyBulb, day: 1.1, night: 4.8 },
    { mat: bank.warmWindow, day: 0.3, night: 2.1 },
    { mat: bank.beaconRed, day: 1.2, night: 4.5 },
    { mat: bank.fountainLed, day: 0.5, night: 3.4 },
    { mat: bank.fountainWater, day: 0.18, night: 1.15 },
    { mat: bank.dispBakery, day: 0.6, night: 1.9 },
    { mat: bank.dispShop, day: 0.55, night: 1.75 },
  );

  return bank;
}

function addBox(parent, size, pos, mat, opts = {}) {
  const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
  if (opts.uvScale) {
    const p = geo.attributes.position;
    const n = geo.attributes.normal;
    const u = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const nx = Math.abs(n.getX(i));
      const ny = Math.abs(n.getY(i));
      const nz = Math.abs(n.getZ(i));
      if (nx >= ny && nx >= nz) u.setXY(i, p.getZ(i) / opts.uvScale, p.getY(i) / opts.uvScale);
      else if (ny >= nx && ny >= nz) u.setXY(i, p.getX(i) / opts.uvScale, p.getZ(i) / opts.uvScale);
      else u.setXY(i, p.getX(i) / opts.uvScale, p.getY(i) / opts.uvScale);
    }
    u.needsUpdate = true;
  }
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (opts.rotX) mesh.rotation.x = opts.rotX;
  if (opts.rotY) mesh.rotation.y = opts.rotY;
  if (opts.rotZ) mesh.rotation.z = opts.rotZ;
  mesh.castShadow = opts.castShadow ?? true;
  mesh.receiveShadow = opts.receiveShadow ?? true;
  parent.add(mesh);
  return mesh;
}

function addCyl(parent, rt, rb, h, pos, mat, seg = 10, rot = null, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.castShadow = opts.castShadow ?? true;
  mesh.receiveShadow = opts.receiveShadow ?? true;
  parent.add(mesh);
  return mesh;
}

function addSign(parent, bank, opts, pos, rotY, w, h) {
  const tex = makeSignTexture(opts);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: 0.45,
    roughness: 0.25,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });
  bank.emissives.push({ mat, day: 0.42, night: 1.75 });
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);
  g.rotation.y = rotY;
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.12), bank.darkMetal);
  const face = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.14), mat);
  g.add(bezel, face);
  parent.add(g);
  return g;
}

function addWire(parent, pA, pB, mat, sag = 0.5, radius = 0.018) {
  const a = new THREE.Vector3(...pA);
  const b = new THREE.Vector3(...pB);
  const mid = a.clone().lerp(b, 0.5);
  mid.y -= sag;
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  const geo = new THREE.TubeGeometry(curve, 10, radius, 5, false);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

function mergeStaticGroup(root) {
  root.updateWorldMatrix(true, true);
  const invRoot = root.matrixWorld.clone().invert();
  const buckets = new Map();

  root.traverse((obj) => {
    if (!obj.isMesh || obj.isInstancedMesh || Array.isArray(obj.material)) return;
    const key = `${obj.material.uuid}-${obj.castShadow}-${obj.receiveShadow}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        material: obj.material,
        cast: obj.castShadow,
        receive: obj.receiveShadow,
        meshes: [],
        geometries: [],
      });
    }
    const b = buckets.get(key);
    let g = obj.geometry.index ? obj.geometry.toNonIndexed() : obj.geometry.clone();
    g.applyMatrix4(invRoot.clone().multiply(obj.matrixWorld));
    g.clearGroups();
    for (const attr of Object.keys(g.attributes)) {
      if (attr !== 'position' && attr !== 'normal' && attr !== 'uv') g.deleteAttribute(attr);
    }
    if (!g.attributes.uv) {
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    b.meshes.push(obj);
    b.geometries.push(g);
  });

  for (const b of buckets.values()) {
    if (b.meshes.length < 2) {
      for (const g of b.geometries) g.dispose();
      continue;
    }
    const merged = mergeGeometries(b.geometries, false);
    for (const g of b.geometries) g.dispose();
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, b.material);
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.receive;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    for (const orig of b.meshes) orig.removeFromParent();
    root.add(mesh);
  }
}

// ============================================================================
// TROPICAL KHULNA TREES & PALMS (WIND-SWAY SHADER ENABLED)
// ============================================================================

function addTropicalTree(parent, bank, x, z, scale = 1.0, seedVal = 1) {
  const rnd = seeded(seedVal + Math.round(x * 7 + z * 13));
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const h = (3.4 + rnd() * 1.4) * scale;
  addCyl(g, 0.16 * scale, 0.28 * scale, h, [0, h * 0.5, 0], bank.bark, 7);

  // Branch forks + multi-layered lush rain-tree canopy
  const leafMat = rnd() > 0.45 ? bank.foliageDeep : bank.foliageBright;
  const crownY = h + 0.6 * scale;
  const blobs = [
    [0, crownY + 0.9 * scale, 0, 2.3 * scale],
    [-1.4 * scale, crownY + 0.2 * scale, 0.9 * scale, 1.75 * scale],
    [1.5 * scale, crownY + 0.3 * scale, -0.7 * scale, 1.8 * scale],
    [0.5 * scale, crownY + 0.1 * scale, 1.4 * scale, 1.65 * scale],
    [-0.7 * scale, crownY + 0.2 * scale, -1.3 * scale, 1.65 * scale],
  ];
  for (const [bx, by, bz, r] of blobs) {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), leafMat);
    m.position.set(bx, by, bz);
    m.scale.set(1.15, 0.72, 1.15);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  parent.add(g);
}

function addCoconutPalm(parent, bank, x, z, height = 8.4, leanAngle = 0.2) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = leanAngle;

  const segs = 6;
  const segH = height / segs;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < segs; i++) {
    const t = i / segs;
    const tilt = 0.04 + t * 0.09;
    const rBot = 0.24 * (1 - t * 0.45);
    const rTop = 0.24 * (1 - (t + 1 / segs) * 0.45);
    addCyl(g, rTop, rBot, segH + 0.08, [cx, cy + segH * 0.5, 0], bank.bark, 7, [0, 0, -tilt]);
    cx += Math.sin(tilt) * segH;
    cy += Math.cos(tilt) * segH;
  }

  // Crown coconuts
  for (let c = 0; c < 4; c++) {
    const ang = (c / 4) * Math.PI * 2;
    const nut = new THREE.Mesh(new THREE.SphereGeometry(0.14, 7, 6), bank.foliageDeep);
    nut.position.set(cx + Math.cos(ang) * 0.22, cy - 0.15, Math.sin(ang) * 0.22);
    g.add(nut);
  }

  // 9 Arched palm fronds
  for (let f = 0; f < 9; f++) {
    const yaw = (f / 9) * Math.PI * 2 + (f % 2) * 0.15;
    const frond = new THREE.Group();
    frond.position.set(cx, cy, 0);
    frond.rotation.y = yaw;
    const leaf1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 2.3), bank.palmLeaf);
    leaf1.position.set(0, 0.32, 1.05);
    leaf1.rotation.x = -0.26;
    const leaf2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 1.9), bank.palmLeaf);
    leaf2.position.set(0, 0.02, 2.85);
    leaf2.rotation.x = 0.36;
    frond.add(leaf1, leaf2);
    g.add(frond);
  }
  parent.add(g);
}

function addStreetLamp(staticG, dynamicG, bank, x, z, armDirX = 1, isParkLamp = false) {
  if (isParkLamp) {
    addCyl(staticG, 0.08, 0.14, 0.45, [x, 0.22, z], bank.darkMetal, 8);
    addCyl(staticG, 0.055, 0.075, 4.2, [x, 2.3, z], bank.darkMetal, 8);
    addBox(staticG, [0.9, 0.06, 0.06], [x, 4.35, z], bank.darkMetal);
    for (const sx of [-0.42, 0.42]) {
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), bank.lampWarm);
      globe.position.set(x + sx, 4.52, z);
      dynamicG.add(globe);
    }
    return;
  }
  addCyl(staticG, 0.12, 0.18, 8.6, [x, 4.3, z], bank.concrete, 8);
  addBox(staticG, [1.5, 0.07, 0.08], [x + armDirX * 0.75, 8.0, z], bank.aluminum, { rotZ: armDirX * 0.12 });
  addBox(staticG, [0.5, 0.12, 0.24], [x + armDirX * 1.48, 8.08, z], bank.darkSlate);
  addBox(dynamicG, [0.38, 0.06, 0.18], [x + armDirX * 1.48, 8.01, z], bank.lampWarm, { castShadow: false });
}

// ============================================================================
// ARTICULATED KHULNA COMMERCIAL BUILDINGS
// ============================================================================

function buildCommercialBuilding(staticG, dynamicG, bank, opts) {
  const {
    cx, cz, widthX = 11, lengthZ = 16, floors = 4, facing = 1, rotY = 0,
    wallMat = bank.terracotta, accentMat = bank.cream, displayKind = 'shop', seed = 101,
  } = opts;
  const rnd = seeded(seed);
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = rotY;
  staticG.add(g);

  const dg = new THREE.Group();
  dg.position.set(cx, 0, cz);
  dg.rotation.y = rotY;
  dynamicG.add(dg);

  const fDir = facing;
  const frontX = fDir * (widthX * 0.5);
  const groundH = 3.9;
  const floorH = 3.1;
  const totalH = groundH + (floors - 1) * floorH;

  addBox(g, [widthX + 0.16, 0.4, lengthZ + 0.16], [0, 0.2, 0], bank.dampPlinth, { uvScale: 2.0 });
  addBox(g, [widthX - 0.6, groundH, lengthZ], [-fDir * 0.3, groundH * 0.5, 0], accentMat, { uvScale: 2.6 });
  if (floors > 1) {
    addBox(g, [widthX, totalH - groundH, lengthZ], [0, groundH + (totalH - groundH) * 0.5, 0], wallMat, { uvScale: 2.8 });
  }

  // Ground shop bays
  const bays = Math.max(2, Math.floor(lengthZ / 4.2));
  const baySpan = lengthZ / bays;
  for (let i = 0; i <= bays; i++) {
    const bz = -lengthZ * 0.5 + i * baySpan;
    const colZ = i === 0 ? bz + 0.22 : (i === bays ? bz - 0.22 : bz);
    addBox(g, [0.46, groundH, 0.46], [frontX - fDir * 0.23, groundH * 0.5, colZ], accentMat);
  }
  const gfFront = frontX - fDir * 0.6;
  for (let b = 0; b < bays; b++) {
    const bz = -lengthZ * 0.5 + (b + 0.5) * baySpan;
    const slotW = baySpan - 0.72;
    if (b % 2 === 0 || displayKind === 'bakery') {
      const dm = displayKind === 'bakery' ? bank.dispBakery : bank.dispShop;
      addBox(dg, [0.10, 2.5, slotW], [gfFront + fDir * 0.05, 1.35, bz], dm, { castShadow: false });
      addBox(g, [0.16, 0.42, slotW], [gfFront + fDir * 0.08, 2.75, bz], bank.shutter, { uvScale: 1.5 });
    } else {
      addBox(g, [0.14, 2.78, slotW], [gfFront + fDir * 0.06, 1.4, bz], bank.shutter, { uvScale: 1.4 });
    }
  }
  addBox(g, [widthX + 0.7, 0.26, lengthZ + 0.36], [fDir * 0.24, groundH, 0], accentMat, { uvScale: 2.4 });

  // Upper stories with balconies, glass windows & AC units
  for (let f = 1; f < floors; f++) {
    const fy = groundH + f * floorH;
    const baseY = fy - floorH;
    addBox(g, [widthX + 0.52, 0.20, lengthZ + 0.24], [fDir * 0.16, fy, 0], accentMat, { uvScale: 2.4 });
    const nb = Math.max(2, Math.floor(lengthZ / 4.4));
    const sp = lengthZ / nb;
    for (let b = 0; b < nb; b++) {
      const bz = -lengthZ * 0.5 + (b + 0.5) * sp;
      const bw = Math.min(3.0, sp - 0.9);
      if ((b + f) % 2 === 0) {
        addBox(g, [0.98, 0.16, bw], [frontX + fDir * 0.46, baseY + 0.10, bz], accentMat);
        addBox(g, [0.14, 0.38, bw], [frontX + fDir * 0.90, baseY + 0.36, bz], accentMat);
        addBox(g, [0.06, 0.06, bw], [frontX + fDir * 0.90, baseY + 1.05, bz], bank.aluminum);
        addBox(dg, [0.16, 2.15, bw * 0.76], [frontX - fDir * 0.04, baseY + 1.22, bz], rnd() > 0.58 ? bank.warmWindow : bank.glass);
      } else {
        addBox(dg, [0.16, 1.50, bw * 0.72], [frontX + fDir * 0.04, baseY + 1.50, bz], rnd() > 0.62 ? bank.warmWindow : bank.glass);
        addBox(g, [0.24, 0.12, bw * 0.80], [frontX + fDir * 0.10, baseY + 2.30, bz], accentMat);
        if (rnd() > 0.48) {
          addBox(g, [0.34, 0.52, 0.72], [frontX + fDir * 0.18, baseY + 0.46, bz + bw * 0.22], bank.acBox);
        }
      }
    }
  }

  // Parapet, rooftop stairhead & Gazi water tank
  addBox(g, [0.22, 0.9, lengthZ], [frontX - fDir * 0.11, totalH + 0.45, 0], wallMat);
  addBox(g, [0.22, 0.9, lengthZ], [-frontX + fDir * 0.11, totalH + 0.45, 0], wallMat);
  addBox(g, [widthX, 0.9, 0.22], [0, totalH + 0.45, -lengthZ * 0.5 + 0.11], wallMat);
  addBox(g, [widthX, 0.9, 0.22], [0, totalH + 0.45, lengthZ * 0.5 - 0.11], wallMat);
  addBox(g, [3.0, 2.2, 3.2], [-fDir * 1.2, totalH + 1.1, 0], accentMat);
  addCyl(g, 0.65, 0.68, 1.4, [fDir * 1.3, totalH + 1.15, -lengthZ * 0.2], bank.waterTank, 10);

  return { totalH, frontX };
}

// ============================================================================
// MAIN RUPSHA + RUPSHA GHAT + RUPSHA PARK 3D WORLD BUILDER
// ============================================================================

export function buildRupshaMap3D(sharedUniforms) {
  const root = new THREE.Group();
  root.name = 'Khulna_Rupsha_Ghat_Park_3D_Map';

  const bank = createMaterials(sharedUniforms);

  const staticGround = new THREE.Group();
  const staticBuildings = new THREE.Group();
  const staticGhat = new THREE.Group();
  const staticPark = new THREE.Group();
  const staticBridge = new THREE.Group();
  const dynamicGroup = new THREE.Group();
  const foliageGroup = new THREE.Group();

  root.add(staticGround, staticBuildings, staticGhat, staticPark, staticBridge, dynamicGroup, foliageGroup);

  // ==========================================================================
  // 1) BASE TERRAIN, RUPSHA RIVER & WET-ASPHALT ROAD NETWORK
  // ==========================================================================
  // West bank land mass (Khulna city side: x = -180 .. +26, z = -150 .. +185)
  addBox(staticGround, [206, 1.4, 340], [-77, -0.71, 18], bank.concrete, { castShadow: false, uvScale: 6.0 });

  // Distant East Rupsha opposite shoreline (x = +245 .. +380)
  addBox(staticGround, [140, 1.8, 520], [315, -0.45, 45], bank.grass, { castShadow: false, uvScale: 10.0 });

  // Wide Animated Rupsha River Water Surface (x = +20 .. +260, z = -220 .. +340)
  const riverGeo = new THREE.PlaneGeometry(250, 580, 90, 120);
  riverGeo.rotateX(-Math.PI / 2);
  const riverMat = createStandaloneRupshaRiverMaterial(sharedUniforms);
  const riverMesh = new THREE.Mesh(riverGeo, riverMat);
  riverMesh.position.set(142, -0.35, 55);
  riverMesh.receiveShadow = false;
  dynamicGroup.add(riverMesh);

  // Continuous Sloped Concrete CC-Block Revetment Embankment along Rupsha River Bank (x = 24.5)
  for (let z = -130; z <= 165; z += 16) {
    const inGhatOpening = z > -24 && z < 8;
    const inParkDeck = z > 52 && z < 84;
    addBox(staticGhat, [5.2, 1.35, 16.4], [25.2, -0.36, z], bank.revetment, { rotZ: -0.24, uvScale: 2.6 });
    if (!inGhatOpening && !inParkDeck) {
      addBox(staticGhat, [2.0, 0.22, 16.2], [22.8, 0.10, z], bank.brick, { uvScale: 2.0 });
      if (z < 24) {
        addBox(staticGhat, [0.42, 0.65, 14.8], [23.8, 0.44, z], bank.hazard);
      }
    }
  }

  // ROAD 1: Khan Jahan Ali Road (North-South main artery at x = -85)
  addBox(staticGround, [12.0, 0.04, 240], [-85, 0.01, 10], bank.road, { castShadow: false, uvScale: 8.5 });
  // Red-brick sidewalks along Khan Jahan Ali Road
  for (const sx of [-92.2, -77.8]) {
    addBox(staticGround, [2.2, 0.16, 236], [sx, 0.08, 10], bank.brick, { castShadow: false, uvScale: 2.2 });
  }

  // ROAD 2: Rupsha Ghat Road (East-West from Traffic Mor x = -85 to Ghat Plaza x = +20 at z = -12)
  addBox(staticGround, [110, 0.045, 10.5], [-32, 0.014, -12], bank.road, { castShadow: false, rotY: 0, uvScale: 8.5 });
  // Sidewalks along Rupsha Ghat Rd
  addBox(staticGround, [62, 0.16, 1.9], [-46, 0.08, -18.2], bank.brick, { castShadow: false, uvScale: 2.2 });
  addBox(staticGround, [62, 0.16, 1.9], [-46, 0.08, -5.8], bank.brick, { castShadow: false, uvScale: 2.2 });

  // ROAD 3: Rupsha Strand & Park Road (North-South waterfront road at x = -16, from z = -100 to z = +128)
  addBox(staticGround, [8.6, 0.042, 230], [-16, 0.012, 14], bank.roadPlain, { castShadow: false, uvScale: 7.5 });

  // ==========================================================================
  // 2) RUPSHA TRAFFIC MOR (রূপসা ট্রাফিক মোড়) & LANDMARKS
  // ==========================================================================
  // Circular intersection pad & raised traffic island at (-85, -12)
  const jDisc = new THREE.Mesh(new THREE.CylinderGeometry(11.5, 11.5, 0.04, 32), bank.roadPlain);
  jDisc.position.set(-85, 0.016, -12);
  jDisc.receiveShadow = true;
  staticGround.add(jDisc);

  addCyl(staticBuildings, 3.6, 3.9, 0.36, [-85, 0.18, -12], bank.stone, 20);
  addCyl(staticBuildings, 3.2, 3.2, 0.12, [-85, 0.38, -12], bank.grass, 20);
  // KMP Traffic Police Box (ট্রাফিক পুলিশ বক্স) on the island
  addBox(staticBuildings, [2.1, 1.0, 2.1], [-85, 0.90, -12], bank.whiteWall);
  addBox(staticBuildings, [2.16, 0.22, 2.16], [-85, 1.12, -12], bank.steelBlue);
  addBox(staticBuildings, [1.85, 1.15, 1.85], [-85, 1.95, -12], bank.glass);
  addBox(staticBuildings, [2.65, 0.24, 2.65], [-85, 2.62, -12], bank.steelBlue);
  const policeBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), bank.beaconRed);
  policeBeacon.position.set(-85, 2.90, -12);
  dynamicGroup.add(policeBeacon);
  addSign(dynamicGroup, bank, {
    title: 'রূপসা ট্রাফিক মোড় · কেএমপি',
    subtitle: 'RUPSHA TRAFFIC MOR · KHULNA',
    bg: '#1e3a8a',
    accent: '#fde047',
  }, [-85, 3.15, -10.65], 0, 2.8, 0.65);

  // NW Corner: REZA TOWER (রেজা টাওয়ার — 5-Story Commercial Building)
  const reza = buildCommercialBuilding(staticBuildings, dynamicGroup, bank, {
    cx: -104, cz: -38, widthX: 14, lengthZ: 22, floors: 5, facing: 1,
    wallMat: bank.cream, accentMat: bank.whiteWall, displayKind: 'shop', seed: 201,
  });
  addSign(dynamicGroup, bank, {
    title: 'রেজা টাওয়ার · রূপসা ট্রাফিক মোড়',
    subtitle: 'REZA TOWER · COMMERCIAL COMPLEX · KHULNA',
    bg: '#0f3d2e',
    accent: '#fde047',
  }, [-96.8, 3.35, -38], Math.PI / 2, 8.2, 1.25);

  // SW Corner: TASTY TREAT - RUPSHA TRAFFIC MOR (টেস্টি ট্রিট বেকারি ও ক্যাফে)
  buildCommercialBuilding(staticBuildings, dynamicGroup, bank, {
    cx: -103, cz: 14, widthX: 13, lengthZ: 18, floors: 4, facing: 1,
    wallMat: bank.ochre, accentMat: bank.cream, displayKind: 'bakery', seed: 202,
  });
  // Signature red canopy awning for Tasty Treat
  addBox(staticBuildings, [2.0, 0.22, 14.5], [-95.5, 3.1, 14], bank.tastyRed, { rotZ: -0.18 });
  addSign(dynamicGroup, bank, {
    title: 'টেস্টি ট্রিট · রূপসা ট্রাফিক মোড়',
    subtitle: 'TASTY TREAT · BAKERY, CAKE & CAFE',
    bg: '#b91c1c',
    accent: '#fef08a',
  }, [-96.2, 3.65, 14], Math.PI / 2, 7.2, 1.15);

  // Additional Khulna Commercial Row along Khan Jahan Ali Rd West
  buildCommercialBuilding(staticBuildings, dynamicGroup, bank, {
    cx: -104, cz: -66, widthX: 13, lengthZ: 20, floors: 4, facing: 1,
    wallMat: bank.terracotta, accentMat: bank.cream, displayKind: 'shop', seed: 203,
  });
  buildCommercialBuilding(staticBuildings, dynamicGroup, bank, {
    cx: -103, cz: 42, widthX: 13, lengthZ: 20, floors: 3, facing: 1,
    wallMat: bank.sage, accentMat: bank.cream, displayKind: 'shop', seed: 204,
  });

  // SE Corner of Traffic Mor: RUPSHA KHULNA-BARISHAL BUS STAND (রূপসা বাস স্ট্যান্ড)
  addBox(staticGround, [28, 0.08, 28], [-62, 0.03, 14], bank.stone, { castShadow: false, uvScale: 3.0 });
  addBox(staticBuildings, [14, 0.22, 5.5], [-60, 0.11, 23], bank.brick, { uvScale: 2.0 });
  addBox(staticBuildings, [15, 0.16, 6.4], [-60, 3.45, 23], bank.tinBlue, { rotX: 0.08, uvScale: 2.0 });
  for (const px of [-66, -60, -54]) {
    for (const pz of [20.6, 25.4]) {
      addCyl(staticBuildings, 0.11, 0.12, 3.35, [px, 1.72, pz], bank.aluminum, 8);
    }
  }
  addSign(dynamicGroup, bank, {
    title: 'রূপসা খুলনা-বরিশাল বাস স্ট্যান্ড',
    subtitle: 'KHULNA · BARISHAL · BAGERHAT · MONGLA',
    bg: '#1e3a8a',
    accent: '#fde047',
  }, [-60, 3.95, 19.8], 0, 8.6, 1.25);

  // Parked Authentic Bangladeshi Intercity Bus at Rupsha Bus Stand
  const busG = new THREE.Group();
  busG.position.set(-63, 0.06, 11);
  busG.rotation.y = Math.PI * 0.5;
  addBox(busG, [2.45, 2.35, 9.6], [0, 1.65, 0], bank.steelBlue);
  addBox(busG, [2.48, 0.35, 9.64], [0, 1.25, 0], bank.goldAccent);
  addBox(busG, [2.50, 0.95, 8.2], [0, 2.15, 0.2], bank.glass);
  addBox(busG, [2.25, 1.05, 0.08], [0, 2.1, 4.82], bank.glass);
  for (const [wx, wz] of [[-1.18, 2.9], [1.18, 2.9], [-1.18, -2.8], [1.18, -2.8]]) {
    addCyl(busG, 0.48, 0.48, 0.28, [wx, 0.48, wz], bank.darkSlate, 12, [0, 0, Math.PI / 2]);
  }
  addSign(busG, bank, { title: 'রূপসা এক্সপ্রেস', subtitle: 'খুলনা - বরিশাল', bg: '#0c4a6e', accent: '#fde047' }, [1.26, 1.25, 0], Math.PI / 2, 4.2, 0.65);
  staticBuildings.add(busG);

  // NE Corner of Traffic Mor: RUPSHA JAME MOSQUE (রূপসা জামে মসজিদ)
  {
    const mx = -60;
    const mz = -38;
    addBox(staticBuildings, [18, 0.45, 16], [mx, 0.22, mz], bank.stone, { uvScale: 2.5 });
    addBox(staticBuildings, [15, 6.2, 13], [mx, 3.55, mz], bank.whiteWall, { uvScale: 2.6 });
    addBox(staticBuildings, [15.4, 0.4, 13.4], [mx, 6.75, mz], bank.mosqueGreen);
    // Central emerald dome + golden finial
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3.4, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), bank.mosqueGreen);
    dome.position.set(mx, 6.75, mz);
    staticBuildings.add(dome);
    addCyl(staticBuildings, 0.06, 0.14, 1.4, [mx, 10.6, mz], bank.goldAccent, 8);
    // Twin slender minarets
    for (const [dx, dz] of [[-7.2, 6.2], [7.2, 6.2]]) {
      addCyl(staticBuildings, 0.55, 0.72, 13.5, [mx + dx, 7.0, mz + dz], bank.whiteWall, 12);
      addCyl(staticBuildings, 0.82, 0.82, 0.25, [mx + dx, 11.2, mz + dz], bank.mosqueGreen, 12);
      const mdome = new THREE.Mesh(new THREE.SphereGeometry(0.58, 12, 8), bank.mosqueGreen);
      mdome.position.set(mx + dx, 13.9, mz + dz);
      staticBuildings.add(mdome);
    }
    // Glowing arched mosque windows
    for (const wx of [-4.2, 0, 4.2]) {
      addBox(dynamicGroup, [1.8, 2.4, 0.16], [mx + wx, 3.6, mz + 6.56], bank.warmWindow);
    }
    addSign(dynamicGroup, bank, {
      title: 'রূপসা ঘাট কেন্দ্রীয় জামে মসজিদ',
      subtitle: 'RUPSHA CENTRAL JAME MOSQUE · KHULNA',
      bg: '#14532d',
      accent: '#fde047',
    }, [mx, 5.8, mz + 6.65], 0, 7.2, 0.95);
  }

  // Commercial Shops lining Rupsha Ghat Road (North & South sides between Traffic Mor & Strand Rd)
  buildCommercialBuilding(staticBuildings, dynamicGroup, bank, {
    cx: -38, cz: -28, widthX: 12, lengthZ: 18, floors: 3, facing: 1, rotY: -Math.PI / 2,
    wallMat: bank.terracotta, accentMat: bank.cream, displayKind: 'shop', seed: 210,
  });
  buildCommercialBuilding(staticBuildings, dynamicGroup, bank, {
    cx: -38, cz: 5, widthX: 12, lengthZ: 18, floors: 3, facing: 1, rotY: Math.PI / 2,
    wallMat: bank.sage, accentMat: bank.cream, displayKind: 'shop', seed: 211,
  });

  // ==========================================================================
  // 3) RUPSHA WHOLESALE FISH MARKET (রূপসা পাইকারি মৎস্য বাজার · NORTH WATERFRONT)
  // ==========================================================================
  {
    const fx = 2;
    const fz = -62;
    addBox(staticGround, [42, 0.14, 46], [fx, 0.05, fz], bank.stone, { castShadow: false, uvScale: 3.2 });

    // Twin Pitched Steel-Truss Fish Auction Sheds
    for (const sz of [-72, -52]) {
      addBox(staticGhat, [26, 0.22, 12], [fx, 0.18, sz], bank.concrete, { uvScale: 2.5 });
      addBox(staticGhat, [27, 0.16, 7.2], [fx, 4.35, sz - 3.1], bank.tinTeal, { rotX: -0.22, uvScale: 2.0 });
      addBox(staticGhat, [27, 0.16, 7.2], [fx, 4.35, sz + 3.1], bank.tinTeal, { rotX: 0.22, uvScale: 2.0 });
      for (let px = fx - 11; px <= fx + 11; px += 5.5) {
        for (const pz of [sz - 5.2, sz + 5.2]) {
          addCyl(staticGhat, 0.12, 0.14, 3.8, [px, 2.0, pz], bank.aluminum, 6);
        }
        // Warm hanging auction lamps
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), bank.lampWarm);
        bulb.position.set(px, 3.7, sz);
        dynamicGroup.add(bulb);
      }
      // Fish ice crates, baskets & auction platforms
      for (let cx = fx - 9; cx <= fx + 9; cx += 3.2) {
        addBox(staticGhat, [1.1, 0.55, 0.85], [cx, 0.58, sz - 1.8], bank.tinBlue);
        addBox(staticGhat, [1.0, 0.50, 0.80], [cx + 0.5, 0.56, sz + 1.8], bank.ferryOrange);
        addCyl(staticGhat, 0.42, 0.34, 0.42, [cx + 1.2, 0.50, sz], bank.bamboo, 8);
      }
    }
    addSign(dynamicGroup, bank, {
      title: 'রূপসা পাইকারি মৎস্য বাজার · খুলনা',
      subtitle: 'RUPSHA WHOLESALE FISH MARKET · RIVERFRONT',
      bg: '#0c4a6e',
      accent: '#fde047',
    }, [-11.5, 4.5, -62], -Math.PI / 2, 9.6, 1.45);
  }

  // ==========================================================================
  // 4) RUPSHA GHAT, BIWTC FERRY TERMINAL, LAUNCH & STREET FOOD STALLS
  // ==========================================================================
  // Broad Paved Ghat Forecourt Plaza (x = -12 .. +23, z = -34 .. +24)
  addBox(staticGround, [38, 0.12, 58], [5, 0.04, -5], bank.stone, { castShadow: false, uvScale: 3.4 });

  // BIWTC Steel Truss Welcome Gantry Arch spanning Rupsha Ghat Rd at x = -4, z = -12
  addCyl(staticGhat, 0.28, 0.34, 7.6, [-4, 3.8, -18.5], bank.steelBlue, 10);
  addCyl(staticGhat, 0.28, 0.34, 7.6, [-4, 3.8, -5.5], bank.steelBlue, 10);
  addBox(staticGhat, [1.1, 1.5, 14.5], [-4, 7.2, -12], bank.steelBlue);
  addSign(dynamicGroup, bank, {
    title: 'বিআইডব্লিউটিসি রূপসা ফেরি ও লঞ্চ ঘাট',
    subtitle: 'BIWTC RUPSHA GHAT · KHULNA — EAST RUPSHA CROSSING',
    bg: '#064e3b',
    accent: '#fde047',
  }, [-4.6, 7.2, -12], -Math.PI / 2, 10.6, 1.75);

  // Glazed Ghat Ticket & Toll Counter (ঘাট ভাড়া ২ টাকা · ট্রলার ৫ টাকা)
  addBox(staticGhat, [3.4, 1.1, 3.2], [3.5, 0.6, -18.2], bank.sage);
  addBox(staticGhat, [3.1, 1.2, 2.9], [3.5, 1.75, -18.2], bank.glass);
  addBox(dynamicGroup, [2.2, 0.8, 2.0], [3.5, 1.75, -18.2], bank.warmWindow, { castShadow: false });
  addBox(staticGhat, [4.2, 0.24, 4.0], [3.5, 2.55, -18.2], bank.ferryOrange);
  addSign(dynamicGroup, bank, {
    title: 'ঘাট টোল ২৳ · ট্রলার ভাড়া ৫৳',
    subtitle: 'RUPSHA GHAT TICKET COUNTER',
    bg: '#7c2d12',
    accent: '#fde047',
  }, [3.5, 2.85, -16.15], 0, 3.6, 0.65);

  // Passenger Waiting Shed (রূপসা ঘাট যাত্রী ছাউনি)
  addBox(staticGhat, [12.0, 0.22, 6.2], [6, 0.16, 14], bank.brick, { uvScale: 2.0 });
  addBox(staticGhat, [13.0, 0.16, 7.0], [6, 3.45, 14], bank.tinBlue, { rotX: 0.08, uvScale: 2.0 });
  for (const px of [1, 6, 11]) {
    for (const pz of [11.4, 16.6]) {
      addCyl(staticGhat, 0.10, 0.12, 3.3, [px, 1.72, pz], bank.aluminum, 6);
    }
  }
  // Benches inside passenger shed
  for (const bx of [2.5, 9.5]) {
    addBox(staticGhat, [3.2, 0.45, 0.7], [bx, 0.45, 14], bank.concrete);
  }

  // Famous Rupsha Ghat Evening Tea, Peyaju & Ghugni Stalls (চা-পেঁয়াজু-ঘুগনি স্টল)
  for (let i = 0; i < 3; i++) {
    const sx = -5 + i * 6.5;
    const sz = 4.5;
    addBox(staticGhat, [3.2, 0.95, 1.6], [sx, 0.52, sz], bank.woodDeck);
    addCyl(staticGhat, 0.06, 0.06, 2.5, [sx - 1.4, 1.3, sz - 0.6], bank.bamboo, 6);
    addCyl(staticGhat, 0.06, 0.06, 2.5, [sx + 1.4, 1.3, sz - 0.6], bank.bamboo, 6);
    addBox(staticGhat, [3.8, 0.10, 2.4], [sx, 2.58, sz], i % 2 === 0 ? bank.tinRust : bank.tinBlue, { rotX: 0.15 });
    const stallLamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), bank.fairyBulb);
    stallLamp.position.set(sx, 2.30, sz + 0.5);
    dynamicGroup.add(stallLamp);
  }
  addSign(dynamicGroup, bank, {
    title: 'রূপসা ঘাটের গরম চা · পেঁয়াজু · ঘুগনি',
    subtitle: 'FAMOUS RUPSHA GHAT EVENING SNACKS',
    bg: '#9a3412',
    accent: '#fef08a',
  }, [1.5, 3.15, 5.6], 0, 5.8, 0.82);

  // Broad Stepped Concrete River Ghat (রূপসা ঘাটের পাকা সিঁড়ি) plunging into the Rupsha River
  for (let s = 0; s < 8; s++) {
    addBox(staticGhat, [1.5, 0.24, 30.0], [21.5 + s * 1.12, 0.16 - s * 0.12, -8], bank.concrete, { uvScale: 2.4 });
  }

  // Floating Steel Pontoon Jetty Barge & Gangway (পন্টুন জেটি)
  addBox(staticGhat, [10.0, 0.88, 26.0], [37.5, -0.02, -10], bank.darkSlate);
  addBox(staticGhat, [9.4, 0.14, 25.2], [37.5, 0.46, -10], bank.deckGreen);
  addBox(staticGhat, [11.5, 0.18, 3.6], [28.0, 0.18, -10], bank.darkMetal, { rotZ: -0.04 });
  // Gangway side safety rails
  for (const gz of [-11.7, -8.3]) {
    addBox(staticGhat, [11.5, 0.08, 0.08], [28.0, 1.12, gz], bank.aluminum, { rotZ: -0.04 });
  }
  // Orange mooring bollards on pontoon
  for (const bz of [-20, -13, -6, 1]) {
    addCyl(staticGhat, 0.22, 0.26, 0.85, [42.0, 0.78, bz], bank.ferryOrange, 8);
  }

  // Animated Vessels List
  const bobbingVessels = [];
  const movingBoats = [];

  // HERO VESSEL 1: Moored 3-Deck Bangladeshi Passenger Launch (এম.ভি. রূপসা এক্সপ্রেস)
  {
    const launch = new THREE.Group();
    launch.position.set(50.5, -0.22, -16);
    launch.rotation.y = 0.08;
    addBox(launch, [9.6, 2.3, 34.0], [0, 1.15, 0], bank.hullNavy);
    addBox(launch, [9.8, 0.34, 34.2], [0, 2.32, 0], bank.ferryOrange);
    const bow = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 5.1, 7.2, 4), bank.hullNavy);
    bow.rotation.x = Math.PI / 2;
    bow.rotation.z = Math.PI / 4;
    bow.scale.set(1.0, 0.45, 1.0);
    bow.position.set(0, 1.25, 20.0);
    launch.add(bow);

    // 2nd & 3rd Cabin Decks + Verandah Columns + Lit Cabin Windows
    addBox(launch, [8.4, 2.7, 28.5], [0, 3.85, -1.0], bank.launchWhite);
    addBox(launch, [9.0, 0.24, 30.0], [0, 5.25, -1.0], bank.deckGreen);
    addBox(launch, [6.6, 2.4, 20.5], [0, 6.55, -2.0], bank.launchWhite);
    addBox(launch, [7.0, 0.24, 21.5], [0, 7.80, -2.0], bank.deckGreen);
    for (const sx of [-4.22, 4.22]) {
      addBox(launch, [0.08, 1.1, 24.5], [sx, 3.95, -1.0], bank.warmWindow);
      addBox(launch, [0.08, 1.0, 17.0], [sx * 0.79, 6.62, -2.0], bank.warmWindow);
    }
    // Captain Pilothouse & Radar Mast
    addBox(launch, [4.5, 2.15, 6.0], [0, 8.95, 5.2], bank.launchWhite);
    addBox(launch, [4.6, 0.9, 3.6], [0, 9.15, 6.6], bank.glass);
    addCyl(launch, 0.12, 0.18, 4.4, [0, 12.1, 4.6], bank.aluminum, 8);
    const mastLight = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), bank.beaconRed);
    mastLight.position.set(0, 14.3, 4.6);
    launch.add(mastLight);
    addSign(launch, bank, { title: 'এম.ভি. রূপসা এক্সপ্রেস', subtitle: 'খুলনা — সুন্দরবন — মংলা', bg: '#0c4a6e', accent: '#fde047' }, [-4.6, 5.45, 0], -Math.PI / 2, 7.2, 0.95);
    dynamicGroup.add(launch);
    bobbingVessels.push({ obj: launch, baseY: -0.22, amp: 0.09, speed: 1.05, phase: 0.3 });
    addWire(staticGhat, [42.0, 0.9, -20], [45.8, 2.1, -24], bank.rope, 0.5, 0.045);
    addWire(staticGhat, [42.0, 0.9, -6], [45.8, 2.1, -4], bank.rope, 0.5, 0.045);
  }

  // HERO VESSEL 2: Docked BIWTC Ro-Ro Vehicle Ferry with TATA Truck & CNG on Deck!
  {
    // Hydraulic ramp at z = +10
    addBox(staticGhat, [15.5, 0.36, 9.2], [31.5, 0.14, 10], bank.darkSlate, { rotZ: -0.03 });
    addBox(staticGhat, [15.5, 0.22, 0.42], [31.5, 0.65, 5.5], bank.hazard, { rotZ: -0.03 });
    addBox(staticGhat, [15.5, 0.22, 0.42], [31.5, 0.65, 14.5], bank.hazard, { rotZ: -0.03 });

    const ferry = new THREE.Group();
    ferry.position.set(57.5, -0.22, 10.0);
    ferry.rotation.y = Math.PI * 0.5;
    addBox(ferry, [11.4, 1.8, 36.0], [0, 0.90, 0], bank.hullNavy);
    addBox(ferry, [10.0, 0.20, 35.0], [0, 1.84, 0], bank.deckGreen);
    addBox(ferry, [8.4, 0.18, 3.6], [0, 1.70, 19.0], bank.ferryOrange, { rotX: 0.18 });
    addBox(ferry, [8.4, 0.18, 3.6], [0, 1.70, -19.0], bank.ferryOrange, { rotX: -0.18 });
    addBox(ferry, [2.5, 5.2, 14.0], [4.3, 4.4, 0], bank.launchWhite);
    addBox(ferry, [2.7, 0.34, 14.6], [4.3, 7.05, 0], bank.ferryOrange);
    addBox(ferry, [0.12, 1.1, 9.0], [3.0, 5.65, 0], bank.glass);
    addCyl(ferry, 0.45, 0.55, 2.6, [4.3, 8.4, -3.2], bank.hullNavy, 10);

    const vBank = {
      tire: bank.darkSlate, rim: bank.aluminum, darkTrim: bank.darkMetal, chrome: bank.aluminum,
      windshield: bank.glass, headlight: bank.lampWarm, taillight: bank.beaconRed, amber: bank.goldAccent,
      cngGreen: bank.deckGreen, cngYellow: bank.goldAccent, cngRexine: bank.darkSlate,
      truckCab: bank.ferryOrange, truckBed: bank.tinBlue, plate: bank.cream,
    };
    const deckTruck = buildBanglaTruck(vBank);
    deckTruck.position.set(-1.4, 1.94, -3.5);
    ferry.add(deckTruck);
    const deckCng = buildCNGAuto(vBank);
    deckCng.position.set(1.2, 1.94, 5.0);
    ferry.add(deckCng);
    dynamicGroup.add(ferry);
    bobbingVessels.push({ obj: ferry, baseY: -0.22, amp: 0.065, speed: 0.85, phase: 1.5 });
  }

  // Animated Rupsha Trawlers & Wooden Country Boats (নৌকা ও ট্রলার) crossing the Rupsha River!
  const noukaShape = new THREE.Shape();
  noukaShape.moveTo(0, 4.4);
  noukaShape.quadraticCurveTo(1.0, 1.6, 0.92, 0);
  noukaShape.quadraticCurveTo(0.96, -1.8, 0, -4.4);
  noukaShape.quadraticCurveTo(-0.96, -1.8, -0.92, 0);
  noukaShape.quadraticCurveTo(-1.0, 1.6, 0, 4.4);
  const noukaGeo = new THREE.ExtrudeGeometry(noukaShape, { depth: 0.65, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 });
  noukaGeo.rotateX(Math.PI / 2);

  const boatRoutes = [
    { startX: 62, endX: 215, z: -48, speed: 0.022, phase: 0.1, isTrawler: true },
    { startX: 210, endX: 66, z: -28, speed: 0.020, phase: 0.45, isTrawler: true },
    { startX: 78, endX: 220, z: 32, speed: 0.018, phase: 0.72, isTrawler: false },
    { startX: 215, endX: 82, z: 66, speed: 0.016, phase: 0.25, isTrawler: false },
    { startX: 68, endX: 218, z: 105, speed: 0.021, phase: 0.88, isTrawler: true },
    { startX: 110, endX: 185, z: 145, speed: 0.014, phase: 0.55, isTrawler: false },
  ];
  for (const br of boatRoutes) {
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(noukaGeo, br.isTrawler ? bank.hullNavy : bank.woodBoat);
    hull.position.y = 0.56;
    hull.scale.set(br.isTrawler ? 1.35 : 1.0, 1.0, br.isTrawler ? 1.45 : 1.0);
    hull.castShadow = true;
    boat.add(hull);
    const canopy = new THREE.Mesh(
      new THREE.CylinderGeometry(br.isTrawler ? 1.15 : 0.86, br.isTrawler ? 1.15 : 0.86, br.isTrawler ? 4.4 : 3.2, 10, 1, false, 0, Math.PI),
      br.isTrawler ? bank.tinBlue : bank.bamboo
    );
    canopy.rotation.z = Math.PI / 2;
    canopy.rotation.y = Math.PI / 2;
    canopy.position.set(0, 0.56, -0.2);
    boat.add(canopy);
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), bank.fairyBulb);
    lantern.position.set(0, 1.45, br.isTrawler ? 3.5 : 2.6);
    boat.add(lantern);
    dynamicGroup.add(boat);
    movingBoats.push({ obj: boat, ...br });
  }

  // ==========================================================================
  // 5) RUPSHA RIVER PARK (রূপসা রিভার পার্ক · SOUTH-EAST RIVERFRONT)
  // ==========================================================================
  // Lush Emerald Park Lawn Base (x = -46 .. +23, z = +26 .. +128)
  addBox(staticPark, [70, 0.14, 102], [-11, 0.05, 77], bank.grass, { castShadow: false, uvScale: 5.5 });

  // Park Perimeter Low Brick Wall & Iron Railing (West & North sides)
  addBox(staticPark, [0.32, 0.95, 78], [-45.5, 0.52, 88], bank.brickWall, { uvScale: 2.0 });
  addBox(staticPark, [44, 0.95, 0.32], [-2, 0.52, 26.5], bank.brickWall, { uvScale: 2.0 });
  addBox(staticPark, [68, 0.95, 0.32], [-11, 0.52, 127.5], bank.brickWall, { uvScale: 2.0 });

  // GRAND ILLUMINATED PARK ENTRANCE GATE (রূপসা রিভার পার্ক · খুলনা) at (-36, 26.5)
  {
    const gx = -32;
    const gz = 26.5;
    for (const sx of [-4.4, 4.4]) {
      addBox(staticPark, [1.2, 5.4, 1.2], [gx + sx, 2.7, gz], bank.cream, { uvScale: 2.0 });
      addBox(staticPark, [1.45, 0.35, 1.45], [gx + sx, 5.45, gz], bank.terracotta);
      const gLamp = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), bank.lampWarm);
      gLamp.position.set(gx + sx, 5.88, gz);
      dynamicGroup.add(gLamp);
    }
    // Overhead Curved Park Arch Beam
    addBox(staticPark, [10.4, 1.35, 1.0], [gx, 5.35, gz], bank.mosqueGreen);
    addBox(staticPark, [10.8, 0.22, 1.15], [gx, 6.08, gz], bank.goldAccent);
    addSign(dynamicGroup, bank, {
      title: 'রূপসা রিভার পার্ক · খুলনা',
      subtitle: 'RUPSHA RIVER PARK · SUNSET VIEWPOINT',
      bg: '#064e3b',
      accent: '#fde047',
    }, [gx, 5.35, gz - 0.55], Math.PI, 8.8, 1.25);
    addSign(dynamicGroup, bank, {
      title: 'রূপসা রিভার পার্ক · খুলনা',
      subtitle: 'RUPSHA RIVER PARK · SUNSET VIEWPOINT',
      bg: '#064e3b',
      accent: '#fde047',
    }, [gx, 5.35, gz + 0.55], 0, 8.8, 1.25);

    // Park Entry Ticket Kiosk
    addBox(staticPark, [2.6, 2.5, 2.4], [gx + 6.8, 1.25, gz + 2.2], bank.cream);
    addBox(staticPark, [3.2, 0.25, 3.0], [gx + 6.8, 2.65, gz + 2.2], bank.terracotta);
  }

  // Park Interlocking Red-Brick Promenade & Cross Walkways
  // 1) Main Scenic Riverfront Promenade (x = +19, z = +27 .. +126)
  addBox(staticPark, [7.2, 0.18, 99], [19.4, 0.12, 76.5], bank.brick, { castShadow: false, uvScale: 2.2 });
  // 2) Entrance Avenue leading from Gate (-32, 27) -> Central Fountain (-6, 68)
  addBox(staticPark, [4.6, 0.16, 48], [-19, 0.11, 47], bank.brick, { castShadow: false, rotY: 0.56, uvScale: 2.2 });
  // 3) East-West Fountain-to-Cafe-Deck Axis (z = 68)
  addBox(staticPark, [60, 0.16, 4.8], [-12, 0.11, 68], bank.brick, { castShadow: false, uvScale: 2.2 });
  // 4) North-South Spine through Fountain (x = -6)
  addBox(staticPark, [4.4, 0.16, 94], [-6, 0.11, 77], bank.brick, { castShadow: false, uvScale: 2.2 });

  // Ornate Cast-Iron Riverfront Railings & Viewing Benches along Rupsha River Promenade!
  for (let rz = 30; rz <= 122; rz += 4) {
    const inCafeDeck = rz >= 54 && rz <= 82;
    if (!inCafeDeck) {
      addCyl(staticPark, 0.05, 0.06, 1.15, [22.8, 0.72, rz], bank.darkMetal, 6);
      addBox(staticPark, [0.06, 0.07, 4.0], [22.8, 1.26, rz + 2], bank.darkMetal);
      addBox(staticPark, [0.05, 0.05, 4.0], [22.8, 0.76, rz + 2], bank.darkMetal);
    }
    // River-facing park benches every 12m
    if (rz % 12 === 0 && !inCafeDeck) {
      addBox(staticPark, [0.65, 0.10, 2.2], [20.6, 0.58, rz], bank.woodDeck);
      addBox(staticPark, [0.10, 0.55, 2.2], [20.3, 0.88, rz], bank.woodDeck);
      for (const lz of [-0.85, 0.85]) {
        addBox(staticPark, [0.55, 0.48, 0.10], [20.6, 0.34, rz + lz], bank.darkMetal);
      }
    }
  }

  // CENTRAL CIRCULAR FOUNTAIN PLAZA (-6, 68) with Animated Sparkling Water Jets!
  const fountainJets = [];
  {
    const fx = -6;
    const fz = 68;
    addCyl(staticPark, 10.5, 10.8, 0.22, [fx, 0.13, fz], bank.stone, 28);
    // Outer stone basin rim + glowing water pool
    addCyl(staticPark, 4.8, 5.1, 0.75, [fx, 0.55, fz], bank.cream, 24);
    addCyl(dynamicGroup, 4.35, 4.35, 0.58, [fx, 0.58, fz], bank.fountainWater, 24, null, { castShadow: false });
    // Center tiered pedestal
    addCyl(staticPark, 1.4, 1.8, 1.35, [fx, 0.95, fz], bank.cream, 16);
    addCyl(staticPark, 2.2, 0.8, 0.45, [fx, 1.75, fz], bank.cream, 16);
    addCyl(staticPark, 0.65, 0.95, 1.05, [fx, 2.35, fz], bank.cream, 14);
    addCyl(staticPark, 1.15, 0.45, 0.32, [fx, 2.95, fz], bank.goldAccent, 14);
    // Underwater LED ring
    const ledRing = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.12, 8, 24), bank.fountainLed);
    ledRing.rotation.x = Math.PI / 2;
    ledRing.position.set(fx, 0.86, fz);
    dynamicGroup.add(ledRing);

    // Animated fountain water jet droplets
    const jetGeo = new THREE.SphereGeometry(0.14, 6, 6);
    for (let i = 0; i < 24; i++) {
      const m = new THREE.Mesh(jetGeo, bank.fountainWater);
      dynamicGroup.add(m);
      fountainJets.push({
        mesh: m,
        cx: fx,
        cz: fz,
        angle: (i / 24) * Math.PI * 2,
        phase: (i % 6) / 6,
        radius: 1.4 + (i % 3) * 0.75,
        peakY: 3.8 + (i % 2) * 1.1,
      });
    }

    // 4 Radial benches + colorful flowerbeds around Fountain Plaza
    for (let b = 0; b < 4; b++) {
      const ang = (b / 4) * Math.PI * 2 + Math.PI * 0.25;
      const bx = fx + Math.cos(ang) * 8.2;
      const bz = fz + Math.sin(ang) * 8.2;
      addBox(staticPark, [2.4, 0.52, 0.68], [bx, 0.45, bz], bank.woodDeck, { rotY: -ang + Math.PI / 2 });
      // Flowerbed cluster
      const flx = fx + Math.cos(ang) * 12.2;
      const flz = fz + Math.sin(ang) * 12.2;
      addCyl(staticPark, 2.2, 2.4, 0.24, [flx, 0.18, flz], bank.brickWall, 12);
      for (let f = 0; f < 6; f++) {
        const fa = (f / 6) * Math.PI * 2;
        const fMat = f % 3 === 0 ? bank.flowerRed : (f % 3 === 1 ? bank.flowerYellow : bank.flowerPink);
        const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), fMat);
        bush.position.set(flx + Math.cos(fa) * 1.1, 0.55, flz + Math.sin(fa) * 1.1);
        staticPark.add(bush);
      }
    }
  }

  // RIVERSIDE OPEN-AIR CAFE & CANTILEVERED SUNSET VIEWING DECK (রূপসা সানসেট ক্যাফে ও ভিউপয়েন্ট)
  {
    const dx = 23.5;
    const dz = 68;
    // Wooden viewing deck jutting right out over the Rupsha River edge!
    addBox(staticPark, [14.5, 0.34, 28.0], [dx, 0.32, dz], bank.woodDeck, { uvScale: 2.2 });
    // Concrete river support pilings underneath cantilevered edge
    for (const pz of [56, 64, 72, 80]) {
      addCyl(staticPark, 0.28, 0.32, 2.4, [dx + 5.8, -0.8, pz], bank.concrete, 8);
    }
    // Modern Glass-and-Steel Waterfront Railing
    addBox(dynamicGroup, [0.08, 1.05, 27.6], [dx + 7.1, 1.02, dz], bank.glassRail, { castShadow: false });
    addBox(staticPark, [0.10, 0.08, 27.8], [dx + 7.1, 1.56, dz], bank.aluminum);

    // Timber Pergola & Glowing Warm Fairy String Lights!
    for (const px of [dx - 4.8, dx + 4.8]) {
      for (const pz of [58, 68, 78]) {
        addBox(staticPark, [0.24, 3.6, 0.24], [px, 2.25, pz], bank.woodBoat);
      }
    }
    for (let pz = 57; pz <= 79; pz += 2.2) {
      addBox(staticPark, [10.4, 0.14, 0.14], [dx, 4.05, pz], bank.woodBoat);
    }
    // Fairy light bulbs strung across the pergola roof (blooms beautifully at dusk/night!)
    for (let pz = 58; pz <= 78; pz += 4.0) {
      for (let px = dx - 4.0; px <= dx + 4.0; px += 2.0) {
        const fb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), bank.fairyBulb);
        fb.position.set(px, 3.85 - Math.cos((px - dx) * 0.35) * 0.18, pz);
        dynamicGroup.add(fb);
      }
    }

    // Cafe Counter Kiosk (রূপসা পার্ক ক্যাফে)
    addBox(staticPark, [4.2, 2.8, 7.6], [dx - 8.2, 1.55, dz], bank.cream);
    addBox(staticPark, [4.8, 0.24, 8.2], [dx - 8.2, 3.05, dz], bank.terracotta);
    addBox(dynamicGroup, [0.14, 1.35, 5.4], [dx - 6.05, 1.75, dz], bank.dispBakery, { castShadow: false });
    addSign(dynamicGroup, bank, {
      title: 'রূপসা রিভার ক্যাফে ও কফি কর্নার',
      subtitle: 'COFFEE · TEA · SNACKS · SUNSET DECK',
      bg: '#451a03',
      accent: '#fde047',
    }, [dx - 5.95, 3.55, dz], Math.PI / 2, 6.8, 0.95);

    // Cafe Bistro Tables with Colorful Parasol Umbrellas
    for (const [tx, tz, umbMat] of [
      [dx + 1.2, 60, bank.tastyRed],
      [dx + 1.2, 68, bank.tinTeal],
      [dx + 1.2, 76, bank.ferryOrange],
      [dx - 2.6, 63, bank.goldAccent],
      [dx - 2.6, 73, bank.tinBlue],
    ]) {
      addCyl(staticPark, 0.65, 0.65, 0.08, [tx, 1.22, tz], bank.whiteWall, 12);
      addCyl(staticPark, 0.06, 0.08, 0.72, [tx, 0.85, tz], bank.darkMetal, 8);
      addCyl(staticPark, 0.035, 0.035, 2.4, [tx, 1.7, tz], bank.aluminum, 6);
      const umb = new THREE.Mesh(new THREE.ConeGeometry(1.55, 0.65, 10), umbMat);
      umb.position.set(tx, 2.95, tz);
      staticPark.add(umb);
    }
  }

  // OCTAGONAL SHADED GAZEBO / CHHATRI PAVILION (-28, 96)
  {
    const gx = -28;
    const gz = 96;
    addCyl(staticPark, 5.4, 5.8, 0.45, [gx, 0.28, gz], bank.stone, 8);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      addCyl(staticPark, 0.16, 0.19, 3.3, [gx + Math.cos(a) * 4.5, 2.1, gz + Math.sin(a) * 4.5], bank.whiteWall, 8);
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(6.2, 2.2, 8), bank.terracotta);
    roof.position.set(gx, 4.85, gz);
    roof.castShadow = true;
    staticPark.add(roof);
    const gBulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), bank.lampWarm);
    gBulb.position.set(gx, 3.65, gz);
    dynamicGroup.add(gBulb);
  }

  // CHILDREN'S PLAY ZONE (-28, 52) — Swings & Slide
  {
    const px = -28;
    const pz = 52;
    addBox(staticPark, [14, 0.14, 14], [px, 0.10, pz], bank.cream, { castShadow: false });
    // Swing A-frame
    addCyl(staticPark, 0.07, 0.08, 3.2, [px - 3.5, 1.6, pz - 1.2], bank.tastyRed, 6, [0.22, 0, 0]);
    addCyl(staticPark, 0.07, 0.08, 3.2, [px - 3.5, 1.6, pz + 1.2], bank.tastyRed, 6, [-0.22, 0, 0]);
    addCyl(staticPark, 0.07, 0.08, 3.2, [px + 1.5, 1.6, pz - 1.2], bank.tastyRed, 6, [0.22, 0, 0]);
    addCyl(staticPark, 0.07, 0.08, 3.2, [px + 1.5, 1.6, pz + 1.2], bank.tastyRed, 6, [-0.22, 0, 0]);
    addBox(staticPark, [5.4, 0.12, 0.12], [px - 1.0, 3.12, pz], bank.goldAccent);
    // Slide
    addBox(staticPark, [1.2, 2.2, 1.2], [px + 4.2, 1.15, pz - 2.0], bank.steelBlue);
    addBox(staticPark, [1.0, 0.12, 3.8], [px + 4.2, 1.25, pz + 0.4], bank.goldAccent, { rotX: 0.56 });
  }

  // ==========================================================================
  // 6) ULTRA-REALISTIC KHAN JAHAN ALI BRIDGE (রূপসা সেতু · GLB + SHIPS + NIGHT LIGHTS)
  // ==========================================================================
  const khanJahanAliBridge = buildKhanJahanAliBridge({
    position: [135, -0.35, 195],
    scale: 0.72,
    shipTravelRangeZ: 150,
    enableDeckTraffic: true,
    enablePointLights: true,
  });
  dynamicGroup.add(khanJahanAliBridge.root);

  // ==========================================================================
  // 7) LUSH TROPICAL FOLIAGE, STREETLAMPS & OVERHEAD KHULNA WIRES
  // ==========================================================================
  // Park Shade Rain-Trees & Coconut Palms
  const parkTrees = [
    [-38, 42, 1.15], [-38, 72, 1.2], [-38, 114, 1.15], [-16, 44, 1.05],
    [-16, 108, 1.2], [6, 42, 1.1], [6, 98, 1.18], [8, 116, 1.05],
    [-26, 76, 1.0], [-4, 118, 1.12], [-72, -62, 1.15], [-72, 48, 1.15],
  ];
  for (let i = 0; i < parkTrees.length; i++) {
    const [tx, tz, sc] = parkTrees[i];
    addTropicalTree(foliageGroup, bank, tx, tz, sc, 300 + i * 17);
  }

  const palms = [
    [16, 34, 8.6], [16, 48, 9.2], [16, 90, 8.8], [16, 108, 9.4], [16, 122, 8.2],
    [-20, 34, 8.0], [4, 54, 8.5], [4, 82, 8.8], [-18, 90, 9.0],
    [18, -32, 8.4], [18, 22, 8.2], [-56, -24, 8.6], [-56, 32, 8.4],
  ];
  for (let i = 0; i < palms.length; i++) {
    const [px, pz, h] = palms[i];
    addCoconutPalm(foliageGroup, bank, px, pz, h, i * 1.1);
  }

  // Distant East Rupsha treeline silhouette across the river
  for (let ez = -140; ez <= 220; ez += 24) {
    addTropicalTree(foliageGroup, bank, 258 + (Math.abs(ez) % 3) * 10, ez, 2.2, 800 + ez);
  }

  // Park Ornamental Lamps & City Streetlamps with Overhead Wires
  for (const [lx, lz] of [
    [17, 36], [17, 50], [17, 88], [17, 106], [17, 120],
    [-14, 58], [-14, 78], [2, 58], [2, 78], [-22, 42], [-22, 92],
  ]) {
    addStreetLamp(staticPark, dynamicGroup, bank, lx, lz, 1, true);
  }

  const roadPoles = [];
  for (let pz = -90; pz <= 95; pz += 32) {
    addStreetLamp(staticBuildings, dynamicGroup, bank, -77.6, pz, -1, false);
    roadPoles.push([-77.6, 8.4, pz]);
  }
  for (let i = 0; i < roadPoles.length - 1; i++) {
    addWire(dynamicGroup, roadPoles[i], roadPoles[i + 1], bank.wire, 0.55, 0.018);
    addWire(dynamicGroup, [roadPoles[i][0], 7.8, roadPoles[i][2]], [roadPoles[i + 1][0], 7.8, roadPoles[i + 1][2]], bank.wire, 0.72, 0.016);
  }
  const ghatPoles = [];
  for (let px = -70; px <= 12; px += 26) {
    addStreetLamp(staticBuildings, dynamicGroup, bank, px, -18.5, 1, false);
    ghatPoles.push([px, 8.4, -18.5]);
  }
  for (let i = 0; i < ghatPoles.length - 1; i++) {
    addWire(dynamicGroup, ghatPoles[i], ghatPoles[i + 1], bank.wire, 0.48, 0.018);
  }

  // ==========================================================================
  // 8) LIVE KHULNA TRAFFIC (CNGs, EASYBIKES, SEDANS, TATA TRUCK)
  // ==========================================================================
  const vBank = {
    tire: bank.darkSlate, rim: bank.aluminum, darkTrim: bank.darkMetal, chrome: bank.aluminum,
    windshield: bank.glass, headlight: bank.lampWarm, taillight: bank.beaconRed, amber: bank.goldAccent,
    cngGreen: bank.deckGreen, cngYellow: bank.goldAccent, cngRexine: bank.darkSlate,
    easyTeal: bank.tinTeal, easyCrimson: bank.tastyRed, easyRoof: bank.whiteWall,
    sedanSilver: bank.aluminum, sedanWhite: bank.whiteWall, sedanBurgundy: bank.tastyRed,
    truckCab: bank.ferryOrange, truckBed: bank.tinBlue, plate: bank.cream,
  };

  const trafficActors = [];
  const kjaSouth = [[-88, -100], [-88, -24], [-91, -12], [-88, 2], [-88, 108]];
  const kjaNorth = [[-82, 108], [-82, 2], [-79, -12], [-82, -24], [-82, -100]];
  const ghatLoop = [[-74, -14.6], [-20, -14.6], [-18, 20], [-18, 105], [-13.5, 105], [-13.5, -9.2], [-74, -9.2]];

  function spawnTraffic(mesh, path, t0, speed) {
    dynamicGroup.add(mesh);
    trafficActors.push({ mesh, path, t: t0, speed, wheelAngle: 0 });
  }
  spawnTraffic(buildCNGAuto(vBank), kjaSouth, 0.12, 6.2);
  spawnTraffic(buildEasybike(vBank, false), kjaSouth, 0.46, 4.8);
  spawnTraffic(buildSedanCar(vBank, vBank.sedanWhite), kjaSouth, 0.78, 7.2);
  spawnTraffic(buildCNGAuto(vBank), kjaNorth, 0.22, 5.8);
  spawnTraffic(buildEasybike(vBank, true), kjaNorth, 0.58, 4.9);
  spawnTraffic(buildSedanCar(vBank, vBank.sedanSilver), kjaNorth, 0.88, 7.0);
  spawnTraffic(buildBanglaTruck(vBank), ghatLoop, 0.08, 4.6);
  spawnTraffic(buildCNGAuto(vBank), ghatLoop, 0.36, 5.5);
  spawnTraffic(buildEasybike(vBank, false), ghatLoop, 0.68, 4.5);

  // ==========================================================================
  // 9) ANIMATED FLOCK OF RIVER BIRDS CIRCLING OVER RUPSHA RIVER & PARK
  // ==========================================================================
  const birds = [];
  const birdMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
  for (let i = 0; i < 14; i++) {
    const bg = new THREE.Group();
    const lw = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.22), birdMat);
    lw.position.x = -0.32;
    const rw = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.22), birdMat);
    rw.position.x = 0.32;
    bg.add(lw, rw);
    dynamicGroup.add(bg);
    birds.push({
      g: bg,
      lw,
      rw,
      cx: 15 + (i % 3) * 32,
      cz: -10 + (i % 4) * 34,
      r: 18 + (i % 5) * 9,
      y: 19 + (i % 4) * 4.5,
      speed: 0.32 + (i % 4) * 0.06,
      phase: i * 0.9,
    });
  }

  // ==========================================================================
  // 10) OPTIONAL MONSOON RAIN SYSTEM (TOGGLEABLE FOR GTA-STYLE WET VIBES)
  // ==========================================================================
  const rainCount = 1600;
  const rainPos = new Float32Array(rainCount * 3);
  const rRnd = seeded(4044);
  for (let i = 0; i < rainCount; i++) {
    rainPos[i * 3] = (rRnd() - 0.5) * 140;
    rainPos[i * 3 + 1] = rRnd() * 48;
    rainPos[i * 3 + 2] = (rRnd() - 0.5) * 140;
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainMat = new THREE.PointsMaterial({
    color: 0xcbd5e1,
    size: 0.22,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const rainPoints = new THREE.Points(rainGeo, rainMat);
  rainPoints.visible = false;
  rainPoints.frustumCulled = false;
  dynamicGroup.add(rainPoints);

  // Merge heavy static zone geometry for silky 60-120 FPS performance!
  mergeStaticGroup(staticGround);
  mergeStaticGroup(staticBuildings);
  mergeStaticGroup(staticGhat);
  mergeStaticGroup(staticPark);
  mergeStaticGroup(staticBridge);

  function samplePath(pts, t) {
    let total = 0;
    const lens = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      lens.push(l);
      total += l;
    }
    let target = (((t % 1) + 1) % 1) * total;
    for (let i = 0; i < lens.length; i++) {
      if (target <= lens[i] || i === lens.length - 1) {
        const f = lens[i] > 0.001 ? target / lens[i] : 0;
        const a = pts[i];
        const b = pts[i + 1];
        const dx = b[0] - a[0];
        const dz = b[1] - a[1];
        const inv = 1 / Math.max(0.001, lens[i]);
        return { x: a[0] + dx * f, z: a[1] + dz * f, dirX: dx * inv, dirZ: dz * inv, total };
      }
      target -= lens[i];
    }
    return { x: pts[0][0], z: pts[0][1], dirX: 0, dirZ: 1, total };
  }

  function setNightFactor(nf) {
    const f = Math.max(0, Math.min(1, nf || 0));
    for (const e of bank.emissives) {
      e.mat.emissiveIntensity = e.day + (e.night - e.day) * f;
    }
    khanJahanAliBridge.setNightFactor(f);
  }

  function setWetness(w) {
    if (bank.road.userData.wetUniforms) bank.road.userData.wetUniforms.uWetness.value = w;
    if (bank.roadPlain.userData.wetUniforms) bank.roadPlain.userData.wetUniforms.uWetness.value = w;
  }

  function setRainEnabled(on) {
    rainPoints.visible = Boolean(on);
    setWetness(on ? 0.96 : 0.48);
  }

  function update(elapsed, dt, cameraPos) {
    // 0) Animate Khan Jahan Ali Bridge ships underneath, deck traffic & toll plaza barriers
    khanJahanAliBridge.update(elapsed);

    // 1) Gently bob moored Launch & Ferry
    for (const v of bobbingVessels) {
      v.obj.position.y = v.baseY + Math.sin(elapsed * v.speed + v.phase) * v.amp;
      v.obj.rotation.z = Math.cos(elapsed * v.speed * 0.78 + v.phase) * 0.02;
    }

    // 2) Move Rupsha Trawlers & Country Boats across the river
    for (const b of movingBoats) {
      const cycle = (elapsed * b.speed + b.phase) % 2.0;
      const forward = cycle < 1.0;
      const u = forward ? cycle : 2.0 - cycle;
      const x = b.startX + (b.endX - b.startX) * u;
      b.obj.position.set(x, -0.24 + Math.sin(elapsed * 1.8 + b.phase * 6) * 0.08, b.z + Math.sin(elapsed * 0.6 + b.phase) * 1.2);
      const dir = (b.endX >= b.startX ? 1 : -1) * (forward ? 1 : -1);
      b.obj.rotation.y = dir > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
      b.obj.rotation.z = Math.cos(elapsed * 1.7 + b.phase) * 0.035;
    }

    // 3) Animate Central Park Fountain Water Jets
    for (const j of fountainJets) {
      const u = (elapsed * 0.9 + j.phase) % 1.0;
      const r = u * j.radius;
      const y = 2.95 + (j.peakY - 2.95) * (4 * u * (1 - u)) - u * u * 2.15;
      j.mesh.position.set(j.cx + Math.cos(j.angle) * r, Math.max(0.85, y), j.cz + Math.sin(j.angle) * r);
    }

    // 4) Live Khulna Road Traffic
    for (const a of trafficActors) {
      const s = samplePath(a.path, a.t);
      a.t = (a.t + (a.speed * dt) / Math.max(10, s.total)) % 1.0;
      const p = samplePath(a.path, a.t);
      a.mesh.position.set(p.x, 0.04, p.z);
      a.mesh.rotation.y = Math.atan2(p.dirX, p.dirZ);
      const wheels = a.mesh.userData.wheels;
      if (wheels) {
        a.wheelAngle += (a.speed * dt) / (a.mesh.userData.wheelRadius || 0.25);
        for (const w of wheels) w.rotation.x = a.wheelAngle;
      }
    }

    // 5) Circling River Birds
    for (const b of birds) {
      const ang = elapsed * b.speed + b.phase;
      b.g.position.set(b.cx + Math.cos(ang) * b.r, b.y + Math.sin(elapsed * 1.1 + b.phase) * 1.2, b.cz + Math.sin(ang) * b.r);
      b.g.rotation.y = -ang;
      const flap = Math.sin(elapsed * 7.5 + b.phase * 3) * 0.42;
      b.lw.rotation.z = flap;
      b.rw.rotation.z = -flap;
    }

    // 6) Rain Streaks following camera
    if (rainPoints.visible && cameraPos) {
      rainPoints.position.set(cameraPos.x, 0, cameraPos.z);
      const posAttr = rainGeo.attributes.position;
      for (let i = 0; i < rainCount; i++) {
        let ry = posAttr.getY(i) - dt * 36.0;
        if (ry < 0) ry = 48.0;
        posAttr.setY(i, ry);
      }
      posAttr.needsUpdate = true;
    }
  }

  return {
    root,
    update,
    setNightFactor,
    setWetness,
    setRainEnabled,
    landmarks: [
      { id: 'traffic', label: 'ট্রাফিক মোড়', x: -85, z: -12, color: '#facc15' },
      { id: 'fish', label: 'মৎস্য বাজার', x: 2, z: -62, color: '#38bdf8' },
      { id: 'ghat', label: 'রূপসা ঘাট', x: 24, z: -10, color: '#fb923c' },
      { id: 'park', label: 'রূপসা পার্ক', x: -6, z: 68, color: '#4ade80' },
      { id: 'cafe', label: 'সানসেট ডেক', x: 24, z: 68, color: '#f472b6' },
      { id: 'bridge', label: 'রূপসা সেতু', x: 110, z: 195, color: '#c084fc' },
    ],
  };
}
