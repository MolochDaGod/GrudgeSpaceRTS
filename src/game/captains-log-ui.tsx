/**
 * captains-log-ui.tsx — Captain's Log overlay for Campaign mode.
 *
 * Uses the existing ui-lib Panel/Btn/Bar/Frame components (HUD PNG assets).
 * Press L or click the Log button to open.
 */

import { useState, useMemo } from 'react';
import type { SpaceRenderer } from './space-renderer';
import type { LogEntry, LogCategory } from './space-types';
import { Panel, Btn, Bar } from './ui-lib';
import { FACTION_DATA, FACTION_LEVEL_XP } from './space-types';

const CATEGORY_ICONS: Record<LogCategory, string> = {
  discovery: '🔭',
  battle: '⚔️',
  conquest: '🏴',
  diplomacy: '🤝',
  ai_event: '🤖',
  story_beat: '📖',
  commander: '👤',
};
const CATEGORY_COLORS: Record<LogCategory, string> = {
  discovery: '#44ffaa',
  battle: '#ff4444',
  conquest: '#ffcc00',
  diplomacy: '#44ddff',
  ai_event: '#aa44ff',
  story_beat: '#ff8822',
  commander: '#4488ff',
};
const CATEGORY_LABELS: Record<LogCategory, string> = {
  discovery: 'Discoveries',
  battle: 'Battles',
  conquest: 'Conquests',
  diplomacy: 'Diplomacy',
  ai_event: 'Events',
  story_beat: 'Story',
  commander: 'Commander',
};

type FilterTab = 'all' | LogCategory;

export function CaptainsLogOverlay({ renderer, onClose }: { renderer: SpaceRenderer; onClose: () => void }) {
  const state = renderer.engine.state;
  const progress = state.campaignProgress;
  const faction = progress?.factionProgress;
  const [filter, setFilter] = useState<FilterTab>('all');

  // Stabilise log reference so downstream useMemo doesn't re-run every frame
  const log = useMemo(() => state.captainsLog ?? [], [state.captainsLog]);
  const filtered = useMemo(() => {
    const entries = filter === 'all' ? log : log.filter((e) => e.category === filter);
    return [...entries].reverse();
  }, [log, filter]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const tabs: FilterTab[] = ['all', 'battle', 'conquest', 'discovery', 'ai_event', 'story_beat', 'commander', 'diplomacy'];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 180,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.88)',
        fontFamily: "'Segoe UI', monospace",
      }}
    >
      <Panel
        title="CAPTAIN'S LOG"
        onClose={onClose}
        width={820}
        style={{
          maxWidth: '94vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Faction + Progress header */}
        {faction && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 12,
              marginTop: 8,
              padding: '10px 14px',
              borderRadius: 8,
              background: `${FACTION_DATA[faction.faction]?.color ?? '#444'}12`,
              border: `1px solid ${FACTION_DATA[faction.faction]?.color ?? '#444'}44`,
            }}
          >
            <span style={{ fontSize: 28 }}>{FACTION_DATA[faction.faction]?.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: FACTION_DATA[faction.faction]?.color, letterSpacing: 2 }}>
                {FACTION_DATA[faction.faction]?.label.toUpperCase()} · LEVEL {faction.level}
              </div>
              <Bar
                value={faction.xp}
                max={FACTION_LEVEL_XP[faction.level] ?? 999}
                color={FACTION_DATA[faction.faction]?.color}
                height={8}
                label={`${faction.xp} / ${FACTION_LEVEL_XP[faction.level] ?? '?'} XP`}
              />
            </div>
            {progress && (
              <div style={{ textAlign: 'right', fontSize: 10, color: 'rgba(160,200,255,0.5)' }}>
                <div style={{ color: '#ffcc00', fontWeight: 700, fontSize: 12 }}>
                  {progress.conqueredPlanetIds.length} / {progress.totalPlanets} Planets
                </div>
                <div>Game Time: {formatTime(progress.elapsedGameTime)}</div>
                {progress.pvpUnlocked && <div style={{ color: '#44ff44' }}>★ PVP UNLOCKED</div>}
              </div>
            )}
          </div>
        )}

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
          {tabs.map((t) => {
            const active = filter === t;
            const label = t === 'all' ? `ALL (${log.length})` : `${CATEGORY_ICONS[t as LogCategory]} ${CATEGORY_LABELS[t as LogCategory]}`;
            return <Btn key={t} label={label} active={active} onClick={() => setFilter(t)} style={{ height: 28, fontSize: 9 }} />;
          })}
        </div>

        {/* Log entries */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: 'calc(90vh - 260px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'rgba(160,200,255,0.3)', fontSize: 13 }}>
              No log entries yet. Your story begins now.
            </div>
          )}
          {filtered.map((entry) => (
            <LogEntryCard key={entry.uuid} entry={entry} />
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 10,
            paddingTop: 8,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: 9,
            color: 'rgba(160,200,255,0.3)',
          }}
        >
          <span>{log.length} entries total</span>
          <span>Press L to close</span>
        </div>
      </Panel>
    </div>
  );
}

function LogEntryCard({ entry }: { entry: LogEntry }) {
  const color = CATEGORY_COLORS[entry.category] ?? '#888';
  const icon = CATEGORY_ICONS[entry.category] ?? '📝';
  const time = `${Math.floor(entry.timestamp / 60)}:${String(Math.floor(entry.timestamp % 60)).padStart(2, '0')}`;

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 6,
        background: 'rgba(6,14,30,0.8)',
        border: `1px solid ${color}22`,
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${color}55`)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${color}22`)}
    >
      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{entry.title}</span>
          <span
            style={{
              fontSize: 8,
              padding: '1px 6px',
              borderRadius: 3,
              background: `${color}22`,
              border: `1px solid ${color}44`,
              color,
              fontWeight: 700,
              letterSpacing: 0.5,
            }}
          >
            {CATEGORY_LABELS[entry.category]?.toUpperCase()}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(200,220,240,0.7)', lineHeight: 1.5 }}>{entry.body}</div>
      </div>
      <div style={{ fontSize: 9, color: 'rgba(160,200,255,0.3)', whiteSpace: 'nowrap', flexShrink: 0 }}>{time}</div>
    </div>
  );
}
