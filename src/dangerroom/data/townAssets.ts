/**
 * Real building/prop kits staged under public/models/world. Two of the packs are
 * "kits" (many named pieces inside one GLB) and one is a whole pre-built town
 * scene. `KitPiece` extracts a single named node from a kit GLB and normalizes it
 * to a world height; `GltfProp` places a whole GLB. Node names below are the exact
 * object names inside each source GLB.
 */

const WORLD_BASE = `${import.meta.env.BASE_URL}models/world/`;

export const CASTLE_TOWN_URL = `${WORLD_BASE}castle_town.glb`;
export const VILLAGE_KIT_URL = `${WORLD_BASE}village_pack.glb`;
export const ORC_KIT_URL = `${WORLD_BASE}orc_set.glb`;

export interface KitPieceDef {
  node: string;
  /** Target world height in metres after normalization. */
  height: number;
  collider: "box" | "cylinder" | "none";
}

// --- Village kit (small_time_town village pack) -----------------------------
export const VILLAGE_HOUSES: KitPieceDef[] = [
  { node: "House_Red", height: 4.6, collider: "box" },
  { node: "House_Blue", height: 4.6, collider: "box" },
  { node: "House_Purple", height: 4.6, collider: "box" },
  { node: "House_2Story_Purple", height: 6.2, collider: "box" },
];

export const VILLAGE_MARKET: KitPieceDef[] = [
  { node: "Market Stall Red", height: 2.8, collider: "box" },
  { node: "Market Stall Blue", height: 2.8, collider: "box" },
  { node: "Fountain", height: 2.4, collider: "cylinder" },
  { node: "Barrell", height: 1.0, collider: "none" },
  { node: "Crate", height: 0.9, collider: "none" },
];

export const VILLAGE_FARM: KitPieceDef[] = [
  { node: "Windmill", height: 9.5, collider: "cylinder" },
  { node: "Farm_Wheat", height: 1.1, collider: "none" },
  { node: "Hay_Cart", height: 1.8, collider: "box" },
  { node: "Hay_Pile", height: 1.2, collider: "box" },
  { node: "Well", height: 2.2, collider: "cylinder" },
  { node: "Fence", height: 1.0, collider: "none" },
];

// --- Orc kit (orc RTS building set) -----------------------------------------
export const ORC_BUILDINGS: KitPieceDef[] = [
  { node: "orc_cabin", height: 5.2, collider: "box" },
  { node: "orc_altar", height: 3.4, collider: "box" },
];

export const ORC_PROPS: KitPieceDef[] = [
  { node: "orc_campfire", height: 1.2, collider: "none" },
  { node: "orc_barrel", height: 1.1, collider: "none" },
  { node: "orc_flag_red", height: 4.2, collider: "none" },
  { node: "orc_drum_big", height: 1.4, collider: "none" },
  { node: "orc_box_large_1", height: 1.2, collider: "box" },
  { node: "orc_beam_pile", height: 1.0, collider: "none" },
];
