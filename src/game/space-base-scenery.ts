/**
 * space-base-scenery.ts — KayKit Space Base Bits manifest.
 *
 * The /assets/space/buildings/kaykit-spacebase/ pack is checked into the
 * repo (1.7 MB GLTF + bin) and replaces the older ObjectStore
 * medieval-builder scenery. Per-entry metadata controls scatter behaviour
 * so the runtime never has to guess what each model is.
 *
 *   - role:  'building' (large, blocking) | 'prop' (small, walkable)
 *            | 'vehicle' (medium, blocking) | 'terrain' (ground decals)
 *   - sizeM: target longest-axis size in metres on the map
 *   - navR:  blocked-zone radius (0 = walkable)
 */

const BASE = '/assets/space/buildings/kaykit-spacebase';

export type SceneryRole = 'building' | 'prop' | 'vehicle' | 'terrain';

export interface SceneryEntry {
  /** GLTF path served from the public/ root. */
  path: string;
  /** Display name (also used as a stable id). */
  name: string;
  role: SceneryRole;
  /** Final on-screen size of the longest axis, in metres. */
  sizeM: number;
  /** Nav-blocked radius around the prop (0 = the player can walk through it). */
  navR: number;
  /** Optional Y offset above terrain surface. */
  yOff?: number;
}

/** Authored full set; sorted by role for clean filter usage. */
export const SPACE_BASE_SCENERY: SceneryEntry[] = [
  // ── Buildings ────────────────────────────────────────────────
  { path: `${BASE}/basemodule_A.gltf`, name: 'basemodule_A', role: 'building', sizeM: 6, navR: 3.5 },
  { path: `${BASE}/basemodule_B.gltf`, name: 'basemodule_B', role: 'building', sizeM: 6, navR: 3.5 },
  { path: `${BASE}/basemodule_C.gltf`, name: 'basemodule_C', role: 'building', sizeM: 6, navR: 3.5 },
  { path: `${BASE}/basemodule_D.gltf`, name: 'basemodule_D', role: 'building', sizeM: 6, navR: 3.5 },
  { path: `${BASE}/basemodule_E.gltf`, name: 'basemodule_E', role: 'building', sizeM: 6, navR: 3.5 },
  { path: `${BASE}/basemodule_garage.gltf`, name: 'basemodule_garage', role: 'building', sizeM: 7, navR: 4.0 },
  { path: `${BASE}/cargodepot_A.gltf`, name: 'cargodepot_A', role: 'building', sizeM: 5, navR: 3.0 },
  { path: `${BASE}/cargodepot_B.gltf`, name: 'cargodepot_B', role: 'building', sizeM: 5, navR: 3.0 },
  { path: `${BASE}/cargodepot_C.gltf`, name: 'cargodepot_C', role: 'building', sizeM: 5, navR: 3.0 },
  { path: `${BASE}/structure_low.gltf`, name: 'structure_low', role: 'building', sizeM: 4, navR: 2.5 },
  { path: `${BASE}/structure_tall.gltf`, name: 'structure_tall', role: 'building', sizeM: 7, navR: 2.5 },
  { path: `${BASE}/lander_base.gltf`, name: 'lander_base', role: 'building', sizeM: 6, navR: 3.5 },
  { path: `${BASE}/drill_structure.gltf`, name: 'drill_structure', role: 'building', sizeM: 6, navR: 3.0 },
  { path: `${BASE}/windturbine_low.gltf`, name: 'windturbine_low', role: 'building', sizeM: 5, navR: 1.5 },
  { path: `${BASE}/windturbine_tall.gltf`, name: 'windturbine_tall', role: 'building', sizeM: 8, navR: 1.5 },

  // ── Props (small, walkable, decorative) ─────────────────────
  { path: `${BASE}/cargo_A.gltf`, name: 'cargo_A', role: 'prop', sizeM: 1.5, navR: 0.8 },
  { path: `${BASE}/cargo_B.gltf`, name: 'cargo_B', role: 'prop', sizeM: 1.5, navR: 0.8 },
  { path: `${BASE}/cargo_A_packed.gltf`, name: 'cargo_A_packed', role: 'prop', sizeM: 2.0, navR: 1.2 },
  { path: `${BASE}/cargo_B_packed.gltf`, name: 'cargo_B_packed', role: 'prop', sizeM: 2.0, navR: 1.2 },
  { path: `${BASE}/cargo_A_stacked.gltf`, name: 'cargo_A_stacked', role: 'prop', sizeM: 2.5, navR: 1.4 },
  { path: `${BASE}/cargo_B_stacked.gltf`, name: 'cargo_B_stacked', role: 'prop', sizeM: 2.5, navR: 1.4 },
  { path: `${BASE}/containers_A.gltf`, name: 'containers_A', role: 'prop', sizeM: 2.0, navR: 1.2 },
  { path: `${BASE}/containers_B.gltf`, name: 'containers_B', role: 'prop', sizeM: 2.0, navR: 1.2 },
  { path: `${BASE}/containers_C.gltf`, name: 'containers_C', role: 'prop', sizeM: 2.0, navR: 1.2 },
  { path: `${BASE}/containers_D.gltf`, name: 'containers_D', role: 'prop', sizeM: 2.0, navR: 1.2 },
  { path: `${BASE}/solarpanel.gltf`, name: 'solarpanel', role: 'prop', sizeM: 3.0, navR: 1.5 },
  { path: `${BASE}/lights.gltf`, name: 'lights', role: 'prop', sizeM: 2.5, navR: 0.5 },
  { path: `${BASE}/rock_A.gltf`, name: 'rock_A', role: 'prop', sizeM: 2.0, navR: 1.2 },
  { path: `${BASE}/rock_B.gltf`, name: 'rock_B', role: 'prop', sizeM: 2.0, navR: 1.2 },
  { path: `${BASE}/rocks_A.gltf`, name: 'rocks_A', role: 'prop', sizeM: 2.5, navR: 1.4 },
  { path: `${BASE}/rocks_B.gltf`, name: 'rocks_B', role: 'prop', sizeM: 2.5, navR: 1.4 },

  // ── Vehicles (medium, blocking) ─────────────────────────────
  { path: `${BASE}/lander_A.gltf`, name: 'lander_A', role: 'vehicle', sizeM: 4, navR: 2.5 },
  { path: `${BASE}/lander_B.gltf`, name: 'lander_B', role: 'vehicle', sizeM: 4, navR: 2.5 },
  { path: `${BASE}/spacetruck.gltf`, name: 'spacetruck', role: 'vehicle', sizeM: 4, navR: 2.0 },
  { path: `${BASE}/spacetruck_large.gltf`, name: 'spacetruck_large', role: 'vehicle', sizeM: 6, navR: 2.5 },
  { path: `${BASE}/spacetruck_trailer.gltf`, name: 'spacetruck_trailer', role: 'vehicle', sizeM: 5, navR: 2.0 },

  // ── Landing pads / decals ───────────────────────────────────
  { path: `${BASE}/landingpad_small.gltf`, name: 'landingpad_small', role: 'terrain', sizeM: 4, navR: 0 },
  { path: `${BASE}/landingpad_large.gltf`, name: 'landingpad_large', role: 'terrain', sizeM: 7, navR: 0 },
];

/** Filter helpers. */
export function sceneryByRole(role: SceneryRole): SceneryEntry[] {
  return SPACE_BASE_SCENERY.filter((e) => e.role === role);
}

/**
 * Pick `count` deterministic entries by role, seeded by the planet seed.
 * The same planet always renders the same skyline.
 */
export function pickSceneryDeterministic(role: SceneryRole, count: number, seed: number): SceneryEntry[] {
  const pool = sceneryByRole(role);
  if (pool.length === 0) return [];
  const out: SceneryEntry[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.abs(Math.sin(seed * 100 + i * 7.31)) % 1;
    out.push(pool[Math.floor(r * pool.length)]);
  }
  return out;
}
