/**
 * GroundCombatView.tsx — React wrapper that mounts the Three.js ground combat
 * renderer into a container div and overlays the HUD. Handles lifecycle.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { GroundRenderer } from './ground-renderer';
import { GroundHUD } from './ground-hud';
import type { PlanetType } from './space-types';
import { type CharacterClass } from './ground-combat';
import { SoulsLobby } from './souls-lobby';
import type { WarlordsCharacter } from './warlords-characters';

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

  if (!characterClass) {
    return (
      <SoulsLobby
        planetName={planetName}
        onEnter={(cls, _char: WarlordsCharacter) => setCharacterClass(cls)}
        onCancel={() => onExit('retreat')}
      />
    );
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
