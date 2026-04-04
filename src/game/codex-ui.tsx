/**
 * codex-ui.tsx ΓÇö Full-screen 3D Ship Codex with React overlay.
 *
 * Layout:
 *   [Left Panel 280px]  [3D Canvas fill]  [Right Detail 320px, slides in]
 *
 * Left panel: scrollable ship list with tier/faction/search filters.
 * Right panel: ship detail (stats, abilities, lore, costs) ΓÇö visible when a ship is selected.
 * Center: Three.js canvas from CodexScene showing the selected ship.
 */
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { CodexScene } from './ship-codex-3d';
import {
  SHIP_DEFINITIONS,
  HERO_DEFINITIONS,
  BUILDABLE_SHIPS,
  HERO_SHIPS,
  SHIP_ROLES,
  SHIP_ROLE_LABELS,
  SHIP_ROLE_COLORS,
  getShipDef,
  FACTION_DATA,
  type SpaceFaction,
} from './space-types';
import type { ShipRoleType, ShipStats, ShipAbility } from './space-types';
import { SHIP_PREVIEW, ABILITY_IMG, TIER_COLORS } from './space-ui-shared';
import { FACTION_HERO_DEFINITIONS } from './space-config';

// ΓöÇΓöÇ Build ship list from game data ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
interface CodexShip {
  key: string;
  displayName: string;
  shipClass: string;
  tier: number;
  stats: ShipStats;
  previewUrl: string | null;
  lore?: string;
  role?: ShipRoleType;
  isHero: boolean;
  faction?: SpaceFaction;
}

function buildCodexList(): CodexShip[] {
  const list: CodexShip[] = [];
  const seen = new Set<string>();
  const add = (key: string, hero: boolean) => {
    if (seen.has(key)) return;
    seen.add(key);
    const def = getShipDef(key);
    if (!def) return;
    const fhDef = FACTION_HERO_DEFINITIONS[key];
    list.push({
      key,
      displayName: def.displayName,
      shipClass: def.class,
      tier: def.stats.tier,
      stats: def.stats,
      previewUrl: SHIP_PREVIEW[key] ?? null,
      lore: 'lore' in def ? (def as any).lore : undefined,
      role: SHIP_ROLES[key] as ShipRoleType | undefined,
      isHero: hero,
      faction: fhDef?.faction,
    });
  };
  for (const key of Object.keys(SHIP_DEFINITIONS)) add(key, false);
  for (const key of Object.keys(HERO_DEFINITIONS)) add(key, true);
  for (const key of Object.keys(FACTION_HERO_DEFINITIONS)) add(key, true);
  return list;
}

const ALL_SHIPS = buildCodexList();

// ΓöÇΓöÇ Class color lookup ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const CLASS_COLORS: Record<string, string> = {
  fighter: '#44aaff',
  heavy_fighter: '#4488ff',
  interceptor: '#66ccff',
  scout: '#88eeff',
  stealth: '#aa44ff',
  corvette: '#66ddaa',
  frigate: '#44ffaa',
  light_cruiser: '#88ff88',
  cruiser: '#ff8844',
  destroyer: '#ff4488',
  battleship: '#ffaa44',
  dreadnought: '#ff6622',
  carrier: '#ffcc44',
  bomber: '#ff6688',
  worker: '#88aacc',
  assault_frigate: '#44cc88',
  transport: '#88ccdd',
};

// ΓöÇΓöÇ Animated stat bar ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function StatBar({ label, value, max, color, icon }: { label: string; value: number; max: number; color: string; icon: string }) {
  const pct = Math.min(100, (value / Math.max(max, 1)) * 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
        <span style={{ color: '#8ac' }}>
          {icon} {label}
        </span>
        <span style={{ color, fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 3,
            transition: 'width 0.5s ease-out',
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
    </div>
  );
}

// ΓöÇΓöÇ Main Codex Component ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export function ShipCodex3D({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CodexScene | null>(null);

  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState(0);
  const [factionFilter, setFactionFilter] = useState<SpaceFaction | 'all'>('all');

  // Init Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new CodexScene(canvasRef.current);
    scene.onLoadStart = () => setLoading(true);
    scene.onLoadEnd = () => setLoading(false);
    scene.init();
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Show selected ship in 3D
  useEffect(() => {
    if (selected && sceneRef.current) {
      sceneRef.current.showShip(selected);
    }
  }, [selected]);

  // Filter ships
  const filtered = useMemo(() => {
    return ALL_SHIPS.filter((s) => {
      if (tierFilter && s.tier !== tierFilter) return false;
      if (factionFilter !== 'all' && s.faction !== factionFilter && !s.isHero) return false;
      if (factionFilter !== 'all' && !s.faction && !s.isHero) return true; // show standard ships in all factions
      if (search) {
        const q = search.toLowerCase();
        if (!s.displayName.toLowerCase().includes(q) && !s.key.includes(q) && !s.shipClass.includes(q)) return false;
      }
      return true;
    });
  }, [search, tierFilter, factionFilter]);

  const selectedShip = useMemo(() => ALL_SHIPS.find((s) => s.key === selected), [selected]);

  const selectShip = useCallback((key: string) => {
    setSelected(key);
  }, []);

  // Auto-select first ship on mount
  useEffect(() => {
    if (!selected && filtered.length > 0) {
      setSelected(filtered[0].key);
    }
  }, [filtered, selected]);

  const FACTIONS: { key: SpaceFaction | 'all'; label: string; color: string }[] = [
    { key: 'all', label: 'ALL', color: '#4488ff' },
    { key: 'legion', label: 'LEGION', color: '#ff4444' },
    { key: 'wisdom', label: 'WISDOM', color: '#44ddff' },
    { key: 'construct', label: 'CONSTRUCT', color: '#ffaa22' },
    { key: 'void', label: 'VOID', color: '#aa44ff' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        fontFamily: "'Segoe UI', monospace",
        color: '#cde',
        overflow: 'hidden',
      }}
    >
      {/* ΓöÇΓöÇ Left Panel: Ship List ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          background: 'rgba(2,6,14,0.95)',
          borderRight: '1px solid #1a3050',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 2,
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #1a3050' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#4488ff', letterSpacing: 3 }}>SHIP CODEX</div>
              <div style={{ fontSize: 9, color: '#445', letterSpacing: 1 }}>{ALL_SHIPS.length} SHIPS</div>
            </div>
            <button
              onClick={onBack}
              style={{
                padding: '4px 12px',
                borderRadius: 4,
                border: '1px solid #ff444466',
                background: 'rgba(255,68,68,0.1)',
                color: '#f66',
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              ΓåÉ BACK
            </button>
          </div>

          {/* Search */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ships..."
            style={{
              width: '100%',
              padding: '7px 10px',
              background: 'rgba(6,14,30,0.9)',
              border: '1px solid #1a3050',
              borderRadius: 5,
              color: '#cde',
              fontSize: 11,
              outline: 'none',
              marginBottom: 8,
            }}
          />

          {/* Tier filters */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 6, flexWrap: 'wrap' }}>
            {[0, 1, 2, 3, 4, 5].map((t) => (
              <div
                key={t}
                onClick={() => setTierFilter(t)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 3,
                  cursor: 'pointer',
                  fontSize: 9,
                  fontWeight: 700,
                  border: `1px solid ${tierFilter === t ? TIER_COLORS[t] || '#4488ff' : '#1a3050'}`,
                  background: tierFilter === t ? `${TIER_COLORS[t] || '#4488ff'}18` : 'transparent',
                  color: tierFilter === t ? TIER_COLORS[t] || '#4488ff' : '#556',
                }}
              >
                {t === 0 ? 'ALL' : `T${t}`}
              </div>
            ))}
          </div>

          {/* Faction filters */}
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {FACTIONS.map((f) => (
              <div
                key={f.key}
                onClick={() => setFactionFilter(f.key)}
                style={{
                  padding: '3px 7px',
                  borderRadius: 3,
                  cursor: 'pointer',
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  border: `1px solid ${factionFilter === f.key ? f.color : '#1a3050'}`,
                  background: factionFilter === f.key ? `${f.color}18` : 'transparent',
                  color: factionFilter === f.key ? f.color : '#556',
                }}
              >
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Ship list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {filtered.map((ship) => {
            const isSel = ship.key === selected;
            const cls = CLASS_COLORS[ship.shipClass] ?? '#4488ff';
            const tc = TIER_COLORS[ship.tier] ?? '#cde';
            return (
              <div
                key={ship.key}
                onClick={() => selectShip(ship.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  background: isSel ? 'rgba(68,136,255,0.12)' : 'transparent',
                  borderLeft: isSel ? '3px solid #ffcc00' : '3px solid transparent',
                  borderBottom: '1px solid rgba(26,48,80,0.3)',
                  transition: 'all 0.15s',
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 4,
                    background: 'rgba(2,4,12,0.9)',
                    border: `1px solid ${isSel ? '#ffcc00' : '#1a3050'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {ship.previewUrl ? (
                    <img
                      src={ship.previewUrl}
                      alt=""
                      style={{ maxWidth: 32, maxHeight: 32, objectFit: 'contain' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 14, opacity: 0.2 }}>≡ƒÜÇ</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: isSel ? '#fff' : ship.isHero ? '#fc4' : '#cde',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {ship.displayName}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                    <span style={{ fontSize: 7, padding: '1px 4px', borderRadius: 2, background: `${cls}22`, color: cls, fontWeight: 700 }}>
                      {ship.shipClass.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span style={{ fontSize: 7, padding: '1px 4px', borderRadius: 2, background: `${tc}22`, color: tc, fontWeight: 700 }}>
                      {ship.isHero ? 'HERO' : `T${ship.tier}`}
                    </span>
                    {ship.role && (
                      <span
                        style={{
                          fontSize: 7,
                          padding: '1px 4px',
                          borderRadius: 2,
                          background: `${SHIP_ROLE_COLORS[ship.role]}22`,
                          color: SHIP_ROLE_COLORS[ship.role],
                          fontWeight: 700,
                        }}
                      >
                        {SHIP_ROLE_LABELS[ship.role]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: '#445', fontSize: 11 }}>No ships match filters</div>
          )}
        </div>
      </div>

      {/* ΓöÇΓöÇ Center: 3D Canvas ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <div ref={canvasRef} style={{ flex: 1, position: 'relative', background: '#010308' }}>
        {/* Loading indicator */}
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              zIndex: 5,
              color: '#4488ff',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            LOADING MODEL...
          </div>
        )}
        {/* Ship name overlay */}
        {selectedShip && !loading && (
          <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 5, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: 3, textShadow: '0 0 20px rgba(68,136,255,0.6)' }}>
              {selectedShip.displayName}
            </div>
            <div style={{ fontSize: 10, color: TIER_COLORS[selectedShip.tier] ?? '#cde', fontWeight: 700, letterSpacing: 2, marginTop: 4 }}>
              {selectedShip.isHero ? 'Γÿà HERO' : `TIER ${selectedShip.tier}`} ┬╖ {selectedShip.shipClass.replace(/_/g, ' ').toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* ΓöÇΓöÇ Right Panel: Ship Detail ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <div
        style={{
          width: selectedShip ? 320 : 0,
          flexShrink: 0,
          background: 'rgba(2,6,14,0.95)',
          borderLeft: '1px solid #1a3050',
          overflow: 'hidden',
          transition: 'width 0.3s ease-out',
          zIndex: 2,
        }}
      >
        {selectedShip && (
          <div style={{ width: 320, padding: '20px 16px', overflowY: 'auto', height: '100%' }}>
            {/* Header */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: selectedShip.isHero ? '#fc4' : '#fff', letterSpacing: 1 }}>
                {selectedShip.displayName}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 9,
                    padding: '2px 8px',
                    borderRadius: 3,
                    background: `${CLASS_COLORS[selectedShip.shipClass] ?? '#4488ff'}22`,
                    color: CLASS_COLORS[selectedShip.shipClass] ?? '#4488ff',
                    fontWeight: 700,
                    border: `1px solid ${CLASS_COLORS[selectedShip.shipClass] ?? '#4488ff'}44`,
                  }}
                >
                  {selectedShip.shipClass.replace(/_/g, ' ').toUpperCase()}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    padding: '2px 8px',
                    borderRadius: 3,
                    background: `${TIER_COLORS[selectedShip.tier] ?? '#cde'}22`,
                    color: TIER_COLORS[selectedShip.tier] ?? '#cde',
                    fontWeight: 700,
                    border: `1px solid ${TIER_COLORS[selectedShip.tier] ?? '#cde'}44`,
                  }}
                >
                  {selectedShip.isHero ? 'Γÿà HERO' : `TIER ${selectedShip.tier}`}
                </span>
                {selectedShip.role && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: '2px 8px',
                      borderRadius: 3,
                      background: `${SHIP_ROLE_COLORS[selectedShip.role]}22`,
                      color: SHIP_ROLE_COLORS[selectedShip.role],
                      fontWeight: 700,
                      border: `1px solid ${SHIP_ROLE_COLORS[selectedShip.role]}44`,
                    }}
                  >
                    {SHIP_ROLE_LABELS[selectedShip.role]}
                  </span>
                )}
                {selectedShip.faction && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: '2px 8px',
                      borderRadius: 3,
                      background: `${FACTION_DATA[selectedShip.faction].color}22`,
                      color: FACTION_DATA[selectedShip.faction].color,
                      fontWeight: 700,
                      border: `1px solid ${FACTION_DATA[selectedShip.faction].color}44`,
                    }}
                  >
                    {FACTION_DATA[selectedShip.faction].icon} {FACTION_DATA[selectedShip.faction].label}
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                marginBottom: 16,
                padding: '12px 14px',
                background: 'rgba(6,14,30,0.7)',
                borderRadius: 8,
                border: '1px solid #1a305044',
              }}
            >
              <div style={{ fontSize: 9, fontWeight: 700, color: '#4488ff88', letterSpacing: 1, marginBottom: 8 }}>COMBAT STATS</div>
              <StatBar label="HULL" value={selectedShip.stats.maxHp} max={2400} color="#44ee44" icon="ΓÖÑ" />
              <StatBar label="SHIELD" value={selectedShip.stats.maxShield} max={1000} color="#44ccff" icon="≡ƒ¢í" />
              <StatBar label="ARMOR" value={selectedShip.stats.armor} max={25} color="#8ac4d4" icon="Γ¼í" />
              <StatBar label="DAMAGE" value={selectedShip.stats.attackDamage} max={200} color="#ff8844" icon="ΓÜö" />
              <StatBar label="RANGE" value={selectedShip.stats.attackRange} max={500} color="#ffaa22" icon="ΓùÄ" />
              <StatBar label="SPEED" value={selectedShip.stats.speed} max={120} color="#ffcc00" icon="┬╗" />
            </div>

            {/* Cost */}
            <div
              style={{
                marginBottom: 16,
                padding: '10px 14px',
                background: 'rgba(6,14,30,0.7)',
                borderRadius: 8,
                border: '1px solid #1a305044',
              }}
            >
              <div style={{ fontSize: 9, fontWeight: 700, color: '#4488ff88', letterSpacing: 1, marginBottom: 6 }}>BUILD COST</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, fontWeight: 700 }}>
                <span style={{ color: '#fc4' }}>
                  {selectedShip.stats.creditCost} <span style={{ fontSize: 8, fontWeight: 400, color: '#8ac' }}>credits</span>
                </span>
                <span style={{ color: '#4df' }}>
                  {selectedShip.stats.energyCost} <span style={{ fontSize: 8, fontWeight: 400, color: '#8ac' }}>energy</span>
                </span>
                <span style={{ color: '#4f8' }}>
                  {selectedShip.stats.mineralCost} <span style={{ fontSize: 8, fontWeight: 400, color: '#8ac' }}>minerals</span>
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 10, color: '#68a' }}>
                <span>ΓÅ▒ {selectedShip.stats.buildTime}s</span>
                <span>≡ƒôª {selectedShip.stats.supplyCost} supply</span>
                <span>≡ƒÆÑ {selectedShip.stats.attackType}</span>
              </div>
            </div>

            {/* Abilities */}
            {selectedShip.stats.abilities && selectedShip.stats.abilities.length > 0 && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '10px 14px',
                  background: 'rgba(6,14,30,0.7)',
                  borderRadius: 8,
                  border: '1px solid #1a305044',
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 700, color: '#44ddff88', letterSpacing: 1, marginBottom: 8 }}>ABILITIES</div>
                {selectedShip.stats.abilities.map((ab: ShipAbility) => {
                  const iconSrc = ABILITY_IMG[ab.type];
                  return (
                    <div
                      key={ab.id + ab.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 8,
                        padding: '6px 8px',
                        background: 'rgba(68,220,255,0.05)',
                        borderRadius: 6,
                        border: '1px solid rgba(68,220,255,0.15)',
                      }}
                    >
                      {iconSrc && (
                        <img
                          src={iconSrc}
                          alt=""
                          style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid rgba(68,220,255,0.3)' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#4df' }}>
                          [{ab.key}] {ab.name}
                        </div>
                        <div style={{ fontSize: 8, color: '#68a', marginTop: 2 }}>
                          CD: {ab.cooldown}s ┬╖ Cost: {ab.energyCost}e ┬╖ Dur: {ab.duration}s{ab.radius ? ` ┬╖ R: ${ab.radius}` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Lore */}
            {selectedShip.lore && (
              <div
                style={{ padding: '10px 14px', background: 'rgba(6,14,30,0.5)', borderRadius: 8, border: '1px solid rgba(255,180,0,0.1)' }}
              >
                <div style={{ fontSize: 9, fontWeight: 700, color: '#886644', letterSpacing: 1, marginBottom: 6 }}>LORE</div>
                <div style={{ fontSize: 11, color: '#cba', fontStyle: 'italic', lineHeight: 1.6 }}>{selectedShip.lore}</div>
              </div>
            )}

            {/* Ship key (dev info) */}
            <div style={{ marginTop: 12, fontSize: 8, color: '#334', textAlign: 'center', letterSpacing: 0.5 }}>{selectedShip.key}</div>
          </div>
        )}
      </div>
    </div>
  );
}
