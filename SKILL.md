# Gruda Armada — Systems & Pipeline Reference

## Model Pipeline

### Supported Formats
- **GLB** (binary glTF) — preferred format for all new models and editor exports
- **FBX** — craftpix battle fleet, capital ships, turrets, weapons, enemies
- **OBJ+MTL** — voxel ships, vehicles, voxel fleet

### Auto-Scale System
All models are automatically scaled to match their ship class size when loaded.
The system works as follows:

1. `loadModel()` in `space-renderer.ts` loads the raw model (FBX/OBJ/GLB) without applying any scale
2. `autoFit()` measures the model's bounding box and scales it to match `shipClassSize()`:
   - Dreadnought: 24 units
   - Battleship: 21
   - Carrier: 18
   - Cruiser: 16.5
   - Light Cruiser: 15
   - Destroyer: 13.5
   - Frigate: 12
   - Corvette: 10.5
   - Worker: 7.5
   - Fighter/Scout/etc: 9

This means **prefab.scale is ignored for ship sizing** — the autoFit handles it.
The `prefab.scale` field is kept for backward compatibility but has no effect.

### Converting FBX/OBJ to GLB
Run `node scripts/convert-models.mjs` to see the full list of models and conversion instructions.

Options:
- **Blender CLI**: `blender --background --python convert.py -- input.fbx output.glb`
- **fbx2gltf** (Meta): `fbx2gltf --input input.fbx --output output.glb`
- **gltf-transform**: `npx gltf-transform copy input.obj output.glb`

After converting, update `space-prefabs.ts`:
- Change `format: 'fbx'` → `format: 'glb'`
- Change `.fbx`/`.obj` extensions to `.glb` in `modelPath`
- Remove `mtlPath` (textures are embedded in GLB)

### Ship Forge Editor
Players design a custom hero ship in a 32×16×32 voxel grid.

- Tool: `src/game/ship-editor.tsx`
- Voxel types: Hull (1), Armor (2), Engine (3), Weapon (4), Cockpit (5)
- Export: GLB via Three.js `GLTFExporter`
- Storage: `src/game/ship-storage.ts` — saves to Grudge backend (`VITE_GRUDGE_API`) with IndexedDB fallback
- One ship per account, used in-game as `custom_hero` type
- Keyboard: Q/E/R tools, 1-5 blocks, X mirror, Ctrl+Z undo

## UI Asset Usage

### HUD Pack (`/assets/space/ui/hud/`)
- `BgHudBar.png` → top resource bar background
- `DarkBackground.png` → bottom panel background
- `CloseBtn.png` → close buttons on tech tree / commander panels
- `Normal_Btn.png` / `Hover_Btn.png` → command action buttons, game over button
- `Box_Item.png` → build ship slot frames
- `Victory_Badges.png` / `GameOver_Badges.png` → win/loss screen art
- `Ability01-25.png` → ability icons (codex references)

### Sci-Fi GUI Pack (`/assets/space/ui/scifi-gui/`)
- `skills/1-13.png` → ability button art (barrel_roll, speed_boost, cloak, etc.)
- `avatars/1-6.png` → commander portraits
- `elements/1-3.png` → panel frame sprites (available for future use)
- `inventory/1-3.png` → inventory slot frames (available for future use)
- `items/1-9.png` → item/upgrade icons (available for future use)

### Icon Packs
- `icons/1-20.png` → weapon/attack type icons (laser, missile, railgun, pulse, torpedo + commands)
- `resource-icons/Icon39_01-40.png` → resource type icons (01=credits, 02=energy, 03=minerals used; 04-40 available)
- `commanders/1-20.png` → commander portrait sprites (20 pixel-art sci-fi faces)

## Game Systems

### Controls
- WASD / Arrow Keys → pan camera (relative to camera yaw)
- Q/E → orbit camera around look-at point
- Scroll → zoom (logarithmic)
- Left Click → select / place (editor)
- Right Click → move / attack command
- A → attack-move mode
- H → defend (hold position, attack in range)
- M → star map overlay
- Ctrl+1-9 → assign control group, 1-9 recall

### Ship Spawning Flow
1. `space-engine.ts` `spawnShip()` creates entity with stats from `getShipDef()`
2. `space-renderer.ts` `syncShips()` creates cone placeholder
3. `getShipPrefab()` checks all prefab dictionaries
4. `loadModel()` loads FBX/OBJ/GLB asynchronously
5. `autoFit()` scales model to ship class target size
6. Cone placeholder is replaced with loaded model

### Mining Flow
1. Worker enters `idle` → finds nearest available resource node
2. `traveling` → moves to node
3. `harvesting` → stays in place, laser beam drawn to node, cargo bar fills
4. Node shrinks during harvest, goes transparent on cooldown
5. `returning` → heads to home station
6. Deposits resources, returns to `idle`

### Deployment
- Dockerfile: multi-stage (Node 20 build → nginx:alpine serve)
- docker-compose.yml: Traefik labels for Coolify at `grudge-rts.grudge-studio.com`
- Build arg: `VITE_GRUDGE_API` (defaults to `https://api.grudge-studio.com`)
- Set CNAME in Cloudflare pointing to VPS IP

## Validation
```bash
npm run check     # TypeScript only
npm run validate  # TypeScript + Vite production build
npm run dev       # Local dev server
```
