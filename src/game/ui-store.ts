/**
 * ui-store.ts — Zustand + Immer global UI state
 *
 * Centralises overlay/panel visibility, selected items, and menu state
 * so components can read/write without deep prop drilling.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type UIOverlay =
  | 'none'
  | 'journal'
  | 'inventory'
  | 'charPanel'
  | 'skillTree'
  | 'techTree'
  | 'commander'
  | 'planetCard'
  | 'planetSurface'
  | 'interior'
  | 'starMap'
  | 'hotkeys'
  | 'campaignBuilder'
  | 'cmdSelect';

export type UIScreen = 'intro' | 'menu' | 'codex' | 'howto' | 'editor' | 'playing' | 'ground_combat' | 'ground_rts';

export interface UIState {
  /** Active full-screen overlay (only one at a time) */
  overlay: UIOverlay;
  /** Current screen/route */
  screen: UIScreen;
  /** Selected planet id in space view */
  selectedPlanetId: number | null;
  /** Planet card pagination index */
  planetCardIdx: number;
  /** Selected commander id */
  selectedCmdId: number | null;
  /** Currently focused control group index */
  focusedGroupIdx: number;
  /** Whether the game is currently loading */
  loading: boolean;

  // Actions
  openOverlay: (o: UIOverlay) => void;
  closeOverlay: () => void;
  toggleOverlay: (o: UIOverlay) => void;
  setScreen: (s: UIScreen) => void;
  setSelectedPlanetId: (id: number | null) => void;
  setPlanetCardIdx: (idx: number) => void;
  setSelectedCmdId: (id: number | null) => void;
  nextFocusedGroup: () => void;
  setLoading: (v: boolean) => void;
}

export const useUIStore = create<UIState>()(
  immer((set) => ({
    overlay: 'none',
    screen: 'menu',
    selectedPlanetId: null,
    planetCardIdx: 0,
    selectedCmdId: null,
    focusedGroupIdx: 0,
    loading: false,

    openOverlay: (o) =>
      set((s) => {
        s.overlay = o;
      }),
    closeOverlay: () =>
      set((s) => {
        s.overlay = 'none';
      }),
    toggleOverlay: (o) =>
      set((s) => {
        s.overlay = s.overlay === o ? 'none' : o;
      }),
    setScreen: (sc) =>
      set((s) => {
        s.screen = sc;
      }),
    setSelectedPlanetId: (id) =>
      set((s) => {
        s.selectedPlanetId = id;
      }),
    setPlanetCardIdx: (idx) =>
      set((s) => {
        s.planetCardIdx = idx;
      }),
    setSelectedCmdId: (id) =>
      set((s) => {
        s.selectedCmdId = id;
      }),
    nextFocusedGroup: () =>
      set((s) => {
        s.focusedGroupIdx += 1;
      }),
    setLoading: (v) =>
      set((s) => {
        s.loading = v;
      }),
  })),
);
