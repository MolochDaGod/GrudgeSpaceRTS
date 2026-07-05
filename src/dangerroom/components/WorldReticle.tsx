import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { combatAim } from "../state/combatAim";
import { playerMode } from "../state/playerMode";
import { cameraRig, worldPositions } from "../state/world";
import { getTerrainHeight } from "../state/terrain";

const AIM_DISTANCE = 3.2;
const GROUND_Y = 0.05;
const LOCK_LERP = 0.14;
const CH_SOFT = "#ffd27f";
const CH_FOCUS = "#6fe0ff";
const CH_HOSTILE = "#ff6b6b";

const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();

/**
 * Ground aim ring — amber soft lock, cyan/red hard focus. Lerps toward locked target.
 */
export function WorldReticle() {
  const grp = useRef<THREE.Group>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const dotMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    const g = grp.current;
    if (!g) return;

    const show = combatAim.focusEnabled || combatAim.softLock;
    g.visible = show;
    if (!show) return;

    const yaw = cameraRig.yaw;
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);

    tmp.set(
      worldPositions.player.x + fx * AIM_DISTANCE,
      GROUND_Y,
      worldPositions.player.z + fz * AIM_DISTANCE,
    );

    let lock: THREE.Vector3 | null = null;
    if (playerMode.softTargetId) {
      const tp = worldPositions.dummies.get(playerMode.softTargetId);
      if (tp) lock = tmp2.set(tp.x, GROUND_Y, tp.z);
    }

    if (lock && (combatAim.focusEnabled || combatAim.softLock)) {
      const dist = Math.min(Math.max(worldPositions.player.distanceTo(lock), 2), 8);
      const dx = lock.x - worldPositions.player.x;
      const dz = lock.z - worldPositions.player.z;
      const len = Math.hypot(dx, dz);
      if (len > 0.01) {
        tmp.set(
          worldPositions.player.x + (dx / len) * dist,
          GROUND_Y,
          worldPositions.player.z + (dz / len) * dist,
        );
      }
      tmp.lerp(lock, LOCK_LERP);
    } else {
      tmp.y = getTerrainHeight(tmp.x, tmp.z) + GROUND_Y;
    }

    g.position.copy(tmp);

    const hostile = !!lock && combatAim.focusEnabled;
    const color = hostile ? CH_HOSTILE : combatAim.focusEnabled ? CH_FOCUS : CH_SOFT;
    ringMat.current?.color.set(color);
    dotMat.current?.color.set(hostile ? "#ffe0e0" : combatAim.focusEnabled ? "#dff7ff" : "#fff2cc");
  });

  return (
    <group ref={grp} visible={false}>
      <mesh rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.34, 0.46, 48]} />
        <meshBasicMaterial
          ref={ringMat}
          color={CH_SOFT}
          transparent
          opacity={0.85}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.06, 24]} />
        <meshBasicMaterial
          ref={dotMat}
          color="#fff2cc"
          transparent
          opacity={0.9}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}