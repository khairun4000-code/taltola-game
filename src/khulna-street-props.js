import * as THREE from 'three';

function createPolePosterTexture(kind) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 384;
  const ctx = c.getContext('2d');

  if (kind === 0) {
    // ব্যাচে পড়ানো হয় (Coaching / Batch Poster)
    ctx.fillStyle = '#fde047';
    ctx.fillRect(0, 0, 256, 384);
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(10, 10, 236, 72);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
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
    // ছাত্র চাই / টিউশন (Tuition Poster)
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(0, 0, 256, 384);
    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 240, 368);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(18, 22, 220, 68);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ছাত্র চাই', 128, 68);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('প্রাইভেট ও টিউশন', 128, 138);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('অভিজ্ঞ বিশ্ববিদ্যালয় শিক্ষক', 128, 184);
    ctx.fillText('সপ্তাহে ৫ দিন যত্নসহকারে', 128, 222);
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('খুলনা সদর এলাকা', 128, 286);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('যোগাযোগ: 019XX-XXXX', 128, 340);
  } else if (kind === 2) {
    // বাসা ভাড়া / বাসা চাই (To-Let Poster)
    ctx.fillStyle = '#fff7ed';
    ctx.fillRect(0, 0, 256, 384);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(0, 0, 256, 92);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
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
  } else {
    // নির্বাচনী পোস্টার (Classic Bangladeshi B&W Election Poster)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 256, 384);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 240, 368);
    ctx.fillStyle = '#111827';
    ctx.fillRect(16, 18, 224, 56);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('নির্বাচনী পোস্টার', 128, 54);
    // Stylized silhouette portrait
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(128, 134, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(128, 206, 56, 36, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('খুলনা সিটি নির্বাচন', 128, 256);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('আপনার মূল্যবান ভোট ও', 128, 296);
    ctx.fillText('দোয়া প্রার্থী', 128, 326);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(28, 340, 200, 26);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('প্রচারে: খুলনাবাসী', 128, 358);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createElectionBannerTexture(kind) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 224;
  const ctx = c.getContext('2d');

  if (kind === 0) {
    // নৌকা মার্কা (Boat Symbol Banner)
    const grd = ctx.createLinearGradient(0, 0, 512, 224);
    grd.addColorStop(0, '#065f46');
    grd.addColorStop(0.55, '#047857');
    grd.addColorStop(1, '#991b1b');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 512, 224);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 496, 208);

    // Draw crisp Boat (নৌকা) emblem on left
    ctx.save();
    ctx.translate(92, 122);
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(-64, 0);
    ctx.quadraticCurveTo(0, 46, 64, 0);
    ctx.lineTo(48, 26);
    ctx.quadraticCurveTo(0, 48, -48, 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-26, -2);
    ctx.quadraticCurveTo(0, -48, 28, -2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -44);
    ctx.lineTo(0, 8);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('নৌকা মার্কায় ভোট দিন', 324, 92);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('উন্নয়নের ধারাবাহিকতা রক্ষায় · খুলনা', 324, 146);
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText('প্রচারে: খুলনা মহানগর এলাকাবাসী', 324, 188);
  } else if (kind === 1) {
    // ধানের শীষ মার্কা (Sheaf of Paddy Banner)
    const grd = ctx.createLinearGradient(0, 0, 512, 224);
    grd.addColorStop(0, '#14532d');
    grd.addColorStop(0.5, '#166534');
    grd.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 512, 224);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 496, 208);

    // Draw crisp Sheaf of Paddy (ধানের শীষ) emblem
    ctx.save();
    ctx.translate(92, 118);
    ctx.strokeStyle = '#fde047';
    ctx.fillStyle = '#facc15';
    ctx.lineWidth = 4;
    for (const ang of [-0.36, -0.18, 0, 0.18, 0.36]) {
      ctx.save();
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(0, 44);
      ctx.lineTo(0, -52);
      ctx.stroke();
      for (let y = -48; y <= -4; y += 11) {
        ctx.beginPath();
        ctx.ellipse(-6, y, 5, 2.6, -0.5, 0, Math.PI * 2);
        ctx.ellipse(6, y, 5, 2.6, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-16, 16, 32, 10);
    ctx.restore();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ধানের শীষ মার্কায় ভোট দিন', 324, 92);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 25px sans-serif';
    ctx.fillText('গণতন্ত্র ও উন্নয়নের প্রতীক · খুলনা', 324, 146);
    ctx.fillStyle = '#bbf7d0';
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText('প্রচারে: খুলনা সদর ও সোনাডাঙ্গা', 324, 188);
  } else {
    // দাঁড়িপাল্লা মার্কা (Balance Scales Banner)
    const grd = ctx.createLinearGradient(0, 0, 512, 224);
    grd.addColorStop(0, '#0f172a');
    grd.addColorStop(0.5, '#1e3a8a');
    grd.addColorStop(1, '#065f46');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 512, 224);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 496, 208);

    // Draw crisp Balance Scales (দাঁড়িপাল্লা) emblem
    ctx.save();
    ctx.translate(92, 118);
    ctx.strokeStyle = '#fde047';
    ctx.fillStyle = '#fde047';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -48);
    ctx.lineTo(0, 44);
    ctx.moveTo(-26, 44);
    ctx.lineTo(26, 44);
    ctx.moveTo(-48, -28);
    ctx.lineTo(48, -28);
    ctx.stroke();
    ctx.lineWidth = 2.5;
    for (const sx of [-44, 44]) {
      ctx.beginPath();
      ctx.moveTo(sx, -28);
      ctx.lineTo(sx - 16, 12);
      ctx.moveTo(sx, -28);
      ctx.lineTo(sx + 16, 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx, 12, 17, 0, Math.PI);
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('দাঁড়িপাল্লা মার্কায় ভোট দিন', 324, 92);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 25px sans-serif';
    ctx.fillText('ন্যায় ও ইনসাফের প্রতীক · খুলনা', 324, 146);
    ctx.fillStyle = '#bae6fd';
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText('প্রচারে: খুলনা মহানগরবাসী', 324, 188);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let sharedPropsAssets = null;
function getSharedPropsAssets() {
  if (sharedPropsAssets) return sharedPropsAssets;
  const posterMats = [0, 1, 2, 3].map((k) => new THREE.MeshLambertMaterial({
    map: createPolePosterTexture(k),
    side: THREE.DoubleSide,
  }));
  const bannerMats = [0, 1, 2].map((k) => new THREE.MeshLambertMaterial({
    map: createElectionBannerTexture(k),
    side: THREE.DoubleSide,
  }));
  sharedPropsAssets = {
    posterMats,
    bannerMats,
    poleMat: new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.85, metalness: 0.18 }),
    steelMat: new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.55, metalness: 0.65 }),
    lampGlowMat: new THREE.MeshStandardMaterial({
      color: 0xfff4d4,
      emissive: 0xffd180,
      emissiveIntensity: 0.35,
      roughness: 0.25,
    }),
    coilMat: new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.78, metalness: 0.12 }),
    wireMat: new THREE.LineBasicMaterial({ color: 0x15181e, transparent: true, opacity: 0.86 }),
  };
  return sharedPropsAssets;
}

/**
 * Adds authentic Bangladeshi pole posters, coiled black ISP wires & high election banner
 * to an existing corridor utility pole (Haji Mohsin Rd, Taltola House street, etc.).
 */
export function decorateCorridorPole(parent, x, z, facingYaw = 0, seed = 0) {
  const assets = getSharedPropsAssets();
  const grp = new THREE.Group();
  grp.position.set(x, 0, z);
  grp.rotation.y = facingYaw;

  // 2 Posters wrapped around the pole at readable heights
  const p1Idx = Math.abs(seed) % 4;
  const p2Idx = Math.abs(seed + 2) % 4;
  const sleeveGeo = new THREE.CylinderGeometry(0.145, 0.152, 0.78, 10, 1, true);
  const p1 = new THREE.Mesh(sleeveGeo, assets.posterMats[p1Idx]);
  p1.position.y = 2.05;
  grp.add(p1);

  const p2 = new THREE.Mesh(sleeveGeo, assets.posterMats[p2Idx]);
  p2.position.y = 2.95;
  p2.rotation.y = Math.PI * 0.65;
  grp.add(p2);

  // Coiled black telecom / ISP wire tangle hanging at y = 4.65m
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.048, 6, 12), assets.coilMat);
  coil.position.set(0.16, 4.65, 0);
  coil.rotation.y = 0.4;
  grp.add(coil);

  // High overhead election banner mounted near pole top (y = 5.55m)
  const bIdx = Math.abs(seed) % 3;
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 1.02), assets.bannerMats[bIdx]);
  banner.position.set(1.22, 5.55, 0);
  grp.add(banner);

  // Thin steel mounting bar for the banner
  const bar = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.045, 0.045), assets.steelMat);
  bar.position.set(1.22, 6.07, 0);
  grp.add(bar);

  parent.add(grp);
}

/**
 * Builds an ultra-lightweight, chunk-streamed, GPU-instanced Khulna citywide streetscape:
 * - Roadside utility poles (খাম্বা) & street lampposts
 * - Dense pole-to-pole tangled overhead wire webs (তারের জঞ্জাট)
 * - House service drop wires connecting poles directly into nearby buildings (বাসা-বাড়িতে তারের লাইন)
 * - Bengali pole posters (ব্যাচে পড়ানো হয়, ছাত্র চাই, বাসা ভাড়া/চাই, নির্বাচনী পোস্টার)
 * - High overhead election banners (নৌকা, ধানের শীষ, দাঁড়িপাল্লা)
 * Uses < 12 total draw calls across all active chunks so FPS stays locked at 60+!
 */
export function createKhulnaStreetPropsSystem(scene, worldData) {
  const assets = getSharedPropsAssets();
  const group = new THREE.Group();
  group.name = 'KhulnaStreetPropsAndWires';
  scene.add(group);

  const chunkSize = worldData.meta?.chunkSize || 240;
  const polesByChunk = new Map();
  const allPoles = [];

  // Sample roadside utility poles along Khulna roads (spaced ~30m on major/mid roads, ~38m on lanes)
  let poleSerial = 0;
  for (let rIdx = 0; rIdx < worldData.roads.length; rIdx++) {
    const r = worldData.roads[rIdx];
    const pts = r.p;
    if (!pts || pts.length < 4) continue;
    const step = r.t <= 2 ? 32 : (r.t === 3 ? 38 : 48);
    const halfW = (r.w || 6.0) * 0.5 + 0.95;
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

        // Keep clear of immediate Haji Mohsin Rd (0,0) & Taltola House (420,975) where corridor poles already exist
        const nearHaji = Math.abs(px) < 34 && Math.abs(pz) < 38;
        const nearTaltola = Math.abs(px - 420) < 26 && Math.abs(pz - 975) < 30;
        if (!nearHaji && !nearTaltola) {
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
  const poleGeo = new THREE.CylinderGeometry(0.095, 0.145, 8.2, 6);
  poleGeo.translate(0, 4.1, 0);
  const poleInst = new THREE.InstancedMesh(poleGeo, assets.poleMat, MAX_POLES);
  poleInst.frustumCulled = false;

  const armGeo = new THREE.BoxGeometry(1.45, 0.08, 0.08);
  const armInst = new THREE.InstancedMesh(armGeo, assets.steelMat, MAX_POLES);
  armInst.frustumCulled = false;

  const lampGeo = new THREE.BoxGeometry(0.55, 0.09, 0.24);
  const lampInst = new THREE.InstancedMesh(lampGeo, assets.lampGlowMat, MAX_POLES);
  lampInst.frustumCulled = false;

  const coilGeo = new THREE.TorusGeometry(0.26, 0.045, 5, 10);
  const coilInst = new THREE.InstancedMesh(coilGeo, assets.coilMat, MAX_POLES);
  coilInst.frustumCulled = false;

  const posterGeo = new THREE.CylinderGeometry(0.142, 0.148, 0.82, 8, 1, true);
  const posterInsts = assets.posterMats.map((m) => {
    const im = new THREE.InstancedMesh(posterGeo, m, 300);
    im.frustumCulled = false;
    return im;
  });

  const bannerGeo = new THREE.PlaneGeometry(2.55, 1.08);
  const bannerInsts = assets.bannerMats.map((m) => {
    const im = new THREE.InstancedMesh(bannerGeo, m, 220);
    im.frustumCulled = false;
    return im;
  });

  // Single merged LineSegments for ALL tangled pole-to-pole & house-drop overhead wires (1 draw call!)
  const wireGeom = new THREE.BufferGeometry();
  const wireLines = new THREE.LineSegments(wireGeom, assets.wireMat);
  wireLines.frustumCulled = false;

  group.add(poleInst, armInst, lampInst, coilInst, ...posterInsts, ...bannerInsts, wireLines);

  const dummy = new THREE.Object3D();
  let lastChunkKey = '';

  function addCatenaryWire(buf, x0, y0, z0, x1, y1, z1, sag, segs = 4) {
    for (let s = 0; s < segs; s++) {
      const t0 = s / segs;
      const t1 = (s + 1) / segs;
      const sag0 = 4 * t0 * (1 - t0) * sag;
      const sag1 = 4 * t1 * (1 - t1) * sag;
      buf.push(
        x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0 - sag0, z0 + (z1 - z0) * t0,
        x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1 - sag1, z0 + (z1 - z0) * t1,
      );
    }
  }

  function refreshActiveChunks(px, pz, quality = 'high') {
    const cx = Math.floor(px / chunkSize);
    const cz = Math.floor(pz / chunkSize);
    const rad = quality === 'low' ? 1 : (quality === 'medium' ? 1 : 2);
    const key = `${cx},${cz},${rad}`;
    if (key === lastChunkKey) return;
    lastChunkKey = key;

    const activePoles = [];
    const activeBuildings = [];
    for (let dx = -rad; dx <= rad; dx++) {
      for (let dz = -rad; dz <= rad; dz++) {
        const ck = `${cx + dx},${cz + dz}`;
        const plist = polesByChunk.get(ck);
        if (plist) {
          for (let i = 0; i < plist.length; i++) {
            const p = plist[i];
            const distSq = (p.x - px) ** 2 + (p.z - pz) ** 2;
            const maxR = rad === 1 ? 260 : 380;
            if (distSq <= maxR * maxR) activePoles.push(p);
          }
        }
        const blist = worldData.chunks[ck];
        if (blist) {
          for (let i = 0; i < blist.length; i++) activeBuildings.push(blist[i]);
        }
      }
    }

    const activeById = new Map();
    let pCnt = 0;
    const postCnts = [0, 0, 0, 0];
    const banCnts = [0, 0, 0];

    for (let i = 0; i < activePoles.length && pCnt < MAX_POLES; i++) {
      const p = activePoles[i];
      activeById.set(p.id, p);

      // 1. Utility Pole
      dummy.position.set(p.x, 0, p.z);
      dummy.rotation.set(0, p.yaw, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      poleInst.setMatrixAt(pCnt, dummy.matrix);

      // 2. Top Cross-arm
      dummy.position.set(p.x, 7.35, p.z);
      dummy.rotation.set(0, p.yaw + Math.PI * 0.5, 0);
      dummy.updateMatrix();
      armInst.setMatrixAt(pCnt, dummy.matrix);

      // 3. Streetlamp cobra head reaching slightly over road
      dummy.position.set(p.x - p.nx * p.side * 0.85, 8.05, p.z - p.nz * p.side * 0.85);
      dummy.rotation.set(0, p.yaw, 0);
      dummy.updateMatrix();
      lampInst.setMatrixAt(pCnt, dummy.matrix);

      // 4. Coiled black ISP/telecom wire bundle on pole
      dummy.position.set(p.x + p.nx * p.side * 0.16, 4.95, p.z + p.nz * p.side * 0.16);
      dummy.rotation.set(0.15, p.yaw + (p.id % 5) * 0.4, 0.1);
      dummy.updateMatrix();
      coilInst.setMatrixAt(pCnt, dummy.matrix);
      pCnt++;

      // 5. Pole Posters (2 per pole on alternating types: ব্যাচে পড়ানো হয়, ছাত্র চাই, বাসা চাই, নির্বাচনী পোস্টার)
      const k1 = p.id % 4;
      if (postCnts[k1] < 300) {
        dummy.position.set(p.x, 2.05, p.z);
        dummy.rotation.set(0, p.yaw + Math.PI * 0.5, 0);
        dummy.updateMatrix();
        posterInsts[k1].setMatrixAt(postCnts[k1]++, dummy.matrix);
      }
      const k2 = (p.id + 2) % 4;
      if (postCnts[k2] < 300) {
        dummy.position.set(p.x, 3.05, p.z);
        dummy.rotation.set(0, p.yaw - Math.PI * 0.4, 0);
        dummy.updateMatrix();
        posterInsts[k2].setMatrixAt(postCnts[k2]++, dummy.matrix);
      }

      // 6. High Overhead Election Banners (নৌকা, ধানের শীষ, দাঁড়িপাল্লা) mounted near top on every 2nd pole!
      if (p.id % 2 === 0) {
        const bk = (p.id >> 1) % 3;
        if (banCnts[bk] < 220) {
          dummy.position.set(p.x - p.nx * p.side * 1.32, 6.05, p.z - p.nz * p.side * 1.32);
          dummy.rotation.set(0, p.yaw + Math.PI * 0.5, 0);
          dummy.updateMatrix();
          bannerInsts[bk].setMatrixAt(banCnts[bk]++, dummy.matrix);
        }
      }
    }

    poleInst.count = pCnt;
    armInst.count = pCnt;
    lampInst.count = pCnt;
    coilInst.count = pCnt;
    poleInst.instanceMatrix.needsUpdate = true;
    armInst.instanceMatrix.needsUpdate = true;
    lampInst.instanceMatrix.needsUpdate = true;
    coilInst.instanceMatrix.needsUpdate = true;
    for (let k = 0; k < 4; k++) {
      posterInsts[k].count = postCnts[k];
      posterInsts[k].instanceMatrix.needsUpdate = true;
    }
    for (let k = 0; k < 3; k++) {
      bannerInsts[k].count = banCnts[k];
      bannerInsts[k].instanceMatrix.needsUpdate = true;
    }

    // Build tangled Dhaka/Khulna-style pole-to-pole overhead wire bundles + house service drop lines!
    const wireVerts = [];
    const wireStrands = quality === 'low' ? 3 : 6;
    for (let i = 0; i < activePoles.length && i < MAX_POLES; i++) {
      const p = activePoles[i];
      // A) Pole-to-pole tangled power + ISP cables (6 sagging strands at varied heights)
      if (p.prevId !== null) {
        const prev = activeById.get(p.prevId);
        if (prev) {
          const dist = Math.hypot(p.x - prev.x, p.z - prev.z);
          if (dist > 6 && dist < 56) {
            for (let s = 0; s < wireStrands; s++) {
              const lateral = ((s % 3) - 1) * 0.42;
              const yA = s < 3 ? 7.32 : (5.05 + (s - 3) * 0.24);
              const yB = s < 3 ? 7.32 : (4.95 + ((s + 1) % 3) * 0.24);
              const sag = s < 3 ? (0.45 + s * 0.12) : (0.85 + (s - 3) * 0.22);
              addCatenaryWire(
                wireVerts,
                prev.x + prev.nx * lateral, yA, prev.z + prev.nz * lateral,
                p.x + p.nx * lateral, yB, p.z + p.nz * lateral,
                sag,
                3,
              );
            }
          }
        }
      }

      // B) Service drop wires going directly from pole into 1-2 nearest houses (বাসা-বাড়িতে তারের লাইন!)
      let drops = 0;
      const maxDrops = quality === 'low' ? 1 : 2;
      for (let bIdx = 0; bIdx < activeBuildings.length && drops < maxDrops; bIdx += 2) {
        const b = activeBuildings[bIdx];
        const bdx = b[0] - p.x;
        const bdz = b[1] - p.z;
        const dSq = bdx * bdx + bdz * bdz;
        if (dSq > 36 && dSq < 26 * 26) {
          const bH = Math.min((b[5] || 2) * 3.05, 9.2);
          const attachY = Math.max(3.6, bH - 1.1);
          addCatenaryWire(
            wireVerts,
            p.x, 5.45 - drops * 0.35, p.z,
            b[0], attachY, b[1],
            0.55 + drops * 0.18,
            2,
          );
          drops++;
        }
      }
    }

    wireGeom.setAttribute('position', new THREE.Float32BufferAttribute(wireVerts, 3));
    wireGeom.computeBoundingSphere();
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
    setNightFactor,
    setVisible,
  };
}
