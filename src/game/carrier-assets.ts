/**
 * carrier-assets.ts — Carrier fleet hull + station asset manifest for Armada.
 *
 * Source of truth: F:\GitHub\Carrier\artifacts\carrier\src\game\factionAssets.ts
 * Served from R2 under `carrier/models/` (upload via GrudgeBuilder asset pipeline)
 * with local `/assets/carrier/models/` fallback during dev.
 *
 * Hull frame is the same resource as Carrier Shipyard / modelFit:
 * local +Z nose, +X starboard, +Y up, −Z boosters (`space-rig.ts` SHIP_AXES).
 * Carrier is the micro of Armada RTS (zones + carrier environments galaxy-wide).
 */

import { resolveUrl } from './asset-loader';
import type { CarrierFactionId } from './faction-sync';

export type DeployRole = 'miner' | 'scout' | 'corsair' | 'frigate' | 'cruiser' | 'dreadnought';

export const DEPLOY_ROLES: DeployRole[] = [
  'miner',
  'scout',
  'corsair',
  'frigate',
  'cruiser',
  'dreadnought',
];

export interface ShipModelRef {
  /** Path under carrier/models/ without extension. */
  id: string;
  yaw?: number;
}

/** CDN prefix for Carrier GLB/OBJ assets (separate from gruda-armada game bundle). */
const CARRIER_CDN_PREFIX = import.meta.env.VITE_CARRIER_CDN_PREFIX ?? 'carrier';

function carrierModelUrl(assetId: string, ext: 'glb' | 'obj' = 'glb'): string {
  const local = `/assets/carrier/models/${assetId}.${ext}`;
  const cdnBase = import.meta.env.VITE_ASSET_CDN as string | undefined;
  if (!cdnBase) return local;
  return `${cdnBase}/${CARRIER_CDN_PREFIX}/models/${assetId}.${ext}`;
}

export function resolveCarrierModelUrl(assetId: string, ext: 'glb' | 'obj' = 'glb'): string {
  const cdn = carrierModelUrl(assetId, ext);
  if (import.meta.env.VITE_ASSET_CDN) return cdn;
  return resolveUrl(`/assets/carrier/models/${assetId}.${ext}`);
}

export const FLEET_BY_FACTION: Record<CarrierFactionId, Record<DeployRole, ShipModelRef>> = {
  scavengers: {
    miner: { id: 'vehicles/space/fleet/skimmer', yaw: Math.PI },
    scout: { id: 'vehicles/space/fleet/camo-jet/camo-jet' },
    corsair: { id: 'vehicles/space/fighters/interceptor/interceptor' },
    frigate: { id: 'vehicles/space/fleet/transtellar/transtellar' },
    cruiser: { id: 'vehicles/space/raiders/spaceship-concept' },
    dreadnought: { id: 'vehicles/space/bombers/bomber/bomber' },
  },
  hollow: {
    miner: { id: 'vehicles/space/fleet/beamer' },
    scout: { id: 'vehicles/space/fleet/v-shooter' },
    corsair: { id: 'vehicles/space/raiders/raider-01' },
    frigate: { id: 'vehicles/space/raiders/raider-02' },
    cruiser: { id: 'vehicles/space/capital/cruiser-01' },
    dreadnought: { id: 'vehicles/space/capital/destroyer-01' },
  },
  network: {
    miner: { id: 'vehicles/space/fleet/cutter' },
    scout: { id: 'vehicles/space/fleet/tri-shot' },
    corsair: { id: 'vehicles/space/raiders/raider-03' },
    frigate: { id: 'vehicles/space/raiders/raider-04' },
    cruiser: { id: 'vehicles/space/capital/cruiser-02' },
    dreadnought: { id: 'vehicles/space/capital/destroyer-02' },
  },
  brood: {
    miner: { id: 'vehicles/space/brood/flesh-hive-worm' },
    scout: { id: 'vehicles/space/brood/delphi-recon-station' },
    corsair: { id: 'vehicles/space/brood/void-core' },
    frigate: { id: 'vehicles/space/brood/bloodvein-frigate' },
    cruiser: { id: 'vehicles/space/brood/hytri-cruiser' },
    dreadnought: { id: 'vehicles/space/brood/leviathan' },
  },
  prospector: {
    miner: { id: 'vehicles/space/fleet/twin-engine' },
    scout: { id: 'vehicles/space/fleet/the-ram' },
    corsair: { id: 'vehicles/space/fleet/scout' },
    frigate: { id: 'vehicles/space/raiders/simple-ship' },
    cruiser: { id: 'vehicles/space/raiders/spaceship-01' },
    dreadnought: { id: 'vehicles/space/raiders/spaceship' },
  },
};

export const FIGHTER_MODELS: { player: ShipModelRef; enemy: ShipModelRef } = {
  player: { id: 'vehicles/space/fighters/fighter-player', yaw: Math.PI },
  enemy: { id: 'vehicles/space/fighters/interceptor-red/interceptor-red' },
};

export interface StationModelRef {
  parts: string[];
  fitMul: number;
}

export const FACTION_STATIONS: Record<CarrierFactionId, StationModelRef> = {
  scavengers: { parts: ['environment/stations/techscavenger-pyramid/PyramidShips'], fitMul: 1.1 },
  hollow: {
    parts: [
      'environment/stations/hollowlords-station02/base/station02_base',
      'environment/stations/hollowlords-station02/ring/station02_ring',
    ],
    fitMul: 1.25,
  },
  network: {
    parts: [
      'environment/stations/network-station03/base/station03_base',
      'environment/stations/network-station03/dock/station03_dock',
      'environment/stations/network-station03/ring/station03_ring',
    ],
    fitMul: 1.0,
  },
  brood: { parts: ['environment/stations/broodmother-hive-queen/hive_queen'], fitMul: 1.2 },
  prospector: {
    parts: [
      'environment/stations/prospector-station05/base/station05',
      'environment/stations/prospector-station05/ring/station05_ring',
    ],
    fitMul: 1.3,
  },
};

export function fleetModelFor(faction: CarrierFactionId, role: DeployRole): ShipModelRef {
  return FLEET_BY_FACTION[faction][role];
}

export function fleetModelUrl(faction: CarrierFactionId, role: DeployRole): string {
  const ref = fleetModelFor(faction, role);
  return resolveCarrierModelUrl(ref.id);
}