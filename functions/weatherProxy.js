'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');


const REGION = 'asia-southeast1';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Camarines Norte boundary validation (server-side enforcement)
const VALID_LAT_MIN = 12.5;
const VALID_LAT_MAX = 15.5;
const VALID_LNG_MIN = 122.0;
const VALID_LNG_MAX = 124.0;

function isValidLat(lat) {
  return typeof lat === 'number' && lat >= VALID_LAT_MIN && lat <= VALID_LAT_MAX;
}

function isValidLng(lng) {
  return typeof lng === 'number' && lng >= VALID_LNG_MIN && lng <= VALID_LNG_MAX;
}

function degreesToCardinal(degrees) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(degrees / 45) % 8];
}

/**
 * Weather proxy — keeps OpenWeather API key server-side.
 *
 * Called by the client as a regular HTTPS endpoint (not a callable function),
 * so the API key is never exposed in the client bundle.
 *
 * Usage:
 *   GET /weatherProxy?lat=14.1&lng=122.9&endpoint=weather
 */
const ALLOWED_ORIGINS = [
  'https://bantayogalert.web.app',
  'https://bantayogalert.firebaseapp.com',
];

exports.weatherProxy = functions.region(REGION).https.onRequest(async (req, res) => {
  // CORS headers for client-side fetch — validate origin against allowlist
  const origin = req.headers.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.set('Access-Control-Allow-Origin', allowedOrigin);
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { lat, lng, endpoint = 'weather' } = req.query;

  // Validate required params
  if (lat === undefined || lng === undefined) {
    res.status(400).json({ error: 'lat and lng query parameters are required' });
    return;
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  if (isNaN(latNum) || isNaN(lngNum)) {
    res.status(400).json({ error: 'lat and lng must be valid numbers' });
    return;
  }

  // Validate coordinates (Camarines Norte bounds)
  if (!isValidLat(latNum) || !isValidLng(lngNum)) {
    res.status(400).json({
      error: 'Coordinates out of valid range',
      validRange: {
        lat: [VALID_LAT_MIN, VALID_LAT_MAX],
        lng: [VALID_LNG_MIN, VALID_LNG_MAX],
      },
    });
    return;
  }

  // Get API key from functions config (set via: firebase functions:config:set weather.apikey="...")
  const apiKey = functions.config().weather?.apikey;
  if (!apiKey) {
    console.error('weatherProxy: OPENWEATHER_API_KEY not configured in functions.config().weather.apikey');
    res.status(500).json({ error: 'Weather service not configured' });
    return;
  }

  // Build OpenWeather URL
  let url;
  try {
    switch (endpoint) {
      case 'weather':
        url = `${BASE_URL}/weather?lat=${latNum}&lon=${lngNum}&appid=${apiKey}&units=metric`;
        break;
      case 'forecast':
        url = `${BASE_URL}/forecast?lat=${latNum}&lon=${lngNum}&appid=${apiKey}&units=metric`;
        break;
      case 'alerts':
        url = `${BASE_URL}/onecall?lat=${latNum}&lon=${lngNum}&appid=${apiKey}&exclude=minutely,hourly&units=metric`;
        break;
      default:
        res.status(400).json({ error: `Unknown endpoint: ${endpoint}. Use: weather, forecast, or alerts` });
        return;
    }

    const response = await fetch(url);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`weatherProxy: OpenWeather API error ${response.status}: ${errText}`);
      res.status(502).json({ error: 'Weather provider returned an error', status: response.status });
      return;
    }

    const data = await response.json();

    // Normalize response
    if (endpoint === 'weather') {
      res.json({
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        windSpeed: Math.round(data.wind.speed * 3.6),
        windDirection: degreesToCardinal(data.wind.deg),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        visibility: data.visibility,
      });
    } else if (endpoint === 'forecast') {
      const dailyMap = {};
      for (const item of data.list) {
        const date = item.dt_txt.split(' ')[0];
        if (!dailyMap[date]) {
          dailyMap[date] = {
            date,
            tempMax: item.main.temp_max,
            tempMin: item.main.temp_min,
            condition: item.weather[0].main,
            icon: item.weather[0].icon,
            rainfall: item.rain ? item.rain['3h'] || 0 : 0,
          };
        } else {
          dailyMap[date].tempMax = Math.max(dailyMap[date].tempMax, item.main.temp_max);
          dailyMap[date].tempMin = Math.min(dailyMap[date].tempMin, item.main.temp_min);
          dailyMap[date].rainfall += item.rain ? item.rain['3h'] || 0 : 0;
        }
      }
      res.json(
        Object.values(dailyMap)
          .slice(0, 5)
          .map((day) => ({
            ...day,
            tempMax: Math.round(day.tempMax),
            tempMin: Math.round(day.tempMin),
            rainfall: Math.round(day.rainfall),
          }))
      );
    } else if (endpoint === 'alerts') {
      res.json(data.alerts || []);
    }
  } catch (error) {
    console.error('weatherProxy: fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});
