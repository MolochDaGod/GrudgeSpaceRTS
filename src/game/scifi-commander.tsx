/**
 * ── Sci-Fi Commander & Skill Tree Panels ──────────────────────────────
 *   CommanderCharacterPanel — Commander stats + hex equipment slots
 *   UnifiedSkillTreePanel  — Multi-tab skill tree with research nodes
 */

import React, { useState, useMemo } from 'react';
import type { SpaceGameState, Commander, TeamTechState, SpaceFaction, SparkShipNode, FactionShipTree } from './space-types';
import { CHARACTER, CHARACTER_LAYOUT, SKILLTREES, SKILLTREE_NODES, SKILLTREE_TABS } from './scifi-gui-assets';
import { ALL_TECH_TREES, type TechNode } from './space-techtree';
import { FACTION_DATA } from './space-types';
import { FACTION_SHIP_TREES, getEffectiveSparkCost, FACTION_DATA as FACTION_CFG } from './space-config';
import { getShipDef } from './space-types';

// ═══════════════════════════════════════════════════════════════════════
// COMMANDER CHARACTER PANEL
// ═══════════════════════════════════════════════════════════════════════
interface CommanderCharacterPanelProps {
  state: SpaceGameState;
  commander: Commander | null;
  onClose: () => void;
}

const STAT_LABELS = ['Attack', 'Defense', 'Speed', 'Special'] as const;

export function CommanderCharacterPanel({ state, commander, onClose }: CommanderCharacterPanelProps) {
  const CL = CHARACTER_LAYOUT;
  // Use green for player, could be faction-colored
  const faction = state.sparkState.get(1)?.faction ?? 'legion';
  const colorVariant = faction === 'void' ? 'purple' : faction === 'construct' || faction === 'legion' ? 'gold' : 'green';

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 'min(90vw, 620px)',
        aspectRatio: '805/700',
        zIndex: 180,
        pointerEvents: 'auto',
      }}
    >
      {/* Character frame background */}
      <img
        src={CHARACTER[colorVariant]}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          pointerEvents: 'none',
        }}
      />

      {/* Close button */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '2%',
          right: '2%',
          cursor: 'pointer',
          fontSize: 18,
          color: '#44ffaa',
          fontWeight: 800,
          zIndex: 2,
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ✕
      </div>

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: '2%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 14,
          fontWeight: 800,
          color: '#fff',
          letterSpacing: 2,
        }}
      >
        COMMANDER
      </div>

      {/* Commander portrait in wireframe center area */}
      {commander && (
        <div
          style={{
            position: 'absolute',
            left: '18%',
            top: '25%',
            width: '20%',
            height: '35%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={commander.portrait}
            alt={commander.name}
            style={{
              width: '80%',
              height: '80%',
              objectFit: 'cover',
              borderRadius: 8,
              border: '2px solid rgba(68,255,170,0.4)',
              boxShadow: '0 0 20px rgba(68,255,170,0.2)',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Hex equipment slots */}
      {CL.hexSlots.map((slot) => (
        <div
          key={slot.id}
          style={{
            position: 'absolute',
            left: `${slot.x}%`,
            top: `${slot.y}%`,
            width: `${slot.w}%`,
            height: `${slot.h}%`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title={slot.id.replace('_', ' ')}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'brightness(1.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'brightness(1)';
          }}
        >
          <div
            style={{
              fontSize: 7,
              color: '#446',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            {slot.id.replace('_', ' ')}
          </div>
        </div>
      ))}

      {/* Right stats panel */}
      {commander && (
        <div
          style={{
            position: 'absolute',
            left: `${CL.statsPanel.x}%`,
            top: `${CL.statsPanel.y}%`,
            width: `${CL.statsPanel.w}%`,
            height: `${CL.statsPanel.h}%`,
          }}
        >
          {/* Name bars */}
          <div
            style={{
              position: 'absolute',
              left: `${((CL.nameBars.x - CL.statsPanel.x) / CL.statsPanel.w) * 100}%`,
              top: `${((CL.nameBars.y - CL.statsPanel.y) / CL.statsPanel.h) * 100}%`,
              width: `${(CL.nameBars.w / CL.statsPanel.w) * 100}%`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{commander.name}</div>
            <div style={{ fontSize: 9, color: '#8ac', marginBottom: 2 }}>
              Spec: {commander.spec.toUpperCase()} · Level {commander.level}
            </div>
            <div style={{ fontSize: 9, color: '#8ac' }}>Faction: {FACTION_DATA[state.sparkState.get(1)?.faction ?? 'legion'].label}</div>
          </div>

          {/* Stat bars */}
          {STAT_LABELS.map((label, i) => {
            const vals = [commander.attackBonus, commander.defenseBonus, commander.speedBonus, commander.specialBonus];
            const val = vals[i] ?? 0;
            const pct = Math.min(1, val / 0.3) * 100; // 30% max scale
            return (
              <div
                key={label}
                style={{
                  position: 'absolute',
                  left: '5%',
                  top: `${40 + i * 14}%`,
                  width: '90%',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#8ac', marginBottom: 2 }}>
                  <span>{label}</span>
                  <span>+{(val * 100).toFixed(0)}%</span>
                </div>
                <div style={{ height: 8, background: 'rgba(0,0,0,0.4)', borderRadius: 2 }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      borderRadius: 2,
                      background: i === 0 ? '#ff4444' : i === 1 ? '#44aaff' : i === 2 ? '#44ff88' : '#ffaa22',
                    }}
                  />
                </div>
              </div>
            );
          })}

          {/* XP bar */}
          <div style={{ position: 'absolute', bottom: '5%', left: '5%', width: '90%' }}>
            <div style={{ fontSize: 8, color: '#fc4', marginBottom: 2 }}>
              XP: {commander.xp} / {commander.xpToNextLevel}
            </div>
            <div style={{ height: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 2 }}>
              <div
                style={{
                  width: `${(commander.xp / commander.xpToNextLevel) * 100}%`,
                  height: '100%',
                  borderRadius: 2,
                  background: '#fc4',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {!commander && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            fontSize: 12,
            color: '#446',
            textAlign: 'center',
          }}
        >
          No Commander assigned
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// UNIFIED SKILL TREE PANEL — Multi-tab with tech nodes in slots
// ═══════════════════════════════════════════════════════════════════════
interface UnifiedSkillTreePanelProps {
  state: SpaceGameState;
  onResearch: (nodeId: string) => void;
  onUnlockShip?: (nodeId: string) => void;
  onClose: () => void;
}

const FACTION_KEYS: SpaceFaction[] = ['wisdom', 'construct', 'void', 'legion'];
const FACTION_COLORS: Record<SpaceFaction, string> = { wisdom: '#44ccff', construct: '#ffaa22', void: '#aa44ff', legion: '#ff4444' };

export function UnifiedSkillTreePanel({ state, onResearch, onUnlockShip, onClose }: UnifiedSkillTreePanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [fleetFaction, setFleetFaction] = useState<SpaceFaction>(state.sparkState.get(1)?.faction ?? 'legion');
  const techSt = state.techState.get(1);
  const tab = SKILLTREE_TABS[activeTab];
  const faction = state.sparkState.get(1)?.faction ?? 'legion';
  const colorVariant = faction === 'void' ? 'purple' : faction === 'construct' || faction === 'legion' ? 'gold' : 'green';
  const isFleetTab = tab.id === 'fleet';

  // Gather all nodes from trees in the active tab
  const tabNodes = useMemo(() => {
    const nodes: (TechNode & { treeId: string })[] = [];
    for (const treeId of tab.trees) {
      const tree = ALL_TECH_TREES[treeId];
      if (tree) {
        for (const n of tree.nodes) {
          nodes.push({ ...n, treeId });
        }
      }
    }
    return nodes;
  }, [tab]);

  // Active/Passive split: T1-T2 = active, T3 = passive (capstone)
  const [viewMode, setViewMode] = useState<'active' | 'passive'>('active');
  const filteredNodes = viewMode === 'active' ? tabNodes.filter((n) => n.tier <= 2) : tabNodes.filter((n) => n.tier === 3);

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 'min(85vw, 520px)',
        aspectRatio: '742/793',
        zIndex: 185,
        pointerEvents: 'auto',
      }}
    >
      {/* Skilltree frame background */}
      <img
        src={SKILLTREES[colorVariant]}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          pointerEvents: 'none',
        }}
      />

      {/* Close button */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '2%',
          right: '4%',
          cursor: 'pointer',
          fontSize: 18,
          color: '#44ffaa',
          fontWeight: 800,
          zIndex: 2,
        }}
      >
        ✕
      </div>

      {/* Title bar */}
      <div
        style={{
          position: 'absolute',
          top: '1.5%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 16,
          fontWeight: 800,
          color: '#fff',
          letterSpacing: 3,
        }}
      >
        SKILLS
      </div>

      {/* Subtitle — tree name + spark balance for fleet tab */}
      <div
        style={{
          position: 'absolute',
          top: '6.5%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 10,
          color: '#fc4',
          letterSpacing: 1,
          fontStyle: 'italic',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <span>{isFleetTab ? `${FACTION_CFG[fleetFaction]?.label ?? fleetFaction} Fleet` : `${tab.label} — ${tabNodes.length} Nodes`}</span>
        {isFleetTab && <span style={{ color: '#ffcc22', fontWeight: 700 }}>⚡ {state.resources[1]?.spark ?? 0} Spark</span>}
      </div>

      {/* Tab buttons (ATTACK / DEFENCE / CYBER / SUPPORT) */}
      <div
        style={{
          position: 'absolute',
          top: '9.5%',
          left: '10%',
          right: '18%',
          display: 'flex',
          gap: 4,
        }}
      >
        {SKILLTREE_TABS.map((t, i) => (
          <div
            key={t.id}
            onClick={() => setActiveTab(i)}
            style={{
              flex: 1,
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1,
              padding: '3px 0',
              color: i === activeTab ? '#fff' : '#666',
              borderBottom: i === activeTab ? '2px solid #44ffaa' : '2px solid transparent',
              transition: 'color 0.15s',
            }}
          >
            {t.label}
          </div>
        ))}
      </div>

      {/* ═══ FLEET TAB: Faction Ship Tree Graph ═══ */}
      {isFleetTab ? (
        <>
          {/* Faction sub-tabs */}
          <div
            style={{
              position: 'absolute',
              top: '13%',
              left: '8%',
              right: '8%',
              display: 'flex',
              gap: 4,
            }}
          >
            {FACTION_KEYS.map((fk) => {
              const isMine = fk === faction;
              const isActive = fk === fleetFaction;
              return (
                <div
                  key={fk}
                  onClick={() => setFleetFaction(fk)}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: 1,
                    padding: '3px 0',
                    color: isActive ? '#fff' : '#555',
                    borderBottom: isActive ? `2px solid ${FACTION_COLORS[fk]}` : '2px solid transparent',
                  }}
                >
                  {fk.toUpperCase()}
                  {isMine ? ' ★' : ''}
                </div>
              );
            })}
          </div>

          {/* Node graph area */}
          {(() => {
            const tree = FACTION_SHIP_TREES[fleetFaction];
            if (!tree) return null;
            const ss = state.sparkState.get(1);
            const unlockedNodes = ss?.unlockedNodes ?? new Set<string>();
            const playerFaction = ss?.faction ?? 'legion';
            const spark = state.resources[1]?.spark ?? 0;
            const isCross = fleetFaction !== playerFaction;
            const nodeW = 10; // % width
            const nodeH = 7; // % height
            // Map node id → {x,y} for SVG lines
            const posMap = new Map<string, { cx: number; cy: number }>();
            for (const n of tree.nodes) {
              posMap.set(n.id, { cx: n.x + nodeW / 2, cy: n.y + nodeH / 2 });
            }

            return (
              <div
                style={{
                  position: 'absolute',
                  top: '18%',
                  left: '6%',
                  right: '6%',
                  bottom: '6%',
                }}
              >
                {/* SVG prerequisite lines */}
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                >
                  {tree.nodes.map((n) =>
                    n.requires.map((reqId) => {
                      const from = posMap.get(reqId);
                      const to = posMap.get(n.id);
                      if (!from || !to) return null;
                      const bothUnlocked = unlockedNodes.has(reqId) && unlockedNodes.has(n.id);
                      const available = unlockedNodes.has(reqId) && !unlockedNodes.has(n.id);
                      return (
                        <line
                          key={`${reqId}-${n.id}`}
                          x1={from.cx}
                          y1={from.cy}
                          x2={to.cx}
                          y2={to.cy}
                          stroke={bothUnlocked ? FACTION_COLORS[fleetFaction] : available ? '#555' : '#222'}
                          strokeWidth={bothUnlocked ? 0.6 : 0.3}
                          strokeDasharray={available ? '1.5 1' : 'none'}
                        />
                      );
                    }),
                  )}
                </svg>

                {/* Ship nodes */}
                {tree.nodes.map((n) => {
                  const isUnlocked = unlockedNodes.has(n.id);
                  const prereqsMet = n.requires.every((r) => unlockedNodes.has(r));
                  const cost = getEffectiveSparkCost(n, fleetFaction, playerFaction);
                  const canAfford = spark >= cost;
                  const canUnlock = !isUnlocked && prereqsMet && canAfford;
                  const isCapstone = n.id === tree.capstoneNodeId;
                  const def = getShipDef(n.shipType);
                  const displayName = def?.displayName ?? n.shipType;
                  const tier = def?.stats.tier ?? 1;

                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (canUnlock && onUnlockShip) onUnlockShip(n.id);
                      }}
                      title={`${displayName}\nT${tier} ${def?.class ?? ''}\nSpark: ${cost}${isCross ? ' (cross-faction)' : ''}${n.factionResourceCost ? `\nFaction Resource: ${n.factionResourceCost}` : ''}`}
                      style={{
                        position: 'absolute',
                        left: `${n.x}%`,
                        top: `${n.y}%`,
                        width: `${nodeW}%`,
                        height: `${nodeH}%`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: canUnlock ? 'pointer' : 'default',
                        borderRadius: isCapstone ? 8 : 4,
                        border: isUnlocked
                          ? `2px solid ${FACTION_COLORS[fleetFaction]}`
                          : canUnlock
                            ? '2px solid rgba(255,255,255,0.4)'
                            : '1px solid rgba(255,255,255,0.08)',
                        background: isUnlocked ? 'rgba(68,255,170,0.12)' : canUnlock ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.3)',
                        transition: 'border-color 0.15s, background 0.15s',
                        boxShadow: isCapstone && isUnlocked ? `0 0 12px ${FACTION_COLORS[fleetFaction]}44` : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (canUnlock) e.currentTarget.style.borderColor = FACTION_COLORS[fleetFaction];
                      }}
                      onMouseLeave={(e) => {
                        if (canUnlock) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                      }}
                    >
                      {/* Tier badge */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 1,
                          left: 2,
                          fontSize: 6,
                          fontWeight: 800,
                          color: isUnlocked ? FACTION_COLORS[fleetFaction] : '#444',
                        }}
                      >
                        T{tier}
                      </div>

                      {/* Ship name */}
                      <div
                        style={{
                          fontSize: isCapstone ? 7 : 6,
                          fontWeight: 700,
                          color: isUnlocked ? '#fff' : canUnlock ? '#aab' : '#444',
                          textAlign: 'center',
                          maxWidth: '95%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isCapstone ? `★ ${displayName}` : displayName}
                      </div>

                      {/* Spark cost */}
                      {!isUnlocked && (
                        <div
                          style={{
                            fontSize: 6,
                            color: canAfford ? '#ffcc22' : '#663300',
                            fontWeight: 600,
                          }}
                        >
                          ⚡{cost}
                          {isCross ? '*' : ''}
                        </div>
                      )}

                      {/* Unlocked checkmark */}
                      {isUnlocked && <div style={{ position: 'absolute', top: 0, right: 2, fontSize: 9, color: '#44ff88' }}>✓</div>}
                    </div>
                  );
                })}

                {/* Cross-faction note */}
                {isCross && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      fontSize: 7,
                      color: '#886',
                      fontStyle: 'italic',
                    }}
                  >
                    * Cross-faction: 1.5× Spark cost
                  </div>
                )}
              </div>
            );
          })()}
        </>
      ) : (
        <>
          {/* ═══ TECH TABS: Octagonal slot nodes (original) ═══ */}
          {SKILLTREE_NODES.map((slot, si) => {
            const node = filteredNodes[si] ?? null;
            const isResearched = node && techSt?.researchedNodes.has(node.id);
            const isInProgress = node && techSt?.inResearch === node.id;
            const canResearch =
              node &&
              !isResearched &&
              !isInProgress &&
              techSt &&
              node.requires.every((r) => techSt.researchedNodes.has(r)) &&
              !techSt.inResearch;

            return (
              <div
                key={si}
                onClick={() => {
                  if (canResearch && node) onResearch(node.id);
                }}
                title={node ? `${node.name}\n${node.description}\nTier ${node.tier} · ${node.researchTime}s` : ''}
                style={{
                  position: 'absolute',
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  width: `${slot.w}%`,
                  height: `${slot.h}%`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: canResearch ? 'pointer' : 'default',
                  borderRadius: slot.size === 'large' ? 6 : 4,
                  transition: 'filter 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (canResearch) e.currentTarget.style.filter = 'brightness(1.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'brightness(1)';
                }}
              >
                {node ? (
                  <>
                    <img
                      src={node.icon}
                      alt=""
                      style={{
                        width: slot.size === 'large' ? '55%' : '50%',
                        height: slot.size === 'large' ? '55%' : '50%',
                        objectFit: 'contain',
                        filter: isResearched
                          ? 'brightness(1.2) saturate(1.5)'
                          : canResearch
                            ? 'brightness(0.8)'
                            : 'brightness(0.3) grayscale(0.8)',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div
                      style={{
                        fontSize: 6,
                        fontWeight: 700,
                        textAlign: 'center',
                        marginTop: 1,
                        color: isResearched ? '#44ffaa' : canResearch ? '#cde' : '#444',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {node.name}
                    </div>
                    {isInProgress && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 6,
                          border: '2px solid #fc4',
                          animation: 'pulse 1s infinite',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div style={{ fontSize: 7, color: '#fc4', fontWeight: 700 }}>{Math.ceil(techSt!.researchTimeRemaining)}s</div>
                      </div>
                    )}
                    {isResearched && <div style={{ position: 'absolute', top: 1, right: 2, fontSize: 10, color: '#44ff88' }}>✓</div>}
                  </>
                ) : (
                  <div style={{ fontSize: 10, color: '#222' }}>—</div>
                )}
              </div>
            );
          })}

          {/* ACTIVE / PASSIVE toggle at bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: '2%',
              left: '10%',
              right: '10%',
              display: 'flex',
              gap: 8,
            }}
          >
            <div
              onClick={() => setViewMode('active')}
              style={{
                flex: 1,
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 800,
                padding: '4px 0',
                color: viewMode === 'active' ? '#fff' : '#446',
                borderBottom: viewMode === 'active' ? '2px solid #44ffaa' : '2px solid transparent',
              }}
            >
              ACTIVE
            </div>
            <div
              onClick={() => setViewMode('passive')}
              style={{
                flex: 1,
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 800,
                padding: '4px 0',
                color: viewMode === 'passive' ? '#fff' : '#446',
                borderBottom: viewMode === 'passive' ? '2px solid #44ffaa' : '2px solid transparent',
              }}
            >
              PASSIVE
            </div>
          </div>
        </>
      )}
    </div>
  );
}
