// space-panels.tsx — Floating draggable panels (tech tree, commanders, void powers)
import React, { useState, useRef, useEffect } from 'react';
import {
  TEAM_COLORS,
  PLANET_TYPE_DATA,
  COMMANDER_SPEC_LABEL,
  COMMANDER_TRAIN_COST,
  COMMANDER_TRAIN_TIME,
  ALL_TECH_TREES,
  VOID_POWERS,
  PLANET_TYPE_TO_TECH,
  type SpaceRenderer,
  type SpaceGameState,
  type PlayerResources,
  type Planet,
  type CommanderSpec,
  Panel,
  Btn,
  Bar,
} from './space-ui-shared';
import type { Commander } from './space-types';

function VoidPowerBar({
  state,
  techSt,
  onCast,
}: {
  state: SpaceGameState;
  techSt: { researchedNodes: Set<string>; [k: string]: any };
  onCast: (id: string, x: number, y: number) => void;
}) {
  const unlocked = Object.values(VOID_POWERS).filter((p) => techSt.researchedNodes.has(p.techNodeId));
  if (!unlocked.length) return null;
  const cds = state.voidCooldowns?.get(1) ?? new Map<string, number>();
  return (
    <div
      style={{
        position: 'absolute',
        top: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 6,
        zIndex: 20,
        pointerEvents: 'auto',
        background: 'rgba(4,10,22,0.85)',
        border: '1px solid #1a3050',
        borderRadius: 8,
        padding: '4px 8px',
      }}
    >
      <span style={{ fontSize: 9, color: '#8ac', alignSelf: 'center', marginRight: 4, letterSpacing: 1 }}>VOID</span>
      {unlocked.map((pwr) => {
        const cd = cds.get(pwr.id) ?? 0;
        const cdPct = cd > 0 ? cd / pwr.cooldown : 0;
        const res = state.resources[1];
        const canCast = !cd && res && res.credits >= pwr.cost.credits && res.energy >= pwr.cost.energy && res.minerals >= pwr.cost.minerals;
        return (
          <div
            key={pwr.id}
            title={`${pwr.name}\n${pwr.description}\nCost: ${pwr.cost.credits}c ${pwr.cost.energy}e ${pwr.cost.minerals}m\nCD: ${pwr.cooldown}s`}
            onClick={() => canCast && onCast(pwr.id, 0, 0)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 6,
              cursor: canCast ? 'pointer' : 'default',
              border: `1px solid ${canCast ? '#4488ff' : '#1a3050'}`,
              background: 'rgba(6,14,32,0.9)',
              position: 'relative',
              overflow: 'hidden',
              opacity: canCast ? 1 : 0.5,
            }}
          >
            <img
              src={pwr.icon}
              alt={pwr.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                imageRendering: 'pixelated',
                filter: canCast ? 'none' : 'grayscale(0.8)',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {cdPct > 0 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 6,
                  background: `conic-gradient(rgba(0,0,0,0.75) ${cdPct * 360}deg, transparent ${cdPct * 360}deg)`,
                }}
              />
            )}
            {cd > 0 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#f88',
                }}
              >
                {Math.ceil(cd)}
              </div>
            )}
            <div
              style={{ position: 'absolute', bottom: 1, left: 0, right: 0, textAlign: 'center', fontSize: 7, color: '#8ac', lineHeight: 1 }}
            >
              {pwr.name.split(' ')[0]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Draggable floating panel helper ─────────────────────────────

function useDraggablePanel(initialX: number, initialY: number) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const dragState = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragState.current;
      if (!d) return;
      const nx = d.ox + (e.clientX - d.sx);
      const ny = d.oy + (e.clientY - d.sy);
      setPos({ x: Math.max(0, nx), y: Math.max(0, ny) });
    };
    const onUp = () => {
      dragState.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const onDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragState.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
  };

  return { pos, onDragStart };
}

// ── Tech Tree Panel ─────────────────────────────────────────────
function TechTreePanel({
  state,
  myPlanets,
  onResearch,
  onClose,
}: {
  state: SpaceGameState;
  myPlanets: import('./space-types').Planet[];
  onResearch: (nodeId: string) => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (myPlanets.length === 0) return 'forge';
    return PLANET_TYPE_TO_TECH[myPlanets[0].planetType] ?? 'forge';
  });
  const techSt = state.techState?.get(1);
  const res = state.resources[1];
  const tree = ALL_TECH_TREES[activeTab];
  const C = { bg: 'rgba(4,10,22,0.97)', border: '#1a3050', accent: '#4488ff', text: '#cde', muted: 'rgba(160,200,255,0.4)' };
  const drag = useDraggablePanel(210, 45);

  // Available planet tech trees (only show trees for owned planets)
  const availTrees = Object.values(ALL_TECH_TREES).filter(
    (t) => t.id === 'command' || myPlanets.some((p) => PLANET_TYPE_TO_TECH[p.planetType] === t.id),
  );

  return (
    <div style={{ position: 'absolute', left: drag.pos.x, top: drag.pos.y, zIndex: 50, pointerEvents: 'auto' }}>
      <Panel
        title="TECH TREES"
        onClose={onClose}
        width={500}
        style={{ maxHeight: '80vh', overflow: 'auto', background: 'rgba(4,10,22,0.97)', border: '1px solid #1a3050', borderRadius: 10 }}
      >
        <div
          onMouseDown={drag.onDragStart}
          style={{
            marginBottom: 8,
            padding: '4px 8px',
            borderRadius: 4,
            cursor: 'move',
            fontSize: 9,
            color: '#8ac',
            letterSpacing: 1,
            textAlign: 'center',
            background: 'rgba(10,20,40,0.65)',
            border: '1px dashed #2a4a70',
            userSelect: 'none',
          }}
        >
          DRAG PANEL
        </div>
        {techSt?.inResearch && (
          <div style={{ fontSize: 10, color: '#fc4', textAlign: 'center', marginBottom: 8 }}>
            Researching… {Math.ceil(techSt.researchTimeRemaining ?? 0)}s
          </div>
        )}
        {/* Tree tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '6px 10px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
          {availTrees.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '4px 10px',
                border: `1px solid ${activeTab === t.id ? t.color.toString(16).padStart(6, '0') : '#1a3050'}`,
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: 700,
                background: activeTab === t.id ? 'rgba(68,136,255,0.12)' : 'transparent',
                color: activeTab === t.id ? `#${t.color.toString(16).padStart(6, '0')}` : C.muted,
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
        {/* Nodes */}
        {tree && (
          <div style={{ padding: '10px 14px' }}>
            {[1, 2, 3].map((tier) => {
              const nodes = tree.nodes.filter((n) => n.tier === tier);
              return (
                <div key={tier} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: `#${tree.color.toString(16).padStart(6, '0')}`,
                      fontWeight: 700,
                      marginBottom: 6,
                      borderBottom: `1px solid #1a3050`,
                      paddingBottom: 3,
                    }}
                  >
                    TIER {tier}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {nodes.map((node) => {
                      const done = techSt?.researchedNodes.has(node.id);
                      const inProg = techSt?.inResearch === node.id;
                      const prereqsMet = node.requires.every((r) => techSt?.researchedNodes.has(r));
                      const canAfford =
                        res && res.credits >= node.cost.credits && res.energy >= node.cost.energy && res.minerals >= node.cost.minerals;
                      const canStart = prereqsMet && !done && !inProg && !techSt?.inResearch && canAfford;
                      return (
                        <div
                          key={node.id}
                          style={{
                            width: 136,
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: `1px solid ${done ? '#2a5a2a' : inProg ? '#5a5a00' : prereqsMet ? '#1a3050' : '#0a1a20'}`,
                            background: done ? 'rgba(20,60,20,0.6)' : inProg ? 'rgba(40,40,10,0.7)' : 'rgba(6,14,28,0.8)',
                            opacity: prereqsMet ? 1 : 0.45,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <img
                              src={node.icon}
                              alt=""
                              style={{ width: 22, height: 22, imageRendering: 'pixelated' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <span style={{ fontSize: 11, fontWeight: 700, color: done ? '#4f4' : inProg ? '#fc4' : '#fff' }}>
                              {node.name}
                            </span>
                            {done && <span style={{ fontSize: 12, color: '#4f4' }}>✓</span>}
                          </div>
                          <div style={{ fontSize: 9, color: C.muted, marginBottom: 6, lineHeight: 1.4 }}>{node.description}</div>
                          <div style={{ fontSize: 8, color: '#88a', marginBottom: 4 }}>
                            {node.cost.credits}c / {node.cost.energy}e / {node.cost.minerals}m ·{' '}
                            {node.cost.credits > 0 ? `${node.researchTime}s` : ''}
                          </div>
                          {inProg && (
                            <div style={{ height: 4, background: '#1a2a10', borderRadius: 2 }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${(1 - (techSt?.researchTimeRemaining ?? 0) / (node.researchTime || 1)) * 100}%`,
                                  background: '#fc4',
                                  borderRadius: 2,
                                }}
                              />
                            </div>
                          )}
                          {canStart && (
                            <button
                              onClick={() => onResearch(node.id)}
                              style={{
                                width: '100%',
                                padding: '3px',
                                fontSize: 9,
                                fontWeight: 700,
                                background: C.accent,
                                border: 'none',
                                borderRadius: 3,
                                color: '#fff',
                                cursor: 'pointer',
                                marginTop: 4,
                              }}
                            >
                              RESEARCH
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

// ── Commander Panel (character-screen style matching image 2) ───────

function CommanderPanel({
  state,
  selectedCmdId,
  selectedPlanetId,
  onSelectCmd,
  onSelectPlanet,
  onTrain,
  onUpgrade,
  res,
  onClose,
}: {
  state: SpaceGameState;
  selectedCmdId: number | null;
  selectedPlanetId: number | null;
  onSelectCmd: (id: number | null) => void;
  onSelectPlanet: (id: number | null) => void;
  onTrain: (planetId: number) => void;
  onUpgrade: (cmdId: number) => void;
  res: import('./space-types').PlayerResources;
  onClose: () => void;
}) {
  const commanders = [...state.commanders.values()].filter((c) => c.team === 1);
  const selected = selectedCmdId != null ? state.commanders.get(selectedCmdId) : null;
  const myPlanets = state.planets.filter((p) => p.owner === 1);
  const C = { bg: 'rgba(4,12,8,0.97)', accent: '#00ee88', border: '#1a3a22', text: '#aae0b0', muted: 'rgba(100,200,120,0.4)' };
  const defaultX = typeof window !== 'undefined' ? Math.max(220, window.innerWidth - 470) : 980;
  const drag = useDraggablePanel(defaultX, 45);

  return (
    <div style={{ position: 'absolute', left: drag.pos.x, top: drag.pos.y, zIndex: 50, pointerEvents: 'auto' }}>
      <Panel
        title="COMMANDER CORPS"
        onClose={onClose}
        width={440}
        style={{ maxHeight: '85vh', overflow: 'auto', background: 'rgba(4,12,8,0.97)', border: '1px solid #1a3a22', borderRadius: 10 }}
      >
        <div
          onMouseDown={drag.onDragStart}
          style={{
            marginBottom: 8,
            padding: '4px 8px',
            borderRadius: 4,
            cursor: 'move',
            fontSize: 9,
            color: '#7fcf9f',
            letterSpacing: 1,
            textAlign: 'center',
            background: 'rgba(8,24,12,0.7)',
            border: '1px dashed #1f5f35',
            userSelect: 'none',
          }}
        >
          DRAG PANEL
        </div>

        <div style={{ display: 'flex', gap: 0 }}>
          {/* Left: commander list + planet train */}
          <div style={{ width: 184, borderRight: `1px solid ${C.border}`, padding: '8px' }}>
            <div style={{ fontSize: 9, color: C.muted, marginBottom: 6, letterSpacing: 1 }}>COMMANDERS ({commanders.length})</div>
            {commanders.map((cmd) => (
              <div
                key={cmd.id}
                onClick={() => onSelectCmd(cmd.id)}
                style={{
                  padding: '6px 8px',
                  marginBottom: 4,
                  borderRadius: 6,
                  cursor: 'pointer',
                  border: `1px solid ${selectedCmdId === cmd.id ? C.accent : C.border}`,
                  background: selectedCmdId === cmd.id ? 'rgba(0,238,136,0.08)' : 'rgba(4,16,8,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <img
                  src={cmd.portrait}
                  alt={cmd.name}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 6,
                    objectFit: 'contain',
                    background: 'rgba(6,18,10,0.8)',
                    border: `1px solid ${C.border}`,
                    padding: 2,
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{cmd.name}</div>
                  <div style={{ fontSize: 8, color: C.muted }}>
                    Lv{cmd.level} · {COMMANDER_SPEC_LABEL[cmd.spec]}
                  </div>
                  <div style={{ fontSize: 8, color: cmd.state === 'training' ? '#fc4' : cmd.state === 'onship' ? '#4df' : '#4f4' }}>
                    {cmd.state === 'training'
                      ? `Training (${Math.ceil(cmd.trainingTimeRemaining)}s)`
                      : cmd.state === 'onship'
                        ? 'On Ship'
                        : 'Idle'}
                  </div>
                </div>
              </div>
            ))}

            {/* Train from planet */}
            <div style={{ marginTop: 10, fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 4 }}>TRAIN FROM PLANET</div>
            {myPlanets.map((p) => {
              const alreadyTraining = commanders.some((c) => c.trainingPlanetId === p.id && c.state === 'training');
              const cost = COMMANDER_TRAIN_COST[1];
              const canAfford = res.credits >= cost.credits && res.energy >= cost.energy && res.minerals >= cost.minerals;
              const td = PLANET_TYPE_DATA[p.planetType];
              return (
                <div
                  key={p.id}
                  style={{
                    marginBottom: 4,
                    padding: '5px 6px',
                    borderRadius: 5,
                    border: `1px solid ${C.border}`,
                    background: 'rgba(4,16,8,0.6)',
                  }}
                >
                  <div style={{ fontSize: 9, fontWeight: 700, color: `#${td.baseColor.toString(16).padStart(6, '0')}`, marginBottom: 2 }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 8, color: C.muted, marginBottom: 3 }}>
                    {td.label} ·{' '}
                    {
                      COMMANDER_SPEC_LABEL[
                        (alreadyTraining ? 'forge' : Object.keys(COMMANDER_SPEC_LABEL)[0]) as import('./space-types').CommanderSpec
                      ]
                    }
                  </div>
                  {alreadyTraining ? (
                    <span style={{ fontSize: 8, color: '#fc4' }}>Training in progress…</span>
                  ) : (
                    <button
                      onClick={() => onTrain(p.id)}
                      disabled={!canAfford}
                      style={{
                        width: '100%',
                        padding: '2px',
                        fontSize: 8,
                        fontWeight: 700,
                        cursor: canAfford ? 'pointer' : 'default',
                        background: canAfford ? C.accent : '#1a2a1a',
                        border: 'none',
                        borderRadius: 3,
                        color: canAfford ? '#000' : '#3a5a3a',
                      }}
                    >
                      RECRUIT ({cost.credits}c/{cost.energy}e/{cost.minerals}m)
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: selected commander character screen */}
          {selected ? (
            <div style={{ flex: 1, padding: '12px' }}>
              {/* Portrait + name (image 2 style) */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={selected.portrait}
                    alt={selected.name}
                    style={{
                      width: 104,
                      height: 104,
                      objectFit: 'contain',
                      borderRadius: 10,
                      border: `2px solid ${C.accent}`,
                      background: 'rgba(6,18,10,0.8)',
                      padding: 4,
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                    }}
                  />
                  {/* Hexagonal overlay aesthetic */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 6,
                      background: 'linear-gradient(180deg,transparent 50%,rgba(0,238,136,0.15))',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{selected.name}</div>
                  <div style={{ fontSize: 10, color: C.accent }}>{COMMANDER_SPEC_LABEL[selected.spec]} Commander</div>
                  {/* Rank stars */}
                  <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 12,
                          color: i < selected.level ? '#ffcc00' : '#1a3a1a',
                          textShadow: i < selected.level ? '0 0 6px #ffcc00' : 'none',
                        }}
                      >
                        ★
                      </span>
                    ))}
                    <span style={{ fontSize: 9, color: C.muted, marginLeft: 4 }}>Lv {selected.level}/5</span>
                  </div>
                </div>
              </div>

              {/* XP bar */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.muted, marginBottom: 2 }}>
                  <span>XP</span>
                  <span>
                    {selected.xp}/{selected.xpToNextLevel}
                  </span>
                </div>
                <Bar value={selected.xp} max={selected.xpToNextLevel} color="#cc4400" height={8} />
              </div>

              {/* Stats grid matching image 2 style */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
                {(
                  [
                    { label: 'ATTACK', val: `+${Math.round(selected.attackBonus * 100)}%`, color: '#ee4444' },
                    { label: 'DEFENSE', val: `+${Math.round(selected.defenseBonus * 100)}%`, color: '#44ee88' },
                    { label: 'SPEED', val: `+${Math.round(selected.speedBonus * 100)}%`, color: '#44aaff' },
                    { label: 'SPECIAL', val: `+${Math.round(selected.specialBonus * 100)}%`, color: '#ffcc00' },
                  ] as const
                ).map((s) => (
                  <div
                    key={s.label}
                    style={{
                      padding: '5px 8px',
                      borderRadius: 5,
                      border: `1px solid ${s.color}44`,
                      background: `${s.color}11`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 9, color: C.muted, letterSpacing: 0.5 }}>{s.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{s.val}</span>
                  </div>
                ))}
              </div>

              {/* Upgrade button */}
              {selected.state === 'idle' &&
                selected.level < 5 &&
                (() => {
                  const cost = COMMANDER_TRAIN_COST[selected.level + 1];
                  const time = COMMANDER_TRAIN_TIME[selected.level + 1];
                  if (!cost) return null;
                  const canAfford = res.credits >= cost.credits && res.energy >= cost.energy && res.minerals >= cost.minerals;
                  return (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ fontSize: 8, color: C.muted, marginBottom: 3 }}>
                        Upgrade to Level {selected.level + 1} · {time}s training
                      </div>
                      <button
                        onClick={() => onUpgrade(selected.id)}
                        disabled={!canAfford}
                        style={{
                          width: '100%',
                          padding: '6px',
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 6,
                          cursor: canAfford ? 'pointer' : 'default',
                          background: canAfford ? C.accent : '#1a2a1a',
                          border: 'none',
                          color: canAfford ? '#000' : '#3a5a3a',
                          letterSpacing: 1,
                        }}
                      >
                        UPGRADE COMMANDER ({cost.credits}c/{cost.energy}e/{cost.minerals}m)
                      </button>
                    </div>
                  );
                })()}

              {/* Training progress */}
              {selected.state === 'training' && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 9, color: '#fc4', marginBottom: 3 }}>
                    Training… {Math.ceil(selected.trainingTimeRemaining)}s remaining
                  </div>
                  <Bar
                    value={selected.trainingTotalTime - selected.trainingTimeRemaining}
                    max={selected.trainingTotalTime}
                    color="#fc4"
                    height={6}
                  />
                </div>
              )}

              {/* On ship indicator */}
              {selected.state === 'onship' && selected.equippedShipId && (
                <div
                  style={{
                    marginTop: 6,
                    padding: '6px 10px',
                    background: 'rgba(68,136,255,0.1)',
                    border: '1px solid #2244aa',
                    borderRadius: 5,
                    fontSize: 9,
                    color: '#4df',
                  }}
                >
                  🔵 Commanding ship ID {selected.equippedShipId} — will be lost if ship is destroyed
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: C.muted }}>
              Select a commander to view details
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────

export { VoidPowerBar, useDraggablePanel, TechTreePanel, CommanderPanel };
