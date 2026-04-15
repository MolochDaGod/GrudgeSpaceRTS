/**
 * ship-codex-3d.tsx ΓÇö Standalone Three.js showcase scene for the Ship Codex.
 *
 * Renders a single ship model on a cinematic space backdrop with fly-in animation.
 * Loads models via the same prefab system the game renderer uses (OBJ/FBX/GLB).
 * Completely independent of SpaceRenderer ΓÇö disposable lifecycle.
 */
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { loadModel as loadModelCentral } from './model-loader';
import { getShipPrefab, type SpacePrefab } from './space-prefabs';
import { TEAM_COLORS } from './space-types';
import { hasVoxelShip, buildVoxelShip, buildCapitalVoxelFallback } from './space-voxel-builder';

// ΓöÇΓöÇ Easing ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ΓöÇΓöÇ Codex Scene ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

  // Loaders
  private textureLoader = new THREE.TextureLoader();
  private objLoader = new OBJLoader();
  private mtlLoader = new MTLLoader();
  private fbxLoader = new FBXLoader();
  private gltfLoader = new GLTFLoader();

  // Animation
  private flyInProgress = 0; // 0..1, 1=done
  private flyInDuration = 0.8;
  private idleTime = 0;
  private targetY = 0;
  private startY = -15;

  // Starfield
  private starField!: THREE.Points;

  // Callbacks
  public onLoadStart?: () => void;
  public onLoadEnd?: () => void;

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

    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  // ΓöÇΓöÇ Cinematic 3-point lighting ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

  // ΓöÇΓöÇ Starfield background ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

  // ΓöÇΓöÇ Nebula orbs (subtle colored fog) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

  // ΓöÇΓöÇ Show a ship model ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  async showShip(shipKey: string) {
    if (shipKey === this.currentKey) return;
    this.currentKey = shipKey;

    // Remove current ship (drop down)
    if (this.currentShip) {
      const old = this.currentShip;
      this.currentShip = null;
      // Quick fade-out: just remove
      this.scene.remove(old);
    }

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

    // Start fly-in from below
    model.position.set(0, this.startY, 0);
    this.scene.add(model);
    this.currentShip = model;
    this.flyInProgress = 0;
    this.idleTime = 0;
    this.onLoadEnd?.();
  }

  // ── Model loading (GLB-primary via central loader) ───────────────
  private async loadModel(prefab: SpacePrefab): Promise<THREE.Group> {
    const key = prefab.modelPath;
    if (this.modelCache.has(key)) return this.modelCache.get(key)!.clone();
    if (this.loadingModels.has(key)) return (await this.loadingModels.get(key)!).clone();

    const promise = (async () => {
      let group: THREE.Group;

      if (prefab.format === 'glb' || prefab.format === 'gltf') {
        // Primary GLB path — uses central loader with DRACO + PBR enhancement
        const result = await loadModelCentral(prefab.modelPath);
        group = result.scene;
      } else if (prefab.format === 'fbx') {
        // Legacy FBX path
        group = (await this.fbxLoader.loadAsync(prefab.modelPath)) as unknown as THREE.Group;
        if (prefab.texturePath) {
          const tex = this.textureLoader.load(prefab.texturePath);
          group.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).material = new THREE.MeshStandardMaterial({ map: tex });
          });
        }
      } else {
        // Legacy OBJ path
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

  // ΓöÇΓöÇ Team tint ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  private tintModel(model: THREE.Object3D, team: number) {
    const hex = TEAM_COLORS[team] ?? 0x4488ff;
    const tintColor = new THREE.Color(hex);
    model.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        if (!mat || !(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) continue;
        const stdMat = (mat as THREE.MeshStandardMaterial).clone();
        stdMat.emissive.lerp(tintColor, 0.35);
        stdMat.emissiveIntensity = Math.max(stdMat.emissiveIntensity, 0.2);
        stdMat.color.lerp(tintColor, 0.1);
        mesh.material = stdMat;
      }
    });
  }

  // ΓöÇΓöÇ Animation loop ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  private animate = () => {
    if (this.disposed) return;
    this.animFrame = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);

    // Slow starfield rotation
    if (this.starField) this.starField.rotation.y += dt * 0.003;

    // Ship animation
    if (this.currentShip) {
      if (this.flyInProgress < 1) {
        this.flyInProgress = Math.min(1, this.flyInProgress + dt / this.flyInDuration);
        const t = easeOutBack(this.flyInProgress);
        this.currentShip.position.y = this.startY + (this.targetY - this.startY) * t;
      } else {
        this.idleTime += dt;
        // Gentle bob
        this.currentShip.position.y = this.targetY + Math.sin(this.idleTime * 1.2) * 0.15;
      }
      // Slow rotation
      this.currentShip.rotation.y += dt * 0.3;
    }

    this.renderer.render(this.scene, this.camera);
  };

  // ΓöÇΓöÇ Resize ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  private onResize = () => {
    if (this.disposed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  // ΓöÇΓöÇ Dispose ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.animFrame);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
