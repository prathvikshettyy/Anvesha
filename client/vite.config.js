import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

const useHttps = process.env.HTTPS === 'true'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ...(useHttps ? [basicSsl()] : []),
  ],
  server: {
    host: true,     // bind to 0.0.0.0 → accessible on the LAN
    port: 5173,
    https: useHttps ? true : false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      // Socket.IO — forward both HTTP handshake polling and WebSocket upgrade
      '/socket.io': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
