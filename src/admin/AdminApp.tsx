import { useState, useCallback, useRef } from 'react';
import {
  SHIP_DEFINITIONS, HERO_DEFINITIONS, BUILDABLE_SHIPS, HERO_SHIPS,
  UPGRADE_COSTS, CAPTURE_TIME, CAPTURE_RATE_PER_UNIT, DOMINATION_TIME, NEUTRAL_DEFENDERS,
  type ShipStats,
} from '../game/space-types';
import {
  SHIP_PREFABS, CAPITAL_PREFABS, ENEMY_PREFABS, STATION_PREFABS,
  EFFECT_PREFABS, VOXEL_FLEET_PREFABS, VEHICLE_PREFABS, WEAPON_PREFABS,
} from '../game/space-prefabs';

// ── Auth ────────────────────────────────────────────────────────────
const ADMIN_KEY = 'gspace-admin-v1';
const ADMIN_PW  = 'nexus2025'; // change in production

// ── Ship preview GIF/PNG mapping ────────────────────────────────────
const SHIP_PREVIEW: Record<string, string> = {
  micro_recon:          '/assets/space/models/ships/MicroRecon/MicroRecon.gif',
  red_fighter:          '/assets/space/models/ships/RedFighter/RedFighter.gif',
  galactix_racer:       '/assets/space/models/ships/GalactixRacer/GalactixRacer.gif',
  dual_striker:         '/assets/space/models/ships/DualStriker/DualStriker.gif',
  camo_stellar_jet:     '/assets/space/models/ships/CamoStellarJet/CamoStellarJet.gif',
  meteor_slicer:        '/assets/space/models/ships/MeteorSlicer/MeteorSlicer.gif',
  infrared_furtive:     '/assets/space/models/ships/InfraredFurtive/InfraredFurtive.gif',
  ultraviolet_intruder: '/assets/space/models/ships/UltravioletIntruder/UltravioletIntruder.gif',
  warship:              '/assets/space/models/ships/Warship/Warship.gif',
  star_marine_trooper:  '/assets/space/models/ships/StarMarineTrooper/StarMarineTrooper.gif',
  interstellar_runner:  '/assets/space/models/ships/InterstellarRunner/InterstellarRunner.gif',
  transtellar:          '/assets/space/models/ships/Transtellar/Transtellar.gif',
  pyramid_ship:         '/assets/space/models/ships/PyramidShip/AncientPyramidShip.gif',
  battleship:           '/assets/space/models/capital/Battleships/Battleship.png',
  destroyer:            '/assets/space/models/capital/Destroyer/Destroyer.png',
  cruiser:              '/assets/space/models/capital/Cruiser/Cruiser.png',
  bomber:               '/assets/space/models/capital/Bomber/Bomber.png',
};

// ── Types ────────────────────────────────────────────────────────────
type Tab = 'fleet' | 'assets' | 'balance' | 'config';

// ── Color tokens ─────────────────────────────────────────────────────
const C = {
  bg: '#020408', panel: 'rgba(6,14,30,0.95)', border: '#1a3050',
  accent: '#4488ff', gold: '#ffaa22', text: '#cde', muted: 'rgba(160,200,255,0.4)',
  danger: '#ff4444', green: '#44dd88', red: '#ff5555',
};

// ── Style helpers ────────────────────────────────────────────────────
const card: React.CSSProperties = { border: `1px solid ${C.border}`, borderRadius: 8, background: C.panel, overflow: 'hidden' };
const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '7px 18px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11,
  fontWeight: 700, letterSpacing: 1, transition: 'all 0.15s',
  background: active ? C.accent : 'transparent', color: active ? '#fff' : C.muted,
});
const inputStyle: React.CSSProperties = {
  background: 'rgba(8,18,36,0.9)', border: `1px solid ${C.border}`, borderRadius: 4,
  color: C.text, padding: '4px 8px', fontSize: 12, width: '100%',
};

// ────────────────────────────────────────────────────────────────────
// ROOT APP
// ────────────────────────────────────────────────────────────────────
export default function AdminApp() {
  const [auth, setAuth] = useState(() => localStorage.getItem(ADMIN_KEY) === '1');
  const [tab, setTab]   = useState<Tab>('fleet');
  const [pw, setPw]     = useState('');
  const [pwErr, setPwErr] = useState(false);

  const login = useCallback(() => {
    if (pw === ADMIN_PW) { localStorage.setItem(ADMIN_KEY, '1'); setAuth(true); }
    else { setPwErr(true); setTimeout(() => setPwErr(false), 1200); }
  }, [pw]);

  if (!auth) return <LoginScreen pw={pw} setPw={setPw} err={pwErr} onLogin={login} />;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Segoe UI', monospace", fontSize: 13 }}>
      {/* Sticky header */}
      <div style={{ background: 'rgba(2,6,16,0.98)', borderBottom: `1px solid ${C.border}`, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 20, height: 52, position: 'sticky', top: 0, zIndex: 100 }}>
        <img src='/assets/space/ui/logo.png' alt='Gruda Armada'
          style={{ height: 30, imageRendering: 'auto',
            filter: 'drop-shadow(0 0 8px rgba(68,136,255,0.5))' }}
          onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
        />
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginRight: 8 }}>ADMIN</div>
        <div style={{ display: 'flex', gap: 6, flex: 1 }}>
          {(['fleet','assets','balance','config'] as Tab[]).map(t => (
            <button key={t} style={tabBtn(tab===t)} onClick={() => setTab(t)}>
              {t === 'fleet' ? '🚀 FLEET REGISTRY' : t === 'assets' ? '📦 ASSET BROWSER' : t === 'balance' ? '⚖️ BALANCE EDITOR' : '⚙️ GAME CONFIG'}
            </button>
          ))}
        </div>
        <button onClick={() => { localStorage.removeItem(ADMIN_KEY); setAuth(false); }} style={{ ...tabBtn(false), color: C.danger, border: `1px solid rgba(255,68,68,0.3)` }}>
          LOGOUT
        </button>
      </div>

      <div style={{ padding: 24, maxWidth: 1440, margin: '0 auto' }}>
        {tab === 'fleet'   && <FleetRegistry />}
        {tab === 'assets'  && <AssetBrowser />}
        {tab === 'balance' && <BalanceEditor />}
        {tab === 'config'  && <GameConfig />}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// LOGIN SCREEN
// ────────────────────────────────────────────────────────────────────
function LoginScreen({ pw, setPw, err, onLogin }: { pw:string; setPw:(v:string)=>void; err:boolean; onLogin:()=>void }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 360, padding: 40, ...card, textAlign: 'center' }}>
        <img src='/assets/space/ui/logo.png' alt='Gruda Armada'
          style={{ width: 200, imageRendering: 'auto', marginBottom: 8,
            filter: 'drop-shadow(0 0 16px rgba(68,136,255,0.6))' }}
          onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
        />
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 36, letterSpacing: 3 }}>ADMIN PANEL</div>
        <input
          type="password" placeholder="Admin password" value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onLogin()}
          style={{ ...inputStyle, marginBottom: 12, padding: '11px 14px', fontSize: 14, textAlign: 'center', borderColor: err ? C.danger : C.border }}
        />
        <button onClick={onLogin} style={{ width: '100%', padding: '11px', background: C.accent, border: 'none', borderRadius: 6, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}>
          AUTHENTICATE
        </button>
        {err && <div style={{ color: C.danger, fontSize: 11, marginTop: 10 }}>Invalid credentials</div>}
        <div style={{ marginTop: 24, fontSize: 10, color: C.muted }}>Default password: <code style={{ color: C.accent }}>nexus2025</code></div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// FLEET REGISTRY — animated GIF previews of all ships
// ────────────────────────────────────────────────────────────────────
function FleetRegistry() {
  const [filter, setFilter] = useState<'all'|'buildable'|'hero'>('all');
  const [tierFilter, setTierFilter] = useState<number>(0);
  const [selected, setSelected] = useState<string|null>(null);

  const allBuildable = Object.values(BUILDABLE_SHIPS).flat();
  const allKeys = filter === 'hero' ? HERO_SHIPS : filter === 'buildable' ? allBuildable : [...allBuildable, ...HERO_SHIPS];

  const filtered = tierFilter === 0
    ? allKeys
    : allKeys.filter(k => {
        const def = SHIP_DEFINITIONS[k] ?? HERO_DEFINITIONS[k];
        return def?.stats.tier === tierFilter;
      });

  const tierColor = (t: number) => t <= 2 ? C.muted : t === 3 ? C.green : t === 4 ? C.gold : '#ff88cc';

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: C.accent }}>Fleet Registry</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all','buildable','hero'] as const).map(f => (
            <button key={f} style={tabBtn(filter===f)} onClick={() => setFilter(f)}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0,1,2,3,4,5].map(t => (
            <button key={t} style={{ ...tabBtn(tierFilter===t), color: t===0 ? undefined : tierColor(t) }} onClick={() => setTierFilter(t)}>
              {t === 0 ? 'ALL TIERS' : `T${t}`}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: C.muted }}>{filtered.length} ships</div>
      </div>

      {/* Ship Grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {filtered.map(key => {
          const def = SHIP_DEFINITIONS[key] ?? HERO_DEFINITIONS[key];
          if (!def) return null;
          const isHero = !!HERO_DEFINITIONS[key];
          const preview = SHIP_PREVIEW[key];
          const s = def.stats;
          const isSelected = selected === key;
          return (
            <div key={key} onClick={() => setSelected(isSelected ? null : key)} style={{
              width: 200, border: `1px solid ${isSelected ? C.accent : isHero ? '#5a3a00' : C.border}`,
              borderRadius: 10, background: isHero ? 'rgba(30,18,2,0.95)' : C.panel,
              cursor: 'pointer', transition: 'all 0.15s', overflow: 'hidden',
              boxShadow: isSelected ? `0 0 20px ${C.accent}44` : 'none',
            }}>
              {/* Preview image */}
              <div style={{ height: 130, background: '#010308', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderBottom: `1px solid ${isHero ? '#3a2200' : C.border}` }}>
                {preview
                  ? <img src={preview} alt={def.displayName} style={{ maxHeight: 120, maxWidth: 180, objectFit: 'contain', imageRendering: 'pixelated' }} />
                  : <div style={{ color: C.muted, fontSize: 11 }}>No preview</div>
                }
              </div>
              {/* Info */}
              <div style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: isHero ? C.gold : '#fff' }}>{def.displayName}</div>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: isHero ? 'rgba(255,160,0,0.2)' : 'rgba(68,136,255,0.15)', color: isHero ? C.gold : C.accent }}>
                    {isHero ? 'HERO' : `T${s.tier}`}
                  </span>
                </div>
                <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{def.class.replace('_',' ')}</div>
                <div style={{ fontSize: 10, lineHeight: 1.7, color: 'rgba(180,220,255,0.7)' }}>
                  <span style={{ color: C.green }}>♥ {s.maxHp}</span> &nbsp;
                  <span style={{ color: '#44aaff' }}>🛡 {s.maxShield}</span> &nbsp;
                  <span style={{ color: '#ffaa44' }}>⚔ {s.attackDamage}</span>
                  <br/>
                  <span>🏃 {s.speed} &nbsp; 🎯 {s.attackRange}</span>
                </div>
                {s.abilities && s.abilities.length > 0 && (
                  <div style={{ marginTop: 5, fontSize: 9, color: '#44eeff', borderTop: `1px solid rgba(68,200,255,0.15)`, paddingTop: 4 }}>
                    {s.abilities.map(a => <span key={a.id} style={{ display: 'inline-block', marginRight: 4, background: 'rgba(68,200,255,0.1)', padding: '1px 5px', borderRadius: 3 }}>{a.key}: {a.name}</span>)}
                  </div>
                )}
                {/* Expanded detail */}
                {isSelected && (
                  <div style={{ marginTop: 8, fontSize: 10, lineHeight: 1.8, color: C.text, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
                    <div>Armor: {s.armor} | Regen: {s.shieldRegen}/s</div>
                    <div>Attack: {s.attackType} | CD: {s.attackCooldown}s</div>
                    <div>Supply: {s.supplyCost} | Build: {s.buildTime}s</div>
                    <div style={{ marginTop: 4, color: C.gold }}>
                      💰 {s.creditCost}c &nbsp; ⚡ {s.energyCost}e &nbsp; 🪨 {s.mineralCost}m
                    </div>
                    {'lore' in def && <div style={{ marginTop: 6, fontStyle: 'italic', color: '#bbaa88', fontSize: 9 }}>{(def as any).lore}</div>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// ASSET BROWSER
// ────────────────────────────────────────────────────────────────────
const ASSET_GROUPS = [
  { label: '⚡ Fighter Ships',   prefabs: SHIP_PREFABS,        color: C.accent },
  { label: '🛸 Capital Ships',   prefabs: CAPITAL_PREFABS,     color: C.gold },
  { label: '👾 Enemy Ships',     prefabs: ENEMY_PREFABS,       color: C.danger },
  { label: '🏗 Stations',        prefabs: STATION_PREFABS,     color: C.green },
  { label: '✨ Effects (GLB)',   prefabs: EFFECT_PREFABS,      color: '#aa66ff' },
  { label: '🔷 Voxel Fleet',    prefabs: VOXEL_FLEET_PREFABS,  color: '#44ddcc' },
  { label: '🚗 Vehicles',       prefabs: VEHICLE_PREFABS,     color: '#ddaa44' },
  { label: '🔫 Weapons',        prefabs: WEAPON_PREFABS,      color: '#ff8844' },
];

function AssetBrowser() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['⚡ Fighter Ships']));

  const toggle = (label: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 18, color: C.accent, marginBottom: 20 }}>Asset Browser</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ASSET_GROUPS.map(({ label, prefabs, color }) => {
          const keys = Object.keys(prefabs);
          const open = expanded.has(label);
          return (
            <div key={label} style={card}>
              <div onClick={() => toggle(label)} style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: open ? 'rgba(68,136,255,0.06)' : 'transparent' }}>
                <span style={{ color, fontWeight: 700, fontSize: 13 }}>{label}</span>
                <span style={{ fontSize: 10, color: C.muted, marginLeft: 4 }}>{keys.length} assets</span>
                <span style={{ marginLeft: 'auto', color: C.muted }}>{open ? '▲' : '▼'}</span>
              </div>
              {open && (
                <div style={{ padding: '0 16px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {keys.map(key => {
                    const p = (prefabs as any)[key];
                    return (
                      <div key={key} style={{ padding: '6px 10px', border: `1px solid ${C.border}`, borderRadius: 6, background: 'rgba(4,10,22,0.8)', minWidth: 180 }}>
                        <div style={{ fontWeight: 600, color, fontSize: 11, marginBottom: 2 }}>{key}</div>
                        <div style={{ fontSize: 10, color: C.muted, wordBreak: 'break-all' }}>{p.modelPath}</div>
                        <div style={{ fontSize: 9, color: 'rgba(120,160,200,0.5)', marginTop: 2 }}>
                          {p.format.toUpperCase()} · scale {p.scale}
                          {p.hasParts ? ' · destructible' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// BALANCE EDITOR — editable stat table with export
// ────────────────────────────────────────────────────────────────────
type EditableStats = Record<string, Partial<ShipStats>>;

function BalanceEditor() {
  const [edits, setEdits] = useState<EditableStats>({});
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState('');

  const allKeys = [...Object.values(BUILDABLE_SHIPS).flat(), ...HERO_SHIPS];
  const STAT_COLS: Array<{ key: keyof ShipStats; label: string; isNum: boolean }> = [
    { key: 'maxHp',          label: 'HP',     isNum: true },
    { key: 'maxShield',      label: 'Shield', isNum: true },
    { key: 'armor',          label: 'Armor',  isNum: true },
    { key: 'attackDamage',   label: 'DMG',    isNum: true },
    { key: 'attackRange',    label: 'Range',  isNum: true },
    { key: 'speed',          label: 'Speed',  isNum: true },
    { key: 'creditCost',     label: 'Cr',     isNum: true },
    { key: 'energyCost',     label: 'En',     isNum: true },
    { key: 'mineralCost',    label: 'Min',    isNum: true },
    { key: 'buildTime',      label: 'Build',  isNum: true },
  ];

  const getVal = (key: string, stat: keyof ShipStats): number => {
    if (edits[key]?.[stat] !== undefined) return edits[key][stat] as number;
    const def = SHIP_DEFINITIONS[key] ?? HERO_DEFINITIONS[key];
    return (def?.stats[stat] ?? 0) as number;
  };

  const setVal = (key: string, stat: keyof ShipStats, val: number) => {
    setEdits(prev => ({ ...prev, [key]: { ...prev[key], [stat]: val } }));
    setDirty(true);
  };

  const reset = () => { setEdits({}); setDirty(false); setMsg('Reset to defaults'); };

  const exportJSON = () => {
    const out: Record<string, Partial<ShipStats>> = {};
    for (const key of allKeys) {
      const def = SHIP_DEFINITIONS[key] ?? HERO_DEFINITIONS[key];
      if (!def) continue;
      const merged: Partial<ShipStats> = { ...def.stats, ...edits[key] };
      out[key] = merged;
    }
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'balance-export.json'; a.click();
    URL.revokeObjectURL(url);
    setMsg('Exported!');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: C.accent }}>Balance Editor</div>
        {dirty && <span style={{ fontSize: 10, color: C.gold, border: `1px solid ${C.gold}44`, padding: '2px 8px', borderRadius: 4 }}>UNSAVED</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={reset} style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 4, color: C.muted, cursor: 'pointer', fontSize: 11 }}>RESET</button>
          <button onClick={exportJSON} style={{ padding: '6px 14px', background: C.accent, border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>EXPORT JSON</button>
        </div>
        {msg && <span style={{ fontSize: 10, color: C.green }}>{msg}</span>}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: 'rgba(4,10,24,0.9)', position: 'sticky', top: 52 }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: C.muted, fontWeight: 600, border: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>Ship</th>
              <th style={{ padding: '8px 8px', color: C.muted, fontWeight: 600, border: `1px solid ${C.border}` }}>Tier</th>
              <th style={{ padding: '8px 8px', color: C.muted, fontWeight: 600, border: `1px solid ${C.border}` }}>Class</th>
              {STAT_COLS.map(c => (
                <th key={c.key} style={{ padding: '8px 8px', color: C.muted, fontWeight: 600, border: `1px solid ${C.border}` }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allKeys.map((key, idx) => {
              const def = SHIP_DEFINITIONS[key] ?? HERO_DEFINITIONS[key];
              if (!def) return null;
              const isHero = !!HERO_DEFINITIONS[key];
              const hasEdit = !!edits[key] && Object.keys(edits[key]).length > 0;
              return (
                <tr key={key} style={{ background: idx%2===0 ? 'rgba(4,10,22,0.6)' : 'transparent', borderLeft: hasEdit ? `3px solid ${C.gold}` : '3px solid transparent' }}>
                  <td style={{ padding: '5px 12px', border: `1px solid ${C.border}`, fontWeight: 600, color: isHero ? C.gold : '#fff', whiteSpace: 'nowrap' }}>
                    {SHIP_PREVIEW[key] && <img src={SHIP_PREVIEW[key]} alt="" style={{ width: 28, height: 20, objectFit: 'contain', marginRight: 8, verticalAlign: 'middle', imageRendering: 'pixelated' }} />}
                    {def.displayName}
                  </td>
                  <td style={{ padding: '5px 8px', border: `1px solid ${C.border}`, textAlign: 'center', color: C.muted }}>{def.stats.tier}</td>
                  <td style={{ padding: '5px 8px', border: `1px solid ${C.border}`, color: C.muted, fontSize: 10 }}>{def.class.replace('_',' ')}</td>
                  {STAT_COLS.map(col => {
                    const orig = (def.stats[col.key] ?? 0) as number;
                    const cur  = getVal(key, col.key);
                    const changed = cur !== orig;
                    return (
                      <td key={col.key} style={{ padding: '3px 4px', border: `1px solid ${C.border}` }}>
                        <input
                          type="number" value={cur}
                          onChange={e => setVal(key, col.key, parseFloat(e.target.value) || 0)}
                          style={{ ...inputStyle, width: 70, textAlign: 'center', borderColor: changed ? C.gold : C.border, color: changed ? C.gold : C.text }}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// GAME CONFIG — read-only overview of game constants
// ────────────────────────────────────────────────────────────────────
function GameConfig() {
  const cfgRef = useRef<HTMLPreElement>(null);

  const config = {
    capture: { captureTime: CAPTURE_TIME, captureRatePerUnit: CAPTURE_RATE_PER_UNIT, dominationTime: DOMINATION_TIME, neutralDefenders: NEUTRAL_DEFENDERS },
    mapSizes: { '1v1': { width: 8000, height: 8000, depth: 800 }, '2v2': { width: 20000, height: 20000, depth: 800 }, ffa4: { width: 20000, height: 20000, depth: 800 } },
    upgradeCosts: UPGRADE_COSTS,
    shipCounts: { buildable: Object.values(BUILDABLE_SHIPS).flat().length, hero: HERO_SHIPS.length, total: Object.values(BUILDABLE_SHIPS).flat().length + HERO_SHIPS.length },
    tierBreakdown: Object.fromEntries(Object.entries(BUILDABLE_SHIPS).map(([t, arr]) => [`tier${t}`, arr.length])),
  };

  const copy = () => {
    if (cfgRef.current) { navigator.clipboard.writeText(cfgRef.current.textContent ?? ''); }
  };

  const rows: Array<{ label: string; value: string | number; note?: string }> = [
    { label: 'Capture Progress Required',  value: CAPTURE_TIME,          note: 'units of progress' },
    { label: 'Capture Rate per Unit/sec',  value: CAPTURE_RATE_PER_UNIT, note: 'stacks per ship in range' },
    { label: 'Domination Hold Time',       value: `${DOMINATION_TIME}s`, note: 'to win via domination' },
    { label: 'Neutral Defenders',          value: NEUTRAL_DEFENDERS,      note: 'ships guarding unclaimed planets' },
    { label: '1v1 Map Size',              value: '8,000 × 8,000',        note: 'world units' },
    { label: '2v2 / FFA Map Size',        value: '20,000 × 20,000',      note: 'world units' },
    { label: 'Total Ships (buildable)',   value: Object.values(BUILDABLE_SHIPS).flat().length },
    { label: 'Total Hero Ships',          value: HERO_SHIPS.length },
    { label: 'Upgrade Levels',            value: 5 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: C.accent }}>Game Config</div>
        <button onClick={copy} style={{ marginLeft: 'auto', padding: '6px 14px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 4, color: C.muted, cursor: 'pointer', fontSize: 11 }}>COPY JSON</button>
      </div>

      {/* Summary table */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, fontWeight: 700, color: C.accent, fontSize: 12 }}>CONSTANTS</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ background: i%2===0 ? 'rgba(4,10,22,0.5)' : 'transparent' }}>
                <td style={{ padding: '8px 16px', color: C.muted, width: '40%' }}>{r.label}</td>
                <td style={{ padding: '8px 16px', color: C.text, fontWeight: 600 }}>{r.value}</td>
                {r.note && <td style={{ padding: '8px 16px', color: 'rgba(140,180,220,0.4)', fontSize: 10, fontStyle: 'italic' }}>{r.note}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upgrade costs table */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, fontWeight: 700, color: C.gold, fontSize: 12 }}>UPGRADE COSTS (per level)</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'rgba(4,10,24,0.8)' }}>
              {['Level','Credits','Minerals','Energy'].map(h => (
                <th key={h} style={{ padding: '8px 16px', textAlign: 'left', color: C.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {UPGRADE_COSTS.map((c, i) => (
              <tr key={i} style={{ background: i%2===0 ? 'rgba(4,10,22,0.5)' : 'transparent' }}>
                <td style={{ padding: '7px 16px', color: C.gold, fontWeight: 700 }}>{i+1}</td>
                <td style={{ padding: '7px 16px', color: C.text }}>{c.credits}</td>
                <td style={{ padding: '7px 16px', color: C.text }}>{c.minerals}</td>
                <td style={{ padding: '7px 16px', color: C.text }}>{c.energy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Raw JSON */}
      <div style={card}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, fontWeight: 700, color: C.muted, fontSize: 12 }}>RAW CONFIG JSON</div>
        <pre ref={cfgRef} style={{ padding: 16, fontSize: 11, overflowX: 'auto', color: 'rgba(180,220,255,0.7)', lineHeight: 1.6 }}>
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>
    </div>
  );
}
