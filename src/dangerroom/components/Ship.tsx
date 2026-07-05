import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { getTerrainHeight } from "../state/terrain";
import { SEA_LEVEL } from "../state/islands";
import { collision } from "../physics/collisionGroups";

const SHIP_BASE = `${import.meta.env.BASE_URL}ship/`;

/** Docked player ship — sail states cycle on water; E near dock toggles sailing (scaffold). */
export function Ship({ x = -55, z = 12 }: { x?: number; z?: number }) {
  const hull = useGLTF(`${SHIP_BASE}state_0.glb`);
  const sails = useGLTF(`${SHIP_BASE}state_1.glb`);

  const y = useMemo(() => Math.max(SEA_LEVEL + 0.15, getTerrainHeight(x, z)), [x, z]);
  const cloned = useMemo(() => {
    const g = new THREE.Group();
    g.add(hull.scene.clone(true));
    g.add(sails.scene.clone(true));
    return g;
  }, [hull.scene, sails.scene]);

  return (
    <RigidBody type="fixed" colliders={false} position={[x, y, z]} rotation={[0, Math.PI / 6, 0]}>
      <CuboidCollider args={[3.5, 2.2, 8]} position={[0, 2, 0]} collisionGroups={collision.environment} />
      <primitive object={cloned} scale={2.2} />
    </RigidBody>
  );
}