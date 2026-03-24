/**
 * campaign-events.ts — Procedural campaign event system.
 *
 * Events fire based on game state triggers (time, conquest %, fleet size).
 * Each event offers 1-3 choices with different resource/ship/tech outcomes.
 * The AI narrator generates narrative text; templates are used as fallback.
 */

import type { SpaceGameState, CampaignEvent, CampaignEventType, CampaignEventChoice, CampaignEventOutcome } from './space-types';
import { generateUuid } from './captains-log';
import { logAiEvent } from './captains-log';
import { narrateEvent } from './campaign-ai-narrator';
import { authFetch } from './grudge-auth';

const API_URL = import.meta.env.VITE_GRUDGE_API ?? '';

// ── Event Templates ───────────────────────────────────────────────
interface EventTemplate {
  type: CampaignEventType;
  weight: number; // relative spawn weight
  minConquestPct: number; // minimum conquest % to trigger
  maxConquestPct: number; // maximum (100 = always available)
  cooldownSeconds: number; // minimum game-time between instances
  titleTemplate: string;
  descriptionTemplate: string;
  choices: CampaignEventChoice[];
}

const TEMPLATES: EventTemplate[] = [
  {
    type: 'distress_signal',
    weight: 10,
    minConquestPct: 0,
    maxConquestPct: 100,
    cooldownSeconds: 120,
    titleTemplate: 'Distress Signal Detected',
    descriptionTemplate: 'A faint signal emanates from the void. A damaged vessel drifts near {planet}. Do you investigate?',
    choices: [
      {
        label: 'Investigate',
        outcomeHint: 'Risk small fleet, potential ship salvage',
        outcome: {
          credits: 200,
          shipReward: 'cf_corvette_01',
          logBody: 'We recovered a damaged corvette from the wreckage. Its crew joined our ranks.',
        },
      },
      {
        label: 'Send Scouts',
        outcomeHint: 'Safe recon, small resource gain',
        outcome: { credits: 100, energy: 50, logBody: 'Scouts retrieved supply caches from the derelict. No survivors found.' },
      },
      {
        label: 'Ignore',
        outcomeHint: 'No risk, no reward',
        outcome: { logBody: 'We marked the signal and moved on. Some mysteries are best left alone.' },
      },
    ],
  },
  {
    type: 'pirate_raid',
    weight: 8,
    minConquestPct: 10,
    maxConquestPct: 100,
    cooldownSeconds: 180,
    titleTemplate: 'Pirate Raiders Incoming',
    descriptionTemplate: 'A pirate fleet has been spotted approaching {planet}. They demand tribute or they attack.',
    choices: [
      {
        label: 'Pay Tribute',
        outcomeHint: 'Lose 300 credits, avoid battle',
        outcome: { credits: -300, logBody: 'We paid the pirates off. A bitter price for peace.' },
      },
      {
        label: 'Fight',
        outcomeHint: 'Battle pirate fleet, earn bounty',
        outcome: {
          credits: 500,
          minerals: 200,
          xp: 50,
          logBody: 'Our fleet engaged the raiders and scattered them. Their spoils are ours.',
        },
      },
      {
        label: 'Negotiate',
        outcomeHint: 'Chance of alliance or betrayal',
        outcome: {
          credits: 150,
          reputation: 1,
          logBody: 'Surprisingly, the pirate captain agreed to share intel in exchange for safe passage.',
        },
      },
    ],
  },
  {
    type: 'trade_offer',
    weight: 12,
    minConquestPct: 5,
    maxConquestPct: 100,
    cooldownSeconds: 90,
    titleTemplate: 'Trade Convoy Approaches',
    descriptionTemplate: 'An independent trade convoy requests permission to dock at {planet}. They offer favorable exchange rates.',
    choices: [
      {
        label: 'Accept Trade',
        outcomeHint: 'Exchange minerals for energy',
        outcome: { minerals: -150, energy: 300, logBody: 'The merchants exchanged rare energy cells for our raw minerals. A fair deal.' },
      },
      {
        label: 'Tax & Trade',
        outcomeHint: 'Credits from tariff + smaller trade',
        outcome: { credits: 200, energy: 100, minerals: -50, logBody: 'We imposed a docking fee. The merchants grumbled but complied.' },
      },
      { label: 'Turn Away', outcomeHint: 'No effect', outcome: { logBody: 'We turned the convoy away. Trust is earned, not given.' } },
    ],
  },
  {
    type: 'anomaly_scan',
    weight: 7,
    minConquestPct: 15,
    maxConquestPct: 100,
    cooldownSeconds: 240,
    titleTemplate: 'Spatial Anomaly Detected',
    descriptionTemplate: 'Sensors detect a gravitational anomaly near {planet}. It could hold ancient technology... or danger.',
    choices: [
      {
        label: 'Send Research Fleet',
        outcomeHint: 'Possible tech unlock, fleet risk',
        outcome: {
          techUnlock: 'forge_t1_cannons',
          xp: 100,
          logBody: 'The anomaly contained an ancient weapons cache. Our engineers are already reverse-engineering the technology.',
        },
      },
      {
        label: 'Probe Remotely',
        outcomeHint: 'Safe, smaller discovery',
        outcome: {
          credits: 150,
          energy: 100,
          logBody: 'Remote probes mapped the anomaly. Valuable sensor data collected, but the true secrets remain hidden.',
        },
      },
    ],
  },
  {
    type: 'defector',
    weight: 5,
    minConquestPct: 25,
    maxConquestPct: 100,
    cooldownSeconds: 300,
    titleTemplate: 'Enemy Defector',
    descriptionTemplate: 'An enemy commander offers to defect with their fleet. They claim loyalty, but it could be a trap.',
    choices: [
      {
        label: 'Accept Defector',
        outcomeHint: 'Gain ships, small betrayal risk',
        outcome: {
          shipReward: 'cf_frigate_02',
          xp: 75,
          reputation: -1,
          logBody: 'The defector arrived with a frigate and crew. Time will tell if their loyalty holds.',
        },
      },
      {
        label: 'Reject',
        outcomeHint: 'No risk, maintain faction standing',
        outcome: { reputation: 1, logBody: 'We refused the defector. Our enemies now know we cannot be so easily infiltrated.' },
      },
    ],
  },
  {
    type: 'plague',
    weight: 4,
    minConquestPct: 30,
    maxConquestPct: 100,
    cooldownSeconds: 360,
    titleTemplate: 'Station Outbreak',
    descriptionTemplate: 'A biological contaminant has been detected on {planet} station. Production is halting.',
    choices: [
      {
        label: 'Quarantine',
        outcomeHint: 'Lose production for 60s, save crew',
        outcome: { logBody: 'Quarantine protocols contained the outbreak. Production resumed after decontamination.' },
      },
      {
        label: 'Emergency Purge',
        outcomeHint: 'Lose credits, keep production',
        outcome: { credits: -400, logBody: 'Emergency purge eliminated the contaminant but destroyed valuable supplies in the process.' },
      },
    ],
  },
  {
    type: 'rebellion',
    weight: 3,
    minConquestPct: 40,
    maxConquestPct: 100,
    cooldownSeconds: 480,
    titleTemplate: 'Colony Unrest',
    descriptionTemplate: 'Workers on {planet} are threatening to rebel. They demand better conditions.',
    choices: [
      {
        label: 'Address Grievances',
        outcomeHint: 'Spend resources, boost loyalty',
        outcome: { credits: -300, energy: -100, reputation: 2, logBody: 'We invested in the colony. Morale has improved significantly.' },
      },
      {
        label: 'Show of Force',
        outcomeHint: 'No cost, reputation loss',
        outcome: { reputation: -2, logBody: 'A military presence quelled the unrest. But resentment festers in the shadows.' },
      },
    ],
  },
  {
    type: 'ancient_discovery',
    weight: 4,
    minConquestPct: 50,
    maxConquestPct: 100,
    cooldownSeconds: 600,
    titleTemplate: 'Ancient Artifact',
    descriptionTemplate: 'Excavation on {planet} has uncovered an artifact of unknown origin. It radiates immense power.',
    choices: [
      {
        label: 'Study It',
        outcomeHint: 'Major tech breakthrough',
        outcome: {
          techUnlock: 'forge_t2_siege',
          xp: 200,
          logBody: 'The artifact contained schematics for weapons technology far beyond our own. A paradigm shift for our fleet.',
        },
      },
      {
        label: 'Sell to Traders',
        outcomeHint: 'Large resource gain',
        outcome: {
          credits: 1000,
          minerals: 500,
          logBody: 'We sold the artifact to passing merchants. The credits will fund an entire fleet expansion.',
        },
      },
    ],
  },
  {
    type: 'neural_surge',
    weight: 2,
    minConquestPct: 70,
    maxConquestPct: 100,
    cooldownSeconds: 900,
    titleTemplate: 'Neural Network Surge',
    descriptionTemplate: 'A massive energy pulse from beyond the sector boundary. The Neural faction grows stronger.',
    choices: [
      {
        label: 'Fortify Borders',
        outcomeHint: 'Defensive preparation',
        outcome: { minerals: -200, logBody: 'We reinforced our border stations. When the Neural threat arrives, we will be ready.' },
      },
      {
        label: 'Intercept Source',
        outcomeHint: 'Aggressive, high risk/reward',
        outcome: {
          xp: 300,
          fleetDamagePercent: 10,
          logBody: 'Our strike force traced the pulse to a Neural relay. We destroyed it, but took heavy losses.',
        },
      },
    ],
  },
];

// ── Cooldown tracking ─────────────────────────────────────────────
const _lastFired = new Map<CampaignEventType, number>();

// ── Public API ────────────────────────────────────────────────────

/** Check triggers and generate a new event if conditions are met. Returns null if nothing triggers. */
export async function tickCampaignEvents(state: SpaceGameState): Promise<CampaignEvent | null> {
  if (state.gameMode !== 'campaign' || !state.campaignProgress) return null;

  const progress = state.campaignProgress;
  const conquestPct = (progress.conqueredPlanetIds.length / Math.max(progress.totalPlanets, 1)) * 100;

  // Don't fire events while there's an active unresolved event
  const pending = state.campaignEvents.find((e) => !e.resolved);
  if (pending) return null;

  // Weighted random selection from eligible templates
  const eligible = TEMPLATES.filter((t) => {
    if (conquestPct < t.minConquestPct || conquestPct > t.maxConquestPct) return false;
    const lastTime = _lastFired.get(t.type) ?? -Infinity;
    return state.gameTime - lastTime >= t.cooldownSeconds;
  });
  if (!eligible.length) return null;

  // Weighted pick
  const totalWeight = eligible.reduce((s, t) => s + t.weight, 0);
  let roll = Math.random() * totalWeight;
  let picked: EventTemplate | null = null;
  for (const t of eligible) {
    roll -= t.weight;
    if (roll <= 0) {
      picked = t;
      break;
    }
  }
  if (!picked) return null;

  // Pick a random owned planet for context
  const ownedPlanets = state.planets.filter((p) => p.owner === 1);
  const contextPlanet = ownedPlanets[Math.floor(Math.random() * ownedPlanets.length)];
  const planetName = contextPlanet?.name ?? 'deep space';

  // Try AI narration, fall back to template
  let title = picked.titleTemplate;
  let description = picked.descriptionTemplate.replace('{planet}', planetName);
  try {
    const narrated = await narrateEvent(picked.type, planetName, conquestPct);
    if (narrated) {
      title = narrated.title || title;
      description = narrated.narrative || description;
    }
  } catch {
    /* use template */
  }

  const event: CampaignEvent = {
    uuid: generateUuid(),
    type: picked.type,
    title,
    description,
    choices: picked.choices,
    choiceTaken: null,
    triggerGameTime: state.gameTime,
    expiresAt: state.gameTime + 120, // 2 minutes to decide (game-time)
    planetUuid: contextPlanet?.grudgeUuid,
    resolved: false,
  };

  state.campaignEvents.push(event);
  _lastFired.set(picked.type, state.gameTime);

  // Log to Captain's Log
  logAiEvent(state, event.title, event.description, event.uuid);

  return event;
}

/** Resolve a campaign event with the player's choice. */
export function resolveEvent(state: SpaceGameState, eventUuid: string, choiceIndex: number): CampaignEventOutcome | null {
  const event = state.campaignEvents.find((e) => e.uuid === eventUuid);
  if (!event || event.resolved) return null;
  const choice = event.choices[choiceIndex];
  if (!choice) return null;

  event.choiceTaken = choiceIndex;
  event.resolved = true;
  const outcome = choice.outcome;

  // Apply resource outcomes
  const res = state.resources[1];
  if (res) {
    if (outcome.credits) res.credits = Math.max(0, res.credits + outcome.credits);
    if (outcome.energy) res.energy = Math.max(0, res.energy + outcome.energy);
    if (outcome.minerals) res.minerals = Math.max(0, res.minerals + outcome.minerals);
  }

  // Log the outcome
  if (outcome.logBody) {
    logAiEvent(state, `${event.title}: ${choice.label}`, outcome.logBody, event.uuid);
  }

  // Persist to backend
  persistEvent(event);

  return outcome;
}

/** Auto-resolve expired events (pick middle choice or first). */
export function autoResolveExpired(state: SpaceGameState): void {
  for (const event of state.campaignEvents) {
    if (event.resolved) continue;
    if (state.gameTime >= event.expiresAt) {
      const fallbackIdx = Math.min(1, event.choices.length - 1);
      resolveEvent(state, event.uuid, fallbackIdx);
    }
  }
}

// ── Backend Persistence ───────────────────────────────────────────
async function persistEvent(event: CampaignEvent): Promise<void> {
  if (!API_URL) return;
  try {
    await authFetch(`${API_URL}/campaign/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch {
    /* silent fail */
  }
}
