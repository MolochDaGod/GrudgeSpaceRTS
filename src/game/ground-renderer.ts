/**
 * ground-renderer.ts — Three.js ground-combat renderer for GrudgeSpaceRTS.
 *
 * ════════════════════════════════════════════════════════════════════
 *  RENDER PIPELINE OVERVIEW
 * ════════════════════════════════════════════════════════════════════
 *
 *  WebGLRenderer  →  EffectComposer
 *    ├─ RenderPass          (scene + camera — lit geometry)
 *    ├─ UnrealBloomPass     (emissive glow, weapon sparks, hit flashes)
 *    └─ ShaderPass          (VignetteShader — darken screen edges)
 *
 *  BEST PRACTICES for this pipeline:
 *  • Keep emissiveIntensity ≤ 0.8 for most meshes; reserve >1 for FX.
 *  • The bloom threshold (0.35) means only surfaces with luminance > 0.35
 *    bloom. Set emissive to a visible colour + emissiveIntensity ≥ 0.4 for
 *    intentional glow (weapons, hit sparks, enemy eyes).
 *  • Never use THREE.LinearSRGBColorSpace mid-frame; all textures must have
 *    colorSpace = THREE.SRGBColorSpace before being added to the scene.
 *  • Shadow maps: renderer uses PCFSoftShadowMap at 1024 px — raising the
 *    map size improves quality at a GPU cost; keep characters castShadow=true.
 *
 * ════════════════════════════════════════════════════════════════════
 *  CHARACTER MODEL PIPELINE
 * ════════════════════════════════════════════════════════════════════
 *
 *  Source: "Ultimate Modular Men – Feb 2022" GLTF pack
 *  Path:   public/assets/ground/characters/gltf/
 *
 *  Loading flow per character:
 *    1. loadGLTF(path)
 *       ├─ GLTFLoader.loadAsync → raw GLTF scene + AnimationClip[]
 *       ├─ Measure Box3 height (Y axis) → scale scene to exactly 2.0 m
 *       ├─ Cache canonical scene (with scale)
 *       └─ Return SkeletonUtils.clone(scene) — each entity gets its own
 *          bone hierarchy so mixers don't share state.
 *    2. applyCharacterMaterial(group, classColor)
 *       Replaces all mesh materials with MeshStandardMaterial in the class
 *       tint colour.  Every 3rd mesh gets a darker secondary shade for
 *       simple armour-zone banding.  Emissive glow ensures visibility.
 *    3. AnimationController.registerClip(key, clip)
 *       Registers each embedded GLTF clip under an AnimKey name using
 *       GLTF_ANIM_MAP.  For weapon-action keys, also builds an upper-body-
 *       only copy (makeUpperBodyClip) for the overlay layer.
 *
 *  Adding a new character model:
 *    a. Copy .gltf (self-contained with embedded buffers) into
 *       public/assets/ground/characters/gltf/
 *    b. Add an entry to CHARACTER_GLTF_MAP or ENEMY_GLTF_MAP.
 *    c. Inspect animation names: open the .gltf in Blender or run
 *         node -e "const g=require('./YourModel.gltf'); g.animations.forEach(a=>console.log(a.name))"
 *       then map them in GLTF_ANIM_MAP.
 *
 * ════════════════════════════════════════════════════════════════════
 *  ANIMATION SYSTEM — TWO LAYERS
 * ════════════════════════════════════════════════════════════════════
 *
 *  AnimationController manages a single THREE.AnimationMixer with two
 *  conceptual layers:
 *
 *  Layer 0 — BASE (looping):
 *    idle / walk / run / strafe / block_idle / injured_*
 *    Plays on all bones.  Updated every frame.  Replaced by crossfade
 *    when the locomotion state changes.
 *
 *  Layer 1 — OVERLAY (one-shot):
 *    attack / combo2-3 / heavy_attack / dodge / shoot / cast / death / hit
 *    Plays an upper-body-filtered clip (bones: spine, chest, shoulder,
 *    arm, forearm, hand, head, neck) so the legs keep the base animation
 *    while the arms perform the weapon action.
 *    The overlay is NEVER interrupted; it plays to completion, then fires
 *    the mixer 'finished' event which auto-returns to the base layer.
 *
 *  One-shot guarantee (roll, dodge, death):
 *    isOneShotPlaying blocks any new one-shot until 'finished' fires.
 *    combat-engine animKey changes during that time are recorded in the
 *    base layer but don't interrupt the overlay.
 *
 * ════════════════════════════════════════════════════════════════════
 *  CAMERA SYSTEM
 * ════════════════════════════════════════════════════════════════════
 *
 *  Follow mode (default):
 *    Third-person over-shoulder.  Camera orbits the player at CAM_DISTANCE
 *    (8 u) and CAM_HEIGHT (4 u) with a slight shoulder offset (CAM_SHOULDER).
 *    Mouse drag (pointer-locked) rotates cameraYaw / cameraPitch.
 *    cameraYaw is passed to ground-combat.ts each frame so movement is
 *    always camera-relative (W = into screen, not world +Z).
 *
 *  Free mode (P key):
 *    Editor fly-cam.  WASD = translate in look direction, E/Q = up/down,
 *    RMB drag = orbit.  Game is PAUSED while in free mode.
 *
 *  Camera-relative movement formula (ground-combat.ts):
 *    cameraForward = (sin(yaw), 0,  cos(yaw))   ← direction camera looks
 *    cameraRight   = (cos(yaw), 0, -sin(yaw))   ← camera's local right
 *    moveDir = mz * cameraForward + mx * cameraRight
 *            = { x: mx*cos + mz*sin, z: -mx*sin + mz*cos }
 */

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { loadAnimationClip as loadAnimClipCentral, loadModel as loadModelCentral, loadPrefabGLB } from './model-loader';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { PlanetType } from './space-types';
// ── Postprocessing: pmndrs/postprocessing (single-pass, faster than Three.js built-in) ──
// Per glTF 2.0 PBR spec: bloom should respect emissiveTexture + emissiveFactor.
// ToneMapping handles HDR→SDR conversion matching glTF's linear-space rendering.
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BloomEffect,
  ToneMappingEffect,
  SMAAEffect,
  SMAAPreset,
  ToneMappingMode,
} from 'postprocessing';
import {
  type GroundCombatState,
  type GroundInput,
  type GroundEnemy,
  type CharacterClass,
  createInitialState,
  updateGroundCombat,
  spawnWave,
} from './ground-combat';
import { resolvePathUrl } from './asset-registry';
import { getShipPrefab, type SpacePrefab } from './space-prefabs';
import { lookupWeaponXform } from './weapon-scales';
import { ObjectStoreVfx, VFX_PRESETS } from './object-store-vfx';
import { ObjectStoreModels, ObjectStoreUnits } from './object-store-models';

// VignetteShader removed — pmndrs/postprocessing handles vignette via VignetteEffect
// if needed in the future: import { VignetteEffect } from 'postprocessing';
// and add to the EffectPass.

// ── Animation system ─────────────────────────────────────────────
const ANIM_BASE = '/assets/ground/animations';

// ── Upper-body bone name fragments (lowercase) ───────────────────
// Used to filter animation tracks so weapon actions only drive the
// upper body while locomotion continues on the lower body.
const UPPER_BODY_BONE_FRAGMENTS = [
  'spine',
  'chest',
  'shoulder',
  'arm',
  'forearm',
  'hand',
  'head',
  'neck',
  'clavicle',
  'finger',
  'thumb',
  'index',
  'middle',
  'ring',
  'pinky',
];

/** AnimKey values that are weapon/combat actions (overlay on upper body). */
const WEAPON_ANIM_KEYS_SET = new Set([
  'attack',
  'combo2',
  'combo3',
  'heavy_attack',
  'jump_attack',
  'slide_attack',
  'shoot',
  'cast',
  'kick',
  'block',
]);

/** ONE_SHOT_ANIM_KEYS — these play from start to finish, never interrupted. */
const ONE_SHOT_KEYS_SET = new Set([
  'attack',
  'combo2',
  'combo3',
  'heavy_attack',
  'jump_attack',
  'slide_attack',
  'dodge',
  'death',
  'hit',
  'kick',
  'jump',
  'shoot',
  'cast',
]);

/**
 * Build an upper-body-only copy of a clip by filtering out tracks
 * whose bone names belong to the lower body (hips, legs, feet).
 * Returns null if no upper-body tracks exist (e.g. a root-motion-only clip).
 */
function makeUpperBodyClip(clip: THREE.AnimationClip): THREE.AnimationClip | null {
  const upperTracks = clip.tracks.filter((track) => {
    // Track name format: "BoneName.property"
    const boneName = track.name.split('.')[0].toLowerCase();
    // Keep root/hips position (needed for root motion continuity) but skip
    // rotation/scale of lower-body bones
    const isUpper = UPPER_BODY_BONE_FRAGMENTS.some((frag) => boneName.includes(frag));
    // Also keep armature-level tracks
    const isRoot = boneName === 'armature' || boneName === '' || boneName === 'root';
    return isUpper || isRoot;
  });
  if (upperTracks.length === 0) return null;
  return new THREE.AnimationClip(clip.name + '_upper', clip.duration, upperTracks);
}

/**
 * Full animation key set.
 * combo2/combo3 chain from attack for high-skill play.
 * strafe is directional movement while locked on.
 * shoot/cast are ranged / magic special actions.
 */
type AnimKey =
  | 'idle'
  | 'walk'
  | 'run'
  | 'strafe'
  | 'attack'
  | 'combo2'
  | 'combo3'
  | 'heavy_attack'
  | 'jump_attack'
  | 'slide_attack'
  | 'block'
  | 'block_idle'
  | 'dodge'
  | 'shoot'
  | 'cast'
  | 'kick'
  | 'jump'
  | 'hit'
  | 'death'
  | 'injured_idle'
  | 'injured_walk'
  | 'injured_run';

/** All available animations per weapon type.
 * Sources:
 *   sword — 1hweaponandshield pack (18 FBX)
 *   greatsword — 2hweapons pack (24 FBX axe models used as greatsword)
 *   bow — bows pack (96 FBX) + bow-advanced/longbow pack (40 FBX)
 *   staff/magic — magicmotion pack (15 FBX)
 *   rifle — rifleandcrossbow pack (17 FBX)
 *   gun-advanced — advancedgunandcrossbow pack (50 FBX, 8-dir locomotion)
 *   common — meleemoves pack (48 FBX unarmed/general)
 */
const ANIM_SETS: Record<string, Partial<Record<AnimKey, string>>> = {
  sword: {
    idle: `${ANIM_BASE}/sword/idle.fbx`,
    walk: `${ANIM_BASE}/sword/walk.fbx`,
    run: `${ANIM_BASE}/sword/run.fbx`,
    strafe: `${ANIM_BASE}/sword/strafe.fbx`,
    attack: `${ANIM_BASE}/sword/attack.fbx`,
    combo2: `${ANIM_BASE}/sword/combo2.fbx`,
    combo3: `${ANIM_BASE}/sword/combo3.fbx`,
    heavy_attack: `${ANIM_BASE}/sword/heavy_attack.fbx`,
    block: `${ANIM_BASE}/sword/block.fbx`,
    block_idle: `${ANIM_BASE}/sword/block_idle.fbx`,
    death: `${ANIM_BASE}/sword/death.fbx`,
  },
  greatsword: {
    idle: `${ANIM_BASE}/common/idle.fbx`,
    walk: `${ANIM_BASE}/common/walk.fbx`,
    run: `${ANIM_BASE}/common/run.fbx`,
    attack: `${ANIM_BASE}/common/attack.fbx`,
    combo2: `${ANIM_BASE}/common/combo2.fbx`,
    combo3: `${ANIM_BASE}/common/combo3.fbx`,
    heavy_attack: `${ANIM_BASE}/common/heavy_attack.fbx`,
    jump_attack: `${ANIM_BASE}/common/jump_attack.fbx`,
    slide_attack: `${ANIM_BASE}/common/slide_attack.fbx`,
    kick: `${ANIM_BASE}/common/kick.fbx`,
    hit: `${ANIM_BASE}/common/hit.fbx`,
    death: `${ANIM_BASE}/gun-advanced/death.fbx`,
  },
  bow: {
    idle: `${ANIM_BASE}/bow-advanced/idle.fbx`,
    walk: `${ANIM_BASE}/bow-advanced/walk.fbx`,
    run: `${ANIM_BASE}/bow-advanced/run.fbx`,
    strafe: `${ANIM_BASE}/bow-advanced/strafe_left.fbx`,
    attack: `${ANIM_BASE}/bow-advanced/attack.fbx`,
    shoot: `${ANIM_BASE}/bow-advanced/shoot.fbx`,
    block: `${ANIM_BASE}/bow-advanced/block.fbx`,
    dodge: `${ANIM_BASE}/bow-advanced/dodge.fbx`,
    kick: `${ANIM_BASE}/bow-advanced/kick.fbx`,
    hit: `${ANIM_BASE}/bow-advanced/hit.fbx`,
    death: `${ANIM_BASE}/bow-advanced/death.fbx`,
  },
  staff: {
    idle: `${ANIM_BASE}/magic/idle.fbx`,
    walk: `${ANIM_BASE}/magic/walk.fbx`,
    run: `${ANIM_BASE}/magic/run.fbx`,
    attack: `${ANIM_BASE}/magic/attack.fbx`,
    cast: `${ANIM_BASE}/magic/cast.fbx`,
    jump: `${ANIM_BASE}/magic/jump.fbx`,
    hit: `${ANIM_BASE}/magic/hit.fbx`,
    death: `${ANIM_BASE}/magic/death.fbx`,
  },
  spear: {
    idle: `${ANIM_BASE}/common/idle.fbx`,
    walk: `${ANIM_BASE}/common/walk.fbx`,
    run: `${ANIM_BASE}/common/run.fbx`,
    attack: `${ANIM_BASE}/common/attack.fbx`,
    combo2: `${ANIM_BASE}/common/melee_combo1.fbx`,
    combo3: `${ANIM_BASE}/common/melee_combo2.fbx`,
    heavy_attack: `${ANIM_BASE}/common/heavy_attack.fbx`,
    jump_attack: `${ANIM_BASE}/common/jump_attack.fbx`,
    kick: `${ANIM_BASE}/common/kick.fbx`,
    hit: `${ANIM_BASE}/common/hit.fbx`,
    death: `${ANIM_BASE}/gun-advanced/death.fbx`,
  },
  rifle: {
    idle: `${ANIM_BASE}/rifle/idle.fbx`,
    walk: `${ANIM_BASE}/rifle/walk.fbx`,
    run: `${ANIM_BASE}/rifle/run.fbx`,
    strafe: `${ANIM_BASE}/rifle/strafe_left.fbx`,
    shoot: `${ANIM_BASE}/rifle/shoot.fbx`,
    attack: `${ANIM_BASE}/rifle/shoot.fbx`,
    hit: `${ANIM_BASE}/rifle/hit.fbx`,
    jump: `${ANIM_BASE}/rifle/jump.fbx`,
    death: `${ANIM_BASE}/gun-advanced/death.fbx`,
  },
  // 8-directional gun locomotion (gunslinger class)
  gun: {
    idle: `${ANIM_BASE}/gun-advanced/idle.fbx`,
    walk: `${ANIM_BASE}/gun-advanced/walk.fbx`,
    run: `${ANIM_BASE}/gun-advanced/run.fbx`,
    strafe: `${ANIM_BASE}/gun-advanced/walk_left.fbx`,
    shoot: `${ANIM_BASE}/gun-advanced/idle_aim.fbx`,
    attack: `${ANIM_BASE}/gun-advanced/idle_aim.fbx`,
    dodge: `${ANIM_BASE}/gun-advanced/sprint.fbx`,
    jump: `${ANIM_BASE}/gun-advanced/jump.fbx`,
    death: `${ANIM_BASE}/gun-advanced/death.fbx`,
  },
};

/** Common fallback clips — used when weapon set is missing a key */
const COMMON_ANIMS: Partial<Record<AnimKey, string>> = {
  idle: `${ANIM_BASE}/common/idle.fbx`,
  walk: `${ANIM_BASE}/common/walk.fbx`,
  run: `${ANIM_BASE}/common/run.fbx`,
  dodge: `${ANIM_BASE}/bow-advanced/dodge.fbx`,
  hit: `${ANIM_BASE}/common/hit.fbx`,
  death: `${ANIM_BASE}/gun-advanced/death.fbx`,
  jump: `${ANIM_BASE}/common/jump.fbx`,
  kick: `${ANIM_BASE}/common/kick.fbx`,
  block: `${ANIM_BASE}/common/block_idle.fbx`,
};

/** Injured overrides — switched in below INJURED_HP_THRESHOLD */
const INJURED_ANIMS: Partial<Record<AnimKey, string>> = {
  injured_idle: `${ANIM_BASE}/injured/idle.fbx`,
  injured_walk: `${ANIM_BASE}/injured/walk.fbx`,
  injured_run: `${ANIM_BASE}/injured/run.fbx`,
};

const INJURED_HP_THRESHOLD = 0.12; // 12% — visible sooner for better feedback

// ── Character roster ─────────────────────────────────────────────
/**
 * Maps CharacterClass → model index (0-11), weapon type, tint colour.
 * Models 0-5 = player-side classes; 6-11 = enemy variants.
 */
export interface CharacterConfig {
  modelIdx: number;
  weapon: string;
  displayName: string;
  description: string;
  color: number; // team tint hex
  icon: string;
  stats: { hp: number; stamina: number; speed: number; attackDmg: number; defense: number };
}

export const CHARACTER_ROSTER: Record<string, CharacterConfig> = {
  warrior: {
    modelIdx: 0,
    weapon: 'sword',
    displayName: 'Warrior',
    description: 'Balanced fighter with sword+shield. Best parry window and block. Combo x3.',
    color: 0x4488ff,
    icon: '⚔️',
    stats: { hp: 200, stamina: 100, speed: 5.0, attackDmg: 18, defense: 4 },
  },
  berserker: {
    modelIdx: 1,
    weapon: 'greatsword',
    displayName: 'Berserker',
    description: 'Greatsword powerhouse. Massive damage, jump & slide attacks. Low defense.',
    color: 0xff6622,
    icon: '🪓',
    stats: { hp: 170, stamina: 80, speed: 5.5, attackDmg: 35, defense: 1 },
  },
  ranger: {
    modelIdx: 2,
    weapon: 'bow',
    displayName: 'Ranger',
    description: 'Longbow master. Kite enemies, dodge-shoot, strafe while aiming.',
    color: 0x44ffaa,
    icon: '🏹',
    stats: { hp: 120, stamina: 120, speed: 6.0, attackDmg: 24, defense: 2 },
  },
  mage: {
    modelIdx: 3,
    weapon: 'staff',
    displayName: 'Mage',
    description: 'Arcane caster. AoE heavy blast, spell combos. Very fragile.',
    color: 0xaa44ff,
    icon: '🔮',
    stats: { hp: 100, stamina: 130, speed: 4.5, attackDmg: 42, defense: 0 },
  },
  rogue: {
    modelIdx: 4,
    weapon: 'sword',
    displayName: 'Rogue',
    description: 'Rapid dual strikes and acrobatic dodges. Backstab bonus damage.',
    color: 0xffcc22,
    icon: '🗡️',
    stats: { hp: 130, stamina: 90, speed: 7.0, attackDmg: 14, defense: 2 },
  },
  gunslinger: {
    modelIdx: 5,
    weapon: 'rifle',
    displayName: 'Gunslinger',
    description: 'Mid-range rifle specialist. Burst fire, cover roll, suppress enemies.',
    color: 0xddbb66,
    icon: '🔫',
    stats: { hp: 150, stamina: 100, speed: 5.5, attackDmg: 28, defense: 2 },
  },
};

/** Enemy model indices and configs (models 6-11 + CorsairKing boss) */
const ENEMY_MODEL_MAP: Record<string, { modelIdx: number; tint: number }> = {
  melee: { modelIdx: 6, tint: 0xff4444 },
  ranged: { modelIdx: 7, tint: 0xff8844 },
  heavy: { modelIdx: 8, tint: 0xcc2222 },
  stalker: { modelIdx: 9, tint: 0xff44aa },
  titan: { modelIdx: 10, tint: 0xaa0000 },
  boss: { modelIdx: 11, tint: 0xffaa00 }, // CorsairKing-like boss
};

const CORSAIR_KING_PATH = '/assets/ground/characters/CorsairKing.fbx';

// ── Vehicle model paths (OBJ + MTL + PNG) ─────────────────────────
const VEHICLE_MODELS: Record<string, { obj: string; mtl: string; tex: string; scale: number; tint: number }> = {
  gunbike: {
    obj: '/assets/space/models/vehicles/GunBike/GunBike-0-GunBike.obj',
    mtl: '/assets/space/models/vehicles/GunBike/GunBike-0-GunBike.mtl',
    tex: '/assets/space/models/vehicles/GunBike/GunBike-0-GunBike.png',
    scale: 0.012,
    tint: 0xff3300,
  },
  scooter: {
    obj: '/assets/space/models/vehicles/Scooter/Scooter-0-Scooter.obj',
    mtl: '/assets/space/models/vehicles/Scooter/Scooter-0-Scooter.mtl',
    tex: '/assets/space/models/vehicles/Scooter/Scooter-0-Scooter.png',
    scale: 0.01,
    tint: 0xff6600,
  },
  chopper: {
    obj: '/assets/space/models/vehicles/Chopper/Chopper-0-Chopper.obj',
    mtl: '/assets/space/models/vehicles/Chopper/Chopper-0-Chopper.mtl',
    tex: '/assets/space/models/vehicles/Chopper/Chopper-0-Chopper.png',
    scale: 0.014,
    tint: 0xaa2200,
  },
  tracer: {
    obj: '/assets/space/models/vehicles/Tracer/Tracer-0-Tracer.obj',
    mtl: '/assets/space/models/vehicles/Tracer/Tracer-0-Tracer.mtl',
    tex: '/assets/space/models/vehicles/Tracer/Tracer-0-Tracer.png',
    scale: 0.011,
    tint: 0xff8800,
  },
};

// ── AnimationController — per-entity mixer + two-layer animation ──
/**
 * Two-layer animation controller:
 *
 *  Layer 0 — BASE (locomotion): idle / walk / run / strafe.
 *    Always looping. Drives the full body skeleton.
 *
 *  Layer 1 — OVERLAY (weapon/combat): attack / combo / dodge / roll.
 *    Plays once (one-shot). Drives upper-body bones only via a
 *    filtered clip so legs continue with the base locomotion.
 *    The overlay is NEVER interrupted mid-play; only after the
 *    mixer fires the 'finished' event does control return to the base.
 *
 * Usage:
 *   ctrl.play('walk')              // base layer, loops
 *   ctrl.play('attack', false)     // overlay layer, plays to completion
 */
class AnimationController {
  mixer: THREE.AnimationMixer;

  /** Full clips (all bones). */
  private clips = new Map<string, THREE.AnimationClip>();
  /** Upper-body-only variants for weapon overlays. */
  private upperClips = new Map<string, THREE.AnimationClip>();

  /** Currently active base (locomotion) action. */
  private baseAction: THREE.AnimationAction | null = null;
  private baseKey = '';

  /** Currently active one-shot overlay action. */
  private overlayAction: THREE.AnimationAction | null = null;

  /** True while a one-shot is playing — blocks any new one-shot from interrupting. */
  isOneShotPlaying = false;

  constructor(root: THREE.Object3D) {
    this.mixer = new THREE.AnimationMixer(root);
    // When a one-shot finishes naturally, clear the overlay and return to base.
    this.mixer.addEventListener('finished', (e) => {
      if (this.overlayAction === (e as THREE.Event & { action: THREE.AnimationAction }).action) {
        this.overlayAction?.fadeOut(0.25);
        this.overlayAction = null;
        this.isOneShotPlaying = false;
        // Re-play the current base clip to blend back smoothly
        if (this.baseKey) this._playBase(this.baseKey, 0.25);
      }
    });
  }

  /** Load an animation clip from an FBX file and register it under `key`. */
  async loadClip(key: string, path: string): Promise<void> {
    if (this.clips.has(key)) return;
    const clip = await loadAnimClipCentral(path);
    if (clip) {
      clip.name = key;
      this.clips.set(key, clip);
      this._buildUpperVariant(key, clip);
    }
  }

  /** Register a pre-loaded clip (e.g. from a GLTF's embedded animations). */
  registerClip(key: string, clip: THREE.AnimationClip): void {
    if (this.clips.has(key)) return;
    const c = clip.clone();
    c.name = key;
    this.clips.set(key, c);
    this._buildUpperVariant(key, c);
  }

  /** Build and cache an upper-body-only variant of the clip if it's a weapon key. */
  private _buildUpperVariant(key: string, clip: THREE.AnimationClip): void {
    if (!WEAPON_ANIM_KEYS_SET.has(key)) return;
    const upper = makeUpperBodyClip(clip);
    if (upper) this.upperClips.set(key, upper);
  }

  /** Internal: crossfade the base layer to `key`. */
  private _playBase(key: string, fadeDuration: number): void {
    const clip = this.clips.get(key);
    if (!clip) return;
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = false;
    if (this.baseAction && this.baseAction !== action) {
      this.baseAction.fadeOut(fadeDuration);
    }
    action.reset().fadeIn(fadeDuration).play();
    this.baseAction = action;
    this.baseKey = key;
  }

  /**
   * Play an animation.
   *
   * @param key         AnimKey to play.
   * @param loop        true = looping base layer; false = one-shot overlay.
   * @param fadeDuration Crossfade seconds.
   */
  play(key: string, loop = true, fadeDuration = 0.2): void {
    if (loop) {
      // ── Base layer (locomotion) ────────────────────────────
      // Update base even while an overlay is playing so it smoothly
      // resumes the right locomotion clip when the overlay finishes.
      if (key === this.baseKey) return;
      this._playBase(key, fadeDuration);
    } else {
      // ── Overlay layer (weapon / combat) ───────────────────
      // Never interrupt a currently playing one-shot.
      if (this.isOneShotPlaying) return;

      // Prefer upper-body-only clip for weapon overlays so legs keep moving.
      const clip = (WEAPON_ANIM_KEYS_SET.has(key) ? this.upperClips.get(key) : undefined) ?? this.clips.get(key);
      if (!clip) return;

      if (this.overlayAction) this.overlayAction.fadeOut(fadeDuration);

      const action = this.mixer.clipAction(clip);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      // Start from the very beginning — guarantees roll/dodge play in full.
      action.reset().fadeIn(fadeDuration).play();
      this.overlayAction = action;
      this.isOneShotPlaying = true;
    }
  }

  update(dt: number): void {
    this.mixer.update(dt);
  }

  dispose(): void {
    this.mixer.stopAllAction();
  }
}

// ── Terrain palette per planet type ───────────────────────────────
const TERRAIN_PALETTE: Record<PlanetType, { ground: number; accent: number; fog: number; sky: number; ambient: number; sun: number }> = {
  volcanic: { ground: 0x2a1a0a, accent: 0xff4400, fog: 0x1a0800, sky: 0x0a0400, ambient: 0x442200, sun: 0xff6622 },
  oceanic: { ground: 0x1a3040, accent: 0x44aaff, fog: 0x0a1820, sky: 0x081420, ambient: 0x224466, sun: 0x88ccff },
  barren: { ground: 0x3a3028, accent: 0xaa8866, fog: 0x1a1810, sky: 0x0a0a08, ambient: 0x443322, sun: 0xddbb88 },
  crystalline: { ground: 0x1a2a3a, accent: 0x44ddff, fog: 0x0a1420, sky: 0x081018, ambient: 0x224455, sun: 0x88ddff },
  gas_giant: { ground: 0x2a2a1a, accent: 0xffaa22, fog: 0x141408, sky: 0x0a0a04, ambient: 0x443300, sun: 0xffcc44 },
  frozen: { ground: 0x3a4050, accent: 0xaaccee, fog: 0x1a2030, sky: 0x101820, ambient: 0x445566, sun: 0xaaddff },
  plasma: { ground: 0x2a0a2a, accent: 0xff44ff, fog: 0x140814, sky: 0x080408, ambient: 0x442244, sun: 0xff66ff },
  fungal: { ground: 0x1a2a1a, accent: 0x44ff44, fog: 0x081408, sky: 0x040a04, ambient: 0x224422, sun: 0x88ff88 },
  metallic: { ground: 0x2a2a2a, accent: 0xaaaacc, fog: 0x141418, sky: 0x08080c, ambient: 0x444466, sun: 0xbbbbdd },
  dark_matter: { ground: 0x0a0a1a, accent: 0x8844ff, fog: 0x040410, sky: 0x020208, ambient: 0x222244, sun: 0x6644cc },
};

// ── Biome dressing: per-planet 3D asset prop placement ───────────
interface BiomeDressingEntry {
  /** Prefab key from any space-prefabs registry (resolved via getShipPrefab). */
  key: string;
  /** Number of instances to place on the terrain. */
  count: number;
  /** Target auto-normalized height in meters (before scaleVar). */
  size: number;
  /** Random scale variance: ±fraction of size (0.3 = 70%–130%). */
  scaleVar: number;
  /** Nav-mesh blocked radius around prop (0 = walkable). */
  navR: number;
  /** Extra Y offset above terrain surface. */
  yOff: number;
  /** Max radius from world origin for placement. */
  range: number;
}

const BIOME_DRESSING: Record<PlanetType, BiomeDressingEntry[]> = {
  volcanic: [
    { key: 'ancient_relic_column_ruin', count: 3, size: 4, scaleVar: 0.3, navR: 1.5, yOff: 0, range: 70 },
    { key: 'shs_laser_turret', count: 2, size: 3, scaleVar: 0.2, navR: 2.0, yOff: 0, range: 60 },
    { key: 'env_pillar_a', count: 4, size: 2.5, scaleVar: 0.3, navR: 1.0, yOff: 0, range: 65 },
  ],
  oceanic: [
    { key: 'ancient_relic_alien_statue', count: 1, size: 5, scaleVar: 0.2, navR: 3.0, yOff: 0, range: 55 },
    { key: 'ancient_relic_column', count: 3, size: 3, scaleVar: 0.3, navR: 1.0, yOff: 0, range: 65 },
    { key: 'shs_rock_001', count: 4, size: 2, scaleVar: 0.4, navR: 1.5, yOff: 0, range: 75 },
  ],
  barren: [
    { key: 'ancient_relic_head_totem', count: 2, size: 4, scaleVar: 0.2, navR: 2.0, yOff: 0, range: 60 },
    { key: 'ancient_relic_column_ruin', count: 3, size: 3, scaleVar: 0.3, navR: 1.5, yOff: 0, range: 65 },
    { key: 'env_wall_basic', count: 2, size: 3, scaleVar: 0.2, navR: 2.0, yOff: 0, range: 55 },
    { key: 'shs_rock_002', count: 3, size: 2, scaleVar: 0.4, navR: 1.5, yOff: 0, range: 70 },
  ],
  crystalline: [
    { key: 'ancient_portal_stairs', count: 1, size: 5, scaleVar: 0.1, navR: 3.5, yOff: 0, range: 50 },
    { key: 'ancient_portal_arch', count: 1, size: 6, scaleVar: 0.1, navR: 3.0, yOff: 0, range: 50 },
    { key: 'ancient_relic_giant_hand_a', count: 2, size: 5, scaleVar: 0.2, navR: 3.0, yOff: 0, range: 65 },
    { key: 'ancient_treasure', count: 4, size: 2, scaleVar: 0.3, navR: 1.5, yOff: 0, range: 60 },
  ],
  gas_giant: [
    { key: 'shs_eco_hub', count: 1, size: 5, scaleVar: 0.1, navR: 3.0, yOff: 0.5, range: 50 },
    { key: 'shs_power_plant', count: 1, size: 4, scaleVar: 0.1, navR: 3.0, yOff: 0.5, range: 55 },
    { key: 'shs_satellite_dish', count: 3, size: 3, scaleVar: 0.2, navR: 2.0, yOff: 0, range: 60 },
    { key: 'env_button_console', count: 3, size: 1.5, scaleVar: 0.3, navR: 0.8, yOff: 0, range: 50 },
  ],
  frozen: [
    { key: 'ancient_relic_giant_hand_a', count: 1, size: 6, scaleVar: 0.2, navR: 3.0, yOff: 0, range: 60 },
    { key: 'ancient_relic_giant_hand_b', count: 1, size: 6, scaleVar: 0.2, navR: 3.0, yOff: 0, range: 60 },
    { key: 'ancient_relic_column', count: 3, size: 3, scaleVar: 0.3, navR: 1.5, yOff: 0, range: 65 },
    { key: 'shs_rock_003', count: 5, size: 2, scaleVar: 0.4, navR: 1.5, yOff: 0, range: 75 },
  ],
  plasma: [
    { key: 'ancient_portal_arch', count: 1, size: 6, scaleVar: 0.1, navR: 3.5, yOff: 0, range: 45 },
    { key: 'ancient_treasure', count: 2, size: 2, scaleVar: 0.3, navR: 1.5, yOff: 0, range: 55 },
    { key: 'shs_shield_generator', count: 2, size: 3, scaleVar: 0.2, navR: 2.5, yOff: 0, range: 55 },
    { key: 'shs_teleporter', count: 2, size: 3, scaleVar: 0.2, navR: 2.5, yOff: 0, range: 55 },
  ],
  fungal: [
    { key: 'ancient_relic_alien_statue', count: 1, size: 4, scaleVar: 0.2, navR: 2.5, yOff: 0, range: 55 },
    { key: 'ancient_relic_head_totem', count: 2, size: 3, scaleVar: 0.3, navR: 2.0, yOff: 0, range: 60 },
    { key: 'ancient_treasure', count: 3, size: 2, scaleVar: 0.3, navR: 1.5, yOff: 0, range: 65 },
    { key: 'shs_drone_drill', count: 2, size: 2.5, scaleVar: 0.2, navR: 2.0, yOff: 0, range: 55 },
  ],
  metallic: [
    { key: 'env_wall_basic', count: 3, size: 3, scaleVar: 0.3, navR: 2.0, yOff: 0, range: 55 },
    { key: 'env_pillar_a', count: 3, size: 2.5, scaleVar: 0.3, navR: 1.0, yOff: 0, range: 60 },
    { key: 'shs_barracks', count: 1, size: 5, scaleVar: 0.1, navR: 3.0, yOff: 0, range: 50 },
    { key: 'shs_laser_turret', count: 2, size: 3, scaleVar: 0.2, navR: 2.0, yOff: 0, range: 55 },
    { key: 'shs_power_plant', count: 2, size: 4, scaleVar: 0.1, navR: 3.0, yOff: 0, range: 55 },
  ],
  dark_matter: [
    { key: 'ancient_portal_stairs', count: 1, size: 6, scaleVar: 0.1, navR: 4.0, yOff: 0, range: 45 },
    { key: 'ancient_portal_rings', count: 1, size: 6, scaleVar: 0.1, navR: 3.5, yOff: 2.0, range: 45 },
    { key: 'ancient_relic_alien_statue', count: 2, size: 5, scaleVar: 0.2, navR: 3.0, yOff: 0, range: 60 },
    { key: 'ancient_treasure', count: 3, size: 2, scaleVar: 0.3, navR: 1.5, yOff: 0, range: 60 },
    { key: 'shs_teleporter', count: 2, size: 3, scaleVar: 0.2, navR: 2.5, yOff: 0, range: 55 },
  ],
};

// ── Character / weapon asset paths ────────────────────────────────
const CHARACTER_FBXS = Array.from({ length: 12 }, (_, i) =>
  i === 0 ? '/assets/ground/characters/DungeonCrawler_Character.fbx' : `/assets/ground/characters/DungeonCrawler_Character${i}.fbx`,
);
const CHARACTER_TEXTURE = '/assets/ground/characters/DungeonCrawler_Character.png';

// ── GLTF character models (Ultimate Modular Men pack) ─────────────
const GLTF_BASE = '/assets/ground/characters/gltf';

/** Character class → GLTF model file */
const CHARACTER_GLTF_MAP: Record<string, string> = {
  warrior: `${GLTF_BASE}/Suit.gltf`,
  berserker: `${GLTF_BASE}/Punk.gltf`,
  ranger: `${GLTF_BASE}/Swat.gltf`,
  mage: `${GLTF_BASE}/Worker.gltf`,
  rogue: `${GLTF_BASE}/Punk.gltf`,
  gunslinger: `${GLTF_BASE}/Spacesuit.gltf`,
};

/** Enemy type → GLTF model file */
const ENEMY_GLTF_MAP: Record<string, string> = {
  melee: `${GLTF_BASE}/Punk.gltf`,
  ranged: `${GLTF_BASE}/Swat.gltf`,
  heavy: `${GLTF_BASE}/Suit.gltf`,
  stalker: `${GLTF_BASE}/Worker.gltf`,
  titan: `${GLTF_BASE}/Spacesuit.gltf`,
  boss: `${GLTF_BASE}/Spacesuit.gltf`,
};

/**
 * Maps our internal AnimKey names to the animation clip names embedded
 * inside the Ultimate Modular Men GLTF files.
 * Clips not listed fall back to 'idle' gracefully.
 */
const GLTF_ANIM_MAP: Record<string, string> = {
  idle: 'Idle_Neutral',
  walk: 'Walk',
  run: 'Run',
  strafe: 'Run_Left',
  attack: 'Sword_Slash',
  combo2: 'Punch_Right',
  combo3: 'Punch_Left',
  heavy_attack: 'Kick_Right',
  jump_attack: 'Kick_Left',
  slide_attack: 'Roll',
  block: 'Idle_Sword',
  block_idle: 'Idle_Sword',
  dodge: 'Roll',
  shoot: 'Idle_Gun_Shoot',
  cast: 'Idle_Gun_Pointing',
  kick: 'Kick_Left',
  jump: 'Roll',
  hit: 'HitRecieve',
  death: 'Death',
  injured_idle: 'Idle',
  injured_walk: 'Walk',
  injured_run: 'Run_Back',
};

/**
 * Weapon FBX per weapon type — uses the full weapon pack in public/assets/ground/weapons/
 * Richer assignments: axes for berserker, longbow for ranger, daggers for rogue, etc.
 */
const WEAPON_MAP: Record<string, string> = {
  sword: '/assets/ground/weapons/kaykit/sword_A.fbx',
  spear: '/assets/ground/weapons/kaykit/halberd.fbx', // berserker greatsword-style
  bow: '/assets/ground/weapons/kaykit/bow_A.fbx',
  staff: '/assets/ground/weapons/kaykit/staff_A.fbx',
  rifle: '/assets/ground/weapons/scifi/Rifle.fbx',
  // Fallbacks used directly by old code paths
  Sword: '/assets/ground/weapons/kaykit/sword_A.fbx',
  Bow: '/assets/ground/weapons/kaykit/bow_A.fbx',
  MagicCane: '/assets/ground/weapons/kaykit/staff_A.fbx',
  Spear: '/assets/ground/weapons/kaykit/spear_A.fbx',
};

/** Class → specific weapon override */
const CLASS_WEAPON_MAP: Record<string, string> = {
  warrior: '/assets/ground/weapons/kaykit/sword_A.fbx',
  berserker: '/assets/ground/weapons/kaykit/axe_B.fbx',
  ranger: '/assets/ground/weapons/kaykit/bow_B_withString.fbx',
  mage: '/assets/ground/weapons/kaykit/staff_A.fbx',
  rogue: '/assets/ground/weapons/kaykit/dagger_A.fbx',
  gunslinger: '/assets/ground/weapons/scifi/Rifle.fbx',
};

// ── Camera constants ───────────────────────────────────────────────
const CAM_DISTANCE = 8;
const CAM_HEIGHT = 4;
const CAM_SHOULDER = 1.2;
const CAM_LERP = 6;
const MOUSE_SENSITIVITY = 0.003;
const FREE_CAM_SPEED = 18;
const FREE_CAM_FAST = 50; // shift-held speed

/** Nav mesh blocked zone — characters cannot occupy these radii. */
interface BlockedZone {
  x: number;
  z: number;
  radius: number;
}

export class GroundRenderer {
  // ── Three.js core ─────────────────────────────────────────────
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private container: HTMLElement;
  private disposed = false;
  private animFrame = 0;

  // ── Game state ─────────────────────────────────────────────
  public state: GroundCombatState;
  private input: GroundInput = {
    forward: false,
    back: false,
    left: false,
    right: false,
    sprint: false,
    dodge: false,
    attack: false,
    heavyAttack: false,
    block: false,
    lockOn: false,
    cameraYaw: 0,
  };

  // ── Post-processing (pmndrs/postprocessing — single EffectComposer) ──
  private composer!: EffectComposer;

  // ── Camera ───────────────────────────────────────────────
  private cameraYaw = 0;
  private cameraPitch = 0.3;
  private pointerLocked = false;
  private mouseHeld = false;
  private mouseHeldTime = 0;
  /** P key toggles between gameplay follow-cam and free editor fly-cam. */
  private cameraMode: 'follow' | 'free' = 'follow';
  private freeCamPos = new THREE.Vector3(0, 20, -20);
  private freeCamYaw = 0;
  private freeCamPitch = -0.4;
  private freeCamRMB = false; // right-mouse held in free mode
  private freeCamOverlay: HTMLDivElement | null = null;

  // ── Camera feel ────────────────────────────────────────────
  /** Current camera shake magnitude (decrements to 0). */
  private cameraShake = 0;
  /** Target FOV — lerped toward each frame (sprint pulse). */
  private targetFov = 55;
  /** Tracks last player HP so we can detect hits for camera shake. */
  private lastPlayerHp = -1;

  // ── Projectile visuals ────────────────────────────────────
  private projectilePool: Array<{
    mesh: THREE.Mesh;
    vel: THREE.Vector3;
    life: number;
    maxLife: number;
  }> = [];

  // ── Nav mesh ───────────────────────────────────────────────
  /** Blocked navigation zones from solid terrain props. */
  private blockedZones: BlockedZone[] = [];
  /** Terrain height at world-space (x,z). Used to keep characters on the surface. */
  private heightData: Float32Array = new Float32Array(0);
  private heightRes = 0; // grid resolution (vertices per side)

  // (composer declared above — no duplicate)

  // ── Model cache ───────────────────────────────────────────
  private fbxLoader = new FBXLoader();
  private gltfLoader = new GLTFLoader();
  private textureLoader = new THREE.TextureLoader();
  private modelCache = new Map<string, THREE.Group>();
  private loadingModels = new Map<string, Promise<THREE.Group>>();
  private charTexture: THREE.Texture | null = null;
  /** GLTF cache: path → { canonical scene, embedded animation clips } */
  private gltfCache = new Map<string, { scene: THREE.Group; animations: THREE.AnimationClip[] }>();

  // ── Scene objects ─────────────────────────────────────────────
  private playerGroup: THREE.Group | null = null;
  private playerWeapon: THREE.Group | null = null;
  private enemyGroups = new Map<number, THREE.Group>();
  private enemyWeapons = new Map<number, THREE.Group>();
  private enemyHealthBars = new Map<number, { bar: THREE.Mesh; bg: THREE.Mesh }>();
  private damageSprites: THREE.Sprite[] = [];
  private terrainObjects: THREE.Object3D[] = [];
  private lockOnIndicator: THREE.Mesh | null = null;
  private groundPlane!: THREE.Mesh;

  // ── Animation controllers ─────────────────────────────────────
  private playerAnim: AnimationController | null = null;
  private enemyAnims = new Map<number, AnimationController>();
  private objLoader = new OBJLoader();
  private mtlLoader = new MTLLoader();
  private prefabCache = new Map<string, THREE.Group>();

  // ── Callbacks ─────────────────────────────────────────────────
  public onResult?: (result: 'win' | 'lose') => void;

  constructor(container: HTMLElement, planetType: PlanetType, characterClass: CharacterClass = 'warrior') {
    this.container = container;
    this.state = createInitialState(planetType, characterClass);
  }

  // ── Init ──────────────────────────────────────────────────────
  async init(): Promise<void> {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping; // postprocessing handles tone mapping
    this.container.appendChild(this.renderer.domElement);

    // Camera
    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 500);
    this.camera.position.set(0, CAM_HEIGHT, -CAM_DISTANCE);
    this.targetFov = 55;

    // Scene
    this.scene = new THREE.Scene();
    const palette = TERRAIN_PALETTE[this.state.planetType];
    this.scene.fog = new THREE.FogExp2(palette.fog, 0.018);
    this.scene.background = new THREE.Color(palette.sky);

    // Lights
    const ambient = new THREE.AmbientLight(palette.ambient, 0.6);
    this.scene.add(ambient);
    const sun = new THREE.DirectionalLight(palette.sun, 1.2);
    sun.position.set(20, 30, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 100;
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    this.scene.add(sun);
    const hemi = new THREE.HemisphereLight(0x88aacc, palette.ground, 0.3);
    this.scene.add(hemi);

    // ── Post-processing: pmndrs/postprocessing (single-pass pipeline) ────
    // Uses HalfFloat for HDR → tone-map → bloom → SMAA in ONE merged pass.
    // Per glTF 2.0 spec (p4): PBR materials use Metallic-Roughness model;
    // bloom threshold should be set above base emissiveFactor so only
    // intentional emissiveTexture surfaces glow (weapons, hit sparks, eyes).
    this.composer = new EffectComposer(this.renderer, {
      frameBufferType: THREE.HalfFloatType,
    });
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(
      new EffectPass(
        this.camera,
        new BloomEffect({
          intensity: 0.55,
          luminanceThreshold: 0.35,
          luminanceSmoothing: 0.4,
          mipmapBlur: true,
        }),
        new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }),
        new SMAAEffect({ preset: SMAAPreset.MEDIUM }),
      ),
    );

    // Heightmap terrain — high-res subdivided plane with per-vertex displacement
    this.buildTerrain(palette);
    // Load GLTF terrain environment if planet type has one
    this.loadTerrainEnvironment();
    // Postprocessing pipeline (Bloom + ToneMapping + SMAA)
    this.setupPostProcessing();
    // Free-camera overlay badge (hidden until P pressed)
    this.buildFreeCamOverlay();

    // Lock-on indicator ring
    const ringGeo = new THREE.RingGeometry(1.2, 1.4, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff4444, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    this.lockOnIndicator = new THREE.Mesh(ringGeo, ringMat);
    this.lockOnIndicator.rotation.x = -Math.PI / 2;
    this.lockOnIndicator.visible = false;
    this.scene.add(this.lockOnIndicator);

    // Load character texture
    this.charTexture = await this.textureLoader.loadAsync(CHARACTER_TEXTURE).catch(() => null);
    if (this.charTexture) {
      this.charTexture.colorSpace = THREE.SRGBColorSpace;
      this.charTexture.magFilter = THREE.NearestFilter;
      this.charTexture.minFilter = THREE.NearestFilter;
    }

    // Load player model
    await this.loadPlayerModel();

    // Load crash site terrain prop
    this.loadCrashSite();

    // Load biome-specific 3D asset dressing (portals, relics, buildings, etc.)
    this.loadBiomeDressing();

    // Spawn some enemies for initial encounter
    this.spawnInitialEnemies();

    // Preload ObjectStore VFX + model + unit manifests in parallel. All
    // spawns degrade gracefully if a manifest is still in-flight.
    void ObjectStoreVfx.preload();
    void ObjectStoreModels.preload().then(() => this.spawnObjectStoreScenery());
    void ObjectStoreUnits.preload();

    // Bind input
    this.bindInputEvents();

    // Resize handler
    window.addEventListener('resize', this.onResize);

    // Start render loop
    this.animate();
  }

  // ── Heightmap terrain (replaces flat plane) ───────────────────────

  /** Deterministic hash for planet seed (no real randomness — same map every game). */
  private planetSeed(pt: PlanetType): number {
    const seeds: Record<PlanetType, number> = {
      volcanic: 1.3,
      oceanic: 2.7,
      barren: 0.8,
      crystalline: 4.1,
      gas_giant: 3.5,
      frozen: 5.2,
      plasma: 6.9,
      fungal: 2.1,
      metallic: 7.4,
      dark_matter: 8.8,
    };
    return seeds[pt] ?? 1.0;
  }

  /** Sample terrain height at (worldX, worldZ) using the stored heightmap. */
  sampleHeight(wx: number, wz: number): number {
    if (this.heightRes === 0) return 0;
    const res = this.heightRes;
    const nx = Math.max(0, Math.min(res - 1, Math.round((wx / 200 + 0.5) * (res - 1))));
    const nz = Math.max(0, Math.min(res - 1, Math.round((wz / 200 + 0.5) * (res - 1))));
    return this.heightData[nz * res + nx] ?? 0;
  }

  /**
   * Build the heightmap-displaced ground plane, tiling texture, and planet-specific props.
   * Heights use layered sine/cosine waves per-planet with a flat safe-spawn circle (r≤10).
   */
  private buildTerrain(palette: { ground: number; accent: number; fog: number }): void {
    const RES = 80; // vertices per side — good detail without excess tris
    const SIZE = 200;
    const seed = this.planetSeed(this.state.planetType);

    // ── Height profile per planet type ───────────────────────────
    type HeightProfile = { amp: number; freq1: number; freq2: number; freq3: number; ridges: boolean };
    const profiles: Record<PlanetType, HeightProfile> = {
      volcanic: { amp: 6, freq1: 0.04, freq2: 0.08, freq3: 0.22, ridges: true },
      oceanic: { amp: 1.2, freq1: 0.02, freq2: 0.05, freq3: 0.12, ridges: false },
      barren: { amp: 2.5, freq1: 0.03, freq2: 0.06, freq3: 0.15, ridges: false },
      crystalline: { amp: 5, freq1: 0.05, freq2: 0.12, freq3: 0.3, ridges: true },
      gas_giant: { amp: 1.5, freq1: 0.02, freq2: 0.04, freq3: 0.1, ridges: false },
      frozen: { amp: 3, freq1: 0.03, freq2: 0.07, freq3: 0.18, ridges: false },
      plasma: { amp: 4, freq1: 0.05, freq2: 0.1, freq3: 0.25, ridges: true },
      fungal: { amp: 2, freq1: 0.03, freq2: 0.06, freq3: 0.16, ridges: false },
      metallic: { amp: 3.5, freq1: 0.04, freq2: 0.09, freq3: 0.22, ridges: true },
      dark_matter: { amp: 7, freq1: 0.06, freq2: 0.13, freq3: 0.32, ridges: true },
    };
    const prof = profiles[this.state.planetType];

    // ── Generate heightmap ──────────────────────────────────
    this.heightRes = RES;
    this.heightData = new Float32Array(RES * RES);
    for (let zi = 0; zi < RES; zi++) {
      for (let xi = 0; xi < RES; xi++) {
        const wx = (xi / (RES - 1) - 0.5) * SIZE;
        const wz = (zi / (RES - 1) - 0.5) * SIZE;
        const dist = Math.sqrt(wx * wx + wz * wz);
        // Spawn area (r<12) stays flat for gameplay
        if (dist < 12) {
          this.heightData[zi * RES + xi] = 0;
          continue;
        }
        // Layered waves
        let h = Math.sin((wx + seed * 10) * prof.freq1) * Math.cos((wz + seed * 5) * prof.freq1);
        h += 0.5 * Math.sin((wx + seed * 3) * prof.freq2) * Math.cos((wz - seed * 4) * prof.freq2);
        h += 0.25 * Math.sin(wx * prof.freq3 + seed) * Math.cos(wz * prof.freq3 - seed * 2);
        if (prof.ridges) h = Math.abs(h) * 1.8 - 0.4; // sharper ridges
        // Smooth blend from flat spawn to terrain (12–18 unit transition)
        const blend = Math.min(1, (dist - 12) / 6);
        this.heightData[zi * RES + xi] = h * prof.amp * blend;
      }
    }

    // ── Build geometry ────────────────────────────────────
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, RES - 1, RES - 1);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const xi = i % RES;
      const zi = Math.floor(i / RES);
      pos.setY(i, this.heightData[zi * RES + xi]);
    }
    geo.computeVertexNormals();

    // ── Procedural tiling terrain texture ────────────────────
    const tex = this.buildTerrainTexture(palette);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(16, 16); // tile 16× across 200-unit ground
    tex.colorSpace = THREE.SRGBColorSpace;

    const groundMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.92,
      metalness: 0.04,
    });
    this.groundPlane = new THREE.Mesh(geo, groundMat);
    this.groundPlane.receiveShadow = true;
    this.scene.add(this.groundPlane);

    // ── Planet-specific props ──────────────────────────────
    this.generateProps(palette);
  }

  /**
   * Build a 256×256 canvas texture with noise/grain appropriate for the planet.
   * Tiled 16× over the ground so it looks like a real surface material.
   */
  private buildTerrainTexture(palette: { ground: number; accent: number }): THREE.CanvasTexture {
    const SZ = 256;
    const cvs = document.createElement('canvas');
    cvs.width = cvs.height = SZ;
    const ctx = cvs.getContext('2d')!;

    // Base fill
    const r = (palette.ground >> 16) & 0xff;
    const g = (palette.ground >> 8) & 0xff;
    const b = palette.ground & 0xff;
    const ar = (palette.accent >> 16) & 0xff;
    const ag = (palette.accent >> 8) & 0xff;
    const ab = palette.accent & 0xff;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, SZ, SZ);

    // Random grain noise — gives rocky/sandy look without a real texture file
    for (let y = 0; y < SZ; y++) {
      for (let x = 0; x < SZ; x++) {
        const n = (Math.random() - 0.5) * 28;
        const tr = Math.min(255, Math.max(0, r + n));
        const tg = Math.min(255, Math.max(0, g + n * 0.8));
        const tb = Math.min(255, Math.max(0, b + n * 0.6));
        ctx.fillStyle = `rgb(${tr | 0},${tg | 0},${tb | 0})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Accent streaks (cracks, veins, ice lines)
    ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.15)`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * SZ, Math.random() * SZ);
      ctx.lineTo(Math.random() * SZ, Math.random() * SZ);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(cvs);
  }

  /**
   * Planet-specific themed props: trees, crystal spires, mushrooms, ice shards, etc.
   * Each solid prop registers a BlockedZone for nav-mesh collision.
   */
  private generateProps(palette: { ground: number; accent: number }): void {
    const pt = this.state.planetType;
    const baseMat = new THREE.MeshStandardMaterial({ color: palette.ground, roughness: 0.9, metalness: 0.05 });
    const accentMat = new THREE.MeshStandardMaterial({
      color: palette.accent,
      roughness: 0.6,
      metalness: 0.2,
      emissive: palette.accent,
      emissiveIntensity: 0.07,
    });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95, metalness: 0.1 });

    // ── Spawn helper ──────────────────────────────────────────
    const addProp = (mesh: THREE.Mesh | THREE.Group, x: number, z: number, navR: number) => {
      const y = this.sampleHeight(x, z);
      if (mesh instanceof THREE.Mesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      } else {
        mesh.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            (c as THREE.Mesh).castShadow = true;
            (c as THREE.Mesh).receiveShadow = true;
          }
        });
      }
      mesh.position.set(x, y, z);
      this.scene.add(mesh);
      this.terrainObjects.push(mesh);
      if (navR > 0) this.blockedZones.push({ x, z, radius: navR });
    };

    // Ensures we don’t place props in the player spawn zone
    const safePos = (range = 80): [number, number] => {
      let px: number, pz: number;
      do {
        px = (Math.random() - 0.5) * range;
        pz = (Math.random() - 0.5) * range;
      } while (Math.sqrt(px * px + pz * pz) < 14);
      return [px, pz];
    };

    // ── Shared background mountains (all planet types) ──────────────
    for (let i = 0; i < 6; i++) {
      const [mx, mz] = safePos(180);
      if (Math.sqrt(mx * mx + mz * mz) < 50) continue; // far-field only
      const mh = 8 + Math.random() * 16;
      const mr = 4 + Math.random() * 8;
      const mGeo = new THREE.ConeGeometry(mr, mh, 7 + Math.floor(Math.random() * 4));
      const mountain = new THREE.Mesh(mGeo, baseMat);
      mountain.position.set(mx, this.sampleHeight(mx, mz), mz);
      mountain.castShadow = true;
      this.scene.add(mountain);
      this.terrainObjects.push(mountain);
      // Mountains are background decoration — nav zone covers their base only
      this.blockedZones.push({ x: mx, z: mz, radius: mr * 0.6 });
    }

    // ── Planet-specific foreground props ───────────────────────
    if (pt === 'volcanic') {
      // Lava rock pillars + obsidian shards
      for (let i = 0; i < 18; i++) {
        const [x, z] = safePos(70);
        const h = 1.5 + Math.random() * 4;
        const r = 0.4 + Math.random() * 0.8;
        const g = new THREE.Group();
        g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.4, r, h, 6), darkMat), { castShadow: true }));
        g.add(
          Object.assign(new THREE.Mesh(new THREE.ConeGeometry(r * 0.5, h * 0.4, 5), accentMat), {
            castShadow: true,
            position: { x: 0, y: h * 0.5, z: 0 },
          }),
        );
        (g.children[1] as THREE.Mesh).position.y = h * 0.5;
        addProp(g, x, z, r + 0.3);
      }
      // Lava pools (decal-like flat discs with emissive glow)
      for (let i = 0; i < 8; i++) {
        const [x, z] = safePos(60);
        const r = 1.5 + Math.random() * 3;
        const m = new THREE.Mesh(
          new THREE.CircleGeometry(r, 16),
          new THREE.MeshStandardMaterial({
            color: 0xff3300,
            emissive: 0xff3300,
            emissiveIntensity: 0.6,
            roughness: 0.3,
            transparent: true,
            opacity: 0.85,
          }),
        );
        m.rotation.x = -Math.PI / 2;
        m.position.set(x, this.sampleHeight(x, z) + 0.05, z);
        this.scene.add(m);
        // Lava pools are navigable (players walk around them — damage is separate)
      }
    } else if (pt === 'oceanic') {
      // Coral towers + rock islands
      for (let i = 0; i < 22; i++) {
        const [x, z] = safePos(70);
        const segs = 5 + Math.floor(Math.random() * 4);
        const h = 2 + Math.random() * 6;
        const r = 0.2 + Math.random() * 0.6;
        const geo = new THREE.CylinderGeometry(r * 0.3, r, h, segs);
        const m = new THREE.Mesh(geo, Math.random() < 0.5 ? accentMat : baseMat);
        m.rotation.z = (Math.random() - 0.5) * 0.4;
        addProp(m, x, z, r);
      }
      // Kelp/seaweed — thin tall cylinders
      for (let i = 0; i < 30; i++) {
        const [x, z] = safePos(80);
        const h = 3 + Math.random() * 5;
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, h, 5), accentMat);
        m.rotation.x = (Math.random() - 0.5) * 0.3;
        addProp(m, x, z, 0); // thin — no nav block
      }
    } else if (pt === 'frozen') {
      // Ice crystal spires — hexagonal prisms tilted at angles
      for (let i = 0; i < 25; i++) {
        const [x, z] = safePos(70);
        const h = 2 + Math.random() * 7;
        const r = 0.3 + Math.random() * 0.7;
        const geo = new THREE.CylinderGeometry(r * 0.25, r * 0.6, h, 6);
        const m = new THREE.Mesh(
          geo,
          new THREE.MeshStandardMaterial({
            color: 0xaaddff,
            roughness: 0.1,
            metalness: 0.4,
            transparent: true,
            opacity: 0.8,
            emissive: 0x224466,
            emissiveIntensity: 0.15,
          }),
        );
        m.rotation.z = (Math.random() - 0.5) * 0.6;
        addProp(m, x, z, r * 0.7);
      }
      // Snow mounds — low hemispheres
      for (let i = 0; i < 15; i++) {
        const [x, z] = safePos(80);
        const r = 1 + Math.random() * 2.5;
        const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.4), baseMat);
        addProp(m, x, z, r * 0.8);
      }
    } else if (pt === 'fungal') {
      // Mushrooms — cylinder stalk + flattened sphere cap
      for (let i = 0; i < 28; i++) {
        const [x, z] = safePos(70);
        const h = 1.5 + Math.random() * 5;
        const cr = 1.0 + Math.random() * 2.5;
        const g = new THREE.Group();
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, h, 7), baseMat));
        const cap = new THREE.Mesh(new THREE.SphereGeometry(cr, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), accentMat);
        cap.position.y = h * 0.55;
        cap.scale.y = 0.45;
        g.add(cap);
        addProp(g, x, z, cr * 0.7);
      }
    } else if (pt === 'crystalline') {
      // Crystal formations — clusters of pointed prisms
      for (let i = 0; i < 20; i++) {
        const [x, z] = safePos(70);
        const g = new THREE.Group();
        const clusterR = 1 + Math.random() * 2;
        const count = 3 + Math.floor(Math.random() * 4);
        for (let ci = 0; ci < count; ci++) {
          const angle = (ci / count) * Math.PI * 2;
          const dist = clusterR * 0.5 * Math.random();
          const h = 1.5 + Math.random() * 4;
          const r = 0.15 + Math.random() * 0.35;
          const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5), accentMat);
          c.position.set(Math.cos(angle) * dist, h / 2, Math.sin(angle) * dist);
          c.rotation.z = (Math.random() - 0.5) * 0.5;
          c.castShadow = true;
          g.add(c);
        }
        addProp(g, x, z, clusterR * 0.8);
      }
    } else if (pt === 'barren') {
      // Sandstone arch-like formations and wind-eroded pillars
      for (let i = 0; i < 18; i++) {
        const [x, z] = safePos(70);
        const h = 1 + Math.random() * 3.5;
        const r = 0.5 + Math.random() * 1.2;
        const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r, h, 5 + Math.floor(Math.random() * 3)), baseMat);
        m.rotation.y = Math.random() * Math.PI;
        addProp(m, x, z, r);
      }
      // Dead tree stumps (thin, very tall)
      for (let i = 0; i < 12; i++) {
        const [x, z] = safePos(75);
        const h = 3 + Math.random() * 5;
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, h, 6), darkMat);
        addProp(m, x, z, 0.4);
      }
    } else if (pt === 'metallic') {
      // Industrial struts and broken machinery chunks
      for (let i = 0; i < 20; i++) {
        const [x, z] = safePos(70);
        const h = 0.8 + Math.random() * 4;
        const w = 0.4 + Math.random() * 1.5;
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * 0.8), accentMat);
        m.rotation.y = Math.random() * Math.PI;
        addProp(m, x, z, w * 0.6);
      }
      // Tall antenna spires
      for (let i = 0; i < 8; i++) {
        const [x, z] = safePos(75);
        const h = 5 + Math.random() * 12;
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.25, h, 4), darkMat);
        addProp(m, x, z, 0.4);
      }
    } else if (pt === 'dark_matter' || pt === 'plasma') {
      // Floating shards (elevated via sampleHeight + extra offset)
      for (let i = 0; i < 22; i++) {
        const [x, z] = safePos(70);
        const h = 2 + Math.random() * 5;
        const w = 0.3 + Math.random() * 1;
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, w * 0.7),
          new THREE.MeshStandardMaterial({
            color: palette.accent,
            roughness: 0.3,
            metalness: 0.6,
            emissive: palette.accent,
            emissiveIntensity: 0.2,
          }),
        );
        m.rotation.set(Math.random() * 0.6, Math.random() * Math.PI, Math.random() * 0.6);
        addProp(m, x, z, w * 0.8);
      }
    } else {
      // gas_giant fallback — low rolling dunes (rounded boxes)
      for (let i = 0; i < 16; i++) {
        const [x, z] = safePos(70);
        const w = 2 + Math.random() * 4;
        const h = 0.4 + Math.random() * 1;
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * 0.7), baseMat);
        m.rotation.y = Math.random() * Math.PI;
        addProp(m, x, z, 0);
      }
    }
  }

  /** Create a floating DOM badge shown only in free-camera mode. */
  private buildFreeCamOverlay(): void {
    const div = document.createElement('div');
    Object.assign(div.style, {
      position: 'absolute',
      top: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '5px 16px',
      borderRadius: '6px',
      background: 'rgba(0,0,0,0.75)',
      border: '1px solid #ffcc44',
      color: '#ffcc44',
      fontFamily: "'Segoe UI', monospace",
      fontSize: '11px',
      letterSpacing: '2px',
      fontWeight: '700',
      pointerEvents: 'none',
      display: 'none',
      zIndex: '999',
    });
    div.textContent = 'CAMERA: FREE   WASD=fly  RMB=orbit  P=play';
    this.container.style.position = 'relative';
    this.container.appendChild(div);
    this.freeCamOverlay = div;
  }

  // ── Model loading ─────────────────────────────────────────────
  private async loadFBX(path: string): Promise<THREE.Group> {
    const cached = this.modelCache.get(path);
    if (cached) return cached.clone();

    const pending = this.loadingModels.get(path);
    if (pending) {
      const g = await pending;
      return g.clone();
    }

    const url = resolvePathUrl(path);
    const promise = this.fbxLoader.loadAsync(url).then((fbx) => {
      // Normalize scale to a standard 2-unit height
      const box = new THREE.Box3().setFromObject(fbx);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) fbx.scale.setScalar(2.0 / maxDim);

      // Enable shadows on all meshes; leave materials untouched here —
      // callers apply their own material (color tint or metallic weapon).
      fbx.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).castShadow = true;
          (child as THREE.Mesh).receiveShadow = true;
        }
      });

      this.modelCache.set(path, fbx);
      return fbx;
    });

    this.loadingModels.set(path, promise);
    const g = await promise;
    this.loadingModels.delete(path);
    return g.clone();
  }

  /**
   * Load a GLTF character model and return a properly-cloned instance
   * alongside the embedded animation clips. Uses SkeletonUtils.clone()
   * to preserve the skinned-mesh bone hierarchy across clones.
   */
  private async loadGLTF(path: string): Promise<{ group: THREE.Group; animations: THREE.AnimationClip[] }> {
    const cached = this.gltfCache.get(path);
    if (cached) {
      const cloned = SkeletonUtils.clone(cached.scene) as THREE.Group;
      return { group: cloned, animations: cached.animations };
    }

    const url = resolvePathUrl(path);
    const gltf = await this.gltfLoader.loadAsync(url);
    const scene = gltf.scene as THREE.Group;

    // Normalize to exactly 2 metres tall (Y axis = character height).
    // Using size.y specifically guarantees 2m regardless of model width/depth.
    // If the GLTF is stored sideways (size.y ≈ 0), fall back to maxDim.
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const heightDim = size.y > 0.1 ? size.y : Math.max(size.x, size.y, size.z);
    if (heightDim > 0) scene.scale.setScalar(2.0 / heightDim);

    // Enable shadows; materials are assigned by callers
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });

    this.gltfCache.set(path, { scene, animations: gltf.animations });
    const cloned = SkeletonUtils.clone(scene) as THREE.Group;
    return { group: cloned, animations: gltf.animations };
  }

  private createPlaceholder(color: number, height: number = 2): THREE.Group {
    const group = new THREE.Group();
    const bodyGeo = new THREE.CapsuleGeometry(0.4, height - 0.8, 4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = height / 2;
    body.castShadow = true;
    group.add(body);
    // Head
    const headGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = height;
    head.castShadow = true;
    group.add(head);
    return group;
  }

  /** Apply a solid class-coloured MeshStandard material to every mesh in a group. */
  private applyCharacterMaterial(group: THREE.Group, color: number, emissiveBoost = 0.12): void {
    const col = new THREE.Color(color);
    // Derive a darker secondary colour for visual variety (pants/boots zones)
    const colDark = col.clone().multiplyScalar(0.55);
    let meshIdx = 0;
    group.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      // Alternate between primary and secondary colour for simple banding
      const useSecondary = meshIdx % 3 === 2;
      mesh.material = new THREE.MeshStandardMaterial({
        color: useSecondary ? colDark : col,
        emissive: col.clone().multiplyScalar(emissiveBoost),
        emissiveIntensity: 0.6,
        roughness: 0.55,
        metalness: 0.25,
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      meshIdx++;
    });
  }

  /** Apply a metallic silver-gold material to every mesh (used for weapons). */
  private applyWeaponMaterial(group: THREE.Group): void {
    group.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
        color: 0xccccaa,
        emissive: 0x443300,
        emissiveIntensity: 0.3,
        roughness: 0.25,
        metalness: 0.85,
      });
      (child as THREE.Mesh).castShadow = true;
    });
  }

  private async loadPlayerModel(): Promise<void> {
    const cls = this.state.player.characterClass;
    const cfg = CHARACTER_ROSTER[cls];
    const tintHex = cfg?.color ?? 0x4488ff;
    const gltfPath = CHARACTER_GLTF_MAP[cls] ?? `${GLTF_BASE}/Suit.gltf`;

    try {
      const { group, animations } = await this.loadGLTF(gltfPath);
      this.applyCharacterMaterial(group, tintHex);
      this.playerGroup = group;
      this.scene.add(group);

      // Wire embedded GLTF animations via registerClip (no FBX loading needed)
      this.playerAnim = new AnimationController(group);
      for (const [animKey, gltfName] of Object.entries(GLTF_ANIM_MAP)) {
        const clip = animations.find((a) => a.name === gltfName);
        if (clip) this.playerAnim.registerClip(animKey, clip);
      }
      this.playerAnim.play('idle');
    } catch {
      this.playerGroup = this.createPlaceholder(tintHex);
      this.scene.add(this.playerGroup);
      this.playerAnim = new AnimationController(this.playerGroup);
    }

    // Load weapon — class-specific first, then generic weapon type fallback
    const weaponPath = CLASS_WEAPON_MAP[this.state.player.characterClass] ?? WEAPON_MAP[this.state.player.weaponType] ?? WEAPON_MAP.sword;
    try {
      const weapon = await this.loadWeaponFBX(weaponPath, this.playerGroup!);
      this.applyWeaponMaterial(weapon);
      this.playerWeapon = weapon;
      this.playerGroup!.add(weapon);
    } catch {
      // No weapon visual — OK
    }
  }

  /**
   * Load a weapon FBX and size it to a literal target length in metres.
   * Robust to any source-FBX unit convention AND any parent character
   * scale: we measure the raw FBX bbox once, divide by the parent's world
   * scale, and scale the weapon so its longest axis renders at exactly
   * `targetMeters` in world space. Source of truth: `weapon-scales.ts`.
   */
  private async loadWeaponFBX(path: string, parent: THREE.Object3D): Promise<THREE.Group> {
    // Bypass loadFBX (which auto-normalises to 2 m max-dim, wrong for weapons).
    const url = resolvePathUrl(path);
    const fbx = await this.fbxLoader.loadAsync(url);
    fbx.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });

    const x = lookupWeaponXform(path);

    // Measure the raw FBX in its own (untransformed) local space.
    const box = new THREE.Box3().setFromObject(fbx);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Compensate for the parent character group's world scale, so the weapon
    // ends up exactly targetMeters long regardless of character unit choices.
    parent.updateWorldMatrix(true, false);
    const parentScale = new THREE.Vector3();
    parent.getWorldScale(parentScale);
    const ps = (Math.abs(parentScale.x) + Math.abs(parentScale.y) + Math.abs(parentScale.z)) / 3 || 1;

    const local = maxDim > 0.0001 ? x.targetMeters / (maxDim * ps) : 1;
    fbx.scale.setScalar(local);

    fbx.position.set(x.position[0], x.position[1], x.position[2]);
    if (x.rotationDeg) {
      fbx.rotation.set((x.rotationDeg[0] * Math.PI) / 180, (x.rotationDeg[1] * Math.PI) / 180, (x.rotationDeg[2] * Math.PI) / 180);
    }
    return fbx;
  }

  /** Load animation clips for a weapon type into a controller. */
  private async loadAnimSet(ctrl: AnimationController, weaponType: string): Promise<void> {
    const set = ANIM_SETS[weaponType] ?? ANIM_SETS.sword;
    // Load every key that has a resolved path (weapon-specific or common fallback)
    const allKeys: AnimKey[] = [
      'idle',
      'walk',
      'run',
      'strafe',
      'attack',
      'combo2',
      'combo3',
      'heavy_attack',
      'jump_attack',
      'slide_attack',
      'block',
      'block_idle',
      'dodge',
      'shoot',
      'cast',
      'kick',
      'jump',
      'hit',
      'death',
    ];
    const promises: Promise<void>[] = [];
    for (const key of allKeys) {
      const path = set[key] ?? COMMON_ANIMS[key];
      if (path) promises.push(ctrl.loadClip(key, path));
    }
    // Load injured overrides under their own keys
    for (const [key, path] of Object.entries(INJURED_ANIMS)) {
      if (path) promises.push(ctrl.loadClip(key, path)); // key is already 'injured_idle' etc.
    }
    await Promise.allSettled(promises);
    ctrl.play('idle');
  }

  /** Load the Ancient Crash Site OBJ as a terrain landmark. */
  private async loadCrashSite(): Promise<void> {
    try {
      const mtl = await this.mtlLoader.loadAsync(resolvePathUrl('/assets/ground/terrain/AncientCrashSite.mtl'));
      mtl.preload();
      this.objLoader.setMaterials(mtl);
      const obj = await this.objLoader.loadAsync(resolvePathUrl('/assets/ground/terrain/AncientCrashSite.obj'));
      // Scale and place as a landmark
      obj.scale.setScalar(0.02);
      obj.position.set(25, 0, 25);
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).castShadow = true;
          (child as THREE.Mesh).receiveShadow = true;
        }
      });
      this.scene.add(obj);
      this.terrainObjects.push(obj);
    } catch {
      // Crash site not available — skip
    }
  }

  // ── Universal prefab model loader (GLB-primary) ────────────────
  /**
   * Load any SpacePrefab model with auto-normalization to `targetSize` meters.
   * Results are cached by modelPath — subsequent loads of the same model clone.
   *
   * Post-migration: all models are GLB; uses the central loadPrefabGLB which
   * handles DRACO decoding, PBR enhancement, and caching.
   * Legacy OBJ/FBX paths kept for backward compatibility during migration.
   */
  private async loadPrefabModel(prefab: SpacePrefab, targetSize = 3.0): Promise<THREE.Group> {
    const cacheKey = prefab.modelPath;
    const cached = this.prefabCache.get(cacheKey);
    if (cached) return cached.clone();

    let group: THREE.Group;

    if (prefab.format === 'glb' || prefab.format === 'gltf') {
      // ── Primary GLB path (post-migration) ─────────────────────
      const result = await loadPrefabGLB(prefab.modelPath, targetSize);
      group = result.scene;
    } else if (prefab.format === 'fbx') {
      // ── Legacy FBX path (pre-migration) ───────────────────────
      const url = resolvePathUrl(prefab.modelPath);
      group = await this.fbxLoader.loadAsync(url);
      const box = new THREE.Box3().setFromObject(group);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0.001) group.scale.multiplyScalar(targetSize / maxDim);
    } else {
      // ── Legacy OBJ path (pre-migration) ───────────────────────
      const url = resolvePathUrl(prefab.modelPath);
      const loader = new OBJLoader();
      if (prefab.mtlPath) {
        try {
          const mtl = await this.mtlLoader.loadAsync(resolvePathUrl(prefab.mtlPath));
          mtl.preload();
          loader.setMaterials(mtl);
        } catch {
          /* proceed without materials */
        }
      }
      group = await loader.loadAsync(url);
      if (prefab.texturePath) {
        try {
          const tex = await this.textureLoader.loadAsync(resolvePathUrl(prefab.texturePath));
          tex.colorSpace = THREE.SRGBColorSpace;
          group.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) {
              const mesh = c as THREE.Mesh;
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (!mat?.map) {
                mesh.material = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, metalness: 0.2 });
              }
            }
          });
        } catch {
          /* no texture — proceed */
        }
      }
      const box = new THREE.Box3().setFromObject(group);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0.001) group.scale.multiplyScalar(targetSize / maxDim);
    }

    this.prefabCache.set(cacheKey, group);
    return group.clone();
  }

  // ── Biome dressing loader ──────────────────────────────────────
  /**
   * Loads and places unique 3D props per planet type from BIOME_DRESSING config.
   * Runs async fire-and-forget — props appear progressively as models load.
   * Each unique model is cached; clones are cheap.
   */
  private async loadBiomeDressing(): Promise<void> {
    const entries = BIOME_DRESSING[this.state.planetType];
    if (!entries?.length) return;

    for (const entry of entries) {
      const prefab = getShipPrefab(entry.key);
      if (!prefab) continue;

      for (let i = 0; i < entry.count; i++) {
        try {
          const model = await this.loadPrefabModel(prefab, entry.size);

          // Variance: random scale multiplier within ±scaleVar
          const varMult = 1 + (Math.random() * 2 - 1) * entry.scaleVar;
          model.scale.multiplyScalar(varMult);

          // Position: safe random location outside the spawn zone
          const [px, pz] = this.safeDressingPos(entry.range);
          const py = this.sampleHeight(px, pz) + entry.yOff;
          model.position.set(px, py, pz);

          // Random Y rotation for visual variety
          model.rotation.y = Math.random() * Math.PI * 2;

          // Enable shadows on every mesh
          model.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) {
              (c as THREE.Mesh).castShadow = true;
              (c as THREE.Mesh).receiveShadow = true;
            }
          });

          this.scene.add(model);
          this.terrainObjects.push(model);
          if (entry.navR > 0) {
            this.blockedZones.push({ x: px, z: pz, radius: entry.navR });
          }
        } catch {
          // Model load failed — skip this instance
        }
      }
    }
  }

  /** Generate a random position for biome dressing (avoids the 16m spawn area). */
  private safeDressingPos(range: number): [number, number] {
    let x: number, z: number;
    do {
      x = (Math.random() - 0.5) * range;
      z = (Math.random() - 0.5) * range;
    } while (Math.sqrt(x * x + z * z) < 16);
    return [x, z];
  }

  // Old OBJ-based loadEnemyModel removed — was duplicate with broken cfg refs.
  // The GLTF-based version below is the canonical implementation.

  /** Load a vehicle-type enemy model from VEHICLE_PREFABS (OBJ). */
  private async loadVehicleModel(vehicleKey: string): Promise<THREE.Group> {
    const VEHICLE_KEYS: Record<string, string> = {
      scooter: 'scooter',
      gunbike: 'gun_bike',
      tracer: 'tracer',
      cross: 'cross',
      chopper: 'chopper',
    };
    const prefabKey = VEHICLE_KEYS[vehicleKey] ?? vehicleKey;
    const prefab = getShipPrefab(prefabKey);
    if (prefab) {
      return this.loadPrefabModel(prefab, 2.5);
    }
    return this.createPlaceholder(0xff8800);
  }

  private async loadEnemyModel(enemy: GroundEnemy): Promise<THREE.Group> {
    // Vehicle enemy types use OBJ vehicle models (no skeleton → no GLTF)
    if (enemy.enemyType === 'stalker') return this.loadVehicleModel('scooter');
    if (enemy.enemyType === 'ranged') {
      const keys = ['gunbike', 'tracer'] as const;
      return this.loadVehicleModel(keys[enemy.id % keys.length]);
    }

    // Very large bosses keep the CorsairKing FBX (visually distinct)
    if (enemy.maxHp >= 400) {
      try {
        const model = await this.loadFBX(CORSAIR_KING_PATH);
        this.applyCharacterMaterial(model, 0xffaa00, 0.18);
        return model;
      } catch {
        return this.createPlaceholder(0xffaa00);
      }
    }

    // All other enemy types → GLTF character model
    const cfg = ENEMY_MODEL_MAP[enemy.enemyType] ?? { modelIdx: 6, tint: 0xff4444 };
    const gltfPath = ENEMY_GLTF_MAP[enemy.enemyType] ?? `${GLTF_BASE}/Punk.gltf`;
    try {
      const { group, animations } = await this.loadGLTF(gltfPath);
      this.applyCharacterMaterial(group, cfg.tint, 0.18);
      // Tag the group so syncEnemyVisuals can register the embedded anims
      (group as any).__gltfClips = animations;
      return group;
    } catch {
      // Local GLTF missing → try ObjectStore character library.
      const fallback = await this.loadObjectStoreCharacter(enemy.id, cfg.tint);
      return fallback ?? this.createPlaceholder(cfg.tint);
    }
  }

  /**
   * Pull a character GLB from ObjectStore as a fallback when local enemy
   * models are missing. Cycles deterministically by enemy id so each
   * enemy keeps the same look across re-spawns.
   */
  private async loadObjectStoreCharacter(seedIdx: number, tint: number): Promise<THREE.Group | null> {
    const entry = ObjectStoreModels.pickCharacter(seedIdx);
    if (!entry) return null;
    try {
      const url = ObjectStoreModels.urlFor(entry.path);
      const gltf = await this.gltfLoader.loadAsync(url);
      const scene = gltf.scene as THREE.Group;
      // Normalise to ~2 m tall like loadGLTF does.
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const heightDim = size.y > 0.1 ? size.y : Math.max(size.x, size.y, size.z);
      if (heightDim > 0) scene.scale.setScalar(2.0 / heightDim);
      this.applyCharacterMaterial(scene, tint, 0.18);
      scene.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          (c as THREE.Mesh).castShadow = true;
          (c as THREE.Mesh).receiveShadow = true;
        }
      });
      // Tag the embedded animations like loadGLTF does so anim wiring works.
      (scene as any).__gltfClips = gltf.animations;
      return scene;
    } catch {
      return null;
    }
  }

  // ── Enemy visual management ───────────────────────────────────
  private async syncEnemyVisuals(): Promise<void> {
    for (const enemy of this.state.enemies) {
      if (!this.enemyGroups.has(enemy.id)) {
        const group = await this.loadEnemyModel(enemy);
        this.enemyGroups.set(enemy.id, group);
        this.scene.add(group);

        // Load weapon for enemy — same baked-scale loader as the player.
        const wPath = WEAPON_MAP[enemy.weaponType] ?? WEAPON_MAP.sword;
        try {
          const w = await this.loadWeaponFBX(wPath, group);
          this.applyWeaponMaterial(w);
          group.add(w);
          this.enemyWeapons.set(enemy.id, w);
        } catch {
          /* no weapon */
        }

        // Health bar
        const bgGeo = new THREE.PlaneGeometry(1.2, 0.12);
        const bgMat = new THREE.MeshBasicMaterial({ color: 0x220000, side: THREE.DoubleSide });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        bg.position.set(0, 2.8, 0);
        group.add(bg);

        const barGeo = new THREE.PlaneGeometry(1.2, 0.12);
        const barMat = new THREE.MeshBasicMaterial({ color: 0xff4444, side: THREE.DoubleSide });
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.position.set(0, 2.8, 0.001);
        group.add(bar);
        this.enemyHealthBars.set(enemy.id, { bar, bg });

        // Set up animation controller for enemy
        const enemyAnim = new AnimationController(group);
        this.enemyAnims.set(enemy.id, enemyAnim);
        const gltfClips: THREE.AnimationClip[] | undefined = (group as any).__gltfClips;
        if (gltfClips) {
          // GLTF model — use embedded animations (no FBX load)
          for (const [animKey, gltfName] of Object.entries(GLTF_ANIM_MAP)) {
            const clip = gltfClips.find((a) => a.name === gltfName);
            if (clip) enemyAnim.registerClip(animKey, clip);
          }
          enemyAnim.play('idle');
        } else {
          // FBX model (boss/vehicle fallback) — load external animation set
          this.loadAnimSet(enemyAnim, enemy.weaponType);
        }
      }
    }
  }

  // ── Spawn wave 1 enemies ──────────────────────────────────────
  private spawnInitialEnemies(): void {
    // Use the planet-aware wave system from ground-combat.ts
    spawnWave(this.state);
  }

  // ── Input binding ─────────────────────────────────────────────
  private keys = new Set<string>();
  private tabPressed = false;
  private dodgePressed = false;

  private bindInputEvents(): void {
    const el = this.renderer.domElement;
    el.addEventListener('mousedown', this.onMouseDown);
    el.addEventListener('mouseup', this.onMouseUp);
    el.addEventListener('mousemove', this.onMouseMove);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // Request pointer lock on click for camera control
    el.addEventListener('click', () => {
      if (!this.pointerLocked) el.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === el;
    });
  }

  private onMouseDown = (e: MouseEvent) => {
    if (this.cameraMode === 'free') {
      if (e.button === 2) this.freeCamRMB = true;
      return; // ignore game inputs in free cam
    }
    if (e.button === 0) {
      this.mouseHeld = true;
      this.mouseHeldTime = 0;
    }
    if (e.button === 2) this.input.block = true;
  };

  private onMouseUp = (e: MouseEvent) => {
    if (this.cameraMode === 'free') {
      if (e.button === 2) this.freeCamRMB = false;
      return;
    }
    if (e.button === 0) {
      if (this.mouseHeldTime > 0.4) this.input.heavyAttack = true;
      else this.input.attack = true;
      this.mouseHeld = false;
      this.mouseHeldTime = 0;
    }
    if (e.button === 2) this.input.block = false;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (this.cameraMode === 'free') {
      // Free cam orbit via right-mouse drag (no pointer lock needed)
      if (this.freeCamRMB) {
        this.freeCamYaw -= e.movementX * MOUSE_SENSITIVITY;
        this.freeCamPitch = Math.max(-1.4, Math.min(1.4, this.freeCamPitch - e.movementY * MOUSE_SENSITIVITY));
      }
      return;
    }
    if (!this.pointerLocked) return;
    this.cameraYaw -= e.movementX * MOUSE_SENSITIVITY;
    this.cameraPitch = Math.max(-0.5, Math.min(1.2, this.cameraPitch - e.movementY * MOUSE_SENSITIVITY));
  };

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.key.toLowerCase());
    if (e.key === 'Tab') {
      e.preventDefault();
      this.tabPressed = true;
    }
    if (e.key === ' ') {
      e.preventDefault();
      this.dodgePressed = true;
    }
    // P key — toggle free-camera / follow-camera
    if (e.key.toLowerCase() === 'p') {
      this.cameraMode = this.cameraMode === 'follow' ? 'free' : 'follow';
      if (this.cameraMode === 'free') {
        // Initialise free cam at current camera position
        this.freeCamPos.copy(this.camera.position);
        this.freeCamYaw = this.cameraYaw;
        this.freeCamPitch = this.cameraPitch - 0.4;
        // Exit pointer lock so mouse is free
        document.exitPointerLock();
        this.pointerLocked = false;
        if (this.freeCamOverlay) this.freeCamOverlay.style.display = 'block';
      } else {
        if (this.freeCamOverlay) this.freeCamOverlay.style.display = 'none';
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };

  private updateInput(dt: number): void {
    this.input.forward = this.keys.has('w');
    this.input.back = this.keys.has('s');
    this.input.left = this.keys.has('a');
    this.input.right = this.keys.has('d');
    this.input.sprint = this.keys.has('shift');
    this.input.dodge = this.dodgePressed;
    this.input.lockOn = this.tabPressed;
    this.input.cameraYaw = this.cameraYaw;

    // Clear one-shot inputs after reading
    this.tabPressed = false;
    this.dodgePressed = false;

    // Track hold time for heavy attack
    if (this.mouseHeld) {
      this.mouseHeldTime += dt;
    }
  }

  private clearOneShot(): void {
    this.input.attack = false;
    this.input.heavyAttack = false;
    this.input.dodge = false;
    this.input.lockOn = false;
  }

  // ── Render loop ───────────────────────────────────────────────
  private animate = (): void => {
    if (this.disposed) return;
    this.animFrame = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);

    this.updateInput(dt);

    if (this.cameraMode === 'free') {
      // ── Free-camera fly mode: game paused, editor-style control ─────
      this.updateFreeCam(dt);
    } else {
      // ── Normal gameplay ─────────────────────────────────────
      updateGroundCombat(this.state, this.input, dt);
      this.clearOneShot();
      this.applyNavMesh(); // push player out of blocked zones
      this.syncEnemyVisuals();
      this.syncPlayerVisual(dt);
      this.syncEnemyVisualPositions(dt);
      this.syncDamageNumbers();
      this.syncLockOn();
      this.updateCamera(dt);
      this.updateProjectiles(dt);
      ObjectStoreVfx.update(dt);
      if (this.state.result !== 'none') this.onResult?.(this.state.result);
    }

    this.composer.render(dt);
  };

  // ── Nav mesh: push player and enemies out of BlockedZones ──────────
  private applyNavMesh(): void {
    const p = this.state.player;
    for (const zone of this.blockedZones) {
      const dx = p.pos.x - zone.x;
      const dz = p.pos.z - zone.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < zone.radius && dist > 0.001) {
        // Push the player out along the normal
        const push = (zone.radius - dist) / dist;
        p.pos.x += dx * push;
        p.pos.z += dz * push;
      }
    }
    // Also snap player Y to terrain height
    p.pos.y = this.sampleHeight(p.pos.x, p.pos.z);

    // Enemy collision with blocked zones
    for (const enemy of this.state.enemies) {
      if (enemy.aiState === 'dead') continue;
      for (const zone of this.blockedZones) {
        const dx = enemy.pos.x - zone.x;
        const dz = enemy.pos.z - zone.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < zone.radius && dist > 0.001) {
          const push = (zone.radius - dist) / dist;
          enemy.pos.x += dx * push;
          enemy.pos.z += dz * push;
        }
      }
      enemy.pos.y = this.sampleHeight(enemy.pos.x, enemy.pos.z);
    }
  }

  // ── Free camera (editor fly-around) ─────────────────────────────
  private updateFreeCam(dt: number): void {
    const fast = this.keys.has('shift');
    const speed = (fast ? FREE_CAM_FAST : FREE_CAM_SPEED) * dt;

    // Build look direction from yaw/pitch
    const lookDir = new THREE.Vector3(
      Math.sin(this.freeCamYaw) * Math.cos(this.freeCamPitch),
      Math.sin(this.freeCamPitch),
      Math.cos(this.freeCamYaw) * Math.cos(this.freeCamPitch),
    );
    const right = new THREE.Vector3().crossVectors(lookDir, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    // WASD = pan in look direction (like FPS editor camera)
    if (this.keys.has('w')) this.freeCamPos.addScaledVector(lookDir, speed);
    if (this.keys.has('s')) this.freeCamPos.addScaledVector(lookDir, -speed);
    if (this.keys.has('a')) this.freeCamPos.addScaledVector(right, -speed);
    if (this.keys.has('d')) this.freeCamPos.addScaledVector(right, speed);
    // E/Q = fly up/down
    if (this.keys.has('e')) this.freeCamPos.addScaledVector(up, speed);
    if (this.keys.has('q')) this.freeCamPos.addScaledVector(up, -speed);

    // Apply to Three.js camera
    this.camera.position.copy(this.freeCamPos);
    this.camera.lookAt(this.freeCamPos.clone().add(lookDir));
  }

  // ── Visual sync ───────────────────────────────────────────────
  private syncPlayerVisual(dt: number): void {
    if (!this.playerGroup) return;
    const p = this.state.player;
    this.playerGroup.position.set(p.pos.x, p.pos.y, p.pos.z);
    this.playerGroup.rotation.y = p.facing;

    // ── Sprint FOV pulse ──────────────────────────────────────
    const isSprinting = this.input.sprint && (this.input.forward || this.input.back || this.input.left || this.input.right);
    const isDodging = p.combatState === 'dodging';
    this.targetFov = isSprinting || isDodging ? 68 : 55;
    this.camera.fov += (this.targetFov - this.camera.fov) * 7 * dt;
    this.camera.updateProjectionMatrix();

    // ── Camera shake on player hit ────────────────────────────
    if (this.lastPlayerHp >= 0 && p.hp < this.lastPlayerHp && p.hp > 0) {
      this.cameraShake = Math.min(0.35, (this.lastPlayerHp - p.hp) * 0.012);
    }
    this.lastPlayerHp = p.hp;

    // ── Spawn projectile when ranged attack fires ─────────
    const isRanged = p.weaponType === 'bow' || p.weaponType === 'rifle';
    if (isRanged && (p.animKey === 'attack' || p.animKey === 'shoot') && p.combatState === 'attacking') {
      this.spawnProjectile(p.pos, p.facing, p.weaponType === 'rifle');
    }

    // Spawn melee slash arc + collect enemy hit impacts each frame.
    this.maybeSpawnMeleeSlash();
    this.spawnEnemyHitImpacts();

    // Drive player animation from combat engine animKey.
    // AnimationController handles the two-layer logic:
    //   • loop=true  → base layer (locomotion, full body)
    //   • loop=false → overlay layer (weapon/combat, upper body only)
    // ONE_SHOT_KEYS_SET is defined at module level and shared with the controller.
    if (this.playerAnim) {
      const injured = p.hp > 0 && p.hp / p.maxHp < INJURED_HP_THRESHOLD;
      let animKey = p.animKey as AnimKey;
      // Override locomotion with injured variants when low HP
      if (injured && (animKey === 'idle' || animKey === 'walk' || animKey === 'run')) {
        animKey = `injured_${animKey}` as AnimKey;
      }
      const isOneShot = ONE_SHOT_KEYS_SET.has(animKey);
      this.playerAnim.play(animKey, !isOneShot);
      this.playerAnim.update(dt);
    }

    // Hit flash
    if (p.combatState === 'hit') {
      this.playerGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat.emissive) mat.emissive.set(0xff2200);
        }
      });
    } else {
      this.playerGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat.emissive) mat.emissive.set(0x000000);
        }
      });
    }

    // Dodge transparency (i-frames visual)
    if (p.iframes) {
      this.playerGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          mat.transparent = true;
          mat.opacity = 0.5;
        }
      });
    } else {
      this.playerGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          mat.transparent = false;
          mat.opacity = 1;
        }
      });
    }
  }

  private syncEnemyVisualPositions(dt: number): void {
    for (const enemy of this.state.enemies) {
      const group = this.enemyGroups.get(enemy.id);
      if (!group) continue;

      group.position.set(enemy.pos.x, enemy.pos.y, enemy.pos.z);
      group.rotation.y = enemy.facing;

      // Drive enemy animation
      const eAnim = this.enemyAnims.get(enemy.id);
      if (eAnim) {
        const animKey = enemy.animKey as AnimKey;
        const isOneShot =
          animKey === 'attack' || animKey === 'heavy_attack' || animKey === 'death' || animKey === 'hit' || animKey === 'shoot';
        eAnim.play(animKey, !isOneShot);
        eAnim.update(dt);
      }

      // Dead enemies: lay down and fade
      if (enemy.aiState === 'dead') {
        group.rotation.x = Math.PI / 2;
        group.position.y = 0.3;
        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            mat.transparent = true;
            mat.opacity = Math.max(0, mat.opacity - 0.005);
          }
        });
      }

      // Hit flash
      if (enemy.hitFlash > 0) {
        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (mat.emissive) mat.emissive.set(0xff4400).multiplyScalar(enemy.hitFlash);
          }
        });
      } else {
        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (mat.emissive) mat.emissive.set(0x220000);
          }
        });
      }

      // Health bar
      const hb = this.enemyHealthBars.get(enemy.id);
      if (hb) {
        const pct = Math.max(0, enemy.hp / enemy.maxHp);
        hb.bar.scale.x = pct;
        hb.bar.position.x = -(1 - pct) * 0.6;
        // Billboard: face camera
        hb.bar.lookAt(this.camera.position);
        hb.bg.lookAt(this.camera.position);
        // Hide when dead
        hb.bar.visible = enemy.aiState !== 'dead';
        hb.bg.visible = enemy.aiState !== 'dead';
      }
    }
  }

  private syncDamageNumbers(): void {
    // Remove old sprites
    for (const s of this.damageSprites) {
      this.scene.remove(s);
      s.material.dispose();
    }
    this.damageSprites = [];

    // Create new sprites for active damage numbers
    for (const dn of this.state.damageNumbers) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = dn.color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      const text = dn.value > 0 ? `${dn.value}` : 'PARRY!';
      ctx.strokeText(text, 64, 40);
      ctx.fillText(text, 64, 40);

      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        opacity: 1 - dn.age / 1.5,
        depthTest: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(dn.pos.x, dn.pos.y, dn.pos.z);
      sprite.scale.set(1.5, 0.75, 1);
      this.scene.add(sprite);
      this.damageSprites.push(sprite);
    }
  }

  private syncLockOn(): void {
    if (!this.lockOnIndicator) return;
    const targetId = this.state.player.lockOnTargetId;
    if (targetId === null) {
      this.lockOnIndicator.visible = false;
      return;
    }
    const enemy = this.state.enemies.find((e) => e.id === targetId);
    if (!enemy || enemy.aiState === 'dead') {
      this.lockOnIndicator.visible = false;
      return;
    }
    this.lockOnIndicator.visible = true;
    this.lockOnIndicator.position.set(enemy.pos.x, 0.05, enemy.pos.z);
    // Pulse animation
    const scale = 1 + 0.15 * Math.sin(this.state.gameTime * 4);
    this.lockOnIndicator.scale.set(scale, scale, scale);
  }

  // ── Follow camera (gameplay) ────────────────────────────────
  private updateCamera(dt: number): void {
    const p = this.state.player;
    const lookAt = new THREE.Vector3(p.pos.x, p.pos.y + 1.5, p.pos.z);

    // Lock-on: centre camera between player and target, auto-yaw
    if (p.lockOnTargetId !== null) {
      const t = this.state.enemies.find((e) => e.id === p.lockOnTargetId);
      if (t) {
        lookAt.set((p.pos.x + t.pos.x) / 2, p.pos.y + 1.5, (p.pos.z + t.pos.z) / 2);
        const targetYaw = Math.atan2(t.pos.x - p.pos.x, t.pos.z - p.pos.z);
        this.cameraYaw += (targetYaw - this.cameraYaw) * 3 * dt;
      }
    }

    // Over-shoulder third-person
    const offX = Math.sin(this.cameraYaw) * CAM_DISTANCE;
    const offZ = Math.cos(this.cameraYaw) * CAM_DISTANCE;
    const sh = CAM_SHOULDER;
    const shX = Math.sin(this.cameraYaw + Math.PI / 2) * sh;
    const shZ = Math.cos(this.cameraYaw + Math.PI / 2) * sh;

    const targetPos = new THREE.Vector3(p.pos.x - offX + shX, p.pos.y + CAM_HEIGHT + this.cameraPitch * 3, p.pos.z - offZ + shZ);
    this.camera.position.lerp(targetPos, CAM_LERP * dt);

    // ── Camera shake ──────────────────────────────────────────
    if (this.cameraShake > 0.001) {
      const s = this.cameraShake;
      this.camera.position.x += (Math.random() - 0.5) * s;
      this.camera.position.y += (Math.random() - 0.5) * s * 0.5;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 9);
    }

    this.camera.lookAt(lookAt);
  }

  // ── Resize ────────────────────────────────────────────────────
  private onResize = (): void => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer?.setSize(w, h);
  };

  // ── Projectile system (ObjectStore VFX-backed) ────────────────
  private _lastProjAnimKey = '';
  /**
   * Spawn a tracer projectile + muzzle flash. The tracer is a small
   * additive sphere (kept for collision / line-of-sight feel) and the
   * cosmetic effects (muzzle flash, in-flight glow, impact spark) are
   * driven by ObjectStore VFX sprites — no more procedural circles.
   */
  private spawnProjectile(pos: { x: number; y: number; z: number }, facing: number, isRifle: boolean): void {
    // Rate-limit: one per attack animation trigger (guard by animKey change)
    const key = this.state.player.animKey + this.state.player.stateTimer.toFixed(1);
    if (key === this._lastProjAnimKey) return;
    this._lastProjAnimKey = key;

    const muzzlePos = {
      x: pos.x + Math.sin(facing) * 0.6,
      y: pos.y + 1.3,
      z: pos.z + Math.cos(facing) * 0.6,
    };

    // Muzzle flash from ObjectStore (lightning-style burst).
    ObjectStoreVfx.spawn(this.scene, VFX_PRESETS.muzzleFlash, muzzlePos, {
      scale: isRifle ? 1.0 : 1.4,
      durationSec: 0.12,
      tint: isRifle ? 0xffeebb : 0x88ffaa,
    });

    // Small additive sphere kept for projectile feel (visible bolt head).
    const color = isRifle ? 0xffdd44 : 0x44ffaa;
    const geo = new THREE.SphereGeometry(isRifle ? 0.08 : 0.12, 8, 8);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: new THREE.Color(color),
      emissiveIntensity: 2.6,
      roughness: 0.2,
      metalness: 0.0,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(muzzlePos.x, muzzlePos.y, muzzlePos.z);
    this.scene.add(mesh);

    const speed = isRifle ? 28 : 18;
    const vel = new THREE.Vector3(Math.sin(facing) * speed, 0, Math.cos(facing) * speed);
    this.projectilePool.push({ mesh, vel, life: 0, maxLife: isRifle ? 0.8 : 1.2 });
  }

  /** Advance all active projectiles; remove expired ones with impact VFX. */
  private updateProjectiles(dt: number): void {
    for (let i = this.projectilePool.length - 1; i >= 0; i--) {
      const proj = this.projectilePool[i];
      proj.life += dt;
      proj.mesh.position.addScaledVector(proj.vel, dt);
      proj.vel.y -= 4 * dt; // slight gravity arc

      const t = proj.life / proj.maxLife;
      (proj.mesh.material as THREE.MeshStandardMaterial).opacity = 1 - t;

      if (proj.life >= proj.maxLife) {
        // Impact spark from ObjectStore.
        ObjectStoreVfx.spawn(
          this.scene,
          VFX_PRESETS.rangedHit,
          { x: proj.mesh.position.x, y: proj.mesh.position.y, z: proj.mesh.position.z },
          { scale: 1.4, durationSec: 0.35 },
        );
        this.scene.remove(proj.mesh);
        proj.mesh.geometry.dispose();
        (proj.mesh.material as THREE.Material).dispose();
        this.projectilePool.splice(i, 1);
      }
    }
  }

  // ── Melee slash + hit FX from ObjectStore ──────────────────────
  /** Last attack key so we only spawn one slash per swing. */
  private _lastMeleeKey = '';
  /** Last enemy.hitFlash sample so we know when a hit just landed. */
  private _enemyHitFlashLast = new Map<number, number>();

  /** Spawn a slash arc in front of the player when a melee attack fires. */
  private maybeSpawnMeleeSlash(): void {
    const p = this.state.player;
    if (p.combatState !== 'attacking') return;
    const key = `${p.animKey}@${p.stateTimer.toFixed(1)}`;
    if (key === this._lastMeleeKey) return;
    this._lastMeleeKey = key;

    const isRanged = p.weaponType === 'bow' || p.weaponType === 'rifle';
    if (isRanged) return;

    // Spawn in front of player at chest height.
    const reach = 1.4;
    const slashPos = {
      x: p.pos.x + Math.sin(p.facing) * reach,
      y: p.pos.y + 1.2,
      z: p.pos.z + Math.cos(p.facing) * reach,
    };
    const finisher = p.comboCount === 3;
    ObjectStoreVfx.spawn(this.scene, finisher ? VFX_PRESETS.meleeCrit : VFX_PRESETS.meleeSlash, slashPos, {
      scale: finisher ? 2.4 : 1.8,
      durationSec: 0.28,
      tint: finisher ? 0xffaa44 : 0xffffff,
    });
  }

  // ── ObjectStore scenery loader ──────────────────────────────
  /**
   * Drops 8–12 KayKit medieval-builder GLBs around the play area as
   * scenery so the map isn't bare. Each model loads from ObjectStore,
   * normalised to ~3 m, scattered outside the spawn circle, deterministic
   * per planet seed so the same map keeps the same skyline.
   */
  private async spawnObjectStoreScenery(): Promise<void> {
    if (this.disposed) return;
    const buildings = ObjectStoreModels.byCategory('kaykit-medievalbuilder');
    if (buildings.length === 0) return;

    const seed = this.planetSeed(this.state.planetType);
    const rng = (i: number) => Math.abs(Math.sin(seed * 100 + i * 7.31)) % 1; // deterministic 0..1
    const count = 10;
    const TARGET_SIZE = 4.0; // metres (longest axis)

    for (let i = 0; i < count; i++) {
      if (this.disposed) return;
      const idx = Math.floor(rng(i) * buildings.length);
      const entry = buildings[idx];
      if (!entry) continue;
      const url = ObjectStoreModels.urlFor(entry.path);

      try {
        const gltf = await this.gltfLoader.loadAsync(url);
        if (this.disposed) return;
        const group = gltf.scene as THREE.Group;

        // Normalise to TARGET_SIZE on its longest axis.
        const box = new THREE.Box3().setFromObject(group);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0.0001) group.scale.setScalar(TARGET_SIZE / maxDim);

        // Scatter outside the safe spawn circle.
        const angle = rng(i + 0.31) * Math.PI * 2;
        const dist = 22 + rng(i + 0.62) * 38; // 22–60 m out
        const px = Math.cos(angle) * dist;
        const pz = Math.sin(angle) * dist;
        const py = this.sampleHeight(px, pz);
        group.position.set(px, py, pz);
        group.rotation.y = rng(i + 0.99) * Math.PI * 2;

        group.traverse((c) => {
          const m = c as THREE.Mesh;
          if (m.isMesh) {
            m.castShadow = true;
            m.receiveShadow = true;
          }
        });

        this.scene.add(group);
        this.terrainObjects.push(group);
        // Block navigation so the player can't walk through buildings.
        this.blockedZones.push({ x: px, z: pz, radius: TARGET_SIZE * 0.4 });
      } catch (err) {
        // Quietly skip — ObjectStore CDN may be slow or model malformed.
        void err;
      }
    }
  }

  /** Detect newly-flashed enemies and spawn an impact sprite at them. */
  private spawnEnemyHitImpacts(): void {
    for (const enemy of this.state.enemies) {
      const prev = this._enemyHitFlashLast.get(enemy.id) ?? 0;
      if (enemy.hitFlash > 0.5 && prev <= 0.5) {
        ObjectStoreVfx.spawn(
          this.scene,
          VFX_PRESETS.meleeHit,
          { x: enemy.pos.x, y: enemy.pos.y + 1.2, z: enemy.pos.z },
          { scale: 1.3, durationSec: 0.3 },
        );
      }
      this._enemyHitFlashLast.set(enemy.id, enemy.hitFlash);
    }
    // Drop entries for dead/removed enemies.
    for (const id of this._enemyHitFlashLast.keys()) {
      if (!this.state.enemies.find((e) => e.id === id)) this._enemyHitFlashLast.delete(id);
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────
  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.animFrame);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.exitPointerLock();
    if (this.freeCamOverlay?.parentNode) this.freeCamOverlay.parentNode.removeChild(this.freeCamOverlay);

    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.removeEventListener('mouseup', this.onMouseUp);
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);

    // Clean up projectiles
    for (const proj of this.projectilePool) {
      this.scene.remove(proj.mesh);
      proj.mesh.geometry.dispose();
      (proj.mesh.material as THREE.Material).dispose();
    }
    this.projectilePool = [];

    // Clear any in-flight ObjectStore VFX sprites.
    ObjectStoreVfx.clear();

    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
      if ((obj as THREE.Mesh).material) {
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else (mat as THREE.Material).dispose();
      }
    });
    // Dispose animation controllers
    this.playerAnim?.dispose();
    for (const [, ctrl] of this.enemyAnims) ctrl.dispose();
    this.prefabCache.clear();

    this.composer?.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }

  // ── Postprocessing setup ──────────────────────────────────────
  private setupPostProcessing(): void {
    this.composer = new EffectComposer(this.renderer, {
      frameBufferType: THREE.HalfFloatType,
    });
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    const bloom = new BloomEffect({
      intensity: 0.35,
      luminanceThreshold: 0.6,
      luminanceSmoothing: 0.3,
      mipmapBlur: true,
    });
    const toneMapping = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    const smaa = new SMAAEffect({ preset: SMAAPreset.MEDIUM });

    this.composer.addPass(new EffectPass(this.camera, bloom, toneMapping, smaa));
  }

  // ── GLTF terrain environment loader ───────────────────────────
  /**
   * Loads an optional GLTF terrain environment for specific planet types:
   * - crystalline / dark_matter → alien-city
   * - volcanic / barren → mars-environment
   * The GLTF scene is placed at the world origin, scaled to fit the play area,
   * and layered beneath the procedural heightmap terrain.
   */
  private async loadTerrainEnvironment(): Promise<void> {
    const pt = this.state.planetType;
    let gltfPath: string | null = null;
    let envScale = 1.0;

    if (pt === 'crystalline' || pt === 'dark_matter' || pt === 'metallic') {
      gltfPath = '/assets/ground/alien-city/scene.gltf';
      envScale = pt === 'metallic' ? 0.12 : 0.15;
    } else if (pt === 'volcanic' || pt === 'barren' || pt === 'plasma') {
      gltfPath = '/assets/ground/mars-environment/scene.gltf';
      envScale = pt === 'plasma' ? 1.2 : 1.5;
    } else if (pt === 'frozen' || pt === 'oceanic' || pt === 'fungal') {
      gltfPath = '/assets/ground/homeworld/scene.gltf';
      envScale = pt === 'fungal' ? 0.25 : 0.3;
    }

    if (!gltfPath) return;

    try {
      const gltf = await this.gltfLoader.loadAsync(resolvePathUrl(gltfPath));
      const envScene = gltf.scene;

      // Auto-fit: scale the environment to cover ~80% of the play area
      const box = new THREE.Box3().setFromObject(envScene);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetCoverage = 120; // cover 120 of the 200-unit terrain
      const autoScale = maxDim > 0 ? (targetCoverage / maxDim) * envScale : envScale;
      envScene.scale.setScalar(autoScale);

      // Center on the ground plane and sink slightly so it integrates with heightmap
      const centeredBox = new THREE.Box3().setFromObject(envScene);
      const center = centeredBox.getCenter(new THREE.Vector3());
      envScene.position.sub(center);
      envScene.position.y = -1; // sit just below the surface

      // Enable shadows on all meshes
      envScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).castShadow = true;
          (child as THREE.Mesh).receiveShadow = true;
        }
      });

      this.scene.add(envScene);
      this.terrainObjects.push(envScene);
    } catch (err) {
      console.warn(`[GroundRenderer] Failed to load terrain env: ${gltfPath}`, err);
    }
  }
}
