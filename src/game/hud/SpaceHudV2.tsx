/**
 * SpaceHudV2.tsx — Unified Star-Citizen-style HUD overlay for /game.
 *
 * Replaces the cluttered v1 layout (overlapping production panel, 24-slot
 * upgrades hotbar, build-complete toast stack, side rails, target frame)
 * with a single overlay built from `sc-primitives.tsx` + `sc-tokens.ts`.
 *
 * Layout (every section reads from `renderer.engine.state`):
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │ TOP STATUS BAR — credits / minerals / energy / supply / spark   │
 *   ├──────────────────────────────────────────────────────────────┬──┤
 *   │                                                              │  │
 *   │            <Three.js scene renders behind us>                │R │
 *   │                                                              │A │
 *   │                                                              │I │
 *   │                                                              │L │
 *   │   (toast stream sits centered above the MFD bar)             │  │
 *   ├──────────────────────────────────────────────────────────────┴──┤
 *   │ POWER MFD          │ TARGETING MFD       │ NAV MFD              │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 *  - The right rail opens v1 panels as modal overlays (build / tech /
 *    cmdr / log) until those are also rebuilt in v2.
 *  - The whole overlay is `pointerEvents: 'none'` except for the chrome
 *    bars + rail buttons, so clicks pass through to the 3D scene.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { SpaceRenderer } from '../space-renderer';
import type { PlanetType } from '../space-types';
import { SC } from './sc-tokens';
import { Bar, Mfd, RailIcon, StatusChip, ToastStream, useToastQueue } from './sc-primitives';

interface Props {
  renderer: SpaceRenderer | null;
  onQuit?: () => void;
  onToggleStarMap?: () => void;
  onDeployGround?: (planetType: PlanetType, planetName: string) => void;
}

// Re-render at 6 Hz — same pattern as the ground HUD; cheap.
const POLL_MS = 165;

function fmtNum(n: number): string {
  if (!isFinite(n)) return '—';
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return Math.round(n).toString();
}

export function SpaceHudV2({ renderer, onQuit, onToggleStarMap, onDeployGround }: Props) {
  const [, setTick] = useState(0);
  const animRef = useRef(0);

  // Toast queue (alerts mirror in here as they're seen in state.alerts)
  const [toasts, pushToast, dismissToast] = useToastQueue();
  const seenAlertIds = useRef<Set<number>>(new Set());

  // 6 Hz repaint
  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      setTick((t) => t + 1);
      animRef.current = window.setTimeout(tick, POLL_MS);
    };
    tick();
    return () => {
      mounted = false;
      window.clearTimeout(animRef.current);
    };
  }, []);

  // Modal toggles for legacy panels — opened from rail icons.
  const [buildOpen, setBuildOpen] = useState(false);
  const [techOpen, setTechOpen] = useState(false);
  const [cmdrOpen, setCmdrOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  // Esc closes any open modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setBuildOpen(false);
        setTechOpen(false);
        setCmdrOpen(false);
        setLogOpen(false);
      }
      if (e.key.toLowerCase() === 'b') setBuildOpen((o) => !o);
      if (e.key.toLowerCase() === 't') setTechOpen((o) => !o);
      if (e.key.toLowerCase() === 'l') setLogOpen((o) => !o);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const state = renderer?.engine?.state;

  // Mirror state.alerts into the toast queue (only new ids).
  useEffect(() => {
    if (!state?.alerts) return;
    for (const alert of state.alerts) {
      if (seenAlertIds.current.has(alert.id)) continue;
      seenAlertIds.current.add(alert.id);
      const tone = alert.type === 'under_attack' || alert.type === 'unit_lost' ? 'alert' : alert.type === 'build_complete' ? 'ok' : 'warn';
      const icon =
        alert.type === 'build_complete'
          ? '✓'
          : alert.type === 'under_attack'
            ? '⚠'
            : alert.type === 'conquest'
              ? '★'
              : alert.type === 'warp_charging'
                ? '◈'
                : '·';
      pushToast({ text: alert.message, tone, icon });
    }
    // Garbage-collect ids that are no longer in state.
    if (state.alerts.length === 0) seenAlertIds.current.clear();
  });

  // ── Derive read-only values for the layout ─────────────────────
  const summary = useMemo(() => {
    if (!state) {
      return {
        credits: 0,
        minerals: 0,
        energy: 0,
        supply: '0/0',
        spark: 0,
        playerShipCount: 0,
        enemyShipCount: 0,
        playerStationCount: 0,
        playerPlanetCount: 0,
        primaryShip: null as null | { name: string; hp: number; maxHp: number; shield: number; maxShield: number; team: number },
        nearestPlanet: null as null | { name: string; dist: number; type: string },
        gameOver: false,
        winner: 0,
      };
    }
    const res = state.resources?.[1];
    const supplyStr = res ? `${Math.round(res.supply)}/${Math.round(res.maxSupply)}` : '0/0';

    // Ship counts.
    let player = 0;
    let enemy = 0;
    state.ships?.forEach?.((s) => {
      if (s.dead) return;
      if (s.team === 1) player++;
      else enemy++;
    });

    // Stations + planets owned.
    let playerStations = 0;
    state.stations?.forEach?.((st) => {
      if (!st.dead && st.team === 1) playerStations++;
    });
    const playerPlanets = state.planets?.filter?.((p) => p.owner === 1).length ?? 0;

    // Primary selected ship.
    let primary: any = null;
    const firstSelectedId = state.selectedIds?.values?.().next?.().value;
    if (firstSelectedId != null) {
      const s = state.ships?.get?.(firstSelectedId);
      if (s && !s.dead) {
        primary = {
          name: s.shipType,
          hp: s.hp ?? 0,
          maxHp: s.maxHp ?? 1,
          shield: s.shield ?? 0,
          maxShield: s.maxShield ?? 1,
          team: s.team,
        };
      }
    }

    // Anchor the NAV MFD to the player's first owned planet (or the first
    // planet on the map if nothing's owned yet). Camera-relative distance
    // gets re-introduced in Phase 3 once the renderer exposes a public
    // camera-position accessor.
    let nearest: { name: string; dist: number; type: string } | null = null;
    if (state.planets?.length) {
      const owned = state.planets.find((p) => p.owner === 1);
      const p = owned ?? state.planets[0];
      if (p) nearest = { name: p.name ?? `Planet ${p.id}`, dist: 0, type: p.planetType ?? 'unknown' };
    }

    return {
      credits: res?.credits ?? 0,
      minerals: res?.minerals ?? 0,
      energy: res?.energy ?? 0,
      supply: supplyStr,
      spark: res?.spark ?? 0,
      playerShipCount: player,
      enemyShipCount: enemy,
      playerStationCount: playerStations,
      playerPlanetCount: playerPlanets,
      primaryShip: primary,
      nearestPlanet: nearest,
      gameOver: !!state.gameOver,
      winner: state.winner ?? 0,
    };
  }, [state]);

  if (!state) return null;
  const supplyTone: 'default' | 'warn' | 'alert' =
    typeof summary.supply === 'string' && summary.supply.includes('/')
      ? (() => {
          const [a, b] = summary.supply.split('/').map(Number);
          if (!isFinite(a) || !isFinite(b) || b === 0) return 'default';
          const r = a / b;
          if (r >= 0.95) return 'alert';
          if (r >= 0.8) return 'warn';
          return 'default';
        })()
      : 'default';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        pointerEvents: 'none',
        fontFamily: SC.font,
      }}
    >
      {/* ── Top Status Bar ──────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: SC.topBarH,
          display: 'flex',
          alignItems: 'stretch',
          background: SC.surfaceStrong,
          borderBottom: SC.borderSoft,
          backdropFilter: 'blur(6px)',
          pointerEvents: 'auto',
        }}
      >
        <StatusChip icon="⬢" label="Credits" value={fmtNum(summary.credits)} tone="default" />
        <StatusChip icon="⛏" label="Minerals" value={fmtNum(summary.minerals)} tone="default" />
        <StatusChip icon="⚡" label="Energy" value={fmtNum(summary.energy)} tone="ok" />
        <StatusChip icon="🪖" label="Supply" value={summary.supply} tone={supplyTone} />
        <StatusChip icon="✦" label="Spark" value={fmtNum(summary.spark)} tone="warn" />
        <div style={{ flex: 1 }} />
        <StatusChip label="Fleet" value={summary.playerShipCount} tone="default" />
        <StatusChip label="Enemy" value={summary.enemyShipCount} tone="alert" />
        <StatusChip label="Planets" value={summary.playerPlanetCount} tone="default" />
        <StatusChip label="Stations" value={summary.playerStationCount} tone="default" />
      </div>

      {/* ── Bottom MFD Bar ─────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: SC.railW + 8,
          height: SC.mfdH,
          display: 'flex',
          gap: 6,
          padding: '6px 8px',
          background: 'linear-gradient(to top, rgba(2,4,10,0.95), rgba(2,4,10,0.0))',
          pointerEvents: 'auto',
        }}
      >
        {/* POWER MFD */}
        <Mfd title="POWER" status={summary.gameOver ? 'OFFLINE' : 'ONLINE'} statusTone={summary.gameOver ? 'alert' : 'ok'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Bar label="WEAPONS" value={0.55} readout="55%" tone="alert" ticks />
            <Bar label="SHIELDS" value={0.7} readout="70%" tone="accent" ticks />
            <Bar label="ENGINES" value={0.4} readout="40%" tone="ok" ticks />
            <div style={{ marginTop: 4, fontSize: 9, color: SC.textDim, letterSpacing: 1.5 }}>1/2/3 to allocate (wired in Phase 3)</div>
          </div>
        </Mfd>

        {/* TARGETING MFD */}
        <Mfd
          title="TARGETING"
          status={summary.primaryShip ? `T${summary.primaryShip.team}` : 'NO LOCK'}
          statusTone={summary.primaryShip ? (summary.primaryShip.team === 1 ? 'ok' : 'alert') : 'dim'}
        >
          {summary.primaryShip ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: SC.text, textTransform: 'uppercase', letterSpacing: 2 }}>
                {summary.primaryShip.name}
              </div>
              <Bar
                label="HULL"
                value={summary.primaryShip.hp / Math.max(1, summary.primaryShip.maxHp)}
                readout={`${Math.round(summary.primaryShip.hp)} / ${Math.round(summary.primaryShip.maxHp)}`}
                tone={summary.primaryShip.hp / summary.primaryShip.maxHp < 0.3 ? 'alert' : 'ok'}
              />
              <Bar
                label="SHIELD"
                value={summary.primaryShip.shield / Math.max(1, summary.primaryShip.maxShield)}
                readout={`${Math.round(summary.primaryShip.shield)} / ${Math.round(summary.primaryShip.maxShield)}`}
                tone="accent"
              />
            </div>
          ) : (
            <div style={{ fontSize: 11, color: SC.textGhost }}>Click a ship to lock target.</div>
          )}
        </Mfd>

        {/* NAV MFD */}
        <Mfd
          title="NAV"
          status={summary.nearestPlanet ? summary.nearestPlanet.type.toUpperCase() : '—'}
          statusTone="accent"
          onHeaderClick={onToggleStarMap}
        >
          {summary.nearestPlanet ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: SC.text, textTransform: 'uppercase', letterSpacing: 2 }}>
                {summary.nearestPlanet.name}
              </div>
              <div style={{ fontSize: 10, color: SC.textDim, letterSpacing: 1.5 }}>DIST {fmtNum(summary.nearestPlanet.dist)} u</div>
              <div style={{ marginTop: 6, fontSize: 9, color: SC.textGhost, letterSpacing: 1.5 }}>Click header to open Star Map</div>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: SC.textGhost }}>No planets in range.</div>
          )}
        </Mfd>
      </div>

      {/* ── Right Command Rail ─────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: SC.topBarH + 12,
          bottom: SC.mfdH + 12,
          right: 6,
          width: SC.railW,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: 6,
          background: SC.surface,
          border: SC.borderSoft,
          borderRadius: SC.radius,
          boxShadow: SC.panelShadow,
          pointerEvents: 'auto',
        }}
      >
        <RailIcon icon="🏗" label="BUILD" active={buildOpen} onClick={() => setBuildOpen((o) => !o)} />
        <RailIcon icon="🧪" label="TECH" active={techOpen} onClick={() => setTechOpen((o) => !o)} />
        <RailIcon icon="👤" label="CMDR" active={cmdrOpen} onClick={() => setCmdrOpen((o) => !o)} />
        <RailIcon icon="📜" label="LOG" active={logOpen} onClick={() => setLogOpen((o) => !o)} />
        <RailIcon icon="🗺" label="MAP" onClick={onToggleStarMap} />
        <RailIcon
          icon="🛬"
          label="DEPLOY"
          warn
          onClick={() => {
            // Deploy to first player-owned planet if available.
            const p = state.planets?.find?.((pp) => pp.owner === 1);
            if (p && onDeployGround) onDeployGround(p.planetType as PlanetType, p.name ?? 'Surface');
          }}
        />
        <div style={{ flex: 1 }} />
        <RailIcon icon="✕" label="QUIT" onClick={onQuit} />
      </div>

      {/* ── Toast Stream (auto-fades) ──────────────────────── */}
      <ToastStream toasts={toasts} onDismiss={dismissToast} durationMs={3500} />

      {/* ── Game Over banner ───────────────────────────────── */}
      {summary.gameOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.78)',
            zIndex: 60,
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              letterSpacing: 8,
              color: summary.winner === 1 ? SC.ok : SC.alert,
              textShadow: `0 0 30px ${summary.winner === 1 ? SC.ok : SC.alert}88`,
              marginBottom: 16,
            }}
          >
            {summary.winner === 1 ? 'VICTORY' : 'DEFEAT'}
          </div>
          <button
            onClick={onQuit}
            style={{
              padding: '10px 28px',
              border: SC.borderAccent,
              background: SC.surfaceAccent,
              color: SC.accent,
              fontFamily: SC.font,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 4,
              cursor: 'pointer',
              borderRadius: SC.radiusChip,
              boxShadow: SC.glowAccent,
            }}
          >
            RETURN TO ORBIT
          </button>
        </div>
      )}

      {/* ── Modal placeholders (BUILD / TECH / CMDR / LOG) ──── */}
      {(buildOpen || techOpen || cmdrOpen || logOpen) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 70,
            pointerEvents: 'auto',
          }}
          onClick={() => {
            setBuildOpen(false);
            setTechOpen(false);
            setCmdrOpen(false);
            setLogOpen(false);
          }}
        >
          <div
            style={{
              width: 480,
              padding: 24,
              background: SC.surfaceStrong,
              border: SC.borderAccent,
              borderRadius: SC.radius,
              color: SC.text,
              boxShadow: SC.panelShadow,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 4, color: SC.accent, marginBottom: 8 }}>
              {buildOpen ? 'BUILD QUEUE' : techOpen ? 'TECH TREE' : cmdrOpen ? 'COMMANDER' : 'CAPTAIN\u2019S LOG'}
            </div>
            <div style={{ fontSize: 11, color: SC.textDim, letterSpacing: 2 }}>
              v2 panel — full content lands in Phase 3 (ship systems) / Phase 4 (economy). Click outside to close, or press{' '}
              <span style={{ color: SC.accent }}>Esc</span>.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpaceHudV2;
