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

## Ship Abilities & Skills

### Ability Types (16 total)
Each ability has a painted PNG icon from `scifi-gui/skills/` and an SVG fallback.

**Combat Abilities**
| ID | Name | Key | Icon | Description |
|---|---|---|---|---|
| barrel_roll | Barrel Roll | Q | skills/3.png | Evasive spin, brief invulnerability |
| speed_boost | Afterburner | W | skills/2.png | 3s speed burst |
| cloak | Cloak | Q | skills/4.png | Invisibility until attack |
| iron_dome | Iron Dome | W | skills/13.png | AoE shield bubble |
| warp | Warp Jump | E | skills/10.png | Teleport to cursor |
| emp | EMP Blast | Q | skills/5.png | Area disable, shield damage |
| boarding | Board Ship | E | skills/6.png | Capture enemy ship |
| repair | Repair Pulse | W | skills/7.png | AoE heal nearby allies |
| ram | Ram Charge | Q | skills/8.png | High-speed collision damage |
| launch_fighters | Launch Fighters | R | skills/1.png | Deploy escort fighters |

**Hacking Abilities** (Scout / Stealth / Corvette only)
| ID | Name | Key | Icon | Description |
|---|---|---|---|---|
| hack_weapons | Disable Weapons | Q | skills/11.png | Channel: disables target weapons |
| hack_shields | Drop Shields | W | skills/12.png | Channel: drains target shields |
| hack_siphon | Siphon Data | E | skills/9.png | Channel: steals resources |
| hack_sensors | Blind Sensors | Q | skills/11.png | Channel: removes target vision |
| hack_sabotage | Sabotage | W | skills/12.png | Channel: random system failure |
| hack_hijack | Hijack | R | skills/9.png | Channel: take control of target |

### Ability Icon Pipeline
- Primary art: `public/assets/space/ui/scifi-gui/skills/1-13.png` (13 painted cyberpunk icons)
- Fallback art: `public/assets/space/ui/skill-icons-1/PNG/` and `skill-icons-2/PNG/`
- SVG fallback: inline React SVGs in `ABILITY_ICONS` (space-ui-shared.tsx)
- Resolution chain: ABILITY_IMG → ABILITY_IMG_FALLBACK → ABILITY_ICONS (SVG)

### Ability UI in HUD
**Single unit selected**: Full `SingleUnitInfo` with portrait, stats, and `AbilityButton` slots (64px each with cooldown sweep overlay, autocast indicator, energy cost badge).

**Multiple units selected (WC3/SC2 layout)**:
- **Left column**: Ship type group list (Tab cycles focused type)
- **Center**: Focused type portrait + aggregate HP bar + stats
- **Right**: 3×3 ability grid showing focused type's abilities with icon art, hotkey badge, cooldown sweep
- **Tab key**: Cycles focus between ship types in the selection
- **Click on group**: Isolates that type (selects only ships of that type)

### Cooldown Visualization
- Conic gradient sweep from dark to transparent based on `cooldownRemaining / cooldown`
- Remaining seconds shown in top-left of ability slot
- Active abilities get bright green border + saturated icon
- On-cooldown abilities are 50% opacity + grayscale filter

### Autocast
- Right-click ability slot to toggle autocast
- "AUTO" badge in top-left when enabled
- AI ships have all abilities set to autocast by default

## Game Systems

### Controls
- WASD / Arrow Keys → pan camera (relative to camera yaw)
- Q/E → orbit camera around look-at point
- Scroll → zoom (logarithmic)
- Left Click → select / place (editor)
- Right Click → move / attack command
- A → attack-move mode (also clickable in Command Card)
- G → attack-move cursor
- P → patrol mode
- H → defend (hold position, attack in range)
- S → stop all movement
- Tab → cycle focused ship type in multi-selection
- M → star map overlay (also via menu button bar)
- L → Captain's Journal
- I → Fleet/Planet Inventory
- K → Unified Skill Tree
- C → Commander Character Panel
- Ctrl+1-9 → assign control group, 1-9 recall

### AI Difficulty (Quick Game)
Selectable in Commander Select modal before launch:
- **Passive (D1)**: Random builds, no tech, wanders aimlessly
- **Basic (D2)**: Cheap fighters, basic expansion, some tech
- **Balanced (D3)**: Good composition, flanking, workers, mid tech (default)
- **Aggressive (D4)**: Multi-front attacks, void powers, strafe micro
- **Optimal (D5)**: Perfect economy, full tech tree, strafe + retreat micro

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
