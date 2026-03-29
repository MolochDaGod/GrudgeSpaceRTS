/**
 * model-loader.ts — Centralized 3D model + animation loading.
 *
 * Single source of truth for all loaders, caches, and format handling.
 * Ported from 3dmotion's model-loader pattern with DRACOLoader added.
 *
 * Usage:
 *   import { loadGLB, loadFBX, loadOBJ, loadAnimationClip } from './model-loader';
 *   const ship = await loadGLB('/assets/space/models/planets/planet_1.glb');
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

// ── GLB / GLTF Loading ────────────────────────────────────────────

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
    const model: LoadedModel = { scene: gltf.scene, animations: gltf.animations };
    modelCache.set(resolved, model);
    loadingPromises.delete(resolved);
    return model;
  });

  loadingPromises.set(resolved, promise);
  const result = await promise;
  return { scene: result.scene.clone(), animations: result.animations };
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

export async function loadOBJ(
  objPath: string,
  mtlPath?: string,
  texturePath?: string,
): Promise<LoadedModel> {
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

export async function loadByFormat(
  modelPath: string,
  format: 'obj' | 'fbx' | 'glb' | 'gltf',
  opts?: { mtlPath?: string; texturePath?: string },
): Promise<LoadedModel> {
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

// ── Animation Clip Loading ────────────────────────────────────────

/** Load a single animation clip from an FBX file. Returns null on failure. */
export async function loadAnimationClip(path: string): Promise<THREE.AnimationClip | null> {
  const resolved = resolveModelUrl(path);
  if (animClipCache.has(resolved)) return animClipCache.get(resolved)!;
  if (animLoadingPromises.has(resolved)) return animLoadingPromises.get(resolved)!;

  const promise = (async (): Promise<THREE.AnimationClip | null> => {
    try {
      const fbx = (await fbxLoader.loadAsync(resolved)) as THREE.Group;
      if (fbx.animations.length > 0) {
        const clip = fbx.animations[0];
        const name = path.split('/').pop()?.replace('.fbx', '').toLowerCase() ?? 'unknown';
        clip.name = name;
        animClipCache.set(resolved, clip);
        animLoadingPromises.delete(resolved);
        return clip;
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
export async function loadAnimationSet(
  paths: Record<string, string>,
): Promise<Map<string, THREE.AnimationClip>> {
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
