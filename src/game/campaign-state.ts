/**
 * campaign-state.ts — Campaign save/load persistence.
 *
 * Saves campaign state to Grudge backend with IndexedDB fallback.
 * Auto-saves every 5 minutes of real time.
 * Handles campaign completion (title grants, PvP unlock).
 */

import type {
  CampaignSaveData,
  CampaignProgress,
  SpaceGameState,
  PlayerResources,
  TeamUpgrades,
  LogEntry,
  CampaignEvent,
  CommanderSpec,
} from './space-types';
import { authFetch, getToken, getUser } from './grudge-auth';

const API_URL = import.meta.env.VITE_GRUDGE_API ?? '';
const IDB_NAME = 'gruda-armada';
const IDB_STORE = 'campaign-saves';
const IDB_KEY = 'active-campaign';
const AUTOSAVE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

let _autoSaveTimer: ReturnType<typeof setInterval> | null = null;

// ── IndexedDB helpers ─────────────────────────────────────────────
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut<T>(key: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Build Save Data from Game State ───────────────────────────────

export function buildSaveData(state: SpaceGameState): CampaignSaveData | null {
  if (state.gameMode !== 'campaign' || !state.campaignProgress) return null;
  const user = getUser();

  // Collect tech research state
  const techResearched: Record<number, string[]> = {};
  for (const [team, ts] of state.techState ?? []) {
    techResearched[team] = [...ts.researchedNodes];
  }

  // Get commander info from state
  const playerCmd = [...state.commanders.values()].find((c) => c.team === 1);

  return {
    grudgeId: user?.grudgeId ?? 'guest',
    progress: { ...state.campaignProgress },
    commanderName: playerCmd?.name ?? user?.displayName ?? 'Commander',
    commanderPortrait: playerCmd?.portrait ?? user?.avatarUrl ?? '',
    commanderSpec: (playerCmd?.spec ?? 'forge') as CommanderSpec,
    resources: { ...state.resources },
    upgrades: { ...state.upgrades },
    techResearched,
    logEntries: state.captainsLog.slice(-500), // keep last 500 entries
    activeEvents: state.campaignEvents.filter((e) => !e.resolved),
    completedEventIds: state.campaignEvents.filter((e) => e.resolved).map((e) => e.uuid),
    savedAt: Date.now(),
  };
}

// ── Save Campaign ─────────────────────────────────────────────────

export async function saveCampaign(state: SpaceGameState): Promise<boolean> {
  const data = buildSaveData(state);
  if (!data) return false;

  // Always save to IDB for offline access
  try {
    await idbPut(IDB_KEY, data);
  } catch (err) {
    console.warn('[campaign-state] IDB save failed:', err);
  }

  // Save to backend if available
  if (API_URL && getToken()) {
    try {
      const res = await authFetch(`${API_URL}/campaign/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        console.log('[campaign-state] Saved to backend');
        return true;
      }
    } catch {
      console.warn('[campaign-state] Backend save failed, IDB saved');
    }
  }
  return true; // IDB save succeeded
}

// ── Load Campaign ─────────────────────────────────────────────────

export async function loadCampaign(): Promise<CampaignSaveData | null> {
  // Try backend first
  if (API_URL && getToken()) {
    try {
      const res = await authFetch(`${API_URL}/campaign/load`);
      if (res.ok) {
        const data = await res.json();
        if (data?.progress) {
          // Sync backend data to IDB so offline play has latest state
          try {
            await idbPut(IDB_KEY, data);
          } catch {
            /* non-critical */
          }
          return data as CampaignSaveData;
        }
      }
    } catch {
      /* fall through to IDB */
    }
  }

  // Fallback to IDB
  try {
    return (await idbGet<CampaignSaveData>(IDB_KEY)) ?? null;
  } catch {
    return null;
  }
}

/** Check if the player has an active campaign (without loading full data). */
export async function hasCampaignSave(): Promise<boolean> {
  if (API_URL && getToken()) {
    try {
      const res = await authFetch(`${API_URL}/campaign/status`);
      if (res.ok) {
        const data = await res.json();
        return !!data?.active;
      }
    } catch {
      /* fall through */
    }
  }
  try {
    const data = await idbGet<CampaignSaveData>(IDB_KEY);
    return !!data;
  } catch {
    return false;
  }
}

// ── Auto-Save ─────────────────────────────────────────────────────

export function startAutoSave(getState: () => SpaceGameState): void {
  if (_autoSaveTimer) return;
  _autoSaveTimer = setInterval(() => {
    const state = getState();
    if (state.gameMode === 'campaign' && !state.gameOver) {
      saveCampaign(state);
    }
  }, AUTOSAVE_INTERVAL_MS);
}

export function stopAutoSave(): void {
  if (_autoSaveTimer) {
    clearInterval(_autoSaveTimer);
    _autoSaveTimer = null;
  }
}

// ── Campaign Completion ───────────────────────────────────────────

/** Grant a title to the player on the Grudge backend. */
export async function grantTitle(titleKey: string): Promise<boolean> {
  if (!API_URL || !getToken()) return false;
  try {
    const res = await authFetch(`${API_URL}/campaign/title`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titleKey }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Check if player has earned the "Conqueror of Galaxy" title. */
export function checkConquestMilestone(state: SpaceGameState): boolean {
  if (!state.campaignProgress) return false;
  const { titlesEarned } = state.campaignProgress;
  // All non-AI-homeworld planets conquered (player owns everything)
  const playerPlanets = state.planets.filter((p) => p.owner === 1).length;
  if (playerPlanets >= state.campaignProgress.totalPlanets && !titlesEarned.includes('conqueror_of_galaxy')) {
    state.campaignProgress.titlesEarned.push('conqueror_of_galaxy');
    state.campaignProgress.pvpUnlocked = true;
    // Retry title grant up to 3 times with backoff
    (async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const ok = await grantTitle('conqueror_of_galaxy');
        if (ok) return;
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      }
      console.warn('[campaign-state] Failed to grant title after 3 attempts');
    })();
    return true;
  }
  return false;
}
