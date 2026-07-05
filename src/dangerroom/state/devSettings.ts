/** Dev / QA toggles — persisted locally for production preview testing. */
export const devSettings = {
  panelOpen: import.meta.env.DEV,
  showFps: false,
  showCombatState: true,
  showArenaWalls: false,
  slowMo: false,
  hitStop: true,
};

const KEY = "icr-dev-settings";

export function loadDevSettings(): void {
  if (!import.meta.env.DEV) return;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<typeof devSettings>;
    Object.assign(devSettings, parsed);
  } catch {
    /* ignore corrupt storage */
  }
}

export function saveDevSettings(): void {
  if (!import.meta.env.DEV) return;
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        panelOpen: devSettings.panelOpen,
        showFps: devSettings.showFps,
        showCombatState: devSettings.showCombatState,
        showArenaWalls: devSettings.showArenaWalls,
        slowMo: devSettings.slowMo,
        hitStop: devSettings.hitStop,
      }),
    );
  } catch {
    /* storage full / private mode */
  }
}

loadDevSettings();

export function combatTimeScale(): number {
  return import.meta.env.DEV && devSettings.slowMo ? 0.45 : 1;
}