import { pointOnIsland } from "../state/settlements";

/**
 * Procedural dungeon entrance anchors. Each gate teleports the player into a
 * seeded interior volume (scaffold — full gen is a follow-up pass).
 */
export interface DungeonEntrance {
  id: string;
  label: string;
  x: number;
  z: number;
  seed: string;
  faction: "crusade" | "fabled" | "legion" | "neutral";
}

const crypt = { x: -42, z: 28 };
const fabledMine = pointOnIsland("fabled", 0.4, 0.8);
const legionPit = pointOnIsland("legion", 0.45, 2.1);

export const DUNGEON_ENTRANCES: DungeonEntrance[] = [
  { id: "crypt-neutral", label: "Grudgehold Crypt", ...crypt, seed: "crypt-a", faction: "neutral" },
  { id: "mine-fabled", label: "Deep Mine", x: fabledMine.x, z: fabledMine.z, seed: "mine-b", faction: "fabled" },
  { id: "pit-legion", label: "Blood Pit", x: legionPit.x, z: legionPit.z, seed: "pit-c", faction: "legion" },
];

/** Interior spawn offset when entering a dungeon (flat combat room scaffold). */
export const DUNGEON_INTERIOR_OFFSET = { x: 0, y: 2, z: -120 };