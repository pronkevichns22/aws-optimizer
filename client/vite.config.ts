// ============================================================================
// FILE: vite.config.ts
// LOCATION: client/
// PURPOSE: Vite build configuration for React development
// ============================================================================

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration with React plugin
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
