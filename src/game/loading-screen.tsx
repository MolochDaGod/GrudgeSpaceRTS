/**
 * loading-screen.tsx — Full-screen loading overlay with progress bar.
 *
 * Shows during scene transitions (space, ground, codex model loads).
 * Displays progress %, asset count, and random lore/tips.
 */
import { useState, useEffect, memo } from 'react';

const TIPS: string[] = [
  'Ctrl+1-9 assigns control groups — recall with 1-9.',
  'Q/E orbit the camera around your fleet.',
  'Right-click to move or attack. A-click for attack-move.',
  'Each planet type gives a 20% discount on a matching upgrade.',
  'Commanders trained at planets buff Hero ships by up to 25%.',
  'Stations can rally built ships to any point — right-click the minimap.',
  'Patrol (P) makes ships auto-attack anything along their route.',
  'Hold (H) keeps ships stationary — they will still fire on nearby enemies.',
  'F1 selects and centers on your flagship.',
  'Fog of war hides enemy movements — use scouts to reveal.',
  'Mines are invisible to enemies until they get close.',
  'Shield regen pauses for 3s after taking damage.',
  'Campaign homeworld chunks yield unique faction resources.',
  'Berserker combo3 knocks enemies back — chain it with a dodge.',
  'Rangers can shoot while dodging for 1.5× damage.',
];

interface LoadingScreenProps {
  /** 0..1 progress. If undefined, shows indeterminate spinner. */
  progress?: number;
  /** Number of assets loaded so far. */
  loaded?: number;
  /** Total assets to load. */
  total?: number;
  /** Scene-specific label, e.g. "DEPLOYING FLEET" or "LOADING TERRAIN". */
  label?: string;
}

export const LoadingOverlay = memo(function LoadingOverlay({ progress, loaded, total, label }: LoadingScreenProps) {
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);
  const [dots, setDots] = useState('');

  // Animate dots for indeterminate state
  useEffect(() => {
    const iv = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 400);
    return () => clearInterval(iv);
  }, []);

  const pct = progress != null ? Math.round(progress * 100) : null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 250,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #060e1e 0%, #010308 100%)',
        fontFamily: "'Segoe UI', monospace",
        color: '#cde',
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: 18,
          fontWeight: 900,
          color: '#4488ff',
          letterSpacing: 4,
          marginBottom: 20,
          textShadow: '0 0 20px rgba(68,136,255,0.5)',
        }}
      >
        {label ?? 'LOADING'}
        {pct == null ? dots : ''}
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: 320,
          maxWidth: '80vw',
          height: 6,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 3,
          overflow: 'hidden',
          marginBottom: 12,
        }}
      >
        {pct != null ? (
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #4488ff, #44ddff)',
              borderRadius: 3,
              transition: 'width 0.3s ease-out',
              boxShadow: '0 0 10px rgba(68,136,255,0.6)',
            }}
          />
        ) : (
          <div
            style={{
              height: '100%',
              width: '30%',
              background: 'linear-gradient(90deg, transparent, #4488ff, transparent)',
              borderRadius: 3,
              animation: 'loading-slide 1.2s ease-in-out infinite',
            }}
          />
        )}
      </div>

      {/* Stats line */}
      <div style={{ fontSize: 11, color: 'rgba(160,200,255,0.5)', marginBottom: 24, letterSpacing: 1 }}>
        {pct != null && <span>{pct}%</span>}
        {loaded != null && total != null && (
          <span style={{ marginLeft: 12 }}>
            {loaded}/{total} assets
          </span>
        )}
      </div>

      {/* Tip */}
      <div
        style={{
          fontSize: 11,
          color: 'rgba(160,200,255,0.35)',
          maxWidth: 400,
          textAlign: 'center',
          lineHeight: 1.6,
          fontStyle: 'italic',
        }}
      >
        💡 {tip}
      </div>

      <style>{`
        @keyframes loading-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
});
