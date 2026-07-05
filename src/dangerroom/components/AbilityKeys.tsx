/** @deprecated Use WeaponSkillKeys — conflicts if both are mounted (duplicate key handlers). */
import { useEffect } from "react";
import { useGame } from "../state/gameStore";

export function AbilityKeys() {
  const { classDef, useAbility } = useGame();

  useEffect(() => {
    if (!classDef) return;
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const ability = classDef.abilities.find((a) => a.key === e.key);
      if (ability) {
        e.preventDefault();
        useAbility(ability);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [classDef, useAbility]);

  return null;
}
