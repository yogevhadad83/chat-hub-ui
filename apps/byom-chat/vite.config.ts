import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Allow Render to access the preview server over its external URL.
// We bind to 0.0.0.0 and let Render set PORT. We also disable host checks for simplicity.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 4173,
    // Accept requests from Render's domain (and anywhere else) to avoid 403 "host not allowed".
    allowedHosts: true,
  },
})
