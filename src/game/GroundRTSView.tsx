/**
 * GroundRTSView.tsx — Hero Commander RTS (play.grudge-studio.com) with D1/R2 heroes.
 */

import { useEffect, useState } from 'react';
import {
  fetchWarlordsCharacters,
  raceLabel,
  type WarlordsCharacter,
} from './warlords-characters';

const HERO_RTS_BASE = import.meta.env.VITE_HERO_RTS_URL ?? 'https://play.grudge-studio.com';

interface Props {
  onExit?: () => void;
}

export default function GroundRTSView({ onExit }: Props) {
  const [characters, setCharacters] = useState<WarlordsCharacter[]>([]);
  const [selected, setSelected] = useState<WarlordsCharacter | null>(null);
  const [launched, setLaunched] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !launched) onExit?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit, launched]);

  useEffect(() => {
    fetchWarlordsCharacters().then((rows) => {
      setCharacters(rows);
      setSelected(rows.find((c) => c.isActive) ?? rows[0] ?? null);
      setLoading(false);
    });
  }, []);

  const iframeSrc = selected
    ? `${HERO_RTS_BASE}/?play=1&char=${encodeURIComponent(selected.characterId)}&race=${encodeURIComponent(selected.race)}`
    : `${HERO_RTS_BASE}/?play=1`;

  if (!launched) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: 'radial-gradient(ellipse at center, #0a1220 0%, #020408 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Segoe UI', monospace",
          color: '#cde',
        }}
      >
        <div style={{ width: 520, maxWidth: '94vw', padding: 28, borderRadius: 12, background: 'rgba(6,14,24,0.95)', border: '1px solid rgba(136,204,170,0.25)' }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: '#6a9', marginBottom: 8 }}>TACTICAL RTS · HERO COMMANDER</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#88ccaa', marginBottom: 16 }}>Select Active Hero</div>
          <div style={{ fontSize: 11, color: '#567', lineHeight: 1.6, marginBottom: 20 }}>
            Loads your Warlords character from D1 and grudge6 models from R2 CDN into Hero RTS at play.grudge-studio.com.
          </div>
          {loading ? (
            <div style={{ fontSize: 11, color: '#6af' }}>Fetching characters…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, maxHeight: 220, overflowY: 'auto' }}>
              {characters.map((c) => {
                const sel = selected?.characterId === c.characterId;
                return (
                  <button
                    key={c.characterId}
                    type="button"
                    onClick={() => setSelected(c)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: sel ? '1px solid #88ccaa' : '1px solid rgba(255,255,255,0.06)',
                      background: sel ? 'rgba(136,204,170,0.12)' : 'rgba(0,0,0,0.2)',
                      color: sel ? '#aee' : '#9ab',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{c.name}</div>
                    <div style={{ fontSize: 9, marginTop: 4, color: '#678' }}>
                      {raceLabel(c.race)} · {c.heroClass}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => onExit?.()} style={rtsBtn('transparent')}>
              BACK
            </button>
            <button type="button" disabled={!selected} onClick={() => setLaunched(true)} style={{ ...rtsBtn('#335566'), flex: 1 }}>
              LAUNCH HERO RTS
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0f', zIndex: 100 }}>
      <iframe
        src={iframeSrc}
        title="Hero Commander RTS"
        allow="autoplay; fullscreen; gamepad; clipboard-read; clipboard-write"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
      <button
        type="button"
        onClick={() => onExit?.()}
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          padding: '8px 16px',
          background: 'rgba(0,0,0,0.78)',
          color: '#88ccaa',
          border: '1px solid rgba(136,204,170,0.55)',
          borderRadius: 6,
          fontFamily: "'Segoe UI', monospace",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1.5,
          cursor: 'pointer',
          zIndex: 101,
          textTransform: 'uppercase',
        }}
      >
        ← ARMADA
      </button>
    </div>
  );
}

function rtsBtn(bg: string): React.CSSProperties {
  return {
    padding: '10px 18px',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: bg === 'transparent' ? '#6a8a9a' : '#fff',
    background: bg === 'transparent' ? 'transparent' : `${bg}cc`,
    border: `1px solid ${bg === 'transparent' ? 'rgba(255,255,255,0.1)' : '#88ccaa66'}`,
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
}