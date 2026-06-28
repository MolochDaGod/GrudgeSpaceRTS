/**
 * carrier-client.ts — WebSocket client for GRUDOX Carrier co-located PvP.
 *
 * Connects to same-origin `/api/carrier` (proxied to carrier.grudge-studio.com).
 * Graceful no-op when the server is unreachable — solo play continues.
 */

import { getToken } from './grudge-auth';

export interface CarrierPilot {
  id: string;
  displayName: string;
  grudgeId: string;
  ready: boolean;
}

export interface CarrierRoomState {
  roomId: string;
  tick: number;
  pilots: CarrierPilot[];
  hostId: string | null;
  localTeam?: number;
  teamSlot?: number;
}

export interface CarrierClientCallbacks {
  onConnected?: () => void;
  onJoined?: (state: CarrierRoomState) => void;
  onState?: (state: CarrierRoomState) => void;
  onIntent?: (msg: Record<string, unknown>) => void;
  onPilotJoin?: (pilot: CarrierPilot) => void;
  onPilotLeave?: (pilotId: string) => void;
  onDisconnect?: (reason: string) => void;
  onError?: (message: string) => void;
}

function carrierWsUrl(): string {
  const override = import.meta.env.VITE_CARRIER_WS_URL as string | undefined;
  if (override) return override;
  // Vercel rewrites cannot proxy WebSocket upgrades — use Carrier Railway host in prod.
  if (import.meta.env.PROD) {
    return (
      (import.meta.env.VITE_CARRIER_WS_URL as string | undefined) ??
      'wss://carrier-production-4e12.up.railway.app/api/engagement'
    );
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/api/carrier`;
}

export class CarrierClient {
  private ws: WebSocket | null = null;
  private roomId = '';
  private selfId = '';
  private connected = false;
  private callbacks: CarrierClientCallbacks = {};
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  static isEnabled(): boolean {
    return import.meta.env.VITE_CARRIER_DISABLED !== 'true';
  }

  get isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  get currentRoom(): string {
    return this.roomId;
  }

  get socketId(): string {
    return this.selfId;
  }

  /** Merge extra handlers without replacing the active lobby callbacks. */
  extendCallbacks(extra: CarrierClientCallbacks): void {
    const prev = this.callbacks;
    this.callbacks = {
      onConnected: () => {
        prev.onConnected?.();
        extra.onConnected?.();
      },
      onJoined: (s) => {
        prev.onJoined?.(s);
        extra.onJoined?.(s);
      },
      onState: (s) => {
        prev.onState?.(s);
        extra.onState?.(s);
      },
      onIntent: (m) => {
        prev.onIntent?.(m);
        extra.onIntent?.(m);
      },
      onPilotJoin: (p) => {
        prev.onPilotJoin?.(p);
        extra.onPilotJoin?.(p);
      },
      onPilotLeave: (id) => {
        prev.onPilotLeave?.(id);
        extra.onPilotLeave?.(id);
      },
      onDisconnect: (r) => {
        prev.onDisconnect?.(r);
        extra.onDisconnect?.(r);
      },
      onError: (m) => {
        prev.onError?.(m);
        extra.onError?.(m);
      },
    };
  }

  connect(
    roomId: string,
    identity: { grudgeId: string; displayName: string; loadoutId?: string },
    callbacks: CarrierClientCallbacks,
  ): void {
    if (!CarrierClient.isEnabled()) {
      console.warn('[carrier] disabled via VITE_CARRIER_DISABLED');
      return;
    }

    this.roomId = roomId;
    this.callbacks = callbacks;
    this.openSocket(identity);
  }

  private openSocket(identity: { grudgeId: string; displayName: string; loadoutId?: string }) {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    const url = carrierWsUrl();
    const token = getToken();

    try {
      this.ws = new WebSocket(url);
    } catch (err) {
      console.warn('[carrier] WebSocket create failed:', err);
      this.callbacks.onError?.('Carrier unreachable');
      return;
    }

    const ws = this.ws;

    ws.onopen = () => {
      this.connected = true;
      this.callbacks.onConnected?.();
      ws.send(
        JSON.stringify({
          type: 'join',
          roomId: this.roomId,
          grudgeId: identity.grudgeId,
          displayName: identity.displayName,
          loadoutId: identity.loadoutId ?? 'default',
          token: token ?? undefined,
        }),
      );
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string);
        this.handleMessage(msg);
      } catch {
        /* ignore malformed */
      }
    };

    ws.onclose = (ev) => {
      this.connected = false;
      this.callbacks.onDisconnect?.(ev.reason || 'closed');
    };

    ws.onerror = () => {
      this.callbacks.onError?.('Carrier connection error');
    };
  }

  private handleMessage(msg: Record<string, unknown>) {
    const type = msg.type as string | undefined;
    if (!type) return;

    if (type === 'joined' || type === 'join_ack') {
      this.selfId = (msg.selfId as string) ?? (msg.id as string) ?? '';
      const state = this.parseRoomState(msg);
      this.callbacks.onJoined?.(state);
      return;
    }

    if (type === 'state' || type === 'snapshot') {
      this.callbacks.onState?.(this.parseRoomState(msg));
      return;
    }

    if (type === 'pilot_join') {
      const pilot = msg.pilot as CarrierPilot | undefined;
      if (pilot) this.callbacks.onPilotJoin?.(pilot);
      return;
    }

    if (type === 'pilot_leave') {
      const id = (msg.pilotId as string) ?? (msg.id as string);
      if (id) this.callbacks.onPilotLeave?.(id);
      return;
    }

    if (type === 'intent') {
      this.callbacks.onIntent?.(msg);
    }
  }

  private parseRoomState(msg: Record<string, unknown>): CarrierRoomState {
    const pilots = (msg.pilots as CarrierPilot[]) ?? [];
    return {
      roomId: (msg.roomId as string) ?? this.roomId,
      tick: (msg.tick as number) ?? 0,
      pilots,
      hostId: (msg.hostId as string) ?? null,
      localTeam: msg.localTeam as number | undefined,
      teamSlot: msg.teamSlot as number | undefined,
    };
  }

  /** Send player intent / input (throttle on caller side). */
  sendIntent(payload: Record<string, unknown>): void {
    if (!this.isConnected || !this.ws) return;
    this.ws.send(JSON.stringify({ type: 'input', ...payload }));
  }

  setReady(ready: boolean): void {
    if (!this.isConnected || !this.ws) return;
    this.ws.send(JSON.stringify({ type: 'ready', ready }));
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.roomId = '';
    this.selfId = '';
  }
}

/** Singleton for the active engagement session. */
let _active: CarrierClient | null = null;

export function getActiveCarrier(): CarrierClient | null {
  return _active;
}

export function setActiveCarrier(client: CarrierClient | null): void {
  if (_active && _active !== client) _active.disconnect();
  _active = client;
}