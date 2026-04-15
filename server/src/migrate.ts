/**
 * migrate.ts — Run database migrations on startup or via npm run migrate
 *
 * Usage: npm run migrate
 */

import { pool } from './db.js';

const SCHEMA = `
-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Auto-update trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grudge_id      TEXT UNIQUE NOT NULL,
  username       TEXT NOT NULL,
  display_name   TEXT,
  avatar_url     TEXT,
  provider       TEXT NOT NULL DEFAULT 'discord',
  wallet_address TEXT,
  gold           INTEGER NOT NULL DEFAULT 0,
  gbux_balance   INTEGER NOT NULL DEFAULT 0,
  is_guest       BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin       BOOLEAN NOT NULL DEFAULT FALSE,
  is_banned      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_users_grudge_id ON users (grudge_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users USING gin (username gin_trgm_ops);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
    CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Hero Ships (one per user)
CREATE TABLE IF NOT EXISTS hero_ships (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL DEFAULT 'Unnamed Ship',
  voxel_count    INTEGER NOT NULL DEFAULT 0,
  grid_data      JSONB,
  glb_url        TEXT,
  glb_size_bytes INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_hero_ships_updated_at') THEN
    CREATE TRIGGER trg_hero_ships_updated_at BEFORE UPDATE ON hero_ships
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Campaign Saves (one active save per user)
CREATE TABLE IF NOT EXISTS campaign_saves (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grudge_id              TEXT NOT NULL,
  sector_seed            TEXT NOT NULL,
  conquered_planet_ids   INTEGER[] NOT NULL DEFAULT '{}',
  total_planets          INTEGER NOT NULL DEFAULT 0,
  homeworld_id           INTEGER,
  campaign_start_time    BIGINT NOT NULL,
  elapsed_game_time      BIGINT NOT NULL DEFAULT 0,
  titles_earned          TEXT[] NOT NULL DEFAULT '{}',
  story_beats_completed  TEXT[] NOT NULL DEFAULT '{}',
  pvp_unlocked           BOOLEAN NOT NULL DEFAULT FALSE,
  post_conquest_waves    INTEGER NOT NULL DEFAULT 0,
  resources              JSONB NOT NULL DEFAULT '{}',
  upgrades               JSONB NOT NULL DEFAULT '{}',
  tech_researched        JSONB NOT NULL DEFAULT '{}',
  faction_progress       JSONB NOT NULL DEFAULT '{}',
  active_events          JSONB NOT NULL DEFAULT '[]',
  completed_event_ids    TEXT[] NOT NULL DEFAULT '{}',
  log_entries            JSONB NOT NULL DEFAULT '[]',
  commander_name         TEXT,
  commander_portrait     TEXT,
  commander_spec         TEXT,
  saved_at               BIGINT NOT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_campaign_saves_updated_at') THEN
    CREATE TRIGGER trg_campaign_saves_updated_at BEFORE UPDATE ON campaign_saves
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Matches + Match Players
CREATE TABLE IF NOT EXISTS matches (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode           TEXT NOT NULL,
  winner_team    INTEGER,
  win_condition  TEXT,
  duration_secs  INTEGER,
  game_time      REAL,
  player_count   INTEGER NOT NULL DEFAULT 1,
  map_seed       TEXT,
  metadata       JSONB NOT NULL DEFAULT '{}',
  played_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_players (
  match_id       UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  grudge_id      TEXT,
  team           INTEGER NOT NULL,
  result         TEXT NOT NULL,
  score          INTEGER NOT NULL DEFAULT 0,
  units_killed   INTEGER NOT NULL DEFAULT 0,
  resources_spent INTEGER NOT NULL DEFAULT 0,
  commander_spec TEXT,
  PRIMARY KEY (match_id, team)
);
CREATE INDEX IF NOT EXISTS idx_match_players_user ON match_players (user_id);

-- Leaderboard
CREATE TABLE IF NOT EXISTS leaderboard (
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode           TEXT NOT NULL,
  wins           INTEGER NOT NULL DEFAULT 0,
  losses         INTEGER NOT NULL DEFAULT 0,
  score          INTEGER NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, mode)
);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard (mode, score DESC);

-- Remote Config
CREATE TABLE IF NOT EXISTS remote_config (
  key            TEXT PRIMARY KEY,
  value          JSONB NOT NULL,
  description    TEXT,
  updated_by     UUID REFERENCES users(id),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  body           TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'info',
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at     TIMESTAMPTZ,
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Server Logs
CREATE TABLE IF NOT EXISTS server_logs (
  id             BIGSERIAL PRIMARY KEY,
  level          TEXT NOT NULL,
  category       TEXT,
  message        TEXT NOT NULL,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_server_logs_created ON server_logs (level, created_at DESC);
`;

async function migrate() {
  console.log('[migrate] Running schema migration...');
  try {
    await pool.query(SCHEMA);
    console.log('[migrate] ✅ Schema up to date.');
  } catch (err) {
    console.error('[migrate] ❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
