import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { RigidBody, CuboidCollider, CylinderCollider } from "@react-three/rapier";
import { getTerrainHeight } from "../state/terrain";
import { collision } from "../physics/collisionGroups";
import type { KitPieceDef } from "../data/townAssets";
import { applyTint } from "../utils/applyTint";

interface KitPieceProps {
  url: string;
  piece: KitPieceDef;
  x: number;
  z: number;
  rotationY?: number;
  scaleJitter?: number;
  tint?: string;
}

/**
 * Extracts a single named node out of a kit GLB (a pack containing many buildings
 * / props in one file), bakes the kit's root transform so orientation survives the
 * detach, normalizes it to a target world height, rests it on the terrain, and
 * attaches a static collider. Mirrors GltfProp but for one piece of a shared kit.
 */
export function KitPiece({ url, piece, x, z, rotationY = 0, scaleJitter = 1, tint }: KitPieceProps) {
  const { scene } = useGLTF(url);

  const built = useMemo(() => {
    const src = scene.getObjectByName(piece.node);
    if (!src) return null;
    src.updateWorldMatrix(true, false);
    const obj = src.clone(true);
    // Bake the source's full world transform (captures kit-root rotation/scale
    // that would otherwise be lost by detaching the node from its parent).
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    src.matrixWorld.decompose(p, q, s);
    obj.quaternion.copy(q);
    obj.scale.copy(s);
    obj.position.set(0, 0, 0);
    obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    const sz = new THREE.Vector3();
    const ctr = new THREE.Vector3();
    box.getSize(sz);
    box.getCenter(ctr);
    obj.position.set(-ctr.x, -box.min.y, -ctr.z);
    const scale = (piece.height / (sz.y || 1)) * scaleJitter;
    if (tint) applyTint(obj, tint, 0.2);
    return { obj, scale, sz };
  }, [scene, piece.node, piece.height, scaleJitter, tint]);

  if (!built) return null;
  const { obj, scale, sz } = built;
  const y = getTerrainHeight(x, z);
  const hy = (sz.y * scale) / 2;
  const hx = (sz.x * scale) / 2;
  const hz = (sz.z * scale) / 2;
  const radius = Math.max(hx, hz) * 0.6;

  return (
    <RigidBody type="fixed" colliders={false} position={[x, y, z]} rotation={[0, rotationY, 0]}>
      <group scale={scale}>
        <primitive object={obj} />
      </group>
      {piece.collider === "box" && (
        <CuboidCollider
          args={[hx * 0.8, hy, hz * 0.8]}
          position={[0, hy, 0]}
          collisionGroups={collision.environment}
        />
      )}
      {piece.collider === "cylinder" && (
        <CylinderCollider
          args={[hy, Math.max(0.25, radius * 0.5)]}
          position={[0, hy, 0]}
          collisionGroups={collision.environment}
        />
      )}
    </RigidBody>
  );
}
