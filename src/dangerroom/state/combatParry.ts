import { fireBlockParryVfx, strikeContactPoint } from "./blockParryVfx";
import { fireClash } from "./combatClash";
import { worldPositions } from "./world";

/**
 * Parry / block state shared between input, animation, and incoming enemy strikes.
 * Hold R to block; tap R during an enemy's telegraph window to parry (see ref
 * concept: timing-based deflect → counter opening).
 */
export const combatParry = {
  blocking: false,
  /** Monotonic ms — parry pose armed until this instant (tap R). */
  parryArmedUntil: 0,
  /** Brief floaty knockback applied to the player after a successful parry. */
  reboundUntil: 0,
  reboundVx: 0,
  reboundVz: 0,
  /** True for a short beat after a successful parry — next melee deals bonus damage. */
  riposteReady: false,
  riposteUntil: 0,
  /** Enemy id whose strike was just parried (for VFX / log). */
  lastParryTargetId: null as string | null,
  /** Flash the reticle on successful parry. */
  parryFlash: 0,
  /** Incoming strike window — set by enemies during attack wind-up. */
  incomingStrikeFrom: null as string | null,
  incomingStrikeUntil: 0,
  /** Attacker negated by a successful parry — cleared after their strike resolves. */
  parriedAttackerId: null as string | null,
};

export const PARRY_WINDOW_MS = 380;
export const PARRY_ARMED_MS = 320;
export const BLOCK_DAMAGE_MULT = 0.35;
export const RIPOSTE_DAMAGE_MULT = 1.65;
export const RIPOSTE_WINDOW_MS = 1400;
export const REBOUND_MS = 220;

export function openParryWindow(attackerId: string, until: number) {
  combatParry.incomingStrikeFrom = attackerId;
  combatParry.incomingStrikeUntil = until;
}

export function isParryArmed(now = performance.now()): boolean {
  return now < combatParry.parryArmedUntil;
}

export function requestParry(now: number): void {
  combatParry.parryArmedUntil = now + PARRY_ARMED_MS;
  const contact = strikeContactPoint(combatParry.incomingStrikeFrom);
  fireBlockParryVfx("parry", false, contact);
  if (combatParry.incomingStrikeFrom) {
    fireClash("parry", combatParry.incomingStrikeFrom, 0.75, contact);
  }
}

export function applyReboundKnockback(attackerId: string | null, now: number): void {
  const contact = strikeContactPoint(attackerId);
  const px = contact.x;
  const pz = contact.z;
  const ax = attackerId ? (worldPositions.dummies.get(attackerId)?.x ?? px) : px;
  const az = attackerId ? (worldPositions.dummies.get(attackerId)?.z ?? pz) : pz;
  const dx = px - ax;
  const dz = pz - az;
  const d = Math.hypot(dx, dz) || 1;
  const push = 4.2;
  combatParry.reboundVx = (dx / d) * push;
  combatParry.reboundVz = (dz / d) * push;
  combatParry.reboundUntil = now + REBOUND_MS;
}

export function tryParry(now: number): boolean {
  const armed = isParryArmed(now);
  if (
    combatParry.incomingStrikeFrom &&
    now <= combatParry.incomingStrikeUntil &&
    (armed || now >= combatParry.incomingStrikeUntil - PARRY_WINDOW_MS)
  ) {
    const attackerId = combatParry.incomingStrikeFrom;
    combatParry.lastParryTargetId = attackerId;
    combatParry.parriedAttackerId = attackerId;
    combatParry.incomingStrikeFrom = null;
    combatParry.incomingStrikeUntil = 0;
    combatParry.parryArmedUntil = 0;
    combatParry.riposteReady = true;
    combatParry.riposteUntil = now + RIPOSTE_WINDOW_MS;
    combatParry.parryFlash += 1;
    const contact = strikeContactPoint(attackerId);
    fireBlockParryVfx("rebound", true, contact);
    fireClash("rebound", attackerId, 1.35, contact);
    applyReboundKnockback(attackerId, now);
    return true;
  }
  return false;
}

export function clearIncomingStrike(now: number) {
  if (now > combatParry.incomingStrikeUntil) {
    combatParry.incomingStrikeFrom = null;
    combatParry.incomingStrikeUntil = 0;
  }
}