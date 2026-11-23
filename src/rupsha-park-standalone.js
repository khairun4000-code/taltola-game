import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  attachDerivedPBRMaps,
  applyFoliageWindShader,
} from './aaa-shaders.js';

function seeded(seed = 202507) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ============================================================================
// CUSTOM GLSL SHADERS (AAA RUPSHA RIVER + CALM PARK LAKE + SWAYING KASHFUL)
// ============================================================================

function createParkWaterShader(sharedUniforms, { isRiver = true } = {}) {
  const uniforms = {
    uTime: sharedUniforms.uTime,
    uSunDir: sharedUniforms.uSunDir,
    uSunColor: sharedUniforms.uSunColor,
    uSkyTop: sharedUniforms.uSkyTop,
    uSkyHorizon: sharedUniforms.uSkyHorizon,
    uFogColor: sharedUniforms.uFogColor,
    uNightFactor: sharedUniforms.uNightFactor,
    uIsRiver: { value: isRiver ? 1.0 : 0.0 },
    uFogNear: { value: 210.0 },
    uFogFar: { value: 620.0 },
  };

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uIsRiver;
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        float amp = mix(0.012, 0.052, uIsRiver);
        wp.y += sin(wp.x * 0.16 + wp.z * 0.12 + uTime * 1.45) * amp
              + cos(wp.z * 0.28 - wp.x * 0.10 - uTime * 1.9) * (amp * 0.6);
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
      uniform float uIsRiver;
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

      float waveHeight(vec2 p, float t, float river) {
        float spd = mix(0.65, 1.35, river);
        float h = 0.0;
        h += sin(p.x * 0.30 + p.y * 0.18 + t * 1.4 * spd) * 0.22;
        h += sin(p.x * -0.22 + p.y * 0.42 - t * 1.15 * spd) * 0.17;
        h += sin(p.x * 0.82 + p.y * 0.64 + t * 2.2 * spd) * 0.09;
        h += noise2(p * 0.52 + vec2(t * 0.30 * spd, -t * 0.22 * spd)) * 0.34;
        h += noise2(p * 2.1 + vec2(-t * 0.65 * spd, t * 0.42 * spd)) * 0.16;
        return h;
      }

      void main() {
        vec2 p = vWorldPos.xz;
        float e = 0.14;
        float h0 = waveHeight(p, uTime, uIsRiver);
        float hx = waveHeight(p + vec2(e, 0.0), uTime, uIsRiver);
        float hz = waveHeight(p + vec2(0.0, e), uTime, uIsRiver);
        float nScale = mix(0.85, 1.55, uIsRiver);
        vec3 N = normalize(vec3((h0 - hx) * nScale, 1.0, (h0 - hz) * nScale));

        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 L = normalize(uSunDir);

        float NoV = clamp(dot(N, V), 0.001, 1.0);
        float fresnel = 0.03 + 0.97 * pow(1.0 - NoV, 4.4);

        vec3 R = reflect(-V, N);
        float rUp = clamp(R.y, 0.0, 1.0);
        vec3 reflSky = mix(uSkyHorizon, uSkyTop, pow(rUp, 0.52));
        float reflSun = max(dot(R, L), 0.0);
        reflSky += uSunColor * pow(reflSun, 48.0) * 0.95;

        vec3 H = normalize(L + V);
        float NoH = max(dot(N, H), 0.0);
        vec3 specular = uSunColor * (pow(NoH, 240.0) * 3.2 + pow(NoH, 30.0) * 0.25);

        // Lake = deep tranquil Sundarbans emerald; Rupsha River = Bengal silt-teal to deep blue-green
        vec3 lakeBody = vec3(0.025, 0.115, 0.092);
        float shoreBand = 1.0 - smoothstep(82.0, 118.0, vWorldPos.z);
        vec3 riverShallow = vec3(0.105, 0.215, 0.180);
        vec3 riverDeep = vec3(0.028, 0.102, 0.132);
        vec3 riverBody = mix(riverDeep, riverShallow, clamp(shoreBand * 0.72 + h0 * 0.15, 0.0, 1.0));
        vec3 waterBody = mix(lakeBody, riverBody, uIsRiver);

        // Shoreline ripple foam along river embankment (z ~ 82..92)
        float shoreWave = sin(vWorldPos.z * 1.7 - uTime * 2.3 + noise2(p * 0.35) * 3.2) * 0.5 + 0.5;
        float shoreFoam = uIsRiver * (1.0 - smoothstep(80.0, 89.5, vWorldPos.z)) * shoreWave * 0.52;
        float crestFoam = uIsRiver * smoothstep(0.76, 0.94, h0) * 0.22;
        vec3 foamColor = mix(uSkyHorizon, vec3(0.92, 0.96, 0.95), 0.5);

        // Night reflections of park promenade lamps & Rupsha Rail Bridge lights
        float bankGlow = uIsRiver * exp(-pow((vWorldPos.z - 88.0) * 0.045, 2.0));
        float bridgeGlow = uIsRiver * exp(-pow((vWorldPos.z - 225.0) * 0.028, 2.0));
        float shimmer = 0.65 + 0.35 * sin(vWorldPos.x * 1.4 + h0 * 7.5 + uTime * 2.4);
        vec3 nightRefl = vec3(1.0, 0.74, 0.34) * (bankGlow * 0.42 + bridgeGlow * 0.55) * shimmer * uNightFactor;

        float fresnelMix = clamp(fresnel * mix(0.68, 0.80, uIsRiver), 0.05, 0.76);
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

/**
 * Custom GPU Wind-Sway Shader for Kashful (কাশফুল) plumes so 900+ silky white stalks
 * wave organically across the meadow in waves like real Khulna autumn river breeze!
 */
function applyKashfulWindShader(mat, sharedUniforms) {
  const uTime = sharedUniforms?.uTime || { value: 0 };
  mat.customProgramCacheKey = () => 'khulna-kashful-wind-v1';
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nuniform float uTime;`)
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec4 kw = modelMatrix * vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          kw = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
        #endif
        float h = clamp(position.y / 1.9, 0.0, 1.2);
        float wave = sin(uTime * 1.9 + kw.x * 0.22 + kw.z * 0.18);
        float gust = cos(uTime * 0.75 + kw.x * 0.06 - kw.z * 0.05) * 0.5 + 0.5;
        transformed.x += (wave * 0.34 + 0.12) * h * h * (0.6 + 0.7 * gust);
        transformed.z += cos(uTime * 1.55 + kw.z * 0.24) * 0.18 * h * h;`
      );
  };
  return mat;
}

// ============================================================================
// ULTRA-DETAILED 1024x1024 PROCEDURAL PBR TEXTURES
// ============================================================================

function makeInterlockingWalkwayTexture() {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(20251);

  // Dark sandy-moss mortar joints
  ctx.fillStyle = '#3b332b';
  ctx.fillRect(0, 0, S, S);

  const rows = 16;
  const cols = 8;
  const bh = S / rows;
  const bw = S / cols;

  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (bw * 0.5);
    for (let col = -1; col <= cols; col++) {
      const x = col * bw + off;
      const y = r * bh;
      // Authentic Khulna park interlocking brick pavers (warm terracotta red + weathered sandstone accents)
      const isSand = ((r + col) % 5 === 0);
      if (isSand) {
        const v = 148 + Math.floor(rnd() * 28);
        ctx.fillStyle = `rgb(${v + 8},${v + 2},${v - 10})`;
      } else {
        const rr = 148 + Math.floor(rnd() * 34);
        const gg = 62 + Math.floor(rnd() * 24);
        const bb = 44 + Math.floor(rnd() * 18);
        ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
      }
      ctx.fillRect(x + 3, y + 3, bw - 6, bh - 6);
      // Bevel highlight
      ctx.strokeStyle = 'rgba(255,235,215,0.16)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 5, y + 5, bw - 10, bh - 10);
      // Subtle tropical moss & fine grit
      if (rnd() > 0.65) {
        ctx.fillStyle = 'rgba(44,72,36,0.24)';
        ctx.fillRect(x + 3, y + 3, bw - 6, 8);
      }
      for (let d = 0; d < 24; d++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,245,230,0.08)' : 'rgba(22,16,12,0.12)';
        ctx.fillRect(x + 6 + rnd() * (bw - 12), y + 6 + rnd() * (bh - 12), 2.5, 2.5);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 16;
  return tex;
}

function makeNaturalParkGrassTexture() {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(20252);

  // Rich Bengal alluvial grass & earth undertones
  ctx.fillStyle = '#2d5726';
  ctx.fillRect(0, 0, S, S);

  // Organic soil & sunlit grass patches
  for (let i = 0; i < 65; i++) {
    const px = rnd() * S;
    const py = rnd() * S;
    const rad = 32 + rnd() * 95;
    const g = ctx.createRadialGradient(px, py, 4, px, py, rad);
    if (rnd() > 0.35) {
      g.addColorStop(0, 'rgba(66, 118, 44, 0.32)');
      g.addColorStop(1, 'rgba(66, 118, 44, 0)');
    } else {
      g.addColorStop(0, 'rgba(92, 76, 48, 0.28)');
      g.addColorStop(1, 'rgba(92, 76, 48, 0)');
    }
    ctx.fillStyle = g;
    ctx.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  }

  // Dense fine grass blades & clover micro-speckles
  for (let i = 0; i < 24000; i++) {
    const r = 28 + Math.floor(rnd() * 44);
    const g = 72 + Math.floor(rnd() * 76);
    const b = 20 + Math.floor(rnd() * 24);
    ctx.fillStyle = `rgba(${r},${g},${b},${0.32 + rnd() * 0.45})`;
    ctx.fillRect(rnd() * S, rnd() * S, 1.5 + rnd() * 2.5, 4 + rnd() * 9);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 16;
  return tex;
}

function makeCCBlockEmbankmentTexture() {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(20253);

  ctx.fillStyle = '#4e4d46';
  ctx.fillRect(0, 0, S, S);

  // Authentic Bangladesh BWDB concrete CC-blocks (40cm x 40cm grid) with moss & river silt patina!
  const step = 64;
  for (let y = 0; y < S; y += step) {
    for (let x = 0; x < S; x += step) {
      const shade = 102 + Math.floor(rnd() * 38);
      ctx.fillStyle = `rgb(${shade + 4},${shade + 2},${shade - 5})`;
      ctx.fillRect(x + 3, y + 3, step - 6, step - 6);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 5, y + 5, step - 10, step - 10);
      // River algae / moss along damp lower joints
      if (rnd() > 0.55) {
        ctx.fillStyle = `rgba(48, 68, 38, ${0.15 + rnd() * 0.22})`;
        ctx.fillRect(x + 2, y + step - 12, step - 4, 10);
      }
      for (let g = 0; g < 22; g++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(220,215,205,0.10)' : 'rgba(28,26,22,0.14)';
        ctx.fillRect(x + 6 + rnd() * (step - 12), y + 6 + rnd() * (step - 12), 3, 3);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 16;
  return tex;
}

function makeStuccoTexture(hex, seedVal = 301, { brick = false } = {}) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(seedVal);
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, S, S);

  for (let i = 0; i < 4500; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.06)' : `rgba(34,28,22,${0.03 + rnd() * 0.06})`;
    ctx.fillRect(rnd() * S, rnd() * S, 2 + rnd() * 6, 2 + rnd() * 6);
  }
  if (brick) {
    ctx.strokeStyle = 'rgba(28,18,12,0.28)';
    ctx.lineWidth = 2;
    for (let y = 0; y < S; y += 24) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y); ctx.stroke();
      const off = ((y / 24) % 2) * 24;
      for (let x = off; x < S; x += 48) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 24); ctx.stroke();
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeRoofTileTexture() {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(20254);
  ctx.fillStyle = '#8b3a2b';
  ctx.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 32) {
    for (let x = 0; x < S; x += 32) {
      const r = 148 + Math.floor(rnd() * 32);
      const g = 56 + Math.floor(rnd() * 18);
      const b = 38 + Math.floor(rnd() * 14);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.arc(x + 16, y + 16, 15, 0, Math.PI);
      ctx.fill();
      ctx.fillRect(x + 1, y, 30, 16);
      ctx.strokeStyle = 'rgba(30,12,8,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeWoodTexture() {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(20255);
  ctx.fillStyle = '#704426';
  ctx.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 32) {
    const d = Math.floor((rnd() - 0.5) * 26);
    ctx.fillStyle = `rgb(${112 + d},${68 + Math.floor(d * 0.7)},${38 + Math.floor(d * 0.5)})`;
    ctx.fillRect(0, y + 2, S, 28);
    for (let k = 0; k < 8; k++) {
      ctx.fillStyle = 'rgba(38,20,10,0.18)';
      ctx.fillRect(0, y + 4 + rnd() * 22, S, 1.5);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeSignTexture({ title, subtitle = '', bg = '#064e3b', fg = '#ffffff', accent = '#fde047', border = '#facc15' }) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 256);

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(255,255,255,0.14)');
  grad.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 256);

  ctx.strokeStyle = border;
  ctx.lineWidth = 10;
  ctx.strokeRect(12, 12, 1000, 232);

  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 64px "Noto Sans Bengali", "Segoe UI", sans-serif';
  ctx.fillText(title, 512, subtitle ? 96 : 128, 920);
  if (subtitle) {
    ctx.fillStyle = accent;
    ctx.font = '700 32px "Manrope", "Noto Sans Bengali", sans-serif';
    ctx.fillText(subtitle, 512, 178, 920);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// ============================================================================
// MATERIAL BANK & HELPERS
// ============================================================================

function createMaterials(sharedUniforms) {
  const walkTex = makeInterlockingWalkwayTexture();
  const grassTex = makeNaturalParkGrassTexture();
  const ccTex = makeCCBlockEmbankmentTexture();
  const roofTex = makeRoofTileTexture();
  const woodTex = makeWoodTexture();

  const mkPBR = (tex, rough, strength = 2.6, normalScale = 0.85, metal = 0.02) => {
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: rough, metalness: metal, envMapIntensity: 0.65 });
    attachDerivedPBRMaps(mat, tex, { size: 512, strength, roughBase: rough, normalScale });
    return mat;
  };
  const mkStucco = (hex, seedVal, rough = 0.80, brick = false) => {
    const tex = makeStuccoTexture(hex, seedVal, { brick });
    return mkPBR(tex, rough, brick ? 2.8 : 1.9, 0.72, 0.02);
  };

  // Foliage with wind sway
  const jhauNeedleDark = new THREE.MeshStandardMaterial({ color: 0x1d4d2c, roughness: 0.78, envMapIntensity: 0.45 });
  const jhauNeedleMid = new THREE.MeshStandardMaterial({ color: 0x2b6938, roughness: 0.74, envMapIntensity: 0.48 });
  const canopyGreen = new THREE.MeshStandardMaterial({ color: 0x2f702d, roughness: 0.76, envMapIntensity: 0.45 });
  const golpataLeaf = new THREE.MeshStandardMaterial({ color: 0x26632a, roughness: 0.68, side: THREE.DoubleSide, envMapIntensity: 0.55 });
  applyFoliageWindShader(jhauNeedleDark, sharedUniforms);
  applyFoliageWindShader(jhauNeedleMid, sharedUniforms);
  applyFoliageWindShader(canopyGreen, sharedUniforms);
  applyFoliageWindShader(golpataLeaf, sharedUniforms);

  const kashStem = new THREE.MeshStandardMaterial({ color: 0x628c45, roughness: 0.82 });
  const kashPlume = new THREE.MeshStandardMaterial({
    color: 0xf8f6f0,
    emissive: 0xfff8e7,
    emissiveIntensity: 0.14,
    roughness: 0.92,
  });
  applyKashfulWindShader(kashStem, sharedUniforms);
  applyKashfulWindShader(kashPlume, sharedUniforms);

  const bank = {
    walkway: mkPBR(walkTex, 0.78, 2.8, 0.88),
    grass: mkPBR(grassTex, 0.92, 1.8, 0.52, 0.0),
    ccBlock: mkPBR(ccTex, 0.88, 3.0, 0.95),
    roofTile: mkPBR(roofTex, 0.72, 2.8, 0.86, 0.05),
    wood: mkPBR(woodTex, 0.70, 2.2, 0.72, 0.04),
    cream: mkStucco('#ece3d2', 401, 0.76),
    whiteWall: mkStucco('#f1f5f9', 402, 0.72),
    terracotta: mkStucco('#b55c40', 403, 0.82),
    brickWall: mkStucco('#964332', 404, 0.86, true),
    concrete: mkStucco('#a0a59f', 405, 0.86),
    parkGreen: mkStucco('#146b3a', 406, 0.60),
    bark: mkStucco('#4c3828', 407, 0.94),
    sandBank: mkStucco('#9e8969', 408, 0.95),
    darkMetal: new THREE.MeshStandardMaterial({ color: 0x1e252c, roughness: 0.40, metalness: 0.80 }),
    steelTruss: new THREE.MeshStandardMaterial({ color: 0x3b4c5e, roughness: 0.42, metalness: 0.72, envMapIntensity: 1.1 }),
    aluminum: new THREE.MeshStandardMaterial({ color: 0xd4dde4, roughness: 0.22, metalness: 0.88, envMapIntensity: 1.3 }),
    goldAccent: new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.28, metalness: 0.84, envMapIntensity: 1.35 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x1e4356, roughness: 0.08, metalness: 0.14, clearcoat: 0.95, envMapIntensity: 1.6 }),
    boatHull: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.45, metalness: 0.12 }),
    boatRed: new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.48, metalness: 0.12 }),
    boatWood: mkStucco('#6b3f23', 409, 0.85),
    jhauNeedleDark,
    jhauNeedleMid,
    canopyGreen,
    golpataLeaf,
    kashStem,
    kashPlume,
    egretWhite: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 }),
    duckBrown: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 }),
    beakOrange: new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 }),
    flowerRed: new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.6 }),
    flowerYellow: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 }),
    flowerPurple: new THREE.MeshStandardMaterial({ color: 0xc084fc, roughness: 0.6 }),
    lampWarm: new THREE.MeshStandardMaterial({ color: 0xfff8e6, emissive: 0xffd27d, emissiveIntensity: 1.3 }),
    fairyBulb: new THREE.MeshStandardMaterial({ color: 0xfffbeb, emissive: 0xffb74d, emissiveIntensity: 1.6 }),
    beaconRed: new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xff2222, emissiveIntensity: 1.8 }),
    emissives: [],
  };

  bank.emissives.push(
    { mat: bank.lampWarm, day: 0.8, night: 4.5 },
    { mat: bank.fairyBulb, day: 1.0, night: 5.0 },
    { mat: bank.beaconRed, day: 1.2, night: 4.6 },
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
    emissiveIntensity: 0.42,
    roughness: 0.24,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });
  bank.emissives.push({ mat, day: 0.40, night: 1.85 });
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);
  g.rotation.y = rotY;
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(w + 0.10, h + 0.10, 0.14), bank.darkMetal);
  const face = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.16), mat);
  g.add(bezel, face);
  parent.add(g);
}

function mergeStaticGroup(root) {
  root.updateWorldMatrix(true, true);
  const invRoot = root.matrixWorld.clone().invert();
  const buckets = new Map();
  root.traverse((obj) => {
    if (!obj.isMesh || obj.isInstancedMesh || Array.isArray(obj.material)) return;
    const key = `${obj.material.uuid}-${obj.castShadow}-${obj.receiveShadow}`;
    if (!buckets.has(key)) {
      buckets.set(key, { material: obj.material, cast: obj.castShadow, receive: obj.receiveShadow, meshes: [], geometries: [] });
    }
    const b = buckets.get(key);
    const g = obj.geometry.index ? obj.geometry.toNonIndexed() : obj.geometry.clone();
    g.applyMatrix4(invRoot.clone().multiply(obj.matrixWorld));
    g.clearGroups();
    for (const attr of Object.keys(g.attributes)) {
      if (attr !== 'position' && attr !== 'normal' && attr !== 'uv') g.deleteAttribute(attr);
    }
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
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
// AUTHENTIC KHULNA RIVERVIEW PARK BOTANICALS & ARCHITECTURE
// ============================================================================

/** Tall feathery Casuarina / Jhau Tree (ঝাউ গাছ) — the #1 signature tree of Khulna Riverview Park! */
function addJhauTree(parent, bank, x, y, z, scale = 1.0, seedVal = 1) {
  const rnd = seeded(seedVal + Math.round(x * 11 + z * 17));
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const h = (9.5 + rnd() * 3.8) * scale;
  addCyl(g, 0.08 * scale, 0.24 * scale, h, [0, h * 0.5, 0], bank.bark, 7);

  // 7 tiered feathery conical foliage whorls (classic coastal Jhau silhouette)
  const tiers = 7;
  for (let t = 0; t < tiers; t++) {
    const f = t / (tiers - 1);
    const ty = h * (0.28 + f * 0.72);
    const r = (2.35 * (1.0 - f * 0.74) + (rnd() - 0.5) * 0.22) * scale;
    const th = (2.25 - f * 0.7) * scale;
    const mat = t % 2 === 0 ? bank.jhauNeedleDark : bank.jhauNeedleMid;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, th, 8), mat);
    cone.position.set((rnd() - 0.5) * 0.18 * scale, ty, (rnd() - 0.5) * 0.18 * scale);
    cone.rotation.y = rnd() * Math.PI;
    cone.castShadow = true;
    cone.receiveShadow = true;
    g.add(cone);
  }
  parent.add(g);
}

/** Sundarbans Golpata (গোলপাতা / Nypa fruticans) mangrove palm cluster along the park canal! */
function addGolpataCluster(parent, bank, x, y, z, scale = 1.0, seedVal = 1) {
  const rnd = seeded(seedVal + Math.round(x * 5 + z * 9));
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const fronds = 8;
  for (let i = 0; i < fronds; i++) {
    const yaw = (i / fronds) * Math.PI * 2 + (rnd() - 0.5) * 0.35;
    const fg = new THREE.Group();
    fg.rotation.y = yaw;
    const len = (2.8 + rnd() * 1.1) * scale;
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.42 * scale, 0.05, len), bank.golpataLeaf);
    leaf.position.set(0, len * 0.42, len * 0.32);
    leaf.rotation.x = -0.82 + rnd() * 0.16;
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.28 * scale, 0.04, len * 0.55), bank.golpataLeaf);
    tip.position.set(0, len * 0.74, len * 0.76);
    tip.rotation.x = -0.30;
    fg.add(leaf, tip);
    g.add(fg);
  }
  parent.add(g);
}

/** Lush Broadleaf Rain-Tree / Mango Tree */
function addShadeTree(parent, bank, x, y, z, scale = 1.0, seedVal = 1) {
  const rnd = seeded(seedVal + Math.round(x * 7 + z * 13));
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const h = (3.4 + rnd() * 1.4) * scale;
  addCyl(g, 0.18 * scale, 0.30 * scale, h, [0, h * 0.5, 0], bank.bark, 7);
  const cy = h + 0.6 * scale;
  for (const [bx, by, bz, r] of [
    [0, cy + 0.9 * scale, 0, 2.4 * scale],
    [-1.4 * scale, cy + 0.2 * scale, 0.9 * scale, 1.8 * scale],
    [1.5 * scale, cy + 0.3 * scale, -0.7 * scale, 1.85 * scale],
    [0.5 * scale, cy + 0.1 * scale, 1.4 * scale, 1.7 * scale],
    [-0.7 * scale, cy + 0.2 * scale, -1.3 * scale, 1.7 * scale],
  ]) {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), bank.canopyGreen);
    m.position.set(bx, by, bz);
    m.scale.set(1.18, 0.72, 1.18);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  parent.add(g);
}

/** Authentic Khulna Riverview Park Tourist Shade Pavilion (টুরিস্ট ছাউনি) with hexagonal tiled roof & built-in seating */
function addTouristPavilion(staticG, dynamicG, bank, x, y, z, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  // Raised circular stone plinth
  addCyl(g, 3.6, 3.9, 0.42, [0, 0.21, 0], bank.concrete, 6);
  // 6 Slim painted columns
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    addCyl(g, 0.11, 0.13, 2.95, [Math.cos(a) * 3.05, 1.85, Math.sin(a) * 3.05], bank.cream, 8);
  }
  // Built-in perimeter wooden benches on 4 sides
  for (let i = 0; i < 4; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    addBox(g, [2.35, 0.12, 0.56], [Math.cos(a) * 2.45, 0.82, Math.sin(a) * 2.45], bank.wood, { rotY: -a + Math.PI / 2 });
    addBox(g, [2.35, 0.45, 0.10], [Math.cos(a) * 2.75, 1.12, Math.sin(a) * 2.75], bank.wood, { rotY: -a + Math.PI / 2 });
  }
  // Hexagonal terracotta tile pitched roof + golden finial
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.35, 1.75, 6), bank.roofTile);
  roof.position.y = 4.15;
  roof.castShadow = true;
  roof.receiveShadow = true;
  g.add(roof);
  addCyl(g, 0.04, 0.12, 0.55, [0, 5.2, 0], bank.goldAccent, 8);
  staticG.add(g);

  // Warm hanging pavilion light
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), bank.lampWarm);
  bulb.position.set(x, y + 3.15, z);
  dynamicG.add(bulb);
}

/** Ornamental Park Double-Globe Lamp Post */
function addParkLamp(staticG, dynamicG, bank, x, y, z) {
  addCyl(staticG, 0.10, 0.16, 0.45, [x, y + 0.22, z], bank.darkMetal, 8);
  addCyl(staticG, 0.055, 0.075, 4.1, [x, y + 2.3, z], bank.darkMetal, 8);
  addBox(staticG, [0.95, 0.06, 0.06], [x, y + 4.35, z], bank.darkMetal);
  for (const sx of [-0.44, 0.44]) {
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), bank.lampWarm);
    globe.position.set(x + sx, y + 4.52, z);
    dynamicG.add(globe);
  }
}

/** Park Bench facing a given yaw */
function addParkBench(staticG, bank, x, y, z, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  addBox(g, [2.2, 0.10, 0.58], [0, 0.52, 0], bank.wood);
  addBox(g, [2.2, 0.48, 0.09], [0, 0.84, -0.26], bank.wood, { rotX: -0.14 });
  for (const sx of [-0.85, 0.85]) {
    addBox(g, [0.10, 0.50, 0.54], [sx, 0.26, 0], bank.darkMetal);
  }
  staticG.add(g);
}

// ============================================================================
// MAIN BUILDER: 2025 KHULNA RIVERVIEW PARK (খুলনা রিভারভিউ পার্ক / রূপসা পার্ক)
// ============================================================================
// Coordinates:
//   Z = -95  -> Main Entrance Gate (South-West entry from Lobonchora / Mathabhanga Rd)
//   Z = -80 .. +52 -> Long Central Lake (x = -12 .. +12) flanked by West & East Paved Walkways!
//   X = -58 .. -24 -> West Kashbon Meadow (শুভ্র কাশবন) & Shade Pavilions
//   X = +22 .. +62 -> East Jhau Forest (ঝাউতলা) + Sundarbans Golpata Mini-Canal (গোলবাগান ও খাল)
//   Z = +62 .. +82 -> Raised CC-Block River Embankment (y = +2.4m) + Concrete Viewing Stairs!
//   Z = +82 .. +340 -> Wide Shimmering Rupsha River (রূপসা নদী) + New Rupsha Railway Bridge (রূপসা রেলসেতু)!

export function buildRupshaPark3D(sharedUniforms) {
  const root = new THREE.Group();
  root.name = 'Khulna_Riverview_Park_2025_3D';

  const bank = createMaterials(sharedUniforms);

  const staticTerrain = new THREE.Group();
  const staticArch = new THREE.Group();
  const staticBridge = new THREE.Group();
  const foliageGroup = new THREE.Group();
  const dynamicGroup = new THREE.Group();

  root.add(staticTerrain, staticArch, staticBridge, foliageGroup, dynamicGroup);

  // ==========================================================================
  // 1) PARK TERRAIN, CENTRAL LAKE, GOLPATA CANAL & RAISED RIVER EMBANKMENT
  // ==========================================================================
  // Main Park Ground Slabs surrounding Central Lake (Lake opening: x = -12..+12, z = -68..+44)
  // West Park Land (x = -95 .. -12, z = -115 .. +66)
  addBox(staticTerrain, [83, 1.4, 182], [-53.5, -0.70, -24], bank.grass, { castShadow: false, uvScale: 8.0 });
  // East Park Land (x = +12 .. +95, z = -115 .. +66)
  addBox(staticTerrain, [83, 1.4, 182], [53.5, -0.70, -24], bank.grass, { castShadow: false, uvScale: 8.0 });
  // South Entrance Forecourt Land (x = -12 .. +12, z = -115 .. -68)
  addBox(staticTerrain, [24, 1.4, 47], [0, -0.70, -91.5], bank.grass, { castShadow: false, uvScale: 6.0 });
  // North Lake-End Connecting Land (x = -12 .. +12, z = +44 .. +66)
  addBox(staticTerrain, [24, 1.4, 22], [0, -0.70, 55], bank.grass, { castShadow: false, uvScale: 6.0 });

  // Central Lake Basin Floor & Concrete Retaining Banks (x = -12..+12, z = -68..+44)
  addBox(staticTerrain, [26, 0.3, 114], [0, -1.25, -12], bank.sandBank, { castShadow: false });
  addBox(staticTerrain, [1.4, 1.2, 114], [-12.0, -0.45, -12], bank.ccBlock, { rotZ: -0.25, uvScale: 2.4 });
  addBox(staticTerrain, [1.4, 1.2, 114], [12.0, -0.45, -12], bank.ccBlock, { rotZ: 0.25, uvScale: 2.4 });
  addBox(staticTerrain, [25.0, 1.2, 1.4], [0, -0.45, -68.0], bank.ccBlock, { rotX: 0.25, uvScale: 2.4 });
  addBox(staticTerrain, [25.0, 1.2, 1.4], [0, -0.45, 44.0], bank.ccBlock, { rotX: -0.25, uvScale: 2.4 });

  // Animated Calm Emerald Park Lake Surface
  const lakeGeo = new THREE.PlaneGeometry(24.5, 112.5, 36, 80);
  lakeGeo.rotateX(-Math.PI / 2);
  const lakeMat = createParkWaterShader(sharedUniforms, { isRiver: false });
  const lakeMesh = new THREE.Mesh(lakeGeo, lakeMat);
  lakeMesh.position.set(0, -0.32, -12);
  dynamicGroup.add(lakeMesh);

  // Sundarbans-Style Golpata Mini-Canal on East Side (x = +38 .. +52, z = -30 .. +42)
  addBox(staticTerrain, [14.5, 0.25, 72], [45, -0.05, 6], bank.sandBank, { castShadow: false });
  const canalGeo = new THREE.PlaneGeometry(13.5, 70, 18, 42);
  canalGeo.rotateX(-Math.PI / 2);
  const canalMesh = new THREE.Mesh(canalGeo, lakeMat);
  canalMesh.position.set(45, 0.04, 6);
  dynamicGroup.add(canalMesh);

  // RAISED RUPSHA RIVER EMBANKMENT (নদীর পাড়ের উঁচু সিসি-ব্লক বাঁধ · z = +66 .. +82, height y = +2.4m!)
  addBox(staticTerrain, [190, 2.4, 12.0], [0, 1.2, 72], bank.grass, { castShadow: false, uvScale: 7.0 });
  // Sloped CC-block river defense revetment descending into the Rupsha River (z = +78 .. +88)
  addBox(staticTerrain, [190, 3.6, 11.5], [0, 0.45, 81.5], bank.ccBlock, { rotX: 0.34, uvScale: 3.4 });
  // Sloped grass inner embankment descending back to the park (z = +60 .. +66)
  addBox(staticTerrain, [190, 2.4, 7.2], [0, 0.85, 63.5], bank.grass, { rotX: -0.34, castShadow: false, uvScale: 6.0 });

  // Wide Flowing Rupsha River Surface (z = +82 .. +380)
  const riverGeo = new THREE.PlaneGeometry(520, 320, 110, 90);
  riverGeo.rotateX(-Math.PI / 2);
  const riverMat = createParkWaterShader(sharedUniforms, { isRiver: true });
  const riverMesh = new THREE.Mesh(riverGeo, riverMat);
  riverMesh.position.set(0, -0.45, 240);
  dynamicGroup.add(riverMesh);

  // Distant Opposite Bank of Rupsha River (z = +360)
  addBox(staticTerrain, [560, 3.5, 60], [0, 0.4, 385], bank.grass, { castShadow: false, uvScale: 14.0 });

  // ==========================================================================
  // 2) INTERLOCKING BRICK WALKWAYS, EMBANKMENT STAIRS & LAKESIDE GHAT
  // ==========================================================================
  // Main Entrance Plaza & Avenue leading from Gate (z = -95) to Lake South Edge (z = -68)
  addBox(staticTerrain, [12.0, 0.14, 30], [0, 0.05, -83], bank.walkway, { castShadow: false, uvScale: 2.6 });
  addBox(staticTerrain, [42.0, 0.14, 6.2], [0, 0.06, -71], bank.walkway, { castShadow: false, uvScale: 2.6 });

  // West Lakeside Promenade (পশ্চিম পাড়ের প্রশস্ত রাস্তা · x = -16.5, z = -72 .. +60)
  addBox(staticTerrain, [5.8, 0.14, 132], [-16.5, 0.06, -6], bank.walkway, { castShadow: false, uvScale: 2.4 });
  // East Lakeside Promenade (পূর্ব পাড়ের ঝাউতলা রাস্তা · x = +16.5, z = -72 .. +60)
  addBox(staticTerrain, [5.8, 0.14, 132], [16.5, 0.06, -6], bank.walkway, { castShadow: false, uvScale: 2.4 });
  // North Lake Cross Promenade (z = +54, connecting West & East walkways + Kashbon)
  addBox(staticTerrain, [98, 0.14, 5.4], [0, 0.06, 54], bank.walkway, { castShadow: false, uvScale: 2.4 });
  // West Kashbon Loop Path (through the white Kashful field!)
  addBox(staticTerrain, [3.6, 0.12, 92], [-46, 0.05, 8], bank.walkway, { castShadow: false, uvScale: 2.4 });
  addBox(staticTerrain, [30, 0.12, 3.6], [-31, 0.05, -36], bank.walkway, { castShadow: false, uvScale: 2.4 });
  // East Golpata Viewing Path
  addBox(staticTerrain, [3.4, 0.12, 72], [32, 0.05, 6], bank.walkway, { castShadow: false, uvScale: 2.4 });
  addBox(staticTerrain, [16, 0.12, 3.4], [24, 0.05, 6], bank.walkway, { castShadow: false, uvScale: 2.4 });

  // Top of Raised River Embankment Promenade (y = +2.46m, z = +72.5)
  addBox(staticTerrain, [168, 0.16, 6.6], [0, 2.42, 72.5], bank.walkway, { castShadow: false, uvScale: 2.6 });

  // Concrete Viewing Stairs climbing up to the River Embankment (at x = -16.5 and x = +16.5, z = +59..+69)
  for (const sx of [-16.5, 16.5]) {
    for (let st = 0; st < 11; st++) {
      addBox(staticArch, [5.2, 0.24, 1.05], [sx, 0.12 + st * 0.225, 59.5 + st * 0.92], bank.concrete, { uvScale: 2.2 });
    }
    // Stainless steel stair handrails
    for (const side of [-2.45, 2.45]) {
      addBox(staticArch, [0.08, 0.08, 10.6], [sx + side, 2.25, 64.2], bank.aluminum, { rotX: -0.24 });
    }
  }

  // Stepped Lakeside Sitting Ghat on East Bank (লেকের পূর্ব পাড়ের পাকা ঘাট · x = +12.5, z = +4)
  for (let s = 0; s < 5; s++) {
    addBox(staticArch, [1.2, 0.24, 12.0], [13.5 - s * 0.85, 0.22 - s * 0.18, 4], bank.concrete, { uvScale: 2.0 });
  }

  // Scenic Riverfront Railing along the Raised Embankment Edge (z = +75.8, y = +2.48)
  for (let rx = -76; rx <= 76; rx += 4) {
    addCyl(staticArch, 0.05, 0.06, 1.15, [rx, 3.05, 75.8], bank.darkMetal, 6);
    if (rx < 76) {
      addBox(staticArch, [4.0, 0.07, 0.07], [rx + 2, 3.58, 75.8], bank.aluminum);
      addBox(staticArch, [4.0, 0.05, 0.05], [rx + 2, 3.05, 75.8], bank.darkMetal);
    }
  }

  // ==========================================================================
  // 3) 2025 RENOVATED MAIN ENTRANCE GATE & TICKET COUNTER (খুলনা রিভারভিউ পার্ক)
  // ==========================================================================
  {
    const gz = -96;
    // Boundary wall flanking the main entrance
    addBox(staticArch, [84, 2.1, 0.36], [-52, 1.05, gz], bank.brickWall, { uvScale: 2.4 });
    addBox(staticArch, [84, 2.1, 0.36], [52, 1.05, gz], bank.brickWall, { uvScale: 2.4 });
    addBox(staticArch, [84, 0.16, 0.48], [-52, 2.15, gz], bank.cream);
    addBox(staticArch, [84, 0.16, 0.48], [52, 2.15, gz], bank.cream);

    // Grand Modern Twin-Pillar Entrance Gate Arch
    for (const sx of [-6.8, 6.8]) {
      addBox(staticArch, [1.9, 6.4, 1.9], [sx, 3.2, gz], bank.cream, { uvScale: 2.4 });
      addBox(staticArch, [2.15, 0.42, 2.15], [sx, 6.48, gz], bank.parkGreen);
      addBox(staticArch, [1.4, 0.6, 1.4], [sx, 6.95, gz], bank.terracotta);
      const gLamp = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), bank.lampWarm);
      gLamp.position.set(sx, 7.55, gz);
      dynamicGroup.add(gLamp);
    }
    // Sweeping Modern Archway Overhead Fascia
    addBox(staticArch, [16.2, 1.75, 1.25], [0, 6.35, gz], bank.parkGreen);
    addBox(staticArch, [16.8, 0.28, 1.42], [0, 7.30, gz], bank.goldAccent);
    addSign(dynamicGroup, bank, {
      title: 'খুলনা রিভারভিউ পার্ক · রূপসা',
      subtitle: 'KHULNA RIVERVIEW ECO PARK · EST. 2025 RENOVATION',
      bg: '#064e3b',
      accent: '#fde047',
    }, [0, 6.35, gz - 0.68], Math.PI, 13.8, 1.55);
    addSign(dynamicGroup, bank, {
      title: 'খুলনা রিভারভিউ পার্ক · রূপসা',
      subtitle: 'KHULNA RIVERVIEW ECO PARK',
      bg: '#064e3b',
      accent: '#fde047',
    }, [0, 6.35, gz + 0.68], 0, 13.8, 1.55);

    // Ticket Counter Booth (টিকিট কাউন্টার · ৩০ টাকা)
    addBox(staticArch, [3.6, 2.9, 3.0], [10.6, 1.45, gz + 3.2], bank.cream);
    addBox(staticArch, [4.2, 0.26, 3.6], [10.6, 3.02, gz + 3.2], bank.roofTile);
    addBox(staticArch, [2.4, 1.1, 0.14], [10.6, 1.85, gz + 1.65], bank.glass);
    addSign(dynamicGroup, bank, {
      title: 'টিকিট কাউন্টার · প্রবেশ মূল্য ৩০৳',
      subtitle: 'TICKET COUNTER · OPEN 9 AM — 6 PM',
      bg: '#14532d',
      accent: '#fef08a',
    }, [10.6, 3.45, gz + 1.55], Math.PI, 3.8, 0.72);
  }

  // ==========================================================================
  // 4) TOURIST SHADE PAVILIONS (ছাউনি), JHALMURI STALL, RESTROOM & BENCHES
  // ==========================================================================
  // Lakeside & Riverfront Tourist Pavilions (matching the real 2025 park!)
  addTouristPavilion(staticArch, dynamicGroup, bank, -24.5, 0.02, -40, 0.2);
  addTouristPavilion(staticArch, dynamicGroup, bank, -24.5, 0.02, 16, -0.2);
  addTouristPavilion(staticArch, dynamicGroup, bank, 24.5, 0.02, -26, 0.4);
  addTouristPavilion(staticArch, dynamicGroup, bank, -28.0, 2.45, 71.0, 0);
  addTouristPavilion(staticArch, dynamicGroup, bank, 28.0, 2.45, 71.0, 0);

  // Clean Public Restroom Block tucked near North-West path (-56, 44)
  addBox(staticArch, [8.5, 3.1, 4.6], [-56, 1.55, 44], bank.whiteWall, { uvScale: 2.2 });
  addBox(staticArch, [9.1, 0.24, 5.2], [-56, 3.2, 44], bank.parkGreen);
  addSign(dynamicGroup, bank, { title: 'পাবলিক টয়লেট ও ওয়াশজোন', subtitle: 'PUBLIC RESTROOM', bg: '#0c4a6e', accent: '#fde047' }, [-56, 2.6, 46.4], 0, 4.2, 0.65);

  // Local Jhalmuri & Cold Drink Cart right on the River Embankment Promenade (x = 4, y = 2.48, z = 70.5)
  {
    const jx = 4;
    const jy = 2.50;
    const jz = 70.5;
    addBox(staticArch, [1.8, 0.9, 1.1], [jx, jy + 0.75, jz], bank.wood);
    addCyl(staticArch, 0.34, 0.34, 0.12, [jx - 0.7, jy + 0.34, jz + 0.58], bank.darkMetal, 10, [Math.PI / 2, 0, 0]);
    addCyl(staticArch, 0.34, 0.34, 0.12, [jx + 0.7, jy + 0.34, jz + 0.58], bank.darkMetal, 10, [Math.PI / 2, 0, 0]);
    addCyl(staticArch, 0.04, 0.04, 2.4, [jx, jy + 1.4, jz], bank.aluminum, 6);
    const umb = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.55, 10), bank.terracotta);
    umb.position.set(jx, jy + 2.65, jz);
    staticArch.add(umb);
    addSign(dynamicGroup, bank, { title: 'খুলনার স্পেশাল ঝালমুড়ি ও শরবত', bg: '#9a3412', accent: '#fef08a' }, [jx, jy + 1.45, jz - 0.58], Math.PI, 1.9, 0.42);
  }

  // Lakeside & River Embankment Benches + Ornamental Lamps
  for (let z = -58; z <= 38; z += 18) {
    addParkBench(staticArch, bank, -13.6, 0.10, z, Math.PI / 2);
    addParkBench(staticArch, bank, 13.6, 0.10, z + 6, -Math.PI / 2);
    addParkLamp(staticArch, dynamicGroup, bank, -19.8, 0.08, z);
    addParkLamp(staticArch, dynamicGroup, bank, 19.8, 0.08, z + 8);
  }
  for (let rx = -64; rx <= 64; rx += 16) {
    if (Math.abs(rx) > 6) {
      addParkBench(staticArch, bank, rx, 2.48, 74.2, 0);
    }
    addParkLamp(staticArch, dynamicGroup, bank, rx, 2.48, 69.5);
  }

  // ==========================================================================
  // 5) 3 PARK LAKE PADDLE BOATS + ANIMATED DUCKS & WHITE EGRETS (বক ও হাঁস)
  // ==========================================================================
  const bobbingBoats = [];
  for (const [bx, bz, yaw, mat] of [
    [-4.2, -32, 0.3, bank.boatHull],
    [4.6, -24, -0.45, bank.boatRed],
    [-2.5, -16, 0.12, bank.boatWood],
  ]) {
    const bg = new THREE.Group();
    bg.position.set(bx, -0.26, bz);
    bg.rotation.y = yaw;
    addBox(bg, [1.55, 0.52, 3.6], [0, 0.24, 0], mat);
    addBox(bg, [1.3, 0.10, 0.5], [0, 0.42, -0.7], bank.wood);
    addBox(bg, [1.3, 0.10, 0.5], [0, 0.42, 0.7], bank.wood);
    dynamicGroup.add(bg);
    bobbingBoats.push({ obj: bg, baseY: -0.26, phase: bx * 0.4 });
  }

  // Animated Ducks swimming on the Central Lake + White Egrets (বক) perched near the lake edge!
  const swimmingDucks = [];
  for (let i = 0; i < 6; i++) {
    const dg = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), i % 2 === 0 ? bank.egretWhite : bank.duckBrown);
    body.scale.set(1.0, 0.72, 1.45);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), i % 2 === 0 ? bank.egretWhite : bank.duckBrown);
    head.position.set(0, 0.22, 0.25);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 6), bank.beakOrange);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.20, 0.38);
    dg.add(body, head, beak);
    dynamicGroup.add(dg);
    swimmingDucks.push({
      obj: dg,
      cx: (i % 2 === 0 ? -3 : 3),
      cz: -45 + i * 16,
      rx: 3.5 + (i % 3),
      rz: 5.5 + (i % 2) * 2,
      speed: 0.28 + (i % 3) * 0.06,
      phase: i * 1.1,
    });
  }

  // Graceful White Egrets (সাদা বক) standing by the lake bank
  for (const [ex, ez, eyaw] of [[11.0, -10, -1.2], [-10.8, 22, 1.4], [39.2, 12, 0.6]]) {
    const eg = new THREE.Group();
    eg.position.set(ex, 0.02, ez);
    eg.rotation.y = eyaw;
    addCyl(eg, 0.02, 0.02, 0.55, [-0.06, 0.28, 0], bank.darkMetal, 5);
    addCyl(eg, 0.02, 0.02, 0.55, [0.06, 0.28, 0], bank.darkMetal, 5);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.20, 8, 6), bank.egretWhite);
    b.scale.set(0.85, 0.9, 1.35);
    b.position.set(0, 0.62, 0);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.42, 6), bank.egretWhite);
    neck.position.set(0, 0.92, 0.16);
    neck.rotation.x = 0.25;
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), bank.egretWhite);
    hd.position.set(0, 1.14, 0.22);
    const bk = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.20, 6), bank.beakOrange);
    bk.rotation.x = Math.PI / 2;
    bk.position.set(0, 1.13, 0.36);
    eg.add(b, neck, hd, bk);
    staticArch.add(eg);
  }

  // ==========================================================================
  // 6) SIGNATURE BOTANICALS: JHAU AVENUE, GOLPATA GROVE & 900+ KASHFUL PLUMES!
  // ==========================================================================
  // Iconic Jhau-Tree Avenues (ঝাউতলার সারি) lining East Bank, Entrance, and River Embankment!
  for (let z = -88; z <= 48; z += 9.5) {
    addJhauTree(foliageGroup, bank, 21.8 + (Math.abs(z) % 2) * 1.4, 0, z, 1.05, 500 + z);
    if (z < -68 || z > -55) {
      addJhauTree(foliageGroup, bank, -22.2 - (Math.abs(z) % 3) * 1.2, 0, z + 3, 0.98, 600 + z);
    }
  }
  // Dense Jhau-Tree grove on East park section & along the raised River Embankment!
  for (let rx = -74; rx <= 74; rx += 11) {
    if (Math.abs(rx) > 20) {
      addJhauTree(foliageGroup, bank, rx, 2.35, 67.5, 1.08, 700 + rx);
    }
  }
  for (const [tx, tz, sc] of [
    [28, -56, 1.15], [36, -46, 1.2], [58, -32, 1.15], [62, 0, 1.25], [60, 32, 1.18],
    [-34, -56, 1.15], [-66, -24, 1.25], [-68, 18, 1.2], [-64, 48, 1.15],
  ]) {
    addShadeTree(foliageGroup, bank, tx, 0, tz, sc, 900 + tx + tz);
  }

  // Sundarbans-Style Golpata Grove (গোলবাগান) lining BOTH sides of the East Mini-Canal!
  for (let gz = -26; gz <= 38; gz += 5.5) {
    addGolpataCluster(foliageGroup, bank, 37.5, 0.0, gz, 1.05, 1200 + gz);
    addGolpataCluster(foliageGroup, bank, 52.5, 0.0, gz + 2.5, 1.12, 1300 + gz);
  }

  // MASSIVE GPU-INSTANCED WHITE KASHBON MEADOW (শুভ্র কাশবন · 900 swaying Kashful stalks!)
  {
    const kCount = 900;
    const stemGeo = new THREE.CylinderGeometry(0.014, 0.022, 1.45, 4);
    stemGeo.translate(0, 0.72, 0);
    const plumeGeo = new THREE.ConeGeometry(0.11, 0.62, 6);
    plumeGeo.translate(0, 1.65, 0);

    const stemInst = new THREE.InstancedMesh(stemGeo, bank.kashStem, kCount);
    const plumeInst = new THREE.InstancedMesh(plumeGeo, bank.kashPlume, kCount);
    stemInst.castShadow = false;
    plumeInst.castShadow = false;
    stemInst.frustumCulled = false;
    plumeInst.frustumCulled = false;

    const kRnd = seeded(202599);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < kCount; i++) {
      // Cluster heavily in the West Kashbon Meadow (x = -62..-24, z = -30..+46) + lakeside fringes!
      let kx;
      let kz;
      if (i < 720) {
        kx = -62 + kRnd() * 38;
        kz = -32 + kRnd() * 78;
        if (Math.abs(kx + 46) < 2.6) kx -= 3.2; // keep walking path clear!
      } else {
        kx = -13.2 - kRnd() * 1.4;
        kz = -62 + kRnd() * 102;
      }
      dummy.position.set(kx, 0.02, kz);
      dummy.rotation.set((kRnd() - 0.5) * 0.16, kRnd() * Math.PI * 2, (kRnd() - 0.5) * 0.16);
      const sc = 0.75 + kRnd() * 0.65;
      dummy.scale.set(sc, sc * (0.85 + kRnd() * 0.35), sc);
      dummy.updateMatrix();
      stemInst.setMatrixAt(i, dummy.matrix);
      plumeInst.setMatrixAt(i, dummy.matrix);
    }
    stemInst.instanceMatrix.needsUpdate = true;
    plumeInst.instanceMatrix.needsUpdate = true;
    foliageGroup.add(stemInst, plumeInst);
  }

  // ==========================================================================
  // 7) NEW RUPSHA RAILWAY BRIDGE (রূপসা রেলসেতু) & RIVER BOATS ON HORIZON!
  // ==========================================================================
  // Iconic Khulna–Mongla Steel-Truss Rupsha Railway Bridge visible across the Rupsha River (z = +235)!
  {
    const bz = 235;
    // Concrete piers in the Rupsha River
    for (let px = -180; px <= 180; px += 45) {
      addBox(staticBridge, [4.2, 16.5, 7.5], [px, 7.2, bz], bank.concrete, { uvScale: 4.0 });
      const navB = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), bank.beaconRed);
      navB.position.set(px, 3.2, bz - 4.2);
      dynamicGroup.add(navB);
    }
    // Continuous railway bridge deck girder
    addBox(staticBridge, [420, 1.8, 8.2], [0, 15.6, bz], bank.steelTruss);
    // Signature through-truss steel arch spans across main navigation channel (x = -135 .. +135)
    for (let sx = -135; sx < 135; sx += 45) {
      const cx = sx + 22.5;
      // Top steel chord + vertical/diagonal Warren truss struts on both sides
      for (const sz of [bz - 3.8, bz + 3.8]) {
        addBox(staticBridge, [43.5, 0.75, 0.55], [cx, 23.2, sz], bank.steelTruss);
        for (let k = 0; k <= 6; k++) {
          const vx = sx + k * 7.5;
          addBox(staticBridge, [0.55, 7.6, 0.55], [vx, 19.4, sz], bank.steelTruss);
          if (k < 6) {
            addBox(staticBridge, [0.45, 9.8, 0.45], [vx + 3.75, 19.4, sz], bank.steelTruss, { rotZ: (k % 2 === 0 ? 0.65 : -0.65) });
          }
        }
      }
      // Overhead cross-bracing
      for (let k = 1; k <= 5; k++) {
        addBox(staticBridge, [0.45, 0.45, 7.8], [sx + k * 7.5, 23.2, bz], bank.steelTruss);
      }
      const topLamp = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), bank.lampWarm);
      topLamp.position.set(cx, 24.1, bz - 3.8);
      dynamicGroup.add(topLamp);
    }
  }

  // Animated Rupsha River Boats & Cargo Vessels gliding past the Park!
  const riverBoats = [];
  for (const [z, startX, endX, speed, isCargo] of [
    [125, -160, 160, 0.015, false],
    [155, 165, -165, 0.012, true],
    [188, -150, 170, 0.018, false],
  ]) {
    const bg = new THREE.Group();
    const len = isCargo ? 18 : 9;
    const w = isCargo ? 4.4 : 2.1;
    addBox(bg, [len, isCargo ? 1.6 : 0.85, w], [0, 0.45, 0], isCargo ? bank.darkMetal : bank.boatWood);
    if (isCargo) {
      addBox(bg, [4.2, 2.2, 3.2], [-5.2, 2.0, 0], bank.whiteWall);
      addBox(bg, [10.0, 1.0, 3.6], [2.2, 1.4, 0], bank.sandBank);
    } else {
      const can = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 3.8, 8, 1, false, 0, Math.PI), bank.terracotta);
      can.rotation.z = Math.PI / 2;
      can.position.set(0, 0.85, 0);
      bg.add(can);
    }
    const bl = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), bank.fairyBulb);
    bl.position.set(len * 0.45, isCargo ? 2.6 : 1.5, 0);
    bg.add(bl);
    dynamicGroup.add(bg);
    riverBoats.push({ obj: bg, z, startX, endX, speed, phase: Math.abs(z) * 0.01 });
  }

  // Circling River Birds over the Park & Kashbon
  const birds = [];
  const birdMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
  for (let i = 0; i < 10; i++) {
    const bg = new THREE.Group();
    const lw = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.20), birdMat);
    lw.position.x = -0.30;
    const rw = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.20), birdMat);
    rw.position.x = 0.30;
    bg.add(lw, rw);
    dynamicGroup.add(bg);
    birds.push({ g: bg, lw, rw, cx: -10 + (i % 3) * 18, cz: 10 + (i % 4) * 24, r: 22 + (i % 4) * 8, y: 18 + (i % 3) * 4, speed: 0.30 + (i % 3) * 0.05, phase: i * 0.9 });
  }

  // Merge heavy static geometry for silky 60+ FPS!
  mergeStaticGroup(staticTerrain);
  mergeStaticGroup(staticArch);
  mergeStaticGroup(staticBridge);

  function setNightFactor(nf) {
    const f = Math.max(0, Math.min(1, nf || 0));
    for (const e of bank.emissives) {
      e.mat.emissiveIntensity = e.day + (e.night - e.day) * f;
    }
  }

  function update(elapsed) {
    for (const b of bobbingBoats) {
      b.obj.position.y = b.baseY + Math.sin(elapsed * 1.4 + b.phase) * 0.045;
      b.obj.rotation.z = Math.cos(elapsed * 1.1 + b.phase) * 0.025;
    }
    for (const d of swimmingDucks) {
      const a = elapsed * d.speed + d.phase;
      const nx = d.cx + Math.cos(a) * d.rx;
      const nz = d.cz + Math.sin(a) * d.rz;
      d.obj.position.set(nx, -0.26, nz);
      d.obj.rotation.y = Math.atan2(-Math.sin(a) * d.rx, Math.cos(a) * d.rz);
    }
    for (const rb of riverBoats) {
      const cycle = (elapsed * rb.speed + rb.phase) % 2.0;
      const fwd = cycle < 1.0;
      const u = fwd ? cycle : 2.0 - cycle;
      const x = rb.startX + (rb.endX - rb.startX) * u;
      rb.obj.position.set(x, -0.35 + Math.sin(elapsed * 1.6 + rb.phase * 8) * 0.08, rb.z);
      rb.obj.rotation.y = ((rb.endX >= rb.startX ? 1 : -1) * (fwd ? 1 : -1)) > 0 ? 0 : Math.PI;
    }
    for (const b of birds) {
      const a = elapsed * b.speed + b.phase;
      b.g.position.set(b.cx + Math.cos(a) * b.r, b.y + Math.sin(elapsed + b.phase) * 1.1, b.cz + Math.sin(a) * b.r);
      b.g.rotation.y = -a;
      const flap = Math.sin(elapsed * 7.2 + b.phase * 3) * 0.42;
      b.lw.rotation.z = flap;
      b.rw.rotation.z = -flap;
    }
  }

  return {
    root,
    update,
    setNightFactor,
  };
}
