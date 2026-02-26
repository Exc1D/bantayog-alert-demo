import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const isStaging = mode === 'staging';
  const hasSentryToken = !!process.env.SENTRY_AUTH_TOKEN;

  return {
    plugins: [
      tsconfigPaths(),
      react(),
      (isProduction || isStaging) &&
        viteCompression({
          algorithm: 'gzip',
          ext: '.gz',
          threshold: 10240,
        }),
      (isProduction || isStaging) &&
        hasSentryToken &&
        sentryVitePlugin({
          org: process.env.SENTRY_ORG || 'your-org',
          project: process.env.SENTRY_PROJECT || 'bantayog-alert',
          authToken: process.env.SENTRY_AUTH_TOKEN,
          sourcemaps: {
            assets: './dist/**',
            ignore: ['node_modules'],
          },
          release: {
            name: `bantayog-alert@${process.env.npm_package_version || '1.0.0'}`,
            create: true,
            finalize: true,
            setCommits: {
              auto: true,
            },
          },
          telemetry: false,
        }),
    ].filter(Boolean),
    server: {
      port: 5173,
      host: true,
    },
    esbuild: isProduction || isStaging ? { drop: ['console', 'debugger'] } : {},
    build: {
      minify: isProduction ? 'terser' : false,
      outDir: 'dist',
      sourcemap: (isProduction || isStaging) && hasSentryToken,
      target: 'es2020',
      cssMinify: true,
      chunkSizeWarningLimit: isStaging ? 1500 : 1000,
      terserOptions: isProduction
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info', 'console.debug'],
              passes: 2,
              ecma: 2020,
              module: true,
              toplevel: true,
            },
            mangle: {
              safari10: true,
              properties: false,
            },
            format: {
              comments: false,
              ecma: 2020,
            },
          }
        : {},
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('@turf')) {
                return 'vendor-turf';
              }
              if (id.includes('date-fns')) {
                return 'vendor-date';
              }
              if (id.includes('@sentry')) {
                return 'vendor-sentry';
              }
              if (id.includes('leaflet') || id.includes('react-leaflet')) {
                return 'vendor-map';
              }
              if (id.includes('firebase/storage')) {
                return 'vendor-firebase-storage';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor-react';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'firebase/app', 'firebase/firestore'],
      exclude: ['@sentry/react'],
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.js',
      include: ['src/**/*.{test,spec}.{js,jsx}'],
      exclude: ['**/e2e/**', '**/node_modules/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/setupTests.js',
          'src/test/**',
          'e2e/**',
          'src/data/**',
          'src/utils/sentry.js',
          'src/utils/rateLimiter.js',
          'src/hooks/useAuth.js',
          'src/hooks/useReports.js',
        ],
      },
    },
  };
});
