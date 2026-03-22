/**
 * ship-editor.tsx — Ship Forge: Voxel spaceship builder
 *
 * 3D voxel editor using Three.js. Players design a custom hero ship
 * on a 32×16×32 grid, then export as GLB and save to their account.
 * One hero ship per account — used in-game at the starting home world.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { saveHeroShip, loadHeroShip, type HeroShipRecord } from './ship-storage';
import { TEAM_COLORS } from './space-types';
import { buildGroup } from './space-voxel-builder';
import { SHIP_PARTS, PART_CATEGORIES, type ShipPart } from './ship-prefabs-editor';
import { Btn } from './ui-lib';

// ── Constants ─────────────────────────────────────────────────────
const GRID_W = 32;
const GRID_H = 16;
const GRID_D = 32;
const CELL = 1.0;

type VoxelType = 1 | 2 | 3 | 4 | 5;
type Tool = 'place' | 'erase' | 'paint';
type EditorMode = 'voxel' | 'prefab';

/** A placed prefab part instance in the scene */
interface PlacedPart {
  id: number;
  partId: string;
  group: THREE.Group;
  position: THREE.Vector3;
  rotationY: number; // 0, 90, 180, 270
}

/** Undo entry: stores keys and their previous state (null = didn't exist) */
interface UndoEntry { changes: Array<{ key: string; prev: VoxelType | null }> }
const MAX_UNDO = 80;

const VOXEL_LABELS: Record<VoxelType, string> = {
  1: 'Hull',
  2: 'Armor',
  3: 'Engine',
  4: 'Weapon',
  5: 'Cockpit',
};

const VOXEL_COLORS: Record<VoxelType, string> = {
  1: '#4488ff',
  2: '#223366',
  3: '#00ccff',
  4: '#ff8800',
  5: '#88ccff',
};

// ── Editor Component ──────────────────────────────────────────────
export function ShipForgeEditor({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    voxels: Map<string, { mesh: THREE.Mesh; type: VoxelType }>;
    gridHelper: THREE.Group;
    ghostMesh: THREE.Mesh;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    groundPlane: THREE.Mesh;
  } | null>(null);

  const [mode, setMode] = useState<EditorMode>('prefab');
  const [tool, setTool] = useState<Tool>('place');
  const [voxelType, setVoxelType] = useState<VoxelType>(1);
  const [mirror, setMirror] = useState(true);
  const [shipName, setShipName] = useState('My Hero Ship');
  const [voxelCount, setVoxelCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [existingShip, setExistingShip] = useState<HeroShipRecord | null>(null);

  // Prefab mode state
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [placedParts, setPlacedParts] = useState<PlacedPart[]>([]);
  const [selectedPlacedId, setSelectedPlacedId] = useState<number | null>(null);
  const nextPartId = useRef(1);
  const gltfLoader = useRef(new GLTFLoader());

  // Persistent voxel data ref (survives re-renders)
  const voxelDataRef = useRef<Map<string, VoxelType>>(new Map());
  const undoStack = useRef<UndoEntry[]>([]);

  // Drag detection: if mouse moves >4px between down and up, it was a camera orbit, not a click
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

  // ── Check for existing ship on mount ─────────────────────────
  useEffect(() => {
    loadHeroShip().then(record => {
      if (record) {
        setExistingShip(record);
        setShipName(record.meta.name);
        // Restore grid data if available
        if (record.meta.gridData) {
          try {
            const entries: [string, VoxelType][] = JSON.parse(record.meta.gridData);
            voxelDataRef.current = new Map(entries);
          } catch { /* ignore corrupt data */ }
        }
      }
    });
  }, []);

  // ── Three.js setup ──────────────────────────────────────────
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060c1c);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 500);
    camera.position.set(25, 20, 35);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(GRID_W / 2, GRID_H / 4, GRID_D / 2);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    // Right-click to orbit, middle-click to pan — left-click reserved for voxel tools
    controls.mouseButtons = { LEFT: -1 as any, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE };
    controls.update();

    // Lighting
    scene.add(new THREE.AmbientLight(0x556688, 1.2));
    const sun = new THREE.DirectionalLight(0xffeedd, 1.8);
    sun.position.set(30, 50, 20);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x6688cc, 0.6);
    fill.position.set(-20, 30, -30);
    scene.add(fill);

    // Grid floor
    const gridHelper = new THREE.Group();
    const gridGeo = new THREE.PlaneGeometry(GRID_W, GRID_D);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x1a3050, transparent: true, opacity: 0.3, side: THREE.DoubleSide,
    });
    const gridFloor = new THREE.Mesh(gridGeo, gridMat);
    gridFloor.rotation.x = -Math.PI / 2;
    gridFloor.position.set(GRID_W / 2, -0.01, GRID_D / 2);
    gridHelper.add(gridFloor);

    // Grid lines
    const linesMat = new THREE.LineBasicMaterial({ color: 0x1a3050, transparent: true, opacity: 0.5 });
    for (let x = 0; x <= GRID_W; x++) {
      const pts = [new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, 0, GRID_D)];
      gridHelper.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), linesMat));
    }
    for (let z = 0; z <= GRID_D; z++) {
      const pts = [new THREE.Vector3(0, 0, z), new THREE.Vector3(GRID_W, 0, z)];
      gridHelper.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), linesMat));
    }
    // Center axis markers
    const axisMat = new THREE.LineBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.4 });
    const centerX = GRID_W / 2;
    gridHelper.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(centerX, 0, 0), new THREE.Vector3(centerX, 0, GRID_D)]),
      axisMat,
    ));
    scene.add(gridHelper);

    // Invisible ground plane for raycasting
    const groundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(GRID_W + 2, GRID_D + 2),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.set(GRID_W / 2, 0, GRID_D / 2);
    scene.add(groundPlane);

    // Ghost cursor mesh
    const ghostGeo = new THREE.BoxGeometry(CELL * 0.98, CELL * 0.98, CELL * 0.98);
    const ghostMat = new THREE.MeshBasicMaterial({
      color: 0x4488ff, transparent: true, opacity: 0.35, depthWrite: false,
    });
    const ghostMesh = new THREE.Mesh(ghostGeo, ghostMat);
    ghostMesh.visible = false;
    scene.add(ghostMesh);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const ctx = {
      scene, camera, renderer, controls,
      voxels: new Map<string, { mesh: THREE.Mesh; type: VoxelType }>(),
      gridHelper, ghostMesh, raycaster, mouse, groundPlane,
    };
    sceneRef.current = ctx;

    // Restore existing voxels from data ref
    for (const [k, type] of voxelDataRef.current) {
      const [x, y, z] = k.split(',').map(Number);
      addVoxelMesh(ctx, x, y, z, type);
    }

    // Animation loop
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Voxel mesh management ───────────────────────────────────
  function getMaterial(type: VoxelType): THREE.MeshStandardMaterial {
    const teamHex = TEAM_COLORS[1] ?? 0x4488ff;
    const r = ((teamHex >> 16) & 0xff) / 255;
    const g = ((teamHex >> 8) & 0xff) / 255;
    const b = (teamHex & 0xff) / 255;

    switch (type) {
      case 1: return new THREE.MeshStandardMaterial({ color: new THREE.Color(r * 0.9, g * 0.9, b * 0.9), emissive: new THREE.Color(r * 0.3, g * 0.3, b * 0.3), emissiveIntensity: 0.35, roughness: 0.6, metalness: 0.3 });
      case 2: return new THREE.MeshStandardMaterial({ color: new THREE.Color(r * 0.45, g * 0.45, b * 0.45), roughness: 0.8, metalness: 0.4 });
      case 3: return new THREE.MeshStandardMaterial({ color: new THREE.Color(0.05, 0.4, 0.9), emissive: new THREE.Color(0.0, 0.5, 1.0), emissiveIntensity: 1.0, roughness: 0.4, metalness: 0.2 });
      case 4: return new THREE.MeshStandardMaterial({ color: new THREE.Color(1.0, 0.6, 0.1), emissive: new THREE.Color(1.0, 0.5, 0.0), emissiveIntensity: 0.9, roughness: 0.5, metalness: 0.3 });
      case 5: return new THREE.MeshStandardMaterial({ color: new THREE.Color(r * 0.6, g * 0.6, b * 0.6), emissive: new THREE.Color(r, g, b), emissiveIntensity: 0.7, roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0.85 });
      default: return new THREE.MeshStandardMaterial({ color: 0x888888 });
    }
  }

  function addVoxelMesh(
    ctx: NonNullable<typeof sceneRef.current>,
    x: number, y: number, z: number, type: VoxelType,
  ) {
    const k = key(x, y, z);
    // Remove existing if overwriting
    const existing = ctx.voxels.get(k);
    if (existing) { ctx.scene.remove(existing.mesh); existing.mesh.geometry.dispose(); }

    const geo = new THREE.BoxGeometry(CELL * 0.96, CELL * 0.96, CELL * 0.96);
    const mat = getMaterial(type);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    mesh.userData.voxelKey = k;
    ctx.scene.add(mesh);
    ctx.voxels.set(k, { mesh, type });
  }

  function removeVoxelMesh(ctx: NonNullable<typeof sceneRef.current>, x: number, y: number, z: number) {
    const k = key(x, y, z);
    const v = ctx.voxels.get(k);
    if (v) { ctx.scene.remove(v.mesh); v.mesh.geometry.dispose(); ctx.voxels.delete(k); }
  }

  // ── Raycast to find grid position ───────────────────────────
  const getGridPos = useCallback((e: React.MouseEvent): { x: number; y: number; z: number; face: THREE.Vector3 } | null => {
    const ctx = sceneRef.current;
    if (!ctx) return null;
    const rect = ctx.renderer.domElement.getBoundingClientRect();
    ctx.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ctx.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    ctx.raycaster.setFromCamera(ctx.mouse, ctx.camera);

    // Check voxel meshes first
    const voxMeshes = [...ctx.voxels.values()].map(v => v.mesh);
    const hits = ctx.raycaster.intersectObjects(voxMeshes);
    if (hits.length > 0) {
      const hit = hits[0];
      const normal = hit.face?.normal ?? new THREE.Vector3(0, 1, 0);
      const pos = hit.object.position.clone().sub(new THREE.Vector3(0.5, 0.5, 0.5));
      return { x: Math.round(pos.x + normal.x), y: Math.round(pos.y + normal.y), z: Math.round(pos.z + normal.z), face: normal };
    }

    // Check ground plane
    const groundHits = ctx.raycaster.intersectObject(ctx.groundPlane);
    if (groundHits.length > 0) {
      const pt = groundHits[0].point;
      return { x: Math.floor(pt.x), y: 0, z: Math.floor(pt.z), face: new THREE.Vector3(0, 1, 0) };
    }
    return null;
  }, []);

  // ── Undo support ────────────────────────────────────────────
  function pushUndo(changes: UndoEntry['changes']) {
    if (changes.length === 0) return;
    undoStack.current.push({ changes });
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift();
  }

  const handleUndo = useCallback(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    const entry = undoStack.current.pop();
    if (!entry) return;
    for (const { key: k, prev } of entry.changes) {
      const [x, y, z] = k.split(',').map(Number);
      if (prev === null) {
        // Was created — remove it
        removeVoxelMesh(ctx, x, y, z);
        voxelDataRef.current.delete(k);
      } else {
        // Was changed/erased — restore previous type
        addVoxelMesh(ctx, x, y, z, prev);
        voxelDataRef.current.set(k, prev);
      }
    }
    setVoxelCount(voxelDataRef.current.size);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return; // don't intercept name field
      const k = e.key.toLowerCase();
      if (k === '1') setVoxelType(1);
      else if (k === '2') setVoxelType(2);
      else if (k === '3') setVoxelType(3);
      else if (k === '4') setVoxelType(4);
      else if (k === '5') setVoxelType(5);
      else if (k === 'q') setTool('place');
      else if (k === 'e') setTool('erase');
      else if (k === 'r') setTool('paint');
      else if (k === 'x') setMirror(m => !m);
      else if (k === 'z' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleUndo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleUndo]);

  // ── Mouse handlers ──────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) mouseDownPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    const pos = getGridPos(e);
    if (pos && pos.x >= 0 && pos.x < GRID_W && pos.y >= 0 && pos.y < GRID_H && pos.z >= 0 && pos.z < GRID_D) {
      ctx.ghostMesh.visible = true;
      ctx.ghostMesh.position.set(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5);
      (ctx.ghostMesh.material as THREE.MeshBasicMaterial).color.set(
        tool === 'erase' ? 0xff4444 : parseInt(VOXEL_COLORS[voxelType].slice(1), 16),
      );
    } else {
      ctx.ghostMesh.visible = false;
    }
  }, [getGridPos, tool, voxelType]);

  // ── Prefab placement handler ──────────────────────────────
  const handlePrefabClick = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || mode !== 'prefab') return;
    if (mouseDownPos.current) {
      const dx = e.clientX - mouseDownPos.current.x;
      const dy = e.clientY - mouseDownPos.current.y;
      if (dx * dx + dy * dy > 16) { mouseDownPos.current = null; return; }
    }
    mouseDownPos.current = null;
    const ctx = sceneRef.current;
    if (!ctx) return;

    const rect = ctx.renderer.domElement.getBoundingClientRect();
    ctx.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ctx.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    ctx.raycaster.setFromCamera(ctx.mouse, ctx.camera);

    // Check if clicking an existing placed part
    const allPartMeshes = placedParts.flatMap(p => {
      const meshes: THREE.Object3D[] = [];
      p.group.traverse(c => { if ((c as THREE.Mesh).isMesh) meshes.push(c); });
      return meshes.map(m => ({ mesh: m, partId: p.id }));
    });
    const partHits = ctx.raycaster.intersectObjects(allPartMeshes.map(pm => pm.mesh));
    if (partHits.length > 0 && !selectedPartId) {
      const hitMesh = partHits[0].object;
      const match = allPartMeshes.find(pm => pm.mesh === hitMesh);
      if (match) { setSelectedPlacedId(match.partId); return; }
    }

    // Place new part
    if (!selectedPartId) return;
    const groundHits = ctx.raycaster.intersectObject(ctx.groundPlane);
    if (groundHits.length === 0) return;
    const pt = groundHits[0].point;
    const gx = Math.round(pt.x), gz = Math.round(pt.z);

    const partDef = SHIP_PARTS.find(p => p.id === selectedPartId);
    if (!partDef) return;

    const id = nextPartId.current++;
    let group: THREE.Group;

    if (partDef.glbPath) {
      // GLB turret — load async, place immediately with placeholder
      group = new THREE.Group();
      const placeholder = new THREE.Mesh(
        new THREE.BoxGeometry(partDef.size[0] * 0.9, partDef.size[1] * 0.9, partDef.size[2] * 0.9),
        new THREE.MeshBasicMaterial({ color: 0xffaa44, wireframe: true }),
      );
      group.add(placeholder);
      gltfLoader.current.load(partDef.glbPath, (gltf) => {
        group.remove(placeholder);
        const model = gltf.scene;
        // Auto-scale to fit part size
        const box = new THREE.Box3().setFromObject(model);
        const diam = box.getSize(new THREE.Vector3()).length();
        const target = Math.max(...partDef.size);
        if (diam > 0) model.scale.setScalar(target / diam);
        group.add(model);
      });
    } else if (partDef.pattern) {
      // Voxel prefab
      const voxMap = partDef.pattern();
      group = buildGroup(voxMap, 1, 0.9);
    } else {
      return;
    }

    const pos = new THREE.Vector3(gx + 0.5, partDef.size[1] / 2, gz + 0.5);
    group.position.copy(pos);
    ctx.scene.add(group);

    setPlacedParts(prev => [...prev, { id, partId: selectedPartId, group, position: pos, rotationY: 0 }]);
    setSelectedPlacedId(id);
    setSelectedPartId(null); // Deselect from catalog after placing
  }, [mode, selectedPartId, placedParts]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (mode === 'prefab') { handlePrefabClick(e); return; }
    // Only process left-click
    if (e.button !== 0) return;
    // If mouse moved significantly since mousedown, it was an orbit drag — ignore
    if (mouseDownPos.current) {
      const dx = e.clientX - mouseDownPos.current.x;
      const dy = e.clientY - mouseDownPos.current.y;
      if (dx * dx + dy * dy > 16) { mouseDownPos.current = null; return; }
    }
    mouseDownPos.current = null;

    const ctx = sceneRef.current;
    if (!ctx) return;

    const rect = ctx.renderer.domElement.getBoundingClientRect();
    ctx.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ctx.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    ctx.raycaster.setFromCamera(ctx.mouse, ctx.camera);

    if (tool === 'erase') {
      const voxMeshes = [...ctx.voxels.values()].map(v => v.mesh);
      const hits = ctx.raycaster.intersectObjects(voxMeshes);
      if (hits.length > 0) {
        const k = hits[0].object.userData.voxelKey as string;
        const [x, y, z] = k.split(',').map(Number);
        const undoChanges: UndoEntry['changes'] = [];
        const prevType = voxelDataRef.current.get(k) ?? null;
        if (prevType !== null) undoChanges.push({ key: k, prev: prevType });
        removeVoxelMesh(ctx, x, y, z);
        voxelDataRef.current.delete(k);
        // Mirror erase
        if (mirror) {
          const mx = GRID_W - 1 - x;
          const mk = key(mx, y, z);
          const mp = voxelDataRef.current.get(mk) ?? null;
          if (mp !== null) undoChanges.push({ key: mk, prev: mp });
          removeVoxelMesh(ctx, mx, y, z);
          voxelDataRef.current.delete(mk);
        }
        pushUndo(undoChanges);
        setVoxelCount(voxelDataRef.current.size);
      }
      return;
    }

    if (tool === 'paint') {
      const voxMeshes = [...ctx.voxels.values()].map(v => v.mesh);
      const hits = ctx.raycaster.intersectObjects(voxMeshes);
      if (hits.length > 0) {
        const k = hits[0].object.userData.voxelKey as string;
        const [x, y, z] = k.split(',').map(Number);
        const undoChanges: UndoEntry['changes'] = [];
        const prevType = voxelDataRef.current.get(k) ?? null;
        undoChanges.push({ key: k, prev: prevType });
        addVoxelMesh(ctx, x, y, z, voxelType);
        voxelDataRef.current.set(k, voxelType);
        if (mirror) {
          const mx = GRID_W - 1 - x;
          const mk = key(mx, y, z);
          const mp = voxelDataRef.current.get(mk) ?? null;
          undoChanges.push({ key: mk, prev: mp });
          addVoxelMesh(ctx, mx, y, z, voxelType);
          voxelDataRef.current.set(mk, voxelType);
        }
        pushUndo(undoChanges);
      }
      return;
    }

    // Place tool
    const pos = getGridPos(e);
    if (!pos) return;
    const { x, y, z } = pos;
    if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H || z < 0 || z >= GRID_D) return;
    if (voxelDataRef.current.has(key(x, y, z))) return; // already occupied

    const undoChanges: UndoEntry['changes'] = [];
    undoChanges.push({ key: key(x, y, z), prev: null });
    addVoxelMesh(ctx, x, y, z, voxelType);
    voxelDataRef.current.set(key(x, y, z), voxelType);

    // Mirror on X axis
    if (mirror) {
      const mx = GRID_W - 1 - x;
      if (mx !== x && !voxelDataRef.current.has(key(mx, y, z))) {
        undoChanges.push({ key: key(mx, y, z), prev: null });
        addVoxelMesh(ctx, mx, y, z, voxelType);
        voxelDataRef.current.set(key(mx, y, z), voxelType);
      }
    }
    pushUndo(undoChanges);
    setVoxelCount(voxelDataRef.current.size);
  }, [tool, voxelType, mirror, getGridPos]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Export to GLB ───────────────────────────────────────────
  const exportGLB = useCallback(async (): Promise<Blob | null> => {
    const ctx = sceneRef.current;
    if (!ctx || ctx.voxels.size === 0) return null;

    // Build a clean scene with only voxels
    const exportScene = new THREE.Scene();
    const group = new THREE.Group();

    // Centre around bounding box
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (const [k] of voxelDataRef.current) {
      const [x, y, z] = k.split(',').map(Number);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    }
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;

    for (const [k, type] of voxelDataRef.current) {
      const [x, y, z] = k.split(',').map(Number);
      const geo = new THREE.BoxGeometry(CELL, CELL, CELL);
      const mat = getMaterial(type);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x - cx + 0.5, y - cy + 0.5, z - cz + 0.5);
      group.add(mesh);
    }
    exportScene.add(group);

    const exporter = new GLTFExporter();
    return new Promise<Blob | null>((resolve) => {
      exporter.parse(
        exportScene,
        (result) => {
          if (result instanceof ArrayBuffer) {
            resolve(new Blob([result], { type: 'model/gltf-binary' }));
          } else {
            // JSON result — convert to blob
            const json = JSON.stringify(result);
            resolve(new Blob([json], { type: 'model/gltf+json' }));
          }
        },
        (error) => { console.error('GLB export failed:', error); resolve(null); },
        { binary: true },
      );
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save handler ────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (voxelDataRef.current.size === 0) {
      setMessage('Place some voxels first!');
      return;
    }
    if (!shipName.trim()) {
      setMessage('Enter a ship name!');
      return;
    }

    setSaving(true);
    setMessage('Exporting GLB...');

    const glb = await exportGLB();
    if (!glb) { setSaving(false); setMessage('Export failed!'); return; }

    setMessage('Saving to account...');
    const gridData = JSON.stringify([...voxelDataRef.current.entries()]);
    const ok = await saveHeroShip({
      meta: {
        name: shipName.trim(),
        createdAt: Date.now(),
        voxelCount: voxelDataRef.current.size,
        gridData,
      },
      glb,
    });

    setSaving(false);
    if (ok) {
      setMessage('Hero ship saved! Returning to menu...');
      setTimeout(onBack, 1500);
    } else {
      setMessage('Save failed — try again.');
    }
  }, [shipName, exportGLB, onBack]);

  // ── Clear all voxels ────────────────────────────────────────
  const handleClear = useCallback(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    for (const [, v] of ctx.voxels) {
      ctx.scene.remove(v.mesh);
      v.mesh.geometry.dispose();
    }
    ctx.voxels.clear();
    voxelDataRef.current.clear();
    setVoxelCount(0);
  }, []);

  // ── Render ──────────────────────────────────────────────────
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#010308', color: '#cde', zIndex: 100, display: 'flex', fontFamily: "'Segoe UI', monospace" }}>
      {/* ── 3D Viewport ──────────────────────────────── */}
      <div
        ref={canvasRef}
        style={{ flex: 1, position: 'relative', cursor: tool === 'erase' ? 'crosshair' : 'pointer' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />

      {/* ── Sidebar Panel ──────────────────────────── */}
      <div style={{
        width: 300, background: 'rgba(6,14,30,0.97)', borderLeft: '1px solid #1a3050',
        display: 'flex', flexDirection: 'column', padding: 16, gap: 12, overflowY: 'auto',
      }}>
        {/* Header */}
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#4488ff', letterSpacing: 3, marginBottom: 4 }}>
            SHIP FORGE
          </div>
          <div style={{ fontSize: 10, color: 'rgba(160,200,255,0.4)', letterSpacing: 2 }}>
            DESIGN YOUR HERO SHIP
          </div>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', gap: 4 }}>
          <Btn label="PARTS" active={mode==='prefab'} onClick={() => setMode('prefab')} style={{ flex:1, height:30, minWidth:0 }} />
          <Btn label="VOXEL" active={mode==='voxel'} onClick={() => setMode('voxel')} style={{ flex:1, height:30, minWidth:0 }} />
        </div>

        {/* Ship Name */}
        <div>
          <div style={labelStyle}>SHIP NAME</div>
          <input value={shipName} onChange={e => setShipName(e.target.value)} maxLength={32} style={inputStyle} placeholder="Enter ship name..." />
        </div>

        {/* ── PREFAB MODE ─────────────────────────────── */}
        {mode === 'prefab' && (
          <>
            <div style={{ fontSize: 8, color: 'rgba(160,200,255,0.25)', lineHeight: 1.6 }}>
              Click part → click grid to place · Click placed part to select<br/>
              E: rotate 90° · X: delete selected · Right-drag: orbit
            </div>

            {/* Parts Catalog */}
            {PART_CATEGORIES.map(cat => (
              <div key={cat.key}>
                <div style={{ fontSize: 9, color: cat.color, fontWeight: 700, letterSpacing: 1.5, marginBottom: 4 }}>{cat.label}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {SHIP_PARTS.filter(p => p.category === cat.key).map(part => (
                    <button key={part.id} onClick={() => { setSelectedPartId(selectedPartId === part.id ? null : part.id); setSelectedPlacedId(null); }}
                      style={{
                        padding: '4px 8px', fontSize: 9, fontWeight: 600,
                        border: `1px solid ${selectedPartId === part.id ? cat.color : '#1a3050'}`,
                        borderRadius: 4, cursor: 'pointer',
                        background: selectedPartId === part.id ? `${cat.color}22` : 'transparent',
                        color: selectedPartId === part.id ? cat.color : 'rgba(160,200,255,0.5)',
                        fontFamily: "'Segoe UI', monospace",
                      }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: part.color, display: 'inline-block', marginRight: 4 }} />
                      {part.name}
                      {part.glbPath && <span style={{ fontSize: 7, color: '#ffaa44', marginLeft: 3 }}>3D</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Selected placed part controls */}
            {selectedPlacedId !== null && (
              <div style={{ padding: '8px 10px', background: 'rgba(68,136,255,0.08)', border: '1px solid #4488ff44', borderRadius: 6 }}>
                <div style={{ fontSize: 9, color: '#4488ff', fontWeight: 700, marginBottom: 6 }}>SELECTED PART</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Btn label="ROTATE" onClick={() => {
                    setPlacedParts(prev => prev.map(p => {
                      if (p.id !== selectedPlacedId) return p;
                      const newRot = (p.rotationY + 90) % 360;
                      p.group.rotation.y = newRot * (Math.PI / 180);
                      return { ...p, rotationY: newRot };
                    }));
                  }} style={{ flex:1, height:28, minWidth:0 }} />
                  <Btn label="DELETE" onClick={() => {
                    const ctx = sceneRef.current;
                    if (!ctx) return;
                    const part = placedParts.find(p => p.id === selectedPlacedId);
                    if (part) { ctx.scene.remove(part.group); }
                    setPlacedParts(prev => prev.filter(p => p.id !== selectedPlacedId));
                    setSelectedPlacedId(null);
                  }} style={{ flex:1, height:28, minWidth:0 }} />
                </div>
              </div>
            )}

            {/* Stats */}
            <div style={{ padding: '8px 10px', background: 'rgba(2,4,12,0.6)', borderRadius: 6, border: '1px solid #1a3050' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                <span style={{ color: 'rgba(160,200,255,0.4)' }}>PARTS PLACED</span>
                <span style={{ color: '#4488ff', fontWeight: 700 }}>{placedParts.length}</span>
              </div>
            </div>
          </>
        )}

        {/* ── VOXEL MODE ──────────────────────── */}
        {mode === 'voxel' && (
          <>
            <div style={{ fontSize: 8, color: 'rgba(160,200,255,0.25)', lineHeight: 1.6 }}>
              Left-click: place/edit · Right-drag: orbit · Scroll: zoom<br/>
              Q/E/R: tools · 1-5: blocks · X: mirror · Ctrl+Z: undo
            </div>
            <div>
              <div style={labelStyle}>TOOL</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['place', 'erase', 'paint'] as Tool[]).map(t => (
                  <button key={t} onClick={() => setTool(t)} style={{
                    ...toolBtn, background: tool === t ? '#4488ff' : 'transparent',
                    color: tool === t ? '#fff' : 'rgba(160,200,255,0.5)',
                    borderColor: tool === t ? '#4488ff' : '#1a3050',
                  }}>{t === 'place' ? 'Q Place' : t === 'erase' ? 'E Erase' : 'R Paint'}</button>
                ))}
              </div>
            </div>
            {tool !== 'erase' && (
              <div>
                <div style={labelStyle}>BLOCK TYPE</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {([1, 2, 3, 4, 5] as VoxelType[]).map(t => (
                    <button key={t} onClick={() => setVoxelType(t)} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                      border: `1px solid ${voxelType === t ? VOXEL_COLORS[t] : '#1a3050'}`,
                      borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                      background: voxelType === t ? `${VOXEL_COLORS[t]}22` : 'transparent',
                      color: voxelType === t ? VOXEL_COLORS[t] : 'rgba(160,200,255,0.5)',
                    }}>
                      <div style={{ width: 14, height: 14, borderRadius: 2, background: VOXEL_COLORS[t], boxShadow: t >= 3 ? `0 0 6px ${VOXEL_COLORS[t]}88` : 'none' }} />
                      {VOXEL_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setMirror(!mirror)} style={{
              ...toolBtn, width: '100%', justifyContent: 'center',
              background: mirror ? 'rgba(68,136,255,0.15)' : 'transparent',
              borderColor: mirror ? '#4488ff' : '#1a3050',
              color: mirror ? '#4488ff' : 'rgba(160,200,255,0.5)',
            }}>{mirror ? '⇔ Mirror ON' : '⇔ Mirror OFF'}</button>
            <div style={{ padding: '8px 10px', background: 'rgba(2,4,12,0.6)', borderRadius: 6, border: '1px solid #1a3050' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                <span style={{ color: 'rgba(160,200,255,0.4)' }}>VOXELS</span>
                <span style={{ color: '#4488ff', fontWeight: 700 }}>{voxelCount}</span>
              </div>
            </div>
          </>
        )}

        {/* Existing ship warning */}
        {existingShip && (
          <div style={{ padding: '8px 12px', borderRadius: 6, fontSize: 10, background: 'rgba(255,170,0,0.1)', border: '1px solid rgba(255,170,0,0.3)', color: '#ffaa22' }}>
            You already have a hero ship: <strong>{existingShip.meta.name}</strong>. Saving will replace it.
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {message && <div style={{ fontSize: 11, color: message.includes('fail') ? '#ff4444' : '#44dd88', textAlign: 'center' }}>{message}</div>}
          <button onClick={handleSave} disabled={saving} style={{
            padding: '12px', fontSize: 14, fontWeight: 700, color: '#fff',
            background: saving ? '#333' : 'linear-gradient(135deg, #1a55bb, #4488ff)',
            border: 'none', borderRadius: 6, cursor: saving ? 'wait' : 'pointer',
            letterSpacing: 1, boxShadow: '0 0 20px #4488ff44',
          }}>{saving ? 'SAVING...' : 'SAVE HERO SHIP'}</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleClear} style={{ ...actionBtn, flex: 1, color: '#ff6644', borderColor: '#ff664444' }}>CLEAR ALL</button>
            <button onClick={onBack} style={{ ...actionBtn, flex: 1 }}>← BACK</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  fontSize: 9, color: 'rgba(160,200,255,0.4)', letterSpacing: 1.5, marginBottom: 6, fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: 13, fontWeight: 600, color: '#cde',
  background: 'rgba(8,18,36,0.9)', border: '1px solid #1a3050', borderRadius: 4,
  outline: 'none', fontFamily: "'Segoe UI', monospace",
};

const toolBtn: React.CSSProperties = {
  padding: '6px 12px', border: '1px solid #1a3050', borderRadius: 4,
  cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
  display: 'flex', alignItems: 'center', gap: 4,
  fontFamily: "'Segoe UI', monospace",
};

const actionBtn: React.CSSProperties = {
  padding: '8px', fontSize: 11, fontWeight: 600, color: 'rgba(160,200,255,0.5)',
  background: 'transparent', border: '1px solid #1a3050', borderRadius: 4,
  cursor: 'pointer', letterSpacing: 0.5, fontFamily: "'Segoe UI', monospace",
};
