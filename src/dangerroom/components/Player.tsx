import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import {
  RigidBody,
  CapsuleCollider,
  useRapier,
  type RapierRigidBody,
} from "@react-three/rapier";
import * as THREE from "three";
import type { Group } from "three";
import { NexusToonCharacter } from "./NexusToonCharacter";
import { useGame } from "../state/gameStore";
import { getNexusToonByKey } from "../nexus/nexusToons";
import { worldPositions, cameraRig } from "../state/world";
import { combatAim, camForwardYaw } from "../state/combatAim";
import { getTerrainHeight } from "../state/terrain";
import { collision } from "../physics/collisionGroups";
import { WORLD_RADIUS } from "../state/islands";
import { SWIM_CEILING_BODY_Y, sampleWaterState } from "../state/water";
import { playerMode, harvestAnimForTool } from "../state/playerMode";
import { combatTimeScale } from "../state/devSettings";
import { combatParry } from "../state/combatParry";
import {
  combatClash,
  clashActiveFor,
  clashBounceOffset,
  clashBlinkScale,
} from "../state/combatClash";
import { probeWall, probeWallAbove } from "../systems/climbing";
import { buildMMImpulse, distanceBiasToTarget, doubleJumpMM } from "../state/mmScale";
import { Controls } from "../controls";

const JUMP_VELOCITY = 6.2;
const GRAVITY = 18;
const SWIM_RISE = 9;
const SWIM_SINK = 9;
const SWIM_BUOYANCY = 3.2;
const SWIM_DRAG = 0.88;
const SWIM_SPEED_MULT = 0.52;
const DODGE_SPEED = 13;
const DODGE_DURATION = 0.22;
const DODGE_COOLDOWN = 900;
const ROLL_SPEED = 11;
const ROLL_DURATION = 0.28;
const ROLL_COOLDOWN = 700;
const CLIMB_SPEED = 3.2;
const WALL_RUN_SPEED = 7.5;

// Kinematic capsule: 0.5 half-height + 0.4 radius => ~1.8m tall. The visual model
// is a child offset down by (halfHeight + radius) so its feet rest at capsule base.
const CAP_HALF_HEIGHT = 0.5;
const CAP_RADIUS = 0.4;
const CAP_OFFSET = CAP_HALF_HEIGHT + CAP_RADIUS;

// Forward swing sensor reach, sized to span the longest melee/dash ability so any
// of them can register a directional hit; each ability's own `range` then gates it.
const SWING_SENSOR_REACH = 8;

export function Player() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const visualRef = useRef<Group>(null);
  const visualBaseY = useRef(-CAP_OFFSET);
  const modelRef = useRef<Group | null>(null);
  const [, getState] = useKeyboardControls<Controls>();
  const { classDef, state } = useGame();
  const { camera } = useThree();
  const { world, rapier } = useRapier();

  const facing = useRef(new THREE.Vector3(0, 0, -1));
  const [currentAnim, setCurrentAnim] = useState("idle");
  const harvestUntil = useRef(0);
  const idleSince = useRef(0);
  const nextIdleVariantAt = useRef(0);
  const idleVariant = useRef<string | null>(null);

  const vVel = useRef(0);
  const grounded = useRef(true);
  const crouching = useRef(false);
  const dodging = useRef(false);
  const dodgeDir = useRef(new THREE.Vector3());
  const dodgeUntil = useRef(0);
  const dodgeReadyAt = useRef(0);
  const swimming = useRef(false);
  const rolling = useRef(false);
  const rollDir = useRef(new THREE.Vector3());
  const rollUntil = useRef(0);
  const rollReadyAt = useRef(0);
  const climbing = useRef(false);
  const wallRunning = useRef(false);
  const jumpHeld = useRef(false);
  const airJumps = useRef(0);
  const controllerRef = useRef<ReturnType<typeof world.createCharacterController> | null>(null);

  // Scratch objects reused each frame to avoid per-frame allocation.
  const playerPos = useRef(new THREE.Vector3(0, 0, 8));
  const moveDelta = useRef(new THREE.Vector3());
  const localMove = useRef(new THREE.Vector3());
  const worldMove = useRef(new THREE.Vector3());
  const focusVec = useRef(new THREE.Vector3());
  const desiredCam = useRef(new THREE.Vector3());
  const rightVec = useRef(new THREE.Vector3());
  const camFwd = useRef(new THREE.Vector3());

  const spawn = useMemo<[number, number, number]>(
    () => [0, getTerrainHeight(0, 8) + CAP_OFFSET, 8],
    [],
  );

  useEffect(() => {
    const controller = world.createCharacterController(0.08);
    controller.enableAutostep(0.5, 0.3, true);
    controller.enableSnapToGround(0.6);
    controller.setApplyImpulsesToDynamicBodies(true);
    controller.setMaxSlopeClimbAngle((55 * Math.PI) / 180);
    controller.setMinSlopeSlideAngle((35 * Math.PI) / 180);
    controllerRef.current = controller;
    return () => {
      world.removeCharacterController(controller);
      controllerRef.current = null;
    };
  }, [world]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "KeyF") {
        harvestUntil.current = performance.now() + 2200;
        playerMode.harvesting = true;
        playerMode.toolMode = "harvest";
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleModelReady = useCallback((group: Group) => {
    modelRef.current = group;
  }, []);

  useFrame((_, delta) => {
    const dt = delta * combatTimeScale();
    const rb = bodyRef.current;
    const controller = controllerRef.current;
    if (!rb || !controller || !classDef || !visualRef.current) return;

    const controls = getState();
    // WoW-style: WASD in camera space — W/S forward/back, A/D strafe.
    localMove.current.set(
      (controls.right ? 1 : 0) - (controls.left ? 1 : 0),
      0,
      (controls.back ? 1 : 0) - (controls.forward ? 1 : 0),
    );
    const now = performance.now();
    const moving = localMove.current.lengthSq() > 0;
    worldMove.current.set(0, 0, 0);
    if (moving) {
      localMove.current.normalize();
      worldMove.current.copy(localMove.current).applyAxisAngle(THREE.Object3D.DEFAULT_UP, cameraRig.yaw);
    }
    camFwd.current.set(Math.sin(cameraRig.yaw), 0, -Math.cos(cameraRig.yaw));
    crouching.current = controls.crouch;

    const t = rb.translation();
    const pos = playerPos.current.set(t.x, t.y - CAP_OFFSET, t.z);

    // Active target (click-select) world position, if alive.
    const activeDummy = state.targetId ? state.dummies[state.targetId] : undefined;
    const activePos =
      state.targetId && activeDummy && activeDummy.alive
        ? worldPositions.dummies.get(state.targetId) ?? null
        : null;

    // Dodge burst, biased toward the active target.
    if (controls.dodge && !dodging.current && now >= dodgeReadyAt.current) {
      dodging.current = true;
      dodgeUntil.current = now + DODGE_DURATION * 1000;
      dodgeReadyAt.current = now + DODGE_COOLDOWN;
      let dir: THREE.Vector3;
      if (activePos) {
        dir = new THREE.Vector3(activePos.x - pos.x, 0, activePos.z - pos.z);
        if (dir.lengthSq() < 1e-4) {
          dir = moving ? worldMove.current.clone() : camFwd.current.clone();
        }
      } else {
        dir = moving ? worldMove.current.clone() : camFwd.current.clone();
      }
      dodgeDir.current.copy(dir.normalize());
    }
    if (dodging.current && now > dodgeUntil.current) dodging.current = false;

    const jumpPressed = controls.jump && !jumpHeld.current;

    if (controls.roll && !rolling.current && !dodging.current && now >= rollReadyAt.current) {
      rolling.current = true;
      rollUntil.current = now + ROLL_DURATION * 1000;
      rollReadyAt.current = now + ROLL_COOLDOWN;
      rollDir.current.copy(moving ? worldMove.current : camFwd.current);
      if (rollDir.current.lengthSq() < 1e-4) rollDir.current.set(0, 0, -1);
      rollDir.current.normalize();
      playerMode.rolling = true;
    }
    if (rolling.current && now > rollUntil.current) {
      rolling.current = false;
      playerMode.rolling = false;
    }

    const faceAnglePre = visualRef.current.rotation.y;
    const fwdXPre = Math.sin(faceAnglePre);
    const fwdZPre = Math.cos(faceAnglePre);
    const bodyVec = playerPos.current.set(t.x, t.y - CAP_OFFSET, t.z);
    const wall = probeWall(world, rapier, bodyVec, fwdXPre, fwdZPre);

    if (!climbing.current && !grounded.current && wall.hit && controls.forward) {
      climbing.current = true;
      playerMode.climbing = true;
      vVel.current = 0;
    }
    if (climbing.current && probeWallAbove(world, rapier, bodyVec)) {
      climbing.current = false;
      playerMode.climbing = false;
      vVel.current = 2.5;
    }
    if (climbing.current && !wall.hit) {
      climbing.current = false;
      playerMode.climbing = false;
    }

    if (
      !grounded.current &&
      !climbing.current &&
      controls.jump &&
      wall.hit &&
      (controls.left || controls.right)
    ) {
      wallRunning.current = true;
      playerMode.wallRunning = true;
    }
    if (grounded.current || !controls.jump) {
      wallRunning.current = false;
      playerMode.wallRunning = false;
    }

    const delta3 = moveDelta.current.set(0, 0, 0);
    const rebounding = now < combatParry.reboundUntil;
    if (rebounding) {
      const left = (combatParry.reboundUntil - now) / 220;
      const ease = left * left;
      delta3.x += combatParry.reboundVx * ease * dt;
      delta3.z += combatParry.reboundVz * ease * dt;
      delta3.y += 1.8 * ease * dt;
    } else if (rolling.current) {
      delta3.x += rollDir.current.x * ROLL_SPEED * dt;
      delta3.z += rollDir.current.z * ROLL_SPEED * dt;
    } else if (dodging.current) {
      delta3.x += dodgeDir.current.x * DODGE_SPEED * dt;
      delta3.z += dodgeDir.current.z * DODGE_SPEED * dt;
    } else if (now < playerMode.mmImpulseUntil) {
      const left = (playerMode.mmImpulseUntil - now) / 300;
      const ease = left * left;
      delta3.x += playerMode.mmImpulseVx * ease * dt;
      delta3.z += playerMode.mmImpulseVz * ease * dt;
    } else if (moving) {
      const sprintMultiplier = controls.sprint && !crouching.current && !swimming.current ? 1.5 : 1;
      const crouchMultiplier = crouching.current ? 0.45 : 1;
      const swimMultiplier = swimming.current ? SWIM_SPEED_MULT : 1;
      const speed =
        classDef.moveSpeed *
        state.speedMultiplier *
        sprintMultiplier *
        crouchMultiplier *
        swimMultiplier;
      delta3.x += worldMove.current.x * speed * dt;
      delta3.z += worldMove.current.z * speed * dt;
      facing.current.copy(worldMove.current);
    }

    const water = sampleWaterState(t.x, t.z, t.y);
    swimming.current = water.swimming;
    worldPositions.playerInWater = water.swimming;
    controller.enableSnapToGround(water.swimming ? 0 : 0.6);

    if (water.swimming) {
      if (controls.jump) vVel.current += SWIM_RISE * dt;
      if (controls.descend) vVel.current -= SWIM_SINK * dt;
      vVel.current += (water.surfaceBodyY - t.y) * SWIM_BUOYANCY * dt;
      vVel.current *= SWIM_DRAG;
      vVel.current = THREE.MathUtils.clamp(vVel.current, -5.5, 5.5);
      grounded.current = false;
    } else if (climbing.current) {
      grounded.current = false;
      if (controls.forward || controls.jump) vVel.current = CLIMB_SPEED;
      else if (controls.back) vVel.current = -CLIMB_SPEED * 0.6;
      else vVel.current *= 0.85;
    } else if (wallRunning.current) {
      grounded.current = false;
      vVel.current = Math.max(vVel.current, -1.5);
      const strafeX = controls.left ? -1 : controls.right ? 1 : 0;
      if (strafeX !== 0) {
        delta3.x += strafeX * WALL_RUN_SPEED * dt * fwdZPre;
        delta3.z += -strafeX * WALL_RUN_SPEED * dt * fwdXPre;
      }
    } else if (jumpPressed) {
      if (grounded.current && vVel.current <= 0.01) {
        vVel.current = JUMP_VELOCITY;
        airJumps.current = 1;
      } else if (airJumps.current === 1 && vVel.current > -2) {
        vVel.current = JUMP_VELOCITY * 0.92;
        airJumps.current = 2;
        const bias = distanceBiasToTarget(state.targetId);
        const mm = doubleJumpMM(bias, 1);
        playerMode.lastMM = mm;
        const impulse = buildMMImpulse(mm, state.targetId, now, 320);
        if (impulse) {
          playerMode.mmImpulseVx = impulse.vx;
          playerMode.mmImpulseVz = impulse.vz;
          playerMode.mmImpulseUntil = impulse.until;
        }
      }
    }
    if (grounded.current) airJumps.current = 0;
    jumpHeld.current = controls.jump;
    if (!water.swimming) {
      vVel.current -= GRAVITY * dt;
      if (vVel.current < -40) vVel.current = -40;
    }
    delta3.y = vVel.current * dt;

    // Resolve movement against colliders (terrain, props, buildings, enemies).
    const collider = rb.collider(0);
    controller.computeColliderMovement(collider, delta3);
    const corrected = controller.computedMovement();
    if (!water.swimming) {
      grounded.current = controller.computedGrounded();
      if (grounded.current && vVel.current < 0) vVel.current = 0;
    }

    // Clamp horizontal position to the playable world radius so the player can't
    // wander off the 5 km archipelago into the endless open ocean.
    let nx = t.x + corrected.x;
    let nz = t.z + corrected.z;
    const distC = Math.hypot(nx, nz);
    if (distC > WORLD_RADIUS) {
      const s = WORLD_RADIUS / distC;
      nx *= s;
      nz *= s;
    }

    let ny = t.y + corrected.y;
    if (now < playerMode.aerialSlamUntil) {
      const left = (playerMode.aerialSlamUntil - now) / 520;
      ny += Math.sin((1 - left) * Math.PI) * 1.6 * left;
    }
    if (water.swimming) {
      const floorY = water.floorBodyY;
      const ceilingY = SWIM_CEILING_BODY_Y;
      ny = THREE.MathUtils.clamp(ny, floorY, ceilingY);
      if (
        !controls.jump &&
        !controls.descend &&
        Math.abs(ny - water.surfaceBodyY) < 0.2 &&
        Math.abs(vVel.current) < 0.35
      ) {
        vVel.current = 0;
      }
    }

    rb.setNextKinematicTranslation({ x: nx, y: ny, z: nz });

    // Facing: strafe-lock (RMB orbit / hard focus) keeps body on camera-forward;
    // otherwise face travel heading; stationary + target still snaps to the foe.
    const strafeLock = combatAim.focusEnabled || combatAim.rmbHeld || cameraRig.freeLooking;
    let desiredAngle: number | null = null;
    if (activePos && !moving && !strafeLock) {
      const dx = activePos.x - pos.x;
      const dz = activePos.z - pos.z;
      if (dx * dx + dz * dz > 1e-4) desiredAngle = Math.atan2(dx, dz);
    } else if (strafeLock) {
      desiredAngle = camForwardYaw(cameraRig.yaw);
    } else if (moving) {
      desiredAngle = Math.atan2(facing.current.x, facing.current.z);
    }
    if (desiredAngle !== null) {
      visualRef.current.rotation.y = THREE.MathUtils.damp(
        visualRef.current.rotation.y,
        desiredAngle,
        10,
        dt,
      );
    }

    // Publish feet position + facing for combat systems. Uses the world-clamped
    // nx/nz so camera + combat targeting stay in sync with the physics body.
    const feetY = ny - CAP_OFFSET;
    worldPositions.player.set(nx, feetY, nz);
    worldPositions.playerFacingAngle = visualRef.current.rotation.y;
    combatAim.softLock = Boolean(state.targetId && !combatAim.focusEnabled);
    playerMode.softTargetId = state.targetId;

    // Forward swing sensor: mark which dummies sit in the player's forward arc,
    // using the authoritative facing angle so a stationary player rotated toward a
    // target still swings the right way. Per-ability reach is gated in useAbility.
    worldPositions.meleeHits.clear();
    const faceAngle = visualRef.current.rotation.y;
    const fwdX = Math.sin(faceAngle);
    const fwdZ = Math.cos(faceAngle);
    const fx = worldPositions.player.x + fwdX * SWING_SENSOR_REACH * 0.5;
    const fz = worldPositions.player.z + fwdZ * SWING_SENSOR_REACH * 0.5;
    const ball = new rapier.Ball(SWING_SENSOR_REACH * 0.5);
    world.intersectionsWithShape(
      { x: fx, y: worldPositions.player.y + 1, z: fz },
      { x: 0, y: 0, z: 0, w: 1 },
      ball,
      (other) => {
        const parent = other.parent();
        const data = parent?.userData as { dummyId?: string } | undefined;
        if (data && typeof data.dummyId === "string") {
          worldPositions.meleeHits.add(data.dummyId);
        }
        return true;
      },
      undefined,
      collision.enemy,
    );

    // Over-the-shoulder, collision-aware camera. Yaw / pitch / distance are driven
    // by the mouse (see CameraControls); the rig no longer auto-trails the player's
    // facing, which is what made the old camera drift around the character.
    const focus = focusVec.current.set(
      worldPositions.player.x,
      worldPositions.player.y + cameraRig.height,
      worldPositions.player.z,
    );
    const horiz = cameraRig.distance * Math.cos(cameraRig.pitch);
    const right = rightVec.current
      .set(Math.cos(cameraRig.yaw), 0, -Math.sin(cameraRig.yaw))
      .multiplyScalar(cameraRig.shoulder);
    const focusS = focus.clone().add(right);
    const desired = desiredCam.current
      .set(
        horiz * Math.sin(cameraRig.yaw),
        cameraRig.distance * Math.sin(cameraRig.pitch),
        horiz * Math.cos(cameraRig.yaw),
      )
      .add(focusS);

    // Pull the camera in if world geometry occludes the view of the player.
    const dir = desired.clone().sub(focusS);
    const len = dir.length();
    if (len > 1e-3) {
      dir.multiplyScalar(1 / len);
      const ray = new rapier.Ray(focusS, dir);
      const hit = world.castRay(ray, len, true, undefined, collision.environment, undefined, rb);
      if (hit) {
        const toi = hit.timeOfImpact;
        const d = Math.max(0.8, toi - 0.3);
        desired.copy(focusS).add(dir.multiplyScalar(d));
      }
    }

    if (cameraRig.recenterRequested) {
      camera.position.copy(desired);
      cameraRig.recenterRequested = false;
    } else {
      const smoothing = cameraRig.freeLooking
        ? 1 - Math.pow(0.00001, dt)
        : 1 - Math.pow(0.001, dt);
      camera.position.lerp(desired, smoothing);
    }
    camera.lookAt(focusS.x, focusS.y, focusS.z);

    // Animation selection.
    const airborne = !grounded.current && !swimming.current;
    const wantAttackAnim = now < state.swingUntil ? state.lastAbilityAnimation : null;
    const harvestClip =
      playerMode.toolMode === "harvest"
        ? harvestAnimForTool(playerMode.harvestTool)
        : "harvest";
    const wantHarvestAnim =
      !wantAttackAnim &&
      !swimming.current &&
      (now < harvestUntil.current || playerMode.harvesting)
        ? harvestClip
        : null;
    if (now >= harvestUntil.current) playerMode.harvesting = false;
    const wantRollAnim = rolling.current ? "dodge" : null;
    const wantDodgeAnim = dodging.current ? "dodge" : null;
    const wantClimbAnim = climbing.current ? "wall_climb" : null;
    const wantWallRunAnim = wallRunning.current ? "wall_run" : null;
    const wantSwimAnim = swimming.current && !wantAttackAnim ? "swim" : null;
    const parrying = now < playerMode.parryUntil;
    const wantBlockAnim =
      (playerMode.blocking || parrying) && !wantAttackAnim && !swimming.current ? "sword_block" : null;
    const sprinting =
      moving &&
      controls.sprint &&
      !crouching.current &&
      !swimming.current &&
      !rolling.current &&
      !dodging.current;
    const locomotionClip = sprinting
      ? (classDef.sprintRunAnimation ?? classDef.runAnimation)
      : classDef.runAnimation;
    const wantJumpAnim = airborne ? locomotionClip : null;

    let idleAnim = classDef.idleAnimation;
    if (
      moving ||
      wantAttackAnim ||
      wantHarvestAnim ||
      wantRollAnim ||
      wantDodgeAnim ||
      wantClimbAnim ||
      wantWallRunAnim ||
      wantJumpAnim ||
      wantSwimAnim ||
      wantBlockAnim
    ) {
      idleSince.current = 0;
      idleVariant.current = null;
    } else {
      if (idleSince.current === 0) {
        idleSince.current = now;
        nextIdleVariantAt.current = now + 6000 + Math.random() * 5000;
      }
      const variants =
        classDef.idleAnimations && classDef.idleAnimations.length > 0
          ? classDef.idleAnimations
          : [classDef.idleAnimation];
      if (now >= nextIdleVariantAt.current && variants.length > 1) {
        const choices = variants.filter((v) => v !== idleVariant.current);
        idleVariant.current = choices[Math.floor(Math.random() * choices.length)] ?? variants[0];
        nextIdleVariantAt.current = now + 6000 + Math.random() * 5000;
      }
      idleAnim = idleVariant.current ?? classDef.idleAnimation;
    }

    const nextAnim =
      wantAttackAnim ??
      wantRollAnim ??
      wantDodgeAnim ??
      wantClimbAnim ??
      wantWallRunAnim ??
      wantHarvestAnim ??
      wantBlockAnim ??
      wantSwimAnim ??
      (moving || wantJumpAnim ? locomotionClip : idleAnim);
    if (nextAnim !== currentAnim) setCurrentAnim(nextAnim);

    if (visualRef.current) {
      if (clashActiveFor("player", now)) {
        const bounce = clashBounceOffset("player", now);
        visualRef.current.position.set(
          combatClash.sepX * bounce,
          visualBaseY.current,
          combatClash.sepZ * bounce,
        );
        visualRef.current.scale.setScalar(clashBlinkScale(now));
      } else {
        visualRef.current.position.set(0, visualBaseY.current, 0);
        visualRef.current.scale.setScalar(1);
      }
    }
  });

  if (!classDef || !state.raceId) return null;

  // raceId stores Nexus toon key `gender:bodyId` (e.g. male:adventurer)
  const toon = getNexusToonByKey(state.raceId);
  const toonKey = toon ? state.raceId : "male:adventurer";

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders={false}
      position={spawn}
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider
        args={[CAP_HALF_HEIGHT, CAP_RADIUS]}
        collisionGroups={collision.player}
      />
      <group ref={visualRef} position={[0, -CAP_OFFSET, 0]}>
        <NexusToonCharacter
          toonKey={toonKey}
          animation={currentAnim}
          animationSeq={currentAnim === state.lastAbilityAnimation ? state.swingSeq : 0}
          fallbackAnimation="idle"
          onGroupReady={handleModelReady}
          targetHeight={1.75}
        />
      </group>
    </RigidBody>
  );
}
