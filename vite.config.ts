import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [TanStackRouterVite({ routesDirectory: 'app/routes', generatedRouteTree: 'app/routeTree.gen.ts' }), react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
});
