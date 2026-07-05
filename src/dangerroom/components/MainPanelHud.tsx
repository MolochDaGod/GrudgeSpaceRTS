import { useMemo } from "react";
import { useGame } from "../state/gameStore";
import { worldPositions } from "../state/world";
import { playerMode } from "../state/playerMode";

import { defaultWeaponBar } from "../data/weaponSkills";
import { CombatCrosshair } from "./CombatCrosshair";
import "../styles/grudge-main-panel.css";

export function MainPanelHud() {
  const { state, classDef, useAbility, cooldownFraction, setTarget } = useGame();
  const weaponBar = useMemo(
    () => (classDef ? defaultWeaponBar(classDef.abilities) : []),
    [classDef],
  );
  if (!classDef) return null;

  const target = state.targetId ? state.dummies[state.targetId] : null;
  const hpPct = Math.max(0, Math.min(100, (state.hp / state.maxHp) * 100));
  const resPct = Math.max(0, Math.min(100, (state.resource / state.maxResource) * 100));
  const xpPct = Math.min(100, state.kills * 12 + state.pelts * 4);

  return (
    <div className="gmp-root" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <header className="gmp-top-bar">
        <div className="gmp-title">Ground Combat</div>
        <div className="gmp-player-info">
          <span style={{ color: "var(--gmp-gold)", fontFamily: "Cinzel, serif" }}>{classDef.name}</span>
          <span style={{ color: "var(--gmp-muted)" }}>
            {playerMode.toolMode === "harvest"
              ? `Harvest · ${playerMode.harvestTool}`
              : classDef.title}
          </span>
          <div className="gmp-xp-bar">
            <div className="gmp-xp-fill" style={{ width: `${xpPct}%` }} />
          </div>
        </div>
      </header>

      <aside className="gmp-left-col">
        <div className="gmp-stat-row">
          <span className="k">Health</span>
          <span className="v">
            {Math.round(state.hp)} / {Math.round(state.maxHp)}
          </span>
        </div>
        <div className="gmp-bar-track">
          <div className="gmp-bar-fill" style={{ width: `${hpPct}%`, background: "var(--gmp-red)" }} />
        </div>
        <div className="gmp-stat-row">
          <span className="k">{classDef.resourceLabel}</span>
          <span className="v">
            {Math.round(state.resource)} / {Math.round(state.maxResource)}
          </span>
        </div>
        <div className="gmp-bar-track">
          <div
            className="gmp-bar-fill"
            style={{ width: `${resPct}%`, background: classDef.color }}
          />
        </div>

        {worldPositions.playerInWater && (
          <div className="gmp-swim-badge">
            <span>◎ Swimming</span>
            <span style={{ opacity: 0.75 }}>Space ↑ · Ctrl ↓</span>
          </div>
        )}
        <div className="gmp-log">
          {state.log.slice(-6).map((entry) => (
            <div key={entry.id}>{entry.text}</div>
          ))}
        </div>
      </aside>

      {target && (
        <aside className="gmp-right-col">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontFamily: "Cinzel, serif", fontSize: 12 }}>{target.name}</strong>
            <button
              type="button"
              onClick={() => setTarget(null)}
              style={{
                background: "transparent",
                color: "#aaa",
                border: "none",
                cursor: "pointer",
                pointerEvents: "auto",
              }}
            >
              ✕
            </button>
          </div>
          <div className="gmp-bar-track" style={{ marginTop: 8 }}>
            <div
              className="gmp-bar-fill"
              style={{
                width: `${Math.max(0, Math.min(100, (target.hp / target.maxHp) * 100))}%`,
                background: target.alive ? "#f2b53d" : "#666",
              }}
            />
          </div>
        </aside>
      )}

      <div className="gmp-hint">
        LMB soft lock · RMB tap hard focus · Hold R block · Tap R parry · Q harvest · F gather · Alt roll · 1-5
      </div>

      <CombatCrosshair />

      <footer className="gmp-hotbar">
        {weaponBar.map((slot) => {
          const ability =
            slot.kind === "ability"
              ? classDef.abilities.find((a) => a.id === slot.skillId)
              : classDef.abilities[0];
          const cd = ability ? cooldownFraction(ability) : 0;
          const disabled = ability ? state.resource < ability.cost : false;
          const active =
            playerMode.toolMode === "weapon" || ["1", "2", "3", "4", "5"].includes(slot.key);
          if (!active && playerMode.toolMode === "harvest") return null;
          return (
            <button
              key={slot.key}
              type="button"
              className="gmp-hb-slot"
              onClick={() => ability && useAbility(ability)}
              title={slot.label}
              style={{
                borderColor: ability?.color ?? "#666",
                opacity: disabled ? 0.5 : 1,
                pointerEvents: "auto",
              }}
            >
              <span className="key">{slot.key}</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{slot.key}</span>
              <span className="name">{slot.label}</span>
              {cd > 0 && <div className="cd" style={{ height: `${cd * 100}%` }} />}
            </button>
          );
        })}
        {playerMode.toolMode === "harvest" && (
          <button type="button" className="gmp-hb-slot" style={{ borderColor: "#8ec8ff", pointerEvents: "auto" }}>
            <span className="key">F</span>
            <span style={{ fontWeight: 700, fontSize: 14 }}>F</span>
            <span className="name">{playerMode.harvestTool}</span>
          </button>
        )}
      </footer>
    </div>
  );
}