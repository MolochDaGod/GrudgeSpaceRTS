/**
 * ground-hud.tsx — HUD overlay for ground combat mode.
 * Shows health, stamina, mission objective, combat state, lock-on indicator,
 * and the action-bar hotbar (1–4 class skills, 5 empty, 6–8 consumables).
 */

import { useState, useEffect, useRef } from 'react';
import type { GroundCombatState, CharacterClass } from './ground-combat';
import { CLASS_STATS } from './ground-combat';

// ── Hotbar slot definitions per class ──────────────────────────────────
// Slots 1–4 are class skills mapped to existing combat actions where
// possible, with class-flavoured labels. Slot 5 is intentionally empty
// per the dynamic-hotbar spec. Slots 6–8 are consumable placeholders
// that will be filled once inventory wires through.
interface HotbarSkill {
  key: string; // keyboard hint shown on the slot
  icon: string;
  name: string;
  binding: string; // mouse / key binding for the underlying action
  color: string;
}
const CLASS_SKILLS: Record<CharacterClass, [HotbarSkill, HotbarSkill, HotbarSkill, HotbarSkill]> = {
  warrior: [
    { key: '1', icon: '⚔️', name: 'Slash', binding: 'LMB', color: '#88aaff' },
    { key: '2', icon: '💥', name: 'Heavy', binding: 'Hold L', color: '#ff8844' },
    { key: '3', icon: '🛡️', name: 'Block', binding: 'RMB', color: '#44ccff' },
    { key: '4', icon: '💨', name: 'Dodge', binding: 'Space', color: '#ffcc44' },
  ],
  berserker: [
    { key: '1', icon: '🪓', name: 'Cleave', binding: 'LMB', color: '#ff6644' },
    { key: '2', icon: '🌪️', name: 'Whirl', binding: 'Hold L', color: '#ff4422' },
    { key: '3', icon: '⤵️', name: 'Slide', binding: 'Shift+S', color: '#ffaa44' },
    { key: '4', icon: '💨', name: 'Dodge', binding: 'Space', color: '#ffcc44' },
  ],
  ranger: [
    { key: '1', icon: '🏹', name: 'Shoot', binding: 'LMB', color: '#88ffaa' },
    { key: '2', icon: '🔫', name: 'Heavy Shot', binding: 'Hold L', color: '#44ff88' },
    { key: '3', icon: '🌿', name: 'Strafe', binding: 'A/D', color: '#88ddff' },
    { key: '4', icon: '💨', name: 'Roll-Shot', binding: 'Space', color: '#ffcc44' },
  ],
  mage: [
    { key: '1', icon: '✨', name: 'Bolt', binding: 'LMB', color: '#cc88ff' },
    { key: '2', icon: '💫', name: 'Blast AoE', binding: 'Hold L', color: '#ff66ff' },
    { key: '3', icon: '🔮', name: 'Ward', binding: 'RMB', color: '#66ccff' },
    { key: '4', icon: '💨', name: 'Blink', binding: 'Space', color: '#ffcc44' },
  ],
  rogue: [
    { key: '1', icon: '🗡️', name: 'Slice', binding: 'LMB', color: '#aaff88' },
    { key: '2', icon: '🎯', name: 'Backstab', binding: 'Hold L', color: '#ff4488' },
    { key: '3', icon: '🌫️', name: 'Vanish', binding: 'RMB', color: '#888888' },
    { key: '4', icon: '💨', name: 'Roll', binding: 'Space', color: '#ffcc44' },
  ],
  gunslinger: [
    { key: '1', icon: '🔫', name: 'Burst', binding: 'LMB', color: '#ffaa44' },
    { key: '2', icon: '💥', name: 'Hipfire', binding: 'Hold L', color: '#ff6622' },
    { key: '3', icon: '🚫', name: 'Suppress', binding: 'RMB', color: '#cc8844' },
    { key: '4', icon: '💨', name: 'Cover Roll', binding: 'Space', color: '#ffcc44' },
  ],
};
const CONSUMABLE_SLOTS: Array<{ key: string; icon: string; name: string; color: string }> = [
  { key: '6', icon: '🧪', name: 'HP Flask', color: '#ff4466' },
  { key: '7', icon: '⚡', name: 'Stim Pack', color: '#ffcc44' },
  { key: '8', icon: '🔮', name: 'Relic', color: '#aa88ff' },
];

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
  const cls = CLASS_STATS[p.characterClass];
  const comboLabel = p.comboCount === 3 ? 'FINISHER!' : p.comboCount === 2 ? '× 2' : p.comboCount === 1 ? '× 1' : '';
  const comboColor = p.comboCount === 3 ? '#ff8800' : p.comboCount === 2 ? '#ffcc00' : '#ffffff';
  const aliveEnemies = state.enemies.filter((e) => e.aiState !== 'dead').length;

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

      {/* ── Wave counter (top-center, below mission) ───── */}
      <div
        style={{
          position: 'absolute',
          top: state.missionActive ? 80 : 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 6,
          alignItems: 'center',
        }}
      >
        {Array.from({ length: state.maxWaves }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 28,
              height: 6,
              borderRadius: 3,
              background: i < state.wave ? '#4488ff' : i === state.wave ? '#44ccff' : 'rgba(255,255,255,0.1)',
              border: i === state.wave ? '1px solid rgba(68,200,255,0.6)' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: i === state.wave ? '0 0 8px rgba(68,200,255,0.5)' : 'none',
              transition: 'all 0.3s',
            }}
          />
        ))}
        <span style={{ fontSize: 9, color: 'rgba(160,200,255,0.5)', marginLeft: 6, letterSpacing: 1 }}>
          WAVE {state.wave + 1} / {state.maxWaves} · {aliveEnemies} REMAINING
        </span>
      </div>

      {/* ── Wave clear flash ──────────────────────────── */}
      {state.waveCleared && state.wave < state.maxWaves - 1 && (
        <div
          style={{
            position: 'absolute',
            top: '38%',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              letterSpacing: 5,
              color: '#44ffcc',
              textShadow: '0 0 30px rgba(68,255,200,0.7)',
            }}
          >
            WAVE {state.wave} CLEARED
          </div>
          <div style={{ fontSize: 11, color: 'rgba(160,255,220,0.6)', marginTop: 6, letterSpacing: 2 }}>NEXT WAVE INCOMING…</div>
        </div>
      )}

      {/* ── Combo counter (center-bottom) ────────────── */}
      {p.comboCount > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 100,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontSize: p.comboCount === 3 ? 32 : 22,
              fontWeight: 900,
              letterSpacing: 3,
              color: comboColor,
              textShadow: `0 0 20px ${comboColor}88`,
              transition: 'font-size 0.1s',
            }}
          >
            {comboLabel}
          </div>
          <div
            style={{
              fontSize: 9,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: 2,
              marginTop: 2,
            }}
          >
            COMBO
          </div>
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

        {/* Class passive hint */}
        <div
          style={{
            marginBottom: 8,
            padding: '4px 10px',
            borderRadius: 4,
            background: 'rgba(4,10,22,0.6)',
            border: '1px solid rgba(68,136,255,0.15)',
          }}
        >
          <span style={{ fontSize: 9, color: '#4488ff', fontWeight: 700, letterSpacing: 1 }}>
            {cls.icon} {cls.displayName.toUpperCase()} ·{' '}
          </span>
          <span style={{ fontSize: 9, color: 'rgba(160,200,255,0.55)' }}> {cls.passive} </span>
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
            color: 'rgba(160,200,255,0.45)',
            lineHeight: 1.7,
            minWidth: 160,
          }}
        >
          <div style={{ color: 'rgba(160,200,255,0.7)', fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>CONTROLS</div>
          WASD Move · Shift Sprint
          <br />
          A/D Turn · Q/E Strafe
          <br />
          LMB Cam Rotate (hold)
          <br />
          Tab Target · Esc Retreat
        </div>
      </div>

      {/* ── Bottom-center: Hotbar (1–4 skills, 5 empty, 6–8 consumables) ── */}
      <Hotbar characterClass={p.characterClass} />

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
      {/* (defined below the result overlay so the crosshair stays under it) */}
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

// ── Hotbar component ─────────────────────────────────────────────────
function Hotbar({ characterClass }: { characterClass: CharacterClass }) {
  const skills = CLASS_SKILLS[characterClass];
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 18,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 6,
        padding: '8px 12px',
        borderRadius: 10,
        background: 'rgba(4,10,22,0.78)',
        border: '1px solid rgba(80,120,160,0.35)',
        boxShadow: '0 6px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        pointerEvents: 'none',
      }}
    >
      {/* Slots 1–4 — class skills */}
      {skills.map((s) => (
        <HotbarSlot key={s.key} slotKey={s.key} icon={s.icon} name={s.name} binding={s.binding} accent={s.color} />
      ))}

      {/* Slot 5 — intentionally empty divider */}
      <HotbarSlot slotKey="5" icon="" name="" binding="" accent="rgba(255,255,255,0.08)" empty />

      {/* Slots 6–8 — consumables */}
      {CONSUMABLE_SLOTS.map((c) => (
        <HotbarSlot key={c.key} slotKey={c.key} icon={c.icon} name={c.name} binding="" accent={c.color} consumable />
      ))}
    </div>
  );
}

function HotbarSlot({
  slotKey,
  icon,
  name,
  binding,
  accent,
  empty = false,
  consumable = false,
}: {
  slotKey: string;
  icon: string;
  name: string;
  binding: string;
  accent: string;
  empty?: boolean;
  consumable?: boolean;
}) {
  return (
    <div
      style={{
        position: 'relative',
        width: 50,
        height: 50,
        borderRadius: 6,
        background: empty ? 'rgba(255,255,255,0.02)' : 'linear-gradient(180deg, rgba(20,28,42,0.95), rgba(8,14,24,0.95))',
        border: `1px solid ${empty ? 'rgba(255,255,255,0.06)' : accent + '66'}`,
        boxShadow: empty ? 'none' : `inset 0 0 12px ${accent}22`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Slot key indicator (top-left) */}
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: 4,
          fontSize: 9,
          fontWeight: 800,
          color: empty ? 'rgba(255,255,255,0.2)' : accent,
          letterSpacing: 0.5,
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
        }}
      >
        {slotKey}
      </div>

      {/* Icon */}
      {!empty && (
        <div
          style={{
            fontSize: 22,
            filter: consumable ? 'saturate(0.7) brightness(0.85)' : 'none',
            opacity: consumable ? 0.6 : 1,
          }}
        >
          {icon}
        </div>
      )}

      {/* Skill name (bottom strip) */}
      {!empty && name && (
        <div
          style={{
            position: 'absolute',
            bottom: 1,
            left: 0,
            right: 0,
            fontSize: 7,
            fontWeight: 700,
            letterSpacing: 0.5,
            textAlign: 'center',
            color: accent,
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            padding: '0 2px',
          }}
        >
          {name}
        </div>
      )}

      {/* Mouse/key binding badge (top-right, only on skill slots) */}
      {!empty && binding && (
        <div
          style={{
            position: 'absolute',
            top: 1,
            right: 2,
            fontSize: 6,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: 0.5,
          }}
        >
          {binding}
        </div>
      )}

      {/* Empty consumable: dashed inner border */}
      {consumable && (
        <div
          style={{
            position: 'absolute',
            inset: 4,
            borderRadius: 3,
            border: `1px dashed ${accent}33`,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
