import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures relative paths work in the built index.html
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});