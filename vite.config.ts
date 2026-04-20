import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

import { execSync } from 'child_process';

const commitHash = process.env.VERCEL_GIT_COMMIT_SHA
  ? process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7)
  : execSync('git rev-parse --short HEAD').toString().trim();

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3002,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      tailwindcss(),
      // Only enable PWA in production builds to avoid Service Worker
      // caching issues during local development
      ...(mode === 'production' ? [VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.png', 'og-image.png'],
        manifest: {
          name: 'Buyersona: Strategic AI Reports',
          short_name: 'Buyersona',
          description: 'Descubrí a tu cliente ideal, la mejor forma de captarlo y analiza a tu competencia con IA.',
          theme_color: '#4f46e5',
          background_color: '#f8fafc',
          display: 'standalone',
          icons: [
            {
              src: 'favicon.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'favicon.png',
              sizes: '192x192',
              type: 'image/png'
            }
          ]
        }
      })] : []),
    ],
    define: {
      '__APP_VERSION__': JSON.stringify(commitHash)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
