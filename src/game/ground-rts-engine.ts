/**
 * ground-rts-engine.ts — Pure game logic for Top-Down RTS Micro Wars.
 *
 * Tick-based simulation: movement, targeting, combat, projectiles, wave spawning.
 * No rendering or DOM — pure state transforms.
 */

import {
  type GroundRTSState,
  type RTSUnit,
  type UnitDef,
  type Projectile,
  type Vec2,
  type Team,
  type UnitClass,
  PLAYER_UNITS,
  ENEMY_UNITS,
  TILE_PATHS,
  OBJECT_PATHS,
  getWaveConfig,
  type MapObject,
} from './ground-rts-types';

// ── Constants ────────────────────────────────────────────────────────
const SEPARATION_RADIUS = 28;
const SEPARATION_FORCE = 60;
const DEAD_BODY_TTL = 3.0; // seconds to keep dead bodies before removal
const PROJECTILE_SPEED = 400;
const FLOAT_TEXT_DURATION = 1.2;

// ── Helpers ──────────────────────────────────────────────────────────
function dist(a: Vec2, b: Vec2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function angle(from: Vec2, to: Vec2): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function findEnemyDef(unitClass: UnitClass): UnitDef | undefined {
  return ENEMY_UNITS.find((d) => d.unitClass === unitClass);
}

// ── State Initialization ─────────────────────────────────────────────
export function createGroundRTSState(roster: UnitClass[]): GroundRTSState {
  const TILE_SIZE = 128;
  const COLS = 20;
  const ROWS = 15;
  const mapW = COLS * TILE_SIZE;
  const mapH = ROWS * TILE_SIZE;

  // Generate random tile grid (mostly sand with some ground patches)
  const tileGrid: number[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < COLS; c++) {
      row.push(Math.floor(Math.random() * 13));
    }
    tileGrid.push(row);
  }

  // Generate map objects (scattered obstacles)
  const mapObjects: MapObject[] = [];
  let objId = 10000;
  const objDefs: Array<{ key: string; w: number; h: number; blocking: boolean }> = [
    { key: 'car1', w: 120, h: 60, blocking: true },
    { key: 'car2', w: 120, h: 60, blocking: true },
    { key: 'rock1', w: 80, h: 80, blocking: true },
    { key: 'rock2', w: 60, h: 60, blocking: true },
    { key: 'cactus1', w: 40, h: 60, blocking: false },
    { key: 'box1', w: 40, h: 40, blocking: true },
    { key: 'box2', w: 40, h: 40, blocking: true },
  ];
  for (let i = 0; i < 15; i++) {
    const od = objDefs[i % objDefs.length];
    const ox = 100 + Math.random() * (mapW - 200);
    const oy = 100 + Math.random() * (mapH - 200);
    mapObjects.push({
      id: objId++,
      x: ox,
      y: oy,
      width: od.w,
      height: od.h,
      spritePath: (OBJECT_PATHS as Record<string, string>)[od.key],
      blocking: od.blocking,
      destructible: od.key.startsWith('box'),
      hp: 50,
    });
  }

  const state: GroundRTSState = {
    units: new Map(),
    projectiles: new Map(),
    floatTexts: [],
    mapObjects,
    tileGrid,
    tileType: 'sand',
    tileCols: COLS,
    tileRows: ROWS,
    tileSize: TILE_SIZE,
    mapWidth: mapW,
    mapHeight: mapH,
    wave: 0,
    waveTimer: 3, // first wave in 3s
    waveInterval: 12,
    waveActive: false,
    enemiesAlive: 0,
    kills: 0,
    gameTime: 0,
    gameOver: false,
    victory: false,
    nextId: 1,
  };

  // Spawn player units from roster (bottom center of map)
  const spacing = 60;
  const startX = mapW / 2 - ((roster.length - 1) * spacing) / 2;
  const startY = mapH - 150;
  for (let i = 0; i < roster.length; i++) {
    const def = PLAYER_UNITS.find((d) => d.unitClass === roster[i]);
    if (!def) continue;
    spawnUnit(state, def, startX + i * spacing, startY, 0);
  }

  return state;
}

// ── Unit Spawning ────────────────────────────────────────────────────
export function spawnUnit(state: GroundRTSState, def: UnitDef, x: number, y: number, team: Team): RTSUnit {
  const unit: RTSUnit = {
    id: state.nextId++,
    def,
    team,
    x,
    y,
    facing: team === 0 ? -Math.PI / 2 : Math.PI / 2, // player faces up, enemy faces down
    hp: def.hp,
    maxHp: def.hp,
    state: 'idle',
    attackTimer: 0,
    animFrame: 0,
    animTimer: 0,
    moveTarget: null,
    attackTargetId: null,
    attackMove: false,
    selected: false,
    controlGroup: 0,
  };
  state.units.set(unit.id, unit);
  return unit;
}

// ── Wave Spawning ────────────────────────────────────────────────────
function spawnWave(state: GroundRTSState): void {
  state.wave++;
  const cfg = getWaveConfig(state.wave);
  const margin = 80;

  for (const entry of cfg.enemies) {
    if (entry.count <= 0) continue;
    const def = findEnemyDef(entry.unitClass);
    if (!def) continue;
    for (let i = 0; i < entry.count; i++) {
      const x = margin + Math.random() * (state.mapWidth - margin * 2);
      const y = margin + Math.random() * 200; // spawn near top
      spawnUnit(state, def, x, y, 1);
      state.enemiesAlive++;
    }
  }
  state.waveActive = true;
}

// ── Main Tick ────────────────────────────────────────────────────────
export function tickGroundRTS(state: GroundRTSState, dt: number): void {
  if (state.gameOver) return;
  state.gameTime += dt;

  // Wave timer
  if (!state.waveActive || state.enemiesAlive <= 0) {
    state.waveTimer -= dt;
    if (state.waveTimer <= 0) {
      spawnWave(state);
      state.waveTimer = state.waveInterval;
    }
    state.waveActive = state.enemiesAlive > 0;
  }

  // Update units
  const allUnits = [...state.units.values()];
  for (const unit of allUnits) {
    if (unit.state === 'dead') continue;
    if (unit.state === 'dying') {
      tickDying(unit, dt);
      if (unit.state === 'dead' && unit.team === 1) {
        state.enemiesAlive = Math.max(0, state.enemiesAlive - 1);
        state.kills++;
      }
      continue;
    }
    tickUnitAI(state, unit, allUnits, dt);
    tickUnitMovement(state, unit, allUnits, dt);
    tickUnitCombat(state, unit, allUnits, dt);
    tickUnitAnimation(unit, dt);
  }

  // Clean up dead bodies after TTL
  for (const [id, unit] of state.units) {
    if (unit.state === 'dead' && unit.animTimer > DEAD_BODY_TTL) {
      state.units.delete(id);
    }
  }

  // Update projectiles
  tickProjectiles(state, dt);

  // Update float texts
  state.floatTexts = state.floatTexts.filter((ft) => {
    ft.age += dt;
    ft.y -= 40 * dt;
    return ft.age < FLOAT_TEXT_DURATION;
  });

  // Check game over — all player units dead
  const playerAlive = allUnits.some((u) => u.team === 0 && u.state !== 'dead' && u.state !== 'dying');
  if (!playerAlive) {
    state.gameOver = true;
    state.victory = false;
  }
}

// ── Unit AI (enemy auto-targeting) ───────────────────────────────────
function tickUnitAI(state: GroundRTSState, unit: RTSUnit, all: RTSUnit[], _dt: number): void {
  // Player units only auto-acquire if attack-moving or idle with no orders
  if (unit.team === 0 && !unit.attackMove && unit.moveTarget) return;

  // Already have a valid target?
  if (unit.attackTargetId != null) {
    const target = state.units.get(unit.attackTargetId);
    if (target && target.state !== 'dead' && target.state !== 'dying') return;
    unit.attackTargetId = null; // target dead, find new
  }

  // Find closest enemy in aggro range
  let closest: RTSUnit | null = null;
  let closestDist = unit.def.aggroRange;
  for (const other of all) {
    if (other.team === unit.team || other.state === 'dead' || other.state === 'dying') continue;
    const d = dist(unit, other);
    if (d < closestDist) {
      closestDist = d;
      closest = other;
    }
  }
  if (closest) {
    unit.attackTargetId = closest.id;
  }
}

// ── Unit Movement ────────────────────────────────────────────────────
function tickUnitMovement(state: GroundRTSState, unit: RTSUnit, all: RTSUnit[], dt: number): void {
  if (unit.state === 'attacking') return; // can't move while attacking

  let tx: number | null = null;
  let ty: number | null = null;

  // Chase attack target
  if (unit.attackTargetId != null) {
    const target = state.units.get(unit.attackTargetId);
    if (target && target.state !== 'dead' && target.state !== 'dying') {
      const d = dist(unit, target);
      if (d > unit.def.attackRange) {
        tx = target.x;
        ty = target.y;
      }
    }
  }

  // Move to waypoint if no attack chase
  if (tx == null && unit.moveTarget) {
    tx = unit.moveTarget.x;
    ty = unit.moveTarget.y;
  }

  if (tx != null && ty != null) {
    const d = dist(unit, { x: tx, y: ty });
    if (d < 5) {
      // Arrived
      if (unit.moveTarget && unit.attackTargetId == null) {
        unit.moveTarget = null;
        unit.state = 'idle';
      }
      return;
    }

    unit.state = 'walking';
    unit.facing = angle(unit, { x: tx, y: ty });

    // Separation force (avoid overlap with nearby same-team units)
    let sepX = 0,
      sepY = 0;
    for (const other of all) {
      if (other.id === unit.id || other.state === 'dead' || other.state === 'dying') continue;
      const od = dist(unit, other);
      if (od > 0 && od < SEPARATION_RADIUS) {
        const w = (SEPARATION_RADIUS - od) / SEPARATION_RADIUS;
        sepX += ((unit.x - other.x) / od) * w;
        sepY += ((unit.y - other.y) / od) * w;
      }
    }
    const sepMag = Math.sqrt(sepX * sepX + sepY * sepY);
    if (sepMag > 0) {
      sepX = (sepX / sepMag) * SEPARATION_FORCE;
      sepY = (sepY / sepMag) * SEPARATION_FORCE;
    }

    const moveX = Math.cos(unit.facing) * unit.def.speed + sepX;
    const moveY = Math.sin(unit.facing) * unit.def.speed + sepY;
    unit.x += moveX * dt;
    unit.y += moveY * dt;

    // Clamp to map
    unit.x = Math.max(10, Math.min(state.mapWidth - 10, unit.x));
    unit.y = Math.max(10, Math.min(state.mapHeight - 10, unit.y));
  } else if (unit.state === 'walking') {
    unit.state = 'idle';
  }
}

// ── Unit Combat ──────────────────────────────────────────────────────
function tickUnitCombat(state: GroundRTSState, unit: RTSUnit, _all: RTSUnit[], dt: number): void {
  unit.attackTimer = Math.max(0, unit.attackTimer - dt);

  if (unit.attackTargetId == null) return;
  const target = state.units.get(unit.attackTargetId);
  if (!target || target.state === 'dead' || target.state === 'dying') {
    unit.attackTargetId = null;
    return;
  }

  const d = dist(unit, target);
  if (d > unit.def.attackRange) return; // not in range yet
  if (unit.attackTimer > 0) return; // on cooldown

  // Face target
  unit.facing = angle(unit, target);

  // Execute attack
  unit.state = 'attacking';
  unit.attackTimer = unit.def.attackCooldown;
  unit.animFrame = 0;
  unit.animTimer = 0;

  if (unit.def.attackType === 'melee') {
    dealDamage(state, unit, target, unit.def.attackDmg);
  } else {
    // Spawn projectile
    const proj: Projectile = {
      id: state.nextId++,
      x: unit.x,
      y: unit.y,
      targetId: target.id,
      speed: PROJECTILE_SPEED,
      damage: unit.def.attackDmg,
      team: unit.team,
      color: unit.def.attackType === 'flame' ? '#ff8800' : '#ffff44',
      radius: unit.def.attackType === 'flame' ? 5 : 3,
    };
    state.projectiles.set(proj.id, proj);
  }
}

// ── Damage ───────────────────────────────────────────────────────────
function dealDamage(state: GroundRTSState, _attacker: RTSUnit, target: RTSUnit, damage: number): void {
  target.hp -= damage;
  state.floatTexts.push({
    x: target.x,
    y: target.y - 20,
    text: `-${damage}`,
    color: target.team === 0 ? '#ff4444' : '#ffff44',
    age: 0,
  });

  if (target.hp <= 0) {
    target.hp = 0;
    target.state = 'dying';
    target.animFrame = 0;
    target.animTimer = 0;
    target.moveTarget = null;
    target.attackTargetId = null;
  }
}

// ── Dying ────────────────────────────────────────────────────────────
function tickDying(unit: RTSUnit, dt: number): void {
  unit.animTimer += dt;
  const deathAnim = unit.def.anims.death;
  const totalDuration = deathAnim.frames * deathAnim.frameDuration;
  if (unit.animTimer >= totalDuration) {
    unit.state = 'dead';
    unit.animFrame = deathAnim.frames - 1; // stay on last frame
    unit.animTimer = 0; // reuse as dead body timer
  } else {
    unit.animFrame = Math.min(deathAnim.frames - 1, Math.floor(unit.animTimer / deathAnim.frameDuration));
  }
}

// ── Projectiles ──────────────────────────────────────────────────────
function tickProjectiles(state: GroundRTSState, dt: number): void {
  for (const [id, proj] of state.projectiles) {
    const target = state.units.get(proj.targetId);
    if (!target || target.state === 'dead') {
      state.projectiles.delete(id);
      continue;
    }

    const a = angle(proj, target);
    proj.x += Math.cos(a) * proj.speed * dt;
    proj.y += Math.sin(a) * proj.speed * dt;

    if (dist(proj, target) < 15) {
      dealDamage(state, null as unknown as RTSUnit, target, proj.damage);
      state.projectiles.delete(id);
    }
  }
}

// ── Animation ────────────────────────────────────────────────────────
function tickUnitAnimation(unit: RTSUnit, dt: number): void {
  if (unit.state === 'dying' || unit.state === 'dead') return; // handled in tickDying

  let anim = unit.def.anims.walk; // fallback
  switch (unit.state) {
    case 'idle':
      anim = unit.def.anims.idle ?? unit.def.anims.walk;
      break;
    case 'walking':
      anim = unit.def.anims.walk;
      break;
    case 'attacking':
      anim = unit.def.anims.attack;
      break;
  }

  unit.animTimer += dt;
  if (unit.animTimer >= anim.frameDuration) {
    unit.animTimer -= anim.frameDuration;
    unit.animFrame++;
    if (unit.animFrame >= anim.frames) {
      if (anim.loop) {
        unit.animFrame = 0;
      } else {
        unit.animFrame = anim.frames - 1;
        // Attack anim finished → go back to idle
        if (unit.state === 'attacking') {
          unit.state = 'idle';
        }
      }
    }
  }
}

// ── Commands (called by controls) ────────────────────────────────────
export function commandMove(state: GroundRTSState, unitIds: number[], target: Vec2): void {
  for (const id of unitIds) {
    const unit = state.units.get(id);
    if (!unit || unit.team !== 0 || unit.state === 'dead' || unit.state === 'dying') continue;
    unit.moveTarget = { ...target };
    unit.attackTargetId = null;
    unit.attackMove = false;
  }
}

export function commandAttackMove(state: GroundRTSState, unitIds: number[], target: Vec2): void {
  for (const id of unitIds) {
    const unit = state.units.get(id);
    if (!unit || unit.team !== 0 || unit.state === 'dead' || unit.state === 'dying') continue;
    unit.moveTarget = { ...target };
    unit.attackMove = true;
  }
}

export function commandAttackTarget(state: GroundRTSState, unitIds: number[], targetId: number): void {
  for (const id of unitIds) {
    const unit = state.units.get(id);
    if (!unit || unit.team !== 0 || unit.state === 'dead' || unit.state === 'dying') continue;
    unit.attackTargetId = targetId;
    unit.moveTarget = null;
    unit.attackMove = false;
  }
}

export function commandStop(state: GroundRTSState, unitIds: number[]): void {
  for (const id of unitIds) {
    const unit = state.units.get(id);
    if (!unit) continue;
    unit.moveTarget = null;
    unit.attackTargetId = null;
    unit.attackMove = false;
    if (unit.state === 'walking') unit.state = 'idle';
  }
}
