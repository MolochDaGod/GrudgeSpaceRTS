import type { DummySpawn } from "../state/world";
import { pointOnIsland } from "../state/settlements";

function bossSpawn(
  id: string,
  name: string,
  faction: "legion",
  inland: number,
  angle: number,
  maxHp: number,
  raceId: DummySpawn["raceId"],
  classId: DummySpawn["classId"],
): DummySpawn {
  const p = pointOnIsland(faction, inland, angle);
  return {
    id,
    name,
    x: p.x,
    z: p.z,
    homeX: p.x,
    homeZ: p.z,
    maxHp,
    raceId,
    classId,
  };
}

/** Legion boss anchors — reuses Dummy combat + AI with boss-tuned params. */
export const BOSS_SPAWNS: DummySpawn[] = [
  bossSpawn("boss-legion-warlord", "Legion Warlord", "legion", 0.55, 1.2, 1200, "orcs", "warrior"),
  bossSpawn("boss-undead-lich", "Undead Lich", "legion", 0.62, 2.4, 900, "undead", "mage"),
];