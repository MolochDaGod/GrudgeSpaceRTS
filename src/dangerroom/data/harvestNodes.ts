import { childSeed, mulberry32, hash2 } from "../state/seed";
import { getTerrainHeight } from "../state/terrain";
import { SEA_LEVEL } from "../state/islands";
import { ISLANDS } from "../state/islands";
import type { HarvestTool } from "../state/playerMode";

export type HarvestNodeKind = "rock" | "tree" | "crop";

export interface HarvestNodeSpawn {
  id: string;
  kind: HarvestNodeKind;
  tool: HarvestTool;
  x: number;
  z: number;
  label: string;
  loot: string;
  respawnMs: number;
}

function toolForKind(kind: HarvestNodeKind): HarvestTool {
  if (kind === "rock") return "pickaxe";
  if (kind === "tree") return "hatchet";
  return "scythe";
}

function buildHarvestNodes(): HarvestNodeSpawn[] {
  const rng = mulberry32(childSeed("harvest-nodes"));
  const out: HarvestNodeSpawn[] = [];
  let id = 0;

  for (const isl of ISLANDS) {
    const count = isl.faction === "neutral" ? 24 : 48;
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * isl.radius * 0.88;
      const x = isl.x + Math.cos(a) * r;
      const z = isl.z + Math.sin(a) * r;
      const h = getTerrainHeight(x, z);
      if (h < SEA_LEVEL + 0.5 || h > 16) continue;
      if (x * x + z * z < 45 * 45) continue;

      const roll = hash2(x, z, 17);
      let kind: HarvestNodeKind;
      if (roll < 0.38) kind = "tree";
      else if (roll < 0.72) kind = "rock";
      else kind = "crop";

      const tool = toolForKind(kind);
      out.push({
        id: `harvest-${id++}`,
        kind,
        tool,
        x,
        z,
        label: kind === "rock" ? "Ore Vein" : kind === "tree" ? "Timber" : "Grain Patch",
        loot: kind === "rock" ? "ore" : kind === "tree" ? "logs" : "grain",
        respawnMs: 8000 + Math.floor(rng() * 6000),
      });
    }
  }
  return out;
}

export const HARVEST_NODE_SPAWNS: HarvestNodeSpawn[] = buildHarvestNodes();