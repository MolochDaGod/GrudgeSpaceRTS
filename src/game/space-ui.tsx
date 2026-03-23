import { useEffect, useState, useCallback, useRef } from 'react';
import type { SpaceRenderer } from './space-renderer';
import type {
  SpaceShip, SpaceStation, ShipAbilityState, PlayerResources,
  SpaceGameState, TeamUpgrades, Commander, Planet,
} from './space-types';
import {
  SHIP_DEFINITIONS, BUILDABLE_SHIPS, UPGRADE_COSTS, UPGRADE_BONUSES,
  TEAM_COLORS, CAPTURE_TIME, DOMINATION_TIME, HERO_DEFINITIONS, HERO_SHIPS,
  getShipDef, type UpgradeType,
  PLANET_TYPE_DATA, COMMANDER_SPEC_LABEL, COMMANDER_TRAIN_COST, COMMANDER_TRAIN_TIME,
  SHIP_ROLES, SHIP_ROLE_LABELS, SHIP_ROLE_COLORS,
} from './space-types';

// ── Ship preview images (GIF for voxel ships, PNG for capitals/heroes) ─
const SHIP_PREVIEW: Record<string, string> = {
  // Pirate ships
  pirate_01: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_01.png',
  pirate_02: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_02.png',
  pirate_03: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_03.png',
  pirate_04: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_04.png',
  pirate_05: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_05.png',
  pirate_06: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_06.png',
  // Boss captains
  boss_captain_01: '/assets/space/sprites/boss-ships/PNG/Boss_Icons/Icon_01.png',
  boss_captain_02: '/assets/space/sprites/boss-ships/PNG/Boss_Icons/Icon_02.png',
  boss_captain_03: '/assets/space/sprites/boss-ships/PNG/Boss_Icons/Icon_03.png',
  // Standard ships
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
  vanguard_prime:       '/assets/space/models/capital/Battleships/Battleship.png',
  shadow_reaper:        '/assets/space/models/capital/Bomber/Bomber.png',
  iron_bastion:         '/assets/space/models/capital/Cruiser/Cruiser.png',
  storm_herald:         '/assets/space/models/capital/Destroyer/Destroyer.png',
  plague_mother:        '/assets/space/models/capital/Battleships/Battleship.png',
  boss_ship_01:         '/assets/space/models/capital/Battleships/Battleship.png',
  boss_ship_02:         '/assets/space/models/capital/Battleships/Battleship.png',
};
import { ALL_TECH_TREES, VOID_POWERS, PLANET_TYPE_TO_TECH, TURRET_DEFS } from './space-techtree';
import { FlagshipInterior } from './flagship-interior';
import { Panel, SmallPanel, Btn, Slot, Bar, Frame, ResBox } from './ui-lib';

// SegmentBar removed — replaced by Bar from ui-lib

// ── Ability SVG Icons ─────────────────────────────────────────────
  // Ability icon images from skill-icons packs (high quality painted art)
const ABILITY_IMG: Record<string, string> = {
  barrel_roll:    '/assets/space/ui/skill-icons-1/PNG/3.png',   // evasion/dodge
  speed_boost:    '/assets/space/ui/skill-icons-1/PNG/7.png',   // speed/boost
  cloak:          '/assets/space/ui/skill-icons-2/PNG/5.png',   // stealth/shadow
  iron_dome:      '/assets/space/ui/skill-icons-1/PNG/9.png',   // shield/defense
  warp:           '/assets/space/ui/skill-icons-2/PNG/3.png',   // teleport/warp
  emp:            '/assets/space/ui/skill-icons-1/PNG/5.png',   // lightning/emp
  boarding:       '/assets/space/ui/skill-icons-2/PNG/1.png',   // assault/boarding
  repair:         '/assets/space/ui/skill-icons-1/PNG/11.png',  // repair/heal
  ram:            '/assets/space/ui/skill-icons-1/PNG/13.png',  // charge/ram
  launch_fighters:'/assets/space/ui/skill-icons-1/PNG/15.png',  // swarm/launch
};

  const ABILITY_ICONS: Record<string, React.ReactNode> = {
  barrel_roll: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2"/>
      <path d="M10 16 C10 10, 22 10, 22 16 C22 22, 10 22, 10 16" stroke="#4df" strokeWidth="2" fill="none"/>
      <path d="M14 12L18 16L14 20" stroke="#4df" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  speed_boost: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="16,4 28,28 16,22 4,28" fill="#f80" opacity="0.3"/>
      <polygon points="16,4 28,28 16,22 4,28" stroke="#fa0" strokeWidth="1.5" fill="none"/>
      <line x1="10" y1="18" x2="6" y2="24" stroke="#f60" strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="22" x2="16" y2="30" stroke="#f60" strokeWidth="2" strokeLinecap="round"/>
      <line x1="22" y1="18" x2="26" y2="24" stroke="#f60" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  cloak: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="10" stroke="#88f" strokeWidth="1" strokeDasharray="3 3" opacity="0.5"/>
      <circle cx="16" cy="16" r="6" stroke="#aaf" strokeWidth="1.5" strokeDasharray="2 2"/>
      <path d="M12 20 Q16 10, 20 20" stroke="#ccf" strokeWidth="2" fill="none" opacity="0.7"/>
      <circle cx="16" cy="14" r="2" fill="#ccf" opacity="0.4"/>
    </svg>
  ),
  iron_dome: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 24 Q16 2, 26 24" stroke="#4ff" strokeWidth="2" fill="none"/>
      <path d="M8 22 Q16 6, 24 22" stroke="#4ff" strokeWidth="1" fill="none" opacity="0.5"/>
      <line x1="16" y1="8" x2="16" y2="24" stroke="#4ff" strokeWidth="1" opacity="0.3"/>
      <circle cx="16" cy="24" r="3" fill="#0aa" opacity="0.4"/>
      <circle cx="10" cy="14" r="1.5" fill="#f44"/>
      <line x1="10" y1="14" x2="14" y2="18" stroke="#f44" strokeWidth="1"/>
    </svg>
  ),
  warp: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="16" cy="16" rx="14" ry="6" stroke="#a4f" strokeWidth="1.5" opacity="0.6"/>
      <ellipse cx="16" cy="16" rx="10" ry="4" stroke="#c6f" strokeWidth="2"/>
      <circle cx="16" cy="16" r="3" fill="#e8f" opacity="0.6"/>
      <line x1="16" y1="2" x2="16" y2="10" stroke="#a4f" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16" y1="22" x2="16" y2="30" stroke="#a4f" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  emp: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" stroke="#ff4" strokeWidth="1" opacity="0.4"/>
      <circle cx="16" cy="16" r="7" stroke="#ff4" strokeWidth="2"/>
      <path d="M14 10 L18 16 L13 16 L17 22" stroke="#ff0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  boarding: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="12" width="8" height="8" rx="1" stroke="#f84" strokeWidth="1.5"/>
      <rect x="18" y="12" width="8" height="8" rx="1" stroke="#4f8" strokeWidth="1.5"/>
      <path d="M14 16 L18 16" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 13 L18 16 L16 19" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  repair: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="13" y="6" width="6" height="20" rx="1" fill="#4f4" opacity="0.3"/>
      <rect x="6" y="13" width="20" height="6" rx="1" fill="#4f4" opacity="0.3"/>
      <rect x="13" y="6" width="6" height="20" rx="1" stroke="#4f4" strokeWidth="1.5"/>
      <rect x="6" y="13" width="20" height="6" rx="1" stroke="#4f4" strokeWidth="1.5"/>
    </svg>
  ),
  ram: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="16,4 26,20 20,20 22,28 10,28 12,20 6,20" fill="#f40" opacity="0.3"/>
      <polygon points="16,4 26,20 20,20 22,28 10,28 12,20 6,20" stroke="#f60" strokeWidth="1.5"/>
      <circle cx="16" cy="16" r="3" fill="#f80"/>
    </svg>
  ),
  launch_fighters: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="14" width="12" height="6" rx="1" stroke="#88f" strokeWidth="1.5"/>
      <polygon points="8,8 12,12 4,12" fill="#4df"/>
      <polygon points="24,8 28,12 20,12" fill="#4df"/>
      <polygon points="16,4 20,10 12,10" fill="#4df"/>
      <line x1="8" y1="10" x2="8" y2="6" stroke="#4df" strokeWidth="1" strokeDasharray="2 1"/>
      <line x1="24" y1="10" x2="24" y2="6" stroke="#4df" strokeWidth="1" strokeDasharray="2 1"/>
    </svg>
  ),
};

// ── Inline SVG helper ─────────────────────────────────────────────
const Svg = ({ children, size = 16, color = 'currentColor' }: { children: React.ReactNode; size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" style={{ width: size, height: size, color, display: 'inline-block', verticalAlign: 'middle' }}>{children}</svg>
);

// CLASS_ICONS removed — unused SVGs

// ── Attack Type Icons (space-icons pack — ships & weapons) ──────
const ATTACK_IMG: Record<string, string> = {
  laser:   '/assets/space/ui/space-icons/PNG/1.png',   // ship/laser
  missile: '/assets/space/ui/space-icons/PNG/3.png',   // missile
  railgun: '/assets/space/ui/space-icons/PNG/7.png',   // heavy weapon
  pulse:   '/assets/space/ui/space-icons/PNG/9.png',   // energy pulse
  torpedo: '/assets/space/ui/space-icons/PNG/5.png',   // torpedo/rocket
};
const ATTACK_ICONS: Record<string, React.ReactNode> = {
  laser:   <img src={ATTACK_IMG.laser}   alt='laser'   style={{width:16,height:16,imageRendering:'auto'}} />,
  missile: <img src={ATTACK_IMG.missile}  alt='missile'  style={{width:16,height:16,imageRendering:'auto'}} />,
  railgun: <img src={ATTACK_IMG.railgun}  alt='railgun'  style={{width:16,height:16,imageRendering:'auto'}} />,
  pulse:   <img src={ATTACK_IMG.pulse}    alt='pulse'    style={{width:16,height:16,imageRendering:'auto'}} />,
  torpedo: <img src={ATTACK_IMG.torpedo}  alt='torpedo'  style={{width:16,height:16,imageRendering:'auto'}} />,
};
// ── Resource Icons (PNG from resource-icons pack) ─────────────

const ResIcon = ({ src, fallback }: { src: string; fallback: React.ReactNode }) => (
  <img src={src} alt="" style={{ width: 18, height: 18, imageRendering: 'pixelated', verticalAlign: 'middle' }}
    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
);

// Use cyberpunk mining icons for resources (high quality painted art)
const RES_ICONS = {
  credits:  <ResIcon src="/assets/space/ui/mining-icons/PNG/without background/15.png" fallback={<Svg size={14} color="#fc4"><circle cx="12" cy="12" r="9" stroke="#fc4" strokeWidth="1.5" fill="none"/></Svg>} />,
  energy:   <ResIcon src="/assets/space/ui/mining-icons/PNG/without background/10.png" fallback={<Svg size={14} color="#4df"><path d="M13 2L6 14H12L11 22L18 10H12Z" stroke="#4df" strokeWidth="1.5" fill="#4df" fillOpacity=".2"/></Svg>} />,
  minerals: <ResIcon src="/assets/space/ui/mining-icons/PNG/without background/20.png" fallback={<Svg size={14} color="#4f8"><path d="M12 3L20 9L16 21H8L4 9Z" stroke="#4f8" strokeWidth="1.5" fill="#4f8" fillOpacity=".15"/></Svg>} />,
};

// ── Stat line SVG Icons ───────────────────────────────────────────
const STAT_ICONS = {
  armor: <Svg size={11} color="#8ac"><path d="M12 3C12 3 4 6 4 12C4 18 12 21 12 21C12 21 20 18 20 12C20 6 12 3 12 3Z" stroke="#8ac" strokeWidth="1.5" fill="none"/></Svg>,
  speed: <Svg size={11} color="#8ac"><path d="M5 17L10 12L5 7" stroke="#8ac" strokeWidth="1.5" strokeLinecap="round"/><path d="M11 17L16 12L11 7" stroke="#8ac" strokeWidth="1.5" strokeLinecap="round" opacity=".5"/></Svg>,
  range: <Svg size={11} color="#8ac"><circle cx="12" cy="12" r="8" stroke="#8ac" strokeWidth="1" fill="none"/><circle cx="12" cy="12" r="4" stroke="#8ac" strokeWidth="1" fill="none"/><circle cx="12" cy="12" r="1.5" fill="#8ac"/></Svg>,
  cooldown: <Svg size={11} color="#8ac"><circle cx="12" cy="12" r="9" stroke="#8ac" strokeWidth="1.5" fill="none"/><path d="M12 6V12L16 14" stroke="#8ac" strokeWidth="1.5" strokeLinecap="round"/></Svg>,
  energyCost: <Svg size={10} color="#4df"><path d="M13 2L6 14H12L11 22L18 10H12Z" stroke="#4df" strokeWidth="1.5" fill="#4df" fillOpacity=".3"/></Svg>,
};

interface SpaceHUDProps {
  renderer: SpaceRenderer | null;
  onQuit?: () => void;
}

export function SpaceHUD({ renderer, onQuit }: SpaceHUDProps) {
  const [, forceUpdate] = useState(0);
  const animRef = useRef(0);
  const [techOpen, setTechOpen]         = useState(false);
  const [cmdOpen, setCmdOpen]           = useState(false);
  const [interiorOpen, setInteriorOpen] = useState(false);
  const [selectedPlanetId, setSelectedPlanetId] = useState<number | null>(null);
  const [selectedCmdId, setSelectedCmdId] = useState<number | null>(null);

  // Re-render HUD at 10fps for perf
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      forceUpdate(n => n + 1);
      animRef.current = window.setTimeout(tick, 100);
    };
    tick();
    return () => { running = false; clearTimeout(animRef.current); };
  }, []);

  // Planet selection wiring: world click -> HUD selected planet
  useEffect(() => {
    if (!renderer) return;
    const prev = renderer.onPlanetClick;
    const handler = (planetId: number) => {
      setSelectedPlanetId(planetId > 0 ? planetId : null);
    };
    renderer.onPlanetClick = handler;
    return () => {
      if (renderer.onPlanetClick === handler) renderer.onPlanetClick = prev;
    };
  }, [renderer]);

  if (!renderer?.engine?.state) return null;
  const state = renderer.engine.state;
  const res = state.resources[1]; // player resources
  const upg = state.upgrades[1];
  const techSt = state.techState?.get(1);
  const myPlanets = state.planets.filter(p => p.owner === 1);

  // Get selected ships
  const selectedShips: SpaceShip[] = [];
  for (const id of state.selectedIds) {
    const ship = state.ships.get(id);
    if (ship && !ship.dead) selectedShips.push(ship);
  }

  // Selected station?
  let selectedStation: SpaceStation | null = null;
  // Check if any station is close to click (simple: check if station is 'selected')
  for (const [, st] of state.stations) {
    if (st.selected && !st.dead && st.team === 1) { selectedStation = st; break; }
  }

  // Primary selected ship — use getShipDef so Hero ships resolve correctly
  const primary = selectedShips[0] ?? null;
  const def = primary ? getShipDef(primary.shipType) : null;
  const selectedPlanet = selectedPlanetId != null
    ? state.planets.find(p => p.id === selectedPlanetId) ?? null
    : null;

  // Count alive ships per team
  const teamCounts = new Map<number, number>();
  for (const [, s] of state.ships) {
    if (s.dead) continue;
    teamCounts.set(s.team, (teamCounts.get(s.team) ?? 0) + 1);
  }
  const playerAlive = teamCounts.get(1) ?? 0;
  const enemyAlive = (teamCounts.get(2) ?? 0) + (teamCounts.get(3) ?? 0) + (teamCounts.get(4) ?? 0);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', fontFamily: "'Segoe UI', monospace", color: '#cde' }}>
      {/* ── Game Over Overlay with Victory/Defeat badge art ──── */}
      {state.gameOver && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', zIndex: 200, pointerEvents: 'auto' }}>
          <img
            src={state.winner === 1 ? '/assets/space/ui/hud/Victory_Badges.png' : '/assets/space/ui/hud/GameOver_Badges.png'}
            alt={state.winner === 1 ? 'Victory' : 'Defeat'}
            style={{ width: 280, maxWidth: '70vw', marginBottom: 16, imageRendering: 'auto',
              filter: `drop-shadow(0 0 30px ${state.winner === 1 ? 'rgba(68,255,68,0.5)' : 'rgba(255,68,68,0.5)'})` }}
            onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
          />
          <div style={{ fontSize: 48, fontWeight: 900, color: state.winner === 1 ? '#44ff44' : '#ff4444', marginBottom: 8,
            textShadow: `0 0 30px ${state.winner === 1 ? '#44ff4488' : '#ff444488'}`, letterSpacing: 6 }}>
            {state.winner === 1 ? 'VICTORY' : 'DEFEAT'}
          </div>
          <div style={{ fontSize: 14, opacity: 0.6, marginBottom: 32 }}>
            {state.winCondition === 'domination' ? 'Won by Domination' : 'Won by Elimination'}
          </div>
          {onQuit && (
            <div onClick={onQuit} style={{ position: 'relative', cursor: 'pointer', display: 'inline-block' }}>
              <img src='/assets/space/ui/hud/Normal_Btn.png' alt='' style={{ width: 200, height: 48, display: 'block' }} />
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: 2 }}>BACK TO MENU</span>
            </div>
          )}
        </div>
      )}

      {/* ── Domination Warning ────────────────────────── */}
      {state.dominationTeam !== null && state.dominationTimer > 0 && !state.gameOver && (
        <div style={{ position: 'absolute', top: 44, left: '50%', transform: 'translateX(-50%)', background: state.dominationTeam === 1 ? 'rgba(68,255,68,0.2)' : 'rgba(255,68,68,0.2)', border: `1px solid ${state.dominationTeam === 1 ? '#4f4' : '#f44'}`, padding: '6px 20px', borderRadius: 6, fontSize: 13, fontWeight: 700, color: state.dominationTeam === 1 ? '#4f4' : '#f44', pointerEvents: 'none', zIndex: 20 }}>
          DOMINATION: {Math.ceil(DOMINATION_TIME - state.dominationTimer)}s remaining
        </div>
      )}

      {/* ── Game Alerts with cyber avatar popups ─────────── */}
      {state.alerts.length > 0 && (
        <div style={{ position: 'absolute', top: 48, right: 12, zIndex: 30, pointerEvents: 'auto',
          display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '40vh', overflowY: 'auto' }}>
          {state.alerts.slice(-4).map(alert => {
            const avatarIdx = alert.type === 'under_attack' ? 3 : alert.type === 'conquest' ? 1 : alert.type === 'build_complete' ? 10 : 7;
            const borderCol = alert.type === 'under_attack' ? '#ff4444' : alert.type === 'conquest' ? '#44ff44' : '#4488ff';
            return (
              <div key={alert.id} style={{
                display: 'flex', gap: 8, alignItems: 'center', padding: '6px 10px',
                background: 'rgba(4,10,22,0.92)', border: `1px solid ${borderCol}44`,
                borderRadius: 8, maxWidth: 280, boxShadow: `0 0 12px ${borderCol}22`,
              }}>
                <img src={`/assets/space/ui/avatars-cyber/PNG/without background/${avatarIdx}.png`}
                  alt='' style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
                    border: `2px solid ${borderCol}66` }}
                  onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: borderCol, letterSpacing: 0.5 }}>
                    {alert.type === 'under_attack' ? 'UNDER ATTACK' : alert.type === 'conquest' ? 'CONQUEST' : alert.type === 'build_complete' ? 'BUILD COMPLETE' : 'ALERT'}
                  </div>
                  <div style={{ fontSize: 10, color: '#cde' }}>{alert.message}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Info Bot (first 30 seconds of game) ──────────── */}
      {state.gameTime < 30 && !state.gameOver && (
        <div style={{ position: 'absolute', bottom: 210, left: 12, zIndex: 25, pointerEvents: 'auto',
          display: 'flex', gap: 10, alignItems: 'flex-end', maxWidth: 320 }}>
          <img src='/assets/space/ui/avatars-cyber/PNG/background/10.png' alt='Info Bot'
            style={{ width: 56, height: 56, borderRadius: 8, border: '2px solid #4488ff44', flexShrink: 0 }}
            onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
          <div style={{ background: 'rgba(4,14,28,0.95)', border: '1px solid #4488ff44', borderRadius: '10px 10px 10px 2px',
            padding: '8px 12px', fontSize: 10, color: '#8ac', lineHeight: 1.6 }}>
            {state.gameTime < 10
              ? <><strong style={{color:'#4df'}}>Welcome, Commander!</strong> Click your <strong style={{color:'#28b4a0'}}>Pyramid Ship</strong> and select <strong style={{color:'#fc4'}}>ENTER SHIP</strong> to access all systems.
                  Your workers are already mining. Build more ships at the station!</>
              : state.gameTime < 20
              ? <>Use <strong style={{color:'#fa0'}}>WASD</strong> to pan, <strong style={{color:'#fa0'}}>Q/E</strong> to orbit camera. Press <strong style={{color:'#fa0'}}>G</strong> for attack-move.
                  Click the station to build ships. Press <strong style={{color:'#fa0'}}>H</strong> to defend position.</>
              : <>Capture neutral planets by sending ships nearby.
                  Research tech from the <strong style={{color:'#ff8844'}}>Armory</strong> inside your flagship.
                  Train commanders for hero ships!</>}
          </div>
        </div>
      )}

      {/* ── Top Resource Bar ─────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 44,
        backgroundImage: 'url(/assets/space/ui/hud/DarkBackground.png)',
        backgroundSize: '100% 100%',
        borderBottom: '2px solid rgba(40,180,160,0.35)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8,
        pointerEvents: 'auto', zIndex: 10,
      }}>
        <img src='/assets/space/ui/logo.webp' alt='Gruda Armada'
          style={{ height: 28, imageRendering: 'auto',
            mixBlendMode: 'screen' as React.CSSProperties['mixBlendMode'],
            filter: 'drop-shadow(0 0 8px rgba(68,136,255,0.4))' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {/* Resources with income rates — using ResBox from ui-lib */}
        {(() => {
          let incC = 0, incE = 0, incM = 0;
          for (const p of state.planets) {
            if (p.owner !== 1) continue;
            const m = PLANET_TYPE_DATA[p.planetType].resourceMult;
            incC += p.resourceYield.credits * m.credits;
            incE += p.resourceYield.energy * m.energy;
            incM += p.resourceYield.minerals * m.minerals;
          }
          return (<>
            <ResBox icon={RES_ICONS.credits} value={Math.floor(res.credits)} color="#fc4" rate={incC} />
            <ResBox icon={RES_ICONS.energy} value={Math.floor(res.energy)} color="#4df" rate={incE} />
            <ResBox icon={RES_ICONS.minerals} value={Math.floor(res.minerals)} color="#4f8" rate={incM} />
          </>);
        })()}
        <div style={{ backgroundImage: 'url(/assets/space/ui/hud/BgSettingSmallBox.png)', backgroundSize: '100% 100%', padding: '2px 8px', fontSize: 10, color: '#8ac' }}>
          {Math.floor(res.supply)}/{res.maxSupply} sup
        </div>
        {/* Worker status */}
        {(() => {
          let workerTotal = 0, workerIdle = 0;
          for (const [, s] of state.ships) {
            if (s.dead || s.team !== 1 || s.shipClass !== 'worker') continue;
            workerTotal++;
            if (s.workerState === 'idle') workerIdle++;
          }
          return workerTotal > 0 ? (
            <div style={{ backgroundImage: 'url(/assets/space/ui/hud/BgSettingSmallBox.png)', backgroundSize: '100% 100%', padding: '2px 8px', fontSize: 10,
              color: workerIdle > 0 ? '#ffaa22' : '#4f8' }}>
              {workerTotal}W{workerIdle > 0 && <span style={{ color: '#ff8844', fontWeight: 700 }}> ({workerIdle} idle)</span>}
            </div>
          ) : null;
        })()}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, opacity: 0.7, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4488ff', display: 'inline-block' }} />
          {playerAlive}
          <span style={{ opacity: 0.4, margin: '0 2px' }}>vs</span>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4444', display: 'inline-block' }} />
          {enemyAlive}
        </div>
        <span style={{ fontSize: 10, color: '#8ac', opacity: 0.7 }}>{formatTime(state.gameTime)}</span>
        {(() => {
          const zoom = renderer?.controls?.cameraState?.zoom ?? 200;
          const lbl  = zoom < 30 ? 'SURFACE' : zoom < 80 ? 'LOW ORBIT'
            : zoom < 250 ? 'ORBIT' : zoom < 600 ? 'SYSTEM'
            : zoom < 1200 ? 'SECTOR' : 'DEEP SPACE';
          return <span style={{ fontSize: 9, color: '#6a8a9a' }}>{lbl}</span>;
        })()}
        {onQuit && <Btn label="QUIT" onClick={onQuit} style={{ minWidth: 48, height: 28 }} />}
      </div>

      {/* ── Void Power Castbar ──────────────────── */}
      {techSt && Object.values(VOID_POWERS).some(p => techSt.researchedNodes.has(p.techNodeId)) && (
        <VoidPowerBar state={state} techSt={techSt} onCast={(id, x, y) => renderer.engine.castVoidPower(1 as any, id, x, y)} />
      )}

      {/* ── Floating panels ──────────────────── */}
      {techOpen && (
        <TechTreePanel
          state={state} myPlanets={myPlanets}
          onResearch={nodeId => renderer.engine.startResearch(1 as any, nodeId)}
          onClose={() => setTechOpen(false)}
        />
      )}
      {cmdOpen && (
        <CommanderPanel
          state={state}
          selectedCmdId={selectedCmdId}
          selectedPlanetId={selectedPlanetId}
          onSelectCmd={id => setSelectedCmdId(id)}
          onSelectPlanet={id => setSelectedPlanetId(id)}
          onTrain={pid => renderer.engine.trainCommander(1 as any, pid)}
          onUpgrade={cid => renderer.engine.upgradeCommander(cid)}
          res={res}
          onClose={() => setCmdOpen(false)}
        />
      )}

      {/* ── Flagship Interior Overlay ───────────────── */}
      {interiorOpen && (() => {
        // Find player's flagship and its commander
        let flagshipName = 'Pyramid Ship';
        let cmdPortrait: string | undefined;
        let cmdName: string | undefined;
        for (const [, ship] of state.ships) {
          if (!ship.dead && ship.team === 1 && (ship.shipType === 'pyramid_ship' || ship.shipType === 'custom_hero')) {
            const def = getShipDef(ship.shipType);
            if (def) flagshipName = def.displayName;
            // Find commander on this ship
            for (const [, cmd] of state.commanders) {
              if (cmd.equippedShipId === ship.id) { cmdPortrait = cmd.portrait; cmdName = cmd.name; }
            }
            break;
          }
        }
        // Find player's home station for build access
        const homeStation = [...state.stations.values()].find(s => !s.dead && s.team === 1 && s.canBuildHeroes);
        return (
          <FlagshipInterior
            onClose={() => setInteriorOpen(false)}
            onOpenTech={() => { setInteriorOpen(false); setTechOpen(true); }}
            onOpenCommander={() => { setInteriorOpen(false); setCmdOpen(true); }}
            onOpenBuild={() => {
              setInteriorOpen(false);
              // Select the home station so build panel opens
              if (homeStation) {
                for (const [, st] of state.stations) st.selected = false;
                homeStation.selected = true;
              }
            }}
            onOpenUpgrades={() => {
              setInteriorOpen(false);
              // Deselect everything so upgrade panel shows
              for (const id of state.selectedIds) { const s = state.ships.get(id); if (s) s.selected = false; }
              state.selectedIds.clear();
              for (const [, st] of state.stations) st.selected = false;
            }}
            onOpenStarMap={() => { setInteriorOpen(false); /* M key handled externally */ }}
            shipName={flagshipName}
            commanderPortrait={cmdPortrait}
            commanderName={cmdName}
          />
        );
      })()}

      {/* ── Floating Damage Numbers ─────────────────── */}
      {renderer && state.floatingTexts.map(ft => {
        const screen = worldToScreen(ft.x, ft.y, ft.z, renderer);
        if (!screen) return null;
        const opacity = 1 - ft.age / ft.maxAge;
        return (
          <div key={ft.id} style={{
            position: 'absolute', left: screen.x, top: screen.y,
            transform: 'translate(-50%, -50%)',
            fontSize: 12, fontWeight: 800, color: ft.color,
            textShadow: '0 0 4px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.7)',
            opacity, pointerEvents: 'none', zIndex: 15,
            transition: 'none',
          }}>{ft.text}</div>
        );
      })}

      {/* ── Capture Progress Labels on Planets ───────── */}
      {renderer && state.planets.filter(p => p.captureProgress > 0).map(p => {
        const screen = worldToScreen(p.x, p.y, 40, renderer);
        if (!screen) return null;
        const pct = Math.round((p.captureProgress / CAPTURE_TIME) * 100);
        const col = TEAM_COLORS[p.captureTeam] ? `#${TEAM_COLORS[p.captureTeam].toString(16).padStart(6, '0')}` : '#ffff44';
        return (
          <div key={`cap-${p.id}`} style={{
            position: 'absolute', left: screen.x, top: screen.y - 16,
            transform: 'translateX(-50%)',
            fontSize: 11, fontWeight: 800, color: col,
            textShadow: `0 0 6px ${col}88, 0 0 12px ${col}44`,
            pointerEvents: 'none', zIndex: 15,
            letterSpacing: 1,
          }}>CAPTURING {pct}%</div>
        );
      })}

      {/* ── Bottom Panel ──────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 200,
        backgroundImage: 'url(/assets/space/ui/hud/DarkBackground.png)',
        backgroundSize: '100% 100%',
        borderTop: '2px solid rgba(40,180,160,0.45)',
        display: 'flex', pointerEvents: 'auto', zIndex: 10,
      }}>
        {/* ── Minimap Area (left) with click interactions ─────── */}
        <div style={{
          width: 200, height: '100%', borderRight: '1px solid #1a3050',
          position: 'relative', overflow: 'hidden',
        }}>
          <Minimap state={state} renderer={renderer} />
          {/* Shortcut buttons below minimap */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', gap: 2, padding: '3px' }}>
            <Btn label="TECH" onClick={() => setTechOpen(t => !t)} active={techOpen} style={{ flex: 1, height: 26, minWidth: 0 }} />
            <Btn label="CMDR" onClick={() => setCmdOpen(t => !t)} active={cmdOpen} style={{ flex: 1, height: 26, minWidth: 0 }} />
          </div>
        </div>

        {/* ── Unit Info Panel (center-left) ─────────────── */}
        <div style={{ width: 280, height: '100%', padding: '8px 10px',
          borderRight: '1px solid rgba(40,180,160,0.25)',
          backgroundImage: 'url(/assets/space/ui/hud/BgSettingSmallBox.png)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', flexDirection: 'column' }}>
          {selectedShips.length === 0 ? (
            <div style={{ opacity: 0.25, fontSize: 11, marginTop: 50, textAlign: 'center',
              lineHeight: 1.8, color: '#8ab' }}>
              No units selected<br/>
              <span style={{ fontSize: 9 }}>Left-drag to box-select · Double-click to select type</span>
            </div>
          ) : selectedShips.length === 1 && primary && def ? (
            <SingleUnitInfo ship={primary} def={def} />
          ) : (
            <MultiUnitInfo
              ships={selectedShips}
              onIsolate={(shipId) => {
                // Deselect all, then select only the target ship
                for (const id of state.selectedIds) {
                  const s = state.ships.get(id);
                  if (s) s.selected = false;
                }
                state.selectedIds.clear();
                const target = state.ships.get(shipId);
                if (target) { target.selected = true; state.selectedIds.add(shipId); }
              }}
            />
          )}
        </div>

        {/* ── Command Card / Build Panel (center-right) ──── */}
        <div style={{ flex: 1, height: '100%', padding: '8px 12px', overflowY: 'auto',
          backgroundImage: 'url(/assets/space/ui/hud/BgSettingSmallBox.png)',
          backgroundSize: 'cover', backgroundPosition: 'center' }}>
          {selectedStation ? (
            <BuildPanel station={selectedStation} renderer={renderer} res={res} />
          ) : primary ? (
            <>
              {/* Enter Ship button for flagship */}
              {(primary.shipType === 'pyramid_ship' || primary.shipType === 'custom_hero') && (
                <Btn label="ENTER SHIP" wide active onClick={() => setInteriorOpen(true)} style={{ marginBottom: 6 }} />
              )}
              <CommandCard ship={primary} renderer={renderer} allSelected={selectedShips} />
            </>
          ) : selectedPlanet ? (
            <PlanetInfoPanel planet={selectedPlanet} state={state} renderer={renderer} />
          ) : upg ? (
            <UpgradePanel upg={upg} res={res} renderer={renderer} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ResourceItem removed — replaced by ResBox from ui-lib

// ── Single Unit Info — portrait + stats ───────────────────────────
function SingleUnitInfo({ ship, def }: { ship: SpaceShip; def: { class: string; stats: any; displayName: string } }) {
  const hpColor  = ship.hp / ship.maxHp > 0.5 ? '#44ee44' : ship.hp / ship.maxHp > 0.25 ? '#eebb00' : '#ee4444';
  const preview  = SHIP_PREVIEW[ship.shipType];
  const role     = SHIP_ROLES[ship.shipType];
  const roleColor = role ? SHIP_ROLE_COLORS[role] : null;
  const isHero   = ship.shipClass === 'dreadnought' || ('lore' in def);

  return (
    <div style={{ display: 'flex', gap: 10, height: '100%' }}>
      {/* ─ Portrait ──────────────────────────────── */}
      <div style={{
        width: 84, height: 84, flexShrink: 0,
        border: `1px solid ${isHero ? '#443300' : roleColor ?? '#1a4060'}`,
        borderRadius: 6, overflow: 'hidden',
        background: 'rgba(2,6,18,0.95)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        boxShadow: isHero ? '0 0 12px rgba(255,180,0,0.2)' : roleColor ? `0 0 8px ${roleColor}44` : 'none',
      }}>
        {preview
          ? <img src={preview} alt={def.displayName}
              style={{ width: '100%', height: '100%', objectFit: 'contain',
                imageRendering: 'pixelated' }}
              onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
            />
          : <div style={{ fontSize: 34, opacity: 0.2 }}>
              {isHero ? '⭐' : ship.shipClass === 'worker' ? '⛏️' : '🚀'}
            </div>
        }
        {/* Tier / HERO badge */}
        <div style={{
          position: 'absolute', top: 2, right: 2, fontSize: 8, fontWeight: 700,
          padding: '1px 4px', borderRadius: 2, letterSpacing: 0.5,
          background: isHero ? 'rgba(255,180,0,0.25)' : 'rgba(10,20,40,0.85)',
          color: isHero ? '#fc4' : '#4488ff',
          border: `1px solid ${isHero ? '#ffcc0055' : '#4488ff33'}`,
        }}>{isHero ? 'HERO' : `T${def.stats.tier}`}</div>
        {/* Role badge */}
        {role && (
          <div style={{
            position: 'absolute', bottom: 2, left: 2, fontSize: 7, fontWeight: 700,
            padding: '1px 4px', borderRadius: 2,
            background: `${roleColor}22`, border: `1px solid ${roleColor}55`,
            color: roleColor!, letterSpacing: 0.5,
          }}>{SHIP_ROLE_LABELS[role]}</div>
        )}
      </div>

      {/* ─ Stats ───────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name + rank */}
        <div style={{ marginBottom: 3 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: isHero ? '#fc4' : '#fff',
            lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {def.displayName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
            <span style={{ fontSize: 8, opacity: 0.4, textTransform: 'uppercase' }}>{def.class.replace(/_/g,' ')}</span>
            {/* Rank stars */}
            {Array.from({length:5},(_,i) => (
              <span key={i} style={{ fontSize: 9, color: i < (ship.rank??0) ? '#ffcc00' : '#1e2e40',
                textShadow: i < (ship.rank??0) ? '0 0 4px #ffcc0088' : 'none' }}>★</span>
            ))}
          </div>
        </div>

        {/* HP bar */}
        <div style={{ marginBottom: 3 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:8, marginBottom:1, color:hpColor }}>
            <span>♥ HP</span><span>{Math.ceil(ship.hp)}/{ship.maxHp}</span>
          </div>
          <Bar value={ship.hp} max={ship.maxHp} color={hpColor} height={6} />
        </div>

        {/* Shield bar */}
        {ship.maxShield > 0 && (
          <div style={{ marginBottom: 3 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:8, marginBottom:1, color:'#44ccff' }}>
              <span>🛡 SHD</span><span>{Math.ceil(ship.shield)}/{ship.maxShield}</span>
            </div>
            <Bar value={ship.shield} max={ship.maxShield} color='#44ccff' height={5} />
          </div>
        )}

        {/* Stats compact */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 8px', fontSize:8, color:'rgba(160,200,255,0.6)', marginTop:2 }}>
          <span style={{ color:'#ff8844' }}>⚔ {ship.attackDamage}dmg</span>
          <span>{STAT_ICONS.armor} {ship.armor}ar</span>
          <span style={{ color:'#ffcc00' }}>{STAT_ICONS.speed} {Math.round(ship.speed)}</span>
          <span>{STAT_ICONS.range} {ship.attackRange}</span>
          {ship.xp > 0 && <span style={{ color:'#88a' }}>XP {ship.xp}</span>}
        </div>
      </div>
    </div>
  );
}

// ── Multi Unit Info — clickable cards (LMB = isolate that ship) ──────────
function MultiUnitInfo({
  ships, onIsolate,
}: {
  ships: SpaceShip[];
  onIsolate: (shipId: number) => void;
}) {
  // Group ships by type, preserving individual IDs for isolation
  const groups = new Map<string, SpaceShip[]>();
  for (const s of ships) {
    if (!groups.has(s.shipType)) groups.set(s.shipType, []);
    groups.get(s.shipType)!.push(s);
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 5, color: 'rgba(160,200,255,0.55)' }}>
        {ships.length} UNITS · <span style={{ fontSize: 9, opacity: 0.6 }}>Click to select one type</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, overflowY: 'auto' }}>
        {Array.from(groups.entries()).map(([type, group]) => {
          const def   = getShipDef(type);
          const preview = SHIP_PREVIEW[type];
          const role  = SHIP_ROLES[type];
          const avgHp = group.reduce((sum, s) => sum + s.hp / s.maxHp, 0) / group.length;
          const hpCol = avgHp > 0.5 ? '#44cc44' : avgHp > 0.25 ? '#ccaa00' : '#cc4444';
          const maxRank = Math.max(...group.map(s => s.rank ?? 0));
          return (
            <div
              key={type}
              onClick={() => onIsolate(group[0].id)}
              title={`${def?.displayName ?? type} ×${group.length} — Click to select`}
              style={{
                width: 56, flexShrink: 0,
                border: `1px solid ${role ? SHIP_ROLE_COLORS[role] + '66' : '#1a3050'}`,
                borderRadius: 5, cursor: 'pointer',
                background: 'rgba(8,16,34,0.85)',
                position: 'relative', overflow: 'hidden',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#4488ff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = role ? SHIP_ROLE_COLORS[role] + '66' : '#1a3050'; }}
            >
              {/* Ship image or fallback icon */}
              <div style={{ height: 40, display:'flex', alignItems:'center', justifyContent:'center',
                background:'rgba(2,6,18,0.8)', overflow:'hidden' }}>
                {preview
                  ? <img src={preview} alt={type}
                      style={{ width:'100%', height:'100%', objectFit:'contain', imageRendering:'pixelated' }}
                      onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
                    />
                  : <div style={{ fontSize:20, opacity:0.15 }}>🚀</div>
                }
              </div>
              {/* Count + rank */}
              <div style={{ padding:'2px 3px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:10, fontWeight:700, color:'#fff' }}>x{group.length}</span>
                {maxRank > 0 && <span style={{ fontSize:8, color:'#ffcc00' }}>★{maxRank}</span>}
              </div>
              {/* HP bar */}
              <div style={{ height:3, background:'#0a1020' }}>
                <div style={{ height:'100%', width:`${avgHp*100}%`, background:hpCol }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Command Card — action hotkeys + abilities ───────────────────────
function CommandCard({ ship, renderer, allSelected }: { ship: SpaceShip; renderer: SpaceRenderer; allSelected: SpaceShip[] }) {
  const state = renderer.engine.state;

  // ─ Issue a stop/hold command directly to all selected ships
  const stop = () => {
    for (const id of state.selectedIds) {
      const s = state.ships.get(id);
      if (s) { s.moveTarget = null; s.targetId = null; s.isAttackMoving = false; }
    }
    renderer.controls.commandMode = 'normal';
  };
  const hold = () => {
    for (const id of state.selectedIds) {
      const s = state.ships.get(id);
      if (s) { s.holdPosition = true; s.moveTarget = null; }
    }
    renderer.controls.commandMode = 'normal';
  };

  const ACTION_BTNS: Array<{
    label: string; key: string; color: string; icon: string;
    active?: boolean; action: () => void;
  }> = [
    {
      label: 'Attack', key: 'G', color: '#ff5533', icon: '/assets/space/ui/space-icons/PNG/2.png',
      active: renderer.controls.commandMode === 'attack_move',
      action: () => { renderer.controls.commandMode = renderer.controls.commandMode === 'attack_move' ? 'normal' : 'attack_move'; },
    },
    {
      label: 'Move', key: 'RMB', color: '#4488ff', icon: '/assets/space/ui/space-icons/PNG/4.png',
      active: renderer.controls.commandMode === 'normal',
      action: () => { renderer.controls.commandMode = 'normal'; },
    },
    {
      label: 'Patrol', key: 'P', color: '#44cc88', icon: '/assets/space/ui/space-icons/PNG/6.png',
      active: renderer.controls.commandMode === 'patrol',
      action: () => { renderer.controls.commandMode = renderer.controls.commandMode === 'patrol' ? 'normal' : 'patrol'; },
    },
    { label: 'Defend', key: 'H', color: '#aa88ff', icon: '/assets/space/ui/space-icons/PNG/8.png', active: false, action: hold },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 6 }}>
      {/* ─ Action command row using Btn components ───── */}
      <div>
        <div style={{ fontSize: 9, color: 'rgba(160,200,255,0.4)', letterSpacing: 2, marginBottom: 4 }}>COMMANDS</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {ACTION_BTNS.map(btn => (
            <Btn key={btn.key} label={btn.label} icon={btn.icon} active={btn.active} onClick={btn.action}
              style={{ width: 56, height: 48, flexDirection: 'column' as any }} />
          ))}
        </div>
      </div>

      {/* ─ Abilities ──────────────────────────────── */}
      {ship.abilities.length > 0 && (
        <div>
          <div style={{ fontSize: 9, color: 'rgba(160,200,255,0.4)', letterSpacing: 2, marginBottom: 4 }}>ABILITIES</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ship.abilities.map((ab, i) => (
              <AbilityButton key={ab.ability.id} ab={ab} index={i} renderer={renderer} allSelected={allSelected} />
            ))}
          </div>
          <div style={{ fontSize: 8, marginTop: 6, color: 'rgba(160,200,255,0.3)' }}>
            Click: cast · Right-click: toggle autocast
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ability Button ────────────────────────────────────────────────
function AbilityButton({ ab, index, renderer, allSelected }: {
  ab: ShipAbilityState; index: number; renderer: SpaceRenderer; allSelected: SpaceShip[];
}) {
  const onCooldown = ab.cooldownRemaining > 0;
  const cdPct = ab.ability.cooldown > 0 ? ab.cooldownRemaining / ab.ability.cooldown : 0;
  const icon = ABILITY_ICONS[ab.ability.type];

  // Check autocast state across selection (majority rules display)
  let autoOn = 0, autoTotal = 0;
  for (const s of allSelected) {
    const a = s.abilities[index];
    if (a) { autoTotal++; if (a.autoCast) autoOn++; }
  }
  const isAutoCast = autoOn > autoTotal / 2;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    renderer.activateAbility(index);
  };

  const handleContext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    renderer.toggleAutoCast(index);
  };

  return (
    <Slot size={64} onClick={handleClick} active={ab.active || isAutoCast}
      style={{ opacity: onCooldown && !ab.active ? 0.5 : 1 }}>
      <div onContextMenu={handleContext} style={{
        width: '100%', height: '100%', position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Cooldown sweep overlay */}
        {onCooldown && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 6,
            background: `conic-gradient(rgba(0,0,0,0.7) ${cdPct * 360}deg, transparent ${cdPct * 360}deg)`,
            pointerEvents: 'none', zIndex: 2,
          }} />
        )}

        {/* Icon — prefer PNG skill art, fall back to SVG */}
        <div style={{ width: 34, height: 34, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {ABILITY_IMG[ab.ability.type]
            ? <img src={ABILITY_IMG[ab.ability.type]} alt={ab.ability.name}
                style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', imageRendering: 'auto',
                  filter: ab.active ? 'brightness(1.4) saturate(1.5)' : onCooldown ? 'grayscale(0.7) brightness(0.6)' : 'none' }}
                onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
              />
          : <div style={{ width: 28, height: 28, color: ab.active ? '#ff0' : '#8ac' }}>
              {icon ?? <Svg size={28}><circle cx="12" cy="12" r="8" stroke="#8ac" strokeWidth="1.5" fill="none"/><circle cx="12" cy="12" r="3" fill="#8ac"/></Svg>}
            </div>
        }
      </div>

      {/* Key label */}
      <div style={{
        fontSize: 9, fontWeight: 700, marginTop: 2, position: 'relative', zIndex: 1,
        background: '#1a2a40', padding: '1px 4px', borderRadius: 2,
      }}>
        {ab.ability.key}
      </div>

      {/* Ability name */}
      <div style={{ fontSize: 8, opacity: 0.6, marginTop: 1, position: 'relative', zIndex: 1, textAlign: 'center', lineHeight: 1.1, maxWidth: 60 }}>
        {ab.ability.name}
      </div>

      {/* Cooldown text */}
      {onCooldown && (
        <div style={{
          position: 'absolute', top: 2, right: 3, fontSize: 9, fontWeight: 700,
          color: '#f88', zIndex: 2,
        }}>
          {ab.cooldownRemaining.toFixed(0)}s
        </div>
      )}

      {/* Autocast indicator */}
      {isAutoCast && (
        <div style={{
          position: 'absolute', top: 2, left: 3, fontSize: 8, fontWeight: 700,
          color: '#4f4', zIndex: 2,
        }}>
          AUTO
        </div>
      )}

        {/* Energy cost */}
        <div style={{
          position: 'absolute', bottom: 1, right: 3, fontSize: 8, color: '#4df', zIndex: 2,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 1 }}>{STAT_ICONS.energyCost}{ab.ability.energyCost}</span>
        </div>
      </div>
    </Slot>
  );
}

// ── Minimap with LMB (camera) / RMB (move command) ───────────
function Minimap({ state, renderer }: { state: SpaceGameState; renderer: SpaceRenderer }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const toWorld = useCallback((clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    // Account for CSS scaling: the canvas buffer may differ from its CSS size
    // (e.g. on HiDPI displays or when the container rescales it)
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (clientX - rect.left) * scaleX;
    const py = (clientY - rect.top)  * scaleY;
    const mapW = renderer.engine.mapW;
    const mapH = renderer.engine.mapH;
    return {
      x: (px / canvas.width)  * mapW - mapW / 2,
      y: (py / canvas.height) * mapH - mapH / 2,
    };
  }, [renderer]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = toWorld(e.clientX, e.clientY, canvas);
    if (e.button === 0) {
      // LMB: jump camera to world position
      renderer.controls.cameraState.x = x;
      renderer.controls.cameraState.y = y;
    } else if (e.button === 2) {
      // RMB: issue move command for selected units
      for (const id of state.selectedIds) {
        const ship = state.ships.get(id);
        if (ship && !ship.dead && ship.team === 1) {
          ship.moveTarget = { x, y, z: 0 };
          ship.targetId = null;
          ship.holdPosition = false;
        }
      }
    }
  }, [state, renderer, toWorld]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const mapW = renderer.engine.mapW;  // dynamic — 8000 for 1v1, 20000 for 2v2/ffa4
    const mapH = renderer.engine.mapH;
    const scale = (v: number, max: number, dim: number) => ((v + max / 2) / max) * dim;

    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, w, h);

    // Planets
    for (const p of state.planets) {
      const px = scale(p.x, mapW, w);
      const py = scale(p.y, mapH, h);
      ctx.beginPath();
      ctx.arc(px, py, Math.max(3, p.radius * 0.03), 0, Math.PI * 2);
      ctx.fillStyle = `#${p.color.toString(16).padStart(6, '0')}`;
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Ships
    for (const [, ship] of state.ships) {
      if (ship.dead) continue;
      const sx = scale(ship.x, mapW, w);
      const sy = scale(ship.y, mapH, h);
      // Larger dots on minimap so ships are actually visible
      const sz = ship.shipClass === 'dreadnought' ? 5
        : ship.shipClass === 'battleship' ? 4
        : ship.shipClass === 'cruiser' || ship.shipClass === 'light_cruiser' ? 3.5
        : ship.shipClass === 'worker' ? 1.5 : 2.5;
      const tc = TEAM_COLORS[ship.team];
      ctx.fillStyle = ship.selected ? '#ffffff'
        : tc ? `#${tc.toString(16).padStart(6, '0')}` : '#44ff44';
      // Triangle for player ships, square for enemies — easier to read
      if (ship.team === 1) {
        ctx.beginPath();
        ctx.moveTo(sx, sy - sz);
        ctx.lineTo(sx + sz * 0.7, sy + sz * 0.5);
        ctx.lineTo(sx - sz * 0.7, sy + sz * 0.5);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
      }
    }

    // Stations
    for (const [, st] of state.stations) {
      if (st.dead) continue;
      const sx = scale(st.x, mapW, w), sy = scale(st.y, mapH, h);
      const stc = TEAM_COLORS[st.team];
      ctx.fillStyle = stc ? `#${stc.toString(16).padStart(6, '0')}` : '#4488ff';
      ctx.fillRect(sx - 2, sy - 2, 4, 1);
      ctx.fillRect(sx - 1, sy - 3, 2, 5); // cross
    }

    // Planet owner rings
    for (const p of state.planets) {
      if (p.owner === 0) continue;
      const px = scale(p.x, mapW, w), py = scale(p.y, mapH, h);
      const oc = TEAM_COLORS[p.owner];
      ctx.strokeStyle = oc ? `#${oc.toString(16).padStart(6, '0')}` : '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(4, p.radius * 0.04), 0, Math.PI * 2);
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Camera viewport indicator
    const cam = renderer.controls.cameraState;
    const camX = scale(cam.x, mapW, w);
    const camY = scale(cam.y, mapH, h);
    // Viewport width in map units depends on zoom angle
    const visGameUnits = cam.zoom * 1.5; // approximate visible game units at current zoom
    const vw = (visGameUnits / mapW) * w;
    const vh = (visGameUnits / mapH) * h;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 2]);
    ctx.strokeRect(camX - vw / 2, camY - vh / 2, vw, vh);
    ctx.setLineDash([]);

    // Border
    ctx.strokeStyle = '#1a3050';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, h);

    // Label: LMB = camera, RMB = move
    ctx.fillStyle = 'rgba(160,200,255,0.35)';
    ctx.font = '7px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('LMB: camera  RMB: move', 3, h - 3);
  });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas
        ref={canvasRef} width={192} height={150}
        style={{ imageRendering: 'pixelated', cursor: 'crosshair',
          pointerEvents: 'auto', display: 'block',
          // Explicit CSS size avoids browser-side canvas rescaling that
          // would misalign click coordinates with drawn pixels.
          width: 192, height: 150 }}
        onMouseDown={handleMouseDown}
        onContextMenu={e => e.preventDefault()}
      />
    </div>
  );
}

// ── Planet Info Panel (when planet selected) ─────────────────────
function PlanetInfoPanel({ planet, state, renderer }: {
  planet: Planet;
  state: SpaceGameState;
  renderer: SpaceRenderer;
}) {
  const td = PLANET_TYPE_DATA[planet.planetType];
  const ownerColor = TEAM_COLORS[planet.owner] ?? td.baseColor;
  const ownerLabel = planet.owner === 0 ? 'Neutral' : (planet.owner === 1 ? 'Player' : `Enemy Team ${planet.owner}`);
  const capPct = Math.max(0, Math.min(100, Math.round((planet.captureProgress / CAPTURE_TIME) * 100)));
  const station = planet.stationId ? state.stations.get(planet.stationId) : null;
  let turretCount = 0;
  for (const [, turret] of state.planetTurrets) {
    if (!turret.dead && turret.planetId === planet.id) turretCount++;
  }
  const m = td.resourceMult;
  const yieldCredits = Math.round(planet.resourceYield.credits * m.credits);
  const yieldEnergy = Math.round(planet.resourceYield.energy * m.energy);
  const yieldMinerals = Math.round(planet.resourceYield.minerals * m.minerals);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8ac', letterSpacing: 1 }}>PLANET FOCUS</div>
        <div style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#0d182a', border: '1px solid #1a3050', color: '#6a8a9a' }}>
          ID {planet.id}
        </div>
      </div>

      <SmallPanel title={planet.name} style={{ width: '100%' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 8,
            background: `radial-gradient(circle at 30% 30%, #ffffff22, #${td.baseColor.toString(16).padStart(6,'0')}88)`,
            border: `1px solid #${td.baseColor.toString(16).padStart(6,'0')}`,
            boxShadow: `0 0 14px #${td.baseColor.toString(16).padStart(6,'0')}55`,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{td.label}</div>
            <div style={{ fontSize: 9, color: '#8ac', marginTop: 2 }}>Tech Focus: {td.techFocus}</div>
            <div style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, color: `#${ownerColor.toString(16).padStart(6,'0')}` }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: `#${ownerColor.toString(16).padStart(6,'0')}`, display: 'inline-block' }} />
              {ownerLabel}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
          <div style={{ padding: '6px 8px', border: '1px solid #1a3050', borderRadius: 6, background: 'rgba(6,14,28,0.7)' }}>
            <div style={{ fontSize: 8, color: '#6a8a9a' }}>RESOURCE YIELD</div>
            <div style={{ fontSize: 10, color: '#fc4', marginTop: 2 }}>+{yieldCredits} credits</div>
            <div style={{ fontSize: 10, color: '#4df' }}>+{yieldEnergy} energy</div>
            <div style={{ fontSize: 10, color: '#4f8' }}>+{yieldMinerals} minerals</div>
          </div>
          <div style={{ padding: '6px 8px', border: '1px solid #1a3050', borderRadius: 6, background: 'rgba(6,14,28,0.7)' }}>
            <div style={{ fontSize: 8, color: '#6a8a9a' }}>ORBITAL STATUS</div>
            <div style={{ fontSize: 10, color: station ? '#4f8' : '#f88', marginTop: 2 }}>
              Station: {station && !station.dead ? 'Online' : 'None'}
            </div>
            <div style={{ fontSize: 10, color: '#8ac' }}>Defense Turrets: {turretCount}</div>
            <div style={{ fontSize: 10, color: '#8ac' }}>Capture Radius: {Math.round(planet.captureRadius)}</div>
          </div>
        </div>

        {planet.captureProgress > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#8ac', marginBottom: 2 }}>
              <span>Capture Progress</span>
              <span style={{ color: '#fc4' }}>{capPct}%</span>
            </div>
            <Bar value={planet.captureProgress} max={CAPTURE_TIME} color={planet.captureTeam !== 0 ? `#${(TEAM_COLORS[planet.captureTeam] ?? 0xffff44).toString(16).padStart(6,'0')}` : '#ffdd44'} height={8} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 6 }}>
          <Btn label="CENTER CAMERA" onClick={() => {
            renderer.controls.cameraState.x = planet.x;
            renderer.controls.cameraState.y = planet.y;
          }} style={{ flex: 1, minWidth: 0 }} />
          {station && !station.dead && station.team === 1 && (
            <Btn label="SELECT STATION" active onClick={() => {
              for (const [, st] of state.stations) st.selected = false;
              station.selected = true;
            }} style={{ flex: 1, minWidth: 0 }} />
          )}
        </div>
      </SmallPanel>
    </div>
  );
}
// ── Build Panel (when station selected) ─────────────────────────
function BuildPanel({ station, renderer, res }: { station: SpaceStation; renderer: SpaceRenderer; res: PlayerResources }) {
  const tiers = [1, 2, 3, 4, 5];
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: '#4df' }}>BUILD SHIPS</div>

      {/* Auto-produce selector (swarm style) */}
      <div style={{ marginBottom: 6, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 9, opacity: 0.5 }}>Auto:</span>
        <div onClick={() => renderer.engine.setAutoProduction(station.id, null)} style={{
          fontSize: 8, padding: '2px 6px', borderRadius: 3, cursor: 'pointer',
          background: !station.autoProduceType ? '#2266cc' : '#1a2a40', border: '1px solid #1a3050',
        }}>OFF</div>
        {['red_fighter', 'galactix_racer', 'dual_striker'].map(key => {
          const d = SHIP_DEFINITIONS[key];
          return d ? (
            <div key={key} onClick={() => renderer.engine.setAutoProduction(station.id, key)} style={{
              fontSize: 8, padding: '2px 6px', borderRadius: 3, cursor: 'pointer',
              background: station.autoProduceType === key ? '#2266cc' : '#1a2a40', border: '1px solid #1a3050',
            }}>{d.displayName}</div>
          ) : null;
        })}
      </div>

      {/* Build queue */}
      {station.buildQueue.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          {station.buildQueue.map((item, i) => {
            const itemDef = getShipDef(item.shipType);
            return (
              <div key={i} style={{ fontSize: 10, display: 'flex', gap: 6, marginBottom: 2 }}>
                <span style={{ color: HERO_SHIPS.includes(item.shipType) ? '#fc4' : '#fff', fontWeight: 600 }}>{itemDef?.displayName ?? item.shipType}</span>
                <span style={{ color: '#fc4' }}>{item.buildTimeRemaining.toFixed(0)}s</span>
                {i === 0 && <div style={{ flex: 1, height: 4, background: '#1a1a2a', borderRadius: 2, alignSelf: 'center' }}>
                  <div style={{ height: '100%', width: `${(1 - item.buildTimeRemaining / item.totalBuildTime) * 100}%`, background: '#4488ff', borderRadius: 2 }} />
                </div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Stock ships — using Slot frames */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 100, overflowY: 'auto', marginBottom: 6 }}>
        {tiers.flatMap(tier => (BUILDABLE_SHIPS[tier] ?? []).map(key => {
          const def = SHIP_DEFINITIONS[key];
          if (!def) return null;
          const s = def.stats;
          const canAfford = res.credits >= s.creditCost && res.energy >= s.energyCost && res.minerals >= s.mineralCost;
          return (
            <Slot key={key} size={68}
              onClick={() => canAfford ? renderer.engine.queueBuild(station.id, key) : undefined}
              style={{ opacity: canAfford ? 1 : 0.35 }}>
              <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
                <div style={{ fontSize: 7, fontWeight: 700, color: '#fff' }}>{def.displayName}</div>
                <div style={{ fontSize: 6, color: '#fc4' }}>{s.creditCost}c</div>
                <div style={{ fontSize: 6, color: '#4df' }}>{s.energyCost}e</div>
                <div style={{ fontSize: 6, color: '#4f8' }}>{s.mineralCost}m</div>
              </div>
            </Slot>
          );
        }))}
      </div>

      {/* Hero ships (only if station can build heroes) */}
      {station.canBuildHeroes && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#fc4', marginBottom: 4, borderTop: '1px solid #1a3050', paddingTop: 4 }}>HERO SHIPS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {HERO_SHIPS.map(key => {
              const def = HERO_DEFINITIONS[key];
              if (!def) return null;
              const s = def.stats;
              const canAfford = res.credits >= s.creditCost && res.energy >= s.energyCost && res.minerals >= s.mineralCost;
              return (
                <div key={key} onClick={() => canAfford && renderer.engine.queueBuild(station.id, key)} style={{
                  width: 78, padding: '4px 2px', border: '1px solid #443300', borderRadius: 4,
                  background: canAfford ? 'rgba(40,30,10,0.9)' : 'rgba(20,15,5,0.5)',
                  opacity: canAfford ? 1 : 0.4, cursor: canAfford ? 'pointer' : 'default',
                  textAlign: 'center', fontSize: 8,
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#fc4', marginBottom: 2 }}>{def.displayName}</div>
                  <div style={{ color: '#fc4' }}>{s.creditCost}c</div>
                  <div style={{ color: '#4df' }}>{s.energyCost}e</div>
                  <div style={{ color: '#4f8' }}>{s.mineralCost}m</div>
                  <div style={{ color: '#888', fontSize: 7, marginTop: 1 }}>{s.buildTime}s</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Upgrade Panel (when nothing selected) — using Slot + Bar from ui-lib
function UpgradePanel({ upg, res, renderer }: { upg: TeamUpgrades; res: PlayerResources; renderer: SpaceRenderer }) {
  const types: { key: keyof TeamUpgrades; label: string; color: string; icon: string }[] = [
    { key: 'attack', label: 'Attack', color: '#f44', icon: '/assets/space/ui/item-icons/PNG/7.png' },
    { key: 'armor', label: 'Armor', color: '#8ac', icon: '/assets/space/ui/item-icons/PNG/1.png' },
    { key: 'speed', label: 'Speed', color: '#fa0', icon: '/assets/space/ui/item-icons/PNG/3.png' },
    { key: 'health', label: 'Health', color: '#4f4', icon: '/assets/space/ui/item-icons/PNG/5.png' },
    { key: 'shield', label: 'Shield', color: '#4df', icon: '/assets/space/ui/item-icons/PNG/9.png' },
  ];
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: '#fa0' }}>GLOBAL UPGRADES</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {types.map(t => {
          const level = upg[t.key];
          const maxed = level >= 5;
          const cost = !maxed ? UPGRADE_COSTS[level] : null;
          const canAfford = cost ? res.credits >= cost.credits && res.minerals >= cost.minerals && res.energy >= cost.energy : false;
          return (
            <Slot key={t.key} size={80}
              onClick={() => canAfford ? renderer.engine.purchaseUpgrade(1 as any, t.key) : undefined}
              active={maxed}
              style={{ opacity: maxed ? 0.8 : canAfford ? 1 : 0.35 }}>
              <div style={{ textAlign: 'center' }}>
                <img src={t.icon} alt={t.label}
                  style={{ width: 26, height: 26, objectFit: 'contain', imageRendering: 'auto' }}
                  onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                <div style={{ fontSize: 8, fontWeight: 700, color: t.color, marginTop: 1 }}>{t.label}</div>
                <Bar value={level} max={5} color={t.color} height={4} width={50} />
                <div style={{ fontSize: 7, color: '#fff', marginTop: 1 }}>Lv {level}/5</div>
                {!maxed && cost && <div style={{ fontSize: 6, color: '#8ac' }}>{cost.credits}c</div>}
                {maxed && <div style={{ fontSize: 7, color: '#4f4' }}>MAX</div>}
              </div>
            </Slot>
          );
        })}
      </div>
    </div>
  );
}

// ── Void Power Castbar ─────────────────────────────────────────
function VoidPowerBar({ state, techSt, onCast }: {
  state: SpaceGameState;
  techSt: { researchedNodes: Set<string>; [k: string]: any };
  onCast: (id: string, x: number, y: number) => void;
}) {
  const unlocked = Object.values(VOID_POWERS).filter(p => techSt.researchedNodes.has(p.techNodeId));
  if (!unlocked.length) return null;
  const cds = state.voidCooldowns?.get(1) ?? new Map<string, number>();
  return (
    <div style={{
      position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: 6, zIndex: 20, pointerEvents: 'auto',
      background: 'rgba(4,10,22,0.85)', border: '1px solid #1a3050',
      borderRadius: 8, padding: '4px 8px',
    }}>
      <span style={{ fontSize: 9, color: '#8ac', alignSelf: 'center', marginRight: 4, letterSpacing: 1 }}>VOID</span>
      {unlocked.map(pwr => {
        const cd = cds.get(pwr.id) ?? 0;
        const cdPct = cd > 0 ? cd / pwr.cooldown : 0;
        const res = state.resources[1];
        const canCast = !cd && res &&
          res.credits >= pwr.cost.credits &&
          res.energy >= pwr.cost.energy &&
          res.minerals >= pwr.cost.minerals;
        return (
          <div key={pwr.id}
            title={`${pwr.name}\n${pwr.description}\nCost: ${pwr.cost.credits}c ${pwr.cost.energy}e ${pwr.cost.minerals}m\nCD: ${pwr.cooldown}s`}
            onClick={() => canCast && onCast(pwr.id, 0, 0)}
            style={{
              width: 44, height: 44, borderRadius: 6, cursor: canCast ? 'pointer' : 'default',
              border: `1px solid ${canCast ? '#4488ff' : '#1a3050'}`,
              background: 'rgba(6,14,32,0.9)', position: 'relative', overflow: 'hidden',
              opacity: canCast ? 1 : 0.5,
            }}
          >
            <img src={pwr.icon} alt={pwr.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain',
                imageRendering: 'pixelated', filter: canCast ? 'none' : 'grayscale(0.8)' }}
              onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
            />
            {cdPct > 0 && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 6,
                background: `conic-gradient(rgba(0,0,0,0.75) ${cdPct*360}deg, transparent ${cdPct*360}deg)`,
              }} />
            )}
            {cd > 0 && (
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#f88' }}>
                {Math.ceil(cd)}
              </div>
            )}
            <div style={{ position:'absolute', bottom:1, left:0, right:0, textAlign:'center', fontSize:7, color:'#8ac', lineHeight:1 }}>
              {pwr.name.split(' ')[0]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Draggable floating panel helper ─────────────────────────────
function useDraggablePanel(initialX: number, initialY: number) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const dragState = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragState.current;
      if (!d) return;
      const nx = d.ox + (e.clientX - d.sx);
      const ny = d.oy + (e.clientY - d.sy);
      setPos({ x: Math.max(0, nx), y: Math.max(0, ny) });
    };
    const onUp = () => { dragState.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const onDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragState.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
  };

  return { pos, onDragStart };
}

// ── Tech Tree Panel ─────────────────────────────────────────────
function TechTreePanel({ state, myPlanets, onResearch, onClose }: {
  state: SpaceGameState;
  myPlanets: import('./space-types').Planet[];
  onResearch: (nodeId: string) => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (myPlanets.length === 0) return 'forge';
    return PLANET_TYPE_TO_TECH[myPlanets[0].planetType] ?? 'forge';
  });
  const techSt = state.techState?.get(1);
  const res = state.resources[1];
  const tree = ALL_TECH_TREES[activeTab];
  const C = { bg:'rgba(4,10,22,0.97)', border:'#1a3050', accent:'#4488ff', text:'#cde', muted:'rgba(160,200,255,0.4)' };
  const drag = useDraggablePanel(210, 45);

  // Available planet tech trees (only show trees for owned planets)
  const availTrees = Object.values(ALL_TECH_TREES).filter(t =>
    t.id === 'command' || myPlanets.some(p => PLANET_TYPE_TO_TECH[p.planetType] === t.id));

  return (
    <div style={{ position:'absolute', left: drag.pos.x, top: drag.pos.y, zIndex:50, pointerEvents:'auto' }}>
      <Panel title="TECH TREES" variant="green" onClose={onClose}
        width={500} style={{ maxHeight:'80vh', overflow:'auto' }}>
      <div
        onMouseDown={drag.onDragStart}
        style={{
          marginBottom: 8, padding: '4px 8px', borderRadius: 4, cursor: 'move',
          fontSize: 9, color: '#8ac', letterSpacing: 1, textAlign: 'center',
          background: 'rgba(10,20,40,0.65)', border: '1px dashed #2a4a70',
          userSelect: 'none',
        }}
      >DRAG PANEL</div>
      {techSt?.inResearch && (
        <div style={{ fontSize:10, color:'#fc4', textAlign:'center', marginBottom:8 }}>
          Researching… {Math.ceil(techSt.researchTimeRemaining ?? 0)}s
        </div>
      )}
      {/* Tree tabs */}
      <div style={{ display:'flex', gap:4, padding:'6px 10px', borderBottom:`1px solid ${C.border}`, flexWrap:'wrap' }}>
        {availTrees.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding:'4px 10px', border:`1px solid ${activeTab===t.id ? t.color.toString(16).padStart(6,'0') : '#1a3050'}`,
            borderRadius:4, cursor:'pointer', fontSize:10, fontWeight:700,
            background: activeTab===t.id ? 'rgba(68,136,255,0.12)' : 'transparent',
            color: activeTab===t.id ? `#${t.color.toString(16).padStart(6,'0')}` : C.muted,
          }}>{t.name}</button>
        ))}
      </div>
      {/* Nodes */}
      {tree && (
        <div style={{ padding:'10px 14px' }}>
          {[1,2,3].map(tier => {
            const nodes = tree.nodes.filter(n => n.tier === tier);
            return (
              <div key={tier} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:`#${tree.color.toString(16).padStart(6,'0')}`, fontWeight:700, marginBottom:6, borderBottom:`1px solid #1a3050`, paddingBottom:3 }}>
                  TIER {tier}
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {nodes.map(node => {
                    const done      = techSt?.researchedNodes.has(node.id);
                    const inProg    = techSt?.inResearch === node.id;
                    const prereqsMet = node.requires.every(r => techSt?.researchedNodes.has(r));
                    const canAfford  = res && res.credits>=node.cost.credits && res.energy>=node.cost.energy && res.minerals>=node.cost.minerals;
                    const canStart   = prereqsMet && !done && !inProg && !techSt?.inResearch && canAfford;
                    return (
                      <div key={node.id} style={{
                        width:136, padding:'8px 10px', borderRadius:6,
                        border:`1px solid ${done?'#2a5a2a':inProg?'#5a5a00':prereqsMet?'#1a3050':'#0a1a20'}`,
                        background: done?'rgba(20,60,20,0.6)':inProg?'rgba(40,40,10,0.7)':'rgba(6,14,28,0.8)',
                        opacity: prereqsMet ? 1 : 0.45,
                      }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                          <img src={node.icon} alt="" style={{ width:22, height:22, imageRendering:'pixelated' }}
                            onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                          <span style={{ fontSize:11, fontWeight:700, color: done?'#4f4':inProg?'#fc4':'#fff' }}>{node.name}</span>
                          {done && <span style={{fontSize:12, color:'#4f4'}}>✓</span>}
                        </div>
                        <div style={{ fontSize:9, color:C.muted, marginBottom:6, lineHeight:1.4 }}>{node.description}</div>
                        <div style={{ fontSize:8, color:'#88a', marginBottom:4 }}>
                          {node.cost.credits}c / {node.cost.energy}e / {node.cost.minerals}m · {node.cost.credits>0?`${node.researchTime}s`:''}
                        </div>
                        {inProg && (
                          <div style={{ height:4, background:'#1a2a10', borderRadius:2 }}>
                            <div style={{ height:'100%', width:`${(1-(techSt?.researchTimeRemaining??0)/(node.researchTime||1))*100}%`, background:'#fc4', borderRadius:2 }} />
                          </div>
                        )}
                        {canStart && (
                          <button onClick={() => onResearch(node.id)} style={{
                            width:'100%', padding:'3px', fontSize:9, fontWeight:700,
                            background:C.accent, border:'none', borderRadius:3, color:'#fff', cursor:'pointer', marginTop:4,
                          }}>RESEARCH</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </Panel>
    </div>
  );
}

// ── Commander Panel (character-screen style matching image 2) ───────
function CommanderPanel({ state, selectedCmdId, selectedPlanetId, onSelectCmd, onSelectPlanet,
  onTrain, onUpgrade, res, onClose }: {
  state: SpaceGameState;
  selectedCmdId: number | null;
  selectedPlanetId: number | null;
  onSelectCmd: (id: number | null) => void;
  onSelectPlanet: (id: number | null) => void;
  onTrain: (planetId: number) => void;
  onUpgrade: (cmdId: number) => void;
  res: import('./space-types').PlayerResources;
  onClose: () => void;
}) {
  const commanders = [...state.commanders.values()].filter(c => c.team === 1);
  const selected = selectedCmdId != null ? state.commanders.get(selectedCmdId) : null;
  const myPlanets = state.planets.filter(p => p.owner === 1);
  const C = { bg:'rgba(4,12,8,0.97)', accent:'#00ee88', border:'#1a3a22', text:'#aae0b0', muted:'rgba(100,200,120,0.4)' };
  const defaultX = typeof window !== 'undefined' ? Math.max(220, window.innerWidth - 470) : 980;
  const drag = useDraggablePanel(defaultX, 45);

  return (
    <div style={{ position:'absolute', left: drag.pos.x, top: drag.pos.y, zIndex:50, pointerEvents:'auto' }}>
    <Panel title="COMMANDER CORPS" variant="green" onClose={onClose}
      width={440} style={{ maxHeight:'85vh', overflow:'auto' }}>
      <div
        onMouseDown={drag.onDragStart}
        style={{
          marginBottom: 8, padding: '4px 8px', borderRadius: 4, cursor: 'move',
          fontSize: 9, color: '#7fcf9f', letterSpacing: 1, textAlign: 'center',
          background: 'rgba(8,24,12,0.7)', border: '1px dashed #1f5f35',
          userSelect: 'none',
        }}
      >DRAG PANEL</div>

      <div style={{ display:'flex', gap:0 }}>
        {/* Left: commander list + planet train */}
        <div style={{ width:160, borderRight:`1px solid ${C.border}`, padding:'8px' }}>
          <div style={{ fontSize:9, color:C.muted, marginBottom:6, letterSpacing:1 }}>COMMANDERS ({commanders.length})</div>
          {commanders.map(cmd => (
            <div key={cmd.id} onClick={() => onSelectCmd(cmd.id)}
              style={{
                padding:'6px 8px', marginBottom:4, borderRadius:6, cursor:'pointer',
                border:`1px solid ${selectedCmdId===cmd.id?C.accent:C.border}`,
                background: selectedCmdId===cmd.id?'rgba(0,238,136,0.08)':'rgba(4,16,8,0.7)',
                display:'flex', alignItems:'center', gap:6,
              }}
            >
              <img src={cmd.portrait} alt={cmd.name}
                style={{ width:28, height:28, borderRadius:4, objectFit:'cover', border:`1px solid ${C.border}` }}
                onError={e=>{(e.target as HTMLImageElement).style.display='none'}}
              />
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:'#fff' }}>{cmd.name}</div>
                <div style={{ fontSize:8, color:C.muted }}>Lv{cmd.level} · {COMMANDER_SPEC_LABEL[cmd.spec]}</div>
                <div style={{ fontSize:8, color: cmd.state==='training'?'#fc4':cmd.state==='onship'?'#4df':'#4f4' }}>
                  {cmd.state==='training'?`Training (${Math.ceil(cmd.trainingTimeRemaining)}s)`:cmd.state==='onship'?'On Ship':'Idle'}
                </div>
              </div>
            </div>
          ))}

          {/* Train from planet */}
          <div style={{ marginTop:10, fontSize:9, color:C.muted, letterSpacing:1, marginBottom:4 }}>TRAIN FROM PLANET</div>
          {myPlanets.map(p => {
            const alreadyTraining = commanders.some(c => c.trainingPlanetId===p.id && c.state==='training');
            const cost = COMMANDER_TRAIN_COST[1];
            const canAfford = res.credits>=cost.credits && res.energy>=cost.energy && res.minerals>=cost.minerals;
            const td = PLANET_TYPE_DATA[p.planetType];
            return (
              <div key={p.id} style={{ marginBottom:4, padding:'5px 6px', borderRadius:5, border:`1px solid ${C.border}`, background:'rgba(4,16,8,0.6)' }}>
                <div style={{ fontSize:9, fontWeight:700, color:`#${td.baseColor.toString(16).padStart(6,'0')}`, marginBottom:2 }}>{p.name}</div>
                <div style={{ fontSize:8, color:C.muted, marginBottom:3 }}>{td.label} · {COMMANDER_SPEC_LABEL[(alreadyTraining?'forge':Object.keys(COMMANDER_SPEC_LABEL)[0]) as import('./space-types').CommanderSpec]}</div>
                {alreadyTraining
                  ? <span style={{ fontSize:8, color:'#fc4' }}>Training in progress…</span>
                  : <button onClick={() => onTrain(p.id)} disabled={!canAfford} style={{
                      width:'100%', padding:'2px', fontSize:8, fontWeight:700, cursor:canAfford?'pointer':'default',
                      background: canAfford?C.accent:'#1a2a1a', border:'none', borderRadius:3,
                      color: canAfford?'#000':'#3a5a3a',
                    }}>RECRUIT ({cost.credits}c/{cost.energy}e/{cost.minerals}m)</button>
                }
              </div>
            );
          })}
        </div>

        {/* Right: selected commander character screen */}
        {selected ? (
          <div style={{ flex:1, padding:'12px' }}>
            {/* Portrait + name (image 2 style) */}
            <div style={{ display:'flex', gap:10, marginBottom:10 }}>
              <div style={{ position:'relative' }}>
                <img src={selected.portrait} alt={selected.name}
                  style={{ width:64, height:64, objectFit:'cover', borderRadius:6, border:`2px solid ${C.accent}` }}
                  onError={e=>{(e.target as HTMLImageElement).src=''}}
                />
                {/* Hexagonal overlay aesthetic */}
                <div style={{ position:'absolute', inset:0, borderRadius:6, background:'linear-gradient(180deg,transparent 50%,rgba(0,238,136,0.15))', pointerEvents:'none' }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:800, color:'#fff' }}>{selected.name}</div>
                <div style={{ fontSize:10, color:C.accent }}>{COMMANDER_SPEC_LABEL[selected.spec]} Commander</div>
                {/* Rank stars */}
                <div style={{ display:'flex', gap:2, marginTop:3 }}>
                  {Array.from({length:5},(_,i) => (
                    <span key={i} style={{ fontSize:12, color: i < selected.level ? '#ffcc00' : '#1a3a1a', textShadow: i < selected.level ? '0 0 6px #ffcc00' : 'none' }}>★</span>
                  ))}
                  <span style={{ fontSize:9, color:C.muted, marginLeft:4 }}>Lv {selected.level}/5</span>
                </div>
              </div>
            </div>

            {/* XP bar */}
            <div style={{ marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:C.muted, marginBottom:2 }}>
                <span>XP</span><span>{selected.xp}/{selected.xpToNextLevel}</span>
              </div>
              <Bar value={selected.xp} max={selected.xpToNextLevel} color='#cc4400' height={8} />
            </div>

            {/* Stats grid matching image 2 style */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginBottom:8 }}>
              {([
                { label:'ATTACK',  val: `+${Math.round(selected.attackBonus*100)}%`,  color:'#ee4444' },
                { label:'DEFENSE', val: `+${Math.round(selected.defenseBonus*100)}%`, color:'#44ee88' },
                { label:'SPEED',   val: `+${Math.round(selected.speedBonus*100)}%`,   color:'#44aaff' },
                { label:'SPECIAL', val: `+${Math.round(selected.specialBonus*100)}%`, color:'#ffcc00' },
              ] as const).map(s => (
                <div key={s.label} style={{
                  padding:'5px 8px', borderRadius:5,
                  border:`1px solid ${s.color}44`, background:`${s.color}11`,
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                }}>
                  <span style={{ fontSize:9, color:C.muted, letterSpacing:0.5 }}>{s.label}</span>
                  <span style={{ fontSize:12, fontWeight:800, color:s.color }}>{s.val}</span>
                </div>
              ))}
            </div>

            {/* Upgrade button */}
            {selected.state === 'idle' && selected.level < 5 && (() => {
              const cost = COMMANDER_TRAIN_COST[selected.level + 1];
              const time = COMMANDER_TRAIN_TIME[selected.level + 1];
              if (!cost) return null;
              const canAfford = res.credits>=cost.credits && res.energy>=cost.energy && res.minerals>=cost.minerals;
              return (
                <div style={{ marginTop:4 }}>
                  <div style={{ fontSize:8, color:C.muted, marginBottom:3 }}>Upgrade to Level {selected.level+1} · {time}s training</div>
                  <button onClick={() => onUpgrade(selected.id)} disabled={!canAfford} style={{
                    width:'100%', padding:'6px', fontSize:11, fontWeight:700, borderRadius:6, cursor:canAfford?'pointer':'default',
                    background: canAfford?C.accent:'#1a2a1a', border:'none',
                    color: canAfford?'#000':'#3a5a3a', letterSpacing:1,
                  }}>UPGRADE COMMANDER ({cost.credits}c/{cost.energy}e/{cost.minerals}m)</button>
                </div>
              );
            })()}

            {/* Training progress */}
            {selected.state === 'training' && (
              <div style={{ marginTop:6 }}>
                <div style={{ fontSize:9, color:'#fc4', marginBottom:3 }}>Training… {Math.ceil(selected.trainingTimeRemaining)}s remaining</div>
                <Bar
                  value={selected.trainingTotalTime - selected.trainingTimeRemaining}
                  max={selected.trainingTotalTime}
                  color='#fc4' height={6}
                />
              </div>
            )}

            {/* On ship indicator */}
            {selected.state === 'onship' && selected.equippedShipId && (
              <div style={{ marginTop:6, padding:'6px 10px', background:'rgba(68,136,255,0.1)', border:'1px solid #2244aa', borderRadius:5, fontSize:9, color:'#4df' }}>
                🔵 Commanding ship ID {selected.equippedShipId} — will be lost if ship is destroyed
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:C.muted }}>
            Select a commander to view details
          </div>
        )}
      </div>
    </Panel>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Project a game-world position to screen pixel coordinates for HTML overlays. */
function worldToScreen(x: number, y: number, z: number, renderer: SpaceRenderer): { x: number; y: number } | null {
  const WORLD_SCALE = 0.05;
  const cam = renderer.controls.cameraState;
  const yawRad = cam.rotation * (Math.PI / 180);
  const pitchRad = cam.angle * (Math.PI / 180);
  const lookX = cam.x * WORLD_SCALE, lookZ = cam.y * WORLD_SCALE;
  const camX = lookX + Math.sin(yawRad) * cam.zoom * Math.cos(pitchRad);
  const camY = cam.zoom * Math.sin(pitchRad);
  const camZ = lookZ + Math.cos(yawRad) * cam.zoom * Math.cos(pitchRad);
  // Cheap perspective project
  const dx = x * WORLD_SCALE - camX, dy = z * WORLD_SCALE - camY, dz = y * WORLD_SCALE - camZ;
  const cosY = Math.cos(-yawRad), sinY = Math.sin(-yawRad);
  const rz = dx * cosY - dz * sinY, rx = dx * sinY + dz * cosY;
  const cosP = Math.cos(-pitchRad + Math.PI/2), sinP = Math.sin(-pitchRad + Math.PI/2);
  const ry2 = dy * cosP - rz * sinP, rz2 = dy * sinP + rz * cosP;
  if (rz2 < 0.1) return null;
  const fov = 50 * (Math.PI / 180);
  const aspect = window.innerWidth / window.innerHeight;
  const scale = 1 / (Math.tan(fov / 2) * rz2);
  const sx = window.innerWidth * 0.5 + rx * scale * window.innerHeight * 0.5;
  const sy = window.innerHeight * 0.5 - ry2 * scale * window.innerHeight * 0.5;
  if (sx < -50 || sx > window.innerWidth + 50 || sy < -50 || sy > window.innerHeight + 50) return null;
  return { x: sx, y: sy };
}
