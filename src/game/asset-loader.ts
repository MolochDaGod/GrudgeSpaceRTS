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
 *   - Play-path models resolve as GLB only
 */

const CDN_BASE = import.meta.env.VITE_ASSET_CDN ?? '';
const CDN_PREFIX = import.meta.env.VITE_ASSET_CDN_PREFIX ?? 'gruda-armada';
const ASSET_VERSION = import.meta.env.VITE_ASSET_VERSION ?? '';
// HTTP/2 CDN can pipeline more than the classic 6-per-origin cap.
const MAX_CONCURRENT = CDN_BASE ? 8 : 6;

export interface AssetLoadProgress {
  loaded: number;
  total: number;
  /** 0..1 */
  fraction: number;
  currentAsset: string;
}

export type ProgressCallback = (progress: AssetLoadProgress) => void;

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

export function resolveUrl(localPath: string, isTexture = false): string {
  if (!CDN_BASE) return localPath;

  const cdnPath = localPath.replace(/^\/assets\//, '');
  const versionSuffix = ASSET_VERSION ? `?v=${ASSET_VERSION}` : '';

  if (isTexture && _webpSupported) {
    return `${CDN_BASE}/${CDN_PREFIX}/${cdnPath.replace(/\.png$/i, '.webp')}${versionSuffix}`;
  }

  return `${CDN_BASE}/${CDN_PREFIX}/${cdnPath}${versionSuffix}`;
}

export function resolveTextureUrl(localPath: string): string {
  return resolveUrl(localPath, true);
}

/** Resolve a model URL. Play path is GLB — rewrite leftover OBJ/FBX keys. */
export function resolveModelUrl(localPath: string): string {
  const glbPath = localPath.replace(/\.(obj|fbx|gltf)$/i, '.glb');
  return resolveUrl(glbPath, false);
}

export function resolveVideoUrl(localPath: string): string {
  const cdnBase =
    CDN_BASE || (import.meta.env.PROD ? 'https://assets.grudge-studio.com' : '');
  if (!cdnBase) return localPath;

  const cdnPath = localPath.replace(/^\/assets\//, '');
  const versionSuffix = ASSET_VERSION ? `?v=${ASSET_VERSION}` : '';
  return `${cdnBase}/${CDN_PREFIX}/${cdnPath}${versionSuffix}`;
}

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

export function isCdnAvailable(): boolean {
  return _cdnHealthy && !!CDN_BASE;
}

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

export function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function preloadTextures(urls: string[], onProgress?: ProgressCallback): Promise<HTMLImageElement[]> {
  const items = urls.map((url, i) => ({
    key: `tex_${i}`,
    load: () => preloadImage(url),
  }));
  const results = await loadBatch(items, onProgress);
  return urls.map((_, i) => results.get(`tex_${i}`)!).filter(Boolean);
}

export async function initAssetLoader(): Promise<void> {
  await Promise.all([supportsWebP(), checkCdnHealth()]);
  console.log(`[asset-loader] CDN: ${_cdnHealthy ? CDN_BASE : 'unavailable'} | WebP: ${_webpSupported ? 'yes' : 'no'}`);
}
