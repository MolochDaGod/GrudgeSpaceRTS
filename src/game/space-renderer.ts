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
import { hasVoxelShip, buildVoxelShip, buildCapitalVoxelFallback } from './space-voxel-builder';
import { loadHeroShip, glbBlobToUrl } from './ship-storage';

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

  // ── Planet interaction ───────────────────────────────
  public hoveredPlanetId:  number | null = null;
  public selectedPlanetId: number | null = null;
  /** Called from SpaceControls when the player LMB-clicks a planet. */
  public onPlanetClick?: (planetId: number) => void;
  private raycasterPlanet = new THREE.Raycaster();

  private disposed = false;
  private animFrame = 0;
  private captureRings = new Map<number, THREE.Mesh>();
  private gameMode: GameMode = '1v1';
  private nodeMeshes = new Map<number, THREE.Mesh>();
  private turretMeshes = new Map<number, THREE.Group>();
  private planetBuildingMeshes = new Map<number, THREE.Group>();
  /** Mining laser lines: shipId → Line mesh */
  private miningLasers = new Map<number, THREE.Line>();
  /** Cargo progress bars on workers: shipId → { bar, bg } */
  private cargoBars = new Map<number, { bar: THREE.Mesh; bg: THREE.Mesh }>();

  /** Cached Object URL for the player's custom hero ship GLB. */
  private customHeroUrl: string | null = null;
  private customHeroLoading = false;

  /** Set to true before init() if the player has a saved hero ship. */
  public hasCustomHero = false;
  /** Commander spec chosen at the pre-game modal. */
  public playerCommanderSpec: import('./space-types').CommanderSpec | null = null;

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
    this.engine.hasCustomHero = this.hasCustomHero;
    this.engine.playerCommanderSpec = this.playerCommanderSpec;
    this.engine.initGame(this.gameMode);

    this.controls = new SpaceControls(this.container, this.camera, this.engine.state, this.renderer);
    this.effectsRenderer = new SpaceEffectsRenderer(this.scene);

    // Wire planet click: controls signals → renderer resolves hovered planet
    this.controls.onPlanetClick = () => {
      if (this.hoveredPlanetId !== null) {
        this.selectedPlanetId = this.hoveredPlanetId;
        this.onPlanetClick?.(this.hoveredPlanetId);
      }
    };

    // Wire Q/W/E/R ability hotkeys: fires the ability matching that key letter
    this.controls.onAbilityActivateByKey = (key: string) => {
      this.activateAbilityByKey(key);
    };

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

  // ─ Planet type → GLB model mapping ────────────────────────────
  private readonly PLANET_GLBS: Record<string, string> = {
    volcanic:    '/assets/space/models/planets/planet_1.glb',
    oceanic:     '/assets/space/models/planets/planet_2.glb',
    crystalline: '/assets/space/models/planets/planet_3.glb',
    gas_giant:   '/assets/space/models/planets/planet_4.glb',
    frozen:      '/assets/space/models/planets/planet_5.glb',
    barren:      '/assets/space/models/planets/planet_main.glb',
  };

  private buildPlanets() {
    for (const planet of this.engine.state.planets) {
      const geo = new THREE.SphereGeometry(planet.radius * WORLD_SCALE, 32, 32);
      // Invisible collider sphere — used for hover raycasting + ring anchors.
      // The visible model comes from the GLB loaded below.
      const mat = new THREE.MeshBasicMaterial({ visible: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(planet.x * WORLD_SCALE, planet.z * WORLD_SCALE, planet.y * WORLD_SCALE);
      this.scene.add(mesh);
      this.planetMeshes.push(mesh);

      // Load GLB planet model and size it to match the planet radius
      const glbPath = this.PLANET_GLBS[planet.planetType];
      if (glbPath) {
        this.gltfLoader.loadAsync(glbPath).then(gltf => {
          if (this.disposed) return;
          const model = gltf.scene;
          // Scale GLB to match planet sphere radius
          const box = new THREE.Box3().setFromObject(model);
          const modelDiam = box.getSize(new THREE.Vector3()).length();
          const targetDiam = planet.radius * WORLD_SCALE * 2.0;
          if (modelDiam > 0) model.scale.setScalar(targetDiam / modelDiam);
          model.position.copy(mesh.position);
          // Add glow atmosphere as emissive ring around GLB
          const atmGeo = new THREE.SphereGeometry(planet.radius * WORLD_SCALE * 1.06, 32, 32);
          const atmMat = new THREE.MeshBasicMaterial({
            color: planet.color, transparent: true, opacity: 0.08,
            side: THREE.BackSide, depthWrite: false,
          });
          const atm = new THREE.Mesh(atmGeo, atmMat);
          atm.position.copy(mesh.position);
          this.scene.add(atm);
          this.scene.add(model);
          // Store ref on mesh.userData so syncPlanetOwnership can animate it
          mesh.userData.glbModel = model;
          mesh.userData.atmMesh  = atm;
        }).catch(() => {
          // GLB failed — fall back to coloured sphere
          (mesh.material as THREE.Material).dispose();
          (mesh as THREE.Mesh).material = new THREE.MeshStandardMaterial({
            color: planet.color, roughness: 0.65, metalness: 0.25,
            emissive: planet.color, emissiveIntensity: 0.12,
          }) as unknown as THREE.MeshBasicMaterial;
          mesh.visible = true;
        });
      } else {
        // No GLB for this type — use coloured sphere
        (mesh as THREE.Mesh).material = new THREE.MeshStandardMaterial({
          color: planet.color, roughness: 0.65, metalness: 0.25,
          emissive: planet.color, emissiveIntensity: 0.12,
        }) as unknown as THREE.MeshBasicMaterial;
        mesh.visible = true;
      }

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

  /** Resource nodes float at Y=2.5 — between ground (0) and ships (5). */
  private static readonly NODE_Y = 2.5;
  /** Node visual scale factor — much smaller than before. */
  private static readonly NODE_SCALE = 0.25;

  // ── Resource Nodes ───────────────────────────────────────────
  private buildResourceNodes() {
    const NS = SpaceRenderer.NODE_SCALE;
    for (const [, node] of this.engine.state.resourceNodes) {
      let geo: THREE.BufferGeometry;
      let color: number;
      let emissive = 0x000000;
      let emissiveIntensity = 0;
      const r = node.radius * WORLD_SCALE * NS;
      switch (node.kind) {
        case 'moon':
          geo = new THREE.SphereGeometry(r, 12, 12);
          color = 0x998877; break;
        case 'asteroid':
          geo = new THREE.IcosahedronGeometry(r, 0);
          color = 0x776655; break;
        case 'ice_rock':
          geo = new THREE.SphereGeometry(r, 8, 8);
          color = 0x99ccee; emissive = 0x224466; emissiveIntensity = 0.4; break;
        case 'crystal_deposit':
          geo = new THREE.OctahedronGeometry(r, 0);
          color = 0x44ffcc; emissive = 0x00ccaa; emissiveIntensity = 0.6; break;
        default:
          geo = new THREE.SphereGeometry(r, 6, 6);
          color = 0x888888;
      }
      const mat = new THREE.MeshStandardMaterial({
        color, roughness: 0.7, metalness: 0.2,
        emissive, emissiveIntensity,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(node.x * WORLD_SCALE, SpaceRenderer.NODE_Y, node.y * WORLD_SCALE);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.renderOrder = 1;
      mesh.userData.baseScale = 1.0; // for harvest shrink animation
      this.scene.add(mesh);
      this.nodeMeshes.set(node.id, mesh);
    }
  }

  private syncResourceNodes() {
    // Build a set of currently-harvested node IDs for shrink effect
    const harvestedNodeIds = new Set<number>();
    for (const [, ship] of this.engine.state.ships) {
      if (!ship.dead && ship.workerState === 'harvesting' && ship.workerNodeId != null) {
        harvestedNodeIds.add(ship.workerNodeId);
      }
    }

    for (const [id, mesh] of this.nodeMeshes) {
      const node = this.engine.state.resourceNodes.get(id);
      if (!node) { this.scene.remove(mesh); this.nodeMeshes.delete(id); continue; }
      mesh.position.set(node.x * WORLD_SCALE, SpaceRenderer.NODE_Y, node.y * WORLD_SCALE);
      mesh.rotation.y += 0.006;

      // Shrink while being harvested, restore otherwise
      const isBeingHarvested = harvestedNodeIds.has(id);
      const targetScale = isBeingHarvested ? 0.4 : (node.harvestCooldown > 0 ? 0.2 : 1.0);
      const cur = mesh.userData.baseScale ?? 1.0;
      const next = cur + (targetScale - cur) * 0.08;
      mesh.userData.baseScale = next;
      mesh.scale.setScalar(next);

      // Pulse crystal deposits
      if (node.kind === 'crystal_deposit') {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.4 + 0.3 * Math.abs(Math.sin(this.twinkleTime * 1.5 + node.id * 0.3));
      }
      // Dim when on cooldown (depleted)
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (node.harvestCooldown > 0) {
        mat.transparent = true; mat.opacity = 0.4;
        mat.color.setHex(node.kind === 'crystal_deposit' ? 0x226644 : 0x332211);
      } else {
        mat.transparent = false; mat.opacity = 1.0;
        const baseColors: Record<string, number> = { moon: 0x998877, asteroid: 0x776655, ice_rock: 0x99ccee, crystal_deposit: 0x44ffcc };
        mat.color.setHex(baseColors[node.kind]);
      }
    }
  }

  // ── Mining Lasers & Cargo Bars ─────────────────────────────────
  private syncMiningVisuals() {
    const activeMiners = new Set<number>();

    for (const [, ship] of this.engine.state.ships) {
      if (ship.dead || ship.shipClass !== 'worker') continue;

      if (ship.workerState === 'harvesting' && ship.workerNodeId != null) {
        activeMiners.add(ship.id);
        const node = this.engine.state.resourceNodes.get(ship.workerNodeId);
        if (!node) continue;

        const shipPos = new THREE.Vector3(ship.x * WORLD_SCALE, SpaceRenderer.SHIP_Y, ship.y * WORLD_SCALE);
        const nodePos = new THREE.Vector3(node.x * WORLD_SCALE, SpaceRenderer.NODE_Y, node.y * WORLD_SCALE);

        // ─ Mining laser beam ───────────────────────
        let laser = this.miningLasers.get(ship.id);
        if (!laser) {
          const laserColor = ship.workerCargoType === 'energy' ? 0x44ccff
            : ship.workerCargoType === 'credits' ? 0xffcc44 : 0x44ff88;
          const geo = new THREE.BufferGeometry().setFromPoints([shipPos, nodePos]);
          const mat = new THREE.LineBasicMaterial({
            color: laserColor, transparent: true, opacity: 0.7,
            linewidth: 2, depthWrite: false,
          });
          laser = new THREE.Line(geo, mat);
          laser.renderOrder = 3;
          this.scene.add(laser);
          this.miningLasers.set(ship.id, laser);
        } else {
          // Update positions
          const pos = laser.geometry.attributes.position as THREE.BufferAttribute;
          pos.setXYZ(0, shipPos.x, shipPos.y, shipPos.z);
          pos.setXYZ(1, nodePos.x, nodePos.y, nodePos.z);
          pos.needsUpdate = true;
          // Pulse opacity
          (laser.material as THREE.LineBasicMaterial).opacity = 0.5 + 0.3 * Math.abs(Math.sin(this.twinkleTime * 4));
        }

        // ─ Cargo progress bar on worker ─────────────
        const harvestPct = Math.min(1, (ship.workerHarvestTimer ?? 0) / 5);
        let cb = this.cargoBars.get(ship.id);
        if (!cb) {
          const bgGeo = new THREE.PlaneGeometry(1.8, 0.2);
          const bgMat = new THREE.MeshBasicMaterial({ color: 0x111122, depthTest: false, transparent: true, opacity: 0.8 });
          const bg = new THREE.Mesh(bgGeo, bgMat);
          bg.renderOrder = 1001;
          this.scene.add(bg);
          const barGeo = new THREE.PlaneGeometry(1.8, 0.2);
          const barMat = new THREE.MeshBasicMaterial({ color: 0x44ff88, depthTest: false });
          const bar = new THREE.Mesh(barGeo, barMat);
          bar.renderOrder = 1002;
          this.scene.add(bar);
          cb = { bar, bg };
          this.cargoBars.set(ship.id, cb);
        }
        // Position below the health bar
        cb.bg.position.set(shipPos.x, SpaceRenderer.SHIP_Y + 3.0, shipPos.z);
        cb.bg.lookAt(this.camera.position);
        cb.bg.visible = true;
        cb.bar.position.copy(cb.bg.position);
        cb.bar.position.x -= (1 - harvestPct) * 0.9;
        cb.bar.scale.x = Math.max(0.01, harvestPct);
        cb.bar.lookAt(this.camera.position);
        cb.bar.visible = true;
        // Color based on resource type
        const barCol = ship.workerCargoType === 'energy' ? 0x44ccff
          : ship.workerCargoType === 'credits' ? 0xffcc44 : 0x44ff88;
        (cb.bar.material as THREE.MeshBasicMaterial).color.setHex(barCol);
      }
    }

    // Clean up lasers/bars for ships no longer mining
    for (const [id, laser] of this.miningLasers) {
      if (!activeMiners.has(id)) {
        this.scene.remove(laser); laser.geometry.dispose();
        this.miningLasers.delete(id);
      }
    }
    for (const [id, cb] of this.cargoBars) {
      if (!activeMiners.has(id)) {
        cb.bar.visible = false; cb.bg.visible = false;
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
      // NOTE: Do NOT apply prefab.scale here — autoFit() in syncShips
      // measures the raw model bounding box and scales to match the
      // target ship class size. Applying scale here would corrupt that.
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

  /** Ships float above the ground plane so they render above planet equators. */
  private static readonly SHIP_Y = 3.5;

  /** Target diameter (Three.js units) for each ship class — models are auto-scaled to fit.
   *  Scaled so fighters ≈ 10% of a starting planet (28 TJS diameter).
   *  A dreadnought is ≈ 25% of a planet — big but not absurd. */
  private static shipClassSize(cls: string): number {
    switch (cls) {
      case 'dreadnought':    return 7.0;
      case 'battleship':     return 6.2;
      case 'carrier':        return 5.5;
      case 'cruiser':        return 5.0;
      case 'light_cruiser':  return 4.5;
      case 'destroyer':      return 4.0;
      case 'frigate':        return 3.6;
      case 'corvette':       return 3.2;
      case 'assault_frigate': return 3.6;
      case 'worker':         return 2.4;
      default:               return 2.8; // fighters, scouts, etc.
    }
  }

  private createPlaceholder(team: Team, shipClass: string): THREE.Group {
    const group = new THREE.Group();

    // Sizes chosen so ships are visible from orbital zoom (~160 units).
    // At zoom 160, visible width ≈ 264 Three.js units; a 3-unit ship = ~1.1%
    // of screen width ≈ 21px at 1920×1080 — clearly clickable.
    // 3× the original sizes so ships are clearly visible at all zoom levels.
    // At orbital zoom 160: visible width ≈ 264 Three.js — a size-9 fighter
    // occupies ~3.4% of screen (65px) and a size-24 dreadnought ~9% (173px).
    const size = SpaceRenderer.shipClassSize(shipClass);

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

    // Thruster: tiny sprite at rear, only visible when moving
    const thrusterCol = team === 1 ? 0x4499ff : team === 2 ? 0xff4444 : 0xffaa22;
    const spriteMat = new THREE.SpriteMaterial({
      color: thrusterCol, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(size * 0.3, size * 0.3, 1);
    sprite.position.z = -size * 0.55;
    sprite.name = 'thruster';
    group.add(sprite);

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

        // Add selection ring — sized to match the ship class, not tier
        const shipDef = SHIP_DEFINITIONS[ship.shipType];
        const ringR = SpaceRenderer.shipClassSize(ship.shipClass) * 0.45;
        const ringGeo = new THREE.RingGeometry(ringR, ringR + 0.3, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x44ff44, transparent: true, opacity: 0,
          side: THREE.DoubleSide, depthTest: false,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -0.5; // just below the ship model, not on the ground
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

        // Model loading priority:
        // 0. custom_hero → load player's saved GLB from storage
        // 1. Try real OBJ/FBX prefab (best visual quality)
        // 2. If no prefab OR prefab load fails → build procedural voxel
        // 3. If no voxel either → keep the cone placeholder
        const prefab = getShipPrefab(ship.shipType);
        const removeCone = (g: THREE.Group) => {
          const c = g.children.find(ch => (ch as THREE.Mesh).geometry?.type === 'ConeGeometry');
          if (c) g.remove(c);
        };

        // Target size for this ship class (Three.js units)
        const targetSize = SpaceRenderer.shipClassSize(ship.shipClass);

        // Auto-scale any loaded model to fit targetSize
        const autoFit = (model: THREE.Group) => {
          const box = new THREE.Box3().setFromObject(model);
          const diam = box.getSize(new THREE.Vector3()).length();
          if (diam > 0) model.scale.setScalar(targetSize / diam);
        };

        // Pirate / Boss captain ships: render as billboard sprites
        const SPRITE_SHIPS: Record<string, string> = {
          pirate_01: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_01.png',
          pirate_02: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_02.png',
          pirate_03: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_03.png',
          pirate_04: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_04.png',
          pirate_05: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_05.png',
          pirate_06: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_06.png',
          boss_captain_01: '/assets/space/sprites/boss-ships/PNG/Boss_01/Boss_Full.png',
          boss_captain_02: '/assets/space/sprites/boss-ships/PNG/Boss_02/Boss_Full.png',
          boss_captain_03: '/assets/space/sprites/boss-ships/PNG/Boss_03/Boss_Full.png',
        };
        const spritePath = SPRITE_SHIPS[ship.shipType];

        // Custom hero ship: load GLB from player's saved data
        if (spritePath) {
          // Render 2D ship as a flat textured plane on the XZ plane.
          // Unlike THREE.Sprite (which always faces camera), this rotates
          // with ship.facing via group.rotation.y, so it turns when moving.
          const tex = this.textureLoader.load(spritePath);
          tex.colorSpace = THREE.SRGBColorSpace;
          const planeMat = new THREE.MeshBasicMaterial({
            map: tex, transparent: true, alphaTest: 0.1,
            side: THREE.DoubleSide, depthWrite: false,
          });
          const sz = targetSize * 1.6; // slightly larger since top-down flat
          const planeGeo = new THREE.PlaneGeometry(sz, sz);
          const planeMesh = new THREE.Mesh(planeGeo, planeMat);
          // Lay flat on XZ plane (face up toward camera)
          planeMesh.rotation.x = -Math.PI / 2;
          // Rotate 90° so the ship nose points in the +Z direction (matching facing=0)
          planeMesh.rotation.z = Math.PI / 2;
          planeMesh.renderOrder = 2;
          planeMesh.name = 'spriteShip';
          removeCone(meshData.group);
          meshData.group.add(planeMesh);
        } else if (ship.shipType === 'custom_hero') {
          this.loadCustomHeroModel(id, meshData);
        } else if (prefab) {
          this.loadModel(prefab).then(model => {
            if (this.disposed) return;
            const ex = this.shipMeshes.get(id);
            if (!ex) return;
            autoFit(model);
            removeCone(ex.group);
            ex.group.add(model);
          }).catch(() => {
            // Real model failed — fall back to procedural voxel
            const ex = this.shipMeshes.get(id);
            if (!ex || this.disposed) return;
            const vox = hasVoxelShip(ship.shipType)
              ? buildVoxelShip(ship.shipType, ship.team)
              : buildCapitalVoxelFallback(ship.shipType, ship.team);
            if (vox) { autoFit(vox); removeCone(ex.group); ex.group.add(vox); }
          });
        } else if (hasVoxelShip(ship.shipType)) {
          // No prefab — build voxel immediately (no async load wait)
          const vox = buildVoxelShip(ship.shipType, ship.team);
          if (vox) { autoFit(vox); removeCone(meshData.group); meshData.group.add(vox); }
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

      // Thruster sprite: visible and pulsing when ship is moving
      const thruster = meshData.group.getObjectByName('thruster') as THREE.Sprite | undefined;
      if (thruster) {
        const isMoving = ship.animState === 'moving' || ship.animState === 'speed_boost';
        const mat = thruster.material as THREE.SpriteMaterial;
        const targetOp = isMoving ? 0.5 + 0.4 * Math.abs(Math.sin(this.twinkleTime * 6 + ship.id * 0.7)) : 0;
        mat.opacity += (targetOp - mat.opacity) * 0.2;
        const boost = ship.animState === 'speed_boost' ? 1.6 : 1.0;
        const sz = SpaceRenderer.shipClassSize(ship.shipClass) * 0.3 * boost;
        thruster.scale.set(sz, sz, 1);
      }

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

      // Selection ring: always visible at 50% for player ships, 80% when selected
      if (meshData.selectionRing) {
        const mat = meshData.selectionRing.material as THREE.MeshBasicMaterial;
        if (ship.team === 1) {
          mat.opacity = ship.selected ? 0.8 : 0.5;
          mat.color.setHex(ship.selected ? 0x44ff44 : 0x2288aa);
        } else {
          mat.opacity = ship.selected ? 0.8 : 0;
          mat.color.setHex(0xff4444);
        }
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

    // Bomb sprite mapping: projectile type → bomb PNG
    const BOMB_SPRITES: Record<string, string> = {
      missile:  '/assets/space/ui/bombs/1 Bombs/3.png',
      torpedo:  '/assets/space/ui/bombs/1 Bombs/7.png',
      railgun:  '/assets/space/ui/bombs/1 Bombs/1.png',
      laser:    '/assets/space/ui/bombs/1 Bombs/10.png',
      pulse:    '/assets/space/ui/bombs/1 Bombs/5.png',
    };

    for (const [id, proj] of state.projectiles) {
      let mesh = this.projectileMeshes.get(id);
      if (!mesh) {
        // Use bomb sprite as billboard instead of geometry
        const bombPath = BOMB_SPRITES[proj.type] ?? BOMB_SPRITES.laser;
        const tex = this.textureLoader.load(bombPath);
        const spriteMat = new THREE.SpriteMaterial({
          map: tex, color: proj.trailColor,
          transparent: true, depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const sprite = new THREE.Sprite(spriteMat);
        const sz = proj.type === 'missile' || proj.type === 'torpedo' ? 1.5 : 0.8;
        sprite.scale.set(sz, sz, 1);
        sprite.renderOrder = 4;
        this.scene.add(sprite);
        // Store as Mesh type for compatibility with the map
        this.projectileMeshes.set(id, sprite as unknown as THREE.Mesh);
        mesh = sprite as unknown as THREE.Mesh;
      }
      mesh.position.set(proj.x * WORLD_SCALE, proj.z * WORLD_SCALE + 5, proj.y * WORLD_SCALE);
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

  // ── Camera ─────────────────────────────────────────────────────
  private updateCamera() {
    const cam = this.controls.cameraState;
    const dist  = cam.zoom;
    const pitch = cam.angle    * (Math.PI / 180); // tilt (55°)
    const yaw   = cam.rotation * (Math.PI / 180); // horizontal orbit (Q/E)

    // Look-at point (centre of the world the camera orbits around)
    const lookX = cam.x * WORLD_SCALE;
    const lookZ = cam.y * WORLD_SCALE;

    // Camera position: orbit at `dist` from look-at, rotated by yaw + tilted by pitch
    this.camera.position.set(
      lookX + Math.sin(yaw) * dist * Math.cos(pitch),
      dist * Math.sin(pitch),
      lookZ + Math.cos(yaw) * dist * Math.cos(pitch),
    );
    this.camera.lookAt(lookX, 0, lookZ);
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

    // Planet hover glow
    this.updatePlanetHover();

    // Sync resource nodes + mining visuals
    this.syncResourceNodes();
    this.syncMiningVisuals();

    // Sync stations + turrets + planet buildings
    this.syncStations(this.engine.state);
    this.syncPlanetTurrets(this.engine.state);
    this.syncPlanetBuildings(this.engine.state);

    // Sync capture rings
    this.syncCaptureRings(this.engine.state);

    // Sync planet ownership colors
    this.syncPlanetOwnership(this.engine.state);

    // Sync rally point flags
    this.syncRallyFlags(this.engine.state);

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

  // ── Planet Turrets (visible orbiting defense) ───────────────
  private syncPlanetTurrets(state: SpaceGameState) {
    // Remove dead turrets
    for (const [id, mesh] of this.turretMeshes) {
      if (!state.planetTurrets.has(id)) { this.scene.remove(mesh); this.turretMeshes.delete(id); }
    }
    for (const [id, turret] of state.planetTurrets) {
      if (turret.dead) continue;
      let mesh = this.turretMeshes.get(id);
      if (!mesh) {
        mesh = new THREE.Group();
        // Small box base
        const base = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.4, 0.6),
          new THREE.MeshStandardMaterial({ color: TEAM_COLORS[turret.team] ?? 0x888888, metalness: 0.7, roughness: 0.3 }),
        );
        mesh.add(base);
        // Gun barrel
        const barrel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.8, 4),
          new THREE.MeshStandardMaterial({ color: 0xcccccc, emissive: 0x444444, emissiveIntensity: 0.3, metalness: 0.8 }),
        );
        barrel.rotation.z = Math.PI / 2;
        barrel.position.set(0.4, 0.1, 0);
        mesh.add(barrel);
        this.scene.add(mesh);
        this.turretMeshes.set(id, mesh);
      }
      mesh.position.set(turret.x * WORLD_SCALE, 3.5, turret.y * WORLD_SCALE);
      // Face target if attacking
      if (turret.targetId) {
        const tgt = state.ships.get(turret.targetId);
        if (tgt) mesh.rotation.y = -Math.atan2(tgt.y - turret.y, tgt.x - turret.x);
      } else {
        mesh.rotation.y += 0.01; // idle spin
      }
    }
  }

  // ── Planet Surface Buildings (visual indicator of owned planet) ───
  private syncPlanetBuildings(state: SpaceGameState) {
    for (const planet of state.planets) {
      if (planet.owner === 0 || !planet.stationId) {
        // Remove buildings for unowned planets
        const existing = this.planetBuildingMeshes.get(planet.id);
        if (existing) { this.scene.remove(existing); this.planetBuildingMeshes.delete(planet.id); }
        continue;
      }
      if (this.planetBuildingMeshes.has(planet.id)) continue; // already built

      // Create 4-6 small building dots on the planet surface
      const group = new THREE.Group();
      const r = planet.radius * WORLD_SCALE;
      const col = TEAM_COLORS[planet.owner] ?? 0x4488ff;
      const count = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const dist = r * (0.6 + Math.random() * 0.3);
        const bldg = new THREE.Mesh(
          new THREE.BoxGeometry(0.3 + Math.random() * 0.3, 0.2 + Math.random() * 0.4, 0.3 + Math.random() * 0.3),
          new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.3, metalness: 0.5, roughness: 0.4 }),
        );
        bldg.position.set(
          Math.cos(angle) * dist,
          0.3,
          Math.sin(angle) * dist,
        );
        bldg.rotation.y = Math.random() * Math.PI;
        group.add(bldg);
      }
      const px = planet.x * WORLD_SCALE;
      const pz = planet.y * WORLD_SCALE;
      group.position.set(px, 0, pz);
      this.scene.add(group);
      this.planetBuildingMeshes.set(planet.id, group);
    }
  }

  private syncCaptureRings(state: SpaceGameState) {
    for (const planet of state.planets) {
      const ring = this.captureRings.get(planet.id);
      if (!ring) continue;
      const mat = ring.material as THREE.MeshBasicMaterial;
      if (planet.captureProgress > 0) {
        const pct = planet.captureProgress / CAPTURE_TIME;
        mat.opacity = 0.35 + pct * 0.55;
        mat.color.setHex(TEAM_COLORS[planet.captureTeam] ?? 0xffff44);
        // Ring pulses and scales with capture progress — very visible
        const pulse = 1 + Math.sin(this.twinkleTime * 4) * 0.08;
        ring.scale.setScalar((0.4 + pct * 0.6) * pulse);
      } else {
        mat.opacity = planet.owner !== 0 ? 0.15 : 0;
        if (planet.owner !== 0) mat.color.setHex(TEAM_COLORS[planet.owner] ?? 0x44ff44);
        ring.scale.setScalar(1);
      }
    }
  }

  // ── Rally Point Flags ─────────────────────────────────────────
  private rallyMeshes = new Map<number, THREE.Sprite>();
  private syncRallyFlags(state: SpaceGameState) {
    // Clean up flags for dead/missing stations
    for (const [id, sprite] of this.rallyMeshes) {
      if (!state.stations.has(id)) { this.scene.remove(sprite); this.rallyMeshes.delete(id); }
    }
    for (const [id, st] of state.stations) {
      if (st.dead || st.team !== 1 || !st.rallyPoint) {
        const old = this.rallyMeshes.get(id);
        if (old) { this.scene.remove(old); this.rallyMeshes.delete(id); }
        continue;
      }
      let flag = this.rallyMeshes.get(id);
      if (!flag) {
        const mat = new THREE.SpriteMaterial({
          color: 0x44ff44, transparent: true, opacity: 0.6,
          depthWrite: false, blending: THREE.AdditiveBlending,
        });
        flag = new THREE.Sprite(mat);
        flag.scale.set(1.5, 2.5, 1);
        flag.renderOrder = 5;
        this.scene.add(flag);
        this.rallyMeshes.set(id, flag);
      }
      flag.position.set(
        st.rallyPoint.x * WORLD_SCALE,
        4 + Math.sin(this.twinkleTime * 2 + id) * 0.3,  // gentle bob
        st.rallyPoint.y * WORLD_SCALE,
      );
    }
  }

  private syncPlanetOwnership(state: SpaceGameState) {
    for (let i = 0; i < state.planets.length && i < this.planetMeshes.length; i++) {
      const planet = state.planets[i];
      const mesh   = this.planetMeshes[i];
      const ownerCol = TEAM_COLORS[planet.owner] ?? planet.color;

      // Update atmosphere glow colour (for GLB planets)
      const atm = mesh.userData.atmMesh as THREE.Mesh | undefined;
      if (atm) {
        (atm.material as THREE.MeshBasicMaterial).color.setHex(
          planet.owner !== 0 ? ownerCol : planet.color);
        (atm.material as THREE.MeshBasicMaterial).opacity =
          planet.owner !== 0 ? 0.14 : 0.08;
      }

      // If using fallback sphere, also animate its material
      if (mesh.visible || !(mesh.userData.glbModel)) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat && 'emissive' in mat) {
          if (planet.owner !== 0) {
            mat.emissive.setHex(ownerCol);
            mat.emissiveIntensity = 0.25;
          } else {
            mat.emissive.setHex(planet.color);
            mat.emissiveIntensity = 0.1;
          }
        }
      }
    }
  }

  // ── Planet hover glow raycasting ───────────────────────
  private updatePlanetHover() {
    const ndc = this.controls.mouseNdc;
    this.raycasterPlanet.setFromCamera(ndc, this.camera);
    const hits = this.raycasterPlanet.intersectObjects(this.planetMeshes);
    const hitPlanet = hits.length > 0 ? hits[0].object as THREE.Mesh : null;

    // Update hover/select glow — works through atmosphere mesh (GLB planets)
    // or directly on the fallback sphere material
    this.planetMeshes.forEach((mesh, idx) => {
      const planet = this.engine.state.planets[idx];
      if (!planet) return;
      const isHovered  = hitPlanet === mesh;
      const isSelected = planet.id === this.selectedPlanetId;

      // Atmosphere mesh (present when GLB loaded)
      const atm = mesh.userData.atmMesh as THREE.Mesh | undefined;
      if (atm) {
        const aMat = atm.material as THREE.MeshBasicMaterial;
        if (isSelected)      { aMat.color.setHex(0xffffff); aMat.opacity = 0.30; }
        else if (isHovered)  { aMat.color.setHex(planet.color); aMat.opacity = 0.22; }
        else                 { aMat.color.setHex(planet.owner !== 0 ? (TEAM_COLORS[planet.owner]??planet.color) : planet.color); aMat.opacity = planet.owner !== 0 ? 0.14 : 0.08; }
      }
      // Fallback sphere material
      if (mesh.visible) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat && 'emissive' in mat) {
          if (isSelected)      { mat.emissiveIntensity = 0.55; mat.emissive.setHex(0xffffff); }
          else if (isHovered)  { mat.emissiveIntensity = 0.35; mat.emissive.setHex(planet.color); }
          else                 { mat.emissiveIntensity = 0.12; mat.emissive.setHex(planet.color); }
        }
      }
    });
    // Cursor feedback
    this.renderer.domElement.style.cursor = hitPlanet ? 'pointer' : 'default';

    // Update hoveredPlanetId
    if (hitPlanet) {
      const idx = this.planetMeshes.indexOf(hitPlanet);
      this.hoveredPlanetId = this.engine.state.planets[idx]?.id ?? null;
    } else {
      this.hoveredPlanetId = null;
    }
  }

  private onResize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  /** Activate the ability that has .key === keyLetter (Q/W/E/R) across selected ships */
  activateAbilityByKey(keyLetter: string) {
    const state = this.engine.state;
    for (const id of state.selectedIds) {
      const ship = state.ships.get(id);
      if (!ship || ship.dead) continue;
      const idx = ship.abilities.findIndex(ab => ab.ability.key === keyLetter);
      if (idx >= 0) this.activateAbility(idx);
    }
  }

  /** Activate a specific ability by slot index on all selected ships (called from UI) */
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

  // ── Custom hero ship GLB loading ─────────────────────────────
  private async loadCustomHeroModel(shipId: number, meshData: ShipMesh3D) {
    const removeCone = (g: THREE.Group) => {
      const c = g.children.find(ch => (ch as THREE.Mesh).geometry?.type === 'ConeGeometry');
      if (c) g.remove(c);
    };

    // Load and cache the player's hero ship URL once
    if (!this.customHeroUrl && !this.customHeroLoading) {
      this.customHeroLoading = true;
      try {
        const record = await loadHeroShip();
        if (record) {
          this.customHeroUrl = glbBlobToUrl(record.glb);
        }
      } catch { /* no hero ship saved */ }
      this.customHeroLoading = false;
    }

    if (!this.customHeroUrl) return; // no saved ship — keep cone placeholder

    try {
      const gltf = await this.gltfLoader.loadAsync(this.customHeroUrl);
      if (this.disposed) return;
      const ex = this.shipMeshes.get(shipId);
      if (!ex) return;
      const model = gltf.scene;
      // Scale to match dreadnought size (≈24 Three.js units)
      const box = new THREE.Box3().setFromObject(model);
      const modelDiam = box.getSize(new THREE.Vector3()).length();
      if (modelDiam > 0) model.scale.setScalar(24 / modelDiam);
      removeCone(ex.group);
      ex.group.add(model);
    } catch {
      // GLB load failed — keep cone placeholder
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.animFrame);
    window.removeEventListener('resize', this.onResize);
    this.controls.dispose();
    this.renderer.dispose();
    if (this.customHeroUrl) { URL.revokeObjectURL(this.customHeroUrl); this.customHeroUrl = null; }
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    if (this.selectionBoxDiv.parentNode) {
      this.selectionBoxDiv.parentNode.removeChild(this.selectionBoxDiv);
    }
  }
}
