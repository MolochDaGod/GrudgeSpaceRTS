/**
 * campaign-sector.ts — Procedural sector generation for Campaign mode.
 *
 * Generates a deterministic sector from the player's grudgeId hash.
 * Output: Planet[], PointOfInterest[], ResourceNode seed data.
 * The sector is the player's personal galaxy — unique to their account.
 */

import type { Planet, PlanetType, Team, PointOfInterest, POIType } from './space-types';
import {
  CAMPAIGN_SECTOR_SIZE,
  CAMPAIGN_PLANET_COUNT,
  CAMPAIGN_AI_FACTIONS,
  CAMPAIGN_NEUTRAL_DEFENDERS,
  PLANET_TYPE_DATA,
} from './space-types';
import { generateUuid } from './captains-log';

// ── Seeded RNG ────────────────────────────────────────────────────
// Simple Mulberry32 PRNG seeded from a string hash.
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Planet Name Generator ─────────────────────────────────────────
const PREFIXES = [
  'Kael',
  'Vor',
  'Zel',
  'Nyx',
  'Thar',
  'Orn',
  'Drak',
  'Sol',
  'Lun',
  'Axi',
  'Pyr',
  'Cryo',
  'Vex',
  'Kal',
  'Mor',
  'Fen',
  'Zar',
  'Hex',
  'Ryn',
  'Gal',
  'Nova',
  'Tera',
  'Eon',
  'Flux',
  'Brin',
  'Xen',
  'Qor',
  'Yas',
  'Ulm',
  'Jyn',
];
const SUFFIXES = ['is', 'on', 'ar', 'us', 'ix', 'os', 'en', 'al', 'ia', 'um', 'ax', 'or', 'ith', 'ek', 'yn', 'ov', 'an', 'ux', 'el', 'ir'];

function generatePlanetName(rng: () => number): string {
  const pre = PREFIXES[Math.floor(rng() * PREFIXES.length)];
  const suf = SUFFIXES[Math.floor(rng() * SUFFIXES.length)];
  const num = Math.floor(rng() * 9) + 1;
  return `${pre}${suf}-${num}`;
}

// ── Sector Generator ──────────────────────────────────────────────
const PLANET_TYPES: PlanetType[] = ['volcanic', 'oceanic', 'barren', 'crystalline', 'gas_giant', 'frozen'];

export interface SectorGenerationResult {
  planets: Planet[];
  pois: PointOfInterest[];
  sectorSeed: string;
  homeworldId: number;
}

/**
 * Generate a full campaign sector from a grudgeId.
 * Deterministic: same grudgeId always produces the same sector.
 */
export function generateSector(grudgeId: string, startId: number): SectorGenerationResult {
  const seed = hashString(grudgeId || 'guest-campaign');
  const rng = mulberry32(seed);
  const sectorSeed = `${grudgeId}-${seed}`;

  const halfW = CAMPAIGN_SECTOR_SIZE.width / 2;
  const halfH = CAMPAIGN_SECTOR_SIZE.height / 2;

  // How many planets (15-25)
  const { min, max } = CAMPAIGN_PLANET_COUNT;
  const planetCount = min + Math.floor(rng() * (max - min + 1));

  let nextId = startId;
  const planets: Planet[] = [];
  const pois: PointOfInterest[] = [];

  // ── Helper: create planet ────────────────────────────────────
  function makePlanet(x: number, y: number, owner: Team, pType: PlanetType, name: string, isStarting: boolean, radius?: number): Planet {
    const id = nextId++;
    const ptd = PLANET_TYPE_DATA[pType];
    const baseYield = { credits: 8, energy: 5, minerals: 6 };
    const p: Planet = {
      id,
      x,
      y,
      z: 0,
      radius: radius ?? 120 + rng() * 80,
      name,
      owner,
      stationId: null,
      resourceYield: {
        credits: Math.round(baseYield.credits * ptd.resourceMult.credits),
        energy: Math.round(baseYield.energy * ptd.resourceMult.energy),
        minerals: Math.round(baseYield.minerals * ptd.resourceMult.minerals),
      },
      color: ptd.baseColor,
      hasAsteroidField: rng() > 0.6,
      planetType: pType,
      captureRadius: 350,
      captureTeam: 0 as Team,
      captureProgress: 0,
      captureSpeed: 5,
      neutralDefenders: isStarting ? 0 : CAMPAIGN_NEUTRAL_DEFENDERS,
      isStartingPlanet: isStarting,
      grudgeUuid: generateUuid(),
    } as Planet;
    return p;
  }

  // ── 1. Player homeworld (center) ─────────────────────────────
  const homeworld = makePlanet(0, 0, 1 as Team, 'crystalline', 'Homeworld Prime', true, 200);
  const homeworldId = homeworld.id;
  planets.push(homeworld);

  // ── 2. AI homeworlds (at sector edges) ───────────────────────
  const aiAngles = [Math.PI * 0.5, Math.PI * 1.167, Math.PI * 1.833]; // spaced ~120° apart
  for (let i = 0; i < CAMPAIGN_AI_FACTIONS; i++) {
    const angle = aiAngles[i] + (rng() - 0.5) * 0.3;
    const dist = halfW * 0.75 + rng() * halfW * 0.15;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    const team = (i + 2) as Team; // teams 2, 3, 4
    const pType = PLANET_TYPES[Math.floor(rng() * PLANET_TYPES.length)];
    const name = ['Dominion Core', 'Neural Nexus', 'Shadow Citadel'][i];
    planets.push(makePlanet(x, y, team, pType, name, true, 180));
  }

  // ── 3. Neutral planets (scattered) ───────────────────────────
  const neutralCount = planetCount - 1 - CAMPAIGN_AI_FACTIONS;
  const placed: { x: number; y: number }[] = planets.map((p) => ({ x: p.x, y: p.y }));
  const MIN_DIST = 3500; // minimum distance between planets

  for (let i = 0; i < neutralCount; i++) {
    let x: number, y: number;
    let attempts = 0;
    do {
      x = (rng() - 0.5) * halfW * 1.6;
      y = (rng() - 0.5) * halfH * 1.6;
      attempts++;
    } while (attempts < 100 && placed.some((p) => Math.hypot(p.x - x, p.y - y) < MIN_DIST));

    placed.push({ x, y });
    const pType = PLANET_TYPES[Math.floor(rng() * PLANET_TYPES.length)];
    const name = generatePlanetName(rng);
    planets.push(makePlanet(x, y, 0 as Team, pType, name, false));
  }

  // ── 4. Points of Interest ────────────────────────────────────
  const POI_TYPES: POIType[] = ['derelict', 'anomaly', 'data_cache', 'resource_vein', 'ancient_gate', 'pirate_stash'];
  const poiCount = 6 + Math.floor(rng() * 5); // 6-10 POIs

  for (let i = 0; i < poiCount; i++) {
    const x = (rng() - 0.5) * halfW * 1.5;
    const y = (rng() - 0.5) * halfH * 1.5;
    const type = POI_TYPES[Math.floor(rng() * POI_TYPES.length)];
    const poiId = nextId++;
    const poi: PointOfInterest = {
      id: poiId,
      x,
      y,
      type,
      name: `${type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} ${poiId}`,
      discovered: false,
      claimedByTeam: null,
      reward: {
        credits: type === 'resource_vein' ? 500 : type === 'pirate_stash' ? 300 : 100,
        energy: type === 'anomaly' ? 200 : 50,
        minerals: type === 'resource_vein' ? 400 : 50,
        xp: 50 + Math.floor(rng() * 100),
      },
      radius: 300,
      guarded: type === 'pirate_stash' || type === 'derelict',
      guardShipIds: [],
      guardsSpawned: false,
      guardShipTypes: type === 'pirate_stash' ? ['pirate_01', 'pirate_02', 'pirate_03'] : ['pirate_01', 'pirate_02'],
    };
    pois.push(poi);
  }

  // ── 5. Ancient Gate pairs (link distant regions) ─────────────
  const gates = pois.filter((p) => p.type === 'ancient_gate');
  for (let i = 0; i < gates.length - 1; i += 2) {
    gates[i].pairedPOIId = gates[i + 1].id;
    gates[i + 1].pairedPOIId = gates[i].id;
  }

  return { planets, pois, sectorSeed, homeworldId };
}
