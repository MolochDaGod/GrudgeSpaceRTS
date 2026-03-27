/**
 * GroundBattleView.tsx — Warhammer 3 style top-down RTS battle view.
 *
 * DEPLOY phase: Click squads to select, drag to reposition on your half.
 * BATTLE phase: Left-click select, right-click move/attack-move.
 * Canvas renders the battlefield, squads, HP bars, morale, floating damage.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import type { PlanetType } from './space-types';
import {
  type GroundBattleState,
  type Squad,
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

interface Props {
  planetType: PlanetType;
  planetName: string;
  onExit: (result: 'win' | 'lose' | 'retreat') => void;
}

export function GroundBattleView({ planetType, planetName, onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GroundBattleState>(createBattleState(planetType));
  const animRef = useRef(0);
  const lastTimeRef = useRef(0);
  const [phase, setPhase] = useState<'deploy' | 'battle' | 'done'>('deploy');
  const [result, setResult] = useState<'none' | 'victory' | 'defeat'>('none');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [, forceRender] = useState(0);

  const state = stateRef.current;
  const terrain = TERRAIN[planetType] ?? TERRAIN.barren;
  const W = state.fieldW * SCALE;
  const H = state.fieldH * SCALE;

  // ── Canvas rendering ─────────────────────────────────────────────
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const s = stateRef.current;
      ctx.fillStyle = terrain.ground;
      ctx.fillRect(0, 0, W, H);

      // Grid lines
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

        // Labels
        ctx.fillStyle = '#ff444488';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ENEMY ZONE', W / 2, s.deployLineY * SCALE - 10);
        ctx.fillStyle = '#4488ff88';
        ctx.fillText('YOUR DEPLOYMENT', W / 2, s.deployLineY * SCALE + 22);
      }

      // Squads
      for (const sq of s.squads) {
        if (sq.dead) continue;
        const sx = sq.x * SCALE;
        const sy = sq.y * SCALE;
        const r = sq.type === 'cavalry' ? 12 : sq.type === 'siege' ? 14 : 10;

        // Selection ring
        if (sq.selected || sq.id === selectedId) {
          ctx.strokeStyle = '#ffffff88';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(sx, sy, r + 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Squad body
        ctx.globalAlpha = sq.routed ? 0.4 : 1;
        ctx.fillStyle = sq.color;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();

        // Facing indicator
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(sq.facing) * (r + 4), sy + Math.sin(sq.facing) * (r + 4));
        ctx.stroke();

        // Icon
        ctx.fillStyle = '#fff';
        ctx.font = `${r}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sq.icon, sx, sy);

        // HP bar
        const hpPct = Math.max(0, sq.hp / sq.maxHp);
        const barW = r * 2.5;
        const barY = sy - r - 8;
        ctx.fillStyle = '#000000aa';
        ctx.fillRect(sx - barW / 2, barY, barW, 4);
        ctx.fillStyle = hpPct > 0.5 ? '#44ee44' : hpPct > 0.2 ? '#eebb00' : '#ee4444';
        ctx.fillRect(sx - barW / 2, barY, barW * hpPct, 4);

        // Morale bar (smaller, below HP)
        const moralePct = Math.max(0, sq.morale / sq.maxMorale);
        ctx.fillStyle = '#000000aa';
        ctx.fillRect(sx - barW / 2, barY + 5, barW, 2);
        ctx.fillStyle = moralePct > 0.3 ? '#ffcc44' : '#ff4444';
        ctx.fillRect(sx - barW / 2, barY + 5, barW * moralePct, 2);

        // Unit count
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
    },
    [W, H, terrain, selectedId],
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

      // Sync React state
      if (stateRef.current.phase !== phase) setPhase(stateRef.current.phase);
      if (stateRef.current.result !== result) setResult(stateRef.current.result);

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

  // ── Mouse interaction ────────────────────────────────────────────
  const toGame = (e: React.MouseEvent): { x: number; y: number } => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / SCALE, y: (e.clientY - rect.top) / SCALE };
  };

  const findSquadAt = (gx: number, gy: number): Squad | null => {
    for (const sq of state.squads) {
      if (sq.dead) continue;
      const r = 2;
      if (Math.hypot(sq.x - gx, sq.y - gy) < r) return sq;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const g = toGame(e);

    if (e.button === 0) {
      // Left click: select
      const sq = findSquadAt(g.x, g.y);
      // Deselect all
      for (const s of state.squads) s.selected = false;
      if (sq && sq.team === 0) {
        sq.selected = true;
        setSelectedId(sq.id);
      } else {
        setSelectedId(null);
      }

      // Deploy: drag reposition
      if (state.phase === 'deploy' && sq && sq.team === 0) {
        const onMove = (me: MouseEvent) => {
          const rect = canvasRef.current!.getBoundingClientRect();
          const gx = (me.clientX - rect.left) / SCALE;
          const gy = (me.clientY - rect.top) / SCALE;
          repositionSquad(state, sq.id, gx, gy);
        };
        const onUp = () => {
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      }
    }

    if (e.button === 2 && state.phase === 'battle') {
      // Right click: move/attack
      e.preventDefault();
      const sel = state.squads.find((s) => s.id === selectedId);
      if (!sel || sel.team !== 0) return;

      const target = findSquadAt(g.x, g.y);
      if (target && target.team === 1 && !target.dead) {
        attackSquad(state, sel.id, target.id);
      } else {
        moveSquad(state, sel.id, g);
      }
    }
  };

  const selSquad = state.squads.find((s) => s.id === selectedId);
  const playerSquads = state.squads.filter((s) => s.team === 0 && !s.dead);
  const enemySquads = state.squads.filter((s) => s.team === 1 && !s.dead && !s.routed);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 150,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
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
        style={{ border: '2px solid rgba(255,200,100,0.3)', borderRadius: 4, cursor: 'crosshair' }}
        onMouseDown={handleMouseDown}
      />

      {/* ── Top HUD ── */}
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
        <span style={{ fontSize: 9, color: '#4488ff' }}>🔵 {playerSquads.length}</span>
        <span style={{ fontSize: 9, color: '#ff4444' }}>🔴 {enemySquads.length}</span>
      </div>

      {/* ── Deploy: START BATTLE button ── */}
      {phase === 'deploy' && (
        <div style={{ position: 'absolute', bottom: 20, display: 'flex', gap: 12 }}>
          <Btn label="⚔ START BATTLE" wide active onClick={() => startBattle(state)} style={{ height: 42, fontSize: 14 }} />
          <Btn label="RETREAT" onClick={() => onExit('retreat')} style={{ height: 42 }} />
        </div>
      )}

      {/* ── Selected squad info ── */}
      {selSquad && !selSquad.dead && (
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
          <div style={{ fontSize: 13, fontWeight: 800, color: selSquad.color, marginBottom: 4 }}>
            {selSquad.icon} {selSquad.name}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(200,180,120,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            {selSquad.type} · {selSquad.unitCount}/{selSquad.maxUnits} units
          </div>
          {/* HP */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 3 }}>
            <span style={{ fontSize: 8, color: '#44ee44', width: 20 }}>HP</span>
            <div style={{ flex: 1, height: 6, background: '#0a0e18', borderRadius: 2 }}>
              <div style={{ height: '100%', borderRadius: 2, width: `${(selSquad.hp / selSquad.maxHp) * 100}%`, background: '#44ee44' }} />
            </div>
            <span style={{ fontSize: 8, color: '#aaa', width: 40, textAlign: 'right' }}>
              {selSquad.hp}/{selSquad.maxHp}
            </span>
          </div>
          {/* Morale */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 3 }}>
            <span style={{ fontSize: 8, color: '#ffcc44', width: 20 }}>MRL</span>
            <div style={{ flex: 1, height: 4, background: '#0a0e18', borderRadius: 2 }}>
              <div
                style={{
                  height: '100%',
                  borderRadius: 2,
                  width: `${(selSquad.morale / selSquad.maxMorale) * 100}%`,
                  background: '#ffcc44',
                }}
              />
            </div>
            <span style={{ fontSize: 8, color: '#aaa', width: 40, textAlign: 'right' }}>{Math.round(selSquad.morale)}</span>
          </div>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 8, fontSize: 8, color: 'rgba(200,180,120,0.5)' }}>
            <span>⚔{selSquad.attackDmg}</span>
            <span>🛡{selSquad.armor}</span>
            <span>💨{selSquad.speed}</span>
            <span>📏{selSquad.attackRange}</span>
          </div>
        </div>
      )}

      {/* ── Battle: retreat button ── */}
      {phase === 'battle' && (
        <div style={{ position: 'absolute', top: 12, right: 16 }}>
          <Btn label="RETREAT" onClick={() => onExit('retreat')} style={{ height: 32 }} />
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
            background: 'rgba(0,0,0,0.7)',
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
                marginBottom: 20,
              }}
            >
              {result === 'victory' ? 'VICTORY' : 'DEFEAT'}
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
          right: 16,
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
            LMB: Select squad
            <br />
            RMB: Move / Attack target
          </>
        )}
      </div>
    </div>
  );
}
