/**
 * Nexus 8-stat attributes — survival / Grudges SSOT
 * BIO · NEU · KIN · QNT · SYN · CHR · ENT · GRA
 *
 * Point-buy mirrors survival CharacterConfig (budget + cost ladder).
 * No knight/warrior/mage/ranger class roles.
 */

export type NexusStatKey = "bio" | "neu" | "kin" | "qnt" | "syn" | "chr" | "ent" | "gra";

export interface NexusStats {
  bio: number;
  neu: number;
  kin: number;
  qnt: number;
  syn: number;
  chr: number;
  ent: number;
  gra: number;
}

export const NEXUS_STAT_KEYS: NexusStatKey[] = [
  "bio", "neu", "kin", "qnt", "syn", "chr", "ent", "gra",
];

export const NEXUS_STAT_META: {
  key: NexusStatKey;
  abbr: string;
  label: string;
  color: string;
  desc: string;
}[] = [
  { key: "bio", abbr: "BIO", label: "Biomass", color: "#4caf50", desc: "Max health, regen, toxin resist, implant compatibility" },
  { key: "neu", abbr: "NEU", label: "Neural Integrity", color: "#00bcd4", desc: "Sanity, focus pool, psionic defense, AI co-processor" },
  { key: "kin", abbr: "KIN", label: "Kinetic Efficiency", color: "#ff9800", desc: "Move speed, melee damage, stamina regen, zero-G combat" },
  { key: "qnt", abbr: "QNT", label: "Quantum Aptitude", color: "#9c27b0", desc: "Tech damage, devices, probability, exotic gear" },
  { key: "syn", abbr: "SYN", label: "Synthetic Affinity", color: "#2196f3", desc: "Hacking, drones, crit utility, swarm link" },
  { key: "chr", abbr: "CHR", label: "Chronal Stability", color: "#ffeb3b", desc: "Cooldown reduction, tempo, anomaly resist" },
  { key: "ent", abbr: "ENT", label: "Entropic Resistance", color: "#f44336", desc: "Armor, durability, salvage, decay resist" },
  { key: "gra", abbr: "GRA", label: "Gravitic Harmony", color: "#009688", desc: "Fall resist, knockback control, carry, zero-G" },
];

/** Survival-style point buy (CharacterConfig). */
export const STARTING_BUDGET = 20;
export const STAT_MIN = 0;
export const STAT_MAX = 6;
/** Cost to go from (level-1) → level. Index 0 unused. */
export const STAT_COST: number[] = [0, 1, 2, 4, 8, 16, 20];

export function costToReach(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) total += STAT_COST[i] ?? 0;
  return total;
}

export function costForNext(currentLevel: number): number {
  if (currentLevel >= STAT_MAX) return Infinity;
  return STAT_COST[currentLevel + 1] ?? Infinity;
}

export function computeSpentPoints(stats: NexusStats): number {
  return NEXUS_STAT_KEYS.reduce((sum, k) => sum + costToReach(stats[k]), 0);
}

export function remainingBudget(stats: NexusStats, budget = STARTING_BUDGET): number {
  return budget - computeSpentPoints(stats);
}

export function emptyNexusStats(): NexusStats {
  return { bio: 0, neu: 0, kin: 0, qnt: 0, syn: 0, chr: 0, ent: 0, gra: 0 };
}

export function tryRaiseStat(stats: NexusStats, key: NexusStatKey, budget = STARTING_BUDGET): NexusStats | null {
  const cur = stats[key];
  if (cur >= STAT_MAX) return null;
  const cost = costForNext(cur);
  if (remainingBudget(stats, budget) < cost) return null;
  return { ...stats, [key]: cur + 1 };
}

export function tryLowerStat(stats: NexusStats, key: NexusStatKey): NexusStats | null {
  const cur = stats[key];
  if (cur <= STAT_MIN) return null;
  return { ...stats, [key]: cur - 1 };
}

export interface NexusPools {
  maxHealth: number;
  maxStamina: number;
  maxFocus: number;
  physicalDamage: number;
  techDamage: number;
  moveSpeed: number;
  armor: number;
  critChance: number;
  cooldownReduction: number;
  harvestYield: number;
  carryCapacity: number;
}

/** Pools & combat from 8 stats (survival-derived formulas, simplified). */
export function poolsFromNexus(stats: NexusStats): NexusPools {
  const { bio: b, neu: n, kin: k, qnt: q, syn: s, chr: c, ent: e, gra: g } = stats;
  return {
    maxHealth: Math.floor(100 + b * 22 + e * 8),
    maxStamina: Math.floor(100 + k * 12 + e * 6 + g * 4),
    maxFocus: Math.floor(80 + n * 16 + q * 8 + s * 4),
    physicalDamage: Math.floor(10 + k * 4.5 + g * 1.5 + b * 0.5),
    techDamage: Math.floor(8 + q * 5 + n * 2 + s * 1.5),
    moveSpeed: 4.2 + k * 0.22 + s * 0.06 + g * 0.05,
    armor: Math.floor(6 + e * 5 + b * 2 + g * 1),
    critChance: Math.min(45, 5 + s * 2.5 + c * 1.5 + k * 0.5),
    cooldownReduction: Math.min(35, c * 3.5 + n * 1.2),
    harvestYield: Math.min(50, k * 3 + e * 2 + b * 1),
    carryCapacity: Math.floor(30 + e * 8 + g * 6 + b * 4),
  };
}

/**
 * Primary combat resource for survival ground:
 * - stamina (KIN/ENT) for physical action economy
 * - focus shown separately when NEU/QNT invested
 */
export function primaryResourceFromStats(stats: NexusStats): {
  resource: "stamina" | "focus";
  resourceLabel: string;
  maxResource: number;
} {
  const pools = poolsFromNexus(stats);
  if (stats.neu + stats.qnt >= stats.kin + stats.ent) {
    return { resource: "focus", resourceLabel: "Focus", maxResource: pools.maxFocus };
  }
  return { resource: "stamina", resourceLabel: "Stamina", maxResource: pools.maxStamina };
}
