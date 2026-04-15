/**
 * space-config.ts ΓÇö All large data constant objects for Gruda Armada.
 * Extracted from space-types.ts to keep that file focused on interfaces/types.
 * Re-exported via space-types.ts barrel so no consumer imports need to change.
 */
import type {
  TeamColorOption,
  EnemyColorMode,
  TeamColorPrefs,
  ShipClass,
  ShipStats,
  PlanetType,
  PlanetTypeData,
  UpgradeType,
  ExplosionScale,
  GameMode,
  CommanderSpec,
  ShipRoleType,
  TeamTechBonuses,
  SpaceFaction,
} from './space-types';
import { TEAM_COLORS } from './space-types';
// ΓöÇΓöÇ Team Color Palette ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const TEAM_COLOR_PALETTE: TeamColorOption[] = [
  { label: 'Blue', hex: 0x4488ff },
  { label: 'Red', hex: 0xff4444 },
  { label: 'Orange', hex: 0xffaa22 },
  { label: 'Purple', hex: 0xaa44ff },
  { label: 'Green', hex: 0x44ff44 },
  { label: 'Yellow', hex: 0xffdd22 },
  { label: 'Teal', hex: 0x22ddaa },
  { label: 'Pink', hex: 0xff44aa },
  { label: 'Cyan', hex: 0x44ddff },
  { label: 'Crimson', hex: 0xcc2244 },
];
const DEFAULT_ENEMY_COLORS = [1, 2, 3]; // Red, Orange, Purple ΓÇö for teams 2,3,4
export function applyColorPreferences(prefs: TeamColorPrefs): void {
  const pal = TEAM_COLOR_PALETTE;
  TEAM_COLORS[1] = pal[prefs.playerColorIdx]?.hex ?? 0x4488ff;
  if (prefs.enemyColorMode === 'all_one') {
    const col = pal[prefs.enemyColorIdx]?.hex ?? 0xff4444;
    TEAM_COLORS[2] = col;
    TEAM_COLORS[3] = col;
    TEAM_COLORS[4] = col;
  } else {
    const used = new Set<number>([prefs.playerColorIdx]);
    const enemyTeams = [2, 3, 4];
    let fallbackIdx = 0;
    for (const t of enemyTeams) {
      let idx = DEFAULT_ENEMY_COLORS[t - 2];
      if (used.has(idx)) {
        while (used.has(fallbackIdx) || fallbackIdx === prefs.playerColorIdx) fallbackIdx++;
        idx = fallbackIdx;
      }
      used.add(idx);
      TEAM_COLORS[t] = pal[idx]?.hex ?? 0xff4444;
    }
  }
  TEAM_COLORS[0] = 0x44ff44;
}
// ΓöÇΓöÇ Planet Type Data ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const PLANET_TYPE_DATA: Record<PlanetType, PlanetTypeData> = {
  volcanic: {
    label: 'Volcanic',
    resourceMult: { credits: 0.8, energy: 0.9, minerals: 1.9 },
    upgradeDiscount: 'attack',
    techFocus: 'Weapons Tech',
    baseColor: 0xcc4422,
  },
  oceanic: {
    label: 'Oceanic',
    resourceMult: { credits: 1.0, energy: 1.9, minerals: 0.7 },
    upgradeDiscount: 'shield',
    techFocus: 'Shield Tech',
    baseColor: 0x2266cc,
  },
  barren: {
    label: 'Barren',
    resourceMult: { credits: 1.2, energy: 0.8, minerals: 1.1 },
    upgradeDiscount: 'speed',
    techFocus: 'Propulsion Tech',
    baseColor: 0x886644,
  },
  crystalline: {
    label: 'Crystalline',
    resourceMult: { credits: 1.9, energy: 1.0, minerals: 0.8 },
    upgradeDiscount: 'armor',
    techFocus: 'Hull Tech',
    baseColor: 0x44aacc,
  },
  gas_giant: {
    label: 'Gas Giant',
    resourceMult: { credits: 1.0, energy: 2.2, minerals: 0.9 },
    upgradeDiscount: 'health',
    techFocus: 'Bio Tech',
    baseColor: 0xcc8822,
  },
  frozen: {
    label: 'Frozen',
    resourceMult: { credits: 1.4, energy: 0.6, minerals: 1.4 },
    upgradeDiscount: 'shield',
    techFocus: 'Cryo Tech',
    baseColor: 0x88aacc,
  },
  plasma: {
    label: 'Plasma',
    resourceMult: { credits: 0.7, energy: 2.5, minerals: 0.6 },
    upgradeDiscount: 'attack',
    techFocus: 'Plasma Tech',
    baseColor: 0xff66aa,
  },
  fungal: {
    label: 'Fungal',
    resourceMult: { credits: 1.3, energy: 1.3, minerals: 1.0 },
    upgradeDiscount: 'health',
    techFocus: 'Bio-Organic Tech',
    baseColor: 0x66aa44,
  },
  metallic: {
    label: 'Metallic',
    resourceMult: { credits: 1.0, energy: 0.5, minerals: 2.5 },
    upgradeDiscount: 'armor',
    techFocus: 'Alloy Tech',
    baseColor: 0xaaaacc,
  },
  dark_matter: {
    label: 'Dark Matter',
    resourceMult: { credits: 1.5, energy: 1.5, minerals: 1.5 },
    upgradeDiscount: 'speed',
    techFocus: 'Void Tech',
    baseColor: 0x6622aa,
  },
};
// ΓöÇΓöÇ VFX Scale Values ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const EXPLOSION_SCALE_VALUES: Record<ExplosionScale, number> = {
  tiny: 0.3,
  small: 0.6,
  medium: 1.0,
  large: 2.0,
  huge: 4.0,
  epic: 8.0,
};
// ΓöÇΓöÇ Upgrade Costs & Bonuses ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const UPGRADE_COSTS: { credits: number; minerals: number; energy: number }[] = [
  { credits: 200, minerals: 100, energy: 50 },
  { credits: 400, minerals: 200, energy: 100 },
  { credits: 700, minerals: 350, energy: 175 },
  { credits: 1100, minerals: 550, energy: 275 },
  { credits: 1600, minerals: 800, energy: 400 },
];
export const UPGRADE_BONUSES: Record<UpgradeType, number[]> = {
  attack: [0, 0.1, 0.22, 0.36, 0.52, 0.7],
  armor: [0, 1, 2, 4, 6, 9],
  speed: [0, 0.08, 0.16, 0.25, 0.35, 0.45],
  health: [0, 0.1, 0.22, 0.36, 0.52, 0.7],
  shield: [0, 0.1, 0.22, 0.36, 0.52, 0.7],
};
// ΓöÇΓöÇ Game Constants ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const CAPTURE_TIME = 100;
export const CAPTURE_RATE_PER_UNIT = 5;
export const NEUTRAL_DEFENDERS = 3;
export const DOMINATION_TIME = 60;
// ΓöÇΓöÇ Map Constants ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export function getMapSize(mode: GameMode): { width: number; height: number; depth: number } {
  switch (mode) {
    case '1v1':
      return { width: 24000, height: 24000, depth: 800 };
    case '2v2':
      return { width: 32000, height: 32000, depth: 800 };
    case 'ffa4':
      return { width: 32000, height: 32000, depth: 800 };
    case 'campaign':
      return CAMPAIGN_SECTOR_SIZE;
  }
}
export const MAP_WIDTH = 24000;
export const MAP_HEIGHT = 24000;
export const MAP_DEPTH = 800;
// ΓöÇΓöÇ Campaign Constants ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
/** All dt values are multiplied by this in campaign mode (10x slower gameplay). */
export const CAMPAIGN_TIME_SCALE = 0.1;
export const CAMPAIGN_SECTOR_SIZE = { width: 48000, height: 48000, depth: 1200 };
export const CAMPAIGN_PLANET_COUNT = { min: 15, max: 25 };
export const CAMPAIGN_AI_FACTIONS = 3;
export const CAMPAIGN_HOMEWORLD_INVINCIBLE = true;
/** Starting resources are higher in campaign ΓÇö player needs a head-start. */
export const CAMPAIGN_START_RESOURCES = { credits: 1000, energy: 400, minerals: 600 };
/** Domination not used in campaign ΓÇö conquest is the only win condition. */
export const CAMPAIGN_NEUTRAL_DEFENDERS = 5;
export const CAMPAIGN_LORE_INTRO = [
  'They said the sky was burning.',
  'They were right.',
  '',
  'The armageddon tore your world apart ΓÇö',
  'not destroyed, but shattered.',
  'The surface cracked. Continents fractured.',
  'Chunks of your homeworld broke free,',
  'drifting into orbit like wounded moons.',
  '',
  'But you survived.',
  'You had been building something in the deep vaults ΓÇö',
  'a drive unlike anything your world had ever seen.',
  '',
  'You activated it.',
  'You launched into orbit.',
  'You built the first off-world base',
  'on the broken back of your own dying planet.',
  '',
  'Now those drifting chunks are your lifeline ΓÇö',
  'minable debris, forever breaking free,',
  'feeding your forges with the bones of home.',
  '',
  'What you build on the surface determines',
  'what those chunks yield.',
  '',
  'Build your base. Forge your fleet.',
  'Choose your faction. Take this galaxy.',
  'Then face the universe.',
];
/** Story beats triggered at conquest milestones. */
export const CAMPAIGN_STORY_BEATS: { atPercent: number; id: string; title: string; text: string }[] = [
  {
    atPercent: 0,
    id: 'escape',
    title: 'The Escape',
    text: "The drive fires. You rise above the cracking surface. Below, your world fractures ΓÇö but it's still there. Still home.",
  },
  {
    atPercent: 5,
    id: 'first_base',
    title: 'First Base',
    text: 'The lander touches down on orbital debris. Your first structure rises from the broken rock of your own world. Chunks drift by ΓÇö minable.',
  },
  {
    atPercent: 15,
    id: 'first_contact',
    title: 'First Contact',
    text: 'Signals in the void. Organized fleets, unknown origin. You are not the only survivor in this galaxy.',
  },
  {
    atPercent: 25,
    id: 'faction_choice',
    title: 'Choose Your Path',
    text: 'Your people look to you. The faction you align with will define the future of your civilization.',
  },
  {
    atPercent: 35,
    id: 'rival_emerges',
    title: 'A Rival Emerges',
    text: 'An enemy commander broadcasts on all frequencies. "This sector belongs to us. Leave or burn."',
  },
  {
    atPercent: 50,
    id: 'midpoint',
    title: 'The Tipping Point',
    text: 'Half the sector bends to your will. The remaining factions fortify their borders. War is inevitable.',
  },
  {
    atPercent: 65,
    id: 'ancient_signal',
    title: 'The Ancient Signal',
    text: 'Deep-space arrays detect a signal older than any known civilization. Something is watching from beyond the sector.',
  },
  {
    atPercent: 75,
    id: 'desperation',
    title: 'Acts of Desperation',
    text: 'Your enemies form uneasy alliances. Their combined fleets grow bolder, more desperate.',
  },
  {
    atPercent: 90,
    id: 'final_push',
    title: 'The Final Push',
    text: 'Only a handful of worlds remain. Your fleet is the strongest force this galaxy has ever seen.',
  },
  {
    atPercent: 100,
    id: 'conqueror',
    title: 'Conqueror of Galaxy',
    text: 'Every star in this sector answers to your command. But beyond the edge... the universe stirs. The wars are just beginning.',
  },
];
/** Tutorial tooltip hints ΓÇö shown progressively based on game state. */
export const CAMPAIGN_TOOLTIPS: { id: string; condition: string; text: string; position: 'top' | 'bottom' | 'left' | 'right' }[] = [
  {
    id: 'tt_welcome',
    condition: 'gameTime < 5',
    text: 'Welcome, Commander. Your homeworld is shattered but not dead. Build your base on the debris ΓÇö chunks break off forever, feeding your forges.',
    position: 'bottom',
  },
  {
    id: 'tt_select_ship',
    condition: 'firstShipSelect',
    text: 'Ship selected. Right-click to move or attack. Q/W/E for abilities.',
    position: 'bottom',
  },
  {
    id: 'tt_build_ship',
    condition: 'firstStationSelect',
    text: 'Click a ship in the build panel to queue production. Workers mine resources automatically.',
    position: 'right',
  },
  {
    id: 'tt_capture',
    condition: 'firstNeutralNearby',
    text: 'Send ships near a neutral planet to capture it. Defeat the defenders first.',
    position: 'top',
  },
  {
    id: 'tt_tech',
    condition: 'firstPlanetCaptured',
    text: 'Open the TECH panel to research upgrades. Each planet type unlocks different tech trees.',
    position: 'left',
  },
  {
    id: 'tt_faction_forge',
    condition: 'planetLevel3',
    text: "Your planet reached Level 3! Build a Faction Forge to produce your faction's endgame resource.",
    position: 'bottom',
  },
  {
    id: 'tt_hero_ship',
    condition: 'factionResourceReady',
    text: "You have enough faction resource to build your faction's Hero Ship. Open the build panel.",
    position: 'right',
  },
  {
    id: 'tt_log',
    condition: 'firstEvent',
    text: "An event has occurred! Press L to open the Captain's Log and review your journey.",
    position: 'left',
  },
  {
    id: 'tt_universe_wars',
    condition: 'conquestComplete',
    text: "You've conquered the galaxy. The Universe Wars await ΓÇö PvP is now unlocked.",
    position: 'top',
  },
];
/** Base building model paths ΓÇö KayKit Space Base + playerbase assets. */
const SB = '/assets/space/models/space-base/KayKit_Space_Base_Bits_1.0_FREE/Assets/gltf';
const PB = '/assets/space/models/playerbase/playerbase';
export const BASE_BUILDING_MODELS: Record<string, { path: string; format: 'gltf' | 'fbx'; label: string }> = {
  // KayKit modules (GLTF)
  basemodule_a: { path: `${SB}/basemodule_A.gltf`, format: 'gltf', label: 'Base Module A' },
  basemodule_b: { path: `${SB}/basemodule_B.gltf`, format: 'gltf', label: 'Base Module B' },
  basemodule_c: { path: `${SB}/basemodule_C.gltf`, format: 'gltf', label: 'Base Module C' },
  basemodule_d: { path: `${SB}/basemodule_D.gltf`, format: 'gltf', label: 'Base Module D' },
  basemodule_e: { path: `${SB}/basemodule_E.gltf`, format: 'gltf', label: 'Base Module E' },
  basemodule_garage: { path: `${SB}/basemodule_garage.gltf`, format: 'gltf', label: 'Garage Module' },
  landingpad_large: { path: `${SB}/landingpad_large.gltf`, format: 'gltf', label: 'Landing Pad (Large)' },
  landingpad_small: { path: `${SB}/landingpad_small.gltf`, format: 'gltf', label: 'Landing Pad (Small)' },
  solarpanel: { path: `${SB}/solarpanel.gltf`, format: 'gltf', label: 'Solar Panel' },
  roof_solarpanels: { path: `${SB}/roofmodule_solarpanels.gltf`, format: 'gltf', label: 'Solar Roof' },
  roof_cargo_a: { path: `${SB}/roofmodule_cargo_A.gltf`, format: 'gltf', label: 'Cargo Roof A' },
  roof_cargo_b: { path: `${SB}/roofmodule_cargo_B.gltf`, format: 'gltf', label: 'Cargo Roof B' },
  drill_structure: { path: `${SB}/drill_structure.gltf`, format: 'gltf', label: 'Mining Drill' },
  cargodepot_a: { path: `${SB}/cargodepot_A.gltf`, format: 'gltf', label: 'Cargo Depot A' },
  cargodepot_b: { path: `${SB}/cargodepot_B.gltf`, format: 'gltf', label: 'Cargo Depot B' },
  structure_tall: { path: `${SB}/structure_tall.gltf`, format: 'gltf', label: 'Tall Structure' },
  structure_low: { path: `${SB}/structure_low.gltf`, format: 'gltf', label: 'Low Structure' },
  windturbine_tall: { path: `${SB}/windturbine_tall.gltf`, format: 'gltf', label: 'Wind Turbine (Tall)' },
  windturbine_low: { path: `${SB}/windturbine_low.gltf`, format: 'gltf', label: 'Wind Turbine (Low)' },
  lander_a: { path: `${SB}/lander_A.gltf`, format: 'gltf', label: 'Lander A' },
  lander_b: { path: `${SB}/lander_B.gltf`, format: 'gltf', label: 'Lander B' },
  spacetruck: { path: `${SB}/spacetruck.gltf`, format: 'gltf', label: 'Space Truck' },
  spacetruck_large: { path: `${SB}/spacetruck_large.gltf`, format: 'gltf', label: 'Heavy Hauler' },
  tunnel_straight_a: { path: `${SB}/tunnel_straight_A.gltf`, format: 'gltf', label: 'Tunnel Straight' },
  tunnel_diagonal_a: { path: `${SB}/tunnel_diagonal_long_A.gltf`, format: 'gltf', label: 'Tunnel Diagonal' },
  terrain_mining: { path: `${SB}/terrain_mining.gltf`, format: 'gltf', label: 'Mining Terrain' },
  // Playerbase (FBX)
  pb_lander: { path: `${PB}/Lander.fbx`, format: 'fbx', label: 'Colony Lander' },
  pb_satellite_dish: { path: `${PB}/SatelliteDish_1.fbx`, format: 'fbx', label: 'Satellite Dish' },
  pb_solar_panel: { path: `${PB}/SolarPanel_4.fbx`, format: 'fbx', label: 'Colony Solar Panel' },
  pb_building_block: { path: `${PB}/BuildingBlock_2.fbx`, format: 'fbx', label: 'Building Block' },
};
// ΓöÇΓöÇ Homeworld Chunk System ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// Homeworld forever spawns minable chunks into orbit.
// What you build on the surface influences what those chunks yield.
/** Seconds between homeworld chunk spawns (game-time, already 10x scaled). */
export const CHUNK_SPAWN_INTERVAL = 45;
/** Max chunks orbiting homeworld at once. */
export const CHUNK_MAX_ORBITING = 12;
/** Base yield of a homeworld chunk before building influence. */
export const CHUNK_BASE_YIELD = { credits: 15, energy: 10, minerals: 20 };
/** Seconds before a depleted chunk respawns (infinite cycle). */
export const CHUNK_RESPAWN_COOLDOWN = 30;
/** Orbit radius range for chunks (game units from planet center). */
export const CHUNK_ORBIT_RANGE = { min: 400, max: 800 };
/**
 * How each building type on the homeworld surface influences chunk yields.
 * Multiplier applied to the base yield category. Stacks with building level.
 * refinery  ΓåÆ more minerals/credits
 * barracks  ΓåÆ no resource bonus (supply)
 * research_lab ΓåÆ more energy, chance of faction resource
 * faction_forge ΓåÆ chunks also yield faction resource
 */
export const BUILDING_CHUNK_INFLUENCE: Partial<
  Record<
    PlanetBuildingType,
    {
      creditsMult: number;
      energyMult: number;
      mineralsMult: number;
      factionResourceChance: number; // 0-1, chance a chunk also yields faction resource
    }
  >
> = {
  refinery: { creditsMult: 1.5, energyMult: 1.0, mineralsMult: 1.8, factionResourceChance: 0 },
  research_lab: { creditsMult: 1.0, energyMult: 1.6, mineralsMult: 1.0, factionResourceChance: 0.15 },
  faction_forge: { creditsMult: 1.0, energyMult: 1.0, mineralsMult: 1.0, factionResourceChance: 0.6 },
};
/** Maps each PlanetBuildingType to the 3D model used at each level (1-3). */
export const BUILDING_TO_MODEL: Record<string, { level1: string; level2: string; level3: string }> = {
  station: { level1: 'basemodule_a', level2: 'basemodule_c', level3: 'basemodule_e' },
  refinery: { level1: 'drill_structure', level2: 'terrain_mining', level3: 'cargodepot_a' },
  barracks: { level1: 'basemodule_b', level2: 'basemodule_d', level3: 'basemodule_garage' },
  turret_platform: { level1: 'structure_low', level2: 'structure_tall', level3: 'structure_tall' },
  research_lab: { level1: 'pb_satellite_dish', level2: 'windturbine_tall', level3: 'roof_solarpanels' },
  faction_forge: { level1: 'pb_building_block', level2: 'cargodepot_b', level3: 'spacetruck_large' },
};
// ΓöÇΓöÇ Space Factions ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export interface FactionData {
  label: string;
  color: string;
  icon: string; // emoji for quick display
  description: string;
  bonuses: { attack: number; defense: number; speed: number; economy: number };
  perks: string[]; // unlocked at faction levels 2, 4, 6, 8, 10
}
export const FACTION_DATA: Record<SpaceFaction, FactionData> = {
  wisdom: {
    label: 'Wisdom',
    color: '#44ddff',
    icon: '≡ƒÆá',
    description: 'Seekers of knowledge. Tech research 30% faster, scan range +50%.',
    bonuses: { attack: 0, defense: 0.05, speed: 0.1, economy: 0.15 },
    perks: ['fast_research', 'deep_scan', 'ai_advisor', 'precognition', 'omniscience'],
  },
  construct: {
    label: 'Construct',
    color: '#ffaa22',
    icon: 'ΓÜÖ∩╕Å',
    description: 'Builders of empires. Build speed +25%, planet levels cost 20% less.',
    bonuses: { attack: 0.05, defense: 0.1, speed: 0, economy: 0.1 },
    perks: ['rapid_build', 'fortify', 'megastructure', 'planetary_shield', 'dyson_sphere'],
  },
  void: {
    label: 'Void',
    color: '#aa44ff',
    icon: '≡ƒò│∩╕Å',
    description: 'Masters of dark energy. Void powers 40% stronger, cloak duration +50%.',
    bonuses: { attack: 0.15, defense: 0, speed: 0.05, economy: 0 },
    perks: ['void_mastery', 'dark_cloak', 'rift_walker', 'entropy_field', 'annihilation'],
  },
  legion: {
    label: 'Legion',
    color: '#ff4444',
    icon: 'ΓÜö∩╕Å',
    description: 'Strength in numbers. Fleet supply +30%, ship XP gain +25%.',
    bonuses: { attack: 0.1, defense: 0.05, speed: 0.05, economy: 0 },
    perks: ['mass_production', 'veteran_crew', 'war_cry', 'orbital_strike', 'armada'],
  },
};
export const FACTION_LABELS: Record<SpaceFaction, string> = {
  wisdom: 'Wisdom',
  construct: 'Construct',
  void: 'Void',
  legion: 'Legion',
};
/** XP required to reach each faction level (cumulative). */
export const FACTION_LEVEL_XP = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500];
/** Planet XP thresholds for each level (1ΓåÆ5). */
export const PLANET_LEVEL_XP = [0, 200, 500, 1000, 2000];
/** Resource yield multiplier per planet level. */
export const PLANET_LEVEL_YIELD_MULT = [1.0, 1.25, 1.5, 1.8, 2.2];
/** Max turret slots per planet level. */
export const PLANET_LEVEL_TURRET_SLOTS = [2, 3, 4, 5, 6];
/** Supply bonus per planet level. */
export const PLANET_LEVEL_SUPPLY_BONUS = [0, 5, 10, 15, 25];
// ΓöÇΓöÇ Spark System ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
import type { SparkShipNode, FactionShipTree, FactionCommander, CommanderArchetype } from './space-types';
/** Spark gains ΓÇö campaign uses base values, quick game multiplies by QUICK_SPARK_MULT for faster unlocks. */
export const SPARK_GAINS = {
  planetCapture: 10,
  shipKill: 1,
  capitalKill: 3, // dreadnought, battleship, cruiser
  neutralKill: 1,
  majorBattle: 5, // 5+ enemy ships destroyed in 30s
  techResearch: 3,
  globalUpgrade: 2, // per upgrade level purchased
  commanderLevelUp: 5,
  passivePerMinute: 1, // commander genius over time
  campaignEventMin: 2,
  campaignEventMax: 15,
};
/**
 * Quick game Spark multiplier ΓÇö fast games need faster unlocks.
 * Campaign = 1.0x (base), Quick = 3.0x so players unlock ships in 5-10 min not 30+.
 */
export const QUICK_SPARK_MULT = 3.0;
/** Quick game starts with bonus Spark so players can immediately unlock 1-2 ships. */
export const QUICK_START_SPARK = 15;
/** Campaign starting planet level (L1), quick game starting planet = L2 for faster progression. */
export const CAMPAIGN_START_PLANET_LEVEL = 1;
export const QUICK_START_PLANET_LEVEL = 2;
/** Ships each faction starts with (buildable without any Spark).
 * Index 0 = homeworld flagship (always pyramid_ship).
 * Index 1 = faction scout / fighter.
 * Index 2 = worker type (mining_drone or energy_skimmer).
 */
export const FACTION_STARTER_SHIPS: Record<SpaceFaction, string[]> = {
  wisdom: ['pyramid_ship', 'micro_recon', 'energy_skimmer'],
  construct: ['pyramid_ship', 'cf_corvette_01', 'mining_drone'],
  void: ['pyramid_ship', 'camo_stellar_jet', 'energy_skimmer'],
  legion: ['pyramid_ship', 'red_fighter', 'mining_drone'],
};
/** 12 faction commanders ΓÇö 3 per faction (caster / tank / strategist). All bonuses under 7%. */
export const FACTION_COMMANDERS: FactionCommander[] = [
  // Wisdom
  {
    id: 'wisdom_lyra',
    name: 'Lyra Axiom',
    faction: 'wisdom',
    archetype: 'caster',
    portraitIndex: 9,
    bonuses: [{ stat: 'cooldownReduction', value: 0.05 }],
    bonusLabel: '+5% Cooldown Reduction',
    startingUnlock: 'w_infrared',
    lore: 'Her mind processes battle data faster than any AI.',
  },
  {
    id: 'wisdom_solis',
    name: 'Solis Prism',
    faction: 'wisdom',
    archetype: 'tank',
    portraitIndex: 3,
    bonuses: [{ stat: 'shieldRegen', value: 0.04 }],
    bonusLabel: '+4% Shield Regen',
    startingUnlock: 'w_corvette_04',
    lore: 'A crystalline shield around every ship in his fleet.',
  },
  {
    id: 'wisdom_nova',
    name: 'Nova Sage',
    faction: 'wisdom',
    archetype: 'strategist',
    portraitIndex: 7,
    bonuses: [{ stat: 'energyIncome', value: 0.05 }],
    bonusLabel: '+5% Energy Income',
    startingUnlock: 'w_runner',
    lore: 'Every resource is a weapon in the right hands.',
  },
  // Construct
  {
    id: 'construct_vex',
    name: 'Vex Forge',
    faction: 'construct',
    archetype: 'caster',
    portraitIndex: 1,
    bonuses: [{ stat: 'buildSpeed', value: 0.05 }],
    bonusLabel: '+5% Build Speed',
    startingUnlock: 'c_warship',
    lore: 'Forges ships from raw asteroid in record time.',
  },
  {
    id: 'construct_orn',
    name: 'Orn Bastion',
    faction: 'construct',
    archetype: 'tank',
    portraitIndex: 5,
    bonuses: [{ stat: 'armor', value: 0.06 }],
    bonusLabel: '+6% Armor',
    startingUnlock: 'c_frigate_03',
    lore: 'His hull plating has never been breached.',
  },
  {
    id: 'construct_drak',
    name: 'Drak Anvil',
    faction: 'construct',
    archetype: 'strategist',
    portraitIndex: 11,
    bonuses: [{ stat: 'mineralIncome', value: 0.04 }],
    bonusLabel: '+4% Mineral Income',
    startingUnlock: 'c_intruder',
    lore: "The galaxy's greatest mining architect.",
  },
  // Void
  {
    id: 'void_nyx',
    name: 'Nyx Shadow',
    faction: 'void',
    archetype: 'caster',
    portraitIndex: 13,
    bonuses: [{ stat: 'cloakDuration', value: 0.05 }],
    bonusLabel: '+5% Cloak Duration',
    startingUnlock: 'v_infrared',
    lore: 'Invisible. Untouchable. Everywhere at once.',
  },
  {
    id: 'void_zar',
    name: 'Zar Rift',
    faction: 'void',
    archetype: 'tank',
    portraitIndex: 17,
    bonuses: [{ stat: 'health', value: 0.04 }],
    bonusLabel: '+4% HP',
    startingUnlock: 'v_frigate_04',
    lore: 'Survived the void itself. Nothing kills him twice.',
  },
  {
    id: 'void_kira',
    name: 'Kira Null',
    faction: 'void',
    archetype: 'strategist',
    portraitIndex: 15,
    bonuses: [{ stat: 'speed', value: 0.05 }],
    bonusLabel: '+5% Speed',
    startingUnlock: 'v_slicer',
    lore: 'Strikes before the enemy knows she exists.',
  },
  // Legion
  {
    id: 'legion_thar',
    name: 'Thar Warcry',
    faction: 'legion',
    archetype: 'caster',
    portraitIndex: 2,
    bonuses: [{ stat: 'attack', value: 0.05 }],
    bonusLabel: '+5% Attack Damage',
    startingUnlock: 'l_corvette_02',
    lore: 'His battle cry alone has shattered enemy morale.',
  },
  {
    id: 'legion_rynn',
    name: 'Rynn Striker',
    faction: 'legion',
    archetype: 'tank',
    portraitIndex: 6,
    bonuses: [{ stat: 'supply', value: 0.06 }],
    bonusLabel: '+6% Fleet Supply',
    startingUnlock: 'l_dual_striker',
    lore: 'Where one falls, ten more take their place.',
  },
  {
    id: 'legion_axon',
    name: 'Axon Swarm',
    faction: 'legion',
    archetype: 'strategist',
    portraitIndex: 10,
    bonuses: [
      { stat: 'buildSpeed', value: 0.03 },
      { stat: 'sparkGain', value: 0.03 },
    ],
    bonusLabel: '+3% Build +3% Spark',
    startingUnlock: 'l_marine',
    lore: 'Efficiency is the ultimate weapon of war.',
  },
];
/** Get commanders for a specific faction. */
export function getFactionCommanders(faction: SpaceFaction): FactionCommander[] {
  return FACTION_COMMANDERS.filter((c) => c.faction === faction);
}
// ΓöÇΓöÇ Faction Ship Trees ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const FACTION_SHIP_TREES: Record<SpaceFaction, FactionShipTree> = {
  wisdom: {
    faction: 'wisdom',
    capstoneNodeId: 'w_oracle',
    nodes: [
      // Left branch: scout ΓåÆ support
      { id: 'w_corvette_01', shipType: 'cf_corvette_01', sparkCost: 5, requires: [], x: 20, y: 20 },
      { id: 'w_infrared', shipType: 'infrared_furtive', sparkCost: 10, requires: ['w_corvette_01'], x: 20, y: 40 },
      { id: 'w_runner', shipType: 'interstellar_runner', sparkCost: 15, requires: ['w_infrared'], x: 10, y: 60 },
      { id: 'w_frigate_01', shipType: 'cf_frigate_01', sparkCost: 12, requires: ['w_infrared'], x: 30, y: 60 },
      { id: 'w_lc_01', shipType: 'cf_light_cruiser_01', sparkCost: 25, requires: ['w_frigate_01'], x: 30, y: 80 },
      // Right branch: fighter ΓåÆ assault
      { id: 'w_racer', shipType: 'galactix_racer', sparkCost: 5, requires: [], x: 70, y: 20 },
      { id: 'w_camo', shipType: 'camo_stellar_jet', sparkCost: 15, requires: ['w_racer'], x: 60, y: 40 },
      { id: 'w_corvette_04', shipType: 'cf_corvette_04', sparkCost: 12, requires: ['w_racer'], x: 80, y: 40 },
      { id: 'w_pyramid', shipType: 'pyramid_ship', sparkCost: 30, requires: ['w_camo'], x: 60, y: 65 },
      { id: 'w_lc_02', shipType: 'cf_light_cruiser_02', sparkCost: 28, requires: ['w_corvette_04'], x: 80, y: 65 },
      // Capstone
      {
        id: 'w_oracle',
        shipType: 'hero_wisdom_oracle',
        sparkCost: 50,
        requires: ['w_lc_01', 'w_pyramid'],
        x: 50,
        y: 95,
        factionResourceCost: 50,
      },
    ],
  },
  construct: {
    faction: 'construct',
    capstoneNodeId: 'c_titan',
    nodes: [
      { id: 'c_corvette_02', shipType: 'cf_corvette_02', sparkCost: 5, requires: [], x: 20, y: 20 },
      { id: 'c_warship', shipType: 'warship', sparkCost: 15, requires: ['c_corvette_02'], x: 15, y: 40 },
      { id: 'c_frigate_03', shipType: 'cf_frigate_03', sparkCost: 12, requires: ['c_corvette_02'], x: 35, y: 40 },
      { id: 'c_destroyer_01', shipType: 'cf_destroyer_01', sparkCost: 25, requires: ['c_warship'], x: 15, y: 60 },
      { id: 'c_destroyer_04', shipType: 'cf_destroyer_04', sparkCost: 28, requires: ['c_frigate_03'], x: 35, y: 60 },
      { id: 'c_striker', shipType: 'dual_striker', sparkCost: 5, requires: [], x: 70, y: 20 },
      { id: 'c_intruder', shipType: 'ultraviolet_intruder', sparkCost: 15, requires: ['c_striker'], x: 60, y: 40 },
      { id: 'c_frigate_02', shipType: 'cf_frigate_02', sparkCost: 10, requires: ['c_striker'], x: 80, y: 40 },
      { id: 'c_bomber', shipType: 'bomber', sparkCost: 30, requires: ['c_intruder'], x: 60, y: 65 },
      { id: 'c_lc_04', shipType: 'cf_light_cruiser_04', sparkCost: 28, requires: ['c_frigate_02'], x: 80, y: 65 },
      {
        id: 'c_titan',
        shipType: 'hero_construct_titan',
        sparkCost: 55,
        requires: ['c_destroyer_01', 'c_bomber'],
        x: 50,
        y: 95,
        factionResourceCost: 60,
      },
    ],
  },
  void: {
    faction: 'void',
    capstoneNodeId: 'v_wraith',
    nodes: [
      { id: 'v_corvette_05', shipType: 'cf_corvette_05', sparkCost: 5, requires: [], x: 20, y: 20 },
      { id: 'v_camo', shipType: 'camo_stellar_jet', sparkCost: 12, requires: ['v_corvette_05'], x: 15, y: 40 },
      { id: 'v_frigate_04', shipType: 'cf_frigate_04', sparkCost: 15, requires: ['v_corvette_05'], x: 35, y: 40 },
      { id: 'v_infrared', shipType: 'infrared_furtive', sparkCost: 20, requires: ['v_camo'], x: 15, y: 60 },
      { id: 'v_destroyer_03', shipType: 'cf_destroyer_03', sparkCost: 28, requires: ['v_frigate_04'], x: 35, y: 60 },
      { id: 'v_racer', shipType: 'galactix_racer', sparkCost: 5, requires: [], x: 70, y: 20 },
      { id: 'v_slicer', shipType: 'meteor_slicer', sparkCost: 10, requires: ['v_racer'], x: 60, y: 40 },
      { id: 'v_frigate_05', shipType: 'cf_frigate_05', sparkCost: 15, requires: ['v_racer'], x: 80, y: 40 },
      { id: 'v_corvette_03', shipType: 'cf_corvette_03', sparkCost: 18, requires: ['v_slicer'], x: 60, y: 60 },
      { id: 'v_lc_03', shipType: 'cf_light_cruiser_03', sparkCost: 25, requires: ['v_frigate_05'], x: 80, y: 60 },
      {
        id: 'v_wraith',
        shipType: 'hero_void_wraith',
        sparkCost: 45,
        requires: ['v_infrared', 'v_corvette_03'],
        x: 50,
        y: 95,
        factionResourceCost: 45,
      },
    ],
  },
  legion: {
    faction: 'legion',
    capstoneNodeId: 'l_warlord',
    nodes: [
      { id: 'l_corvette_01', shipType: 'cf_corvette_01', sparkCost: 4, requires: [], x: 20, y: 20 },
      { id: 'l_corvette_02', shipType: 'cf_corvette_02', sparkCost: 8, requires: ['l_corvette_01'], x: 15, y: 40 },
      { id: 'l_corvette_03', shipType: 'cf_corvette_03', sparkCost: 10, requires: ['l_corvette_01'], x: 35, y: 40 },
      { id: 'l_frigate_01', shipType: 'cf_frigate_01', sparkCost: 15, requires: ['l_corvette_02'], x: 15, y: 60 },
      { id: 'l_frigate_04', shipType: 'cf_frigate_04', sparkCost: 18, requires: ['l_corvette_03'], x: 35, y: 60 },
      { id: 'l_dual_striker', shipType: 'dual_striker', sparkCost: 5, requires: [], x: 70, y: 20 },
      { id: 'l_warship', shipType: 'warship', sparkCost: 12, requires: ['l_dual_striker'], x: 60, y: 40 },
      { id: 'l_marine', shipType: 'star_marine_trooper', sparkCost: 15, requires: ['l_dual_striker'], x: 80, y: 40 },
      { id: 'l_destroyer', shipType: 'destroyer', sparkCost: 25, requires: ['l_warship'], x: 60, y: 65 },
      { id: 'l_cruiser', shipType: 'cruiser', sparkCost: 30, requires: ['l_marine'], x: 80, y: 65 },
      {
        id: 'l_warlord',
        shipType: 'hero_legion_warlord',
        sparkCost: 50,
        requires: ['l_destroyer', 'l_cruiser'],
        x: 50,
        y: 95,
        factionResourceCost: 55,
      },
    ],
  },
};
/** Battleship is shared across all factions ΓÇö unlocks at 60 total Spark earned. */
export const SHARED_SHIP_UNLOCK_THRESHOLD = 60;
export const SHARED_SHIPS = ['battleship'];
/**
 * Cross-faction Spark cost multiplier.
 * Your own faction tree = 1.0x (base cost).
 * Other faction trees = 1.5x (50% more expensive).
 * This makes branching into other trees a real strategic investment,
 * not impossible but not free either.
 */
export const CROSS_FACTION_SPARK_MULT = 1.5;
/** Calculate the effective Spark cost for a node, considering faction alignment. */
export function getEffectiveSparkCost(node: SparkShipNode, nodeFaction: SpaceFaction, playerFaction: SpaceFaction): number {
  const base = node.sparkCost;
  if (nodeFaction === playerFaction) return base;
  return Math.ceil(base * CROSS_FACTION_SPARK_MULT);
}
/** Check if a node's prerequisites are all unlocked. */
export function canUnlockNode(nodeId: string, faction: SpaceFaction, unlockedNodes: Set<string>): boolean {
  const tree = FACTION_SHIP_TREES[faction];
  if (!tree) return false;
  const node = tree.nodes.find((n) => n.id === nodeId);
  if (!node) return false;
  if (unlockedNodes.has(nodeId)) return false; // already unlocked
  return node.requires.every((reqId) => unlockedNodes.has(reqId));
}
/** Get all nodes a player can currently unlock (prereqs met, not yet unlocked). */
export function getAvailableNodes(
  playerFaction: SpaceFaction,
  unlockedNodes: Set<string>,
): { node: SparkShipNode; faction: SpaceFaction; cost: number }[] {
  const available: { node: SparkShipNode; faction: SpaceFaction; cost: number }[] = [];
  for (const [fac, tree] of Object.entries(FACTION_SHIP_TREES) as [SpaceFaction, FactionShipTree][]) {
    for (const node of tree.nodes) {
      if (unlockedNodes.has(node.id)) continue;
      if (node.requires.every((r) => unlockedNodes.has(r))) {
        available.push({ node, faction: fac, cost: getEffectiveSparkCost(node, fac, playerFaction) });
      }
    }
  }
  return available;
}
/** Get starting unlocked node IDs for a commander (their faction starters + commander bonus node). */
export function getStartingUnlocks(commanderId: string): Set<string> {
  const cmd = FACTION_COMMANDERS.find((c) => c.id === commanderId);
  if (!cmd) return new Set();
  const nodes = new Set<string>();
  // Commander's bonus starting unlock
  nodes.add(cmd.startingUnlock);
  // Also unlock all nodes whose shipType matches a faction starter ship
  // (so the player's starting ships are shown as unlocked in the tree)
  const starters = FACTION_STARTER_SHIPS[cmd.faction] ?? [];
  const tree = FACTION_SHIP_TREES[cmd.faction];
  if (tree) {
    for (const node of tree.nodes) {
      if (starters.includes(node.shipType)) {
        nodes.add(node.id);
      }
    }
  }
  return nodes;
}
/**
 * Planet-granted ship unlocks.
 * Capturing a planet of a specific type instantly unlocks these ships
 * for production ΓÇö no Spark required, but you lose them if you lose the planet.
 * The planet's unique resource enables specialized ship construction.
 */
export const PLANET_SHIP_UNLOCKS: Record<PlanetType, { ships: string[]; reason: string }> = {
  volcanic: { ships: ['cf_destroyer_05', 'cf_frigate_03'], reason: 'Volcanic ore forges siege-grade hull plating' },
  oceanic: { ships: ['transtellar', 'cf_corvette_04'], reason: 'Oceanic hydrogen fuels advanced shield generators' },
  barren: { ships: ['cf_destroyer_02', 'cf_corvette_03'], reason: 'Barren rare metals enable heavy railgun construction' },
  crystalline: { ships: ['cf_light_cruiser_05', 'cf_frigate_05'], reason: 'Crystalline lattices power precision energy weapons' },
  gas_giant: { ships: ['cf_light_cruiser_02', 'cf_destroyer_03'], reason: 'Gas giant isotopes fuel capital-class warp drives' },
  frozen: { ships: ['cf_corvette_02', 'cf_frigate_02'], reason: 'Cryo-minerals enable advanced torpedo warheads' },
  plasma: { ships: ['cf_light_cruiser_01', 'cf_destroyer_01'], reason: 'Plasma conduits power devastating energy lance arrays' },
  fungal: {
    ships: ['star_marine_trooper', 'interstellar_runner'],
    reason: 'Bio-organic compounds enable advanced boarding pods and repair drones',
  },
  metallic: { ships: ['cf_light_cruiser_04', 'cf_destroyer_04'], reason: 'Dense alloy cores enable ultra-heavy armor plating' },
  dark_matter: { ships: ['cf_light_cruiser_03', 'cf_frigate_04'], reason: 'Dark matter reactors power void-phase stealth systems' },
};
/** Get all ships unlocked by currently owned planets. */
export function getPlanetUnlockedShips(ownedPlanetTypes: PlanetType[]): Set<string> {
  const ships = new Set<string>();
  for (const pt of ownedPlanetTypes) {
    const unlock = PLANET_SHIP_UNLOCKS[pt];
    if (unlock) {
      for (const s of unlock.ships) ships.add(s);
    }
  }
  return ships;
}
/**
 * Planet level ΓåÆ max ship tier that planet can build.
 * L1 = T1 only, L2 = T1-T2, L3 = T1-T3, L4 = T1-T4, L5 = T1-T5 (hero ships).
 * Hero-class ships (T5 dreadnoughts, faction heroes) require a Level 5 planet.
 * Each planet level-up is a meaningful milestone that unlocks the next tier.
 */
export const PLANET_LEVEL_MAX_TIER: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };
/** Check if a specific planet can build a specific ship based on its level. */
export function canPlanetBuildTier(planetLevel: number | undefined, shipTier: number): boolean {
  const maxTier = PLANET_LEVEL_MAX_TIER[planetLevel ?? 1] ?? 1;
  return shipTier <= maxTier;
}
/**
 * Commanders per homeworld level.
 * You earn 1 commander slot per planet level of your homeworld.
 * L1 = 1 commander, L2 = 2, L3 = 3, L4 = 4, L5 = 5.
 * If a commander dies, they can be re-recruited at the homeworld after a respawn timer.
 */
export const COMMANDERS_PER_HOMEWORLD_LEVEL: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };
export const COMMANDER_FLEET_SIZE = 12; // max ships per commander fleet
export const COMMANDER_RESPAWN_TIME = 60; // game-seconds to respawn at homeworld
export const COMMANDER_RESPAWN_COST = { credits: 500, energy: 200, minerals: 300 };
/** All hero ship keys (T5, require L5 planet). */
export const ALL_HERO_SHIP_KEYS: string[] = [
  'custom_hero',
  'vanguard_prime',
  'shadow_reaper',
  'iron_bastion',
  'storm_herald',
  'plague_mother',
  'hero_wisdom_oracle',
  'hero_construct_titan',
  'hero_void_wraith',
  'hero_legion_warlord',
  'boss_ship_01',
  'boss_ship_02',
];
/** Check if a ship type is buildable for a team. Sources checked in order:
 * 1. Faction starter ships (always, regardless of planet level)
 * 2. Planet-granted unlocks (own a planet of the right type)
 * 3. Spark tree unlocks (any faction tree)
 * 4. Shared ships (total Spark threshold)
 *
 * IMPORTANT: Even if unlocked, the ship can only be BUILT from a planet
 * whose level is >= the ship's tier. This is enforced in queueBuild(),
 * not here. This function checks unlock status only.
 */
export function isShipBuildable(
  shipType: string,
  playerFaction: SpaceFaction,
  unlockedNodes: Set<string>,
  sparkTotal: number,
  ownedPlanetTypes?: PlanetType[],
): boolean {
  // 1. Faction starters
  if (FACTION_STARTER_SHIPS[playerFaction]?.includes(shipType)) return true;
  // 2. Planet-granted
  if (ownedPlanetTypes) {
    for (const pt of ownedPlanetTypes) {
      if (PLANET_SHIP_UNLOCKS[pt]?.ships.includes(shipType)) return true;
    }
  }
  // 3. Spark tree (any faction)
  for (const tree of Object.values(FACTION_SHIP_TREES)) {
    for (const node of tree.nodes) {
      if (node.shipType === shipType && unlockedNodes.has(node.id)) return true;
    }
  }
  // 4. Shared ships
  if (SHARED_SHIPS.includes(shipType) && sparkTotal >= SHARED_SHIP_UNLOCK_THRESHOLD) return true;
  return false;
}
// ΓöÇΓöÇ Tech Bonuses Default ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export function defaultTechBonuses(): TeamTechBonuses {
  return {
    attackMult: 1,
    armorBonus: 0,
    shieldMult: 1,
    speedMult: 1,
    healthMult: 1,
    resourceMult: 1,
    buildSpeedMult: 1,
    shieldRegenBonus: 0,
    cooldownReduction: 0,
  };
}
// ΓöÇΓöÇ Ship Definitions ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const SHIP_DEFINITIONS: Record<string, { class: ShipClass; stats: ShipStats; displayName: string }> = {
  micro_recon: {
    class: 'scout',
    displayName: 'MicroRecon',
    stats: {
      maxHp: 30,
      maxShield: 10,
      shieldRegen: 0.5,
      armor: 0,
      speed: 90,
      turnRate: 4,
      attackDamage: 5,
      attackRange: 120,
      attackCooldown: 0.8,
      attackType: 'laser',
      supplyCost: 1,
      buildTime: 5,
      creditCost: 50,
      energyCost: 10,
      mineralCost: 25,
      tier: 1,
      abilities: [
        {
          id: 'hack_weapons',
          name: 'Weapon Jam',
          key: 'Q',
          cooldown: 25,
          energyCost: 80,
          type: 'hack_weapons',
          duration: 6,
          hackTime: 3,
          hackRange: 800,
        },
        {
          id: 'hack_sensors',
          name: 'Sensor Jam',
          key: 'W',
          cooldown: 20,
          energyCost: 70,
          type: 'hack_sensors',
          duration: 8,
          hackTime: 3,
          hackRange: 900,
        },
      ],
    },
  },
  red_fighter: {
    class: 'fighter',
    displayName: 'RedFighter',
    stats: {
      maxHp: 60,
      maxShield: 20,
      shieldRegen: 1,
      armor: 1,
      speed: 70,
      turnRate: 3.5,
      attackDamage: 12,
      attackRange: 150,
      attackCooldown: 1.0,
      attackType: 'laser',
      supplyCost: 2,
      buildTime: 8,
      creditCost: 100,
      energyCost: 20,
      mineralCost: 50,
      tier: 1,
    },
  },
  galactix_racer: {
    class: 'interceptor',
    displayName: 'GalactixRacer',
    stats: {
      maxHp: 45,
      maxShield: 15,
      shieldRegen: 1,
      armor: 0,
      speed: 100,
      turnRate: 5,
      attackDamage: 8,
      attackRange: 130,
      attackCooldown: 0.6,
      attackType: 'laser',
      supplyCost: 2,
      buildTime: 7,
      creditCost: 80,
      energyCost: 25,
      mineralCost: 40,
      tier: 1,
      abilities: [{ id: 'speed_boost', name: 'Afterburner', key: 'Q', cooldown: 12, energyCost: 15, type: 'speed_boost', duration: 3 }],
    },
  },
  dual_striker: {
    class: 'heavy_fighter',
    displayName: 'DualStriker',
    stats: {
      maxHp: 80,
      maxShield: 30,
      shieldRegen: 1.5,
      armor: 2,
      speed: 60,
      turnRate: 2.8,
      attackDamage: 20,
      attackRange: 160,
      attackCooldown: 1.2,
      attackType: 'pulse',
      supplyCost: 3,
      buildTime: 12,
      creditCost: 150,
      energyCost: 30,
      mineralCost: 75,
      tier: 2,
    },
  },
  camo_stellar_jet: {
    class: 'stealth',
    displayName: 'CamoStellarJet',
    stats: {
      maxHp: 50,
      maxShield: 25,
      shieldRegen: 1,
      armor: 1,
      speed: 80,
      turnRate: 3.5,
      attackDamage: 18,
      attackRange: 140,
      attackCooldown: 1.5,
      attackType: 'laser',
      supplyCost: 3,
      buildTime: 15,
      creditCost: 200,
      energyCost: 50,
      mineralCost: 60,
      tier: 2,
      abilities: [
        { id: 'cloak', name: 'Cloaking Device', key: 'Q', cooldown: 20, energyCost: 30, type: 'cloak', duration: 8 },
        {
          id: 'hack_shields',
          name: 'Shield Breach',
          key: 'W',
          cooldown: 30,
          energyCost: 100,
          type: 'hack_shields',
          duration: 8,
          hackTime: 4,
          hackRange: 700,
        },
        {
          id: 'hack_siphon',
          name: 'Data Siphon',
          key: 'E',
          cooldown: 35,
          energyCost: 60,
          type: 'hack_siphon',
          duration: 10,
          hackTime: 5,
          hackRange: 600,
        },
      ],
    },
  },
  meteor_slicer: {
    class: 'fighter',
    displayName: 'MeteorSlicer',
    stats: {
      maxHp: 70,
      maxShield: 20,
      shieldRegen: 1,
      armor: 3,
      speed: 75,
      turnRate: 3,
      attackDamage: 25,
      attackRange: 80,
      attackCooldown: 0.8,
      attackType: 'pulse',
      supplyCost: 3,
      buildTime: 10,
      creditCost: 130,
      energyCost: 20,
      mineralCost: 65,
      tier: 2,
      abilities: [{ id: 'ram', name: 'Meteor Ram', key: 'Q', cooldown: 15, energyCost: 20, type: 'ram', duration: 1 }],
    },
  },
  infrared_furtive: {
    class: 'stealth',
    displayName: 'InfraredFurtive',
    stats: {
      maxHp: 55,
      maxShield: 30,
      shieldRegen: 2,
      armor: 1,
      speed: 72,
      turnRate: 3.2,
      attackDamage: 14,
      attackRange: 170,
      attackCooldown: 1.3,
      attackType: 'laser',
      supplyCost: 3,
      buildTime: 14,
      creditCost: 180,
      energyCost: 45,
      mineralCost: 55,
      tier: 2,
      abilities: [
        { id: 'emp', name: 'EMP Burst', key: 'Q', cooldown: 25, energyCost: 40, type: 'emp', duration: 3, radius: 120 },
        {
          id: 'hack_hijack',
          name: 'Hijack',
          key: 'W',
          cooldown: 90,
          energyCost: 200,
          type: 'hack_hijack',
          duration: 12,
          hackTime: 8,
          hackRange: 400,
        },
      ],
    },
  },
  pyramid_ship: {
    class: 'assault_frigate',
    displayName: 'PyramidShip',
    stats: {
      maxHp: 140,
      maxShield: 75,
      shieldRegen: 2.5,
      armor: 5,
      speed: 40,
      turnRate: 2.0,
      attackDamage: 30,
      attackRange: 185,
      attackCooldown: 2.2,
      attackType: 'pulse',
      supplyCost: 4,
      buildTime: 20,
      creditCost: 290,
      energyCost: 65,
      mineralCost: 110,
      tier: 3,
      abilities: [
        { id: 'iron_dome', name: 'Pyramid Shield', key: 'Q', cooldown: 35, energyCost: 55, type: 'iron_dome', duration: 8, radius: 130 },
      ],
    },
  },
  ultraviolet_intruder: {
    class: 'bomber',
    displayName: 'UltravioletIntruder',
    stats: {
      maxHp: 90,
      maxShield: 35,
      shieldRegen: 1,
      armor: 3,
      speed: 50,
      turnRate: 2,
      attackDamage: 40,
      attackRange: 130,
      attackCooldown: 2.5,
      attackType: 'torpedo',
      supplyCost: 4,
      buildTime: 18,
      creditCost: 250,
      energyCost: 50,
      mineralCost: 100,
      tier: 3,
    },
  },
  warship: {
    class: 'assault_frigate',
    displayName: 'Warship',
    stats: {
      maxHp: 150,
      maxShield: 60,
      shieldRegen: 2,
      armor: 5,
      speed: 40,
      turnRate: 1.8,
      attackDamage: 30,
      attackRange: 200,
      attackCooldown: 1.8,
      attackType: 'railgun',
      supplyCost: 5,
      buildTime: 20,
      creditCost: 300,
      energyCost: 60,
      mineralCost: 120,
      tier: 3,
      abilities: [
        { id: 'iron_dome', name: 'Point Defense', key: 'Q', cooldown: 30, energyCost: 40, type: 'iron_dome', duration: 6, radius: 100 },
      ],
    },
  },
  star_marine_trooper: {
    class: 'transport',
    displayName: 'StarMarineTrooper',
    stats: {
      maxHp: 120,
      maxShield: 40,
      shieldRegen: 1.5,
      armor: 4,
      speed: 45,
      turnRate: 2,
      attackDamage: 10,
      attackRange: 100,
      attackCooldown: 2.0,
      attackType: 'laser',
      supplyCost: 3,
      buildTime: 16,
      creditCost: 200,
      energyCost: 30,
      mineralCost: 80,
      tier: 3,
      abilities: [{ id: 'boarding', name: 'Board Enemy', key: 'Q', cooldown: 40, energyCost: 50, type: 'boarding', duration: 5 }],
    },
  },
  interstellar_runner: {
    class: 'transport',
    displayName: 'InterstellarRunner',
    stats: {
      maxHp: 100,
      maxShield: 30,
      shieldRegen: 1.5,
      armor: 2,
      speed: 65,
      turnRate: 2.5,
      attackDamage: 8,
      attackRange: 100,
      attackCooldown: 1.5,
      attackType: 'laser',
      supplyCost: 2,
      buildTime: 12,
      creditCost: 120,
      energyCost: 20,
      mineralCost: 60,
      tier: 2,
    },
  },
  transtellar: {
    class: 'transport',
    displayName: 'Transtellar',
    stats: {
      maxHp: 110,
      maxShield: 35,
      shieldRegen: 1.5,
      armor: 3,
      speed: 55,
      turnRate: 2.2,
      attackDamage: 10,
      attackRange: 110,
      attackCooldown: 1.8,
      attackType: 'laser',
      supplyCost: 3,
      buildTime: 14,
      creditCost: 160,
      energyCost: 25,
      mineralCost: 70,
      tier: 2,
    },
  },
  destroyer: {
    class: 'destroyer',
    displayName: 'Destroyer',
    stats: {
      maxHp: 250,
      maxShield: 100,
      shieldRegen: 3,
      armor: 6,
      speed: 35,
      turnRate: 1.5,
      attackDamage: 45,
      attackRange: 250,
      attackCooldown: 2.0,
      attackType: 'railgun',
      supplyCost: 6,
      buildTime: 30,
      creditCost: 500,
      energyCost: 100,
      mineralCost: 200,
      tier: 4,
      abilities: [{ id: 'barrel_roll', name: 'Evasive Roll', key: 'Q', cooldown: 15, energyCost: 25, type: 'barrel_roll', duration: 0.8 }],
    },
  },
  cruiser: {
    class: 'cruiser',
    displayName: 'Cruiser',
    stats: {
      maxHp: 400,
      maxShield: 150,
      shieldRegen: 4,
      armor: 8,
      speed: 28,
      turnRate: 1.2,
      attackDamage: 35,
      attackRange: 280,
      attackCooldown: 1.5,
      attackType: 'missile',
      supplyCost: 8,
      buildTime: 40,
      creditCost: 700,
      energyCost: 150,
      mineralCost: 300,
      tier: 4,
      abilities: [
        { id: 'launch_fighters', name: 'Launch Fighters', key: 'Q', cooldown: 45, energyCost: 60, type: 'launch_fighters', duration: 0 },
      ],
    },
  },
  bomber: {
    class: 'bomber',
    displayName: 'Bomber',
    stats: {
      maxHp: 200,
      maxShield: 60,
      shieldRegen: 2,
      armor: 5,
      speed: 32,
      turnRate: 1.5,
      attackDamage: 80,
      attackRange: 200,
      attackCooldown: 3.5,
      attackType: 'torpedo',
      supplyCost: 5,
      buildTime: 25,
      creditCost: 400,
      energyCost: 80,
      mineralCost: 150,
      tier: 4,
    },
  },
  battleship: {
    class: 'battleship',
    displayName: 'Battleship',
    stats: {
      maxHp: 800,
      maxShield: 300,
      shieldRegen: 5,
      armor: 12,
      speed: 18,
      turnRate: 0.8,
      attackDamage: 60,
      attackRange: 350,
      attackCooldown: 2.0,
      attackType: 'railgun',
      supplyCost: 12,
      buildTime: 60,
      creditCost: 1200,
      energyCost: 250,
      mineralCost: 500,
      tier: 5,
      abilities: [
        { id: 'iron_dome', name: 'Fortress Shield', key: 'Q', cooldown: 45, energyCost: 80, type: 'iron_dome', duration: 10, radius: 150 },
        { id: 'warp', name: 'Warp Jump', key: 'W', cooldown: 90, energyCost: 150, type: 'warp', duration: 2 },
      ],
    },
  },
  mining_drone: {
    class: 'worker',
    displayName: 'Mining Drone',
    stats: {
      maxHp: 25,
      maxShield: 5,
      shieldRegen: 0.5,
      armor: 0,
      speed: 130,
      turnRate: 5,
      attackDamage: 0,
      attackRange: 0,
      attackCooldown: 999,
      attackType: 'laser',
      supplyCost: 1,
      buildTime: 8,
      creditCost: 55,
      energyCost: 15,
      mineralCost: 25,
      tier: 1,
    },
  },
  energy_skimmer: {
    class: 'worker',
    displayName: 'Energy Skimmer',
    stats: {
      maxHp: 20,
      maxShield: 8,
      shieldRegen: 1.0,
      armor: 0,
      speed: 150,
      turnRate: 5,
      attackDamage: 0,
      attackRange: 0,
      attackCooldown: 999,
      attackType: 'laser',
      supplyCost: 1,
      buildTime: 8,
      creditCost: 50,
      energyCost: 20,
      mineralCost: 20,
      tier: 1,
    },
  },
  // ΓöÇΓöÇ Corvettes ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  cf_corvette_01: {
    class: 'corvette',
    displayName: 'Corvette Mk.I',
    stats: {
      maxHp: 55,
      maxShield: 20,
      shieldRegen: 1.2,
      armor: 1,
      speed: 110,
      turnRate: 4.5,
      attackDamage: 14,
      attackRange: 140,
      attackCooldown: 0.9,
      attackType: 'laser',
      supplyCost: 2,
      buildTime: 9,
      creditCost: 120,
      energyCost: 30,
      mineralCost: 50,
      tier: 1,
    },
  },
  cf_corvette_02: {
    class: 'corvette',
    displayName: 'Corvette Mk.II',
    stats: {
      maxHp: 65,
      maxShield: 25,
      shieldRegen: 1.5,
      armor: 2,
      speed: 105,
      turnRate: 4.2,
      attackDamage: 18,
      attackRange: 150,
      attackCooldown: 1.0,
      attackType: 'laser',
      supplyCost: 2,
      buildTime: 11,
      creditCost: 150,
      energyCost: 35,
      mineralCost: 60,
      tier: 2,
    },
  },
  cf_corvette_03: {
    class: 'corvette',
    displayName: 'Corvette Mk.III',
    stats: {
      maxHp: 75,
      maxShield: 30,
      shieldRegen: 1.5,
      armor: 2,
      speed: 100,
      turnRate: 4.0,
      attackDamage: 22,
      attackRange: 155,
      attackCooldown: 1.0,
      attackType: 'pulse',
      supplyCost: 3,
      buildTime: 13,
      creditCost: 180,
      energyCost: 40,
      mineralCost: 70,
      tier: 2,
    },
  },
  cf_corvette_04: {
    class: 'corvette',
    displayName: 'Tide Corvette',
    stats: {
      maxHp: 80,
      maxShield: 50,
      shieldRegen: 3.0,
      armor: 3,
      speed: 95,
      turnRate: 4.0,
      attackDamage: 20,
      attackRange: 160,
      attackCooldown: 1.1,
      attackType: 'laser',
      supplyCost: 3,
      buildTime: 14,
      creditCost: 200,
      energyCost: 50,
      mineralCost: 80,
      tier: 2,
      abilities: [
        { id: 'iron_dome', name: 'Shield Ram', key: 'Q', cooldown: 20, energyCost: 30, type: 'iron_dome', duration: 4, radius: 80 },
      ],
    },
  },
  cf_corvette_05: {
    class: 'corvette',
    displayName: 'Phantom Corvette',
    stats: {
      maxHp: 60,
      maxShield: 30,
      shieldRegen: 2.0,
      armor: 1,
      speed: 120,
      turnRate: 5.0,
      attackDamage: 28,
      attackRange: 145,
      attackCooldown: 0.8,
      attackType: 'laser',
      supplyCost: 3,
      buildTime: 14,
      creditCost: 220,
      energyCost: 55,
      mineralCost: 75,
      tier: 2,
      abilities: [{ id: 'cloak', name: 'Phase Cloak', key: 'Q', cooldown: 18, energyCost: 25, type: 'cloak', duration: 8 }],
    },
  },
  // ΓöÇΓöÇ Frigates ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  cf_frigate_01: {
    class: 'frigate',
    displayName: 'Frigate Mk.I',
    stats: {
      maxHp: 120,
      maxShield: 45,
      shieldRegen: 1.8,
      armor: 4,
      speed: 55,
      turnRate: 2.5,
      attackDamage: 28,
      attackRange: 200,
      attackCooldown: 1.4,
      attackType: 'missile',
      supplyCost: 4,
      buildTime: 18,
      creditCost: 280,
      energyCost: 60,
      mineralCost: 110,
      tier: 2,
    },
  },
  cf_frigate_02: {
    class: 'frigate',
    displayName: 'Frigate Mk.II',
    stats: {
      maxHp: 135,
      maxShield: 50,
      shieldRegen: 2.0,
      armor: 5,
      speed: 52,
      turnRate: 2.3,
      attackDamage: 34,
      attackRange: 210,
      attackCooldown: 1.5,
      attackType: 'missile',
      supplyCost: 4,
      buildTime: 20,
      creditCost: 320,
      energyCost: 70,
      mineralCost: 130,
      tier: 3,
    },
  },
  cf_frigate_03: {
    class: 'frigate',
    displayName: 'Siege Frigate',
    stats: {
      maxHp: 150,
      maxShield: 55,
      shieldRegen: 2.0,
      armor: 6,
      speed: 45,
      turnRate: 2.0,
      attackDamage: 50,
      attackRange: 280,
      attackCooldown: 2.2,
      attackType: 'railgun',
      supplyCost: 5,
      buildTime: 24,
      creditCost: 380,
      energyCost: 80,
      mineralCost: 160,
      tier: 3,
    },
  },
  cf_frigate_04: {
    class: 'frigate',
    displayName: 'Frigate Mk.IV',
    stats: {
      maxHp: 140,
      maxShield: 60,
      shieldRegen: 2.2,
      armor: 5,
      speed: 50,
      turnRate: 2.2,
      attackDamage: 38,
      attackRange: 220,
      attackCooldown: 1.6,
      attackType: 'missile',
      supplyCost: 5,
      buildTime: 22,
      creditCost: 350,
      energyCost: 75,
      mineralCost: 140,
      tier: 3,
    },
  },
  cf_frigate_05: {
    class: 'frigate',
    displayName: 'Frigate Mk.V',
    stats: {
      maxHp: 160,
      maxShield: 65,
      shieldRegen: 2.5,
      armor: 6,
      speed: 48,
      turnRate: 2.0,
      attackDamage: 44,
      attackRange: 230,
      attackCooldown: 1.7,
      attackType: 'torpedo',
      supplyCost: 5,
      buildTime: 25,
      creditCost: 400,
      energyCost: 85,
      mineralCost: 155,
      tier: 3,
    },
  },
  // ΓöÇΓöÇ Light Cruisers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  cf_light_cruiser_01: {
    class: 'light_cruiser',
    displayName: 'Prism Cruiser',
    stats: {
      maxHp: 320,
      maxShield: 130,
      shieldRegen: 3.5,
      armor: 8,
      speed: 32,
      turnRate: 1.6,
      attackDamage: 50,
      attackRange: 300,
      attackCooldown: 1.8,
      attackType: 'laser',
      supplyCost: 7,
      buildTime: 38,
      creditCost: 620,
      energyCost: 130,
      mineralCost: 270,
      tier: 4,
    },
  },
  cf_light_cruiser_02: {
    class: 'light_cruiser',
    displayName: 'Leviathan',
    stats: {
      maxHp: 380,
      maxShield: 180,
      shieldRegen: 5.0,
      armor: 9,
      speed: 28,
      turnRate: 1.4,
      attackDamage: 45,
      attackRange: 290,
      attackCooldown: 1.7,
      attackType: 'missile',
      supplyCost: 8,
      buildTime: 42,
      creditCost: 700,
      energyCost: 150,
      mineralCost: 310,
      tier: 4,
      abilities: [
        { id: 'iron_dome', name: 'Aegis Dome', key: 'Q', cooldown: 40, energyCost: 80, type: 'iron_dome', duration: 10, radius: 160 },
      ],
    },
  },
  cf_light_cruiser_03: {
    class: 'light_cruiser',
    displayName: 'Cruiser Mk.III',
    stats: {
      maxHp: 350,
      maxShield: 140,
      shieldRegen: 4.0,
      armor: 9,
      speed: 30,
      turnRate: 1.5,
      attackDamage: 55,
      attackRange: 310,
      attackCooldown: 2.0,
      attackType: 'railgun',
      supplyCost: 7,
      buildTime: 40,
      creditCost: 660,
      energyCost: 140,
      mineralCost: 290,
      tier: 4,
    },
  },
  cf_light_cruiser_04: {
    class: 'light_cruiser',
    displayName: 'Forge Cruiser',
    stats: {
      maxHp: 340,
      maxShield: 120,
      shieldRegen: 3.0,
      armor: 11,
      speed: 31,
      turnRate: 1.5,
      attackDamage: 72,
      attackRange: 320,
      attackCooldown: 1.6,
      attackType: 'railgun',
      supplyCost: 8,
      buildTime: 44,
      creditCost: 720,
      energyCost: 160,
      mineralCost: 320,
      tier: 4,
      abilities: [{ id: 'emp', name: 'Forge Blast', key: 'Q', cooldown: 30, energyCost: 90, type: 'emp', duration: 3, radius: 200 }],
    },
  },
  cf_light_cruiser_05: {
    class: 'light_cruiser',
    displayName: 'Cruiser Mk.V',
    stats: {
      maxHp: 400,
      maxShield: 150,
      shieldRegen: 4.5,
      armor: 10,
      speed: 27,
      turnRate: 1.3,
      attackDamage: 58,
      attackRange: 300,
      attackCooldown: 1.9,
      attackType: 'torpedo',
      supplyCost: 8,
      buildTime: 45,
      creditCost: 740,
      energyCost: 165,
      mineralCost: 330,
      tier: 4,
    },
  },
  // ΓöÇΓöÇ Craft Destroyers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  cf_destroyer_01: {
    class: 'destroyer',
    displayName: 'Destroyer Mk.I',
    stats: {
      maxHp: 270,
      maxShield: 110,
      shieldRegen: 3.2,
      armor: 7,
      speed: 38,
      turnRate: 1.6,
      attackDamage: 52,
      attackRange: 260,
      attackCooldown: 2.1,
      attackType: 'railgun',
      supplyCost: 6,
      buildTime: 32,
      creditCost: 520,
      energyCost: 110,
      mineralCost: 210,
      tier: 4,
    },
  },
  cf_destroyer_02: {
    class: 'destroyer',
    displayName: 'Destroyer Mk.II',
    stats: {
      maxHp: 290,
      maxShield: 120,
      shieldRegen: 3.5,
      armor: 7,
      speed: 36,
      turnRate: 1.5,
      attackDamage: 58,
      attackRange: 270,
      attackCooldown: 2.2,
      attackType: 'railgun',
      supplyCost: 7,
      buildTime: 35,
      creditCost: 560,
      energyCost: 120,
      mineralCost: 230,
      tier: 4,
    },
  },
  cf_destroyer_03: {
    class: 'destroyer',
    displayName: 'Storm Destroyer',
    stats: {
      maxHp: 260,
      maxShield: 105,
      shieldRegen: 3.0,
      armor: 6,
      speed: 45,
      turnRate: 2.0,
      attackDamage: 55,
      attackRange: 265,
      attackCooldown: 1.8,
      attackType: 'pulse',
      supplyCost: 6,
      buildTime: 33,
      creditCost: 540,
      energyCost: 115,
      mineralCost: 215,
      tier: 4,
      abilities: [{ id: 'emp', name: 'Ion Surge', key: 'Q', cooldown: 22, energyCost: 50, type: 'emp', duration: 3, radius: 160 }],
    },
  },
  cf_destroyer_04: {
    class: 'destroyer',
    displayName: 'Destroyer Mk.IV',
    stats: {
      maxHp: 310,
      maxShield: 130,
      shieldRegen: 3.8,
      armor: 8,
      speed: 34,
      turnRate: 1.4,
      attackDamage: 62,
      attackRange: 275,
      attackCooldown: 2.3,
      attackType: 'railgun',
      supplyCost: 7,
      buildTime: 36,
      creditCost: 580,
      energyCost: 125,
      mineralCost: 240,
      tier: 4,
    },
  },
  cf_destroyer_05: {
    class: 'destroyer',
    displayName: 'Tempest Destroyer',
    stats: {
      maxHp: 300,
      maxShield: 125,
      shieldRegen: 4.0,
      armor: 7,
      speed: 42,
      turnRate: 1.8,
      attackDamage: 60,
      attackRange: 270,
      attackCooldown: 2.0,
      attackType: 'pulse',
      supplyCost: 7,
      buildTime: 35,
      creditCost: 570,
      energyCost: 130,
      mineralCost: 235,
      tier: 4,
      abilities: [
        { id: 'speed_boost', name: 'Storm Drive', key: 'Q', cooldown: 15, energyCost: 35, type: 'speed_boost', duration: 5 },
        { id: 'emp', name: 'Tempest EMP', key: 'W', cooldown: 30, energyCost: 70, type: 'emp', duration: 4, radius: 180 },
      ],
    },
  },
  // ΓöÇΓöÇ Forge-Prefab Fleet (Sketchfab low-poly packs) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  fp_fighter_01: {
    class: 'fighter',
    displayName: 'Viper',
    stats: {
      maxHp: 55,
      maxShield: 18,
      shieldRegen: 1,
      armor: 1,
      speed: 80,
      turnRate: 3.8,
      attackDamage: 11,
      attackRange: 140,
      attackCooldown: 0.9,
      attackType: 'laser',
      supplyCost: 2,
      buildTime: 7,
      creditCost: 90,
      energyCost: 18,
      mineralCost: 45,
      tier: 1,
    },
  },
  fp_fighter_02: {
    class: 'heavy_fighter',
    displayName: 'Hornet',
    stats: {
      maxHp: 75,
      maxShield: 28,
      shieldRegen: 1.5,
      armor: 2,
      speed: 65,
      turnRate: 3.0,
      attackDamage: 18,
      attackRange: 155,
      attackCooldown: 1.1,
      attackType: 'pulse',
      supplyCost: 3,
      buildTime: 11,
      creditCost: 140,
      energyCost: 28,
      mineralCost: 70,
      tier: 2,
    },
  },
  fp_fighter_03: {
    class: 'fighter',
    displayName: 'Talon',
    stats: {
      maxHp: 65,
      maxShield: 22,
      shieldRegen: 1.2,
      armor: 1,
      speed: 75,
      turnRate: 3.5,
      attackDamage: 14,
      attackRange: 145,
      attackCooldown: 0.85,
      attackType: 'laser',
      supplyCost: 2,
      buildTime: 9,
      creditCost: 115,
      energyCost: 22,
      mineralCost: 55,
      tier: 2,
    },
  },
  fp_cruiser_01: {
    class: 'cruiser',
    displayName: 'Warden',
    stats: {
      maxHp: 360,
      maxShield: 130,
      shieldRegen: 3.5,
      armor: 7,
      speed: 30,
      turnRate: 1.3,
      attackDamage: 32,
      attackRange: 260,
      attackCooldown: 1.6,
      attackType: 'missile',
      supplyCost: 7,
      buildTime: 38,
      creditCost: 650,
      energyCost: 140,
      mineralCost: 280,
      tier: 3,
    },
  },
  fp_cruiser_02: {
    class: 'cruiser',
    displayName: 'Sentinel',
    stats: {
      maxHp: 420,
      maxShield: 160,
      shieldRegen: 4.2,
      armor: 9,
      speed: 26,
      turnRate: 1.1,
      attackDamage: 38,
      attackRange: 290,
      attackCooldown: 1.7,
      attackType: 'missile',
      supplyCost: 9,
      buildTime: 44,
      creditCost: 780,
      energyCost: 170,
      mineralCost: 340,
      tier: 4,
    },
  },
  fp_frigate_01: {
    class: 'frigate',
    displayName: 'Corsair',
    stats: {
      maxHp: 130,
      maxShield: 55,
      shieldRegen: 2.5,
      armor: 4,
      speed: 50,
      turnRate: 2.2,
      attackDamage: 22,
      attackRange: 190,
      attackCooldown: 1.3,
      attackType: 'pulse',
      supplyCost: 4,
      buildTime: 18,
      creditCost: 240,
      energyCost: 55,
      mineralCost: 110,
      tier: 2,
    },
  },
  fp_frigate_02: {
    class: 'frigate',
    displayName: 'Buccaneer',
    stats: {
      maxHp: 155,
      maxShield: 65,
      shieldRegen: 2.8,
      armor: 5,
      speed: 46,
      turnRate: 2.0,
      attackDamage: 26,
      attackRange: 200,
      attackCooldown: 1.4,
      attackType: 'pulse',
      supplyCost: 5,
      buildTime: 22,
      creditCost: 300,
      energyCost: 65,
      mineralCost: 135,
      tier: 3,
    },
  },
  fp_destroyer_01: {
    class: 'destroyer',
    displayName: 'Havoc',
    stats: {
      maxHp: 280,
      maxShield: 115,
      shieldRegen: 3.3,
      armor: 7,
      speed: 37,
      turnRate: 1.5,
      attackDamage: 54,
      attackRange: 265,
      attackCooldown: 2.1,
      attackType: 'railgun',
      supplyCost: 6,
      buildTime: 33,
      creditCost: 540,
      energyCost: 115,
      mineralCost: 220,
      tier: 4,
    },
  },
  fp_destroyer_02: {
    class: 'destroyer',
    displayName: 'Reaver',
    stats: {
      maxHp: 305,
      maxShield: 125,
      shieldRegen: 3.6,
      armor: 8,
      speed: 35,
      turnRate: 1.4,
      attackDamage: 60,
      attackRange: 275,
      attackCooldown: 2.2,
      attackType: 'railgun',
      supplyCost: 7,
      buildTime: 36,
      creditCost: 580,
      energyCost: 125,
      mineralCost: 240,
      tier: 4,
    },
  },
  fp_capital_01: {
    class: 'battleship',
    displayName: 'Leviathan',
    stats: {
      maxHp: 850,
      maxShield: 320,
      shieldRegen: 5.5,
      armor: 13,
      speed: 17,
      turnRate: 0.7,
      attackDamage: 65,
      attackRange: 360,
      attackCooldown: 2.0,
      attackType: 'railgun',
      supplyCost: 13,
      buildTime: 65,
      creditCost: 1300,
      energyCost: 270,
      mineralCost: 540,
      tier: 5,
      abilities: [
        { id: 'iron_dome', name: 'Bastion Shield', key: 'Q', cooldown: 45, energyCost: 90, type: 'iron_dome', duration: 10, radius: 160 },
      ],
    },
  },
  fp_heavy_dark: {
    class: 'cruiser',
    displayName: 'Obsidian',
    stats: {
      maxHp: 380,
      maxShield: 140,
      shieldRegen: 3.8,
      armor: 8,
      speed: 28,
      turnRate: 1.2,
      attackDamage: 34,
      attackRange: 270,
      attackCooldown: 1.5,
      attackType: 'missile',
      supplyCost: 8,
      buildTime: 40,
      creditCost: 680,
      energyCost: 150,
      mineralCost: 300,
      tier: 3,
      abilities: [{ id: 'cloak', name: 'Shadow Cloak', key: 'Q', cooldown: 30, energyCost: 50, type: 'cloak', duration: 8 }],
    },
  },
  fp_heavy_light: {
    class: 'light_cruiser',
    displayName: 'Aurora',
    stats: {
      maxHp: 220,
      maxShield: 90,
      shieldRegen: 3.0,
      armor: 5,
      speed: 40,
      turnRate: 1.8,
      attackDamage: 28,
      attackRange: 230,
      attackCooldown: 1.4,
      attackType: 'pulse',
      supplyCost: 5,
      buildTime: 26,
      creditCost: 380,
      energyCost: 85,
      mineralCost: 170,
      tier: 2,
    },
  },
  // ΓöÇΓöÇ Pirate Ships ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  pirate_01: {
    class: 'corvette',
    displayName: 'Pirate Raider',
    stats: {
      maxHp: 80,
      maxShield: 25,
      shieldRegen: 1.5,
      armor: 2,
      speed: 85,
      turnRate: 3.5,
      attackDamage: 18,
      attackRange: 160,
      attackCooldown: 1.0,
      attackType: 'laser',
      supplyCost: 0,
      buildTime: 0,
      creditCost: 0,
      energyCost: 0,
      mineralCost: 0,
      tier: 2,
    },
  },
  pirate_02: {
    class: 'fighter',
    displayName: 'Pirate Interceptor',
    stats: {
      maxHp: 55,
      maxShield: 15,
      shieldRegen: 1.0,
      armor: 1,
      speed: 100,
      turnRate: 4.0,
      attackDamage: 14,
      attackRange: 140,
      attackCooldown: 0.8,
      attackType: 'laser',
      supplyCost: 0,
      buildTime: 0,
      creditCost: 0,
      energyCost: 0,
      mineralCost: 0,
      tier: 1,
    },
  },
  pirate_03: {
    class: 'heavy_fighter',
    displayName: 'Pirate Marauder',
    stats: {
      maxHp: 100,
      maxShield: 35,
      shieldRegen: 2.0,
      armor: 3,
      speed: 70,
      turnRate: 3.0,
      attackDamage: 24,
      attackRange: 170,
      attackCooldown: 1.2,
      attackType: 'pulse',
      supplyCost: 0,
      buildTime: 0,
      creditCost: 0,
      energyCost: 0,
      mineralCost: 0,
      tier: 2,
    },
  },
  pirate_04: {
    class: 'frigate',
    displayName: 'Pirate Brigantine',
    stats: {
      maxHp: 150,
      maxShield: 50,
      shieldRegen: 2.5,
      armor: 5,
      speed: 50,
      turnRate: 2.2,
      attackDamage: 32,
      attackRange: 200,
      attackCooldown: 1.5,
      attackType: 'missile',
      supplyCost: 0,
      buildTime: 0,
      creditCost: 0,
      energyCost: 0,
      mineralCost: 0,
      tier: 3,
    },
  },
  pirate_05: {
    class: 'stealth',
    displayName: 'Pirate Phantom',
    stats: {
      maxHp: 60,
      maxShield: 30,
      shieldRegen: 2.0,
      armor: 1,
      speed: 95,
      turnRate: 4.0,
      attackDamage: 20,
      attackRange: 150,
      attackCooldown: 0.9,
      attackType: 'laser',
      supplyCost: 0,
      buildTime: 0,
      creditCost: 0,
      energyCost: 0,
      mineralCost: 0,
      tier: 2,
      abilities: [{ id: 'cloak', name: 'Ghost Shroud', key: 'Q', cooldown: 18, energyCost: 0, type: 'cloak', duration: 6 }],
    },
  },
  pirate_06: {
    class: 'bomber',
    displayName: 'Pirate Bombard',
    stats: {
      maxHp: 120,
      maxShield: 20,
      shieldRegen: 1.0,
      armor: 4,
      speed: 45,
      turnRate: 2.0,
      attackDamage: 50,
      attackRange: 180,
      attackCooldown: 2.5,
      attackType: 'torpedo',
      supplyCost: 0,
      buildTime: 0,
      creditCost: 0,
      energyCost: 0,
      mineralCost: 0,
      tier: 3,
    },
  },
  // ΓöÇΓöÇ Boss Captains ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  boss_captain_01: {
    class: 'cruiser',
    displayName: 'Skull Dreadlord',
    stats: {
      maxHp: 500,
      maxShield: 200,
      shieldRegen: 5,
      armor: 10,
      speed: 22,
      turnRate: 1.0,
      attackDamage: 55,
      attackRange: 280,
      attackCooldown: 1.6,
      attackType: 'railgun',
      supplyCost: 0,
      buildTime: 0,
      creditCost: 0,
      energyCost: 0,
      mineralCost: 0,
      tier: 4,
      abilities: [
        { id: 'iron_dome', name: 'Dread Shield', key: 'Q', cooldown: 25, energyCost: 0, type: 'iron_dome', duration: 8, radius: 160 },
      ],
    },
  },
  boss_captain_02: {
    class: 'battleship',
    displayName: 'Corsair Warlord',
    stats: {
      maxHp: 700,
      maxShield: 300,
      shieldRegen: 7,
      armor: 14,
      speed: 18,
      turnRate: 0.8,
      attackDamage: 70,
      attackRange: 320,
      attackCooldown: 1.8,
      attackType: 'missile',
      supplyCost: 0,
      buildTime: 0,
      creditCost: 0,
      energyCost: 0,
      mineralCost: 0,
      tier: 5,
      abilities: [
        { id: 'launch_fighters', name: 'Corsair Swarm', key: 'Q', cooldown: 30, energyCost: 0, type: 'launch_fighters', duration: 0 },
        { id: 'emp', name: 'Broadside', key: 'W', cooldown: 35, energyCost: 0, type: 'emp', duration: 3, radius: 200 },
      ],
    },
  },
  boss_captain_03: {
    class: 'cruiser',
    displayName: 'Claw Overlord',
    stats: {
      maxHp: 600,
      maxShield: 250,
      shieldRegen: 6,
      armor: 12,
      speed: 20,
      turnRate: 0.9,
      attackDamage: 60,
      attackRange: 300,
      attackCooldown: 1.4,
      attackType: 'pulse',
      supplyCost: 0,
      buildTime: 0,
      creditCost: 0,
      energyCost: 0,
      mineralCost: 0,
      tier: 4,
      abilities: [
        { id: 'ram', name: 'Claw Charge', key: 'Q', cooldown: 20, energyCost: 0, type: 'ram', duration: 1.5 },
        { id: 'iron_dome', name: 'Claw Guard', key: 'W', cooldown: 30, energyCost: 0, type: 'iron_dome', duration: 10, radius: 180 },
      ],
    },
  },
  // ΓöÇΓöÇ Boss / Dreadnoughts ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  boss_ship_01: {
    class: 'dreadnought',
    displayName: 'Command Dreadnought',
    stats: {
      maxHp: 1600,
      maxShield: 700,
      shieldRegen: 10,
      armor: 20,
      speed: 18,
      turnRate: 0.5,
      attackDamage: 120,
      attackRange: 450,
      attackCooldown: 1.6,
      attackType: 'railgun',
      supplyCost: 25,
      buildTime: 100,
      creditCost: 2400,
      energyCost: 500,
      mineralCost: 1000,
      tier: 5,
      abilities: [
        { id: 'iron_dome', name: 'Command Shield', key: 'Q', cooldown: 35, energyCost: 120, type: 'iron_dome', duration: 14, radius: 220 },
        { id: 'launch_fighters', name: 'Deploy Wing', key: 'W', cooldown: 30, energyCost: 80, type: 'launch_fighters', duration: 0 },
        { id: 'warp', name: 'Command Warp', key: 'E', cooldown: 60, energyCost: 180, type: 'warp', duration: 2 },
      ],
    },
  },
  boss_ship_02: {
    class: 'dreadnought',
    displayName: 'Apex Dreadnought',
    stats: {
      maxHp: 2400,
      maxShield: 1000,
      shieldRegen: 15,
      armor: 25,
      speed: 12,
      turnRate: 0.4,
      attackDamage: 180,
      attackRange: 500,
      attackCooldown: 1.4,
      attackType: 'railgun',
      supplyCost: 30,
      buildTime: 120,
      creditCost: 3200,
      energyCost: 700,
      mineralCost: 1400,
      tier: 5,
      abilities: [
        { id: 'iron_dome', name: 'Apex Shield', key: 'Q', cooldown: 30, energyCost: 150, type: 'iron_dome', duration: 16, radius: 260 },
        { id: 'emp', name: 'Annihilator', key: 'W', cooldown: 40, energyCost: 200, type: 'emp', duration: 5, radius: 350 },
        { id: 'warp', name: 'Phase Strike', key: 'E', cooldown: 45, energyCost: 200, type: 'warp', duration: 2 },
        { id: 'launch_fighters', name: 'Carrier Launch', key: 'R', cooldown: 25, energyCost: 100, type: 'launch_fighters', duration: 0 },
      ],
    },
  },
};
// ΓöÇΓöÇ Hero Definitions ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const HERO_DEFINITIONS: Record<string, { class: ShipClass; stats: ShipStats; displayName: string; lore: string }> = {
  vanguard_prime: {
    class: 'battleship',
    displayName: 'Vanguard Prime',
    lore: 'Legendary flagship that turns the tide of any battle.',
    stats: {
      maxHp: 1200,
      maxShield: 500,
      shieldRegen: 8,
      armor: 15,
      speed: 22,
      turnRate: 0.6,
      attackDamage: 100,
      attackRange: 400,
      attackCooldown: 1.8,
      attackType: 'railgun',
      supplyCost: 20,
      buildTime: 90,
      creditCost: 2000,
      energyCost: 400,
      mineralCost: 800,
      tier: 5,
      abilities: [
        { id: 'iron_dome', name: 'Nova Shield', key: 'Q', cooldown: 30, energyCost: 100, type: 'iron_dome', duration: 12, radius: 200 },
        { id: 'warp', name: 'Hyperspace Jump', key: 'W', cooldown: 60, energyCost: 200, type: 'warp', duration: 2 },
        { id: 'emp', name: 'Nova Cannon', key: 'E', cooldown: 45, energyCost: 150, type: 'emp', duration: 4, radius: 250 },
      ],
    },
  },
  shadow_reaper: {
    class: 'stealth',
    displayName: 'Shadow Reaper',
    lore: 'An assassin-class vessel that slips through defenses unseen.',
    stats: {
      maxHp: 200,
      maxShield: 100,
      shieldRegen: 4,
      armor: 5,
      speed: 110,
      turnRate: 4,
      attackDamage: 80,
      attackRange: 180,
      attackCooldown: 1.0,
      attackType: 'laser',
      supplyCost: 12,
      buildTime: 60,
      creditCost: 1500,
      energyCost: 350,
      mineralCost: 500,
      tier: 5,
      abilities: [
        { id: 'cloak', name: 'Phantom Cloak', key: 'Q', cooldown: 15, energyCost: 50, type: 'cloak', duration: 12 },
        { id: 'speed_boost', name: 'Shadow Dash', key: 'W', cooldown: 10, energyCost: 30, type: 'speed_boost', duration: 4 },
        { id: 'ram', name: 'Reaper Strike', key: 'E', cooldown: 20, energyCost: 60, type: 'ram', duration: 1.5 },
      ],
    },
  },
  iron_bastion: {
    class: 'cruiser',
    displayName: 'Iron Bastion',
    lore: 'Mobile fortress that anchors the fleet.',
    stats: {
      maxHp: 800,
      maxShield: 400,
      shieldRegen: 6,
      armor: 18,
      speed: 15,
      turnRate: 0.5,
      attackDamage: 40,
      attackRange: 300,
      attackCooldown: 1.5,
      attackType: 'missile',
      supplyCost: 18,
      buildTime: 80,
      creditCost: 1800,
      energyCost: 380,
      mineralCost: 700,
      tier: 5,
      abilities: [
        { id: 'launch_fighters', name: 'Swarm Launch', key: 'Q', cooldown: 30, energyCost: 80, type: 'launch_fighters', duration: 0 },
        { id: 'iron_dome', name: 'Aegis Grid', key: 'W', cooldown: 40, energyCost: 120, type: 'iron_dome', duration: 15, radius: 180 },
        { id: 'repair', name: 'Fleet Repair', key: 'E', cooldown: 50, energyCost: 100, type: 'repair', duration: 8, radius: 200 },
      ],
    },
  },
  storm_herald: {
    class: 'destroyer',
    displayName: 'Storm Herald',
    lore: 'Lightning-fast strike destroyer that unleashes electromagnetic devastation.',
    stats: {
      maxHp: 400,
      maxShield: 200,
      shieldRegen: 5,
      armor: 8,
      speed: 50,
      turnRate: 2,
      attackDamage: 65,
      attackRange: 280,
      attackCooldown: 1.2,
      attackType: 'pulse',
      supplyCost: 14,
      buildTime: 70,
      creditCost: 1600,
      energyCost: 350,
      mineralCost: 600,
      tier: 5,
      abilities: [
        { id: 'emp', name: 'Chain Lightning', key: 'Q', cooldown: 20, energyCost: 80, type: 'emp', duration: 3, radius: 180 },
        { id: 'barrel_roll', name: 'Storm Roll', key: 'W', cooldown: 12, energyCost: 30, type: 'barrel_roll', duration: 0.8 },
        { id: 'speed_boost', name: 'Surge Drive', key: 'E', cooldown: 18, energyCost: 40, type: 'speed_boost', duration: 5 },
      ],
    },
  },
  plague_mother: {
    class: 'carrier',
    displayName: 'Plague Mother',
    lore: 'Biological warfare carrier that spawns swarms of drone fighters.',
    stats: {
      maxHp: 600,
      maxShield: 150,
      shieldRegen: 3,
      armor: 10,
      speed: 20,
      turnRate: 0.7,
      attackDamage: 20,
      attackRange: 200,
      attackCooldown: 2.0,
      attackType: 'torpedo',
      supplyCost: 16,
      buildTime: 75,
      creditCost: 1400,
      energyCost: 300,
      mineralCost: 650,
      tier: 5,
      abilities: [
        { id: 'launch_fighters', name: 'Spawn Brood', key: 'Q', cooldown: 20, energyCost: 60, type: 'launch_fighters', duration: 0 },
        { id: 'launch_fighters', name: 'Drone Swarm', key: 'W', cooldown: 35, energyCost: 100, type: 'launch_fighters', duration: 0 },
        { id: 'boarding', name: 'Infest', key: 'E', cooldown: 40, energyCost: 80, type: 'boarding', duration: 6 },
      ],
    },
  },
  custom_hero: {
    class: 'dreadnought',
    displayName: 'Custom Hero Ship',
    lore: 'Your personal flagship, forged in the Ship Forge.',
    stats: {
      maxHp: 1000,
      maxShield: 400,
      shieldRegen: 7,
      armor: 14,
      speed: 25,
      turnRate: 0.7,
      attackDamage: 85,
      attackRange: 380,
      attackCooldown: 1.6,
      attackType: 'railgun',
      supplyCost: 18,
      buildTime: 80,
      creditCost: 1800,
      energyCost: 400,
      mineralCost: 750,
      tier: 5,
      abilities: [
        { id: 'iron_dome', name: 'Forge Shield', key: 'Q', cooldown: 30, energyCost: 90, type: 'iron_dome', duration: 10, radius: 180 },
        { id: 'warp', name: 'Homeworld Warp', key: 'W', cooldown: 50, energyCost: 160, type: 'warp', duration: 2 },
        { id: 'speed_boost', name: 'Forge Drive', key: 'E', cooldown: 18, energyCost: 40, type: 'speed_boost', duration: 5 },
      ],
    },
  },
};
// ΓöÇΓöÇ Buildable Ships & Heroes ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const BUILDABLE_SHIPS: Record<number, string[]> = {
  1: ['mining_drone', 'energy_skimmer', 'micro_recon', 'red_fighter', 'galactix_racer', 'cf_corvette_01', 'fp_fighter_01'],
  2: [
    'dual_striker',
    'camo_stellar_jet',
    'meteor_slicer',
    'infrared_furtive',
    'interstellar_runner',
    'transtellar',
    'cf_corvette_02',
    'cf_corvette_03',
    'cf_frigate_01',
    'fp_fighter_02',
    'fp_fighter_03',
    'fp_frigate_01',
    'fp_heavy_light',
  ],
  3: [
    'ultraviolet_intruder',
    'warship',
    'star_marine_trooper',
    'pyramid_ship',
    'cf_frigate_02',
    'cf_frigate_04',
    'cf_frigate_05',
    'fp_frigate_02',
    'fp_cruiser_01',
    'fp_heavy_dark',
  ],
  4: [
    'destroyer',
    'cruiser',
    'bomber',
    'cf_destroyer_01',
    'cf_destroyer_02',
    'cf_destroyer_04',
    'cf_light_cruiser_03',
    'cf_light_cruiser_05',
    'fp_cruiser_02',
    'fp_destroyer_01',
    'fp_destroyer_02',
  ],
  5: ['battleship', 'custom_hero', 'fp_capital_01'],
};
export const HERO_SHIPS: string[] = ['custom_hero', 'vanguard_prime', 'shadow_reaper', 'iron_bastion', 'storm_herald', 'plague_mother'];
export function getShipDef(key: string): { class: ShipClass; stats: ShipStats; displayName: string } | null {
  return SHIP_DEFINITIONS[key] ?? HERO_DEFINITIONS[key] ?? FACTION_HERO_DEFINITIONS[key] ?? null;
}
// ΓöÇΓöÇ Commander Constants ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const COMMANDER_NAMES = [
  'Vex Mara',
  'Solis Kane',
  'Rynn Holt',
  'Dex Void',
  'Kira Null',
  'Orion Blaze',
  'Lyra Storm',
  'Axon Prime',
  'Nova Crest',
  'Dusk Fray',
];
export const COMMANDER_XP_LEVELS = [0, 100, 250, 500, 900, 1500];
export const COMMANDER_TRAIN_TIME = [0, 30, 60, 120, 200, 360];
export const COMMANDER_TRAIN_COST = [
  { credits: 0, energy: 0, minerals: 0 },
  { credits: 200, energy: 80, minerals: 100 },
  { credits: 400, energy: 160, minerals: 200 },
  { credits: 700, energy: 280, minerals: 350 },
  { credits: 1100, energy: 440, minerals: 550 },
  { credits: 1600, energy: 640, minerals: 800 },
];
export const COMMANDER_SPEC_PLANET: Record<CommanderSpec, PlanetType> = {
  forge: 'volcanic',
  tide: 'oceanic',
  prism: 'crystalline',
  vortex: 'gas_giant',
  void: 'barren',
};
export const COMMANDER_SPEC_LABEL: Record<CommanderSpec, string> = {
  forge: 'Forge',
  tide: 'Tide',
  prism: 'Prism',
  vortex: 'Vortex',
  void: 'Void',
};
// ΓöÇΓöÇ Ship Roles ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const SHIP_ROLE_LABELS: Record<ShipRoleType, string> = {
  repair: 'Repair',
  void_caster: 'Void Caster',
  juggernaut: 'Juggernaut',
  star_splitter: 'Star Splitter',
};
export const SHIP_ROLE_COLORS: Record<ShipRoleType, string> = {
  repair: '#44ee88',
  void_caster: '#aa44ff',
  juggernaut: '#ff8822',
  star_splitter: '#ff4488',
};
export const SHIP_ROLES: Partial<Record<string, ShipRoleType>> = {
  interstellar_runner: 'repair',
  star_marine_trooper: 'repair',
  transtellar: 'repair',
  cf_frigate_01: 'repair',
  camo_stellar_jet: 'void_caster',
  infrared_furtive: 'void_caster',
  cf_corvette_04: 'void_caster',
  vanguard_prime: 'void_caster',
  warship: 'juggernaut',
  pyramid_ship: 'juggernaut',
  cf_light_cruiser_02: 'juggernaut',
  boss_ship_01: 'juggernaut',
  boss_ship_02: 'juggernaut',
  iron_bastion: 'juggernaut',
  cf_destroyer_04: 'juggernaut',
  galactix_racer: 'star_splitter',
  meteor_slicer: 'star_splitter',
  cf_corvette_01: 'star_splitter',
  cf_corvette_05: 'star_splitter',
  shadow_reaper: 'star_splitter',
  storm_herald: 'star_splitter',
  cf_destroyer_05: 'star_splitter',
  micro_recon: 'star_splitter',
  // Faction heroes
  hero_wisdom_oracle: 'void_caster',
  hero_construct_titan: 'juggernaut',
  hero_void_wraith: 'star_splitter',
  hero_legion_warlord: 'juggernaut',
};
// ΓöÇΓöÇ Faction Resources ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
import type { FactionResource, PlanetBuildingType } from './space-types';
export interface FactionResourceData {
  key: FactionResource;
  label: string;
  faction: SpaceFaction;
  color: string;
  icon: string;
  description: string;
  minPlanetLevel: 3 | 4 | 5;
  baseRate: number; // per game-minute at L3
}
export const FACTION_RESOURCE_DATA: Record<FactionResource, FactionResourceData> = {
  aetheric_ore: {
    key: 'aetheric_ore',
    label: 'Aetheric Ore',
    faction: 'wisdom',
    color: '#44ddff',
    icon: '≡ƒö«',
    description: 'Crystallized knowledge from beyond spacetime. Powers Wisdom hero ships.',
    minPlanetLevel: 3,
    baseRate: 2,
  },
  forge_alloy: {
    key: 'forge_alloy',
    label: 'Forge Alloy',
    faction: 'construct',
    color: '#ffaa22',
    icon: 'ΓÜÖ∩╕Å',
    description: 'Hyper-dense alloy forged in planetary cores. Powers Construct hero ships.',
    minPlanetLevel: 3,
    baseRate: 2,
  },
  void_crystal: {
    key: 'void_crystal',
    label: 'Void Crystal',
    faction: 'void',
    color: '#aa44ff',
    icon: '≡ƒÆÄ',
    description: 'Dark matter crystallized into pure energy. Powers Void hero ships.',
    minPlanetLevel: 3,
    baseRate: 2,
  },
  legion_core: {
    key: 'legion_core',
    label: 'Legion Core',
    faction: 'legion',
    color: '#ff4444',
    icon: '≡ƒ¢í∩╕Å',
    description: 'Armored command module replicated from ancient warlord tech. Powers Legion hero ships.',
    minPlanetLevel: 3,
    baseRate: 2,
  },
};
/** Maps faction ΓåÆ its unique resource. */
export const FACTION_TO_RESOURCE: Record<SpaceFaction, FactionResource> = {
  wisdom: 'aetheric_ore',
  construct: 'forge_alloy',
  void: 'void_crystal',
  legion: 'legion_core',
};
// ΓöÇΓöÇ Faction Hero Ship Definitions ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const FACTION_HERO_DEFINITIONS: Record<
  string,
  { class: ShipClass; stats: ShipStats; displayName: string; lore: string; faction: SpaceFaction; factionResourceCost: number }
> = {
  hero_wisdom_oracle: {
    class: 'carrier',
    faction: 'wisdom',
    factionResourceCost: 50,
    displayName: 'Oracle of Wisdom',
    lore: 'A vessel of pure insight. Its AI advisor predicts enemy movements before they happen.',
    stats: {
      maxHp: 900,
      maxShield: 500,
      shieldRegen: 8,
      armor: 10,
      speed: 22,
      turnRate: 0.7,
      attackDamage: 40,
      attackRange: 400,
      attackCooldown: 2.0,
      attackType: 'laser',
      supplyCost: 20,
      buildTime: 90,
      creditCost: 1800,
      energyCost: 500,
      mineralCost: 600,
      tier: 5,
      abilities: [
        { id: 'launch_fighters', name: 'Oracle Drones', key: 'Q', cooldown: 25, energyCost: 60, type: 'launch_fighters', duration: 0 },
        { id: 'repair', name: 'Wisdom Pulse', key: 'W', cooldown: 40, energyCost: 100, type: 'repair', duration: 10, radius: 250 },
        { id: 'emp', name: 'Mind Shatter', key: 'E', cooldown: 50, energyCost: 150, type: 'emp', duration: 4, radius: 300 },
      ],
    },
  },
  hero_construct_titan: {
    class: 'dreadnought',
    faction: 'construct',
    factionResourceCost: 60,
    displayName: 'Construct Titan',
    lore: 'A walking factory. Self-repairs, deploys turret platforms, and crushes anything in its path.',
    stats: {
      maxHp: 2000,
      maxShield: 800,
      shieldRegen: 12,
      armor: 22,
      speed: 14,
      turnRate: 0.4,
      attackDamage: 150,
      attackRange: 420,
      attackCooldown: 2.0,
      attackType: 'railgun',
      supplyCost: 28,
      buildTime: 110,
      creditCost: 2800,
      energyCost: 600,
      mineralCost: 1200,
      tier: 5,
      abilities: [
        { id: 'repair', name: 'Self-Reconstruct', key: 'Q', cooldown: 30, energyCost: 80, type: 'repair', duration: 8, radius: 0 },
        { id: 'iron_dome', name: 'Fortress Mode', key: 'W', cooldown: 45, energyCost: 120, type: 'iron_dome', duration: 14, radius: 220 },
        { id: 'launch_fighters', name: 'Deploy Turrets', key: 'E', cooldown: 35, energyCost: 100, type: 'launch_fighters', duration: 0 },
      ],
    },
  },
  hero_void_wraith: {
    class: 'stealth',
    faction: 'void',
    factionResourceCost: 45,
    displayName: 'Void Wraith',
    lore: 'A shadow given form. Phases through dimensions, tears rifts in reality, strikes unseen.',
    stats: {
      maxHp: 350,
      maxShield: 200,
      shieldRegen: 6,
      armor: 6,
      speed: 95,
      turnRate: 3.5,
      attackDamage: 100,
      attackRange: 200,
      attackCooldown: 1.0,
      attackType: 'pulse',
      supplyCost: 16,
      buildTime: 75,
      creditCost: 1600,
      energyCost: 450,
      mineralCost: 500,
      tier: 5,
      abilities: [
        { id: 'cloak', name: 'Phase Shift', key: 'Q', cooldown: 12, energyCost: 40, type: 'cloak', duration: 14 },
        { id: 'warp', name: 'Rift Walk', key: 'W', cooldown: 20, energyCost: 80, type: 'warp', duration: 1.5 },
        { id: 'emp', name: 'Void Tear', key: 'E', cooldown: 30, energyCost: 120, type: 'emp', duration: 5, radius: 200 },
        { id: 'speed_boost', name: 'Dark Rush', key: 'R', cooldown: 15, energyCost: 30, type: 'speed_boost', duration: 5 },
      ],
    },
  },
  hero_legion_warlord: {
    class: 'battleship',
    faction: 'legion',
    factionResourceCost: 55,
    displayName: 'Legion Warlord',
    lore: 'The embodiment of war. Its war cry empowers the entire fleet. Where it goes, armies follow.',
    stats: {
      maxHp: 1400,
      maxShield: 600,
      shieldRegen: 8,
      armor: 16,
      speed: 24,
      turnRate: 0.7,
      attackDamage: 90,
      attackRange: 380,
      attackCooldown: 1.5,
      attackType: 'missile',
      supplyCost: 22,
      buildTime: 95,
      creditCost: 2200,
      energyCost: 500,
      mineralCost: 900,
      tier: 5,
      abilities: [
        { id: 'launch_fighters', name: 'Summon Legion', key: 'Q', cooldown: 20, energyCost: 70, type: 'launch_fighters', duration: 0 },
        { id: 'iron_dome', name: 'War Cry', key: 'W', cooldown: 40, energyCost: 100, type: 'iron_dome', duration: 12, radius: 300 },
        { id: 'ram', name: 'Warlord Charge', key: 'E', cooldown: 25, energyCost: 60, type: 'ram', duration: 2 },
      ],
    },
  },
};
// ΓöÇΓöÇ Planet Building Definitions ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export interface PlanetBuildingDef {
  type: PlanetBuildingType;
  label: string;
  description: string;
  icon: string;
  cost: { credits: number; minerals: number; energy: number };
  buildTime: number; // game-seconds
  minPlanetLevel: number; // minimum planet level to build
  maxPerPlanet: number; // how many can exist on one planet
  factionLocked?: SpaceFaction; // only this faction can build it
}
export const PLANET_BUILDING_DEFS: Record<PlanetBuildingType, PlanetBuildingDef> = {
  station: {
    type: 'station',
    label: 'Station',
    icon: '≡ƒ¢á∩╕Å',
    description: 'Core orbital station. Builds ships and provides supply.',
    cost: { credits: 0, minerals: 0, energy: 0 },
    buildTime: 0,
    minPlanetLevel: 1,
    maxPerPlanet: 1,
  },
  refinery: {
    type: 'refinery',
    label: 'Refinery',
    icon: 'Γ¢Å∩╕Å',
    description: 'Boosts planet resource output by 25% per level.',
    cost: { credits: 300, minerals: 200, energy: 100 },
    buildTime: 30,
    minPlanetLevel: 1,
    maxPerPlanet: 2,
  },
  barracks: {
    type: 'barracks',
    label: 'Barracks',
    icon: '≡ƒÅó',
    description: 'Increases fleet supply cap by 10 per level.',
    cost: { credits: 250, minerals: 150, energy: 80 },
    buildTime: 25,
    minPlanetLevel: 1,
    maxPerPlanet: 2,
  },
  turret_platform: {
    type: 'turret_platform',
    label: 'Turret Platform',
    icon: '≡ƒ¢í∩╕Å',
    description: 'Adds an orbital defense turret slot to the planet.',
    cost: { credits: 400, minerals: 250, energy: 120 },
    buildTime: 35,
    minPlanetLevel: 2,
    maxPerPlanet: 3,
  },
  research_lab: {
    type: 'research_lab',
    label: 'Research Lab',
    icon: '≡ƒö¼',
    description: 'Enables tech research on this planet. +15% research speed per level.',
    cost: { credits: 500, minerals: 300, energy: 200 },
    buildTime: 45,
    minPlanetLevel: 2,
    maxPerPlanet: 1,
  },
  faction_forge: {
    type: 'faction_forge',
    label: 'Faction Forge',
    icon: '≡ƒöÑ',
    description: "Produces your faction's endgame resource. Required for faction hero ships.",
    cost: { credits: 800, minerals: 500, energy: 400 },
    buildTime: 60,
    minPlanetLevel: 3,
    maxPerPlanet: 1,
  },
};
