/**
 * Prefab ↔ Disk Audit Script
 * Cross-references every modelPath in space-prefabs.ts against actual files in public/assets/
 * Reports:
 *  1. Broken prefab paths (file missing on disk)
 *  2. Unreferenced model files (exist on disk, no prefab)
 *  3. Models missing GLB/GLTF equivalents
 *  4. Summary stats
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT, 'public', 'assets');
const PREFAB_FILE = path.join(ROOT, 'src', 'game', 'space-prefabs.ts');

// ── 1. Extract all modelPath values from the TS source ──────────
const src = fs.readFileSync(PREFAB_FILE, 'utf-8');

// Resolve TS const variables used in template literals
const VARS = {
  FP: '/assets/space/models/forge-prefabs',
  NS: '/assets/space/models/new-ships',
  BP: '/assets/space/models/bionic-parts',
  LP: '/assets/space/models/lowpoly-fleet',
  OH: '/assets/space/models/organic-hero',
  CT: '/assets/space/models/cargo-transport',
  RD: '/assets/space/models/research-drone',
  CR: '/assets/space/models/control-room',
  CI: '/assets/space/models/cargo-interior',
  SLD: '/assets/space/models/soldier',
  MCH: '/assets/space/models/mech',
  SFM: '/assets/space/models/scifi-materials',
  FS: '/assets/space/models/flying-ship',
  LPF: '/assets/space/models/lowpoly',
  HB: '/assets/space/models/heavy-bomber',
  CYS: '/assets/space/models/cyborg-soldier',
  CYB: '/assets/space/models/cyborg',
  AMT: '/assets/space/models/amaterasu',
  SSM: '/assets/space/models/space-station-modular',
  MSS: '/assets/space/models/modular-spaceship',
  SRV: '/assets/space/models/server-room',
  CLP: '/assets/space/models/craftpix-lowpoly-ships/fbx',
  GWP: '/assets/ground/weapons/guns/FreeSample',
  GWT: '/assets/ground/weapons/guns/FreeSample/T_Weapons.png',
  GSP: '/assets/ground/weapons/shields',
  GST: '/assets/ground/weapons/shields/texture/Texture_MAp_shields.png',
  ENV0: '/assets/ground/terrain/env-scifi/Env_00',
  SHS: '/assets/ground/rts-buildings/SHS_Sci-Fi RTS pack/Assets/Fbx',
  SHS_METAL: '/assets/ground/rts-buildings/SHS_Sci-Fi RTS pack/Assets/Fbx/Gradient Pallete Metal.png',
  SHS_BASE: '/assets/ground/rts-buildings/SHS_Sci-Fi RTS pack/Assets/Fbx/Gradient Pallete.png',
  LP_TEX: '/assets/space/models/lowpoly/Pallette.png',
  A: '/assets/space/audio',
};

function resolveVars(str) {
  return str.replace(/\$\{(\w+)\}/g, (_, name) => VARS[name] || `\${${name}}`);
}

const modelPathRegex = /modelPath:\s*(`[^`]+`|'[^']+'|"[^"]+")/g;
const mtlPathRegex = /mtlPath:\s*(`[^`]+`|'[^']+'|"[^"]+")/g;
const texturePathRegex = /texturePath:\s*(`[^`]+`|'[^']+'|"[^"]+")/g;
const partPathsRegex = /partPaths:\s*\[([\s\S]*?)\]/g;

const prefabPaths = new Set();
function addPath(raw) {
  // Strip quotes/backticks
  const stripped = raw.replace(/^[`'"]|[`'"]$/g, '');
  const resolved = resolveVars(stripped);
  prefabPaths.add(resolved);
}

let m;
while ((m = modelPathRegex.exec(src)) !== null) addPath(m[1]);
while ((m = mtlPathRegex.exec(src)) !== null) addPath(m[1]);
while ((m = texturePathRegex.exec(src)) !== null) addPath(m[1]);
while ((m = partPathsRegex.exec(src)) !== null) {
  const inner = m[1];
  const pp = /(`[^`]+`|'[^']+'|"[^"]+")/g;
  let pm;
  while ((pm = pp.exec(inner)) !== null) addPath(pm[1]);
}

// Handle computed paths from loops / template strings
// Shield loop: ${GSP}/fbx/_shield_${i}.fbx  where i=1..20
for (let i = 1; i <= 20; i++) {
  prefabPaths.add(`/assets/ground/weapons/shields/fbx/_shield_${i}.fbx`);
}
// Voxel fleet loop: /assets/space/models/voxel-fleet/Spaceship${i}.obj  where i=1..6
for (let i = 1; i <= 6; i++) {
  prefabPaths.add(`/assets/space/models/voxel-fleet/Spaceship${i}.obj`);
  prefabPaths.add(`/assets/space/models/voxel-fleet/Spaceship${i}.mtl`);
}
// Lowpoly FBX loop colors
const colors = ['Blue', 'Green', 'Orange', 'Purple'];
const LPF = '/assets/space/models/lowpoly';
prefabPaths.add(`${LPF}/Pallette.png`);
for (const color of colors) {
  prefabPaths.add(`${LPF}/SpaceShip - ${color}.fbx`);
  prefabPaths.add(`${LPF}/SpaceShip2 - ${color}.fbx`);
  prefabPaths.add(`${LPF}/Cruiser - ${color}.fbx`);
}
// AttachedShip variants
prefabPaths.add(`${LPF}/AttachedShip.fbx`);
prefabPaths.add(`${LPF}/AttachedShip.001.fbx`);
prefabPaths.add(`${LPF}/AttachedShip.002.fbx`);
prefabPaths.add(`${LPF}/AttachedShip.003.fbx`);

console.log(`\n═══ PREFAB AUDIT REPORT ═══\n`);
console.log(`Total unique prefab paths extracted: ${prefabPaths.size}\n`);

// ── 2. Check each prefab path against disk ──────────────────────
const MODEL_EXTS = new Set(['.fbx', '.obj', '.glb', '.gltf']);
const broken = [];
const valid = [];

for (const p of prefabPaths) {
  const diskPath = path.join(ROOT, 'public', p);
  const ext = path.extname(p).toLowerCase();
  if (fs.existsSync(diskPath)) {
    valid.push(p);
  } else {
    // Only report model files as broken (skip texture/mtl for now)
    broken.push(p);
  }
}

console.log(`── BROKEN PREFAB PATHS (file missing on disk) ──`);
const brokenModels = broken.filter(p => MODEL_EXTS.has(path.extname(p).toLowerCase()));
const brokenOther = broken.filter(p => !MODEL_EXTS.has(path.extname(p).toLowerCase()));
if (brokenModels.length === 0) {
  console.log('  ✅ All model paths exist on disk!');
} else {
  console.log(`  ❌ ${brokenModels.length} model files missing:`);
  brokenModels.forEach(p => console.log(`     ${p}`));
}
if (brokenOther.length > 0) {
  console.log(`\n  ⚠️  ${brokenOther.length} texture/mtl/other files missing:`);
  brokenOther.forEach(p => console.log(`     ${p}`));
}

// ── 3. Walk disk for all model files ────────────────────────────
function walkDir(dir, exts) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full, exts));
    } else if (exts.has(path.extname(entry.name).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

const allModelFiles = walkDir(ASSETS_DIR, MODEL_EXTS);
// Convert to prefab-style paths (forward slash, relative to public/)
const diskModelPaths = new Set(
  allModelFiles.map(f => '/' + path.relative(path.join(ROOT, 'public'), f).replace(/\\/g, '/'))
);

// ── 4. Unreferenced files on disk ────────────────────────────────
const unreferenced = [...diskModelPaths].filter(p => !prefabPaths.has(p));
console.log(`\n── UNREFERENCED MODEL FILES (on disk, no prefab) ──`);
console.log(`  Total model files on disk: ${diskModelPaths.size}`);
console.log(`  Referenced by prefabs: ${[...diskModelPaths].filter(p => prefabPaths.has(p)).length}`);
console.log(`  Unreferenced: ${unreferenced.length}`);

// Group unreferenced by directory
const byDir = {};
for (const p of unreferenced) {
  const dir = path.dirname(p);
  if (!byDir[dir]) byDir[dir] = [];
  byDir[dir].push(path.basename(p));
}
for (const [dir, files] of Object.entries(byDir).sort()) {
  console.log(`\n  ${dir}/ (${files.length} files)`);
  // Only show first 10 per dir to keep output manageable
  files.slice(0, 10).forEach(f => console.log(`    - ${f}`));
  if (files.length > 10) console.log(`    ... and ${files.length - 10} more`);
}

// ── 5. GLB/GLTF coverage check ──────────────────────────────────
console.log(`\n── FORMAT COVERAGE ──`);
const prefabModelPaths = [...prefabPaths].filter(p => MODEL_EXTS.has(path.extname(p).toLowerCase()));
const byFormat = { obj: [], fbx: [], glb: [], gltf: [] };
for (const p of prefabModelPaths) {
  const ext = path.extname(p).toLowerCase().slice(1);
  if (byFormat[ext]) byFormat[ext].push(p);
}
console.log(`  Prefab model references by format:`);
console.log(`    OBJ:  ${byFormat.obj.length}`);
console.log(`    FBX:  ${byFormat.fbx.length}`);
console.log(`    GLB:  ${byFormat.glb.length}`);
console.log(`    GLTF: ${byFormat.gltf.length}`);

// Check which OBJ/FBX have GLB equivalents on disk
const needConversion = [];
for (const p of [...byFormat.obj, ...byFormat.fbx]) {
  const base = p.replace(/\.(obj|fbx)$/i, '');
  const hasGlb = diskModelPaths.has(base + '.glb') || diskModelPaths.has(base + '.GLB');
  const hasGltf = diskModelPaths.has(base + '.gltf') || diskModelPaths.has(base + '.GLTF');
  if (!hasGlb && !hasGltf) {
    needConversion.push(p);
  }
}
console.log(`\n  OBJ/FBX models WITHOUT a GLB/GLTF equivalent on disk: ${needConversion.length}`);
if (needConversion.length > 0 && needConversion.length <= 50) {
  needConversion.forEach(p => console.log(`    ${p}`));
} else if (needConversion.length > 50) {
  needConversion.slice(0, 30).forEach(p => console.log(`    ${p}`));
  console.log(`    ... and ${needConversion.length - 30} more`);
}

// ── 6. Summary ───────────────────────────────────────────────────
console.log(`\n═══ SUMMARY ═══`);
console.log(`  Prefab paths extracted:      ${prefabPaths.size}`);
console.log(`  Model files on disk:         ${diskModelPaths.size}`);
console.log(`  Broken model prefab paths:   ${brokenModels.length}`);
console.log(`  Broken texture/mtl paths:    ${brokenOther.length}`);
console.log(`  Unreferenced disk models:    ${unreferenced.length}`);
console.log(`  Need GLB conversion:         ${needConversion.length}`);
console.log(`  Already GLB/GLTF:            ${byFormat.glb.length + byFormat.gltf.length}`);
console.log('');
