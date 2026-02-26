import { describe, it, expect, vi } from 'vitest';
import { fetchCurrentWeather, fetchForecast, fetchWeatherAlerts } from './weatherAPI';

vi.mock('./sentry', () => ({
  captureException: vi.fn(),
}));

const mockFetch = vi.fn();

global.fetch = mockFetch;

describe('weatherAPI', () => {
  describe('fetchCurrentWeather', () => {
    it('returns mock weather when no API key', async () => {
      const result = await fetchCurrentWeather(14.11, 122.95);
      expect(result).toHaveProperty('temperature');
      expect(result).toHaveProperty('condition');
    });

    it('returns mock weather with expected properties', async () => {
      const result = await fetchCurrentWeather(14.11, 122.95);
      expect(result.temperature).toBe(28);
      expect(result.feelsLike).toBe(32);
      expect(result.condition).toBe('Partly Cloudy');
      expect(result.windSpeed).toBe(15);
    });
  });

  describe('fetchForecast', () => {
    it('returns mock forecast when no API key', async () => {
      const result = await fetchForecast(14.11, 122.95);
      expect(Array.isArray(result)).toBe(true);
    });

    it('returns forecast with 5 days', async () => {
      const result = await fetchForecast(14.11, 122.95);
      expect(result.length).toBe(5);
    });
  });

  describe('fetchWeatherAlerts', () => {
    it('returns empty array when no API key', async () => {
      const result = await fetchWeatherAlerts(14.11, 122.95);
      expect(result).toEqual([]);
    });
  });
});
