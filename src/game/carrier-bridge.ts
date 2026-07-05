/**
 * carrier-bridge.ts — wires Carrier PvP fleet + dogfight sync into SpaceEngine.
 */

import type { SpaceEngine } from './space-engine';
import type { SpaceGameState, Team } from './space-types';
import { getActiveCarrier } from './carrier-client';
import type { EngagementKind } from './engagement-rooms';
import { engagementConfig } from './engagement-rooms';

export interface CarrierBridgeOptions {
  onStatus?: (msg: string) => void;
  engagementKind?: EngagementKind;
}

interface FleetSnapshotShip {
  id: number;
  x: number;
  y: number;
  facing: number;
  hp: number;
  shipType: string;
}

interface DogfightPilot {
  team: number;
  x: number;
  y: number;
  facing: number;
  hp: number;
  shipId?: number;
}

const SYNC_INTERVAL_MS = 200;
const DOGFIGHT_SYNC_MS = 100;
let lastSyncMs = 0;
let lastDogfightMs = 0;

export class CarrierBridge {
  private engine: SpaceEngine;
  private localTeam = 1;
  private remoteTeams = new Set<number>();
  private disposed = false;
  private onStatus?: (msg: string) => void;
  private engagementKind: EngagementKind;
  private dogfightMode = false;

  constructor(engine: SpaceEngine, opts: CarrierBridgeOptions = {}) {
    this.engine = engine;
    this.onStatus = opts.onStatus;
    this.engagementKind = opts.engagementKind ?? 'quick';
    this.dogfightMode =
      opts.engagementKind === 'dogfight' ||
      engagementConfig(opts.engagementKind ?? 'quick').carrierMode === 'dogfight';
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

    const label = this.dogfightMode ? 'Dogfight PvP active' : 'PvP engagement active';
    this.onStatus?.(label);
  }

  private onJoined(msg: Record<string, unknown>) {
    const team =
      (msg.localTeam as number) ??
      ((msg.teamSlot as number) != null ? (msg.teamSlot as number) + 1 : 1);
    const clamped = Math.min(4, Math.max(1, team)) as Team;
    this.localTeam = clamped;
    this.engine.localTeam = clamped;
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

    if (this.dogfightMode) {
      this.tickDogfight(state, carrier, nowMs);
    } else {
      this.tickFleet(state, carrier, nowMs);
    }
  }

  private tickFleet(
    state: SpaceGameState,
    carrier: ReturnType<typeof getActiveCarrier>,
    nowMs: number,
  ) {
    if (!carrier || nowMs - lastSyncMs < SYNC_INTERVAL_MS) return;
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

  private tickDogfight(
    state: SpaceGameState,
    carrier: ReturnType<typeof getActiveCarrier>,
    nowMs: number,
  ) {
    if (!carrier || nowMs - lastDogfightMs < DOGFIGHT_SYNC_MS) return;
    lastDogfightMs = nowMs;

    const pilots: DogfightPilot[] = [];
    for (const [, ship] of state.ships) {
      if (ship.dead || ship.team !== this.localTeam) continue;
      if (ship.shipType !== 'fighter' && ship.shipType !== 'hero') continue;
      pilots.push({
        team: this.localTeam,
        shipId: ship.id,
        x: ship.x,
        y: ship.y,
        facing: ship.facing,
        hp: ship.hp,
      });
      break;
    }

    if (pilots.length === 0) return;
    carrier.sendIntent({
      intent: 'dogfight_snapshot',
      team: this.localTeam,
      pilots,
      engagementKind: this.engagementKind,
      ts: nowMs,
    });
  }

  private applyIntent(msg: Record<string, unknown>) {
    const payload = (msg.payload as Record<string, unknown>) ?? msg;
    const intent = payload.intent as string | undefined;
    if (!intent) return;

    if (intent === 'fleet_snapshot') {
      this.applyFleetSnapshot(payload);
      return;
    }

    if (intent === 'dogfight_snapshot') {
      this.applyDogfightSnapshot(payload);
      return;
    }

    if (intent === 'combat_event') {
      this.onStatus?.(`Combat: ${String(payload.event ?? 'hit')}`);
    }
  }

  private applyFleetSnapshot(payload: Record<string, unknown>) {
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

  private applyDogfightSnapshot(payload: Record<string, unknown>) {
    const team = payload.team as number | undefined;
    if (!team || team === this.localTeam || !this.remoteTeams.has(team)) return;

    const pilots = (payload.pilots as DogfightPilot[]) ?? [];
    for (const snap of pilots) {
      let ship = snap.shipId != null ? this.engine.state.ships.get(snap.shipId) : undefined;
      if (!ship) {
        for (const [, s] of this.engine.state.ships) {
          if (!s.dead && s.team === team && (s.shipType === 'fighter' || s.shipType === 'hero')) {
            ship = s;
            break;
          }
        }
      }
      if (!ship || ship.dead || ship.team !== team) continue;
      ship.x = snap.x;
      ship.y = snap.y;
      ship.facing = snap.facing;
      ship.hp = snap.hp;
      ship.moveTarget = null;
    }
  }

  dispose() {
    this.disposed = true;
  }
}