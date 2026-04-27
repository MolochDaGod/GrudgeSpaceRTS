/**
 * sc-tokens.ts — Star-Citizen-style design tokens for the new HUD.
 *
 * Single source of truth for colours, gradients, fonts, glow filters, and
 * angled-frame parameters. Every primitive in `sc-primitives.tsx` and the
 * `SpaceHudV2` overlay reads from here so the visual language stays
 * consistent across MFDs, status chips, and command rails.
 *
 * Inspiration:
 *   - mobiGlas: deep navy + warm-cyan accents, monospaced uppercase, sharp
 *     45° angled corners, faint inner shadow, additive scanlines.
 *   - Visor HUD: high-contrast amber alerts, low-saturation neutrals,
 *     hexel motifs framing critical readouts.
 *   - ASOP / Ship terminal: long thin status bars with chevron tick marks,
 *     small uppercase labels, unit suffixes.
 */

export const SC = {
  // ── Brand palette ───────────────────────────────────────────────
  /** Primary accent — used for nav, friendly readouts, MFD chrome. */
  accent: '#44ddff',
  /** Secondary warm — used for warnings, alerts, build complete. */
  warn: '#ffcc44',
  /** Damage / hostile — used for combat alerts and red HP states. */
  alert: '#ff4444',
  /** Healthy — energy / shields > 50%, OK statuses. */
  ok: '#44ee88',
  /** Default body text. */
  text: '#cde',
  /** Faded body text (labels, secondary metadata). */
  textDim: 'rgba(180,220,255,0.55)',
  /** Almost-invisible body text. */
  textGhost: 'rgba(180,220,255,0.3)',

  // ── Surface fills ───────────────────────────────────────────────
  /** Top-status-bar / MFD background — deep navy glass. */
  surface: 'rgba(8,16,32,0.82)',
  /** Stronger surface for emphasised panels. */
  surfaceStrong: 'rgba(4,10,22,0.92)',
  /** Subtle surface for tertiary cards. */
  surfaceSoft: 'rgba(20,28,42,0.7)',
  /** Heads-up tints for damage / power / nav banners. */
  surfaceAccent: 'rgba(68,221,255,0.12)',
  surfaceWarn: 'rgba(255,204,68,0.14)',
  surfaceAlert: 'rgba(255,68,68,0.14)',

  // ── Borders ─────────────────────────────────────────────────────
  borderSoft: '1px solid rgba(80,180,255,0.22)',
  borderAccent: '1px solid rgba(68,221,255,0.55)',
  borderWarn: '1px solid rgba(255,204,68,0.5)',
  borderAlert: '1px solid rgba(255,68,68,0.55)',
  borderGhost: '1px solid rgba(255,255,255,0.06)',

  // ── Shadows / glow ──────────────────────────────────────────────
  panelShadow: '0 6px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
  glowAccent: '0 0 14px rgba(68,221,255,0.35)',
  glowWarn: '0 0 14px rgba(255,204,68,0.35)',
  glowAlert: '0 0 16px rgba(255,68,68,0.45)',

  // ── Typography ──────────────────────────────────────────────────
  font: "'Segoe UI', 'Consolas', monospace",
  /** Display labels (chip titles, MFD headers). */
  labelLetterSpacing: 3,
  /** Big-number readouts. */
  digitWeight: 800,

  // ── Layout ──────────────────────────────────────────────────────
  /** Top status bar fixed height (px). */
  topBarH: 38,
  /** Bottom MFD bar fixed height (px). */
  mfdH: 132,
  /** Right command rail width (px). */
  railW: 56,
  /** Left dock width when expanded (px). */
  dockW: 280,

  // ── Misc ────────────────────────────────────────────────────────
  /** Standard panel corner radius (px). */
  radius: 6,
  /** Higher-radius for buttons / chips. */
  radiusChip: 4,
} as const;

export type ScTokens = typeof SC;
