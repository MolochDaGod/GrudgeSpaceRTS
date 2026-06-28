/**
 * video-assets.ts — Grudge Studio cinematic / cutscene / producer video catalog.
 *
 * Videos live on Cloudflare R2 (assets.grudge-studio.com), not in the git repo.
 * Upload: place files under public/assets/space/videos/ then `npm run r2:upload`.
 */

import { resolveVideoUrl } from './asset-loader';

/** Logical keys → local path convention (mirrors R2 key under gruda-armada/). */
export const VIDEO_CATALOG = {
  /** Opening title cinematic */
  intro: '/assets/space/videos/intro.mp4',
  /** Optional WebM variant (smaller, faster start) — upload when available */
  introWebm: '/assets/space/videos/intro.webm',
  /** Campaign lore bumper (future) */
  campaignOpening: '/assets/space/videos/campaign-opening.mp4',
  /** Producer / credits reel (future) */
  producerReel: '/assets/space/videos/producer-reel.mp4',
  /** Generic cutscene slot — add more keys as you ship chapters */
  cutscene01: '/assets/space/videos/cutscenes/chapter-01.mp4',
} as const;

export type VideoAssetKey = keyof typeof VIDEO_CATALOG;

export function getVideoUrl(key: VideoAssetKey): string {
  return resolveVideoUrl(VIDEO_CATALOG[key]);
}

/** Primary intro — prefers WebM when browser supports it (set via probe). */
let _webmOk: boolean | null = null;

export async function probeWebmSupport(): Promise<boolean> {
  if (_webmOk !== null) return _webmOk;
  const v = document.createElement('video');
  _webmOk = v.canPlayType('video/webm; codecs="vp9"') !== '';
  return _webmOk;
}

export async function getIntroVideoSources(): Promise<Array<{ src: string; type: string }>> {
  const sources: Array<{ src: string; type: string }> = [];
  if (await probeWebmSupport()) {
    sources.push({ src: getVideoUrl('introWebm'), type: 'video/webm' });
  }
  sources.push({ src: getVideoUrl('intro'), type: 'video/mp4' });
  return sources;
}