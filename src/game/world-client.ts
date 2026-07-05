/**
 * world-client.ts — Open-world / Infinity Universe shard browser.
 *
 * Talks to the co-located Space API (`/world/*`) on Railway. Vercel rewrites
 * same-origin `/world/*` when VITE_SPACE_API_URL is unset (dev uses local server).
 */

import { authFetch, getToken } from './grudge-auth';

export interface WorldShardInfo {
  id: string;
  name: string;
  system: string;
  population: number;
  max: number;
}

export interface WorldConnectResult {
  url: string;
  shardId: string;
  shardName: string;
  population: number;
  maxPlayers: number;
  expiresAt: number;
}

const SPACE_API =
  (import.meta.env.VITE_SPACE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

function worldBase(): string {
  return SPACE_API || '';
}

export async function fetchWorldShards(): Promise<WorldShardInfo[]> {
  const base = worldBase();
  const url = base ? `${base}/world/shards` : '/world/shards';
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const data = (await res.json()) as { shards?: WorldShardInfo[] };
    return data.shards ?? [];
  } catch {
    return [];
  }
}

export async function fetchWorldHealth(): Promise<Record<string, unknown> | null> {
  const base = worldBase();
  const url = base ? `${base}/world/health` : '/world/health';
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Request a signed WebSocket URL for an open-world shard (auth required). */
export async function connectWorldShard(opts: {
  shardId?: string;
  system?: string;
}): Promise<WorldConnectResult | null> {
  if (!getToken()) return null;
  const base = worldBase();
  const url = base ? `${base}/world/connect` : '/world/connect';
  try {
    const res = await authFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as WorldConnectResult;
  } catch {
    return null;
  }
}

const WORLD_SESSION_KEY = 'armada_world_session';

export function storeWorldSession(session: WorldConnectResult): void {
  try {
    sessionStorage.setItem(WORLD_SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

export function loadWorldSession(): WorldConnectResult | null {
  try {
    const raw = sessionStorage.getItem(WORLD_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorldConnectResult;
    if (parsed.expiresAt && parsed.expiresAt < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearWorldSession(): void {
  try {
    sessionStorage.removeItem(WORLD_SESSION_KEY);
  } catch {
    /* ignore */
  }
}