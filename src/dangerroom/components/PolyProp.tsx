import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { RigidBody, CuboidCollider, CylinderCollider } from "@react-three/rapier";
import { getTerrainHeight } from "../state/terrain";
import { collision } from "../physics/collisionGroups";
import type { PolyModelDef } from "../data/polyhaven";

interface PolyPropProps {
  model: PolyModelDef;
  x: number;
  z: number;
  rotationY?: number;
  scaleJitter?: number;
}

/**
 * Poly Haven CC0 prop — height-normalized and terrain-snapped like GltfProp.
 */
export function PolyProp({ model, x, z, rotationY = 0, scaleJitter = 1 }: PolyPropProps) {
  const { scene } = useGLTF(model.url);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  const { scale, y } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const h = size.y || 1;
    const s = (model.height / h) * scaleJitter;
    const ground = getTerrainHeight(x, z);
    return { scale: s, y: ground };
  }, [cloned, model.height, scaleJitter, x, z]);

  const halfExtents = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    return [size.x * scale * 0.45, size.y * scale * 0.35, size.z * scale * 0.45] as [number, number, number];
  }, [cloned, scale]);

  return (
    <RigidBody type="fixed" colliders={false} position={[x, y, z]} rotation={[0, rotationY, 0]}>
      {model.collider === "cylinder" ? (
        <CylinderCollider
          args={[model.height * 0.35 * scaleJitter, model.height * 0.25 * scaleJitter]}
          collisionGroups={collision.environment}
        />
      ) : model.collider === "box" ? (
        <CuboidCollider
          args={halfExtents}
          position={[0, halfExtents[1], 0]}
          collisionGroups={collision.environment}
        />
      ) : null}
      <primitive object={cloned} scale={scale} collisionGroups={collision.environment} />
    </RigidBody>
  );
}