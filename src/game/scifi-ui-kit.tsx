/**
 * scifi-ui-kit.tsx — Comprehensive image-based UI library for Gruda Armada
 *
 * Every component uses real game art PNGs from the craftpix sci-fi GUI packs.
 * This file surfaces ALL sliced assets, icon packs, and decorative elements
 * that were previously unused.
 *
 * Asset directories used:
 *   /assets/space/ui/scifi-gui/sliced/   — panels, buttons, bars, slots, corners, gems, tags, title chevrons
 *   /assets/space/ui/scifi-gui/elements/ — decorative element overlays (1-3)
 *   /assets/space/ui/scifi-gui/items/    — 9 item thumbnails
 *   /assets/space/ui/scifi-gui/skills/   — 13 skill icons
 *   /assets/space/ui/scifi-gui/avatars/  — avatar portraits
 *   /assets/space/ui/skill-icons-1/PNG/  — 20 detailed skill icons
 *   /assets/space/ui/skill-icons-2/PNG/  — 20 detailed skill icons
 *   /assets/space/ui/item-icons/PNG/     — 20 item icons
 *   /assets/space/ui/space-icons/PNG/    — 20 space-themed icons
 *   /assets/space/ui/resource-icons/     — 40 resource icons (Icon39_01-40)
 *   /assets/space/ui/mining-icons/PNG/   — mining icons
 *   /assets/space/ui/hud/               — HUD elements (backgrounds, badges)
 */

import React, { useState, type ReactNode, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Asset Path Constants ──────────────────────────────────────────────
const S = '/assets/space/ui/scifi-gui/sliced';
const EL = '/assets/space/ui/scifi-gui/elements';
const ITEM_THUMB = '/assets/space/ui/scifi-gui/items';
const SKILL_THUMB = '/assets/space/ui/scifi-gui/skills';
const AVATAR_DIR = '/assets/space/ui/scifi-gui/avatars';
const SKILL1 = '/assets/space/ui/skill-icons-1/PNG';
const SKILL2 = '/assets/space/ui/skill-icons-2/PNG';
const ITEM_ICONS = '/assets/space/ui/item-icons/PNG';
const SPACE_ICONS = '/assets/space/ui/space-icons/PNG';
const RES_ICONS_DIR = '/assets/space/ui/resource-icons';
const MINING_DIR = '/assets/space/ui/mining-icons/PNG';
const HUD = '/assets/space/ui/hud';

// ── Color Variant Type ────────────────────────────────────────────────
export type SciFiColor = 'green' | 'purple' | 'gold';

/** Resolve color suffix for sliced asset filenames: green='', purple='-purple', gold='-gold' */
function colorSuffix(c: SciFiColor): string {
  if (c === 'purple') return '-purple';
  if (c === 'gold') return '-gold';
  return '';
}

// ═══════════════════════════════════════════════════════════════════════
// PANELS — using sliced panel assets
// ═══════════════════════════════════════════════════════════════════════

/** Wide panel background — good for main content areas, menus, modals */
export function SciFiPanel({
  children,
  color = 'green',
  variant = 'wide',
  title,
  onClose,
  width,
  style,
  animate = true,
}: {
  children: ReactNode;
  color?: SciFiColor;
  variant?: 'wide' | 'square' | 'squareAlt';
  title?: string;
  onClose?: () => void;
  width?: number | string;
  style?: CSSProperties;
  animate?: boolean;
}) {
  const bgMap = {
    wide: `${S}/panel-wide${colorSuffix(color)}.png`,
    square: `${S}/panel-sq${colorSuffix(color)}.png`,
    squareAlt: `${S}/panel-sq-alt${colorSuffix(color)}.png`,
  };

  const glowColor = color === 'gold' ? 'rgba(255,180,0,0.3)' : color === 'purple' ? 'rgba(160,60,255,0.3)' : 'rgba(68,255,200,0.3)';

  const content = (
    <div
      style={{
        position: 'relative',
        width: width ?? 'auto',
        backgroundImage: `url(${bgMap[variant]})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        padding: variant === 'wide' ? '42px 28px 28px' : '36px 22px 22px',
        minHeight: 100,
        filter: `drop-shadow(0 4px 24px rgba(0,0,0,0.7)) drop-shadow(0 0 12px ${glowColor})`,
        ...style,
      }}
    >
      {/* Title chevron */}
      {title && (
        <TitleChevron color={color} style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)' }}>
          {title}
        </TitleChevron>
      )}

      {/* Close button */}
      {onClose && (
        <img
          src={`${HUD}/CloseBtn.png`}
          alt="Close"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            width: 24,
            height: 24,
            cursor: 'pointer',
            zIndex: 10,
            filter: 'brightness(0.9)',
            transition: 'filter 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.4)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(0.9)')}
        />
      )}

      {/* Corner decorations */}
      <CornerDecor color={color} position="top-left" />
      <CornerDecor color={color} position="top-right" />
      <CornerDecor color={color} position="bottom-left" />
      <CornerDecor color={color} position="bottom-right" />

      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 20 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {content}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// BUTTONS — using sliced button assets
// ═══════════════════════════════════════════════════════════════════════

export function SciFiBtn({
  label,
  onClick,
  disabled,
  active,
  size = 'wide',
  color = 'green',
  icon,
  children,
  style,
}: {
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  size?: 'wide' | 'med' | 'long';
  color?: SciFiColor;
  icon?: string;
  children?: ReactNode;
  style?: CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);
  const sizeMap = { wide: 'btn-wide', med: 'btn-med', long: 'btn-long' };
  const src = `${S}/${sizeMap[size]}${colorSuffix(color)}.png`;
  const isActive = hovered || active;

  const textColor = color === 'gold' ? '#ffe090' : color === 'purple' ? '#d0a0ff' : '#c8e8dc';
  const glowCol = color === 'gold' ? 'rgba(255,180,0,0.6)' : color === 'purple' ? 'rgba(160,60,255,0.6)' : 'rgba(68,255,200,0.6)';

  const widthMap = { wide: 160, med: 100, long: 200 };
  const heightMap = { wide: 42, med: 36, long: 44 };

  return (
    <motion.div
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      style={{
        cursor: disabled ? 'default' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minWidth: widthMap[size],
        height: heightMap[size],
        padding: '0 16px',
        backgroundImage: `url(${src})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        opacity: disabled ? 0.4 : 1,
        userSelect: 'none',
        filter: isActive && !disabled ? `brightness(1.2) drop-shadow(0 0 8px ${glowCol})` : 'brightness(1)',
        transition: 'filter 0.15s',
        ...style,
      }}
    >
      {icon && (
        <img
          src={icon}
          alt=""
          style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      {label && (
        <span
          style={{
            fontSize: size === 'long' ? 12 : size === 'wide' ? 11 : 10,
            fontWeight: 700,
            color: disabled ? '#556' : isActive ? '#fff' : textColor,
            letterSpacing: 1.5,
            textShadow: `0 1px 3px rgba(0,0,0,0.8)${isActive ? `, 0 0 10px ${glowCol}` : ''}`,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
      )}
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PROGRESS BARS — using sliced bar assets
// ═══════════════════════════════════════════════════════════════════════

export function SciFiBar({
  value,
  max,
  color = 'green',
  variant = 'progress',
  label,
  width,
  height,
}: {
  value: number;
  max: number;
  color?: SciFiColor;
  variant?: 'progress' | 'angled';
  label?: string;
  width?: number | string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(1, value / Math.max(max, 1)));
  const h = height ?? 22;
  const bgMap = {
    progress: `${S}/bar-progress${colorSuffix(color)}.png`,
    angled: `${S}/bar-angled${colorSuffix(color)}.png`,
  };
  const fillColor =
    color === 'gold'
      ? 'linear-gradient(90deg, #cc8800, #ffcc44)'
      : color === 'purple'
        ? 'linear-gradient(90deg, #8822cc, #cc66ff)'
        : 'linear-gradient(90deg, #22cc66, #44ff88)';
  const glowCol = color === 'gold' ? '#ffcc4466' : color === 'purple' ? '#cc66ff66' : '#44ff8866';

  return (
    <div style={{ position: 'relative', width: width ?? '100%', height: h }}>
      <img
        src={bgMap[variant]}
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      <motion.div
        animate={{ width: `${pct * 100}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          left: '4%',
          top: '15%',
          bottom: '15%',
          background: fillColor,
          borderRadius: 2,
          boxShadow: `0 0 8px ${glowCol}`,
        }}
      />
      {label && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontWeight: 700,
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.9)',
            zIndex: 1,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SLOTS — using sliced slot assets
// ═══════════════════════════════════════════════════════════════════════

export function SciFiSlot({
  children,
  size = 'md',
  color = 'green',
  active,
  onClick,
  style,
}: {
  children?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  color?: SciFiColor;
  active?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  style?: CSSProperties;
}) {
  const sizeMap = { sm: 'slot-sm', md: 'slot-md', lg: 'slot-lg' };
  const src = `${S}/${sizeMap[size]}${colorSuffix(color)}.png`;
  const px = { sm: 36, md: 52, lg: 72 };

  return (
    <motion.div
      onClick={onClick}
      whileHover={onClick ? { scale: 1.08 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      style={{
        width: px[size],
        height: px[size],
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url(${src})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        filter: active ? 'brightness(1.4) saturate(1.3)' : 'brightness(0.95)',
        transition: 'filter 0.15s',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// DECORATIVE ELEMENTS — corners, gems, tags, title chevrons, elements
// ═══════════════════════════════════════════════════════════════════════

/** Metallic corner decoration piece */
export function CornerDecor({
  color = 'green',
  position,
  size = 24,
}: {
  color?: SciFiColor;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: number;
}) {
  const src = `${S}/corner${colorSuffix(color)}.png`;
  const rotMap = { 'top-left': 0, 'top-right': 90, 'bottom-right': 180, 'bottom-left': 270 };
  const posMap: Record<string, CSSProperties> = {
    'top-left': { top: -2, left: -2 },
    'top-right': { top: -2, right: -2 },
    'bottom-left': { bottom: -2, left: -2 },
    'bottom-right': { bottom: -2, right: -2 },
  };

  return (
    <img
      src={src}
      alt=""
      style={{
        position: 'absolute',
        width: size,
        height: size,
        ...posMap[position],
        transform: `rotate(${rotMap[position]}deg)`,
        pointerEvents: 'none',
        zIndex: 2,
        opacity: 0.7,
      }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

/** Diamond / Triangle / Indicator gem — decorative accent */
export function GemIndicator({
  type = 'diamond',
  color = 'green',
  size = 20,
  glow,
  style,
}: {
  type?: 'diamond' | 'triangle' | 'indicator';
  color?: SciFiColor;
  size?: number;
  glow?: boolean;
  style?: CSSProperties;
}) {
  const fileMap = { diamond: 'gem-dia', triangle: 'gem-tri', indicator: 'gem-indicator' };
  const src = `${S}/${fileMap[type]}${colorSuffix(color)}.png`;
  const glowCol = color === 'gold' ? 'rgba(255,180,0,0.6)' : color === 'purple' ? 'rgba(160,60,255,0.6)' : 'rgba(68,255,200,0.6)';

  return (
    <img
      src={src}
      alt=""
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        filter: glow ? `drop-shadow(0 0 6px ${glowCol})` : undefined,
        ...style,
      }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

/** Small tag / label background */
export function TagLabel({ children, color = 'green', style }: { children: ReactNode; color?: SciFiColor; style?: CSSProperties }) {
  const src = `${S}/tag-sm${colorSuffix(color)}.png`;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url(${src})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        padding: '3px 14px',
        minWidth: 60,
        ...style,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: '#fff',
          letterSpacing: 1,
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </span>
    </div>
  );
}

/** Title chevron — ornamental header bar */
export function TitleChevron({ children, color = 'green', style }: { children: ReactNode; color?: SciFiColor; style?: CSSProperties }) {
  const src = `${S}/title-chevron${colorSuffix(color)}.png`;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url(${src})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        padding: '6px 36px',
        minWidth: 120,
        minHeight: 28,
        ...style,
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: '#fff',
          letterSpacing: 3,
          textShadow: '0 0 8px rgba(68,255,200,0.5), 0 1px 3px rgba(0,0,0,0.9)',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </span>
    </div>
  );
}

/** Decorative element overlays (1-3) */
export function ElementDecor({ variant = 1, width = 120, style }: { variant?: 1 | 2 | 3; width?: number; style?: CSSProperties }) {
  return (
    <img
      src={`${EL}/${variant}.png`}
      alt=""
      style={{
        width,
        objectFit: 'contain',
        pointerEvents: 'none',
        opacity: 0.6,
        ...style,
      }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ICON COMPONENTS — surfacing all icon packs
// ═══════════════════════════════════════════════════════════════════════

/** Skill icon from the SciFi GUI skill pack (1-13) */
export function SkillThumbIcon({ id, size = 40, style }: { id: number; size?: number; style?: CSSProperties }) {
  return (
    <img
      src={`${SKILL_THUMB}/${id}.png`}
      alt={`Skill ${id}`}
      style={{ width: size, height: size, objectFit: 'contain', ...style }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

/** Item thumbnail from SciFi GUI item pack (1-9) */
export function ItemThumbIcon({ id, size = 40, style }: { id: number; size?: number; style?: CSSProperties }) {
  return (
    <img
      src={`${ITEM_THUMB}/${id}.png`}
      alt={`Item ${id}`}
      style={{ width: size, height: size, objectFit: 'contain', ...style }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

/** Detailed skill icon from pack 1 (1-20) or pack 2 (1-20) */
export function SkillIcon({ pack = 1, id, size = 48, style }: { pack?: 1 | 2; id: number; size?: number; style?: CSSProperties }) {
  const dir = pack === 1 ? SKILL1 : SKILL2;
  return (
    <img
      src={`${dir}/${id}.png`}
      alt={`Skill ${pack}-${id}`}
      style={{ width: size, height: size, objectFit: 'contain', borderRadius: 4, ...style }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

/** Item icon from item-icons pack (1-20) */
export function ItemIcon({ id, size = 48, style }: { id: number; size?: number; style?: CSSProperties }) {
  return (
    <img
      src={`${ITEM_ICONS}/${id}.png`}
      alt={`Item ${id}`}
      style={{ width: size, height: size, objectFit: 'contain', borderRadius: 4, ...style }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

/** Space-themed icon (1-20) */
export function SpaceIcon({ id, size = 48, style }: { id: number; size?: number; style?: CSSProperties }) {
  return (
    <img
      src={`${SPACE_ICONS}/${id}.png`}
      alt={`Space ${id}`}
      style={{ width: size, height: size, objectFit: 'contain', borderRadius: 4, ...style }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

/** Resource icon (Icon39_01 to Icon39_40) */
export function ResourceIcon({ id, size = 24, style }: { id: number; size?: number; style?: CSSProperties }) {
  const padded = String(id).padStart(2, '0');
  return (
    <img
      src={`${RES_ICONS_DIR}/Icon39_${padded}.png`}
      alt={`Resource ${id}`}
      style={{ width: size, height: size, objectFit: 'contain', ...style }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

/** Mining icon (with or without background) */
export function MiningIcon({
  id,
  withBg = false,
  size = 40,
  style,
}: {
  id: number;
  withBg?: boolean;
  size?: number;
  style?: CSSProperties;
}) {
  const sub = withBg ? 'background' : 'without background';
  return (
    <img
      src={`${MINING_DIR}/${sub}/${id}.png`}
      alt={`Mining ${id}`}
      style={{ width: size, height: size, objectFit: 'contain', ...style }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

/** SciFi GUI avatar portrait */
export function AvatarIcon({ id, size = 48, style }: { id: number; size?: number; style?: CSSProperties }) {
  return (
    <img
      src={`${AVATAR_DIR}/${id}.png`}
      alt={`Avatar ${id}`}
      style={{ width: size, height: size, objectFit: 'cover', borderRadius: '50%', ...style }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ANIMATED WRAPPERS — framer-motion panel transitions
// ═══════════════════════════════════════════════════════════════════════

/** Animated overlay backdrop — fades in/out */
export function AnimatedOverlay({ children, onClick, visible = true }: { children: ReactNode; onClick?: () => void; visible?: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClick}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 170,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Animated slide-in panel — for side panels and drawers */
export function AnimatedSlidePanel({
  children,
  visible = true,
  from = 'right',
  width = 360,
}: {
  children: ReactNode;
  visible?: boolean;
  from?: 'left' | 'right';
  width?: number;
}) {
  const offset = from === 'right' ? width : -width;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: offset, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: offset, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: 0,
            bottom: 0,
            [from]: 0,
            width,
            zIndex: 180,
            pointerEvents: 'auto',
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// COMPOSITE COMPONENTS — higher-level UI assemblies
// ═══════════════════════════════════════════════════════════════════════

/** Icon slot — a SciFiSlot with an icon rendered inside */
export function IconSlot({
  iconSrc,
  label,
  color = 'green',
  size = 'md',
  active,
  onClick,
  badge,
}: {
  iconSrc?: string;
  label?: string;
  color?: SciFiColor;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  badge?: string | number;
}) {
  const iconSize = { sm: 20, md: 32, lg: 48 };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <SciFiSlot size={size} color={color} active={active} onClick={onClick} style={{ position: 'relative' }}>
        {iconSrc && (
          <img
            src={iconSrc}
            alt=""
            style={{ width: iconSize[size], height: iconSize[size], objectFit: 'contain' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        {badge != null && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: color === 'gold' ? '#cc8800' : color === 'purple' ? '#8822cc' : '#22aa66',
              color: '#fff',
              fontSize: 7,
              fontWeight: 700,
              padding: '1px 4px',
              borderRadius: 3,
              lineHeight: 1.2,
            }}
          >
            {badge}
          </div>
        )}
      </SciFiSlot>
      {label && (
        <span
          style={{
            fontSize: 8,
            color: 'rgba(160,200,255,0.6)',
            textAlign: 'center',
            maxWidth: 60,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

/** Resource display row — using resource icon + sliced tag background */
export function ResourceDisplay({
  iconId,
  value,
  rate,
  label,
  color = 'green',
}: {
  iconId: number;
  value: number;
  rate?: number;
  label?: string;
  color?: SciFiColor;
}) {
  const textColor = color === 'gold' ? '#ffcc44' : color === 'purple' ? '#cc66ff' : '#44ff88';
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        backgroundImage: `url(${S}/tag-sm${colorSuffix(color)}.png)`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        padding: '4px 14px 4px 8px',
        minWidth: 100,
      }}
    >
      <ResourceIcon id={iconId} size={18} />
      <span style={{ color: textColor, fontWeight: 700, fontSize: 12, minWidth: 40, textAlign: 'right' }}>{value.toLocaleString()}</span>
      {rate != null && rate > 0 && <span style={{ fontSize: 8, color: '#44dd88', opacity: 0.8, marginLeft: 2 }}>+{Math.round(rate)}</span>}
      {label && <span style={{ fontSize: 8, color: 'rgba(160,200,255,0.4)', marginLeft: 2 }}>{label}</span>}
    </div>
  );
}

/** Section divider with element decoration */
export function SectionDivider({ color = 'green' }: { color?: SciFiColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
      <GemIndicator type="diamond" color={color} size={10} />
      <div
        style={{
          flex: 1,
          height: 1,
          background:
            color === 'gold'
              ? 'linear-gradient(90deg, rgba(255,180,0,0.4), transparent)'
              : color === 'purple'
                ? 'linear-gradient(90deg, rgba(160,60,255,0.4), transparent)'
                : 'linear-gradient(90deg, rgba(68,255,200,0.4), transparent)',
        }}
      />
      <GemIndicator type="triangle" color={color} size={8} />
      <div
        style={{
          flex: 1,
          height: 1,
          background:
            color === 'gold'
              ? 'linear-gradient(270deg, rgba(255,180,0,0.4), transparent)'
              : color === 'purple'
                ? 'linear-gradient(270deg, rgba(160,60,255,0.4), transparent)'
                : 'linear-gradient(270deg, rgba(68,255,200,0.4), transparent)',
        }}
      />
      <GemIndicator type="diamond" color={color} size={10} />
    </div>
  );
}
