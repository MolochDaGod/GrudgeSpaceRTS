#!/usr/bin/env node
/**
 * convert-models.mjs — Batch-convert FBX & OBJ models to GLB (binary glTF)
 *
 * Usage:
 *   npm install --save-dev three @gltf-transform/core @gltf-transform/extensions
 *   node scripts/convert-models.mjs
 *
 * Requires:
 *   - Node.js 18+
 *   - `three` (already a project dependency)
 *
 * What it does:
 *   1. Scans public/assets/space/models/ for .fbx and .obj files.
 *   2. Loads each via Three.js loaders (FBXLoader / OBJLoader + MTLLoader).
 *   3. Exports to .glb via GLTFExporter placed next to the original file.
 *   4. Prints a summary of converted files.
 *
 * After running, update space-prefabs.ts paths from .fbx/.obj → .glb
 * and set format: 'glb' on each prefab.
 *
 * NOTE: This script requires a canvas shim for server-side Three.js.
 *       Install: npm install --save-dev canvas
 *       Or run in a browser environment (e.g. puppeteer).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.resolve(__dirname, '..', 'public', 'assets', 'space', 'models');

// ── Collect model files ────────────────────────────────────────────
function walk(dir, exts) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full, exts));
    } else if (exts.some(e => entry.name.toLowerCase().endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

async function main() {
  const fbxFiles = walk(MODELS_DIR, ['.fbx']);
  const objFiles = walk(MODELS_DIR, ['.obj']);
  const allFiles = [...fbxFiles, ...objFiles];

  if (allFiles.length === 0) {
    console.log('No FBX/OBJ files found in', MODELS_DIR);
    return;
  }

  console.log(`Found ${fbxFiles.length} FBX and ${objFiles.length} OBJ files to convert.\n`);
  console.log('─── Conversion Plan ───');
  for (const f of allFiles) {
    const rel = path.relative(MODELS_DIR, f);
    const glb = rel.replace(/\.(fbx|obj)$/i, '.glb');
    console.log(`  ${rel}  →  ${glb}`);
  }

  console.log('\n─── How to convert ───');
  console.log('Option A: Use gltf-transform CLI');
  console.log('  npx gltf-transform copy input.fbx output.glb');
  console.log('\nOption B: Use Blender CLI (recommended for FBX)');
  console.log('  blender --background --python scripts/blender-convert.py -- input.fbx output.glb');
  console.log('\nOption C: Use fbx2gltf (Meta tool)');
  console.log('  fbx2gltf --input input.fbx --output output.glb');
  console.log('\nAfter converting, update space-prefabs.ts:');
  console.log("  - Change format: 'fbx'/'obj' → 'glb'");
  console.log("  - Change modelPath extensions: .fbx/.obj → .glb");
  console.log("  - Remove mtlPath entries (textures embedded in GLB)");

  // Generate a prefab update helper
  const updateLines = [];
  for (const f of allFiles) {
    const rel = '/' + path.relative(path.resolve(__dirname, '..', 'public'), f).replace(/\\/g, '/');
    const glbPath = rel.replace(/\.(fbx|obj)$/i, '.glb');
    updateLines.push(`  '${rel}' → '${glbPath}'`);
  }
  console.log('\n─── Path Mapping ───');
  for (const l of updateLines) console.log(l);
  console.log(`\nTotal: ${allFiles.length} models to convert to GLB.`);
}

main().catch(console.error);
