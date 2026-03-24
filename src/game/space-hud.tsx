// space-hud.tsx — Main SpaceHUD component
import { useEffect, useState, useRef } from 'react';
import type { SpaceRenderer } from './space-renderer';
import type { SpaceShip, SpaceStation, SpaceGameState, Planet } from './space-types';
import {
  RES_ICONS,
  STAT_ICONS,
  worldToScreen,
  formatTime,
  SHIP_PREVIEW,
  TEAM_COLORS,
  CAPTURE_TIME,
  DOMINATION_TIME,
  PLANET_TYPE_DATA,
  getShipDef,
  SHIP_ROLES,
  SHIP_ROLE_LABELS,
  SHIP_ROLE_COLORS,
  Panel,
  Btn,
  ResBox,
} from './space-ui-shared';
import { SingleUnitInfo, MultiUnitInfo, CommandCard, BuildPanel, UpgradePanel } from './space-unit-ui';
import { Minimap, PlanetInfoPanel } from './space-planet-ui';
import { VoidPowerBar, TechTreePanel, CommanderPanel } from './space-panels';
import { FlagshipInterior } from './flagship-interior';
import { VOID_POWERS } from './space-techtree';
import type { CommanderSpec } from './space-types';

interface SpaceHUDProps {
  renderer: SpaceRenderer | null;
  onQuit?: () => void;
}

export function SpaceHUD({ renderer, onQuit }: SpaceHUDProps) {
  const [, forceUpdate] = useState(0);
  const animRef = useRef(0);
  const [techOpen, setTechOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [interiorOpen, setInteriorOpen] = useState(false);
  const [selectedPlanetId, setSelectedPlanetId] = useState<number | null>(null);
  const [selectedCmdId, setSelectedCmdId] = useState<number | null>(null);

  // Re-render HUD at 15fps for smoother counters
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      forceUpdate((n) => n + 1);
      animRef.current = window.setTimeout(tick, 66);
    };
    tick();
    return () => {
      running = false;
      clearTimeout(animRef.current);
    };
  }, []);

  // Planet selection wiring: world click -> HUD selected planet
  useEffect(() => {
    if (!renderer) return;
    const prev = renderer.onPlanetClick;
    const handler = (planetId: number) => {
      setSelectedPlanetId(planetId > 0 ? planetId : null);
    };
    renderer.onPlanetClick = handler;
    return () => {
      if (renderer.onPlanetClick === handler) renderer.onPlanetClick = prev;
    };
  }, [renderer]);

  if (!renderer?.engine?.state) return null;
  const state = renderer.engine.state;
  const res = state.resources[1]; // player resources
  const upg = state.upgrades[1];
  const techSt = state.techState?.get(1);
  const myPlanets = state.planets.filter((p) => p.owner === 1);

  // Get selected ships
  const selectedShips: SpaceShip[] = [];
  for (const id of state.selectedIds) {
    const ship = state.ships.get(id);
    if (ship && !ship.dead) selectedShips.push(ship);
  }

  // Selected station?
  let selectedStation: SpaceStation | null = null;
  // Check if any station is close to click (simple: check if station is 'selected')
  for (const [, st] of state.stations) {
    if (st.selected && !st.dead && st.team === 1) {
      selectedStation = st;
      break;
    }
  }

  // Primary selected ship — use getShipDef so Hero ships resolve correctly
  const primary = selectedShips[0] ?? null;
  const def = primary ? getShipDef(primary.shipType) : null;
  const selectedPlanet = selectedPlanetId != null ? (state.planets.find((p) => p.id === selectedPlanetId) ?? null) : null;

  // Count alive ships per team
  const teamCounts = new Map<number, number>();
  for (const [, s] of state.ships) {
    if (s.dead) continue;
    teamCounts.set(s.team, (teamCounts.get(s.team) ?? 0) + 1);
  }
  const playerAlive = teamCounts.get(1) ?? 0;
  const enemyAlive = (teamCounts.get(2) ?? 0) + (teamCounts.get(3) ?? 0) + (teamCounts.get(4) ?? 0);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', fontFamily: "'Segoe UI', monospace", color: '#cde' }}>
      {/* ── Game Over Overlay with Victory/Defeat badge art ──── */}
      {state.gameOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.85)',
            zIndex: 200,
            pointerEvents: 'auto',
          }}
        >
          <img
            src={state.winner === 1 ? '/assets/space/ui/hud/Victory_Badges.png' : '/assets/space/ui/hud/GameOver_Badges.png'}
            alt={state.winner === 1 ? 'Victory' : 'Defeat'}
            style={{
              width: 280,
              maxWidth: '70vw',
              marginBottom: 16,
              imageRendering: 'auto',
              filter: `drop-shadow(0 0 30px ${state.winner === 1 ? 'rgba(68,255,68,0.5)' : 'rgba(255,68,68,0.5)'})`,
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: state.winner === 1 ? '#44ff44' : '#ff4444',
              marginBottom: 8,
              textShadow: `0 0 30px ${state.winner === 1 ? '#44ff4488' : '#ff444488'}`,
              letterSpacing: 6,
            }}
          >
            {state.winner === 1 ? 'VICTORY' : 'DEFEAT'}
          </div>
          <div style={{ fontSize: 14, opacity: 0.6, marginBottom: 32 }}>
            {state.winCondition === 'domination' ? 'Won by Domination' : 'Won by Elimination'}
          </div>
          {onQuit && (
            <div onClick={onQuit} style={{ position: 'relative', cursor: 'pointer', display: 'inline-block' }}>
              <img src="/assets/space/ui/hud/Normal_Btn.png" alt="" style={{ width: 200, height: 48, display: 'block' }} />
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#fff',
                  letterSpacing: 2,
                }}
              >
                BACK TO MENU
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Domination Warning ────────────────────────── */}
      {state.dominationTeam !== null && state.dominationTimer > 0 && !state.gameOver && (
        <div
          style={{
            position: 'absolute',
            top: 44,
            left: '50%',
            transform: 'translateX(-50%)',
            background: state.dominationTeam === 1 ? 'rgba(68,255,68,0.2)' : 'rgba(255,68,68,0.2)',
            border: `1px solid ${state.dominationTeam === 1 ? '#4f4' : '#f44'}`,
            padding: '6px 20px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 700,
            color: state.dominationTeam === 1 ? '#4f4' : '#f44',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          DOMINATION: {Math.ceil(DOMINATION_TIME - state.dominationTimer)}s remaining
        </div>
      )}

      {/* ── Game Alerts with cyber avatar popups ─────────── */}
      {state.alerts.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 48,
            right: 12,
            zIndex: 30,
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxHeight: '40vh',
            overflowY: 'auto',
          }}
        >
          {state.alerts.slice(-4).map((alert) => {
            const avatarIdx = alert.type === 'under_attack' ? 3 : alert.type === 'conquest' ? 1 : alert.type === 'build_complete' ? 10 : 7;
            const borderCol = alert.type === 'under_attack' ? '#ff4444' : alert.type === 'conquest' ? '#44ff44' : '#4488ff';
            return (
              <div
                key={alert.id}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  padding: '6px 10px',
                  background: 'rgba(4,10,22,0.92)',
                  border: `1px solid ${borderCol}44`,
                  borderRadius: 8,
                  maxWidth: 280,
                  boxShadow: `0 0 12px ${borderCol}22`,
                }}
              >
                <img
                  src={`/assets/space/ui/avatars-cyber/PNG/without background/${avatarIdx}.png`}
                  alt=""
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: `2px solid ${borderCol}66`,
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: borderCol, letterSpacing: 0.5 }}>
                    {alert.type === 'under_attack'
                      ? 'UNDER ATTACK'
                      : alert.type === 'conquest'
                        ? 'CONQUEST'
                        : alert.type === 'build_complete'
                          ? 'BUILD COMPLETE'
                          : 'ALERT'}
                  </div>
                  <div style={{ fontSize: 10, color: '#cde' }}>{alert.message}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Info Bot (first 30 seconds of game) ──────────── */}
      {state.gameTime < 30 && !state.gameOver && (
        <div
          style={{
            position: 'absolute',
            bottom: 252,
            left: 12,
            zIndex: 25,
            pointerEvents: 'auto',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-end',
            maxWidth: 320,
          }}
        >
          <img
            src="/assets/space/ui/avatars-cyber/PNG/background/10.png"
            alt="Info Bot"
            style={{ width: 56, height: 56, borderRadius: 8, border: '2px solid #4488ff44', flexShrink: 0 }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div
            style={{
              background: 'rgba(4,14,28,0.95)',
              border: '1px solid #4488ff44',
              borderRadius: '10px 10px 10px 2px',
              padding: '8px 12px',
              fontSize: 10,
              color: '#8ac',
              lineHeight: 1.6,
            }}
          >
            {state.gameTime < 10 ? (
              <>
                <strong style={{ color: '#4df' }}>Welcome, Commander!</strong> Click your{' '}
                <strong style={{ color: '#28b4a0' }}>Pyramid Ship</strong> and select <strong style={{ color: '#fc4' }}>ENTER SHIP</strong>{' '}
                to access all systems. Your workers are already mining. Build more ships at the station!
              </>
            ) : state.gameTime < 20 ? (
              <>
                Use <strong style={{ color: '#fa0' }}>WASD</strong> to pan, <strong style={{ color: '#fa0' }}>Q/E</strong> to orbit camera.
                Press <strong style={{ color: '#fa0' }}>G</strong> for attack-move. Click the station to build ships. Press{' '}
                <strong style={{ color: '#fa0' }}>H</strong> to defend position.
              </>
            ) : (
              <>
                Capture neutral planets by sending ships nearby. Research tech from the <strong style={{ color: '#ff8844' }}>Armory</strong>{' '}
                inside your flagship. Train commanders for hero ships!
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Top Resource Bar ─────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 52,
          backgroundImage: 'url(/assets/space/ui/hud/DarkBackground.png)',
          backgroundSize: '100% 100%',
          borderBottom: '2px solid rgba(40,180,160,0.35)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 14,
          pointerEvents: 'auto',
          zIndex: 10,
        }}
      >
        <img
          src="/assets/space/ui/logo.webp"
          alt="Gruda Armada"
          style={{
            height: 34,
            imageRendering: 'auto',
            mixBlendMode: 'screen' as React.CSSProperties['mixBlendMode'],
            filter: 'drop-shadow(0 0 8px rgba(68,136,255,0.4))',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Resources with income rates — using ResBox from ui-lib */}
        {(() => {
          let incC = 0,
            incE = 0,
            incM = 0;
          for (const p of state.planets) {
            if (p.owner !== 1) continue;
            const m = PLANET_TYPE_DATA[p.planetType].resourceMult;
            incC += p.resourceYield.credits * m.credits;
            incE += p.resourceYield.energy * m.energy;
            incM += p.resourceYield.minerals * m.minerals;
          }
          return (
            <>
              <ResBox icon={RES_ICONS.credits} value={Math.floor(res.credits)} color="#fc4" rate={incC} />
              <ResBox icon={RES_ICONS.energy} value={Math.floor(res.energy)} color="#4df" rate={incE} />
              <ResBox icon={RES_ICONS.minerals} value={Math.floor(res.minerals)} color="#4f8" rate={incM} />
            </>
          );
        })()}
        <div
          style={{
            backgroundImage: 'url(/assets/space/ui/hud/BgSettingSmallBox.png)',
            backgroundSize: '100% 100%',
            padding: '4px 12px',
            fontSize: 12,
            color: '#8ac',
          }}
        >
          {Math.floor(res.supply)}/{res.maxSupply} sup
        </div>
        {/* Worker status */}
        {(() => {
          let workerTotal = 0,
            workerIdle = 0;
          for (const [, s] of state.ships) {
            if (s.dead || s.team !== 1 || s.shipClass !== 'worker') continue;
            workerTotal++;
            if (s.workerState === 'idle') workerIdle++;
          }
          return workerTotal > 0 ? (
            <div
              style={{
                backgroundImage: 'url(/assets/space/ui/hud/BgSettingSmallBox.png)',
                backgroundSize: '100% 100%',
                padding: '2px 8px',
                fontSize: 10,
                color: workerIdle > 0 ? '#ffaa22' : '#4f8',
              }}
            >
              {workerTotal}W{workerIdle > 0 && <span style={{ color: '#ff8844', fontWeight: 700 }}> ({workerIdle} idle)</span>}
            </div>
          ) : null;
        })()}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, opacity: 0.7, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4488ff', display: 'inline-block' }} />
          {playerAlive}
          <span style={{ opacity: 0.4, margin: '0 2px' }}>vs</span>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4444', display: 'inline-block' }} />
          {enemyAlive}
        </div>
        <span style={{ fontSize: 10, color: '#8ac', opacity: 0.7 }}>{formatTime(state.gameTime)}</span>
        {(() => {
          const zoom = renderer?.controls?.cameraState?.zoom ?? 200;
          const lbl =
            zoom < 30
              ? 'SURFACE'
              : zoom < 80
                ? 'LOW ORBIT'
                : zoom < 250
                  ? 'ORBIT'
                  : zoom < 600
                    ? 'SYSTEM'
                    : zoom < 1200
                      ? 'SECTOR'
                      : 'DEEP SPACE';
          return <span style={{ fontSize: 9, color: '#6a8a9a' }}>{lbl}</span>;
        })()}
        {onQuit && <Btn label="QUIT" onClick={onQuit} style={{ minWidth: 48, height: 28 }} />}
      </div>

      {/* ── Void Power Castbar ──────────────────── */}
      {techSt && Object.values(VOID_POWERS).some((p) => techSt.researchedNodes.has(p.techNodeId)) && (
        <VoidPowerBar state={state} techSt={techSt} onCast={(id, x, y) => renderer.engine.castVoidPower(1 as any, id, x, y)} />
      )}

      {/* ── Floating panels ──────────────────── */}
      {techOpen && (
        <TechTreePanel
          state={state}
          myPlanets={myPlanets}
          onResearch={(nodeId) => renderer.engine.startResearch(1 as any, nodeId)}
          onClose={() => setTechOpen(false)}
        />
      )}
      {cmdOpen && (
        <CommanderPanel
          state={state}
          selectedCmdId={selectedCmdId}
          selectedPlanetId={selectedPlanetId}
          onSelectCmd={(id) => setSelectedCmdId(id)}
          onSelectPlanet={(id) => setSelectedPlanetId(id)}
          onTrain={(pid) => renderer.engine.trainCommander(1 as any, pid)}
          onUpgrade={(cid) => renderer.engine.upgradeCommander(cid)}
          res={res}
          onClose={() => setCmdOpen(false)}
        />
      )}

      {/* ── Flagship Interior Overlay ───────────────── */}
      {interiorOpen &&
        (() => {
          // Find player's flagship and its commander
          let flagshipName = 'Pyramid Ship';
          let cmdPortrait: string | undefined;
          let cmdName: string | undefined;
          for (const [, ship] of state.ships) {
            if (!ship.dead && ship.team === 1 && (ship.shipType === 'pyramid_ship' || ship.shipType === 'custom_hero')) {
              const def = getShipDef(ship.shipType);
              if (def) flagshipName = def.displayName;
              // Find commander on this ship
              for (const [, cmd] of state.commanders) {
                if (cmd.equippedShipId === ship.id) {
                  cmdPortrait = cmd.portrait;
                  cmdName = cmd.name;
                }
              }
              break;
            }
          }
          // Find player's home station for build access
          const homeStation = [...state.stations.values()].find((s) => !s.dead && s.team === 1 && s.canBuildHeroes);
          return (
            <FlagshipInterior
              onClose={() => setInteriorOpen(false)}
              onOpenTech={() => {
                setInteriorOpen(false);
                setTechOpen(true);
              }}
              onOpenCommander={() => {
                setInteriorOpen(false);
                setCmdOpen(true);
              }}
              onOpenBuild={() => {
                setInteriorOpen(false);
                // Select the home station so build panel opens
                if (homeStation) {
                  for (const [, st] of state.stations) st.selected = false;
                  homeStation.selected = true;
                }
              }}
              onOpenUpgrades={() => {
                setInteriorOpen(false);
                // Deselect everything so upgrade panel shows
                for (const id of state.selectedIds) {
                  const s = state.ships.get(id);
                  if (s) s.selected = false;
                }
                state.selectedIds.clear();
                for (const [, st] of state.stations) st.selected = false;
              }}
              onOpenStarMap={() => {
                setInteriorOpen(false); /* M key handled externally */
              }}
              shipName={flagshipName}
              commanderPortrait={cmdPortrait}
              commanderName={cmdName}
            />
          );
        })()}

      {/* ── Floating Damage Numbers ─────────────────── */}
      {renderer &&
        state.floatingTexts.map((ft) => {
          const screen = worldToScreen(ft.x, ft.y, ft.z, renderer);
          if (!screen) return null;
          const opacity = 1 - ft.age / ft.maxAge;
          return (
            <div
              key={ft.id}
              style={{
                position: 'absolute',
                left: screen.x,
                top: screen.y,
                transform: 'translate(-50%, -50%)',
                fontSize: 12,
                fontWeight: 800,
                color: ft.color,
                textShadow: '0 0 4px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.7)',
                opacity,
                pointerEvents: 'none',
                zIndex: 15,
                transition: 'none',
              }}
            >
              {ft.text}
            </div>
          );
        })}

      {/* ── Capture Progress Labels on Planets ───────── */}
      {renderer &&
        state.planets
          .filter((p) => p.captureProgress > 0)
          .map((p) => {
            const screen = worldToScreen(p.x, p.y, 40, renderer);
            if (!screen) return null;
            const pct = Math.round((p.captureProgress / CAPTURE_TIME) * 100);
            const col = TEAM_COLORS[p.captureTeam] ? `#${TEAM_COLORS[p.captureTeam].toString(16).padStart(6, '0')}` : '#ffff44';
            return (
              <div
                key={`cap-${p.id}`}
                style={{
                  position: 'absolute',
                  left: screen.x,
                  top: screen.y - 16,
                  transform: 'translateX(-50%)',
                  fontSize: 11,
                  fontWeight: 800,
                  color: col,
                  textShadow: `0 0 6px ${col}88, 0 0 12px ${col}44`,
                  pointerEvents: 'none',
                  zIndex: 15,
                  letterSpacing: 1,
                }}
              >
                CAPTURING {pct}%
              </div>
            );
          })}

      {/* ── Bottom Panel — SC2-style: [minimap] [portrait | stats] [command grid] ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 240,
          backgroundImage: 'url(/assets/space/ui/hud/DarkBackground.png)',
          backgroundSize: '100% 100%',
          borderTop: '2px solid rgba(40,180,160,0.45)',
          display: 'flex',
          pointerEvents: 'auto',
          zIndex: 10,
        }}
      >
        {/* ── Minimap (far left) ──────────────────────── */}
        <div
          style={{
            width: 220,
            height: '100%',
            borderRight: '1px solid #1a3050',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Minimap state={state} renderer={renderer} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', gap: 2, padding: '4px' }}>
            <Btn label="TECH" onClick={() => setTechOpen((t) => !t)} active={techOpen} style={{ flex: 1, height: 28, minWidth: 0 }} />
            <Btn label="CMDR" onClick={() => setCmdOpen((t) => !t)} active={cmdOpen} style={{ flex: 1, height: 28, minWidth: 0 }} />
          </div>
        </div>

        {/* ── Ship Portrait (large image) ─────────────── */}
        <div
          style={{
            width: 200,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: '1px solid rgba(40,180,160,0.2)',
            background: 'rgba(2,6,16,0.6)',
            position: 'relative',
          }}
        >
          {primary && def ? (
            <>
              <img
                src={SHIP_PREVIEW[primary.shipType] ?? ''}
                alt={def.displayName}
                style={{
                  maxWidth: 180,
                  maxHeight: 180,
                  objectFit: 'contain',
                  imageRendering: 'auto',
                  filter: 'drop-shadow(0 0 12px rgba(68,136,255,0.4))',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {/* Ship name overlay at bottom */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#fff',
                  textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                  letterSpacing: 1,
                }}
              >
                {def.displayName}
              </div>
            </>
          ) : (
            <div style={{ opacity: 0.15, fontSize: 10, color: '#8ab', textAlign: 'center', lineHeight: 1.8 }}>No unit selected</div>
          )}
        </div>

        {/* ── Unit Stats (center) ─────────────────────── */}
        <div
          style={{
            width: 300,
            height: '100%',
            padding: '10px 14px',
            borderRight: '1px solid rgba(40,180,160,0.2)',
            backgroundImage: 'url(/assets/space/ui/hud/BgSettingSmallBox.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          {selectedShips.length === 0 ? (
            <div style={{ opacity: 0.25, fontSize: 11, marginTop: 60, textAlign: 'center', lineHeight: 1.8, color: '#8ab' }}>
              No units selected
              <br />
              <span style={{ fontSize: 9 }}>Left-drag to box-select · Double-click to select type</span>
            </div>
          ) : selectedShips.length === 1 && primary && def ? (
            <SingleUnitInfo ship={primary} def={def} />
          ) : (
            <MultiUnitInfo
              ships={selectedShips}
              onIsolate={(shipId) => {
                for (const id of state.selectedIds) {
                  const s = state.ships.get(id);
                  if (s) s.selected = false;
                }
                state.selectedIds.clear();
                const target = state.ships.get(shipId);
                if (target) {
                  target.selected = true;
                  state.selectedIds.add(shipId);
                }
              }}
            />
          )}
        </div>

        {/* ── Command Card / Build Panel (right — SC2 grid) ──── */}
        <div
          style={{
            flex: 1,
            height: '100%',
            padding: '10px 16px',
            overflowY: 'auto',
            backgroundImage: 'url(/assets/space/ui/hud/BgSettingSmallBox.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {selectedStation ? (
            <BuildPanel station={selectedStation} renderer={renderer} res={res} />
          ) : primary ? (
            <>
              {(primary.shipType === 'pyramid_ship' || primary.shipType === 'custom_hero') && (
                <Btn label="ENTER SHIP" wide active onClick={() => setInteriorOpen(true)} style={{ marginBottom: 8 }} />
              )}
              <CommandCard ship={primary} renderer={renderer} allSelected={selectedShips} />
            </>
          ) : selectedPlanet ? (
            <PlanetInfoPanel planet={selectedPlanet} state={state} renderer={renderer} />
          ) : upg ? (
            <UpgradePanel upg={upg} res={res} renderer={renderer} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
