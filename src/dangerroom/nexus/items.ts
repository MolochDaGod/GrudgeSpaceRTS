/**
 * Nexus-era starting gear + loot catalog for Ground.
 * Shaped after survival loot/affix language (T1–T6, weapon/armor slots).
 */

export type NexusItemSlot =
  | "mainhand"
  | "offhand"
  | "helm"
  | "chest"
  | "legs"
  | "boots"
  | "consumable"
  | "material";

export type NexusRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface NexusItemDef {
  id: string;
  name: string;
  slot: NexusItemSlot;
  rarity: NexusRarity;
  tier: number;
  icon: string;
  /** Flat combat bonuses applied when equipped. */
  bonuses: {
    damage?: number;
    armor?: number;
    health?: number;
    resource?: number;
    moveSpeed?: number;
  };
  description: string;
}

export const NEXUS_RARITY_COLOR: Record<NexusRarity, string> = {
  common: "#9aa6b2",
  uncommon: "#3dd68c",
  rare: "#4c8dff",
  epic: "#b56bff",
  legendary: "#ffc62a",
};

/** @deprecated Use origin.starterItems — kept empty so old imports fail soft. */
export const CLASS_STARTER_LOADOUT: Record<string, string[]> = {};

export const NEXUS_ITEMS: Record<string, NexusItemDef> = {
  "nx-blade-vanguard": {
    id: "nx-blade-vanguard",
    name: "Vanguard Phase Blade",
    slot: "mainhand",
    rarity: "uncommon",
    tier: 2,
    icon: "⚔",
    bonuses: { damage: 12 },
    description: "Kinetic-edged longsword tuned for shield wall work.",
  },
  "nx-cleaver-rage": {
    id: "nx-cleaver-rage",
    name: "Rage Cleaver",
    slot: "mainhand",
    rarity: "uncommon",
    tier: 2,
    icon: "🪓",
    bonuses: { damage: 16, moveSpeed: -0.1 },
    description: "Heavy greatblade. Hits hard, slows the swing tempo.",
  },
  "nx-staff-quantum": {
    id: "nx-staff-quantum",
    name: "Quantum Lattice Staff",
    slot: "mainhand",
    rarity: "rare",
    tier: 3,
    icon: "🪄",
    bonuses: { damage: 14, resource: 20 },
    description: "QNT-channel focus for field science and tech combat.",
  },
  "nx-bow-synthetic": {
    id: "nx-bow-synthetic",
    name: "Synthetic Longbow",
    slot: "mainhand",
    rarity: "uncommon",
    tier: 2,
    icon: "🏹",
    bonuses: { damage: 11, moveSpeed: 0.15 },
    description: "Composite recurve with smart-fletch arrows.",
  },
  "nx-shield-bastion": {
    id: "nx-shield-bastion",
    name: "Bastion Plate",
    slot: "offhand",
    rarity: "common",
    tier: 1,
    icon: "🛡",
    bonuses: { armor: 10, health: 15 },
    description: "ENT-laced tower shield for the front line.",
  },
  "nx-plate-chest": {
    id: "nx-plate-chest",
    name: "Entropic Breastplate",
    slot: "chest",
    rarity: "uncommon",
    tier: 2,
    icon: "🦺",
    bonuses: { armor: 14, health: 25 },
    description: "Decay-resistant plate from Nexus foundries.",
  },
  "nx-robes-neural": {
    id: "nx-robes-neural",
    name: "Neural Weave Robes",
    slot: "chest",
    rarity: "uncommon",
    tier: 2,
    icon: "🧥",
    bonuses: { resource: 30, armor: 4 },
    description: "NEU-conductive weave. Light, smart, fragile.",
  },
  "nx-vest-scout": {
    id: "nx-vest-scout",
    name: "Scout Mesh Vest",
    slot: "chest",
    rarity: "common",
    tier: 1,
    icon: "👕",
    bonuses: { armor: 6, moveSpeed: 0.2, health: 10 },
    description: "Breathable mesh for long Nexus hunts.",
  },
  "nx-boots-kinetic": {
    id: "nx-boots-kinetic",
    name: "Kinetic Treads",
    slot: "boots",
    rarity: "common",
    tier: 1,
    icon: "👢",
    bonuses: { moveSpeed: 0.35 },
    description: "KIN-tuned soles — short bursts of speed.",
  },
  "nx-stim-bio": {
    id: "nx-stim-bio",
    name: "BIO Stim",
    slot: "consumable",
    rarity: "common",
    tier: 1,
    icon: "💉",
    bonuses: { health: 40 },
    description: "Instant biomass patch (+HP on use).",
  },
  "nx-stim-neu": {
    id: "nx-stim-neu",
    name: "NEU Stim",
    slot: "consumable",
    rarity: "common",
    tier: 1,
    icon: "🧠",
    bonuses: { resource: 35 },
    description: "Neural flush — restores resource pool.",
  },
  "nx-cell-qnt": {
    id: "nx-cell-qnt",
    name: "QNT Cell",
    slot: "material",
    rarity: "rare",
    tier: 3,
    icon: "⚛️",
    bonuses: {},
    description: "Craft catalyst for quantum gear (loot).",
  },
  "nx-pelt": {
    id: "nx-pelt",
    name: "Field Pelt",
    slot: "material",
    rarity: "common",
    tier: 1,
    icon: "🦊",
    bonuses: {},
    description: "Harvested hide — trades at settlement vendors.",
  },
};

export function resolveLoadout(itemIds: string[]): NexusItemDef[] {
  return itemIds.map((id) => NEXUS_ITEMS[id]).filter(Boolean);
}

export function sumLoadoutBonuses(items: NexusItemDef[]) {
  const out = { damage: 0, armor: 0, health: 0, resource: 0, moveSpeed: 0 };
  for (const it of items) {
    out.damage += it.bonuses.damage ?? 0;
    out.armor += it.bonuses.armor ?? 0;
    out.health += it.bonuses.health ?? 0;
    out.resource += it.bonuses.resource ?? 0;
    out.moveSpeed += it.bonuses.moveSpeed ?? 0;
  }
  return out;
}
