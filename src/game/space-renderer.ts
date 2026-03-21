import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { getShipPrefab, BACKGROUND_LAYERS, STATION_PREFABS, EFFECT_PREFABS, type SpacePrefab } from './space-prefabs';
import { type SpaceGameState, type SpaceShip, type SpaceStation, type Planet, type Team, TEAM_COLORS, MAP_WIDTH, MAP_HEIGHT, SHIP_DEFINITIONS, CAPTURE_TIME, type GameMode } from './space-types';
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

  public controls!: SpaceControls;
  public engine!: SpaceEngine;
  private effectsRenderer!: SpaceEffectsRenderer;

  private disposed = false;
  private animFrame = 0;
  private captureRings = new Map<number, THREE.Mesh>();
  private gameMode: GameMode = '1v1';
  private nodeMeshes = new Map<number, THREE.Mesh>();

  // ── Animated background ─────────────────────────────────
  private twinkleLayers: THREE.Points[] = [];
  private twinkleTime = 0;
  private bgPlanes: Array<{ mesh: THREE.Mesh; drift: { vx: number; vz: number } }> = [];

  // ── Cinematic intro ─────────────────────────────────────
  // On game start: fully zoomed out showing whole sector, then eases in
  // to a comfortable orbital view over the player’s home world.
  private introActive = false;
  private introTimer  = 0;
  private readonly introDuration  = 4.2;   // seconds
  private readonly introZoomStart = 2400;   // deep-space — full sector visible
  private readonly introZoomEnd   = 160;    // close orbit — home world prominent

  constructor(container: HTMLElement, mode: GameMode = '1v1') {
    this.container = container;
    this.gameMode = mode;
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

    // Far plane 12 000: supports camera distance up to ~2400 zoom (≈1966 height)
    // + star field radius up to 6000 + margin (max camera-to-star ≈ 8400 < 12 000).
    this.camera = new THREE.PerspectiveCamera(50, this.container.clientWidth / this.container.clientHeight, 0.5, 12000);
    this.camera.position.set(0, 120, 80);
    this.camera.lookAt(0, 0, 0);

    this.setupLighting();
    this.setupStarfield();
    this.setupBackground();
    this.setupSelectionBox();

    this.engine = new SpaceEngine();
    this.engine.initGame(this.gameMode);

    this.controls = new SpaceControls(this.container, this.camera, this.engine.state, this.renderer);
    this.effectsRenderer = new SpaceEffectsRenderer(this.scene);

    this.buildPlanets();
    this.buildResourceNodes();

    // ─ Cinematic intro: center on player's home world, start deep-out ───
    const homePlanet = this.engine.state.planets.find(
      p => p.isStartingPlanet && p.owner === 1,
    );
    if (homePlanet) {
      this.controls.cameraState.x    = homePlanet.x;
      this.controls.cameraState.y    = homePlanet.y;
      this.controls.cameraState.zoom = this.introZoomStart;
      this.introActive = true;
      // Let the player skip by scrolling
      this.controls.onIntroCancel = () => {
        this.introActive = false;
        this.controls.cameraState.zoom = this.introZoomEnd;
      };
    }

    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  private setupLighting() {
    // Brighter lighting for better model visibility
    const ambient = new THREE.AmbientLight(0x556688, 1.4);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffeedd, 2.0);
    sun.position.set(200, 400, 100);
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x6688cc, 0.8);
    fill.position.set(-200, 200, -200);
    this.scene.add(fill);

    const rim = new THREE.PointLight(0xff8844, 0.6, 1000);
    rim.position.set(0, 80, -400);
    this.scene.add(rim);

    // Extra hemisphere light for overall brightness
    const hemi = new THREE.HemisphereLight(0x88aacc, 0x334466, 0.6);
    this.scene.add(hemi);
  }

  private setupStarfield() {
    // ── Layer 1: Far star field ─────────────────────────────────
    const count = 8000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // r=400-1600: visible at normal zoom (sizeAttenuation pixel size ≈1-4px)
      // and still renders at max zoom (stars beyond camera simply get culled by GPU).
      const r = 400 + Math.random() * 1200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      const brightness = 0.4 + Math.random() * 0.6;
      const tint = Math.random();
      // Slight blue-white hue variety
      colors[i3]     = brightness * (tint > 0.85 ? 1.0 : 0.75);
      colors[i3 + 1] = brightness * (tint < 0.12 ? 0.65 : 0.87);
      colors[i3 + 2] = brightness;
      sizes[i] = 0.6 + Math.random() * 2.2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      // Slightly larger so stars remain visible at mid-zoom distances.
      size: 2.0, vertexColors: true, sizeAttenuation: true,
      transparent: true, opacity: 0.9,
    });
    this.starField = new THREE.Points(geo, mat);
    this.scene.add(this.starField);

    // ── Layer 2: Twinkling bright stars (custom shader) ─────────
    const count2 = 450;
    const pos2 = new Float32Array(count2 * 3);
    const twinkleOffsets = new Float32Array(count2);
    for (let i = 0; i < count2; i++) {
      const i3 = i * 3;
      // Fixed pixel size in shader — visible at any distance.
      const r = 600 + Math.random() * 600;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos2[i3]     = r * Math.sin(phi) * Math.cos(theta);
      pos2[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos2[i3 + 2] = r * Math.cos(phi);
      twinkleOffsets[i] = Math.random() * Math.PI * 2;
    }
    const geo2 = new THREE.BufferGeometry();
    geo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
    geo2.setAttribute('twinkleOffset', new THREE.BufferAttribute(twinkleOffsets, 1));

    const twinkleMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0.0 } },
      vertexShader: `
        uniform float time;
        attribute float twinkleOffset;
        void main() {
          float t = 0.4 + 0.6 * abs(sin(time * 1.1 + twinkleOffset));
          gl_PointSize = (1.5 + 3.5 * t);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float a = (0.5 - d) * 2.2;
          gl_FragColor = vec4(0.88, 0.94, 1.0, a * a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const twinkleStars = new THREE.Points(geo2, twinkleMat);
    this.scene.add(twinkleStars);
    this.twinkleLayers.push(twinkleStars);
  }

  private setupBackground() {
    // Layered parallax planes with slow independent drift — no tiling artifacts
    const configs: Array<{
      path: string; opacity: number; scale: number;
      vx: number; vz: number; y: number;
    }> = [
      { path: BACKGROUND_LAYERS.classic.background, opacity: 0.10, scale: 3600, vx:  0.010, vz:  0.006, y: -90 },
      { path: BACKGROUND_LAYERS.classic.stars,      opacity: 0.08, scale: 3000, vx: -0.007, vz:  0.009, y: -80 },
      { path: BACKGROUND_LAYERS.classic.farPlanets, opacity: 0.05, scale: 2600, vx:  0.005, vz: -0.008, y: -70 },
    ];

    for (const cfg of configs) {
      const tex = this.textureLoader.load(cfg.path);
      const geo = new THREE.PlaneGeometry(cfg.scale, cfg.scale);
      const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, opacity: cfg.opacity,
        depthWrite: false, blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, cfg.y, 0);
      this.scene.add(mesh);
      this.bgPlanes.push({ mesh, drift: { vx: cfg.vx, vz: cfg.vz } });
    }
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
      const geo = new THREE.SphereGeometry(planet.radius * WORLD_SCALE, 48, 48);
      const mat = new THREE.MeshStandardMaterial({
        color: planet.color, roughness: 0.65, metalness: 0.25,
        emissive: planet.color, emissiveIntensity: 0.12,
      });
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

      // Thin atmosphere glow ring
      const atmGeo = new THREE.RingGeometry(planet.radius * WORLD_SCALE * 1.02, planet.radius * WORLD_SCALE * 1.08, 64);
      const atmMat = new THREE.MeshBasicMaterial({ color: planet.color, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false });
      const atm = new THREE.Mesh(atmGeo, atmMat);
      atm.rotation.x = -Math.PI / 2;
      atm.position.copy(mesh.position);
      this.scene.add(atm);

      // Capture progress ring (starts invisible)
      const capGeo = new THREE.RingGeometry(planet.radius * WORLD_SCALE * 1.6, planet.radius * WORLD_SCALE * 1.7, 64);
      const capMat = new THREE.MeshBasicMaterial({ color: 0xffff44, transparent: true, opacity: 0, side: THREE.DoubleSide });
      const capRing = new THREE.Mesh(capGeo, capMat);
      capRing.rotation.x = -Math.PI / 2;
      capRing.position.copy(mesh.position);
      capRing.position.y += 0.1;
      this.scene.add(capRing);
      this.captureRings.set(planet.id, capRing);
    }
  }

  // ── Resource Nodes ───────────────────────────────────────────
  private buildResourceNodes() {
    for (const [, node] of this.engine.state.resourceNodes) {
      let geo: THREE.BufferGeometry;
      let color: number;
      let emissive = 0x000000;
      let emissiveIntensity = 0;
      switch (node.kind) {
        case 'moon':
          geo = new THREE.SphereGeometry(node.radius * WORLD_SCALE, 16, 16);
          color = 0x998877; break;
        case 'asteroid':
          geo = new THREE.IcosahedronGeometry(node.radius * WORLD_SCALE, 0);
          color = 0x554433; break;
        case 'ice_rock':
          geo = new THREE.SphereGeometry(node.radius * WORLD_SCALE, 10, 10);
          color = 0x99ccee; emissive = 0x224466; emissiveIntensity = 0.3; break;
        case 'crystal_deposit':
          geo = new THREE.OctahedronGeometry(node.radius * WORLD_SCALE, 0);
          color = 0x44ffcc; emissive = 0x00ccaa; emissiveIntensity = 0.5; break;
        default:
          geo = new THREE.SphereGeometry(node.radius * WORLD_SCALE, 8, 8);
          color = 0x888888;
      }
      const mat = new THREE.MeshStandardMaterial({
        color, roughness: 0.8, metalness: 0.1,
        emissive, emissiveIntensity,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(node.x * WORLD_SCALE, 0, node.y * WORLD_SCALE);
      // Random rotation for variety
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.scene.add(mesh);
      this.nodeMeshes.set(node.id, mesh);
    }
  }

  private syncResourceNodes() {
    for (const [id, mesh] of this.nodeMeshes) {
      const node = this.engine.state.resourceNodes.get(id);
      if (!node) { this.scene.remove(mesh); this.nodeMeshes.delete(id); continue; }
      mesh.position.set(node.x * WORLD_SCALE, 0, node.y * WORLD_SCALE);
      // Slow self-rotation for visual interest
      mesh.rotation.y += 0.004;
      // Pulse crystal deposits
      if (node.kind === 'crystal_deposit') {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.3 + 0.3 * Math.abs(Math.sin(this.twinkleTime * 1.5 + node.id * 0.3));
      }
      // Dim when on cooldown
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (node.harvestCooldown > 0) {
        mat.opacity !== undefined && (mat.transparent = true);
        mat.color.setHex(node.kind === 'crystal_deposit' ? 0x226644 : 0x332211);
      } else {
        const baseColors: Record<string, number> = { moon: 0x998877, asteroid: 0x554433, ice_rock: 0x99ccee, crystal_deposit: 0x44ffcc };
        mat.color.setHex(baseColors[node.kind]);
      }
    }
  }

  // ── Model Loading ─────────────────────────────────────────────
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

  /** SHIP_Y_OFFSET: ships float this many Three.js units above the scene
   * ground plane so they always render visibly above planet spheres (r≈14)
   * when viewed from the 55° camera angle. Increased for 3× larger ships. */
  private static readonly SHIP_Y = 5.0;

  private createPlaceholder(team: Team, shipClass: string): THREE.Group {
    const group = new THREE.Group();

    // Sizes chosen so ships are visible from orbital zoom (~160 units).
    // At zoom 160, visible width ≈ 264 Three.js units; a 3-unit ship = ~1.1%
    // of screen width ≈ 21px at 1920×1080 — clearly clickable.
    // 3× the original sizes so ships are clearly visible at all zoom levels.
    // At orbital zoom 160: visible width ≈ 264 Three.js — a size-9 fighter
    // occupies ~3.4% of screen (65px) and a size-24 dreadnought ~9% (173px).
    const size =
      shipClass === 'dreadnought'   ? 24
      : shipClass === 'battleship'  ? 21
      : shipClass === 'carrier'     ? 18
      : shipClass === 'cruiser'     ? 16.5
      : shipClass === 'light_cruiser' ? 15
      : shipClass === 'destroyer'   ? 13.5
      : shipClass === 'frigate'     ? 12
      : shipClass === 'corvette'    ? 10.5
      : shipClass === 'worker'      ? 7.5
      : 9; // fighters, scouts, etc.

    // Forward-pointing cone (rotated to face +Z = ship’s “forward”)
    const geo = new THREE.ConeGeometry(size * 0.4, size * 1.2, 5);
    geo.rotateX(Math.PI / 2);

    const col = TEAM_COLORS[team] ?? 0x4488ff;
    const mat = new THREE.MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: 0.8,  // bright glow so ships are always visible
      metalness: 0.3, roughness: 0.5,
      depthTest: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    // Ships must render on top of the ground plane and resource nodes
    mesh.renderOrder = 2;
    group.add(mesh);

    // Engine glow dot at rear
    const glowGeo = new THREE.SphereGeometry(size * 0.25, 6, 6);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.z = -size * 0.6; // behind the ship
    glow.renderOrder = 2;
    group.add(glow);

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
        // Selection ring — size scales with ship tier for visibility
        const shipDef = SHIP_DEFINITIONS[ship.shipType];
        const ringR = shipDef?.stats.tier ?? 1;
        const ringGeo = new THREE.RingGeometry(ringR * 0.8 + 0.5, ringR * 0.8 + 0.8, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x44ff44, transparent: true, opacity: 0,
          side: THREE.DoubleSide, depthTest: false,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -SpaceRenderer.SHIP_Y + 0.2; // ground level ring
        ring.renderOrder = 3;
        group.add(ring);
        meshData.selectionRing = ring;

        // Add health bar — positioned above ship, always faces camera
        const barW = Math.max(1.5, (shipDef?.stats.tier ?? 1) * 0.8);
        const hbBg = new THREE.Mesh(new THREE.PlaneGeometry(barW, 0.18), new THREE.MeshBasicMaterial({ color: 0x222233, depthTest: false }));
        hbBg.position.y = 2.2; // above the elevated ship
        hbBg.renderOrder = 999;
        group.add(hbBg);
        meshData.healthBg = hbBg;

        const hb = new THREE.Mesh(new THREE.PlaneGeometry(barW, 0.18), new THREE.MeshBasicMaterial({ color: TEAM_COLORS[ship.team], depthTest: false }));
        hb.position.y = 2.2;
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

      // Update position — ships float SHIP_Y units above the scene plane
      // so they are always visible above planet spheres (which sit at y=0)
      // and the 55° camera never depth-buffers them behind terrain.
      meshData.group.position.set(
        ship.x * WORLD_SCALE,
        SpaceRenderer.SHIP_Y + ship.z * WORLD_SCALE,  // elevated above ground
        ship.y * WORLD_SCALE,
      );
      meshData.group.rotation.y = -ship.facing;

      // Apply procedural animation
      applyShipAnimation(meshData.group, ship, dt);

      // Update health bar — hide at extreme zoom (ships are sub-pixel)
      if (meshData.healthBar) {
        const zoom = this.controls.cameraState.zoom;
        const showBar = zoom < 600;
        meshData.healthBar.visible = showBar;
        meshData.healthBg!.visible  = showBar;
        if (showBar) {
          const pct = ship.hp / ship.maxHp;
          meshData.healthBar.scale.x = Math.max(0.01, pct);
          meshData.healthBar.position.x = -(1 - pct) * 0.75;
          (meshData.healthBar.material as THREE.MeshBasicMaterial).color.setHex(
            pct > 0.5 ? 0x44ff44 : pct > 0.25 ? 0xffaa00 : 0xff4444);
          meshData.healthBar.lookAt(this.camera.position);
          meshData.healthBg!.lookAt(this.camera.position);
        }
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

    // Twinkling shader time update
    this.twinkleTime += dt;
    for (const layer of this.twinkleLayers) {
      (layer.material as THREE.ShaderMaterial).uniforms.time.value = this.twinkleTime;
    }

    // ─ Cinematic intro: ease zoom from deep-space to home-world orbit ───
    if (this.introActive) {
      this.introTimer += dt;
      const t    = Math.min(1, this.introTimer / this.introDuration);
      const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic — fast start, gentle land
      this.controls.cameraState.zoom =
        this.introZoomStart + (this.introZoomEnd - this.introZoomStart) * ease;
      if (t >= 1) this.introActive = false;
    }

    // Slowly rotate starfield
    this.starField.rotation.y += dt * 0.002;
    for (const layer of this.twinkleLayers) layer.rotation.y += dt * 0.0015;

    // Drift parallax background planes, bounce at boundaries
    for (const bg of this.bgPlanes) {
      bg.mesh.position.x += bg.drift.vx;
      bg.mesh.position.z += bg.drift.vz;
      if (Math.abs(bg.mesh.position.x) > 300) bg.drift.vx *= -1;
      if (Math.abs(bg.mesh.position.z) > 300) bg.drift.vz *= -1;
    }

    // Sync resource nodes
    this.syncResourceNodes();

    // Sync stations
    this.syncStations(this.engine.state);

    // Sync capture rings
    this.syncCaptureRings(this.engine.state);

    // Sync planet ownership colors
    this.syncPlanetOwnership(this.engine.state);

    this.renderer.render(this.scene, this.camera);
  };

  // ── Station Rendering ─────────────────────────────────────────
  private syncStations(state: SpaceGameState) {
    // Remove deleted
    for (const [id, mesh] of this.stationMeshes) {
      if (!state.stations.has(id)) { this.scene.remove(mesh); this.stationMeshes.delete(id); }
    }
    // Add/update
    for (const [id, station] of state.stations) {
      if (station.dead) continue;
      let mesh = this.stationMeshes.get(id);
      if (!mesh) {
        mesh = new THREE.Group();
        const body = new THREE.Mesh(
          new THREE.OctahedronGeometry(2, 1),
          new THREE.MeshStandardMaterial({
            color: TEAM_COLORS[station.team] ?? 0x4488ff,
            emissive: TEAM_COLORS[station.team] ?? 0x4488ff,
            emissiveIntensity: 0.4, metalness: 0.6, roughness: 0.3,
          }),
        );
        mesh.add(body);
        // Ring around station
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(2.5, 2.7, 32),
          new THREE.MeshBasicMaterial({ color: TEAM_COLORS[station.team] ?? 0x4488ff, transparent: true, opacity: 0.4, side: THREE.DoubleSide }),
        );
        ring.rotation.x = -Math.PI / 2;
        mesh.add(ring);
        this.scene.add(mesh);
        this.stationMeshes.set(id, mesh);
      }
      mesh.position.set(station.x * WORLD_SCALE, station.z * WORLD_SCALE + 4, station.y * WORLD_SCALE);
      mesh.rotation.y += 0.003; // slow spin
    }
  }

  private syncCaptureRings(state: SpaceGameState) {
    for (const planet of state.planets) {
      const ring = this.captureRings.get(planet.id);
      if (!ring) continue;
      const mat = ring.material as THREE.MeshBasicMaterial;
      if (planet.captureProgress > 0) {
        const pct = planet.captureProgress / CAPTURE_TIME;
        mat.opacity = 0.3 + pct * 0.5;
        mat.color.setHex(TEAM_COLORS[planet.captureTeam] ?? 0xffff44);
        ring.scale.setScalar(0.5 + pct * 0.5);
      } else {
        mat.opacity = planet.owner !== 0 ? 0.15 : 0;
        if (planet.owner !== 0) mat.color.setHex(TEAM_COLORS[planet.owner] ?? 0x44ff44);
        ring.scale.setScalar(1);
      }
    }
  }

  private syncPlanetOwnership(state: SpaceGameState) {
    for (let i = 0; i < state.planets.length && i < this.planetMeshes.length; i++) {
      const planet = state.planets[i];
      const mesh = this.planetMeshes[i];
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (planet.owner !== 0) {
        mat.emissive.setHex(TEAM_COLORS[planet.owner] ?? planet.color);
        mat.emissiveIntensity = 0.25;
      } else {
        mat.emissive.setHex(planet.color);
        mat.emissiveIntensity = 0.1;
      }
    }
  }

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
