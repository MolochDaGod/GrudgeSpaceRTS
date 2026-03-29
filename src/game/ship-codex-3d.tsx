/**
 * ship-codex-3d.tsx — Standalone Three.js showcase scene for the Ship Codex.
 *
 * Renders a single ship model on a cinematic space backdrop with fly-in animation.
 * Loads models via the same prefab system the game renderer uses (OBJ/FBX/GLB).
 * Completely independent of SpaceRenderer — disposable lifecycle.
 */
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { getShipPrefab, type SpacePrefab } from './space-prefabs';
import { TEAM_COLORS } from './space-types';
import { hasVoxelShip, buildVoxelShip, buildCapitalVoxelFallback } from './space-voxel-builder';

// ── Easing ─────────────────────────────────────────────────────────
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
function easeInQuad(t: number): number {
  return t * t;
}

// ── Codex Scene ────────────────────────────────────────────────────
export class CodexScene {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private disposed = false;
  private animFrame = 0;

  // Model state
  private currentShip: THREE.Group | null = null;
  private currentKey = '';
  private modelCache = new Map<string, THREE.Group>();
  private loadingModels = new Map<string, Promise<THREE.Group>>();

  // Exiting ship (animates out while new one enters)
  private exitingShip: THREE.Group | null = null;
  private exitProgress = 0;
  private exitDuration = 0.4;
  private exitStartPos = new THREE.Vector3();
  private exitEndPos = new THREE.Vector3(4, -14, 0);

  // Loaders
  private textureLoader = new THREE.TextureLoader();
  private objLoader = new OBJLoader();
  private mtlLoader = new MTLLoader();
  private fbxLoader = new FBXLoader();
  private gltfLoader = new GLTFLoader();

  // Animation — diagonal fly-in from top-left to center
  private flyInProgress = 0; // 0..1, 1=done
  private flyInDuration = 0.9;
  private idleTime = 0;
  private startPos = new THREE.Vector3(-14, 10, 0); // top-left off-screen
  private targetPos = new THREE.Vector3(0, 0, 0); // center

  // Mouse drag rotation
  private shipYaw = 0; // current Y rotation (radians)
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private yawAtDragStart = 0;
  private cameraPitch = 0;
  private pitchAtDragStart = 0;
  private baseCameraPitch = 0.15; // slight downward tilt

  // Front-direction arrow indicator
  private frontArrow: THREE.Group | null = null;

  // Starfield
  private starField!: THREE.Points;

  // Callbacks
  public onLoadStart?: () => void;
  public onLoadEnd?: () => void;
  public onYawChange?: (yaw: number) => void;

  /** Get the current ship yaw in degrees (0-360). */
  getShipYaw(): number {
    return ((((this.shipYaw * 180) / Math.PI) % 360) + 360) % 360;
  }

  constructor(private container: HTMLElement) {}

  init() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.4;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x010308);

    this.camera = new THREE.PerspectiveCamera(40, this.container.clientWidth / this.container.clientHeight, 0.1, 2000);
    this.camera.position.set(0, 2, 12);
    this.camera.lookAt(0, 0, 0);

    this.setupLighting();
    this.setupStarfield();
    this.setupNebula();
    this.setupFrontArrow();

    // Mouse drag events for ship rotation
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseDrag);
    window.addEventListener('mouseup', this.onMouseUp);

    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  // ── Cinematic 3-point lighting ──────────────────────────────────
  private setupLighting() {
    // Ambient: subtle blue-space fill
    this.scene.add(new THREE.AmbientLight(0x334466, 0.8));

    // Key light: blue-white from upper right
    const key = new THREE.DirectionalLight(0xddeeff, 2.2);
    key.position.set(8, 10, 6);
    this.scene.add(key);

    // Fill: warm dim from lower left
    const fill = new THREE.DirectionalLight(0xffaa66, 0.4);
    fill.position.set(-6, -2, 4);
    this.scene.add(fill);

    // Rim: accent from behind
    const rim = new THREE.PointLight(0x4488ff, 1.2, 50);
    rim.position.set(0, 3, -10);
    this.scene.add(rim);

    // Hemisphere for overall tone
    this.scene.add(new THREE.HemisphereLight(0x6688cc, 0x221133, 0.5));
  }

  // ── Starfield background ────────────────────────────────────────
  private setupStarfield() {
    const count = 4000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = 200 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      const b = 0.4 + Math.random() * 0.6;
      colors[i3] = b * 0.8;
      colors[i3 + 1] = b * 0.9;
      colors[i3 + 2] = b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 1.5, vertexColors: true, sizeAttenuation: true, transparent: true, opacity: 0.85 });
    this.starField = new THREE.Points(geo, mat);
    this.scene.add(this.starField);
  }

  // ── Nebula orbs (subtle colored fog) ────────────────────────────
  private setupNebula() {
    const nebColors = [0x0a3cc8, 0x6e0ac8, 0xb41e0a, 0x00826e];
    for (const col of nebColors) {
      const geo = new THREE.SphereGeometry(40 + Math.random() * 30, 16, 16);
      const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.025, side: THREE.BackSide });
      const orb = new THREE.Mesh(geo, mat);
      orb.position.set((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 40, -60 - Math.random() * 80);
      this.scene.add(orb);
    }
  }

  // ── Front-direction arrow on ground plane ─────────────────────────
  private setupFrontArrow() {
    const group = new THREE.Group();
    // Arrow shaft
    const shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8);
    shaftGeo.rotateX(Math.PI / 2);
    shaftGeo.translate(0, 0, 1.25);
    const shaftMat = new THREE.MeshBasicMaterial({ color: 0x44ee88, transparent: true, opacity: 0.6 });
    group.add(new THREE.Mesh(shaftGeo, shaftMat));
    // Arrow head
    const headGeo = new THREE.ConeGeometry(0.15, 0.4, 8);
    headGeo.rotateX(Math.PI / 2);
    headGeo.translate(0, 0, 2.7);
    const headMat = new THREE.MeshBasicMaterial({ color: 0x44ee88, transparent: true, opacity: 0.8 });
    group.add(new THREE.Mesh(headGeo, headMat));
    // Ring at base
    const ringGeo = new THREE.RingGeometry(2.8, 3.0, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x44ee88, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
    group.add(new THREE.Mesh(ringGeo, ringMat));
    // "FRONT" label direction tick marks at cardinal points
    for (let i = 0; i < 4; i++) {
      const tickGeo = new THREE.BoxGeometry(0.06, 0.01, 0.25);
      const tick = new THREE.Mesh(tickGeo, new THREE.MeshBasicMaterial({ color: 0x44ee88, transparent: true, opacity: 0.3 }));
      const angle = (i * Math.PI) / 2;
      tick.position.set(Math.sin(angle) * 2.9, 0, Math.cos(angle) * 2.9);
      tick.rotation.y = angle;
      group.add(tick);
    }
    group.position.y = -2.8; // below ship
    group.visible = false;
    this.scene.add(group);
    this.frontArrow = group;
  }

  // ── Mouse drag handlers for rotation ──────────────────────────────
  private onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.yawAtDragStart = this.shipYaw;
    this.pitchAtDragStart = this.cameraPitch;
  };
  private onMouseDrag = (e: MouseEvent) => {
    if (!this.isDragging) return;
    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;
    this.shipYaw = this.yawAtDragStart + dx * 0.008;
    this.cameraPitch = Math.max(-0.4, Math.min(0.6, this.pitchAtDragStart + dy * 0.003));
    this.onYawChange?.(this.getShipYaw());
  };
  private onMouseUp = () => {
    this.isDragging = false;
  };

  // ── Show a ship model ───────────────────────────────────────────
  async showShip(shipKey: string) {
    if (shipKey === this.currentKey) return;
    this.currentKey = shipKey;

    // Animate old ship out (exit downward-right)
    if (this.currentShip) {
      // If already exiting a ship, remove it instantly
      if (this.exitingShip) this.scene.remove(this.exitingShip);
      this.exitingShip = this.currentShip;
      this.exitStartPos.copy(this.currentShip.position);
      this.exitProgress = 0;
      this.currentShip = null;
    }

    // Hide front arrow during transition
    if (this.frontArrow) this.frontArrow.visible = false;

    this.onLoadStart?.();

    // Load model
    const prefab = getShipPrefab(shipKey);
    let model: THREE.Group | null = null;

    if (prefab) {
      try {
        model = await this.loadModel(prefab);
      } catch {
        // Fall back to voxel
      }
    }

    // Voxel fallback
    if (!model) {
      if (hasVoxelShip(shipKey)) {
        model = buildVoxelShip(shipKey, 1);
      } else {
        model = buildCapitalVoxelFallback(shipKey, 1);
      }
    }

    // Placeholder if nothing works
    if (!model) {
      model = new THREE.Group();
      const geo = new THREE.ConeGeometry(0.6, 2, 6);
      geo.rotateX(Math.PI / 2);
      model.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x4488ff, emissive: 0x4488ff, emissiveIntensity: 0.5 })));
    }

    // Bail if user already switched to another ship
    if (this.currentKey !== shipKey) {
      this.onLoadEnd?.();
      return;
    }

    // Auto-fit to showcase size
    const box = new THREE.Box3().setFromObject(model);
    const diam = box.getSize(new THREE.Vector3()).length();
    const targetSize = 5;
    if (diam > 0) model.scale.setScalar(targetSize / diam);

    // Team tint
    this.tintModel(model, 1);

    // Start fly-in from top-left (diagonal entry)
    model.position.copy(this.startPos);
    model.rotation.y = this.shipYaw; // preserve user's orientation
    this.scene.add(model);
    this.currentShip = model;
    this.flyInProgress = 0;
    this.idleTime = 0;
    this.onLoadEnd?.();
  }

  // ── Model loading (mirrors space-renderer) ──────────────────────
  private async loadModel(prefab: SpacePrefab): Promise<THREE.Group> {
    const key = prefab.modelPath;
    if (this.modelCache.has(key)) return this.modelCache.get(key)!.clone();
    if (this.loadingModels.has(key)) return (await this.loadingModels.get(key)!).clone();

    const promise = (async () => {
      let group: THREE.Group;
      if (prefab.format === 'glb') {
        const gltf = await this.gltfLoader.loadAsync(prefab.modelPath);
        group = gltf.scene;
      } else if (prefab.format === 'fbx') {
        group = (await this.fbxLoader.loadAsync(prefab.modelPath)) as unknown as THREE.Group;
        if (prefab.texturePath) {
          const tex = this.textureLoader.load(prefab.texturePath);
          group.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).material = new THREE.MeshStandardMaterial({ map: tex });
          });
        }
      } else {
        if (prefab.mtlPath) {
          const mats = await this.mtlLoader.loadAsync(prefab.mtlPath);
          mats.preload();
          const loader = new OBJLoader();
          loader.setMaterials(mats);
          group = await loader.loadAsync(prefab.modelPath);
        } else {
          group = await this.objLoader.loadAsync(prefab.modelPath);
        }
        if (prefab.texturePath) {
          const tex = this.textureLoader.load(prefab.texturePath);
          group.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).material = new THREE.MeshStandardMaterial({ map: tex });
          });
        }
      }
      if (prefab.offset) group.position.add(prefab.offset);
      if (prefab.rotation) group.rotation.copy(prefab.rotation);
      this.modelCache.set(key, group);
      this.loadingModels.delete(key);
      return group;
    })();
    this.loadingModels.set(key, promise);
    return (await promise).clone();
  }

  // ── Team tint (HSL hue-shift) ────────────────────────────────────
  private tintModel(model: THREE.Object3D, team: number) {
    const hex = TEAM_COLORS[team] ?? 0x4488ff;
    const teamColor = new THREE.Color(hex);
    const teamHSL = { h: 0, s: 0, l: 0 };
    teamColor.getHSL(teamHSL);

    model.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        if (!mat || !(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) continue;
        const stdMat = (mat as THREE.MeshStandardMaterial).clone();
        // HSL hue-shift: replace hue, keep sat/lightness
        const srcHSL = { h: 0, s: 0, l: 0 };
        stdMat.color.getHSL(srcHSL);
        stdMat.color.setHSL(teamHSL.h, Math.max(srcHSL.s, 0.5), Math.min(Math.max(srcHSL.l, 0.25), 0.7));
        stdMat.emissive.setHSL(teamHSL.h, teamHSL.s, 0.15);
        stdMat.emissiveIntensity = 0.4;
        mesh.material = stdMat;
      }
    });
  }

  // ── Animation loop ──────────────────────────────────────────────
  private animate = () => {
    if (this.disposed) return;
    this.animFrame = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);

    // Slow starfield rotation
    if (this.starField) this.starField.rotation.y += dt * 0.003;

    // ── Exit animation (old ship drops out downward-right) ──────
    if (this.exitingShip) {
      this.exitProgress = Math.min(1, this.exitProgress + dt / this.exitDuration);
      const t = easeInQuad(this.exitProgress);
      this.exitingShip.position.lerpVectors(this.exitStartPos, this.exitEndPos, t);
      this.exitingShip.rotation.x = t * 0.4; // slight tumble
      if (this.exitProgress >= 1) {
        this.scene.remove(this.exitingShip);
        this.exitingShip = null;
      }
    }

    // ── Fly-in animation (new ship enters from top-left) ────────
    if (this.currentShip) {
      if (this.flyInProgress < 1) {
        this.flyInProgress = Math.min(1, this.flyInProgress + dt / this.flyInDuration);
        const t = easeOutBack(this.flyInProgress);
        this.currentShip.position.lerpVectors(this.startPos, this.targetPos, t);
        // Slight spin during entry
        this.currentShip.rotation.y = this.shipYaw + (1 - t) * Math.PI * 0.4;
      } else {
        this.idleTime += dt;
        // Gentle bob at center
        this.currentShip.position.x = this.targetPos.x;
        this.currentShip.position.y = this.targetPos.y + Math.sin(this.idleTime * 1.2) * 0.12;
        this.currentShip.position.z = this.targetPos.z;
        // Apply user-controlled yaw (no auto-rotate)
        this.currentShip.rotation.y = this.shipYaw;

        // Show front direction arrow
        if (this.frontArrow) {
          this.frontArrow.visible = true;
          this.frontArrow.rotation.y = this.shipYaw;
        }
      }
    }

    // ── Camera: slight pitch control from drag ──────────────────
    const pitchOffset = this.cameraPitch + this.baseCameraPitch;
    this.camera.position.set(0, 2 + pitchOffset * 6, 12);
    this.camera.lookAt(0, pitchOffset * 2, 0);

    this.renderer.render(this.scene, this.camera);
  };

  // ── Resize ──────────────────────────────────────────────────────
  private onResize = () => {
    if (this.disposed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  // ── Dispose ─────────────────────────────────────────────────────
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.animFrame);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseDrag);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
