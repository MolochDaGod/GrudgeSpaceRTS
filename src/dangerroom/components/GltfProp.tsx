import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { RigidBody, CuboidCollider, CylinderCollider } from "@react-three/rapier";
import { getTerrainHeight } from "../state/terrain";
import { collision } from "../physics/collisionGroups";
import type { AssetDef } from "../data/worldAssets";
import { applyTint } from "../utils/applyTint";

interface GltfPropProps {
  asset: AssetDef;
  /** World XZ position; Y is sampled from the terrain height. */
  x: number;
  z: number;
  rotationY?: number;
  /** Extra uniform scale jitter applied on top of the height normalization. */
  scaleJitter?: number;
  castShadow?: boolean;
  tint?: string;
}

/**
 * Loads a real GLB from R2, normalizes it to a target world height (source models
 * arrive in wildly different native units), rests its feet on the terrain, and
 * attaches a static Rapier collider sized from the model's bounding box so the
 * player character controller and the melee shapecast interact with it.
 */
export function GltfProp({
  asset,
  x,
  z,
  rotationY = 0,
  scaleJitter = 1,
  castShadow = true,
  tint,
}: GltfPropProps) {
  const { scene } = useGLTF(asset.url);

  const { object, scale, size } = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const m = o as THREE.Mesh;
        m.castShadow = castShadow;
        m.receiveShadow = true;
      }
    });
    const box = new THREE.Box3().setFromObject(clone);
    const sz = new THREE.Vector3();
    const ctr = new THREE.Vector3();
    box.getSize(sz);
    box.getCenter(ctr);
    const naturalHeight = sz.y || 1;
    const s = (asset.height / naturalHeight) * scaleJitter;
    // Re-center on XZ and lift so the model's lowest point sits at local y=0.
    clone.position.set(-ctr.x, -box.min.y, -ctr.z);
    if (tint) applyTint(clone, tint, 0.28);
    void ctr;
    return { object: clone, scale: s, size: sz };
  }, [scene, asset.height, scaleJitter, castShadow, tint]);

  const y = getTerrainHeight(x, z);

  // Scaled collider half-extents from the model bounds.
  const hy = (size.y * scale) / 2;
  const hx = (size.x * scale) / 2;
  const hz = (size.z * scale) / 2;
  const radius = Math.max(hx, hz) * 0.6;

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={[x, y, z]}
      rotation={[0, rotationY, 0]}
    >
      <group scale={scale}>
        <primitive object={object} />
      </group>
      {asset.collider === "box" && (
        <CuboidCollider
          args={[hx * 0.85, hy, hz * 0.85]}
          position={[0, hy, 0]}
          collisionGroups={collision.environment}
        />
      )}
      {asset.collider === "cylinder" && (
        <CylinderCollider
          args={[hy, Math.max(0.25, radius * 0.4)]}
          position={[0, hy, 0]}
          collisionGroups={collision.environment}
        />
      )}
    </RigidBody>
  );
}
