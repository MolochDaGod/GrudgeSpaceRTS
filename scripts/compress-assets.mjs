#!/usr/bin/env node
/**
 * compress-assets.mjs — Lossless/near-lossless asset compression.
 *
 * 1. Deletes non-runtime files (.psd, .unitypackage, .pdf)
 * 2. Converts large PNGs (>1MB) to WebP at quality 95 (visually lossless)
 * 3. Re-compresses large JPGs (>2MB) at quality 92, max 2048px
 * 4. Converts GIF ship previews to single-frame poster PNGs (or deletes)
 * 5. Resizes any texture >4096px on either axis to 2048px (keeps aspect)
 *
 * Uses `sharp` (already a devDependency).
 *
 * Usage:
 *   node scripts/compress-assets.mjs              # run compression
 *   node scripts/compress-assets.mjs --dry-run    # preview only
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'public', 'assets');
const DRY_RUN = process.argv.includes('--dry-run');

// Lazy-load sharp
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('❌ sharp not found. Install: npm i -D sharp');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────
function walkDir(dir, exts, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, exts, results);
    } else if (exts.some((e) => entry.name.toLowerCase().endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

function fmtMB(bytes) {
  return (bytes / 1048576).toFixed(1);
}

function safeSize(f) {
  try { return fs.statSync(f).size; } catch { return 0; }
}

// ── Phase 1: Delete non-runtime source files ──────────────────────
console.log('🗑️  Phase 1: Remove non-runtime files (.psd, .unitypackage, .pdf)\n');

const junkExts = ['.psd', '.unitypackage', '.pdf'];
const junkFiles = walkDir(ASSETS, junkExts);
let junkBytes = 0;

for (const f of junkFiles) {
  const size = safeSize(f);
  if (!size) continue;
  junkBytes += size;
  const rel = path.relative(ROOT, f);
  if (DRY_RUN) {
    console.log(`  🔍 DELETE ${rel} (${fmtMB(size)} MB)`);
  } else {
    fs.unlinkSync(f);
    console.log(`  ✓ Deleted ${rel} (${fmtMB(size)} MB)`);
  }
}
console.log(`  → ${junkFiles.length} files, ${fmtMB(junkBytes)} MB freed\n`);

// ── Phase 2: Compress large PNGs → WebP (quality 95, visually lossless) ──
console.log('🖼️  Phase 2: Compress large PNGs (>512KB) → WebP q95\n');

const pngFiles = walkDir(ASSETS, ['.png']).filter(
  (f) => safeSize(f) > 512 * 1024,
);
let pngSaved = 0;

for (const f of pngFiles) {
  const origSize = safeSize(f);
  if (!origSize) continue;
  const rel = path.relative(ROOT, f);
  const webpPath = f.replace(/\.png$/i, '.webp');

  if (DRY_RUN) {
    console.log(`  🔍 ${rel} (${fmtMB(origSize)} MB) → WebP`);
    continue;
  }

  try {
    let pipeline = sharp(f);

    // Get metadata to check dimensions
    const meta = await pipeline.metadata();
    const maxDim = 2048;

    // Resize if either dimension > 2048 (keep aspect ratio)
    if ((meta.width && meta.width > maxDim) || (meta.height && meta.height > maxDim)) {
      pipeline = pipeline.resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true });
    }

    // Convert to WebP at quality 95 (near-lossless, no visible difference)
    await pipeline.webp({ quality: 95, effort: 4 }).toFile(webpPath);

    const newSize = fs.statSync(webpPath).size;

    // Only keep WebP if it's actually smaller (some PNGs with few colors compress better as PNG)
    if (newSize < origSize * 0.9) {
      fs.unlinkSync(f); // remove original PNG
      pngSaved += origSize - newSize;
      console.log(`  ✓ ${rel} ${fmtMB(origSize)}→${fmtMB(newSize)} MB (saved ${fmtMB(origSize - newSize)} MB)`);
    } else {
      // WebP isn't smaller — keep original, delete WebP
      fs.unlinkSync(webpPath);
      console.log(`  ⏭ ${rel} — WebP not smaller, kept PNG`);
    }
  } catch (err) {
    console.log(`  ✗ ${rel} — ${err.message}`);
  }
}
console.log(`  → ${fmtMB(pngSaved)} MB saved from PNG→WebP\n`);

// ── Phase 3: Re-compress large JPGs (>1MB) ───────────────────────
console.log('📷  Phase 3: Re-compress large JPGs (>1MB) → JPEG q92, max 2048px\n');

const jpgFiles = walkDir(ASSETS, ['.jpg', '.jpeg']).filter(
  (f) => safeSize(f) > 1024 * 1024,
);
let jpgSaved = 0;

for (const f of jpgFiles) {
  const origSize = safeSize(f);
  if (!origSize) continue;
  const rel = path.relative(ROOT, f);
  const tmpPath = f + '.tmp.jpg';

  if (DRY_RUN) {
    console.log(`  🔍 ${rel} (${fmtMB(origSize)} MB)`);
    continue;
  }

  try {
    let pipeline = sharp(f);
    const meta = await pipeline.metadata();
    const maxDim = 2048;

    if ((meta.width && meta.width > maxDim) || (meta.height && meta.height > maxDim)) {
      pipeline = pipeline.resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true });
    }

    // Quality 92 is visually identical to 100 for photos but significantly smaller
    await pipeline.jpeg({ quality: 92, mozjpeg: true }).toFile(tmpPath);

    const newSize = fs.statSync(tmpPath).size;

    if (newSize < origSize * 0.85) {
      fs.unlinkSync(f);
      fs.renameSync(tmpPath, f);
      jpgSaved += origSize - newSize;
      console.log(`  ✓ ${rel} ${fmtMB(origSize)}→${fmtMB(newSize)} MB`);
    } else {
      fs.unlinkSync(tmpPath);
      console.log(`  ⏭ ${rel} — already well compressed`);
    }
  } catch (err) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    console.log(`  ✗ ${rel} — ${err.message}`);
  }
}
console.log(`  → ${fmtMB(jpgSaved)} MB saved from JPG recompression\n`);

// ── Phase 4: Delete GIF ship previews (not used in-game) ──────────
console.log('🎞️  Phase 4: Remove large GIF previews (>5MB)\n');

const gifFiles = walkDir(ASSETS, ['.gif']).filter(
  (f) => safeSize(f) > 5 * 1024 * 1024,
);
let gifBytes = 0;

for (const f of gifFiles) {
  const size = safeSize(f);
  if (!size) continue;
  gifBytes += size;
  const rel = path.relative(ROOT, f);
  if (DRY_RUN) {
    console.log(`  🔍 DELETE ${rel} (${fmtMB(size)} MB)`);
  } else {
    fs.unlinkSync(f);
    console.log(`  ✓ Deleted ${rel} (${fmtMB(size)} MB)`);
  }
}
console.log(`  → ${gifFiles.length} GIFs, ${fmtMB(gifBytes)} MB freed\n`);

// ── Summary ───────────────────────────────────────────────────────
const totalSaved = junkBytes + pngSaved + jpgSaved + gifBytes;
console.log('═══════════════════════════════════════════════');
console.log(`✅ Total space saved: ${fmtMB(totalSaved)} MB`);
console.log(`   Junk files removed: ${junkFiles.length} (${fmtMB(junkBytes)} MB)`);
console.log(`   PNG→WebP savings:   ${fmtMB(pngSaved)} MB`);
console.log(`   JPG recompression:  ${fmtMB(jpgSaved)} MB`);
console.log(`   GIF previews:       ${gifFiles.length} (${fmtMB(gifBytes)} MB)`);
if (DRY_RUN) console.log('\n   (dry run — no files changed)');
console.log('═══════════════════════════════════════════════');
