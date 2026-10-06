import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load from the repo root so one .env serves both frontend and backend.
  const env = loadEnv(mode, path.resolve(__dirname, '../'), '');

  return {
    plugins: [react()],

    server: {
      port: 5173,
      hmr: {
        host: 'localhost',
        port: 5173,
      },
      proxy: {
        // Lets the app call relative /api paths during development.
        // The axios client uses an absolute base URL, so this is a fallback
        // for anything that hits the API without one.
        '/api': {
          target: env.VITE_BACKEND_SERVER || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },

    define: {
      'import.meta.env.VITE_BACKEND_SERVER': JSON.stringify(
        env.VITE_BACKEND_SERVER || 'http://localhost:8000'
      ),
    },
  };
});