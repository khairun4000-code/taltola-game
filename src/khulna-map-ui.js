import worldData from './data/khulna-world-data.json';
import { worldXZToLatLon } from './khulna-geo.js';

export function createKhulnaMapUI({ onWarpToLandmark, onOpenChange }) {
  const miniCanvas = document.querySelector('#khulna-minimap');
  const fullCanvas = document.querySelector('#city-map-canvas');
  const mapModal = document.querySelector('#city-map-modal');
  const mapList = document.querySelector('#city-landmark-list');
  const mapCloseBtn = document.querySelector('#close-city-map');
  const mapToggleBtn = document.querySelector('#map-hud-button');
  const miniDock = document.querySelector('#minimap-dock');
  const gpsReadout = document.querySelector('#gps-readout');

  const miniCtx = miniCanvas ? miniCanvas.getContext('2d') : null;
  const fullCtx = fullCanvas ? fullCanvas.getContext('2d') : null;
  const [minX, maxX, minZ, maxZ] = worldData.meta.bounds;

  const visibleLandmarks = worldData.landmarks.filter((lm) => lm.id !== 'pti_more' && lm.id !== 'taltola_ward23');

  let isOpen = false;
  let lastMiniDraw = 0;

  // Pre-render static vector base layer of full Khulna map offscreen for instant 120 FPS blitting!
  const baseW = 760;
  const baseH = 720;
  const baseLayer = document.createElement('canvas');
  baseLayer.width = baseW;
  baseLayer.height = baseH;
  const bCtx = baseLayer.getContext('2d');

  function worldToBasePx(x, z) {
    return [
      ((x - minX) / (maxX - minX)) * baseW,
      ((z - minZ) / (maxZ - minZ)) * baseH,
    ];
  }

  function basePxToWorld(px, py) {
    return {
      x: minX + (px / baseW) * (maxX - minX),
      z: minZ + (py / baseH) * (maxZ - minZ),
    };
  }

  function paintBaseLayer() {
    bCtx.fillStyle = '#18231e';
    bCtx.fillRect(0, 0, baseW, baseH);

    // Greens / Stadiums / Circuit House Ground
    for (const g of worldData.greens) {
      bCtx.fillStyle = g.k === 'pitch' ? '#2c5a37' : '#22452b';
      bCtx.beginPath();
      for (let i = 0; i < g.p.length; i += 2) {
        const [px, py] = worldToBasePx(g.p[i], g.p[i + 1]);
        if (i === 0) bCtx.moveTo(px, py);
        else bCtx.lineTo(px, py);
      }
      bCtx.closePath();
      bCtx.fill();
    }

    // Rivers & Ponds
    for (const w of worldData.waters) {
      bCtx.fillStyle = w.k === 'river' ? '#1c4d63' : '#235e78';
      bCtx.beginPath();
      for (let i = 0; i < w.p.length; i += 2) {
        const [px, py] = worldToBasePx(w.p[i], w.p[i + 1]);
        if (i === 0) bCtx.moveTo(px, py);
        else bCtx.lineTo(px, py);
      }
      bCtx.closePath();
      bCtx.fill();
    }

    // Roads by hierarchy (generic city building dots omitted for a clean road/park map)
    for (const r of worldData.roads) {
      bCtx.strokeStyle = r.t <= 1 ? '#e8b054' : (r.t === 2 ? '#c2ccbe' : (r.t === 3 ? '#7c8f85' : 'rgba(130, 148, 138, 0.55)'));
      bCtx.lineWidth = r.t <= 1 ? 2.4 : (r.t === 2 ? 1.6 : (r.t === 3 ? 1.15 : 0.7));
      bCtx.beginPath();
      for (let i = 0; i < r.p.length; i += 2) {
        const [px, py] = worldToBasePx(r.p[i], r.p[i + 1]);
        if (i === 0) bCtx.moveTo(px, py);
        else bCtx.lineTo(px, py);
      }
      bCtx.stroke();
    }

    // Hero District Watermarks
    bCtx.font = 'bold 11px "Manrope", sans-serif';
    bCtx.fillStyle = 'rgba(125, 211, 252, 0.72)';
    const [rx, rz] = worldToBasePx(1235, 320);
    bCtx.fillText('RUPSHA RIVER', rx - 35, rz);
  }
  paintBaseLayer();

  function populateLandmarkButtons(playerX = 420, playerZ = 975) {
    if (!mapList) return;
    mapList.innerHTML = '';
    for (const lm of visibleLandmarks) {
      const distM = Math.round(Math.hypot(lm.x - playerX, lm.z - playerZ));
      const { lat, lon } = worldXZToLatLon(lm.x, lm.z);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `city-lm-btn ${lm.c === 'hero' ? 'is-hero' : ''}`;
      btn.innerHTML = `
        <span class="lm-name">${lm.bn}</span>
        <small class="lm-meta">${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E · ${distM}m away</small>
      `;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeMap();
        onWarpToLandmark?.(lm);
      });
      mapList.appendChild(btn);
    }
  }

  function renderFullMap(playerPos, yaw) {
    if (!fullCtx || !fullCanvas) return;
    fullCtx.clearRect(0, 0, fullCanvas.width, fullCanvas.height);
    fullCtx.drawImage(baseLayer, 0, 0, fullCanvas.width, fullCanvas.height);

    // Draw landmark pins
    for (const lm of visibleLandmarks) {
      const [bx, bz] = worldToBasePx(lm.x, lm.z);
      const px = (bx / baseW) * fullCanvas.width;
      const py = (bz / baseH) * fullCanvas.height;
      fullCtx.beginPath();
      fullCtx.arc(px, py, lm.c === 'hero' ? 7 : 5, 0, Math.PI * 2);
      fullCtx.fillStyle = lm.c === 'hero' ? '#fbbf24' : '#d9ed9c';
      fullCtx.fill();
      fullCtx.lineWidth = 2;
      fullCtx.strokeStyle = '#0f1714';
      fullCtx.stroke();

      const alignRight = px > fullCanvas.width - 175;
      const lx = alignRight ? px - 10 : px + 10;
      const ly = Math.max(18, Math.min(fullCanvas.height - 12, py + 3));
      fullCtx.textAlign = alignRight ? 'right' : 'left';
      fullCtx.font = lm.c === 'hero' ? '700 12px "Manrope", sans-serif' : '600 10.5px "Manrope", sans-serif';
      fullCtx.fillStyle = '#0c1512';
      fullCtx.fillText(lm.n, lx + 1, ly + 1);
      fullCtx.fillStyle = lm.c === 'hero' ? '#fef08a' : '#f1f5f9';
      fullCtx.fillText(lm.n, lx, ly);
      fullCtx.textAlign = 'left';
    }

    // Player pulse dot
    const [pbx, pbz] = worldToBasePx(playerPos.x, playerPos.z);
    const px = (pbx / baseW) * fullCanvas.width;
    const py = (pbz / baseH) * fullCanvas.height;
    fullCtx.save();
    fullCtx.translate(px, py);
    fullCtx.rotate(-yaw);
    fullCtx.fillStyle = '#38bdf8';
    fullCtx.strokeStyle = '#ffffff';
    fullCtx.lineWidth = 2;
    fullCtx.beginPath();
    fullCtx.moveTo(0, -10);
    fullCtx.lineTo(7, 8);
    fullCtx.lineTo(0, 4);
    fullCtx.lineTo(-7, 8);
    fullCtx.closePath();
    fullCtx.fill();
    fullCtx.stroke();
    fullCtx.restore();
  }

  function renderMinimap(playerPos, yaw, districtInfo) {
    if (!miniCtx || !miniCanvas) return;
    const now = performance.now();
    if (now - lastMiniDraw < 65) return; // Cap minimap redraw cleanly to ~15 Hz
    lastMiniDraw = now;

    const w = miniCanvas.width;
    const h = miniCanvas.height;
    // Show ~520m radius around player (north-up for easy geographic reading)
    const spanMeters = 520;
    const srcW = (spanMeters / (maxX - minX)) * baseW;
    const srcH = (spanMeters / (maxZ - minZ)) * baseH;
    const [cbx, cbz] = worldToBasePx(playerPos.x, playerPos.z);

    miniCtx.fillStyle = '#14201b';
    miniCtx.fillRect(0, 0, w, h);
    miniCtx.drawImage(
      baseLayer,
      cbx - srcW * 0.5,
      cbz - srcH * 0.5,
      srcW,
      srcH,
      0,
      0,
      w,
      h
    );

    // Highlight hero landmark pins visible on radar
    for (const lm of visibleLandmarks) {
      const dx = lm.x - playerPos.x;
      const dz = lm.z - playerPos.z;
      if (Math.abs(dx) > spanMeters * 0.48 || Math.abs(dz) > spanMeters * 0.48) continue;
      const mx = w * 0.5 + (dx / spanMeters) * w;
      const my = h * 0.5 + (dz / spanMeters) * h;
      miniCtx.beginPath();
      miniCtx.arc(mx, my, lm.c === 'hero' ? 4.2 : 3.2, 0, Math.PI * 2);
      miniCtx.fillStyle = lm.c === 'hero' ? '#fbbf24' : '#d9ed9c';
      miniCtx.fill();
      miniCtx.strokeStyle = '#0f1714';
      miniCtx.lineWidth = 1.2;
      miniCtx.stroke();
    }

    // Center player heading arrow
    miniCtx.save();
    miniCtx.translate(w * 0.5, h * 0.5);
    miniCtx.rotate(-yaw);
    miniCtx.fillStyle = '#38bdf8';
    miniCtx.strokeStyle = '#ffffff';
    miniCtx.lineWidth = 1.5;
    miniCtx.beginPath();
    miniCtx.moveTo(0, -7);
    miniCtx.lineTo(5, 6);
    miniCtx.lineTo(0, 3);
    miniCtx.lineTo(-5, 6);
    miniCtx.closePath();
    miniCtx.fill();
    miniCtx.stroke();
    miniCtx.restore();

    // Update GPS badge
    if (gpsReadout && districtInfo) {
      const text = `${districtInfo.lat.toFixed(4)}°N · ${districtInfo.lon.toFixed(4)}°E`;
      if (gpsReadout.textContent !== text) gpsReadout.textContent = text;
    }
  }

  function openMap(playerPos, yaw) {
    if (!mapModal) return;
    isOpen = true;
    populateLandmarkButtons(playerPos.x, playerPos.z);
    renderFullMap(playerPos, yaw);
    mapModal.classList.remove('hidden');
    onOpenChange?.(true);
  }

  function closeMap() {
    if (!mapModal) return;
    isOpen = false;
    mapModal.classList.add('hidden');
    onOpenChange?.(false);
  }

  function toggleMap(playerPos, yaw) {
    if (isOpen) closeMap();
    else openMap(playerPos, yaw);
  }

  fullCanvas?.addEventListener('click', (e) => {
    const rect = fullCanvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * baseW;
    const py = ((e.clientY - rect.top) / rect.height) * baseH;
    const clickW = basePxToWorld(px, py);

    // Snap to nearest landmark within 90m, else warp directly onto clicked street point!
    let bestLm = null;
    let bestD = 90;
    for (const lm of visibleLandmarks) {
      const d = Math.hypot(lm.x - clickW.x, lm.z - clickW.z);
      if (d < bestD) {
        bestD = d;
        bestLm = lm;
      }
    }
    closeMap();
    if (bestLm) {
      onWarpToLandmark?.(bestLm);
    } else {
      onWarpToLandmark?.({
        n: 'Selected Khulna Street',
        bn: 'খুলনা শহরের নির্বাচিত স্থান',
        spawnX: clickW.x,
        spawnZ: clickW.z,
        lookX: clickW.x + 8,
        lookZ: clickW.z,
      });
    }
  });

  mapCloseBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeMap();
  });

  mapToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    // Triggers toggle callback handled in main
    document.dispatchEvent(new CustomEvent('taltola-toggle-map'));
  });

  miniDock?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.dispatchEvent(new CustomEvent('taltola-toggle-map'));
  });

  return {
    get isOpen() {
      return isOpen;
    },
    landmarks: worldData.landmarks,
    openMap,
    closeMap,
    toggleMap,
    renderMinimap,
    renderFullMap,
  };
}
