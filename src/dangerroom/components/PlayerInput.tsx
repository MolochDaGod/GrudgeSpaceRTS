import { useEffect } from "react";
import { playerMode, cycleHarvestTool } from "../state/playerMode";

export function PlayerInput() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "KeyQ") {
        playerMode.toolMode = playerMode.toolMode === "weapon" ? "harvest" : "weapon";
      }
      if (e.code === "KeyQ" && e.shiftKey) {
        cycleHarvestTool();
      }
      if (e.code === "Tab") {
        e.preventDefault();
        playerMode.toolMode = playerMode.toolMode === "weapon" ? "harvest" : "weapon";
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}