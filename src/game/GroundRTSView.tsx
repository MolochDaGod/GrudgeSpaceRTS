/**
 * GroundRTSView.tsx — Hero Ground RTS launcher.
 *
 * /ground-rts offers two embeds:
 *   • Warlord Genesis — full MOBA/RTS (warlord-genesis.vercel.app/play)
 *   • Hero Commander — D1 roster + R2 models (play.grudge-studio.com)
 */

import { useEffect, useState } from 'react';
import {
  fetchWarlordsCharacters,
  raceLabel,
  type WarlordsCharacter,
} from './warlords-characters';

type RtsMode = 'warlord' | 'commander';

const WARLORD_GENESIS_URL =
  import.meta.env.VITE_WARLORD_GENESIS_URL ?? 'https://warlord-genesis.vercel.app/play';

const HERO_COMMANDER_BASE =
  import.meta.env.VITE_HERO_RTS_URL ?? 'https://play.grudge-studio.com';

interface Props {
  onExit?: () => void;
}

export default function GroundRTSView({ onExit }: Props) {
  const [mode, setMode] = useState<RtsMode>('warlord');
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

  const iframeSrc =
    mode === 'warlord'
      ? WARLORD_GENESIS_URL
      : selected
        ? `${HERO_COMMANDER_BASE}/?play=1&char=${encodeURIComponent(selected.characterId)}&race=${encodeURIComponent(selected.race)}`
        : `${HERO_COMMANDER_BASE}/?play=1`;

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
        <div
          style={{
            width: 520,
            maxWidth: '94vw',
            padding: 28,
            borderRadius: 12,
            background: 'rgba(6,14,24,0.95)',
            border: '1px solid rgba(136,204,170,0.25)',
          }}
        >
          <div style={{ fontSize: 10, letterSpacing: 4, color: '#6a9', marginBottom: 8 }}>
            TACTICAL RTS · GROUND COMMAND
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#88ccaa', marginBottom: 16 }}>
            Choose Battle Mode
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => setMode('warlord')}
              style={modeBtn(mode === 'warlord')}
            >
              ⚔️ Warlord Genesis
            </button>
            <button
              type="button"
              onClick={() => setMode('commander')}
              style={modeBtn(mode === 'commander')}
            >
              🗺️ Hero Commander
            </button>
          </div>

          {mode === 'warlord' ? (
            <div style={{ fontSize: 11, color: '#567', lineHeight: 1.6, marginBottom: 20 }}>
              Lane MOBA/RTS — build turrets, command units, and siege the enemy Citadel.
              Character select and combat run inside Warlord Genesis.
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: '#567', lineHeight: 1.6, marginBottom: 12 }}>
                Loads your Warlords character from D1 and grudge6 models from the R2 CDN.
              </div>
              {loading ? (
                <div style={{ fontSize: 11, color: '#6af', marginBottom: 20 }}>Fetching characters…</div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    marginBottom: 20,
                    maxHeight: 220,
                    overflowY: 'auto',
                  }}
                >
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
            </>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => onExit?.()} style={rtsBtn('transparent')}>
              BACK
            </button>
            <button
              type="button"
              disabled={mode === 'commander' && !selected}
              onClick={() => setLaunched(true)}
              style={{ ...rtsBtn('#335566'), flex: 1 }}
            >
              {mode === 'warlord' ? 'LAUNCH WARLORD GENESIS' : 'LAUNCH HERO COMMANDER'}
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
        title={mode === 'warlord' ? 'Warlord Genesis' : 'Hero Commander RTS'}
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

function modeBtn(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: '10px 12px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    color: active ? '#0a1220' : '#9ab',
    background: active ? '#88ccaa' : 'rgba(0,0,0,0.25)',
    border: active ? '1px solid #88ccaa' : '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
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