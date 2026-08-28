/**
 * GRUDA ARMADA splash. First click / pointer / any-key must leave
 * this overlay and enter the commander menu. No stuck skip lock.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { gameAudio } from './space-audio';
import { GrudgeVideo } from './GrudgeVideo';

export function IntroScreen({ onFinish }: { onFinish: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);
  const finishingRef = useRef(false);

  useEffect(() => {
    // Warm Draco after splash paints. Dynamic import keeps Three out of the splash chunk.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1));
    const id = idle(() => {
      void import('./model-loader').then((m) => m.warmupPlayPathLoaders());
    });
    return () => {
      if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(id as number);
    };
  }, []);

  const finish = useCallback(() => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    gameAudio.resume();
    setFadeOut(true);
    window.setTimeout(onFinish, 120);
  }, [onFinish]);

  useEffect(() => {
    const isModifierOnly = (e: KeyboardEvent) =>
      e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta';
    const onKey = (e: KeyboardEvent) => {
      if (isModifierOnly(e)) return;
      e.preventDefault();
      finish();
    };
    const onPointer = () => finish();
    window.addEventListener('keydown', onKey, { passive: false });
    window.addEventListener('pointerdown', onPointer, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [finish]);

  return (
    <div
      data-testid="gruda-splash"
      onPointerDown={finish}
      onClick={finish}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 150,
        background: '#000',
        cursor: 'pointer',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.12s ease-out',
        pointerEvents: 'auto',
      }}
    >
      <GrudgeVideo
        intro
        poster="/assets/space/ui/logo.webp"
        onEnded={finish}
        style={{ pointerEvents: 'none' }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.6) 100%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <img
          src="/assets/space/ui/logo.webp"
          alt="GRUDA ARMADA"
          fetchPriority="high"
          decoding="async"
          style={{
            width: 420,
            maxWidth: '88vw',
            display: 'block',
            mixBlendMode: 'screen',
            filter: 'drop-shadow(0 0 50px rgba(68,136,255,0.6)) drop-shadow(0 0 24px rgba(200,30,30,0.35))',
            animation: 'logoFadeIn 0.6s ease-out forwards',
          }}
          onError={(e) => {
            const t = e.target as HTMLImageElement;
            if (!t.src.endsWith('.svg')) t.src = '/assets/space/ui/logo.svg';
            else t.style.display = 'none';
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 32,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 12,
          letterSpacing: 3,
          color: 'rgba(160,200,255,0.5)',
          textTransform: 'uppercase',
          textShadow: '0 0 10px rgba(0,0,0,0.9)',
          pointerEvents: 'none',
        }}
      >
        CLICK OR PRESS ANY KEY TO CONTINUE
      </div>

      <style>{`
        @keyframes logoFadeIn {
          0% { opacity: 0; transform: scale(0.92); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
