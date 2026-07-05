import type { HeightfieldArgs, RapierContext } from "@react-three/rapier";
import { collision } from "./collisionGroups";
import { CHUNK_SIZE, CHUNK_SEGMENTS, getTerrainHeight } from "../state/terrain";

/** Chunks around the player that receive a physics heightfield (±1 => 3×3). */
export const COLLIDE_CHUNK_RADIUS = 1;

/**
 * Build a single Rapier heightfield for a square of terrain chunks so the
 * collider is seamless (no trimesh gaps at chunk borders).
 */
export function buildHeightfieldForCenter(
  centerCx: number,
  centerCz: number,
): { args: HeightfieldArgs; position: [number, number, number] } {
  const chunkSpan = COLLIDE_CHUNK_RADIUS * 2 + 1;
  const subdivisions = CHUNK_SEGMENTS * chunkSpan;
  const worldSize = CHUNK_SIZE * chunkSpan;
  const minChunkX = centerCx - COLLIDE_CHUNK_RADIUS;
  const minChunkZ = centerCz - COLLIDE_CHUNK_RADIUS;
  const minX = minChunkX * CHUNK_SIZE;
  const minZ = minChunkZ * CHUNK_SIZE;

  const heights = new Float32Array((subdivisions + 1) * (subdivisions + 1));
  for (let col = 0; col <= subdivisions; col++) {
    for (let row = 0; row <= subdivisions; row++) {
      const wx = minX + (col / subdivisions) * worldSize;
      const wz = minZ + (row / subdivisions) * worldSize;
      // Rapier expects column-major storage.
      heights[row + col * (subdivisions + 1)] = getTerrainHeight(wx, wz);
    }
  }

  const args: HeightfieldArgs = [
    subdivisions,
    subdivisions,
    Array.from(heights),
    { x: worldSize, y: 1, z: worldSize },
  ];

  // Heightfield origin is at the patch center, not the corner.
  return { args, position: [minX + worldSize / 2, 0, minZ + worldSize / 2] };
}

/** Raycast down to the nearest physics surface; falls back to analytic terrain. */
export function sampleGroundY(
  world: RapierContext["world"],
  rapier: RapierContext["rapier"],
  x: number,
  z: number,
  startY: number,
  fallback: (x: number, z: number) => number,
): number {
  const ray = new rapier.Ray({ x, y: startY, z }, { x: 0, y: -1, z: 0 });
  const hit = world.castRay(ray, startY + 32, true, undefined, collision.environment);
  if (hit) {
    const point = ray.pointAt(hit.timeOfImpact);
    return point.y;
  }
  return fallback(x, z);
}