import * as THREE from "three";

/** Multiply mesh standard materials by a faction / biome tint. */
export function applyTint(root: THREE.Object3D, hex: string, strength = 0.22) {
  const tint = new THREE.Color(hex);
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      const std = mat as THREE.MeshStandardMaterial;
      if (!std?.isMeshStandardMaterial) continue;
      std.color.lerp(tint, strength);
    }
  });
}