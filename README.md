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
│   ├── space-engine.ts      — Game logic, combat, capture, resources
│   ├── space-renderer.ts    — Three.js 3D rendering, ship models, effects
│   ├── space-controls.ts    — Camera, selection, commands, hotkeys
│   ├── space-ui.tsx          — React HUD, panels, floating damage, alerts
│   ├── space-types.ts        — All type definitions, ship stats, constants
│   ├── space-ai.ts           — 5-level AI brain (build/tactics/tech/micro)
│   ├── space-techtree.ts     — Tech trees, void powers, turret defs
│   ├── space-prefabs.ts      — 3D model paths, prefab configs
│   ├── space-voxel-builder.ts — Procedural voxel ships + sprite-to-voxel converter
│   ├── space-audio.ts        — Web Audio manager (SFX pool, looping music, volume)
│   ├── space-effects.ts      — Sprite explosions, hit FX, shooting FX, bomb effects
│   ├── space-animations.ts   — Ship animation state machine
│   ├── space-rig.ts          — Rig profile inference (nose/sides/tail, muzzle + booster anchors)
│   ├── space-starmap.tsx      — Tactical star map overlay
│   ├── captains-log-ui.tsx    — Campaign Captain's Log overlay
│   ├── flagship-interior.tsx  — 2D pixel-art flagship interior
│   ├── ship-editor.tsx        — Ship Forge voxel editor
│   └── ship-storage.ts       — Hero ship save/load (backend + IndexedDB)
├── admin/
│   ├── AdminApp.tsx          — Game editor (fleet/assets/balance/config)
│   └── main.tsx              — Admin entry point
└── App.tsx                   — Main menu, codex, loading, game screen
```

## Assets (~2000 files)

| Category | Count | Format |
|----------|-------|--------|
| UI Icons (skill, space, item, mining, resource) | 250 | PNG |
| Avatars & Portraits (commanders, cyber) | 102 | PNG |
| HUD Elements (scifi-gui, buttons, bars) | 151 | PNG |
| Bomb Sprites & Effects (4 tiers × 3 variants) | 68 | PNG |
| Ship Sprites (pirate + boss) | 440+ | PNG |
| Explosion/Hit/Shooting Sheets | 135 | PNG |
| Backgrounds | 12 | PNG |
| Ship Models (OBJ/FBX/voxel) | 100+ | OBJ/FBX |
| Low-Poly Models (carriers, fighters, astronauts) | 30 | FBX |
| Effect Models | 24 | GLB |
| Spaceliner Tileset (flagship interior) | 30+ | PNG |
| Music (battle, menu, main theme) | 3 | MP3 |
| SFX (weapons, death, alerts, UI) | 14 | WAV/MP3 |

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

Access at `/admin.html` (password: `nexus2025`)

- **Fleet Registry** — Browse all ships with filters (buildable/hero/neutral), tier filtering, detailed stat cards
- **Asset Browser** — Visual thumbnail gallery of all 1925 game assets (27 image galleries + 10 model groups)
- **Balance Editor** — Edit any ship stat, apply to live game, export/import JSON presets
- **Game Config** — All game constants, starting resources, AI rules, planet biomes, upgrade costs

## Recent Changes

- **Rig profile system** — per-ship nose/side/tail/booster inference from prefab anchor points
- **Hardpoint-correct firing** — projectiles and muzzle FX now spawn from inferred muzzle anchors instead of ship center
- **Rig Debug overlay (F9)** — live gizmos for nose/tail/sides/muzzles/boosters on selected ships + console rig audits
- **HUD panel layering fix** — opaque HUD panel rendering with proper asset layering (no scene bleed-through)
- **Captain's Log UI** — campaign event log/journal overlay with category filters and progression summary
- **Audio system** — 3 looping music tracks (battle/menu/main), 13 SFX (weapons, death, alerts, build, UI), Web Audio API with pooled channels
- **Energy shield shader** — hex grid + fresnel rim + team color + hit flash on all shielded ships
- **Sprite-to-voxel converter** — pirates and bosses auto-converted to 3D voxel models from their 2D sprites
- **Engine thruster upgrade** — 3-layer glow (outer team wash, white-hot core, elongated trail)
- **Bomb effects** — 12 sprite strips wired into torpedo/missile hits, ability VFX, death explosions
- **Resource icons** — 40 pixel-art icons mapped to game resources with fallback chain in HUD
- **Commander portraits** — 20 real character portraits replacing broken placeholder frames
- **Codex UX overhaul** — responsive grid, role filter, real upgrade skill icons, tab counts, hover states
- **Low-poly space assets** — carriers, fighters, astronauts, planets ready for carrier deployment mechanic
- Pirate ships (6 types) roam between planets as neutral threats
- Boss captains (3 types) guard neutral planets with abilities
- Floating damage numbers, capture progress %, income rates, worker alerts, rally flags
- Attack-move sticky toggle, patrol loops, worker abort on enemy capture
- Pre-game commander selection modal with 5 specs
- Flagship interior with 4 rooms linking to all game systems
- Ship Forge voxel editor with GLB export + account storage
