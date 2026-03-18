// src/hooks/useNearestReport.test.js
import { describe, it, expect } from 'vitest';
import { useNearestReport } from './useNearestReport';
import { renderHook } from '@testing-library/react';

const mkReport = (id, lat, lng, status = 'verified') => ({
  id,
  location: { coordinates: { lat, lng } },
  verification: { status },
});

describe('useNearestReport', () => {
  it('returns null when lat/lng are not provided', () => {
    const { result } = renderHook(() =>
      useNearestReport([mkReport('r1', 14.1, 122.5)], null, null)
    );
    expect(result.current).toBeNull();
  });

  it('returns null when all reports are resolved', () => {
    const reports = [mkReport('r1', 14.1, 122.5, 'resolved')];
    const { result } = renderHook(() => useNearestReport(reports, 14.1, 122.5));
    expect(result.current).toBeNull();
  });

  it('returns null when no reports have coordinates', () => {
    const reports = [{ id: 'r1', location: {}, verification: { status: 'pending' } }];
    const { result } = renderHook(() => useNearestReport(reports, 14.1, 122.5));
    expect(result.current).toBeNull();
  });

  it('returns the nearest report with distanceKm', () => {
    const reports = [
      mkReport('far', 14.5, 122.5), // farther
      mkReport('near', 14.1, 122.5), // closer (same lng, small lat diff)
    ];
    const { result } = renderHook(() => useNearestReport(reports, 14.1, 122.5));
    expect(result.current).not.toBeNull();
    expect(result.current.id).toBe('near');
    expect(result.current.distanceKm).toBeGreaterThanOrEqual(0);
  });
});
