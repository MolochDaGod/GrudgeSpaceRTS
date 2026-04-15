#!/usr/bin/env node
/**
 * migrate-prefabs.mjs — Post-conversion code migration.
 *
 * Reads the manifest.json produced by convert-to-glb.mjs and rewrites:
 *   1. space-prefabs.ts — format → 'glb', modelPath → new .glb, remove mtlPath, scale → 1.0
 *   2. asset-registry.ts — format → 'glb', localPath → new .glb, remove mtlPath
 *
 * Usage:
 *   node scripts/migrate-prefabs.mjs              # apply migrations
 *   node scripts/migrate-prefabs.mjs --dry-run    # show what would change
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'public', 'assets-glb', 'manifest.json');
const DRY_RUN = process.argv.includes('--dry-run');

// ── Load manifest ─────────────────────────────────────────────────
if (!fs.existsSync(MANIFEST_PATH)) {
  console.error(`❌ Manifest not found at ${MANIFEST_PATH}`);
  console.error('   Run "node scripts/convert-to-glb.mjs" first.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
console.log(`📋 Loaded manifest with ${Object.keys(manifest).length} entries.`);

// Build a quick lookup: old local path → new glb path
const pathMap = new Map();
for (const [oldPath, entry] of Object.entries(manifest)) {
  pathMap.set(oldPath, entry.glbPath);
}

// ── Generic file rewriter ─────────────────────────────────────────
function migrateFile(filePath, transforms) {
  const relPath = path.relative(ROOT, filePath);
  let content = fs.readFileSync(filePath, 'utf-8');
  let changeCount = 0;

  for (const transform of transforms) {
    const result = transform(content);
    if (result !== content) {
      changeCount++;
      content = result;
    }
  }

  if (changeCount === 0) {
    console.log(`  ⏭  ${relPath} — no changes needed`);
    return;
  }

  if (DRY_RUN) {
    console.log(`  🔍 ${relPath} — ${changeCount} transforms would apply`);
    return;
  }

  fs.writeFileSync(filePath, content);
  console.log(`  ✅ ${relPath} — ${changeCount} transforms applied`);
}

// ── Transform: replace model paths ────────────────────────────────
function replaceModelPaths(content) {
  let result = content;
  for (const [oldPath, newPath] of pathMap) {
    // Replace both /assets/... → /assets-glb/... patterns
    // Handle the extension change (.obj/.fbx → .glb)
    const escaped = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    result = result.replace(regex, newPath);
  }
  return result;
}

// ── Transform: format fields → 'glb' ─────────────────────────────
function replaceFormats(content) {
  // format: 'obj' → format: 'glb'
  // format: 'fbx' → format: 'glb'
  return content
    .replace(/format:\s*'obj'/g, "format: 'glb'")
    .replace(/format:\s*'fbx'/g, "format: 'glb'")
    .replace(/format:\s*"obj"/g, 'format: "glb"')
    .replace(/format:\s*"fbx"/g, 'format: "glb"');
}

// ── Transform: remove mtlPath lines ───────────────────────────────
function removeMtlPaths(content) {
  // Remove lines like:   mtlPath: '/assets/...',
  // and:                  mtlPath: '...',
  return content.replace(/^\s*mtlPath:\s*['"][^'"]*['"],?\s*\n/gm, '');
}

// ── Transform: scale → 1.0 for prefabs ────────────────────────────
function normalizeScales(content) {
  // Replace scale values in prefab objects
  // Match: scale: 0.045, or scale: 0.03,
  return content.replace(/scale:\s*[\d.]+/g, 'scale: 1.0');
}

// ── Transform: AssetFormat type ───────────────────────────────────
function updateAssetFormatType(content) {
  // Replace: export type AssetFormat = 'obj' | 'fbx' | 'glb';
  // With:    export type AssetFormat = 'glb';
  return content.replace(
    /export type AssetFormat\s*=\s*['"]obj['"]\s*\|\s*['"]fbx['"]\s*\|\s*['"]glb['"];/,
    "export type AssetFormat = 'glb';",
  );
}

// ── Migrate space-prefabs.ts ──────────────────────────────────────
console.log('\n🔧 Migrating space-prefabs.ts...');
migrateFile(path.join(ROOT, 'src', 'game', 'space-prefabs.ts'), [
  replaceModelPaths,
  replaceFormats,
  removeMtlPaths,
  normalizeScales,
]);

// ── Migrate asset-registry.ts ─────────────────────────────────────
console.log('\n🔧 Migrating asset-registry.ts...');
migrateFile(path.join(ROOT, 'src', 'game', 'asset-registry.ts'), [
  replaceModelPaths,
  replaceFormats,
  removeMtlPaths,
  updateAssetFormatType,
]);

// ── Migrate ground-renderer.ts (animation paths) ──────────────────
console.log('\n🔧 Migrating ground-renderer.ts...');
migrateFile(path.join(ROOT, 'src', 'game', 'ground-renderer.ts'), [
  replaceModelPaths,
  replaceFormats,
]);

console.log('\n✅ Migration complete.' + (DRY_RUN ? ' (dry run — no files changed)' : ''));
console.log('   Next: update model-loader.ts to use GLB-only loading.');
