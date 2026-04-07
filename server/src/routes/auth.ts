/**
 * routes/auth.ts — OAuth + user profile endpoints
 *
 * GET  /auth/user            — return current user profile (requires JWT)
 * GET  /auth/:provider/start — start OAuth flow (redirect to provider)
 * GET  /auth/callback        — handle OAuth callback, issue JWT
 */

import { Hono } from 'hono';
import { requireAuth, signJwt } from '../middleware/auth.js';
import { query, queryOne } from '../db.js';

export const authRouter = new Hono();

const APP_URL = process.env.APP_URL ?? 'http://localhost:4541';

// ── GET /auth/user ─────────────────────────────────────────────────
authRouter.get('/user', requireAuth(), async (c) => {
  const { sub: grudgeId } = c.var.user;
  const user = await queryOne(
    `SELECT grudge_id, username, display_name, avatar_url, gold, gbux_balance,
            wallet_address, is_guest, is_admin
     FROM users WHERE grudge_id = $1`,
    [grudgeId],
  );
  if (!user) return c.json({ error: 'User not found' }, 404);

  return c.json({
    grudgeId: user.grudge_id,
    username: user.username,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    gold: user.gold,
    gbuxBalance: user.gbux_balance,
    walletAddress: user.wallet_address,
    isGuest: user.is_guest,
    isAdmin: user.is_admin,
  });
});

// ── GET /auth/:provider/start ──────────────────────────────────────
// Redirects browser to OAuth provider
authRouter.get('/:provider/start', (c) => {
  const provider = c.req.param('provider');
  const redirectUri = c.req.query('redirect_uri') ?? APP_URL;

  const callbackUrl = encodeURIComponent(`${APP_URL}/auth/callback?redirect_uri=${encodeURIComponent(redirectUri)}&provider=${provider}`);

  const oauthUrls: Record<string, string> = {
    discord: `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${callbackUrl}&response_type=code&scope=identify+email`,
    google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${callbackUrl}&response_type=code&scope=openid+email+profile`,
    github: `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${callbackUrl}&scope=read:user+user:email`,
  };

  const url = oauthUrls[provider];
  if (!url) return c.json({ error: 'Unsupported provider' }, 400);

  return c.redirect(url);
});

// ── GET /auth/callback ─────────────────────────────────────────────
// After OAuth, exchange code → token → user info → JWT
authRouter.get('/callback', async (c) => {
  const code = c.req.query('code');
  const provider = c.req.query('provider') ?? 'discord';
  const redirectUri = c.req.query('redirect_uri') ?? APP_URL;

  if (!code) return c.json({ error: 'Missing code' }, 400);

  try {
    // Exchange code for provider access token + profile
    const profile = await fetchOAuthProfile(provider, code, `${APP_URL}/auth/callback?provider=${provider}`);

    // Upsert user in database
    const adminIds = (process.env.ADMIN_GRUDGE_IDS ?? '').split(',').map((s) => s.trim());
    const isAdmin = adminIds.includes(profile.grudgeId);

    const rows = await query(
      `INSERT INTO users (grudge_id, username, display_name, avatar_url, provider, last_login_at, is_admin)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6)
       ON CONFLICT (grudge_id) DO UPDATE SET
         username = EXCLUDED.username,
         display_name = EXCLUDED.display_name,
         avatar_url = EXCLUDED.avatar_url,
         last_login_at = NOW(),
         is_admin = $6
       RETURNING grudge_id, username, is_admin`,
      [profile.grudgeId, profile.username, profile.displayName, profile.avatarUrl, provider, isAdmin],
    );
    const user = rows[0] as { grudge_id: string; username: string; is_admin: boolean };

    const token = await signJwt({
      sub: user.grudge_id,
      username: user.username,
      isAdmin: user.is_admin,
    });

    // Redirect back to the game with token in query string
    const dest = new URL(redirectUri);
    dest.searchParams.set('token', token);
    dest.searchParams.set('grudge_id', user.grudge_id);
    dest.searchParams.set('provider', provider);
    return c.redirect(dest.toString());
  } catch (err) {
    console.error('[auth/callback] Error:', err);
    return c.json({ error: 'OAuth failed' }, 500);
  }
});

// ── OAuth profile helpers ──────────────────────────────────────────

interface OAuthProfile {
  grudgeId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

async function fetchOAuthProfile(provider: string, code: string, callbackUrl: string): Promise<OAuthProfile> {
  switch (provider) {
    case 'discord':
      return fetchDiscordProfile(code, callbackUrl);
    case 'github':
      return fetchGithubProfile(code, callbackUrl);
    case 'google':
      return fetchGoogleProfile(code, callbackUrl);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

async function fetchDiscordProfile(code: string, callbackUrl: string): Promise<OAuthProfile> {
  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID ?? '',
      client_secret: process.env.DISCORD_CLIENT_SECRET ?? '',
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUrl,
    }),
  });
  const token = (await tokenRes.json()) as { access_token: string };
  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const u = (await userRes.json()) as { id: string; username: string; global_name?: string; avatar?: string };
  return {
    grudgeId: `discord:${u.id}`,
    username: u.username,
    displayName: u.global_name ?? u.username,
    avatarUrl: u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png` : null,
  };
}

async function fetchGithubProfile(code: string, callbackUrl: string): Promise<OAuthProfile> {
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID ?? '',
      client_secret: process.env.GITHUB_CLIENT_SECRET ?? '',
      code,
      redirect_uri: callbackUrl,
    }),
  });
  const token = (await tokenRes.json()) as { access_token: string };
  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const u = (await userRes.json()) as { id: number; login: string; name?: string; avatar_url?: string };
  return {
    grudgeId: `github:${u.id}`,
    username: u.login,
    displayName: u.name ?? u.login,
    avatarUrl: u.avatar_url ?? null,
  };
}

async function fetchGoogleProfile(code: string, callbackUrl: string): Promise<OAuthProfile> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUrl,
    }),
  });
  const token = (await tokenRes.json()) as { access_token: string };
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const u = (await userRes.json()) as { id: string; name: string; given_name?: string; picture?: string };
  return {
    grudgeId: `google:${u.id}`,
    username: (u.given_name ?? u.name).toLowerCase().replace(/\s+/g, '_'),
    displayName: u.name,
    avatarUrl: u.picture ?? null,
  };
}
