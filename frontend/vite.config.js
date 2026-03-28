import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // 👈 මේක අලුතින් එක් කළා

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 👈 මේකත් අලුතින් එක් කළා
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});