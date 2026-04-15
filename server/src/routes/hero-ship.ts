/**
 * routes/hero-ship.ts — Hero ship save/load
 *
 * GET  /hero-ship   — load player's hero ship metadata + glb URL
 * POST /hero-ship   — save hero ship (GLB stored in R2, metadata in DB)
 */

import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { queryOne, pool } from '../db.js';

export const heroShipRouter = new Hono();

heroShipRouter.use('/*', requireAuth());

// ── GET /hero-ship ─────────────────────────────────────────────────
heroShipRouter.get('/', async (c) => {
  const { sub: grudgeId } = c.var.user;

  const ship = await queryOne(
    `SELECT hs.id, hs.name, hs.voxel_count, hs.grid_data, hs.glb_url, hs.glb_size_bytes,
            hs.created_at, hs.updated_at
     FROM hero_ships hs
     JOIN users u ON u.id = hs.user_id
     WHERE u.grudge_id = $1`,
    [grudgeId],
  );

  if (!ship) return c.json({ meta: null, glbBase64: null });

  // If glb_url is set (R2), return the URL directly instead of base64
  return c.json({
    meta: {
      name: ship.name,
      createdAt: new Date(ship.created_at as string).getTime(),
      voxelCount: ship.voxel_count,
      gridData: ship.grid_data,
    },
    glbUrl: ship.glb_url ?? null,
    glbBase64: null, // use glbUrl — base64 is only for legacy fallback
  });
});

// ── POST /hero-ship ────────────────────────────────────────────────
// Body: { meta: HeroShipMeta, glbBase64: string } (legacy)
//    OR { meta: HeroShipMeta, glbUrl: string }    (preferred with R2)
heroShipRouter.post('/', async (c) => {
  const { sub: grudgeId } = c.var.user;

  let body: {
    meta: { name: string; voxelCount: number; gridData?: string; createdAt?: number };
    glbBase64?: string;
    glbUrl?: string;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { meta, glbBase64, glbUrl } = body;
  if (!meta?.name) return c.json({ error: 'meta.name is required' }, 400);

  // Resolve the glb URL
  let resolvedGlbUrl = glbUrl ?? null;
  let glbSizeBytes: number | null = null;

  // If caller sent base64 (legacy mode), upload to R2
  if (!resolvedGlbUrl && glbBase64) {
    resolvedGlbUrl = await uploadGlbToR2(grudgeId, glbBase64);
    glbSizeBytes = Math.round((glbBase64.length * 3) / 4);
  }

  // Upsert into hero_ships
  const db = await pool.connect();
  try {
    await db.query(
      `INSERT INTO hero_ships (user_id, name, voxel_count, grid_data, glb_url, glb_size_bytes)
       SELECT u.id, $2, $3, $4, $5, $6
       FROM users u WHERE u.grudge_id = $1
       ON CONFLICT (user_id) DO UPDATE SET
         name           = EXCLUDED.name,
         voxel_count    = EXCLUDED.voxel_count,
         grid_data      = EXCLUDED.grid_data,
         glb_url        = COALESCE(EXCLUDED.glb_url, hero_ships.glb_url),
         glb_size_bytes = COALESCE(EXCLUDED.glb_size_bytes, hero_ships.glb_size_bytes),
         updated_at     = NOW()`,
      [grudgeId, meta.name, meta.voxelCount ?? 0, meta.gridData ?? null, resolvedGlbUrl, glbSizeBytes],
    );
  } finally {
    db.release();
  }

  return c.json({ ok: true, glbUrl: resolvedGlbUrl });
});

// ── R2 Upload Helper ───────────────────────────────────────────────
async function uploadGlbToR2(grudgeId: string, glbBase64: string): Promise<string | null> {
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!endpoint || !bucket) {
    // R2 not configured — store base64 in DB as fallback (not recommended for production)
    console.warn('[hero-ship] R2 not configured, skipping upload');
    return null;
  }

  try {
    // Dynamically import AWS SDK S3 client (optional dependency)
    const { S3Client, PutObjectCommand } = (await import('@aws-sdk/client-s3' as string as never)) as {
      S3Client: new (config: Record<string, unknown>) => unknown;
      PutObjectCommand: new (config: Record<string, unknown>) => unknown;
    };

    const client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
      },
    });

    const buf = Buffer.from(glbBase64, 'base64');
    const key = `hero-ships/${grudgeId}.glb`;

    await (client as { send: (cmd: unknown) => Promise<unknown> }).send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buf,
        ContentType: 'model/gltf-binary',
        CacheControl: 'public, max-age=3600',
      }),
    );

    return `${publicUrl}/${key}`;
  } catch (err) {
    console.error('[hero-ship] R2 upload failed:', err);
    return null;
  }
}
