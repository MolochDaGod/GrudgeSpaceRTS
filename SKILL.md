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

### AI System (`space-ai.ts`)

#### Core Principle
The AI is a player, not a cheat engine. It uses the **exact same** ship stats, cooldowns, costs, and resource rates as the human. The only difference is **decision quality** — what it builds, where it attacks, and how it micro-manages combat. Build poll rates are identical (2s) across all difficulties; the queue + resource cost is the real limiter.

#### Difficulty Levels
Selectable in Commander Select modal before quick game launch. Campaign AI auto-scales with conquest progress (0-20% = D1, 20-40% = D2, etc.).

**D1 — Passive**
- Composition: Single cheap units (red_fighter, micro_recon)
- Tactics: Random wander, sends 1-4 ships at random planets
- Tech: None (techCycleTime = 999s, effectively disabled)
- Workers: None
- Micro: None
- Response delay: 5s before reacting to threats
- Max tier: T2 ships only

**D2 — Basic**
- Composition: Mixed cheap (red_fighter + cf_corvette_01, dual_striker)
- Tactics: Standard expand-then-attack, single-front
- Tech: Basic forge (cannons, plating), checks every 20s
- Workers: None
- Micro: None
- Response delay: 3s
- Max tier: T2

**D3 — Tactical** (default)
- Composition: Good mixed (corvettes + frigates, warships)
- Tactics: Flanking — attacks from perpendicular angle to base-target line
- Tech: Forge + Tide (cannons, plating, siege, shields, regen), checks every 15s
- Workers: Yes — maintains 3 mining drones
- Micro: Retreat when HP < 35% (damageLevel > 0.65)
- Scouting: Dispatches scouts/interceptors to unexplored fog cells
- Response delay: 2s
- Max tier: T3

**D4 — Strategic**
- Composition: Heavy (frigates, destroyers, light cruisers, battleship)
- Tactics: Multi-front — splits fleet into expansion group + assault group when ≥6 idle ships
- Tech: Full forge + tide + command tree, checks every 10s
- Workers: Yes
- Micro: Retreat + strafe (sidestep while in attack range, alternating direction by ship ID)
- Scouting: Yes + last-seen enemy memory (probes last known center when no visible enemies)
- Void Powers: Yes — casts AoE damage on densest enemy clusters, push on threatened planets, warp fleet near enemy
- Turrets: Builds 2 turrets per owned planet (railgun preferred)
- Response delay: 1s
- Max tier: T4

**D5 — Optimal**
- Composition: Capital ships (light cruisers, destroyers, boss ships)
- Tactics: Targets highest-value enemy planet (most total resource yield), full fleet commit
- Tech: Complete priority list (13 nodes), checks every 8s
- Workers: Yes
- Micro: Full retreat + strafe
- Scouting: Hunts undiscovered POIs for resource/tech bonuses
- Void Powers: Yes + planet destruction on neutral planets
- Turrets: Yes
- Response delay: 0.5s
- Max tier: T5 (boss ships)

#### AI Brain Architecture
Each AI team gets an `AIBrain` instance (`space-ai.ts:172`) with independent timers:
- `buildTimer` — triggers `aiBuildStep()` every `buildCycleTime` seconds
- `tacticsTimer` — triggers `aiTacticsStep()` every `tacticsCycleTime` seconds
- `techTimer` — triggers `aiTechStep()` every `techCycleTime` seconds
- `scoutTimer` — triggers `aiScoutStep()` (D3+ only)
- `aiMicroStep()` — runs every frame for per-ship evasion (D3+)
- `aiVoidPowerStep()` — runs every frame for D4+ void power casting

#### Build Step
1. Count current combat ships + workers
2. D3+: maintain 3 workers minimum
3. Pick composition archetype from `COMPOSITION[difficulty]` (4 presets per level, cycles through them)
4. Try each ship in the composition, respecting tier cap and buildability
5. Fallback: walk down tier-appropriate fallback lists (T3→T2→T1)
6. Advance composition index each build cycle for variety

#### Tactics Step
1. Collect idle combat ships (no moveTarget, no targetId, no orbitTarget)
2. D4+: track visible enemy center for last-seen memory
3. D1: random wander to any planet
4. D2-3: single-front — expand to nearest neutral, then attack nearest enemy (D3 flanks)
5. D4+: split fleet — half expand to neutrals, half assault weakest enemy planet from flank angle
6. D4+: probe last-seen enemy position with remaining idle ships

#### Tech Priority
Each difficulty has a fixed research order. The AI researches the first unresearched node in its list. After exhausting the list, D4+ also builds planet turrets.

#### Void Power Targeting
- `aoe_damage` / `aoe_scatter` / `pull_damage` → cast on densest enemy cluster (≥2 ships visible in fog)
- `push` → cast on owned planet with most enemies nearby (≥2)
- `teleport_fleet` → warp near weakest enemy planet
- `destroy_planet` → D5 only, targets neutral planets

#### Campaign AI Scaling
- `createCampaignAI(team, conquestPct)` — difficulty = ceil(conquestPct / 20)
- `updateCampaignAIDifficulty(brain, conquestPct)` — recalibrate on planet capture
- Campaign AI never targets the player's homeworld (`isCampaignHomeworldProtected`)

#### Neutral Defenders
- Each neutral planet spawns 1 boss captain + pirate escorts (boss_captain_01-03, pirate_01-06)
- Boss and escorts orbit the planet with `holdPosition = true`
- Roaming pirate fleets patrol between random neutral planet pairs (2-3 pirates per fleet)
- All neutral/pirate ships have abilities set to autocast

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
**Primary (Vercel):**
- Domain: `starrts.grudge-studio.com`
- Cloudflare DNS: CNAME `starrts` → `cname.vercel-dns.com` (DNS only, gray cloud)
- `vercel.json`: Vite framework, `/privacy` + `/tos` rewrites before SPA fallback
- Build env: `VITE_GRUDGE_API`, `VITE_GRUDGE_ID_URL`, etc. set in Vercel dashboard
- Auto-deploys on push to `master`

**Backup (Docker/VPS):**
- Dockerfile: multi-stage (Node 20 build → nginx:alpine serve)
- docker-compose.yml: Traefik labels for `starrts.grudge-studio.com`
- nginx.conf: /privacy, /tos served as static HTML before SPA fallback

**Legal pages** (required for Discord app):
- `/privacy` → `public/privacy.html`
- `/tos` → `public/tos.html`

## Validation
```bash
npm run check     # TypeScript only
npm run validate  # TypeScript + Vite production build
npm run dev       # Local dev server
```
