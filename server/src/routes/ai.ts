/**
 * routes/ai.ts — AI narration proxy
 *
 * POST /ai/narrate — Generate campaign event narrative via OpenAI.
 *                    Rate-limited to 20 req/min per grudge_id.
 *                    Falls back to null if OpenAI key not set.
 */

import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';

export const aiRouter = new Hono();

aiRouter.use('/*', requireAuth());

// Simple in-memory rate limiter (replace with Redis in production)
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(grudgeId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(grudgeId);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(grudgeId, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ── POST /ai/narrate ───────────────────────────────────────────────
aiRouter.post('/narrate', async (c) => {
  const { sub: grudgeId } = c.var.user;

  if (!checkRateLimit(grudgeId)) {
    return c.json({ error: 'Rate limit exceeded. Try again in a minute.' }, 429);
  }

  let body: {
    eventType: string;
    playerName: string;
    planetName: string;
    conquestPercent: number;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.AI_MODEL ?? 'gpt-4o-mini';

  if (!apiKey) {
    // No key configured — return null so client uses template fallback
    return c.json({ title: null, description: null });
  }

  const systemPrompt = `You are a narrator for Grudge Space RTS, a dark sci-fi space strategy game.
Write short, dramatic in-universe messages (2-3 sentences max) for campaign events.
Tone: gritty military commander log. No emojis. Be concise and evocative.`;

  const userPrompt = `Event type: ${body.eventType}
Commander: ${body.playerName}
Planet: ${body.planetName}
Conquest: ${body.conquestPercent}% of sector conquered
Write a title (max 8 words) and a description for this event.
Respond as JSON: { "title": "...", "description": "..." }`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 120,
        temperature: 0.8,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error('[ai/narrate] OpenAI error:', res.status, await res.text());
      return c.json({ title: null, description: null });
    }

    const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    const content = JSON.parse(data.choices[0]?.message?.content ?? '{}') as {
      title?: string;
      description?: string;
    };

    return c.json({
      title: content.title ?? null,
      description: content.description ?? null,
    });
  } catch (err) {
    console.error('[ai/narrate] Fetch error:', err);
    return c.json({ title: null, description: null });
  }
});
