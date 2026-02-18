const getEnvString = (key, defaultValue = '') => import.meta.env[key] || defaultValue;

const environment = getEnvString('VITE_APP_ENV', 'development');

export const sentryConfig = Object.freeze({
  dsn: getEnvString('VITE_SENTRY_DSN', ''),
  environment,
  release: `bantayog-alert@${getEnvString('npm_package_version', '1.0.0')}`,
  
  enabled: !!getEnvString('VITE_SENTRY_DSN', ''),
  
  isDevelopment: environment === 'development',
  isProduction: environment === 'production',
  
  sampleRate: environment === 'production' ? 1.0 : 0.5,
  
  tracesSampleRate: environment === 'production' ? 0.1 : 0.0,
  
  profilesSampleRate: environment === 'production' ? 0.1 : 0.0,
  
  replaysSessionSampleRate: environment === 'production' ? 0.1 : 0.0,
  replaysOnErrorSampleRate: environment === 'production' ? 1.0 : 0.5,
  
  integrations: {
    browserTracing: {
      tracePropagationTargets: ['localhost', /^https:\/\/[\w-]+\.firebaseapp\.com/, /^https:\/\/[\w-]+\.web\.app/],
    },
    replay: {
      maskAllText: true,
      blockAllMedia: true,
    },
  },
  
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    'Non-Error promise rejection captured',
    'undefined is not an object (evaluating',
    'cancelled',
    'canceled',
  ],
  
  denyUrls: [
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /googletagmanager\.com/i,
    /google-analytics\.com/i,
  ],
});

export default sentryConfig;
