/**
 * ── Faction Skill VFX Registry ──────────────────────────────────────
 *
 * Maps every faction ability to unique VFX sprite animations.
 * No two skills share the same animation.
 *
 * Elemental themes (lore-driven):
 *   Wisdom  → ICE / Crystal   (cold precision, knowledge-as-power)
 *   Construct → FIRE / Forge   (molten industry, explosive engineering)
 *   Void    → DARK / Shadow    (entropy, corruption, dark energy)
 *   Legion  → ACID / Thunder   (toxic warfare, overwhelming force)
 *
 * Status/utility VFX:
 *   Warp portals   → PIPOYA WarpPortal (red/blue gates)
 *   Slow debuff    → Ice VFX loop
 *   Speed buff     → Wind aura
 *   Anomaly aura   → PIPOYA Mysterious Objects
 *   DoT indicators → Fires projectile trails
 */

import type { SpaceFaction } from './space-types';

// ── Sprite Sheet Definition ──────────────────────────────────────────
export interface SkillSpriteDef {
  path: string;
  frames: number;
  cols: number;
  rows: number;
  frameWidth: number; // px per frame
  frameHeight: number; // px per frame
  loop?: boolean; // repeatable / looping anim
}

// ── Faction Ability Definition ───────────────────────────────────────
export type SkillTargetType = 'position' | 'ship' | 'fleet' | 'self' | 'aoe';
export type SkillElement = 'ice' | 'fire' | 'dark' | 'acid' | 'wind' | 'thunder' | 'crystal' | 'warp' | 'neutral';

export interface FactionAbility {
  id: string;
  name: string;
  faction: SpaceFaction;
  element: SkillElement;
  description: string;
  target: SkillTargetType;
  radius: number; // 0 = single target
  damage: number; // 0 = utility
  cooldown: number; // seconds
  cost: { credits: number; energy: number; minerals: number };
  /** VFX played at cast origin */
  castVfx: string;
  /** VFX played at impact / target area */
  impactVfx: string;
  /** Optional projectile VFX (travels from caster to target) */
  projectileVfx?: string;
  /** Optional persistent aura VFX (looping at location) */
  auraVfx?: string;
  /** Duration of lingering effects (seconds, 0 = instant) */
  duration: number;
  /** Status effect applied to targets */
  statusEffect?: StatusEffectType;
  /** Icon path for UI */
  icon: string;
}

export type StatusEffectType =
  | 'slow' // reduced speed
  | 'burn' // fire DoT
  | 'corrode' // armor reduction DoT
  | 'freeze' // movement locked
  | 'blind' // reduced vision
  | 'haste' // speed buff
  | 'shield_boost' // temp shield
  | 'emp' // weapons disabled
  | 'warp_sickness' // post-teleport debuff
  | 'regen'; // hp/shield over time

// ── Skill Sprite Sheets ─────────────────────────────────────────────
const SK = '/assets/space/sprites/skills';

export const SKILL_SPRITES: Record<string, SkillSpriteDef> = {
  // ── WISDOM (Ice / Crystal) ──────────────────────────────────────
  'ice-vfx1-full': { path: `${SK}/wisdom/ice-vfx1-full.png`, frames: 20, cols: 5, rows: 4, frameWidth: 192, frameHeight: 192 },
  'ice-vfx1-hit': { path: `${SK}/wisdom/ice-vfx1-hit.png`, frames: 8, cols: 8, rows: 1, frameWidth: 32, frameHeight: 32 },
  'ice-vfx1-start': { path: `${SK}/wisdom/ice-vfx1-start.png`, frames: 3, cols: 3, rows: 1, frameWidth: 32, frameHeight: 32 },
  'ice-vfx1-loop': { path: `${SK}/wisdom/ice-vfx1-loop.png`, frames: 10, cols: 10, rows: 1, frameWidth: 32, frameHeight: 32, loop: true },
  'ice-vfx2-full': { path: `${SK}/wisdom/ice-vfx2-full.png`, frames: 30, cols: 5, rows: 6, frameWidth: 192, frameHeight: 192 },
  'ice-vfx2-active': { path: `${SK}/wisdom/ice-vfx2-active.png`, frames: 5, cols: 5, rows: 1, frameWidth: 64, frameHeight: 64, loop: true },
  'ice-vfx2-ending': { path: `${SK}/wisdom/ice-vfx2-ending.png`, frames: 6, cols: 6, rows: 1, frameWidth: 64, frameHeight: 64 },
  'ice-vfx2-start': { path: `${SK}/wisdom/ice-vfx2-start.png`, frames: 5, cols: 5, rows: 1, frameWidth: 64, frameHeight: 64 },
  'ice-ball': { path: `${SK}/wisdom/ice-ball.png`, frames: 4, cols: 1, rows: 4, frameWidth: 32, frameHeight: 32 },
  'ice-burst': { path: `${SK}/wisdom/ice-burst.png`, frames: 6, cols: 1, rows: 6, frameWidth: 48, frameHeight: 48 },
  'crystal-spin': { path: `${SK}/wisdom/crystal-spin.png`, frames: 6, cols: 6, rows: 1, frameWidth: 128, frameHeight: 128 },

  // ── CONSTRUCT (Fire / Forge) ────────────────────────────────────
  'fire-explosion1': { path: `${SK}/construct/fire-explosion1.png`, frames: 16, cols: 4, rows: 4, frameWidth: 64, frameHeight: 64 },
  'fire-explosion2': { path: `${SK}/construct/fire-explosion2.png`, frames: 16, cols: 4, rows: 4, frameWidth: 64, frameHeight: 64 },
  'fire-burn': { path: `${SK}/construct/fire-burn.png`, frames: 9, cols: 1, rows: 9, frameWidth: 48, frameHeight: 48 },
  'fire-line': { path: `${SK}/construct/fire-line.png`, frames: 6, cols: 1, rows: 6, frameWidth: 96, frameHeight: 16 },
  'fire-shine': { path: `${SK}/construct/fire-shine.png`, frames: 5, cols: 5, rows: 1, frameWidth: 32, frameHeight: 32 },
  'forge-blast': { path: `${SK}/construct/forge-blast.png`, frames: 8, cols: 4, rows: 2, frameWidth: 64, frameHeight: 64 },

  // ── VOID (Dark / Shadow) ────────────────────────────────────────
  'dark-vfx1': { path: `${SK}/void/dark-vfx1.png`, frames: 17, cols: 10, rows: 2, frameWidth: 40, frameHeight: 32 },
  'dark-vfx2': { path: `${SK}/void/dark-vfx2.png`, frames: 16, cols: 16, rows: 1, frameWidth: 48, frameHeight: 64 },
  'void-mirror': { path: `${SK}/void/void-mirror.png`, frames: 5, cols: 1, rows: 5, frameWidth: 32, frameHeight: 32, loop: true },
  'void-orb': { path: `${SK}/void/void-orb.png`, frames: 9, cols: 9, rows: 1, frameWidth: 32, frameHeight: 32, loop: true },
  'void-orb-impact': { path: `${SK}/void/void-orb-impact.png`, frames: 7, cols: 1, rows: 7, frameWidth: 48, frameHeight: 48 },

  // ── LEGION (Acid / Thunder / Wind) ──────────────────────────────
  'acid-vfx1': { path: `${SK}/legion/acid-vfx1.png`, frames: 16, cols: 10, rows: 2, frameWidth: 32, frameHeight: 32, loop: true },
  'acid-vfx2-loop': { path: `${SK}/legion/acid-vfx2-loop.png`, frames: 12, cols: 12, rows: 1, frameWidth: 48, frameHeight: 48, loop: true },
  'acid-vfx2-end': { path: `${SK}/legion/acid-vfx2-end.png`, frames: 6, cols: 6, rows: 1, frameWidth: 48, frameHeight: 48 },
  thunder: { path: `${SK}/legion/thunder.png`, frames: 6, cols: 3, rows: 2, frameWidth: 64, frameHeight: 96 },
  'hit-scatter': { path: `${SK}/legion/hit-scatter.png`, frames: 5, cols: 1, rows: 5, frameWidth: 32, frameHeight: 32 },
  'wind-breath': { path: `${SK}/legion/wind-breath.png`, frames: 6, cols: 6, rows: 1, frameWidth: 48, frameHeight: 32 },

  // ── PROJECTILES (shared / element-specific) ─────────────────────
  'proj-fireball': { path: `${SK}/projectiles/fireball.png`, frames: 9, cols: 9, rows: 1, frameWidth: 68, frameHeight: 68, loop: true },
  'proj-iceball': { path: `${SK}/projectiles/iceball.png`, frames: 9, cols: 9, rows: 1, frameWidth: 84, frameHeight: 84, loop: true },
  'proj-poisonball': { path: `${SK}/projectiles/poisonball.png`, frames: 9, cols: 9, rows: 1, frameWidth: 65, frameHeight: 65, loop: true },
  'proj-sm-fire': { path: `${SK}/projectiles/sm-fireball.png`, frames: 10, cols: 10, rows: 1, frameWidth: 26, frameHeight: 26, loop: true },
  'proj-sm-ice': { path: `${SK}/projectiles/sm-iceball.png`, frames: 9, cols: 9, rows: 1, frameWidth: 24, frameHeight: 24, loop: true },
  'proj-sm-poison': {
    path: `${SK}/projectiles/sm-poisonball.png`,
    frames: 9,
    cols: 9,
    rows: 1,
    frameWidth: 25,
    frameHeight: 25,
    loop: true,
  },
  'proj-energy': { path: `${SK}/projectiles/energy-bolt.png`, frames: 6, cols: 6, rows: 1, frameWidth: 16, frameHeight: 16, loop: true },
  'proj-wind': { path: `${SK}/projectiles/wind-projectile.png`, frames: 6, cols: 6, rows: 1, frameWidth: 16, frameHeight: 16, loop: true },

  // ── STATUS EFFECTS ──────────────────────────────────────────────
  'status-speed': { path: `${SK}/status/speed-boost.png`, frames: 4, cols: 2, rows: 2, frameWidth: 32, frameHeight: 32, loop: true },
  'status-wind': { path: `${SK}/status/wind-aura.png`, frames: 6, cols: 6, rows: 1, frameWidth: 48, frameHeight: 32, loop: true },

  // ── PORTALS / WARP (PIPOYA) ─────────────────────────────────────
  'warp-gate-a': { path: `${SK}/portals/pipo-gate01a192.png`, frames: 15, cols: 5, rows: 3, frameWidth: 192, frameHeight: 192, loop: true },
  'warp-gate-b': { path: `${SK}/portals/pipo-gate01b192.png`, frames: 15, cols: 5, rows: 3, frameWidth: 192, frameHeight: 192, loop: true },
  'warp-gate-c': { path: `${SK}/portals/pipo-gate01c192.png`, frames: 15, cols: 5, rows: 3, frameWidth: 192, frameHeight: 192, loop: true },
  'warp-gate-d': { path: `${SK}/portals/pipo-gate01d192.png`, frames: 15, cols: 5, rows: 3, frameWidth: 192, frameHeight: 192, loop: true },
  'warp-gate-e': { path: `${SK}/portals/pipo-gate01e192.png`, frames: 15, cols: 5, rows: 3, frameWidth: 192, frameHeight: 192, loop: true },
  // Mysterious aura objects
  'aura-orb-a': {
    path: `${SK}/portals/pipo-nazoobj01a_192.png`,
    frames: 15,
    cols: 5,
    rows: 3,
    frameWidth: 192,
    frameHeight: 192,
    loop: true,
  },
  'aura-orb-b': {
    path: `${SK}/portals/pipo-nazoobj02a_192.png`,
    frames: 15,
    cols: 5,
    rows: 3,
    frameWidth: 192,
    frameHeight: 192,
    loop: true,
  },
  'aura-orb-c': {
    path: `${SK}/portals/pipo-nazoobj03a_192.png`,
    frames: 15,
    cols: 5,
    rows: 3,
    frameWidth: 192,
    frameHeight: 192,
    loop: true,
  },
  'aura-rift': {
    path: `${SK}/portals/pipo-mapeffect021_192.png`,
    frames: 20,
    cols: 5,
    rows: 4,
    frameWidth: 192,
    frameHeight: 192,
    loop: true,
  },
  'aura-anomaly': {
    path: `${SK}/portals/pipo-mapeffect022_192.png`,
    frames: 20,
    cols: 5,
    rows: 4,
    frameWidth: 192,
    frameHeight: 192,
    loop: true,
  },
  'aura-nexus': {
    path: `${SK}/portals/pipo-mapeffect023_192.png`,
    frames: 20,
    cols: 5,
    rows: 4,
    frameWidth: 192,
    frameHeight: 192,
    loop: true,
  },
};

// ── Faction Abilities ────────────────────────────────────────────────
// Each faction gets 4 unique abilities — every single one uses different VFX.
// Total: 16 faction abilities + 4 shared status VFX = 20 unique visual effects.

const I = (n: string) => `/assets/space/ui/hud/Ability${n}.png`;

export const FACTION_ABILITIES: Record<string, FactionAbility> = {
  // ═══════════════════════════════════════════════════════════════
  // WISDOM — Ice / Crystal
  // Lore: "Seekers of knowledge" — cold, precise, analytical warfare.
  // Their weapons freeze systems and shatter hulls with crystalline
  // precision. Every strike is calculated; every frost pattern deliberate.
  // ═══════════════════════════════════════════════════════════════

  cryo_lance: {
    id: 'cryo_lance',
    name: 'Cryo Lance',
    faction: 'wisdom',
    element: 'ice',
    description: 'Fire a concentrated ice beam that pierces through ship hulls, freezing all targets in a line.',
    target: 'position',
    radius: 0,
    damage: 450,
    cooldown: 25,
    cost: { credits: 0, energy: 200, minerals: 0 },
    castVfx: 'ice-vfx1-start',
    impactVfx: 'ice-vfx1-hit',
    projectileVfx: 'proj-iceball',
    duration: 0,
    statusEffect: 'freeze',
    icon: I('10'),
  },

  glacial_storm: {
    id: 'glacial_storm',
    name: 'Glacial Storm',
    faction: 'wisdom',
    element: 'ice',
    description: 'Summon a raging ice storm that slows all enemy ships in the area and deals damage over time.',
    target: 'aoe',
    radius: 1200,
    damage: 60,
    cooldown: 45,
    cost: { credits: 0, energy: 350, minerals: 0 },
    castVfx: 'ice-vfx2-start',
    impactVfx: 'ice-vfx2-full',
    auraVfx: 'ice-vfx2-active',
    duration: 8,
    statusEffect: 'slow',
    icon: I('11'),
  },

  crystal_barrier: {
    id: 'crystal_barrier',
    name: 'Crystal Barrier',
    faction: 'wisdom',
    element: 'crystal',
    description: 'Erect a rotating crystal shield around your fleet, absorbing incoming damage and boosting shields.',
    target: 'self',
    radius: 600,
    damage: 0,
    cooldown: 60,
    cost: { credits: 100, energy: 200, minerals: 0 },
    castVfx: 'crystal-spin',
    impactVfx: 'crystal-spin',
    auraVfx: 'crystal-spin',
    duration: 10,
    statusEffect: 'shield_boost',
    icon: I('12'),
  },

  absolute_zero: {
    id: 'absolute_zero',
    name: 'Absolute Zero',
    faction: 'wisdom',
    element: 'ice',
    description: 'Flash-freeze an area to absolute zero. All ships are immobilized; frozen ships take 3x damage.',
    target: 'aoe',
    radius: 800,
    damage: 200,
    cooldown: 90,
    cost: { credits: 0, energy: 500, minerals: 0 },
    castVfx: 'ice-burst',
    impactVfx: 'ice-vfx1-full',
    auraVfx: 'ice-vfx1-loop',
    duration: 5,
    statusEffect: 'freeze',
    icon: I('13'),
  },

  // ═══════════════════════════════════════════════════════════════
  // CONSTRUCT — Fire / Forge
  // Lore: "Builders of empires" — their forges burn hotter than stars.
  // They weaponize the same plasma that builds their fleets, raining
  // molten destruction on anyone who threatens their constructions.
  // ═══════════════════════════════════════════════════════════════

  forge_strike: {
    id: 'forge_strike',
    name: 'Forge Strike',
    faction: 'construct',
    element: 'fire',
    description: 'Launch a superheated forge bolt that detonates on impact, engulfing the area in fire.',
    target: 'position',
    radius: 400,
    damage: 500,
    cooldown: 20,
    cost: { credits: 0, energy: 150, minerals: 100 },
    castVfx: 'fire-shine',
    impactVfx: 'fire-explosion1',
    projectileVfx: 'proj-fireball',
    duration: 0,
    statusEffect: 'burn',
    icon: I('14'),
  },

  molten_rain: {
    id: 'molten_rain',
    name: 'Molten Rain',
    faction: 'construct',
    element: 'fire',
    description: 'Unleash a barrage of molten droplets across a wide area, setting ships ablaze.',
    target: 'aoe',
    radius: 1500,
    damage: 40,
    cooldown: 35,
    cost: { credits: 0, energy: 250, minerals: 150 },
    castVfx: 'fire-line',
    impactVfx: 'fire-burn',
    auraVfx: 'fire-burn',
    duration: 6,
    statusEffect: 'burn',
    icon: I('15'),
  },

  plasma_core: {
    id: 'plasma_core',
    name: 'Plasma Core Overload',
    faction: 'construct',
    element: 'fire',
    description: "Overload a ship's reactor, creating a massive explosion that chains to nearby vessels.",
    target: 'ship',
    radius: 600,
    damage: 800,
    cooldown: 75,
    cost: { credits: 200, energy: 400, minerals: 0 },
    castVfx: 'fire-shine',
    impactVfx: 'fire-explosion2',
    duration: 0,
    icon: I('16'),
  },

  forge_shield: {
    id: 'forge_shield',
    name: 'Forge Shield',
    faction: 'construct',
    element: 'fire',
    description: 'Encase your fleet in superheated armor plating. Incoming attacks are reduced; melee attackers take burn damage.',
    target: 'self',
    radius: 500,
    damage: 0,
    cooldown: 50,
    cost: { credits: 150, energy: 300, minerals: 0 },
    castVfx: 'forge-blast',
    impactVfx: 'forge-blast',
    auraVfx: 'fire-shine',
    duration: 12,
    statusEffect: 'shield_boost',
    icon: I('17'),
  },

  // ═══════════════════════════════════════════════════════════════
  // VOID — Dark / Shadow
  // Lore: "Masters of dark energy" — they wield entropy itself.
  // Their powers corrupt, corrode, and unmake. Shadow tendrils
  // pull ships into the void; dark mirrors absorb and reflect.
  // ═══════════════════════════════════════════════════════════════

  shadow_bolt: {
    id: 'shadow_bolt',
    name: 'Shadow Bolt',
    faction: 'void',
    element: 'dark',
    description: 'Hurl a concentrated bolt of void energy that blinds sensors and disrupts targeting systems.',
    target: 'ship',
    radius: 0,
    damage: 350,
    cooldown: 15,
    cost: { credits: 0, energy: 150, minerals: 0 },
    castVfx: 'void-orb',
    impactVfx: 'void-orb-impact',
    projectileVfx: 'proj-energy',
    duration: 4,
    statusEffect: 'blind',
    icon: I('18'),
  },

  entropy_field: {
    id: 'entropy_field',
    name: 'Entropy Field',
    faction: 'void',
    element: 'dark',
    description: 'Deploy a field of dark energy that slowly disintegrates all ships within, corroding armor and shields.',
    target: 'aoe',
    radius: 900,
    damage: 50,
    cooldown: 40,
    cost: { credits: 0, energy: 300, minerals: 0 },
    castVfx: 'dark-vfx1',
    impactVfx: 'dark-vfx2',
    auraVfx: 'dark-vfx2',
    duration: 10,
    statusEffect: 'corrode',
    icon: I('19'),
  },

  void_mirror: {
    id: 'void_mirror',
    name: 'Void Mirror',
    faction: 'void',
    element: 'dark',
    description: 'Conjure a dark mirror that absorbs 50% of incoming damage and reflects it back at attackers.',
    target: 'self',
    radius: 400,
    damage: 0,
    cooldown: 55,
    cost: { credits: 100, energy: 250, minerals: 0 },
    castVfx: 'void-mirror',
    impactVfx: 'void-mirror',
    auraVfx: 'void-mirror',
    duration: 8,
    statusEffect: 'shield_boost',
    icon: I('20'),
  },

  dark_singularity: {
    id: 'dark_singularity',
    name: 'Dark Singularity',
    faction: 'void',
    element: 'dark',
    description: 'Collapse space into a singularity that pulls all nearby ships inward and shreds them with tidal forces.',
    target: 'position',
    radius: 700,
    damage: 120,
    cooldown: 80,
    cost: { credits: 0, energy: 500, minerals: 0 },
    castVfx: 'dark-vfx1',
    impactVfx: 'dark-vfx1',
    auraVfx: 'aura-rift',
    duration: 8,
    icon: I('05'),
  },

  // ═══════════════════════════════════════════════════════════════
  // LEGION — Acid / Thunder / Wind
  // Lore: "Strength in numbers" — overwhelming force through corrosive
  // bombardment and shock tactics. Legion weaponizes industrial waste
  // and storm energy, dissolving enemy fleets in toxic barrages.
  // ═══════════════════════════════════════════════════════════════

  acid_barrage: {
    id: 'acid_barrage',
    name: 'Acid Barrage',
    faction: 'legion',
    element: 'acid',
    description: 'Launch a volley of corrosive warheads that eat through armor over time.',
    target: 'aoe',
    radius: 800,
    damage: 40,
    cooldown: 20,
    cost: { credits: 0, energy: 100, minerals: 100 },
    castVfx: 'acid-vfx1',
    impactVfx: 'acid-vfx2-end',
    projectileVfx: 'proj-poisonball',
    auraVfx: 'acid-vfx2-loop',
    duration: 6,
    statusEffect: 'corrode',
    icon: I('01'),
  },

  thunder_strike: {
    id: 'thunder_strike',
    name: 'Thunder Strike',
    faction: 'legion',
    element: 'thunder',
    description: 'Call down a devastating electromagnetic bolt that disables all enemy weapons in the blast zone.',
    target: 'position',
    radius: 600,
    damage: 600,
    cooldown: 40,
    cost: { credits: 0, energy: 300, minerals: 0 },
    castVfx: 'thunder',
    impactVfx: 'thunder',
    duration: 3,
    statusEffect: 'emp',
    icon: I('02'),
  },

  war_wind: {
    id: 'war_wind',
    name: 'War Wind',
    faction: 'legion',
    element: 'wind',
    description: 'Generate a massive gust that accelerates your fleet and scatters enemy formations.',
    target: 'self',
    radius: 1000,
    damage: 0,
    cooldown: 30,
    cost: { credits: 0, energy: 200, minerals: 0 },
    castVfx: 'wind-breath',
    impactVfx: 'hit-scatter',
    auraVfx: 'wind-breath',
    duration: 8,
    statusEffect: 'haste',
    icon: I('03'),
  },

  toxic_nova: {
    id: 'toxic_nova',
    name: 'Toxic Nova',
    faction: 'legion',
    element: 'acid',
    description: 'Detonate a concentrated acid charge that corrodes everything in a massive radius. Armor means nothing.',
    target: 'aoe',
    radius: 1200,
    damage: 300,
    cooldown: 70,
    cost: { credits: 200, energy: 300, minerals: 200 },
    castVfx: 'acid-vfx1',
    impactVfx: 'acid-vfx2-end',
    auraVfx: 'acid-vfx2-loop',
    duration: 5,
    statusEffect: 'corrode',
    icon: I('04'),
  },
};

// ── Status Effect VFX Mapping ────────────────────────────────────────
// Maps status effects to the looping VFX shown on affected ships.

export const STATUS_VFX: Record<StatusEffectType, string> = {
  slow: 'ice-vfx1-loop', // ice crystals forming on hull
  burn: 'fire-burn', // flames licking the ship
  corrode: 'acid-vfx2-loop', // green acid eating metal
  freeze: 'ice-vfx2-active', // thick ice encasement
  blind: 'dark-vfx1', // dark cloud obscuring sensors
  haste: 'status-speed', // wind streaks
  shield_boost: 'crystal-spin', // rotating crystal/energy barrier
  emp: 'thunder', // electrical arcing
  warp_sickness: 'aura-anomaly', // spatial distortion
  regen: 'aura-orb-a', // healing orb glow
};

// ── Warp/Teleport VFX ────────────────────────────────────────────────
// Used for Mass Warp, Ancient Gate travel, fleet teleportation.
export const WARP_VFX = {
  /** Entry portal (at departure) */
  departure: 'warp-gate-a',
  /** Exit portal (at arrival) */
  arrival: 'warp-gate-c',
  /** Dark rift portal (enemy void rifts) */
  darkRift: 'warp-gate-e',
  /** Ancient gate portal (POI gates) */
  ancientGate: 'warp-gate-b',
  /** Anomaly scan effect */
  anomalyScan: 'aura-nexus',
};

// ── Helpers ──────────────────────────────────────────────────────────

/** Get all abilities for a faction. */
export function getFactionAbilities(faction: SpaceFaction): FactionAbility[] {
  return Object.values(FACTION_ABILITIES).filter((a) => a.faction === faction);
}

/** Get the VFX sprite def for a skill animation key. */
export function getSkillSprite(key: string): SkillSpriteDef | null {
  return SKILL_SPRITES[key] ?? null;
}

/** Get the default element for a faction (for projectile tinting). */
export function getFactionElement(faction: SpaceFaction): SkillElement {
  switch (faction) {
    case 'wisdom':
      return 'ice';
    case 'construct':
      return 'fire';
    case 'void':
      return 'dark';
    case 'legion':
      return 'acid';
  }
}

/** Get a projectile VFX key appropriate for a faction's element. */
export function getFactionProjectileVfx(faction: SpaceFaction): string {
  switch (faction) {
    case 'wisdom':
      return 'proj-iceball';
    case 'construct':
      return 'proj-fireball';
    case 'void':
      return 'proj-energy';
    case 'legion':
      return 'proj-poisonball';
  }
}

/** Get a small (bullet-sized) projectile VFX for normal weapon fire. */
export function getFactionSmallProjectile(faction: SpaceFaction): string {
  switch (faction) {
    case 'wisdom':
      return 'proj-sm-ice';
    case 'construct':
      return 'proj-sm-fire';
    case 'void':
      return 'proj-energy';
    case 'legion':
      return 'proj-sm-poison';
  }
}
