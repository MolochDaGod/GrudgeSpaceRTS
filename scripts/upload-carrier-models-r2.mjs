#!/usr/bin/env node
/**
 * upload-carrier-models-r2.mjs — Push Carrier fleet/station models to R2.
 *
 * Source: F:\GitHub\Carrier\lib\assets\models\
 * Target:  s3://grudge-assets/carrier/models/{relative-path}
 * CDN:      https://assets.grudge-studio.com/carrier/models/…
 *
 * Usage:
 *   node scripts/upload-carrier-models-r2.mjs
 *   node scripts/upload-carrier-models-r2.mjs --dry-run
 *   node scripts/upload-carrier-models-r2.mjs --only vehicles/space,environment/stations
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

const CARRIER_MODELS_ROOT =
  process.env.CARRIER_MODELS_ROOT ?? 'F:\\GitHub\\Carrier\\lib\\assets\\models';
const R2_PREFIX = 'carrier/models';
const BUCKET = process.env.R2_BUCKET ?? 'grudge-assets';
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const ONLY = (() => {
  const idx = process.argv.indexOf('--only');
  return idx !== -1 && process.argv[idx + 1]
    ? process.argv[idx + 1].split(',').map((s) => s.trim())
    : ['vehicles/space', 'environment/stations', 'vehicles/space/fighters'];
})();

const MIME_MAP = {
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.fbx': 'application/octet-stream',
  '.obj': 'text/plain',
  '.mtl': 'text/plain',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function loadEnvFiles() {
  for (const root of [join(__dirname, '..'), 'C:\\Users\\nugye\\Documents\\1111111\\GrudgeBuilder']) {
    for (const filename of ['.env', '.env.local']) {
      const path = join(root, filename);
      if (!existsSync(path)) continue;
      for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
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
  }
  if (!process.env.R2_ACCESS_KEY_ID && process.env.CF_R2_ACCESS_KEY_ID) {
    process.env.R2_ACCESS_KEY_ID = process.env.CF_R2_ACCESS_KEY_ID;
  }
  if (!process.env.R2_SECRET_ACCESS_KEY && process.env.CF_R2_SECRET_ACCESS_KEY) {
    process.env.R2_SECRET_ACCESS_KEY = process.env.CF_R2_SECRET_ACCESS_KEY;
  }
  if (!process.env.R2_ENDPOINT) {
    if (process.env.R2_S3_ENDPOINT) process.env.R2_ENDPOINT = process.env.R2_S3_ENDPOINT;
    else if (process.env.CF_ACCOUNT_ID) {
      process.env.R2_ENDPOINT = `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    }
  }
}
loadEnvFiles();

function getMime(filepath) {
  return MIME_MAP[extname(filepath).toLowerCase()] ?? 'application/octet-stream';
}

async function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile() && !entry.name.startsWith('.')) out.push(full);
  }
  return out;
}

async function md5(file) {
  return createHash('md5').update(await readFile(file)).digest('hex');
}

async function main() {
  console.log('Carrier models → R2 upload');
  console.log(`  source: ${CARRIER_MODELS_ROOT}`);
  console.log(`  prefix: ${R2_PREFIX}`);
  console.log(`  only:   ${ONLY.join(', ')}`);
  if (DRY_RUN) console.log('  mode:   DRY RUN\n');

  for (const key of ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ENDPOINT']) {
    if (!DRY_RUN && !process.env[key]) {
      console.error(`Missing ${key}`);
      process.exit(1);
    }
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  const candidates = [];
  for (const sub of ONLY) {
    const dir = join(CARRIER_MODELS_ROOT, sub.replace(/\//g, '\\'));
    candidates.push(...(await walk(dir)));
  }

  const files = [...new Set(candidates)].filter((f) => {
    const ext = extname(f).toLowerCase();
    return ['.glb', '.gltf', '.obj', '.mtl', '.fbx', '.bin', '.png', '.jpg', '.jpeg', '.webp'].includes(ext);
  });

  console.log(`Found ${files.length} files\n`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  const manifest = [];

  for (const file of files) {
    const rel = relative(CARRIER_MODELS_ROOT, file).replace(/\\/g, '/');
    const key = `${R2_PREFIX}/${rel}`;
    const hash = await md5(file);
    const size = (await stat(file)).size;

    if (!DRY_RUN && !FORCE) {
      try {
        const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
        if (head.ETag?.replace(/"/g, '') === hash) {
          skipped++;
          manifest.push({ key, url: `https://assets.grudge-studio.com/${key}`, size, skipped: true });
          continue;
        }
      } catch {
        /* not on R2 yet */
      }
    }

    if (DRY_RUN) {
      console.log(`  [dry] ${key} (${(size / 1024).toFixed(1)} KB)`);
      uploaded++;
      continue;
    }

    try {
      const body = await readFile(file);
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: body,
          ContentType: getMime(file),
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
      uploaded++;
      manifest.push({ key, url: `https://assets.grudge-studio.com/${key}`, size, hash });
      if (uploaded % 10 === 0) console.log(`  uploaded ${uploaded}/${files.length}…`);
    } catch (err) {
      failed++;
      console.error(`  FAIL ${key}: ${err.message}`);
    }
  }

  const manifestPath = join(__dirname, '..', 'shared', 'carrier-models-manifest.json');
  await writeFile(
    manifestPath,
    JSON.stringify({ uploadedAt: new Date().toISOString(), prefix: R2_PREFIX, files: manifest }, null, 2),
  );

  console.log(`\nDone: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`);
  console.log(`Manifest: ${manifestPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});