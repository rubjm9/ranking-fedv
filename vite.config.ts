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
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    // El chunk único rondaba los 2,5 MB; se avisa a partir de 600 kB.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignorar warnings de TypeScript
        if (warning.code === 'TS2307' || warning.code === 'TS2339' || warning.code === 'TS2559') {
          return;
        }
        warn(warning);
      },
      output: {
        /*
         * Separa las dependencias grandes en chunks propios: cambian mucho menos
         * que el código de la app, así que el navegador las reutiliza entre
         * despliegues en lugar de volver a descargarlas.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('exceljs')) return 'exceljs'
          if (id.includes('@dnd-kit')) return 'dnd'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('react-router')) return 'react'
          if (id.includes('@tanstack')) return 'query'
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
