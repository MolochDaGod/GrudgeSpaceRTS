import * as THREE from 'three';

export interface SpacePrefab {
  modelPath: string;
  mtlPath?: string;
  texturePath?: string;
  format: 'obj' | 'fbx' | 'glb';
  scale: number;
  offset: THREE.Vector3;
  rotation?: THREE.Euler;
  enginePoints?: THREE.Vector3[]; // where engine glow sprites go
  weaponPoints?: THREE.Vector3[]; // where projectiles spawn
  hasParts?: boolean; // capital ships with destructible parts
  partPaths?: string[];
}

const S = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const E = (x: number, y: number, z: number) => new THREE.Euler(x, y, z);

// ── Fighter / Interceptor Ships (OBJ+MTL) ──────────────────────
export const SHIP_PREFABS: Record<string, SpacePrefab> = {
  micro_recon: {
    modelPath: '/assets/space/models/ships/MicroRecon/MicroRecon.obj',
    mtlPath: '/assets/space/models/ships/MicroRecon/MicroRecon.mtl',
    texturePath: '/assets/space/models/ships/MicroRecon/MicroRecon.png',
    format: 'obj',
    scale: 0.06,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.5)],
    weaponPoints: [S(0, 0, 0.8)],
  },
  red_fighter: {
    modelPath: '/assets/space/models/ships/RedFighter/RedFighter.obj',
    mtlPath: '/assets/space/models/ships/RedFighter/RedFighter.mtl',
    texturePath: '/assets/space/models/ships/RedFighter/RedFighter.png',
    format: 'obj',
    scale: 0.045,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.3, 0, -0.6), S(0.3, 0, -0.6)],
    weaponPoints: [S(-0.4, 0, 0.5), S(0.4, 0, 0.5)],
  },
  galactix_racer: {
    modelPath: '/assets/space/models/ships/GalactixRacer/GalactixRacer.obj',
    mtlPath: '/assets/space/models/ships/GalactixRacer/GalactixRacer.mtl',
    texturePath: '/assets/space/models/ships/GalactixRacer/GalactixRacer.png',
    format: 'obj',
    scale: 0.06,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.8)],
    weaponPoints: [S(0, 0, 1.0)],
  },
  dual_striker: {
    modelPath: '/assets/space/models/ships/DualStriker/DualStriker.obj',
    mtlPath: '/assets/space/models/ships/DualStriker/DualStriker.mtl',
    texturePath: '/assets/space/models/ships/DualStriker/DualStriker.png',
    format: 'obj',
    scale: 0.036,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.4, 0, -0.7), S(0.4, 0, -0.7)],
    weaponPoints: [S(-0.6, 0, 0.4), S(0.6, 0, 0.4)],
  },
  camo_stellar_jet: {
    modelPath: '/assets/space/models/ships/CamoStellarJet/CamoStellarJet.obj',
    mtlPath: '/assets/space/models/ships/CamoStellarJet/CamoStellarJet.mtl',
    texturePath: '/assets/space/models/ships/CamoStellarJet/CamoStellarJet.png',
    format: 'obj',
    scale: 0.06,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.7)],
    weaponPoints: [S(0, 0, 0.9)],
  },
  meteor_slicer: {
    modelPath: '/assets/space/models/ships/MeteorSlicer/MeteorSlicer.obj',
    mtlPath: '/assets/space/models/ships/MeteorSlicer/MeteorSlicer.mtl',
    texturePath: '/assets/space/models/ships/MeteorSlicer/MeteorSlicer.png',
    format: 'obj',
    scale: 0.054,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.6)],
    weaponPoints: [S(0, 0, 0.8)],
  },
  infrared_furtive: {
    modelPath: '/assets/space/models/ships/InfraredFurtive/InfraredFurtive.obj',
    mtlPath: '/assets/space/models/ships/InfraredFurtive/InfraredFurtive.mtl',
    texturePath: '/assets/space/models/ships/InfraredFurtive/InfraredFurtive.png',
    format: 'obj',
    scale: 0.075,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.5)],
    weaponPoints: [S(0, 0, 0.7)],
  },
  ultraviolet_intruder: {
    modelPath: '/assets/space/models/ships/UltravioletIntruder/UltravioletIntruder.obj',
    mtlPath: '/assets/space/models/ships/UltravioletIntruder/UltravioletIntruder.mtl',
    texturePath: '/assets/space/models/ships/UltravioletIntruder/UltravioletIntruder.png',
    format: 'obj',
    scale: 0.042,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.3, 0, -0.8), S(0.3, 0, -0.8)],
    weaponPoints: [S(0, -0.2, 0.6)],
  },
  warship: {
    modelPath: '/assets/space/models/ships/Warship/Warship.obj',
    mtlPath: '/assets/space/models/ships/Warship/Warship.mtl',
    texturePath: '/assets/space/models/ships/Warship/Warship.png',
    format: 'obj',
    scale: 0.045,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -1), S(0, 0, -1), S(0.5, 0, -1)],
    weaponPoints: [S(-0.4, 0.1, 0.6), S(0.4, 0.1, 0.6)],
  },
  star_marine_trooper: {
    modelPath: '/assets/space/models/ships/StarMarineTrooper/StarMarineTrooper.obj',
    mtlPath: '/assets/space/models/ships/StarMarineTrooper/StarMarineTrooper.mtl',
    texturePath: '/assets/space/models/ships/StarMarineTrooper/StarMarineTrooper.png',
    format: 'obj',
    scale: 0.042,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.4, 0, -0.8), S(0.4, 0, -0.8)],
    weaponPoints: [S(0, 0, 0.5)],
  },
  interstellar_runner: {
    modelPath: '/assets/space/models/ships/InterstellarRunner/InterstellarRunner.obj',
    mtlPath: '/assets/space/models/ships/InterstellarRunner/InterstellarRunner.mtl',
    texturePath: '/assets/space/models/ships/InterstellarRunner/InterstellarRunner.png',
    format: 'obj',
    scale: 0.075,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.7)],
    weaponPoints: [S(0, 0, 0.6)],
  },
  transtellar: {
    modelPath: '/assets/space/models/ships/Transtellar/Transtellar.obj',
    mtlPath: '/assets/space/models/ships/Transtellar/Transtellar.mtl',
    texturePath: '/assets/space/models/ships/Transtellar/Transtellar.png',
    format: 'obj',
    scale: 0.06,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.6)],
    weaponPoints: [S(0, 0, 0.5)],
  },
  pyramid_ship: {
    modelPath: '/assets/space/models/ships/PyramidShip/PyramidShips.obj',
    mtlPath: '/assets/space/models/ships/PyramidShip/PyramidShips.mtl',
    texturePath: '/assets/space/models/ships/PyramidShip/PyramidShips.png',
    format: 'obj',
    scale: 0.054,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.3, 0, -0.8), S(0.3, 0, -0.8)],
    weaponPoints: [S(0, 0.1, 0.7)],
  },
  // ── Worker ships — tiny vehicle models ───────────────────────────
  mining_drone: {
    modelPath: '/assets/space/models/vehicles/Tracer/Tracer-0-Tracer.obj',
    mtlPath: '/assets/space/models/vehicles/Tracer/Tracer-0-Tracer.mtl',
    format: 'obj',
    scale: 0.0054,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.3)],
    weaponPoints: [],
  },
  energy_skimmer: {
    modelPath: '/assets/space/models/vehicles/Scooter/Scooter-0-Scooter.obj',
    mtlPath: '/assets/space/models/vehicles/Scooter/Scooter-0-Scooter.mtl',
    format: 'obj',
    scale: 0.0054,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.3)],
    weaponPoints: [],
  },
};

// ── Craftpix Battle Fleet (FBX) ───────────────────────────────────────
export const BATTLE_SHIP_PREFABS: Record<string, SpacePrefab> = {
  // Corvettes & Frigates — now with proper texture from craftpix-673467
  cf_corvette_01: {
    modelPath: '/assets/space/models/battle-ships/Corvette_01.fbx',
    texturePath: '/assets/space/models/battle-ships/T_Spase_64.png',
    format: 'fbx',
    scale: 0.03,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.5)],
    weaponPoints: [S(0, 0, 0.6)],
  },
  cf_corvette_02: {
    modelPath: '/assets/space/models/battle-ships/Corvette_02.fbx',
    texturePath: '/assets/space/models/battle-ships/T_Spase_64.png',
    format: 'fbx',
    scale: 0.03,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.5)],
    weaponPoints: [S(0, 0, 0.6)],
  },
  cf_corvette_03: {
    modelPath: '/assets/space/models/battle-ships/Corvette_03.fbx',
    texturePath: '/assets/space/models/battle-ships/T_Spase_64.png',
    format: 'fbx',
    scale: 0.03,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.5)],
    weaponPoints: [S(0, 0, 0.6)],
  },
  cf_corvette_04: {
    modelPath: '/assets/space/models/battle-ships/Corvette_04.fbx',
    texturePath: '/assets/space/models/battle-ships/T_Spase_blue.png',
    format: 'fbx',
    scale: 0.03,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.5)],
    weaponPoints: [S(0, 0, 0.6)],
  },
  cf_corvette_05: {
    modelPath: '/assets/space/models/battle-ships/Corvette_05.fbx',
    texturePath: '/assets/space/models/battle-ships/T_Spase_blue.png',
    format: 'fbx',
    scale: 0.03,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.5)],
    weaponPoints: [S(0, 0, 0.6)],
  },
  cf_frigate_01: {
    modelPath: '/assets/space/models/battle-ships/Frigate_01.fbx',
    texturePath: '/assets/space/models/battle-ships/T_Spase_64.png',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.4, 0, -0.8), S(0.4, 0, -0.8)],
    weaponPoints: [S(0, 0.2, 0.8)],
  },
  cf_frigate_02: {
    modelPath: '/assets/space/models/battle-ships/Frigate_02.fbx',
    texturePath: '/assets/space/models/battle-ships/T_Spase_64.png',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.4, 0, -0.8), S(0.4, 0, -0.8)],
    weaponPoints: [S(0, 0.2, 0.8)],
  },
  cf_frigate_03: {
    modelPath: '/assets/space/models/battle-ships/Frigate_03.fbx',
    texturePath: '/assets/space/models/battle-ships/T_Spase_64.png',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -1), S(0.5, 0, -1)],
    weaponPoints: [S(-0.4, 0.2, 0.9), S(0.4, 0.2, 0.9)],
  },
  cf_frigate_04: {
    modelPath: '/assets/space/models/battle-ships/Frigate_04.fbx',
    texturePath: '/assets/space/models/battle-ships/T_Spase_blue.png',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.9)],
    weaponPoints: [S(0, 0.2, 0.8)],
  },
  cf_frigate_05: {
    modelPath: '/assets/space/models/battle-ships/Frigate_05.fbx',
    texturePath: '/assets/space/models/battle-ships/T_Spase_blue.png',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -0.9), S(0.5, 0, -0.9)],
    weaponPoints: [S(0, 0.2, 1.0)],
  },
  cf_light_cruiser_01: {
    modelPath: '/assets/space/models/battle-ships/Light cruiser_01.fbx',
    format: 'fbx',
    scale: 0.024,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.6, 0, -1.5), S(0, 0, -1.5), S(0.6, 0, -1.5)],
    weaponPoints: [S(-0.5, 0.2, 1), S(0.5, 0.2, 1)],
  },
  cf_light_cruiser_02: {
    modelPath: '/assets/space/models/battle-ships/Light cruiser_02.fbx',
    format: 'fbx',
    scale: 0.024,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.6, 0, -1.5), S(0, 0, -1.5), S(0.6, 0, -1.5)],
    weaponPoints: [S(-0.5, 0.2, 1), S(0.5, 0.2, 1)],
  },
  cf_light_cruiser_03: {
    modelPath: '/assets/space/models/battle-ships/Light cruiser_03.fbx',
    format: 'fbx',
    scale: 0.024,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.6, 0, -1.5), S(0.6, 0, -1.5)],
    weaponPoints: [S(0, 0.2, 1.2)],
  },
  cf_light_cruiser_04: {
    modelPath: '/assets/space/models/battle-ships/Light cruiser_04.fbx',
    format: 'fbx',
    scale: 0.024,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.6, 0, -1.5), S(0.6, 0, -1.5)],
    weaponPoints: [S(-0.5, 0.2, 1), S(0.5, 0.2, 1)],
  },
  cf_light_cruiser_05: {
    modelPath: '/assets/space/models/battle-ships/Light cruiser_05.fbx',
    format: 'fbx',
    scale: 0.024,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.6, 0, -1.5), S(0, 0, -1.5), S(0.6, 0, -1.5)],
    weaponPoints: [S(-0.5, 0.2, 1), S(0.5, 0.2, 1)],
  },
  cf_destroyer_01: {
    modelPath: '/assets/space/models/battle-ships/Destroyer_01.fbx',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -1.4), S(0.5, 0, -1.4)],
    weaponPoints: [S(0, 0.2, 1.1)],
  },
  cf_destroyer_02: {
    modelPath: '/assets/space/models/battle-ships/Destroyer_02.fbx',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -1.4), S(0.5, 0, -1.4)],
    weaponPoints: [S(0, 0.2, 1.1)],
  },
  cf_destroyer_03: {
    modelPath: '/assets/space/models/battle-ships/Destroyer_03.fbx',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -1.4), S(0.5, 0, -1.4)],
    weaponPoints: [S(0, 0.2, 1.1)],
  },
  cf_destroyer_04: {
    modelPath: '/assets/space/models/battle-ships/Destroyer_04.fbx',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -1.4), S(0.5, 0, -1.4)],
    weaponPoints: [S(0, 0.2, 1.2)],
  },
  cf_destroyer_05: {
    modelPath: '/assets/space/models/battle-ships/Destroyer_05.fbx',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -1.4), S(0, 0, -1.4), S(0.5, 0, -1.4)],
    weaponPoints: [S(-0.4, 0.2, 1), S(0.4, 0.2, 1)],
  },
  boss_ship_01: {
    modelPath: '/assets/space/models/new-ships/Ship_Boos_01_Hull.fbx',
    format: 'fbx',
    scale: 0.045,
    offset: S(0, 0, 0),
    enginePoints: [S(-1, 0, -2), S(0, 0, -2), S(1, 0, -2)],
    weaponPoints: [S(-0.8, 0.3, 1.5), S(0, 0.5, 2), S(0.8, 0.3, 1.5)],
  },
  boss_ship_02: {
    modelPath: '/assets/space/models/new-ships/Ship_Boss_02_Hull.fbx',
    format: 'fbx',
    scale: 0.045,
    offset: S(0, 0, 0),
    enginePoints: [S(-1.2, 0, -2.2), S(0, 0, -2.2), S(1.2, 0, -2.2)],
    weaponPoints: [S(-1, 0.3, 1.8), S(0, 0.5, 2.2), S(1, 0.3, 1.8)],
  },
};

// ── Planet Defense Turrets (FBX) ─────────────────────────────────
export const TURRET_PREFABS: Record<string, SpacePrefab> = {
  laser_turret: {
    modelPath: '/assets/space/models/turrets/_Turel_01.fbx',
    format: 'fbx',
    scale: 0.06,
    offset: S(0, 0, 0),
    weaponPoints: [S(0, 0.5, 0)],
  },
  missile_turret: {
    modelPath: '/assets/space/models/turrets/_Turel_02.fbx',
    format: 'fbx',
    scale: 0.054,
    offset: S(0, 0, 0),
    weaponPoints: [S(0, 0.5, 0)],
  },
  railgun_turret: {
    modelPath: '/assets/space/models/turrets/_Turel_03.fbx',
    format: 'fbx',
    scale: 0.066,
    offset: S(0, 0, 0),
    weaponPoints: [S(0, 0.6, 0)],
  },
};

// ── Capital Ships (FBX) ─────────────────────────────────────────────
export const CAPITAL_PREFABS: Record<string, SpacePrefab> = {
  battleship: {
    modelPath: '/assets/space/models/capital/Battleships/Battleship.fbx',
    texturePath: '/assets/space/models/capital/Battleships/Battleship.png',
    format: 'fbx',
    scale: 0.024,
    offset: S(0, 0, 0),
    hasParts: true,
    partPaths: [
      '/assets/space/models/capital/Battleships/BattleshipParts/BattleshipPart1.fbx',
      '/assets/space/models/capital/Battleships/BattleshipParts/BattleshipPart2.fbx',
      '/assets/space/models/capital/Battleships/BattleshipParts/BattleshipPart3.fbx',
      '/assets/space/models/capital/Battleships/BattleshipParts/BattleshipPart4.fbx',
    ],
    enginePoints: [S(-1, 0, -2), S(0, 0, -2), S(1, 0, -2)],
    weaponPoints: [S(-0.8, 0.3, 1), S(0.8, 0.3, 1), S(0, 0.5, 1.5)],
  },
  destroyer: {
    modelPath: '/assets/space/models/capital/Destroyer/Destroyer.fbx',
    texturePath: '/assets/space/models/capital/Destroyer/Destroyer.png',
    format: 'fbx',
    scale: 0.03,
    offset: S(0, 0, 0),
    hasParts: true,
    partPaths: [
      '/assets/space/models/capital/Destroyer/DestroyerParts/DestroyerPart1.fbx',
      '/assets/space/models/capital/Destroyer/DestroyerParts/DestroyerPart2.fbx',
    ],
    enginePoints: [S(-0.5, 0, -1.5), S(0.5, 0, -1.5)],
    weaponPoints: [S(0, 0.2, 1.2)],
  },
  cruiser: {
    modelPath: '/assets/space/models/capital/Cruiser/Cruiser.fbx',
    texturePath: '/assets/space/models/capital/Cruiser/Cruiser.png',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    hasParts: true,
    partPaths: [
      '/assets/space/models/capital/Cruiser/CruiserParts/CruiserPart1.fbx',
      '/assets/space/models/capital/Cruiser/CruiserParts/CruiserPart2.fbx',
      '/assets/space/models/capital/Cruiser/CruiserParts/CruiserPart3.fbx',
    ],
    enginePoints: [S(-0.6, 0, -1.8), S(0, 0, -1.8), S(0.6, 0, -1.8)],
    weaponPoints: [S(-0.5, 0.2, 1), S(0.5, 0.2, 1)],
  },
  bomber: {
    modelPath: '/assets/space/models/capital/Bomber/Bomber.fbx',
    texturePath: '/assets/space/models/capital/Bomber/Bomber.png',
    format: 'fbx',
    scale: 0.036,
    offset: S(0, 0, 0),
    hasParts: true,
    partPaths: [
      '/assets/space/models/capital/Bomber/BomberParts/BomberPart1.fbx',
      '/assets/space/models/capital/Bomber/BomberParts/BomberPart2.fbx',
    ],
    enginePoints: [S(0, 0, -1)],
    weaponPoints: [S(0, -0.3, 0.8)],
  },
};

// ── Stations & Structures (FBX) ─────────────────────────────────
export const STATION_PREFABS: Record<string, SpacePrefab> = {
  station: {
    modelPath: '/assets/space/models/stations/Station/Station.fbx',
    format: 'fbx',
    scale: 0.045,
    offset: S(0, 0, 0),
  },
  energy_ship: {
    modelPath: '/assets/space/models/stations/EnergyShip/EnergyShip.fbx',
    format: 'fbx',
    scale: 0.03,
    offset: S(0, 0, 0),
  },
  minador: {
    modelPath: '/assets/space/models/stations/Minador/Minador.fbx',
    format: 'fbx',
    scale: 0.024,
    offset: S(0, 0, 0),
  },
};

// ── Enemy Ships (FBX) ───────────────────────────────────────────
export const ENEMY_PREFABS: Record<string, SpacePrefab> = {
  enemy_fighter: {
    modelPath: '/assets/space/models/enemies/Enemies/Fighter/Fighter.fbx',
    format: 'fbx',
    scale: 0.045,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.5)],
    weaponPoints: [S(0, 0, 0.6)],
  },
  enemy_cruiser: {
    modelPath: '/assets/space/models/enemies/Enemies/Enemy Cruiser.fbx',
    format: 'fbx',
    scale: 0.024,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -1.5), S(0.5, 0, -1.5)],
    weaponPoints: [S(0, 0.2, 1)],
  },
  enemy_destroyer: {
    modelPath: '/assets/space/models/enemies/Enemies/Enemy destroyer.fbx',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -1.2)],
    weaponPoints: [S(0, 0.1, 0.8)],
  },
  enemy_huge: {
    modelPath: '/assets/space/models/enemies/Enemies/EnemyHuge.fbx',
    format: 'fbx',
    scale: 0.015,
    offset: S(0, 0, 0),
    enginePoints: [S(-1, 0, -2), S(0, 0, -2), S(1, 0, -2)],
    weaponPoints: [S(-0.8, 0.3, 1.5), S(0.8, 0.3, 1.5)],
  },
  enemy_mega_boss: {
    modelPath: '/assets/space/models/enemies/Enemies/EnemyHuge2.fbx',
    format: 'fbx',
    scale: 0.012,
    offset: S(0, 0, 0),
    enginePoints: [S(-1.5, 0, -3), S(-0.5, 0, -3), S(0.5, 0, -3), S(1.5, 0, -3)],
    weaponPoints: [S(-1, 0.5, 2), S(0, 0.5, 2.5), S(1, 0.5, 2)],
  },
};

// ── Voxel Fleet (OBJ) ──────────────────────────────────────────
export const VOXEL_FLEET_PREFABS: Record<string, SpacePrefab> = {};
for (let i = 1; i <= 6; i++) {
  VOXEL_FLEET_PREFABS[`voxel_ship_${i}`] = {
    modelPath: `/assets/space/models/voxel-fleet/Spaceship${i}.obj`,
    mtlPath: `/assets/space/models/voxel-fleet/Spaceship${i}.mtl`,
    format: 'obj',
    scale: 0.009,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -1)],
    weaponPoints: [S(0, 0, 1)],
  };
}

// ── Weapons (GLB turrets) ────────────────────────────────────────
export const WEAPON_PREFABS: Record<string, SpacePrefab> = {
  pistol_turret: {
    modelPath: '/assets/space/models/weapons/Turret Gun.glb',
    format: 'glb',
    scale: 0.15,
    offset: S(0, 0, 0),
  },
  rifle_cannon: {
    modelPath: '/assets/space/models/weapons/Gun Cannon Turret.glb',
    format: 'glb',
    scale: 0.12,
    offset: S(0, 0, 0),
  },
  sniper_railgun: {
    modelPath: '/assets/space/models/weapons/Rail Gun Turret.glb',
    format: 'glb',
    scale: 0.12,
    offset: S(0, 0, 0),
  },
  gatling_turret: {
    modelPath: '/assets/space/models/weapons/Gatelng Gun Turret.glb',
    format: 'glb',
    scale: 0.12,
    offset: S(0, 0, 0),
  },
  light_turret: {
    modelPath: '/assets/space/models/weapons/Turret.glb',
    format: 'glb',
    scale: 0.12,
    offset: S(0, 0, 0),
  },
};

// ── Vehicles (OBJ) ──────────────────────────────────────────────
export const VEHICLE_PREFABS: Record<string, SpacePrefab> = {
  tracer: {
    modelPath: '/assets/space/models/vehicles/Tracer/Tracer-0-Tracer.obj',
    mtlPath: '/assets/space/models/vehicles/Tracer/Tracer-0-Tracer.mtl',
    format: 'obj',
    scale: 0.03,
    offset: S(0, 0, 0),
  },
  cross: {
    modelPath: '/assets/space/models/vehicles/Cross/Cross-0-Cross.obj',
    mtlPath: '/assets/space/models/vehicles/Cross/Cross-0-Cross.mtl',
    format: 'obj',
    scale: 0.03,
    offset: S(0, 0, 0),
  },
  scooter: {
    modelPath: '/assets/space/models/vehicles/Scooter/Scooter-0-Scooter.obj',
    mtlPath: '/assets/space/models/vehicles/Scooter/Scooter-0-Scooter.mtl',
    format: 'obj',
    scale: 0.03,
    offset: S(0, 0, 0),
  },
  chopper: {
    modelPath: '/assets/space/models/vehicles/Chopper/Chopper-0-Chopper.obj',
    mtlPath: '/assets/space/models/vehicles/Chopper/Chopper-0-Chopper.mtl',
    format: 'obj',
    scale: 0.024,
    offset: S(0, 0, 0),
  },
  gun_bike: {
    modelPath: '/assets/space/models/vehicles/GunBike/GunBike-0-GunBike.obj',
    mtlPath: '/assets/space/models/vehicles/GunBike/GunBike-0-GunBike.mtl',
    format: 'obj',
    scale: 0.03,
    offset: S(0, 0, 0),
  },
};

// ── GLB Effect Models ───────────────────────────────────────────
export const EFFECT_PREFABS: Record<string, SpacePrefab> = {
  fireball: { modelPath: '/assets/space/models/effects/Fireball.glb', format: 'glb', scale: 1.5, offset: S(0, 0, 0) },
  ice_lance: { modelPath: '/assets/space/models/effects/Ice Lance.glb', format: 'glb', scale: 0.9, offset: S(0, 0, 0) },
  ice_lance_2: { modelPath: '/assets/space/models/effects/Ice Lance 2.glb', format: 'glb', scale: 0.9, offset: S(0, 0, 0) },
  ice_lance_3: { modelPath: '/assets/space/models/effects/Ice Lance 3.glb', format: 'glb', scale: 0.9, offset: S(0, 0, 0) },
  dark_shield: { modelPath: '/assets/space/models/effects/Dark_Shield.glb', format: 'glb', scale: 1.0, offset: S(0, 0, 0) },
  nature_shield: { modelPath: '/assets/space/models/effects/Nature_Shield.glb', format: 'glb', scale: 1.0, offset: S(0, 0, 0) },
  crystal: { modelPath: '/assets/space/models/effects/Crystal.glb', format: 'glb', scale: 1.5, offset: S(0, 0, 0) },
  distortion: { modelPath: '/assets/space/models/effects/Distortion.glb', format: 'glb', scale: 1.0, offset: S(0, 0, 0) },
  sword_effect: { modelPath: '/assets/space/models/effects/Sword.glb', format: 'glb', scale: 1.2, offset: S(0, 0, 0) },
  hammer: { modelPath: '/assets/space/models/effects/Hammer.glb', format: 'glb', scale: 1.2, offset: S(0, 0, 0) },
  skull: { modelPath: '/assets/space/models/effects/Skull.glb', format: 'glb', scale: 1.5, offset: S(0, 0, 0) },
  rock: { modelPath: '/assets/space/models/effects/Rock.glb', format: 'glb', scale: 1.0, offset: S(0, 0, 0) },
  rock_icicle: { modelPath: '/assets/space/models/effects/Rock Icicle.glb', format: 'glb', scale: 2.4, offset: S(0, 0, 0) },
  potion: { modelPath: '/assets/space/models/effects/Potion.glb', format: 'glb', scale: 1.2, offset: S(0, 0, 0) },
};

// ── Sprite Sheet Definitions ────────────────────────────────────
export const EXPLOSION_SPRITES: Record<string, { path: string; frames: number; cols: number; rows: number }> = {
  'explosion-1-a': { path: '/assets/space/sprites/explosions/explosion-1-a.png', frames: 8, cols: 8, rows: 1 },
  'explosion-1-b': { path: '/assets/space/sprites/explosions/explosion-1-b.png', frames: 8, cols: 4, rows: 2 },
  'explosion-1-c': { path: '/assets/space/sprites/explosions/explosion-1-c.png', frames: 10, cols: 5, rows: 2 },
  'explosion-1-d': { path: '/assets/space/sprites/explosions/explosion-1-d.png', frames: 12, cols: 4, rows: 3 },
  'explosion-1-e': { path: '/assets/space/sprites/explosions/explosion-1-e.png', frames: 22, cols: 6, rows: 4 },
  'explosion-1-f': { path: '/assets/space/sprites/explosions/explosion-1-f.png', frames: 8, cols: 4, rows: 2 },
  'explosion-1-g': { path: '/assets/space/sprites/explosions/explosion-1-g.png', frames: 7, cols: 4, rows: 2 },
  'explosion-b': { path: '/assets/space/sprites/explosions/explosion-b.png', frames: 12, cols: 4, rows: 3 },
};

export const SHOOTING_SPRITES: Record<string, { path: string; frames: number; cols: number; rows: number }> = {
  bolt: { path: '/assets/space/sprites/shooting/bolt.png', frames: 4, cols: 4, rows: 1 },
  charged: { path: '/assets/space/sprites/shooting/charged.png', frames: 6, cols: 6, rows: 1 },
  crossed: { path: '/assets/space/sprites/shooting/crossed.png', frames: 6, cols: 6, rows: 1 },
  pulse: { path: '/assets/space/sprites/shooting/pulse.png', frames: 4, cols: 4, rows: 1 },
  spark: { path: '/assets/space/sprites/shooting/spark.png', frames: 5, cols: 5, rows: 1 },
  waveform: { path: '/assets/space/sprites/shooting/waveform.png', frames: 4, cols: 4, rows: 1 },
};

export const HIT_SPRITES: Record<string, { path: string; frames: number; cols: number; rows: number }> = {
  'hits-1': { path: '/assets/space/sprites/hits/hits-1.png', frames: 5, cols: 5, rows: 1 },
  'hits-2': { path: '/assets/space/sprites/hits/hits-2.png', frames: 7, cols: 4, rows: 2 },
  'hits-3': { path: '/assets/space/sprites/hits/hits-3.png', frames: 5, cols: 5, rows: 1 },
  'hits-4': { path: '/assets/space/sprites/hits/hits-4.png', frames: 7, cols: 4, rows: 2 },
  'hits-5': { path: '/assets/space/sprites/hits/hits-5.png', frames: 7, cols: 4, rows: 2 },
  'hits-6': { path: '/assets/space/sprites/hits/hits-6.png', frames: 7, cols: 4, rows: 2 },
};

// ── Bomb Effect Sprite Strips (4 tiers × 3 variations) ──────────
const BOMB = '/assets/space/ui/bombs/3 Effects';
export const BOMB_SPRITES: Record<string, { path: string; frames: number; cols: number; rows: number }> = {
  'bomb-tiny': { path: `${BOMB}/1 Tiny/1.png`, frames: 8, cols: 8, rows: 1 },
  'bomb-tiny-2': { path: `${BOMB}/1 Tiny/2.png`, frames: 8, cols: 8, rows: 1 },
  'bomb-tiny-3': { path: `${BOMB}/1 Tiny/3.png`, frames: 10, cols: 10, rows: 1 },
  'bomb-low': { path: `${BOMB}/2 Low/1.png`, frames: 8, cols: 8, rows: 1 },
  'bomb-low-2': { path: `${BOMB}/2 Low/2.png`, frames: 8, cols: 8, rows: 1 },
  'bomb-low-3': { path: `${BOMB}/2 Low/3.png`, frames: 10, cols: 10, rows: 1 },
  'bomb-mid': { path: `${BOMB}/3 Middle/1.png`, frames: 8, cols: 8, rows: 1 },
  'bomb-mid-2': { path: `${BOMB}/3 Middle/2.png`, frames: 8, cols: 8, rows: 1 },
  'bomb-mid-3': { path: `${BOMB}/3 Middle/3.png`, frames: 10, cols: 10, rows: 1 },
  'bomb-high': { path: `${BOMB}/4 High/1.png`, frames: 8, cols: 8, rows: 1 },
  'bomb-high-2': { path: `${BOMB}/4 High/2.png`, frames: 8, cols: 8, rows: 1 },
  'bomb-high-3': { path: `${BOMB}/4 High/3.png`, frames: 10, cols: 10, rows: 1 },
};

// ── Background Layers ───────────────────────────────────────────
export const BACKGROUND_LAYERS = {
  blue: {
    back: '/assets/space/backgrounds/blue-back.png',
    stars: '/assets/space/backgrounds/blue-stars.png',
    withStars: '/assets/space/backgrounds/blue-with-stars.png',
    asteroid1: '/assets/space/backgrounds/asteroid-1.png',
    asteroid2: '/assets/space/backgrounds/asteroid-2.png',
    planetBig: '/assets/space/backgrounds/prop-planet-big.png',
    planetSmall: '/assets/space/backgrounds/prop-planet-small.png',
  },
  classic: {
    background: '/assets/space/backgrounds/parallax-space-backgound.png',
    bigPlanet: '/assets/space/backgrounds/parallax-space-big-planet.png',
    farPlanets: '/assets/space/backgrounds/parallax-space-far-planets.png',
    ringPlanet: '/assets/space/backgrounds/parallax-space-ring-planet.png',
    stars: '/assets/space/backgrounds/parallax-space-stars.png',
  },
};

// ── UI Asset Paths ──────────────────────────────────────────────
export const UI_ASSETS = {
  hud: '/assets/space/ui/UIbASE.png',
  minimap: '/assets/space/ui/Minimapa.png',
  button: '/assets/space/ui/Buton.png',
  resourceSlot: '/assets/space/ui/ResourceSlot.png',
  killCounter: '/assets/space/ui/ContadorEnemigos oleda.png',
  enemyDot: '/assets/space/ui/EnemigosMiniMapa.png',
  playerDot: '/assets/space/ui/PlayerMinimapa.png',
  stationIcon: '/assets/space/ui/StationMinimapa.png',
};

// ── Audio ────────────────────────────────────────────────────────
const A = '/assets/space/audio';
export const AUDIO_ASSETS = {
  // Music (MP3, loopable)
  music: {
    battle: `${A}/music/battle.mp3`,
    menu: `${A}/music/menu.mp3`,
    main: `${A}/music/main.mp3`,
  },
  // SFX (WAV, short clips)
  sfx: {
    laser: `${A}/sfx/laser.wav`,
    heavy_shot: `${A}/sfx/heavy_shot.wav`,
    missile_shot: `${A}/sfx/missile_shot.wav`,
    death_small: `${A}/sfx/death_small.wav`,
    death_large: `${A}/sfx/death_large.wav`,
    capture: `${A}/sfx/capture.wav`,
    harvest: `${A}/sfx/harvest.wav`,
    build_complete: `${A}/sfx/build_complete.wav`,
    hero_built: `${A}/sfx/hero_built.wav`,
    commander: `${A}/sfx/commander.wav`,
    ui_click: `${A}/sfx/ui_click.wav`,
    upgrade: `${A}/sfx/upgrade.wav`,
    alert: `${A}/sfx/alert.wav`,
    weapon_fire: `${A}/warped-shooting-fx.mp3`,
  },
};

// ── Helper: get all prefabs for a ship type ─────────────────────
export function getShipPrefab(shipType: string): SpacePrefab | null {
  return (
    SHIP_PREFABS[shipType] ??
    CAPITAL_PREFABS[shipType] ??
    BATTLE_SHIP_PREFABS[shipType] ??
    ENEMY_PREFABS[shipType] ??
    VOXEL_FLEET_PREFABS[shipType] ??
    null
  );
}
