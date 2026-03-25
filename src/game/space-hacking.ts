/**
 * ── Cyber Intrusion / Hacking System ────────────────────────────────
 *
 * Scouts, stealth ships, and void_caster role ships can hack enemy
 * vessels and stations, producing sabotage effects that shift battles.
 *
 * Hacking is a CHANNELED ability:
 * 1. Hacker selects target → initiates hack (must stay in range)
 * 2. Cyber-terminal overlay shows boot sequence + scrolling code
 * 3. Progress bar fills over hackTime seconds
 * 4. If hacker moves, dies, or target dies → hack INTERRUPTED
 * 5. On success → debuff applied, "ACCESS GRANTED" shown
 * 6. On failure → "ACCESS DENIED" shown, cooldown still triggered
 *
 * Uses assets from craftpix Cyber Intrusion GUI pack exclusively.
 */

import type { HackType, ShipClass, Team, ActiveHack, SpaceShip } from './space-types';

// ── Asset Paths ──────────────────────────────────────────────────────
const H = '/assets/space/ui/hacking';

export const HACK_ASSETS = {
  // Monitor frames (increasing tier = more complex hack terminal)
  monitors: {
    t1: `${H}/monitor-bare.png`, // basic hack (scout)
    t2: `${H}/monitor-status.png`, // mid-tier hack
    t3: `${H}/monitor-cable.png`, // advanced hack
    t4: `${H}/monitor-full.png`, // elite hack (stealth)
    t5: `${H}/monitor-antenna.png`, // master hack (void_caster)
    t6: `${H}/monitor-workstation.png`, // legendary hack
  },
  // Spritesheet animations
  bootSequence: `${H}/boot-sequence.png`, // 7200×145 → 49 frames × 145px (boot-up)
  dataSiphon: `${H}/data-siphon.png`, // 4800×145 → 33 frames × 145px (file copy)
  hackResult: `${H}/hack-result.png`, // 7200×145 → 49 frames × 145px (granted/denied)
  pointer: `${H}/pointer.png`, // 2584×136 → 19 frames × 136px (targeting)
  ringLoader: `${H}/ring-loader.png`, // 544×136  → 4 frames × 136px (loading ring)
  // Static UI elements
  statusLights: `${H}/status-lights.png`,
  navButtons: `${H}/nav-buttons.png`,
  actionButtons: `${H}/action-buttons.png`,
  antennaBar: `${H}/antenna-bar.png`,
  controllerBox: `${H}/controller-box.png`,
  gamepad: `${H}/gamepad.png`,
  towerUnit: `${H}/tower-unit.png`,
  // Feedback
  accessDenied: `${H}/access-denied.png`,
  accessGranted: `${H}/access-granted.png`,
  // Signal / oscilloscope
  signalRed: `${H}/signal-red.png`,
  signalBlue: `${H}/signal-blue.png`,
  signalTiles: `${H}/signal-tiles.png`,
  // Progress bar
  loadingTile: `${H}/loading-tile.png`,
  // Display background
  displayBg: `${H}/display-bg.png`,
  // File icons
  folder: `${H}/folder.png`,
  folder2: `${H}/folder2.png`,
  // Directional arrows
  arrows: `${H}/arrows.png`,
  // Scrolling code text lines (1-13)
  codeLines: Array.from({ length: 13 }, (_, i) => `${H}/code-line-${i + 1}.png`),
  hackFont: `${H}/hack-font.png`,
} as const;

// ── Spritesheet Metadata ─────────────────────────────────────────────
export const HACK_SPRITE_META = {
  bootSequence: { width: 7200, height: 145, frameW: 145, frameH: 145, frames: 49, fps: 12 },
  dataSiphon: { width: 4800, height: 145, frameW: 145, frameH: 145, frames: 33, fps: 10 },
  hackResult: { width: 7200, height: 145, frameW: 145, frameH: 145, frames: 49, fps: 12 },
  pointer: { width: 2584, height: 136, frameW: 136, frameH: 136, frames: 19, fps: 8 },
  ringLoader: { width: 544, height: 136, frameW: 136, frameH: 136, frames: 4, fps: 4 },
} as const;

// ── Hack Definitions ─────────────────────────────────────────────────

export interface HackDefinition {
  type: HackType;
  name: string;
  description: string;
  /** Channel time in seconds (how long the hack takes) */
  channelTime: number;
  /** Max range to initiate and maintain the hack (game units) */
  range: number;
  /** Energy cost to attempt */
  energyCost: number;
  /** Cooldown after use (seconds), even if interrupted */
  cooldown: number;
  /** Duration of the debuff after successful hack */
  effectDuration: number;
  /** Which ship classes can perform this hack */
  eligibleClasses: ShipClass[];
  /** Monitor tier shown in HUD (1-6, higher = more complex terminal) */
  monitorTier: 1 | 2 | 3 | 4 | 5 | 6;
  /** Boot animation played during channel */
  channelAnim: 'bootSequence' | 'dataSiphon';
  /** Result animation on success/failure */
  resultAnim: 'hackResult';
  /** Color accent for the hack overlay (CSS) */
  accentColor: string;
  /** Icon path */
  icon: string;
}

const I = (n: string) => `/assets/space/ui/hud/Ability${n}.png`;

export const HACK_DEFINITIONS: Record<HackType, HackDefinition> = {
  // ── Weapon Jam ─────────────────────────────────────────────────
  // Scouts inject malware into the target's weapon control system,
  // causing all weapons to go offline. Fast channel, short effect.
  hack_weapons: {
    type: 'hack_weapons',
    name: 'Weapon Jam',
    description: 'Hack enemy weapon systems, disabling all weapons for the duration.',
    channelTime: 3,
    range: 800,
    energyCost: 80,
    cooldown: 25,
    effectDuration: 6,
    eligibleClasses: ['scout', 'stealth', 'corvette'],
    monitorTier: 1,
    channelAnim: 'bootSequence',
    resultAnim: 'hackResult',
    accentColor: '#ff4444',
    icon: I('21'),
  },

  // ── Shield Breach ──────────────────────────────────────────────
  // Override the target's shield harmonics, instantly dropping shields
  // to zero and preventing regen for the effect duration.
  hack_shields: {
    type: 'hack_shields',
    name: 'Shield Breach',
    description: 'Collapse enemy shields instantly and block shield regeneration.',
    channelTime: 4,
    range: 700,
    energyCost: 100,
    cooldown: 30,
    effectDuration: 8,
    eligibleClasses: ['scout', 'stealth', 'fighter', 'corvette'],
    monitorTier: 2,
    channelAnim: 'bootSequence',
    resultAnim: 'hackResult',
    accentColor: '#44ddff',
    icon: I('22'),
  },

  // ── Data Siphon ────────────────────────────────────────────────
  // Scouts intercept and redirect resource streams from the target's
  // local data links, siphoning credits and energy to your reserves.
  hack_siphon: {
    type: 'hack_siphon',
    name: 'Data Siphon',
    description: 'Steal credits and energy from the target over the hack duration.',
    channelTime: 5,
    range: 600,
    energyCost: 60,
    cooldown: 35,
    effectDuration: 10,
    eligibleClasses: ['scout', 'stealth'],
    monitorTier: 3,
    channelAnim: 'dataSiphon',
    resultAnim: 'hackResult',
    accentColor: '#44ff88',
    icon: I('23'),
  },

  // ── Sensor Jam ─────────────────────────────────────────────────
  // Flood the target's sensor array with noise, reducing its vision
  // radius to near-zero and breaking any target lock.
  hack_sensors: {
    type: 'hack_sensors',
    name: 'Sensor Jam',
    description: 'Blind the target — vision reduced to 100 units, target lock broken.',
    channelTime: 3,
    range: 900,
    energyCost: 70,
    cooldown: 20,
    effectDuration: 8,
    eligibleClasses: ['scout', 'corvette', 'fighter'],
    monitorTier: 1,
    channelAnim: 'bootSequence',
    resultAnim: 'hackResult',
    accentColor: '#ffaa22',
    icon: I('24'),
  },

  // ── Sabotage ───────────────────────────────────────────────────
  // Infiltrate a station or capital ship's production systems,
  // slowing build speed by 50% and dealing internal damage over time.
  hack_sabotage: {
    type: 'hack_sabotage',
    name: 'Sabotage',
    description: 'Infect target with malware — 50% build speed reduction and internal hull damage.',
    channelTime: 6,
    range: 600,
    energyCost: 120,
    cooldown: 45,
    effectDuration: 15,
    eligibleClasses: ['stealth', 'corvette'],
    monitorTier: 4,
    channelAnim: 'dataSiphon',
    resultAnim: 'hackResult',
    accentColor: '#aa44ff',
    icon: I('25'),
  },

  // ── Hijack ─────────────────────────────────────────────────────
  // The ultimate hack — seize control of an enemy ship's navigation
  // for a brief period. The ship fights for your team temporarily.
  // Only stealth ships can attempt this, and it has a long channel.
  hack_hijack: {
    type: 'hack_hijack',
    name: 'Hijack',
    description: 'Seize temporary control of an enemy ship. It fights for you until the effect expires.',
    channelTime: 8,
    range: 400,
    energyCost: 200,
    cooldown: 90,
    effectDuration: 12,
    eligibleClasses: ['stealth'],
    monitorTier: 5,
    channelAnim: 'dataSiphon',
    resultAnim: 'hackResult',
    accentColor: '#ff44aa',
    icon: I('26'),
  },
};

// ── Hack Ability Templates ───────────────────────────────────────────
// Pre-built ShipAbility objects that can be added to ship definitions.

import type { ShipAbility } from './space-types';

export function makeHackAbility(hackType: HackType, key: string): ShipAbility {
  const def = HACK_DEFINITIONS[hackType];
  return {
    id: hackType,
    name: def.name,
    key,
    cooldown: def.cooldown,
    energyCost: def.energyCost,
    type: hackType,
    duration: def.effectDuration,
    hackTime: def.channelTime,
    hackRange: def.range,
  };
}

/** Standard hack loadouts per ship class */
export const HACK_LOADOUTS: Partial<Record<ShipClass, HackType[]>> = {
  scout: ['hack_weapons', 'hack_sensors'],
  stealth: ['hack_shields', 'hack_siphon', 'hack_hijack'],
  corvette: ['hack_weapons', 'hack_sabotage'],
};

// ── Hack Eligibility Check ───────────────────────────────────────────

export function canShipHack(shipClass: ShipClass, hackType: HackType): boolean {
  const def = HACK_DEFINITIONS[hackType];
  return def.eligibleClasses.includes(shipClass);
}

export function getShipHackAbilities(shipClass: ShipClass): HackType[] {
  return HACK_LOADOUTS[shipClass] ?? [];
}

// ── Hack Success Chance ──────────────────────────────────────────────
// Hacks always succeed if channeled to completion.
// Higher-tier targets (capital ships) take longer to hack.

export function getAdjustedChannelTime(baseTime: number, targetShip: SpaceShip): number {
  // Capital ships are harder to hack (+50% channel time)
  const cls = targetShip.shipClass;
  if (cls === 'battleship' || cls === 'dreadnought' || cls === 'carrier') return baseTime * 1.5;
  if (cls === 'cruiser' || cls === 'destroyer') return baseTime * 1.25;
  return baseTime;
}

// ── Monitor Tier for HUD ─────────────────────────────────────────────

export function getMonitorAsset(tier: number): string {
  switch (tier) {
    case 1:
      return HACK_ASSETS.monitors.t1;
    case 2:
      return HACK_ASSETS.monitors.t2;
    case 3:
      return HACK_ASSETS.monitors.t3;
    case 4:
      return HACK_ASSETS.monitors.t4;
    case 5:
      return HACK_ASSETS.monitors.t5;
    case 6:
      return HACK_ASSETS.monitors.t6;
    default:
      return HACK_ASSETS.monitors.t1;
  }
}

/** Get a random code line image path for scrolling text effect */
export function getRandomCodeLine(): string {
  const idx = Math.floor(Math.random() * HACK_ASSETS.codeLines.length);
  return HACK_ASSETS.codeLines[idx];
}
