/**
 * armada-ui.tsx — CSS-only sci-fi UI component library for Gruda Armada.
 *
 * Based on the concept art: clean dark panels with cyan/teal border glows,
 * hexagonal ability slots, stat bars with labels, and circuit-trace decorations.
 *
 * NO image backgrounds — pure CSS borders, gradients, and box-shadows.
 * This makes the UI:
 *   - Fast (no image loads, no 9-slice rendering)
 *   - Scalable (works at any resolution)
 *   - Consistent (no broken layouts when images fail)
 *   - Themeable (change --ui-accent to recolor everything)
 *
 * Usage:
 *   import { UnitFrame, StatBar, AbilitySlot, InfoPanel, TopBar } from './armada-ui';
 */

import React, { type ReactNode, type CSSProperties, useState } from 'react';

// ── Theme tokens ──────────────────────────────────────────────────
const T = {
  // Core palette
  bg: '#0a0e18',
  bgPanel: 'rgba(8,14,28,0.92)',
  bgSlot: 'rgba(12,20,36,0.85)',
  border: 'rgba(40,180,200,0.3)',
  borderBright: 'rgba(40,180,200,0.6)',
  accent: '#28b4c8',
  accentDim: 'rgba(40,180,200,0.15)',
  accentGlow: 'rgba(40,180,200,0.4)',
  // Stat colors
  hp: '#44ee66',
  shield: '#4488ff',
  energy: '#44ddff',
  damage: '#ff6644',
  armor: '#8899aa',
  speed: '#ffcc22',
  range: '#aa66ff',
  tech: '#44ffaa',
  command: '#ffaa44',
  ftl: '#ff44aa',
  // Text
  textPrimary: '#c8e0ec',
  textDim: 'rgba(160,200,220,0.5)',
  textLabel: 'rgba(140,180,200,0.7)',
  // Typography
  fontMain: "'Segoe UI', 'Inter', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",
} as const;

// ── Shared border style ─────────────────────────────────────────
const panelBorder = `1px solid ${T.border}`;
const panelGlow = `0 0 12px ${T.accentGlow}, inset 0 0 8px rgba(0,0,0,0.5)`;
const panelRadius = 8;

// ════════════════════════════════════════════════════════════════════
// UNIT FRAME — Ship portrait + name + HP/Shield/Energy bars
// Matches concept image 1: circle portrait left, bars right, 4 slots bottom
// ════════════════════════════════════════════════════════════════════

export function UnitFrame({
  name,
  portrait,
  hp, maxHp,
  shield, maxShield,
  energy, maxEnergy,
  abilities,
  rank,
  shipClass,
  style,
}: {
  name: string;
  portrait?: string;
  hp: number; maxHp: number;
  shield: number; maxShield: number;
  energy?: number; maxEnergy?: number;
  abilities?: { icon?: string; key: string; cooldown: number; active: boolean }[];
  rank?: number;
  shipClass?: string;
  style?: CSSProperties;
}) {
  return (
    <div style={{
      background: T.bgPanel,
      border: panelBorder,
      borderRadius: panelRadius,
      boxShadow: panelGlow,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      fontFamily: T.fontMain,
      ...style,
    }}>
      {/* Top row: portrait + info */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {/* Portrait circle */}
        <div style={{
          width: 56, height: 56,
          borderRadius: '50%',
          border: `2px solid ${T.borderBright}`,
          boxShadow: `0 0 12px ${T.accentGlow}`,
          background: T.bgSlot,
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {portrait ? (
            <img src={portrait} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ fontSize: 20, color: T.textDim }}>◆</div>
          )}
        </div>

        {/* Name + bars */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: T.textPrimary,
            letterSpacing: 1, marginBottom: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {name}
            {rank != null && rank > 0 && (
              <span style={{ fontSize: 9, color: T.speed, marginLeft: 6 }}>★{rank}</span>
            )}
          </div>
          {shipClass && (
            <div style={{ fontSize: 9, color: T.textDim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
              {shipClass}
            </div>
          )}
          <StatBar label="HP" value={hp} max={maxHp} color={T.hp} />
          <StatBar label="SHIELD" value={shield} max={maxShield} color={T.shield} />
          {energy != null && maxEnergy != null && (
            <StatBar label="ENERGY" value={energy} max={maxEnergy} color={T.energy} />
          )}
        </div>
      </div>

      {/* Ability slots (bottom row) */}
      {abilities && abilities.length > 0 && (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          {abilities.map((ab, i) => (
            <AbilitySlot key={i} icon={ab.icon} hotkey={ab.key} cooldown={ab.cooldown} active={ab.active} />
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// STAT BAR — Inline label + fill bar (used in unit frame and tooltips)
// ════════════════════════════════════════════════════════════════════

export function StatBar({
  label,
  value,
  max,
  color,
  showNumbers = true,
  height = 10,
  style,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  showNumbers?: boolean;
  height?: number;
  style?: CSSProperties;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, ...style }}>
      <span style={{ fontSize: 8, fontWeight: 700, color: T.textLabel, width: 42, textAlign: 'right', letterSpacing: 1, fontFamily: T.fontMono }}>
        {label}
      </span>
      <div style={{
        flex: 1, height, borderRadius: 3,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          borderRadius: 2,
          boxShadow: `0 0 6px ${color}44`,
          transition: 'width 0.3s ease',
        }} />
      </div>
      {showNumbers && (
        <span style={{ fontSize: 9, color: T.textDim, fontFamily: T.fontMono, minWidth: 46, textAlign: 'right' }}>
          {Math.round(value)}/{max}
        </span>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// ABILITY SLOT — Hexagonal or rounded square with cooldown overlay
// ════════════════════════════════════════════════════════════════════

export function AbilitySlot({
  icon,
  hotkey,
  cooldown,
  active,
  onClick,
  size = 44,
}: {
  icon?: string;
  hotkey?: string;
  cooldown?: number;
  active?: boolean;
  onClick?: () => void;
  size?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const onCooldown = cooldown != null && cooldown > 0;

  return (
    <div
      onClick={onCooldown ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: size, height: size,
        borderRadius: 6,
        border: `1px solid ${active ? T.accent : onCooldown ? 'rgba(255,255,255,0.08)' : T.border}`,
        background: active ? T.accentDim : T.bgSlot,
        boxShadow: active ? `0 0 8px ${T.accentGlow}` : hovered ? `0 0 6px ${T.accentGlow}` : 'none',
        cursor: onCooldown ? 'default' : 'pointer',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
        opacity: onCooldown ? 0.5 : 1,
        overflow: 'hidden',
      }}
    >
      {icon ? (
        <img src={icon} alt="" style={{ width: size - 8, height: size - 8, objectFit: 'contain' }} />
      ) : (
        <div style={{ fontSize: 14, color: T.textDim }}>+</div>
      )}
      {/* Hotkey badge */}
      {hotkey && (
        <div style={{
          position: 'absolute', top: 1, right: 2,
          fontSize: 8, fontWeight: 800, color: T.textLabel,
          fontFamily: T.fontMono,
        }}>
          {hotkey}
        </div>
      )}
      {/* Cooldown overlay */}
      {onCooldown && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color: '#fff',
          fontFamily: T.fontMono,
        }}>
          {Math.ceil(cooldown)}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// INFO PANEL — Right-side panel for planet info, build menu, etc.
// Slides in from edge, dark glass with border glow
// ════════════════════════════════════════════════════════════════════

export function InfoPanel({
  title,
  children,
  onClose,
  width = 280,
  side = 'right',
  style,
}: {
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  width?: number;
  side?: 'left' | 'right';
  style?: CSSProperties;
}) {
  return (
    <div style={{
      position: 'absolute',
      top: 52, // below top bar
      [side]: 0,
      bottom: 184, // above bottom bar
      width,
      background: T.bgPanel,
      borderLeft: side === 'right' ? panelBorder : 'none',
      borderRight: side === 'left' ? panelBorder : 'none',
      boxShadow: `${side === 'right' ? '-' : ''}4px 0 20px rgba(0,0,0,0.5), 0 0 12px ${T.accentGlow}`,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 20,
      pointerEvents: 'auto',
      fontFamily: T.fontMain,
      ...style,
    }}>
      {/* Header */}
      {(title || onClose) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: panelBorder,
          flexShrink: 0,
        }}>
          {title && (
            <span style={{ fontSize: 11, fontWeight: 800, color: T.accent, letterSpacing: 3, textTransform: 'uppercase' }}>
              {title}
            </span>
          )}
          {onClose && (
            <span
              onClick={onClose}
              style={{ fontSize: 16, color: T.textDim, cursor: 'pointer', lineHeight: 1 }}
            >
              ✕
            </span>
          )}
        </div>
      )}
      {/* Content (scrollable) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
        {children}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// TOP BAR — Resource bar across the top (48px)
// ════════════════════════════════════════════════════════════════════

export function TopBar({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      height: 48,
      background: `linear-gradient(180deg, ${T.bg}f0, ${T.bg}cc)`,
      borderBottom: panelBorder,
      boxShadow: `0 2px 12px rgba(0,0,0,0.5)`,
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 12,
      pointerEvents: 'auto', zIndex: 30,
      fontFamily: T.fontMain,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// RESOURCE CHIP — Compact resource display (icon + value + rate)
// ════════════════════════════════════════════════════════════════════

export function ResourceChip({
  icon,
  value,
  rate,
  color,
}: {
  icon: string;
  value: number;
  rate?: number;
  color: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '4px 8px',
      borderRadius: 4,
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid rgba(255,255,255,0.06)`,
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: T.fontMono }}>
          {Math.floor(value).toLocaleString()}
        </span>
        {rate != null && rate > 0 && (
          <span style={{ fontSize: 8, color: T.textDim, fontFamily: T.fontMono }}>
            +{rate.toFixed(0)}/s
          </span>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// BOTTOM BAR — 3-zone layout: minimap | unit info | command grid
// ════════════════════════════════════════════════════════════════════

export function BottomBar({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 180,
      background: `linear-gradient(0deg, ${T.bg}f8, ${T.bg}e0)`,
      borderTop: panelBorder,
      boxShadow: `0 -2px 12px rgba(0,0,0,0.5)`,
      display: 'grid',
      gridTemplateColumns: '180px 1fr 240px',
      gap: 0,
      pointerEvents: 'auto', zIndex: 30,
      fontFamily: T.fontMain,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// TOOLTIP — Hover tooltip for ships, planets, abilities
// ════════════════════════════════════════════════════════════════════

export function Tooltip({
  title,
  children,
  x, y,
}: {
  title?: string;
  children: ReactNode;
  x: number;
  y: number;
}) {
  return (
    <div style={{
      position: 'fixed', left: x + 12, top: y - 8,
      background: T.bgPanel,
      border: panelBorder,
      borderRadius: 6,
      boxShadow: panelGlow,
      padding: '8px 12px',
      maxWidth: 260,
      zIndex: 500,
      fontFamily: T.fontMain,
      pointerEvents: 'none',
    }}>
      {title && (
        <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, marginBottom: 4, letterSpacing: 1 }}>
          {title}
        </div>
      )}
      <div style={{ fontSize: 10, color: T.textPrimary, lineHeight: 1.5 }}>
        {children}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 8-STAT DISPLAY — For ship stat panels (concept image 3)
// Left column: PWR, ARM, SHD, SPD | Right column: RNG, TEC, CMD, FTL
// ════════════════════════════════════════════════════════════════════

export type ArmadaStat = 'pwr' | 'arm' | 'shd' | 'spd' | 'rng' | 'tec' | 'cmd' | 'ftl';

const STAT_META: Record<ArmadaStat, { label: string; color: string; icon: string }> = {
  pwr: { label: 'POWER', color: T.damage, icon: '⚔' },
  arm: { label: 'ARMOR', color: T.armor, icon: '🛡' },
  shd: { label: 'SHIELD', color: T.shield, icon: '◈' },
  spd: { label: 'SPEED', color: T.speed, icon: '»' },
  rng: { label: 'RANGE', color: T.range, icon: '◎' },
  tec: { label: 'TECH', color: T.tech, icon: '⚙' },
  cmd: { label: 'COMMAND', color: T.command, icon: '★' },
  ftl: { label: 'FTL', color: T.ftl, icon: '⇒' },
};

export function EightStatPanel({
  stats,
  style,
}: {
  stats: Record<ArmadaStat, number>; // 0-100 each
  style?: CSSProperties;
}) {
  const leftStats: ArmadaStat[] = ['pwr', 'arm', 'shd', 'spd'];
  const rightStats: ArmadaStat[] = ['rng', 'tec', 'cmd', 'ftl'];

  const renderColumn = (keys: ArmadaStat[]) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
      {keys.map((k) => {
        const m = STAT_META[k];
        return (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 8, color: m.color, width: 50, textAlign: 'right', fontWeight: 700, fontFamily: T.fontMono, letterSpacing: 1 }}>
              {m.label}
            </span>
            <div style={{
              flex: 1, height: 8, borderRadius: 2,
              background: 'rgba(255,255,255,0.04)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.min(100, stats[k])}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${m.color}88, ${m.color})`,
                borderRadius: 2,
                boxShadow: `0 0 4px ${m.color}33`,
              }} />
            </div>
            <span style={{ fontSize: 8, color: T.textDim, fontFamily: T.fontMono, width: 22, textAlign: 'right' }}>
              {Math.round(stats[k])}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 12, ...style }}>
      {renderColumn(leftStats)}
      {renderColumn(rightStats)}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// BUILD LIST ITEM — Ship in the build menu (replaces empty hex slots)
// ════════════════════════════════════════════════════════════════════

export function BuildListItem({
  name,
  portrait,
  cost,
  buildTime,
  tier,
  onClick,
  disabled,
}: {
  name: string;
  portrait?: string;
  cost: { credits: number; energy: number; minerals: number };
  buildTime: number;
  tier: number;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 8px',
        borderRadius: 4,
        border: `1px solid ${hovered && !disabled ? T.borderBright : 'rgba(255,255,255,0.04)'}`,
        background: hovered && !disabled ? T.accentDim : 'transparent',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s',
      }}
    >
      {/* Ship thumbnail */}
      <div style={{
        width: 40, height: 40,
        borderRadius: 4,
        border: `1px solid ${T.border}`,
        background: T.bgSlot,
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {portrait ? (
          <img src={portrait} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ fontSize: 16, color: T.textDim }}>◇</div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name}
          <span style={{ fontSize: 8, color: T.textDim, marginLeft: 4 }}>T{tier}</span>
        </div>
        <div style={{ fontSize: 8, color: T.textDim, fontFamily: T.fontMono, display: 'flex', gap: 6 }}>
          <span style={{ color: '#fc4' }}>{cost.credits}c</span>
          <span style={{ color: '#4df' }}>{cost.energy}e</span>
          <span style={{ color: '#4f8' }}>{cost.minerals}m</span>
          <span style={{ color: '#8ac' }}>{buildTime}s</span>
        </div>
      </div>

      {/* Build button */}
      <div style={{
        fontSize: 9, fontWeight: 700,
        padding: '4px 8px',
        borderRadius: 3,
        background: disabled ? 'transparent' : `linear-gradient(135deg, ${T.accent}44, ${T.accent}22)`,
        border: `1px solid ${T.border}`,
        color: T.accent,
        letterSpacing: 1,
      }}>
        BUILD
      </div>
    </div>
  );
}

// ── Export theme tokens for external use ──────────────────────────
export { T as UITheme };
