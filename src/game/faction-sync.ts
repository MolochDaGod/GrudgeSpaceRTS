/**
 * faction-sync.ts — Canonical mapping between Carrier dogfight factions (5)
 * and Gruda Armada RTS campaign factions (4).
 *
 * Carrier (`@workspace/carrier-net`) owns mothership + fleet hull visuals.
 * Armada (`space-config`) owns campaign perks, economy, and codex lore.
 * This module is the shared bridge for lobby loadouts, team tinting, and CDN assets.
 */

import type { SpaceFaction } from './space-types';
import { FACTION_DATA } from './space-types';

/** Carrier-side faction ids (mirrors Carrier/lib/carrier-net/src/types.ts). */
export type CarrierFactionId = 'scavengers' | 'hollow' | 'network' | 'brood' | 'prospector';

export interface CarrierFactionMeta {
  id: CarrierFactionId;
  name: string;
  color: string;
  blurb: string;
}

export const CARRIER_FACTIONS: Record<CarrierFactionId, CarrierFactionMeta> = {
  scavengers: {
    id: 'scavengers',
    name: 'Tech-Scavengers',
    color: '#ff4d4d',
    blurb: 'Salvage-born raiders who weld ancient hulls into a wandering pyramid-ark.',
  },
  hollow: {
    id: 'hollow',
    name: 'Hollow Lords',
    color: '#4488ff',
    blurb: 'Cold ring-station nobility ruling the void from hollowed cathedral-rings.',
  },
  network: {
    id: 'network',
    name: 'The Network',
    color: '#ffd23f',
    blurb: 'A hive-mind relay swarm; docking hubs route an endless data-tide.',
  },
  brood: {
    id: 'brood',
    name: 'Brood Mother',
    color: '#c084fc',
    blurb: 'A living colossus-station birthing organic fleets from a single dark womb.',
  },
  prospector: {
    id: 'prospector',
    name: 'Prospector',
    color: '#5dff9b',
    blurb: 'Industrial miners whose ring-rigs strip whole belts for ore and fuel.',
  },
};

export const CARRIER_FACTION_ORDER: CarrierFactionId[] = [
  'scavengers',
  'hollow',
  'network',
  'brood',
  'prospector',
];

/** Primary Armada ↔ Carrier pairing (lore-aligned). */
export const ARMADA_TO_CARRIER: Record<SpaceFaction, CarrierFactionId> = {
  legion: 'scavengers',
  wisdom: 'hollow',
  construct: 'network',
  void: 'brood',
};

/** Reverse lookup — multiple armada factions may share a carrier hull set in FFA. */
export const CARRIER_TO_ARMADA: Record<CarrierFactionId, SpaceFaction> = {
  scavengers: 'legion',
  hollow: 'wisdom',
  network: 'construct',
  brood: 'void',
  prospector: 'construct',
};

export function carrierFactionForArmada(faction: SpaceFaction): CarrierFactionId {
  return ARMADA_TO_CARRIER[faction];
}

export function armadaFactionForCarrier(faction: CarrierFactionId): SpaceFaction {
  return CARRIER_TO_ARMADA[faction];
}

/** Team slot (1-based) → carrier faction for PvP lobbies without explicit picks. */
export function carrierFactionForTeam(team: number, playerFaction?: SpaceFaction): CarrierFactionId {
  if (team === 1 && playerFaction) return carrierFactionForArmada(playerFaction);
  const idx = Math.max(0, (team - 1) % CARRIER_FACTION_ORDER.length);
  return CARRIER_FACTION_ORDER[idx];
}

/** Hex tint for a team in the RTS overlay (prefers Armada palette when mapped). */
export function teamAccentHex(team: number, playerFaction?: SpaceFaction): string {
  const carrier = carrierFactionForTeam(team, team === 1 ? playerFaction : undefined);
  const armada = armadaFactionForCarrier(carrier);
  return FACTION_DATA[armada]?.color ?? CARRIER_FACTIONS[carrier].color;
}

export function isCarrierFactionId(v: unknown): v is CarrierFactionId {
  return typeof v === 'string' && v in CARRIER_FACTIONS;
}