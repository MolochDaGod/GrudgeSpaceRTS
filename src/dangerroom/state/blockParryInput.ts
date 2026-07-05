/** Tap-vs-hold classifier for the block key. Quick tap = parry; hold = guard. */

export const PARRY_TAP_MAX_MS = 220;
export const BLOCK_HOLD_MIN_MS = 220;

export type BlockKeyRelease = "parry" | "block_release" | "none";

export interface BlockKeySession {
  down: boolean;
  downAt: number;
  holdActivated: boolean;
}

export function createBlockKeySession(): BlockKeySession {
  return { down: false, downAt: 0, holdActivated: false };
}

export function onBlockKeyDown(session: BlockKeySession, now: number): void {
  session.down = true;
  session.downAt = now;
  session.holdActivated = false;
}

export function shouldActivateBlockHold(session: BlockKeySession, now: number): boolean {
  if (!session.down || session.holdActivated) return false;
  return now - session.downAt >= BLOCK_HOLD_MIN_MS;
}

export function markBlockHoldActivated(session: BlockKeySession): void {
  session.holdActivated = true;
}

export function onBlockKeyUp(session: BlockKeySession, now: number): BlockKeyRelease {
  if (!session.down) return "none";
  const held = now - session.downAt;
  session.down = false;
  if (!session.holdActivated && held <= PARRY_TAP_MAX_MS) return "parry";
  if (session.holdActivated) return "block_release";
  return "none";
}