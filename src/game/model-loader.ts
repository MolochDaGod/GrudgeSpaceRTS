/**
 * model-loader.ts — Centralized 3D model + animation loading.
 *
 * Play path is GLB via GLTFLoader + DRACO only. OBJ/FBX paths remap to .glb.
 * Draco prefers WASM (faster inflate) and falls back to JS if WASM cannot start.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { resolveModelUrl, resolveTextureUrl } from './asset-loader';

export interface LoadedModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
}

const DRACO_DECODER = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(DRACO_DECODER);
dracoLoader.setDecoderConfig({
  type: typeof WebAssembly !== 'undefined' ? 'wasm' : 'js',
});

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const textureLoader = new THREE.TextureLoader();
let dracoWarmed = false;
let dracoJsFallback = false;

export function toGlbPath(path: string): string {
  return path
    .replace('/assets/space/models/', '/assets-glb/')
    .replace(/\.(obj|fbx|gltf)$/i, '.glb');
}
export function toRuntimeGlbPath(path: string): string | null {
  if (/\.glb$/i.test(path)) return path;
  const glb = toGlbPath(path);
  return /\.glb$/i.test(glb) ? glb : null;
}

export function assertPlayPathGlb(path: string): string {
  if (/\.(obj|fbx|gltf)$/i.test(path)) return toGlbPath(path);
  return path;
}

export function warmupPlayPathLoaders(): void {
  if (dracoWarmed) return;
  dracoWarmed = true;
  try {
    dracoLoader.preload();
  } catch {
    applyDracoJsFallback();
  }
}

function applyDracoJsFallback(): void {
  if (dracoJsFallback) return;
  dracoJsFallback = true;
  dracoLoader.setDecoderConfig({ type: 'js' });
  try {
    dracoLoader.preload();
  } catch {
    /* decoder will retry on first mesh */
  }
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
  tex.anisotropy = 4;
  textureCache.set(resolved, tex);
  return tex;
}

function cloneScene(scene: THREE.Group): THREE.Group {
  let skinned = false;
  scene.traverse((child) => {
    if ((child as THREE.SkinnedMesh).isSkinnedMesh) skinned = true;
  });
  return (skinned ? SkeletonUtils.clone(scene) : scene.clone()) as THREE.Group;
}

function cloneLoaded(model: LoadedModel): LoadedModel {
  return { scene: cloneScene(model.scene), animations: model.animations };
}

export async function loadGLB(path: string): Promise<LoadedModel> {
  const resolved = resolveModelUrl(assertPlayPathGlb(path));
  if (modelCache.has(resolved)) return cloneLoaded(modelCache.get(resolved)!);
  if (loadingPromises.has(resolved)) {
    return cloneLoaded(await loadingPromises.get(resolved)!);
  }

  const promise = gltfLoader
    .loadAsync(resolved)
    .then((gltf) => {
      enhanceGLTFMaterials(gltf.scene);
      const model: LoadedModel = { scene: gltf.scene, animations: gltf.animations };
      modelCache.set(resolved, model);
      return model;
    })
    .catch((err) => {
      if (!dracoJsFallback && /draco|wasm|WebAssembly/i.test(String(err))) {
        applyDracoJsFallback();
        return gltfLoader.loadAsync(resolved).then((gltf) => {
          enhanceGLTFMaterials(gltf.scene);
          const model: LoadedModel = { scene: gltf.scene, animations: gltf.animations };
          modelCache.set(resolved, model);
          return model;
        });
      }
      throw err;
    })
    .finally(() => {
      loadingPromises.delete(resolved);
    });

  loadingPromises.set(resolved, promise);
  return cloneLoaded(await promise);
}

function enhanceGLTFMaterials(scene: THREE.Group): void {
  scene.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    mesh.frustumCulled = true;
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
  _format: 'obj' | 'fbx' | 'glb' | 'gltf',
  _opts?: { mtlPath?: string; texturePath?: string },
): Promise<LoadedModel> {
  return loadGLB(assertPlayPathGlb(modelPath));
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
  const glbPath = assertPlayPathGlb(path);
  const resolved = resolveModelUrl(glbPath);
  if (animClipCache.has(resolved)) return animClipCache.get(resolved)!;
  if (modelCache.has(resolved) && modelCache.get(resolved)!.animations[0]) {
    const clip = modelCache.get(resolved)!.animations[0];
    animClipCache.set(resolved, clip);
    return clip;
  }
  if (animLoadingPromises.has(resolved)) return animLoadingPromises.get(resolved)!;

  const promise = (async (): Promise<THREE.AnimationClip | null> => {
    try {
      const model = await loadGLB(glbPath);
      const clip = model.animations[0] ?? null;
      if (clip) {
        clip.name =
          path
            .split('/')
            .pop()
            ?.replace(/\.(fbx|obj|glb|gltf)$/i, '')
            .toLowerCase() ?? 'unknown';
        animClipCache.set(resolved, clip);
      }
      return clip;
    } catch {
      return null;
    } finally {
      animLoadingPromises.delete(resolved);
    }
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
  return cloneLoaded(model);
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
  dracoWarmed = false;
}
