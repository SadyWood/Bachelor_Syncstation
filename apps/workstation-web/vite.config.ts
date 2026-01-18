import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      '@hk26/schema': path.resolve(__dirname, '../../packages/schema/src/index.ts'),
    },
  },
  server: {
    proxy: {
      '/ws': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
    },
  },
  // SPA fallback - serve index.html for 404s (enabled by default in Vite)
  appType: 'spa',
});