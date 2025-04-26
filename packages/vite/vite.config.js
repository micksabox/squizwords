import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true, // Expose to network (0.0.0.0)
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  publicDir: 'public',
  plugins: [react(), tailwindcss()],
});
