/**
 * ΓöÇΓöÇ Sci-Fi HUD Bars ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
 * Three bar components that overlay interactive slots on the craftpix
 * SkillsLine bar images:
 *   FleetBar     ΓÇö commander + 12 fleet ships with HP colors
 *   CommandCard  ΓÇö 4 base commands + up to 4 active skills
 *   BuildQueueBar ΓÇö planet icon, build queue, countdown timer
 */

import React from 'react';
import type { SpaceGameState, SpaceShip, Commander, SpaceStation } from './space-types';
import { BARS, BAR_REGIONS, FLEET_SLOTS, CMD_SLOTS, QUEUE_SLOTS, ICONS_MENU, ICON_MENU_CLIPS } from './scifi-gui-assets';
import { SHIP_PREVIEW, getShipDef } from './space-ui-shared';

// ΓöÇΓöÇ Shared bar background ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function BarCanvas({ region, children }: { region: 'fleet' | 'command' | 'queue'; children: React.ReactNode }) {
  const r = BAR_REGIONS[region];
  const topPct = (r.top / r.imgH) * 100;
  const hPct = (r.height / r.imgH) * 100;
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 680,
        aspectRatio: `${1020 / r.height}`,
        backgroundImage: `url(${BARS.green})`,
        backgroundSize: '100% auto',
        backgroundPosition: `0 -${topPct}%`,
        backgroundRepeat: 'no-repeat',
        // Clip to just this bar's region
        overflow: 'hidden',
      }}
    >
      {/* Transparent overlay sized to bar region */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundSize: `100% ${(r.imgH / r.height) * 100}%`,
          backgroundPosition: `0 ${(-topPct / hPct) * 100}%`,
          backgroundImage: `url(${BARS.green})`,
          backgroundRepeat: 'no-repeat',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ΓöÇΓöÇ HP Color ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function hpColor(ship: SpaceShip): string {
  const pct = ship.hp / ship.maxHp;
  if (pct > 0.6) return '#44ee44';
  if (pct > 0.2) return '#eebb00';
  return '#ee4444';
}

// ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
// FLEET BAR ΓÇö commander + 12 fleet ships
// ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
interface FleetBarProps {
  state: SpaceGameState;
}

export function FleetBar({ state }: FleetBarProps) {
  // Find player commander
  const commander = [...state.commanders.values()].find((c) => c.team === 1 && !c.isDead);
  const fleetShips: (SpaceShip | null)[] = [];
  if (commander) {
    for (const sid of commander.fleetShipIds) {
      const s = state.ships.get(sid);
      fleetShips.push(s && !s.dead ? s : null);
    }
  }
  // Pad to 12
  while (fleetShips.length < 12) fleetShips.push(null);

  const S = FLEET_SLOTS;
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 680, height: 80 }}>
      <img
        src={BARS.green}
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 'auto',
          clipPath: 'inset(0 0 69% 0)', // show only top ~31% = fleet bar
          imageRendering: 'auto',
        }}
      />
      {/* Commander slot (slot 0) */}
      <div
        style={{
          position: 'absolute',
          left: `${S.startX}%`,
          top: `${S.topRowY}%`,
          width: `${S.slotW * 1.2}%`,
          height: `${S.slotH + 10}%`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {commander ? (
          <>
            <img
              src={commander.portrait}
              alt={commander.name}
              style={{
                width: '85%',
                height: '85%',
                objectFit: 'cover',
                borderRadius: 4,
                border: '1px solid #44ffaa',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div style={{ fontSize: 6, color: '#44ffaa', textAlign: 'center', marginTop: 1 }}>{commander.name}</div>
          </>
        ) : (
          <div style={{ fontSize: 7, color: '#446', textAlign: 'center' }}>NO CMD</div>
        )}
      </div>

      {/* Fleet ship slots (slots 1-12) */}
      {fleetShips.slice(0, 12).map((ship, i) => {
        const x = S.startX + (S.slotW + S.gapX) * (i + 1);
        const preview = ship ? SHIP_PREVIEW[ship.shipType] : null;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${S.topRowY}%`,
              width: `${S.slotW}%`,
              height: `${S.slotH}%`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {ship && preview ? (
              <img
                src={preview}
                alt=""
                style={{
                  width: '80%',
                  height: '80%',
                  objectFit: 'contain',
                  filter: ship.hp / ship.maxHp < 0.2 ? 'brightness(0.6) saturate(2)' : 'none',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : ship ? (
              <div style={{ fontSize: 8, color: '#4a7' }}>≡ƒÜÇ</div>
            ) : null}
            {/* HP bar below slot */}
            {ship && (
              <div
                style={{
                  position: 'absolute',
                  bottom: -2,
                  left: '10%',
                  width: '80%',
                  height: 3,
                  background: 'rgba(0,0,0,0.6)',
                  borderRadius: 1,
                }}
              >
                <div
                  style={{
                    width: `${(ship.hp / ship.maxHp) * 100}%`,
                    height: '100%',
                    background: hpColor(ship),
                    borderRadius: 1,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
// COMMAND CARD ΓÇö 4 base commands + up to 4 skills + stop
// ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
interface CommandCardProps {
  ship: SpaceShip | null;
  onCommand: (cmd: string) => void;
}

const BASE_COMMANDS = [
  { id: 'attack', label: 'A', key: 'A', tooltip: 'Attack (A)', icon: 'attack' },
  { id: 'move', label: 'M', key: 'M', tooltip: 'Move (M)', icon: 'run' },
  { id: 'patrol', label: 'P', key: 'P', tooltip: 'Patrol (P)', icon: 'walk' },
  { id: 'hold', label: 'H', key: 'H', tooltip: 'Hold (H)', icon: 'shield' },
] as const;

export function CommandCard({ ship, onCommand }: CommandCardProps) {
  const S = CMD_SLOTS;
  const abilities = ship?.abilities ?? [];

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 680, height: 78 }}>
      <img
        src={BARS.green}
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 'auto',
          clipPath: 'inset(33.5% 0 30% 0)', // show middle ~36.5% = command bar
          transform: 'translateY(-33.5%)',
          imageRendering: 'auto',
        }}
      />
      {/* Slots */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = S.startX + (S.slotW + S.gapX) * i;
        const isBase = i < 4;
        const isSkill = i >= 4 && i < 8;
        const isStop = i === 8;
        const baseCmd = isBase ? BASE_COMMANDS[i] : null;
        const abilityIdx = isSkill ? i - 4 : -1;
        const ab = abilityIdx >= 0 ? abilities[abilityIdx] : null;
        const cdPct = ab ? ab.cooldownRemaining / ab.ability.cooldown : 0;
        const isActive = ab?.active ?? false;

        return (
          <div
            key={i}
            onClick={() => {
              if (baseCmd) onCommand(baseCmd.id);
              else if (isStop) onCommand('stop');
              else if (ab) onCommand(`ability_${abilityIdx}`);
            }}
            title={baseCmd?.tooltip ?? (ab ? `${ab.ability.name} (${ab.ability.key})` : isStop ? 'Stop (S)' : '')}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${S.topY}%`,
              width: `${S.slotW}%`,
              height: `${S.slotH}%`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: ship && (baseCmd || ab || isStop) ? 'pointer' : 'default',
              borderRadius: 3,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              if (ship) e.currentTarget.style.background = 'rgba(68,255,170,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {/* Base command icon */}
            {baseCmd && (
              <>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#44ffaa', lineHeight: 1 }}>
                  {baseCmd.id === 'attack' ? 'ΓÜö' : baseCmd.id === 'move' ? 'Γ₧ñ' : baseCmd.id === 'patrol' ? 'Γƒ│' : '≡ƒ¢í'}
                </div>
                <div style={{ fontSize: 7, color: '#8ac', marginTop: 1 }}>{baseCmd.key}</div>
              </>
            )}
            {/* Skill slot */}
            {isSkill && ab && (
              <>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: isActive ? '#44ff88' : cdPct > 0 ? '#666' : '#cde',
                    textShadow: isActive ? '0 0 6px #44ff88' : 'none',
                  }}
                >
                  {ab.ability.key}
                </div>
                <div
                  style={{
                    fontSize: 6,
                    color: '#8ac',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}
                >
                  {ab.ability.name}
                </div>
                {/* Cooldown overlay */}
                {cdPct > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `rgba(0,0,0,${0.3 + cdPct * 0.4})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      color: '#ff8844',
                      fontWeight: 700,
                      borderRadius: 3,
                    }}
                  >
                    {Math.ceil(ab.cooldownRemaining)}s
                  </div>
                )}
              </>
            )}
            {isSkill && !ab && <div style={{ fontSize: 7, color: '#333' }}>ΓÇö</div>}
            {/* Stop */}
            {isStop && (
              <>
                <div style={{ fontSize: 14, color: '#ff6644' }}>ΓÅ╣</div>
                <div style={{ fontSize: 7, color: '#8ac' }}>S</div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
// BUILD QUEUE BAR ΓÇö planet icon, queue slots, countdown timer
// ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
interface BuildQueueBarProps {
  state: SpaceGameState;
}

export function BuildQueueBar({ state }: BuildQueueBarProps) {
  // Find player's home station or selected station
  let station: SpaceStation | null = null;
  for (const [, st] of state.stations) {
    if (st.dead || st.team !== 1) continue;
    if (st.selected) {
      station = st;
      break;
    }
  }
  if (!station) {
    // Fallback to home station
    for (const [, st] of state.stations) {
      if (st.dead || st.team !== 1) continue;
      if (st.canBuildHeroes) {
        station = st;
        break;
      }
    }
  }
  if (!station) {
    // Any player station
    for (const [, st] of state.stations) {
      if (st.dead || st.team !== 1) continue;
      station = st;
      break;
    }
  }

  const queue = station?.buildQueue ?? [];
  const planet = station ? state.planets.find((p) => p.id === station!.planetId) : null;
  const currentBuild = queue[0] ?? null;
  const buildPct = currentBuild ? 1 - currentBuild.buildTimeRemaining / currentBuild.totalBuildTime : 0;

  const Q = QUEUE_SLOTS;
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 680,
        height: 50,
        margin: '0 auto',
      }}
    >
      <img
        src={BARS.green}
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 'auto',
          clipPath: 'inset(67% 0 0 0)', // show bottom ~33% = queue bar
          transform: 'translateY(-67%)',
          imageRendering: 'auto',
        }}
      />

      {/* Left circle ΓÇö planet icon */}
      <div
        style={{
          position: 'absolute',
          left: '1%',
          top: '10%',
          width: 38,
          height: 38,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {planet ? (
          <div style={{ fontSize: 7, color: '#4a7', textAlign: 'center', lineHeight: 1.2 }}>
            <div style={{ fontSize: 16 }}>≡ƒîì</div>
            <div>{planet.name.slice(0, 6)}</div>
          </div>
        ) : (
          <div style={{ fontSize: 8, color: '#446' }}>ΓÇö</div>
        )}
      </div>

      {/* Queue slots */}
      {Array.from({ length: Q.count }, (_, i) => {
        const item = queue[i] ?? null;
        const x = Q.startX + (Q.slotW + Q.gapX) * i;
        const def = item ? getShipDef(item.shipType) : null;
        const preview = item ? SHIP_PREVIEW[item.shipType] : null;
        const isBuilding = i === 0 && currentBuild;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${Q.topY}%`,
              width: `${Q.slotW}%`,
              height: `${Q.slotH}%`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {item && preview ? (
              <img
                src={preview}
                alt={def?.displayName ?? ''}
                style={{
                  width: '75%',
                  height: '75%',
                  objectFit: 'contain',
                  opacity: isBuilding ? 1 : 0.6,
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : item ? (
              <div style={{ fontSize: 7, color: '#4a7' }}>{def?.displayName?.slice(0, 4) ?? '?'}</div>
            ) : null}
            {/* Build progress overlay on first slot */}
            {isBuilding && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: 'rgba(0,0,0,0.5)',
                }}
              >
                <div
                  style={{
                    width: `${buildPct * 100}%`,
                    height: '100%',
                    background: '#44ffaa',
                    transition: 'width 0.3s linear',
                  }}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Right circle ΓÇö countdown timer */}
      <div
        style={{
          position: 'absolute',
          right: '1%',
          top: '10%',
          width: 38,
          height: 38,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {currentBuild ? (
          <div style={{ fontSize: 10, fontWeight: 700, color: '#44ffaa', textAlign: 'center' }}>
            {Math.ceil(currentBuild.buildTimeRemaining)}s
          </div>
        ) : (
          <div style={{ fontSize: 8, color: '#446' }}>ΓÇö</div>
        )}
      </div>
    </div>
  );
}
