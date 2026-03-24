/**
 * captains-log.ts — Captain's Log system for Campaign mode.
 *
 * The Captain's Log is the player's persistent campaign journal.
 * Entries are auto-generated on key events (battles, conquests, discoveries)
 * and can be enriched by the AI narrator for flavor text.
 *
 * Entries are buffered client-side and flushed to the Grudge backend
 * periodically (or on save). IndexedDB fallback for offline play.
 */

import type { LogEntry, LogCategory, SpaceGameState } from './space-types';
import { authFetch } from './grudge-auth';

const API_URL = import.meta.env.VITE_GRUDGE_API ?? '';

// ── State ─────────────────────────────────────────────────────────
let _pendingFlush: LogEntry[] = [];
const FLUSH_INTERVAL_MS = 30_000; // flush to backend every 30s
let _flushTimer: ReturnType<typeof setInterval> | null = null;

// ── UUID Generation ───────────────────────────────────────────────
function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export { uuid as generateUuid };

// ── Create Log Entry ──────────────────────────────────────────────

/** Create and append a log entry to the game state. */
export function addLogEntry(
  state: SpaceGameState,
  category: LogCategory,
  title: string,
  body: string,
  opts?: {
    planetUuid?: string;
    shipUuid?: string;
    metadata?: Record<string, unknown>;
  },
): LogEntry {
  const entry: LogEntry = {
    uuid: uuid(),
    timestamp: state.gameTime,
    realTimestamp: Date.now(),
    category,
    title,
    body,
    planetUuid: opts?.planetUuid,
    shipUuid: opts?.shipUuid,
    metadata: opts?.metadata,
  };
  state.captainsLog.push(entry);
  _pendingFlush.push(entry);
  return entry;
}

// ── Auto-Logging Hooks ────────────────────────────────────────────

/** Log a planet conquest. */
export function logConquest(state: SpaceGameState, planetName: string, planetUuid?: string): LogEntry {
  return addLogEntry(
    state,
    'conquest',
    `${planetName} Conquered`,
    `Our forces have secured control of ${planetName}. The sector map updates.`,
    { planetUuid },
  );
}

/** Log a major battle outcome. */
export function logBattle(
  state: SpaceGameState,
  description: string,
  shipsLost: number,
  shipsDestroyed: number,
  planetUuid?: string,
): LogEntry {
  return addLogEntry(
    state,
    'battle',
    'Fleet Engagement',
    `${description}\nLosses: ${shipsLost} ships. Destroyed: ${shipsDestroyed} enemy vessels.`,
    {
      planetUuid,
      metadata: { shipsLost, shipsDestroyed },
    },
  );
}

/** Log a discovery (POI, tech unlock, etc). */
export function logDiscovery(state: SpaceGameState, title: string, body: string, planetUuid?: string): LogEntry {
  return addLogEntry(state, 'discovery', title, body, { planetUuid });
}

/** Log a story beat. */
export function logStoryBeat(state: SpaceGameState, beatId: string, title: string, text: string): LogEntry {
  return addLogEntry(state, 'story_beat', title, text, { metadata: { beatId } });
}

/** Log an AI-generated campaign event. */
export function logAiEvent(state: SpaceGameState, eventTitle: string, eventBody: string, eventUuid: string): LogEntry {
  return addLogEntry(state, 'ai_event', eventTitle, eventBody, { metadata: { eventUuid } });
}

/** Log commander action (level-up, training, death). */
export function logCommander(state: SpaceGameState, title: string, body: string, metadata?: Record<string, unknown>): LogEntry {
  return addLogEntry(state, 'commander', title, body, { metadata });
}

// ── Backend Persistence ───────────────────────────────────────────

/** Flush pending log entries to the Grudge backend. */
export async function flushLog(): Promise<boolean> {
  if (!_pendingFlush.length || !API_URL) return false;
  const batch = [..._pendingFlush];
  _pendingFlush = [];
  try {
    const res = await authFetch(`${API_URL}/campaign/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: batch }),
    });
    if (!res.ok) {
      // Put them back for retry
      _pendingFlush.unshift(...batch);
      return false;
    }
    return true;
  } catch {
    _pendingFlush.unshift(...batch);
    return false;
  }
}

/** Start periodic auto-flush of log entries. */
export function startLogAutoFlush(): void {
  if (_flushTimer) return;
  _flushTimer = setInterval(() => {
    flushLog();
  }, FLUSH_INTERVAL_MS);
}

/** Stop auto-flush (call on campaign exit). */
export function stopLogAutoFlush(): void {
  if (_flushTimer) {
    clearInterval(_flushTimer);
    _flushTimer = null;
  }
  // Final flush attempt
  flushLog();
}

/** Get count of unflushed entries. */
export function pendingLogCount(): number {
  return _pendingFlush.length;
}
