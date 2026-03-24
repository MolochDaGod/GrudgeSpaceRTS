import type { SpaceShip, ShipClass } from './space-types';
import { getShipPrefab } from './space-prefabs';

export interface RigPoint {
  x: number;
  y: number;
  z: number;
}

export interface ShipRigProfile {
  shipType: string;
  source: 'prefab_points' | 'class_default';
  quality: 'high' | 'medium' | 'low';
  axes: {
    nose: 'z+';
    side: 'x+';
    up: 'y+';
  };
  // Local-space anchors relative to model origin
  nose: RigPoint;
  tail: RigPoint;
  left: RigPoint;
  right: RigPoint;
  muzzles: RigPoint[];
  boosters: RigPoint[];
  // Max local extent used for normalized scaling
  hullRadius: number;
  inferredReversedForward: boolean;
}

const PROFILE_CACHE = new Map<string, ShipRigProfile>();

const DEFAULT_POINTS = {
  nose: { x: 0, y: 0, z: 1 },
  tail: { x: 0, y: 0, z: -1 },
  left: { x: -0.7, y: 0, z: 0.15 },
  right: { x: 0.7, y: 0, z: 0.15 },
  muzzles: [{ x: 0, y: 0, z: 1 }],
  boosters: [{ x: 0, y: 0, z: -1 }],
} satisfies {
  nose: RigPoint;
  tail: RigPoint;
  left: RigPoint;
  right: RigPoint;
  muzzles: RigPoint[];
  boosters: RigPoint[];
};

const CLASS_DIAMETER_TJS: Partial<Record<ShipClass, number>> = {
  dreadnought: 7.0,
  battleship: 6.2,
  carrier: 5.5,
  cruiser: 5.0,
  light_cruiser: 4.5,
  destroyer: 4.0,
  frigate: 3.6,
  corvette: 3.2,
  assault_frigate: 3.6,
  bomber: 3.4,
  transport: 3.2,
  stealth: 2.8,
  heavy_fighter: 2.9,
  fighter: 2.8,
  interceptor: 2.7,
  scout: 2.6,
  worker: 2.4,
};

const WORLD_SCALE = 0.05;

function classDiameterTjs(shipClass: ShipClass): number {
  return CLASS_DIAMETER_TJS[shipClass] ?? 2.8;
}

function classDiameterGame(shipClass: ShipClass): number {
  // Renderer world = game * WORLD_SCALE, so game = world / WORLD_SCALE.
  return classDiameterTjs(shipClass) / WORLD_SCALE;
}

function toPoint(v: { x: number; y: number; z: number } | undefined): RigPoint | null {
  if (!v) return null;
  return { x: v.x, y: v.y, z: v.z };
}

function avg(points: RigPoint[]): RigPoint {
  if (!points.length) return { x: 0, y: 0, z: 0 };
  let sx = 0,
    sy = 0,
    sz = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
    sz += p.z;
  }
  return { x: sx / points.length, y: sy / points.length, z: sz / points.length };
}

function maxAbs(points: RigPoint[]): number {
  let m = 0;
  for (const p of points) {
    m = Math.max(m, Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
  }
  return m;
}

function clonePoint(p: RigPoint): RigPoint {
  return { x: p.x, y: p.y, z: p.z };
}

export function getShipRigProfile(shipType: string): ShipRigProfile {
  const cached = PROFILE_CACHE.get(shipType);
  if (cached) return cached;

  const prefab = getShipPrefab(shipType);
  if (!prefab) {
    const fallback: ShipRigProfile = {
      shipType,
      source: 'class_default',
      quality: 'low',
      axes: { nose: 'z+', side: 'x+', up: 'y+' },
      nose: clonePoint(DEFAULT_POINTS.nose),
      tail: clonePoint(DEFAULT_POINTS.tail),
      left: clonePoint(DEFAULT_POINTS.left),
      right: clonePoint(DEFAULT_POINTS.right),
      muzzles: DEFAULT_POINTS.muzzles.map(clonePoint),
      boosters: DEFAULT_POINTS.boosters.map(clonePoint),
      hullRadius: 1,
      inferredReversedForward: false,
    };
    PROFILE_CACHE.set(shipType, fallback);
    return fallback;
  }

  const enginePts = (prefab.enginePoints ?? []).map((p) => toPoint(p)!).filter(Boolean);
  const weaponPts = (prefab.weaponPoints ?? []).map((p) => toPoint(p)!).filter(Boolean);
  const hasEngines = enginePts.length > 0;
  const hasWeapons = weaponPts.length > 0;

  let nose = hasWeapons ? avg(weaponPts) : clonePoint(DEFAULT_POINTS.nose);
  let tail = hasEngines ? avg(enginePts) : clonePoint(DEFAULT_POINTS.tail);
  let reversed = false;

  // Most authored ships use +Z as forward. If sampled points suggest the opposite,
  // swap inferred nose/tail so gameplay anchors still respect nose/sides/tail semantics.
  if (nose.z < tail.z) {
    reversed = true;
    const t = nose;
    nose = tail;
    tail = t;
  }

  const sideSpan = Math.max(
    0.35,
    ...weaponPts.map((p) => Math.abs(p.x)),
    ...enginePts.map((p) => Math.abs(p.x)),
    Math.abs(DEFAULT_POINTS.left.x),
  );
  const zMid = (nose.z + tail.z) * 0.5;
  const left = { x: -sideSpan, y: 0, z: zMid + 0.15 };
  const right = { x: sideSpan, y: 0, z: zMid + 0.15 };
  const muzzles = hasWeapons ? weaponPts.map(clonePoint) : [clonePoint(nose)];
  const boosters = hasEngines ? enginePts.map(clonePoint) : [clonePoint(tail)];
  const hullRadius = Math.max(1, maxAbs([nose, tail, left, right, ...muzzles, ...boosters]));

  const profile: ShipRigProfile = {
    shipType,
    source: hasEngines || hasWeapons ? 'prefab_points' : 'class_default',
    quality: hasEngines && hasWeapons ? 'high' : hasEngines || hasWeapons ? 'medium' : 'low',
    axes: { nose: 'z+', side: 'x+', up: 'y+' },
    nose,
    tail,
    left,
    right,
    muzzles,
    boosters,
    hullRadius,
    inferredReversedForward: reversed,
  };
  PROFILE_CACHE.set(shipType, profile);
  return profile;
}

function localToWorld2D(local: RigPoint, facing: number, modelScale: number): { dx: number; dy: number } {
  // Engine/game convention:
  //  - facing=0 -> +X forward
  //  - local +Z = nose/forward
  //  - local +X = ship right side
  const fwdX = Math.cos(facing);
  const fwdY = Math.sin(facing);
  const rightX = -Math.sin(facing);
  const rightY = Math.cos(facing);
  const dz = local.z * modelScale;
  const dxLocal = local.x * modelScale;
  return {
    dx: fwdX * dz + rightX * dxLocal,
    dy: fwdY * dz + rightY * dxLocal,
  };
}

function gameScaleForShip(shipClass: ShipClass, profile: ShipRigProfile): number {
  const radius = classDiameterGame(shipClass) * 0.5;
  return radius / Math.max(0.001, profile.hullRadius);
}

function threeScaleForShip(shipClass: ShipClass, profile: ShipRigProfile): number {
  const radius = classDiameterTjs(shipClass) * 0.5;
  return radius / Math.max(0.001, profile.hullRadius);
}

export function getMuzzleWorldPosition(
  ship: Pick<SpaceShip, 'x' | 'y' | 'z' | 'facing' | 'shipType' | 'shipClass'>,
  muzzleIndex = 0,
): RigPoint {
  const profile = getShipRigProfile(ship.shipType);
  const scale = gameScaleForShip(ship.shipClass, profile);
  const muzzle = profile.muzzles.length > 0 ? profile.muzzles[Math.abs(muzzleIndex) % profile.muzzles.length] : profile.nose;
  const w = localToWorld2D(muzzle, ship.facing, scale);
  return { x: ship.x + w.dx, y: ship.y + w.dy, z: ship.z };
}

export function getTailWorldPosition(ship: Pick<SpaceShip, 'x' | 'y' | 'z' | 'facing' | 'shipType' | 'shipClass'>): RigPoint {
  const profile = getShipRigProfile(ship.shipType);
  const scale = gameScaleForShip(ship.shipClass, profile);
  const w = localToWorld2D(profile.tail, ship.facing, scale);
  return { x: ship.x + w.dx, y: ship.y + w.dy, z: ship.z };
}

export function getBoosterWorldPositions(ship: Pick<SpaceShip, 'x' | 'y' | 'z' | 'facing' | 'shipType' | 'shipClass'>): RigPoint[] {
  const profile = getShipRigProfile(ship.shipType);
  const scale = gameScaleForShip(ship.shipClass, profile);
  const boosters = profile.boosters.length ? profile.boosters : [profile.tail];
  return boosters.map((b) => {
    const w = localToWorld2D(b, ship.facing, scale);
    return { x: ship.x + w.dx, y: ship.y + w.dy, z: ship.z };
  });
}

export function getBoosterVisualOffsets(shipType: string, shipClass: ShipClass): RigPoint[] {
  const profile = getShipRigProfile(shipType);
  const scale = threeScaleForShip(shipClass, profile);
  const boosters = profile.boosters.length ? profile.boosters : [profile.tail];
  return boosters.map((b) => ({
    x: b.x * scale,
    y: b.y * scale,
    z: b.z * scale,
  }));
}

export function getRigAudit(shipType: string): string {
  const p = getShipRigProfile(shipType);
  const rev = p.inferredReversedForward ? ' (reversed-forward inferred)' : '';
  return `${shipType}: source=${p.source}, quality=${p.quality}, nose=(${p.nose.x.toFixed(2)},${p.nose.y.toFixed(2)},${p.nose.z.toFixed(2)}), tail=(${p.tail.x.toFixed(2)},${p.tail.y.toFixed(2)},${p.tail.z.toFixed(2)})${rev}`;
}

export interface ShipRigWorldAnchors {
  nose: RigPoint;
  tail: RigPoint;
  left: RigPoint;
  right: RigPoint;
  muzzles: RigPoint[];
  boosters: RigPoint[];
  profile: ShipRigProfile;
}

export function getRigWorldAnchors(ship: Pick<SpaceShip, 'x' | 'y' | 'z' | 'facing' | 'shipType' | 'shipClass'>): ShipRigWorldAnchors {
  const profile = getShipRigProfile(ship.shipType);
  const scale = gameScaleForShip(ship.shipClass, profile);
  const worldOf = (p: RigPoint): RigPoint => {
    const w = localToWorld2D(p, ship.facing, scale);
    return { x: ship.x + w.dx, y: ship.y + w.dy, z: ship.z + p.y * scale };
  };
  return {
    nose: worldOf(profile.nose),
    tail: worldOf(profile.tail),
    left: worldOf(profile.left),
    right: worldOf(profile.right),
    muzzles: (profile.muzzles.length ? profile.muzzles : [profile.nose]).map(worldOf),
    boosters: (profile.boosters.length ? profile.boosters : [profile.tail]).map(worldOf),
    profile,
  };
}
