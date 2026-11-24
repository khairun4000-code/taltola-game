import * as THREE from 'three';

/**
 * KHULNA VI — HYPER-REALISTIC CRYSTAL WATER & PHYSICAL REACTION ENGINE (V2)
 *
 * Combines:
 *  1) The exact rich, deep, jewel-toned Rupsha River & crystal Sundarbans Emerald Pond
 *     color palette + crisp analytical multi-wave normals (zero milky/white washout!).
 *  2) Dynamic 4-View Time-of-Day water adaptation (Daylight, Golden Hour, Sunset, Night)
 *     including warm golden Khan Jahan Ali (Rupsha) Bridge & Ghat night reflections.
 *  3) Distinct physical wave motion:
 *     - Ponds (`uWaterKind = 0`): ultra-soft, calm, gentle micro-ripples ("হালকা নরম ঢেউ").
 *     - Rivers (`uWaterKind = 1`): directional downstream current swells ("ভাসতে ভাসতে যায়").
 *     - Algae Pond (`uWaterKind = 2`): lush duckweed mat with crystal water pockets & 3D ripples.
 *     - Fountain (`uWaterKind = 3`): sparkling circulating basin water.
 *  4) Real-Time 20-Slot GPU 3D Wave Ring Buffer + 60-FPS Instanced Crystal Splash VFX + Web Audio:
 *     - Swimming wakes & plunge splashes
 *     - `[H]` Stone / Object throw with Worthington rebound jet & concentric 3D pond ripples
 *     - `[J]` Gunshot / Bullet supersonic water-jet spikes & spray
 *     - `[U]` Water Bomb towering geyser plumes, shockwave rings & rainback droplets
 */

export const MAX_WATER_RIPPLES = 20;

function seeded(seed) {
  let s = (seed | 0) + 918273;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Soft translucent crystal ripple-shimmer texture for surface splash rings (subtle & clean, never chalky white!).
 */
function createCrystalRingTexture() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(31907);

  ctx.clearRect(0, 0, S, S);
  const cx = S * 0.5;
  const cy = S * 0.5;

  // Crisp thin concentric water-crest ring (transparent center & outer edge, zero milky disc!)
  const grad = ctx.createRadialGradient(cx, cy, S * 0.20, cx, cy, S * 0.49);
  grad.addColorStop(0.0, 'rgba(185,235,250,0.0)');
  grad.addColorStop(0.42, 'rgba(195,240,252,0.16)');
  grad.addColorStop(0.55, 'rgba(185,235,250,0.02)');
  grad.addColorStop(0.76, 'rgba(215,246,255,0.58)');
  grad.addColorStop(0.86, 'rgba(235,252,255,0.72)');
  grad.addColorStop(0.95, 'rgba(195,238,250,0.18)');
  grad.addColorStop(1.0, 'rgba(195,238,250,0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 220; i++) {
    const ang = rnd() * Math.PI * 2;
    const rad = S * (0.20 + rnd() * 0.28);
    const r = 2.5 + rnd() * 8.0;
    ctx.fillStyle = `rgba(0,0,0,${0.25 + rnd() * 0.50})`;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Dedicated vertical crystal-spray plume texture for stone rebound crowns, bullet spikes & bomb geysers.
 */
function createWaterJetPlumeTexture() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const rnd = seeded(60413);

  ctx.clearRect(0, 0, S, S);

  const baseGrad = ctx.createLinearGradient(0, S, 0, 0);
  baseGrad.addColorStop(0.0, 'rgba(225,246,255,0.88)');
  baseGrad.addColorStop(0.30, 'rgba(215,242,252,0.72)');
  baseGrad.addColorStop(0.65, 'rgba(205,238,250,0.38)');
  baseGrad.addColorStop(0.90, 'rgba(200,235,248,0.10)');
  baseGrad.addColorStop(1.0, 'rgba(220,245,255,0.0)');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, S, S);

  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 72; i++) {
    const x = rnd() * S;
    const w = 3 + rnd() * 11;
    const topH = S * (0.35 + rnd() * 0.62);
    const g = ctx.createLinearGradient(0, 0, 0, topH);
    g.addColorStop(0.0, `rgba(0,0,0,${0.68 + rnd() * 0.32})`);
    g.addColorStop(1.0, 'rgba(0,0,0,0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - w * 0.5, 0, w, topH);
    if (x < w) ctx.fillRect(x + S - w * 0.5, 0, topH, w);
    if (x > S - w) ctx.fillRect(x - S - w * 0.5, 0, w, topH);
  }

  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 130; i++) {
    const x = rnd() * S;
    const y = S * (0.08 + rnd() * 0.86);
    const w = 1.4 + rnd() * 3.6;
    const h = 14 + rnd() * 44;
    ctx.fillStyle = `rgba(240,252,255,${0.22 + rnd() * 0.45})`;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function distToSegmentSq2D(px, pz, ax, az, bx, bz) {
  const vx = bx - ax;
  const vz = bz - az;
  const wx = px - ax;
  const wz = pz - az;
  const lenSq = vx * vx + vz * vz;
  let t = lenSq > 1e-8 ? (wx * vx + wz * vz) / lenSq : 0;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const dx = px - (ax + t * vx);
  const dz = pz - (az + t * vz);
  return dx * dx + dz * dz;
}

/**
 * Watertight shared-edge subdivision for horizontal (XZ) `ShapeGeometry` water meshes,
 * plus exact metric shoreline distance (`aShoreDist`) to `flatPoly` perimeter!
 */
export function subdivideWaterPolygonGeometry(baseGeo, flatPoly, maxEdgeLen = 3.5, maxPasses = 5) {
  const srcPos = baseGeo.attributes.position;
  const px = [];
  const py = [];
  const pz = [];
  for (let i = 0; i < srcPos.count; i++) {
    px.push(srcPos.getX(i));
    py.push(srcPos.getY(i));
    pz.push(srcPos.getZ(i));
  }

  let indices = [];
  if (baseGeo.index) {
    const arr = baseGeo.index.array;
    for (let i = 0; i < arr.length; i++) indices.push(arr[i]);
  } else {
    for (let i = 0; i < srcPos.count; i++) indices.push(i);
  }

  const maxLenSq = maxEdgeLen * maxEdgeLen;

  for (let pass = 0; pass < maxPasses; pass++) {
    const edgeMid = new Map();
    let splitCount = 0;

    const getSplitMid = (a, b) => {
      const dx = px[a] - px[b];
      const dz = pz[a] - pz[b];
      if (dx * dx + dz * dz <= maxLenSq) return -1;
      const lo = a < b ? a : b;
      const hi = a < b ? b : a;
      const key = `${lo}_${hi}`;
      let mid = edgeMid.get(key);
      if (mid === undefined) {
        mid = px.length;
        px.push((px[a] + px[b]) * 0.5);
        py.push((py[a] + py[b]) * 0.5);
        pz.push((pz[a] + pz[b]) * 0.5);
        edgeMid.set(key, mid);
        splitCount++;
      }
      return mid;
    };

    const nextIndices = [];
    for (let t = 0; t < indices.length; t += 3) {
      const i0 = indices[t];
      const i1 = indices[t + 1];
      const i2 = indices[t + 2];

      const m01 = getSplitMid(i0, i1);
      const m12 = getSplitMid(i1, i2);
      const m20 = getSplitMid(i2, i0);

      const nSplits = (m01 >= 0 ? 1 : 0) + (m12 >= 0 ? 1 : 0) + (m20 >= 0 ? 1 : 0);
      if (nSplits === 0) {
        nextIndices.push(i0, i1, i2);
      } else if (nSplits === 3) {
        nextIndices.push(
          i0, m01, m20,
          m01, i1, m12,
          m20, m12, i2,
          m01, m12, m20,
        );
      } else if (nSplits === 1) {
        if (m01 >= 0) {
          nextIndices.push(i0, m01, i2, m01, i1, i2);
        } else if (m12 >= 0) {
          nextIndices.push(i0, i1, m12, i0, m12, i2);
        } else {
          nextIndices.push(i0, i1, m20, m20, i1, i2);
        }
      } else if (m01 < 0) {
        nextIndices.push(i0, i1, m12, i0, m12, m20, m20, m12, i2);
      } else if (m12 < 0) {
        nextIndices.push(i0, m01, m20, m01, i1, i2, m01, i2, m20);
      } else {
        nextIndices.push(i0, m01, i2, m01, m12, i2, m01, i1, m12);
      }
    }

    indices = nextIndices;
    if (splitCount === 0 || px.length > 18000) break;
  }

  const vCount = px.length;
  const posArr = new Float32Array(vCount * 3);
  const uvArr = new Float32Array(vCount * 2);
  const shoreArr = new Float32Array(vCount);
  const nPts = flatPoly ? (flatPoly.length >> 1) : 0;

  for (let i = 0; i < vCount; i++) {
    const x = px[i];
    const y = py[i];
    const z = pz[i];
    posArr[i * 3] = x;
    posArr[i * 3 + 1] = y;
    posArr[i * 3 + 2] = z;
    uvArr[i * 2] = x * 0.05;
    uvArr[i * 2 + 1] = z * 0.05;

    if (nPts >= 3) {
      let minDSq = Infinity;
      for (let k = 0; k < nPts; k++) {
        const k2 = (k + 1) % nPts;
        const dSq = distToSegmentSq2D(
          x, z,
          flatPoly[k * 2], flatPoly[k * 2 + 1],
          flatPoly[k2 * 2], flatPoly[k2 * 2 + 1],
        );
        if (dSq < minDSq) minDSq = dSq;
      }
      shoreArr[i] = Math.sqrt(minDSq);
    } else {
      shoreArr[i] = 6.0;
    }
  }

  const outGeo = new THREE.BufferGeometry();
  outGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  outGeo.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));
  outGeo.setAttribute('aShoreDist', new THREE.BufferAttribute(shoreArr, 1));
  outGeo.setIndex(indices);
  outGeo.computeVertexNormals();
  return outGeo;
}

export function createSubdividedRectWaterGeometry(width, depth, segX = 52, segZ = 42) {
  const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  geo.rotateX(-Math.PI * 0.5);
  const pos = geo.attributes.position;
  const shore = new Float32Array(pos.count);
  const hw = width * 0.5;
  const hd = depth * 0.5;
  for (let i = 0; i < pos.count; i++) {
    const dx = Math.max(0, hw - Math.abs(pos.getX(i)));
    const dz = Math.max(0, hd - Math.abs(pos.getZ(i)));
    shore[i] = Math.min(dx, dz);
  }
  geo.setAttribute('aShoreDist', new THREE.BufferAttribute(shore, 1));
  return geo;
}

export function createHyperWaterHub(sharedUniforms) {
  const fallbackUniforms = sharedUniforms || {
    uTime: { value: 0 },
    uSunDir: { value: new THREE.Vector3(92, 54, -76).normalize() },
    uSunColor: { value: new THREE.Color(0xffd199) },
    uSkyTop: { value: new THREE.Color(0x255a96) },
    uSkyHorizon: { value: new THREE.Color(0xf4c898) },
    uSunGlow: { value: new THREE.Color(0xffb368) },
    uFogColor: { value: new THREE.Color(0xdccbb6) },
    uNightFactor: { value: 0.0 },
    uStarAlpha: { value: 0.0 },
  };

  const uRipples = {
    value: Array.from({ length: MAX_WATER_RIPPLES }, () => new THREE.Vector4(0, 0, -9999, 0)),
  };
  const uRippleMeta = {
    value: Array.from({ length: MAX_WATER_RIPPLES }, () => new THREE.Vector4(2.4, 7.5, 1.2, 0.24)),
  };

  const uFogNear = { value: 210.0 };
  const uFogFar = { value: 540.0 };
  const uDetailScale = { value: 1.0 };

  let rippleCursor = 0;
  const materials = [];

  function spawnRipple({
    x,
    z,
    amplitude = 0.035,
    speed = 2.4,
    freqK = 7.8,
    decay = 1.15,
    foam = 0.22,
  }) {
    const now = fallbackUniforms.uTime.value;
    let slot = -1;
    for (let i = 0; i < MAX_WATER_RIPPLES; i++) {
      const idx = (rippleCursor + i) % MAX_WATER_RIPPLES;
      const r = uRipples.value[idx];
      const meta = uRippleMeta.value[idx];
      const age = now - r.z;
      if (r.w <= 0.0005 || age < 0 || age * meta.z > 5.2) {
        slot = idx;
        break;
      }
    }
    if (slot < 0) slot = rippleCursor;
    rippleCursor = (slot + 1) % MAX_WATER_RIPPLES;

    uRipples.value[slot].set(x, z, now, amplitude);
    uRippleMeta.value[slot].set(speed, freqK, decay, foam);
    return slot;
  }

  /**
   * Creates the crystal-deep Rupsha River / Sundarbans Pond ShaderMaterial:
   * - Matches the exact analytical wave & rich jewel-teal Rupsha Bridge river look (`rupsha-map-standalone.js`),
   * - Zero milky/cloudy white washout on ponds or rivers,
   * - Full 3D vertex + analytical normal interactive ripple rings & Time-of-Day transitions!
   */
  function createWaterMaterial(kind = 'pond', extraOpts = {}) {
    const kindCode = kind === 'river' ? 1.0 : (kind === 'algae' ? 2.0 : (kind === 'fountain' ? 3.0 : 0.0));
    const dummyTex = new THREE.DataTexture(new Uint8Array([40, 110, 60, 255]), 1, 1);
    dummyTex.needsUpdate = true;

    const uniforms = {
      uTime: fallbackUniforms.uTime,
      uSunDir: fallbackUniforms.uSunDir,
      uSunColor: fallbackUniforms.uSunColor,
      uSkyTop: fallbackUniforms.uSkyTop,
      uSkyHorizon: fallbackUniforms.uSkyHorizon,
      uFogColor: fallbackUniforms.uFogColor,
      uNightFactor: fallbackUniforms.uNightFactor || { value: 0.0 },
      uFogNear,
      uFogFar,
      uDetailScale,
      uAlgaeMap: { value: extraOpts.algaeMap || dummyTex },
      uWaterKind: { value: kindCode },
      uRipples,
      uRippleMeta,
    };

    const mat = new THREE.ShaderMaterial({
      uniforms,
      transparent: Boolean(extraOpts.transparent),
      polygonOffset: extraOpts.polygonOffset !== undefined ? Boolean(extraOpts.polygonOffset) : true,
      polygonOffsetFactor: extraOpts.polygonOffsetFactor ?? 1,
      polygonOffsetUnits: extraOpts.polygonOffsetUnits ?? 1,
      vertexShader: /* glsl */ `
        attribute float aShoreDist;

        uniform float uTime;
        uniform float uWaterKind;
        uniform vec4 uRipples[${MAX_WATER_RIPPLES}];
        uniform vec4 uRippleMeta[${MAX_WATER_RIPPLES}];

        varying vec3 vWorldPos;
        varying float vShoreDist;
        varying vec2 vLocalUv;

        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          float shore = aShoreDist > 0.0 ? aShoreDist : 5.0;
          float edgePin = smoothstep(0.0, 1.35, shore);

          float ambientH = 0.0;
          if (uWaterKind > 0.5 && uWaterKind < 1.5) {
            // RIVER: Exact Rupsha Bridge flowing swells ("ভাসতে ভাসতে যায়")
            ambientH = (sin(wp.x * 0.14 + wp.z * 0.11 - uTime * 1.45) * 0.042
                      + cos(wp.z * 0.24 - wp.x * 0.09 - uTime * 1.85) * 0.026) * edgePin;
          } else if (uWaterKind < 0.5) {
            // POND: Very soft, calm, gentle breathing ripples ("হালকা নরম ঢেউ")
            ambientH = (sin(wp.x * 0.36 + wp.z * 0.30 + uTime * 0.90) * 0.008
                      + cos(wp.x * 0.52 - wp.z * 0.44 - uTime * 0.72) * 0.006) * edgePin;
          } else if (uWaterKind > 2.5) {
            float r = length(position.xz);
            ambientH = sin(r * 4.2 - uTime * 3.6) * 0.009 * smoothstep(3.4, 0.4, r);
          }

          // Real-time 3D interactive wave displacement (swimming, stone drop, bullets, water bomb!)
          float rippleH = 0.0;
          for (int i = 0; i < ${MAX_WATER_RIPPLES}; i++) {
            vec4 rp = uRipples[i];
            float amp = rp.w;
            if (amp > 0.0005) {
              vec4 rm = uRippleMeta[i];
              float age = uTime - rp.z;
              if (age >= 0.0 && age * rm.z < 5.2) {
                float dist = length(wp.xz - rp.xy);
                float front = age * rm.x;
                float band = 1.30 + age * 0.52;
                float diff = dist - front;
                if (abs(diff) < band * 2.4) {
                  float env = exp(-(diff * diff) / (band * band)) * exp(-age * rm.z) / (1.0 + dist * 0.085);
                  rippleH += amp * env * sin(diff * rm.y - 0.6);
                }
              }
            }
          }

          float totalDisp = ambientH + rippleH * mix(0.35, 1.0, edgePin);
          if (uWaterKind < 0.5) {
            totalDisp = clamp(totalDisp, -0.045, 0.24);
          } else if (uWaterKind > 1.5 && uWaterKind < 2.5) {
            totalDisp = clamp(totalDisp * 0.55, -0.024, 0.14);
          }

          wp.y += totalDisp;
          vWorldPos = wp.xyz;
          vShoreDist = shore;
          vLocalUv = uv;

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
        uniform float uDetailScale;
        uniform sampler2D uAlgaeMap;
        uniform float uWaterKind;
        uniform vec4 uRipples[${MAX_WATER_RIPPLES}];
        uniform vec4 uRippleMeta[${MAX_WATER_RIPPLES}];

        varying vec3 vWorldPos;
        varying float vShoreDist;
        varying vec2 vLocalUv;

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

        // Exact crisp analytical multi-wave field from Rupsha Bridge Studio (rupsha-map-standalone.js),
        // tuned cleanly for flowing Rivers (gentle rolling current) vs calm Ponds (soft gentle wavelets)!
        float waveHeight(vec2 p, float t, float isRiver) {
          if (isRiver > 0.5) {
            // Downstream (+Z) floating river waves ("ভাসতে ভাসতে যায়")
            float h = 0.0;
            h += sin(p.x * 0.28 + p.y * 0.16 - t * 1.48) * 0.24;
            h += sin(p.x * -0.19 + p.y * 0.38 - t * 1.24) * 0.19;
            h += sin(p.x * 0.72 + p.y * 0.56 - t * 2.25) * 0.10;
            h += noise2(p * 0.45 + vec2(0.12 * t, -0.36 * t)) * 0.36;
            h += noise2(p * 1.75 + vec2(-0.28 * t, -0.64 * t)) * 0.16 * uDetailScale;
            return h;
          } else {
            // Soft, calm, gentle pond wavelets ("হালকা ঢেউ খায়, হালকা নরম আরকি")
            float h = 0.0;
            h += sin(p.x * 0.36 + p.y * 0.28 + t * 0.82) * 0.14;
            h += sin(p.x * -0.26 + p.y * 0.42 - t * 0.68) * 0.11;
            h += noise2(p * 0.52 + vec2(t * 0.16, -t * 0.14)) * 0.22;
            h += noise2(p * 1.65 + vec2(-t * 0.28, t * 0.22)) * 0.09 * uDetailScale;
            return h;
          }
        }

        void main() {
          vec2 p = vWorldPos.xz;
          float isRiver = (uWaterKind > 0.5 && uWaterKind < 1.5) ? 1.0 : 0.0;
          float camDist = length(cameraPosition - vWorldPos);
          // Smoothly filter micro-slopes only at extreme horizon (>180m) to avoid sub-pixel shimmer
          float distSlopeFade = 1.0 - smoothstep(170.0, 420.0, camDist) * 0.55;

          float e = 0.15;
          float h0 = waveHeight(p, uTime, isRiver);
          float hx = waveHeight(p + vec2(e, 0.0), uTime, isRiver);
          float hz = waveHeight(p + vec2(0.0, e), uTime, isRiver);
          float nScale = mix(0.92, 1.45, isRiver) * distSlopeFade;
          vec2 baseSlope = vec2((h0 - hx) * nScale, (h0 - hz) * nScale);

          // Real-Time Analytical 3D Interactive Ripples (swimming, thrown stones, gunshots, water bombs!)
          vec2 rippleSlope = vec2(0.0);
          float crestFoamRing = 0.0;

          for (int i = 0; i < ${MAX_WATER_RIPPLES}; i++) {
            vec4 rp = uRipples[i];
            float amp = rp.w;
            if (amp > 0.0005) {
              vec4 rm = uRippleMeta[i];
              float age = uTime - rp.z;
              if (age >= 0.0 && age * rm.z < 5.2) {
                vec2 delta = p - rp.xy;
                float dist = length(delta);
                float front = age * rm.x;
                float band = 1.25 + age * 0.52;
                float diff = dist - front;
                if (abs(diff) < band * 2.5) {
                  vec2 dir = dist > 0.001 ? (delta / dist) : vec2(1.0, 0.0);
                  float env = exp(-(diff * diff) / (band * band)) * exp(-age * rm.z) / (1.0 + dist * 0.08);
                  float phase = diff * rm.y - 0.6;
                  float sOsc = sin(phase);
                  float cOsc = cos(phase);
                  float dHdr = amp * env * (cOsc * rm.y - sOsc * (2.0 * diff / (band * band)));
                  rippleSlope += dir * clamp(dHdr * 2.45, -1.45, 1.45);
                  // Crisp, delicate whitewater shimmer ONLY right on the sharpest wave-ring crests (never milky!)
                  crestFoamRing += smoothstep(0.55, 0.98, sOsc) * env * rm.w * (1.35 + amp * 6.0);
                }
              }
            }
          }

          vec3 N = normalize(vec3(baseSlope.x - rippleSlope.x, 1.0, baseSlope.y - rippleSlope.y));
          vec3 V = normalize(cameraPosition - vWorldPos);
          vec3 L = normalize(uSunDir);

          float nightW = smoothstep(0.72, 0.98, uNightFactor);
          float sunsetW = smoothstep(0.18, 0.62, uNightFactor) * (1.0 - smoothstep(0.74, 0.96, uNightFactor));

          // Fresnel & Sky Reflection (exact Rupsha Studio crisp reflection — biased toward deep skyTop so water NEVER washes out white!)
          float NoV = clamp(dot(N, V), 0.001, 1.0);
          float fresnel = 0.03 + 0.97 * pow(1.0 - NoV, 4.4);

          vec3 R = reflect(-V, N);
          float rUp = clamp(abs(R.y), 0.0, 1.0);
          // Bias horizon blend toward rich azure/twilight skyTop so ponds & rivers stay deeply saturated!
          vec3 cleanHorizon = mix(uSkyHorizon, uSkyTop, mix(0.32, 0.14, sunsetW + nightW));
          vec3 reflSky = mix(cleanHorizon, uSkyTop, pow(rUp, 0.46));

          float reflSun = max(dot(R, L), 0.0);
          reflSky += uSunColor * pow(reflSun, 42.0) * mix(0.95, 0.35, nightW);

          // Razor-sharp diamond sun & moon sparkles across wavelets
          vec3 H = normalize(L + V);
          float NoH = max(dot(N, H), 0.0);
          float specTight = pow(NoH, 220.0) * mix(2.4, 3.1, isRiver);
          float specBroad = pow(NoH, 28.0) * mix(0.18, 0.26, isRiver);
          vec3 glintColor = mix(uSunColor, vec3(0.74, 0.85, 0.98), nightW);
          vec3 specular = glintColor * (specTight + specBroad) * mix(1.0, 0.42, nightW);

          // -----------------------------------------------------------------
          // RICH JEWEL-TONED RUPSHA RIVER & CRYSTAL EMERALD-SAPPHIRE POND PALETTE
          // (Exact beloved Rupsha Bridge color in Day/Golden/Sunset/Night — ZERO muddy/milky tint!)
          // -----------------------------------------------------------------
          float shoreMeters = max(0.0, vShoreDist);
          float shallowMask = 1.0 - smoothstep(0.0, mix(4.2, 26.0, isRiver), shoreMeters);

          // River: exact createStandaloneRupshaRiverMaterial deep teal-sapphire -> coastal jade
          vec3 riverDeepDay   = vec3(0.020, 0.092, 0.132);
          vec3 riverShalDay   = vec3(0.072, 0.198, 0.174);
          // Pond: crystal-clean deep Sundarbans emerald-teal -> rich jade-cyan near ghat steps
          vec3 pondDeepDay    = vec3(0.015, 0.088, 0.098);
          vec3 pondShalDay    = vec3(0.042, 0.165, 0.148);
          // Fountain: sparkling turquoise-sapphire
          vec3 fountDeepDay   = vec3(0.022, 0.135, 0.168);
          vec3 fountShalDay   = vec3(0.058, 0.240, 0.245);

          vec3 baseDeep = isRiver > 0.5 ? riverDeepDay : (uWaterKind > 2.5 ? fountDeepDay : pondDeepDay);
          vec3 baseShal = isRiver > 0.5 ? riverShalDay : (uWaterKind > 2.5 ? fountShalDay : pondShalDay);

          // Adapt water body across Sunset & Khulna Night while keeping rich depth
          baseDeep = mix(baseDeep, vec3(0.016, 0.048, 0.082), sunsetW * 0.65);
          baseShal = mix(baseShal, vec3(0.048, 0.112, 0.128), sunsetW * 0.65);
          baseDeep = mix(baseDeep, vec3(0.004, 0.012, 0.024), nightW);
          baseShal = mix(baseShal, vec3(0.009, 0.026, 0.042), nightW);

          vec3 waterBody = mix(baseDeep, baseShal, clamp(shallowMask * 0.68 + h0 * 0.15, 0.0, 1.0));

          // Delicate shoreline shimmer & river wave-crest sparkle (clean & subtle, never chalky!)
          float shoreRipple = sin(shoreMeters * 2.2 - uTime * 2.1 + noise2(p * 0.4) * 3.0) * 0.5 + 0.5;
          float shoreFoam = isRiver * (1.0 - smoothstep(0.0, 2.2, shoreMeters)) * shoreRipple * 0.34;
          float crestFoam = isRiver * smoothstep(0.80, 0.98, h0) * 0.16;
          vec3 foamColor = mix(
            mix(uSkyHorizon, vec3(0.88, 0.95, 0.96), 0.55),
            vec3(0.18, 0.24, 0.32),
            nightW
          );

          // Warm golden reflections of Khan Jahan Ali (Rupsha) Bridge (z ~ 820), Ferry Ghat (z ~ 646) & Launch Ghat (z ~ 34) at Sunset/Night!
          vec3 nightRefl = vec3(0.0);
          if (isRiver > 0.5 && uNightFactor > 0.12) {
            float bridgeGlow = exp(-pow((vWorldPos.z - 820.0) * 0.024, 2.0));
            float ferryGlow  = exp(-pow((vWorldPos.z - 646.0) * 0.032, 2.0)) * (1.0 - smoothstep(0.0, 48.0, shoreMeters));
            float ghatGlow   = exp(-pow((vWorldPos.z - 34.0) * 0.032, 2.0)) * (1.0 - smoothstep(0.0, 48.0, shoreMeters));
            float lightShimmer = 0.65 + 0.35 * sin(vWorldPos.z * 1.8 + h0 * 8.0 + uTime * 2.5);
            nightRefl = vec3(1.0, 0.72, 0.32) * (bridgeGlow * 0.62 + ferryGlow * 0.48 + ghatGlow * 0.52) * lightShimmer * uNightFactor;
          }

          // Keep Fresnel capped lower on calm ponds (max 0.48) so deep emerald-sapphire water color ALWAYS dominates!
          float fresnelCap = mix(0.48, 0.70, isRiver);
          float fresnelMix = clamp(fresnel * mix(0.54, 0.76, isRiver), 0.04, fresnelCap);
          vec3 color = mix(waterBody, reflSky, fresnelMix) + specular + nightRefl;
          color = mix(color, foamColor, clamp((shoreFoam + crestFoam + crestFoamRing) * 0.38, 0.0, 0.34));

          // ALGAE POND MODE (Alia Madrasah South Old Green Pond — duckweed mat with crystal water pockets & 3D ripples)
          if (uWaterKind > 1.5 && uWaterKind < 2.5) {
            vec3 algaeTex = texture2D(uAlgaeMap, vLocalUv * 3.5 + N.xz * 0.035).rgb;
            vec3 algaeDay = pow(algaeTex, vec3(1.85)) * 1.12;
            vec3 algaeLit = algaeDay * mix(vec3(1.0, 1.02, 0.95), vec3(0.10, 0.14, 0.18), nightW);
            float algaeOpen = smoothstep(0.24, 0.09, dot(algaeTex, vec3(0.25, 0.55, 0.20)))
                            + clamp(crestFoamRing * 1.25, 0.0, 0.75);
            color = mix(color, algaeLit, clamp(0.86 - algaeOpen * 0.76, 0.08, 0.90));
          }

          float fogT = smoothstep(uFogNear, uFogFar, camDist);
          color = mix(color, uFogColor, fogT);

          gl_FragColor = vec4(color, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });

    mat.userData.uniforms = uniforms;
    mat.userData.waterKind = kind;
    materials.push(mat);
    return mat;
  }

  function setFogBounds(near, far) {
    uFogNear.value = near;
    uFogFar.value = far;
  }

  function setQualityMode(qualityMode = 'high') {
    uDetailScale.value = qualityMode === 'low' ? 0.35 : (qualityMode === 'medium' ? 0.75 : 1.0);
  }

  return {
    sharedUniforms: fallbackUniforms,
    uRipples,
    uRippleMeta,
    materials,
    spawnRipple,
    createWaterMaterial,
    setFogBounds,
    setQualityMode,
  };
}

/**
 * Instanced 60-FPS 3D Crystal Splash, Crown Jet, Bullet Spike, Bomb Geyser, Throwable Projectile
 * & Procedural Web Audio Water Sound System.
 */
export function createWaterReactionSystem(scene, waterHub, { getWaterInfo, getGroundHeight } = {}) {
  const vfxGroup = new THREE.Group();
  vfxGroup.name = 'HyperWaterReactionsVFX';
  scene.add(vfxGroup);

  const MAX_DROPLETS = 320;
  const MAX_RINGS = 64;
  const MAX_JETS = 56;
  const MAX_PROJECTILES = 16;

  // 1) 3D Ballistic Crystal-Aqua Water Droplets
  const dropGeo = new THREE.SphereGeometry(0.052, 6, 5);
  const dropMat = new THREE.MeshBasicMaterial({
    color: 0xc2ecfa,
    transparent: true,
    opacity: 0.76,
    depthWrite: false,
  });
  const dropletMesh = new THREE.InstancedMesh(dropGeo, dropMat, MAX_DROPLETS);
  dropletMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  dropletMesh.frustumCulled = false;
  vfxGroup.add(dropletMesh);

  // 2) Subtle Translucent Crystal Shimmer Rings (never opaque/chalky white!)
  const ringTex = createCrystalRingTexture();
  const ringGeo = new THREE.PlaneGeometry(1, 1);
  ringGeo.rotateX(-Math.PI * 0.5);
  const ringMat = new THREE.MeshBasicMaterial({
    map: ringTex,
    color: 0xc8f0fc,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const ringMesh = new THREE.InstancedMesh(ringGeo, ringMat, MAX_RINGS);
  ringMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  ringMesh.frustumCulled = false;
  vfxGroup.add(ringMesh);

  // 3) 3D Vertical Water Plumes, Crown Columns & Supersonic Bullet Spikes
  const jetPlumeTex = createWaterJetPlumeTexture();
  const jetGeo = new THREE.CylinderGeometry(0.54, 0.20, 1.0, 14, 1, true);
  jetGeo.translate(0, 0.5, 0);
  const jetMat = new THREE.MeshBasicMaterial({
    map: jetPlumeTex,
    color: 0xd8f4ff,
    transparent: true,
    opacity: 0.78,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const jetMesh = new THREE.InstancedMesh(jetGeo, jetMat, MAX_JETS);
  jetMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  jetMesh.frustumCulled = false;
  vfxGroup.add(jetMesh);

  // 4) Live Throwable 3D Stones/Bricks & Water Bombs
  const projGeo = new THREE.DodecahedronGeometry(0.12, 1);
  const projMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.72,
    metalness: 0.18,
  });
  const projMesh = new THREE.InstancedMesh(projGeo, projMat, MAX_PROJECTILES);
  projMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  projMesh.frustumCulled = false;
  vfxGroup.add(projMesh);

  const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
  const whiteCol = new THREE.Color(1, 1, 1);
  for (let i = 0; i < MAX_DROPLETS; i++) {
    dropletMesh.setMatrixAt(i, zeroMatrix);
    dropletMesh.setColorAt(i, whiteCol);
  }
  for (let i = 0; i < MAX_RINGS; i++) {
    ringMesh.setMatrixAt(i, zeroMatrix);
    ringMesh.setColorAt(i, whiteCol);
  }
  for (let i = 0; i < MAX_JETS; i++) {
    jetMesh.setMatrixAt(i, zeroMatrix);
    jetMesh.setColorAt(i, whiteCol);
  }
  for (let i = 0; i < MAX_PROJECTILES; i++) {
    projMesh.setMatrixAt(i, zeroMatrix);
    projMesh.setColorAt(i, whiteCol);
  }

  const droplets = Array.from({ length: MAX_DROPLETS }, () => ({
    active: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
    age: 0, maxAge: 1, size: 0.055, waterY: 0, secondaryRipple: false,
  }));
  const rings = Array.from({ length: MAX_RINGS }, () => ({
    active: false, x: 0, y: 0, z: 0, age: 0, maxAge: 1, startR: 0.2, endR: 2.2, alpha: 1.0, rot: 0,
  }));
  const jets = Array.from({ length: MAX_JETS }, () => ({
    active: false, x: 0, y: 0, z: 0, age: 0, maxAge: 0.6,
    radXZ: 0.28, peakH: 1.4, tiltX: 0, tiltZ: 0, delay: 0,
  }));
  const projectiles = Array.from({ length: MAX_PROJECTILES }, () => ({
    active: false, kind: 'stone', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
    age: 0, spin: 0, mass: 1.0, power: 1.0,
  }));

  let dropCursor = 0;
  let ringCursor = 0;
  let jetCursor = 0;
  let projCursor = 0;
  let qualityScale = 1.0;

  let audioCtx = null;
  let noiseBuf = null;

  function ensureAudio() {
    if (typeof window === 'undefined') return null;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) {
      try {
        audioCtx = new Ctx();
      } catch {
        return null;
      }
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    if (!noiseBuf && audioCtx) {
      const len = Math.floor(audioCtx.sampleRate * 1.8);
      noiseBuf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const out = noiseBuf.getChannelData(0);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + w * 0.029;
        b1 = 0.985 * b1 + w * 0.032;
        b2 = 0.950 * b2 + w * 0.048;
        out[i] = (b0 + b1 + b2 + w * 0.18) * 0.55;
      }
    }
    return audioCtx;
  }

  function playWaterSfx(kind = 'splash', intensity = 1.0) {
    const ctx = ensureAudio();
    if (!ctx || !noiseBuf) return;
    const now = ctx.currentTime;
    const vol = THREE.MathUtils.clamp(intensity, 0.12, 1.35);

    if (kind === 'stone') {
      const osc = ctx.createOscillator();
      const oGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(165, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.075);
      osc.frequency.exponentialRampToValueAtTime(135, now + 0.18);
      oGain.gain.setValueAtTime(0.001, now);
      oGain.gain.linearRampToValueAtTime(0.22 * vol, now + 0.015);
      oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(oGain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    }

    if (kind === 'bomb') {
      const sub = ctx.createOscillator();
      const sGain = ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(92, now);
      sub.frequency.exponentialRampToValueAtTime(26, now + 0.65);
      sGain.gain.setValueAtTime(0.45 * vol, now);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.78);
      sub.connect(sGain).connect(ctx.destination);
      sub.start(now);
      sub.stop(now + 0.80);
    }

    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const filter = ctx.createBiquadFilter();
    const nGain = ctx.createGain();

    if (kind === 'bullet') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1950, now);
      filter.frequency.exponentialRampToValueAtTime(520, now + 0.28);
      filter.Q.value = 1.4;
      nGain.gain.setValueAtTime(0.26 * vol, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);
      src.start(now);
      src.stop(now + 0.32);
    } else if (kind === 'bomb') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1450, now);
      filter.frequency.exponentialRampToValueAtTime(280, now + 1.55);
      nGain.gain.setValueAtTime(0.01, now);
      nGain.gain.linearRampToValueAtTime(0.42 * vol, now + 0.05);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 1.65);
      src.start(now);
      src.stop(now + 1.70);
    } else if (kind === 'swim') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(620, now);
      filter.Q.value = 1.1;
      nGain.gain.setValueAtTime(0.005, now);
      nGain.gain.linearRampToValueAtTime(0.085 * vol, now + 0.05);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      src.start(now);
      src.stop(now + 0.28);
    } else {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(980, now);
      filter.frequency.exponentialRampToValueAtTime(380, now + 0.45);
      filter.Q.value = 0.9;
      nGain.gain.setValueAtTime(0.20 * vol, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      src.start(now);
      src.stop(now + 0.50);
    }
    src.connect(filter).connect(nGain).connect(ctx.destination);
  }

  function spawnDroplet(opts) {
    const d = droplets[dropCursor];
    dropCursor = (dropCursor + 1) % MAX_DROPLETS;
    d.active = true;
    d.x = opts.x;
    d.y = opts.y;
    d.z = opts.z;
    d.vx = opts.vx;
    d.vy = opts.vy;
    d.vz = opts.vz;
    d.age = 0;
    d.maxAge = opts.maxAge ?? 1.1;
    d.size = opts.size ?? 0.05;
    d.waterY = opts.waterY ?? 0.0;
    d.secondaryRipple = Boolean(opts.secondaryRipple);
  }

  function spawnSurfaceRing({ x, y, z, startR = 0.22, endR = 2.2, maxAge = 1.0, alpha = 0.65 }) {
    const r = rings[ringCursor];
    ringCursor = (ringCursor + 1) % MAX_RINGS;
    r.active = true;
    r.x = x;
    r.y = y + 0.022;
    r.z = z;
    r.age = 0;
    r.maxAge = maxAge;
    r.startR = startR;
    r.endR = endR;
    r.alpha = alpha;
    r.rot = Math.random() * Math.PI * 2;
  }

  function spawnWaterJet({ x, y, z, radXZ = 0.26, peakH = 1.4, maxAge = 0.50, tiltX = 0, tiltZ = 0, delay = 0 }) {
    const j = jets[jetCursor];
    jetCursor = (jetCursor + 1) % MAX_JETS;
    j.active = true;
    j.x = x;
    j.y = y - 0.03;
    j.z = z;
    j.age = 0;
    j.maxAge = maxAge;
    j.radXZ = radXZ;
    j.peakH = peakH;
    j.tiltX = tiltX;
    j.tiltZ = tiltZ;
    j.delay = delay;
  }

  function triggerSwimStroke(x, z, waterY = 0.0, speed = 2.5, dirX = 0, dirZ = 1, playSound = true) {
    const moveFactor = THREE.MathUtils.clamp(speed / 3.8, 0.15, 1.35);
    waterHub.spawnRipple({
      x: x - dirX * 0.18,
      z: z - dirZ * 0.18,
      amplitude: 0.016 + moveFactor * 0.024,
      speed: 1.55 + moveFactor * 0.65,
      freqK: 8.6,
      decay: 1.45,
      foam: 0.14 + moveFactor * 0.18,
    });

    spawnSurfaceRing({
      x,
      y: waterY,
      z,
      startR: 0.22,
      endR: 0.68 + moveFactor * 0.52,
      maxAge: 0.68,
      alpha: 0.24 + moveFactor * 0.20,
    });

    if (speed > 0.45) {
      const count = Math.max(2, Math.round((4 + moveFactor * 7) * qualityScale));
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sideSpread = 0.4 + Math.random() * 1.35;
        spawnDroplet({
          x: x + Math.cos(ang) * 0.24,
          y: waterY + 0.06,
          z: z + Math.sin(ang) * 0.24,
          vx: Math.cos(ang) * sideSpread - dirX * (0.6 + Math.random() * 1.1),
          vy: 1.15 + Math.random() * (1.25 + moveFactor * 1.1),
          vz: Math.sin(ang) * sideSpread - dirZ * (0.6 + Math.random() * 1.1),
          size: 0.030 + Math.random() * 0.024,
          maxAge: 0.55 + Math.random() * 0.25,
          waterY,
        });
      }
      if (playSound) playWaterSfx('swim', 0.55 * moveFactor);
    }
  }

  function triggerWaterPlunge(x, z, waterY = 0.0, impactSpeed = 5.0) {
    const force = THREE.MathUtils.clamp(impactSpeed / 6.5, 0.32, 1.85);
    waterHub.spawnRipple({
      x,
      z,
      amplitude: 0.048 * force,
      speed: 2.35 + force * 0.45,
      freqK: 6.8,
      decay: 0.98,
      foam: 0.36,
    });
    spawnSurfaceRing({
      x, y: waterY, z,
      startR: 0.32,
      endR: 1.6 + force * 1.4,
      maxAge: 1.05,
      alpha: 0.55,
    });
    if (impactSpeed >= 2.8) {
      spawnWaterJet({
        x, y: waterY, z,
        radXZ: 0.32 * force,
        peakH: 0.85 + force * 0.85,
        maxAge: 0.46,
      });
    }
    const count = Math.max(8, Math.round(26 * force * qualityScale));
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = (1.1 + Math.random() * 2.9) * force;
      spawnDroplet({
        x: x + Math.cos(ang) * 0.22,
        y: waterY + 0.08,
        z: z + Math.sin(ang) * 0.22,
        vx: Math.cos(ang) * spd,
        vy: (2.2 + Math.random() * 3.4) * force,
        vz: Math.sin(ang) * spd,
        size: 0.038 + Math.random() * 0.034,
        maxAge: 0.92,
        waterY,
        secondaryRipple: i < 4,
      });
    }
    playWaterSfx('splash', 0.85 * force);
  }

  function triggerObjectDrop(x, z, waterY = 0.0, mass = 1.0) {
    const m = THREE.MathUtils.clamp(mass, 0.35, 2.5);
    waterHub.spawnRipple({
      x,
      z,
      amplitude: 0.044 * m,
      speed: 2.15,
      freqK: 7.6,
      decay: 0.82,
      foam: 0.32,
    });
    waterHub.spawnRipple({
      x: x + 0.02,
      z: z - 0.02,
      amplitude: 0.022 * m,
      speed: 1.38,
      freqK: 11.5,
      decay: 1.05,
      foam: 0.16,
    });

    spawnSurfaceRing({
      x, y: waterY, z,
      startR: 0.16,
      endR: 2.1 + m * 1.2,
      maxAge: 1.25,
      alpha: 0.55,
    });
    spawnWaterJet({
      x, y: waterY, z,
      radXZ: 0.22 * m,
      peakH: 0.65 + m * 0.48,
      maxAge: 0.42,
    });
    spawnWaterJet({
      x, y: waterY, z,
      radXZ: 0.10 * m,
      peakH: 1.05 + m * 0.65,
      maxAge: 0.52,
      delay: 0.065,
    });

    const count = Math.max(6, Math.round(22 * m * qualityScale));
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const outSpd = (0.7 + Math.random() * 2.1) * Math.sqrt(m);
      spawnDroplet({
        x: x + Math.cos(ang) * 0.10,
        y: waterY + 0.06,
        z: z + Math.sin(ang) * 0.10,
        vx: Math.cos(ang) * outSpd,
        vy: (2.2 + Math.random() * 3.2) * Math.sqrt(m),
        vz: Math.sin(ang) * outSpd,
        size: 0.034 + Math.random() * 0.030,
        maxAge: 0.92,
        waterY,
        secondaryRipple: i < 3,
      });
    }
    playWaterSfx('stone', 0.9 * m);
  }

  function triggerBulletImpact(x, z, waterY = 0.0, dirX = 0, dirY = -0.4, dirZ = 1, caliber = 1.0) {
    const cal = THREE.MathUtils.clamp(caliber, 0.5, 2.2);
    waterHub.spawnRipple({
      x,
      z,
      amplitude: 0.034 * cal,
      speed: 2.85,
      freqK: 12.0,
      decay: 1.35,
      foam: 0.42,
    });

    spawnSurfaceRing({
      x, y: waterY, z,
      startR: 0.10,
      endR: 1.45 * cal,
      maxAge: 0.68,
      alpha: 0.62,
    });

    const ricX = THREE.MathUtils.clamp(dirX * 0.26, -0.35, 0.35);
    const ricZ = THREE.MathUtils.clamp(dirZ * 0.26, -0.35, 0.35);
    spawnWaterJet({
      x, y: waterY, z,
      radXZ: 0.11 * cal,
      peakH: (1.75 + Math.random() * 0.75) * cal,
      maxAge: 0.34,
      tiltX: ricX,
      tiltZ: ricZ,
    });
    spawnWaterJet({
      x, y: waterY, z,
      radXZ: 0.24 * cal,
      peakH: 0.76 * cal,
      maxAge: 0.28,
    });

    const count = Math.max(8, Math.round(24 * cal * qualityScale));
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const cone = 0.35 + Math.random() * 1.45;
      spawnDroplet({
        x,
        y: waterY + 0.08,
        z,
        vx: Math.cos(ang) * cone + dirX * (1.2 + Math.random() * 2.4),
        vy: (3.6 + Math.random() * 4.8) * cal,
        vz: Math.sin(ang) * cone + dirZ * (1.2 + Math.random() * 2.4),
        size: 0.026 + Math.random() * 0.026,
        maxAge: 0.85,
        waterY,
        secondaryRipple: i < 2,
      });
    }
    playWaterSfx('bullet', 0.95 * cal);
  }

  function triggerExplosion(x, z, waterY = 0.0, power = 1.0) {
    const p = THREE.MathUtils.clamp(power, 0.5, 2.5);
    waterHub.spawnRipple({
      x,
      z,
      amplitude: 0.19 * p,
      speed: 4.25,
      freqK: 3.6,
      decay: 0.52,
      foam: 0.68,
    });
    waterHub.spawnRipple({
      x: x + 0.15,
      z: z - 0.12,
      amplitude: 0.11 * p,
      speed: 2.55,
      freqK: 5.8,
      decay: 0.65,
      foam: 0.48,
    });

    spawnSurfaceRing({
      x, y: waterY, z,
      startR: 0.8,
      endR: 10.5 * p,
      maxAge: 1.75,
      alpha: 0.72,
    });
    spawnSurfaceRing({
      x, y: waterY, z,
      startR: 0.4,
      endR: 6.2 * p,
      maxAge: 2.15,
      alpha: 0.65,
    });

    spawnWaterJet({
      x, y: waterY, z,
      radXZ: 0.92 * p,
      peakH: 8.8 * p,
      maxAge: 1.35,
    });
    spawnWaterJet({
      x, y: waterY, z,
      radXZ: 1.65 * p,
      peakH: 4.4 * p,
      maxAge: 1.15,
    });
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + Math.random() * 0.4;
      spawnWaterJet({
        x: x + Math.cos(a) * 0.62 * p,
        y: waterY,
        z: z + Math.sin(a) * 0.62 * p,
        radXZ: 0.54 * p,
        peakH: (5.2 + Math.random() * 2.4) * p,
        maxAge: 1.10 + Math.random() * 0.30,
        tiltX: Math.cos(a) * 0.28,
        tiltZ: Math.sin(a) * 0.28,
        delay: 0.03 * k,
      });
    }

    const count = Math.max(24, Math.round(82 * p * qualityScale));
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const radial = (1.6 + Math.random() * 7.8) * p;
      const upVel = (5.5 + Math.random() * 10.5) * p;
      spawnDroplet({
        x: x + Math.cos(ang) * 0.45,
        y: waterY + 0.22,
        z: z + Math.sin(ang) * 0.45,
        vx: Math.cos(ang) * radial,
        vy: upVel,
        vz: Math.sin(ang) * radial,
        size: 0.060 + Math.random() * 0.080,
        maxAge: 1.85 + Math.random() * 0.75,
        waterY,
        secondaryRipple: i < 8,
      });
    }

    playWaterSfx('bomb', 1.15 * p);
  }

  function raycastBulletWaterHit(origin, dir, maxDist = 195.0, caliber = 1.0) {
    if (!getWaterInfo || dir.y >= -0.015) return null;
    for (const testY of [0.025, -0.012, -0.34]) {
      const t = (testY - origin.y) / dir.y;
      if (t <= 0.3 || t > maxDist) continue;
      const hx = origin.x + dir.x * t;
      const hz = origin.z + dir.z * t;
      const info = getWaterInfo(hx, hz);
      if (info?.inWater && Math.abs(info.surfaceY - testY) < 0.26) {
        const gY = getGroundHeight ? getGroundHeight({ x: hx, y: info.surfaceY + 2.0, z: hz }) : 0;
        if (gY > info.surfaceY + 0.22) continue;
        triggerBulletImpact(hx, hz, info.surfaceY, dir.x, dir.y, dir.z, caliber);
        return { x: hx, y: info.surfaceY, z: hz, dist: t, kind: info.kind };
      }
    }
    return null;
  }

  const stoneColor = new THREE.Color(0x9b5a46);
  const bombColor = new THREE.Color(0x222933);

  function launchProjectile({
    kind = 'stone',
    origin,
    direction,
    speed = 15.5,
    upwardBoost = 3.2,
    mass = 1.0,
    power = 1.0,
  }) {
    const slot = projCursor;
    projCursor = (projCursor + 1) % MAX_PROJECTILES;
    const p = projectiles[slot];
    p.active = true;
    p.kind = kind;
    p.x = origin.x + direction.x * 0.55;
    p.y = origin.y - 0.12 + direction.y * 0.45;
    p.z = origin.z + direction.z * 0.55;
    p.vx = direction.x * speed;
    p.vy = direction.y * speed + upwardBoost;
    p.vz = direction.z * speed;
    p.age = 0;
    p.spin = (Math.random() * 6 + 5) * (Math.random() > 0.5 ? 1 : -1);
    p.mass = mass;
    p.power = power;
    projMesh.setColorAt(slot, kind === 'bomb' ? bombColor : stoneColor);
    if (projMesh.instanceColor) projMesh.instanceColor.needsUpdate = true;
    return p;
  }

  const tmpMat = new THREE.Matrix4();
  const tmpPos = new THREE.Vector3();
  const tmpQuat = new THREE.Quaternion();
  const tmpScale = new THREE.Vector3();
  const tmpUp = new THREE.Vector3(0, 1, 0);
  const tmpVelDir = new THREE.Vector3();
  const tmpEuler = new THREE.Euler();
  const tintColor = new THREE.Color();
  const crystalDayTint = new THREE.Color(0xc4eefc);

  function update(dt) {
    const stepDt = Math.min(dt, 0.05);

    const nf = waterHub.sharedUniforms.uNightFactor?.value ?? 0.0;
    const sunC = waterHub.sharedUniforms.uSunColor?.value;
    if (sunC) {
      tintColor.copy(crystalDayTint).lerp(sunC, 0.25).multiplyScalar(1.0 - nf * 0.65);
      if (nf > 0.7) tintColor.setRGB(0.24, 0.34, 0.46);
      dropMat.color.copy(tintColor);
      ringMat.color.copy(tintColor);
      jetMat.color.copy(tintColor);
    }

    let anyProjDirty = false;
    for (let i = 0; i < MAX_PROJECTILES; i++) {
      const pr = projectiles[i];
      if (!pr.active) continue;
      anyProjDirty = true;
      pr.age += stepDt;
      pr.vy -= 16.4 * stepDt;
      pr.x += pr.vx * stepDt;
      pr.y += pr.vy * stepDt;
      pr.z += pr.vz * stepDt;

      const wInfo = getWaterInfo ? getWaterInfo(pr.x, pr.z) : null;
      const gY = getGroundHeight ? getGroundHeight({ x: pr.x, y: pr.y + 1.5, z: pr.z }) : 0.0;
      const overDryBridge = gY > (wInfo?.surfaceY ?? 0) + 0.22;

      if (wInfo?.inWater && !overDryBridge && pr.y <= wInfo.surfaceY + 0.05) {
        pr.active = false;
        projMesh.setMatrixAt(i, zeroMatrix);
        if (pr.kind === 'bomb') {
          triggerExplosion(pr.x, pr.z, wInfo.surfaceY, pr.power);
        } else {
          const impactBoost = THREE.MathUtils.clamp(Math.abs(pr.vy) / 9.5, 0.75, 1.65);
          triggerObjectDrop(pr.x, pr.z, wInfo.surfaceY, pr.mass * impactBoost);
        }
        continue;
      }

      if (pr.y <= gY + 0.08 || pr.age > 6.5) {
        pr.active = false;
        projMesh.setMatrixAt(i, zeroMatrix);
        if (pr.kind === 'bomb') {
          for (const [ox, oz] of [[0, 0], [1.6, 0], [-1.6, 0], [0, 1.6], [0, -1.6]]) {
            const nearW = getWaterInfo ? getWaterInfo(pr.x + ox, pr.z + oz) : null;
            if (nearW?.inWater) {
              triggerExplosion(pr.x + ox, pr.z + oz, nearW.surfaceY, pr.power * 0.85);
              break;
            }
          }
        }
        continue;
      }

      const s = pr.kind === 'bomb' ? 1.35 : 0.95;
      tmpPos.set(pr.x, pr.y, pr.z);
      tmpEuler.set(pr.age * pr.spin, pr.age * pr.spin * 0.7, 0);
      tmpQuat.setFromEuler(tmpEuler);
      tmpScale.set(s, s * 0.82, s);
      tmpMat.compose(tmpPos, tmpQuat, tmpScale);
      projMesh.setMatrixAt(i, tmpMat);
    }
    if (anyProjDirty) projMesh.instanceMatrix.needsUpdate = true;

    let anyDropDirty = false;
    for (let i = 0; i < MAX_DROPLETS; i++) {
      const d = droplets[i];
      if (!d.active) continue;
      anyDropDirty = true;
      d.age += stepDt;
      d.vx *= (1.0 - 1.2 * stepDt);
      d.vz *= (1.0 - 1.2 * stepDt);
      d.vy -= 15.6 * stepDt;
      d.x += d.vx * stepDt;
      d.y += d.vy * stepDt;
      d.z += d.vz * stepDt;

      if (d.age >= d.maxAge || (d.vy < 0 && d.y <= d.waterY)) {
        if (d.secondaryRipple && d.vy < -2.0) {
          waterHub.spawnRipple({
            x: d.x,
            z: d.z,
            amplitude: 0.012,
            speed: 1.55,
            freqK: 13.5,
            decay: 1.85,
            foam: 0.12,
          });
        }
        d.active = false;
        dropletMesh.setMatrixAt(i, zeroMatrix);
        continue;
      }

      const lifeT = d.age / d.maxAge;
      const fade = 1.0 - lifeT * lifeT;
      const spd = Math.hypot(d.vx, d.vy, d.vz);
      tmpPos.set(d.x, d.y, d.z);
      if (spd > 0.15) {
        tmpVelDir.set(d.vx / spd, d.vy / spd, d.vz / spd);
        tmpQuat.setFromUnitVectors(tmpUp, tmpVelDir);
      } else {
        tmpQuat.identity();
      }
      const r = d.size * (0.55 + 0.45 * fade);
      tmpScale.set(r, r * THREE.MathUtils.clamp(1.0 + spd * 0.22, 1.0, 3.2), r);
      tmpMat.compose(tmpPos, tmpQuat, tmpScale);
      dropletMesh.setMatrixAt(i, tmpMat);
    }
    if (anyDropDirty) dropletMesh.instanceMatrix.needsUpdate = true;

    let anyRingDirty = false;
    for (let i = 0; i < MAX_RINGS; i++) {
      const r = rings[i];
      if (!r.active) continue;
      anyRingDirty = true;
      r.age += stepDt;
      if (r.age >= r.maxAge) {
        r.active = false;
        ringMesh.setMatrixAt(i, zeroMatrix);
        continue;
      }
      const t = r.age / r.maxAge;
      const easeOut = 1.0 - Math.pow(1.0 - t, 2.2);
      const rad = THREE.MathUtils.lerp(r.startR, r.endR, easeOut);
      const visScale = rad * 2.0;
      tmpPos.set(r.x, r.y, r.z);
      tmpEuler.set(0, r.rot + t * 0.25, 0);
      tmpQuat.setFromEuler(tmpEuler);
      const fadeS = visScale * (t > 0.72 ? (1.0 - (t - 0.72) * 2.5) : 1.0);
      tmpScale.set(Math.max(0.01, fadeS), 1.0, Math.max(0.01, fadeS));
      tmpMat.compose(tmpPos, tmpQuat, tmpScale);
      ringMesh.setMatrixAt(i, tmpMat);
    }
    if (anyRingDirty) ringMesh.instanceMatrix.needsUpdate = true;

    let anyJetDirty = false;
    for (let i = 0; i < MAX_JETS; i++) {
      const j = jets[i];
      if (!j.active) continue;
      anyJetDirty = true;
      if (j.delay > 0) {
        j.delay -= stepDt;
        jetMesh.setMatrixAt(i, zeroMatrix);
        continue;
      }
      j.age += stepDt;
      if (j.age >= j.maxAge) {
        j.active = false;
        jetMesh.setMatrixAt(i, zeroMatrix);
        continue;
      }
      const t = j.age / j.maxAge;
      const hCurve = t < 0.30
        ? Math.sin((t / 0.30) * Math.PI * 0.5)
        : Math.max(0.02, Math.cos(((t - 0.30) / 0.70) * Math.PI * 0.5));
      const wExpand = 0.72 + t * 0.95;
      tmpPos.set(j.x, j.y, j.z);
      tmpEuler.set(j.tiltZ, j.age * 1.4, -j.tiltX);
      tmpQuat.setFromEuler(tmpEuler);
      tmpScale.set(j.radXZ * wExpand, j.peakH * hCurve, j.radXZ * wExpand);
      tmpMat.compose(tmpPos, tmpQuat, tmpScale);
      jetMesh.setMatrixAt(i, tmpMat);
    }
    if (anyJetDirty) jetMesh.instanceMatrix.needsUpdate = true;
  }

  function setQualityMode(q = 'high') {
    qualityScale = q === 'low' ? 0.42 : (q === 'medium' ? 0.72 : (q === 'high' ? 0.92 : 1.15));
  }

  return {
    vfxGroup,
    waterHub,
    triggerSwimStroke,
    triggerWaterPlunge,
    triggerObjectDrop,
    triggerBulletImpact,
    triggerExplosion,
    raycastBulletWaterHit,
    launchProjectile,
    throwObject(origin, direction, mass = 1.0) {
      return launchProjectile({ kind: 'stone', origin, direction, speed: 15.8, upwardBoost: 3.1, mass });
    },
    throwBomb(origin, direction, power = 1.0) {
      return launchProjectile({ kind: 'bomb', origin, direction, speed: 14.5, upwardBoost: 3.8, power });
    },
    update,
    setQualityMode,
  };
}
