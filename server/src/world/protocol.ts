/**
 * world/protocol.ts \u2014 client/server WS message envelopes.
 *
 * Stable JSON contract. Bumps to `PROTOCOL_VERSION` are mandatory when
 * any field changes shape. The frontend `nav-client` / future
 * `world-client` uses these types for end-to-end safety.
 */

import type { ShardSnapshot, Vec3 } from './types.js';

export const PROTOCOL_VERSION = 1;

// ── Client \u2192 Server messages ───────────────────────────────────────

export type ClientMessage =
  | { kind: 'hello'; protocol: number; clientVersion: string }
  | { kind: 'ping'; ts: number }
  | { kind: 'spawn_ship'; shipType: string; pos?: Vec3 }
  | { kind: 'set_nav_route'; shipId: number; waypoints: Vec3[]; modes: ('sublight' | 'quantum')[] }
  | { kind: 'fire_weapon'; shipId: number; targetId: number }
  | { kind: 'chat'; text: string }
  | { kind: 'leave' };

// ── Server \u2192 Client messages ───────────────────────────────────────

export type ServerMessage =
  | { kind: 'welcome'; protocol: number; shardId: string; tickHz: number; team: number }
  | { kind: 'pong'; ts: number; serverTs: number }
  | { kind: 'snapshot'; data: ShardSnapshot }
  | { kind: 'event'; type: 'ship_spawn' | 'ship_dead' | 'route_set' | 'jump_engage' | 'jump_arrive'; payload: Record<string, unknown> }
  | { kind: 'chat'; from: string; text: string; ts: number }
  | { kind: 'error'; code: string; message: string };

/** Safe JSON parse with type narrowing. */
export function parseClientMessage(raw: string): ClientMessage | null {
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj.kind === 'string') return obj as ClientMessage;
  } catch {
    /* fall through */
  }
  return null;
}
