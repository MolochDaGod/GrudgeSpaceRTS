/**
 * weapon-scales.ts — single source of truth for ground-combat weapon
 * SIZE (in metres) + grip position. The runtime measures the loaded
 * FBX bbox once and scales it so the weapon's longest axis equals
 * `targetMeters`. This is robust to ANY source-FBX unit convention
 * (cm / m / mm / inches — doesn't matter, the result is always the
 * literal length in metres specified here).
 *
 * Tweak `targetMeters` to retune. Keys match the suffix of the weapon
 * path after `/assets/ground/weapons/`.
 */

export interface WeaponXform {
  /** Final on-screen length of the weapon's longest axis, in metres. */
  targetMeters: number;
  /** Local offset relative to the 2 m-tall character group (feet at y=0). */
  position: [number, number, number];
  rotationDeg?: [number, number, number];
}

export const WEAPON_DEFAULT: WeaponXform = {
  targetMeters: 1.0,
  position: [0.35, 1.15, 0.1],
};

export const WEAPON_SCALES: Record<string, WeaponXform> = {
  // ── KayKit Adventurers — melee ────────────────────────────────
  'kaykit/sword_A.fbx': { targetMeters: 1.0, position: [0.35, 1.15, 0.1] },
  'kaykit/sword_B.fbx': { targetMeters: 1.0, position: [0.35, 1.15, 0.1] },
  'kaykit/sword_C.fbx': { targetMeters: 1.0, position: [0.35, 1.15, 0.1] },
  'kaykit/sword_D.fbx': { targetMeters: 1.0, position: [0.35, 1.15, 0.1] },
  'kaykit/sword_E.fbx': { targetMeters: 1.0, position: [0.35, 1.15, 0.1] },
  'kaykit/dagger_A.fbx': { targetMeters: 0.5, position: [0.32, 1.1, 0.1] },
  'kaykit/dagger_B.fbx': { targetMeters: 0.5, position: [0.32, 1.1, 0.1] },
  'kaykit/axe_A.fbx': { targetMeters: 0.9, position: [0.35, 1.15, 0.1] },
  'kaykit/axe_B.fbx': { targetMeters: 0.9, position: [0.35, 1.15, 0.1] },
  'kaykit/axe_C.fbx': { targetMeters: 0.9, position: [0.35, 1.15, 0.1] },
  'kaykit/hammer_A.fbx': { targetMeters: 0.9, position: [0.35, 1.15, 0.1] },
  'kaykit/hammer_B.fbx': { targetMeters: 0.9, position: [0.35, 1.15, 0.1] },
  'kaykit/hammer_C.fbx': { targetMeters: 0.9, position: [0.35, 1.15, 0.1] },
  'kaykit/fistweapon_A.fbx': { targetMeters: 0.4, position: [0.32, 1.05, 0.05] },
  'kaykit/fistweapon_B.fbx': { targetMeters: 0.4, position: [0.32, 1.05, 0.05] },

  // ── KayKit polearms / staves (longer) ───────────────────────
  'kaykit/halberd.fbx': { targetMeters: 2.0, position: [0.3, 1.0, 0.1] },
  'kaykit/spear_A.fbx': { targetMeters: 2.0, position: [0.3, 1.0, 0.1] },
  'kaykit/staff_A.fbx': { targetMeters: 1.7, position: [0.3, 1.0, 0.1] },
  'kaykit/staff_B.fbx': { targetMeters: 1.7, position: [0.3, 1.0, 0.1] },
  'kaykit/wand_A.fbx': { targetMeters: 0.4, position: [0.32, 1.1, 0.05] },

  // ── KayKit ranged ────────────────────────────────────
  'kaykit/bow_A.fbx': { targetMeters: 1.4, position: [0.3, 1.1, 0.1], rotationDeg: [0, 0, 90] },
  'kaykit/bow_A_withString.fbx': { targetMeters: 1.4, position: [0.3, 1.1, 0.1], rotationDeg: [0, 0, 90] },
  'kaykit/bow_B.fbx': { targetMeters: 1.4, position: [0.3, 1.1, 0.1], rotationDeg: [0, 0, 90] },
  'kaykit/bow_B_withString.fbx': { targetMeters: 1.4, position: [0.3, 1.1, 0.1], rotationDeg: [0, 0, 90] },
  'kaykit/arrow_A.fbx': { targetMeters: 0.7, position: [0.3, 1.1, 0.1] },
  'kaykit/arrow_B.fbx': { targetMeters: 0.7, position: [0.3, 1.1, 0.1] },

  // ── KayKit shields (left hand) ──────────────────────────
  'kaykit/shield_A.fbx': { targetMeters: 0.9, position: [-0.35, 1.15, 0.05] },
  'kaykit/shield_B.fbx': { targetMeters: 0.9, position: [-0.35, 1.15, 0.05] },
  'kaykit/shield_C.fbx': { targetMeters: 0.9, position: [-0.35, 1.15, 0.05] },

  // ── Sci-fi pack ─────────────────────────────────────
  'scifi/Rifle.fbx': { targetMeters: 1.0, position: [0.3, 1.2, 0.2] },
  'scifi/Pistol.fbx': { targetMeters: 0.4, position: [0.3, 1.1, 0.1] },
  'scifi/Sniper.fbx': { targetMeters: 1.2, position: [0.3, 1.2, 0.25] },
  'scifi/Bow.fbx': { targetMeters: 1.4, position: [0.3, 1.1, 0.1], rotationDeg: [0, 0, 90] },
  'scifi/Sword.fbx': { targetMeters: 1.0, position: [0.35, 1.15, 0.1] },
  'scifi/Sword2.fbx': { targetMeters: 1.0, position: [0.35, 1.15, 0.1] },
};

/**
 * Resolve any weapon path (e.g. '/assets/ground/weapons/kaykit/sword_A.fbx'
 * or 'kaykit/sword_A.fbx') to its baked transform. Falls back to defaults.
 */
export function lookupWeaponXform(path: string): WeaponXform {
  const key = path.replace(/^.*\/ground\/weapons\//, '');
  return WEAPON_SCALES[key] ?? WEAPON_DEFAULT;
}
