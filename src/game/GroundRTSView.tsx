/**
 * GroundRTSView.tsx — React component for Top-Down RTS Micro Wars.
 *
 * Two phases:
 *  1. Roster selection — pick 5-8 units from the player roster
 *  2. Battle — canvas game loop with the selected units
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { UnitClass } from './ground-rts-types';
import { PLAYER_UNITS, type GroundRTSState } from './ground-rts-types';
import { createGroundRTSState, tickGroundRTS } from './ground-rts-engine';
import { renderGroundRTS, createCamera, type Camera } from './ground-rts-renderer';
import {
  createControlState,
  type ControlState,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleWheel,
  handleKeyDown,
  handleKeyUp,
  updateCamera,
} from './ground-rts-controls';

// ── Roster Selection Screen ──────────────────────────────────────────
function RosterSelect({ onStart }: { onStart: (roster: UnitClass[]) => void }) {
  const [selected, setSelected] = useState<UnitClass[]>(['man_gun', 'man_rifle', 'man_bat', 'man_knife', 'man_flamethrower']);

  const toggle = (uc: UnitClass) => {
    setSelected((prev) => {
      if (prev.includes(uc)) return prev.filter((u) => u !== uc);
      if (prev.length >= 8) return prev;
      return [...prev, uc];
    });
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#111',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
      }}
    >
      <h1 style={{ color: '#ff8844', marginBottom: 8 }}>MICRO WARS</h1>
      <p style={{ color: '#888', marginBottom: 24 }}>Select 5-8 units for your squad</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, maxWidth: 700, justifyContent: 'center' }}>
        {PLAYER_UNITS.map((def) => {
          const active = selected.includes(def.unitClass);
          return (
            <div
              key={def.unitClass}
              onClick={() => toggle(def.unitClass)}
              style={{
                width: 120,
                padding: '10px 8px',
                borderRadius: 8,
                cursor: 'pointer',
                background: active ? '#224466' : '#1a1a1a',
                border: `2px solid ${active ? '#4488ff' : '#333'}`,
                textAlign: 'center',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 'bold', color: active ? '#4488ff' : '#888' }}>{def.displayName}</div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                HP:{def.hp} DMG:{def.attackDmg} SPD:{def.speed}
              </div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                {def.attackType === 'melee' ? '⚔️ Melee' : def.attackType === 'flame' ? '🔥 Flame' : '🔫 Ranged'}
              </div>
            </div>
          );
        })}
      </div>

      <button
        disabled={selected.length < 5}
        onClick={() => onStart(selected)}
        style={{
          marginTop: 32,
          padding: '14px 48px',
          fontSize: 18,
          fontFamily: 'monospace',
          background: selected.length >= 5 ? '#ff6622' : '#333',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: selected.length >= 5 ? 'pointer' : 'default',
          fontWeight: 'bold',
        }}
      >
        DEPLOY ({selected.length}/8)
      </button>
    </div>
  );
}

// ── Battle Canvas ────────────────────────────────────────────────────
function BattleCanvas({ roster, onRestart }: { roster: UnitClass[]; onRestart: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GroundRTSState | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const ctrlRef = useRef<ControlState>(createControlState());
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Init game state
    const state = createGroundRTSState(roster);
    stateRef.current = state;
    cameraRef.current = createCamera(state.mapWidth, state.mapHeight);
    // Start camera looking at player units (bottom of map)
    cameraRef.current.y = state.mapHeight - 400;

    // Resize canvas
    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth ?? window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight ?? window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Input handlers
    const onMD = (e: MouseEvent) => {
      e.preventDefault();
      handleMouseDown(e, ctrlRef.current, state, cameraRef.current!, canvas.width, canvas.height);
    };
    const onMM = (e: MouseEvent) => handleMouseMove(e, ctrlRef.current);
    const onMU = (e: MouseEvent) => {
      handleMouseUp(e, ctrlRef.current, state, cameraRef.current!, canvas.width, canvas.height);
    };
    const onWH = (e: WheelEvent) => {
      e.preventDefault();
      handleWheel(e, cameraRef.current!);
    };
    const onKD = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && state.gameOver) {
        onRestart();
        return;
      }
      handleKeyDown(e, ctrlRef.current, state);
    };
    const onKU = (e: KeyboardEvent) => handleKeyUp(e, ctrlRef.current);
    const onCM = (e: Event) => e.preventDefault();

    canvas.addEventListener('mousedown', onMD);
    canvas.addEventListener('mousemove', onMM);
    canvas.addEventListener('mouseup', onMU);
    canvas.addEventListener('wheel', onWH, { passive: false });
    canvas.addEventListener('contextmenu', onCM);
    window.addEventListener('keydown', onKD);
    window.addEventListener('keyup', onKU);

    // Game loop
    lastTimeRef.current = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (stateRef.current && cameraRef.current) {
        updateCamera(cameraRef.current, ctrlRef.current, stateRef.current, canvas.width, canvas.height, dt);
        tickGroundRTS(stateRef.current, dt);
        renderGroundRTS(ctx, stateRef.current, cameraRef.current, canvas.width, canvas.height, ctrlRef.current.selectionBox);
      }

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', onMD);
      canvas.removeEventListener('mousemove', onMM);
      canvas.removeEventListener('mouseup', onMU);
      canvas.removeEventListener('wheel', onWH);
      canvas.removeEventListener('contextmenu', onCM);
      window.removeEventListener('keydown', onKD);
      window.removeEventListener('keyup', onKU);
    };
  }, [roster, onRestart]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', background: '#111' }} tabIndex={0} />;
}

// ── Main Component ───────────────────────────────────────────────────
export default function GroundRTSView() {
  const [phase, setPhase] = useState<'roster' | 'battle'>('roster');
  const [roster, setRoster] = useState<UnitClass[]>([]);

  const handleStart = useCallback((r: UnitClass[]) => {
    setRoster(r);
    setPhase('battle');
  }, []);

  const handleRestart = useCallback(() => {
    setPhase('roster');
    setRoster([]);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#111' }}>
      {phase === 'roster' && <RosterSelect onStart={handleStart} />}
      {phase === 'battle' && <BattleCanvas roster={roster} onRestart={handleRestart} />}
    </div>
  );
}
