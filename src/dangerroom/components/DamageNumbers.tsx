import { useEffect } from "react";
import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { useGame } from "../state/gameStore";
import { worldPositions } from "../state/world";
import type { DamageNumber } from "../state/gameStore";

const LIFETIME_MS = 900;

function DamageNumberItem({ dmg, onDone }: { dmg: DamageNumber; onDone: () => void }) {
  const ref = useRef<Group>(null);
  const start = useRef(performance.now());

  useEffect(() => {
    const timeout = setTimeout(onDone, LIFETIME_MS);
    return () => clearTimeout(timeout);
  }, [onDone]);

  useFrame(() => {
    if (!ref.current) return;
    const elapsed = performance.now() - start.current;
    const t = Math.min(1, elapsed / LIFETIME_MS);
    const base = dmg.targetId === "player" ? worldPositions.player : worldPositions.dummies.get(dmg.targetId);
    if (base) {
      ref.current.position.set(base.x, 2.1 + t * 1.1, base.z);
    }
    ref.current.scale.setScalar(1 - t * 0.2);
  });

  return (
    <group ref={ref}>
      <Billboard>
        <Text
          fontSize={dmg.crit ? 0.42 : 0.3}
          color={dmg.color}
          outlineWidth={0.02}
          outlineColor="#000"
          anchorX="center"
          anchorY="middle"
        >
          {dmg.targetId === "player" && dmg.color === "#8bffb0" ? `+${dmg.amount}` : `${dmg.amount}`}
        </Text>
      </Billboard>
    </group>
  );
}

export function DamageNumbers() {
  const { state, removeDamageNumber } = useGame();
  return (
    <>
      {state.damageNumbers.map((d) => (
        <DamageNumberItem key={d.id} dmg={d} onDone={() => removeDamageNumber(d.id)} />
      ))}
    </>
  );
}
