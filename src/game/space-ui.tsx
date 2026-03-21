import { useEffect, useState, useCallback, useRef } from 'react';
import type { SpaceRenderer } from './space-renderer';
import type { SpaceShip, SpaceStation, ShipAbilityState, PlayerResources, SpaceGameState, TeamUpgrades } from './space-types';
import { SHIP_DEFINITIONS, BUILDABLE_SHIPS, UPGRADE_COSTS, UPGRADE_BONUSES, TEAM_COLORS, CAPTURE_TIME, DOMINATION_TIME, HERO_DEFINITIONS, HERO_SHIPS, getShipDef, type UpgradeType } from './space-types';

// ── Ability SVG Icons ─────────────────────────────────────────────
const ABILITY_ICONS: Record<string, React.ReactNode> = {
  barrel_roll: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2"/>
      <path d="M10 16 C10 10, 22 10, 22 16 C22 22, 10 22, 10 16" stroke="#4df" strokeWidth="2" fill="none"/>
      <path d="M14 12L18 16L14 20" stroke="#4df" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  speed_boost: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="16,4 28,28 16,22 4,28" fill="#f80" opacity="0.3"/>
      <polygon points="16,4 28,28 16,22 4,28" stroke="#fa0" strokeWidth="1.5" fill="none"/>
      <line x1="10" y1="18" x2="6" y2="24" stroke="#f60" strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="22" x2="16" y2="30" stroke="#f60" strokeWidth="2" strokeLinecap="round"/>
      <line x1="22" y1="18" x2="26" y2="24" stroke="#f60" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  cloak: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="10" stroke="#88f" strokeWidth="1" strokeDasharray="3 3" opacity="0.5"/>
      <circle cx="16" cy="16" r="6" stroke="#aaf" strokeWidth="1.5" strokeDasharray="2 2"/>
      <path d="M12 20 Q16 10, 20 20" stroke="#ccf" strokeWidth="2" fill="none" opacity="0.7"/>
      <circle cx="16" cy="14" r="2" fill="#ccf" opacity="0.4"/>
    </svg>
  ),
  iron_dome: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 24 Q16 2, 26 24" stroke="#4ff" strokeWidth="2" fill="none"/>
      <path d="M8 22 Q16 6, 24 22" stroke="#4ff" strokeWidth="1" fill="none" opacity="0.5"/>
      <line x1="16" y1="8" x2="16" y2="24" stroke="#4ff" strokeWidth="1" opacity="0.3"/>
      <circle cx="16" cy="24" r="3" fill="#0aa" opacity="0.4"/>
      <circle cx="10" cy="14" r="1.5" fill="#f44"/>
      <line x1="10" y1="14" x2="14" y2="18" stroke="#f44" strokeWidth="1"/>
    </svg>
  ),
  warp: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="16" cy="16" rx="14" ry="6" stroke="#a4f" strokeWidth="1.5" opacity="0.6"/>
      <ellipse cx="16" cy="16" rx="10" ry="4" stroke="#c6f" strokeWidth="2"/>
      <circle cx="16" cy="16" r="3" fill="#e8f" opacity="0.6"/>
      <line x1="16" y1="2" x2="16" y2="10" stroke="#a4f" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16" y1="22" x2="16" y2="30" stroke="#a4f" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  emp: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" stroke="#ff4" strokeWidth="1" opacity="0.4"/>
      <circle cx="16" cy="16" r="7" stroke="#ff4" strokeWidth="2"/>
      <path d="M14 10 L18 16 L13 16 L17 22" stroke="#ff0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  boarding: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="12" width="8" height="8" rx="1" stroke="#f84" strokeWidth="1.5"/>
      <rect x="18" y="12" width="8" height="8" rx="1" stroke="#4f8" strokeWidth="1.5"/>
      <path d="M14 16 L18 16" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 13 L18 16 L16 19" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  repair: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="13" y="6" width="6" height="20" rx="1" fill="#4f4" opacity="0.3"/>
      <rect x="6" y="13" width="20" height="6" rx="1" fill="#4f4" opacity="0.3"/>
      <rect x="13" y="6" width="6" height="20" rx="1" stroke="#4f4" strokeWidth="1.5"/>
      <rect x="6" y="13" width="20" height="6" rx="1" stroke="#4f4" strokeWidth="1.5"/>
    </svg>
  ),
  ram: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="16,4 26,20 20,20 22,28 10,28 12,20 6,20" fill="#f40" opacity="0.3"/>
      <polygon points="16,4 26,20 20,20 22,28 10,28 12,20 6,20" stroke="#f60" strokeWidth="1.5"/>
      <circle cx="16" cy="16" r="3" fill="#f80"/>
    </svg>
  ),
  launch_fighters: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="14" width="12" height="6" rx="1" stroke="#88f" strokeWidth="1.5"/>
      <polygon points="8,8 12,12 4,12" fill="#4df"/>
      <polygon points="24,8 28,12 20,12" fill="#4df"/>
      <polygon points="16,4 20,10 12,10" fill="#4df"/>
      <line x1="8" y1="10" x2="8" y2="6" stroke="#4df" strokeWidth="1" strokeDasharray="2 1"/>
      <line x1="24" y1="10" x2="24" y2="6" stroke="#4df" strokeWidth="1" strokeDasharray="2 1"/>
    </svg>
  ),
};

// ── Inline SVG helper ─────────────────────────────────────────────
const Svg = ({ children, size = 16, color = 'currentColor' }: { children: React.ReactNode; size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" style={{ width: size, height: size, color, display: 'inline-block', verticalAlign: 'middle' }}>{children}</svg>
);

// ── Ship Class SVG Icons ──────────────────────────────────────────
const CLASS_ICONS: Record<string, React.ReactNode> = {
  scout: <Svg size={20}><circle cx="12" cy="12" r="4" stroke="#6af" strokeWidth="1.5"/><ellipse cx="12" cy="12" rx="10" ry="4" stroke="#6af" strokeWidth="1" opacity=".5"/><circle cx="12" cy="12" r="1.5" fill="#6af"/></Svg>,
  fighter: <Svg size={20}><path d="M12 3L20 19H4Z" stroke="#4df" strokeWidth="1.5" fill="none"/><line x1="12" y1="7" x2="12" y2="15" stroke="#4df" strokeWidth="1"/></Svg>,
  interceptor: <Svg size={20}><path d="M12 2L15 10H20L16 14L18 22L12 18L6 22L8 14L4 10H9Z" stroke="#fa0" strokeWidth="1.2" fill="#fa0" fillOpacity=".15"/></Svg>,
  heavy_fighter: <Svg size={20}><path d="M12 3L21 19H3Z" stroke="#f64" strokeWidth="2" fill="none"/><path d="M8 13H16" stroke="#f64" strokeWidth="2"/></Svg>,
  bomber: <Svg size={20}><circle cx="12" cy="10" r="6" stroke="#f84" strokeWidth="1.5" fill="none"/><path d="M12 16V21" stroke="#f84" strokeWidth="2"/><circle cx="12" cy="10" r="2" fill="#f84"/></Svg>,
  stealth: <Svg size={20}><path d="M12 4L20 18H4Z" stroke="#88a" strokeWidth="1" strokeDasharray="3 2" fill="none"/><path d="M12 8L16 16H8Z" stroke="#aac" strokeWidth="1" strokeDasharray="2 2" fill="none"/></Svg>,
  transport: <Svg size={20}><rect x="5" y="7" width="14" height="10" rx="2" stroke="#8bf" strokeWidth="1.5" fill="none"/><line x1="5" y1="12" x2="19" y2="12" stroke="#8bf" strokeWidth="1"/><circle cx="8" cy="14" r="1" fill="#8bf"/><circle cx="16" cy="14" r="1" fill="#8bf"/></Svg>,
  assault_frigate: <Svg size={20}><path d="M4 18L12 4L20 18" stroke="#f80" strokeWidth="1.5" fill="none"/><path d="M7 18L12 8L17 18" stroke="#f80" strokeWidth="1" fill="#f80" fillOpacity=".15"/><line x1="12" y1="18" x2="12" y2="22" stroke="#f60" strokeWidth="2"/></Svg>,
  destroyer: <Svg size={20}><path d="M6 18L12 3L18 18" stroke="#e44" strokeWidth="2" fill="none"/><line x1="4" y1="12" x2="20" y2="12" stroke="#e44" strokeWidth="1.5"/><circle cx="12" cy="12" r="2" fill="#e44"/></Svg>,
  cruiser: <Svg size={20}><rect x="6" y="4" width="12" height="16" rx="3" stroke="#4af" strokeWidth="1.5" fill="none"/><path d="M6 10H18" stroke="#4af" strokeWidth="1"/><circle cx="12" cy="7" r="1.5" fill="#4af"/><rect x="9" y="13" width="6" height="4" rx="1" stroke="#4af" strokeWidth="1"/></Svg>,
  battleship: <Svg size={20}><path d="M12 2L22 20H2Z" stroke="#fc4" strokeWidth="2" fill="#fc4" fillOpacity=".1"/><line x1="7" y1="14" x2="17" y2="14" stroke="#fc4" strokeWidth="1.5"/><line x1="9" y1="18" x2="15" y2="18" stroke="#fc4" strokeWidth="1"/><circle cx="12" cy="10" r="2" fill="#fc4"/></Svg>,
  carrier: <Svg size={20}><rect x="4" y="6" width="16" height="12" rx="2" stroke="#8af" strokeWidth="1.5" fill="none"/><line x1="4" y1="12" x2="20" y2="12" stroke="#8af" strokeWidth="1"/><polygon points="8,3 10,6 6,6" fill="#6af"/><polygon points="16,3 18,6 14,6" fill="#6af"/></Svg>,
};

// ── Attack Type SVG Icons ─────────────────────────────────────────
const ATTACK_ICONS: Record<string, React.ReactNode> = {
  laser: <Svg size={12} color="#f44"><line x1="4" y1="12" x2="20" y2="12" stroke="#f44" strokeWidth="2"/><circle cx="20" cy="12" r="2" fill="#f44"/></Svg>,
  missile: <Svg size={12} color="#f80"><path d="M4 12L16 12" stroke="#f80" strokeWidth="1.5"/><polygon points="16,8 22,12 16,16" fill="#f80"/><line x1="4" y1="10" x2="2" y2="8" stroke="#f60" strokeWidth="1"/><line x1="4" y1="14" x2="2" y2="16" stroke="#f60" strokeWidth="1"/></Svg>,
  railgun: <Svg size={12} color="#4df"><line x1="2" y1="12" x2="22" y2="12" stroke="#4df" strokeWidth="2.5"/><line x1="18" y1="8" x2="22" y2="12" stroke="#4df" strokeWidth="1.5"/><line x1="18" y1="16" x2="22" y2="12" stroke="#4df" strokeWidth="1.5"/></Svg>,
  pulse: <Svg size={12} color="#a6f"><circle cx="12" cy="12" r="4" stroke="#a6f" strokeWidth="1.5" fill="none"/><circle cx="12" cy="12" r="8" stroke="#a6f" strokeWidth="1" opacity=".4"/><circle cx="12" cy="12" r="2" fill="#a6f"/></Svg>,
  torpedo: <Svg size={12} color="#f44"><ellipse cx="14" cy="12" rx="8" ry="4" stroke="#f44" strokeWidth="1.5" fill="none"/><circle cx="18" cy="12" r="2" fill="#f44"/><line x1="2" y1="10" x2="6" y2="12" stroke="#f60" strokeWidth="1"/><line x1="2" y1="14" x2="6" y2="12" stroke="#f60" strokeWidth="1"/></Svg>,
};

// ── Resource SVG Icons ────────────────────────────────────────────
const RES_ICONS = {
  credits: <Svg size={14} color="#fc4"><circle cx="12" cy="12" r="9" stroke="#fc4" strokeWidth="1.5" fill="none"/><path d="M12 6V18M9 9H15M9 15H15" stroke="#fc4" strokeWidth="1.5"/></Svg>,
  energy: <Svg size={14} color="#4df"><path d="M13 2L6 14H12L11 22L18 10H12Z" stroke="#4df" strokeWidth="1.5" fill="#4df" fillOpacity=".2"/></Svg>,
  minerals: <Svg size={14} color="#4f8"><path d="M12 3L20 9L16 21H8L4 9Z" stroke="#4f8" strokeWidth="1.5" fill="#4f8" fillOpacity=".15"/><path d="M12 3L12 21" stroke="#4f8" strokeWidth="1" opacity=".4"/></Svg>,
};

// ── Stat line SVG Icons ───────────────────────────────────────────
const STAT_ICONS = {
  armor: <Svg size={11} color="#8ac"><path d="M12 3C12 3 4 6 4 12C4 18 12 21 12 21C12 21 20 18 20 12C20 6 12 3 12 3Z" stroke="#8ac" strokeWidth="1.5" fill="none"/></Svg>,
  speed: <Svg size={11} color="#8ac"><path d="M5 17L10 12L5 7" stroke="#8ac" strokeWidth="1.5" strokeLinecap="round"/><path d="M11 17L16 12L11 7" stroke="#8ac" strokeWidth="1.5" strokeLinecap="round" opacity=".5"/></Svg>,
  range: <Svg size={11} color="#8ac"><circle cx="12" cy="12" r="8" stroke="#8ac" strokeWidth="1" fill="none"/><circle cx="12" cy="12" r="4" stroke="#8ac" strokeWidth="1" fill="none"/><circle cx="12" cy="12" r="1.5" fill="#8ac"/></Svg>,
  cooldown: <Svg size={11} color="#8ac"><circle cx="12" cy="12" r="9" stroke="#8ac" strokeWidth="1.5" fill="none"/><path d="M12 6V12L16 14" stroke="#8ac" strokeWidth="1.5" strokeLinecap="round"/></Svg>,
  energyCost: <Svg size={10} color="#4df"><path d="M13 2L6 14H12L11 22L18 10H12Z" stroke="#4df" strokeWidth="1.5" fill="#4df" fillOpacity=".3"/></Svg>,
};

interface SpaceHUDProps {
  renderer: SpaceRenderer | null;
  onQuit?: () => void;
}

export function SpaceHUD({ renderer, onQuit }: SpaceHUDProps) {
  const [, forceUpdate] = useState(0);
  const animRef = useRef(0);

  // Re-render HUD at 10fps for perf
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      forceUpdate(n => n + 1);
      animRef.current = window.setTimeout(tick, 100);
    };
    tick();
    return () => { running = false; clearTimeout(animRef.current); };
  }, []);

  if (!renderer?.engine?.state) return null;
  const state = renderer.engine.state;
  const res = state.resources[1]; // player resources
  const upg = state.upgrades[1];

  // Get selected ships
  const selectedShips: SpaceShip[] = [];
  for (const id of state.selectedIds) {
    const ship = state.ships.get(id);
    if (ship && !ship.dead) selectedShips.push(ship);
  }

  // Selected station?
  let selectedStation: SpaceStation | null = null;
  // Check if any station is close to click (simple: check if station is 'selected')
  for (const [, st] of state.stations) {
    if (st.selected && !st.dead && st.team === 1) { selectedStation = st; break; }
  }

  // Primary selected ship (for portrait/command card)
  const primary = selectedShips[0] ?? null;
  const def = primary ? SHIP_DEFINITIONS[primary.shipType] : null;

  // Count alive ships per team
  const teamCounts = new Map<number, number>();
  for (const [, s] of state.ships) {
    if (s.dead) continue;
    teamCounts.set(s.team, (teamCounts.get(s.team) ?? 0) + 1);
  }
  const playerAlive = teamCounts.get(1) ?? 0;
  const enemyAlive = (teamCounts.get(2) ?? 0) + (teamCounts.get(3) ?? 0) + (teamCounts.get(4) ?? 0);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', fontFamily: "'Segoe UI', monospace", color: '#cde' }}>
      {/* ── Game Over Overlay ─────────────────────────── */}
      {state.gameOver && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', zIndex: 200, pointerEvents: 'auto' }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: state.winner === 1 ? '#44ff44' : '#ff4444', marginBottom: 8 }}>
            {state.winner === 1 ? 'VICTORY' : 'DEFEAT'}
          </div>
          <div style={{ fontSize: 16, opacity: 0.6, marginBottom: 32 }}>
            {state.winCondition === 'domination' ? 'Won by Domination' : 'Won by Elimination'}
          </div>
          {onQuit && <button onClick={onQuit} style={{ padding: '12px 40px', fontSize: 16, fontWeight: 700, color: '#fff', background: '#2266cc', border: 'none', borderRadius: 6, cursor: 'pointer' }}>BACK TO MENU</button>}
        </div>
      )}

      {/* ── Domination Warning ────────────────────────── */}
      {state.dominationTeam !== null && state.dominationTimer > 0 && !state.gameOver && (
        <div style={{ position: 'absolute', top: 44, left: '50%', transform: 'translateX(-50%)', background: state.dominationTeam === 1 ? 'rgba(68,255,68,0.2)' : 'rgba(255,68,68,0.2)', border: `1px solid ${state.dominationTeam === 1 ? '#4f4' : '#f44'}`, padding: '6px 20px', borderRadius: 6, fontSize: 13, fontWeight: 700, color: state.dominationTeam === 1 ? '#4f4' : '#f44', pointerEvents: 'none', zIndex: 20 }}>
          DOMINATION: {Math.ceil(DOMINATION_TIME - state.dominationTimer)}s remaining
        </div>
      )}

      {/* ── Top Resource Bar ───────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 36,
        background: 'linear-gradient(180deg, rgba(8,14,24,0.95) 0%, rgba(8,14,24,0.7) 100%)',
        borderBottom: '1px solid #1a3050',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 24,
        pointerEvents: 'auto', zIndex: 10,
      }}>
        <span style={{ color: '#4488ff', fontWeight: 700, fontSize: 14 }}>NEXUS NEMESIS</span>
        <ResourceItem icon={RES_ICONS.credits} label="Credits" value={Math.floor(res.credits)} color="#fc4" />
        <ResourceItem icon={RES_ICONS.energy} label="Energy" value={Math.floor(res.energy)} color="#4df" />
        <ResourceItem icon={RES_ICONS.minerals} label="Minerals" value={Math.floor(res.minerals)} color="#4f8" />
        <span style={{ fontSize: 10, opacity: 0.5 }}>{Math.floor(res.supply)}/{res.maxSupply} supply</span>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4488ff', display: 'inline-block' }} />
          {playerAlive}
          <span style={{ opacity: 0.4, margin: '0 2px' }}>vs</span>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4444', display: 'inline-block' }} />
          {enemyAlive}
        </div>
        <span style={{ fontSize: 11, opacity: 0.5 }}>{formatTime(state.gameTime)}</span>
        {onQuit && <button onClick={onQuit} style={{ fontSize: 10, padding: '2px 10px', background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: 4, cursor: 'pointer' }}>QUIT</button>}
      </div>

      {/* ── Bottom Panel (StarCraft-style) ───────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
        background: 'linear-gradient(0deg, rgba(6,10,18,0.97) 0%, rgba(10,18,30,0.92) 100%)',
        borderTop: '2px solid #1a3050',
        display: 'flex', pointerEvents: 'auto', zIndex: 10,
      }}>
        {/* ── Minimap Area (left) ─────────────────────────── */}
        <div style={{
          width: 200, height: '100%', borderRight: '1px solid #1a3050',
          position: 'relative', overflow: 'hidden',
        }}>
          <Minimap state={state} />
        </div>

        {/* ── Unit Info Panel (center-left) ───────────────── */}
        <div style={{ width: 260, height: '100%', padding: '8px 12px', borderRight: '1px solid #1a3050' }}>
          {selectedShips.length === 0 ? (
            <div style={{ opacity: 0.3, fontSize: 12, marginTop: 40, textAlign: 'center' }}>No units selected</div>
          ) : selectedShips.length === 1 && primary && def ? (
            <SingleUnitInfo ship={primary} def={def} />
          ) : (
            <MultiUnitInfo ships={selectedShips} />
          )}
        </div>

        {/* ── Command Card / Build Panel (center-right) ──── */}
        <div style={{ flex: 1, height: '100%', padding: '8px 12px', overflowY: 'auto' }}>
          {selectedStation ? (
            <BuildPanel station={selectedStation} renderer={renderer} res={res} />
          ) : primary && primary.abilities.length > 0 ? (
            <CommandCard ship={primary} renderer={renderer} allSelected={selectedShips} />
          ) : primary ? (
            <div style={{ opacity: 0.4, fontSize: 12, marginTop: 50, textAlign: 'center' }}>
              {def?.displayName ?? primary.shipType} — No abilities
            </div>
          ) : upg ? (
            <UpgradePanel upg={upg} res={res} renderer={renderer} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Resource Item ─────────────────────────────────────────────────
function ResourceItem({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
      {icon}
      <span style={{ color, fontWeight: 600, minWidth: 48, textAlign: 'right' }}>{value.toLocaleString()}</span>
      <span style={{ fontSize: 9, opacity: 0.4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
    </div>
  );
}

// ── Single Unit Info ──────────────────────────────────────────────
function SingleUnitInfo({ ship, def }: { ship: SpaceShip; def: { class: string; stats: any; displayName: string } }) {
  const hpPct = ship.hp / ship.maxHp;
  const shPct = ship.maxShield > 0 ? ship.shield / ship.maxShield : 0;

  return (
    <div>
      {/* Name + Class icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 28, height: 28, flexShrink: 0 }}>{CLASS_ICONS[def.class] ?? CLASS_ICONS.fighter}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{def.displayName}</div>
          <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>{def.class.replace('_', ' ')}</div>
        </div>
      </div>

      {/* HP Bar */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
          <span>HP</span>
          <span>{Math.ceil(ship.hp)}/{ship.maxHp}</span>
        </div>
        <div style={{ height: 8, background: '#1a1a2a', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${hpPct * 100}%`, borderRadius: 2,
            background: hpPct > 0.5 ? '#44cc44' : hpPct > 0.25 ? '#ccaa00' : '#cc4444',
            transition: 'width 0.2s',
          }} />
        </div>
      </div>

      {/* Shield Bar */}
      {ship.maxShield > 0 && (
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
            <span style={{ color: '#4df' }}>Shield</span>
            <span>{Math.ceil(ship.shield)}/{ship.maxShield}</span>
          </div>
          <div style={{ height: 6, background: '#1a1a2a', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${shPct * 100}%`, borderRadius: 2, background: '#44ddff', transition: 'width 0.2s' }} />
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, fontSize: 10, marginTop: 6, opacity: 0.7, alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>{ATTACK_ICONS[ship.attackType] ?? ATTACK_ICONS.laser} {ship.attackDamage} dmg</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>{STAT_ICONS.armor} {ship.armor}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>{STAT_ICONS.speed} {ship.speed}</span>
      </div>
      <div style={{ display: 'flex', gap: 10, fontSize: 10, marginTop: 2, opacity: 0.7, alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>{STAT_ICONS.range} {ship.attackRange}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>{STAT_ICONS.cooldown} {ship.attackCooldown.toFixed(1)}s</span>
      </div>
    </div>
  );
}

// ── Multi Unit Info (wireframe grid) ──────────────────────────────
function MultiUnitInfo({ ships }: { ships: SpaceShip[] }) {
  // Group by type
  const groups = new Map<string, SpaceShip[]>();
  for (const s of ships) {
    if (!groups.has(s.shipType)) groups.set(s.shipType, []);
    groups.get(s.shipType)!.push(s);
  }

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>{ships.length} units selected</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
        {Array.from(groups.entries()).map(([type, group]) => {
          const def = SHIP_DEFINITIONS[type];
          const avgHp = group.reduce((sum, s) => sum + s.hp / s.maxHp, 0) / group.length;
          return (
            <div key={type} style={{
              width: 52, height: 52, border: '1px solid #1a3050', borderRadius: 4,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(20,30,50,0.6)', position: 'relative',
            }}>
              <div style={{ width: 22, height: 22 }}>{CLASS_ICONS[def?.class ?? 'fighter'] ?? CLASS_ICONS.fighter}</div>
              <span style={{ fontSize: 9, fontWeight: 700 }}>x{group.length}</span>
              {/* HP indicator */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
                background: '#1a1a2a', borderRadius: '0 0 4px 4px',
              }}>
                <div style={{
                  height: '100%', width: `${avgHp * 100}%`,
                  background: avgHp > 0.5 ? '#44cc44' : '#cc4444',
                  borderRadius: '0 0 4px 4px',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Command Card ──────────────────────────────────────────────────
function CommandCard({ ship, renderer, allSelected }: { ship: SpaceShip; renderer: SpaceRenderer; allSelected: SpaceShip[] }) {
  // Collect unique abilities across selection
  const abilities = ship.abilities;

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, opacity: 0.7 }}>ABILITIES</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {abilities.map((ab, i) => (
          <AbilityButton key={ab.ability.id} ab={ab} index={i} renderer={renderer} allSelected={allSelected} />
        ))}
      </div>
      <div style={{ fontSize: 10, marginTop: 12, opacity: 0.4 }}>
        Left-click: cast  •  Right-click: toggle autocast
      </div>
    </div>
  );
}

// ── Ability Button ────────────────────────────────────────────────
function AbilityButton({ ab, index, renderer, allSelected }: {
  ab: ShipAbilityState; index: number; renderer: SpaceRenderer; allSelected: SpaceShip[];
}) {
  const onCooldown = ab.cooldownRemaining > 0;
  const cdPct = ab.ability.cooldown > 0 ? ab.cooldownRemaining / ab.ability.cooldown : 0;
  const icon = ABILITY_ICONS[ab.ability.type];

  // Check autocast state across selection (majority rules display)
  let autoOn = 0, autoTotal = 0;
  for (const s of allSelected) {
    const a = s.abilities[index];
    if (a) { autoTotal++; if (a.autoCast) autoOn++; }
  }
  const isAutoCast = autoOn > autoTotal / 2;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    renderer.activateAbility(index);
  };

  const handleContext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    renderer.toggleAutoCast(index);
  };

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleContext}
      style={{
        width: 64, height: 72, borderRadius: 6,
        border: isAutoCast ? '2px solid #4f4' : ab.active ? '2px solid #ff0' : '1px solid #2a4060',
        background: ab.active ? 'rgba(255,255,0,0.1)' : 'rgba(16,24,40,0.8)',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        opacity: onCooldown && !ab.active ? 0.5 : 1,
        transition: 'border-color 0.2s, opacity 0.2s',
      }}
    >
      {/* Cooldown sweep overlay */}
      {onCooldown && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `conic-gradient(rgba(0,0,0,0.7) ${cdPct * 360}deg, transparent ${cdPct * 360}deg)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Icon */}
      <div style={{ width: 28, height: 28, color: ab.active ? '#ff0' : '#8ac', position: 'relative', zIndex: 1 }}>
        {icon ?? <Svg size={28}><circle cx="12" cy="12" r="8" stroke="#8ac" strokeWidth="1.5" fill="none"/><circle cx="12" cy="12" r="3" fill="#8ac"/></Svg>}
      </div>

      {/* Key label */}
      <div style={{
        fontSize: 9, fontWeight: 700, marginTop: 2, position: 'relative', zIndex: 1,
        background: '#1a2a40', padding: '1px 4px', borderRadius: 2,
      }}>
        {ab.ability.key}
      </div>

      {/* Ability name */}
      <div style={{ fontSize: 8, opacity: 0.6, marginTop: 1, position: 'relative', zIndex: 1, textAlign: 'center', lineHeight: 1.1, maxWidth: 60 }}>
        {ab.ability.name}
      </div>

      {/* Cooldown text */}
      {onCooldown && (
        <div style={{
          position: 'absolute', top: 2, right: 3, fontSize: 9, fontWeight: 700,
          color: '#f88', zIndex: 2,
        }}>
          {ab.cooldownRemaining.toFixed(0)}s
        </div>
      )}

      {/* Autocast indicator */}
      {isAutoCast && (
        <div style={{
          position: 'absolute', top: 2, left: 3, fontSize: 8, fontWeight: 700,
          color: '#4f4', zIndex: 2,
        }}>
          AUTO
        </div>
      )}

      {/* Energy cost */}
      <div style={{
        position: 'absolute', bottom: 1, right: 3, fontSize: 8, color: '#4df', zIndex: 2,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 1 }}>{STAT_ICONS.energyCost}{ab.ability.energyCost}</span>
      </div>
    </div>
  );
}

// ── Minimap ───────────────────────────────────────────────────────
function Minimap({ state }: { state: SpaceGameState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const mapW = 8000;
    const mapH = 8000;
    const scale = (v: number, max: number, dim: number) => ((v + max / 2) / max) * dim;

    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, w, h);

    // Planets
    for (const p of state.planets) {
      const px = scale(p.x, mapW, w);
      const py = scale(p.y, mapH, h);
      ctx.beginPath();
      ctx.arc(px, py, Math.max(3, p.radius * 0.03), 0, Math.PI * 2);
      ctx.fillStyle = `#${p.color.toString(16).padStart(6, '0')}`;
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Ships
    for (const [, ship] of state.ships) {
      if (ship.dead) continue;
      const sx = scale(ship.x, mapW, w);
      const sy = scale(ship.y, mapH, h);
      const size = ship.shipClass === 'battleship' || ship.shipClass === 'cruiser' ? 3 : 2;
      const tc = TEAM_COLORS[ship.team];
      ctx.fillStyle = tc ? `#${tc.toString(16).padStart(6, '0')}` : '#44ff44';
      if (ship.selected) {
        ctx.fillStyle = '#ffffff';
      }
      ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
    }

    // Stations
    for (const [, st] of state.stations) {
      if (st.dead) continue;
      const sx = scale(st.x, mapW, w), sy = scale(st.y, mapH, h);
      const stc = TEAM_COLORS[st.team];
      ctx.fillStyle = stc ? `#${stc.toString(16).padStart(6, '0')}` : '#4488ff';
      ctx.fillRect(sx - 2, sy - 2, 4, 1);
      ctx.fillRect(sx - 1, sy - 3, 2, 5); // cross
    }

    // Planet owner rings
    for (const p of state.planets) {
      if (p.owner === 0) continue;
      const px = scale(p.x, mapW, w), py = scale(p.y, mapH, h);
      const oc = TEAM_COLORS[p.owner];
      ctx.strokeStyle = oc ? `#${oc.toString(16).padStart(6, '0')}` : '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(4, p.radius * 0.04), 0, Math.PI * 2);
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Border
    ctx.strokeStyle = '#1a3050';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, h);
  });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas ref={canvasRef} width={192} height={170} style={{ imageRendering: 'pixelated' }} />
    </div>
  );
}

// ── Build Panel (when station selected) ─────────────────────────
function BuildPanel({ station, renderer, res }: { station: SpaceStation; renderer: SpaceRenderer; res: PlayerResources }) {
  const tiers = [1, 2, 3, 4, 5];
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: '#4df' }}>BUILD SHIPS</div>

      {/* Auto-produce selector (swarm style) */}
      <div style={{ marginBottom: 6, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 9, opacity: 0.5 }}>Auto:</span>
        <div onClick={() => renderer.engine.setAutoProduction(station.id, null)} style={{
          fontSize: 8, padding: '2px 6px', borderRadius: 3, cursor: 'pointer',
          background: !station.autoProduceType ? '#2266cc' : '#1a2a40', border: '1px solid #1a3050',
        }}>OFF</div>
        {['red_fighter', 'galactix_racer', 'dual_striker'].map(key => {
          const d = SHIP_DEFINITIONS[key];
          return d ? (
            <div key={key} onClick={() => renderer.engine.setAutoProduction(station.id, key)} style={{
              fontSize: 8, padding: '2px 6px', borderRadius: 3, cursor: 'pointer',
              background: station.autoProduceType === key ? '#2266cc' : '#1a2a40', border: '1px solid #1a3050',
            }}>{d.displayName}</div>
          ) : null;
        })}
      </div>

      {/* Build queue */}
      {station.buildQueue.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          {station.buildQueue.map((item, i) => {
            const itemDef = getShipDef(item.shipType);
            return (
              <div key={i} style={{ fontSize: 10, display: 'flex', gap: 6, marginBottom: 2 }}>
                <span style={{ color: HERO_SHIPS.includes(item.shipType) ? '#fc4' : '#fff', fontWeight: 600 }}>{itemDef?.displayName ?? item.shipType}</span>
                <span style={{ color: '#fc4' }}>{item.buildTimeRemaining.toFixed(0)}s</span>
                {i === 0 && <div style={{ flex: 1, height: 4, background: '#1a1a2a', borderRadius: 2, alignSelf: 'center' }}>
                  <div style={{ height: '100%', width: `${(1 - item.buildTimeRemaining / item.totalBuildTime) * 100}%`, background: '#4488ff', borderRadius: 2 }} />
                </div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Stock ships */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 90, overflowY: 'auto', marginBottom: 6 }}>
        {tiers.flatMap(tier => (BUILDABLE_SHIPS[tier] ?? []).map(key => {
          const def = SHIP_DEFINITIONS[key];
          if (!def) return null;
          const s = def.stats;
          const canAfford = res.credits >= s.creditCost && res.energy >= s.energyCost && res.minerals >= s.mineralCost;
          return (
            <div key={key} onClick={() => canAfford && renderer.engine.queueBuild(station.id, key)} style={{
              width: 68, padding: '4px 2px', border: '1px solid #1a3050', borderRadius: 4,
              background: canAfford ? 'rgba(16,24,40,0.8)' : 'rgba(16,24,40,0.3)',
              opacity: canAfford ? 1 : 0.4, cursor: canAfford ? 'pointer' : 'default',
              textAlign: 'center', fontSize: 8,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{def.displayName}</div>
              <div style={{ color: '#fc4' }}>{s.creditCost}c</div>
              <div style={{ color: '#4df' }}>{s.energyCost}e</div>
              <div style={{ color: '#4f8' }}>{s.mineralCost}m</div>
            </div>
          );
        }))}
      </div>

      {/* Hero ships (only if station can build heroes) */}
      {station.canBuildHeroes && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#fc4', marginBottom: 4, borderTop: '1px solid #1a3050', paddingTop: 4 }}>HERO SHIPS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {HERO_SHIPS.map(key => {
              const def = HERO_DEFINITIONS[key];
              if (!def) return null;
              const s = def.stats;
              const canAfford = res.credits >= s.creditCost && res.energy >= s.energyCost && res.minerals >= s.mineralCost;
              return (
                <div key={key} onClick={() => canAfford && renderer.engine.queueBuild(station.id, key)} style={{
                  width: 78, padding: '4px 2px', border: '1px solid #443300', borderRadius: 4,
                  background: canAfford ? 'rgba(40,30,10,0.9)' : 'rgba(20,15,5,0.5)',
                  opacity: canAfford ? 1 : 0.4, cursor: canAfford ? 'pointer' : 'default',
                  textAlign: 'center', fontSize: 8,
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#fc4', marginBottom: 2 }}>{def.displayName}</div>
                  <div style={{ color: '#fc4' }}>{s.creditCost}c</div>
                  <div style={{ color: '#4df' }}>{s.energyCost}e</div>
                  <div style={{ color: '#4f8' }}>{s.mineralCost}m</div>
                  <div style={{ color: '#888', fontSize: 7, marginTop: 1 }}>{s.buildTime}s</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Upgrade Panel (when nothing selected) ───────────────────────
function UpgradePanel({ upg, res, renderer }: { upg: TeamUpgrades; res: PlayerResources; renderer: SpaceRenderer }) {
  const types: { key: keyof TeamUpgrades; label: string; color: string }[] = [
    { key: 'attack', label: 'Attack', color: '#f44' },
    { key: 'armor', label: 'Armor', color: '#8ac' },
    { key: 'speed', label: 'Speed', color: '#fa0' },
    { key: 'health', label: 'Health', color: '#4f4' },
    { key: 'shield', label: 'Shield', color: '#4df' },
  ];
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: '#fa0' }}>GLOBAL UPGRADES</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {types.map(t => {
          const level = upg[t.key];
          const maxed = level >= 5;
          const cost = !maxed ? UPGRADE_COSTS[level] : null;
          const canAfford = cost ? res.credits >= cost.credits && res.minerals >= cost.minerals && res.energy >= cost.energy : false;
          return (
            <div key={t.key} onClick={() => canAfford && renderer.engine.purchaseUpgrade(1 as any, t.key)} style={{
              width: 80, padding: 6, border: '1px solid #1a3050', borderRadius: 4,
              background: maxed ? 'rgba(68,255,68,0.1)' : canAfford ? 'rgba(16,24,40,0.8)' : 'rgba(16,24,40,0.3)',
              opacity: maxed ? 0.6 : canAfford ? 1 : 0.5, cursor: canAfford ? 'pointer' : 'default',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: t.color }}>{t.label}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', margin: '2px 0' }}>Lv {level}/5</div>
              {!maxed && cost && <div style={{ fontSize: 8, opacity: 0.7 }}>{cost.credits}c {cost.minerals}m {cost.energy}e</div>}
              {maxed && <div style={{ fontSize: 8, color: '#4f4' }}>MAX</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
