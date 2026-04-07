/**
 * db.ts — PostgreSQL connection pool
 *
 * Uses a single Pool shared across all route handlers.
 * Set DATABASE_URL in environment before starting the server.
 */

import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // max connections in pool
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false } // most managed Postgres providers need this
      : false,
});

pool.on('error', (err) => {
  console.error('[db] Unexpected pool error:', err.message);
});

/** Convenience: run a query and return rows. */
export async function query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
  const res = await pool.query(sql, params);
  return res.rows as T[];
}

/** Convenience: return first row or null. */
export async function queryOne<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
