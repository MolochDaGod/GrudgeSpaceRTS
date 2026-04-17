/**
 * ground-rts-3d-renderer.ts — Three.js 3D renderer for Ground RTS Micro Wars.
 *
 * Replaces the 2D canvas renderer with a full 3D scene using:
 * - Advance Wars GLTF models (infantry, mech, land, air/naval)
 * - Sci-fi soldier + catfish mech models for special units
 * - Postprocessing pipeline (Bloom + ToneMapping + SMAA)
 * - Top-down orbital camera with RTS controls
 * - Selection rings, health bars, projectile trails in 3D
 *
 * The game engine (ground-rts-engine.ts) stays unchanged —
 * this renderer reads GroundRTSState and syncs 3D meshes.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
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
import type { GroundRTSState, RTSUnit, RTSBuilding, MineralDeposit, Team, Vec2, Projectile } from './ground-rts-types';

// ── Asset Paths ────────────────────────────────────────────────────
const AW = '/assets/groundrts/advance-wars';
const PM = '/assets/groundrts/pixel-mech';
const GLTF_PATHS = {
  infantry_mech: `${AW}/infantry-mech/scene.gltf`,
  land_units: `${AW}/land-units/scene.gltf`,
  air_naval: `${AW}/air-naval/scene.gltf`,
  soldier: '/assets/space/models/soldier/scene.gltf',
  mech: '/assets/space/models/mech/scene.gltf',
};

/** Pixel Mech FBX paths — 7 individual animation files + full mesh. */
const PIXEL_MECH = {
  full: `${PM}/mesh_full.FBX`,
  texture: `${PM}/mech_d.jpg`,
  anims: {
    idle: `${PM}/idle_.FBX`,
    walk_forward: `${PM}/walk_forward.FBX`,
    walk_back: `${PM}/walk_back.FBX`,
    run: `${PM}/run_.FBX`,
    shoot: `${PM}/shooting_.FBX`,
    damage: `${PM}/damage_.FBX`,
    death: `${PM}/death_.FBX`,
  },
};

/** Map unit state to pixel-mech animation name. */
const MECH_STATE_ANIM: Record<string, string> = {
  idle: 'idle',
  walking: 'walk_forward',
  attacking: 'shoot',
  dying: 'death',
};

const TEAM_HEX: Record<number, number> = { 0: 0x4488ff, 1: 0xff4444 };
const WORLD_SCALE = 0.01; // game pixels → Three.js units (1 game pixel = 0.01 units)

// ── Unit mesh cache ──────────────────────────────────────────────────
interface UnitMesh3D {
  group: THREE.Group;
  healthBar: THREE.Mesh;
  healthBg: THREE.Mesh;
  selectionRing: THREE.Mesh;
}

/** Per-unit animation state for skinned FBX models (pixel mech). */
interface UnitAnimState {
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  current: string;
}

interface BuildingMesh3D {
  group: THREE.Group;
  healthBar: THREE.Mesh;
  healthBg: THREE.Mesh;
  selectionRing: THREE.Mesh;
}

interface DepositMesh3D {
  group: THREE.Group;
}

// ── Main Renderer Class ──────────────────────────────────────────────
export class GroundRTS3DRenderer {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private composer!: EffectComposer;
  private container: HTMLElement;
  private clock = new THREE.Clock();
  private disposed = false;
  private animFrame = 0;

  // Scene objects
  private unitMeshes = new Map<number, UnitMesh3D>();
  private buildingMeshes = new Map<number, BuildingMesh3D>();
  private depositMeshes = new Map<number, DepositMesh3D>();
  private projectileMeshes = new Map<number, THREE.Mesh>();
  private groundPlane!: THREE.Mesh;
  private gridHelper!: THREE.GridHelper;
  private buildingModelCache = new Map<string, THREE.Group>();

  // Model templates (cloned per unit)
  private modelTemplates = new Map<string, THREE.Group>();
  private modelLoading = new Map<string, Promise<THREE.Group>>();
  private gltfLoader = new GLTFLoader();
  private fbxLoader = new FBXLoader();

  // Pixel Mech data
  private pixelMechGroup: THREE.Group | null = null;
  private pixelMechClips = new Map<string, THREE.AnimationClip>();
  private pixelMechTexture: THREE.Texture | null = null;

  // Per-unit animation (for skinned mech units)
  private unitAnimStates = new Map<number, UnitAnimState>();

  // Camera state (mirrors space-renderer orbital pattern)
  public cameraX = 0;
  public cameraZ = 0;
  public cameraZoom = 120;
  private cameraAngle = 65; // pitch degrees

  // Raycaster for click-to-world
  public raycaster = new THREE.Raycaster();
  public mouseNdc = new THREE.Vector2();

  constructor(container: HTMLElement) {
    this.container = container;
  }

  // ── Init ──────────────────────────────────────────────────────────
  async init(state: GroundRTSState): Promise<void> {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.NoToneMapping; // postprocessing handles it
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a2030);
    this.scene.fog = new THREE.FogExp2(0x1a2030, 0.003);

    // Camera — top-down orbital (same pattern as space-renderer)
    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.5, 2000);
    this.cameraX = (state.mapWidth * WORLD_SCALE) / 2;
    this.cameraZ = state.mapHeight * WORLD_SCALE - 4; // start near player spawn
    this.updateCamera();

    // Lighting
    this.setupLighting();

    // Terrain
    this.buildTerrain(state);

    // Postprocessing
    this.setupPostProcessing();

    // Preload models (GLTF + pixel mech FBX)
    await Promise.all([this.preloadModels(), this.preloadPixelMech()]);

    // Resize handler
    window.addEventListener('resize', this.onResize);
  }

  // ── Lighting (warm military) ──────────────────────────────────────
  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0x556688, 1.2);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffeedd, 1.8);
    sun.position.set(30, 50, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x6688cc, 0.6);
    fill.position.set(-20, 30, -30);
    this.scene.add(fill);

    const hemi = new THREE.HemisphereLight(0x88aacc, 0x334422, 0.4);
    this.scene.add(hemi);
  }

  // ── Terrain (flat plane with grid) ────────────────────────────────
  private buildTerrain(state: GroundRTSState): void {
    const mapW = state.mapWidth * WORLD_SCALE;
    const mapH = state.mapHeight * WORLD_SCALE;

    // Ground plane
    const geo = new THREE.PlaneGeometry(mapW, mapH);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x3a4a2a,
      roughness: 0.9,
      metalness: 0.05,
    });
    this.groundPlane = new THREE.Mesh(geo, mat);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.position.set(mapW / 2, 0, mapH / 2);
    this.groundPlane.receiveShadow = true;
    this.scene.add(this.groundPlane);

    // Grid overlay
    const gridSize = Math.max(mapW, mapH);
    this.gridHelper = new THREE.GridHelper(gridSize, 40, 0x2a3a1a, 0x2a3a1a);
    this.gridHelper.position.set(mapW / 2, 0.01, mapH / 2);
    this.gridHelper.material.opacity = 0.3;
    this.gridHelper.material.transparent = true;
    this.scene.add(this.gridHelper);
  }

  // ── Postprocessing ────────────────────────────────────────────────
  private setupPostProcessing(): void {
    this.composer = new EffectComposer(this.renderer, {
      frameBufferType: THREE.HalfFloatType,
    });
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    const bloom = new BloomEffect({
      intensity: 0.5,
      luminanceThreshold: 0.5,
      luminanceSmoothing: 0.3,
      mipmapBlur: true,
    });
    const toneMapping = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    const smaa = new SMAAEffect({ preset: SMAAPreset.MEDIUM });

    this.composer.addPass(new EffectPass(this.camera, bloom, toneMapping, smaa));
  }

  // ── Model Preloading ──────────────────────────────────────────────
  private async preloadModels(): Promise<void> {
    const keys = Object.entries(GLTF_PATHS);
    const results = await Promise.allSettled(
      keys.map(async ([key, path]) => {
        try {
          const gltf = await this.gltfLoader.loadAsync(path);
          this.modelTemplates.set(key, gltf.scene);
        } catch (err) {
          console.warn(`[GroundRTS3D] Failed to load ${key}:`, err);
        }
      }),
    );
    void results; // all settled, failures logged
  }

  // ── Pixel Mech Preloading ────────────────────────────────────────
  private async preloadPixelMech(): Promise<void> {
    try {
      // Load texture
      const texLoader = new THREE.TextureLoader();
      this.pixelMechTexture = await texLoader.loadAsync(PIXEL_MECH.texture);
      this.pixelMechTexture.colorSpace = THREE.SRGBColorSpace;
      // Pixel art: nearest-neighbor filtering for crisp pixels
      this.pixelMechTexture.magFilter = THREE.NearestFilter;
      this.pixelMechTexture.minFilter = THREE.NearestFilter;

      // Load the full mesh (contains mesh + skeleton + all animations)
      const fullGroup = await this.fbxLoader.loadAsync(PIXEL_MECH.full);

      // Apply the diffuse texture to all meshes
      fullGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) {
            const sm = m as any;
            if (sm.isMeshStandardMaterial || sm.isMeshPhongMaterial || sm.isMeshLambertMaterial) {
              sm.map = this.pixelMechTexture;
              sm.needsUpdate = true;
            }
          }
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });

      // Store clips from the full file (they come named by the FBX take)
      for (const clip of fullGroup.animations) {
        // Normalize clip names: the FBX may name them "Take 001" etc.
        // We'll also load individual files for named clips
        this.pixelMechClips.set('full_' + clip.name, clip);
      }

      this.pixelMechGroup = fullGroup;

      // Load individual animation FBX files for named clip access
      const animEntries = Object.entries(PIXEL_MECH.anims);
      const animResults = await Promise.allSettled(
        animEntries.map(async ([name, path]) => {
          try {
            const animGroup = await this.fbxLoader.loadAsync(path);
            if (animGroup.animations.length > 0) {
              const clip = animGroup.animations[0];
              clip.name = name; // rename to our key
              this.pixelMechClips.set(name, clip);
            }
          } catch (err) {
            console.warn(`[PixelMech] Failed to load anim ${name}:`, err);
          }
        }),
      );
      void animResults;
      console.log(`[PixelMech] Loaded mesh + ${this.pixelMechClips.size} animation clips`);
    } catch (err) {
      console.warn('[PixelMech] Failed to load pixel mech model:', err);
    }
  }

  /** Clone the pixel mech for a new unit instance. Returns group + sets up AnimationMixer. */
  private clonePixelMech(unitId: number): THREE.Group {
    if (!this.pixelMechGroup) return this.buildPlaceholderUnit({ def: { spriteSize: 96 }, team: 0 } as any);

    // SkeletonUtils.clone properly handles SkinnedMesh + Skeleton rebinding
    const clone = SkeletonUtils.clone(this.pixelMechGroup) as THREE.Group;

    // Re-apply texture to cloned materials (clone may share material refs)
    if (this.pixelMechTexture) {
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          const newMats = mats.map((m) => {
            const cloned = (m as THREE.MeshStandardMaterial).clone();
            (cloned as any).map = this.pixelMechTexture;
            cloned.needsUpdate = true;
            return cloned;
          });
          mesh.material = newMats.length === 1 ? newMats[0] : newMats;
        }
      });
    }

    // Create AnimationMixer for this clone
    const mixer = new THREE.AnimationMixer(clone);
    const actions = new Map<string, THREE.AnimationAction>();
    for (const [name, clip] of this.pixelMechClips) {
      actions.set(name, mixer.clipAction(clip));
    }
    this.unitAnimStates.set(unitId, { mixer, actions, current: '' });

    // Start with idle
    this.playMechAnim(unitId, 'idle');

    return clone;
  }

  /** Switch animation for a mech unit. */
  private playMechAnim(unitId: number, animName: string): void {
    const state = this.unitAnimStates.get(unitId);
    if (!state || state.current === animName) return;

    const newAction = state.actions.get(animName);
    if (!newAction) return;

    // Crossfade from current to new
    const oldAction = state.actions.get(state.current);
    if (oldAction) {
      oldAction.fadeOut(0.2);
    }
    newAction.reset().fadeIn(0.2).play();

    // Death plays once
    if (animName === 'death') {
      newAction.setLoop(THREE.LoopOnce, 1);
      newAction.clampWhenFinished = true;
    } else {
      newAction.setLoop(THREE.LoopRepeat, Infinity);
    }

    state.current = animName;
  }

  // ── Get unit model clone ──────────────────────────────────────────
  private getUnitModel(unit: RTSUnit): THREE.Group {
    const cls = unit.def.unitClass;

    // Pixel mech for mech_walker units
    if (cls === 'mech_walker') {
      return this.clonePixelMech(unit.id);
    }

    // Map unit classes to model templates
    let templateKey = 'infantry_mech'; // default
    if (cls.includes('monster') || cls.includes('boss') || cls === 'megaboss') {
      templateKey = 'mech'; // big enemies use catfish mech
    } else if (cls.includes('zombie')) {
      templateKey = 'land_units'; // zombies replaced by land vehicles
    } else if (cls.includes('girl') || cls.includes('man')) {
      templateKey = 'infantry_mech'; // player units use infantry/mech
    }

    const template = this.modelTemplates.get(templateKey);
    if (template) {
      const clone = template.clone();
      // Auto-fit to unit size
      const box = new THREE.Box3().setFromObject(clone);
      const diam = box.getSize(new THREE.Vector3()).length();
      const targetSize = unit.def.spriteSize * WORLD_SCALE * 1.5;
      if (diam > 0) clone.scale.setScalar(targetSize / diam);
      // Team tint
      this.tintModel(clone, unit.team);
      return clone;
    }

    // Fallback: colored box
    return this.buildPlaceholderUnit(unit);
  }

  private buildPlaceholderUnit(unit: RTSUnit): THREE.Group {
    const group = new THREE.Group();
    const size = unit.def.spriteSize * WORLD_SCALE;
    const geo = new THREE.BoxGeometry(size, size * 1.5, size);
    const mat = new THREE.MeshStandardMaterial({
      color: TEAM_HEX[unit.team] ?? 0x888888,
      emissive: TEAM_HEX[unit.team] ?? 0x888888,
      emissiveIntensity: 0.3,
      metalness: 0.5,
      roughness: 0.4,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = size * 0.75;
    mesh.castShadow = true;
    group.add(mesh);
    return group;
  }

  private tintModel(group: THREE.Group, team: Team): void {
    const color = new THREE.Color(TEAM_HEX[team] ?? 0x888888);
    group.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        if ((m as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          const sm = m as THREE.MeshStandardMaterial;
          sm.emissive.copy(color);
          sm.emissiveIntensity = 0.15;
        }
      }
    });
  }

  // ── Sync Units ────────────────────────────────────────────────
  private syncUnits(state: GroundRTSState): void {
    // Remove deleted units + their animation state
    for (const [id, mesh] of this.unitMeshes) {
      if (!state.units.has(id)) {
        this.scene.remove(mesh.group);
        this.unitMeshes.delete(id);
        this.unitAnimStates.delete(id);
      }
    }

    // Update / create units
    for (const [id, unit] of state.units) {
      if (unit.state === 'dead') {
        const existing = this.unitMeshes.get(id);
        if (existing) {
          // Fade dead units
          existing.group.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) {
              const mat = (c as THREE.Mesh).material as THREE.Material;
              if (mat) {
                mat.transparent = true;
                mat.opacity = 0.3;
              }
            }
          });
          existing.healthBar.visible = false;
          existing.healthBg.visible = false;
          existing.selectionRing.visible = false;
        }
        continue;
      }

      let mesh = this.unitMeshes.get(id);
      if (!mesh) {
        mesh = this.createUnitMesh(unit);
        this.unitMeshes.set(id, mesh);
      }

      // Position (game 2D x,y → Three.js x,z)
      const wx = unit.x * WORLD_SCALE;
      const wz = unit.y * WORLD_SCALE;
      mesh.group.position.set(wx, 0, wz);

      // Facing
      mesh.group.rotation.y = -unit.facing + Math.PI / 2;

      // Selection ring
      mesh.selectionRing.visible = unit.selected;

      // Health bar
      const hpPct = unit.hp / unit.maxHp;
      if (hpPct < 1) {
        mesh.healthBar.visible = true;
        mesh.healthBg.visible = true;
        mesh.healthBar.scale.x = Math.max(0.01, hpPct);
        const barMat = mesh.healthBar.material as THREE.MeshBasicMaterial;
        barMat.color.setHex(hpPct > 0.5 ? 0x44ff44 : hpPct > 0.25 ? 0xffaa00 : 0xff4444);
      } else {
        mesh.healthBar.visible = false;
        mesh.healthBg.visible = false;
      }

      // Sync animation state for mech units
      if (unit.def.unitClass === 'mech_walker') {
        const desiredAnim = MECH_STATE_ANIM[unit.state] ?? 'idle';
        this.playMechAnim(id, desiredAnim);
      }
    }
  }

  private createUnitMesh(unit: RTSUnit): UnitMesh3D {
    const group = new THREE.Group();
    const model = this.getUnitModel(unit);
    group.add(model);

    const size = unit.def.spriteSize * WORLD_SCALE;

    // Selection ring (ground decal)
    const ringGeo = new THREE.RingGeometry(size * 0.6, size * 0.7, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x44ff44,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const selectionRing = new THREE.Mesh(ringGeo, ringMat);
    selectionRing.position.y = 0.02;
    selectionRing.visible = false;
    group.add(selectionRing);

    // Health bar background
    const barW = size * 1.2;
    const barH = size * 0.1;
    const bgGeo = new THREE.PlaneGeometry(barW, barH);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.7, depthWrite: false });
    const healthBg = new THREE.Mesh(bgGeo, bgMat);
    healthBg.position.set(0, size * 2.2, 0);
    healthBg.visible = false;
    group.add(healthBg);

    // Health bar fill
    const barGeo = new THREE.PlaneGeometry(barW, barH);
    const barMat = new THREE.MeshBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.9, depthWrite: false });
    const healthBar = new THREE.Mesh(barGeo, barMat);
    healthBar.position.set(0, size * 2.2, 0.001);
    healthBar.visible = false;
    group.add(healthBar);

    this.scene.add(group);
    return { group, healthBar, healthBg, selectionRing };
  }

  // ── Sync Projectiles ──────────────────────────────────────────────
  private syncProjectiles(state: GroundRTSState): void {
    // Remove finished
    for (const [id] of this.projectileMeshes) {
      if (!state.projectiles.has(id)) {
        const m = this.projectileMeshes.get(id)!;
        this.scene.remove(m);
        this.projectileMeshes.delete(id);
      }
    }

    // Update / create
    for (const [id, proj] of state.projectiles) {
      let mesh = this.projectileMeshes.get(id);
      if (!mesh) {
        const geo = new THREE.SphereGeometry(proj.radius * WORLD_SCALE * 2, 6, 6);
        const mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(proj.color),
          transparent: true,
          opacity: 0.9,
        });
        mesh = new THREE.Mesh(geo, mat);
        this.scene.add(mesh);
        this.projectileMeshes.set(id, mesh);
      }
      mesh.position.set(proj.x * WORLD_SCALE, 0.3, proj.y * WORLD_SCALE);
    }
  }

  // ── Camera ────────────────────────────────────────────────────────
  updateCamera(): void {
    const dist = this.cameraZoom * WORLD_SCALE * 10;
    const pitch = (this.cameraAngle * Math.PI) / 180;
    this.camera.position.set(this.cameraX, dist * Math.sin(pitch), this.cameraZ + dist * Math.cos(pitch));
    this.camera.lookAt(this.cameraX, 0, this.cameraZ);
  }

  /** Convert screen coords to world ground position. */
  screenToWorld(screenX: number, screenY: number): Vec2 | null {
    const rect = this.container.getBoundingClientRect();
    this.mouseNdc.x = ((screenX - rect.left) / rect.width) * 2 - 1;
    this.mouseNdc.y = -((screenY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouseNdc, this.camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(plane, target)) {
      return { x: target.x / WORLD_SCALE, y: target.z / WORLD_SCALE };
    }
    return null;
  }

  // ── Building 3D Sync ───────────────────────────────────────────────
  private syncBuildings(state: GroundRTSState): void {
    // Remove destroyed building meshes
    for (const [id, mesh] of this.buildingMeshes) {
      const b = state.buildings.get(id);
      if (!b || b.state === 'destroyed') {
        this.scene.remove(mesh.group);
        this.buildingMeshes.delete(id);
      }
    }

    for (const [id, b] of state.buildings) {
      if (b.state === 'destroyed') continue;

      let mesh = this.buildingMeshes.get(id);
      if (!mesh) {
        mesh = this.createBuildingMesh(b);
        this.buildingMeshes.set(id, mesh);
      }

      // Position
      const centerX = (b.x + (b.def.footprint.w * state.tileSize) / 2) * WORLD_SCALE;
      const centerZ = (b.y + (b.def.footprint.h * state.tileSize) / 2) * WORLD_SCALE;
      mesh.group.position.set(centerX, 0, centerZ);

      // Construction animation: scale Y from 0.1 to 1
      if (b.state === 'constructing') {
        const sy = 0.1 + b.buildProgress * 0.9;
        mesh.group.scale.set(1, sy, 1);
      } else {
        mesh.group.scale.set(1, 1, 1);
      }

      // Unpowered: pulse opacity
      if (b.state === 'unpowered') {
        const pulse = 0.4 + Math.sin(Date.now() * 0.005) * 0.2;
        mesh.group.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            const mat = (c as THREE.Mesh).material as THREE.Material;
            mat.transparent = true;
            mat.opacity = pulse;
          }
        });
      }

      // Health bar
      const hpPct = b.hp / b.maxHp;
      mesh.healthBar.visible = hpPct < 1;
      mesh.healthBg.visible = hpPct < 1;
      if (hpPct < 1) {
        mesh.healthBar.scale.x = Math.max(0.01, hpPct);
        const barMat = mesh.healthBar.material as THREE.MeshBasicMaterial;
        barMat.color.setHex(hpPct > 0.5 ? 0x44ff44 : hpPct > 0.25 ? 0xffaa00 : 0xff4444);
      }

      // Selection
      mesh.selectionRing.visible = b.selected;
    }
  }

  private createBuildingMesh(b: RTSBuilding): BuildingMesh3D {
    const group = new THREE.Group();

    // Try load GLB, fallback to colored box
    const cached = this.buildingModelCache.get(b.def.key);
    if (cached) {
      const clone = cached.clone();
      this.fitBuildingModel(clone, b);
      group.add(clone);
    } else {
      // Start async load, show placeholder immediately
      const placeholder = this.buildBuildingPlaceholder(b);
      group.add(placeholder);

      this.gltfLoader
        .loadAsync(b.def.glbPath)
        .then((gltf) => {
          this.buildingModelCache.set(b.def.key, gltf.scene);
          group.remove(placeholder);
          const model = gltf.scene.clone();
          this.fitBuildingModel(model, b);
          group.add(model);
        })
        .catch(() => {
          // Keep placeholder on load failure
        });
    }

    const footW = b.def.footprint.w * WORLD_SCALE * 192; // tileSize from state
    const footH = b.def.footprint.h * WORLD_SCALE * 192;
    const maxFoot = Math.max(footW, footH);

    // Selection ring
    const ringGeo = new THREE.RingGeometry(maxFoot * 0.45, maxFoot * 0.5, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x44ff44,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const selectionRing = new THREE.Mesh(ringGeo, ringMat);
    selectionRing.position.y = 0.02;
    selectionRing.visible = false;
    group.add(selectionRing);

    // Health bars
    const barW = maxFoot * 0.8;
    const barH = maxFoot * 0.06;
    const bgGeo = new THREE.PlaneGeometry(barW, barH);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.7, depthWrite: false });
    const healthBg = new THREE.Mesh(bgGeo, bgMat);
    healthBg.position.set(0, maxFoot * 1.5, 0);
    healthBg.visible = false;
    group.add(healthBg);

    const barGeo = new THREE.PlaneGeometry(barW, barH);
    const barMat = new THREE.MeshBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.9, depthWrite: false });
    const healthBar = new THREE.Mesh(barGeo, barMat);
    healthBar.position.set(0, maxFoot * 1.5, 0.001);
    healthBar.visible = false;
    group.add(healthBar);

    this.scene.add(group);
    return { group, healthBar, healthBg, selectionRing };
  }

  private fitBuildingModel(model: THREE.Group, b: RTSBuilding): void {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = Math.max(b.def.footprint.w, b.def.footprint.h) * WORLD_SCALE * 192 * 0.8;
    if (maxDim > 0.001) model.scale.setScalar(targetSize / maxDim);
    // Team tint
    this.tintModel(model, b.team);
    // Enable shadows
    model.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        (c as THREE.Mesh).castShadow = true;
        (c as THREE.Mesh).receiveShadow = true;
      }
    });
  }

  private buildBuildingPlaceholder(b: RTSBuilding): THREE.Group {
    const g = new THREE.Group();
    const footW = b.def.footprint.w * WORLD_SCALE * 192;
    const footH = b.def.footprint.h * WORLD_SCALE * 192;
    const height = Math.max(footW, footH) * 0.6;
    const ROLE_COLORS: Record<string, number> = {
      production: 0x4488ff,
      economy: 0x44ee88,
      defense: 0xff4488,
      research: 0xaa44ff,
      special: 0xffcc44,
      decoration: 0x888888,
    };
    const color = ROLE_COLORS[b.def.role] ?? 0x888888;
    const geo = new THREE.BoxGeometry(footW * 0.8, height, footH * 0.8);
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.15, metalness: 0.4, roughness: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = height / 2;
    mesh.castShadow = true;
    g.add(mesh);
    return g;
  }

  // ── Mineral Deposit Sync ───────────────────────────────────────────
  private syncDeposits(state: GroundRTSState): void {
    for (const dep of state.mineralDeposits) {
      if (dep.amount <= 0) {
        const mesh = this.depositMeshes.get(dep.id);
        if (mesh) {
          this.scene.remove(mesh.group);
          this.depositMeshes.delete(dep.id);
        }
        continue;
      }

      if (!this.depositMeshes.has(dep.id)) {
        const g = new THREE.Group();
        const TYPE_COLORS = { standard: 0x88aacc, rare: 0xffcc44, crystal: 0x44ddff };
        const color = TYPE_COLORS[dep.type];
        // Crystal cluster
        for (let i = 0; i < 4; i++) {
          const h = 0.3 + Math.random() * 0.5;
          const r = 0.08 + Math.random() * 0.12;
          const geo = new THREE.ConeGeometry(r, h, 5);
          const mat = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.8,
            roughness: 0.2,
            metalness: 0.6,
          });
          const crystal = new THREE.Mesh(geo, mat);
          crystal.position.set((Math.random() - 0.5) * 0.4, h / 2, (Math.random() - 0.5) * 0.4);
          crystal.rotation.z = (Math.random() - 0.5) * 0.4;
          crystal.castShadow = true;
          g.add(crystal);
        }
        g.position.set(dep.x * WORLD_SCALE, 0, dep.y * WORLD_SCALE);
        this.scene.add(g);
        this.depositMeshes.set(dep.id, { group: g });
      }
    }
  }

  // ── Render Loop ─────────────────────────────────────────────────
  render(state: GroundRTSState, dt: number): void {
    if (this.disposed) return;

    this.syncUnits(state);
    this.syncBuildings(state);
    this.syncDeposits(state);
    this.syncProjectiles(state);
    this.updateCamera();

    // Tick animation mixers for all animated units
    for (const [, animState] of this.unitAnimStates) {
      animState.mixer.update(dt);
    }

    // Billboard health bars toward camera
    for (const [, mesh] of this.unitMeshes) {
      if (mesh.healthBar.visible) {
        mesh.healthBar.lookAt(this.camera.position);
        mesh.healthBg.lookAt(this.camera.position);
      }
    }
    for (const [, mesh] of this.buildingMeshes) {
      if (mesh.healthBar.visible) {
        mesh.healthBar.lookAt(this.camera.position);
        mesh.healthBg.lookAt(this.camera.position);
      }
    }

    this.composer.render(dt);
  }

  // ── Resize ────────────────────────────────────────────────────────
  private onResize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer?.setSize(w, h);
  };

  // ── Dispose ───────────────────────────────────────────────────────
  dispose(): void {
    this.disposed = true;
    window.removeEventListener('resize', this.onResize);
    this.composer?.dispose();
    this.renderer?.dispose();
    if (this.renderer?.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
