#!/usr/bin/env node
/**
 * convert-fbx-to-glb.mjs — Batch convert FBX files to GLB.
 *
 * Usage:  node scripts/convert-fbx-to-glb.mjs [--dry-run]
 *
 * Scans public/assets/space/models/ for .fbx files and converts them to .glb
 * using fbx2gltf (preferred) or Blender CLI as fallback.
 *
 * Ported from 3dmotion/scripts/convert-fbx-to-glb.mjs
 */

import { readdirSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, basename, extname, dirname } from 'path';
import { execSync } from 'child_process';

const MODELS_DIR = join(process.cwd(), 'public', 'assets', 'space', 'models');
const DRY_RUN = process.argv.includes('--dry-run');

// ── Detect converter ─────────────────────────────────────────────
let converter = null;
try {
  execSync('npx fbx2gltf --help', { stdio: 'pipe' });
  converter = 'fbx2gltf';
} catch {
  try {
    execSync('blender --version', { stdio: 'pipe' });
    converter = 'blender';
  } catch {
    // Neither available
  }
}

if (!converter && !DRY_RUN) {
  console.log('No converter found. Install one of:');
  console.log('  npm install -g fbx2gltf');
  console.log('  Or install Blender and add to PATH');
  console.log('\nRun with --dry-run to list files that would be converted.');
  process.exit(1);
}

// ── Walk directory for FBX files ─────────────────────────────────
function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__MACOSX' || entry.name === 'node_modules') continue;
      results.push(...walk(full));
    } else if (extname(entry.name).toLowerCase() === '.fbx') {
      results.push(full);
    }
  }
  return results;
}

// ── Main ─────────────────────────────────────────────────────────
const files = walk(MODELS_DIR);
console.log(`\nFound ${files.length} FBX files in ${MODELS_DIR}\n`);

let converted = 0;
let skipped = 0;
let failed = 0;

for (const input of files) {
  const dir = dirname(input);
  const name = basename(input, '.fbx');
  const output = join(dir, `${name}.glb`);

  if (existsSync(output)) {
    const fbxSize = statSync(input).size;
    const glbSize = statSync(output).size;
    console.log(`  ✓ ${name}.glb (exists, ${(glbSize / 1024).toFixed(0)}KB vs ${(fbxSize / 1024).toFixed(0)}KB FBX)`);
    skipped++;
    continue;
  }

  if (DRY_RUN) {
    console.log(`  → WOULD convert: ${basename(input)} → ${name}.glb`);
    continue;
  }

  if (converter === 'fbx2gltf') {
    try {
      console.log(`  Converting ${basename(input)} → ${name}.glb...`);
      execSync(`npx fbx2gltf -i "${input}" -o "${output}" --binary`, { stdio: 'pipe' });
      const glbSize = statSync(output).size;
      console.log(`  ✓ ${name}.glb (${(glbSize / 1024).toFixed(0)}KB)`);
      converted++;
    } catch {
      console.log(`  ✗ ${basename(input)} — conversion failed`);
      failed++;
    }
  } else if (converter === 'blender') {
    try {
      console.log(`  Converting ${basename(input)} → ${name}.glb (Blender)...`);
      const script = `import bpy,sys;bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.fbx(filepath=sys.argv[-2]);bpy.ops.export_scene.gltf(filepath=sys.argv[-1],export_format='GLB')`;
      execSync(`blender --background --python-expr "${script}" -- "${input}" "${output}"`, {
        stdio: 'pipe',
      });
      console.log(`  ✓ ${name}.glb`);
      converted++;
    } catch {
      console.log(`  ✗ ${basename(input)} — Blender conversion failed`);
      failed++;
    }
  }
}

console.log(`\nDone: ${converted} converted, ${skipped} already existed, ${failed} failed.`);
console.log(`Total FBX: ${files.length} | GLB available: ${converted + skipped}`);
