import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { blockParryVfx, type BlockVfxKind } from "../state/blockParryVfx";

const KIND_COLOR: Record<BlockVfxKind, number> = {
  block: 0x6ec8ff,
  parry: 0xffa040,
  rebound: 0xe8f4ff,
};

interface Burst {
  t: number;
  kind: BlockVfxKind;
  success: boolean;
  x: number;
  y: number;
  z: number;
}

const SPEED_LINE_COUNT = 10;

/**
 * Block / parry / weightless rebound contact VFX — sparks, shock rings, shield flash,
 * and anime-style radial speed lines at the parry contact point.
 */
export function BlockParryVfx() {
  const tokenRef = useRef(blockParryVfx.token);
  const burstRef = useRef<Burst | null>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const sparkGeom = useMemo(() => new THREE.BufferGeometry(), []);
  const sparkPos = useMemo(() => new Float32Array(96), []);
  const sparkVel = useRef(new Float32Array(96));
  const pointsRef = useRef<THREE.Points>(null);
  const speedLines = useRef<THREE.Mesh[]>([]);
  const speedGroupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (blockParryVfx.token !== tokenRef.current) {
      tokenRef.current = blockParryVfx.token;
      burstRef.current = {
        t: 1,
        kind: blockParryVfx.kind,
        success: blockParryVfx.success,
        x: blockParryVfx.x,
        y: blockParryVfx.y,
        z: blockParryVfx.z,
      };
      const color = KIND_COLOR[blockParryVfx.kind];
      const weightless = blockParryVfx.kind === "rebound" && blockParryVfx.success;
      const count = weightless ? 32 : 24;
      for (let i = 0; i < count; i++) {
        const o = i * 3;
        sparkPos[o] = blockParryVfx.x;
        sparkPos[o + 1] = blockParryVfx.y;
        sparkPos[o + 2] = blockParryVfx.z;
        const a = Math.random() * Math.PI * 2;
        const sp = blockParryVfx.success
          ? weightless
            ? 1.4 + Math.random() * 2.4
            : 2.6 + Math.random() * 2.2
          : 1.0 + Math.random() * 0.8;
        sparkVel.current[o] = Math.cos(a) * sp;
        sparkVel.current[o + 1] = weightless ? 2.2 + Math.random() * 2.8 : 0.35 + Math.random() * 1.5;
        sparkVel.current[o + 2] = Math.sin(a) * sp;
      }
      sparkGeom.setAttribute("position", new THREE.BufferAttribute(sparkPos.slice(0, count * 3), 3));
      sparkGeom.attributes.position.needsUpdate = true;

      if (ringRef.current) {
        ringRef.current.position.set(blockParryVfx.x, blockParryVfx.y - 0.55, blockParryVfx.z);
        (ringRef.current.material as THREE.MeshBasicMaterial).color.setHex(color);
      }
      if (ring2Ref.current) {
        ring2Ref.current.position.set(blockParryVfx.x, blockParryVfx.y - 0.52, blockParryVfx.z);
        (ring2Ref.current.material as THREE.MeshBasicMaterial).color.setHex(0xffffff);
        ring2Ref.current.visible = weightless;
      }
      if (shieldRef.current) {
        shieldRef.current.position.set(blockParryVfx.x, blockParryVfx.y, blockParryVfx.z);
        (shieldRef.current.material as THREE.MeshBasicMaterial).color.setHex(color);
      }
      if (flashRef.current) {
        flashRef.current.position.set(blockParryVfx.x, blockParryVfx.y, blockParryVfx.z);
        flashRef.current.visible = weightless;
      }
      if (speedGroupRef.current) {
        speedGroupRef.current.position.set(blockParryVfx.x, blockParryVfx.y, blockParryVfx.z);
        speedGroupRef.current.visible = weightless;
        for (let i = 0; i < SPEED_LINE_COUNT; i++) {
          const line = speedLines.current[i];
          if (!line) continue;
          const ang = (i / SPEED_LINE_COUNT) * Math.PI * 2;
          line.rotation.set(0, ang, 0);
          line.scale.set(0.15, 1, 0.04);
        }
      }
    }

    const b = burstRef.current;
    if (!b || b.t <= 0) {
      if (ringRef.current) ringRef.current.visible = false;
      if (ring2Ref.current) ring2Ref.current.visible = false;
      if (shieldRef.current) shieldRef.current.visible = false;
      if (flashRef.current) flashRef.current.visible = false;
      if (pointsRef.current) pointsRef.current.visible = false;
      if (speedGroupRef.current) speedGroupRef.current.visible = false;
      return;
    }

    const weightless = b.kind === "rebound" && b.success;
    b.t -= delta * (weightless ? 1.35 : b.success ? 2.2 : 3.0);
    const w = Math.max(0, b.t);
    const color = KIND_COLOR[b.kind];
    const grav = weightless ? -0.6 : -4;

    if (pointsRef.current) {
      pointsRef.current.visible = true;
      const count = sparkPos.length / 3;
      for (let i = 0; i < count; i++) {
        const o = i * 3;
        sparkPos[o] += sparkVel.current[o] * delta;
        sparkPos[o + 1] += sparkVel.current[o + 1] * delta;
        sparkPos[o + 2] += sparkVel.current[o + 2] * delta;
        sparkVel.current[o + 1] += grav * delta;
        if (weightless) {
          sparkVel.current[o] *= 1 - delta * 1.8;
          sparkVel.current[o + 2] *= 1 - delta * 1.8;
        }
      }
      sparkGeom.attributes.position.needsUpdate = true;
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      mat.opacity = w * (weightless ? 0.95 : 0.85);
      mat.color.setHex(color);
      mat.size = weightless ? 0.11 : 0.08;
    }

    if (ringRef.current) {
      ringRef.current.visible = true;
      const expand = weightless ? 3.6 : b.success ? 2.6 : 1.3;
      ringRef.current.scale.setScalar(0.5 + (1 - w) * expand);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = w * 0.6;
    }

    if (ring2Ref.current && weightless) {
      ring2Ref.current.visible = true;
      ring2Ref.current.scale.setScalar(0.3 + (1 - w) * 4.2);
      (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = w * 0.35;
    }

    if (shieldRef.current) {
      shieldRef.current.visible = b.kind === "block";
      shieldRef.current.scale.setScalar(0.85 + (1 - w) * 0.55);
      (shieldRef.current.material as THREE.MeshBasicMaterial).opacity = w * 0.45;
    }

    if (flashRef.current && weightless) {
      flashRef.current.visible = true;
      const pulse = 1 + Math.sin((1 - w) * 18) * 0.12;
      flashRef.current.scale.setScalar((0.4 + (1 - w) * 1.8) * pulse);
      (flashRef.current.material as THREE.MeshBasicMaterial).opacity = w * 0.55;
    }

    if (speedGroupRef.current && weightless) {
      speedGroupRef.current.visible = true;
      for (let i = 0; i < SPEED_LINE_COUNT; i++) {
        const line = speedLines.current[i];
        if (!line) continue;
        const stretch = 0.4 + (1 - w) * 3.5;
        line.scale.set(0.12 + (1 - w) * 0.2, stretch, 0.035);
        (line.material as THREE.MeshBasicMaterial).opacity = w * 0.7;
      }
    }
  });

  return (
    <group>
      <mesh ref={ringRef} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.3, 0.5, 36]} />
        <meshBasicMaterial color={0x6ec8ff} transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2Ref} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.55, 0.62, 36]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={shieldRef} visible={false}>
        <planeGeometry args={[0.95, 1.15]} />
        <meshBasicMaterial color={0x6ec8ff} transparent opacity={0.42} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={flashRef} visible={false}>
        <sphereGeometry args={[0.5, 16, 12]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={0.5} />
      </mesh>
      <group ref={speedGroupRef} visible={false}>
        {Array.from({ length: SPEED_LINE_COUNT }, (_, i) => (
          <mesh
            key={i}
            ref={(el) => {
              if (el) speedLines.current[i] = el;
            }}
            position={[0, 0, 0.35]}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={0xe8f4ff} transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
      <points ref={pointsRef} geometry={sparkGeom} visible={false}>
        <pointsMaterial size={0.08} transparent opacity={0.9} depthWrite={false} />
      </points>
    </group>
  );
}