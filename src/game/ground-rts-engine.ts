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
  type RTSBuilding,
  type BuildingDef,
  type MineralDeposit,
  type PlanetResources,
  type ProductionDef,
  PLAYER_UNITS,
  ENEMY_UNITS,
  PRODUCTION_UNITS,
  PRODUCTION_DEFS,
  TILE_PATHS,
  OBJECT_PATHS,
  BUILDING_DEFS,
  canBuild,
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

  // Initialize building grid (0 = empty)
  const buildingGrid: number[][] = [];
  for (let r = 0; r < ROWS; r++) {
    buildingGrid.push(new Array(COLS).fill(0));
  }

  // Generate mineral deposits based on level
  const mineralDeposits: MineralDeposit[] = [];
  let depositId = 50000;
  const depositCount = 4 + levelIdx;
  for (let i = 0; i < depositCount; i++) {
    for (let attempt = 0; attempt < 30; attempt++) {
      const dc = 2 + Math.floor(Math.random() * (COLS - 4));
      const dr = 1 + Math.floor(Math.random() * (ROWS - 4));
      if (walkGrid[dr][dc] === 0 && buildingGrid[dr][dc] === 0) {
        const amount = 800 + Math.floor(Math.random() * 700);
        mineralDeposits.push({
          id: depositId++,
          x: dc * TILE_SIZE + TILE_SIZE / 2,
          y: dr * TILE_SIZE + TILE_SIZE / 2,
          gridCol: dc,
          gridRow: dr,
          amount,
          maxAmount: amount,
          type: Math.random() < 0.15 ? 'rare' : Math.random() < 0.3 ? 'crystal' : 'standard',
        });
        break;
      }
    }
  }

  const resources: PlanetResources = {
    credits: 500,
    minerals: 200,
    maxMinerals: 1000,
    power: 0,
    powerGenerated: 0,
    powerConsumed: 0,
    supplyCurrent: 0,
    supplyCap: 10, // command center gives 10
    incomeRate: 0,
  };

  const state: GroundRTSState = {
    units: new Map(),
    projectiles: new Map(),
    floatTexts: [],
    mapObjects,
    buildings: new Map(),
    buildingGrid,
    resources,
    mineralDeposits,
    tileGrid,
    tileType: 'sand',
    tileCols: COLS,
    tileRows: ROWS,
    tileSize: TILE_SIZE,
    mapWidth: mapW,
    mapHeight: mapH,
    walkGrid,
    wave: 0,
    waveTimer: 8, // longer initial delay for base setup
    waveInterval: 20, // more time between waves for building
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

  // Auto-place Command Center near bottom-center
  const ccDef = BUILDING_DEFS['command_center'];
  if (ccDef) {
    const ccCol = Math.floor(COLS / 2) - 1;
    const ccRow = ROWS - 5;
    placeBuilding(state, 'command_center', ccCol, ccRow, 0, true);
  }

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

  // Update buildings (construction, income, turret AI)
  tickBuildings(state, dt);

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

// ── Enemy AI System ──────────────────────────────────────────
// Behaviors:
//  - Focus fire: multiple enemies attack the same target to kill it fast
//  - Target priority: low-HP targets first (finish them off)
//  - Flank: approach from different angles, not a straight blob
//  - Surround: melee spread around the target, don't stack
//  - Patrol: idle enemies wander toward player zone
//  - Wall avoidance: reroute around impassable tiles

const AI_RETARGET_INTERVAL = 0.8; // seconds between target re-evaluation
const AI_FLANK_SPREAD = 80; // pixels offset for flanking positions
const AI_PATROL_SPEED = 0.4; // multiplier for patrol movement

/** Score a potential target: lower = higher priority. */
function scoreTarget(attacker: RTSUnit, target: RTSUnit): number {
  const d = dist(attacker, target);
  const hpPct = target.hp / target.maxHp;
  // Prefer: closer targets, lower HP%, ranged units (kill threats first)
  let score = d;
  score *= 0.3 + hpPct * 0.7; // low HP = much lower score (higher priority)
  if (target.def.attackType === 'ranged' || target.def.attackType === 'flame') {
    score *= 0.7; // prioritize ranged threats
  }
  return score;
}

/** Count how many allies are already targeting this unit. */
function countAttackersOn(all: RTSUnit[], targetId: number, myTeam: number): number {
  let count = 0;
  for (const u of all) {
    if (u.team === myTeam && u.attackTargetId === targetId && u.state !== 'dead' && u.state !== 'dying') count++;
  }
  return count;
}

/** Get a flanking offset so enemies approach from different sides. */
function getFlankOffset(attackerId: number, targetX: number, targetY: number): Vec2 {
  // Use attacker ID to deterministically pick a flank angle
  const flankAngle = (attackerId * 2.618) % (Math.PI * 2); // golden ratio spread
  return {
    x: targetX + Math.cos(flankAngle) * AI_FLANK_SPREAD,
    y: targetY + Math.sin(flankAngle) * AI_FLANK_SPREAD,
  };
}

function tickUnitAI(state: GroundRTSState, unit: RTSUnit, all: RTSUnit[], dt: number): void {
  // Player units: only auto-acquire if attack-moving or idle with no orders
  if (unit.team === 0) {
    if (!unit.attackMove && unit.moveTarget) return;
    // Player idle auto-acquire: find closest enemy
    if (unit.attackTargetId == null || !isTargetValid(state, unit.attackTargetId)) {
      unit.attackTargetId = null;
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
      if (closest) unit.attackTargetId = closest.id;
    }
    return;
  }

  // ── ENEMY AI ────────────────────────────────────────────────────

  // Periodically re-evaluate target (not every frame — use attack timer as proxy)
  const shouldRetarget =
    unit.attackTargetId == null ||
    !isTargetValid(state, unit.attackTargetId) ||
    (unit.attackTimer <= 0 && Math.random() < dt / AI_RETARGET_INTERVAL);

  if (shouldRetarget) {
    // Smart target selection: score all enemies, pick best
    let bestTarget: RTSUnit | null = null;
    let bestScore = Infinity;
    for (const other of all) {
      if (other.team === unit.team || other.state === 'dead' || other.state === 'dying') continue;
      const d = dist(unit, other);
      if (d > unit.def.aggroRange * 1.5) continue; // extended search range
      let score = scoreTarget(unit, other);
      // Focus fire bonus: prefer targets already being attacked by 1-2 allies
      const attackers = countAttackersOn(all, other.id, unit.team);
      if (attackers >= 1 && attackers <= 3) score *= 0.6; // focus fire
      if (attackers > 4) score *= 1.5; // too many, spread out
      if (score < bestScore) {
        bestScore = score;
        bestTarget = other;
      }
    }
    if (bestTarget) {
      unit.attackTargetId = bestTarget.id;
    }
  }

  // Patrol behavior: if no target, move toward player zone (bottom of map)
  if (unit.attackTargetId == null && unit.moveTarget == null) {
    // Wander toward the bottom half of the map where players are
    const patrolX = unit.x + (Math.random() - 0.5) * 300;
    const patrolY = unit.y + 100 + Math.random() * 200;
    // Clamp to map and ensure walkable
    const px = Math.max(50, Math.min(state.mapWidth - 50, patrolX));
    const py = Math.max(50, Math.min(state.mapHeight - 50, patrolY));
    if (isWalkable(state, px, py)) {
      unit.moveTarget = { x: px, y: py };
    }
  }
}

function isTargetValid(state: GroundRTSState, targetId: number): boolean {
  const t = state.units.get(targetId);
  return !!t && t.state !== 'dead' && t.state !== 'dying';
}

// ── Unit Movement ────────────────────────────────────────────────────
function tickUnitMovement(state: GroundRTSState, unit: RTSUnit, all: RTSUnit[], dt: number): void {
  if (unit.state === 'attacking') return; // can't move while attacking

  let tx: number | null = null;
  let ty: number | null = null;

  // Chase attack target — with flanking for enemies
  if (unit.attackTargetId != null) {
    const target = state.units.get(unit.attackTargetId);
    if (target && target.state !== 'dead' && target.state !== 'dying') {
      const d = dist(unit, target);
      if (d > unit.def.attackRange) {
        if (unit.team === 1 && unit.def.attackType === 'melee') {
          // Enemy melee: flank — approach from a spread angle, not straight at target
          const flank = getFlankOffset(unit.id, target.x, target.y);
          // If close enough to flank point, go straight for target
          if (dist(unit, flank) < 40 || d < unit.def.attackRange * 2) {
            tx = target.x;
            ty = target.y;
          } else {
            tx = flank.x;
            ty = flank.y;
          }
        } else {
          tx = target.x;
          ty = target.y;
        }
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

/** Queue a unit for production at a building. Returns true if queued. */
export function queueProduction(state: GroundRTSState, buildingId: number, unitClass: UnitClass): boolean {
  const b = state.buildings.get(buildingId);
  if (!b || b.state !== 'active' || b.team !== 0) return false;
  const prodDef = PRODUCTION_DEFS.find((p) => p.unitClass === unitClass && p.producerKey === b.def.key);
  if (!prodDef) return false;
  if (b.productionQueue.length >= 5) return false; // max queue
  if (state.resources.credits < prodDef.creditCost) return false;
  if (state.resources.minerals < prodDef.mineralCost) return false;
  state.resources.credits -= prodDef.creditCost;
  state.resources.minerals -= prodDef.mineralCost;
  b.productionQueue.push(unitClass);
  return true;
}

// ══════════════════════════════════════════════════════════════════════
// BUILDING SYSTEM
// ══════════════════════════════════════════════════════════════════════

/** Check if a building can be placed at the given grid position. */
export function canPlaceBuilding(state: GroundRTSState, key: string, col: number, row: number): { ok: boolean; reason?: string } {
  const def = BUILDING_DEFS[key];
  if (!def) return { ok: false, reason: 'Unknown building' };

  // Check grid bounds
  if (col < 0 || row < 0 || col + def.footprint.w > state.tileCols || row + def.footprint.h > state.tileRows) {
    return { ok: false, reason: 'Out of bounds' };
  }

  // Check all footprint cells are walkable and unoccupied
  for (let r = row; r < row + def.footprint.h; r++) {
    for (let c = col; c < col + def.footprint.w; c++) {
      if (state.walkGrid[r][c] === 2) return { ok: false, reason: 'Impassable terrain' };
      if (state.buildingGrid[r][c] !== 0) return { ok: false, reason: 'Occupied' };
    }
  }

  // Check tech requirements
  const ownedKeys = [...state.buildings.values()].filter((b) => b.team === 0 && b.state !== 'destroyed').map((b) => b.def.key);
  if (!canBuild(key, ownedKeys)) {
    return { ok: false, reason: 'Missing prerequisite' };
  }

  // Check resources
  if (state.resources.credits < def.creditCost) return { ok: false, reason: 'Not enough credits' };
  if (state.resources.minerals < def.mineralCost) return { ok: false, reason: 'Not enough minerals' };

  return { ok: true };
}

/** Place a building on the grid. Deducts resources. */
export function placeBuilding(
  state: GroundRTSState,
  key: string,
  col: number,
  row: number,
  team: Team,
  instant = false,
): RTSBuilding | null {
  const def = BUILDING_DEFS[key];
  if (!def) return null;

  // Deduct resources (skip for instant placements like Command Center)
  if (!instant) {
    state.resources.credits -= def.creditCost;
    state.resources.minerals -= def.mineralCost;
  }

  const building: RTSBuilding = {
    id: state.nextId++,
    def,
    x: col * state.tileSize,
    y: row * state.tileSize,
    gridCol: col,
    gridRow: row,
    hp: instant ? def.maxHp : Math.floor(def.maxHp * 0.1),
    maxHp: def.maxHp,
    state: instant ? 'active' : 'constructing',
    buildProgress: instant ? 1 : 0,
    team,
    attackTimer: 0,
    attackTargetId: null,
    productionQueue: [],
    productionProgress: 0,
    rallyPoint: null,
    selected: false,
  };

  // Mark grid cells as occupied
  for (let r = row; r < row + def.footprint.h; r++) {
    for (let c = col; c < col + def.footprint.w; c++) {
      state.buildingGrid[r][c] = building.id;
      // Buildings block movement
      if (key !== 'repair_pad') state.walkGrid[r][c] = 2;
    }
  }

  state.buildings.set(building.id, building);

  // Recalculate power and supply
  recalcResources(state);

  return building;
}

/** Recalculate power, supply cap, income rate from all active buildings. */
export function recalcResources(state: GroundRTSState): void {
  let powerGen = 0;
  let powerUse = 0;
  let supplyCap = 0;
  let income = 0;
  let maxMinerals = 1000; // base

  for (const b of state.buildings.values()) {
    if (b.state === 'destroyed' || b.state === 'constructing') continue;
    if (b.team !== 0) continue;

    if (b.def.powerCost < 0) {
      powerGen += Math.abs(b.def.powerCost);
    } else {
      powerUse += b.def.powerCost;
    }
    if (b.def.supplyCap) supplyCap += b.def.supplyCap;
    if (b.def.incomeRate && b.state === 'active') income += b.def.incomeRate;
    if (b.def.storageCap) maxMinerals += b.def.storageCap;
  }

  state.resources.powerGenerated = powerGen;
  state.resources.powerConsumed = powerUse;
  state.resources.power = powerGen - powerUse;
  state.resources.supplyCap = supplyCap;
  state.resources.incomeRate = income;
  state.resources.maxMinerals = maxMinerals;

  // Mark buildings as unpowered if total power is negative
  if (state.resources.power < 0) {
    for (const b of state.buildings.values()) {
      if (b.state === 'active' && b.def.powerCost > 0 && b.team === 0) {
        b.state = 'unpowered';
      }
    }
  } else {
    for (const b of state.buildings.values()) {
      if (b.state === 'unpowered' && b.team === 0) {
        b.state = 'active';
      }
    }
  }

  // Count supply
  let supplyCurrent = 0;
  for (const u of state.units.values()) {
    if (u.team === 0 && u.state !== 'dead') supplyCurrent++;
  }
  state.resources.supplyCurrent = supplyCurrent;
}

/** Tick all buildings: construction, income, turret AI. */
export function tickBuildings(state: GroundRTSState, dt: number): void {
  const allUnits = [...state.units.values()];

  for (const b of state.buildings.values()) {
    if (b.state === 'destroyed') continue;

    // Construction tick
    if (b.state === 'constructing') {
      const rate = b.def.buildTime > 0 ? dt / b.def.buildTime : 1;
      b.buildProgress = Math.min(1, b.buildProgress + rate);
      b.hp = Math.floor(b.def.maxHp * (0.1 + 0.9 * b.buildProgress));
      if (b.buildProgress >= 1) {
        b.state = 'active';
        b.hp = b.def.maxHp;
        recalcResources(state);
        state.floatTexts.push({
          x: b.x + state.tileSize,
          y: b.y,
          text: `${b.def.name} READY`,
          color: '#44ee88',
          age: 0,
        });
      }
      continue;
    }

    // Income tick (refineries)
    if (b.state === 'active' && b.def.incomeRate && b.team === 0) {
      state.resources.credits += b.def.incomeRate * dt;
    }

    // Production queue tick
    if (b.state === 'active' && b.productionQueue.length > 0 && b.team === 0) {
      const prodClass = b.productionQueue[0];
      const prodDef = PRODUCTION_DEFS.find((p) => p.unitClass === prodClass);
      if (prodDef) {
        b.productionProgress += dt / prodDef.buildTime;
        if (b.productionProgress >= 1) {
          b.productionProgress = 0;
          b.productionQueue.shift();
          // Spawn the produced unit
          const unitDef = PRODUCTION_UNITS.find((u) => u.unitClass === prodClass);
          if (unitDef) {
            const rally = b.rallyPoint ?? {
              x: b.x + (b.def.footprint.w * state.tileSize) / 2,
              y: b.y + (b.def.footprint.h + 1) * state.tileSize,
            };
            const spawned = spawnUnit(state, { ...unitDef, team: b.team }, rally.x, rally.y, b.team);
            state.floatTexts.push({
              x: b.x + state.tileSize,
              y: b.y,
              text: `${unitDef.displayName} READY`,
              color: '#44eeff',
              age: 0,
            });
          }
        }
      }
    }

    // Turret AI (defense buildings with attack stats)
    if (b.state === 'active' && b.def.attackDamage && b.def.attackRange) {
      b.attackTimer = Math.max(0, b.attackTimer - dt);

      // Find target
      if (b.attackTargetId == null || !state.units.has(b.attackTargetId)) {
        b.attackTargetId = null;
        const bCenter = { x: b.x + (state.tileSize * b.def.footprint.w) / 2, y: b.y + (state.tileSize * b.def.footprint.h) / 2 };
        let closest = Infinity;
        for (const u of allUnits) {
          if (u.team === b.team || u.state === 'dead' || u.state === 'dying') continue;
          const d = dist(bCenter, u);
          if (d < b.def.attackRange && d < closest) {
            closest = d;
            b.attackTargetId = u.id;
          }
        }
      }

      // Fire
      if (b.attackTargetId != null && b.attackTimer <= 0) {
        const target = state.units.get(b.attackTargetId);
        if (target && target.state !== 'dead' && target.state !== 'dying') {
          const bCenter = { x: b.x + (state.tileSize * b.def.footprint.w) / 2, y: b.y + (state.tileSize * b.def.footprint.h) / 2 };
          b.attackTimer = b.def.attackCooldown!;
          state.projectiles.set(state.nextId, {
            id: state.nextId++,
            x: bCenter.x,
            y: bCenter.y,
            targetId: target.id,
            speed: PROJECTILE_SPEED * 1.2,
            damage: b.def.attackDamage!,
            team: b.team,
            color: '#ff4488',
            radius: 4,
          });
        }
      }
    }
  }
}

/** Deal damage to a building. Destroys if HP <= 0. */
export function damageBuildingById(state: GroundRTSState, buildingId: number, damage: number): void {
  const b = state.buildings.get(buildingId);
  if (!b || b.state === 'destroyed') return;
  b.hp -= damage;
  if (b.hp <= 0) {
    b.hp = 0;
    b.state = 'destroyed';
    // Free grid cells
    for (let r = b.gridRow; r < b.gridRow + b.def.footprint.h; r++) {
      for (let c = b.gridCol; c < b.gridCol + b.def.footprint.w; c++) {
        if (r >= 0 && r < state.tileRows && c >= 0 && c < state.tileCols) {
          state.buildingGrid[r][c] = 0;
          state.walkGrid[r][c] = 0; // becomes walkable rubble
        }
      }
    }
    recalcResources(state);
    state.floatTexts.push({
      x: b.x + state.tileSize,
      y: b.y,
      text: `${b.def.name} DESTROYED`,
      color: '#ff4444',
      age: 0,
    });
  }
}
