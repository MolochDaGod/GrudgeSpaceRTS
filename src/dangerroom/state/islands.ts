import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { MAP_SEED, childSeed, mulberry32, hash2, rngShim } from "./seed";

/**
 * Island archipelago worldgen. The world is a bounded 5 km x 5 km stretch of open
 * ocean holding four landmasses: a central neutral hub (Grudgehold, the spawn
 * town) and three faction islands arranged in a seeded ring around it. Every
 * position resolves to an `islandAt` mask (1 deep inland -> 0 open sea) that
 * drives terrain height, faction ownership, and settlement / scatter placement.
 *
 * Same MAP_SEED -> same archipelago; changing the seed rotates the ring, jitters
 * island radii, and reshapes every coastline.
 */

export type IslandFaction = "neutral" | "crusade" | "fabled" | "legion";

// 5 km x 5 km world. WORLD_RADIUS is the playable disc; everything past it is
// open ocean the player is clamped out of.
export const WORLD_SIZE = 5000;
export const WORLD_HALF = WORLD_SIZE / 2;
export const WORLD_RADIUS = 2400;
export const SEA_LEVEL = 0;
/** Ocean floor depth (shallow, so crossing between islands reads as wading). */
export const SEABED = -5;

export interface Island {
  faction: IslandFaction;
  name: string;
  x: number;
  z: number;
  /** Nominal coastline radius (perturbed per-angle by coast noise). */
  radius: number;
  /** Inland mountain amplitude. */
  peak: number;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

const FACTIONS: Exclude<IslandFaction, "neutral">[] = ["crusade", "fabled", "legion"];
const FACTION_ISLAND_NAME: Record<Exclude<IslandFaction, "neutral">, string> = {
  crusade: "The Crusade Marches",
  fabled: "The Fabled Wilds",
  legion: "The Legion Wastes",
};

// Seeded ring orientation + geometry.
const RING_ROTATION = hash2(MAP_SEED, 7, 3) * Math.PI * 2;
const RING_RADIUS = 1550;

export const ISLANDS: Island[] = (() => {
  const rng = mulberry32(childSeed("islands"));
  const list: Island[] = [
    { faction: "neutral", name: "Grudgehold", x: 0, z: 0, radius: 340, peak: 12 },
  ];
  FACTIONS.forEach((f, i) => {
    const angle = (i / FACTIONS.length) * Math.PI * 2 + RING_ROTATION;
    const r = RING_RADIUS * (0.92 + rng() * 0.16);
    list.push({
      faction: f,
      name: FACTION_ISLAND_NAME[f],
      x: Math.cos(angle) * r,
      z: Math.sin(angle) * r,
      radius: 600 * (0.9 + rng() * 0.25),
      peak: 30 + rng() * 16,
    });
  });
  return list;
})();

export function islandByFaction(faction: Exclude<IslandFaction, "neutral">): Island {
  return ISLANDS.find((i) => i.faction === faction) ?? ISLANDS[0];
}

// Coastline noise perturbs each island's effective radius per direction so the
// shorelines read as organic bays and headlands rather than perfect circles.
const coastNoise = new SimplexNoise(rngShim(childSeed("island-coast")));

/**
 * Land mask at a world position: the strongest overlapping island influence in
 * [0, 1], where ~1 is deep inland, ~0.5 is the shoreline, and 0 is open sea.
 * Returns the owning island too (null over open ocean).
 */
export function islandAt(x: number, z: number): { mask: number; island: Island | null } {
  // Past the world radius it is always open ocean.
  if (x * x + z * z > WORLD_RADIUS * WORLD_RADIUS) return { mask: 0, island: null };

  let best = 0;
  let bestIsland: Island | null = null;
  for (const isl of ISLANDS) {
    const dx = x - isl.x;
    const dz = z - isl.z;
    const d = Math.hypot(dx, dz);
    if (d > isl.radius * 1.6) continue;
    const warp = coastNoise.noise(
      (dx / isl.radius) * 1.7 + isl.x * 0.01,
      (dz / isl.radius) * 1.7 + isl.z * 0.01,
    );
    const rEff = isl.radius * (0.86 + warp * 0.18);
    const m = 1 - smoothstep(rEff * 0.5, rEff, d);
    if (m > best) {
      best = m;
      bestIsland = isl;
    }
  }
  return { mask: best, island: bestIsland };
}
