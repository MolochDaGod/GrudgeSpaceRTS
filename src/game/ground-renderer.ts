/**
 * ground-renderer.ts — Three.js renderer for on-planet ground combat.
 * Manages scene, camera, FBX model loading, terrain, damage numbers.
 * Reads from GroundCombatState each frame and drives the combat engine.
 */

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
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
  private fbxLoader: FBXLoader;

  constructor(root: THREE.Object3D, loader: FBXLoader) {
    this.mixer = new THREE.AnimationMixer(root);
    this.fbxLoader = loader;
  }

  /** Load an animation clip from an FBX file and register it under `key`. */
  async loadClip(key: string, path: string): Promise<void> {
    if (this.clips.has(key)) return;
    try {
      const fbx = await this.fbxLoader.loadAsync(path);
      if (fbx.animations.length > 0) {
        const clip = fbx.animations[0];
        clip.name = key;
        this.clips.set(key, clip);
      }
    } catch {
      // Clip failed to load — will fall through to idle
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

const WEAPON_MAP: Record<string, string> = {
  sword: '/assets/ground/weapons/Sword.fbx',
  bow: '/assets/ground/weapons/Bow.fbx',
  staff: '/assets/ground/weapons/MagicCane.fbx',
  spear: '/assets/ground/weapons/Spear.fbx',
};

// ── Camera constants ──────────────────────────────────────────────
const CAM_DISTANCE = 8;
const CAM_HEIGHT = 4;
const CAM_SHOULDER_OFFSET = 1.2; // over-shoulder offset
const CAM_LERP = 6;
const MOUSE_SENSITIVITY = 0.003;

export class GroundRenderer {
  // ── Three.js core ─────────────────────────────────────────────
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private container: HTMLElement;
  private disposed = false;
  private animFrame = 0;

  // ── Game state ────────────────────────────────────────────────
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

  // ── Camera ────────────────────────────────────────────────────
  private cameraYaw = 0;
  private cameraPitch = 0.3;
  private pointerLocked = false;
  private mouseHeld = false;
  private mouseHeldTime = 0;

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

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      color: palette.ground,
      roughness: 0.9,
      metalness: 0.1,
    });
    this.groundPlane = new THREE.Mesh(groundGeo, groundMat);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.receiveShadow = true;
    this.scene.add(this.groundPlane);

    // Terrain cover objects
    this.generateTerrain(palette);

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

  // ── Terrain generation ────────────────────────────────────────
  private generateTerrain(palette: { ground: number; accent: number }): void {
    // Scatter box-based cover objects
    const coverMat = new THREE.MeshStandardMaterial({
      color: palette.accent,
      roughness: 0.7,
      metalness: 0.3,
      emissive: palette.accent,
      emissiveIntensity: 0.05,
    });
    const rockMat = new THREE.MeshStandardMaterial({
      color: palette.ground,
      roughness: 0.95,
      metalness: 0.05,
    });

    for (let i = 0; i < 40; i++) {
      const x = (Math.random() - 0.5) * 80;
      const z = (Math.random() - 0.5) * 80;
      // Skip near spawn area
      if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;

      const isAccent = Math.random() < 0.3;
      const w = 0.5 + Math.random() * 2;
      const h = 0.5 + Math.random() * 3;
      const d = 0.5 + Math.random() * 2;
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, isAccent ? coverMat : rockMat);
      mesh.position.set(x, h / 2, z);
      mesh.rotation.y = Math.random() * Math.PI;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.terrainObjects.push(mesh);
    }

    // Accent crystal/pillar objects for visual variety
    for (let i = 0; i < 15; i++) {
      const x = (Math.random() - 0.5) * 90;
      const z = (Math.random() - 0.5) * 90;
      if (Math.abs(x) < 8 && Math.abs(z) < 8) continue;
      const r = 0.2 + Math.random() * 0.5;
      const h = 2 + Math.random() * 5;
      const geo = new THREE.CylinderGeometry(r * 0.6, r, h, 6);
      const mesh = new THREE.Mesh(geo, coverMat);
      mesh.position.set(x, h / 2, z);
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.terrainObjects.push(mesh);
    }
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

    const promise = this.fbxLoader.loadAsync(path).then((fbx) => {
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

    // Load weapon matching the character class
    const weaponPath = WEAPON_MAP[this.state.player.weaponType] ?? WEAPON_MAP.sword;
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
    this.playerAnim = new AnimationController(this.playerGroup!, this.fbxLoader);
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
      const mtl = await this.mtlLoader.loadAsync('/assets/ground/terrain/AncientCrashSite.mtl');
      mtl.preload();
      this.objLoader.setMaterials(mtl);
      const obj = await this.objLoader.loadAsync('/assets/ground/terrain/AncientCrashSite.obj');
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
        const enemyAnim = new AnimationController(group, this.fbxLoader);
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
    if (e.button === 0) {
      this.mouseHeld = true;
      this.mouseHeldTime = 0;
    }
    if (e.button === 2) {
      this.input.block = true;
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      if (this.mouseHeldTime > 0.4) {
        this.input.heavyAttack = true;
      } else {
        this.input.attack = true;
      }
      this.mouseHeld = false;
      this.mouseHeldTime = 0;
    }
    if (e.button === 2) {
      this.input.block = false;
    }
  };

  private onMouseMove = (e: MouseEvent) => {
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

    // Gather input
    this.updateInput(dt);

    // Update combat engine
    updateGroundCombat(this.state, this.input, dt);

    // Clear one-shot inputs
    this.clearOneShot();

    // Sync visuals
    this.syncEnemyVisuals();
    this.syncPlayerVisual(dt);
    this.syncEnemyVisualPositions(dt);
    this.syncDamageNumbers();
    this.syncLockOn();
    this.updateCamera(dt);

    // Check result
    if (this.state.result !== 'none') {
      this.onResult?.(this.state.result);
    }

    // Render
    this.renderer.render(this.scene, this.camera);
  };

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

  // ── Camera ────────────────────────────────────────────────────
  private updateCamera(dt: number): void {
    const p = this.state.player;

    // If locked on, camera centres between player and target
    const lookAtPos = new THREE.Vector3(p.pos.x, p.pos.y + 1.5, p.pos.z);

    if (p.lockOnTargetId !== null) {
      const t = this.state.enemies.find((e) => e.id === p.lockOnTargetId);
      if (t) {
        const midX = (p.pos.x + t.pos.x) / 2;
        const midZ = (p.pos.z + t.pos.z) / 2;
        lookAtPos.set(midX, p.pos.y + 1.5, midZ);
        // Auto-rotate camera to face target
        const targetYaw = Math.atan2(t.pos.x - p.pos.x, t.pos.z - p.pos.z);
        this.cameraYaw += (targetYaw - this.cameraYaw) * 3 * dt;
      }
    }

    // Over-shoulder third person
    const offX = Math.sin(this.cameraYaw) * CAM_DISTANCE;
    const offZ = Math.cos(this.cameraYaw) * CAM_DISTANCE;
    const shoulderX = Math.sin(this.cameraYaw + Math.PI / 2) * CAM_SHOULDER_OFFSET;
    const shoulderZ = Math.cos(this.cameraYaw + Math.PI / 2) * CAM_SHOULDER_OFFSET;

    const targetCamPos = new THREE.Vector3(
      p.pos.x - offX + shoulderX,
      p.pos.y + CAM_HEIGHT + this.cameraPitch * 3,
      p.pos.z - offZ + shoulderZ,
    );

    // Smooth follow
    this.camera.position.lerp(targetCamPos, CAM_LERP * dt);
    this.camera.lookAt(lookAtPos);
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
