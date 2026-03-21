import type {
  SpaceGameState, SpaceShip, SpaceStation, Planet,
  Projectile, SpriteEffect, PlayerResources, Team, Vec3,
  ExplosionType, HitFxType, ShipAbilityState, GameMode, TeamUpgrades,
  ResourceNode, PlanetType,
} from './space-types';
import {
  SHIP_DEFINITIONS, TEAM_COLORS,
  CAPTURE_TIME, CAPTURE_RATE_PER_UNIT, NEUTRAL_DEFENDERS, DOMINATION_TIME,
  BUILDABLE_SHIPS, UPGRADE_COSTS, UPGRADE_BONUSES, getMapSize,
  HERO_DEFINITIONS, HERO_SHIPS, getShipDef, PLANET_TYPE_DATA,
} from './space-types';

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

const PLANET_ORBIT_RADIUS = 200;

export class SpaceEngine {
  state!: SpaceGameState;
  private resourceTimer = 0;
  private aiTimers = new Map<number, number>();
  private aiBuildTimers = new Map<number, number>();
  private winCheckTimer = 0;
  mapW = 8000;
  mapH = 8000;

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

    this.state = {
      gameMode: mode, ships: new Map(), stations: new Map(),
      planets: this.generatePlanets(mode, activePlayers),
      resourceNodes: new Map(),
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
      this.aiTimers.set(team, 0);
      this.aiBuildTimers.set(team, 0);
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
    if (isHero && !station.canBuildHeroes) return false;
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
    };
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
    this.updateShips(dt);
    this.updateProjectiles(dt);
    this.updateEffects(dt);
    this.updateStations(dt);
    this.updateCapture(dt);
    this.updateResources(dt);
    this.updateAI(dt);
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
    this.state.projectiles.set(id, {
      id, x: src.x, y: src.y, z: src.z,
      vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, vz: 0,
      team: src.team, damage: src.attackDamage, type: src.attackType as Projectile['type'],
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
          const et: ExplosionType = t.shipClass === 'battleship' ? 'explosion-1-e'
            : t.shipClass === 'cruiser' || t.shipClass === 'destroyer' ? 'explosion-1-d' : 'explosion-1-b';
          const sc = t.shipClass === 'battleship' ? 4 : t.shipClass === 'cruiser' ? 2 : 1;
          this.spawnSpriteEffect(t.x, t.y, 0, et, sc);
        }
      }
    }
  }

  private applyDamage(ship: SpaceShip, damage: number) {
    let r = damage;
    if (ship.shield > 0) { const ab = Math.min(ship.shield, r); ship.shield -= ab; r -= ab; }
    r = Math.max(0, r - ship.armor);
    ship.hp -= r;
    if (ship.hp <= 0) {
      ship.hp = 0; ship.dead = true; ship.animState = 'death_spiral';
      const res = this.state.resources[ship.team];
      if (res) res.supply = Math.max(0, res.supply - ship.supplyCost);
    }
  }

  // ── Stations ───────────────────────────────────────────────
  private updateStations(dt: number) {
    for (const [, st] of this.state.stations) {
      if (st.dead) continue;

      // Build queue processing
      if (st.buildQueue.length > 0) {
        const item = st.buildQueue[0];
        item.buildTimeRemaining -= dt;
        if (item.buildTimeRemaining <= 0) {
          st.buildQueue.shift();
          const rally = st.rallyPoint ?? { x: st.x + 200, y: st.y, z: 0 };
          const ship = this.spawnShip(item.shipType, st.team, st.x + 50, st.y - 50, st.id);
          ship.moveTarget = rally;
          if (st.team !== 1) for (const ab of ship.abilities) ab.autoCast = true;
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

  // ── AI ─────────────────────────────────────────────────────────
  private updateAI(dt: number) {
    for (const team of this.state.activePlayers) {
      if (team === 1) continue;
      const bt = (this.aiBuildTimers.get(team) ?? 0) + dt;
      const at = (this.aiTimers.get(team) ?? 0) + dt;
      this.aiBuildTimers.set(team, bt);
      this.aiTimers.set(team, at);

      if (bt > 5) { this.aiBuildTimers.set(team, 0); this.aiBuild(team); }
      if (at > 8) { this.aiTimers.set(team, 0); this.aiTactics(team); }

      // Strafing and dodging per-frame
      for (const [, s] of this.state.ships) {
        if (s.dead || s.team !== team) continue;
        if (s.damageLevel > 0.6 && s.targetId) {
          const t = this.state.ships.get(s.targetId);
          if (t && !t.dead && !s.moveTarget) {
            const fa = Math.atan2(s.y - t.y, s.x - t.x);
            s.moveTarget = { x: s.x + Math.cos(fa) * 400, y: s.y + Math.sin(fa) * 400, z: 0 };
          }
        }
        if (s.targetId && s.damageLevel < 0.5 && s.orbitTarget === null) {
          const t = this.state.ships.get(s.targetId);
          if (t && !t.dead) {
            const d = dist2d(s, t);
            if (d < s.attackRange && d > s.attackRange * 0.5) {
              const a = Math.atan2(t.y - s.y, t.x - s.x);
              const dir = s.id % 2 === 0 ? 1 : -1;
              s.x += Math.cos(a + Math.PI / 2 * dir) * s.speed * 0.3 * dt;
              s.y += Math.sin(a + Math.PI / 2 * dir) * s.speed * 0.3 * dt;
            }
          }
        }
      }
    }
  }

  private aiBuild(team: Team) {
    for (const [, st] of this.state.stations) {
      if (st.dead || st.team !== team || st.buildQueue.length >= 2) continue;
      const res = this.state.resources[team];
      if (!res) continue;
      let cnt = 0;
      for (const [, s] of this.state.ships) { if (!s.dead && s.team === team) cnt++; }
      if (cnt < 5) { this.queueBuild(st.id, 'red_fighter'); }
      else if (res.credits > 300 && res.minerals > 120) {
        const maxT = res.credits > 800 ? 4 : res.credits > 400 ? 3 : 2;
        const pool: string[] = [];
        for (let t = 1; t <= maxT; t++) pool.push(...(BUILDABLE_SHIPS[t] ?? []));
        if (pool.length > 0) this.queueBuild(st.id, pool[Math.floor(Math.random() * pool.length)]);
      }
      if (res.credits > 600 && res.minerals > 300) {
        const types: (keyof TeamUpgrades)[] = ['attack', 'armor', 'speed', 'health', 'shield'];
        this.purchaseUpgrade(team, types[Math.floor(Math.random() * types.length)]);
      }
    }
  }

  private aiTactics(team: Team) {
    const unowned = this.state.planets.filter(p => p.owner === 0);
    const enemy = this.state.planets.filter(p => p.owner !== 0 && p.owner !== team);
    const idle: SpaceShip[] = [];
    for (const [, s] of this.state.ships) {
      if (s.dead || s.team !== team || s.orbitTarget !== null) continue;
      if (!s.moveTarget && !s.targetId) idle.push(s);
    }
    if (idle.length === 0) return;
    if (unowned.length > 0) {
      const tgt = unowned[Math.floor(Math.random() * unowned.length)];
      const scouts = idle.splice(0, Math.min(3, idle.length));
      for (const sc of scouts) {
        sc.moveTarget = { x: tgt.x + (Math.random() - 0.5) * 100, y: tgt.y + (Math.random() - 0.5) * 100, z: 0 };
        sc.isAttackMoving = true;
      }
    }
    if (idle.length > 3 && enemy.length > 0) {
      const tgt = enemy[Math.floor(Math.random() * enemy.length)];
      for (const s of idle) { s.moveTarget = { x: tgt.x + (Math.random() - 0.5) * 200, y: tgt.y + (Math.random() - 0.5) * 200, z: 0 }; s.isAttackMoving = true; }
    } else if (idle.length > 0) {
      let near: SpaceShip | null = null, nd = Infinity;
      for (const [, s] of this.state.ships) {
        if (s.dead || s.team === team || s.team === 0) continue;
        const d = dist2d(s, idle[0]);
        if (d < nd) { nd = d; near = s; }
      }
      if (near) for (const s of idle) { s.moveTarget = { x: near!.x + (Math.random() - 0.5) * 200, y: near!.y + (Math.random() - 0.5) * 200, z: 0 }; s.isAttackMoving = true; }
    }
  }

  // ── Win ────────────────────────────────────────────────────────
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
