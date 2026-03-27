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
  Bar,
  ResBox,
} from './space-ui-shared';
import { SingleUnitInfo, MultiUnitInfo, CommandCard, BuildPanel, UpgradePanel } from './space-unit-ui';
import { Minimap, PlanetInfoPanel } from './space-planet-ui';
import { VoidPowerBar, TechTreePanel, CommanderPanel } from './space-panels';
import { ProductionSidebar } from './production-sidebar';
import { FlagshipInterior } from './flagship-interior';
import { VOID_POWERS } from './space-techtree';
import type { CommanderSpec } from './space-types';
import { PlanetCard } from './planet-card';
import { PlanetSurfaceView } from './planet-surface';
import { HackOverlay } from './hack-overlay';
import { FleetBar, CommandCard as SciFiCommandCard, BuildQueueBar } from './scifi-hud-bars';
import { JournalPanel, InventoryPanel } from './scifi-panels';
import { MenuButtonBar } from './scifi-menu-buttons';
import { CommanderCharacterPanel, UnifiedSkillTreePanel } from './scifi-commander';

interface SpaceHUDProps {
  renderer: SpaceRenderer | null;
  onQuit?: () => void;
  onToggleStarMap?: () => void;
  onDeployGround?: (planetType: import('./space-types').PlanetType, planetName: string) => void;
  onDeployGroundRts?: (planetType: import('./space-types').PlanetType, planetName: string) => void;
}

export function SpaceHUD({ renderer, onQuit, onToggleStarMap, onDeployGround, onDeployGroundRts }: SpaceHUDProps) {
  const [, forceUpdate] = useState(0);
  const animRef = useRef(0);
  const [techOpen, setTechOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [interiorOpen, setInteriorOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [planetCardOpen, setPlanetCardOpen] = useState(false);
  const [surfaceOpen, setSurfaceOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [charPanelOpen, setCharPanelOpen] = useState(false);
  const [skillTreeOpen, setSkillTreeOpen] = useState(false);
  const [selectedPlanetId, setSelectedPlanetId] = useState<number | null>(null);
  const [selectedCmdId, setSelectedCmdId] = useState<number | null>(null);
  const [planetCardIdx, setPlanetCardIdx] = useState(0);
  const [focusedGroupIdx, setFocusedGroupIdx] = useState(0);

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

  // Planet selection wiring: world click -> open planet card
  useEffect(() => {
    if (!renderer) return;
    const prev = renderer.onPlanetClick;
    const handler = (planetId: number) => {
      setSelectedPlanetId(planetId > 0 ? planetId : null);
      if (planetId > 0 && renderer?.engine?.state) {
        const idx = renderer.engine.state.planets.findIndex((p) => p.id === planetId);
        if (idx >= 0) {
          setPlanetCardIdx(idx);
          setPlanetCardOpen(true);
        }
      }
    };
    renderer.onPlanetClick = handler;
    return () => {
      if (renderer.onPlanetClick === handler) renderer.onPlanetClick = prev;
    };
  }, [renderer]);

  // L key: Captain's Log | F1: Planet list | Escape: close overlays
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'l') setLogOpen((o) => !o);
      if (e.key.toLowerCase() === 'i') setInventoryOpen((o) => !o);
      if (e.key === 'F1') {
        e.preventDefault();
        setPlanetCardOpen((o) => !o);
      }
      if (e.key.toLowerCase() === 'k') setSkillTreeOpen((o) => !o);
      if (e.key.toLowerCase() === 'c') setCharPanelOpen((o) => !o);
      if (e.key === 'Tab') {
        e.preventDefault();
        setFocusedGroupIdx((i) => i + 1);
      }
      if (e.key === 'Escape') {
        setLogOpen(false);
        setPlanetCardOpen(false);
        setSurfaceOpen(false);
        setInventoryOpen(false);
        setCharPanelOpen(false);
        setSkillTreeOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

      {/* ── Game Alerts with Shop_Box.png panel backgrounds ─────── */}
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
            const borderCol = alert.type === 'under_attack' ? '#ff4444' : alert.type === 'conquest' ? '#ffcc44' : '#4488ff';
            return (
              <div
                key={alert.id}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundImage: 'url(/assets/space/ui/hud/Shop_Box.png)',
                  backgroundSize: '100% 100%',
                  maxWidth: 290,
                  filter: `drop-shadow(0 2px 8px ${borderCol}33)`,
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
                  <div style={{ fontSize: 9, fontWeight: 700, color: borderCol, letterSpacing: 1, textTransform: 'uppercase' }}>
                    {alert.type === 'under_attack'
                      ? 'UNDER ATTACK'
                      : alert.type === 'conquest'
                        ? 'CONQUEST'
                        : alert.type === 'build_complete'
                          ? 'BUILD COMPLETE'
                          : 'ALERT'}
                  </div>
                  <div style={{ fontSize: 10, color: '#e0d8c0' }}>{alert.message}</div>
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
          background: '#0a0804',
          borderBottom: '2px solid rgba(255,180,60,0.25)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 14,
          pointerEvents: 'auto',
          zIndex: 10,
        }}
      >
        <img
          src="/assets/space/ui/hud/BgHudBar.png"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', opacity: 0.7, pointerEvents: 'none' }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <img
          src="/assets/space/ui/logo.webp"
          alt="Gruda Armada"
          style={{
            position: 'relative',
            zIndex: 1,
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

      {/* ── Production Sidebar (left) ───────────── */}
      {!state.gameOver && <ProductionSidebar state={state} renderer={renderer} />}

      {/* ── Void Power Castbar ──────────────────── */}
      {techSt && Object.values(VOID_POWERS).some((p) => techSt.researchedNodes.has(p.techNodeId)) && (
        <VoidPowerBar state={state} techSt={techSt} onCast={(id, x, y) => renderer.engine.castVoidPower(1 as any, id, x, y)} />
      )}

      {/* ── Hack Overlay (cyber terminal when hacking) ── */}
      {state.activeHacks.length > 0 && <HackOverlay activeHacks={state.activeHacks} />}

      {/* ── Build Queue Bar (below resource header) ── */}
      <div style={{ position: 'absolute', top: 38, left: '50%', transform: 'translateX(-50%)', zIndex: 12, pointerEvents: 'auto' }}>
        <BuildQueueBar state={state} />
      </div>

      {/* ── Inventory Panel (I key) ── */}
      {inventoryOpen && (
        <InventoryPanel
          state={state}
          onClose={() => setInventoryOpen(false)}
          onSelectShip={(id) => {
            setInventoryOpen(false);
            state.selectedIds.clear();
            state.selectedIds.add(id);
            const s = state.ships.get(id);
            if (s) s.selected = true;
          }}
          onSelectPlanet={(id) => {
            setInventoryOpen(false);
            setSelectedPlanetId(id);
            const idx = state.planets.findIndex((p) => p.id === id);
            if (idx >= 0) {
              setPlanetCardIdx(idx);
              setPlanetCardOpen(true);
            }
          }}
        />
      )}

      {/* ── Captain's Journal (L key) — new sci-fi panel ── */}
      {logOpen && <JournalPanel state={state} onClose={() => setLogOpen(false)} />}

      {/* ── Commander Character Panel (C key) ── */}
      {charPanelOpen && (
        <CommanderCharacterPanel
          state={state}
          commander={[...state.commanders.values()].find((c) => c.team === 1 && !c.isDead) ?? null}
          onClose={() => setCharPanelOpen(false)}
        />
      )}

      {/* ── Unified Skill Tree (K key) ── */}
      {skillTreeOpen && (
        <UnifiedSkillTreePanel
          state={state}
          onResearch={(nodeId) => renderer.engine.startResearch(1 as any, nodeId)}
          onClose={() => setSkillTreeOpen(false)}
        />
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

      {/* ── Planet Card (planet click / F1) ────────── */}
      {planetCardOpen &&
        state.planets.length > 0 &&
        (() => {
          const idx = Math.max(0, Math.min(planetCardIdx, state.planets.length - 1));
          const planet = state.planets[idx];
          return planet ? (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 170,
                pointerEvents: 'auto',
              }}
            >
              <PlanetCard
                planet={planet}
                state={state}
                onClose={() => setPlanetCardOpen(false)}
                onNext={() => setPlanetCardIdx((i) => (i + 1) % state.planets.length)}
                onPrev={() => setPlanetCardIdx((i) => (i - 1 + state.planets.length) % state.planets.length)}
                onAction={(pid) => {
                  const p = state.planets.find((pl) => pl.id === pid);
                  if (p && p.owner === 1) {
                    setPlanetCardOpen(false);
                    setSelectedPlanetId(pid);
                    setSurfaceOpen(true);
                  }
                }}
              />
            </div>
          ) : null;
        })()}

      {/* ── Planet Surface View (BUILD from planet card) ── */}
      {surfaceOpen && selectedPlanet && selectedPlanet.owner === 1 && (
        <PlanetSurfaceView
          planet={selectedPlanet}
          state={state}
          onClose={() => setSurfaceOpen(false)}
          onBuild={(planetId, buildingType) => {
            // TODO: wire to engine.buildOnPlanet(planetId, buildingType)
            console.log('[surface] Build', buildingType, 'on planet', planetId);
          }}
          onDeploy={(p) => {
            setSurfaceOpen(false);
            onDeployGround?.(p.planetType, p.name);
          }}
          onDeployRts={(p) => {
            setSurfaceOpen(false);
            onDeployGroundRts?.(p.planetType, p.name);
          }}
        />
      )}

      {/* ── ENTER SHIP popup (flagship selected) ───── */}
      {!interiorOpen && primary && (primary.shipType === 'pyramid_ship' || primary.shipType === 'custom_hero') && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 50,
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 10, color: 'rgba(160,200,255,0.5)', letterSpacing: 2 }}>FLAGSHIP SELECTED · F1</div>
          <Btn label="ENTER SHIP" wide active onClick={() => setInteriorOpen(true)} style={{ minWidth: 200, height: 48, fontSize: 16 }} />
        </div>
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

      {/* ── Bottom Panel — SC2-style: [minimap] [portrait+stats] [command grid] ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'clamp(200px, 28vh, 260px)',
          display: 'flex',
          pointerEvents: 'auto',
          zIndex: 10,
        }}
      >
        {/* Metallic panel background from scifi-gui container */}
        <img
          src="/assets/space/ui/scifi-gui/container-gold.png"
          alt=""
          style={{
            position: 'absolute',
            inset: -6,
            width: 'calc(100% + 12px)',
            height: 'calc(100% + 12px)',
            objectFit: 'fill',
            pointerEvents: 'none',
            filter: 'brightness(0.85)',
          }}
          onError={(e) => {
            // Fallback to dark bg if asset missing
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        {/* ── Region 1: Minimap ───────────────────────── */}
        <div
          style={{
            width: 200,
            flexShrink: 0,
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid rgba(255,200,100,0.15)',
          }}
        >
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
            <Minimap state={state} renderer={renderer} />
          </div>
          {/* Action buttons below minimap */}
          <div style={{ display: 'flex', gap: 3, padding: '0 4px 4px' }}>
            <Btn label="TECH" onClick={() => setTechOpen((t) => !t)} active={techOpen} style={{ flex: 1, height: 26, minWidth: 0 }} />
            <Btn label="CMDR" onClick={() => setCmdOpen((t) => !t)} active={cmdOpen} style={{ flex: 1, height: 26, minWidth: 0 }} />
            <Btn label="LOG" onClick={() => setLogOpen((t) => !t)} active={logOpen} style={{ flex: 1, height: 26, minWidth: 0 }} />
          </div>
        </div>

        {/* ── Region 2: Portrait + Unit Stats ─────────── */}
        <div
          style={{
            width: 'clamp(340px, 30vw, 480px)',
            flexShrink: 0,
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            borderRight: '1px solid rgba(255,200,100,0.12)',
          }}
        >
          {/* Portrait (left half) — scifi-gui character frame */}
          <div
            style={{
              width: 170,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              borderRight: '1px solid rgba(255,200,100,0.08)',
              padding: 4,
            }}
          >
            {primary && def ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {/* Metallic character frame from scifi-gui pack */}
                <img
                  src="/assets/space/ui/scifi-gui/avatar-gold.png"
                  alt=""
                  style={{
                    position: 'absolute',
                    inset: -4,
                    width: 'calc(100% + 8px)',
                    height: 'calc(100% + 8px)',
                    objectFit: 'fill',
                    pointerEvents: 'none',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {/* Ship preview image */}
                <div
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: 8,
                    width: '42%',
                    height: 'calc(100% - 16px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderRadius: 4,
                  }}
                >
                  <img
                    src={SHIP_PREVIEW[primary.shipType] ?? ''}
                    alt={def.displayName}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      imageRendering: 'auto',
                      filter: 'drop-shadow(0 0 8px rgba(255,180,0,0.3))',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                {/* Ship name + HP/Shield bars (right area) */}
                <div
                  style={{
                    position: 'absolute',
                    left: '48%',
                    top: 10,
                    right: 10,
                    bottom: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 3,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#fff',
                      letterSpacing: 0.5,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textShadow: '0 0 6px rgba(255,180,0,0.3)',
                    }}
                  >
                    {def.displayName}
                  </div>
                  {/* HP bar — uses asset-backed Bar component */}
                  <Bar
                    value={primary.hp}
                    max={primary.maxHp}
                    color={primary.hp / primary.maxHp > 0.5 ? '#44ee44' : primary.hp / primary.maxHp > 0.25 ? '#eebb00' : '#ee4444'}
                    height={7}
                    label={`${primary.hp}/${primary.maxHp}`}
                  />
                  {/* Shield bar */}
                  {primary.maxShield > 0 && <Bar value={primary.shield} max={primary.maxShield} color="#44ccff" height={5} />}
                  {/* Class + rank stars */}
                  <div style={{ fontSize: 8, color: 'rgba(200,180,120,0.6)', display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ textTransform: 'uppercase' }}>{def.class.replace(/_/g, ' ')}</span>
                    {primary.rank > 0 && <span style={{ color: '#ffcc00' }}>{'★'.repeat(primary.rank)}</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ opacity: 0.15, fontSize: 10, color: 'rgba(200,180,120,0.5)', textAlign: 'center', lineHeight: 1.8 }}>
                No unit
                <br />
                selected
              </div>
            )}
          </div>
          {/* Stats (right half) */}
          <div
            style={{
              flex: 1,
              padding: '8px 10px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {selectedShips.length === 0 ? (
              <div style={{ opacity: 0.2, fontSize: 10, marginTop: 40, textAlign: 'center', lineHeight: 1.8, color: '#8ab' }}>
                No units selected
                <br />
                <span style={{ fontSize: 9 }}>Left-drag to box-select</span>
              </div>
            ) : selectedShips.length === 1 && primary && def ? (
              <SingleUnitInfo ship={primary} def={def} />
            ) : (
              <MultiUnitInfo
                ships={selectedShips}
                focusedGroupIdx={focusedGroupIdx}
                renderer={renderer}
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
                  setFocusedGroupIdx(0);
                }}
              />
            )}
          </div>
        </div>

        {/* ── Region 3: Sci-Fi Command Card + Fleet Bar ── */}
        <div
          style={{
            flex: 1,
            minWidth: 200,
            position: 'relative',
            zIndex: 1,
            padding: '4px 8px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* Fleet Bar — commander + 12 ships */}
          <FleetBar state={state} />

          {/* Command Card — sci-fi bar with 4 commands + 4 skills + stop */}
          {primary ? (
            <SciFiCommandCard
              ship={primary}
              onCommand={(cmd) => {
                if (cmd === 'attack') {
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
                } else if (cmd === 'move') {
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
                } else if (cmd === 'patrol') {
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
                } else if (cmd === 'hold') {
                  for (const id of state.selectedIds) {
                    const s = state.ships.get(id);
                    if (s) s.holdPosition = !s.holdPosition;
                  }
                } else if (cmd === 'stop') {
                  for (const id of state.selectedIds) {
                    const s = state.ships.get(id);
                    if (s) {
                      s.moveTarget = null;
                      s.targetId = null;
                      s.holdPosition = false;
                    }
                  }
                } else if (cmd.startsWith('ability_')) {
                  // Simulate the ability hotkey press so the engine handles it
                  const idx = parseInt(cmd.split('_')[1]);
                  if (!isNaN(idx) && primary.abilities[idx]) {
                    const key = primary.abilities[idx].ability.key;
                    window.dispatchEvent(new KeyboardEvent('keydown', { key: key.toLowerCase() }));
                  }
                }
              }}
            />
          ) : selectedStation ? (
            <BuildPanel station={selectedStation} renderer={renderer} res={res} />
          ) : selectedPlanet ? (
            <PlanetInfoPanel planet={selectedPlanet} state={state} renderer={renderer} />
          ) : upg ? (
            <UpgradePanel upg={upg} res={res} renderer={renderer} />
          ) : (
            <div style={{ opacity: 0.12, fontSize: 10, color: '#8ab', textAlign: 'center', marginTop: 40 }}>
              Select a unit, station, or planet
            </div>
          )}
        </div>

        {/* ── Region 4: Menu Button Bar (right strip) ── */}
        <div style={{ flexShrink: 0, zIndex: 1, display: 'flex', alignItems: 'flex-start', paddingTop: 4 }}>
          <MenuButtonBar
            onAction={(id) => {
              if (id === 'tech') setSkillTreeOpen((o) => !o);
              else if (id === 'commander') setCharPanelOpen((o) => !o);
              else if (id === 'log') setLogOpen((o) => !o);
              else if (id === 'inventory') setInventoryOpen((o) => !o);
              else if (id === 'starmap') onToggleStarMap?.();
              else if (id === 'checklist') onToggleStarMap?.();
              else if (id === 'save') console.log('[menu] Manual save');
              else if (id === 'mail') console.log('[menu] AI Chat — coming soon');
              else if (id === 'databook') console.log('[menu] Codex — coming soon');
            }}
          />
        </div>
      </div>
    </div>
  );
}
