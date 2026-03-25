/**
 * ── Sci-Fi Overlay Panels ─────────────────────────────────────────────
 *   JournalPanel   — Captain's Log + AI chat using Journal frame
 *   InventoryPanel — Fleet & Planet grid using Inventory frame
 */

import React, { useState, useMemo } from 'react';
import type { SpaceGameState, LogEntry, SpaceShip } from './space-types';
import { JOURNAL, JOURNAL_LAYOUT, INVENTORY, INVENTORY_LAYOUT } from './scifi-gui-assets';
import { SHIP_PREVIEW, getShipDef, PLANET_TYPE_DATA } from './space-ui-shared';

// ═══════════════════════════════════════════════════════════════════════
// JOURNAL PANEL — Captain's Log with entry list + detail view
// ═══════════════════════════════════════════════════════════════════════
interface JournalPanelProps {
  state: SpaceGameState;
  onClose: () => void;
}

const LOG_CATEGORY_COLORS: Record<string, string> = {
  discovery: '#44ddff',
  battle: '#ff4444',
  conquest: '#44ff44',
  diplomacy: '#ffaa22',
  ai_event: '#aa44ff',
  story_beat: '#fc4',
  commander: '#4488ff',
};

export function JournalPanel({ state, onClose }: JournalPanelProps) {
  const entries = state.captainsLog ?? [];
  const [selectedIdx, setSelectedIdx] = useState(entries.length > 0 ? entries.length - 1 : -1);
  const selected = selectedIdx >= 0 ? entries[selectedIdx] : null;
  const L = JOURNAL_LAYOUT;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 'min(90vw, 760px)',
        aspectRatio: '1122/691',
        zIndex: 180,
        pointerEvents: 'auto',
      }}
    >
      {/* Journal frame background */}
      <img
        src={JOURNAL.green}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          pointerEvents: 'none',
        }}
      />

      {/* Close button */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '3%',
          right: '3%',
          cursor: 'pointer',
          fontSize: 18,
          color: '#44ffaa',
          fontWeight: 800,
          zIndex: 2,
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ✕
      </div>

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: '2%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 16,
          fontWeight: 800,
          color: '#44ffaa',
          letterSpacing: 2,
          textShadow: '0 0 8px rgba(68,255,170,0.4)',
        }}
      >
        CAPTAIN'S LOG
      </div>

      {/* Left sidebar — entry list */}
      <div
        style={{
          position: 'absolute',
          left: `${L.sidebar.x}%`,
          top: `${L.sidebar.y}%`,
          width: `${L.sidebar.w}%`,
          height: `${L.sidebar.h}%`,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {entries
          .slice()
          .reverse()
          .map((entry, ri) => {
            const idx = entries.length - 1 - ri;
            const isSelected = idx === selectedIdx;
            const catColor = LOG_CATEGORY_COLORS[entry.category] ?? '#8ac';
            return (
              <div
                key={entry.uuid}
                onClick={() => setSelectedIdx(idx)}
                style={{
                  padding: '4px 6px',
                  cursor: 'pointer',
                  borderRadius: 2,
                  background: isSelected ? 'rgba(68,255,170,0.15)' : 'transparent',
                  borderLeft: `2px solid ${isSelected ? catColor : 'transparent'}`,
                  transition: 'background 0.1s',
                }}
              >
                <div style={{ fontSize: 8, fontWeight: 700, color: catColor, textTransform: 'uppercase' }}>
                  {entry.category.replace('_', ' ')}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: '#cde',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {entry.title}
                </div>
              </div>
            );
          })}
        {entries.length === 0 && <div style={{ fontSize: 9, color: '#446', textAlign: 'center', marginTop: 20 }}>No log entries yet.</div>}
      </div>

      {/* Right content area — selected entry body */}
      <div
        style={{
          position: 'absolute',
          left: `${L.content.x}%`,
          top: `${L.content.y}%`,
          width: `${L.content.w}%`,
          height: `${L.content.h}%`,
          overflow: 'auto',
          padding: 8,
        }}
      >
        {selected ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{selected.title}</div>
            <div style={{ fontSize: 8, color: '#8ac', marginBottom: 8 }}>
              {new Date(selected.realTimestamp).toLocaleTimeString()} · {selected.category}
            </div>
            <div style={{ fontSize: 10, color: '#cde', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selected.body}</div>
          </>
        ) : (
          <div style={{ fontSize: 10, color: '#446', textAlign: 'center', marginTop: 40 }}>Select an entry to view details</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// INVENTORY PANEL — Fleet & Planet Overview with paginated grid
// ═══════════════════════════════════════════════════════════════════════
type InventoryTab = 'ships' | 'planets';

interface InventoryPanelProps {
  state: SpaceGameState;
  onClose: () => void;
  onSelectShip?: (shipId: number) => void;
  onSelectPlanet?: (planetId: number) => void;
}

export function InventoryPanel({ state, onClose, onSelectShip, onSelectPlanet }: InventoryPanelProps) {
  const [tab, setTab] = useState<InventoryTab>('ships');
  const [page, setPage] = useState(0);
  const IL = INVENTORY_LAYOUT;

  // Gather player's alive ships
  const playerShips = useMemo(() => {
    const ships: SpaceShip[] = [];
    for (const [, s] of state.ships) {
      if (!s.dead && s.team === 1) ships.push(s);
    }
    return ships;
  }, [state.ships]);

  // Player planets
  const playerPlanets = useMemo(() => {
    return state.planets.filter((p) => p.owner === 1);
  }, [state.planets]);

  const items = tab === 'ships' ? playerShips : playerPlanets;
  const totalPages = Math.max(1, Math.ceil(items.length / IL.slotsPerPage));
  const pageItems = items.slice(page * IL.slotsPerPage, (page + 1) * IL.slotsPerPage);

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 'min(85vw, 440px)',
        aspectRatio: '635/793',
        zIndex: 180,
        pointerEvents: 'auto',
      }}
    >
      {/* Inventory frame background */}
      <img
        src={INVENTORY.green}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          pointerEvents: 'none',
        }}
      />

      {/* Close button */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '2%',
          right: '3%',
          cursor: 'pointer',
          fontSize: 18,
          color: '#44ffaa',
          fontWeight: 800,
          zIndex: 2,
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ✕
      </div>

      {/* Title + Tab buttons */}
      <div
        style={{
          position: 'absolute',
          top: '2%',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <div
          onClick={() => {
            setTab('ships');
            setPage(0);
          }}
          style={{
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            color: tab === 'ships' ? '#44ffaa' : '#446',
            textShadow: tab === 'ships' ? '0 0 8px rgba(68,255,170,0.4)' : 'none',
          }}
        >
          SHIPS ({playerShips.length})
        </div>
        <div style={{ color: '#333' }}>|</div>
        <div
          onClick={() => {
            setTab('planets');
            setPage(0);
          }}
          style={{
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            color: tab === 'planets' ? '#44ffaa' : '#446',
            textShadow: tab === 'planets' ? '0 0 8px rgba(68,255,170,0.4)' : 'none',
          }}
        >
          PLANETS ({playerPlanets.length})
        </div>
      </div>

      {/* Grid area */}
      <div
        style={{
          position: 'absolute',
          left: `${IL.grid.x}%`,
          top: `${IL.grid.y}%`,
          width: `${IL.grid.w}%`,
          height: `${IL.grid.h}%`,
          display: 'grid',
          gridTemplateColumns: `repeat(${IL.cols}, 1fr)`,
          gridTemplateRows: `repeat(${IL.rows}, 1fr)`,
          gap: 3,
        }}
      >
        {Array.from({ length: IL.slotsPerPage }, (_, i) => {
          const item = pageItems[i];
          if (tab === 'ships') {
            const ship = item as SpaceShip | undefined;
            const preview = ship ? SHIP_PREVIEW[ship.shipType] : null;
            const def = ship ? getShipDef(ship.shipType) : null;
            const hpPct = ship ? ship.hp / ship.maxHp : 0;
            const hpC = hpPct > 0.6 ? '#44ee44' : hpPct > 0.2 ? '#eebb00' : '#ee4444';
            return (
              <div
                key={i}
                onClick={() => ship && onSelectShip?.(ship.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: ship ? 'pointer' : 'default',
                  borderRadius: 3,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (ship) e.currentTarget.style.background = 'rgba(68,255,170,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {ship && preview ? (
                  <img
                    src={preview}
                    alt=""
                    style={{ width: '70%', height: '60%', objectFit: 'contain' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : ship ? (
                  <div style={{ fontSize: 16 }}>🚀</div>
                ) : null}
                {ship && (
                  <>
                    <div
                      style={{
                        fontSize: 6,
                        color: '#8ac',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                      }}
                    >
                      {def?.displayName ?? ship.shipType}
                    </div>
                    <div style={{ width: '70%', height: 2, background: 'rgba(0,0,0,0.5)', borderRadius: 1, marginTop: 1 }}>
                      <div style={{ width: `${hpPct * 100}%`, height: '100%', background: hpC, borderRadius: 1 }} />
                    </div>
                  </>
                )}
              </div>
            );
          } else {
            // Planet slot
            const planet = item as (typeof playerPlanets)[0] | undefined;
            return (
              <div
                key={i}
                onClick={() => planet && onSelectPlanet?.(planet.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: planet ? 'pointer' : 'default',
                  borderRadius: 3,
                }}
                onMouseEnter={(e) => {
                  if (planet) e.currentTarget.style.background = 'rgba(68,255,170,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {planet ? (
                  <>
                    <div style={{ fontSize: 18 }}>🌍</div>
                    <div style={{ fontSize: 7, color: '#44ffaa', textAlign: 'center', marginTop: 1 }}>{planet.name}</div>
                    <div style={{ fontSize: 6, color: '#8ac' }}>
                      L{planet.planetLevel ?? 1} · {planet.planetType}
                    </div>
                  </>
                ) : null}
              </div>
            );
          }
        })}
      </div>

      {/* Pagination */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: `${IL.pageNavY}%`,
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <div
          onClick={() => setPage(Math.max(0, page - 1))}
          style={{
            cursor: page > 0 ? 'pointer' : 'default',
            color: page > 0 ? '#44ffaa' : '#333',
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          ◁
        </div>
        <div style={{ fontSize: 10, color: '#8ac' }}>
          {page + 1} / {totalPages}
        </div>
        <div
          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
          style={{
            cursor: page < totalPages - 1 ? 'pointer' : 'default',
            color: page < totalPages - 1 ? '#44ffaa' : '#333',
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          ▷
        </div>
      </div>
    </div>
  );
}
