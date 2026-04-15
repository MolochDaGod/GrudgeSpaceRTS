/**
 * asset-registry.ts — Central asset catalog with Grudge Object Storage UUIDs.
 *
 * Every model, texture, and sprite in the game is registered here with:
 *   - A stable UUID (object storage key on Grudge CDN)
 *   - A local dev path (served from /assets/ in dev mode)
 *   - Format, texture info, and color tint metadata
 *
 * Usage:
 *   const url = resolveAsset('micro_recon');
 *   // Returns CDN URL if VITE_ASSET_CDN is set, otherwise local path.
 */

const CDN_BASE = import.meta.env.VITE_ASSET_CDN ?? '';
/** Cache-busting version. Bump when assets are re-uploaded to R2 after optimization. */
const ASSET_VERSION = import.meta.env.VITE_ASSET_VERSION ?? '';

// ── Types ─────────────────────────────────────────────────────────
export type AssetFormat = 'obj' | 'fbx' | 'glb';
export type AssetCategory =
  | 'ship'
  | 'station'
  | 'turret'
  | 'planet'
  | 'effect'
  | 'prop'
  | 'vehicle'
  | 'weapon'
  | 'sprite'
  | 'ui'
  | 'enemy'
  | 'boss'
  | 'terrain';

export interface AssetEntry {
  uuid: string; // Grudge object storage key (v4 UUID)
  key: string; // human-readable key (matches SHIP_PREFABS key)
  category: AssetCategory;
  localPath: string; // dev fallback: /assets/space/models/...
  cdnPath?: string; // override CDN subpath if different from uuid
  format: AssetFormat;
  texturePath?: string; // companion texture (PNG)
  mtlPath?: string; // OBJ material file
  colorTintable: boolean; // can team color be applied via material.color
  tags: string[]; // search/filter tags
}

// ── Registry ──────────────────────────────────────────────────────
const REGISTRY: AssetEntry[] = [
  // ── Voxel Ships (OBJ+MTL) ────────────────────────────────────
  {
    uuid: 'a0010001-ship-voxl-micro-recon00000',
    key: 'micro_recon',
    category: 'ship',
    localPath: '/assets/space/models/ships/MicroRecon/MicroRecon.obj',
    format: 'obj',
    texturePath: '/assets/space/models/ships/MicroRecon/MicroRecon.png',
    mtlPath: '/assets/space/models/ships/MicroRecon/MicroRecon.mtl',
    colorTintable: true,
    tags: ['scout', 'voxel', 'tier1'],
  },
  {
    uuid: 'a0010002-ship-voxl-red-fighter0000',
    key: 'red_fighter',
    category: 'ship',
    localPath: '/assets/space/models/ships/RedFighter/RedFighter.obj',
    format: 'obj',
    texturePath: '/assets/space/models/ships/RedFighter/RedFighter.png',
    mtlPath: '/assets/space/models/ships/RedFighter/RedFighter.mtl',
    colorTintable: true,
    tags: ['fighter', 'voxel', 'tier1'],
  },
  {
    uuid: 'a0010003-ship-voxl-galactix-racer0',
    key: 'galactix_racer',
    category: 'ship',
    localPath: '/assets/space/models/ships/GalactixRacer/GalactixRacer.obj',
    format: 'obj',
    texturePath: '/assets/space/models/ships/GalactixRacer/GalactixRacer.png',
    mtlPath: '/assets/space/models/ships/GalactixRacer/GalactixRacer.mtl',
    colorTintable: true,
    tags: ['interceptor', 'voxel', 'tier1'],
  },
  {
    uuid: 'a0010004-ship-voxl-dual-striker000',
    key: 'dual_striker',
    category: 'ship',
    localPath: '/assets/space/models/ships/DualStriker/DualStriker.obj',
    format: 'obj',
    texturePath: '/assets/space/models/ships/DualStriker/DualStriker.png',
    mtlPath: '/assets/space/models/ships/DualStriker/DualStriker.mtl',
    colorTintable: true,
    tags: ['heavy_fighter', 'voxel', 'tier2'],
  },
  {
    uuid: 'a0010005-ship-voxl-camo-stellar-jt',
    key: 'camo_stellar_jet',
    category: 'ship',
    localPath: '/assets/space/models/ships/CamoStellarJet/CamoStellarJet.obj',
    format: 'obj',
    texturePath: '/assets/space/models/ships/CamoStellarJet/CamoStellarJet.png',
    mtlPath: '/assets/space/models/ships/CamoStellarJet/CamoStellarJet.mtl',
    colorTintable: true,
    tags: ['stealth', 'voxel', 'tier2'],
  },
  {
    uuid: 'a0010006-ship-voxl-meteor-slicer00',
    key: 'meteor_slicer',
    category: 'ship',
    localPath: '/assets/space/models/ships/MeteorSlicer/MeteorSlicer.obj',
    format: 'obj',
    texturePath: '/assets/space/models/ships/MeteorSlicer/MeteorSlicer.png',
    mtlPath: '/assets/space/models/ships/MeteorSlicer/MeteorSlicer.mtl',
    colorTintable: true,
    tags: ['fighter', 'voxel', 'tier2'],
  },
  {
    uuid: 'a0010007-ship-voxl-infrared-furtve',
    key: 'infrared_furtive',
    category: 'ship',
    localPath: '/assets/space/models/ships/InfraredFurtive/InfraredFurtive.obj',
    format: 'obj',
    texturePath: '/assets/space/models/ships/InfraredFurtive/InfraredFurtive.png',
    mtlPath: '/assets/space/models/ships/InfraredFurtive/InfraredFurtive.mtl',
    colorTintable: true,
    tags: ['stealth', 'voxel', 'tier2'],
  },
  {
    uuid: 'a0010008-ship-voxl-pyramid-ship000',
    key: 'pyramid_ship',
    category: 'ship',
    localPath: '/assets/space/models/ships/PyramidShip/PyramidShips.obj',
    format: 'obj',
    texturePath: '/assets/space/models/ships/PyramidShip/PyramidShips.png',
    mtlPath: '/assets/space/models/ships/PyramidShip/PyramidShips.mtl',
    colorTintable: true,
    tags: ['assault_frigate', 'voxel', 'tier3'],
  },
  {
    uuid: 'a0010009-ship-voxl-uv-intruder0000',
    key: 'ultraviolet_intruder',
    category: 'ship',
    localPath: '/assets/space/models/ships/UltravioletIntruder/UltravioletIntruder.obj',
    format: 'obj',
    texturePath: '/assets/space/models/ships/UltravioletIntruder/UltravioletIntruder.png',
    mtlPath: '/assets/space/models/ships/UltravioletIntruder/UltravioletIntruder.mtl',
    colorTintable: true,
    tags: ['bomber', 'voxel', 'tier3'],
  },
  {
    uuid: 'a001000a-ship-voxl-warship00000000',
    key: 'warship',
    category: 'ship',
    localPath: '/assets/space/models/ships/Warship/Warship.obj',
    format: 'obj',
    texturePath: '/assets/space/models/ships/Warship/Warship.png',
    mtlPath: '/assets/space/models/ships/Warship/Warship.mtl',
    colorTintable: true,
    tags: ['assault_frigate', 'voxel', 'tier3'],
  },
  {
    uuid: 'a001000b-ship-voxl-star-marine0000',
    key: 'star_marine_trooper',
    category: 'ship',
    localPath: '/assets/space/models/ships/StarMarineTrooper/StarMarineTrooper.obj',
    format: 'obj',
    texturePath: '/assets/space/models/ships/StarMarineTrooper/StarMarineTrooper.png',
    mtlPath: '/assets/space/models/ships/StarMarineTrooper/StarMarineTrooper.mtl',
    colorTintable: true,
    tags: ['transport', 'voxel', 'tier3'],
  },
  {
    uuid: 'a001000c-ship-voxl-interstellar-rn',
    key: 'interstellar_runner',
    category: 'ship',
    localPath: '/assets/space/models/ships/InterstellarRunner/InterstellarRunner.obj',
    format: 'obj',
    texturePath: '/assets/space/models/ships/InterstellarRunner/InterstellarRunner.png',
    mtlPath: '/assets/space/models/ships/InterstellarRunner/InterstellarRunner.mtl',
    colorTintable: true,
    tags: ['transport', 'voxel', 'tier2'],
  },
  {
    uuid: 'a001000d-ship-voxl-transtellar0000',
    key: 'transtellar',
    category: 'ship',
    localPath: '/assets/space/models/ships/Transtellar/Transtellar.obj',
    format: 'obj',
    texturePath: '/assets/space/models/ships/Transtellar/Transtellar.png',
    mtlPath: '/assets/space/models/ships/Transtellar/Transtellar.mtl',
    colorTintable: true,
    tags: ['transport', 'voxel', 'tier2'],
  },

  // ── Battle Fleet (FBX) — Corvettes ────────────────────────────
  {
    uuid: 'a0020001-ship-fbx-corvette-01-0000',
    key: 'cf_corvette_01',
    category: 'ship',
    localPath: '/assets/space/models/battle-ships/Corvette_01.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/battle-ships/Corvette_01.png',
    colorTintable: true,
    tags: ['corvette', 'craftpix', 'tier1'],
  },
  {
    uuid: 'a0020002-ship-fbx-corvette-02-0000',
    key: 'cf_corvette_02',
    category: 'ship',
    localPath: '/assets/space/models/battle-ships/Corvette_02.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/battle-ships/Corvette_02.png',
    colorTintable: true,
    tags: ['corvette', 'craftpix', 'tier2'],
  },
  {
    uuid: 'a0020003-ship-fbx-corvette-03-0000',
    key: 'cf_corvette_03',
    category: 'ship',
    localPath: '/assets/space/models/battle-ships/Corvette_03.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/battle-ships/Corvette_03.png',
    colorTintable: true,
    tags: ['corvette', 'craftpix', 'tier2'],
  },
  {
    uuid: 'a0020004-ship-fbx-corvette-04-0000',
    key: 'cf_corvette_04',
    category: 'ship',
    localPath: '/assets/space/models/battle-ships/Corvette_04.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/battle-ships/Corvette_04.png',
    colorTintable: true,
    tags: ['corvette', 'craftpix', 'tier2'],
  },
  {
    uuid: 'a0020005-ship-fbx-corvette-05-0000',
    key: 'cf_corvette_05',
    category: 'ship',
    localPath: '/assets/space/models/battle-ships/Corvette_05.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/battle-ships/Corvette_05.png',
    colorTintable: true,
    tags: ['corvette', 'craftpix', 'tier2'],
  },

  // ── Battle Fleet (FBX) — Frigates ─────────────────────────────
  {
    uuid: 'a0020010-ship-fbx-frigate-01-00000',
    key: 'cf_frigate_01',
    category: 'ship',
    localPath: '/assets/space/models/battle-ships/Frigate_01.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/battle-ships/Frigate_01.png',
    colorTintable: true,
    tags: ['frigate', 'craftpix', 'tier2'],
  },
  {
    uuid: 'a0020011-ship-fbx-frigate-02-00000',
    key: 'cf_frigate_02',
    category: 'ship',
    localPath: '/assets/space/models/battle-ships/Frigate_02.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/battle-ships/Frigate_02.png',
    colorTintable: true,
    tags: ['frigate', 'craftpix', 'tier3'],
  },
  {
    uuid: 'a0020012-ship-fbx-frigate-03-00000',
    key: 'cf_frigate_03',
    category: 'ship',
    localPath: '/assets/space/models/battle-ships/Frigate_03.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/battle-ships/Frigate_03.png',
    colorTintable: true,
    tags: ['frigate', 'craftpix', 'tier3'],
  },
  {
    uuid: 'a0020013-ship-fbx-frigate-04-00000',
    key: 'cf_frigate_04',
    category: 'ship',
    localPath: '/assets/space/models/battle-ships/Frigate_04.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/battle-ships/Frigate_04.png',
    colorTintable: true,
    tags: ['frigate', 'craftpix', 'tier3'],
  },
  {
    uuid: 'a0020014-ship-fbx-frigate-05-00000',
    key: 'cf_frigate_05',
    category: 'ship',
    localPath: '/assets/space/models/battle-ships/Frigate_05.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/battle-ships/Frigate_05.png',
    colorTintable: true,
    tags: ['frigate', 'craftpix', 'tier3'],
  },

  // ── Planets (GLB) ─────────────────────────────────────────────
  {
    uuid: 'a0050001-plnt-glb-planet-01-000000',
    key: 'planet_1',
    category: 'planet',
    localPath: '/assets/space/models/planets/planet_1.glb',
    format: 'glb',
    texturePath: '/assets/space/models/planets/planet_1.png',
    colorTintable: false,
    tags: ['planet'],
  },
  {
    uuid: 'a0050002-plnt-glb-planet-02-000000',
    key: 'planet_2',
    category: 'planet',
    localPath: '/assets/space/models/planets/planet_2.glb',
    format: 'glb',
    texturePath: '/assets/space/models/planets/planet_2.png',
    colorTintable: false,
    tags: ['planet'],
  },
  {
    uuid: 'a0050003-plnt-glb-planet-03-000000',
    key: 'planet_3',
    category: 'planet',
    localPath: '/assets/space/models/planets/planet_3.glb',
    format: 'glb',
    texturePath: '/assets/space/models/planets/planet_3.png',
    colorTintable: false,
    tags: ['planet'],
  },
  {
    uuid: 'a0050004-plnt-glb-planet-04-000000',
    key: 'planet_4',
    category: 'planet',
    localPath: '/assets/space/models/planets/planet_4.glb',
    format: 'glb',
    texturePath: '/assets/space/models/planets/planet_4.png',
    colorTintable: false,
    tags: ['planet'],
  },
  {
    uuid: 'a0050005-plnt-glb-planet-05-000000',
    key: 'planet_5',
    category: 'planet',
    localPath: '/assets/space/models/planets/planet_5.glb',
    format: 'glb',
    texturePath: '/assets/space/models/planets/planet_5.png',
    colorTintable: false,
    tags: ['planet'],
  },
  {
    uuid: 'a0050006-plnt-glb-planet-main-0000',
    key: 'planet_main',
    category: 'planet',
    localPath: '/assets/space/models/planets/planet_main.glb',
    format: 'glb',
    texturePath: '/assets/space/models/planets/planet_main.png',
    colorTintable: false,
    tags: ['planet', 'homeworld'],
  },

  // ── Turrets (FBX) ─────────────────────────────────────────────
  {
    uuid: 'a0060001-turt-fbx-turel-01-0000000',
    key: 'turel_01',
    category: 'turret',
    localPath: '/assets/space/models/turrets/_Turel_01.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/turrets/_Turel_01.png',
    colorTintable: true,
    tags: ['turret', 'laser'],
  },
  {
    uuid: 'a0060002-turt-fbx-turel-02-0000000',
    key: 'turel_02',
    category: 'turret',
    localPath: '/assets/space/models/turrets/_Turel_02.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/turrets/_Turel_02.png',
    colorTintable: true,
    tags: ['turret', 'missile'],
  },
  {
    uuid: 'a0060003-turt-fbx-turel-03-0000000',
    key: 'turel_03',
    category: 'turret',
    localPath: '/assets/space/models/turrets/_Turel_03.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/turrets/_Turel_03.png',
    colorTintable: true,
    tags: ['turret', 'railgun'],
  },
  {
    uuid: 'a0060004-turt-fbx-turel-04-0000000',
    key: 'turel_04',
    category: 'turret',
    localPath: '/assets/space/models/turrets/_Turel_04.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/turrets/_Turel_04.png',
    colorTintable: true,
    tags: ['turret', 'heavy'],
  },

  // ── Stations (FBX) ────────────────────────────────────────────
  {
    uuid: 'a0070001-stat-fbx-energy-ship-0000',
    key: 'energy_ship_station',
    category: 'station',
    localPath: '/assets/space/models/stations/EnergyShip/EnergyShip.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/stations/EnergyShip/EnergyShip.png',
    colorTintable: true,
    tags: ['station'],
  },
  {
    uuid: 'a0070002-stat-fbx-station-00000000',
    key: 'station',
    category: 'station',
    localPath: '/assets/space/models/stations/Station/Station.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/stations/Station/Station.png',
    colorTintable: true,
    tags: ['station'],
  },

  // ── Weapons (GLB) ─────────────────────────────────────────────
  {
    uuid: 'a0080001-weap-glb-gatling-gun-0000',
    key: 'gatling_gun_turret',
    category: 'weapon',
    localPath: '/assets/space/models/weapons/Gatelng Gun Turret.glb',
    format: 'glb',
    texturePath: '/assets/space/models/weapons/Gatelng Gun Turret.png',
    colorTintable: true,
    tags: ['weapon', 'gatling'],
  },
  {
    uuid: 'a0080002-weap-glb-gun-cannon-00000',
    key: 'gun_cannon_turret',
    category: 'weapon',
    localPath: '/assets/space/models/weapons/Gun Cannon Turret.glb',
    format: 'glb',
    texturePath: '/assets/space/models/weapons/Gun Cannon Turret.png',
    colorTintable: true,
    tags: ['weapon', 'cannon'],
  },
  {
    uuid: 'a0080003-weap-glb-rail-gun-0000000',
    key: 'rail_gun_turret',
    category: 'weapon',
    localPath: '/assets/space/models/weapons/Rail Gun Turret.glb',
    format: 'glb',
    texturePath: '/assets/space/models/weapons/Rail Gun Turret.png',
    colorTintable: true,
    tags: ['weapon', 'railgun'],
  },

  // ── Battle Fleet (FBX) — Destroyers ────────────────────────────
  {
    uuid: 'a0020020-ship-fbx-destroyer-01-0000',
    key: 'cf_destroyer_01',
    category: 'ship',
    localPath: '/assets/space/models/battle-ships/Destroyer_01.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/battle-ships/Destroyer_01.png',
    colorTintable: true,
    tags: ['destroyer', 'craftpix', 'tier3'],
  },
  {
    uuid: 'a0020021-ship-fbx-destroyer-02-0000',
    key: 'cf_destroyer_02',
    category: 'ship',
    localPath: '/assets/space/models/battle-ships/Destroyer_02.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/battle-ships/Destroyer_02.png',
    colorTintable: true,
    tags: ['destroyer', 'craftpix', 'tier3'],
  },
  {
    uuid: 'a0020022-ship-fbx-destroyer-03-0000',
    key: 'cf_destroyer_03',
    category: 'ship',
    localPath: '/assets/space/models/battle-ships/Destroyer_03.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/battle-ships/Destroyer_03.png',
    colorTintable: true,
    tags: ['destroyer', 'craftpix', 'tier4'],
  },
  {
    uuid: 'a0020023-ship-fbx-destroyer-04-0000',
    key: 'cf_destroyer_04',
    category: 'ship',
    localPath: '/assets/space/models/battle-ships/Destroyer_04.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/battle-ships/Destroyer_04.png',
    colorTintable: true,
    tags: ['destroyer', 'craftpix', 'tier4'],
  },
  {
    uuid: 'a0020024-ship-fbx-destroyer-05-0000',
    key: 'cf_destroyer_05',
    category: 'ship',
    localPath: '/assets/space/models/battle-ships/Destroyer_05.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/battle-ships/Destroyer_05.png',
    colorTintable: true,
    tags: ['destroyer', 'craftpix', 'tier4'],
  },

  // ── Battle Fleet (FBX) — Light Cruisers ────────────────────────
  {
    uuid: 'a0020030-ship-fbx-lcruiser-01-0000',
    key: 'cf_light_cruiser_01',
    category: 'ship',
    localPath: '/assets/space/models/battle-ships/Light cruiser_01.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/battle-ships/Light cruiser_01.png',
    colorTintable: true,
    tags: ['light_cruiser', 'craftpix', 'tier4'],
  },
  {
    uuid: 'a0020031-ship-fbx-lcruiser-02-0000',
    key: 'cf_light_cruiser_02',
    category: 'ship',
    localPath: '/assets/space/models/battle-ships/Light cruiser_02.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/battle-ships/Light cruiser_02.png',
    colorTintable: true,
    tags: ['light_cruiser', 'craftpix', 'tier4'],
  },
  {
    uuid: 'a0020032-ship-fbx-lcruiser-03-0000',
    key: 'cf_light_cruiser_03',
    category: 'ship',
    localPath: '/assets/space/models/battle-ships/Light cruiser_03.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/battle-ships/Light cruiser_03.png',
    colorTintable: true,
    tags: ['light_cruiser', 'craftpix', 'tier4'],
  },
  {
    uuid: 'a0020033-ship-fbx-lcruiser-04-0000',
    key: 'cf_light_cruiser_04',
    category: 'ship',
    localPath: '/assets/space/models/battle-ships/Light cruiser_04.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/battle-ships/Light cruiser_04.png',
    colorTintable: true,
    tags: ['light_cruiser', 'craftpix', 'tier5'],
  },
  {
    uuid: 'a0020034-ship-fbx-lcruiser-05-0000',
    key: 'cf_light_cruiser_05',
    category: 'ship',
    localPath: '/assets/space/models/battle-ships/Light cruiser_05.fbx',
    format: 'fbx',
    texturePath: '/assets/space/models/battle-ships/Light cruiser_05.png',
    colorTintable: true,
    tags: ['light_cruiser', 'craftpix', 'tier5'],
  },

  // ── Flying Ship (glTF) — Space ─────────────────────────────────
  {
    uuid: 'a0090001-ship-gltf-flying-ship-0000',
    key: 'flying_ship',
    category: 'ship',
    localPath: '/assets/space/models/flying-ship/scene.gltf',
    format: 'glb',
    colorTintable: true,
    tags: ['ship', 'gltf', 'tier3'],
  },

  // ── Homeworld (glTF) — Ground base the player escaped from ────
  {
    uuid: 'a00a0001-terr-gltf-homeworld-000000',
    key: 'homeworld_base',
    category: 'terrain',
    localPath: '/assets/ground/homeworld/scene.gltf',
    format: 'glb',
    colorTintable: false,
    tags: ['terrain', 'homeworld', 'gltf', 'ground'],
  },

  // ── Alien City (glTF) — Sci-fi ground terrain / enemy base ────
  {
    uuid: 'a00a0002-terr-gltf-alien-city-00000',
    key: 'alien_city',
    category: 'terrain',
    localPath: '/assets/ground/alien-city/scene.gltf',
    format: 'glb',
    colorTintable: false,
    tags: ['terrain', 'alien', 'city', 'gltf', 'ground'],
  },

  // ── Five-Headed Dragon (glTF) — Raid boss ─────────────────────
  {
    uuid: 'a00b0001-boss-gltf-hydra-dragon-000',
    key: 'boss_hydra_dragon',
    category: 'boss',
    localPath: '/assets/ground/bosses/five-headed-dragon/scene.gltf',
    format: 'glb',
    colorTintable: false,
    tags: ['boss', 'dragon', 'raid', 'gltf', 'ground'],
  },

  // ── Voxel Souls Characters (glTF) — Ground enemies ────────────
  {
    uuid: 'a00c0001-enem-gltf-voxel-souls-0000',
    key: 'enemy_voxel_souls',
    category: 'enemy',
    localPath: '/assets/ground/enemies/voxel-souls/scene.gltf',
    format: 'glb',
    colorTintable: false,
    tags: ['enemy', 'voxel', 'souls', 'gltf', 'ground'],
  },

  // ── Knight Artorias (glTF) — Elite ground boss / mini-boss ────
  {
    uuid: 'a00c0002-enem-gltf-knight-artorias0',
    key: 'enemy_knight_artorias',
    category: 'enemy',
    localPath: '/assets/ground/enemies/knight-artorias/scene.gltf',
    format: 'glb',
    colorTintable: false,
    tags: ['enemy', 'knight', 'souls', 'elite', 'gltf', 'ground'],
  },

  // ── Mars Environment Kit (glTF) — Ground battle terrain ────────
  {
    uuid: 'a00a0003-terr-gltf-mars-environ-000',
    key: 'mars_environment',
    category: 'terrain',
    localPath: '/assets/ground/mars-environment/scene.gltf',
    format: 'glb',
    colorTintable: false,
    tags: ['terrain', 'mars', 'battle', 'gltf', 'ground', 'environment'],
  },

  // ── Lowpoly FBX Fleet — color-variant ships ──────────────────
  ...(['Blue', 'Green', 'Orange', 'Purple'] as const).flatMap((color, _i) => [
    {
      uuid: `a00d0001-ship-fbx-lp-spaceship-${color.toLowerCase()}`,
      key: `lp_spaceship_${color.toLowerCase()}`,
      category: 'ship' as const,
      localPath: `/assets/space/models/lowpoly/SpaceShip - ${color}.fbx`,
      format: 'fbx' as const,
      texturePath: '/assets/space/models/lowpoly/Pallette.png',
      colorTintable: true,
      tags: ['ship', 'fbx', 'lowpoly', color.toLowerCase(), 'tier2'],
    },
    {
      uuid: `a00d0002-ship-fbx-lp-fighter-${color.toLowerCase()}`,
      key: `lp_fighter_${color.toLowerCase()}`,
      category: 'ship' as const,
      localPath: `/assets/space/models/lowpoly/SpaceShip2 - ${color}.fbx`,
      format: 'fbx' as const,
      texturePath: '/assets/space/models/lowpoly/Pallette.png',
      colorTintable: true,
      tags: ['ship', 'fbx', 'lowpoly', color.toLowerCase(), 'tier1'],
    },
    {
      uuid: `a00d0003-ship-fbx-lp-cruiser-${color.toLowerCase()}`,
      key: `lp_cruiser_${color.toLowerCase()}`,
      category: 'ship' as const,
      localPath: `/assets/space/models/lowpoly/Cruiser - ${color}.fbx`,
      format: 'fbx' as const,
      texturePath: '/assets/space/models/lowpoly/Pallette.png',
      colorTintable: true,
      tags: ['ship', 'fbx', 'lowpoly', color.toLowerCase(), 'tier3'],
    },
  ]),
];

// ── Lookup indexes ────────────────────────────────────────────────
const _byKey = new Map<string, AssetEntry>();
const _byUuid = new Map<string, AssetEntry>();
for (const entry of REGISTRY) {
  _byKey.set(entry.key, entry);
  _byUuid.set(entry.uuid, entry);
}

// ── Public API ────────────────────────────────────────────────────

/** Get asset entry by human-readable key (e.g. 'micro_recon'). */
export function getAsset(key: string): AssetEntry | undefined {
  return _byKey.get(key);
}

/** Get asset entry by UUID (object storage key). */
export function getAssetByUuid(uuid: string): AssetEntry | undefined {
  return _byUuid.get(uuid);
}

/** Resolve the best URL for loading a model/texture. CDN if available, else local. */
export function resolveAssetUrl(key: string): string {
  const entry = _byKey.get(key);
  if (!entry) return '';
  if (CDN_BASE) {
    // Path-based R2 key: /assets/space/models/X → gruda-armada/space/models/X
    const r2Path = entry.localPath.replace(/^\/assets\//, '');
    const versionSuffix = ASSET_VERSION ? `?v=${ASSET_VERSION}` : '';
    return `${CDN_BASE}/gruda-armada/${r2Path}${versionSuffix}`;
  }
  return entry.localPath;
}

/** Resolve texture URL for an asset. */
export function resolveTextureUrl(key: string): string | undefined {
  const entry = _byKey.get(key);
  if (!entry?.texturePath) return undefined;
  if (CDN_BASE) {
    const r2Path = entry.texturePath.replace(/^\/assets\//, '');
    return `${CDN_BASE}/gruda-armada/${r2Path}`;
  }
  return entry.texturePath;
}

/**
 * Resolve any local asset path to CDN or local.
 * Use this for paths not in the registry (e.g. animation FBXs, UI images).
 * Input: '/assets/ground/animations/sword/idle.fbx'
 * Output: 'https://assets.grudge-studio.com/gruda-armada/ground/animations/sword/idle.fbx' (CDN)
 *      or '/assets/ground/animations/sword/idle.fbx' (local fallback)
 */
export function resolvePathUrl(localPath: string): string {
  if (CDN_BASE && localPath.startsWith('/assets/')) {
    const r2Path = localPath.replace(/^\/assets\//, '');
    const versionSuffix = ASSET_VERSION ? `?v=${ASSET_VERSION}` : '';
    return `${CDN_BASE}/gruda-armada/${r2Path}${versionSuffix}`;
  }
  return localPath;
}

/** Get all assets matching a category. */
export function getAssetsByCategory(category: AssetCategory): AssetEntry[] {
  return REGISTRY.filter((e) => e.category === category);
}

/** Get all assets matching a tag. */
export function getAssetsByTag(tag: string): AssetEntry[] {
  return REGISTRY.filter((e) => e.tags.includes(tag));
}

/** Full registry (read-only). */
export function getAllAssets(): readonly AssetEntry[] {
  return REGISTRY;
}

// ── Audio Asset Registry ─────────────────────────────────────
export interface AudioAssetEntry {
  uuid: string;
  key: string;
  type: 'music' | 'sfx';
  localPath: string;
  format: 'wav' | 'mp3' | 'ogg';
  description: string;
  tags: string[];
}

export const AUDIO_REGISTRY: AudioAssetEntry[] = [
  // Music — Space Music Pack (premium WAV)
  {
    uuid: 'b0010001-musi-wav-battle-premium00',
    key: 'music_battle_premium',
    type: 'music',
    localPath: '/assets/space/audio/music/battle-premium.wav',
    format: 'wav',
    description: 'Intense combat music',
    tags: ['battle', 'premium'],
  },
  {
    uuid: 'b0010002-musi-wav-menu-premium0000',
    key: 'music_menu_premium',
    type: 'music',
    localPath: '/assets/space/audio/music/menu-premium.wav',
    format: 'wav',
    description: 'Menu/lobby ambient',
    tags: ['menu', 'premium'],
  },
  {
    uuid: 'b0010003-musi-wav-slow-travel00000',
    key: 'music_exploration',
    type: 'music',
    localPath: '/assets/space/audio/music/slow-travel.wav',
    format: 'wav',
    description: 'Campaign exploration',
    tags: ['campaign', 'exploration'],
  },
  {
    uuid: 'b0010004-musi-wav-meet-princess000',
    key: 'music_story',
    type: 'music',
    localPath: '/assets/space/audio/music/meet-the-princess.wav',
    format: 'wav',
    description: 'Story dramatic moments',
    tags: ['campaign', 'story'],
  },
  {
    uuid: 'b0010005-musi-wav-in-wreckage00000',
    key: 'music_aftermath',
    type: 'music',
    localPath: '/assets/space/audio/music/in-the-wreckage.wav',
    format: 'wav',
    description: 'Post-battle wreckage',
    tags: ['campaign', 'aftermath'],
  },
  {
    uuid: 'b0010006-musi-wav-loading000000000',
    key: 'music_loading',
    type: 'music',
    localPath: '/assets/space/audio/music/loading.wav',
    format: 'wav',
    description: 'Loading screen',
    tags: ['loading'],
  },
  // Music — Original (lightweight MP3)
  {
    uuid: 'b0010007-musi-mp3-battle-original0',
    key: 'music_battle',
    type: 'music',
    localPath: '/assets/space/audio/music/battle.mp3',
    format: 'mp3',
    description: 'Combat music (original)',
    tags: ['battle'],
  },
  {
    uuid: 'b0010008-musi-mp3-menu-original000',
    key: 'music_menu',
    type: 'music',
    localPath: '/assets/space/audio/music/menu.mp3',
    format: 'mp3',
    description: 'Menu music (original)',
    tags: ['menu'],
  },
  {
    uuid: 'b0010009-musi-mp3-main-theme000000',
    key: 'music_main',
    type: 'music',
    localPath: '/assets/space/audio/music/main.mp3',
    format: 'mp3',
    description: 'Main title theme',
    tags: ['intro', 'main'],
  },
  // SFX — Space Music Pack (premium WAV)
  {
    uuid: 'b0020001-sfx-wav-alien-talk-100000',
    key: 'sfx_alien_talk_1',
    type: 'sfx',
    localPath: '/assets/space/audio/sfx/alien-talk-1.wav',
    format: 'wav',
    description: 'Alien dialogue SFX 1',
    tags: ['alien', 'dialogue'],
  },
  {
    uuid: 'b0020002-sfx-wav-alien-talk-200000',
    key: 'sfx_alien_talk_2',
    type: 'sfx',
    localPath: '/assets/space/audio/sfx/alien-talk-2.wav',
    format: 'wav',
    description: 'Alien dialogue SFX 2',
    tags: ['alien', 'dialogue'],
  },
  {
    uuid: 'b0020003-sfx-wav-alien-talk-300000',
    key: 'sfx_alien_talk_3',
    type: 'sfx',
    localPath: '/assets/space/audio/sfx/alien-talk-3.wav',
    format: 'wav',
    description: 'Alien dialogue SFX 3',
    tags: ['alien', 'dialogue'],
  },
  {
    uuid: 'b0020004-sfx-wav-scream0000000000',
    key: 'sfx_scream',
    type: 'sfx',
    localPath: '/assets/space/audio/sfx/scream.wav',
    format: 'wav',
    description: 'Death/destruction scream',
    tags: ['death', 'dramatic'],
  },
  {
    uuid: 'b0020005-sfx-wav-start-level00000',
    key: 'sfx_start_level',
    type: 'sfx',
    localPath: '/assets/space/audio/sfx/start-level.wav',
    format: 'wav',
    description: 'Campaign start fanfare',
    tags: ['start', 'fanfare'],
  },
];

/** Resolve audio URL with CDN fallback. */
export function resolveAudioUrl(key: string): string {
  const entry = AUDIO_REGISTRY.find((a) => a.key === key);
  if (!entry) return '';
  if (CDN_BASE) return `${CDN_BASE}/audio/${entry.uuid}`;
  return entry.localPath;
}
