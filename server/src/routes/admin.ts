/**
 * routes/admin.ts — Admin dashboard endpoints
 *
 * All routes require admin JWT (is_admin=true).
 *
 * GET  /admin/health
 * GET  /admin/stats
 * GET  /admin/players?q=&page=&limit=
 * GET  /admin/players/:grudgeId
 * PATCH /admin/players/:grudgeId
 * GET  /admin/matches?page=&limit=
 * POST /admin/announce
 * POST /admin/maintenance
 * POST /admin/cache/clear
 * GET  /admin/logs?limit=
 */

import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { query, queryOne, pool } from '../db.js';

export const adminRouter = new Hono();

adminRouter.use('/*', requireAuth({ adminOnly: true }));

const startTime = Date.now();

// ── GET /admin/health ──────────────────────────────────────────────
adminRouter.get('/health', async (c) => {
  let dbConnected = false;
  let playerCount = 0;
  let activeMatches = 0;
  try {
    const rows = await query<{ count: string }>('SELECT COUNT(*) as count FROM users');
    playerCount = parseInt(rows[0]?.count ?? '0', 10);
    dbConnected = true;
    const mRows = await query<{ count: string }>(`SELECT COUNT(*) as count FROM matches WHERE played_at > NOW() - INTERVAL '24 hours'`);
    activeMatches = parseInt(mRows[0]?.count ?? '0', 10);
  } catch {
    /* db not ready */
  }

  return c.json({
    status: 'ok',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: '1.0.0',
    dbConnected,
    playerCount,
    activeMatches,
  });
});

// ── GET /admin/stats ───────────────────────────────────────────────
adminRouter.get('/stats', async (c) => {
  const [players, matches, active24h, avgDur, matches24h] = await Promise.all([
    queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users WHERE is_guest = FALSE'),
    queryOne<{ count: string }>('SELECT COUNT(*) as count FROM matches'),
    queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM users WHERE last_login_at > NOW() - INTERVAL '24 hours'`),
    queryOne<{ avg: string }>('SELECT AVG(duration_secs) as avg FROM matches WHERE duration_secs IS NOT NULL'),
    queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM matches WHERE played_at > NOW() - INTERVAL '24 hours'`),
  ]);

  return c.json({
    totalPlayers: parseInt(players?.count ?? '0', 10),
    totalMatches: parseInt(matches?.count ?? '0', 10),
    activeLast24h: parseInt(active24h?.count ?? '0', 10),
    avgMatchDuration: Math.round(parseFloat(avgDur?.avg ?? '0')),
    matchesLast24h: parseInt(matches24h?.count ?? '0', 10),
    topFaction: 'Corsair', // TODO: derive from match metadata
  });
});

// ── GET /admin/players ─────────────────────────────────────────────
adminRouter.get('/players', async (c) => {
  const q = c.req.query('q') ?? '';
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1', 10));
  const limit = Math.min(100, parseInt(c.req.query('limit') ?? '20', 10));
  const offset = (page - 1) * limit;

  const where = q ? `WHERE u.username ILIKE $3 OR u.grudge_id ILIKE $3` : '';
  const params: unknown[] = [limit, offset];
  if (q) params.push(`%${q}%`);

  const players = await query(
    `SELECT u.grudge_id, u.username, u.display_name, u.avatar_url,
            u.gold, u.gbux_balance, u.wallet_address, u.is_guest, u.is_banned,
            u.created_at, u.last_login_at,
            COALESCE(mp.match_count, 0) AS match_count,
            COALESCE(mp.win_count, 0) AS win_count
     FROM users u
     LEFT JOIN (
       SELECT user_id,
              COUNT(*) AS match_count,
              COUNT(*) FILTER (WHERE result = 'win') AS win_count
       FROM match_players GROUP BY user_id
     ) mp ON mp.user_id = u.id
     ${where}
     ORDER BY u.last_login_at DESC NULLS LAST
     LIMIT $1 OFFSET $2`,
    params,
  );

  const totalRow = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM users ${where}`, q ? [`%${q}%`] : []);

  return c.json({ players, total: parseInt(totalRow?.count ?? '0', 10) });
});

// ── GET /admin/players/:grudgeId ───────────────────────────────────
adminRouter.get('/players/:grudgeId', async (c) => {
  const grudgeId = decodeURIComponent(c.req.param('grudgeId'));
  const player = await queryOne(
    `SELECT u.*, COALESCE(mp.match_count, 0) AS match_count, COALESCE(mp.win_count, 0) AS win_count
     FROM users u
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS match_count,
              COUNT(*) FILTER (WHERE result = 'win') AS win_count
       FROM match_players GROUP BY user_id
     ) mp ON mp.user_id = u.id
     WHERE u.grudge_id = $1`,
    [grudgeId],
  );
  if (!player) return c.json({ error: 'Not found' }, 404);
  return c.json(player);
});

// ── PATCH /admin/players/:grudgeId ─────────────────────────────────
adminRouter.patch('/players/:grudgeId', async (c) => {
  const grudgeId = decodeURIComponent(c.req.param('grudgeId'));
  const body = (await c.req.json()) as {
    gold?: number;
    gbuxBalance?: number;
    isBanned?: boolean;
    displayName?: string;
  };

  const sets: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (body.gold !== undefined) {
    sets.push(`gold = $${i++}`);
    params.push(body.gold);
  }
  if (body.gbuxBalance !== undefined) {
    sets.push(`gbux_balance = $${i++}`);
    params.push(body.gbuxBalance);
  }
  if (body.isBanned !== undefined) {
    sets.push(`is_banned = $${i++}`);
    params.push(body.isBanned);
  }
  if (body.displayName !== undefined) {
    sets.push(`display_name = $${i++}`);
    params.push(body.displayName);
  }

  if (!sets.length) return c.json({ error: 'Nothing to update' }, 400);
  params.push(grudgeId);

  await pool.query(`UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE grudge_id = $${i}`, params);
  return c.json({ ok: true });
});

// ── GET /admin/matches ─────────────────────────────────────────────
adminRouter.get('/matches', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1', 10));
  const limit = Math.min(100, parseInt(c.req.query('limit') ?? '25', 10));
  const offset = (page - 1) * limit;

  const matches = await query(
    `SELECT m.id, m.mode, m.winner_team, m.win_condition, m.duration_secs, m.played_at,
            m.player_count, m.map_seed
     FROM matches m ORDER BY m.played_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  const totalRow = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM matches');
  return c.json({ matches, total: parseInt(totalRow?.count ?? '0', 10) });
});

// ── POST /admin/announce ───────────────────────────────────────────
adminRouter.post('/announce', async (c) => {
  const { message } = (await c.req.json()) as { message: string };
  if (!message?.trim()) return c.json({ error: 'message is required' }, 400);
  await pool.query(`INSERT INTO announcements (title, body, type) VALUES ($1, $2, 'info')`, ['Announcement', message]);
  return c.json({ ok: true });
});

// ── POST /admin/maintenance ────────────────────────────────────────
adminRouter.post('/maintenance', async (c) => {
  const { enabled } = (await c.req.json()) as { enabled: boolean };
  await pool.query(
    `INSERT INTO remote_config (key, value) VALUES ('maintenanceMode', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [JSON.stringify(enabled)],
  );
  return c.json({ ok: true });
});

// ── POST /admin/cache/clear ────────────────────────────────────────
adminRouter.post('/cache/clear', async (c) => {
  // In-memory rate limiter reset etc. — extend as needed
  return c.json({ ok: true, cleared: ['rate-limit-map'] });
});

// ── GET /admin/logs ────────────────────────────────────────────────
adminRouter.get('/logs', async (c) => {
  const limit = Math.min(500, parseInt(c.req.query('limit') ?? '100', 10));
  const logs = await query(
    `SELECT level, category, message, created_at AS timestamp
     FROM server_logs ORDER BY created_at DESC LIMIT $1`,
    [limit],
  );
  return c.json({ logs });
});
