#!/usr/bin/env node
/**
 * upload-r2.mjs — Upload game assets to Cloudflare R2 (grudge-assets bucket).
 *
 * Usage:
 *   node scripts/upload-r2.mjs
 *
 * Requires env vars:
 *   CF_ACCOUNT_ID  — Cloudflare account ID
 *   CF_R2_ACCESS_KEY_ID     — R2 Access Key ID (32 chars)
 *   CF_R2_SECRET_ACCESS_KEY  — R2 Secret Access Key
 *
 * What it does:
 *   1. Walks public/assets/space/ recursively
 *   2. Converts PNG textures → WebP (90% quality) using sharp
 *   3. Uploads originals + WebP versions to R2 with immutable cache headers
 *   4. Generates dist/r2-manifest.json mapping local paths → CDN URLs
 *
 * Dependencies: sharp, @aws-sdk/client-s3 (install as devDependencies)
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { readFileSync, writeFileSync, statSync } from 'fs';
import { join, extname, relative } from 'path';
import { createHash } from 'crypto';
import { readdirSync } from 'fs';

// ── Config ────────────────────────────────────────────────────────
const ACCOUNT_ID = process.env.CF_ACCOUNT_ID ?? 'ee475864561b02d4588180b8b9acf694';
const R2_ACCESS_KEY_ID = process.env.CF_R2_ACCESS_KEY_ID ?? process.env.OBJECT_STORAGE_KEY;
const R2_SECRET_ACCESS_KEY = process.env.CF_R2_SECRET_ACCESS_KEY ?? process.env.OBJECT_STORAGE_SECRET;
const BUCKET = 'grudge-assets';
const ASSET_DIR = join(process.cwd(), 'public', 'assets', 'space');
const MANIFEST_OUT = join(process.cwd(), 'dist', 'r2-manifest.json');

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('CF_R2_ACCESS_KEY_ID and CF_R2_SECRET_ACCESS_KEY env vars are required.');
  process.exit(1);
}

// R2 uses S3-compatible API
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ── MIME types ────────────────────────────────────────────────────
const MIME = {
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.obj': 'text/plain',
  '.mtl': 'text/plain',
  '.fbx': 'application/octet-stream',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.json': 'application/json',
};

// ── Walk directory ────────────────────────────────────────────────
function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip macOS junk
      if (entry.name === '__MACOSX' || entry.name === '.DS_Store') continue;
      results.push(...walk(full));
    } else {
      const ext = extname(entry.name).toLowerCase();
      // Skip non-asset files
      if (['.psd', '.kenshape', '.vox', '.ply', '.txt', '.url'].includes(ext)) continue;
      results.push(full);
    }
  }
  return results;
}

// ── Hash for cache-busting ────────────────────────────────────────
function fileHash(buf) {
  return createHash('md5').update(buf).digest('hex').slice(0, 8);
}

// ── Upload single file ───────────────────────────────────────────
async function upload(key, body, contentType) {
  try {
    // Check if already exists (skip re-upload)
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    console.log(`  SKIP ${key} (exists)`);
    return;
  } catch {
    // Doesn't exist, proceed
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  const sizeMB = (body.length / 1024 / 1024).toFixed(2);
  console.log(`  PUT  ${key} (${sizeMB} MB, ${contentType})`);
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log(`\nScanning ${ASSET_DIR}...`);
  const files = walk(ASSET_DIR);
  console.log(`Found ${files.length} asset files.\n`);

  const manifest = {};
  let uploaded = 0;
  let compressed = 0;

  for (const filePath of files) {
    const rel = relative(join(process.cwd(), 'public', 'assets'), filePath).replace(/\\/g, '/');
    const ext = extname(filePath).toLowerCase();
    const buf = readFileSync(filePath);
    const key = `space/${relative(ASSET_DIR, filePath).replace(/\\/g, '/')}`;
    const mime = MIME[ext] ?? 'application/octet-stream';

    // Upload original
    await upload(key, buf, mime);
    manifest[`/assets/${rel}`] = { key, size: buf.length, hash: fileHash(buf) };
    uploaded++;

    // Convert PNG → WebP (alongside original)
    if (ext === '.png') {
      try {
        const webpBuf = await sharp(buf).webp({ quality: 90 }).toBuffer();
        const webpKey = key.replace(/\.png$/i, '.webp');
        await upload(webpKey, webpBuf, 'image/webp');
        const savings = ((1 - webpBuf.length / buf.length) * 100).toFixed(0);
        console.log(`  WEBP ${webpKey} (${savings}% smaller)`);
        manifest[`/assets/${rel.replace(/\.png$/i, '.webp')}`] = {
          key: webpKey,
          size: webpBuf.length,
          hash: fileHash(webpBuf),
        };
        compressed++;
      } catch (err) {
        console.warn(`  WARN Could not convert ${rel} to WebP:`, err.message);
      }
    }
  }

  // Upload health check file
  await upload('health.txt', Buffer.from('ok'), 'text/plain');

  // Write manifest
  try {
    writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2));
    console.log(`\nManifest written to ${MANIFEST_OUT}`);
  } catch {
    // dist/ might not exist yet
    console.log('\nManifest: dist/ not found, skipping write.');
  }

  console.log(`\nDone! ${uploaded} files uploaded, ${compressed} PNGs converted to WebP.`);
}

main().catch((err) => {
  console.error('Upload failed:', err);
  process.exit(1);
});
