/**
 * routes/world.ts \u2014 PvP world matchmaker (REST endpoints).
 *
 *   GET  /world/shards          \u2014 list all shards + populations (public)
 *   GET  /world/health          \u2014 diagnostics: tickHz + per-shard stats (public)
 *   POST /world/connect         \u2014 returns a signed connect URL for the
 *                                 chosen shard (auth required). Client
 *                                 then opens a WebSocket to that URL.
 */

import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { getWorldServer } from '../world/server.js';

export const worldRouter = new Hono();

// ── GET /world/shards ─────────────────────────────────────────────
worldRouter.get('/shards', (c) => {
  const ws = getWorldServer();
  return c.json({ shards: ws.listShards() });
});

// ── GET /world/health ─────────────────────────────────────────────
worldRouter.get('/health', (c) => {
  return c.json(getWorldServer().diagnostics());
});

// ── POST /world/connect ───────────────────────────────────────────
// Body: { shardId?: string; system?: string }
// Returns: { url, shardId, expiresAt }
//
// The client should connect to ws(s)://<host>/world?token=<token>&shard=<id>
// within `expiresAt`; expired tokens are rejected at upgrade time.
worldRouter.post('/connect', requireAuth(), async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    shardId?: string;
    system?: string;
  };
  const ws = getWorldServer();

  let shard;
  if (body.shardId) {
    shard = ws.listShards().find((s) => s.id === body.shardId);
  }
  if (!shard) {
    const found = ws.findOpenShard(body.system);
    if (!found) {
      return c.json({ error: 'No shard with capacity' }, 503);
    }
    shard = { id: found.id, name: found.cfg.name, system: found.cfg.system, population: found.population, max: found.cfg.maxPlayers };
  }

  // We re-use the existing user JWT \u2014 the WS upgrade handler verifies it.
  // The client passes its current token via the Authorization header on
  // the connect call, and we hand back the WS URL + token to use.
  const auth = c.req.header('Authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return c.json({ error: 'No bearer token to forward' }, 401);

  // Resolve scheme + host from forwarded headers when behind a proxy
  // (Railway sets x-forwarded-proto / x-forwarded-host).
  const proto = c.req.header('x-forwarded-proto') ?? 'https';
  const host = c.req.header('x-forwarded-host') ?? c.req.header('host') ?? 'localhost';
  const wsScheme = proto === 'https' ? 'wss' : 'ws';
  const url = `${wsScheme}://${host}/world?token=${encodeURIComponent(token)}&shard=${encodeURIComponent(shard.id)}`;

  return c.json({
    url,
    shardId: shard.id,
    shardName: shard.name,
    population: shard.population,
    maxPlayers: shard.max,
    // Token is the same JWT as the API; expiresAt is informational.
    expiresAt: Date.now() + 30 * 60_000,
  });
});
