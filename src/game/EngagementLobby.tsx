/**
 * EngagementLobby — Carrier room browser before PvP launch modes.
 */

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { CarrierClient, setActiveCarrier, type CarrierPilot, type CarrierRoomState } from './carrier-client';
import {
  type EngagementKind,
  buildEngagementRoomId,
  buildLoadoutId,
  engagementConfig,
  publicEngagementRoom,
} from './engagement-rooms';
import {
  CARRIER_FACTION_ORDER,
  CARRIER_FACTIONS,
  carrierFactionForArmada,
  type CarrierFactionId,
} from './faction-sync';
import type { GrudgeUser } from './grudge-auth';
import type { SpaceFaction } from './space-types';

interface Props {
  kind: EngagementKind;
  user: GrudgeUser | null;
  playerFaction?: SpaceFaction;
  onLaunch: (roomId: string, offline: boolean) => void;
  onCancel: () => void;
}

export function EngagementLobby({ kind, user, playerFaction, onLaunch, onCancel }: Props) {
  const config = engagementConfig(kind);
  const defaultFaction = playerFaction
    ? carrierFactionForArmada(playerFaction)
    : CARRIER_FACTION_ORDER[0];
  const [roomId, setRoomId] = useState(publicEngagementRoom(kind));
  const [pilots, setPilots] = useState<CarrierPilot[]>([]);
  const [faction, setFaction] = useState<CarrierFactionId>(defaultFaction);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'offline'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [client] = useState(() => new CarrierClient());

  const identity = {
    grudgeId: user?.grudgeId ?? `guest_${Math.random().toString(36).slice(2, 10)}`,
    displayName: user?.displayName ?? 'Guest Commander',
    loadoutId: buildLoadoutId(faction, kind),
    engagementKind: kind,
    carrierMode: config.carrierMode,
    faction,
  };

  const joinRoom = useCallback(
    (id: string) => {
      setRoomId(id);
      setStatus('connecting');
      setError(null);
      client.disconnect();
      client.connect(id, identity, {
        onConnected: () => setStatus('connected'),
        onJoined: (state: CarrierRoomState) => {
          setPilots(state.pilots);
          setStatus('connected');
        },
        onState: (state: CarrierRoomState) => setPilots(state.pilots),
        onDisconnect: () => {
          setStatus('offline');
          setError('Carrier offline — solo mode available');
        },
        onError: (msg) => {
          setStatus('offline');
          setError(msg);
        },
      });
      setActiveCarrier(client);
    },
    [client, identity.grudgeId, identity.displayName, identity.loadoutId, faction, kind],
  );

  useEffect(() => {
    joinRoom(publicEngagementRoom(kind));
    return () => {
      client.disconnect();
      setActiveCarrier(null);
    };
  }, [kind, faction]);

  const createPrivate = () => joinRoom(buildEngagementRoomId(kind));

  const launch = (offline: boolean) => {
    if (!offline) setActiveCarrier(client);
    else {
      client.disconnect();
      setActiveCarrier(null);
    }
    onLaunch(roomId, offline);
  };

  const accent =
    kind === 'quick'
      ? '#4488ff'
      : kind === 'conquest'
        ? '#ff8822'
        : kind === 'dogfight'
          ? '#ff4466'
          : kind === 'infinity' || kind === 'universe'
            ? '#44eecc'
            : '#44ee88';

  const factionMeta = CARRIER_FACTIONS[faction];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(0,4,12,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', monospace",
        color: '#cde',
      }}
    >
      <div
        style={{
          width: 520,
          maxWidth: '92vw',
          padding: 28,
          borderRadius: 12,
          background: 'rgba(6,14,28,0.95)',
          border: `1px solid ${accent}44`,
          boxShadow: `0 0 40px ${accent}18`,
        }}
      >
        <div style={{ fontSize: 10, letterSpacing: 4, color: `${accent}99`, marginBottom: 6 }}>
          CARRIER ENGAGEMENT
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: accent, marginBottom: 8 }}>{config.label}</div>
        <div style={{ fontSize: 11, color: '#567', lineHeight: 1.6, marginBottom: 16 }}>{config.description}</div>

        <div style={{ fontSize: 9, color: '#456', letterSpacing: 2, marginBottom: 8 }}>FACTION · CARRIER HULLS</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {CARRIER_FACTION_ORDER.map((fid) => {
            const meta = CARRIER_FACTIONS[fid];
            const sel = faction === fid;
            return (
              <button
                key={fid}
                type="button"
                onClick={() => setFaction(fid)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  border: sel ? `1px solid ${meta.color}` : '1px solid rgba(255,255,255,0.08)',
                  background: sel ? `${meta.color}22` : 'rgba(0,0,0,0.25)',
                  color: sel ? meta.color : '#8ab',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1,
                  fontFamily: 'inherit',
                }}
              >
                {meta.name}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 10, color: '#556', marginBottom: 16, lineHeight: 1.5 }}>{factionMeta.blurb}</div>

        <div style={{ fontSize: 9, color: '#456', letterSpacing: 2, marginBottom: 8 }}>ROOM · {roomId}</div>
        <div
          style={{
            minHeight: 72,
            padding: 12,
            borderRadius: 8,
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 16,
          }}
        >
          {status === 'connecting' && (
            <div style={{ fontSize: 11, color: '#6af' }}>Connecting to Carrier Railway…</div>
          )}
          {status === 'connected' && pilots.length === 0 && (
            <div style={{ fontSize: 11, color: '#6a8' }}>Waiting for pilots… (max {config.maxPlayers})</div>
          )}
          {pilots.map((p) => (
            <div key={p.id} style={{ fontSize: 11, padding: '4px 0', color: '#9bc' }}>
              ● {p.displayName} {p.ready ? '· READY' : ''}
            </div>
          ))}
          {status === 'offline' && (
            <div style={{ fontSize: 11, color: '#a86' }}>
              {error ?? 'Carrier unavailable'} — launch solo or retry when live.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => joinRoom(publicEngagementRoom(kind))} style={lobbyBtn('#334')}>
            PUBLIC ROOM
          </button>
          <button type="button" onClick={createPrivate} style={lobbyBtn('#334')}>
            CREATE PRIVATE
          </button>
          {status === 'connected' && (
            <button type="button" onClick={() => client.setReady(true)} style={lobbyBtn(accent)}>
              READY
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onCancel} style={lobbyBtn('transparent')}>
            BACK
          </button>
          <button
            type="button"
            onClick={() => launch(status !== 'connected')}
            style={{
              ...lobbyBtn(accent),
              flex: 1,
              fontWeight: 800,
              letterSpacing: 2,
            }}
          >
            {status === 'connected' ? 'LAUNCH PvP' : 'LAUNCH SOLO'}
          </button>
        </div>
      </div>
    </div>
  );
}

function lobbyBtn(color: string): CSSProperties {
  return {
    padding: '10px 16px',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: color === 'transparent' ? '#6a8a9a' : '#fff',
    background: color === 'transparent' ? 'transparent' : `${color}33`,
    border: `1px solid ${color === 'transparent' ? 'rgba(255,255,255,0.1)' : color}66`,
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
}