// ── Core Geometry ───────────────────────────────────────────────
export interface Vec2 { x: number; y: number; }
export interface Vec3 { x: number; y: number; z: number; }

// ── Teams & Factions ────────────────────────────────────────────
export type Team = 0 | 1 | 2; // 0=neutral, 1=player, 2=enemy
export const TEAM_COLORS: Record<Team, number> = { 0: 0x44ff44, 1: 0x4488ff, 2: 0xff4444 };

// ── Ship Classification ─────────────────────────────────────────
export type ShipClass =
  | 'scout' | 'fighter' | 'interceptor' | 'heavy_fighter'
  | 'bomber' | 'stealth' | 'transport' | 'assault_frigate'
  | 'destroyer' | 'cruiser' | 'battleship' | 'carrier';

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

// ── Complete Game State ─────────────────────────────────────────
export interface SpaceGameState {
  ships: Map<number, SpaceShip>;
  stations: Map<number, SpaceStation>;
  planets: Planet[];
  towers: Map<number, OrbitalTower>;
  projectiles: Map<number, Projectile>;
  spriteEffects: SpriteEffect[];
  glbEffects: GLBEffect[];
  alerts: Alert[];
  resources: Record<Team, PlayerResources>;
  gameTime: number;
  nextId: number;
  selectedIds: Set<number>;
  controlGroups: Map<number, Set<number>>;
  gameOver: boolean;
  winner: Team | null;
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
  angle: number;       // tilt angle (45° default)
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
    stats: { maxHp: 30, maxShield: 10, shieldRegen: 0.5, armor: 0, speed: 180, turnRate: 4, attackDamage: 5, attackRange: 120, attackCooldown: 0.8, attackType: 'laser', supplyCost: 1, buildTime: 5, creditCost: 50, energyCost: 10, mineralCost: 25, tier: 1 },
  },
  red_fighter: {
    class: 'fighter', displayName: 'RedFighter',
    stats: { maxHp: 60, maxShield: 20, shieldRegen: 1, armor: 1, speed: 140, turnRate: 3.5, attackDamage: 12, attackRange: 150, attackCooldown: 1.0, attackType: 'laser', supplyCost: 2, buildTime: 8, creditCost: 100, energyCost: 20, mineralCost: 50, tier: 1 },
  },
  galactix_racer: {
    class: 'interceptor', displayName: 'GalactixRacer',
    stats: { maxHp: 45, maxShield: 15, shieldRegen: 1, armor: 0, speed: 200, turnRate: 5, attackDamage: 8, attackRange: 130, attackCooldown: 0.6, attackType: 'laser', supplyCost: 2, buildTime: 7, creditCost: 80, energyCost: 25, mineralCost: 40, tier: 1, abilities: [{ id: 'speed_boost', name: 'Afterburner', key: 'Q', cooldown: 12, energyCost: 15, type: 'speed_boost', duration: 3 }] },
  },
  dual_striker: {
    class: 'heavy_fighter', displayName: 'DualStriker',
    stats: { maxHp: 80, maxShield: 30, shieldRegen: 1.5, armor: 2, speed: 120, turnRate: 2.8, attackDamage: 20, attackRange: 160, attackCooldown: 1.2, attackType: 'pulse', supplyCost: 3, buildTime: 12, creditCost: 150, energyCost: 30, mineralCost: 75, tier: 2 },
  },
  camo_stellar_jet: {
    class: 'stealth', displayName: 'CamoStellarJet',
    stats: { maxHp: 50, maxShield: 25, shieldRegen: 1, armor: 1, speed: 160, turnRate: 3.5, attackDamage: 18, attackRange: 140, attackCooldown: 1.5, attackType: 'laser', supplyCost: 3, buildTime: 15, creditCost: 200, energyCost: 50, mineralCost: 60, tier: 2, abilities: [{ id: 'cloak', name: 'Cloaking Device', key: 'Q', cooldown: 20, energyCost: 30, type: 'cloak', duration: 8 }] },
  },
  meteor_slicer: {
    class: 'fighter', displayName: 'MeteorSlicer',
    stats: { maxHp: 70, maxShield: 20, shieldRegen: 1, armor: 3, speed: 150, turnRate: 3, attackDamage: 25, attackRange: 80, attackCooldown: 0.8, attackType: 'pulse', supplyCost: 3, buildTime: 10, creditCost: 130, energyCost: 20, mineralCost: 65, tier: 2, abilities: [{ id: 'ram', name: 'Meteor Ram', key: 'Q', cooldown: 15, energyCost: 20, type: 'ram', duration: 1 }] },
  },
  infrared_furtive: {
    class: 'stealth', displayName: 'InfraredFurtive',
    stats: { maxHp: 55, maxShield: 30, shieldRegen: 2, armor: 1, speed: 145, turnRate: 3.2, attackDamage: 14, attackRange: 170, attackCooldown: 1.3, attackType: 'laser', supplyCost: 3, buildTime: 14, creditCost: 180, energyCost: 45, mineralCost: 55, tier: 2, abilities: [{ id: 'emp', name: 'EMP Burst', key: 'Q', cooldown: 25, energyCost: 40, type: 'emp', duration: 3, radius: 120 }] },
  },
  ultraviolet_intruder: {
    class: 'bomber', displayName: 'UltravioletIntruder',
    stats: { maxHp: 90, maxShield: 35, shieldRegen: 1, armor: 3, speed: 100, turnRate: 2, attackDamage: 40, attackRange: 130, attackCooldown: 2.5, attackType: 'torpedo', supplyCost: 4, buildTime: 18, creditCost: 250, energyCost: 50, mineralCost: 100, tier: 3 },
  },
  warship: {
    class: 'assault_frigate', displayName: 'Warship',
    stats: { maxHp: 150, maxShield: 60, shieldRegen: 2, armor: 5, speed: 80, turnRate: 1.8, attackDamage: 30, attackRange: 200, attackCooldown: 1.8, attackType: 'railgun', supplyCost: 5, buildTime: 20, creditCost: 300, energyCost: 60, mineralCost: 120, tier: 3, abilities: [{ id: 'iron_dome', name: 'Point Defense', key: 'Q', cooldown: 30, energyCost: 40, type: 'iron_dome', duration: 6, radius: 100 }] },
  },
  star_marine_trooper: {
    class: 'transport', displayName: 'StarMarineTrooper',
    stats: { maxHp: 120, maxShield: 40, shieldRegen: 1.5, armor: 4, speed: 90, turnRate: 2, attackDamage: 10, attackRange: 100, attackCooldown: 2.0, attackType: 'laser', supplyCost: 3, buildTime: 16, creditCost: 200, energyCost: 30, mineralCost: 80, tier: 3, abilities: [{ id: 'boarding', name: 'Board Enemy', key: 'Q', cooldown: 40, energyCost: 50, type: 'boarding', duration: 5 }] },
  },
  interstellar_runner: {
    class: 'transport', displayName: 'InterstellarRunner',
    stats: { maxHp: 100, maxShield: 30, shieldRegen: 1.5, armor: 2, speed: 130, turnRate: 2.5, attackDamage: 8, attackRange: 100, attackCooldown: 1.5, attackType: 'laser', supplyCost: 2, buildTime: 12, creditCost: 120, energyCost: 20, mineralCost: 60, tier: 2 },
  },
  transtellar: {
    class: 'transport', displayName: 'Transtellar',
    stats: { maxHp: 110, maxShield: 35, shieldRegen: 1.5, armor: 3, speed: 110, turnRate: 2.2, attackDamage: 10, attackRange: 110, attackCooldown: 1.8, attackType: 'laser', supplyCost: 3, buildTime: 14, creditCost: 160, energyCost: 25, mineralCost: 70, tier: 2 },
  },
  destroyer: {
    class: 'destroyer', displayName: 'Destroyer',
    stats: { maxHp: 250, maxShield: 100, shieldRegen: 3, armor: 6, speed: 70, turnRate: 1.5, attackDamage: 45, attackRange: 250, attackCooldown: 2.0, attackType: 'railgun', supplyCost: 6, buildTime: 30, creditCost: 500, energyCost: 100, mineralCost: 200, tier: 4, abilities: [{ id: 'barrel_roll', name: 'Evasive Roll', key: 'Q', cooldown: 15, energyCost: 25, type: 'barrel_roll', duration: 0.8 }] },
  },
  cruiser: {
    class: 'cruiser', displayName: 'Cruiser',
    stats: { maxHp: 400, maxShield: 150, shieldRegen: 4, armor: 8, speed: 55, turnRate: 1.2, attackDamage: 35, attackRange: 280, attackCooldown: 1.5, attackType: 'missile', supplyCost: 8, buildTime: 40, creditCost: 700, energyCost: 150, mineralCost: 300, tier: 4, abilities: [{ id: 'launch_fighters', name: 'Launch Fighters', key: 'Q', cooldown: 45, energyCost: 60, type: 'launch_fighters', duration: 0 }] },
  },
  bomber: {
    class: 'bomber', displayName: 'Bomber',
    stats: { maxHp: 200, maxShield: 60, shieldRegen: 2, armor: 5, speed: 65, turnRate: 1.5, attackDamage: 80, attackRange: 200, attackCooldown: 3.5, attackType: 'torpedo', supplyCost: 5, buildTime: 25, creditCost: 400, energyCost: 80, mineralCost: 150, tier: 4 },
  },
  battleship: {
    class: 'battleship', displayName: 'Battleship',
    stats: { maxHp: 800, maxShield: 300, shieldRegen: 5, armor: 12, speed: 35, turnRate: 0.8, attackDamage: 60, attackRange: 350, attackCooldown: 2.0, attackType: 'railgun', supplyCost: 12, buildTime: 60, creditCost: 1200, energyCost: 250, mineralCost: 500, tier: 5, abilities: [{ id: 'iron_dome', name: 'Fortress Shield', key: 'Q', cooldown: 45, energyCost: 80, type: 'iron_dome', duration: 10, radius: 150 }, { id: 'warp', name: 'Warp Jump', key: 'W', cooldown: 90, energyCost: 150, type: 'warp', duration: 2 }] },
  },
};

// ── Map Constants ────────────────────────────────────────────────
export const MAP_WIDTH = 4000;
export const MAP_HEIGHT = 4000;
export const MAP_DEPTH = 800;
