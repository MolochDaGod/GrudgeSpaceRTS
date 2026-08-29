/**
 * Shared AudioContext for splash unlock + game audio.
 * Keep this module free of Three / space-prefabs so splash can call it.
 */
let ctx: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

/** Call synchronously inside a click/keydown handler (browser autoplay). */
export function unlockAudio(): void {
  try {
    const c = getSharedAudioContext();
    if (c.state === 'suspended') void c.resume();
  } catch {
    /* autoplay still blocked — gameAudio.resume retries on later gestures */
  }
}
