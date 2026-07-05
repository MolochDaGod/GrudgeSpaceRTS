import { Billboard, Text } from "@react-three/drei";
import { getTerrainHeight } from "../state/terrain";
import type { DungeonEntrance } from "../data/dungeons";
import { worldPositions } from "../state/world";
import { DUNGEON_INTERIOR_OFFSET } from "../data/dungeons";

const FACTION_COLOR: Record<DungeonEntrance["faction"], string> = {
  neutral: "#c9a227",
  crusade: "#c9a227",
  fabled: "#5fd67f",
  legion: "#d6533b",
};

/**
 * World dungeon entrance — click to warp into the interior scaffold.
 * Full procedural layout hooks off `entrance.seed`.
 */
export function DungeonGate({ entrance }: { entrance: DungeonEntrance }) {
  const y = getTerrainHeight(entrance.x, entrance.z);
  const color = FACTION_COLOR[entrance.faction];

  return (
    <group
      position={[entrance.x, y + 0.05, entrance.z]}
      onClick={(e) => {
        e.stopPropagation();
        worldPositions.player.set(
          DUNGEON_INTERIOR_OFFSET.x,
          DUNGEON_INTERIOR_OFFSET.y,
          DUNGEON_INTERIOR_OFFSET.z,
        );
      }}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2.4, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[2.4, 2.4, 0.35]} />
        <meshStandardMaterial color="#2a2520" roughness={0.9} metalness={0.05} />
      </mesh>
      <Billboard position={[0, 3.2, 0]}>
        <Text fontSize={0.28} color="#fff" anchorX="center" outlineWidth={0.02} outlineColor="#000">
          {entrance.label}
        </Text>
      </Billboard>
    </group>
  );
}