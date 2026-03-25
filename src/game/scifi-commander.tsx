/**
 * ── Sci-Fi Commander & Skill Tree Panels ──────────────────────────────
 *   CommanderCharacterPanel — Commander stats + hex equipment slots
 *   UnifiedSkillTreePanel  — Multi-tab skill tree with research nodes
 */

import React, { useState, useMemo } from 'react';
import type { SpaceGameState, Commander, TeamTechState } from './space-types';
import { CHARACTER, CHARACTER_LAYOUT, SKILLTREES, SKILLTREE_NODES, SKILLTREE_TABS } from './scifi-gui-assets';
import { ALL_TECH_TREES, type TechNode } from './space-techtree';
import { FACTION_DATA } from './space-types';

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
  onClose: () => void;
}

export function UnifiedSkillTreePanel({ state, onResearch, onClose }: UnifiedSkillTreePanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const techSt = state.techState.get(1);
  const tab = SKILLTREE_TABS[activeTab];
  const faction = state.sparkState.get(1)?.faction ?? 'legion';
  const colorVariant = faction === 'void' ? 'purple' : faction === 'construct' || faction === 'legion' ? 'gold' : 'green';

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

      {/* Subtitle — tree name */}
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
        }}
      >
        {tab.label} — {tabNodes.length} Nodes
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

      {/* Skill nodes placed on the octagonal slots */}
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
                {/* Node icon */}
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
                {/* Node name */}
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
                {/* Research in-progress indicator */}
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
                {/* Researched checkmark */}
                {isResearched && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 1,
                      right: 2,
                      fontSize: 10,
                      color: '#44ff88',
                    }}
                  >
                    ✓
                  </div>
                )}
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
    </div>
  );
}
