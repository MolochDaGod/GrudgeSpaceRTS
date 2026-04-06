/**
 * ground-hud.tsx — HUD overlay for ground combat mode.
 * Shows health, stamina, mission objective, combat state, lock-on indicator.
 */

import { useState, useEffect, useRef } from 'react';
import type { GroundCombatState } from './ground-combat';
import { CLASS_STATS } from './ground-combat';

interface GroundHudProps {
  getState: () => GroundCombatState;
  onQuit: () => void;
}

export function GroundHUD({ getState, onQuit }: GroundHudProps) {
  const [tick, setTick] = useState(0);
  const rafRef = useRef(0);

  // Poll state at 20fps for HUD updates (cheaper than syncing React to 60fps)
  useEffect(() => {
    let mounted = true;
    const poll = () => {
      if (!mounted) return;
      setTick((t) => t + 1);
      rafRef.current = requestAnimationFrame(() => {
        setTimeout(poll, 50);
      });
    };
    poll();
    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const state = getState();
  const p = state.player;
  const hpPct = Math.max(0, p.hp / p.maxHp) * 100;
  const stamPct = Math.max(0, p.stamina / p.maxStamina) * 100;
  const lockTarget = p.lockOnTargetId !== null ? state.enemies.find((e) => e.id === p.lockOnTargetId) : null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
        fontFamily: "'Segoe UI', monospace",
        color: '#cde',
      }}
    >
      {/* ── Top: Mission objective ────────────────────── */}
      {state.missionActive && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 24px',
            borderRadius: 6,
            background: 'rgba(4,10,22,0.85)',
            border: '1px solid rgba(68,136,255,0.3)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 9, color: 'rgba(160,200,255,0.5)', letterSpacing: 2, marginBottom: 4 }}>MISSION</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#4488ff' }}>{state.missionObjective}</div>
          {state.missionGoal > 0 && (
            <div style={{ fontSize: 10, color: 'rgba(160,200,255,0.5)', marginTop: 4 }}>
              {state.missionProgress} / {state.missionGoal}
            </div>
          )}
        </div>
      )}

      {/* ── Bottom-left: Player HP + Stamina ─────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 24,
          width: 260,
          pointerEvents: 'auto',
        }}
      >
        {/* HP */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 2 }}>
            <span style={{ color: '#44ee44', fontWeight: 700 }}>♥ HEALTH</span>
            <span style={{ color: 'rgba(160,200,255,0.5)' }}>
              {p.hp} / {p.maxHp}
            </span>
          </div>
          <div
            style={{
              height: 14,
              borderRadius: 3,
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(68,238,68,0.3)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${hpPct}%`,
                height: '100%',
                borderRadius: 2,
                background: hpPct > 25 ? 'linear-gradient(90deg, #228822, #44ee44)' : 'linear-gradient(90deg, #882222, #ff4444)',
                transition: 'width 0.15s',
                boxShadow: hpPct > 25 ? '0 0 8px rgba(68,238,68,0.4)' : '0 0 8px rgba(255,68,68,0.5)',
              }}
            />
          </div>
        </div>

        {/* Stamina */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 2 }}>
            <span style={{ color: '#ffcc00', fontWeight: 700 }}>⚡ STAMINA</span>
            <span style={{ color: 'rgba(160,200,255,0.5)' }}>{Math.round(p.stamina)}</span>
          </div>
          <div
            style={{
              height: 10,
              borderRadius: 3,
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,204,0,0.3)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${stamPct}%`,
                height: '100%',
                borderRadius: 2,
                background: 'linear-gradient(90deg, #886600, #ffcc00)',
                transition: 'width 0.1s',
                boxShadow: '0 0 6px rgba(255,204,0,0.3)',
              }}
            />
          </div>
        </div>

        {/* Combat state badge */}
        {p.combatState !== 'idle' && (
          <div
            style={{
              display: 'inline-block',
              padding: '3px 10px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              background:
                p.combatState === 'blocking'
                  ? 'rgba(68,136,255,0.25)'
                  : p.combatState === 'dodging'
                    ? 'rgba(255,204,0,0.25)'
                    : p.combatState === 'hit'
                      ? 'rgba(255,68,68,0.25)'
                      : 'rgba(255,136,0,0.25)',
              border: `1px solid ${
                p.combatState === 'blocking'
                  ? 'rgba(68,136,255,0.5)'
                  : p.combatState === 'dodging'
                    ? 'rgba(255,204,0,0.5)'
                    : p.combatState === 'hit'
                      ? 'rgba(255,68,68,0.5)'
                      : 'rgba(255,136,0,0.5)'
              }`,
              color:
                p.combatState === 'blocking'
                  ? '#4488ff'
                  : p.combatState === 'dodging'
                    ? '#ffcc00'
                    : p.combatState === 'hit'
                      ? '#ff4444'
                      : '#ff8800',
              textTransform: 'uppercase',
            }}
          >
            {p.combatState.replace('_', ' ')}
          </div>
        )}
      </div>

      {/* ── Bottom-right: Lock-on target info ────────── */}
      {lockTarget && lockTarget.aiState !== 'dead' && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            width: 200,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(4,10,22,0.85)',
            border: '1px solid rgba(255,68,68,0.3)',
          }}
        >
          <div style={{ fontSize: 9, color: '#ff4444', fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>
            TARGET · {lockTarget.enemyType.toUpperCase()}
          </div>
          <div
            style={{
              height: 10,
              borderRadius: 3,
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,68,68,0.3)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(0, lockTarget.hp / lockTarget.maxHp) * 100}%`,
                height: '100%',
                borderRadius: 2,
                background: 'linear-gradient(90deg, #882222, #ff4444)',
                transition: 'width 0.15s',
              }}
            />
          </div>
          <div style={{ fontSize: 9, color: 'rgba(160,200,255,0.4)', marginTop: 4 }}>
            {lockTarget.hp} / {lockTarget.maxHp}
          </div>
        </div>
      )}

      {/* ── Top-right: Controls hint + quit ───────────── */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          pointerEvents: 'auto',
        }}
      >
        <button
          onClick={onQuit}
          style={{
            padding: '6px 16px',
            fontSize: 10,
            fontWeight: 700,
            background: 'rgba(255,68,68,0.15)',
            border: '1px solid rgba(255,68,68,0.4)',
            borderRadius: 4,
            color: '#ff4444',
            cursor: 'pointer',
            letterSpacing: 1,
            marginBottom: 8,
            display: 'block',
          }}
        >
          ESC · RETREAT
        </button>
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            background: 'rgba(4,10,22,0.7)',
            border: '1px solid rgba(40,60,80,0.3)',
            fontSize: 9,
            color: 'rgba(160,200,255,0.4)',
            lineHeight: 1.8,
          }}
        >
          WASD Move · Shift Sprint
          <br />
          LMB Attack · Hold Heavy
          <br />
          RMB Block/Parry
          <br />
          Space Dodge · Tab Lock-on
        </div>
      </div>

      {/* ── Center: Result overlay ────────────────────── */}
      {state.result !== 'none' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 48,
                fontWeight: 900,
                letterSpacing: 6,
                color: state.result === 'win' ? '#44ee44' : '#ff4444',
                textShadow: `0 0 40px ${state.result === 'win' ? 'rgba(68,238,68,0.5)' : 'rgba(255,68,68,0.5)'}`,
                marginBottom: 20,
              }}
            >
              {state.result === 'win' ? 'MISSION COMPLETE' : 'FALLEN IN BATTLE'}
            </div>
            <button
              onClick={onQuit}
              style={{
                padding: '12px 40px',
                fontSize: 14,
                fontWeight: 700,
                background: 'rgba(68,136,255,0.2)',
                border: '2px solid rgba(68,136,255,0.5)',
                borderRadius: 8,
                color: '#4488ff',
                cursor: 'pointer',
                letterSpacing: 2,
              }}
            >
              RETURN TO ORBIT
            </button>
          </div>
        </div>
      )}

      {/* ── Center crosshair (when pointer locked) ───── */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 24,
          height: 24,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(255,255,255,0.35)',
            transform: 'translateY(-50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 1,
            background: 'rgba(255,255,255,0.35)',
            transform: 'translateX(-50%)',
          }}
        />
      </div>
    </div>
  );
}
