/**
 * campaign-ai-narrator.ts — AI chatbot integration for campaign narrative.
 *
 * Calls the Grudge backend AI endpoint to generate rich narrative text
 * for campaign events, Captain's Log entries, and story beats.
 * Falls back to hardcoded templates when the API is unavailable.
 */

import type { CampaignEventType } from './space-types';
import { authFetch } from './grudge-auth';

const API_URL = import.meta.env.VITE_GRUDGE_API ?? '';

// ── Types ─────────────────────────────────────────────────────────
export interface NarrateRequest {
  eventType: string;
  playerName?: string;
  planetName?: string;
  factionName?: string;
  conquestPercent: number;
  recentBattles?: number;
  context?: string;
}

export interface NarrateResponse {
  title: string;
  narrative: string;
  choices?: { label: string; outcomeHint: string }[];
}

// ── API Call ──────────────────────────────────────────────────────

/**
 * Request AI-generated narrative for a campaign event.
 * Returns null if API unavailable — caller should use template fallback.
 */
export async function narrateEvent(
  eventType: CampaignEventType | string,
  planetName: string,
  conquestPercent: number,
  playerName?: string,
): Promise<NarrateResponse | null> {
  if (!API_URL) return null;
  try {
    const res = await authFetch(`${API_URL}/ai/narrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        playerName: playerName ?? 'Commander',
        planetName,
        conquestPercent: Math.round(conquestPercent),
      } satisfies NarrateRequest),
      signal: AbortSignal.timeout(8000), // 8s timeout
    });
    if (!res.ok) return null;
    return (await res.json()) as NarrateResponse;
  } catch {
    return null;
  }
}

/**
 * Request AI-generated Captain's Log flavor text for a specific event.
 * Used to enrich auto-logged entries with narrative depth.
 */
export async function narrateLogEntry(category: string, eventSummary: string, conquestPercent: number): Promise<string | null> {
  if (!API_URL) return null;
  try {
    const res = await authFetch(`${API_URL}/ai/narrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: `log_${category}`,
        context: eventSummary,
        conquestPercent: Math.round(conquestPercent),
      } satisfies NarrateRequest),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NarrateResponse;
    return data.narrative || null;
  } catch {
    return null;
  }
}

/**
 * Request AI-generated story beat narrative for campaign milestones.
 */
export async function narrateStoryBeat(beatId: string, playerName: string, conquestPercent: number): Promise<NarrateResponse | null> {
  if (!API_URL) return null;
  try {
    const res = await authFetch(`${API_URL}/ai/narrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: `story_${beatId}`,
        playerName,
        conquestPercent: Math.round(conquestPercent),
      } satisfies NarrateRequest),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as NarrateResponse;
  } catch {
    return null;
  }
}

// ── Fallback Templates ────────────────────────────────────────────
// Used when the AI narrator API is unavailable.

const FALLBACK_NARRATIVES: Partial<Record<CampaignEventType | string, string[]>> = {
  distress_signal: [
    'A garbled transmission cuts through static. Someone — or something — is out there.',
    'The signal repeats on a loop. Coordinates embedded. A cry for help... or a lure.',
  ],
  pirate_raid: [
    'Pirate vessels drop out of warp, guns hot. They broadcast a single word: surrender.',
    'Ragged ships bearing skull insignias approach. Their captain demands tribute.',
  ],
  trade_offer: [
    'A merchant fleet hails us. Their holds are full and their prices fair.',
    'Trade beacons light up across the system. An opportunity for commerce.',
  ],
  anomaly_scan: [
    'Spatial distortions ripple across the sector. Something ancient stirs.',
    'Our sensors scream warnings. The anomaly pulses with unknowable energy.',
  ],
  defector: [
    'An encrypted message arrives from an enemy officer. They want to talk.',
    'A lone ship approaches under white flag. Its captain offers allegiance.',
  ],
  plague: [
    'Medical alerts cascade through the station. Quarantine protocols engage.',
    'A strange illness spreads through the crew. The source is unknown.',
  ],
  rebellion: [
    'Angry voices echo through the station corridors. The workers have had enough.',
    'Production grinds to a halt. The colony demands to be heard.',
  ],
  ancient_discovery: [
    'Deep beneath the surface, our excavation teams unearth something impossible.',
    'An artifact of immense power lies buried here. Its origin predates known civilization.',
  ],
  neural_surge: [
    'A pulse of coherent energy sweeps the sector. The Neural network is evolving.',
    'Every sensor array in our fleet overloads simultaneously. Something massive approaches.',
  ],
};

/** Get a random fallback narrative for an event type. */
export function getFallbackNarrative(eventType: CampaignEventType | string): string {
  const pool = FALLBACK_NARRATIVES[eventType];
  if (!pool?.length) return 'An event unfolds in the darkness of space.';
  return pool[Math.floor(Math.random() * pool.length)];
}
