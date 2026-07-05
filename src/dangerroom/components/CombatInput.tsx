import { useEffect } from "react";
import { useGame } from "../state/gameStore";
import { combatAim } from "../state/combatAim";

/**
 * Dangerroom-style combat mouse input:
 * - LMB in focus mode → primary melee ability
 * - LMB in select mode → handled by mesh onClick (target pick)
 */
export function CombatInput() {
  const { classDef, useAbility } = useGame();

  useEffect(() => {
    const clearRmb = () => {
      combatAim.rmbHeld = false;
    };

    const onBlur = () => clearRmb();
    const onVisibility = () => {
      if (document.hidden) clearRmb();
    };

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0 || !combatAim.focusEnabled || !classDef) return;
      if (e.target instanceof Element && e.target.closest("button, a, input, textarea, select")) return;
      const primary = classDef.abilities.find((a) => a.effect === "melee" || a.effect === "dash");
      if (primary) useAbility(primary);
    };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [classDef, useAbility]);

  return null;
}