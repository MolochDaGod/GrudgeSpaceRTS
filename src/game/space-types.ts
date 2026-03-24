// ── Core Geometry ───────────────────────────────────────────────
export interface Vec2 {
  x: number;
  y: number;
}
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// ── Game Mode ───────────────────────────────────────────────────
export type GameMode = '1v1' | '2v2' | 'ffa4';

// ── Teams & Factions ────────────────────────────────────────────
export type Team = 0 | 1 | 2 | 3 | 4; // 0=neutral, 1-4=players
export const TEAM_COLORS: Record<number, number> = {
  0: 0x44ff44,
  1: 0x4488ff,
  2: 0xff4444,
  3: 0xffaa22,
  4: 0xaa44ff,
};

// ── Team Color Customization ──────────────────────────────────────
export interface TeamColorOption {
  label: string;
  hex: number;
}

export type EnemyColorMode = 'unique' | 'all_one';

export interface TeamColorPrefs {
  playerColorIdx: number;
  enemyColorMode: EnemyColorMode;
  enemyColorIdx: number;
}

// ── Ship Classification
export type ShipClass =
  | 'scout'
  | 'fighter'
  | 'interceptor'
  | 'heavy_fighter'
  | 'bomber'
  | 'stealth'
  | 'transport'
  | 'assault_frigate'
  | 'corvette'
  | 'frigate'
  | 'light_cruiser'
  | 'destroyer'
  | 'cruiser'
  | 'battleship'
  | 'carrier'
  | 'worker'
  | 'dreadnought';

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
  key: string; // Q, W, E, R
  cooldown: number;
  energyCost: number;
  type: 'barrel_roll' | 'speed_boost' | 'cloak' | 'iron_dome' | 'warp' | 'emp' | 'boarding' | 'repair' | 'ram' | 'launch_fighters';
  duration: number;
  radius?: number;
}

// ── Game Entity Base ────────────────────────────────────────────
export interface GameEntity {
  id: number;
  x: number;
  y: number;
  z: number;
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
  upgradeDiscount: UpgradeType; // 20% cost reduction
  techFocus: string;
  baseColor: number;
}

// ── Resource Node ────────────────────────────────────────────────
export interface ResourceNode {
  id: number;
  parentPlanetId: number;
  x: number;
  y: number;
  z: number;
  orbitAngle: number;
  orbitRadius: number; // game units from planet center
  orbitSpeed: number; // radians/sec
  kind: ResourceNodeKind;
  radius: number; // visual/collision radius in game units
  yield: { credits: number; energy: number; minerals: number };
  harvestCooldown: number; // current cooldown
  maxHarvestCooldown: number; // seconds between harvests
}

export interface SpaceShip extends GameEntity {
  shipType: string; // prefab key
  shipClass: ShipClass;
  shield: number;
  maxShield: number;
  shieldRegen: number;
  armor: number;
  speed: number;
  turnRate: number;
  vx: number;
  vy: number;
  vz: number;
  facing: number; // yaw in radians
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
  controlGroup: number; // 0=none, 1-9
  stationId: number | null; // which station built this
  orbitTarget: number | null; // planet id for orbital towers
  orbitRadius: number;
  orbitAngle: number;
  isDocked: boolean;
  damageLevel: number; // 0-1, affects smoke/listing
  // Worker ship fields (undefined for non-workers)
  workerState?: 'idle' | 'traveling' | 'harvesting' | 'returning';
  workerNodeId?: number | null;
  workerCargo?: number;
  workerCargoType?: 'credits' | 'energy' | 'minerals';
  workerHarvestTimer?: number;
  // Rank / XP progression
  xp: number;
  rank: number; // 0-5, each +5% to all stats
  // Tech effect flags (applied on spawn/research)
  burnDot?: boolean;
  empChance?: number;
  deathPhase?: boolean;
  deathPhaseActive?: boolean;
  roleTimer: number; // role behavior tick timer
  lastTargetId?: number | null; // star splitter ambush tracking
  baseSpeed: number; // original speed before ability boosts (for clean revert)
}

export type ShipAnimState =
  | 'idle'
  | 'moving'
  | 'attacking'
  | 'barrel_roll'
  | 'speed_boost'
  | 'warping'
  | 'docking'
  | 'launching'
  | 'death_spiral'
  | 'cloaked'
  | 'banking';

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
  towerSlots: number; // max 6
  towersBuilt: number;
  rallyPoint: Vec3 | null;
  supplyProvided: number;
  selected: boolean;
  // Per-station auto-production (like swarm game)
  autoProduceType: string | null; // ship type key to auto-produce, null = manual only
  autoProduceTimer: number; // countdown to next auto-spawn
  canBuildHeroes: boolean; // only starting planet stations can build hero ships
}

export interface BuildQueueItem {
  shipType: string;
  buildTimeRemaining: number;
  totalBuildTime: number;
}

// ── Planet ───────────────────────────────────────────────────────
export interface Planet {
  id: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  name: string;
  owner: Team;
  stationId: number | null;
  resourceYield: { credits: number; energy: number; minerals: number };
  color: number;
  hasAsteroidField: boolean;
  planetType: PlanetType;
  captureRadius: number; // radius at which capture/orbit detection triggers
  // Capture mechanics
  captureTeam: Team; // team attempting capture (0 = nobody)
  captureProgress: number; // 0-100
  captureSpeed: number; // per second per unit present
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
  weaponLevel: number; // 1-3
}

// ── Projectiles ─────────────────────────────────────────────────
export interface Projectile {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
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
  | 'explosion-1-a'
  | 'explosion-1-b'
  | 'explosion-1-c'
  | 'explosion-1-d'
  | 'explosion-1-e'
  | 'explosion-1-f'
  | 'explosion-1-g'
  | 'explosion-b';

export type ExplosionScale = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'epic';

export type ShootingFxType = 'bolt' | 'charged' | 'crossed' | 'pulse' | 'spark' | 'waveform';
export type HitFxType = 'hits-1' | 'hits-2' | 'hits-3' | 'hits-4' | 'hits-5' | 'hits-6';
export type BombFxType =
  | 'bomb-tiny'
  | 'bomb-tiny-2'
  | 'bomb-tiny-3'
  | 'bomb-low'
  | 'bomb-low-2'
  | 'bomb-low-3'
  | 'bomb-mid'
  | 'bomb-mid-2'
  | 'bomb-mid-3'
  | 'bomb-high'
  | 'bomb-high-2'
  | 'bomb-high-3';

export interface SpriteEffect {
  id: number;
  x: number;
  y: number;
  z: number;
  type: ExplosionType | ShootingFxType | HitFxType | BombFxType;
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
  x: number;
  y: number;
  z: number;
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
  level: number; // 0-5
  maxLevel: number;
}

export interface TeamUpgrades {
  attack: number; // current level 0-5
  armor: number;
  speed: number;
  health: number;
  shield: number;
}

// ── Alerts ──────────────────────────────────────────────────────
export interface Alert {
  id: number;
  x: number;
  y: number;
  z: number;
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
// ── Floating Damage Text ────────────────────────────────────────
export interface FloatingText {
  id: number;
  x: number;
  y: number;
  z: number;
  text: string;
  color: string;
  age: number; // seconds alive
  maxAge: number; // total display time
}

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
  floatingTexts: FloatingText[];
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
  dominationTimer: number; // seconds holding all planets
  dominationTeam: Team | null;
  activePlayers: Team[]; // teams in this match
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
export type CommandType = 'move' | 'attack_move' | 'attack' | 'stop' | 'hold' | 'patrol' | 'build' | 'rally' | 'ability' | 'dock' | 'orbit';

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
  x: number;
  y: number;
  z: number;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  angle: number; // tilt/pitch angle in degrees (55° default)
  rotation: number; // yaw rotation in degrees (0 = north, Q/E to orbit)
  bookmarks: Vec3[]; // F1-F4
}

// ── Sprite Sheet Metadata ───────────────────────────────────────
export interface SpriteSheetDef {
  path: string;
  frameCount: number;
  frameDuration: number; // seconds per frame
  cols: number;
  rows: number;
  frameWidth: number;
  frameHeight: number;
}

// ── Map Constants ────────────────────────────────────────────────

// ── Commander System ──────────────────────────────────────────────
export type CommanderSpec = 'forge' | 'tide' | 'prism' | 'vortex' | 'void';
export type CommanderState = 'idle' | 'training' | 'onship';

export interface Commander {
  id: number;
  name: string;
  portrait: string; // path to avatar image
  spec: CommanderSpec;
  level: number; // 1-5
  xp: number;
  xpToNextLevel: number;
  team: Team;
  state: CommanderState;
  trainingPlanetId: number | null;
  trainingTimeRemaining: number; // seconds until training completes
  trainingTotalTime: number;
  equippedShipId: number | null;
  // Combat bonuses applied to equipped Hero ship (as % multipliers)
  attackBonus: number; // e.g. 0.10 = +10%
  defenseBonus: number;
  speedBonus: number;
  specialBonus: number; // spec-specific stat
}

// ── Planet Defense Turret ───────────────────────────────────────
export interface PlanetTurret {
  id: number;
  planetId: number;
  x: number;
  y: number;
  z: number;
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

// ── Active Void Effect ────────────────────────────────────────────
export interface VoidEffect {
  id: number;
  powerId: string;
  x: number;
  y: number;
  radius: number;
  damage?: number;
  pushForce?: number;
  lifetime: number;
  maxLifetime: number;
  team: Team;
  done: boolean;
}

// ── Ship Roles (RTS archetypes integrated into existing ships) ───
// repair = sustain healer, void_caster = ability/spell support
// juggernaut = tank + group shield, star_splitter = glass cannon DPS/stealth
export type ShipRoleType = 'repair' | 'void_caster' | 'juggernaut' | 'star_splitter';

// ── Fleet (named ship groups for tactical planning) ─────────────
export interface Fleet {
  name: string;
  color: string; // CSS color
  shipIds: number[];
  rallyPlanetId: number | null;
  order: 'idle' | 'attack' | 'defend' | 'patrol' | 'follow';
  orderTargetPlanetId: number | null;
}

// ── Tactical Orders (if/then automation for player) ─────────
export type OrderTrigger = 'planet_attacked' | 'planet_captured' | 'fleet_below_half' | 'manual';
export type OrderAction = 'attack_planet' | 'defend_planet' | 'rally_fleet' | 'focus_class';
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
  priority: number; // 1–5
  cooldown: number;
  cooldownRemaining: number;
}

// ── Re-export all config constants (barrel) ─────────────────────
export * from './space-config';
