import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base-Pfad für GitHub Pages: https://<name>.github.io/svs-trainingsplaner/
export default defineConfig({
  base: '/svs-trainingsplaner/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.js',
  },
});
