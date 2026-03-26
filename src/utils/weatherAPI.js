import { captureException } from './sentry';

// Weather proxy Cloud Function — API key stays server-side
const WEATHER_PROXY_URL = 'https://asia-southeast1-bantayogalert.cloudfunctions.net/weatherProxy';

export async function fetchCurrentWeather(lat, lng) {
  try {
    const response = await fetch(`${WEATHER_PROXY_URL}?lat=${lat}&lng=${lng}&endpoint=weather`);

    if (!response.ok) throw new Error('Weather fetch failed');

    const data = await response.json();
    return data;
  } catch (error) {
    captureException(error, { tags: { component: 'weatherAPI', endpoint: 'current' } });
    return getMockWeather();
  }
}

export async function fetchForecast(lat, lng) {
  try {
    const response = await fetch(`${WEATHER_PROXY_URL}?lat=${lat}&lng=${lng}&endpoint=forecast`);

    if (!response.ok) throw new Error('Forecast fetch failed');

    const data = await response.json();
    return data;
  } catch (error) {
    captureException(error, { tags: { component: 'weatherAPI', endpoint: 'forecast' } });
    return getMockForecast();
  }
}

export async function fetchWeatherAlerts(lat, lng) {
  try {
    const response = await fetch(`${WEATHER_PROXY_URL}?lat=${lat}&lng=${lng}&endpoint=alerts`);

    if (!response.ok) return [];

    const data = await response.json();
    return data;
  } catch {
    return [];
  }
}

function getMockWeather() {
  return {
    temperature: 28,
    feelsLike: 32,
    condition: 'Partly Cloudy',
    description: 'partly cloudy',
    icon: '02d',
    windSpeed: 15,
    windDirection: 'NE',
    humidity: 75,
    pressure: 1013,
    visibility: 10000,
  };
}

function getMockForecast() {
  const today = new Date();
  return Array.from({ length: 5 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    return {
      date: date.toISOString().split('T')[0],
      tempMax: 32 - i,
      tempMin: 25 + i,
      condition: ['Clouds', 'Rain', 'Thunderstorm', 'Rain', 'Clouds'][i],
      icon: ['03d', '10d', '11d', '10d', '03d'][i],
      rainfall: [0, 15, 45, 20, 5][i],
    };
  });
}
