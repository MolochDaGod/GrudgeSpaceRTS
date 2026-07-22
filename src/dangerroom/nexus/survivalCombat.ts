/**
 * Survival combat kit — abilities derived from Nexus stats / origin,
 * not class roles (no knight/warrior/mage/ranger).
 */

import type { Ability, ClassDef, ResourceType } from "../data/types";
import type { NexusStats } from "./attributes";
import { poolsFromNexus, primaryResourceFromStats } from "./attributes";
import type { NexusOrigin } from "./origins";

function ability(
  partial: Ability,
): Ability {
  return partial;
}

/** Build 5 survival skills scaled by stats. */
export function buildSurvivalAbilities(stats: NexusStats, origin: NexusOrigin): Ability[] {
  const pools = poolsFromNexus(stats);
  const phys = pools.physicalDamage;
  const tech = pools.techDamage;
  const kin = stats.kin;
  const qnt = stats.qnt;
  const neu = stats.neu;
  const bio = stats.bio;

  return [
    ability({
      id: "strike",
      name: kin >= qnt ? "Kinetic Strike" : "Pulse Strike",
      key: "1",
      cooldown: 1.0,
      cost: 10,
      effect: kin >= qnt ? "melee" : "ranged",
      range: kin >= qnt ? 3.2 : 12,
      power: Math.round(14 + (kin >= qnt ? phys : tech) * 0.45),
      description: "Primary attack shaped by your strongest axis.",
      color: kin >= qnt ? "#ff9800" : "#9c27b0",
      animation: "attack",
      mm: kin >= qnt ? 70 : -20,
    }),
    ability({
      id: "power",
      name: "Overload",
      key: "2",
      cooldown: 4.2,
      cost: 26,
      effect: kin + stats.ent >= qnt + neu ? "melee" : "ranged",
      range: kin + stats.ent >= qnt + neu ? 3.4 : 14,
      power: Math.round(22 + Math.max(phys, tech) * 0.7),
      description: "Heavy commitment — drains stamina/focus hard.",
      color: "#f44336",
      animation: "attack",
      mm: 85,
    }),
    ability({
      id: "guard",
      name: bio + stats.ent >= 3 ? "Field Guard" : "Phase Sidestep",
      key: "3",
      cooldown: 5.5,
      cost: 18,
      effect: bio + stats.ent >= 3 ? "shield" : "dash",
      range: bio + stats.ent >= 3 ? 0 : 5,
      power: bio + stats.ent >= 3 ? Math.round(20 + pools.armor * 0.4) : Math.round(8 + phys * 0.2),
      duration: 3,
      description: bio + stats.ent >= 3 ? "Raise a temporary shield." : "Burst reposition.",
      color: "#4caf50",
      animation: bio + stats.ent >= 3 ? "idle" : "jump",
      mm: bio + stats.ent >= 3 ? 0 : 40,
    }),
    ability({
      id: "utility",
      name: origin.id === "medic" ? "Field Patch" : origin.id === "engineer" ? "Hack Pulse" : "Scan Burst",
      key: "4",
      cooldown: 7,
      cost: 22,
      effect: origin.id === "medic" ? "heal" : origin.id === "engineer" ? "dot" : "buff",
      range: origin.id === "medic" ? 0 : 10,
      power: origin.id === "medic" ? Math.round(18 + bio * 6) : Math.round(12 + tech * 0.5),
      duration: 4,
      description: "Origin-flavored utility skill.",
      color: origin.id === "medic" ? "#66bb6a" : "#2196f3",
      animation: "attack",
      mm: -10,
    }),
    ability({
      id: "ultimate",
      name: "Survival Protocol",
      key: "5",
      cooldown: 12,
      cost: 40,
      effect: "dash",
      range: 7,
      power: Math.round(28 + Math.max(phys, tech) * 0.85 + stats.chr * 3),
      description: "All-in survival burst — gap close or execute.",
      color: "#ffc62a",
      animation: "attack",
      mm: 90,
    }),
  ];
}

/**
 * Synthetic ClassDef for systems that still expect abilities/animations.
 * Named after origin — never knight/mage/etc.
 */
export function buildSurvivorProfile(
  origin: NexusOrigin,
  stats: NexusStats,
  toonLabel: string,
): ClassDef {
  const pools = poolsFromNexus(stats);
  const prim = primaryResourceFromStats(stats);
  const abilities = buildSurvivalAbilities(stats, origin);

  return {
    id: "survivor" as ClassDef["id"],
    name: origin.label,
    title: `${toonLabel} · ${origin.emphasis}`,
    color: "#ffc62a",
    accentColor: "#ffe08a",
    resource: prim.resource as ResourceType,
    resourceLabel: prim.resourceLabel,
    maxHp: pools.maxHealth,
    maxResource: prim.maxResource,
    moveSpeed: pools.moveSpeed,
    weaponLabel: "Field Kit",
    bio: origin.description,
    idleAnimation: "idle",
    idleAnimations: ["idle"],
    runAnimation: "walk",
    sprintRunAnimation: "run",
    abilities,
  };
}
