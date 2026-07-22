/**
 * Nexus toon character — loads baked CDN glTF (Quaternius packs for Grudges)
 * with clip name remapping for Ground locomotion / abilities.
 */

import { useEffect, useMemo, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import type { Group } from "three";
import * as THREE from "three";
import { NEXUS_TOON_ANIM_FALLBACKS, getNexusToonByKey } from "../nexus/nexusToons";

interface Props {
  /** `male:adventurer` etc. */
  toonKey: string;
  animation: string;
  animationSeq?: number;
  fallbackAnimation?: string;
  targetHeight?: number;
  onGroupReady?: (group: Group) => void;
}

function resolveClip(names: string[], want: string, fallback: string): string {
  if (names.includes(want)) return want;
  const chain = NEXUS_TOON_ANIM_FALLBACKS[want] ?? [want, fallback, "idle", "Idle"];
  for (const c of chain) {
    const hit = names.find((n) => n === c || n.toLowerCase().includes(c.toLowerCase()));
    if (hit) return hit;
  }
  return names[0] ?? fallback;
}

function ToonMesh({
  url,
  animation,
  animationSeq,
  fallbackAnimation,
  targetHeight,
  onGroupReady,
}: {
  url: string;
  animation: string;
  animationSeq: number;
  fallbackAnimation: string;
  targetHeight: number;
  onGroupReady?: (group: Group) => void;
}) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF(url);
  const clone = useMemo(() => scene.clone(true), [scene]);
  const { actions, names } = useAnimations(animations, groupRef);
  const currentKey = useRef<string | null>(null);

  const resolvedScale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clone);
    const h = box.max.y - box.min.y;
    if (!Number.isFinite(h) || h <= 0.01) return 1;
    return targetHeight / h;
  }, [clone, targetHeight]);

  useEffect(() => {
    if (groupRef.current && onGroupReady) onGroupReady(groupRef.current);
  }, [onGroupReady, clone]);

  useEffect(() => {
    clone.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [clone]);

  useEffect(() => {
    if (!names.length || !actions) return;
    const target = resolveClip(names, animation, fallbackAnimation);
    const isOneShot = /attack|slash|combo|dodge|jump|punch|cast|sword/i.test(target);
    const key = isOneShot ? `${target}#${animationSeq}` : target;
    if (currentKey.current === key) return;
    const next = actions[target];
    if (!next) return;

    const prevName = currentKey.current?.split("#")[0] ?? null;
    const prev = prevName ? actions[prevName] : null;
    const fade = isOneShot ? 0.08 : 0.2;

    if (prev && prev !== next) prev.fadeOut(fade);
    next.reset().setLoop(isOneShot ? THREE.LoopOnce : THREE.LoopRepeat, isOneShot ? 1 : Infinity);
    if (isOneShot) next.clampWhenFinished = true;
    next.fadeIn(fade).play();
    currentKey.current = key;
  }, [animation, animationSeq, actions, names, fallbackAnimation]);

  return (
    <group ref={groupRef} scale={resolvedScale} dispose={null}>
      <primitive object={clone} />
    </group>
  );
}

export function NexusToonCharacter({
  toonKey,
  animation,
  animationSeq = 0,
  fallbackAnimation = "idle",
  targetHeight = 1.75,
  onGroupReady,
}: Props) {
  const def = getNexusToonByKey(toonKey);
  const url = def?.gltfPath;

  if (!url) {
    return (
      <mesh castShadow>
        <capsuleGeometry args={[0.28, 0.9, 4, 8]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>
    );
  }

  return (
    <ToonMesh
      url={url}
      animation={animation}
      animationSeq={animationSeq}
      fallbackAnimation={fallbackAnimation}
      targetHeight={targetHeight}
      onGroupReady={onGroupReady}
    />
  );
}
