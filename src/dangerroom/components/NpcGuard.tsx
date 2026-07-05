import { useRef, useMemo, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import * as THREE from "three";
import { AnimatedModel } from "./AnimatedModel";
import { getTerrainHeight } from "../state/terrain";
import { collision } from "../physics/collisionGroups";
import { createBrain, stepBrain, type AiParams } from "../systems/enemyAI";
import type { NpcDef } from "../data/npcRoster";

const CAP_HALF = 0.6;
const CAP_RADIUS = 0.4;
const CAP_OFFSET = CAP_HALF + CAP_RADIUS;

/**
 * Ally guard — patrols near a town post; neutral disposition (won't chase player).
 */
export function NpcGuard({ npc }: { npc: NpcDef }) {
  const cur = useRef({ x: npc.x, z: npc.z });
  const brain = useRef(createBrain(npc.x, npc.z));
  const [moving, setMovingState] = useState(false);
  const movingRef = useRef(false);
  const setMoving = useCallback((v: boolean) => {
    if (v !== movingRef.current) {
      movingRef.current = v;
      setMovingState(v);
    }
  }, []);

  const aiParams = useMemo<AiParams>(
    () => ({
      disposition: "ally",
      aggroRange: 0,
      attackRange: 3,
      leash: npc.patrolRadius ?? 8,
      speed: 1.8,
      wanderRadius: npc.patrolRadius ?? 8,
      strikeCooldown: 99999,
      strikeDamage: 0,
    }),
    [npc.patrolRadius],
  );

  useFrame((_, delta) => {
    const now = performance.now();
    const step = stepBrain(
      brain.current,
      aiParams,
      cur.current.x,
      cur.current.z,
      npc.x,
      npc.z,
      cur.current.x,
      cur.current.z,
      now,
      true,
    );
    if (step.vx !== 0 || step.vz !== 0) {
      cur.current.x += step.vx * delta;
      cur.current.z += step.vz * delta;
    }
    setMoving(step.moving);
  });

  const groundY = getTerrainHeight(npc.x, npc.z);

  return (
    <RigidBody type="fixed" colliders={false} position={[cur.current.x, groundY + CAP_OFFSET, cur.current.z]}>
      <CapsuleCollider args={[CAP_HALF, CAP_RADIUS]} collisionGroups={collision.environment} />
      <group position={[0, -CAP_OFFSET, 0]} rotation={[0, npc.rotationY, 0]}>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.72, 32]} />
          <meshBasicMaterial color="#8fa6c4" transparent opacity={0.5} />
        </mesh>
        <AnimatedModel modelPath={npc.modelPath} moving={moving} />
        <Billboard position={[0, 2.4, 0]}>
          <Text fontSize={0.22} color="#fff" anchorX="center" outlineWidth={0.016} outlineColor="#000">
            {npc.label}
          </Text>
        </Billboard>
      </group>
    </RigidBody>
  );
}