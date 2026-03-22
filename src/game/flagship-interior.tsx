/**
 * flagship-interior.tsx — 2D pixel-art flagship interior overlay
 *
 * When the player clicks "Enter Ship" on their flagship, this overlay
 * renders a spaceliner-tileset interior with clickable rooms:
 *   Bridge     → Commander + Star Map
 *   Armory     → Tech Tree + Upgrades
 *   Hangar Bay → Ship Build Queue
 *   Engine Room → Resource Overview + Worker Status
 */

import { useState, useCallback } from 'react';

// ── Asset paths ───────────────────────────────────────────────
const SL = '/assets/space/ui/spaceliner';
const BG      = `${SL}/3 Backgrounds/Background.png`;
const MONITOR = `${SL}/4 Objects/2 Monitors/1.png`;
const CHAIR   = `${SL}/4 Objects/1 Furniture/1.png`;
const BED     = `${SL}/4 Objects/1 Furniture/5.png`;
const DESK    = `${SL}/4 Objects/1 Furniture/3.png`;
const BOX1    = `${SL}/4 Objects/3 Boxes/1.png`;
const BOX2    = `${SL}/4 Objects/3 Boxes/2.png`;
const PLANT   = `${SL}/4 Objects/4 Decor/1.png`;
const PIPE    = `${SL}/4 Objects/4 Decor/5.png`;
const DOOR    = `${SL}/5 Animated Objects/Door.png`;
const TILE_WALL  = `${SL}/1 Tileset/Tile_01.png`;
const TILE_FLOOR = `${SL}/1 Tileset/Tile_05.png`;
const BACK_PANEL = `${SL}/2 BackTiles/BackTile_01.png`;

type Room = 'bridge' | 'armory' | 'hangar' | 'engine';

interface FlagshipInteriorProps {
  onClose: () => void;
  onOpenTech: () => void;
  onOpenCommander: () => void;
  onOpenBuild: () => void;
  onOpenUpgrades: () => void;
  onOpenStarMap: () => void;
  commanderPortrait?: string;
  commanderName?: string;
  shipName: string;
}

export function FlagshipInterior({
  onClose, onOpenTech, onOpenCommander, onOpenBuild, onOpenUpgrades, onOpenStarMap,
  commanderPortrait, commanderName, shipName,
}: FlagshipInteriorProps) {
  const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null);

  const handleRoomClick = useCallback((room: Room) => {
    switch (room) {
      case 'bridge':   onOpenCommander(); break;
      case 'armory':   onOpenTech(); break;
      case 'hangar':   onOpenBuild(); break;
      case 'engine':   onOpenUpgrades(); break;
    }
  }, [onOpenCommander, onOpenTech, onOpenBuild, onOpenUpgrades]);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 150, pointerEvents: 'auto',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)',
      fontFamily: "'Segoe UI', monospace",
    }}>
      {/* Ship exterior shell */}
      <div style={{
        position: 'relative', width: 900, height: 500,
        backgroundImage: `url(${BG})`, backgroundSize: 'cover',
        borderRadius: 16, overflow: 'hidden',
        border: '3px solid rgba(40,180,160,0.5)',
        boxShadow: '0 0 60px rgba(40,180,160,0.3), inset 0 0 40px rgba(0,0,0,0.5)',
      }}>
        {/* Ship name header */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 36,
          background: 'rgba(4,12,20,0.9)', borderBottom: '2px solid rgba(40,180,160,0.4)',
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
        }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#28b4a0', letterSpacing: 3 }}>
            {shipName.toUpperCase()}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(160,200,255,0.4)' }}>FLAGSHIP INTERIOR</span>
          {commanderName && (
            <span style={{ fontSize: 10, color: '#fc4', marginLeft: 'auto' }}>
              Commander: {commanderName}
            </span>
          )}
          <img src='/assets/space/ui/hud/CloseBtn.png' alt='Close' onClick={onClose}
            style={{ width: 24, height: 24, cursor: 'pointer', imageRendering: 'pixelated',
              filter: 'brightness(0.8)', marginLeft: commanderName ? 0 : 'auto' }}
            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.3)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(0.8)')}
          />
        </div>

        {/* ── Room Grid ─────────────────────────────────── */}
        <div style={{
          position: 'absolute', top: 36, left: 0, right: 0, bottom: 0,
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr', gap: 2,
        }}>
          {/* Bridge (top-left) */}
          <RoomPanel
            room="bridge" label="BRIDGE" sublabel="Commander · Star Map · Overview"
            hovered={hoveredRoom === 'bridge'}
            onHover={() => setHoveredRoom('bridge')}
            onLeave={() => setHoveredRoom(null)}
            onClick={() => handleRoomClick('bridge')}
            color="#28b4a0"
          >
            {commanderPortrait && (
              <img src={commanderPortrait} alt="Commander"
                style={{ width: 48, height: 48, borderRadius: 6, border: '2px solid #28b4a0', objectFit: 'cover' }}
                onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
              />
            )}
            <img src={MONITOR} alt="" style={objStyle} />
            <img src={CHAIR} alt="" style={{ ...objStyle, width: 40 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <RoomBtn label="Commander" icon="👤" onClick={e => { e.stopPropagation(); onOpenCommander(); }} />
              <RoomBtn label="Star Map" icon="🗺️" onClick={e => { e.stopPropagation(); onOpenStarMap(); }} />
            </div>
          </RoomPanel>

          {/* Hangar (top-right) */}
          <RoomPanel
            room="hangar" label="HANGAR BAY" sublabel="Ship Production · Build Queue"
            hovered={hoveredRoom === 'hangar'}
            onHover={() => setHoveredRoom('hangar')}
            onLeave={() => setHoveredRoom(null)}
            onClick={() => handleRoomClick('hangar')}
            color="#4488ff"
          >
            <img src={BOX1} alt="" style={objStyle} />
            <img src={BOX2} alt="" style={{ ...objStyle, width: 36 }} />
            <img src={DOOR} alt="" style={{ ...objStyle, width: 28, imageRendering: 'pixelated' }} />
            <RoomBtn label="Build Ships" icon="🔧" onClick={e => { e.stopPropagation(); onOpenBuild(); }} />
          </RoomPanel>

          {/* Armory (bottom-left) */}
          <RoomPanel
            room="armory" label="ARMORY" sublabel="Tech Tree · Research · Upgrades"
            hovered={hoveredRoom === 'armory'}
            onHover={() => setHoveredRoom('armory')}
            onLeave={() => setHoveredRoom(null)}
            onClick={() => handleRoomClick('armory')}
            color="#ff8844"
          >
            <img src={PIPE} alt="" style={objStyle} />
            <img src={DESK} alt="" style={{ ...objStyle, width: 48 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <RoomBtn label="Tech Tree" icon="🔬" onClick={e => { e.stopPropagation(); onOpenTech(); }} />
              <RoomBtn label="Upgrades" icon="⚡" onClick={e => { e.stopPropagation(); onOpenUpgrades(); }} />
            </div>
          </RoomPanel>

          {/* Engine Room (bottom-right) */}
          <RoomPanel
            room="engine" label="ENGINE ROOM" sublabel="Resources · Workers · Power"
            hovered={hoveredRoom === 'engine'}
            onHover={() => setHoveredRoom('engine')}
            onLeave={() => setHoveredRoom(null)}
            onClick={() => handleRoomClick('engine')}
            color="#44ee88"
          >
            <img src={PLANT} alt="" style={{ ...objStyle, width: 28 }} />
            <img src={BED} alt="" style={{ ...objStyle, width: 48 }} />
            <RoomBtn label="Upgrades" icon="⚙️" onClick={e => { e.stopPropagation(); onOpenUpgrades(); }} />
          </RoomPanel>
        </div>

        {/* Quick-action bar at bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
          background: 'rgba(4,12,20,0.92)', borderTop: '1px solid rgba(40,180,160,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 16px',
        }}>
          <QuickBtn label="Star Map [M]" onClick={onOpenStarMap} />
          <QuickBtn label="Tech Tree" onClick={onOpenTech} />
          <QuickBtn label="Commander" onClick={onOpenCommander} />
          <QuickBtn label="Build Ships" onClick={onOpenBuild} />
          <QuickBtn label="Upgrades" onClick={onOpenUpgrades} />
          <div style={{ flex: 1 }} />
          <QuickBtn label="Exit Ship" onClick={onClose} color="#ff6644" />
        </div>
      </div>
    </div>
  );
}

// ── Room Panel ────────────────────────────────────────────────
function RoomPanel({ room, label, sublabel, hovered, onHover, onLeave, onClick, color, children }: {
  room: Room; label: string; sublabel: string;
  hovered: boolean; onHover: () => void; onLeave: () => void; onClick: () => void;
  color: string; children: React.ReactNode;
}) {
  return (
    <div
      onMouseEnter={onHover} onMouseLeave={onLeave} onClick={onClick}
      style={{
        position: 'relative', cursor: 'pointer', overflow: 'hidden',
        backgroundImage: `url(${BACK_PANEL})`, backgroundSize: '64px 64px',
        border: `2px solid ${hovered ? color : 'rgba(40,60,80,0.5)'}`,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: hovered ? `inset 0 0 30px ${color}33, 0 0 12px ${color}44` : 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 6, padding: 16,
      }}
    >
      {/* Room label */}
      <div style={{ fontSize: 13, fontWeight: 800, color, letterSpacing: 2 }}>{label}</div>
      <div style={{ fontSize: 9, color: 'rgba(160,200,255,0.4)', letterSpacing: 1, marginBottom: 6 }}>{sublabel}</div>
      {/* Room objects */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {children}
      </div>
      {/* Floor tile strip */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 16,
        backgroundImage: `url(${TILE_FLOOR})`, backgroundSize: '32px 32px',
        backgroundRepeat: 'repeat-x', opacity: 0.5,
      }} />
    </div>
  );
}

// ── Room Button ───────────────────────────────────────────────
function RoomBtn({ label, icon, onClick }: { label: string; icon: string; onClick: (e: React.MouseEvent) => void }) {
  return (
    <div onClick={onClick} style={{
      padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
      background: 'rgba(8,18,36,0.85)', border: '1px solid rgba(40,180,160,0.4)',
      fontSize: 9, fontWeight: 700, color: '#cde', display: 'flex', alignItems: 'center', gap: 4,
      transition: 'background 0.15s, border-color 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(40,180,160,0.2)'; e.currentTarget.style.borderColor = '#28b4a0'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(8,18,36,0.85)'; e.currentTarget.style.borderColor = 'rgba(40,180,160,0.4)'; }}
    >
      <span>{icon}</span> {label}
    </div>
  );
}

// ── Quick Action Button ───────────────────────────────────────
function QuickBtn({ label, onClick, color }: { label: string; onClick: () => void; color?: string }) {
  return (
    <div onClick={onClick} style={{
      position: 'relative', cursor: 'pointer', display: 'inline-block',
    }}>
      <img src='/assets/space/ui/hud/Normal_Btn.png' alt=''
        style={{ width: 100, height: 28, display: 'block' }} />
      <span style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 700, color: color ?? '#cde', letterSpacing: 0.5,
      }}>{label}</span>
    </div>
  );
}

const objStyle: React.CSSProperties = {
  width: 32, height: 32, imageRendering: 'pixelated' as any, objectFit: 'contain',
};
