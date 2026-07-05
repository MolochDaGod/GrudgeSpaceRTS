import { assetUrl } from "../config/assets";

/**
 * Curated real R2 assets used to dress the world. Paths are confirmed to exist in
 * the `grudge-assets` bucket and are grouped into coherent low-poly kits so the
 * scene reads consistently. Every asset is loaded through the normalizing
 * `GltfProp` loader, which rescales it to a target world height and drops it onto
 * the terrain regardless of the source model's native units.
 */
export interface AssetDef {
  url: string;
  /** Desired world height in metres after normalization. */
  height: number;
  collider: "cylinder" | "box" | "none";
}

function def(path: string, height: number, collider: AssetDef["collider"]): AssetDef {
  return { url: assetUrl(path), height, collider };
}

// Living trees (Crusade / Fabled biomes).
export const TREE_ASSETS: AssetDef[] = [
  def("cubeworld-environment/0bcaff5a-0f25-4371-9c92-6ab3452d9c8e/Tree_1.glb", 6.5, "cylinder"),
  def("cubeworld-environment/74b21a6b-300f-4567-b1e9-c8133e1acad7/Tree_2.glb", 7, "cylinder"),
  def("cubeworld-environment/e2f924d0-714d-43e0-abb4-850a4de5b68e/Tree_3.glb", 5.8, "cylinder"),
  def("game-assets/glb/oak_tree.glb", 7.5, "cylinder"),
];

// Dead trees (Legion biome — bleaker theming).
export const DEAD_TREE_ASSETS: AssetDef[] = [
  def("cubeworld-environment/dae32cbe-1e8c-43cb-9348-96ca41d283a0/DeadTree_1.glb", 6, "cylinder"),
  def("cubeworld-environment/74b77215-bd77-4a47-b361-18628ad488d9/DeadTree_2.glb", 5.5, "cylinder"),
  def("cubeworld-environment/319a5ed4-0496-41f3-b558-07ca063e11b3/DeadTree_3.glb", 6.2, "cylinder"),
];

// Boulders / rock outcrops.
export const ROCK_ASSETS: AssetDef[] = [
  def("assets/items/pirate-kit-glb/rock.glb", 1.6, "box"),
  def("assets/items/pirate-kit-glb/rock-4vhwf8xubn.glb", 2.2, "box"),
  def("assets/items/pirate-kit-glb/rock-6cyts1cpil.glb", 1.9, "box"),
  def("assets/items/pirate-kit-glb/rock-bvlfuhfaui.glb", 2.6, "box"),
];

// Town buildings (neutral hub).
export const BUILDING_ASSETS: AssetDef[] = [
  def("assets/items/pirate-kit-glb/house.glb", 5.5, "box"),
  def("assets/items/pirate-kit-glb/house-2kytqgs4rh.glb", 6, "box"),
  def("assets/items/pirate-kit-glb/house-g7esjlfi4v.glb", 5, "box"),
  def("game-assets/environment/benches/ummorpg/blacksmith-building.glb", 5.5, "box"),
];

// Small town decor props.
export const PROP_ASSETS: AssetDef[] = [
  def("asset-packs/extracted-2026-06/v1/environment/props/OutdoorDecorations_Pack/OutdoorDecorations_Pack/glTF/Bench1.glb", 0.9, "box"),
  def("asset-packs/extracted-2026-06/v1/environment/props/OutdoorDecorations_Pack/OutdoorDecorations_Pack/glTF/Chair1.glb", 0.9, "box"),
];

export const ALL_WORLD_ASSETS: AssetDef[] = [
  ...TREE_ASSETS,
  ...DEAD_TREE_ASSETS,
  ...ROCK_ASSETS,
  ...BUILDING_ASSETS,
  ...PROP_ASSETS,
];
