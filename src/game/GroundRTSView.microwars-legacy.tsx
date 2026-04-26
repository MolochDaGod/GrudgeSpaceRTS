/**
 * GroundRTSView.tsx — React component for Top-Down RTS Micro Wars.
 *
 * Two phases:
 *  1. Roster selection — pick 5-8 units from the player roster
 *  2. Battle — canvas game loop with the selected units
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { UnitClass, BuildingDef } from './ground-rts-types';
import { PLAYER_UNITS, BUILDING_DEFS, canBuild, getBuildableBuildings, type GroundRTSState } from './ground-rts-types';
import { createGroundRTSState, tickGroundRTS, canPlaceBuilding, placeBuilding } from './ground-rts-engine';
import { renderGroundRTS, createCamera, screenToWorld, type Camera, type BuildGhost } from './ground-rts-renderer';
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

// ── Build Menu Panel ─────────────────────────────────────────────────
function BuildMenuPanel({
  state,
  selectedKey,
  onSelect,
  onClose,
}: {
  state: GroundRTSState;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  const ownedKeys = [...state.buildings.values()].filter((b) => b.team === 0 && b.state !== 'destroyed').map((b) => b.def.key);

  const buildable = getBuildableBuildings();
  const categories: Record<string, string[]> = {
    Economy: buildable.filter((k) => BUILDING_DEFS[k]?.role === 'economy'),
    Production: buildable.filter((k) => BUILDING_DEFS[k]?.role === 'production'),
    Defense: buildable.filter((k) => BUILDING_DEFS[k]?.role === 'defense'),
    Research: buildable.filter((k) => BUILDING_DEFS[k]?.role === 'research'),
    Special: buildable.filter((k) => BUILDING_DEFS[k]?.role === 'special' && k !== 'command_center'),
  };

  const ROLE_COLORS: Record<string, string> = {
    economy: '#44ee88',
    production: '#4488ff',
    defense: '#ff4488',
    research: '#aa44ff',
    special: '#ffcc44',
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: 8,
        top: 70,
        width: 220,
        background: 'rgba(0,0,0,0.85)',
        border: '1px solid #444',
        borderRadius: 6,
        padding: '8px 10px',
        fontFamily: 'monospace',
        color: '#fff',
        fontSize: 11,
        maxHeight: 'calc(100vh - 160px)',
        overflowY: 'auto',
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontWeight: 'bold', color: '#ffcc44', fontSize: 13 }}>BUILD MENU</span>
        <span onClick={onClose} style={{ cursor: 'pointer', color: '#888' }}>
          ✕
        </span>
      </div>
      {Object.entries(categories).map(([cat, keys]) => {
        if (keys.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: 6 }}>
            <div
              style={{
                color: ROLE_COLORS[cat.toLowerCase()] ?? '#888',
                fontWeight: 'bold',
                fontSize: 10,
                marginBottom: 3,
                textTransform: 'uppercase',
              }}
            >
              {cat}
            </div>
            {keys.map((k) => {
              const def = BUILDING_DEFS[k];
              if (!def) return null;
              const available = canBuild(k, ownedKeys);
              const affordable = state.resources.credits >= def.creditCost && state.resources.minerals >= def.mineralCost;
              const active = selectedKey === k;
              const disabled = !available || !affordable;
              return (
                <div
                  key={k}
                  onClick={() => !disabled && onSelect(k)}
                  style={{
                    padding: '5px 6px',
                    marginBottom: 2,
                    borderRadius: 4,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    background: active ? '#334466' : disabled ? '#1a1a1a' : '#222',
                    border: `1px solid ${active ? '#4488ff' : disabled ? '#333' : '#444'}`,
                    opacity: disabled ? 0.45 : 1,
                    transition: 'all 0.1s',
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: active ? '#4488ff' : '#ccc' }}>{def.name}</div>
                  <div style={{ color: '#777', fontSize: 10 }}>{def.description}</div>
                  <div style={{ marginTop: 2, display: 'flex', gap: 8, fontSize: 10 }}>
                    {def.creditCost > 0 && (
                      <span style={{ color: state.resources.credits >= def.creditCost ? '#ffcc44' : '#ff4444' }}>{def.creditCost}¢</span>
                    )}
                    {def.mineralCost > 0 && (
                      <span style={{ color: state.resources.minerals >= def.mineralCost ? '#44ddff' : '#ff4444' }}>{def.mineralCost}m</span>
                    )}
                    {def.powerCost !== 0 && (
                      <span style={{ color: def.powerCost < 0 ? '#44ff44' : '#ff8844' }}>
                        {def.powerCost < 0 ? `+${Math.abs(def.powerCost)}` : `-${def.powerCost}`}⚡
                      </span>
                    )}
                    <span style={{ color: '#888' }}>{def.buildTime}s</span>
                  </div>
                  {!available && (
                    <div style={{ color: '#ff6644', fontSize: 9, marginTop: 2 }}>
                      Requires:{' '}
                      {def.requires
                        .filter((r) => !ownedKeys.includes(r))
                        .map((r) => BUILDING_DEFS[r]?.name ?? r)
                        .join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
      <div style={{ color: '#555', fontSize: 9, marginTop: 4 }}>Click building → click grid to place. ESC to cancel.</div>
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
  const ghostRef = useRef<BuildGhost | null>(null);

  const [buildMenuOpen, setBuildMenuOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  // Force re-render periodically for build menu availability updates
  const [, setTick] = useState(0);

  const handleSelectBuilding = useCallback((key: string) => {
    setSelectedBuilding((prev) => (prev === key ? null : key));
  }, []);

  const handleCancelBuild = useCallback(() => {
    setSelectedBuilding(null);
    ghostRef.current = null;
  }, []);

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
      // Building placement: left click while a building is selected
      if (e.button === 0 && ghostRef.current && ghostRef.current.valid) {
        const key = ghostRef.current.key;
        const col = ghostRef.current.gridCol;
        const row = ghostRef.current.gridRow;
        const result = placeBuilding(state, key, col, row, 0);
        if (result) {
          // Don't clear selection — allow placing multiple of the same building
          // Just clear the ghost; it'll recompute on next mousemove
          return;
        }
      }
      // Right click cancels placement
      if (e.button === 2 && ghostRef.current) {
        ghostRef.current = null;
        setSelectedBuilding(null);
        return;
      }
      handleMouseDown(e, ctrlRef.current, state, cameraRef.current!, canvas.width, canvas.height);
    };
    const onMM = (e: MouseEvent) => {
      handleMouseMove(e, ctrlRef.current);
      // Update ghost position
      if (selectedBuildingRef.current && cameraRef.current) {
        const rect = canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const world = screenToWorld(sx, sy, cameraRef.current, canvas.width, canvas.height);
        const col = Math.floor(world.x / state.tileSize);
        const row = Math.floor(world.y / state.tileSize);
        const check = canPlaceBuilding(state, selectedBuildingRef.current, col, row);
        ghostRef.current = { key: selectedBuildingRef.current, gridCol: col, gridRow: row, valid: check.ok };
      } else {
        ghostRef.current = null;
      }
    };
    const onMU = (e: MouseEvent) => {
      // Don't pass to normal controls if we just placed a building
      if (e.button === 0 && selectedBuildingRef.current) return;
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
      // B toggles build menu
      if (e.key.toLowerCase() === 'b') {
        setBuildMenuOpen((prev) => !prev);
        return;
      }
      // Escape cancels placement or closes menu
      if (e.key === 'Escape') {
        if (selectedBuildingRef.current) {
          setSelectedBuilding(null);
          ghostRef.current = null;
        } else {
          setBuildMenuOpen(false);
        }
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
    let tickCounter = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (stateRef.current && cameraRef.current) {
        updateCamera(cameraRef.current, ctrlRef.current, stateRef.current, canvas.width, canvas.height, dt);
        tickGroundRTS(stateRef.current, dt);
        renderGroundRTS(
          ctx,
          stateRef.current,
          cameraRef.current,
          canvas.width,
          canvas.height,
          ctrlRef.current.selectionBox,
          ghostRef.current,
        );
      }

      // Periodically trigger React re-render for build menu updates (~4 fps)
      tickCounter++;
      if (tickCounter % 15 === 0) setTick((t) => t + 1);

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

  // Keep a ref to selectedBuilding so event handlers can read it
  const selectedBuildingRef = useRef<string | null>(null);
  selectedBuildingRef.current = selectedBuilding;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', background: '#111', cursor: selectedBuilding ? 'crosshair' : 'default' }}
        tabIndex={0}
      />

      {/* Build menu toggle button */}
      {!buildMenuOpen && (
        <div
          onClick={() => setBuildMenuOpen(true)}
          style={{
            position: 'absolute',
            left: 8,
            top: 70,
            background: 'rgba(0,0,0,0.8)',
            border: '1px solid #ffcc44',
            borderRadius: 6,
            padding: '6px 14px',
            cursor: 'pointer',
            color: '#ffcc44',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fontSize: 12,
            zIndex: 20,
            userSelect: 'none',
          }}
        >
          BUILD (B)
        </div>
      )}

      {/* Build menu panel */}
      {buildMenuOpen && stateRef.current && (
        <BuildMenuPanel
          state={stateRef.current}
          selectedKey={selectedBuilding}
          onSelect={handleSelectBuilding}
          onClose={() => {
            setBuildMenuOpen(false);
            handleCancelBuild();
          }}
        />
      )}

      {/* Placement status bar */}
      {selectedBuilding && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            border: '1px solid #4488ff',
            borderRadius: 6,
            padding: '6px 18px',
            fontFamily: 'monospace',
            color: '#fff',
            fontSize: 12,
            zIndex: 20,
            userSelect: 'none',
          }}
        >
          Placing: <span style={{ color: '#4488ff', fontWeight: 'bold' }}>{BUILDING_DEFS[selectedBuilding]?.name}</span>
          {' — '}
          <span style={{ color: '#888' }}>Click to place · Right-click or ESC to cancel</span>
        </div>
      )}
    </div>
  );
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
