import * as THREE from 'three';

function clampByte(v) {
  return v < 0 ? 0 : (v > 255 ? 255 : v | 0);
}

/**
 * Generates tangent-space Sobel normalMap + micro-variation roughnessMap
 * from any synchronous Canvas or already-loaded HTMLImageElement.
 */
export function generateNormalAndRoughnessMaps(imageSource, options = {}) {
  const {
    strength = 2.4,
    roughBase = 0.74,
    roughSpread = 0.22,
    invertRough = false,
    repeatX = 1,
    repeatY = 1,
    size = 256,
  } = options;

  const workCanvas = document.createElement('canvas');
  workCanvas.width = size;
  workCanvas.height = size;
  const ctx = workCanvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(imageSource, 0, 0, size, size);
  const src = ctx.getImageData(0, 0, size, size).data;

  const lum = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    const o = i * 4;
    lum[i] = (0.299 * src[o] + 0.587 * src[o + 1] + 0.114 * src[o + 2]) / 255.0;
  }

  const normCanvas = document.createElement('canvas');
  normCanvas.width = size;
  normCanvas.height = size;
  const normCtx = normCanvas.getContext('2d');
  const normImg = normCtx.createImageData(size, size);

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const roughCtx = roughCanvas.getContext('2d');
  const roughImg = roughCtx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    const ym1 = (y - 1 + size) & (size - 1);
    const yp1 = (y + 1) & (size - 1);
    for (let x = 0; x < size; x++) {
      const xm1 = (x - 1 + size) & (size - 1);
      const xp1 = (x + 1) & (size - 1);

      const tl = lum[ym1 * size + xm1];
      const t = lum[ym1 * size + x];
      const tr = lum[ym1 * size + xp1];
      const l = lum[y * size + xm1];
      const c = lum[y * size + x];
      const r = lum[y * size + xp1];
      const bl = lum[yp1 * size + xm1];
      const b = lum[yp1 * size + x];
      const br = lum[yp1 * size + xp1];

      const dx = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
      const dy = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr);

      let nx = -dx * strength;
      let ny = -dy * strength;
      let nz = 1.0;
      const invLen = 1.0 / Math.hypot(nx, ny, nz);
      nx *= invLen;
      ny *= invLen;
      nz *= invLen;

      const idx = (y * size + x) * 4;
      normImg.data[idx] = clampByte((nx * 0.5 + 0.5) * 255);
      normImg.data[idx + 1] = clampByte((ny * 0.5 + 0.5) * 255);
      normImg.data[idx + 2] = clampByte((nz * 0.5 + 0.5) * 255);
      normImg.data[idx + 3] = 255;

      const heightVal = invertRough ? (1.0 - c) : c;
      const rVal = Math.min(0.98, Math.max(0.08, roughBase + (0.5 - heightVal) * roughSpread));
      const rByte = clampByte(rVal * 255);
      roughImg.data[idx] = rByte;
      roughImg.data[idx + 1] = rByte;
      roughImg.data[idx + 2] = rByte;
      roughImg.data[idx + 3] = 255;
    }
  }

  normCtx.putImageData(normImg, 0, 0);
  roughCtx.putImageData(roughImg, 0, 0);

  const normalMap = new THREE.CanvasTexture(normCanvas);
  normalMap.colorSpace = THREE.NoColorSpace;
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(repeatX, repeatY);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(repeatX, repeatY);

  return { normalMap, roughnessMap };
}

/**
 * Attaches Sobel normal + roughness maps derived from a diffuse Texture
 * (either synchronous CanvasTexture or async loaded HTMLImageElement).
 */
export function attachDerivedPBRMaps(material, diffuseTex, options = {}) {
  if (!material || !diffuseTex) return;
  const applyFromImage = (img) => {
    if (!img) return;
    const { normalMap, roughnessMap } = generateNormalAndRoughnessMaps(img, {
      ...options,
      repeatX: diffuseTex.repeat?.x || 1,
      repeatY: diffuseTex.repeat?.y || 1,
    });
    material.userData.pbrNormalMap = normalMap;
    material.userData.pbrRoughnessMap = roughnessMap;
    material.normalMap = normalMap;
    material.normalScale = new THREE.Vector2(options.normalScale ?? 0.85, options.normalScale ?? 0.85);
    material.roughnessMap = roughnessMap;
    material.needsUpdate = true;
  };

  if (diffuseTex.image && (diffuseTex.image instanceof HTMLCanvasElement || (diffuseTex.image.complete && diffuseTex.image.naturalWidth > 0))) {
    applyFromImage(diffuseTex.image);
  } else if (diffuseTex.image && typeof diffuseTex.image.addEventListener === 'function') {
    diffuseTex.image.addEventListener('load', () => applyFromImage(diffuseTex.image), { once: true });
  }
}

/**
 * Patches any MeshStandardMaterial for damp / rain-puddle asphalt micro-reflections.
 * Safe under Three.js r180 with customProgramCacheKey.
 */
export function upgradeWetAsphaltMaterial(material, sharedUniforms, wetness = 0.72) {
  if (!material) return material;
  const localUniforms = {
    uWetness: { value: wetness },
    uTime: sharedUniforms?.uTime || { value: 0 },
  };
  material.userData.wetUniforms = localUniforms;
  material.customProgramCacheKey = () => 'taltola-wet-asphalt-v1';

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWetness = localUniforms.uWetness;
    shader.uniforms.uTime = localUniforms.uTime;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vAsphaltWorldPos;`
      )
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
        vAsphaltWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vAsphaltWorldPos;
        uniform float uWetness;
        uniform float uTime;

        float hash21A(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }
        float vnoiseA(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash21A(i), hash21A(i + vec2(1.0, 0.0)), u.x),
            mix(hash21A(i + vec2(0.0, 1.0)), hash21A(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        vec2 wpA = vAsphaltWorldPos.xz;
        float n1 = vnoiseA(wpA * 0.14);
        float n2 = vnoiseA(wpA * 0.42 + 4.7);
        float micro = vnoiseA(wpA * 7.5);
        float puddleField = n1 * 0.65 + n2 * 0.35;
        // Edge gutters & drainage depressions pool water naturally
        float roadEdgeBias = smoothstep(1.2, 2.75, abs(mod(wpA.x + 12.0, 24.0) - 12.0));
        float puddleVal = puddleField + roadEdgeBias * 0.11;
        float puddleMask = smoothstep(0.58 - uWetness * 0.16, 0.72 - uWetness * 0.10, puddleVal);
        float dampRim = smoothstep(0.45 - uWetness * 0.14, 0.62 - uWetness * 0.10, puddleVal);
        // Wheel-path rubber polish
        float wheelPolish = smoothstep(0.6, 0.1, abs(abs(wpA.x) - 1.35));
        roughnessFactor = mix(roughnessFactor, 0.44, wheelPolish * 0.38);
        roughnessFactor = mix(roughnessFactor, 0.28 + micro * 0.14, dampRim * 0.65 * uWetness);
        roughnessFactor = mix(roughnessFactor, 0.055, puddleMask * uWetness);
        diffuseColor.rgb *= mix(1.0, 0.62, dampRim * 0.75 * uWetness);
        diffuseColor.rgb *= mix(1.0, 0.76, puddleMask * 0.45 * uWetness);
        // Subtle fine gravel micro-sparkle when dry/damp
        diffuseColor.rgb *= (0.94 + micro * 0.12);`
      );
  };
  material.needsUpdate = true;
  return material;
}

/**
 * Patches foliage MeshStandardMaterial with gentle organic tropical wind sway
 * and subtle subsurface backlit glow.
 */
export function applyFoliageWindShader(material, sharedUniforms) {
  if (!material) return material;
  const uTime = sharedUniforms?.uTime || { value: 0 };
  material.userData.windUniforms = { uTime };
  material.customProgramCacheKey = () => 'taltola-foliage-wind-v2';

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec4 fWorld = modelMatrix * vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          fWorld = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
        #endif
        float heightW = clamp((fWorld.y - 1.2) * 0.20, 0.0, 1.45);
        float gustEnv = 0.55 + 0.45 * sin(uTime * 0.42 + fWorld.x * 0.045 - fWorld.z * 0.038);
        float breeze = sin(uTime * 1.65 + fWorld.x * 0.34 + fWorld.z * 0.27);
        float gust = cos(uTime * 2.75 + fWorld.z * 0.61 - fWorld.x * 0.22) * 0.55;
        float flutter = sin(uTime * 5.2 + fWorld.x * 1.9 + fWorld.y * 2.1 + fWorld.z * 1.7) * 0.16;
        transformed.x += (breeze + gust + flutter) * 0.095 * heightW * gustEnv;
        transformed.y += (flutter * 0.55 + breeze * 0.18) * 0.045 * heightW * gustEnv;
        transformed.z += (gust - breeze * 0.55 + flutter * 0.7) * 0.070 * heightW * gustEnv;`
      );
  };
  material.needsUpdate = true;
  return material;
}

/**
 * Patches overhead utility wire materials (LineBasicMaterial & MeshStandardMaterial)
 * so cables sway gently & realistically in the Khulna breeze while staying 100% pinned
 * to electric pole attachment points (zero CPU overhead, zero extra draw calls!).
 */
export function applyWireWindShader(material, sharedUniforms, options = {}) {
  if (!material) return material;
  const usePinAttr = Boolean(options.usePinAttr);
  const uTime = sharedUniforms?.uTime || { value: 0 };
  material.userData.wireWindUniforms = { uTime };
  material.customProgramCacheKey = () => (usePinAttr ? 'taltola-wire-wind-pin-v3' : 'taltola-wire-wind-mesh-v3');

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    const pinDecl = usePinAttr ? 'attribute float aWirePin;\n' : '';
    const pinExpr = usePinAttr
      ? 'clamp(aWirePin, 0.0, 1.0)'
      : 'smoothstep(2.2, 4.8, wWorld.y) * (0.25 + 0.75 * pow(abs(sin(wWorld.z * 0.14 + wWorld.x * 0.12)), 1.4))';

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;
        ${pinDecl}`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec4 wWorld = modelMatrix * vec4(transformed, 1.0);
        // Natural intermittent tropical breeze envelope (soft gusts + calm lulls)
        float gustWave = 0.5 + 0.5 * sin(uTime * 0.34 + wWorld.x * 0.024 + wWorld.z * 0.020);
        float gustStrength = 0.35 + 0.65 * gustWave * gustWave;
        // Pole-to-pole catenary weight: 0.0 pinned at pole insulators, 1.0 at mid-span sag
        float spanPin = ${pinExpr};
        float swayA = sin(uTime * 1.45 + wWorld.z * 0.19 + wWorld.x * 0.15);
        float swayB = cos(uTime * 2.25 + wWorld.x * 0.24 - wWorld.z * 0.16) * 0.32;
        // Clearly visible yet realistic gentle breeze sway (~10cm lateral, ~6cm vertical rise/fall at mid-span)
        transformed.x += (swayA + swayB) * 0.105 * spanPin * gustStrength;
        transformed.y += sin(uTime * 1.65 + wWorld.z * 0.22 + wWorld.x * 0.14) * 0.062 * spanPin * gustStrength;
        transformed.z += (swayB - swayA * 0.45) * 0.085 * spanPin * gustStrength;`
      );
  };
  material.needsUpdate = true;
  return material;
}

/**
 * Custom GLSL animated Bhairab / Rupsha River surface shader.
 * Produces real wave normals, depth-turbidity Bengal river tint,
 * Fresnel atmospheric sky reflection, golden solar sparkle ribbon,
 * and gentle bank shimmer foam — compatible with scene.fog & ACES tone mapping.
 */
export function createRupshaRiverShader(sharedUniforms) {
  const uniforms = {
    uTime: sharedUniforms.uTime,
    uSunDir: sharedUniforms.uSunDir,
    uSunColor: sharedUniforms.uSunColor,
    uSkyTop: sharedUniforms.uSkyTop,
    uSkyHorizon: sharedUniforms.uSkyHorizon,
    uFogColor: sharedUniforms.uFogColor,
    uFogNear: { value: 190.0 },
    uFogFar: { value: 640.0 },
    uOpacity: { value: 0.96 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        // Subtle 2-cm swell motion near waves
        wp.y += sin(wp.x * 0.16 + wp.z * 0.12 + uTime * 1.4) * 0.025
              + cos(wp.z * 0.29 - uTime * 1.9) * 0.015;
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

      // Multi-wave heightfield for crisp analytical normal gradients
      float waveHeight(vec2 p, float t) {
        float h = 0.0;
        h += sin(p.x * 0.34 + p.y * 0.16 + t * 1.55) * 0.22;
        h += sin(p.x * -0.22 + p.y * 0.44 - t * 1.22) * 0.18;
        h += sin(p.x * 0.85 + p.y * 0.62 + t * 2.40) * 0.09;
        h += noise2(p * 0.55 + vec2(t * 0.38, -t * 0.26)) * 0.32;
        h += noise2(p * 1.95 + vec2(-t * 0.72, t * 0.48)) * 0.14;
        return h;
      }

      void main() {
        vec2 p = vWorldPos.xz;
        float e = 0.14;
        float h0 = waveHeight(p, uTime);
        float hx = waveHeight(p + vec2(e, 0.0), uTime);
        float hz = waveHeight(p + vec2(0.0, e), uTime);
        vec3 N = normalize(vec3((h0 - hx) * 1.35, 1.0, (h0 - hz) * 1.35));

        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 L = normalize(uSunDir);

        // Fresnel (water IOR 1.333 => F0 ~ 0.025)
        float NoV = clamp(dot(N, V), 0.001, 1.0);
        float fresnel = 0.03 + 0.97 * pow(1.0 - NoV, 4.6);

        // Reflection sky gradient
        vec3 R = reflect(-V, N);
        float rUp = clamp(R.y, 0.0, 1.0);
        vec3 reflSky = mix(uSkyHorizon, uSkyTop, pow(rUp, 0.55));
        // Reflected sun disc streak
        float reflSun = max(dot(R, L), 0.0);
        reflSky += uSunColor * pow(reflSun, 48.0) * 0.85;

        // Sharp GGX-like sun sparkle glints across wavelets
        vec3 H = normalize(L + V);
        float NoH = max(dot(N, H), 0.0);
        float specTight = pow(NoH, 240.0) * 2.9;
        float specBroad = pow(NoH, 32.0) * 0.24;
        vec3 specular = uSunColor * (specTight + specBroad);

        // Bengal monsoon river & calm city pond palette: deep pond emerald vs silt-tinted river
        float onRiver = smoothstep(1060.0, 1140.0, vWorldPos.x);
        float bankFactor = onRiver * (1.0 - smoothstep(1158.0, 1265.0, vWorldPos.x));
        vec3 pondColor = vec3(0.026, 0.095, 0.088);
        vec3 shallowColor = vec3(0.095, 0.21, 0.18);
        vec3 deepColor = vec3(0.032, 0.105, 0.135);
        vec3 riverBody = mix(deepColor, shallowColor, clamp(bankFactor * 0.68 + (h0 * 0.18), 0.0, 1.0));
        vec3 waterBody = mix(pondColor, riverBody, onRiver);

        // Gentle wind-foam highlights mostly along wide river currents
        float crestFoam = smoothstep(0.74, 0.92, h0) * (0.04 + bankFactor * 0.22);
        vec3 foamColor = mix(uSkyHorizon, vec3(0.90, 0.94, 0.93), 0.45);

        float fresnelMix = clamp(fresnel * (0.58 + onRiver * 0.20), 0.04, 0.68);
        vec3 color = mix(waterBody, reflSky, fresnelMix) + specular * (0.55 + onRiver * 0.45);
        color = mix(color, foamColor, clamp(crestFoam * 0.36, 0.0, 0.38));

        // Match world fog smoothly across distance
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

  mat.userData.uniforms = uniforms;
  return mat;
}

export const TIME_OF_DAY_PRESETS = {
  golden: {
    id: 'golden',
    label: 'GOLDEN HOUR',
    shortLabel: 'GOLDEN',
    sunPos: [92, 54, -76],
    sunColor: 0xffd199,
    sunIntensity: 2.55,
    hemiSky: 0x9ec8f2,
    hemiGround: 0x5c4f3d,
    hemiIntensity: 1.02,
    ambientIntensity: 0.26,
    skyTop: 0x255a96,
    skyHorizon: 0xf4c898,
    skySunGlow: 0xffb368,
    fogColor: 0xdccbb6,
    exposure: 1.04,
    bloomStrength: 0.24,
    bloomThreshold: 0.86,
    isNight: false,
    nightFactor: 0.0,
    starAlpha: 0.0,
    cloudTint: [1.0, 0.93, 0.83],
  },
  daylight: {
    id: 'daylight',
    label: 'MIDDAY SUN',
    shortLabel: 'DAYLIGHT',
    sunPos: [68, 112, -52],
    sunColor: 0xfff5e4,
    sunIntensity: 2.38,
    hemiSky: 0xb6daf7,
    hemiGround: 0x5d6554,
    hemiIntensity: 1.08,
    ambientIntensity: 0.30,
    skyTop: 0x2c6eb8,
    skyHorizon: 0xd2e4ef,
    skySunGlow: 0xffe4b8,
    fogColor: 0xcfe0ea,
    exposure: 1.02,
    bloomStrength: 0.16,
    bloomThreshold: 0.90,
    isNight: false,
    nightFactor: 0.0,
    starAlpha: 0.0,
    cloudTint: [1.0, 0.99, 0.97],
  },
  sunset: {
    id: 'sunset',
    label: 'SUNSET DUSK',
    shortLabel: 'SUNSET',
    sunPos: [118, 22, -60],
    sunColor: 0xff8c5a,
    sunIntensity: 2.15,
    hemiSky: 0x7b6ea8,
    hemiGround: 0x3b2c32,
    hemiIntensity: 0.86,
    ambientIntensity: 0.24,
    skyTop: 0x1d2552,
    skyHorizon: 0xec7c5e,
    skySunGlow: 0xff6e38,
    fogColor: 0x9c7274,
    exposure: 1.06,
    bloomStrength: 0.34,
    bloomThreshold: 0.78,
    isNight: true,
    nightFactor: 0.65,
    starAlpha: 0.22,
    cloudTint: [0.95, 0.62, 0.56],
  },
  night: {
    id: 'night',
    label: 'KHULNA NIGHT',
    shortLabel: 'NIGHT',
    sunPos: [-52, 74, 48],
    sunColor: 0x8fb4e8,
    sunIntensity: 0.95,
    hemiSky: 0x243b66,
    hemiGround: 0x1a1e24,
    hemiIntensity: 0.72,
    ambientIntensity: 0.24,
    skyTop: 0x070d1d,
    skyHorizon: 0x1d3154,
    skySunGlow: 0x5c7eb0,
    fogColor: 0x121d30,
    exposure: 1.12,
    bloomStrength: 0.42,
    bloomThreshold: 0.70,
    isNight: true,
    nightFactor: 1.0,
    starAlpha: 0.85,
    cloudTint: [0.24, 0.32, 0.48],
  },
};

/**
 * Creates the shared atmospheric shader sky dome with volumetric cloud tendrils,
 * solar Mie scattering halo, and fast baked PMREM scene.environment IBL.
 */
export function createAtmosphericSkyAndPMREM(scene, renderer) {
  const sharedUniforms = {
    uTime: { value: 0 },
    uSunDir: { value: new THREE.Vector3(92, 54, -76).normalize() },
    uSunColor: { value: new THREE.Color(TIME_OF_DAY_PRESETS.golden.sunColor) },
    uSkyTop: { value: new THREE.Color(TIME_OF_DAY_PRESETS.golden.skyTop) },
    uSkyHorizon: { value: new THREE.Color(TIME_OF_DAY_PRESETS.golden.skyHorizon) },
    uSunGlow: { value: new THREE.Color(TIME_OF_DAY_PRESETS.golden.skySunGlow) },
    uFogColor: { value: new THREE.Color(TIME_OF_DAY_PRESETS.golden.fogColor) },
    uCloudTint: { value: new THREE.Vector3(1.0, 0.93, 0.83) },
    uStarAlpha: { value: 0.0 },
    uNightFactor: { value: 0.0 },
  };

  const skyGeo = new THREE.SphereGeometry(220, 40, 24);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: sharedUniforms,
    side: THREE.BackSide,
    depthTest: false,
    depthWrite: false,
    fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_Position.z = gl_Position.w * 0.99998;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform vec3 uSkyTop;
      uniform vec3 uSkyHorizon;
      uniform vec3 uSunGlow;
      uniform vec3 uFogColor;
      uniform vec3 uCloudTint;
      uniform float uStarAlpha;
      varying vec3 vDir;

      float hash2s(vec2 p) {
        p = fract(p * vec2(234.34, 435.345));
        p += dot(p, p + 34.23);
        return fract(p.x * p.y);
      }

      float noise2s(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash2s(i), hash2s(i + vec2(1.0, 0.0)), u.x),
          mix(hash2s(i + vec2(0.0, 1.0)), hash2s(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbmClouds(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise2s(p);
          p = p * 2.06 + vec2(7.3, 13.1);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 d = normalize(vDir);
        float h = clamp(d.y, -0.05, 1.0);
        vec3 col = mix(uSkyHorizon, uSkyTop, pow(max(h, 0.0), 0.52));

        // Mie sun halo & golden atmospheric scatter
        float sunCos = max(dot(d, normalize(uSunDir)), 0.0);
        col += uSunGlow * pow(sunCos, 6.0) * 0.34;
        col += uSunColor * pow(sunCos, 52.0) * 0.52;
        col += uSunColor * smoothstep(0.9985, 0.99965, sunCos) * 2.4;

        // Soft drifting coastal Khulna cumulus clouds
        if (d.y > 0.02) {
          vec2 cloudUv = d.xz / (d.y + 0.18) * 1.45 + vec2(uTime * 0.0085, uTime * 0.003);
          float cDense = fbmClouds(cloudUv);
          float cloudMask = smoothstep(0.49, 0.78, cDense) * smoothstep(0.02, 0.16, d.y);
          vec3 cloudLit = mix(uSkyTop * 0.85, uCloudTint * (0.95 + pow(sunCos, 3.0) * 0.45), 0.82);
          col = mix(col, cloudLit, cloudMask * 0.68);
        }

        // Crisp round pinpoint starfield at sunset/night
        if (uStarAlpha > 0.01 && d.y > 0.05) {
          vec2 sp = d.xz / (d.y + 0.28) * 145.0;
          vec2 starCell = floor(sp);
          vec2 starLocal = fract(sp) - 0.5;
          float starRnd = hash2s(starCell);
          if (starRnd > 0.986) {
            vec2 off = vec2(hash2s(starCell + 13.7), hash2s(starCell + 41.3)) - 0.5;
            float dist = length(starLocal - off * 0.52);
            float pin = smoothstep(0.11, 0.02, dist);
            float tw = 0.65 + 0.35 * sin(uTime * 2.4 + starRnd * 50.0);
            float sizeBoost = 0.75 + 0.55 * hash2s(starCell + 7.1);
            col += vec3(0.88, 0.94, 1.0) * pin * tw * sizeBoost * uStarAlpha * smoothstep(0.05, 0.25, d.y);
          }
        }

        // Blend horizon cleanly into scene fog so far skyline fades seamlessly
        float horBlend = 1.0 - smoothstep(-0.04, 0.11, d.y);
        col = mix(col, uFogColor, horBlend * 0.92);

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });

  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  skyDome.name = 'AtmosphericSkyDome';
  skyDome.frustumCulled = false;
  skyDome.renderOrder = -999;
  scene.add(skyDome);

  // Miniature proxy sky+ground scene baked into an HDR cubemap via PMREMGenerator
  const pmremGen = new THREE.PMREMGenerator(renderer);
  pmremGen.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  const envSkyMat = new THREE.MeshBasicMaterial({ color: TIME_OF_DAY_PRESETS.golden.skyTop, side: THREE.BackSide });
  const envSkySphere = new THREE.Mesh(new THREE.SphereGeometry(20, 16, 12), envSkyMat);
  const envGroundMat = new THREE.MeshBasicMaterial({ color: 0x3b352c });
  const envGround = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), envGroundMat);
  envGround.rotation.x = -Math.PI / 2;
  envGround.position.y = -3.0;
  const envHorizonRing = new THREE.Mesh(
    new THREE.CylinderGeometry(16, 16, 7.5, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: TIME_OF_DAY_PRESETS.golden.skyHorizon, side: THREE.BackSide })
  );
  envHorizonRing.position.y = 0.5;
  const envSunPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshBasicMaterial({ color: 0xffd2a6, side: THREE.DoubleSide })
  );
  envSunPanel.position.set(12, 7, -10);
  envSunPanel.lookAt(0, 0, 0);
  envScene.add(envSkySphere, envGround, envHorizonRing, envSunPanel);

  let currentEnvRT = null;
  let activePresetId = 'golden';

  function rebakePMREM(preset) {
    envSkyMat.color.setHex(preset.skyTop);
    envHorizonRing.material.color.setHex(preset.skyHorizon);
    envGroundMat.color.setHex(preset.hemiGround);
    envSunPanel.material.color.setHex(preset.sunColor).multiplyScalar(preset.isNight ? 0.8 : 2.2);
    const sx = preset.sunPos[0];
    const sy = preset.sunPos[1];
    const sz = preset.sunPos[2];
    const inv = 14.0 / Math.max(1, Math.hypot(sx, sy, sz));
    envSunPanel.position.set(sx * inv, sy * inv, sz * inv);
    envSunPanel.lookAt(0, 0, 0);

    const nextRT = pmremGen.fromScene(envScene, 0.04);
    scene.environment = nextRT.texture;
    if (currentEnvRT) currentEnvRT.dispose();
    currentEnvRT = nextRT;
  }

  rebakePMREM(TIME_OF_DAY_PRESETS.golden);

  function applyPreset(presetId, { sun, hemisphereLight, ambientLight, composerPasses, quality }) {
    const preset = TIME_OF_DAY_PRESETS[presetId] || TIME_OF_DAY_PRESETS.golden;
    activePresetId = preset.id;

    sharedUniforms.uSunDir.value.set(...preset.sunPos).normalize();
    sharedUniforms.uSunColor.value.setHex(preset.sunColor);
    sharedUniforms.uSkyTop.value.setHex(preset.skyTop);
    sharedUniforms.uSkyHorizon.value.setHex(preset.skyHorizon);
    sharedUniforms.uSunGlow.value.setHex(preset.skySunGlow);
    sharedUniforms.uFogColor.value.setHex(preset.fogColor);
    sharedUniforms.uCloudTint.value.set(...preset.cloudTint);
    sharedUniforms.uStarAlpha.value = preset.starAlpha;
    sharedUniforms.uNightFactor.value = preset.nightFactor;

    const lowFillMult = quality === 'low' ? 1.12 : (quality === 'medium' ? 1.08 : 1.0);
    if (sun) {
      sun.color.setHex(preset.sunColor);
      sun.intensity = preset.sunIntensity;
    }
    if (hemisphereLight) {
      hemisphereLight.color.setHex(preset.hemiSky);
      hemisphereLight.groundColor.setHex(preset.hemiGround);
      hemisphereLight.intensity = preset.hemiIntensity * lowFillMult;
    }
    if (ambientLight) {
      ambientLight.intensity = preset.ambientIntensity * (quality === 'low' ? 1.18 : 1.0);
    }
    if (scene.fog) {
      scene.fog.color.setHex(preset.fogColor);
    }
    scene.background = new THREE.Color(preset.fogColor);
    renderer.toneMappingExposure = preset.exposure;

    if (composerPasses?.bloom) {
      composerPasses.bloom.strength = (quality === 'low' || quality === 'medium') ? 0 : preset.bloomStrength;
      composerPasses.bloom.threshold = preset.bloomThreshold;
    }

    skyDome.visible = true;
    rebakePMREM(preset);
    const useGlobalEnv = quality === 'ultra' || quality === 'high';
    scene.environment = useGlobalEnv ? (currentEnvRT?.texture || null) : null;
    if ('environmentIntensity' in scene) {
      scene.environmentIntensity = quality === 'ultra' ? 0.92 : (quality === 'high' ? 0.72 : 0.55);
    }
    return preset;
  }

  return {
    sharedUniforms,
    skyDome,
    getActivePreset: () => TIME_OF_DAY_PRESETS[activePresetId],
    getActiveId: () => activePresetId,
    getEnvTexture: () => currentEnvRT?.texture || null,
    applyPreset,
    update(time, cameraPos) {
      sharedUniforms.uTime.value = time;
      if (cameraPos) skyDome.position.copy(cameraPos);
    },
    dispose() {
      if (currentEnvRT) currentEnvRT.dispose();
      pmremGen.dispose();
    },
  };
}
