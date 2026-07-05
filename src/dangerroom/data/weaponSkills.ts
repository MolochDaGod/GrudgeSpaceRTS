import type { Ability } from "./types";

/** Dangerroom combat bar — slots 1-5 plus R / V / Z specials. */
export interface WeaponSkillSlot {
  key: string;
  label: string;
  /** Ability id from classDef.abilities, or a built-in motion id. */
  skillId: string;
  kind: "ability" | "block" | "lunge" | "retreat";
}

export const BUILTIN_SKILLS = {
  block: { animation: "sword_block", cooldown: 2.2, cost: 8 },
  lunge: { animation: "sword_attack_c", cooldown: 3.5, cost: 22 },
  retreat: { animation: "sword_dash_attack", cooldown: 4, cost: 18 },
  special: { animation: "sword_combo_finisher", cooldown: 6, cost: 32 },
} as const;

export function defaultWeaponBar(abilities: Ability[]): WeaponSkillSlot[] {
  const byKey = Object.fromEntries(abilities.map((a) => [a.key, a]));
  return [
    { key: "1", label: byKey["1"]?.name ?? "Strike", skillId: byKey["1"]?.id ?? "slash", kind: "ability" },
    { key: "2", label: byKey["2"]?.name ?? "Power", skillId: byKey["2"]?.id ?? "power-strike", kind: "ability" },
    { key: "3", label: byKey["3"]?.name ?? "Bash", skillId: byKey["3"]?.id ?? "shield-bash", kind: "ability" },
    { key: "4", label: byKey["4"]?.name ?? "Dash", skillId: byKey["4"]?.id ?? "execute", kind: "ability" },
    { key: "5", label: byKey["5"]?.name ?? "Ult", skillId: byKey["5"]?.id ?? abilities[4]?.id ?? "slash", kind: "ability" },
    { key: "R", label: "Parry", skillId: "__block__", kind: "block" },
    { key: "V", label: "Special", skillId: byKey["2"]?.id ?? "__special__", kind: "ability" },
    { key: "Z", label: "Lunge", skillId: "__lunge__", kind: "lunge" },
  ];
}

export function resolveSkillAbility(slot: WeaponSkillSlot, abilities: Ability[]): Ability | null {
  if (slot.kind === "block") {
    const bash = abilities.find((a) => a.animation.includes("block") || a.id.includes("bash"));
    if (bash) return bash;
    return abilities[0] ?? null;
  }
  if (slot.kind === "lunge") {
    return abilities.find((a) => a.effect === "dash" || a.effect === "melee") ?? abilities[0] ?? null;
  }
  if (slot.kind === "retreat") {
    return abilities.find((a) => a.effect === "dash") ?? abilities[1] ?? null;
  }
  return abilities.find((a) => a.id === slot.skillId) ?? null;
}