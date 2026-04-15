/**
 * routes/match.ts — Match recording + leaderboard
 *
 * POST /match/complete       — record finished match, update leaderboard
 * GET  /leaderboard/:mode    — top 100 players for a game mode
 */

import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { query, pool } from '../db.js';

export const matchRouter = new Hono();

// Leaderboard is public
matchRouter.get('/leaderboard/:mode', async (c) => {
  const mode = c.req.param('mode');

  const rows = await query(
    `SELECT u.grudge_id, u.username, u.display_name, u.avatar_url,
            l.wins, l.losses, l.score
     FROM leaderboard l
     JOIN users u ON u.id = l.user_id
     WHERE l.mode = $1
     ORDER BY l.score DESC
     LIMIT 100`,
    [mode],
  );

  return c.json({
    leaderboard: rows.map((r) => ({
      grudge_id: r.grudge_id,
      username: r.username,
      displayName: r.display_name,
      avatarUrl: r.avatar_url,
      wins: r.wins,
      losses: r.losses,
      score: r.score,
    })),
  });
});

// Match completion requires auth
matchRouter.use('/complete', requireAuth());
matchRouter.post('/complete', async (c) => {
  const { sub: grudgeId } = c.var.user;

  let body: {
    mode: string;
    winnerTeam?: number;
    winCondition?: string;
    durationSecs?: number;
    gameTime?: number;
    mapSeed?: string;
    players: Array<{
      grudgeId: string;
      team: number;
      result: 'win' | 'loss' | 'draw';
      score?: number;
      unitsKilled?: number;
      resourcesSpent?: number;
      commanderSpec?: string;
    }>;
    metadata?: Record<string, unknown>;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.mode || !body.players?.length) {
    return c.json({ error: 'mode and players[] are required' }, 400);
  }

  const db = await pool.connect();
  try {
    await db.query('BEGIN');

    // Insert match
    const matchRes = await db.query(
      `INSERT INTO matches (mode, winner_team, win_condition, duration_secs, game_time, map_seed, player_count, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        body.mode,
        body.winnerTeam ?? null,
        body.winCondition ?? null,
        body.durationSecs ?? null,
        body.gameTime ?? null,
        body.mapSeed ?? null,
        body.players.length,
        JSON.stringify(body.metadata ?? {}),
      ],
    );
    const matchId = matchRes.rows[0].id as string;

    // Resolve user IDs for all players
    const playerGrudgeIds = body.players.map((p) => p.grudgeId);
    const userRows = await db.query(`SELECT id, grudge_id FROM users WHERE grudge_id = ANY($1)`, [playerGrudgeIds]);
    const userMap = new Map<string, string>((userRows.rows as { id: string; grudge_id: string }[]).map((r) => [r.grudge_id, r.id]));

    // Insert match_players + update leaderboard
    for (const p of body.players) {
      const userId = userMap.get(p.grudgeId) ?? null;
      await db.query(
        `INSERT INTO match_players (match_id, user_id, grudge_id, team, result, score, units_killed, resources_spent, commander_spec)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [matchId, userId, p.grudgeId, p.team, p.result, p.score ?? 0, p.unitsKilled ?? 0, p.resourcesSpent ?? 0, p.commanderSpec ?? null],
      );

      if (userId) {
        const win = p.result === 'win' ? 1 : 0;
        const loss = p.result === 'loss' ? 1 : 0;
        const pts = p.result === 'win' ? 100 : p.result === 'draw' ? 25 : 0;

        await db.query(
          `INSERT INTO leaderboard (user_id, mode, wins, losses, score)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, mode) DO UPDATE SET
             wins   = leaderboard.wins   + EXCLUDED.wins,
             losses = leaderboard.losses + EXCLUDED.losses,
             score  = leaderboard.score  + EXCLUDED.score,
             updated_at = NOW()`,
          [userId, body.mode, win, loss, pts],
        );
      }
    }

    await db.query('COMMIT');
    return c.json({ ok: true, matchId });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('[match/complete] Error:', err);
    return c.json({ error: 'Failed to record match' }, 500);
  } finally {
    db.release();
  }
});

// ── RTS Matches leaderboard (alias used by admin panel) ────────────
// GET /rts-matches/leaderboard
export const rtsMatchesRouter = new Hono();
rtsMatchesRouter.get('/leaderboard', async (c) => {
  const rows = await query(
    `SELECT u.grudge_id, u.username, u.avatar_url,
            l.wins,
            COALESCE(
              (SELECT AVG(m.duration_secs) FROM match_players mp
               JOIN matches m ON m.id = mp.match_id
               WHERE mp.user_id = l.user_id AND m.mode = 'rts'), 0
            ) AS avg_duration_s
     FROM leaderboard l
     JOIN users u ON u.id = l.user_id
     WHERE l.mode = 'rts'
     ORDER BY l.score DESC
     LIMIT 50`,
  );

  return c.json({ leaderboard: rows });
});
