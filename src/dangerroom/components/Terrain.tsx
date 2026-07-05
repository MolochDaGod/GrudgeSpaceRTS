import { Suspense, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, HeightfieldCollider } from "@react-three/rapier";
import * as THREE from "three";
import {
  CHUNK_SIZE,
  CHUNK_SEGMENTS,
  VIEW_DISTANCE,
  getTerrainHeight,
  biomeColor,
  biomeSplatWeights,
  chunkKey,
  worldToChunk,
} from "../state/terrain";
import { worldPositions } from "../state/world";
import { buildHeightfieldForCenter } from "../physics/heightfield";
import { collision } from "../physics/collisionGroups";
import { TerrainSplatMaterial } from "./TerrainSplatMaterial";

function buildChunkGeometry(cx: number, cz: number): THREE.BufferGeometry {
  const geometry = new THREE.PlaneGeometry(
    CHUNK_SIZE,
    CHUNK_SIZE,
    CHUNK_SEGMENTS,
    CHUNK_SEGMENTS,
  );
  geometry.rotateX(-Math.PI / 2);

  const originX = cx * CHUNK_SIZE;
  const originZ = cz * CHUNK_SIZE;
  const pos = geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const splats = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const localX = pos.getX(i);
    const localZ = pos.getZ(i);
    const worldX = originX + localX;
    const worldZ = originZ + localZ;
    const height = getTerrainHeight(worldX, worldZ);
    pos.setY(i, height);
    const [r, g, b] = biomeColor(worldX, worldZ, height);
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
    const [sand, rock, snow] = biomeSplatWeights(worldX, worldZ, height);
    splats[i * 3] = sand;
    splats[i * 3 + 1] = rock;
    splats[i * 3 + 2] = snow;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("splatWeights", new THREE.BufferAttribute(splats, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function TerrainChunk({ cx, cz }: { cx: number; cz: number }) {
  const geometry = useMemo(() => buildChunkGeometry(cx, cz), [cx, cz]);
  return (
    <group position={[cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE]}>
      <mesh geometry={geometry} receiveShadow>
        <TerrainSplatMaterial />
      </mesh>
    </group>
  );
}

function TerrainHeightfield({ centerCx, centerCz }: { centerCx: number; centerCz: number }) {
  const { args, position } = useMemo(
    () => buildHeightfieldForCenter(centerCx, centerCz),
    [centerCx, centerCz],
  );

  return (
    <RigidBody
      key={`hf:${centerCx}:${centerCz}`}
      type="fixed"
      colliders={false}
      position={position}
      collisionGroups={collision.environment}
    >
      <HeightfieldCollider
        args={args}
        friction={1.2}
        restitution={0}
        collisionGroups={collision.environment}
      />
    </RigidBody>
  );
}

function initialChunks(): Array<{ cx: number; cz: number }> {
  const list: Array<{ cx: number; cz: number }> = [];
  for (let dx = -VIEW_DISTANCE; dx <= VIEW_DISTANCE; dx++) {
    for (let dz = -VIEW_DISTANCE; dz <= VIEW_DISTANCE; dz++) {
      list.push({ cx: dx, cz: dz });
    }
  }
  return list;
}

function TerrainChunks() {
  const [chunkList, setChunkList] = useState<Array<{ cx: number; cz: number }>>(initialChunks);
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const lastCenter = useRef<[number, number]>([0, 0]);

  useFrame(() => {
    const [cx, cz] = worldToChunk(worldPositions.player.x, worldPositions.player.z);
    if (cx === lastCenter.current[0] && cz === lastCenter.current[1]) return;
    lastCenter.current = [cx, cz];
    setCenter([cx, cz]);

    const next: Array<{ cx: number; cz: number }> = [];
    for (let dx = -VIEW_DISTANCE; dx <= VIEW_DISTANCE; dx++) {
      for (let dz = -VIEW_DISTANCE; dz <= VIEW_DISTANCE; dz++) {
        next.push({ cx: cx + dx, cz: cz + dz });
      }
    }
    setChunkList(next);
  });

  return (
    <>
      <TerrainHeightfield centerCx={center[0]} centerCz={center[1]} />
      {chunkList.map(({ cx, cz }) => (
        <TerrainChunk key={chunkKey(cx, cz)} cx={cx} cz={cz} />
      ))}
    </>
  );
}

export function Terrain() {
  return (
    <group>
      <Suspense fallback={null}>
        <TerrainChunks />
      </Suspense>
    </group>
  );
}