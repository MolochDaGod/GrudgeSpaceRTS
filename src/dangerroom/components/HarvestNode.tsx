import { useRef, useState, useCallback } from "react";
import { Billboard, Text } from "@react-three/drei";
import { getTerrainHeight } from "../state/terrain";
import { factionAt } from "../state/zones";
import { playerMode } from "../state/playerMode";
import type { HarvestNodeSpawn } from "../data/harvestNodes";

const KIND_COLOR: Record<HarvestNodeSpawn["kind"], string> = {
  rock: "#8a7a68",
  tree: "#3d6b34",
  crop: "#c4a832",
};

export function HarvestNode({ node }: { node: HarvestNodeSpawn }) {
  const [depleted, setDepleted] = useState(false);
  const respawnAt = useRef(0);
  const isTarget = playerMode.softTargetId === node.id;
  const y = getTerrainHeight(node.x, node.z);
  const accent = factionAt(node.x, node.z).accent;

  const deplete = useCallback(() => {
    setDepleted(true);
    respawnAt.current = performance.now() + node.respawnMs;
    window.setTimeout(() => setDepleted(false), node.respawnMs);
  }, [node.respawnMs]);

  if (depleted) return null;

  const scale = node.kind === "rock" ? 1.2 : node.kind === "tree" ? 1.6 : 0.9;
  const color = KIND_COLOR[node.kind];

  return (
    <group
      position={[node.x, y, node.z]}
      userData={{ harvestId: node.id, selectable: "node" }}
      onClick={(e) => {
        e.stopPropagation();
        playerMode.softTargetId = node.id;
        if (playerMode.toolMode === "harvest") deplete();
      }}
    >
      <mesh position={[0, scale * 0.5, 0]} castShadow receiveShadow>
        {node.kind === "rock" && <dodecahedronGeometry args={[scale * 0.55, 0]} />}
        {node.kind === "tree" && <coneGeometry args={[scale * 0.45, scale * 1.4, 6]} />}
        {node.kind === "crop" && <boxGeometry args={[scale, scale * 0.35, scale]} />}
        <meshStandardMaterial color={color} roughness={0.85} metalness={node.kind === "rock" ? 0.15 : 0} />
      </mesh>
      {node.kind === "tree" && (
        <mesh position={[0, scale * 1.15, 0]} castShadow>
          <sphereGeometry args={[scale * 0.55, 8, 8]} />
          <meshStandardMaterial color="#2a5a28" roughness={0.9} />
        </mesh>
      )}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, isTarget ? 0.72 : 0.58, 24]} />
        <meshBasicMaterial color={isTarget ? accent : "#4a4030"} transparent opacity={0.55} />
      </mesh>
      <Billboard position={[0, scale * 1.8, 0]}>
        <Text fontSize={0.18} color="#eee" anchorX="center" outlineWidth={0.012} outlineColor="#000">
          {node.label} ({node.tool})
        </Text>
      </Billboard>
    </group>
  );
}