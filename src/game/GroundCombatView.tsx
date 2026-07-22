/**
 * GroundCombatView — /ground route: Nexus Ground combat sandbox.
 * Nexus toon bodies + survival origins + 8-stat point buy (no class roles).
 * Stats/abilities from BIO·NEU·KIN·QNT·SYN·CHR·ENT·GRA.
 */

import { DangerRoomGroundView } from "./DangerRoomGroundView";
import type { PlanetType } from "./space-types";

interface GroundCombatViewProps {
  planetType: PlanetType;
  planetName: string;
  onExit: (result: "win" | "lose" | "retreat") => void;
}

export function GroundCombatView({ planetName, onExit }: GroundCombatViewProps) {
  return <DangerRoomGroundView planetName={planetName} onExit={onExit} />;
}