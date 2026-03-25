/**
 * api.ts — Admin API client for Gruda Armada admin panel.
 *
 * All admin endpoints require a valid JWT with admin role.
 * Falls back gracefully when backend is unreachable.
 */

const API_URL = import.meta.env.VITE_GRUDGE_API ?? '';
const ID_URL = import.meta.env.VITE_GRUDGE_ID_URL ?? '';
const STORAGE_KEY = 'grudge_jwt';

function getToken(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function adminFetch<T = unknown>(path: string, init?: RequestInit): Promise<{ ok: boolean; data: T | null; error?: string }> {
  const base = path.startsWith('/auth') ? ID_URL : API_URL;
  if (!base) return { ok: false, data: null, error: 'API URL not configured' };
  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: { ...authHeaders(), ...(init?.headers as Record<string, string>) },
      signal: init?.signal ?? AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, data: null, error: `${res.status}: ${text || res.statusText}` };
    }
    const data = (await res.json().catch(() => null)) as T;
    return { ok: true, data };
  } catch (err) {
    return { ok: false, data: null, error: (err as Error).message };
  }
}

// ── Auth ──────────────────────────────────────────────────────────

export interface AdminUser {
  grudgeId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role?: string;
}

export async function verifyAdmin(): Promise<AdminUser | null> {
  const { ok, data } = await adminFetch<AdminUser>('/auth/user');
  if (!ok || !data) return null;
  return data;
}

export function storeToken(token: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearToken(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasToken(): boolean {
  return !!getToken();
}

export function startOAuth(provider: 'discord' | 'google' | 'github'): void {
  if (!ID_URL) return;
  const redirectUri = encodeURIComponent(window.location.origin + '/admin.html');
  window.location.href = `${ID_URL}/auth/${provider}/start?redirect_uri=${redirectUri}`;
}

// ── Dashboard / Health ───────────────────────────────────────────

export interface ServerHealth {
  status: string;
  uptime: number;
  version: string;
  dbConnected: boolean;
  playerCount: number;
  activeMatches: number;
}

export async function fetchHealth(): Promise<ServerHealth | null> {
  const { data } = await adminFetch<ServerHealth>('/admin/health');
  return data;
}

export interface DashboardStats {
  totalPlayers: number;
  totalMatches: number;
  activeLast24h: number;
  avgMatchDuration: number;
  matchesLast24h: number;
  topFaction: string;
}

export async function fetchDashboardStats(): Promise<DashboardStats | null> {
  const { data } = await adminFetch<DashboardStats>('/admin/stats');
  return data;
}

// ── Player Management ────────────────────────────────────────────

export interface PlayerRecord {
  grudgeId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  gold: number;
  gbuxBalance: number;
  walletAddress: string | null;
  isGuest: boolean;
  isBanned: boolean;
  createdAt: string;
  lastLogin: string;
  matchCount: number;
  winCount: number;
}

export async function searchPlayers(query: string, page = 1, limit = 20): Promise<{ players: PlayerRecord[]; total: number } | null> {
  const { data } = await adminFetch<{ players: PlayerRecord[]; total: number }>(
    `/admin/players?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
  );
  return data;
}

export async function getPlayer(grudgeId: string): Promise<PlayerRecord | null> {
  const { data } = await adminFetch<PlayerRecord>(`/admin/players/${encodeURIComponent(grudgeId)}`);
  return data;
}

export async function updatePlayer(
  grudgeId: string,
  updates: Partial<Pick<PlayerRecord, 'gold' | 'gbuxBalance' | 'isBanned' | 'displayName'>>,
): Promise<boolean> {
  const { ok } = await adminFetch(`/admin/players/${encodeURIComponent(grudgeId)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return ok;
}

// ── Match History ────────────────────────────────────────────────

export interface MatchRecord {
  id: string;
  mode: string;
  winnerGrudgeId: string;
  winnerName: string;
  loserGrudgeId?: string;
  loserName?: string;
  durationS: number;
  mapSeed?: number;
  playedAt: string;
}

export async function fetchMatches(page = 1, limit = 25): Promise<{ matches: MatchRecord[]; total: number } | null> {
  const { data } = await adminFetch<{ matches: MatchRecord[]; total: number }>(`/admin/matches?page=${page}&limit=${limit}`);
  return data;
}

export interface LeaderboardEntry {
  grudge_id: string;
  username: string;
  wins: number;
  avg_duration_s: number;
  avatarUrl: string | null;
}

export async function fetchAdminLeaderboard(): Promise<LeaderboardEntry[] | null> {
  const { data } = await adminFetch<{ leaderboard: LeaderboardEntry[] }>('/rts-matches/leaderboard');
  return data?.leaderboard ?? null;
}

// ── Balance / Config ─────────────────────────────────────────────

export async function fetchRemoteBalance(): Promise<Record<string, Record<string, number>> | null> {
  const { data } = await adminFetch<{ data: Record<string, Record<string, number>> }>('/rts-config/balance');
  return data?.data ?? null;
}

export async function saveRemoteBalance(overrides: Record<string, Record<string, number>>): Promise<boolean> {
  const { ok } = await adminFetch('/rts-config/balance', {
    method: 'PUT',
    body: JSON.stringify({ data: overrides }),
  });
  return ok;
}

export interface GameConfigRemote {
  captureTime?: number;
  captureRatePerUnit?: number;
  dominationTime?: number;
  neutralDefenders?: number;
  startingResources?: { credits: number; energy: number; minerals: number };
  maintenanceMode?: boolean;
  motd?: string;
  [key: string]: unknown;
}

export async function fetchRemoteConfig(): Promise<GameConfigRemote | null> {
  const { data } = await adminFetch<GameConfigRemote>('/rts-config/settings');
  return data;
}

export async function saveRemoteConfig(config: GameConfigRemote): Promise<boolean> {
  const { ok } = await adminFetch('/rts-config/settings', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
  return ok;
}

// ── Server Tools ─────────────────────────────────────────────────

export async function sendAnnouncement(message: string): Promise<boolean> {
  const { ok } = await adminFetch('/admin/announce', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  return ok;
}

export async function setMaintenanceMode(enabled: boolean): Promise<boolean> {
  const { ok } = await adminFetch('/admin/maintenance', {
    method: 'POST',
    body: JSON.stringify({ enabled }),
  });
  return ok;
}

export async function clearServerCache(): Promise<boolean> {
  const { ok } = await adminFetch('/admin/cache/clear', { method: 'POST' });
  return ok;
}

export async function fetchServerLogs(limit = 100): Promise<{ logs: { timestamp: string; level: string; message: string }[] } | null> {
  const { data } = await adminFetch<{
    logs: { timestamp: string; level: string; message: string }[];
  }>(`/admin/logs?limit=${limit}`);
  return data;
}
