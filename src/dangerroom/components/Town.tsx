import { GltfProp } from "./GltfProp";
import type { AssetDef } from "../data/worldAssets";

const ASSET_CDN = "https://assets.grudge-studio.com";

interface BuildingPlacement {
  key: string;
  asset: AssetDef;
  x: number;
  z: number;
  rotationY: number;
}

function building(file: string, height: number): AssetDef {
  return {
    url: `${ASSET_CDN}/models/KayKit_MedievalBuilder/objects/gltf/${file}.gltf.glb`,
    height,
    collider: "box",
  };
}

// Buildings are normalized to explicit world heights (metres) via GltfProp's
// bounding-box rescale, so they tower over the ~1.8m characters instead of the
// old fixed 1.4x scale. They rest on the flat neutral town terrain and carry box
// colliders so the physics character controller can't walk through them.
const BUILDINGS: BuildingPlacement[] = [
  { key: "market", asset: building("market", 9), x: 0, z: -18, rotationY: Math.PI },
  { key: "house-1", asset: building("house", 6.5), x: -12, z: -22, rotationY: Math.PI * 0.15 },
  { key: "house-2", asset: building("house", 6.5), x: 12, z: -22, rotationY: -Math.PI * 0.15 },
  { key: "barracks", asset: building("barracks", 8), x: -19, z: -9, rotationY: Math.PI * 0.4 },
  { key: "archeryrange", asset: building("archeryrange", 6.5), x: 19, z: -9, rotationY: -Math.PI * 0.4 },
  { key: "lumbermill", asset: building("lumbermill", 7), x: -21, z: -25, rotationY: Math.PI * 0.25 },
  { key: "mine", asset: building("mine", 6.5), x: 21, z: -25, rotationY: -Math.PI * 0.25 },
];

export function Town() {
  return (
    <group>
      {BUILDINGS.map(({ key, asset, x, z, rotationY }) => (
        <GltfProp key={key} asset={asset} x={x} z={z} rotationY={rotationY} />
      ))}
    </group>
  );
}
