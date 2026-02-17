import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import centroid from '@turf/centroid';
import distance from '@turf/distance';
import boundariesData from '../data/camarines-norte-boundaries.json';

function hasValidCoordinates(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng);
}

export function detectMunicipality(lat, lng) {
  if (!hasValidCoordinates(lat, lng)) return null;

  // Turf uses [longitude, latitude] order
  const pt = point([lng, lat]);

  for (const feature of boundariesData.features) {
    if (booleanPointInPolygon(pt, feature)) {
      return feature.properties.name;
    }
  }

  // Point is outside Camarines Norte
  return null;
}

export function isInCamarinesNorte(lat, lng) {
  return detectMunicipality(lat, lng) !== null;
}

export function getNearestMunicipality(lat, lng) {
  if (!hasValidCoordinates(lat, lng)) return null;

  const pt = point([lng, lat]);
  let nearest = null;
  let minDistance = Infinity;

  for (const feature of boundariesData.features) {
    const center = centroid(feature);
    const dist = distance(pt, center, { units: 'kilometers' });

    if (dist < minDistance) {
      minDistance = dist;
      nearest = feature.properties.name;
    }
  }

  return nearest;
}

export function resolveMunicipality(lat, lng, fallbackMunicipality = null) {
  const exactMatch = detectMunicipality(lat, lng);
  if (exactMatch) {
    return { municipality: exactMatch, method: 'polygon_match' };
  }

  const nearest = getNearestMunicipality(lat, lng);
  if (nearest) {
    return { municipality: nearest, method: 'nearest_centroid' };
  }

  return {
    municipality: fallbackMunicipality || 'Unknown',
    method: fallbackMunicipality ? 'fallback_input' : 'unknown'
  };
}
