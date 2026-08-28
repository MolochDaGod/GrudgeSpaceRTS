import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { visualizer } from 'rollup-plugin-visualizer';
import Inspect from 'vite-plugin-inspect';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const base = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig(({ command, mode }) => {
  const plugins: PluginOption[] = [react()];

  if (command === 'serve') {
    plugins.push(Inspect());
  }

  if (mode === 'analyze') {
    plugins.push(
      visualizer({
        filename: 'stats.html',
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
        open: false,
        title: 'GRUDA ARMADA bundle',
      }),
    );
  }

  return {
    base,
    plugins,
    resolve: {
      alias: { '@': resolve(__dirname, 'src') },
    },
    optimizeDeps: {
      include: [
        'three',
        'three/examples/jsm/loaders/GLTFLoader.js',
        'three/examples/jsm/loaders/DRACOLoader.js',
      ],
    },
    build: {
      target: 'es2022',
      sourcemap: false,
      cssCodeSplit: true,
      modulePreload: { polyfill: false },
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          admin: resolve(__dirname, 'admin.html'),
          info: resolve(__dirname, 'info.html'),
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three')) return 'three';
            if (id.includes('node_modules/@react-three')) return 'r3f';
            if (id.includes('node_modules/@dimforge') || id.includes('rapier')) return 'rapier';
            if (id.includes('node_modules/framer-motion')) return 'motion';
            if (id.includes('node_modules/three-mesh-bvh')) return 'bvh';
          },
        },
      },
      outDir: 'dist',
    },
  };
});
