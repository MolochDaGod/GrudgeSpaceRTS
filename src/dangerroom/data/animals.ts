/**
 * Huntable wildlife + livestock from the animated animal pack.
 * Every animal is a passive entity that roams and can be targeted/killed;
 * on death it drops a skin/pelt (see gameStore animal-kill path).
 */

const ANIMAL_BASE = `${import.meta.env.BASE_URL}models/animals/`;

export interface AnimalDef {
  species: string;
  file: string;
  height: number;
  maxHp: number;
  loot: string;
  domestic: boolean;
  /** Fuzzy animation name hints for AnimatedModel. */
  idleHints?: string[];
  moveHints?: string[];
  /** Some species flee when damaged; wolves may aggro. */
  temperament: "passive" | "skittish" | "predator";
}

function animal(
  species: string,
  height: number,
  maxHp: number,
  loot: string,
  domestic: boolean,
  temperament: AnimalDef["temperament"],
  idleHints?: string[],
  moveHints?: string[],
): AnimalDef {
  return {
    species,
    file: `${ANIMAL_BASE}${species}.gltf`,
    height,
    maxHp,
    loot,
    domestic,
    temperament,
    idleHints,
    moveHints,
  };
}

export const WILD_ANIMALS: AnimalDef[] = [
  animal("Deer", 1.5, 60, "Deer Hide", false, "skittish", ["idle", "graze", "eat"], ["walk", "trot"]),
  animal("Stag", 1.8, 95, "Stag Pelt", false, "skittish", ["idle", "graze"], ["walk", "run"]),
  animal("Fox", 0.5, 35, "Fox Fur", false, "skittish", ["idle", "sit"], ["walk", "run"]),
  animal("Wolf", 0.9, 75, "Wolf Pelt", false, "predator", ["idle"], ["walk", "run"]),
  animal("Husky", 0.65, 55, "Husky Fur", false, "passive", ["idle", "sit"], ["walk", "run"]),
  animal("ShibaInu", 0.42, 40, "Shiba Pelt", false, "passive", ["idle", "sit"], ["walk", "trot"]),
];

export const FARM_ANIMALS: AnimalDef[] = [
  animal("Cow", 1.6, 120, "Cowhide", true, "passive", ["idle", "eat", "graze"], ["walk"]),
  animal("Bull", 1.8, 150, "Bull Leather", true, "passive", ["idle", "eat"], ["walk"]),
  animal("Alpaca", 1.4, 80, "Alpaca Wool", true, "passive", ["idle", "graze"], ["walk"]),
  animal("Donkey", 1.4, 90, "Donkey Hide", true, "passive", ["idle"], ["walk", "trot"]),
  animal("Horse_White", 1.7, 130, "Horsehide", true, "passive", ["idle"], ["walk", "gallop", "trot"]),
];

/** Random open-world encounter table (weighted roamers). */
export const ENCOUNTER_ANIMALS: AnimalDef[] = [...WILD_ANIMALS];

export const ALL_ANIMALS: AnimalDef[] = [...WILD_ANIMALS, ...FARM_ANIMALS];

export function animalBySpecies(species: string): AnimalDef | undefined {
  return ALL_ANIMALS.find((a) => a.species === species);
}

export const HORSE_MODEL = `${ANIMAL_BASE}Horse.gltf`;