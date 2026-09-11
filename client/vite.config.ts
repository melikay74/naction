import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Off Vite's default 5173 (and the API off 3001) to stay clear of other
    // dev servers commonly running on this machine.
    port: 5183,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.API_PORT ?? 3011}`,
        changeOrigin: true,
      },
    },
  },
});
