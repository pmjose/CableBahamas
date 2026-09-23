import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/CableBahamas/',
  plugins: [react()],
  server: { port: 5173 },
  build: {
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/recharts/')) return 'recharts'
          if (id.includes('/node_modules/lucide-react/')) return 'icons'
          if (/\/node_modules\/(react|react-dom|react-router|react-router-dom)\//.test(id)) return 'react-vendor'
        },
      },
    },
  },
})
