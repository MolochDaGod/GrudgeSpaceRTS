/**
 * world/server.ts \u2014 manages a registry of WorldShard instances and the
 * WebSocket upgrade handler.
 *
 * Mounted onto the existing Hono HTTP server's underlying http.Server,
 * so PvP and the campaign API share one process / one Railway service.
 * Set `WORLD_SEPARATE_PORT=true` to run on its own port instead (useful
 * for local debugging or when scaling out the world layer independently).
 */

import type { IncomingMessage } from 'node:http';
import type { Server as HttpServer } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { jwtVerify } from 'jose';
import { WorldShard } from './shard.js';
import { parseClientMessage } from './protocol.js';
import type { ShardConfig } from './types.js';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-in-production');

interface JwtPayload {
  sub: string;
  username: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
}

export class WorldServer {
  private wss: WebSocketServer | null = null;
  private shards = new Map<string, WorldShard>();
  private readonly tickHz: number;

  constructor(opts: { tickHz?: number } = {}) {
    this.tickHz = opts.tickHz ?? parseInt(process.env.WORLD_TICK_HZ ?? '20', 10);
  }

  /** Configure the default set of shards. Caller can also addShard() later. */
  initDefaultShards(): void {
    const defaults: ShardConfig[] = [
      { id: 'armada-core-01', name: 'Armada Core', system: 'armada_core', tickHz: this.tickHz, maxPlayers: 32 },
      { id: 'pyro-outer-01', name: 'Pyro Outer Rim', system: 'pyro_outer', tickHz: this.tickHz, maxPlayers: 32 },
      { id: 'nyx-void-01', name: 'Nyx Void', system: 'nyx_void', tickHz: this.tickHz, maxPlayers: 24 },
    ];
    for (const cfg of defaults) this.addShard(cfg);
  }

  addShard(cfg: ShardConfig): WorldShard {
    if (this.shards.has(cfg.id)) return this.shards.get(cfg.id)!;
    const shard = new WorldShard(cfg);
    this.shards.set(cfg.id, shard);
    shard.start();
    return shard;
  }

  /** List shards for the matchmaker. */
  listShards(): { id: string; name: string; system: string; population: number; max: number }[] {
    return Array.from(this.shards.values()).map((s) => ({
      id: s.id,
      name: s.cfg.name,
      system: s.cfg.system,
      population: s.population,
      max: s.cfg.maxPlayers,
    }));
  }

  /** Pick a shard with room for one more player; returns null if all full. */
  findOpenShard(systemHint?: string): WorldShard | null {
    const candidates = Array.from(this.shards.values());
    const sorted = candidates.sort((a, b) => {
      if (systemHint) {
        const aMatch = a.cfg.system === systemHint ? 0 : 1;
        const bMatch = b.cfg.system === systemHint ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
      }
      return a.population - b.population;
    });
    return sorted.find((s) => s.hasRoom()) ?? null;
  }

  /** Diagnostics for /world/health. */
  diagnostics(): { tickHz: number; shards: ReturnType<WorldShard['diagnostics']>[] } {
    return {
      tickHz: this.tickHz,
      shards: Array.from(this.shards.values()).map((s) => s.diagnostics()),
    };
  }

  // ── WebSocket attachment ───────────────────────────────────────

  /**
   * Attach a WebSocketServer to an existing HTTP server. Path is `/world`.
   * Validates the JWT from the `?token=` query param before joining.
   */
  attach(httpServer: HttpServer): void {
    if (this.wss) return;
    this.wss = new WebSocketServer({ noServer: true });

    httpServer.on('upgrade', (req, socket, head) => {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
      if (url.pathname !== '/world') return; // not ours

      this.handleUpgrade(req, url, socket, head);
    });

    this.wss.on('connection', (ws, req) => {
      const ctx = (req as IncomingMessage & { __wctx?: { grudgeId: string; name: string; shardId: string } }).__wctx;
      if (!ctx) {
        ws.close(1008, 'no-context');
        return;
      }
      const shard = this.shards.get(ctx.shardId);
      if (!shard) {
        ws.close(1011, 'shard-missing');
        return;
      }
      const ok = shard.join(ws, ctx.grudgeId, ctx.name);
      if (!ok) {
        ws.close(1013, 'shard-full');
        return;
      }

      ws.on('message', (raw) => {
        const msg = parseClientMessage(raw.toString());
        if (!msg) return;
        shard.handleMessage(ctx.grudgeId, msg);
      });

      ws.on('close', () => shard.leave(ctx.grudgeId));
      ws.on('error', (err) => console.warn(`[world] socket error for ${ctx.grudgeId}:`, err.message));
    });

    console.log(`[world] WebSocket server attached to /world`);
  }

  private async handleUpgrade(
    req: IncomingMessage,
    url: URL,
    // 'upgrade' event passes a Duplex (could be net.Socket or TLS
    // socket); both satisfy what wss.handleUpgrade() needs.
    socket: import('node:stream').Duplex,
    head: Buffer,
  ): Promise<void> {
    const token = url.searchParams.get('token');
    const shardHint = url.searchParams.get('shard');

    if (!token) {
      socket.destroy();
      return;
    }

    let payload: JwtPayload;
    try {
      const verified = await jwtVerify(token, SECRET);
      payload = verified.payload as unknown as JwtPayload;
    } catch {
      socket.destroy();
      return;
    }

    // Pick shard (explicit shard param wins, else matchmaker chooses)
    const shard = shardHint ? this.shards.get(shardHint) : this.findOpenShard();
    if (!shard || !shard.hasRoom()) {
      socket.destroy();
      return;
    }

    const wss = this.wss!;
    wss.handleUpgrade(req, socket, head, (ws) => {
      // Stash context on the request for the 'connection' handler to read.
      (req as IncomingMessage & { __wctx: { grudgeId: string; name: string; shardId: string } }).__wctx = {
        grudgeId: payload.sub,
        name: payload.username,
        shardId: shard.id,
      };
      wss.emit('connection', ws, req);
    });
  }

  shutdown(): void {
    for (const shard of this.shards.values()) shard.stop();
    this.wss?.close();
  }
}

/** Lazy singleton \u2014 one WorldServer per process. */
let _world: WorldServer | null = null;
export function getWorldServer(): WorldServer {
  if (!_world) {
    _world = new WorldServer();
    _world.initDefaultShards();
  }
  return _world;
}

// Side-effect-free helper for tests.
export function _resetWorldServerForTests(): void {
  _world?.shutdown();
  _world = null;
}

// Suppress unused-import lint for WebSocket if attach() is the only consumer.
export type { WebSocket };
