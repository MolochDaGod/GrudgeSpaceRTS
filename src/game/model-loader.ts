/**
 * model-loader.ts — Centralized 3D model + animation loading.
 *
 * Single source of truth for all loaders, caches, and format handling.
 * Primary path is GLB via GLTFLoader + DRACO. Legacy FBX/OBJ loaders
 * are kept for backward compatibility but should be migrated away.
 *
 * Usage:
 *   import { loadModel, loadAnimationClip } from './model-loader';
 *   const ship = await loadModel('/assets-glb/space/models/ships/RedFighter.glb');
 *   scene.add(ship.scene);
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { resolveModelUrl, resolveTextureUrl } from './asset-loader';

// ── Types ─────────────────────────────────────────────────────────

export interface LoadedModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
}

// ── Loader singletons ─────────────────────────────────────────────

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
dracoLoader.setDecoderConfig({ type: 'js' }); // WASM needs same-origin; JS works cross-origin

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const fbxLoader = new FBXLoader();
const objLoader = new OBJLoader();
const mtlLoader = new MTLLoader();
const textureLoader = new THREE.TextureLoader();

// ── Caches ────────────────────────────────────────────────────────

const modelCache = new Map<string, LoadedModel>();
const loadingPromises = new Map<string, Promise<LoadedModel>>();
const textureCache = new Map<string, THREE.Texture>();
const animClipCache = new Map<string, THREE.AnimationClip>();
const animLoadingPromises = new Map<string, Promise<THREE.AnimationClip | null>>();

// ── Texture Loading ───────────────────────────────────────────────

/** Load a texture with caching and proper color space. */
export function getTexture(path: string): THREE.Texture {
  const resolved = resolveTextureUrl(path);
  if (textureCache.has(resolved)) return textureCache.get(resolved)!;
  const tex = textureLoader.load(resolved);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(resolved, tex);
  return tex;
}

// ── Texture application helper ────────────────────────────────────

function applyTextureToGroup(group: THREE.Group, texturePath: string): void {
  const tex = getTexture(texturePath);
  group.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      if ((m as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
        (m as THREE.MeshStandardMaterial).map = tex;
      } else if ((m as THREE.MeshPhongMaterial).isMeshPhongMaterial) {
        (m as THREE.MeshPhongMaterial).map = tex;
      } else {
        (m as unknown as Record<string, unknown>).map = tex;
        (m as THREE.Material).needsUpdate = true;
      }
    }
  });
}

// ── GLB / GLTF Loading ────────────────────────────────────────

export async function loadGLB(path: string): Promise<LoadedModel> {
  const resolved = resolveModelUrl(path);
  if (modelCache.has(resolved)) {
    const cached = modelCache.get(resolved)!;
    return { scene: cached.scene.clone(), animations: cached.animations };
  }
  if (loadingPromises.has(resolved)) {
    const cached = await loadingPromises.get(resolved)!;
    return { scene: cached.scene.clone(), animations: cached.animations };
  }

  const promise = gltfLoader.loadAsync(resolved).then((gltf) => {
    // Enhance PBR materials for a badass space-combat look.
    // GLTF models come with proper metallic-roughness workflow;
    // we boost them for deep-space visibility and cinematic impact.
    enhanceGLTFMaterials(gltf.scene);
    const model: LoadedModel = { scene: gltf.scene, animations: gltf.animations };
    modelCache.set(resolved, model);
    loadingPromises.delete(resolved);
    return model;
  });

  loadingPromises.set(resolved, promise);
  const result = await promise;
  return { scene: result.scene.clone(), animations: result.animations };
}

/**
 * Enhance GLTF PBR materials for deep-space rendering:
 * - Boost metalness and tweak roughness for sharper reflections
 * - Add emissive glow from existing emissive maps or as a subtle base
 * - Preserve normal maps and metallic-roughness maps
 * - Make ships read clearly against dark space backgrounds
 */
function enhanceGLTFMaterials(scene: THREE.Group): void {
  scene.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const enhanced = materials.map((mat) => {
      if (!(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) return mat;
      const sm = mat as THREE.MeshStandardMaterial;

      // Boost metalness for that hard sci-fi hull look
      sm.metalness = Math.max(sm.metalness, 0.6);
      sm.roughness = Math.min(sm.roughness, 0.55);

      // If the model has an emissive map, crank it up for visibility
      if (sm.emissiveMap) {
        sm.emissiveIntensity = Math.max(sm.emissiveIntensity, 0.5);
      } else if (sm.map) {
        // No emissive map — use baseColor as subtle emissive for deep-space visibility
        sm.emissiveMap = sm.map;
        sm.emissiveIntensity = 0.12;
        sm.emissive.setHex(0x223344);
      }

      // Ensure env map influence is strong for specular highlights
      sm.envMapIntensity = Math.max(sm.envMapIntensity ?? 1.0, 1.2);
      sm.needsUpdate = true;
      return sm;
    });
    mesh.material = Array.isArray(mesh.material) ? enhanced : enhanced[0];
  });
}

// ── FBX Loading ───────────────────────────────────────────────────

export async function loadFBX(path: string, texturePath?: string): Promise<LoadedModel> {
  const resolved = resolveModelUrl(path);
  if (modelCache.has(resolved)) {
    const cached = modelCache.get(resolved)!;
    return { scene: cached.scene.clone(), animations: cached.animations };
  }
  if (loadingPromises.has(resolved)) {
    const cached = await loadingPromises.get(resolved)!;
    return { scene: cached.scene.clone(), animations: cached.animations };
  }

  const promise = (fbxLoader.loadAsync(resolved) as Promise<THREE.Group>).then((fbx) => {
    if (texturePath) applyTextureToGroup(fbx, texturePath);
    const model: LoadedModel = { scene: fbx, animations: fbx.animations };
    modelCache.set(resolved, model);
    loadingPromises.delete(resolved);
    return model;
  });

  loadingPromises.set(resolved, promise);
  const result = await promise;
  return { scene: result.scene.clone(), animations: result.animations };
}

// ── OBJ (+MTL) Loading ────────────────────────────────────────────

export async function loadOBJ(objPath: string, mtlPath?: string, texturePath?: string): Promise<LoadedModel> {
  const resolved = resolveModelUrl(objPath);
  if (modelCache.has(resolved)) {
    const cached = modelCache.get(resolved)!;
    return { scene: cached.scene.clone(), animations: cached.animations };
  }
  if (loadingPromises.has(resolved)) {
    const cached = await loadingPromises.get(resolved)!;
    return { scene: cached.scene.clone(), animations: cached.animations };
  }

  const promise = (async (): Promise<LoadedModel> => {
    let group: THREE.Group;
    if (mtlPath) {
      const resolvedMtl = resolveModelUrl(mtlPath);
      try {
        const materials = await mtlLoader.loadAsync(resolvedMtl);
        materials.preload();
        const loader = new OBJLoader();
        loader.setMaterials(materials);
        group = await loader.loadAsync(resolved);
      } catch {
        // MTL failed — load OBJ without materials
        group = await objLoader.loadAsync(resolved);
      }
    } else {
      group = await objLoader.loadAsync(resolved);
    }

    if (texturePath) applyTextureToGroup(group, texturePath);
    const model: LoadedModel = { scene: group, animations: [] };
    modelCache.set(resolved, model);
    loadingPromises.delete(resolved);
    return model;
  })();

  loadingPromises.set(resolved, promise);
  const result = await promise;
  return { scene: result.scene.clone(), animations: [] };
}

// ── Format-agnostic loader (uses SpacePrefab-style format hint) ───

/**
 * Try to load a pre-converted GLB from the /assets-glb/ mirror.
 * Returns the GLB model if found, or null to fall back to the original format.
 * This enables incremental migration: as models are batch-converted to GLB,
 * they are automatically used without touching prefab registries.
 */
async function tryGLBMirror(modelPath: string): Promise<LoadedModel | null> {
  // Only attempt for non-GLB sources
  const glbMirror = modelPath.replace('/assets/space/models/', '/assets-glb/').replace(/\.(obj|fbx)$/i, '.glb');
  try {
    // Probe the URL with a HEAD request to avoid loading 404 bodies
    const resp = await fetch(resolveModelUrl(glbMirror), { method: 'HEAD' });
    if (resp.ok) return loadGLB(glbMirror);
  } catch {
    // Mirror not available — fall through
  }
  return null;
}

export async function loadByFormat(
  modelPath: string,
  format: 'obj' | 'fbx' | 'glb' | 'gltf',
  opts?: { mtlPath?: string; texturePath?: string },
): Promise<LoadedModel> {
  // If source is OBJ/FBX, check for a pre-converted GLB first
  if (format === 'obj' || format === 'fbx') {
    const glbResult = await tryGLBMirror(modelPath);
    if (glbResult) return glbResult;
  }
  switch (format) {
    case 'glb':
    case 'gltf':
      return loadGLB(modelPath);
    case 'fbx':
      return loadFBX(modelPath, opts?.texturePath);
    case 'obj':
      return loadOBJ(modelPath, opts?.mtlPath, opts?.texturePath);
  }
}

// ── Unified GLB loader (preferred entry point) ────────────────────

/**
 * Primary model loading function — GLB only.
 * After the GLTF unification pipeline runs, ALL models are .glb.
 * Handles caching, DRACO decoding, and PBR material enhancement.
 * Use this instead of loadGLB/loadFBX/loadOBJ for new code.
 */
export async function loadModel(glbPath: string): Promise<LoadedModel> {
  return loadGLB(glbPath);
}

/**
 * Load a model from a SpacePrefab (post-migration: always GLB).
 * Auto-normalizes to targetSize if provided.
 */
export async function loadPrefabGLB(modelPath: string, targetSize?: number): Promise<LoadedModel> {
  const result = await loadGLB(modelPath);
  if (targetSize && targetSize > 0) {
    const box = new THREE.Box3().setFromObject(result.scene);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0.001) {
      result.scene.scale.setScalar(targetSize / maxDim);
    }
  }
  return result;
}

// ── Animation Clip Loading ────────────────────────────────────────

/**
 * Load a single animation clip. Supports both GLB and FBX sources.
 * GLB: extracts animations[0] from the GLTF.
 * FBX: legacy path, loads via FBXLoader.
 * Returns null on failure.
 */
export async function loadAnimationClip(path: string): Promise<THREE.AnimationClip | null> {
  const resolved = resolveModelUrl(path);
  if (animClipCache.has(resolved)) return animClipCache.get(resolved)!;
  if (animLoadingPromises.has(resolved)) return animLoadingPromises.get(resolved)!;

  const isGLB = /\.glb$/i.test(path) || /\.gltf$/i.test(path);

  const promise = (async (): Promise<THREE.AnimationClip | null> => {
    try {
      if (isGLB) {
        const gltf = await gltfLoader.loadAsync(resolved);
        if (gltf.animations.length > 0) {
          const clip = gltf.animations[0];
          const name =
            path
              .split('/')
              .pop()
              ?.replace(/\.(glb|gltf)$/i, '')
              .toLowerCase() ?? 'unknown';
          clip.name = name;
          animClipCache.set(resolved, clip);
          animLoadingPromises.delete(resolved);
          return clip;
        }
      } else {
        // Legacy FBX animation path
        const fbx = (await fbxLoader.loadAsync(resolved)) as THREE.Group;
        if (fbx.animations.length > 0) {
          const clip = fbx.animations[0];
          const name = path.split('/').pop()?.replace('.fbx', '').toLowerCase() ?? 'unknown';
          clip.name = name;
          animClipCache.set(resolved, clip);
          animLoadingPromises.delete(resolved);
          return clip;
        }
      }
    } catch {
      // Clip failed to load
    }
    animLoadingPromises.delete(resolved);
    return null;
  })();

  animLoadingPromises.set(resolved, promise);
  return promise;
}

/** Batch load animation clips from a name→path map. */
export async function loadAnimationSet(paths: Record<string, string>): Promise<Map<string, THREE.AnimationClip>> {
  const result = new Map<string, THREE.AnimationClip>();
  const promises = Object.entries(paths).map(async ([name, path]) => {
    const clip = await loadAnimationClip(path);
    if (clip) {
      clip.name = name.toLowerCase();
      result.set(name.toLowerCase(), clip);
    }
  });
  await Promise.allSettled(promises);
  return result;
}

// ── Utility ───────────────────────────────────────────────────────

/** Deep-clone a loaded model (scene is cloned, animations are shared refs). */
export function cloneModel(model: LoadedModel): LoadedModel {
  return { scene: model.scene.clone(), animations: model.animations };
}

/** Dispose all cached models, textures, and animation clips. */
export function disposeAllCaches(): void {
  for (const [, m] of modelCache) {
    m.scene.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        const mesh = c as THREE.Mesh;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => mat?.dispose());
      }
    });
  }
  modelCache.clear();
  loadingPromises.clear();

  for (const [, tex] of textureCache) tex.dispose();
  textureCache.clear();

  animClipCache.clear();
  animLoadingPromises.clear();

  dracoLoader.dispose();
}
