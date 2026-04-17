/**
 * ground-rts-types.ts — Type definitions & asset registry for Top-Down RTS Micro Wars.
 *
 * Pure micro combat — no base building, just squad control and wave survival.
 * Uses craftpix TDS sprite packs for characters, enemies, and desert tilemap.
 */

// ── Helpers ──────────────────────────────────────────────────────────
export interface Vec2 {
  x: number;
  y: number;
}

// ── Teams ────────────────────────────────────────────────────────────
export type Team = 0 | 1; // 0 = player (blue), 1 = enemy (red)

export const TEAM_COLORS: Record<Team, string> = {
  0: '#4488ff',
  1: '#ff4444',
};

// ── Sprite Animation ─────────────────────────────────────────────────
export interface SpriteAnim {
  /** Base folder path (frames are numbered 000..N inside) */
  basePath: string;
  /** File prefix before the number, e.g. "Attack_" or "walk_" */
  prefix: string;
  /** File suffix after the number (e.g. "_Man" for death anims), empty string if none */
  suffix: string;
  /** Number of frames */
  frames: number;
  /** Seconds per frame */
  frameDuration: number;
  /** Loop or play-once */
  loop: boolean;
  /** Zero-padding width for frame numbers (3 = "000", 4 = "0000") */
  pad: number;
  /** Starting frame index (usually 0, but death anims may start at different indices) */
  startFrame: number;
}

export interface UnitAnimSet {
  idle?: SpriteAnim;
  walk: SpriteAnim;
  attack: SpriteAnim;
  death: SpriteAnim;
}

// ── Unit Definitions ─────────────────────────────────────────────────
export type UnitClass =
  | 'man_gun'
  | 'man_rifle'
  | 'man_bat'
  | 'man_knife'
  | 'man_flamethrower'
  | 'girl_gun'
  | 'girl_rifle'
  | 'girl_bat'
  | 'girl_knife'
  | 'girl_flamethrower'
  | 'zombie_f1'
  | 'zombie_f2'
  | 'zombie_m1'
  | 'zombie_m2'
  | 'zombie_army'
  | 'zombie_cop'
  | 'monster_big_hands'
  | 'monster_big_head'
  | 'boss1'
  | 'boss2'
  | 'megaboss'
  | 'mech_walker';

export type AttackType = 'melee' | 'ranged' | 'flame';

export interface UnitDef {
  unitClass: UnitClass;
  displayName: string;
  team: Team;
  hp: number;
  speed: number; // pixels per second
  attackDmg: number;
  attackRange: number; // pixels
  attackCooldown: number; // seconds
  attackType: AttackType;
  aggroRange: number; // pixels — auto-acquire targets within this
  spriteSize: number; // pixels — render size (width & height)
  anims: UnitAnimSet;
  icon?: string; // icon image path for roster UI
  tier: number; // difficulty tier 1-5
}

// ── Asset Base Paths ─────────────────────────────────────────────────
const CHARS = '/assets/groundrts/craftpix-722561-zombie-tds-main-characters';
const ZOMBIES = '/assets/groundrts/craftpix-324410-tds-zombie-character-sprite';
const MONSTERS = '/assets/groundrts/craftpix-633111-tds-monster-character-sprites';
const TILES = '/assets/groundrts/craftpix-908766-tds-desert-tileset-sand-sones-plants-water-destroyed-cars';

// ── Animation Helpers ────────────────────────────────────────────────
function charAnim(gender: 'Man' | 'Girl', folder: string, prefix: string, frames: number, dur: number, loop: boolean): SpriteAnim {
  return {
    basePath: `${CHARS}/Characters/PNG_Bodyparts&Animations/PNG Animations/${gender}/${folder}`,
    prefix,
    suffix: '',
    frames,
    frameDuration: dur,
    loop,
    pad: 3,
    startFrame: 0,
  };
}

/** Player death anims use 4-digit padding and a gender suffix: death_0000_Man.png */
function charDeathAnim(gender: 'Man' | 'Girl'): SpriteAnim {
  return {
    basePath: `${CHARS}/Characters/PNG_Bodyparts&Animations/PNG Animations/${gender}/Death`,
    prefix: 'death_',
    suffix: `_${gender}`,
    frames: 6,
    frameDuration: 0.1,
    loop: false,
    pad: 4,
    startFrame: 0,
  };
}

function zombieAnim(
  level: string,
  variant: string,
  action: string,
  prefix: string,
  frames: number,
  dur: number,
  loop: boolean,
): SpriteAnim {
  return {
    basePath: `${ZOMBIES}/Zombies/PNG Animations/${level}/${variant}/${action}`,
    prefix,
    suffix: '',
    frames,
    frameDuration: dur,
    loop,
    pad: 3,
    startFrame: 0,
  };
}

function monsterAnim(
  level: string,
  variant: string,
  action: string,
  prefix: string,
  frames: number,
  dur: number,
  loop: boolean,
): SpriteAnim {
  return {
    basePath: `${MONSTERS}/Monsters/PNG Animations/${level}/${variant}/${action}`,
    prefix,
    suffix: '',
    frames,
    frameDuration: dur,
    loop,
    pad: 3,
    startFrame: 0,
  };
}

// ── Player Unit Definitions ──────────────────────────────────────────
/** Frame counts per weapon attack anim (from actual asset inspection) */
const WEAPON_FRAMES: Record<string, { idle: number; walk: number; attack: number }> = {
  Gun_Shot: { idle: 8, walk: 6, attack: 5 },
  Riffle: { idle: 8, walk: 6, attack: 9 },
  Bat: { idle: 8, walk: 6, attack: 12 },
  Knife: { idle: 8, walk: 6, attack: 8 },
  FlameThrower: { idle: 8, walk: 6, attack: 9 },
};

function playerUnit(
  unitClass: UnitClass,
  name: string,
  gender: 'Man' | 'Girl',
  weapon: string,
  idleFolder: string,
  walkFolder: string,
  attackFolder: string,
  attackType: AttackType,
  hp: number,
  speed: number,
  dmg: number,
  range: number,
  cooldown: number,
): UnitDef {
  const wf = WEAPON_FRAMES[weapon] ?? { idle: 8, walk: 6, attack: 9 };
  // Walk folders use weapon-specific prefix: Walk_gun_000.png
  const walkPrefix = `Walk_${walkFolder.replace('Walk_', '')}_`;
  // Idle folders use weapon-specific prefix: Idle_gun_000.png
  const idlePrefix = `Idle_${idleFolder.replace('Idle_', '')}_`;
  // Attack prefix matches the weapon name: Bat_000.png, Knife_000.png, Gun_Shot_000.png
  const atkPrefix = `${weapon}_`;
  return {
    unitClass,
    displayName: name,
    team: 0,
    hp,
    speed,
    attackDmg: dmg,
    attackRange: range,
    attackCooldown: cooldown,
    attackType,
    aggroRange: Math.max(range * 1.5, 200),
    spriteSize: 64,
    tier: 0,
    anims: {
      idle: charAnim(gender, idleFolder, idlePrefix, wf.idle, 0.12, true),
      walk: charAnim(gender, walkFolder, walkPrefix, wf.walk, 0.08, true),
      attack: charAnim(gender, attackFolder, atkPrefix, wf.attack, 0.07, false),
      death: charDeathAnim(gender),
    },
    icon: `${CHARS}/Icons/PNG/zombie1 icon_no_bg.png`,
  };
}

export const PLAYER_UNITS: UnitDef[] = [
  playerUnit('man_gun', 'Gunner', 'Man', 'Gun_Shot', 'Idle_gun', 'Walk_gun', 'Gun_Shot', 'ranged', 100, 120, 12, 250, 0.5),
  playerUnit('man_rifle', 'Rifleman', 'Man', 'Riffle', 'Idle_riffle', 'Walk_riffle', 'Riffle', 'ranged', 90, 110, 18, 300, 0.8),
  playerUnit('man_bat', 'Brawler', 'Man', 'Bat', 'Idle_bat', 'Walk_bat', 'Bat', 'melee', 150, 130, 22, 40, 0.6),
  playerUnit('man_knife', 'Slasher', 'Man', 'Knife', 'Idle_knife', 'Walk_knife', 'Knife', 'melee', 110, 150, 16, 35, 0.35),
  playerUnit(
    'man_flamethrower',
    'Pyro',
    'Man',
    'FlameThrower',
    'Idle_firethrower',
    'Walk_firethrower',
    'FlameThrower',
    'flame',
    120,
    100,
    25,
    120,
    0.3,
  ),
  playerUnit('girl_gun', 'Gunner Girl', 'Girl', 'Gun_Shot', 'Idle_gun', 'Walk_gun', 'Gun_Shot', 'ranged', 90, 130, 14, 250, 0.45),
  playerUnit('girl_rifle', 'Sniper Girl', 'Girl', 'Riffle', 'Idle_riffle', 'Walk_riffle', 'Riffle', 'ranged', 80, 115, 22, 350, 0.9),
  playerUnit('girl_bat', 'Bruiser Girl', 'Girl', 'Bat', 'Idle_bat', 'Walk_bat', 'Bat', 'melee', 140, 135, 20, 40, 0.55),
  playerUnit('girl_knife', 'Assassin Girl', 'Girl', 'Knife', 'Idle_knife', 'Walk_knife', 'Knife', 'melee', 100, 160, 18, 35, 0.3),
  playerUnit(
    'girl_flamethrower',
    'Pyro Girl',
    'Girl',
    'FlameThrower',
    'Idle_firethrower',
    'Walk_FireThrhrower',
    'FlameThrower',
    'flame',
    110,
    105,
    28,
    120,
    0.3,
  ),
];

// ── Enemy Unit Definitions ───────────────────────────────────────────
export const ENEMY_UNITS: UnitDef[] = [
  // Tier 1 — basic zombies
  {
    unitClass: 'zombie_f1',
    displayName: 'Zombie Girl 1',
    team: 1,
    hp: 60,
    speed: 55,
    attackDmg: 8,
    attackRange: 35,
    attackCooldown: 0.8,
    attackType: 'melee',
    aggroRange: 200,
    spriteSize: 64,
    tier: 1,
    anims: {
      walk: zombieAnim('1LVL', 'Zombie1_female', 'Walk', 'Walk_', 9, 0.09, true),
      attack: zombieAnim('1LVL', 'Zombie1_female', 'Attack', 'Attack_', 9, 0.07, false),
      death: zombieAnim('1LVL', 'Zombie1_female', 'Death', 'Death_', 6, 0.1, false),
    },
  },
  {
    unitClass: 'zombie_f2',
    displayName: 'Zombie Girl 2',
    team: 1,
    hp: 65,
    speed: 50,
    attackDmg: 9,
    attackRange: 35,
    attackCooldown: 0.8,
    attackType: 'melee',
    aggroRange: 200,
    spriteSize: 64,
    tier: 1,
    anims: {
      walk: zombieAnim('1LVL', 'Zombie2_female', 'Walk', 'Walk_', 9, 0.09, true),
      attack: zombieAnim('1LVL', 'Zombie2_female', 'Attack', 'Attack_', 9, 0.07, false),
      death: zombieAnim('1LVL', 'Zombie2_female', 'Death', 'Death_', 6, 0.1, false),
    },
  },
  {
    unitClass: 'zombie_m1',
    displayName: 'Zombie Man 1',
    team: 1,
    hp: 70,
    speed: 45,
    attackDmg: 10,
    attackRange: 35,
    attackCooldown: 0.75,
    attackType: 'melee',
    aggroRange: 200,
    spriteSize: 64,
    tier: 1,
    anims: {
      walk: zombieAnim('1LVL', 'Zombie3_male', 'Walk', 'walk_', 9, 0.09, true),
      attack: zombieAnim('1LVL', 'Zombie3_male', 'Attack', 'Attack_', 9, 0.07, false),
      death: zombieAnim('1LVL', 'Zombie3_male', 'Death', 'Death_', 6, 0.1, false),
    },
  },
  {
    unitClass: 'zombie_m2',
    displayName: 'Zombie Man 2',
    team: 1,
    hp: 75,
    speed: 48,
    attackDmg: 11,
    attackRange: 35,
    attackCooldown: 0.7,
    attackType: 'melee',
    aggroRange: 200,
    spriteSize: 64,
    tier: 1,
    anims: {
      walk: zombieAnim('1LVL', 'Zombie4_male', 'Walk', 'Walk_', 9, 0.09, true),
      attack: zombieAnim('1LVL', 'Zombie4_male', 'Attack', 'Attack_', 9, 0.07, false),
      death: zombieAnim('1LVL', 'Zombie4_male', 'Death', 'Death_', 6, 0.1, false),
    },
  },
  // Tier 2 — armored zombies
  {
    unitClass: 'zombie_army',
    displayName: 'Army Zombie',
    team: 1,
    hp: 120,
    speed: 55,
    attackDmg: 16,
    attackRange: 38,
    attackCooldown: 0.7,
    attackType: 'melee',
    aggroRange: 220,
    spriteSize: 72,
    tier: 2,
    anims: {
      walk: zombieAnim('2LVL', 'Army_zombie', 'Walk', 'walk_', 9, 0.08, true),
      attack: zombieAnim('2LVL', 'Army_zombie', 'Attack', 'attack_', 9, 0.06, false),
      death: zombieAnim('2LVL', 'Army_zombie', 'Death', 'death_', 6, 0.1, false),
    },
  },
  {
    unitClass: 'zombie_cop',
    displayName: 'Cop Zombie',
    team: 1,
    hp: 110,
    speed: 60,
    attackDmg: 14,
    attackRange: 38,
    attackCooldown: 0.65,
    attackType: 'melee',
    aggroRange: 220,
    spriteSize: 72,
    tier: 2,
    anims: {
      walk: zombieAnim('2LVL', 'Cop_Zombie', 'Walk', 'walk_', 9, 0.08, true),
      attack: zombieAnim('2LVL', 'Cop_Zombie', 'Attack', 'attack_', 9, 0.06, false),
      death: zombieAnim('2LVL', 'Cop_Zombie', 'Death', 'daeth_', 6, 0.1, false),
    },
  },
  // Tier 3 — mutants
  {
    unitClass: 'monster_big_hands',
    displayName: 'Big Hands',
    team: 1,
    hp: 200,
    speed: 50,
    attackDmg: 28,
    attackRange: 50,
    attackCooldown: 0.9,
    attackType: 'melee',
    aggroRange: 250,
    spriteSize: 80,
    tier: 3,
    anims: {
      walk: monsterAnim('3LVL', 'Zombie_big_hands', 'Walk', 'walk_', 9, 0.08, true),
      attack: monsterAnim('3LVL', 'Zombie_big_hands', 'Attack1', 'attack_', 9, 0.06, false),
      death: monsterAnim('3LVL', 'Zombie_big_hands', 'Death', 'Death_', 6, 0.1, false),
    },
  },
  {
    unitClass: 'monster_big_head',
    displayName: 'Big Head',
    team: 1,
    hp: 180,
    speed: 55,
    attackDmg: 24,
    attackRange: 45,
    attackCooldown: 0.8,
    attackType: 'melee',
    aggroRange: 250,
    spriteSize: 80,
    tier: 3,
    anims: {
      walk: monsterAnim('3LVL', 'Zpmbie_big_head', 'Walk', 'walk_', 9, 0.08, true),
      attack: monsterAnim('3LVL', 'Zpmbie_big_head', 'Attack', 'Attack_', 9, 0.06, false),
      death: monsterAnim('3LVL', 'Zpmbie_big_head', 'Death', 'death_', 6, 0.1, false),
    },
  },
  // Tier 4 — bosses
  {
    unitClass: 'boss1',
    displayName: 'Brute Boss',
    team: 1,
    hp: 500,
    speed: 40,
    attackDmg: 45,
    attackRange: 60,
    attackCooldown: 1.2,
    attackType: 'melee',
    aggroRange: 300,
    spriteSize: 96,
    tier: 4,
    anims: {
      walk: monsterAnim('4LVL', 'Boss1', 'Walk', 'Walk_', 9, 0.09, true),
      attack: monsterAnim('4LVL', 'Boss1', 'Attack_1', 'Attack_1_', 9, 0.06, false),
      death: monsterAnim('4LVL', 'Boss1', 'Death', 'Death_', 6, 0.12, false),
    },
  },
  {
    unitClass: 'boss2',
    displayName: 'Terror Boss',
    team: 1,
    hp: 600,
    speed: 45,
    attackDmg: 50,
    attackRange: 65,
    attackCooldown: 1.0,
    attackType: 'melee',
    aggroRange: 300,
    spriteSize: 96,
    tier: 4,
    anims: {
      walk: monsterAnim('4LVL', 'Boss2', 'Walk', 'Walk_', 9, 0.09, true),
      attack: monsterAnim('4LVL', 'Boss2', 'Attack_1', 'Attack_1_', 9, 0.06, false),
      death: monsterAnim('4LVL', 'Boss2', 'Death', 'Death_', 6, 0.12, false),
    },
  },
];

// ── Producible RTS Units (built from factories/mech bay) ──────────────
const STUB_ANIM: SpriteAnim = {
  basePath: '',
  prefix: '',
  suffix: '',
  frames: 1,
  frameDuration: 1,
  loop: false,
  pad: 3,
  startFrame: 0,
};

export interface ProductionDef {
  unitClass: UnitClass;
  displayName: string;
  creditCost: number;
  mineralCost: number;
  buildTime: number; // seconds
  /** Which building role can produce this */
  producerKey: string;
}

export const PRODUCTION_UNITS: UnitDef[] = [
  {
    unitClass: 'mech_walker',
    displayName: 'Mech Walker',
    team: 0,
    hp: 350,
    speed: 65,
    attackDmg: 40,
    attackRange: 220,
    attackCooldown: 1.4,
    attackType: 'ranged',
    aggroRange: 320,
    spriteSize: 96,
    tier: 0,
    anims: { walk: STUB_ANIM, attack: { ...STUB_ANIM, loop: false }, death: { ...STUB_ANIM, loop: false } },
  },
];

export const PRODUCTION_DEFS: ProductionDef[] = [
  { unitClass: 'mech_walker', displayName: 'Mech Walker', creditCost: 500, mineralCost: 300, buildTime: 18, producerKey: 'mech_bay' },
];

// ── Projectile ───────────────────────────────────────────────────────
export interface Projectile {
  id: number;
  x: number;
  y: number;
  targetId: number;
  speed: number;
  damage: number;
  team: Team;
  color: string;
  radius: number;
}

// ── Floating Damage Text ─────────────────────────────────────────────
export interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  age: number;
}

// ── Runtime Unit (instance in the game) ──────────────────────────────
export type UnitState = 'idle' | 'walking' | 'attacking' | 'dying' | 'dead';

export interface RTSUnit {
  id: number;
  def: UnitDef;
  team: Team;
  x: number;
  y: number;
  facing: number; // current visual facing (radians) — lerps toward facingTarget
  facingTarget: number; // desired facing (radians) — set by movement/attack
  hp: number;
  maxHp: number;
  state: UnitState;
  attackTimer: number;
  // Animation
  animFrame: number;
  animTimer: number;
  // Movement
  moveTarget: Vec2 | null;
  attackTargetId: number | null;
  attackMove: boolean; // A-move: attack anything encountered while moving
  // Selection
  selected: boolean;
  controlGroup: number; // 0 = none, 1-9 = group
}

// ── Map Objects ──────────────────────────────────────────────────────
export interface MapObject {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  spritePath: string;
  shadowPath?: string;
  blocking: boolean; // units can't walk through
  destructible: boolean;
  hp: number;
}

// ── Tilemap ──────────────────────────────────────────────────────────
export type TileType = 'sand' | 'ground' | 'stones' | 'water';

export const TILE_PATHS: Record<TileType, string[]> = {
  sand: Array.from({ length: 13 }, (_, i) => `${TILES}/PNG/tiles/sand/sand_${String(i).padStart(4, '0')}_tile.png`),
  ground: Array.from({ length: 13 }, (_, i) => `${TILES}/PNG/tiles/ground/ground_${String(i).padStart(4, '0')}_tile.png`),
  stones: Array.from({ length: 13 }, (_, i) => `${TILES}/PNG/tiles/stones/stones_${String(i).padStart(4, '0')}_tile.png`),
  water: Array.from({ length: 13 }, (_, i) => `${TILES}/PNG/tiles/water/water_${String(i).padStart(4, '0')}_tile.png`),
};

export const OBJECT_PATHS = {
  bus: `${TILES}/PNG/objects/1024/object_0000_bus.png`,
  cactus1: `${TILES}/PNG/objects/128/object_0002_cactus1.png`,
  rock3: `${TILES}/PNG/objects/128/object_0015_rock3.png`,
  box1: `${TILES}/PNG/objects/128/object_0019_box.png`,
  box2: `${TILES}/PNG/objects/128/object_0020_box.png`,
  box3: `${TILES}/PNG/objects/128/object_0021_box.png`,
  box4: `${TILES}/PNG/objects/128/object_0022_box.png`,
  cactus2: `${TILES}/PNG/objects/256/object_0001_cactus2.png`,
  rock2: `${TILES}/PNG/objects/256/object_0016_rock2.png`,
  rock1: `${TILES}/PNG/objects/256/object_0017_rock1.png`,
  well: `${TILES}/PNG/objects/256/object_0018_well.png`,
  tree1: `${TILES}/PNG/objects/512/object_0007_tree.png`,
  tree2: `${TILES}/PNG/objects/512/object_0006_tree2.png`,
  tree3: `${TILES}/PNG/objects/512/object_0005_tree3.png`,
  house: `${TILES}/PNG/objects/512/object_0008_house.png`,
  garage: `${TILES}/PNG/objects/512/object_0009_garage.png`,
  car1: `${TILES}/PNG/objects/512/object_0012_car1.png`,
  car2: `${TILES}/PNG/objects/512/object_0011_car2.png`,
  car3: `${TILES}/PNG/objects/512/object_0010_car3.png`,
  column1: `${TILES}/PNG/objects/512/object_0014_column1.png`,
  column2: `${TILES}/PNG/objects/512/object_0013_column2.png`,
};

// ── Explosion effects from main characters pack ──────────────────────
export const EXPLOSION_PATHS = {
  base: `${CHARS}/Explosion/PNG`,
};

// ── Tile walkability ─────────────────────────────────────────────────
// 0 = walkable full speed, 1 = slow (stones/rubble), 2 = impassable (water/walls)
export type TileWalkability = 0 | 1 | 2;

// ── Building System ──────────────────────────────────────────────────

export type BuildingRole = 'production' | 'economy' | 'defense' | 'research' | 'special' | 'decoration';
export type BuildingState = 'constructing' | 'active' | 'unpowered' | 'damaged' | 'destroyed';

export interface BuildingDef {
  key: string;
  name: string;
  role: BuildingRole;
  description: string;
  glbPath: string;
  /** Grid footprint in tiles (e.g. 2×2, 3×3) */
  footprint: { w: number; h: number };
  /** Stats */
  maxHp: number;
  /** Power consumed (negative = generates power) */
  powerCost: number;
  /** Build cost */
  creditCost: number;
  mineralCost: number;
  /** Build time in seconds */
  buildTime: number;
  /** Required building keys (tech tree prerequisites) */
  requires: string[];
  /** What this building unlocks (shown in UI) */
  unlocks?: string[];
  /** Supply cap increase (supply_depot) */
  supplyCap?: number;
  /** Mineral storage increase (silo) */
  storageCap?: number;
  /** Credits per second (refinery) */
  incomeRate?: number;
  /** Attack stats (turrets) */
  attackDamage?: number;
  attackRange?: number;
  attackCooldown?: number;
}

export interface RTSBuilding {
  id: number;
  def: BuildingDef;
  /** World position (top-left of footprint) */
  x: number;
  y: number;
  /** Grid cell (col, row) of top-left */
  gridCol: number;
  gridRow: number;
  hp: number;
  maxHp: number;
  state: BuildingState;
  /** 0..1 construction progress */
  buildProgress: number;
  /** Owning team */
  team: Team;
  /** For turrets: current attack cooldown */
  attackTimer: number;
  /** For turrets: current target */
  attackTargetId: number | null;
  /** For production buildings: queue of unit classes */
  productionQueue: string[];
  /** Current production progress (0..1) */
  productionProgress: number;
  /** Rally point for produced units */
  rallyPoint: Vec2 | null;
  /** Selected state for UI */
  selected: boolean;
}

// ── Mineral Deposits ─────────────────────────────────────────────────
export interface MineralDeposit {
  id: number;
  x: number;
  y: number;
  gridCol: number;
  gridRow: number;
  /** Remaining minerals */
  amount: number;
  maxAmount: number;
  /** Visual type based on planet */
  type: 'standard' | 'rare' | 'crystal';
}

// ── Planet Resources ─────────────────────────────────────────────────
export interface PlanetResources {
  credits: number;
  minerals: number;
  maxMinerals: number; // increased by silos
  power: number; // current power balance (generated - consumed)
  powerGenerated: number;
  powerConsumed: number;
  supplyCurrent: number; // current unit count
  supplyCap: number; // max unit count
  /** Credits per second from refineries */
  incomeRate: number;
}

// ── Building Definitions (from Dune catalog) ─────────────────────────
const B = '/assets/groundrts/dune-buildings';

export const BUILDING_DEFS: Record<string, BuildingDef> = {
  // ── Command Center (free, auto-placed) ────────────────────────
  command_center: {
    key: 'command_center',
    name: 'Command Center',
    role: 'special',
    description: 'HQ building. Required for all structures. Auto-placed on planet deploy.',
    glbPath: `${B}/command_center.glb`,
    footprint: { w: 3, h: 3 },
    maxHp: 2000,
    powerCost: 0,
    creditCost: 0,
    mineralCost: 0,
    buildTime: 0,
    requires: [],
    unlocks: ['wind_trap', 'barracks', 'gun_turret'],
    supplyCap: 10,
  },
  // ── Economy ───────────────────────────────────────────────────
  wind_trap: {
    key: 'wind_trap',
    name: 'Wind Trap',
    role: 'economy',
    description: 'Generates 10 power. Required for all other buildings.',
    glbPath: `${B}/wind_trap.glb`,
    footprint: { w: 2, h: 2 },
    maxHp: 400,
    powerCost: -10,
    creditCost: 150,
    mineralCost: 50,
    buildTime: 8,
    requires: ['command_center'],
    unlocks: ['refinery', 'light_factory', 'research_lab'],
  },
  power_plant: {
    key: 'power_plant',
    name: 'Fusion Reactor',
    role: 'economy',
    description: 'Generates 30 power. Advanced power generation.',
    glbPath: `${B}/power_plant.glb`,
    footprint: { w: 2, h: 2 },
    maxHp: 600,
    powerCost: -30,
    creditCost: 400,
    mineralCost: 200,
    buildTime: 15,
    requires: ['research_lab'],
  },
  refinery: {
    key: 'refinery',
    name: 'Spice Refinery',
    role: 'economy',
    description: 'Converts minerals to credits. +3 credits/sec.',
    glbPath: `${B}/refinery.glb`,
    footprint: { w: 3, h: 2 },
    maxHp: 800,
    powerCost: 5,
    creditCost: 300,
    mineralCost: 100,
    buildTime: 12,
    requires: ['wind_trap'],
    unlocks: ['harvester_bay', 'silo'],
    incomeRate: 3,
  },
  harvester_bay: {
    key: 'harvester_bay',
    name: 'Harvester Depot',
    role: 'economy',
    description: 'Deploys harvesters to mineral deposits.',
    glbPath: `${B}/harvester_bay.glb`,
    footprint: { w: 2, h: 2 },
    maxHp: 500,
    powerCost: 3,
    creditCost: 200,
    mineralCost: 100,
    buildTime: 10,
    requires: ['refinery'],
  },
  silo: {
    key: 'silo',
    name: 'Resource Silo',
    role: 'economy',
    description: 'Increases mineral storage by 500.',
    glbPath: `${B}/silo.glb`,
    footprint: { w: 1, h: 1 },
    maxHp: 300,
    powerCost: 1,
    creditCost: 100,
    mineralCost: 50,
    buildTime: 6,
    requires: ['refinery'],
    storageCap: 500,
  },
  supply_depot: {
    key: 'supply_depot',
    name: 'Supply Depot',
    role: 'economy',
    description: 'Increases unit supply cap by 10.',
    glbPath: `${B}/supply_depot.glb`,
    footprint: { w: 2, h: 1 },
    maxHp: 400,
    powerCost: 2,
    creditCost: 150,
    mineralCost: 75,
    buildTime: 8,
    requires: ['command_center'],
    supplyCap: 10,
  },
  // ── Production ────────────────────────────────────────────────
  barracks: {
    key: 'barracks',
    name: 'Barracks',
    role: 'production',
    description: 'Trains infantry and light ground units.',
    glbPath: `${B}/barracks.glb`,
    footprint: { w: 2, h: 2 },
    maxHp: 600,
    powerCost: 4,
    creditCost: 250,
    mineralCost: 100,
    buildTime: 10,
    requires: ['command_center'],
    unlocks: ['light_factory'],
  },
  light_factory: {
    key: 'light_factory',
    name: 'Light Vehicle Factory',
    role: 'production',
    description: 'Produces light vehicles and scouts.',
    glbPath: `${B}/light_factory.glb`,
    footprint: { w: 3, h: 2 },
    maxHp: 800,
    powerCost: 6,
    creditCost: 400,
    mineralCost: 200,
    buildTime: 15,
    requires: ['barracks', 'wind_trap'],
    unlocks: ['heavy_factory'],
  },
  heavy_factory: {
    key: 'heavy_factory',
    name: 'Heavy Vehicle Factory',
    role: 'production',
    description: 'Produces tanks, artillery, and siege units.',
    glbPath: `${B}/heavy_factory.glb`,
    footprint: { w: 3, h: 3 },
    maxHp: 1200,
    powerCost: 10,
    creditCost: 600,
    mineralCost: 400,
    buildTime: 20,
    requires: ['light_factory'],
    unlocks: ['mech_bay'],
  },
  mech_bay: {
    key: 'mech_bay',
    name: 'Mech Assembly Bay',
    role: 'production',
    description: 'Assembles heavy mech walkers.',
    glbPath: `${B}/mech_bay.glb`,
    footprint: { w: 3, h: 3 },
    maxHp: 1000,
    powerCost: 12,
    creditCost: 800,
    mineralCost: 500,
    buildTime: 25,
    requires: ['heavy_factory', 'tech_center'],
  },
  hangar: {
    key: 'hangar',
    name: 'Hangar Bay',
    role: 'production',
    description: 'Produces air units.',
    glbPath: `${B}/hangar.glb`,
    footprint: { w: 3, h: 2 },
    maxHp: 700,
    powerCost: 8,
    creditCost: 500,
    mineralCost: 300,
    buildTime: 18,
    requires: ['light_factory'],
  },
  starport: {
    key: 'starport',
    name: 'Starport',
    role: 'production',
    description: 'Calls in space reinforcements. Bridge to orbital layer.',
    glbPath: `${B}/starport.glb`,
    footprint: { w: 3, h: 3 },
    maxHp: 1500,
    powerCost: 15,
    creditCost: 1000,
    mineralCost: 600,
    buildTime: 30,
    requires: ['heavy_factory', 'tech_center'],
  },
  // ── Defense ──────────────────────────────────────────────────
  gun_turret: {
    key: 'gun_turret',
    name: 'Gun Turret',
    role: 'defense',
    description: 'Anti-ground auto-turret. Fast fire rate.',
    glbPath: `${B}/gun_turret.glb`,
    footprint: { w: 1, h: 1 },
    maxHp: 500,
    powerCost: 3,
    creditCost: 200,
    mineralCost: 100,
    buildTime: 8,
    requires: ['command_center'],
    unlocks: ['rocket_turret'],
    attackDamage: 15,
    attackRange: 250,
    attackCooldown: 0.8,
  },
  rocket_turret: {
    key: 'rocket_turret',
    name: 'Rocket Turret',
    role: 'defense',
    description: 'Anti-air missile launcher. Long range.',
    glbPath: `${B}/rocket_turret.glb`,
    footprint: { w: 1, h: 1 },
    maxHp: 400,
    powerCost: 4,
    creditCost: 300,
    mineralCost: 150,
    buildTime: 10,
    requires: ['gun_turret'],
    unlocks: ['laser_turret'],
    attackDamage: 25,
    attackRange: 350,
    attackCooldown: 1.5,
  },
  laser_turret: {
    key: 'laser_turret',
    name: 'Laser Turret',
    role: 'defense',
    description: 'High-energy beam. Effective vs armor.',
    glbPath: `${B}/laser_turret.glb`,
    footprint: { w: 1, h: 1 },
    maxHp: 600,
    powerCost: 8,
    creditCost: 500,
    mineralCost: 300,
    buildTime: 14,
    requires: ['rocket_turret', 'research_lab'],
    attackDamage: 40,
    attackRange: 300,
    attackCooldown: 2.0,
  },
  wall_straight: {
    key: 'wall_straight',
    name: 'Wall Segment',
    role: 'defense',
    description: 'Basic fortification wall. Blocks movement.',
    glbPath: `${B}/wall_straight.glb`,
    footprint: { w: 1, h: 1 },
    maxHp: 800,
    powerCost: 0,
    creditCost: 50,
    mineralCost: 30,
    buildTime: 3,
    requires: ['command_center'],
  },
  shield_pylon: {
    key: 'shield_pylon',
    name: 'Shield Pylon',
    role: 'defense',
    description: 'Projects energy shield over nearby buildings.',
    glbPath: `${B}/shield_pylon.glb`,
    footprint: { w: 1, h: 1 },
    maxHp: 300,
    powerCost: 10,
    creditCost: 600,
    mineralCost: 400,
    buildTime: 16,
    requires: ['tech_center'],
  },
  // ── Research ─────────────────────────────────────────────────
  research_lab: {
    key: 'research_lab',
    name: 'Research Lab',
    role: 'research',
    description: 'Unlocks tier 2 units and upgrades.',
    glbPath: `${B}/research_lab.glb`,
    footprint: { w: 2, h: 2 },
    maxHp: 500,
    powerCost: 6,
    creditCost: 350,
    mineralCost: 200,
    buildTime: 15,
    requires: ['wind_trap'],
    unlocks: ['tech_center', 'weapons_lab', 'armor_forge'],
  },
  tech_center: {
    key: 'tech_center',
    name: 'Technology Center',
    role: 'research',
    description: 'Unlocks tier 3 technologies.',
    glbPath: `${B}/tech_center.glb`,
    footprint: { w: 2, h: 2 },
    maxHp: 600,
    powerCost: 10,
    creditCost: 600,
    mineralCost: 400,
    buildTime: 20,
    requires: ['research_lab'],
    unlocks: ['mech_bay', 'starport', 'palace'],
  },
  weapons_lab: {
    key: 'weapons_lab',
    name: 'Weapons Lab',
    role: 'research',
    description: 'Upgrades unit damage (+15% per level).',
    glbPath: `${B}/weapons_lab.glb`,
    footprint: { w: 2, h: 2 },
    maxHp: 500,
    powerCost: 6,
    creditCost: 400,
    mineralCost: 250,
    buildTime: 15,
    requires: ['research_lab'],
  },
  armor_forge: {
    key: 'armor_forge',
    name: 'Armor Forge',
    role: 'research',
    description: 'Upgrades unit HP and armor (+15% per level).',
    glbPath: `${B}/armor_forge.glb`,
    footprint: { w: 2, h: 2 },
    maxHp: 500,
    powerCost: 6,
    creditCost: 400,
    mineralCost: 250,
    buildTime: 15,
    requires: ['research_lab'],
  },
  // ── Special ──────────────────────────────────────────────────
  palace: {
    key: 'palace',
    name: 'Palace',
    role: 'special',
    description: 'Faction superweapon. One per player.',
    glbPath: `${B}/palace.glb`,
    footprint: { w: 3, h: 3 },
    maxHp: 2500,
    powerCost: 20,
    creditCost: 1500,
    mineralCost: 1000,
    buildTime: 40,
    requires: ['tech_center'],
  },
  repair_pad: {
    key: 'repair_pad',
    name: 'Repair Pad',
    role: 'special',
    description: 'Heals nearby units. +5 HP/sec in radius.',
    glbPath: `${B}/repair_pad.glb`,
    footprint: { w: 2, h: 2 },
    maxHp: 400,
    powerCost: 5,
    creditCost: 300,
    mineralCost: 150,
    buildTime: 10,
    requires: ['light_factory'],
  },
};

/** Get all buildable building keys (excluding decoration). */
export function getBuildableBuildings(): string[] {
  return Object.keys(BUILDING_DEFS).filter((k) => BUILDING_DEFS[k].role !== 'decoration');
}

/** Check if a building's tech requirements are met. */
export function canBuild(key: string, ownedBuildings: string[]): boolean {
  const def = BUILDING_DEFS[key];
  if (!def) return false;
  return def.requires.every((req) => ownedBuildings.includes(req));
}

// ── Game State ───────────────────────────────────────────────────────
export interface GroundRTSState {
  units: Map<number, RTSUnit>;
  projectiles: Map<number, Projectile>;
  floatTexts: FloatText[];
  mapObjects: MapObject[];
  // ── Buildings ────────────────────────────────────────────────
  buildings: Map<number, RTSBuilding>;
  /** Grid tracking which building occupies each cell (buildingId or 0) */
  buildingGrid: number[][];
  // ── Resources ───────────────────────────────────────────────
  resources: PlanetResources;
  mineralDeposits: MineralDeposit[];
  // Tile grid (indices into TILE_PATHS[type])
  tileGrid: number[][];
  tileType: TileType;
  tileCols: number;
  tileRows: number;
  tileSize: number; // pixels per tile
  mapWidth: number; // total pixels
  mapHeight: number;
  // Walkability grid (same dimensions as tileGrid)
  walkGrid: TileWalkability[][];
  // Wave system
  wave: number;
  waveTimer: number;
  waveInterval: number; // seconds between waves
  waveActive: boolean;
  enemiesAlive: number;
  // Scoring
  kills: number;
  gameTime: number;
  gameOver: boolean;
  victory: boolean;
  // IDs
  nextId: number;
  // Current level
  level: number;
}

// ── Wave Configuration ───────────────────────────────────────────────
export interface WaveConfig {
  wave: number;
  enemies: Array<{ unitClass: UnitClass; count: number }>;
}

export function getWaveConfig(wave: number): WaveConfig {
  const w = wave;
  if (w <= 3) {
    // Tier 1: basic zombies
    return {
      wave: w,
      enemies: [
        { unitClass: 'zombie_f1', count: 2 + w },
        { unitClass: 'zombie_m1', count: 1 + w },
      ],
    };
  }
  if (w <= 6) {
    // Tier 2: mix basic + armored
    return {
      wave: w,
      enemies: [
        { unitClass: 'zombie_m2', count: w },
        { unitClass: 'zombie_army', count: w - 2 },
        { unitClass: 'zombie_cop', count: Math.max(1, w - 3) },
      ],
    };
  }
  if (w <= 9) {
    // Tier 3: mutants + armored
    return {
      wave: w,
      enemies: [
        { unitClass: 'zombie_army', count: w - 3 },
        { unitClass: 'monster_big_hands', count: Math.max(1, w - 5) },
        { unitClass: 'monster_big_head', count: Math.max(1, w - 6) },
      ],
    };
  }
  if (w <= 12) {
    // Tier 4: boss + swarm
    return {
      wave: w,
      enemies: [
        { unitClass: 'monster_big_hands', count: w - 6 },
        { unitClass: 'monster_big_head', count: w - 7 },
        { unitClass: 'boss1', count: 1 },
      ],
    };
  }
  // Tier 5: mega waves
  return {
    wave: w,
    enemies: [
      { unitClass: 'zombie_army', count: w },
      { unitClass: 'monster_big_hands', count: Math.floor(w / 2) },
      { unitClass: 'boss1', count: 1 },
      { unitClass: 'boss2', count: w > 14 ? 1 : 0 },
    ],
  };
}
