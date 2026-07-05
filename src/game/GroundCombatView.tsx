/**
 * GroundCombatView — /ground route: dangerroom R3F combat with Poly Haven terrain,
 * soft lock, RMB focus, block/parry, and MM movement.
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