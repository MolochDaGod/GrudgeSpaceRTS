import * as THREE from 'three';
import type { SpaceGameState, SpriteEffect } from './space-types';
import { EXPLOSION_SPRITES, SHOOTING_SPRITES, HIT_SPRITES, BOMB_SPRITES } from './space-prefabs';
import { SKILL_SPRITES, type SkillSpriteDef } from './space-skill-vfx';

const WORLD_SCALE = 0.05;

interface EffectMesh {
  mesh: THREE.Mesh;
  id: number;
}

export class SpaceEffectsRenderer {
  private scene: THREE.Scene;
  private effectMeshes: EffectMesh[] = [];
  private textureCache = new Map<string, THREE.Texture>();
  private textureLoader = new THREE.TextureLoader();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  update(state: SpaceGameState, dt: number, camera: THREE.Camera) {
    // Remove finished effects
    this.effectMeshes = this.effectMeshes.filter((em) => {
      const effect = state.spriteEffects.find((e) => e.id === em.id);
      if (!effect || effect.done) {
        this.scene.remove(em.mesh);
        return false;
      }
      return true;
    });

    // Update/create effect meshes
    for (const effect of state.spriteEffects) {
      if (effect.done) continue;

      let em = this.effectMeshes.find((e) => e.id === effect.id);
      if (!em) {
        const mesh = this.createEffectMesh(effect);
        if (!mesh) continue;
        this.scene.add(mesh);
        em = { mesh, id: effect.id };
        this.effectMeshes.push(em);
      }

      // Update position & billboard
      em.mesh.position.set(effect.x * WORLD_SCALE, effect.z * WORLD_SCALE, effect.y * WORLD_SCALE);
      em.mesh.lookAt(camera.position);
      em.mesh.scale.setScalar(effect.scale);

      // Animate UV offset for spritesheet
      this.updateSpriteUV(em.mesh, effect);
    }
  }

  private createEffectMesh(effect: SpriteEffect): THREE.Mesh | null {
    const spriteDef = this.getSpriteDef(effect.type);
    if (!spriteDef) return null;

    const texture = this.getTexture(spriteDef.path);
    if (!texture) return null;

    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.MeshBasicMaterial({
      map: texture.clone(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    // Set initial UV to first frame
    const cols = spriteDef.cols;
    const rows = spriteDef.rows;
    const uvs = geo.attributes.uv;
    const fw = 1 / cols;
    const fh = 1 / rows;
    // Frame 0 UVs
    uvs.setXY(0, 0, 1 - fh); // bottom-left -> top-left of first frame
    uvs.setXY(1, fw, 1 - fh);
    uvs.setXY(2, 0, 1);
    uvs.setXY(3, fw, 1);
    uvs.needsUpdate = true;

    return new THREE.Mesh(geo, mat);
  }

  private updateSpriteUV(mesh: THREE.Mesh, effect: SpriteEffect) {
    const spriteDef = this.getSpriteDef(effect.type);
    if (!spriteDef) return;

    const frame = Math.floor(effect.frame) % spriteDef.frames;
    const cols = spriteDef.cols;
    const rows = spriteDef.rows;
    const col = frame % cols;
    const row = Math.floor(frame / cols);
    const fw = 1 / cols;
    const fh = 1 / rows;

    const u0 = col * fw;
    const v0 = 1 - (row + 1) * fh;
    const u1 = (col + 1) * fw;
    const v1 = 1 - row * fh;

    const uvs = (mesh.geometry as THREE.PlaneGeometry).attributes.uv;
    uvs.setXY(0, u0, v1);
    uvs.setXY(1, u1, v1);
    uvs.setXY(2, u0, v0);
    uvs.setXY(3, u1, v0);
    uvs.needsUpdate = true;
  }

  private getSpriteDef(type: string) {
    // Check skill sprites first (faction abilities, status effects, warp portals)
    const skillDef = SKILL_SPRITES[type];
    if (skillDef) {
      return { path: skillDef.path, frames: skillDef.frames, cols: skillDef.cols, rows: skillDef.rows };
    }
    return EXPLOSION_SPRITES[type] ?? SHOOTING_SPRITES[type] ?? HIT_SPRITES[type] ?? BOMB_SPRITES[type] ?? null;
  }

  private getTexture(path: string): THREE.Texture | null {
    if (this.textureCache.has(path)) return this.textureCache.get(path)!;
    const tex = this.textureLoader.load(path);
    this.textureCache.set(path, tex);
    return tex;
  }
}
