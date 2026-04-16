import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// When VITE_BASE_PATH is set (GitHub Pages CI), all asset references use that
// sub-path so the game works correctly under /GrudgeSpaceRTS/game/
const base = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        info: resolve(__dirname, 'info.html'),
      },
    },
    outDir: 'dist',
    sourcemap: true,
  },
});
