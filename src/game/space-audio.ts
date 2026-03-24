/**
 * space-audio.ts — Game audio manager for Gruda Armada
 *
 * Features:
 *   - Pooled SFX channels (prevents overlap spam from rapid fire)
 *   - Looping music with crossfade between tracks
 *   - Master / SFX / Music volume controls
 *   - Respects browser autoplay policy (resumes on first user interaction)
 *   - Singleton instance shared across game systems
 */

import { AUDIO_ASSETS } from './space-prefabs';

type SfxKey = keyof typeof AUDIO_ASSETS.sfx;
type MusicKey = keyof typeof AUDIO_ASSETS.music;

const SFX_POOL_SIZE = 4; // max simultaneous instances per SFX
const SFX_COOLDOWN = 0.06; // min seconds between same SFX plays
const STORAGE_KEY = 'gruda_audio_settings';

interface AudioSettings {
  masterVol: number;
  sfxVol: number;
  musicVol: number;
  muted: boolean;
}

function loadSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { masterVol: 0.6, sfxVol: 0.8, musicVol: 0.35, muted: false };
}

function saveSettings(s: AudioSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

class SpaceAudio {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private sfxGain!: GainNode;
  private musicGain!: GainNode;

  private sfxBuffers = new Map<string, AudioBuffer>();
  private sfxLoading = new Map<string, Promise<AudioBuffer | null>>();
  private sfxLastPlay = new Map<string, number>();

  private currentMusic: { source: AudioBufferSourceNode; key: string } | null = null;
  private musicBuffers = new Map<string, AudioBuffer>();

  private resumed = false;
  private masterVol: number;
  private sfxVol: number;
  private musicVol: number;
  private _muted: boolean;

  constructor() {
    const s = loadSettings();
    this.masterVol = s.masterVol;
    this.sfxVol = s.sfxVol;
    this.musicVol = s.musicVol;
    this._muted = s.muted;
  }

  /** Initialize AudioContext (call after first user gesture) */
  init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this._muted ? 0 : this.masterVol;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVol;
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVol;
    this.musicGain.connect(this.masterGain);

    // Preload all SFX
    for (const [, path] of Object.entries(AUDIO_ASSETS.sfx)) {
      this.loadBuffer(path);
    }
    // Preload music
    for (const [, path] of Object.entries(AUDIO_ASSETS.music)) {
      this.loadBuffer(path);
    }
  }

  /** Resume AudioContext after user interaction (required by browser policy) */
  resume() {
    if (this.resumed) return;
    if (!this.ctx) this.init();
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
    this.resumed = true;
  }

  /** Play a one-shot SFX */
  play(key: SfxKey, volume = 1.0) {
    if (!this.ctx) return;
    this.resume();
    const path = AUDIO_ASSETS.sfx[key];
    if (!path) return;

    // Cooldown: don't spam the same SFX too rapidly
    const now = this.ctx.currentTime;
    const last = this.sfxLastPlay.get(key) ?? 0;
    if (now - last < SFX_COOLDOWN) return;
    this.sfxLastPlay.set(key, now);

    const buffer = this.sfxBuffers.get(path);
    if (!buffer) {
      // Not loaded yet — load and play when ready
      this.loadBuffer(path).then((buf) => {
        if (buf) this.playBuffer(buf, this.sfxGain, volume, false);
      });
      return;
    }
    this.playBuffer(buffer, this.sfxGain, volume, false);
  }

  /** Start looping music track (crossfades from current) */
  playMusic(key: MusicKey) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    this.resume();

    if (this.currentMusic?.key === key) return; // already playing

    const path = AUDIO_ASSETS.music[key];
    if (!path) return;

    // Fade out current music
    if (this.currentMusic) {
      const old = this.currentMusic.source;
      const fadeTime = 1.5;
      // Create a temporary gain for fade-out
      try {
        old.stop(this.ctx.currentTime + fadeTime);
      } catch {
        /* already stopped */
      }
      this.currentMusic = null;
    }

    const buffer = this.musicBuffers.get(path) ?? this.sfxBuffers.get(path);
    if (buffer) {
      this.startMusicSource(buffer, key);
    } else {
      this.loadBuffer(path).then((buf) => {
        if (buf) this.startMusicSource(buf, key);
      });
    }
  }

  /** Stop all music */
  stopMusic() {
    if (this.currentMusic) {
      try {
        this.currentMusic.source.stop();
      } catch {
        /* ok */
      }
      this.currentMusic = null;
    }
  }

  /** Set master volume (0-1). Persisted to localStorage. */
  setMasterVolume(v: number) {
    this.masterVol = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = this._muted ? 0 : this.masterVol;
    this.persistSettings();
  }

  /** Set SFX volume (0-1). Persisted to localStorage. */
  setSfxVolume(v: number) {
    this.sfxVol = Math.max(0, Math.min(1, v));
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxVol;
    this.persistSettings();
  }

  /** Set music volume (0-1). Persisted to localStorage. */
  setMusicVolume(v: number) {
    this.musicVol = Math.max(0, Math.min(1, v));
    if (this.musicGain) this.musicGain.gain.value = this.musicVol;
    this.persistSettings();
  }

  /** Toggle mute on/off. Persisted. */
  toggleMute(): boolean {
    this._muted = !this._muted;
    if (this.masterGain) this.masterGain.gain.value = this._muted ? 0 : this.masterVol;
    this.persistSettings();
    return this._muted;
  }

  /** Set mute state directly. */
  setMuted(m: boolean) {
    this._muted = m;
    if (this.masterGain) this.masterGain.gain.value = this._muted ? 0 : this.masterVol;
    this.persistSettings();
  }

  /** Get current settings (for UI display). */
  getMasterVolume(): number {
    return this.masterVol;
  }
  getSfxVolume(): number {
    return this.sfxVol;
  }
  getMusicVolume(): number {
    return this.musicVol;
  }
  isMuted(): boolean {
    return this._muted;
  }

  /** Persist settings to localStorage. */
  private persistSettings(): void {
    saveSettings({ masterVol: this.masterVol, sfxVol: this.sfxVol, musicVol: this.musicVol, muted: this._muted });
  }

  // ── Internal ──────────────────────────────────────────────

  private startMusicSource(buffer: AudioBuffer, key: string) {
    if (!this.ctx) return;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.musicGain);
    source.start(0);
    this.currentMusic = { source, key };
  }

  private playBuffer(buffer: AudioBuffer, dest: GainNode, volume: number, loop: boolean) {
    if (!this.ctx) return;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    if (volume !== 1.0) {
      const gain = this.ctx.createGain();
      gain.gain.value = volume;
      gain.connect(dest);
      source.connect(gain);
    } else {
      source.connect(dest);
    }
    source.start(0);
  }

  private async loadBuffer(path: string): Promise<AudioBuffer | null> {
    if (this.sfxBuffers.has(path)) return this.sfxBuffers.get(path)!;
    if (this.sfxLoading.has(path)) return this.sfxLoading.get(path)!;

    const promise = (async (): Promise<AudioBuffer | null> => {
      try {
        if (!this.ctx) return null;
        const resp = await fetch(path);
        if (!resp.ok) return null;
        const arrayBuf = await resp.arrayBuffer();
        const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
        this.sfxBuffers.set(path, audioBuf);
        this.musicBuffers.set(path, audioBuf);
        return audioBuf;
      } catch {
        return null;
      } finally {
        this.sfxLoading.delete(path);
      }
    })();

    this.sfxLoading.set(path, promise);
    return promise;
  }
}

/** Singleton audio manager — import this everywhere */
export const gameAudio = new SpaceAudio();
