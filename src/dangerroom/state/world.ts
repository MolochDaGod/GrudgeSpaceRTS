import * as THREE from "three";
import { childSeed, mulberry32 } from "./seed";
import { CAMPS, FARMS, pointOnIsland } from "./settlements";
import { FARM_ANIMALS, WILD_ANIMALS, ENCOUNTER_ANIMALS, type AnimalDef } from "../data/animals";
import { BOSS_SPAWNS } from "../data/bosses";

export const ARENA_RADIUS = 22;

export interface DummySpawn {
  id: string;
  name: string;
  x: number;
  z: number;
  /** Home anchor the AI leashes to (defaults to the spawn point). */
  homeX: number;
  homeZ: number;
  maxHp: number;
  raceId: "orcs" | "undead";
  classId: "knight" | "warrior" | "mage" | "ranger";
}

function spawn(
  id: string,
  name: string,
  x: number,
  z: number,
  maxHp: number,
  raceId: DummySpawn["raceId"],
  classId: DummySpawn["classId"],
): DummySpawn {
  return { id, name, x, z, homeX: x, homeZ: z, maxHp, raceId, classId };
}

// Spawns spread across the neutral town edge and out into the seeded faction
// wedges, so the faction-zone theming and per-zone AI aggression actually matter.
const BASE_DUMMY_SPAWNS: DummySpawn[] = [
  spawn("dummy-1", "Legion Orc Warrior", 10, -14, 220, "orcs", "warrior"),
  spawn("dummy-2", "Legion Undead Ranger", -12, -12, 220, "undead", "ranger"),
  spawn("dummy-3", "Legion Orc Knight", 28, 24, 420, "orcs", "knight"),
  spawn("dummy-4", "Legion Undead Mage", -34, 10, 160, "undead", "mage"),
  spawn("dummy-5", "Legion Orc Ranger", 6, 40, 160, "orcs", "ranger"),
];

// Enemy camps: each seeded camp garrisons a small band of Legion raiders that
// leash to the camp anchor (reusing the whole dummy combat/AI/respawn pipeline).
function buildCampEnemies(): DummySpawn[] {
  const rng = mulberry32(childSeed("camps"));
  const out: DummySpawn[] = [];
  const classes = ["warrior", "ranger", "knight", "mage"] as const;
  for (const camp of CAMPS) {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const r = camp.radius * 0.6;
      const x = camp.x + Math.cos(a) * r;
      const z = camp.z + Math.sin(a) * r;
      const raceId = rng() < 0.5 ? "orcs" : "undead";
      const classId = classes[Math.floor(rng() * classes.length)];
      out.push(spawn(`camp-${camp.faction}-${i}`, "Legion Raider", x, z, 240, raceId, classId));
    }
  }
  return out;
}

export const DUMMY_SPAWNS: DummySpawn[] = [...BASE_DUMMY_SPAWNS, ...buildCampEnemies(), ...BOSS_SPAWNS];

// --- Huntable animals -------------------------------------------------------
export interface AnimalSpawn {
  id: string;
  species: string;
  name: string;
  file: string;
  x: number;
  z: number;
  homeX: number;
  homeZ: number;
  maxHp: number;
  height: number;
  loot: string;
}

function mkAnimal(def: AnimalDef, id: string, x: number, z: number): AnimalSpawn {
  return {
    id,
    species: def.species,
    name: def.species,
    file: def.file,
    x,
    z,
    homeX: x,
    homeZ: z,
    maxHp: def.maxHp,
    height: def.height,
    loot: def.loot,
  };
}

function buildAnimalSpawns(): AnimalSpawn[] {
  const rng = mulberry32(childSeed("animals"));
  const out: AnimalSpawn[] = [];

  // Livestock clustered at friendly farms.
  for (const farm of FARMS) {
    for (let i = 0; i < 5; i++) {
      const def = FARM_ANIMALS[Math.floor(rng() * FARM_ANIMALS.length)];
      const a = rng() * Math.PI * 2;
      const r = rng() * farm.radius * 0.7;
      out.push(mkAnimal(def, `farm-${farm.faction}-${i}`, farm.x + Math.cos(a) * r, farm.z + Math.sin(a) * r));
    }
  }

  // Wild game roaming the wilds of each faction island.
  for (const f of ["crusade", "fabled", "legion"] as const) {
    for (let i = 0; i < 6; i++) {
      const def = WILD_ANIMALS[Math.floor(rng() * WILD_ANIMALS.length)];
      const c = pointOnIsland(f, 0.25 + rng() * 0.35, rng() * Math.PI * 2);
      out.push(mkAnimal(def, `wild-${f}-${i}`, c.x, c.z));
    }
  }

  // Random encounter packs — small groups that roam between settlements.
  for (let pack = 0; pack < 8; pack++) {
    const def = ENCOUNTER_ANIMALS[Math.floor(rng() * ENCOUNTER_ANIMALS.length)];
    const faction = (["crusade", "fabled", "legion"] as const)[pack % 3];
    const anchor = pointOnIsland(faction, 0.3 + rng() * 0.4, rng() * Math.PI * 2);
    const herd = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < herd; i++) {
      const a = rng() * Math.PI * 2;
      const r = rng() * 14;
      out.push(
        mkAnimal(def, `enc-${pack}-${i}`, anchor.x + Math.cos(a) * r, anchor.z + Math.sin(a) * r),
      );
    }
  }

  return out;
}

export const ANIMAL_SPAWNS: AnimalSpawn[] = buildAnimalSpawns();

/**
 * Over-the-shoulder camera. The camera sits behind + above the player at
 * `distance`, lifted by `pitch`, with a lateral `shoulder` offset, and is pulled
 * in when world geometry occludes the view. Yaw / pitch / distance are driven by
 * the mouse (RMB-drag look, wheel zoom) in CameraControls — the rig does NOT
 * auto-trail the player's facing, which is what made the old camera drift.
 */
export const CAMERA_DISTANCE_PRESETS = [5.5, 8, 11.5];
export const CAMERA_DEFAULT_PITCH = 0.42;
export const CAMERA_MIN_PITCH = 0.08;
export const CAMERA_MAX_PITCH = 1.35;
export const CAMERA_MIN_DISTANCE = 4;
export const CAMERA_MAX_DISTANCE = 16;

export const cameraRig = {
  distance: CAMERA_DISTANCE_PRESETS[0],
  presetIndex: 0,
  yaw: 0,
  pitch: CAMERA_DEFAULT_PITCH,
  shoulder: 0.85,
  height: 1.5,
  recenterRequested: true,
  freeLooking: false,
};

class WorldPositions {
  player = new THREE.Vector3(0, 0, 8);
  playerFacingAngle = 0;
  playerInWater = false;
  dummies = new Map<string, THREE.Vector3>();
  /** Dummy ids currently inside the player's forward melee swing sensor. */
  meleeHits = new Set<string>();

  constructor() {
    for (const s of DUMMY_SPAWNS) {
      this.dummies.set(s.id, new THREE.Vector3(s.x, 0, s.z));
    }
    for (const a of ANIMAL_SPAWNS) {
      this.dummies.set(a.id, new THREE.Vector3(a.x, 0, a.z));
    }
  }

  distanceToPlayer(id: string): number {
    const pos = this.dummies.get(id);
    if (!pos) return Infinity;
    return this.player.distanceTo(pos);
  }
}

export const worldPositions = new WorldPositions();
