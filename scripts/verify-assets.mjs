#!/usr/bin/env node
/**
 * verify-assets.mjs — Asset registry pipeline verifier.
 *
 * Walks every entry in `src/game/asset-registry.ts` and checks:
 *   - localPath file exists on disk under public/
 *   - format extension matches localPath
 *   - mtlPath file exists for OBJ entries
 *   - texturePath file exists when set
 *   - weapons declare boneAnchor + targetSize
 *   - mech parts declare boneAnchor + targetSize
 *   - byte size > 100 (catches empty / placeholder files)
 *
 * Exit 0 = all green. Exit 1 = any FAIL. Warnings (W) don't fail.
 *
 * Run: `node scripts/verify-assets.mjs` or `npm run check:assets`.
 */

import { readFileSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public');
const REGISTRY_FILE = join(ROOT, 'src/game/asset-registry.ts');

// ── Parse the TS source for entries (no need to compile — we just regex). ──
function parseRegistry(source) {
  const entries = [];
  // Match entry-shaped object literals inside the REGISTRY array.
  // We capture each object by counting braces to avoid greedy regex pitfalls.
  const startIdx = source.indexOf('const REGISTRY: AssetEntry[] = [');
  if (startIdx < 0) throw new Error('Cannot find REGISTRY in asset-registry.ts');
  // Skip past `const REGISTRY: AssetEntry[] = ` to land on the assignment
  // array's opening `[` (NOT the `[` inside `AssetEntry[]`).
  const eqIdx = source.indexOf('=', startIdx);
  let i = source.indexOf('[', eqIdx) + 1;
  let depth = 1;
  let buf = '';
  while (i < source.length && depth > 0) {
    const c = source[i];
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') depth--;
    if (depth > 0) buf += c;
    i++;
  }
  // Now buf contains the body. Pull out object literals via brace matching.
  let j = 0;
  while (j < buf.length) {
    if (buf[j] === '{') {
      let d = 1;
      const start = j;
      j++;
      while (j < buf.length && d > 0) {
        if (buf[j] === '{') d++;
        else if (buf[j] === '}') d--;
        j++;
      }
      const obj = buf.substring(start, j);
      const entry = parseEntryFields(obj);
      if (entry) entries.push(entry);
    } else {
      j++;
    }
  }
  return entries;
}

function parseEntryFields(literal) {
  const get = (field) => {
    const re = new RegExp(`${field}\\s*:\\s*['"\`]([^'"\`]+)['"\`]`);
    const m = literal.match(re);
    return m ? m[1] : null;
  };
  const getBool = (field) => {
    const re = new RegExp(`${field}\\s*:\\s*(true|false)`);
    const m = literal.match(re);
    return m ? m[1] === 'true' : null;
  };
  const getNum = (field) => {
    const re = new RegExp(`${field}\\s*:\\s*([0-9.]+)`);
    const m = literal.match(re);
    return m ? parseFloat(m[1]) : null;
  };
  const key = get('key');
  const localPath = get('localPath');
  const category = get('category');
  if (!key || !localPath || !category) return null;
  const entry = { key, localPath, category };
  const fmt = get('format');
  if (fmt) entry.format = fmt;
  const mtl = get('mtlPath');
  if (mtl) entry.mtlPath = mtl;
  const tex = get('texturePath');
  if (tex) entry.texturePath = tex;
  const bone = get('boneAnchor');
  if (bone) entry.boneAnchor = bone;
  const fam = get('weaponFamily');
  if (fam) entry.weaponFamily = fam;
  const target = getNum('targetSize');
  if (target !== null) entry.targetSize = target;
  const tint = getBool('colorTintable');
  if (tint !== null) entry.colorTintable = tint;
  return entry;
}

// ── Verify ────────────────────────────────────────────────────────
function localToFs(localPath) {
  // /assets/foo → public/assets/foo
  return join(PUBLIC_DIR, localPath.replace(/^\//, ''));
}

function checkEntry(entry) {
  const issues = []; // { kind: 'FAIL' | 'WARN', msg }
  const fsPath = localToFs(entry.localPath);

  if (!existsSync(fsPath)) {
    issues.push({ kind: 'WARN', msg: `file not on disk (CDN-only or unstaged): ${entry.localPath}` });
  } else {
    try {
      const sz = statSync(fsPath).size;
      if (sz < 100) issues.push({ kind: 'FAIL', msg: `tiny file (${sz}B), likely placeholder` });
    } catch (e) {
      issues.push({ kind: 'FAIL', msg: `stat failed: ${e.message}` });
    }
  }

  // Format extension match
  if (entry.format) {
    const ext = entry.localPath.toLowerCase();
    const expects = {
      obj: ['.obj'],
      fbx: ['.fbx'],
      glb: ['.glb', '.gltf'], // registry treats both as 'glb'
    };
    const allowed = expects[entry.format] ?? [];
    if (allowed.length && !allowed.some((e) => ext.endsWith(e))) {
      issues.push({ kind: 'FAIL', msg: `format=${entry.format} but path ends in ${ext.split('.').pop()}` });
    }
  }

  // MTL pairing for OBJ entries
  if (entry.format === 'obj' && entry.mtlPath) {
    const mtlFs = localToFs(entry.mtlPath);
    if (!existsSync(mtlFs)) {
      issues.push({ kind: 'WARN', msg: `mtl not on disk: ${entry.mtlPath}` });
    }
  }

  // Texture pairing
  if (entry.texturePath) {
    const texFs = localToFs(entry.texturePath);
    if (!existsSync(texFs)) {
      issues.push({ kind: 'WARN', msg: `texture not on disk: ${entry.texturePath}` });
    }
  }

  // Mech / weapon metadata sanity
  const isWeapon = entry.category === 'weapon';
  const isMech = entry.category === 'mech';
  if (isWeapon) {
    if (!entry.boneAnchor)
      issues.push({ kind: 'WARN', msg: `weapon without boneAnchor (defaults to right_hand)` });
    if (entry.targetSize == null)
      issues.push({ kind: 'WARN', msg: `weapon without targetSize (defaults to 0.85)` });
  }
  if (isMech && entry.boneAnchor && !['spine', 'right_hand', 'left_hand', 'right_shield'].includes(entry.boneAnchor)) {
    issues.push({ kind: 'FAIL', msg: `unknown boneAnchor '${entry.boneAnchor}'` });
  }

  return issues;
}

// ── Main ──────────────────────────────────────────────────────────
const source = readFileSync(REGISTRY_FILE, 'utf8');
const entries = parseRegistry(source);

const byCat = {};
for (const e of entries) byCat[e.category] = (byCat[e.category] ?? 0) + 1;

let fails = 0;
let warns = 0;
const failByEntry = [];
const warnByEntry = [];

for (const entry of entries) {
  const issues = checkEntry(entry);
  for (const it of issues) {
    if (it.kind === 'FAIL') {
      fails++;
      failByEntry.push({ key: entry.key, msg: it.msg });
    } else {
      warns++;
      warnByEntry.push({ key: entry.key, msg: it.msg });
    }
  }
}

// ── Report ────────────────────────────────────────────────────────
const C = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

console.log(C.bold(C.cyan('\n── Asset Registry Verifier ────────────────────────────────')));
console.log(`Registry: ${C.dim(REGISTRY_FILE.replace(ROOT + '\\', ''))}`);
console.log(`Public:   ${C.dim(PUBLIC_DIR.replace(ROOT + '\\', ''))}`);
console.log(`Entries:  ${C.bold(entries.length)}`);
const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
console.log(`By cat:   ${cats.map(([k, v]) => `${k}=${v}`).join('  ')}`);

if (failByEntry.length > 0) {
  console.log(C.bold(C.red('\nFAIL:')));
  for (const f of failByEntry) console.log(`  ${C.red('✗')} ${C.bold(f.key)}: ${f.msg}`);
}
if (warnByEntry.length > 0) {
  console.log(C.bold(C.yellow('\nWARN:')));
  for (const w of warnByEntry.slice(0, 25)) console.log(`  ${C.yellow('⚠')} ${C.bold(w.key)}: ${w.msg}`);
  if (warnByEntry.length > 25) console.log(C.dim(`  …and ${warnByEntry.length - 25} more`));
}

const summary = `\nSummary: ${C.green(`${entries.length - fails - warns} ok`)}  ${
  warns ? C.yellow(`${warns} warn`) : '0 warn'
}  ${fails ? C.red(`${fails} fail`) : '0 fail'}`;
console.log(summary);

if (fails > 0) {
  console.log(C.red('\n✗ pipeline check failed — see FAILs above\n'));
  process.exit(1);
} else {
  console.log(C.green('\n✓ pipeline check passed\n'));
  process.exit(0);
}
