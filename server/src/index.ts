/**
 * index.ts — Grudge Space API Server (Hono + Node.js)
 *
 * Endpoints:
 *   /auth/*          — OAuth + user profile
 *   /hero-ship       — Hero ship save/load
 *   /campaign/*      — Campaign save/load
 *   /match/*         — Match recording
 *   /leaderboard/*   — Leaderboard (via matchRouter)
 *   /ai/*            — AI narration proxy
 *   /admin/*         — Admin dashboard (admin JWT required)
 *   /rts-config/*    — Remote game config
 *   /rts-matches/*   — RTS-specific leaderboard
 *   /health          — Public health check
 */

import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { pool } from './db.js';
import { authRouter } from './routes/auth.js';
import { heroShipRouter } from './routes/hero-ship.js';
import { campaignRouter } from './routes/campaign.js';
import { matchRouter, rtsMatchesRouter } from './routes/match.js';
import { aiRouter } from './routes/ai.js';
import { adminRouter } from './routes/admin.js';
import { rtsConfigRouter } from './routes/rts-config.js';

const app = new Hono();

// ── Middleware ─────────────────────────────────────────────────────
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:4541').split(','),
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
);

// ── Public Health ─────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', ts: Date.now() }));

// ── Routes ────────────────────────────────────────────────────────
app.route('/auth', authRouter);
app.route('/hero-ship', heroShipRouter);
app.route('/campaign', campaignRouter);
app.route('/match', matchRouter);
app.route('/leaderboard', matchRouter); // GET /leaderboard/:mode handled inside
app.route('/ai', aiRouter);
app.route('/admin', adminRouter);
app.route('/rts-config', rtsConfigRouter);
app.route('/rts-matches', rtsMatchesRouter);

// ── 404 fallback ──────────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// ── Error handler ─────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('[server] Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// ── Start ─────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3001', 10);

serve({ fetch: app.fetch, port: PORT }, async () => {
  console.log(`[server] 🚀 Grudge Space API listening on port ${PORT}`);

  // Verify DB connection on startup
  try {
    await pool.query('SELECT 1');
    console.log('[server] ✅ Database connected');
  } catch (err) {
    console.error('[server] ❌ Database connection failed:', err);
    console.warn('[server] Running without DB — some endpoints will fail');
  }
});
