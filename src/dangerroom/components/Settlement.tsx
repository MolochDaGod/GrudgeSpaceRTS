import { useMemo } from "react";
import { mulberry32, childSeed } from "../state/seed";
import type { Settlement as SettlementDef } from "../state/settlements";
import {
  CASTLE_TOWN_URL,
  VILLAGE_KIT_URL,
  ORC_KIT_URL,
  VILLAGE_HOUSES,
  VILLAGE_MARKET,
  VILLAGE_FARM,
  ORC_BUILDINGS,
  ORC_PROPS,
  type KitPieceDef,
} from "../data/townAssets";
import { KitPiece } from "./KitPiece";
import { GltfProp } from "./GltfProp";

interface Placed {
  key: string;
  url: string;
  piece: KitPieceDef;
  x: number;
  z: number;
  rotationY: number;
  scaleJitter: number;
}

/** Ring of `count` pieces cycled from `set`, facing the settlement centre. */
function ringLayout(
  idPrefix: string,
  url: string,
  set: KitPieceDef[],
  cx: number,
  cz: number,
  ringR: number,
  count: number,
  rng: () => number,
): Placed[] {
  const out: Placed[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rng() * 0.3;
    const r = ringR * (0.85 + rng() * 0.3);
    const x = cx + Math.cos(a) * r;
    const z = cz + Math.sin(a) * r;
    out.push({
      key: `${idPrefix}-${i}`,
      url,
      piece: set[i % set.length],
      x,
      z,
      rotationY: Math.atan2(cx - x, cz - z),
      scaleJitter: 0.92 + rng() * 0.18,
    });
  }
  return out;
}

/** Scatter `count` props from `set` within `spreadR` of the centre. */
function scatterLayout(
  idPrefix: string,
  url: string,
  set: KitPieceDef[],
  cx: number,
  cz: number,
  spreadR: number,
  count: number,
  rng: () => number,
): Placed[] {
  const out: Placed[] = [];
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2;
    const r = rng() * spreadR;
    out.push({
      key: `${idPrefix}-${i}`,
      url,
      piece: set[i % set.length],
      x: cx + Math.cos(a) * r,
      z: cz + Math.sin(a) * r,
      rotationY: rng() * Math.PI * 2,
      scaleJitter: 0.9 + rng() * 0.2,
    });
  }
  return out;
}

function buildPieces(s: SettlementDef): Placed[] {
  const rng = mulberry32(childSeed(`settle-${s.id}`));
  const { x, z } = s;

  if (s.kit === "castle") {
    // Whole pre-built castle town scene placed as one landmark.
    return [];
  }

  if (s.kit === "village") {
    if (s.kind === "farm") {
      return [
        ...ringLayout(`${s.id}-farm`, VILLAGE_KIT_URL, VILLAGE_FARM, x, z, s.radius * 0.7, 6, rng),
        ...ringLayout(`${s.id}-house`, VILLAGE_KIT_URL, VILLAGE_HOUSES, x, z, s.radius * 0.4, 2, rng),
      ];
    }
    return [
      ...ringLayout(`${s.id}-house`, VILLAGE_KIT_URL, VILLAGE_HOUSES, x, z, s.radius * 0.85, 7, rng),
      ...scatterLayout(`${s.id}-mkt`, VILLAGE_KIT_URL, VILLAGE_MARKET, x, z, s.radius * 0.4, 5, rng),
    ];
  }

  // orc kit — Legion town or enemy camp
  if (s.kind === "camp") {
    return [
      ...ringLayout(`${s.id}-bld`, ORC_KIT_URL, ORC_BUILDINGS, x, z, s.radius * 0.7, 2, rng),
      ...scatterLayout(`${s.id}-prop`, ORC_KIT_URL, ORC_PROPS, x, z, s.radius * 0.55, 6, rng),
    ];
  }
  return [
    ...ringLayout(`${s.id}-bld`, ORC_KIT_URL, ORC_BUILDINGS, x, z, s.radius * 0.85, 5, rng),
    ...scatterLayout(`${s.id}-prop`, ORC_KIT_URL, ORC_PROPS, x, z, s.radius * 0.45, 7, rng),
  ];
}

export function Settlement({ settlement }: { settlement: SettlementDef }) {
  const pieces = useMemo(() => buildPieces(settlement), [settlement]);

  return (
    <group>
      {settlement.kit === "castle" && (
        <GltfProp
          asset={{ url: CASTLE_TOWN_URL, height: 26, collider: "none" }}
          x={settlement.x}
          z={settlement.z}
          rotationY={0}
        />
      )}
      {pieces.map((p) => (
        <KitPiece
          key={p.key}
          url={p.url}
          piece={p.piece}
          x={p.x}
          z={p.z}
          rotationY={p.rotationY}
          scaleJitter={p.scaleJitter}
        />
      ))}
    </group>
  );
}
