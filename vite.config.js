import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import viteCompression from 'vite-plugin-compression';
import path from 'path';

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
    resolve: {
      alias: {
        // Force react and react-dom to always resolve to the same instance
        // This prevents react-leaflet-markercluster's bundled React 17 from
        // creating a separate React instance that breaks forwardRef/useState
        react: path.resolve('./node_modules/react'),
        'react-dom': path.resolve('./node_modules/react-dom'),
      },
    },
    server: {
      port: 5173,
      host: true,
    },
    esbuild: isProduction || isStaging ? { drop: ['console', 'debugger'], legalComments: 'none' } : {},
    build: {
      // Use esbuild instead of terser — terser's module/tolevel rewriting
      // breaks dual-React scenarios where nested node_modules ship their own React
      minify: isProduction ? 'esbuild' : false,
      outDir: 'dist',
      sourcemap: (isProduction || isStaging) && hasSentryToken,
      target: 'es2020',
      cssMinify: true,
      chunkSizeWarningLimit: isStaging ? 1500 : 1000,
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
              if (id.includes('firebase/auth')) {
                return 'vendor-firebase-auth';
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
      force: true,
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
