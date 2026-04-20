/**
 * Convert armadacharacter FBX → optimized GLB with embedded PBR textures.
 * Uses Three.js FBXLoader + GLTFExporter in Node.js.
 *
 * Usage: node scripts/convert-armada-char.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Three.js requires some DOM stubs in Node
import { Blob } from 'buffer';
globalThis.Blob = Blob;
globalThis.self = globalThis;
globalThis.document = { createElementNS: () => ({}) };
globalThis.window = { addEventListener: () => {}, removeEventListener: () => {} };

const SRC_FBX = 'D:/Games/Models/armadacharacter/source/NCR R.fbx';
const TEX_DIFFUSE = 'D:/Games/Models/armadacharacter/textures/Material_Pbr_Diffuse.png';
const TEX_NORMAL = 'D:/Games/Models/armadacharacter/textures/Material_Pbr_Normal.png';
const OUT_GLB = 'F:/GitHub/GrudgeSpaceRTS/public/assets/ground/characters/armada/ncr-ranger.glb';

async function main() {
  // Dynamic import Three.js (ESM)
  const THREE = await import('three');

  // FBXLoader needs TextDecoder
  if (!globalThis.TextDecoder) {
    const { TextDecoder } = await import('util');
    globalThis.TextDecoder = TextDecoder;
  }

  console.log('Loading FBX...');
  const fbxData = readFileSync(SRC_FBX);

  // FBXLoader expects an ArrayBuffer
  const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
  const loader = new FBXLoader();

  // Parse FBX from buffer
  const fbxGroup = loader.parse(fbxData.buffer, '');
  console.log(`FBX loaded: ${fbxGroup.children.length} children`);

  // Apply PBR textures
  const diffusePng = readFileSync(TEX_DIFFUSE);
  const normalPng = readFileSync(TEX_NORMAL);

  const texLoader = new THREE.TextureLoader();

  // Create data URIs for textures
  const diffuseDataUri = `data:image/png;base64,${diffusePng.toString('base64')}`;
  const normalDataUri = `data:image/png;base64,${normalPng.toString('base64')}`;

  console.log('Applying PBR materials...');
  let meshCount = 0;
  fbxGroup.traverse((child) => {
    if (!child.isMesh) return;
    meshCount++;
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.65,
      metalness: 0.3,
    });

    // Set textures via data URIs embedded in the material
    // The GLTFExporter will embed these in the GLB
    const diffTex = new THREE.Texture();
    diffTex.image = { src: diffuseDataUri, width: 2048, height: 2048 };
    diffTex.colorSpace = THREE.SRGBColorSpace;
    diffTex.needsUpdate = true;
    mat.map = diffTex;

    const normTex = new THREE.Texture();
    normTex.image = { src: normalDataUri, width: 2048, height: 2048 };
    normTex.needsUpdate = true;
    mat.normalMap = normTex;

    child.material = mat;
    child.castShadow = true;
    child.receiveShadow = true;
  });
  console.log(`Applied PBR to ${meshCount} meshes`);

  // Normalize scale: target 2.0 units tall
  const box = new THREE.Box3().setFromObject(fbxGroup);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0.001) {
    fbxGroup.scale.multiplyScalar(2.0 / maxDim);
  }
  console.log(`Normalized from ${maxDim.toFixed(1)} to 2.0 units`);

  // Export to GLB
  console.log('Exporting GLB...');
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
  const exporter = new GLTFExporter();

  const glb = await exporter.parseAsync(fbxGroup, {
    binary: true,
    animations: fbxGroup.animations || [],
    maxTextureSize: 2048,
  });

  writeFileSync(OUT_GLB, Buffer.from(glb));
  const sizeMB = (Buffer.from(glb).length / (1024 * 1024)).toFixed(1);
  console.log(`\n✅ Wrote ${OUT_GLB}`);
  console.log(`   Size: ${sizeMB} MB`);
}

main().catch((err) => {
  console.error('Conversion failed:', err.message);
  console.log('\nFallback: Copy the FBX directly and use runtime FBXLoader.');

  // Fallback: just copy the FBX so the game can still load it
  const { copyFileSync } = await import('fs');
  copyFileSync(SRC_FBX, OUT_GLB.replace('.glb', '.fbx'));
  console.log('Copied FBX as fallback.');
});
