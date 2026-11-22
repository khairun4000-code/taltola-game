import * as THREE from 'three';
import { applyWireWindShader } from './aaa-shaders.js';
import { TALTOLA_HOUSE_OFFSET } from './khulna-geo.js';

function createPolePosterTexture(kind) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 384;
  const ctx = c.getContext('2d');
  ctx.textAlign = 'center';

  if (kind === 0) {
    // ১) ব্যাচে পড়ানো হয়
    ctx.fillStyle = '#fde047';
    ctx.fillRect(0, 0, 256, 384);
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(10, 10, 236, 72);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('ভর্তি চলছে!', 128, 56);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('ব্যাচে পড়ানো হয়', 128, 134);
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('গণিত · ইংরেজি · বিজ্ঞান', 128, 184);
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(20, 212, 216, 62);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('নবম - দ্বাদশ শ্রেণি', 128, 250);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('খুলনা স্পেশাল ব্যাচ', 128, 314);
    ctx.font = 'bold 18px monospace';
    ctx.fillText('017XX-XXXXXX', 128, 354);
  } else if (kind === 1) {
    // ২) ছাত্র চাই / টিউশন
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(0, 0, 256, 384);
    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 240, 368);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(18, 22, 220, 68);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('ছাত্র চাই', 128, 68);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('হোম টিউটর · প্রাইভেট', 128, 138);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('খুবি ও কুয়েট ছাত্র', 128, 184);
    ctx.fillText('সপ্তাহে ৫ দিন যত্নসহকারে', 128, 222);
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('খুলনা সদর এলাকা', 128, 286);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('যোগাযোগ: 019XX-XXXX', 128, 340);
  } else if (kind === 2) {
    // ৩) বাসা ভাড়া / টু-লেট
    ctx.fillStyle = '#fff7ed';
    ctx.fillRect(0, 0, 256, 384);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(0, 0, 256, 92);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('বাসা ভাড়া / চাই', 128, 46);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('TO-LET · খুলনা', 128, 78);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('ফ্যামিলি ও ব্যাচেলর', 128, 152);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#431407';
    ctx.fillText('২ রুম · ডাইনিং · বারান্দা', 128, 200);
    ctx.fillText('২৪ ঘণ্টা পানি ও গ্যাস', 128, 238);
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(24, 278, 208, 76);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('ভাড়ার জন্য যোগাযোগ', 128, 310);
    ctx.font = 'bold 18px monospace';
    ctx.fillText('018XX-XXXXXX', 128, 340);
  } else if (kind === 3) {
    // ৪) ফাইবার ওয়াই-ফাই
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 256, 384);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(10, 12, 236, 78);
    ctx.fillStyle = '#052e16';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('ফাইবার ওয়াই-ফাই', 128, 52);
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText('KHULNA NET · ৫০০ টাকা!', 128, 78);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 46px sans-serif';
    ctx.fillText('২০ Mbps', 128, 162);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 21px sans-serif';
    ctx.fillText('বাফারলেস ইউটিউব ও গেম', 128, 214);
    ctx.fillText('ফ্রি রাউটার সেটআপ', 128, 252);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(22, 286, 212, 70);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('নতুন লাইন নিতে কল করুন', 128, 316);
    ctx.font = 'bold 18px monospace';
    ctx.fillText('016XX-XXXXXX', 128, 344);
  } else if (kind === 4) {
    // ৫) বার্ষিক ওয়াজ মাহফিল
    ctx.fillStyle = '#14532d';
    ctx.fillRect(0, 0, 256, 384);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 240, 368);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(20, 24, 216, 68);
    ctx.fillStyle = '#14532d';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('বার্ষিক ওয়াজ মাহফিল', 128, 66);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('ইসলামী মহাসম্মেলন', 128, 138);
    ctx.fillStyle = '#bbf7d0';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('স্থান: খুলনা আলিয়া মাদ্রাসা', 128, 186);
    ctx.fillText('ময়দান · বাদ আসর', 128, 222);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 21px sans-serif';
    ctx.fillText('সকলেই আমন্ত্রিত', 128, 288);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText('আয়োজনে: খুলনা যুব সমাজ', 128, 340);
  } else if (kind === 5) {
    // ৬) ডেন্টাল কেয়ার
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 384);
    ctx.fillStyle = '#0d9488';
    ctx.fillRect(0, 0, 256, 86);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('ডেন্টাল কেয়ার', 128, 44);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('খুলনা আধুনিক দাঁতের চিকিৎসা', 128, 72);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 23px sans-serif';
    ctx.fillText('স্কেলিং · ফিলিং · রুট ক্যানেল', 128, 148);
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('ব্যথামুক্ত দাঁত তোলা হয়', 128, 198);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText('তালতলা মোড় · বিকাল ৪টা-৯টা', 128, 256);
    ctx.fillStyle = '#0d9488';
    ctx.fillRect(24, 296, 208, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('সিরিয়াল: 017XX-XXXX', 128, 333);
  } else if (kind === 6) {
    // ৭) এসি ও ফ্রিজ মেরামত
    ctx.fillStyle = '#fef2f2';
    ctx.fillRect(0, 0, 256, 384);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, 256, 86);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('এসি ও ফ্রিজ মেরামত', 128, 44);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('হোম সার্ভিস · ২৪ ঘণ্টা', 128, 72);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 25px sans-serif';
    ctx.fillText('গ্যাস চার্জ ও সার্ভিসিং', 128, 148);
    ctx.fillStyle = '#1d4ed8';
    ctx.font = 'bold 21px sans-serif';
    ctx.fillText('বাসায় গিয়ে কাজ করা হয়', 128, 198);
    ctx.fillText('কম খরচে গ্যারান্টিসহ', 128, 238);
    ctx.fillStyle = '#111827';
    ctx.fillRect(20, 286, 216, 68);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('কল: 019XX-XXXXXX', 128, 326);
  } else {
    // ৮) জরুরি নিয়োগ
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 256, 384);
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 240, 368);
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(18, 20, 220, 66);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('জরুরি নিয়োগ!', 128, 62);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 23px sans-serif';
    ctx.fillText('ডেলিভারি ম্যান ও অফিস', 128, 138);
    ctx.fillText('সহকারী আবশ্যক', 128, 174);
    ctx.fillStyle = '#15803d';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('বেতন: ১২,০০০ - ১৮,০০০/-', 128, 234);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText('শিববাড়ী মোড়, খুলনা', 128, 288);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 19px monospace';
    ctx.fillText('018XX-XXXXXX', 128, 340);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const POSTER_KIND_COUNT = 8;
const NETA_POSTER_SPECS = [
  { url: './assets/neta/neta_boat.jpg', aspect: 1160 / 1355 },   // Z X হুজ্জা
  { url: './assets/neta/neta_scales.jpg', aspect: 1160 / 1355 }, // সাবিদ ফালা
  { url: './assets/neta/neta_paddy.jpg', aspect: 941 / 1672 },   // পি.টি.আই রাফিন
];

let sharedPropsAssets = null;
function getSharedPropsAssets() {
  if (sharedPropsAssets) return sharedPropsAssets;
  const texLoader = new THREE.TextureLoader();
  const posterMats = Array.from({ length: POSTER_KIND_COUNT }, (_, k) => new THREE.MeshLambertMaterial({
    map: createPolePosterTexture(k),
    side: THREE.DoubleSide,
  }));
  const netaMats = NETA_POSTER_SPECS.map((spec) => {
    const tex = texLoader.load(spec.url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.DoubleSide,
    });
  });
  sharedPropsAssets = {
    posterMats,
    netaMats,
    poleMat: new THREE.MeshStandardMaterial({ color: 0x7a8086, roughness: 0.85, metalness: 0.16 }),
    steelMat: new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.55, metalness: 0.65 }),
    lampGlowMat: new THREE.MeshStandardMaterial({
      color: 0xfff4d4,
      emissive: 0xffd180,
      emissiveIntensity: 0.35,
      roughness: 0.25,
    }),
    coilMat: new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.78, metalness: 0.12 }),
    wireMat: new THREE.LineBasicMaterial({ color: 0x14171d, transparent: true, opacity: 0.90 }),
  };
  return sharedPropsAssets;
}

function hashRand(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Mounts a crisp, high-resolution 4-corner framed poster of one of the 3 leaders
 * directly on any building or compound wall (preserving exact aspect ratio so faces & text are crystal clear!).
 */
export function addBigNetaWallPoster(parent, netaIdx, x, y, z, rotY = 0, height = 2.45) {
  const assets = getSharedPropsAssets();
  const idx = ((netaIdx % 3) + 3) % 3;
  const aspect = NETA_POSTER_SPECS[idx].aspect;
  const w = height * aspect;
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  grp.rotation.y = rotY;

  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, height + 0.08, 0.028), assets.steelMat);
  frame.position.z = -0.016;
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(w, height), assets.netaMats[idx]);
  poster.position.z = 0.002;
  grp.add(frame, poster);
  parent.add(grp);
  return grp;
}

/**
 * Decorates corridor utility poles:
 * - Sparse small Bengali stickers ONLY on ~50% of poles (some poles have 0, some 1, some 2)
 * - High-resolution 4-corner leader posters mounted at the LOWER BASE of select poles (খাম্বার গোড়ায়!)
 * - Dense hanging round black ISP/dish wire coils (3-4 per pole)
 * - NO overhead text banners on top of poles!
 */
export function decorateCorridorPole(parent, x, z, facingYaw = 0, seed = 0, poleRadius = 0.19) {
  const assets = getSharedPropsAssets();
  const grp = new THREE.Group();
  grp.position.set(x, 0, z);
  grp.rotation.y = facingYaw;

  const sAbs = Math.abs(seed) + 17;

  // 1. Mount Leader Poster SPARSELY (~22% of corridor poles, spaced far apart — never on every pole!)
  const netaRoll = hashRand(sAbs * 5.9 + 1.7);
  if (netaRoll < 0.22) {
    const nIdx = Math.abs(seed) % 3;
    const spec = NETA_POSTER_SPECS[nIdx];
    const pH = nIdx === 2 ? 1.32 : 1.22;
    const pW = pH * spec.aspect;
    const pY = 1.68;
    const pxOff = poleRadius + 0.07;

    const board = new THREE.Mesh(new THREE.PlaneGeometry(pW, pH), assets.netaMats[nIdx]);
    board.position.set(pxOff, pY, 0);
    board.rotation.y = Math.PI * 0.5;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.032, pH + 0.07, pW + 0.07), assets.steelMat);
    frame.position.set(pxOff - 0.02, pY, 0);
    grp.add(frame, board);
  }

  // 2. Only occasional poles (~22%) also have 1 small Bengali sticker (rest stay clean!)
  const roll = hashRand(sAbs * 3.7);
  if (roll < 0.22) {
    const sleeveGeo = new THREE.CylinderGeometry(poleRadius + 0.008, poleRadius + 0.014, 0.72, 10, 1, true);
    const kIdx = Math.floor(hashRand(sAbs * 19.3) * POSTER_KIND_COUNT) % POSTER_KIND_COUNT;
    const pm = new THREE.Mesh(sleeveGeo, assets.posterMats[kIdx]);
    pm.position.y = 3.15;
    pm.rotation.y = hashRand(sAbs * 5) * Math.PI * 2;
    grp.add(pm);
  }

  // 3. Dense Bangladeshi round black ISP/dish wire coils hanging around mid-upper pole (3-4 coils per pole!)
  const coilGeo = new THREE.TorusGeometry(0.30, 0.055, 6, 12);
  const coilCount = hashRand(sAbs * 9.1) > 0.4 ? 4 : 3;
  for (let c = 0; c < coilCount; c++) {
    const r1 = hashRand(sAbs * 11.3 + c * 17.1);
    const r2 = hashRand(sAbs * 23.7 + c * 7.9);
    const coil = new THREE.Mesh(coilGeo, assets.coilMat);
    const ang = r1 * Math.PI * 2;
    const cOff = Math.max(0.20, poleRadius + 0.06);
    coil.position.set(Math.cos(ang) * cOff, 4.25 + c * 0.34 + (r2 - 0.5) * 0.14, Math.sin(ang) * cOff);
    coil.rotation.set((r1 - 0.5) * 0.7, ang + 0.6, (r2 - 0.5) * 0.6);
    coil.scale.setScalar(0.86 + r2 * 0.44);
    grp.add(coil);
  }

  parent.add(grp);
}

/**
 * Builds an ultra-lightweight, chunk-streamed, GPU-instanced Khulna citywide streetscape:
 * - Clearly distinct THICK concrete utility poles vs SLIM steel poles
 * - Super messy pole-to-pole tangled overhead wire webs + dense hanging round wire coils + house service drop wires
 * - Sparse, varied Bengali pole stickers (half the poles stay clean — never repetitive!)
 * - Crisp high-res 4-corner leader posters at the LOWER BASE of select poles (NO overhead text banners!)
 */
export function createKhulnaStreetPropsSystem(scene, worldData, shaderUniforms = null) {
  const assets = getSharedPropsAssets();
  if (shaderUniforms && !assets.wireMat.userData.wireWindUniforms) {
    applyWireWindShader(assets.wireMat, shaderUniforms, { usePinAttr: true });
  }
  const group = new THREE.Group();
  group.name = 'KhulnaStreetPropsAndWires';
  scene.add(group);

  const chunkSize = worldData.meta?.chunkSize || 240;
  const polesByChunk = new Map();
  const allPoles = [];

  // Precompute all road segments (with generous roadside clearance) so NO pole ever spawns inside ANY road or intersection!
  const roadSegs = [];
  for (let rIdx = 0; rIdx < worldData.roads.length; rIdx++) {
    const r = worldData.roads[rIdx];
    if (!r.p || r.p.length < 4) continue;
    if (r.n === 'Alia Madrasah Approach Road') continue;
    const rw = (r.w || 6.0) * 0.5 + 0.95;
    const pts = r.p;
    for (let i = 0; i < pts.length - 2; i += 2) {
      const ax = pts[i], az = pts[i + 1], bx = pts[i + 2], bz = pts[i + 3];
      roadSegs.push({
        ax, az, bx, bz, rw,
        minX: Math.min(ax, bx) - rw, maxX: Math.max(ax, bx) + rw,
        minZ: Math.min(az, bz) - rw, maxZ: Math.max(az, bz) + rw,
      });
    }
  }
  const tOx = TALTOLA_HOUSE_OFFSET.x;
  const tOz = TALTOLA_HOUSE_OFFSET.z;
  for (const [ax, az, bx, bz, rw] of [
    // Taltola House street + straight north connector to Khan Jahan Ali Rd
    [tOx, 150.0, tOx, tOz + 60.0, 4.6],
    [tOx, tOz + 38.2, tOx - 26.0, tOz + 36.8, 4.2],
    // Haji Mohsin north/south corridor
    [0, -40, 21.5, -142, 4.6],
    [0, 40, -15.2, 140, 4.6],
    // Altapole Lane + East Side Lane
    [166, -519, 157, -296, 4.4],
    [169, -404, 209, -404, 4.0],
    // Hadis Park & Stadium perimeter roads
    [-384, -831, -176, -825, 5.2],
    [-261, -831, -261, -967, 5.0],
    [-384, -967, -261, -967, 4.8],
    [-384, -967, -384, -831, 4.8],
    [-165, -515, 166, -519, 5.4],
  ]) {
    roadSegs.push({
      ax, az, bx, bz, rw,
      minX: Math.min(ax, bx) - rw, maxX: Math.max(ax, bx) + rw,
      minZ: Math.min(az, bz) - rw, maxZ: Math.max(az, bz) + rw,
    });
  }

  function isInsideAnyRoad(px, pz) {
    for (let i = 0; i < roadSegs.length; i++) {
      const s = roadSegs[i];
      if (px < s.minX || px > s.maxX || pz < s.minZ || pz > s.maxZ) continue;
      const vx = s.bx - s.ax, vz = s.bz - s.az;
      const l2 = vx * vx + vz * vz;
      const t = l2 > 1e-6 ? Math.max(0, Math.min(1, ((px - s.ax) * vx + (pz - s.az) * vz) / l2)) : 0;
      const cx = s.ax + vx * t, cz = s.az + vz * t;
      const dx = px - cx, dz = pz - cz;
      if (dx * dx + dz * dz < s.rw * s.rw) return true;
    }
    return false;
  }

  let poleSerial = 0;
  for (let rIdx = 0; rIdx < worldData.roads.length; rIdx++) {
    const r = worldData.roads[rIdx];
    const pts = r.p;
    if (!pts || pts.length < 4) continue;
    if (r.n === 'Alia Madrasah Approach Road') continue;
    const step = r.t <= 2 ? 32 : (r.t === 3 ? 38 : 48);
    const halfW = (r.w || 6.0) * 0.5 + 1.35;
    let carry = (rIdx * 11) % step;

    for (let i = 0; i < pts.length - 2; i += 2) {
      const x0 = pts[i], z0 = pts[i + 1];
      const x1 = pts[i + 2], z1 = pts[i + 3];
      const dx = x1 - x0, dz = z1 - z0;
      const segLen = Math.hypot(dx, dz);
      if (segLen < 8) continue;
      const nx = -dz / segLen;
      const nz = dx / segLen;
      const yaw = Math.atan2(dx, dz);

      let d = carry;
      let prevInRoad = null;
      while (d <= segLen) {
        const t = d / segLen;
        const side = (poleSerial % 2 === 0 || r.t <= 2) ? 1 : -1;
        const px = x0 + dx * t + nx * halfW * side;
        const pz = z0 + dz * t + nz * halfW * side;

        const nearHaji = Math.abs(px) < 34 && Math.abs(pz) < 142;
        const nearTaltola = Math.abs(px - tOx) < 38 && Math.abs(pz - tOz) < 62;
        const inAliaCampus = px > 124 && px < 264 && pz > 46 && pz < 246;
        const inAltapole = px > 152 && px < 214 && pz > -525 && pz < -290;
        const nearMajorJunction = (
          ((px + 716.8) ** 2 + (pz + 291.8) ** 2 < 46 * 46) // Royal More
          || ((px + 920.0) ** 2 + (pz + 292.0) ** 2 < 46 * 46) // Satrasta More
          || ((px + 304.3) ** 2 + (pz + 56.7) ** 2 < 46 * 46) // PTI More
        );
        if (!nearHaji && !nearTaltola && !inAliaCampus && !inAltapole && !nearMajorJunction && !isInsideAnyRoad(px, pz)) {
          const cx = Math.floor(px / chunkSize);
          const cz = Math.floor(pz / chunkSize);
          const key = `${cx},${cz}`;
          const pole = {
            id: poleSerial++,
            x: px,
            z: pz,
            yaw,
            side,
            nx,
            nz,
            roadType: r.t,
            prevId: prevInRoad,
          };
          prevInRoad = pole.id;
          allPoles.push(pole);
          if (!polesByChunk.has(key)) polesByChunk.set(key, []);
          polesByChunk.get(key).push(pole);
        } else {
          prevInRoad = null;
        }
        d += step;
      }
      carry = d - segLen;
    }
  }

  const MAX_POLES = 560;
  // Base cylinder scaled from 0.42x (slim steel pole) to 1.85x (thick heavy concrete pole)!
  const poleGeo = new THREE.CylinderGeometry(0.145, 0.21, 8.4, 8);
  poleGeo.translate(0, 4.2, 0);
  const poleInst = new THREE.InstancedMesh(poleGeo, assets.poleMat, MAX_POLES);
  poleInst.frustumCulled = false;

  const armGeo = new THREE.BoxGeometry(1.45, 0.08, 0.08);
  const armInst = new THREE.InstancedMesh(armGeo, assets.steelMat, MAX_POLES);
  armInst.frustumCulled = false;

  const lampGeo = new THREE.BoxGeometry(0.55, 0.09, 0.24);
  const lampInst = new THREE.InstancedMesh(lampGeo, assets.lampGlowMat, MAX_POLES);
  lampInst.frustumCulled = false;

  const coilGeo = new THREE.TorusGeometry(0.30, 0.055, 5, 10);
  const coilInst = new THREE.InstancedMesh(coilGeo, assets.coilMat, MAX_POLES * 4);
  coilInst.frustumCulled = false;

  const posterGeo = new THREE.CylinderGeometry(0.195, 0.205, 0.72, 8, 1, true);
  const posterInsts = assets.posterMats.map((m) => {
    const im = new THREE.InstancedMesh(posterGeo, m, 180);
    im.frustumCulled = false;
    return im;
  });

  // High-res 4-corner leader posters mounted at the LOWER BASE of select poles (খাম্বার গোড়ায়!)
  const baseNetaInsts = assets.netaMats.map((m, idx) => {
    const h = idx === 2 ? 1.48 : 1.32;
    const w = h * NETA_POSTER_SPECS[idx].aspect;
    const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(w, h), m, 220);
    im.frustumCulled = false;
    return im;
  });

  const wireGeom = new THREE.BufferGeometry();
  const wireLines = new THREE.LineSegments(wireGeom, assets.wireMat);
  wireLines.frustumCulled = false;

  group.add(poleInst, armInst, lampInst, coilInst, ...posterInsts, ...baseNetaInsts, wireLines);

  const dummy = new THREE.Object3D();
  const swayEuler = new THREE.Euler(0, 0, 0, 'XZY');
  const swayQuat = new THREE.Quaternion();
  const baseYawQuat = new THREE.Quaternion();
  const armYawQuat = new THREE.Quaternion();
  const tmpOffset = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);
  let lastChunkKey = '';
  let activePoleRecords = [];
  const swayingPoles = new Set();
  const poleStateById = new Map();

  function addCatenaryWire(buf, pinBuf, x0, y0, z0, x1, y1, z1, sag, segs = 4, swayX = 0, swayZ = 0) {
    for (let s = 0; s < segs; s++) {
      const t0 = s / segs;
      const t1 = (s + 1) / segs;
      const sag0 = 4 * t0 * (1 - t0) * sag;
      const sag1 = 4 * t1 * (1 - t1) * sag;
      const sw0 = Math.sin(t0 * Math.PI);
      const sw1 = Math.sin(t1 * Math.PI);
      buf.push(
        x0 + (x1 - x0) * t0 + swayX * sw0, y0 + (y1 - y0) * t0 - sag0, z0 + (z1 - z0) * t0 + swayZ * sw0,
        x0 + (x1 - x0) * t1 + swayX * sw1, y0 + (y1 - y0) * t1 - sag1, z0 + (z1 - z0) * t1 + swayZ * sw1,
      );
      // 0.0 at pole attachment points, 1.0 at mid-span sag so wind sway stays anchored to poles!
      pinBuf.push(sw0, sw1);
    }
  }

  function refreshActiveChunks(px, pz, quality = 'high') {
    const cx = Math.floor(px / chunkSize);
    const cz = Math.floor(pz / chunkSize);
    const rad = 1;
    const maxR = (quality === 'low' || quality === 'medium') ? 240 : 290;
    const key = `${cx},${cz},${maxR}`;
    if (key === lastChunkKey) return;
    lastChunkKey = key;

    const activePoles = [];
    for (let dx = -rad; dx <= rad; dx++) {
      for (let dz = -rad; dz <= rad; dz++) {
        const ck = `${cx + dx},${cz + dz}`;
        const plist = polesByChunk.get(ck);
        if (plist) {
          for (let i = 0; i < plist.length; i++) {
            const p = plist[i];
            const distSq = (p.x - px) ** 2 + (p.z - pz) ** 2;
            if (distSq <= maxR * maxR) activePoles.push(p);
          }
        }
      }
    }

    const activeById = new Map();
    activePoleRecords = [];
    swayingPoles.clear();
    let pCnt = 0;
    let coilCnt = 0;
    const postCnts = new Array(POSTER_KIND_COUNT).fill(0);
    const netaCnts = [0, 0, 0];
    const placedNetaSpots = []; // Enforce wide >=115m spacing between election posters!
    const posterHeights = [1.60, 2.48];

    for (let i = 0; i < activePoles.length && pCnt < MAX_POLES; i++) {
      const p = activePoles[i];
      activeById.set(p.id, p);

      // Dramatic, unmistakable thick vs slim poles: slim steel (0.42x), medium (1.05x), thick heavy concrete (1.85x)!
      const thickRoll = hashRand(p.id * 11.7 + 2.3);
      const poleScaleXZ = thickRoll < 0.40 ? 0.42 : (thickRoll < 0.62 ? 1.05 : 1.85);
      let st = poleStateById.get(p.id);
      if (!st) {
        st = { swayX: 0, swayZ: 0, velX: 0, velZ: 0 };
        poleStateById.set(p.id, st);
      }
      const rec = {
        pole: p,
        instIdx: pCnt,
        poleScaleXZ,
        radius: Math.max(0.24, 0.21 * poleScaleXZ),
        st,
      };
      activePoleRecords.push(rec);
      if (Math.abs(st.swayX) > 1e-4 || Math.abs(st.swayZ) > 1e-4 || Math.abs(st.velX) > 1e-4 || Math.abs(st.velZ) > 1e-4) {
        swayingPoles.add(rec);
      }

      // 1. Utility Pole
      dummy.position.set(p.x, 0, p.z);
      dummy.rotation.set(0, p.yaw, 0);
      dummy.scale.set(poleScaleXZ, 1, poleScaleXZ);
      dummy.updateMatrix();
      poleInst.setMatrixAt(pCnt, dummy.matrix);

      // 2. Top Cross-arm
      dummy.position.set(p.x, 7.35, p.z);
      dummy.rotation.set(0, p.yaw + Math.PI * 0.5, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      armInst.setMatrixAt(pCnt, dummy.matrix);

      // 3. Streetlamp cobra head
      dummy.position.set(p.x - p.nx * p.side * 0.85, 8.05, p.z - p.nz * p.side * 0.85);
      dummy.rotation.set(0, p.yaw, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      lampInst.setMatrixAt(pCnt, dummy.matrix);

      // 4. 3 to 4 messy round black ISP/dish wire coils per pole
      const cNum = hashRand(p.id * 9.3) > 0.35 ? 4 : 3;
      for (let c = 0; c < cNum && coilCnt < MAX_POLES * 4; c++) {
        const r1 = hashRand(p.id * 13.7 + c * 17.3);
        const r2 = hashRand(p.id * 29.1 + c * 11.9);
        const ang = r1 * Math.PI * 2;
        const cRad = 0.22 * Math.max(0.85, poleScaleXZ);
        dummy.position.set(
          p.x + Math.cos(ang) * cRad,
          4.25 + c * 0.34 + (r2 - 0.5) * 0.14,
          p.z + Math.sin(ang) * cRad,
        );
        dummy.rotation.set((r1 - 0.5) * 0.7, p.yaw + ang, (r2 - 0.5) * 0.6);
        const sc = 0.85 + r2 * 0.45;
        dummy.scale.set(sc, sc, sc);
        dummy.updateMatrix();
        coilInst.setMatrixAt(coilCnt++, dummy.matrix);
      }
      pCnt++;

      // 5. Very sparse Election Posters (<=16% of poles AND guaranteed >=115m apart!), small stickers on ~20%, rest CLEAN!
      const styleRoll = hashRand(p.id * 4.3 + 1.9);
      let farEnoughFromNeta = true;
      if (styleRoll < 0.16) {
        for (let ni = 0; ni < placedNetaSpots.length; ni++) {
          const dxN = p.x - placedNetaSpots[ni][0];
          const dzN = p.z - placedNetaSpots[ni][1];
          if (dxN * dxN + dzN * dzN < 115 * 115) { farEnoughFromNeta = false; break; }
        }
      }
      if (styleRoll < 0.16 && farEnoughFromNeta) {
        const nk = Math.floor(hashRand(p.id * 11.3) * 3) % 3;
        if (netaCnts[nk] < 220) {
          const offsetOut = 0.20 * poleScaleXZ + 0.08;
          dummy.position.set(p.x - p.nx * p.side * offsetOut, 1.62, p.z - p.nz * p.side * offsetOut);
          dummy.rotation.set(0, p.yaw + (p.side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5), 0);
          dummy.scale.set(0.88, 0.88, 0.88);
          dummy.updateMatrix();
          baseNetaInsts[nk].setMatrixAt(netaCnts[nk]++, dummy.matrix);
          placedNetaSpots.push([p.x, p.z]);
        }
      } else if (styleRoll >= 0.16 && styleRoll < 0.36) {
        const numPosters = styleRoll < 0.50 ? 1 : 2;
        for (let pi = 0; pi < numPosters; pi++) {
          const pk = Math.floor(hashRand(p.id * 17.9 + pi * 37.3) * POSTER_KIND_COUNT) % POSTER_KIND_COUNT;
          if (postCnts[pk] < 180) {
            dummy.position.set(p.x, posterHeights[pi] + (hashRand(p.id + pi * 5) - 0.5) * 0.14, p.z);
            dummy.rotation.set(0, p.yaw + hashRand(p.id * 7 + pi * 19) * Math.PI * 2, 0);
            dummy.scale.set(poleScaleXZ, 1, poleScaleXZ);
            dummy.updateMatrix();
            posterInsts[pk].setMatrixAt(postCnts[pk]++, dummy.matrix);
          }
        }
      }
    }

    poleInst.count = pCnt;
    armInst.count = pCnt;
    lampInst.count = pCnt;
    coilInst.count = coilCnt;
    poleInst.instanceMatrix.needsUpdate = true;
    armInst.instanceMatrix.needsUpdate = true;
    lampInst.instanceMatrix.needsUpdate = true;
    coilInst.instanceMatrix.needsUpdate = true;
    for (let k = 0; k < POSTER_KIND_COUNT; k++) {
      posterInsts[k].count = postCnts[k];
      posterInsts[k].instanceMatrix.needsUpdate = true;
    }
    for (let k = 0; k < 3; k++) {
      baseNetaInsts[k].count = netaCnts[k];
      baseNetaInsts[k].instanceMatrix.needsUpdate = true;
    }

    // Build SUPER MESSY Bangladeshi Khulna pole-to-pole tangled overhead wires + house service drops!
    const wireVerts = [];
    const wirePins = [];
    const wireStrands = quality === 'low' ? 8 : 11;
    const dropCount = quality === 'low' ? 4 : 5;

    for (let i = 0; i < activePoles.length && i < MAX_POLES; i++) {
      const p = activePoles[i];

      if (p.prevId !== null) {
        const prev = activeById.get(p.prevId);
        if (prev) {
          const dist = Math.hypot(p.x - prev.x, p.z - prev.z);
          if (dist > 6 && dist < 58) {
            for (let s = 0; s < wireStrands; s++) {
              const r1 = hashRand(p.id * 31 + s * 7.3);
              const r2 = hashRand(p.id * 47 + s * 11.1);
              const r3 = hashRand(p.id * 19 + s * 13.7);
              const latA = s < 3 ? (s - 1) * 0.54 : (r1 - 0.5) * 1.05;
              const latB = s < 3 ? (s - 1) * 0.54 : (r2 - 0.5) * 1.05;
              const yA = s < 3 ? (7.28 + r1 * 0.14) : (4.20 + r1 * 1.75);
              const yB = s < 3 ? (7.28 + r2 * 0.14) : (4.20 + r2 * 1.75);
              const sag = s < 3 ? (0.45 + r3 * 0.30) : (0.76 + r3 * 1.32);
              const swayX = (r1 - 0.5) * 0.52;
              const swayZ = (r2 - 0.5) * 0.52;
              addCatenaryWire(
                wireVerts,
                wirePins,
                prev.x + prev.nx * latA, yA, prev.z + prev.nz * latA,
                p.x + p.nx * latB, yB, p.z + p.nz * latB,
                sag,
                4,
                swayX,
                swayZ,
              );
            }
          }
        }
      }

      for (let d = 0; d < dropCount; d++) {
        const rd1 = hashRand(p.id * 71 + d * 17.3);
        const rd2 = hashRand(p.id * 89 + d * 23.1);
        const rd3 = hashRand(p.id * 53 + d * 29.7);
        const dirSide = d < 4 ? p.side : -p.side;
        const reach = (d < 4 ? 6.5 : 11.5) + rd1 * 9.0;
        const alongOffset = (rd2 - 0.5) * 13.0;
        const tx = Math.sin(p.yaw);
        const tz = Math.cos(p.yaw);
        const endX = p.x + p.nx * dirSide * reach + tx * alongOffset;
        const endZ = p.z + p.nz * dirSide * reach + tz * alongOffset;
        const startY = 4.30 + rd1 * 1.85;
        const endY = 3.2 + rd3 * 5.6;
        const dropSag = 0.44 + rd2 * 1.05;
        addCatenaryWire(
          wireVerts,
          wirePins,
          p.x + (rd1 - 0.5) * 0.28, startY, p.z + (rd2 - 0.5) * 0.28,
          endX, endY, endZ,
          dropSag,
          4,
        );
      }
    }

    wireGeom.setAttribute('position', new THREE.Float32BufferAttribute(wireVerts, 3));
    wireGeom.setAttribute('aWirePin', new THREE.Float32BufferAttribute(wirePins, 1));
    wireGeom.computeBoundingSphere();
  }

  function writeSwayingPoleMatrices(rec) {
    const p = rec.pole;
    const { swayX, swayZ } = rec.st;
    swayEuler.set(swayX, 0, swayZ, 'XZY');
    swayQuat.setFromEuler(swayEuler);
    baseYawQuat.setFromAxisAngle(yAxis, p.yaw);
    armYawQuat.setFromAxisAngle(yAxis, p.yaw + Math.PI * 0.5);

    // 1. Utility Pole pivoted cleanly at ground base (y=0)
    dummy.position.set(p.x, 0, p.z);
    dummy.quaternion.copy(swayQuat).multiply(baseYawQuat);
    dummy.scale.set(rec.poleScaleXZ, 1, rec.poleScaleXZ);
    dummy.updateMatrix();
    poleInst.setMatrixAt(rec.instIdx, dummy.matrix);

    // 2. Top Cross-arm follows tilted pole top
    tmpOffset.set(0, 7.35, 0).applyQuaternion(swayQuat);
    dummy.position.set(p.x + tmpOffset.x, tmpOffset.y, p.z + tmpOffset.z);
    dummy.quaternion.copy(swayQuat).multiply(armYawQuat);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    armInst.setMatrixAt(rec.instIdx, dummy.matrix);

    // 3. Streetlamp cobra head follows tilted pole top
    tmpOffset.set(-p.nx * p.side * 0.85, 8.05, -p.nz * p.side * 0.85).applyQuaternion(swayQuat);
    dummy.position.set(p.x + tmpOffset.x, tmpOffset.y, p.z + tmpOffset.z);
    dummy.quaternion.copy(swayQuat).multiply(baseYawQuat);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    lampInst.setMatrixAt(rec.instIdx, dummy.matrix);
  }

  function applyPoleCollisions(pos, radius = 0.34, { impactSpeed = 0, isVehicle = false, dirX = 0, dirZ = 0 } = {}) {
    if (!pos || !activePoleRecords.length) return null;
    let hitRec = null;
    for (let i = 0; i < activePoleRecords.length; i++) {
      const rec = activePoleRecords[i];
      const p = rec.pole;
      const minR = radius + rec.radius;
      const dx = pos.x - p.x;
      const dz = pos.z - p.z;
      if (Math.abs(dx) >= minR || Math.abs(dz) >= minR) continue;
      const dSq = dx * dx + dz * dz;
      if (dSq < minR * minR) {
        const d = Math.sqrt(Math.max(dSq, 1e-6));
        const nx = dx / d;
        const nz = dz / d;
        const overlap = minR - d;
        pos.x += nx * overlap;
        pos.z += nz * overlap;

        // Trigger spring-damped pole wobble ONLY on slim/small poles (poleScaleXZ <= 0.65)!
        // Thick heavy concrete poles stay 100% solid & rigid without swaying!
        if (rec.poleScaleXZ <= 0.65) {
          const pushX = (Math.abs(dirX) + Math.abs(dirZ) > 0.05) ? dirX : -nx;
          const pushZ = (Math.abs(dirX) + Math.abs(dirZ) > 0.05) ? dirZ : -nz;
          const pLen = Math.hypot(pushX, pushZ) || 1;
          const pxN = pushX / pLen;
          const pzN = pushZ / pLen;
          const strength = isVehicle
            ? THREE.MathUtils.clamp(0.75 + impactSpeed * 0.14, 0.75, 2.35)
            : THREE.MathUtils.clamp(0.32 + impactSpeed * 0.12, 0.32, 0.78);
          // Rotation around X tilts +Z; rotation around -Z tilts +X
          rec.st.velX = THREE.MathUtils.clamp(rec.st.velX + pzN * strength, -2.6, 2.6);
          rec.st.velZ = THREE.MathUtils.clamp(rec.st.velZ - pxN * strength, -2.6, 2.6);
          swayingPoles.add(rec);
        }
        hitRec = rec;
      }
    }
    return hitRec ? { hit: true, pole: hitRec.pole } : null;
  }

  function updatePoles(dt = 0.016) {
    if (swayingPoles.size === 0) return;
    const stepDt = Math.min(Math.max(dt, 0.001), 0.05);
    const stiffness = 34.0;
    const damping = 4.2;
    const maxTilt = 0.21; // ~12 degrees max realistic elastic pole sway
    const settled = [];
    for (const rec of swayingPoles) {
      const st = rec.st;
      const accX = -stiffness * st.swayX - damping * st.velX;
      const accZ = -stiffness * st.swayZ - damping * st.velZ;
      st.velX += accX * stepDt;
      st.velZ += accZ * stepDt;
      st.swayX = THREE.MathUtils.clamp(st.swayX + st.velX * stepDt, -maxTilt, maxTilt);
      st.swayZ = THREE.MathUtils.clamp(st.swayZ + st.velZ * stepDt, -maxTilt, maxTilt);
      if (Math.abs(st.swayX) < 0.0008 && Math.abs(st.swayZ) < 0.0008 && Math.abs(st.velX) < 0.004 && Math.abs(st.velZ) < 0.004) {
        st.swayX = 0;
        st.swayZ = 0;
        st.velX = 0;
        st.velZ = 0;
        settled.push(rec);
      }
      writeSwayingPoleMatrices(rec);
    }
    for (const rec of settled) swayingPoles.delete(rec);
    poleInst.instanceMatrix.needsUpdate = true;
    armInst.instanceMatrix.needsUpdate = true;
    lampInst.instanceMatrix.needsUpdate = true;
  }

  function setNightFactor(nightFactor = 0) {
    assets.lampGlowMat.emissiveIntensity = 0.28 + nightFactor * 2.6;
  }

  function setVisible(visible) {
    group.visible = Boolean(visible);
  }

  return {
    group,
    refreshActiveChunks,
    applyPoleCollisions,
    updatePoles,
    setNightFactor,
    setVisible,
  };
}
