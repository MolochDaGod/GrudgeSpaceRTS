import { islandAt } from "./islands";

/**
 * Faction territories. Ownership follows the archipelago: each faction island
 * (see islands.ts) is that faction's territory, the central hub island and the
 * open ocean are neutral. Zones drive enemy spawns, environment theming, and AI
 * aggression tuning.
 */
export type Faction = "crusade" | "fabled" | "legion" | "neutral";

export interface ZoneTheme {
  faction: Faction;
  name: string;
  /** Additive terrain tint (r,g,b) blended over the base biome colour. */
  tint: [number, number, number];
  /** AI aggression multiplier for enemies spawned in this territory. */
  aggression: number;
  /** Legion race that garrisons this zone (the enemy roster is Legion-only). */
  enemyRace: "orcs" | "undead";
  accent: string;
}

/** Hub island radius, retained for callers that ring content around the town. */
export const NEUTRAL_RADIUS = 340;

const THEMES: Record<Exclude<Faction, "neutral">, ZoneTheme> = {
  crusade: {
    faction: "crusade",
    name: "Crusade Marches",
    tint: [0.06, 0.04, -0.02],
    aggression: 1,
    enemyRace: "orcs",
    accent: "#c9a227",
  },
  fabled: {
    faction: "fabled",
    name: "Fabled Wilds",
    tint: [-0.04, 0.05, 0.02],
    aggression: 0.85,
    enemyRace: "undead",
    accent: "#4c8fe0",
  },
  legion: {
    faction: "legion",
    name: "Legion Wastes",
    tint: [0.05, -0.03, -0.04],
    aggression: 1.25,
    enemyRace: "orcs",
    accent: "#b8402e",
  },
};

const ORDER: Exclude<Faction, "neutral">[] = ["crusade", "fabled", "legion"];

const NEUTRAL_THEME: ZoneTheme = {
  faction: "neutral",
  name: "Town of Grudgehold",
  tint: [0, 0, 0],
  aggression: 0,
  enemyRace: "orcs",
  accent: "#e8d9a8",
};

/** Resolve which faction controls a given world position. */
export function factionAt(x: number, z: number): ZoneTheme {
  const { mask, island } = islandAt(x, z);
  if (!island || mask < 0.25 || island.faction === "neutral") return NEUTRAL_THEME;
  return THEMES[island.faction];
}

export function allZoneThemes(): ZoneTheme[] {
  return ORDER.map((f) => THEMES[f]);
}
