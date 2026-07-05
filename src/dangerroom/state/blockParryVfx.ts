import { worldPositions } from "./world";

export type BlockVfxKind = "block" | "parry" | "rebound";

export const blockParryVfx = {
  token: 0,
  kind: "parry" as BlockVfxKind,
  success: false,
  x: 0,
  y: 1.1,
  z: 0,
};

/** Screen-overlay burst (anime speed lines) — bumped alongside 3D VFX. */
export const blockScreenFx = {
  token: 0,
  kind: "parry" as BlockVfxKind,
  success: false,
};

export function strikeContactPoint(attackerId: string | null): { x: number; y: number; z: number } {
  const px = worldPositions.player.x;
  const pz = worldPositions.player.z;
  if (!attackerId) return { x: px, y: 1.15, z: pz };
  const ap = worldPositions.dummies.get(attackerId);
  if (!ap) return { x: px, y: 1.15, z: pz };
  const dx = px - ap.x;
  const dz = pz - ap.z;
  const d = Math.hypot(dx, dz) || 1;
  const nx = dx / d;
  const nz = dz / d;
  return {
    x: px - nx * 0.55,
    y: 1.2,
    z: pz - nz * 0.55,
  };
}

export function fireBlockParryVfx(
  kind: BlockVfxKind,
  success: boolean,
  at?: { x: number; y: number; z: number },
): void {
  blockParryVfx.kind = kind;
  blockParryVfx.success = success;
  blockParryVfx.x = at?.x ?? worldPositions.player.x;
  blockParryVfx.y = at?.y ?? 1.15;
  blockParryVfx.z = at?.z ?? worldPositions.player.z;
  blockParryVfx.token++;

  blockScreenFx.kind = kind;
  blockScreenFx.success = success;
  blockScreenFx.token++;
}