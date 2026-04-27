/**
 * power-triangle.ts — Phase 3 ship-power allocation system.
 *
 * Lightweight, self-contained state holder for the player's flagship
 * power triangle. Weapons / Shields / Engines split a fixed budget (1.0
 * total). Hotkeys 1 / 2 / 3 push 10% of the budget to the chosen pool;
 * the other two pools split the loss proportionally.
 *
 * Why a separate module:
 *   - Engine code (`space-engine`) doesn't yet have a power-triangle slot.
 *     Living here means we can ship the HUD + UX now and graft the
 *     gameplay effects (damage / shield-regen / top-speed multipliers)
 *     into the engine in a follow-up without churning HUD code.
 *   - Pure module-level singleton — no React-state crosstalk, easy to
 *     subscribe from any HUD module.
 */

export type PowerPool = 'weapons' | 'shields' | 'engines';

export interface PowerTriangle {
  weapons: number;
  shields: number;
  engines: number;
}

const NOMINAL: PowerTriangle = { weapons: 1 / 3, shields: 1 / 3, engines: 1 / 3 };
const SHIFT_AMOUNT = 0.1;
const MIN_POOL = 0.05;
const MAX_POOL = 0.7;

let state: PowerTriangle = { ...NOMINAL };
const subs = new Set<(t: PowerTriangle) => void>();

function clampAndNormalize(t: PowerTriangle): PowerTriangle {
  // Clamp each pool, then normalise so the sum is 1.0.
  const w = Math.max(MIN_POOL, Math.min(MAX_POOL, t.weapons));
  const s = Math.max(MIN_POOL, Math.min(MAX_POOL, t.shields));
  const e = Math.max(MIN_POOL, Math.min(MAX_POOL, t.engines));
  const sum = w + s + e || 1;
  return { weapons: w / sum, shields: s / sum, engines: e / sum };
}

function notify(): void {
  for (const fn of subs) fn(state);
}

/** Read the current allocation. Returns a defensive copy. */
export function getPower(): PowerTriangle {
  return { ...state };
}

/** Subscribe to changes; returns an unsubscribe function. */
export function onPowerChange(fn: (t: PowerTriangle) => void): () => void {
  subs.add(fn);
  return () => subs.delete(fn);
}

/** Reset all three pools to the nominal 33% / 33% / 33% split. */
export function resetPower(): void {
  state = { ...NOMINAL };
  notify();
}

/**
 * Push +SHIFT_AMOUNT (default 10%) to the named pool. The other two
 * pools split the loss proportionally to their current size.
 */
export function pushPower(pool: PowerPool): void {
  const next = { ...state };
  next[pool] += SHIFT_AMOUNT;
  // Subtract from the other two proportionally.
  const others: PowerPool[] = (['weapons', 'shields', 'engines'] as const).filter((p) => p !== pool);
  const [a, b] = others;
  const totalOther = state[a] + state[b] || 1;
  next[a] -= SHIFT_AMOUNT * (state[a] / totalOther);
  next[b] -= SHIFT_AMOUNT * (state[b] / totalOther);
  state = clampAndNormalize(next);
  notify();
}

/** Set an exact allocation (used by save/load and admin tooling). */
export function setPower(t: PowerTriangle): void {
  state = clampAndNormalize(t);
  notify();
}

/**
 * Multipliers the engine reads each tick. Damage scales linearly with
 * the weapons pool, shield regen with shields, top speed with engines.
 * Nominal pool (1/3) returns 1.0 for each.
 */
export function getMultipliers(): { damageMult: number; shieldRegenMult: number; speedMult: number } {
  return {
    damageMult: state.weapons / NOMINAL.weapons,
    shieldRegenMult: state.shields / NOMINAL.shields,
    speedMult: state.engines / NOMINAL.engines,
  };
}

/**
 * Wire the global 1/2/3 hotkeys to push the corresponding pool.
 * Returns the cleanup function so the caller can unbind on unmount.
 */
export function bindPowerHotkeys(): () => void {
  const onKey = (e: KeyboardEvent) => {
    // Ignore when a text input is focused.
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === '1') pushPower('weapons');
    else if (e.key === '2') pushPower('shields');
    else if (e.key === '3') pushPower('engines');
    else if (e.key === '0') resetPower();
    else return;
    e.preventDefault();
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
