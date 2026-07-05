import { Suspense, useMemo } from "react";
import { DUMMY_SPAWNS, ANIMAL_SPAWNS } from "../state/world";
import { getTerrainHeight } from "../state/terrain";
import { factionAt } from "../state/zones";
import { ISLANDS, SEA_LEVEL } from "../state/islands";
import { hash2, childSeed, mulberry32 } from "../state/seed";
import { ALL_SETTLEMENTS } from "../state/settlements";
import { TOWN_NPCS } from "../data/npcRoster";
import { TREE_ASSETS, DEAD_TREE_ASSETS, ROCK_ASSETS, type AssetDef } from "../data/worldAssets";
import { POLY_ROCKS, POLY_CLIFFS, POLY_LOGS, type PolyModelDef } from "../data/polyhaven";
import { DUNGEON_ENTRANCES } from "../data/dungeons";
import {
  VILLAGE_KIT_URL,
  VILLAGE_HOUSES,
  VILLAGE_MARKET,
} from "../data/townAssets";
import { Dummy } from "./Dummy";
import { Terrain } from "./Terrain";
import { Water } from "./Water";
import { Settlement } from "./Settlement";
import { Npc } from "./Npc";
import { NpcGuard } from "./NpcGuard";
import { Animal } from "./Animal";
import { KitPiece } from "./KitPiece";
import { GltfProp } from "./GltfProp";
import { PolyProp } from "./PolyProp";
import { Ship } from "./Ship";
import { DungeonGate } from "./DungeonGate";
import { HarvestNode } from "./HarvestNode";
import { HARVEST_NODE_SPAWNS } from "../data/harvestNodes";
import { ArenaWalls } from "./ArenaWalls";

interface ScatterItem {
  key: string;
  asset: AssetDef;
  x: number;
  z: number;
  rotationY: number;
  scaleJitter: number;
}

interface PolyScatterItem {
  key: string;
  model: PolyModelDef;
  x: number;
  z: number;
  rotationY: number;
  scaleJitter: number;
}

// Deterministically scatter trees / dead-trees / rocks across every island.
// Legion territory gets bleak dead trees; the other zones get living ones. Nothing
// spawns below the shoreline, on very steep terrain, or on the flat spawn plaza.
function buildScatter(): ScatterItem[] {
  const rng = mulberry32(childSeed("scatter"));
  const items: ScatterItem[] = [];
  let key = 0;

  for (const isl of ISLANDS) {
    // Density scales with island area; the neutral hub stays sparser.
    const count = isl.faction === "neutral" ? 140 : 340;
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * isl.radius * 0.95;
      const x = isl.x + Math.cos(a) * r;
      const z = isl.z + Math.sin(a) * r;

      // Keep props on dry, gently-sloped ground.
      const h = getTerrainHeight(x, z);
      if (h < SEA_LEVEL + 0.6 || h > 18) continue;
      const hx = getTerrainHeight(x + 1.5, z);
      const hz = getTerrainHeight(x, z + 1.5);
      const slope = Math.max(Math.abs(h - hx), Math.abs(h - hz));
      if (slope > 1.8) continue;
      // Leave the spawn plaza clear.
      if (x * x + z * z < 40 * 40) continue;

      const theme = factionAt(x, z);
      const roll = hash2(x, z, 11);
      let asset: AssetDef;
      if (roll < 0.35) {
        asset = ROCK_ASSETS[Math.floor(hash2(x, z, 5) * ROCK_ASSETS.length)];
      } else if (theme.faction === "legion") {
        asset = DEAD_TREE_ASSETS[Math.floor(hash2(x, z, 7) * DEAD_TREE_ASSETS.length)];
      } else {
        asset = TREE_ASSETS[Math.floor(hash2(x, z, 7) * TREE_ASSETS.length)];
      }

      items.push({
        key: `scatter-${key++}`,
        asset,
        x,
        z,
        rotationY: hash2(x, z, 3) * Math.PI * 2,
        scaleJitter: 0.8 + hash2(x, z, 9) * 0.6,
      });
    }
  }
  return items;
}

/** Poly Haven rocks / cliffs / logs on slopes and forest edges. */
function buildPolyScatter(): PolyScatterItem[] {
  const rng = mulberry32(childSeed("poly-scatter"));
  const items: PolyScatterItem[] = [];
  let key = 0;

  for (const isl of ISLANDS) {
    const count = isl.faction === "neutral" ? 55 : 120;
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * isl.radius * 0.92;
      const x = isl.x + Math.cos(a) * r;
      const z = isl.z + Math.sin(a) * r;
      const h = getTerrainHeight(x, z);
      if (h < SEA_LEVEL + 0.5) continue;
      const hx = getTerrainHeight(x + 1.5, z);
      const hz = getTerrainHeight(x, z + 1.5);
      const slope = Math.max(Math.abs(h - hx), Math.abs(h - hz));
      if (x * x + z * z < 36 * 36) continue;

      let pool: PolyModelDef[];
      if (slope > 2.2) pool = POLY_CLIFFS;
      else if (slope > 1.2) pool = POLY_ROCKS;
      else if (rng() < 0.25) pool = POLY_LOGS;
      else pool = POLY_ROCKS;

      const model = pool[Math.floor(hash2(x, z, 17) * pool.length)];
      items.push({
        key: `poly-${key++}`,
        model,
        x,
        z,
        rotationY: hash2(x, z, 13) * Math.PI * 2,
        scaleJitter: 0.75 + hash2(x, z, 19) * 0.65,
      });
    }
  }
  return items;
}

// Neutral hub (Town of Grudgehold) built from the real village kit, around the
// player's flat spawn area. Houses ring the plaza; market props fill the centre.
interface HubItem {
  key: string;
  piece: (typeof VILLAGE_HOUSES)[number];
  x: number;
  z: number;
  rotationY: number;
}

function buildNeutralHub(): HubItem[] {
  const rng = mulberry32(childSeed("neutral-hub"));
  const items: HubItem[] = [];
  const houseCount = 7;
  for (let i = 0; i < houseCount; i++) {
    const a = (i / houseCount) * Math.PI * 2 + rng() * 0.25;
    const r = 20 + rng() * 3;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    items.push({
      key: `hub-house-${i}`,
      piece: VILLAGE_HOUSES[i % VILLAGE_HOUSES.length],
      x,
      z,
      rotationY: Math.atan2(-x, -z),
    });
  }
  const props = [
    { x: 0, z: -16 },
    { x: -6, z: -15 },
    { x: 6, z: -15 },
    { x: -14, z: 2 },
    { x: 14, z: 2 },
  ];
  props.forEach((p, i) => {
    items.push({
      key: `hub-mkt-${i}`,
      piece: VILLAGE_MARKET[i % VILLAGE_MARKET.length],
      x: p.x,
      z: p.z,
      rotationY: Math.atan2(-p.x, -p.z),
    });
  });
  return items;
}

export function Arena() {
  const scatter = useMemo(() => buildScatter(), []);
  const polyScatter = useMemo(() => buildPolyScatter(), []);
  const hub = useMemo(() => buildNeutralHub(), []);

  return (
    <group>
      <Terrain />
      <ArenaWalls />
      <Water />

      {hub.map((h) => (
        <KitPiece
          key={h.key}
          url={VILLAGE_KIT_URL}
          piece={h.piece}
          x={h.x}
          z={h.z}
          rotationY={h.rotationY}
          tint="#c9a227"
        />
      ))}

      {ALL_SETTLEMENTS.map((s) => (
        <Settlement key={s.id} settlement={s} />
      ))}

      <Suspense fallback={null}>
        {polyScatter.map((s) => (
          <PolyProp
            key={s.key}
            model={s.model}
            x={s.x}
            z={s.z}
            rotationY={s.rotationY}
            scaleJitter={s.scaleJitter}
          />
        ))}
      </Suspense>

      {scatter.map((s) => {
        const theme = factionAt(s.x, s.z);
        const treeTint = s.asset.collider === "cylinder" ? theme.accent : undefined;
        return (
          <GltfProp
            key={s.key}
            asset={s.asset}
            x={s.x}
            z={s.z}
            rotationY={s.rotationY}
            scaleJitter={s.scaleJitter}
            tint={treeTint}
          />
        );
      })}

      {HARVEST_NODE_SPAWNS.map((node) => (
        <HarvestNode key={node.id} node={node} />
      ))}

      {TOWN_NPCS.map((npc) =>
        npc.role === "guard" ? (
          <NpcGuard key={npc.id} npc={npc} />
        ) : (
          <Npc key={npc.id} npc={npc} />
        ),
      )}

      {DUNGEON_ENTRANCES.map((d) => (
        <DungeonGate key={d.id} entrance={d} />
      ))}

      <Suspense fallback={null}>
        <Ship />
      </Suspense>

      {ANIMAL_SPAWNS.map((spawn) => (
        <Animal key={spawn.id} spawn={spawn} />
      ))}

      {DUMMY_SPAWNS.map((spawn) => (
        <Dummy key={spawn.id} spawn={spawn} />
      ))}
    </group>
  );
}
