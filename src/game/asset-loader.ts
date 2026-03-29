/**
 * asset-loader.ts — Centralized asset loading with CDN + progress tracking.
 *
 * Resolves asset URLs from VITE_ASSET_CDN (Cloudflare R2) with fallback
 * to local /assets/. Tracks loading progress for loading screens.
 *
 * Best practices:
 *   - WebP textures with PNG fallback
 *   - Parallel batch loading with concurrency limit
 *   - Progress callback for UI
 *   - Cache-aware: immutable CDN assets with hash-busted URLs
 *   - Graceful CDN failure: falls back to local Vercel assets
 */

const CDN_BASE = import.meta.env.VITE_ASSET_CDN ?? '';
const MAX_CONCURRENT = 6; // browser limit per origin is typically 6

// ── Types ─────────────────────────────────────────────────────────
export interface AssetLoadProgress {
  loaded: number;
  total: number;
  /** 0..1 */
  fraction: number;
  currentAsset: string;
}

export type ProgressCallback = (progress: AssetLoadProgress) => void;

// ── WebP support detection ────────────────────────────────────────
let _webpSupported: boolean | null = null;

async function supportsWebP(): Promise<boolean> {
  if (_webpSupported !== null) return _webpSupported;
  try {
    const img = new Image();
    const p = new Promise<boolean>((resolve) => {
      img.onload = () => resolve(img.width > 0 && img.height > 0);
      img.onerror = () => resolve(false);
    });
    img.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
    _webpSupported = await p;
  } catch {
    _webpSupported = false;
  }
  return _webpSupported;
}

// ── URL Resolution ────────────────────────────────────────────────

/**
 * Resolve the best URL for an asset.
 * If CDN is configured, tries CDN first. Falls back to local path.
 * For textures: tries .webp on CDN if browser supports it.
 */
export function resolveUrl(localPath: string, isTexture = false): string {
  if (!CDN_BASE) return localPath;

  // CDN path: strip leading /assets/ prefix and map to CDN structure
  const cdnPath = localPath.replace(/^\/assets\//, '');

  if (isTexture && _webpSupported) {
    // Try WebP version first (uploaded by R2 script with .webp extension)
    return `${CDN_BASE}/${cdnPath.replace(/\.png$/i, '.webp')}`;
  }

  return `${CDN_BASE}/${cdnPath}`;
}

/**
 * Resolve a texture URL with WebP preference.
 * Must call initAssetLoader() first to detect WebP support.
 */
export function resolveTextureUrl(localPath: string): string {
  return resolveUrl(localPath, true);
}

/**
 * Resolve a model URL (OBJ/FBX/GLB).
 */
export function resolveModelUrl(localPath: string): string {
  return resolveUrl(localPath, false);
}

// ── CDN Health Check ──────────────────────────────────────────────
let _cdnHealthy = true;

async function checkCdnHealth(): Promise<boolean> {
  if (!CDN_BASE) return false;
  try {
    const res = await fetch(`${CDN_BASE}/health.txt`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000),
    });
    _cdnHealthy = res.ok;
  } catch {
    _cdnHealthy = false;
  }
  return _cdnHealthy;
}

/** Whether CDN is available (set after init). */
export function isCdnAvailable(): boolean {
  return _cdnHealthy && !!CDN_BASE;
}

// ── Batch Loading with Progress ───────────────────────────────────

/**
 * Load multiple assets in parallel with a concurrency limit.
 * Each item is a { url, loader } pair where loader is an async function
 * that fetches/processes the asset.
 */
export async function loadBatch<T>(
  items: Array<{ key: string; load: () => Promise<T> }>,
  onProgress?: ProgressCallback,
): Promise<Map<string, T>> {
  const results = new Map<string, T>();
  const total = items.length;
  let loaded = 0;

  const queue = [...items];
  const workers: Promise<void>[] = [];

  for (let i = 0; i < Math.min(MAX_CONCURRENT, queue.length); i++) {
    workers.push(
      (async () => {
        while (queue.length > 0) {
          const item = queue.shift()!;
          try {
            const result = await item.load();
            results.set(item.key, result);
          } catch (err) {
            console.warn(`[asset-loader] Failed to load ${item.key}:`, err);
          }
          loaded++;
          onProgress?.({
            loaded,
            total,
            fraction: loaded / total,
            currentAsset: item.key,
          });
        }
      })(),
    );
  }

  await Promise.all(workers);
  return results;
}

/**
 * Fetch a URL with CDN fallback. If CDN fails, retries with local path.
 */
export async function fetchWithFallback(cdnUrl: string, localUrl: string): Promise<Response> {
  if (_cdnHealthy && CDN_BASE) {
    try {
      const res = await fetch(cdnUrl, { signal: AbortSignal.timeout(8000) });
      if (res.ok) return res;
    } catch {
      // CDN failed, fall through to local
    }
  }
  return fetch(localUrl);
}

// ── Preload helpers ───────────────────────────────────────────────

/** Preload an image (texture) — returns a promise that resolves when loaded. */
export function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Preload a list of texture URLs in parallel with progress. */
export async function preloadTextures(urls: string[], onProgress?: ProgressCallback): Promise<HTMLImageElement[]> {
  const items = urls.map((url, i) => ({
    key: `tex_${i}`,
    load: () => preloadImage(url),
  }));
  const results = await loadBatch(items, onProgress);
  return urls.map((_, i) => results.get(`tex_${i}`)!).filter(Boolean);
}

// ── Init ──────────────────────────────────────────────────────────

/** Initialize the asset loader: detect WebP, check CDN health. */
export async function initAssetLoader(): Promise<void> {
  await Promise.all([supportsWebP(), checkCdnHealth()]);
  console.log(`[asset-loader] CDN: ${_cdnHealthy ? CDN_BASE : 'unavailable'} | WebP: ${_webpSupported ? 'yes' : 'no'}`);
}
