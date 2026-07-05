import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { groundImpactVfx, wallImpactVfx } from "../state/impactVfx";

interface GroundBurst {
  t: number;
  x: number;
  y: number;
  z: number;
  power: number;
}

interface WallBurst {
  t: number;
  x: number;
  y: number;
  z: number;
  nx: number;
  nz: number;
  power: number;
}

/**
 * Ground slam / wall crash VFX — expanding shock rings, dust plume, spark burst.
 * Plays on heavy knockback landings and wall collisions (anime ground explode).
 */
export function ImpactVfx() {
  const groundToken = useRef(groundImpactVfx.token);
  const wallToken = useRef(wallImpactVfx.token);
  const groundBurst = useRef<GroundBurst | null>(null);
  const wallBurst = useRef<WallBurst | null>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const wallRingRef = useRef<THREE.Mesh>(null);
  const dustRef = useRef<THREE.Points>(null);
  const dustPos = useMemo(() => new Float32Array(48), []);
  const dustVel = useRef(new Float32Array(48));
  const dustGeom = useMemo(() => new THREE.BufferGeometry(), []);

  useFrame((_, delta) => {
    if (groundImpactVfx.token !== groundToken.current) {
      groundToken.current = groundImpactVfx.token;
      groundBurst.current = {
        t: 1,
        x: groundImpactVfx.x,
        y: groundImpactVfx.y,
        z: groundImpactVfx.z,
        power: groundImpactVfx.power,
      };
      for (let i = 0; i < 16; i++) {
        const o = i * 3;
        dustPos[o] = groundImpactVfx.x;
        dustPos[o + 1] = groundImpactVfx.y + 0.1;
        dustPos[o + 2] = groundImpactVfx.z;
        const a = Math.random() * Math.PI * 2;
        const sp = 1.5 + Math.random() * 2.5 * groundImpactVfx.power;
        dustVel.current[o] = Math.cos(a) * sp;
        dustVel.current[o + 1] = 0.8 + Math.random() * 2.2;
        dustVel.current[o + 2] = Math.sin(a) * sp;
      }
      dustGeom.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
      if (ringRef.current) ringRef.current.position.set(groundImpactVfx.x, groundImpactVfx.y + 0.05, groundImpactVfx.z);
      if (ring2Ref.current) ring2Ref.current.position.set(groundImpactVfx.x, groundImpactVfx.y + 0.08, groundImpactVfx.z);
    }

    if (wallImpactVfx.token !== wallToken.current) {
      wallToken.current = wallImpactVfx.token;
      wallBurst.current = {
        t: 1,
        x: wallImpactVfx.x,
        y: wallImpactVfx.y,
        z: wallImpactVfx.z,
        nx: wallImpactVfx.nx,
        nz: wallImpactVfx.nz,
        power: wallImpactVfx.power,
      };
      if (wallRingRef.current) {
        wallRingRef.current.position.set(wallImpactVfx.x, wallImpactVfx.y, wallImpactVfx.z);
        wallRingRef.current.lookAt(
          wallImpactVfx.x + wallImpactVfx.nx,
          wallImpactVfx.y,
          wallImpactVfx.z + wallImpactVfx.nz,
        );
      }
    }

    const gb = groundBurst.current;
    if (gb && gb.t > 0) {
      gb.t -= delta * 2.2;
      const w = Math.max(0, gb.t);
      const expand = 0.4 + (1 - w) * (3.2 + gb.power * 1.8);
      if (ringRef.current) {
        ringRef.current.visible = true;
        ringRef.current.scale.setScalar(expand);
        (ringRef.current.material as THREE.MeshBasicMaterial).opacity = w * 0.7;
      }
      if (ring2Ref.current) {
        ring2Ref.current.visible = true;
        ring2Ref.current.scale.setScalar(expand * 0.65);
        (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = w * 0.45;
      }
      if (dustRef.current) {
        dustRef.current.visible = true;
        for (let i = 0; i < 16; i++) {
          const o = i * 3;
          dustPos[o] += dustVel.current[o] * delta;
          dustPos[o + 1] += dustVel.current[o + 1] * delta;
          dustPos[o + 2] += dustVel.current[o + 2] * delta;
          dustVel.current[o + 1] -= 5 * delta;
        }
        dustGeom.attributes.position.needsUpdate = true;
        (dustRef.current.material as THREE.PointsMaterial).opacity = w * 0.85;
      }
    } else {
      if (ringRef.current) ringRef.current.visible = false;
      if (ring2Ref.current) ring2Ref.current.visible = false;
      if (dustRef.current) dustRef.current.visible = false;
    }

    const wb = wallBurst.current;
    if (wb && wb.t > 0) {
      wb.t -= delta * 3;
      const w = Math.max(0, wb.t);
      if (wallRingRef.current) {
        wallRingRef.current.visible = true;
        wallRingRef.current.scale.setScalar(0.5 + (1 - w) * 2.2);
        (wallRingRef.current.material as THREE.MeshBasicMaterial).opacity = w * 0.75;
      }
    } else if (wallRingRef.current) {
      wallRingRef.current.visible = false;
    }
  });

  return (
    <group>
      <mesh ref={ringRef} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.25, 0.55, 32]} />
        <meshBasicMaterial color={0xffc96a} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2Ref} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.5, 0.58, 32]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={wallRingRef} visible={false}>
        <ringGeometry args={[0.2, 0.45, 24]} />
        <meshBasicMaterial color={0xff8a5a} transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>
      <points ref={dustRef} geometry={dustGeom} visible={false}>
        <pointsMaterial size={0.14} color={0xd4a86a} transparent opacity={0.85} depthWrite={false} />
      </points>
    </group>
  );
}