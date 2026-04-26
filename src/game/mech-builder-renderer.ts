/**
 * mech-builder-renderer.ts — Mech showcase + builder scene.
 *
 * Loads Mech_00 (registered in asset-registry) onto a studio-lit floor
 * disc, plays its animation, and lets the caller equip / unequip
 * registered mech parts via `boneAnchor` (right_hand / left_hand /
 * spine). Re-uses the same scale-chain compensation pattern as the
 * ground renderer's `attachWeaponToBone` so a 30 KB attachment FBX ends
 * up at its registered `targetSize` regardless of the mech's normalised
 * scale.
 *
 * Designed as a self-contained scene component:
 *   const r = new MechBuilderRenderer(div);
 *   await r.init();
 *   await r.equip('mech_att_back_jetpack');
 *   r.playClip('Idle');
 *   r.dispose();
 */

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { resolvePathUrl, getAsset, type WeaponBoneAnchor } from './asset-registry';

export type MechSlot = WeaponBoneAnchor; // 'right_hand' | 'left_hand' | 'right_shield' | 'spine'

export interface MechBuildSnapshot {
  /** Asset key of the mech body (always 'mech_00_body' for now). */
  bodyKey: string;
  /** Slot \u2192 list of asset keys equipped at that slot. */
  equipped: Record<MechSlot, string[]>;
  /** Currently playing animation clip name (null if none). */
  animKey: string | null;
}

const BONE_FRAGMENTS: Record<MechSlot, readonly string[]> = {
  right_hand: ['righthand', 'right_hand', 'hand_r', 'r_hand', 'rightarm'],
  left_hand: ['lefthand', 'left_hand', 'hand_l', 'l_hand', 'leftarm'],
  right_shield: ['shield', 'shield_r'],
  spine: ['spine', 'chest', 'torso', 'mech_root', 'root', 'pelvis'],
};

export class MechBuilderRenderer {
  // Three.js core
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private clock = new THREE.Clock();
  private container: HTMLElement;
  private disposed = false;
  private animFrame = 0;

  // Loaders / caches
  private fbxLoader = new FBXLoader();
  private fbxCache = new Map<string, THREE.Group>();

  // Mech state
  private mechRoot: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private clips: THREE.AnimationClip[] = [];
  private currentAction: THREE.AnimationAction | null = null;

  /** Slot \u2192 (assetKey \u2192 mounted Group). */
  private equipped: Map<MechSlot, Map<string, THREE.Group>> = new Map();

  constructor(container: HTMLElement) {
    this.container = container;
    for (const slot of ['spine', 'right_hand', 'left_hand', 'right_shield'] as MechSlot[]) {
      this.equipped.set(slot, new Map());
    }
  }

  // ── Init ─────────────────────────────────────────────────────

  async init(): Promise<void> {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07101e);

    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200);
    this.camera.position.set(4.2, 2.8, 6.4);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1.0, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 18;
    this.controls.maxPolarAngle = Math.PI * 0.55;

    this.setupLights();
    this.setupShowcaseFloor();

    await this.loadMechBody();
    await this.loadAndPlayDefaultAnim();

    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  private setupLights(): void {
    // Three-point studio rig — key, fill, rim
    this.scene.add(new THREE.AmbientLight(0x445566, 0.55));

    const key = new THREE.DirectionalLight(0xffeedd, 1.5);
    key.position.set(5, 8, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 30;
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -2;
    this.scene.add(key);

    const rimLeft = new THREE.PointLight(0x44ddff, 1.0, 22);
    rimLeft.position.set(-5, 3, -3);
    this.scene.add(rimLeft);

    const rimRight = new THREE.PointLight(0xff44dd, 0.8, 22);
    rimRight.position.set(0, 2, -7);
    this.scene.add(rimRight);

    this.scene.add(new THREE.HemisphereLight(0x88aacc, 0x111122, 0.35));
  }

  private setupShowcaseFloor(): void {
    // Dark glossy disc + cyan rim ring
    const floorGeo = new THREE.CircleGeometry(6.5, 96);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0c1426,
      roughness: 0.35,
      metalness: 0.55,
      emissive: 0x102040,
      emissiveIntensity: 0.18,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const ringGeo = new THREE.RingGeometry(6.1, 6.4, 96);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x44ddff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.012;
    this.scene.add(ring);

    // Soft grid lines underneath for depth
    const grid = new THREE.GridHelper(20, 20, 0x223344, 0x101820);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    grid.position.y = 0.005;
    this.scene.add(grid);
  }

  // ── Mech body + animation ───────────────────────────────────

  private async loadFBXCached(path: string): Promise<THREE.Group> {
    const cached = this.fbxCache.get(path);
    if (cached) return cached.clone();
    const url = resolvePathUrl(path);
    const fbx = await this.fbxLoader.loadAsync(url);
    this.fbxCache.set(path, fbx);
    return fbx.clone();
  }

  private async loadMechBody(): Promise<void> {
    const entry = getAsset('mech_00_body');
    if (!entry) {
      console.warn('[MECH] mech_00_body not registered');
      return;
    }
    try {
      const fbx = await this.loadFBXCached(entry.localPath);
      // Auto-fit to ~2 m tall
      const box = new THREE.Box3().setFromObject(fbx);
      const size = box.getSize(new THREE.Vector3());
      const heightDim = size.y > 0.1 ? size.y : Math.max(size.x, size.y, size.z);
      if (heightDim > 0) fbx.scale.setScalar(2.0 / heightDim);
      // Plant on floor
      const baseBox = new THREE.Box3().setFromObject(fbx);
      fbx.position.y -= baseBox.min.y;

      fbx.traverse((c) => {
        const m = c as THREE.Mesh;
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
        }
      });
      this.scene.add(fbx);
      this.mechRoot = fbx;
    } catch (err) {
      console.warn('[MECH] body load failed', err);
    }
  }

  private async loadAndPlayDefaultAnim(): Promise<void> {
    if (!this.mechRoot) return;
    const entry = getAsset('mech_00_anim');
    if (!entry) return;
    try {
      const animFbx = await this.loadFBXCached(entry.localPath);
      this.clips = animFbx.animations ?? [];
      if (this.clips.length === 0) return;
      this.mixer = new THREE.AnimationMixer(this.mechRoot);
      const first = this.clips[0];
      if (!first) return;
      this.currentAction = this.mixer.clipAction(first);
      this.currentAction.play();
    } catch (err) {
      console.warn('[MECH] anim load failed', err);
    }
  }

  /** List available animation clip names (after init). */
  getClipNames(): string[] {
    return this.clips.map((c) => c.name);
  }

  /** Crossfade to a named clip. */
  playClip(name: string): void {
    if (!this.mixer) return;
    const clip = this.clips.find((c) => c.name === name);
    if (!clip) return;
    const action = this.mixer.clipAction(clip);
    if (this.currentAction && this.currentAction !== action) {
      this.currentAction.fadeOut(0.25);
    }
    action.reset().fadeIn(0.25).play();
    this.currentAction = action;
  }

  // ── Equip / unequip ─────────────────────────────────────────

  private findBone(slot: MechSlot): THREE.Object3D | null {
    if (!this.mechRoot) return null;
    const fragments = BONE_FRAGMENTS[slot];
    let found: THREE.Object3D | null = null;
    this.mechRoot.traverse((obj) => {
      if (found) return;
      const norm = obj.name.toLowerCase().replace(/\s+/g, '');
      if (fragments.some((f) => norm.includes(f))) found = obj;
    });
    // Fallback: spine slot can fall back to mechRoot itself.
    return found ?? (slot === 'spine' ? this.mechRoot : null);
  }

  /** Equip an attachment by registry key. Returns true on success. */
  async equip(assetKey: string): Promise<boolean> {
    if (!this.mechRoot) return false;
    const entry = getAsset(assetKey);
    if (!entry) return false;
    const slot: MechSlot = entry.boneAnchor ?? 'spine';
    const slotMap = this.equipped.get(slot);
    if (!slotMap) return false;
    if (slotMap.has(assetKey)) return true;

    const bone = this.findBone(slot);
    if (!bone) return false;
    bone.updateWorldMatrix(true, true);

    let part: THREE.Group;
    try {
      part = await this.loadFBXCached(entry.localPath);
    } catch (err) {
      console.warn('[MECH] part load failed', assetKey, err);
      return false;
    }

    // Resize to targetSize, compensate for parent world-scale.
    const target = entry.targetSize ?? 1.2;
    const box = new THREE.Box3().setFromObject(part);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const desired = maxDim > 0 ? target / maxDim : 1;

    const boneScale = new THREE.Vector3();
    bone.getWorldScale(boneScale);
    const sx = boneScale.x || 1;
    const sy = boneScale.y || 1;
    const sz = boneScale.z || 1;
    part.scale.set(desired / sx, desired / sy, desired / sz);

    const rp = entry.restPose;
    if (rp?.position) part.position.set(rp.position.x, rp.position.y, rp.position.z);
    if (rp?.rotationDeg) {
      part.rotation.set((rp.rotationDeg.x * Math.PI) / 180, (rp.rotationDeg.y * Math.PI) / 180, (rp.rotationDeg.z * Math.PI) / 180);
    }

    part.traverse((c) => {
      const m = c as THREE.Mesh;
      if (m.isMesh) m.castShadow = true;
    });

    bone.add(part);
    slotMap.set(assetKey, part);
    return true;
  }

  unequip(assetKey: string): boolean {
    const entry = getAsset(assetKey);
    if (!entry) return false;
    const slot: MechSlot = entry.boneAnchor ?? 'spine';
    const slotMap = this.equipped.get(slot);
    if (!slotMap) return false;
    const part = slotMap.get(assetKey);
    if (!part) return false;
    part.parent?.remove(part);
    part.traverse((c) => {
      const m = c as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material;
      if (mat) {
        if (Array.isArray(mat)) mat.forEach((mm) => mm.dispose());
        else (mat as THREE.Material).dispose();
      }
    });
    slotMap.delete(assetKey);
    return true;
  }

  /** Snapshot of currently equipped parts, suitable for save/launch. */
  getEquippedKeys(): MechBuildSnapshot {
    const snapshot: MechBuildSnapshot = {
      bodyKey: 'mech_00_body',
      equipped: { right_hand: [], left_hand: [], right_shield: [], spine: [] },
      animKey: this.currentAction?.getClip().name ?? null,
    };
    for (const [slot, map] of this.equipped) {
      snapshot.equipped[slot] = Array.from(map.keys());
    }
    return snapshot;
  }

  // ── Lifecycle ───────────────────────────────────────────────

  private onResize = (): void => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private animate = (): void => {
    if (this.disposed) return;
    this.animFrame = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.controls.update();
    this.mixer?.update(dt);
    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.animFrame);
    window.removeEventListener('resize', this.onResize);
    this.controls.dispose();
    this.scene.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material;
      if (mat) {
        if (Array.isArray(mat)) mat.forEach((mm) => mm.dispose());
        else (mat as THREE.Material).dispose();
      }
    });
    this.fbxCache.clear();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
