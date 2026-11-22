export const KHULNA_ORIGIN_LAT = 22.807619;
export const KHULNA_ORIGIN_LON = 89.5692802;
export const METERS_PER_LAT = 110740.0;
export const METERS_PER_LON = 111320.0 * Math.cos((KHULNA_ORIGIN_LAT * Math.PI) / 180);

// Hero Building World Anchors:
// 1) 35 Haji Mohsin Rd (SK Arshan Alif Tower + Fakir Bari Lane) sits directly at world origin (0, 0..28)
export const HAJI_MOHSIN_OFFSET = { x: 0.0, y: 0.0, z: 0.0 };

// 2) 5-Story Taltola House (তালতলার বাসা) — compact Khulna layout right near Haji Mohsin Rd, Kaborkhana & Alia Madrasah!
export const TALTOLA_HOUSE_OFFSET = { x: 64.0, y: 0.0, z: 222.0 };

export function latLonToWorldXZ(lat, lon) {
  return {
    x: (lon - KHULNA_ORIGIN_LON) * METERS_PER_LON,
    z: (KHULNA_ORIGIN_LAT - lat) * METERS_PER_LAT,
  };
}

export function worldXZToLatLon(x, z) {
  return {
    lat: KHULNA_ORIGIN_LAT - z / METERS_PER_LAT,
    lon: KHULNA_ORIGIN_LON + x / METERS_PER_LON,
  };
}

export function clampToKhulnaBounds(pos, bounds) {
  const [minX, maxX, minZ, maxZ] = bounds;
  if (pos.x < minX + 4) pos.x = minX + 4;
  if (pos.x > maxX - 4) pos.x = maxX - 4;
  if (pos.z < minZ + 4) pos.z = minZ + 4;
  if (pos.z > maxZ - 4) pos.z = maxZ - 4;
}
