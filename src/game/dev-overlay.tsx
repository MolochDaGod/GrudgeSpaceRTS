/**
 * dev-overlay.tsx — Admin UI tweaker overlay
 *
 * Toggle with backtick (`) key. Provides live controls for:
 *  - Global UI scale (0.5× – 2.0×)
 *  - Font family selection
 *  - Base font size
 *  - Element outline mode (see all positioned boxes)
 *  - Grid overlay (alignment helper)
 *  - Bottom/top panel height tweaks
 *
 * All values persist in localStorage. The overlay injects a <style> tag
 * that applies CSS variables to :root, so every component picks them up.
 */

import { useState, useEffect, useCallback } from 'react';

const LS_KEY = 'gruda-dev-ui';

interface DevSettings {
  uiScale: number;
  fontFamily: string;
  fontSize: number;
  showOutlines: boolean;
  showGrid: boolean;
  topBarHeight: number;
  bottomBarHeight: number;
}

const DEFAULTS: DevSettings = {
  uiScale: 1.0,
  fontFamily: "'Segoe UI', monospace",
  fontSize: 13,
  showOutlines: false,
  showGrid: false,
  topBarHeight: 52,
  bottomBarHeight: 240,
};

const FONTS = [
  "'Segoe UI', monospace",
  "'Courier New', monospace",
  'monospace',
  "'Consolas', monospace",
  "'Arial', sans-serif",
  "'Verdana', sans-serif",
  "'Georgia', serif",
  "'Press Start 2P', monospace",
  "'VT323', monospace",
  'system-ui, sans-serif',
];

function load(): DevSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULTS };
}

function save(s: DevSettings) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function DevOverlay() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<DevSettings>(load);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: 8, y: 60 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Toggle with backtick
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '`' && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Apply settings to DOM
  useEffect(() => {
    save(settings);
    // Inject/update CSS variables
    let style = document.getElementById('dev-overlay-style') as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = 'dev-overlay-style';
      document.head.appendChild(style);
    }
    style.textContent = `
      :root {
        --dev-ui-scale: ${settings.uiScale};
        --dev-font-family: ${settings.fontFamily};
        --dev-font-size: ${settings.fontSize}px;
        --dev-top-bar-h: ${settings.topBarHeight}px;
        --dev-bottom-bar-h: ${settings.bottomBarHeight}px;
      }
      ${
        settings.showOutlines
          ? `
        [style*="position"] { outline: 1px dashed rgba(255,0,255,0.3) !important; }
        div[style*="absolute"], div[style*="relative"], div[style*="fixed"] {
          outline: 1px solid rgba(0,255,255,0.25) !important;
        }
      `
          : ''
      }
      ${
        settings.showGrid
          ? `
        body::after {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 99999;
          background-image:
            linear-gradient(rgba(68,136,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(68,136,255,0.08) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `
          : ''
      }
    `;
  }, [settings]);

  const update = useCallback((patch: Partial<DevSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  // Drag panel
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'SELECT') return;
    setDragging(true);
    setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, dragStart]);

  if (!open) return null;

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 100000,
        width: 280,
        background: 'rgba(4,10,22,0.97)',
        border: '1px solid #4488ff',
        borderRadius: 8,
        padding: 12,
        color: '#cde',
        fontFamily: "'Segoe UI', monospace",
        fontSize: 11,
        cursor: dragging ? 'grabbing' : 'grab',
        boxShadow: '0 4px 30px rgba(0,0,0,0.8)',
        userSelect: 'none',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#4488ff', letterSpacing: 2 }}>DEV UI</span>
        <span style={{ fontSize: 8, color: 'rgba(160,200,255,0.4)' }}>` to toggle · drag to move</span>
      </div>

      {/* UI Scale */}
      <Row label={`SCALE: ${settings.uiScale.toFixed(2)}×`}>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.05"
          value={settings.uiScale}
          onChange={(e) => update({ uiScale: +e.target.value })}
          style={sliderStyle}
        />
      </Row>

      {/* Font Family */}
      <Row label="FONT">
        <select value={settings.fontFamily} onChange={(e) => update({ fontFamily: e.target.value })} style={selectStyle}>
          {FONTS.map((f) => (
            <option key={f} value={f}>
              {f.split(',')[0].replace(/'/g, '')}
            </option>
          ))}
        </select>
      </Row>

      {/* Font Size */}
      <Row label={`SIZE: ${settings.fontSize}px`}>
        <input
          type="range"
          min="8"
          max="20"
          step="1"
          value={settings.fontSize}
          onChange={(e) => update({ fontSize: +e.target.value })}
          style={sliderStyle}
        />
      </Row>

      {/* Top Bar Height */}
      <Row label={`TOP BAR: ${settings.topBarHeight}px`}>
        <input
          type="range"
          min="32"
          max="80"
          step="2"
          value={settings.topBarHeight}
          onChange={(e) => update({ topBarHeight: +e.target.value })}
          style={sliderStyle}
        />
      </Row>

      {/* Bottom Bar Height */}
      <Row label={`BOTTOM: ${settings.bottomBarHeight}px`}>
        <input
          type="range"
          min="160"
          max="360"
          step="4"
          value={settings.bottomBarHeight}
          onChange={(e) => update({ bottomBarHeight: +e.target.value })}
          style={sliderStyle}
        />
      </Row>

      {/* Toggles */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Toggle label="OUTLINES" active={settings.showOutlines} onClick={() => update({ showOutlines: !settings.showOutlines })} />
        <Toggle label="GRID" active={settings.showGrid} onClick={() => update({ showGrid: !settings.showGrid })} />
      </div>

      {/* Reset */}
      <button
        onClick={() => setSettings({ ...DEFAULTS })}
        style={{
          marginTop: 10,
          width: '100%',
          padding: '6px',
          fontSize: 10,
          fontWeight: 700,
          background: 'rgba(255,68,68,0.15)',
          border: '1px solid rgba(255,68,68,0.3)',
          borderRadius: 4,
          color: '#f44',
          cursor: 'pointer',
          fontFamily: "'Segoe UI', monospace",
        }}
      >
        RESET TO DEFAULTS
      </button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 8, color: 'rgba(160,200,255,0.5)', letterSpacing: 1, marginBottom: 3, fontWeight: 700 }}>{label}</div>
      {children}
    </div>
  );
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '5px 8px',
        fontSize: 9,
        fontWeight: 700,
        cursor: 'pointer',
        background: active ? 'rgba(68,136,255,0.2)' : 'transparent',
        border: `1px solid ${active ? '#4488ff' : '#1a3050'}`,
        borderRadius: 4,
        color: active ? '#4df' : 'rgba(160,200,255,0.4)',
        fontFamily: "'Segoe UI', monospace",
      }}
    >
      {label}
    </button>
  );
}

const sliderStyle: React.CSSProperties = {
  width: '100%',
  height: 6,
  cursor: 'pointer',
  accentColor: '#4488ff',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '4px 6px',
  fontSize: 10,
  color: '#cde',
  background: 'rgba(8,18,36,0.9)',
  border: '1px solid #1a3050',
  borderRadius: 3,
  cursor: 'pointer',
  fontFamily: "'Segoe UI', monospace",
};

/** Hook: read current dev settings for components that need the values */
export function useDevSettings(): DevSettings {
  const [s, setS] = useState<DevSettings>(load);
  useEffect(() => {
    const interval = setInterval(() => setS(load()), 500); // poll for changes
    return () => clearInterval(interval);
  }, []);
  return s;
}
