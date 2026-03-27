/**
 * HotkeySettings.tsx — Editable hotkey configuration panel.
 *
 * UX:
 *   • Four tabs across the top: RTS Camera | RTS Commands | HUD Panels | Ground Combat
 *   • Each row: action label + description + key badge
 *   • Click the key badge → it pulses orange and shows "Press any key…"
 *   • Next keypress (excluding Escape which cancels) binds the key
 *   • Conflict: if the same key is already used by another action in ANY
 *     category, both rows highlight red and show a small warning tooltip
 *   • Reset Category resets just the visible tab; Reset All resets everything
 *   • All changes auto-save to localStorage on every edit
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  HOTKEY_DEFS,
  HotkeyAction,
  HotkeyCategory,
  getKey,
  setKey,
  findConflicts,
  resetAllHotkeys,
  resetCategoryHotkeys,
  keyDisplayName,
  DEFAULT_KEYS,
} from './hotkeys';

// ── Tab definitions ───────────────────────────────────────────────
const TABS: { id: string; label: string; categories: HotkeyCategory[] }[] = [
  {
    id: 'rts_camera',
    label: 'Camera',
    categories: ['Space RTS — Camera'],
  },
  {
    id: 'rts_commands',
    label: 'Commands & Abilities',
    categories: ['Space RTS — Commands', 'Space RTS — Abilities', 'Space RTS — Bookmarks'],
  },
  {
    id: 'hud',
    label: 'HUD Panels',
    categories: ['HUD Panels'],
  },
  {
    id: 'ground',
    label: 'Ground Combat',
    categories: ['Ground Combat'],
  },
];

interface Props {
  onClose: () => void;
}

export function HotkeySettings({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [listening, setListening] = useState<HotkeyAction | null>(null);
  /** Force re-render after a key change */
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);

  // Focus trap — catch keypress when in listen mode
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listening) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const k = e.key.toLowerCase();
      if (k === 'escape') {
        // Cancel without changing
        setListening(null);
        return;
      }
      // Ignore pure modifier keys
      if (['shift', 'control', 'alt', 'meta'].includes(k)) return;
      setKey(listening, k);
      setListening(null);
      refresh();
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [listening, refresh]);

  const activeCategories = TABS.find((t) => t.id === activeTab)?.categories ?? [];
  const visibleDefs = HOTKEY_DEFS.filter((d) => activeCategories.includes(d.category));

  // Build conflict map: action → conflict label if any
  const conflictMap = new Map<HotkeyAction, string>();
  for (const def of HOTKEY_DEFS) {
    const conflicts = findConflicts(def.action);
    if (conflicts.length > 0) {
      const labels = conflicts.map((a) => {
        const d = HOTKEY_DEFS.find((x) => x.action === a);
        return d ? `${d.label} (${d.category})` : a;
      });
      conflictMap.set(def.action, `Conflict with: ${labels.join(', ')}`);
    }
  }

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.88)',
        fontFamily: "'Segoe UI', monospace",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setListening(null);
          onClose();
        }
      }}
    >
      <div
        style={{
          width: 680,
          maxWidth: '96vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(4,10,22,0.98)',
          border: '1px solid rgba(255,200,100,0.2)',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(0,0,0,0.8)',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 20px 10px',
            borderBottom: '1px solid rgba(255,200,100,0.1)',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 900, color: '#ffcc44', letterSpacing: 3 }}>HOTKEY SETTINGS</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: 'rgba(200,180,120,0.4)' }}>Click a key badge, then press the new key</span>
          <div
            onClick={onClose}
            style={{
              cursor: 'pointer',
              color: 'rgba(200,180,120,0.5)',
              fontSize: 18,
              lineHeight: 1,
              padding: '0 4px',
            }}
          >
            ✕
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            borderBottom: '1px solid rgba(255,200,100,0.1)',
          }}
        >
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            // Count conflicts in this tab
            const tabDefs = HOTKEY_DEFS.filter((d) => tab.categories.includes(d.category));
            const hasConflict = tabDefs.some((d) => conflictMap.has(d.action));
            return (
              <div
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setListening(null);
                }}
                style={{
                  padding: '10px 18px',
                  fontSize: 11,
                  fontWeight: isActive ? 800 : 500,
                  color: isActive ? '#ffcc44' : 'rgba(200,180,120,0.5)',
                  background: isActive ? 'rgba(255,200,100,0.06)' : 'transparent',
                  borderBottom: isActive ? '2px solid #ffcc44' : '2px solid transparent',
                  cursor: 'pointer',
                  letterSpacing: 1,
                  transition: 'all 0.12s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {tab.label}
                {hasConflict && <span style={{ color: '#ff4444', fontSize: 14, lineHeight: 1 }}>⚠</span>}
              </div>
            );
          })}
        </div>

        {/* ── Rows ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {/* Group by category within the tab */}
          {activeCategories.map((cat) => {
            const catDefs = visibleDefs.filter((d) => d.category === cat);
            if (catDefs.length === 0) return null;
            return (
              <div key={cat}>
                {/* Category sub-header */}
                {activeCategories.length > 1 && (
                  <div
                    style={{
                      padding: '8px 20px 4px',
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: 2,
                      color: 'rgba(255,200,100,0.35)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {cat}
                  </div>
                )}
                {catDefs.map((def) => {
                  const currentKey = getKey(def.action);
                  const defaultKey = DEFAULT_KEYS[def.action];
                  const isListening = listening === def.action;
                  const conflict = conflictMap.get(def.action);
                  const isDefault = currentKey === defaultKey;

                  return (
                    <div
                      key={def.action}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 20px',
                        gap: 12,
                        borderLeft: conflict
                          ? '3px solid rgba(255,68,68,0.6)'
                          : isListening
                            ? '3px solid rgba(255,200,100,0.6)'
                            : '3px solid transparent',
                        background: isListening ? 'rgba(255,200,100,0.04)' : conflict ? 'rgba(255,68,68,0.03)' : 'transparent',
                        transition: 'all 0.12s',
                      }}
                    >
                      {/* Label + description */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: conflict ? '#ff8888' : '#e0d8c0' }}>
                          {def.label}
                          {def.continuous && (
                            <span style={{ marginLeft: 6, fontSize: 8, color: 'rgba(200,180,120,0.35)', fontWeight: 400 }}>HELD</span>
                          )}
                        </div>
                        <div style={{ fontSize: 9, color: 'rgba(200,180,120,0.4)', marginTop: 1 }}>{def.description}</div>
                        {conflict && <div style={{ fontSize: 8, color: '#ff6666', marginTop: 2 }}>⚠ {conflict}</div>}
                      </div>

                      {/* Default badge — shown if customised */}
                      {!isDefault && (
                        <div
                          title={`Default: ${keyDisplayName(defaultKey)}`}
                          style={{
                            fontSize: 9,
                            color: 'rgba(200,180,120,0.3)',
                            padding: '2px 5px',
                            borderRadius: 3,
                            border: '1px solid rgba(200,180,120,0.15)',
                          }}
                        >
                          {keyDisplayName(defaultKey)}
                        </div>
                      )}

                      {/* Key badge — click to listen */}
                      <div
                        onClick={() => setListening(isListening ? null : def.action)}
                        title={isListening ? 'Press any key to bind, Escape to cancel' : 'Click to rebind'}
                        style={{
                          minWidth: 52,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: isListening ? 9 : 12,
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          letterSpacing: 1,
                          userSelect: 'none',
                          transition: 'all 0.15s',
                          background: isListening ? 'rgba(255,200,100,0.15)' : conflict ? 'rgba(255,68,68,0.12)' : 'rgba(255,200,100,0.06)',
                          border: isListening
                            ? '2px solid #ffcc44'
                            : conflict
                              ? '2px solid rgba(255,68,68,0.5)'
                              : '2px solid rgba(255,200,100,0.18)',
                          color: isListening ? '#ffcc44' : conflict ? '#ff8888' : '#e0d8c0',
                          animation: isListening ? 'hotkey-pulse 1s ease-in-out infinite' : 'none',
                          padding: '0 6px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isListening ? '⌨ key…' : keyDisplayName(currentKey)}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '10px 20px',
            borderTop: '1px solid rgba(255,200,100,0.1)',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 9, color: 'rgba(200,180,120,0.3)', flex: 1 }}>Changes save automatically · Escape cancels rebind</span>
          <FooterBtn
            label="Reset Tab"
            onClick={() => {
              const tab = TABS.find((t) => t.id === activeTab);
              tab?.categories.forEach((c) => resetCategoryHotkeys(c));
              refresh();
            }}
          />
          <FooterBtn
            label="Reset All"
            danger
            onClick={() => {
              resetAllHotkeys();
              refresh();
            }}
          />
          <FooterBtn label="Close" active onClick={onClose} />
        </div>
      </div>

      {/* Pulse animation for listening mode */}
      <style>{`
        @keyframes hotkey-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}

function FooterBtn({ label, onClick, active, danger }: { label: string; onClick: () => void; active?: boolean; danger?: boolean }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1,
        background: active ? 'rgba(255,200,100,0.12)' : danger ? 'rgba(255,68,68,0.08)' : 'rgba(255,255,255,0.04)',
        border: active ? '1px solid rgba(255,200,100,0.4)' : danger ? '1px solid rgba(255,68,68,0.3)' : '1px solid rgba(255,255,255,0.1)',
        color: active ? '#ffcc44' : danger ? '#ff8888' : 'rgba(200,180,120,0.6)',
        transition: 'all 0.12s',
      }}
    >
      {label}
    </div>
  );
}
