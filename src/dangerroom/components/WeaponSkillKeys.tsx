import { useEffect, useMemo, useRef } from "react";
import { useGame } from "../state/gameStore";
import { defaultWeaponBar, resolveSkillAbility, BUILTIN_SKILLS } from "../data/weaponSkills";
import { playerMode } from "../state/playerMode";
import { combatParry, requestParry, tryParry } from "../state/combatParry";
import {
  BLOCK_HOLD_MIN_MS,
  createBlockKeySession,
  markBlockHoldActivated,
  onBlockKeyDown,
  onBlockKeyUp,
  shouldActivateBlockHold,
} from "../state/blockParryInput";

export function WeaponSkillKeys() {
  const { classDef, useAbility } = useGame();
  const bar = useMemo(() => (classDef ? defaultWeaponBar(classDef.abilities) : []), [classDef]);
  const blockSession = useRef(createBlockKeySession());
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!classDef) return;

    const clearHoldTimer = () => {
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
    };

    const scheduleBlockHold = () => {
      clearHoldTimer();
      holdTimer.current = setTimeout(() => {
        const now = performance.now();
        if (shouldActivateBlockHold(blockSession.current, now)) {
          markBlockHoldActivated(blockSession.current);
          combatParry.blocking = true;
          playerMode.blocking = true;
        }
      }, BLOCK_HOLD_MIN_MS);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (playerMode.toolMode === "harvest") return;

      const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      const slot = bar.find((s) => s.key === key || s.key === e.key);
      if (!slot) return;

      if (slot.kind === "block") {
        e.preventDefault();
        onBlockKeyDown(blockSession.current, performance.now());
        scheduleBlockHold();
        return;
      }
      if (slot.kind === "lunge") {
        e.preventDefault();
        const dash = classDef.abilities.find((a) => a.effect === "dash" || a.effect === "melee");
        if (dash) useAbility(dash);
        return;
      }

      const ability = resolveSkillAbility(slot, classDef.abilities);
      if (ability) {
        e.preventDefault();
        useAbility(ability);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== "r" && e.key !== "R") return;
      clearHoldTimer();
      const now = performance.now();
      const release = onBlockKeyUp(blockSession.current, now);
      if (release === "parry") {
        requestParry(now);
        playerMode.parryUntil = now + 280;
        if (!tryParry(now)) {
          /* armed window remains for incoming telegraph */
        }
      }
      if (release === "block_release") {
        combatParry.blocking = false;
        playerMode.blocking = false;
      }
      e.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      clearHoldTimer();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      combatParry.blocking = false;
      playerMode.blocking = false;
      blockSession.current = createBlockKeySession();
    };
  }, [classDef, useAbility, bar]);

  void BUILTIN_SKILLS;
  return null;
}