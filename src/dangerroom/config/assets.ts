/**
 * Public base URL for the studio's Cloudflare R2 asset bucket.
 *
 * Provided at build time via the `VITE_R2_BASE_URL` env var so both web
 * artifacts resolve assets consistently. Falls back to the custom asset domain
 * when the env var is unset. The categorized asset manifest served by the
 * api-server (`GET /api/assets/manifest`) already returns absolute URLs; use
 * this base only to build URLs for assets referenced by relative path.
 */
export const R2_BASE_URL: string = (
  import.meta.env.VITE_R2_BASE_URL ?? "https://assets.grudge-studio.com"
).replace(/\/+$/, "");

/** Build a full public URL for an asset given its relative bucket path. */
export function assetUrl(path: string): string {
  const clean = path.replace(/^\/+/, "");
  return `${R2_BASE_URL}/${clean}`;
}
