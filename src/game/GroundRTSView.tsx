/**
 * GroundRTSView.tsx — Hero-Commander RTS embed.
 *
 * /ground-rts mounts the existing Hero-Commander island gameplay deployed
 * at grudgewarlords.com/island (built in the GrudgeBuilder repo, live on
 * Cloudflare Pages / Vercel). That page already implements:
 *   • HeroCommandBar (RTS-style hero portrait dock)
 *   • Autonomous hero AI (harvesting / fighting / sleeping)
 *   • Profession progression + auto-harvest mode
 *   • Island building placement, stamina, sheep/animals
 *   • 2D + 3D island renderer toggle
 *
 * No need to re-implement any of that here — we just iframe it full-screen
 * with a "Back to Menu" button, so the real, finished game is what /ground-rts
 * shows. Replacement of the previous 2D MicroWars canvas (kept as
 * GroundRTSView.microwars-legacy.tsx for reference).
 */

import { useEffect } from 'react';

const HERO_COMMANDER_URL = 'https://grudgewarlords.com/island';

interface Props {
  onExit?: () => void;
}

export default function GroundRTSView({ onExit }: Props) {
  // Allow the host App to navigate back via Esc — the iframe captures keys
  // once focused, so we listen on the parent window before focus moves in.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a0f',
        zIndex: 100,
      }}
    >
      <iframe
        src={HERO_COMMANDER_URL}
        title="Hero-Commander Island"
        // The island game uses Phaser/Canvas/WebGL + audio; sandbox flags
        // grant the runtime everything it needs while keeping us isolated.
        allow="autoplay; fullscreen; gamepad; clipboard-read; clipboard-write"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
      />

      {/* Floating exit chip — survives over the embedded canvas */}
      <button
        onClick={() => onExit?.()}
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          padding: '8px 16px',
          background: 'rgba(0,0,0,0.78)',
          color: '#ffcc44',
          border: '1px solid rgba(255,204,68,0.55)',
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
        ← Back to Menu
      </button>
    </div>
  );
}
