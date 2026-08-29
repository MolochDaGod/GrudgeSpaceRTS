import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { visualizer } from 'rollup-plugin-visualizer';
import Inspect from 'vite-plugin-inspect';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const base = process.env.VITE_BASE_PATH ?? '/';

/** Last node_modules package in the id. Safe for npm and pnpm nested paths. */
function npmPkg(id: string): string | undefined {
  const m = id.match(/[/\\]node_modules[/\\](?!\.pnpm[/\\])((?:@[^/\\]+[/\\])?[^/\\]+)/);
  return m?.[1]?.replace(/\\/g, '/');
}

/**
 * Load-wave buckets. Return undefined for src/ -- those split via import().
 * Order is specific -> general so @react-three/rapier does not land in r3f.
 */
function manualChunks(id: string): string | undefined {
  const pkg = npmPkg(id);
  if (!pkg) return;

  if (pkg === 'react' || pkg === 'react-dom' || pkg === 'scheduler') return 'react';

  if (pkg === '@dimforge/rapier3d-compat' || pkg === '@react-three/rapier') return 'rapier';

  if (pkg.startsWith('@react-three')) return 'r3f';

  if (pkg === 'three') return 'three';

  if (
    pkg === 'postprocessing' ||
    pkg === 'three-mesh-bvh' ||
    pkg === 'troika-three-text' ||
    pkg === 'three.quarks' ||
    pkg === 'camera-controls'
  ) {
    return 'three-addons';
  }

  if (pkg === 'howler') return 'audio';
  if (pkg === 'framer-motion') return 'motion';
}

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
      // Default Vite HTML modulepreload follows async import() and would
      // fetch three/r3f on splash. Only preload the splash graph.
      modulePreload: {
        polyfill: false,
        resolveDependencies(_filename, deps, { hostType }) {
          if (hostType !== 'html') return deps;
          return deps.filter((dep) => {
            const file = dep.split('/').pop() ?? '';
            return file.endsWith('.css') || file.startsWith('react-') || file.startsWith('main-');
          });
        },
      },
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          admin: resolve(__dirname, 'admin.html'),
          info: resolve(__dirname, 'info.html'),
        },
        output: {
          manualChunks,
          experimentalMinChunkSize: 20_000,
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
      outDir: 'dist',
    },
  };
});
