/**
 * space-3d-text.ts — 3D floating text system using troika-three-text.
 *
 * Provides high-quality SDF text rendering in 3D space for:
 * - Floating damage numbers
 * - Ship name labels
 * - Resource pickup indicators
 * - Planet names
 *
 * Usage:
 *   const textSystem = new TextSystem(scene);
 *   textSystem.spawnDamage(x, y, z, 42, '#ff4444');
 *   textSystem.update(dt, camera);
 */

import * as THREE from 'three';
import { Text } from 'troika-three-text';

const WORLD_SCALE = 0.05;

export interface FloatingLabel {
  id: number;
  mesh: InstanceType<typeof Text>;
  age: number;
  maxAge: number;
  /** World-space rise speed (units/sec) */
  riseSpeed: number;
  /** If true, always faces the camera */
  billboard: boolean;
  /** If true, fades opacity over lifetime */
  fadeOut: boolean;
  /** Scale-in on spawn */
  scaleIn: boolean;
}

let nextLabelId = 0;

export class TextSystem {
  private scene: THREE.Scene;
  private labels: FloatingLabel[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /** Spawn a floating damage number that rises and fades. */
  spawnDamage(gameX: number, gameY: number, gameZ: number, damage: number, color = '#ff4444'): void {
    const mesh = new Text();
    mesh.text = `-${damage}`;
    mesh.fontSize = 1.2;
    mesh.color = color;
    mesh.anchorX = 'center';
    mesh.anchorY = 'middle';
    mesh.outlineWidth = 0.08;
    mesh.outlineColor = '#000000';
    mesh.material = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    mesh.position.set(gameX * WORLD_SCALE, gameZ * WORLD_SCALE + 5, gameY * WORLD_SCALE);
    mesh.sync();
    this.scene.add(mesh);

    this.labels.push({
      id: nextLabelId++,
      mesh,
      age: 0,
      maxAge: 1.5,
      riseSpeed: 3,
      billboard: true,
      fadeOut: true,
      scaleIn: true,
    });
  }

  /** Spawn a resource pickup indicator (+credits, +energy, etc.). */
  spawnResourceText(gameX: number, gameY: number, text: string, color = '#ffcc22'): void {
    const mesh = new Text();
    mesh.text = text;
    mesh.fontSize = 0.9;
    mesh.color = color;
    mesh.anchorX = 'center';
    mesh.anchorY = 'middle';
    mesh.outlineWidth = 0.06;
    mesh.outlineColor = '#000000';
    mesh.material = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
    });
    mesh.position.set(gameX * WORLD_SCALE, 4, gameY * WORLD_SCALE);
    mesh.sync();
    this.scene.add(mesh);

    this.labels.push({
      id: nextLabelId++,
      mesh,
      age: 0,
      maxAge: 2.0,
      riseSpeed: 2,
      billboard: true,
      fadeOut: true,
      scaleIn: false,
    });
  }

  /** Spawn a persistent label (e.g. ship name) — returns ID for later removal. */
  spawnLabel(gameX: number, gameY: number, text: string, color = '#ffffff', fontSize = 0.6): number {
    const mesh = new Text();
    mesh.text = text;
    mesh.fontSize = fontSize;
    mesh.color = color;
    mesh.anchorX = 'center';
    mesh.anchorY = 'middle';
    mesh.material = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
    });
    mesh.position.set(gameX * WORLD_SCALE, 6, gameY * WORLD_SCALE);
    mesh.sync();
    this.scene.add(mesh);

    const id = nextLabelId++;
    this.labels.push({
      id,
      mesh,
      age: 0,
      maxAge: Infinity,
      riseSpeed: 0,
      billboard: true,
      fadeOut: false,
      scaleIn: false,
    });
    return id;
  }

  /** Remove a persistent label by ID. */
  removeLabel(id: number): void {
    const idx = this.labels.findIndex((l) => l.id === id);
    if (idx < 0) return;
    const label = this.labels[idx];
    this.scene.remove(label.mesh);
    label.mesh.dispose();
    this.labels.splice(idx, 1);
  }

  /** Update all active labels — call once per frame. */
  update(dt: number, camera: THREE.Camera): void {
    for (let i = this.labels.length - 1; i >= 0; i--) {
      const label = this.labels[i];
      label.age += dt;

      // Remove expired labels
      if (label.age >= label.maxAge) {
        this.scene.remove(label.mesh);
        label.mesh.dispose();
        this.labels.splice(i, 1);
        continue;
      }

      const t = label.maxAge === Infinity ? 0 : label.age / label.maxAge;

      // Rise
      if (label.riseSpeed > 0) {
        label.mesh.position.y += label.riseSpeed * dt;
      }

      // Billboard: face camera
      if (label.billboard) {
        label.mesh.lookAt(camera.position);
      }

      // Fade out
      if (label.fadeOut) {
        const opacity = 1.0 - t;
        const mat = label.mesh.material as THREE.MeshBasicMaterial;
        if (mat) mat.opacity = opacity;
      }

      // Scale-in pop effect
      if (label.scaleIn && label.age < 0.15) {
        const s = label.age / 0.15;
        const ease = 1 + (1 - s) * 0.5; // overshoot
        label.mesh.scale.setScalar(ease);
      }
    }
  }

  /** Dispose all labels and cleanup. */
  dispose(): void {
    for (const label of this.labels) {
      this.scene.remove(label.mesh);
      label.mesh.dispose();
    }
    this.labels.length = 0;
  }
}
