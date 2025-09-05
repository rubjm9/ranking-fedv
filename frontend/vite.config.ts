import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true, // Falla si el puerto está ocupado en lugar de usar otro
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Configuración para ignorar errores de TypeScript
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignorar warnings de TypeScript
        if (warning.code === 'TS2307' || warning.code === 'TS2339' || warning.code === 'TS2559') {
          return;
        }
        warn(warning);
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
