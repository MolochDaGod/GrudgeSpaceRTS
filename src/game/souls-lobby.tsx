/**
 * SoulsLobby — Warlords Genesis-style character lobby before ground combat.
 */

import { useEffect, useState } from 'react';
import {
  fetchWarlordsCharacters,
  raceLabel,
  raceModelUrl,
  toCombatClass,
  type WarlordsCharacter,
} from './warlords-characters';
import type { CharacterClass } from './ground-combat';

interface Props {
  planetName: string;
  onEnter: (combatClass: CharacterClass, character: WarlordsCharacter) => void;
  onCancel: () => void;
}

export function SoulsLobby({ planetName, onEnter, onCancel }: Props) {
  const [characters, setCharacters] = useState<WarlordsCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WarlordsCharacter | null>(null);

  useEffect(() => {
    fetchWarlordsCharacters().then((rows) => {
      setCharacters(rows);
      const active = rows.find((c) => c.isActive) ?? rows[0] ?? null;
      setSelected(active);
      setLoading(false);
    });
  }, []);

  const preview = selected;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 160,
        background: 'radial-gradient(ellipse at 30% 20%, #0c1428 0%, #020408 55%, #000 100%)',
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 280px) 1fr minmax(200px, 260px)',
        gridTemplateRows: '1fr auto',
        gap: 0,
        fontFamily: "'Segoe UI', monospace",
        color: '#e8dcc8',
      }}
    >
      {/* Left — roster */}
      <div style={{ padding: 24, borderRight: '1px solid rgba(255,200,100,0.08)', overflowY: 'auto' }}>
        <div style={{ fontSize: 9, letterSpacing: 4, color: 'rgba(255,180,80,0.45)', marginBottom: 12 }}>
          WARLORDS GENESIS
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#ffcc44', marginBottom: 16 }}>YOUR HEROES</div>
        {loading && <div style={{ fontSize: 11, color: '#567' }}>Loading from Grudge ID…</div>}
        {characters.map((c) => {
          const sel = selected?.characterId === c.characterId;
          return (
            <button
              key={c.characterId}
              type="button"
              onClick={() => setSelected(c)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '12px 14px',
                marginBottom: 8,
                borderRadius: 8,
                border: sel ? '1px solid #ffcc44' : '1px solid rgba(255,200,100,0.12)',
                background: sel ? 'rgba(255,200,100,0.1)' : 'rgba(0,0,0,0.25)',
                cursor: 'pointer',
                color: sel ? '#ffcc44' : '#c8b8a0',
                fontFamily: 'inherit',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
              <div style={{ fontSize: 9, color: '#786', marginTop: 4, letterSpacing: 1 }}>
                {raceLabel(c.race)} · {c.heroClass.toUpperCase()}
              </div>
            </button>
          );
        })}
      </div>

      {/* Center — preview */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
      >
        <div style={{ fontSize: 10, letterSpacing: 3, color: 'rgba(255,200,100,0.35)', marginBottom: 8 }}>
          {planetName.toUpperCase()} · SOULS COMBAT
        </div>
        <div
          style={{
            width: 280,
            height: 320,
            borderRadius: 12,
            border: '1px solid rgba(255,200,100,0.15)',
            background: 'linear-gradient(180deg, rgba(12,18,32,0.9) 0%, rgba(4,6,12,0.95) 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)',
          }}
        >
          {preview ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 12, filter: 'drop-shadow(0 0 12px rgba(255,200,100,0.3))' }}>
                ⚔
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#ffcc44', letterSpacing: 2 }}>{preview.name}</div>
              <div style={{ fontSize: 10, color: '#8a7', marginTop: 8 }}>{raceLabel(preview.race)}</div>
              <div style={{ fontSize: 9, color: '#567', marginTop: 16, maxWidth: 220, textAlign: 'center', lineHeight: 1.5 }}>
                Model: grudge6 / R2 CDN
              </div>
              <div style={{ fontSize: 8, color: '#445', marginTop: 6, wordBreak: 'break-all', maxWidth: 240, textAlign: 'center' }}>
                {preview.modelPath ?? raceModelUrl(preview.race)}
              </div>
            </>
          ) : (
            <div style={{ color: '#456' }}>Select a hero</div>
          )}
        </div>
      </div>

      {/* Right — engagement info */}
      <div style={{ padding: 24, borderLeft: '1px solid rgba(255,200,100,0.08)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#44ee88', marginBottom: 12 }}>ENGAGEMENT</div>
        <div style={{ fontSize: 10, color: '#678', lineHeight: 1.7, marginBottom: 20 }}>
          Third-person souls combat
          <br />
          Combo chains · dodge · parry
          <br />
          Wave survival · 4 waves
        </div>
        {preview && (
          <div style={{ fontSize: 10, color: '#9a8', lineHeight: 1.6 }}>
            Combat class: <span style={{ color: '#ffcc44' }}>{toCombatClass(preview.heroClass, preview.race).toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          gridColumn: '1 / -1',
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          padding: '16px 24px 28px',
          borderTop: '1px solid rgba(255,200,100,0.08)',
        }}
      >
        <button type="button" onClick={onCancel} style={footBtn('transparent')}>
          BACK TO ARMADA
        </button>
        <button
          type="button"
          disabled={!preview}
          onClick={() => preview && onEnter(toCombatClass(preview.heroClass, preview.race), preview)}
          style={footBtn('#aa5500')}
        >
          ENTER COMBAT
        </button>
      </div>
    </div>
  );
}

function footBtn(bg: string): React.CSSProperties {
  return {
    padding: '12px 28px',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 2,
    color: bg === 'transparent' ? '#8a7' : '#fff',
    background: bg === 'transparent' ? 'transparent' : `linear-gradient(135deg, ${bg}, #663300)`,
    border: `1px solid ${bg === 'transparent' ? 'rgba(255,200,100,0.2)' : '#ffcc4466'}`,
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
}