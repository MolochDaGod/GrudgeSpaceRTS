/** Per-frame combat aim flags (mutable singleton — not React state). */
export const combatAim = {
  /** RMB toggle — hard focus: LMB attacks instead of select. */
  focusEnabled: false,
  /** True while RMB is held for camera orbit. */
  rmbHeld: false,
  /** Bumped on successful hits to flash the crosshair marker. */
  hitMarker: 0,
  /** Crosshair spread when soft-locked without hard focus. */
  softLock: false,
};

/** Camera-forward yaw on the XZ plane (character faces this in strafe-lock). */
export function camForwardYaw(cameraYaw: number): number {
  return cameraYaw + Math.PI;
}