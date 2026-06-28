/**
 * Engagement room IDs for Carrier PvP — Quick Game and Endless Conquest.
 */

export type EngagementKind = 'quick' | 'conquest' | 'souls';

export interface EngagementRoomConfig {
  kind: EngagementKind;
  roomId: string;
  label: string;
  maxPlayers: number;
  description: string;
}

const ROOM_PREFIX: Record<EngagementKind, string> = {
  quick: 'engagement-quick',
  conquest: 'engagement-conquest',
  souls: 'engagement-souls',
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
  if (kind === 'quick') {
    return {
      kind,
      roomId: id,
      label: 'Quick Game',
      maxPlayers: 4,
      description: 'Fast space skirmish — first to dominate the sector wins.',
    };
  }
  if (kind === 'conquest') {
    return {
      kind,
      roomId: id,
      label: 'Endless Conquest',
      maxPlayers: 8,
      description: 'Persistent campaign engagement — conquer worlds with allies.',
    };
  }
  return {
    kind,
    roomId: id,
    label: 'Souls Combat',
    maxPlayers: 2,
    description: 'Co-op wave survival on the planet surface.',
  };
}