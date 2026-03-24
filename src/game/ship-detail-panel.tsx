/**
 * ship-detail-panel.tsx — Full ship info panel using Garage layout from space-shooter-gui.
 *
 * Layout matches the Garage reference:
 *   Left:   Ship list (clickable cards with preview images)
 *   Center: Large selected ship preview
 *   Right:  Stat bars (HP, Shield, Armor, DMG, Speed) + ability slots
 *
 * Used in the bottom HUD when a ship is selected, replacing the old SingleUnitInfo.
 */

import React, { useState } from 'react';
import type { SpaceShip, ShipAbilityState } from './space-types';
import { getShipDef, SHIP_ROLES, SHIP_ROLE_LABELS, SHIP_ROLE_COLORS } from './space-types';
import { SHIP_PREVIEW, ABILITY_IMG } from './space-ui-shared';
import { Bar } from './ui-lib';

const SG = '/assets/space/ui/space-shooter-gui/PNG';
const GARAGE_BG = `${SG}/Garage/defeat_0039_window_bg.png`;
const LIST_CELLS = `${SG}/Garage/defeat_0035_list_cell.png`;
const LIST_CELL_ONE = `${SG}/Garage/defeat_0025_list_cell_one.png`;
const STAT_BAR_BG = `${SG}/Garage/defeat_0029_stats.png`;
const CELL_GRID = `${SG}/Garage/defeat_0022_cells.png`;
const SHIP_CONTOUR = `${SG}/Garage/defeat_0037_ship_contour.png`;

interface ShipDetailPanelProps {
  ships: SpaceShip[]; // all selected ships (first = primary)
  onSelectShip: (id: number) => void;
}

export function ShipDetailPanel({ ships, onSelectShip }: ShipDetailPanelProps) {
  const primary = ships[0];
  if (!primary) return null;
  const def = getShipDef(primary.shipType);
  if (!def) return null;
  const preview = SHIP_PREVIEW[primary.shipType];
  const role = SHIP_ROLES[primary.shipType];
  const roleColor = role ? SHIP_ROLE_COLORS[role] : null;
  const isHero = primary.shipClass === 'dreadnought' || 'lore' in def;
  const lore = 'lore' in def ? (def as any).lore : null;

  // Stat max values for bar scaling
  const MAX_HP = 2400;
  const MAX_SHIELD = 1000;
  const MAX_ARMOR = 25;
  const MAX_DMG = 200;
  const MAX_SPEED = 160;

  const hpPct = primary.hp / primary.maxHp;
  const hpColor = hpPct > 0.5 ? '#44ee44' : hpPct > 0.25 ? '#eebb00' : '#ee4444';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        fontFamily: "'Segoe UI', monospace",
        color: '#cde',
      }}
    >
      {/* Background frame */}
      <img
        src={GARAGE_BG}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          pointerEvents: 'none',
          opacity: 0.6,
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />

      {/* ── Left: Ship list ────────────────────────── */}
      {ships.length > 1 && (
        <div
          style={{
            width: 80,
            flexShrink: 0,
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            padding: '6px 4px',
            overflowY: 'auto',
          }}
        >
          {ships.slice(0, 8).map((s) => {
            const sDef = getShipDef(s.shipType);
            const sp = SHIP_PREVIEW[s.shipType];
            const selected = s.id === primary.id;
            return (
              <div
                key={s.id}
                onClick={() => onSelectShip(s.id)}
                style={{
                  position: 'relative',
                  height: 44,
                  cursor: 'pointer',
                  border: selected ? '1px solid #4488ff' : '1px solid transparent',
                  borderRadius: 4,
                  overflow: 'hidden',
                  background: selected ? 'rgba(68,136,255,0.15)' : 'rgba(6,14,30,0.6)',
                }}
              >
                <img
                  src={LIST_CELL_ONE}
                  alt=""
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'fill',
                    pointerEvents: 'none',
                    opacity: 0.8,
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', height: '100%', padding: '0 4px' }}>
                  {sp ? (
                    <img
                      src={sp}
                      alt=""
                      style={{ width: 36, height: 36, objectFit: 'contain', imageRendering: 'auto' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={{ width: 36, fontSize: 16, textAlign: 'center', opacity: 0.2 }}>🚀</div>
                  )}
                  <div style={{ marginLeft: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        fontSize: 7,
                        fontWeight: 700,
                        color: '#fff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {sDef?.displayName ?? s.shipType}
                    </div>
                    <div style={{ height: 3, background: '#0a0e18', borderRadius: 1, marginTop: 2 }}>
                      <div style={{ height: '100%', width: `${(s.hp / s.maxHp) * 100}%`, background: '#44ee44', borderRadius: 1 }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {ships.length > 8 && <div style={{ fontSize: 8, color: '#4488ff', textAlign: 'center' }}>+{ships.length - 8} more</div>}
        </div>
      )}

      {/* ── Center: Large ship preview ─────────────── */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 12px',
        }}
      >
        {/* Ship contour placeholder behind the preview */}
        <img
          src={SHIP_CONTOUR}
          alt=""
          style={{
            position: 'absolute',
            width: '70%',
            height: '70%',
            objectFit: 'contain',
            opacity: 0.04,
            pointerEvents: 'none',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        {/* Actual ship preview */}
        {preview ? (
          <img
            src={preview}
            alt={def.displayName}
            style={{
              maxWidth: '85%',
              maxHeight: '70%',
              objectFit: 'contain',
              imageRendering: 'auto',
              filter: `drop-shadow(0 0 16px ${roleColor ?? 'rgba(68,136,255,0.4)'})`,
              position: 'relative',
              zIndex: 1,
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div style={{ fontSize: 60, opacity: 0.1 }}>{isHero ? '⭐' : '🚀'}</div>
        )}

        {/* Name + class below preview */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: isHero ? '#fc4' : '#fff', letterSpacing: 1 }}>{def.displayName}</div>
          <div
            style={{ fontSize: 9, color: 'rgba(160,200,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <span>{def.class.replace(/_/g, ' ')}</span>
            {role && <span style={{ color: roleColor!, fontWeight: 700 }}>{SHIP_ROLE_LABELS[role]}</span>}
            {primary.rank > 0 && <span style={{ color: '#ffcc00' }}>{'★'.repeat(primary.rank)}</span>}
          </div>
          {lore && <div style={{ fontSize: 8, color: '#8ac', fontStyle: 'italic', marginTop: 2, opacity: 0.6, maxWidth: 200 }}>{lore}</div>}
        </div>
      </div>

      {/* ── Right: Stat bars + abilities ────────────── */}
      <div
        style={{
          width: 140,
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '8px 8px 8px 0',
          gap: 5,
        }}
      >
        {/* HP */}
        <StatRow label="HP" icon="♥" value={Math.ceil(primary.hp)} max={primary.maxHp} barMax={MAX_HP} color={hpColor} />
        {/* Shield */}
        {primary.maxShield > 0 && (
          <StatRow label="SHD" icon="🛡" value={Math.ceil(primary.shield)} max={primary.maxShield} barMax={MAX_SHIELD} color="#44ccff" />
        )}
        {/* Armor */}
        <StatRow label="ARM" icon="🔰" value={primary.armor} max={primary.armor} barMax={MAX_ARMOR} color="#8ac4d4" />
        {/* Damage */}
        <StatRow label="DMG" icon="⚔" value={primary.attackDamage} max={primary.attackDamage} barMax={MAX_DMG} color="#ff8844" />
        {/* Speed */}
        <StatRow
          label="SPD"
          icon="⚡"
          value={Math.round(primary.speed)}
          max={Math.round(primary.speed)}
          barMax={MAX_SPEED}
          color="#ffcc00"
        />

        {/* Abilities (if any) */}
        {primary.abilities.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 7, color: 'rgba(160,200,255,0.4)', letterSpacing: 1, marginBottom: 3 }}>ABILITIES</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {primary.abilities.map((ab, i) => (
                <AbilityIcon key={i} ab={ab} />
              ))}
            </div>
          </div>
        )}

        {/* Attack type + range */}
        <div style={{ fontSize: 8, color: 'rgba(160,200,255,0.4)', marginTop: 4, display: 'flex', gap: 8 }}>
          <span>{primary.attackType.toUpperCase()}</span>
          <span>Range: {primary.attackRange}</span>
          <span>CD: {primary.attackCooldown.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
}

/** Stat row with label, value, and bar using garage stat track background. */
function StatRow({
  label,
  icon,
  value,
  max,
  barMax,
  color,
}: {
  label: string;
  icon: string;
  value: number;
  max: number;
  barMax: number;
  color: string;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, marginBottom: 1 }}>
        <span style={{ color, fontWeight: 700 }}>
          {icon} {label}
        </span>
        <span style={{ color: 'rgba(160,200,255,0.6)', fontSize: 8 }}>
          {value}/{max}
        </span>
      </div>
      <div style={{ position: 'relative', height: 10 }}>
        <img
          src={STAT_BAR_BG}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            opacity: 0.7,
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 1,
            top: 1,
            bottom: 1,
            width: `${Math.min(100, (value / barMax) * 100)}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            borderRadius: 2,
            transition: 'width 0.2s',
            boxShadow: `0 0 6px ${color}44`,
          }}
        />
      </div>
    </div>
  );
}

/** Compact ability icon with cooldown overlay. */
function AbilityIcon({ ab }: { ab: ShipAbilityState }) {
  const onCooldown = ab.cooldownRemaining > 0;
  const art = ABILITY_IMG[ab.ability.type];

  return (
    <div
      title={`${ab.ability.name} [${ab.ability.key}] — ${ab.ability.energyCost}⚡ · ${ab.ability.cooldown}s CD`}
      style={{
        width: 28,
        height: 28,
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        border: ab.active ? '1px solid #ffcc00' : ab.autoCast ? '1px solid #44ee8866' : '1px solid #1a305066',
        background: 'rgba(6,14,30,0.8)',
        opacity: onCooldown ? 0.5 : 1,
      }}
    >
      {art ? (
        <img
          src={art}
          alt={ab.ability.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            imageRendering: 'auto',
            filter: ab.active ? 'brightness(1.4) saturate(1.5)' : 'none',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            color: '#8ac',
          }}
        >
          {ab.ability.key}
        </div>
      )}
      {/* Key label */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          fontSize: 7,
          fontWeight: 700,
          background: 'rgba(0,0,0,0.7)',
          padding: '0 3px',
          borderRadius: '3px 0 0 0',
          color: '#fff',
        }}
      >
        {ab.ability.key}
      </div>
      {/* Autocast dot */}
      {ab.autoCast && (
        <div
          style={{
            position: 'absolute',
            top: 1,
            left: 1,
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: '#44ee88',
            boxShadow: '0 0 4px #44ee88',
          }}
        />
      )}
      {/* Cooldown text */}
      {onCooldown && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 800,
            color: '#f88',
            textShadow: '0 0 4px #000',
          }}
        >
          {Math.ceil(ab.cooldownRemaining)}
        </div>
      )}
    </div>
  );
}
