/**
 * GroundBattleView.tsx — Warhammer 3 style top-down RTS battle view.
 *
 * Pre-battle: choose mission type (Eliminate / Assassinate / Sabotage / Hold).
 * DEPLOY phase: Click squads to select, drag to reposition on your half.
 * BATTLE phase:
 *   - LMB single-click: select a squad.
 *   - LMB drag: box-select multiple squads.
 *   - RMB: move or attack-move ALL selected player squads.
 * Canvas renders the battlefield, squads, HP bars, morale, floating damage,
 * mission markers (sabotage zone, boss crown), and the drag selection box.
 * Right sidebar shows army overview with per-squad HP/morale mini-bars.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import type { PlanetType } from './space-types';
import {
  type GroundBattleState,
  type Squad,
  type MissionType,
  MISSION_DEFS,
  createBattleState,
  updateGroundBattle,
  startBattle,
  moveSquad,
  attackSquad,
  repositionSquad,
} from './ground-battle';
import { Btn } from './ui-lib';

// ── Terrain colors per planet type ──────────────────────────────────
const TERRAIN: Record<string, { ground: string; accent: string; line: string }> = {
  volcanic: { ground: '#1a0a04', accent: '#442200', line: '#ff440033' },
  oceanic: { ground: '#0a1820', accent: '#1a3040', line: '#44aaff33' },
  barren: { ground: '#1a1810', accent: '#2a2820', line: '#aa886633' },
  crystalline: { ground: '#0a1420', accent: '#1a2a3a', line: '#44ddff33' },
  gas_giant: { ground: '#141408', accent: '#2a2a1a', line: '#ffaa2233' },
  frozen: { ground: '#1a2030', accent: '#2a3040', line: '#aaccee33' },
  plasma: { ground: '#140814', accent: '#2a0a2a', line: '#ff44ff33' },
  fungal: { ground: '#081408', accent: '#1a2a1a', line: '#44ff4433' },
  metallic: { ground: '#141418', accent: '#2a2a2a', line: '#aaaacc33' },
  dark_matter: { ground: '#040410', accent: '#0a0a1a', line: '#8844ff33' },
};

const SCALE = 8; // pixels per game unit

interface DragRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Props {
  planetType: PlanetType;
  planetName: string;
  onExit: (result: 'win' | 'lose' | 'retreat') => void;
}

export function GroundBattleView({ planetType, planetName, onExit }: Props) {
  const [missionType, setMissionType] = useState<MissionType | null>(null);

  if (!missionType) {
    return <MissionSelectScreen planetName={planetName} onSelect={setMissionType} onCancel={() => onExit('retreat')} />;
  }

  return <BattleCanvas planetType={planetType} planetName={planetName} missionType={missionType} onExit={onExit} />;
}

// ── Mission Select Screen ──────────────────────────────────────────
function MissionSelectScreen({
  planetName,
  onSelect,
  onCancel,
}: {
  planetName: string;
  onSelect: (m: MissionType) => void;
  onCancel: () => void;
}) {
  const [hovered, setHovered] = useState<MissionType | null>(null);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 150,
        background: 'radial-gradient(ellipse at center, #0a0a18 0%, #000 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', monospace",
        color: '#e0d8c0',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,200,100,0.4)', letterSpacing: 4, marginBottom: 6 }}>
          GROUND OPS · {planetName.toUpperCase()}
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: 4,
            color: '#ffcc44',
            textShadow: '0 0 20px rgba(255,180,0,0.4)',
          }}
        >
          SELECT MISSION
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 820 }}>
        {MISSION_DEFS.map((m) => {
          const isHov = hovered === m.type;
          return (
            <div
              key={m.type}
              onMouseEnter={() => setHovered(m.type)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(m.type)}
              style={{
                width: 170,
                padding: '20px 16px',
                borderRadius: 12,
                background: isHov ? `${m.color}18` : 'rgba(10,12,24,0.88)',
                border: `2px solid ${isHov ? m.color : `${m.color}33`}`,
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: isHov ? `0 0 20px ${m.color}44` : 'none',
                transition: 'all 0.18s',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>{m.icon}</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: isHov ? m.color : '#fff',
                  marginBottom: 8,
                  letterSpacing: 1,
                }}
              >
                {m.label}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(200,180,120,0.6)', lineHeight: 1.5 }}>{m.shortDesc}</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 28 }}>
        <Btn label="← BACK TO ORBIT" onClick={onCancel} style={{ height: 36 }} />
      </div>
    </div>
  );
}

// ── Main Battle Canvas Component ───────────────────────────────────
function BattleCanvas({
  planetType,
  planetName,
  missionType,
  onExit,
}: {
  planetType: PlanetType;
  planetName: string;
  missionType: MissionType;
  onExit: (result: 'win' | 'lose' | 'retreat') => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GroundBattleState>(createBattleState(planetType, missionType));
  const animRef = useRef(0);
  const lastTimeRef = useRef(0);
  const [phase, setPhase] = useState<'deploy' | 'battle' | 'done'>('deploy');
  const [result, setResult] = useState<'none' | 'victory' | 'defeat'>('none');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const selectedIdsRef = useRef<Set<number>>(new Set());
  const [, forceRender] = useState(0);

  // Drag selection
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragRectRef = useRef<DragRect | null>(null);
  const [dragRect, setDragRect] = useState<DragRect | null>(null);

  const state = stateRef.current;
  const terrain = TERRAIN[planetType] ?? TERRAIN.barren;
  const W = state.fieldW * SCALE;
  const H = state.fieldH * SCALE;

  // Keep selectedIdsRef in sync and update squad.selected flags
  const setSelected = useCallback((ids: Set<number>) => {
    selectedIdsRef.current = ids;
    setSelectedIds(new Set(ids));
    for (const sq of stateRef.current.squads) {
      sq.selected = ids.has(sq.id);
    }
  }, []);

  // ── Canvas rendering ─────────────────────────────────────────────
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const s = stateRef.current;
      ctx.fillStyle = terrain.ground;
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = terrain.line;
      ctx.lineWidth = 1;
      for (let x = 0; x < s.fieldW; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x * SCALE, 0);
        ctx.lineTo(x * SCALE, H);
        ctx.stroke();
      }
      for (let y = 0; y < s.fieldH; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y * SCALE);
        ctx.lineTo(W, y * SCALE);
        ctx.stroke();
      }

      // Deploy line
      if (s.phase === 'deploy') {
        ctx.strokeStyle = '#ffcc4488';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(0, s.deployLineY * SCALE);
        ctx.lineTo(W, s.deployLineY * SCALE);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ff444488';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('ENEMY ZONE', W / 2, s.deployLineY * SCALE - 10);
        ctx.fillStyle = '#4488ff88';
        ctx.fillText('YOUR DEPLOYMENT', W / 2, s.deployLineY * SCALE + 22);
      }

      // ── Mission markers ────────────────────────────────────────
      if (s.missionType === 'sabotage' && s.phase === 'battle') {
        const pulse = 0.6 + 0.4 * Math.sin(s.gameTime * 3);
        const cx = s.sabotageX * SCALE;
        const cy = s.sabotageY * SCALE;
        const r = s.sabotageRadius * SCALE;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(68,221,255,${0.1 * pulse})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, r * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(68,221,255,${0.7 * pulse})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = `rgba(68,221,255,${0.8 * pulse})`;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💥', cx, cy);
        ctx.textBaseline = 'alphabetic';
      }

      if (s.missionType === 'hold' && s.phase === 'battle') {
        const cx = (s.fieldW / 2) * SCALE;
        const cy = (s.fieldH - 8) * SCALE;
        ctx.beginPath();
        ctx.arc(cx, cy, 12 * SCALE, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(68,238,100,0.06)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, 12 * SCALE, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(68,238,100,0.35)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(68,238,100,0.6)';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('HOLD', cx, cy);
        ctx.textBaseline = 'alphabetic';
      }

      // Squads
      for (const sq of s.squads) {
        if (sq.dead) continue;
        const sx = sq.x * SCALE;
        const sy = sq.y * SCALE;
        const r = sq.type === 'cavalry' ? 12 : sq.type === 'siege' ? 14 : 10;
        const isBoss = sq.id === s.bossSquadId;

        if (isBoss) {
          ctx.beginPath();
          ctx.arc(sx, sy, r + 8 + 2 * Math.sin(s.gameTime * 4), 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,180,0,0.18)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(sx, sy, r + 8, 0, Math.PI * 2);
          ctx.strokeStyle = '#ffaa0099';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        if (selectedIdsRef.current.has(sq.id)) {
          ctx.strokeStyle = '#ffffff88';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(sx, sy, r + 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.globalAlpha = sq.routed ? 0.4 : 1;
        ctx.fillStyle = sq.color;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(sq.facing) * (r + 4), sy + Math.sin(sq.facing) * (r + 4));
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = `${r}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isBoss ? '👑' : sq.icon, sx, sy);
        ctx.textBaseline = 'alphabetic';

        const hpPct = Math.max(0, sq.hp / sq.maxHp);
        const barW = r * 2.5;
        const barY = sy - r - 8;
        ctx.fillStyle = '#000000aa';
        ctx.fillRect(sx - barW / 2, barY, barW, 4);
        ctx.fillStyle = hpPct > 0.5 ? '#44ee44' : hpPct > 0.2 ? '#eebb00' : '#ee4444';
        ctx.fillRect(sx - barW / 2, barY, barW * hpPct, 4);

        const moralePct = Math.max(0, sq.morale / sq.maxMorale);
        ctx.fillStyle = '#000000aa';
        ctx.fillRect(sx - barW / 2, barY + 5, barW, 2);
        ctx.fillStyle = moralePct > 0.3 ? '#ffcc44' : '#ff4444';
        ctx.fillRect(sx - barW / 2, barY + 5, barW * moralePct, 2);

        ctx.fillStyle = '#ffffffcc';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(`${sq.unitCount}`, sx, sy + r + 10);
        ctx.globalAlpha = 1;
      }

      // Float texts
      for (const ft of s.floatTexts) {
        const alpha = 1 - ft.age / 1.5;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x * SCALE, ft.y * SCALE);
      }
      ctx.globalAlpha = 1;

      // Drag selection box
      const dr = dragRectRef.current;
      if (dr) {
        const bx = Math.min(dr.x1, dr.x2);
        const by = Math.min(dr.y1, dr.y2);
        const bw = Math.abs(dr.x2 - dr.x1);
        const bh = Math.abs(dr.y2 - dr.y1);
        ctx.strokeStyle = 'rgba(68,136,255,0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = 'rgba(68,136,255,0.07)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.setLineDash([]);
      }
    },
    [W, H, terrain],
  );

  // ── Game loop ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;
      updateGroundBattle(stateRef.current, dt);
      const s = stateRef.current;
      if ((s.phase as string) !== phase) setPhase(s.phase as 'deploy' | 'battle' | 'done');
      if ((s.result as string) !== result) setResult(s.result as 'none' | 'victory' | 'defeat');
      draw(ctx);
      animRef.current = requestAnimationFrame(loop);
    };
    lastTimeRef.current = performance.now();
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, result, draw]);

  // HUD re-render at 10fps
  useEffect(() => {
    const iv = setInterval(() => forceRender((n) => n + 1), 100);
    return () => clearInterval(iv);
  }, []);

  // ── Coordinate helpers ───────────────────────────────────────────
  const toCanvasPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { cx: e.clientX - rect.left, cy: e.clientY - rect.top };
  };
  const toGame = (cx: number, cy: number) => ({ x: cx / SCALE, y: cy / SCALE });

  const findSquadAt = (gx: number, gy: number): Squad | null => {
    for (const sq of state.squads) {
      if (sq.dead) continue;
      if (Math.hypot(sq.x - gx, sq.y - gy) < 2) return sq;
    }
    return null;
  };

  // ── Mouse handlers ───────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    const { cx, cy } = toCanvasPos(e);
    const g = toGame(cx, cy);

    if (e.button === 0) {
      const sq = findSquadAt(g.x, g.y);

      if (state.phase === 'deploy' && sq?.team === 0) {
        setSelected(new Set([sq.id]));
        const onMove = (me: MouseEvent) => {
          const rect = canvasRef.current!.getBoundingClientRect();
          repositionSquad(state, sq.id, (me.clientX - rect.left) / SCALE, (me.clientY - rect.top) / SCALE);
        };
        const onUp = () => {
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return;
      }

      if (state.phase === 'battle') {
        if (sq?.team === 0) {
          setSelected(new Set([sq.id]));
        } else {
          // Begin box select
          dragStartRef.current = { x: cx, y: cy };
          dragRectRef.current = { x1: cx, y1: cy, x2: cx, y2: cy };
          setDragRect({ x1: cx, y1: cy, x2: cx, y2: cy });

          const onMove = (me: MouseEvent) => {
            const rect = canvasRef.current!.getBoundingClientRect();
            const mx = me.clientX - rect.left;
            const my = me.clientY - rect.top;
            const dr = { x1: dragStartRef.current!.x, y1: dragStartRef.current!.y, x2: mx, y2: my };
            dragRectRef.current = dr;
            setDragRect({ ...dr });
          };
          const onUp = () => {
            const dr = dragRectRef.current;
            if (dr) {
              const gx1 = Math.min(dr.x1, dr.x2) / SCALE;
              const gy1 = Math.min(dr.y1, dr.y2) / SCALE;
              const gx2 = Math.max(dr.x1, dr.x2) / SCALE;
              const gy2 = Math.max(dr.y1, dr.y2) / SCALE;
              const inBox = stateRef.current.squads.filter(
                (s) => !s.dead && s.team === 0 && s.x >= gx1 && s.x <= gx2 && s.y >= gy1 && s.y <= gy2,
              );
              setSelected(inBox.length > 0 ? new Set(inBox.map((s) => s.id)) : new Set());
            }
            dragRectRef.current = null;
            setDragRect(null);
            dragStartRef.current = null;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }
      }
    }

    if (e.button === 2 && state.phase === 'battle') {
      e.preventDefault();
      const selIds = selectedIdsRef.current;
      if (selIds.size === 0) return;
      const target = findSquadAt(g.x, g.y);
      const idArr = [...selIds];
      idArr.forEach((id, idx) => {
        const sq = state.squads.find((s) => s.id === id);
        if (!sq || sq.team !== 0 || sq.dead || sq.routed) return;
        if (target?.team === 1 && !target.dead) {
          attackSquad(state, id, target.id);
        } else {
          const ox = ((idx % 3) - 1) * 4;
          const oy = Math.floor(idx / 3) * 4;
          moveSquad(state, id, { x: g.x + ox, y: g.y + oy });
        }
      });
    }
  };

  // Derived values
  const playerSquads = state.squads.filter((s) => s.team === 0 && !s.dead);
  const enemySquads = state.squads.filter((s) => s.team === 1 && !s.dead && !s.routed);
  const missionDef = MISSION_DEFS.find((m) => m.type === state.missionType)!;
  const holdSecsLeft = state.missionType === 'hold' ? Math.max(0, Math.ceil(state.holdWaveTimer)) : 0;
  const selArr = [...selectedIds];
  const singleSel = selArr.length === 1 ? state.squads.find((s) => s.id === selArr[0] && !s.dead) : null;

  // Suppress unused-variable warning on dragRect (used only by canvas, not React render)
  void dragRect;
  void selectedIds;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 150,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', monospace",
        color: '#e0d8c0',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ border: '2px solid rgba(255,200,100,0.3)', borderRadius: 4, cursor: 'crosshair', flexShrink: 0 }}
        onMouseDown={handleMouseDown}
      />

      {/* ── Army Overview Sidebar ── */}
      <div
        style={{
          width: 200,
          height: H,
          display: 'flex',
          flexDirection: 'column',
          padding: '6px 4px',
          background: 'rgba(4,10,22,0.92)',
          borderLeft: '1px solid rgba(255,200,100,0.12)',
          overflowY: 'auto',
          flexShrink: 0,
        }}
      >
        {/* Mission card */}
        <div
          style={{
            padding: '6px 8px',
            marginBottom: 6,
            borderRadius: 6,
            background: `${missionDef.color}15`,
            border: `1px solid ${missionDef.color}44`,
          }}
        >
          <div style={{ fontSize: 8, color: missionDef.color, fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>
            {missionDef.icon} {missionDef.label}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(200,180,120,0.7)', lineHeight: 1.4 }}>{state.missionObjective}</div>

          {state.missionType === 'hold' && phase === 'battle' && (
            <div style={{ fontSize: 8, color: '#44ee88', marginTop: 4 }}>
              Wave {state.holdWave}/{state.holdMaxWaves}
              {state.holdWave < state.holdMaxWaves && ` · next in ${holdSecsLeft}s`}
            </div>
          )}

          {state.missionType === 'assassinate' &&
            phase === 'battle' &&
            (() => {
              const boss = state.squads.find((s) => s.id === state.bossSquadId);
              if (!boss || boss.dead) return null;
              return (
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 8, color: '#ffaa00', marginBottom: 2 }}>👑 Commander HP</div>
                  <div style={{ height: 4, background: '#2a1a00', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${(boss.hp / boss.maxHp) * 100}%`, background: '#ffaa00', borderRadius: 2 }} />
                  </div>
                </div>
              );
            })()}
        </div>

        {/* Counts */}
        <div style={{ display: 'flex', gap: 8, fontSize: 9, marginBottom: 6, padding: '0 4px' }}>
          <span style={{ color: '#4488ff' }}>🔵 {playerSquads.length}</span>
          <span style={{ color: '#ff4444' }}>🔴 {enemySquads.length}</span>
        </div>

        {/* Squad rows */}
        <div
          style={{ fontSize: 9, fontWeight: 700, color: 'rgba(200,180,120,0.4)', letterSpacing: 1.5, padding: '0 4px', marginBottom: 4 }}
        >
          YOUR ARMY
        </div>
        {playerSquads.map((sq) => {
          const sel = selectedIdsRef.current.has(sq.id);
          const hpPct = sq.hp / sq.maxHp;
          const morPct = sq.morale / sq.maxMorale;
          return (
            <div
              key={sq.id}
              onClick={() => setSelected(new Set([sq.id]))}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '5px 6px',
                marginBottom: 3,
                borderRadius: 5,
                background: sel ? 'rgba(68,136,255,0.15)' : 'rgba(10,14,28,0.7)',
                border: `1px solid ${sel ? 'rgba(68,136,255,0.5)' : 'rgba(255,255,255,0.05)'}`,
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                <span style={{ fontSize: 10 }}>{sq.icon}</span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: sq.color,
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {sq.name}
                </span>
                <span style={{ fontSize: 8, color: 'rgba(200,180,120,0.4)' }}>{sq.unitCount}</span>
              </div>
              <div style={{ height: 3, background: '#0a0e18', borderRadius: 1, marginBottom: 2 }}>
                <div
                  style={{
                    height: '100%',
                    width: `${hpPct * 100}%`,
                    background: hpPct > 0.5 ? '#44ee44' : hpPct > 0.2 ? '#eebb00' : '#ee4444',
                    borderRadius: 1,
                  }}
                />
              </div>
              <div style={{ height: 2, background: '#0a0e18', borderRadius: 1 }}>
                <div
                  style={{
                    height: '100%',
                    width: `${morPct * 100}%`,
                    background: morPct > 0.3 ? '#ffcc44' : '#ff4444',
                    borderRadius: 1,
                  }}
                />
              </div>
            </div>
          );
        })}

        <div style={{ flex: 1 }} />
        {phase !== 'done' && <Btn label="RETREAT" onClick={() => onExit('retreat')} style={{ height: 30, marginTop: 8 }} />}
      </div>

      {/* ── Top HUD bar ── */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          backgroundImage: 'url(/assets/space/ui/hud/BgSettingSmallBox.png)',
          backgroundSize: '100% 100%',
          padding: '6px 24px',
        }}
      >
        <span style={{ fontSize: 10, color: '#ffcc44', fontWeight: 700, letterSpacing: 2 }}>
          {phase === 'deploy' ? '⚙ DEPLOY PHASE' : phase === 'battle' ? '⚔ BATTLE' : '🏁 COMPLETE'}
        </span>
        <span style={{ fontSize: 9, color: 'rgba(200,180,120,0.5)' }}>{planetName}</span>
        <span style={{ fontSize: 9, color: missionDef.color }}>
          {missionDef.icon} {missionDef.label}
        </span>
      </div>

      {/* ── Deploy: START BATTLE ── */}
      {phase === 'deploy' && (
        <div style={{ position: 'absolute', bottom: 20, display: 'flex', gap: 12 }}>
          <Btn label="⚔ START BATTLE" wide active onClick={() => startBattle(state)} style={{ height: 42, fontSize: 14 }} />
        </div>
      )}

      {/* ── Selected squad detail (bottom-left) ── */}
      {singleSel && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            padding: '10px 16px',
            backgroundImage: 'url(/assets/space/ui/hud/Shop_Box.png)',
            backgroundSize: '100% 100%',
            minWidth: 180,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: singleSel.color, marginBottom: 4 }}>
            {singleSel.icon} {singleSel.name}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(200,180,120,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            {singleSel.type} · {singleSel.unitCount}/{singleSel.maxUnits} units
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 3 }}>
            <span style={{ fontSize: 8, color: '#44ee44', width: 20 }}>HP</span>
            <div style={{ flex: 1, height: 6, background: '#0a0e18', borderRadius: 2 }}>
              <div
                style={{ height: '100%', borderRadius: 2, width: `${(singleSel.hp / singleSel.maxHp) * 100}%`, background: '#44ee44' }}
              />
            </div>
            <span style={{ fontSize: 8, color: '#aaa', width: 50, textAlign: 'right' }}>
              {singleSel.hp}/{singleSel.maxHp}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 3 }}>
            <span style={{ fontSize: 8, color: '#ffcc44', width: 20 }}>MRL</span>
            <div style={{ flex: 1, height: 4, background: '#0a0e18', borderRadius: 2 }}>
              <div
                style={{
                  height: '100%',
                  borderRadius: 2,
                  width: `${(singleSel.morale / singleSel.maxMorale) * 100}%`,
                  background: '#ffcc44',
                }}
              />
            </div>
            <span style={{ fontSize: 8, color: '#aaa', width: 50, textAlign: 'right' }}>{Math.round(singleSel.morale)}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, fontSize: 8, color: 'rgba(200,180,120,0.5)' }}>
            <span>⚔{singleSel.attackDmg}</span>
            <span>🛡{singleSel.armor}</span>
            <span>💨{singleSel.speed}</span>
            <span>📏{singleSel.attackRange}</span>
          </div>
        </div>
      )}
      {selArr.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            padding: '10px 16px',
            backgroundImage: 'url(/assets/space/ui/hud/Shop_Box.png)',
            backgroundSize: '100% 100%',
            minWidth: 160,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: '#4488ff', marginBottom: 4 }}>{selArr.length} squads selected</div>
          <div style={{ fontSize: 9, color: 'rgba(200,180,120,0.5)' }}>RMB to group move / attack</div>
        </div>
      )}

      {/* ── Result overlay ── */}
      {phase === 'done' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.72)',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 48,
                fontWeight: 900,
                letterSpacing: 6,
                color: result === 'victory' ? '#44ee44' : '#ff4444',
                textShadow: `0 0 40px ${result === 'victory' ? 'rgba(68,238,68,0.5)' : 'rgba(255,68,68,0.5)'}`,
                marginBottom: 12,
              }}
            >
              {result === 'victory' ? 'VICTORY' : 'DEFEAT'}
            </div>
            <div style={{ fontSize: 12, color: missionDef.color, marginBottom: 20 }}>
              {missionDef.icon} {missionDef.label}
            </div>
            <Btn
              label="RETURN TO ORBIT"
              wide
              active
              onClick={() => onExit(result === 'victory' ? 'win' : 'lose')}
              style={{ height: 44, fontSize: 14 }}
            />
          </div>
        </div>
      )}

      {/* ── Controls hint ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 216,
          padding: '8px 12px',
          backgroundImage: 'url(/assets/space/ui/hud/BgSettingSmallBox.png)',
          backgroundSize: '100% 100%',
          fontSize: 9,
          color: 'rgba(200,180,120,0.4)',
          lineHeight: 1.8,
        }}
      >
        {phase === 'deploy' ? (
          <>
            LMB: Select + Drag to reposition
            <br />
            Click START BATTLE when ready
          </>
        ) : (
          <>
            LMB click: select · LMB drag: box-select
            <br />
            RMB: Move / Attack-move all selected
          </>
        )}
      </div>
    </div>
  );
}
