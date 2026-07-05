import { useMemo } from "react";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { getTerrainHeight } from "../state/terrain";
import { collision } from "../physics/collisionGroups";
import { devSettings } from "../state/devSettings";

/** Invisible cliff barriers so launched enemies can wall-splat near training zones. */
export function ArenaWalls() {
  const walls = useMemo(
    () => [
      { x: 32, z: 0, sx: 2, sz: 48 },
      { x: -32, z: 0, sx: 2, sz: 48 },
      { x: 0, z: 32, sx: 48, sz: 2 },
      { x: 0, z: -32, sx: 48, sz: 2 },
    ],
    [],
  );

  return (
    <group>
      {walls.map((w, i) => {
        const y = getTerrainHeight(w.x, w.z);
        return (
          <RigidBody
            key={i}
            type="fixed"
            colliders={false}
            position={[w.x, y + 3, w.z]}
            collisionGroups={collision.environment}
          >
            <CuboidCollider
              args={[w.sx / 2, 3, w.sz / 2]}
              collisionGroups={collision.environment}
            />
            {import.meta.env.DEV && devSettings.showArenaWalls && (
              <mesh>
                <boxGeometry args={[w.sx, 6, w.sz]} />
                <meshBasicMaterial color={0x6fe0ff} transparent opacity={0.12} wireframe />
              </mesh>
            )}
          </RigidBody>
        );
      })}
    </group>
  );
}