/**
 * planet-card.tsx — Planet info card using space-shooter-gui victory frame.
 *
 * Shows planet details in the metallic sci-fi frame:
 *   - Planet preview (colored sphere or planet GLB preview)
 *   - Owner name (player/enemy/neutral) — replaces victory/defeat text
 *   - Resource rarity stars (1-5 based on yield)
 *   - Ship unlock icons (what ships this planet type grants)
 *   - Left/right arrows to cycle through planets
 *   - Bottom button: BUILD (owned) or SCAN (enemy/neutral)
 */

import { useState } from 'react';
import type { Planet, SpaceGameState, Team } from './space-types';
import { PLANET_TYPE_DATA, TEAM_COLORS, getShipDef, PLANET_SHIP_UNLOCKS } from './space-types';
import { SHIP_PREVIEW } from './space-ui-shared';

const SG = '/assets/space/ui/space-shooter-gui/PNG';
const FRAME = `${SG}/Victory/victory_0013_window2.png`;
const STAR_GOLD = `${SG}/Victory/victory_0004_star.png`;
const STAR_EMPTY = `${SG}/Victory/victory_0005_star2.png`;
const BTN_BG = `${SG}/Victory/victory_0011_button.png`;
const ARROW_L = `${SG}/Elements/element_0095_arrow-copy-3.png`;
const ARROW_R = `${SG}/Elements/element_0097_arrow.png`;
const CLOSE_BTN = `${SG}/Elements/element_0015_X_button.png`;

function getOwnerLabel(owner: Team, planets: Planet[]): string {
  if (owner === 0) return 'NEUTRAL';
  if (owner === 1) return 'YOUR TERRITORY';
  return `ENEMY TEAM ${owner}`;
}

function getOwnerColor(owner: Team): string {
  if (owner === 0) return '#888888';
  if (owner === 1) return '#44ff44';
  const tc = TEAM_COLORS[owner];
  return tc ? `#${tc.toString(16).padStart(6, '0')}` : '#ff4444';
}

/** Calculate resource rarity as 1-5 stars based on total yield compared to average. */
function getResourceRarity(planet: Planet): number {
  const total = planet.resourceYield.credits + planet.resourceYield.energy + planet.resourceYield.minerals;
  const ptd = PLANET_TYPE_DATA[planet.planetType];
  const mult = ptd.resourceMult.credits + ptd.resourceMult.energy + ptd.resourceMult.minerals;
  const score = total * (mult / 3);
  if (score >= 40) return 5;
  if (score >= 30) return 4;
  if (score >= 20) return 3;
  if (score >= 12) return 2;
  return 1;
}

interface PlanetCardProps {
  planet: Planet;
  state: SpaceGameState;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onAction: (planetId: number) => void; // BUILD for owned, SCAN for enemy
}

export function PlanetCard({ planet, state, onClose, onNext, onPrev, onAction }: PlanetCardProps) {
  const ptd = PLANET_TYPE_DATA[planet.planetType];
  const ownerLabel = getOwnerLabel(planet.owner, state.planets);
  const ownerColor = getOwnerColor(planet.owner);
  const rarity = getResourceRarity(planet);
  const isOwned = planet.owner === 1;
  const shipUnlocks = PLANET_SHIP_UNLOCKS[planet.planetType];

  return (
    <div
      style={{
        position: 'relative',
        width: 280,
        userSelect: 'none',
        fontFamily: "'Segoe UI', monospace",
      }}
    >
      {/* Frame background */}
      <img
        src={FRAME}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          pointerEvents: 'none',
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />

      {/* Content over frame */}
      <div style={{ position: 'relative', zIndex: 1, padding: '18px 20px 14px' }}>
        {/* Close button (top-right, uses X button from assets) */}
        <img
          src={CLOSE_BTN}
          alt="Close"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 24,
            height: 24,
            cursor: 'pointer',
            filter: 'brightness(0.9)',
            transition: 'filter 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.4)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(0.9)')}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        {/* Planet visual */}
        <div
          style={{
            width: 120,
            height: 120,
            margin: '0 auto 8px',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, #${ptd.baseColor.toString(16).padStart(6, '0')}cc, #${ptd.baseColor.toString(16).padStart(6, '0')}44, #111)`,
            boxShadow: `0 0 30px #${ptd.baseColor.toString(16).padStart(6, '0')}44, inset 0 0 20px rgba(0,0,0,0.5)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Planet type emoji */}
          <span style={{ fontSize: 40 }}>
            {planet.planetType === 'volcanic'
              ? '🌋'
              : planet.planetType === 'oceanic'
                ? '🌊'
                : planet.planetType === 'crystalline'
                  ? '💎'
                  : planet.planetType === 'gas_giant'
                    ? '🪐'
                    : planet.planetType === 'frozen'
                      ? '❄️'
                      : planet.planetType === 'plasma'
                        ? '🩷'
                        : planet.planetType === 'fungal'
                          ? '🍀'
                          : planet.planetType === 'metallic'
                            ? '🪨'
                            : planet.planetType === 'dark_matter'
                              ? '🟣'
                              : '🏜️'}
          </span>
          {/* Planet level badge */}
          {planet.planetLevel && (
            <div
              style={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.8)',
                border: '2px solid #4488ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 900,
                color: '#4488ff',
              }}
            >
              L{planet.planetLevel}
            </div>
          )}
        </div>

        {/* Planet name */}
        <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: 2, marginBottom: 2 }}>
          {planet.name}
        </div>

        {/* Planet type + tech focus */}
        <div style={{ textAlign: 'center', fontSize: 9, color: 'rgba(160,200,255,0.5)', marginBottom: 8 }}>
          {ptd.label} · {ptd.techFocus}
        </div>

        {/* Resource rarity stars */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <img
              key={i}
              src={i < rarity ? STAR_GOLD : STAR_EMPTY}
              alt=""
              style={{ width: 24, height: 24, imageRendering: 'pixelated' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ))}
        </div>

        {/* Owner label (replaces VICTORY/DEFEAT) */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: 3,
            color: ownerColor,
            marginBottom: 8,
            textShadow: `0 0 12px ${ownerColor}66`,
          }}
        >
          {ownerLabel}
        </div>

        {/* Resource yields */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 8,
            fontSize: 11,
          }}
        >
          <span style={{ color: '#fc4' }}>💰{planet.resourceYield.credits}/s</span>
          <span style={{ color: '#4df' }}>⚡{planet.resourceYield.energy}/s</span>
          <span style={{ color: '#4f8' }}>⛏️{planet.resourceYield.minerals}/s</span>
        </div>

        {/* Ship unlocks from this planet type */}
        {shipUnlocks && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 8, color: 'rgba(160,200,255,0.4)', textAlign: 'center', letterSpacing: 1, marginBottom: 4 }}>
              SHIPS UNLOCKED
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
              {shipUnlocks.ships.map((shipKey) => {
                const def = getShipDef(shipKey);
                const preview = SHIP_PREVIEW[shipKey];
                return (
                  <div
                    key={shipKey}
                    title={def?.displayName ?? shipKey}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 4,
                      overflow: 'hidden',
                      background: 'rgba(6,14,30,0.8)',
                      border: isOwned ? '1px solid #44ff4466' : '1px solid #1a305066',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          imageRendering: 'auto',
                          filter: isOwned ? 'none' : 'grayscale(0.8) brightness(0.5)',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 14, opacity: 0.3 }}>🚀</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 7, color: 'rgba(160,200,255,0.3)', textAlign: 'center', marginTop: 3 }}>{shipUnlocks.reason}</div>
          </div>
        )}

        {/* Left/Right arrows */}
        <img
          src={ARROW_L}
          alt="Previous"
          onClick={onPrev}
          style={{
            position: 'absolute',
            left: 4,
            top: '50%',
            transform: 'translateY(-50%) scaleX(-1)',
            width: 20,
            height: 20,
            cursor: 'pointer',
            filter: 'brightness(0.8)',
            transition: 'filter 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.5)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(0.8)')}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <img
          src={ARROW_R}
          alt="Next"
          onClick={onNext}
          style={{
            position: 'absolute',
            right: 4,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 20,
            height: 20,
            cursor: 'pointer',
            filter: 'brightness(0.8)',
            transition: 'filter 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.5)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(0.8)')}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        {/* Bottom action button */}
        <div
          onClick={() => onAction(planet.id)}
          style={{
            position: 'relative',
            margin: '0 auto',
            width: 120,
            height: 32,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={BTN_BG}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'fill',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span
            style={{
              position: 'relative',
              zIndex: 1,
              fontSize: 11,
              fontWeight: 800,
              color: isOwned ? '#fff' : '#8ac',
              letterSpacing: 2,
            }}
          >
            {isOwned ? 'BUILD' : 'SCAN'}
          </span>
        </div>
      </div>
    </div>
  );
}
