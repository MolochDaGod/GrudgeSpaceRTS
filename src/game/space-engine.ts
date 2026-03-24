import type {
  SpaceGameState,
  SpaceShip,
  SpaceStation,
  Planet,
  Projectile,
  SpriteEffect,
  PlayerResources,
  Team,
  Vec3,
  ExplosionType,
  HitFxType,
  ShipAbilityState,
  GameMode,
  TeamUpgrades,
  ResourceNode,
  PlanetType,
  PlanetTurret,
  TeamTechState,
  VoidEffect,
  Commander,
  CommanderSpec,
  FogGrid,
  POIType,
} from './space-types';
import {
  SHIP_DEFINITIONS,
  TEAM_COLORS,
  CAPTURE_TIME,
  CAPTURE_RATE_PER_UNIT,
  NEUTRAL_DEFENDERS,
  DOMINATION_TIME,
  BUILDABLE_SHIPS,
  UPGRADE_COSTS,
  UPGRADE_BONUSES,
  getMapSize,
  HERO_DEFINITIONS,
  HERO_SHIPS,
  getShipDef,
  PLANET_TYPE_DATA,
  defaultTechBonuses,
  COMMANDER_NAMES,
  COMMANDER_XP_LEVELS,
  COMMANDER_TRAIN_TIME,
  COMMANDER_TRAIN_COST,
  SHIP_ROLES,
  VISION_RADIUS,
  POI_COLORS,
  STATION_VISION_RADIUS,
  TURRET_VISION_RADIUS,
  type Fleet,
  type TacticalOrder,
} from './space-types';
import { ALL_TECH_TREES, VOID_POWERS, PLANET_TYPE_TO_TECH, TURRET_DEFS, XP_THRESHOLDS, RANK_STAT_BONUS } from './space-techtree';
import { createAIBrain, updateAIBrain, type AIBrain } from './space-ai';
import { gameAudio } from './space-audio';
import { getMuzzleWorldPosition } from './space-rig';
import { CAMPAIGN_TIME_SCALE, CAMPAIGN_START_RESOURCES, CAMPAIGN_STORY_BEATS } from './space-types';
import { generateSector } from './campaign-sector';
import { logConquest, logStoryBeat, generateUuid } from './captains-log';
import { startLogAutoFlush, stopLogAutoFlush } from './captains-log';
import { tickCampaignEvents, autoResolveExpired } from './campaign-events';
import { startAutoSave, stopAutoSave, checkConquestMilestone } from './campaign-state';

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

// ── Fog of War Helpers ─────────────────────────────────────────
const FOG_CELL_SIZE = 400;

function createFogGrid(mapW: number, mapH: number): FogGrid {
  const originX = -mapW / 2;
  const originY = -mapH / 2;
  const cols = Math.ceil(mapW / FOG_CELL_SIZE);
  const rows = Math.ceil(mapH / FOG_CELL_SIZE);
  return { cols, rows, cellSize: FOG_CELL_SIZE, originX, originY, data: new Uint8Array(cols * rows) };
}

/** Stamp a circle of visible (2) cells around a world-space position. */
function stampVision(grid: FogGrid, wx: number, wy: number, radius: number): void {
  const { cols, rows, cellSize, originX, originY, data } = grid;
  const cx = (wx - originX) / cellSize;
  const cy = (wy - originY) / cellSize;
  const cr = radius / cellSize;
  const cr2 = cr * cr;
  const minCol = Math.max(0, Math.floor(cx - cr));
  const maxCol = Math.min(cols - 1, Math.ceil(cx + cr));
  const minRow = Math.max(0, Math.floor(cy - cr));
  const maxRow = Math.min(rows - 1, Math.ceil(cy + cr));
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const dx = c + 0.5 - cx;
      const dy = r + 0.5 - cy;
      if (dx * dx + dy * dy <= cr2) {
        data[r * cols + c] = 2;
      }
    }
  }
}

/** Read a single cell's fog state from a grid. */
function fogCellState(grid: FogGrid, wx: number, wy: number): 0 | 1 | 2 {
  const col = Math.floor((wx - grid.originX) / grid.cellSize);
  const row = Math.floor((wy - grid.originY) / grid.cellSize);
  if (col < 0 || col >= grid.cols || row < 0 || row >= grid.rows) return 0;
  return grid.data[row * grid.cols + col] as 0 | 1 | 2;
}

export class SpaceEngine {
  state!: SpaceGameState;
  private resourceTimer = 0;
  private winCheckTimer = 0;
  private campaignEventTimer = 0;
  private aiBrains = new Map<number, AIBrain>();
  mapW = 16000;
  mapH = 16000;
  aiDifficulty = 3; // default D3

  /** Set to true before calling initGame() if the player has a saved hero ship. */
  hasCustomHero = false;
  /** Commander spec chosen at the pre-game modal. If set, a free level-1 commander spawns on init. */
  playerCommanderSpec: CommanderSpec | null = null;
  /** Campaign: the player's grudgeId for sector generation. */
  campaignGrudgeId: string | null = null;
  /** Campaign: commander portrait from Grudge account / CNFT. */
  campaignPortrait: string | null = null;
  /** Campaign: commander name from Grudge account. */
  campaignCommanderName: string | null = null;
  /** Campaign: chosen faction for evolution. */
  campaignFaction: 'wisdom' | 'construct' | 'void' | 'legion' = 'legion';

  initGame(mode: GameMode = '1v1') {
    const map = getMapSize(mode);
    this.mapW = map.width;
    this.mapH = map.height;

    const activePlayers: Team[] =
      mode === '1v1'
        ? [1 as Team, 2 as Team]
        : mode === 'campaign'
          ? [1 as Team, 2 as Team, 3 as Team, 4 as Team]
          : [1 as Team, 2 as Team, 3 as Team, 4 as Team];

    const isCampaign = mode === 'campaign';
    const makeRes = (): PlayerResources =>
      isCampaign
        ? {
            credits: CAMPAIGN_START_RESOURCES.credits,
            energy: CAMPAIGN_START_RESOURCES.energy,
            minerals: CAMPAIGN_START_RESOURCES.minerals,
            supply: 0,
            maxSupply: 50,
            spark: 0,
            sparkTotal: 0,
          }
        : { credits: 500, energy: 200, minerals: 300, supply: 0, maxSupply: 50, spark: 0, sparkTotal: 0 };
    const makeUpg = (): TeamUpgrades => ({ attack: 0, armor: 0, speed: 0, health: 0, shield: 0 });
    const resources: Record<number, PlayerResources> = {
      0: { credits: 0, energy: 0, minerals: 0, supply: 0, maxSupply: 0, spark: 0, sparkTotal: 0 },
    };
    const upgrades: Record<number, TeamUpgrades> = { 0: makeUpg() };
    for (const t of activePlayers) {
      resources[t] = makeRes();
      upgrades[t] = makeUpg();
    }

    // Init tech state per team
    const techState = new Map<number, TeamTechState>();
    const voidCds = new Map<number, Map<string, number>>();
    for (const t of activePlayers) {
      techState.set(t, {
        researchedNodes: new Set(),
        inResearch: null,
        researchTimeRemaining: 0,
        unlockedShips: new Set(),
        unlockedTurrets: new Set(['laser_turret', 'missile_turret']),
        bonuses: defaultTechBonuses(),
      });
      voidCds.set(t, new Map());
    }

    this.state = {
      gameMode: mode,
      ships: new Map(),
      stations: new Map(),
      planets: isCampaign ? [] : this.generatePlanets(mode, activePlayers), // campaign planets set below
      resourceNodes: new Map(),
      planetTurrets: new Map(),
      techState,
      voidCooldowns: voidCds,
      activeVoidEffects: [],
      darkRifts: [],
      darkRiftTimer: 90 + Math.random() * 30, // first rift at 90-120s
      aiDifficulty: this.aiDifficulty,
      commanders: new Map(),
      fleets: new Map(),
      tacticalOrders: [],
      towers: new Map(),
      projectiles: new Map(),
      spriteEffects: [],
      glbEffects: [],
      floatingTexts: [],
      alerts: [],
      resources,
      upgrades,
      gameTime: 0,
      nextId: 1000,
      selectedIds: new Set(),
      controlGroups: new Map(),
      gameOver: false,
      winner: null,
      winCondition: null,
      dominationTimer: 0,
      dominationTeam: null,
      activePlayers,
      fog: new Map(),
      pois: [],
      campaignProgress: null,
      captainsLog: [],
      campaignEvents: [],
      sparkState: new Map(),
    };

    // ── Campaign sector generation ─────────────────────────────
    if (isCampaign) {
      const grudgeId = this.campaignGrudgeId ?? 'guest';
      const sector = generateSector(grudgeId, this.state.nextId);
      this.state.planets = sector.planets;
      this.state.pois = sector.pois;
      this.state.nextId = Math.max(this.state.nextId, ...sector.planets.map((p) => p.id + 1), ...sector.pois.map((p) => p.id + 1));
      this.state.campaignProgress = {
        sectorSeed: sector.sectorSeed,
        conqueredPlanetIds: [sector.homeworldId],
        totalPlanets: sector.planets.length,
        homeworldId: sector.homeworldId,
        campaignStartTime: Date.now(),
        elapsedGameTime: 0,
        titlesEarned: [],
        storyBeatsCompleted: [],
        pvpUnlocked: false,
        postConquestWaves: 0,
        factionProgress: {
          faction: this.campaignFaction,
          xp: 0,
          level: 1,
          unlockedPerks: [],
        },
      };
      // Log first story beat
      logStoryBeat(this.state, 'awakening', 'The Awakening', CAMPAIGN_STORY_BEATS[0].text);
      // Start auto-flush and auto-save
      startLogAutoFlush();
      startAutoSave(() => this.state);
    }

    for (const team of activePlayers) {
      if (team !== 1) {
        this.aiBrains.set(team, createAIBrain(team, this.aiDifficulty));
      }
      const start = this.state.planets.find((p) => p.isStartingPlanet && p.owner === team);
      if (!start) continue;
      const station = this.buildStation(start, team);
      const sign = team % 2 === 1 ? -1 : 1;

      // Start: harvesters + your flagship. No free combat fleet.
      // Flagship: custom_hero if player made one, otherwise pyramid_ship
      if (team === 1) {
        const heroType = this.hasCustomHero ? 'custom_hero' : 'pyramid_ship';
        const hero = this.spawnShip(heroType, team, start.x + sign * 60, start.y + 50, station.id);
        hero.selected = false;
      } else {
        // AI gets a pyramid_ship flagship too
        this.spawnShip('pyramid_ship', team, start.x + sign * 60, start.y + 50, station.id);
      }
      // 3 workers with their home station assigned
      for (let wi = 0; wi < 3; wi++) {
        const wType = wi < 2 ? 'mining_drone' : 'energy_skimmer';
        const w = this.spawnShip(wType, team, start.x + sign * (200 + wi * 60), start.y + 60 + wi * 40, station.id);
        w.workerState = 'idle';
      }
    }
    // Generate resource nodes after all planets and states are initialized
    this.generateResourceNodes();
    // POIs for skirmish modes (campaign gets them from sector gen)
    if (!isCampaign) this.generateSkirmishPOIs();
    // Init fog of war grids for every team
    this.initFog();

    // Spawn player's starting commander if a spec was chosen pre-game
    if (this.playerCommanderSpec) {
      const homeWorld = this.state.planets.find((p) => p.isStartingPlanet && p.owner === 1);
      if (homeWorld) {
        const portraitIdx = Math.floor(Math.random() * 20) + 1;
        const portrait = `/assets/space/ui/commanders/${portraitIdx}.png`;
        const name = COMMANDER_NAMES[Math.floor(Math.random() * COMMANDER_NAMES.length)];
        const id = this.state.nextId++;
        const cmd: Commander = {
          id,
          name,
          portrait,
          spec: this.playerCommanderSpec,
          level: 1,
          xp: 0,
          xpToNextLevel: COMMANDER_XP_LEVELS[2] ?? 250,
          team: 1 as Team,
          state: 'idle',
          trainingPlanetId: null,
          trainingTimeRemaining: 0,
          trainingTotalTime: 0,
          equippedShipId: null,
          attackBonus: 0.05,
          defenseBonus: 0.05,
          speedBonus: 0.05,
          specialBonus: 0.075,
        };
        this.state.commanders.set(id, cmd);
        // Auto-equip to the player flagship
        for (const [, ship] of this.state.ships) {
          if (ship.team === 1 && (ship.shipType === 'pyramid_ship' || ship.shipType === 'custom_hero')) {
            this.equipCommanderToShip(ship);
            break;
          }
        }
      }
    }

    // AI autocast
    for (const [, ship] of this.state.ships) {
      if (ship.team !== 1) for (const ab of ship.abilities) ab.autoCast = true;
    }

    // Neutral defenders: 1 boss captain + pirate escorts per neutral planet
    const bossTypes = ['boss_captain_01', 'boss_captain_02', 'boss_captain_03'];
    const pirateTypes = ['pirate_01', 'pirate_02', 'pirate_03', 'pirate_04', 'pirate_05', 'pirate_06'];
    for (const planet of this.state.planets) {
      if (planet.owner === 0 && planet.neutralDefenders > 0) {
        const defOrbit = planet.captureRadius * 0.6;
        // Boss captain orbits the planet as its leader
        const bossType = bossTypes[planet.id % bossTypes.length];
        const boss = this.spawnShip(bossType, 0 as Team, planet.x + Math.cos(0) * defOrbit, planet.y + Math.sin(0) * defOrbit);
        boss.orbitTarget = planet.id;
        boss.orbitRadius = defOrbit;
        boss.orbitAngle = 0;
        boss.holdPosition = true;
        for (const ab of boss.abilities) ab.autoCast = true;
        // Pirate escorts orbit around the boss
        for (let i = 1; i < planet.neutralDefenders; i++) {
          const pirateType = pirateTypes[(planet.id + i) % pirateTypes.length];
          const angle = (i / planet.neutralDefenders) * Math.PI * 2;
          const ship = this.spawnShip(pirateType, 0 as Team, planet.x + Math.cos(angle) * defOrbit, planet.y + Math.sin(angle) * defOrbit);
          ship.orbitTarget = planet.id;
          ship.orbitRadius = defOrbit;
          ship.orbitAngle = angle;
          ship.holdPosition = true;
          for (const ab of ship.abilities) ab.autoCast = true;
        }
      }
    }

    // Roaming pirate fleets: patrol between random planet pairs
    const neutralPlanets = this.state.planets.filter((p) => p.owner === 0);
    const roamCount = mode === '1v1' ? 2 : 3;
    for (let f = 0; f < Math.min(roamCount, neutralPlanets.length); f++) {
      const pA = neutralPlanets[f];
      const pB = neutralPlanets[(f + 2) % neutralPlanets.length];
      const fleetSize = 2 + Math.floor(Math.random() * 2); // 2-3 pirates
      for (let i = 0; i < fleetSize; i++) {
        const pirateType = pirateTypes[(f * 3 + i) % pirateTypes.length];
        const spread = (i - fleetSize / 2) * 80;
        const ship = this.spawnShip(pirateType, 0 as Team, pA.x + spread, pA.y + 100);
        // Patrol between the two planets
        ship.patrolPoints = [
          { x: pA.x, y: pA.y, z: 0 },
          { x: pB.x, y: pB.y, z: 0 },
        ];
        ship.patrolIndex = 1;
        ship.moveTarget = { x: pB.x + spread, y: pB.y, z: 0 };
        ship.isAttackMoving = true;
        for (const ab of ship.abilities) ab.autoCast = true;
      }
    }
  }

  // ── Planets (zone-based procedural generation) ─────────────────
  private generatePlanets(mode: GameMode, players: Team[]): Planet[] {
    const planets: Planet[] = [];
    const NAMES = [
      'Terra Nova',
      'Helios Prime',
      'Voidreach',
      'Crux Station',
      'Nebula Gate',
      'Iron Forge',
      'Starfall',
      'Ashenmire',
      'Crystal Veil',
      "Oberon's Drift",
      'Pyxis Minor',
      'Cinder Reach',
      'Glasspoint',
      'Echo Basin',
      'Forge Hollow',
      'Dusk Veil',
      'Nova Reach',
      'Storm Bastion',
      'Shard Gate',
      'Riftpoint',
    ];
    let nameIdx = 0;
    const nextName = () => NAMES[nameIdx++ % NAMES.length];
    const hw = this.mapW / 2;
    const hh = this.mapH / 2;
    let pid = 0;

    const ALL_TYPES: PlanetType[] = ['volcanic', 'oceanic', 'barren', 'crystalline', 'gas_giant', 'frozen'];
    const usedTypes = new Set<PlanetType>();
    const pickType = (preferred?: PlanetType[]): PlanetType => {
      const unused = ALL_TYPES.filter((t) => !usedTypes.has(t));
      if (unused.length > 0 && Math.random() < 0.4) {
        const t = unused[Math.floor(Math.random() * unused.length)];
        usedTypes.add(t);
        return t;
      }
      const pool = preferred && preferred.length ? preferred : ALL_TYPES;
      const t = pool[Math.floor(Math.random() * pool.length)];
      usedTypes.add(t);
      return t;
    };

    const placed: { x: number; y: number }[] = [];
    const MIN_DIST = 2500;
    const tooClose = (x: number, y: number) => placed.some((p) => Math.hypot(p.x - x, p.y - y) < MIN_DIST);

    const makePlanet = (
      x: number,
      y: number,
      owner: Team,
      pType: PlanetType,
      name: string,
      isStart: boolean,
      defenders: number,
      richMult: number,
    ): Planet => {
      const td = PLANET_TYPE_DATA[pType];
      const radius = isStart ? 280 : 100 + Math.random() * 80;
      return {
        id: pid++,
        x,
        y,
        z: 0,
        radius,
        name,
        owner,
        stationId: null,
        resourceYield: {
          credits: Math.round(8 * richMult * td.resourceMult.credits),
          energy: Math.round(5 * richMult * td.resourceMult.energy),
          minerals: Math.round(6 * richMult * td.resourceMult.minerals),
        },
        color: td.baseColor,
        hasAsteroidField: Math.random() < 0.3,
        planetType: pType,
        captureRadius: radius * 2.5,
        captureTeam: 0 as Team,
        captureProgress: 0,
        captureSpeed: CAPTURE_RATE_PER_UNIT,
        neutralDefenders: defenders,
        isStartingPlanet: isStart,
      };
    };

    // ── Zone 1: Home planets (corners) ──────────────────────
    const startTypes: PlanetType[] = ['volcanic', 'oceanic', 'crystalline', 'gas_giant'];
    const corners: Vec3[] =
      mode === '1v1'
        ? [
            { x: -hw * 0.7, y: -hh * 0.7, z: 0 },
            { x: hw * 0.7, y: hh * 0.7, z: 0 },
          ]
        : [
            { x: -hw * 0.7, y: -hh * 0.7, z: 0 },
            { x: hw * 0.7, y: hh * 0.7, z: 0 },
            { x: -hw * 0.7, y: hh * 0.7, z: 0 },
            { x: hw * 0.7, y: -hh * 0.7, z: 0 },
          ];
    for (let i = 0; i < players.length; i++) {
      const pt = startTypes[i % startTypes.length];
      usedTypes.add(pt);
      const p = makePlanet(corners[i].x, corners[i].y, players[i], pt, nextName(), true, 0, 2.0);
      p.resourceYield = { credits: 15, energy: 10, minerals: 12 }; // fixed start yields
      p.hasAsteroidField = false;
      planets.push(p);
      placed.push({ x: p.x, y: p.y });
    }

    // ── Zone 2: Expansion planets (safe natural near each start) ──
    for (let i = 0; i < players.length; i++) {
      const angle = Math.atan2(-corners[i].y, -corners[i].x) + (Math.random() - 0.5) * 0.5;
      const dist = 3000 + Math.random() * 1000;
      const ex = corners[i].x + Math.cos(angle) * dist;
      const ey = corners[i].y + Math.sin(angle) * dist;
      if (!tooClose(ex, ey)) {
        const p = makePlanet(ex, ey, 0 as Team, pickType(), nextName(), false, 2, 1.5);
        planets.push(p);
        placed.push({ x: p.x, y: p.y });
      }
    }

    // ── Zone 3: Contested center (rich, strong defenders) ─────
    const centerCount = mode === '1v1' ? 2 : 3;
    for (let c = 0; c < centerCount; c++) {
      let x: number,
        y: number,
        attempts = 0;
      do {
        x = (Math.random() - 0.5) * hw * 0.6;
        y = (Math.random() - 0.5) * hh * 0.6;
        attempts++;
      } while (tooClose(x, y) && attempts < 50);
      if (!tooClose(x, y)) {
        const p = makePlanet(x, y, 0 as Team, pickType(['crystalline', 'gas_giant']), nextName(), false, NEUTRAL_DEFENDERS + 2, 2.5);
        planets.push(p);
        placed.push({ x: p.x, y: p.y });
      }
    }

    // ── Zone 4: Lane / flank planets (between player starts) ──
    const laneSources: { x: number; y: number }[] = [];
    for (let i = 0; i < players.length; i++) {
      const j = (i + 1) % players.length;
      laneSources.push({
        x: (corners[i].x + corners[j].x) / 2 + (Math.random() - 0.5) * 800,
        y: (corners[i].y + corners[j].y) / 2 + (Math.random() - 0.5) * 800,
      });
    }
    // Add flank offsets
    for (const lp of [...laneSources]) {
      laneSources.push({
        x: lp.x + (Math.random() - 0.5) * 3000,
        y: lp.y + (Math.random() - 0.5) * 3000,
      });
    }

    const totalBudget = mode === '1v1' ? 9 : 16;
    const remaining = Math.max(0, totalBudget - planets.length);
    for (let i = 0; i < remaining; i++) {
      let x: number,
        y: number,
        attempts = 0;
      if (i < laneSources.length) {
        x = laneSources[i].x;
        y = laneSources[i].y;
        while (tooClose(x, y) && attempts < 30) {
          x = laneSources[i].x + (Math.random() - 0.5) * 2000;
          y = laneSources[i].y + (Math.random() - 0.5) * 2000;
          attempts++;
        }
      } else {
        do {
          x = (Math.random() - 0.5) * hw * 1.2;
          y = (Math.random() - 0.5) * hh * 1.2;
          attempts++;
        } while (tooClose(x, y) && attempts < 50);
      }
      if (tooClose(x, y)) continue;
      const rich = 1.0 + Math.random() * 0.8;
      const defs = Math.random() < 0.4 ? NEUTRAL_DEFENDERS + 1 : NEUTRAL_DEFENDERS;
      const p = makePlanet(x, y, 0 as Team, pickType(), nextName(), false, defs, rich);
      planets.push(p);
      placed.push({ x: p.x, y: p.y });
    }

    // ── Variety guarantee: every planet type appears at least once ──
    const missing = ALL_TYPES.filter((t) => !usedTypes.has(t));
    for (const t of missing) {
      const cands = planets.filter((p) => !p.isStartingPlanet);
      if (cands.length > 0) {
        const v = cands[Math.floor(Math.random() * cands.length)];
        v.planetType = t;
        v.color = PLANET_TYPE_DATA[t].baseColor;
      }
    }

    return planets;
  }

  // ── Fog of War ─────────────────────────────────────────────────
  private initFog(): void {
    for (const team of this.state.activePlayers) {
      this.state.fog.set(team, createFogGrid(this.mapW, this.mapH));
    }
  }

  /** Query fog state for a world position: 0=unexplored, 1=explored (dark), 2=visible. */
  fogState(team: number, wx: number, wy: number): 0 | 1 | 2 {
    const grid = this.state.fog.get(team);
    if (!grid) return 2; // no grid ⇒ treat as fully visible
    return fogCellState(grid, wx, wy);
  }
  isVisible(team: number, x: number, y: number): boolean {
    return this.fogState(team, x, y) === 2;
  }
  isExplored(team: number, x: number, y: number): boolean {
    return this.fogState(team, x, y) >= 1;
  }

  /** Reset visible→explored, then stamp vision around every owned unit. */
  private updateFog(_dt: number): void {
    const s = this.state;
    for (const team of s.activePlayers) {
      let grid = s.fog.get(team);
      if (!grid) {
        grid = createFogGrid(this.mapW, this.mapH);
        s.fog.set(team, grid);
      }
      // Phase: visible → explored
      const d = grid.data;
      for (let i = 0, len = d.length; i < len; i++) {
        if (d[i] === 2) d[i] = 1;
      }
      // Ships
      for (const [, ship] of s.ships) {
        if (ship.dead || ship.team !== team) continue;
        stampVision(grid, ship.x, ship.y, VISION_RADIUS[ship.shipClass] ?? 600);
      }
      // Stations
      for (const [, station] of s.stations) {
        if (station.dead || station.team !== team) continue;
        stampVision(grid, station.x, station.y, STATION_VISION_RADIUS);
      }
      // Planet turrets
      for (const [, turret] of s.planetTurrets) {
        if (turret.dead || turret.team !== team) continue;
        stampVision(grid, turret.x, turret.y, TURRET_VISION_RADIUS);
      }
    }
  }

  // ── Skirmish POI Generation ────────────────────────────────────
  private generateSkirmishPOIs(): void {
    const s = this.state;
    const hw = this.mapW / 2;
    const hh = this.mapH / 2;
    const count = s.gameMode === '1v1' ? 8 : 12;
    const types: POIType[] = ['derelict', 'anomaly', 'data_cache', 'resource_vein', 'ancient_gate', 'pirate_stash'];

    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      let attempts = 0;
      do {
        x = (Math.random() - 0.5) * hw * 1.4;
        y = (Math.random() - 0.5) * hh * 1.4;
        attempts++;
      } while (attempts < 50 && (s.planets.some((p) => dist2d(p, { x, y }) < 2000) || s.pois.some((p) => dist2d(p, { x, y }) < 1500)));
      const type = types[i % types.length];
      const id = s.nextId++;
      s.pois.push({
        id,
        x,
        y,
        type,
        name: `${type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} ${id}`,
        discovered: false,
        claimedByTeam: null,
        reward: {
          credits: type === 'resource_vein' ? 400 : type === 'pirate_stash' ? 250 : 80,
          energy: type === 'anomaly' ? 150 : 30,
          minerals: type === 'resource_vein' ? 300 : 30,
          xp: 30 + Math.floor(Math.random() * 80),
        },
        radius: 500,
        guarded: type === 'pirate_stash' || type === 'derelict',
        guardShipIds: [],
        guardsSpawned: false,
        guardShipTypes: type === 'pirate_stash' ? ['pirate_01', 'pirate_02', 'pirate_03'] : ['pirate_01', 'pirate_02'],
      });
    }
    // Link ancient gate pairs
    const gates = s.pois.filter((p) => p.type === 'ancient_gate');
    for (let i = 0; i < gates.length - 1; i += 2) {
      gates[i].pairedPOIId = gates[i + 1].id;
      gates[i + 1].pairedPOIId = gates[i].id;
    }
  }

  // ── POI Discovery & Reward ─────────────────────────────────────
  private updatePOIs(_dt: number): void {
    const s = this.state;
    for (const poi of s.pois) {
      if (poi.claimedByTeam !== null) continue;
      for (const [, ship] of s.ships) {
        if (ship.dead || ship.team === 0) continue;
        if (dist2d(ship, poi) > poi.radius) continue;

        // First contact → mark discovered
        if (!poi.discovered) {
          poi.discovered = true;
          s.floatingTexts.push({
            id: s.nextId++,
            x: poi.x,
            y: poi.y,
            z: 100,
            text: `Discovered: ${poi.name}`,
            color: POI_COLORS[poi.type],
            age: 0,
            maxAge: 3,
          });
          s.alerts.push({ id: s.nextId++, x: poi.x, y: poi.y, z: 0, type: 'conquest', time: s.gameTime, message: `POI: ${poi.name}` });
        }

        // Spawn guards on first approach
        if (poi.guarded && !poi.guardsSpawned) {
          poi.guardsSpawned = true;
          for (const gType of poi.guardShipTypes) {
            const g = this.spawnShip(gType, 0 as Team, poi.x + (Math.random() - 0.5) * 200, poi.y + (Math.random() - 0.5) * 200);
            g.holdPosition = true;
            for (const ab of g.abilities) ab.autoCast = true;
            poi.guardShipIds.push(g.id);
          }
          break; // wait until guards are dead
        }

        // Guards still alive? skip claim
        if (
          poi.guarded &&
          poi.guardShipIds.some((gid) => {
            const g = s.ships.get(gid);
            return g && !g.dead;
          })
        )
          continue;

        // Claim rewards
        poi.claimedByTeam = ship.team;
        const r = s.resources[ship.team];
        if (r) {
          r.credits += poi.reward.credits ?? 0;
          r.energy += poi.reward.energy ?? 0;
          r.minerals += poi.reward.minerals ?? 0;
        }
        if (poi.reward.xp) ship.xp += poi.reward.xp;
        s.floatingTexts.push({
          id: s.nextId++,
          x: poi.x,
          y: poi.y,
          z: 120,
          text: `+${poi.reward.credits ?? 0}c +${poi.reward.energy ?? 0}e +${poi.reward.minerals ?? 0}m`,
          color: '#ffcc22',
          age: 0,
          maxAge: 3,
        });
        break;
      }
    }
  }

  // ── Station ────────────────────────────────────────────────────
  buildStation(planet: Planet, team: Team): SpaceStation {
    const id = this.state.nextId++;
    const station: SpaceStation = {
      id,
      x: planet.x,
      y: planet.y + planet.radius * 1.5,
      z: 50,
      team,
      hp: 500,
      maxHp: 500,
      dead: false,
      planetId: planet.id,
      buildQueue: [],
      maxBuildSlots: 5,
      towerSlots: 6,
      towersBuilt: 0,
      rallyPoint: { x: planet.x + 300, y: planet.y, z: 0 },
      supplyProvided: 20,
      selected: false,
      autoProduceType: null,
      autoProduceTimer: 0,
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
      const hasCommander = [...this.state.commanders.values()].some((c) => c.team === station.team && c.state === 'idle');
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
    const startPlanet = this.state.planets.find((p) => p.isStartingPlanet && p.owner === team);
    const discount = startPlanet && PLANET_TYPE_DATA[startPlanet.planetType].upgradeDiscount === type ? 0.8 : 1.0;
    const cc = Math.ceil(cost.credits * discount);
    const mc = Math.ceil(cost.minerals * discount);
    const ec = Math.ceil(cost.energy * discount);
    if (res.credits < cc || res.minerals < mc || res.energy < ec) return false;
    res.credits -= cc;
    res.minerals -= mc;
    res.energy -= ec;
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
      id,
      x,
      y,
      z: 0,
      team,
      hp: Math.round(s.maxHp * hpM),
      maxHp: Math.round(s.maxHp * hpM),
      dead: false,
      shipType: type,
      shipClass: def.class,
      shield: Math.round(s.maxShield * shM),
      maxShield: Math.round(s.maxShield * shM),
      shieldRegen: s.shieldRegen,
      armor: s.armor + arB,
      speed: s.speed * spM,
      turnRate: s.turnRate,
      vx: 0,
      vy: 0,
      vz: 0,
      facing: team === 1 ? 0 : Math.PI,
      pitch: 0,
      roll: 0,
      targetId: null,
      moveTarget: null,
      attackMoveTarget: null,
      isAttackMoving: false,
      holdPosition: false,
      patrolPoints: [],
      patrolIndex: 0,
      attackDamage: Math.round(s.attackDamage * dmM),
      attackRange: s.attackRange,
      attackCooldown: s.attackCooldown,
      attackTimer: 0,
      attackType: s.attackType,
      supplyCost: s.supplyCost,
      abilities: (s.abilities || []).map((a) => ({ ability: a, cooldownRemaining: 0, active: false, activeTimer: 0, autoCast: false })),
      animState: 'idle',
      animTimer: Math.random() * 10,
      selected: false,
      controlGroup: 0,
      stationId: stationId ?? null,
      orbitTarget: null,
      orbitRadius: 0,
      orbitAngle: 0,
      isDocked: false,
      damageLevel: 0,
      workerState: def.class === 'worker' ? 'idle' : undefined,
      workerNodeId: def.class === 'worker' ? null : undefined,
      workerCargo: def.class === 'worker' ? 0 : undefined,
      workerCargoType: def.class === 'worker' ? 'minerals' : undefined,
      workerHarvestTimer: def.class === 'worker' ? 0 : undefined,
      xp: 0,
      rank: 0,
      roleTimer: 0,
      baseSpeed: s.speed * spM,
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
    // Campaign: 10x slower time scale
    const effectiveDt = this.state.gameMode === 'campaign' ? dt * CAMPAIGN_TIME_SCALE : dt;
    this.state.gameTime += effectiveDt;
    if (this.state.campaignProgress) {
      this.state.campaignProgress.elapsedGameTime = this.state.gameTime;
    }
    // Override dt for all subsystems
    const _dt = effectiveDt;
    this.updateFog(_dt);
    this.updateResourceNodes(_dt);
    this.updateWorkers(_dt);
    this.updateCommanderTraining(_dt);
    this.updateShipRoles(_dt);
    this.updateTacticalOrders(_dt);
    this.updateShipSeparation(_dt);
    this.updateShips(_dt);
    this.updateProjectiles(_dt);
    this.updateEffects(_dt);
    this.updateStations(_dt);
    this.updateCapture(_dt);
    this.updateResources(_dt);
    this.updateTechResearch(_dt);
    this.updatePlanetTurrets(_dt);
    this.updateVoidEffects(_dt);
    this.updateVoidCooldowns(_dt);
    this.updateDarkRifts(_dt);
    this.updatePOIs(_dt);
    this.updateAdvancedAI(_dt);
    this.updateWinCondition(_dt);
    // Campaign event ticker (every ~30 game-seconds)
    if (this.state.gameMode === 'campaign') {
      this.campaignEventTimer += _dt;
      if (this.campaignEventTimer >= 30) {
        this.campaignEventTimer = 0;
        tickCampaignEvents(this.state);
        autoResolveExpired(this.state);
        this.checkCampaignStoryBeats();
        checkConquestMilestone(this.state);
      }
    }
    this.cleanupDead();
  }

  /** Check if any story beats should trigger based on conquest progress. */
  private checkCampaignStoryBeats(): void {
    const p = this.state.campaignProgress;
    if (!p) return;
    const pct = (p.conqueredPlanetIds.length / Math.max(p.totalPlanets, 1)) * 100;
    for (const beat of CAMPAIGN_STORY_BEATS) {
      if (pct >= beat.atPercent && !p.storyBeatsCompleted.includes(beat.id)) {
        p.storyBeatsCompleted.push(beat.id);
        logStoryBeat(this.state, beat.id, beat.title, beat.text);
        // Add alert
        this.state.alerts.push({
          id: this.state.nextId++,
          x: 0,
          y: 0,
          z: 0,
          type: 'conquest',
          time: this.state.gameTime,
          message: `STORY: ${beat.title}`,
        });
      }
    }
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
        const planet = this.state.planets.find((p) => p.id === ship.orbitTarget);
        if (planet) {
          ship.orbitAngle += dt * 0.3;
          ship.x = planet.x + Math.cos(ship.orbitAngle) * ship.orbitRadius;
          ship.y = planet.y + Math.sin(ship.orbitAngle) * ship.orbitRadius;
          ship.facing = ship.orbitAngle + Math.PI / 2;
        }
      }

      // Movement
      if (ship.moveTarget && !ship.holdPosition && ship.orbitTarget === null) {
        const dx = ship.moveTarget.x - ship.x,
          dy = ship.moveTarget.y - ship.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 15) {
          const ta = Math.atan2(dy, dx);
          ship.facing = lerpAngle(ship.facing, ta, ship.turnRate * dt);
          const spd = ship.speed * dt;
          ship.vx = Math.cos(ship.facing) * spd;
          ship.vy = Math.sin(ship.facing) * spd;
          ship.x += ship.vx;
          ship.y += ship.vy;
          ship.animState = 'moving';
          ship.roll = angleDelta(ship.facing, ta) * 2;
        } else {
          // Arrived at destination — check if we're patrolling
          if (ship.patrolPoints.length >= 2) {
            ship.patrolIndex = (ship.patrolIndex + 1) % ship.patrolPoints.length;
            const next = ship.patrolPoints[ship.patrolIndex];
            ship.moveTarget = { x: next.x, y: next.y, z: 0 };
          } else {
            ship.moveTarget = null;
          }
          ship.vx = 0;
          ship.vy = 0;
          ship.animState = 'idle';
        }
      } else if (!ship.targetId && ship.orbitTarget === null) {
        // If patrolling and idle (e.g. finished a combat detour), resume patrol
        if (ship.patrolPoints.length >= 2 && !ship.moveTarget) {
          const next = ship.patrolPoints[ship.patrolIndex];
          ship.moveTarget = { x: next.x, y: next.y, z: 0 };
        }
        ship.animState = ship.moveTarget ? 'moving' : 'idle';
      }

      // Auto-acquire — attack-move uses a much wider scan radius so ships
      // proactively engage enemies along their path, not just in weapon range.
      if (!ship.targetId && !ship.holdPosition) {
        const scanRange = ship.isAttackMoving ? ship.attackRange * 3 : ship.attackRange * 1.5;
        const nearest = this.findNearestEnemy(ship);
        if (nearest && dist2d(ship, nearest) < scanRange) {
          // Save the original destination so we can resume after the fight
          if (ship.isAttackMoving && ship.moveTarget && !ship.attackMoveTarget) {
            ship.attackMoveTarget = { ...ship.moveTarget };
          }
          ship.targetId = nearest.id;
          ship.moveTarget = null; // stop moving, engage
        }
      }

      // Combat
      if (ship.targetId) {
        const t = this.state.ships.get(ship.targetId);
        if (!t || t.dead) {
          ship.targetId = null;
          // Resume attack-move toward original destination if we detoured
          if (ship.attackMoveTarget) {
            ship.moveTarget = ship.attackMoveTarget;
            ship.attackMoveTarget = null;
            // Stay in attack-move mode so we engage the next enemy too
          }
        } else {
          const d = dist2d(ship, t);
          if (d > ship.attackRange) {
            if (!ship.holdPosition && ship.orbitTarget === null) {
              const a = Math.atan2(t.y - ship.y, t.x - ship.x);
              ship.facing = lerpAngle(ship.facing, a, ship.turnRate * dt);
              const spd = ship.speed * dt;
              ship.vx = Math.cos(ship.facing) * spd;
              ship.vy = Math.sin(ship.facing) * spd;
              ship.x += ship.vx;
              ship.y += ship.vy;
              ship.animState = 'moving';
            }
          } else if (ship.attackTimer <= 0) {
            this.fireProjectile(ship, t);
            ship.attackTimer = ship.attackCooldown;
            ship.animState = 'attacking';
            ship.animTimer = 0;
          }
        }
      }

      // Abilities
      for (const ab of ship.abilities) {
        ab.cooldownRemaining = Math.max(0, ab.cooldownRemaining - dt);
        if (ab.active) {
          ab.activeTimer -= dt;
          if (ab.activeTimer <= 0) {
            ab.active = false;
            // Revert speed-modifying abilities using game-time expiry
            if (ab.ability.type === 'ram' || ab.ability.type === 'speed_boost') {
              ship.speed = ship.baseSpeed;
            }
          }
        }
        if (ab.autoCast && !ab.active && ab.cooldownRemaining <= 0 && ship.targetId !== null) {
          const res = this.state.resources[ship.team];
          if (res && res.energy >= ab.ability.energyCost) this.activateAbility(ship, ab, res);
        }
      }
    }
  }

  private activateAbility(ship: SpaceShip, ab: ShipAbilityState, res: PlayerResources) {
    ab.active = true;
    ab.activeTimer = ab.ability.duration;
    ab.cooldownRemaining = ab.ability.cooldown;
    res.energy -= ab.ability.energyCost;
    if (ab.ability.type === 'barrel_roll') {
      ship.animState = 'barrel_roll';
      this.spawnSpriteEffect(ship.x, ship.y, 0, 'crossed', 0.8);
    } else if (ab.ability.type === 'speed_boost') {
      ship.animState = 'speed_boost';
      ship.baseSpeed = ship.speed;
      ship.speed *= 1.5;
      this.spawnSpriteEffect(ship.x, ship.y, 0, 'spark', 0.6);
    } else if (ab.ability.type === 'cloak') {
      ship.animState = 'cloaked';
      this.spawnSpriteEffect(ship.x, ship.y, 0, 'spark', 1.0);
    } else if (ab.ability.type === 'warp') {
      ship.animState = 'warping';
      this.spawnSpriteEffect(ship.x, ship.y, 0, 'crossed', 1.5);
    } else if (ab.ability.type === 'iron_dome') {
      this.spawnSpriteEffect(ship.x, ship.y, 0, 'waveform', 3.0);
      this.spawnSpriteEffect(ship.x, ship.y, 0, 'bomb-low', 2.0);
    } else if (ab.ability.type === 'emp') {
      this.spawnSpriteEffect(ship.x, ship.y, 0, 'spark', 2.5);
      this.spawnSpriteEffect(ship.x, ship.y, 0, 'bomb-tiny', 1.5);
    } else if (ab.ability.type === 'ram') {
      ship.baseSpeed = ship.speed;
      ship.speed *= 2.5;
      this.spawnSpriteEffect(ship.x, ship.y, 0, 'charged', 1.2);
    } else if (ab.ability.type === 'boarding') {
      const tgt = ship.targetId ? this.state.ships.get(ship.targetId) : null;
      if (tgt) this.spawnSpriteEffect(tgt.x, tgt.y, 0, 'hits-6', 1.0);
    } else if (ab.ability.type === 'launch_fighters') {
      this.spawnSpriteEffect(ship.x, ship.y, 0, 'bomb-low-2', 1.5);
    } else if (ab.ability.type === 'repair') {
      this.spawnSpriteEffect(ship.x, ship.y, 0, 'bomb-tiny-3', 0.8);
    }
    ship.animTimer = 0;
  }

  // ── Projectiles ────────────────────────────────────────────────
  private fireProjectile(src: SpaceShip, tgt: SpaceShip) {
    const id = this.state.nextId++;
    const a = Math.atan2(tgt.y - src.y, tgt.x - src.x);
    const spd = src.attackType === 'missile' ? 300 : src.attackType === 'railgun' ? 600 : 400;
    // Spawn from inferred rig muzzle hardpoint (nose/front weapons) instead of ship center.
    const muzzle = getMuzzleWorldPosition(src, id);
    // Star Splitter ambush: +80% damage on first hit against a new target
    let dmgMult = 1;
    if (SHIP_ROLES[src.shipType] === 'star_splitter' && src.lastTargetId !== tgt.id) {
      dmgMult = 1.8;
      src.lastTargetId = tgt.id;
    }
    this.state.projectiles.set(id, {
      id,
      x: muzzle.x,
      y: muzzle.y,
      z: src.z,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd,
      vz: 0,
      team: src.team,
      damage: Math.round(src.attackDamage * dmgMult),
      type: src.attackType as Projectile['type'],
      sourceId: src.id,
      targetId: tgt.id,
      speed: spd,
      lifetime: 0,
      maxLifetime: 3,
      homing: src.attackType === 'missile',
      homingStrength: 3,
      trailColor: TEAM_COLORS[src.team] ?? 0x4488ff,
    });
    // ── Muzzle flash at shooter position ──
    const MUZZLE_FX: Record<string, string> = { laser: 'bolt', missile: 'charged', railgun: 'crossed', pulse: 'pulse', torpedo: 'spark' };
    const mfx = MUZZLE_FX[src.attackType] ?? 'bolt';
    const isCapital = src.shipClass === 'battleship' || src.shipClass === 'dreadnought' || src.shipClass === 'carrier';
    const isMed = src.shipClass === 'cruiser' || src.shipClass === 'destroyer' || src.shipClass === 'light_cruiser';
    const mfxScale = isCapital ? 1.0 : isMed ? 0.7 : 0.4;
    this.spawnSpriteEffect(muzzle.x, muzzle.y, 0, mfx, mfxScale);
    // SFX: weapon fire (only for player team to avoid spam)
    if (src.team === 1) {
      const sfx =
        src.attackType === 'railgun' || src.attackType === 'torpedo'
          ? ('heavy_shot' as const)
          : src.attackType === 'missile'
            ? ('missile_shot' as const)
            : ('laser' as const);
      gameAudio.play(sfx, 0.4);
    }
  }

  private updateProjectiles(dt: number) {
    for (const [id, p] of this.state.projectiles) {
      p.lifetime += dt;
      if (p.lifetime > p.maxLifetime) {
        this.state.projectiles.delete(id);
        continue;
      }
      if (p.homing) {
        const t = this.state.ships.get(p.targetId);
        if (t && !t.dead) {
          const a = Math.atan2(t.y - p.y, t.x - p.x);
          const c = Math.atan2(p.vy, p.vx);
          const n = lerpAngle(c, a, p.homingStrength * dt);
          p.vx = Math.cos(n) * p.speed;
          p.vy = Math.sin(n) * p.speed;
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      const t = this.state.ships.get(p.targetId);
      if (t && !t.dead && Math.sqrt((p.x - t.x) ** 2 + (p.y - t.y) ** 2) < 20) {
        this.applyDamage(t, p.damage);
        this.state.projectiles.delete(id);
        // Hit flash — weapon-type-specific effects
        if (p.type === 'torpedo' || p.type === 'missile') {
          const bombTier = p.type === 'torpedo' ? 'bomb-high' : 'bomb-mid';
          this.spawnSpriteEffect(t.x, t.y, 0, bombTier, p.type === 'torpedo' ? 2.0 : 1.4);
        } else {
          // Weapon-specific hit sprites
          const HIT_MAP: Record<string, HitFxType> = { laser: 'hits-1', pulse: 'hits-2', railgun: 'hits-3' };
          const hitType = HIT_MAP[p.type] ?? (['hits-4', 'hits-5', 'hits-6'] as const)[Math.floor(Math.random() * 3)];
          this.spawnSpriteEffect(t.x, t.y, 0, hitType, 0.6);
          // Impact overlay for extra punch
          this.spawnSpriteEffect(t.x, t.y, 0, 'bomb-tiny', 0.4);
        }
        if (t.dead) {
          // ─ Layered death explosions scaled by ship class ─
          const isMega = t.shipClass === 'dreadnought' || t.shipClass === 'battleship';
          const isMed = t.shipClass === 'cruiser' || t.shipClass === 'destroyer' || t.shipClass === 'light_cruiser';
          const isWorker = t.shipClass === 'worker';
          const isSmall = t.shipClass === 'fighter' || t.shipClass === 'scout' || t.shipClass === 'interceptor';
          if (isWorker) {
            // Workers: tiny pop
            this.spawnSpriteEffect(t.x, t.y, 0, 'bomb-tiny', 0.6);
          } else if (isSmall) {
            // Small ships: random from the lighter explosion variants
            const smallEx: ExplosionType[] = ['explosion-1-a', 'explosion-1-b', 'explosion-1-g'];
            this.spawnSpriteEffect(t.x, t.y, 0, smallEx[Math.floor(Math.random() * 3)], 1.2);
            this.spawnSpriteEffect(t.x, t.y, 0, 'bomb-tiny-2', 0.5);
          } else {
            const sc = isMega ? 6 : isMed ? 3 : 1.8;
            const et: ExplosionType = isMega ? 'explosion-1-e' : isMed ? 'explosion-1-d' : 'explosion-1-c';
            // Primary blast
            this.spawnSpriteEffect(t.x, t.y, 0, et, sc);
            // Bomb cloud overlay for bigger ships
            this.spawnSpriteEffect(t.x, t.y, 0, 'bomb-high-3', sc * 0.7);
            // Secondary debris cloud (offset)
            this.spawnSpriteEffect(t.x + 30, t.y - 20, 0, 'explosion-1-c', sc * 0.6);
            this.spawnSpriteEffect(t.x - 20, t.y + 25, 0, 'explosion-1-a', sc * 0.5);
            // Mega ships: third wave + sparkle overlay + extra bomb cloud
            if (isMega) {
              this.spawnSpriteEffect(t.x, t.y, 0, 'explosion-b', sc * 0.8);
              this.spawnSpriteEffect(t.x + 60, t.y + 40, 0, 'explosion-1-f', sc * 0.4);
              this.spawnSpriteEffect(t.x - 40, t.y - 50, 0, 'explosion-1-g', sc * 0.5);
              this.spawnSpriteEffect(t.x + 20, t.y - 30, 0, 'bomb-high-2', sc * 0.6);
            }
          }
          // Grant XP to killing ship
          const killer = this.state.ships.get(p.sourceId);
          if (killer && !killer.dead) {
            const xpGain =
              t.shipClass === 'battleship' || t.shipClass === 'dreadnought'
                ? 60
                : t.shipClass === 'destroyer' || t.shipClass === 'cruiser'
                  ? 30
                  : 15;
            this.grantXP(killer, xpGain);
          }
        }
      }
    }
  }

  private applyDamage(ship: SpaceShip, damage: number) {
    let r = damage;
    // Juggernaut role: 30% incoming damage reduction
    if (SHIP_ROLES[ship.shipType] === 'juggernaut') r *= 0.7;
    const hadShield = ship.shield > 0;
    if (ship.shield > 0) {
      const ab = Math.min(ship.shield, r);
      ship.shield -= ab;
      r -= ab;
    }
    // Shield break flash
    if (hadShield && ship.shield <= 0) {
      this.spawnSpriteEffect(ship.x, ship.y, 0, 'waveform', 1.2);
      this.spawnSpriteEffect(ship.x, ship.y, 0, 'bomb-tiny-2', 0.8);
    }
    r = Math.max(0, r - ship.armor);
    ship.hp -= r;
    // Floating damage number (limit to ~20 on screen to avoid spam)
    if (r > 0 && this.state.floatingTexts.length < 20) {
      const isShield = ship.shield > 0 && damage > r;
      this.state.floatingTexts.push({
        id: this.state.nextId++,
        x: ship.x + (Math.random() - 0.5) * 30,
        y: ship.y + (Math.random() - 0.5) * 30,
        z: 30,
        text: `-${Math.round(r)}`,
        color: isShield ? '#44ccff' : r >= 40 ? '#ff4444' : '#ffcc44',
        age: 0,
        maxAge: 1.2,
      });
    }
    if (ship.hp <= 0) {
      ship.hp = 0;
      ship.dead = true;
      ship.animState = 'death_spiral';
      // Death SFX
      const isBig = ship.shipClass === 'dreadnought' || ship.shipClass === 'battleship' || ship.shipClass === 'cruiser';
      gameAudio.play(isBig ? 'death_large' : 'death_small', 0.6);
      const res = this.state.resources[ship.team];
      if (res) res.supply = Math.max(0, res.supply - ship.supplyCost);
      // Release or lose commander when ship dies
      for (const [, cmd] of this.state.commanders) {
        if (cmd.equippedShipId === ship.id) {
          if (ship.shipClass === 'dreadnought') {
            // Commander dies with the Dreadnought (permadeath)
            this.state.commanders.delete(cmd.id);
          } else {
            cmd.state = 'idle';
            cmd.equippedShipId = null;
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
            id: this.state.nextId++,
            x: st.x,
            y: st.y,
            z: 0,
            type: 'build_complete',
            time: this.state.gameTime,
            message: `${shipDef?.displayName ?? item.shipType} complete`,
          });
          // Build complete SFX (player only)
          if (st.team === 1) {
            const isHero = ship.shipClass === 'dreadnought';
            gameAudio.play(isHero ? 'hero_built' : 'build_complete', 0.7);
          }
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
        if (dist2d(s, planet) < planet.captureRadius) teamCounts.set(s.team, (teamCounts.get(s.team) ?? 0) + 1);
      }

      let neutralAlive = 0;
      for (const [, s] of this.state.ships) {
        if (!s.dead && s.team === 0 && s.orbitTarget === planet.id) neutralAlive++;
      }
      if (neutralAlive > 0) {
        planet.captureProgress = 0;
        planet.captureTeam = 0 as Team;
        continue;
      }

      let sole: Team | null = null;
      for (const [team] of teamCounts) {
        if (sole === null) sole = team as Team;
        else {
          sole = null;
          break;
        }
      }

      if (sole !== null && sole !== planet.owner) {
        if (planet.captureTeam !== sole) {
          planet.captureTeam = sole;
          planet.captureProgress = 0;
        }
        planet.captureProgress += planet.captureSpeed * (teamCounts.get(sole) ?? 1) * dt;
        if (planet.captureProgress >= CAPTURE_TIME) {
          planet.owner = sole;
          planet.captureProgress = 0;
          planet.captureTeam = 0 as Team;
          if (planet.stationId !== null) {
            const old = this.state.stations.get(planet.stationId);
            if (old) {
              this.state.resources[old.team].maxSupply -= old.supplyProvided;
              this.state.stations.delete(planet.stationId);
            }
            planet.stationId = null;
          }
          this.buildStation(planet, sole);
          this.state.alerts.push({
            id: this.state.nextId++,
            x: planet.x,
            y: planet.y,
            z: 0,
            type: 'conquest',
            time: this.state.gameTime,
            message: `${planet.name} captured!`,
          });
          gameAudio.play('capture', 0.8);
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
            res.credits += p.resourceYield.credits * m.credits;
            res.energy += p.resourceYield.energy * m.energy;
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
      if (e.frameTimer >= e.frameDuration) {
        e.frameTimer = 0;
        e.frame++;
        if (e.frame >= e.totalFrames) e.done = true;
      }
    }
    this.state.spriteEffects = this.state.spriteEffects.filter((e) => !e.done);
    // Age floating damage texts
    for (const ft of this.state.floatingTexts) {
      ft.age += dt;
      ft.y -= 30 * dt;
      ft.z += 20 * dt;
    }
    this.state.floatingTexts = this.state.floatingTexts.filter((ft) => ft.age < ft.maxAge);
    this.state.alerts = this.state.alerts.filter((a) => this.state.gameTime - a.time < 15);
  }

  private spawnSpriteEffect(x: number, y: number, z: number, type: string, scale: number) {
    const counts: Record<string, number> = {
      'explosion-1-a': 8,
      'explosion-1-b': 8,
      'explosion-1-c': 10,
      'explosion-1-d': 12,
      'explosion-1-e': 22,
      'explosion-1-f': 8,
      'explosion-1-g': 7,
      'explosion-b': 12,
      bolt: 4,
      charged: 6,
      crossed: 6,
      pulse: 4,
      spark: 5,
      waveform: 4,
      'hits-1': 5,
      'hits-2': 7,
      'hits-3': 5,
      'hits-4': 7,
      'hits-5': 7,
      'hits-6': 7,
      'bomb-tiny': 8,
      'bomb-tiny-2': 8,
      'bomb-tiny-3': 10,
      'bomb-low': 8,
      'bomb-low-2': 8,
      'bomb-low-3': 10,
      'bomb-mid': 8,
      'bomb-mid-2': 8,
      'bomb-mid-3': 10,
      'bomb-high': 8,
      'bomb-high-2': 8,
      'bomb-high-3': 10,
    };
    this.state.spriteEffects.push({
      id: this.state.nextId++,
      x,
      y,
      z,
      type: type as SpriteEffect['type'],
      scale,
      frame: 0,
      totalFrames: counts[type] ?? 8,
      frameTimer: 0,
      frameDuration: 0.06,
      done: false,
      rotation: Math.random() * Math.PI * 2,
    });
  }

  // ── Tech Research ───────────────────────────────────────────────
  startResearch(team: Team, nodeId: string): boolean {
    const st = this.state.techState.get(team);
    if (!st || st.inResearch) return false;
    // Check all trees for this node
    for (const tree of Object.values(ALL_TECH_TREES)) {
      const node = tree.nodes.find((n) => n.id === nodeId);
      if (!node) continue;
      // Check prerequisites
      if (!node.requires.every((r) => st.researchedNodes.has(r))) return false;
      const res = this.state.resources[team];
      if (!res) return false;
      if (res.credits < node.cost.credits || res.energy < node.cost.energy || res.minerals < node.cost.minerals) return false;
      res.credits -= node.cost.credits;
      res.energy -= node.cost.energy;
      res.minerals -= node.cost.minerals;
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
        const node = tree.nodes.find((n) => n.id === nodeId);
        if (!node) continue;
        for (const eff of node.effects) {
          if (eff.kind === 'stat_bonus' && eff.stat && eff.value != null) {
            const b = st.bonuses;
            if (eff.stat === 'attack') b.attackMult = Math.max(b.attackMult, 1 + eff.value);
            if (eff.stat === 'armor') b.armorBonus += eff.value;
            if (eff.stat === 'shield') b.shieldMult = Math.max(b.shieldMult, 1 + eff.value);
            if (eff.stat === 'speed') b.speedMult = Math.max(b.speedMult, 1 + eff.value);
            if (eff.stat === 'health') b.healthMult = Math.max(b.healthMult, 1 + eff.value);
            if (eff.stat === 'all') {
              b.attackMult *= 1 + eff.value;
              b.shieldMult *= 1 + eff.value;
              b.speedMult *= 1 + eff.value;
              b.healthMult *= 1 + eff.value;
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
          id: this.state.nextId++,
          x: 0,
          y: 0,
          z: 0,
          type: 'build_complete',
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
    res.credits -= pwr.cost.credits;
    res.energy -= pwr.cost.energy;
    res.minerals -= pwr.cost.minerals;
    cds.set(powerId, pwr.cooldown);
    this.state.voidCooldowns.set(team, cds);

    if (pwr.effect === 'aoe_damage' || pwr.effect === 'aoe_scatter') {
      // Immediate AoE damage
      for (const [, s] of this.state.ships) {
        if (s.dead || s.team === team) continue;
        const d = Math.sqrt((s.x - targetX) ** 2 + (s.y - targetY) ** 2);
        if (d < pwr.radius) this.applyDamage(s, (pwr.damage ?? 300) * (1 - d / pwr.radius));
      }
      this.spawnSpriteEffect(targetX, targetY, 0, 'explosion-1-e', 8);
      this.spawnSpriteEffect(targetX, targetY, 0, 'bomb-high-3', 5);
    } else if (pwr.effect === 'push') {
      // Push enemies away from planet
      const planet = this.state.planets.find((p) => p.owner === team); // nearest owned planet
      const px = planet?.x ?? targetX,
        py = planet?.y ?? targetY;
      for (const [, s] of this.state.ships) {
        if (s.dead || s.team === team) continue;
        const d = Math.sqrt((s.x - px) ** 2 + (s.y - py) ** 2);
        if (d < pwr.radius) {
          const a = Math.atan2(s.y - py, s.x - px);
          const force = pwr.pushForce ?? 800;
          s.x += Math.cos(a) * force * 0.1;
          s.y += Math.sin(a) * force * 0.1;
          s.moveTarget = { x: s.x + Math.cos(a) * force, y: s.y + Math.sin(a) * force, z: 0 };
        }
      }
    } else if (pwr.effect === 'teleport_fleet') {
      for (const id of this.state.selectedIds) {
        const s = this.state.ships.get(id);
        if (!s || s.dead || s.team !== team) continue;
        const spread = this.state.selectedIds.size;
        const idx = [...this.state.selectedIds].indexOf(id);
        s.x = targetX + ((idx % 5) - 2) * 80;
        s.y = targetY + Math.floor(idx / 5) * 80;
        s.moveTarget = null;
      }
    } else if (pwr.effect === 'pull_damage') {
      // Create a lingering void rift effect
      this.state.activeVoidEffects.push({
        id: this.state.nextId++,
        powerId,
        x: targetX,
        y: targetY,
        radius: pwr.radius,
        damage: pwr.damage ?? 80,
        lifetime: 0,
        maxLifetime: pwr.duration ?? 8,
        team,
        done: false,
      });
    } else if (pwr.effect === 'destroy_planet') {
      const planetIdx = this.state.planets.findIndex((p) => Math.sqrt((p.x - targetX) ** 2 + (p.y - targetY) ** 2) < p.radius * 3);
      if (planetIdx >= 0) {
        const p = this.state.planets[planetIdx];
        // Kill enemy ships orbiting/near it (spare the caster's fleet)
        for (const [, s] of this.state.ships) {
          if (s.dead || s.team === team) continue;
          if (Math.sqrt((s.x - p.x) ** 2 + (s.y - p.y) ** 2) < p.captureRadius) this.applyDamage(s, 99999);
        }
        // Remove station
        if (p.stationId) {
          this.state.stations.delete(p.stationId);
        }
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
      if (eff.lifetime >= eff.maxLifetime) {
        eff.done = true;
        continue;
      }
      // Pull + damage ENEMY ships each tick (skip friendlies)
      for (const [, s] of this.state.ships) {
        if (s.dead || s.team === eff.team) continue;
        const d = Math.sqrt((s.x - eff.x) ** 2 + (s.y - eff.y) ** 2);
        if (d < eff.radius) {
          // Pull toward center
          const a = Math.atan2(eff.y - s.y, eff.x - s.x);
          const pull = (1 - d / eff.radius) * 200;
          s.x += Math.cos(a) * pull * dt;
          s.y += Math.sin(a) * pull * dt;
          // Damage per second
          const dps = eff.damage ?? 80;
          this.applyDamage(s, dps * dt);
        }
      }
    }
    this.state.activeVoidEffects = this.state.activeVoidEffects.filter((e) => !e.done);
  }

  private updateVoidCooldowns(dt: number) {
    for (const [, cdMap] of this.state.voidCooldowns) {
      for (const [key, val] of cdMap) {
        if (val > 0) cdMap.set(key, Math.max(0, val - dt));
      }
    }
  }

  // ── Dark Rifts (PvE random map events) ──────────────────
  private updateDarkRifts(dt: number) {
    // Countdown to next rift
    this.state.darkRiftTimer -= dt;
    if (this.state.darkRiftTimer <= 0 && this.state.darkRifts.filter((r) => !r.done).length < 3) {
      this.state.darkRiftTimer = 90 + Math.random() * 30; // next rift in 90-120s
      // Spawn at random map location away from all planets
      const margin = 2000;
      let rx = margin + Math.random() * (this.mapW - margin * 2);
      let ry = margin + Math.random() * (this.mapH - margin * 2);
      // Push away from nearest planet
      for (const p of this.state.planets) {
        const d = Math.sqrt((p.x - rx) ** 2 + (p.y - ry) ** 2);
        if (d < 1500) {
          const a = Math.atan2(ry - p.y, rx - p.x);
          rx += Math.cos(a) * (1500 - d);
          ry += Math.sin(a) * (1500 - d);
        }
      }
      // Scale bounty and ship count with game time
      const gameMin = this.state.gameTime / 60;
      const shipCount = Math.min(8, 3 + Math.floor(gameMin / 3));
      const bountyC = Math.round(30 + gameMin * 5);
      const bountyM = Math.round(15 + gameMin * 3);

      const rift: import('./space-types').DarkRift = {
        id: this.state.nextId++,
        x: rx,
        y: ry,
        spawnDelay: 5,
        lifetime: 0,
        maxLifetime: 35,
        shipsSpawned: false,
        shipIds: [],
        done: false,
        bountyCredits: bountyC,
        bountyMinerals: bountyM,
      };
      this.state.darkRifts.push(rift);
      // Alert all players
      this.state.alerts.push({
        id: this.state.nextId++,
        x: rx,
        y: ry,
        z: 0,
        type: 'dark_rift',
        time: this.state.gameTime,
        message: 'Dark Rift detected!',
      });
      // VFX at rift location
      this.spawnSpriteEffect(rx, ry, 0, 'waveform', 4.0);
      this.spawnSpriteEffect(rx, ry, 0, 'crossed', 3.0);
      gameAudio.play('alert', 0.7);
    }

    // Update active rifts
    for (const rift of this.state.darkRifts) {
      if (rift.done) continue;
      rift.lifetime += dt;

      // Spawn ships after delay
      if (!rift.shipsSpawned && rift.lifetime >= rift.spawnDelay) {
        rift.shipsSpawned = true;
        const gameMin = this.state.gameTime / 60;
        const shipCount = Math.min(8, 3 + Math.floor(gameMin / 3));
        // Composition scales with game time
        const pool =
          gameMin < 3
            ? ['micro_recon', 'red_fighter']
            : gameMin < 7
              ? ['red_fighter', 'dual_striker', 'galactix_racer']
              : gameMin < 12
                ? ['cf_corvette_02', 'cf_frigate_01', 'dual_striker']
                : ['cf_frigate_03', 'cf_destroyer_01', 'warship'];

        for (let i = 0; i < shipCount; i++) {
          const type = pool[Math.floor(Math.random() * pool.length)];
          const angle = (i / shipCount) * Math.PI * 2;
          const spread = 100 + Math.random() * 80;
          const ship = this.spawnShip(
            type,
            0 as import('./space-types').Team,
            rift.x + Math.cos(angle) * spread,
            rift.y + Math.sin(angle) * spread,
          );
          rift.shipIds.push(ship.id);
        }
        this.spawnSpriteEffect(rift.x, rift.y, 0, 'bomb-high-3', 5.0);
        this.spawnSpriteEffect(rift.x, rift.y, 0, 'explosion-1-e', 4.0);
      }

      // Check if all rift ships are dead
      if (rift.shipsSpawned) {
        const allDead = rift.shipIds.every((id) => {
          const s = this.state.ships.get(id);
          return !s || s.dead;
        });
        if (allDead) {
          rift.done = true;
          // Bonus resources to all active players who participated
          for (const team of this.state.activePlayers) {
            const r = this.state.resources[team];
            if (r) {
              r.credits += rift.bountyCredits;
              r.minerals += rift.bountyMinerals;
            }
          }
          this.state.alerts.push({
            id: this.state.nextId++,
            x: rift.x,
            y: rift.y,
            z: 0,
            type: 'conquest',
            time: this.state.gameTime,
            message: `Rift cleared! +${rift.bountyCredits}c +${rift.bountyMinerals}m`,
          });
        }
      }

      // Time out
      if (rift.lifetime >= rift.maxLifetime) {
        rift.done = true;
        // Kill remaining rift ships
        for (const id of rift.shipIds) {
          const s = this.state.ships.get(id);
          if (s && !s.dead) {
            s.hp = 0;
            s.dead = true;
          }
        }
      }
    }
    // Cleanup done rifts
    this.state.darkRifts = this.state.darkRifts.filter((r) => !r.done || r.lifetime < r.maxLifetime + 5);
  }

  // ── Planet Turrets ────────────────────────────────────────────
  buildPlanetTurret(team: Team, planetId: number, turretType: string): boolean {
    const planet = this.state.planets.find((p) => p.id === planetId);
    if (!planet || planet.owner !== team) return false;
    const st = this.state.techState.get(team);
    if (!st || !st.unlockedTurrets.has(turretType)) return false;
    const existing = [...this.state.planetTurrets.values()].filter((t) => t.planetId === planetId && !t.dead);
    if (existing.length >= 4) return false;
    const def = TURRET_DEFS[turretType];
    if (!def) return false;
    const res = this.state.resources[team];
    if (!res || res.credits < def.cost.credits || res.energy < def.cost.energy || res.minerals < def.cost.minerals) return false;
    res.credits -= def.cost.credits;
    res.energy -= def.cost.energy;
    res.minerals -= def.cost.minerals;
    // Place in orbit
    const angle = (existing.length / 4) * Math.PI * 2;
    const orbitR = planet.radius * 1.5;
    const id = this.state.nextId++;
    const turret: PlanetTurret = {
      id,
      planetId,
      team,
      turretType,
      x: planet.x + Math.cos(angle) * orbitR,
      y: planet.y + Math.sin(angle) * orbitR,
      z: 20,
      orbitAngle: angle,
      orbitRadius: orbitR,
      hp: def.maxHp,
      maxHp: def.maxHp,
      dead: false,
      attackCooldown: def.attackCooldown,
      attackTimer: 0,
      targetId: null,
    };
    this.state.planetTurrets.set(id, turret);
    return true;
  }

  private updatePlanetTurrets(dt: number) {
    for (const [id, t] of this.state.planetTurrets) {
      if (t.dead) continue;
      t.attackTimer = Math.max(0, t.attackTimer - dt);
      // Update orbit position
      const planet = this.state.planets.find((p) => p.id === t.planetId);
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
          let best: SpaceShip | null = null;
          let bd = Infinity;
          for (const [, s] of this.state.ships) {
            if (s.dead || s.team === t.team) continue;
            const d = Math.sqrt((s.x - t.x) ** 2 + (s.y - t.y) ** 2);
            if (d < def.attackRange && d < bd) {
              bd = d;
              best = s;
            }
          }
          t.targetId = best?.id ?? null;
        }
      }
      if (t.targetId && t.attackTimer <= 0) {
        const target = this.state.ships.get(t.targetId);
        if (!target || target.dead || Math.sqrt((target.x - t.x) ** 2 + (target.y - t.y) ** 2) > def.attackRange) {
          t.targetId = null;
        } else {
          this.applyDamage(target, def.attackDamage);
          this.spawnSpriteEffect(target.x, target.y, 0, 'hits-3', 0.6);
          // Turret muzzle flash
          this.spawnSpriteEffect(t.x, t.y, 0, 'bolt', 0.5);
          t.attackTimer = def.attackCooldown;
        }
      }
    }
  }

  // ── Commander System ─────────────────────────────────────────────
  /** Start training a new commander at a planet. Spec is inferred from planet type. */
  trainCommander(team: Team, planetId: number): boolean {
    const planet = this.state.planets.find((p) => p.id === planetId);
    if (!planet || planet.owner !== team) return false;
    // Only one commander training per planet at a time
    const alreadyTraining = [...this.state.commanders.values()].some((c) => c.trainingPlanetId === planetId && c.state === 'training');
    if (alreadyTraining) return false;
    const res = this.state.resources[team];
    if (!res) return false;
    const cost = COMMANDER_TRAIN_COST[1]; // cost to recruit level 1
    if (res.credits < cost.credits || res.energy < cost.energy || res.minerals < cost.minerals) return false;
    res.credits -= cost.credits;
    res.energy -= cost.energy;
    res.minerals -= cost.minerals;
    // Derive spec from planet type
    const specMap: Record<string, CommanderSpec> = {
      volcanic: 'forge',
      oceanic: 'tide',
      crystalline: 'prism',
      gas_giant: 'vortex',
      barren: 'void',
      frozen: 'void',
    };
    const spec: CommanderSpec = specMap[planet.planetType] ?? 'forge';
    // 20 pixel-art sci-fi commander portraits (craftpix-617771, transparent set)
    const portraitIdx = Math.floor(Math.random() * 20) + 1;
    const portrait = `/assets/space/ui/commanders/${portraitIdx}.png`;
    const name = COMMANDER_NAMES[Math.floor(Math.random() * COMMANDER_NAMES.length)];
    const id = this.state.nextId++;
    const totalTime = COMMANDER_TRAIN_TIME[1];
    const cmd: Commander = {
      id,
      name,
      portrait,
      spec,
      level: 0,
      xp: 0,
      xpToNextLevel: COMMANDER_XP_LEVELS[1],
      team,
      state: 'training',
      trainingPlanetId: planetId,
      trainingTimeRemaining: totalTime,
      trainingTotalTime: totalTime,
      equippedShipId: null,
      attackBonus: 0,
      defenseBonus: 0,
      speedBonus: 0,
      specialBonus: 0,
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
    res.credits -= cost.credits;
    res.energy -= cost.energy;
    res.minerals -= cost.minerals;
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
      cmd.attackBonus = pct;
      cmd.defenseBonus = pct;
      cmd.speedBonus = pct;
      cmd.specialBonus = pct * 1.5; // spec bonus is 50% stronger
      cmd.state = 'idle';
      cmd.trainingPlanetId = null;
      this.state.alerts.push({
        id: this.state.nextId++,
        x: 0,
        y: 0,
        z: 0,
        type: 'build_complete',
        time: this.state.gameTime,
        message: `Commander ${cmd.name} promoted to Level ${cmd.level}!`,
      });
      gameAudio.play('commander', 0.8);
    }
  }

  /** Equip an idle commander to a hero ship. Called after ship is built. */
  private equipCommanderToShip(ship: SpaceShip) {
    const idleCmd = [...this.state.commanders.values()].find((c) => c.team === ship.team && c.state === 'idle');
    if (!idleCmd) return;
    idleCmd.state = 'onship';
    idleCmd.equippedShipId = ship.id;
    // Apply commander bonuses on top of ship stats
    ship.attackDamage = Math.round(ship.attackDamage * (1 + idleCmd.attackBonus));
    ship.maxHp = Math.round(ship.maxHp * (1 + idleCmd.defenseBonus));
    ship.hp = ship.maxHp;
    ship.maxShield = Math.round(ship.maxShield * (1 + idleCmd.defenseBonus));
    ship.speed *= 1 + idleCmd.speedBonus;
    ship.baseSpeed = ship.speed; // keep baseSpeed in sync with permanent buffs
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
      ship.maxHp = Math.round(ship.maxHp * mult);
      ship.hp = Math.min(ship.hp + Math.round(ship.maxHp * 0.1), ship.maxHp);
      ship.maxShield = Math.round(ship.maxShield * mult);
      ship.attackDamage = Math.round(ship.attackDamage * mult);
      ship.speed *= mult;
      ship.baseSpeed = ship.speed; // keep baseSpeed in sync with permanent buffs
      ship.armor = Math.round(ship.armor * mult);
      this.state.alerts.push({
        id: this.state.nextId++,
        x: ship.x,
        y: ship.y,
        z: 0,
        type: 'build_complete',
        time: this.state.gameTime,
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
        brain,
        this.state,
        dt,
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
      for (const [, s] of this.state.ships) {
        if (!s.dead && s.team === team) {
          has = true;
          break;
        }
      }
      if (!has)
        for (const [, st] of this.state.stations) {
          if (!st.dead && st.team === team) {
            has = true;
            break;
          }
        }
      if (!has) {
        const rem = this.state.activePlayers.filter((t) => {
          if (t === team) return false;
          for (const [, s] of this.state.ships) {
            if (!s.dead && s.team === t) return true;
          }
          for (const [, st] of this.state.stations) {
            if (!st.dead && st.team === t) return true;
          }
          return false;
        });
        if (rem.length === 1) {
          this.state.gameOver = true;
          this.state.winner = rem[0];
          this.state.winCondition = 'elimination';
          return;
        }
      }
    }
    const owned = this.state.planets.filter((p) => p.owner !== 0);
    if (owned.length > 0 && owned.length >= this.state.planets.length * 0.7) {
      const o = owned[0].owner;
      if (owned.every((p) => p.owner === o)) {
        if (this.state.dominationTeam === o) {
          this.state.dominationTimer += 2;
          if (this.state.dominationTimer >= DOMINATION_TIME) {
            this.state.gameOver = true;
            this.state.winner = o;
            this.state.winCondition = 'domination';
          }
        } else {
          this.state.dominationTeam = o;
          this.state.dominationTimer = 0;
        }
      } else {
        this.state.dominationTimer = 0;
        this.state.dominationTeam = null;
      }
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
      dreadnought: 380,
      battleship: 320,
      carrier: 280,
      cruiser: 240,
      light_cruiser: 220,
      destroyer: 200,
      frigate: 180,
      corvette: 160,
      assault_frigate: 180,
      bomber: 200,
      transport: 180,
      stealth: 150,
      heavy_fighter: 140,
      fighter: 130,
      interceptor: 120,
      scout: 110,
      worker: 90,
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

      let fx = 0,
        fy = 0;
      const minA = MIN_SEP[a.shipClass] ?? 130;

      for (let j = i + 1; j < alive.length; j++) {
        const b = alive[j];
        if (b.team !== a.team) continue; // only separate own fleet
        if (b.orbitTarget !== null) continue;

        const minB = MIN_SEP[b.shipClass] ?? 130;
        const minDist = (minA + minB) * 0.5; // average of both radii

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < minDist * minDist && d2 > 1) {
          const d = Math.sqrt(d2);
          const depth = minDist - d; // how much they overlap
          const force = (depth / minDist) * 0.6; // gentle spring
          const nx = dx / d,
            ny = dy / d;
          // Push both apart (equal & opposite)
          fx += nx * force;
          fy += ny * force;
          b.x -= nx * force * b.speed * dt;
          b.y -= ny * force * b.speed * dt;
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
    const REPAIR_TICK = 2.0; // seconds between heals
    const REPAIR_AMOUNT = 18; // HP healed per tick
    const REPAIR_RANGE = 220; // game units
    const JUG_PULSE_TICK = 4.0; // juggernaut shield pulse interval
    const JUG_PULSE_SHIELD = 12; // shield restored to allies
    const JUG_PULSE_RANGE = 180;

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
    this.state.tacticalOrders = this.state.tacticalOrders.filter((o) => o.id !== id);
  }

  addFleet(name: string, color: string): Fleet {
    const fleet: Fleet = { name, color, shipIds: [], rallyPlanetId: null, order: 'idle', orderTargetPlanetId: null };
    this.state.fleets.set(name, fleet);
    return fleet;
  }

  assignShipsToFleet(fleetName: string, shipIds: number[]) {
    // Remove from any existing fleet first
    for (const [, f] of this.state.fleets) {
      f.shipIds = f.shipIds.filter((id) => !shipIds.includes(id));
    }
    const fleet = this.state.fleets.get(fleetName);
    if (fleet) fleet.shipIds.push(...shipIds);
  }

  private updateTacticalOrders(dt: number) {
    for (const order of this.state.tacticalOrders) {
      if (!order.enabled) continue;
      if (order.cooldownRemaining > 0) {
        order.cooldownRemaining -= dt;
        continue;
      }

      let triggered = false;

      if (order.trigger === 'planet_attacked' && order.triggerPlanetId !== null) {
        // Triggered if enemies are near the watched planet
        const planet = this.state.planets.find((p) => p.id === order.triggerPlanetId);
        if (planet) {
          const enemyCount = [...this.state.ships.values()].filter(
            (s) =>
              !s.dead &&
              s.team !== 1 &&
              s.team !== 0 &&
              Math.sqrt((s.x - planet.x) ** 2 + (s.y - planet.y) ** 2) < planet.captureRadius * 1.5,
          ).length;
          triggered = enemyCount >= 2;
        }
      } else if (order.trigger === 'planet_captured') {
        const planet = this.state.planets.find((p) => p.id === order.triggerPlanetId);
        triggered = !!(planet && planet.owner !== 1 && planet.owner !== 0);
      } else if (order.trigger === 'fleet_below_half' && order.triggerFleetName) {
        const fleet = this.state.fleets.get(order.triggerFleetName);
        if (fleet) {
          const alive = fleet.shipIds.filter((id) => {
            const s = this.state.ships.get(id);
            return s && !s.dead;
          }).length;
          triggered = alive > 0 && alive <= fleet.shipIds.length / 2;
        }
      }

      if (!triggered) continue;
      order.cooldownRemaining = order.cooldown;

      // Execute action
      const fleet = order.fleetName ? this.state.fleets.get(order.fleetName) : null;
      const ships = fleet
        ? fleet.shipIds.map((id) => this.state.ships.get(id)).filter((s): s is SpaceShip => !!(s && !s.dead))
        : [...this.state.ships.values()].filter((s) => !s.dead && s.team === 1);

      if (order.action === 'attack_planet' || order.action === 'defend_planet') {
        const tgt = this.state.planets.find((p) => p.id === order.actionPlanetId);
        if (tgt) {
          for (const s of ships) {
            s.moveTarget = { x: tgt.x + (Math.random() - 0.5) * 200, y: tgt.y + (Math.random() - 0.5) * 200, z: 0 };
            s.isAttackMoving = order.action === 'attack_planet';
          }
        }
      } else if (order.action === 'focus_class' && order.focusClass) {
        // Mark nearby enemies of given class as priority targets for all ships in fleet
        const enemyOfClass = [...this.state.ships.values()].find((s) => !s.dead && s.team !== 1 && s.shipClass === order.focusClass);
        if (enemyOfClass) {
          for (const s of ships) s.targetId = enemyOfClass.id;
        }
      }
    }
  }

  // ── Resource Nodes ─────────────────────────────────────────────
  private generateResourceNodes() {
    type NK = ResourceNode['kind'];
    const kindYield: Record<NK, { credits: number; energy: number; minerals: number }> = {
      home_chunk: { credits: 15, energy: 10, minerals: 20 },
      moon: { credits: 3, energy: 2, minerals: 10 },
      asteroid: { credits: 0, energy: 0, minerals: 15 },
      ice_rock: { credits: 0, energy: 12, minerals: 2 },
      crystal_deposit: { credits: 12, energy: 2, minerals: 0 },
    };
    const kindRadius: Record<NK, number> = { moon: 36, asteroid: 12, ice_rock: 17, crystal_deposit: 11, home_chunk: 18 };
    const kindOrbitSpd: Record<NK, number> = { moon: 0.12, asteroid: 0.42, ice_rock: 0.28, crystal_deposit: 0.52, home_chunk: 0.2 };
    const kindHarvestCD: Record<NK, number> = { moon: 8, asteroid: 5, ice_rock: 5, crystal_deposit: 6, home_chunk: 4 };
    const typeNodes: Record<PlanetType, NK[]> = {
      volcanic: ['asteroid', 'moon', 'asteroid'],
      oceanic: ['ice_rock', 'moon', 'ice_rock'],
      barren: ['asteroid', 'moon', 'asteroid'],
      crystalline: ['crystal_deposit', 'moon', 'crystal_deposit'],
      gas_giant: ['ice_rock', 'moon', 'ice_rock'],
      frozen: ['ice_rock', 'crystal_deposit', 'moon'],
    };
    for (const planet of this.state.planets) {
      const preferred = typeNodes[planet.planetType];
      const baseCount = planet.isStartingPlanet ? 3 : 1 + Math.floor(Math.random() * 2);
      const extraAst = planet.hasAsteroidField ? 3 : 0;
      const total = baseCount + extraAst;
      for (let i = 0; i < total; i++) {
        const kind: NK = i < baseCount ? preferred[i % preferred.length] : 'asteroid';
        const minOrbit = planet.radius * (kind === 'moon' ? 3.0 : 2.0);
        const maxOrbit = planet.radius * (kind === 'moon' ? 4.2 : 3.2);
        const orbitRadius = minOrbit + Math.random() * (maxOrbit - minOrbit);
        const orbitAngle = (i / total) * Math.PI * 2 + Math.random() * 0.4;
        const orbitSpd = kindOrbitSpd[kind] * (0.75 + Math.random() * 0.5) * (i % 2 === 0 ? 1 : -1);
        const node: ResourceNode = {
          id: this.state.nextId++,
          parentPlanetId: planet.id,
          x: planet.x + Math.cos(orbitAngle) * orbitRadius,
          y: planet.y + Math.sin(orbitAngle) * orbitRadius,
          z: 0,
          orbitAngle,
          orbitRadius,
          orbitSpeed: orbitSpd,
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
      const planet = this.state.planets.find((p) => p.id === node.parentPlanetId);
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
          let bestNode: ResourceNode | null = null,
            bestDist = Infinity;
          for (const [, node] of this.state.resourceNodes) {
            if (node.harvestCooldown > 0) continue;
            const planet = this.state.planets.find((p) => p.id === node.parentPlanetId);
            // Harvest from owned planets or uncaptured neutral planets
            if (!planet || (planet.owner !== ship.team && planet.owner !== 0)) continue;
            const d = dist2d(ship, node);
            if (d < bestDist) {
              bestDist = d;
              bestNode = node;
            }
          }
          if (bestNode) {
            ship.workerNodeId = bestNode.id;
            ship.workerState = 'traveling';
            ship.moveTarget = { x: bestNode.x, y: bestNode.y, z: 0 };
          }
          break;
        }
        case 'traveling': {
          if (!ship.workerNodeId) {
            ship.workerState = 'idle';
            break;
          }
          const node = this.state.resourceNodes.get(ship.workerNodeId);
          if (!node || node.harvestCooldown > 0) {
            ship.workerState = 'idle';
            ship.moveTarget = null;
            break;
          }
          // Abort if the node's planet was captured by an enemy
          const tPlanet = this.state.planets.find((p) => p.id === node.parentPlanetId);
          if (tPlanet && tPlanet.owner !== ship.team && tPlanet.owner !== 0) {
            ship.workerState = 'idle';
            ship.moveTarget = null;
            ship.workerNodeId = null;
            break;
          }
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
          if (!ship.workerNodeId) {
            ship.workerState = 'idle';
            break;
          }
          const node = this.state.resourceNodes.get(ship.workerNodeId);
          if (!node) {
            ship.workerState = 'idle';
            break;
          }
          // Abort if the node's planet was captured by an enemy
          const hPlanet = this.state.planets.find((p) => p.id === node.parentPlanetId);
          if (hPlanet && hPlanet.owner !== ship.team && hPlanet.owner !== 0) {
            ship.workerState = 'idle';
            ship.holdPosition = false;
            ship.moveTarget = null;
            ship.workerNodeId = null;
            break;
          }
          // Worker stays at harvest position — laser beam connects to node
          // Face towards the node
          ship.facing = Math.atan2(node.y - ship.y, node.x - ship.x);
          ship.workerHarvestTimer = (ship.workerHarvestTimer ?? 0) + dt;
          if ((ship.workerHarvestTimer ?? 0) >= HARVEST_TIME) {
            ship.workerCargoType =
              node.kind === 'asteroid' || node.kind === 'moon' ? 'minerals' : node.kind === 'ice_rock' ? 'energy' : 'credits';
            ship.workerCargo = 1;
            node.harvestCooldown = node.maxHarvestCooldown;
            ship.workerState = 'returning';
            ship.holdPosition = false;
            // Head to home station (or nearest friendly)
            let target: { x: number; y: number } | null = null;
            if (ship.stationId) {
              const st = this.state.stations.get(ship.stationId);
              if (st && !st.dead) target = st;
            }
            if (!target) {
              let nd = Infinity;
              for (const [, st] of this.state.stations) {
                if (st.dead || st.team !== ship.team) continue;
                const d = dist2d(ship, st);
                if (d < nd) {
                  nd = d;
                  target = st;
                  ship.stationId = st.id;
                }
              }
            }
            if (target) ship.moveTarget = { x: target.x, y: target.y, z: 0 };
          }
          break;
        }
        case 'returning': {
          if (!ship.stationId) {
            ship.workerState = 'idle';
            break;
          }
          const st = this.state.stations.get(ship.stationId);
          if (!st || st.dead) {
            ship.stationId = null;
            ship.workerState = 'idle';
            break;
          }
          if (dist2d(ship, st) < DEPOSIT_RANGE) {
            const res = this.state.resources[ship.team];
            if (res && ship.workerNodeId) {
              const node = this.state.resourceNodes.get(ship.workerNodeId);
              if (node) {
                res.credits += node.yield.credits;
                res.energy += node.yield.energy;
                res.minerals += node.yield.minerals;
              }
            }
            ship.workerCargo = 0;
            ship.workerNodeId = null;
            ship.workerState = 'idle';
            ship.moveTarget = null;
          }
          break;
        }
      }
    }
  }

  private cleanupDead() {
    for (const [id, s] of this.state.ships) {
      if (s.dead && s.animTimer > 3) this.state.ships.delete(id);
    }
  }

  private findNearestEnemy(ship: SpaceShip): SpaceShip | null {
    let best: SpaceShip | null = null,
      bd = Infinity;
    for (const [, o] of this.state.ships) {
      if (o.dead || o.team === ship.team) continue;
      if (ship.team !== 0 && o.team === 0 && !o.orbitTarget) continue;
      const d = dist2d(ship, o);
      if (d < bd) {
        bd = d;
        best = o;
      }
    }
    return best;
  }
}
