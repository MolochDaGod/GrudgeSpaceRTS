import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { getShipPrefab, BACKGROUND_LAYERS, STATION_PREFABS, EFFECT_PREFABS, type SpacePrefab } from './space-prefabs';
import { type SpaceGameState, type SpaceShip, type Planet, type Team, TEAM_COLORS, MAP_WIDTH, MAP_HEIGHT, SHIP_DEFINITIONS } from './space-types';
import { SpaceControls } from './space-controls';
import { SpaceEngine } from './space-engine';
import { applyShipAnimation } from './space-animations';
import { SpaceEffectsRenderer } from './space-effects';

interface ShipMesh3D {
  group: THREE.Group;
  healthBar?: THREE.Mesh;
  healthBg?: THREE.Mesh;
  shieldBar?: THREE.Mesh;
  selectionRing?: THREE.Mesh;
}

const WORLD_SCALE = 0.05;

export class SpaceRenderer {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private container: HTMLElement;
  private clock = new THREE.Clock();

  private shipMeshes = new Map<number, ShipMesh3D>();
  private stationMeshes = new Map<number, THREE.Group>();
  private towerMeshes = new Map<number, THREE.Group>();
  private planetMeshes: THREE.Mesh[] = [];
  private projectileMeshes = new Map<number, THREE.Mesh>();

  private modelCache = new Map<string, THREE.Group>();
  private loadingModels = new Map<string, Promise<THREE.Group>>();
  private textureLoader = new THREE.TextureLoader();
  private objLoader = new OBJLoader();
  private mtlLoader = new MTLLoader();
  private fbxLoader = new FBXLoader();
  private gltfLoader = new GLTFLoader();

  private selectionBoxDiv!: HTMLDivElement;
  private starField!: THREE.Points;

  private controls!: SpaceControls;
  public engine!: SpaceEngine;
  private effectsRenderer!: SpaceEffectsRenderer;

  private disposed = false;
  private animFrame = 0;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async init() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020408);

    this.camera = new THREE.PerspectiveCamera(50, this.container.clientWidth / this.container.clientHeight, 1, 5000);
    this.camera.position.set(0, 120, 80);
    this.camera.lookAt(0, 0, 0);

    this.setupLighting();
    this.setupStarfield();
    this.setupBackground();
    this.setupSelectionBox();

    this.engine = new SpaceEngine();
    this.engine.initGame();

    this.controls = new SpaceControls(this.container, this.camera, this.engine.state, this.renderer);
    this.effectsRenderer = new SpaceEffectsRenderer(this.scene);

    this.buildPlanets();

    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  private setupLighting() {
    const ambient = new THREE.AmbientLight(0x223344, 0.6);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
    sun.position.set(200, 300, 100);
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x4466aa, 0.3);
    fill.position.set(-100, 100, -200);
    this.scene.add(fill);

    const rim = new THREE.PointLight(0xff6633, 0.4, 600);
    rim.position.set(0, 50, -300);
    this.scene.add(rim);
  }

  private setupStarfield() {
    const count = 8000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = 800 + Math.random() * 1500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      const brightness = 0.5 + Math.random() * 0.5;
      const tint = Math.random();
      colors[i3] = brightness * (tint > 0.8 ? 1.0 : 0.8);
      colors[i3 + 1] = brightness * (tint > 0.6 ? 0.9 : 0.7);
      colors[i3 + 2] = brightness;
      sizes[i] = 1 + Math.random() * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({ size: 1.5, vertexColors: true, sizeAttenuation: true, transparent: true, opacity: 0.9 });
    this.starField = new THREE.Points(geo, mat);
    this.scene.add(this.starField);
  }

  private setupBackground() {
    // Large background plane with space texture
    const tex = this.textureLoader.load(BACKGROUND_LAYERS.blue.withStars);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    const bgGeo = new THREE.PlaneGeometry(4000, 4000);
    const bgMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.3, depthWrite: false });
    const bgMesh = new THREE.Mesh(bgGeo, bgMat);
    bgMesh.rotation.x = -Math.PI / 2;
    bgMesh.position.y = -50;
    this.scene.add(bgMesh);
  }

  private setupSelectionBox() {
    this.selectionBoxDiv = document.createElement('div');
    Object.assign(this.selectionBoxDiv.style, {
      position: 'absolute', border: '1px solid #4488ff', backgroundColor: 'rgba(68, 136, 255, 0.15)',
      pointerEvents: 'none', display: 'none', zIndex: '50',
    });
    this.container.appendChild(this.selectionBoxDiv);
  }

  private buildPlanets() {
    for (const planet of this.engine.state.planets) {
      const geo = new THREE.SphereGeometry(planet.radius * WORLD_SCALE, 32, 32);
      const mat = new THREE.MeshStandardMaterial({ color: planet.color, roughness: 0.7, metalness: 0.2 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(planet.x * WORLD_SCALE, planet.z * WORLD_SCALE, planet.y * WORLD_SCALE);
      this.scene.add(mesh);
      this.planetMeshes.push(mesh);

      // Orbit ring
      const ringGeo = new THREE.RingGeometry(planet.radius * WORLD_SCALE * 1.3, planet.radius * WORLD_SCALE * 1.35, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x334466, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.copy(mesh.position);
      this.scene.add(ring);
    }
  }

  // ── Model Loading ───────────────────────────────────────────
  private async loadModel(prefab: SpacePrefab): Promise<THREE.Group> {
    const key = prefab.modelPath;
    if (this.modelCache.has(key)) return this.modelCache.get(key)!.clone();
    if (this.loadingModels.has(key)) {
      const model = await this.loadingModels.get(key)!;
      return model.clone();
    }

    const promise = (async () => {
      let group: THREE.Group;
      if (prefab.format === 'glb') {
        const gltf = await this.gltfLoader.loadAsync(prefab.modelPath);
        group = gltf.scene;
      } else if (prefab.format === 'fbx') {
        group = await this.fbxLoader.loadAsync(prefab.modelPath) as unknown as THREE.Group;
        if (prefab.texturePath) {
          const tex = this.textureLoader.load(prefab.texturePath);
          group.traverse(c => { if ((c as THREE.Mesh).isMesh) { (c as THREE.Mesh).material = new THREE.MeshStandardMaterial({ map: tex }); } });
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
          group.traverse(c => { if ((c as THREE.Mesh).isMesh) { (c as THREE.Mesh).material = new THREE.MeshStandardMaterial({ map: tex }); } });
        }
      }
      group.scale.setScalar(prefab.scale);
      if (prefab.offset) group.position.add(prefab.offset);
      if (prefab.rotation) group.rotation.copy(prefab.rotation);
      this.modelCache.set(key, group);
      this.loadingModels.delete(key);
      return group;
    })();

    this.loadingModels.set(key, promise);
    const result = await promise;
    return result.clone();
  }

  private createPlaceholder(team: Team, shipClass: string): THREE.Group {
    const group = new THREE.Group();
    const size = shipClass === 'battleship' ? 3 : shipClass === 'cruiser' ? 2 : shipClass === 'destroyer' ? 1.5 : 0.6;
    const geo = new THREE.ConeGeometry(size * 0.5, size, 6);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({ color: TEAM_COLORS[team], emissive: TEAM_COLORS[team], emissiveIntensity: 0.3 });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
    return group;
  }

  // ── Sync Game State to 3D ───────────────────────────────────
  private syncShips(state: SpaceGameState, dt: number) {
    // Remove dead ships
    for (const [id, mesh] of this.shipMeshes) {
      if (!state.ships.has(id) || state.ships.get(id)!.dead) {
        this.scene.remove(mesh.group);
        this.shipMeshes.delete(id);
      }
    }

    // Add/update ships
    for (const [id, ship] of state.ships) {
      if (ship.dead) continue;
      let meshData = this.shipMeshes.get(id);

      if (!meshData) {
        // Create placeholder immediately, load real model async
        const group = this.createPlaceholder(ship.team, ship.shipClass);
        this.scene.add(group);
        meshData = { group };
        this.shipMeshes.set(id, meshData);

        // Add selection ring
        const ringGeo = new THREE.RingGeometry(0.8, 1.0, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -0.2;
        group.add(ring);
        meshData.selectionRing = ring;

        // Add health bar
        const hbBg = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.15), new THREE.MeshBasicMaterial({ color: 0x333333, depthTest: false }));
        hbBg.position.y = 1.5;
        hbBg.renderOrder = 999;
        group.add(hbBg);
        meshData.healthBg = hbBg;

        const hb = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.15), new THREE.MeshBasicMaterial({ color: TEAM_COLORS[ship.team], depthTest: false }));
        hb.position.y = 1.5;
        hb.renderOrder = 1000;
        group.add(hb);
        meshData.healthBar = hb;

        // Try to load real model
        const prefab = getShipPrefab(ship.shipType);
        if (prefab) {
          this.loadModel(prefab).then(model => {
            if (this.disposed) return;
            const existing = this.shipMeshes.get(id);
            if (!existing) return;
            // Replace placeholder cone
            const placeholder = existing.group.children.find(c => (c as THREE.Mesh).geometry?.type === 'ConeGeometry');
            if (placeholder) existing.group.remove(placeholder);
            existing.group.add(model);
          }).catch(() => { /* keep placeholder */ });
        }
      }

      // Update position
      meshData.group.position.set(ship.x * WORLD_SCALE, ship.z * WORLD_SCALE, ship.y * WORLD_SCALE);
      meshData.group.rotation.y = -ship.facing;

      // Apply procedural animation
      applyShipAnimation(meshData.group, ship, dt);

      // Update health bar
      if (meshData.healthBar) {
        const pct = ship.hp / ship.maxHp;
        meshData.healthBar.scale.x = Math.max(0.01, pct);
        meshData.healthBar.position.x = -(1 - pct) * 0.75;
        (meshData.healthBar.material as THREE.MeshBasicMaterial).color.setHex(pct > 0.5 ? 0x44ff44 : pct > 0.25 ? 0xffaa00 : 0xff4444);
        // Face camera
        meshData.healthBar.lookAt(this.camera.position);
        meshData.healthBg!.lookAt(this.camera.position);
      }

      // Selection ring
      if (meshData.selectionRing) {
        const mat = meshData.selectionRing.material as THREE.MeshBasicMaterial;
        mat.opacity = ship.selected ? 0.8 : 0;
        mat.color.setHex(ship.team === 1 ? 0x44ff44 : 0xff4444);
      }
    }
  }

  private syncProjectiles(state: SpaceGameState) {
    for (const [id, mesh] of this.projectileMeshes) {
      if (!state.projectiles.has(id)) {
        this.scene.remove(mesh);
        this.projectileMeshes.delete(id);
      }
    }

    for (const [id, proj] of state.projectiles) {
      let mesh = this.projectileMeshes.get(id);
      if (!mesh) {
        const geo = proj.type === 'missile'
          ? new THREE.ConeGeometry(0.15, 0.6, 4)
          : new THREE.CylinderGeometry(0.05, 0.05, 0.8, 4);
        geo.rotateX(Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({ color: proj.trailColor });
        mesh = new THREE.Mesh(geo, mat);
        this.scene.add(mesh);
        this.projectileMeshes.set(id, mesh);
      }
      mesh.position.set(proj.x * WORLD_SCALE, proj.z * WORLD_SCALE, proj.y * WORLD_SCALE);
      mesh.lookAt(
        (proj.x + proj.vx) * WORLD_SCALE,
        (proj.z + proj.vz) * WORLD_SCALE,
        (proj.y + proj.vy) * WORLD_SCALE,
      );
    }
  }

  // ── Selection Box UI ────────────────────────────────────────
  private updateSelectionBox() {
    const sel = this.controls.selectionBox;
    if (sel.active) {
      const left = Math.min(sel.startX, sel.endX);
      const top = Math.min(sel.startY, sel.endY);
      const w = Math.abs(sel.endX - sel.startX);
      const h = Math.abs(sel.endY - sel.startY);
      Object.assign(this.selectionBoxDiv.style, {
        display: 'block', left: `${left}px`, top: `${top}px`, width: `${w}px`, height: `${h}px`,
      });
    } else {
      this.selectionBoxDiv.style.display = 'none';
    }
  }

  // ── Camera ──────────────────────────────────────────────────
  private updateCamera() {
    const cam = this.controls.cameraState;
    const dist = cam.zoom;
    const angle = cam.angle * (Math.PI / 180);
    this.camera.position.set(
      cam.x * WORLD_SCALE,
      dist * Math.sin(angle),
      cam.y * WORLD_SCALE + dist * Math.cos(angle),
    );
    this.camera.lookAt(cam.x * WORLD_SCALE, 0, cam.y * WORLD_SCALE);
  }

  // ── Main Loop ───────────────────────────────────────────────
  private animate = () => {
    if (this.disposed) return;
    this.animFrame = requestAnimationFrame(this.animate);

    const dt = Math.min(this.clock.getDelta(), 0.05);

    // Update game logic
    this.engine.update(dt);
    this.controls.update(dt);

    // Sync 3D
    this.syncShips(this.engine.state, dt);
    this.syncProjectiles(this.engine.state);
    this.effectsRenderer.update(this.engine.state, dt, this.camera);
    this.updateSelectionBox();
    this.updateCamera();

    // Slowly rotate starfield
    this.starField.rotation.y += dt * 0.002;

    this.renderer.render(this.scene, this.camera);
  };

  private onResize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  /** Activate a specific ability on all selected ships (called from UI) */
  activateAbility(abilityIndex: number) {
    const state = this.engine.state;
    for (const id of state.selectedIds) {
      const ship = state.ships.get(id);
      if (!ship || ship.dead) continue;
      const ab = ship.abilities[abilityIndex];
      if (!ab || ab.active || ab.cooldownRemaining > 0) continue;
      const res = state.resources[ship.team];
      if (res.energy < ab.ability.energyCost) continue;
      ab.active = true;
      ab.activeTimer = ab.ability.duration;
      ab.cooldownRemaining = ab.ability.cooldown;
      res.energy -= ab.ability.energyCost;
      ship.animTimer = 0;
    }
  }

  /** Toggle autocast on a specific ability for all selected ships */
  toggleAutoCast(abilityIndex: number) {
    const state = this.engine.state;
    // Determine majority state to flip
    let onCount = 0, total = 0;
    for (const id of state.selectedIds) {
      const ship = state.ships.get(id);
      if (!ship || ship.dead) continue;
      const ab = ship.abilities[abilityIndex];
      if (!ab) continue;
      total++;
      if (ab.autoCast) onCount++;
    }
    const newState = onCount <= total / 2;
    for (const id of state.selectedIds) {
      const ship = state.ships.get(id);
      if (!ship || ship.dead) continue;
      const ab = ship.abilities[abilityIndex];
      if (ab) ab.autoCast = newState;
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.animFrame);
    window.removeEventListener('resize', this.onResize);
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    if (this.selectionBoxDiv.parentNode) {
      this.selectionBoxDiv.parentNode.removeChild(this.selectionBoxDiv);
    }
  }
}
