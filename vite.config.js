import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'generateSW',
      // 'prompt', not 'autoUpdate': this app already has a real, tested
      // "A new version of Chavee is available — Reload" experience for
      // stale JS chunks (ErrorBoundary.jsx, from the code-splitting work).
      // 'autoUpdate' would introduce a second, inconsistent update path —
      // a silent, unannounced page reload the moment a new SW is detected,
      // with no user control over timing. 'prompt' keeps updates
      // user-initiated, matching the existing pattern (wired via
      // virtual:pwa-register/react in src/components/UpdatePrompt.jsx).
      registerType: 'prompt',
      injectRegister: false,

      // The real public/manifest.json (with the icon fixes above) is
      // already linked in index.html — don't have the plugin generate or
      // inject a second, competing manifest/theme-color tag.
      manifest: false,
      injectThemeColor: false,

      // Precache only real static build output — JS/CSS/HTML plus the
      // image/font types actually shipped (icons, platform-preview/
      // featured/founders photos, fonts). No API/data caching here.
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp,woff,woff2}'],
        navigateFallback: '/index.html',
        // No runtimeCaching entries at all — Workbox's generateSW then has
        // no route configured for anything outside the precached, same-
        // origin build output. Supabase calls go to a different origin
        // (dtokistffdnycrzbmxcr.supabase.co) and are never precached, so
        // they're never intercepted or served from the SW's cache —
        // confirmed by omission, not just assumed, and re-verified live
        // after building (see verification notes).
        runtimeCaching: [],
      },

      // Public files that aren't part of Vite's JS/CSS asset graph but
      // are still real, current static files worth precaching.
      includeAssets: [
        'favicon.png',
        'logo.png',
        'robots.txt',
        'assets/icon-72.png',
        'assets/icon-96.png',
        'assets/icon-128.png',
        'assets/icon-192.png',
        'assets/icon-512.png',
        'assets/icon-maskable-192.png',
        'assets/icon-maskable-512.png',
      ],
    }),
  ],
  build: {
    outDir: 'dist',
    // Generate sourcemaps for debugging (remove in strict prod if needed)
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  // Ensure assets are served with correct base path on chavee.in
  base: '/',
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
});

