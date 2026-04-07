/**
 * routes/rts-config.ts — Remote game balance + settings
 *
 * GET  /rts-config/balance   — fetch balance overrides (public)
 * PUT  /rts-config/balance   — save balance overrides (admin)
 * GET  /rts-config/settings  — fetch game settings (public)
 * PUT  /rts-config/settings  — save game settings (admin)
 */

import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { queryOne, pool } from '../db.js';

export const rtsConfigRouter = new Hono();

// ── GET /rts-config/balance ────────────────────────────────────────
rtsConfigRouter.get('/balance', async (c) => {
  const row = await queryOne<{ value: unknown }>(`SELECT value FROM remote_config WHERE key = 'balance'`);
  return c.json({ data: row?.value ?? {} });
});

// ── PUT /rts-config/balance ────────────────────────────────────────
rtsConfigRouter.put('/balance', requireAuth({ adminOnly: true }), async (c) => {
  const body = (await c.req.json()) as { data: Record<string, unknown> };
  await pool.query(
    `INSERT INTO remote_config (key, value) VALUES ('balance', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [JSON.stringify(body.data ?? {})],
  );
  return c.json({ ok: true });
});

// ── GET /rts-config/settings ───────────────────────────────────────
rtsConfigRouter.get('/settings', async (c) => {
  const row = await queryOne<{ value: unknown }>(`SELECT value FROM remote_config WHERE key = 'gameSettings'`);
  // Return sane defaults if nothing is saved yet
  const defaults = {
    captureTime: 10,
    captureRatePerUnit: 0.1,
    dominationTime: 30,
    neutralDefenders: 3,
    startingResources: { credits: 500, energy: 200, minerals: 100 },
    maintenanceMode: false,
    motd: '',
  };
  return c.json({ ...defaults, ...((row?.value as Record<string, unknown>) ?? {}) });
});

// ── PUT /rts-config/settings ───────────────────────────────────────
rtsConfigRouter.put('/settings', requireAuth({ adminOnly: true }), async (c) => {
  const body = await c.req.json();
  await pool.query(
    `INSERT INTO remote_config (key, value) VALUES ('gameSettings', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [JSON.stringify(body)],
  );
  return c.json({ ok: true });
});
