import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const hasSentryToken = !!process.env.SENTRY_AUTH_TOKEN;

  return {
    plugins: [
      react(),
      isProduction && hasSentryToken && sentryVitePlugin({
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
      port: 3000,
      open: true,
    },
    esbuild: isProduction ? { drop: ['console', 'debugger'] } : {},
    build: {
      minify: 'esbuild',
      outDir: 'dist',
      sourcemap: isProduction && hasSentryToken,
      target: 'es2020',
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
            'firebase-storage': ['firebase/storage'],
            map: ['leaflet', 'react-leaflet'],
            sentry: ['@sentry/react'],
            turf: ['@turf/boolean-point-in-polygon', '@turf/centroid', '@turf/distance', '@turf/helpers'],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.js',
      include: ['**/*.{test,spec}.{js,jsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/setupTests.js',
          'src/test/**',
        ],
      },
    },
  };
});
