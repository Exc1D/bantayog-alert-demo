import { sentryConfig } from './sentry.js';

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

function validateEnv() {
  const isTestMode = import.meta.env.VITE_APP_ENV === 'test' || process.env.NODE_ENV === 'test';

  const missing = requiredEnvVars.filter((key) => {
    const value = import.meta.env[key];
    return !value || value.includes('YOUR_');
  });

  if (missing.length > 0) {
    console.error('\n========================================');
    console.error('Missing required environment variables:');
    missing.forEach((key) => console.error(`  - ${key}`));
    console.error('\nPlease check your .env file or .env.local');
    console.error('See .env.example for reference.');
    console.error('========================================\n');

    if (isTestMode) {
      console.warn('Running in test mode - using default values');
      return;
    }

    if (import.meta.env.VITE_APP_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}

validateEnv();

export const appConfig = Object.freeze({
  env: import.meta.env.VITE_APP_ENV || 'development',
  version: '1.0.0',
  name: 'Bantayog Alert',
  isDevelopment: (import.meta.env.VITE_APP_ENV || 'development') === 'development',
  isProduction: import.meta.env.VITE_APP_ENV === 'production',
});

export const firebaseConfig = Object.freeze({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
});

export const fcmConfig = Object.freeze({
  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
});

export const apiConfig = Object.freeze({
  openWeatherApiKey: import.meta.env.VITE_OPENWEATHER_API_KEY,
  openWeatherBaseUrl: 'https://api.openweathermap.org/data/2.5',
});

export const config = {
  app: appConfig,
  firebase: firebaseConfig,
  fcm: fcmConfig,
  api: apiConfig,
  sentry: sentryConfig,
};

export default config;
