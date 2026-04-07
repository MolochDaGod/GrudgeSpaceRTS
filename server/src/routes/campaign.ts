/**
 * routes/campaign.ts — Campaign save/load endpoints
 *
 * GET  /campaign/load  — load active campaign
 * POST /campaign/save  — upsert campaign save
 */

import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { queryOne, pool } from '../db.js';

export const campaignRouter = new Hono();

campaignRouter.use('/*', requireAuth());

// ── GET /campaign/load ─────────────────────────────────────────────
campaignRouter.get('/load', async (c) => {
  const { sub: grudgeId } = c.var.user;

  const save = await queryOne(
    `SELECT cs.*
     FROM campaign_saves cs
     JOIN users u ON u.id = cs.user_id
     WHERE u.grudge_id = $1`,
    [grudgeId],
  );

  if (!save) return c.json({ save: null });

  return c.json({
    save: {
      grudgeId: save.grudge_id,
      progress: {
        sectorSeed: save.sector_seed,
        conqueredPlanetIds: save.conquered_planet_ids,
        totalPlanets: save.total_planets,
        homeworldId: save.homeworld_id,
        campaignStartTime: Number(save.campaign_start_time),
        elapsedGameTime: Number(save.elapsed_game_time),
        titlesEarned: save.titles_earned,
        storyBeatsCompleted: save.story_beats_completed,
        pvpUnlocked: save.pvp_unlocked,
        postConquestWaves: save.post_conquest_waves,
        factionProgress: save.faction_progress,
      },
      commanderName: save.commander_name,
      commanderPortrait: save.commander_portrait,
      commanderSpec: save.commander_spec,
      resources: save.resources,
      upgrades: save.upgrades,
      techResearched: save.tech_researched,
      activeEvents: save.active_events,
      completedEventIds: save.completed_event_ids,
      logEntries: save.log_entries,
      savedAt: Number(save.saved_at),
    },
  });
});

// ── POST /campaign/save ────────────────────────────────────────────
campaignRouter.post('/save', async (c) => {
  const { sub: grudgeId } = c.var.user;

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const p = body.progress as Record<string, unknown> | undefined;
  if (!p?.sectorSeed) return c.json({ error: 'progress.sectorSeed is required' }, 400);

  const db = await pool.connect();
  try {
    await db.query(
      `INSERT INTO campaign_saves (
         user_id, grudge_id, sector_seed, conquered_planet_ids, total_planets,
         homeworld_id, campaign_start_time, elapsed_game_time, titles_earned,
         story_beats_completed, pvp_unlocked, post_conquest_waves,
         resources, upgrades, tech_researched, faction_progress,
         active_events, completed_event_ids, log_entries,
         commander_name, commander_portrait, commander_spec, saved_at
       )
       SELECT u.id, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
              $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
       FROM users u WHERE u.grudge_id = $1
       ON CONFLICT (user_id) DO UPDATE SET
         sector_seed            = EXCLUDED.sector_seed,
         conquered_planet_ids   = EXCLUDED.conquered_planet_ids,
         total_planets          = EXCLUDED.total_planets,
         homeworld_id           = EXCLUDED.homeworld_id,
         campaign_start_time    = EXCLUDED.campaign_start_time,
         elapsed_game_time      = EXCLUDED.elapsed_game_time,
         titles_earned          = EXCLUDED.titles_earned,
         story_beats_completed  = EXCLUDED.story_beats_completed,
         pvp_unlocked           = EXCLUDED.pvp_unlocked,
         post_conquest_waves    = EXCLUDED.post_conquest_waves,
         resources              = EXCLUDED.resources,
         upgrades               = EXCLUDED.upgrades,
         tech_researched        = EXCLUDED.tech_researched,
         faction_progress       = EXCLUDED.faction_progress,
         active_events          = EXCLUDED.active_events,
         completed_event_ids    = EXCLUDED.completed_event_ids,
         log_entries            = EXCLUDED.log_entries,
         commander_name         = EXCLUDED.commander_name,
         commander_portrait     = EXCLUDED.commander_portrait,
         commander_spec         = EXCLUDED.commander_spec,
         saved_at               = EXCLUDED.saved_at,
         updated_at             = NOW()`,
      [
        grudgeId,
        p.sectorSeed,
        JSON.stringify(p.conqueredPlanetIds ?? []),
        p.totalPlanets ?? 0,
        p.homeworldId ?? null,
        p.campaignStartTime ?? Date.now(),
        p.elapsedGameTime ?? 0,
        JSON.stringify(p.titlesEarned ?? []),
        JSON.stringify(p.storyBeatsCompleted ?? []),
        p.pvpUnlocked ?? false,
        p.postConquestWaves ?? 0,
        JSON.stringify(body.resources ?? {}),
        JSON.stringify(body.upgrades ?? {}),
        JSON.stringify(body.techResearched ?? {}),
        JSON.stringify(p.factionProgress ?? {}),
        JSON.stringify(body.activeEvents ?? []),
        JSON.stringify(body.completedEventIds ?? []),
        JSON.stringify(body.logEntries ?? []),
        body.commanderName ?? null,
        body.commanderPortrait ?? null,
        body.commanderSpec ?? null,
        body.savedAt ?? Date.now(),
      ],
    );
  } finally {
    db.release();
  }

  return c.json({ ok: true });
});
