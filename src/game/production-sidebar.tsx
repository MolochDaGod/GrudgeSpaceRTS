/**
 * production-sidebar.tsx — Always-visible left-side production panel
 *
 * Shows at a glance:
 *  - All owned station build queues with progress bars
 *  - Quick-build buttons per tier (queue at nearest idle station)
 *  - Worker count + idle workers + "select idle" button
 *  - Supply bar
 *  - Income breakdown per resource
 *  - Tab cycles through stations
 */

import { useState } from 'react';
import type { SpaceGameState, SpaceStation, PlayerResources } from './space-types';
import { BUILDABLE_SHIPS, getShipDef, PLANET_TYPE_DATA } from './space-types';
import type { SpaceRenderer } from './space-renderer';

const C = {
  bg: 'rgba(4,10,22,0.95)',
  border: '#1a3050',
  accent: '#4488ff',
  muted: 'rgba(160,200,255,0.4)',
};

export function ProductionSidebar({ state, renderer }: { state: SpaceGameState; renderer: SpaceRenderer }) {
  const [expanded, setExpanded] = useState(true);
  const res = state.resources[1];
  if (!res) return null;

  // Gather player stations
  const stations: SpaceStation[] = [];
  for (const [, st] of state.stations) {
    if (!st.dead && st.team === 1) stations.push(st);
  }

  // Worker stats
  let workerTotal = 0,
    workerIdle = 0;
  for (const [, s] of state.ships) {
    if (s.dead || s.team !== 1 || s.shipClass !== 'worker') continue;
    workerTotal++;
    if (s.workerState === 'idle') workerIdle++;
  }

  // Income
  let incC = 0,
    incE = 0,
    incM = 0;
  for (const p of state.planets) {
    if (p.owner !== 1) continue;
    const m = PLANET_TYPE_DATA[p.planetType].resourceMult;
    incC += p.resourceYield.credits * m.credits;
    incE += p.resourceYield.energy * m.energy;
    incM += p.resourceYield.minerals * m.minerals;
  }

  // Quick-build: find nearest station with open queue
  function quickBuild(shipType: string) {
    for (const st of stations) {
      if (st.buildQueue.length < st.maxBuildSlots) {
        renderer.engine.queueBuild(st.id, shipType);
        return;
      }
    }
  }

  // Select idle workers
  function selectIdleWorkers() {
    for (const id of state.selectedIds) {
      const s = state.ships.get(id);
      if (s) s.selected = false;
    }
    state.selectedIds.clear();
    for (const [id, s] of state.ships) {
      if (s.dead || s.team !== 1 || s.shipClass !== 'worker') continue;
      if (s.workerState === 'idle') {
        s.selected = true;
        state.selectedIds.add(id);
      }
    }
  }

  if (!expanded) {
    return (
      <div
        onClick={() => setExpanded(true)}
        style={{
          position: 'absolute',
          left: 0,
          top: 56,
          width: 24,
          height: 80,
          background: C.bg,
          borderRight: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
          borderRadius: '0 6px 6px 0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 12,
          pointerEvents: 'auto',
          writingMode: 'vertical-rl',
          fontSize: 9,
          color: C.accent,
          fontWeight: 700,
          letterSpacing: 1,
        }}
      >
        PROD ▶
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 56,
        bottom: 244,
        width: 210,
        background: C.bg,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '8px 8px',
        overflowY: 'auto',
        zIndex: 12,
        pointerEvents: 'auto',
        fontSize: 10,
        color: '#cde',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: C.accent, letterSpacing: 2 }}>PRODUCTION</span>
        <span onClick={() => setExpanded(false)} style={{ fontSize: 10, cursor: 'pointer', color: C.muted }}>
          ◀
        </span>
      </div>

      {/* Supply bar */}
      <div style={{ background: '#0a1428', borderRadius: 4, padding: '4px 6px', border: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 3 }}>
          <span style={{ color: C.muted }}>SUPPLY</span>
          <span style={{ color: res.supply >= res.maxSupply ? '#ff4444' : '#4df', fontWeight: 700 }}>
            {Math.floor(res.supply)}/{res.maxSupply}
          </span>
        </div>
        <div style={{ height: 4, background: '#0a0e18', borderRadius: 2 }}>
          <div
            style={{
              height: '100%',
              borderRadius: 2,
              width: `${Math.min(100, (res.supply / Math.max(res.maxSupply, 1)) * 100)}%`,
              background: res.supply >= res.maxSupply ? '#ff4444' : '#4488ff',
            }}
          />
        </div>
      </div>

      {/* Income */}
      <div style={{ background: '#0a1428', borderRadius: 4, padding: '4px 6px', border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 8, color: C.muted, letterSpacing: 1, marginBottom: 3 }}>INCOME / SEC</div>
        <div style={{ display: 'flex', gap: 8, fontSize: 9 }}>
          <span style={{ color: '#fc4' }}>+{Math.round(incC)}c</span>
          <span style={{ color: '#4df' }}>+{Math.round(incE)}e</span>
          <span style={{ color: '#4f8' }}>+{Math.round(incM)}m</span>
        </div>
      </div>

      {/* Workers */}
      <div
        style={{
          background: '#0a1428',
          borderRadius: 4,
          padding: '4px 6px',
          border: `1px solid ${workerIdle > 0 ? '#ffaa22' : C.border}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 8, color: C.muted, letterSpacing: 1 }}>WORKERS</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: workerIdle > 0 ? '#ffaa22' : '#4f8' }}>
            {workerTotal}
            {workerIdle > 0 && <span style={{ color: '#ff8844' }}> ({workerIdle} idle)</span>}
          </span>
        </div>
        {workerIdle > 0 && (
          <div
            onClick={selectIdleWorkers}
            style={{
              marginTop: 3,
              padding: '2px 6px',
              borderRadius: 3,
              cursor: 'pointer',
              background: 'rgba(255,170,0,0.15)',
              border: '1px solid rgba(255,170,0,0.3)',
              fontSize: 8,
              color: '#ffaa22',
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            SELECT IDLE
          </div>
        )}
      </div>

      {/* Station build queues */}
      {stations.map((st, i) => {
        const planet = state.planets.find((p) => p.stationId === st.id);
        return (
          <div
            key={st.id}
            style={{
              background: '#0a1428',
              borderRadius: 4,
              padding: '4px 6px',
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ fontSize: 8, color: C.muted, letterSpacing: 1, marginBottom: 2 }}>{planet?.name ?? `STATION ${i + 1}`}</div>
            {st.buildQueue.length === 0 ? (
              <div style={{ fontSize: 8, color: 'rgba(100,140,180,0.3)', fontStyle: 'italic' }}>Idle</div>
            ) : (
              st.buildQueue.map((item, j) => {
                const def = getShipDef(item.shipType);
                const pct = j === 0 ? (1 - item.buildTimeRemaining / item.totalBuildTime) * 100 : 0;
                return (
                  <div key={j} style={{ marginBottom: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9 }}>
                      <span style={{ color: '#fff', fontWeight: 600 }}>{def?.displayName ?? item.shipType}</span>
                      <span style={{ color: '#fc4' }}>{item.buildTimeRemaining.toFixed(0)}s</span>
                    </div>
                    {j === 0 && (
                      <div style={{ height: 3, background: '#0a0e18', borderRadius: 2, marginTop: 1 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: C.accent, borderRadius: 2 }} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        );
      })}

      {/* Quick-build by tier */}
      <div style={{ fontSize: 8, color: C.muted, letterSpacing: 1, marginTop: 4 }}>QUICK BUILD</div>
      {[1, 2, 3].map((tier) => {
        const ships = BUILDABLE_SHIPS[tier] ?? [];
        if (ships.length === 0) return null;
        return (
          <div key={tier} style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {ships.slice(0, 4).map((key) => {
              const def = getShipDef(key);
              if (!def) return null;
              const s = def.stats;
              const canAfford = res.credits >= s.creditCost && res.energy >= s.energyCost && res.minerals >= s.mineralCost;
              return (
                <div
                  key={key}
                  onClick={() => canAfford && quickBuild(key)}
                  title={`${def.displayName} — ${s.creditCost}c/${s.energyCost}e/${s.mineralCost}m`}
                  style={{
                    padding: '2px 5px',
                    borderRadius: 3,
                    cursor: canAfford ? 'pointer' : 'default',
                    background: canAfford ? 'rgba(68,136,255,0.1)' : 'transparent',
                    border: `1px solid ${canAfford ? '#4488ff44' : '#0a1428'}`,
                    fontSize: 8,
                    color: canAfford ? '#cde' : 'rgba(100,140,180,0.25)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {def.displayName}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
