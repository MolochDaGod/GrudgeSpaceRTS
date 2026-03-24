// space-planet-ui.tsx — Minimap and planet info panel
import React, { useRef, useCallback, useEffect } from 'react';
import {
  TEAM_COLORS,
  CAPTURE_TIME,
  PLANET_TYPE_DATA,
  POI_COLORS,
  type SpaceRenderer,
  type SpaceGameState,
  type Planet,
  SmallPanel,
  Btn,
  Bar,
} from './space-ui-shared';

function Minimap({ state, renderer }: { state: SpaceGameState; renderer: SpaceRenderer }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const toWorld = useCallback(
    (clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      // Account for CSS scaling: the canvas buffer may differ from its CSS size
      // (e.g. on HiDPI displays or when the container rescales it)
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const px = (clientX - rect.left) * scaleX;
      const py = (clientY - rect.top) * scaleY;
      const mapW = renderer.engine.mapW;
      const mapH = renderer.engine.mapH;
      return {
        x: (px / canvas.width) * mapW - mapW / 2,
        y: (py / canvas.height) * mapH - mapH / 2,
      };
    },
    [renderer],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { x, y } = toWorld(e.clientX, e.clientY, canvas);
      if (e.button === 0) {
        // LMB: jump camera to world position
        renderer.controls.cameraState.x = x;
        renderer.controls.cameraState.y = y;
      } else if (e.button === 2) {
        // RMB: issue move command for selected units
        for (const id of state.selectedIds) {
          const ship = state.ships.get(id);
          if (ship && !ship.dead && ship.team === 1) {
            ship.moveTarget = { x, y, z: 0 };
            ship.targetId = null;
            ship.holdPosition = false;
          }
        }
      }
    },
    [state, renderer, toWorld],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const mapW = renderer.engine.mapW; // dynamic — 8000 for 1v1, 20000 for 2v2/ffa4
    const mapH = renderer.engine.mapH;
    const scale = (v: number, max: number, dim: number) => ((v + max / 2) / max) * dim;

    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, w, h);

    // Planets
    for (const p of state.planets) {
      const px = scale(p.x, mapW, w);
      const py = scale(p.y, mapH, h);
      ctx.beginPath();
      ctx.arc(px, py, Math.max(3, p.radius * 0.03), 0, Math.PI * 2);
      ctx.fillStyle = `#${p.color.toString(16).padStart(6, '0')}`;
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Ships (hide enemies outside player fog)
    for (const [, ship] of state.ships) {
      if (ship.dead) continue;
      if (ship.team !== 1 && renderer.engine.fogState(1, ship.x, ship.y) !== 2) continue;
      const sx = scale(ship.x, mapW, w);
      const sy = scale(ship.y, mapH, h);
      // Larger dots on minimap so ships are actually visible
      const sz =
        ship.shipClass === 'dreadnought'
          ? 5
          : ship.shipClass === 'battleship'
            ? 4
            : ship.shipClass === 'cruiser' || ship.shipClass === 'light_cruiser'
              ? 3.5
              : ship.shipClass === 'worker'
                ? 1.5
                : 2.5;
      const tc = TEAM_COLORS[ship.team];
      ctx.fillStyle = ship.selected ? '#ffffff' : tc ? `#${tc.toString(16).padStart(6, '0')}` : '#44ff44';
      // Triangle for player ships, square for enemies — easier to read
      if (ship.team === 1) {
        ctx.beginPath();
        ctx.moveTo(sx, sy - sz);
        ctx.lineTo(sx + sz * 0.7, sy + sz * 0.5);
        ctx.lineTo(sx - sz * 0.7, sy + sz * 0.5);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
      }
    }

    // Stations (hide enemies outside player fog)
    for (const [, st] of state.stations) {
      if (st.dead) continue;
      if (st.team !== 1 && renderer.engine.fogState(1, st.x, st.y) !== 2) continue;
      const sx = scale(st.x, mapW, w),
        sy = scale(st.y, mapH, h);
      const stc = TEAM_COLORS[st.team];
      ctx.fillStyle = stc ? `#${stc.toString(16).padStart(6, '0')}` : '#4488ff';
      ctx.fillRect(sx - 2, sy - 2, 4, 1);
      ctx.fillRect(sx - 1, sy - 3, 2, 5); // cross
    }

    // Planet owner rings
    for (const p of state.planets) {
      if (p.owner === 0) continue;
      const px = scale(p.x, mapW, w),
        py = scale(p.y, mapH, h);
      const oc = TEAM_COLORS[p.owner];
      ctx.strokeStyle = oc ? `#${oc.toString(16).padStart(6, '0')}` : '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(4, p.radius * 0.04), 0, Math.PI * 2);
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Fog of War overlay (team-1 perspective)
    const fogGrid = state.fog.get(1);
    if (fogGrid) {
      const cellW = (fogGrid.cellSize / mapW) * w;
      const cellH = (fogGrid.cellSize / mapH) * h;
      for (let r = 0; r < fogGrid.rows; r++) {
        for (let c = 0; c < fogGrid.cols; c++) {
          const v = fogGrid.data[r * fogGrid.cols + c];
          if (v === 2) continue; // visible — no overlay
          ctx.fillStyle = v === 0 ? 'rgba(4,8,16,0.92)' : 'rgba(4,8,16,0.55)';
          const fx = ((c * fogGrid.cellSize) / mapW) * w;
          const fy = ((r * fogGrid.cellSize) / mapH) * h;
          ctx.fillRect(fx, fy, Math.ceil(cellW), Math.ceil(cellH));
        }
      }
    }

    // POI icons (discovered only, drawn above fog)
    for (const poi of state.pois) {
      if (!poi.discovered) continue;
      const px = scale(poi.x, mapW, w);
      const py = scale(poi.y, mapH, h);
      const sz = poi.claimedByTeam !== null ? 2.5 : 4;
      ctx.fillStyle = POI_COLORS[poi.type];
      ctx.globalAlpha = poi.claimedByTeam !== null ? 0.4 : 1;
      ctx.beginPath();
      ctx.moveTo(px, py - sz);
      ctx.lineTo(px + sz * 0.7, py);
      ctx.lineTo(px, py + sz);
      ctx.lineTo(px - sz * 0.7, py);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Camera viewport indicator
    const cam = renderer.controls.cameraState;
    const camX = scale(cam.x, mapW, w);
    const camY = scale(cam.y, mapH, h);
    // Viewport width in map units depends on zoom angle
    const visGameUnits = cam.zoom * 1.5; // approximate visible game units at current zoom
    const vw = (visGameUnits / mapW) * w;
    const vh = (visGameUnits / mapH) * h;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 2]);
    ctx.strokeRect(camX - vw / 2, camY - vh / 2, vw, vh);
    ctx.setLineDash([]);

    // Border
    ctx.strokeStyle = '#1a3050';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, h);

    // Label: LMB = camera, RMB = move
    ctx.fillStyle = 'rgba(160,200,255,0.35)';
    ctx.font = '7px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('LMB: camera  RMB: move', 3, h - 3);
  });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas
        ref={canvasRef}
        width={192}
        height={150}
        style={{
          imageRendering: 'pixelated',
          cursor: 'crosshair',
          pointerEvents: 'auto',
          display: 'block',
          // Explicit CSS size avoids browser-side canvas rescaling that
          // would misalign click coordinates with drawn pixels.
          width: 192,
          height: 150,
        }}
        onMouseDown={handleMouseDown}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}

// ── Planet Info Panel (when planet selected) ─────────────────────

function PlanetInfoPanel({ planet, state, renderer }: { planet: Planet; state: SpaceGameState; renderer: SpaceRenderer }) {
  const td = PLANET_TYPE_DATA[planet.planetType];
  const ownerColor = TEAM_COLORS[planet.owner] ?? td.baseColor;
  const ownerLabel = planet.owner === 0 ? 'Neutral' : planet.owner === 1 ? 'Player' : `Enemy Team ${planet.owner}`;
  const capPct = Math.max(0, Math.min(100, Math.round((planet.captureProgress / CAPTURE_TIME) * 100)));
  const station = planet.stationId ? state.stations.get(planet.stationId) : null;
  let turretCount = 0;
  for (const [, turret] of state.planetTurrets) {
    if (!turret.dead && turret.planetId === planet.id) turretCount++;
  }
  const m = td.resourceMult;
  const yieldCredits = Math.round(planet.resourceYield.credits * m.credits);
  const yieldEnergy = Math.round(planet.resourceYield.energy * m.energy);
  const yieldMinerals = Math.round(planet.resourceYield.minerals * m.minerals);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8ac', letterSpacing: 1 }}>PLANET FOCUS</div>
        <div
          style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#0d182a', border: '1px solid #1a3050', color: '#6a8a9a' }}
        >
          ID {planet.id}
        </div>
      </div>

      <SmallPanel title={planet.name} style={{ width: '100%' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 8,
              background: `radial-gradient(circle at 30% 30%, #ffffff22, #${td.baseColor.toString(16).padStart(6, '0')}88)`,
              border: `1px solid #${td.baseColor.toString(16).padStart(6, '0')}`,
              boxShadow: `0 0 14px #${td.baseColor.toString(16).padStart(6, '0')}55`,
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{td.label}</div>
            <div style={{ fontSize: 9, color: '#8ac', marginTop: 2 }}>Tech Focus: {td.techFocus}</div>
            <div
              style={{
                marginTop: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 9,
                color: `#${ownerColor.toString(16).padStart(6, '0')}`,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: `#${ownerColor.toString(16).padStart(6, '0')}`,
                  display: 'inline-block',
                }}
              />
              {ownerLabel}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
          <div style={{ padding: '6px 8px', border: '1px solid #1a3050', borderRadius: 6, background: 'rgba(6,14,28,0.7)' }}>
            <div style={{ fontSize: 8, color: '#6a8a9a' }}>RESOURCE YIELD</div>
            <div style={{ fontSize: 10, color: '#fc4', marginTop: 2 }}>+{yieldCredits} credits</div>
            <div style={{ fontSize: 10, color: '#4df' }}>+{yieldEnergy} energy</div>
            <div style={{ fontSize: 10, color: '#4f8' }}>+{yieldMinerals} minerals</div>
          </div>
          <div style={{ padding: '6px 8px', border: '1px solid #1a3050', borderRadius: 6, background: 'rgba(6,14,28,0.7)' }}>
            <div style={{ fontSize: 8, color: '#6a8a9a' }}>ORBITAL STATUS</div>
            <div style={{ fontSize: 10, color: station ? '#4f8' : '#f88', marginTop: 2 }}>
              Station: {station && !station.dead ? 'Online' : 'None'}
            </div>
            <div style={{ fontSize: 10, color: '#8ac' }}>Defense Turrets: {turretCount}</div>
            <div style={{ fontSize: 10, color: '#8ac' }}>Capture Radius: {Math.round(planet.captureRadius)}</div>
          </div>
        </div>

        {planet.captureProgress > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#8ac', marginBottom: 2 }}>
              <span>Capture Progress</span>
              <span style={{ color: '#fc4' }}>{capPct}%</span>
            </div>
            <Bar
              value={planet.captureProgress}
              max={CAPTURE_TIME}
              color={
                planet.captureTeam !== 0 ? `#${(TEAM_COLORS[planet.captureTeam] ?? 0xffff44).toString(16).padStart(6, '0')}` : '#ffdd44'
              }
              height={8}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 6 }}>
          <Btn
            label="CENTER CAMERA"
            onClick={() => {
              renderer.controls.cameraState.x = planet.x;
              renderer.controls.cameraState.y = planet.y;
            }}
            style={{ flex: 1, minWidth: 0 }}
          />
          {station && !station.dead && station.team === 1 && (
            <Btn
              label="SELECT STATION"
              active
              onClick={() => {
                for (const [, st] of state.stations) st.selected = false;
                station.selected = true;
              }}
              style={{ flex: 1, minWidth: 0 }}
            />
          )}
        </div>
      </SmallPanel>
    </div>
  );
}
// ── Build Panel (when station selected) ─────────────────────────

export { Minimap, PlanetInfoPanel };
