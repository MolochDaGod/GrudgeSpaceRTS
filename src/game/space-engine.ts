import type {
  SpaceGameState, SpaceShip, SpaceStation, Planet,
  Projectile, SpriteEffect, PlayerResources, Team, Vec3,
  ExplosionType, HitFxType, ShipAbilityState, GameMode, TeamUpgrades,
  ResourceNode, PlanetType, PlanetTurret, TeamTechState, VoidEffect,
  Commander, CommanderSpec,
} from './space-types';
import {
  SHIP_DEFINITIONS, TEAM_COLORS,
  CAPTURE_TIME, CAPTURE_RATE_PER_UNIT, NEUTRAL_DEFENDERS, DOMINATION_TIME,
  BUILDABLE_SHIPS, UPGRADE_COSTS, UPGRADE_BONUSES, getMapSize,
  HERO_DEFINITIONS, HERO_SHIPS, getShipDef, PLANET_TYPE_DATA,
  defaultTechBonuses,
  COMMANDER_NAMES, COMMANDER_XP_LEVELS, COMMANDER_TRAIN_TIME, COMMANDER_TRAIN_COST,
  SHIP_ROLES, type Fleet, type TacticalOrder,
} from './space-types';
import {
  ALL_TECH_TREES, VOID_POWERS, PLANET_TYPE_TO_TECH, TURRET_DEFS,
  XP_THRESHOLDS, RANK_STAT_BONUS,
} from './space-techtree';
import {
  createAIBrain, updateAIBrain, type AIBrain,
} from './space-ai';

// ── Helpers ──────────────────────────────────────────────────────
function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * Math.min(t, 1);
}
function angleDelta(a: number, b: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}
function dist2d(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export class SpaceEngine {
  state!: SpaceGameState;
  private resourceTimer = 0;
  private winCheckTimer = 0;
  private aiBrains = new Map<number, AIBrain>();
  mapW = 8000;
  mapH = 8000;
  aiDifficulty = 3; // default D3

  initGame(mode: GameMode = '1v1') {
    const map = getMapSize(mode);
    this.mapW = map.width;
    this.mapH = map.height;

    const activePlayers: Team[] = mode === '1v1'
      ? [1 as Team, 2 as Team]
      : [1 as Team, 2 as Team, 3 as Team, 4 as Team];

    const makeRes = (): PlayerResources => ({ credits: 500, energy: 200, minerals: 300, supply: 0, maxSupply: 50 });
    const makeUpg = (): TeamUpgrades => ({ attack: 0, armor: 0, speed: 0, health: 0, shield: 0 });
    const resources: Record<number, PlayerResources> = { 0: { credits: 0, energy: 0, minerals: 0, supply: 0, maxSupply: 0 } };
    const upgrades: Record<number, TeamUpgrades> = { 0: makeUpg() };
    for (const t of activePlayers) { resources[t] = makeRes(); upgrades[t] = makeUpg(); }

    // Init tech state per team
    const techState = new Map<number, TeamTechState>();
    const voidCds   = new Map<number, Map<string, number>>();
    for (const t of activePlayers) {
      techState.set(t, { researchedNodes: new Set(), inResearch: null, researchTimeRemaining: 0, unlockedShips: new Set(), unlockedTurrets: new Set(['laser_turret', 'missile_turret']), bonuses: defaultTechBonuses() });
      voidCds.set(t, new Map());
    }

    this.state = {
      gameMode: mode, ships: new Map(), stations: new Map(),
      planets: this.generatePlanets(mode, activePlayers),
      resourceNodes: new Map(),
      planetTurrets: new Map(),
      techState, voidCooldowns: voidCds, activeVoidEffects: [],
      aiDifficulty: this.aiDifficulty,
      commanders: new Map(),
      fleets: new Map(),
      tacticalOrders: [],
      towers: new Map(), projectiles: new Map(),
      spriteEffects: [], glbEffects: [], alerts: [],
      resources, upgrades,
      gameTime: 0, nextId: 1000,
      selectedIds: new Set(), controlGroups: new Map(),
      gameOver: false, winner: null,
      winCondition: null, dominationTimer: 0, dominationTeam: null,
      activePlayers,
    };

    for (const team of activePlayers) {
      if (team !== 1) {
        this.aiBrains.set(team, createAIBrain(team, this.aiDifficulty));
      }
      const start = this.state.planets.find(p => p.isStartingPlanet && p.owner === team);
      if (!start) continue;
      const station = this.buildStation(start, team);
      const sign = team % 2 === 1 ? -1 : 1;
      this.spawnShip('red_fighter', team, start.x + sign * 120, start.y + 80);
      this.spawnShip('red_fighter', team, start.x + sign * 120, start.y + 140);
      this.spawnShip('red_fighter', team, start.x + sign * 120, start.y + 200);
      this.spawnShip('galactix_racer', team, start.x + sign * 180, start.y + 110);
      this.spawnShip('micro_recon', team, start.x + sign * 220, start.y + 150);
      this.spawnShip('dual_striker', team, start.x + sign * 80, start.y + 120);
      this.spawnShip('warship', team, start.x + sign * 250, start.y + 130);
      // Spawn 2 workers with their home station assigned
      const miner = this.spawnShip('mining_drone', team, start.x + sign * 350, start.y + 60, station.id);
      miner.workerState = 'idle';
      const skimmer = this.spawnShip('energy_skimmer', team, start.x + sign * 370, start.y + 100, station.id);
      skimmer.workerState = 'idle';
    }
    // Generate resource nodes after all planets and states are initialized
    this.generateResourceNodes();

    // AI autocast
    for (const [, ship] of this.state.ships) {
      if (ship.team !== 1) for (const ab of ship.abilities) ab.autoCast = true;
    }

    // Neutral defenders
    for (const planet of this.state.planets) {
      if (planet.owner === 0 && planet.neutralDefenders > 0) {
        const defOrbit = planet.captureRadius * 0.6;
        for (let i = 0; i < planet.neutralDefenders; i++) {
          const angle = (i / planet.neutralDefenders) * Math.PI * 2;
          const ship = this.spawnShip('red_fighter', 0 as Team,
            planet.x + Math.cos(angle) * defOrbit, planet.y + Math.sin(angle) * defOrbit);
          ship.orbitTarget = planet.id;
          ship.orbitRadius = defOrbit;
          ship.orbitAngle = angle;
          ship.holdPosition = true;
        }
      }
    }
  }

  // ── Planets ────────────────────────────────────────────────────
  private generatePlanets(mode: GameMode, players: Team[]): Planet[] {
    const planets: Planet[] = [];
    const names = ['Terra Nova', 'Helios Prime', 'Voidreach', 'Crux Station', 'Nebula Gate',
      'Iron Forge', 'Starfall', 'Ashenmire', 'Crystal Veil', "Oberon's Drift",
      'Pyxis Minor', 'Cinder Reach', 'Glasspoint', 'Echo Basin'];
    const hw = this.mapW / 2, hh = this.mapH / 2;
    let pid = 0;

    // Starting planet types rotate through rich varieties
    const startTypes: PlanetType[] = ['volcanic', 'oceanic', 'crystalline', 'gas_giant'];
    // Neutral types cycle through all
    const neutralTypes: PlanetType[] = ['barren', 'frozen', 'volcanic', 'crystalline', 'oceanic', 'gas_giant'];

    const corners: Vec3[] = mode === '1v1'
      ? [{ x: -hw * 0.7, y: -hh * 0.7, z: 0 }, { x: hw * 0.7, y: hh * 0.7, z: 0 }]
      : [{ x: -hw * 0.7, y: -hh * 0.7, z: 0 }, { x: hw * 0.7, y: hh * 0.7, z: 0 },
         { x: -hw * 0.7, y: hh * 0.7, z: 0 }, { x: hw * 0.7, y: -hh * 0.7, z: 0 }];

    for (let i = 0; i < players.length; i++) {
      const pType = startTypes[i % startTypes.length];
      const td = PLANET_TYPE_DATA[pType];
      const radius = 280;
      planets.push({
        id: pid++, x: corners[i].x, y: corners[i].y, z: 0,
        radius, name: names[i % names.length], owner: players[i],
        stationId: null, resourceYield: { credits: 15, energy: 10, minerals: 12 },
        color: td.baseColor, hasAsteroidField: false,
        planetType: pType, captureRadius: radius * 2.5,
        captureTeam: 0 as Team, captureProgress: 0, captureSpeed: CAPTURE_RATE_PER_UNIT,
        neutralDefenders: 0, isStartingPlanet: true,
      });
    }

    const neutralCount = mode === '1v1' ? 5 : 10;
    for (let i = 0; i < neutralCount; i++) {
      const angle = (i / neutralCount) * Math.PI * 2;
      const rf = 0.2 + Math.random() * 0.5;
      const rich = 1 + (i % 3);
      const pType = neutralTypes[i % neutralTypes.length];
      const td = PLANET_TYPE_DATA[pType];
      const radius = 100 + Math.random() * 80;
      planets.push({
        id: pid++, x: Math.cos(angle) * hw * rf + (Math.random() - 0.5) * 600,
        y: Math.sin(angle) * hh * rf + (Math.random() - 0.5) * 600, z: 0,
        radius,
        name: names[(players.length + i) % names.length], owner: 0 as Team,
        stationId: null, resourceYield: { credits: 8 * rich, energy: 5 * rich, minerals: 6 * rich },
        color: td.baseColor, hasAsteroidField: i % 3 === 0,
        planetType: pType, captureRadius: radius * 2.5,
        captureTeam: 0 as Team, captureProgress: 0, captureSpeed: CAPTURE_RATE_PER_UNIT,
        neutralDefenders: NEUTRAL_DEFENDERS, isStartingPlanet: false,
      });
    }
    return planets;
  }

  // ── Station ────────────────────────────────────────────────────
  buildStation(planet: Planet, team: Team): SpaceStation {
    const id = this.state.nextId++;
    const station: SpaceStation = {
      id, x: planet.x, y: planet.y + planet.radius * 1.5, z: 50,
      team, hp: 500, maxHp: 500, dead: false, planetId: planet.id,
      buildQueue: [], maxBuildSlots: 5, towerSlots: 6, towersBuilt: 0,
      rallyPoint: { x: planet.x + 300, y: planet.y, z: 0 },
      supplyProvided: 20, selected: false,
      autoProduceType: null, autoProduceTimer: 0,
      canBuildHeroes: planet.isStartingPlanet,
    };
    this.state.stations.set(id, station);
    planet.stationId = id;
    planet.owner = team;
    this.state.resources[team].maxSupply += station.supplyProvided;
    return station;
  }

  /** Set a station's auto-produce type (like swarm game per-circle selection) */
  setAutoProduction(stationId: number, shipType: string | null) {
    const station = this.state.stations.get(stationId);
    if (!station || station.dead) return;
    station.autoProduceType = shipType;
    station.autoProduceTimer = 0;
  }

  queueBuild(stationId: number, shipType: string): boolean {
    const station = this.state.stations.get(stationId);
    if (!station || station.dead) return false;
    if (station.buildQueue.length >= station.maxBuildSlots) return false;
    // Hero ships only from starting planet stations
    const isHero = HERO_SHIPS.includes(shipType);
    const isDreadnought = getShipDef(shipType)?.class === 'dreadnought';
    if (isHero && !station.canBuildHeroes) return false;
    // Dreadnought/Hero ships require an idle commander
    if (isDreadnought) {
      const hasCommander = [...this.state.commanders.values()]
        .some(c => c.team === station.team && c.state === 'idle');
      if (!hasCommander) return false;
    }
    const def = getShipDef(shipType);
    if (!def) return false;
    const res = this.state.resources[station.team];
    if (!res) return false;
    if (res.credits < def.stats.creditCost || res.energy < def.stats.energyCost || res.minerals < def.stats.mineralCost) return false;
    res.credits -= def.stats.creditCost;
    res.energy -= def.stats.energyCost;
    res.minerals -= def.stats.mineralCost;
    station.buildQueue.push({ shipType, buildTimeRemaining: def.stats.buildTime, totalBuildTime: def.stats.buildTime });
    return true;
  }

  purchaseUpgrade(team: Team, type: keyof TeamUpgrades): boolean {
    const upg = this.state.upgrades[team];
    if (!upg) return false;
    const cur = upg[type];
    if (cur >= 5) return false;
    const cost = UPGRADE_COSTS[cur];
    const res = this.state.resources[team];
    if (!res) return false;
    // 20% discount if starting planet type matches this upgrade's tech focus
    const startPlanet = this.state.planets.find(p => p.isStartingPlanet && p.owner === team);
    const discount = (startPlanet && PLANET_TYPE_DATA[startPlanet.planetType].upgradeDiscount === type) ? 0.80 : 1.0;
    const cc = Math.ceil(cost.credits * discount);
    const mc = Math.ceil(cost.minerals * discount);
    const ec = Math.ceil(cost.energy * discount);
    if (res.credits < cc || res.minerals < mc || res.energy < ec) return false;
    res.credits -= cc; res.minerals -= mc; res.energy -= ec;
    upg[type] = cur + 1;
    return true;
  }

  // ── Spawn Ship ─────────────────────────────────────────────────
  spawnShip(type: string, team: Team, x: number, y: number, stationId?: number): SpaceShip {
    const def = getShipDef(type);
    if (!def) throw new Error(`Unknown ship type: ${type}`);
    const id = this.state.nextId++;
    const s = def.stats;
    const upg = this.state.upgrades[team];
    const hpM = upg ? 1 + UPGRADE_BONUSES.health[upg.health] : 1;
    const shM = upg ? 1 + UPGRADE_BONUSES.shield[upg.shield] : 1;
    const spM = upg ? 1 + UPGRADE_BONUSES.speed[upg.speed] : 1;
    const dmM = upg ? 1 + UPGRADE_BONUSES.attack[upg.attack] : 1;
    const arB = upg ? UPGRADE_BONUSES.armor[upg.armor] : 0;

    const ship: SpaceShip = {
      id, x, y, z: 0, team,
      hp: Math.round(s.maxHp * hpM), maxHp: Math.round(s.maxHp * hpM), dead: false,
      shipType: type, shipClass: def.class,
      shield: Math.round(s.maxShield * shM), maxShield: Math.round(s.maxShield * shM), shieldRegen: s.shieldRegen,
      armor: s.armor + arB, speed: s.speed * spM, turnRate: s.turnRate,
      vx: 0, vy: 0, vz: 0, facing: team === 1 ? 0 : Math.PI, pitch: 0, roll: 0,
      targetId: null, moveTarget: null, attackMoveTarget: null,
      isAttackMoving: false, holdPosition: false, patrolPoints: [], patrolIndex: 0,
      attackDamage: Math.round(s.attackDamage * dmM), attackRange: s.attackRange,
      attackCooldown: s.attackCooldown, attackTimer: 0, attackType: s.attackType,
      supplyCost: s.supplyCost,
      abilities: (s.abilities || []).map(a => ({ ability: a, cooldownRemaining: 0, active: false, activeTimer: 0, autoCast: false })),
      animState: 'idle', animTimer: Math.random() * 10,
      selected: false, controlGroup: 0, stationId: stationId ?? null,
      orbitTarget: null, orbitRadius: 0, orbitAngle: 0, isDocked: false, damageLevel: 0,
      workerState: def.class === 'worker' ? 'idle' : undefined,
      workerNodeId: def.class === 'worker' ? null : undefined,
      workerCargo: def.class === 'worker' ? 0 : undefined,
      workerCargoType: def.class === 'worker' ? 'minerals' : undefined,
      workerHarvestTimer: def.class === 'worker' ? 0 : undefined,
      xp: 0, rank: 0,
      roleTimer: 0,
    };
    // Apply void_caster cooldown reduction at spawn
    const role = SHIP_ROLES[def.class === 'worker' ? '' : type];
    if (role === 'void_caster') {
      for (const ab of ship.abilities) {
        ab.ability = { ...ab.ability, cooldown: ab.ability.cooldown * 0.75 };
      }
    }
    this.state.ships.set(id, ship);
    const r = this.state.resources[team];
    if (r) r.supply += s.supplyCost;
    return ship;
  }

  // ── Main Loop ──────────────────────────────────────────────────
  update(dt: number) {
    if (this.state.gameOver) return;
    this.state.gameTime += dt;
    this.updateResourceNodes(dt);
    this.updateWorkers(dt);
    this.updateCommanderTraining(dt);
    this.updateShipRoles(dt);
    this.updateTacticalOrders(dt);
    this.updateShipSeparation(dt);
    this.updateShips(dt);
    this.updateProjectiles(dt);
    this.updateEffects(dt);
    this.updateStations(dt);
    this.updateCapture(dt);
    this.updateResources(dt);
    this.updateTechResearch(dt);
    this.updatePlanetTurrets(dt);
    this.updateVoidEffects(dt);
    this.updateVoidCooldowns(dt);
    this.updateAdvancedAI(dt);
    this.updateWinCondition(dt);
    this.cleanupDead();
  }

  // ── Ships ──────────────────────────────────────────────────────
  private updateShips(dt: number) {
    for (const [, ship] of this.state.ships) {
      if (ship.dead) continue;
      ship.animTimer += dt;
      ship.attackTimer = Math.max(0, ship.attackTimer - dt);
      ship.shield = Math.min(ship.maxShield, ship.shield + ship.shieldRegen * dt);
      ship.damageLevel = 1 - ship.hp / ship.maxHp;

      // Orbital patrol
      if (ship.orbitTarget !== null) {
        const planet = this.state.planets.find(p => p.id === ship.orbitTarget);
        if (planet) {
          ship.orbitAngle += dt * 0.3;
          ship.x = planet.x + Math.cos(ship.orbitAngle) * ship.orbitRadius;
          ship.y = planet.y + Math.sin(ship.orbitAngle) * ship.orbitRadius;
          ship.facing = ship.orbitAngle + Math.PI / 2;
        }
      }

      // Movement
      if (ship.moveTarget && !ship.holdPosition && ship.orbitTarget === null) {
        const dx = ship.moveTarget.x - ship.x, dy = ship.moveTarget.y - ship.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 15) {
          const ta = Math.atan2(dy, dx);
          ship.facing = lerpAngle(ship.facing, ta, ship.turnRate * dt);
          ship.x += Math.cos(ship.facing) * ship.speed * dt;
          ship.y += Math.sin(ship.facing) * ship.speed * dt;
          ship.animState = 'moving';
          ship.roll = angleDelta(ship.facing, ta) * 2;
        } else { ship.moveTarget = null; ship.animState = 'idle'; }
      } else if (!ship.targetId && ship.orbitTarget === null) {
        ship.animState = 'idle';
      }

      // Auto-acquire
      if (!ship.targetId && !ship.holdPosition) {
        const nearest = this.findNearestEnemy(ship);
        if (nearest && dist2d(ship, nearest) < ship.attackRange * 1.5) ship.targetId = nearest.id;
      }

      // Combat
      if (ship.targetId) {
        const t = this.state.ships.get(ship.targetId);
        if (!t || t.dead) { ship.targetId = null; }
        else {
          const d = dist2d(ship, t);
          if (d > ship.attackRange) {
            if (!ship.holdPosition && ship.orbitTarget === null) {
              const a = Math.atan2(t.y - ship.y, t.x - ship.x);
              ship.facing = lerpAngle(ship.facing, a, ship.turnRate * dt);
              ship.x += Math.cos(ship.facing) * ship.speed * dt;
              ship.y += Math.sin(ship.facing) * ship.speed * dt;
              ship.animState = 'moving';
            }
          } else if (ship.attackTimer <= 0) {
            this.fireProjectile(ship, t);
            ship.attackTimer = ship.attackCooldown;
            ship.animState = 'attacking'; ship.animTimer = 0;
          }
        }
      }

      // Abilities
      for (const ab of ship.abilities) {
        ab.cooldownRemaining = Math.max(0, ab.cooldownRemaining - dt);
        if (ab.active) { ab.activeTimer -= dt; if (ab.activeTimer <= 0) ab.active = false; }
        if (ab.autoCast && !ab.active && ab.cooldownRemaining <= 0 && ship.targetId !== null) {
          const res = this.state.resources[ship.team];
          if (res && res.energy >= ab.ability.energyCost) this.activateAbility(ship, ab, res);
        }
      }
    }
  }

  private activateAbility(ship: SpaceShip, ab: ShipAbilityState, res: PlayerResources) {
    ab.active = true; ab.activeTimer = ab.ability.duration; ab.cooldownRemaining = ab.ability.cooldown;
    res.energy -= ab.ability.energyCost;
    if (ab.ability.type === 'barrel_roll') ship.animState = 'barrel_roll';
    else if (ab.ability.type === 'speed_boost') ship.animState = 'speed_boost';
    else if (ab.ability.type === 'cloak') ship.animState = 'cloaked';
    else if (ab.ability.type === 'warp') ship.animState = 'warping';
    else if (ab.ability.type === 'iron_dome') this.spawnSpriteEffect(ship.x, ship.y, 0, 'waveform', 3.0);
    else if (ab.ability.type === 'emp') this.spawnSpriteEffect(ship.x, ship.y, 0, 'spark', 2.5);
    else if (ab.ability.type === 'ram') {
      const base = SHIP_DEFINITIONS[ship.shipType]?.stats.speed ?? ship.speed;
      ship.speed = base * 2.5;
      setTimeout(() => { ship.speed = base; }, ab.ability.duration * 1000);
    }
    ship.animTimer = 0;
  }

  // ── Projectiles ────────────────────────────────────────────────
  private fireProjectile(src: SpaceShip, tgt: SpaceShip) {
    const id = this.state.nextId++;
    const a = Math.atan2(tgt.y - src.y, tgt.x - src.x);
    const spd = src.attackType === 'missile' ? 300 : src.attackType === 'railgun' ? 600 : 400;
    // Star Splitter ambush: +80% damage on first hit against a new target
    let dmgMult = 1;
    if (SHIP_ROLES[src.shipType] === 'star_splitter' && src.lastTargetId !== tgt.id) {
      dmgMult = 1.80;
      src.lastTargetId = tgt.id;
    }
    this.state.projectiles.set(id, {
      id, x: src.x, y: src.y, z: src.z,
      vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, vz: 0,
      team: src.team, damage: Math.round(src.attackDamage * dmgMult), type: src.attackType as Projectile['type'],
      sourceId: src.id, targetId: tgt.id, speed: spd,
      lifetime: 0, maxLifetime: 3,
      homing: src.attackType === 'missile', homingStrength: 3,
      trailColor: TEAM_COLORS[src.team] ?? 0x4488ff,
    });
  }

  private updateProjectiles(dt: number) {
    for (const [id, p] of this.state.projectiles) {
      p.lifetime += dt;
      if (p.lifetime > p.maxLifetime) { this.state.projectiles.delete(id); continue; }
      if (p.homing) {
        const t = this.state.ships.get(p.targetId);
        if (t && !t.dead) {
          const a = Math.atan2(t.y - p.y, t.x - p.x);
          const c = Math.atan2(p.vy, p.vx);
          const n = lerpAngle(c, a, p.homingStrength * dt);
          p.vx = Math.cos(n) * p.speed; p.vy = Math.sin(n) * p.speed;
        }
      }
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      const t = this.state.ships.get(p.targetId);
      if (t && !t.dead && Math.sqrt((p.x - t.x) ** 2 + (p.y - t.y) ** 2) < 20) {
        this.applyDamage(t, p.damage);
        this.state.projectiles.delete(id);
        const ht: HitFxType[] = ['hits-1', 'hits-2', 'hits-3', 'hits-4', 'hits-5', 'hits-6'];
        this.spawnSpriteEffect(t.x, t.y, 0, ht[Math.floor(Math.random() * 6)], 0.6);
        if (t.dead) {
          // ─ Layered death explosions scaled by ship class ─
          const isMega = t.shipClass === 'dreadnought' || t.shipClass === 'battleship';
          const isMed  = t.shipClass === 'cruiser' || t.shipClass === 'destroyer' || t.shipClass === 'light_cruiser';
          const sc = isMega ? 6 : isMed ? 3 : 1.2;
          const et: ExplosionType = isMega ? 'explosion-1-e' : isMed ? 'explosion-1-d' : 'explosion-1-b';
          // Primary blast
          this.spawnSpriteEffect(t.x, t.y, 0, et, sc);
          // Secondary debris cloud (offset)
          if (isMed || isMega) {
            this.spawnSpriteEffect(t.x + 30, t.y - 20, 0, 'explosion-1-c', sc * 0.6);
            this.spawnSpriteEffect(t.x - 20, t.y + 25, 0, 'explosion-1-a', sc * 0.5);
          }
          // Mega ships: third wave + shockwave ring
          if (isMega) {
            this.spawnSpriteEffect(t.x, t.y, 0, 'explosion-b', sc * 0.8);
            this.spawnSpriteEffect(t.x + 60, t.y + 40, 0, 'explosion-1-f', sc * 0.4);
          }
          // Grant XP to killing ship
          const killer = this.state.ships.get(p.sourceId);
          if (killer && !killer.dead) {
            const xpGain = t.shipClass === 'battleship' || t.shipClass === 'dreadnought' ? 60
              : t.shipClass === 'destroyer' || t.shipClass === 'cruiser' ? 30 : 15;
            this.grantXP(killer, xpGain);
          }
        }
      }
    }
  }

  private applyDamage(ship: SpaceShip, damage: number) {
    let r = damage;
    // Juggernaut role: 30% incoming damage reduction
    if (SHIP_ROLES[ship.shipType] === 'juggernaut') r *= 0.70;
    if (ship.shield > 0) { const ab = Math.min(ship.shield, r); ship.shield -= ab; r -= ab; }
    r = Math.max(0, r - ship.armor);
    ship.hp -= r;
    if (ship.hp <= 0) {
      ship.hp = 0; ship.dead = true; ship.animState = 'death_spiral';
      const res = this.state.resources[ship.team];
      if (res) res.supply = Math.max(0, res.supply - ship.supplyCost);
      // Release or lose commander when ship dies
      for (const [, cmd] of this.state.commanders) {
        if (cmd.equippedShipId === ship.id) {
          if (ship.shipClass === 'dreadnought') {
            // Commander dies with the Dreadnought (permadeath)
            this.state.commanders.delete(cmd.id);
          } else {
            cmd.state = 'idle'; cmd.equippedShipId = null;
          }
          break;
        }
      }
    }
  }

  // ── Stations ───────────────────────────────────────────────
  private updateStations(dt: number) {
    for (const [, st] of this.state.stations) {
      if (st.dead) continue;

      // Build queue processing
      if (st.buildQueue.length > 0) {
        const item = st.buildQueue[0];
        const bsMult = this.state.techState.get(st.team)?.bonuses.buildSpeedMult ?? 1;
        item.buildTimeRemaining -= dt * bsMult;
        if (item.buildTimeRemaining <= 0) {
          st.buildQueue.shift();
          const rally = st.rallyPoint ?? { x: st.x + 200, y: st.y, z: 0 };
          const ship = this.spawnShip(item.shipType, st.team, st.x + 50, st.y - 50, st.id);
          ship.moveTarget = rally;
          if (st.team !== 1) for (const ab of ship.abilities) ab.autoCast = true;
          // Equip idle commander to hero/dreadnought ships
          if (ship.shipClass === 'dreadnought' || HERO_SHIPS.includes(item.shipType)) {
            this.equipCommanderToShip(ship);
          }
          const shipDef = getShipDef(item.shipType);
          this.state.alerts.push({
            id: this.state.nextId++, x: st.x, y: st.y, z: 0,
            type: 'build_complete', time: this.state.gameTime,
            message: `${shipDef?.displayName ?? item.shipType} complete`,
          });
        }
      }

      // Auto-production (swarm style: station continuously produces chosen type)
      if (st.autoProduceType && st.buildQueue.length < 2) {
        st.autoProduceTimer -= dt;
        if (st.autoProduceTimer <= 0) {
          const success = this.queueBuild(st.id, st.autoProduceType);
          st.autoProduceTimer = success ? 3 : 5; // retry faster if failed
        }
      }
    }
  }

  // ── Capture ────────────────────────────────────────────────────
  private updateCapture(dt: number) {
    for (const planet of this.state.planets) {
      if (planet.isStartingPlanet && planet.owner !== 0) continue;
      const teamCounts = new Map<number, number>();
      for (const [, s] of this.state.ships) {
        if (s.dead || s.team === 0) continue;
      if (dist2d(s, planet) < planet.captureRadius)
          teamCounts.set(s.team, (teamCounts.get(s.team) ?? 0) + 1);
      }

      let neutralAlive = 0;
      for (const [, s] of this.state.ships) {
        if (!s.dead && s.team === 0 && s.orbitTarget === planet.id) neutralAlive++;
      }
      if (neutralAlive > 0) { planet.captureProgress = 0; planet.captureTeam = 0 as Team; continue; }

      let sole: Team | null = null;
      for (const [team] of teamCounts) {
        if (sole === null) sole = team as Team; else { sole = null; break; }
      }

      if (sole !== null && sole !== planet.owner) {
        if (planet.captureTeam !== sole) { planet.captureTeam = sole; planet.captureProgress = 0; }
        planet.captureProgress += planet.captureSpeed * (teamCounts.get(sole) ?? 1) * dt;
        if (planet.captureProgress >= CAPTURE_TIME) {
          planet.owner = sole; planet.captureProgress = 0; planet.captureTeam = 0 as Team;
          if (planet.stationId !== null) {
            const old = this.state.stations.get(planet.stationId);
            if (old) { this.state.resources[old.team].maxSupply -= old.supplyProvided; this.state.stations.delete(planet.stationId); }
            planet.stationId = null;
          }
          this.buildStation(planet, sole);
          this.state.alerts.push({
            id: this.state.nextId++, x: planet.x, y: planet.y, z: 0,
            type: 'conquest', time: this.state.gameTime,
            message: `${planet.name} captured!`,
          });
        }
      } else {
        if (planet.captureProgress > 0) planet.captureProgress = Math.max(0, planet.captureProgress - 10 * dt);
        if (planet.captureProgress <= 0) planet.captureTeam = 0 as Team;
      }
    }
  }

  // ── Resources ──────────────────────────────────────────────────
  private updateResources(dt: number) {
    this.resourceTimer += dt;
    if (this.resourceTimer >= 1) {
      this.resourceTimer = 0;
      for (const p of this.state.planets) {
        if (p.owner !== 0) {
          const res = this.state.resources[p.owner];
          if (res) {
            const m = PLANET_TYPE_DATA[p.planetType].resourceMult;
            res.credits  += p.resourceYield.credits  * m.credits;
            res.energy   += p.resourceYield.energy   * m.energy;
            res.minerals += p.resourceYield.minerals * m.minerals;
          }
        }
      }
    }
  }

  // ── Effects ────────────────────────────────────────────────────
  private updateEffects(dt: number) {
    for (const e of this.state.spriteEffects) {
      if (e.done) continue;
      e.frameTimer += dt;
      if (e.frameTimer >= e.frameDuration) { e.frameTimer = 0; e.frame++; if (e.frame >= e.totalFrames) e.done = true; }
    }
    this.state.spriteEffects = this.state.spriteEffects.filter(e => !e.done);
    this.state.alerts = this.state.alerts.filter(a => this.state.gameTime - a.time < 15);
  }

  private spawnSpriteEffect(x: number, y: number, z: number, type: string, scale: number) {
    const counts: Record<string, number> = {
      'explosion-1-a': 8, 'explosion-1-b': 8, 'explosion-1-c': 10, 'explosion-1-d': 12,
      'explosion-1-e': 22, 'explosion-1-f': 8, 'explosion-1-g': 7, 'explosion-b': 12,
      'bolt': 4, 'charged': 6, 'crossed': 6, 'pulse': 4, 'spark': 5, 'waveform': 4,
      'hits-1': 5, 'hits-2': 7, 'hits-3': 5, 'hits-4': 7, 'hits-5': 7, 'hits-6': 7,
    };
    this.state.spriteEffects.push({
      id: this.state.nextId++, x, y, z, type: type as SpriteEffect['type'],
      scale, frame: 0, totalFrames: counts[type] ?? 8,
      frameTimer: 0, frameDuration: 0.06, done: false, rotation: Math.random() * Math.PI * 2,
    });
  }

  // ── Tech Research ───────────────────────────────────────────────
  startResearch(team: Team, nodeId: string): boolean {
    const st = this.state.techState.get(team);
    if (!st || st.inResearch) return false;
    // Check all trees for this node
    for (const tree of Object.values(ALL_TECH_TREES)) {
      const node = tree.nodes.find(n => n.id === nodeId);
      if (!node) continue;
      // Check prerequisites
      if (!node.requires.every(r => st.researchedNodes.has(r))) return false;
      const res = this.state.resources[team];
      if (!res) return false;
      if (res.credits < node.cost.credits || res.energy < node.cost.energy || res.minerals < node.cost.minerals) return false;
      res.credits -= node.cost.credits; res.energy -= node.cost.energy; res.minerals -= node.cost.minerals;
      st.inResearch = nodeId;
      st.researchTimeRemaining = node.researchTime;
      return true;
    }
    return false;
  }

  private updateTechResearch(dt: number) {
    for (const [team, st] of this.state.techState) {
      if (!st.inResearch) continue;
      st.researchTimeRemaining -= dt;
      if (st.researchTimeRemaining > 0) continue;
      // Research complete — apply effects
      const nodeId = st.inResearch;
      st.inResearch = null;
      st.researchTimeRemaining = 0;
      st.researchedNodes.add(nodeId);
      for (const tree of Object.values(ALL_TECH_TREES)) {
        const node = tree.nodes.find(n => n.id === nodeId);
        if (!node) continue;
        for (const eff of node.effects) {
          if (eff.kind === 'stat_bonus' && eff.stat && eff.value != null) {
            const b = st.bonuses;
            if (eff.stat === 'attack') b.attackMult  = Math.max(b.attackMult,  1 + eff.value);
            if (eff.stat === 'armor')  b.armorBonus  += eff.value;
            if (eff.stat === 'shield') b.shieldMult  = Math.max(b.shieldMult,  1 + eff.value);
            if (eff.stat === 'speed')  b.speedMult   = Math.max(b.speedMult,   1 + eff.value);
            if (eff.stat === 'health') b.healthMult  = Math.max(b.healthMult,  1 + eff.value);
            if (eff.stat === 'all') {
              b.attackMult *= (1 + eff.value); b.shieldMult *= (1 + eff.value);
              b.speedMult  *= (1 + eff.value); b.healthMult *= (1 + eff.value);
            }
          } else if (eff.kind === 'resource_bonus' && eff.value != null) {
            st.bonuses.resourceMult += eff.value;
          } else if (eff.kind === 'build_speed' && eff.value != null) {
            st.bonuses.buildSpeedMult = Math.min(3.0, st.bonuses.buildSpeedMult + eff.value);
          } else if (eff.kind === 'unlock_ship' && eff.shipType) {
            st.unlockedShips.add(eff.shipType);
          } else if (eff.kind === 'turret_unlock' && eff.turretType) {
            st.unlockedTurrets.add(eff.turretType);
          } else if (eff.kind === 'void_power') {
            // Void power already available via researchedNodes check
          }
        }
        this.state.alerts.push({
          id: this.state.nextId++, x: 0, y: 0, z: 0, type: 'build_complete',
          time: this.state.gameTime,
          message: `Team ${team}: ${node.name} researched!`,
        });
      }
    }
  }

  // ── Void Powers ───────────────────────────────────────────────
  castVoidPower(team: Team, powerId: string, targetX: number, targetY: number): boolean {
    const st = this.state.techState.get(team);
    if (!st) return false;
    const pwr = VOID_POWERS[powerId];
    if (!pwr) return false;
    if (!st.researchedNodes.has(pwr.techNodeId)) return false;
    const cds = this.state.voidCooldowns.get(team) ?? new Map<string, number>();
    if ((cds.get(powerId) ?? 0) > 0) return false;
    const res = this.state.resources[team];
    if (!res || res.credits < pwr.cost.credits || res.energy < pwr.cost.energy || res.minerals < pwr.cost.minerals) return false;
    res.credits -= pwr.cost.credits; res.energy -= pwr.cost.energy; res.minerals -= pwr.cost.minerals;
    cds.set(powerId, pwr.cooldown);
    this.state.voidCooldowns.set(team, cds);

    if (pwr.effect === 'aoe_damage' || pwr.effect === 'aoe_scatter') {
      // Immediate AoE damage
      for (const [, s] of this.state.ships) {
        if (s.dead || s.team === team) continue;
        const d = Math.sqrt((s.x - targetX)**2 + (s.y - targetY)**2);
        if (d < pwr.radius) this.applyDamage(s, (pwr.damage ?? 300) * (1 - d / pwr.radius));
      }
      this.spawnSpriteEffect(targetX, targetY, 0, 'explosion-1-e', 8);
    } else if (pwr.effect === 'push') {
      // Push enemies away from planet
      const planet = this.state.planets.find(p => p.owner === team);// nearest owned planet
      const px = planet?.x ?? targetX, py = planet?.y ?? targetY;
      for (const [, s] of this.state.ships) {
        if (s.dead || s.team === team) continue;
        const d = Math.sqrt((s.x - px)**2 + (s.y - py)**2);
        if (d < pwr.radius) {
          const a = Math.atan2(s.y - py, s.x - px);
          const force = pwr.pushForce ?? 800;
          s.x += Math.cos(a) * force * 0.1; s.y += Math.sin(a) * force * 0.1;
          s.moveTarget = { x: s.x + Math.cos(a)*force, y: s.y + Math.sin(a)*force, z:0 };
        }
      }
    } else if (pwr.effect === 'teleport_fleet') {
      for (const id of this.state.selectedIds) {
        const s = this.state.ships.get(id);
        if (!s || s.dead || s.team !== team) continue;
        const spread = this.state.selectedIds.size;
        const idx = [...this.state.selectedIds].indexOf(id);
        s.x = targetX + (idx % 5 - 2) * 80;
        s.y = targetY + Math.floor(idx / 5) * 80;
        s.moveTarget = null;
      }
    } else if (pwr.effect === 'pull_damage') {
      // Create a lingering void rift effect
      this.state.activeVoidEffects.push({
        id: this.state.nextId++, powerId, x: targetX, y: targetY,
        radius: pwr.radius, damage: pwr.damage ?? 80,
        lifetime: 0, maxLifetime: pwr.duration ?? 8,
        team, done: false,
      });
    } else if (pwr.effect === 'destroy_planet') {
      const planetIdx = this.state.planets.findIndex(p =>
        Math.sqrt((p.x - targetX)**2 + (p.y - targetY)**2) < p.radius * 3);
      if (planetIdx >= 0) {
        const p = this.state.planets[planetIdx];
        // Kill all ships orbiting/near it
        for (const [, s] of this.state.ships) {
          if (Math.sqrt((s.x - p.x)**2 + (s.y - p.y)**2) < p.captureRadius) this.applyDamage(s, 99999);
        }
        // Remove station
        if (p.stationId) { this.state.stations.delete(p.stationId); }
        // Remove planet
        this.state.planets.splice(planetIdx, 1);
        this.spawnSpriteEffect(p.x, p.y, 0, 'explosion-1-e', 12);
      }
    }
    return true;
  }

  private updateVoidEffects(dt: number) {
    for (const eff of this.state.activeVoidEffects) {
      if (eff.done) continue;
      eff.lifetime += dt;
      if (eff.lifetime >= eff.maxLifetime) { eff.done = true; continue; }
      // Pull + damage ships each tick
      for (const [, s] of this.state.ships) {
        if (s.dead) continue;
        const d = Math.sqrt((s.x - eff.x)**2 + (s.y - eff.y)**2);
        if (d < eff.radius) {
          // Pull toward center
          const a = Math.atan2(eff.y - s.y, eff.x - s.x);
          const pull = (1 - d / eff.radius) * 200;
          s.x += Math.cos(a) * pull * dt;
          s.y += Math.sin(a) * pull * dt;
          // Damage per second (damage / maxLifetime * dt)
          const dps = (eff.damage ?? 80);
          this.applyDamage(s, dps * dt);
        }
      }
    }
    this.state.activeVoidEffects = this.state.activeVoidEffects.filter(e => !e.done);
  }

  private updateVoidCooldowns(dt: number) {
    for (const [, cdMap] of this.state.voidCooldowns) {
      for (const [key, val] of cdMap) {
        if (val > 0) cdMap.set(key, Math.max(0, val - dt));
      }
    }
  }

  // ── Planet Turrets ────────────────────────────────────────────
  buildPlanetTurret(team: Team, planetId: number, turretType: string): boolean {
    const planet = this.state.planets.find(p => p.id === planetId);
    if (!planet || planet.owner !== team) return false;
    const st = this.state.techState.get(team);
    if (!st || !st.unlockedTurrets.has(turretType)) return false;
    const existing = [...this.state.planetTurrets.values()].filter(t => t.planetId === planetId && !t.dead);
    if (existing.length >= 4) return false;
    const def = TURRET_DEFS[turretType];
    if (!def) return false;
    const res = this.state.resources[team];
    if (!res || res.credits < def.cost.credits || res.energy < def.cost.energy || res.minerals < def.cost.minerals) return false;
    res.credits -= def.cost.credits; res.energy -= def.cost.energy; res.minerals -= def.cost.minerals;
    // Place in orbit
    const angle = (existing.length / 4) * Math.PI * 2;
    const orbitR = planet.radius * 1.5;
    const id = this.state.nextId++;
    const turret: PlanetTurret = {
      id, planetId, team, turretType,
      x: planet.x + Math.cos(angle) * orbitR,
      y: planet.y + Math.sin(angle) * orbitR,
      z: 20, orbitAngle: angle, orbitRadius: orbitR,
      hp: def.maxHp, maxHp: def.maxHp, dead: false,
      attackCooldown: def.attackCooldown, attackTimer: 0, targetId: null,
    };
    this.state.planetTurrets.set(id, turret);
    return true;
  }

  private updatePlanetTurrets(dt: number) {
    for (const [id, t] of this.state.planetTurrets) {
      if (t.dead) continue;
      t.attackTimer = Math.max(0, t.attackTimer - dt);
      // Update orbit position
      const planet = this.state.planets.find(p => p.id === t.planetId);
      if (planet) {
        t.orbitAngle += 0.1 * dt;
        t.x = planet.x + Math.cos(t.orbitAngle) * t.orbitRadius;
        t.y = planet.y + Math.sin(t.orbitAngle) * t.orbitRadius;
      }
      // Find and attack nearest enemy
      const def = TURRET_DEFS[t.turretType];
      if (!def) continue;
      if (!t.targetId || t.attackTimer > 0) {
        if (!t.targetId) {
          let best: SpaceShip | null = null; let bd = Infinity;
          for (const [, s] of this.state.ships) {
            if (s.dead || s.team === t.team) continue;
            const d = Math.sqrt((s.x - t.x)**2 + (s.y - t.y)**2);
            if (d < def.attackRange && d < bd) { bd = d; best = s; }
          }
          t.targetId = best?.id ?? null;
        }
      }
      if (t.targetId && t.attackTimer <= 0) {
        const target = this.state.ships.get(t.targetId);
        if (!target || target.dead || Math.sqrt((target.x - t.x)**2 + (target.y - t.y)**2) > def.attackRange) {
          t.targetId = null;
        } else {
          this.applyDamage(target, def.attackDamage);
          this.spawnSpriteEffect(target.x, target.y, 0, 'hits-3', 0.6);
          t.attackTimer = def.attackCooldown;
        }
      }
    }
  }

  // ── Commander System ─────────────────────────────────────────────
  /** Start training a new commander at a planet. Spec is inferred from planet type. */
  trainCommander(team: Team, planetId: number): boolean {
    const planet = this.state.planets.find(p => p.id === planetId);
    if (!planet || planet.owner !== team) return false;
    // Only one commander training per planet at a time
    const alreadyTraining = [...this.state.commanders.values()]
      .some(c => c.trainingPlanetId === planetId && c.state === 'training');
    if (alreadyTraining) return false;
    const res = this.state.resources[team];
    if (!res) return false;
    const cost = COMMANDER_TRAIN_COST[1]; // cost to recruit level 1
    if (res.credits < cost.credits || res.energy < cost.energy || res.minerals < cost.minerals) return false;
    res.credits -= cost.credits; res.energy -= cost.energy; res.minerals -= cost.minerals;
    // Derive spec from planet type
    const specMap: Record<string, CommanderSpec> = {
      volcanic: 'forge', oceanic: 'tide', crystalline: 'prism',
      gas_giant: 'vortex', barren: 'void', frozen: 'void',
    };
    const spec: CommanderSpec = specMap[planet.planetType] ?? 'forge';
    const portraitIdx = Math.floor(Math.random() * 6) + 1;
    const portrait = `/assets/space/ui/scifi-gui/avatars/${portraitIdx}.png`;
    const name = COMMANDER_NAMES[Math.floor(Math.random() * COMMANDER_NAMES.length)];
    const id = this.state.nextId++;
    const totalTime = COMMANDER_TRAIN_TIME[1];
    const cmd: Commander = {
      id, name, portrait, spec, level: 0, xp: 0,
      xpToNextLevel: COMMANDER_XP_LEVELS[1],
      team, state: 'training',
      trainingPlanetId: planetId,
      trainingTimeRemaining: totalTime,
      trainingTotalTime: totalTime,
      equippedShipId: null,
      attackBonus: 0, defenseBonus: 0, speedBonus: 0, specialBonus: 0,
    };
    this.state.commanders.set(id, cmd);
    return true;
  }

  /** Level up an existing idle commander (costs resources, takes time). */
  upgradeCommander(commanderId: number): boolean {
    const cmd = this.state.commanders.get(commanderId);
    if (!cmd || cmd.state !== 'idle' || cmd.level >= 5) return false;
    const res = this.state.resources[cmd.team];
    if (!res) return false;
    const nextLevel = cmd.level + 1;
    const cost = COMMANDER_TRAIN_COST[nextLevel];
    if (!cost || res.credits < cost.credits || res.energy < cost.energy || res.minerals < cost.minerals) return false;
    res.credits -= cost.credits; res.energy -= cost.energy; res.minerals -= cost.minerals;
    cmd.state = 'training';
    cmd.trainingTimeRemaining = COMMANDER_TRAIN_TIME[nextLevel];
    cmd.trainingTotalTime = COMMANDER_TRAIN_TIME[nextLevel];
    return true;
  }

  private updateCommanderTraining(dt: number) {
    for (const [, cmd] of this.state.commanders) {
      if (cmd.state !== 'training') continue;
      cmd.trainingTimeRemaining -= dt;
      if (cmd.trainingTimeRemaining > 0) continue;
      // Training complete
      cmd.trainingTimeRemaining = 0;
      cmd.level = Math.min(5, cmd.level + 1);
      cmd.xpToNextLevel = COMMANDER_XP_LEVELS[Math.min(5, cmd.level + 1)] ?? 99999;
      // Calculate bonuses based on level and spec
      const pct = cmd.level * 0.05; // +5% per level
      cmd.attackBonus  = pct;
      cmd.defenseBonus = pct;
      cmd.speedBonus   = pct;
      cmd.specialBonus = pct * 1.5; // spec bonus is 50% stronger
      cmd.state = 'idle';
      cmd.trainingPlanetId = null;
      this.state.alerts.push({
        id: this.state.nextId++, x: 0, y: 0, z: 0, type: 'build_complete',
        time: this.state.gameTime,
        message: `Commander ${cmd.name} promoted to Level ${cmd.level}!`,
      });
    }
  }

  /** Equip an idle commander to a hero ship. Called after ship is built. */
  private equipCommanderToShip(ship: SpaceShip) {
    const idleCmd = [...this.state.commanders.values()].find(
      c => c.team === ship.team && c.state === 'idle',
    );
    if (!idleCmd) return;
    idleCmd.state = 'onship';
    idleCmd.equippedShipId = ship.id;
    // Apply commander bonuses on top of ship stats
    ship.attackDamage = Math.round(ship.attackDamage * (1 + idleCmd.attackBonus));
    ship.maxHp = Math.round(ship.maxHp * (1 + idleCmd.defenseBonus));
    ship.hp    = ship.maxHp;
    ship.maxShield = Math.round(ship.maxShield * (1 + idleCmd.defenseBonus));
    ship.speed *= (1 + idleCmd.speedBonus);
  }

  // ── XP & Rank ──────────────────────────────────────────────────
  grantXP(ship: SpaceShip, amount: number) {
    if (ship.dead || ship.rank >= 5) return;
    ship.xp += amount;
    const threshold = XP_THRESHOLDS[ship.rank + 1] ?? 99999;
    if (ship.xp >= threshold && ship.rank < 5) {
      ship.rank++;
      // Apply +5% to all stats compounding
      const mult = 1 + RANK_STAT_BONUS;
      ship.maxHp        = Math.round(ship.maxHp * mult);
      ship.hp           = Math.min(ship.hp + Math.round(ship.maxHp * 0.1), ship.maxHp);
      ship.maxShield    = Math.round(ship.maxShield * mult);
      ship.attackDamage = Math.round(ship.attackDamage * mult);
      ship.speed       *= mult;
      ship.armor        = Math.round(ship.armor * mult);
      this.state.alerts.push({
        id: this.state.nextId++, x: ship.x, y: ship.y, z: 0,
        type: 'build_complete', time: this.state.gameTime,
        message: `${ship.shipType} promoted to Rank ${ship.rank}!`,
      });
    }
  }

  // ── Advanced AI (replaces old aiBuild/aiTactics) ──────────────────
  private updateAdvancedAI(dt: number) {
    for (const team of this.state.activePlayers) {
      if (team === 1) continue;
      const brain = this.aiBrains.get(team);
      if (!brain) continue;
      updateAIBrain(
        brain, this.state, dt,
        (stId, type) => this.queueBuild(stId, type),
        (t, nodeId) => this.startResearch(t as Team, nodeId),
        (t, pwrId, x, y) => this.castVoidPower(t as Team, pwrId, x, y),
        (t, pId, tType) => this.buildPlanetTurret(t as Team, pId, tType),
      );
    }
  }

  // ── Win ────────────────────────────────────────────────────
  private updateWinCondition(dt: number) {
    this.winCheckTimer += dt;
    if (this.winCheckTimer < 2) return;
    this.winCheckTimer = 0;
    for (const team of this.state.activePlayers) {
      let has = false;
      for (const [, s] of this.state.ships) { if (!s.dead && s.team === team) { has = true; break; } }
      if (!has) for (const [, st] of this.state.stations) { if (!st.dead && st.team === team) { has = true; break; } }
      if (!has) {
        const rem = this.state.activePlayers.filter(t => {
          if (t === team) return false;
          for (const [, s] of this.state.ships) { if (!s.dead && s.team === t) return true; }
          for (const [, st] of this.state.stations) { if (!st.dead && st.team === t) return true; }
          return false;
        });
        if (rem.length === 1) { this.state.gameOver = true; this.state.winner = rem[0]; this.state.winCondition = 'elimination'; return; }
      }
    }
    const owned = this.state.planets.filter(p => p.owner !== 0);
    if (owned.length > 0 && owned.length >= this.state.planets.length * 0.7) {
      const o = owned[0].owner;
      if (owned.every(p => p.owner === o)) {
        if (this.state.dominationTeam === o) {
          this.state.dominationTimer += 2;
          if (this.state.dominationTimer >= DOMINATION_TIME) { this.state.gameOver = true; this.state.winner = o; this.state.winCondition = 'domination'; }
        } else { this.state.dominationTeam = o; this.state.dominationTimer = 0; }
      } else { this.state.dominationTimer = 0; this.state.dominationTeam = null; }
    }
  }

  // ── Ship Separation (soft colliders) ─────────────────────────────
  // Prevents ships from stacking on top of each other. Uses a spring-
  // push force between any two friendly ships that are too close.
  // Enemy ships are handled by attack range naturally.
  private updateShipSeparation(dt: number) {
    // Min separation scales with ship visual size.
    // In game units: fighter placeholder = size 9 Three.js = 180 gu,
    // so MIN_SEP = 150 keeps fighters from touching.
    const MIN_SEP: Record<string, number> = {
      dreadnought: 380, battleship: 320, carrier: 280,
      cruiser: 240, light_cruiser: 220, destroyer: 200,
      frigate: 180, corvette: 160, assault_frigate: 180,
      bomber: 200, transport: 180, stealth: 150,
      heavy_fighter: 140, fighter: 130, interceptor: 120,
      scout: 110, worker: 90,
    };

    const alive: SpaceShip[] = [];
    for (const [, s] of this.state.ships) {
      if (!s.dead) alive.push(s);
    }

    for (let i = 0; i < alive.length; i++) {
      const a = alive[i];
      // Workers handle their own positioning — don’t disturb them
      if (a.shipClass === 'worker') continue;
      // Ships with fixed orbit targets or hold positions stay put
      if (a.orbitTarget !== null) continue;

      let fx = 0, fy = 0;
      const minA = MIN_SEP[a.shipClass] ?? 130;

      for (let j = i + 1; j < alive.length; j++) {
        const b = alive[j];
        if (b.team !== a.team) continue; // only separate own fleet
        if (b.orbitTarget !== null) continue;

        const minB   = MIN_SEP[b.shipClass] ?? 130;
        const minDist = (minA + minB) * 0.5; // average of both radii

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < minDist * minDist && d2 > 1) {
          const d     = Math.sqrt(d2);
          const depth = minDist - d;          // how much they overlap
          const force = depth / minDist * 0.6; // gentle spring
          const nx = dx / d, ny = dy / d;
          // Push both apart (equal & opposite)
          fx       += nx * force;
          fy       += ny * force;
          b.x      -= nx * force * b.speed * dt;
          b.y      -= ny * force * b.speed * dt;
        }
      }

      if (fx !== 0 || fy !== 0) {
        a.x += fx * a.speed * dt;
        a.y += fy * a.speed * dt;
      }
    }
  }

  // ── Ship Role Behaviors ─────────────────────────────────────────
  private updateShipRoles(dt: number) {
    const REPAIR_TICK   = 2.0;   // seconds between heals
    const REPAIR_AMOUNT = 18;    // HP healed per tick
    const REPAIR_RANGE  = 220;   // game units
    const JUG_PULSE_TICK    = 4.0;  // juggernaut shield pulse interval
    const JUG_PULSE_SHIELD  = 12;   // shield restored to allies
    const JUG_PULSE_RANGE   = 180;

    for (const [, ship] of this.state.ships) {
      if (ship.dead || ship.shipClass === 'worker') continue;
      ship.roleTimer += dt;
      const role = SHIP_ROLES[ship.shipType];
      if (!role) continue;

      // ── Repair: periodically heal nearby allies ────────────────
      if (role === 'repair' && ship.roleTimer >= REPAIR_TICK) {
        ship.roleTimer = 0;
        for (const [, ally] of this.state.ships) {
          if (ally.dead || ally.team !== ship.team || ally.id === ship.id) continue;
          const d = Math.sqrt((ally.x - ship.x) ** 2 + (ally.y - ship.y) ** 2);
          if (d <= REPAIR_RANGE && ally.hp < ally.maxHp) {
            ally.hp = Math.min(ally.maxHp, ally.hp + REPAIR_AMOUNT);
          }
        }
        // Tiny visual spark
        this.spawnSpriteEffect(ship.x, ship.y, 0, 'bolt', 0.5);
      }

      // ── Juggernaut: take less damage (handled in applyDamage) +
      //              pulse mini-shield to nearby allies ─────────
      if (role === 'juggernaut' && ship.roleTimer >= JUG_PULSE_TICK) {
        ship.roleTimer = 0;
        for (const [, ally] of this.state.ships) {
          if (ally.dead || ally.team !== ship.team) continue;
          const d = Math.sqrt((ally.x - ship.x) ** 2 + (ally.y - ship.y) ** 2);
          if (d <= JUG_PULSE_RANGE) {
            ally.shield = Math.min(ally.maxShield, ally.shield + JUG_PULSE_SHIELD);
          }
        }
        this.spawnSpriteEffect(ship.x, ship.y, 0, 'waveform', 1.8);
      }

      // Void Caster: already handled via cooldown reduction at spawn
      // Star Splitter: handled in applyDamage / fireProjectile
    }
  }

  // ── Tactical Orders ─────────────────────────────────────────
  addTacticalOrder(order: Omit<TacticalOrder, 'id' | 'cooldownRemaining'>) {
    const full: TacticalOrder = { ...order, id: this.state.nextId++, cooldownRemaining: 0 };
    this.state.tacticalOrders.push(full);
  }

  removeTacticalOrder(id: number) {
    this.state.tacticalOrders = this.state.tacticalOrders.filter(o => o.id !== id);
  }

  addFleet(name: string, color: string): Fleet {
    const fleet: Fleet = { name, color, shipIds: [], rallyPlanetId: null, order: 'idle', orderTargetPlanetId: null };
    this.state.fleets.set(name, fleet);
    return fleet;
  }

  assignShipsToFleet(fleetName: string, shipIds: number[]) {
    // Remove from any existing fleet first
    for (const [, f] of this.state.fleets) {
      f.shipIds = f.shipIds.filter(id => !shipIds.includes(id));
    }
    const fleet = this.state.fleets.get(fleetName);
    if (fleet) fleet.shipIds.push(...shipIds);
  }

  private updateTacticalOrders(dt: number) {
    for (const order of this.state.tacticalOrders) {
      if (!order.enabled) continue;
      if (order.cooldownRemaining > 0) { order.cooldownRemaining -= dt; continue; }

      let triggered = false;

      if (order.trigger === 'planet_attacked' && order.triggerPlanetId !== null) {
        // Triggered if enemies are near the watched planet
        const planet = this.state.planets.find(p => p.id === order.triggerPlanetId);
        if (planet) {
          const enemyCount = [...this.state.ships.values()]
            .filter(s => !s.dead && s.team !== 1 && s.team !== 0 &&
              Math.sqrt((s.x - planet.x)**2 + (s.y - planet.y)**2) < planet.captureRadius * 1.5)
            .length;
          triggered = enemyCount >= 2;
        }
      } else if (order.trigger === 'planet_captured') {
        const planet = this.state.planets.find(p => p.id === order.triggerPlanetId);
        triggered = !!(planet && planet.owner !== 1 && planet.owner !== 0);
      } else if (order.trigger === 'fleet_below_half' && order.triggerFleetName) {
        const fleet = this.state.fleets.get(order.triggerFleetName);
        if (fleet) {
          const alive = fleet.shipIds.filter(id => {
            const s = this.state.ships.get(id); return s && !s.dead;
          }).length;
          triggered = alive > 0 && alive <= fleet.shipIds.length / 2;
        }
      }

      if (!triggered) continue;
      order.cooldownRemaining = order.cooldown;

      // Execute action
      const fleet = order.fleetName ? this.state.fleets.get(order.fleetName) : null;
      const ships = fleet
        ? fleet.shipIds.map(id => this.state.ships.get(id)).filter((s): s is SpaceShip => !!(s && !s.dead))
        : [...this.state.ships.values()].filter(s => !s.dead && s.team === 1);

      if (order.action === 'attack_planet' || order.action === 'defend_planet') {
        const tgt = this.state.planets.find(p => p.id === order.actionPlanetId);
        if (tgt) {
          for (const s of ships) {
            s.moveTarget = { x: tgt.x + (Math.random()-0.5)*200, y: tgt.y + (Math.random()-0.5)*200, z:0 };
            s.isAttackMoving = order.action === 'attack_planet';
          }
        }
      } else if (order.action === 'focus_class' && order.focusClass) {
        // Mark nearby enemies of given class as priority targets for all ships in fleet
        const enemyOfClass = [...this.state.ships.values()]
          .find(s => !s.dead && s.team !== 1 && s.shipClass === order.focusClass);
        if (enemyOfClass) {
          for (const s of ships) s.targetId = enemyOfClass.id;
        }
      }
    }
  }

  // ── Resource Nodes ─────────────────────────────────────────────
  private generateResourceNodes() {
    type NK = ResourceNode['kind'];
    const kindYield: Record<NK, { credits:number; energy:number; minerals:number }> = {
      moon:            { credits: 3, energy:  2, minerals: 10 },
      asteroid:        { credits: 0, energy:  0, minerals: 15 },
      ice_rock:        { credits: 0, energy: 12, minerals:  2 },
      crystal_deposit: { credits: 12, energy: 2, minerals:  0 },
    };
    const kindRadius:     Record<NK, number> = { moon: 36, asteroid: 12, ice_rock: 17, crystal_deposit: 11 };
    const kindOrbitSpd:   Record<NK, number> = { moon: 0.12, asteroid: 0.42, ice_rock: 0.28, crystal_deposit: 0.52 };
    const kindHarvestCD:  Record<NK, number> = { moon: 8, asteroid: 5, ice_rock: 5, crystal_deposit: 6 };
    const typeNodes: Record<PlanetType, NK[]> = {
      volcanic:    ['asteroid', 'moon', 'asteroid'],
      oceanic:     ['ice_rock', 'moon', 'ice_rock'],
      barren:      ['asteroid', 'moon', 'asteroid'],
      crystalline: ['crystal_deposit', 'moon', 'crystal_deposit'],
      gas_giant:   ['ice_rock', 'moon', 'ice_rock'],
      frozen:      ['ice_rock', 'crystal_deposit', 'moon'],
    };
    for (const planet of this.state.planets) {
      const preferred = typeNodes[planet.planetType];
      const baseCount = planet.isStartingPlanet ? 3 : 1 + Math.floor(Math.random() * 2);
      const extraAst  = planet.hasAsteroidField ? 3 : 0;
      const total     = baseCount + extraAst;
      for (let i = 0; i < total; i++) {
        const kind: NK = i < baseCount ? preferred[i % preferred.length] : 'asteroid';
        const minOrbit = planet.radius * (kind === 'moon' ? 3.0 : 2.0);
        const maxOrbit = planet.radius * (kind === 'moon' ? 4.2 : 3.2);
        const orbitRadius = minOrbit + Math.random() * (maxOrbit - minOrbit);
        const orbitAngle  = (i / total) * Math.PI * 2 + Math.random() * 0.4;
        const orbitSpd    = kindOrbitSpd[kind] * (0.75 + Math.random() * 0.5) * (i % 2 === 0 ? 1 : -1);
        const node: ResourceNode = {
          id: this.state.nextId++,
          parentPlanetId: planet.id,
          x: planet.x + Math.cos(orbitAngle) * orbitRadius,
          y: planet.y + Math.sin(orbitAngle) * orbitRadius,
          z: 0, orbitAngle, orbitRadius, orbitSpeed: orbitSpd,
          kind,
          radius: kindRadius[kind] * (0.8 + Math.random() * 0.4),
          yield: { ...kindYield[kind] },
          harvestCooldown: 0,
          maxHarvestCooldown: kindHarvestCD[kind],
        };
        this.state.resourceNodes.set(node.id, node);
      }
    }
  }

  private updateResourceNodes(dt: number) {
    for (const [, node] of this.state.resourceNodes) {
      if (node.harvestCooldown > 0) node.harvestCooldown = Math.max(0, node.harvestCooldown - dt);
      const planet = this.state.planets.find(p => p.id === node.parentPlanetId);
      if (!planet) continue;
      node.orbitAngle += node.orbitSpeed * dt;
      node.x = planet.x + Math.cos(node.orbitAngle) * node.orbitRadius;
      node.y = planet.y + Math.sin(node.orbitAngle) * node.orbitRadius;
    }
  }

  // ── Workers ─────────────────────────────────────────────────
  private updateWorkers(dt: number) {
    const HARVEST_TIME = 5;
    const HARVEST_RANGE = 80;
    const DEPOSIT_RANGE = 120;
    for (const [, ship] of this.state.ships) {
      if (ship.dead || ship.shipClass !== 'worker') continue;
      if (ship.workerState === undefined) ship.workerState = 'idle';
      switch (ship.workerState) {
        case 'idle': {
          let bestNode: ResourceNode | null = null, bestDist = Infinity;
          for (const [, node] of this.state.resourceNodes) {
            if (node.harvestCooldown > 0) continue;
            const planet = this.state.planets.find(p => p.id === node.parentPlanetId);
            // Harvest from owned planets or uncaptured neutral planets
            if (!planet || (planet.owner !== ship.team && planet.owner !== 0)) continue;
            const d = dist2d(ship, node);
            if (d < bestDist) { bestDist = d; bestNode = node; }
          }
          if (bestNode) {
            ship.workerNodeId = bestNode.id;
            ship.workerState  = 'traveling';
            ship.moveTarget   = { x: bestNode.x, y: bestNode.y, z: 0 };
          }
          break;
        }
        case 'traveling': {
          if (!ship.workerNodeId) { ship.workerState = 'idle'; break; }
          const node = this.state.resourceNodes.get(ship.workerNodeId);
          if (!node || node.harvestCooldown > 0) { ship.workerState = 'idle'; ship.moveTarget = null; break; }
          ship.moveTarget = { x: node.x, y: node.y, z: 0 }; // track moving node
          if (dist2d(ship, node) < HARVEST_RANGE) {
            ship.workerState = 'harvesting';
            ship.workerHarvestTimer = 0;
            ship.moveTarget = null;
            ship.holdPosition = true;
          }
          break;
        }
        case 'harvesting': {
          if (!ship.workerNodeId) { ship.workerState = 'idle'; break; }
          const node = this.state.resourceNodes.get(ship.workerNodeId);
          if (!node) { ship.workerState = 'idle'; break; }
          // Gently follow the orbiting node
          const snapT = Math.min(1, dt * 1.5);
          ship.x += (node.x - ship.x) * snapT;
          ship.y += (node.y - ship.y) * snapT;
          ship.workerHarvestTimer = (ship.workerHarvestTimer ?? 0) + dt;
          if ((ship.workerHarvestTimer ?? 0) >= HARVEST_TIME) {
            ship.workerCargoType = node.kind === 'asteroid' || node.kind === 'moon' ? 'minerals'
              : node.kind === 'ice_rock' ? 'energy' : 'credits';
            ship.workerCargo = 1;
            node.harvestCooldown = node.maxHarvestCooldown;
            ship.workerState = 'returning';
            ship.holdPosition = false;
            // Head to home station (or nearest friendly)
            let target: { x:number; y:number } | null = null;
            if (ship.stationId) {
              const st = this.state.stations.get(ship.stationId);
              if (st && !st.dead) target = st;
            }
            if (!target) {
              let nd = Infinity;
              for (const [, st] of this.state.stations) {
                if (st.dead || st.team !== ship.team) continue;
                const d = dist2d(ship, st);
                if (d < nd) { nd = d; target = st; ship.stationId = st.id; }
              }
            }
            if (target) ship.moveTarget = { x: target.x, y: target.y, z: 0 };
          }
          break;
        }
        case 'returning': {
          if (!ship.stationId) { ship.workerState = 'idle'; break; }
          const st = this.state.stations.get(ship.stationId);
          if (!st || st.dead) { ship.stationId = null; ship.workerState = 'idle'; break; }
          if (dist2d(ship, st) < DEPOSIT_RANGE) {
            const res = this.state.resources[ship.team];
            if (res && ship.workerNodeId) {
              const node = this.state.resourceNodes.get(ship.workerNodeId);
              if (node) {
                res.credits  += node.yield.credits;
                res.energy   += node.yield.energy;
                res.minerals += node.yield.minerals;
              }
            }
            ship.workerCargo = 0; ship.workerNodeId = null;
            ship.workerState = 'idle'; ship.moveTarget = null;
          }
          break;
        }
      }
    }
  }

  private cleanupDead() {
    for (const [id, s] of this.state.ships) { if (s.dead && s.animTimer > 3) this.state.ships.delete(id); }
  }

  private findNearestEnemy(ship: SpaceShip): SpaceShip | null {
    let best: SpaceShip | null = null, bd = Infinity;
    for (const [, o] of this.state.ships) {
      if (o.dead || o.team === ship.team) continue;
      if (ship.team !== 0 && o.team === 0 && !o.orbitTarget) continue;
      const d = dist2d(ship, o);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }
}
