import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  server: {
    proxy: {
      '/nim_api': {
        target: 'https://integrate.api.nvidia.com/v1',
        changeOrigin: true,
        secure: false,
        rewrite: path => path.replace(/^\/nim_api/, ''),
      },
    },
  },
});
