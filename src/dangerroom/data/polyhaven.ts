/**
 * Poly Haven CC0 assets served from their CDN (1k — optimized for web).
 * @see https://polyhaven.com/license
 */

const TEX = "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k";
const GLTF = "https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k";

export interface PolyTextureSet {
  slug: string;
  color: string;
  normal: string;
  roughness: string;
}

export function polyTexture(slug: string): PolyTextureSet {
  const base = `${TEX}/${slug}`;
  return {
    slug,
    color: `${base}/${slug}_diff_1k.jpg`,
    normal: `${base}/${slug}_nor_gl_1k.jpg`,
    roughness: `${base}/${slug}_rough_1k.jpg`,
  };
}

/** Curated terrain sets — grass, beach sand, cliff rock, alpine snow. */
export const TERRAIN_POLY_SETS = {
  grass: polyTexture("grass_medium_01"),
  sand: polyTexture("sand_01"),
  rock: polyTexture("rock_face"),
  snow: polyTexture("snow_01"),
} as const;

export interface PolyModelDef {
  name: string;
  url: string;
  height: number;
  collider: "box" | "cylinder" | "none";
}

function polyModel(name: string, height: number, collider: PolyModelDef["collider"]): PolyModelDef {
  return {
    name,
    url: `${GLTF}/${name}/${name}_1k.glb`,
    height,
    collider,
  };
}

/** Low-poly environment kit — rocks, cliff faces, fallen logs. */
export const POLY_ROCKS: PolyModelDef[] = [
  polyModel("rock_01", 1.4, "box"),
  polyModel("rock_02", 1.8, "box"),
  polyModel("rock_03", 2.2, "box"),
  polyModel("rock_04", 2.8, "box"),
];

export const POLY_CLIFFS: PolyModelDef[] = [
  polyModel("cliff_01", 5.5, "box"),
  polyModel("cliff_02", 6.2, "box"),
];

export const POLY_LOGS: PolyModelDef[] = [
  polyModel("dead_tree_log", 1.2, "cylinder"),
];