import { TOWNS } from "../state/settlements";
import type { Faction } from "../state/zones";

/**
 * Per-town NPC roster. Every faction town is populated with the same cast:
 * 5 vendors, 3 guards, and 1 mounted captain who hands out missions (9 total).
 * NPCs reuse the existing faction character GLBs
 * (public/models/<folder>/<race>_<class>.glb).
 */

export type NpcRole = "vendor" | "guard" | "captain";

export interface NpcDef {
  id: string;
  townId: string;
  faction: Exclude<Faction, "neutral">;
  role: NpcRole;
  label: string;
  modelPath: string;
  x: number;
  z: number;
  rotationY: number;
  mounted: boolean;
  patrolRadius?: number;
}

// Faction -> model folder + representative "citizen" race for its townsfolk.
const FACTION_MODEL: Record<Exclude<Faction, "neutral">, { folder: string; race: string }> = {
  crusade: { folder: "crusade", race: "western-kingdoms" },
  fabled: { folder: "fabled", race: "high-elves" },
  legion: { folder: "legion", race: "orcs" },
};

const VENDOR_LABELS = ["Blacksmith", "Merchant", "Alchemist", "Fletcher", "Provisioner"];
const VENDOR_CLASSES = ["knight", "mage", "mage", "ranger", "ranger"];

function modelPath(faction: Exclude<Faction, "neutral">, classId: string): string {
  const { folder, race } = FACTION_MODEL[faction];
  return `${import.meta.env.BASE_URL}models/${folder}/${race}_${classId}.glb`;
}

function buildTownNpcs(
  townId: string,
  faction: Exclude<Faction, "neutral">,
  cx: number,
  cz: number,
): NpcDef[] {
  const npcs: NpcDef[] = [];

  // 5 vendors in a market arc on the north side of the plaza.
  for (let i = 0; i < 5; i++) {
    const t = (i - 2) * 0.5; // -1 .. 1
    const x = cx + t * 7;
    const z = cz - 9;
    npcs.push({
      id: `${townId}-vendor-${i}`,
      townId,
      faction,
      role: "vendor",
      label: VENDOR_LABELS[i],
      modelPath: modelPath(faction, VENDOR_CLASSES[i]),
      x,
      z,
      rotationY: 0,
      mounted: false,
    });
  }

  // 3 guards at the plaza perimeter (triangle).
  const guardPts = [
    [cx - 10, cz + 4],
    [cx + 10, cz + 4],
    [cx, cz + 11],
  ];
  for (let i = 0; i < 3; i++) {
    const [x, z] = guardPts[i];
    npcs.push({
      id: `${townId}-guard-${i}`,
      townId,
      faction,
      role: "guard",
      label: "Town Guard",
      modelPath: modelPath(faction, "warrior"),
      x,
      z,
      rotationY: Math.atan2(cx - x, cz - z),
      mounted: false,
      patrolRadius: 10,
    });
  }

  // 1 mounted captain (missions) near the plaza centre.
  npcs.push({
    id: `${townId}-captain`,
    townId,
    faction,
    role: "captain",
    label: "Captain — Missions",
    modelPath: modelPath(faction, "knight"),
    x: cx,
    z: cz + 1,
    rotationY: 0,
    mounted: true,
  });

  return npcs;
}

export const TOWN_NPCS: NpcDef[] = TOWNS.flatMap((t) =>
  buildTownNpcs(t.id, t.faction, t.x, t.z),
);
