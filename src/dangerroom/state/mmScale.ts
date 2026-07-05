import type { Ability, AbilityEffect } from "../data/types";
import { worldPositions } from "./world";

/** MM = lerp(+100, -100, distanceBias). +MM closes gap, -MM keeps distance. */
export function mmFromDistanceBias(distanceBias: number): number {
  const d = Math.max(0, Math.min(1, distanceBias));
  return 100 - d * 200;
}

/** Map target distance to bias: close = melee (+MM), far = ranged (-MM). */
export function distanceBiasToTarget(targetId: string | null, idealRange = 4): number {
  if (!targetId) return 0.5;
  const dist = worldPositions.distanceToPlayer(targetId);
  const t = Math.max(0, Math.min(1, (dist - 1.5) / Math.max(idealRange, 1)));
  return t;
}

export function resolveAbilityMM(ability: Ability): number {
  if (ability.mm !== undefined) return ability.mm;
  const defaults: Record<AbilityEffect, number> = {
    melee: 80,
    dash: 60,
    ranged: -55,
    dot: -45,
    heal: 0,
    shield: 25,
    buff: 10,
  };
  return defaults[ability.effect] ?? 0;
}

/** Normalized impulse strength from MM magnitude (0–1). */
export function mmImpulseStrength(mm: number): number {
  return Math.min(1, Math.abs(mm) / 100) * 0.85;
}

export interface MMImpulse {
  vx: number;
  vz: number;
  until: number;
}

/** Build a short horizontal burst toward (+MM) or away (-MM) from the soft target. */
export function buildMMImpulse(
  mm: number,
  targetId: string | null,
  now: number,
  durationMs = 280,
): MMImpulse | null {
  if (Math.abs(mm) < 8) return null;
  const px = worldPositions.player.x;
  const pz = worldPositions.player.z;
  let dx = 0;
  let dz = 1;
  if (targetId) {
    const tp = worldPositions.dummies.get(targetId);
    if (tp) {
      dx = tp.x - px;
      dz = tp.z - pz;
      const len = Math.hypot(dx, dz) || 1;
      dx /= len;
      dz /= len;
    }
  } else {
    const yaw = worldPositions.playerFacingAngle;
    dx = Math.sin(yaw);
    dz = Math.cos(yaw);
  }
  const sign = mm >= 0 ? 1 : -1;
  const strength = mmImpulseStrength(mm) * 14;
  return {
    vx: dx * strength * sign,
    vz: dz * strength * sign,
    until: now + durationMs,
  };
}

/** Double-jump MM uses the same bias twice (reference: +30/+50 melee, -30/-60 ranged). */
export function doubleJumpMM(distanceBias: number, jumpIndex: 0 | 1): number {
  const base = mmFromDistanceBias(distanceBias);
  const scale = jumpIndex === 0 ? 0.3 : 0.55;
  return base * scale;
}