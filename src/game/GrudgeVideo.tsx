/**
 * GrudgeVideo — CDN-backed cinematic player with graceful fallback.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { getIntroVideoSources } from './video-assets';

interface GrudgeVideoProps {
  /** Use built-in intro sources (mp4 + optional webm). */
  intro?: boolean;
  /** Explicit single source (overrides intro). */
  src?: string;
  type?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  poster?: string;
  opacity?: number;
  objectFit?: 'cover' | 'contain';
  onEnded?: () => void;
  onError?: () => void;
  style?: CSSProperties;
}

export function GrudgeVideo({
  intro = false,
  src,
  type = 'video/mp4',
  autoPlay = true,
  loop = false,
  muted = true,
  playsInline = true,
  poster,
  opacity = 1,
  objectFit = 'cover',
  onEnded,
  onError,
  style,
}: GrudgeVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [sources, setSources] = useState<Array<{ src: string; type: string }>>(
    src ? [{ src, type }] : [],
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!intro) return;
    let cancelled = false;
    getIntroVideoSources().then((s) => {
      if (!cancelled) setSources(s);
    });
    return () => {
      cancelled = true;
    };
  }, [intro]);

  useEffect(() => {
    if (src) setSources([{ src, type }]);
  }, [src, type]);

  const handleError = useCallback(() => {
    setFailed(true);
    onError?.();
  }, [onError]);

  if (failed || sources.length === 0) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 30% 20%, #0a1830 0%, #010308 70%)',
          opacity,
          pointerEvents: 'none',
          ...style,
        }}
      />
    );
  }

  return (
    <video
      ref={ref}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      playsInline={playsInline}
      preload="auto"
      poster={poster}
      crossOrigin="anonymous"
      onEnded={onEnded}
      onError={handleError}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit,
        opacity,
        pointerEvents: 'none',
        ...style,
      }}
    >
      {sources.map((s) => (
        <source key={s.src} src={s.src} type={s.type} />
      ))}
    </video>
  );
}
