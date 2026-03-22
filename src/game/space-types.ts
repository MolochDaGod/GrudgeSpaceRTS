// ── Core Geometry ───────────────────────────────────────────────
export interface Vec2 { x: number; y: number; }
export interface Vec3 { x: number; y: number; z: number; }

// ── Game Mode ───────────────────────────────────────────────────
export type GameMode = '1v1' | '2v2' | 'ffa4';

// ── Teams & Factions ────────────────────────────────────────────
export type Team = 0 | 1 | 2 | 3 | 4; // 0=neutral, 1-4=players
export const TEAM_COLORS: Record<number, number> = {
  0: 0x44ff44, 1: 0x4488ff, 2: 0xff4444, 3: 0xffaa22, 4: 0xaa44ff,
};

// ── Ship Classification ─────────────────────────────────────────
export type ShipClass =
  | 'scout' | 'fighter' | 'interceptor' | 'heavy_fighter'
  | 'bomber' | 'stealth' | 'transport' | 'assault_frigate'
  | 'corvette' | 'frigate' | 'light_cruiser'
  | 'destroyer' | 'cruiser' | 'battleship' | 'carrier'
  | 'worker' | 'dreadnought';

export type ShipRole = 'combat' | 'support' | 'structure' | 'defense' | 'resource';

export interface ShipStats {
  maxHp: number;
  maxShield: number;
  shieldRegen: number;
  armor: number;
  speed: number;
  turnRate: number;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;
  attackType: 'laser' | 'missile' | 'railgun' | 'pulse' | 'torpedo';
  supplyCost: number;
  buildTime: number;
  creditCost: number;
  energyCost: number;
  mineralCost: number;
  tier: 1 | 2 | 3 | 4 | 5;
  abilities?: ShipAbility[];
}

export interface ShipAbility {
  id: string;
  name: string;
  key: string;         // Q, W, E, R
  cooldown: number;
  energyCost: number;
  type: 'barrel_roll' | 'speed_boost' | 'cloak' | 'iron_dome' | 'warp'
    | 'emp' | 'boarding' | 'repair' | 'ram' | 'launch_fighters';
  duration: number;
  radius?: number;
}

// ── Game Entity Base ────────────────────────────────────────────
export interface GameEntity {
  id: number;
  x: number; y: number; z: number;
  team: Team;
  hp: number;
  maxHp: number;
  dead: boolean;
}

// ── Space Ship ──────────────────────────────────────────────────
// ── Planet Types ────────────────────────────────────────────────
export type PlanetType = 'volcanic' | 'oceanic' | 'barren' | 'crystalline' | 'gas_giant' | 'frozen';
export type ResourceNodeKind = 'moon' | 'asteroid' | 'ice_rock' | 'crystal_deposit';

export interface PlanetTypeData {
  label: string;
  resourceMult: { credits: number; energy: number; minerals: number };
  upgradeDiscount: UpgradeType;  // 20% cost reduction
  techFocus: string;
  baseColor: number;
}

export const PLANET_TYPE_DATA: Record<PlanetType, PlanetTypeData> = {
  volcanic:    { label: 'Volcanic',    resourceMult: { credits: 0.8, energy: 0.9, minerals: 1.9 }, upgradeDiscount: 'attack',  techFocus: 'Weapons Tech',   baseColor: 0xcc4422 },
  oceanic:     { label: 'Oceanic',     resourceMult: { credits: 1.0, energy: 1.9, minerals: 0.7 }, upgradeDiscount: 'shield',  techFocus: 'Shield Tech',    baseColor: 0x2266cc },
  barren:      { label: 'Barren',      resourceMult: { credits: 1.2, energy: 0.8, minerals: 1.1 }, upgradeDiscount: 'speed',   techFocus: 'Propulsion Tech', baseColor: 0x886644 },
  crystalline: { label: 'Crystalline', resourceMult: { credits: 1.9, energy: 1.0, minerals: 0.8 }, upgradeDiscount: 'armor',   techFocus: 'Hull Tech',      baseColor: 0x44aacc },
  gas_giant:   { label: 'Gas Giant',   resourceMult: { credits: 1.0, energy: 2.2, minerals: 0.9 }, upgradeDiscount: 'health',  techFocus: 'Bio Tech',       baseColor: 0xcc8822 },
  frozen:      { label: 'Frozen',      resourceMult: { credits: 1.4, energy: 0.6, minerals: 1.4 }, upgradeDiscount: 'shield',  techFocus: 'Cryo Tech',      baseColor: 0x88aacc },
};

// ── Resource Node ────────────────────────────────────────────────
export interface ResourceNode {
  id: number;
  parentPlanetId: number;
  x: number; y: number; z: number;
  orbitAngle: number;
  orbitRadius: number;          // game units from planet center
  orbitSpeed: number;           // radians/sec
  kind: ResourceNodeKind;
  radius: number;               // visual/collision radius in game units
  yield: { credits: number; energy: number; minerals: number };
  harvestCooldown: number;      // current cooldown
  maxHarvestCooldown: number;   // seconds between harvests
}

export interface SpaceShip extends GameEntity {
  shipType: string;       // prefab key
  shipClass: ShipClass;
  shield: number;
  maxShield: number;
  shieldRegen: number;
  armor: number;
  speed: number;
  turnRate: number;
  vx: number; vy: number; vz: number;
  facing: number;         // yaw in radians
  pitch: number;
  roll: number;
  targetId: number | null;
  moveTarget: Vec3 | null;
  attackMoveTarget: Vec3 | null;
  isAttackMoving: boolean;
  holdPosition: boolean;
  patrolPoints: Vec3[];
  patrolIndex: number;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;
  attackTimer: number;
  attackType: string;
  supplyCost: number;
  abilities: ShipAbilityState[];
  animState: ShipAnimState;
  animTimer: number;
  selected: boolean;
  controlGroup: number;    // 0=none, 1-9
  stationId: number | null; // which station built this
  orbitTarget: number | null; // planet id for orbital towers
  orbitRadius: number;
  orbitAngle: number;
  isDocked: boolean;
  damageLevel: number;     // 0-1, affects smoke/listing
  // Worker ship fields (undefined for non-workers)
  workerState?: 'idle' | 'traveling' | 'harvesting' | 'returning';
  workerNodeId?: number | null;
  workerCargo?: number;
  workerCargoType?: 'credits' | 'energy' | 'minerals';
  workerHarvestTimer?: number;
  // Rank / XP progression
  xp: number;
  rank: number;            // 0-5, each +5% to all stats
  // Tech effect flags (applied on spawn/research)
  burnDot?: boolean;
  empChance?: number;
  deathPhase?: boolean;
  deathPhaseActive?: boolean;
  roleTimer: number;            // role behavior tick timer
  lastTargetId?: number | null; // star splitter ambush tracking
  baseSpeed: number;            // original speed before ability boosts (for clean revert)
}

export type ShipAnimState =
  | 'idle' | 'moving' | 'attacking' | 'barrel_roll'
  | 'speed_boost' | 'warping' | 'docking' | 'launching'
  | 'death_spiral' | 'cloaked' | 'banking';

export interface ShipAbilityState {
  ability: ShipAbility;
  cooldownRemaining: number;
  active: boolean;
  activeTimer: number;
  autoCast: boolean;
}

// ── Space Station ───────────────────────────────────────────────
export interface SpaceStation extends GameEntity {
  planetId: number;
  buildQueue: BuildQueueItem[];
  maxBuildSlots: number;
  towerSlots: number;     // max 6
  towersBuilt: number;
  rallyPoint: Vec3 | null;
  supplyProvided: number;
  selected: boolean;
  // Per-station auto-production (like swarm game)
  autoProduceType: string | null;  // ship type key to auto-produce, null = manual only
  autoProduceTimer: number;        // countdown to next auto-spawn
  canBuildHeroes: boolean;         // only starting planet stations can build hero ships
}

export interface BuildQueueItem {
  shipType: string;
  buildTimeRemaining: number;
  totalBuildTime: number;
}

// ── Planet ───────────────────────────────────────────────────────
export interface Planet {
  id: number;
  x: number; y: number; z: number;
  radius: number;
  name: string;
  owner: Team;
  stationId: number | null;
  resourceYield: { credits: number; energy: number; minerals: number };
  color: number;
  hasAsteroidField: boolean;
  planetType: PlanetType;
  captureRadius: number;    // radius at which capture/orbit detection triggers
  // Capture mechanics
  captureTeam: Team;        // team attempting capture (0 = nobody)
  captureProgress: number;  // 0-100
  captureSpeed: number;     // per second per unit present
  neutralDefenders: number; // ships guarding neutral planet
  isStartingPlanet: boolean; // for player/AI starting zones
}

// ── Orbital Tower ───────────────────────────────────────────────
export interface OrbitalTower extends GameEntity {
  planetId: number;
  orbitAngle: number;
  orbitRadius: number;
  orbitSpeed: number;
  weaponType: 'laser' | 'missile' | 'railgun';
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;
  attackTimer: number;
  targetId: number | null;
  weaponLevel: number;    // 1-3
}

// ── Projectiles ─────────────────────────────────────────────────
export interface Projectile {
  id: number;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  team: Team;
  damage: number;
  type: 'laser' | 'missile' | 'railgun' | 'pulse' | 'torpedo' | 'fireball' | 'ice_lance';
  sourceId: number;
  targetId: number;
  speed: number;
  lifetime: number;
  maxLifetime: number;
  homing: boolean;
  homingStrength: number;
  trailColor: number;
}

// ── VFX ─────────────────────────────────────────────────────────
export type ExplosionType =
  | 'explosion-1-a' | 'explosion-1-b' | 'explosion-1-c' | 'explosion-1-d'
  | 'explosion-1-e' | 'explosion-1-f' | 'explosion-1-g' | 'explosion-b';

export type ExplosionScale = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'epic';

export const EXPLOSION_SCALE_VALUES: Record<ExplosionScale, number> = {
  tiny: 0.3, small: 0.6, medium: 1.0, large: 2.0, huge: 4.0, epic: 8.0,
};

export type ShootingFxType = 'bolt' | 'charged' | 'crossed' | 'pulse' | 'spark' | 'waveform';
export type HitFxType = 'hits-1' | 'hits-2' | 'hits-3' | 'hits-4' | 'hits-5' | 'hits-6';

export interface SpriteEffect {
  id: number;
  x: number; y: number; z: number;
  type: ExplosionType | ShootingFxType | HitFxType;
  scale: number;
  frame: number;
  totalFrames: number;
  frameTimer: number;
  frameDuration: number;
  done: boolean;
  rotation: number;
  color?: number;
}

export interface GLBEffect {
  id: number;
  x: number; y: number; z: number;
  type: string; // GLB model name
  scale: number;
  lifetime: number;
  maxLifetime: number;
  done: boolean;
  rotation: number;
  rotationSpeed: number;
}

// ── Resources ───────────────────────────────────────────────────
export interface PlayerResources {
  credits: number;
  energy: number;
  minerals: number;
  supply: number;
  maxSupply: number;
}

// ── Global Upgrades ─────────────────────────────────────────────
export type UpgradeType = 'attack' | 'armor' | 'speed' | 'health' | 'shield';
export interface UpgradeLevel {
  type: UpgradeType;
  level: number;      // 0-5
  maxLevel: number;
}

export const UPGRADE_COSTS: { credits: number; minerals: number; energy: number }[] = [
  { credits: 200, minerals: 100, energy: 50 },     // level 1
  { credits: 400, minerals: 200, energy: 100 },    // level 2
  { credits: 700, minerals: 350, energy: 175 },    // level 3
  { credits: 1100, minerals: 550, energy: 275 },   // level 4
  { credits: 1600, minerals: 800, energy: 400 },   // level 5
];

export const UPGRADE_BONUSES: Record<UpgradeType, number[]> = {
  attack:  [0, 0.10, 0.22, 0.36, 0.52, 0.70],  // % bonus
  armor:   [0, 1, 2, 4, 6, 9],                  // flat bonus
  speed:   [0, 0.08, 0.16, 0.25, 0.35, 0.45],  // % bonus
  health:  [0, 0.10, 0.22, 0.36, 0.52, 0.70],  // % bonus
  shield:  [0, 0.10, 0.22, 0.36, 0.52, 0.70],  // % bonus
};

export interface TeamUpgrades {
  attack: number;  // current level 0-5
  armor: number;
  speed: number;
  health: number;
  shield: number;
}

// ── Alerts ──────────────────────────────────────────────────────
export interface Alert {
  id: number;
  x: number; y: number; z: number;
  type: 'under_attack' | 'unit_lost' | 'build_complete' | 'conquest';
  time: number;
  message: string;
}

// ── AI Strategy ─────────────────────────────────────────────────
export type AIStrategy = 'rush' | 'turtle' | 'expand' | 'tech' | 'balanced';
export type AIThreatLevel = 'low' | 'medium' | 'high' | 'critical';

// ── Win Condition ───────────────────────────────────────────────
export type WinCondition = 'domination' | 'elimination';
// domination = control all non-neutral planets for 60s
// elimination = destroy all enemy ships and stations

// ── Complete Game State ─────────────────────────────────────────
export interface SpaceGameState {
  gameMode: GameMode;
  ships: Map<number, SpaceShip>;
  stations: Map<number, SpaceStation>;
  planets: Planet[];
  resourceNodes: Map<number, ResourceNode>;
  planetTurrets: Map<number, PlanetTurret>;
  techState: Map<number, TeamTechState>;
  voidCooldowns: Map<number, Map<string, number>>;
  activeVoidEffects: VoidEffect[];
  aiDifficulty: number;
  commanders: Map<number, Commander>;
  fleets: Map<string, Fleet>;
  tacticalOrders: TacticalOrder[];
  towers: Map<number, OrbitalTower>;
  projectiles: Map<number, Projectile>;
  spriteEffects: SpriteEffect[];
  glbEffects: GLBEffect[];
  alerts: Alert[];
  resources: Record<number, PlayerResources>;
  upgrades: Record<number, TeamUpgrades>;
  gameTime: number;
  nextId: number;
  selectedIds: Set<number>;
  controlGroups: Map<number, Set<number>>;
  gameOver: boolean;
  winner: Team | null;
  winCondition: WinCondition | null;
  dominationTimer: number;         // seconds holding all planets
  dominationTeam: Team | null;
  activePlayers: Team[];           // teams in this match
}

// ── Selection ───────────────────────────────────────────────────
export interface SelectionBox {
  active: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// ── Command Types ───────────────────────────────────────────────
export type CommandType = 'move' | 'attack_move' | 'attack' | 'stop' | 'hold'
  | 'patrol' | 'build' | 'rally' | 'ability' | 'dock' | 'orbit';

export interface Command {
  type: CommandType;
  targetPosition?: Vec3;
  targetId?: number;
  abilityIndex?: number;
  buildShipType?: string;
  queued?: boolean;
}

// ── Camera ──────────────────────────────────────────────────────
export interface CameraState {
  x: number; y: number; z: number;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  angle: number;       // tilt/pitch angle in degrees (55° default)
  rotation: number;    // yaw rotation in degrees (0 = north, Q/E to orbit)
  bookmarks: Vec3[];   // F1-F4
}

// ── Sprite Sheet Metadata ───────────────────────────────────────
export interface SpriteSheetDef {
  path: string;
  frameCount: number;
  frameDuration: number;    // seconds per frame
  cols: number;
  rows: number;
  frameWidth: number;
  frameHeight: number;
}

// ── Ship Type Definitions (used by prefabs) ─────────────────────
export const SHIP_DEFINITIONS: Record<string, { class: ShipClass; stats: ShipStats; displayName: string }> = {
  micro_recon: {
    class: 'scout', displayName: 'MicroRecon',
    stats: { maxHp: 30, maxShield: 10, shieldRegen: 0.5, armor: 0, speed: 90, turnRate: 4, attackDamage: 5, attackRange: 120, attackCooldown: 0.8, attackType: 'laser', supplyCost: 1, buildTime: 5, creditCost: 50, energyCost: 10, mineralCost: 25, tier: 1 },
  },
  red_fighter: {
    class: 'fighter', displayName: 'RedFighter',
    stats: { maxHp: 60, maxShield: 20, shieldRegen: 1, armor: 1, speed: 70, turnRate: 3.5, attackDamage: 12, attackRange: 150, attackCooldown: 1.0, attackType: 'laser', supplyCost: 2, buildTime: 8, creditCost: 100, energyCost: 20, mineralCost: 50, tier: 1 },
  },
  galactix_racer: {
    class: 'interceptor', displayName: 'GalactixRacer',
    stats: { maxHp: 45, maxShield: 15, shieldRegen: 1, armor: 0, speed: 100, turnRate: 5, attackDamage: 8, attackRange: 130, attackCooldown: 0.6, attackType: 'laser', supplyCost: 2, buildTime: 7, creditCost: 80, energyCost: 25, mineralCost: 40, tier: 1, abilities: [{ id: 'speed_boost', name: 'Afterburner', key: 'Q', cooldown: 12, energyCost: 15, type: 'speed_boost', duration: 3 }] },
  },
  dual_striker: {
    class: 'heavy_fighter', displayName: 'DualStriker',
    stats: { maxHp: 80, maxShield: 30, shieldRegen: 1.5, armor: 2, speed: 60, turnRate: 2.8, attackDamage: 20, attackRange: 160, attackCooldown: 1.2, attackType: 'pulse', supplyCost: 3, buildTime: 12, creditCost: 150, energyCost: 30, mineralCost: 75, tier: 2 },
  },
  camo_stellar_jet: {
    class: 'stealth', displayName: 'CamoStellarJet',
    stats: { maxHp: 50, maxShield: 25, shieldRegen: 1, armor: 1, speed: 80, turnRate: 3.5, attackDamage: 18, attackRange: 140, attackCooldown: 1.5, attackType: 'laser', supplyCost: 3, buildTime: 15, creditCost: 200, energyCost: 50, mineralCost: 60, tier: 2, abilities: [{ id: 'cloak', name: 'Cloaking Device', key: 'Q', cooldown: 20, energyCost: 30, type: 'cloak', duration: 8 }] },
  },
  meteor_slicer: {
    class: 'fighter', displayName: 'MeteorSlicer',
    stats: { maxHp: 70, maxShield: 20, shieldRegen: 1, armor: 3, speed: 75, turnRate: 3, attackDamage: 25, attackRange: 80, attackCooldown: 0.8, attackType: 'pulse', supplyCost: 3, buildTime: 10, creditCost: 130, energyCost: 20, mineralCost: 65, tier: 2, abilities: [{ id: 'ram', name: 'Meteor Ram', key: 'Q', cooldown: 15, energyCost: 20, type: 'ram', duration: 1 }] },
  },
  infrared_furtive: {
    class: 'stealth', displayName: 'InfraredFurtive',
    stats: { maxHp: 55, maxShield: 30, shieldRegen: 2, armor: 1, speed: 72, turnRate: 3.2, attackDamage: 14, attackRange: 170, attackCooldown: 1.3, attackType: 'laser', supplyCost: 3, buildTime: 14, creditCost: 180, energyCost: 45, mineralCost: 55, tier: 2, abilities: [{ id: 'emp', name: 'EMP Burst', key: 'Q', cooldown: 25, energyCost: 40, type: 'emp', duration: 3, radius: 120 }] },
  },
  pyramid_ship: {
    class: 'assault_frigate', displayName: 'PyramidShip',
    stats: { maxHp: 140, maxShield: 75, shieldRegen: 2.5, armor: 5, speed: 40, turnRate: 2.0, attackDamage: 30, attackRange: 185, attackCooldown: 2.2, attackType: 'pulse', supplyCost: 4, buildTime: 20, creditCost: 290, energyCost: 65, mineralCost: 110, tier: 3,
      abilities: [{ id: 'iron_dome', name: 'Pyramid Shield', key: 'Q', cooldown: 35, energyCost: 55, type: 'iron_dome', duration: 8, radius: 130 }] },
  },
  ultraviolet_intruder: {
    class: 'bomber', displayName: 'UltravioletIntruder',
    stats: { maxHp: 90, maxShield: 35, shieldRegen: 1, armor: 3, speed: 50, turnRate: 2, attackDamage: 40, attackRange: 130, attackCooldown: 2.5, attackType: 'torpedo', supplyCost: 4, buildTime: 18, creditCost: 250, energyCost: 50, mineralCost: 100, tier: 3 },
  },
  warship: {
    class: 'assault_frigate', displayName: 'Warship',
    stats: { maxHp: 150, maxShield: 60, shieldRegen: 2, armor: 5, speed: 40, turnRate: 1.8, attackDamage: 30, attackRange: 200, attackCooldown: 1.8, attackType: 'railgun', supplyCost: 5, buildTime: 20, creditCost: 300, energyCost: 60, mineralCost: 120, tier: 3, abilities: [{ id: 'iron_dome', name: 'Point Defense', key: 'Q', cooldown: 30, energyCost: 40, type: 'iron_dome', duration: 6, radius: 100 }] },
  },
  star_marine_trooper: {
    class: 'transport', displayName: 'StarMarineTrooper',
    stats: { maxHp: 120, maxShield: 40, shieldRegen: 1.5, armor: 4, speed: 45, turnRate: 2, attackDamage: 10, attackRange: 100, attackCooldown: 2.0, attackType: 'laser', supplyCost: 3, buildTime: 16, creditCost: 200, energyCost: 30, mineralCost: 80, tier: 3, abilities: [{ id: 'boarding', name: 'Board Enemy', key: 'Q', cooldown: 40, energyCost: 50, type: 'boarding', duration: 5 }] },
  },
  interstellar_runner: {
    class: 'transport', displayName: 'InterstellarRunner',
    stats: { maxHp: 100, maxShield: 30, shieldRegen: 1.5, armor: 2, speed: 65, turnRate: 2.5, attackDamage: 8, attackRange: 100, attackCooldown: 1.5, attackType: 'laser', supplyCost: 2, buildTime: 12, creditCost: 120, energyCost: 20, mineralCost: 60, tier: 2 },
  },
  transtellar: {
    class: 'transport', displayName: 'Transtellar',
    stats: { maxHp: 110, maxShield: 35, shieldRegen: 1.5, armor: 3, speed: 55, turnRate: 2.2, attackDamage: 10, attackRange: 110, attackCooldown: 1.8, attackType: 'laser', supplyCost: 3, buildTime: 14, creditCost: 160, energyCost: 25, mineralCost: 70, tier: 2 },
  },
  destroyer: {
    class: 'destroyer', displayName: 'Destroyer',
    stats: { maxHp: 250, maxShield: 100, shieldRegen: 3, armor: 6, speed: 35, turnRate: 1.5, attackDamage: 45, attackRange: 250, attackCooldown: 2.0, attackType: 'railgun', supplyCost: 6, buildTime: 30, creditCost: 500, energyCost: 100, mineralCost: 200, tier: 4, abilities: [{ id: 'barrel_roll', name: 'Evasive Roll', key: 'Q', cooldown: 15, energyCost: 25, type: 'barrel_roll', duration: 0.8 }] },
  },
  cruiser: {
    class: 'cruiser', displayName: 'Cruiser',
    stats: { maxHp: 400, maxShield: 150, shieldRegen: 4, armor: 8, speed: 28, turnRate: 1.2, attackDamage: 35, attackRange: 280, attackCooldown: 1.5, attackType: 'missile', supplyCost: 8, buildTime: 40, creditCost: 700, energyCost: 150, mineralCost: 300, tier: 4, abilities: [{ id: 'launch_fighters', name: 'Launch Fighters', key: 'Q', cooldown: 45, energyCost: 60, type: 'launch_fighters', duration: 0 }] },
  },
  bomber: {
    class: 'bomber', displayName: 'Bomber',
    stats: { maxHp: 200, maxShield: 60, shieldRegen: 2, armor: 5, speed: 32, turnRate: 1.5, attackDamage: 80, attackRange: 200, attackCooldown: 3.5, attackType: 'torpedo', supplyCost: 5, buildTime: 25, creditCost: 400, energyCost: 80, mineralCost: 150, tier: 4 },
  },
  battleship: {
    class: 'battleship', displayName: 'Battleship',
    stats: { maxHp: 800, maxShield: 300, shieldRegen: 5, armor: 12, speed: 18, turnRate: 0.8, attackDamage: 60, attackRange: 350, attackCooldown: 2.0, attackType: 'railgun', supplyCost: 12, buildTime: 60, creditCost: 1200, energyCost: 250, mineralCost: 500, tier: 5, abilities: [{ id: 'iron_dome', name: 'Fortress Shield', key: 'Q', cooldown: 45, energyCost: 80, type: 'iron_dome', duration: 10, radius: 150 }, { id: 'warp', name: 'Warp Jump', key: 'W', cooldown: 90, energyCost: 150, type: 'warp', duration: 2 }] },
  },
  mining_drone: {
    class: 'worker', displayName: 'Mining Drone',
    stats: { maxHp: 25, maxShield: 5, shieldRegen: 0.5, armor: 0, speed: 130, turnRate: 5,
      attackDamage: 0, attackRange: 0, attackCooldown: 999, attackType: 'laser',
      supplyCost: 1, buildTime: 8, creditCost: 55, energyCost: 15, mineralCost: 25, tier: 1 },
  },
  energy_skimmer: {
    class: 'worker', displayName: 'Energy Skimmer',
    stats: { maxHp: 20, maxShield: 8, shieldRegen: 1.0, armor: 0, speed: 150, turnRate: 5,
      attackDamage: 0, attackRange: 0, attackCooldown: 999, attackType: 'laser',
      supplyCost: 1, buildTime: 8, creditCost: 50, energyCost: 20, mineralCost: 20, tier: 1 },
  },
  // ── Corvettes (fast attack, T1-2) ─────────────────────────────────
  cf_corvette_01: { class:'corvette', displayName:'Corvette Mk.I',    stats:{ maxHp:55,  maxShield:20, shieldRegen:1.2, armor:1, speed:110, turnRate:4.5, attackDamage:14, attackRange:140, attackCooldown:0.9, attackType:'laser',   supplyCost:2, buildTime:9,  creditCost:120,  energyCost:30,  mineralCost:50,  tier:1 } },
  cf_corvette_02: { class:'corvette', displayName:'Corvette Mk.II',   stats:{ maxHp:65,  maxShield:25, shieldRegen:1.5, armor:2, speed:105, turnRate:4.2, attackDamage:18, attackRange:150, attackCooldown:1.0, attackType:'laser',   supplyCost:2, buildTime:11, creditCost:150,  energyCost:35,  mineralCost:60,  tier:2 } },
  cf_corvette_03: { class:'corvette', displayName:'Corvette Mk.III',  stats:{ maxHp:75,  maxShield:30, shieldRegen:1.5, armor:2, speed:100, turnRate:4.0, attackDamage:22, attackRange:155, attackCooldown:1.0, attackType:'pulse',  supplyCost:3, buildTime:13, creditCost:180,  energyCost:40,  mineralCost:70,  tier:2 } },
  cf_corvette_04: { class:'corvette', displayName:'Tide Corvette',    stats:{ maxHp:80,  maxShield:50, shieldRegen:3.0, armor:3, speed:95,  turnRate:4.0, attackDamage:20, attackRange:160, attackCooldown:1.1, attackType:'laser',   supplyCost:3, buildTime:14, creditCost:200,  energyCost:50,  mineralCost:80,  tier:2, abilities:[{id:'iron_dome',name:'Shield Ram',key:'Q',cooldown:20,energyCost:30,type:'iron_dome',duration:4,radius:80}] } },
  cf_corvette_05: { class:'corvette', displayName:'Phantom Corvette', stats:{ maxHp:60,  maxShield:30, shieldRegen:2.0, armor:1, speed:120, turnRate:5.0, attackDamage:28, attackRange:145, attackCooldown:0.8, attackType:'laser',   supplyCost:3, buildTime:14, creditCost:220,  energyCost:55,  mineralCost:75,  tier:2, abilities:[{id:'cloak',name:'Phase Cloak',key:'Q',cooldown:18,energyCost:25,type:'cloak',duration:8}] } },
  // ── Frigates (balanced, T2-3) ──────────────────────────────────
  cf_frigate_01:  { class:'frigate',   displayName:'Frigate Mk.I',    stats:{ maxHp:120, maxShield:45, shieldRegen:1.8, armor:4, speed:55,  turnRate:2.5, attackDamage:28, attackRange:200, attackCooldown:1.4, attackType:'missile', supplyCost:4, buildTime:18, creditCost:280,  energyCost:60,  mineralCost:110, tier:2 } },
  cf_frigate_02:  { class:'frigate',   displayName:'Frigate Mk.II',   stats:{ maxHp:135, maxShield:50, shieldRegen:2.0, armor:5, speed:52,  turnRate:2.3, attackDamage:34, attackRange:210, attackCooldown:1.5, attackType:'missile', supplyCost:4, buildTime:20, creditCost:320,  energyCost:70,  mineralCost:130, tier:3 } },
  cf_frigate_03:  { class:'frigate',   displayName:'Siege Frigate',   stats:{ maxHp:150, maxShield:55, shieldRegen:2.0, armor:6, speed:45,  turnRate:2.0, attackDamage:50, attackRange:280, attackCooldown:2.2, attackType:'railgun', supplyCost:5, buildTime:24, creditCost:380,  energyCost:80,  mineralCost:160, tier:3 } },
  cf_frigate_04:  { class:'frigate',   displayName:'Frigate Mk.IV',   stats:{ maxHp:140, maxShield:60, shieldRegen:2.2, armor:5, speed:50,  turnRate:2.2, attackDamage:38, attackRange:220, attackCooldown:1.6, attackType:'missile', supplyCost:5, buildTime:22, creditCost:350,  energyCost:75,  mineralCost:140, tier:3 } },
  cf_frigate_05:  { class:'frigate',   displayName:'Frigate Mk.V',    stats:{ maxHp:160, maxShield:65, shieldRegen:2.5, armor:6, speed:48,  turnRate:2.0, attackDamage:44, attackRange:230, attackCooldown:1.7, attackType:'torpedo', supplyCost:5, buildTime:25, creditCost:400,  energyCost:85,  mineralCost:155, tier:3 } },
  // ── Light Cruisers (heavy firepower, T3-4) ────────────────────────
  cf_light_cruiser_01: { class:'light_cruiser', displayName:'Prism Cruiser',   stats:{ maxHp:320, maxShield:130, shieldRegen:3.5, armor:8,  speed:32, turnRate:1.6, attackDamage:50, attackRange:300, attackCooldown:1.8, attackType:'laser',   supplyCost:7, buildTime:38, creditCost:620,  energyCost:130, mineralCost:270, tier:4 } },
  cf_light_cruiser_02: { class:'light_cruiser', displayName:'Leviathan',       stats:{ maxHp:380, maxShield:180, shieldRegen:5.0, armor:9,  speed:28, turnRate:1.4, attackDamage:45, attackRange:290, attackCooldown:1.7, attackType:'missile', supplyCost:8, buildTime:42, creditCost:700,  energyCost:150, mineralCost:310, tier:4, abilities:[{id:'iron_dome',name:'Aegis Dome',key:'Q',cooldown:40,energyCost:80,type:'iron_dome',duration:10,radius:160}] } },
  cf_light_cruiser_03: { class:'light_cruiser', displayName:'Cruiser Mk.III',  stats:{ maxHp:350, maxShield:140, shieldRegen:4.0, armor:9,  speed:30, turnRate:1.5, attackDamage:55, attackRange:310, attackCooldown:2.0, attackType:'railgun', supplyCost:7, buildTime:40, creditCost:660,  energyCost:140, mineralCost:290, tier:4 } },
  cf_light_cruiser_04: { class:'light_cruiser', displayName:'Forge Cruiser',   stats:{ maxHp:340, maxShield:120, shieldRegen:3.0, armor:11, speed:31, turnRate:1.5, attackDamage:72, attackRange:320, attackCooldown:1.6, attackType:'railgun', supplyCost:8, buildTime:44, creditCost:720,  energyCost:160, mineralCost:320, tier:4, abilities:[{id:'emp',name:'Forge Blast',key:'Q',cooldown:30,energyCost:90,type:'emp',duration:3,radius:200}] } },
  cf_light_cruiser_05: { class:'light_cruiser', displayName:'Cruiser Mk.V',    stats:{ maxHp:400, maxShield:150, shieldRegen:4.5, armor:10, speed:27, turnRate:1.3, attackDamage:58, attackRange:300, attackCooldown:1.9, attackType:'torpedo', supplyCost:8, buildTime:45, creditCost:740,  energyCost:165, mineralCost:330, tier:4 } },
  // ── Craft Destroyers (elite T4) ───────────────────────────────
  cf_destroyer_01: { class:'destroyer', displayName:'Destroyer Mk.I',    stats:{ maxHp:270, maxShield:110, shieldRegen:3.2, armor:7,  speed:38, turnRate:1.6, attackDamage:52, attackRange:260, attackCooldown:2.1, attackType:'railgun', supplyCost:6, buildTime:32, creditCost:520,  energyCost:110, mineralCost:210, tier:4 } },
  cf_destroyer_02: { class:'destroyer', displayName:'Destroyer Mk.II',   stats:{ maxHp:290, maxShield:120, shieldRegen:3.5, armor:7,  speed:36, turnRate:1.5, attackDamage:58, attackRange:270, attackCooldown:2.2, attackType:'railgun', supplyCost:7, buildTime:35, creditCost:560,  energyCost:120, mineralCost:230, tier:4 } },
  cf_destroyer_03: { class:'destroyer', displayName:'Storm Destroyer',   stats:{ maxHp:260, maxShield:105, shieldRegen:3.0, armor:6,  speed:45, turnRate:2.0, attackDamage:55, attackRange:265, attackCooldown:1.8, attackType:'pulse',  supplyCost:6, buildTime:33, creditCost:540,  energyCost:115, mineralCost:215, tier:4, abilities:[{id:'emp',name:'Ion Surge',key:'Q',cooldown:22,energyCost:50,type:'emp',duration:3,radius:160}] } },
  cf_destroyer_04: { class:'destroyer', displayName:'Destroyer Mk.IV',   stats:{ maxHp:310, maxShield:130, shieldRegen:3.8, armor:8,  speed:34, turnRate:1.4, attackDamage:62, attackRange:275, attackCooldown:2.3, attackType:'railgun', supplyCost:7, buildTime:36, creditCost:580,  energyCost:125, mineralCost:240, tier:4 } },
  cf_destroyer_05: { class:'destroyer', displayName:'Tempest Destroyer', stats:{ maxHp:300, maxShield:125, shieldRegen:4.0, armor:7,  speed:42, turnRate:1.8, attackDamage:60, attackRange:270, attackCooldown:2.0, attackType:'pulse',  supplyCost:7, buildTime:35, creditCost:570,  energyCost:130, mineralCost:235, tier:4, abilities:[{id:'speed_boost',name:'Storm Drive',key:'Q',cooldown:15,energyCost:35,type:'speed_boost',duration:5},{id:'emp',name:'Tempest EMP',key:'W',cooldown:30,energyCost:70,type:'emp',duration:4,radius:180}] } },
  // ── Pirate Ships (neutral roamers, not buildable) ─────────────────
  pirate_01: { class: 'corvette',       displayName: 'Pirate Raider',      stats: { maxHp: 80,  maxShield: 25, shieldRegen: 1.5, armor: 2, speed: 85,  turnRate: 3.5, attackDamage: 18, attackRange: 160, attackCooldown: 1.0, attackType: 'laser',   supplyCost: 0, buildTime: 0, creditCost: 0, energyCost: 0, mineralCost: 0, tier: 2 } },
  pirate_02: { class: 'fighter',        displayName: 'Pirate Interceptor',  stats: { maxHp: 55,  maxShield: 15, shieldRegen: 1.0, armor: 1, speed: 100, turnRate: 4.0, attackDamage: 14, attackRange: 140, attackCooldown: 0.8, attackType: 'laser',   supplyCost: 0, buildTime: 0, creditCost: 0, energyCost: 0, mineralCost: 0, tier: 1 } },
  pirate_03: { class: 'heavy_fighter',  displayName: 'Pirate Marauder',     stats: { maxHp: 100, maxShield: 35, shieldRegen: 2.0, armor: 3, speed: 70,  turnRate: 3.0, attackDamage: 24, attackRange: 170, attackCooldown: 1.2, attackType: 'pulse',   supplyCost: 0, buildTime: 0, creditCost: 0, energyCost: 0, mineralCost: 0, tier: 2 } },
  pirate_04: { class: 'frigate',        displayName: 'Pirate Brigantine',   stats: { maxHp: 150, maxShield: 50, shieldRegen: 2.5, armor: 5, speed: 50,  turnRate: 2.2, attackDamage: 32, attackRange: 200, attackCooldown: 1.5, attackType: 'missile', supplyCost: 0, buildTime: 0, creditCost: 0, energyCost: 0, mineralCost: 0, tier: 3 } },
  pirate_05: { class: 'stealth',        displayName: 'Pirate Phantom',      stats: { maxHp: 60,  maxShield: 30, shieldRegen: 2.0, armor: 1, speed: 95,  turnRate: 4.0, attackDamage: 20, attackRange: 150, attackCooldown: 0.9, attackType: 'laser',   supplyCost: 0, buildTime: 0, creditCost: 0, energyCost: 0, mineralCost: 0, tier: 2, abilities: [{ id: 'cloak', name: 'Ghost Shroud', key: 'Q', cooldown: 18, energyCost: 0, type: 'cloak', duration: 6 }] } },
  pirate_06: { class: 'bomber',         displayName: 'Pirate Bombard',      stats: { maxHp: 120, maxShield: 20, shieldRegen: 1.0, armor: 4, speed: 45,  turnRate: 2.0, attackDamage: 50, attackRange: 180, attackCooldown: 2.5, attackType: 'torpedo', supplyCost: 0, buildTime: 0, creditCost: 0, energyCost: 0, mineralCost: 0, tier: 3 } },
  // ── Boss Captains (neutral planet leaders, not buildable) ─────────
  boss_captain_01: { class: 'cruiser',     displayName: 'Skull Dreadlord',    stats: { maxHp: 500, maxShield: 200, shieldRegen: 5, armor: 10, speed: 22, turnRate: 1.0, attackDamage: 55, attackRange: 280, attackCooldown: 1.6, attackType: 'railgun', supplyCost: 0, buildTime: 0, creditCost: 0, energyCost: 0, mineralCost: 0, tier: 4,
    abilities: [{ id: 'iron_dome', name: 'Dread Shield', key: 'Q', cooldown: 25, energyCost: 0, type: 'iron_dome', duration: 8, radius: 160 }] } },
  boss_captain_02: { class: 'battleship',  displayName: 'Corsair Warlord',    stats: { maxHp: 700, maxShield: 300, shieldRegen: 7, armor: 14, speed: 18, turnRate: 0.8, attackDamage: 70, attackRange: 320, attackCooldown: 1.8, attackType: 'missile', supplyCost: 0, buildTime: 0, creditCost: 0, energyCost: 0, mineralCost: 0, tier: 5,
    abilities: [{ id: 'launch_fighters', name: 'Corsair Swarm', key: 'Q', cooldown: 30, energyCost: 0, type: 'launch_fighters', duration: 0 }, { id: 'emp', name: 'Broadside', key: 'W', cooldown: 35, energyCost: 0, type: 'emp', duration: 3, radius: 200 }] } },
  boss_captain_03: { class: 'cruiser',     displayName: 'Claw Overlord',      stats: { maxHp: 600, maxShield: 250, shieldRegen: 6, armor: 12, speed: 20, turnRate: 0.9, attackDamage: 60, attackRange: 300, attackCooldown: 1.4, attackType: 'pulse',   supplyCost: 0, buildTime: 0, creditCost: 0, energyCost: 0, mineralCost: 0, tier: 4,
    abilities: [{ id: 'ram', name: 'Claw Charge', key: 'Q', cooldown: 20, energyCost: 0, type: 'ram', duration: 1.5 }, { id: 'iron_dome', name: 'Claw Guard', key: 'W', cooldown: 30, energyCost: 0, type: 'iron_dome', duration: 10, radius: 180 }] } },
  // ── Boss / Dreadnoughts (tech-locked, T5) ─────────────────────
  boss_ship_01: {
    class: 'dreadnought', displayName: 'Command Dreadnought',
    stats: { maxHp:1600, maxShield:700, shieldRegen:10, armor:20, speed:18, turnRate:0.5, attackDamage:120, attackRange:450, attackCooldown:1.6, attackType:'railgun', supplyCost:25, buildTime:100, creditCost:2400, energyCost:500, mineralCost:1000, tier:5,
      abilities:[
        {id:'iron_dome',name:'Command Shield',key:'Q',cooldown:35,energyCost:120,type:'iron_dome',duration:14,radius:220},
        {id:'launch_fighters',name:'Deploy Wing',key:'W',cooldown:30,energyCost:80,type:'launch_fighters',duration:0},
        {id:'warp',name:'Command Warp',key:'E',cooldown:60,energyCost:180,type:'warp',duration:2},
      ]},
  },
  boss_ship_02: {
    class: 'dreadnought', displayName: 'Apex Dreadnought',
    stats: { maxHp:2400, maxShield:1000, shieldRegen:15, armor:25, speed:12, turnRate:0.4, attackDamage:180, attackRange:500, attackCooldown:1.4, attackType:'railgun', supplyCost:30, buildTime:120, creditCost:3200, energyCost:700, mineralCost:1400, tier:5,
      abilities:[
        {id:'iron_dome',name:'Apex Shield',key:'Q',cooldown:30,energyCost:150,type:'iron_dome',duration:16,radius:260},
        {id:'emp',name:'Annihilator',key:'W',cooldown:40,energyCost:200,type:'emp',duration:5,radius:350},
        {id:'warp',name:'Phase Strike',key:'E',cooldown:45,energyCost:200,type:'warp',duration:2},
        {id:'launch_fighters',name:'Carrier Launch',key:'R',cooldown:25,energyCost:100,type:'launch_fighters',duration:0},
      ]},
  },
};

// ── Hero Class Ships (unique powerful units) ────────────────────
export const HERO_DEFINITIONS: Record<string, { class: ShipClass; stats: ShipStats; displayName: string; lore: string }> = {
  vanguard_prime: {
    class: 'battleship', displayName: 'Vanguard Prime',
    lore: 'Legendary flagship that turns the tide of any battle. Equipped with dual fortress shields and a devastating nova cannon.',
    stats: { maxHp: 1200, maxShield: 500, shieldRegen: 8, armor: 15, speed: 22, turnRate: 0.6, attackDamage: 100, attackRange: 400, attackCooldown: 1.8, attackType: 'railgun', supplyCost: 20, buildTime: 90, creditCost: 2000, energyCost: 400, mineralCost: 800, tier: 5,
      abilities: [
        { id: 'iron_dome', name: 'Nova Shield', key: 'Q', cooldown: 30, energyCost: 100, type: 'iron_dome', duration: 12, radius: 200 },
        { id: 'warp', name: 'Hyperspace Jump', key: 'W', cooldown: 60, energyCost: 200, type: 'warp', duration: 2 },
        { id: 'emp', name: 'Nova Cannon', key: 'E', cooldown: 45, energyCost: 150, type: 'emp', duration: 4, radius: 250 },
      ] },
  },
  shadow_reaper: {
    class: 'stealth', displayName: 'Shadow Reaper',
    lore: 'An assassin-class vessel that slips through defenses unseen. Cloaks indefinitely and strikes with lethal precision.',
    stats: { maxHp: 200, maxShield: 100, shieldRegen: 4, armor: 5, speed: 110, turnRate: 4, attackDamage: 80, attackRange: 180, attackCooldown: 1.0, attackType: 'laser', supplyCost: 12, buildTime: 60, creditCost: 1500, energyCost: 350, mineralCost: 500, tier: 5,
      abilities: [
        { id: 'cloak', name: 'Phantom Cloak', key: 'Q', cooldown: 15, energyCost: 50, type: 'cloak', duration: 12 },
        { id: 'speed_boost', name: 'Shadow Dash', key: 'W', cooldown: 10, energyCost: 30, type: 'speed_boost', duration: 4 },
        { id: 'ram', name: 'Reaper Strike', key: 'E', cooldown: 20, energyCost: 60, type: 'ram', duration: 1.5 },
      ] },
  },
  iron_bastion: {
    class: 'cruiser', displayName: 'Iron Bastion',
    lore: 'Mobile fortress that anchors the fleet. Launches fighter swarms and projects an impenetrable defense grid.',
    stats: { maxHp: 800, maxShield: 400, shieldRegen: 6, armor: 18, speed: 15, turnRate: 0.5, attackDamage: 40, attackRange: 300, attackCooldown: 1.5, attackType: 'missile', supplyCost: 18, buildTime: 80, creditCost: 1800, energyCost: 380, mineralCost: 700, tier: 5,
      abilities: [
        { id: 'launch_fighters', name: 'Swarm Launch', key: 'Q', cooldown: 30, energyCost: 80, type: 'launch_fighters', duration: 0 },
        { id: 'iron_dome', name: 'Aegis Grid', key: 'W', cooldown: 40, energyCost: 120, type: 'iron_dome', duration: 15, radius: 180 },
        { id: 'repair', name: 'Fleet Repair', key: 'E', cooldown: 50, energyCost: 100, type: 'repair', duration: 8, radius: 200 },
      ] },
  },
  storm_herald: {
    class: 'destroyer', displayName: 'Storm Herald',
    lore: 'Lightning-fast strike destroyer that unleashes electromagnetic devastation. Chains EMP across enemy formations.',
    stats: { maxHp: 400, maxShield: 200, shieldRegen: 5, armor: 8, speed: 50, turnRate: 2, attackDamage: 65, attackRange: 280, attackCooldown: 1.2, attackType: 'pulse', supplyCost: 14, buildTime: 70, creditCost: 1600, energyCost: 350, mineralCost: 600, tier: 5,
      abilities: [
        { id: 'emp', name: 'Chain Lightning', key: 'Q', cooldown: 20, energyCost: 80, type: 'emp', duration: 3, radius: 180 },
        { id: 'barrel_roll', name: 'Storm Roll', key: 'W', cooldown: 12, energyCost: 30, type: 'barrel_roll', duration: 0.8 },
        { id: 'speed_boost', name: 'Surge Drive', key: 'E', cooldown: 18, energyCost: 40, type: 'speed_boost', duration: 5 },
      ] },
  },
  plague_mother: {
    class: 'carrier', displayName: 'Plague Mother',
    lore: 'Biological warfare carrier that spawns swarms of drone fighters. Overwhelms enemies through sheer numbers.',
    stats: { maxHp: 600, maxShield: 150, shieldRegen: 3, armor: 10, speed: 20, turnRate: 0.7, attackDamage: 20, attackRange: 200, attackCooldown: 2.0, attackType: 'torpedo', supplyCost: 16, buildTime: 75, creditCost: 1400, energyCost: 300, mineralCost: 650, tier: 5,
      abilities: [
        { id: 'launch_fighters', name: 'Spawn Brood', key: 'Q', cooldown: 20, energyCost: 60, type: 'launch_fighters', duration: 0 },
        { id: 'launch_fighters', name: 'Drone Swarm', key: 'W', cooldown: 35, energyCost: 100, type: 'launch_fighters', duration: 0 },
        { id: 'boarding', name: 'Infest', key: 'E', cooldown: 40, energyCost: 80, type: 'boarding', duration: 6 },
      ] },
  },
  // ── Custom Hero Ship (player-designed in Ship Forge) ─────────────
  custom_hero: {
    class: 'dreadnought', displayName: 'Custom Hero Ship',
    lore: 'Your personal flagship, forged in the Ship Forge. A unique dreadnought built from your home world.',
    stats: { maxHp: 1000, maxShield: 400, shieldRegen: 7, armor: 14, speed: 25, turnRate: 0.7, attackDamage: 85, attackRange: 380, attackCooldown: 1.6, attackType: 'railgun', supplyCost: 18, buildTime: 80, creditCost: 1800, energyCost: 400, mineralCost: 750, tier: 5,
      abilities: [
        { id: 'iron_dome', name: 'Forge Shield', key: 'Q', cooldown: 30, energyCost: 90, type: 'iron_dome', duration: 10, radius: 180 },
        { id: 'warp', name: 'Homeworld Warp', key: 'W', cooldown: 50, energyCost: 160, type: 'warp', duration: 2 },
        { id: 'speed_boost', name: 'Forge Drive', key: 'E', cooldown: 18, energyCost: 40, type: 'speed_boost', duration: 5 },
      ] },
  },
};

// ── Ship types available at each tier for building ──────────────
export const BUILDABLE_SHIPS: Record<number, string[]> = {
  1: ['mining_drone', 'energy_skimmer', 'micro_recon', 'red_fighter', 'galactix_racer', 'cf_corvette_01'],
  2: ['dual_striker', 'camo_stellar_jet', 'meteor_slicer', 'infrared_furtive', 'interstellar_runner', 'transtellar', 'cf_corvette_02', 'cf_corvette_03', 'cf_frigate_01'],
  3: ['ultraviolet_intruder', 'warship', 'star_marine_trooper', 'pyramid_ship', 'cf_frigate_02', 'cf_frigate_04', 'cf_frigate_05'],
  4: ['destroyer', 'cruiser', 'bomber', 'cf_destroyer_01', 'cf_destroyer_02', 'cf_destroyer_04', 'cf_light_cruiser_03', 'cf_light_cruiser_05'],
  5: ['battleship', 'custom_hero'],
};

export const HERO_SHIPS: string[] = ['custom_hero', 'vanguard_prime', 'shadow_reaper', 'iron_bastion', 'storm_herald', 'plague_mother'];

// All ship definitions combined (stock + hero)
export function getShipDef(key: string): { class: ShipClass; stats: ShipStats; displayName: string } | null {
  return SHIP_DEFINITIONS[key] ?? HERO_DEFINITIONS[key] ?? null;
}

// ── Map Constants ────────────────────────────────────────────────
// 1v1 = 16000x16000, 2v2/ffa4 = 20000x20000
export function getMapSize(mode: GameMode): { width: number; height: number; depth: number } {
  switch (mode) {
    case '1v1': return { width: 16000, height: 16000, depth: 800 };
    case '2v2': return { width: 20000, height: 20000, depth: 800 };
    case 'ffa4': return { width: 20000, height: 20000, depth: 800 };
  }
}

// Default for backward compat
export const MAP_WIDTH = 16000;
export const MAP_HEIGHT = 16000;
export const MAP_DEPTH = 800;

// ── Commander System ──────────────────────────────────────────────
export type CommanderSpec = 'forge' | 'tide' | 'prism' | 'vortex' | 'void';
export type CommanderState = 'idle' | 'training' | 'onship';

export interface Commander {
  id: number;
  name: string;
  portrait: string;            // path to avatar image
  spec: CommanderSpec;
  level: number;               // 1-5
  xp: number;
  xpToNextLevel: number;
  team: Team;
  state: CommanderState;
  trainingPlanetId: number | null;
  trainingTimeRemaining: number; // seconds until training completes
  trainingTotalTime: number;
  equippedShipId: number | null;
  // Combat bonuses applied to equipped Hero ship (as % multipliers)
  attackBonus: number;    // e.g. 0.10 = +10%
  defenseBonus: number;
  speedBonus: number;
  specialBonus: number;   // spec-specific stat
}

export const COMMANDER_NAMES = [
  'Vex Mara', 'Solis Kane', 'Rynn Holt', 'Dex Void', 'Kira Null',
  'Orion Blaze', 'Lyra Storm', 'Axon Prime', 'Nova Crest', 'Dusk Fray',
];
export const COMMANDER_XP_LEVELS = [0, 100, 250, 500, 900, 1500];
export const COMMANDER_TRAIN_TIME = [0, 30, 60, 120, 200, 360]; // seconds per level-up
export const COMMANDER_TRAIN_COST = [
  { credits: 0,   energy: 0,   minerals: 0   },
  { credits: 200, energy: 80,  minerals: 100 },
  { credits: 400, energy: 160, minerals: 200 },
  { credits: 700, energy: 280, minerals: 350 },
  { credits: 1100, energy: 440, minerals: 550 },
  { credits: 1600, energy: 640, minerals: 800 },
];

// Maps commander spec to its planet type home
export const COMMANDER_SPEC_PLANET: Record<CommanderSpec, PlanetType> = {
  forge:  'volcanic', tide:  'oceanic', prism: 'crystalline',
  vortex: 'gas_giant', void: 'barren',
};
export const COMMANDER_SPEC_LABEL: Record<CommanderSpec, string> = {
  forge: 'Forge', tide: 'Tide', prism: 'Prism', vortex: 'Vortex', void: 'Void',
};

// ── Planet Defense Turret ───────────────────────────────────────
export interface PlanetTurret {
  id: number;
  planetId: number;
  x: number; y: number; z: number;
  orbitAngle: number;
  orbitRadius: number;
  team: Team;
  turretType: string;
  hp: number;
  maxHp: number;
  dead: boolean;
  attackCooldown: number;
  attackTimer: number;
  targetId: number | null;
}

// ── Tech Research State ───────────────────────────────────────
export interface TeamTechState {
  researchedNodes: Set<string>;
  inResearch: string | null;
  researchTimeRemaining: number;
  unlockedShips: Set<string>;
  unlockedTurrets: Set<string>;
  bonuses: TeamTechBonuses;
}
export interface TeamTechBonuses {
  attackMult: number;
  armorBonus: number;
  shieldMult: number;
  speedMult: number;
  healthMult: number;
  resourceMult: number;
  buildSpeedMult: number;
  shieldRegenBonus: number;
  cooldownReduction: number;
}
export function defaultTechBonuses(): TeamTechBonuses {
  return { attackMult:1, armorBonus:0, shieldMult:1, speedMult:1, healthMult:1, resourceMult:1, buildSpeedMult:1, shieldRegenBonus:0, cooldownReduction:0 };
}

// ── Active Void Effect ────────────────────────────────────────────
export interface VoidEffect {
  id: number;
  powerId: string;
  x: number; y: number;
  radius: number;
  damage?: number;
  pushForce?: number;
  lifetime: number;
  maxLifetime: number;
  team: Team;
  done: boolean;
}

export const CAPTURE_TIME = 100;
export const CAPTURE_RATE_PER_UNIT = 5;
export const NEUTRAL_DEFENDERS = 3;
export const DOMINATION_TIME = 60;

// ── Ship Roles (RTS archetypes integrated into existing ships) ───
// repair = sustain healer, void_caster = ability/spell support
// juggernaut = tank + group shield, star_splitter = glass cannon DPS/stealth
export type ShipRoleType = 'repair' | 'void_caster' | 'juggernaut' | 'star_splitter';

export const SHIP_ROLE_LABELS: Record<ShipRoleType, string> = {
  repair:       'Repair',
  void_caster:  'Void Caster',
  juggernaut:   'Juggernaut',
  star_splitter:'Star Splitter',
};

export const SHIP_ROLE_COLORS: Record<ShipRoleType, string> = {
  repair:       '#44ee88',
  void_caster:  '#aa44ff',
  juggernaut:   '#ff8822',
  star_splitter:'#ff4488',
};

export const SHIP_ROLES: Partial<Record<string, ShipRoleType>> = {
  // Repair — heal-aura sustains nearby allies each 2s
  interstellar_runner: 'repair', star_marine_trooper: 'repair',
  transtellar: 'repair', cf_frigate_01: 'repair',
  // Void Casters — −25% ability cooldowns, +30% ability radius
  camo_stellar_jet: 'void_caster', infrared_furtive: 'void_caster',
  cf_corvette_04: 'void_caster', vanguard_prime: 'void_caster',
  // Juggernauts — −30% incoming damage, passive mini-shield pulse to nearby allies
  warship: 'juggernaut', pyramid_ship: 'juggernaut',
  cf_light_cruiser_02: 'juggernaut', boss_ship_01: 'juggernaut',
  boss_ship_02: 'juggernaut', iron_bastion: 'juggernaut',
  cf_destroyer_04: 'juggernaut',
  // Star Splitters — +80% bonus damage on first strike vs new target
  galactix_racer: 'star_splitter', meteor_slicer: 'star_splitter',
  cf_corvette_01: 'star_splitter', cf_corvette_05: 'star_splitter',
  shadow_reaper: 'star_splitter', storm_herald: 'star_splitter',
  cf_destroyer_05: 'star_splitter', micro_recon: 'star_splitter',
};

// ── Fleet (named ship groups for tactical planning) ─────────────
export interface Fleet {
  name: string;
  color: string;           // CSS color
  shipIds: number[];
  rallyPlanetId: number | null;
  order: 'idle' | 'attack' | 'defend' | 'patrol' | 'follow';
  orderTargetPlanetId: number | null;
}

// ── Tactical Orders (if/then automation for player) ─────────
export type OrderTrigger = 'planet_attacked' | 'planet_captured' | 'fleet_below_half' | 'manual';
export type OrderAction  = 'attack_planet' | 'defend_planet' | 'rally_fleet' | 'focus_class';
export interface TacticalOrder {
  id: number;
  label: string;
  enabled: boolean;
  trigger: OrderTrigger;
  triggerPlanetId: number | null;
  triggerFleetName: string | null;
  action: OrderAction;
  actionPlanetId: number | null;
  fleetName: string | null;
  focusClass?: ShipClass;
  priority: number;           // 1–5
  cooldown: number;
  cooldownRemaining: number;
}
