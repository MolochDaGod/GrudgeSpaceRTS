# Star-Citizen-Style Universe Roadmap
A staged plan for "Star Citizen experience" features in GrudgeSpaceRTS:
massive multi-system universe, ship systems, leveling, trade, with
StarNav as the routing backbone.
**Honest framing**: this is months of work. Each phase is shippable on its
own and gives the player something new to do. We don't build the whole
thing in one push.
## Phase 0 — StarNav port (✅ shipped this round)
- `src/game/nav/` — `nav-core.ts`, `nav-plan.ts`, `nav-plan-utils.ts`,
  `nav-types.ts`, `nav-vis.ts` ported from `_starnav-src` (kebab-case).
- `src/game/nav/index.ts` barrel export for the public API.
- `src/game/nav/universe-seed.ts` — Stanton (5 bodies) + Pyro (1 star) +
  one jump point, plus 5 starter POIs (Lorville, Port Olisar, Area 18,
  New Babbage, Stanton-Pyro Jump).
- Builds clean (`tsc --noEmit` passes).
## Phase 1 — Campaign Universe View (next)
- New `/universe` route — top-down star-system map rendered with the
  StarNav planner driving the visualisation. Pull `nav-vis.ts` into a
  React-friendly wrapper; render Stanton + Pyro from `universe-seed.ts`.
- Click a destination → `SCNavigationPlanner.plan_route(...)` produces
  segments + ETA + quantum-jump count.
- Fly button on the route panel: closes the map, sets the campaign target
  in `space-engine`, and starts the existing space RTS engine pointed at
  the chosen system.
- StarNav-style HUD chip on `/game`: distance to selected POI, OM bearing,
  quantum-eta — pulled from `SCNavigationCore.getNavigationData()`.
## Phase 2 — HUD overhaul
The current `/game` HUD has overlapping panels (production sidebar,
24-slot global-upgrades hotbar, build-complete toast stack, target panel,
left-side mini map, right-side icon column). Star-Citizen-style cleanup:
- **Top status bar**: credits / minerals / energy / supply / score.
- **Left collapsing dock**: production. Hidden by default, hotkey `B`.
- **Bottom MFD bar**: ship power / shields / weapons / missiles + nav
  bearing chip (the StarNav data). Three slots, like the SC MFDs.
- **Right command rail**: vertical icon column for selected fleet
  commands, replaces the giant icon column in the screenshot.
- **Toasts**: bottom-center, single line, auto-dismiss 3 s.
- **Global upgrades**: moved into a slide-out from the bottom MFD; not
  always-visible.
- All built into `space-hud.tsx` as a single overlay so we don't end up
  with three competing panel files again.
## Phase 3 — Ship systems
- Power triangle: weapons / shields / engines, three sliders mapped to
  `1 / 2 / 3`. Affects damage, shield regen, top speed.
- Component damage: per-component HP, hit-side accounting, repairs cost
  credits + downtime.
- Quantum drive: charge time, fuel cost, line-of-sight check pulled from
  StarNav obstruction detection (already ported).
- Cockpit MFDs: scan / target / mining / cargo / nav (5 standard MFDs).
## Phase 4 — Trading + economy
- 30+ commodity types per system, supply/demand model.
- Trade kiosks at landing zones; price grid hosted on the existing
  Grudge backend (`api.grudge-studio.com`) so prices are server-authoritative.
- Cargo system: SCU per ship class, decay timers for perishable goods.
- Trade route planner: re-uses `SCNavigationPlanner` with a profit weight
  layered on top of distance.
## Phase 5 — Levels + reputation
- Pilot XP: combat / trade / mining / exploration tracks (mirror the
  user's profession progression rule).
- Faction reputation: per-faction standing affects vendor prices,
  mission availability, station landing permissions.
- Persistent character on the Grudge backend; the existing `grudge-auth`
  hooks already cover login, just need the level/rep tables wired through.
## Phase 6 — Multi-system universe
- Wire the in-place world server (`server/src/world/`) to broadcast
  ship positions in the StarNav coordinate space, sharded per system.
- Jump points become loading boundaries (handover from one shard to the
  next).
- Add Nyx + Ellis + Sol seed data so there's somewhere to jump.
## Rendering notes (WebGL2 / WebGPU)
- Three.js (already a dep) supports both. To switch, replace
  `new THREE.WebGLRenderer({ ... })` with `new THREE.WebGPURenderer(...)`
  in the renderer modules — no extra package needed.
- WebGL2 is the default; WebGPU is opt-in and falls back automatically
  on unsupported browsers. For the campaign-universe view we'll prototype
  with WebGL2 and switch to WebGPU once the high-detail planet shaders
  ship (instanced clouds, atmosphere scattering).
- No extra `npm install` required for renderer choice.
## Out of scope until further notice
- Voice chat, full Squadron-42-style cinematic dialogue, MoCap cutscenes.
- Procedural-planet surface streaming (Star Citizen's planetary tech is
  ~5 years of bespoke engine work; we'll fake it with biome-tiled scenes
  and `/ground` deployment as we already do today).
- Real-time PvP at >50 ms client→server latencies (the world server in
  `server/src/world` is 20 Hz; that's enough for v1).
