import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { rngShim, childSeed } from "./seed";
import { factionAt } from "./zones";
import { islandAt, smoothstep, SEABED, SEA_LEVEL } from "./islands";

// Seed-driven noise fields. Passing a seeded PRNG shim to SimplexNoise makes the
// permutation table deterministic *and* seed-dependent, so a new MAP_SEED yields a
// genuinely different landscape rather than a reshuffle of the same hills.
const detailNoise = new SimplexNoise(rngShim(childSeed("terrain-detail")));
const ridgeNoise = new SimplexNoise(rngShim(childSeed("terrain-ridge")));
const warpNoise = new SimplexNoise(rngShim(childSeed("terrain-warp")));

export const CHUNK_SIZE = 60;
export const CHUNK_SEGMENTS = 24;
export const VIEW_DISTANCE = 2;

// Flat spawn plaza carved into the neutral hub island so the starting town and
// training dummies sit on level ground.
const PLAZA_RADIUS = 34;
const PLAZA_FALLOFF = 20;
const PLAZA_HEIGHT = 2;

function rawHeight(x: number, z: number): number {
  const { mask, island } = islandAt(x, z);

  // Open ocean floor: gentle undulation well below sea level.
  if (mask <= 0 || !island) {
    const nd = detailNoise.noise(x * 0.01, z * 0.01);
    return SEABED + nd * 1.5;
  }

  // Domain warp for organic, less grid-aligned inland shapes.
  const wx = x + warpNoise.noise(x * 0.008, z * 0.008) * 22;
  const wz = z + warpNoise.noise(x * 0.008 + 50, z * 0.008 + 50) * 22;

  const hills = detailNoise.noise(wx * 0.02 + 100, wz * 0.02 + 100) * 3;
  const fine = detailNoise.noise(wx * 0.075 - 200, wz * 0.075 - 200) * 0.8;
  const r = ridgeNoise.noise(wx * 0.013, wz * 0.013);
  const ridged = (1 - Math.abs(r)) ** 2 * island.peak;

  // How far inland (0 at the shoreline, 1 in the island core).
  const inland = smoothstep(0.35, 0.85, mask);
  const shaped = 3 + hills * inland + fine * inland + ridged * Math.max(0, inland - 0.2);

  // Blend seabed -> land across the coast so the shoreline crosses sea level
  // smoothly instead of forming a wall.
  const land = smoothstep(0.32, 0.6, mask);
  return SEABED * (1 - land) + shaped * land;
}

export function getTerrainHeight(x: number, z: number): number {
  const h = rawHeight(x, z);
  const dist = Math.sqrt(x * x + z * z);
  if (dist <= PLAZA_RADIUS) return PLAZA_HEIGHT;
  if (dist >= PLAZA_RADIUS + PLAZA_FALLOFF) return h;
  const t = smoothstep(PLAZA_RADIUS, PLAZA_RADIUS + PLAZA_FALLOFF, dist);
  return PLAZA_HEIGHT * (1 - t) + h * t;
}

export function chunkKey(cx: number, cz: number): string {
  return `${cx}:${cz}`;
}

export function worldToChunk(x: number, z: number): [number, number] {
  return [Math.floor(x / CHUNK_SIZE + 0.5), Math.floor(z / CHUNK_SIZE + 0.5)];
}

function baseBiomeColor(height: number, plaza: boolean, slope: number): [number, number, number] {
  if (plaza) return [0.32, 0.4, 0.26];
  if (height < SEA_LEVEL - 0.4) return [0.52, 0.48, 0.38];
  if (height < 0.95) return [0.82, 0.74, 0.52];
  if (slope > 1.6 || (height > 8 && slope > 0.9)) return [0.55, 0.52, 0.46];
  if (height < 4.8) return [0.34, 0.48, 0.28];
  if (height < 11) return [0.42, 0.4, 0.34];
  if (height < 17) return [0.58, 0.55, 0.5];
  return [0.9, 0.92, 0.96];
}

/** Splat weights for terrain shader: sand, rock, snow (grass = remainder). */
export function biomeSplatWeights(x: number, z: number, height: number): [number, number, number] {
  const plaza = x * x + z * z <= PLAZA_RADIUS * PLAZA_RADIUS;
  const hx = getTerrainHeight(x + 1.2, z);
  const hz = getTerrainHeight(x, z + 1.2);
  const slope = Math.max(Math.abs(height - hx), Math.abs(height - hz));

  let sand = 0;
  let rock = 0;
  let snow = 0;

  if (!plaza) {
    if (height < SEA_LEVEL + 1.1 && height > SEA_LEVEL - 0.6) {
      sand = smoothstep(SEA_LEVEL - 0.4, SEA_LEVEL + 0.9, height);
    }
    if (slope > 1.1 || height > 8.5) {
      rock = Math.min(1, smoothstep(0.9, 1.8, slope) * 0.85 + smoothstep(7, 12, height) * 0.5);
    }
    if (height > 13.5) {
      snow = smoothstep(13, 17.5, height);
    }
  }

  const total = sand + rock + snow;
  if (total > 1) {
    const inv = 1 / total;
    return [sand * inv, rock * inv, snow * inv];
  }
  return [sand, rock, snow];
}

/** Biome colour blended with the controlling faction's territorial tint. */
export function biomeColor(x: number, z: number, height: number): [number, number, number] {
  const plaza = x * x + z * z <= PLAZA_RADIUS * PLAZA_RADIUS;
  const hx = getTerrainHeight(x + 1.2, z);
  const hz = getTerrainHeight(x, z + 1.2);
  const slope = Math.max(Math.abs(height - hx), Math.abs(height - hz));
  const [r, g, b] = baseBiomeColor(height, plaza, slope);
  const theme = factionAt(x, z);
  return [
    Math.min(1, Math.max(0, r + theme.tint[0])),
    Math.min(1, Math.max(0, g + theme.tint[1])),
    Math.min(1, Math.max(0, b + theme.tint[2])),
  ];
}
