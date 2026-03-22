/**
 * ship-storage.ts — Hero ship save/load via Grudge backend
 *
 * One custom hero ship per account. Stored as GLB binary.
 * Falls back to IndexedDB when backend is unavailable (dev mode).
 */

const API_BASE = import.meta.env.VITE_GRUDGE_API ?? '';
const IDB_NAME = 'gruda-armada';
const IDB_STORE = 'hero-ships';
const IDB_KEY = 'player-hero';

// ── Types ─────────────────────────────────────────────────────────
export interface HeroShipMeta {
  name: string;
  createdAt: number;      // epoch ms
  voxelCount: number;
  /** Grid data for re-editing (JSON-serialised VoxMap) */
  gridData?: string;
}

export interface HeroShipRecord {
  meta: HeroShipMeta;
  glb: Blob;
}

// ── IndexedDB helpers (offline/dev fallback) ──────────────────────
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
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

// ── Public API ────────────────────────────────────────────────────

/** Check if the player already has a saved hero ship. */
export async function hasHeroShip(): Promise<boolean> {
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/api/hero-ship/exists`, { credentials: 'include' });
      if (res.ok) { const j = await res.json(); return !!j.exists; }
    } catch { /* fall through to IDB */ }
  }
  const record = await idbGet<HeroShipRecord>(IDB_KEY);
  return !!record;
}

/** Load the player's hero ship (meta + GLB blob). Returns null if none saved. */
export async function loadHeroShip(): Promise<HeroShipRecord | null> {
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/api/hero-ship`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.meta && data.glbBase64) {
          const bin = Uint8Array.from(atob(data.glbBase64), c => c.charCodeAt(0));
          return { meta: data.meta, glb: new Blob([bin], { type: 'model/gltf-binary' }) };
        }
      }
    } catch { /* fall through to IDB */ }
  }
  return (await idbGet<HeroShipRecord>(IDB_KEY)) ?? null;
}

/** Save a hero ship (replaces any existing one). */
export async function saveHeroShip(record: HeroShipRecord): Promise<boolean> {
  // Always save to IDB for instant offline access
  await idbPut(IDB_KEY, record);

  if (API_BASE) {
    try {
      const buf = await record.glb.arrayBuffer();
      const glbBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      const res = await fetch(`${API_BASE}/api/hero-ship`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta: record.meta, glbBase64 }),
      });
      return res.ok;
    } catch {
      // Saved to IDB at least
      return true;
    }
  }
  return true;
}

/** Convert a GLB Blob to an Object URL for Three.js loading. */
export function glbBlobToUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
