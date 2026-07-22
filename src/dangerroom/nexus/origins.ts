/**
 * Survival origins for Nexus Ground — from Grudges / survival CharacterConfig
 * backgrounds. No knight/warrior/mage/ranger class roles.
 */

import type { NexusStatKey, NexusStats } from "./attributes";
import { emptyNexusStats } from "./attributes";

export interface NexusOrigin {
  id: string;
  label: string;
  icon: string;
  description: string;
  /** Display emphasis e.g. "KIN · ENT" */
  emphasis: string;
  /** Which stats get free ranks at deploy (budget-style seeds). */
  seedStats: Partial<NexusStats>;
  proficiencies: string[];
  /** Nexus item ids for starter bag. */
  starterItems: string[];
}

export const NEXUS_ORIGINS: NexusOrigin[] = [
  {
    id: "military",
    label: "Military Veteran",
    icon: "🪖",
    description:
      "Hardened by conventional and augmented warfare. Survives hostile ground with minimal gear.",
    emphasis: "KIN · ENT",
    seedStats: { kin: 2, ent: 2, bio: 1 },
    proficiencies: ["Combat Tactics", "Survival", "Weapons", "Field Medicine"],
    starterItems: ["nx-blade-vanguard", "nx-plate-chest", "nx-boots-kinetic", "nx-stim-bio"],
  },
  {
    id: "scientist",
    label: "Research Scientist",
    icon: "🔬",
    description:
      "Understands quantum fabric and tech systems. Interfaces with advanced devices instinctively.",
    emphasis: "QNT · NEU",
    seedStats: { qnt: 2, neu: 2, syn: 1 },
    proficiencies: ["Quantum Physics", "Chemistry", "Data Analysis", "Lab Fabrication"],
    starterItems: ["nx-staff-quantum", "nx-robes-neural", "nx-stim-neu", "nx-cell-qnt"],
  },
  {
    id: "medic",
    label: "Combat Medic",
    icon: "⚕️",
    description:
      "Heals under fire. Deep knowledge of biological systems and organic augmentation.",
    emphasis: "BIO · NEU",
    seedStats: { bio: 2, neu: 2, kin: 1 },
    proficiencies: ["Surgery", "Pharmacology", "Anatomy", "Bio-Augmentation"],
    starterItems: ["nx-bow-synthetic", "nx-vest-scout", "nx-stim-bio", "nx-stim-neu"],
  },
  {
    id: "engineer",
    label: "Systems Engineer",
    icon: "⚙️",
    description: "Repairs, builds, and hacks machines and networks in the field.",
    emphasis: "SYN · ENT",
    seedStats: { syn: 2, ent: 2, qnt: 1 },
    proficiencies: ["Electronics", "Robotics", "Fabrication", "Network Intrusion"],
    starterItems: ["nx-cleaver-rage", "nx-plate-chest", "nx-boots-kinetic", "nx-cell-qnt"],
  },
  {
    id: "drifter",
    label: "Void Drifter",
    icon: "🌌",
    description:
      "Years on fringe vessels. Adapted to microgravity, cold, and temporal noise.",
    emphasis: "GRA · CHR",
    seedStats: { gra: 2, chr: 2, kin: 1 },
    proficiencies: ["Stellar Navigation", "Zero-G Ops", "Ship Systems", "Temporal Reading"],
    starterItems: ["nx-bow-synthetic", "nx-vest-scout", "nx-boots-kinetic", "nx-stim-bio"],
  },
  {
    id: "psionic",
    label: "Psionic Adept",
    icon: "🧠",
    description:
      "Neural architecture beyond baseline. Resistant to mind control and reality distortion.",
    emphasis: "NEU · QNT",
    seedStats: { neu: 2, qnt: 2, chr: 1 },
    proficiencies: ["Neural Hacking", "Psionic Defense", "Consciousness", "Reality Anchor"],
    starterItems: ["nx-staff-quantum", "nx-robes-neural", "nx-stim-neu", "nx-stim-bio"],
  },
];

export function getOrigin(id: string): NexusOrigin | undefined {
  return NEXUS_ORIGINS.find((o) => o.id === id);
}

/** Apply origin seeds onto empty stats (does not spend budget). */
export function applyOriginSeeds(origin: NexusOrigin): NexusStats {
  const s = emptyNexusStats();
  for (const [k, v] of Object.entries(origin.seedStats) as [NexusStatKey, number][]) {
    s[k] = Math.min(6, Math.max(0, v ?? 0));
  }
  return s;
}
