import { useEffect, useState, useCallback, useRef } from 'react';
import type { SpaceRenderer } from './space-renderer';
import type { SpaceShip, ShipAbilityState, PlayerResources, SpaceGameState } from './space-types';
import { SHIP_DEFINITIONS } from './space-types';

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

// ── Ship Class Icons ──────────────────────────────────────────────
const CLASS_ICONS: Record<string, string> = {
  scout: '🛸', fighter: '✈️', interceptor: '⚡', heavy_fighter: '💥',
  bomber: '💣', stealth: '👻', transport: '📦', assault_frigate: '🚀',
  destroyer: '⚔️', cruiser: '🛡️', battleship: '👑', carrier: '🏗️',
};

// ── Attack Type Icons ─────────────────────────────────────────────
const ATTACK_ICONS: Record<string, string> = {
  laser: '🔴', missile: '🚀', railgun: '⚡', pulse: '💫', torpedo: '💥',
};

interface SpaceHUDProps {
  renderer: SpaceRenderer | null;
}

export function SpaceHUD({ renderer }: SpaceHUDProps) {
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
  const res = state.resources[1 as 1]; // player resources

  // Get selected ships
  const selectedShips: SpaceShip[] = [];
  for (const id of state.selectedIds) {
    const ship = state.ships.get(id);
    if (ship && !ship.dead) selectedShips.push(ship);
  }

  // Primary selected ship (for portrait/command card)
  const primary = selectedShips[0] ?? null;
  const def = primary ? SHIP_DEFINITIONS[primary.shipType] : null;

  // Count alive ships
  let playerAlive = 0, enemyAlive = 0;
  for (const [, s] of state.ships) {
    if (s.dead) continue;
    if (s.team === 1) playerAlive++;
    if (s.team === 2) enemyAlive++;
  }

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', fontFamily: "'Segoe UI', monospace", color: '#cde' }}>
      {/* ── Top Resource Bar ─────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 36,
        background: 'linear-gradient(180deg, rgba(8,14,24,0.95) 0%, rgba(8,14,24,0.7) 100%)',
        borderBottom: '1px solid #1a3050',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 24,
        pointerEvents: 'auto', zIndex: 10,
      }}>
        <span style={{ color: '#4488ff', fontWeight: 700, fontSize: 14 }}>GRUDGE RTS</span>
        <ResourceItem icon="💰" label="Credits" value={Math.floor(res.credits)} color="#fc4" />
        <ResourceItem icon="⚡" label="Energy" value={Math.floor(res.energy)} color="#4df" />
        <ResourceItem icon="💎" label="Minerals" value={Math.floor(res.minerals)} color="#4f8" />
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, opacity: 0.6 }}>
          🔵 {playerAlive} vs 🔴 {enemyAlive}
        </span>
        <span style={{ fontSize: 11, opacity: 0.5 }}>{formatTime(state.gameTime)}</span>
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

        {/* ── Command Card (center-right) ─────────────────── */}
        <div style={{ flex: 1, height: '100%', padding: '8px 12px' }}>
          {primary && primary.abilities.length > 0 ? (
            <CommandCard ship={primary} renderer={renderer} allSelected={selectedShips} />
          ) : primary ? (
            <div style={{ opacity: 0.4, fontSize: 12, marginTop: 50, textAlign: 'center' }}>
              {def?.displayName ?? primary.shipType} — No abilities
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Resource Item ─────────────────────────────────────────────────
function ResourceItem({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
      <span>{icon}</span>
      <span style={{ color, fontWeight: 600, minWidth: 48, textAlign: 'right' }}>{value.toLocaleString()}</span>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 20 }}>{CLASS_ICONS[def.class] ?? '🛸'}</span>
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
      <div style={{ display: 'flex', gap: 10, fontSize: 10, marginTop: 6, opacity: 0.7 }}>
        <span>{ATTACK_ICONS[ship.attackType] ?? '⚪'} {ship.attackDamage} dmg</span>
        <span>🛡️ {ship.armor} armor</span>
        <span>💨 {ship.speed} spd</span>
      </div>
      <div style={{ display: 'flex', gap: 10, fontSize: 10, marginTop: 2, opacity: 0.7 }}>
        <span>📏 {ship.attackRange} range</span>
        <span>⏱️ {ship.attackCooldown.toFixed(1)}s cd</span>
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
              <span style={{ fontSize: 18 }}>{CLASS_ICONS[def?.class ?? 'fighter'] ?? '🛸'}</span>
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
        {icon ?? <span style={{ fontSize: 20 }}>⭐</span>}
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
        ⚡{ab.ability.energyCost}
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
    const mapW = 3200;
    const mapH = 3200;
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
      ctx.fillStyle = ship.team === 1 ? '#4488ff' : ship.team === 2 ? '#ff4444' : '#44ff44';
      if (ship.selected) {
        ctx.fillStyle = '#ffffff';
      }
      ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
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

// ── Helpers ───────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
