import type { RapierContext } from "@react-three/rapier";
import { collision } from "./collisionGroups";

export interface WallHit {
  hit: boolean;
  x: number;
  y: number;
  z: number;
  nx: number;
  nz: number;
}

const scratchRay = { x: 0, y: 0, z: 0 };
const scratchDir = { x: 0, y: 0, z: 0 };

/** Horizontal ray against environment colliders (walls, rocks, buildings). */
export function probeWallHit(
  world: RapierContext["world"],
  rapier: RapierContext["rapier"],
  x: number,
  y: number,
  z: number,
  dirX: number,
  dirZ: number,
  maxDist = 2.2,
): WallHit {
  const d = Math.hypot(dirX, dirZ);
  if (d < 1e-4) return { hit: false, x, y, z, nx: 0, nz: 0 };
  scratchRay.x = x;
  scratchRay.y = y + 1.0;
  scratchRay.z = z;
  scratchDir.x = dirX / d;
  scratchDir.y = 0;
  scratchDir.z = dirZ / d;
  const ray = new rapier.Ray(scratchRay, scratchDir);
  const hit = world.castRay(ray, maxDist, true, undefined, collision.environment);
  if (!hit) return { hit: false, x, y, z, nx: 0, nz: 0 };
  const point = ray.pointAt(hit.timeOfImpact);
  return {
    hit: true,
    x: point.x,
    y: point.y,
    z: point.z,
    nx: -scratchDir.x,
    nz: -scratchDir.z,
  };
}