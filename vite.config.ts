import { defineConfig } from 'vite';
// @ts-ignore
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  root: './client',
  plugins: [react() as any],
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
      '@shared': resolve(__dirname, './shared'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});