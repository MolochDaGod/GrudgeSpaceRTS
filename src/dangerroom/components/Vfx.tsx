import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Mesh } from "three";
import { useGame } from "../state/gameStore";
import { worldPositions } from "../state/world";
import type { VfxEvent } from "../state/gameStore";

const LIFETIME_MS: Record<VfxEvent["kind"], number> = {
  melee: 260,
  ranged: 420,
  heal: 500,
  shield: 700,
  dash: 260,
};

const _from = new THREE.Vector3();
const _to = new THREE.Vector3();
const _lift = new THREE.Vector3(0, 1.1, 0);

function VfxItem({ vfx, onDone }: { vfx: VfxEvent; onDone: () => void }) {
  const meshRef = useRef<Mesh>(null);
  const start = useRef(performance.now());

  useEffect(() => {
    const timeout = setTimeout(onDone, LIFETIME_MS[vfx.kind] + 30);
    return () => clearTimeout(timeout);
  }, [onDone, vfx.kind]);

  useFrame(() => {
    if (!meshRef.current) return;
    const elapsed = performance.now() - start.current;
    const life = LIFETIME_MS[vfx.kind];
    const t = Math.min(1, elapsed / life);

    _from.copy(worldPositions.player).add(_lift);
    const dummy = vfx.toId ? worldPositions.dummies.get(vfx.toId) : undefined;
    if (dummy) {
      _to.copy(dummy).add(_lift);
    } else if (vfx.toId) {
      _to.copy(_from);
    } else {
      _to.copy(_from);
      _to.y += 0.6;
    }

    if (vfx.kind === "ranged") {
      meshRef.current.position.lerpVectors(_from, _to, t);
      meshRef.current.scale.setScalar(1 - t * 0.3);
    } else if (vfx.kind === "melee" || vfx.kind === "dash") {
      meshRef.current.position.lerpVectors(_from, _to, Math.min(1, t * 1.6));
      const scale = 1 + Math.sin(t * Math.PI) * 0.6;
      meshRef.current.scale.setScalar(scale);
    } else if (vfx.kind === "heal" || vfx.kind === "shield") {
      meshRef.current.position.copy(_from);
      meshRef.current.position.y += t * 1.2;
      meshRef.current.scale.setScalar(1 + t * 1.4);
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 1 - t;
    }
  });

  if (vfx.kind === "ranged") {
    return (
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color={vfx.color} emissive={vfx.color} emissiveIntensity={2} />
      </mesh>
    );
  }
  if (vfx.kind === "heal" || vfx.kind === "shield") {
    return (
      <mesh ref={meshRef}>
        <torusGeometry args={[0.6, 0.05, 8, 24]} />
        <meshBasicMaterial color={vfx.color} transparent opacity={0.9} />
      </mesh>
    );
  }
  return (
    <mesh ref={meshRef} rotation={[0, 0, Math.PI / 4]}>
      <boxGeometry args={[0.5, 0.12, 0.12]} />
      <meshStandardMaterial color={vfx.color} emissive={vfx.color} emissiveIntensity={1.5} />
    </mesh>
  );
}

export function VfxLayer() {
  const { state, removeVfx } = useGame();
  return (
    <>
      {state.vfx.map((v) => (
        <VfxItem key={v.id} vfx={v} onDone={() => removeVfx(v.id)} />
      ))}
    </>
  );
}
