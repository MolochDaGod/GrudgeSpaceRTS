/**
 * Compact Nexus 8-stat + inventory strip for Ground HUD.
 */

import { useGame } from "../state/gameStore";
import { NEXUS_STAT_META } from "../nexus/attributes";
import { NEXUS_RARITY_COLOR } from "../nexus/items";

export function NexusStatsPanel() {
  const { state } = useGame();
  if (!state.classId) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 96,
        left: 12,
        width: 220,
        pointerEvents: "none",
        zIndex: 40,
        fontFamily: "ui-monospace, Consolas, monospace",
      }}
    >
      <div
        style={{
          background: "rgba(4,10,18,0.88)",
          border: "1px solid rgba(255,198,42,0.28)",
          borderRadius: 8,
          padding: "10px 12px",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            fontSize: 9,
            letterSpacing: 2,
            color: "#ffc62a",
            fontWeight: 700,
            marginBottom: 8,
            textTransform: "uppercase",
          }}
        >
          Nexus Attributes
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {NEXUS_STAT_META.map((m) => (
            <div
              key={m.key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: "#9aa6b2",
              }}
              title={m.desc}
            >
              <span style={{ color: m.color, fontWeight: 700 }}>{m.abbr}</span>
              <span style={{ color: "#e8eef7" }}>{state.nexusStats[m.key]}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            fontSize: 10,
            color: "#9aa6b2",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>DMG +{Math.round(state.damageBonus)}</span>
          <span>ARM {Math.round(state.armorBonus)}</span>
        </div>
        {state.loadout.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                fontSize: 9,
                letterSpacing: 1.5,
                color: "#88aacc",
                marginBottom: 4,
                textTransform: "uppercase",
              }}
            >
              Loadout
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {state.loadout.map((it) => (
                <span
                  key={it.id}
                  title={`${it.name}\n${it.description}`}
                  style={{
                    fontSize: 14,
                    lineHeight: 1,
                    padding: "3px 5px",
                    borderRadius: 4,
                    border: `1px solid ${NEXUS_RARITY_COLOR[it.rarity]}55`,
                    background: "rgba(0,0,0,0.35)",
                  }}
                >
                  {it.icon}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
