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
 *   /world/*         — PvP world matchmaker (HTTP) + /world WebSocket
 *   /health          — Public health check
 *
 * Express-style middleware patterns adopted via Hono primitives:
 *   - logger() / cors() applied app-wide
 *   - requireAuth() per-route guard (jose JWT)
 *   - app.notFound() / app.onError() at the bottom
 *   - Graceful shutdown on SIGTERM / SIGINT
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
import { worldRouter } from './routes/world.js';
import { getWorldServer } from './world/server.js';

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
app.route('/world', worldRouter);

// ── 404 fallback ──────────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// ── Error handler ─────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('[server] Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// ── Start ──────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3001', 10);

const server = serve({ fetch: app.fetch, port: PORT }, async () => {
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

// ── PvP World Server (WebSocket on the same HTTP server) ───────────
// One process hosts both the campaign API and the PvP world server,
// keeping the Railway deployment to a single service. Set
// WORLD_DISABLE=true to opt out (e.g. when running an API-only replica).
if (process.env.WORLD_DISABLE !== 'true') {
  const world = getWorldServer();
  // @hono/node-server returns the underlying http.Server, which `ws`
  // attaches to via the 'upgrade' event.
  world.attach(server as unknown as import('node:http').Server);
  console.log('[server] 🌍 World server attached at /world');
}

// ── Graceful shutdown ─────────────────────────────────────────────────
function shutdown(signal: string): void {
  console.log(`[server] received ${signal}, draining…`);
  if (process.env.WORLD_DISABLE !== 'true') getWorldServer().shutdown();
  pool.end().catch(() => undefined);
  // serve()'s Server has a close() method (http.Server)
  (server as unknown as import('node:http').Server).close(() => process.exit(0));
  // Hard kill after 10s if anything hangs.
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
