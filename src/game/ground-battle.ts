/**
 * ground-battle.ts — Warhammer 3 style RTS ground battle simulation.
 *
 * Two phases:
 *   DEPLOY  — Player drags squads onto their half of the battlefield.
 *   BATTLE  — Squads march, fight, rout. Winner when enemy army breaks.
 *
 * Movement improvements (sourced from GitHub):
 *   A* pathfinding  — qiao/PathFinding.js (MIT, 8.7k stars)
 *                     npm: pathfinding — grid-based A* with diagonal movement.
 *                     Squads path around friendly blockers instead of overlapping.
 *   Boids separation — Craig Reynolds steering (mreinstein/boids, MIT)
 *                     Soft repulsion from nearby same-team squads prevents overlap.
 *
 * Flanking and rear charges deal bonus damage + morale shock.
 */

import { Grid, AStarFinder } from 'pathfinding';
import type { PlanetType } from './space-types';

// ── Pathfinding constants ─────────────────────────────────────────
const PF_CELL = 4; // world-units per grid cell
const PF_INTERVAL = 1.5; // seconds between A* recomputes

const finder = new AStarFinder({ allowDiagonal: true, dontCrossCorners: true });

function toCell(v: number, max: number): number {
  return Math.max(0, Math.min(Math.floor(v / PF_CELL), max - 1));
}

function computePath(state: GroundBattleState, sq: Squad, tx: number, ty: number): Vec2[] {
  const cols = Math.ceil(state.fieldW / PF_CELL);
  const rows = Math.ceil(state.fieldH / PF_CELL);
  const grid = new Grid(cols, rows);

  for (const other of state.squads) {
    if (other.id === sq.id || other.dead || other.routed || other.team !== sq.team) continue;
    grid.setWalkableAt(toCell(other.x, cols), toCell(other.y, rows), false);
  }

  const sx = toCell(sq.x, cols),
    sy = toCell(sq.y, rows);
  const ex = toCell(tx, cols),
    ey = toCell(ty, rows);
  if (sx === ex && sy === ey) return [{ x: tx, y: ty }];

  const raw = finder.findPath(sx, sy, ex, ey, grid);
  if (raw.length === 0) return [{ x: tx, y: ty }];
  return raw.map(([cx, cy]) => ({ x: cx * PF_CELL + PF_CELL / 2, y: cy * PF_CELL + PF_CELL / 2 }));
}

/**
 * Craig Reynolds boids separation steering.
 * Steers sq away from nearby same-team squads to prevent overlap.
 */
function separationForce(sq: Squad, all: Squad[]): Vec2 {
  const RADIUS = 12,
    MAX = 20;
  let fx = 0,
    fy = 0,
    count = 0;
  for (const o of all) {
    if (o.id === sq.id || o.dead || o.routed) continue;
    const dx = sq.x - o.x,
      dy = sq.y - o.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > 0 && d < RADIUS) {
      const w = (RADIUS - d) / RADIUS;
      fx += (dx / d) * w;
      fy += (dy / d) * w;
      count++;
    }
  }
  if (count === 0) return { x: 0, y: 0 };
  const mag = Math.sqrt(fx * fx + fy * fy);
  return mag > 0 ? { x: (fx / mag) * MAX, y: (fy / mag) * MAX } : { x: 0, y: 0 };
}

// ── Types ─────────────────────────────────────────────────────────
export type BattlePhase = 'deploy' | 'battle' | 'done';
export type SquadType = 'infantry' | 'ranged' | 'cavalry' | 'siege';
export type BattleResult = 'none' | 'victory' | 'defeat';
export type MissionType = 'eliminate' | 'assassinate' | 'sabotage' | 'hold';

export interface MissionDef {
  type: MissionType;
  label: string;
  shortDesc: string;
  icon: string;
  color: string;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface Squad {
  id: number;
  team: 0 | 1;
  type: SquadType;
  name: string;
  x: number;
  y: number;
  facing: number;
  hp: number;
  maxHp: number;
  morale: number;
  maxMorale: number;
  speed: number;
  attackDmg: number;
  attackRange: number;
  attackCooldown: number;
  attackTimer: number;
  armor: number;
  unitCount: number;
  maxUnits: number;
  routed: boolean;
  dead: boolean;
  selected: boolean;
  moveTarget: Vec2 | null;
  attackTargetId: number | null;
  // A* path following
  path: Vec2[];
  pathTimer: number;
  pathTargetKey: string;
  // Visual
  color: string;
  icon: string;
}

export interface BattleFloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  age: number;
}

/** Catalogue of all mission types — used for the select screen. */
export const MISSION_DEFS: MissionDef[] = [
  {
    type: 'eliminate',
    label: 'ELIMINATE',
    shortDesc: 'Destroy every enemy squad.',
    icon: '⚔️',
    color: '#ff4444',
  },
  {
    type: 'assassinate',
    label: 'ASSASSINATE',
    shortDesc: 'Hunt down and destroy the enemy commander squad.',
    icon: '🗡️',
    color: '#ff8800',
  },
  {
    type: 'sabotage',
    label: 'SABOTAGE',
    shortDesc: 'Reach the target zone with at least one squad.',
    icon: '💥',
    color: '#44ddff',
  },
  {
    type: 'hold',
    label: 'HOLD THE LINE',
    shortDesc: 'Survive 3 enemy waves. Reinforcements come every 30s.',
    icon: '🛡️',
    color: '#44ee88',
  },
];

export interface GroundBattleState {
  phase: BattlePhase;
  result: BattleResult;
  planetType: PlanetType;
  squads: Squad[];
  floatTexts: BattleFloatText[];
  fieldW: number;
  fieldH: number;
  deployLineY: number;
  gameTime: number;
  nextId: number;
  // ── Mission system ────────────────────────────────────────────
  missionType: MissionType;
  missionObjective: string;
  missionProgress: number; // generic progress value
  missionGoal: number; // target value
  // Assassinate
  bossSquadId: number | null;
  // Sabotage
  sabotageX: number;
  sabotageY: number;
  sabotageRadius: number;
  sabotageReached: boolean;
  // Hold
  holdWave: number; // current wave number (1-based)
  holdMaxWaves: number; // total waves to survive
  holdWaveTimer: number; // countdown to next wave
  holdWaveInterval: number; // seconds between waves
}

// ── Templates ─────────────────────────────────────────────────────
interface SquadTemplate {
  type: SquadType;
  name: string;
  hp: number;
  morale: number;
  speed: number;
  attackDmg: number;
  attackRange: number;
  attackCooldown: number;
  armor: number;
  unitCount: number;
  icon: string;
  color: string;
}

const PLAYER_TEMPLATES: SquadTemplate[] = [
  {
    type: 'infantry',
    name: 'Marines',
    hp: 400,
    morale: 80,
    speed: 30,
    attackDmg: 12,
    attackRange: 3,
    attackCooldown: 1.0,
    armor: 4,
    unitCount: 20,
    icon: '⚔',
    color: '#4488ff',
  },
  {
    type: 'infantry',
    name: 'Heavy Guard',
    hp: 600,
    morale: 90,
    speed: 22,
    attackDmg: 16,
    attackRange: 3,
    attackCooldown: 1.2,
    armor: 8,
    unitCount: 16,
    icon: '🛡',
    color: '#44aaff',
  },
  {
    type: 'ranged',
    name: 'Marksmen',
    hp: 250,
    morale: 60,
    speed: 28,
    attackDmg: 18,
    attackRange: 22,
    attackCooldown: 2.0,
    armor: 1,
    unitCount: 14,
    icon: '🏹',
    color: '#44ffaa',
  },
  {
    type: 'cavalry',
    name: 'Assault Bikes',
    hp: 350,
    morale: 70,
    speed: 55,
    attackDmg: 22,
    attackRange: 3,
    attackCooldown: 0.8,
    armor: 3,
    unitCount: 8,
    icon: '🏍',
    color: '#ffaa22',
  },
  {
    type: 'siege',
    name: 'Mortar Team',
    hp: 200,
    morale: 50,
    speed: 15,
    attackDmg: 35,
    attackRange: 30,
    attackCooldown: 3.5,
    armor: 0,
    unitCount: 6,
    icon: '💥',
    color: '#ff6644',
  },
];

const ENEMY_TEMPLATES: SquadTemplate[] = [
  {
    type: 'infantry',
    name: 'Xeno Warriors',
    hp: 380,
    morale: 75,
    speed: 32,
    attackDmg: 14,
    attackRange: 3,
    attackCooldown: 1.0,
    armor: 3,
    unitCount: 22,
    icon: '👾',
    color: '#ff4444',
  },
  {
    type: 'infantry',
    name: 'Brutes',
    hp: 550,
    morale: 85,
    speed: 20,
    attackDmg: 20,
    attackRange: 3,
    attackCooldown: 1.4,
    armor: 6,
    unitCount: 12,
    icon: '🦾',
    color: '#ff6666',
  },
  {
    type: 'ranged',
    name: 'Spitters',
    hp: 220,
    morale: 55,
    speed: 26,
    attackDmg: 16,
    attackRange: 20,
    attackCooldown: 2.2,
    armor: 1,
    unitCount: 16,
    icon: '🎯',
    color: '#ff8844',
  },
  {
    type: 'cavalry',
    name: 'Raptors',
    hp: 300,
    morale: 65,
    speed: 58,
    attackDmg: 24,
    attackRange: 3,
    attackCooldown: 0.7,
    armor: 2,
    unitCount: 10,
    icon: '🦅',
    color: '#ffcc22',
  },
  {
    type: 'siege',
    name: 'Bile Cannon',
    hp: 180,
    morale: 40,
    speed: 12,
    attackDmg: 40,
    attackRange: 28,
    attackCooldown: 4.0,
    armor: 0,
    unitCount: 4,
    icon: '☠',
    color: '#cc2222',
  },
];

// ── Init ─────────────────────────────────────────────────────────
const FIELD_W = 120,
  FIELD_H = 80;

export function createBattleState(planetType: PlanetType, missionType: MissionType = 'eliminate'): GroundBattleState {
  const state: GroundBattleState = {
    phase: 'deploy',
    result: 'none',
    planetType,
    squads: [],
    floatTexts: [],
    fieldW: FIELD_W,
    fieldH: FIELD_H,
    deployLineY: FIELD_H / 2,
    gameTime: 0,
    nextId: 1,
    // Mission
    missionType,
    missionObjective: '',
    missionProgress: 0,
    missionGoal: 0,
    bossSquadId: null,
    sabotageX: FIELD_W / 2,
    sabotageY: 10,
    sabotageRadius: 10,
    sabotageReached: false,
    holdWave: 0,
    holdMaxWaves: 3,
    holdWaveTimer: 30,
    holdWaveInterval: 30,
  };

  // Spawn player squads
  for (let i = 0; i < PLAYER_TEMPLATES.length; i++) {
    const t = PLAYER_TEMPLATES[i];
    const sp = FIELD_W / (PLAYER_TEMPLATES.length + 1);
    state.squads.push(makeSquad(state, t, 0, sp * (i + 1), FIELD_H - 10, 0));
  }

  // Spawn enemies based on mission type
  if (missionType === 'assassinate') {
    // Normal enemies + a beefed-up boss squad
    for (let i = 0; i < ENEMY_TEMPLATES.length - 1; i++) {
      const t = ENEMY_TEMPLATES[i];
      const sp = FIELD_W / ENEMY_TEMPLATES.length;
      state.squads.push(makeSquad(state, t, 1, sp * (i + 1), 10, Math.PI));
    }
    const bossTmpl: SquadTemplate = {
      ...ENEMY_TEMPLATES[1],
      name: 'Commander',
      hp: 900,
      morale: 110,
      speed: 18,
      attackDmg: 28,
      attackRange: 5,
      attackCooldown: 0.9,
      armor: 10,
      unitCount: 6,
      icon: '👑',
      color: '#ffaa00',
    };
    const boss = makeSquad(state, bossTmpl, 1, FIELD_W / 2, 8, Math.PI);
    state.squads.push(boss);
    state.bossSquadId = boss.id;
    state.missionObjective = 'Assassinate the enemy Commander';
    state.missionGoal = 1;
  } else if (missionType === 'sabotage') {
    // Lighter enemy force, objective marker placed deep in enemy territory
    const lightTempls = ENEMY_TEMPLATES.slice(0, 3);
    for (let i = 0; i < lightTempls.length; i++) {
      const t = lightTempls[i];
      const sp = FIELD_W / (lightTempls.length + 1);
      state.squads.push(makeSquad(state, t, 1, sp * (i + 1), 10, Math.PI));
    }
    state.sabotageX = FIELD_W / 2;
    state.sabotageY = 8;
    state.missionObjective = 'Reach the target zone';
    state.missionGoal = 1;
  } else if (missionType === 'hold') {
    // First wave spawns on battle start — state initially empty enemies
    state.holdWave = 0;
    state.holdWaveTimer = 5; // first wave comes quickly
    state.holdMaxWaves = 3;
    state.missionObjective = 'Survive all waves';
    state.missionGoal = state.holdMaxWaves;
  } else {
    // Eliminate — standard squad setup
    for (let i = 0; i < ENEMY_TEMPLATES.length; i++) {
      const t = ENEMY_TEMPLATES[i];
      const sp = FIELD_W / (ENEMY_TEMPLATES.length + 1);
      state.squads.push(makeSquad(state, t, 1, sp * (i + 1), 10, Math.PI));
    }
    state.missionObjective = 'Destroy all enemy squads';
    state.missionGoal = ENEMY_TEMPLATES.length;
  }

  return state;
}

function makeSquad(state: GroundBattleState, t: SquadTemplate, team: 0 | 1, x: number, y: number, facing: number): Squad {
  return {
    id: state.nextId++,
    team,
    type: t.type,
    name: t.name,
    x,
    y,
    facing,
    hp: t.hp,
    maxHp: t.hp,
    morale: t.morale,
    maxMorale: t.morale,
    speed: t.speed,
    attackDmg: t.attackDmg,
    attackRange: t.attackRange,
    attackCooldown: t.attackCooldown,
    attackTimer: 0,
    armor: t.armor,
    unitCount: t.unitCount,
    maxUnits: t.unitCount,
    routed: false,
    dead: false,
    selected: false,
    moveTarget: null,
    attackTargetId: null,
    path: [],
    pathTimer: 0,
    pathTargetKey: '',
    color: t.color,
    icon: t.icon,
  };
}

// ── Start battle ──────────────────────────────────────────────────
export function startBattle(state: GroundBattleState): void {
  if (state.phase !== 'deploy') return;
  state.phase = 'battle';
  for (const sq of state.squads) {
    if (sq.team === 1 && !sq.dead) {
      sq.moveTarget = { x: sq.x, y: FIELD_H * 0.6 + Math.random() * 10 };
    }
  }
}

// ── Main update ───────────────────────────────────────────────────
export function updateGroundBattle(state: GroundBattleState, dt: number): void {
  if (state.phase !== 'battle') return;
  state.gameTime += dt;

  const alive = (team: number) => state.squads.filter((s) => !s.dead && !s.routed && s.team === team);

  for (const sq of state.squads) {
    if (sq.dead || sq.routed) continue;

    // Morale recovery
    if (!sq.attackTargetId) sq.morale = Math.min(sq.maxMorale, sq.morale + 2 * dt);

    // Rout
    if (sq.morale <= 0) {
      sq.routed = true;
      sq.path = [];
      sq.moveTarget = sq.team === 0 ? { x: sq.x, y: FIELD_H + 20 } : { x: sq.x, y: -20 };
      sq.attackTargetId = null;
      spawnFloat(state, sq.x, sq.y, 'ROUTED!', '#ff4444');
      continue;
    }

    // HP → unit count
    sq.unitCount = Math.max(0, Math.ceil((sq.hp / sq.maxHp) * sq.maxUnits));
    if (sq.hp <= 0) {
      sq.dead = true;
      sq.unitCount = 0;
      continue;
    }

    // Enemy AI: target nearest player squad
    if (sq.team === 1 && !sq.attackTargetId) {
      let best: Squad | null = null,
        bestD = Infinity;
      for (const t of alive(0)) {
        const d = dist(sq, t);
        if (d < bestD) {
          bestD = d;
          best = t;
        }
      }
      if (best) sq.attackTargetId = best.id;
    }

    // ── Movement: A* + boids separation ─────────────────────
    const tgt = sq.attackTargetId ? (state.squads.find((s) => s.id === sq.attackTargetId) ?? null) : null;
    const rawDest = tgt && !tgt.dead && !tgt.routed ? { x: tgt.x, y: tgt.y } : sq.moveTarget;

    if (rawDest) {
      const stopDist = tgt ? sq.attackRange * 0.8 : 1;
      const dxFull = rawDest.x - sq.x,
        dyFull = rawDest.y - sq.y;
      const dFull = Math.sqrt(dxFull * dxFull + dyFull * dyFull);

      if (dFull > stopDist) {
        const key = `${Math.round(rawDest.x)},${Math.round(rawDest.y)}`;
        sq.pathTimer -= dt;
        if (sq.pathTargetKey !== key || sq.pathTimer <= 0 || sq.path.length === 0) {
          sq.path = computePath(state, sq, rawDest.x, rawDest.y);
          sq.pathTimer = PF_INTERVAL;
          sq.pathTargetKey = key;
        }

        // Skip already-reached waypoints
        while (sq.path.length > 1 && Math.hypot(sq.path[0].x - sq.x, sq.path[0].y - sq.y) < PF_CELL) {
          sq.path.shift();
        }
        const wp = sq.path[0] ?? rawDest;

        let dx = wp.x - sq.x,
          dy = wp.y - sq.y;
        const dw = Math.sqrt(dx * dx + dy * dy);
        if (dw > 0) {
          dx /= dw;
          dy /= dw;
        }

        // Boids separation (Craig Reynolds)
        const sep = separationForce(sq, state.squads);
        dx += sep.x / sq.speed;
        dy += sep.y / sq.speed;
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag > 0) {
          dx /= mag;
          dy /= mag;
        }

        const spd = sq.speed * dt;
        sq.x = Math.max(0, Math.min(state.fieldW, sq.x + dx * Math.min(spd, dFull)));
        sq.y = Math.max(0, Math.min(state.fieldH, sq.y + dy * Math.min(spd, dFull)));
        sq.facing = Math.atan2(dy, dx);
      } else if (!tgt) {
        sq.moveTarget = null;
        sq.path = [];
      }
    } else {
      // Stationary — gentle separation
      const sep = separationForce(sq, state.squads);
      if (sep.x !== 0 || sep.y !== 0) {
        sq.x = Math.max(0, Math.min(state.fieldW, sq.x + (sep.x * 6 * dt) / sq.speed));
        sq.y = Math.max(0, Math.min(state.fieldH, sq.y + (sep.y * 6 * dt) / sq.speed));
      }
    }

    // ── Combat ──────────────────────────────────────────────
    sq.attackTimer = Math.max(0, sq.attackTimer - dt);
    if (tgt && !tgt.dead && !tgt.routed) {
      if (dist(sq, tgt) <= sq.attackRange && sq.attackTimer <= 0) {
        const toT = Math.atan2(tgt.y - sq.y, tgt.x - sq.x);
        const faceDiff = angleDiff(tgt.facing, toT + Math.PI);
        const isFlank = Math.abs(faceDiff) < Math.PI * 0.4;
        const dmg = Math.max(1, sq.attackDmg * (isFlank ? 1.5 : 1.0) - tgt.armor);
        tgt.hp -= dmg;
        tgt.morale -= isFlank ? 8 : 3;
        sq.attackTimer = sq.attackCooldown;
        spawnFloat(state, tgt.x, tgt.y - 1, `-${Math.round(dmg)}`, isFlank ? '#ff8800' : '#ff4444');
        if (tgt.hp <= 0) {
          tgt.dead = true;
          tgt.unitCount = 0;
          sq.attackTargetId = null;
          spawnFloat(state, tgt.x, tgt.y, 'DESTROYED', '#ff2222');
        }
      }
    } else if (tgt && (tgt.dead || tgt.routed)) {
      sq.attackTargetId = null;
    }
  }

  // Float decay
  for (let i = state.floatTexts.length - 1; i >= 0; i--) {
    state.floatTexts[i].age += dt;
    state.floatTexts[i].y -= 4 * dt;
    if (state.floatTexts[i].age > 1.5) state.floatTexts.splice(i, 1);
  }

  // ── Mission win / loss logic ─────────────────────────────────────────
  if (alive(0).length === 0) {
    state.phase = 'done';
    state.result = 'defeat';
    return;
  }

  if (state.missionType === 'eliminate') {
    if (alive(1).length === 0) {
      state.phase = 'done';
      state.result = 'victory';
    }
  } else if (state.missionType === 'assassinate') {
    const boss = state.squads.find((s) => s.id === state.bossSquadId);
    if (!boss || boss.dead || boss.routed) {
      state.phase = 'done';
      state.result = 'victory';
    }
  } else if (state.missionType === 'sabotage') {
    // Check if any player squad is in the sabotage zone
    if (!state.sabotageReached) {
      for (const sq of alive(0)) {
        const dx = sq.x - state.sabotageX;
        const dy = sq.y - state.sabotageY;
        if (Math.sqrt(dx * dx + dy * dy) < state.sabotageRadius) {
          state.sabotageReached = true;
          state.missionProgress = 1;
          spawnFloat(state, state.sabotageX, state.sabotageY, 'SABOTAGE COMPLETE!', '#44ddff');
          break;
        }
      }
    }
    if (state.sabotageReached) {
      state.phase = 'done';
      state.result = 'victory';
    }
  } else if (state.missionType === 'hold') {
    // Tick wave timer
    state.holdWaveTimer -= dt;
    if (state.holdWaveTimer <= 0) {
      if (state.holdWave < state.holdMaxWaves) {
        state.holdWave++;
        state.holdWaveTimer = state.holdWaveInterval;
        state.missionProgress = state.holdWave;
        spawnHoldWave(state);
        spawnFloat(state, state.fieldW / 2, state.fieldH / 2, `WAVE ${state.holdWave} INCOMING!`, '#ff4444');
      } else {
        // All waves survived
        if (alive(1).length === 0) {
          state.phase = 'done';
          state.result = 'victory';
        }
      }
    }
    // Also win if all waves spawned and all enemies cleared
    if (state.holdWave >= state.holdMaxWaves && alive(1).length === 0) {
      state.phase = 'done';
      state.result = 'victory';
    }
  }
}

/** Spawn a wave of enemies for Hold missions, scaling with wave number. */
function spawnHoldWave(state: GroundBattleState): void {
  const waveScale = 0.8 + state.holdWave * 0.3; // each wave is stronger
  const count = 3 + state.holdWave; // more squads per wave
  for (let i = 0; i < count; i++) {
    const t = ENEMY_TEMPLATES[i % ENEMY_TEMPLATES.length];
    const boosted: SquadTemplate = {
      ...t,
      hp: Math.round(t.hp * waveScale),
      attackDmg: Math.round(t.attackDmg * waveScale),
      morale: Math.round(t.morale * waveScale),
      name: `W${state.holdWave} ${t.name}`,
    };
    const sp = state.fieldW / (count + 1);
    const sq = makeSquad(state, boosted, 1, sp * (i + 1), 5 + Math.random() * 5, Math.PI);
    state.squads.push(sq);
  }
}

// ── Player commands ───────────────────────────────────────────────
export function moveSquad(state: GroundBattleState, squadId: number, target: Vec2): void {
  const sq = state.squads.find((s) => s.id === squadId);
  if (!sq || sq.dead || sq.routed || sq.team !== 0) return;
  sq.moveTarget = target;
  sq.attackTargetId = null;
  sq.path = [];
  sq.pathTargetKey = '';
}

export function attackSquad(state: GroundBattleState, squadId: number, targetId: number): void {
  const sq = state.squads.find((s) => s.id === squadId);
  if (!sq || sq.dead || sq.routed || sq.team !== 0) return;
  sq.attackTargetId = targetId;
  sq.moveTarget = null;
  sq.path = [];
  sq.pathTargetKey = '';
}

export function repositionSquad(state: GroundBattleState, squadId: number, x: number, y: number): void {
  if (state.phase !== 'deploy') return;
  const sq = state.squads.find((s) => s.id === squadId);
  if (!sq || sq.team !== 0) return;
  sq.x = Math.max(2, Math.min(state.fieldW - 2, x));
  sq.y = Math.max(state.deployLineY + 2, Math.min(state.fieldH - 2, y));
}

// ── Helpers ───────────────────────────────────────────────────────
function dist(a: Vec2, b: Vec2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
function angleDiff(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
function spawnFloat(state: GroundBattleState, x: number, y: number, text: string, color: string): void {
  state.floatTexts.push({ x, y, text, color, age: 0 });
}
