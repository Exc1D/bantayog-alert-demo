import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWeather, useAllMunicipalitiesWeather } from './useWeather';

vi.mock('../utils/weatherAPI', () => ({
  fetchCurrentWeather: vi.fn(() => Promise.resolve({ temp: 25 })),
  fetchForecast: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../utils/constants', () => ({
  MUNICIPALITY_COORDS: {
    Daet: { lat: 14.11, lng: 122.95 },
    Mercedes: { lat: 14.1, lng: 123.03 },
    Manila: { lat: 14.6, lng: 120.98 },
  },
  WEATHER_CACHE_DURATION: 300000,
}));

describe('useWeather', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', async () => {
    const { result } = renderHook(() => useWeather('Daet'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('has refresh function', () => {
    const { result } = renderHook(() => useWeather('Daet'));
    expect(typeof result.current.refresh).toBe('function');
  });
});

describe('useAllMunicipalitiesWeather', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', async () => {
    const { result } = renderHook(() => useAllMunicipalitiesWeather());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
