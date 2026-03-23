// space-unit-ui.tsx — Ship info, command card, build & upgrade panels
import React from 'react';
import {
  SHIP_PREVIEW,
  ABILITY_IMG,
  ABILITY_IMG_FALLBACK,
  ABILITY_ICONS,
  Svg,
  STAT_ICONS,
  ATTACK_IMG,
  SHIP_DEFINITIONS,
  BUILDABLE_SHIPS,
  UPGRADE_COSTS,
  UPGRADE_BONUSES,
  HERO_DEFINITIONS,
  HERO_SHIPS,
  getShipDef,
  SHIP_ROLES,
  SHIP_ROLE_LABELS,
  SHIP_ROLE_COLORS,
  CLASS_ABBR,
  TIER_COLORS,
  GUI_FRAMES,
  UPGRADE_HUD_ICONS,
  type SpaceRenderer,
  type SpaceShip,
  type SpaceStation,
  type ShipAbilityState,
  type PlayerResources,
  type TeamUpgrades,
  type UpgradeType,
  Btn,
  Slot,
  Bar,
} from './space-ui-shared';

function SingleUnitInfo({ ship, def }: { ship: SpaceShip; def: { class: string; stats: any; displayName: string } }) {
  const hpColor = ship.hp / ship.maxHp > 0.5 ? '#44ee44' : ship.hp / ship.maxHp > 0.25 ? '#eebb00' : '#ee4444';
  const preview = SHIP_PREVIEW[ship.shipType];
  const role = SHIP_ROLES[ship.shipType];
  const roleColor = role ? SHIP_ROLE_COLORS[role] : null;
  const isHero = ship.shipClass === 'dreadnought' || 'lore' in def;
  const tierColor = TIER_COLORS[def.stats.tier] ?? '#4488ff';
  const classAbbr = CLASS_ABBR[def.class] ?? def.class.slice(0, 3).toUpperCase();
  const heroLore = 'lore' in def ? (def as any).lore : null;

  return (
    <div style={{ display: 'flex', gap: 12, height: '100%' }}>
      {/* ─ Portrait — large with scifi-gui frame ───────── */}
      <div
        style={{
          width: 120,
          height: 120,
          flexShrink: 0,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Metallic octagonal portrait frame (panel-sq from scifi-gui) */}
        <img
          src={isHero ? GUI_FRAMES.portraitFrameGold : GUI_FRAMES.portraitFrame}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            pointerEvents: 'none',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Ship image */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 6,
            overflow: 'hidden',
            background: 'rgba(2,6,18,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isHero ? '0 0 16px rgba(255,180,0,0.25)' : roleColor ? `0 0 10px ${roleColor}44` : 'none',
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt={def.displayName}
              style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'auto' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div style={{ fontSize: 40, opacity: 0.2 }}>{isHero ? '⭐' : ship.shipClass === 'worker' ? '⛏️' : '🚀'}</div>
          )}
        </div>
        {/* Tier / HERO badge */}
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            fontSize: 9,
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: 3,
            letterSpacing: 0.5,
            background: isHero ? 'rgba(255,180,0,0.3)' : 'rgba(10,20,40,0.9)',
            color: isHero ? '#fc4' : tierColor,
            border: `1px solid ${isHero ? '#ffcc0066' : tierColor + '44'}`,
          }}
        >
          {isHero ? 'HERO' : `T${def.stats.tier}`}
        </div>
        {/* Class abbreviation badge */}
        <div
          style={{
            position: 'absolute',
            top: 4,
            left: 4,
            fontSize: 8,
            fontWeight: 700,
            padding: '1px 5px',
            borderRadius: 3,
            background: 'rgba(10,20,40,0.85)',
            color: tierColor,
            letterSpacing: 0.5,
            border: `1px solid ${tierColor}33`,
          }}
        >
          {classAbbr}
        </div>
        {/* Role badge */}
        {role && (
          <div
            style={{
              position: 'absolute',
              bottom: 4,
              left: 4,
              fontSize: 8,
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: 3,
              background: `${roleColor}22`,
              border: `1px solid ${roleColor}55`,
              color: roleColor!,
              letterSpacing: 0.5,
            }}
          >
            {SHIP_ROLE_LABELS[role]}
          </div>
        )}
      </div>

      {/* ─ Stats ────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name + rank */}
        <div style={{ marginBottom: 4 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: isHero ? '#fc4' : '#fff',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {def.displayName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <span style={{ fontSize: 9, opacity: 0.4, textTransform: 'uppercase' }}>{def.class.replace(/_/g, ' ')}</span>
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                style={{
                  fontSize: 10,
                  color: i < (ship.rank ?? 0) ? '#ffcc00' : '#1e2e40',
                  textShadow: i < (ship.rank ?? 0) ? '0 0 4px #ffcc0088' : 'none',
                }}
              >
                ★
              </span>
            ))}
          </div>
          {heroLore && <div style={{ fontSize: 8, color: '#8ac', fontStyle: 'italic', marginTop: 2, opacity: 0.7 }}>{heroLore}</div>}
        </div>

        {/* HP bar */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 1, color: hpColor }}>
            <span>♥ HP</span>
            <span>
              {Math.ceil(ship.hp)}/{ship.maxHp}
            </span>
          </div>
          <Bar value={ship.hp} max={ship.maxHp} color={hpColor} height={8} />
        </div>

        {/* Shield bar */}
        {ship.maxShield > 0 && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 1, color: '#44ccff' }}>
              <span>🛡 SHD</span>
              <span>
                {Math.ceil(ship.shield)}/{ship.maxShield}
              </span>
            </div>
            <Bar value={ship.shield} max={ship.maxShield} color="#44ccff" height={6} />
          </div>
        )}

        {/* Stats with attack type icon */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px 10px',
            fontSize: 9,
            color: 'rgba(160,200,255,0.6)',
            marginTop: 3,
            alignItems: 'center',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#ff8844' }}>
            {ATTACK_IMG[ship.attackType] && (
              <img
                src={ATTACK_IMG[ship.attackType]}
                alt=""
                style={{ width: 14, height: 14, imageRendering: 'auto' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            {ship.attackDamage}dmg
          </span>
          <span>
            {STAT_ICONS.armor} {ship.armor}ar
          </span>
          <span style={{ color: '#ffcc00' }}>
            {STAT_ICONS.speed} {Math.round(ship.speed)}
          </span>
          <span>
            {STAT_ICONS.range} {ship.attackRange}
          </span>
          <span style={{ color: '#8ac' }}>
            {STAT_ICONS.cooldown} {ship.attackCooldown.toFixed(1)}s
          </span>
          {ship.xp > 0 && <span style={{ color: '#88a' }}>XP {ship.xp}</span>}
        </div>
      </div>
    </div>
  );
}

// ── Multi Unit Info — clickable cards (LMB = isolate that ship) ──────────

function MultiUnitInfo({ ships, onIsolate }: { ships: SpaceShip[]; onIsolate: (shipId: number) => void }) {
  const groups = new Map<string, SpaceShip[]>();
  for (const s of ships) {
    if (!groups.has(s.shipType)) groups.set(s.shipType, []);
    groups.get(s.shipType)!.push(s);
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 5, color: 'rgba(160,200,255,0.55)' }}>
        {ships.length} UNITS · <span style={{ fontSize: 9, opacity: 0.6 }}>Click to select one type</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, overflowY: 'auto' }}>
        {Array.from(groups.entries()).map(([type, group]) => {
          const def = getShipDef(type);
          const preview = SHIP_PREVIEW[type];
          const role = SHIP_ROLES[type];
          const avgHp = group.reduce((sum, s) => sum + s.hp / s.maxHp, 0) / group.length;
          const hpCol = avgHp > 0.5 ? '#44cc44' : avgHp > 0.25 ? '#ccaa00' : '#cc4444';
          const maxRank = Math.max(...group.map((s) => s.rank ?? 0));
          const tierCol = def ? (TIER_COLORS[def.stats.tier] ?? '#4488ff') : '#4488ff';
          const abbr = def ? (CLASS_ABBR[def.class] ?? '') : '';
          return (
            <div
              key={type}
              onClick={() => onIsolate(group[0].id)}
              title={`${def?.displayName ?? type} ×${group.length} — Click to select`}
              style={{
                width: 72,
                flexShrink: 0,
                border: `1px solid ${role ? SHIP_ROLE_COLORS[role] + '66' : '#1a3050'}`,
                borderLeft: `3px solid ${tierCol}`,
                borderRadius: 5,
                cursor: 'pointer',
                background: 'rgba(8,16,34,0.85)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#4488ff';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = role ? SHIP_ROLE_COLORS[role] + '66' : '#1a3050';
              }}
            >
              {/* Ship image */}
              <div
                style={{
                  height: 52,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(2,6,18,0.8)',
                  overflow: 'hidden',
                }}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt={type}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'auto' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div style={{ fontSize: 22, opacity: 0.15 }}>🚀</div>
                )}
              </div>
              {/* Count + rank + class */}
              <div style={{ padding: '3px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>x{group.length}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  {maxRank > 0 && <span style={{ fontSize: 8, color: '#ffcc00' }}>★{maxRank}</span>}
                  {abbr && <span style={{ fontSize: 7, color: tierCol, fontWeight: 700, letterSpacing: 0.3 }}>{abbr}</span>}
                </div>
              </div>
              {/* HP bar */}
              <div style={{ height: 4, background: '#0a1020' }}>
                <div style={{ height: '100%', width: `${avgHp * 100}%`, background: hpCol, borderRadius: 1 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Command Card — action hotkeys + abilities ───────────────────────

function CommandCard({ ship, renderer, allSelected }: { ship: SpaceShip; renderer: SpaceRenderer; allSelected: SpaceShip[] }) {
  const state = renderer.engine.state;

  // ─ Issue a stop/hold command directly to all selected ships
  const stop = () => {
    for (const id of state.selectedIds) {
      const s = state.ships.get(id);
      if (s) {
        s.moveTarget = null;
        s.targetId = null;
        s.isAttackMoving = false;
      }
    }
    renderer.controls.commandMode = 'normal';
  };
  const hold = () => {
    for (const id of state.selectedIds) {
      const s = state.ships.get(id);
      if (s) {
        s.holdPosition = true;
        s.moveTarget = null;
      }
    }
    renderer.controls.commandMode = 'normal';
  };

  const ACTION_BTNS: Array<{
    label: string;
    key: string;
    color: string;
    icon: string;
    active?: boolean;
    action: () => void;
  }> = [
    {
      label: 'Attack',
      key: 'G',
      color: '#ff5533',
      icon: '/assets/space/ui/space-icons/PNG/2.png',
      active: renderer.controls.commandMode === 'attack_move',
      action: () => {
        renderer.controls.commandMode = renderer.controls.commandMode === 'attack_move' ? 'normal' : 'attack_move';
      },
    },
    {
      label: 'Move',
      key: 'RMB',
      color: '#4488ff',
      icon: '/assets/space/ui/space-icons/PNG/4.png',
      active: renderer.controls.commandMode === 'normal',
      action: () => {
        renderer.controls.commandMode = 'normal';
      },
    },
    {
      label: 'Patrol',
      key: 'P',
      color: '#44cc88',
      icon: '/assets/space/ui/space-icons/PNG/6.png',
      active: renderer.controls.commandMode === 'patrol',
      action: () => {
        renderer.controls.commandMode = renderer.controls.commandMode === 'patrol' ? 'normal' : 'patrol';
      },
    },
    { label: 'Defend', key: 'H', color: '#aa88ff', icon: '/assets/space/ui/space-icons/PNG/8.png', active: false, action: hold },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 6 }}>
      {/* ─ Action command row using Btn components ───── */}
      <div>
        <div style={{ fontSize: 9, color: 'rgba(160,200,255,0.4)', letterSpacing: 2, marginBottom: 4 }}>COMMANDS</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {ACTION_BTNS.map((btn) => (
            <Btn
              key={btn.key}
              label={btn.label}
              icon={btn.icon}
              active={btn.active}
              onClick={btn.action}
              style={{ width: 56, height: 48, flexDirection: 'column' as any }}
            />
          ))}
        </div>
      </div>

      {/* ─ Abilities ──────────────────────────────── */}
      {ship.abilities.length > 0 && (
        <div>
          <div style={{ fontSize: 9, color: 'rgba(160,200,255,0.4)', letterSpacing: 2, marginBottom: 4 }}>ABILITIES</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ship.abilities.map((ab, i) => (
              <AbilityButton key={ab.ability.id} ab={ab} index={i} renderer={renderer} allSelected={allSelected} />
            ))}
          </div>
          <div style={{ fontSize: 8, marginTop: 6, color: 'rgba(160,200,255,0.3)' }}>Click: cast · Right-click: toggle autocast</div>
        </div>
      )}
    </div>
  );
}

// ── Ability Button ────────────────────────────────────────────────

function AbilityButton({
  ab,
  index,
  renderer,
  allSelected,
}: {
  ab: ShipAbilityState;
  index: number;
  renderer: SpaceRenderer;
  allSelected: SpaceShip[];
}) {
  const onCooldown = ab.cooldownRemaining > 0;
  const cdPct = ab.ability.cooldown > 0 ? ab.cooldownRemaining / ab.ability.cooldown : 0;
  const icon = ABILITY_ICONS[ab.ability.type];

  // Check autocast state across selection (majority rules display)
  let autoOn = 0,
    autoTotal = 0;
  for (const s of allSelected) {
    const a = s.abilities[index];
    if (a) {
      autoTotal++;
      if (a.autoCast) autoOn++;
    }
  }
  const isAutoCast = autoOn > autoTotal / 2;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    renderer.activateAbility(index);
  };

  const handleContext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    renderer.toggleAutoCast(index);
  };

  return (
    <Slot size={64} onClick={handleClick} active={ab.active || isAutoCast} style={{ opacity: onCooldown && !ab.active ? 0.5 : 1 }}>
      <div
        onContextMenu={handleContext}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Cooldown sweep overlay */}
        {onCooldown && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 6,
              background: `conic-gradient(rgba(0,0,0,0.7) ${cdPct * 360}deg, transparent ${cdPct * 360}deg)`,
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
        )}

        {/* Icon — prefer PNG skill art, fall back to SVG */}
        <div
          style={{
            width: 34,
            height: 34,
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {ABILITY_IMG[ab.ability.type] ? (
            <img
              src={ABILITY_IMG[ab.ability.type]}
              alt={ab.ability.name}
              style={{
                width: 32,
                height: 32,
                borderRadius: 4,
                objectFit: 'cover',
                imageRendering: 'auto',
                filter: ab.active ? 'brightness(1.4) saturate(1.5)' : onCooldown ? 'grayscale(0.7) brightness(0.6)' : 'none',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div style={{ width: 28, height: 28, color: ab.active ? '#ff0' : '#8ac' }}>
              {icon ?? (
                <Svg size={28}>
                  <circle cx="12" cy="12" r="8" stroke="#8ac" strokeWidth="1.5" fill="none" />
                  <circle cx="12" cy="12" r="3" fill="#8ac" />
                </Svg>
              )}
            </div>
          )}
        </div>

        {/* Key label */}
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            marginTop: 2,
            position: 'relative',
            zIndex: 1,
            background: '#1a2a40',
            padding: '1px 4px',
            borderRadius: 2,
          }}
        >
          {ab.ability.key}
        </div>

        {/* Ability name */}
        <div
          style={{
            fontSize: 8,
            opacity: 0.6,
            marginTop: 1,
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
            lineHeight: 1.1,
            maxWidth: 60,
          }}
        >
          {ab.ability.name}
        </div>

        {/* Cooldown text */}
        {onCooldown && (
          <div
            style={{
              position: 'absolute',
              top: 2,
              right: 3,
              fontSize: 9,
              fontWeight: 700,
              color: '#f88',
              zIndex: 2,
            }}
          >
            {ab.cooldownRemaining.toFixed(0)}s
          </div>
        )}

        {/* Autocast indicator */}
        {isAutoCast && (
          <div
            style={{
              position: 'absolute',
              top: 2,
              left: 3,
              fontSize: 8,
              fontWeight: 700,
              color: '#4f4',
              zIndex: 2,
            }}
          >
            AUTO
          </div>
        )}

        {/* Energy cost */}
        <div
          style={{
            position: 'absolute',
            bottom: 1,
            right: 3,
            fontSize: 8,
            color: '#4df',
            zIndex: 2,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {STAT_ICONS.energyCost}
            {ab.ability.energyCost}
          </span>
        </div>
      </div>
    </Slot>
  );
}

// ── Minimap with LMB (camera) / RMB (move command) ───────────

function BuildPanel({ station, renderer, res }: { station: SpaceStation; renderer: SpaceRenderer; res: PlayerResources }) {
  const tiers = [1, 2, 3, 4, 5];
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: '#4df' }}>BUILD SHIPS</div>

      {/* Auto-produce selector (swarm style) */}
      <div style={{ marginBottom: 6, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 9, opacity: 0.5 }}>Auto:</span>
        <div
          onClick={() => renderer.engine.setAutoProduction(station.id, null)}
          style={{
            fontSize: 8,
            padding: '2px 6px',
            borderRadius: 3,
            cursor: 'pointer',
            background: !station.autoProduceType ? '#2266cc' : '#1a2a40',
            border: '1px solid #1a3050',
          }}
        >
          OFF
        </div>
        {['red_fighter', 'galactix_racer', 'dual_striker'].map((key) => {
          const d = SHIP_DEFINITIONS[key];
          return d ? (
            <div
              key={key}
              onClick={() => renderer.engine.setAutoProduction(station.id, key)}
              style={{
                fontSize: 8,
                padding: '2px 6px',
                borderRadius: 3,
                cursor: 'pointer',
                background: station.autoProduceType === key ? '#2266cc' : '#1a2a40',
                border: '1px solid #1a3050',
              }}
            >
              {d.displayName}
            </div>
          ) : null;
        })}
      </div>

      {/* Build queue */}
      {station.buildQueue.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          {station.buildQueue.map((item, i) => {
            const itemDef = getShipDef(item.shipType);
            return (
              <div key={i} style={{ fontSize: 10, display: 'flex', gap: 6, marginBottom: 2 }}>
                <span style={{ color: HERO_SHIPS.includes(item.shipType) ? '#fc4' : '#fff', fontWeight: 600 }}>
                  {itemDef?.displayName ?? item.shipType}
                </span>
                <span style={{ color: '#fc4' }}>{item.buildTimeRemaining.toFixed(0)}s</span>
                {i === 0 && (
                  <div style={{ flex: 1, height: 4, background: '#1a1a2a', borderRadius: 2, alignSelf: 'center' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${(1 - item.buildTimeRemaining / item.totalBuildTime) * 100}%`,
                        background: '#4488ff',
                        borderRadius: 2,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stock ships — visual slot cards with ship previews */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 140, overflowY: 'auto', marginBottom: 6 }}>
        {tiers.flatMap((tier) =>
          (BUILDABLE_SHIPS[tier] ?? []).map((key) => {
            const def = SHIP_DEFINITIONS[key];
            if (!def) return null;
            const s = def.stats;
            const canAfford = res.credits >= s.creditCost && res.energy >= s.energyCost && res.minerals >= s.mineralCost;
            const preview = SHIP_PREVIEW[key];
            const tierCol = TIER_COLORS[s.tier] ?? '#4488ff';
            const abbr = CLASS_ABBR[def.class] ?? '';
            return (
              <div
                key={key}
                onClick={() => (canAfford ? renderer.engine.queueBuild(station.id, key) : undefined)}
                title={`${def.displayName} — ${s.creditCost}c / ${s.energyCost}e / ${s.mineralCost}m · ${s.buildTime}s`}
                style={{
                  width: 88,
                  position: 'relative',
                  borderRadius: 6,
                  overflow: 'hidden',
                  border: `1px solid ${tierCol}44`,
                  borderLeft: `3px solid ${tierCol}`,
                  background: 'rgba(6,14,32,0.9)',
                  cursor: canAfford ? 'pointer' : 'default',
                  opacity: canAfford ? 1 : 0.35,
                  transition: 'transform 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (canAfford) (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.04)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                }}
              >
                {/* Ship preview image */}
                <div
                  style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,18,0.8)' }}
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt={def.displayName}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'auto' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 20, opacity: 0.15 }}>🚀</div>
                  )}
                </div>
                {/* Info bar */}
                <div style={{ padding: '3px 4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        color: '#fff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 54,
                      }}
                    >
                      {def.displayName}
                    </span>
                    <span style={{ fontSize: 7, fontWeight: 700, color: tierCol, letterSpacing: 0.3 }}>{abbr}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, fontSize: 7 }}>
                    <span style={{ color: '#fc4' }}>{s.creditCost}c</span>
                    <span style={{ color: '#4df' }}>{s.energyCost}e</span>
                    <span style={{ color: '#4f8' }}>{s.mineralCost}m</span>
                  </div>
                </div>
                {/* Tier badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    fontSize: 7,
                    fontWeight: 700,
                    padding: '1px 4px',
                    borderRadius: 2,
                    background: 'rgba(10,20,40,0.85)',
                    color: tierCol,
                    border: `1px solid ${tierCol}33`,
                  }}
                >
                  T{s.tier}
                </div>
              </div>
            );
          }),
        )}
      </div>

      {/* Hero ships (only if station can build heroes) */}
      {station.canBuildHeroes && (
        <>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#fc4',
              marginBottom: 6,
              borderTop: '1px solid #443300',
              paddingTop: 6,
              letterSpacing: 1,
              backgroundImage: `url(${GUI_FRAMES.portraitFrameGold})`,
              backgroundSize: '100% 100%',
              padding: '4px 12px',
              textAlign: 'center',
            }}
          >
            HERO SHIPS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {HERO_SHIPS.map((key) => {
              const def = HERO_DEFINITIONS[key];
              if (!def) return null;
              const s = def.stats;
              const canAfford = res.credits >= s.creditCost && res.energy >= s.energyCost && res.minerals >= s.mineralCost;
              const preview = SHIP_PREVIEW[key];
              return (
                <div
                  key={key}
                  onClick={() => canAfford && renderer.engine.queueBuild(station.id, key)}
                  title={`${def.displayName} — ${(def as any).lore ?? ''}`}
                  style={{
                    width: 92,
                    position: 'relative',
                    borderRadius: 6,
                    overflow: 'hidden',
                    border: '1px solid #ffcc0044',
                    borderLeft: '3px solid #ffcc00',
                    background: canAfford ? 'rgba(40,30,10,0.9)' : 'rgba(20,15,5,0.5)',
                    opacity: canAfford ? 1 : 0.4,
                    cursor: canAfford ? 'pointer' : 'default',
                    boxShadow: '0 0 10px rgba(255,180,0,0.15)',
                  }}
                  onMouseEnter={(e) => {
                    if (canAfford) (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.04)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                  }}
                >
                  {/* Preview */}
                  <div
                    style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,4,10,0.8)' }}
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt={def.displayName}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'auto' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: 24, opacity: 0.2 }}>⭐</div>
                    )}
                  </div>
                  <div style={{ padding: '3px 4px' }}>
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        color: '#fc4',
                        marginBottom: 2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {def.displayName}
                    </div>
                    <div style={{ display: 'flex', gap: 4, fontSize: 7 }}>
                      <span style={{ color: '#fc4' }}>{s.creditCost}c</span>
                      <span style={{ color: '#4df' }}>{s.energyCost}e</span>
                      <span style={{ color: '#4f8' }}>{s.mineralCost}m</span>
                    </div>
                    <div style={{ fontSize: 7, color: '#888', marginTop: 1 }}>{s.buildTime}s</div>
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      fontSize: 8,
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: 'rgba(255,180,0,0.3)',
                      color: '#fc4',
                      border: '1px solid #ffcc0066',
                    }}
                  >
                    HERO
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Upgrade Panel (when nothing selected) — using Slot + Bar from ui-lib

function UpgradePanel({ upg, res, renderer }: { upg: TeamUpgrades; res: PlayerResources; renderer: SpaceRenderer }) {
  const types: { key: keyof TeamUpgrades; label: string; color: string }[] = [
    { key: 'attack', label: 'Attack', color: '#f44' },
    { key: 'armor', label: 'Armor', color: '#8ac' },
    { key: 'speed', label: 'Speed', color: '#fa0' },
    { key: 'health', label: 'Health', color: '#4f4' },
    { key: 'shield', label: 'Shield', color: '#4df' },
  ];
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8, color: '#fa0', letterSpacing: 1 }}>GLOBAL UPGRADES</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {types.map((t) => {
          const level = upg[t.key];
          const maxed = level >= 5;
          const cost = !maxed ? UPGRADE_COSTS[level] : null;
          const canAfford = cost ? res.credits >= cost.credits && res.minerals >= cost.minerals && res.energy >= cost.energy : false;
          const hudIcon = UPGRADE_HUD_ICONS[t.key];
          return (
            <div
              key={t.key}
              onClick={() => (canAfford ? renderer.engine.purchaseUpgrade(1 as any, t.key) : undefined)}
              style={{
                width: 100,
                position: 'relative',
                borderRadius: 8,
                overflow: 'hidden',
                cursor: canAfford ? 'pointer' : 'default',
                opacity: maxed ? 0.85 : canAfford ? 1 : 0.35,
                transition: 'transform 0.1s',
              }}
              onMouseEnter={(e) => {
                if (canAfford) (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
              }}
            >
              {/* InventorySlot hexagonal frame background */}
              <img
                src={GUI_FRAMES.inventorySlot}
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'fill',
                  pointerEvents: 'none',
                  filter: maxed ? 'brightness(1.3) hue-rotate(40deg)' : 'brightness(0.85)',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '10px 6px 8px' }}>
                {/* Large HUD ability icon */}
                <img
                  src={hudIcon}
                  alt={t.label}
                  style={{ width: 40, height: 40, objectFit: 'contain', imageRendering: 'auto', marginBottom: 4 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div style={{ fontSize: 10, fontWeight: 800, color: t.color, marginBottom: 4, letterSpacing: 0.5 }}>{t.label}</div>
                <Bar value={level} max={5} color={t.color} height={6} width={70} />
                <div style={{ fontSize: 9, color: '#fff', marginTop: 3, fontWeight: 700 }}>Lv {level}/5</div>
                {!maxed && cost && (
                  <div style={{ fontSize: 7, color: '#8ac', marginTop: 2 }}>
                    {cost.credits}c / {cost.energy}e / {cost.minerals}m
                  </div>
                )}
                {maxed && <div style={{ fontSize: 9, color: '#4f4', fontWeight: 800, marginTop: 2 }}>✔ MAX</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Void Power Castbar ─────────────────────────────────────────

export { SingleUnitInfo, MultiUnitInfo, CommandCard, AbilityButton, BuildPanel, UpgradePanel };
