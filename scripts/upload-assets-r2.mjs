#!/usr/bin/env node
/**
 * upload-assets-r2.mjs — Push all game assets to Cloudflare R2.
 *
 * Usage:
 *   node scripts/upload-assets-r2.mjs                 # full upload
 *   node scripts/upload-assets-r2.mjs --dry-run       # preview only
 *   node scripts/upload-assets-r2.mjs --prefix ground  # upload only ground/ subtree
 *
 * Required env vars:
 *   R2_ACCESS_KEY_ID      — Cloudflare R2 access key
 *   R2_SECRET_ACCESS_KEY  — Cloudflare R2 secret key
 *   R2_ENDPOINT           — e.g. https://***REMOVED-CF-ACCOUNT-ID***.r2.cloudflarestorage.com
 *   R2_BUCKET             — e.g. grudge-assets  (default: grudge-assets)
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, extname, relative, posix } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── .env loader (zero-dep) ─────────────────────────────────────────────────
// Reads `.env` and `.env.local` (in that order) from the repo root,
// without overriding values already present in process.env.
// Also aliases CF_* → R2_* so a single .env can serve both names.
function loadEnvFiles() {
  const repoRoot = join(__dirname, '..');
  for (const filename of ['.env', '.env.local']) {
    const path = join(repoRoot, filename);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, 'utf8');
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
  // CF_* aliases → R2_* (only fill if R2_* not already set)
  if (!process.env.R2_ACCESS_KEY_ID && process.env.CF_R2_ACCESS_KEY_ID) {
    process.env.R2_ACCESS_KEY_ID = process.env.CF_R2_ACCESS_KEY_ID;
  }
  if (!process.env.R2_SECRET_ACCESS_KEY && process.env.CF_R2_SECRET_ACCESS_KEY) {
    process.env.R2_SECRET_ACCESS_KEY = process.env.CF_R2_SECRET_ACCESS_KEY;
  }
  if (!process.env.R2_ENDPOINT && process.env.CF_ACCOUNT_ID) {
    process.env.R2_ENDPOINT = `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  }
}
loadEnvFiles();

// ── Config ────────────────────────────────────────────────────────
const ASSETS_DIR = join(__dirname, '..', 'public', 'assets');
const R2_PREFIX = 'gruda-armada';
const BUCKET = process.env.R2_BUCKET ?? 'grudge-assets';
const parsedConcurrency = Number(process.env.R2_UPLOAD_CONCURRENCY ?? 10);
const CONCURRENCY = Number.isFinite(parsedConcurrency) ? Math.max(1, parsedConcurrency) : 10;
const parsedRetries = Number(process.env.R2_UPLOAD_RETRIES ?? 4);
const MAX_RETRIES = Number.isFinite(parsedRetries) ? Math.max(0, parsedRetries) : 4;

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const PREFIX_FILTER = (() => {
  const idx = process.argv.indexOf('--prefix');
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : null;
})();

// ── MIME types ────────────────────────────────────────────────────
const MIME_MAP = {
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.fbx': 'application/octet-stream',
  '.obj': 'text/plain',
  '.mtl': 'text/plain',
  '.vox': 'application/octet-stream',
  '.ply': 'application/octet-stream',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.json': 'application/json',
  '.txt': 'text/plain',
};

// Files to skip
const SKIP_EXTENSIONS = new Set([
  '.psd', '.url', '.kenshape', '.DS_Store',
  '._without background', '._PNG', '._background',
]);
const SKIP_FILENAMES = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini']);

function getMimeType(filepath) {
  const ext = extname(filepath).toLowerCase();
  return MIME_MAP[ext] ?? 'application/octet-stream';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientUploadError(err) {
  const msg = String(err?.message ?? err ?? '').toLowerCase();
  return (
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('socket hang up') ||
    msg.includes('bad record mac') ||
    msg.includes('ssl') ||
    msg.includes('timeout') ||
    msg.includes('network')
  );
}

function shouldSkip(filepath, filename) {
  if (SKIP_FILENAMES.has(filename)) return true;
  const ext = extname(filename).toLowerCase();
  if (SKIP_EXTENSIONS.has(ext)) return true;
  if (filename.startsWith('.')) return true;
  // Skip license files — not needed in CDN
  if (filename === 'license.txt') return true;
  return false;
}

// ── Walk directory ────────────────────────────────────────────────
async function walkDir(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDir(fullPath)));
    } else if (entry.isFile() && !shouldSkip(fullPath, entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

// ── MD5 hash ──────────────────────────────────────────────────────
async function md5(filepath) {
  const data = await readFile(filepath);
  return createHash('md5').update(data).digest('hex');
}

// ── Parallel execution ────────────────────────────────────────────
async function parallelMap(items, fn, concurrency) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║   Grudge R2 Asset Upload — Gruda Armada          ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log();

  if (DRY_RUN) {
    console.log('  🔍 DRY RUN — no files will be uploaded\n');
  }

  // Validate env
  if (!DRY_RUN) {
    for (const key of ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ENDPOINT']) {
      if (!process.env[key]) {
        console.error(`  ❌ Missing env var: ${key}`);
        process.exit(1);
      }
    }
  }

  // Walk assets directory
  console.log(`  📁 Scanning ${ASSETS_DIR}...`);
  let allFiles = await walkDir(ASSETS_DIR);

  // Filter by prefix if specified
  if (PREFIX_FILTER) {
    allFiles = allFiles.filter((f) => {
      const rel = relative(ASSETS_DIR, f).replace(/\\/g, '/');
      return rel.startsWith(PREFIX_FILTER);
    });
    console.log(`  🔎 Filtered to --prefix "${PREFIX_FILTER}"`);
  }

  console.log(`  📊 Found ${allFiles.length} asset files\n`);

  // Build manifest
  const manifest = [];
  const uploadQueue = [];

  for (const filepath of allFiles) {
    const relPath = relative(ASSETS_DIR, filepath).replace(/\\/g, '/');
    // Map local path to R2 key:
    //   public/assets/space/models/ships/X.obj → gruda-armada/space/models/ships/X.obj
    const r2Key = `${R2_PREFIX}/${relPath}`;
    const stats = await stat(filepath);
    const contentType = getMimeType(filepath);

    manifest.push({
      key: r2Key,
      localPath: `/assets/${relPath}`,
      size: stats.size,
      contentType,
    });

    uploadQueue.push({ filepath, r2Key, contentType, size: stats.size });
  }

  // Size summary by category
  const categories = {};
  for (const entry of manifest) {
    const cat = entry.key.split('/')[1] ?? 'other'; // gruda-armada/<cat>/...
    categories[cat] = (categories[cat] ?? 0) + entry.size;
  }
  console.log('  📦 Size by category:');
  for (const [cat, size] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${cat.padEnd(16)} ${(size / 1024 / 1024).toFixed(1)} MB`);
  }
  const totalMB = manifest.reduce((s, e) => s + e.size, 0) / 1024 / 1024;
  console.log(`     ${'TOTAL'.padEnd(16)} ${totalMB.toFixed(1)} MB`);
  console.log();

  if (DRY_RUN) {
    // Write preview manifest
    const manifestPath = join(__dirname, '..', 'r2-manifest-preview.json');
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`  📝 Manifest preview saved to r2-manifest-preview.json`);
    console.log(`  ✅ Dry run complete — ${manifest.length} files would be uploaded\n`);
    return;
  }

  // Create S3 client for R2
  const client = new S3Client({
    endpoint: process.env.R2_ENDPOINT,
    region: 'auto',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });

  // Upload files
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  const startTime = Date.now();

  await parallelMap(
    uploadQueue,
    async (item, idx) => {
      try {
        // Check if already exists (skip if same size, unless --force)
        if (!FORCE) {
          try {
            const head = await client.send(
              new HeadObjectCommand({ Bucket: BUCKET, Key: item.r2Key })
            );
            // Skip if size matches AND ETag (MD5) matches — prevents corrupt re-uploads
            const localMd5 = createHash('md5').update(await readFile(item.filepath)).digest('hex');
            const remoteEtag = (head.ETag ?? '').replace(/"/g, '');
            if (head.ContentLength === item.size && remoteEtag === localMd5) {
              skipped++;
              return;
            }
          } catch {
            // Object doesn't exist — proceed with upload
          }
        }

        const body = await readFile(item.filepath);
        let lastErr = null;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            await client.send(
              new PutObjectCommand({
                Bucket: BUCKET,
                Key: item.r2Key,
                Body: body,
                ContentType: item.contentType,
                CacheControl: 'public, max-age=2592000, immutable',
              })
            );
            lastErr = null;
            break;
          } catch (err) {
            lastErr = err;
            if (attempt >= MAX_RETRIES || !isTransientUploadError(err)) {
              throw err;
            }
            const delayMs = 750 * Math.pow(2, attempt);
            console.warn(`  ↻ Retry ${attempt + 1}/${MAX_RETRIES} for ${item.r2Key} after transient error`);
            await sleep(delayMs);
          }
        }
        if (lastErr) throw lastErr;
        uploaded++;

        // Progress every 50 files
        const total = uploadQueue.length;
        const done = uploaded + skipped + failed;
        if (done % 50 === 0 || done === total) {
          const pct = ((done / total) * 100).toFixed(0);
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`  ⬆️  ${pct}% (${done}/${total}) — ${uploaded} uploaded, ${skipped} skipped — ${elapsed}s`);
        }
      } catch (err) {
        failed++;
        console.error(`  ❌ Failed: ${item.r2Key} — ${err.message}`);
      }
    },
    CONCURRENCY
  );

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log();
  console.log(`  ✅ Upload complete in ${elapsed}s`);
  console.log(`     ${uploaded} uploaded · ${skipped} skipped (unchanged) · ${failed} failed`);

  // Upload manifest only for full-tree uploads. A filtered run should not
  // overwrite the global manifest with a partial asset list.
  const manifestJson = JSON.stringify(manifest, null, 2);
  if (!PREFIX_FILTER) {
    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `${R2_PREFIX}/manifest.json`,
        Body: manifestJson,
        ContentType: 'application/json',
        CacheControl: 'public, max-age=300', // 5 min cache for manifest
      })
    );
    console.log(`  📝 Manifest uploaded to ${R2_PREFIX}/manifest.json (${manifest.length} entries)`);

    const localManifest = join(__dirname, '..', 'r2-manifest.json');
    await writeFile(localManifest, manifestJson);
    console.log(`  💾 Local copy saved to r2-manifest.json\n`);
  } else {
    const safePrefix = PREFIX_FILTER.replace(/[\\/]+/g, '-');
    const localManifest = join(__dirname, '..', `r2-manifest-${safePrefix}.json`);
    await writeFile(localManifest, manifestJson);
    console.log(`  📝 Filtered run detected; global manifest left unchanged`);
    console.log(`  💾 Local filtered manifest saved to ${`r2-manifest-${safePrefix}.json`}\n`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
