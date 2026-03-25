/**
 * ── Hack Overlay HUD ─────────────────────────────────────────────────
 *
 * Renders a cyber-terminal overlay when the player's ship is actively
 * hacking an enemy. Shows monitor frame, boot sequence animation,
 * scrolling code lines, progress bar, and access granted/denied result.
 *
 * All visual assets from craftpix Cyber Intrusion GUI pack.
 */

import React, { useEffect, useState, useMemo } from 'react';
import type { ActiveHack } from './space-types';
import { HACK_DEFINITIONS, HACK_ASSETS, HACK_SPRITE_META, getMonitorAsset, getRandomCodeLine } from './space-hacking';

interface HackOverlayProps {
  /** Active hacks where hacker is on player team (team 1) */
  activeHacks: ActiveHack[];
}

/** Animated spritesheet frame index hook */
function useSpriteFrame(fps: number, totalFrames: number, active: boolean): number {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!active) {
      setFrame(0);
      return;
    }
    const iv = setInterval(() => setFrame((f) => (f + 1) % totalFrames), 1000 / fps);
    return () => clearInterval(iv);
  }, [fps, totalFrames, active]);
  return frame;
}

export function HackOverlay({ activeHacks }: HackOverlayProps) {
  // Show the most recent player hack that is still channeling or just finished
  const playerHack = useMemo(() => {
    return activeHacks.find((h) => h.team === 1 && (!h.done || h.success));
  }, [activeHacks]);

  if (!playerHack) return null;

  return <HackTerminal hack={playerHack} />;
}

function HackTerminal({ hack }: { hack: ActiveHack }) {
  const def = HACK_DEFINITIONS[hack.hackType];
  const isChanneling = !hack.done;
  const isSuccess = hack.done && hack.success;
  const isInterrupted = hack.done && hack.interrupted;

  // Spritesheet animation for boot/siphon
  const channelMeta = HACK_SPRITE_META[def.channelAnim];
  const bootFrame = useSpriteFrame(channelMeta.fps, channelMeta.frames, isChanneling);

  // Scrolling code lines
  const [codeLines, setCodeLines] = useState<string[]>([]);
  useEffect(() => {
    if (!isChanneling) return;
    const iv = setInterval(() => {
      setCodeLines((prev) => [...prev.slice(-6), getRandomCodeLine()]);
    }, 300);
    return () => clearInterval(iv);
  }, [isChanneling]);

  // Progress percentage
  const progress = Math.min(1, hack.elapsed / hack.channelTime);

  // Monitor asset based on hack tier
  const monitorSrc = getMonitorAsset(def.monitorTier);

  // Result display timer
  const [showResult, setShowResult] = useState(false);
  useEffect(() => {
    if (hack.done) {
      setShowResult(true);
      const t = setTimeout(() => setShowResult(false), 2000);
      return () => clearTimeout(t);
    }
  }, [hack.done]);

  if (!isChanneling && !showResult) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 120,
        right: 20,
        width: 320,
        zIndex: 100,
        pointerEvents: 'none',
        fontFamily: 'monospace',
        imageRendering: 'pixelated',
      }}
    >
      {/* Monitor Frame */}
      <div style={{ position: 'relative' }}>
        <img src={monitorSrc} alt="hack terminal" style={{ width: '100%', imageRendering: 'pixelated' }} />

        {/* Screen content area (positioned inside monitor frame) */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '8%',
            right: '8%',
            bottom: '35%',
            overflow: 'hidden',
            background: 'rgba(0,0,0,0.85)',
            borderRadius: 2,
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              color: def.accentColor,
              fontSize: 8,
              fontWeight: 'bold',
              marginBottom: 2,
              textShadow: `0 0 4px ${def.accentColor}`,
            }}
          >
            {isChanneling
              ? `⚡ ${def.name.toUpperCase()} IN PROGRESS...`
              : isSuccess
                ? '✓ ACCESS GRANTED'
                : isInterrupted
                  ? '✗ ACCESS DENIED'
                  : ''}
          </div>

          {/* Scrolling code lines */}
          {isChanneling && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              {codeLines.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  style={{
                    height: 5,
                    imageRendering: 'pixelated',
                    opacity: 0.7 + (i / codeLines.length) * 0.3,
                    marginBottom: 1,
                  }}
                />
              ))}
            </div>
          )}

          {/* Boot animation frame */}
          {isChanneling && (
            <div
              style={{
                width: 48,
                height: 48,
                overflow: 'hidden',
                alignSelf: 'center',
                marginTop: 2,
              }}
            >
              <img
                src={HACK_ASSETS[def.channelAnim]}
                alt="boot"
                style={{
                  height: channelMeta.frameH,
                  imageRendering: 'pixelated',
                  transform: `translateX(-${bootFrame * channelMeta.frameW}px)`,
                }}
              />
            </div>
          )}

          {/* Result feedback */}
          {showResult && (
            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <img
                src={isSuccess ? HACK_ASSETS.accessGranted : HACK_ASSETS.accessDenied}
                alt={isSuccess ? 'granted' : 'denied'}
                style={{ height: 12, imageRendering: 'pixelated' }}
              />
            </div>
          )}
        </div>

        {/* Progress bar (below screen, inside monitor bottom bar area) */}
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            left: '12%',
            right: '12%',
            height: 6,
            background: 'rgba(0,0,0,0.6)',
            border: `1px solid ${def.accentColor}40`,
            borderRadius: 1,
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${def.accentColor}88, ${def.accentColor})`,
              borderRadius: 1,
              transition: 'width 0.1s linear',
              boxShadow: `0 0 4px ${def.accentColor}`,
            }}
          />
        </div>

        {/* Signal indicator */}
        {isChanneling && (
          <img
            src={HACK_ASSETS.signalBlue}
            alt="signal"
            style={{
              position: 'absolute',
              bottom: '5%',
              right: '12%',
              height: 4,
              imageRendering: 'pixelated',
              opacity: 0.8,
            }}
          />
        )}

        {/* Status lights */}
        <img
          src={HACK_ASSETS.statusLights}
          alt="status"
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '12%',
            height: 8,
            imageRendering: 'pixelated',
            opacity: isChanneling ? 1 : 0.4,
          }}
        />
      </div>

      {/* Target info text */}
      <div
        style={{
          color: '#88aacc',
          fontSize: 8,
          textAlign: 'center',
          marginTop: 2,
          textShadow: '0 0 2px #000',
        }}
      >
        {isChanneling
          ? `Channeling... ${Math.ceil(hack.channelTime - hack.elapsed)}s`
          : isSuccess
            ? `Effect active: ${Math.ceil(hack.effectTimer)}s`
            : 'Connection lost'}
      </div>
    </div>
  );
}
