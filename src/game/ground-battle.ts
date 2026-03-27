/**
 * ground-battle.ts — Warhammer 3 style RTS ground battle simulation.
 *
 * Two phases:
 *   DEPLOY  — Player drags squads onto their half of the battlefield.
 *   BATTLE  — Squads march, fight, rout. Winner when enemy army breaks.
 *
 * Squads have: position, facing, HP, morale, speed, attack, armor, type.
 * Combat is auto-resolved when squads are in melee/ranged range.
 * Flanking and rear charges deal bonus damage + morale shock.
 */

import type { PlanetType } from './space-types';

// ── Types ─────────────────────────────────────────────────────────
export type BattlePhase = 'deploy' | 'battle' | 'done';
export type SquadType = 'infantry' | 'ranged' | 'cavalry' | 'siege';
export type BattleResult = 'none' | 'victory' | 'defeat';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Squad {
  id: number;
  team: 0 | 1; // 0 = player, 1 = enemy
  type: SquadType;
  name: string;
  x: number;
  y: number;
  facing: number; // radians
  hp: number;
  maxHp: number;
  morale: number; // 0-100, routs at 0
  maxMorale: number;
  speed: number;
  attackDmg: number;
  attackRange: number; // melee ~2, ranged ~20
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

export interface GroundBattleState {
  phase: BattlePhase;
  result: BattleResult;
  planetType: PlanetType;
  squads: Squad[];
  floatTexts: BattleFloatText[];
  fieldW: number;
  fieldH: number;
  deployLineY: number; // y-coordinate dividing player/enemy halves
  gameTime: number;
  nextId: number;
}

// ── Squad templates ───────────────────────────────────────────────
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

// ── Initialization ────────────────────────────────────────────────
const FIELD_W = 120;
const FIELD_H = 80;

export function createBattleState(planetType: PlanetType): GroundBattleState {
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
  };

  // Spawn player squads at bottom (y > deployLineY)
  for (let i = 0; i < PLAYER_TEMPLATES.length; i++) {
    const t = PLAYER_TEMPLATES[i];
    const spacing = FIELD_W / (PLAYER_TEMPLATES.length + 1);
    state.squads.push(makeSquad(state, t, 0, spacing * (i + 1), FIELD_H - 10, 0));
  }

  // Spawn enemy squads at top (y < deployLineY)
  for (let i = 0; i < ENEMY_TEMPLATES.length; i++) {
    const t = ENEMY_TEMPLATES[i];
    const spacing = FIELD_W / (ENEMY_TEMPLATES.length + 1);
    state.squads.push(makeSquad(state, t, 1, spacing * (i + 1), 10, Math.PI));
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
    color: t.color,
    icon: t.icon,
  };
}

// ── Start battle (transition from deploy → battle) ────────────────
export function startBattle(state: GroundBattleState): void {
  if (state.phase !== 'deploy') return;
  state.phase = 'battle';
  // Enemy AI: assign attack targets — each enemy targets nearest player squad
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

    // ── Morale recovery (slow out of combat) ────────────────
    if (!sq.attackTargetId) {
      sq.morale = Math.min(sq.maxMorale, sq.morale + 2 * dt);
    }

    // ── Rout check ──────────────────────────────────────────
    if (sq.morale <= 0) {
      sq.routed = true;
      sq.moveTarget = sq.team === 0 ? { x: sq.x, y: FIELD_H + 20 } : { x: sq.x, y: -20 };
      sq.attackTargetId = null;
      spawnFloat(state, sq.x, sq.y, 'ROUTED!', '#ff4444');
      continue;
    }

    // ── Unit count from HP ──────────────────────────────────
    sq.unitCount = Math.max(0, Math.ceil((sq.hp / sq.maxHp) * sq.maxUnits));
    if (sq.hp <= 0) {
      sq.dead = true;
      sq.unitCount = 0;
      continue;
    }

    // ── Target acquisition (enemy AI + player squads with attackTargetId) ─
    if (sq.team === 1 && !sq.attackTargetId) {
      // AI: find nearest player squad
      const targets = alive(0);
      let best: Squad | null = null,
        bestD = Infinity;
      for (const t of targets) {
        const d = dist(sq, t);
        if (d < bestD) {
          bestD = d;
          best = t;
        }
      }
      if (best) sq.attackTargetId = best.id;
    }

    // ── Movement ────────────────────────────────────────────
    const target = sq.attackTargetId ? state.squads.find((s) => s.id === sq.attackTargetId) : null;
    const moveTo = target && !target.dead && !target.routed ? { x: target.x, y: target.y } : sq.moveTarget;

    if (moveTo) {
      const dx = moveTo.x - sq.x,
        dy = moveTo.y - sq.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const stopDist = target ? sq.attackRange * 0.8 : 1;
      if (d > stopDist) {
        const spd = (sq.routed ? sq.speed * 1.5 : sq.speed) * dt;
        sq.x += (dx / d) * Math.min(spd, d);
        sq.y += (dy / d) * Math.min(spd, d);
        sq.facing = Math.atan2(dy, dx);
      } else if (!target) {
        sq.moveTarget = null;
      }
    }

    // ── Combat ──────────────────────────────────────────────
    sq.attackTimer = Math.max(0, sq.attackTimer - dt);
    if (target && !target.dead && !target.routed) {
      const d = dist(sq, target);
      if (d <= sq.attackRange && sq.attackTimer <= 0) {
        // Flanking: if attacker is behind target (dot product of facing)
        const toTarget = Math.atan2(target.y - sq.y, target.x - sq.x);
        const facingDiff = angleDiff(target.facing, toTarget + Math.PI);
        const isFlank = Math.abs(facingDiff) < Math.PI * 0.4;
        const flankMult = isFlank ? 1.5 : 1.0;

        const dmg = Math.max(1, sq.attackDmg * flankMult - target.armor);
        target.hp -= dmg;
        target.morale -= isFlank ? 8 : 3;
        sq.attackTimer = sq.attackCooldown;

        spawnFloat(state, target.x, target.y - 1, `-${Math.round(dmg)}`, isFlank ? '#ff8800' : '#ff4444');

        if (target.hp <= 0) {
          target.dead = true;
          target.unitCount = 0;
          sq.attackTargetId = null;
          spawnFloat(state, target.x, target.y, 'DESTROYED', '#ff2222');
        }
      }
    } else if (target && (target.dead || target.routed)) {
      sq.attackTargetId = null;
    }
  }

  // ── Float text decay ──────────────────────────────────────
  for (let i = state.floatTexts.length - 1; i >= 0; i--) {
    state.floatTexts[i].age += dt;
    state.floatTexts[i].y -= 4 * dt;
    if (state.floatTexts[i].age > 1.5) state.floatTexts.splice(i, 1);
  }

  // ── Win/loss check ────────────────────────────────────────
  const playerAlive = alive(0).length;
  const enemyAlive = alive(1).length;
  if (enemyAlive === 0 && state.phase === 'battle') {
    state.phase = 'done';
    state.result = 'victory';
  } else if (playerAlive === 0 && state.phase === 'battle') {
    state.phase = 'done';
    state.result = 'defeat';
  }
}

// ── Player commands ───────────────────────────────────────────────
export function moveSquad(state: GroundBattleState, squadId: number, target: Vec2): void {
  const sq = state.squads.find((s) => s.id === squadId);
  if (!sq || sq.dead || sq.routed || sq.team !== 0) return;
  sq.moveTarget = target;
  sq.attackTargetId = null;
}

export function attackSquad(state: GroundBattleState, squadId: number, targetId: number): void {
  const sq = state.squads.find((s) => s.id === squadId);
  if (!sq || sq.dead || sq.routed || sq.team !== 0) return;
  sq.attackTargetId = targetId;
  sq.moveTarget = null;
}

export function repositionSquad(state: GroundBattleState, squadId: number, x: number, y: number): void {
  if (state.phase !== 'deploy') return;
  const sq = state.squads.find((s) => s.id === squadId);
  if (!sq || sq.team !== 0) return;
  // Clamp to player half (below deploy line)
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
