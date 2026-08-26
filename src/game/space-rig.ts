import * as THREE from 'three';
import type { SpaceShip, ShipClass } from './space-types';
import { getShipPrefab } from './space-prefabs';

/**
 * Shared ship frame — same contract as Carrier `modelFit.ts` / Shipyard axes.
 * Local +Z = nose (tip forward) · +X = starboard · +Y = up · −Z = boosters.
 * Armada RTS and Carrier must keep this one resource; do not fork a second XYZ.
 */
export const SHIP_AXES = {
  nose: 'z+' as const,
  side: 'x+' as const,
  up: 'y+' as const,
  boosters: 'z-' as const,
};

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
      axes: { nose: SHIP_AXES.nose, side: SHIP_AXES.side, up: SHIP_AXES.up },
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
    axes: { nose: SHIP_AXES.nose, side: SHIP_AXES.side, up: SHIP_AXES.up },
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

const _aoBox = new THREE.Box3();
const _aoSize = new THREE.Vector3();
const _aoCenter = new THREE.Vector3();
const _aoV = new THREE.Vector3();
const _aoUp = new THREE.Vector3(0, 1, 0);
const _aoQ = new THREE.Quaternion();
const _wPos = new THREE.Vector3();

/**
 * Rotate a hull so its taper-detected nose faces local +Z.
 * Parity with Carrier `artifacts/carrier/src/game/modelFit.ts` `autoOrientShip`.
 */
export function autoOrientShip(obj: THREE.Object3D): void {
  obj.updateMatrixWorld(true);
  _aoBox.setFromObject(obj);
  _aoBox.getSize(_aoSize);
  _aoBox.getCenter(_aoCenter);
  const alongX = _aoSize.x >= _aoSize.z;
  const half = (alongX ? _aoSize.x : _aoSize.z) * 0.5 || 1;
  const cut = 0.45 * half;
  const cLng = alongX ? _aoCenter.x : _aoCenter.z;
  const cPer = alongX ? _aoCenter.z : _aoCenter.x;

  let total = 0;
  obj.traverse((o) => {
    if (o instanceof THREE.Mesh) total += o.geometry.getAttribute('position')?.count ?? 0;
  });
  const step = total > 4000 ? Math.ceil(total / 4000) : 1;

  let frontR = 0,
    frontN = 0,
    backR = 0,
    backN = 0,
    i = 0;
  obj.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const pos = o.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!pos) return;
    for (let k = 0; k < pos.count; k++, i++) {
      if (i % step !== 0) continue;
      _aoV.fromBufferAttribute(pos, k).applyMatrix4(o.matrixWorld);
      const lng = (alongX ? _aoV.x : _aoV.z) - cLng;
      const r = Math.abs((alongX ? _aoV.z : _aoV.x) - cPer);
      if (lng > cut) {
        frontR += r;
        frontN++;
      } else if (lng < -cut) {
        backR += r;
        backN++;
      }
    }
  });
  const fAvg = frontN ? frontR / frontN : Infinity;
  const bAvg = backN ? backR / backN : Infinity;
  const noseSign = fAvg <= bAvg ? 1 : -1;
  const nx = alongX ? noseSign : 0;
  const nz = alongX ? 0 : noseSign;
  _aoQ.setFromAxisAngle(_aoUp, -Math.atan2(nx, nz));
  obj.quaternion.premultiply(_aoQ);
  stampShipAxes(obj);
}

export function stampShipAxes(obj: THREE.Object3D): void {
  obj.userData.shipAxes = { ...SHIP_AXES, source: 'carrier-modelFit' };
}

const BOOSTER_NAME = /engine|thruster|exhaust|booster|nozzle|jet|propuls|ember/i;

function dedupePoints(pts: THREE.Vector3[], minDist: number): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  for (const p of pts) {
    if (out.some((q) => q.distanceToSquared(p) < minDist * minDist)) continue;
    out.push(p);
  }
  return out;
}

/**
 * Booster sockets on the *oriented* hull: named engine nodes first, else
 * vertex clusters on the −Z tail cap. Never a floating point in empty space.
 */
export function findBoosterAnchors(root: THREE.Object3D): THREE.Vector3[] {
  root.updateMatrixWorld(true);
  const named: THREE.Vector3[] = [];
  root.traverse((o) => {
    if (!BOOSTER_NAME.test(o.name)) return;
    o.getWorldPosition(_wPos);
    named.push(root.worldToLocal(_wPos.clone()));
  });
  const uniqueNamed = dedupePoints(named, 0.04);
  if (uniqueNamed.length > 0) return uniqueNamed.slice(0, 6);

  _aoBox.setFromObject(root);
  if (_aoBox.isEmpty()) return [new THREE.Vector3(0, 0, -1)];
  _aoBox.getSize(_aoSize);
  const zCut = _aoBox.min.z + Math.max(_aoSize.z * 0.12, 0.02);
  const tail: THREE.Vector3[] = [];
  let total = 0;
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) total += o.geometry.getAttribute('position')?.count ?? 0;
  });
  const step = total > 3000 ? Math.ceil(total / 3000) : 1;
  let i = 0;
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const pos = o.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!pos) return;
    for (let k = 0; k < pos.count; k++, i++) {
      if (i % step !== 0) continue;
      _aoV.fromBufferAttribute(pos, k).applyMatrix4(o.matrixWorld);
      if (_aoV.z > zCut) continue;
      tail.push(root.worldToLocal(_aoV.clone()));
    }
  });
  if (tail.length === 0) {
    const localMin = root.worldToLocal(new THREE.Vector3(_aoBox.getCenter(_aoCenter).x, _aoBox.getCenter(_aoCenter).y, _aoBox.min.z));
    return [localMin];
  }

  let minX = Infinity,
    maxX = -Infinity,
    sx = 0,
    sy = 0,
    sz = 0;
  for (const p of tail) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    sx += p.x;
    sy += p.y;
    sz += p.z;
  }
  const n = tail.length;
  const spanX = maxX - minX;
  if (spanX < Math.max(_aoSize.x * 0.25, 0.08)) {
    return [new THREE.Vector3(sx / n, sy / n, sz / n)];
  }
  const mid = (minX + maxX) * 0.5;
  const left: THREE.Vector3[] = [];
  const right: THREE.Vector3[] = [];
  for (const p of tail) (p.x < mid ? left : right).push(p);
  const avgOf = (arr: THREE.Vector3[]) => {
    const a = new THREE.Vector3();
    for (const p of arr) a.add(p);
    return a.multiplyScalar(1 / arr.length);
  };
  const sockets: THREE.Vector3[] = [];
  if (left.length) sockets.push(avgOf(left));
  if (right.length) sockets.push(avgOf(right));
  return sockets.length ? sockets : [new THREE.Vector3(sx / n, sy / n, sz / n)];
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
