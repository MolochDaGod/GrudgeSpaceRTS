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

// ── Types ─────────────────────────────────────────────────────────
export type AssetFormat = 'obj' | 'fbx' | 'glb';
export type AssetCategory = 'ship' | 'station' | 'turret' | 'planet' | 'effect' | 'prop' | 'vehicle' | 'weapon' | 'sprite' | 'ui';

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
    return `${CDN_BASE}/models/${entry.cdnPath ?? entry.uuid}`;
  }
  return entry.localPath;
}

/** Resolve texture URL for an asset. */
export function resolveTextureUrl(key: string): string | undefined {
  const entry = _byKey.get(key);
  if (!entry?.texturePath) return undefined;
  if (CDN_BASE) {
    return `${CDN_BASE}/textures/${entry.uuid}`;
  }
  return entry.texturePath;
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
