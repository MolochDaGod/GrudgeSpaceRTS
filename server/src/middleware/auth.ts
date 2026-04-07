/**
 * middleware/auth.ts — JWT verification middleware for Hono
 *
 * Usage:
 *   app.use('/protected/*', requireAuth())
 *   app.use('/admin/*', requireAuth({ adminOnly: true }))
 *
 * The JWT payload is stored in c.var.user for route handlers.
 */

import { createMiddleware } from 'hono/factory';
import { jwtVerify } from 'jose';

export interface JwtPayload {
  sub: string; // grudgeId
  username: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: JwtPayload;
  }
}

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-in-production');

export function requireAuth(opts: { adminOnly?: boolean } = {}) {
  return createMiddleware(async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, SECRET);
      const user = payload as unknown as JwtPayload;

      if (opts.adminOnly && !user.isAdmin) {
        return c.json({ error: 'Forbidden' }, 403);
      }

      c.set('user', user);
      await next();
    } catch {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
  });
}

/** Sign a JWT for a user. */
export async function signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  const { SignJWT } = await import('jose');
  return new SignJWT({ ...payload }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('30d').sign(SECRET);
}
