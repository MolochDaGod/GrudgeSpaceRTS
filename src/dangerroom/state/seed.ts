/**
 * Global map seed + deterministic PRNG helpers.
 *
 * A single seed drives terrain noise, faction-zone rotation, scatter (rocks /
 * trees / props), and enemy spawns. Same seed → same world; changing the seed
 * produces a meaningfully different landscape. Bump / randomize `MAP_SEED` to
 * reroll the world.
 */
export const MAP_SEED = 0xa17c3f;

/** Deterministic 32-bit PRNG. Returns a function yielding floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A `{ random }` shim so seeded PRNGs can drive three's SimplexNoise permutation. */
export function rngShim(seed: number): { random: () => number } {
  return { random: mulberry32(seed) };
}

/** Hash two integer-ish coordinates + a salt into a stable float in [0, 1). */
export function hash2(x: number, z: number, salt = 0): number {
  let h = (Math.imul(Math.floor(x) | 0, 374761393) ^
    Math.imul(Math.floor(z) | 0, 668265263) ^
    Math.imul(salt | 0, 2246822519)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Derive a child seed from the global seed + a string tag (stable across runs). */
export function childSeed(tag: string, base = MAP_SEED): number {
  let h = base >>> 0;
  for (let i = 0; i < tag.length; i++) {
    h = Math.imul(h ^ tag.charCodeAt(i), 16777619) >>> 0;
  }
  return h >>> 0;
}
