import { useRef, useMemo, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { RigidBody, CapsuleCollider, useRapier, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import type { Group } from "three";
import { Character } from "./Character";
import { useGame } from "../state/gameStore";
import { worldPositions } from "../state/world";
import { getTerrainHeight } from "../state/terrain";
import { collision } from "../physics/collisionGroups";
import { sampleGroundY } from "../physics/heightfield";
import { factionAt } from "../state/zones";
import { createBrain, stepBrain, staggerBrain, type AiParams } from "../systems/enemyAI";
import { openParryWindow, combatParry, tryParry } from "../state/combatParry";
import {
  combatClash,
  clashActiveFor,
  clashBounceOffset,
  clashBlinkScale,
  clashTint,
} from "../state/combatClash";
import { isEnemyLaunched, launchEnemy, stepEnemyLaunch } from "../state/combatKnockback";
import { combatTimeScale } from "../state/devSettings";
import type { DummyState } from "../state/gameStore";
import type { DummySpawn } from "../state/world";

const CAP_HALF_HEIGHT = 0.6;
const CAP_RADIUS = 0.4;
const CAP_OFFSET = CAP_HALF_HEIGHT + CAP_RADIUS;
export function Dummy({ spawn }: { spawn: DummySpawn }) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const visualRef = useRef<Group>(null);
  const clashBase = useRef(new THREE.Vector3(0, -CAP_OFFSET, 0));
  const flashRef = useRef(0);
  const lastImpactAt = useRef(0);
  const { state, setTarget, receiveEnemyStrike, applyImpactDamage } = useGame();
  const { world, rapier } = useRapier();
  const dummy: DummyState | undefined = state.dummies[spawn.id];
  const isTarget = state.targetId === spawn.id;

  const cur = useRef({ x: spawn.x, z: spawn.z });
  const brain = useRef(createBrain(spawn.homeX, spawn.homeZ));
  const wasAlive = useRef(true);
  const lastStrikeAt = useRef(0);
  const [combatAnim, setCombatAnim] = useState<string | null>(null);

  const aiParams = useMemo<AiParams>(() => {
    const aggression = factionAt(spawn.homeX, spawn.homeZ).aggression || 1;
    const boss = spawn.id.startsWith("boss-");
    return {
      disposition: boss ? "boss" : "hostile",
      aggroRange: boss ? 18 : 12 + aggression * 4,
      attackRange: 3.0,
      leash: boss ? 48 : 34,
      speed: boss ? 3.2 : 2.4 + aggression * 1.2,
      wanderRadius: 6,
      strikeCooldown: boss ? 1600 : 2200,
      strikeDamage: boss ? 38 : 18 + aggression * 6,
    };
  }, [spawn.homeX, spawn.homeZ, spawn.id]);

  const [moving, setMovingState] = useState(false);
  const movingRef = useRef(false);
  const setMoving = useCallback((v: boolean) => {
    if (v !== movingRef.current) {
      movingRef.current = v;
      setMovingState(v);
    }
  }, []);

  useFrame((_, delta) => {
    const dt = delta * combatTimeScale();
    const rb = bodyRef.current;
    if (!rb || !dummy || !visualRef.current) return;

    const alive = dummy.alive;
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
    if (dummy.flashUntil > flashRef.current) flashRef.current = dummy.flashUntil;

    const now = performance.now();
    const launched = isEnemyLaunched(spawn.id);

    if (launched) {
      const step = stepEnemyLaunch(
        spawn.id,
        cur.current.x,
        cur.current.z,
        brain.current,
        world,
        rapier,
        dt,
        now,
      );
      if (step) {
        cur.current.x = step.x;
        cur.current.z = step.z;
        if (step.anim) setCombatAnim(step.anim);
        setMoving(false);
        if (step.wallDamage > 0 && now - lastImpactAt.current > 120) {
          lastImpactAt.current = now;
          applyImpactDamage(spawn.id, step.wallDamage, `${dummy.name} crashes into a wall for ${step.wallDamage}!`);
        }
        if (step.groundDamage > 0 && now - lastImpactAt.current > 120) {
          lastImpactAt.current = now;
          applyImpactDamage(spawn.id, step.groundDamage, `${dummy.name} slams into the ground for ${step.groundDamage}!`);
        }
        const bodyY =
          sampleGroundY(world, rapier, cur.current.x, cur.current.z, rb.translation().y + 12, getTerrainHeight) +
          CAP_OFFSET +
          step.y;
        rb.setNextKinematicTranslation({ x: cur.current.x, y: bodyY, z: cur.current.z });
        const groundY = bodyY - CAP_OFFSET;
        const wp = worldPositions.dummies.get(spawn.id);
        if (wp) wp.set(cur.current.x, groundY, cur.current.z);
        else worldPositions.dummies.set(spawn.id, new THREE.Vector3(cur.current.x, groundY, cur.current.z));
      }
    } else {
      const step = stepBrain(
        brain.current,
        aiParams,
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
        cur.current.x += step.vx * dt;
        cur.current.z += step.vz * dt;
      }
      setMoving(step.moving);

      if (step.telegraph && step.strikeAt > lastStrikeAt.current) {
        openParryWindow(spawn.id, step.strikeAt);
        setCombatAnim("sword_attack_a");
      }
      if (step.state !== "attack" && step.state !== "stagger" && !launched) setCombatAnim(null);

      if (step.strikeAt > 0 && now >= step.strikeAt && step.strikeAt !== lastStrikeAt.current) {
        lastStrikeAt.current = step.strikeAt;
        const dpx = worldPositions.player.x - cur.current.x;
        const dpz = worldPositions.player.z - cur.current.z;
        if (Math.hypot(dpx, dpz) <= aiParams.attackRange + 1.2) {
          if (combatParry.incomingStrikeFrom === spawn.id) tryParry(now);
          const wasParry = combatParry.parriedAttackerId === spawn.id;
          receiveEnemyStrike(spawn.id, spawn.name, step.strikeDamage);
          if (wasParry) {
            staggerBrain(brain.current, now, 1100);
            launchEnemy(spawn.id, -dpx, -dpz, 26, now);
            setCombatAnim("dodge");
          }
        }
      }

      const groundY = sampleGroundY(
        world,
        rapier,
        cur.current.x,
        cur.current.z,
        rb.translation().y + 8,
        getTerrainHeight,
      );
      rb.setNextKinematicTranslation({
        x: cur.current.x,
        y: groundY + CAP_OFFSET,
        z: cur.current.z,
      });

      const wp = worldPositions.dummies.get(spawn.id);
      if (wp) wp.set(cur.current.x, groundY, cur.current.z);
      else worldPositions.dummies.set(spawn.id, new THREE.Vector3(cur.current.x, groundY, cur.current.z));

      if (step.faceAngle !== null) {
        visualRef.current.rotation.y = THREE.MathUtils.damp(
          visualRef.current.rotation.y,
          step.faceAngle,
          8,
          dt,
        );
      }
    }

    if (clashActiveFor(spawn.id, now)) {
      const bounce = clashBounceOffset(spawn.id, now);
      visualRef.current.position.set(
        clashBase.current.x + combatClash.sepX * bounce,
        clashBase.current.y,
        clashBase.current.z + combatClash.sepZ * bounce,
      );
      visualRef.current.scale.setScalar(clashBlinkScale(now));
    } else {
      visualRef.current.position.copy(clashBase.current);
      visualRef.current.scale.setScalar(1);
    }
  });

  if (!dummy) return null;
  const hpFraction = dummy.hp / dummy.maxHp;
  const now = performance.now();
  const flashing = now < dummy.flashUntil;
  const clashFlash = clashTint(now);
  const modelPath = `${import.meta.env.BASE_URL}models/legion/${spawn.raceId}_${spawn.classId}.glb`;
  const spawnY = getTerrainHeight(spawn.x, spawn.z) + CAP_OFFSET;

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders={false}
      position={[spawn.x, spawnY, spawn.z]}
      enabledRotations={[false, false, false]}
      userData={{ dummyId: spawn.id, selectable: "hostile" }}
    >
      <CapsuleCollider args={[CAP_HALF_HEIGHT, CAP_RADIUS]} collisionGroups={collision.enemy} />
      <group
        ref={visualRef}
        position={[0, -CAP_OFFSET, 0]}
        onClick={(e) => {
          e.stopPropagation();
          if (dummy.alive) setTarget(spawn.id);
        }}
      >
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, isTarget ? 0.78 : 0.68, 32]} />
          <meshBasicMaterial color={isTarget ? "#ff5555" : "#5a4530"} transparent opacity={isTarget ? 0.9 : 0.45} />
        </mesh>
        <Character
          modelPath={modelPath}
          animation={combatAnim ?? (moving ? "walk" : "idle")}
          fallbackAnimation="idle"
          targetHeight={spawn.raceId === "orcs" ? 2 : undefined}
          tint={clashFlash ?? (flashing ? "#ff6666" : undefined)}
        />
        <Billboard position={[0, 2.5, 0]}>
          <Text fontSize={0.22} color="#fff" anchorX="center" anchorY="bottom" outlineWidth={0.015} outlineColor="#000">
            {dummy.name}
          </Text>
          <mesh position={[0, -0.18, 0]}>
            <planeGeometry args={[1.2, 0.14]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[-0.6 + (1.2 * hpFraction) / 2, -0.18, 0.001]}>
            <planeGeometry args={[1.2 * hpFraction, 0.11]} />
            <meshBasicMaterial color={hpFraction > 0.5 ? "#4caf50" : hpFraction > 0.2 ? "#f2b53d" : "#e0393e"} />
          </mesh>
        </Billboard>
      </group>
    </RigidBody>
  );
}