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
        manualChunks: {
          'face-api': ['@vladmandic/face-api'],
          'recharts': ['recharts'],
          'vendor': ['react', 'react-dom', 'react-router-dom', 'axios']
        }
      }
    }
  }
})