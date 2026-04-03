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
  /** Number of frames */
  frames: number;
  /** Seconds per frame */
  frameDuration: number;
  /** Loop or play-once */
  loop: boolean;
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
  | 'megaboss';

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
    frames,
    frameDuration: dur,
    loop,
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
  return { basePath: `${ZOMBIES}/Zombies/PNG Animations/${level}/${variant}/${action}`, prefix, frames, frameDuration: dur, loop };
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
  return { basePath: `${MONSTERS}/Monsters/PNG Animations/${level}/${variant}/${action}`, prefix, frames, frameDuration: dur, loop };
}

// ── Player Unit Definitions ──────────────────────────────────────────
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
  const walkPrefix = weapon === 'Gun_Shot' ? 'Gun_Shot_' : 'Walk_';
  const atkPrefix = weapon === 'Gun_Shot' ? 'Gun_Shot_' : `${weapon}_`;
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
    aggroRange: range * 1.5,
    spriteSize: 64,
    tier: 0,
    anims: {
      idle: charAnim(gender, idleFolder, 'Idle_', 9, 0.12, true),
      walk: charAnim(gender, walkFolder, walkPrefix.replace(/_$/, '_'), 9, 0.08, true),
      attack: charAnim(gender, attackFolder, atkPrefix.replace(/_$/, '_'), 9, 0.07, false),
      death: charAnim(gender, 'Death', 'Death_', 6, 0.1, false),
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
  facing: number; // radians
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

// ── Game State ───────────────────────────────────────────────────────
export interface GroundRTSState {
  units: Map<number, RTSUnit>;
  projectiles: Map<number, Projectile>;
  floatTexts: FloatText[];
  mapObjects: MapObject[];
  // Tile grid (indices into TILE_PATHS[type])
  tileGrid: number[][];
  tileType: TileType;
  tileCols: number;
  tileRows: number;
  tileSize: number; // pixels per tile
  mapWidth: number; // total pixels
  mapHeight: number;
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
