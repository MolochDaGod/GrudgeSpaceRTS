import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { SpaceRenderer } from './game/space-renderer';
import { SpaceHUD } from './game/space-ui';
import { StarMapOverlay } from './game/space-starmap';
import {
  SHIP_DEFINITIONS, BUILDABLE_SHIPS, HERO_DEFINITIONS, HERO_SHIPS, type GameMode,
  UPGRADE_COSTS, UPGRADE_BONUSES, PLANET_TYPE_DATA,
  SHIP_ROLES, SHIP_ROLE_LABELS, SHIP_ROLE_COLORS,
  COMMANDER_SPEC_LABEL, type CommanderSpec,
} from './game/space-types';

type Screen = 'menu' | 'codex' | 'howto' | 'playing';

// ── Animated Starfield Canvas (shared by all menu screens) ────────
const StarfieldCanvas = memo(function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    interface Star { x:number;y:number;r:number;alpha:number;phase:number;spd:number;vx:number;vy:number; }
    const stars: Star[] = Array.from({ length: 240 }, () => ({
      x: Math.random()*w, y: Math.random()*h,
      r: Math.random()*1.6+0.3, alpha: Math.random()*0.55+0.25,
      phase: Math.random()*Math.PI*2, spd: 0.006+Math.random()*0.018,
      vx: (Math.random()-0.5)*0.13, vy: (Math.random()-0.5)*0.07,
    }));
    let t=0, raf=0, na=0;
    ctx.fillStyle='#010308'; ctx.fillRect(0,0,w,h);
    const draw = () => {
      ctx.fillStyle='rgba(1,3,8,0.14)'; ctx.fillRect(0,0,w,h);
      na+=0.0004;
      const nx=w*0.5+Math.cos(na)*w*0.22, ny=h*0.5+Math.sin(na*0.6)*h*0.18;
      const grd=ctx.createRadialGradient(nx,ny,0,nx,ny,Math.max(w,h)*0.55);
      grd.addColorStop(0,'rgba(12,24,72,0.035)');
      grd.addColorStop(0.4,'rgba(6,12,48,0.018)');
      grd.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=grd; ctx.fillRect(0,0,w,h);
      for (const s of stars) {
        const a=s.alpha*(0.35+0.65*Math.abs(Math.sin(t*s.spd+s.phase)));
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(175,210,255,${a})`; ctx.fill();
        s.x=(s.x+s.vx+w)%w; s.y=(s.y+s.vy+h)%h;
      }
      t++; raf=requestAnimationFrame(draw);
    };
    draw();
    const onResize=()=>{ w=canvas.width=window.innerWidth; h=canvas.height=window.innerHeight; };
    window.addEventListener('resize',onResize);
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize',onResize); };
  },[]);
  return <canvas ref={canvasRef} style={{position:'absolute',inset:0,zIndex:0,pointerEvents:'none',display:'block'}} />;
});

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<SpaceRenderer | null>(null);
  const [screen, setScreen] = useState<Screen>('menu');
  const [loading, setLoading] = useState(false);
  const [renderer, setRenderer] = useState<SpaceRenderer | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('1v1');
  const [starMapOpen, setStarMapOpen] = useState(false);

  // M key opens Star Map while playing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm' && screen === 'playing' && renderer) {
        setStarMapOpen(o => !o);
      }
      if (e.key === 'Escape') setStarMapOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, renderer]);

  const startGame = useCallback((mode: GameMode) => {
    if (!containerRef.current) return;
    if (rendererRef.current) { rendererRef.current.dispose(); rendererRef.current = null; }
    setLoading(true);
    setScreen('playing');
    const r = new SpaceRenderer(containerRef.current, mode);
    rendererRef.current = r;
    r.init().then(() => { setLoading(false); setRenderer(r); });
  }, []);

  const backToMenu = useCallback(() => {
    if (rendererRef.current) { rendererRef.current.dispose(); rendererRef.current = null; }
    setRenderer(null);
    setScreen('menu');
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000', position: 'relative', fontFamily: "'Segoe UI', monospace" }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', display: screen === 'playing' ? 'block' : 'none' }} />
      {screen === 'menu'  && <MainMenu onStart={startGame} onCodex={() => setScreen('codex')} onHowTo={() => setScreen('howto')} mode={gameMode} setMode={setGameMode} />}
      {screen === 'codex' && <ShipCodex onBack={() => setScreen('menu')} />}
      {screen === 'howto' && <HowToPlay onBack={() => setScreen('menu')} />}
      {loading && <LoadingScreen />}
      {screen === 'playing' && !loading && renderer && <SpaceHUD renderer={renderer} onQuit={backToMenu} />}
      {screen === 'playing' && starMapOpen && renderer && (
        <StarMapOverlay renderer={renderer} onClose={() => setStarMapOpen(false)} />
      )}
    </div>
  );
}

// ── Main Menu ─────────────────────────────────────────────────────
function MainMenu({ onStart, onCodex, onHowTo, mode, setMode }: {
  onStart: (m: GameMode) => void; onCodex: () => void; onHowTo: () => void;
  mode: GameMode; setMode: (m: GameMode) => void;
}) {
  const modes: { key: GameMode; label: string; desc: string }[] = [
    { key: '1v1',  label: 'INNER SYSTEM',  desc: '2 commanders · 7 planets · Solar System Scrim' },
    { key: '2v2',  label: 'OUTER SYSTEM',  desc: '4 commanders · 14 planets · Solar System Scrim' },
    { key: 'ffa4', label: 'FULL SECTOR',   desc: '4 commanders · 14 planets · Free-for-All Scrim' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#010308', color: '#cde', zIndex: 100 }}>
      <StarfieldCanvas />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img
          src='/assets/space/ui/logo.png'
          alt='GRUDA ARMADA'
          style={{ width: 380, maxWidth: '88vw', marginBottom: 32,
            filter: 'drop-shadow(0 0 40px rgba(68,136,255,0.5))',
            imageRendering: 'auto' }}
        />
        <div style={{ fontSize: 12, opacity: 0.4, marginBottom: 32, letterSpacing: 4, textTransform: 'uppercase' }}>Solar System Scrim · Tactical RTS</div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
          {modes.map(m => (
            <div key={m.key} onClick={() => setMode(m.key)} style={{
              padding: '16px 24px', border: mode === m.key ? '2px solid #4488ff' : '1px solid #1a3050',
              borderRadius: 8, cursor: 'pointer',
              background: mode === m.key ? 'rgba(68,136,255,0.15)' : 'rgba(6,12,28,0.85)',
              minWidth: 160, textAlign: 'center', transition: 'all 0.2s',
              boxShadow: mode === m.key ? '0 0 18px #4488ff33' : 'none',
            }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{m.label}</div>
              <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>{m.desc}</div>
            </div>
          ))}
        </div>
        <button onClick={() => onStart(mode)} style={{
          padding: '14px 60px', fontSize: 20, fontWeight: 700, color: '#fff',
          background: 'linear-gradient(135deg, #1a55bb, #4488ff)', border: 'none',
          borderRadius: 8, cursor: 'pointer', letterSpacing: 2, marginBottom: 24,
          boxShadow: '0 0 30px #4488ff55',
        }}>LAUNCH GAME</button>
        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={onCodex} style={btn}>SHIP CODEX</button>
          <button onClick={onHowTo} style={btn}>HOW TO PLAY</button>
          <a href="/admin.html" target="_blank" style={{ ...btn, textDecoration: 'none', lineHeight: '1.6', display: 'inline-block' }}>ADMIN</a>
        </div>
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: '10px 28px', fontSize: 13, fontWeight: 600, color: '#8ac',
  background: 'transparent', border: '1px solid #1a3050', borderRadius: 6,
  cursor: 'pointer', letterSpacing: 1,
};

// ── Shared codex helpers ──────────────────────────────────
// Ship preview images — GIF for voxel ships, PNG for capital/battle ships
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
  // ── Hero class ships — mapped to closest capital ship preview ──────────
  vanguard_prime:       '/assets/space/models/capital/Battleships/Battleship.png',
  shadow_reaper:        '/assets/space/models/capital/Bomber/Bomber.png',
  iron_bastion:         '/assets/space/models/capital/Cruiser/Cruiser.png',
  storm_herald:         '/assets/space/models/capital/Destroyer/Destroyer.png',
  plague_mother:        '/assets/space/models/capital/Battleships/Battleship.png',
  // ── Dreadnoughts ─────────────────────────────────────────────────
  boss_ship_01:         '/assets/space/models/capital/Battleships/Battleship.png',
  boss_ship_02:         '/assets/space/models/capital/Battleships/Battleship.png',
};

const ABILITY_ICONS: Record<string, string> = {
  cloak:          '/assets/space/ui/hud/Ability07.png',
  speed_boost:    '/assets/space/ui/hud/Ability08.png',
  iron_dome:      '/assets/space/ui/hud/Ability09.png',
  emp:            '/assets/space/ui/hud/Ability10.png',
  barrel_roll:    '/assets/space/ui/hud/Ability11.png',
  warp:           '/assets/space/ui/hud/Ability12.png',
  boarding:       '/assets/space/ui/hud/Ability13.png',
  ram:            '/assets/space/ui/hud/Ability14.png',
  repair:         '/assets/space/ui/hud/Ability15.png',
  launch_fighters:'/assets/space/ui/hud/Ability16.png',
};

// Mini segmented stat bar
function StatBar({ val, max, color }: { val: number; max: number; color: string }) {
  const filled = Math.max(1, Math.round((val / Math.max(max, 1)) * 8));
  return (
    <div style={{ display: 'flex', gap: 2, height: 5 }}>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{
          flex: 1, borderRadius: 1,
          background: i < filled ? color : 'rgba(255,255,255,0.07)',
          boxShadow: i < filled ? `0 0 3px ${color}88` : 'none',
        }} />
      ))}
    </div>
  );
}

// Ship card used in both fleet and hero sections
// def lookup: always check both dicts so boss ships (in SHIP_DEFINITIONS)
// and hero ships (in HERO_DEFINITIONS) both resolve regardless of flag.
function ShipCard({ shipKey, hero = false }: { shipKey: string; hero?: boolean }) {
  const def = HERO_DEFINITIONS[shipKey] ?? SHIP_DEFINITIONS[shipKey];
  if (!def) return null;
  const s         = def.stats;
  const preview   = SHIP_PREVIEW[shipKey];
  const role      = SHIP_ROLES[shipKey];
  const roleColor = role ? SHIP_ROLE_COLORS[role] : null;
  const lore      = 'lore' in def ? (def as typeof HERO_DEFINITIONS[string]).lore : null;

  return (
    <div style={{
      width: 210, border: `1px solid ${hero ? '#443300' : roleColor ?? '#1a3050'}`,
      borderRadius: 10, background: hero ? 'rgba(22,14,2,0.92)' : 'rgba(6,14,30,0.92)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      boxShadow: hero ? '0 0 12px rgba(255,180,0,0.1)' : 'none',
    }}>
      {/* Preview image */}
      <div style={{
        height: 120, background: 'rgba(2,4,12,0.95)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: `1px solid ${hero ? '#443300' : '#1a3050'}`, overflow: 'hidden',
        position: 'relative',
      }}>
        {preview && !preview.endsWith('.fbx')
          ? <img src={preview} alt={def.displayName}
              style={{ maxHeight: 108, maxWidth: 198, objectFit: 'contain', imageRendering: 'pixelated' }}
              onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
            />
          : <div style={{ fontSize: 36, opacity: 0.18 }}>
              {s.tier >= 5 ? '🛸' : s.tier >= 4 ? '🛡️' : s.tier >= 3 ? '⚔️' : '🚀'}
            </div>
        }
        {/* Tier badge */}
        <div style={{
          position: 'absolute', top: 6, right: 6, fontSize: 9, fontWeight: 700,
          padding: '2px 7px', borderRadius: 4, letterSpacing: 1,
          background: hero ? 'rgba(255,180,0,0.2)' : 'rgba(68,136,255,0.18)',
          border: `1px solid ${hero ? '#ffcc0055' : '#4488ff44'}`,
          color: hero ? '#fc4' : '#4488ff',
        }}>{hero ? 'HERO' : `T${s.tier}`}</div>
        {/* Role badge */}
        {role && (
          <div style={{
            position: 'absolute', top: 6, left: 6, fontSize: 8, fontWeight: 700,
            padding: '2px 6px', borderRadius: 3, letterSpacing: 0.5,
            background: `${roleColor}22`, border: `1px solid ${roleColor}55`,
            color: roleColor!,
          }}>{SHIP_ROLE_LABELS[role]}</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px', flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: hero ? '#fc4' : '#fff', marginBottom: 2 }}>
          {def.displayName}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(160,200,255,0.4)', textTransform: 'uppercase',
          letterSpacing: 0.5, marginBottom: lore ? 6 : 8 }}>
          {def.class.replace(/_/g, ' ')}
        </div>
        {lore && (
          <div style={{ fontSize: 9, color: '#cba', fontStyle: 'italic',
            marginBottom: 8, lineHeight: 1.4, opacity: 0.8 }}>
            {lore.slice(0, 80)}{lore.length > 80 ? '…' : ''}
          </div>
        )}

        {/* Stat bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 8, color: '#44ee44', width: 28 }}>♥ HP</span>
            <div style={{ flex: 1 }}><StatBar val={s.maxHp} max={2400} color='#44ee44' /></div>
            <span style={{ fontSize: 8, color: 'rgba(160,200,255,0.4)', width: 32, textAlign:'right' }}>{s.maxHp}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 8, color: '#44ccff', width: 28 }}>🛡 SHD</span>
            <div style={{ flex: 1 }}><StatBar val={s.maxShield} max={1000} color='#44ccff' /></div>
            <span style={{ fontSize: 8, color: 'rgba(160,200,255,0.4)', width: 32, textAlign:'right' }}>{s.maxShield}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 8, color: '#ff8844', width: 28 }}>⚔ DMG</span>
            <div style={{ flex: 1 }}><StatBar val={s.attackDamage} max={200} color='#ff8844' /></div>
            <span style={{ fontSize: 8, color: 'rgba(160,200,255,0.4)', width: 32, textAlign:'right' }}>{s.attackDamage}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 8, color: '#ffcc00', width: 28 }}>SPD</span>
            <div style={{ flex: 1 }}><StatBar val={s.speed} max={160} color='#ffcc00' /></div>
            <span style={{ fontSize: 8, color: 'rgba(160,200,255,0.4)', width: 32, textAlign:'right' }}>{s.speed}</span>
          </div>
        </div>

        {/* Cost strip */}
        <div style={{ display: 'flex', gap: 8, fontSize: 9, color: 'rgba(160,200,255,0.45)',
          borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6, marginBottom: 6 }}>
          <span style={{ color: '#fc4' }}>{s.creditCost}c</span>
          <span style={{ color: '#4df' }}>{s.energyCost}e</span>
          <span style={{ color: '#4f8' }}>{s.mineralCost}m</span>
          <span style={{ marginLeft: 'auto', color: 'rgba(160,200,255,0.3)' }}>{s.buildTime}s</span>
        </div>

        {/* Abilities */}
        {s.abilities && s.abilities.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {s.abilities.map(ab => (
              <div key={ab.id} title={ab.name}
                style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 8,
                  padding: '2px 5px', borderRadius: 3,
                  background: 'rgba(68,220,255,0.08)', border: '1px solid rgba(68,220,255,0.2)',
                  color: '#4df' }}
              >
                <img src={ABILITY_ICONS[ab.type] ?? '/assets/space/ui/hud/Ability01.png'}
                  alt='' style={{ width: 12, height: 12, imageRendering: 'pixelated' }}
                  onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
                />
                {ab.key}: {ab.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ship Codex (full tabbed rewrite) ──────────────────────────
function ShipCodex({ onBack }: { onBack: () => void }) {
  const [tab, setTab]           = useState<'ships'|'heroes'|'commanders'|'upgrades'>('ships');
  const [tierFilter, setTierF]  = useState(0);

  const allShipKeys = Object.values(BUILDABLE_SHIPS).flat();
  const filtered    = tierFilter === 0 ? allShipKeys
    : allShipKeys.filter(k => (SHIP_DEFINITIONS[k]?.stats.tier ?? 0) === tierFilter);

  const tabStyle = (t: typeof tab): React.CSSProperties => ({
    padding: '8px 22px', border: 'none', borderBottom: tab===t ? '2px solid #4488ff' : '2px solid transparent',
    background: 'transparent', color: tab===t ? '#4488ff' : 'rgba(160,200,255,0.45)',
    fontWeight: 700, fontSize: 11, letterSpacing: 1.5, cursor: 'pointer', textTransform: 'uppercase',
    transition: 'all 0.15s',
  });

  const SPECS: { spec: CommanderSpec; planet: string; color: string; bonus: string; emoji: string }[] = [
    { spec:'forge',  planet:'Volcanic',    color:'#ff6644', bonus:'+ATK / Weapons',  emoji:'🔥' },
    { spec:'tide',   planet:'Oceanic',     color:'#4488ff', bonus:'+DEF / Shields',  emoji:'🌊' },
    { spec:'prism',  planet:'Crystalline', color:'#44ddff', bonus:'+ECO / Economy',  emoji:'💎' },
    { spec:'vortex', planet:'Gas Giant',   color:'#ffaa22', bonus:'+SPD / Mobility', emoji:'⚡' },
    { spec:'void',   planet:'Barren',      color:'#aa8866', bonus:'+ALL / Stealth',  emoji:'⬛' },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#010308', color: '#cde',
      zIndex: 100, display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', monospace" }}>
      <StarfieldCanvas />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* ── Header ──────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 32px',
          borderBottom: '1px solid #1a3050', background: 'rgba(1,3,8,0.9)', gap: 8 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#4488ff', letterSpacing: 4 }}>GRUDA ARMADA</div>
          <div style={{ fontSize: 10, color: 'rgba(160,200,255,0.35)', letterSpacing: 2, marginRight: 16 }}>CODEX</div>
          {/* Tabs */}
          <button style={tabStyle('ships')}     onClick={() => setTab('ships')}>     🚀 Fleet Ships</button>
          <button style={tabStyle('heroes')}    onClick={() => setTab('heroes')}>    ⭐ Hero Class</button>
          <button style={tabStyle('commanders')} onClick={() => setTab('commanders')}>👤 Commanders</button>
          <button style={tabStyle('upgrades')}  onClick={() => setTab('upgrades')}>  ⚡ Upgrades</button>
          <div style={{ flex: 1 }} />
          <button onClick={onBack} style={btn}>← BACK</button>
        </div>

        {/* ── SHIPS TAB ───────────────────────────────── */}
        {tab === 'ships' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            {/* Tier filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'rgba(160,200,255,0.4)', letterSpacing: 2, marginRight: 4 }}>FILTER</span>
              {[0,1,2,3,4,5].map(t => (
                <button key={t} onClick={() => setTierF(t)} style={{
                  padding: '4px 14px', border: `1px solid ${tierFilter===t?'#4488ff':'#1a3050'}`,
                  borderRadius: 4, background: tierFilter===t?'rgba(68,136,255,0.15)':'transparent',
                  color: tierFilter===t?'#4488ff':'rgba(160,200,255,0.4)', fontSize: 10,
                  fontWeight: 700, cursor: 'pointer',
                }}>{t===0?'ALL TIERS':`TIER ${t}`}</button>
              ))}
              {/* Role legend */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, fontSize: 9, flexWrap: 'wrap' }}>
                {(Object.entries(SHIP_ROLE_LABELS) as [string, string][]).map(([r, lbl]) => (
                  <span key={r} style={{ color: SHIP_ROLE_COLORS[r as keyof typeof SHIP_ROLE_COLORS],
                    padding: '2px 6px', border: `1px solid ${SHIP_ROLE_COLORS[r as keyof typeof SHIP_ROLE_COLORS]}44`,
                    borderRadius: 3 }}>{lbl}</span>
                ))}
              </div>
            </div>
            {/* Ship grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {filtered.map(k => <ShipCard key={k} shipKey={k} />)}
            </div>
          </div>
        )}

        {/* ── HEROES TAB ──────────────────────────────── */}
        {tab === 'heroes' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            {/* Commander requirement banner */}
            <div style={{
              padding: '12px 20px', marginBottom: 28,
              background: 'rgba(255,180,0,0.07)', border: '1px solid rgba(255,180,0,0.2)',
              borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center',
            }}>
              <img src='/assets/space/ui/scifi-gui/avatars/1.png' alt=''
                style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #fc4',
                  objectFit: 'cover' }}
                onError={e=>{(e.target as HTMLImageElement).style.display='none'}}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fc4', marginBottom: 2 }}>
                  ★ Hero Class ships require a Commander
                </div>
                <div style={{ fontSize: 11, color: 'rgba(200,180,100,0.7)', lineHeight: 1.5 }}>
                  Train a Commander at any owned planet before queueing a Hero ship.
                  If the Dreadnought is destroyed, the Commander is permanently lost.
                </div>
              </div>
            </div>
            {/* Hero ship cards */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              {HERO_SHIPS.map(k => <ShipCard key={k} shipKey={k} hero />)}
            </div>
            {/* Dreadnoughts */}
            <div style={{ marginTop: 32, borderTop: '1px solid rgba(255,180,0,0.2)', paddingTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ff8822', marginBottom: 16, letterSpacing: 2 }}>
                🛸 TECH-UNLOCKED DREADNOUGHTS
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                {['boss_ship_01','boss_ship_02'].map(k => <ShipCard key={k} shipKey={k} hero />)}
              </div>
            </div>
          </div>
        )}

        {/* ── COMMANDERS TAB ───────────────────────────── */}
        {tab === 'commanders' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            {/* Intro */}
            <div style={{ fontSize: 13, color: 'rgba(160,200,255,0.6)', maxWidth: 600, lineHeight: 1.8, marginBottom: 28 }}>
              Train commanders at owned planets. Each specialization matches the planet’s biome.
              Commanders level 1–5, gaining <strong style={{color:'#44ee88'}}>+5% to all stats</strong> per level.
              A level-5 commander buffs the equipped Hero ship by <strong style={{color:'#44ee88'}}>+25%</strong> across the board.
            </div>
            {/* Spec cards */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 40 }}>
              {SPECS.map(({ spec, planet, color, bonus, emoji }, idx) => {
                const avatarIdx = (idx % 6) + 1;
                const trainCosts = [
                  { lv:1, c:200, e:80,  m:100 },
                  { lv:2, c:400, e:160, m:200 },
                  { lv:3, c:700, e:280, m:350 },
                  { lv:4, c:1100,e:440, m:550 },
                  { lv:5, c:1600,e:640, m:800 },
                ];
                return (
                  <div key={spec} style={{
                    width: 200, border: `1px solid ${color}44`, borderRadius: 12,
                    background: 'rgba(6,14,30,0.92)', overflow: 'hidden',
                  }}>
                    {/* Portrait + name */}
                    <div style={{ background: `linear-gradient(135deg, ${color}18, transparent)`,
                      padding: '16px', display: 'flex', gap: 12, alignItems: 'center',
                      borderBottom: `1px solid ${color}33` }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img src={`/assets/space/ui/scifi-gui/avatars/${avatarIdx}.png`}
                          alt={spec}
                          style={{ width: 52, height: 52, borderRadius: '50%',
                            border: `2px solid ${color}`, objectFit: 'cover' }}
                          onError={e=>{(e.target as HTMLImageElement).style.display='none'}}
                        />
                        <div style={{ position:'absolute', bottom:-2, right:-2,
                          fontSize:14, lineHeight:1 }}>{emoji}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
                          {COMMANDER_SPEC_LABEL[spec]}
                        </div>
                        <div style={{ fontSize: 9, color, letterSpacing: 1 }}>{planet} · Commander</div>
                        <div style={{ fontSize: 9, color: 'rgba(160,200,255,0.5)', marginTop: 2 }}>{bonus}</div>
                      </div>
                    </div>
                    {/* Level bonuses */}
                    <div style={{ padding: '12px' }}>
                      <div style={{ fontSize: 9, color: 'rgba(160,200,255,0.4)', letterSpacing: 1, marginBottom: 8 }}>TRAINING COSTS &amp; BONUSES</div>
                      {trainCosts.map(({ lv, c, e, m }) => {
                        const pct = lv * 5;
                        return (
                          <div key={lv} style={{ display: 'flex', alignItems: 'center', gap: 6,
                            marginBottom: 5, fontSize: 9 }}>
                            <span style={{ color, fontWeight: 700, width: 14 }}>{lv}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 1 }}>
                                <div style={{ height: '100%', width: `${pct*4}%`, background: color, borderRadius: 1 }} />
                              </div>
                            </div>
                            <span style={{ color, fontWeight: 700, width: 28 }}>+{pct}%</span>
                            <span style={{ color: 'rgba(160,200,255,0.3)', fontSize: 8 }}>{c}c</span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Stars preview */}
                    <div style={{ padding: '0 12px 12px', display: 'flex', gap: 3 }}>
                      {Array.from({length:5},(_,i)=>(
                        <span key={i} style={{ fontSize: 12, color: i<3 ? color : 'rgba(255,255,255,0.1)',
                          textShadow: i<3 ? `0 0 6px ${color}` : 'none' }}>★</span>
                      ))}
                      <span style={{ fontSize: 9, color: 'rgba(160,200,255,0.3)', marginLeft: 4, alignSelf:'center' }}>max rank</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Avatar gallery strip */}
            <div style={{ borderTop: '1px solid #1a3050', paddingTop: 20 }}>
              <div style={{ fontSize: 11, color: 'rgba(160,200,255,0.4)', letterSpacing: 2, marginBottom: 12 }}>COMMANDER PORTRAITS</div>
              <div style={{ display: 'flex', gap: 12 }}>
                {Array.from({length: 6}, (_, i) => (
                  <img key={i} src={`/assets/space/ui/scifi-gui/avatars/${i+1}.png`}
                    alt={`Commander ${i+1}`}
                    style={{ width: 56, height: 56, borderRadius: '50%',
                      border: '1px solid #1a3050', objectFit: 'cover',
                      boxShadow: '0 0 8px rgba(68,136,255,0.2)' }}
                    onError={e=>{(e.target as HTMLImageElement).style.display='none'}}
                  />
                ))}
                <div style={{ display:'flex', flexDirection:'column', justifyContent:'center',
                  fontSize:10, color:'rgba(160,200,255,0.4)', lineHeight:1.6 }}>
                  Assigned randomly on training.
                  <span style={{color:'#44ee88'}}>Train &amp; equip to Hero ships.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── UPGRADES TAB ────────────────────────────── */}
        {tab === 'upgrades' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            <div style={{ fontSize: 13, color: 'rgba(160,200,255,0.6)', maxWidth: 580, lineHeight: 1.8, marginBottom: 28 }}>
              Global upgrades apply to <strong style={{color:'#fff'}}>every ship you build</strong> from that point on.
              Costs scale each level. Your starting planet type grants a
              <strong style={{color:'#ffcc00'}}> 20% discount</strong> on its matching upgrade.
            </div>

            {/* 5 upgrade types */}
            {([
              { key:'attack', label:'Attack',  color:'#ff4444', desc:'Weapon damage multiplier for all ships.',      icon:'⚔️', bonuses: UPGRADE_BONUSES.attack },
              { key:'armor',  label:'Armor',   color:'#8ac4d4', desc:'Flat armor bonus reduces every hit taken.',    icon:'🛡️', bonuses: UPGRADE_BONUSES.armor },
              { key:'speed',  label:'Speed',   color:'#ffcc00', desc:'Movement speed multiplier across all units.',   icon:'⚡',  bonuses: UPGRADE_BONUSES.speed },
              { key:'health', label:'Health',  color:'#44ee44', desc:'Max HP multiplier — compounds with rank.',     icon:'♥',  bonuses: UPGRADE_BONUSES.health },
              { key:'shield', label:'Shield',  color:'#44ccff', desc:'Max shield multiplier for all shield values.', icon:'🔵', bonuses: UPGRADE_BONUSES.shield },
            ] as const).map(({ key, label, color, desc, icon, bonuses }) => {
              const discountPlanet = Object.entries(PLANET_TYPE_DATA)
                .find(([, d]) => d.upgradeDiscount === key);
              return (
                <div key={key} style={{
                  marginBottom: 20, padding: '18px 20px', borderRadius: 10,
                  border: `1px solid ${color}33`, background: `${color}08`,
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 22 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color, letterSpacing: 1 }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(160,200,255,0.5)' }}>{desc}</div>
                    </div>
                    {discountPlanet && (
                      <div style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, padding: '3px 10px',
                        borderRadius: 4, background: `rgba(255,204,0,0.1)`,
                        border: '1px solid rgba(255,204,0,0.3)', color: '#fc4' }}>
                        20% off on 
                        <span style={{ color:`#${(PLANET_TYPE_DATA[discountPlanet[0] as keyof typeof PLANET_TYPE_DATA]?.baseColor ?? 0).toString(16).padStart(6,'0')}` }}>
                          {discountPlanet[1].label}
                        </span>
                         planets
                      </div>
                    )}
                  </div>
                  {/* 5 level rows */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {UPGRADE_COSTS.map((cost, idx) => {
                      const bonus = bonuses[idx + 1];
                      const bonusStr = key === 'armor'
                        ? `+${bonus} armor`
                        : `+${Math.round((bonus as number) * 100)}%`;
                      return (
                        <div key={idx} style={{
                          flex: '1 1 120px', padding: '10px 12px', borderRadius: 7,
                          border: `1px solid ${color}33`,
                          background: 'rgba(6,14,30,0.7)',
                        }}>
                          <div style={{ fontSize: 10, color, fontWeight: 700, marginBottom: 4 }}>LEVEL {idx + 1}</div>
                          {/* Bonus bar */}
                          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 6 }}>
                            <div style={{ height: '100%', width: `${(idx+1)*20}%`,
                              background: color, borderRadius: 2,
                              boxShadow: `0 0 6px ${color}88` }} />
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 6 }}>{bonusStr}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, fontSize: 9,
                            color: 'rgba(160,200,255,0.4)' }}>
                            <span style={{color:'#fc4'}}>{cost.credits}c</span>
                            <span style={{color:'#4f8'}}>{cost.minerals}m</span>
                            <span style={{color:'#4df'}}>{cost.energy}e</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Planet type tech discount reference */}
            <div style={{ marginTop: 8, padding: '14px 18px', borderRadius: 8,
              border: '1px solid rgba(255,204,0,0.15)', background: 'rgba(255,204,0,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fc4', marginBottom: 10, letterSpacing: 1 }}>
                🌍 PLANET TYPE DISCOUNT REFERENCE
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {(Object.entries(PLANET_TYPE_DATA) as [string, typeof PLANET_TYPE_DATA[keyof typeof PLANET_TYPE_DATA]][]).map(([type, d]) => (
                  <div key={type} style={{ fontSize: 9, padding: '4px 10px', borderRadius: 4,
                    background: `#${d.baseColor.toString(16).padStart(6,'0')}18`,
                    border: `1px solid #${d.baseColor.toString(16).padStart(6,'0')}44`,
                    color: `#${d.baseColor.toString(16).padStart(6,'0')}` }}>
                    {d.label} → <span style={{color:'#fc4'}}>20% off {d.upgradeDiscount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── How To Play ───────────────────────────────────────────────────
function HowToPlay({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#010308', color: '#cde', zIndex: 100, overflow: 'auto', padding: '40px 60px' }}>
      <StarfieldCanvas />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src='/assets/space/ui/logo.png' alt='Gruda Armada' style={{ height: 32, imageRendering: 'auto' }}
              onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: '#4488ff', letterSpacing: 3 }}>SHIP CODEX</div>
          </div>
          <button onClick={onBack} style={btn}>BACK</button>
        </div>
        <div style={{ maxWidth: 700, lineHeight: 1.8, fontSize: 13 }}>
          <Section title="Objective">Conquer planets, build fleets, and destroy your enemies. Win by elimination (destroy all enemy units) or domination (control 70%+ planets for 60 seconds).</Section>
          <Section title="Controls">
            Left Click — Select | Left Drag — Box select | Right Click — Move/Attack<br/>
            Ctrl+1-9 — Assign group | 1-9 — Recall | A — Attack move | S — Stop | H — Hold<br/>
            WASD/Arrows — Pan camera | Scroll — Zoom | Double Click — Select all of type<br/>
            Q/W/E/R — Abilities | Right-click ability — Toggle autocast
          </Section>
          <Section title="Planets & Capture">Send ships near a neutral planet. Defeat its defenders, then your units auto-capture it. A capture ring shows progress. Owned planets generate resources and a station.</Section>
          <Section title="Stations & Building">Select your station and use the build panel to queue ships. They spawn at the station and fly to the rally point. Higher tier ships are far stronger.</Section>
          <Section title="Upgrades">Use the HUD upgrade buttons to improve all your ships globally: Attack, Armor, Speed, Health, and Shield. Each has 5 levels.</Section>
          <Section title="Resources">Credits, Energy, and Minerals are earned passively from owned planets. Richer planets yield more. Spend them on ships and upgrades.</Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#4df', marginBottom: 4 }}>{title}</div>
      <div style={{ opacity: 0.8 }}>{children}</div>
    </div>
  );
}

// ── Loading Screen ────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, color: '#4488ff', fontFamily: 'monospace', background: '#010308' }}>
      <StarfieldCanvas />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <img
          src='/assets/space/ui/logo.png'
          alt='GRUDA ARMADA'
          style={{ width: 280, maxWidth: '70vw', marginBottom: 20,
            filter: 'drop-shadow(0 0 30px rgba(68,136,255,0.6))',
            animation: 'pulse 2s ease-in-out infinite' }}
        />
        <div style={{ opacity: 0.55, letterSpacing: 3, fontSize: 13 }}>LOADING ASSETS...</div>
      </div>
    </div>
  );
}