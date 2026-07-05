export type ToolMode = "weapon" | "harvest";
export type HarvestTool = "pickaxe" | "hatchet" | "scythe";

/** Per-frame player mode flags (mutable singleton). */
export const playerMode = {
  toolMode: "weapon" as ToolMode,
  harvestTool: "pickaxe" as HarvestTool,
  /** Soft-lock target id (dummy / animal / harvest node). */
  softTargetId: null as string | null,
  climbing: false,
  wallRunning: false,
  rolling: false,
  harvesting: false,
  /** Hold R — damage reduction via combatParry.blocking. */
  blocking: false,
  /** Tap R parry pose — brief overlay on sword_block. */
  parryUntil: 0,
  /** Aerial slam ability — brief lift on player during jump attack. */
  aerialSlamUntil: 0,
  /** Near a docked ship — E toggles sail mode (scaffold). */
  sailing: false,
  /** MM ability / double-jump horizontal burst (read by Player each frame). */
  mmImpulseVx: 0,
  mmImpulseVz: 0,
  mmImpulseUntil: 0,
  /** Latest resolved MM for HUD readout. */
  lastMM: 0,
};

const HARVEST_TOOLS: HarvestTool[] = ["pickaxe", "hatchet", "scythe"];

export function cycleHarvestTool(): HarvestTool {
  const idx = HARVEST_TOOLS.indexOf(playerMode.harvestTool);
  playerMode.harvestTool = HARVEST_TOOLS[(idx + 1) % HARVEST_TOOLS.length];
  return playerMode.harvestTool;
}

export function harvestAnimForTool(tool: HarvestTool): string {
  switch (tool) {
    case "pickaxe":
      return "harvest";
    case "hatchet":
      return "harvest";
    case "scythe":
      return "harvest";
  }
}