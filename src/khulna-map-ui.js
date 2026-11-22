import worldData from './data/khulna-world-data.json';
import { worldXZToLatLon } from './khulna-geo.js';

export function createKhulnaMapUI({ onWarpToLandmark, onOpenChange, onSyncSettings, onResumeGame }) {
  const miniCanvas = document.querySelector('#khulna-minimap');
  const fullCanvas = document.querySelector('#city-map-canvas');
  const mapModal = document.querySelector('#city-map-modal');
  const mapList = document.querySelector('#city-landmark-list');
  const mapCloseBtn = document.querySelector('#close-city-map');
  const resumeGameBtn = document.querySelector('#pause-resume-game-btn');
  const myLocBtn = document.querySelector('#map-my-location-btn');
  const clearGpsBtn = document.querySelector('#map-clear-gps-btn');
  const pauseMenuTitle = document.querySelector('#pause-menu-title');
  const tabButtons = Array.from(document.querySelectorAll('[data-pause-tab]'));
  const tabPanels = Array.from(document.querySelectorAll('[data-pause-panel]'));
  const gpsReadout = document.querySelector('#gps-readout');

  const TAB_TITLES = {
    map: 'CITY MAP & GPS NAVIGATION',
    graphics: 'GRAPHICS & DISPLAY SETTINGS',
    settings: 'GAMEPLAY & CAMERA SETTINGS',
    game: 'QUICK ACTIONS, STUDIO & EMOTES',
    controls: 'KEYBOARD & MOUSE CONTROLS',
  };
  let activeTab = 'map';
  let partnerInfo = null;

  function setPartnerInfo(info) {
    partnerInfo = info || null;
  }

  function setActiveTab(nextTab = 'map') {
    activeTab = TAB_TITLES[nextTab] ? nextTab : 'map';
    for (const btn of tabButtons) {
      const match = btn.dataset.pauseTab === activeTab;
      btn.classList.toggle('active', match);
      btn.setAttribute('aria-selected', match ? 'true' : 'false');
    }
    for (const panel of tabPanels) {
      panel.classList.toggle('hidden', panel.dataset.pausePanel !== activeTab);
    }
    if (pauseMenuTitle) {
      pauseMenuTitle.textContent = TAB_TITLES[activeTab];
    }
    if (myLocBtn) {
      myLocBtn.classList.toggle('hidden', activeTab !== 'map');
    }
    if (activeTab === 'map' && isOpen) {
      renderFullMap(lastPlayerPos, lastPlayerYaw);
    } else if (isOpen) {
      onSyncSettings?.();
    }
  }

  for (const btn of tabButtons) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setActiveTab(btn.dataset.pauseTab);
    });
  }

  const miniCtx = miniCanvas ? miniCanvas.getContext('2d') : null;
  const fullCtx = fullCanvas ? fullCanvas.getContext('2d') : null;
  const [minX, maxX, minZ, maxZ] = worldData.meta.bounds;

  const visibleLandmarks = [
    ...worldData.landmarks
      .filter((lm) => lm.id !== 'taltola_ward23')
      .map((lm) => lm.id === 'pti_more'
        ? { ...lm, c: 'hero', isPti: true, n: 'PTI More · Ahsan Ahmed Rd', bn: 'PTI More · Ahsan Ahmed Rd' }
        : lm),
    {
      id: 'khulna_model_mosque',
      n: 'Khulna District Model Mosque',
      bn: 'খুলনা জেলা মডেল মসজিদ (আলিয়া মাদ্রাসা ক্যাম্পাস)',
      c: 'mosque',
      x: 154.0,
      z: 156.0,
    },
    {
      id: 'khulna_judge_court',
      n: 'Khulna District Judge Court',
      bn: 'খুলনা জেলা ও দায়রা জজ আদালত (কে.ডি. ঘোষ রোড)',
      c: 'hero',
      x: 188.0,
      z: -676.0,
    },
  ];
  const ptiIdx = visibleLandmarks.findIndex((lm) => lm.id === 'pti_more');
  if (ptiIdx > 0) {
    const [ptiLm] = visibleLandmarks.splice(ptiIdx, 1);
    visibleLandmarks.unshift(ptiLm);
  }

  let isOpen = false;
  let lastMiniDraw = 0;
  let pingUntil = 0;
  let lastPlayerPos = { x: 0, z: 0 };
  let lastPlayerYaw = 0;

  // GTA V-Style Yellow GPS Waypoint & Real Khulna Road Graph Shortest-Path Router
  let gpsWaypoint = null; // { x, z, label }
  let gpsRoutePts = [];   // [[x,z], ...]
  let gpsRouteDistM = 0;
  let lastRouteRecomputePos = { x: 1e9, z: 1e9 };

  const roadNodes = [];
  const roadAdj = [];
  const nodeGrid = new Map();
  const SNAP_CELL = 14;

  function getOrAddNode(x, z) {
    const gx = Math.round(x / SNAP_CELL);
    const gz = Math.round(z / SNAP_CELL);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const list = nodeGrid.get(`${gx + dx},${gz + dz}`);
        if (!list) continue;
        for (const id of list) {
          if (Math.hypot(roadNodes[id][0] - x, roadNodes[id][1] - z) < 12) return id;
        }
      }
    }
    const id = roadNodes.length;
    roadNodes.push([x, z]);
    roadAdj.push([]);
    const key = `${gx},${gz}`;
    if (!nodeGrid.has(key)) nodeGrid.set(key, []);
    nodeGrid.get(key).push(id);
    return id;
  }

  for (const r of worldData.roads) {
    const pts = r.p;
    if (!pts || pts.length < 4) continue;
    let prev = getOrAddNode(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) {
      const cur = getOrAddNode(pts[i], pts[i + 1]);
      if (cur !== prev) {
        const d = Math.hypot(roadNodes[cur][0] - roadNodes[prev][0], roadNodes[cur][1] - roadNodes[prev][1]);
        roadAdj[prev].push([cur, d]);
        roadAdj[cur].push([prev, d]);
        prev = cur;
      }
    }
  }

  function findNearestRoadNode(x, z) {
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < roadNodes.length; i++) {
      const d = (roadNodes[i][0] - x) ** 2 + (roadNodes[i][1] - z) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  function computeGpsRoute(fromX, fromZ, toX, toZ) {
    const s = findNearestRoadNode(fromX, fromZ);
    const t = findNearestRoadNode(toX, toZ);
    if (s < 0 || t < 0) return [[fromX, fromZ], [toX, toZ]];
    const n = roadNodes.length;
    const dist = new Float64Array(n).fill(Infinity);
    const prev = new Int32Array(n).fill(-1);
    const visited = new Uint8Array(n);
    dist[s] = 0;
    const heap = [[0, s]];
    while (heap.length) {
      let bestIdx = 0;
      for (let i = 1; i < heap.length; i++) if (heap[i][0] < heap[bestIdx][0]) bestIdx = i;
      const [d, u] = heap[bestIdx];
      heap[bestIdx] = heap[heap.length - 1];
      heap.pop();
      if (visited[u]) continue;
      visited[u] = 1;
      if (u === t) break;
      for (const [v, w] of roadAdj[u]) {
        const nd = d + w;
        if (nd < dist[v]) {
          dist[v] = nd;
          prev[v] = u;
          heap.push([nd, v]);
        }
      }
    }
    const path = [[toX, toZ]];
    if (prev[t] !== -1 || s === t) {
      let cur = t;
      while (cur !== -1) {
        path.push(roadNodes[cur]);
        cur = prev[cur];
      }
    }
    path.push([fromX, fromZ]);
    path.reverse();
    return path;
  }

  function syncClearGpsButton() {
    if (!clearGpsBtn) return;
    clearGpsBtn.classList.toggle('hidden', !gpsWaypoint);
  }

  function updateGpsRouteIfNeeded(px, pz, force = false) {
    if (!gpsWaypoint) {
      syncClearGpsButton();
      return;
    }
    const directDist = Math.hypot(gpsWaypoint.x - px, gpsWaypoint.z - pz);
    if (directDist < 18) {
      gpsWaypoint = null;
      gpsRoutePts = [];
      gpsRouteDistM = 0;
      syncClearGpsButton();
      return;
    }
    if (!force && Math.hypot(px - lastRouteRecomputePos.x, pz - lastRouteRecomputePos.z) < 16) {
      gpsRouteDistM = Math.round(directDist);
      return;
    }
    lastRouteRecomputePos = { x: px, z: pz };
    gpsRoutePts = computeGpsRoute(px, pz, gpsWaypoint.x, gpsWaypoint.z);
    let total = 0;
    for (let i = 1; i < gpsRoutePts.length; i++) {
      total += Math.hypot(gpsRoutePts[i][0] - gpsRoutePts[i - 1][0], gpsRoutePts[i][1] - gpsRoutePts[i - 1][1]);
    }
    gpsRouteDistM = Math.round(total || directDist);
    syncClearGpsButton();
  }

  function setGpsWaypoint(x, z, label = 'GPS Waypoint') {
    gpsWaypoint = { x, z, label };
    updateGpsRouteIfNeeded(lastPlayerPos.x, lastPlayerPos.z, true);
    syncClearGpsButton();
    if (isOpen) renderFullMap(lastPlayerPos, lastPlayerYaw);
  }

  function clearGpsWaypoint() {
    gpsWaypoint = null;
    gpsRoutePts = [];
    gpsRouteDistM = 0;
    syncClearGpsButton();
    if (isOpen) renderFullMap(lastPlayerPos, lastPlayerYaw);
  }

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

    for (const r of worldData.roads) {
      const isGreenRoad = r.n === 'Altapole Lane' || r.n === 'Ahsan Ahmed Rd' || r.n === 'Mia Para Road';
      bCtx.strokeStyle = isGreenRoad
        ? '#4ade80'
        : (r.t <= 1 ? '#e8b054' : (r.t === 2 ? '#c2ccbe' : (r.t === 3 ? '#7c8f85' : 'rgba(130, 148, 138, 0.55)')));
      bCtx.lineWidth = isGreenRoad ? 2.8 : (r.t <= 1 ? 2.4 : (r.t === 2 ? 1.6 : (r.t === 3 ? 1.15 : 0.7)));
      bCtx.beginPath();
      for (let i = 0; i < r.p.length; i += 2) {
        const [px, py] = worldToBasePx(r.p[i], r.p[i + 1]);
        if (i === 0) bCtx.moveTo(px, py);
        else bCtx.lineTo(px, py);
      }
      bCtx.stroke();
    }

    // Highlight PTI More & Ahsan Ahmed Rd junction zone in bright green
    const [ptx, ptz] = worldToBasePx(-304.3, -56.7);
    bCtx.save();
    bCtx.beginPath();
    bCtx.arc(ptx, ptz, 18, 0, Math.PI * 2);
    bCtx.fillStyle = 'rgba(74, 222, 128, 0.24)';
    bCtx.fill();
    bCtx.lineWidth = 2;
    bCtx.strokeStyle = '#4ade80';
    bCtx.stroke();
    bCtx.restore();

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
      if (lm.isPti) {
        btn.style.borderColor = '#4ade80';
        btn.style.background = 'rgba(34, 197, 94, 0.24)';
        btn.style.boxShadow = '0 0 12px rgba(74, 222, 128, 0.30)';
      }
      btn.innerHTML = `
        <span class="lm-name"${lm.isPti ? ' style="color:#86efac"' : ''}>${lm.n}</span>
        <small class="lm-meta">${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E · ${distM}m away</small>
      `;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeMap();
        onWarpToLandmark?.(lm);
      });
      btn.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        setGpsWaypoint(lm.x, lm.z, lm.n);
      });
      mapList.appendChild(btn);
    }
  }

  function renderFullMap(playerPos, yaw) {
    if (!fullCtx || !fullCanvas) return;
    fullCtx.clearRect(0, 0, fullCanvas.width, fullCanvas.height);
    fullCtx.drawImage(baseLayer, 0, 0, fullCanvas.width, fullCanvas.height);

    // Draw GTA V Bright Electric Blue GPS Route Line & Waypoint Pin on Full Map
    if (gpsWaypoint) {
      updateGpsRouteIfNeeded(playerPos.x, playerPos.z, false);
      if (gpsRoutePts.length >= 2) {
        fullCtx.save();
        fullCtx.beginPath();
        for (let i = 0; i < gpsRoutePts.length; i++) {
          const [bx, bz] = worldToBasePx(gpsRoutePts[i][0], gpsRoutePts[i][1]);
          const px = (bx / baseW) * fullCanvas.width;
          const py = (bz / baseH) * fullCanvas.height;
          if (i === 0) fullCtx.moveTo(px, py);
          else fullCtx.lineTo(px, py);
        }
        fullCtx.lineJoin = 'round';
        fullCtx.lineCap = 'round';
        // Crisp dark navy outline for maximum contrast over all map roads
        fullCtx.strokeStyle = 'rgba(2, 12, 36, 0.92)';
        fullCtx.lineWidth = 11.0;
        fullCtx.stroke();
        // Vibrant GTA V electric royal blue glowing route
        fullCtx.strokeStyle = '#007bff';
        fullCtx.lineWidth = 6.8;
        fullCtx.shadowColor = '#00b4ff';
        fullCtx.shadowBlur = 18;
        fullCtx.stroke();
        // Bright glowing blue-white core
        fullCtx.shadowBlur = 0;
        fullCtx.strokeStyle = '#60d5ff';
        fullCtx.lineWidth = 2.6;
        fullCtx.stroke();
        fullCtx.restore();
      }
      const [wbx, wbz] = worldToBasePx(gpsWaypoint.x, gpsWaypoint.z);
      const wpx = (wbx / baseW) * fullCanvas.width;
      const wpy = (wbz / baseH) * fullCanvas.height;
      fullCtx.save();
      fullCtx.beginPath();
      fullCtx.arc(wpx, wpy, 10, 0, Math.PI * 2);
      fullCtx.fillStyle = '#0088ff';
      fullCtx.shadowColor = '#00c8ff';
      fullCtx.shadowBlur = 16;
      fullCtx.fill();
      fullCtx.lineWidth = 2.8;
      fullCtx.strokeStyle = '#ffffff';
      fullCtx.stroke();
      fullCtx.shadowBlur = 0;
      fullCtx.font = '800 12.5px "Manrope", sans-serif';
      fullCtx.fillStyle = '#020c24';
      fullCtx.fillText(`🔵 GPS (${gpsRouteDistM}m)`, wpx + 13, wpy + 5);
      fullCtx.fillStyle = '#60d5ff';
      fullCtx.fillText(`🔵 GPS (${gpsRouteDistM}m)`, wpx + 12, wpy + 4);
      fullCtx.restore();
    }

    for (const lm of visibleLandmarks) {
      const [bx, bz] = worldToBasePx(lm.x, lm.z);
      const px = (bx / baseW) * fullCanvas.width;
      const py = (bz / baseH) * fullCanvas.height;
      fullCtx.beginPath();
      fullCtx.arc(px, py, lm.isPti ? 8.5 : (lm.c === 'hero' ? 7 : 5), 0, Math.PI * 2);
      fullCtx.fillStyle = lm.isPti ? '#4ade80' : (lm.c === 'hero' ? '#fbbf24' : '#d9ed9c');
      fullCtx.fill();
      fullCtx.lineWidth = 2.2;
      fullCtx.strokeStyle = '#0f1714';
      fullCtx.stroke();

      const alignRight = px > fullCanvas.width - 175;
      const lx = alignRight ? px - 11 : px + 11;
      const ly = Math.max(18, Math.min(fullCanvas.height - 12, py + 3));
      fullCtx.textAlign = alignRight ? 'right' : 'left';
      fullCtx.font = (lm.isPti || lm.c === 'hero') ? '700 12px "Manrope", sans-serif' : '600 10.5px "Manrope", sans-serif';
      fullCtx.fillStyle = '#0c1512';
      fullCtx.fillText(lm.n, lx + 1, ly + 1);
      fullCtx.fillStyle = lm.isPti ? '#86efac' : (lm.c === 'hero' ? '#fef08a' : '#f1f5f9');
      fullCtx.fillText(lm.n, lx, ly);
      fullCtx.textAlign = 'left';
    }

    lastPlayerPos = { x: playerPos.x, z: playerPos.z };
    lastPlayerYaw = yaw;
    const now = performance.now();
    const blinkPhase = (now * 0.0055) % (Math.PI * 2);
    const pulseT = (now * 0.0014) % 1.0;
    const isPinging = now < pingUntil;
    const [pbx, pbz] = worldToBasePx(playerPos.x, playerPos.z);
    const px = (pbx / baseW) * fullCanvas.width;
    const py = (pbz / baseH) * fullCanvas.height;

    fullCtx.save();
    const maxR = isPinging ? 44 : 24;
    fullCtx.beginPath();
    fullCtx.arc(px, py, 6 + pulseT * maxR, 0, Math.PI * 2);
    fullCtx.strokeStyle = isPinging
      ? `rgba(0, 210, 255, ${(1 - pulseT) * 0.98})`
      : `rgba(56, 189, 248, ${(1 - pulseT) * 0.85})`;
    fullCtx.lineWidth = isPinging ? 3.2 : 2.2;
    fullCtx.stroke();

    const blinkAlpha = 0.58 + 0.42 * (0.5 + 0.5 * Math.sin(blinkPhase * 1.4));
    fullCtx.translate(px, py);
    fullCtx.rotate(-yaw);
    fullCtx.globalAlpha = blinkAlpha;
    fullCtx.shadowColor = isPinging ? '#00d2ff' : '#38bdf8';
    fullCtx.shadowBlur = isPinging ? 18 : 10;
    fullCtx.fillStyle = isPinging ? '#00c8ff' : '#38bdf8';
    fullCtx.strokeStyle = '#ffffff';
    fullCtx.lineWidth = 2.2;
    fullCtx.beginPath();
    fullCtx.moveTo(0, -12);
    fullCtx.lineTo(8, 9);
    fullCtx.lineTo(0, 4.5);
    fullCtx.lineTo(-8, 9);
    fullCtx.closePath();
    fullCtx.fill();
    fullCtx.stroke();
    fullCtx.restore();

    if (partnerInfo) {
      const [abx, abz] = worldToBasePx(partnerInfo.x, partnerInfo.z);
      const ax = (abx / baseW) * fullCanvas.width;
      const ay = (abz / baseH) * fullCanvas.height;
      const labelText = `${partnerInfo.name}${partnerInfo.inCar ? ' · Car' : ''}`;
      fullCtx.save();
      fullCtx.beginPath();
      fullCtx.arc(ax, ay, 8.5, 0, Math.PI * 2);
      fullCtx.fillStyle = '#f59e0b';
      fullCtx.fill();
      fullCtx.strokeStyle = '#ffffff';
      fullCtx.lineWidth = 2.0;
      fullCtx.stroke();
      fullCtx.font = '700 11px "Manrope", sans-serif';
      fullCtx.fillStyle = '#0c1512';
      fullCtx.fillText(labelText, ax + 12, ay + 4);
      fullCtx.fillStyle = '#fcd34d';
      fullCtx.fillText(labelText, ax + 11, ay + 3);
      fullCtx.restore();
    }
  }

  function renderMinimap(playerPos, yaw, districtInfo) {
    if (!miniCtx || !miniCanvas) return;
    const now = performance.now();
    if (now - lastMiniDraw < 65) return;
    lastMiniDraw = now;

    lastPlayerPos = { x: playerPos.x, z: playerPos.z };
    lastPlayerYaw = yaw;

    const w = miniCanvas.width;
    const h = miniCanvas.height;
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

    // Draw live GTA V Bright Electric Blue GPS Route Line on the corner Minimap Radar!
    if (gpsWaypoint) {
      updateGpsRouteIfNeeded(playerPos.x, playerPos.z, false);
      if (gpsRoutePts.length >= 2) {
        miniCtx.save();
        miniCtx.beginPath();
        for (let i = 0; i < gpsRoutePts.length; i++) {
          const mx = w * 0.5 + ((gpsRoutePts[i][0] - playerPos.x) / spanMeters) * w;
          const my = h * 0.5 + ((gpsRoutePts[i][1] - playerPos.z) / spanMeters) * h;
          if (i === 0) miniCtx.moveTo(mx, my);
          else miniCtx.lineTo(mx, my);
        }
        miniCtx.lineJoin = 'round';
        miniCtx.lineCap = 'round';
        miniCtx.strokeStyle = 'rgba(2, 12, 36, 0.92)';
        miniCtx.lineWidth = 7.6;
        miniCtx.stroke();
        miniCtx.strokeStyle = '#007bff';
        miniCtx.lineWidth = 4.6;
        miniCtx.shadowColor = '#00b4ff';
        miniCtx.shadowBlur = 12;
        miniCtx.stroke();
        miniCtx.shadowBlur = 0;
        miniCtx.strokeStyle = '#7dd3fc';
        miniCtx.lineWidth = 1.8;
        miniCtx.stroke();
        miniCtx.restore();
      }
      const wdx = gpsWaypoint.x - playerPos.x;
      const wdz = gpsWaypoint.z - playerPos.z;
      const wmx = Math.max(6, Math.min(w - 6, w * 0.5 + (wdx / spanMeters) * w));
      const wmy = Math.max(6, Math.min(h - 6, h * 0.5 + (wdz / spanMeters) * h));
      miniCtx.save();
      miniCtx.beginPath();
      miniCtx.arc(wmx, wmy, 5.6, 0, Math.PI * 2);
      miniCtx.fillStyle = '#0088ff';
      miniCtx.shadowColor = '#00c8ff';
      miniCtx.shadowBlur = 8;
      miniCtx.fill();
      miniCtx.strokeStyle = '#ffffff';
      miniCtx.lineWidth = 1.6;
      miniCtx.stroke();
      miniCtx.restore();
    }

    for (const lm of visibleLandmarks) {
      const dx = lm.x - playerPos.x;
      const dz = lm.z - playerPos.z;
      if (Math.abs(dx) > spanMeters * 0.48 || Math.abs(dz) > spanMeters * 0.48) continue;
      const mx = w * 0.5 + (dx / spanMeters) * w;
      const my = h * 0.5 + (dz / spanMeters) * h;
      miniCtx.beginPath();
      miniCtx.arc(mx, my, lm.isPti ? 5.0 : (lm.c === 'hero' ? 4.2 : 3.2), 0, Math.PI * 2);
      miniCtx.fillStyle = lm.isPti ? '#4ade80' : (lm.c === 'hero' ? '#fbbf24' : '#d9ed9c');
      miniCtx.fill();
      miniCtx.strokeStyle = '#0f1714';
      miniCtx.lineWidth = 1.2;
      miniCtx.stroke();
    }

    const pulseM = (now * 0.0014) % 1.0;
    const blinkM = 0.65 + 0.35 * (0.5 + 0.5 * Math.sin(now * 0.008));
    miniCtx.save();
    miniCtx.beginPath();
    miniCtx.arc(w * 0.5, h * 0.5, 4 + pulseM * 14, 0, Math.PI * 2);
    miniCtx.strokeStyle = `rgba(56, 189, 248, ${(1 - pulseM) * 0.78})`;
    miniCtx.lineWidth = 1.6;
    miniCtx.stroke();

    miniCtx.translate(w * 0.5, h * 0.5);
    miniCtx.rotate(-yaw);
    miniCtx.globalAlpha = blinkM;
    miniCtx.fillStyle = '#38bdf8';
    miniCtx.strokeStyle = '#ffffff';
    miniCtx.lineWidth = 1.6;
    miniCtx.beginPath();
    miniCtx.moveTo(0, -8);
    miniCtx.lineTo(5.5, 6.5);
    miniCtx.lineTo(0, 3);
    miniCtx.lineTo(-5.5, 6.5);
    miniCtx.closePath();
    miniCtx.fill();
    miniCtx.stroke();
    miniCtx.restore();

    if (partnerInfo) {
      const adx = partnerInfo.x - playerPos.x;
      const adz = partnerInfo.z - playerPos.z;
      if (Math.abs(adx) <= spanMeters * 0.48 && Math.abs(adz) <= spanMeters * 0.48) {
        const amx = w * 0.5 + (adx / spanMeters) * w;
        const amy = h * 0.5 + (adz / spanMeters) * h;
        miniCtx.beginPath();
        miniCtx.arc(amx, amy, 5.2, 0, Math.PI * 2);
        miniCtx.fillStyle = '#f59e0b';
        miniCtx.fill();
        miniCtx.strokeStyle = '#0f1714';
        miniCtx.lineWidth = 1.6;
        miniCtx.stroke();
      }
    }

    if (gpsReadout && districtInfo) {
      const text = gpsWaypoint
        ? `🔵 GPS: ${gpsRouteDistM}m`
        : `${districtInfo.lat.toFixed(4)}°N · ${districtInfo.lon.toFixed(4)}°E`;
      if (gpsReadout.textContent !== text) gpsReadout.textContent = text;
    }
  }

  function openMap(playerPos, yaw, initialTab = 'map') {
    if (!mapModal) return;
    isOpen = true;
    lastPlayerPos = { x: playerPos.x, z: playerPos.z };
    lastPlayerYaw = yaw;
    populateLandmarkButtons(playerPos.x, playerPos.z);
    setActiveTab(initialTab);
    onSyncSettings?.();
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

  function toggleMap(playerPos, yaw, initialTab = 'map') {
    if (isOpen) closeMap();
    else openMap(playerPos, yaw, initialTab);
  }

  // Clicking (or double-clicking) anywhere on the map sets (or clears) a GTA V-style Yellow GPS Road Route!
  // NEVER teleports from the map canvas — only the right-side landmark list buttons teleport.
  let lastWaypointSetAt = 0;
  function handleMapCanvasWaypoint(e) {
    e.preventDefault();
    e.stopPropagation();
    const rect = fullCanvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * baseW;
    const py = ((e.clientY - rect.top) / rect.height) * baseH;
    const clickW = basePxToWorld(px, py);
    const now = performance.now();
    if (gpsWaypoint && (now - lastWaypointSetAt) > 380 && Math.hypot(gpsWaypoint.x - clickW.x, gpsWaypoint.z - clickW.z) < 55) {
      clearGpsWaypoint();
    } else {
      lastWaypointSetAt = now;
      setGpsWaypoint(clickW.x, clickW.z, 'GPS Waypoint');
    }
  }
  fullCanvas?.addEventListener('click', handleMapCanvasWaypoint);
  fullCanvas?.addEventListener('dblclick', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  mapCloseBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeMap();
    onResumeGame?.();
  });

  resumeGameBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeMap();
    onResumeGame?.();
  });

  myLocBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    pingUntil = performance.now() + 2600;
    populateLandmarkButtons(lastPlayerPos.x, lastPlayerPos.z);
    renderFullMap(lastPlayerPos, lastPlayerYaw);
  });

  clearGpsBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearGpsWaypoint();
  });

  return {
    get isOpen() {
      return isOpen;
    },
    get activeTab() {
      return activeTab;
    },
    landmarks: visibleLandmarks,
    setActiveTab,
    setPartnerInfo,
    openMap,
    closeMap,
    toggleMap,
    setGpsWaypoint,
    clearGpsWaypoint,
    renderMinimap,
    renderFullMap,
  };
}
