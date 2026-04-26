# Grudge Space RTS — Asset Pipeline
The single source of truth for every model, texture, animation, weapon, mech part, cockpit prop and ship in this game is `src/game/asset-registry.ts`. Anything not in the registry is invisible to the runtime, the verifier, and the CDN uploader.
## Registry schema
```ts
export interface AssetEntry {
  uuid: string;            // stable Grudge object-storage id
  key: string;             // human-readable lookup key
  category: AssetCategory; // 'ship' | 'mech' | 'cockpit' | 'weapon' | 'character' | …
  localPath: string;       // /assets/space/… served from public/ in dev
  cdnPath?: string;        // override CDN sub-path if not derived from localPath
  format: 'obj' | 'fbx' | 'glb';
  texturePath?: string;
  mtlPath?: string;        // OBJ companion
  colorTintable: boolean;
  tags: string[];
  // Mech / weapon attachment metadata (optional)
  boneAnchor?: 'right_hand' | 'left_hand' | 'right_shield' | 'spine';
  targetSize?: number;     // metres, on a 2 m character / mech
  restPose?: { position?: Vec3; rotationDeg?: Vec3 };
  weaponFamily?: 'sword' | 'greatsword' | 'spear' | 'bow' | 'staff' | 'rifle' | 'gun' | 'common';
}
```
## Conventions
- **`localPath` always starts with `/assets/`** — Vite serves the project's `public/` directory at the root, so `/assets/space/…` resolves to `public/assets/space/…` in dev.
- **`format: 'glb'` covers both `.glb` and `.gltf`** — the runtime uses `GLTFLoader` for both.
- **`boneAnchor + targetSize` are how attachments size themselves.** The renderer's `attachWeaponToBone` (ground) / `equip` (mech) computes the bone's world-scale chain and inverts it so the weapon ends up at exactly `targetSize` regardless of how the parent character was rescaled at load time.
- **`restPose` is applied AFTER attaching to the bone**, so position is local to the bone and rotation is in degrees, Euler XYZ.
- **`weaponFamily` links a weapon to its animation pack** — when the player wields a `'sword'`-family weapon, the controller plays the matching `anim_sword_*` clips.
## Categories
| Category | Used for | Notes |
|---|---|---|
| `ship` | Spacecraft (player + AI) | Loaded by `space-renderer` and `pilot-renderer` |
| `mech` | Mech body, attachments, modules | Loaded by `mech-builder-renderer` |
| `cockpit` | Cockpit canopy, MFD frames, hangar pieces | First-person view |
| `weapon` | Handheld weapons (mech + ground) | Bone-anchored |
| `character` | Player + enemy character meshes (GLTF) | Used by ground-renderer |
| `animation` | Single FBX animation clip | Tagged with `weaponFamily` + `animKey` |
| `terrain`, `prop`, `effect`, `vehicle`, `enemy`, `boss`, `planet`, `station`, `turret`, `sprite`, `ui` | Existing pre-Phase-1 categories | Untouched |
## Storage layout
```
public/assets/
  space/
    cockpit/                          ← cockpit GLB + modular OBJ blocks
      kaykit-base/                    ← KayKit space-base bits (gltf+textures)
      spaceship_cockpit__seat.glb
      Spacestation_Structure_Cockpit_Model_*.{obj,mtl}
    mechs/
      Mech_00/
        Char_Mesh/Mech_Char_Mesh.fbx
        Char_Anim/Mech_00_Anim.fbx
        Attachments/Attach_*.fbx       ← 15 modular attachments
        Weapons/Core_{Hammer,Sword}.fbx
    models/ships/
      ShipInClouds/scene.{gltf,bin}
      ...existing ship folders
  ground/
    characters/, animations/, weapons/, …
```
The `assets/` segment is **gitignored** by repo policy — these large binaries live on Cloudflare R2 (CDN) and are referenced via `VITE_ASSET_CDN`. For local dev they sit on disk under `public/`.
## Verifier
`npm run check:assets` walks every registry entry and reports:
- **FAIL** — broken format (`.fbx` extension on a `glb` entry), unknown `boneAnchor`, file size < 100 bytes (placeholder).
- **WARN** — file not on disk (expected for CDN-only assets), missing companion MTL/texture, weapon without `boneAnchor`/`targetSize`.
Exit 0 on all-green, exit 1 on any FAIL. Wire into CI before deploys.
```bash
node scripts/verify-assets.mjs
# or:
npm run check:assets
```
## CDN upload pipeline
The `scripts/upload-assets-r2.mjs` script (existing) walks `public/assets/` and uploads to R2 under `gruda-armada/`. The runtime resolver `resolvePathUrl()` in `asset-registry.ts` swaps `/assets/foo/bar.glb` for `${CDN}/gruda-armada/foo/bar.glb?v=${ASSET_VERSION}` when `VITE_ASSET_CDN` is set, with cache-busting via `VITE_ASSET_VERSION`.
Workflow when adding a new asset:
1. Drop the file under `public/assets/<area>/...`
2. Add a registry entry referencing its `localPath`
3. Run `npm run check:assets` — fix any FAILs
4. Run `npm run r2:upload` — pushes new files to R2
5. Bump `VITE_ASSET_VERSION` to bust caches
6. Commit the registry change (asset binary is gitignored, so only the registry entry travels in git)
## Conversion needed (large packs not yet integrated)
The following packs are extracted on `D:\Games\Models\_unzipped\` but not yet in the registry. They need an FBX→GLB conversion pass before being usable in the WebGL runtime:
- **Mech-Assembler-Forge** (~1 GB, ~40k files) — full mech-builder kit, Unreal source format
- **MechHanger_Nathan_Bell** — UE4 project; raw FBX assets need extracting from `Mech_Hanger_UE4/Content/`
- **Sci-Fi Essentials Kit[Standard]** (~159 MB) — already includes a `glTF/` folder; mostly enemies + props, not ships
- **mecha** (~44 MB), **futuristic-mech-3d-model**, **SHS Sci-Fi RTS pack** — smaller mech / sci-fi packs to triage
Recommended next step: write `scripts/convert-fbx-to-glb.mjs` that uses `gltf-transform` to batch-convert + Draco-compress these into `public/assets/space/...` glTF entries.
## What the registry buys us
- One source of truth for every asset → no orphaned `.fbx` paths scattered through render code
- CDN swap on `VITE_ASSET_CDN` is a one-line env change — same code paths
- The verifier catches missing files / mismatched formats *before* deploy
- The mech builder, ground combat, pilot view, and space RTS all consume the same registry — one new entry is visible everywhere
- Future Meshy bridge can write into the same schema
