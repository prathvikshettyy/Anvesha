import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl(), // self-signed cert → enables getUserMedia on LAN (mobile)
  ],
  server: {
    host: true,     // bind to 0.0.0.0 → accessible on the LAN
    port: 5173,
    https: true,    // HTTPS required for getUserMedia on non-localhost origins
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
})
