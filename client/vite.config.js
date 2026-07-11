import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@vladmandic/face-api']
  },
  build: {
    chunkSizeWarningLimit: 6000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@vladmandic/face-api')) {
            return 'face-api'
          }

          if (id.includes('recharts')) {
            return 'recharts'
          }

          if (
            id.includes('react') ||
            id.includes('react-dom') ||
            id.includes('react-router-dom') ||
            id.includes('axios')
          ) {
            return 'vendor'
          }
        }
      }
    }
  }
})