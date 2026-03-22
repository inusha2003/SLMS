import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Dev: optional — use VITE_API_URL= in .env to hit backend via same origin
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
})
