import { useEffect } from "react";
import { useGame } from "../state/gameStore";
import { combatAim } from "../state/combatAim";
import { combatParry } from "../state/combatParry";
import { worldPositions } from "../state/world";

type RangeState = "close" | "optimal" | "far" | "none";

const CH_FOCUS = "#6fe0ff";
const CH_SOFT = "#ffd27f";
const CH_HOSTILE = "#ff6b6b";

function resolveRangeState(targetId: string | null): RangeState {
  if (!targetId) return "none";
  const dist = worldPositions.distanceToPlayer(targetId);
  if (dist > 14) return "far";
  if (dist < 2.2) return "close";
  return "optimal";
}

/**
 * Screen reticle — soft lock (amber, tight) vs hard focus (cyan, spread).
 * Matches Character-Animator-two / Danger Room reference (MLh8mAE).
 */
export function CombatCrosshair() {
  const { state, classDef } = useGame();
  if (!classDef) return null;

  const softLock = combatAim.softLock && !combatAim.focusEnabled;
  const hardFocus = combatAim.focusEnabled;
  const showCrosshair = softLock || hardFocus;

  const gap = hardFocus ? (combatAim.rmbHeld ? 2 : 4) : 0;
  const chColor = hardFocus ? CH_FOCUS : softLock ? CH_SOFT : CH_HOSTILE;
  const rangeState = resolveRangeState(state.targetId);
  const showRange = showCrosshair && rangeState !== "none";

  const now = performance.now();
  const parryWindow =
    combatParry.incomingStrikeFrom !== null && now <= combatParry.incomingStrikeUntil;
  const riposteReady = combatParry.riposteReady && now < combatParry.riposteUntil;

  const target = state.targetId ? state.dummies[state.targetId] : null;

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    canvas.classList.toggle("dr-combat-cursor", hardFocus);
    return () => canvas.classList.remove("dr-combat-cursor");
  }, [hardFocus]);

  if (!showCrosshair && !softLock) return null;

  return (
    <div className="dr-targeting-hud" aria-hidden>
      <div className="dr-mode-strip">
        <span className={`dr-mode-pill dr-mode-soft${softLock ? " is-active" : ""}`}>
          Soft Lock
        </span>
        <span className={`dr-mode-pill dr-mode-focus${hardFocus ? " is-active" : ""}`}>
          Hard Focus
        </span>
      </div>

      {hardFocus && (
        <div className="dr-focus-badge dr-focus-badge--cyan">◎ Hard Focus — LMB attacks · Strafe lock</div>
      )}

      {softLock && (
        <div className="dr-soft-badge">
          ◎ Soft Lock — {target?.name ?? "target"}
        </div>
      )}

      {showCrosshair && (
        <div
          className={`dr-crosshair${softLock && !hardFocus ? " dr-crosshair-soft" : " dr-crosshair-focus"}`}
          style={{ ["--ch-gap" as string]: `${gap}px`, ["--ch-color" as string]: chColor }}
        >
          {showRange && <span className={`dr-ch-range dr-ch-range-${rangeState}`} />}
          {softLock && !hardFocus && <span className="dr-ch-soft-diamond" />}
          <span className="dr-ch-dot" />
          {(hardFocus || !softLock) && (
            <>
              <span className="dr-ch-line dr-ch-top" />
              <span className="dr-ch-line dr-ch-bottom" />
              <span className="dr-ch-line dr-ch-left" />
              <span className="dr-ch-line dr-ch-right" />
            </>
          )}
          {parryWindow && <span className="dr-ch-parry-window" />}
          {riposteReady && <span className="dr-ch-riposte" />}
          {combatParry.parryFlash > 0 && (
            <span key={combatParry.parryFlash} className="dr-ch-parry-flash" />
          )}
          {combatAim.hitMarker > 0 && (
            <span key={combatAim.hitMarker} className="dr-ch-hit">
              <span className="dr-ch-hit-line dr-ch-hit-tl" />
              <span className="dr-ch-hit-line dr-ch-hit-tr" />
              <span className="dr-ch-hit-line dr-ch-hit-bl" />
              <span className="dr-ch-hit-line dr-ch-hit-br" />
            </span>
          )}
        </div>
      )}

      {softLock && !hardFocus && (
        <div className="dr-target-hint">
          Target locked — RMB tap for hard focus · LMB selects
        </div>
      )}
    </div>
  );
}