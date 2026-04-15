/**
 * loading-screen.tsx — Full-screen loading overlay with game-art progress bar.
 *
 * Shows during scene transitions (space, ground, codex model loads).
 * Uses: bar-progress (sliced), title-chevron, gem-indicator, skill icons,
 *       element decor, and LandingScreen_Background from the HUD pack.
 */
import { useState, useEffect, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SciFiBar, TitleChevron, GemIndicator, ElementDecor, SkillIcon, SectionDivider, TagLabel, SpaceIcon } from './scifi-ui-kit';

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

/** Pick a random tip icon — maps to skill-icons-1 pack (1-20) */
const TIP_ICON_IDS = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

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
  const tipIconId = useMemo(() => TIP_ICON_IDS[Math.floor(Math.random() * TIP_ICON_IDS.length)], []);
  const [dots, setDots] = useState('');
  const [gemPulse, setGemPulse] = useState(false);

  // Animate dots for indeterminate state
  useEffect(() => {
    const iv = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 400);
    return () => clearInterval(iv);
  }, []);

  // Pulse the gem indicator
  useEffect(() => {
    const iv = setInterval(() => setGemPulse((p) => !p), 800);
    return () => clearInterval(iv);
  }, []);

  const pct = progress != null ? Math.round(progress * 100) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 250,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', monospace",
        color: '#cde',
      }}
    >
      {/* Background art — LandingScreen from HUD pack */}
      <img
        src="/assets/space/ui/hud/LandingScreen_Background.png"
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.35,
          pointerEvents: 'none',
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      {/* Dark gradient overlay for readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(6,14,30,0.6) 0%, rgba(1,3,8,0.92) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top decorative element */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <ElementDecor variant={1} width={180} style={{ opacity: 0.4, marginBottom: 8 }} />

        {/* Title with chevron */}
        <TitleChevron color="green">
          {label ?? 'LOADING'}
          {pct == null ? dots : ''}
        </TitleChevron>

        {/* Gem indicators flanking the loading state */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
          <GemIndicator type="diamond" color="green" size={14} glow={gemPulse} />
          <GemIndicator type="indicator" color="green" size={18} glow />
          <GemIndicator type="diamond" color="green" size={14} glow={!gemPulse} />
        </div>

        {/* Progress bar — using sliced bar-progress asset */}
        <div style={{ width: 380, maxWidth: '85vw', marginBottom: 8 }}>
          {pct != null ? (
            <SciFiBar value={pct} max={100} color="green" variant="progress" height={24} label={`${pct}%`} />
          ) : (
            <SciFiBar value={35} max={100} color="green" variant="angled" height={24} />
          )}
        </div>

        {/* Stats line with tag labels */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          {loaded != null && total != null && (
            <TagLabel color="green">
              {loaded}/{total} assets
            </TagLabel>
          )}
        </div>

        {/* Section divider */}
        <div style={{ width: 300, maxWidth: '80vw' }}>
          <SectionDivider color="green" />
        </div>

        {/* Tip with skill icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            maxWidth: 440,
            padding: '0 16px',
          }}
        >
          <SkillIcon pack={1} id={tipIconId} size={36} style={{ flexShrink: 0, borderRadius: 6, opacity: 0.7 }} />
          <div
            style={{
              fontSize: 11,
              color: 'rgba(160,200,255,0.5)',
              lineHeight: 1.6,
              fontStyle: 'italic',
            }}
          >
            {tip}
          </div>
        </div>

        {/* Bottom decorative element */}
        <ElementDecor variant={2} width={140} style={{ opacity: 0.3, marginTop: 20 }} />

        {/* Bottom space icons row — ambient decoration */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, opacity: 0.15 }}>
          <SpaceIcon id={3} size={24} />
          <SpaceIcon id={7} size={24} />
          <SpaceIcon id={12} size={24} />
          <SpaceIcon id={15} size={24} />
          <SpaceIcon id={18} size={24} />
        </div>
      </div>

      <style>{`
        @keyframes loading-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </motion.div>
  );
});
