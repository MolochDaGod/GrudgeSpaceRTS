/**
 * MechBuilderShowcase.tsx — pre-campaign Commander Mech builder.
 *
 * Drops into the campaign launch flow before CampaignBuilderModal so the
 * commander's mech loadout (Mech_00 body + per-slot attachments) is
 * snapshotted into the campaign profile. The scene itself is the
 * MechBuilderRenderer; this component is the surrounding chrome:
 *   - left sidebar: slot tabs + per-slot equip toggles
 *   - bottom bar:   animation cycler + confirm / cancel
 *
 * Entirely additive — does not remove or rewrite the existing
 * CampaignBuilderModal; the App.tsx flow chains MechBuilder → CampaignBuilder.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MechBuilderRenderer, type MechBuildSnapshot } from './mech-builder-renderer';
import { getAssetsByCategory, getAssetsByTag, type AssetEntry } from './asset-registry';

interface Props {
  onComplete: (build: MechBuildSnapshot) => void;
  onCancel: () => void;
}

interface SlotTab {
  key: 'armour' | 'back' | 'gun' | 'melee' | 'module';
  label: string;
  /** Used to derive entries via tag intersection on category. */
  tag: string;
}

const SLOT_TABS: SlotTab[] = [
  { key: 'armour', label: 'ARMOUR', tag: 'armour' },
  { key: 'back', label: 'BACK MOUNT', tag: 'back' },
  { key: 'gun', label: 'HANDHELD', tag: 'gun' },
  { key: 'melee', label: 'MELEE', tag: 'melee' },
  { key: 'module', label: 'MODULE', tag: 'module' },
];

/** Build the per-tab option list from registry tags. */
function loadAvailableForTab(tab: SlotTab): AssetEntry[] {
  const byTag = getAssetsByTag(tab.tag);
  // Restrict to the mech library (mech category or weapon-tagged 'mech')
  return byTag.filter((e) => e.tags.includes('mech'));
}

export default function MechBuilderShowcase({ onComplete, onCancel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<MechBuilderRenderer | null>(null);
  const [activeTab, setActiveTab] = useState<SlotTab['key']>('armour');
  const [equipped, setEquipped] = useState<Record<string, true>>({});
  const [clipNames, setClipNames] = useState<string[]>([]);
  const [activeClip, setActiveClip] = useState<string>('');
  const [ready, setReady] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const r = new MechBuilderRenderer(containerRef.current);
    rendererRef.current = r;
    r.init().then(() => {
      setReady(true);
      const names = r.getClipNames();
      setClipNames(names);
      const snap = r.getEquippedKeys();
      if (snap.animKey) setActiveClip(snap.animKey);
    });
    return () => {
      r.dispose();
      rendererRef.current = null;
    };
  }, []);

  const tabAssets = useMemo<AssetEntry[]>(() => {
    const tab = SLOT_TABS.find((t) => t.key === activeTab);
    return tab ? loadAvailableForTab(tab) : [];
  }, [activeTab]);

  const totalAvailable = useMemo(
    () => getAssetsByCategory('mech').length + getAssetsByCategory('weapon').filter((e) => e.tags.includes('mech')).length,
    [],
  );

  const toggleEquip = useCallback(
    async (key: string) => {
      const r = rendererRef.current;
      if (!r) return;
      setBusyKey(key);
      try {
        if (equipped[key]) {
          r.unequip(key);
          setEquipped((e) => {
            const c = { ...e };
            delete c[key];
            return c;
          });
        } else {
          const ok = await r.equip(key);
          if (ok) setEquipped((e) => ({ ...e, [key]: true }));
        }
      } finally {
        setBusyKey(null);
      }
    },
    [equipped],
  );

  const handleAnimChange = useCallback((name: string) => {
    const r = rendererRef.current;
    if (!r) return;
    r.playClip(name);
    setActiveClip(name);
  }, []);

  const handleConfirm = useCallback(() => {
    const r = rendererRef.current;
    if (!r) {
      onComplete({
        bodyKey: 'mech_00_body',
        equipped: { right_hand: [], left_hand: [], right_shield: [], spine: [] },
        animKey: null,
      });
      return;
    }
    onComplete(r.getEquippedKeys());
  }, [onComplete]);

  return (
    <div style={shellStyle}>
      {/* 3D scene */}
      <div ref={containerRef} style={canvasStyle} />

      {/* Top bar */}
      <div style={topBarStyle}>
        <div style={titleStyle}>COMMANDER MECH · BUILD &amp; SHOWCASE</div>
        <div style={subtitleStyle}>{ready ? `${totalAvailable} parts available · drag to orbit` : 'Initialising mech bay…'}</div>
      </div>

      {/* Left sidebar: slot tabs + part list */}
      <div style={sidebarStyle}>
        <div style={tabsRowStyle}>
          {SLOT_TABS.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={t.key === activeTab ? tabActiveStyle : tabStyle}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={partsListStyle}>
          {tabAssets.length === 0 && (
            <div style={emptyStyle}>No {SLOT_TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} parts in registry yet.</div>
          )}
          {tabAssets.map((entry) => {
            const eq = !!equipped[entry.key];
            const busy = busyKey === entry.key;
            return (
              <button
                key={entry.key}
                onClick={() => toggleEquip(entry.key)}
                disabled={busy}
                style={eq ? partRowEquippedStyle : partRowStyle}
              >
                <div style={partRowHeader}>
                  <span style={{ fontWeight: 800, letterSpacing: 1 }}>{entry.key.replace(/^mech_/, '').toUpperCase()}</span>
                  <span style={partRowSlot}>{(entry.boneAnchor ?? 'spine').replace('_', ' ')}</span>
                </div>
                <div style={partRowMeta}>
                  size {entry.targetSize?.toFixed(2) ?? '—'} · {eq ? '● EQUIPPED' : busy ? '… LOADING' : '○ available'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom bar: animation + confirm */}
      <div style={bottomBarStyle}>
        <div style={animPickerStyle}>
          <span style={animLabelStyle}>ANIMATION</span>
          {clipNames.length > 0 ? (
            <select value={activeClip} onChange={(e) => handleAnimChange(e.target.value)} style={animSelectStyle}>
              {clipNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          ) : (
            <span style={{ color: 'rgba(180,220,255,0.5)', fontSize: 11 }}>none loaded</span>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={onCancel} style={cancelBtnStyle}>
          CANCEL
        </button>
        <button onClick={handleConfirm} style={confirmBtnStyle} disabled={!ready}>
          DEPLOY MECH →
        </button>
      </div>

      {!ready && (
        <div style={loadingOverlayStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#44ddff', letterSpacing: 4, marginBottom: 8 }}>MECH BAY ONLINE</div>
            <div style={{ fontSize: 11, color: 'rgba(160,200,255,0.5)' }}>Calibrating chassis bones...</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const shellStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 200,
  background: '#000',
  fontFamily: "'Segoe UI', monospace",
  color: '#cde',
};
const canvasStyle: React.CSSProperties = { width: '100%', height: '100%' };

const topBarStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  textAlign: 'center',
  pointerEvents: 'none',
};
const titleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 900,
  letterSpacing: 6,
  color: '#44ddff',
  textShadow: '0 0 12px rgba(68,221,255,0.4)',
};
const subtitleStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: 3,
  color: 'rgba(180,220,255,0.55)',
  marginTop: 4,
};

const sidebarStyle: React.CSSProperties = {
  position: 'absolute',
  top: 80,
  left: 18,
  bottom: 84,
  width: 320,
  background: 'rgba(8,16,32,0.78)',
  border: '1px solid rgba(80,180,255,0.35)',
  borderRadius: 6,
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};
const tabsRowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 4 };
const tabBase: React.CSSProperties = {
  flex: '1 1 auto',
  padding: '6px 10px',
  borderRadius: 4,
  fontSize: 10,
  letterSpacing: 2,
  fontWeight: 800,
  fontFamily: 'inherit',
  cursor: 'pointer',
  border: '1px solid rgba(80,180,255,0.25)',
  background: 'rgba(8,16,32,0.7)',
  color: 'rgba(180,220,255,0.7)',
};
const tabStyle: React.CSSProperties = tabBase;
const tabActiveStyle: React.CSSProperties = {
  ...tabBase,
  background: 'rgba(68,221,255,0.18)',
  color: '#44ddff',
  borderColor: '#44ddff',
};

const partsListStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  paddingRight: 4,
};
const emptyStyle: React.CSSProperties = {
  color: 'rgba(180,220,255,0.4)',
  fontSize: 11,
  padding: 8,
};

const partRowBase: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  borderRadius: 4,
  border: '1px solid rgba(80,180,255,0.2)',
  background: 'rgba(8,16,32,0.7)',
  color: '#cde',
  fontFamily: 'inherit',
  cursor: 'pointer',
};
const partRowStyle: React.CSSProperties = partRowBase;
const partRowEquippedStyle: React.CSSProperties = {
  ...partRowBase,
  borderColor: '#44ddff',
  background: 'rgba(68,221,255,0.14)',
  boxShadow: '0 0 12px rgba(68,221,255,0.25)',
};
const partRowHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 11,
};
const partRowSlot: React.CSSProperties = {
  fontSize: 8,
  letterSpacing: 1,
  color: 'rgba(180,220,255,0.5)',
};
const partRowMeta: React.CSSProperties = {
  marginTop: 3,
  fontSize: 9,
  letterSpacing: 1,
  color: 'rgba(180,220,255,0.5)',
};

const bottomBarStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 18,
  left: 18,
  right: 18,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: 'rgba(8,16,32,0.78)',
  border: '1px solid rgba(80,180,255,0.35)',
  borderRadius: 6,
  padding: '10px 14px',
};
const animPickerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 };
const animLabelStyle: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: 3,
  color: 'rgba(120,200,255,0.6)',
};
const animSelectStyle: React.CSSProperties = {
  background: 'rgba(8,16,32,0.85)',
  color: '#cde',
  border: '1px solid rgba(80,180,255,0.35)',
  padding: '4px 8px',
  borderRadius: 3,
  fontFamily: 'inherit',
  fontSize: 11,
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 18px',
  border: '1px solid rgba(255,80,80,0.4)',
  background: 'rgba(40,8,8,0.7)',
  color: '#ff8888',
  cursor: 'pointer',
  fontSize: 10,
  letterSpacing: 3,
  fontFamily: 'inherit',
  borderRadius: 4,
  fontWeight: 800,
};
const confirmBtnStyle: React.CSSProperties = {
  padding: '8px 22px',
  border: '1px solid #44ddff',
  background: 'rgba(68,221,255,0.18)',
  color: '#44ddff',
  cursor: 'pointer',
  fontSize: 11,
  letterSpacing: 3,
  fontFamily: 'inherit',
  borderRadius: 4,
  fontWeight: 900,
  boxShadow: '0 0 12px rgba(68,221,255,0.3)',
};

const loadingOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 250,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'radial-gradient(ellipse at center, #001020 0%, #000 100%)',
};
