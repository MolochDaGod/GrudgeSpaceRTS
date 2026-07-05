import * as THREE from "three";
import type { RapierContext } from "@react-three/rapier";
import { probeWallHit } from "../physics/wallProbe";
import { getTerrainHeight } from "./terrain";
import { fireGroundImpactVfx, fireWallImpactVfx } from "./impactVfx";
import { fireClash } from "./combatClash";
import { staggerBrain, type AiBrain } from "../systems/enemyAI";

export const LAUNCH_VY = 5.5;
export const LAUNCH_VH = 4.2;
export const LOW_G = 6.5;
export const FALL_G = 18;
export const LOW_G_TIME = 0.28;
export const KNOCK_DOWN_HOLD_MS = 900;
export const WALL_BOUNCE_RETAIN = 0.55;

export type LaunchPhase = "fly" | "down" | "stunned";

export interface EnemyLaunch {
  active: boolean;
  x: number;
  z: number;
  y: number;
  vx: number;
  vz: number;
  vy: number;
  elapsed: number;
  phase: LaunchPhase;
  power: number;
  stunnedUntil: number;
  anim: string | null;
}

const launches = new Map<string, EnemyLaunch>();

export function clampPower(power: number): number {
  return THREE.MathUtils.clamp(power, 0.5, 2.4);
}

export function isHeavyHit(power: number, animation: string): boolean {
  if (power >= 28) return true;
  const a = animation.toLowerCase();
  return (
    a.includes("slam") ||
    a.includes("jump_attack") ||
    a.includes("flip") ||
    a.includes("combo_finisher") ||
    a.includes("dash_attack")
  );
}

export function isAerialSlam(animation: string): boolean {
  const a = animation.toLowerCase();
  return a.includes("jump_attack") || a.includes("front_flip") || a.includes("run_jump");
}

export function launchEnemy(
  id: string,
  awayX: number,
  awayZ: number,
  power: number,
  now: number,
): void {
  const p = clampPower(power / 22);
  const d = Math.hypot(awayX, awayZ) || 1;
  launches.set(id, {
    active: true,
    x: 0,
    z: 0,
    y: 0,
    vx: (awayX / d) * LAUNCH_VH * p,
    vz: (awayZ / d) * LAUNCH_VH * p,
    vy: LAUNCH_VY * p,
    elapsed: 0,
    phase: "fly",
    power: p,
    stunnedUntil: 0,
    anim: "dodge",
  });
  void now;
}

export function getEnemyLaunch(id: string): EnemyLaunch | null {
  return launches.get(id) ?? null;
}

export function isEnemyLaunched(id: string): boolean {
  const s = launches.get(id);
  return !!s?.active;
}

export interface LaunchStepResult {
  x: number;
  z: number;
  y: number;
  grounded: boolean;
  anim: string | null;
  skipAi: boolean;
  wallDamage: number;
  groundDamage: number;
}

export function stepEnemyLaunch(
  id: string,
  curX: number,
  curZ: number,
  brain: AiBrain,
  world: RapierContext["world"],
  rapier: RapierContext["rapier"],
  delta: number,
  now: number,
): LaunchStepResult | null {
  const s = launches.get(id);
  if (!s?.active) return null;

  s.elapsed += delta;
  const g = s.elapsed < LOW_G_TIME ? LOW_G : FALL_G;
  s.vy -= g * delta;

  let nx = curX + s.vx * delta;
  let nz = curZ + s.vz * delta;
  s.y = Math.max(0, s.y + s.vy * delta);

  let wallDamage = 0;
  let groundDamage = 0;

  const wall = probeWallHit(world, rapier, curX, s.y + 1.2, curZ, s.vx, s.vz, 1.8);
  if (wall.hit && Math.hypot(s.vx, s.vz) > 2.5) {
    const impact = Math.hypot(s.vx, s.vz) * s.power;
    wallDamage = Math.round(8 + impact * 2.2);
    fireWallImpactVfx(wall.x, wall.y, wall.z, wall.nx, wall.nz);
    fireClash("melee", id, 1.4, { x: wall.x, y: wall.y, z: wall.z });
    s.vx = -s.vx * WALL_BOUNCE_RETAIN + wall.nx * 1.2;
    s.vz = -s.vz * WALL_BOUNCE_RETAIN + wall.nz * 1.2;
    s.vy *= 0.35;
    nx = curX + s.vx * delta * 0.5;
    nz = curZ + s.vz * delta * 0.5;
    s.anim = "sword_block";
  }

  if (s.y <= 0.05 && s.vy <= 0) {
    s.y = 0;
    s.vy = 0;
    const groundY = getTerrainHeight(nx, nz);
    if (s.phase !== "stunned") {
      const impact = s.power * (s.elapsed > 0.35 ? 1.35 : 0.8);
      groundDamage = Math.round(6 + impact * 12);
      fireGroundImpactVfx(nx, groundY, nz, s.power);
      fireClash("melee", id, 1.2, { x: nx, y: groundY + 0.2, z: nz });
      s.phase = "stunned";
      s.stunnedUntil = now + KNOCK_DOWN_HOLD_MS;
      s.anim = "sword_attack_c";
      staggerBrain(brain, now, KNOCK_DOWN_HOLD_MS);
      s.vx *= 0.2;
      s.vz *= 0.2;
    }
  }

  if (s.phase === "stunned" && now >= s.stunnedUntil) {
    s.active = false;
    s.anim = null;
    launches.delete(id);
  }

  return {
    x: nx,
    z: nz,
    y: s.y,
    grounded: s.y <= 0.01,
    anim: s.anim,
    skipAi: true,
    wallDamage,
    groundDamage,
  };
}