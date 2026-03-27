/**
 * ground-combat.ts — Core game-state engine for on-planet third-person
 * souls-like combat. Manages player, enemies, combat timing, stamina,
 * hit detection, and AI behaviour. The renderer reads this state each frame.
 */

import type { PlanetType } from './space-types';

// ── Vector helpers ────────────────────────────────────────────────
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}
function v3len(v: Vec3) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}
function v3dist(a: Vec3, b: Vec3) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}
function v3norm(v: Vec3): Vec3 {
  const l = v3len(v);
  return l > 0.0001 ? { x: v.x / l, y: v.y / l, z: v.z / l } : { x: 0, y: 0, z: 0 };
}

// ── Constants ─────────────────────────────────────────────────────
const PLAYER_SPEED = 5.0;
const SPRINT_SPEED = 8.5;
const DODGE_SPEED = 12.0;
const DODGE_DURATION = 0.35;
const DODGE_IFRAMES = 0.25; // invincibility window during dodge
const DODGE_STAMINA = 20;
const ATTACK_STAMINA = 15;
const HEAVY_ATTACK_STAMINA = 30;
const BLOCK_STAMINA_PER_SEC = 10;
const PARRY_WINDOW = 0.15; // seconds after block press that counts as parry
const PARRY_STUN = 0.5;
const MAX_STAMINA = 100;
const STAMINA_REGEN = 25; // per second
const STAMINA_REGEN_DELAY = 0.8; // seconds after last stamina use before regen starts
const LOCK_ON_RANGE = 20;
const ATTACK_RANGE = 2.2;
const HEAVY_RANGE = 2.8;
const LIGHT_DAMAGE = 18;
const HEAVY_DAMAGE = 40;
const PARRY_COUNTER_DAMAGE = 50;
const PLAYER_MAX_HP = 200;

// ── Enemy tuning ──────────────────────────────────────────────────
const ENEMY_PATROL_SPEED = 2.0;
const ENEMY_CHASE_SPEED = 3.8;
const ENEMY_ATTACK_RANGE = 2.5;
const ENEMY_DETECT_RANGE = 14;
const ENEMY_LEASH_RANGE = 25;
const ENEMY_ATTACK_CD = 1.8;
const ENEMY_DAMAGE = 15;

// ── Enums / types ─────────────────────────────────────────────────
export type CombatState = 'idle' | 'attacking' | 'heavy_attacking' | 'blocking' | 'dodging' | 'stunned' | 'parrying' | 'hit';
export type EnemyAIState = 'idle' | 'patrol' | 'chase' | 'attack' | 'stunned' | 'dead';

export interface GroundPlayer {
  pos: Vec3;
  facing: number; // yaw radians
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  staminaRegenTimer: number;
  combatState: CombatState;
  stateTimer: number; // time remaining in current combat state
  dodgeDir: Vec3;
  iframes: boolean;
  lockOnTargetId: number | null;
  // animation keys for renderer
  animKey: string;
  weaponType: 'sword' | 'bow' | 'staff' | 'spear';
  dead: boolean;
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
  enemyType: 'melee' | 'ranged' | 'heavy';
  animKey: string;
  characterModelIdx: number; // which FBX character to use (0-11)
  weaponType: 'sword' | 'bow' | 'staff' | 'spear';
  hitFlash: number; // 0-1, decreasing when hit
}

export interface DamageNumber {
  pos: Vec3;
  value: number;
  color: string;
  age: number;
  vy: number;
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
  gameTime: number;
  paused: boolean;
  result: 'none' | 'win' | 'lose';
}

// ── Input state (set by renderer from DOM events) ────────────────
export interface GroundInput {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  dodge: boolean; // space
  attack: boolean; // LMB
  heavyAttack: boolean; // hold LMB >0.4s
  block: boolean; // RMB
  lockOn: boolean; // Tab pressed this frame
  cameraYaw: number; // current camera yaw radians (set by renderer)
}

// ── Engine ────────────────────────────────────────────────────────
let nextEnemyId = 1;

export function createInitialState(planetType: PlanetType): GroundCombatState {
  return {
    player: {
      pos: { x: 0, y: 0, z: 0 },
      facing: 0,
      hp: PLAYER_MAX_HP,
      maxHp: PLAYER_MAX_HP,
      stamina: MAX_STAMINA,
      maxStamina: MAX_STAMINA,
      staminaRegenTimer: 0,
      combatState: 'idle',
      stateTimer: 0,
      dodgeDir: { x: 0, y: 0, z: 0 },
      iframes: false,
      lockOnTargetId: null,
      animKey: 'idle',
      weaponType: 'sword',
      dead: false,
    },
    enemies: [],
    damageNumbers: [],
    planetType,
    missionActive: false,
    missionObjective: '',
    missionProgress: 0,
    missionGoal: 0,
    gameTime: 0,
    paused: false,
    result: 'none',
  };
}

export function spawnEnemy(state: GroundCombatState, pos: Vec3, type: 'melee' | 'ranged' | 'heavy' = 'melee', modelIdx = 0): GroundEnemy {
  const hpMap = { melee: 80, ranged: 50, heavy: 160 };
  const dmgMap = { melee: ENEMY_DAMAGE, ranged: 12, heavy: 25 };
  const spdMap = { melee: ENEMY_CHASE_SPEED, ranged: 3.0, heavy: 2.5 };
  const weaponMap: Record<string, 'sword' | 'bow' | 'staff' | 'spear'> = { melee: 'sword', ranged: 'bow', heavy: 'spear' };
  const e: GroundEnemy = {
    id: nextEnemyId++,
    pos: { ...pos },
    facing: Math.random() * Math.PI * 2,
    hp: hpMap[type],
    maxHp: hpMap[type],
    aiState: 'patrol',
    stateTimer: 0,
    patrolOrigin: { ...pos },
    patrolTarget: {
      x: pos.x + (Math.random() - 0.5) * 10,
      y: 0,
      z: pos.z + (Math.random() - 0.5) * 10,
    },
    attackCooldown: 0,
    stunTimer: 0,
    damage: dmgMap[type],
    speed: spdMap[type],
    detectRange: ENEMY_DETECT_RANGE,
    attackRange: ENEMY_ATTACK_RANGE,
    enemyType: type,
    animKey: 'idle',
    characterModelIdx: modelIdx,
    weaponType: weaponMap[type],
    hitFlash: 0,
  };
  state.enemies.push(e);
  return e;
}

// ── Main update tick ──────────────────────────────────────────────
export function updateGroundCombat(state: GroundCombatState, input: GroundInput, dt: number): void {
  if (state.paused || state.result !== 'none') return;
  state.gameTime += dt;
  const p = state.player;
  if (p.dead) {
    p.animKey = 'death';
    state.result = 'lose';
    return;
  }

  // ─ Stamina regen ─────────────────────────────────────────────
  if (p.staminaRegenTimer > 0) {
    p.staminaRegenTimer -= dt;
  } else if (p.combatState !== 'blocking') {
    p.stamina = Math.min(p.maxStamina, p.stamina + STAMINA_REGEN * dt);
  }

  // ─ Combat state timer ────────────────────────────────────────
  if (p.stateTimer > 0) {
    p.stateTimer -= dt;
    if (p.stateTimer <= 0) {
      // State ended — return to idle
      p.combatState = 'idle';
      p.iframes = false;
    }
  }

  // ─ Lock-on toggle ────────────────────────────────────────────
  if (input.lockOn) {
    if (p.lockOnTargetId !== null) {
      p.lockOnTargetId = null;
    } else {
      // Find nearest alive enemy in range
      let best: GroundEnemy | null = null;
      let bestDist = LOCK_ON_RANGE;
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
  // Validate lock-on target still alive
  if (p.lockOnTargetId !== null) {
    const t = state.enemies.find((e) => e.id === p.lockOnTargetId);
    if (!t || t.aiState === 'dead' || v3dist(p.pos, t.pos) > LOCK_ON_RANGE * 1.5) {
      p.lockOnTargetId = null;
    }
  }

  // ─ Movement (only when idle or blocking) ─────────────────────
  if (p.combatState === 'idle' || p.combatState === 'blocking') {
    const moveX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const moveZ = (input.forward ? 1 : 0) - (input.back ? 1 : 0);
    if (moveX !== 0 || moveZ !== 0) {
      // Direction relative to camera yaw (W = forward from camera)
      const camYaw = input.cameraYaw;
      const sin = Math.sin(camYaw);
      const cos = Math.cos(camYaw);
      const worldX = moveX * cos - moveZ * sin;
      const worldZ = moveX * sin + moveZ * cos;
      const dir = v3norm({ x: worldX, y: 0, z: worldZ });
      const spd = input.sprint && p.stamina > 0 ? SPRINT_SPEED : PLAYER_SPEED;
      p.pos.x += dir.x * spd * dt;
      p.pos.z += dir.z * spd * dt;
      p.facing = Math.atan2(dir.x, dir.z);
      p.animKey = input.sprint ? 'run' : 'walk';
      if (input.sprint) {
        p.stamina -= 15 * dt;
        p.staminaRegenTimer = STAMINA_REGEN_DELAY;
      }
    } else {
      p.animKey = p.combatState === 'blocking' ? 'block' : 'idle';
    }
  }

  // Face lock-on target
  if (p.lockOnTargetId !== null) {
    const t = state.enemies.find((e) => e.id === p.lockOnTargetId);
    if (t) {
      p.facing = Math.atan2(t.pos.x - p.pos.x, t.pos.z - p.pos.z);
    }
  }

  // ─ Dodge ─────────────────────────────────────────────────────
  if (input.dodge && p.combatState === 'idle' && p.stamina >= DODGE_STAMINA) {
    p.combatState = 'dodging';
    p.stateTimer = DODGE_DURATION;
    p.iframes = true;
    p.stamina -= DODGE_STAMINA;
    p.staminaRegenTimer = STAMINA_REGEN_DELAY;
    // Dodge direction: movement direction or facing
    const moveX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const moveZ = (input.forward ? 1 : 0) - (input.back ? 1 : 0);
    if (moveX !== 0 || moveZ !== 0) {
      const camYaw = input.cameraYaw;
      const sin = Math.sin(camYaw);
      const cos = Math.cos(camYaw);
      p.dodgeDir = v3norm({ x: moveX * cos - moveZ * sin, y: 0, z: moveX * sin + moveZ * cos });
    } else {
      p.dodgeDir = { x: Math.sin(p.facing), y: 0, z: Math.cos(p.facing) };
    }
    p.animKey = 'dodge';
  }
  if (p.combatState === 'dodging') {
    p.pos.x += p.dodgeDir.x * DODGE_SPEED * dt;
    p.pos.z += p.dodgeDir.z * DODGE_SPEED * dt;
    // i-frames end partway through dodge
    if (p.stateTimer < DODGE_DURATION - DODGE_IFRAMES) p.iframes = false;
  }

  // ─ Block / Parry ─────────────────────────────────────────────
  if (input.block && p.combatState === 'idle' && p.stamina > 0) {
    p.combatState = 'blocking';
    p.stateTimer = PARRY_WINDOW; // parry window at start
    p.animKey = 'block';
  }
  if (p.combatState === 'blocking') {
    p.stamina -= BLOCK_STAMINA_PER_SEC * dt;
    p.staminaRegenTimer = STAMINA_REGEN_DELAY;
    if (p.stamina <= 0 || !input.block) {
      p.combatState = 'idle';
      p.stateTimer = 0;
    }
  }

  // ─ Attack ────────────────────────────────────────────────────
  if (input.heavyAttack && p.combatState === 'idle' && p.stamina >= HEAVY_ATTACK_STAMINA) {
    p.combatState = 'heavy_attacking';
    p.stateTimer = 0.6;
    p.stamina -= HEAVY_ATTACK_STAMINA;
    p.staminaRegenTimer = STAMINA_REGEN_DELAY;
    p.animKey = 'heavy_attack';
    // Apply damage at mid-point (handled below)
  } else if (input.attack && p.combatState === 'idle' && p.stamina >= ATTACK_STAMINA) {
    p.combatState = 'attacking';
    p.stateTimer = 0.35;
    p.stamina -= ATTACK_STAMINA;
    p.staminaRegenTimer = STAMINA_REGEN_DELAY;
    p.animKey = 'attack';
  }

  // ─ Hit detection: player → enemies ───────────────────────────
  if (
    (p.combatState === 'attacking' && p.stateTimer < 0.2 && p.stateTimer > 0.1) ||
    (p.combatState === 'heavy_attacking' && p.stateTimer < 0.35 && p.stateTimer > 0.25)
  ) {
    const isHeavy = p.combatState === 'heavy_attacking';
    const range = isHeavy ? HEAVY_RANGE : ATTACK_RANGE;
    const dmg = isHeavy ? HEAVY_DAMAGE : LIGHT_DAMAGE;
    const fwd: Vec3 = { x: Math.sin(p.facing), y: 0, z: Math.cos(p.facing) };
    for (const e of state.enemies) {
      if (e.aiState === 'dead') continue;
      const dx = e.pos.x - p.pos.x;
      const dz = e.pos.z - p.pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > range) continue;
      // Cone check: must be roughly in front
      const dot = (dx * fwd.x + dz * fwd.z) / (dist + 0.001);
      if (dot < 0.4) continue;
      applyDamageToEnemy(state, e, dmg);
    }
  }

  // ─ Enemy AI ──────────────────────────────────────────────────
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
        // Patrol between random points
        const dx = e.patrolTarget.x - e.pos.x;
        const dz = e.patrolTarget.z - e.pos.z;
        const dLen = Math.sqrt(dx * dx + dz * dz);
        if (dLen < 1) {
          e.patrolTarget = {
            x: e.patrolOrigin.x + (Math.random() - 0.5) * 12,
            y: 0,
            z: e.patrolOrigin.z + (Math.random() - 0.5) * 12,
          };
        } else {
          e.pos.x += (dx / dLen) * ENEMY_PATROL_SPEED * dt;
          e.pos.z += (dz / dLen) * ENEMY_PATROL_SPEED * dt;
          e.facing = Math.atan2(dx, dz);
        }
        e.animKey = 'walk';
        // Detect player
        if (distToPlayer < e.detectRange && !p.dead) {
          e.aiState = 'chase';
        }
        break;
      }
      case 'chase': {
        if (distToPlayer > ENEMY_LEASH_RANGE || p.dead) {
          e.aiState = 'patrol';
          break;
        }
        const dx = p.pos.x - e.pos.x;
        const dz = p.pos.z - e.pos.z;
        const dLen = Math.sqrt(dx * dx + dz * dz);
        if (dLen > 0.1) {
          e.pos.x += (dx / dLen) * e.speed * dt;
          e.pos.z += (dz / dLen) * e.speed * dt;
          e.facing = Math.atan2(dx, dz);
        }
        e.animKey = 'run';
        if (distToPlayer < e.attackRange) {
          e.aiState = 'attack';
          e.attackCooldown = ENEMY_ATTACK_CD * (0.8 + Math.random() * 0.4);
        }
        break;
      }
      case 'attack': {
        e.facing = Math.atan2(p.pos.x - e.pos.x, p.pos.z - e.pos.z);
        e.attackCooldown -= dt;
        if (e.attackCooldown <= 0) {
          // Execute attack
          if (distToPlayer < e.attackRange + 0.5) {
            attemptEnemyAttack(state, e);
          }
          e.attackCooldown = ENEMY_ATTACK_CD * (0.8 + Math.random() * 0.4);
        }
        e.animKey = e.attackCooldown > ENEMY_ATTACK_CD * 0.7 ? 'attack' : 'idle';
        if (distToPlayer > e.attackRange * 1.5) {
          e.aiState = 'chase';
        }
        break;
      }
      case 'stunned': {
        e.animKey = 'hit';
        break;
      }
    }
  }

  // ─ Damage numbers decay ──────────────────────────────────────
  for (let i = state.damageNumbers.length - 1; i >= 0; i--) {
    const dn = state.damageNumbers[i];
    dn.age += dt;
    dn.pos.y += dn.vy * dt;
    dn.vy += 2 * dt; // float upward
    if (dn.age > 1.5) state.damageNumbers.splice(i, 1);
  }

  // ─ Check win condition ───────────────────────────────────────
  if (state.missionActive) {
    const aliveEnemies = state.enemies.filter((e) => e.aiState !== 'dead').length;
    if (state.missionGoal > 0 && state.missionProgress >= state.missionGoal) {
      state.result = 'win';
    }
    // If mission is "eliminate all" and none left
    if (state.missionObjective.includes('Eliminate') && aliveEnemies === 0) {
      state.result = 'win';
    }
  }
}

// ── Damage helpers ────────────────────────────────────────────────
function applyDamageToEnemy(state: GroundCombatState, e: GroundEnemy, dmg: number): void {
  e.hp -= dmg;
  e.hitFlash = 1;
  e.stunTimer = 0.2;
  state.damageNumbers.push({
    pos: { x: e.pos.x, y: 2.5, z: e.pos.z },
    value: dmg,
    color: '#ff4444',
    age: 0,
    vy: 2,
  });
  if (e.hp <= 0) {
    e.aiState = 'dead';
    e.animKey = 'death';
    if (state.missionActive) state.missionProgress++;
  }
}

function attemptEnemyAttack(state: GroundCombatState, e: GroundEnemy): void {
  const p = state.player;
  if (p.dead || p.iframes) return;

  if (p.combatState === 'blocking') {
    // Check if within parry window
    if (p.stateTimer > 0) {
      // PARRY! Stun enemy, deal counter damage
      e.stunTimer = PARRY_STUN;
      e.aiState = 'stunned';
      applyDamageToEnemy(state, e, PARRY_COUNTER_DAMAGE);
      state.damageNumbers.push({
        pos: { x: p.pos.x, y: 3, z: p.pos.z },
        value: 0,
        color: '#44ffff',
        age: 0,
        vy: 1.5,
      });
      // Perfect parry grants stamina back
      p.stamina = Math.min(p.maxStamina, p.stamina + 20);
      return;
    }
    // Normal block: reduced damage, stamina cost
    const blocked = Math.max(1, e.damage - 10);
    p.stamina -= 15;
    p.hp -= Math.max(0, blocked - 5);
    state.damageNumbers.push({
      pos: { x: p.pos.x, y: 2.5, z: p.pos.z },
      value: blocked,
      color: '#4488ff',
      age: 0,
      vy: 1.5,
    });
    return;
  }

  // Unblocked hit
  p.hp -= e.damage;
  p.combatState = 'hit';
  p.stateTimer = 0.3;
  p.animKey = 'hit';
  state.damageNumbers.push({
    pos: { x: p.pos.x, y: 2.5, z: p.pos.z },
    value: e.damage,
    color: '#ff4444',
    age: 0,
    vy: 1.5,
  });
  if (p.hp <= 0) {
    p.hp = 0;
    p.dead = true;
  }
}
