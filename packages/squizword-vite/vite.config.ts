import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite';
import { cloudflare } from "@cloudflare/vite-plugin";
import path from 'path';

// Explicitly configure the React plugin
const reactPlugin = react();

export default defineConfig({
  server: {
    host: true, // Expose to network (0.0.0.0)
  },
  publicDir: 'public',
  // @ts-expect-error For some reason, the plugins are not being recognized
  plugins: [...reactPlugin, ...tailwindcss(), ...cloudflare()],
  build: {
    target: 'esnext',
    outDir: './dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  ssr: {
    // Ensure React is bundled for SSR/Worker, not externalized
    noExternal: ['react', 'react-dom']
  },
  optimizeDeps: {
    exclude: ['@noir-lang/noirc_abi', '@noir-lang/acvm_js', '@aztec/bb.js', 'garaga']
  }
});
