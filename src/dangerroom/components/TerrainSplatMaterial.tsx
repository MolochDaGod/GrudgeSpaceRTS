import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { TERRAIN_POLY_SETS } from "../data/polyhaven";

const vertexShader = /* glsl */ `
  attribute vec3 splatWeights;
  attribute vec3 color;
  varying vec3 vSplat;
  varying vec3 vColor;
  varying vec2 vUv;
  varying vec3 vNormal;
  #include <common>
  void main() {
    vSplat = splatWeights;
    vColor = color;
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D grassMap;
  uniform sampler2D grassNormal;
  uniform sampler2D grassRough;
  uniform sampler2D sandMap;
  uniform sampler2D sandNormal;
  uniform sampler2D sandRough;
  uniform sampler2D rockMap;
  uniform sampler2D rockNormal;
  uniform sampler2D rockRough;
  uniform sampler2D snowMap;
  uniform sampler2D snowNormal;
  uniform sampler2D snowRough;
  varying vec3 vColor;
  varying vec3 vSplat;
  varying vec2 vUv;
  varying vec3 vNormal;

  vec3 sampleTri(sampler2D map, vec2 uv) {
    return texture2D(map, uv * 12.0).rgb;
  }
  vec3 sampleNrm(sampler2D map, vec2 uv) {
    vec3 n = texture2D(map, uv * 12.0).xyz * 2.0 - 1.0;
    return normalize(n);
  }
  float sampleRgh(sampler2D map, vec2 uv) {
    return texture2D(map, uv * 12.0).g;
  }

  void main() {
    float wSand = vSplat.x;
    float wRock = vSplat.y;
    float wSnow = vSplat.z;
    float wGrass = max(0.0, 1.0 - wSand - wRock - wSnow);

    vec3 albedo =
      sampleTri(grassMap, vUv) * wGrass +
      sampleTri(sandMap, vUv) * wSand +
      sampleTri(rockMap, vUv) * wRock +
      sampleTri(snowMap, vUv) * wSnow;

    vec3 nrm =
      sampleNrm(grassNormal, vUv) * wGrass +
      sampleNrm(sandNormal, vUv) * wSand +
      sampleNrm(rockNormal, vUv) * wRock +
      sampleNrm(snowNormal, vUv) * wSnow;

    float rough =
      sampleRgh(grassRough, vUv) * wGrass +
      sampleRgh(sandRough, vUv) * wSand +
      sampleRgh(rockRough, vUv) * wRock +
      sampleRgh(snowRough, vUv) * wSnow;

    albedo *= vColor;

    vec3 lightDir = normalize(vec3(0.35, 0.9, 0.25));
    float ndl = max(dot(normalize(nrm), lightDir), 0.0);
    vec3 lit = albedo * (0.35 + ndl * 0.65);

    gl_FragColor = vec4(lit, 1.0);
  }
`;

export function TerrainSplatMaterial() {
  const sets = TERRAIN_POLY_SETS;
  const [
    grassMap,
    grassNormal,
    grassRough,
    sandMap,
    sandNormal,
    sandRough,
    rockMap,
    rockNormal,
    rockRough,
    snowMap,
    snowNormal,
    snowRough,
  ] = useTexture([
    sets.grass.color,
    sets.grass.normal,
    sets.grass.roughness,
    sets.sand.color,
    sets.sand.normal,
    sets.sand.roughness,
    sets.rock.color,
    sets.rock.normal,
    sets.rock.roughness,
    sets.snow.color,
    sets.snow.normal,
    sets.snow.roughness,
  ]);

  const textures = useMemo(() => {
    for (const t of [
      grassMap,
      grassNormal,
      grassRough,
      sandMap,
      sandNormal,
      sandRough,
      rockMap,
      rockNormal,
      rockRough,
      snowMap,
      snowNormal,
      snowRough,
    ]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 4;
    }
    return {
      grassMap,
      grassNormal,
      grassRough,
      sandMap,
      sandNormal,
      sandRough,
      rockMap,
      rockNormal,
      rockRough,
      snowMap,
      snowNormal,
      snowRough,
    };
  }, [
    grassMap,
    grassNormal,
    grassRough,
    sandMap,
    sandNormal,
    sandRough,
    rockMap,
    rockNormal,
    rockRough,
    snowMap,
    snowNormal,
    snowRough,
  ]);

  const uniforms = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(textures).map(([k, v]) => [k, { value: v }]),
      ),
    [textures],
  );

  return <shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} />;
}