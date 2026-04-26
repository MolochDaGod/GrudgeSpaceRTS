/**
 * world/shard.ts \u2014 a single PvP shard.
 *
 * One instance per starsystem. Owns a tick loop, the authoritative ship
 * registry, and the connected-player set. Snapshot is broadcast at
 * `tickHz`; high-frequency physics is local to the shard.
 *
 * No DOM / no Three.js. Pure data + setInterval + WebSocket fan-out.
 */

import type { WebSocket } from 'ws';
import type { ShardConfig, ShardSnapshot, WorldPlayer, WorldShip } from './types.js';
import type { ClientMessage, ServerMessage } from './protocol.js';
import { PROTOCOL_VERSION } from './protocol.js';

interface Connection {
  ws: WebSocket;
  player: WorldPlayer;
}

const STARTING_HP = 200;
const STARTING_SHIELD = 100;

export class WorldShard {
  readonly id: string;
  readonly cfg: ShardConfig;

  private tick = 0;
  private nextShipId = 1;
  private nextTeam = 1;

  private ships = new Map<number, WorldShip>();
  private players = new Map<string, Connection>(); // by grudgeId
  private tickHandle: NodeJS.Timeout | null = null;

  /** Optional event hook fired every tick \u2014 useful for tests / metrics. */
  public onTick?: (tick: number) => void;

  constructor(cfg: ShardConfig) {
    this.cfg = cfg;
    this.id = cfg.id;
  }

  // ── Lifecycle ──────────────────────────────────────────────────

  start(): void {
    if (this.tickHandle) return;
    const intervalMs = Math.round(1000 / this.cfg.tickHz);
    this.tickHandle = setInterval(() => this.step(intervalMs / 1000), intervalMs);
    console.log(`[shard:${this.id}] started @ ${this.cfg.tickHz} Hz`);
  }

  stop(): void {
    if (this.tickHandle) clearInterval(this.tickHandle);
    this.tickHandle = null;
  }

  // ── Player connections ─────────────────────────────────────────

  /** Register a connected player. Returns true on success, false on shard full. */
  join(ws: WebSocket, grudgeId: string, name: string): boolean {
    if (this.players.size >= this.cfg.maxPlayers) return false;
    if (this.players.has(grudgeId)) {
      // Reconnect: replace the old socket
      this.players.get(grudgeId)?.ws.close(1000, 'reconnected');
    }
    const team = this.nextTeam++;
    const player: WorldPlayer = {
      grudgeId,
      team,
      name,
      joinedAt: Date.now(),
      lastInputAt: Date.now(),
      joinTick: this.tick,
    };
    this.players.set(grudgeId, { ws, player });
    this.send(ws, {
      kind: 'welcome',
      protocol: PROTOCOL_VERSION,
      shardId: this.id,
      tickHz: this.cfg.tickHz,
      team,
    });
    console.log(`[shard:${this.id}] join ${grudgeId} as team ${team} (${this.players.size}/${this.cfg.maxPlayers})`);
    return true;
  }

  leave(grudgeId: string): void {
    const conn = this.players.get(grudgeId);
    if (!conn) return;
    this.players.delete(grudgeId);
    // Despawn any ships owned by the leaver.
    for (const [id, ship] of this.ships) {
      if (ship.ownerId === grudgeId) this.ships.delete(id);
    }
    console.log(`[shard:${this.id}] leave ${grudgeId} (${this.players.size}/${this.cfg.maxPlayers})`);
  }

  /** Number of connected players (used by matchmaker). */
  get population(): number {
    return this.players.size;
  }

  /** Returns true when the shard has capacity for one more player. */
  hasRoom(): boolean {
    return this.players.size < this.cfg.maxPlayers;
  }

  // ── Client message handling ────────────────────────────────────

  handleMessage(grudgeId: string, msg: ClientMessage): void {
    const conn = this.players.get(grudgeId);
    if (!conn) return;
    conn.player.lastInputAt = Date.now();

    switch (msg.kind) {
      case 'hello':
        // No-op; welcome is sent at join.
        return;
      case 'ping':
        this.send(conn.ws, { kind: 'pong', ts: msg.ts, serverTs: Date.now() });
        return;
      case 'spawn_ship':
        this.spawnShip(grudgeId, msg.shipType, msg.pos);
        return;
      case 'set_nav_route': {
        const ship = this.ships.get(msg.shipId);
        if (!ship || ship.ownerId !== grudgeId) return;
        ship.navWaypoints = msg.waypoints;
        ship.navWaypointIdx = 0;
        ship.navTravelModes = msg.modes;
        this.broadcast({
          kind: 'event',
          type: 'route_set',
          payload: { shipId: ship.id, waypoints: msg.waypoints },
        });
        return;
      }
      case 'fire_weapon': {
        const attacker = this.ships.get(msg.shipId);
        const target = this.ships.get(msg.targetId);
        if (!attacker || attacker.ownerId !== grudgeId) return;
        if (!target || target.team === attacker.team) return;
        // Trivial damage model \u2014 server is authoritative.
        const dmg = 20;
        if (target.shield > 0) {
          const absorbed = Math.min(target.shield, dmg);
          target.shield -= absorbed;
        } else {
          target.hp = Math.max(0, target.hp - dmg);
        }
        if (target.hp <= 0) {
          this.ships.delete(target.id);
          this.broadcast({
            kind: 'event',
            type: 'ship_dead',
            payload: { shipId: target.id, killerId: attacker.id },
          });
        }
        return;
      }
      case 'chat':
        if (typeof msg.text !== 'string' || msg.text.length === 0) return;
        this.broadcast({
          kind: 'chat',
          from: conn.player.name,
          text: msg.text.slice(0, 200),
          ts: Date.now(),
        });
        return;
      case 'leave':
        this.leave(grudgeId);
        return;
    }
  }

  // ── Tick step ──────────────────────────────────────────────────

  private step(dt: number): void {
    this.tick++;

    // Trivial physics: linear velocity application + waypoint advance.
    for (const ship of this.ships.values()) {
      ship.pos.x += ship.vel.x * dt;
      ship.pos.y += ship.vel.y * dt;
      ship.pos.z += ship.vel.z * dt;
      this.advanceShipNav(ship);
    }

    // Snapshot broadcast every tick (could be downsampled later if needed).
    const snapshot: ShardSnapshot = {
      tick: this.tick,
      ts: Date.now(),
      players: Array.from(this.players.values()).map((c) => ({
        grudgeId: c.player.grudgeId,
        team: c.player.team,
        name: c.player.name,
      })),
      ships: Array.from(this.ships.values()),
    };
    this.broadcast({ kind: 'snapshot', data: snapshot });

    this.onTick?.(this.tick);
  }

  /**
   * Advance a ship along its navWaypoints. Mirrors the frontend's
   * advanceShipNav helper so client + server agree on arrivals.
   */
  private advanceShipNav(ship: WorldShip): void {
    const wps = ship.navWaypoints;
    if (!wps || wps.length === 0) return;
    let idx = ship.navWaypointIdx ?? 0;
    const wp = wps[idx];
    if (!wp) {
      ship.navWaypoints = undefined;
      ship.navWaypointIdx = undefined;
      ship.navTravelModes = undefined;
      return;
    }
    const dx = ship.pos.x - wp.x;
    const dy = ship.pos.y - wp.y;
    const dz = ship.pos.z - wp.z;
    if (dx * dx + dy * dy + dz * dz <= 8 * 8) {
      idx++;
      ship.navWaypointIdx = idx;
      if (idx >= wps.length) {
        ship.navWaypoints = undefined;
        ship.navWaypointIdx = undefined;
        ship.navTravelModes = undefined;
        ship.vel.x = ship.vel.y = ship.vel.z = 0;
        this.broadcast({
          kind: 'event',
          type: 'jump_arrive',
          payload: { shipId: ship.id, pos: { ...ship.pos } },
        });
      }
    }
  }

  // ── Helpers ────────────────────────────────────────────────────

  private spawnShip(ownerId: string, shipType: string, pos?: { x: number; y: number; z: number }): void {
    const owner = this.players.get(ownerId);
    if (!owner) return;
    const ship: WorldShip = {
      id: this.nextShipId++,
      ownerId,
      team: owner.player.team,
      shipType,
      hp: STARTING_HP,
      maxHp: STARTING_HP,
      shield: STARTING_SHIELD,
      maxShield: STARTING_SHIELD,
      pos: pos ? { ...pos } : { x: 0, y: 0, z: 0 },
      vel: { x: 0, y: 0, z: 0 },
      facing: 0,
    };
    this.ships.set(ship.id, ship);
    this.broadcast({
      kind: 'event',
      type: 'ship_spawn',
      payload: { ship },
    });
  }

  private send(ws: WebSocket, msg: ServerMessage): void {
    if (ws.readyState !== ws.OPEN) return;
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      /* socket dead, will be cleaned on close */
    }
  }

  private broadcast(msg: ServerMessage): void {
    const json = JSON.stringify(msg);
    for (const conn of this.players.values()) {
      if (conn.ws.readyState !== conn.ws.OPEN) continue;
      try {
        conn.ws.send(json);
      } catch {
        /* skip dead sockets */
      }
    }
  }

  /** Diagnostic snapshot for /world/health. */
  diagnostics(): { id: string; tick: number; players: number; ships: number } {
    return {
      id: this.id,
      tick: this.tick,
      players: this.players.size,
      ships: this.ships.size,
    };
  }
}
