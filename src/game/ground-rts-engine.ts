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
  type TileWalkability,
  PLAYER_UNITS,
  ENEMY_UNITS,
  TILE_PATHS,
  OBJECT_PATHS,
  getWaveConfig,
  type MapObject,
} from './ground-rts-types';

// ── Constants ──────────────────────────────────────────────────────
const SEPARATION_RADIUS = 28;
const SEPARATION_FORCE = 60;
const DEAD_BODY_TTL = 3.0;
const PROJECTILE_SPEED = 400;
const FLOAT_TEXT_DURATION = 1.2;
const FACING_LERP_SPEED = 12; // radians/sec for smooth rotation
const SLOW_TILE_MULTIPLIER = 0.5; // speed on stones tiles

// ── Helpers ──────────────────────────────────────────────────────────
function dist(a: Vec2, b: Vec2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function angle(from: Vec2, to: Vec2): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/** Shortest-path angle lerp (handles wrapping around ±π). */
function lerpAngle(current: number, target: number, speed: number, dt: number): number {
  let diff = target - current;
  // Normalize to [-PI, PI]
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) < 0.01) return target;
  return current + Math.sign(diff) * Math.min(Math.abs(diff), speed * dt);
}

/** Check if a world position is walkable on the tile grid. */
function isWalkable(state: GroundRTSState, wx: number, wy: number): boolean {
  const c = Math.floor(wx / state.tileSize);
  const r = Math.floor(wy / state.tileSize);
  if (c < 0 || c >= state.tileCols || r < 0 || r >= state.tileRows) return false;
  return state.walkGrid[r][c] !== 2;
}

/** Get speed multiplier for the tile at a world position. */
function tileSpeedMult(state: GroundRTSState, wx: number, wy: number): number {
  const c = Math.floor(wx / state.tileSize);
  const r = Math.floor(wy / state.tileSize);
  if (c < 0 || c >= state.tileCols || r < 0 || r >= state.tileRows) return 0;
  return state.walkGrid[r][c] === 1 ? SLOW_TILE_MULTIPLIER : state.walkGrid[r][c] === 2 ? 0 : 1;
}

function findEnemyDef(unitClass: UnitClass): UnitDef | undefined {
  return ENEMY_UNITS.find((d) => d.unitClass === unitClass);
}

// ── Designed Level Layouts ────────────────────────────────────────
// Each level is a 20x15 grid. Values:
//   S = sand (walkable, fast)
//   G = ground (walkable, fast)
//   T = stones (walkable, slow — rubble/rough terrain)
//   W = water (impassable — rendered dark)
// Player spawns at bottom, enemies at top.

type TileChar = 'S' | 'G' | 'T' | 'W';

// Level layouts: 20x15 grid.
// KEY RULES:
//   - Only use full-floor tiles (index 0 or 3) — no transition/edge tiles
//   - At least 2 walkable tiles (SS, GG, etc.) between any W tile and the next W tile
//   - Wide corridors (minimum 3 tiles wide) so units can maneuver
//   - Clear spawn zones at top (enemies) and bottom (player)
const LEVEL_MAPS: string[][] = [
  // Level 1: Desert Outpost — open arena, water only at corners
  [
    'WWSSSSSSSSSSSSSSSSSS',
    'SSSSSSGGGGGGGGSSSSSS',
    'SSSSGGGGGGGGGGGGSSSS',
    'SSSGGGGSSSSSSGGGGSSS',
    'SSSGGSSSSSSSSSSGGSS',
    'SSSSSSSTTTTTSSSSSSS',
    'SSSSSSSSSSSSSSSSSSSS',
    'SSSSSSSSSSSSSSSSSSS',
    'SSSSSSSSSSSSSSSSSSSS',
    'SSSSSSSTTTTTSSSSSSS',
    'SSSGGSSSSSSSSSSGGSS',
    'SSSGGGGSSSSSSGGGGSSS',
    'SSSSGGGGGGGGGGGGSSSS',
    'SSSSSSGGGGGGGGSSSSSS',
    'SSSSSSSSSSSSSSSSSWWW',
  ],
  // Level 2: River Crossing — wide river with 3-tile bridges
  [
    'SSSSSSSSGGGGSSSSSSSS',
    'SSGGGGGGGGGGGGGGGGSS',
    'SSGGSSSSSSSSSSSSGGSS',
    'SSSSSSSSSSSSSSSSSSSS',
    'SSSSSSSSSSSSSSSSSSSS',
    'WWWWWSSSTTTSSSWWWWWW',
    'WWWWWSSSSSSSSSSWWWWW',
    'WWWWWSSSTTTSSSWWWWWW',
    'WWWWWSSSSSSSSSSWWWWW',
    'WWWWWSSSTTTSSSWWWWWW',
    'SSSSSSSSSSSSSSSSSSSS',
    'SSSSSSSSSSSSSSSSSSSS',
    'SSGGSSSSSSSSSSSSGGSS',
    'SSGGGGGGGGGGGGGGGGSS',
    'SSSSSSSSGGGGSSSSSSSS',
  ],
  // Level 3: Fortress — thick walls with wide gates
  [
    'SSSSSSSSSSSSSSSSSSSS',
    'SSSSGGGGGGGGGGGGSSSS',
    'SSSSWWWWWWWWWWWWSSSS',
    'SSSSWSSSSSSSSSWSSSS',
    'SSSSWSSSSSSSSSWSSSS',
    'SSSSSSSSSSSSSSSSSSS',
    'SSSSWSSSSSSSSSWSSSS',
    'SSSSWSSSTTTSSSWSSSS',
    'SSSSWSSSSSSSSSWSSSS',
    'SSSSSSSSSSSSSSSSSSS',
    'SSSSWSSSSSSSSSWSSSS',
    'SSSSWSSSSSSSSSWSSSS',
    'SSSSWWWWWWWWWWWWSSSS',
    'SSSSGGGGGGGGGGGGSSSS',
    'SSSSSSSSSSSSSSSSSSSS',
  ],
  // Level 4: Canyon — wide paths, water walls with 3+ gap
  [
    'WWWSSSSSSSSSSSSSSWWW',
    'WWSSSSSSSSSSSSSSSSSS',
    'SSSSSSTTTSSSTTTSSSSS',
    'SSSSSWWWSSSSWWWSSSSS',
    'SSSSSWWWSSSSWWWSSSSS',
    'SSSSSSSSSSSSSSSSSSSS',
    'SSSSSSSSSSSSSSSSSSSS',
    'SSSTTTTTTTTTTTTTTTSSS',
    'SSSSSSSSSSSSSSSSSSSS',
    'SSSSSSSSSSSSSSSSSSSS',
    'SSSSSWWWSSSSWWWSSSSS',
    'SSSSSWWWSSSSWWWSSSSS',
    'SSSSSSTTTSSSTTTSSSSS',
    'WWSSSSSSSSSSSSSSSSSS',
    'WWWSSSSSSSSSSSSSSWWW',
  ],
  // Level 5: Arena — round pit, thick water border
  [
    'WWWWWWSSSSSSSSSWWWWW',
    'WWWWSSSSSSSSSSSSWWWW',
    'WWWSSSSSGGGGSSSSSSWW',
    'WWSSSSGGGGGGGGSSSSWW',
    'WSSSSSGGTTTGGSSSSSW',
    'WSSSSGTTTTTTTGSSSSW',
    'WSSSSGTTTTTTTGSSSSW',
    'WSSSSGTTTTTTTGSSSSW',
    'WSSSSGTTTTTTTGSSSSW',
    'WSSSSSGGTTTGGSSSSSW',
    'WWSSSSGGGGGGGGSSSSWW',
    'WWWSSSSSGGGGSSSSSSWW',
    'WWWWSSSSSSSSSSSSWWWW',
    'WWWWWWSSSSSSSSSWWWWW',
    'WWWWWWWWWWWWWWWWWWWW',
  ],
];

// Full-floor tile indices (no transparent edges/dead zones).
// From the tileset image: index 0 and 3 in each type are complete solid fills.
const FULL_FLOOR_INDICES = [0, 3];
function pickFullFloor(): number {
  return FULL_FLOOR_INDICES[Math.floor(Math.random() * FULL_FLOOR_INDICES.length)];
}

/** Map tile character to tile type + walkability + visual tile index. */
function parseTileChar(ch: TileChar): { type: 'sand' | 'ground' | 'stones' | 'water'; walk: TileWalkability; tileIdx: number } {
  switch (ch) {
    case 'S':
      return { type: 'sand', walk: 0, tileIdx: pickFullFloor() };
    case 'G':
      return { type: 'ground', walk: 0, tileIdx: pickFullFloor() };
    case 'T':
      return { type: 'stones', walk: 1, tileIdx: pickFullFloor() };
    case 'W':
      return { type: 'water', walk: 2, tileIdx: pickFullFloor() };
  }
}

// ── State Initialization ─────────────────────────────────────────
export function createGroundRTSState(roster: UnitClass[], level = 0): GroundRTSState {
  const TILE_SIZE = 192; // Larger tiles for better readability
  const COLS = 20;
  const ROWS = 15;
  const mapW = COLS * TILE_SIZE;
  const mapH = ROWS * TILE_SIZE;

  // Parse designed level layout
  const levelIdx = level % LEVEL_MAPS.length;
  const layout = LEVEL_MAPS[levelIdx];
  const tileGrid: number[][] = [];
  const walkGrid: TileWalkability[][] = [];
  // Track which tile types are used per cell for mixed rendering
  const tileTypeGrid: string[][] = [];

  for (let r = 0; r < ROWS; r++) {
    const tileRow: number[] = [];
    const walkRow: TileWalkability[] = [];
    const typeRow: string[] = [];
    const layoutRow = layout[r] ?? 'SSSSSSSSSSSSSSSSSSSS';
    for (let c = 0; c < COLS; c++) {
      const ch = (layoutRow[c] ?? 'S') as TileChar;
      const parsed = parseTileChar(ch);
      tileRow.push(parsed.tileIdx);
      walkRow.push(parsed.walk);
      typeRow.push(parsed.type);
    }
    tileGrid.push(tileRow);
    walkGrid.push(walkRow);
    tileTypeGrid.push(typeRow);
  }

  // Place map objects only on walkable tiles
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
  let placed = 0;
  for (let attempt = 0; attempt < 100 && placed < 12; attempt++) {
    const od = objDefs[placed % objDefs.length];
    const ox = 100 + Math.random() * (mapW - 200);
    const oy = 100 + Math.random() * (mapH - 200);
    // Only place on walkable tiles (not water)
    const tc = Math.floor(ox / TILE_SIZE);
    const tr = Math.floor(oy / TILE_SIZE);
    if (tc >= 0 && tc < COLS && tr >= 0 && tr < ROWS && walkGrid[tr][tc] !== 2) {
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
      placed++;
    }
  }

  const state: GroundRTSState = {
    units: new Map(),
    projectiles: new Map(),
    floatTexts: [],
    mapObjects,
    tileGrid,
    tileType: 'sand', // base type — renderer uses tileTypeGrid for per-cell type
    tileCols: COLS,
    tileRows: ROWS,
    tileSize: TILE_SIZE,
    mapWidth: mapW,
    mapHeight: mapH,
    walkGrid,
    wave: 0,
    waveTimer: 3,
    waveInterval: 12,
    waveActive: false,
    enemiesAlive: 0,
    kills: 0,
    gameTime: 0,
    gameOver: false,
    victory: false,
    nextId: 1,
    level: levelIdx,
  };

  // Store tileTypeGrid on state for renderer access
  (state as any)._tileTypeGrid = tileTypeGrid;

  // Spawn player units on walkable tiles at bottom
  const spacing = 60;
  const startX = mapW / 2 - ((roster.length - 1) * spacing) / 2;
  let startY = mapH - 150;
  // Find walkable row near bottom
  for (let r = ROWS - 2; r >= ROWS - 5; r--) {
    if (walkGrid[r][Math.floor(COLS / 2)] !== 2) {
      startY = r * TILE_SIZE + TILE_SIZE / 2;
      break;
    }
  }
  for (let i = 0; i < roster.length; i++) {
    const def = PLAYER_UNITS.find((d) => d.unitClass === roster[i]);
    if (!def) continue;
    spawnUnit(state, def, startX + i * spacing, startY, 0);
  }

  return state;
}

// ── Unit Spawning ────────────────────────────────────────────────────
export function spawnUnit(state: GroundRTSState, def: UnitDef, x: number, y: number, team: Team): RTSUnit {
  const initFacing = team === 0 ? -Math.PI / 2 : Math.PI / 2;
  const unit: RTSUnit = {
    id: state.nextId++,
    def,
    team,
    x,
    y,
    facing: initFacing,
    facingTarget: initFacing,
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

  for (const entry of cfg.enemies) {
    if (entry.count <= 0) continue;
    const def = findEnemyDef(entry.unitClass);
    if (!def) continue;
    for (let i = 0; i < entry.count; i++) {
      // Find a walkable spawn point near the top of the map
      let x = 0,
        y = 0;
      for (let attempt = 0; attempt < 50; attempt++) {
        x = 80 + Math.random() * (state.mapWidth - 160);
        y = 80 + Math.random() * 250;
        if (isWalkable(state, x, y)) break;
      }
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
      // tickDying may transition state to 'dead' — cast to bypass TS narrowing
      if ((unit.state as string) === 'dead' && unit.team === 1) {
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
    // Set facing TARGET (smooth lerp happens below)
    unit.facingTarget = angle(unit, { x: tx, y: ty });

    // Separation force (avoid overlap with nearby units)
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

    // Smooth facing lerp
    unit.facing = lerpAngle(unit.facing, unit.facingTarget, FACING_LERP_SPEED, dt);

    // Speed modified by tile type
    const speedMult = tileSpeedMult(state, unit.x, unit.y);
    const moveX = Math.cos(unit.facing) * unit.def.speed * speedMult + sepX;
    const moveY = Math.sin(unit.facing) * unit.def.speed * speedMult + sepY;
    const newX = unit.x + moveX * dt;
    const newY = unit.y + moveY * dt;

    // Collision check: only move if destination is walkable
    if (isWalkable(state, newX, newY)) {
      unit.x = newX;
      unit.y = newY;
    } else {
      // Try sliding along axes
      if (isWalkable(state, newX, unit.y)) unit.x = newX;
      else if (isWalkable(state, unit.x, newY)) unit.y = newY;
      // else: stuck, don't move
    }

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

  // Face target (smooth)
  unit.facingTarget = angle(unit, target);
  unit.facing = lerpAngle(unit.facing, unit.facingTarget, FACING_LERP_SPEED, dt);

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
