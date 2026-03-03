import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load environment variables from the correct .env file
  const env = loadEnv(mode, path.resolve(__dirname, '../../'), '');

  return {
    plugins: [react()],

    server: {
      hmr: {
        host: 'localhost', // Change this if needed
        port: 5173,
      },
      proxy: {
        '/api': 'http://localhost:8000', // Proxy API calls to backend
      },
    },

    define: {
      'import.meta.env.VITE_BACKEND_SERVER': JSON.stringify(env.VITE_BACKEND_SERVER),
    },

    optimizeDeps: {
      include: ['jwt-decode'], // Ensures proper handling of jwt-decode
    },
  };
});
