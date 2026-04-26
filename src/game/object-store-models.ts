/**
 * object-store-models.ts — Bridge to the ObjectStore 3D model + RTS unit
 * libraries. Pairs with `object-store-vfx.ts` (sprite VFX) to expose the
 * full content catalog hosted on
 *   https://molochdagod.github.io/ObjectStore
 *
 * Two manifests:
 *   - /api/v1/models3d.json    → 1053 GLB models across categories
 *                                (animations / buildings / characters /
 *                                 effects / kaykit-medievalbuilder /
 *                                 kaykit-resourcebits / ships /
 *                                 spaceship-blocks).
 *   - /api/v1/factionUnits.json → 19 RTS units across 3 factions
 *                                (fabled / legion / crusade) with stats
 *                                + 2D sprite animation paths.
 *
 * Usage:
 *   await ObjectStoreModels.preload();
 *   const url = ObjectStoreModels.urlFor('kaykit-medievalbuilder/Tower.glb');
 *   const buildings = ObjectStoreModels.byCategory('kaykit-medievalbuilder');
 *   const fallback = ObjectStoreModels.pickCharacter(idx);
 *
 *   const units = await ObjectStoreUnits.preload();
 *   const fabled = ObjectStoreUnits.byFaction('fabled');
 */

const OBJECT_STORE = 'https://molochdagod.github.io/ObjectStore';

// ── Models manifest ────────────────────────────────────────────────────
export interface ModelEntry {
  name: string;
  format: 'GLB';
  path: string;
  category: string;
  sizeKB: number;
  meshes: number;
  textures: number;
  animations: number;
  materials: number;
  compressionType?: string;
}

interface ModelsManifest {
  version: string;
  totalModels: number;
  byCategory: Record<string, number>;
  models: ModelEntry[];
}

class ObjectStoreModelsImpl {
  private manifest: ModelsManifest | null = null;
  private manifestPromise: Promise<ModelsManifest> | null = null;
  private byCategoryCache = new Map<string, ModelEntry[]>();

  async preload(): Promise<ModelsManifest> {
    if (this.manifest) return this.manifest;
    if (!this.manifestPromise) {
      this.manifestPromise = fetch(`${OBJECT_STORE}/api/v1/models3d.json`)
        .then((r) => r.json() as Promise<ModelsManifest>)
        .then((m) => {
          this.manifest = m;
          return m;
        })
        .catch((err) => {
          console.warn('[ObjectStoreModels] manifest fetch failed', err);
          const empty: ModelsManifest = { version: '0', totalModels: 0, byCategory: {}, models: [] };
          this.manifest = empty;
          return empty;
        });
    }
    return this.manifestPromise;
  }

  /** Translate a manifest path (e.g. `models/_optimized/...`) to a full URL. */
  urlFor(path: string): string {
    if (/^https?:/i.test(path)) return path;
    const trimmed = path.replace(/^\/+/, '');
    return `${OBJECT_STORE}/${trimmed}`;
  }

  /** All models in a given category (cached). */
  byCategory(category: string): ModelEntry[] {
    const cached = this.byCategoryCache.get(category);
    if (cached) return cached;
    if (!this.manifest) return [];
    const filtered = this.manifest.models.filter((m) => m.category === category);
    this.byCategoryCache.set(category, filtered);
    return filtered;
  }

  /** Pick a model by deterministic index (good for seeded scenery). */
  pickByIndex(category: string, idx: number): ModelEntry | null {
    const list = this.byCategory(category);
    if (list.length === 0) return null;
    return list[((idx % list.length) + list.length) % list.length];
  }

  /** Pick a random model from a category (uses Math.random). */
  pickRandom(category: string): ModelEntry | null {
    const list = this.byCategory(category);
    if (list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
  }

  /** Cycle one of the 11 character GLBs as a fallback humanoid. */
  pickCharacter(idx: number): ModelEntry | null {
    return this.pickByIndex('characters', idx);
  }

  ready(): boolean {
    return this.manifest !== null && this.manifest.models.length > 0;
  }
}

export const ObjectStoreModels = new ObjectStoreModelsImpl();

// ── Faction units manifest ─────────────────────────────────────────────
export type RtsUnitType = 'melee' | 'ranged' | 'heavy' | 'magic' | 'support' | 'cavalry';

export interface RtsUnit {
  id: string;
  name: string;
  type: RtsUnitType;
  spritePath: string;
  animations: string[];
  stats: {
    health: number;
    speed: number;
    attackDamage: number;
    attackRange: number;
    attackCooldown: number;
    size: number;
  };
  description: string;
}

export interface RtsFaction {
  id: string;
  name: string;
  color: string;
  buildingColor: string;
  description: string;
  units: RtsUnit[];
}

interface FactionUnitsManifest {
  version: string;
  totalUnits: number;
  unitTypes: RtsUnitType[];
  factions: Record<string, RtsFaction>;
}

class ObjectStoreUnitsImpl {
  private manifest: FactionUnitsManifest | null = null;
  private manifestPromise: Promise<FactionUnitsManifest> | null = null;

  async preload(): Promise<FactionUnitsManifest> {
    if (this.manifest) return this.manifest;
    if (!this.manifestPromise) {
      this.manifestPromise = fetch(`${OBJECT_STORE}/api/v1/factionUnits.json`)
        .then((r) => r.json() as Promise<FactionUnitsManifest>)
        .then((m) => {
          this.manifest = m;
          return m;
        })
        .catch((err) => {
          console.warn('[ObjectStoreUnits] manifest fetch failed', err);
          const empty: FactionUnitsManifest = { version: '0', totalUnits: 0, unitTypes: [], factions: {} };
          this.manifest = empty;
          return empty;
        });
    }
    return this.manifestPromise;
  }

  byFaction(id: string): RtsUnit[] {
    if (!this.manifest) return [];
    return this.manifest.factions[id]?.units ?? [];
  }

  factions(): RtsFaction[] {
    if (!this.manifest) return [];
    return Object.values(this.manifest.factions);
  }

  /** Find any unit by id across factions (e.g. 'fabled_archer'). */
  byId(id: string): RtsUnit | null {
    if (!this.manifest) return null;
    for (const f of Object.values(this.manifest.factions)) {
      const u = f.units.find((unit) => unit.id === id);
      if (u) return u;
    }
    return null;
  }

  /** Resolve a unit's sprite directory to the ObjectStore-hosted base URL. */
  spriteBaseUrl(unit: RtsUnit): string {
    const trimmed = unit.spritePath.replace(/^\/+/, '');
    return `${OBJECT_STORE}/${trimmed}`;
  }

  ready(): boolean {
    return this.manifest !== null && Object.keys(this.manifest.factions).length > 0;
  }
}

export const ObjectStoreUnits = new ObjectStoreUnitsImpl();
