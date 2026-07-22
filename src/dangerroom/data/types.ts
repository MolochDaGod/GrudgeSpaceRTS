export type ResourceType = "mana" | "stamina" | "focus";

export type AbilityEffect =
  | "melee"
  | "ranged"
  | "heal"
  | "shield"
  | "dot"
  | "buff"
  | "dash";

export interface Ability {
  id: string;
  name: string;
  key: string;
  cooldown: number;
  cost: number;
  effect: AbilityEffect;
  range: number;
  power: number;
  duration?: number;
  description: string;
  color: string;
  animation: string;
  /** Melee momentum: +100 close-gap … -100 keep-distance. */
  mm?: number;
}

/** Combat profile id — survival ground uses `survivor` only (no class roles). */
export type ClassKind = "survivor" | "knight" | "warrior" | "mage" | "ranger";

export interface ClassDef {
  id: ClassKind;
  name: string;
  title: string;
  color: string;
  accentColor: string;
  resource: ResourceType;
  resourceLabel: string;
  maxHp: number;
  maxResource: number;
  moveSpeed: number;
  weaponLabel: string;
  bio: string;
  idleAnimation: string;
  idleAnimations?: string[];
  /** Looping locomotion clip while moving (not sprinting). */
  runAnimation: string;
  /** Faster locomotion while holding sprint; falls back in Character if missing. */
  sprintRunAnimation?: string;
  abilities: Ability[];
}

export interface RaceDef {
  id: string;
  name: string;
  faction: string;
  modelFolder: string;
  modelPrefix: string;
  blurb: string;
}

export interface EnemyRaceDef {
  id: string;
  name: string;
  faction: string;
  modelFolder: string;
  modelPrefix: string;
}
