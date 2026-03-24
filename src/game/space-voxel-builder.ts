/**
 * space-voxel-builder.ts — Procedural voxel ship geometry
 *
 * Generates distinct Three.js voxel (cube-based) ship meshes for the 22 ship
 * types that don't have external OBJ/FBX models, matching the visual style of
 * the existing MagicaVoxel-exported ships.
 *
 * Each ship class gets a hand-designed 3D voxel pattern.  Numbered variants
 * (cf_corvette_01 vs _02) get small design tweaks for visual variety.
 *
 * Voxel types:
 *   1 = hull     (team colour)
 *   2 = accent   (team colour, darker)
 *   3 = engine   (emissive cyan)
 *   4 = weapon   (emissive orange-white)
 *   5 = glass    (emissive team colour, cockpit)
 */

import * as THREE from 'three';
import { TEAM_COLORS } from './space-types';

// ── Voxel helpers ─────────────────────────────────────────────────
const CELL = 1.0; // Three.js units per voxel cell

type VoxMap = Map<string, number>;

function key(x: number, y: number, z: number) {
  return `${x},${y},${z}`;
}

function box(map: VoxMap, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, type: number) {
  for (let z = z1; z <= z2; z++) for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) map.set(key(x, y, z), type);
}

function set(map: VoxMap, x: number, y: number, z: number, type: number) {
  map.set(key(x, y, z), type);
}

// Build a Three.Group from a VoxMap — one InstancedMesh per colour type
function buildGroup(map: VoxMap, team: number, scale: number = 1): THREE.Group {
  const group = new THREE.Group();
  const teamHex = TEAM_COLORS[team] ?? 0x4488ff;
  const r = ((teamHex >> 16) & 0xff) / 255;
  const g = ((teamHex >> 8) & 0xff) / 255;
  const b = (teamHex & 0xff) / 255;

  const palettes: Record<number, { color: THREE.Color; emissive: THREE.Color; emInt: number }> = {
    1: { color: new THREE.Color(r * 0.9, g * 0.9, b * 0.9), emissive: new THREE.Color(r * 0.3, g * 0.3, b * 0.3), emInt: 0.35 },
    2: { color: new THREE.Color(r * 0.45, g * 0.45, b * 0.45), emissive: new THREE.Color(0, 0, 0), emInt: 0 },
    3: { color: new THREE.Color(0.05, 0.4, 0.9), emissive: new THREE.Color(0.0, 0.5, 1.0), emInt: 1.0 },
    4: { color: new THREE.Color(1.0, 0.6, 0.1), emissive: new THREE.Color(1.0, 0.5, 0.0), emInt: 0.9 },
    5: { color: new THREE.Color(r * 0.6, g * 0.6, b * 0.6), emissive: new THREE.Color(r, g, b), emInt: 0.7 },
  };

  // Group voxels by type
  const byType = new Map<number, [number, number, number][]>();
  for (const [k, t] of map) {
    const [x, y, z] = k.split(',').map(Number);
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t)!.push([x, y, z]);
  }

  const geo = new THREE.BoxGeometry(CELL * scale, CELL * scale, CELL * scale);

  for (const [type, positions] of byType) {
    const pal = palettes[type];
    if (!pal) continue;
    const mat = new THREE.MeshStandardMaterial({
      color: pal.color,
      emissive: pal.emissive,
      emissiveIntensity: pal.emInt,
      roughness: 0.6,
      metalness: 0.3,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, positions.length);
    const dummy = new THREE.Object3D();
    positions.forEach(([x, y, z], i) => {
      dummy.position.set(x * CELL * scale, y * CELL * scale, z * CELL * scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  }

  // Centre the group around its bounding box
  const tmp = new THREE.Box3().setFromObject(group);
  const centre = tmp.getCenter(new THREE.Vector3());
  group.children.forEach((c) => c.position.sub(centre));

  return group;
}

// ── Ship pattern library ──────────────────────────────────────────

function patternWorkerDrone(): VoxMap {
  // Compact boxy mining drone
  const m: VoxMap = new Map();
  box(m, -1, 0, -2, 1, 1, 2, 1); // main body
  box(m, -2, 0, -1, 2, 0, 1, 2); // lower pontoons
  set(m, 0, 2, 0, 5); // cockpit dome
  box(m, -1, 1, -1, 1, 1, 0, 2); // upper hull ridge
  // Mining arm (front)
  box(m, 0, 0, 3, 0, 0, 4, 2);
  set(m, 0, 0, 5, 4); // drill tip
  // Engines (rear)
  set(m, -1, 0, -3, 3);
  set(m, 1, 0, -3, 3);
  return m;
}

function patternEnergySkimmer(): VoxMap {
  // Flat disc-like energy collector
  const m: VoxMap = new Map();
  box(m, -2, 0, -2, 2, 0, 2, 1); // flat disc
  box(m, -1, 0, -3, 1, 0, 3, 1); // fore-aft extension
  box(m, -3, 0, -1, 3, 0, 1, 1);
  set(m, 0, 1, 0, 5); // central dome
  box(m, -2, 0, -2, 2, 0, 2, 2); // accent ring — overwrite corners
  set(m, -2, 0, -2, 2);
  set(m, 2, 0, -2, 2);
  set(m, -2, 0, 2, 2);
  set(m, 2, 0, 2, 2);
  // Collector petals (emissive)
  set(m, 0, 1, 2, 3);
  set(m, 0, 1, -2, 3);
  set(m, 2, 1, 0, 3);
  set(m, -2, 1, 0, 3);
  // Engine nozzle (rear)
  set(m, 0, 0, -4, 3);
  return m;
}

function patternCorvette(v: number): VoxMap {
  // Fast attack: swept wings, pointed nose, dual engines
  const m: VoxMap = new Map();
  // Core fuselage
  box(m, -1, 0, -4, 1, 1, 4, 1);
  set(m, 0, 1, 3, 5); // cockpit
  // Wing sweep (larger on v3-5)
  const ws = 1 + Math.floor(v / 2);
  box(m, -ws - 1, 0, -1, -2, 0, 1, 1);
  box(m, 2, 0, -1, ws + 1, 0, 1, 1);
  // Wing accents
  set(m, -ws - 1, 0, 0, 4);
  set(m, ws + 1, 0, 0, 4);
  // Nose tip
  set(m, 0, 0, 5, 4);
  set(m, 0, 1, 4, 2);
  // Tail engines
  set(m, -1, 0, -5, 3);
  set(m, 1, 0, -5, 3);
  if (v >= 3) {
    set(m, 0, 1, -5, 3);
  } // triple engine on higher variants
  // Hull details
  box(m, -1, 2, -1, 1, 2, 1, 2);
  return m;
}

function patternFrigate(v: number): VoxMap {
  // Medium warship: boxy hull, side gun pods, elevated bridge
  const m: VoxMap = new Map();
  // Main hull
  box(m, -2, 0, -5, 2, 1, 5, 1);
  // Side outrigger pods
  box(m, -4, 0, -2, -3, 0, 2, 2);
  box(m, 3, 0, -2, 4, 0, 2, 2);
  // Gun emplacements
  set(m, -4, 1, 0, 4);
  set(m, 4, 1, 0, 4);
  // Bridge tower
  box(m, -1, 2, 0, 1, 3, 1, 2);
  set(m, 0, 4, 0, 5);
  // Forward weapons
  set(m, -1, 0, 6, 4);
  set(m, 1, 0, 6, 4);
  // Nose
  box(m, -1, 0, 5, 1, 1, 6, 1);
  // Engines
  set(m, -2, 0, -6, 3);
  set(m, 0, 0, -6, 3);
  set(m, 2, 0, -6, 3);
  // Variant extras
  if (v >= 3) {
    box(m, -2, 2, -2, 2, 2, 0, 2);
  } // extra hull ridge
  if (v >= 4) {
    set(m, -2, 1, 5, 4);
    set(m, 2, 1, 5, 4);
  } // more guns
  return m;
}

function patternLightCruiser(v: number): VoxMap {
  // Heavy cruiser: wide hull, prominent bridge, multiple turrets
  const m: VoxMap = new Map();
  // Wide main hull
  box(m, -3, 0, -6, 3, 2, 6, 1);
  // Raised command section
  box(m, -2, 3, -2, 2, 4, 3, 2);
  set(m, 0, 5, 1, 5); // bridge dome
  // Heavy wing sections
  box(m, -5, 0, -2, -4, 1, 2, 2);
  box(m, 4, 0, -2, 5, 1, 2, 2);
  // Turrets (4 primary)
  set(m, -3, 3, 2, 4);
  set(m, 3, 3, 2, 4);
  set(m, -3, 3, -2, 4);
  set(m, 3, 3, -2, 4);
  // Prow
  box(m, -2, 0, 7, 2, 1, 8, 1);
  set(m, 0, 1, 8, 4);
  // Engines (wide stern)
  set(m, -3, 0, -7, 3);
  set(m, -1, 0, -7, 3);
  set(m, 1, 0, -7, 3);
  set(m, 3, 0, -7, 3);
  if (v === 2) {
    // Leviathan — extra shield generators
    set(m, -4, 2, 0, 3);
    set(m, 4, 2, 0, 3);
  }
  if (v === 4) {
    // Forge Cruiser — heavy railgun
    box(m, -1, 3, 4, 1, 3, 8, 4);
  }
  return m;
}

function patternDestroyer(v: number): VoxMap {
  // Long narrow fast killer: forward cannon, swept hull
  const m: VoxMap = new Map();
  // Slender central hull
  box(m, -1, 0, -7, 1, 1, 7, 1);
  box(m, -2, 0, -3, 2, 1, 3, 1);
  // Spine/ridge
  box(m, 0, 2, -4, 0, 2, 4, 2);
  // Swept fins
  box(m, -3, 0, -4, -2, 0, -1, 2);
  box(m, 2, 0, -4, 3, 0, -1, 2);
  // Heavy frontal cannon
  box(m, -1, 0, 8, 1, 0, 9, 4);
  set(m, 0, 0, 10, 4);
  // Engine pods
  box(m, -2, 0, -8, -1, 0, -7, 3);
  box(m, 1, 0, -8, 2, 0, -7, 3);
  set(m, 0, 1, -8, 3); // central exhaust
  if (v === 3) {
    // Storm Destroyer — EMP wing spikes
    set(m, -4, 1, 0, 4);
    set(m, 4, 1, 0, 4);
  }
  if (v === 5) {
    // Tempest Destroyer — dual cannons
    set(m, -2, 0, 9, 4);
    set(m, 2, 0, 9, 4);
  }
  return m;
}

// ─ Capital ship patterns ────────────────────────────────

function patternCapitalDestroyer(): VoxMap {
  // Military destroyer: long hull, aggressive spine, quad engines
  const m: VoxMap = new Map();
  box(m, -2, 0, -9, 2, 2, 9, 1);
  box(m, -1, 3, -6, 1, 4, 5, 2); // upper spine
  box(m, -4, 0, -5, -3, 1, 3, 2); // port wing
  box(m, 3, 0, -5, 4, 1, 3, 2); // starboard wing
  set(m, -4, 1, 0, 4);
  set(m, 4, 1, 0, 4); // wing guns
  box(m, -2, 0, 10, 2, 1, 12, 1); // bow extension
  set(m, 0, 2, 12, 4); // primary cannon
  // Engines
  set(m, -2, 0, -10, 3);
  set(m, 0, 0, -10, 3);
  set(m, 2, 0, -10, 3);
  set(m, 0, 2, -10, 3);
  return m;
}

function patternCapitalCruiser(): VoxMap {
  // Heavy cruiser: wide command deck, broadside cannons, carrier bay
  const m: VoxMap = new Map();
  box(m, -4, 0, -8, 4, 2, 8, 1);
  box(m, -3, 3, -4, 3, 5, 4, 2); // command tower
  set(m, 0, 6, 2, 5); // bridge dome
  // Broadside turret rows
  set(m, -5, 2, -4, 4);
  set(m, -5, 2, 0, 4);
  set(m, -5, 2, 4, 4);
  set(m, 5, 2, -4, 4);
  set(m, 5, 2, 0, 4);
  set(m, 5, 2, 4, 4);
  box(m, -5, 0, -4, -4, 1, 4, 2);
  box(m, 4, 0, -4, 5, 1, 4, 2);
  // Bow
  box(m, -3, 0, 9, 3, 1, 11, 1);
  set(m, -2, 1, 11, 4);
  set(m, 2, 1, 11, 4);
  // Stern engines
  set(m, -4, 0, -9, 3);
  set(m, -2, 0, -9, 3);
  set(m, 0, 0, -9, 3);
  set(m, 2, 0, -9, 3);
  set(m, 4, 0, -9, 3);
  return m;
}

function patternCapitalBomber(): VoxMap {
  // Heavy bomber: thick armoured hull, bomb-bay underside, two engine pods
  const m: VoxMap = new Map();
  box(m, -3, 0, -7, 3, 3, 7, 1);
  box(m, -2, 4, -3, 2, 5, 3, 2); // cockpit section
  set(m, 0, 6, 1, 5); // canopy
  // Bomb bay doors (accents)
  box(m, -2, -1, -4, 2, -1, 4, 2);
  // Torpedo launchers
  set(m, -2, -1, 8, 4);
  set(m, 0, -1, 8, 4);
  set(m, 2, -1, 8, 4);
  // Wide engine nacelles
  box(m, -5, 0, -6, -4, 1, 2, 2);
  box(m, 4, 0, -6, 5, 1, 2, 2);
  set(m, -5, 0, -7, 3);
  set(m, 5, 0, -7, 3);
  set(m, -3, 0, -8, 3);
  set(m, 3, 0, -8, 3);
  return m;
}

function patternCapitalBattleship(): VoxMap {
  // Apex dreadnought: imposing multi-deck fortress ship
  const m: VoxMap = new Map();
  box(m, -5, 0, -12, 5, 3, 12, 1);
  box(m, -4, 4, -8, 4, 7, 6, 2); // upper citadel
  box(m, -3, 8, -4, 3, 9, 3, 2); // flag tower
  set(m, 0, 10, 1, 5); // command dome
  // Main gun turrets (3 rows)
  set(m, -5, 4, 8, 4);
  set(m, 5, 4, 8, 4);
  set(m, -5, 4, 0, 4);
  set(m, 5, 4, 0, 4);
  set(m, -5, 4, -6, 4);
  set(m, 5, 4, -6, 4);
  // Super-heavy bow cannon
  box(m, -2, 2, 13, 2, 3, 16, 4);
  set(m, 0, 2, 17, 4);
  // Side wing sections
  box(m, -7, 0, -6, -6, 2, 4, 2);
  box(m, 6, 0, -6, 7, 2, 4, 2);
  // Massive engine array
  for (let ex = -4; ex <= 4; ex += 2) {
    set(m, ex, 0, -13, 3);
    if (Math.abs(ex) <= 2) set(m, ex, 2, -13, 3);
  }
  return m;
}

// ── Public API ────────────────────────────────────

const PATTERN_FNS: Record<string, (v: number) => VoxMap> = {
  worker: (v) => (v === 0 ? patternWorkerDrone() : patternEnergySkimmer()),
  corvette: patternCorvette,
  frigate: patternFrigate,
  light_cruiser: patternLightCruiser,
  destroyer: patternDestroyer,
  // Capital ship fallbacks (used if FBX fails to load)
  capital_destroyer: () => patternCapitalDestroyer(),
  capital_cruiser: () => patternCapitalCruiser(),
  capital_bomber: () => patternCapitalBomber(),
  capital_battleship: () => patternCapitalBattleship(),
};

// Map ship type key → (patternClass, variant)
// Capital ships use their FBX/GLB models from CAPITAL_PREFABS.
// Voxel fallbacks for capitals are only built on demand via buildCapitalVoxelFallback().
const SHIP_TYPE_MAP: Record<string, [string, number]> = {
  mining_drone: ['worker', 0],
  energy_skimmer: ['worker', 1],
  cf_corvette_01: ['corvette', 1],
  cf_corvette_02: ['corvette', 2],
  cf_corvette_03: ['corvette', 3],
  cf_corvette_04: ['corvette', 4],
  cf_corvette_05: ['corvette', 5],
  cf_frigate_01: ['frigate', 1],
  cf_frigate_02: ['frigate', 2],
  cf_frigate_03: ['frigate', 3],
  cf_frigate_04: ['frigate', 4],
  cf_frigate_05: ['frigate', 5],
  cf_light_cruiser_01: ['light_cruiser', 1],
  cf_light_cruiser_02: ['light_cruiser', 2],
  cf_light_cruiser_03: ['light_cruiser', 3],
  cf_light_cruiser_04: ['light_cruiser', 4],
  cf_light_cruiser_05: ['light_cruiser', 5],
  cf_destroyer_01: ['destroyer', 1],
  cf_destroyer_02: ['destroyer', 2],
  cf_destroyer_03: ['destroyer', 3],
  cf_destroyer_04: ['destroyer', 4],
  cf_destroyer_05: ['destroyer', 5],
};

/** Returns true if this ship type has a procedural voxel mesh available */
export function hasVoxelShip(shipType: string): boolean {
  return shipType in SHIP_TYPE_MAP;
}

/** Builds a coloured voxel Three.Group for the given ship type + team.
 *  Oriented so the nose points in the +Z direction (same as cone placeholder). */
export function buildVoxelShip(shipType: string, team: number): THREE.Group | null {
  const entry = SHIP_TYPE_MAP[shipType];
  if (!entry) return null;
  const [cls, variant] = entry;
  const fn = PATTERN_FNS[cls];
  if (!fn) return null;

  const voxMap = fn(variant);

  // Scale voxels so they match the placeholder cone size for the class
  const scales: Record<string, number> = {
    worker: 0.8,
    corvette: 0.9,
    frigate: 1.0,
    light_cruiser: 1.1,
    destroyer: 1.0,
  };
  return buildGroup(voxMap, team, scales[cls] ?? 1.0);
}

/** Capital ship voxel fallback — only called when FBX/GLB fails to load.
 *  Maps capital ship type keys to their procedural voxel patterns. */
const CAPITAL_VOXEL_MAP: Record<string, string> = {
  destroyer: 'capital_destroyer',
  cruiser: 'capital_cruiser',
  bomber: 'capital_bomber',
  battleship: 'capital_battleship',
};

export function buildCapitalVoxelFallback(shipType: string, team: number): THREE.Group | null {
  const cls = CAPITAL_VOXEL_MAP[shipType];
  if (!cls) return null;
  const fn = PATTERN_FNS[cls];
  if (!fn) return null;
  return buildGroup(fn(1), team, 1.2);
}

/** Build a voxel group from raw VoxMap data — exposed for the Ship Forge editor. */
export { buildGroup };

// ── Sprite-to-Voxel Converter ─────────────────────────────────────────────
// Reads a 2D sprite PNG, samples pixels, extrudes voxel columns by brightness.
// Produces a real 3D voxel model matching the MagicaVoxel ship art style.

interface VoxelColor {
  r: number;
  g: number;
  b: number;
  h: number;
}

/**
 * Load an image, sample its pixels, and build a 3D voxel ship model.
 * @param imagePath  URL to the sprite PNG
 * @param team       Team number for tinting
 * @param gridRes    How many voxels across the longest axis (default 20)
 * @param maxHeight  Max extrusion height in voxels (default 4)
 */
export async function buildVoxelFromSprite(imagePath: string, team: number, gridRes = 20, maxHeight = 4): Promise<THREE.Group> {
  const img = await loadImage(imagePath);
  const pixels = samplePixels(img, gridRes, maxHeight);
  const group = buildColorVoxelGroup(pixels, team, maxHeight);
  return group;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function samplePixels(img: HTMLImageElement, gridRes: number, maxH: number): VoxelColor[][] {
  const canvas = document.createElement('canvas');
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h).data;

  // Determine sampling step so longest axis = gridRes
  const longestAxis = Math.max(w, h);
  const step = Math.max(1, Math.floor(longestAxis / gridRes));
  const cols = Math.ceil(w / step);
  const rows = Math.ceil(h / step);

  const grid: VoxelColor[][] = [];
  for (let gy = 0; gy < rows; gy++) {
    const row: VoxelColor[] = [];
    for (let gx = 0; gx < cols; gx++) {
      // Average the pixels in this cell
      let rSum = 0,
        gSum = 0,
        bSum = 0,
        aSum = 0,
        count = 0;
      for (let py = gy * step; py < Math.min((gy + 1) * step, h); py++) {
        for (let px = gx * step; px < Math.min((gx + 1) * step, w); px++) {
          const i = (py * w + px) * 4;
          const a = data[i + 3] / 255;
          if (a < 0.2) continue; // skip transparent
          rSum += data[i] * a;
          gSum += data[i + 1] * a;
          bSum += data[i + 2] * a;
          aSum += a;
          count++;
        }
      }
      if (count === 0 || aSum < 0.3) {
        row.push({ r: 0, g: 0, b: 0, h: 0 }); // transparent = no voxel
      } else {
        const r = rSum / aSum / 255;
        const g = gSum / aSum / 255;
        const b = bSum / aSum / 255;
        // Height from luminance: brighter pixels = taller extrusion
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const height = Math.max(1, Math.round(lum * maxH + 0.5));
        row.push({ r, g, b, h: height });
      }
    }
    grid.push(row);
  }
  return grid;
}

function buildColorVoxelGroup(grid: VoxelColor[][], team: number, maxHeight: number): THREE.Group {
  const group = new THREE.Group();
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return group;

  // Team tint blend
  const teamHex = TEAM_COLORS[team] ?? 0x4488ff;
  const teamCol = new THREE.Color(teamHex);

  // Collect unique-ish colors (quantize to reduce draw calls)
  const buckets = new Map<string, { color: THREE.Color; positions: [number, number, number][] }>();

  const halfX = cols / 2;
  const halfZ = rows / 2;

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const px = grid[gy][gx];
      if (px.h === 0) continue;

      // Quantize color to 4-bit per channel for batching
      const qr = Math.round(px.r * 15) / 15;
      const qg = Math.round(px.g * 15) / 15;
      const qb = Math.round(px.b * 15) / 15;
      // Blend 25% team color into the pixel color
      const finalCol = new THREE.Color(qr, qg, qb).lerp(teamCol, 0.25);
      const colorKey = `${(finalCol.r * 15) | 0},${(finalCol.g * 15) | 0},${(finalCol.b * 15) | 0}`;

      if (!buckets.has(colorKey)) {
        buckets.set(colorKey, { color: finalCol.clone(), positions: [] });
      }
      const bucket = buckets.get(colorKey)!;

      // Voxel column: extrude upward from y=0 to y=px.h
      const x = gx - halfX;
      const z = gy - halfZ;
      for (let y = 0; y < px.h; y++) {
        // Darken lower layers slightly for depth
        bucket.positions.push([x, y, -z]); // -z so sprite "top" = forward (+Z)
      }
    }
  }

  // Build InstancedMesh per color bucket
  const voxelSize = 1.0;
  const geo = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);

  for (const [, bucket] of buckets) {
    if (bucket.positions.length === 0) continue;
    const mat = new THREE.MeshStandardMaterial({
      color: bucket.color,
      emissive: bucket.color.clone().multiplyScalar(0.3),
      emissiveIntensity: 0.35,
      roughness: 0.55,
      metalness: 0.3,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, bucket.positions.length);
    const dummy = new THREE.Object3D();
    bucket.positions.forEach(([x, y, z], i) => {
      dummy.position.set(x * voxelSize, y * voxelSize, z * voxelSize);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  }

  // Centre the group
  const bb = new THREE.Box3().setFromObject(group);
  const centre = bb.getCenter(new THREE.Vector3());
  group.children.forEach((c) => c.position.sub(centre));

  return group;
}

// ── Sprite ship paths for voxel conversion ──────────────────────────
export const SPRITE_TO_VOXEL_SHIPS: Record<string, string> = {
  pirate_01: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_01.png',
  pirate_02: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_02.png',
  pirate_03: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_03.png',
  pirate_04: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_04.png',
  pirate_05: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_05.png',
  pirate_06: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_06.png',
  boss_captain_01: '/assets/space/sprites/boss-ships/PNG/Boss_01/Boss_Full.png',
  boss_captain_02: '/assets/space/sprites/boss-ships/PNG/Boss_02/Boss_Full.png',
  boss_captain_03: '/assets/space/sprites/boss-ships/PNG/Boss_03/Boss_Full.png',
};
