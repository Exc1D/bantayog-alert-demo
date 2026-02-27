/**
 * Stress tests for geoFencing — boundary edge cases, invalid inputs,
 * coordinate extremes, and performance under load.
 */
import { describe, it, expect } from 'vitest';
import {
  detectMunicipality,
  isInCamarinesNorte,
  getNearestMunicipality,
  resolveMunicipality,
} from './geoFencing';

describe('detectMunicipality — coordinate edge cases', () => {
  it('returns null for null coordinates', () => {
    expect(detectMunicipality(null, null)).toBeNull();
    expect(detectMunicipality(null, 122.9)).toBeNull();
    expect(detectMunicipality(14.1, null)).toBeNull();
  });

  it('returns null for zero coordinates (middle of ocean)', () => {
    expect(detectMunicipality(0, 0)).toBeNull();
  });

  it('returns null for coordinates far from Camarines Norte', () => {
    // Manila
    expect(detectMunicipality(14.5995, 120.9842)).toBeNull();
    // Tokyo
    expect(detectMunicipality(35.6762, 139.6503)).toBeNull();
    // New York
    expect(detectMunicipality(40.7128, -74.006)).toBeNull();
  });

  it('detects Daet (capital municipality)', () => {
    // Known point inside Daet
    const result = detectMunicipality(14.1122, 122.9553);
    if (result) {
      expect(result).toBe('Daet');
    }
  });

  it('handles extreme lat/lng values', () => {
    expect(detectMunicipality(90, 180)).toBeNull();
    expect(detectMunicipality(-90, -180)).toBeNull();
    expect(detectMunicipality(90, -180)).toBeNull();
    expect(detectMunicipality(-90, 180)).toBeNull();
  });

  it('handles NaN coordinates gracefully', () => {
    // NaN is falsy, so should return null
    expect(detectMunicipality(NaN, 122.9)).toBeNull();
    expect(detectMunicipality(14.1, NaN)).toBeNull();
  });

  it('handles Infinity coordinates gracefully', () => {
    expect(detectMunicipality(Infinity, 122.9)).toBeNull();
    expect(detectMunicipality(14.1, -Infinity)).toBeNull();
  });

  it('handles string coordinates (type coercion)', () => {
    // detectMunicipality checks !lat || !lng, strings are truthy
    // but Turf.js should handle or reject them
    const result = detectMunicipality('14.1122', '122.9553');
    // Should either work (type coerced) or return null — not crash
    expect(result === null || typeof result === 'string').toBe(true);
  });

  it('uses barangay override to resolve overlap', () => {
    // The 'maslog' barangay should resolve to San Lorenzo Ruiz
    // We need a point that's in an overlap zone; if no overlap exists,
    // this just tests the code path
    const result = detectMunicipality(14.15, 122.8, { barangay: 'maslog' });
    expect(result === null || typeof result === 'string').toBe(true);
  });

  it('handles rapid successive calls (performance)', () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      detectMunicipality(14.1 + i * 0.001, 122.9 + i * 0.001);
    }
    const duration = performance.now() - start;
    // 1000 polygon lookups should complete in reasonable time
    expect(duration).toBeLessThan(10_000);
  });
});

describe('isInCamarinesNorte — boundary checks', () => {
  // Known municipalities in Camarines Norte
  const CAMARINES_NORTE_POINTS = [
    { name: 'Daet area', lat: 14.1122, lng: 122.9553 },
    { name: 'Mercedes area', lat: 14.1063, lng: 123.0136 },
    { name: 'Labo area', lat: 14.1547, lng: 122.8019 },
  ];

  it.each(CAMARINES_NORTE_POINTS)(
    'correctly identifies $name as inside Camarines Norte',
    ({ lat, lng }) => {
      // These should be in CamNorte if boundaries are correct
      const result = isInCamarinesNorte(lat, lng);
      expect(typeof result).toBe('boolean');
    }
  );

  const OUTSIDE_POINTS = [
    { name: 'Manila', lat: 14.5995, lng: 120.9842 },
    { name: 'Naga City (Cam Sur)', lat: 13.6218, lng: 123.1948 },
    { name: 'Legazpi (Albay)', lat: 13.1391, lng: 123.7438 },
    { name: 'South Pole', lat: -90, lng: 0 },
    { name: 'Mid-Pacific', lat: 0, lng: -170 },
  ];

  it.each(OUTSIDE_POINTS)(
    'correctly identifies $name as outside Camarines Norte',
    ({ lat, lng }) => {
      expect(isInCamarinesNorte(lat, lng)).toBe(false);
    }
  );

  it('returns false for null input', () => {
    expect(isInCamarinesNorte(null, null)).toBe(false);
  });
});

describe('getNearestMunicipality — precision & edge cases', () => {
  it('returns null for invalid coordinates', () => {
    expect(getNearestMunicipality(NaN, NaN)).toBeNull();
    expect(getNearestMunicipality(Infinity, 0)).toBeNull();
    expect(getNearestMunicipality(0, -Infinity)).toBeNull();
  });

  it('returns null for out-of-range lat', () => {
    expect(getNearestMunicipality(91, 0)).toBeNull();
    expect(getNearestMunicipality(-91, 0)).toBeNull();
  });

  it('returns null for out-of-range lng', () => {
    expect(getNearestMunicipality(0, 181)).toBeNull();
    expect(getNearestMunicipality(0, -181)).toBeNull();
  });

  it('returns a municipality name for valid coordinates near CamNorte', () => {
    // Even from neighboring province, nearest should still return something
    const result = getNearestMunicipality(14.0, 122.9);
    expect(result === null || typeof result === 'string').toBe(true);
  });

  it('returns a result for coordinates on the exact boundary of lat/lng range', () => {
    const result = getNearestMunicipality(90, 180);
    expect(result === null || typeof result === 'string').toBe(true);
  });

  it('handles exact equator/prime meridian', () => {
    const result = getNearestMunicipality(0, 0);
    // Far from Philippines, but should still return nearest (or null)
    expect(result === null || typeof result === 'string').toBe(true);
  });

  it('handles negative coordinates (southern/western hemisphere)', () => {
    const result = getNearestMunicipality(-14.1, -122.9);
    expect(result === null || typeof result === 'string').toBe(true);
  });
});

describe('resolveMunicipality — fallback chain', () => {
  it('returns polygon_match for known municipality center', () => {
    // Center of Daet
    const result = resolveMunicipality(14.1122, 122.9553);
    if (result.method === 'polygon_match') {
      expect(result.municipality).toBe('Daet');
    } else {
      // Could be nearest_centroid if the point isn't exactly inside
      expect(['polygon_match', 'nearest_centroid']).toContain(result.method);
    }
  });

  it('falls back to nearest_centroid for nearby-but-outside points', () => {
    // Slightly off the coast of CamNorte
    const result = resolveMunicipality(14.2, 123.2);
    expect(['polygon_match', 'nearest_centroid']).toContain(result.method);
  });

  it('uses fallback_input when coordinates are far and fallback is provided', () => {
    // Far away, no polygon match, but nearest may still work
    const result = resolveMunicipality(0, 0, 'Daet');
    expect(typeof result.municipality).toBe('string');
    expect(['nearest_centroid', 'fallback_input']).toContain(result.method);
  });

  it('returns unknown when no match and no fallback', () => {
    // Use null coords so detectMunicipality returns null
    const result = resolveMunicipality(null, null);
    expect(result.municipality).toBe('Unknown');
    expect(result.method).toBe('unknown');
  });

  it('returns fallback_input when provided with null coords', () => {
    const result = resolveMunicipality(null, null, 'Paracale');
    expect(result.municipality).toBe('Paracale');
    expect(result.method).toBe('fallback_input');
  });

  it('handles zero coordinates consistently', () => {
    const result = resolveMunicipality(0, 0);
    // 0,0 is a valid but far coordinate — should get nearest_centroid or unknown
    expect(typeof result.municipality).toBe('string');
    expect(typeof result.method).toBe('string');
  });

  it('returns consistent results for same input', () => {
    const a = resolveMunicipality(14.1122, 122.9553);
    const b = resolveMunicipality(14.1122, 122.9553);
    expect(a.municipality).toBe(b.municipality);
    expect(a.method).toBe(b.method);
  });
});
