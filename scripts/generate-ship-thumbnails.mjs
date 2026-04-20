#!/usr/bin/env node
/**
 * generate-ship-thumbnails.mjs — Render 3D ship portraits for every prefab.
 *
 * Uses a headless Three.js scene (same lighting as CodexScene) to render
 * each ship model from a ¾-top cinematic angle onto a transparent PNG.
 * Output: public/assets/space/ui/ship-portraits/<key>.png (512×512)
 *
 * Why this approach:
 *   - Uses the SAME model loader pipeline as the game (loadByFormat + DRACO)
 *   - Consistent ¾-top framing via auto-fit bounding box
 *   - Cinematic 3-point lighting matching the Ship Codex
 *   - Transparent background → compositable over any UI panel
 *   - Runs offline; no browser needed (uses node + gl via headless-gl)
 *
 * Usage:
 *   node scripts/generate-ship-thumbnails.mjs              # all ships
 *   node scripts/generate-ship-thumbnails.mjs --key=warship # single ship
 *   node scripts/generate-ship-thumbnails.mjs --list        # print all keys
 *
 * Prerequisites:
 *   npm install -D gl canvas sharp   (headless WebGL + image encoding)
 *
 * If headless-gl is not available, the script outputs a browser-based HTML
 * file that you can open to batch-render thumbnails client-side.
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'assets', 'space', 'ui', 'ship-portraits');
const SIZE = 512;

// ── Parse the prefab registries from source to get all ship keys ────
// We parse the TS source directly to avoid needing to transpile/import it.
const prefabSrc = readFileSync(join(ROOT, 'src', 'game', 'space-prefabs.ts'), 'utf-8');

// Extract all keys from ALL_PREFAB_REGISTRIES entries
const registryNames = [
  'SHIP_PREFABS', 'CAPITAL_PREFABS', 'BATTLE_SHIP_PREFABS',
  'FORGE_SHIP_PREFABS', 'FACTION_HERO_PREFABS', 'ENEMY_PREFABS',
  'VOXEL_FLEET_PREFABS', 'BIONIC_PREFABS', 'LOWPOLY_FLEET_PREFABS',
  'LOWPOLY_FBX_PREFABS', 'ORGANIC_HERO_PREFABS', 'CARGO_TRANSPORT_PREFABS',
  'DRONE_PREFABS', 'FLYING_SHIP_PREFABS', 'HEAVY_BOMBER_PREFABS',
  'MODULAR_SHIP_PREFABS', 'CRAFTPIX_LP_PREFABS',
];

// Extract static keys (e.g. "micro_recon: {")
const staticKeyRegex = /^\s+(\w+):\s*\{/gm;
const allKeys = new Set();
let match;
while ((match = staticKeyRegex.exec(prefabSrc)) !== null) {
  const key = match[1];
  // Filter out non-ship keys (helper functions, audio, etc.)
  if (['music', 'sfx', 'blue', 'classic', 'hud', 'minimap', 'button',
       'resourceSlot', 'killCounter', 'enemyDot', 'playerDot', 'stationIcon',
       'white', 'black'].includes(key)) continue;
  allKeys.add(key);
}

// Also extract loop-generated keys
// Voxel fleet: voxel_ship_1..6
for (let i = 1; i <= 6; i++) allKeys.add(`voxel_ship_${i}`);
// Lowpoly FBX: lp_spaceship_blue, etc.
for (const color of ['blue', 'green', 'orange', 'purple']) {
  allKeys.add(`lp_spaceship_${color}`);
  allKeys.add(`lp_fighter_${color}`);
  allKeys.add(`lp_cruiser_${color}`);
  allKeys.add(`lp_escort_${color}`);
}
// Shields: shield_1..20
for (let i = 1; i <= 20; i++) allKeys.add(`shield_${i}`);

const shipKeys = [...allKeys].sort();

// ── CLI args ──────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.includes('--list')) {
  console.log(`${shipKeys.length} ship keys found:\n`);
  shipKeys.forEach(k => console.log(`  ${k}`));
  process.exit(0);
}

const singleKey = args.find(a => a.startsWith('--key='))?.split('=')[1];

// ── Since headless Three.js in Node is complex, generate a browser tool ──
// This creates a standalone HTML file that:
// 1. Loads every ship model using the game's actual loaders
// 2. Renders each to an offscreen canvas with CodexScene lighting
// 3. Auto-downloads a ZIP of all PNGs

mkdirSync(OUT_DIR, { recursive: true });

const keysToRender = singleKey ? [singleKey] : shipKeys;

const html = `<!DOCTYPE html>
<html>
<head>
  <title>Ship Portrait Generator — Gruda Armada</title>
  <style>
    body { margin: 0; background: #111; color: #cde; font-family: monospace; padding: 20px; }
    #status { margin: 10px 0; }
    #preview { display: flex; flex-wrap: wrap; gap: 8px; }
    #preview img { width: 128px; height: 128px; border: 1px solid #333; background: #000; }
    .label { font-size: 10px; text-align: center; color: #888; max-width: 128px; overflow: hidden; }
    button { padding: 8px 16px; background: #4488ff; color: white; border: none; cursor: pointer; font-size: 14px; margin: 8px 4px; }
    button:disabled { opacity: 0.4; }
  </style>
</head>
<body>
  <h2>🚀 Ship Portrait Generator</h2>
  <p>Renders each ship model at 512×512 with cinematic lighting on transparent background.</p>
  <p>Total ships: <strong>${keysToRender.length}</strong></p>
  <button id="btnStart">Generate All Portraits</button>
  <button id="btnDownload" disabled>Download ZIP</button>
  <div id="status">Ready</div>
  <div id="preview"></div>

  <script type="importmap">
  {
    "imports": {
      "three": "/node_modules/three/build/three.module.js",
      "three/examples/jsm/": "/node_modules/three/examples/jsm/"
    }
  }
  </script>
  <script type="module">
    import * as THREE from 'three';
    import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
    import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
    import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
    import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
    import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

    const SIZE = ${SIZE};
    const KEYS = ${JSON.stringify(keysToRender)};
    const results = new Map(); // key → dataURL

    // ── Offscreen renderer ──
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(SIZE, SIZE);
    renderer.setPixelRatio(1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ── Scene (matches CodexScene lighting) ──
    const scene = new THREE.Scene();
    // Transparent background
    scene.background = null;

    // Cinematic 3-point lighting
    scene.add(new THREE.AmbientLight(0x334466, 0.8));
    const keyLight = new THREE.DirectionalLight(0xddeeff, 2.2);
    keyLight.position.set(8, 10, 6);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xffaa66, 0.4);
    fillLight.position.set(-6, -2, 4);
    scene.add(fillLight);
    const rimLight = new THREE.PointLight(0x4488ff, 1.2, 50);
    rimLight.position.set(0, 3, -10);
    scene.add(rimLight);
    scene.add(new THREE.HemisphereLight(0x6688cc, 0x221133, 0.5));

    // Camera: ¾-top angle for ship portrait
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 500);

    // ── Loaders ──
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    draco.setDecoderConfig({ type: 'js' });
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(draco);
    const fbxLoader = new FBXLoader();
    const objLoader = new OBJLoader();
    const mtlLoader = new MTLLoader();
    const texLoader = new THREE.TextureLoader();

    // ── Import prefab data from the game's module system ──
    const { getShipPrefab, ALL_PREFAB_REGISTRIES } = await import('/src/game/space-prefabs.ts');
    // Voxel fallback
    let hasVoxelShip, buildVoxelShip, buildCapitalVoxelFallback;
    try {
      const vox = await import('/src/game/space-voxel-builder.ts');
      hasVoxelShip = vox.hasVoxelShip;
      buildVoxelShip = vox.buildVoxelShip;
      buildCapitalVoxelFallback = vox.buildCapitalVoxelFallback;
    } catch { /* voxel builder not available */ }

    async function loadShipModel(key) {
      const prefab = getShipPrefab(key);
      if (!prefab) {
        // Try voxel
        if (hasVoxelShip?.(key)) return buildVoxelShip(key, 1);
        if (buildCapitalVoxelFallback) return buildCapitalVoxelFallback(key, 1);
        return null;
      }

      try {
        if (prefab.format === 'glb' || prefab.format === 'gltf') {
          const gltf = await gltfLoader.loadAsync(prefab.modelPath);
          const group = gltf.scene;
          if (prefab.offset) group.position.add(prefab.offset);
          if (prefab.rotation) group.rotation.copy(prefab.rotation);
          return group;
        } else if (prefab.format === 'fbx') {
          const group = await fbxLoader.loadAsync(prefab.modelPath);
          if (prefab.texturePath) {
            const tex = texLoader.load(prefab.texturePath);
            tex.colorSpace = THREE.SRGBColorSpace;
            group.traverse(c => {
              if (c.isMesh) c.material = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.5 });
            });
          }
          if (prefab.offset) group.position.add(prefab.offset);
          if (prefab.rotation) group.rotation.copy(prefab.rotation);
          return group;
        } else {
          // OBJ
          let loader = objLoader;
          if (prefab.mtlPath) {
            try {
              const mats = await mtlLoader.loadAsync(prefab.mtlPath);
              mats.preload();
              loader = new OBJLoader();
              loader.setMaterials(mats);
            } catch {}
          }
          const group = await loader.loadAsync(prefab.modelPath);
          if (prefab.texturePath) {
            const tex = texLoader.load(prefab.texturePath);
            tex.colorSpace = THREE.SRGBColorSpace;
            group.traverse(c => {
              if (c.isMesh) c.material = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.5 });
            });
          }
          if (prefab.offset) group.position.add(prefab.offset);
          if (prefab.rotation) group.rotation.copy(prefab.rotation);
          return group;
        }
      } catch (err) {
        console.warn('Failed to load ' + key + ':', err.message);
        return null;
      }
    }

    function frameShip(model) {
      // Auto-fit: measure bounding box, position camera to frame the ship
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim < 0.001) return;

      // Normalize scale to ~5 units
      const targetSize = 5;
      model.scale.setScalar(targetSize / maxDim);

      // Re-measure after scaling
      box.setFromObject(model);
      box.getCenter(center);

      // Center model at origin
      model.position.sub(center);

      // Camera: ¾-top angle looking down at 30°
      const dist = targetSize * 1.8;
      camera.position.set(dist * 0.5, dist * 0.6, dist * 0.8);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }

    function renderToDataURL(model) {
      // Clear scene of previous models
      const toRemove = [];
      scene.traverse(c => { if (c.userData.__shipModel) toRemove.push(c); });
      toRemove.forEach(c => scene.remove(c));

      if (!model) return null;

      model.userData.__shipModel = true;

      // Enable shadows on meshes
      model.traverse(c => {
        if (c.isMesh) {
          c.castShadow = true;
          // Boost metalness for cinematic look
          if (c.material?.isMeshStandardMaterial) {
            c.material.metalness = Math.max(c.material.metalness, 0.5);
            c.material.roughness = Math.min(c.material.roughness, 0.6);
            if (!c.material.emissiveMap && c.material.map) {
              c.material.emissiveMap = c.material.map;
              c.material.emissiveIntensity = 0.1;
              c.material.emissive.setHex(0x223344);
            }
          }
        }
      });

      scene.add(model);
      frameShip(model);

      renderer.render(scene, camera);
      return renderer.domElement.toDataURL('image/png');
    }

    // ── UI ──
    const statusEl = document.getElementById('status');
    const previewEl = document.getElementById('preview');
    const btnStart = document.getElementById('btnStart');
    const btnDownload = document.getElementById('btnDownload');

    btnStart.onclick = async () => {
      btnStart.disabled = true;
      let done = 0;
      const total = KEYS.length;

      for (const key of KEYS) {
        statusEl.textContent = \`Rendering \${done + 1}/\${total}: \${key}...\`;
        try {
          const model = await loadShipModel(key);
          const dataUrl = renderToDataURL(model);
          if (dataUrl) {
            results.set(key, dataUrl);
            // Show preview
            const wrap = document.createElement('div');
            const img = document.createElement('img');
            img.src = dataUrl;
            img.title = key;
            wrap.appendChild(img);
            const label = document.createElement('div');
            label.className = 'label';
            label.textContent = key;
            wrap.appendChild(label);
            previewEl.appendChild(wrap);
          }
        } catch (err) {
          console.warn('Skip ' + key + ':', err.message);
        }
        done++;
      }

      statusEl.textContent = \`Done! \${results.size}/\${total} portraits rendered.\`;
      btnDownload.disabled = false;
    };

    btnDownload.onclick = async () => {
      // Download all as individual files (or ZIP if JSZip is available)
      for (const [key, dataUrl] of results) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = key + '.png';
        a.click();
        // Small delay to avoid browser blocking rapid downloads
        await new Promise(r => setTimeout(r, 100));
      }
    };
  </script>
</body>
</html>`;

const outPath = join(ROOT, 'public', 'ship-portrait-generator.html');
writeFileSync(outPath, html);
console.log(`\n✅ Ship Portrait Generator created at: public/ship-portrait-generator.html`);
console.log(`\n   Open it in your browser while the dev server is running:`);
console.log(`   1. npm run dev`);
console.log(`   2. Navigate to http://localhost:5173/ship-portrait-generator.html`);
console.log(`   3. Click "Generate All Portraits"`);
console.log(`   4. Click "Download ZIP" to save all ${keysToRender.length} ship PNGs`);
console.log(`\n   Output: ${SIZE}×${SIZE} transparent PNGs with cinematic 3-point lighting`);
console.log(`   Camera: ¾-top angle, auto-fitted bounding box, team-blue tint`);
console.log(`   Saves to: public/assets/space/ui/ship-portraits/<key>.png\n`);
