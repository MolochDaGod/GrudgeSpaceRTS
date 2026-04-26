# StarNav × Grudge Space RTS — Roadmap
This document maps where we are and where we're going, drawing on patterns from `space-reversing/nav` (the StarNav project derived from Star Citizen reverse-engineering) and SC's domain conventions for navigation, ship piloting, and modular gameplay.
## Where we are now (✓ = shipped to `master`)
| Slice | Status | Notes |
|---|---|---|
| Engine asset registry | ✓ | 55 space + 25 mech/cockpit/ship entries, schema with `boneAnchor` + `targetSize` + `weaponFamily` |
| Mech Builder Showcase | ✓ | Three.js studio scene, equip/unequip via bone, anim cycler, OrbitControls; pre-campaign chain |
| Asset pipeline verifier | ✓ | `npm run check:assets` walks REGISTRY, reports FAIL/WARN |
| `nav/` core (StarNav port) | partial | `coord-transform`, `nav-core`, `nav-planner` (single-segment), `nav-hud`, `nav-client`, `ship-nav-control` ported; needs full bidirectional A* |
| Pilot view (`/pilot`) | reverted | First-person 6DoF cockpit was scaffolded then reverted; assets (cockpit GLB) are staged and registered |
| Server nav-server-rs sidecar | not deployed | Rust binary built; Railway service not yet provisioned |
| Cloudflare Worker (Armadawayspace) | not wired | Worker name reserved; client class exists in `nav/nav-client.ts` |
## Phase 6 — Navigation core upgrade (next)
1. **Full bidirectional A\* in `nav/nav-planner.ts`** — port the 96 KB Rust planner from `space-reversing/nav-rs/src/nav_planner.rs`. Today's planner only does single-segment + one bypass waypoint; SC-grade routing needs forward-from-origin + backward-from-destination meeting search across all OMs and QT markers.
2. **Coordinate-system unification** — replace ad-hoc coords in `space-engine.ts` planet/ship update loop with `CoordTransformer.transform()` calls. Today the planet x/y/z is in game-units; ship positions in game-units; HUD in scene-units (× WORLD_SCALE). Pick one, transform at boundaries.
3. **OM ring + jump-point gate visualisation in `space-renderer`** — extend `nav-hud.ts` with an `XZ` (ground-plane) ring orientation option, then mount it as part of the existing planet rendering so each planet shows its OM ring and grid radius in-world.
## Phase 7 — Cockpit & pilot mode
1. **Restore `/pilot` route + PilotView/PilotRenderer** with the cockpit GLB now registered (`cockpit_seat`).
2. **MFD route nav** — render the active `NavPlan` as a polyline on the left side panel of the canopy, with distance + ETA per leg. Mirrors SC's MFD nav target panel.
3. **Quantum drive timing** — charge bar (5 s default), engage key bursts velocity to `QUANTUM_SPEED`, drops out within target's `gridRadius`. Use `spawnQuantumJump` VFX at engage + arrival.
4. **Cockpit asset swap** — load `cockpit_seat` GLB into the canopy. The procedural rim becomes the fallback when the GLB is missing.
## Phase 8 — Mech ground gameplay
1. **Mech ground combat scene** — re-use `mech-builder-renderer`'s mech body + animation but place it in `ground-renderer`'s tile world. Player commands the mech instead of the ground character class.
2. **Animation pack assignment via `weaponFamily`** — when player equips `mech_wpn_sword` (`weaponFamily: 'sword'`), the controller loads `anim_sword_*` clips. Same for hammer (`greatsword`) and guns (`rifle`).
3. **Mech physics** — add Cannon-ES (or Rapier3D) to the mech ground scene: a capsule body, ground-collision raycaster for terrain following, jump impulse from `Attach_Back_JetPack_00` equip state, missile fire from `Attach_Back_Missiles_*`.
4. **Mech in `pilot-renderer`** — third option for pilot view: walk a mech around a planet surface (low-orbit drop, then ground combat).
## Phase 9 — Multi-system + jump points
1. **Solar system data registry** — extend `nav/types.ts` `NavContainer` with `system: string` and add a `containerSystem: Record<string, NavContainer[]>` index. Today everything is in `'armada'` — split into Stanton-equivalent systems (e.g. `armada_core`, `pyro_outer`, `nyx_void`).
2. **Jump-point gate prefab** — torus + particle ring entity. Two registry entries form a `pairedPOIId` link (already in `space-types.ts` `PointOfInterest.pairedPOIId`). Player approaches gate → quantum drive seeded with destination jump point → arrives in next system.
3. **Galaxy map → in-game route** — `space-starmap.tsx` already shows the macro-galaxy. Selecting a planet in another system should call `NavPlanner.plan()` across system boundaries (uses jump points as edge nodes).
## Phase 10 — Server-authoritative nav (PvP)
1. **Deploy `nav-server-rs` to Railway** — the prebuilt 2.5 MB musl binary is on `D:\Games\Models\Windows\starnav-server-0.1.4-linux-x86_64-musl.tar.gz`. Tiny Dockerfile, COPY binary, run on `$PORT`.
2. **Wire `NavClient.serverUrl`** — env `VITE_NAV_API_URL=https://nav.grudge-studio.com` flips the existing fallback chain to server-first.
3. **PvP route validation** — when a player's ship enters a route, the Hono server signs the planned waypoints and the client must arrive at each within tolerance. Anti-teleport.
4. **Cross-shard jump matchmaker** — small Hono endpoint that returns the correct shard URL for a target system before the WebSocket connect, so each system's traffic stays on its own shard.
## Phase 11 — Meshy bridge
1. **`server/src/lib/meshy.ts` + `server/src/routes/meshy.ts`** — typed Meshy v2 client + Hono routes for `POST /meshy/animation`, `GET /meshy/library`, `POST /meshy/webhook`.
2. **Meshy → R2** — completion webhook downloads the generated GLB / animation, pushes to R2, inserts a `meshy_assets` row.
3. **Meshy → registry** — admin `POST /meshy/promote/:id` writes a JSON sidecar (`server/data/meshy-overrides.json`) that the frontend loader merges with the static registry on startup. Generated Meshy parts become first-class registry entries.
## Phase 12 — Polish + ship
1. **Imagery upgrade** — atmospheric rim shaders on planets (use `grudge-shader-lab` patterns), bloom on engines, depth-of-field on cinematics, motion-blur trails on quantum jumps.
2. **HUD typography pass** — settle on a single sci-fi monospace, consistent letter-spacing across cockpit / mech-builder / starmap.
3. **Tutorial flow** — first-time player goes through MechBuilder → CampaignBuilder → first system tutorial that uses the StarNav route to teach quantum drive.
4. **Audio pass** — engine hum during sublight, FTL whine during quantum charge, hard cut to silent + low rumble on jump entry.
## Patterns we're inheriting from StarNav / Star Citizen
- **Frame-of-reference math** — game-space vs scene-space vs camera-space; quaternion rotation chains; world-scale compensation. Already implemented in `coord-transform.ts` and applied in `attachWeaponToBone` / `mech-builder-renderer.equip`.
- **Multi-segment route with FTL/sublight modes** — segment list with per-segment `travel: 'sublight' | 'quantum'` and obstruction bypass legs.
- **Bone-attachment slot taxonomy** — right_hand / left_hand / right_shield / spine. Mirrors SC's hardpoint nomenclature for ship weapons / utilities.
- **OM rings + grid radius** — every celestial body has both a body radius (collision) and an OM radius (route waypoint snap distance). Already on `NavContainer`.
- **Modular ship/mech composition** — body + attachments wired by bone, sized by `targetSize`, posed by `restPose`. Player builds the loadout, runtime mounts the parts. Mirrors SC's component slot system.
## Risk register
- **Asset weight** — full Mech-Assembler-Forge (~1 GB) cannot live in git. Solution: convert + Draco-compress + R2-only.
- **Animation retargeting** — Mixamo FBX clips don't auto-fit Ultimate Modular Men GLTF skeletons. Need a per-character `gltfClipMap` (already in registry schema for `character` entries) plus longer-term FBX→GLTF clip retargeting via `gltf-transform`.
- **Three.js single-renderer constraint** — running multiple WebGL contexts (space + pilot + mech-builder) at once spikes GPU. Always dispose on screen change.
- **Star Citizen IP risk** — keep all *names* original (Aetheris / Forgewell / Voidspire / Crystalia, not Stanton / Hurston). The `nav/` engine is generic; the universe data must be Grudge-original.
## Suggested execution order
1. Phase 6.1 (full A\*) — unblocks better routing everywhere
2. Phase 7 (pilot view restored) — biggest visible payoff, uses existing assets
3. Phase 8.1–8.3 (mech ground combat) — the second showcase scene
4. Phase 10 (server-side nav) — once routing is reliable, gate PvP on it
5. Phase 11 (Meshy) — content velocity multiplier
6. Phase 9 (multi-system) — needs all of the above to be meaningful
7. Phase 12 (polish) — last
