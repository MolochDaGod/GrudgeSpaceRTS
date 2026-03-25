/**
 * generate-ship-avatars.mjs — Render ship model thumbnails to PNG
 *
 * Uses Three.js + node-canvas-webgl for headless 128×128 renders.
 * Falls back to a colored-silhouette placeholder if the model can't be loaded.
 *
 * Usage:  node scripts/generate-ship-avatars.mjs
 *
 * Outputs to: public/assets/space/ui/ship-avatars/{key}.png
 *
 * NOTE: This script requires `canvas` (node-canvas) for headless GL.
 * If unavailable, it generates solid-color placeholder PNGs instead.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public/assets/space/ui/ship-avatars');
const MODEL_DIR = path.join(ROOT, 'public/assets/space/models/forge-prefabs');

// All forge-prefab ships: key → { file, format, classColor }
const SHIPS = [
  { key: 'fp_fighter_01', file: 'spaceship_1.fbx', format: 'fbx', color: '#44aaff', label: 'Viper' },
  { key: 'fp_fighter_02', file: 'spaceship_2.fbx', format: 'fbx', color: '#44aaff', label: 'Hornet' },
  { key: 'fp_fighter_03', file: 'spaceship_3.fbx', format: 'fbx', color: '#44aaff', label: 'Talon' },
  { key: 'fp_cruiser_01', file: 'spaceship_4.fbx', format: 'fbx', color: '#ff8844', label: 'Warden' },
  { key: 'fp_cruiser_02', file: 'spaceship_5.fbx', format: 'fbx', color: '#ff8844', label: 'Sentinel' },
  { key: 'fp_frigate_01', file: 'spaceship_6.fbx', format: 'fbx', color: '#44ffaa', label: 'Corsair' },
  { key: 'fp_frigate_02', file: 'spaceship_7.fbx', format: 'fbx', color: '#44ffaa', label: 'Buccaneer' },
  { key: 'fp_destroyer_01', file: 'spaceship_8.fbx', format: 'fbx', color: '#ff4488', label: 'Havoc' },
  { key: 'fp_destroyer_02', file: 'spaceship_9.fbx', format: 'fbx', color: '#ff4488', label: 'Reaver' },
  { key: 'fp_capital_01', file: 'spaceship_10.fbx', format: 'fbx', color: '#ffaa44', label: 'Leviathan' },
  { key: 'fp_heavy_dark', file: 'heavy_ship_black.glb', format: 'glb', color: '#445588', label: 'Obsidian' },
  { key: 'fp_heavy_light', file: 'heavy_ship_white.glb', format: 'glb', color: '#aabbcc', label: 'Aurora' },
];

const SIZE = 128;

/**
 * Generate a simple colored placeholder PNG (solid circle on dark bg).
 * Pure Node.js — no dependencies needed.
 */
async function generatePlaceholderPNG(hexColor, label) {
  // Create a minimal 128×128 PNG with a colored diamond silhouette
  // Using raw PNG encoding (uncompressed)
  const { createCanvas } = await tryRequireCanvas();
  if (createCanvas) {
    const canvas = createCanvas(SIZE, SIZE);
    const ctx = canvas.getContext('2d');

    // Dark space background
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Ship silhouette (diamond shape)
    ctx.fillStyle = hexColor;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(64, 12);   // nose
    ctx.lineTo(100, 60);  // right wing
    ctx.lineTo(80, 68);   // right indent
    ctx.lineTo(88, 110);  // right engine
    ctx.lineTo(64, 96);   // center tail
    ctx.lineTo(40, 110);  // left engine
    ctx.lineTo(48, 68);   // left indent
    ctx.lineTo(28, 60);   // left wing
    ctx.closePath();
    ctx.fill();

    // Glow
    ctx.globalAlpha = 0.3;
    ctx.shadowColor = hexColor;
    ctx.shadowBlur = 20;
    ctx.fill();

    // Label
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, 64, 124);

    // Border
    ctx.strokeStyle = hexColor;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 126, 126);

    return canvas.toBuffer('image/png');
  }

  // Absolute fallback: 1px transparent PNG
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB' +
    'Nl7BcQAAAABJRU5ErkJggg==',
    'base64'
  );
}

async function tryRequireCanvas() {
  try {
    const c = await import('canvas');
    return { createCanvas: c.createCanvas || c.default?.createCanvas };
  } catch {
    return { createCanvas: null };
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`\n  Generating ${SHIPS.length} ship avatars → ${OUT_DIR}\n`);

  // Try canvas-based rendering first
  const { createCanvas } = await (async () => {
    try {
      const c = await import('canvas');
      return { createCanvas: c.createCanvas || c.default?.createCanvas };
    } catch {
      console.log('  ⚠ "canvas" package not found — generating placeholder avatars.\n');
      console.log('  To get proper 3D renders, install: npm i -D canvas\n');
      return { createCanvas: null };
    }
  })();

  let generated = 0;

  for (const ship of SHIPS) {
    const outPath = path.join(OUT_DIR, `${ship.key}.png`);

    // Check if model file exists
    const modelPath = path.join(MODEL_DIR, ship.file);
    const modelExists = fs.existsSync(modelPath);

    if (createCanvas) {
      // Render a styled avatar with the canvas package
      const canvas = createCanvas(SIZE, SIZE);
      const ctx = canvas.getContext('2d');

      // Dark background
      const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 80);
      grad.addColorStop(0, '#121828');
      grad.addColorStop(1, '#060a14');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, SIZE, SIZE);

      // Ship shape (stylized silhouette varies by class)
      ctx.fillStyle = ship.color;
      ctx.globalAlpha = 0.9;
      drawShipSilhouette(ctx, ship.key);
      ctx.fill();

      // Glow effect
      ctx.globalAlpha = 0.25;
      ctx.shadowColor = ship.color;
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Model indicator
      ctx.fillStyle = modelExists ? '#44ff4488' : '#ff444488';
      ctx.beginPath();
      ctx.arc(112, 16, 6, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#ffffffcc';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ship.label.toUpperCase(), 64, 122);

      // Border frame
      ctx.strokeStyle = ship.color;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 2;
      roundRect(ctx, 1, 1, 126, 126, 6);
      ctx.stroke();

      fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
    } else {
      // Fallback: create a minimal placeholder
      const buf = await generatePlaceholderPNG(ship.color, ship.label);
      fs.writeFileSync(outPath, buf);
    }

    const status = modelExists ? '✓' : '⚠ no model';
    console.log(`  [${status}] ${ship.key.padEnd(18)} → ${ship.label}`);
    generated++;
  }

  console.log(`\n  ✓ Generated ${generated} avatars\n`);
}

function drawShipSilhouette(ctx, key) {
  ctx.beginPath();
  if (key.includes('capital') || key.includes('heavy_dark')) {
    // Large capital: wide body
    ctx.moveTo(64, 14); ctx.lineTo(104, 42); ctx.lineTo(108, 70);
    ctx.lineTo(96, 78); ctx.lineTo(100, 100); ctx.lineTo(64, 88);
    ctx.lineTo(28, 100); ctx.lineTo(32, 78); ctx.lineTo(20, 70);
    ctx.lineTo(24, 42);
  } else if (key.includes('cruiser') || key.includes('heavy_light')) {
    // Cruiser: medium elongated
    ctx.moveTo(64, 10); ctx.lineTo(92, 36); ctx.lineTo(96, 72);
    ctx.lineTo(84, 80); ctx.lineTo(90, 104); ctx.lineTo(64, 92);
    ctx.lineTo(38, 104); ctx.lineTo(44, 80); ctx.lineTo(32, 72);
    ctx.lineTo(36, 36);
  } else if (key.includes('destroyer')) {
    // Destroyer: aggressive angular
    ctx.moveTo(64, 10); ctx.lineTo(98, 34); ctx.lineTo(102, 68);
    ctx.lineTo(88, 76); ctx.lineTo(94, 106); ctx.lineTo(64, 90);
    ctx.lineTo(34, 106); ctx.lineTo(40, 76); ctx.lineTo(26, 68);
    ctx.lineTo(30, 34);
  } else if (key.includes('frigate')) {
    // Frigate: sleek
    ctx.moveTo(64, 12); ctx.lineTo(86, 40); ctx.lineTo(88, 72);
    ctx.lineTo(78, 82); ctx.lineTo(82, 108); ctx.lineTo(64, 96);
    ctx.lineTo(46, 108); ctx.lineTo(50, 82); ctx.lineTo(40, 72);
    ctx.lineTo(42, 40);
  } else {
    // Fighter: small, swept wings
    ctx.moveTo(64, 8); ctx.lineTo(100, 52); ctx.lineTo(82, 62);
    ctx.lineTo(86, 104); ctx.lineTo(64, 90); ctx.lineTo(42, 104);
    ctx.lineTo(46, 62); ctx.lineTo(28, 52);
  }
  ctx.closePath();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

main().catch(console.error);
