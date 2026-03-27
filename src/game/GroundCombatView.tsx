/**
 * GroundCombatView.tsx — React wrapper that mounts the Three.js ground combat
 * renderer into a container div and overlays the HUD. Handles lifecycle.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { GroundRenderer } from './ground-renderer';
import { GroundHUD } from './ground-hud';
import type { PlanetType } from './space-types';
import { type CharacterClass, CLASS_STATS } from './ground-combat';

interface GroundCombatViewProps {
  planetType: PlanetType;
  planetName: string;
  onExit: (result: 'win' | 'lose' | 'retreat') => void;
}

export function GroundCombatView({ planetType, planetName, onExit }: GroundCombatViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<GroundRenderer | null>(null);
  const [characterClass, setCharacterClass] = useState<CharacterClass | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Capture the latest onExit in a ref to avoid re-mounting the renderer on every render
  const onExitRef = useRef(onExit);
  useEffect(() => {
    onExitRef.current = onExit;
  }, [onExit]);

  useEffect(() => {
    if (!containerRef.current || !characterClass) return;
    setLoading(true);
    const r = new GroundRenderer(containerRef.current, planetType, characterClass);
    rendererRef.current = r;

    r.onResult = (result) => {
      setTimeout(() => onExitRef.current(result), 3000);
    };

    r.init()
      .then(() => {
        setLoading(false);
        setReady(true);
      })
      .catch((err) => {
        console.error('[GROUND] Init failed:', err);
        setLoading(false);
        onExitRef.current('retreat');
      });

    return () => {
      r.dispose();
      rendererRef.current = null;
    };
  }, [planetType, characterClass]);

  // Hooks must be declared unconditionally — before any early return
  const getState = useCallback(() => {
    return (
      rendererRef.current?.state ?? {
        player: {
          pos: { x: 0, y: 0, z: 0 },
          facing: 0,
          hp: 100,
          maxHp: 100,
          stamina: 100,
          maxStamina: 100,
          staminaRegenTimer: 0,
          combatState: 'idle' as const,
          stateTimer: 0,
          dodgeDir: { x: 0, y: 0, z: 0 },
          iframes: false,
          lockOnTargetId: null,
          animKey: 'idle',
          weaponType: 'sword' as const,
          dead: false,
          characterClass: characterClass ?? 'warrior',
          comboCount: 0,
          comboTimer: 0,
          burstCount: 0,
        },
        enemies: [],
        damageNumbers: [],
        planetType,
        missionActive: false,
        missionObjective: '',
        missionProgress: 0,
        missionGoal: 0,
        wave: 0,
        maxWaves: 4,
        waveCleared: false,
        waveClearTimer: 0,
        gameTime: 0,
        paused: false,
        result: 'none' as const,
      }
    );
  }, [planetType, characterClass]);

  const handleQuit = useCallback(() => {
    rendererRef.current?.dispose();
    onExit('retreat');
  }, [onExit]);

  // If no class selected yet, show the character select screen
  if (!characterClass) {
    return <CharacterSelectScreen planetName={planetName} onSelect={setCharacterClass} onCancel={() => onExit('retreat')} />;
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 150, background: '#000' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.95)',
            fontFamily: "'Segoe UI', monospace",
            color: '#cde',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#4488ff', letterSpacing: 3, marginBottom: 12 }}>DEPLOYING TO SURFACE</div>
            <div style={{ fontSize: 12, color: 'rgba(160,200,255,0.5)' }}>{planetName} · Loading terrain and hostiles...</div>
            <div style={{ marginTop: 16, fontSize: 24, animation: 'ground-spin 1s linear infinite' }}>⚔️</div>
            <style>{`@keyframes ground-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      )}

      {ready && <GroundHUD getState={getState} onQuit={handleQuit} />}
    </div>
  );
}

// ── Character Selection Screen ────────────────────────────────────
const CLASSES: CharacterClass[] = ['warrior', 'berserker', 'ranger', 'mage', 'rogue', 'gunslinger'];

function CharacterSelectScreen({
  planetName,
  onSelect,
  onCancel,
}: {
  planetName: string;
  onSelect: (c: CharacterClass) => void;
  onCancel: () => void;
}) {
  const [hovered, setHovered] = useState<CharacterClass | null>(null);
  const preview = hovered ? CLASS_STATS[hovered] : null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 150,
        background: 'radial-gradient(ellipse at center, #0a0a1a 0%, #000 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', monospace",
        color: '#e0d8c0',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,200,100,0.4)', letterSpacing: 4, marginBottom: 6 }}>
          GROUND OPS · {planetName.toUpperCase()}
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 4, color: '#ffcc44', textShadow: '0 0 20px rgba(255,180,0,0.4)' }}>
          CHOOSE YOUR CLASS
        </div>
      </div>

      {/* Class grid */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 820 }}>
        {CLASSES.map((cls) => {
          const s = CLASS_STATS[cls];
          const isHov = hovered === cls;
          return (
            <div
              key={cls}
              onMouseEnter={() => setHovered(cls)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(cls)}
              style={{
                width: 130,
                padding: '14px 12px',
                borderRadius: 10,
                background: isHov ? 'rgba(255,200,100,0.12)' : 'rgba(10,12,24,0.85)',
                border: `2px solid ${isHov ? '#ffcc44' : 'rgba(255,200,100,0.15)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                boxShadow: isHov ? '0 0 24px rgba(255,200,100,0.2)' : 'none',
              }}
            >
              <div style={{ fontSize: 32 }}>{s.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: isHov ? '#ffcc44' : '#e0d8c0' }}>
                {s.displayName.toUpperCase()}
              </div>
              {/* Stat bars */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                {[
                  { label: 'HP', val: s.maxHp / 200 },
                  { label: 'STM', val: s.maxStamina / 130 },
                  { label: 'SPD', val: s.baseSpeed / 7 },
                  { label: 'ATK', val: s.attackDamage / 42 },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: 7, color: 'rgba(200,180,120,0.5)', width: 24 }}>{label}</span>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                      <div
                        style={{
                          width: `${Math.min(100, val * 100)}%`,
                          height: '100%',
                          background: isHov ? '#ffcc44' : '#4488ff',
                          borderRadius: 2,
                          transition: 'width 0.2s',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview / passive panel */}
      <div
        style={{
          marginTop: 18,
          minHeight: 68,
          textAlign: 'center',
          maxWidth: 500,
          padding: '10px 16px',
          background: 'rgba(10,8,4,0.7)',
          border: '1px solid rgba(255,200,100,0.1)',
          borderRadius: 8,
          fontSize: 11,
        }}
      >
        {preview ? (
          <>
            <div style={{ fontSize: 10, color: '#ffcc44', fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>
              PASSIVE: {preview.passive}
            </div>
            <div style={{ color: 'rgba(200,180,120,0.65)' }}>{preview.description}</div>
          </>
        ) : (
          <div style={{ color: 'rgba(200,180,120,0.3)' }}>Hover a class to see details</div>
        )}
      </div>

      {/* Controls */}
      <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 20px',
            borderRadius: 6,
            border: '1px solid rgba(255,200,100,0.2)',
            background: 'transparent',
            color: 'rgba(200,180,120,0.5)',
            cursor: 'pointer',
            fontSize: 10,
            letterSpacing: 2,
            fontFamily: 'inherit',
          }}
        >
          BACK
        </button>
      </div>
    </div>
  );
}
