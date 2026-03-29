/**
 * ground-renderer.ts — Three.js renderer for on-planet ground combat.
 * Manages scene, camera, FBX model loading, terrain, damage numbers.
 * Reads from GroundCombatState each frame and drives the combat engine.
 */

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { loadAnimationClip as loadAnimClipCentral } from './model-loader';
import type { PlanetType } from './space-types';
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

// ── Animation system ─────────────────────────────────────────────
const ANIM_BASE = '/assets/ground/animations';

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

/** All available animations per weapon type — uses every extracted FBX */
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
    kick: `${ANIM_BASE}/sword/kick.fbx`,
    jump: `${ANIM_BASE}/sword/jump.fbx`,
    hit: `${ANIM_BASE}/sword/hit.fbx`,
    death: `${ANIM_BASE}/sword/death.fbx`,
  },
  greatsword: {
    idle: `${ANIM_BASE}/greatsword/idle.fbx`,
    walk: `${ANIM_BASE}/greatsword/walk.fbx`,
    run: `${ANIM_BASE}/greatsword/run.fbx`,
    attack: `${ANIM_BASE}/greatsword/attack.fbx`,
    combo2: `${ANIM_BASE}/greatsword/combo2.fbx`,
    combo3: `${ANIM_BASE}/greatsword/combo3.fbx`,
    heavy_attack: `${ANIM_BASE}/greatsword/heavy_attack.fbx`,
    jump_attack: `${ANIM_BASE}/greatsword/jump_attack.fbx`,
    slide_attack: `${ANIM_BASE}/greatsword/slide_attack.fbx`,
    block: `${ANIM_BASE}/greatsword/block.fbx`,
    kick: `${ANIM_BASE}/greatsword/kick.fbx`,
    hit: `${ANIM_BASE}/greatsword/hit.fbx`,
    death: `${ANIM_BASE}/greatsword/death.fbx`,
  },
  bow: {
    idle: `${ANIM_BASE}/bow/idle.fbx`,
    walk: `${ANIM_BASE}/bow/walk.fbx`,
    run: `${ANIM_BASE}/bow/run.fbx`,
    strafe: `${ANIM_BASE}/bow/strafe_left.fbx`,
    attack: `${ANIM_BASE}/bow/attack.fbx`,
    shoot: `${ANIM_BASE}/bow/shoot.fbx`,
    block: `${ANIM_BASE}/bow/block.fbx`,
    dodge: `${ANIM_BASE}/bow/dodge.fbx`,
    hit: `${ANIM_BASE}/bow/hit.fbx`,
    death: `${ANIM_BASE}/bow/death.fbx`,
  },
  staff: {
    idle: `${ANIM_BASE}/magic/idle.fbx`,
    attack: `${ANIM_BASE}/magic/attack.fbx`,
    combo2: `${ANIM_BASE}/magic/combo2.fbx`,
    combo3: `${ANIM_BASE}/magic/combo3.fbx`,
    heavy_attack: `${ANIM_BASE}/magic/heavy_attack.fbx`,
    cast: `${ANIM_BASE}/magic/cast.fbx`,
  },
  spear: {
    idle: `${ANIM_BASE}/greatsword/idle.fbx`,
    walk: `${ANIM_BASE}/greatsword/walk.fbx`,
    run: `${ANIM_BASE}/greatsword/run.fbx`,
    attack: `${ANIM_BASE}/greatsword/attack.fbx`,
    combo2: `${ANIM_BASE}/greatsword/combo2.fbx`,
    heavy_attack: `${ANIM_BASE}/greatsword/heavy_attack.fbx`,
    jump_attack: `${ANIM_BASE}/greatsword/jump_attack.fbx`,
    hit: `${ANIM_BASE}/greatsword/hit.fbx`,
    death: `${ANIM_BASE}/greatsword/death.fbx`,
  },
  rifle: {
    idle: `${ANIM_BASE}/rifle/idle.fbx`,
    walk: `${ANIM_BASE}/rifle/walk.fbx`,
    run: `${ANIM_BASE}/rifle/run.fbx`,
    strafe: `${ANIM_BASE}/rifle/strafe_left.fbx`,
    shoot: `${ANIM_BASE}/rifle/idle.fbx`, // fire from idle stance
    attack: `${ANIM_BASE}/rifle/walk.fbx`, // shooting while advancing
    death: `${ANIM_BASE}/rifle/death.fbx`,
  },
};

/** Common fallback clips — used when weapon set is missing a key */
const COMMON_ANIMS: Partial<Record<AnimKey, string>> = {
  dodge: `${ANIM_BASE}/common/stand_to_roll.fbx`,
  hit: `${ANIM_BASE}/common/getting_hit_backwards.fbx`,
  death: `${ANIM_BASE}/common/flying_back_death.fbx`,
  jump: `${ANIM_BASE}/common/front_twist_flip.fbx`,
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

// ── AnimationController — per-entity mixer + clip management ──────
class AnimationController {
  mixer: THREE.AnimationMixer;
  clips = new Map<string, THREE.AnimationClip>();
  currentAction: THREE.AnimationAction | null = null;
  currentKey = '';

  constructor(root: THREE.Object3D) {
    this.mixer = new THREE.AnimationMixer(root);
  }

  /** Load an animation clip from an FBX file and register it under `key`. */
  async loadClip(key: string, path: string): Promise<void> {
    if (this.clips.has(key)) return;
    const clip = await loadAnimClipCentral(path);
    if (clip) {
      clip.name = key;
      this.clips.set(key, clip);
    }
  }

  /** Crossfade to animation `key`. If not loaded, stays on current. */
  play(key: string, loop = true, fadeDuration = 0.2): void {
    if (key === this.currentKey && this.currentAction?.isRunning()) return;
    const clip = this.clips.get(key);
    if (!clip) return;
    const action = this.mixer.clipAction(clip);
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    action.clampWhenFinished = !loop;
    if (this.currentAction && this.currentAction !== action) {
      this.currentAction.fadeOut(fadeDuration);
    }
    action.reset().fadeIn(fadeDuration).play();
    this.currentAction = action;
    this.currentKey = key;
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

// ── Character / weapon asset paths ────────────────────────────────
const CHARACTER_FBXS = Array.from({ length: 12 }, (_, i) =>
  i === 0 ? '/assets/ground/characters/DungeonCrawler_Character.fbx' : `/assets/ground/characters/DungeonCrawler_Character${i}.fbx`,
);
const CHARACTER_TEXTURE = '/assets/ground/characters/DungeonCrawler_Character.png';

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

  // ── Nav mesh ───────────────────────────────────────────────
  /** Blocked navigation zones from solid terrain props. */
  private blockedZones: BlockedZone[] = [];
  /** Terrain height at world-space (x,z). Used to keep characters on the surface. */
  private heightData: Float32Array = new Float32Array(0);
  private heightRes = 0; // grid resolution (vertices per side)

  // ── Model cache ───────────────────────────────────────────────
  private fbxLoader = new FBXLoader();
  private textureLoader = new THREE.TextureLoader();
  private modelCache = new Map<string, THREE.Group>();
  private loadingModels = new Map<string, Promise<THREE.Group>>();
  private charTexture: THREE.Texture | null = null;

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
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // Camera
    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 500);
    this.camera.position.set(0, CAM_HEIGHT, -CAM_DISTANCE);

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

    // Heightmap terrain — high-res subdivided plane with per-vertex displacement
    this.buildTerrain(palette);
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

    // Spawn some enemies for initial encounter
    this.spawnInitialEnemies();

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
      // Normalize scale
      const box = new THREE.Box3().setFromObject(fbx);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetHeight = 2.0;
      const scale = targetHeight / maxDim;
      fbx.scale.setScalar(scale);

      // Apply character texture if available
      if (this.charTexture) {
        fbx.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const mat = new THREE.MeshStandardMaterial({
              map: this.charTexture,
              roughness: 0.6,
              metalness: 0.2,
            });
            mesh.material = mat;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });
      }

      this.modelCache.set(path, fbx);
      return fbx;
    });

    this.loadingModels.set(path, promise);
    const g = await promise;
    this.loadingModels.delete(path);
    return g.clone();
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

  private async loadPlayerModel(): Promise<void> {
    // Use character roster to pick the correct model and color
    const cls = this.state.player.characterClass;
    const cfg = CHARACTER_ROSTER[cls];
    const modelPath = CHARACTER_FBXS[cfg?.modelIdx ?? 0];
    const tint = cfg ? new THREE.Color(cfg.color) : new THREE.Color(0x4488ff);

    try {
      const model = await this.loadFBX(modelPath);
      // Tint model to character class color
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (m.color) m.color.lerp(tint, 0.25);
          if (m.emissive) m.emissive.set(tint.clone().multiplyScalar(0.05));
        }
      });
      this.playerGroup = model;
      this.scene.add(model);
    } catch {
      this.playerGroup = this.createPlaceholder(cfg?.color ?? 0x4488ff);
      this.scene.add(this.playerGroup);
    }

    // Load weapon matching the character class (prefer class-specific override)
    const weaponPath = CLASS_WEAPON_MAP[this.state.player.characterClass] ?? WEAPON_MAP[this.state.player.weaponType] ?? WEAPON_MAP.sword;
    try {
      const weapon = await this.loadFBX(weaponPath);
      weapon.scale.setScalar(0.5);
      this.playerWeapon = weapon;
      weapon.position.set(0.6, 1.2, 0.2);
      this.playerGroup!.add(weapon);
    } catch {
      // No weapon visual — OK
    }

    // Animation controller for player — load the full set for this weapon type
    this.playerAnim = new AnimationController(this.playerGroup!);
    await this.loadAnimSet(this.playerAnim, this.state.player.weaponType);
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

  private async loadEnemyModel(enemy: GroundEnemy): Promise<THREE.Group> {
    const cfg = ENEMY_MODEL_MAP[enemy.enemyType] ?? { modelIdx: 6, tint: 0xff4444 };
    const idx = cfg.modelIdx % CHARACTER_FBXS.length;
    // Boss (titan or boss type with maxHp > 300) uses CorsairKing model
    const path = enemy.enemyType === 'boss' || enemy.maxHp >= 400 ? CORSAIR_KING_PATH : CHARACTER_FBXS[idx];
    const tint = new THREE.Color(cfg.tint);
    try {
      const model = await this.loadFBX(path);
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (m.color) m.color.lerp(tint, 0.35);
          if (m.emissive) m.emissive.set(new THREE.Color(cfg.tint).multiplyScalar(0.15));
        }
      });
      return model;
    } catch {
      return this.createPlaceholder(cfg.tint);
    }
  }

  // ── Enemy visual management ───────────────────────────────────
  private async syncEnemyVisuals(): Promise<void> {
    for (const enemy of this.state.enemies) {
      if (!this.enemyGroups.has(enemy.id)) {
        const group = await this.loadEnemyModel(enemy);
        this.enemyGroups.set(enemy.id, group);
        this.scene.add(group);

        // Load weapon for enemy
        const wPath = WEAPON_MAP[enemy.weaponType] ?? WEAPON_MAP.sword;
        try {
          const w = await this.loadFBX(wPath);
          w.scale.setScalar(0.5);
          w.position.set(0.6, 1.2, 0.2);
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
        this.loadAnimSet(enemyAnim, enemy.weaponType);
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
      if (this.state.result !== 'none') this.onResult?.(this.state.result);
    }

    this.renderer.render(this.scene, this.camera);
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

    // Drive player animation from combat engine animKey
    if (this.playerAnim) {
      const injured = p.hp > 0 && p.hp / p.maxHp < INJURED_HP_THRESHOLD;
      let animKey = p.animKey as AnimKey;
      // Override locomotion with injured variants when low HP
      if (injured && (animKey === 'idle' || animKey === 'walk' || animKey === 'run')) {
        animKey = `injured_${animKey}` as AnimKey;
      }
      const isOneShot =
        animKey === 'attack' || animKey === 'heavy_attack' || animKey === 'dodge' || animKey === 'death' || animKey === 'hit';
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
        const isOneShot = animKey === 'attack' || animKey === 'death' || animKey === 'hit';
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
    this.camera.lookAt(lookAt);
  }

  // ── Resize ────────────────────────────────────────────────────
  private onResize = (): void => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

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

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
