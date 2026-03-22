import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const dirs = [
  'public/assets/space/models/ships',
  'public/assets/space/models/capital',
  'public/assets/space/models/battle-ships',
  'public/assets/space/models/enemies',
  'public/assets/space/models/new-ships',
  'public/assets/space/models/turrets',
  'public/assets/space/models/stations',
  'public/assets/space/models/vehicles',
  'public/assets/space/models/voxel-fleet',
  'public/assets/space/models/weapons',
  'public/assets/space/models/effects',
  'public/assets/space/models/planets',
];

const colors = {
  ships: '#4488ff', capital: '#ffaa22', 'battle-ships': '#ff8844',
  enemies: '#ff4444', 'new-ships': '#44ddcc', turrets: '#88ff44',
  stations: '#44dd88', vehicles: '#ddaa44', 'voxel-fleet': '#4488ff',
  weapons: '#ff8800', effects: '#aa66ff', planets: '#44aacc',
};

async function genPlaceholder(name, outPath, color) {
  const label = name.replace(/_/g, ' ').slice(0, 18);
  const svg = `<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
    <rect width="128" height="128" fill="#0a1020" rx="8"/>
    <rect x="4" y="4" width="120" height="120" fill="${color}22" rx="6" stroke="${color}" stroke-width="1.5"/>
    <text x="64" y="56" font-size="9" fill="${color}" text-anchor="middle" font-family="monospace" font-weight="bold">${label}</text>
    <text x="64" y="72" font-size="8" fill="#667788" text-anchor="middle" font-family="monospace">3D MODEL</text>
    <circle cx="64" cy="96" r="10" fill="none" stroke="${color}" stroke-width="1" opacity="0.4"/>
    <polygon points="60,92 60,100 68,96" fill="${color}" opacity="0.5"/>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(outPath);
}

function walk(d, cat) {
  const color = colors[cat] || '#4488ff';
  const results = [];
  if (!fs.existsSync(d)) return results;
  for (const f of fs.readdirSync(d)) {
    const fp = path.join(d, f);
    const st = fs.statSync(fp);
    if (st.isDirectory()) { results.push(...walk(fp, cat)); continue; }
    if (!/\.(fbx|obj|glb)$/i.test(f)) continue;
    const base = f.replace(/\.(fbx|obj|glb)$/i, '');
    const pngPath = path.join(path.dirname(fp), base + '.png');
    if (fs.existsSync(pngPath)) continue;
    results.push({ name: base, outPath: pngPath, color });
  }
  return results;
}

async function main() {
  let count = 0;
  for (const dir of dirs) {
    const cat = dir.split('/').pop();
    const items = walk(path.resolve(dir), cat);
    for (const { name, outPath, color } of items) {
      await genPlaceholder(name, outPath, color);
      count++;
    }
    if (items.length > 0) console.log(`  ${cat}: ${items.length} thumbnails`);
  }
  console.log(`Done — generated ${count} placeholder PNGs`);
}

main().catch(e => console.error(e));
