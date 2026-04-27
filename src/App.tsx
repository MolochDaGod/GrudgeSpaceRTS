import { useEffect, useRef, useState, useCallback, memo, lazy, Suspense } from 'react';
import { hasHeroShip } from './game/ship-storage';
import {
  SHIP_DEFINITIONS,
  BUILDABLE_SHIPS,
  HERO_DEFINITIONS,
  HERO_SHIPS,
  type GameMode,
  UPGRADE_COSTS,
  UPGRADE_BONUSES,
  PLANET_TYPE_DATA,
  SHIP_ROLES,
  SHIP_ROLE_LABELS,
  SHIP_ROLE_COLORS,
  type ShipRoleType,
  COMMANDER_SPEC_LABEL,
  type CommanderSpec,
  COMMANDER_SPEC_PLANET,
  TEAM_COLOR_PALETTE,
  type EnemyColorMode,
  type TeamColorPrefs,
  applyColorPreferences,
  type SpaceFaction,
  FACTION_DATA,
  CAMPAIGN_LORE_INTRO,
  type CommanderOrigin,
  type CommanderPersonality,
  type CommanderMotivation,
  type CommanderBuild,
} from './game/space-types';
import { authFetch } from './game/grudge-auth';
import { UPGRADE_HUD_ICONS, SHIP_PREVIEW as SHARED_SHIP_PREVIEW } from './game/space-ui-shared';
import { Panel, Btn, Slot, SmallPanel } from './game/ui-lib';
import { gameAudio } from './game/space-audio';
import { initAuth, login, logout, getUser, onAuthChange, type GrudgeUser } from './game/grudge-auth';
import { getKey } from './game/hotkeys';
import { HotkeySettings } from './game/HotkeySettings';
import { loadRemoteBalance } from './game/space-data-loader';
import { DevOverlay } from './game/dev-overlay';
import { GalaxyMap, STAR_SYSTEMS } from './game/GalaxyMap';

// ── Lazy-loaded heavy modules (code-split) ────────────────────────
// These chunks only download when the user navigates to the relevant screen.
const LazySpaceHUD = lazy(() => import('./game/space-ui').then((m) => ({ default: m.SpaceHUD })));
const LazyStarMapOverlay = lazy(() => import('./game/space-starmap').then((m) => ({ default: m.StarMapOverlay })));
const LazyShipForgeEditor = lazy(() => import('./game/ship-editor').then((m) => ({ default: m.ShipForgeEditor })));
const LazyShipCodex3D = lazy(() => import('./game/codex-ui').then((m) => ({ default: m.ShipCodex3D })));
const LazyGroundCombatView = lazy(() => import('./game/GroundCombatView').then((m) => ({ default: m.GroundCombatView })));
const LazyGroundBattleView = lazy(() => import('./game/GroundBattleView').then((m) => ({ default: m.GroundBattleView })));
const LazyGroundRTSView = lazy(() => import('./game/GroundRTSView'));
const LazyMechBuilderShowcase = lazy(() => import('./game/MechBuilderShowcase'));
const LazyUniverseView = lazy(() => import('./game/UniverseView'));
import type { PlanetType } from './game/space-types';

type Screen = 'intro' | 'menu' | 'codex' | 'howto' | 'editor' | 'playing' | 'ground_combat' | 'ground_rts' | 'universe';

// ── URL Routing ──────────────────────────────────────
const ROUTE_TO_SCREEN: Record<string, Screen> = {
  '/': 'menu',
  '/codex': 'codex',
  '/editor': 'editor',
  '/howto': 'howto',
  '/game': 'playing',
  '/ground': 'ground_combat',
  '/ground-rts': 'ground_rts',
  '/universe': 'universe',
};
const SCREEN_TO_ROUTE: Partial<Record<Screen, string>> = {
  menu: '/',
  codex: '/codex',
  editor: '/editor',
  howto: '/howto',
  playing: '/game',
  ground_combat: '/ground',
  ground_rts: '/ground-rts',
  universe: '/universe',
};

function screenFromPath(path: string): Screen {
  return ROUTE_TO_SCREEN[path] ?? 'menu';
}

// ── Space Background: stars + nebulae + comets ────────────────────
const StarfieldCanvas = memo(function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    // ─ Stars ───────────────────────────────────────
    interface Star {
      x: number;
      y: number;
      r: number;
      a: number;
      ph: number;
      sp: number;
      vx: number;
      vy: number;
    }
    const stars: Star[] = Array.from({ length: 260 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.2,
      a: Math.random() * 0.6 + 0.2,
      ph: Math.random() * Math.PI * 2,
      sp: 0.004 + Math.random() * 0.016,
      vx: (Math.random() - 0.5) * 0.11,
      vy: (Math.random() - 0.5) * 0.06,
    }));

    // ─ Space lights (nebula orbs) ────────────────────────
    interface NebLight {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      rgb: [number, number, number];
      alpha: number;
      ph: number;
      sp: number;
    }
    const nebLights: NebLight[] = [
      { x: w * 0.12, y: h * 0.18, vx: 0.14, vy: 0.07, r: Math.max(w, h) * 0.3, rgb: [10, 60, 200], alpha: 0.055, ph: 0, sp: 0.0008 },
      {
        x: w * 0.88,
        y: h * 0.25,
        vx: -0.11,
        vy: 0.055,
        r: Math.max(w, h) * 0.24,
        rgb: [110, 10, 200],
        alpha: 0.045,
        ph: Math.PI * 0.7,
        sp: 0.001,
      },
      {
        x: w * 0.5,
        y: h * 0.82,
        vx: 0.07,
        vy: -0.09,
        r: Math.max(w, h) * 0.32,
        rgb: [180, 30, 10],
        alpha: 0.04,
        ph: Math.PI * 1.4,
        sp: 0.0012,
      },
      {
        x: w * 0.28,
        y: h * 0.62,
        vx: -0.09,
        vy: -0.06,
        r: Math.max(w, h) * 0.22,
        rgb: [0, 130, 110],
        alpha: 0.038,
        ph: Math.PI * 2.1,
        sp: 0.0007,
      },
      {
        x: w * 0.75,
        y: h * 0.7,
        vx: 0.06,
        vy: 0.08,
        r: Math.max(w, h) * 0.18,
        rgb: [80, 10, 160],
        alpha: 0.03,
        ph: Math.PI * 3.0,
        sp: 0.0009,
      },
    ];

    // ─ Comets ──────────────────────────────────────
    interface Comet {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      width: number;
      active: boolean;
      timer: number;
      delay: number;
    }
    const comets: Comet[] = Array.from({ length: 6 }, (_, i) => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1.5,
      width: 2,
      active: false,
      timer: i * 1.8 + Math.random() * 3,
      delay: 6 + Math.random() * 14,
    }));

    function spawnComet(c: Comet) {
      const edge = Math.floor(Math.random() * 4);
      const spd = 350 + Math.random() * 350;
      const spread = 0.6;
      if (edge === 0) {
        c.x = Math.random() * w;
        c.y = -30;
        const a = Math.PI * 0.5 + (Math.random() - 0.5) * spread;
        c.vx = Math.cos(a) * spd;
        c.vy = Math.sin(a) * spd;
      } else if (edge === 1) {
        c.x = w + 30;
        c.y = Math.random() * h;
        const a = Math.PI + (Math.random() - 0.5) * spread;
        c.vx = Math.cos(a) * spd;
        c.vy = Math.sin(a) * spd;
      } else if (edge === 2) {
        c.x = Math.random() * w;
        c.y = h + 30;
        const a = -Math.PI * 0.5 + (Math.random() - 0.5) * spread;
        c.vx = Math.cos(a) * spd;
        c.vy = Math.sin(a) * spd;
      } else {
        c.x = -30;
        c.y = Math.random() * h;
        const a = (Math.random() - 0.5) * spread;
        c.vx = Math.cos(a) * spd;
        c.vy = Math.sin(a) * spd;
      }
      c.maxLife = 1.0 + Math.random() * 1.2;
      c.life = 0;
      c.width = 1.2 + Math.random() * 3;
      c.active = true;
    }

    let lastMs = performance.now(),
      raf = 0;
    ctx.fillStyle = '#010308';
    ctx.fillRect(0, 0, w, h);

    const draw = (now: number) => {
      const dt = Math.min((now - lastMs) * 0.001, 0.05);
      lastMs = now;

      // Partial clear — leaves gentle comet trails
      ctx.fillStyle = 'rgba(1,3,8,0.18)';
      ctx.fillRect(0, 0, w, h);

      // ─ Nebula space lights ───────────────────────
      for (const nl of nebLights) {
        nl.x = ((nl.x + nl.vx + w * 3) % (w * 3)) - w;
        nl.y = ((nl.y + nl.vy + h * 3) % (h * 3)) - h;
        const px = nl.x < 0 ? nl.x + w : nl.x > w ? nl.x - w : nl.x;
        const py = nl.y < 0 ? nl.y + h : nl.y > h ? nl.y - h : nl.y;
        const pulse = 0.65 + 0.35 * Math.sin(now * 0.001 * nl.sp * 6283 + nl.ph);
        const grd = ctx.createRadialGradient(px, py, 0, px, py, nl.r * pulse);
        const [r, g, b] = nl.rgb;
        grd.addColorStop(0, `rgba(${r},${g},${b},${nl.alpha * pulse})`);
        grd.addColorStop(0.35, `rgba(${r},${g},${b},${nl.alpha * 0.35 * pulse})`);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
      }

      // ─ Comets ─────────────────────────────────
      for (const c of comets) {
        if (!c.active) {
          c.timer -= dt;
          if (c.timer <= 0) {
            spawnComet(c);
            c.timer = c.delay;
          }
          continue;
        }
        c.life += dt;
        const pr = c.life / c.maxLife;
        if (pr >= 1 || c.x < -200 || c.x > w + 200 || c.y < -200 || c.y > h + 200) {
          c.active = false;
          c.timer = c.delay;
          continue;
        }
        const fade = pr < 0.12 ? pr / 0.12 : pr > 0.75 ? (1 - pr) / 0.25 : 1.0;
        const spd = Math.hypot(c.vx, c.vy);
        const nx = c.vx / spd,
          ny = c.vy / spd;
        const tailLen = 60 + c.width * 28 + spd * 0.12;
        const tx = c.x - nx * tailLen,
          ty = c.y - ny * tailLen;

        // Tail gradient
        const tg = ctx.createLinearGradient(tx, ty, c.x, c.y);
        tg.addColorStop(0, 'rgba(0,0,0,0)');
        tg.addColorStop(0.45, `rgba(80,160,255,${fade * 0.28})`);
        tg.addColorStop(0.8, `rgba(200,230,255,${fade * 0.65})`);
        tg.addColorStop(1, `rgba(255,255,255,${fade})`);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(c.x, c.y);
        ctx.strokeStyle = tg;
        ctx.lineWidth = c.width;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Bright glowing head
        const hg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.width * 4);
        hg.addColorStop(0, `rgba(255,255,255,${fade})`);
        hg.addColorStop(0.3, `rgba(160,210,255,${fade * 0.7})`);
        hg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.width * 4, 0, Math.PI * 2);
        ctx.fill();

        // Tiny star flare at head
        ctx.fillStyle = `rgba(255,255,255,${fade * 0.9})`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.width * 0.6, 0, Math.PI * 2);
        ctx.fill();

        c.x += c.vx * dt;
        c.y += c.vy * dt;
      }

      // ─ Stars ────────────────────────────────────
      for (const s of stars) {
        const a = s.a * (0.3 + 0.7 * Math.abs(Math.sin(now * 0.001 * s.sp * 6 + s.ph)));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(175,210,255,${a})`;
        ctx.fill();
        s.x = (s.x + s.vx + w) % w;
        s.y = (s.y + s.vy + h) % h;
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', display: 'block' }} />;
});

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<import('./game/space-renderer').SpaceRenderer | null>(null);
  // Resolve initial screen from URL — skip intro if deep-linking to a specific route
  const initialPath = window.location.pathname;
  const initialScreen = initialPath === '/' || initialPath === '' ? 'intro' : screenFromPath(initialPath);
  const [screen, setScreenRaw] = useState<Screen>(initialScreen);
  const [authUser, setAuthUser] = useState<GrudgeUser | null>(null);

  // Wrap setScreen to also push URL
  const setScreen = useCallback((s: Screen) => {
    setScreenRaw(s);
    const route = SCREEN_TO_ROUTE[s];
    if (route && window.location.pathname !== route) {
      window.history.pushState({ screen: s }, '', route);
    }
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const onPop = () => {
      const s = screenFromPath(window.location.pathname);
      setScreenRaw(s);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Initialise auth on mount (handles OAuth callback + session restore)
  useEffect(() => {
    initAuth().then((u) => setAuthUser(u));
    return onAuthChange((u) => setAuthUser(u));
  }, []);

  // Music: switch tracks based on screen
  useEffect(() => {
    if (screen === 'menu' || screen === 'codex' || screen === 'howto' || screen === 'editor') {
      gameAudio.playMusic('menu');
    } else if (screen === 'playing' || screen === 'ground_combat' || screen === 'ground_rts') {
      gameAudio.playMusic('battle');
    } else if (screen === 'intro') {
      gameAudio.playMusic('main');
    }
  }, [screen]);
  const [loading, setLoading] = useState(false);
  const [renderer, setRenderer] = useState<import('./game/space-renderer').SpaceRenderer | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('1v1');
  const [starMapOpen, setStarMapOpen] = useState(false);
  const [showCmdModal, setShowCmdModal] = useState(false);
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);
  // Pre-campaign mech builder — chained before CampaignBuilderModal so the
  // commander's mech loadout is snapshotted into the campaign profile.
  // Additive only: nothing in the existing campaign builder gets removed.
  const [showMechBuilder, setShowMechBuilder] = useState(false);
  // Snapshot survives across the MechBuilder → CampaignBuilder → launch
  // chain without re-rendering on update. Read on launch in the future.
  const mechBuildRef = useRef<import('./game/mech-builder-renderer').MechBuildSnapshot | null>(null);
  // Faction selection lives on the campaign builder modal; this hook just
  // holds the default until the modal mounts. The setter is currently
  // unused (the modal owns its own state) but kept as a reservation for
  // when the menu surfaces faction picking before the modal opens.
  const [selectedFaction] = useState<SpaceFaction>('legion');
  const [campaignBuild, setCampaignBuild] = useState<CommanderBuild | null>(null);
  const [selectedSpec, setSelectedSpec] = useState<CommanderSpec>('forge');
  const [playerColorIdx, setPlayerColorIdx] = useState(0); // Blue default
  const [enemyColorMode, setEnemyColorMode] = useState<EnemyColorMode>('unique');
  const [enemyColorIdx, setEnemyColorIdx] = useState(1); // Red default
  const [aiDifficulty, setAiDifficulty] = useState(3); // 1=Passive, 3=Balanced, 5=Aggressive
  const [groundPlanetType, setGroundPlanetType] = useState<PlanetType>('barren');
  const [groundPlanetName, setGroundPlanetName] = useState('Unknown');

  // Star Map hotkey — driven through the hotkeys config
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === getKey('hud_starmap') && screen === 'playing' && renderer) {
        setStarMapOpen((o) => !o);
      }
      if (e.key === 'Escape') setStarMapOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, renderer]);

  const backToMenu = useCallback(() => {
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
    setRenderer(null);
    setScreen('menu');
  }, []);

  const launchWithSpec = useCallback(
    async (mode: GameMode, spec: CommanderSpec, colorPrefs: TeamColorPrefs, difficulty?: number) => {
      if (!containerRef.current) return;
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      // Apply color preferences before anything initializes
      applyColorPreferences(colorPrefs);
      setShowCmdModal(false);
      setLoading(true);
      setScreen('playing');
      // Load remote balance overrides before engine init (non-blocking on failure)
      await loadRemoteBalance();
      const { SpaceRenderer } = await import('./game/space-renderer');
      const r = new SpaceRenderer(containerRef.current, mode);
      rendererRef.current = r;
      r.playerCommanderSpec = spec;
      // Set AI difficulty before engine init (stored on renderer, copied during init)
      if (difficulty != null) r.aiDifficulty = difficulty;
      // Forward the pre-campaign mech loadout (MechBuilderShowcase → ref)
      // for future commander-spawn / persistence code paths.
      r.commanderMech = mechBuildRef.current;
      // Campaign-specific: set faction + grudgeId + commander build on renderer
      if (mode === 'campaign' && campaignBuild) {
        r.campaignFaction = campaignBuild.faction;
        r.campaignGrudgeId = authUser?.grudgeId ?? 'guest';
        r.campaignCommanderName = campaignBuild.name;
        r.campaignPortrait = campaignBuild.portraitUrl ?? null;
      } else if (mode === 'campaign') {
        r.campaignFaction = selectedFaction as any;
        r.campaignGrudgeId = authUser?.grudgeId ?? 'guest';
        r.campaignCommanderName = authUser?.displayName ?? 'Commander';
        r.campaignPortrait = authUser?.avatarUrl ?? null;
      }
      try {
        r.hasCustomHero = await hasHeroShip();
      } catch {
        /* no hero */
      }
      r.init()
        .then(() => {
          setLoading(false);
          setRenderer(r);
        })
        .catch((err) => {
          console.error('[GRUDA] Engine init failed:', err);
          setLoading(false);
          backToMenu();
        });
    },
    [authUser, campaignBuild, selectedFaction, backToMenu],
  );

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#000',
        position: 'relative',
        fontFamily: "'Segoe UI', monospace",
      }}
    >
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', display: screen === 'playing' || screen === 'ground_combat' ? 'block' : 'none' }}
        // ground_rts uses its own canvas — keep Three.js canvas hidden during RTS
      />
      {screen === 'intro' && <IntroScreen onFinish={() => setScreen('menu')} />}
      {screen === 'menu' && (
        <MainMenu
          onStart={() => setShowCmdModal(true)}
          onCampaign={() => setShowMechBuilder(true)}
          onCodex={() => setScreen('codex')}
          onHowTo={() => setScreen('howto')}
          onEditor={() => setScreen('editor')}
          onUniverse={() => setScreen('universe')}
          onGroundCombat={() => {
            setGroundPlanetType('barren');
            setGroundPlanetName('Training Grounds');
            setScreen('ground_combat');
          }}
          onGroundRts={() => {
            setGroundPlanetType('barren');
            setGroundPlanetName('Training Grounds');
            setScreen('ground_rts');
          }}
          mode={gameMode}
          setMode={setGameMode}
          user={authUser}
          onLogin={login}
          onLogout={logout}
        />
      )}
      {showCmdModal && (
        <CommanderSelectModal
          spec={selectedSpec}
          setSpec={setSelectedSpec}
          playerColorIdx={playerColorIdx}
          setPlayerColorIdx={setPlayerColorIdx}
          enemyColorMode={enemyColorMode}
          setEnemyColorMode={setEnemyColorMode}
          enemyColorIdx={enemyColorIdx}
          setEnemyColorIdx={setEnemyColorIdx}
          aiDifficulty={aiDifficulty}
          setAiDifficulty={setAiDifficulty}
          onConfirm={() => launchWithSpec(gameMode, selectedSpec, { playerColorIdx, enemyColorMode, enemyColorIdx }, aiDifficulty)}
          onCancel={() => setShowCmdModal(false)}
        />
      )}
      {showMechBuilder && (
        <Suspense fallback={<LoadingScreen />}>
          <LazyMechBuilderShowcase
            onComplete={(build) => {
              mechBuildRef.current = build;
              setShowMechBuilder(false);
              // Chain into the existing campaign builder — nothing upstream changes.
              setShowCampaignBuilder(true);
            }}
            onCancel={() => setShowMechBuilder(false)}
          />
        </Suspense>
      )}
      {showCampaignBuilder && (
        <CampaignBuilderModal
          user={authUser}
          onComplete={(build) => {
            setCampaignBuild(build);
            setShowCampaignBuilder(false);
            // Map origin to commander spec for engine compatibility
            const specMap: Record<CommanderOrigin, CommanderSpec> = {
              scientist: 'prism',
              engineer: 'forge',
              soldier: 'tide',
              outcast: 'void',
            };
            launchWithSpec('campaign', specMap[build.origin] ?? 'forge', { playerColorIdx, enemyColorMode, enemyColorIdx });
          }}
          onCancel={() => setShowCampaignBuilder(false)}
        />
      )}
      {screen === 'codex' && (
        <Suspense fallback={<LoadingScreen />}>
          <LazyShipCodex3D onBack={() => setScreen('menu')} />
        </Suspense>
      )}
      {screen === 'howto' && <HowToPlay onBack={() => setScreen('menu')} />}
      {screen === 'editor' && (
        <Suspense fallback={<LoadingScreen />}>
          <LazyShipForgeEditor onBack={() => setScreen('menu')} />
        </Suspense>
      )}
      {loading && <LoadingScreen />}
      {screen === 'playing' && !loading && renderer && (
        <Suspense fallback={null}>
          <LazySpaceHUD
            renderer={renderer}
            onQuit={backToMenu}
            onToggleStarMap={() => setStarMapOpen((o) => !o)}
            onDeployGround={(pType, pName) => {
              setGroundPlanetType(pType);
              setGroundPlanetName(pName);
              setScreen('ground_combat');
            }}
          />
        </Suspense>
      )}
      {screen === 'playing' && starMapOpen && renderer && (
        <Suspense fallback={null}>
          <LazyStarMapOverlay renderer={renderer} onClose={() => setStarMapOpen(false)} />
        </Suspense>
      )}
      {screen === 'ground_combat' && (
        <Suspense fallback={<LoadingScreen />}>
          <LazyGroundCombatView
            planetType={groundPlanetType}
            planetName={groundPlanetName}
            onExit={(result) => {
              console.log('[GROUND] Mission result:', result);
              setScreen(rendererRef.current ? 'playing' : 'menu');
            }}
          />
        </Suspense>
      )}
      {screen === 'ground_rts' && (
        <Suspense fallback={<LoadingScreen />}>
          <LazyGroundRTSView onExit={() => setScreen('menu')} />
        </Suspense>
      )}
      {screen === 'universe' && (
        <Suspense fallback={<LoadingScreen />}>
          <LazyUniverseView
            onExit={() => {
              // If a campaign target was just stored, route to /game; else /menu.
              const target = (() => {
                try {
                  return localStorage.getItem('campaign_target');
                } catch {
                  return null;
                }
              })();
              setScreen(target ? 'playing' : 'menu');
            }}
          />
        </Suspense>
      )}
      {/* Admin UI overlay — toggle with backtick key */}
      <DevOverlay />
    </div>
  );
}

// ── Commander Selection Modal (pre-game) ──────────────────────────
function CommanderSelectModal({
  spec,
  setSpec,
  playerColorIdx,
  setPlayerColorIdx,
  enemyColorMode,
  setEnemyColorMode,
  enemyColorIdx,
  setEnemyColorIdx,
  aiDifficulty,
  setAiDifficulty,
  onConfirm,
  onCancel,
}: {
  spec: CommanderSpec;
  setSpec: (s: CommanderSpec) => void;
  playerColorIdx: number;
  setPlayerColorIdx: (i: number) => void;
  enemyColorMode: EnemyColorMode;
  setEnemyColorMode: (m: EnemyColorMode) => void;
  enemyColorIdx: number;
  setEnemyColorIdx: (i: number) => void;
  aiDifficulty: number;
  setAiDifficulty: (d: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const SPECS: { key: CommanderSpec; label: string; planet: string; color: string; bonus: string; desc: string }[] = [
    {
      key: 'forge',
      label: 'Forge',
      planet: 'Volcanic',
      color: '#ff6644',
      bonus: '+ATK / Weapons',
      desc: 'Aggressive weapons specialist. Burns bright on the offensive.',
    },
    {
      key: 'tide',
      label: 'Tide',
      planet: 'Oceanic',
      color: '#4488ff',
      bonus: '+DEF / Shields',
      desc: 'Durable shield expert. Absorbs punishment and holds the line.',
    },
    {
      key: 'prism',
      label: 'Prism',
      planet: 'Crystalline',
      color: '#44ddff',
      bonus: '+ECO / Economy',
      desc: 'Economic mastermind. Boosts income and accelerates production.',
    },
    {
      key: 'vortex',
      label: 'Vortex',
      planet: 'Gas Giant',
      color: '#ffaa22',
      bonus: '+SPD / Mobility',
      desc: 'Swift tactician. Outmaneuvers opponents with blazing speed.',
    },
    {
      key: 'void',
      label: 'Void',
      planet: 'Barren',
      color: '#aa8866',
      bonus: '+ALL / Stealth',
      desc: 'Enigmatic operative. Balanced bonuses with covert advantages.',
    },
  ];

  const hexStr = (hex: number) => `#${hex.toString(16).padStart(6, '0')}`;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.88)',
        fontFamily: "'Segoe UI', monospace",
        color: '#cde',
      }}
    >
      <Panel
        title="CHOOSE YOUR COMMANDER"
        width={700}
        style={{
          maxWidth: '94vw',
          maxHeight: '90vh',
          background: 'rgba(4,10,22,0.97)',
          border: '2px solid rgba(40,180,160,0.4)',
          borderRadius: 12,
        }}
      >
        <div style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 100px)', paddingRight: 4 }}>
          <div style={{ fontSize: 11, color: 'rgba(160,200,255,0.45)', marginBottom: 16, textAlign: 'center' }}>
            Your starting commander determines your flagship's bonus spec.
          </div>
          {/* Commander spec cards */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            {SPECS.map((s, idx) => {
              const sel = spec === s.key;
              const portraitIdx = [1, 5, 9, 13, 17][idx];
              return (
                <div
                  key={s.key}
                  onClick={() => setSpec(s.key)}
                  style={{
                    flex: '1 1 110px',
                    minWidth: 110,
                    padding: '10px 10px 14px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    border: `2px solid ${sel ? s.color : 'rgba(40,60,80,0.5)'}`,
                    background: sel ? `${s.color}18` : 'rgba(6,14,30,0.8)',
                    boxShadow: sel ? `0 0 16px ${s.color}44` : 'none',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                  }}
                >
                  <img
                    src={`/assets/space/ui/commanders-bg/${portraitIdx}.png`}
                    alt={s.label}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      border: `2px solid ${sel ? s.color : '#1a3050'}`,
                      objectFit: 'cover',
                      marginBottom: 8,
                      display: 'block',
                      marginLeft: 'auto',
                      marginRight: 'auto',
                      filter: sel ? 'none' : 'brightness(0.7)',
                      transition: 'filter 0.2s',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div style={{ fontSize: 13, fontWeight: 800, color: sel ? s.color : '#fff', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 8, color: 'rgba(160,200,255,0.4)', letterSpacing: 0.5 }}>{s.planet}</div>
                  <div style={{ fontSize: 9, color: s.color, fontWeight: 700, marginTop: 4 }}>{s.bonus}</div>
                  {sel && <div style={{ fontSize: 9, color: 'rgba(160,200,255,0.6)', marginTop: 6, lineHeight: 1.4 }}>{s.desc}</div>}
                </div>
              );
            })}
          </div>

          {/* ── AI Difficulty ──────────────────────────────── */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              marginBottom: 14,
              background: 'rgba(6,14,30,0.7)',
              border: '1px solid rgba(40,60,80,0.4)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8ac', marginBottom: 8, letterSpacing: 1 }}>AI DIFFICULTY</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { d: 1, label: 'PASSIVE', desc: 'Random builds, no tech, wanders', color: '#44ee88' },
                { d: 2, label: 'BASIC', desc: 'Cheap fighters, basic expansion', color: '#88cc44' },
                { d: 3, label: 'BALANCED', desc: 'Good composition, flanking, tech', color: '#ffaa22' },
                { d: 4, label: 'AGGRESSIVE', desc: 'Multi-front, void powers, micro', color: '#ff6644' },
                { d: 5, label: 'OPTIMAL', desc: 'Perfect economy, strafe micro', color: '#ff4444' },
              ].map((opt) => (
                <div
                  key={opt.d}
                  onClick={() => setAiDifficulty(opt.d)}
                  style={{
                    flex: '1 1 100px',
                    minWidth: 100,
                    padding: '8px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    textAlign: 'center',
                    border: aiDifficulty === opt.d ? `2px solid ${opt.color}` : '1px solid rgba(40,60,80,0.4)',
                    background: aiDifficulty === opt.d ? `${opt.color}18` : 'rgba(6,14,30,0.6)',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: aiDifficulty === opt.d ? opt.color : '#68a' }}>{opt.label}</div>
                  <div style={{ fontSize: 8, color: 'rgba(160,200,255,0.4)', marginTop: 2 }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Team Color Selection ─────────────────────────── */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              marginBottom: 14,
              background: 'rgba(6,14,30,0.7)',
              border: '1px solid rgba(40,60,80,0.4)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8ac', marginBottom: 8, letterSpacing: 1 }}>YOUR TEAM COLOR</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TEAM_COLOR_PALETTE.map((c, i) => (
                <div
                  key={i}
                  onClick={() => setPlayerColorIdx(i)}
                  title={c.label}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: hexStr(c.hex),
                    border: playerColorIdx === i ? '3px solid #fff' : '2px solid rgba(255,255,255,0.15)',
                    boxShadow: playerColorIdx === i ? `0 0 10px ${hexStr(c.hex)}` : 'none',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── Enemy Color Mode ─────────────────────────────── */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              marginBottom: 18,
              background: 'rgba(6,14,30,0.7)',
              border: '1px solid rgba(40,60,80,0.4)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8ac', marginBottom: 8, letterSpacing: 1 }}>ENEMY COLORS</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <div
                onClick={() => setEnemyColorMode('unique')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 10,
                  fontWeight: 700,
                  background: enemyColorMode === 'unique' ? 'rgba(68,136,255,0.25)' : 'rgba(6,14,30,0.6)',
                  border: enemyColorMode === 'unique' ? '1px solid #4488ff' : '1px solid rgba(40,60,80,0.4)',
                  color: enemyColorMode === 'unique' ? '#6af' : '#68a',
                }}
              >
                UNIQUE (EACH THEIR OWN)
              </div>
              <div
                onClick={() => setEnemyColorMode('all_one')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 10,
                  fontWeight: 700,
                  background: enemyColorMode === 'all_one' ? 'rgba(255,68,68,0.25)' : 'rgba(6,14,30,0.6)',
                  border: enemyColorMode === 'all_one' ? '1px solid #ff4444' : '1px solid rgba(40,60,80,0.4)',
                  color: enemyColorMode === 'all_one' ? '#f66' : '#68a',
                }}
              >
                ALL ENEMIES ONE COLOR
              </div>
            </div>
            {enemyColorMode === 'all_one' && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TEAM_COLOR_PALETTE.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (i !== playerColorIdx) setEnemyColorIdx(i);
                    }}
                    title={i === playerColorIdx ? `${c.label} (your color)` : c.label}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 5,
                      cursor: i === playerColorIdx ? 'not-allowed' : 'pointer',
                      background: hexStr(c.hex),
                      border: enemyColorIdx === i ? '3px solid #fff' : '2px solid rgba(255,255,255,0.12)',
                      boxShadow: enemyColorIdx === i ? `0 0 8px ${hexStr(c.hex)}` : 'none',
                      opacity: i === playerColorIdx ? 0.25 : 1,
                      transition: 'all 0.15s',
                    }}
                  />
                ))}
              </div>
            )}
            {enemyColorMode === 'unique' && (
              <div style={{ fontSize: 9, color: 'rgba(160,200,255,0.4)' }}>
                Each enemy team will have a different color, just like Warcraft III.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', paddingTop: 4 }}>
            <Btn label="BACK" onClick={onCancel} style={{ minWidth: 100, height: 36 }} />
            <Btn label="DEPLOY" wide active onClick={onConfirm} />
          </div>
        </div>
        {/* end scroll container */}
      </Panel>
    </div>
  );
}

// ── Main Menu ─────────────────────────────────────────────────────
function MainMenu({
  onStart,
  onCampaign,
  onCodex,
  onHowTo,
  onEditor,
  onUniverse,
  onGroundCombat,
  onGroundRts,
  mode,
  setMode,
  user,
  onLogin,
  onLogout,
}: {
  onStart: () => void;
  onCampaign: () => void;
  onCodex: () => void;
  onHowTo: () => void;
  onEditor: () => void;
  onUniverse: () => void;
  onGroundCombat: () => void;
  onGroundRts: () => void;
  mode: GameMode;
  setMode: (m: GameMode) => void;
  user: GrudgeUser | null;
  onLogin: (provider?: 'discord' | 'google' | 'github') => void;
  onLogout: () => void;
}) {
  const [hotkeysOpen, setHotkeysOpen] = useState(false);
  const [zoomTarget, setZoomTarget] = useState<[number, number, number] | null>(null);
  const [uiFading, setUiFading] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

  // Trigger zoom-in loading transition, then fire the action after zoom completes
  const launchWithZoom = useCallback((action: () => void) => {
    const home = STAR_SYSTEMS.find((s) => s.id === 'grudge_prime');
    setZoomTarget(home?.position ?? [0, 0.2, 0]);
    setUiFading(true);
    pendingAction.current = action;
  }, []);

  const handleZoomComplete = useCallback(() => {
    // Small delay for the final black flash
    setTimeout(() => {
      pendingAction.current?.();
      pendingAction.current = null;
      setZoomTarget(null);
      setUiFading(false);
    }, 300);
  }, []);

  const quickModes: { key: GameMode; label: string; desc: string }[] = [
    { key: '1v1', label: 'INNER SYSTEM', desc: '2 commanders · 7 planets' },
    { key: '2v2', label: 'OUTER SYSTEM', desc: '4 commanders · 14 planets' },
    { key: 'ffa4', label: 'FULL SECTOR', desc: '4-way free-for-all' },
  ];
  // ── Shared panel style (opaque dark glass — no image backgrounds) ──
  const panelBase: React.CSSProperties = {
    padding: '24px 28px',
    width: 300,
    maxWidth: '90vw',
    borderRadius: 12,
    background: 'rgba(6,12,24,0.92)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(68,136,255,0.15)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
  };
  const panelTitle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    paddingBottom: 8,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  };
  const launchBtn = (color: string, hoverGlow: string): React.CSSProperties => ({
    width: '100%',
    height: 44,
    border: 'none',
    borderRadius: 8,
    background: `linear-gradient(135deg, ${color}, ${color}88)`,
    color: '#fff',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 2,
    cursor: 'pointer',
    transition: 'box-shadow 0.2s, transform 0.1s',
    boxShadow: `0 4px 16px ${hoverGlow}`,
    textTransform: 'uppercase',
  });
  const authBtn = (bg: string, border: string, color: string): React.CSSProperties => ({
    padding: '6px 16px',
    fontSize: 11,
    fontWeight: 700,
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 6,
    color,
    cursor: 'pointer',
    letterSpacing: 1,
    transition: 'background 0.15s',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#010308',
        color: '#cde',
        zIndex: 100,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* 3D Galaxy background */}
      <GalaxyMap
        onSelectSystem={(id) => {
          if (id === 'grudge_prime') launchWithZoom(onStart);
        }}
        zoomTarget={zoomTarget}
        onZoomComplete={handleZoomComplete}
        controlsDisabled={!!zoomTarget}
      />

      {/* Black flash overlay during zoom */}
      {zoomTarget && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#000',
            zIndex: 200,
            opacity: uiFading ? 0 : 1,
            transition: 'opacity 0.3s',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Scrollable content — fades out during zoom */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '48px 16px 32px',
          width: '100%',
          maxWidth: 1100,
          opacity: uiFading ? 0 : 1,
          transition: 'opacity 0.6s ease-out',
          pointerEvents: uiFading ? 'none' : 'auto',
        }}
      >
        {/* ── Logo ── */}
        <img
          src="/assets/space/ui/logo.webp"
          alt="GRUDA ARMADA"
          style={{
            width: 340,
            maxWidth: '80vw',
            display: 'block',
            marginBottom: 6,
            filter: 'drop-shadow(0 0 40px rgba(68,136,255,0.4)) drop-shadow(0 0 16px rgba(200,30,30,0.25))',
          }}
          onError={(e) => {
            const t = e.target as HTMLImageElement;
            if (!t.src.endsWith('.svg')) t.src = '/assets/space/ui/logo.svg';
            else t.style.display = 'none';
          }}
        />
        <div style={{ fontSize: 11, opacity: 0.3, letterSpacing: 5, textTransform: 'uppercase', marginBottom: 24 }}>
          Tactical Space RTS · by Racalvin The Pirate King
        </div>

        {/* ── Auth bar ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 36,
            padding: '8px 20px',
            borderRadius: 8,
            background: 'rgba(10,18,36,0.8)',
            border: '1px solid rgba(68,136,255,0.1)',
          }}
        >
          {user ? (
            <>
              {user.avatarUrl && <img src={user.avatarUrl} alt="" style={{ width: 26, height: 26, borderRadius: 6 }} />}
              <span style={{ fontSize: 13, color: '#4df', fontWeight: 600 }}>{user.displayName}</span>
              <span style={{ fontSize: 9, color: '#456', letterSpacing: 1 }}>GRUDGE ID</span>
              <button onClick={onLogout} style={authBtn('transparent', 'rgba(255,68,68,0.25)', '#f66')}>
                LOGOUT
              </button>
            </>
          ) : (
            <>
              <span style={{ fontSize: 10, color: '#456', letterSpacing: 1 }}>GUEST MODE</span>
              <button onClick={() => onLogin('discord')} style={authBtn('rgba(88,101,242,0.15)', 'rgba(88,101,242,0.35)', '#7289da')}>
                DISCORD
              </button>
              <button onClick={() => onLogin('google')} style={authBtn('rgba(255,255,255,0.04)', 'rgba(255,255,255,0.1)', '#aab')}>
                GOOGLE
              </button>
              <button onClick={() => onLogin('github')} style={authBtn('rgba(255,255,255,0.04)', 'rgba(255,255,255,0.1)', '#aab')}>
                GITHUB
              </button>
            </>
          )}
        </div>

        {/* ── Three-column game mode cards ── */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* ── QUICK GAME ── */}
          <div style={{ ...panelBase, borderColor: 'rgba(68,136,255,0.2)' }}>
            <div style={{ ...panelTitle, color: '#4488ff' }}>⚔ QUICK GAME</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {quickModes.map((m) => {
                const sel = mode === m.key;
                return (
                  <div
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      border: sel ? '1px solid #4488ff' : '1px solid rgba(255,255,255,0.04)',
                      background: sel ? 'rgba(68,136,255,0.1)' : 'rgba(255,255,255,0.02)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: sel ? '#fff' : '#8ab' }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: '#456', marginTop: 2 }}>{m.desc}</div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => launchWithZoom(onStart)} style={launchBtn('#2255cc', 'rgba(34,85,204,0.3)')}>
              LAUNCH QUICK GAME
            </button>
          </div>

          {/* ── CAPTAIN'S CAMPAIGN ── */}
          <div style={{ ...panelBase, borderColor: 'rgba(255,136,34,0.2)' }}>
            <div style={{ ...panelTitle, color: '#ff8822' }}>⭐ CAPTAIN'S CAMPAIGN</div>
            <div
              onClick={() => setMode('campaign')}
              style={{
                padding: '14px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                border: mode === 'campaign' ? '1px solid #ff8822' : '1px solid rgba(255,255,255,0.04)',
                background: mode === 'campaign' ? 'rgba(255,136,34,0.08)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.15s',
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: '#ffaa44' }}>ENDLESS CONQUEST</div>
              <div style={{ fontSize: 11, color: '#665', marginTop: 6, lineHeight: 1.6 }}>
                Your shattered homeworld · Off-world base building
                <br />
                AI story events · 4 factions · Universe Wars
              </div>
            </div>
            <div style={{ fontSize: 10, color: '#334', textAlign: 'center', marginBottom: 14, lineHeight: 1.6 }}>
              10× slower gameplay · Homeworld chunks forever mine
              <br />
              Build your base · Conquer the galaxy
            </div>
            <button
              onClick={() =>
                launchWithZoom(() => {
                  setMode('campaign');
                  onCampaign();
                })
              }
              style={launchBtn('#aa5500', 'rgba(170,85,0,0.3)')}
            >
              CREATE COMMANDER
            </button>
          </div>

          {/* ── GROUND OPS ── */}
          <div style={{ ...panelBase, borderColor: 'rgba(120,60,255,0.2)' }}>
            <div style={{ ...panelTitle, color: '#aa66ff' }}>🎮 GROUND OPS</div>

            <div
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(68,238,136,0.1)',
                background: 'rgba(68,238,136,0.04)',
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#44ee88' }}>SOULS COMBAT</div>
              <div style={{ fontSize: 11, color: '#456', marginTop: 4, lineHeight: 1.5 }}>
                Third-person · 6 classes · Combo chains
                <br />
                Wave survival · Dodge & parry
              </div>
            </div>
            <button
              onClick={() => launchWithZoom(onGroundCombat)}
              style={{ ...launchBtn('#1a7744', 'rgba(26,119,68,0.3)'), marginBottom: 14 }}
            >
              LAUNCH GROUND COMBAT
            </button>

            <div
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(136,204,170,0.1)',
                background: 'rgba(136,204,170,0.03)',
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#88ccaa' }}>TACTICAL RTS</div>
              <div style={{ fontSize: 11, color: '#456', marginTop: 4, lineHeight: 1.5 }}>
                Top-down · Squad command · 4 mission types
                <br />
                Flanking & morale · A* pathfinding
              </div>
            </div>
            <button onClick={() => launchWithZoom(onGroundRts)} style={launchBtn('#335566', 'rgba(51,85,102,0.3)')}>
              LAUNCH GROUND RTS
            </button>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ width: 400, maxWidth: '90vw', height: 1, background: 'rgba(255,255,255,0.04)', marginBottom: 20 }} />

        {/* ── Bottom nav buttons ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
          {[
            { label: 'UNIVERSE MAP', onClick: onUniverse },
            { label: 'SHIP FORGE', onClick: onEditor },
            { label: 'CODEX', onClick: onCodex },
            { label: 'HOW TO PLAY', onClick: onHowTo },
            { label: 'HOTKEYS', onClick: () => setHotkeysOpen(true) },
            { label: 'ADMIN', onClick: () => window.open('/admin.html', '_blank') },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              style={{
                padding: '8px 20px',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 2,
                color: '#6a8a9a',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(68,200,255,0.3)';
                e.currentTarget.style.color = '#aaccdd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.color = '#6a8a9a';
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {hotkeysOpen && <HotkeySettings onClose={() => setHotkeysOpen(false)} />}

        {/* Legal */}
        <div style={{ display: 'flex', gap: 16, fontSize: 10, opacity: 0.25 }}>
          <a href="/privacy.html" target="_blank" rel="noopener" style={{ color: '#8ac', textDecoration: 'none' }}>
            Privacy Policy
          </a>
          <span style={{ color: '#222' }}>·</span>
          <a href="/tos.html" target="_blank" rel="noopener" style={{ color: '#8ac', textDecoration: 'none' }}>
            Terms of Service
          </a>
          <span style={{ color: '#222' }}>·</span>
          <span style={{ color: '#334' }}>© 2026 Grudge Studio</span>
        </div>
      </div>
    </div>
  );
}

// ── Campaign Commander Builder Modal ────────────────────────
const ORIGINS: { key: CommanderOrigin; label: string; icon: string; desc: string; faction: SpaceFaction }[] = [
  { key: 'scientist', label: 'Scientist', icon: '🔬', desc: 'Knowledge drives you. Research faster, see further.', faction: 'wisdom' },
  { key: 'engineer', label: 'Engineer', icon: '⚙️', desc: 'You build. Faster construction, stronger structures.', faction: 'construct' },
  { key: 'soldier', label: 'Soldier', icon: '⚔️', desc: 'War is all you know. Bigger fleets, harder hits.', faction: 'legion' },
  { key: 'outcast', label: 'Outcast', icon: '🕳️', desc: 'Cast out. You learned the dark arts of the void.', faction: 'void' },
];
const PERSONALITIES: { key: CommanderPersonality; label: string; icon: string }[] = [
  { key: 'strategic', label: 'Strategic', icon: '🎯' },
  { key: 'aggressive', label: 'Aggressive', icon: '🔥' },
  { key: 'diplomatic', label: 'Diplomatic', icon: '🤝' },
  { key: 'mysterious', label: 'Mysterious', icon: '🌙' },
];
const MOTIVATIONS: { key: CommanderMotivation; label: string; icon: string }[] = [
  { key: 'knowledge', label: 'Knowledge', icon: '📚' },
  { key: 'survival', label: 'Survival', icon: '🛡️' },
  { key: 'revenge', label: 'Revenge', icon: '💢' },
  { key: 'legacy', label: 'Legacy', icon: '⭐' },
];

function CampaignBuilderModal({
  user,
  onComplete,
  onCancel,
}: {
  user: GrudgeUser | null;
  onComplete: (build: CommanderBuild) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0); // 0=name, 1=origin, 2=personality, 3=motivation, 4=generating, 5=done
  const [name, setName] = useState(user?.displayName ?? '');
  const [origin, setOrigin] = useState<CommanderOrigin>('soldier');
  const [personality, setPersonality] = useState<CommanderPersonality>('strategic');
  const [motivation, setMotivation] = useState<CommanderMotivation>('survival');
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [portraitPrompt, setPortraitPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const faction = ORIGINS.find((o) => o.key === origin)?.faction ?? 'legion';
  const fData = FACTION_DATA[faction];

  const generatePortrait = async () => {
    setGenerating(true);
    setStep(4);
    try {
      const API_URL = import.meta.env.VITE_GRUDGE_API ?? '';
      if (API_URL) {
        const res = await authFetch(`${API_URL}/ai/narrate/portrait`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, origin, personality, motivation, faction }),
        });
        if (res.ok) {
          const data = await res.json();
          setPortraitUrl(data.imageUrl || null);
          setPortraitPrompt(data.prompt || '');
        }
      }
    } catch {
      /* fallback to default portrait */
    }
    setGenerating(false);
    setStep(5);
  };

  const finish = () => {
    onComplete({ name: name || 'Commander', origin, personality, motivation, faction, portraitUrl, portraitPrompt });
  };

  const fallbackPortrait = `/assets/space/ui/commanders-bg/${{ scientist: 9, engineer: 1, soldier: 5, outcast: 13 }[origin]}.png`;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.92)',
        fontFamily: "'Segoe UI', monospace",
        color: '#cde',
      }}
    >
      <Panel title="FORGE YOUR COMMANDER" onClose={onCancel} width={640} style={{ maxWidth: '94vw', maxHeight: '90vh' }}>
        <div style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 100px)', padding: '0 4px' }}>
          {/* Step 0: Name */}
          {step === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 12, color: 'rgba(160,200,255,0.5)', marginBottom: 16 }}>
                Your homeworld burns. You escaped. Who are you?
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 24))}
                placeholder="Enter your commander name..."
                style={{
                  width: 300,
                  padding: '12px 16px',
                  fontSize: 16,
                  fontWeight: 700,
                  background: 'rgba(6,14,30,0.9)',
                  border: '2px solid #4488ff44',
                  borderRadius: 8,
                  color: '#fff',
                  outline: 'none',
                  textAlign: 'center',
                  letterSpacing: 1,
                }}
                onFocus={(e) => (e.target.style.borderColor = '#4488ff')}
                onBlur={(e) => (e.target.style.borderColor = '#4488ff44')}
                autoFocus
              />
              <div style={{ marginTop: 20 }}>
                <Btn label="NEXT" wide active onClick={() => setStep(1)} disabled={!name.trim()} />
              </div>
            </div>
          )}

          {/* Step 1: Origin (determines faction) */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 11, color: 'rgba(160,200,255,0.5)', textAlign: 'center', marginBottom: 14 }}>
                Before the armageddon, you were a...
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {ORIGINS.map((o) => {
                  const sel = origin === o.key;
                  const fc = FACTION_DATA[o.faction];
                  return (
                    <div
                      key={o.key}
                      onClick={() => setOrigin(o.key)}
                      style={{
                        padding: 14,
                        borderRadius: 8,
                        cursor: 'pointer',
                        textAlign: 'center',
                        border: sel ? `2px solid ${fc.color}` : '1px solid #1a305066',
                        background: sel ? `${fc.color}15` : 'rgba(6,14,30,0.7)',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: 28, marginBottom: 4 }}>{o.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: sel ? fc.color : '#cde' }}>{o.label}</div>
                      <div style={{ fontSize: 9, color: 'rgba(160,200,255,0.5)', marginTop: 4 }}>{o.desc}</div>
                      <div style={{ fontSize: 8, color: fc.color, marginTop: 6, fontWeight: 700 }}>
                        {fc.icon} {fc.label} FACTION
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
                <Btn label="BACK" onClick={() => setStep(0)} />
                <Btn label="NEXT" wide active onClick={() => setStep(2)} />
              </div>
            </div>
          )}

          {/* Step 2: Personality */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 11, color: 'rgba(160,200,255,0.5)', textAlign: 'center', marginBottom: 14 }}>How do you lead?</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {PERSONALITIES.map((p) => (
                  <div
                    key={p.key}
                    onClick={() => setPersonality(p.key)}
                    style={{
                      padding: '12px 20px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      textAlign: 'center',
                      minWidth: 100,
                      border: personality === p.key ? `2px solid ${fData.color}` : '1px solid #1a305066',
                      background: personality === p.key ? `${fData.color}15` : 'rgba(6,14,30,0.7)',
                    }}
                  >
                    <div style={{ fontSize: 22 }}>{p.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>{p.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
                <Btn label="BACK" onClick={() => setStep(1)} />
                <Btn label="NEXT" wide active onClick={() => setStep(3)} />
              </div>
            </div>
          )}

          {/* Step 3: Motivation */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 11, color: 'rgba(160,200,255,0.5)', textAlign: 'center', marginBottom: 14 }}>
                What drives you among the stars?
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {MOTIVATIONS.map((m) => (
                  <div
                    key={m.key}
                    onClick={() => setMotivation(m.key)}
                    style={{
                      padding: '12px 20px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      textAlign: 'center',
                      minWidth: 100,
                      border: motivation === m.key ? `2px solid ${fData.color}` : '1px solid #1a305066',
                      background: motivation === m.key ? `${fData.color}15` : 'rgba(6,14,30,0.7)',
                    }}
                  >
                    <div style={{ fontSize: 22 }}>{m.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>{m.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
                <Btn label="BACK" onClick={() => setStep(2)} />
                <Btn label="GENERATE COMMANDER" wide active onClick={generatePortrait} />
              </div>
            </div>
          )}

          {/* Step 4: Generating */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 14, color: fData.color, fontWeight: 700, marginBottom: 12 }}>FORGING YOUR COMMANDER...</div>
              <div style={{ fontSize: 11, color: 'rgba(160,200,255,0.4)' }}>AI is generating your portrait. This may take a moment.</div>
              <div style={{ marginTop: 20, fontSize: 24, animation: 'spin 1s linear infinite' }}>{fData.icon}</div>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Step 5: Result */}
          {step === 5 && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  width: 200,
                  height: 200,
                  margin: '0 auto 16px',
                  borderRadius: 12,
                  border: `3px solid ${fData.color}`,
                  overflow: 'hidden',
                  boxShadow: `0 0 30px ${fData.color}44`,
                  background: 'rgba(6,14,30,0.9)',
                }}
              >
                <img
                  src={portraitUrl || fallbackPortrait}
                  alt={name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackPortrait;
                  }}
                />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: 2, marginBottom: 4 }}>{name}</div>
              <div style={{ fontSize: 11, color: fData.color, fontWeight: 700, marginBottom: 4 }}>
                {fData.icon} {fData.label} · {ORIGINS.find((o) => o.key === origin)?.label}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(160,200,255,0.4)', marginBottom: 16 }}>
                {PERSONALITIES.find((p) => p.key === personality)?.label} · {MOTIVATIONS.find((m) => m.key === motivation)?.label}
              </div>
              {!portraitUrl && (
                <div style={{ fontSize: 9, color: '#886644', marginBottom: 12 }}>
                  Portrait generation unavailable — using default portrait
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <Btn label="REDO" onClick={() => setStep(0)} />
                <Btn label="BEGIN CAMPAIGN" wide active onClick={finish} />
              </div>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

// btn CSS removed — replaced by Btn component from ui-lib

// ── Shared codex helpers ──────────────────────────────────
// Ship previews — single authoritative source in space-ui-shared.tsx
const SHIP_PREVIEW = SHARED_SHIP_PREVIEW;

const ABILITY_ICONS: Record<string, string> = {
  cloak: '/assets/space/ui/hud/Ability07.png',
  speed_boost: '/assets/space/ui/hud/Ability08.png',
  iron_dome: '/assets/space/ui/hud/Ability09.png',
  emp: '/assets/space/ui/hud/Ability10.png',
  barrel_roll: '/assets/space/ui/hud/Ability11.png',
  warp: '/assets/space/ui/hud/Ability12.png',
  boarding: '/assets/space/ui/hud/Ability13.png',
  ram: '/assets/space/ui/hud/Ability14.png',
  repair: '/assets/space/ui/hud/Ability15.png',
  launch_fighters: '/assets/space/ui/hud/Ability16.png',
};

// Mini segmented stat bar
function StatBar({ val, max, color }: { val: number; max: number; color: string }) {
  const filled = Math.max(1, Math.round((val / Math.max(max, 1)) * 8));
  return (
    <div style={{ display: 'flex', gap: 2, height: 5 }}>
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            borderRadius: 1,
            background: i < filled ? color : 'rgba(255,255,255,0.07)',
            boxShadow: i < filled ? `0 0 3px ${color}88` : 'none',
          }}
        />
      ))}
    </div>
  );
}

// Ship card used in both fleet and hero sections
// def lookup: always check both dicts so boss ships (in SHIP_DEFINITIONS)
// and hero ships (in HERO_DEFINITIONS) both resolve regardless of flag.
function ShipCard({ shipKey, hero = false }: { shipKey: string; hero?: boolean }) {
  const def = HERO_DEFINITIONS[shipKey] ?? SHIP_DEFINITIONS[shipKey];
  const [hovered, setHovered] = useState(false);
  if (!def) return null;
  const s = def.stats;
  const preview = SHIP_PREVIEW[shipKey];
  const role = SHIP_ROLES[shipKey];
  const roleColor = role ? SHIP_ROLE_COLORS[role] : null;
  const lore = 'lore' in def ? (def as (typeof HERO_DEFINITIONS)[string]).lore : null;
  const borderCol = hero ? '#443300' : (roleColor ?? '#1a3050');

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${hovered ? (hero ? '#ffcc00' : '#4488ff') : borderCol}`,
        borderRadius: 10,
        background: hero ? 'rgba(22,14,2,0.92)' : 'rgba(6,14,30,0.92)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: hovered
          ? `0 0 16px ${hero ? 'rgba(255,180,0,0.25)' : 'rgba(68,136,255,0.25)'}`
          : hero
            ? '0 0 12px rgba(255,180,0,0.1)'
            : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Preview image */}
      <div
        style={{
          height: 120,
          background: 'rgba(2,4,12,0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${hero ? '#443300' : '#1a3050'}`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {preview && !preview.endsWith('.fbx') ? (
          <img
            src={preview}
            alt={def.displayName}
            style={{ maxHeight: 108, maxWidth: 198, objectFit: 'contain', imageRendering: 'pixelated' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div style={{ fontSize: 36, opacity: 0.18 }}>{s.tier >= 5 ? '🛸' : s.tier >= 4 ? '🛡️' : s.tier >= 3 ? '⚔️' : '🚀'}</div>
        )}
        {/* Tier badge */}
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            fontSize: 9,
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 4,
            letterSpacing: 1,
            background: hero ? 'rgba(255,180,0,0.2)' : 'rgba(68,136,255,0.18)',
            border: `1px solid ${hero ? '#ffcc0055' : '#4488ff44'}`,
            color: hero ? '#fc4' : '#4488ff',
          }}
        >
          {hero ? 'HERO' : `T${s.tier}`}
        </div>
        {/* Role badge */}
        {role && (
          <div
            style={{
              position: 'absolute',
              top: 6,
              left: 6,
              fontSize: 8,
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 3,
              letterSpacing: 0.5,
              background: `${roleColor}22`,
              border: `1px solid ${roleColor}55`,
              color: roleColor!,
            }}
          >
            {SHIP_ROLE_LABELS[role]}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px', flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: hero ? '#fc4' : '#fff', marginBottom: 2 }}>{def.displayName}</div>
        <div
          style={{
            fontSize: 9,
            color: 'rgba(160,200,255,0.4)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: lore ? 6 : 8,
          }}
        >
          {def.class.replace(/_/g, ' ')}
        </div>
        {lore && (
          <div style={{ fontSize: 9, color: '#cba', fontStyle: 'italic', marginBottom: 8, lineHeight: 1.4, opacity: 0.8 }}>
            {lore.slice(0, 80)}
            {lore.length > 80 ? '…' : ''}
          </div>
        )}

        {/* Stat bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 8, color: '#44ee44', width: 28 }}>♥ HP</span>
            <div style={{ flex: 1 }}>
              <StatBar val={s.maxHp} max={2400} color="#44ee44" />
            </div>
            <span style={{ fontSize: 8, color: 'rgba(160,200,255,0.4)', width: 32, textAlign: 'right' }}>{s.maxHp}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 8, color: '#44ccff', width: 28 }}>🛡 SHD</span>
            <div style={{ flex: 1 }}>
              <StatBar val={s.maxShield} max={1000} color="#44ccff" />
            </div>
            <span style={{ fontSize: 8, color: 'rgba(160,200,255,0.4)', width: 32, textAlign: 'right' }}>{s.maxShield}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 8, color: '#ff8844', width: 28 }}>⚔ DMG</span>
            <div style={{ flex: 1 }}>
              <StatBar val={s.attackDamage} max={200} color="#ff8844" />
            </div>
            <span style={{ fontSize: 8, color: 'rgba(160,200,255,0.4)', width: 32, textAlign: 'right' }}>{s.attackDamage}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 8, color: '#ffcc00', width: 28 }}>SPD</span>
            <div style={{ flex: 1 }}>
              <StatBar val={s.speed} max={160} color="#ffcc00" />
            </div>
            <span style={{ fontSize: 8, color: 'rgba(160,200,255,0.4)', width: 32, textAlign: 'right' }}>{s.speed}</span>
          </div>
        </div>

        {/* Cost strip */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            fontSize: 9,
            color: 'rgba(160,200,255,0.45)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            paddingTop: 6,
            marginBottom: 6,
          }}
        >
          <span style={{ color: '#fc4' }}>{s.creditCost}c</span>
          <span style={{ color: '#4df' }}>{s.energyCost}e</span>
          <span style={{ color: '#4f8' }}>{s.mineralCost}m</span>
          <span style={{ marginLeft: 'auto', color: 'rgba(160,200,255,0.3)' }}>{s.buildTime}s</span>
        </div>

        {/* Abilities */}
        {s.abilities && s.abilities.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {s.abilities.map((ab) => (
              <div
                key={ab.id}
                title={ab.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 8,
                  padding: '2px 5px',
                  borderRadius: 3,
                  background: 'rgba(68,220,255,0.08)',
                  border: '1px solid rgba(68,220,255,0.2)',
                  color: '#4df',
                }}
              >
                <img
                  src={ABILITY_ICONS[ab.type] ?? '/assets/space/ui/hud/Ability01.png'}
                  alt=""
                  style={{ width: 12, height: 12, imageRendering: 'pixelated' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
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
  const [tab, setTab] = useState<'ships' | 'heroes' | 'commanders' | 'upgrades'>('ships');
  const [tierFilter, setTierF] = useState(0);
  const [roleFilter, setRoleF] = useState<ShipRoleType | null>(null);

  const allShipKeys = Object.values(BUILDABLE_SHIPS).flat();
  const filtered = allShipKeys.filter((k) => {
    const def = SHIP_DEFINITIONS[k];
    if (!def) return false;
    if (tierFilter !== 0 && def.stats.tier !== tierFilter) return false;
    if (roleFilter && SHIP_ROLES[k] !== roleFilter) return false;
    return true;
  });

  const shipCount = allShipKeys.length;
  const heroCount = HERO_SHIPS.length;

  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const tabStyle = (t: typeof tab): React.CSSProperties => ({
    padding: '8px 22px',
    border: 'none',
    borderBottom: tab === t ? '2px solid #4488ff' : hoveredTab === t ? '2px solid rgba(68,136,255,0.4)' : '2px solid transparent',
    background: 'transparent',
    color: tab === t ? '#4488ff' : hoveredTab === t ? 'rgba(160,200,255,0.7)' : 'rgba(160,200,255,0.45)',
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: 1.5,
    cursor: 'pointer',
    textTransform: 'uppercase',
    transition: 'all 0.15s',
  });

  const SPECS: { spec: CommanderSpec; planet: string; color: string; bonus: string; emoji: string }[] = [
    { spec: 'forge', planet: 'Volcanic', color: '#ff6644', bonus: '+ATK / Weapons', emoji: '🔥' },
    { spec: 'tide', planet: 'Oceanic', color: '#4488ff', bonus: '+DEF / Shields', emoji: '🌊' },
    { spec: 'prism', planet: 'Crystalline', color: '#44ddff', bonus: '+ECO / Economy', emoji: '💎' },
    { spec: 'vortex', planet: 'Gas Giant', color: '#ffaa22', bonus: '+SPD / Mobility', emoji: '⚡' },
    { spec: 'void', planet: 'Barren', color: '#aa8866', bonus: '+ALL / Stealth', emoji: '⬛' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#010308',
        color: '#cde',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Segoe UI', monospace",
      }}
    >
      <StarfieldCanvas />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* ── Header ──────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 32px',
            borderBottom: '1px solid #1a3050',
            background: 'rgba(1,3,8,0.9)',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 900, color: '#4488ff', letterSpacing: 4 }}>GRUDA ARMADA</div>
          <div style={{ fontSize: 10, color: 'rgba(160,200,255,0.35)', letterSpacing: 2, marginRight: 16 }}>CODEX</div>
          {/* Tabs */}
          <button
            style={tabStyle('ships')}
            onClick={() => setTab('ships')}
            onMouseEnter={() => setHoveredTab('ships')}
            onMouseLeave={() => setHoveredTab(null)}
          >
            🚀 Fleet ({shipCount})
          </button>
          <button
            style={tabStyle('heroes')}
            onClick={() => setTab('heroes')}
            onMouseEnter={() => setHoveredTab('heroes')}
            onMouseLeave={() => setHoveredTab(null)}
          >
            ⭐ Heroes ({heroCount})
          </button>
          <button
            style={tabStyle('commanders')}
            onClick={() => setTab('commanders')}
            onMouseEnter={() => setHoveredTab('commanders')}
            onMouseLeave={() => setHoveredTab(null)}
          >
            👤 Commanders (5)
          </button>
          <button
            style={tabStyle('upgrades')}
            onClick={() => setTab('upgrades')}
            onMouseEnter={() => setHoveredTab('upgrades')}
            onMouseLeave={() => setHoveredTab(null)}
          >
            ⚡ Upgrades
          </button>
          <div style={{ flex: 1 }} />
          <Btn label="← BACK" onClick={onBack} style={{ minWidth: 80, height: 32 }} />
        </div>

        {/* ── SHIPS TAB ───────────────────────────────── */}
        {tab === 'ships' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            {/* Tier filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'rgba(160,200,255,0.4)', letterSpacing: 2, marginRight: 4 }}>TIER</span>
              {[0, 1, 2, 3, 4, 5].map((t) => (
                <button
                  key={t}
                  onClick={() => setTierF(t)}
                  style={{
                    padding: '4px 14px',
                    border: `1px solid ${tierFilter === t ? '#4488ff' : '#1a3050'}`,
                    borderRadius: 4,
                    background: tierFilter === t ? 'rgba(68,136,255,0.15)' : 'transparent',
                    color: tierFilter === t ? '#4488ff' : 'rgba(160,200,255,0.4)',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {t === 0 ? 'ALL' : `T${t}`}
                </button>
              ))}
            </div>
            {/* Role filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'rgba(160,200,255,0.4)', letterSpacing: 2, marginRight: 4 }}>ROLE</span>
              <button
                onClick={() => setRoleF(null)}
                style={{
                  padding: '4px 12px',
                  border: `1px solid ${!roleFilter ? '#4488ff' : '#1a3050'}`,
                  borderRadius: 4,
                  background: !roleFilter ? 'rgba(68,136,255,0.15)' : 'transparent',
                  color: !roleFilter ? '#4488ff' : 'rgba(160,200,255,0.4)',
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                ALL
              </button>
              {(Object.entries(SHIP_ROLE_LABELS) as [ShipRoleType, string][]).map(([r, lbl]) => {
                const c = SHIP_ROLE_COLORS[r];
                const active = roleFilter === r;
                return (
                  <button
                    key={r}
                    onClick={() => setRoleF(active ? null : r)}
                    style={{
                      padding: '4px 12px',
                      border: `1px solid ${active ? c : `${c}44`}`,
                      borderRadius: 4,
                      background: active ? `${c}22` : 'transparent',
                      color: active ? c : `${c}88`,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {lbl}
                  </button>
                );
              })}
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(160,200,255,0.35)' }}>
                {filtered.length} ship{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
            {/* Ship grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16 }}>
              {filtered.map((k) => (
                <ShipCard key={k} shipKey={k} />
              ))}
            </div>
          </div>
        )}

        {/* ── HEROES TAB ──────────────────────────────── */}
        {tab === 'heroes' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            {/* Commander requirement banner */}
            <div
              style={{
                padding: '12px 20px',
                marginBottom: 28,
                background: 'rgba(255,180,0,0.07)',
                border: '1px solid rgba(255,180,0,0.2)',
                borderRadius: 8,
                display: 'flex',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <img
                src="/assets/space/ui/commanders-bg/1.png"
                alt=""
                style={{ width: 64, height: 64, borderRadius: 8, border: '2px solid #fc4', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fc4', marginBottom: 2 }}>★ Hero Class ships require a Commander</div>
                <div style={{ fontSize: 11, color: 'rgba(200,180,100,0.7)', lineHeight: 1.5 }}>
                  Train a Commander at any owned planet before queueing a Hero ship. If the Dreadnought is destroyed, the Commander is
                  permanently lost.
                </div>
              </div>
            </div>
            {/* Hero ship cards */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              {HERO_SHIPS.map((k) => (
                <ShipCard key={k} shipKey={k} hero />
              ))}
            </div>
            {/* Dreadnoughts */}
            <div style={{ marginTop: 32, borderTop: '1px solid rgba(255,180,0,0.2)', paddingTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ff8822', marginBottom: 16, letterSpacing: 2 }}>
                🛸 TECH-UNLOCKED DREADNOUGHTS
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                {['boss_ship_01', 'boss_ship_02'].map((k) => (
                  <ShipCard key={k} shipKey={k} hero />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── COMMANDERS TAB ───────────────────────────── */}
        {tab === 'commanders' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            <div style={{ fontSize: 13, color: 'rgba(160,200,255,0.6)', maxWidth: 760, lineHeight: 1.8, marginBottom: 22 }}>
              Train commanders at owned planets. Each specialization matches the planet's biome and scales from level 1 to 5 with{' '}
              <strong style={{ color: '#44ee88' }}>+5% all-stat growth per level</strong>. A max-rank commander buffs the equipped Hero ship
              by <strong style={{ color: '#44ee88' }}>+25%</strong> across the board.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 34 }}>
              {SPECS.map(({ spec, planet, color, bonus, emoji }, idx) => {
                const portraitIdx = [1, 5, 9, 13, 17][idx];
                const trainCosts = [
                  { lv: 1, c: 200, e: 80, m: 100 },
                  { lv: 2, c: 400, e: 160, m: 200 },
                  { lv: 3, c: 700, e: 280, m: 350 },
                  { lv: 4, c: 1100, e: 440, m: 550 },
                  { lv: 5, c: 1600, e: 640, m: 800 },
                ];
                return (
                  <div
                    key={spec}
                    style={{
                      border: `1px solid ${color}44`,
                      borderRadius: 12,
                      background: 'rgba(6,14,30,0.94)',
                      overflow: 'hidden',
                      boxShadow: `0 0 18px ${color}22`,
                    }}
                  >
                    <div
                      style={{
                        padding: 10,
                        borderBottom: `1px solid ${color}33`,
                        background: `linear-gradient(180deg, ${color}18, transparent)`,
                      }}
                    >
                      <img
                        src={`/assets/space/ui/commanders-bg/${portraitIdx}.png`}
                        alt={spec}
                        style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8, border: `1px solid ${color}55` }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div style={{ padding: '12px 14px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{COMMANDER_SPEC_LABEL[spec]}</div>
                        <div style={{ fontSize: 16, lineHeight: 1 }}>{emoji}</div>
                      </div>
                      <div style={{ fontSize: 10, color, letterSpacing: 1, marginBottom: 4 }}>{planet} · COMMANDER</div>
                      <div style={{ fontSize: 10, color: 'rgba(160,200,255,0.6)', marginBottom: 10 }}>{bonus}</div>
                      <div style={{ fontSize: 9, color: 'rgba(160,200,255,0.4)', letterSpacing: 1, marginBottom: 7 }}>
                        TRAINING COSTS &amp; BONUSES
                      </div>
                      {trainCosts.map(({ lv, c, e, m }) => {
                        const pct = lv * 5;
                        return (
                          <div
                            key={lv}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '22px 1fr auto',
                              gap: 7,
                              alignItems: 'center',
                              marginBottom: 6,
                              fontSize: 9,
                            }}
                          >
                            <span style={{ color, fontWeight: 700 }}>L{lv}</span>
                            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                              <div style={{ height: '100%', width: `${pct * 4}%`, background: color, borderRadius: 2 }} />
                            </div>
                            <span style={{ color, fontWeight: 700 }}>+{pct}%</span>
                            <span style={{ color: 'rgba(160,200,255,0.34)', gridColumn: '2 / span 2', fontSize: 8 }}>
                              {c}c / {e}e / {m}m
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ borderTop: '1px solid #1a3050', paddingTop: 18 }}>
              <div style={{ fontSize: 11, color: 'rgba(160,200,255,0.4)', letterSpacing: 2, marginBottom: 12 }}>
                COMMANDER ROSTER (ALL 20 PORTRAITS)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 10 }}>
                {Array.from({ length: 20 }, (_, i) => (
                  <img
                    key={i}
                    src={`/assets/space/ui/commanders-bg/${i + 1}.png`}
                    alt={`Commander ${i + 1}`}
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid rgba(68,136,255,0.35)',
                      boxShadow: '0 0 8px rgba(68,136,255,0.22)',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── UPGRADES TAB ────────────────────────────── */}
        {tab === 'upgrades' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            <div style={{ fontSize: 13, color: 'rgba(160,200,255,0.6)', maxWidth: 580, lineHeight: 1.8, marginBottom: 28 }}>
              Global upgrades apply to <strong style={{ color: '#fff' }}>every ship you build</strong> from that point on. Costs scale each
              level. Your starting planet type grants a<strong style={{ color: '#ffcc00' }}> 20% discount</strong> on its matching upgrade.
            </div>

            {/* 5 upgrade types */}
            {(
              [
                {
                  key: 'attack',
                  label: 'Attack',
                  color: '#ff4444',
                  desc: 'Weapon damage multiplier for all ships.',
                  bonuses: UPGRADE_BONUSES.attack,
                },
                {
                  key: 'armor',
                  label: 'Armor',
                  color: '#8ac4d4',
                  desc: 'Flat armor bonus reduces every hit taken.',
                  bonuses: UPGRADE_BONUSES.armor,
                },
                {
                  key: 'speed',
                  label: 'Speed',
                  color: '#ffcc00',
                  desc: 'Movement speed multiplier across all units.',
                  bonuses: UPGRADE_BONUSES.speed,
                },
                {
                  key: 'health',
                  label: 'Health',
                  color: '#44ee44',
                  desc: 'Max HP multiplier — compounds with rank.',
                  bonuses: UPGRADE_BONUSES.health,
                },
                {
                  key: 'shield',
                  label: 'Shield',
                  color: '#44ccff',
                  desc: 'Max shield multiplier for all shield values.',
                  bonuses: UPGRADE_BONUSES.shield,
                },
              ] as const
            ).map(({ key, label, color, desc, bonuses }) => {
              const discountPlanet = Object.entries(PLANET_TYPE_DATA).find(([, d]) => d.upgradeDiscount === key);
              const iconSrc = UPGRADE_HUD_ICONS[key];
              return (
                <div
                  key={key}
                  style={{
                    marginBottom: 20,
                    padding: '18px 20px',
                    borderRadius: 10,
                    border: `1px solid ${color}33`,
                    background: `${color}08`,
                  }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <img
                      src={iconSrc}
                      alt={label}
                      style={{ width: 48, height: 48, borderRadius: 8, border: `1px solid ${color}55`, objectFit: 'cover', flexShrink: 0 }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color, letterSpacing: 1 }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(160,200,255,0.5)' }}>{desc}</div>
                    </div>
                    {discountPlanet && (
                      <div
                        style={{
                          marginLeft: 'auto',
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 4,
                          background: `rgba(255,204,0,0.1)`,
                          border: '1px solid rgba(255,204,0,0.3)',
                          color: '#fc4',
                        }}
                      >
                        20% off on 
                        <span
                          style={{
                            color: `#${(PLANET_TYPE_DATA[discountPlanet[0] as keyof typeof PLANET_TYPE_DATA]?.baseColor ?? 0).toString(16).padStart(6, '0')}`,
                          }}
                        >
                          {discountPlanet[1].label}
                        </span>
                         planets
                      </div>
                    )}
                  </div>
                  {/* 5 level rows */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                    {UPGRADE_COSTS.map((cost, idx) => {
                      const bonus = bonuses[idx + 1];
                      const bonusStr = key === 'armor' ? `+${bonus} armor` : `+${Math.round((bonus as number) * 100)}%`;
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 7,
                            border: `1px solid ${color}33`,
                            background: 'rgba(6,14,30,0.7)',
                          }}
                        >
                          <div style={{ fontSize: 10, color, fontWeight: 700, marginBottom: 4 }}>LEVEL {idx + 1}</div>
                          {/* Bonus bar */}
                          <div style={{ height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 6 }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${(idx + 1) * 20}%`,
                                background: `linear-gradient(90deg, ${color}88, ${color})`,
                                borderRadius: 3,
                                boxShadow: `0 0 8px ${color}66`,
                              }}
                            />
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 800, color, marginBottom: 6 }}>{bonusStr}</div>
                          <div style={{ display: 'flex', gap: 6, fontSize: 9, color: 'rgba(160,200,255,0.4)' }}>
                            <span style={{ color: '#fc4' }}>{cost.credits}c</span>
                            <span style={{ color: '#4f8' }}>{cost.minerals}m</span>
                            <span style={{ color: '#4df' }}>{cost.energy}e</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Planet type tech discount reference */}
            <div
              style={{
                marginTop: 8,
                padding: '14px 18px',
                borderRadius: 8,
                border: '1px solid rgba(255,204,0,0.15)',
                background: 'rgba(255,204,0,0.04)',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fc4', marginBottom: 10, letterSpacing: 1 }}>
                🌍 PLANET TYPE DISCOUNT REFERENCE
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {(Object.entries(PLANET_TYPE_DATA) as [string, (typeof PLANET_TYPE_DATA)[keyof typeof PLANET_TYPE_DATA]][]).map(
                  ([type, d]) => (
                    <div
                      key={type}
                      style={{
                        fontSize: 9,
                        padding: '4px 10px',
                        borderRadius: 4,
                        background: `#${d.baseColor.toString(16).padStart(6, '0')}18`,
                        border: `1px solid #${d.baseColor.toString(16).padStart(6, '0')}44`,
                        color: `#${d.baseColor.toString(16).padStart(6, '0')}`,
                      }}
                    >
                      {d.label} → <span style={{ color: '#fc4' }}>20% off {d.upgradeDiscount}</span>
                    </div>
                  ),
                )}
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
    <div
      style={{ position: 'absolute', inset: 0, background: '#010308', color: '#cde', zIndex: 100, overflow: 'auto', padding: '40px 60px' }}
    >
      <StarfieldCanvas />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src="/assets/space/ui/logo.webp"
              alt="Gruda Armada"
              style={{ height: 32, imageRendering: 'auto', mixBlendMode: 'screen' as any }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div style={{ fontSize: 22, fontWeight: 800, color: '#4488ff', letterSpacing: 3 }}>HOW TO PLAY</div>
          </div>
          <Btn label="BACK" onClick={onBack} style={{ minWidth: 80, height: 32 }} />
        </div>
        <div style={{ maxWidth: 700, lineHeight: 1.8, fontSize: 13 }}>
          <Section title="Objective">
            Conquer planets, build fleets, and destroy your enemies. Win by <strong style={{ color: '#ff4444' }}>Elimination</strong>{' '}
            (destroy all enemy ships &amp; stations) or <strong style={{ color: '#4488ff' }}>Domination</strong> (own 70%+ of planets for 60
            continuous seconds).
          </Section>
          <Section title="Selection &amp; Camera">
            <strong style={{ color: '#4df' }}>Left Click</strong> — Select ship or planet &nbsp;
            <strong style={{ color: '#4df' }}>Left Drag</strong> — Box-select multiple ships
            <br />
            <strong style={{ color: '#4df' }}>Right Click</strong> — Move selected ships / Attack enemy
            <br />
            <strong style={{ color: '#4df' }}>Double Click</strong> — Select all visible ships of the same type
            <br />
            <strong style={{ color: '#fa0' }}>WASD / Arrow Keys</strong> — Pan camera &nbsp;
            <strong style={{ color: '#fa0' }}>Scroll Wheel</strong> — Zoom (logarithmic, 0–4000%)
            <br />
            <strong style={{ color: '#fa0' }}>M Key</strong> — Open Star Map (tactical overlay)
            <br />
            <em style={{ opacity: 0.5 }}>Note: A and S also pan camera when no ships are selected.</em>
          </Section>
          <Section title="Command Shortcuts (with ships selected)">
            <strong style={{ color: '#f44' }}>A</strong> — Attack-move (click destination → ships attack enemies en route)
            <br />
            <strong style={{ color: '#88f' }}>H</strong> — Defend position (ships hold ground, attack in range, don't chase)
            <br />
            <strong style={{ color: '#4f4' }}>Ctrl+1–9</strong> — Assign control group &nbsp;
            <strong style={{ color: '#4f4' }}>1–9</strong> — Recall control group
            <br />
            <strong style={{ color: '#fa0' }}>Q/E</strong> — Rotate camera orbit
            <br />
            <strong style={{ color: '#fc4' }}>W/R</strong> — Activate ship abilities (cooldown + energy applies)
            <br />
            <strong style={{ color: '#4df' }}>Right-click ability button</strong> — Toggle auto-cast on/off
          </Section>
          <Section title="Planets &amp; Capture">
            Click a planet to open its management panel. To capture a neutral planet: send ships near it, defeat the defenders, then your
            ships auto-capture (green ring shows progress). Captured planets generate Credits, Energy, and Minerals per second plus a
            Station for building ships.
          </Section>
          <Section title="Stations &amp; Building">
            Click your station or use the bottom BUILD panel. Queue ships — they spawn at the station and fly to the rally point.
            Higher-tier ships cost more but are significantly stronger. Research tech trees on owned planets to unlock additional ship
            types.
          </Section>
          <Section title="Global Upgrades">
            The HUD bottom-right shows 5 global upgrade tracks: Attack, Armor, Speed, Health, Shield. Each has 5 levels that apply to ALL
            ships you build afterwards. Some planet types give a 20% discount on their matching upgrade.
          </Section>
          <Section title="Resources">
            <strong style={{ color: '#fc4' }}>Credits</strong> — General currency for ships &amp; upgrades
            <br />
            <strong style={{ color: '#4df' }}>Energy</strong> — Powers ship abilities and advanced ships
            <br />
            <strong style={{ color: '#4f8' }}>Minerals</strong> — Required for higher-tier ships and structures
            <br />
            All three are earned passively from owned planets. Deploy Mining Drones and Energy Skimmers to harvest orbiting resource nodes
            for a significant bonus.
          </Section>
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

// ── Intro Video Screen ────────────────────────────────────────────
function IntroScreen({ onFinish }: { onFinish: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    // Allow skip after a short delay so users see at least a moment
    const skipTimer = setTimeout(() => setCanSkip(true), 1500);
    // Delay logo by 5 seconds so the video plays clean first
    const logoTimer = setTimeout(() => setShowLogo(true), 5000);
    return () => {
      clearTimeout(skipTimer);
      clearTimeout(logoTimer);
    };
  }, []);

  const handleSkip = useCallback(() => {
    if (!canSkip) return;
    // First user gesture — init & resume audio (browser autoplay policy)
    gameAudio.resume();
    setFadeOut(true);
    setTimeout(onFinish, 600);
  }, [canSkip, onFinish]);

  // Click or key to skip
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') handleSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSkip]);

  // Auto-advance when video ends
  const handleVideoEnd = useCallback(() => {
    setFadeOut(true);
    setTimeout(onFinish, 600);
  }, [onFinish]);

  return (
    <div
      onClick={handleSkip}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 150,
        background: '#000',
        cursor: canSkip ? 'pointer' : 'default',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.6s ease-out',
      }}
    >
      {/* Background video — fills screen, no controls */}
      <video
        ref={videoRef}
        src="/assets/space/videos/intro.mp4"
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Dark vignette overlay for logo readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.6) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Centered logo — delayed 5s so video plays clean first */}
      {showLogo && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <img
            src="/assets/space/ui/logo.webp"
            alt="GRUDA ARMADA"
            style={{
              width: 420,
              maxWidth: '88vw',
              display: 'block',
              mixBlendMode: 'screen' as any,
              filter: 'drop-shadow(0 0 50px rgba(68,136,255,0.6)) drop-shadow(0 0 24px rgba(200,30,30,0.35))',
              animation: 'logoFadeIn 2s ease-out forwards',
            }}
            onError={(e) => {
              const t = e.target as HTMLImageElement;
              if (!t.src.endsWith('.svg')) t.src = '/assets/space/ui/logo.svg';
              else t.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Skip hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 12,
          letterSpacing: 3,
          color: 'rgba(160,200,255,0.5)',
          opacity: canSkip ? 1 : 0,
          transition: 'opacity 0.8s',
          textTransform: 'uppercase',
          textShadow: '0 0 10px rgba(0,0,0,0.9)',
        }}
      >
        CLICK OR PRESS ANY KEY TO CONTINUE
      </div>

      {/* Keyframe animation for logo */}
      <style>{`
        @keyframes logoFadeIn {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ── Loading Screen (with video background + game-art UI) ──────────
function LoadingScreen() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        color: '#4488ff',
        fontFamily: "'Segoe UI', monospace",
        background: '#000',
      }}
    >
      {/* Reuse intro video as loading background */}
      <video
        src="/assets/space/videos/intro.mp4"
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.25,
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img
          src="/assets/space/ui/logo.webp"
          alt="GRUDA ARMADA"
          style={{
            width: 260,
            maxWidth: '68vw',
            display: 'block',
            marginBottom: 16,
            mixBlendMode: 'screen' as any,
            filter: 'drop-shadow(0 0 24px rgba(68,136,255,0.55))',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        {/* Title chevron from sliced assets */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: 'url(/assets/space/ui/scifi-gui/sliced/title-chevron.png)',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            padding: '6px 36px',
            minWidth: 180,
            minHeight: 28,
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: 3,
              textShadow: '0 0 8px rgba(68,255,200,0.5)',
              textTransform: 'uppercase' as const,
            }}
          >
            LOADING ASSETS
          </span>
        </div>

        {/* Progress bar using sliced bar-progress asset */}
        <div style={{ position: 'relative', width: 320, maxWidth: '80vw', height: 20, marginBottom: 12 }}>
          <img
            src="/assets/space/ui/scifi-gui/sliced/bar-progress.png"
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '4%',
              top: '15%',
              bottom: '15%',
              width: '30%',
              background: 'linear-gradient(90deg, transparent, #44ff88, transparent)',
              borderRadius: 2,
              animation: 'loading-slide 1.2s ease-in-out infinite',
            }}
          />
        </div>

        {/* Gem indicator row */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
          <img
            src="/assets/space/ui/scifi-gui/sliced/gem-dia.png"
            alt=""
            style={{ width: 12, height: 12 }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <img
            src="/assets/space/ui/scifi-gui/sliced/gem-indicator.png"
            alt=""
            style={{ width: 16, height: 16, filter: 'drop-shadow(0 0 6px rgba(68,255,200,0.6))' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <img
            src="/assets/space/ui/scifi-gui/sliced/gem-dia.png"
            alt=""
            style={{ width: 12, height: 12 }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        {/* Decorative element */}
        <img
          src="/assets/space/ui/scifi-gui/elements/1.png"
          alt=""
          style={{ width: 100, opacity: 0.25, marginTop: 8 }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      <style>{`
        @keyframes loading-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
