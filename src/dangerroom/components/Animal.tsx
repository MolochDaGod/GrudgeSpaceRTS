import { useRef, useMemo, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { RigidBody, CapsuleCollider, useRapier, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import type { Group } from "three";
import { AnimatedModel } from "./AnimatedModel";
import { useGame } from "../state/gameStore";
import { worldPositions } from "../state/world";
import { getTerrainHeight } from "../state/terrain";
import { collision } from "../physics/collisionGroups";
import { sampleGroundY } from "../physics/heightfield";
import { createBrain, stepBrain, type AiParams } from "../systems/enemyAI";
import type { DummyState } from "../state/gameStore";
import { animalBySpecies } from "../data/animals";
import type { AnimalSpawn } from "../state/world";

const CAP_HALF = 0.35;
const CAP_RADIUS = 0.5;
const CAP_OFFSET = CAP_HALF + CAP_RADIUS;

// Passive wildlife: never aggro (aggroRange 0), just wander near home. Killable
// and targetable like a dummy; loot is handled by the animal-kill path in the store.
const ANIMAL_AI: AiParams = {
  disposition: "neutral",
  aggroRange: 0,
  attackRange: 0,
  leash: 60,
  speed: 1.7,
  wanderRadius: 9,
  strikeCooldown: 99999,
  strikeDamage: 0,
};

export function Animal({ spawn }: { spawn: AnimalSpawn }) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const visualRef = useRef<Group>(null);
  const { state, setTarget } = useGame();
  const { world, rapier } = useRapier();
  const entity: DummyState | undefined = state.dummies[spawn.id];
  const isTarget = state.targetId === spawn.id;

  const cur = useRef({ x: spawn.x, z: spawn.z });
  const brain = useRef(createBrain(spawn.homeX, spawn.homeZ));
  const wasAlive = useRef(true);

  const [moving, setMovingState] = useState(false);
  const movingRef = useRef(false);
  const setMoving = useCallback((v: boolean) => {
    if (v !== movingRef.current) {
      movingRef.current = v;
      setMovingState(v);
    }
  }, []);

  const spawnY = useMemo(() => getTerrainHeight(spawn.x, spawn.z) + CAP_OFFSET, [spawn.x, spawn.z]);
  const speciesDef = useMemo(() => animalBySpecies(spawn.species), [spawn.species]);

  useFrame((_, delta) => {
    const rb = bodyRef.current;
    if (!rb || !entity || !visualRef.current) return;

    const alive = entity.alive;
    if (alive !== wasAlive.current) {
      wasAlive.current = alive;
      rb.setEnabled(alive);
      if (alive) {
        cur.current.x = spawn.x;
        cur.current.z = spawn.z;
        brain.current = createBrain(spawn.homeX, spawn.homeZ);
      }
    }
    visualRef.current.visible = alive;

    const now = performance.now();
    const step = stepBrain(
      brain.current,
      ANIMAL_AI,
      cur.current.x,
      cur.current.z,
      spawn.homeX,
      spawn.homeZ,
      worldPositions.player.x,
      worldPositions.player.z,
      now,
      alive,
    );

    if (alive && (step.vx !== 0 || step.vz !== 0)) {
      cur.current.x += step.vx * delta;
      cur.current.z += step.vz * delta;
    }
    setMoving(step.moving);

    const groundY = sampleGroundY(
      world,
      rapier,
      cur.current.x,
      cur.current.z,
      rb.translation().y + 8,
      getTerrainHeight,
    );
    rb.setNextKinematicTranslation({ x: cur.current.x, y: groundY + CAP_OFFSET, z: cur.current.z });

    const wp = worldPositions.dummies.get(spawn.id);
    if (wp) wp.set(cur.current.x, groundY, cur.current.z);
    else worldPositions.dummies.set(spawn.id, new THREE.Vector3(cur.current.x, groundY, cur.current.z));

    if (step.faceAngle !== null) {
      visualRef.current.rotation.y = THREE.MathUtils.damp(
        visualRef.current.rotation.y,
        step.faceAngle,
        8,
        delta,
      );
    }
  });

  if (!entity) return null;
  const hpFraction = entity.hp / entity.maxHp;

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders={false}
      position={[spawn.x, spawnY, spawn.z]}
      enabledRotations={[false, false, false]}
      userData={{ dummyId: spawn.id }}
    >
      <CapsuleCollider args={[CAP_HALF, CAP_RADIUS]} collisionGroups={collision.enemy} />
      <group
        ref={visualRef}
        position={[0, -CAP_OFFSET, 0]}
        onClick={(e) => {
          e.stopPropagation();
          if (entity.alive) setTarget(spawn.id);
        }}
      >
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, isTarget ? 0.74 : 0.62, 28]} />
          <meshBasicMaterial color={isTarget ? "#ff5555" : "#6b8f4e"} transparent opacity={isTarget ? 0.9 : 0.4} />
        </mesh>
        <AnimatedModel
          modelPath={spawn.file}
          normalizeHeight={spawn.height}
          moving={moving}
          idleHints={speciesDef?.idleHints}
          moveHints={speciesDef?.moveHints}
        />
        <Billboard position={[0, spawn.height + 0.9, 0]}>
          <Text fontSize={0.2} color="#e6f0d8" anchorX="center" anchorY="bottom" outlineWidth={0.014} outlineColor="#000">
            {spawn.name}
          </Text>
          {isTarget && (
            <>
              <mesh position={[0, -0.16, 0]}>
                <planeGeometry args={[1.1, 0.12]} />
                <meshBasicMaterial color="#1a1a1a" />
              </mesh>
              <mesh position={[-0.55 + (1.1 * hpFraction) / 2, -0.16, 0.001]}>
                <planeGeometry args={[1.1 * hpFraction, 0.09]} />
                <meshBasicMaterial color={hpFraction > 0.5 ? "#8bc34a" : hpFraction > 0.2 ? "#f2b53d" : "#e0393e"} />
              </mesh>
            </>
          )}
        </Billboard>
      </group>
    </RigidBody>
  );
}
