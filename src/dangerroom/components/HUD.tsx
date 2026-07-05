/** @deprecated Use MainPanelHud — kept for reference only; not mounted in GameCanvas. */
import { useGame } from "../state/gameStore";
import { CombatCrosshair } from "./CombatCrosshair";

function Bar({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#ddd", marginBottom: 2 }}>
        <span>{label}</span>
        <span>
          {Math.round(value)} / {Math.round(max)}
        </span>
      </div>
      <div style={{ width: 260, height: 14, background: "#1b1b1b", borderRadius: 4, overflow: "hidden", border: "1px solid #000" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width 0.15s" }} />
      </div>
    </div>
  );
}

export function HUD() {
  const { state, classDef, useAbility, cooldownFraction, setTarget } = useGame();
  if (!classDef) return null;

  const target = state.targetId ? state.dummies[state.targetId] : null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: "system-ui, sans-serif",
        color: "#fff",
        userSelect: "none",
      }}
    >
      <div style={{ position: "absolute", top: 16, left: 16, background: "rgba(10,10,12,0.65)", padding: "12px 16px", borderRadius: 8 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          {classDef.name} <span style={{ opacity: 0.6, fontWeight: 400 }}>· {classDef.title}</span>
        </div>
        <Bar value={state.hp} max={state.maxHp} color="#e0393e" label="Health" />
        <Bar value={state.resource} max={state.maxResource} color={classDef.color} label={classDef.resourceLabel} />
        {state.shield > 0 && (
          <div style={{ fontSize: 12, color: "#ffe98f" }}>Shield active: {Math.round(state.shield)}</div>
        )}
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Kills: {state.kills}</div>
      </div>

      {target && (
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(10,10,12,0.65)",
            padding: "10px 14px",
            borderRadius: 8,
            minWidth: 180,
            pointerEvents: "auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>{target.name}</strong>
            <button
              onClick={() => setTarget(null)}
              style={{ background: "transparent", color: "#aaa", border: "none", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
          <Bar value={target.hp} max={target.maxHp} color="#f2b53d" label={target.alive ? "Health" : "Defeated"} />
        </div>
      )}

      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 10,
          pointerEvents: "auto",
        }}
      >
        {classDef.abilities.map((ability) => {
          const cd = cooldownFraction(ability);
          const disabled = state.resource < ability.cost;
          return (
            <button
              key={ability.id}
              onClick={() => useAbility(ability)}
              title={ability.description}
              style={{
                width: 76,
                height: 76,
                borderRadius: 10,
                border: `2px solid ${ability.color}`,
                background: `linear-gradient(180deg, ${ability.color}33, #101012)`,
                color: "#fff",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                opacity: disabled ? 0.5 : 1,
                fontSize: 11,
                textAlign: "center",
                padding: 4,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 18 }}>{ability.key}</div>
              <div>{ability.name}</div>
              {cd > 0 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.65)",
                    height: `${cd * 100}%`,
                    top: "auto",
                    bottom: 0,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 16,
          width: 280,
          maxHeight: 160,
          overflowY: "auto",
          background: "rgba(10,10,12,0.55)",
          borderRadius: 8,
          padding: "8px 10px",
          fontSize: 11.5,
          lineHeight: 1.5,
        }}
      >
        {state.log.slice(-8).map((entry) => (
          <div key={entry.id} style={{ opacity: 0.85 }}>
            {entry.text}
          </div>
        ))}
      </div>

      <CombatCrosshair />

      <div
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 12,
          opacity: 0.65,
          background: "rgba(10,10,12,0.5)",
          padding: "4px 10px",
          borderRadius: 6,
        }}
      >
        WASD camera-relative · RMB drag look · RMB click focus · LMB attack in focus · 1-5 abilities
      </div>
    </div>
  );
}
