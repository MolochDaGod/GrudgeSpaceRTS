import { useEffect, useState } from "react";
import { useGame } from "../state/gameStore";
import { combatParry, isParryArmed } from "../state/combatParry";
import { combatClash } from "../state/combatClash";
import { combatAim } from "../state/combatAim";
import { playerMode } from "../state/playerMode";
import { devSettings, saveDevSettings } from "../state/devSettings";
import { isEnemyLaunched } from "../state/combatKnockback";

/**
 * Collapsible QA panel — combat state readout, toggles, and quick resets.
 * Only mounted when `import.meta.env.DEV` (see GameCanvas).
 */
export function DevCombatPanel() {
  const { state, setTarget } = useGame();
  const [, bump] = useState(0);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      frames++;
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!import.meta.env.DEV) return null;

  const now = performance.now();
  const launched = state.targetId ? isEnemyLaunched(state.targetId) : false;

  const toggle = (key: keyof typeof devSettings, value?: boolean) => {
    const next = value ?? !devSettings[key];
    (devSettings as Record<string, boolean>)[key] = next as boolean;
    saveDevSettings();
    bump((n) => n + 1);
  };

  return (
    <div
      className="icr-dev-panel"
      style={{
        position: "fixed",
        top: 8,
        right: 8,
        zIndex: 50,
        pointerEvents: "auto",
        fontFamily: "ui-monospace, monospace",
        fontSize: 11,
        color: "#cde8ff",
        background: "rgba(8, 14, 24, 0.92)",
        border: "1px solid rgba(111, 224, 255, 0.35)",
        borderRadius: 8,
        minWidth: devSettings.panelOpen ? 280 : 120,
        maxWidth: 320,
      }}
    >
      <button
        type="button"
        onClick={() => toggle("panelOpen")}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "8px 10px",
          background: "transparent",
          border: "none",
          color: "#9ee8ff",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        {devSettings.panelOpen ? "▼" : "▶"} Dev / QA
        {devSettings.showFps && <span style={{ float: "right", opacity: 0.8 }}>{fps} fps</span>}
      </button>

      {devSettings.panelOpen && (
        <div style={{ padding: "0 10px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={devSettings.showFps} onChange={() => toggle("showFps")} />
            Show FPS
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={devSettings.showCombatState}
              onChange={() => toggle("showCombatState")}
            />
            Combat state readout
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={devSettings.showArenaWalls}
              onChange={() => toggle("showArenaWalls")}
            />
            Highlight arena walls
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={devSettings.slowMo} onChange={() => toggle("slowMo")} />
            Slow-mo (0.45×)
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={devSettings.hitStop} onChange={() => toggle("hitStop")} />
            Parry hit-stop
          </label>

          {devSettings.showCombatState && (
            <pre
              style={{
                margin: "4px 0 0",
                padding: 8,
                background: "rgba(0,0,0,0.35)",
                borderRadius: 4,
                fontSize: 10,
                lineHeight: 1.45,
                whiteSpace: "pre-wrap",
              }}
            >
              {`target: ${state.targetId ?? "—"}
soft: ${combatAim.softLock}  focus: ${combatAim.focusEnabled}
block: ${combatParry.blocking}  parry armed: ${isParryArmed(now)}
riposte: ${combatParry.riposteReady && now < combatParry.riposteUntil}
telegraph: ${combatParry.incomingStrikeFrom ?? "—"}
launched: ${launched}
clash: ${now < combatClash.until ? combatClash.kind : "—"}
tool: ${playerMode.toolMode}
MM: ${playerMode.lastMM.toFixed(0)}`}
            </pre>
          )}

          <button
            type="button"
            onClick={() => setTarget(null)}
            style={{
              marginTop: 4,
              padding: "6px 8px",
              background: "rgba(111,224,255,0.12)",
              border: "1px solid rgba(111,224,255,0.3)",
              borderRadius: 4,
              color: "#cde8ff",
              cursor: "pointer",
            }}
          >
            Clear target
          </button>
        </div>
      )}
    </div>
  );
}