/**
 * carrier-bridge.ts — wires Carrier PvP fleet sync into SpaceEngine.
 */

import type { SpaceEngine } from './space-engine';
import type { SpaceGameState, Team } from './space-types';
import { getActiveCarrier } from './carrier-client';

export interface CarrierBridgeOptions {
  onStatus?: (msg: string) => void;
}

interface FleetSnapshotShip {
  id: number;
  x: number;
  y: number;
  facing: number;
  hp: number;
  shipType: string;
}

const SYNC_INTERVAL_MS = 200;
let lastSyncMs = 0;

export class CarrierBridge {
  private engine: SpaceEngine;
  private localTeam = 1;
  private remoteTeams = new Set<number>();
  private disposed = false;
  private onStatus?: (msg: string) => void;

  constructor(engine: SpaceEngine, opts: CarrierBridgeOptions = {}) {
    this.engine = engine;
    this.onStatus = opts.onStatus;
    this.attach();
  }

  private attach() {
    const carrier = getActiveCarrier();
    if (!carrier?.isConnected) {
      this.onStatus?.('Solo — carrier offline');
      return;
    }

    carrier.extendCallbacks({
      onJoined: (state) => this.onJoined(state as unknown as Record<string, unknown>),
      onState: (state) => this.onRoomState(state as unknown as Record<string, unknown>),
      onIntent: (msg) => this.applyIntent(msg),
    });

    this.onStatus?.('PvP engagement active');
  }

  private onJoined(msg: Record<string, unknown>) {
    const team =
      (msg.localTeam as number) ??
      ((msg.teamSlot as number) != null ? (msg.teamSlot as number) + 1 : 1);
    const resolved = Math.min(4, Math.max(1, team)) as Team;
    this.localTeam = resolved;
    this.engine.localTeam = resolved;
    this.onRoomState(msg);
  }

  private onRoomState(msg: Record<string, unknown>) {
    const pilots = (msg.pilots as Array<{ id: string }>) ?? [];
    const selfId = getActiveCarrier()?.socketId;
    this.remoteTeams.clear();
    pilots.forEach((p, idx) => {
      const team = idx + 1;
      if (p.id !== selfId) {
        this.remoteTeams.add(team);
        this.engine.disableAiForTeam(team);
      }
    });
  }

  tick(state: SpaceGameState, nowMs: number) {
    if (this.disposed || this.remoteTeams.size === 0) return;
    const carrier = getActiveCarrier();
    if (!carrier?.isConnected) return;
    if (nowMs - lastSyncMs < SYNC_INTERVAL_MS) return;
    lastSyncMs = nowMs;

    const ships: FleetSnapshotShip[] = [];
    for (const [, ship] of state.ships) {
      if (ship.dead || ship.team !== this.localTeam) continue;
      ships.push({
        id: ship.id,
        x: ship.x,
        y: ship.y,
        facing: ship.facing,
        hp: ship.hp,
        shipType: ship.shipType,
      });
    }

    carrier.sendIntent({ intent: 'fleet_snapshot', team: this.localTeam, ships, ts: nowMs });
  }

  private applyIntent(msg: Record<string, unknown>) {
    const payload = (msg.payload as Record<string, unknown>) ?? msg;
    if (payload.intent !== 'fleet_snapshot') return;

    const team = payload.team as number | undefined;
    if (!team || team === this.localTeam || !this.remoteTeams.has(team)) return;

    const ships = (payload.ships as FleetSnapshotShip[]) ?? [];
    for (const snap of ships) {
      const ship = this.engine.state.ships.get(snap.id);
      if (!ship || ship.dead || ship.team !== team) continue;
      ship.x = snap.x;
      ship.y = snap.y;
      ship.facing = snap.facing;
      ship.hp = snap.hp;
      ship.moveTarget = null;
      ship.targetId = null;
    }
  }

  dispose() {
    this.disposed = true;
  }
}