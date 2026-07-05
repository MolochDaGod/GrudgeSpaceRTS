import { useEffect, useMemo, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { Group } from "three";
import * as THREE from "three";

interface AnimatedModelProps {
  modelPath: string;
  /** Fixed uniform scale (used when the model is already at world scale). */
  scale?: number;
  /** If set, the model is rescaled to this world height and rested at local y=0. */
  normalizeHeight?: number;
  moving?: boolean;
  idleHints?: string[];
  moveHints?: string[];
}

/**
 * Renders a GLB/glTF with a cloned scene (SkeletonUtils, so the same source model
 * can be instanced many times with independent animation mixers) and drives a
 * looping idle/move clip picked by fuzzy name match. Used for town NPCs and for
 * huntable animals, whose clip names differ from the player character rig.
 */
export function AnimatedModel({
  modelPath,
  scale = 1,
  normalizeHeight,
  moving = false,
  idleHints = ["idle", "eat", "graze"],
  moveHints = ["walk", "run", "gallop", "trot"],
}: AnimatedModelProps) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(modelPath);
  const cloned = useMemo(() => skeletonClone(scene), [scene]);
  const { actions, names } = useAnimations(animations, group);
  const current = useRef<string | null>(null);

  const fitScale = useMemo(() => {
    cloned.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    if (!normalizeHeight) return scale;
    const box = new THREE.Box3().setFromObject(cloned);
    const sz = new THREE.Vector3();
    const ctr = new THREE.Vector3();
    box.getSize(sz);
    box.getCenter(ctr);
    cloned.position.set(-ctr.x, -box.min.y, -ctr.z);
    return normalizeHeight / (sz.y || 1);
  }, [cloned, normalizeHeight, scale]);

  useEffect(() => {
    if (names.length === 0) return;
    const pick = (hints: string[]) =>
      names.find((n) => hints.some((h) => n.toLowerCase().includes(h)));
    const target = (moving ? pick(moveHints) : pick(idleHints)) ?? pick(idleHints) ?? names[0];
    if (!target || current.current === target) return;
    const next = actions[target];
    if (!next) return;
    const prev = current.current ? actions[current.current] : null;
    next.reset().fadeIn(0.2).setLoop(THREE.LoopRepeat, Infinity).play();
    if (prev && prev !== next) prev.fadeOut(0.2);
    current.current = target;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moving, names, actions]);

  return (
    <group ref={group} scale={fitScale}>
      <primitive object={cloned} />
    </group>
  );
}
