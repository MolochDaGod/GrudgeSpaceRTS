/**
 * toon-types.ts — Canonical type definitions for Grudge Smash character data.
 *
 * This file IS the single source of truth for every character's moves,
 * colliders, effects, and hierarchy.  The ToonAdmin editor reads/writes
 * these structures; the game runtime consumes exported JSON that matches
 * these exact shapes.
 */

// ── Pixel / Color ─────────────────────────────────────────────────
/** RGBA colour stored as a hex string "#rrggbbaa" (or "#rrggbb" for opaque). */
export type HexColor = string;

/** A pixel grid is a flat Uint8Array of RGBA quads: [r,g,b,a, r,g,b,a, …] */
export interface PixelGrid {
  width: number;
  height: number;
  /** Base-64 encoded RGBA data. Length = width * height * 4. */
  data: string;
}

// ── Hierarchy Parts ───────────────────────────────────────────────
export interface ToonPart {
  id: string;
  name: string;
  /** Offset relative to parent part (pixels). */
  offsetX: number;
  offsetY: number;
  /** Uniform scale multiplier (1 = normal). */
  scale: number;
  /** Draw order — higher = in front. */
  zOrder: number;
  /** Default pixel art for this part (used when no animation frame overrides it). */
  pixels: PixelGrid;
  /** Child part IDs (for tree hierarchy). */
  children: string[];
  visible: boolean;
}

// ── Colliders ─────────────────────────────────────────────────────
export type ColliderType = 'hitbox' | 'hurtbox' | 'pushbox';
export type ColliderShape = 'rect' | 'circle';

export interface ToonCollider {
  id: string;
  name: string;
  type: ColliderType;
  shape: ColliderShape;
  /** Position relative to the character origin (pixels). */
  x: number;
  y: number;
  /** Width & height for rect; width = diameter for circle. */
  w: number;
  h: number;
  /** If set, this collider moves with the named part. */
  attachedToPart: string | null;
  /** Which animation frame indices this collider is active on.
   *  null = always active. */
  activeFrames: number[] | null;
}

export const COLLIDER_COLORS: Record<ColliderType, string> = {
  hitbox: '#ff4444',
  hurtbox: '#44ff44',
  pushbox: '#4488ff',
};

// ── Animation Frames ──────────────────────────────────────────────
export interface ToonFrame {
  /** Per-part pixel overrides for this frame. Key = partId. */
  partPixels: Record<string, PixelGrid>;
  /** Per-part offset overrides for this frame. */
  partOffsets: Record<string, { dx: number; dy: number }>;
  /** Duration of this frame in ms (allows variable frame timing). */
  durationMs: number;
}

export interface ToonAnimation {
  id: string;
  name: string;
  frames: ToonFrame[];
  fps: number;
  loop: boolean;
}

// ── Effects ───────────────────────────────────────────────────────
export type EffectType = 'particle' | 'flash' | 'shake' | 'trail' | 'burst';

export interface ToonEffect {
  id: string;
  name: string;
  type: EffectType;
  color: HexColor;
  /** Duration in ms. */
  durationMs: number;
  /** Frame index within the owning animation where this effect triggers. */
  spawnFrame: number;
  /** Pixel offset from character origin. */
  offsetX: number;
  offsetY: number;
  /** Optional radius / size for particle/burst. */
  size: number;
}

// ── Attacks / Moves ───────────────────────────────────────────────
export interface ToonAttack {
  id: string;
  name: string;
  /** Which animation plays during this attack. */
  animationId: string;
  damage: number;
  knockbackX: number;
  knockbackY: number;
  /** Frame indices: startup, first active, last active, total recovery. */
  startupFrame: number;
  activeFrameStart: number;
  activeFrameEnd: number;
  recoveryFrame: number;
  /** Collider IDs that activate during this attack. */
  colliderIds: string[];
  /** Effect IDs that trigger during this attack. */
  effectIds: string[];
}

// ── Top-Level Character ───────────────────────────────────────────
export interface ToonCharacter {
  id: string;
  name: string;
  /** Pixel dimensions of the character sprite canvas. */
  spriteWidth: number;
  spriteHeight: number;
  /** Colour palette (up to 32 colours). */
  palette: HexColor[];
  /** Hierarchy root part IDs (usually just one "root" or "body"). */
  rootParts: string[];
  /** All parts keyed by id. */
  parts: Record<string, ToonPart>;
  /** All animations keyed by id. */
  animations: Record<string, ToonAnimation>;
  /** All colliders keyed by id. */
  colliders: Record<string, ToonCollider>;
  /** All attacks keyed by id. */
  attacks: Record<string, ToonAttack>;
  /** All effects keyed by id. */
  effects: Record<string, ToonEffect>;
}

// ── Factory: default empty character ──────────────────────────────
export function createDefaultCharacter(): ToonCharacter {
  const bodyPixels = createEmptyPixelGrid(32, 32);
  const headPixels = createEmptyPixelGrid(16, 16);
  const armPixels = createEmptyPixelGrid(8, 20);
  const legPixels = createEmptyPixelGrid(8, 20);

  return {
    id: `char_${Date.now()}`,
    name: 'New Character',
    spriteWidth: 64,
    spriteHeight: 64,
    palette: [
      '#000000', '#ffffff', '#ff4444', '#44ff44', '#4488ff',
      '#ffcc00', '#ff8800', '#aa44ff', '#44ddff', '#ff44aa',
      '#886644', '#448844', '#884444', '#444488', '#888888',
      '#cccccc',
    ],
    rootParts: ['body'],
    parts: {
      body: { id: 'body', name: 'Body', offsetX: 16, offsetY: 16, scale: 1, zOrder: 0, pixels: bodyPixels, children: ['head', 'arm_l', 'arm_r', 'leg_l', 'leg_r'], visible: true },
      head: { id: 'head', name: 'Head', offsetX: 8, offsetY: -18, scale: 1, zOrder: 1, pixels: headPixels, children: [], visible: true },
      arm_l: { id: 'arm_l', name: 'Arm L', offsetX: -10, offsetY: 0, scale: 1, zOrder: -1, pixels: armPixels, children: [], visible: true },
      arm_r: { id: 'arm_r', name: 'Arm R', offsetX: 26, offsetY: 0, scale: 1, zOrder: 2, pixels: armPixels, children: ['weapon'], visible: true },
      leg_l: { id: 'leg_l', name: 'Leg L', offsetX: 4, offsetY: 24, scale: 1, zOrder: -1, pixels: legPixels, children: [], visible: true },
      leg_r: { id: 'leg_r', name: 'Leg R', offsetX: 18, offsetY: 24, scale: 1, zOrder: -1, pixels: legPixels, children: [], visible: true },
      weapon: { id: 'weapon', name: 'Weapon', offsetX: 4, offsetY: -8, scale: 1, zOrder: 3, pixels: createEmptyPixelGrid(8, 24), children: [], visible: true },
    },
    animations: {
      idle: { id: 'idle', name: 'Idle', frames: [createEmptyFrame()], fps: 8, loop: true },
    },
    colliders: {
      body_hurt: { id: 'body_hurt', name: 'Body Hurtbox', type: 'hurtbox', shape: 'rect', x: 12, y: 4, w: 24, h: 52, attachedToPart: 'body', activeFrames: null },
      push: { id: 'push', name: 'Pushbox', type: 'pushbox', shape: 'rect', x: 14, y: 8, w: 20, h: 48, attachedToPart: 'body', activeFrames: null },
    },
    attacks: {},
    effects: {},
  };
}

export function createEmptyPixelGrid(w: number, h: number): PixelGrid {
  // All transparent
  const buf = new Uint8Array(w * h * 4);
  return { width: w, height: h, data: uint8ToBase64(buf) };
}

export function createEmptyFrame(): ToonFrame {
  return { partPixels: {}, partOffsets: {}, durationMs: 125 };
}

// ── Base64 helpers ────────────────────────────────────────────────
export function uint8ToBase64(buf: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return btoa(binary);
}

export function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf;
}
