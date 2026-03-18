import { useMemo } from 'react';

/**
 * Haversine distance in kilometres between two lat/lng points.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns the nearest unresolved report to the user's current location,
 * augmented with a `distanceKm` field.  Returns null when location is
 * unavailable or there are no unresolved reports with coordinates.
 */
export function useNearestReport(reports = [], lat, lng) {
  return useMemo(() => {
    if (lat == null || lng == null) return null;

    const unresolved = reports.filter((r) => r.verification?.status !== 'resolved');

    if (unresolved.length === 0) return null;

    let nearest = null;
    let minDist = Infinity;

    for (const r of unresolved) {
      const rLat = r.location?.coordinates?.lat;
      const rLng = r.location?.coordinates?.lng;
      if (rLat == null || rLng == null) continue;
      const dist = haversineKm(lat, lng, rLat, rLng);
      if (dist < minDist) {
        minDist = dist;
        nearest = r;
      }
    }

    return nearest ? { ...nearest, distanceKm: minDist } : null;
  }, [reports, lat, lng]);
}
