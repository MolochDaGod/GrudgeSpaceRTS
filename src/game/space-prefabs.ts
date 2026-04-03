import * as THREE from 'three';

export interface SpacePrefab {
  modelPath: string;
  mtlPath?: string;
  texturePath?: string;
  format: 'obj' | 'fbx' | 'glb' | 'gltf';
  scale: number;
  offset: THREE.Vector3;
  rotation?: THREE.Euler;
  // Rigging convention (best-practice):
  // - +Z = nose/front
  // - -Z = tail/rear boosters
  // - +X = starboard/right wing
  // - -X = port/left wing
  // - +Y = up
  // Keep pivot near the ship's center-of-mass for stable turns/rolls.
  // Engine and weapon points follow this local model space.
  enginePoints?: THREE.Vector3[]; // rear booster / exhaust anchors
  weaponPoints?: THREE.Vector3[]; // nose / side hardpoint muzzle anchors
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
    texturePath: '/assets/space/models/battle-ships/Corvette_01.png',
    format: 'fbx',
    scale: 0.03,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.5)],
    weaponPoints: [S(0, 0, 0.6)],
  },
  cf_corvette_02: {
    modelPath: '/assets/space/models/battle-ships/Corvette_02.fbx',
    texturePath: '/assets/space/models/battle-ships/Corvette_02.png',
    format: 'fbx',
    scale: 0.03,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.5)],
    weaponPoints: [S(0, 0, 0.6)],
  },
  cf_corvette_03: {
    modelPath: '/assets/space/models/battle-ships/Corvette_03.fbx',
    texturePath: '/assets/space/models/battle-ships/Corvette_03.png',
    format: 'fbx',
    scale: 0.03,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.5)],
    weaponPoints: [S(0, 0, 0.6)],
  },
  cf_corvette_04: {
    modelPath: '/assets/space/models/battle-ships/Corvette_04.fbx',
    texturePath: '/assets/space/models/battle-ships/Corvette_04.png',
    format: 'fbx',
    scale: 0.03,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.5)],
    weaponPoints: [S(0, 0, 0.6)],
  },
  cf_corvette_05: {
    modelPath: '/assets/space/models/battle-ships/Corvette_05.fbx',
    texturePath: '/assets/space/models/battle-ships/Corvette_05.png',
    format: 'fbx',
    scale: 0.03,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.5)],
    weaponPoints: [S(0, 0, 0.6)],
  },
  cf_frigate_01: {
    modelPath: '/assets/space/models/battle-ships/Frigate_01.fbx',
    texturePath: '/assets/space/models/battle-ships/Frigate_01.png',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.4, 0, -0.8), S(0.4, 0, -0.8)],
    weaponPoints: [S(0, 0.2, 0.8)],
  },
  cf_frigate_02: {
    modelPath: '/assets/space/models/battle-ships/Frigate_02.fbx',
    texturePath: '/assets/space/models/battle-ships/Frigate_02.png',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.4, 0, -0.8), S(0.4, 0, -0.8)],
    weaponPoints: [S(0, 0.2, 0.8)],
  },
  cf_frigate_03: {
    modelPath: '/assets/space/models/battle-ships/Frigate_03.fbx',
    texturePath: '/assets/space/models/battle-ships/Frigate_03.png',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -1), S(0.5, 0, -1)],
    weaponPoints: [S(-0.4, 0.2, 0.9), S(0.4, 0.2, 0.9)],
  },
  cf_frigate_04: {
    modelPath: '/assets/space/models/battle-ships/Frigate_04.fbx',
    texturePath: '/assets/space/models/battle-ships/Frigate_04.png',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.9)],
    weaponPoints: [S(0, 0.2, 0.8)],
  },
  cf_frigate_05: {
    modelPath: '/assets/space/models/battle-ships/Frigate_05.fbx',
    texturePath: '/assets/space/models/battle-ships/Frigate_05.png',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -0.9), S(0.5, 0, -0.9)],
    weaponPoints: [S(0, 0.2, 1.0)],
  },
  cf_light_cruiser_01: {
    modelPath: '/assets/space/models/battle-ships/Light cruiser_01.fbx',
    texturePath: '/assets/space/models/battle-ships/Light cruiser_01.png',
    format: 'fbx',
    scale: 0.024,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.6, 0, -1.5), S(0, 0, -1.5), S(0.6, 0, -1.5)],
    weaponPoints: [S(-0.5, 0.2, 1), S(0.5, 0.2, 1)],
  },
  cf_light_cruiser_02: {
    modelPath: '/assets/space/models/battle-ships/Light cruiser_02.fbx',
    texturePath: '/assets/space/models/battle-ships/Light cruiser_02.png',
    format: 'fbx',
    scale: 0.024,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.6, 0, -1.5), S(0, 0, -1.5), S(0.6, 0, -1.5)],
    weaponPoints: [S(-0.5, 0.2, 1), S(0.5, 0.2, 1)],
  },
  cf_light_cruiser_03: {
    modelPath: '/assets/space/models/battle-ships/Light cruiser_03.fbx',
    texturePath: '/assets/space/models/battle-ships/Light cruiser_03.png',
    format: 'fbx',
    scale: 0.024,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.6, 0, -1.5), S(0.6, 0, -1.5)],
    weaponPoints: [S(0, 0.2, 1.2)],
  },
  cf_light_cruiser_04: {
    modelPath: '/assets/space/models/battle-ships/Light cruiser_04.fbx',
    texturePath: '/assets/space/models/battle-ships/Light cruiser_04.png',
    format: 'fbx',
    scale: 0.024,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.6, 0, -1.5), S(0.6, 0, -1.5)],
    weaponPoints: [S(-0.5, 0.2, 1), S(0.5, 0.2, 1)],
  },
  cf_light_cruiser_05: {
    modelPath: '/assets/space/models/battle-ships/Light cruiser_05.fbx',
    texturePath: '/assets/space/models/battle-ships/Light cruiser_05.png',
    format: 'fbx',
    scale: 0.024,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.6, 0, -1.5), S(0, 0, -1.5), S(0.6, 0, -1.5)],
    weaponPoints: [S(-0.5, 0.2, 1), S(0.5, 0.2, 1)],
  },
  cf_destroyer_01: {
    modelPath: '/assets/space/models/battle-ships/Destroyer_01.fbx',
    texturePath: '/assets/space/models/battle-ships/Destroyer_01.png',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -1.4), S(0.5, 0, -1.4)],
    weaponPoints: [S(0, 0.2, 1.1)],
  },
  cf_destroyer_02: {
    modelPath: '/assets/space/models/battle-ships/Destroyer_02.fbx',
    texturePath: '/assets/space/models/battle-ships/Destroyer_02.png',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -1.4), S(0.5, 0, -1.4)],
    weaponPoints: [S(0, 0.2, 1.1)],
  },
  cf_destroyer_03: {
    modelPath: '/assets/space/models/battle-ships/Destroyer_03.fbx',
    texturePath: '/assets/space/models/battle-ships/Destroyer_03.png',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -1.4), S(0.5, 0, -1.4)],
    weaponPoints: [S(0, 0.2, 1.1)],
  },
  cf_destroyer_04: {
    modelPath: '/assets/space/models/battle-ships/Destroyer_04.fbx',
    texturePath: '/assets/space/models/battle-ships/Destroyer_04.png',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -1.4), S(0.5, 0, -1.4)],
    weaponPoints: [S(0, 0.2, 1.2)],
  },
  cf_destroyer_05: {
    modelPath: '/assets/space/models/battle-ships/Destroyer_05.fbx',
    texturePath: '/assets/space/models/battle-ships/Destroyer_05.png',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -1.4), S(0, 0, -1.4), S(0.5, 0, -1.4)],
    weaponPoints: [S(-0.4, 0.2, 1), S(0.4, 0.2, 1)],
  },
  boss_ship_01: {
    modelPath: '/assets/space/models/new-ships/Ship_Boos_01_Hull.fbx',
    texturePath: '/assets/space/models/new-ships/Ship_Boos_01_Hull.png',
    format: 'fbx',
    scale: 0.045,
    offset: S(0, 0, 0),
    enginePoints: [S(-1, 0, -2), S(0, 0, -2), S(1, 0, -2)],
    weaponPoints: [S(-0.8, 0.3, 1.5), S(0, 0.5, 2), S(0.8, 0.3, 1.5)],
  },
  boss_ship_02: {
    modelPath: '/assets/space/models/new-ships/Ship_Boss_02_Hull.fbx',
    texturePath: '/assets/space/models/new-ships/Ship_Boss_02_Hull.png',
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
    texturePath: '/assets/space/models/enemies/Enemies/Fighter/Fighter.png',
    format: 'fbx',
    scale: 0.045,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.5)],
    weaponPoints: [S(0, 0, 0.6)],
  },
  enemy_cruiser: {
    modelPath: '/assets/space/models/enemies/Enemies/Enemy Cruiser.fbx',
    texturePath: '/assets/space/models/enemies/Enemies/Enemy Cruiser.png',
    format: 'fbx',
    scale: 0.024,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -1.5), S(0.5, 0, -1.5)],
    weaponPoints: [S(0, 0.2, 1)],
  },
  enemy_destroyer: {
    modelPath: '/assets/space/models/enemies/Enemies/Enemy destroyer.fbx',
    texturePath: '/assets/space/models/enemies/Enemies/Enemy destroyer.png',
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -1.2)],
    weaponPoints: [S(0, 0.1, 0.8)],
  },
  enemy_huge: {
    modelPath: '/assets/space/models/enemies/Enemies/EnemyHuge.fbx',
    texturePath: '/assets/space/models/enemies/Enemies/EnemyHuge.png',
    format: 'fbx',
    scale: 0.015,
    offset: S(0, 0, 0),
    enginePoints: [S(-1, 0, -2), S(0, 0, -2), S(1, 0, -2)],
    weaponPoints: [S(-0.8, 0.3, 1.5), S(0.8, 0.3, 1.5)],
  },
  enemy_mega_boss: {
    modelPath: '/assets/space/models/enemies/Enemies/EnemyHuge2.fbx',
    texturePath: '/assets/space/models/enemies/Enemies/EnemyHuge2.png',
    format: 'fbx',
    scale: 0.012,
    offset: S(0, 0, 0),
    enginePoints: [S(-1.5, 0, -3), S(-0.5, 0, -3), S(0.5, 0, -3), S(1.5, 0, -3)],
    weaponPoints: [S(-1, 0.5, 2), S(0, 0.5, 2.5), S(1, 0.5, 2)],
  },
};

// ── Forge-Prefab Fleet (FBX/GLB — Sketchfab low-poly packs) ────────────
const FP = '/assets/space/models/forge-prefabs';
export const FORGE_SHIP_PREFABS: Record<string, SpacePrefab> = {
  // Fighters (small, fast ships)
  fp_fighter_01: {
    modelPath: `${FP}/spaceship_1.fbx`,
    format: 'fbx',
    scale: 0.03,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.5)],
    weaponPoints: [S(0, 0, 0.6)],
  },
  fp_fighter_02: {
    modelPath: `${FP}/spaceship_2.fbx`,
    format: 'fbx',
    scale: 0.03,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.3, 0, -0.5), S(0.3, 0, -0.5)],
    weaponPoints: [S(0, 0, 0.7)],
  },
  fp_fighter_03: {
    modelPath: `${FP}/spaceship_3.fbx`,
    format: 'fbx',
    scale: 0.03,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.6)],
    weaponPoints: [S(-0.3, 0, 0.5), S(0.3, 0, 0.5)],
  },
  // Cruisers (medium, balanced)
  fp_cruiser_01: {
    modelPath: `${FP}/spaceship_4.fbx`,
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -1.2), S(0.5, 0, -1.2)],
    weaponPoints: [S(-0.4, 0.2, 0.8), S(0.4, 0.2, 0.8)],
  },
  fp_cruiser_02: {
    modelPath: `${FP}/spaceship_5.fbx`,
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.6, 0, -1.4), S(0, 0, -1.4), S(0.6, 0, -1.4)],
    weaponPoints: [S(-0.5, 0.2, 1.0), S(0.5, 0.2, 1.0)],
  },
  // Frigates (light escort)
  fp_frigate_01: {
    modelPath: `${FP}/spaceship_6.fbx`,
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.4, 0, -0.8), S(0.4, 0, -0.8)],
    weaponPoints: [S(0, 0.2, 0.9)],
  },
  fp_frigate_02: {
    modelPath: `${FP}/spaceship_7.fbx`,
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -0.9), S(0.5, 0, -0.9)],
    weaponPoints: [S(0, 0.2, 1.0)],
  },
  // Destroyers (heavy assault)
  fp_destroyer_01: {
    modelPath: `${FP}/spaceship_8.fbx`,
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -1.4), S(0.5, 0, -1.4)],
    weaponPoints: [S(0, 0.2, 1.2)],
  },
  fp_destroyer_02: {
    modelPath: `${FP}/spaceship_9.fbx`,
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -1.4), S(0, 0, -1.4), S(0.5, 0, -1.4)],
    weaponPoints: [S(-0.4, 0.2, 1.0), S(0.4, 0.2, 1.0)],
  },
  // Capital (battleship class)
  fp_capital_01: {
    modelPath: `${FP}/spaceship_10.fbx`,
    format: 'fbx',
    scale: 0.024,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.8, 0, -2.0), S(0, 0, -2.0), S(0.8, 0, -2.0)],
    weaponPoints: [S(-0.6, 0.3, 1.2), S(0, 0.4, 1.5), S(0.6, 0.3, 1.2)],
  },
  // Heavy ships (GLB)
  fp_heavy_dark: {
    modelPath: `${FP}/heavy_ship_black.glb`,
    format: 'glb',
    scale: 0.024,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.6, 0, -1.5), S(0.6, 0, -1.5)],
    weaponPoints: [S(-0.5, 0.2, 1.0), S(0.5, 0.2, 1.0)],
  },
  fp_heavy_light: {
    modelPath: `${FP}/heavy_ship_white.glb`,
    format: 'glb',
    scale: 0.024,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.6, 0, -1.5), S(0, 0, -1.5), S(0.6, 0, -1.5)],
    weaponPoints: [S(-0.5, 0.2, 1.0), S(0.5, 0.2, 1.0)],
  },
};

// ── Faction Hero Ships (FBX — reuse new-ships hull models) ─────────
const NS = '/assets/space/models/new-ships';
export const FACTION_HERO_PREFABS: Record<string, SpacePrefab> = {
  hero_wisdom_oracle: {
    modelPath: `${NS}/Ship_enemy_04_Hull.fbx`,
    texturePath: `${NS}/Ship_enemy_04_Hull.png`,
    format: 'fbx',
    scale: 0.024,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -1.5), S(0.5, 0, -1.5)],
    weaponPoints: [S(0, 0.2, 1.2)],
  },
  hero_construct_titan: {
    modelPath: `${NS}/Ship_Boos_01_Hull.fbx`,
    texturePath: `${NS}/Ship_Boos_01_Hull.png`,
    format: 'fbx',
    scale: 0.018,
    offset: S(0, 0, 0),
    enginePoints: [S(-1, 0, -2.5), S(0, 0, -2.5), S(1, 0, -2.5)],
    weaponPoints: [S(-0.8, 0.3, 1.5), S(0.8, 0.3, 1.5)],
  },
  hero_void_wraith: {
    modelPath: `${NS}/Ship_enemy_06_Hull.fbx`,
    texturePath: `${NS}/Ship_enemy_06_Hull.png`,
    format: 'fbx',
    scale: 0.03,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.8)],
    weaponPoints: [S(0, 0, 0.9)],
  },
  hero_legion_warlord: {
    modelPath: `${NS}/Ship_enemy_10_Hull.fbx`,
    texturePath: `${NS}/Ship_enemy_10_Hull.png`,
    format: 'fbx',
    scale: 0.021,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.6, 0, -1.8), S(0.6, 0, -1.8)],
    weaponPoints: [S(-0.5, 0.2, 1.0), S(0.5, 0.2, 1.0)],
  },
  // Standard hero ships (use main hulls from new-ships pack)
  vanguard_prime: {
    modelPath: `${NS}/Spaceship_main_01_Hull.fbx`,
    texturePath: `${NS}/Spaceship_main_01_Hull.png`,
    format: 'fbx',
    scale: 0.021,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.8, 0, -2), S(0, 0, -2), S(0.8, 0, -2)],
    weaponPoints: [S(-0.6, 0.2, 1.2), S(0.6, 0.2, 1.2)],
  },
  shadow_reaper: {
    modelPath: `${NS}/Spaceship_main_02_Hull.fbx`,
    texturePath: `${NS}/Spaceship_main_02_Hull.png`,
    format: 'fbx',
    scale: 0.03,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.7)],
    weaponPoints: [S(0, 0, 0.8)],
  },
  iron_bastion: {
    modelPath: `${NS}/Spaceship_main_03_Hull.fbx`,
    texturePath: `${NS}/Spaceship_main_03_Hull.png`,
    format: 'fbx',
    scale: 0.024,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.6, 0, -1.6), S(0, 0, -1.6), S(0.6, 0, -1.6)],
    weaponPoints: [S(-0.5, 0.2, 1.0), S(0.5, 0.2, 1.0)],
  },
  storm_herald: {
    modelPath: `${NS}/Ship_enemy_08_Hull.fbx`,
    texturePath: `${NS}/Ship_enemy_08_Hull.png`,
    format: 'fbx',
    scale: 0.027,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -1.2), S(0.5, 0, -1.2)],
    weaponPoints: [S(0, 0.2, 1.0)],
  },
  plague_mother: {
    modelPath: `${NS}/Ship_enemy_05_Hull.fbx`,
    texturePath: `${NS}/Ship_enemy_05_Hull.png`,
    format: 'fbx',
    scale: 0.021,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.6, 0, -1.5), S(0.6, 0, -1.5)],
    weaponPoints: [S(-0.4, 0.2, 0.8), S(0.4, 0.2, 0.8)],
  },
  custom_hero: {
    modelPath: `${NS}/Ship_Boss_02_Hull.fbx`,
    texturePath: `${NS}/Ship_Boss_02_Hull.png`,
    format: 'fbx',
    scale: 0.018,
    offset: S(0, 0, 0),
    enginePoints: [S(-1, 0, -2.5), S(0, 0, -2.5), S(1, 0, -2.5)],
    weaponPoints: [S(-0.8, 0.3, 1.5), S(0, 0.4, 2), S(0.8, 0.3, 1.5)],
  },
  // Boss ships (also use new-ships hull FBX)
  boss_ship_01: {
    modelPath: `${NS}/Ship_Boos_01_Hull.fbx`,
    texturePath: `${NS}/Ship_Boos_01_Hull.png`,
    format: 'fbx',
    scale: 0.015,
    offset: S(0, 0, 0),
    enginePoints: [S(-1.2, 0, -3), S(0, 0, -3), S(1.2, 0, -3)],
    weaponPoints: [S(-1, 0.4, 2), S(0, 0.5, 2.5), S(1, 0.4, 2)],
  },
  boss_ship_02: {
    modelPath: `${NS}/Ship_Boss_02_Hull.fbx`,
    texturePath: `${NS}/Ship_Boss_02_Hull.png`,
    format: 'fbx',
    scale: 0.012,
    offset: S(0, 0, 0),
    enginePoints: [S(-1.5, 0, -3.5), S(-0.5, 0, -3.5), S(0.5, 0, -3.5), S(1.5, 0, -3.5)],
    weaponPoints: [S(-1, 0.5, 2.5), S(0, 0.6, 3), S(1, 0.5, 2.5)],
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

// ── Bionic Parts Fleet (GLTF — PBR textured modular ships) ──────
// Source: bionic_spaceships_parts.zip — high-quality PBR with
// baseColor, metallicRoughness, and specularF0 textures.
// The scene contains ~35 modular parts arranged as a complete ship.
const BP = '/assets/space/models/bionic-parts';
export const BIONIC_PREFABS: Record<string, SpacePrefab> = {
  bionic_assault: {
    modelPath: `${BP}/scene.gltf`,
    format: 'gltf',
    scale: 0.6,
    offset: S(0, 0, 0),
    // Bionic ship: elongated along X in source, we rotate to +Z forward
    rotation: E(0, Math.PI / 2, 0),
    enginePoints: [S(-0.8, 0, -1.2), S(0.8, 0, -1.2)],
    weaponPoints: [S(-0.4, 0.1, 1.8), S(0.4, 0.1, 1.8), S(0, 0.2, 2.2)],
  },
  bionic_interceptor: {
    modelPath: `${BP}/scene.gltf`,
    format: 'gltf',
    scale: 0.35,
    offset: S(0, 0, 0),
    rotation: E(0, Math.PI / 2, 0),
    enginePoints: [S(0, 0, -0.8)],
    weaponPoints: [S(-0.3, 0, 1.2), S(0.3, 0, 1.2)],
  },
  bionic_dreadnought: {
    modelPath: `${BP}/scene.gltf`,
    format: 'gltf',
    scale: 1.2,
    offset: S(0, 0, 0),
    rotation: E(0, Math.PI / 2, 0),
    enginePoints: [S(-1.2, 0, -2.0), S(0, 0, -2.0), S(1.2, 0, -2.0)],
    weaponPoints: [S(-0.8, 0.3, 2.5), S(0, 0.5, 3.0), S(0.8, 0.3, 2.5)],
  },
  bionic_bomber: {
    modelPath: `${BP}/scene.gltf`,
    format: 'gltf',
    scale: 0.5,
    offset: S(0, 0, 0),
    rotation: E(0, Math.PI / 2, 0),
    enginePoints: [S(-0.5, 0, -1.0), S(0.5, 0, -1.0)],
    weaponPoints: [S(0, -0.3, 1.5)],
  },
  bionic_carrier: {
    modelPath: `${BP}/scene.gltf`,
    format: 'gltf',
    scale: 1.0,
    offset: S(0, 0, 0),
    rotation: E(0, Math.PI / 2, 0),
    enginePoints: [S(-1.0, 0, -1.8), S(0, 0, -1.8), S(1.0, 0, -1.8)],
    weaponPoints: [S(-0.6, 0.2, 2.0), S(0.6, 0.2, 2.0)],
  },
};

// ── Lowpoly Fleet (GLTF — 5 unique stylized ships) ──────────────
// Source: lowpoly_spaceships.zip — 5 distinct ships in one scene.
// Each ship is a separate node group loaded from the same GLTF.
const LP = '/assets/space/models/lowpoly-fleet';
export const LOWPOLY_FLEET_PREFABS: Record<string, SpacePrefab> = {
  lp_striker: {
    modelPath: `${LP}/scene.gltf`,
    format: 'gltf',
    scale: 0.04,
    offset: S(0, 0, 0),
    // Lowpoly ships: Y-up, Z-forward after axis conversion
    enginePoints: [S(-0.4, 0, -0.6), S(0.4, 0, -0.6)],
    weaponPoints: [S(-0.3, 0.1, 0.8), S(0.3, 0.1, 0.8)],
  },
  lp_vanguard: {
    modelPath: `${LP}/scene.gltf`,
    format: 'gltf',
    scale: 0.04,
    offset: S(0, 0, 0),
    enginePoints: [S(0, 0, -0.7)],
    weaponPoints: [S(0, 0, 0.9)],
  },
  lp_corvette: {
    modelPath: `${LP}/scene.gltf`,
    format: 'gltf',
    scale: 0.04,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.5, 0, -0.8), S(0.5, 0, -0.8)],
    weaponPoints: [S(0, 0.2, 1.0)],
  },
  lp_heavy_cruiser: {
    modelPath: `${LP}/scene.gltf`,
    format: 'gltf',
    scale: 0.035,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.6, 0, -1.2), S(0, 0, -1.2), S(0.6, 0, -1.2)],
    weaponPoints: [S(-0.5, 0.2, 1.4), S(0.5, 0.2, 1.4)],
  },
  lp_battlecruiser: {
    modelPath: `${LP}/scene.gltf`,
    format: 'gltf',
    scale: 0.03,
    offset: S(0, 0, 0),
    enginePoints: [S(-0.8, 0, -1.5), S(0, 0, -1.5), S(0.8, 0, -1.5)],
    weaponPoints: [S(-0.6, 0.3, 1.8), S(0, 0.4, 2.0), S(0.6, 0.3, 1.8)],
  },
};

// ── Organic Hero Ship (GLTF — PBR with emissive + normal maps) ──
// Source: spaceship_organic.zip — alien/bio-organic look, 1680 meshes.
// Perfect for faction hero ships with that living-ship aesthetic.
const OH = '/assets/space/models/organic-hero';
export const ORGANIC_HERO_PREFABS: Record<string, SpacePrefab> = {
  organic_hero: {
    modelPath: `${OH}/scene.gltf`,
    format: 'gltf',
    scale: 0.8,
    offset: S(0, 0, 0),
    // Organic ship: tentacle-like legs extend in -Y, main body along X→Z
    rotation: E(Math.PI / 2, 0, 0),
    enginePoints: [S(-0.5, 0, -1.0), S(0.5, 0, -1.0)],
    weaponPoints: [S(-0.3, 0.2, 1.5), S(0.3, 0.2, 1.5), S(0, 0.4, 1.8)],
  },
  organic_dreadnought: {
    modelPath: `${OH}/scene.gltf`,
    format: 'gltf',
    scale: 1.5,
    offset: S(0, 0, 0),
    rotation: E(Math.PI / 2, 0, 0),
    enginePoints: [S(-1.0, 0, -1.8), S(0, 0, -1.8), S(1.0, 0, -1.8)],
    weaponPoints: [S(-0.8, 0.3, 2.5), S(0, 0.5, 3.0), S(0.8, 0.3, 2.5)],
  },
  organic_cruiser: {
    modelPath: `${OH}/scene.gltf`,
    format: 'gltf',
    scale: 0.6,
    offset: S(0, 0, 0),
    rotation: E(Math.PI / 2, 0, 0),
    enginePoints: [S(-0.4, 0, -0.9), S(0.4, 0, -0.9)],
    weaponPoints: [S(0, 0.2, 1.2)],
  },
};

// ── Cargo Transport Ship (GLTF — PBR with emissive + normal) ────
// Source: spaceship_-_cargo.zip — armature-rigged cargo hauler.
// Used for worker/transport/miner ships.
const CT = '/assets/space/models/cargo-transport';
export const CARGO_TRANSPORT_PREFABS: Record<string, SpacePrefab> = {
  cargo_hauler: {
    modelPath: `${CT}/scene.gltf`,
    format: 'gltf',
    scale: 0.04,
    offset: S(0, 0, 0),
    // Cargo ship: tall along Y, forward along -Z in source
    rotation: E(0, Math.PI, 0),
    enginePoints: [S(-0.4, 0, -0.8), S(0.4, 0, -0.8)],
    weaponPoints: [],
  },
  cargo_miner: {
    modelPath: `${CT}/scene.gltf`,
    format: 'gltf',
    scale: 0.03,
    offset: S(0, 0, 0),
    rotation: E(0, Math.PI, 0),
    enginePoints: [S(0, 0, -0.5)],
    weaponPoints: [S(0, 0.2, 0.6)],
  },
  cargo_freighter: {
    modelPath: `${CT}/scene.gltf`,
    format: 'gltf',
    scale: 0.06,
    offset: S(0, 0, 0),
    rotation: E(0, Math.PI, 0),
    enginePoints: [S(-0.6, 0, -1.2), S(0.6, 0, -1.2)],
    weaponPoints: [S(0, 0.1, 0.8)],
  },
};

// ── Research Drone (GLTF — Blockbench voxel-style, 6 materials) ──
// Source: orbixel_mk4_research_drone_blockbench.zip
// Compact drone with glowing eye, perfect for scouts/recon.
const RD = '/assets/space/models/research-drone';
export const DRONE_PREFABS: Record<string, SpacePrefab> = {
  research_drone: {
    modelPath: `${RD}/scene.gltf`,
    format: 'gltf',
    scale: 0.15,
    offset: S(0, 0, 0),
    // Drone: elongated along -Z, Y-up
    rotation: E(0, Math.PI, 0),
    enginePoints: [S(0, 0, -0.4)],
    weaponPoints: [S(0, 0, 0.5)],
  },
  recon_probe: {
    modelPath: `${RD}/scene.gltf`,
    format: 'gltf',
    scale: 0.08,
    offset: S(0, 0, 0),
    rotation: E(0, Math.PI, 0),
    enginePoints: [S(0, 0, -0.3)],
    weaponPoints: [],
  },
  scout_drone: {
    modelPath: `${RD}/scene.gltf`,
    format: 'gltf',
    scale: 0.12,
    offset: S(0, 0, 0),
    rotation: E(0, Math.PI, 0),
    enginePoints: [S(-0.2, 0, -0.3), S(0.2, 0, -0.3)],
    weaponPoints: [S(0, 0, 0.4)],
  },
};

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
const CDN_AUDIO = import.meta.env.VITE_ASSET_CDN ? `${import.meta.env.VITE_ASSET_CDN}/audio` : '';
/** Resolve audio URL: CDN first, local fallback. */
function audioUrl(localPath: string): string {
  if (CDN_AUDIO) {
    // CDN mirrors the /assets/space/audio/ structure
    const relative = localPath.replace('/assets/space/audio/', '');
    return `${CDN_AUDIO}/${relative}`;
  }
  return localPath;
}

export const AUDIO_ASSETS = {
  /**
   * Music tracks — mapped by game context.
   * Premium WAV tracks from Space Music Pack used for key moments;
   * MP3 originals remain as lightweight fallbacks.
   */
  music: {
    // Menu / lobby
    menu: audioUrl(`${A}/music/menu-premium.wav`),
    menu_fallback: audioUrl(`${A}/music/menu.mp3`),
    // Main theme (intro / title)
    main: audioUrl(`${A}/music/main.mp3`),
    // Combat
    battle: audioUrl(`${A}/music/battle-premium.wav`),
    battle_fallback: audioUrl(`${A}/music/battle.mp3`),
    // Campaign: slow exploration between battles
    exploration: audioUrl(`${A}/music/slow-travel.wav`),
    // Campaign: story beats / dramatic moments
    story: audioUrl(`${A}/music/meet-the-princess.wav`),
    // Campaign: post-battle / wreckage scenes
    aftermath: audioUrl(`${A}/music/in-the-wreckage.wav`),
    // Loading screen
    loading: audioUrl(`${A}/music/loading.wav`),
  },
  // SFX (WAV, short clips)
  sfx: {
    laser: audioUrl(`${A}/sfx/laser.wav`),
    heavy_shot: audioUrl(`${A}/sfx/heavy_shot.wav`),
    missile_shot: audioUrl(`${A}/sfx/missile_shot.wav`),
    death_small: audioUrl(`${A}/sfx/death_small.wav`),
    death_large: audioUrl(`${A}/sfx/death_large.wav`),
    capture: audioUrl(`${A}/sfx/capture.wav`),
    harvest: audioUrl(`${A}/sfx/harvest.wav`),
    build_complete: audioUrl(`${A}/sfx/build_complete.wav`),
    hero_built: audioUrl(`${A}/sfx/hero_built.wav`),
    commander: audioUrl(`${A}/sfx/commander.wav`),
    ui_click: audioUrl(`${A}/sfx/ui_click.wav`),
    upgrade: audioUrl(`${A}/sfx/upgrade.wav`),
    alert: audioUrl(`${A}/sfx/alert.wav`),
    weapon_fire: audioUrl(`${A}/warped-shooting-fx.mp3`),
    // Space Music Pack — premium SFX
    alien_talk_1: audioUrl(`${A}/sfx/alien-talk-1.wav`),
    alien_talk_2: audioUrl(`${A}/sfx/alien-talk-2.wav`),
    alien_talk_3: audioUrl(`${A}/sfx/alien-talk-3.wav`),
    scream: audioUrl(`${A}/sfx/scream.wav`),
    start_level: audioUrl(`${A}/sfx/start-level.wav`),
  },
};

// ── Helper: get all prefabs for a ship type ─────────────────────
export function getShipPrefab(shipType: string): SpacePrefab | null {
  return (
    SHIP_PREFABS[shipType] ??
    CAPITAL_PREFABS[shipType] ??
    BATTLE_SHIP_PREFABS[shipType] ??
    FORGE_SHIP_PREFABS[shipType] ??
    FACTION_HERO_PREFABS[shipType] ??
    ENEMY_PREFABS[shipType] ??
    VOXEL_FLEET_PREFABS[shipType] ??
    BIONIC_PREFABS[shipType] ??
    LOWPOLY_FLEET_PREFABS[shipType] ??
    ORGANIC_HERO_PREFABS[shipType] ??
    CARGO_TRANSPORT_PREFABS[shipType] ??
    DRONE_PREFABS[shipType] ??
    null
  );
}

/** All prefab registries for iteration (e.g. ship codex, random selection). */
export const ALL_PREFAB_REGISTRIES = [
  SHIP_PREFABS,
  CAPITAL_PREFABS,
  BATTLE_SHIP_PREFABS,
  FORGE_SHIP_PREFABS,
  FACTION_HERO_PREFABS,
  ENEMY_PREFABS,
  VOXEL_FLEET_PREFABS,
  BIONIC_PREFABS,
  LOWPOLY_FLEET_PREFABS,
  ORGANIC_HERO_PREFABS,
  CARGO_TRANSPORT_PREFABS,
  DRONE_PREFABS,
] as const;
