/**
 * space-data-loader.ts — Load remote balance & config overrides from Grudge backend
 *
 * On game init, fetches /rts-config/balance and merges into SHIP_DEFINITIONS.
 * Falls back silently to hardcoded values if backend is unreachable.
 */

import { SHIP_DEFINITIONS, HERO_DEFINITIONS, type ShipStats } from './space-types';

const API_URL = import.meta.env.VITE_GRUDGE_API ?? '';

let _loaded = false;

/**
 * Fetch remote balance overrides and merge into ship definitions.
 * Safe to call multiple times — only fetches once.
 */
export async function loadRemoteBalance(): Promise<boolean> {
  if (_loaded || !API_URL) return false;
  _loaded = true;

  try {
    const res = await fetch(`${API_URL}/rts-config/balance`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;

    const json = await res.json();
    const overrides: Record<string, Partial<ShipStats>> | null = json?.data;
    if (!overrides || typeof overrides !== 'object') return false;

    let applied = 0;
    for (const [key, statOverrides] of Object.entries(overrides)) {
      const def = SHIP_DEFINITIONS[key] ?? HERO_DEFINITIONS[key];
      if (!def || !statOverrides) continue;
      for (const [stat, value] of Object.entries(statOverrides)) {
        if (value !== undefined && stat in def.stats) {
          (def.stats as unknown as Record<string, unknown>)[stat] = value;
          applied++;
        }
      }
    }

    if (applied > 0) {
      console.log(`[data-loader] Applied ${applied} remote balance overrides`);
    }
    return applied > 0;
  } catch (err) {
    // Offline or backend down — use hardcoded defaults
    console.warn('[data-loader] Remote balance unavailable, using defaults');
    return false;
  }
}

/** Report a completed match to the backend. */
export async function reportMatch(data: {
  winner_grudge_id: string;
  loser_grudge_id?: string;
  mode: string;
  duration_s: number;
  map_seed?: number;
  stats?: Record<string, unknown>;
}): Promise<boolean> {
  if (!API_URL) return false;

  try {
    const token = sessionStorage.getItem('grudge_jwt');
    if (!token) return false;

    const res = await fetch(`${API_URL}/rts-matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Fetch leaderboard (public, no auth needed). */
export async function fetchLeaderboard(): Promise<Array<{
  grudge_id: string;
  username: string;
  wins: number;
  avg_duration_s: number;
  avatarUrl: string | null;
}> | null> {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}/rts-matches/leaderboard`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.leaderboard ?? null;
  } catch {
    return null;
  }
}
