/**
 * Nexus / Grudges toon characters — the baked Quaternius-style roster used by
 * survival (grudges.grudge-studio.com / arpg-game CharacterConfig).
 *
 * NOT grudge6 modular race kits. These are full clothed meshes with baked
 * animation clips, hosted on the asset CDN.
 *
 * Path: https://assets.grudge-studio.com/models/characters/{gender}/{id}.gltf
 */

import { assetUrl } from "../config/assets";

export type NexusGender = "male" | "female";

export type NexusToonId =
  // Male
  | "adventurer"
  | "beach"
  | "casual"
  | "casual-hoodie"
  | "farmer"
  | "king"
  | "punk"
  | "spacesuit"
  | "suit"
  | "swat"
  | "worker"
  // Female
  | "formal"
  | "medieval"
  | "scifi"
  | "soldier"
  | "witch";

export interface NexusToonDef {
  id: NexusToonId;
  gender: NexusGender;
  /** Display name on Ground select */
  label: string;
  icon: string;
  /** Suggested survival origin id */
  defaultOrigin: string;
  gltfPath: string;
}

function toon(
  id: NexusToonId,
  gender: NexusGender,
  label: string,
  icon: string,
  defaultOrigin: string,
): NexusToonDef {
  return {
    id,
    gender,
    label,
    icon,
    defaultOrigin,
    gltfPath: assetUrl(`models/characters/${gender}/${id}.gltf`),
  };
}

/**
 * Canonical Nexus toon roster (male + female packs baked for Grudges).
 * Matches survival CharacterConfig BODY_TYPES civilian set.
 */
export const NEXUS_TOONS: NexusToonDef[] = [
  // ── Male ────────────────────────────────────────────────────────────────
  toon("adventurer", "male", "Adventurer", "⚔️", "military"),
  toon("beach", "male", "Scout", "🏖️", "drifter"),
  toon("casual", "male", "Survivor", "🧥", "drifter"),
  toon("casual-hoodie", "male", "Scavenger", "🪝", "engineer"),
  toon("farmer", "male", "Settler", "🌾", "medic"),
  toon("king", "male", "Warlord", "👑", "military"),
  toon("punk", "male", "Raider", "💀", "military"),
  toon("spacesuit", "male", "Vanguard", "🚀", "scientist"),
  toon("suit", "male", "Commander", "🕴️", "scientist"),
  toon("swat", "male", "Enforcer", "🛡️", "military"),
  toon("worker", "male", "Builder", "🔧", "engineer"),
  // ── Female ──────────────────────────────────────────────────────────────
  toon("adventurer", "female", "Adventurer", "⚔️", "military"),
  toon("casual", "female", "Survivor", "🧥", "drifter"),
  toon("formal", "female", "Diplomat", "👗", "psionic"),
  toon("medieval", "female", "Knight", "🏰", "military"),
  toon("punk", "female", "Raider", "⚡", "military"),
  toon("scifi", "female", "Vanguard", "🚀", "scientist"),
  toon("soldier", "female", "Enforcer", "🪖", "military"),
  toon("suit", "female", "Commander", "💼", "scientist"),
  toon("witch", "female", "Witch", "🔮", "psionic"),
  toon("worker", "female", "Engineer", "🔧", "engineer"),
];

/** Stable key for store: `male:adventurer` */
export function toonKey(gender: NexusGender, id: string): string {
  return `${gender}:${id}`;
}

export function parseToonKey(key: string): { gender: NexusGender; id: string } | null {
  const i = key.indexOf(":");
  if (i < 0) return null;
  const gender = key.slice(0, i) as NexusGender;
  const id = key.slice(i + 1);
  if (gender !== "male" && gender !== "female") return null;
  return { gender, id };
}

export function getNexusToon(gender: NexusGender, id: string): NexusToonDef | undefined {
  return NEXUS_TOONS.find((t) => t.gender === gender && t.id === id);
}

export function getNexusToonByKey(key: string): NexusToonDef | undefined {
  const p = parseToonKey(key);
  if (!p) return undefined;
  return getNexusToon(p.gender, p.id);
}

/** Animation name fallbacks for Quaternius / UAL baked clips. */
export const NEXUS_TOON_ANIM_FALLBACKS: Record<string, string[]> = {
  idle: ["idle", "Idle", "Idle_Loop", "TPose", "A_Idle"],
  walk: ["walk", "Walk", "Walking", "walking", "A_Walk"],
  run: ["run", "Run", "Running", "running", "sprint", "A_Run"],
  jump: ["jump", "Jump", "A_Jump"],
  attack: ["attack", "Attack", "sword_combo", "Punch", "A_Attack"],
};
