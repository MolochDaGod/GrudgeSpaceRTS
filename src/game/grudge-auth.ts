/**
 * grudge-auth.ts — Grudge ID authentication client for Gruda Armada
 *
 * Flow:
 *  1. User clicks "Login with Discord/Google/GitHub"
 *  2. We call /auth/{provider}/start?redirect_uri=<this_app>
 *  3. Backend returns { url } → we window.location to that OAuth URL
 *  4. After OAuth, backend redirects back with ?token=X&grudge_id=Y&provider=Z
 *  5. We extract the token from URL, store it, and fetch full user profile
 *
 * Guest mode: no login, IndexedDB-only storage, no leaderboards.
 */

const ID_URL = import.meta.env.VITE_GRUDGE_ID_URL ?? '';
const API_URL = import.meta.env.VITE_GRUDGE_API ?? '';
const STORAGE_KEY = 'grudge_jwt';

// ── Types ─────────────────────────────────────────────────────────
export interface GrudgeUser {
  grudgeId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  gold: number;
  gbuxBalance: number;
  walletAddress: string | null;
  isGuest: boolean;
}

type AuthListener = (user: GrudgeUser | null) => void;

// ── State ─────────────────────────────────────────────────────────
let _token: string | null = null;
let _user: GrudgeUser | null = null;
let _listeners: AuthListener[] = [];
let _initialised = false;

function notify() {
  _listeners.forEach((fn) => fn(_user));
}

// ── Public API ────────────────────────────────────────────────────

/** Subscribe to auth state changes. Returns unsubscribe function. */
export function onAuthChange(fn: AuthListener): () => void {
  _listeners.push(fn);
  return () => {
    _listeners = _listeners.filter((l) => l !== fn);
  };
}

/** Get the current JWT token (null if not logged in). */
export function getToken(): string | null {
  return _token;
}

/** Get the current user (null if not logged in). */
export function getUser(): GrudgeUser | null {
  return _user;
}

/** Check if the user is authenticated. */
export function isLoggedIn(): boolean {
  return !!_token && !!_user;
}

/** Start OAuth login flow. Redirects the browser. */
export function login(provider: 'discord' | 'google' | 'github' = 'discord'): void {
  if (!ID_URL) {
    console.warn('[grudge-auth] VITE_GRUDGE_ID_URL not set, cannot login');
    return;
  }
  // redirect_uri = current page origin (callback will land here)
  const redirectUri = encodeURIComponent(window.location.origin + '/auth');
  window.location.href = `${ID_URL}/auth/${provider}/start?redirect_uri=${redirectUri}`;
}

/** Log out — clear token and user state. */
export function logout(): void {
  _token = null;
  _user = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  notify();
}

/** Fetch user profile from the backend using the stored JWT. */
async function fetchUser(): Promise<GrudgeUser | null> {
  if (!_token || !ID_URL) return null;
  try {
    const res = await fetch(`${ID_URL}/auth/user`, {
      headers: { Authorization: `Bearer ${_token}` },
    });
    if (!res.ok) {
      // Token expired or invalid
      if (res.status === 401 || res.status === 403) {
        logout();
      }
      return null;
    }
    const data = await res.json();
    return {
      grudgeId: data.grudgeId ?? data.grudge_id,
      username: data.username ?? 'Commander',
      displayName: data.displayName ?? data.username ?? 'Commander',
      avatarUrl: data.avatarUrl ?? null,
      gold: data.gold ?? 0,
      gbuxBalance: data.gbuxBalance ?? 0,
      walletAddress: data.walletAddress ?? null,
      isGuest: data.isGuest ?? false,
    };
  } catch (err) {
    console.warn('[grudge-auth] Failed to fetch user:', err);
    return null;
  }
}

/**
 * Initialise auth — check URL params for callback token, or restore from session.
 * Call this once on app mount.
 */
export async function initAuth(): Promise<GrudgeUser | null> {
  if (_initialised) return _user;
  _initialised = true;

  // 1. Check URL for OAuth callback params (?token=X&grudge_id=Y)
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  if (urlToken) {
    _token = urlToken;
    try {
      sessionStorage.setItem(STORAGE_KEY, urlToken);
    } catch {
      /* ignore */
    }
    // Clean the URL (remove token from address bar)
    const clean = new URL(window.location.href);
    clean.searchParams.delete('token');
    clean.searchParams.delete('grudge_id');
    clean.searchParams.delete('provider');
    window.history.replaceState({}, '', clean.pathname + clean.search);
  }

  // 2. Restore from sessionStorage
  if (!_token) {
    try {
      _token = sessionStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  // 3. Fetch user profile
  if (_token) {
    _user = await fetchUser();
    if (!_user) {
      // Token was invalid, clear it
      _token = null;
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }

  notify();
  return _user;
}

/**
 * Make an authenticated fetch to any Grudge API endpoint.
 * Automatically attaches the JWT Bearer header.
 */
export async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (_token) {
    headers.set('Authorization', `Bearer ${_token}`);
  }
  return fetch(url, { ...init, headers });
}

/** Convenience: fetch JSON from the game-api with auth. */
export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T | null> {
  if (!API_URL) return null;
  try {
    const res = await authFetch(`${API_URL}${path}`, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
