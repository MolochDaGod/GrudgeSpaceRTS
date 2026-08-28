/**
 * model-loader.ts — Centralized 3D model + animation loading.
 *
 * Single source of truth for all loaders, caches, and format handling.
 * Play path is GLB via GLTFLoader + DRACO only. OBJ/FBX paths are
 * rewritten to .glb — no OBJ/FBX decode at runtime.
 *
 * Usage:
 *   import { loadModel, loadAnimationClip } from './model-loader';
 *   const ship = await loadModel('/assets-glb/space/models/ships/RedFighter.glb');
 *   scene.add(ship.scene);
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { resolveModelUrl, resolveTextureUrl } from './asset-loader';

export interface LoadedModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
}

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
dracoLoader.setDecoderConfig({ type: 'js' });

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const textureLoader = new THREE.TextureLoader();

function toGlbPath(path: string): string {
  return path
    .replace('/assets/space/models/', '/assets-glb/')
    .replace(/\.(obj|fbx|gltf)$/i, '.glb');
}

function assertPlayPathGlb(path: string): string {
  if (/\.(obj|fbx)$/i.test(path)) {
    const glb = toGlbPath(path);
    console.warn('[GRUDA] Play path is GLB-only; remapping', path, '→', glb);
    return glb;
  }
  return path;
}

const modelCache = new Map<string, LoadedModel>();
const loadingPromises = new Map<string, Promise<LoadedModel>>();
const textureCache = new Map<string, THREE.Texture>();
const animClipCache = new Map<string, THREE.AnimationClip>();
const animLoadingPromises = new Map<string, Promise<THREE.AnimationClip | null>>();

export function getTexture(path: string): THREE.Texture {
  const resolved = resolveTextureUrl(path);
  if (textureCache.has(resolved)) return textureCache.get(resolved)!;
  const tex = textureLoader.load(resolved);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(resolved, tex);
  return tex;
}

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

function enhanceGLTFMaterials(scene: THREE.Group): void {
  scene.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const enhanced = materials.map((mat) => {
      if (!(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) return mat;
      const sm = mat as THREE.MeshStandardMaterial;
      sm.metalness = Math.max(sm.metalness, 0.6);
      sm.roughness = Math.min(sm.roughness, 0.55);
      if (sm.emissiveMap) {
        sm.emissiveIntensity = Math.max(sm.emissiveIntensity, 0.5);
      } else if (sm.map) {
        sm.emissiveMap = sm.map;
        sm.emissiveIntensity = 0.12;
        sm.emissive.setHex(0x223344);
      }
      sm.envMapIntensity = Math.max(sm.envMapIntensity ?? 1.0, 1.2);
      sm.needsUpdate = true;
      return sm;
    });
    mesh.material = Array.isArray(mesh.material) ? enhanced : enhanced[0];
  });
}

export async function loadFBX(path: string, _texturePath?: string): Promise<LoadedModel> {
  return loadGLB(assertPlayPathGlb(path));
}

export async function loadOBJ(objPath: string, _mtlPath?: string, _texturePath?: string): Promise<LoadedModel> {
  return loadGLB(assertPlayPathGlb(objPath));
}

export async function loadByFormat(
  modelPath: string,
  format: 'obj' | 'fbx' | 'glb' | 'gltf',
  _opts?: { mtlPath?: string; texturePath?: string },
): Promise<LoadedModel> {
  if (format === 'obj' || format === 'fbx' || /\.(obj|fbx)$/i.test(modelPath)) {
    return loadGLB(assertPlayPathGlb(modelPath));
  }
  return loadGLB(modelPath);
}

export async function loadModel(glbPath: string): Promise<LoadedModel> {
  return loadGLB(glbPath);
}

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
        const glbPath = toGlbPath(path);
        const gltf = await gltfLoader.loadAsync(resolveModelUrl(glbPath));
        if (gltf.animations.length > 0) {
          const clip = gltf.animations[0];
          const name = path.split('/').pop()?.replace(/\.(fbx|obj|glb|gltf)$/i, '').toLowerCase() ?? 'unknown';
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

export function cloneModel(model: LoadedModel): LoadedModel {
  return { scene: model.scene.clone(), animations: model.animations };
}

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
