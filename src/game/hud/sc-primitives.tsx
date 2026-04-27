/**
 * sc-primitives.tsx — shared building blocks for the SC-style HUD.
 *
 * Every primitive is intentionally low-API and unstyled-by-default
 * (`style` prop forwarded) so the layout shell can override anything
 * without forking the component. They all read tokens from `sc-tokens.ts`
 * so colour / spacing tweaks live in one file.
 *
 * Components:
 *   - <Mfd>           cockpit-style multi-function display (header + body)
 *   - <StatusChip>    pill chip for top status bar values (icon + value)
 *   - <Bar>           horizontal progress bar with optional tick marks
 *   - <RailIcon>      square icon button for the right command rail
 *   - <ToastStream>   bottom-center auto-dismiss notifications
 *   - <AngledFrame>   wraps children with sharp 45° corner cuts (clip-path)
 */

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { SC } from './sc-tokens';

// ── Mfd ─────────────────────────────────────────────────────────────
interface MfdProps {
  title: string;
  /** Right-aligned status text (e.g. 'ARMED', '03:21'). */
  status?: string;
  statusTone?: 'accent' | 'warn' | 'alert' | 'ok' | 'dim';
  children?: ReactNode;
  style?: CSSProperties;
  onHeaderClick?: () => void;
}
export function Mfd({ title, status, statusTone = 'accent', children, style, onHeaderClick }: MfdProps) {
  const tone =
    statusTone === 'accent'
      ? SC.accent
      : statusTone === 'warn'
        ? SC.warn
        : statusTone === 'alert'
          ? SC.alert
          : statusTone === 'ok'
            ? SC.ok
            : SC.textDim;
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        height: '100%',
        background: SC.surface,
        border: SC.borderSoft,
        borderRadius: SC.radius,
        boxShadow: SC.panelShadow,
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      <div
        onClick={onHeaderClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          borderBottom: SC.borderSoft,
          fontFamily: SC.font,
          fontSize: 9,
          letterSpacing: SC.labelLetterSpacing,
          color: SC.accent,
          cursor: onHeaderClick ? 'pointer' : 'default',
          userSelect: 'none',
        }}
      >
        <span style={{ fontWeight: 800 }}>{title}</span>
        {status && <span style={{ color: tone, letterSpacing: 1.5 }}>{status}</span>}
      </div>
      <div
        style={{
          flex: 1,
          padding: '8px 10px',
          fontFamily: SC.font,
          fontSize: 11,
          color: SC.text,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── StatusChip ──────────────────────────────────────────────────────
interface StatusChipProps {
  icon?: string;
  label: string;
  value: string | number;
  tone?: 'default' | 'warn' | 'alert' | 'ok';
  style?: CSSProperties;
}
export function StatusChip({ icon, label, value, tone = 'default', style }: StatusChipProps) {
  const valColor = tone === 'warn' ? SC.warn : tone === 'alert' ? SC.alert : tone === 'ok' ? SC.ok : SC.text;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 12px',
        height: '100%',
        borderRight: SC.borderGhost,
        fontFamily: SC.font,
        ...style,
      }}
    >
      {icon && <span style={{ fontSize: 14, opacity: 0.85 }}>{icon}</span>}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span style={{ fontSize: 8, letterSpacing: 2, color: SC.textDim, textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: SC.digitWeight, color: valColor }}>{value}</span>
      </div>
    </div>
  );
}

// ── Bar ─────────────────────────────────────────────────────────────
interface BarProps {
  /** 0..1 fill ratio */
  value: number;
  label?: string;
  /** Optional right-aligned numeric readout. */
  readout?: string;
  tone?: 'accent' | 'warn' | 'alert' | 'ok';
  /** Show chevron tick marks underneath the bar (10 ticks). */
  ticks?: boolean;
  style?: CSSProperties;
}
export function Bar({ value, label, readout, tone = 'accent', ticks = false, style }: BarProps) {
  const v = Math.max(0, Math.min(1, value));
  const c = tone === 'warn' ? SC.warn : tone === 'alert' ? SC.alert : tone === 'ok' ? SC.ok : SC.accent;
  return (
    <div style={{ fontFamily: SC.font, ...style }}>
      {(label || readout) && (
        <div
          style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, letterSpacing: 1.5, color: SC.textDim, marginBottom: 2 }}
        >
          <span>{label}</span>
          <span style={{ color: c, fontWeight: 700 }}>{readout}</span>
        </div>
      )}
      <div
        style={{
          position: 'relative',
          height: 6,
          background: 'rgba(0,0,0,0.55)',
          border: SC.borderSoft,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${v * 100}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${c}55, ${c})`,
            boxShadow: `0 0 6px ${c}66`,
            transition: 'width 0.18s ease-out',
          }}
        />
      </div>
      {ticks && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} style={{ width: 1, height: 4, background: i / 10 < v ? c : 'rgba(255,255,255,0.12)' }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── RailIcon ────────────────────────────────────────────────────────
interface RailIconProps {
  icon: string;
  label?: string;
  active?: boolean;
  warn?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}
export function RailIcon({ icon, label, active, warn, onClick, style }: RailIconProps) {
  const accent = warn ? SC.warn : SC.accent;
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: SC.railW - 12,
        height: SC.railW - 12,
        borderRadius: SC.radiusChip,
        background: active ? SC.surfaceAccent : SC.surface,
        border: active ? `1px solid ${accent}` : SC.borderSoft,
        color: active ? accent : SC.text,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        fontFamily: SC.font,
        fontSize: 8,
        letterSpacing: 1,
        boxShadow: active ? SC.glowAccent : 'none',
        transition: 'all 0.12s',
        ...style,
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      {label && <span style={{ color: active ? accent : SC.textDim }}>{label}</span>}
    </button>
  );
}

// ── Toast / ToastStream ─────────────────────────────────────────────
export interface SCToast {
  id: number;
  text: string;
  tone?: 'default' | 'warn' | 'alert' | 'ok';
  /** Optional icon / glyph. */
  icon?: string;
}

interface ToastStreamProps {
  toasts: SCToast[];
  onDismiss: (id: number) => void;
  /** ms before auto-dismiss (default 3000). */
  durationMs?: number;
}
export function ToastStream({ toasts, onDismiss, durationMs = 3000 }: ToastStreamProps) {
  // Mount each toast with a self-dismiss timer.
  return (
    <div
      style={{
        position: 'absolute',
        bottom: SC.mfdH + 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        alignItems: 'center',
        zIndex: 30,
        pointerEvents: 'none',
      }}
    >
      {toasts.slice(-4).map((t) => (
        <ToastChip key={t.id} toast={t} onExpire={() => onDismiss(t.id)} durationMs={durationMs} />
      ))}
    </div>
  );
}
function ToastChip({ toast, onExpire, durationMs }: { toast: SCToast; onExpire: () => void; durationMs: number }) {
  useEffect(() => {
    const t = window.setTimeout(onExpire, durationMs);
    return () => window.clearTimeout(t);
  }, [onExpire, durationMs]);
  const tone = toast.tone === 'warn' ? SC.warn : toast.tone === 'alert' ? SC.alert : toast.tone === 'ok' ? SC.ok : SC.accent;
  const surf = toast.tone === 'warn' ? SC.surfaceWarn : toast.tone === 'alert' ? SC.surfaceAlert : SC.surfaceAccent;
  return (
    <div
      style={{
        padding: '6px 14px',
        borderRadius: SC.radiusChip,
        background: surf,
        border: `1px solid ${tone}`,
        color: tone,
        fontFamily: SC.font,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: 'uppercase',
        boxShadow: SC.glowAccent,
        animation: 'sc-toast-in 0.18s ease-out',
      }}
    >
      {toast.icon && <span style={{ marginRight: 6 }}>{toast.icon}</span>}
      {toast.text}
    </div>
  );
}

// ── AngledFrame (45° corner cuts, mobiGlas-style) ──────────────────
interface AngledFrameProps {
  children: ReactNode;
  /** Corner cut size in px. */
  cut?: number;
  /** Tone overrides border colour. */
  tone?: 'accent' | 'warn' | 'alert';
  style?: CSSProperties;
}
export function AngledFrame({ children, cut = 8, tone = 'accent', style }: AngledFrameProps) {
  const border = tone === 'warn' ? SC.borderWarn : tone === 'alert' ? SC.borderAlert : SC.borderAccent;
  return (
    <div
      style={{
        position: 'relative',
        background: SC.surface,
        border,
        boxShadow: SC.panelShadow,
        clipPath: `polygon(${cut}px 0, 100% 0, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, 0 100%, 0 ${cut}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Convenience hook for short-lived toast queue ────────────────────
export function useToastQueue(): [SCToast[], (t: Omit<SCToast, 'id'>) => void, (id: number) => void] {
  const [toasts, setToasts] = useState<SCToast[]>([]);
  const push = (t: Omit<SCToast, 'id'>) => setToasts((q) => [...q, { ...t, id: Date.now() + Math.random() }]);
  const dismiss = (id: number) => setToasts((q) => q.filter((t) => t.id !== id));
  return [toasts, push, dismiss];
}
