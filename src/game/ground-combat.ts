/**
 * ground-combat.ts — On-planet souls-like combat engine.
 *
 * 6 playable character classes, each with distinct stats, weapons, and
 * class-specific mechanics for variety and replayability.
 *
 * Combo system: light attacks chain combo1 → combo2 → combo3 (finisher).
 * Each hit extends the combo timer. Finisher deals 2× damage + special anim.
 *
 * Planet-specific waves: each planet type spawns different enemy compositions
 * across escalating waves for consistent difficulty progression.
 *
 * Focus: fun > balance tweaks — every class should feel capable and different.
 */

import type { PlanetType } from './space-types';

// ── Vector helpers ────────────────────────────────────────────────
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

function v3len(v: Vec3) {
  return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
}
function v3dist(a: Vec3, b: Vec3) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}
function v3norm(v: Vec3): Vec3 {
  const l = v3len(v);
  return l > 0.0001 ? { x: v.x / l, y: v.y / l, z: v.z / l } : { x: 0, y: 0, z: 0 };
}

// ── Character classes ─────────────────────────────────────────────
export type CharacterClass = 'warrior' | 'berserker' | 'ranger' | 'mage' | 'rogue' | 'gunslinger';

export interface ClassStats {
  displayName: string;
  icon: string;
  description: string;
  maxHp: number;
  maxStamina: number;
  baseSpeed: number;
  sprintSpeed: number;
  attackDamage: number; // light attack
  heavyDamage: number; // heavy / finisher
  attackRange: number;
  heavyRange: number;
  attackCooldown: number; // stateTimer for light attack
  heavyCooldown: number;
  attackStamina: number;
  heavyStamina: number;
  defense: number; // flat damage reduction on block
  parryWindow: number; // seconds of parry window when block is pressed
  /** Weapon key used to select ANIM_SETS entry */
  weapon: 'sword' | 'bow' | 'staff' | 'spear' | 'rifle';
  /** Class-specific passive text shown in HUD */
  passive: string;
}

export const CLASS_STATS: Record<CharacterClass, ClassStats> = {
  warrior: {
    displayName: 'Warrior',
    icon: '⚔️',
    description: 'Sword & shield: best block/parry, 3-hit combo, parry restores stamina.',
    passive: 'Perfect Parry restores 30 stamina',
    weapon: 'sword',
    maxHp: 200,
    maxStamina: 100,
    baseSpeed: 5.0,
    sprintSpeed: 8.5,
    attackDamage: 18,
    heavyDamage: 45,
    attackRange: 2.2,
    heavyRange: 2.8,
    attackCooldown: 0.35,
    heavyCooldown: 0.6,
    attackStamina: 12,
    heavyStamina: 28,
    defense: 8,
    parryWindow: 0.22,
  },
  berserker: {
    displayName: 'Berserker',
    icon: '🪓',
    description: 'Greatsword: massive single-target damage, jump & slide attacks.',
    passive: 'Combo3 knocks enemies back',
    weapon: 'spear', // maps to greatsword animations via renderer
    maxHp: 170,
    maxStamina: 80,
    baseSpeed: 5.5,
    sprintSpeed: 9.0,
    attackDamage: 28,
    heavyDamage: 70,
    attackRange: 2.8,
    heavyRange: 3.6,
    attackCooldown: 0.5,
    heavyCooldown: 0.75,
    attackStamina: 18,
    heavyStamina: 35,
    defense: 2,
    parryWindow: 0.1,
  },
  ranger: {
    displayName: 'Ranger',
    icon: '🏹',
    description: 'Longbow: kite enemies, dodge-shoot combo, strafe attack.',
    passive: 'Shoot while dodging deals 1.5× damage',
    weapon: 'bow',
    maxHp: 120,
    maxStamina: 120,
    baseSpeed: 6.0,
    sprintSpeed: 9.5,
    attackDamage: 24,
    heavyDamage: 52,
    attackRange: 18,
    heavyRange: 22, // ranged: large range
    attackCooldown: 0.45,
    heavyCooldown: 0.8,
    attackStamina: 14,
    heavyStamina: 28,
    defense: 2,
    parryWindow: 0.08,
  },
  mage: {
    displayName: 'Mage',
    icon: '🔮',
    description: 'Staff: AoE heavy blast hits ALL nearby enemies. Spell combo chains.',
    passive: 'Heavy attack hits all enemies in 4m radius',
    weapon: 'staff',
    maxHp: 100,
    maxStamina: 130,
    baseSpeed: 4.5,
    sprintSpeed: 7.0,
    attackDamage: 32,
    heavyDamage: 55,
    attackRange: 8,
    heavyRange: 4.5, // AoE radius for heavy
    attackCooldown: 0.5,
    heavyCooldown: 1.0,
    attackStamina: 16,
    heavyStamina: 40,
    defense: 0,
    parryWindow: 0.06,
  },
  rogue: {
    displayName: 'Rogue',
    icon: '🗡️',
    description: 'Dual blades: fastest attack speed, backstab 2× damage, acrobatic dodge.',
    passive: 'Backstab (behind enemy) = 2× damage',
    weapon: 'sword',
    maxHp: 130,
    maxStamina: 90,
    baseSpeed: 7.0,
    sprintSpeed: 10.0,
    attackDamage: 14,
    heavyDamage: 30,
    attackRange: 1.8,
    heavyRange: 2.4,
    attackCooldown: 0.25,
    heavyCooldown: 0.45,
    attackStamina: 8,
    heavyStamina: 18,
    defense: 2,
    parryWindow: 0.12,
  },
  gunslinger: {
    displayName: 'Gunslinger',
    icon: '🔫',
    description: 'Rifle: mid-range burst fire (3 shots), cover-roll, suppress.',
    passive: 'Burst: light attack fires 3 shots rapidly',
    weapon: 'rifle',
    maxHp: 150,
    maxStamina: 100,
    baseSpeed: 5.5,
    sprintSpeed: 8.5,
    attackDamage: 22,
    heavyDamage: 50,
    attackRange: 14,
    heavyRange: 16,
    attackCooldown: 0.55,
    heavyCooldown: 0.8,
    attackStamina: 10,
    heavyStamina: 25,
    defense: 3,
    parryWindow: 0.1,
  },
};

// ── Constants ─────────────────────────────────────────────────────
const DODGE_SPEED = 12.0;
const DODGE_DURATION = 0.35;
const DODGE_IFRAMES = 0.25;
const DODGE_STAMINA = 18;
const BLOCK_STAMINA_SEC = 10;
const PARRY_STUN = 0.55; // stun on perfect parry
const STAMINA_REGEN = 28; // per second
const STAMINA_REGEN_DELAY = 0.75; // seconds after last use
const LOCK_ON_RANGE = 22;
const COMBO_WINDOW = 0.9; // seconds to continue combo after last hit

// ── Enemy constants ───────────────────────────────────────────────
const ENEMY_PATROL_SPD = 2.0;
const ENEMY_LEASH_RNG = 28;
const ENEMY_ATTACK_CD = 1.8;

// ── Types ─────────────────────────────────────────────────────────
export type CombatState = 'idle' | 'attacking' | 'heavy_attacking' | 'blocking' | 'dodging' | 'stunned' | 'parrying' | 'hit';
export type EnemyAIState = 'idle' | 'patrol' | 'chase' | 'attack' | 'stunned' | 'dead';
export type EnemyType = 'melee' | 'ranged' | 'heavy' | 'stalker' | 'titan' | 'boss';

export interface GroundPlayer {
  pos: Vec3;
  facing: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  staminaRegenTimer: number;
  combatState: CombatState;
  stateTimer: number;
  dodgeDir: Vec3;
  iframes: boolean;
  lockOnTargetId: number | null;
  animKey: string;
  weaponType: 'sword' | 'bow' | 'staff' | 'spear' | 'rifle';
  dead: boolean;
  // Character class system
  characterClass: CharacterClass;
  // Combo chain
  comboCount: number; // 0-3 (0=no combo, 1=first hit, 2=second, 3=finisher)
  comboTimer: number; // countdown to reset combo
  burstCount: number; // gunslinger burst fire counter
}

export interface GroundEnemy {
  id: number;
  pos: Vec3;
  facing: number;
  hp: number;
  maxHp: number;
  aiState: EnemyAIState;
  stateTimer: number;
  patrolOrigin: Vec3;
  patrolTarget: Vec3;
  attackCooldown: number;
  stunTimer: number;
  damage: number;
  speed: number;
  detectRange: number;
  attackRange: number;
  enemyType: EnemyType;
  animKey: string;
  characterModelIdx: number;
  weaponType: 'sword' | 'bow' | 'staff' | 'spear';
  hitFlash: number;
  /** Ranged enemies keep this minimum distance */
  preferredRange: number;
}

export interface DamageNumber {
  pos: Vec3;
  value: number;
  color: string;
  age: number;
  vy: number;
  label?: string; // optional text like 'PARRY!' 'COMBO!' 'CRIT!'
}

export interface GroundCombatState {
  player: GroundPlayer;
  enemies: GroundEnemy[];
  damageNumbers: DamageNumber[];
  planetType: PlanetType;
  missionActive: boolean;
  missionObjective: string;
  missionProgress: number;
  missionGoal: number;
  wave: number;
  maxWaves: number;
  waveCleared: boolean; // all enemies dead → show "Wave N cleared"
  waveClearTimer: number; // countdown before spawning next wave
  gameTime: number;
  paused: boolean;
  result: 'none' | 'win' | 'lose';
}

export interface GroundInput {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  dodge: boolean;
  attack: boolean;
  heavyAttack: boolean;
  block: boolean;
  lockOn: boolean;
  cameraYaw: number;
}

// ── Init ──────────────────────────────────────────────────────────
let nextEnemyId = 1;

export function createInitialState(planetType: PlanetType, characterClass: CharacterClass = 'warrior'): GroundCombatState {
  const cls = CLASS_STATS[characterClass];
  return {
    player: {
      pos: { x: 0, y: 0, z: 0 },
      facing: 0,
      hp: cls.maxHp,
      maxHp: cls.maxHp,
      stamina: cls.maxStamina,
      maxStamina: cls.maxStamina,
      staminaRegenTimer: 0,
      combatState: 'idle',
      stateTimer: 0,
      dodgeDir: { x: 0, y: 0, z: 0 },
      iframes: false,
      lockOnTargetId: null,
      animKey: 'idle',
      weaponType: cls.weapon,
      dead: false,
      characterClass,
      comboCount: 0,
      comboTimer: 0,
      burstCount: 0,
    },
    enemies: [],
    damageNumbers: [],
    planetType,
    missionActive: false,
    missionObjective: '',
    missionProgress: 0,
    missionGoal: 0,
    wave: 0,
    maxWaves: 4,
    waveCleared: false,
    waveClearTimer: 0,
    gameTime: 0,
    paused: false,
    result: 'none',
  };
}

// ── Enemy spawn ───────────────────────────────────────────────────
/** Per planet type: wave compositions.  Each entry = one wave. */
const PLANET_WAVES: Record<PlanetType, EnemyType[][]> = {
  volcanic: [
    ['melee', 'melee', 'melee'],
    ['melee', 'heavy', 'ranged'],
    ['heavy', 'heavy', 'stalker'],
    ['titan', 'melee', 'melee', 'ranged'],
  ],
  oceanic: [
    ['ranged', 'ranged', 'melee'],
    ['ranged', 'ranged', 'stalker'],
    ['heavy', 'ranged', 'ranged', 'melee'],
    ['boss', 'ranged', 'ranged'],
  ],
  barren: [
    ['melee', 'melee', 'ranged'],
    ['stalker', 'melee', 'melee'],
    ['heavy', 'stalker', 'ranged'],
    ['titan', 'stalker', 'stalker'],
  ],
  crystalline: [
    ['ranged', 'melee', 'melee'],
    ['heavy', 'ranged', 'melee', 'melee'],
    ['stalker', 'stalker', 'ranged'],
    ['boss', 'stalker', 'melee'],
  ],
  gas_giant: [
    ['stalker', 'melee', 'melee'],
    ['stalker', 'stalker', 'ranged'],
    ['heavy', 'stalker', 'stalker'],
    ['titan', 'stalker', 'ranged'],
  ],
  frozen: [
    ['heavy', 'melee', 'melee'],
    ['heavy', 'heavy', 'melee'],
    ['heavy', 'heavy', 'ranged'],
    ['titan', 'heavy', 'melee'],
  ],
  plasma: [
    ['ranged', 'ranged', 'ranged', 'melee'],
    ['stalker', 'ranged', 'ranged'],
    ['heavy', 'stalker', 'ranged'],
    ['boss', 'heavy', 'ranged'],
  ],
  fungal: [
    ['melee', 'melee', 'melee', 'melee'],
    ['melee', 'melee', 'stalker', 'stalker'],
    ['heavy', 'stalker', 'stalker', 'melee'],
    ['titan', 'melee', 'stalker', 'ranged'],
  ],
  metallic: [
    ['heavy', 'melee', 'ranged'],
    ['heavy', 'heavy', 'stalker'],
    ['titan', 'heavy', 'ranged'],
    ['boss', 'titan', 'melee'],
  ],
  dark_matter: [
    ['stalker', 'stalker', 'ranged'],
    ['stalker', 'stalker', 'heavy'],
    ['titan', 'stalker', 'ranged'],
    ['boss', 'titan', 'stalker'],
  ],
};

const ENEMY_CONFIG: Record<
  EnemyType,
  {
    hp: number;
    damage: number;
    speed: number;
    attackRange: number;
    preferredRange: number;
    attackCd: number;
    stunDuration: number;
    weapon: 'sword' | 'bow' | 'staff' | 'spear';
    detectRange: number;
  }
> = {
  melee: {
    hp: 75,
    damage: 14,
    speed: 3.8,
    attackRange: 2.5,
    preferredRange: 0,
    attackCd: 1.8,
    stunDuration: 0.25,
    weapon: 'sword',
    detectRange: 14,
  },
  ranged: {
    hp: 50,
    damage: 10,
    speed: 2.8,
    attackRange: 16,
    preferredRange: 10,
    attackCd: 2.2,
    stunDuration: 0.2,
    weapon: 'bow',
    detectRange: 20,
  },
  heavy: {
    hp: 180,
    damage: 28,
    speed: 2.2,
    attackRange: 3.0,
    preferredRange: 0,
    attackCd: 2.5,
    stunDuration: 0.15,
    weapon: 'spear',
    detectRange: 12,
  },
  stalker: {
    hp: 90,
    damage: 18,
    speed: 5.0,
    attackRange: 2.2,
    preferredRange: 0,
    attackCd: 1.2,
    stunDuration: 0.3,
    weapon: 'sword',
    detectRange: 18,
  },
  titan: {
    hp: 350,
    damage: 36,
    speed: 1.8,
    attackRange: 3.5,
    preferredRange: 0,
    attackCd: 3.0,
    stunDuration: 0.1,
    weapon: 'spear',
    detectRange: 14,
  },
  boss: {
    hp: 550,
    damage: 44,
    speed: 3.0,
    attackRange: 3.0,
    preferredRange: 0,
    attackCd: 2.0,
    stunDuration: 0.12,
    weapon: 'spear',
    detectRange: 25,
  },
};

export function spawnEnemy(state: GroundCombatState, pos: Vec3, type: EnemyType = 'melee', modelIdx = 0): GroundEnemy {
  const cfg = ENEMY_CONFIG[type];
  const e: GroundEnemy = {
    id: nextEnemyId++,
    pos: { ...pos },
    facing: Math.random() * Math.PI * 2,
    hp: cfg.hp,
    maxHp: cfg.hp,
    aiState: 'patrol',
    stateTimer: 0,
    patrolOrigin: { ...pos },
    patrolTarget: { x: pos.x + (Math.random() - 0.5) * 12, y: 0, z: pos.z + (Math.random() - 0.5) * 12 },
    attackCooldown: cfg.attackCd * Math.random(), // stagger initial attacks
    stunTimer: 0,
    damage: cfg.damage,
    speed: cfg.speed,
    detectRange: cfg.detectRange,
    attackRange: cfg.attackRange,
    preferredRange: cfg.preferredRange,
    enemyType: type,
    animKey: 'idle',
    characterModelIdx: modelIdx,
    weaponType: cfg.weapon,
    hitFlash: 0,
  };
  state.enemies.push(e);
  return e;
}

/** Spawn a full wave for the current planet */
export function spawnWave(state: GroundCombatState): void {
  const waveIdx = state.wave;
  const waves = PLANET_WAVES[state.planetType] ?? PLANET_WAVES.barren;
  const composition = waves[Math.min(waveIdx, waves.length - 1)];

  // Scale difficulty on repeating last wave
  const scaleMult = waveIdx >= waves.length ? 1 + (waveIdx - waves.length + 1) * 0.25 : 1;

  const count = composition.length;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const radius = 16 + Math.random() * 14;
    const pos = { x: Math.cos(angle) * radius, y: 0, z: Math.sin(angle) * radius };
    const type = composition[i];
    const enemy = spawnEnemy(state, pos, type, 6 + (i % 6));

    // Scale stats on hard waves
    if (scaleMult > 1) {
      enemy.hp = Math.round(enemy.hp * scaleMult);
      enemy.maxHp = enemy.hp;
      enemy.damage = Math.round(enemy.damage * scaleMult);
    }
  }

  state.missionActive = true;
  state.missionObjective = `Wave ${waveIdx + 1} — Eliminate all hostiles`;
  state.missionGoal = 0; // "eliminate all" win condition
  state.waveCleared = false;
}

// ── Main update ───────────────────────────────────────────────────
export function updateGroundCombat(state: GroundCombatState, input: GroundInput, dt: number): void {
  if (state.paused || state.result !== 'none') return;
  state.gameTime += dt;

  const p = state.player;
  const cls = CLASS_STATS[p.characterClass];

  if (p.dead) {
    p.animKey = 'death';
    state.result = 'lose';
    return;
  }

  // ── Wave clear → next wave countdown ──────────────────────────
  if (state.waveCleared) {
    state.waveClearTimer -= dt;
    if (state.waveClearTimer <= 0) {
      state.wave++;
      state.enemies = state.enemies.filter((e) => e.aiState !== 'dead');
      if (state.wave >= state.maxWaves) {
        state.result = 'win';
        return;
      }
      spawnWave(state);
    }
    return; // pause combat during wave clear screen
  }

  // ── Stamina regen ─────────────────────────────────────────────
  if (p.staminaRegenTimer > 0) {
    p.staminaRegenTimer -= dt;
  } else if (p.combatState !== 'blocking') {
    p.stamina = Math.min(p.maxStamina, p.stamina + STAMINA_REGEN * dt);
  }

  // ── Combo timer decay ─────────────────────────────────────────
  if (p.comboTimer > 0) {
    p.comboTimer -= dt;
    if (p.comboTimer <= 0) p.comboCount = 0;
  }

  // ── Combat state timer ────────────────────────────────────────
  if (p.stateTimer > 0) {
    p.stateTimer -= dt;
    if (p.stateTimer <= 0) {
      p.combatState = 'idle';
      p.iframes = false;
    }
  }

  // ── Lock-on ───────────────────────────────────────────────────
  if (input.lockOn) {
    if (p.lockOnTargetId !== null) {
      p.lockOnTargetId = null;
    } else {
      let best: GroundEnemy | null = null,
        bestDist = LOCK_ON_RANGE;
      for (const e of state.enemies) {
        if (e.aiState === 'dead') continue;
        const d = v3dist(p.pos, e.pos);
        if (d < bestDist) {
          bestDist = d;
          best = e;
        }
      }
      if (best) p.lockOnTargetId = best.id;
    }
  }
  if (p.lockOnTargetId !== null) {
    const t = state.enemies.find((e) => e.id === p.lockOnTargetId);
    if (!t || t.aiState === 'dead' || v3dist(p.pos, t.pos) > LOCK_ON_RANGE * 1.5) {
      p.lockOnTargetId = null;
    }
  }

  // ── Movement ──────────────────────────────────────────────────
  if (p.combatState === 'idle' || p.combatState === 'blocking') {
    const mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const mz = (input.forward ? 1 : 0) - (input.back ? 1 : 0);
    if (mx !== 0 || mz !== 0) {
      const sin = Math.sin(input.cameraYaw);
      const cos = Math.cos(input.cameraYaw);
      const dir = v3norm({ x: mx * cos - mz * sin, y: 0, z: mx * sin + mz * cos });
      const spd = input.sprint && p.stamina > 0 ? cls.sprintSpeed : cls.baseSpeed;
      p.pos.x += dir.x * spd * dt;
      p.pos.z += dir.z * spd * dt;
      p.facing = Math.atan2(dir.x, dir.z);
      // Strafe anim when locked on and strafing sideways
      if (p.lockOnTargetId !== null && Math.abs(mx) > 0 && Math.abs(mz) < 0.5) {
        p.animKey = 'strafe';
      } else {
        p.animKey = input.sprint ? 'run' : 'walk';
      }
      if (input.sprint) {
        p.stamina -= 15 * dt;
        p.staminaRegenTimer = STAMINA_REGEN_DELAY;
      }
    } else {
      p.animKey = p.combatState === 'blocking' ? 'block_idle' : 'idle';
    }
    // Injured locomotion override
    if (p.hp / p.maxHp < 0.12) {
      if (p.animKey === 'idle') p.animKey = 'injured_idle';
      else if (p.animKey === 'walk') p.animKey = 'injured_walk';
      else if (p.animKey === 'run') p.animKey = 'injured_run';
    }
  }

  // Face lock-on target
  if (p.lockOnTargetId !== null) {
    const t = state.enemies.find((e) => e.id === p.lockOnTargetId);
    if (t) p.facing = Math.atan2(t.pos.x - p.pos.x, t.pos.z - p.pos.z);
  }

  // ── Dodge ─────────────────────────────────────────────────────
  if (input.dodge && p.combatState === 'idle' && p.stamina >= DODGE_STAMINA) {
    p.combatState = 'dodging';
    p.stateTimer = DODGE_DURATION;
    p.iframes = true;
    p.stamina -= DODGE_STAMINA;
    p.staminaRegenTimer = STAMINA_REGEN_DELAY;
    const mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const mz = (input.forward ? 1 : 0) - (input.back ? 1 : 0);
    const sin = Math.sin(input.cameraYaw),
      cos = Math.cos(input.cameraYaw);
    if (mx !== 0 || mz !== 0) {
      p.dodgeDir = v3norm({ x: mx * cos - mz * sin, y: 0, z: mx * sin + mz * cos });
    } else {
      p.dodgeDir = { x: Math.sin(p.facing), y: 0, z: Math.cos(p.facing) };
    }
    p.animKey = 'dodge';
  }
  if (p.combatState === 'dodging') {
    p.pos.x += p.dodgeDir.x * DODGE_SPEED * dt;
    p.pos.z += p.dodgeDir.z * DODGE_SPEED * dt;
    if (p.stateTimer < DODGE_DURATION - DODGE_IFRAMES) p.iframes = false;
  }

  // ── Block / Parry ─────────────────────────────────────────────
  if (input.block && p.combatState === 'idle' && p.stamina > 0) {
    p.combatState = 'blocking';
    p.stateTimer = cls.parryWindow;
    p.animKey = 'block';
  }
  if (p.combatState === 'blocking') {
    p.stamina -= BLOCK_STAMINA_SEC * dt;
    p.staminaRegenTimer = STAMINA_REGEN_DELAY;
    if (p.stamina <= 0 || !input.block) {
      p.combatState = 'idle';
      p.stateTimer = 0;
    }
  }

  // ── Attack (combo chain) ──────────────────────────────────────
  const canAttack = p.combatState === 'idle' && p.stamina >= cls.attackStamina;

  if (input.heavyAttack && p.combatState === 'idle' && p.stamina >= cls.heavyStamina) {
    // Heavy resets combo
    p.comboCount = 0;
    p.comboTimer = 0;
    p.combatState = 'heavy_attacking';
    p.stateTimer = cls.heavyCooldown;
    p.stamina -= cls.heavyStamina;
    p.staminaRegenTimer = STAMINA_REGEN_DELAY;
    // Mage: cast anim; Ranger: aimed shot; Gunslinger: heavy shot; others: heavy_attack
    p.animKey = p.characterClass === 'mage' ? 'cast' : p.characterClass === 'ranger' ? 'shoot' : 'heavy_attack';
  } else if (input.attack && canAttack) {
    p.combatState = 'attacking';
    p.stamina -= cls.attackStamina;
    p.staminaRegenTimer = STAMINA_REGEN_DELAY;
    p.stateTimer = cls.attackCooldown;

    // Advance combo
    p.comboCount = Math.min(3, p.comboCount + 1);
    p.comboTimer = COMBO_WINDOW;

    // Pick animation for this combo step
    if (p.comboCount === 3)
      p.animKey = 'combo3'; // finisher
    else if (p.comboCount === 2) p.animKey = 'combo2';
    else p.animKey = 'attack';

    // Gunslinger: burst — each light attack fires once but counts as 3 hits
    if (p.characterClass === 'gunslinger') {
      p.burstCount = 3;
      p.animKey = 'shoot';
    }
  }

  // ── Hit detection: player → enemies ───────────────────────────
  const inAttackWindow =
    (p.combatState === 'attacking' && p.stateTimer < cls.attackCooldown * 0.7 && p.stateTimer > cls.attackCooldown * 0.3) ||
    (p.combatState === 'heavy_attacking' && p.stateTimer < cls.heavyCooldown * 0.7 && p.stateTimer > cls.heavyCooldown * 0.3);

  if (inAttackWindow) {
    const isHeavy = p.combatState === 'heavy_attacking';
    const range = isHeavy ? cls.heavyRange : cls.attackRange;
    const fwd: Vec3 = { x: Math.sin(p.facing), y: 0, z: Math.cos(p.facing) };

    for (const e of state.enemies) {
      if (e.aiState === 'dead') continue;
      const dx = e.pos.x - p.pos.x;
      const dz = e.pos.z - p.pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Mage heavy: full AoE (no cone check needed)
      if (p.characterClass === 'mage' && isHeavy) {
        if (dist > range) continue;
      } else {
        if (dist > range) continue;
        const dot = (dx * fwd.x + dz * fwd.z) / (dist + 0.001);
        if (dot < 0.3) continue; // 150° frontal cone
      }

      // Base damage
      let dmg = isHeavy ? cls.heavyDamage : cls.attackDamage;

      // Rogue backstab: 2× if attacking from behind
      if (p.characterClass === 'rogue' && !isHeavy) {
        const toPlayer = Math.atan2(p.pos.x - e.pos.x, p.pos.z - e.pos.z);
        const behindAngle = Math.abs(((toPlayer - e.facing + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (behindAngle < 0.7) {
          dmg *= 2;
        }
      }

      // Berserker combo3 knockback
      if (p.characterClass === 'berserker' && p.comboCount === 3) {
        const angle = Math.atan2(e.pos.x - p.pos.x, e.pos.z - p.pos.z);
        e.pos.x += Math.sin(angle) * 2.5;
        e.pos.z += Math.cos(angle) * 2.5;
      }

      // Combo finisher bonus
      if (p.comboCount === 3 && !isHeavy) dmg = Math.round(dmg * 1.8);

      // Gunslinger burst
      const hits = p.characterClass === 'gunslinger' && !isHeavy ? 3 : 1;
      for (let b = 0; b < hits; b++) applyDamageToEnemy(state, e, dmg, b === 0);
    }
    // Reset combo count after finisher
    if (p.comboCount === 3) p.comboCount = 0;
  }

  // ── Enemy AI ──────────────────────────────────────────────────
  for (const e of state.enemies) {
    if (e.aiState === 'dead') continue;
    e.hitFlash = Math.max(0, e.hitFlash - dt * 4);

    if (e.stunTimer > 0) {
      e.stunTimer -= dt;
      e.aiState = 'stunned';
      e.animKey = 'hit';
      continue;
    }

    const distToPlayer = v3dist(e.pos, p.pos);

    switch (e.aiState) {
      case 'idle':
      case 'patrol': {
        const dx = e.patrolTarget.x - e.pos.x;
        const dz = e.patrolTarget.z - e.pos.z;
        const dl = Math.sqrt(dx * dx + dz * dz);
        if (dl < 1) {
          e.patrolTarget = {
            x: e.patrolOrigin.x + (Math.random() - 0.5) * 12,
            y: 0,
            z: e.patrolOrigin.z + (Math.random() - 0.5) * 12,
          };
        } else {
          e.pos.x += (dx / dl) * ENEMY_PATROL_SPD * dt;
          e.pos.z += (dz / dl) * ENEMY_PATROL_SPD * dt;
          e.facing = Math.atan2(dx, dz);
        }
        e.animKey = 'walk';
        if (distToPlayer < e.detectRange && !p.dead) e.aiState = 'chase';
        break;
      }
      case 'chase': {
        if (distToPlayer > ENEMY_LEASH_RNG || p.dead) {
          e.aiState = 'patrol';
          break;
        }
        const dx = p.pos.x - e.pos.x;
        const dz = p.pos.z - e.pos.z;
        const dl = Math.sqrt(dx * dx + dz * dz);
        if (dl > 0.1) {
          // Ranged enemies keep preferred range; advance if too far, retreat if too close
          const tooClose = e.preferredRange > 0 && distToPlayer < e.preferredRange * 0.6;
          if (!tooClose) {
            e.pos.x += (dx / dl) * e.speed * dt;
            e.pos.z += (dz / dl) * e.speed * dt;
          } else {
            // Retreat: move away from player
            e.pos.x -= (dx / dl) * e.speed * 0.5 * dt;
            e.pos.z -= (dz / dl) * e.speed * 0.5 * dt;
          }
          e.facing = Math.atan2(dx, dz);
        }
        e.animKey = distToPlayer > 6 ? 'run' : 'walk';
        // Stalkers circle around player
        if (e.enemyType === 'stalker') {
          const perp = { x: -dz / (dl + 0.001), y: 0, z: dx / (dl + 0.001) };
          e.pos.x += perp.x * e.speed * 0.6 * dt;
          e.pos.z += perp.z * e.speed * 0.6 * dt;
        }
        if (distToPlayer < e.attackRange || (e.preferredRange > 0 && !tooClose(distToPlayer, e))) {
          e.aiState = 'attack';
          e.attackCooldown = ENEMY_ATTACK_CD * (0.7 + Math.random() * 0.6);
        }
        break;
      }
      case 'attack': {
        e.facing = Math.atan2(p.pos.x - e.pos.x, p.pos.z - e.pos.z);
        e.attackCooldown -= dt;
        if (e.attackCooldown <= 0) {
          if (distToPlayer < e.attackRange + 1.0) attemptEnemyAttack(state, e);
          e.attackCooldown = ENEMY_ATTACK_CD * (0.7 + Math.random() * 0.6);
        }
        e.animKey = e.attackCooldown > ENEMY_ATTACK_CD * 0.5 ? 'attack' : 'idle';
        if (distToPlayer > e.attackRange * 2) e.aiState = 'chase';
        break;
      }
      case 'stunned': {
        e.animKey = 'hit';
        break;
      }
    }
  }

  // ── Damage numbers decay ──────────────────────────────────────
  for (let i = state.damageNumbers.length - 1; i >= 0; i--) {
    const dn = state.damageNumbers[i];
    dn.age += dt;
    dn.pos.y += dn.vy * dt;
    dn.vy += 1.5 * dt;
    if (dn.age > 1.8) state.damageNumbers.splice(i, 1);
  }

  // ── Win / wave check ─────────────────────────────────────────
  const aliveEnemies = state.enemies.filter((e) => e.aiState !== 'dead').length;
  if (state.missionActive && aliveEnemies === 0 && !state.waveCleared) {
    state.waveCleared = true;
    state.waveClearTimer = 2.5; // 2.5s between waves
    if (state.wave + 1 >= state.maxWaves) {
      // Final wave cleared = win
      state.result = 'win';
    }
  }
}

// ── Damage helpers ────────────────────────────────────────────────
function applyDamageToEnemy(state: GroundCombatState, e: GroundEnemy, dmg: number, showNumber = true): void {
  e.hp -= dmg;
  e.hitFlash = 1;
  const cfg = ENEMY_CONFIG[e.enemyType];
  e.stunTimer = cfg?.stunDuration ?? 0.2;

  if (showNumber) {
    const isCrit = dmg >= 50;
    state.damageNumbers.push({
      pos: { x: e.pos.x + (Math.random() - 0.5) * 0.6, y: 2.5 + Math.random(), z: e.pos.z },
      value: dmg,
      color: isCrit ? '#ffee00' : '#ff4444',
      label: isCrit ? 'CRIT!' : undefined,
      age: 0,
      vy: 2.5,
    });
  }
  if (e.hp <= 0) {
    e.aiState = 'dead';
    e.animKey = 'death';
    if (state.missionActive) state.missionProgress++;
  }
}

function attemptEnemyAttack(state: GroundCombatState, e: GroundEnemy): void {
  const p = state.player;
  const cls = CLASS_STATS[p.characterClass];
  if (p.dead || p.iframes) return;

  if (p.combatState === 'blocking') {
    // Parry check
    if (p.stateTimer > 0) {
      e.stunTimer = PARRY_STUN;
      e.aiState = 'stunned';
      applyDamageToEnemy(state, e, Math.round(e.damage * 1.5));
      state.damageNumbers.push({
        pos: { x: p.pos.x, y: 3.2, z: p.pos.z },
        value: 0,
        color: '#44ffee',
        label: 'PARRY!',
        age: 0,
        vy: 1.5,
      });
      // Parry stamina restore — Warrior gets extra
      const restore = p.characterClass === 'warrior' ? 30 : 15;
      p.stamina = Math.min(p.maxStamina, p.stamina + restore);
      return;
    }
    // Normal block
    const absorbed = cls.defense;
    const taken = Math.max(0, e.damage - absorbed);
    p.stamina -= 12;
    p.hp -= taken;
    if (taken > 0) {
      state.damageNumbers.push({
        pos: { x: p.pos.x, y: 2.8, z: p.pos.z },
        value: taken,
        color: '#4488ff',
        label: 'BLOCK',
        age: 0,
        vy: 1.5,
      });
    }
    return;
  }

  // Unblocked hit
  const dmg = e.damage;
  p.hp -= dmg;
  p.combatState = 'hit';
  p.stateTimer = 0.3;
  p.animKey = 'hit';
  p.comboCount = 0;
  p.comboTimer = 0; // getting hit resets combo
  state.damageNumbers.push({
    pos: { x: p.pos.x, y: 2.5, z: p.pos.z },
    value: dmg,
    color: '#ff2244',
    age: 0,
    vy: 1.8,
  });
  if (p.hp <= 0) {
    p.hp = 0;
    p.dead = true;
  }
}

// Helper used in AI chase to check range preference
function tooClose(dist: number, e: GroundEnemy): boolean {
  return e.preferredRange > 0 && dist < e.preferredRange * 0.6;
}
