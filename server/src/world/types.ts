/**
 * world/types.ts — types shared by the PvP world server.
 *
 * Kept narrow on purpose: the world server doesn't need the full
 * SpaceGameState; it only needs what's authoritative for PvP.
 * Per-tick diffs go on the wire, not the whole state.
 */

export type Vec3 = { x: number; y: number; z: number };

export interface WorldPlayer {
  /** Stable id from JWT (`sub` claim). */
  grudgeId: string;
  /** Per-shard short id assigned on join (1..255). */
  team: number;
  /** Display name (cached from JWT). */
  name: string;
  /** Connection joined at (epoch ms). */
  joinedAt: number;
  /** Last client \u2192 server input timestamp (epoch ms). */
  lastInputAt: number;
  /** Server tick at which the player joined (used for diff baseline). */
  joinTick: number;
}

/**
 * Authoritative ship state. Shape mirrors a subset of the frontend's
 * `SpaceShip` interface so a state-snapshot can be rebroadcast with
 * minimal translation client-side.
 */
export interface WorldShip {
  id: number;
  ownerId: string; // grudgeId
  team: number;
  shipType: string;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  pos: Vec3;
  vel: Vec3;
  facing: number;
  /** Optional StarNav route currently being followed (game-coord waypoints). */
  navWaypoints?: Vec3[];
  navWaypointIdx?: number;
  navTravelModes?: ('sublight' | 'quantum')[];
}

export interface ShardConfig {
  /** Short shard identifier, e.g. `armada-core-01`. */
  id: string;
  /** Display name shown in the matchmaker UI. */
  name: string;
  /** Universe / starsystem this shard hosts. */
  system: string;
  /** Tick rate in Hz. Default 20. */
  tickHz: number;
  /** Max simultaneous connected players. */
  maxPlayers: number;
}

export interface ShardSnapshot {
  tick: number;
  ts: number; // server time at snapshot
  players: { grudgeId: string; team: number; name: string }[];
  ships: WorldShip[];
}
