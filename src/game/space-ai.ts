/**
 * space-ai.ts — Advanced AI system with 5 difficulty levels
 *
 * Difficulty profiles:
 *  1 – Passive learner. Long cycles, random ships, ignores tech.
 *  2 – Basic. Prefers cheap fighters/corvettes, basic expansion.
 *  3 – Tactical. Composition awareness, T1-2 tech, flanking.
 *  4 – Strategic. Multi-front, full tech, void powers, workers.
 *  5 – Optimal. Perfect composition, all void powers, economy strangling.
 */

import type {
  SpaceGameState, SpaceShip, Team, Vec3,
} from './space-types';
import {
  BUILDABLE_SHIPS, getShipDef,
} from './space-types';
import { VOID_POWERS } from './space-techtree';

// ── Helpers ─────────────────────────────────────────────────────────
function dist2d(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ── Composition archetypes per difficulty ──────────────────────────
const COMPOSITION: Record<number, string[][]> = {
  1: [['red_fighter'], ['micro_recon'], ['galactix_racer'], ['red_fighter', 'red_fighter']],
  2: [['red_fighter', 'cf_corvette_01'], ['cf_corvette_02', 'galactix_racer'], ['cf_frigate_01'], ['dual_striker', 'red_fighter']],
  3: [
    ['cf_corvette_02', 'cf_corvette_03', 'cf_frigate_01'],
    ['cf_frigate_02', 'dual_striker', 'camo_stellar_jet'],
    ['cf_corvette_04', 'cf_corvette_03', 'cf_frigate_03'],
    ['warship', 'cf_corvette_02', 'cf_frigate_01'],
  ],
  4: [
    ['cf_frigate_03', 'cf_destroyer_01', 'cf_corvette_04'],
    ['cf_light_cruiser_03', 'cf_destroyer_02', 'cf_frigate_04'],
    ['cf_destroyer_03', 'cf_corvette_05', 'cf_frigate_05'],
    ['battleship', 'cf_frigate_04', 'cf_corvette_05'],
  ],
  5: [
    ['cf_light_cruiser_04', 'cf_destroyer_05', 'cf_frigate_03', 'cf_corvette_05'],
    ['boss_ship_01', 'cf_destroyer_05', 'cf_light_cruiser_02'],
    ['cf_light_cruiser_04', 'cf_light_cruiser_02', 'cf_frigate_05'],
    ['boss_ship_02', 'cf_destroyer_05', 'cf_destroyer_04'],
  ],
};

// Preferred tech research order per difficulty (node ids)
const TECH_PRIORITY: Record<number, string[]> = {
  1: [],
  2: ['forge_t1_cannons', 'forge_t1_plating'],
  3: ['forge_t1_cannons', 'forge_t1_plating', 'forge_t2_siege', 'tide_t1_shields', 'tide_t1_regen'],
  4: ['forge_t1_cannons', 'forge_t1_plating', 'forge_t2_siege', 'forge_t2_overcharge', 'tide_t1_shields', 'tide_t2_barrier', 'cmd_t1_link', 'cmd_t1_recon'],
  5: ['forge_t1_cannons', 'forge_t1_plating', 'forge_t2_siege', 'forge_t2_overcharge', 'forge_t2_molten',
      'tide_t1_shields', 'tide_t1_regen', 'tide_t2_barrier',
      'cmd_t1_link', 'cmd_t1_recon', 'cmd_t1_coord', 'cmd_t2_bombardment', 'cmd_t2_boss'],
};

export interface AIConfig {
  difficulty: number;          // 1-5
  buildCycleTime: number;      // seconds between build decisions
  tacticsCycleTime: number;    // seconds between tactics decisions
  techCycleTime: number;       // seconds between tech decisions
  useVoidPowers: boolean;
  useTech: boolean;
  useWorkers: boolean;
  multiFleet: boolean;         // attack multiple targets simultaneously
  responseDelay: number;       // seconds before reacting to threats
}

export function getAIConfig(difficulty: number): AIConfig {
  const d = Math.max(1, Math.min(5, difficulty));
  const configs: Record<number, AIConfig> = {
    1: { difficulty:1, buildCycleTime:8,   tacticsCycleTime:12, techCycleTime:999, useVoidPowers:false, useTech:false, useWorkers:false, multiFleet:false, responseDelay:6 },
    2: { difficulty:2, buildCycleTime:5,   tacticsCycleTime:8,  techCycleTime:30,  useVoidPowers:false, useTech:true,  useWorkers:false, multiFleet:false, responseDelay:4 },
    3: { difficulty:3, buildCycleTime:3,   tacticsCycleTime:5,  techCycleTime:20,  useVoidPowers:false, useTech:true,  useWorkers:true,  multiFleet:false, responseDelay:2 },
    4: { difficulty:4, buildCycleTime:2,   tacticsCycleTime:3,  techCycleTime:15,  useVoidPowers:true,  useTech:true,  useWorkers:true,  multiFleet:true,  responseDelay:1 },
    5: { difficulty:5, buildCycleTime:1.5, tacticsCycleTime:2,  techCycleTime:10,  useVoidPowers:true,  useTech:true,  useWorkers:true,  multiFleet:true,  responseDelay:0.5 },
  };
  return configs[d];
}

// ── Per-team AI brain state ──────────────────────────────────────────
export interface AIBrain {
  team: Team;
  cfg: AIConfig;
  buildTimer: number;
  tacticsTimer: number;
  techTimer: number;
  responseTimer: number;
  threatPlanetId: number | null;
  currentCompositionIdx: number;
  fleetGroups: Map<string, number[]>; // groupName -> ship ids
}

export function createAIBrain(team: Team, difficulty: number): AIBrain {
  return {
    team, cfg: getAIConfig(difficulty),
    buildTimer: Math.random() * 3,
    tacticsTimer: Math.random() * 5,
    techTimer: Math.random() * 10,
    responseTimer: 0,
    threatPlanetId: null,
    currentCompositionIdx: 0,
    fleetGroups: new Map(),
  };
}

// ── Main AI update ───────────────────────────────────────────────────
export function updateAIBrain(brain: AIBrain, state: SpaceGameState, dt: number,
  queueBuildFn: (stId: number, type: string) => boolean,
  startResearchFn: (team: Team, nodeId: string) => void,
  castVoidFn: (team: Team, powerId: string, x: number, y: number) => void,
  buildTurretFn: (team: Team, planetId: number, turretType: string) => void,
) {
  if (state.gameOver) return;
  brain.buildTimer   += dt;
  brain.tacticsTimer += dt;
  brain.techTimer    += dt;
  brain.responseTimer = Math.max(0, brain.responseTimer - dt);

  if (brain.buildTimer >= brain.cfg.buildCycleTime) {
    brain.buildTimer = 0;
    aiBuildStep(brain, state, queueBuildFn);
  }
  if (brain.tacticsTimer >= brain.cfg.tacticsCycleTime) {
    brain.tacticsTimer = 0;
    if (brain.responseTimer <= 0) aiTacticsStep(brain, state);
  }
  if (brain.cfg.useTech && brain.techTimer >= brain.cfg.techCycleTime) {
    brain.techTimer = 0;
    aiTechStep(brain, state, startResearchFn, buildTurretFn);
  }
  if (brain.cfg.useVoidPowers) {
    aiVoidPowerStep(brain, state, castVoidFn);
  }
  // Per-frame strafing/evasion
  aiMicroStep(brain, state, dt);
}

// ── Build step ──────────────────────────────────────────────────────
function aiBuildStep(brain: AIBrain, state: SpaceGameState,
  queueBuild: (stId: number, type: string) => boolean,
) {
  const { team, cfg } = brain;
  const res = state.resources[team];
  if (!res) return;

  // Count current ships (excluding workers)
  let combatCount = 0, workerCount = 0;
  for (const [, s] of state.ships) {
    if (s.dead || s.team !== team) continue;
    if (s.shipClass === 'worker') workerCount++; else combatCount++;
  }

  const techState = state.techState?.get(team);
  const unlockedExtra = techState?.unlockedShips ?? new Set<string>();

  for (const [, st] of state.stations) {
    if (st.dead || st.team !== team || st.buildQueue.length >= 2) continue;

    // Always maintain some workers at D3+
    if (cfg.useWorkers && workerCount < 3 && res.credits >= 55 && res.minerals >= 25) {
      if (queueBuild(st.id, 'mining_drone')) continue;
    }

    // Choose ship from composition archetype
    const pool = COMPOSITION[cfg.difficulty] ?? COMPOSITION[1];
    const comp = pool[brain.currentCompositionIdx % pool.length];
    const maxT = cfg.difficulty <= 2 ? 2 : cfg.difficulty === 3 ? 3 : cfg.difficulty === 4 ? 4 : 5;

    // Build ships from composition pattern
    let built = false;
    for (const shipType of comp) {
      const def = getShipDef(shipType);
      if (!def) continue;
      if (def.stats.tier > maxT) continue;
      // Check if unlocked or in standard pool
      const inPool = Object.values(BUILDABLE_SHIPS).flat().includes(shipType);
      const inUnlocked = unlockedExtra.has(shipType);
      if (!inPool && !inUnlocked && !['boss_ship_01','boss_ship_02'].includes(shipType)) continue;
      if (queueBuild(st.id, shipType)) { built = true; break; }
    }

    if (!built) {
      // Fallback to affordable ship
      if (combatCount < 5 && res.credits >= 100) {
        queueBuild(st.id, 'red_fighter');
      }
    }

    // Advance composition cycle every few builds
    if (Math.random() < 0.3) brain.currentCompositionIdx++;
  }
}

// ── Tactics step ────────────────────────────────────────────────────
function aiTacticsStep(brain: AIBrain, state: SpaceGameState) {
  const { team, cfg } = brain;

  const ownPlanets    = state.planets.filter(p => p.owner === team);
  const enemyPlanets  = state.planets.filter(p => p.owner !== 0 && p.owner !== team);
  const neutralPlanets = state.planets.filter(p => p.owner === 0);

  // Collect idle combat ships
  const idle: SpaceShip[] = [];
  const workers: SpaceShip[] = [];
  for (const [, s] of state.ships) {
    if (s.dead || s.team !== team) continue;
    if (s.shipClass === 'worker') { workers.push(s); continue; }
    if (!s.moveTarget && !s.targetId && s.orbitTarget === null) idle.push(s);
  }

  if (idle.length === 0) return;

  // D5: anticipate player — attack their highest-value planet
  // D4+: multi-front — split fleet between expansion and assault
  // D3: flank — attack from angle not from straight line
  // D2: standard expand-then-attack
  // D1: random

  if (cfg.difficulty === 1) {
    // Random wander
    const allTargets = [...neutralPlanets, ...enemyPlanets];
    if (allTargets.length > 0) {
      const tgt = allTargets[Math.floor(Math.random() * allTargets.length)];
      for (const s of idle.slice(0, Math.min(4, idle.length))) {
        s.moveTarget = jitter(tgt, 200);
        s.isAttackMoving = true;
      }
    }
    return;
  }

  if (cfg.multiFleet && idle.length >= 6) {
    // Split into two groups
    const g1 = idle.slice(0, Math.floor(idle.length / 2));
    const g2 = idle.slice(Math.floor(idle.length / 2));

    // Group 1: grab nearest neutral planet
    if (neutralPlanets.length > 0) {
      const tgt = nearestTo(g1[0], neutralPlanets);
      for (const s of g1) { s.moveTarget = jitter(tgt, 150); s.isAttackMoving = true; }
    }
    // Group 2: assault weakest enemy planet
    if (enemyPlanets.length > 0) {
      const weakest = enemyPlanets.reduce((a, b) => b.captureProgress > a.captureProgress ? b : a);
      const attackAngle = flankerAngle(g2[0], weakest, ownPlanets[0]);
      const flankPos = {
        x: weakest.x + Math.cos(attackAngle) * 400,
        y: weakest.y + Math.sin(attackAngle) * 400,
      };
      for (const s of g2) { s.moveTarget = { ...flankPos, z: 0 }; s.isAttackMoving = true; }
    }
  } else {
    // Single-front logic
    let target: { x: number; y: number; z: number } | null = null;

    if (neutralPlanets.length > 0 && cfg.difficulty <= 3) {
      target = jitter(nearestTo(idle[0], neutralPlanets), 120);
    } else if (enemyPlanets.length > 0) {
      // D5: attack most resource-rich, D4: attack nearest, D3: flank
      let tgt = enemyPlanets[0];
      if (cfg.difficulty === 5) {
        tgt = enemyPlanets.reduce((a,b) =>
          (b.resourceYield.credits + b.resourceYield.energy + b.resourceYield.minerals) >
          (a.resourceYield.credits + a.resourceYield.energy + a.resourceYield.minerals) ? b : a);
      } else {
        tgt = nearestTo(idle[0], enemyPlanets);
      }
      const angle = cfg.difficulty >= 3 ? flankerAngle(idle[0], tgt, ownPlanets[0] ?? idle[0]) : 0;
      target = {
        x: tgt.x + Math.cos(angle) * (cfg.difficulty >= 3 ? 500 : 200),
        y: tgt.y + Math.sin(angle) * (cfg.difficulty >= 3 ? 500 : 200),
        z: 0,
      };
    }

    if (target) {
      const count = Math.min(idle.length, cfg.difficulty >= 4 ? idle.length : 6);
      for (const s of idle.slice(0, count)) {
        s.moveTarget = target;
        s.isAttackMoving = true;
      }
    }
  }
}

// ── Tech step ───────────────────────────────────────────────────────
function aiTechStep(
  brain: AIBrain, state: SpaceGameState,
  startResearch: (team: Team, nodeId: string) => void,
  buildTurret: (team: Team, planetId: number, type: string) => void,
) {
  const { team, cfg } = brain;
  const techSt = state.techState?.get(team);
  if (!techSt || techSt.inResearch !== null) return;

  // Pick next tech according to priority list
  const priority = TECH_PRIORITY[cfg.difficulty] ?? [];
  for (const nodeId of priority) {
    if (!techSt.researchedNodes.has(nodeId)) {
      startResearch(team, nodeId);
      return;
    }
  }

  // D4+: also build turrets on owned planets
  if (cfg.difficulty >= 4) {
    for (const p of state.planets) {
      if (p.owner !== team) continue;
      const turretCount = [...state.planetTurrets.values()].filter(t => t.planetId === p.id && !t.dead).length;
      if (turretCount < 2) {
        const type = techSt.unlockedTurrets.has('railgun_turret') ? 'railgun_turret' : 'laser_turret';
        buildTurret(team, p.id, type);
        return;
      }
    }
  }
}

// ── Void Power step ─────────────────────────────────────────────────
function aiVoidPowerStep(
  brain: AIBrain, state: SpaceGameState,
  castVoid: (team: Team, powerId: string, x: number, y: number) => void,
) {
  const { team } = brain;
  const techSt = state.techState?.get(team);
  if (!techSt) return;
  const cds = state.voidCooldowns?.get(team) ?? new Map<string, number>();

  for (const [pwrId, pwr] of Object.entries(VOID_POWERS)) {
    if (!techSt.researchedNodes.has(pwr.techNodeId)) continue;
    const cd = cds.get(pwrId) ?? 0;
    if (cd > 0) continue;

    const res = state.resources[team];
    if (!res || res.credits < pwr.cost.credits || res.energy < pwr.cost.energy || res.minerals < pwr.cost.minerals) continue;

    // Find best target for this void power
    let castX = 0, castY = 0, shouldCast = false;

    if (pwr.effect === 'aoe_damage' || pwr.effect === 'aoe_scatter') {
      // Find densest enemy cluster
      const cluster = densestEnemyCluster(team, state, pwr.radius);
      if (cluster) { castX = cluster.x; castY = cluster.y; shouldCast = true; }
    } else if (pwr.effect === 'push') {
      // Cast on planet with most enemies nearby
      const p = mostEnemiesNearOwnedPlanet(team, state);
      if (p) { castX = p.x; castY = p.y; shouldCast = true; }
    } else if (pwr.effect === 'pull_damage') {
      const cluster = densestEnemyCluster(team, state, pwr.radius);
      if (cluster) { castX = cluster.x; castY = cluster.y; shouldCast = true; }
    } else if (pwr.effect === 'teleport_fleet') {
      // Warp fleet near weakest enemy planet
      const tgt = state.planets.find(p => p.owner !== 0 && p.owner !== team && p.owner !== (0 as Team));
      if (tgt) { castX = tgt.x + 300; castY = tgt.y; shouldCast = true; }
    } else if (pwr.effect === 'destroy_planet') {
      // Only destroy neutral planets if D5
      if (brain.cfg.difficulty >= 5) {
        const neutral = state.planets.find(p => p.owner === 0);
        if (neutral) { castX = neutral.x; castY = neutral.y; shouldCast = true; }
      }
    }

    if (shouldCast) {
      castVoid(team, pwrId, castX, castY);
      return; // one void power per cycle
    }
  }
}

// ── Micro step (per frame) ───────────────────────────────────────────
function aiMicroStep(brain: AIBrain, state: SpaceGameState, dt: number) {
  const { team, cfg } = brain;
  if (cfg.difficulty < 3) return;

  for (const [, s] of state.ships) {
    if (s.dead || s.team !== team || s.shipClass === 'worker') continue;

    // Retreat if heavily damaged (D3+)
    if (s.damageLevel > 0.65 && s.targetId) {
      const t = state.ships.get(s.targetId);
      if (t && !t.dead && !s.moveTarget) {
        const fa = Math.atan2(s.y - t.y, s.x - t.x);
        s.moveTarget = { x: s.x + Math.cos(fa) * 500, y: s.y + Math.sin(fa) * 500, z: 0 };
      }
    }

    // D4+: strafe sideways when in range
    if (cfg.difficulty >= 4 && s.targetId) {
      const t = state.ships.get(s.targetId);
      if (t && !t.dead) {
        const d = dist2d(s, t);
        if (d < s.attackRange && d > s.attackRange * 0.4) {
          const a = Math.atan2(t.y - s.y, t.x - s.x);
          const dir = s.id % 2 === 0 ? 1 : -1;
          s.x += Math.cos(a + Math.PI / 2 * dir) * s.speed * 0.25 * dt;
          s.y += Math.sin(a + Math.PI / 2 * dir) * s.speed * 0.25 * dt;
        }
      }
    }
  }
}

// ── Utility ──────────────────────────────────────────────────────────
function jitter(pos: { x: number; y: number; z?: number }, range: number): Vec3 {
  return {
    x: pos.x + (Math.random() - 0.5) * range * 2,
    y: pos.y + (Math.random() - 0.5) * range * 2,
    z: 0,
  };
}

function nearestTo<T extends { x: number; y: number }>(
  origin: { x: number; y: number },
  targets: T[],
): T {
  return targets.reduce((best, t) => dist2d(origin, t) < dist2d(origin, best) ? t : best);
}

function flankerAngle(
  attacker: { x: number; y: number },
  target: { x: number; y: number },
  ownBase: { x: number; y: number } | null,
): number {
  // Attack from an angle perpendicular to the line between own base and target
  if (!ownBase) return Math.atan2(target.y - attacker.y, target.x - attacker.x);
  const baseAngle = Math.atan2(target.y - ownBase.y, target.x - ownBase.x);
  return baseAngle + Math.PI / 2 * (Math.random() > 0.5 ? 1 : -1);
}

function densestEnemyCluster(
  myTeam: Team, state: SpaceGameState, radius: number,
): { x: number; y: number } | null {
  let bestPos: { x: number; y: number } | null = null;
  let bestCount = 0;
  const enemies: SpaceShip[] = [];
  for (const [, s] of state.ships) {
    if (!s.dead && s.team !== myTeam && s.team !== 0) enemies.push(s);
  }
  for (const e of enemies) {
    let count = 0;
    for (const other of enemies) {
      if (dist2d(e, other) < radius) count++;
    }
    if (count > bestCount) { bestCount = count; bestPos = { x: e.x, y: e.y }; }
  }
  return bestCount >= 2 ? bestPos : null;
}

function mostEnemiesNearOwnedPlanet(myTeam: Team, state: SpaceGameState) {
  let best: { x: number; y: number } | null = null;
  let bestCount = 0;
  for (const p of state.planets) {
    if (p.owner !== myTeam) continue;
    let count = 0;
    for (const [, s] of state.ships) {
      if (!s.dead && s.team !== myTeam && dist2d(s, p) < p.captureRadius * 1.5) count++;
    }
    if (count > bestCount) { bestCount = count; best = p; }
  }
  return bestCount >= 2 ? best : null;
}
