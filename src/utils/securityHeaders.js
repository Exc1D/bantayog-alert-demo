const FIREBASE_DOMAINS = [
  '*.firebaseapp.com',
  '*.googleapis.com',
  '*.firebasestorage.app',
  '*.cloudfunctions.net',
];

const TILE_DOMAINS = ['*.tile.openstreetmap.org', '*.openstreetmap.org'];

const WEATHER_DOMAINS = ['api.openweathermap.org'];

const SENTRY_DOMAINS = ['*.ingest.sentry.io', '*.sentry.io'];

export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:', ...TILE_DOMAINS, ...FIREBASE_DOMAINS],
  'font-src': ["'self'"],
  'connect-src': ["'self'", ...FIREBASE_DOMAINS, ...WEATHER_DOMAINS, ...SENTRY_DOMAINS],
  'frame-src': ["'self'", ...FIREBASE_DOMAINS],
  'media-src': ["'self'", 'blob:', ...FIREBASE_DOMAINS],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
};

export function buildCSPString(directives = CSP_DIRECTIVES) {
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

export const RECOMMENDED_HEADERS = {
  'Content-Security-Policy': buildCSPString(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(self), payment=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

export const CORS_CONFIG = {
  allowedOrigins: [
    'https://bantayog-alert-demo-36b27.web.app',
    'https://bantayog-alert-demo-36b27.firebaseapp.com',
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};

export function buildFirebaseHostingHeaders() {
  return Object.entries(RECOMMENDED_HEADERS).map(([key, value]) => ({
    key,
    value,
  }));
}

export function getMetaCSPTag() {
  return buildCSPString({
    ...CSP_DIRECTIVES,
    'frame-ancestors': undefined,
    'upgrade-insecure-requests': undefined,
  });
}
