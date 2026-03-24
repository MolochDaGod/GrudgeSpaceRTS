/**
 * ship-prefabs-editor.ts — Pre-designed ship parts for the Ship Forge builder
 *
 * Each part is either:
 *   - A VoxMap pattern (hull frames, engines, fins) built with the voxel system
 *   - A GLB model path (turret weapons) loaded as 3D mesh
 *
 * Voxel types: 1=hull, 2=armor, 3=engine, 4=weapon, 5=cockpit/glass
 */

type VoxMap = Map<string, number>;

function k(x: number, y: number, z: number) {
  return `${x},${y},${z}`;
}
function box(m: VoxMap, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, t: number) {
  for (let z = z1; z <= z2; z++) for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) m.set(k(x, y, z), t);
}
function set(m: VoxMap, x: number, y: number, z: number, t: number) {
  m.set(k(x, y, z), t);
}

export type PartCategory = 'hull' | 'engine' | 'weapon' | 'fin';

export interface ShipPart {
  id: string;
  name: string;
  category: PartCategory;
  /** If set, this is a GLB model (turret weapon). Otherwise it's a voxel pattern. */
  glbPath?: string;
  /** Voxel pattern (if not GLB) */
  pattern?: () => VoxMap;
  /** Approximate size for preview/placement (x, y, z) */
  size: [number, number, number];
  /** Can be mounted on bottom/sides */
  mountBottom?: boolean;
  mountSide?: boolean;
  /** Preview color for catalog */
  color: string;
}

// ── HULL FRAMES ─────────────────────────────────────────────────────
function hullBox(): VoxMap {
  const m: VoxMap = new Map();
  box(m, 0, 0, 0, 5, 3, 7, 1); // Solid rectangular block
  box(m, 1, 1, 1, 4, 2, 6, 0); // Hollow interior (remove)
  // Re-add walls only
  for (const [key] of m) {
    if (m.get(key) === 0) m.delete(key);
  }
  box(m, 0, 0, 0, 5, 0, 7, 2); // Bottom plate (armor)
  box(m, 0, 3, 0, 5, 3, 7, 1); // Top plate
  box(m, 0, 0, 0, 0, 3, 7, 1);
  box(m, 5, 0, 0, 5, 3, 7, 1); // Side walls
  box(m, 0, 0, 0, 5, 3, 0, 2);
  box(m, 0, 0, 7, 5, 3, 7, 1); // Front/back
  return m;
}

function hullWedge(): VoxMap {
  const m: VoxMap = new Map();
  // Tapered nose cone: wide at z=0, narrows to point at z=9
  for (let z = 0; z < 10; z++) {
    const w = Math.max(1, Math.floor(4 * (1 - z / 10)));
    const cx = 2;
    for (let x = cx - w; x <= cx + w; x++) {
      for (let y = 0; y < Math.max(1, 3 - Math.floor(z / 4)); y++) {
        set(m, x, y, z, z < 8 ? 1 : 4); // tip is weapon color
      }
    }
  }
  return m;
}

function hullWingL(): VoxMap {
  const m: VoxMap = new Map();
  // Swept wing plate extending left
  for (let z = 0; z < 6; z++) {
    const span = Math.min(7, 2 + z * 1.2) | 0;
    for (let x = 0; x < span; x++) {
      set(m, -x, 0, z, 1);
      if (z === 0 || z === 5) set(m, -x, 0, z, 2); // Edge armor
    }
  }
  return m;
}

function hullWingR(): VoxMap {
  const m: VoxMap = new Map();
  for (let z = 0; z < 6; z++) {
    const span = Math.min(7, 2 + z * 1.2) | 0;
    for (let x = 0; x < span; x++) {
      set(m, x, 0, z, 1);
      if (z === 0 || z === 5) set(m, x, 0, z, 2);
    }
  }
  return m;
}

function hullPlate(): VoxMap {
  const m: VoxMap = new Map();
  box(m, 0, 0, 0, 7, 0, 3, 2); // Flat armor plate
  set(m, 0, 0, 0, 1);
  set(m, 7, 0, 0, 1); // Corner accents
  set(m, 0, 0, 3, 1);
  set(m, 7, 0, 3, 1);
  return m;
}

function hullRing(): VoxMap {
  const m: VoxMap = new Map();
  const r = 3;
  for (let a = 0; a < 16; a++) {
    const angle = (a / 16) * Math.PI * 2;
    const x = Math.round(Math.cos(angle) * r);
    const y = Math.round(Math.sin(angle) * r);
    set(m, x + r, y + r, 0, 1);
    set(m, x + r, y + r, 1, 1);
  }
  return m;
}

// ── ENGINES ─────────────────────────────────────────────────────────
function engineSingle(): VoxMap {
  const m: VoxMap = new Map();
  box(m, 0, 0, 0, 1, 1, 2, 2); // Housing
  set(m, 0, 0, 0, 3);
  set(m, 1, 0, 0, 3); // Nozzle glow
  set(m, 0, 1, 0, 3);
  set(m, 1, 1, 0, 3);
  return m;
}

function engineDual(): VoxMap {
  const m: VoxMap = new Map();
  box(m, 0, 0, 0, 1, 1, 2, 2); // Left engine
  box(m, 3, 0, 0, 4, 1, 2, 2); // Right engine
  box(m, 2, 0, 1, 2, 1, 2, 1); // Connecting strut
  set(m, 0, 0, 0, 3);
  set(m, 1, 0, 0, 3); // Left glow
  set(m, 3, 0, 0, 3);
  set(m, 4, 0, 0, 3); // Right glow
  return m;
}

function engineLarge(): VoxMap {
  const m: VoxMap = new Map();
  box(m, 0, 0, 0, 2, 2, 3, 2); // Big housing
  box(m, 0, 0, 0, 2, 2, 0, 3); // Full nozzle face glows
  set(m, 1, 1, 1, 3); // Center glow
  return m;
}

function enginePod(): VoxMap {
  const m: VoxMap = new Map();
  box(m, 0, 0, 0, 1, 1, 5, 1); // Long nacelle body
  box(m, 0, 0, 0, 1, 1, 0, 3); // Rear glow
  set(m, 0, 0, 5, 2);
  set(m, 1, 0, 5, 2); // Front intake
  return m;
}

// ── WEAPONS (voxel) ─────────────────────────────────────────────────
function weaponLaser(): VoxMap {
  const m: VoxMap = new Map();
  set(m, 0, 0, 0, 2); // Base mount
  set(m, 0, 1, 0, 4); // Barrel start
  set(m, 0, 1, 1, 4);
  set(m, 0, 1, 2, 4);
  set(m, 0, 1, 3, 4); // Barrel
  return m;
}

function weaponCannon(): VoxMap {
  const m: VoxMap = new Map();
  box(m, 0, 0, 0, 1, 0, 0, 2); // Base
  box(m, 0, 1, 0, 1, 1, 2, 4); // Barrel
  set(m, 0, 1, 2, 3);
  set(m, 1, 1, 2, 3); // Muzzle glow
  return m;
}

function weaponMissile(): VoxMap {
  const m: VoxMap = new Map();
  box(m, 0, 0, 0, 2, 0, 0, 2); // Base rack
  // Missile tubes
  set(m, 0, 1, 0, 4);
  set(m, 1, 1, 0, 4);
  set(m, 2, 1, 0, 4);
  set(m, 0, 1, 1, 4);
  set(m, 1, 1, 1, 4);
  set(m, 2, 1, 1, 4);
  return m;
}

function weaponTurret(): VoxMap {
  const m: VoxMap = new Map();
  box(m, 0, 0, 0, 2, 0, 2, 2); // Base platform
  set(m, 1, 1, 1, 2); // Turret ring
  // Dome
  set(m, 0, 1, 0, 1);
  set(m, 2, 1, 0, 1);
  set(m, 0, 1, 2, 1);
  set(m, 2, 1, 2, 1);
  set(m, 1, 2, 1, 5); // Glass dome top
  // Barrels
  set(m, 0, 1, 3, 4);
  set(m, 2, 1, 3, 4);
  return m;
}

// ── FINS & DETAILS ──────────────────────────────────────────────────
function finVertical(): VoxMap {
  const m: VoxMap = new Map();
  for (let y = 0; y < 4; y++) {
    set(m, 0, y, 0, 1);
    set(m, 0, y, 1, y < 3 ? 1 : 2);
    if (y < 3) set(m, 0, y, 2, 1);
  }
  return m;
}

function finSwept(): VoxMap {
  const m: VoxMap = new Map();
  for (let x = 0; x < 4; x++) {
    set(m, x, x < 2 ? 1 : 0, 0, 1);
    set(m, x, x < 2 ? 1 : 0, 0, x === 3 ? 2 : 1);
  }
  return m;
}

function antenna(): VoxMap {
  const m: VoxMap = new Map();
  for (let z = 0; z < 6; z++) set(m, 0, 0, z, z < 5 ? 1 : 3); // Tip glows
  return m;
}

function cockpitDome(): VoxMap {
  const m: VoxMap = new Map();
  box(m, 0, 0, 0, 2, 0, 2, 2); // Base frame
  set(m, 1, 1, 1, 5); // Center glass
  set(m, 0, 1, 1, 5);
  set(m, 2, 1, 1, 5); // Side glass
  set(m, 1, 1, 0, 5);
  set(m, 1, 1, 2, 5); // Front/back glass
  set(m, 1, 2, 1, 5); // Top glass
  return m;
}

// ── GLB TURRET WEAPONS ──────────────────────────────────────────────
const WPN = '/assets/space/models/weapons';

// ── STARTER SHIP TEMPLATES (full ships users can start from) ─────
function starterFighter(): VoxMap {
  const m: VoxMap = new Map();
  // Fuselage (narrow wedge body)
  for (let z = 0; z < 16; z++) {
    const w = z < 12 ? Math.min(3, 1 + Math.floor(z / 3)) : Math.max(1, 3 - Math.floor((z - 12) / 2));
    const cx = 3;
    for (let x = cx - w; x <= cx + w; x++) {
      box(m, x, 0, z, x, 1, z, 1);
    }
  }
  // Cockpit glass
  set(m, 3, 2, 12, 5);
  set(m, 3, 2, 13, 5);
  set(m, 3, 2, 14, 5);
  // Wings
  for (let z = 4; z < 10; z++) {
    const span = Math.min(5, z - 3);
    for (let x = 0; x < span; x++) {
      set(m, 3 - 3 - x, 0, z, 1); // left wing
      set(m, 3 + 3 + x, 0, z, 1); // right wing
    }
  }
  // Engines
  set(m, 2, 0, 0, 3);
  set(m, 3, 0, 0, 3);
  set(m, 4, 0, 0, 3);
  set(m, 2, 1, 0, 3);
  set(m, 3, 1, 0, 3);
  set(m, 4, 1, 0, 3);
  // Weapons
  set(m, 0, 0, 8, 4);
  set(m, 6, 0, 8, 4); // wing tips
  return m;
}

function starterCruiser(): VoxMap {
  const m: VoxMap = new Map();
  // Main hull (boxy, 8 wide, 20 long)
  box(m, 2, 0, 0, 9, 3, 19, 1);
  // Armor plating on bottom + front
  box(m, 2, 0, 0, 9, 0, 19, 2);
  box(m, 2, 0, 19, 9, 3, 19, 2);
  // Hollow interior
  box(m, 3, 1, 1, 8, 2, 18, 0);
  for (const [kk] of m) {
    if (m.get(kk) === 0) m.delete(kk);
  }
  // Bridge windows
  box(m, 4, 3, 16, 7, 4, 18, 5);
  // Engines (dual big)
  box(m, 2, 1, 0, 3, 2, 0, 3);
  box(m, 8, 1, 0, 9, 2, 0, 3);
  // Weapon turrets
  box(m, 3, 4, 6, 4, 4, 6, 4);
  box(m, 7, 4, 6, 8, 4, 6, 4);
  box(m, 5, 4, 12, 6, 4, 12, 4);
  return m;
}

function starterDreadnought(): VoxMap {
  const m: VoxMap = new Map();
  // Massive hull (12 wide, 28 long, 6 tall)
  box(m, 2, 0, 0, 13, 5, 27, 1);
  // Armor shell
  box(m, 2, 0, 0, 13, 0, 27, 2);
  box(m, 2, 5, 0, 13, 5, 27, 2);
  box(m, 2, 0, 27, 13, 5, 27, 2);
  // Hollow interior
  box(m, 4, 1, 2, 11, 4, 25, 0);
  for (const [kk] of m) {
    if (m.get(kk) === 0) m.delete(kk);
  }
  // Bridge tower
  box(m, 5, 6, 20, 10, 8, 24, 1);
  box(m, 6, 7, 22, 9, 9, 24, 5); // windows
  // Heavy engines (4 pods)
  box(m, 2, 1, 0, 4, 3, 0, 3);
  box(m, 6, 1, 0, 7, 3, 0, 3);
  box(m, 8, 1, 0, 9, 3, 0, 3);
  box(m, 11, 1, 0, 13, 3, 0, 3);
  // Wing pylons
  for (let z = 6; z < 16; z++) {
    set(m, 0, 2, z, 1);
    set(m, 1, 2, z, 1);
    set(m, 14, 2, z, 1);
    set(m, 15, 2, z, 1);
  }
  // Weapon batteries (6 turret positions)
  box(m, 3, 6, 4, 4, 6, 5, 4);
  box(m, 11, 6, 4, 12, 6, 5, 4);
  box(m, 3, 6, 10, 4, 6, 11, 4);
  box(m, 11, 6, 10, 12, 6, 11, 4);
  box(m, 6, 6, 16, 7, 6, 17, 4);
  box(m, 8, 6, 16, 9, 6, 17, 4);
  return m;
}

export interface StarterTemplate {
  id: string;
  name: string;
  desc: string;
  color: string;
  pattern: () => VoxMap;
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'starter_fighter',
    name: 'Fighter',
    desc: 'Fast interceptor with wings and nose cannon',
    color: '#44ff88',
    pattern: starterFighter,
  },
  {
    id: 'starter_cruiser',
    name: 'Cruiser',
    desc: 'Medium armored hull with bridge and dual engines',
    color: '#4488ff',
    pattern: starterCruiser,
  },
  {
    id: 'starter_dreadnought',
    name: 'Dreadnought',
    desc: 'Massive capital ship with turrets and wing pylons',
    color: '#ff8844',
    pattern: starterDreadnought,
  },
];

// ── FULL PARTS CATALOG ────────────────────────────────────
export const SHIP_PARTS: ShipPart[] = [
  // Hull frames
  { id: 'hull_box', name: 'Box Frame', category: 'hull', pattern: hullBox, size: [6, 4, 8], color: '#4488ff' },
  { id: 'hull_wedge', name: 'Wedge Nose', category: 'hull', pattern: hullWedge, size: [5, 3, 10], color: '#4488ff' },
  { id: 'hull_wing_l', name: 'Wing (Left)', category: 'hull', pattern: hullWingL, size: [8, 1, 6], color: '#4488ff' },
  { id: 'hull_wing_r', name: 'Wing (Right)', category: 'hull', pattern: hullWingR, size: [8, 1, 6], color: '#4488ff' },
  { id: 'hull_plate', name: 'Armor Plate', category: 'hull', pattern: hullPlate, size: [8, 1, 4], color: '#223366' },
  { id: 'hull_ring', name: 'Ring Section', category: 'hull', pattern: hullRing, size: [7, 7, 2], color: '#4488ff' },

  // Engines
  { id: 'engine_single', name: 'Single Thruster', category: 'engine', pattern: engineSingle, size: [2, 2, 3], color: '#00ccff' },
  { id: 'engine_dual', name: 'Dual Thruster', category: 'engine', pattern: engineDual, size: [5, 2, 3], color: '#00ccff' },
  { id: 'engine_large', name: 'Heavy Booster', category: 'engine', pattern: engineLarge, size: [3, 3, 4], color: '#00ccff' },
  { id: 'engine_pod', name: 'Nacelle Pod', category: 'engine', pattern: enginePod, size: [2, 2, 6], color: '#00ccff' },

  // Voxel weapons
  {
    id: 'weapon_laser',
    name: 'Laser Barrel',
    category: 'weapon',
    pattern: weaponLaser,
    size: [1, 2, 4],
    color: '#ff8800',
    mountBottom: true,
    mountSide: true,
  },
  {
    id: 'weapon_cannon',
    name: 'Heavy Cannon',
    category: 'weapon',
    pattern: weaponCannon,
    size: [2, 2, 3],
    color: '#ff8800',
    mountBottom: true,
    mountSide: true,
  },
  {
    id: 'weapon_missile',
    name: 'Missile Pod',
    category: 'weapon',
    pattern: weaponMissile,
    size: [3, 2, 2],
    color: '#ff8800',
    mountBottom: true,
    mountSide: true,
  },
  {
    id: 'weapon_turret',
    name: 'Dome Turret',
    category: 'weapon',
    pattern: weaponTurret,
    size: [3, 3, 4],
    color: '#ff8800',
    mountBottom: true,
    mountSide: true,
  },

  // GLB turret weapons (real 3D models)
  {
    id: 'turret_cannon',
    name: 'Gun Cannon',
    category: 'weapon',
    glbPath: `${WPN}/Gun Cannon Turret.glb`,
    size: [2, 2, 3],
    color: '#ffaa44',
    mountBottom: true,
    mountSide: true,
  },
  {
    id: 'turret_basic',
    name: 'Turret',
    category: 'weapon',
    glbPath: `${WPN}/Turret.glb`,
    size: [2, 2, 2],
    color: '#ffaa44',
    mountBottom: true,
    mountSide: true,
  },
  {
    id: 'turret_gatling',
    name: 'Gatling Turret',
    category: 'weapon',
    glbPath: `${WPN}/Gatelng Gun Turret.glb`,
    size: [2, 2, 3],
    color: '#ffaa44',
    mountBottom: true,
    mountSide: true,
  },
  {
    id: 'turret_gun',
    name: 'Turret Gun',
    category: 'weapon',
    glbPath: `${WPN}/Turret Gun.glb`,
    size: [2, 2, 3],
    color: '#ffaa44',
    mountBottom: true,
    mountSide: true,
  },
  {
    id: 'turret_rail',
    name: 'Rail Gun',
    category: 'weapon',
    glbPath: `${WPN}/Rail Gun Turret.glb`,
    size: [2, 2, 4],
    color: '#ffaa44',
    mountBottom: true,
    mountSide: true,
  },

  // Fins & details
  { id: 'fin_vertical', name: 'Dorsal Fin', category: 'fin', pattern: finVertical, size: [1, 4, 3], color: '#88ccff' },
  { id: 'fin_swept', name: 'Swept Fin', category: 'fin', pattern: finSwept, size: [4, 2, 1], color: '#88ccff' },
  { id: 'antenna', name: 'Antenna Spike', category: 'fin', pattern: antenna, size: [1, 1, 6], color: '#88ccff' },
  { id: 'cockpit_dome', name: 'Cockpit Dome', category: 'fin', pattern: cockpitDome, size: [3, 3, 3], color: '#88ccff' },
];

export const PART_CATEGORIES: { key: PartCategory; label: string; color: string }[] = [
  { key: 'hull', label: 'HULL FRAMES', color: '#4488ff' },
  { key: 'engine', label: 'ENGINES', color: '#00ccff' },
  { key: 'weapon', label: 'WEAPONS', color: '#ff8800' },
  { key: 'fin', label: 'FINS & DETAIL', color: '#88ccff' },
];
