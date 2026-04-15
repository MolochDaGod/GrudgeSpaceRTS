#!/usr/bin/env node
/**
 * convert-to-glb.mjs — Unified GLTF conversion pipeline.
 *
 * Walks public/assets/, converts every OBJ and FBX to GLB,
 * normalizes model sizes, applies Draco compression, and writes
 * the output to public/assets-glb/ with a manifest.json.
 *
 * Usage:
 *   node scripts/convert-to-glb.mjs              # full conversion
 *   node scripts/convert-to-glb.mjs --dry-run    # list files, no conversion
 *   node scripts/convert-to-glb.mjs --skip-draco # skip Draco compression
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

// ── Resolve project root ──────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const ASSETS_SRC = path.join(ROOT, 'public', 'assets');
const ASSETS_OUT = path.join(ROOT, 'public', 'assets-glb');

// ── CLI flags ─────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_DRACO = process.argv.includes('--skip-draco');

// ── Load size config ──────────────────────────────────────────────
const sizeConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'size-config.json'), 'utf-8'),
);

function matchCategory(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  for (const rule of sizeConfig.rules) {
    if (normalized.includes(rule.pattern)) {
      return { category: rule.category, targetSize: rule.targetSize };
    }
  }
  return sizeConfig.defaults;
}

// ── Walk directory for model files ────────────────────────────────
function walkDir(dir, exts, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, exts, results);
    } else if (exts.some((e) => entry.name.toLowerCase().endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

// ── OBJ → GLB (via obj2gltf) ─────────────────────────────────────
async function convertOBJ(srcPath, outPath) {
  const obj2gltf = (await import('obj2gltf')).default;
  const options = {
    binary: true,
    // Look for MTL in the same directory
    inputUpAxis: 'Y',
    outputUpAxis: 'Y',
  };
  const glb = await obj2gltf(srcPath, options);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, glb);
}

// ── FBX → GLB (via fbx2gltf binary) ──────────────────────────────
function convertFBX(srcPath, outPath) {
  // fbx2gltf npm package exposes the binary path
  let binPath;
  try {
    const fbx2gltfPkg = path.join(ROOT, 'node_modules', 'fbx2gltf');
    // The package exports the binary path
    const pkgJson = JSON.parse(
      fs.readFileSync(path.join(fbx2gltfPkg, 'package.json'), 'utf-8'),
    );
    // Find the binary — it's in the bin directory
    const binDir = path.join(fbx2gltfPkg, 'bin');
    if (fs.existsSync(binDir)) {
      const files = fs.readdirSync(binDir);
      const exe = files.find(
        (f) => f.startsWith('FBX2glTF') || f.startsWith('fbx2gltf'),
      );
      if (exe) binPath = path.join(binDir, exe);
    }
    // Fallback: check top-level
    if (!binPath) {
      const topFiles = fs.readdirSync(fbx2gltfPkg);
      const exe = topFiles.find(
        (f) =>
          (f.startsWith('FBX2glTF') || f.startsWith('fbx2gltf')) &&
          (f.endsWith('.exe') || !f.includes('.')),
      );
      if (exe) binPath = path.join(fbx2gltfPkg, exe);
    }
  } catch {
    /* not found */
  }

  if (!binPath || !fs.existsSync(binPath)) {
    // Try global fbx2gltf
    binPath = 'FBX2glTF';
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  // fbx2gltf outputs .glb when --binary flag is used
  // Output path should NOT have .glb extension — fbx2gltf adds it
  const outBase = outPath.replace(/\.glb$/i, '');
  try {
    execFileSync(binPath, ['--binary', '--input', srcPath, '--output', outBase], {
      stdio: 'pipe',
      timeout: 30_000,
    });
    // fbx2gltf may create outBase.glb — rename if needed
    const expectedOut = outBase + '.glb';
    if (fs.existsSync(expectedOut) && expectedOut !== outPath) {
      fs.renameSync(expectedOut, outPath);
    }
  } catch (err) {
    throw new Error(
      `FBX conversion failed for ${srcPath}: ${err.message}\n` +
        `Make sure FBX2glTF binary is installed. Run: npm i -D fbx2gltf`,
    );
  }
}

// ── Copy + optimize existing GLB/GLTF ─────────────────────────────
async function copyGLTF(srcPath, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  // For .gltf files, we need the companion .bin and texture files
  if (srcPath.toLowerCase().endsWith('.gltf')) {
    // Copy the entire directory contents to preserve references
    const srcDir = path.dirname(srcPath);
    const outDir = path.dirname(outPath);
    const files = fs.readdirSync(srcDir);
    for (const f of files) {
      const src = path.join(srcDir, f);
      const dst = path.join(outDir, f);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, dst);
      }
    }
    // Rename .gltf → .glb is not straightforward; keep as-is for now
    // The manifest will track the actual format
    return 'gltf'; // signal it's still gltf (not converted to binary)
  }

  // .glb — straight copy
  fs.copyFileSync(srcPath, outPath);
  return 'glb';
}

// ── Size normalization via gltf-transform ─────────────────────────
async function normalizeSize(glbPath, targetSize) {
  if (!targetSize) return; // null = skip normalization

  try {
    const { NodeIO } = await import('@gltf-transform/core');
    const { ALL_EXTENSIONS } = await import('@gltf-transform/extensions');

    const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
    const doc = await io.read(glbPath);
    const root = doc.getRoot();
    const scenes = root.listScenes();
    if (scenes.length === 0) return;

    // Compute bounding box of the default scene
    const scene = scenes[0];
    const nodes = scene.listChildren();
    if (nodes.length === 0) return;

    // Find bounding box via mesh accessors
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const mesh of root.listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        const pos = prim.getAttribute('POSITION');
        if (!pos) continue;
        const arr = pos.getArray();
        if (!arr) continue;
        for (let i = 0; i < arr.length; i += 3) {
          minX = Math.min(minX, arr[i]);
          minY = Math.min(minY, arr[i + 1]);
          minZ = Math.min(minZ, arr[i + 2]);
          maxX = Math.max(maxX, arr[i]);
          maxY = Math.max(maxY, arr[i + 1]);
          maxZ = Math.max(maxZ, arr[i + 2]);
        }
      }
    }

    const sizeX = maxX - minX;
    const sizeY = maxY - minY;
    const sizeZ = maxZ - minZ;
    const maxDim = Math.max(sizeX, sizeY, sizeZ);

    if (maxDim < 0.001 || !isFinite(maxDim)) return; // empty or broken

    const scaleFactor = targetSize / maxDim;
    if (Math.abs(scaleFactor - 1.0) < 0.01) return; // already correct

    // Scale all mesh position attributes directly (bakes the scale)
    for (const mesh of root.listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        const pos = prim.getAttribute('POSITION');
        if (!pos) continue;
        const arr = pos.getArray();
        if (!arr) continue;
        for (let i = 0; i < arr.length; i++) {
          arr[i] *= scaleFactor;
        }
        // Also update min/max
        const pMin = pos.getMin([]);
        const pMax = pos.getMax([]);
        if (pMin && pMax) {
          pos.setMin(pMin.map((v) => v * scaleFactor));
          pos.setMax(pMax.map((v) => v * scaleFactor));
        }
      }
    }

    // Clear any node-level transforms that would double-scale
    for (const node of root.listNodes()) {
      const s = node.getScale();
      if (s[0] !== 1 || s[1] !== 1 || s[2] !== 1) {
        node.setScale([1, 1, 1]);
      }
    }

    await io.write(glbPath, doc);
  } catch (err) {
    console.warn(`  ⚠ Size normalization failed for ${path.basename(glbPath)}: ${err.message}`);
  }
}

// ── Draco compression via gltf-transform ──────────────────────────
async function applyDraco(glbPath) {
  if (SKIP_DRACO) return;

  try {
    const { NodeIO } = await import('@gltf-transform/core');
    const { ALL_EXTENSIONS } = await import('@gltf-transform/extensions');
    const { draco, quantize } = await import('@gltf-transform/functions');

    // Draco encoder requires the draco3dgltf package
    let dracoEnc;
    try {
      dracoEnc = await import('draco3dgltf');
    } catch {
      // draco3dgltf not installed — skip Draco, apply quantize only
      const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
      const doc = await io.read(glbPath);
      await doc.transform(quantize());
      await io.write(glbPath, doc);
      return;
    }

    const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
    const doc = await io.read(glbPath);
    await doc.transform(
      draco({ ...dracoEnc }),
      quantize(),
    );
    await io.write(glbPath, doc);
  } catch (err) {
    console.warn(`  ⚠ Draco failed for ${path.basename(glbPath)}: ${err.message}`);
  }
}

// ── Main pipeline ─────────────────────────────────────────────────
async function main() {
  console.log('🔧 GLTF Unification Pipeline');
  console.log(`   Source: ${ASSETS_SRC}`);
  console.log(`   Output: ${ASSETS_OUT}`);
  console.log(`   Dry run: ${DRY_RUN}`);
  console.log(`   Draco: ${!SKIP_DRACO}\n`);

  // Discover all model files
  const allFiles = walkDir(ASSETS_SRC, ['.obj', '.fbx', '.glb', '.gltf']);

  const objFiles = allFiles.filter((f) => f.toLowerCase().endsWith('.obj'));
  const fbxFiles = allFiles.filter((f) => f.toLowerCase().endsWith('.fbx'));
  const glbFiles = allFiles.filter((f) => f.toLowerCase().endsWith('.glb'));
  const gltfFiles = allFiles.filter((f) => f.toLowerCase().endsWith('.gltf'));

  console.log(`📁 Found: ${objFiles.length} OBJ, ${fbxFiles.length} FBX, ${glbFiles.length} GLB, ${gltfFiles.length} GLTF\n`);

  if (DRY_RUN) {
    console.log('── OBJ files ──');
    objFiles.forEach((f) => {
      const rel = path.relative(ASSETS_SRC, f);
      const { category, targetSize } = matchCategory(rel);
      console.log(`  ${rel}  →  ${category} (${targetSize ?? 'no resize'})`);
    });
    console.log('\n── FBX files ──');
    fbxFiles.forEach((f) => {
      const rel = path.relative(ASSETS_SRC, f);
      const { category, targetSize } = matchCategory(rel);
      console.log(`  ${rel}  →  ${category} (${targetSize ?? 'no resize'})`);
    });
    console.log('\n── GLB/GLTF (copy + optimize) ──');
    [...glbFiles, ...gltfFiles].forEach((f) => {
      console.log(`  ${path.relative(ASSETS_SRC, f)}`);
    });
    console.log(`\nTotal: ${allFiles.length} files. Run without --dry-run to convert.`);
    return;
  }

  // Ensure output directory
  fs.mkdirSync(ASSETS_OUT, { recursive: true });

  const manifest = {};
  let converted = 0;
  let failed = 0;
  const total = allFiles.length;

  // ── Convert OBJ files ───────────────────────────────────────
  for (const srcFile of objFiles) {
    const rel = path.relative(ASSETS_SRC, srcFile);
    const outRel = rel.replace(/\.obj$/i, '.glb');
    const outFile = path.join(ASSETS_OUT, outRel);
    const { category, targetSize } = matchCategory(rel);

    process.stdout.write(`[${converted + failed + 1}/${total}] OBJ → GLB: ${rel} ...`);
    try {
      await convertOBJ(srcFile, outFile);
      await normalizeSize(outFile, targetSize);
      await applyDraco(outFile);
      manifest['/assets/' + rel.replace(/\\/g, '/')] = {
        glbPath: '/assets-glb/' + outRel.replace(/\\/g, '/'),
        category,
        targetSize,
        format: 'glb',
      };
      converted++;
      console.log(' ✓');
    } catch (err) {
      failed++;
      console.log(` ✗ ${err.message}`);
    }
  }

  // ── Convert FBX files ───────────────────────────────────────
  for (const srcFile of fbxFiles) {
    const rel = path.relative(ASSETS_SRC, srcFile);
    const outRel = rel.replace(/\.fbx$/i, '.glb');
    const outFile = path.join(ASSETS_OUT, outRel);
    const { category, targetSize } = matchCategory(rel);

    process.stdout.write(`[${converted + failed + 1}/${total}] FBX → GLB: ${rel} ...`);
    try {
      convertFBX(srcFile, outFile);
      await normalizeSize(outFile, targetSize);
      await applyDraco(outFile);
      manifest['/assets/' + rel.replace(/\\/g, '/')] = {
        glbPath: '/assets-glb/' + outRel.replace(/\\/g, '/'),
        category,
        targetSize,
        format: 'glb',
      };
      converted++;
      console.log(' ✓');
    } catch (err) {
      failed++;
      console.log(` ✗ ${err.message}`);
    }
  }

  // ── Copy + optimize GLB/GLTF files ──────────────────────────
  for (const srcFile of [...glbFiles, ...gltfFiles]) {
    const rel = path.relative(ASSETS_SRC, srcFile);
    const isGltf = srcFile.toLowerCase().endsWith('.gltf');
    const outRel = isGltf ? rel : rel; // keep original extension for gltf (has sidecar deps)
    const outFile = path.join(ASSETS_OUT, outRel);
    const { category, targetSize } = matchCategory(rel);

    process.stdout.write(`[${converted + failed + 1}/${total}] COPY: ${rel} ...`);
    try {
      const actualFormat = await copyGLTF(srcFile, outFile);
      if (actualFormat === 'glb') {
        await normalizeSize(outFile, targetSize);
        await applyDraco(outFile);
      }
      manifest['/assets/' + rel.replace(/\\/g, '/')] = {
        glbPath: '/assets-glb/' + outRel.replace(/\\/g, '/'),
        category,
        targetSize,
        format: actualFormat,
      };
      converted++;
      console.log(' ✓');
    } catch (err) {
      failed++;
      console.log(` ✗ ${err.message}`);
    }
  }

  // ── Write manifest ──────────────────────────────────────────
  const manifestPath = path.join(ASSETS_OUT, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\n✅ Pipeline complete.`);
  console.log(`   Converted: ${converted}/${total}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Manifest: ${manifestPath}`);
  console.log(`   Output: ${ASSETS_OUT}`);
}

main().catch((err) => {
  console.error('Pipeline error:', err);
  process.exit(1);
});
