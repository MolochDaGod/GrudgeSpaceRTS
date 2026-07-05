import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { combatAim } from "../state/combatAim";
import { playerMode } from "../state/playerMode";
import { worldPositions } from "../state/world";

const LOCKED = "#ffd27f";
const HOSTILE = "#ff5d5d";
const PULSE_SPEED = 4;

/** Pulsing ground + chest rings on the soft-lock target (reference image soft state). */
export function TargetHighlight() {
  const groundRing = useRef<THREE.Mesh>(null);
  const chestRing = useRef<THREE.Mesh>(null);
  const pulse = useRef(0);

  useFrame((_, delta) => {
    const g = groundRing.current;
    const c = chestRing.current;

    if (!combatAim.softLock || !playerMode.softTargetId) {
      if (g) g.visible = false;
      if (c) c.visible = false;
      return;
    }

    const lock = worldPositions.dummies.get(playerMode.softTargetId);
    if (!lock || !g || !c) {
      if (g) g.visible = false;
      if (c) c.visible = false;
      return;
    }

    g.visible = true;
    c.visible = true;
    pulse.current += delta * PULSE_SPEED;
    const t = 0.78 + Math.sin(pulse.current) * 0.12;
    const dist = Math.hypot(lock.x - worldPositions.player.x, lock.z - worldPositions.player.z);
    const color = new THREE.Color(combatAim.focusEnabled || dist > 14 ? HOSTILE : LOCKED);

    g.position.set(lock.x, lock.y + 0.05, lock.z);
    g.rotation.x = -Math.PI / 2;
    g.scale.setScalar(1.15 * t);
    (g.material as THREE.MeshBasicMaterial).color.copy(color);
    (g.material as THREE.MeshBasicMaterial).opacity =
      0.55 + Math.sin(pulse.current * 1.4) * 0.15;

    c.position.set(lock.x, lock.y + 1.35, lock.z);
    c.rotation.x = -Math.PI / 2;
    c.scale.setScalar(0.95 * t);
    (c.material as THREE.MeshBasicMaterial).color.copy(color);
    (c.material as THREE.MeshBasicMaterial).opacity = 0.7;
  });

  return (
    <group>
      <mesh ref={groundRing} visible={false}>
        <ringGeometry args={[0.55, 0.72, 48]} />
        <meshBasicMaterial
          color={LOCKED}
          transparent
          opacity={0.7}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={chestRing} visible={false}>
        <ringGeometry args={[0.42, 0.52, 40]} />
        <meshBasicMaterial
          color={LOCKED}
          transparent
          opacity={0.75}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}