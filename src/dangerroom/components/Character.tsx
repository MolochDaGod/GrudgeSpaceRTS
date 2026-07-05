import { useEffect, useMemo, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import type { Group } from "three";
import * as THREE from "three";
import { CRUSADE_CLASSES } from "../data/classes";

// Every ability clip (attacks, dashes, flips) plays once and clamps on its final
// frame; locomotion and idle clips loop. Built from the class ability data so a
// newly-added ability animation is treated as one-shot automatically instead of
// silently looping. `attack`/`dodge` are covered by the ability set but listed
// explicitly for safety.
const ONE_SHOT_ANIMATIONS = new Set<string>([
  ...CRUSADE_CLASSES.flatMap((c) => c.abilities.map((a) => a.animation)),
  "attack",
  "dodge",
]);

const LOCOMOTION_FALLBACKS: Record<string, string[]> = {
  sprint_run: ["sprint_run", "sprint", "gs_run", "run", "walk", "gs_walk"],
  gs_run: ["gs_run", "sprint_run", "sprint", "run", "gs_walk", "walk"],
  walk: ["walk", "gs_walk", "run"],
  gs_walk: ["gs_walk", "walk", "run"],
};

function resolveClip(names: string[], clip: string, fallback: string): string {
  if (names.includes(clip)) return clip;
  const chain = LOCOMOTION_FALLBACKS[clip] ?? [clip, fallback];
  return chain.find((c) => names.includes(c)) ?? fallback;
}

interface CharacterProps {
  modelPath: string;
  scale?: number;
  /**
   * When set, overrides `scale` by measuring the model's natural bounding-box
   * height so it renders exactly this many world units tall, regardless of the
   * source GLB's native scale (e.g. 2 for a 2m orc).
   */
  targetHeight?: number;
  animation: string;
  /**
   * Bump this whenever `animation` should restart from frame 0 even if the clip
   * name is unchanged (e.g. two queued attacks that both play the same clip).
   */
  animationSeq?: number;
  fallbackAnimation?: string;
  onGroupReady?: (group: Group) => void;
  tint?: string;
  /**
   * Yaw correction (radians) applied to the model so its authored forward axis
   * lines up with the world +Z facing convention used by the movement/aim code.
   * Optional yaw correction (radians). Character GLBs are baked facing +Z; leave
   * at 0 unless an unmigrated asset still needs a runtime fix.
   */
  facingOffset?: number;
}

export function Character({
  modelPath,
  scale = 1,
  targetHeight,
  animation,
  animationSeq = 0,
  fallbackAnimation = "idle",
  onGroupReady,
  tint,
  facingOffset = 0,
}: CharacterProps) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF(modelPath);
  const { actions, names } = useAnimations(animations, groupRef);
  const currentAction = useRef<string | null>(null);
  const currentKey = useRef<string | null>(null);

  const resolvedScale = useMemo(() => {
    if (!targetHeight) return scale;
    const box = new THREE.Box3().setFromObject(scene);
    const naturalHeight = box.max.y - box.min.y;
    if (!Number.isFinite(naturalHeight) || naturalHeight <= 0) return scale;
    return targetHeight / naturalHeight;
  }, [scene, targetHeight, scale]);

  useEffect(() => {
    if (groupRef.current && onGroupReady) onGroupReady(groupRef.current);
  }, [onGroupReady]);

  useEffect(() => {
    if (tint) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat && "color" in mat) {
            mat.color = new THREE.Color(tint);
          }
        }
      });
    }
  }, [scene, tint]);

  useEffect(() => {
    const target = resolveClip(names, animation, fallbackAnimation);
    const isOneShot = ONE_SHOT_ANIMATIONS.has(target);
    // One-shot clips key off animationSeq too, so a repeated ability with the
    // same clip name restarts from frame 0 instead of being silently ignored.
    const key = isOneShot ? `${target}#${animationSeq}` : target;
    if (currentKey.current === key) return;
    const nextAction = actions[target];
    if (!nextAction) return;

    const prevKey = currentAction.current;
    const prevAction = prevKey ? actions[prevKey] : null;
    const restartingSameClip = prevKey === target;

    // Snappy fade for attacks/dodge reads as immediate input response; locomotion
    // and idle transitions blend more slowly so they don't look like a hard cut.
    const fadeIn = isOneShot ? 0.06 : 0.2;
    const fadeOut = isOneShot ? 0.1 : 0.2;

    if (restartingSameClip && prevAction === nextAction) {
      nextAction.stop();
    }
    nextAction.reset().fadeIn(fadeIn).play();
    if (isOneShot) {
      nextAction.setLoop(THREE.LoopOnce, 1);
      nextAction.clampWhenFinished = true;
    } else {
      nextAction.setLoop(THREE.LoopRepeat, Infinity);
    }

    if (prevAction && prevAction !== nextAction) {
      prevAction.fadeOut(fadeOut);
    }
    currentAction.current = target;
    currentKey.current = key;
  }, [animation, animationSeq, fallbackAnimation, actions, names]);

  return (
    <group ref={groupRef} scale={resolvedScale}>
      <primitive object={scene} rotation-y={facingOffset} />
    </group>
  );
}
