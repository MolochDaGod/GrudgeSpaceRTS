// space-ui-shared.ts — Shared constants, icons, and helpers for the HUD
// Extracted from space-ui.tsx for modularity.
import React from 'react';
import type { SpaceRenderer as _SpaceRenderer } from './space-renderer';
export type { SpaceRenderer } from './space-renderer';
export type {
  SpaceShip,
  SpaceStation,
  ShipAbilityState,
  PlayerResources,
  SpaceGameState,
  TeamUpgrades,
  Commander,
  Planet,
  CommanderSpec,
} from './space-types';
export {
  SHIP_DEFINITIONS,
  BUILDABLE_SHIPS,
  UPGRADE_COSTS,
  UPGRADE_BONUSES,
  TEAM_COLORS,
  CAPTURE_TIME,
  DOMINATION_TIME,
  HERO_DEFINITIONS,
  HERO_SHIPS,
  getShipDef,
  type UpgradeType,
  PLANET_TYPE_DATA,
  COMMANDER_SPEC_LABEL,
  COMMANDER_TRAIN_COST,
  COMMANDER_TRAIN_TIME,
  SHIP_ROLES,
  SHIP_ROLE_LABELS,
  SHIP_ROLE_COLORS,
  POI_COLORS,
  POI_LABELS,
  VISION_RADIUS,
  type FogGrid,
  type PointOfInterest,
  type POIType,
} from './space-types';
export { ALL_TECH_TREES, VOID_POWERS, PLANET_TYPE_TO_TECH, TURRET_DEFS } from './space-techtree';
export { Panel, SmallPanel, Btn, Slot, Bar, Frame, ResBox, Tooltip } from './ui-lib';

// ── Ship preview images (GIF for voxel ships, PNG for capitals/heroes) ─
export const SHIP_PREVIEW: Record<string, string> = {
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
  micro_recon: '/assets/space/models/ships/MicroRecon/MicroRecon.gif',
  red_fighter: '/assets/space/models/ships/RedFighter/RedFighter.gif',
  galactix_racer: '/assets/space/models/ships/GalactixRacer/GalactixRacer.gif',
  dual_striker: '/assets/space/models/ships/DualStriker/DualStriker.gif',
  camo_stellar_jet: '/assets/space/models/ships/CamoStellarJet/CamoStellarJet.gif',
  meteor_slicer: '/assets/space/models/ships/MeteorSlicer/MeteorSlicer.gif',
  infrared_furtive: '/assets/space/models/ships/InfraredFurtive/InfraredFurtive.gif',
  ultraviolet_intruder: '/assets/space/models/ships/UltravioletIntruder/UltravioletIntruder.gif',
  warship: '/assets/space/models/ships/Warship/Warship.gif',
  star_marine_trooper: '/assets/space/models/ships/StarMarineTrooper/StarMarineTrooper.gif',
  interstellar_runner: '/assets/space/models/ships/InterstellarRunner/InterstellarRunner.gif',
  transtellar: '/assets/space/models/ships/Transtellar/Transtellar.gif',
  pyramid_ship: '/assets/space/models/ships/PyramidShip/AncientPyramidShip.gif',
  battleship: '/assets/space/models/capital/Battleships/Battleship.png',
  destroyer: '/assets/space/models/capital/Destroyer/Destroyer.png',
  cruiser: '/assets/space/models/capital/Cruiser/Cruiser.png',
  bomber: '/assets/space/models/capital/Bomber/Bomber.png',
  // Hero ships — each uses a unique hull preview
  vanguard_prime: '/assets/space/models/new-ships/Spaceship_main_01_Hull.png',
  shadow_reaper: '/assets/space/models/new-ships/Spaceship_main_02_Hull.png',
  iron_bastion: '/assets/space/models/new-ships/Spaceship_main_03_Hull.png',
  storm_herald: '/assets/space/models/capital/Destroyer/Destroyer.png',
  plague_mother: '/assets/space/models/capital/Battleships/Battleship2.png',
  custom_hero: '/assets/space/models/new-ships/Ship_Boos_01_Hull.png',
  // Boss ships
  boss_ship_01: '/assets/space/models/new-ships/Ship_Boos_01_Hull.png',
  boss_ship_02: '/assets/space/models/new-ships/Ship_Boss_02_Hull.png',
  // Workers — use their actual vehicle textures
  mining_drone: '/assets/space/models/vehicles/Tracer/Tracer-0-Tracer.png',
  energy_skimmer: '/assets/space/models/vehicles/Scooter/Scooter-0-Scooter.png',
  // Corvettes (battle fleet)
  cf_corvette_01: '/assets/space/models/battle-ships/Corvette_01.png',
  cf_corvette_02: '/assets/space/models/battle-ships/Corvette_02.png',
  cf_corvette_03: '/assets/space/models/battle-ships/Corvette_03.png',
  cf_corvette_04: '/assets/space/models/battle-ships/Corvette_04.png',
  cf_corvette_05: '/assets/space/models/battle-ships/Corvette_05.png',
  // Frigates
  cf_frigate_01: '/assets/space/models/battle-ships/Frigate_01.png',
  cf_frigate_02: '/assets/space/models/battle-ships/Frigate_02.png',
  cf_frigate_03: '/assets/space/models/battle-ships/Frigate_03.png',
  cf_frigate_04: '/assets/space/models/battle-ships/Frigate_04.png',
  cf_frigate_05: '/assets/space/models/battle-ships/Frigate_05.png',
  // Light Cruisers
  cf_light_cruiser_01: '/assets/space/models/battle-ships/Light cruiser_01.png',
  cf_light_cruiser_02: '/assets/space/models/battle-ships/Light cruiser_02.png',
  cf_light_cruiser_03: '/assets/space/models/battle-ships/Light cruiser_03.png',
  cf_light_cruiser_04: '/assets/space/models/battle-ships/Light cruiser_04.png',
  cf_light_cruiser_05: '/assets/space/models/battle-ships/Light cruiser_05.png',
  // Destroyers (battle fleet)
  cf_destroyer_01: '/assets/space/models/battle-ships/Destroyer_01.png',
  cf_destroyer_02: '/assets/space/models/battle-ships/Destroyer_02.png',
  cf_destroyer_03: '/assets/space/models/battle-ships/Destroyer_03.png',
  cf_destroyer_04: '/assets/space/models/battle-ships/Destroyer_04.png',
  cf_destroyer_05: '/assets/space/models/battle-ships/Destroyer_05.png',
  // Voxel fleet
  voxel_ship_1: '/assets/space/models/voxel-fleet/Spaceship1.png',
  voxel_ship_2: '/assets/space/models/voxel-fleet/Spaceship2.png',
  voxel_ship_3: '/assets/space/models/voxel-fleet/Spaceship3.png',
  voxel_ship_4: '/assets/space/models/voxel-fleet/Spaceship4.png',
  voxel_ship_5: '/assets/space/models/voxel-fleet/Spaceship5.png',
  voxel_ship_6: '/assets/space/models/voxel-fleet/Spaceship6.png',
  // Enemy ships (new-ships pack)
  enemy_fighter: '/assets/space/models/enemies/Enemies/Fighter/Fighter.png',
  enemy_cruiser: '/assets/space/models/enemies/Enemies/Enemy Cruiser.png',
  enemy_destroyer: '/assets/space/models/enemies/Enemies/Enemy destroyer.png',
  enemy_huge: '/assets/space/models/enemies/Enemies/EnemyHuge.png',
  enemy_mega_boss: '/assets/space/models/enemies/Enemies/EnemyHuge2.png',
  // Forge-prefab fleet (FBX models — use model path as preview since no separate PNG)
  fp_fighter_01: '/assets/space/models/new-ships/Ship_enemy_01_Hull.png',
  fp_fighter_02: '/assets/space/models/new-ships/Ship_enemy_02_Hull.png',
  fp_fighter_03: '/assets/space/models/new-ships/Ship_enemy_03_Hull.png',
  fp_cruiser_01: '/assets/space/models/new-ships/Ship_enemy_04_Hull.png',
  fp_cruiser_02: '/assets/space/models/new-ships/Ship_enemy_05_Hull.png',
  fp_frigate_01: '/assets/space/models/new-ships/Ship_enemy_06_Hull.png',
  fp_frigate_02: '/assets/space/models/new-ships/Ship_enemy_07_Hull.png',
  fp_destroyer_01: '/assets/space/models/new-ships/Ship_enemy_08_Hull.png',
  fp_destroyer_02: '/assets/space/models/new-ships/Ship_enemy_09_Hull.png',
  fp_capital_01: '/assets/space/models/new-ships/Ship_enemy_10_Hull.png',
  fp_heavy_dark: '/assets/space/models/new-ships/Ship_enemy_11_Hull.png',
  fp_heavy_light: '/assets/space/models/new-ships/Ship_enemy_12_Hull.png',
  // Faction hero ships
  hero_wisdom_oracle: '/assets/space/models/new-ships/Ship_enemy_04_Hull.png',
  hero_construct_titan: '/assets/space/models/new-ships/Ship_Boos_01_Hull.png',
  hero_void_wraith: '/assets/space/models/new-ships/Ship_enemy_06_Hull.png',
  hero_legion_warlord: '/assets/space/models/new-ships/Ship_enemy_10_Hull.png',
  // Stations
  station: '/assets/space/models/stations/Station/Station.png',
  energy_ship: '/assets/space/models/stations/EnergyShip/EnergyShip.png',
  minador: '/assets/space/models/stations/Minador/Minador.png',
};

// ── Ability icons — scifi-gui/skills premium cyberpunk painted art ─────────
const SK = '/assets/space/ui/scifi-gui/skills';
export const ABILITY_IMG: Record<string, string> = {
  barrel_roll: `${SK}/3.png`, // green plasma vortex — evasive roll
  speed_boost: `${SK}/2.png`, // red laser beam — afterburner thrust
  cloak: `${SK}/4.png`, // VR visor stealth figure — cloaking
  iron_dome: `${SK}/13.png`, // glowing brain dome — psi shield
  warp: `${SK}/10.png`, // cybernetic head with cables — warp jump
  emp: `${SK}/5.png`, // cyborg circuit eye — EMP disruption
  boarding: `${SK}/6.png`, // shadow army figures — boarding assault
  repair: `${SK}/7.png`, // hand holding gear — repair
  ram: `${SK}/8.png`, // golden energy blade — ram charge
  launch_fighters: `${SK}/1.png`, // dual pistols firing — launch fighters
  // Hacking abilities — use remaining skill art + cyber GUI icons
  hack_weapons: `${SK}/11.png`, // cyber skull — disable weapons
  hack_shields: `${SK}/12.png`, // digital brain — drop shields
  hack_siphon: `${SK}/9.png`, // implant circuit — siphon resources
  hack_sensors: `${SK}/11.png`, // cyber skull variant — blind sensors
  hack_sabotage: `${SK}/12.png`, // digital brain variant — sabotage systems
  hack_hijack: `${SK}/9.png`, // implant circuit variant — hijack control
};
// Fallback for ability art (skill-icon packs — same quality, different style)
export const ABILITY_IMG_FALLBACK: Record<string, string> = {
  barrel_roll: '/assets/space/ui/skill-icons-1/PNG/3.png',
  speed_boost: '/assets/space/ui/skill-icons-1/PNG/7.png',
  cloak: '/assets/space/ui/skill-icons-2/PNG/5.png',
  iron_dome: '/assets/space/ui/skill-icons-1/PNG/9.png',
  warp: '/assets/space/ui/skill-icons-2/PNG/3.png',
  emp: '/assets/space/ui/skill-icons-1/PNG/5.png',
  boarding: '/assets/space/ui/skill-icons-2/PNG/1.png',
  repair: '/assets/space/ui/skill-icons-1/PNG/11.png',
  ram: '/assets/space/ui/skill-icons-1/PNG/13.png',
  launch_fighters: '/assets/space/ui/skill-icons-1/PNG/15.png',
};

export const ABILITY_ICONS: Record<string, React.ReactNode> = {
  barrel_roll: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
      <path d="M10 16 C10 10, 22 10, 22 16 C22 22, 10 22, 10 16" stroke="#4df" strokeWidth="2" fill="none" />
      <path d="M14 12L18 16L14 20" stroke="#4df" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  speed_boost: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="16,4 28,28 16,22 4,28" fill="#f80" opacity="0.3" />
      <polygon points="16,4 28,28 16,22 4,28" stroke="#fa0" strokeWidth="1.5" fill="none" />
      <line x1="10" y1="18" x2="6" y2="24" stroke="#f60" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="22" x2="16" y2="30" stroke="#f60" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="18" x2="26" y2="24" stroke="#f60" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  cloak: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="10" stroke="#88f" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
      <circle cx="16" cy="16" r="6" stroke="#aaf" strokeWidth="1.5" strokeDasharray="2 2" />
      <path d="M12 20 Q16 10, 20 20" stroke="#ccf" strokeWidth="2" fill="none" opacity="0.7" />
      <circle cx="16" cy="14" r="2" fill="#ccf" opacity="0.4" />
    </svg>
  ),
  iron_dome: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 24 Q16 2, 26 24" stroke="#4ff" strokeWidth="2" fill="none" />
      <path d="M8 22 Q16 6, 24 22" stroke="#4ff" strokeWidth="1" fill="none" opacity="0.5" />
      <line x1="16" y1="8" x2="16" y2="24" stroke="#4ff" strokeWidth="1" opacity="0.3" />
      <circle cx="16" cy="24" r="3" fill="#0aa" opacity="0.4" />
      <circle cx="10" cy="14" r="1.5" fill="#f44" />
      <line x1="10" y1="14" x2="14" y2="18" stroke="#f44" strokeWidth="1" />
    </svg>
  ),
  warp: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="16" cy="16" rx="14" ry="6" stroke="#a4f" strokeWidth="1.5" opacity="0.6" />
      <ellipse cx="16" cy="16" rx="10" ry="4" stroke="#c6f" strokeWidth="2" />
      <circle cx="16" cy="16" r="3" fill="#e8f" opacity="0.6" />
      <line x1="16" y1="2" x2="16" y2="10" stroke="#a4f" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="22" x2="16" y2="30" stroke="#a4f" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  emp: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" stroke="#ff4" strokeWidth="1" opacity="0.4" />
      <circle cx="16" cy="16" r="7" stroke="#ff4" strokeWidth="2" />
      <path d="M14 10 L18 16 L13 16 L17 22" stroke="#ff0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  boarding: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="12" width="8" height="8" rx="1" stroke="#f84" strokeWidth="1.5" />
      <rect x="18" y="12" width="8" height="8" rx="1" stroke="#4f8" strokeWidth="1.5" />
      <path d="M14 16 L18 16" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 13 L18 16 L16 19" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  repair: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="13" y="6" width="6" height="20" rx="1" fill="#4f4" opacity="0.3" />
      <rect x="6" y="13" width="20" height="6" rx="1" fill="#4f4" opacity="0.3" />
      <rect x="13" y="6" width="6" height="20" rx="1" stroke="#4f4" strokeWidth="1.5" />
      <rect x="6" y="13" width="20" height="6" rx="1" stroke="#4f4" strokeWidth="1.5" />
    </svg>
  ),
  ram: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="16,4 26,20 20,20 22,28 10,28 12,20 6,20" fill="#f40" opacity="0.3" />
      <polygon points="16,4 26,20 20,20 22,28 10,28 12,20 6,20" stroke="#f60" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="3" fill="#f80" />
    </svg>
  ),
  launch_fighters: (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="14" width="12" height="6" rx="1" stroke="#88f" strokeWidth="1.5" />
      <polygon points="8,8 12,12 4,12" fill="#4df" />
      <polygon points="24,8 28,12 20,12" fill="#4df" />
      <polygon points="16,4 20,10 12,10" fill="#4df" />
      <line x1="8" y1="10" x2="8" y2="6" stroke="#4df" strokeWidth="1" strokeDasharray="2 1" />
      <line x1="24" y1="10" x2="24" y2="6" stroke="#4df" strokeWidth="1" strokeDasharray="2 1" />
    </svg>
  ),
};

// ── Inline SVG helper ─────────────────────────────────────────────
export const Svg = ({ children, size = 16, color = 'currentColor' }: { children: React.ReactNode; size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" style={{ width: size, height: size, color, display: 'inline-block', verticalAlign: 'middle' }}>
    {children}
  </svg>
);

// CLASS_ICONS removed — unused SVGs

// ── Attack Type Icons (space-icons pack — ships & weapons) ──────
export const ATTACK_IMG: Record<string, string> = {
  laser: '/assets/space/ui/space-icons/PNG/1.png', // ship/laser
  missile: '/assets/space/ui/space-icons/PNG/3.png', // missile
  railgun: '/assets/space/ui/space-icons/PNG/7.png', // heavy weapon
  pulse: '/assets/space/ui/space-icons/PNG/9.png', // energy pulse
  torpedo: '/assets/space/ui/space-icons/PNG/5.png', // torpedo/rocket
};
export const ATTACK_ICONS: Record<string, React.ReactNode> = {
  laser: <img src={ATTACK_IMG.laser} alt="laser" style={{ width: 16, height: 16, imageRendering: 'auto' }} />,
  missile: <img src={ATTACK_IMG.missile} alt="missile" style={{ width: 16, height: 16, imageRendering: 'auto' }} />,
  railgun: <img src={ATTACK_IMG.railgun} alt="railgun" style={{ width: 16, height: 16, imageRendering: 'auto' }} />,
  pulse: <img src={ATTACK_IMG.pulse} alt="pulse" style={{ width: 16, height: 16, imageRendering: 'auto' }} />,
  torpedo: <img src={ATTACK_IMG.torpedo} alt="torpedo" style={{ width: 16, height: 16, imageRendering: 'auto' }} />,
};
// ── Resource Icons (PNG from resource-icons pack) ─────────────
const RI = '/assets/space/ui/resource-icons';

/** 40 pixel-art resource item icons (32×32 each) */
export const RESOURCE_ITEM_ICONS = {
  credits: `${RI}/Icon39_36.png`, // star trophy — gold credits
  energy: `${RI}/Icon39_16.png`, // circuit chip — energy
  minerals: `${RI}/Icon39_09.png`, // green crystal — minerals
  supply: `${RI}/Icon39_22.png`, // data board — supply cap
  attack: `${RI}/Icon39_10.png`, // red sword — attack
  armor: `${RI}/Icon39_05.png`, // silver ingot — armor
  speed: `${RI}/Icon39_15.png`, // energy rod — speed
  health: `${RI}/Icon39_13.png`, // green gem — health
  shield: `${RI}/Icon39_02.png`, // blue datapad — shield
  build: `${RI}/Icon39_11.png`, // pickaxe — build time
  tech: `${RI}/Icon39_35.png`, // grid panel — tech
  bomb: `${RI}/Icon39_38.png`, // furnace — bomb/explosion
};

export const ResIcon = ({ src, fallback }: { src: string; fallback: React.ReactNode }) => {
  const [err, setErr] = React.useState(false);
  if (err && fallback) return <>{fallback}</>;
  return (
    <img
      src={src}
      alt=""
      style={{ width: 18, height: 18, imageRendering: 'pixelated', verticalAlign: 'middle' }}
      onError={() => setErr(true)}
    />
  );
};

// Use resource-icon PNGs with mining-icon fallbacks
export const RES_ICONS = {
  credits: (
    <ResIcon
      src={RESOURCE_ITEM_ICONS.credits}
      fallback={
        <ResIcon
          src="/assets/space/ui/mining-icons/PNG/without background/15.png"
          fallback={
            <Svg size={14} color="#fc4">
              <circle cx="12" cy="12" r="9" stroke="#fc4" strokeWidth="1.5" fill="none" />
            </Svg>
          }
        />
      }
    />
  ),
  energy: (
    <ResIcon
      src={RESOURCE_ITEM_ICONS.energy}
      fallback={
        <ResIcon
          src="/assets/space/ui/mining-icons/PNG/without background/10.png"
          fallback={
            <Svg size={14} color="#4df">
              <path d="M13 2L6 14H12L11 22L18 10H12Z" stroke="#4df" strokeWidth="1.5" fill="#4df" fillOpacity=".2" />
            </Svg>
          }
        />
      }
    />
  ),
  minerals: (
    <ResIcon
      src={RESOURCE_ITEM_ICONS.minerals}
      fallback={
        <ResIcon
          src="/assets/space/ui/mining-icons/PNG/without background/20.png"
          fallback={
            <Svg size={14} color="#4f8">
              <path d="M12 3L20 9L16 21H8L4 9Z" stroke="#4f8" strokeWidth="1.5" fill="#4f8" fillOpacity=".15" />
            </Svg>
          }
        />
      }
    />
  ),
};

// ── Stat line SVG Icons ───────────────────────────────────────────
export const STAT_ICONS = {
  armor: (
    <Svg size={11} color="#8ac">
      <path d="M12 3C12 3 4 6 4 12C4 18 12 21 12 21C12 21 20 18 20 12C20 6 12 3 12 3Z" stroke="#8ac" strokeWidth="1.5" fill="none" />
    </Svg>
  ),
  speed: (
    <Svg size={11} color="#8ac">
      <path d="M5 17L10 12L5 7" stroke="#8ac" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 17L16 12L11 7" stroke="#8ac" strokeWidth="1.5" strokeLinecap="round" opacity=".5" />
    </Svg>
  ),
  range: (
    <Svg size={11} color="#8ac">
      <circle cx="12" cy="12" r="8" stroke="#8ac" strokeWidth="1" fill="none" />
      <circle cx="12" cy="12" r="4" stroke="#8ac" strokeWidth="1" fill="none" />
      <circle cx="12" cy="12" r="1.5" fill="#8ac" />
    </Svg>
  ),
  cooldown: (
    <Svg size={11} color="#8ac">
      <circle cx="12" cy="12" r="9" stroke="#8ac" strokeWidth="1.5" fill="none" />
      <path d="M12 6V12L16 14" stroke="#8ac" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  ),
  energyCost: (
    <Svg size={10} color="#4df">
      <path d="M13 2L6 14H12L11 22L18 10H12Z" stroke="#4df" strokeWidth="1.5" fill="#4df" fillOpacity=".3" />
    </Svg>
  ),
};

// ── Ship class abbreviations & tier colors ────────────────────────
export const CLASS_ABBR: Record<string, string> = {
  scout: 'SCT',
  fighter: 'FTR',
  interceptor: 'INT',
  heavy_fighter: 'HVY',
  bomber: 'BMR',
  stealth: 'STL',
  transport: 'TRP',
  assault_frigate: 'AFG',
  corvette: 'CRV',
  frigate: 'FRG',
  light_cruiser: 'LCR',
  destroyer: 'DST',
  cruiser: 'CRS',
  battleship: 'BSH',
  carrier: 'CAR',
  worker: 'WRK',
  dreadnought: 'DRN',
};
export const TIER_COLORS: Record<number, string> = {
  1: '#44cc88',
  2: '#4488ff',
  3: '#aa44ff',
  4: '#ff8822',
  5: '#ffcc00',
};
// ── UI frame assets (complete standalone images, not 9-slice fragments) ───
const H = '/assets/space/ui/hud';
const G_SLICED = '/assets/space/ui/scifi-gui/sliced';
export const GUI_FRAMES = {
  // Complete metallic octagonal frames (panel-sq is a full frame, works with objectFit:fill)
  portraitFrame: `${G_SLICED}/panel-sq.png`,
  portraitFrameGold: `${G_SLICED}/panel-sq-gold.png`,
  portraitFramePurple: `${G_SLICED}/panel-sq-purple.png`,
  // HUD pack assets — these are complete standalone backgrounds
  inventorySlot: `${H}/InventorySlot.png`,
  shipInfoCard: `${H}/SmallitemBox.png`,
  boxMenu: `${H}/BoxMenu.png`,
  shopBox: `${H}/Shop_Box.png`,
  boxItem: `${H}/Box_Item.png`,
  settingSmallBox: `${H}/BgSettingSmallBox.png`,
  hudBar: `${H}/BgHudBar.png`,
  titleBox: `${H}/TitleBox.png`,
  healthBarTrack: `${H}/HealthBar_Line.png`,
  healthBarFill: `${H}/HealthBar.png`,
  crystalBar: `${H}/CrystalBarHUD.png`,
  closeBtn: `${H}/CloseBtn.png`,
  hudIconBg: `${H}/Bg_Hud-Icon.png`,
  // Legacy aliases for existing code
  slotLg: `${G_SLICED}/panel-sq.png`,
  slotMd: `${H}/InventorySlot.png`,
  titleChevronGold: `${G_SLICED}/panel-sq-gold.png`,
};
// ── Upgrade icons — scifi-gui/skills premium painted art ───────────────
export const UPGRADE_HUD_ICONS: Record<string, string> = {
  attack: `${SK}/1.png`, // dual pistols firing — attack power
  armor: `${SK}/11.png`, // muscular arm flexing — armor strength
  speed: `${SK}/9.png`, // CPU circuit board — processing speed
  health: `${SK}/12.png`, // DNA helix — bio health
  shield: `${SK}/13.png`, // glowing brain — shield dome
};

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Project a game-world position to screen pixel coordinates for HTML overlays. */

export function worldToScreen(x: number, y: number, z: number, renderer: _SpaceRenderer): { x: number; y: number } | null {
  const WORLD_SCALE = 0.05;
  const cam = renderer.controls.cameraState;
  const yawRad = cam.rotation * (Math.PI / 180);
  const pitchRad = cam.angle * (Math.PI / 180);
  const lookX = cam.x * WORLD_SCALE,
    lookZ = cam.y * WORLD_SCALE;
  const camX = lookX + Math.sin(yawRad) * cam.zoom * Math.cos(pitchRad);
  const camY = cam.zoom * Math.sin(pitchRad);
  const camZ = lookZ + Math.cos(yawRad) * cam.zoom * Math.cos(pitchRad);
  // Cheap perspective project
  const dx = x * WORLD_SCALE - camX,
    dy = z * WORLD_SCALE - camY,
    dz = y * WORLD_SCALE - camZ;
  const cosY = Math.cos(-yawRad),
    sinY = Math.sin(-yawRad);
  const rz = dx * cosY - dz * sinY,
    rx = dx * sinY + dz * cosY;
  const cosP = Math.cos(-pitchRad + Math.PI / 2),
    sinP = Math.sin(-pitchRad + Math.PI / 2);
  const ry2 = dy * cosP - rz * sinP,
    rz2 = dy * sinP + rz * cosP;
  if (rz2 < 0.1) return null;
  const fov = 50 * (Math.PI / 180);
  const aspect = window.innerWidth / window.innerHeight;
  const scale = 1 / (Math.tan(fov / 2) * rz2);
  const sx = window.innerWidth * 0.5 + rx * scale * window.innerHeight * 0.5;
  const sy = window.innerHeight * 0.5 - ry2 * scale * window.innerHeight * 0.5;
  if (sx < -50 || sx > window.innerWidth + 50 || sy < -50 || sy > window.innerHeight + 50) return null;
  return { x: sx, y: sy };
}
