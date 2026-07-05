import { Billboard, Text } from "@react-three/drei";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import { getTerrainHeight } from "../state/terrain";
import { collision } from "../physics/collisionGroups";
import { AnimatedModel } from "./AnimatedModel";
import { HORSE_MODEL } from "../data/animals";
import type { NpcDef, NpcRole } from "../data/npcRoster";

const ROLE_COLOR: Record<NpcRole, string> = {
  vendor: "#d8b24a",
  guard: "#8fa6c4",
  captain: "#d6533b",
};

const CAP_HALF = 0.6;
const CAP_RADIUS = 0.4;
const CAP_OFFSET = CAP_HALF + CAP_RADIUS;

/**
 * A town NPC: a faction character standing at a fixed post with a role nameplate
 * and a coloured ground ring. Captains ride a horse (mount model). NPCs are static
 * fixtures (fixed collider) — vendors trade, guards watch, the captain gives
 * missions; interaction hooks can layer on top later.
 */
export function Npc({ npc }: { npc: NpcDef }) {
  const groundY = getTerrainHeight(npc.x, npc.z);
  const color = ROLE_COLOR[npc.role];
  const mountLift = npc.mounted ? 1.35 : 0;

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={[npc.x, groundY + CAP_OFFSET + mountLift, npc.z]}
    >
      <CapsuleCollider args={[CAP_HALF, CAP_RADIUS]} collisionGroups={collision.environment} />
      <group position={[0, -CAP_OFFSET - mountLift, 0]} rotation={[0, npc.rotationY, 0]}>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.72, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>

        {npc.mounted && <AnimatedModel modelPath={HORSE_MODEL} normalizeHeight={1.7} />}

        <group position={[0, mountLift, 0]}>
          <AnimatedModel modelPath={npc.modelPath} moving={false} />
        </group>

        <Billboard position={[0, 2.4 + mountLift, 0]}>
          <Text
            fontSize={0.24}
            color="#fff"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.016}
            outlineColor="#000"
          >
            {npc.label}
          </Text>
          <mesh position={[0, -0.06, -0.01]}>
            <planeGeometry args={[npc.label.length * 0.15 + 0.3, 0.34]} />
            <meshBasicMaterial color={color} transparent opacity={0.22} />
          </mesh>
        </Billboard>
      </group>
    </RigidBody>
  );
}
