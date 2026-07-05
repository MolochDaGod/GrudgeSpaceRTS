import { mulberry32, childSeed } from "./seed";
import type { Faction } from "./zones";
import { islandByFaction } from "./islands";

/**
 * Seeded settlements, placed on the faction islands (see islands.ts). Each faction
 * gets one TOWN (dense hub with NPCs) at its island centre, one friendly FARM
 * (village kit + livestock) and one enemy CAMP (orc kit + raiders) offset within
 * the island. Positions are deterministic from the map seed, so towns always sit
 * on their own faction's island.
 */

const ORDER: Exclude<Faction, "neutral">[] = ["crusade", "fabled", "legion"];

export type BuildingKit = "castle" | "village" | "orc";

export interface Settlement {
  id: string;
  faction: Exclude<Faction, "neutral">;
  kind: "town" | "farm" | "camp";
  kit: BuildingKit;
  x: number;
  z: number;
  /** Placement radius for buildings / NPCs / animals around the anchor. */
  radius: number;
}

/**
 * A point on a faction island: `radiusFrac` in [0,1] of the island radius from its
 * centre, at `angle` radians. Used to scatter settlements, animals and props so
 * they land on solid ground rather than in the surrounding ocean.
 */
export function pointOnIsland(
  faction: Exclude<Faction, "neutral">,
  radiusFrac: number,
  angle: number,
): { x: number; z: number } {
  const isl = islandByFaction(faction);
  const r = isl.radius * radiusFrac;
  return { x: isl.x + Math.cos(angle) * r, z: isl.z + Math.sin(angle) * r };
}

/** Building kit assigned to each faction town. */
const TOWN_KIT: Record<Exclude<Faction, "neutral">, BuildingKit> = {
  crusade: "castle",
  fabled: "village",
  legion: "orc",
};

export const TOWNS: Settlement[] = ORDER.map((f) => {
  const isl = islandByFaction(f);
  return { id: `town-${f}`, faction: f, kind: "town", kit: TOWN_KIT[f], x: isl.x, z: isl.z, radius: 28 };
});

export const FARMS: Settlement[] = [];
export const CAMPS: Settlement[] = [];

(function buildOutposts() {
  const rng = mulberry32(childSeed("settlements"));
  for (const f of ORDER) {
    // Friendly farm: inner ring of the island, one side of the town.
    const farm = pointOnIsland(f, 0.36, rng() * Math.PI * 2);
    FARMS.push({ id: `farm-${f}`, faction: f, kind: "farm", kit: "village", x: farm.x, z: farm.z, radius: 16 });

    // Enemy camp: mid ring, the far side of the island from the farm.
    const camp = pointOnIsland(f, 0.5, rng() * Math.PI * 2);
    CAMPS.push({ id: `camp-${f}`, faction: f, kind: "camp", kit: "orc", x: camp.x, z: camp.z, radius: 14 });
  }
})();

export const ALL_SETTLEMENTS: Settlement[] = [...TOWNS, ...FARMS, ...CAMPS];
