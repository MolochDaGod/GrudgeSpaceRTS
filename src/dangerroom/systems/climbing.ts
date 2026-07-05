import * as THREE from "three";
import type { RapierContext } from "@react-three/rapier";
import { collision } from "../physics/collisionGroups";

const probeDir = new THREE.Vector3();
const chest = new THREE.Vector3();

export interface ClimbProbe {
  hit: boolean;
  wallNormal: THREE.Vector3;
  wallPoint: THREE.Vector3;
}

export function probeWall(
  world: RapierContext["world"],
  rapier: RapierContext["rapier"],
  pos: THREE.Vector3,
  facingX: number,
  facingZ: number,
  maxDist = 1.4,
): ClimbProbe {
  const none = { hit: false, wallNormal: new THREE.Vector3(), wallPoint: new THREE.Vector3() };
  probeDir.set(facingX, 0, facingZ).normalize();
  if (probeDir.lengthSq() < 1e-4) return none;

  chest.set(pos.x, pos.y + 1.1, pos.z);
  const ray = new rapier.Ray(chest, { x: probeDir.x, y: 0, z: probeDir.z });
  const hit = world.castRay(ray, maxDist, true, undefined, collision.environment);
  if (!hit) return none;

  const point = ray.pointAt(hit.timeOfImpact);
  return {
    hit: true,
    wallNormal: probeDir.clone().negate(),
    wallPoint: new THREE.Vector3(point.x, point.y, point.z),
  };
}

export function probeWallAbove(
  world: RapierContext["world"],
  rapier: RapierContext["rapier"],
  pos: THREE.Vector3,
): boolean {
  const ray = new rapier.Ray({ x: pos.x, y: pos.y + 1.6, z: pos.z }, { x: 0, y: 1, z: 0 });
  const hit = world.castRay(ray, 1.2, true, undefined, collision.environment);
  return !hit;
}