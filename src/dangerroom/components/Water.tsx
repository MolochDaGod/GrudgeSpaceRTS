import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { WORLD_HALF, WORLD_SIZE, SEA_LEVEL } from "../state/islands";
import { collision } from "../physics/collisionGroups";

/**
 * Ocean surface visual + a sensor volume at sea level so Rapier tracks water
 * overlap. Swim physics are driven in Player.tsx from terrain height + this
 * volume; the sensor tags the water layer for future buoyancy hooks.
 */
export function Water() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, SEA_LEVEL - 0.05, 0]} receiveShadow>
        <planeGeometry args={[WORLD_SIZE * 1.3, WORLD_SIZE * 1.3]} />
        <meshStandardMaterial
          color="#2c6178"
          transparent
          opacity={0.74}
          roughness={0.2}
          metalness={0.15}
        />
      </mesh>
      <RigidBody type="fixed" colliders={false} userData={{ waterVolume: true }}>
        <CuboidCollider
          args={[WORLD_HALF, 2.5, WORLD_HALF]}
          position={[0, SEA_LEVEL - 1.25, 0]}
          sensor
          collisionGroups={collision.environment}
        />
      </RigidBody>
    </>
  );
}