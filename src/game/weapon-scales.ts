/**
 * weapon-scales.ts — single source of truth for ground-combat weapon
 * size + grip position. The runtime applies these literally:
 *   weapon.scale.setScalar(scale)
 *   weapon.position.set(...position)
 *   weapon.rotation.set(...rotationDeg → rad)
 * No bbox math, no maxDim normalisation, no compounding setScalar.
 *
 * Tweak values in this file to retune. Keys match the suffix of the
 * weapon path after `/assets/ground/weapons/`.
 *
 * Convention: KayKit + sci-fi FBXs are authored at 1 unit = 1 cm,
 * so 0.01 here ≈ 1 m on screen. Position is the local offset relative
 * to the player's 2 m-tall character group (feet at y=0).
 */

export interface WeaponXform {
  scale: number;
  position: [number, number, number];
  rotationDeg?: [number, number, number];
}

export const WEAPON_DEFAULT: WeaponXform = {
  scale: 0.01,
  position: [0.35, 1.15, 0.1],
};

export const WEAPON_SCALES: Record<string, WeaponXform> = {
  // ── KayKit Adventurers — melee ──────────────────────────────────
  'kaykit/sword_A.fbx': { scale: 0.011, position: [0.35, 1.15, 0.1] },
  'kaykit/sword_B.fbx': { scale: 0.011, position: [0.35, 1.15, 0.1] },
  'kaykit/sword_C.fbx': { scale: 0.011, position: [0.35, 1.15, 0.1] },
  'kaykit/sword_D.fbx': { scale: 0.011, position: [0.35, 1.15, 0.1] },
  'kaykit/sword_E.fbx': { scale: 0.011, position: [0.35, 1.15, 0.1] },
  'kaykit/dagger_A.fbx': { scale: 0.008, position: [0.32, 1.1, 0.1] },
  'kaykit/dagger_B.fbx': { scale: 0.008, position: [0.32, 1.1, 0.1] },
  'kaykit/axe_A.fbx': { scale: 0.011, position: [0.35, 1.15, 0.1] },
  'kaykit/axe_B.fbx': { scale: 0.011, position: [0.35, 1.15, 0.1] },
  'kaykit/axe_C.fbx': { scale: 0.011, position: [0.35, 1.15, 0.1] },
  'kaykit/hammer_A.fbx': { scale: 0.011, position: [0.35, 1.15, 0.1] },
  'kaykit/hammer_B.fbx': { scale: 0.011, position: [0.35, 1.15, 0.1] },
  'kaykit/hammer_C.fbx': { scale: 0.011, position: [0.35, 1.15, 0.1] },
  'kaykit/fistweapon_A.fbx': { scale: 0.008, position: [0.32, 1.05, 0.05] },
  'kaykit/fistweapon_B.fbx': { scale: 0.008, position: [0.32, 1.05, 0.05] },

  // ── KayKit polearms / staves ────────────────────────────────────
  'kaykit/halberd.fbx': { scale: 0.013, position: [0.3, 1.0, 0.1] },
  'kaykit/spear_A.fbx': { scale: 0.013, position: [0.3, 1.0, 0.1] },
  'kaykit/staff_A.fbx': { scale: 0.013, position: [0.3, 1.0, 0.1] },
  'kaykit/staff_B.fbx': { scale: 0.013, position: [0.3, 1.0, 0.1] },
  'kaykit/wand_A.fbx': { scale: 0.009, position: [0.32, 1.1, 0.05] },

  // ── KayKit ranged ───────────────────────────────────────────────
  'kaykit/bow_A.fbx': { scale: 0.012, position: [0.3, 1.1, 0.1], rotationDeg: [0, 0, 90] },
  'kaykit/bow_A_withString.fbx': { scale: 0.012, position: [0.3, 1.1, 0.1], rotationDeg: [0, 0, 90] },
  'kaykit/bow_B.fbx': { scale: 0.012, position: [0.3, 1.1, 0.1], rotationDeg: [0, 0, 90] },
  'kaykit/bow_B_withString.fbx': { scale: 0.012, position: [0.3, 1.1, 0.1], rotationDeg: [0, 0, 90] },
  'kaykit/arrow_A.fbx': { scale: 0.01, position: [0.3, 1.1, 0.1] },
  'kaykit/arrow_B.fbx': { scale: 0.01, position: [0.3, 1.1, 0.1] },

  // ── KayKit shields (left hand) ──────────────────────────────────
  'kaykit/shield_A.fbx': { scale: 0.011, position: [-0.35, 1.15, 0.05] },
  'kaykit/shield_B.fbx': { scale: 0.011, position: [-0.35, 1.15, 0.05] },
  'kaykit/shield_C.fbx': { scale: 0.011, position: [-0.35, 1.15, 0.05] },

  // ── Sci-fi pack ─────────────────────────────────────────────────
  'scifi/Rifle.fbx': { scale: 0.01, position: [0.3, 1.2, 0.2] },
  'scifi/Pistol.fbx': { scale: 0.009, position: [0.3, 1.1, 0.1] },
  'scifi/Sniper.fbx': { scale: 0.011, position: [0.3, 1.2, 0.25] },
  'scifi/Bow.fbx': { scale: 0.012, position: [0.3, 1.1, 0.1], rotationDeg: [0, 0, 90] },
  'scifi/Sword.fbx': { scale: 0.011, position: [0.35, 1.15, 0.1] },
  'scifi/Sword2.fbx': { scale: 0.011, position: [0.35, 1.15, 0.1] },
};

/**
 * Resolve any weapon path (e.g. '/assets/ground/weapons/kaykit/sword_A.fbx'
 * or 'kaykit/sword_A.fbx') to its baked transform. Falls back to defaults.
 */
export function lookupWeaponXform(path: string): WeaponXform {
  const key = path.replace(/^.*\/ground\/weapons\//, '');
  return WEAPON_SCALES[key] ?? WEAPON_DEFAULT;
}
