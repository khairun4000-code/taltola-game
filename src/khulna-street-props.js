import * as THREE from 'three';

function createPolePosterTexture(kind) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 384;
  const ctx = c.getContext('2d');
  ctx.textAlign = 'center';

  if (kind === 0) {
    // ১) ব্যাচে পড়ানো হয় (Coaching)
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
    // ২) ছাত্র চাই / টিউশন (Tuition)
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
    // ৩) বাসা ভাড়া / টু-লেট (To-Let)
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
    // ৪) সুপার ফাস্ট ব্রডব্যান্ড ওয়াই-ফাই (Broadband ISP!)
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
    // ৫) ওয়াজ মাহফিল / ইসলামী মহাসম্মেলন (Classic Green/Yellow BD Poster!)
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
    // ৬) ডেন্টাল ও ডাক্তার চেম্বার (Local Medical/Dental Poster)
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
    // ৭) ডিশ ও ক্যাবল টিভি / এসি সার্ভিসিং (AC & Dish Service)
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
    // ৮) জরুরি নিয়োগ / চাকরির বিজ্ঞপ্তি (Job Recruitment Poster)
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

function drawFunnyLeaderCaricature(ctx, cx, cy, r, variant) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  const bg = ctx.createRadialGradient(cx, cy - r * 0.2, r * 0.1, cx, cy, r);
  bg.addColorStop(0, variant === 0 ? '#fef08a' : (variant === 1 ? '#bbf7d0' : '#bae6fd'));
  bg.addColorStop(1, variant === 0 ? '#f59e0b' : (variant === 1 ? '#16a34a' : '#0284c7'));
  ctx.fillStyle = bg;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // Panjabi + vest shoulders
  ctx.fillStyle = variant === 0 ? '#f8fafc' : (variant === 1 ? '#fef3c7' : '#e2e8f0');
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.92, r * 0.78, r * 0.56, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.48, cy + r * 0.50);
  ctx.lineTo(cx - r * 0.14, cy + r * 0.54);
  ctx.lineTo(cx - r * 0.12, cy + r * 1.05);
  ctx.lineTo(cx - r * 0.75, cy + r * 1.05);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.48, cy + r * 0.50);
  ctx.lineTo(cx + r * 0.14, cy + r * 0.54);
  ctx.lineTo(cx + r * 0.12, cy + r * 1.05);
  ctx.lineTo(cx + r * 0.75, cy + r * 1.05);
  ctx.closePath();
  ctx.fill();

  // Marigold flower garland
  for (let i = -3; i <= 3; i++) {
    const a = (i / 3) * 0.85;
    const fx = cx + Math.sin(a) * r * 0.34;
    const fy = cy + r * 0.44 + Math.cos(a) * r * 0.28;
    ctx.fillStyle = i % 2 === 0 ? '#f97316' : '#facc15';
    ctx.beginPath();
    ctx.arc(fx, fy, r * 0.085, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#d99b72';
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.05, r * 0.38, r * 0.44, 0, 0, Math.PI * 2);
  ctx.fill();

  if (variant === 2) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.42, r * 0.35, r * 0.17, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - r * 0.35, cy - r * 0.42, r * 0.70, r * 0.12);
  } else {
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.14, r * 0.39, Math.PI * 1.08, Math.PI * 1.92);
    ctx.fill();
  }

  ctx.fillStyle = variant === 0 ? '#0f172a' : '#1e293b';
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 3;
  ctx.fillRect(cx - r * 0.30, cy - r * 0.16, r * 0.25, r * 0.15);
  ctx.fillRect(cx + r * 0.05, cy - r * 0.16, r * 0.25, r * 0.15);
  ctx.strokeRect(cx - r * 0.30, cy - r * 0.16, r * 0.25, r * 0.15);
  ctx.strokeRect(cx + r * 0.05, cy - r * 0.16, r * 0.25, r * 0.15);
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.05, cy - r * 0.10);
  ctx.lineTo(cx + r * 0.05, cy - r * 0.10);
  ctx.stroke();

  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.10, cy + r * 0.09, r * 0.13, r * 0.05, -0.15, 0, Math.PI * 2);
  ctx.ellipse(cx + r * 0.10, cy + r * 0.09, r * 0.13, r * 0.05, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.14, r * 0.14, 0.05 * Math.PI, 0.95 * Math.PI);
  ctx.fill();

  ctx.restore();
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawElectionSymbol(ctx, kind, cx, cy, scale = 1.0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  if (kind === 0) {
    // নৌকা মার্কা
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(-66, 0);
    ctx.quadraticCurveTo(0, 48, 66, 0);
    ctx.lineTo(50, 28);
    ctx.quadraticCurveTo(0, 52, -50, 28);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-28, -2);
    ctx.quadraticCurveTo(0, -52, 30, -2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, -48);
    ctx.lineTo(0, 10);
    ctx.stroke();
  } else if (kind === 1) {
    // ধানের শীষ
    ctx.strokeStyle = '#fde047';
    ctx.fillStyle = '#facc15';
    ctx.lineWidth = 4;
    for (const ang of [-0.38, -0.19, 0, 0.19, 0.38]) {
      ctx.save();
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(0, 44);
      ctx.lineTo(0, -54);
      ctx.stroke();
      for (let y = -50; y <= -4; y += 11) {
        ctx.beginPath();
        ctx.ellipse(-6.5, y, 5.5, 2.8, -0.5, 0, Math.PI * 2);
        ctx.ellipse(6.5, y, 5.5, 2.8, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-18, 16, 36, 11);
  } else {
    // দাঁড়িপাল্লা
    ctx.strokeStyle = '#fde047';
    ctx.fillStyle = '#fde047';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.lineTo(0, 44);
    ctx.moveTo(-28, 44);
    ctx.lineTo(28, 44);
    ctx.moveTo(-50, -30);
    ctx.lineTo(50, -30);
    ctx.stroke();
    ctx.lineWidth = 2.8;
    for (const sx of [-46, 46]) {
      ctx.beginPath();
      ctx.moveTo(sx, -30);
      ctx.lineTo(sx - 17, 12);
      ctx.moveTo(sx, -30);
      ctx.lineTo(sx + 17, 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx, 12, 18, 0, Math.PI);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawBigElectionPosterToCanvas(c, kind, customImg = null) {
  const ctx = c.getContext('2d');
  const W = c.width;
  const H = c.height;

  const palettes = [
    { top: '#065f46', mid: '#047857', bot: '#991b1b', voteText: 'নৌকা মার্কায় ভোট দিন', sub: 'উন্নয়নের ধারাবাহিকতা রক্ষায় · খুলনা', footer: 'প্রচারে: খুলনা মহানগর এলাকাবাসী' },
    { top: '#14532d', mid: '#166534', bot: '#1e3a8a', voteText: 'ধানের শীষ মার্কায় ভোট দিন', sub: 'গণতন্ত্র ও উন্নয়নের প্রতীক · খুলনা', footer: 'প্রচারে: খুলনা সদর ও সোনাডাঙ্গা' },
    { top: '#0f172a', mid: '#1e3a8a', bot: '#065f46', voteText: 'দাঁড়িপাল্লা মার্কায় ভোট দিন', sub: 'ন্যায় ও ইনসাফের প্রতীক · খুলনা', footer: 'প্রচারে: খুলনা মহানগরবাসী' },
  ];
  const pal = palettes[kind % 3];

  const grd = ctx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, pal.top);
  grd.addColorStop(0.55, pal.mid);
  grd.addColorStop(1, pal.bot);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, W - 36, H - 36);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(22, 24, W - 44, 52);
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('খুলনা সিটি নির্বাচনী প্রচারণা', W * 0.5, 58);

  const pCx = 122;
  const pCy = 186;
  const pR = 82;
  if (customImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(pCx, pCy, pR, 0, Math.PI * 2);
    ctx.clip();
    const aspect = customImg.width / Math.max(1, customImg.height);
    let dw = pR * 2, dh = pR * 2;
    if (aspect > 1) dw = dh * aspect;
    else dh = dw / aspect;
    ctx.drawImage(customImg, pCx - dw * 0.5, pCy - dh * 0.5, dw, dh);
    ctx.restore();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(pCx, pCy, pR, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    drawFunnyLeaderCaricature(ctx, pCx, pCy, pR, kind % 3);
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
  ctx.beginPath();
  ctx.arc(286, 186, 68, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.stroke();
  drawElectionSymbol(ctx, kind % 3, 286, 188, 0.88);

  ctx.fillStyle = '#fde047';
  ctx.fillRect(24, 292, W - 48, 76);
  ctx.fillStyle = '#111827';
  ctx.font = kind === 0 ? 'bold 31px sans-serif' : 'bold 26px sans-serif';
  ctx.fillText(pal.voteText, W * 0.5, 340);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 21px sans-serif';
  ctx.fillText(pal.sub, W * 0.5, 404);
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('আপনার মূল্যবান ভোট ও দোয়া প্রার্থী', W * 0.5, 442);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.fillRect(24, 460, W - 48, 30);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(pal.footer, W * 0.5, 480);
}

function createBigElectionPosterTexture(kind) {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 512;
  drawBigElectionPosterToCanvas(c, kind, null);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { tex, canvas: c };
}

const POSTER_KIND_COUNT = 8;
let sharedPropsAssets = null;
function getSharedPropsAssets() {
  if (sharedPropsAssets) return sharedPropsAssets;
  const posterMats = Array.from({ length: POSTER_KIND_COUNT }, (_, k) => new THREE.MeshLambertMaterial({
    map: createPolePosterTexture(k),
    side: THREE.DoubleSide,
  }));
  const bigElectionData = [0, 1, 2].map((k) => createBigElectionPosterTexture(k));
  const bannerMats = bigElectionData.map((d) => new THREE.MeshLambertMaterial({
    map: d.tex,
    side: THREE.DoubleSide,
  }));
  sharedPropsAssets = {
    posterMats,
    bannerMats,
    bigElectionData,
    poleMat: new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.85, metalness: 0.18 }),
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
 * Allows swapping custom funny leader photo(s) live onto the 3 big pole election posters!
 */
export function setElectionLeaderImages(urls = []) {
  const assets = getSharedPropsAssets();
  for (let k = 0; k < 3; k++) {
    const url = urls[k] || urls[0];
    if (!url) continue;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const entry = assets.bigElectionData[k];
      drawBigElectionPosterToCanvas(entry.canvas, k, img);
      entry.tex.needsUpdate = true;
    };
    img.src = url;
  }
}

/**
 * Adds varied Bangladeshi pole posters (0..4 different types per pole!), dense hanging black cable coils
 * (3-4 coils per pole!), and a BIG high-mounted upright election poster board (নৌকা, ধানের শীষ, দাঁড়িপাল্লা).
 */
export function decorateCorridorPole(parent, x, z, facingYaw = 0, seed = 0, poleRadius = 0.19) {
  const assets = getSharedPropsAssets();
  const grp = new THREE.Group();
  grp.position.set(x, 0, z);
  grp.rotation.y = facingYaw;

  const sAbs = Math.abs(seed) + 17;
  // Varied poster density per pole: some poles have 1, some 2, some 3 or 4 stacked!
  const countPick = hashRand(sAbs * 3.7);
  const posterCount = countPick < 0.22 ? 1 : (countPick < 0.52 ? 2 : (countPick < 0.80 ? 3 : 4));
  const sleeveGeo = new THREE.CylinderGeometry(poleRadius + 0.008, poleRadius + 0.014, 0.72, 10, 1, true);
  const heights = [1.45, 2.22, 3.00, 3.76];
  for (let i = 0; i < posterCount; i++) {
    const kIdx = Math.floor(hashRand(sAbs * 19.3 + i * 31.7) * POSTER_KIND_COUNT) % POSTER_KIND_COUNT;
    const pm = new THREE.Mesh(sleeveGeo, assets.posterMats[kIdx]);
    pm.position.y = heights[i] + (hashRand(sAbs + i * 7) - 0.5) * 0.14;
    pm.rotation.y = hashRand(sAbs * 5 + i * 13) * Math.PI * 2;
    grp.add(pm);
  }

  // Dense Bangladeshi round black ISP/dish wire coils hanging around mid-upper pole (3-4 coils per pole!)
  const coilGeo = new THREE.TorusGeometry(0.30, 0.055, 6, 12);
  const coilCount = hashRand(sAbs * 9.1) > 0.4 ? 4 : 3;
  for (let c = 0; c < coilCount; c++) {
    const r1 = hashRand(sAbs * 11.3 + c * 17.1);
    const r2 = hashRand(sAbs * 23.7 + c * 7.9);
    const coil = new THREE.Mesh(coilGeo, assets.coilMat);
    const ang = r1 * Math.PI * 2;
    coil.position.set(Math.cos(ang) * 0.20, 4.25 + c * 0.34 + (r2 - 0.5) * 0.14, Math.sin(ang) * 0.20);
    coil.rotation.set((r1 - 0.5) * 0.7, ang + 0.6, (r2 - 0.5) * 0.6);
    coil.scale.setScalar(0.86 + r2 * 0.44);
    grp.add(coil);
  }

  // BIG upright Election Poster Board mounted high up on the utility pole (নৌকা, ধানের শীষ, দাঁড়িপাল্লা)
  const bIdx = Math.abs(seed) % 3;
  const posterW = 1.52;
  const posterH = 2.02;
  const posterBoard = new THREE.Mesh(new THREE.PlaneGeometry(posterW, posterH), assets.bannerMats[bIdx]);
  posterBoard.position.set(0.88, 5.25, 0);
  grp.add(posterBoard);

  const barTop = new THREE.Mesh(new THREE.BoxGeometry(posterW + 0.14, 0.05, 0.05), assets.steelMat);
  barTop.position.set(0.86, 5.25 + posterH * 0.5 + 0.03, 0);
  const barBot = new THREE.Mesh(new THREE.BoxGeometry(posterW + 0.14, 0.05, 0.05), assets.steelMat);
  barBot.position.set(0.86, 5.25 - posterH * 0.5 - 0.03, 0);
  grp.add(barTop, barBot);

  parent.add(grp);
}

/**
 * Builds an ultra-lightweight, chunk-streamed, GPU-instanced Khulna citywide streetscape:
 * - Roadside utility poles (খাম্বা) & street lampposts
 * - Super messy pole-to-pole tangled overhead wire webs (14 strands) + dense hanging round wire coils (3-4 per pole)
 * - Messy house service drop wires shooting from poles directly into nearby houses (6 per pole)
 * - 8 diverse Bengali pole poster types with varied density per pole (some sparse, some crowded!)
 * - BIG high-mounted upright election poster boards (নৌকা, ধানের শীষ, দাঁড়িপাল্লা)
 * All GPU-instanced & batched (< 18 draw calls total) for locked 60+ FPS!
 */
export function createKhulnaStreetPropsSystem(scene, worldData) {
  const assets = getSharedPropsAssets();
  const group = new THREE.Group();
  group.name = 'KhulnaStreetPropsAndWires';
  scene.add(group);

  const chunkSize = worldData.meta?.chunkSize || 240;
  const polesByChunk = new Map();
  const allPoles = [];

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
  const poleGeo = new THREE.CylinderGeometry(0.135, 0.195, 8.4, 8);
  poleGeo.translate(0, 4.2, 0);
  const poleInst = new THREE.InstancedMesh(poleGeo, assets.poleMat, MAX_POLES);
  poleInst.frustumCulled = false;

  const armGeo = new THREE.BoxGeometry(1.45, 0.08, 0.08);
  const armInst = new THREE.InstancedMesh(armGeo, assets.steelMat, MAX_POLES);
  armInst.frustumCulled = false;

  const lampGeo = new THREE.BoxGeometry(0.55, 0.09, 0.24);
  const lampInst = new THREE.InstancedMesh(lampGeo, assets.lampGlowMat, MAX_POLES);
  lampInst.frustumCulled = false;

  // 3-4 messy hanging round black ISP/dish wire coils per pole!
  const coilGeo = new THREE.TorusGeometry(0.30, 0.055, 5, 10);
  const coilInst = new THREE.InstancedMesh(coilGeo, assets.coilMat, MAX_POLES * 4);
  coilInst.frustumCulled = false;

  const posterGeo = new THREE.CylinderGeometry(0.184, 0.194, 0.72, 8, 1, true);
  const posterInsts = assets.posterMats.map((m) => {
    const im = new THREE.InstancedMesh(posterGeo, m, 240);
    im.frustumCulled = false;
    return im;
  });

  // BIG upright high-mounted election poster boards (1.50m wide x 2.00m tall)
  const bannerGeo = new THREE.PlaneGeometry(1.50, 2.00);
  const bannerInsts = assets.bannerMats.map((m) => {
    const im = new THREE.InstancedMesh(bannerGeo, m, 260);
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

  function addCatenaryWire(buf, x0, y0, z0, x1, y1, z1, sag, segs = 4, swayX = 0, swayZ = 0) {
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
      }
    }

    const activeById = new Map();
    let pCnt = 0;
    let coilCnt = 0;
    const postCnts = new Array(POSTER_KIND_COUNT).fill(0);
    const banCnts = [0, 0, 0];
    const posterHeights = [1.45, 2.22, 3.00, 3.74];

    for (let i = 0; i < activePoles.length && pCnt < MAX_POLES; i++) {
      const p = activePoles[i];
      activeById.set(p.id, p);

      // Varied pole thickness: some thick heavy concrete poles, some medium, some slim steel poles!
      const thickRoll = hashRand(p.id * 11.7 + 2.3);
      const poleScaleXZ = thickRoll < 0.32 ? (0.72 + thickRoll * 0.45) : (thickRoll < 0.62 ? (1.02 + (thickRoll - 0.32) * 0.55) : (1.28 + (thickRoll - 0.62) * 0.72));

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

      // 4. 3 to 4 messy round black ISP/dish wire coils per pole!
      const cNum = hashRand(p.id * 9.3) > 0.35 ? 4 : 3;
      for (let c = 0; c < cNum && coilCnt < MAX_POLES * 4; c++) {
        const r1 = hashRand(p.id * 13.7 + c * 17.3);
        const r2 = hashRand(p.id * 29.1 + c * 11.9);
        const ang = r1 * Math.PI * 2;
        const cRad = 0.21 * Math.max(1.0, poleScaleXZ);
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

      // 5. Diverse Pole Posters with varied density & matching pole thickness!
      const densityRoll = hashRand(p.id * 4.3 + 1.9);
      const numPosters = densityRoll < 0.12 ? 0 : (densityRoll < 0.34 ? 1 : (densityRoll < 0.62 ? 2 : (densityRoll < 0.84 ? 3 : 4)));
      for (let pi = 0; pi < numPosters; pi++) {
        const pk = Math.floor(hashRand(p.id * 17.9 + pi * 37.3) * POSTER_KIND_COUNT) % POSTER_KIND_COUNT;
        if (postCnts[pk] < 240) {
          dummy.position.set(p.x, posterHeights[pi] + (hashRand(p.id + pi * 5) - 0.5) * 0.14, p.z);
          dummy.rotation.set(0, p.yaw + hashRand(p.id * 7 + pi * 19) * Math.PI * 2, 0);
          dummy.scale.set(poleScaleXZ, 1, poleScaleXZ);
          dummy.updateMatrix();
          posterInsts[pk].setMatrixAt(postCnts[pk]++, dummy.matrix);
        }
      }

      // 6. BIG High-Mounted Election Posters (নৌকা, ধানের শীষ, দাঁড়িপাল্লা) on ~75% of poles
      if (hashRand(p.id * 5.7) < 0.75) {
        const bk = Math.floor(hashRand(p.id * 11.3) * 3) % 3;
        if (banCnts[bk] < 260) {
          dummy.position.set(p.x - p.nx * p.side * 0.86, 5.25, p.z - p.nz * p.side * 0.86);
          dummy.rotation.set(0, p.yaw + Math.PI * 0.5, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          bannerInsts[bk].setMatrixAt(banCnts[bk]++, dummy.matrix);
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
      bannerInsts[k].count = banCnts[k];
      bannerInsts[k].instanceMatrix.needsUpdate = true;
    }

    // Build SUPER MESSY Bangladeshi Khulna pole-to-pole tangled overhead wires + house service drops!
    const wireVerts = [];
    const wireStrands = quality === 'low' ? 8 : 14;
    const dropCount = quality === 'low' ? 4 : 6;

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
                prev.x + prev.nx * latA, yA, prev.z + prev.nz * latA,
                p.x + p.nx * latB, yB, p.z + p.nz * latB,
                sag,
                3,
                swayX,
                swayZ,
              );
            }
          }
        }
      }

      // Messy House Service Drop Wires shooting from each pole into nearby houses on both sides!
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
          p.x + (rd1 - 0.5) * 0.28, startY, p.z + (rd2 - 0.5) * 0.28,
          endX, endY, endZ,
          dropSag,
          3,
        );
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
