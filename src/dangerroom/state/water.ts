import { SEA_LEVEL } from "./islands";
import { getTerrainHeight } from "./terrain";

/** Chest-deep surface swim — capsule center sits here while treading water. */
export const SWIM_SURFACE_BODY_Y = SEA_LEVEL - 0.42;
/** Max body Y while on the surface (prevents popping above the water plane). */
export const SWIM_CEILING_BODY_Y = SEA_LEVEL + 0.35;

export function terrainIsSubmerged(x: number, z: number): boolean {
  return getTerrainHeight(x, z) < SEA_LEVEL - 0.08;
}

export function sampleWaterState(x: number, z: number, bodyY: number) {
  const terrainH = getTerrainHeight(x, z);
  const submergedTerrain = terrainH < SEA_LEVEL - 0.08;
  const wading = bodyY < SEA_LEVEL + 0.12 && terrainH < SEA_LEVEL + 0.35;
  const swimming = submergedTerrain || wading;
  const floorBodyY = terrainH + 0.9;
  return { swimming, terrainH, floorBodyY, surfaceBodyY: SWIM_SURFACE_BODY_Y };
}