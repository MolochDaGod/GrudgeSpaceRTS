import type { PlanetType, UpgradeType } from './space-types';

// ── Tech Node ────────────────────────────────────────────────────────
export type TechEffectKind =
  | 'stat_bonus' // modifies a fleet-wide stat multiplier
  | 'unlock_ship' // adds a ship type to the buildable pool
  | 'active_ability' // grants a team-castable active ability
  | 'void_power' // unlocks a Void Power
  | 'resource_bonus' // passive resource multiplier
  | 'build_speed' // station build time reduction
  | 'turret_unlock' // unlocks turret type
  | 'passive_aura'; // aura that affects nearby ships

export interface TechEffect {
  kind: TechEffectKind;
  stat?: UpgradeType | 'all' | 'buildSpeed' | 'resourceAll';
  value?: number; // multiplier or flat bonus
  shipType?: string; // for unlock_ship
  abilityId?: string; // for active_ability / void_power
  turretType?: string; // for turret_unlock
}

export interface TechNode {
  id: string;
  name: string;
  description: string;
  tier: 1 | 2 | 3;
  cost: { credits: number; energy: number; minerals: number };
  requires: string[]; // ids of prerequisite nodes (same tree)
  effects: TechEffect[];
  icon: string; // path to craftpix icon png
  researchTime: number; // seconds
}

export interface TechTree {
  id: string;
  name: string;
  planetType: PlanetType | 'homeworld';
  color: number; // hex accent color
  nodes: TechNode[];
}

// ── Void Power ──────────────────────────────────────────────────────
export type VoidPowerTarget = 'position' | 'planet' | 'fleet' | 'enemy_fleet';
export type VoidPowerEffect = 'aoe_damage' | 'push' | 'pull_damage' | 'teleport_fleet' | 'aoe_scatter' | 'destroy_planet' | 'emp_aoe';

export interface VoidPower {
  id: string;
  name: string;
  description: string;
  techNodeId: string; // which tech node unlocks this
  target: VoidPowerTarget;
  effect: VoidPowerEffect;
  radius: number; // game units
  damage?: number;
  pushForce?: number;
  duration?: number;
  cost: { credits: number; energy: number; minerals: number };
  cooldown: number; // seconds
  icon: string;
}

const I = (n: string) => `/assets/space/ui/hud/Ability${n}.png`;

// ── Void Powers ──────────────────────────────────────────────────────
export const VOID_POWERS: Record<string, VoidPower> = {
  nova_cannon: {
    id: 'nova_cannon',
    name: 'Nova Cannon',
    description: 'Unleash a catastrophic energy explosion from the planet surface, annihilating all ships in range.',
    techNodeId: 'forge_t3_nova',
    target: 'position',
    effect: 'aoe_damage',
    radius: 2000,
    damage: 600,
    cost: { credits: 0, energy: 500, minerals: 0 },
    cooldown: 180,
    icon: I('01'),
  },
  tidal_wave: {
    id: 'tidal_wave',
    name: 'Tidal Wave',
    description: 'A gravitational surge erupts from the planet, hurling all enemy ships outward.',
    techNodeId: 'tide_t3_wave',
    target: 'planet',
    effect: 'push',
    radius: 1800,
    pushForce: 1200,
    cost: { credits: 0, energy: 400, minerals: 0 },
    cooldown: 120,
    icon: I('02'),
  },
  crystal_nova: {
    id: 'crystal_nova',
    name: 'Crystal Shard Nova',
    description: 'Crystalline shards explode outward dealing area damage and slowing enemies.',
    techNodeId: 'prism_t3_crystal',
    target: 'planet',
    effect: 'aoe_scatter',
    radius: 1500,
    damage: 350,
    duration: 4,
    cost: { credits: 0, energy: 0, minerals: 600 },
    cooldown: 150,
    icon: I('03'),
  },
  mass_warp: {
    id: 'mass_warp',
    name: 'Mass Warp',
    description: 'Instantly teleport your entire selected fleet to any position on the map.',
    techNodeId: 'vortex_t3_warp',
    target: 'position',
    effect: 'teleport_fleet',
    radius: 0,
    cost: { credits: 0, energy: 300, minerals: 0 },
    cooldown: 90,
    icon: I('04'),
  },
  void_rift: {
    id: 'void_rift',
    name: 'Void Rift',
    description: 'Tear a rift in space-time that pulls all ships toward it and shreds their hulls.',
    techNodeId: 'void_t3_rift',
    target: 'position',
    effect: 'pull_damage',
    radius: 600,
    damage: 80,
    duration: 8,
    cost: { credits: 0, energy: 400, minerals: 0 },
    cooldown: 200,
    icon: I('05'),
  },
  planet_crusher: {
    id: 'planet_crusher',
    name: 'Planet Crusher',
    description: 'A devastating command strike that utterly destroys a planet, removing it from the map permanently.',
    techNodeId: 'cmd_t3_crusher',
    target: 'planet',
    effect: 'destroy_planet',
    radius: 0,
    cost: { credits: 2000, energy: 1000, minerals: 1000 },
    cooldown: 600,
    icon: I('06'),
  },
};

// ── Turret Definitions ───────────────────────────────────────────────
export interface TurretDef {
  id: string;
  name: string;
  modelPath: string;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;
  attackType: 'laser' | 'missile' | 'railgun';
  maxHp: number;
  cost: { credits: number; energy: number; minerals: number };
  requiresTech?: string; // tech node id required before building
  icon: string;
}

export const TURRET_DEFS: Record<string, TurretDef> = {
  laser_turret: {
    id: 'laser_turret',
    name: 'Laser Turret',
    modelPath: '/assets/space/models/turrets/_Turel_01.fbx',
    attackDamage: 300,
    attackRange: 450,
    attackCooldown: 1.0,
    attackType: 'laser',
    maxHp: 400,
    cost: { credits: 150, energy: 50, minerals: 80 },
    icon: '/assets/space/ui/hud/Ability07.png',
  },
  missile_turret: {
    id: 'missile_turret',
    name: 'Missile Turret',
    modelPath: '/assets/space/models/turrets/_Turel_02.fbx',
    attackDamage: 500,
    attackRange: 650,
    attackCooldown: 2.5,
    attackType: 'missile',
    maxHp: 350,
    cost: { credits: 250, energy: 80, minerals: 150 },
    icon: '/assets/space/ui/hud/Ability08.png',
  },
  railgun_turret: {
    id: 'railgun_turret',
    name: 'Railgun Turret',
    modelPath: '/assets/space/models/turrets/_Turel_03.fbx',
    attackDamage: 850,
    attackRange: 900,
    attackCooldown: 3.5,
    attackType: 'railgun',
    maxHp: 500,
    cost: { credits: 400, energy: 120, minerals: 220 },
    requiresTech: 'forge_t2_siege',
    icon: '/assets/space/ui/hud/Ability09.png',
  },
};

// ── Tech Trees ──────────────────────────────────────────────────────

const forgeTech: TechTree = {
  id: 'forge',
  name: 'Forge Tech',
  planetType: 'volcanic',
  color: 0xff4422,
  nodes: [
    // Tier 1
    {
      id: 'forge_t1_cannons',
      name: 'Enhanced Cannons',
      tier: 1,
      requires: [],
      description: 'All fleet weapons deal +20% damage.',
      cost: { credits: 200, energy: 80, minerals: 100 },
      researchTime: 20,
      icon: I('10'),
      effects: [{ kind: 'stat_bonus', stat: 'attack', value: 0.2 }],
    },
    {
      id: 'forge_t1_incendiary',
      name: 'Incendiary Rounds',
      tier: 1,
      requires: [],
      description: 'Weapon hits apply a burn DoT dealing 15 dmg/s for 3s.',
      cost: { credits: 180, energy: 60, minerals: 80 },
      researchTime: 18,
      icon: I('11'),
      effects: [{ kind: 'passive_aura', abilityId: 'burn_dot', value: 15 }],
    },
    {
      id: 'forge_t1_plating',
      name: 'Forge Plating',
      tier: 1,
      requires: [],
      description: 'All ships gain +15% armor rating.',
      cost: { credits: 160, energy: 50, minerals: 120 },
      researchTime: 16,
      icon: I('12'),
      effects: [{ kind: 'stat_bonus', stat: 'armor', value: 0.15 }],
    },
    // Tier 2
    {
      id: 'forge_t2_siege',
      name: 'Siege Launchers',
      tier: 2,
      requires: ['forge_t1_cannons', 'forge_t1_plating'],
      description: 'Unlocks Frigate_03 (heavy siege warship). +20% attack range for frigates.',
      cost: { credits: 400, energy: 150, minerals: 200 },
      researchTime: 35,
      icon: I('13'),
      effects: [
        { kind: 'unlock_ship', shipType: 'cf_frigate_03' },
        { kind: 'turret_unlock', turretType: 'railgun_turret' },
      ],
    },
    {
      id: 'forge_t2_overcharge',
      name: 'Overcharge',
      tier: 2,
      requires: ['forge_t1_cannons'],
      description: 'Grants an active ability: double attack speed for all ships for 10s (90s CD).',
      cost: { credits: 350, energy: 180, minerals: 120 },
      researchTime: 30,
      icon: I('14'),
      effects: [{ kind: 'active_ability', abilityId: 'overcharge' }],
    },
    {
      id: 'forge_t2_molten',
      name: 'Molten Core',
      tier: 2,
      requires: ['forge_t1_plating'],
      description: 'Planet stations build ships 30% faster.',
      cost: { credits: 300, energy: 100, minerals: 150 },
      researchTime: 28,
      icon: I('15'),
      effects: [{ kind: 'build_speed', value: 0.3 }],
    },
    // Tier 3
    {
      id: 'forge_t3_nova',
      name: 'Nova Cannon Protocol',
      tier: 3,
      requires: ['forge_t2_siege', 'forge_t2_overcharge', 'forge_t2_molten'],
      description: 'Unlocks the Nova Cannon Void Power and the LightCruiser_04 Forge-class warship.',
      cost: { credits: 800, energy: 400, minerals: 400 },
      researchTime: 60,
      icon: I('16'),
      effects: [
        { kind: 'void_power', abilityId: 'nova_cannon' },
        { kind: 'unlock_ship', shipType: 'cf_light_cruiser_04' },
      ],
    },
  ],
};

const tideTech: TechTree = {
  id: 'tide',
  name: 'Tide Tech',
  planetType: 'oceanic',
  color: 0x2266cc,
  nodes: [
    {
      id: 'tide_t1_shields',
      name: 'Reinforced Shields',
      tier: 1,
      requires: [],
      description: 'All ships gain +25% max shield capacity.',
      cost: { credits: 200, energy: 100, minerals: 60 },
      researchTime: 20,
      icon: I('17'),
      effects: [{ kind: 'stat_bonus', stat: 'shield', value: 0.25 }],
    },
    {
      id: 'tide_t1_regen',
      name: 'Tidal Regen',
      tier: 1,
      requires: [],
      description: 'All ships gain +2 shield regen per second.',
      cost: { credits: 160, energy: 80, minerals: 50 },
      researchTime: 16,
      icon: I('18'),
      effects: [{ kind: 'passive_aura', abilityId: 'shield_regen_bonus', value: 2 }],
    },
    {
      id: 'tide_t1_deflect',
      name: 'Deflector Grid',
      tier: 1,
      requires: [],
      description: '10% of all incoming damage is reflected back to attackers.',
      cost: { credits: 180, energy: 70, minerals: 80 },
      researchTime: 18,
      icon: I('19'),
      effects: [{ kind: 'passive_aura', abilityId: 'dmg_reflect', value: 0.1 }],
    },
    {
      id: 'tide_t2_barrier',
      name: 'Bubble Barrier',
      tier: 2,
      requires: ['tide_t1_shields', 'tide_t1_regen'],
      description: 'Active: surround all ships in a shield bubble for 12s (120s CD).',
      cost: { credits: 380, energy: 200, minerals: 100 },
      researchTime: 35,
      icon: I('20'),
      effects: [{ kind: 'active_ability', abilityId: 'bubble_barrier' }],
    },
    {
      id: 'tide_t2_wake',
      name: 'Healing Wake',
      tier: 2,
      requires: ['tide_t1_regen'],
      description: 'Ships in formation restore 5 HP/s to adjacent allies.',
      cost: { credits: 320, energy: 150, minerals: 80 },
      researchTime: 30,
      icon: I('21'),
      effects: [{ kind: 'passive_aura', abilityId: 'healing_wake', value: 5 }],
    },
    {
      id: 'tide_t2_corvette',
      name: 'Oceanic Corvette',
      tier: 2,
      requires: ['tide_t1_deflect'],
      description: 'Unlocks Corvette_04, a fast shield-ramming interceptor.',
      cost: { credits: 300, energy: 120, minerals: 100 },
      researchTime: 28,
      icon: I('22'),
      effects: [{ kind: 'unlock_ship', shipType: 'cf_corvette_04' }],
    },
    {
      id: 'tide_t3_wave',
      name: 'Tidal Wave Protocol',
      tier: 3,
      requires: ['tide_t2_barrier', 'tide_t2_wake', 'tide_t2_corvette'],
      description: 'Unlocks the Tidal Wave Void Power and LightCruiser_02 Leviathan-class.',
      cost: { credits: 700, energy: 500, minerals: 250 },
      researchTime: 60,
      icon: I('23'),
      effects: [
        { kind: 'void_power', abilityId: 'tidal_wave' },
        { kind: 'unlock_ship', shipType: 'cf_light_cruiser_02' },
      ],
    },
  ],
};

const prismTech: TechTree = {
  id: 'prism',
  name: 'Prism Tech',
  planetType: 'crystalline',
  color: 0x44ddcc,
  nodes: [
    {
      id: 'prism_t1_extract',
      name: 'Crystal Extraction',
      tier: 1,
      requires: [],
      description: 'Resource nodes yield +40% more resources.',
      cost: { credits: 180, energy: 60, minerals: 100 },
      researchTime: 18,
      icon: I('24'),
      effects: [{ kind: 'resource_bonus', stat: 'resourceAll', value: 0.4 }],
    },
    {
      id: 'prism_t1_refract',
      name: 'Refraction Arrays',
      tier: 1,
      requires: [],
      description: 'Planet credit income is doubled.',
      cost: { credits: 220, energy: 50, minerals: 80 },
      researchTime: 20,
      icon: I('25'),
      effects: [{ kind: 'resource_bonus', stat: 'resourceAll', value: 0.25 }],
    },
    {
      id: 'prism_t1_weave',
      name: 'Crystal Weave',
      tier: 1,
      requires: [],
      description: 'All ships gain +10% to all stats (minor all-round enhancement).',
      cost: { credits: 200, energy: 80, minerals: 120 },
      researchTime: 22,
      icon: I('10'),
      effects: [{ kind: 'stat_bonus', stat: 'all', value: 0.1 }],
    },
    {
      id: 'prism_t2_network',
      name: 'Prism Network',
      tier: 2,
      requires: ['prism_t1_extract', 'prism_t1_refract'],
      description: 'Every 10 seconds, all resources are boosted by +10% across your economy.',
      cost: { credits: 400, energy: 120, minerals: 200 },
      researchTime: 35,
      icon: I('11'),
      effects: [{ kind: 'resource_bonus', stat: 'resourceAll', value: 0.1 }],
    },
    {
      id: 'prism_t2_frigate',
      name: 'Trade Frigate',
      tier: 2,
      requires: ['prism_t1_refract'],
      description: 'Unlocks Frigate_01 and workers carry double cargo.',
      cost: { credits: 350, energy: 100, minerals: 150 },
      researchTime: 30,
      icon: I('12'),
      effects: [
        { kind: 'unlock_ship', shipType: 'cf_frigate_01' },
        { kind: 'passive_aura', abilityId: 'worker_double_cargo', value: 2 },
      ],
    },
    {
      id: 'prism_t2_convoys',
      name: 'Trade Convoys',
      tier: 2,
      requires: ['prism_t1_weave'],
      description: 'Worker ships move 30% faster and all resource buildings generate +20% more.',
      cost: { credits: 300, energy: 80, minerals: 160 },
      researchTime: 28,
      icon: I('13'),
      effects: [
        { kind: 'stat_bonus', stat: 'all', value: 0.05 },
        { kind: 'resource_bonus', stat: 'resourceAll', value: 0.2 },
      ],
    },
    {
      id: 'prism_t3_crystal',
      name: 'Crystal Shard Protocol',
      tier: 3,
      requires: ['prism_t2_network', 'prism_t2_frigate', 'prism_t2_convoys'],
      description: 'Unlocks Crystal Shard Nova Void Power and LightCruiser_01 Prism-class.',
      cost: { credits: 600, energy: 300, minerals: 600 },
      researchTime: 60,
      icon: I('14'),
      effects: [
        { kind: 'void_power', abilityId: 'crystal_nova' },
        { kind: 'unlock_ship', shipType: 'cf_light_cruiser_01' },
      ],
    },
  ],
};

const vortexTech: TechTree = {
  id: 'vortex',
  name: 'Vortex Tech',
  planetType: 'gas_giant',
  color: 0xcc8822,
  nodes: [
    {
      id: 'vortex_t1_capacitors',
      name: 'Energy Capacitors',
      tier: 1,
      requires: [],
      description: 'All ability cooldowns reduced by 25%.',
      cost: { credits: 200, energy: 120, minerals: 60 },
      researchTime: 20,
      icon: I('15'),
      effects: [{ kind: 'passive_aura', abilityId: 'cooldown_reduction', value: 0.25 }],
    },
    {
      id: 'vortex_t1_engines',
      name: 'Storm Engines',
      tier: 1,
      requires: [],
      description: 'All ships gain +20% movement speed.',
      cost: { credits: 180, energy: 100, minerals: 50 },
      researchTime: 18,
      icon: I('16'),
      effects: [{ kind: 'stat_bonus', stat: 'speed', value: 0.2 }],
    },
    {
      id: 'vortex_t1_ion',
      name: 'Ion Weapons',
      tier: 1,
      requires: [],
      description: 'All attacks have a 15% chance to EMP targets, reducing speed by 50% for 2s.',
      cost: { credits: 160, energy: 140, minerals: 40 },
      researchTime: 16,
      icon: I('17'),
      effects: [{ kind: 'passive_aura', abilityId: 'emp_chance', value: 0.15 }],
    },
    {
      id: 'vortex_t2_drive',
      name: 'Vortex Drive',
      tier: 2,
      requires: ['vortex_t1_capacitors', 'vortex_t1_engines'],
      description: 'Active: instantly warp up to 5 selected ships to any map position (120s CD).',
      cost: { credits: 400, energy: 250, minerals: 100 },
      researchTime: 35,
      icon: I('18'),
      effects: [{ kind: 'active_ability', abilityId: 'vortex_drive' }],
    },
    {
      id: 'vortex_t2_destroyer',
      name: 'Storm Destroyer',
      tier: 2,
      requires: ['vortex_t1_ion'],
      description: 'Unlocks Destroyer_03 Storm-class — fast destroyer with built-in EMP ability.',
      cost: { credits: 380, energy: 180, minerals: 150 },
      researchTime: 32,
      icon: I('19'),
      effects: [{ kind: 'unlock_ship', shipType: 'cf_destroyer_03' }],
    },
    {
      id: 'vortex_t2_storm',
      name: 'Ion Storm',
      tier: 2,
      requires: ['vortex_t1_ion'],
      description: 'Active: emit an EMP blast from the planet disabling all nearby enemy ships for 5s.',
      cost: { credits: 350, energy: 200, minerals: 80 },
      researchTime: 30,
      icon: I('20'),
      effects: [{ kind: 'active_ability', abilityId: 'ion_storm' }],
    },
    {
      id: 'vortex_t3_warp',
      name: 'Mass Warp Protocol',
      tier: 3,
      requires: ['vortex_t2_drive', 'vortex_t2_destroyer', 'vortex_t2_storm'],
      description: 'Unlocks Mass Warp Void Power and Destroyer_05 Tempest-class.',
      cost: { credits: 700, energy: 600, minerals: 200 },
      researchTime: 60,
      icon: I('21'),
      effects: [
        { kind: 'void_power', abilityId: 'mass_warp' },
        { kind: 'unlock_ship', shipType: 'cf_destroyer_05' },
      ],
    },
  ],
};

const voidTech: TechTree = {
  id: 'void',
  name: 'Void Tech',
  planetType: 'barren',
  color: 0x886644,
  nodes: [
    {
      id: 'void_t1_afterburner',
      name: 'Afterburner Arrays',
      tier: 1,
      requires: [],
      description: 'All ships gain +25% speed. Scouts gain +40%.',
      cost: { credits: 180, energy: 80, minerals: 60 },
      researchTime: 18,
      icon: I('22'),
      effects: [{ kind: 'stat_bonus', stat: 'speed', value: 0.25 }],
    },
    {
      id: 'void_t1_ghost',
      name: 'Ghost Plating',
      tier: 1,
      requires: [],
      description: 'Stealth ships become undetectable unless within 100 units of an enemy.',
      cost: { credits: 200, energy: 60, minerals: 100 },
      researchTime: 20,
      icon: I('23'),
      effects: [{ kind: 'passive_aura', abilityId: 'ghost_stealth', value: 0 }],
    },
    {
      id: 'void_t1_phase',
      name: 'Phase Dampeners',
      tier: 1,
      requires: [],
      description: 'Enemies attacking planet lose 20% attack range while near your planet.',
      cost: { credits: 160, energy: 100, minerals: 50 },
      researchTime: 16,
      icon: I('24'),
      effects: [{ kind: 'passive_aura', abilityId: 'range_dampener', value: 0.2 }],
    },
    {
      id: 'void_t2_phantom',
      name: 'Phantom Protocol',
      tier: 2,
      requires: ['void_t1_afterburner', 'void_t1_ghost'],
      description: 'Active: cloak your entire fleet for 10 seconds (150s CD).',
      cost: { credits: 400, energy: 180, minerals: 100 },
      researchTime: 35,
      icon: I('25'),
      effects: [{ kind: 'active_ability', abilityId: 'phantom_protocol' }],
    },
    {
      id: 'void_t2_corvette',
      name: 'Phantom Corvette',
      tier: 2,
      requires: ['void_t1_ghost'],
      description: 'Unlocks Corvette_05 — a stealth attack corvette with built-in cloak.',
      cost: { credits: 360, energy: 150, minerals: 120 },
      researchTime: 30,
      icon: I('10'),
      effects: [{ kind: 'unlock_ship', shipType: 'cf_corvette_05' }],
    },
    {
      id: 'void_t2_drive',
      name: 'Void Drive',
      tier: 2,
      requires: ['void_t1_phase'],
      description: 'All ships gain a passive 3s phase-shift invulnerability when dropping below 15% HP.',
      cost: { credits: 320, energy: 140, minerals: 80 },
      researchTime: 28,
      icon: I('11'),
      effects: [{ kind: 'passive_aura', abilityId: 'death_phase', value: 0.15 }],
    },
    {
      id: 'void_t3_rift',
      name: 'Void Rift Protocol',
      tier: 3,
      requires: ['void_t2_phantom', 'void_t2_corvette', 'void_t2_drive'],
      description: 'Unlocks Void Rift Void Power and Corvette_05 Phantom stealth class.',
      cost: { credits: 600, energy: 500, minerals: 300 },
      researchTime: 60,
      icon: I('12'),
      effects: [
        { kind: 'void_power', abilityId: 'void_rift' },
        { kind: 'unlock_ship', shipType: 'cf_corvette_05' },
      ],
    },
  ],
};

const commandTech: TechTree = {
  id: 'command',
  name: 'Command Tech',
  planetType: 'homeworld' as PlanetType,
  color: 0x4488ff,
  nodes: [
    {
      id: 'cmd_t1_link',
      name: 'Command Link',
      tier: 1,
      requires: [],
      description: 'Resources trickle between all your owned stations (5% per station per tick).',
      cost: { credits: 220, energy: 80, minerals: 80 },
      researchTime: 20,
      icon: I('13'),
      effects: [{ kind: 'passive_aura', abilityId: 'resource_link', value: 0.05 }],
    },
    {
      id: 'cmd_t1_recon',
      name: 'Recon Grid',
      tier: 1,
      requires: [],
      description: 'Active: reveal the entire map for 20 seconds (180s CD).',
      cost: { credits: 200, energy: 100, minerals: 60 },
      researchTime: 18,
      icon: I('14'),
      effects: [{ kind: 'active_ability', abilityId: 'recon_grid' }],
    },
    {
      id: 'cmd_t1_coord',
      name: 'Fleet Coordination',
      tier: 1,
      requires: [],
      description: 'Active: all your ships gain +8% to all stats for 60 seconds (180s CD).',
      cost: { credits: 250, energy: 80, minerals: 100 },
      researchTime: 22,
      icon: I('15'),
      effects: [{ kind: 'active_ability', abilityId: 'fleet_coord' }],
    },
    {
      id: 'cmd_t2_bombardment',
      name: 'Orbital Bombardment',
      tier: 2,
      requires: ['cmd_t1_link', 'cmd_t1_recon'],
      description: 'Active: bombard a target planet dealing 200 DPS to all ships above it for 8s (180s CD).',
      cost: { credits: 450, energy: 200, minerals: 150 },
      researchTime: 38,
      icon: I('16'),
      effects: [{ kind: 'active_ability', abilityId: 'orbital_bombardment' }],
    },
    {
      id: 'cmd_t2_recall',
      name: 'Emergency Recall',
      tier: 2,
      requires: ['cmd_t1_coord'],
      description: 'Active: teleport all your ships to your home planet (300s CD).',
      cost: { credits: 400, energy: 300, minerals: 100 },
      researchTime: 35,
      icon: I('17'),
      effects: [{ kind: 'active_ability', abilityId: 'emergency_recall' }],
    },
    {
      id: 'cmd_t2_boss',
      name: 'Command Warship',
      tier: 2,
      requires: ['cmd_t1_link'],
      description: 'Unlocks Boss Ship 01 (Command Dreadnought) at your home station.',
      cost: { credits: 600, energy: 200, minerals: 300 },
      researchTime: 45,
      icon: I('18'),
      effects: [{ kind: 'unlock_ship', shipType: 'boss_ship_01' }],
    },
    {
      id: 'cmd_t3_crusher',
      name: 'Planet Crusher Protocol',
      tier: 3,
      requires: ['cmd_t2_bombardment', 'cmd_t2_recall', 'cmd_t2_boss'],
      description: 'Unlocks the Planet Crusher Void Power and Boss Ship 02 (Apex Dreadnought).',
      cost: { credits: 1200, energy: 600, minerals: 800 },
      researchTime: 90,
      icon: I('19'),
      effects: [
        { kind: 'void_power', abilityId: 'planet_crusher' },
        { kind: 'unlock_ship', shipType: 'boss_ship_02' },
      ],
    },
  ],
};

// ── Cyber Ops Tech Tree ─────────────────────────────────────────────
// Unlocked from dark_matter planets — the clandestine systems hidden
// in dark matter fields contain pre-Collapse hacking protocols.

const cyberTech: TechTree = {
  id: 'cyber',
  name: 'Cyber Ops',
  planetType: 'dark_matter',
  color: 0x44ffaa,
  nodes: [
    // Tier 1 — basic hacking infrastructure
    {
      id: 'cyber_t1_uplink',
      name: 'Neural Uplink',
      tier: 1,
      requires: [],
      description: 'Scouts and stealth ships hack 25% faster. Hack range increased by 100 units.',
      cost: { credits: 200, energy: 100, minerals: 80 },
      researchTime: 20,
      icon: I('21'),
      effects: [{ kind: 'passive_aura', abilityId: 'hack_speed_boost', value: 0.25 }],
    },
    {
      id: 'cyber_t1_encrypt',
      name: 'Encryption Protocols',
      tier: 1,
      requires: [],
      description: 'Your ships are 30% harder to hack. Shield Breach hacks against you take 50% longer.',
      cost: { credits: 180, energy: 80, minerals: 60 },
      researchTime: 18,
      icon: I('22'),
      effects: [{ kind: 'passive_aura', abilityId: 'hack_resist', value: 0.3 }],
    },
    {
      id: 'cyber_t1_siphon',
      name: 'Data Siphon Arrays',
      tier: 1,
      requires: [],
      description: 'Data Siphon hack steals 2x resources. Unlocks Data Siphon for corvettes.',
      cost: { credits: 160, energy: 120, minerals: 40 },
      researchTime: 16,
      icon: I('23'),
      effects: [{ kind: 'passive_aura', abilityId: 'siphon_boost', value: 2.0 }],
    },
    // Tier 2 — advanced cyber warfare
    {
      id: 'cyber_t2_worm',
      name: 'Recursive Worm',
      tier: 2,
      requires: ['cyber_t1_uplink', 'cyber_t1_siphon'],
      description: 'Successful hacks spread to 1 nearby enemy ship within 300 units (same hack type, reduced duration).',
      cost: { credits: 400, energy: 200, minerals: 150 },
      researchTime: 35,
      icon: I('24'),
      effects: [{ kind: 'passive_aura', abilityId: 'hack_spread', value: 1 }],
    },
    {
      id: 'cyber_t2_firewall',
      name: 'Adaptive Firewall',
      tier: 2,
      requires: ['cyber_t1_encrypt'],
      description: 'When your ship is hacked, the hacker takes 100 damage and their cooldowns increase by 50%.',
      cost: { credits: 350, energy: 150, minerals: 120 },
      researchTime: 30,
      icon: I('25'),
      effects: [{ kind: 'passive_aura', abilityId: 'hack_countermeasure', value: 100 }],
    },
    {
      id: 'cyber_t2_saboteur',
      name: 'Saboteur Protocol',
      tier: 2,
      requires: ['cyber_t1_uplink'],
      description: 'Unlocks Sabotage hack for all stealth ships. Sabotage deals 50% more internal damage.',
      cost: { credits: 380, energy: 180, minerals: 100 },
      researchTime: 32,
      icon: I('26'),
      effects: [{ kind: 'passive_aura', abilityId: 'sabotage_unlock', value: 0.5 }],
    },
    // Tier 3 — ultimate cyber ops
    {
      id: 'cyber_t3_singularity',
      name: 'Singularity Override',
      tier: 3,
      requires: ['cyber_t2_worm', 'cyber_t2_firewall', 'cyber_t2_saboteur'],
      description:
        'Unlocks Hijack for all stealth and scout ships. Hijack duration increased to 20s. Hacked ships retain your faction color.',
      cost: { credits: 800, energy: 500, minerals: 400 },
      researchTime: 60,
      icon: I('16'),
      effects: [{ kind: 'passive_aura', abilityId: 'hijack_master', value: 20 }],
    },
  ],
};

// ── Exported Index ───────────────────────────────────────────────────
export const ALL_TECH_TREES: Record<string, TechTree> = {
  forge: forgeTech,
  tide: tideTech,
  prism: prismTech,
  vortex: vortexTech,
  void: voidTech,
  command: commandTech,
  cyber: cyberTech,
};

// Maps planet type to tech tree id
export const PLANET_TYPE_TO_TECH: Record<string, string> = {
  volcanic: 'forge',
  oceanic: 'tide',
  crystalline: 'prism',
  gas_giant: 'vortex',
  barren: 'void',
  frozen: 'void', // frozen shares void tech
  dark_matter: 'cyber', // dark matter planets unlock Cyber Ops tree
  plasma: 'forge', // plasma shares forge tech
  fungal: 'tide', // fungal shares tide tech
  metallic: 'prism', // metallic shares prism tech
  homeworld: 'command',
};

export const XP_THRESHOLDS = [0, 60, 160, 320, 560, 900];
export const RANK_STAT_BONUS = 0.05; // +5% per rank level, compounding
