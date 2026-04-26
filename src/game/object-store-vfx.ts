/**
 * object-store-vfx.ts — Bridge to the user's ObjectStore VFX library.
 *
 * Pulls effect sprite metadata from
 *   https://molochdagod.github.io/ObjectStore/api/v1/effectSprites.json
 * and serves animated billboard sprites for in-game VFX. Replaces the
 * procedural circle/oval projectile + impact effects with real spritesheet
 * animations from the user's curated 143-effect library.
 *
 * Usage:
 *   await ObjectStoreVfx.preload();
 *   ObjectStoreVfx.spawn(scene, 'slash', { x, y, z }, { scale: 1.4 });
 *   ObjectStoreVfx.update(dt); // call from rAF loop
 */

import * as THREE from 'three';

const OBJECT_STORE = 'https://molochdagod.github.io/ObjectStore';
const MANIFEST_URL = `${OBJECT_STORE}/api/v1/effectSprites.json`;

interface EffectDef {
  src: string;
  /** Total frames in the sheet. */
  frames: number;
  /** Either grid-style (cols × rows) or square-style (size = total). */
  cols?: number;
  rows?: number;
  size?: number;
  frameW?: number;
  frameH?: number;
  sourceUrl: string;
  categories: string[];
}
interface EffectsManifest {
  version: string;
  totalEffects: number;
  effects: Record<string, EffectDef>;
}

interface ActiveSprite {
  sprite: THREE.Sprite;
  texture: THREE.Texture;
  cols: number;
  rows: number;
  totalFrames: number;
  frameDuration: number; // seconds per frame
  age: number;
  done: boolean;
  loop: boolean;
}

class ObjectStoreVfxImpl {
  private manifest: EffectsManifest | null = null;
  private manifestPromise: Promise<EffectsManifest> | null = null;
  private texCache: Map<string, THREE.Texture> = new Map();
  private texPromises: Map<string, Promise<THREE.Texture>> = new Map();
  private active: ActiveSprite[] = [];

  /** Preload the manifest (best called on game-init). */
  async preload(): Promise<void> {
    if (this.manifest) return;
    if (!this.manifestPromise) {
      this.manifestPromise = fetch(MANIFEST_URL)
        .then((r) => r.json() as Promise<EffectsManifest>)
        .then((m) => {
          this.manifest = m;
          return m;
        })
        .catch((err) => {
          console.warn('[ObjectStoreVfx] manifest fetch failed', err);
          // Empty fallback so spawn() degrades gracefully.
          const empty: EffectsManifest = { version: '0', totalEffects: 0, effects: {} };
          this.manifest = empty;
          return empty;
        });
    }
    await this.manifestPromise;
  }

  /** Return effect names matching any of the given categories. */
  byCategory(...cats: string[]): string[] {
    if (!this.manifest) return [];
    const want = new Set(cats);
    return Object.entries(this.manifest.effects)
      .filter(([, def]) => def.categories.some((c) => want.has(c)))
      .map(([name]) => name);
  }

  /** Are we ready (manifest loaded)? */
  ready(): boolean {
    return this.manifest !== null && Object.keys(this.manifest.effects).length > 0;
  }

  private async loadTexture(url: string): Promise<THREE.Texture> {
    const cached = this.texCache.get(url);
    if (cached) return cached;
    const pending = this.texPromises.get(url);
    if (pending) return pending;
    const promise = new Promise<THREE.Texture>((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.magFilter = THREE.NearestFilter;
          tex.minFilter = THREE.NearestFilter;
          tex.generateMipmaps = false;
          this.texCache.set(url, tex);
          resolve(tex);
        },
        undefined,
        reject,
      );
    });
    this.texPromises.set(url, promise);
    return promise;
  }

  /** Resolve grid metadata regardless of which manifest variant is used. */
  private resolveGrid(def: EffectDef): { cols: number; rows: number; total: number } {
    if (def.cols && def.rows) {
      return { cols: def.cols, rows: def.rows, total: def.frames };
    }
    // size variant: square sheet, frames = size² in some configs but more
    // commonly frames is total count and we infer rows = sqrt(frames).
    const n = def.frames;
    const side = Math.round(Math.sqrt(n));
    return { cols: side, rows: side, total: n };
  }

  /**
   * Spawn an animated sprite at a world position.
   * Returns false if the manifest isn't loaded or the effect is unknown.
   */
  spawn(
    scene: THREE.Scene,
    name: string,
    pos: { x: number; y: number; z: number },
    opts: { scale?: number; durationSec?: number; tint?: number; loop?: boolean } = {},
  ): boolean {
    const def = this.manifest?.effects[name];
    if (!def) return false;
    const scale = opts.scale ?? 1.5;
    const duration = opts.durationSec ?? Math.max(0.25, def.frames / 30); // ~30 fps default
    const tint = opts.tint ?? 0xffffff;
    const loop = opts.loop ?? false;

    // Async load + spawn. Drop spawns that resolve after the scene tears down
    // by checking sprite.parent on first update.
    void this.loadTexture(def.sourceUrl)
      .then((srcTex) => {
        const tex = srcTex.clone();
        tex.colorSpace = srcTex.colorSpace;
        tex.magFilter = srcTex.magFilter;
        tex.minFilter = srcTex.minFilter;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;

        const grid = this.resolveGrid(def);
        tex.repeat.set(1 / grid.cols, 1 / grid.rows);
        // First frame: top-left of the sheet (Three.js UV origin = bottom-left).
        tex.offset.set(0, 1 - 1 / grid.rows);

        const mat = new THREE.SpriteMaterial({
          map: tex,
          color: tint,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          rotation: 0,
        });
        const sprite = new THREE.Sprite(mat);
        sprite.position.set(pos.x, pos.y, pos.z);
        sprite.scale.set(scale, scale, scale);
        sprite.renderOrder = 999;
        scene.add(sprite);

        this.active.push({
          sprite,
          texture: tex,
          cols: grid.cols,
          rows: grid.rows,
          totalFrames: grid.total,
          frameDuration: duration / grid.total,
          age: 0,
          done: false,
          loop,
        });
      })
      .catch((err) => {
        console.warn('[ObjectStoreVfx] texture load failed', name, err);
      });
    return true;
  }

  /** Drive the active sprite animations. Call once per rAF tick. */
  update(dt: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const a = this.active[i];
      a.age += dt;
      const totalDuration = a.frameDuration * a.totalFrames;

      let frame = Math.floor(a.age / a.frameDuration);
      if (frame >= a.totalFrames) {
        if (a.loop) {
          frame = frame % a.totalFrames;
          a.age = a.age % totalDuration;
        } else {
          // Done — remove from scene + dispose
          a.sprite.parent?.remove(a.sprite);
          a.texture.dispose();
          (a.sprite.material as THREE.SpriteMaterial).dispose();
          this.active.splice(i, 1);
          continue;
        }
      }
      const col = frame % a.cols;
      const row = Math.floor(frame / a.cols);
      a.texture.offset.set(col / a.cols, 1 - (row + 1) / a.rows);

      // Fade out near the end (last 20% of life)
      if (!a.loop) {
        const t = a.age / totalDuration;
        if (t > 0.8) {
          const fade = 1 - (t - 0.8) / 0.2;
          (a.sprite.material as THREE.SpriteMaterial).opacity = Math.max(0, fade);
        }
      }
    }
  }

  /** Remove every active sprite (e.g. on scene dispose). */
  clear(): void {
    for (const a of this.active) {
      a.sprite.parent?.remove(a.sprite);
      a.texture.dispose();
      (a.sprite.material as THREE.SpriteMaterial).dispose();
    }
    this.active = [];
  }
}

/** Singleton — manifest + texture cache shared across renderers. */
export const ObjectStoreVfx = new ObjectStoreVfxImpl();

/**
 * Convenience preset map — picks a sensible default ObjectStore effect
 * for each common gameplay event so callers don't have to know names.
 */
export const VFX_PRESETS = {
  /** Sword/axe melee swing arc. */
  meleeSlash: 'slash',
  /** Critical / combo finisher slash. */
  meleeCrit: 'demonSlash1',
  /** Generic enemy-hit impact (sword, fist). */
  meleeHit: 'hitEffect1',
  /** Heavy weapon-on-armor smash. */
  meleeHeavyHit: 'weaponHit',
  /** Bullet/laser bolt projectile. */
  rangedProjectile: 'thunderProjectile2',
  /** Muzzle flash at gun barrel. */
  muzzleFlash: 'thunderHit',
  /** Generic ranged impact spark. */
  rangedHit: 'hitEffect2',
  /** Big boom (heavy attack, AoE). */
  explosion: 'fireExplosion2',
  /** Spell cast aura. */
  cast: 'magicSpell',
  /** Heal pulse. */
  heal: 'healEffect',
  /** Block/parry success. */
  parry: 'holyImpact',
} as const;
export type VfxPreset = keyof typeof VFX_PRESETS;
