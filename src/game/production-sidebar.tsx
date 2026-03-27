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
import { SHIP_PREVIEW, RESOURCE_ITEM_ICONS, Bar } from './space-ui-shared';
import { Btn, Slot } from './ui-lib';
import { CONTAINERS } from './scifi-gui-assets';

const G = '/assets/space/ui/scifi-gui/sliced';
const C = {
  bg: 'rgba(4,10,22,0.95)',
  border: '#1a3050',
  accent: '#ffcc44',
  muted: 'rgba(200,180,120,0.55)',
  panelBg: CONTAINERS.gold,
  tagBg: `${G}/tag-sm-gold.png`,
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
          width: 28,
          height: 90,
          backgroundImage: `url(${C.panelBg})`,
          backgroundSize: '100% 100%',
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
          filter: 'drop-shadow(2px 0 8px rgba(0,0,0,0.5))',
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
        width: 220,
        backgroundImage: `url(${C.panelBg})`,
        backgroundSize: '100% 100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '42px 14px 14px',
        overflowY: 'auto',
        zIndex: 12,
        pointerEvents: 'auto',
        fontSize: 10,
        color: '#e0d8c0',
        filter: 'drop-shadow(4px 0 16px rgba(0,0,0,0.6))',
      }}
    >
      {/* Title in the gold header area of container-gold */}
      <div
        style={{
          position: 'absolute',
          top: 6,
          left: 20,
          right: 40,
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 900,
          color: '#fff',
          letterSpacing: 3,
          textShadow: '0 0 10px rgba(255,180,0,0.5)',
          textTransform: 'uppercase',
        }}
      >
        PRODUCTION
      </div>
      {/* Collapse button */}
      <div
        onClick={() => setExpanded(false)}
        style={{
          position: 'absolute',
          top: 6,
          right: 10,
          fontSize: 14,
          cursor: 'pointer',
          color: 'rgba(255,200,100,0.6)',
          lineHeight: 1,
        }}
      >
        ✕
      </div>

      {/* Supply bar */}
      <div style={{ marginBottom: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 3 }}>
          <span
            style={{
              backgroundImage: `url(${C.tagBg})`,
              backgroundSize: '100% 100%',
              padding: '1px 8px',
              color: C.muted,
              fontWeight: 700,
              fontSize: 8,
              letterSpacing: 1,
            }}
          >
            SUPPLY
          </span>
          <span style={{ color: res.supply >= res.maxSupply ? '#ff4444' : '#ffcc44', fontWeight: 700 }}>
            {Math.floor(res.supply)}/{res.maxSupply}
          </span>
        </div>
        <Bar value={res.supply} max={res.maxSupply} color={res.supply >= res.maxSupply ? '#ff4444' : '#ffcc44'} height={8} />
      </div>

      {/* Income */}
      <div style={{ marginBottom: 2 }}>
        <div
          style={{
            backgroundImage: `url(${C.tagBg})`,
            backgroundSize: '100% 100%',
            padding: '1px 8px',
            fontSize: 8,
            color: C.muted,
            fontWeight: 700,
            letterSpacing: 1,
            display: 'inline-block',
            marginBottom: 4,
          }}
        >
          INCOME / SEC
        </div>
        <div style={{ display: 'flex', gap: 6, fontSize: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img src={RESOURCE_ITEM_ICONS.credits} alt="" style={{ width: 14, height: 14 }} />
            <span style={{ color: '#fc4', fontWeight: 700 }}>+{Math.round(incC)}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img src={RESOURCE_ITEM_ICONS.energy} alt="" style={{ width: 14, height: 14 }} />
            <span style={{ color: '#4df', fontWeight: 700 }}>+{Math.round(incE)}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img src={RESOURCE_ITEM_ICONS.minerals} alt="" style={{ width: 14, height: 14 }} />
            <span style={{ color: '#4f8', fontWeight: 700 }}>+{Math.round(incM)}</span>
          </span>
        </div>
      </div>

      {/* Workers */}
      <div style={{ marginBottom: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <span
            style={{
              backgroundImage: `url(${C.tagBg})`,
              backgroundSize: '100% 100%',
              padding: '1px 8px',
              fontSize: 8,
              color: C.muted,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            WORKERS
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: workerIdle > 0 ? '#ffaa22' : '#4f8' }}>
            {workerTotal}
            {workerIdle > 0 && <span style={{ color: '#ff8844' }}> ({workerIdle} idle)</span>}
          </span>
        </div>
        {workerIdle > 0 && <Btn label="SELECT IDLE" wide active onClick={selectIdleWorkers} style={{ width: '100%', height: 28 }} />}
      </div>

      {/* Station build queues */}
      {stations.map((st, i) => {
        const planet = state.planets.find((p) => p.stationId === st.id);
        return (
          <div
            key={st.id}
            style={{
              padding: '4px 6px',
              borderBottom: '1px solid rgba(255,200,100,0.1)',
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: C.accent,
                fontWeight: 700,
                letterSpacing: 1,
                marginBottom: 3,
              }}
            >
              {planet?.name ?? `STATION ${i + 1}`}
            </div>
            {st.buildQueue.length === 0 ? (
              <div style={{ fontSize: 8, color: 'rgba(200,180,120,0.3)', fontStyle: 'italic' }}>Idle</div>
            ) : (
              st.buildQueue.map((item, j) => {
                const def = getShipDef(item.shipType);
                const pct = j === 0 ? (1 - item.buildTimeRemaining / item.totalBuildTime) * 100 : 0;
                return (
                  <div key={j} style={{ marginBottom: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, alignItems: 'center' }}>
                      <span style={{ color: '#fff', fontWeight: 600 }}>{def?.displayName ?? item.shipType}</span>
                      <span style={{ color: '#fc4', fontSize: 8 }}>{item.buildTimeRemaining.toFixed(0)}s</span>
                    </div>
                    {j === 0 && <Bar value={pct} max={100} color="#ffcc44" height={5} />}
                  </div>
                );
              })
            )}
          </div>
        );
      })}

      {/* Quick-build with ship preview slots */}
      <div
        style={{
          backgroundImage: `url(${C.tagBg})`,
          backgroundSize: '100% 100%',
          padding: '1px 8px',
          fontSize: 8,
          color: C.muted,
          fontWeight: 700,
          letterSpacing: 1,
          display: 'inline-block',
          marginTop: 4,
          marginBottom: 4,
        }}
      >
        QUICK BUILD
      </div>
      {[1, 2, 3].map((tier) => {
        const ships = BUILDABLE_SHIPS[tier] ?? [];
        if (ships.length === 0) return null;
        return (
          <div key={tier} style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 2 }}>
            {ships.slice(0, 4).map((key) => {
              const def = getShipDef(key);
              if (!def) return null;
              const s = def.stats;
              const canAfford = res.credits >= s.creditCost && res.energy >= s.energyCost && res.minerals >= s.mineralCost;
              const preview = SHIP_PREVIEW[key];
              return (
                <Slot
                  key={key}
                  size={42}
                  onClick={() => canAfford && quickBuild(key)}
                  active={canAfford}
                  style={{ opacity: canAfford ? 1 : 0.35 }}
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt={def.displayName}
                      title={`${def.displayName} — ${s.creditCost}c/${s.energyCost}e/${s.mineralCost}m`}
                      style={{ width: '75%', height: '75%', objectFit: 'contain', imageRendering: 'auto' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 7, color: canAfford ? '#e0d8c0' : '#444', textAlign: 'center' }}>
                      {def.displayName.slice(0, 5)}
                    </span>
                  )}
                </Slot>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
