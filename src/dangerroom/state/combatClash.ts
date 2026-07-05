import { worldPositions } from "./world";

export type ClashKind = "block" | "parry" | "rebound" | "melee";

/** Anime clash burst — both combatants blink + bounce apart for a few frames. */
export const combatClash = {
  token: 0,
  kind: "parry" as ClashKind,
  enemyId: null as string | null,
  until: 0,
  /** Planar separation normal (player pushed along +sep). */
  sepX: 0,
  sepZ: 0,
  intensity: 1,
  contactX: 0,
  contactY: 1.2,
  contactZ: 0,
};

export function fireClash(
  kind: ClashKind,
  enemyId: string | null,
  intensity = 1,
  contact?: { x: number; y: number; z: number },
): void {
  const px = worldPositions.player.x;
  const pz = worldPositions.player.z;
  let sepX = 0;
  let sepZ = 1;
  if (enemyId) {
    const ep = worldPositions.dummies.get(enemyId);
    if (ep) {
      const dx = px - ep.x;
      const dz = pz - ep.z;
      const d = Math.hypot(dx, dz) || 1;
      sepX = dx / d;
      sepZ = dz / d;
    }
  }
  combatClash.kind = kind;
  combatClash.enemyId = enemyId;
  combatClash.sepX = sepX;
  combatClash.sepZ = sepZ;
  combatClash.intensity = intensity;
  combatClash.contactX = contact?.x ?? px;
  combatClash.contactY = contact?.y ?? 1.2;
  combatClash.contactZ = contact?.z ?? pz;
  combatClash.until = performance.now() + (kind === "rebound" ? 340 : kind === "block" ? 260 : 280);
  combatClash.token++;
}

export function clashActiveFor(entityId: "player" | string, now = performance.now()): boolean {
  if (now > combatClash.until) return false;
  return entityId === "player" || combatClash.enemyId === entityId;
}

/** Returns 0–1 bounce offset along separation axis for the entity. */
export function clashBounceOffset(entityId: "player" | string, now = performance.now()): number {
  if (!clashActiveFor(entityId, now)) return 0;
  const dur = combatClash.kind === "rebound" ? 340 : 260;
  const left = combatClash.until - now;
  const t = 1 - left / dur;
  const sign = entityId === "player" ? 1 : -1;
  return sign * Math.sin(t * Math.PI) * 0.42 * combatClash.intensity;
}

/** Rapid anime blink scale pulse on both clash participants. */
export function clashBlinkScale(now = performance.now()): number {
  if (now > combatClash.until) return 1;
  const left = combatClash.until - now;
  const t = 1 - left / 280;
  const phase = Math.sin(t * Math.PI * 10);
  return phase > 0.15 ? 1.1 : 0.84;
}

export function clashTint(now = performance.now()): string | undefined {
  if (now > combatClash.until) return undefined;
  const phase = Math.sin((1 - (combatClash.until - now) / 280) * Math.PI * 10);
  if (combatClash.kind === "rebound") return phase > 0 ? "#e8f8ff" : "#ffffff";
  if (combatClash.kind === "block") return phase > 0 ? "#8ec8ff" : "#c8e8ff";
  return phase > 0 ? "#ffd080" : "#fff4d0";
}