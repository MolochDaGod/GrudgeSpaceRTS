# Gruda Armada — Solar System Scrim RTS

A real-time strategy game set in space. Build fleets, capture planets, train commanders, and dominate the sector.

**Live:** [grudge-space-rts.vercel.app](https://grudge-space-rts.vercel.app)  
**Admin:** [grudge-space-rts.vercel.app/admin.html](https://grudge-space-rts.vercel.app/admin.html)  
**By:** Racalvin The Pirate King · Grudge Studio

## Quick Start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run validate   # tsc --noEmit + vite build
```

## Game Overview

### Win Conditions
- **Elimination** — Destroy all enemy ships and stations
- **Domination** — Own 70%+ of planets for 60 continuous seconds

### Controls
| Key | Action |
|-----|--------|
| WASD / Arrows | Pan camera |
| Q / E | Orbit camera |
| Scroll | Zoom (12–2400 range) |
| LMB | Select / Box-select |
| RMB | Move / Attack enemy |
| G | Attack-move (sticky toggle) |
| H | Hold position |
| P | Patrol (click destination) |
| M | Star Map overlay |
| L | Captain's Log overlay |
| W / R | Ship abilities |
| F9 | Rig Debug overlay (selected ships) |
| Ctrl+1-9 | Assign control group |
| 1-9 | Recall control group |
| Double-click | Select all of same type |

### Game Flow
1. **Commander Select** — Choose starting spec (Forge/Tide/Prism/Vortex/Void)
2. **Home World** — Pyramid Ship flagship + 3 workers auto-mining
3. **Build** — Click station or Enter Ship → Hangar to queue ships
4. **Expand** — Send ships to neutral planets, defeat boss captain + pirate escorts
5. **Research** — Tech trees unlock per planet biome type
6. **Dominate** — Capture 70%+ or eliminate all enemies

### Ship Types
- **50+ buildable ships** across 5 tiers (T1 scouts → T5 dreadnoughts)
- **6 hero ships** requiring commanders (permadeath on dreadnought loss)
- **6 pirate types** — neutral roaming fleets patrolling between planets
- **3 boss captains** — Skull Dreadlord, Corsair Warlord, Claw Overlord guard neutral planets
- **4 ship roles** — Repair, Void Caster, Juggernaut, Star Splitter

### AI System
The AI is a player, not a cheat engine. Same ships, costs, cooldowns, income.
Difficulty (D1–D5) only controls decision quality:
- D1: Random composition, no tech, wanders
- D3: Good composition, flanking, workers, mid tech
- D5: Perfect composition, economy focus, strafe micro, void powers

## Architecture

```
src/
├── game/
│   ├── space-engine.ts        — Game logic, combat, capture, resources
│   ├── space-renderer.ts      — Three.js 3D rendering, ship models, effects
│   ├── space-controls.ts      — Camera, selection, commands, hotkeys
│   ├── space-ui.tsx           — React HUD, panels, floating damage, alerts
│   ├── space-types.ts         — All type definitions, ship stats, constants
│   ├── space-config.ts        — Ship definitions, hero configs, faction heroes
│   ├── space-ai.ts            — 5-level AI brain (build/tactics/tech/micro)
│   ├── space-techtree.ts      — Tech trees, void powers, turret defs
│   ├── space-prefabs.ts       — 3D model paths, prefab configs (all registries)
│   ├── space-voxel-builder.ts — Procedural voxel ships + sprite-to-voxel converter
│   ├── space-audio.ts         — Web Audio manager (SFX pool, looping music, volume)
│   ├── space-effects.ts       — Sprite explosions, hit FX, shooting FX, bomb effects
│   ├── space-animations.ts    — Ship animation state machine
│   ├── space-rig.ts           — Rig profile inference (muzzle + booster anchors)
│   ├── space-starmap.tsx      — Tactical star map overlay
│   ├── model-loader.ts        — Centralized 3D model loading (GLB/FBX/OBJ + DRACO)
│   ├── asset-loader.ts        — CDN resolution, WebP detection, batch loading
│   ├── asset-registry.ts      — Central asset catalog with object storage UUIDs
│   ├── ground-renderer.ts     — On-planet ground combat renderer (souls-like)
│   ├── ground-combat.ts       — Ground combat engine (6 classes, combos, waves)
│   ├── ground-rts-engine.ts   — Ground RTS micro-wars engine
│   ├── ground-rts-3d-renderer.ts — Ground RTS 3D renderer (Advance Wars models)
│   ├── captains-log-ui.tsx    — Campaign Captain's Log overlay
│   ├── flagship-interior.tsx  — 2D pixel-art flagship interior
│   ├── ship-editor.tsx        — Ship Forge voxel editor
│   ├── ship-codex-3d.tsx      — 3D ship showcase scene for codex
│   └── ship-storage.ts        — Hero ship save/load (backend + IndexedDB)
├── admin/
│   ├── AdminApp.tsx           — Admin panel (ships/dashboard/players/balance/config/tools)
│   ├── api.ts                 — Admin API client (JWT auth, all endpoints)
│   └── main.tsx               — Admin entry point
├── App.tsx                    — Main menu, codex, loading, game screen
scripts/
├── convert-to-glb.mjs         — GLTF unification pipeline (OBJ/FBX → GLB)
├── migrate-prefabs.mjs        — Post-conversion prefab path rewriter
├── compress-assets.mjs        — Asset optimization (PNG→WebP, remove junk)
├── size-config.json           — Category→target-size mapping for normalization
└── upload-assets-r2.mjs       — Cloudflare R2 asset uploader
```

## Assets

~2700 files across space and ground modes. Large PNGs converted to WebP (q95, visually lossless).

| Category | Count | Format |
|----------|-------|--------|
| UI Icons (skill, space, item, mining, resource) | 250 | PNG/WebP |
| Avatars & Portraits (commanders, cyber) | 102 | PNG |
| HUD Elements (scifi-gui, buttons, bars) | 151 | PNG |
| Bomb Sprites & Effects (4 tiers × 3 variants) | 68 | PNG |
| Ship Sprites (pirate + boss) | 440+ | PNG |
| Explosion/Hit/Shooting Sheets | 135 | PNG |
| Backgrounds | 12 | PNG |
| Space Ship Models | 100+ | OBJ/FBX/GLB |
| Ground Characters & Enemies | 20+ | FBX/GLTF |
| Ground Weapons (guns, shields, melee) | 30+ | FBX |
| Ground Terrain Props (portals, relics, treasure) | 15+ | OBJ |
| RTS Buildings (barracks, turrets, power plants) | 15+ | FBX |
| Sci-Fi Env Kit (walls, floors, pillars, doors) | 12+ | FBX |
| Low-Poly Fleet (carriers, fighters, astronauts) | 30 | FBX |
| Terrain Environments (alien city, mars, homeworld) | 3 | GLTF |
| Effect Models (crystals, books, particles) | 24 | GLB |
| Spaceliner Tileset (flagship interior) | 30+ | PNG |
| Music (battle, menu, main, exploration, story) | 8 | MP3/WAV |
| SFX (weapons, death, alerts, UI, alien) | 19 | WAV/MP3 |

### Asset Pipeline

All models are being unified to GLB format via the conversion pipeline:

```bash
npm run glb:dry           # preview what will be converted
npm run glb:convert       # convert all OBJ/FBX → GLB (skip Draco)
npm run glb:convert:full  # convert + Draco compression
```

Pipeline handles: OBJ→GLB (obj2gltf), FBX→GLB (fbx2gltf), size normalization per category, Draco mesh compression, and manifest generation.

## Deployment

### Vercel (frontend)
Push to `master` → auto-deploys to `grudge-space-rts.vercel.app`

### Coolify / VPS (Docker)
```bash
docker compose up -d
```
- `Dockerfile` — Multi-stage Node 20 Alpine → nginx
- `docker-compose.yml` — Traefik labels for `grudge-rts.grudge-studio.com`
- `nginx.conf` — SPA fallback, gzip, GLB MIME, cache control

### Environment Variables
| Var | Default | Description |
|-----|---------|-------------|
| `VITE_GRUDGE_API` | *(empty)* | Grudge backend URL for hero ship storage |

## Admin Panel

Access at `/admin.html` — opens directly when no backend is configured; requires OAuth (Discord/Google/GitHub) when `VITE_GRUDGE_API` is set.

- **Ships** — Browse all 50+ ships from `space-config.ts` with class/tier/hero filters, stat cards, and preview images
- **Dashboard** — Server health, player counts, match stats, top commanders leaderboard (requires backend)
- **Players** — Search, edit gold/gbux, ban/unban players (requires backend)
- **Matches** — Match history with winner, duration, mode (requires backend)
- **Balance** — Remote stat overrides on top of local ship definitions (requires backend)
- **Config** — Game constants: capture time, domination, maintenance mode, MOTD (requires backend)
- **Tools** — Broadcast announcements, toggle maintenance, clear cache, fetch server logs (requires backend)

## Recent Changes

- **GLTF unification pipeline** — batch convert all 736 OBJ/FBX models to GLB with auto-normalization and Draco compression
- **Asset compression** — 700MB saved: PSD/Unity junk removed, PNGs→WebP q95, oversized GIFs deleted
- **Biome dressing system** — each planet type gets unique 3D props (ancient portals, relics, RTS buildings, sci-fi modules)
- **Unified model loader** — centralized GLB-primary loading with DRACO, caching, and PBR enhancement
- **Admin panel fix** — works on production without backend; OAuth gated only when API is configured
- **Ground combat** — 6 character classes, combo system, planet-specific wave compositions, souls-like mechanics
- **Ground RTS mode** — Advance Wars-inspired micro battles with 3D unit rendering
- **50+ new prefab registries** — ancient props, enemies, guns, shields, sci-fi env kit, RTS buildings all registered
- **Expanded terrain environments** — 9 of 10 planet types now get GLTF base environments
- **Rig profile system** — per-ship nose/side/tail/booster inference from prefab anchor points
- **Energy shield shader** — hex grid + fresnel rim + team color + hit flash
- **Audio system** — 8 music tracks + 19 SFX via Web Audio API with pooled channels
- **Sprite-to-voxel converter** — pirates and bosses auto-converted to 3D voxel models
- **Ship Forge** — voxel editor with prefab part placement, GLB export + account storage
- **3D Ship Codex** — cinematic showcase scene with fly-in animation and team tinting
- Pirate ships (6 types), boss captains (3 types), floating damage numbers
- Attack-move, patrol, control groups, pre-game commander selection
- Flagship interior with 4 rooms linking to all game systems
