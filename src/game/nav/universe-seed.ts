/**
 * universe-seed.ts — Seed celestial-body + POI data for the campaign nav.
 *
 * A trimmed Stanton-like layout so the planner has something to chew on
 * before we wire up the real campaign universe. Distances are in metres
 * (matches the StarNav coordinate convention). Tweak / extend per faction.
 *
 * Usage:
 *   import { CAMPAIGN_CONTAINERS, CAMPAIGN_POIS } from './universe-seed';
 *   import { SCNavigationPlanner } from './nav';
 *   const planner = new SCNavigationPlanner(CAMPAIGN_POIS, CAMPAIGN_CONTAINERS);
 */

import { ContainerType, PoiType, System, type ObjectContainer, type PointOfInterest } from './nav-types';

/** Identity quaternion (no rotation) — used for static seed bodies. */
const I = { rotQuatW: 1, rotQuatX: 0, rotQuatY: 0, rotQuatZ: 0 };
/** Zero rotation velocity / adjustment placeholder. */
const Z = { rotVelX: 0, rotVelY: 0, rotVelZ: 0, rotAdjX: 0, rotAdjY: 0, rotAdjZ: 0 };

export const CAMPAIGN_CONTAINERS: ObjectContainer[] = [
  // ── Stanton ─────────────────────────────────────────────────────────
  {
    id: 1,
    system: System.Stanton,
    cont_type: ContainerType.Star,
    name: 'Stanton',
    internalName: 'stanton_star',
    posX: 0,
    posY: 0,
    posZ: 0,
    bodyRadius: 696_000_000,
    omRadius: 1_400_000_000,
    gridRadius: 32_000_000_000,
    ...I,
    ...Z,
  },
  {
    id: 2,
    system: System.Stanton,
    cont_type: ContainerType.Planet,
    name: 'Hurston',
    internalName: 'hurston',
    posX: 12_900_000_000,
    posY: 0,
    posZ: 0,
    bodyRadius: 1_000_000,
    omRadius: 1_500_000,
    gridRadius: 50_000_000,
    ...I,
    ...Z,
  },
  {
    id: 3,
    system: System.Stanton,
    cont_type: ContainerType.Planet,
    name: 'Crusader',
    internalName: 'crusader',
    posX: 0,
    posY: 19_100_000_000,
    posZ: 0,
    bodyRadius: 7_450_000,
    omRadius: 9_000_000,
    gridRadius: 70_000_000,
    ...I,
    ...Z,
  },
  {
    id: 4,
    system: System.Stanton,
    cont_type: ContainerType.Planet,
    name: 'ArcCorp',
    internalName: 'arccorp',
    posX: -28_900_000_000,
    posY: 0,
    posZ: 0,
    bodyRadius: 800_000,
    omRadius: 1_200_000,
    gridRadius: 50_000_000,
    ...I,
    ...Z,
  },
  {
    id: 5,
    system: System.Stanton,
    cont_type: ContainerType.Planet,
    name: 'microTech',
    internalName: 'microtech',
    posX: 0,
    posY: -42_400_000_000,
    posZ: 0,
    bodyRadius: 1_000_000,
    omRadius: 1_500_000,
    gridRadius: 60_000_000,
    ...I,
    ...Z,
  },

  // ── Pyro (jump-linked sister system) ─────────────────────────────────
  {
    id: 100,
    system: System.Pyro,
    cont_type: ContainerType.Star,
    name: 'Pyro',
    internalName: 'pyro_star',
    posX: 80_000_000_000,
    posY: 0,
    posZ: 0,
    bodyRadius: 700_000_000,
    omRadius: 1_400_000_000,
    gridRadius: 32_000_000_000,
    ...I,
    ...Z,
  },

  // ── Stanton ↔ Pyro jump point ────────────────────────────────────────
  {
    id: 200,
    system: System.Stanton,
    cont_type: ContainerType.JumpPoint,
    name: 'Stanton-Pyro Gateway',
    internalName: 'jp_stanton_pyro',
    posX: 30_000_000_000,
    posY: 5_000_000_000,
    posZ: 0,
    bodyRadius: 0,
    omRadius: 100_000,
    gridRadius: 1_000_000,
    ...I,
    ...Z,
  },
];

/** A handful of starter POIs anchored to the seed containers. */
export const CAMPAIGN_POIS: PointOfInterest[] = [
  {
    id: 1,
    name: 'Lorville',
    system: 'Stanton',
    objContainer: 'Hurston',
    poiType: PoiType.LandingZone,
    class: 'CityZone',
    posX: 0,
    posY: 0,
    posZ: 1_000_000,
    hasQTMarker: false,
  },
  {
    id: 2,
    name: 'Port Olisar',
    system: 'Stanton',
    objContainer: null,
    poiType: PoiType.OrbitalStation,
    class: 'TradeStation',
    posX: 0,
    posY: 19_080_000_000,
    posZ: 0,
    hasQTMarker: true,
  },
  {
    id: 3,
    name: 'Area 18',
    system: 'Stanton',
    objContainer: 'ArcCorp',
    poiType: PoiType.LandingZone,
    class: 'CityZone',
    posX: 0,
    posY: 0,
    posZ: 800_000,
    hasQTMarker: false,
  },
  {
    id: 4,
    name: 'New Babbage',
    system: 'Stanton',
    objContainer: 'microTech',
    poiType: PoiType.LandingZone,
    class: 'CityZone',
    posX: 0,
    posY: 0,
    posZ: 1_000_000,
    hasQTMarker: false,
  },
  {
    id: 5,
    name: 'Stanton-Pyro Jump',
    system: 'Stanton',
    objContainer: null,
    poiType: PoiType.JumpPoint,
    class: 'JumpGate',
    posX: 30_000_000_000,
    posY: 5_000_000_000,
    posZ: 0,
    hasQTMarker: true,
  },
];
