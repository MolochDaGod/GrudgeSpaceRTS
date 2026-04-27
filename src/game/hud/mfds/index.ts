/**
 * mfds/index.ts — registry + types for swappable MFD content modules.
 *
 * The bottom HUD bar in `SpaceHudV2.tsx` has 3 fixed slots. Each slot
 * mounts an MFD content component selected from the registry below.
 * Content components share a tiny contract:
 *
 *   {
 *     id:           stable string id (also used in localStorage)
 *     title:        header text (always uppercase)
 *     statusOf?:    derives the right-aligned status text from props
 *     statusToneOf?:tone for the status badge
 *     Body:         the React component that renders inside <Mfd>
 *   }
 *
 * This means the layout shell can iterate slots and plug Body without
 * caring which content lives there, and players can swap MFDs at runtime
 * (Tab-cycle, drag-drop, persisted to localStorage).
 *
 * To add a new MFD:
 *   1. Drop a `<MyMfd>.tsx` file in this folder exporting `{ id, title, Body, ... }`.
 *   2. Append it to `MFD_REGISTRY` here.
 *   3. The slot picker UI auto-includes it.
 */

import type { ComponentType } from 'react';
import type { SpaceRenderer } from '../../space-renderer';
import { PowerMfd } from './PowerMfd';
import { TargetingMfd } from './TargetingMfd';
import { NavMfd } from './NavMfd';
import { ScanMfd } from './ScanMfd';
import { QuantumMfd } from './QuantumMfd';

export interface MfdProps {
  renderer: SpaceRenderer | null;
}

export interface MfdContent {
  /** Stable id (persisted in localStorage as the slot's selection). */
  id: string;
  /** Header label shown in the Mfd primitive. */
  title: string;
  /** Right-aligned status text derived from the renderer state. */
  statusOf?: (props: MfdProps) => string | undefined;
  /** Tone for the status pill. */
  statusToneOf?: (props: MfdProps) => 'accent' | 'warn' | 'alert' | 'ok' | 'dim';
  /** Optional click handler for the Mfd header (e.g. opens Star Map). */
  onHeaderClick?: () => void;
  /** Body component that renders inside the Mfd. */
  Body: ComponentType<MfdProps>;
}

/** Master list — order is the default slot fill order (3 visible slots). */
export const MFD_REGISTRY: MfdContent[] = [PowerMfd, TargetingMfd, NavMfd, ScanMfd, QuantumMfd];

/** Lookup helper — undefined-safe so future ids don't crash a stale save. */
export function getMfd(id: string): MfdContent | undefined {
  return MFD_REGISTRY.find((m) => m.id === id);
}

/** Default 3-slot configuration before the player picks their own. */
export const DEFAULT_SLOT_IDS: [string, string, string] = ['power', 'targeting', 'nav'];

/** Persist a slot selection. */
export function saveSlots(ids: [string, string, string]): void {
  try {
    localStorage.setItem('hud_mfd_slots', JSON.stringify(ids));
  } catch {
    /* noop */
  }
}

/** Load slot selection; falls back to DEFAULT_SLOT_IDS. */
export function loadSlots(): [string, string, string] {
  try {
    const raw = localStorage.getItem('hud_mfd_slots');
    if (!raw) return DEFAULT_SLOT_IDS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 3 && parsed.every((s) => typeof s === 'string')) {
      return parsed as [string, string, string];
    }
  } catch {
    /* fallthrough */
  }
  return DEFAULT_SLOT_IDS;
}
