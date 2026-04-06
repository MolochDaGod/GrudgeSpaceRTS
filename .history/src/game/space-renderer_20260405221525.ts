import * as THREE from 'three';
import { getShipPrefab, BACKGROUND_LAYERS, STATION_PREFABS, EFFECT_PREFABS, type SpacePrefab } from './space-prefabs';
import { loadByFormat, loadFBX, loadGLB, getTexture } from './model-loader';
import {
  type SpaceGameState,
  type SpaceShip,
  type SpaceStation,
  type Planet,
  type Team,
  TEAM_COLORS,
  MAP_WIDTH,
  MAP_HEIGHT,
  SHIP_DEFINITIONS,
  CAPTURE_TIME,
  POI_COLORS,
  type GameMode,
} from './space-types';
import { SpaceControls } from './space-controls';
import { SpaceEngine } from './space-engine';
import { applyShipAnimation } from './space-animations';
import { SpaceEffectsRenderer } from './space-effects';
import {
  hasVoxelShip,
  buildVoxelShip,
  buildCapitalVoxelFallback,
  buildVoxelFromSprite,
  buildProceduralShip,
  SPRITE_TO_VOXEL_SHIPS,
} from './space-voxel-builder';
import { loadHeroShip, glbBlobToUrl } from './ship-storage';
import { getBoosterVisualOffsets, getRigAudit, getRigWorldAnchors } from './space-rig';
import { VFXSystem } from './space-vfx';
import { resolvePathUrl } from './asset-registry';

interface ShipMesh3D {
  group: THREE.Group;
  healthBar?: THREE.Mesh;
  healthBg?: THREE.Mesh;
  shieldBar?: THREE.Mesh;
  selectionRing?: THREE.Mesh;
  shieldBubble?: THREE.Mesh;
}

// ── Energy Shield Shader (hex grid + hit ripple + team color) ─────
const SHIELD_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const SHIELD_FRAGMENT = `
  uniform float time;
  uniform float shieldPct;
  uniform float hitFlash;
  uniform vec3 teamColor;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  // Simple hex grid pattern
  float hexGrid(vec2 p) {
    vec2 q = vec2(p.x * 2.0 / 1.732, p.y - p.x / 1.732);
    vec2 pi = floor(q);
    vec2 pf = fract(q);
    float v = mod(pi.x + pi.y, 3.0);
    float ca = step(1.0, v);
    float cb = step(2.0, v);
    vec2 ma = step(pf.xy, pf.yx);
    float e = dot(ma, vec2(1.0 - cb, 1.0) * (1.0 - 2.0 * ca));
    float d = min(min(pf.x, pf.y), min(1.0 - pf.x, 1.0 - pf.y));
    return smoothstep(0.0, 0.06, d);
  }

  void main() {
    // Fresnel rim: stronger at edges
    float fresnel = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    fresnel = pow(fresnel, 2.5);

    // Hex pattern using world position
    float hex = 1.0 - hexGrid(vWorldPos.xz * 3.0 + time * 0.3);
    hex = max(hex, 1.0 - hexGrid(vWorldPos.xy * 2.5 - time * 0.2));

    // Animated pulse
    float pulse = 0.7 + 0.3 * sin(time * 2.5);

    // Combine: base rim + hex pattern + hit flash
    float alpha = (fresnel * 0.6 + hex * 0.15) * shieldPct * pulse;
    alpha += hitFlash * 0.5;
    alpha = clamp(alpha, 0.0, 0.7);

    // Color: team color with white hot-spots on hex lines
    vec3 col = mix(teamColor, vec3(1.0), hex * 0.4 + hitFlash * 0.6);

    gl_FragColor = vec4(col, alpha);
  }
`;

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
  private poiMeshes = new Map<number, THREE.Sprite>();

  private modelCache = new Map<string, THREE.Group>();
  private loadingModels = new Map<string, Promise<THREE.Group>>();
  private textureLoader = new THREE.TextureLoader();

  private selectionBoxDiv!: HTMLDivElement;
  private starField!: THREE.Points;

  public controls!: SpaceControls;
  public engine!: SpaceEngine;
  private effectsRenderer!: SpaceEffectsRenderer;
  private vfx!: VFXSystem;
  /** Ships for which a death explosion has already been fired */
  private explosionFired = new Set<number>();

  // ── Planet interaction ───────────────────────────────
  public hoveredPlanetId: number | null = null;
  public selectedPlanetId: number | null = null;
  /** Called from SpaceControls when the player LMB-clicks a planet. */
  public onPlanetClick?: (planetId: number) => void;
  private raycasterPlanet = new THREE.Raycaster();

  private disposed = false;
  private animFrame = 0;
  private captureRings = new Map<number, THREE.Mesh>();
  private orbitRings = new Map<number, THREE.Mesh>();
  private gameMode: GameMode = '1v1';
  private nodeMeshes = new Map<number, THREE.Mesh>();
  private planetDecorMeshes = new Map<number, THREE.Group>();
  private scenePropCache = new Map<string, THREE.Group>();
  private scenePropLoads = new Map<string, Promise<THREE.Group>>();
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
  /** AI difficulty (1-5). Set before init(). */
  public aiDifficulty: number | null = null;
  /** Campaign properties — set before init(). */
  public campaignFaction: 'wisdom' | 'construct' | 'void' | 'legion' | null = null;
  public campaignGrudgeId: string | null = null;
  public campaignCommanderName: string | null = null;
  public campaignPortrait: string | null = null;

  // Planet decoration assets (from provided props pack)
  private readonly ORBITAL_RING_MODELS = [
    '/assets/space/models/new-ships/Props/_Orbital_structure_01.fbx',
    '/assets/space/models/new-ships/Props/_Orbital_structure_02.fbx',
  ];
  private readonly ASTEROID_RING_MODELS = [
    '/assets/space/models/new-ships/Props/_asteroid_01.fbx',
    '/assets/space/models/new-ships/Props/_asteroid_02.fbx',
    '/assets/space/models/new-ships/Props/_asteroid_03.fbx',
    '/assets/space/models/new-ships/Props/_asteroid_04.fbx',
    '/assets/space/models/new-ships/Props/_asteroid_05.fbx',
    '/assets/space/models/new-ships/Props/_asteroid_06.fbx',
    '/assets/space/models/new-ships/Props/_asteroid_07.fbx',
    '/assets/space/models/new-ships/Props/_asteroid_08.fbx',
    '/assets/space/models/new-ships/Props/_asteroid_09.fbx',
    '/assets/space/models/new-ships/Props/_asteroid_010.fbx',
  ];

  // ── Animated background ─────────────────────────────────
  private twinkleLayers: THREE.Points[] = [];
  private twinkleTime = 0;
  private bgPlanes: Array<{ mesh: THREE.Mesh; drift: { vx: number; vz: number } }> = [];

  // ── Cinematic intro ─────────────────────────────────────
  // On game start: fully zoomed out showing whole sector, then eases in
  // to a comfortable orbital view over the player’s home world.
  private introActive = false;
  private introTimer = 0;
  private readonly introDuration = 4.2; // seconds
  private readonly introZoomStart = 2400; // deep-space — full sector visible
  private readonly introZoomEnd = 160; // close orbit — home world prominent
  // ── Rig debug overlay (F9) ─────────────────────────────
  private rigDebugEnabled = false;
  private rigDebugRoot = new THREE.Group();
  private rigDebugPrinted = new Set<string>();

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
    this.rigDebugRoot.name = 'rigDebugRoot';
    this.rigDebugRoot.visible = false;
    this.scene.add(this.rigDebugRoot);

    this.engine = new SpaceEngine();
    this.engine.hasCustomHero = this.hasCustomHero;
    this.engine.playerCommanderSpec = this.playerCommanderSpec;
    if (this.aiDifficulty != null) this.engine.aiDifficulty = this.aiDifficulty;
    if (this.campaignFaction) this.engine.campaignFaction = this.campaignFaction;
    if (this.campaignGrudgeId != null) this.engine.campaignGrudgeId = this.campaignGrudgeId;
    if (this.campaignCommanderName != null) this.engine.campaignCommanderName = this.campaignCommanderName;
    if (this.campaignPortrait != null) this.engine.campaignPortrait = this.campaignPortrait;
    this.engine.initGame(this.gameMode);

    this.controls = new SpaceControls(this.container, this.camera, this.engine.state, this.renderer);
    this.effectsRenderer = new SpaceEffectsRenderer(this.scene);
    this.vfx = new VFXSystem(this.scene);

    // Wire planet click: controls signals → renderer resolves hovered planet
    this.controls.onPlanetClick = (planetId: number | null) => {
      // Explicit clear (ship/station selection)
      if (planetId === null) {
        this.selectedPlanetId = null;
        this.onPlanetClick?.(-1);
        return;
      }
      // -1 means "select currently hovered planet, if any"
      const resolved = planetId > 0 ? planetId : this.hoveredPlanetId;
      this.selectedPlanetId = resolved ?? null;
      this.onPlanetClick?.(resolved ?? -1);
    };

    // Wire Q/W/E/R ability hotkeys: fires the ability matching that key letter
    this.controls.onAbilityActivateByKey = (key: string) => {
      this.activateAbilityByKey(key);
    };

    this.buildPlanets();
    this.buildResourceNodes();

    // ─ Cinematic intro: center on player's home world, start deep-out ───
    const homePlanet = this.engine.state.planets.find((p) => p.isStartingPlanet && p.owner === 1);
    if (homePlanet) {
      this.controls.cameraState.x = homePlanet.x;
      this.controls.cameraState.y = homePlanet.y;
      this.controls.cameraState.zoom = this.introZoomStart;
      this.introActive = true;
      // Let the player skip by scrolling
      this.controls.onIntroCancel = () => {
        this.introActive = false;
        this.controls.cameraState.zoom = this.introZoomEnd;
      };
    }

    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onRigDebugKeyDown);
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
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      const brightness = 0.4 + Math.random() * 0.6;
      const tint = Math.random();
      // Slight blue-white hue variety
      colors[i3] = brightness * (tint > 0.85 ? 1.0 : 0.75);
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
      size: 2.0,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
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
      pos2[i3] = r * Math.sin(phi) * Math.cos(theta);
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
      path: string;
      opacity: number;
      scale: number;
      vx: number;
      vz: number;
      y: number;
    }> = [
      { path: BACKGROUND_LAYERS.classic.background, opacity: 0.1, scale: 3600, vx: 0.01, vz: 0.006, y: -90 },
      { path: BACKGROUND_LAYERS.classic.stars, opacity: 0.08, scale: 3000, vx: -0.007, vz: 0.009, y: -80 },
      { path: BACKGROUND_LAYERS.classic.farPlanets, opacity: 0.05, scale: 2600, vx: 0.005, vz: -0.008, y: -70 },
    ];

    for (const cfg of configs) {
      const tex = this.textureLoader.load(cfg.path);
      const geo = new THREE.PlaneGeometry(cfg.scale, cfg.scale);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: cfg.opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
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
      position: 'absolute',
      border: '1px solid #4488ff',
      backgroundColor: 'rgba(68, 136, 255, 0.15)',
      pointerEvents: 'none',
      display: 'none',
      zIndex: '50',
    });
    this.container.appendChild(this.selectionBoxDiv);
  }

  // ─ Planet type → GLB model mapping ────────────────────────────
  private readonly PLANET_GLBS: Record<string, string> = {
    volcanic: '/assets/space/models/planets/planet_1.glb',
    oceanic: '/assets/space/models/planets/planet_2.glb',
    crystalline: '/assets/space/models/planets/planet_3.glb',
    gas_giant: '/assets/space/models/planets/planet_4.glb',
    frozen: '/assets/space/models/planets/planet_5.glb',
    barren: '/assets/space/models/planets/planet_main.glb',
  };

  /** Load FBX scene props (rings/asteroids) with cache + cloning. */
  private async loadScenePropFbx(path: string): Promise<THREE.Group> {
    if (this.scenePropCache.has(path)) return this.scenePropCache.get(path)!.clone();
    if (this.scenePropLoads.has(path)) return (await this.scenePropLoads.get(path)!).clone();
    const promise = (async () => {
      const loaded = await loadFBX(path);
      const model = this.sanitizeScenePropModel(loaded.scene, path);
      this.scenePropCache.set(path, model);
      this.scenePropLoads.delete(path);
      return model;
    })();
    this.scenePropLoads.set(path, promise);
    return (await promise).clone();
  }

  private hasRenderableMeshes(root: THREE.Object3D): boolean {
    let count = 0;
    root.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) count++;
    });
    return count > 0;
  }

  /**
   * Removes suspect backdrop/plane meshes from imported FBX props and normalizes
   * materials so decoration assets can't occlude the entire camera view.
   */
  private sanitizeScenePropModel(model: THREE.Group, path: string): THREE.Group {
    const toRemove: THREE.Object3D[] = [];
    const isOrbitalStructure = path.toLowerCase().includes('_orbital_structure_');

    model.traverse((c) => {
      if (!(c as THREE.Mesh).isMesh) return;
      const mesh = c as THREE.Mesh;
      const name = (mesh.name ?? '').toLowerCase();

      const geo = mesh.geometry as THREE.BufferGeometry | undefined;
      if (!geo || !geo.attributes?.position) {
        toRemove.push(mesh);
        return;
      }
      geo.computeBoundingBox();
      const bb = geo.boundingBox;
      if (!bb) {
        toRemove.push(mesh);
        return;
      }

      const size = bb.getSize(new THREE.Vector3());
      const dims = [Math.abs(size.x), Math.abs(size.y), Math.abs(size.z)].sort((a, b) => a - b);
      const thin = dims[0],
        mid = dims[1],
        thick = dims[2];
      const hugeMesh = thick > 5000 || mid > 5000;
      const namedBackdrop = name.includes('background') || name.includes('backdrop') || name === 'plane' || name.startsWith('plane');
      const flatBackdropLike = thick > 0 && thin / thick < 0.006 && mid / thick > 0.7;

      if (hugeMesh || namedBackdrop || (isOrbitalStructure && flatBackdropLike)) {
        toRemove.push(mesh);
        return;
      }

      // Normalize material behavior for decoration props
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const cleaned = mats.map((m) => {
        if (!(m as THREE.Material).isMaterial) return m;
        const out = (m as THREE.Material).clone();
        if ((out as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          const sm = out as THREE.MeshStandardMaterial;
          sm.transparent = false;
          sm.opacity = 1.0;
          sm.depthWrite = true;
          sm.depthTest = true;
          sm.side = THREE.FrontSide;
        } else if ((out as THREE.MeshBasicMaterial).isMeshBasicMaterial) {
          const bm = out as THREE.MeshBasicMaterial;
          bm.transparent = false;
          bm.opacity = 1.0;
          bm.depthWrite = true;
          bm.depthTest = true;
          bm.side = THREE.FrontSide;
        }
        return out;
      });
      mesh.material = Array.isArray(mesh.material) ? cleaned : cleaned[0];
    });

    for (const obj of toRemove) obj.parent?.remove(obj);
    return model;
  }

  /** Deterministic per-node palette variation so nodes aren't all same color. */
  private getNodeVisual(node: { id: number; parentPlanetId: number; kind: string }): {
    color: number;
    emissive: number;
    emissiveIntensity: number;
  } {
    const pick = (arr: number[]) => arr[(node.id + node.parentPlanetId * 3) % arr.length];
    switch (node.kind) {
      case 'moon':
        return { color: pick([0xa89070, 0xb49a79, 0xc2a582]), emissive: 0x1a130d, emissiveIntensity: 0.18 };
      case 'asteroid':
        return { color: pick([0x6a6054, 0x726457, 0x7c6b5d, 0x5c544b]), emissive: 0x0a0807, emissiveIntensity: 0.1 };
      case 'ice_rock':
        return { color: pick([0x8ec2e4, 0x9fd2ee, 0x78b4d8]), emissive: 0x1f4b66, emissiveIntensity: 0.45 };
      case 'crystal_deposit':
        return { color: pick([0x44ffcc, 0x55ffee, 0x66ddff, 0xb57dff]), emissive: 0x00ccaa, emissiveIntensity: 0.6 };
      default:
        return { color: 0x888888, emissive: 0x111111, emissiveIntensity: 0.1 };
    }
  }

  /** Adds ring structures and asteroid belt props around planets. */
  private spawnPlanetDecorations(planet: Planet, worldPos: THREE.Vector3) {
    const deco = new THREE.Group();
    deco.position.copy(worldPos);
    this.scene.add(deco);
    this.planetDecorMeshes.set(planet.id, deco);

    const planetR = planet.radius * WORLD_SCALE;
    const hasRingStructure =
      planet.isStartingPlanet || planet.hasAsteroidField || planet.radius >= 180 || planet.planetType === 'gas_giant';
    if (hasRingStructure) {
      const ringPath = this.ORBITAL_RING_MODELS[planet.id % this.ORBITAL_RING_MODELS.length];
      this.loadScenePropFbx(ringPath)
        .then((ringModel) => {
          if (this.disposed) return;
          const target = this.planetDecorMeshes.get(planet.id);
          if (!target) return;
          if (!this.hasRenderableMeshes(ringModel)) throw new Error('No renderable meshes in orbital ring prop');
          const box = new THREE.Box3().setFromObject(ringModel);
          const size = box.getSize(new THREE.Vector3());
          const sourceDiameter = Math.max(size.x, size.z);
          const targetDiameter = planetR * 2.7;
          if (sourceDiameter > 0) ringModel.scale.setScalar(targetDiameter / sourceDiameter);
          // Keep structure orbiting on world plane around planet
          // Keep model's authored orientation; only apply small random spin for variety.
          ringModel.rotation.z = (planet.id % 8) * (Math.PI / 8);
          ringModel.position.y = 0.35;
          ringModel.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) {
              const mesh = c as THREE.Mesh;
              const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              for (const m of mats) {
                if ((m as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
                  const sm = (m as THREE.MeshStandardMaterial).clone();
                  sm.metalness = 0.85;
                  sm.roughness = 0.25;
                  sm.emissive.setHex(0x1b3040);
                  sm.emissiveIntensity = 0.22;
                  mesh.material = sm;
                }
              }
            }
          });
          target.add(ringModel);
        })
        .catch(() => {
          // Safe procedural fallback ring (prevents scene break if FBX prop is malformed)
          const target = this.planetDecorMeshes.get(planet.id);
          if (!target) return;
          const torus = new THREE.Mesh(
            new THREE.TorusGeometry(planetR * 1.35, Math.max(0.18, planetR * 0.08), 10, 34),
            new THREE.MeshStandardMaterial({
              color: 0x3e4f63,
              metalness: 0.85,
              roughness: 0.28,
              emissive: 0x1b3040,
              emissiveIntensity: 0.2,
            }),
          );
          torus.rotation.x = Math.PI / 2;
          torus.position.y = 0.35;
          target.add(torus);
        });
    }

    const asteroidCount = planet.hasAsteroidField ? 14 : planet.isStartingPlanet ? 4 : 0;
    if (asteroidCount <= 0) return;
    const beltMin = planetR * 1.85;
    const beltMax = planetR * 2.35;
    for (let i = 0; i < asteroidCount; i++) {
      const path = this.ASTEROID_RING_MODELS[(planet.id * 11 + i * 7) % this.ASTEROID_RING_MODELS.length];
      this.loadScenePropFbx(path)
        .then((ast) => {
          if (this.disposed) return;
          const target = this.planetDecorMeshes.get(planet.id);
          if (!target) return;
          if (!this.hasRenderableMeshes(ast)) return;
          const phase = (i / asteroidCount) * Math.PI * 2 + planet.id * 0.37;
          const beltR = beltMin + (beltMax - beltMin) * (((i * 13) % 7) / 6);
          ast.position.set(Math.cos(phase) * beltR, -0.2 + ((i % 5) - 2) * 0.08, Math.sin(phase) * beltR);
          ast.rotation.set((i * 0.5) % (Math.PI * 2), (i * 0.9) % (Math.PI * 2), (i * 0.33) % (Math.PI * 2));
          const box = new THREE.Box3().setFromObject(ast);
          const diam = box.getSize(new THREE.Vector3()).length();
          const targetDiam = planetR * (0.1 + (i % 6) * 0.02);
          if (diam > 0) ast.scale.setScalar(targetDiam / diam);
          ast.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) {
              const mesh = c as THREE.Mesh;
              const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              for (const m of mats) {
                if ((m as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
                  const sm = (m as THREE.MeshStandardMaterial).clone();
                  const tint = [0x7a6658, 0x8a7260, 0x6a5a50][(planet.id + i) % 3];
                  sm.color.multiply(new THREE.Color(tint));
                  sm.emissive.setHex(0x110d09);
                  sm.emissiveIntensity = 0.08;
                  sm.roughness = 0.8;
                  sm.metalness = 0.15;
                  mesh.material = sm;
                }
              }
            }
          });
          target.add(ast);
        })
        .catch(() => {
          /* optional decoration */
        });
    }
  }

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
        loadGLB(glbPath)
          .then((loaded) => {
            if (this.disposed) return;
            const model = loaded.scene;
            // Scale GLB to match planet sphere radius
            const box = new THREE.Box3().setFromObject(model);
            const modelDiam = box.getSize(new THREE.Vector3()).length();
            const targetDiam = planet.radius * WORLD_SCALE * 2.0;
            if (modelDiam > 0) model.scale.setScalar(targetDiam / modelDiam);
            model.position.copy(mesh.position);
            // Add glow atmosphere as emissive ring around GLB
            const atmGeo = new THREE.SphereGeometry(planet.radius * WORLD_SCALE * 1.06, 32, 32);
            const atmMat = new THREE.MeshBasicMaterial({
              color: planet.color,
              transparent: true,
              opacity: 0.08,
              side: THREE.BackSide,
              depthWrite: false,
            });
            const atm = new THREE.Mesh(atmGeo, atmMat);
            atm.position.copy(mesh.position);
            this.scene.add(atm);
            this.scene.add(model);
            // Store ref on mesh.userData so syncPlanetOwnership can animate it
            mesh.userData.glbModel = model;
            mesh.userData.atmMesh = atm;
          })
          .catch(() => {
            // GLB failed — fall back to coloured sphere
            (mesh.material as THREE.Material).dispose();
            (mesh as THREE.Mesh).material = new THREE.MeshStandardMaterial({
              color: planet.color,
              roughness: 0.65,
              metalness: 0.25,
              emissive: planet.color,
              emissiveIntensity: 0.12,
            }) as unknown as THREE.MeshBasicMaterial;
            mesh.visible = true;
          });
      } else {
        // No GLB for this type — use coloured sphere
        (mesh as THREE.Mesh).material = new THREE.MeshStandardMaterial({
          color: planet.color,
          roughness: 0.65,
          metalness: 0.25,
          emissive: planet.color,
          emissiveIntensity: 0.12,
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
      this.orbitRings.set(planet.id, ring);

      // Thin atmosphere glow ring
      const atmGeo = new THREE.RingGeometry(planet.radius * WORLD_SCALE * 1.02, planet.radius * WORLD_SCALE * 1.08, 64);
      const atmMat = new THREE.MeshBasicMaterial({
        color: planet.color,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
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

      // Decorative structures/asteroid belts from provided props pack
      this.spawnPlanetDecorations(planet, mesh.position.clone());
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
      const visual = this.getNodeVisual(node);
      let color: number = visual.color;
      const emissive = visual.emissive;
      const emissiveIntensity = visual.emissiveIntensity;
      const r = node.radius * WORLD_SCALE * NS;
      switch (node.kind) {
        case 'moon':
          geo = new THREE.SphereGeometry(r, 12, 12);
          break;
        case 'asteroid':
          geo = new THREE.IcosahedronGeometry(r, 0);
          break;
        case 'ice_rock':
          geo = new THREE.SphereGeometry(r, 8, 8);
          break;
        case 'crystal_deposit':
          geo = new THREE.OctahedronGeometry(r, 0);
          break;
        default:
          geo = new THREE.SphereGeometry(r, 6, 6);
          color = 0x888888;
      }
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness: 0.2,
        emissive,
        emissiveIntensity,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(node.x * WORLD_SCALE, SpaceRenderer.NODE_Y, node.y * WORLD_SCALE);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.renderOrder = 1;
      mesh.userData.baseScale = 1.0; // for harvest shrink animation
      mesh.userData.baseColor = color;
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
      if (!node) {
        this.scene.remove(mesh);
        this.nodeMeshes.delete(id);
        continue;
      }
      mesh.position.set(node.x * WORLD_SCALE, SpaceRenderer.NODE_Y, node.y * WORLD_SCALE);
      mesh.rotation.y += 0.006;

      // Shrink while being harvested, restore otherwise
      const isBeingHarvested = harvestedNodeIds.has(id);
      const targetScale = isBeingHarvested ? 0.4 : node.harvestCooldown > 0 ? 0.2 : 1.0;
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
        mat.transparent = true;
        mat.opacity = 0.4;
        mat.color.setHex(node.kind === 'crystal_deposit' ? 0x226644 : 0x332211);
      } else {
        mat.transparent = false;
        mat.opacity = 1.0;
        const baseColor = (mesh.userData.baseColor as number | undefined) ?? this.getNodeVisual(node).color;
        mat.color.setHex(baseColor);
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
          const laserColor = ship.workerCargoType === 'energy' ? 0x44ccff : ship.workerCargoType === 'credits' ? 0xffcc44 : 0x44ff88;
          const geo = new THREE.BufferGeometry().setFromPoints([shipPos, nodePos]);
          const mat = new THREE.LineBasicMaterial({
            color: laserColor,
            transparent: true,
            opacity: 0.7,
            linewidth: 2,
            depthWrite: false,
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
        const barCol = ship.workerCargoType === 'energy' ? 0x44ccff : ship.workerCargoType === 'credits' ? 0xffcc44 : 0x44ff88;
        (cb.bar.material as THREE.MeshBasicMaterial).color.setHex(barCol);
      }
    }

    // Clean up lasers/bars for ships no longer mining
    for (const [id, laser] of this.miningLasers) {
      if (!activeMiners.has(id)) {
        this.scene.remove(laser);
        laser.geometry.dispose();
        this.miningLasers.delete(id);
      }
    }
    for (const [id, cb] of this.cargoBars) {
      if (!activeMiners.has(id)) {
        cb.bar.visible = false;
        cb.bg.visible = false;
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
      const loaded = await loadByFormat(prefab.modelPath, prefab.format, {
        mtlPath: prefab.mtlPath,
        texturePath: prefab.texturePath,
      });
      const group = loaded.scene;

      // Apply emissive space-ship look for FBX/OBJ models with textures
      if (prefab.texturePath && prefab.format !== 'glb' && prefab.format !== 'gltf') {
        const tex = getTexture(prefab.texturePath);
        group.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            (c as THREE.Mesh).material = new THREE.MeshStandardMaterial({
              map: tex,
              roughness: 0.35,
              metalness: 0.6,
              emissiveMap: tex,
              emissiveIntensity: 0.2,
              emissive: new THREE.Color(0x223355),
              envMapIntensity: 1.2,
            });
          }
        });
      }

      // Apply authored rotation first (e.g. to fix source axis orientation)
      if (prefab.rotation) group.rotation.copy(prefab.rotation);

      // Auto-center: shift the model so its bounding box center sits at origin.
      // This ensures autoFit() scales symmetrically and the ship pivots from
      // its visual center rather than an off-center import origin.
      SpaceRenderer.autoCenterModel(group);

      if (prefab.offset) group.position.add(prefab.offset);
      this.modelCache.set(key, group);
      this.loadingModels.delete(key);
      return group;
    })();

    this.loadingModels.set(key, promise);
    const result = await promise;
    return result.clone();
  }

  /**
   * Center a model's geometry around the origin so it pivots correctly.
   * Measures bounding box post-rotation and shifts children to compensate.
   */
  private static autoCenterModel(group: THREE.Group): void {
    // Update world matrices so bbox is accurate after rotation
    group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(group);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    // Only shift X and Z; keep Y centered at 0 (ships float at SHIP_Y)
    group.traverse((c) => {
      if (c === group) return;
      if (c.parent === group) {
        c.position.x -= center.x;
        c.position.z -= center.z;
        // Center Y only if model is significantly off-center vertically
        if (Math.abs(center.y) > 0.5) c.position.y -= center.y;
      }
    });
  }

  /**
   * Tint a loaded 3D model to a team's colour.
   * PBR-aware: preserves metallic-roughness, normal maps, and emissive maps
   * from GLTF models. Only hue-shifts the baseColor map + color uniform.
   * Non-PBR models (FBX/OBJ) get full hue-shift as before.
   */
  private static tintModelToTeam(model: THREE.Object3D, team: number): void {
    const hex = TEAM_COLORS[team] ?? 0x4488ff;
    const teamColor = new THREE.Color(hex);
    const teamHSL = { h: 0, s: 0, l: 0 };
    teamColor.getHSL(teamHSL);

    model.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        if (!mat) continue;
        const isStd = (mat as THREE.MeshStandardMaterial).isMeshStandardMaterial;
        const isPhong = (mat as THREE.MeshPhongMaterial).isMeshPhongMaterial;
        if (!isStd && !isPhong) continue;

        // Convert Phong → Standard so we have a single tinting path
        let stdMat: THREE.MeshStandardMaterial;
        if (isStd) {
          stdMat = (mat as THREE.MeshStandardMaterial).clone();
        } else {
          const phong = mat as THREE.MeshPhongMaterial;
          stdMat = new THREE.MeshStandardMaterial({
            color: phong.color.clone(),
            map: phong.map,
            emissive: phong.emissive.clone(),
            roughness: 0.5,
            metalness: 0.55,
          });
        }

        // Detect PBR models (GLTF): they have metallicRoughness maps or normal maps
        const isPBR = isStd && !!(stdMat.metalnessMap || stdMat.roughnessMap || stdMat.normalMap);

        // HSL hue-shift the base color
        const srcHSL = { h: 0, s: 0, l: 0 };
        stdMat.color.getHSL(srcHSL);
        stdMat.color.setHSL(teamHSL.h, Math.max(srcHSL.s, 0.5), Math.min(Math.max(srcHSL.l, 0.25), 0.7));

        if (isPBR) {
          // PBR path: respect authored metalness/roughness, add team-colored emissive edge glow
          stdMat.metalness = Math.max(stdMat.metalness, 0.55);
          stdMat.roughness = Math.min(stdMat.roughness, 0.5);
          // Subtle team emissive — don't overwrite authored emissive maps
          if (!stdMat.emissiveMap) {
            stdMat.emissive.setHSL(teamHSL.h, teamHSL.s * 0.8, 0.12);
            stdMat.emissiveIntensity = 0.35;
          } else {
            // Has emissive map: boost intensity, tint towards team color
            stdMat.emissive.setHSL(teamHSL.h, 0.6, 0.15);
            stdMat.emissiveIntensity = Math.max(stdMat.emissiveIntensity, 0.4);
          }
          // Only tint baseColor map, preserve all other PBR maps
          if (stdMat.map) {
            stdMat.map = SpaceRenderer.hueShiftTexture(stdMat.map, teamHSL.h);
            stdMat.map.needsUpdate = true;
          }
        } else {
          // Non-PBR path: aggressive team tint for FBX/OBJ models
          stdMat.emissive.setHSL(teamHSL.h, teamHSL.s, 0.15);
          stdMat.emissiveIntensity = 0.45;
          if (stdMat.map) {
            stdMat.map = SpaceRenderer.hueShiftTexture(stdMat.map, teamHSL.h);
            stdMat.map.needsUpdate = true;
            if (stdMat.emissiveMap) {
              stdMat.emissiveMap = stdMat.map;
            }
          }
        }

        mesh.material = stdMat;
      }
    });
  }

  /**
   * Create a hue-shifted copy of a THREE.Texture by drawing it to an
   * offscreen canvas and rotating hue via HSL manipulation.
   * Returns a new CanvasTexture with the team's hue.
   */
  private static hueShiftTexture(srcTex: THREE.Texture, targetHue: number): THREE.CanvasTexture {
    const img = srcTex.image as HTMLImageElement | HTMLCanvasElement | ImageBitmap;
    if (!img || !('width' in img && img.width > 0)) return srcTex as unknown as THREE.CanvasTexture;

    const w = img.width;
    const h = img.height;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img as CanvasImageSource, 0, 0);

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      // RGB to HSL
      const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
      let hue = 0;
      const light = (max + min) / 2;
      const sat = max === min ? 0 : light > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
      if (max !== min) {
        const d = max - min;
        if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) hue = ((b - r) / d + 2) / 6;
        else hue = ((r - g) / d + 4) / 6;
      }
      // Replace hue, keep sat boosted, keep lightness
      void hue; // original hue discarded
      const nh = targetHue;
      const ns = Math.max(sat, 0.4);
      const nl = light;
      // HSL to RGB
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      if (ns === 0) {
        data[i] = data[i + 1] = data[i + 2] = Math.round(nl * 255);
      } else {
        const q2 = nl < 0.5 ? nl * (1 + ns) : nl + ns - nl * ns;
        const p2 = 2 * nl - q2;
        data[i] = Math.round(hue2rgb(p2, q2, nh + 1 / 3) * 255);
        data[i + 1] = Math.round(hue2rgb(p2, q2, nh) * 255);
        data[i + 2] = Math.round(hue2rgb(p2, q2, nh - 1 / 3) * 255);
      }
    }
    ctx.putImageData(imageData, 0, 0);

    const canvasTex = new THREE.CanvasTexture(canvas);
    canvasTex.colorSpace = srcTex.colorSpace;
    canvasTex.wrapS = srcTex.wrapS;
    canvasTex.wrapT = srcTex.wrapT;
    canvasTex.minFilter = srcTex.minFilter;
    canvasTex.magFilter = srcTex.magFilter;
    return canvasTex;
  }

  /** Ships float above the ground plane so they render above planet equators. */
  private static readonly SHIP_Y = 3.5;

  /** Target diameter (Three.js units) for each ship class — models are auto-scaled to fit.
   *  Scaled so fighters ≈ 10% of a starting planet (28 TJS diameter).
   *  A dreadnought is ≈ 25% of a planet — big but not absurd. */
  private static shipClassSize(cls: string): number {
    switch (cls) {
      case 'dreadnought':
        return 7.0;
      case 'battleship':
        return 6.2;
      case 'carrier':
        return 5.5;
      case 'cruiser':
        return 5.0;
      case 'light_cruiser':
        return 4.5;
      case 'destroyer':
        return 4.0;
      case 'frigate':
        return 3.6;
      case 'corvette':
        return 3.2;
      case 'assault_frigate':
        return 3.6;
      case 'worker':
        return 2.4;
      default:
        return 2.8; // fighters, scouts, etc.
    }
  }

  private createPlaceholder(team: Team, shipClass: string, shipType: string): THREE.Group {
    const group = new THREE.Group();

    // Sizes chosen so ships are visible from orbital zoom (~160 units).
    // At zoom 160, visible width ≈ 264 Three.js units; a 3-unit ship = ~1.1%
    // of screen width ≈ 21px at 1920×1080 — clearly clickable.
    // 3× the original sizes so ships are clearly visible at all zoom levels.
    // At orbital zoom 160: visible width ≈ 264 Three.js — a size-9 fighter
    // occupies ~3.4% of screen (65px) and a size-24 dreadnought ~9% (173px).
    const size = SpaceRenderer.shipClassSize(shipClass);

    // Ship silhouette placeholder (tapered fuselage + fins) instead of a plain cone.
    // This reads as a ship even during the async model-load window.
    const col = TEAM_COLORS[team] ?? 0x4488ff;
    const matOpts = { color: col, emissive: col, emissiveIntensity: 0.8, metalness: 0.5, roughness: 0.35, depthTest: true };
    const hullMat = new THREE.MeshStandardMaterial(matOpts);

    // Main fuselage: tapered box
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.2, size * 0.35, size * 1.2, 6), hullMat);
    fuselage.rotation.x = Math.PI / 2; // point along +Z
    fuselage.renderOrder = 2;
    group.add(fuselage);

    // Dorsal fin
    const finGeo = new THREE.BoxGeometry(size * 0.04, size * 0.35, size * 0.5);
    const fin = new THREE.Mesh(finGeo, hullMat);
    fin.position.set(0, size * 0.25, -size * 0.15);
    fin.renderOrder = 2;
    group.add(fin);

    // Wing stubs
    const wingGeo = new THREE.BoxGeometry(size * 0.8, size * 0.04, size * 0.35);
    const wings = new THREE.Mesh(wingGeo, hullMat);
    wings.position.set(0, 0, -size * 0.1);
    wings.renderOrder = 2;
    group.add(wings);

    // Thruster: layered glow sprites at inferred tail/booster anchors.
    // Names follow thruster[_n], thrusterCore[_n], thrusterTrail[_n]
    // so sync logic can pulse all boosters per ship.
    const thrusterCol = TEAM_COLORS[team] ?? 0x4488ff;
    const boosterOffsets = getBoosterVisualOffsets(shipType, shipClass as import('./space-types').ShipClass);
    const anchors = boosterOffsets.length ? boosterOffsets : [{ x: 0, y: 0, z: -size * 0.55 }];
    anchors.forEach((p, i) => {
      const suffix = i === 0 ? '' : `_${i}`;
      // Outer glow (team color, larger, softer)
      const outerMat = new THREE.SpriteMaterial({
        color: thrusterCol,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const outer = new THREE.Sprite(outerMat);
      outer.scale.set(size * 0.5, size * 0.5, 1);
      outer.position.set(p.x, p.y, p.z);
      outer.name = `thruster${suffix}`;
      group.add(outer);

      // Inner core (white-hot, smaller, brighter)
      const coreMat = new THREE.SpriteMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const core = new THREE.Sprite(coreMat);
      core.scale.set(size * 0.2, size * 0.2, 1);
      core.position.set(p.x, p.y, p.z + size * 0.05);
      core.name = `thrusterCore${suffix}`;
      group.add(core);

      // Trail flicker (elongated, fades out behind)
      const trailMat = new THREE.SpriteMaterial({
        color: thrusterCol,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const trail = new THREE.Sprite(trailMat);
      trail.scale.set(size * 0.25, size * 0.7, 1);
      trail.position.set(p.x, p.y, p.z - size * 0.35);
      trail.name = `thrusterTrail${suffix}`;
      group.add(trail);
    });

    return group;
  }

  // ── Sync Game State to 3D ───────────────────────────────────
  private syncShips(state: SpaceGameState, dt: number) {
    // Remove dead ships — fire explosion VFX on first death frame
    for (const [id, mesh] of this.shipMeshes) {
      const ship = state.ships.get(id);
      if (!ship || ship.dead) {
        if (ship?.dead && !this.explosionFired.has(id)) {
          this.explosionFired.add(id);
          const col = TEAM_COLORS[ship.team] ?? 0xff6622;
          const sz = SpaceRenderer.shipClassSize(ship.shipClass);
          this.vfx.spawnExplosion(ship.x, ship.y, ship.z, sz, col);
          this.vfx.removeEngineTrails(id);
        }
        this.scene.remove(mesh.group);
        this.shipMeshes.delete(id);
        this.explosionFired.delete(id);
      }
    }

    // Add/update ships
    for (const [id, ship] of state.ships) {
      if (ship.dead) continue;
      // Fog: hide non-player ships outside team-1 vision
      if (ship.team !== 1) {
        const vis = this.engine.isVisible(1, ship.x, ship.y);
        const ex = this.shipMeshes.get(id);
        if (ex) ex.group.visible = vis;
        if (!vis) continue;
      }
      let meshData = this.shipMeshes.get(id);

      if (!meshData) {
        // Create placeholder immediately, load real model async
        const group = this.createPlaceholder(ship.team, ship.shipClass, ship.shipType);
        this.scene.add(group);
        meshData = { group };
        this.shipMeshes.set(id, meshData);
        // Attach engine trails (three.quarks) immediately
        this.vfx.attachEngineTrails(id, group, TEAM_COLORS[ship.team] ?? 0x4488ff, ship.shipClass);

        // Add selection ring — sized to match the ship class, not tier
        const shipDef = SHIP_DEFINITIONS[ship.shipType];
        const ringR = SpaceRenderer.shipClassSize(ship.shipClass) * 0.45;
        const ringGeo = new THREE.RingGeometry(ringR, ringR + 0.3, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x44ff44,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthTest: false,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -0.5; // just below the ship model, not on the ground
        ring.renderOrder = 3;
        group.add(ring);
        meshData.selectionRing = ring;

        // Add health bar — positioned above ship, always faces camera
        const barW = Math.max(1.5, (shipDef?.stats.tier ?? 1) * 0.8);
        const hbBg = new THREE.Mesh(
          new THREE.PlaneGeometry(barW, 0.18),
          new THREE.MeshBasicMaterial({ color: 0x222233, depthTest: false }),
        );
        hbBg.position.y = 2.2; // above the elevated ship
        hbBg.renderOrder = 999;
        group.add(hbBg);
        meshData.healthBg = hbBg;

        const hb = new THREE.Mesh(
          new THREE.PlaneGeometry(barW, 0.18),
          new THREE.MeshBasicMaterial({ color: TEAM_COLORS[ship.team], depthTest: false }),
        );
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
        const removePlaceholder = (g: THREE.Group) => {
          // Remove all placeholder geometry (fuselage, fins, wings)
          const toRemove = g.children.filter((ch) => {
            const geo = (ch as THREE.Mesh).geometry;
            if (!geo) return false;
            const t = geo.type;
            return t === 'ConeGeometry' || t === 'CylinderGeometry' || t === 'BoxGeometry';
          });
          toRemove.forEach((c) => g.remove(c));
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
          // Convert 2D sprite to 3D voxel model async
          const shipId = id;
          const shipTeamForVox = ship.team;
          // Boss captains get higher res (24) and more extrusion (5)
          const isBoss = ship.shipType.startsWith('boss_captain');
          buildVoxelFromSprite(spritePath, shipTeamForVox, isBoss ? 32 : 24, isBoss ? 7 : 5)
            .then((voxModel) => {
              if (this.disposed) return;
              const ex = this.shipMeshes.get(shipId);
              if (!ex) return;
              autoFit(voxModel);
              removePlaceholder(ex.group);
              const oldSprite = ex.group.getObjectByName('spriteShip');
              if (oldSprite) ex.group.remove(oldSprite);
              voxModel.name = 'voxelShip';
              ex.group.add(voxModel);
            })
            .catch(() => {
              // Voxel conversion failed — build procedural fallback
              const ex2 = this.shipMeshes.get(shipId);
              if (ex2 && !this.disposed) {
                const proc = buildProceduralShip(ship.shipClass, shipDef?.stats.tier ?? 2, ship.team);
                autoFit(proc);
                removePlaceholder(ex2.group);
                ex2.group.add(proc);
              }
            });
        } else if (ship.shipType === 'custom_hero') {
          this.loadCustomHeroModel(id, meshData);
        } else if (prefab) {
          const shipTeam = ship.team; // capture for async closure
          this.loadModel(prefab)
            .then((model) => {
              if (this.disposed) return;
              const ex = this.shipMeshes.get(id);
              if (!ex) return;
              autoFit(model);
              SpaceRenderer.tintModelToTeam(model, shipTeam);
              removePlaceholder(ex.group);
              ex.group.add(model);
            })
            .catch(() => {
              // Real model failed — fall back to procedural voxel, then universal
              const ex = this.shipMeshes.get(id);
              if (!ex || this.disposed) return;
              let vox = hasVoxelShip(ship.shipType)
                ? buildVoxelShip(ship.shipType, ship.team)
                : buildCapitalVoxelFallback(ship.shipType, ship.team);
              if (!vox) {
                // Universal last-resort: procedural ship from class+tier
                vox = buildProceduralShip(ship.shipClass, shipDef?.stats.tier ?? 2, ship.team);
              }
              autoFit(vox);
              removePlaceholder(ex.group);
              ex.group.add(vox);
            });
        } else if (hasVoxelShip(ship.shipType)) {
          // No prefab — build voxel immediately (no async load wait)
          const vox = buildVoxelShip(ship.shipType, ship.team);
          if (vox) {
            autoFit(vox);
            removePlaceholder(meshData.group);
            meshData.group.add(vox);
          }
        } else {
          // No prefab, no specific voxel — universal procedural fallback
          const proc = buildProceduralShip(ship.shipClass, shipDef?.stats.tier ?? 2, ship.team);
          autoFit(proc);
          removePlaceholder(meshData.group);
          meshData.group.add(proc);
        }
      }

      // Update position — ships float SHIP_Y units above the scene plane
      // so they are always visible above planet spheres (which sit at y=0)
      // and the 55° camera never depth-buffers them behind terrain.
      meshData.group.position.set(
        ship.x * WORLD_SCALE,
        SpaceRenderer.SHIP_Y + ship.z * WORLD_SCALE, // elevated above ground
        ship.y * WORLD_SCALE,
      );
      meshData.group.rotation.y = -ship.facing;

      // Apply procedural animation
      applyShipAnimation(meshData.group, ship, dt);

      // Engine VFX trails (three.quarks) — active when moving or boosting
      this.vfx.setEngineActive(id, ship.animState === 'moving' || ship.animState === 'speed_boost', ship.animState === 'speed_boost');

      // Thruster glow: layered sprites pulse when moving
      const isMoving = ship.animState === 'moving' || ship.animState === 'speed_boost';
      const boost = ship.animState === 'speed_boost' ? 1.6 : 1.0;
      const baseSz = SpaceRenderer.shipClassSize(ship.shipClass);
      const tPhase = this.twinkleTime * 6 + ship.id * 0.7;

      const sprites = meshData.group.children.filter((c) => (c as THREE.Sprite).isSprite) as THREE.Sprite[];
      const thrusters = sprites.filter((s) => s.name === 'thruster' || s.name.startsWith('thruster_'));
      const cores = sprites.filter((s) => s.name === 'thrusterCore' || s.name.startsWith('thrusterCore_'));
      const trails = sprites.filter((s) => s.name === 'thrusterTrail' || s.name.startsWith('thrusterTrail_'));

      for (const thruster of thrusters) {
        const mat = thruster.material as THREE.SpriteMaterial;
        const targetOp = isMoving ? 0.4 + 0.3 * Math.abs(Math.sin(tPhase)) : 0;
        mat.opacity += (targetOp - mat.opacity) * 0.2;
        const sz = baseSz * 0.5 * boost;
        thruster.scale.set(sz, sz, 1);
      }
      for (const core of cores) {
        const mat = core.material as THREE.SpriteMaterial;
        mat.opacity += ((isMoving ? 0.7 + 0.3 * Math.abs(Math.sin(tPhase * 1.3)) : 0) - mat.opacity) * 0.25;
        const sz = baseSz * 0.2 * boost;
        core.scale.set(sz, sz, 1);
      }
      for (const trail of trails) {
        const mat = trail.material as THREE.SpriteMaterial;
        mat.opacity += ((isMoving ? 0.3 + 0.25 * Math.abs(Math.sin(tPhase * 0.8 + 1.5)) : 0) - mat.opacity) * 0.15;
        const szW = baseSz * 0.25 * boost;
        const szH = baseSz * (0.7 + 0.3 * Math.abs(Math.sin(tPhase * 0.6))) * boost;
        trail.scale.set(szW, szH, 1);
      }

      // ── Energy Shield Bubble ──
      if (ship.maxShield > 0) {
        if (!meshData.shieldBubble) {
          const shieldRadius = SpaceRenderer.shipClassSize(ship.shipClass) * 0.65;
          const shieldGeo = new THREE.SphereGeometry(shieldRadius, 24, 16);
          const teamHex = TEAM_COLORS[ship.team] ?? 0x4488ff;
          const shieldMat = new THREE.ShaderMaterial({
            uniforms: {
              time: { value: 0 },
              shieldPct: { value: 1.0 },
              hitFlash: { value: 0.0 },
              teamColor: { value: new THREE.Color(teamHex) },
            },
            vertexShader: SHIELD_VERTEX,
            fragmentShader: SHIELD_FRAGMENT,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
          });
          const bubble = new THREE.Mesh(shieldGeo, shieldMat);
          bubble.renderOrder = 5;
          meshData.group.add(bubble);
          meshData.shieldBubble = bubble;
        }
        const mat = meshData.shieldBubble.material as THREE.ShaderMaterial;
        mat.uniforms.time.value = this.twinkleTime;
        mat.uniforms.shieldPct.value = ship.shield / ship.maxShield;
        // Flash on recent damage (shield < 90% and dropping)
        const flash = ship.shield < ship.maxShield * 0.9 ? 0.3 : 0.0;
        mat.uniforms.hitFlash.value += (flash - mat.uniforms.hitFlash.value) * 0.15;
        meshData.shieldBubble.visible = ship.shield > 0;
      }

      // Update health bar — hide at extreme zoom (ships are sub-pixel)
      if (meshData.healthBar) {
        const zoom = this.controls.cameraState.zoom;
        const showBar = zoom < 600;
        meshData.healthBar.visible = showBar;
        meshData.healthBg!.visible = showBar;
        if (showBar) {
          const pct = ship.hp / ship.maxHp;
          meshData.healthBar.scale.x = Math.max(0.01, pct);
          meshData.healthBar.position.x = -(1 - pct) * 0.75;
          (meshData.healthBar.material as THREE.MeshBasicMaterial).color.setHex(pct > 0.5 ? 0x44ff44 : pct > 0.25 ? 0xffaa00 : 0xff4444);
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
        this.vfx.removeProjectileTrail(id);
      }
    }

    // Bomb sprite mapping: projectile type → bomb PNG
    const BOMB_SPRITES: Record<string, string> = {
      missile: '/assets/space/ui/bombs/1 Bombs/3.png',
      torpedo: '/assets/space/ui/bombs/1 Bombs/7.png',
      railgun: '/assets/space/ui/bombs/1 Bombs/1.png',
      laser: '/assets/space/ui/bombs/1 Bombs/10.png',
      pulse: '/assets/space/ui/bombs/1 Bombs/5.png',
    };

    for (const [id, proj] of state.projectiles) {
      let mesh = this.projectileMeshes.get(id);
      if (!mesh) {
        // Use bomb sprite as billboard instead of geometry
        const bombPath = BOMB_SPRITES[proj.type] ?? BOMB_SPRITES.laser;
        const tex = this.textureLoader.load(bombPath);
        const spriteMat = new THREE.SpriteMaterial({
          map: tex,
          color: proj.trailColor,
          transparent: true,
          depthWrite: false,
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
        // Attach quarks trail for missiles/torpedoes/energy beams
        this.vfx.attachProjectileTrail(id, proj.trailColor, proj.type);
      }
      mesh.position.set(proj.x * WORLD_SCALE, proj.z * WORLD_SCALE + 5, proj.y * WORLD_SCALE);
      this.vfx.updateProjectileTrail(id, proj.x, proj.y, proj.z);
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
        display: 'block',
        left: `${left}px`,
        top: `${top}px`,
        width: `${w}px`,
        height: `${h}px`,
      });
    } else {
      this.selectionBoxDiv.style.display = 'none';
    }
  }

  // ── Camera ─────────────────────────────────────────────────────
  private updateCamera() {
    const cam = this.controls.cameraState;
    const dist = cam.zoom;
    const pitch = cam.angle * (Math.PI / 180); // tilt (55°)
    const yaw = cam.rotation * (Math.PI / 180); // horizontal orbit (Q/E)

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
    // Update three.quarks particle systems (engine trails, explosions, trails)
    this.vfx.update(dt);
    // Sync mine VFX warnings
    this.syncMines(this.engine.state);
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
      const t = Math.min(1, this.introTimer / this.introDuration);
      const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic — fast start, gentle land
      this.controls.cameraState.zoom = this.introZoomStart + (this.introZoomEnd - this.introZoomStart) * ease;
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

    // Sync POI 3D markers
    this.syncPOIs(this.engine.state);

    // Sync capture rings
    this.syncCaptureRings(this.engine.state);

    // Sync planet ownership colors
    this.syncPlanetOwnership(this.engine.state);

    // Sync rally point flags
    this.syncRallyFlags(this.engine.state);
    // Optional rig debug overlay for selected ships (F9)
    this.updateRigDebugOverlay(this.engine.state);

    this.renderer.render(this.scene, this.camera);
  };

  // ── Mine VFX Sync ──────────────────────────────────────────────
  private syncMines(state: SpaceGameState): void {
    for (const [id, mine] of state.mines) {
      if (mine.dead) {
        this.vfx.removeMineWarning(id);
        continue;
      }
      // Spawn warning marker if not yet registered
      this.vfx.spawnMineWarning(id, mine.x, mine.y, TEAM_COLORS[mine.team] ?? 0xff4400);
      this.vfx.updateMineWarning(id, mine.blinkPhase);
    }
  }

  // ── Station Rendering ──────────────────────────────────────────────────
  private syncStations(state: SpaceGameState) {
    // Remove deleted
    for (const [id, mesh] of this.stationMeshes) {
      if (!state.stations.has(id)) {
        this.scene.remove(mesh);
        this.stationMeshes.delete(id);
      }
    }
    // Add/update
    for (const [id, station] of state.stations) {
      if (station.dead) continue;
      // Fog: hide enemy stations outside team-1 vision
      if (station.team !== 1) {
        const vis = this.engine.isVisible(1, station.x, station.y);
        const ex = this.stationMeshes.get(id);
        if (ex) ex.visible = vis;
        if (!vis) continue;
      }
      let mesh = this.stationMeshes.get(id);
      if (!mesh) {
        mesh = new THREE.Group();
        const body = new THREE.Mesh(
          new THREE.OctahedronGeometry(2, 1),
          new THREE.MeshStandardMaterial({
            color: TEAM_COLORS[station.team] ?? 0x4488ff,
            emissive: TEAM_COLORS[station.team] ?? 0x4488ff,
            emissiveIntensity: 0.4,
            metalness: 0.6,
            roughness: 0.3,
          }),
        );
        mesh.add(body);
        // Ring around station
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(2.5, 2.7, 32),
          new THREE.MeshBasicMaterial({
            color: TEAM_COLORS[station.team] ?? 0x4488ff,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
          }),
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

  // ── Points of Interest (3D glowing markers) ────────────────
  private syncPOIs(state: SpaceGameState) {
    const pois = state.pois;
    const t = state.gameTime;
    // Cleanup stale
    for (const [id, spr] of this.poiMeshes) {
      if (!pois.find((p) => p.id === id)) {
        this.scene.remove(spr);
        this.poiMeshes.delete(id);
      }
    }
    for (const poi of pois) {
      const fogVis = this.engine.fogState(1, poi.x, poi.y);
      const show = poi.discovered || fogVis === 2;
      let spr = this.poiMeshes.get(poi.id);
      if (!show) {
        if (spr) spr.visible = false;
        continue;
      }
      if (!spr) {
        const mat = new THREE.SpriteMaterial({
          color: new THREE.Color(POI_COLORS[poi.type]),
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        spr = new THREE.Sprite(mat);
        spr.renderOrder = 5;
        this.scene.add(spr);
        this.poiMeshes.set(poi.id, spr);
      }
      spr.visible = true;
      spr.position.set(poi.x * WORLD_SCALE, 6, poi.y * WORLD_SCALE);
      const mat = spr.material as THREE.SpriteMaterial;
      if (poi.claimedByTeam !== null) {
        mat.opacity = 0.3;
        spr.scale.set(2, 2, 1);
      } else if (poi.discovered) {
        const pulse = 0.8 + 0.2 * Math.sin(t * 2 + poi.id);
        mat.opacity = pulse;
        spr.scale.set(2.5 * pulse, 2.5 * pulse, 1);
      } else {
        mat.opacity = 0.15;
        spr.scale.set(1.5, 1.5, 1);
      }
    }
  }

  // ── Planet Turrets (visible orbiting defense) ───────────────
  private syncPlanetTurrets(state: SpaceGameState) {
    // Remove dead turrets
    for (const [id, mesh] of this.turretMeshes) {
      if (!state.planetTurrets.has(id)) {
        this.scene.remove(mesh);
        this.turretMeshes.delete(id);
      }
    }
    for (const [id, turret] of state.planetTurrets) {
      if (turret.dead) continue;
      // Fog: hide enemy turrets outside team-1 vision
      if (turret.team !== 1) {
        const vis = this.engine.isVisible(1, turret.x, turret.y);
        const ex = this.turretMeshes.get(id);
        if (ex) ex.visible = vis;
        if (!vis) continue;
      }
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
        if (existing) {
          this.scene.remove(existing);
          this.planetBuildingMeshes.delete(planet.id);
        }
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
        bldg.position.set(Math.cos(angle) * dist, 0.3, Math.sin(angle) * dist);
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
      if (!state.stations.has(id)) {
        this.scene.remove(sprite);
        this.rallyMeshes.delete(id);
      }
    }
    for (const [id, st] of state.stations) {
      if (st.dead || st.team !== 1 || !st.rallyPoint) {
        const old = this.rallyMeshes.get(id);
        if (old) {
          this.scene.remove(old);
          this.rallyMeshes.delete(id);
        }
        continue;
      }
      let flag = this.rallyMeshes.get(id);
      if (!flag) {
        const mat = new THREE.SpriteMaterial({
          color: 0x44ff44,
          transparent: true,
          opacity: 0.6,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        flag = new THREE.Sprite(mat);
        flag.scale.set(1.5, 2.5, 1);
        flag.renderOrder = 5;
        this.scene.add(flag);
        this.rallyMeshes.set(id, flag);
      }
      flag.position.set(
        st.rallyPoint.x * WORLD_SCALE,
        4 + Math.sin(this.twinkleTime * 2 + id) * 0.3, // gentle bob
        st.rallyPoint.y * WORLD_SCALE,
      );
    }
  }

  private syncPlanetOwnership(state: SpaceGameState) {
    for (let i = 0; i < state.planets.length && i < this.planetMeshes.length; i++) {
      const planet = state.planets[i];
      const mesh = this.planetMeshes[i];
      const ownerCol = TEAM_COLORS[planet.owner] ?? planet.color;

      // Update atmosphere glow colour (for GLB planets)
      const atm = mesh.userData.atmMesh as THREE.Mesh | undefined;
      if (atm) {
        (atm.material as THREE.MeshBasicMaterial).color.setHex(planet.owner !== 0 ? ownerCol : planet.color);
        (atm.material as THREE.MeshBasicMaterial).opacity = planet.owner !== 0 ? 0.14 : 0.08;
      }

      // If using fallback sphere, also animate its material
      if (mesh.visible || !mesh.userData.glbModel) {
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

      // Orbit ring ownership tint
      const orbitRing = this.orbitRings.get(planet.id);
      if (orbitRing) {
        const rMat = orbitRing.material as THREE.MeshBasicMaterial;
        rMat.color.setHex(planet.owner !== 0 ? ownerCol : 0x334466);
        rMat.opacity = planet.owner !== 0 ? 0.42 : 0.24;
      }
    }
  }

  // ── Planet hover glow raycasting ───────────────────────
  private updatePlanetHover() {
    const ndc = this.controls.mouseNdc;
    this.raycasterPlanet.setFromCamera(ndc, this.camera);
    const hits = this.raycasterPlanet.intersectObjects(this.planetMeshes);
    const hitPlanet = hits.length > 0 ? (hits[0].object as THREE.Mesh) : null;

    // Update hover/select glow — works through atmosphere mesh (GLB planets)
    // or directly on the fallback sphere material
    this.planetMeshes.forEach((mesh, idx) => {
      const planet = this.engine.state.planets[idx];
      if (!planet) return;
      const isHovered = hitPlanet === mesh;
      const isSelected = planet.id === this.selectedPlanetId;

      // Atmosphere mesh (present when GLB loaded)
      const atm = mesh.userData.atmMesh as THREE.Mesh | undefined;
      if (atm) {
        const aMat = atm.material as THREE.MeshBasicMaterial;
        if (isSelected) {
          aMat.color.setHex(0xffffff);
          aMat.opacity = 0.3;
        } else if (isHovered) {
          aMat.color.setHex(planet.color);
          aMat.opacity = 0.22;
        } else {
          aMat.color.setHex(planet.owner !== 0 ? (TEAM_COLORS[planet.owner] ?? planet.color) : planet.color);
          aMat.opacity = planet.owner !== 0 ? 0.14 : 0.08;
        }
      }
      // Fallback sphere material
      if (mesh.visible) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat && 'emissive' in mat) {
          if (isSelected) {
            mat.emissiveIntensity = 0.55;
            mat.emissive.setHex(0xffffff);
          } else if (isHovered) {
            mat.emissiveIntensity = 0.35;
            mat.emissive.setHex(planet.color);
          } else {
            mat.emissiveIntensity = 0.12;
            mat.emissive.setHex(planet.color);
          }
        }
      }

      // Orbit ring highlight for hover/selection
      const orbitRing = this.orbitRings.get(planet.id);
      if (orbitRing) {
        const rMat = orbitRing.material as THREE.MeshBasicMaterial;
        if (isSelected) {
          rMat.color.setHex(0xffffff);
          rMat.opacity = 0.72;
        } else if (isHovered) {
          rMat.color.setHex(planet.owner !== 0 ? (TEAM_COLORS[planet.owner] ?? planet.color) : planet.color);
          rMat.opacity = 0.56;
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

  private onRigDebugKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'F9') return;
    e.preventDefault();
    this.rigDebugEnabled = !this.rigDebugEnabled;
    this.rigDebugRoot.visible = this.rigDebugEnabled;
    this.rigDebugPrinted.clear();
    if (!this.rigDebugEnabled) this.clearRigDebugOverlay();
    if (this.engine?.state) {
      this.engine.state.alerts.push({
        id: this.engine.state.nextId++,
        x: this.controls.cameraState.x,
        y: this.controls.cameraState.y,
        z: 0,
        type: 'build_complete',
        time: this.engine.state.gameTime,
        message: `Rig Debug ${this.rigDebugEnabled ? 'ON' : 'OFF'} (F9)`,
      });
    }
  };

  private rigWorldToThree(p: { x: number; y: number; z: number }): THREE.Vector3 {
    return new THREE.Vector3(p.x * WORLD_SCALE, SpaceRenderer.SHIP_Y + p.z * WORLD_SCALE + 0.05, p.y * WORLD_SCALE);
  }

  private clearRigDebugOverlay() {
    while (this.rigDebugRoot.children.length > 0) {
      const c = this.rigDebugRoot.children.pop()!;
      this.rigDebugRoot.remove(c);
      const mesh = c as THREE.Mesh;
      if ((mesh as any).geometry?.dispose) (mesh as any).geometry.dispose();
      const m = (mesh as any).material;
      if (Array.isArray(m)) {
        for (const mat of m) if (mat?.dispose) mat.dispose();
      } else if (m?.dispose) {
        m.dispose();
      }
    }
  }

  private addRigPoint(pos: THREE.Vector3, color: number, size = 0.16) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(size, 10, 10),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false }),
    );
    m.position.copy(pos);
    m.renderOrder = 2000;
    this.rigDebugRoot.add(m);
  }

  private addRigLine(a: THREE.Vector3, b: THREE.Vector3, color: number) {
    const g = new THREE.BufferGeometry().setFromPoints([a, b]);
    const l = new THREE.Line(
      g,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false }),
    );
    l.renderOrder = 1999;
    this.rigDebugRoot.add(l);
  }

  private updateRigDebugOverlay(state: SpaceGameState) {
    if (!this.rigDebugEnabled) return;
    this.clearRigDebugOverlay();

    const selectedShips: SpaceShip[] = [];
    for (const id of state.selectedIds) {
      const s = state.ships.get(id);
      if (s && !s.dead) selectedShips.push(s);
    }
    if (selectedShips.length === 0) return;

    for (const ship of selectedShips) {
      const anchors = getRigWorldAnchors(ship);
      const nose = this.rigWorldToThree(anchors.nose);
      const tail = this.rigWorldToThree(anchors.tail);
      const left = this.rigWorldToThree(anchors.left);
      const right = this.rigWorldToThree(anchors.right);

      // Primary rig axis visualization
      this.addRigLine(tail, nose, 0x22ffaa); // forward axis
      this.addRigLine(left, right, 0xff44ff); // side axis
      this.addRigPoint(nose, 0x22ff88, 0.18);
      this.addRigPoint(tail, 0xff4444, 0.18);
      this.addRigPoint(left, 0xffaa44, 0.13);
      this.addRigPoint(right, 0x44aaff, 0.13);

      for (const m of anchors.muzzles) {
        const mp = this.rigWorldToThree(m);
        this.addRigPoint(mp, 0xffee44, 0.11);
        this.addRigLine(nose, mp, 0xaa9922);
      }
      for (const b of anchors.boosters) {
        const bp = this.rigWorldToThree(b);
        this.addRigPoint(bp, 0x44ddff, 0.11);
        this.addRigLine(tail, bp, 0x2288aa);
      }

      // Emit one audit line per ship type per debug session
      if (!this.rigDebugPrinted.has(ship.shipType)) {
        this.rigDebugPrinted.add(ship.shipType);
        console.info(`[RigAudit] ${getRigAudit(ship.shipType)}`);
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

  /** Activate the ability that has .key === keyLetter (Q/W/E/R) across selected ships */
  activateAbilityByKey(keyLetter: string) {
    const state = this.engine.state;
    for (const id of state.selectedIds) {
      const ship = state.ships.get(id);
      if (!ship || ship.dead) continue;
      const idx = ship.abilities.findIndex((ab) => ab.ability.key === keyLetter);
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
    let onCount = 0,
      total = 0;
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
    const removePlaceholderLocal = (g: THREE.Group) => {
      const toRemove = g.children.filter((ch) => {
        const geo = (ch as THREE.Mesh).geometry;
        if (!geo) return false;
        const t = geo.type;
        return t === 'ConeGeometry' || t === 'CylinderGeometry' || t === 'BoxGeometry';
      });
      toRemove.forEach((c) => g.remove(c));
    };

    // Load and cache the player's hero ship URL once
    if (!this.customHeroUrl && !this.customHeroLoading) {
      this.customHeroLoading = true;
      try {
        const record = await loadHeroShip();
        if (record) {
          this.customHeroUrl = glbBlobToUrl(record.glb);
        }
      } catch {
        /* no hero ship saved */
      }
      this.customHeroLoading = false;
    }

    if (!this.customHeroUrl) return; // no saved ship — keep placeholder

    try {
      const loaded = await loadGLB(this.customHeroUrl);
      if (this.disposed) return;
      const ex = this.shipMeshes.get(shipId);
      if (!ex) return;
      const ship = this.engine.state.ships.get(shipId);
      const model = loaded.scene;
      // Scale to match dreadnought size (≈24 Three.js units)
      const box = new THREE.Box3().setFromObject(model);
      const modelDiam = box.getSize(new THREE.Vector3()).length();
      if (modelDiam > 0) model.scale.setScalar(24 / modelDiam);
      if (ship) SpaceRenderer.tintModelToTeam(model, ship.team);
      removePlaceholderLocal(ex.group);
      ex.group.add(model);
    } catch {
      // GLB load failed — build procedural fallback
      const ex = this.shipMeshes.get(shipId);
      if (ex && !this.disposed) {
        const ship = this.engine.state.ships.get(shipId);
        if (ship) {
          const proc = buildProceduralShip(ship.shipClass, 5, ship.team);
          const box = new THREE.Box3().setFromObject(proc);
          const diam = box.getSize(new THREE.Vector3()).length();
          if (diam > 0) proc.scale.setScalar(24 / diam);
          removePlaceholderLocal(ex.group);
          ex.group.add(proc);
        }
      }
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.animFrame);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onRigDebugKeyDown);
    this.clearRigDebugOverlay();
    this.vfx?.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    if (this.customHeroUrl) {
      URL.revokeObjectURL(this.customHeroUrl);
      this.customHeroUrl = null;
    }
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    if (this.selectionBoxDiv.parentNode) {
      this.selectionBoxDiv.parentNode.removeChild(this.selectionBoxDiv);
    }
  }
}
