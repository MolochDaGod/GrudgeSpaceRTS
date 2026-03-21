import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { SpaceRenderer } from './game/space-renderer';
import { SpaceHUD } from './game/space-ui';
import { StarMapOverlay } from './game/space-starmap';
import { SHIP_DEFINITIONS, BUILDABLE_SHIPS, HERO_DEFINITIONS, HERO_SHIPS, type GameMode } from './game/space-types';

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
        <div style={{ fontSize: 56, fontWeight: 800, color: '#4488ff', marginBottom: 4, letterSpacing: 4, textShadow: '0 0 40px #4488ff88, 0 0 80px #4488ff33' }}>GRUDA ARMADA</div>
        <div style={{ fontSize: 14, opacity: 0.45, marginBottom: 40, letterSpacing: 3 }}>TACTICAL SPACE COMMAND · RTS</div>
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

// ── Ship Codex ────────────────────────────────────────────────────
function ShipCodex({ onBack }: { onBack: () => void }) {
  const tiers = [1, 2, 3, 4, 5];
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#010308', color: '#cde', zIndex: 100, overflow: 'auto', padding: '40px 60px' }}>
      <StarfieldCanvas />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#4488ff' }}>SHIP CODEX</div>
          <button onClick={onBack} style={btn}>BACK</button>
        </div>
        {tiers.map(tier => {
          const ships = BUILDABLE_SHIPS[tier] ?? [];
          if (!ships.length) return null;
          return (
            <div key={tier} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#4488ff', marginBottom: 8, borderBottom: '1px solid #1a3050', paddingBottom: 4 }}>TIER {tier}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {ships.map(key => {
                  const def = SHIP_DEFINITIONS[key];
                  if (!def) return null;
                  const s = def.stats;
                  return (
                    <div key={key} style={{ width: 240, padding: 12, border: '1px solid #1a3050', borderRadius: 8, background: 'rgba(6,14,30,0.85)' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{def.displayName}</div>
                      <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>{def.class.replace('_',' ')}</div>
                      <div style={{ fontSize: 11, lineHeight: 1.6, opacity: 0.8 }}>
                        HP: {s.maxHp} | Shield: {s.maxShield} | Armor: {s.armor}<br/>
                        DMG: {s.attackDamage} ({s.attackType}) | Range: {s.attackRange}<br/>
                        Speed: {s.speed} | CD: {s.attackCooldown}s<br/>
                        Cost: {s.creditCost}c / {s.energyCost}e / {s.mineralCost}m | {s.buildTime}s
                      </div>
                      {s.abilities && s.abilities.length > 0 && (
                        <div style={{ marginTop: 4, fontSize: 10, color: '#4df' }}>{s.abilities.map(a=>`${a.name} (${a.key})`).join(', ')}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fc4', marginBottom: 8, borderBottom: '1px solid #443300', paddingBottom: 4 }}>HERO CLASS</div>
          <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 12 }}>Legendary ships — only buildable from your starting planet station</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {HERO_SHIPS.map(key => {
              const def = HERO_DEFINITIONS[key];
              if (!def) return null;
              const s = def.stats;
              return (
                <div key={key} style={{ width: 280, padding: 12, border: '1px solid #443300', borderRadius: 8, background: 'rgba(24,16,4,0.85)' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fc4' }}>{def.displayName}</div>
                  <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>{def.class.replace('_',' ')} — HERO</div>
                  <div style={{ fontSize: 10, color: '#cba', fontStyle: 'italic', marginBottom: 6 }}>{def.lore}</div>
                  <div style={{ fontSize: 11, lineHeight: 1.6, opacity: 0.8 }}>
                    HP: {s.maxHp} | Shield: {s.maxShield} | Armor: {s.armor}<br/>
                    DMG: {s.attackDamage} ({s.attackType}) | Range: {s.attackRange}<br/>
                    Speed: {s.speed} | CD: {s.attackCooldown}s<br/>
                    Cost: {s.creditCost}c / {s.energyCost}e / {s.mineralCost}m | {s.buildTime}s
                  </div>
                  {s.abilities && s.abilities.length > 0 && (
                    <div style={{ marginTop: 4, fontSize: 10, color: '#fa0' }}>{s.abilities.map(a=>`${a.name} (${a.key})`).join(', ')}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
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
          <div style={{ fontSize: 32, fontWeight: 800, color: '#4488ff' }}>HOW TO PLAY</div>
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
        <div style={{ fontSize: 48, marginBottom: 16, textShadow: '0 0 30px #4488ff88' }}>GRUDA ARMADA</div>
        <div style={{ opacity: 0.55, letterSpacing: 3, fontSize: 13 }}>LOADING ASSETS...</div>
      </div>
    </div>
  );
}