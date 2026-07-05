import { useState } from "react";
import { CRUSADE_CLASSES, CRUSADE_RACES, FABLED_RACES, LEGION_RACES } from "../data/classes";
import type { RaceDef } from "../data/types";
import { useGame } from "../state/gameStore";

import { assetUrl } from "../config/assets";

const FACTION_EMBLEMS: Record<string, string> = {
  "The Crusade": "/ui/crusade-emblem.png",
  "The Fabled": "/ui/fabled-emblem.png",
  "The Legion": "/ui/legion-emblem.png",
};

const RACE_PORTRAITS: Record<string, string> = {
  barbarians: assetUrl("/images/portraits/barbarian.png"),
  "western-kingdoms": assetUrl("/images/portraits/human.png"),
  dwarves: assetUrl("/images/portraits/dwarf.png"),
  "high-elves": assetUrl("/images/portraits/elf.png"),
  orcs: assetUrl("/images/portraits/orc.png"),
  undead: assetUrl("/images/portraits/undead.png"),
};

interface FactionDef {
  id: string;
  name: string;
  emblem: string;
  accent: string;
  glowRgb: string;
  tagline: string;
  races: RaceDef[];
}

const FACTIONS: FactionDef[] = [
  {
    id: "The Crusade",
    name: "The Crusade",
    emblem: FACTION_EMBLEMS["The Crusade"],
    accent: "#7fb2ff",
    glowRgb: "90,140,255",
    tagline: "Disciplined banner of knights and highland warriors.",
    races: CRUSADE_RACES,
  },
  {
    id: "The Fabled",
    name: "The Fabled",
    emblem: FACTION_EMBLEMS["The Fabled"],
    accent: "#6fe0a2",
    glowRgb: "70,220,150",
    tagline: "Old magic and old grudges of dwarves and high elves.",
    races: FABLED_RACES,
  },
  {
    id: "The Legion",
    name: "The Legion",
    emblem: FACTION_EMBLEMS["The Legion"],
    accent: "#ff7a7a",
    glowRgb: "220,60,60",
    tagline: "Relentless war-host of orcs and the risen undead.",
    races: LEGION_RACES,
  },
];

export function ClassSelect() {
  const { selectClass } = useGame();
  const [factionId, setFactionId] = useState(FACTIONS[0].id);
  const [raceId, setRaceId] = useState(FACTIONS[0].races[0].id);
  const [hoverClass, setHoverClass] = useState<string | null>(null);

  const activeFaction = FACTIONS.find((f) => f.id === factionId) ?? FACTIONS[0];
  const activeRace = activeFaction.races.find((r) => r.id === raceId) ?? activeFaction.races[0];
  const accent = activeFaction.accent;

  const selectFaction = (f: FactionDef) => {
    setFactionId(f.id);
    setRaceId(f.races[0].id);
  };

  return (
    <div style={styles.page}>
      <style>{keyframes}</style>

      {/* Ambient banner glow */}
      <div
        style={{
          ...styles.glow,
          background: `radial-gradient(circle, rgba(${activeFaction.glowRgb},0.18), transparent 70%)`,
        }}
      />

      {/* Header crest */}
      <header style={styles.header}>
        <img src={activeFaction.emblem} alt={activeFaction.name} style={styles.crest} />
        <div>
          <h1 style={styles.title}>GRUDGE WARLORDS</h1>
          <div style={styles.kicker}>{activeFaction.name.toUpperCase()} · COMBAT SANDBOX</div>
        </div>
      </header>
      <p style={styles.subtitle}>
        Choose your faction, forge a champion, and test your steel in the arena.
      </p>

      {/* Faction selection */}
      <div style={styles.sectionLabel}>
        <span style={{ ...styles.sectionNum, borderColor: hexA(accent, 0.5), color: accent }}>I</span>{" "}
        Choose your faction
      </div>
      <div style={styles.factionRow}>
        {FACTIONS.map((f) => {
          const selected = f.id === factionId;
          return (
            <button
              key={f.id}
              onClick={() => selectFaction(f)}
              style={{
                ...styles.factionCard,
                borderColor: selected ? f.accent : "rgba(255,255,255,0.10)",
                boxShadow: selected
                  ? `0 0 0 1px ${f.accent}, 0 12px 40px ${hexA(f.accent, 0.3)}`
                  : "0 8px 24px rgba(0,0,0,0.45)",
                transform: selected ? "translateY(-4px)" : "translateY(0)",
              }}
            >
              <img src={f.emblem} alt={f.name} style={styles.factionCardEmblem} />
              <div style={styles.factionCardName}>{f.name}</div>
              <div style={styles.factionCardTagline}>{f.tagline}</div>
              {selected && <div style={{ ...styles.selectedTag, color: f.accent }}>SELECTED</div>}
            </button>
          );
        })}
      </div>

      {/* Race selection — portrait cards */}
      <div style={styles.sectionLabel}>
        <span style={{ ...styles.sectionNum, borderColor: hexA(accent, 0.5), color: accent }}>II</span>{" "}
        Choose your bloodline
        <span style={styles.raceHint}>· {activeFaction.name}</span>
      </div>
      <div style={styles.raceRow}>
        {activeFaction.races.map((race) => {
          const selected = race.id === raceId;
          return (
            <button
              key={race.id}
              onClick={() => setRaceId(race.id)}
              style={{
                ...styles.raceCard,
                borderColor: selected ? accent : "rgba(255,255,255,0.10)",
                boxShadow: selected
                  ? `0 0 0 1px ${accent}, 0 12px 40px ${hexA(accent, 0.3)}`
                  : "0 8px 24px rgba(0,0,0,0.45)",
                transform: selected ? "translateY(-4px)" : "translateY(0)",
              }}
            >
              <div style={styles.portraitWrap}>
                <img src={RACE_PORTRAITS[race.id]} alt={race.name} style={styles.portrait} />
                {selected && (
                  <div
                    style={{
                      ...styles.portraitRing,
                      borderColor: accent,
                      boxShadow: `0 0 20px ${hexA(accent, 0.6)}`,
                    }}
                  />
                )}
              </div>
              <div style={styles.raceName}>{race.name}</div>
              <div style={styles.raceBlurb}>{race.blurb}</div>
              {selected && <div style={{ ...styles.selectedTag, color: accent }}>SELECTED</div>}
            </button>
          );
        })}
      </div>

      {/* Class selection */}
      <div style={styles.sectionLabel}>
        <span style={{ ...styles.sectionNum, borderColor: hexA(accent, 0.5), color: accent }}>III</span>{" "}
        Choose your discipline
        <span style={styles.raceHint}>· as {activeRace.name}</span>
      </div>
      <div style={styles.classGrid}>
        {CRUSADE_CLASSES.map((cls) => {
          const hovered = hoverClass === cls.id;
          return (
            <button
              key={cls.id}
              onClick={() => selectClass(cls.id, raceId)}
              onMouseEnter={() => setHoverClass(cls.id)}
              onMouseLeave={() => setHoverClass(null)}
              style={{
                ...styles.classCard,
                borderColor: hovered ? cls.color : "rgba(255,255,255,0.08)",
                boxShadow: hovered
                  ? `0 0 0 1px ${cls.color}, 0 16px 44px ${hexA(cls.color, 0.35)}`
                  : "0 8px 22px rgba(0,0,0,0.4)",
                transform: hovered ? "translateY(-4px)" : "translateY(0)",
              }}
            >
              <div style={{ ...styles.classAccent, background: cls.color }} />
              <div style={styles.classHead}>
                <div
                  style={{
                    ...styles.classIcon,
                    background: `radial-gradient(circle at 35% 30%, ${cls.color}, ${hexA(cls.color, 0.25)})`,
                    boxShadow: `0 0 18px ${hexA(cls.color, 0.6)}`,
                  }}
                />
                <div>
                  <div style={styles.className}>{cls.name}</div>
                  <div style={styles.classTitle}>{cls.title}</div>
                </div>
              </div>
              <div style={styles.classBio}>{cls.bio}</div>
              <div style={styles.statRow}>
                <span style={styles.statChip}>{cls.weaponLabel}</span>
                <span style={styles.statChip}>{Math.round(cls.maxHp)} HP</span>
                <span style={styles.statChip}>{cls.resourceLabel}</span>
              </div>
              <div style={styles.abilityList}>
                {cls.abilities.map((a) => (
                  <div key={a.id} style={styles.abilityRow}>
                    <span style={{ ...styles.abilityKey, color: a.color, borderColor: hexA(a.color, 0.5) }}>
                      {a.key}
                    </span>
                    <span style={styles.abilityName}>{a.name}</span>
                  </div>
                ))}
              </div>
              <div style={{ ...styles.playCta, color: cls.color, opacity: hovered ? 1 : 0.5 }}>
                ENTER THE ARENA →
              </div>
            </button>
          );
        })}
      </div>

      {/* Faction footer */}
      <div style={styles.factionFooter}>
        {FACTIONS.map((f) => (
          <div key={f.id} style={styles.factionItem}>
            <img src={f.emblem} alt={f.name} style={styles.factionEmblem} />
            <div style={styles.factionName}>{f.name}</div>
            <div style={styles.factionRole}>
              {f.id === factionId ? "Your banner" : "Rival power"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const keyframes = `
@keyframes floatGlow { 0%,100% { opacity: 0.5; } 50% { opacity: 0.85; } }
`;

const styles: Record<string, React.CSSProperties> = {
  page: {
    position: "relative",
    minHeight: "100vh",
    width: "100%",
    background:
      "radial-gradient(1200px 600px at 50% -10%, #1a2540 0%, #0a0d16 55%, #06070c 100%)",
    color: "#eef1f7",
    fontFamily: "system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "44px 20px 64px",
    overflowX: "hidden",
  },
  glow: {
    position: "absolute",
    top: -180,
    width: 700,
    height: 400,
    background: "radial-gradient(circle, rgba(90,140,255,0.18), transparent 70%)",
    filter: "blur(20px)",
    animation: "floatGlow 6s ease-in-out infinite",
    pointerEvents: "none",
  },
  header: { display: "flex", alignItems: "center", gap: 18, zIndex: 1 },
  crest: { width: 82, height: 82, objectFit: "contain", filter: "drop-shadow(0 4px 14px rgba(80,130,255,0.5))" },
  title: { fontSize: 40, fontWeight: 900, letterSpacing: 3, margin: 0, lineHeight: 1 },
  kicker: { fontSize: 12, letterSpacing: 4, opacity: 0.6, marginTop: 6, fontWeight: 700 },
  subtitle: { opacity: 0.72, margin: "14px 0 8px", fontSize: 14.5, textAlign: "center", maxWidth: 560, zIndex: 1 },

  sectionLabel: {
    alignSelf: "center",
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: 800,
    textTransform: "uppercase",
    opacity: 0.85,
    margin: "30px 0 16px",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  sectionNum: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    borderRadius: 999,
    border: "1px solid rgba(127,178,255,0.5)",
    color: "#7fb2ff",
    fontSize: 12,
  },
  raceHint: { opacity: 0.5, fontWeight: 600, letterSpacing: 1 },

  factionRow: { display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center", zIndex: 1 },
  factionCard: {
    position: "relative",
    width: 240,
    background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
    border: "2px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: "18px 16px",
    cursor: "pointer",
    color: "#fff",
    textAlign: "center",
    transition: "transform 0.18s, box-shadow 0.18s, border-color 0.18s",
  },
  factionCardEmblem: {
    width: 72,
    height: 72,
    objectFit: "contain",
    margin: "0 auto 10px",
    display: "block",
    filter: "drop-shadow(0 3px 12px rgba(0,0,0,0.6))",
  },
  factionCardName: { fontSize: 18, fontWeight: 800, letterSpacing: 0.5 },
  factionCardTagline: { fontSize: 12, opacity: 0.66, lineHeight: 1.5, marginTop: 6 },

  raceRow: { display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center", zIndex: 1 },
  raceCard: {
    position: "relative",
    width: 230,
    background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
    border: "2px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 16,
    cursor: "pointer",
    color: "#fff",
    textAlign: "center",
    transition: "transform 0.18s, box-shadow 0.18s, border-color 0.18s",
  },
  portraitWrap: { position: "relative", width: 150, height: 150, margin: "0 auto 12px" },
  portrait: { width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 },
  portraitRing: {
    position: "absolute",
    inset: -4,
    borderRadius: 14,
    border: "2px solid #7fb2ff",
    boxShadow: "0 0 20px rgba(127,178,255,0.6)",
    pointerEvents: "none",
  },
  raceName: { fontSize: 18, fontWeight: 800, letterSpacing: 0.5 },
  raceBlurb: { fontSize: 12, opacity: 0.66, lineHeight: 1.5, marginTop: 6 },
  selectedTag: {
    marginTop: 10,
    fontSize: 10.5,
    letterSpacing: 2,
    fontWeight: 800,
    color: "#7fb2ff",
  },

  classGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 18,
    maxWidth: 1060,
    width: "100%",
    zIndex: 1,
  },
  classCard: {
    position: "relative",
    overflow: "hidden",
    textAlign: "left",
    background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
    border: "2px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
    cursor: "pointer",
    color: "#fff",
    transition: "transform 0.18s, box-shadow 0.18s, border-color 0.18s",
  },
  classAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 3, opacity: 0.9 },
  classHead: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  classIcon: { width: 46, height: 46, borderRadius: 12, flexShrink: 0 },
  className: { fontSize: 20, fontWeight: 800, lineHeight: 1.1 },
  classTitle: { fontSize: 12, opacity: 0.62, marginTop: 2 },
  classBio: { fontSize: 12.5, opacity: 0.8, lineHeight: 1.55, marginBottom: 12, minHeight: 56 },
  statRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  statChip: {
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: 0.3,
    padding: "4px 8px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.07)",
    opacity: 0.85,
  },
  abilityList: { display: "flex", flexDirection: "column", gap: 6 },
  abilityRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 12 },
  abilityKey: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 20,
    height: 20,
    borderRadius: 5,
    border: "1px solid",
    fontSize: 10.5,
    fontWeight: 800,
  },
  abilityName: { opacity: 0.85 },
  playCta: { marginTop: 14, fontSize: 12, fontWeight: 800, letterSpacing: 1.5, transition: "opacity 0.18s" },

  enemyBand: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    marginTop: 44,
    padding: "16px 26px",
    borderRadius: 16,
    background: "linear-gradient(90deg, rgba(120,20,20,0.22), rgba(30,10,10,0.10))",
    border: "1px solid rgba(220,60,60,0.25)",
    zIndex: 1,
  },
  enemyEmblem: { width: 66, height: 66, objectFit: "contain", filter: "drop-shadow(0 3px 10px rgba(220,40,40,0.5))" },
  enemyTitle: { fontSize: 12, letterSpacing: 2.5, fontWeight: 800, color: "#ff9a9a", marginBottom: 10 },
  enemyRow: { display: "flex", gap: 22 },
  enemyUnit: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, opacity: 0.9 },
  enemyFace: { width: 40, height: 40, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(220,80,80,0.4)" },

  factionFooter: { display: "flex", gap: 40, marginTop: 40, flexWrap: "wrap", justifyContent: "center", zIndex: 1 },
  factionItem: { display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.85 },
  factionEmblem: { width: 52, height: 52, objectFit: "contain" },
  factionName: { fontSize: 12.5, fontWeight: 800, marginTop: 6, letterSpacing: 0.5 },
  factionRole: { fontSize: 10.5, opacity: 0.55, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 },
};
