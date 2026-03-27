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
import { Btn } from './ui-lib';

// ── Asset paths ───────────────────────────────────────────────
const SL = '/assets/space/ui/spaceliner';
const BG = `${SL}/3 Backgrounds/Background.png`;
// Furniture (only used subset kept)
const CHAIR = `${SL}/4 Objects/1 Furniture/1.png`;
const DESK = `${SL}/4 Objects/1 Furniture/3.png`;
const LOCKER = `${SL}/4 Objects/1 Furniture/7.png`;
const SEAT = `${SL}/4 Objects/1 Furniture/9.png`;
const RACK = `${SL}/4 Objects/1 Furniture/11.png`;
const WEAPONS_RACK = `${SL}/4 Objects/1 Furniture/12.png`;
const ENGINE1 = `${SL}/4 Objects/1 Furniture/13.png`;
const ENGINE2 = `${SL}/4 Objects/1 Furniture/14.png`;
const TANK = `${SL}/4 Objects/1 Furniture/15.png`;
const MONITOR1 = `${SL}/4 Objects/2 Monitors/1.png`;
const MONITOR2 = `${SL}/4 Objects/2 Monitors/2.png`;
const MONITOR3 = `${SL}/4 Objects/2 Monitors/3.png`;
const MONITOR4 = `${SL}/4 Objects/2 Monitors/4.png`;
const MONITOR5 = `${SL}/4 Objects/2 Monitors/5.png`;
const BOX1 = `${SL}/4 Objects/3 Boxes/1.png`;
const BOX2 = `${SL}/4 Objects/3 Boxes/2.png`;
const BOX3 = `${SL}/4 Objects/3 Boxes/3.png`;
const BOX4 = `${SL}/4 Objects/3 Boxes/4.png`;
const PLANT = `${SL}/4 Objects/4 Decor/1.png`;
const LAMP = `${SL}/4 Objects/4 Decor/2.png`;
const PIPE1 = `${SL}/4 Objects/4 Decor/5.png`;
const PIPE2 = `${SL}/4 Objects/4 Decor/6.png`;
const VENT = `${SL}/4 Objects/4 Decor/7.png`;
const PANEL1 = `${SL}/4 Objects/4 Decor/9.png`;
const WIRE1 = `${SL}/4 Objects/4 Decor/11.png`;
const WIRE2 = `${SL}/4 Objects/4 Decor/12.png`;
const DOOR = `${SL}/5 Animated Objects/Door.png`;
const TILE_FLOOR = `${SL}/1 Tileset/Tile_05.png`;
const BACK_PANEL = `${SL}/2 BackTiles/BackTile_01.png`;
const BACK_PANEL2 = `${SL}/2 BackTiles/BackTile_05.png`;
const BACK_PANEL3 = `${SL}/2 BackTiles/BackTile_10.png`;
const BACK_PANEL4 = `${SL}/2 BackTiles/BackTile_15.png`;

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
  onClose,
  onOpenTech,
  onOpenCommander,
  onOpenBuild,
  onOpenUpgrades,
  onOpenStarMap,
  commanderPortrait,
  commanderName,
  shipName,
}: FlagshipInteriorProps) {
  const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null);

  const handleRoomClick = useCallback(
    (room: Room) => {
      switch (room) {
        case 'bridge':
          onOpenCommander();
          break;
        case 'armory':
          onOpenTech();
          break;
        case 'hangar':
          onOpenBuild();
          break;
        case 'engine':
          onOpenUpgrades();
          break;
      }
    },
    [onOpenCommander, onOpenTech, onOpenBuild, onOpenUpgrades],
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 150,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.92)',
        fontFamily: "'Segoe UI', monospace",
      }}
    >
      {/* Ship exterior shell — nearly full screen */}
      <div
        style={{
          position: 'relative',
          width: 'calc(100vw - 48px)',
          maxWidth: 1400,
          height: 'calc(100vh - 48px)',
          maxHeight: 800,
          backgroundImage: `url(${BG})`,
          backgroundSize: 'cover',
          borderRadius: 12,
          overflow: 'hidden',
          border: '3px solid rgba(40,180,160,0.5)',
          boxShadow: '0 0 80px rgba(40,180,160,0.3), inset 0 0 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Ship name header */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 48,
            background: 'rgba(4,12,20,0.95)',
            borderBottom: '2px solid rgba(40,180,160,0.4)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            gap: 16,
            zIndex: 5,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 900, color: '#28b4a0', letterSpacing: 4, textShadow: '0 0 12px rgba(40,180,160,0.5)' }}>
            {shipName.toUpperCase()}
          </span>
          <span style={{ fontSize: 12, color: 'rgba(160,200,255,0.5)', letterSpacing: 2 }}>FLAGSHIP INTERIOR</span>
          {commanderPortrait && (
            <img
              src={commanderPortrait}
              alt=""
              style={{ width: 32, height: 32, borderRadius: 6, border: '2px solid #fc4', objectFit: 'cover', marginLeft: 'auto' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          {commanderName && <span style={{ fontSize: 12, color: '#fc4', fontWeight: 700 }}>Cmdr. {commanderName}</span>}
          <img
            src="/assets/space/ui/hud/CloseBtn.png"
            alt="Close"
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              cursor: 'pointer',
              imageRendering: 'pixelated',
              filter: 'brightness(0.8)',
              marginLeft: commanderName ? 12 : 'auto',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(0.8)')}
          />
        </div>

        {/* ── Room Grid ── 2x2, fills the panel below header, above action bar ── */}
        <div
          style={{
            position: 'absolute',
            top: 48,
            left: 0,
            right: 0,
            bottom: 52,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: 3,
            padding: 3,
          }}
        >
          {/* Bridge (top-left) */}
          <RoomPanel
            room="bridge"
            label="BRIDGE"
            sublabel="Commander · Star Map · Fleet Overview"
            hovered={hoveredRoom === 'bridge'}
            onHover={() => setHoveredRoom('bridge')}
            onLeave={() => setHoveredRoom(null)}
            onClick={() => handleRoomClick('bridge')}
            color="#28b4a0"
            bg={BACK_PANEL}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', justifyContent: 'center' }}>
              {commanderPortrait && (
                <img
                  src={commanderPortrait}
                  alt="Commander"
                  style={{ width: 64, height: 64, borderRadius: 8, border: '2px solid #28b4a0', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <img src={MONITOR1} alt="" style={obj48} />
              <img src={MONITOR3} alt="" style={obj48} />
              <img src={CHAIR} alt="" style={obj48} />
              <img src={SEAT} alt="" style={obj36} />
              <img src={LAMP} alt="" style={obj36} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <RoomBtn
                label="Commander"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCommander();
                }}
              />
              <RoomBtn
                label="Star Map"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenStarMap();
                }}
              />
            </div>
          </RoomPanel>

          {/* Hangar (top-right) */}
          <RoomPanel
            room="hangar"
            label="HANGAR BAY"
            sublabel="Ship Production · Build Queue · Fleet"
            hovered={hoveredRoom === 'hangar'}
            onHover={() => setHoveredRoom('hangar')}
            onLeave={() => setHoveredRoom(null)}
            onClick={() => handleRoomClick('hangar')}
            color="#4488ff"
            bg={BACK_PANEL2}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', justifyContent: 'center' }}>
              <img src={BOX1} alt="" style={obj48} />
              <img src={BOX2} alt="" style={obj48} />
              <img src={BOX3} alt="" style={obj36} />
              <img src={BOX4} alt="" style={obj36} />
              <img src={DOOR} alt="" style={{ ...obj48, imageRendering: 'pixelated' }} />
              <img src={RACK} alt="" style={obj48} />
              <img src={LOCKER} alt="" style={obj48} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <RoomBtn
                label="Build Ships"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenBuild();
                }}
              />
            </div>
          </RoomPanel>

          {/* Armory (bottom-left) */}
          <RoomPanel
            room="armory"
            label="ARMORY"
            sublabel="Tech Tree · Research · Weapons Lab"
            hovered={hoveredRoom === 'armory'}
            onHover={() => setHoveredRoom('armory')}
            onLeave={() => setHoveredRoom(null)}
            onClick={() => handleRoomClick('armory')}
            color="#ff8844"
            bg={BACK_PANEL3}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', justifyContent: 'center' }}>
              <img src={WEAPONS_RACK} alt="" style={obj48} />
              <img src={DESK} alt="" style={obj48} />
              <img src={MONITOR2} alt="" style={obj48} />
              <img src={MONITOR5} alt="" style={obj36} />
              <img src={PIPE1} alt="" style={obj36} />
              <img src={PIPE2} alt="" style={obj36} />
              <img src={PANEL1} alt="" style={obj36} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <RoomBtn
                label="Tech Tree"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenTech();
                }}
              />
              <RoomBtn
                label="Upgrades"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenUpgrades();
                }}
              />
            </div>
          </RoomPanel>

          {/* Engine Room (bottom-right) */}
          <RoomPanel
            room="engine"
            label="ENGINE ROOM"
            sublabel="Power Core · Resources · Workers"
            hovered={hoveredRoom === 'engine'}
            onHover={() => setHoveredRoom('engine')}
            onLeave={() => setHoveredRoom(null)}
            onClick={() => handleRoomClick('engine')}
            color="#44ee88"
            bg={BACK_PANEL4}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', justifyContent: 'center' }}>
              <img src={ENGINE1} alt="" style={obj48} />
              <img src={ENGINE2} alt="" style={obj48} />
              <img src={TANK} alt="" style={obj48} />
              <img src={VENT} alt="" style={obj36} />
              <img src={WIRE1} alt="" style={obj36} />
              <img src={WIRE2} alt="" style={obj36} />
              <img src={PLANT} alt="" style={obj36} />
              <img src={MONITOR4} alt="" style={obj48} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <RoomBtn
                label="Upgrades"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenUpgrades();
                }}
              />
            </div>
          </RoomPanel>
        </div>

        {/* Quick-action bar at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 52,
            backgroundImage: 'url(/assets/space/ui/hud/DarkBackground.png)',
            backgroundSize: '100% 100%',
            borderTop: '2px solid rgba(40,180,160,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '0 20px',
            zIndex: 5,
          }}
        >
          <Btn label="STAR MAP" onClick={onOpenStarMap} style={{ height: 36, minWidth: 100 }} />
          <Btn label="TECH TREE" onClick={onOpenTech} style={{ height: 36, minWidth: 90 }} />
          <Btn label="COMMANDER" onClick={onOpenCommander} style={{ height: 36, minWidth: 100 }} />
          <Btn label="BUILD SHIPS" onClick={onOpenBuild} style={{ height: 36, minWidth: 100 }} />
          <Btn label="UPGRADES" onClick={onOpenUpgrades} style={{ height: 36, minWidth: 90 }} />
          <div style={{ flex: 1 }} />
          <Btn label="EXIT SHIP (ESC)" onClick={onClose} active wide style={{ height: 36, minWidth: 130 }} />
        </div>
      </div>
    </div>
  );
}

// ── Room Panel ────────────────────────────────────────
function RoomPanel({
  room,
  label,
  sublabel,
  hovered,
  onHover,
  onLeave,
  onClick,
  color,
  bg,
  children,
}: {
  room: Room;
  label: string;
  sublabel: string;
  hovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  color: string;
  bg?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{
        position: 'relative',
        cursor: 'pointer',
        overflow: 'hidden',
        backgroundImage: `url(${bg ?? BACK_PANEL})`,
        backgroundSize: '64px 64px',
        border: `2px solid ${hovered ? color : 'rgba(40,60,80,0.4)'}`,
        borderRadius: 6,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: hovered ? `inset 0 0 40px ${color}33, 0 0 16px ${color}44` : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 20,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 900, color, letterSpacing: 3, textShadow: `0 0 12px ${color}66` }}>{label}</div>
      <div style={{ fontSize: 11, color: 'rgba(160,200,255,0.5)', letterSpacing: 1, marginBottom: 8 }}>{sublabel}</div>
      {children}
      {/* Floor tile strip */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 24,
          backgroundImage: `url(${TILE_FLOOR})`,
          backgroundSize: '48px 48px',
          backgroundRepeat: 'repeat-x',
          opacity: 0.4,
        }}
      />
    </div>
  );
}

// ── Room Button (no emoji — text only, larger) ────────────────
function RoomBtn({ label, onClick }: { label: string; onClick: (e: React.MouseEvent) => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '6px 16px',
        borderRadius: 5,
        cursor: 'pointer',
        background: 'rgba(8,18,36,0.9)',
        border: '1px solid rgba(40,180,160,0.4)',
        fontSize: 11,
        fontWeight: 700,
        color: '#cde',
        letterSpacing: 0.5,
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(40,180,160,0.25)';
        e.currentTarget.style.borderColor = '#28b4a0';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(8,18,36,0.9)';
        e.currentTarget.style.borderColor = 'rgba(40,180,160,0.4)';
      }}
    >
      {label}
    </div>
  );
}

// ── Quick Action Button ───────────────────────────────────────
function QuickBtn({ label, onClick, color }: { label: string; onClick: () => void; color?: string }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        cursor: 'pointer',
        display: 'inline-block',
      }}
    >
      <img src="/assets/space/ui/hud/Normal_Btn.png" alt="" style={{ width: 100, height: 28, display: 'block' }} />
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 9,
          fontWeight: 700,
          color: color ?? '#cde',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </span>
    </div>
  );
}

const obj48: React.CSSProperties = {
  width: 48,
  height: 48,
  imageRendering: 'pixelated' as any,
  objectFit: 'contain',
};
const obj36: React.CSSProperties = {
  width: 36,
  height: 36,
  imageRendering: 'pixelated' as any,
  objectFit: 'contain',
};
