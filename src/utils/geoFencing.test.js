import { describe, it, expect, vi } from 'vitest';

vi.mock('@turf/boolean-point-in-polygon', () => ({
  default: vi.fn((point, feature) => {
    const coords = point.geometry.coordinates;
    const polygon = feature.geometry.coordinates[0];
    const minX = Math.min(...polygon.map((p) => p[0]));
    const maxX = Math.max(...polygon.map((p) => p[0]));
    const minY = Math.min(...polygon.map((p) => p[1]));
    const maxY = Math.max(...polygon.map((p) => p[1]));
    return coords[0] >= minX && coords[0] <= maxX && coords[1] >= minY && coords[1] <= maxY;
  }),
}));

vi.mock('@turf/centroid', () => ({
  default: vi.fn((feature) => ({
    geometry: {
      coordinates: [122.15, 14.05],
    },
    properties: feature.properties,
  })),
}));

vi.mock('@turf/distance', () => ({
  default: vi.fn(() => 10),
}));

vi.mock('../data/camarines-norte-boundaries.json', () => ({
  default: {
    features: [
      {
        properties: { name: 'Daet' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [122.0, 14.0],
              [122.1, 14.0],
              [122.1, 14.1],
              [122.0, 14.1],
              [122.0, 14.0],
            ],
          ],
        },
      },
      {
        properties: { name: 'Mercedes' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [122.1, 14.0],
              [122.2, 14.0],
              [122.2, 14.1],
              [122.1, 14.1],
              [122.1, 14.0],
            ],
          ],
        },
      },
    ],
  },
}));

vi.mock('../utils/constants', () => ({
  MUNICIPALITY_COORDS: {
    Daet: { lat: 14.11, lng: 122.95 },
    Mercedes: { lat: 14.1, lng: 123.03 },
  },
}));

import {
  detectMunicipality,
  isInCamarinesNorte,
  getNearestMunicipality,
  resolveMunicipality,
} from './geoFencing';

describe('geoFencing', () => {
  describe('detectMunicipality', () => {
    it('returns null for missing coordinates', () => {
      expect(detectMunicipality(null, 122.05)).toBeNull();
      expect(detectMunicipality(14.05, null)).toBeNull();
      expect(detectMunicipality(undefined, undefined)).toBeNull();
    });

    it('returns municipality when point is inside polygon', () => {
      const result = detectMunicipality(14.05, 122.05);
      expect(result).toBeTruthy();
    });
  });

  describe('isInCamarinesNorte', () => {
    it('returns true when coordinates are provided', () => {
      expect(isInCamarinesNorte(14.05, 122.05)).toBeTruthy();
    });

    it('returns false for invalid coordinates', () => {
      expect(isInCamarinesNorte(null, null)).toBe(false);
    });
  });

  describe('getNearestMunicipality', () => {
    it('returns null for invalid coordinates', () => {
      expect(getNearestMunicipality(null, null)).toBeNull();
      expect(getNearestMunicipality(NaN, 122.05)).toBeNull();
    });

    it('returns a municipality for valid coordinates', () => {
      const result = getNearestMunicipality(14.05, 122.15);
      expect(result).toBeTruthy();
    });
  });

  describe('resolveMunicipality', () => {
    it('returns municipality object for valid coordinates', () => {
      const result = resolveMunicipality(14.05, 122.05, 'Fallback');
      expect(result).toHaveProperty('municipality');
      expect(result).toHaveProperty('method');
    });

    it('returns fallback when no match', () => {
      const result = resolveMunicipality(0, 0, 'Unknown');
      expect(result.municipality).toBeTruthy();
    });

    it('returns unknown method when no fallback', () => {
      const result = resolveMunicipality(0, 0, null);
      expect(result.method).toBeTruthy();
    });
  });
});
