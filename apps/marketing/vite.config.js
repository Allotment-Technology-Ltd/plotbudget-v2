import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    open: false,
    // Proxy Sanity API in dev to avoid CORS (browser only talks to same origin)
    proxy: {
      '/sanity-api': {
        target: 'https://a2vzaekn.api.sanity.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sanity-api/, ''),
        secure: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'framer-motion': ['framer-motion'],
        },
      },
    },
  },
});
