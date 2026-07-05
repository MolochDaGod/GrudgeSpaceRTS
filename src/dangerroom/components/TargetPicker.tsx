import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../state/gameStore";
import { combatAim } from "../state/combatAim";
import { playerMode } from "../state/playerMode";

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

/**
 * Soft-lock picker: LMB raycasts hostiles / harvest nodes when focus is OFF.
 * When focus is ON, LMB attacks are handled by CombatInput.
 */
export function TargetPicker() {
  const { camera, scene } = useThree();
  const { setTarget, classDef, useAbility } = useGame();
  const setTargetRef = useRef(setTarget);
  const useAbilityRef = useRef(useAbility);
  const classDefRef = useRef(classDef);
  setTargetRef.current = setTarget;
  useAbilityRef.current = useAbility;
  classDefRef.current = classDef;

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (combatAim.focusEnabled) return;
      if (e.target instanceof Element && e.target.closest("button, a, input, textarea, select")) return;

      const canvas = document.querySelector("canvas");
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(scene.children, true);

      for (const hit of hits) {
        let o: THREE.Object3D | null = hit.object;
        while (o) {
          const ud = o.userData as {
            dummyId?: string;
            harvestId?: string;
            selectable?: string;
          };
          if (ud.harvestId && playerMode.toolMode === "harvest") {
            playerMode.softTargetId = ud.harvestId;
            return;
          }
          if (ud.dummyId) {
            playerMode.softTargetId = ud.dummyId;
            setTargetRef.current(ud.dummyId);
            return;
          }
          if (ud.selectable === "hostile" && ud.dummyId) {
            playerMode.softTargetId = ud.dummyId;
            setTargetRef.current(ud.dummyId);
            return;
          }
          o = o.parent;
        }
      }
    };

    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [camera, scene]);

  return null;
}