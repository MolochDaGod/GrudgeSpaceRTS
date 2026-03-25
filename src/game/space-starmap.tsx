/**
 * space-starmap.tsx — Gruda Armada Star Map (press M)
 *
 * Full-screen tactical planning overlay with 4 tabs:
 *  OVERVIEW  — Live canvas of all planets, ships, resource nodes, fleets
 *  FLEETS    — Create / manage named ship groups
 *  TACTICS   — If/then automated order rules
 *  COMMANDERS — Commander status and assignment overview
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import type { SpaceRenderer } from './space-renderer';
import type { Planet } from './space-types';
import {
  TEAM_COLORS,
  PLANET_TYPE_DATA,
  SHIP_ROLE_LABELS,
  SHIP_ROLE_COLORS,
  SHIP_ROLES,
  COMMANDER_SPEC_LABEL,
  type TacticalOrder,
  type Fleet,
} from './space-types';
import { ALL_TECH_TREES, PLANET_TYPE_TO_TECH, VOID_POWERS } from './space-techtree';

// ── Color palette ────────────────────────────────────────────────
const C = {
  bg: 'rgba(2, 6, 18, 0.97)',
  panel: 'rgba(6, 14, 32, 0.95)',
  border: '#1a3050',
  accent: '#4488ff',
  gold: '#ffcc00',
  text: '#cde',
  muted: 'rgba(160, 200, 255, 0.45)',
  green: '#44ee88',
  red: '#ff4444',
};

const hx = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

type Tab = 'overview' | 'fleets' | 'tactics' | 'commanders';

// ── Asset icon helper ─────────────────────────────────────────────
const Icon = ({ src, size = 20 }: { src: string; size?: number }) => (
  <img
    src={src}
    alt=""
    style={{ width: size, height: size, imageRendering: 'pixelated', objectFit: 'contain', verticalAlign: 'middle', flexShrink: 0 }}
    onError={(e) => {
      (e.target as HTMLImageElement).style.display = 'none';
    }}
  />
);

// ── Role badge ───────────────────────────────────────────────────
const RoleBadge = ({ role }: { role: string }) => {
  const label = SHIP_ROLE_LABELS[role as keyof typeof SHIP_ROLE_LABELS] ?? role;
  const color = SHIP_ROLE_COLORS[role as keyof typeof SHIP_ROLE_COLORS] ?? '#88a';
  return (
    <span
      style={{
        fontSize: 8,
        padding: '1px 5px',
        borderRadius: 3,
        background: `${color}22`,
        border: `1px solid ${color}55`,
        color,
        letterSpacing: 0.5,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {label.toUpperCase()}
    </span>
  );
};

// ── Main export ──────────────────────────────────────────────────
export function StarMapOverlay({ renderer, onClose }: { renderer: SpaceRenderer; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');
  const state = renderer.engine.state;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: C.bg,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Segoe UI', monospace",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 20px',
          borderBottom: `1px solid ${C.border}`,
          background: 'rgba(2,6,18,0.98)',
          gap: 16,
        }}
      >
        {/* Game logo + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/assets/space/ui/logo.webp"
            alt="Gruda Armada"
            style={{ height: 36, imageRendering: 'auto', filter: 'drop-shadow(0 0 12px rgba(68,136,255,0.55))' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 3 }}>STAR MAP · TACTICAL COMMAND</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 24 }}>
          {(['overview', 'fleets', 'tactics', 'commanders'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '6px 18px',
                border: `1px solid ${tab === t ? C.accent : C.border}`,
                borderRadius: 5,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                background: tab === t ? 'rgba(68,136,255,0.18)' : 'transparent',
                color: tab === t ? C.accent : C.muted,
                transition: 'all 0.15s',
              }}
            >
              <Icon
                src={`/assets/space/ui/hud/Ability0${(['overview', 'fleets', 'tactics', 'commanders'] as Tab[]).indexOf(t) + 7}.png`}
                size={14}
              />{' '}
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Stats strip */}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 16, fontSize: 10, color: C.muted }}>
          <span>
            ⏱ {Math.floor(state.gameTime / 60)}:{String(Math.floor(state.gameTime % 60)).padStart(2, '0')}
          </span>
          <span style={{ color: C.accent }}>
            🌍 {state.planets.filter((p) => p.owner === 1).length}/{state.planets.length} planets
          </span>
          <span style={{ color: C.green }}>🚀 {[...state.ships.values()].filter((s) => !s.dead && s.team === 1).length} ships</span>
          <span style={{ color: '#ffcc00' }}>👤 {[...state.commanders.values()].filter((c) => c.team === 1).length} commanders</span>
          <span style={{ color: '#fc4' }}>💰 {Math.floor(state.resources[1]?.credits ?? 0)}</span>
          <span style={{ color: '#4df' }}>⚡ {Math.floor(state.resources[1]?.energy ?? 0)}</span>
          <span style={{ color: '#4f8' }}>⛏ {Math.floor(state.resources[1]?.minerals ?? 0)}</span>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: `1px solid ${C.border}`,
            color: '#888',
            fontSize: 16,
            padding: '4px 12px',
            borderRadius: 5,
            cursor: 'pointer',
            marginLeft: 8,
          }}
        >
          ✕ [M]
        </button>
      </div>

      {/* ── Tab content ─────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'overview' && <OverviewTab renderer={renderer} />}
        {tab === 'fleets' && <FleetsTab renderer={renderer} />}
        {tab === 'tactics' && <TacticsTab renderer={renderer} />}
        {tab === 'commanders' && <CommandersTab renderer={renderer} />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ══════════════════════════════════════════════════════════════════
function OverviewTab({ renderer }: { renderer: SpaceRenderer }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = renderer.engine.state;
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [flash, setFlash] = useState<string>('');

  // Map extents
  const WORLD_SIZE = Math.max(renderer.engine.mapW, renderer.engine.mapH);
  const CANVAS_W = 680,
    CANVAS_H = 560;

  const toCanvas = useCallback(
    (wx: number, wy: number) => ({
      x: ((wx + WORLD_SIZE / 2) / WORLD_SIZE) * CANVAS_W,
      y: ((wy + WORLD_SIZE / 2) / WORLD_SIZE) * CANVAS_H,
    }),
    [WORLD_SIZE],
  );

  const fromCanvas = useCallback(
    (cx: number, cy: number) => ({
      x: (cx / CANVAS_W) * WORLD_SIZE - WORLD_SIZE / 2,
      y: (cy / CANVAS_H) * WORLD_SIZE - WORLD_SIZE / 2,
    }),
    [WORLD_SIZE],
  );

  // ── Canvas render loop ───────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Deep space gradient bg
      const bg = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, 0, CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.7);
      bg.addColorStop(0, '#02060e');
      bg.addColorStop(1, '#010208');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Grid lines
      ctx.strokeStyle = 'rgba(68,136,255,0.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i < CANVAS_W; i += 68) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_H);
        ctx.stroke();
      }
      for (let j = 0; j < CANVAS_H; j += 56) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(CANVAS_W, j);
        ctx.stroke();
      }

      // Resource nodes
      for (const [, nd] of state.resourceNodes) {
        const { x, y } = toCanvas(nd.x, nd.y);
        const nc = nd.kind === 'moon' ? '#998877' : nd.kind === 'asteroid' ? '#554433' : nd.kind === 'ice_rock' ? '#88ccee' : '#44ffcc';
        ctx.fillStyle = nd.harvestCooldown > 0 ? '#333' : nc;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Fleet lines (dashed)
      for (const [, fleet] of state.fleets) {
        if (!fleet.rallyPlanetId) continue;
        const rp = state.planets.find((p) => p.id === fleet.rallyPlanetId);
        if (!rp) continue;
        const { x: rx, y: ry } = toCanvas(rp.x, rp.y);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = fleet.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        for (const sid of fleet.shipIds) {
          const s = state.ships.get(sid);
          if (!s || s.dead) continue;
          const { x: sx, y: sy } = toCanvas(s.x, s.y);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(rx, ry);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // Planets
      for (const p of state.planets) {
        const { x, y } = toCanvas(p.x, p.y);
        const r = Math.max(6, ((p.radius * CANVAS_W) / WORLD_SIZE) * 1.4);
        const ownerColor = TEAM_COLORS[p.owner] ?? 0x444444;

        // Glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2);
        glow.addColorStop(0, `${hx(ownerColor)}44`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Planet body
        const pGrad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
        pGrad.addColorStop(0, hx(p.color | (0xffffff & 0xffffff)));
        pGrad.addColorStop(1, hx(p.color));
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Owner ring
        if (p.owner !== 0) {
          ctx.strokeStyle = hx(ownerColor);
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(x, y, r + 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Capture progress arc
        if (p.captureProgress > 0 && p.captureTeam !== 0) {
          const captureColor = TEAM_COLORS[p.captureTeam] ?? 0xffff44;
          ctx.strokeStyle = hx(captureColor);
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.arc(x, y, r + 5, -Math.PI / 2, -Math.PI / 2 + (p.captureProgress / 100) * Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Selected highlight
        if (selectedPlanet?.id === p.id) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.arc(x, y, r + 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Planet name
        ctx.fillStyle = p.owner === 1 ? '#aaddff' : p.owner !== 0 ? '#ffaaaa' : '#778899';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.name, x, y + r + 12);
      }

      // Ships (dots colored by team + role)
      for (const [, s] of state.ships) {
        if (s.dead) continue;
        const { x, y } = toCanvas(s.x, s.y);
        const role = SHIP_ROLES[s.shipType];
        const base = TEAM_COLORS[s.team] ?? 0x44ff44;
        const col = role ? SHIP_ROLE_COLORS[role] : hx(base);
        const sz = s.selected ? 4 : s.shipClass === 'dreadnought' || s.shipClass === 'battleship' ? 3.5 : 2;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(x, y, sz, 0, Math.PI * 2);
        ctx.fill();
        if (s.selected) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, sz + 1.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Camera viewport rect
      const cam = renderer.controls.cameraState;
      const vw = CANVAS_W * 0.12,
        vh = CANVAS_H * 0.12;
      const { x: cx, y: cy } = toCanvas(cam.x, cam.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - vw / 2, cy - vh / 2, vw, vh);

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [state, toCanvas, selectedPlanet, renderer]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (CANVAS_W / rect.width);
    const cy = (e.clientY - rect.top) * (CANVAS_H / rect.height);
    const { x: wx, y: wy } = fromCanvas(cx, cy);

    if (e.button === 0) {
      // Find nearest planet
      let best: Planet | null = null,
        bd = Infinity;
      for (const p of state.planets) {
        const d = Math.sqrt((p.x - wx) ** 2 + (p.y - wy) ** 2);
        if (d < bd && d < 350) {
          bd = d;
          best = p;
        }
      }
      setSelectedPlanet(best);
      if (!best) {
        // Camera jump
        renderer.controls.cameraState.x = wx;
        renderer.controls.cameraState.y = wy;
        setFlash('Camera moved');
        setTimeout(() => setFlash(''), 1500);
      }
    }
  };

  const sel = selectedPlanet;
  const selShips = sel
    ? [...state.ships.values()].filter(
        (s) => !s.dead && s.team === 1 && Math.sqrt((s.x - sel.x) ** 2 + (s.y - sel.y) ** 2) < sel.captureRadius * 2,
      )
    : [];
  const techTree = sel ? ALL_TECH_TREES[PLANET_TYPE_TO_TECH[sel.planetType]] : null;
  const techSt = state.techState.get(1);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Canvas */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ cursor: 'crosshair', display: 'block', imageRendering: 'crisp-edges' }}
          onMouseDown={handleCanvasClick}
          onContextMenu={(e) => e.preventDefault()}
        />
        {flash && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(68,136,255,0.8)',
              padding: '4px 14px',
              borderRadius: 4,
              fontSize: 10,
              color: '#fff',
              fontWeight: 700,
            }}
          >
            {flash}
          </div>
        )}
        {/* Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            display: 'flex',
            gap: 10,
            background: 'rgba(2,6,18,0.85)',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 8,
          }}
        >
          {Object.entries(SHIP_ROLE_COLORS).map(([r, c]) => (
            <span key={r} style={{ color: c }}>
              {SHIP_ROLE_LABELS[r as keyof typeof SHIP_ROLE_LABELS]}
            </span>
          ))}
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>· Dashed = fleet rally</span>
        </div>
      </div>

      {/* Right detail panel */}
      <div style={{ flex: 1, padding: '12px 14px', overflowY: 'auto', borderLeft: `1px solid ${C.border}` }}>
        {sel ? (
          <>
            {/* Planet header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 10,
                paddingBottom: 8,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: hx(sel.color),
                  boxShadow: `0 0 8px ${hx(sel.color)}88`,
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{sel.name}</div>
                <div style={{ fontSize: 10, color: hx(PLANET_TYPE_DATA[sel.planetType].baseColor) }}>
                  {PLANET_TYPE_DATA[sel.planetType].label} · {sel.isStartingPlanet ? 'Home World' : 'Colony'}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 10, color: sel.owner === 1 ? C.green : sel.owner ? C.red : C.muted }}>
                {sel.owner === 1 ? 'OWNED' : sel.owner ? `ENEMY T${sel.owner}` : 'NEUTRAL'}
              </div>
            </div>

            {/* Resources + status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginBottom: 10 }}>
              {[
                {
                  label: 'Credits/s',
                  v: Math.round(sel.resourceYield.credits * PLANET_TYPE_DATA[sel.planetType].resourceMult.credits),
                  c: '#fc4',
                },
                {
                  label: 'Energy/s',
                  v: Math.round(sel.resourceYield.energy * PLANET_TYPE_DATA[sel.planetType].resourceMult.energy),
                  c: '#4df',
                },
                {
                  label: 'Minerals/s',
                  v: Math.round(sel.resourceYield.minerals * PLANET_TYPE_DATA[sel.planetType].resourceMult.minerals),
                  c: '#4f8',
                },
              ].map(({ label, v, c }) => (
                <div
                  key={label}
                  style={{ padding: '5px 8px', border: `1px solid ${C.border}`, borderRadius: 5, background: C.panel, textAlign: 'center' }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: c }}>{v}</div>
                  <div style={{ fontSize: 8, color: C.muted }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Tech tree summary */}
            {techTree && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 5 }}>TECH: {techTree.name}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {techTree.nodes.map((n) => {
                    const done = techSt?.researchedNodes.has(n.id);
                    const inProg = techSt?.inResearch === n.id;
                    return (
                      <div
                        key={n.id}
                        style={{
                          padding: '2px 6px',
                          borderRadius: 3,
                          fontSize: 8,
                          border: `1px solid ${done ? '#2a5a2a' : inProg ? '#5a5a00' : C.border}`,
                          background: done ? 'rgba(20,60,20,0.5)' : inProg ? 'rgba(40,40,10,0.5)' : 'rgba(6,14,28,0.7)',
                          color: done ? '#4f4' : inProg ? '#fc4' : C.muted,
                        }}
                      >
                        {done ? '✓ ' : inProg ? '⚙ ' : ''}
                        {n.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ships near planet */}
            {selShips.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 5 }}>NEARBY SHIPS ({selShips.length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {selShips.slice(0, 20).map((s) => {
                    const role = SHIP_ROLES[s.shipType];
                    return (
                      <div
                        key={s.id}
                        style={{
                          padding: '3px 6px',
                          border: `1px solid ${C.border}`,
                          borderRadius: 4,
                          fontSize: 8,
                          background: C.panel,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span style={{ color: '#aaa' }}>{s.shipType.replace(/_/g, ' ')}</span>
                        {role && <RoleBadge role={role} />}
                        {'★'.repeat(s.rank ?? 0).padEnd(5, '☆') && (
                          <span style={{ fontSize: 7, color: '#ffcc00' }}>{'★'.repeat(s.rank ?? 0)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Camera button */}
            <button
              onClick={() => {
                renderer.controls.cameraState.x = sel.x;
                renderer.controls.cameraState.y = sel.y;
              }}
              style={{
                marginTop: 10,
                padding: '5px 14px',
                background: C.accent,
                border: 'none',
                borderRadius: 4,
                color: '#fff',
                fontSize: 10,
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              📍 JUMP CAMERA HERE
            </button>
          </>
        ) : (
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.accent, marginBottom: 16 }}>SECTOR OVERVIEW</div>
            {/* Planet list */}
            {state.planets.map((p) => {
              const td = PLANET_TYPE_DATA[p.planetType];
              const ownerCol = TEAM_COLORS[p.owner] ?? 0x444444;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanet(p)}
                  style={{
                    padding: '8px 10px',
                    marginBottom: 4,
                    borderRadius: 6,
                    cursor: 'pointer',
                    border: `1px solid ${C.border}`,
                    background: C.panel,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.1s',
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: hx(p.color),
                      boxShadow: `0 0 6px ${hx(p.color)}88`,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{p.name}</span>
                    <span style={{ fontSize: 9, color: hx(td.baseColor), marginLeft: 6 }}>{td.label}</span>
                  </div>
                  <span style={{ fontSize: 9, color: p.owner === 1 ? C.green : p.owner ? C.red : C.muted }}>
                    {p.owner === 1 ? 'YOURS' : p.owner ? `T${p.owner}` : 'FREE'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// FLEETS TAB
// ══════════════════════════════════════════════════════════════════
function FleetsTab({ renderer }: { renderer: SpaceRenderer }) {
  const state = renderer.engine.state;
  const [selectedFleet, setSelectedFleet] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#4488ff');

  const createFleet = () => {
    if (!newName.trim()) return;
    renderer.engine.addFleet(newName.trim(), newColor);
    setSelectedFleet(newName.trim());
    setNewName('');
  };

  const assignSelected = (fleetName: string) => {
    const ids = [...state.selectedIds];
    renderer.engine.assignShipsToFleet(fleetName, ids);
  };

  const fleets = [...state.fleets.values()];
  const sel = selectedFleet ? state.fleets.get(selectedFleet) : null;
  const selShips = sel ? sel.shipIds.map((id) => state.ships.get(id)).filter(Boolean) : [];

  const FLEET_COLORS = ['#4488ff', '#44ee88', '#ff8844', '#ff44aa', '#ffcc00', '#44eeff', '#aa44ff'];

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Fleet list */}
      <div style={{ width: 260, borderRight: `1px solid ${C.border}`, padding: '12px', overflowY: 'auto' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, marginBottom: 12, letterSpacing: 2 }}>FLEET REGISTRY</div>

        {/* Create */}
        <div style={{ marginBottom: 14, padding: '8px', border: `1px solid ${C.border}`, borderRadius: 6, background: C.panel }}>
          <div style={{ fontSize: 9, color: C.muted, marginBottom: 6, letterSpacing: 1 }}>CREATE FLEET</div>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Fleet name…"
            onKeyDown={(e) => e.key === 'Enter' && createFleet()}
            style={{
              width: '100%',
              padding: '5px 8px',
              background: 'rgba(10,20,40,0.8)',
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              color: C.text,
              fontSize: 11,
              marginBottom: 6,
            }}
          />
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            {FLEET_COLORS.map((col) => (
              <div
                key={col}
                onClick={() => setNewColor(col)}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: col,
                  cursor: 'pointer',
                  border: newColor === col ? '2px solid #fff' : '2px solid transparent',
                }}
              />
            ))}
          </div>
          <button
            onClick={createFleet}
            style={{
              width: '100%',
              padding: '5px',
              background: C.accent,
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + CREATE FLEET
          </button>
        </div>

        {/* Fleet list */}
        {fleets.length === 0 ? (
          <div style={{ fontSize: 10, color: C.muted, textAlign: 'center', marginTop: 20 }}>No fleets yet</div>
        ) : (
          fleets.map((fl) => {
            const alive = fl.shipIds.filter((id) => {
              const s = state.ships.get(id);
              return s && !s.dead;
            }).length;
            return (
              <div
                key={fl.name}
                onClick={() => setSelectedFleet(fl.name === selectedFleet ? null : fl.name)}
                style={{
                  padding: '8px 10px',
                  marginBottom: 4,
                  borderRadius: 6,
                  cursor: 'pointer',
                  border: `1px solid ${selectedFleet === fl.name ? fl.color : C.border}`,
                  background: selectedFleet === fl.name ? `${fl.color}18` : C.panel,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: fl.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', flex: 1 }}>{fl.name}</span>
                  <span style={{ fontSize: 9, color: fl.color }}>
                    {alive}/{fl.shipIds.length}
                  </span>
                </div>
                <div style={{ fontSize: 8, color: C.muted, marginTop: 2, marginLeft: 18 }}>
                  {fl.order !== 'idle' ? `▶ ${fl.order.toUpperCase()}${fl.orderTargetPlanetId ? ' →' : ''}` : 'Idle'}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Fleet detail */}
      <div style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        {sel ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: sel.color }} />
              <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{sel.name}</span>
              <span style={{ fontSize: 10, color: sel.color }}>{sel.shipIds.length} ships</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <button
                onClick={() => assignSelected(sel.name)}
                style={{
                  padding: '5px 12px',
                  background: 'rgba(68,136,255,0.2)',
                  border: `1px solid ${C.accent}`,
                  borderRadius: 4,
                  color: C.accent,
                  fontSize: 10,
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                + ADD SELECTED SHIPS
              </button>
              {state.planets
                .filter((p) => p.owner === 1)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      const fl = state.fleets.get(sel.name);
                      if (fl) {
                        fl.rallyPlanetId = p.id;
                        fl.order = 'attack';
                        fl.orderTargetPlanetId = p.id;
                      }
                    }}
                    style={{
                      padding: '5px 10px',
                      background: C.panel,
                      border: `1px solid ${C.border}`,
                      borderRadius: 4,
                      color: C.muted,
                      fontSize: 9,
                      cursor: 'pointer',
                    }}
                  >
                    Rally → {p.name}
                  </button>
                ))}
            </div>

            {/* Ship grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 6 }}>
              {(selShips as (import('./space-types').SpaceShip | undefined)[]).map((s) => {
                if (!s) return null;
                const role = SHIP_ROLES[s.shipType];
                const hpPct = s.hp / s.maxHp;
                const hpCol = hpPct > 0.5 ? '#44ee44' : hpPct > 0.25 ? '#eebb00' : '#ee4444';
                return (
                  <div
                    key={s.id}
                    style={{
                      padding: '7px 9px',
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      background: C.panel,
                      opacity: s.dead ? 0.35 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: s.dead ? '#666' : '#fff', flex: 1 }}>
                        {s.shipType.replace(/_/g, ' ')}
                      </span>
                      {s.rank > 0 && <span style={{ fontSize: 9, color: '#fc0' }}>{'★'.repeat(s.rank)}</span>}
                      {role && <RoleBadge role={role} />}
                    </div>
                    <div style={{ height: 4, background: '#1a2030', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${hpPct * 100}%`, background: hpCol, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 8, color: C.muted, marginTop: 2 }}>
                      HP {Math.ceil(s.hp)}/{s.maxHp} · Shd {Math.ceil(s.shield)}/{s.maxShield}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.muted, fontSize: 12 }}>
            Select a fleet or create one to manage your forces
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TACTICS TAB
// ══════════════════════════════════════════════════════════════════
function TacticsTab({ renderer }: { renderer: SpaceRenderer }) {
  const state = renderer.engine.state;
  const [form, setForm] = useState<Partial<TacticalOrder>>({
    label: 'New Order',
    enabled: true,
    trigger: 'planet_attacked',
    triggerPlanetId: null,
    triggerFleetName: null,
    action: 'attack_planet',
    actionPlanetId: null,
    fleetName: null,
    priority: 3,
    cooldown: 60,
  });

  const TRIGGER_LABELS: Record<string, string> = {
    planet_attacked: '🚨 Planet under attack',
    planet_captured: '🏳️ Planet captured by enemy',
    fleet_below_half: '⚠️ Fleet below 50% strength',
    manual: '▶ Manual trigger',
  };
  const ACTION_LABELS: Record<string, string> = {
    attack_planet: '⚔️ Attack planet with fleet',
    defend_planet: '🛡 Defend planet with fleet',
    rally_fleet: '🏁 Rally fleet to planet',
    focus_class: '🎯 Focus fire on ship class',
  };

  const myPlanets = state.planets.filter((p) => p.owner === 1);
  const fleetNames = [...state.fleets.keys()];

  const submit = () => {
    if (!form.label) return;
    renderer.engine.addTacticalOrder({
      label: form.label ?? 'Order',
      enabled: form.enabled ?? true,
      trigger: form.trigger ?? 'manual',
      triggerPlanetId: form.triggerPlanetId ?? null,
      triggerFleetName: form.triggerFleetName ?? null,
      action: form.action ?? 'attack_planet',
      actionPlanetId: form.actionPlanetId ?? null,
      fleetName: form.fleetName ?? null,
      priority: form.priority ?? 3,
      cooldown: form.cooldown ?? 60,
    });
  };

  const S = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Order builder */}
      <div style={{ width: 320, borderRight: `1px solid ${C.border}`, padding: '12px', overflowY: 'auto' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, marginBottom: 12, letterSpacing: 2 }}>NEW ORDER</div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 9, color: C.muted }}>ORDER NAME</label>
          <input
            value={form.label ?? ''}
            onChange={(e) => S('label', e.target.value)}
            style={{
              width: '100%',
              padding: '5px 8px',
              marginTop: 2,
              background: 'rgba(10,20,40,0.8)',
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              color: C.text,
              fontSize: 11,
            }}
          />
        </div>

        {/* TRIGGER */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 9, color: C.muted }}>TRIGGER CONDITION</label>
          <select
            value={form.trigger}
            onChange={(e) => S('trigger', e.target.value)}
            style={{
              width: '100%',
              padding: '5px 8px',
              marginTop: 2,
              background: 'rgba(10,20,40,0.95)',
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              color: C.text,
              fontSize: 10,
            }}
          >
            {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {(form.trigger === 'planet_attacked' || form.trigger === 'planet_captured') && (
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 9, color: C.muted }}>WATCH PLANET</label>
            <select
              value={form.triggerPlanetId ?? ''}
              onChange={(e) => S('triggerPlanetId', +e.target.value || null)}
              style={{
                width: '100%',
                padding: '5px 8px',
                marginTop: 2,
                background: 'rgba(10,20,40,0.95)',
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                color: C.text,
                fontSize: 10,
              }}
            >
              <option value="">Any owned planet</option>
              {myPlanets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {form.trigger === 'fleet_below_half' && (
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 9, color: C.muted }}>WATCH FLEET</label>
            <select
              value={form.triggerFleetName ?? ''}
              onChange={(e) => S('triggerFleetName', e.target.value || null)}
              style={{
                width: '100%',
                padding: '5px 8px',
                marginTop: 2,
                background: 'rgba(10,20,40,0.95)',
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                color: C.text,
                fontSize: 10,
              }}
            >
              <option value="">— Select fleet —</option>
              {fleetNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ACTION */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 9, color: C.muted }}>THEN ACTION</label>
          <select
            value={form.action}
            onChange={(e) => S('action', e.target.value)}
            style={{
              width: '100%',
              padding: '5px 8px',
              marginTop: 2,
              background: 'rgba(10,20,40,0.95)',
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              color: C.text,
              fontSize: 10,
            }}
          >
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {(form.action === 'attack_planet' || form.action === 'defend_planet' || form.action === 'rally_fleet') && (
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 9, color: C.muted }}>TARGET PLANET</label>
            <select
              value={form.actionPlanetId ?? ''}
              onChange={(e) => S('actionPlanetId', +e.target.value || null)}
              style={{
                width: '100%',
                padding: '5px 8px',
                marginTop: 2,
                background: 'rgba(10,20,40,0.95)',
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                color: C.text,
                fontSize: 10,
              }}
            >
              <option value="">— Select planet —</option>
              {state.planets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.owner === 1 ? 'ours' : p.owner ? 'enemy' : 'neutral'})
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 9, color: C.muted }}>WITH FLEET</label>
          <select
            value={form.fleetName ?? ''}
            onChange={(e) => S('fleetName', e.target.value || null)}
            style={{
              width: '100%',
              padding: '5px 8px',
              marginTop: 2,
              background: 'rgba(10,20,40,0.95)',
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              color: C.text,
              fontSize: 10,
            }}
          >
            <option value="">All idle ships</option>
            {fleetNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 9, color: C.muted }}>PRIORITY (1-5)</label>
            <input
              type="number"
              min={1}
              max={5}
              value={form.priority ?? 3}
              onChange={(e) => S('priority', +e.target.value)}
              style={{
                width: '100%',
                padding: '5px 8px',
                marginTop: 2,
                background: 'rgba(10,20,40,0.8)',
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                color: C.text,
                fontSize: 11,
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 9, color: C.muted }}>CD (seconds)</label>
            <input
              type="number"
              min={10}
              value={form.cooldown ?? 60}
              onChange={(e) => S('cooldown', +e.target.value)}
              style={{
                width: '100%',
                padding: '5px 8px',
                marginTop: 2,
                background: 'rgba(10,20,40,0.8)',
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                color: C.text,
                fontSize: 11,
              }}
            />
          </div>
        </div>

        <button
          onClick={submit}
          style={{
            width: '100%',
            padding: '8px',
            background: C.accent,
            border: 'none',
            borderRadius: 5,
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ➕ ADD ORDER
        </button>
      </div>

      {/* Active orders list */}
      <div style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, marginBottom: 12, letterSpacing: 2 }}>
          ACTIVE ORDERS ({state.tacticalOrders.filter((o) => o.enabled).length})
        </div>
        {state.tacticalOrders.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 11, marginTop: 40, textAlign: 'center' }}>
            No orders set. Use the builder on the left to add conditional automation.
          </div>
        ) : (
          state.tacticalOrders.map((order) => (
            <div
              key={order.id}
              style={{
                padding: '10px 12px',
                marginBottom: 6,
                borderRadius: 8,
                border: `1px solid ${order.enabled ? C.accent : C.border}`,
                background: order.enabled ? 'rgba(68,136,255,0.06)' : C.panel,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: order.enabled ? '#fff' : '#555', flex: 1 }}>{order.label}</span>
                <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 2, background: `rgba(68,136,255,0.2)`, color: C.accent }}>
                  P{order.priority}
                </span>
                <button
                  onClick={() => {
                    const o = state.tacticalOrders.find((x) => x.id === order.id);
                    if (o) o.enabled = !o.enabled;
                  }}
                  style={{
                    fontSize: 9,
                    padding: '2px 8px',
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    background: 'transparent',
                    color: order.enabled ? C.green : '#666',
                    cursor: 'pointer',
                  }}
                >
                  {order.enabled ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => renderer.engine.removeTacticalOrder(order.id)}
                  style={{
                    fontSize: 9,
                    padding: '2px 8px',
                    border: '1px solid #442222',
                    borderRadius: 3,
                    background: 'transparent',
                    color: '#f44',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>
                <span style={{ color: '#fc4' }}>{TRIGGER_LABELS[order.trigger] ?? order.trigger}</span>
                <span style={{ margin: '0 6px' }}>→</span>
                <span style={{ color: C.green }}>{ACTION_LABELS[order.action] ?? order.action}</span>
                {order.fleetName && <span style={{ marginLeft: 6, color: '#8af' }}>({order.fleetName})</span>}
                {order.cooldownRemaining > 0 && (
                  <span style={{ marginLeft: 6, color: '#f88' }}>CD: {Math.ceil(order.cooldownRemaining)}s</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// COMMANDERS TAB
// ══════════════════════════════════════════════════════════════════
function CommandersTab({ renderer }: { renderer: SpaceRenderer }) {
  const state = renderer.engine.state;
  const allCommanders = [...state.commanders.values()];
  const my = allCommanders.filter((c) => c.team === 1);

  return (
    <div style={{ padding: '14px', overflowY: 'auto', height: '100%' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, marginBottom: 14, letterSpacing: 2 }}>COMMANDER CORPS · ALL TEAMS</div>

      {/* Recruit button */}
      {(() => {
        const ownedPlanets = state.planets.filter((p) => p.owner === 1);
        const alreadyTraining = [...state.commanders.values()].some((c) => c.team === 1 && c.state === 'training');
        return ownedPlanets.length > 0 ? (
          <div style={{ marginBottom: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ownedPlanets.map((p) => (
              <button
                key={p.id}
                disabled={alreadyTraining}
                onClick={() => renderer.engine.trainCommander(1 as any, p.id)}
                style={{
                  padding: '6px 14px',
                  background: alreadyTraining ? C.panel : 'rgba(68,136,255,0.2)',
                  border: `1px solid ${alreadyTraining ? C.border : C.accent}`,
                  borderRadius: 5,
                  color: alreadyTraining ? '#555' : C.accent,
                  fontSize: 10,
                  cursor: alreadyTraining ? 'default' : 'pointer',
                  fontWeight: 700,
                  opacity: alreadyTraining ? 0.5 : 1,
                }}
              >
                + RECRUIT on {p.name}
              </button>
            ))}
            {alreadyTraining && <span style={{ fontSize: 9, color: '#fc4', alignSelf: 'center' }}>⚙ Training in progress…</span>}
          </div>
        ) : null;
      })()}

      {/* Player commanders */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: C.green, marginBottom: 8, letterSpacing: 1, fontWeight: 700 }}>YOUR COMMANDERS</div>
        {my.length === 0 ? (
          <div style={{ fontSize: 10, color: C.muted }}>No commanders yet. Use the recruit buttons above.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 8 }}>
            {my.map((cmd) => {
              const equippedShip = cmd.equippedShipId ? state.ships.get(cmd.equippedShipId) : null;
              return (
                <div
                  key={cmd.id}
                  style={{
                    padding: '10px',
                    border: `1px solid ${cmd.state === 'onship' ? '#2244aa' : cmd.state === 'training' ? '#444400' : '#1a3a22'}`,
                    borderRadius: 8,
                    background: C.panel,
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <img
                      src={cmd.portrait}
                      alt={cmd.name}
                      style={{ width: 42, height: 42, borderRadius: 5, objectFit: 'cover', border: '1px solid #1a3a22' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{cmd.name}</div>
                      <div style={{ fontSize: 9, color: C.green }}>
                        {COMMANDER_SPEC_LABEL[cmd.spec]} · Lv {cmd.level}
                      </div>
                      <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} style={{ fontSize: 9, color: i < cmd.level ? '#fc0' : '#1a3a1a' }}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 8,
                      color: cmd.state === 'training' ? '#fc4' : cmd.state === 'onship' ? '#4df' : '#4f4',
                      marginBottom: 4,
                    }}
                  >
                    {cmd.state === 'training'
                      ? `⚙ Training (${Math.ceil(cmd.trainingTimeRemaining)}s)`
                      : cmd.state === 'onship'
                        ? `🔵 Aboard: ${equippedShip?.shipType ?? 'Unknown'}`
                        : '✅ Idle — ready to deploy'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, fontSize: 8 }}>
                    {[
                      ['ATK', cmd.attackBonus, '#ee4'],
                      ['DEF', cmd.defenseBonus, '#4e8'],
                      ['SPD', cmd.speedBonus, '#4af'],
                      ['SPC', cmd.specialBonus, '#fc0'],
                    ].map(([l, v, c]) => (
                      <span key={l as string} style={{ color: c as string }}>
                        {l}: +{Math.round((v as number) * 100)}%
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Void Powers status */}
      <div>
        <div style={{ fontSize: 10, color: '#aa44ff', marginBottom: 8, letterSpacing: 1, fontWeight: 700 }}>VOID POWER STATUS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.values(VOID_POWERS).map((pwr) => {
            const techSt = state.techState.get(1);
            const unlocked = techSt?.researchedNodes.has(pwr.techNodeId);
            const cd = state.voidCooldowns.get(1)?.get(pwr.id) ?? 0;
            return (
              <div
                key={pwr.id}
                style={{
                  padding: '6px 10px',
                  border: `1px solid ${unlocked ? '#443366' : '#1a2030'}`,
                  borderRadius: 6,
                  background: unlocked ? 'rgba(80,30,100,0.3)' : C.panel,
                  width: 130,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                  <img
                    src={pwr.icon}
                    alt=""
                    style={{ width: 18, height: 18, imageRendering: 'pixelated' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span style={{ fontSize: 10, fontWeight: 700, color: unlocked ? '#cc88ff' : '#444' }}>{pwr.name}</span>
                </div>
                <div style={{ fontSize: 8, color: C.muted }}>{pwr.description.slice(0, 60)}…</div>
                <div style={{ fontSize: 8, marginTop: 3 }}>
                  {!unlocked ? (
                    <span style={{ color: '#444' }}>🔒 Not researched</span>
                  ) : cd > 0 ? (
                    <span style={{ color: '#f88' }}>⏱ CD: {Math.ceil(cd)}s</span>
                  ) : (
                    <span style={{ color: C.green }}>✅ Ready</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
