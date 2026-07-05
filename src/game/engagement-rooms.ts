/**
 * Engagement room IDs for Carrier PvP — Quick Game, Conquest, Dogfight,
 * Infinity Universe, and Souls Combat.
 */

import type { CarrierFactionId } from './faction-sync';

export type EngagementKind = 'quick' | 'conquest' | 'souls' | 'dogfight' | 'universe' | 'infinity';

export interface EngagementRoomConfig {
  kind: EngagementKind;
  roomId: string;
  label: string;
  maxPlayers: number;
  description: string;
  /** Carrier sim mode hint — forwarded on WS join for room metadata. */
  carrierMode: 'rts_skirmish' | 'campaign' | 'dogfight' | 'open_world' | 'ground_souls';
  /** Default open-world shard system filter (universe / infinity). */
  worldSystem?: string;
}

const ROOM_PREFIX: Record<EngagementKind, string> = {
  quick: 'engagement-quick',
  conquest: 'engagement-conquest',
  souls: 'engagement-souls',
  dogfight: 'engagement-dogfight',
  universe: 'engagement-universe',
  infinity: 'engagement-infinity',
};

export function buildEngagementRoomId(kind: EngagementKind, suffix?: string): string {
  const id = suffix ?? `${Date.now().toString(36)}`;
  return `${ROOM_PREFIX[kind]}-${id}`;
}

export function publicEngagementRoom(kind: EngagementKind): string {
  return `${ROOM_PREFIX[kind]}-public`;
}

export function engagementConfig(kind: EngagementKind, roomId?: string): EngagementRoomConfig {
  const id = roomId ?? publicEngagementRoom(kind);
  const configs: Record<EngagementKind, Omit<EngagementRoomConfig, 'kind' | 'roomId'>> = {
    quick: {
      label: 'Quick Game',
      maxPlayers: 4,
      description: 'Fast space skirmish — dominate the sector with up to 4 commanders.',
      carrierMode: 'rts_skirmish',
    },
    conquest: {
      label: 'Endless Conquest',
      maxPlayers: 8,
      description: 'Persistent campaign engagement — conquer worlds with allies.',
      carrierMode: 'campaign',
    },
    souls: {
      label: 'Souls Combat',
      maxPlayers: 2,
      description: 'Co-op wave survival on the planet surface.',
      carrierMode: 'ground_souls',
    },
    dogfight: {
      label: 'Carrier Dogfight',
      maxPlayers: 8,
      description: '6DOF fighter duels in a 5 km arena — mothership RTS optional.',
      carrierMode: 'dogfight',
    },
    universe: {
      label: 'Universe Transit',
      maxPlayers: 32,
      description: 'Open-world shard — fly between systems with live pilots.',
      carrierMode: 'open_world',
      worldSystem: 'armada_core',
    },
    infinity: {
      label: 'Infinity Universe',
      maxPlayers: 32,
      description: 'Persistent infinite campaign — shared galaxy, no session reset.',
      carrierMode: 'open_world',
      worldSystem: 'pyro_outer',
    },
  };
  const base = configs[kind];
  return { kind, roomId: id, ...base };
}

/** Build loadout id persisted in engagement room join payload. */
export function buildLoadoutId(faction: CarrierFactionId, kind: EngagementKind): string {
  return `${faction}:${kind}`;
}