/**
 * ui-lib.tsx — Image-based UI component library for Gruda Armada
 *
 * Every component renders using real game art PNGs from the HUD/scifi-gui packs.
 * No plain CSS boxes — everything has metallic frames, glowing edges, and proper
 * hover states from the asset kit.
 *
 * Asset paths (all under /assets/space/ui/):
 *   hud/BoxMenu.png          — Large panel background
 *   hud/Shop_Box.png         — Medium panel background
 *   hud/Box_Item.png         — Card/closeable panel frame
 *   hud/Normal_Btn.png       — Button (normal)
 *   hud/Hover_Btn.png        — Button (hover/active)
 *   hud/Disable_Btn.png      — Button (disabled)
 *   hud/Normal_LongBtn.png   — Wide button (normal)
 *   hud/Hover_LongBtn.png    — Wide button (hover)
 *   hud/Disable_LongBtn.png  — Wide button (disabled)
 *   hud/TitleBox.png         — Title banner with orbs
 *   hud/InventorySlot.png    — Hex item/ability slot
 *   hud/HealthBar.png        — Gradient fill bar
 *   hud/HealthBar_Line.png   — Bar background track
 *   hud/CrystalBarHUD.png    — Resource bar fill
 *   hud/CloseBtn.png         — Close button
 *   hud/BgHudBar.png         — Top bar background
 *   hud/BgSettingSmallBox.png— Small panel bg
 *   hud/DarkBackground.png   — Dark overlay
 */

import React, { useState, type ReactNode, type CSSProperties } from 'react';

const H = '/assets/space/ui/hud';
const G = '/assets/space/ui/scifi-gui';

// Color variants for premium panels: green=player, purple=special, gold=hero
type PanelVariant = 'green' | 'purple' | 'gold';
const INVENTORY_BG: Record<PanelVariant, string> = {
  green: `${G}/inventory/1.png`,
  purple: `${G}/inventory/2.png`,
  gold: `${G}/inventory/3.png`,
};

// ── Panel: premium metallic sci-fi frame with optional title ─────────
export function Panel({
  title,
  children,
  width,
  style,
  onClose,
  variant,
}: {
  title?: string;
  children: ReactNode;
  width?: number | string;
  style?: CSSProperties;
  onClose?: () => void;
  variant?: PanelVariant;
}) {
  const bg = variant ? INVENTORY_BG[variant] : `${H}/BoxMenu.png`;
  return (
    <div
      style={{
        position: 'relative',
        width: width ?? 'auto',
        backgroundImage: `url(${bg})`,
        backgroundSize: '100% 100%',
        padding: variant ? '50px 32px 36px' : '12px 16px 16px',
        minHeight: 120,
        overflow: 'hidden',
        filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.7))',
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            position: 'absolute',
            top: variant ? 6 : 0,
            left: variant ? 28 : 0,
            right: variant ? 50 : 0,
            textAlign: 'center',
          }}
        >
          {!variant && (
            <img
              src={`${H}/TitleBox.png`}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'fill',
              }}
            />
          )}
          <span
            style={{
              position: 'relative',
              zIndex: 1,
              fontSize: 13,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: 3,
              textTransform: 'uppercase',
              textShadow: variant
                ? `0 0 12px ${variant === 'gold' ? 'rgba(255,180,0,0.6)' : variant === 'purple' ? 'rgba(180,80,255,0.6)' : 'rgba(68,255,200,0.6)'}`
                : '0 0 8px rgba(68,255,200,0.5)',
              padding: '8px 0',
              display: 'block',
            }}
          >
            {title}
          </span>
        </div>
      )}
      {onClose && (
        <img
          src={`${H}/CloseBtn.png`}
          alt="Close"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: variant ? 8 : 8,
            right: variant ? 10 : 8,
            width: 26,
            height: 26,
            cursor: 'pointer',
            zIndex: 10,
            filter: 'brightness(0.9)',
            transition: 'filter 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.3)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(0.9)')}
        />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ── SmallPanel: uses Shop_Box for narrower panels ──────────────────
export function SmallPanel({ title, children, style }: { title?: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        backgroundImage: `url(${H}/Shop_Box.png)`,
        backgroundSize: '100% 100%',
        padding: '10px 14px 14px',
        position: 'relative',
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#b8e0d0',
            letterSpacing: 2,
            textAlign: 'center',
            marginBottom: 8,
            textTransform: 'uppercase',
            textShadow: '0 0 6px rgba(68,255,200,0.4)',
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Btn: sprite-canvas button — background-image for proper text centering ──
export function Btn({
  label,
  onClick,
  disabled,
  active,
  wide,
  icon,
  style,
  children,
}: {
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  wide?: boolean;
  icon?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const prefix = wide ? 'Long' : '';
  const src = disabled
    ? `${H}/Disable_${prefix}Btn.png`
    : hovered || active
      ? `${H}/Hover_${prefix}Btn.png`
      : `${H}/Normal_${prefix}Btn.png`;

  return (
    <div
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: disabled ? 'default' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        minWidth: wide ? 140 : 64,
        height: wide ? 38 : 36,
        padding: '0 12px',
        backgroundImage: `url(${src})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        transition: 'transform 0.1s',
        transform: hovered && !disabled ? 'scale(1.05)' : 'scale(1)',
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none',
        ...style,
      }}
    >
      {icon && (
        <img
          src={icon}
          alt=""
          style={{ width: 16, height: 16, imageRendering: 'auto', flexShrink: 0 }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      {label && (
        <span
          style={{
            fontSize: wide ? 11 : 10,
            fontWeight: 700,
            color: active ? '#fff' : disabled ? '#556' : '#c8e8dc',
            letterSpacing: 1,
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

// ── Slot: hexagonal item/ability frame — sprite as background ─────────
export function Slot({
  children,
  size,
  onClick,
  active,
  style,
}: {
  children?: ReactNode;
  size?: number;
  onClick?: (e: React.MouseEvent) => void;
  active?: boolean;
  style?: CSSProperties;
}) {
  const sz = size ?? 52;
  return (
    <div
      onClick={onClick}
      style={{
        width: sz,
        height: sz,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url(${H}/InventorySlot.png)`,
        backgroundSize: '100% 100%',
        filter: active ? 'brightness(1.4) hue-rotate(60deg)' : 'brightness(0.9)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Bar: image-based health/progress bar ────────────────────────────
export function Bar({
  value,
  max,
  color,
  height,
  width,
  label,
}: {
  value: number;
  max: number;
  color?: string;
  height?: number;
  width?: number | string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(1, value / Math.max(max, 1)));
  const h = height ?? 14;
  return (
    <div style={{ position: 'relative', width: width ?? '100%', height: h }}>
      <img
        src={`${H}/HealthBar_Line.png`}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          opacity: 0.6,
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
          width: `${pct * 100}%`,
          background: color ?? `linear-gradient(90deg, #22cc66, #44ff88)`,
          borderRadius: 2,
          transition: 'width 0.2s',
          boxShadow: `0 0 6px ${color ?? '#44ff88'}66`,
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
            fontSize: 8,
            fontWeight: 700,
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            zIndex: 1,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// ── Frame: closeable floating panel (uses Box_Item.png) ─────────────
export function Frame({
  title,
  children,
  onClose,
  width,
  style,
}: {
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  width?: number | string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: 'relative',
        width: width ?? 'auto',
        backgroundImage: `url(${H}/Box_Item.png)`,
        backgroundSize: '100% 100%',
        padding: '36px 16px 16px',
        minHeight: 80,
        boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 40,
            right: 40,
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 800,
            color: '#b8f0e0',
            letterSpacing: 2,
            textTransform: 'uppercase',
            textShadow: '0 0 8px rgba(68,255,200,0.4)',
          }}
        >
          {title}
        </div>
      )}
      {onClose && (
        <img
          src={`${H}/CloseBtn.png`}
          alt="Close"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 4,
            left: 4,
            width: 24,
            height: 24,
            cursor: 'pointer',
            zIndex: 10,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.3)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(0.9)')}
        />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ── ResBox: compact resource display with icon ──────────────────────
export function ResBox({ icon, value, rate, color }: { icon: ReactNode; value: number; rate?: number; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        backgroundImage: `url(${H}/BgSettingSmallBox.png)`,
        backgroundSize: '100% 100%',
        padding: '3px 10px 3px 6px',
        borderRadius: 4,
        minWidth: 90,
      }}
    >
      <div style={{ width: 18, height: 18, flexShrink: 0 }}>{icon}</div>
      <span style={{ color, fontWeight: 700, fontSize: 13, minWidth: 40, textAlign: 'right' }}>{value.toLocaleString()}</span>
      {rate != null && rate > 0 && <span style={{ fontSize: 8, color: '#44dd88', opacity: 0.8, marginLeft: 2 }}>+{Math.round(rate)}</span>}
    </div>
  );
}

// ── Tooltip: styled hover popup with game-art background ───────────
export function Tooltip({
  text,
  title,
  children,
  position = 'top',
}: {
  text: string;
  title?: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}) {
  const [show, setShow] = useState(false);
  const posStyle: CSSProperties =
    position === 'top'
      ? { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 }
      : position === 'bottom'
        ? { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 }
        : position === 'right'
          ? { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 6 }
          : { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 6 };
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div
          style={{
            position: 'absolute',
            zIndex: 9999,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            backgroundImage: `url(${H}/BgSettingSmallBox.png)`,
            backgroundSize: '100% 100%',
            padding: '6px 12px',
            minWidth: 80,
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.7))',
            ...posStyle,
          }}
        >
          {title && (
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#fff',
                letterSpacing: 1,
                marginBottom: 2,
                textShadow: '0 0 6px rgba(68,255,200,0.4)',
              }}
            >
              {title}
            </div>
          )}
          <div style={{ fontSize: 9, color: 'rgba(160,200,255,0.8)', lineHeight: 1.4 }}>{text}</div>
        </div>
      )}
    </div>
  );
}

// ── Img helper: loads with fallback ─────────────────────────────────
export function Img({ src, alt, style, fallback }: { src: string; alt?: string; style?: CSSProperties; fallback?: ReactNode }) {
  const [err, setErr] = useState(false);
  if (err && fallback) return <>{fallback}</>;
  return <img src={src} alt={alt ?? ''} style={style} onError={() => setErr(true)} />;
}
