/**
 * Nexus Ground deploy — toon body + survival origin + 8-stat point buy.
 * No knight/warrior/mage/ranger roles.
 */

import { useMemo, useState } from "react";
import { useGame } from "../state/gameStore";
import { NEXUS_TOONS, type NexusGender, toonKey } from "../nexus/nexusToons";
import {
  NEXUS_STAT_META,
  STARTING_BUDGET,
  STAT_MAX,
  remainingBudget,
  tryRaiseStat,
  tryLowerStat,
  costForNext,
  type NexusStats,
  type NexusStatKey,
  poolsFromNexus,
  primaryResourceFromStats,
} from "../nexus/attributes";
import { NEXUS_ORIGINS, applyOriginSeeds, getOrigin } from "../nexus/origins";
import { resolveLoadout, NEXUS_RARITY_COLOR } from "../nexus/items";

export function NexusToonSelect() {
  const { deploySurvivor } = useGame();
  const [gender, setGender] = useState<NexusGender>("male");
  const [toonId, setToonId] = useState(NEXUS_TOONS.find((t) => t.gender === "male")!.id);
  const [originId, setOriginId] = useState("military");
  const [stats, setStats] = useState<NexusStats>(() =>
    applyOriginSeeds(getOrigin("military")!),
  );

  const toons = useMemo(() => NEXUS_TOONS.filter((t) => t.gender === gender), [gender]);
  const activeToon = toons.find((t) => t.id === toonId) ?? toons[0];
  const origin = getOrigin(originId) ?? NEXUS_ORIGINS[0];
  const budgetLeft = remainingBudget(stats);
  const pools = poolsFromNexus(stats);
  const prim = primaryResourceFromStats(stats);
  const loadout = resolveLoadout(origin.starterItems);

  const pickOrigin = (id: string) => {
    const o = getOrigin(id);
    if (!o) return;
    setOriginId(id);
    setStats(applyOriginSeeds(o));
  };

  const raise = (key: NexusStatKey) => {
    const next = tryRaiseStat(stats, key);
    if (next) setStats(next);
  };
  const lower = (key: NexusStatKey) => {
    const next = tryLowerStat(stats, key);
    if (next) setStats(next);
  };

  const deploy = () => {
    deploySurvivor({
      toonKey: toonKey(activeToon.gender, activeToon.id),
      originId: origin.id,
      nexusStats: stats,
    });
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>NEXUS GROUND</h1>
        <div style={styles.kicker}>
          TOON BODY · SURVIVAL ORIGIN · 8 ATTRIBUTES · NO CLASS ROLES
        </div>
      </header>
      <p style={styles.subtitle}>
        Deploy a baked Nexus toon with Grudges survival stats (BIO·NEU·KIN·QNT·SYN·CHR·ENT·GRA).
        Origins seed attributes; spend remaining budget on the board. Abilities come from your
        stats — not knight / warrior / mage / ranger.
      </p>

      {/* Gender */}
      <div style={styles.row}>
        {(["male", "female"] as NexusGender[]).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => {
              setGender(g);
              const first = NEXUS_TOONS.find((t) => t.gender === g);
              if (first) {
                setToonId(first.id);
                pickOrigin(first.defaultOrigin);
              }
            }}
            style={{
              ...styles.chip,
              borderColor: gender === g ? "#ffc62a" : "#334",
              color: gender === g ? "#ffc62a" : "#9ab",
            }}
          >
            {g === "male" ? "♂ Male" : "♀ Female"}
          </button>
        ))}
      </div>

      <h2 style={styles.section}>Body</h2>
      <div style={styles.grid}>
        {toons.map((t) => {
          const active = t.id === activeToon.id;
          return (
            <button
              key={`${t.gender}-${t.id}`}
              type="button"
              onClick={() => {
                setToonId(t.id);
                pickOrigin(t.defaultOrigin);
              }}
              style={{
                ...styles.card,
                borderColor: active ? "#ffc62a" : "#1a2a3a",
                boxShadow: active ? "0 0 18px rgba(255,198,42,0.18)" : "none",
              }}
            >
              <div style={{ fontSize: 26 }}>{t.icon}</div>
              <div style={styles.cardLabel}>{t.label}</div>
            </button>
          );
        })}
      </div>

      <h2 style={styles.section}>Origin</h2>
      <div style={styles.originGrid}>
        {NEXUS_ORIGINS.map((o) => {
          const active = o.id === origin.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => pickOrigin(o.id)}
              style={{
                ...styles.originCard,
                borderColor: active ? "#ffc62a" : "#1a2a3a",
              }}
            >
              <div style={{ fontSize: 20 }}>{o.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{o.label}</div>
              <div style={{ fontSize: 10, color: "#ffc62a99" }}>{o.emphasis}</div>
              <div style={{ fontSize: 10, color: "#7a90a8", marginTop: 4, lineHeight: 1.35 }}>
                {o.description}
              </div>
            </button>
          );
        })}
      </div>

      <h2 style={styles.section}>
        Attributes{" "}
        <span style={{ color: budgetLeft > 0 ? "#3dd68c" : "#f66", marginLeft: 8 }}>
          budget {budgetLeft} / {STARTING_BUDGET}
        </span>
      </h2>
      <div style={styles.statBoard}>
        {NEXUS_STAT_META.map((m) => (
          <div key={m.key} style={styles.statRow} title={m.desc}>
            <span style={{ color: m.color, fontWeight: 800, width: 36 }}>{m.abbr}</span>
            <span style={{ flex: 1, fontSize: 11, color: "#9ab" }}>{m.label}</span>
            <button type="button" style={styles.pm} onClick={() => lower(m.key)} disabled={stats[m.key] <= 0}>
              −
            </button>
            <span style={{ width: 20, textAlign: "center", fontWeight: 700 }}>{stats[m.key]}</span>
            <button
              type="button"
              style={styles.pm}
              onClick={() => raise(m.key)}
              disabled={stats[m.key] >= STAT_MAX || remainingBudget(stats) < costForNext(stats[m.key])}
            >
              +
            </button>
          </div>
        ))}
      </div>

      <div style={styles.preview}>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#ffc62a", fontWeight: 700, marginBottom: 6 }}>
            {activeToon.icon} {activeToon.label} · {origin.icon} {origin.label}
          </div>
          <div style={{ fontSize: 11, color: "#8ab", marginBottom: 8 }}>
            HP {pools.maxHealth} · {prim.resourceLabel} {prim.maxResource} · Move{" "}
            {pools.moveSpeed.toFixed(2)} · Armor {pools.armor} · Crit {pools.critChance.toFixed(0)}%
          </div>
          <div style={{ fontSize: 10, color: "#6a8098", marginBottom: 8 }}>
            {origin.proficiencies.join(" · ")}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {loadout.map((it) => (
              <span
                key={it.id}
                title={`${it.name}\n${it.description}`}
                style={{
                  fontSize: 16,
                  padding: "2px 6px",
                  borderRadius: 4,
                  border: `1px solid ${NEXUS_RARITY_COLOR[it.rarity]}66`,
                }}
              >
                {it.icon}
              </span>
            ))}
          </div>
        </div>
        <button type="button" onClick={deploy} style={styles.deploy}>
          Deploy survivor →
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    position: "absolute",
    inset: 0,
    overflowY: "auto",
    padding: "24px 20px 48px",
    background: "radial-gradient(ellipse at 50% 0%, #12203a 0%, #060a12 55%)",
    color: "#e8eef7",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  header: { marginBottom: 8 },
  title: {
    margin: 0,
    fontSize: 26,
    letterSpacing: 4,
    color: "#ffc62a",
    fontFamily: "Cinzel, Georgia, serif",
  },
  kicker: { fontSize: 10, letterSpacing: 2, color: "#6a8aaa", marginTop: 4 },
  subtitle: { fontSize: 13, color: "#8aa0b8", maxWidth: 720, lineHeight: 1.5, marginBottom: 14 },
  row: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid",
    background: "rgba(0,0,0,0.35)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },
  section: {
    fontSize: 11,
    letterSpacing: 2,
    color: "#ffc62a",
    textTransform: "uppercase",
    margin: "10px 0 8px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
    gap: 8,
    marginBottom: 12,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: "10px 6px",
    borderRadius: 10,
    border: "1px solid",
    background: "rgba(8,14,28,0.85)",
    cursor: "pointer",
    color: "#e8eef7",
  },
  cardLabel: { fontSize: 11, fontWeight: 700 },
  originGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 8,
    marginBottom: 12,
  },
  originCard: {
    textAlign: "left",
    padding: 12,
    borderRadius: 10,
    border: "1px solid",
    background: "rgba(8,14,28,0.9)",
    cursor: "pointer",
    color: "#e8eef7",
  },
  statBoard: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
    maxWidth: 560,
    marginBottom: 14,
  },
  statRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 8px",
    background: "rgba(0,0,0,0.35)",
    borderRadius: 6,
    border: "1px solid #1a2a3a",
  },
  pm: {
    width: 26,
    height: 26,
    borderRadius: 4,
    border: "1px solid #445",
    background: "#111a",
    color: "#dde",
    cursor: "pointer",
    fontWeight: 700,
  },
  preview: {
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    alignItems: "flex-end",
    padding: 16,
    borderRadius: 12,
    border: "1px solid rgba(255,198,42,0.25)",
    background: "rgba(4,10,20,0.9)",
  },
  deploy: {
    padding: "12px 22px",
    borderRadius: 8,
    border: "1px solid #ffc62a",
    background: "linear-gradient(180deg, #ffc62a33, #ffc62a11)",
    color: "#ffc62a",
    fontWeight: 800,
    letterSpacing: 1,
    cursor: "pointer",
    fontSize: 13,
  },
};
