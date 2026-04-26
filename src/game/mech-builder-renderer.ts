/**
 * mech-builder-renderer.ts — Mech_00 showcase scene.
 *
 * The Mech_00 asset pack is a set of modular FBXs (body, animation,
 * 15 attachments, 2 weapons) all authored with a SHARED MODELLING
 * ORIGIN. The right way to display the kit is to drop every part as a
 * sibling of the body at the same scale and pose — the artist already
 * baked the attachment offsets into each FBX's local coordinates.
 *
 * Bone-finding / restPose juggling broke alignment (parts under the
 * floor, weapons in the wrong axis) because Mech_00's rig isn't a
 * Mixamo-style humanoid — it's a custom symmetric rig where bones
 * don't have neutral world positions matching the attachment FBXs.
 * We don't fight it: every part is parented to the mech root at
 * (0,0,0) and shares the body's normalisation scale.
 *
 * Usage:
 *   const r = new MechBuilderRenderer(div);
 *   await r.init();             // loads body + auto-equips ALL Mech_00 parts
 *   r.playClip('Idle');
 *   r.dispose();
 */

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { resolvePathUrl, getAsset, getAssetsByTag, type WeaponBoneAnchor } from './asset-registry';

export type MechSlot = WeaponBoneAnchor; // 'right_hand' | 'left_hand' | 'right_shield' | 'spine'

export interface MechBuildSnapshot {
  /** Asset key of the mech body (always 'mech_00_body' for now). */
  bodyKey: string;
  /** Slot → list of asset keys equipped at that slot. */
  equipped: Record<MechSlot, string[]>;
  /** Currently playing animation clip name (null if none). */
  animKey: string | null;
}

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
  /** Body FBX's normalised scale (e.g. 2.0 / heightDim) — every attachment
   *  inherits this so kit pieces align with the body. */
  private bodyScale = 1;
  /** Y offset applied to plant the body on the floor; attachments mirror it. */
  private bodyYOffset = 0;
  private mixer: THREE.AnimationMixer | null = null;
  private clips: THREE.AnimationClip[] = [];
  private currentAction: THREE.AnimationAction | null = null;

  /** Mounted attachment groups, keyed by registry asset key. */
  private equipped: Map<string, THREE.Group> = new Map();

  constructor(container: HTMLElement) {
    this.container = container;
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
    await this.equipAllMechParts();

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
      const s = heightDim > 0 ? 2.0 / heightDim : 1;
      fbx.scale.setScalar(s);
      this.bodyScale = s;

      // Plant on floor: scaled bbox.min.y becomes 0.
      const baseBox = new THREE.Box3().setFromObject(fbx);
      const yOff = -baseBox.min.y;
      fbx.position.y = yOff;
      this.bodyYOffset = yOff;

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

  /**
   * Load every Mech_00 attachment + weapon registered in the asset
   * registry and parent them all to the scene at the same scale and
   * y-offset as the body. Because the source FBXs share a modelling
   * origin, this single transform aligns every part to the body
   * automatically (no bone-finding, no per-part offsets required).
   */
  private async equipAllMechParts(): Promise<void> {
    if (!this.mechRoot) return;

    // Pull every registry entry tagged 'mech' that isn't the body or anim.
    const all = getAssetsByTag('mech').filter((e) => e.key !== 'mech_00_body' && e.key !== 'mech_00_anim' && e.format === 'fbx');

    for (const entry of all) {
      try {
        const part = await this.loadFBXCached(entry.localPath);

        // Inherit the body's normalisation scale so the attachment is
        // measured in the same world units as the body.
        part.scale.setScalar(this.bodyScale);
        part.position.y = this.bodyYOffset;

        part.traverse((c) => {
          const m = c as THREE.Mesh;
          if (m.isMesh) {
            m.castShadow = true;
            m.receiveShadow = true;
          }
        });
        this.scene.add(part);
        this.equipped.set(entry.key, part);
      } catch (err) {
        console.warn('[MECH] part load failed', entry.key, err);
      }
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

  // ── Equip / unequip (origin-aligned) ───────────────────────────
  // Mech_00 attachments share the body's modelling origin, so we
  // simply parent each part to the scene at body-scale and body-Y.

  /** Equip a registered Mech_00 part. Returns true on success. */
  async equip(assetKey: string): Promise<boolean> {
    if (!this.mechRoot) return false;
    if (this.equipped.has(assetKey)) return true;
    const entry = getAsset(assetKey);
    if (!entry) return false;

    let part: THREE.Group;
    try {
      part = await this.loadFBXCached(entry.localPath);
    } catch (err) {
      console.warn('[MECH] part load failed', assetKey, err);
      return false;
    }

    part.scale.setScalar(this.bodyScale);
    part.position.y = this.bodyYOffset;

    part.traverse((c) => {
      const m = c as THREE.Mesh;
      if (m.isMesh) m.castShadow = true;
    });

    this.scene.add(part);
    this.equipped.set(assetKey, part);
    return true;
  }

  unequip(assetKey: string): boolean {
    const part = this.equipped.get(assetKey);
    if (!part) return false;
    this.scene.remove(part);
    part.traverse((c) => {
      const m = c as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material;
      if (mat) {
        if (Array.isArray(mat)) mat.forEach((mm) => mm.dispose());
        else (mat as THREE.Material).dispose();
      }
    });
    this.equipped.delete(assetKey);
    return true;
  }

  /** Snapshot of currently equipped parts, suitable for save/launch. */
  getEquippedKeys(): MechBuildSnapshot {
    const snapshot: MechBuildSnapshot = {
      bodyKey: 'mech_00_body',
      equipped: { right_hand: [], left_hand: [], right_shield: [], spine: [] },
      animKey: this.currentAction?.getClip().name ?? null,
    };
    // Bucket equipped keys by their registered boneAnchor slot for the
    // snapshot; the actual scene attachment uses origin-alignment.
    for (const key of this.equipped.keys()) {
      const e = getAsset(key);
      const slot: MechSlot = e?.boneAnchor ?? 'spine';
      snapshot.equipped[slot].push(key);
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
