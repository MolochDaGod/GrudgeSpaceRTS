/**
 * planet-surface.tsx — Dual-mode planet view for Campaign.
 *
 * Same scene, two camera angles:
 *   ORBITAL — Strategic overhead. 6 building slots in a grid. Build, upgrade, manage.
 *   BASE    — Ground-level immersive. Walk your base, interact with structures, see 3D models.
 *
 * Both modes share the same PlanetSurface state. Toggle with the camera button.
 * The scene background uses spaceliner tileset for ORBITAL, KayKit ground for BASE.
 */

import { useState } from 'react';
import type { Planet, PlanetBuilding, PlanetBuildingType, PlanetSurface, SpaceGameState } from './space-types';
import { Panel, Btn, Bar, SmallPanel, Frame } from './ui-lib';
import {
  PLANET_BUILDING_DEFS,
  PLANET_LEVEL_XP,
  PLANET_LEVEL_YIELD_MULT,
  FACTION_DATA,
  FACTION_RESOURCE_DATA,
  FACTION_TO_RESOURCE,
  BUILDING_CHUNK_INFLUENCE,
  CHUNK_BASE_YIELD,
  BASE_BUILDING_MODELS,
  BUILDING_TO_MODEL,
  PLANET_TYPE_DATA,
  type PlanetBuildingDef,
} from './space-types';

const H = '/assets/space/ui/hud';
const SL = '/assets/space/ui/spaceliner';

type CameraMode = 'orbital' | 'base';

// ── Building slot layout — 6 slots in a 3x2 grid ──────────────
const SLOT_LAYOUT: { type: PlanetBuildingType; gridArea: string }[] = [
  { type: 'station', gridArea: '1 / 1 / 2 / 2' },
  { type: 'refinery', gridArea: '1 / 2 / 2 / 3' },
  { type: 'barracks', gridArea: '1 / 3 / 2 / 4' },
  { type: 'turret_platform', gridArea: '2 / 1 / 3 / 2' },
  { type: 'research_lab', gridArea: '2 / 2 / 3 / 3' },
  { type: 'faction_forge', gridArea: '2 / 3 / 3 / 4' },
];

interface PlanetSurfaceViewProps {
  planet: Planet;
  state: SpaceGameState;
  onClose: () => void;
  onBuild: (planetId: number, buildingType: PlanetBuildingType) => void;
  onDeploy?: (planet: Planet) => void;
}

export function PlanetSurfaceView({ planet, state, onClose, onBuild, onDeploy }: PlanetSurfaceViewProps) {
  const [cameraMode, setCameraMode] = useState<CameraMode>('orbital');
  const [selectedSlot, setSelectedSlot] = useState<PlanetBuildingType | null>(null);
  const surface: PlanetSurface = planet.surface ?? {
    buildings: [],
    factionResource: null,
    factionResourceStockpile: 0,
    factionResourceRate: 0,
  };
  const pLevel = planet.planetLevel ?? 1;
  const pXp = planet.planetXp ?? 0;
  const nextLevelXp = PLANET_LEVEL_XP[pLevel] ?? 9999;
  const ptd = PLANET_TYPE_DATA[planet.planetType];
  const faction = state.campaignProgress?.factionProgress?.faction;
  const factionRes = faction ? FACTION_TO_RESOURCE[faction] : null;
  const factionData = faction ? FACTION_DATA[faction] : null;
  const factionResData = factionRes ? FACTION_RESOURCE_DATA[factionRes] : null;
  const res = state.resources[1];

  // Get building in a slot
  const getBuilding = (type: PlanetBuildingType): PlanetBuilding | undefined => surface.buildings.find((b) => b.type === type);

  // Calculate chunk yield influence from buildings
  const chunkYield = { ...CHUNK_BASE_YIELD };
  let factionChance = 0;
  for (const b of surface.buildings) {
    const inf = BUILDING_CHUNK_INFLUENCE[b.type];
    if (!inf) continue;
    const mult = 1 + (b.level - 1) * 0.25; // level scaling: L1=1x, L2=1.25x, L3=1.5x
    chunkYield.credits = Math.round(chunkYield.credits * inf.creditsMult * mult);
    chunkYield.energy = Math.round(chunkYield.energy * inf.energyMult * mult);
    chunkYield.minerals = Math.round(chunkYield.minerals * inf.mineralsMult * mult);
    factionChance = Math.min(1, factionChance + inf.factionResourceChance * mult);
  }

  const selectedDef = selectedSlot ? PLANET_BUILDING_DEFS[selectedSlot] : null;
  const selectedBuilding = selectedSlot ? getBuilding(selectedSlot) : null;
  const canBuild =
    selectedDef &&
    !selectedBuilding &&
    pLevel >= selectedDef.minPlanetLevel &&
    res &&
    res.credits >= selectedDef.cost.credits &&
    res.energy >= selectedDef.cost.energy &&
    res.minerals >= selectedDef.cost.minerals;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 160,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.92)',
        fontFamily: "'Segoe UI', monospace",
      }}
    >
      <Panel
        title={`${planet.name} · ${cameraMode === 'orbital' ? 'ORBITAL VIEW' : 'BASE VIEW'}`}
        onClose={onClose}
        width={860}
        style={{
          maxWidth: '97vw',
          maxHeight: '94vh',
        }}
      >
        {/* Camera mode toggle + header */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, marginTop: 4 }}>
          <Btn label="🛰️ ORBITAL" active={cameraMode === 'orbital'} onClick={() => setCameraMode('orbital')} style={{ height: 28 }} />
          <Btn label="🏗️ BASE" active={cameraMode === 'base'} onClick={() => setCameraMode('base')} style={{ height: 28 }} />
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 9, color: 'rgba(160,200,255,0.35)', alignSelf: 'center' }}>
            {cameraMode === 'orbital' ? 'Strategic overview — build & manage' : 'Ground level — explore your base'}
          </div>
        </div>

        {/* Header: planet info + level bar */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              flexShrink: 0,
              background: `#${ptd.baseColor.toString(16).padStart(6, '0')}33`,
              border: `2px solid #${ptd.baseColor.toString(16).padStart(6, '0')}66`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
            }}
          >
            {planet.planetType === 'volcanic'
              ? '🌋'
              : planet.planetType === 'oceanic'
                ? '🌊'
                : planet.planetType === 'crystalline'
                  ? '💎'
                  : planet.planetType === 'gas_giant'
                    ? '🪐'
                    : planet.planetType === 'frozen'
                      ? '❄️'
                      : '🏜️'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{planet.name}</span>
              <span
                style={{
                  fontSize: 9,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(68,136,255,0.15)',
                  border: '1px solid rgba(68,136,255,0.3)',
                  color: '#4488ff',
                  fontWeight: 700,
                }}
              >
                LEVEL {pLevel}
              </span>
              <span style={{ fontSize: 9, color: 'rgba(160,200,255,0.4)' }}>
                {ptd.label} · {ptd.techFocus}
              </span>
            </div>
            <Bar
              value={pXp}
              max={nextLevelXp}
              color={`#${ptd.baseColor.toString(16).padStart(6, '0')}`}
              height={10}
              label={`${pXp} / ${nextLevelXp} XP`}
            />
          </div>
        </div>

        {/* Main content: mode-dependent */}
        <div style={{ display: 'flex', gap: 14 }}>
          {/* ── BASE MODE: Ground-level 3D preview with interactive building list ── */}
          {cameraMode === 'base' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Scene viewport — uses spaceliner background + KayKit terrain as ground */}
              <div
                style={{
                  position: 'relative',
                  borderRadius: 8,
                  overflow: 'hidden',
                  height: 280,
                  background: '#060c18',
                  border: '1px solid rgba(40,180,160,0.2)',
                }}
              >
                <img
                  src={`${SL}/3 Backgrounds/Background.png`}
                  alt=""
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.4,
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {/* Ground terrain row */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 80,
                    background: 'linear-gradient(180deg, transparent, rgba(40,30,20,0.8))',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    gap: 4,
                    padding: '0 12px 6px',
                  }}
                >
                  {surface.buildings.map((b, i) => {
                    const modelKey = BUILDING_TO_MODEL[b.type];
                    const levelKey = b.level >= 3 ? 'level3' : b.level >= 2 ? 'level2' : 'level1';
                    const model = modelKey ? BASE_BUILDING_MODELS[modelKey[levelKey]] : null;
                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedSlot(b.type)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 2,
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: 6,
                          background: selectedSlot === b.type ? 'rgba(68,136,255,0.2)' : 'rgba(0,0,0,0.3)',
                          border: `1px solid ${selectedSlot === b.type ? '#4488ff' : 'transparent'}`,
                        }}
                      >
                        <span style={{ fontSize: 22 }}>{PLANET_BUILDING_DEFS[b.type].icon}</span>
                        <span style={{ fontSize: 8, color: '#44ee88', fontWeight: 700 }}>
                          {PLANET_BUILDING_DEFS[b.type].label} L{b.level}
                        </span>
                      </div>
                    );
                  })}
                  {surface.buildings.length === 0 && (
                    <div style={{ fontSize: 11, color: 'rgba(160,200,255,0.3)', paddingBottom: 12 }}>
                      No buildings yet. Switch to Orbital view to build.
                    </div>
                  )}
                </div>
                {/* Floating chunks (homeworld) */}
                {planet.isStartingPlanet && (
                  <div style={{ position: 'absolute', top: 12, right: 16, display: 'flex', gap: 8 }}>
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: 24 + i * 6,
                          height: 24 + i * 6,
                          borderRadius: '40%',
                          background: `radial-gradient(circle, #886644, #443322)`,
                          border: '1px solid #66554433',
                          opacity: 0.6 + i * 0.1,
                          animation: `float${i} ${3 + i}s ease-in-out infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}
                {/* Camera label */}
                <div style={{ position: 'absolute', top: 8, left: 12, fontSize: 9, color: 'rgba(160,200,255,0.4)', letterSpacing: 2 }}>
                  GROUND LEVEL · BASE VIEW
                </div>
              </div>
              {/* Base stats bar below viewport */}
              <div style={{ display: 'flex', gap: 10, fontSize: 10 }}>
                <SmallPanel>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#fc4' }}>💰 {planet.resourceYield.credits}c/s</span>
                    <span style={{ color: '#4df' }}>⚡ {planet.resourceYield.energy}e/s</span>
                    <span style={{ color: '#4f8' }}>⛏️ {planet.resourceYield.minerals}m/s</span>
                    <span style={{ color: '#8ac' }}>🏢 {surface.buildings.length}/6 buildings</span>
                  </div>
                </SmallPanel>
              </div>
              {/* CSS keyframes for floating chunks */}
              <style>{`
                @keyframes float1 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
                @keyframes float2 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                @keyframes float3 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
              `}</style>
            </div>
          )}

          {/* ── ORBITAL MODE: Strategic grid ── */}
          {cameraMode === 'orbital' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gridTemplateRows: 'repeat(2, 1fr)',
                gap: 8,
                flex: 1,
              }}
            >
              {SLOT_LAYOUT.map((slot) => {
                const def = PLANET_BUILDING_DEFS[slot.type];
                const building = getBuilding(slot.type);
                const locked = pLevel < def.minPlanetLevel;
                const isForge = slot.type === 'faction_forge';
                const active = selectedSlot === slot.type;
                const borderColor = active
                  ? (factionData?.color ?? '#4488ff')
                  : building
                    ? '#28b4a066'
                    : locked
                      ? '#33333366'
                      : '#1a305066';

                return (
                  <div
                    key={slot.type}
                    onClick={() => setSelectedSlot(slot.type)}
                    style={{
                      gridArea: slot.gridArea,
                      padding: 10,
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: active ? 'rgba(68,136,255,0.08)' : 'rgba(6,14,30,0.7)',
                      border: `2px solid ${borderColor}`,
                      opacity: locked ? 0.4 : 1,
                      transition: 'border-color 0.15s, background 0.15s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      minHeight: 100,
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{def.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: building ? '#44ee88' : locked ? '#555' : '#cde' }}>
                      {def.label}
                    </span>
                    {building ? (
                      <span style={{ fontSize: 9, color: '#44ee88', fontWeight: 700 }}>BUILT · L{building.level}</span>
                    ) : locked ? (
                      <span style={{ fontSize: 8, color: '#666' }}>Requires L{def.minPlanetLevel}</span>
                    ) : (
                      <span style={{ fontSize: 8, color: 'rgba(160,200,255,0.4)' }}>Empty Slot</span>
                    )}
                    {isForge && factionData && (
                      <span style={{ fontSize: 8, color: factionData.color, fontWeight: 700 }}>
                        {factionData.icon} {factionData.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Side panel: selected building info + chunk yields (both modes) */}
          <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Selected building detail */}
            {selectedDef ? (
              <SmallPanel title={selectedDef.label}>
                <div style={{ fontSize: 10, color: 'rgba(200,220,240,0.7)', lineHeight: 1.5, marginBottom: 8 }}>
                  {selectedDef.description}
                </div>
                {!selectedBuilding && (
                  <>
                    <div style={{ display: 'flex', gap: 8, fontSize: 9, color: 'rgba(160,200,255,0.5)', marginBottom: 8 }}>
                      <span style={{ color: '#fc4' }}>{selectedDef.cost.credits}c</span>
                      <span style={{ color: '#4df' }}>{selectedDef.cost.energy}e</span>
                      <span style={{ color: '#4f8' }}>{selectedDef.cost.minerals}m</span>
                      <span>{selectedDef.buildTime}s</span>
                    </div>
                    <Btn
                      label={pLevel < selectedDef.minPlanetLevel ? `NEED L${selectedDef.minPlanetLevel}` : 'BUILD'}
                      wide
                      active={!!canBuild}
                      disabled={!canBuild}
                      onClick={() => canBuild && onBuild(planet.id, selectedSlot!)}
                    />
                  </>
                )}
                {selectedBuilding && (
                  <div style={{ fontSize: 10, color: '#44ee88' }}>
                    Built · Level {selectedBuilding.level}
                    {selectedBuilding.producing && <span style={{ color: '#ffcc00' }}> · Producing</span>}
                  </div>
                )}
              </SmallPanel>
            ) : (
              <SmallPanel title="SELECT A SLOT">
                <div style={{ fontSize: 10, color: 'rgba(160,200,255,0.4)', lineHeight: 1.6 }}>
                  Click a building slot to view details or build.
                </div>
              </SmallPanel>
            )}

            {/* Homeworld chunk yield preview */}
            {planet.isStartingPlanet && (
              <SmallPanel title="CHUNK YIELDS">
                <div style={{ fontSize: 9, color: 'rgba(160,200,255,0.5)', marginBottom: 6 }}>
                  Your buildings influence what homeworld chunks yield when mined:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                    <span style={{ color: '#fc4' }}>Credits</span>
                    <span style={{ color: '#fc4', fontWeight: 700 }}>{chunkYield.credits}/chunk</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                    <span style={{ color: '#4df' }}>Energy</span>
                    <span style={{ color: '#4df', fontWeight: 700 }}>{chunkYield.energy}/chunk</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                    <span style={{ color: '#4f8' }}>Minerals</span>
                    <span style={{ color: '#4f8', fontWeight: 700 }}>{chunkYield.minerals}/chunk</span>
                  </div>
                  {factionResData && factionChance > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 10,
                        marginTop: 4,
                        paddingTop: 4,
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <span style={{ color: factionResData.color }}>
                        {factionResData.icon} {factionResData.label}
                      </span>
                      <span style={{ color: factionResData.color, fontWeight: 700 }}>{Math.round(factionChance * 100)}% chance</span>
                    </div>
                  )}
                </div>
              </SmallPanel>
            )}

            {/* Faction resource stockpile */}
            {factionResData && surface.factionResource && (
              <SmallPanel title={factionResData.label.toUpperCase()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 24 }}>{factionResData.icon}</span>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: factionResData.color }}>
                      {Math.floor(surface.factionResourceStockpile)}
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(160,200,255,0.4)' }}>+{surface.factionResourceRate.toFixed(1)}/min</div>
                  </div>
                </div>
              </SmallPanel>
            )}

            {/* Deploy ground team */}
            {onDeploy && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: 'rgba(255,100,0,0.08)',
                  border: '1px solid rgba(255,100,0,0.3)',
                }}
              >
                <div style={{ fontSize: 9, color: '#ff8822', fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>GROUND OPS</div>
                <div style={{ fontSize: 10, color: 'rgba(200,180,140,0.6)', marginBottom: 8, lineHeight: 1.5 }}>
                  Deploy a ground team for combat missions on the surface.
                </div>
                <Btn label="⚔️ DEPLOY GROUND TEAM" wide active onClick={() => onDeploy(planet)} style={{ height: 36 }} />
              </div>
            )}

            {/* Resource yield from this planet */}
            <SmallPanel title="PLANET OUTPUT">
              <div style={{ display: 'flex', gap: 12, fontSize: 10 }}>
                <span style={{ color: '#fc4' }}>{planet.resourceYield.credits}c/s</span>
                <span style={{ color: '#4df' }}>{planet.resourceYield.energy}e/s</span>
                <span style={{ color: '#4f8' }}>{planet.resourceYield.minerals}m/s</span>
              </div>
              <div style={{ fontSize: 8, color: 'rgba(160,200,255,0.3)', marginTop: 4 }}>
                ×{PLANET_LEVEL_YIELD_MULT[pLevel - 1] ?? 1} from planet level
              </div>
            </SmallPanel>
          </div>
        </div>
      </Panel>
    </div>
  );
}
