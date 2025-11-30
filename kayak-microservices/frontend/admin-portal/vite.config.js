import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/api/admin': {
        target: 'http://localhost:3007',
        changeOrigin: true
      },
      '/api/listings': {
        target: 'http://localhost:3003',
        changeOrigin: true
      },
      '/api/bookings': {
        target: 'http://localhost:3005',
        changeOrigin: true
      }
    }
  }
})
