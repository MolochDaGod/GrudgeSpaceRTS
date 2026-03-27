/**
 * hotkeys.ts — Centralised, editable hotkey configuration.
 *
 * Every gameplay key binding lives here. The settings panel reads from and
 * writes to this module; all key handlers call getKey(action) instead of
 * comparing against hardcoded strings.
 *
 * Persisted in localStorage under STORAGE_KEY.
 */

const STORAGE_KEY = 'gruda_hotkeys';

// ── Action IDs ───────────────────────────────────────────────────
export type HotkeyAction =
  // ── Space RTS: Camera ──────────────────────────────────────────
  | 'cam_pan_forward'
  | 'cam_pan_back'
  | 'cam_pan_left'
  | 'cam_pan_right'
  | 'cam_orbit_left'
  | 'cam_orbit_right'
  // ── Space RTS: Unit Commands ───────────────────────────────────
  | 'cmd_attack_move'
  | 'cmd_hold'
  | 'cmd_patrol'
  | 'cmd_split'
  | 'cmd_deselect'
  | 'cmd_select_flagship'
  // ── Space RTS: Abilities ───────────────────────────────────────
  | 'ability_slot_w'
  | 'ability_slot_r'
  | 'ability_slot_t'
  // ── Space RTS: Bookmarks ───────────────────────────────────────
  | 'bookmark_goto_1'
  | 'bookmark_goto_2'
  | 'bookmark_goto_3'
  | 'bookmark_goto_4'
  // ── HUD Panels ─────────────────────────────────────────────────
  | 'hud_starmap'
  | 'hud_log'
  | 'hud_inventory'
  | 'hud_skills'
  | 'hud_commander'
  | 'hud_planet_list'
  | 'hud_cycle_group'
  // ── Ground Combat ──────────────────────────────────────────────
  | 'gc_forward'
  | 'gc_back'
  | 'gc_left'
  | 'gc_right'
  | 'gc_sprint'
  | 'gc_dodge'
  | 'gc_lock_on'
  | 'gc_free_cam';

// ── Category labels ──────────────────────────────────────────────
export type HotkeyCategory =
  | 'Space RTS — Camera'
  | 'Space RTS — Commands'
  | 'Space RTS — Abilities'
  | 'Space RTS — Bookmarks'
  | 'HUD Panels'
  | 'Ground Combat';

// ── Full definition per action ────────────────────────────────────
export interface HotkeyDef {
  action: HotkeyAction;
  category: HotkeyCategory;
  label: string;
  description: string;
  /** Whether this is a held-key (continuous) vs press-once action. */
  continuous: boolean;
  /** If true, cannot be rebound (fixed engine behaviour). */
  readonly?: boolean;
}

export const HOTKEY_DEFS: HotkeyDef[] = [
  // ── Camera ────────────────────────────────────────────────────
  {
    action: 'cam_pan_forward',
    category: 'Space RTS — Camera',
    label: 'Pan Forward',
    description: 'Scroll camera toward top of map',
    continuous: true,
  },
  {
    action: 'cam_pan_back',
    category: 'Space RTS — Camera',
    label: 'Pan Back',
    description: 'Scroll camera toward bottom of map',
    continuous: true,
  },
  { action: 'cam_pan_left', category: 'Space RTS — Camera', label: 'Pan Left', description: 'Scroll camera left', continuous: true },
  { action: 'cam_pan_right', category: 'Space RTS — Camera', label: 'Pan Right', description: 'Scroll camera right', continuous: true },
  {
    action: 'cam_orbit_left',
    category: 'Space RTS — Camera',
    label: 'Orbit Left',
    description: 'Rotate camera counter-clockwise',
    continuous: true,
  },
  {
    action: 'cam_orbit_right',
    category: 'Space RTS — Camera',
    label: 'Orbit Right',
    description: 'Rotate camera clockwise',
    continuous: true,
  },
  // ── Commands ──────────────────────────────────────────────────
  {
    action: 'cmd_attack_move',
    category: 'Space RTS — Commands',
    label: 'Attack-Move',
    description: 'Issue attack-move command (ships engage on path)',
    continuous: false,
  },
  {
    action: 'cmd_hold',
    category: 'Space RTS — Commands',
    label: 'Hold Position',
    description: 'Selected ships hold and defend in place',
    continuous: false,
  },
  {
    action: 'cmd_patrol',
    category: 'Space RTS — Commands',
    label: 'Patrol',
    description: 'Enter patrol mode — RMB sets patrol waypoints',
    continuous: false,
  },
  {
    action: 'cmd_split',
    category: 'Space RTS — Commands',
    label: 'Split Selection',
    description: 'Split selected group into two equal sub-groups',
    continuous: false,
  },
  {
    action: 'cmd_deselect',
    category: 'Space RTS — Commands',
    label: 'Deselect / Cancel',
    description: 'Deselect all units, cancel pending command mode',
    continuous: false,
  },
  {
    action: 'cmd_select_flagship',
    category: 'Space RTS — Commands',
    label: 'Select Flagship',
    description: 'Select and centre camera on your flagship',
    continuous: false,
  },
  // ── Abilities ─────────────────────────────────────────────────
  {
    action: 'ability_slot_w',
    category: 'Space RTS — Abilities',
    label: 'Ability Slot W',
    description: 'Activate first ship ability (slot W)',
    continuous: false,
  },
  {
    action: 'ability_slot_r',
    category: 'Space RTS — Abilities',
    label: 'Ability Slot R',
    description: 'Activate second ship ability (slot R)',
    continuous: false,
  },
  {
    action: 'ability_slot_t',
    category: 'Space RTS — Abilities',
    label: 'Ability Slot T',
    description: 'Activate third ability — Deploy Mine on scouts',
    continuous: false,
  },
  // ── Bookmarks ─────────────────────────────────────────────────
  {
    action: 'bookmark_goto_1',
    category: 'Space RTS — Bookmarks',
    label: 'Bookmark 1 (Flagship)',
    description: 'Select flagship; Ctrl+key sets bookmark',
    continuous: false,
  },
  {
    action: 'bookmark_goto_2',
    category: 'Space RTS — Bookmarks',
    label: 'Bookmark 2',
    description: 'Jump camera to bookmark 2; Ctrl to set',
    continuous: false,
  },
  {
    action: 'bookmark_goto_3',
    category: 'Space RTS — Bookmarks',
    label: 'Bookmark 3',
    description: 'Jump camera to bookmark 3; Ctrl to set',
    continuous: false,
  },
  {
    action: 'bookmark_goto_4',
    category: 'Space RTS — Bookmarks',
    label: 'Bookmark 4',
    description: 'Jump camera to bookmark 4; Ctrl to set',
    continuous: false,
  },
  // ── HUD Panels ────────────────────────────────────────────────
  {
    action: 'hud_starmap',
    category: 'HUD Panels',
    label: 'Star Map',
    description: 'Toggle the galaxy/sector star map overlay',
    continuous: false,
  },
  {
    action: 'hud_log',
    category: 'HUD Panels',
    label: "Captain's Log",
    description: "Open the campaign Captain's Log journal",
    continuous: false,
  },
  {
    action: 'hud_inventory',
    category: 'HUD Panels',
    label: 'Inventory',
    description: 'Open the ship inventory and equipment panel',
    continuous: false,
  },
  {
    action: 'hud_skills',
    category: 'HUD Panels',
    label: 'Skill Tree',
    description: 'Open the unified Spark skill tree',
    continuous: false,
  },
  {
    action: 'hud_commander',
    category: 'HUD Panels',
    label: 'Commander Panel',
    description: 'Open the commander character and fleet panel',
    continuous: false,
  },
  {
    action: 'hud_planet_list',
    category: 'HUD Panels',
    label: 'Planet List',
    description: 'Toggle the planet info / surface view card',
    continuous: false,
  },
  {
    action: 'hud_cycle_group',
    category: 'HUD Panels',
    label: 'Cycle Unit Group',
    description: 'Cycle focus through different unit types in selection',
    continuous: false,
  },
  // ── Ground Combat ─────────────────────────────────────────────
  {
    action: 'gc_forward',
    category: 'Ground Combat',
    label: 'Move Forward',
    description: 'Move character forward (camera-relative)',
    continuous: true,
  },
  {
    action: 'gc_back',
    category: 'Ground Combat',
    label: 'Move Back',
    description: 'Move character backward (camera-relative)',
    continuous: true,
  },
  { action: 'gc_left', category: 'Ground Combat', label: 'Move Left', description: 'Strafe / move left', continuous: true },
  { action: 'gc_right', category: 'Ground Combat', label: 'Move Right', description: 'Strafe / move right', continuous: true },
  { action: 'gc_sprint', category: 'Ground Combat', label: 'Sprint', description: 'Hold to sprint (drains stamina)', continuous: true },
  {
    action: 'gc_dodge',
    category: 'Ground Combat',
    label: 'Dodge / Roll',
    description: 'Roll in movement direction — grants i-frames',
    continuous: false,
  },
  {
    action: 'gc_lock_on',
    category: 'Ground Combat',
    label: 'Lock-On Target',
    description: 'Lock camera and facing to nearest enemy',
    continuous: false,
  },
  {
    action: 'gc_free_cam',
    category: 'Ground Combat',
    label: 'Free Camera',
    description: 'Toggle editor fly-cam (game paused) — P key',
    continuous: false,
  },
];

// ── Default key bindings ─────────────────────────────────────────
export const DEFAULT_KEYS: Record<HotkeyAction, string> = {
  // Camera (Space RTS)
  cam_pan_forward: 'w',
  cam_pan_back: 's',
  cam_pan_left: 'a',
  cam_pan_right: 'd',
  cam_orbit_left: 'q',
  cam_orbit_right: 'e',
  // Commands
  cmd_attack_move: 'g',
  cmd_hold: 'h',
  cmd_patrol: 'p',
  cmd_split: 'v',
  cmd_deselect: 'escape',
  cmd_select_flagship: 'f1',
  // Abilities
  ability_slot_w: 'w',
  ability_slot_r: 'r',
  ability_slot_t: 't',
  // Bookmarks
  bookmark_goto_1: 'f1',
  bookmark_goto_2: 'f2',
  bookmark_goto_3: 'f3',
  bookmark_goto_4: 'f4',
  // HUD Panels
  hud_starmap: 'm',
  hud_log: 'l',
  hud_inventory: 'i',
  hud_skills: 'k',
  hud_commander: 'c',
  hud_planet_list: 'f1',
  hud_cycle_group: 'tab',
  // Ground Combat
  gc_forward: 'w',
  gc_back: 's',
  gc_left: 'a',
  gc_right: 'd',
  gc_sprint: 'shift',
  gc_dodge: ' ',
  gc_lock_on: 'tab',
  gc_free_cam: 'p',
};

// ── Runtime config (mutable, persisted) ──────────────────────────
let _keys: Record<HotkeyAction, string> = { ...DEFAULT_KEYS };

export function loadHotkeys(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Record<HotkeyAction, string>>;
      for (const action of Object.keys(DEFAULT_KEYS) as HotkeyAction[]) {
        if (parsed[action]) _keys[action] = parsed[action]!;
      }
    }
  } catch {
    // Storage unavailable — use defaults
  }
}

export function saveHotkeys(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_keys));
  } catch {
    /* ignore */
  }
}

/** Get the currently bound key for an action (lowercase). */
export function getKey(action: HotkeyAction): string {
  return _keys[action] ?? DEFAULT_KEYS[action];
}

/** Rebind an action to a new key and persist. */
export function setKey(action: HotkeyAction, key: string): void {
  _keys[action] = key.toLowerCase();
  saveHotkeys();
}

/** Reset all hotkeys to defaults and persist. */
export function resetAllHotkeys(): void {
  _keys = { ...DEFAULT_KEYS };
  saveHotkeys();
}

/** Reset all hotkeys in a category to defaults and persist. */
export function resetCategoryHotkeys(category: HotkeyCategory): void {
  for (const def of HOTKEY_DEFS) {
    if (def.category === category) {
      _keys[def.action] = DEFAULT_KEYS[def.action];
    }
  }
  saveHotkeys();
}

/**
 * Return all actions that share the same key as `action`.
 * Used to show conflicts in the settings UI.
 */
export function findConflicts(action: HotkeyAction): HotkeyAction[] {
  const k = getKey(action);
  return (Object.keys(_keys) as HotkeyAction[]).filter((a) => a !== action && _keys[a] === k);
}

/** Human-readable display string for a key (e.g. ' ' → 'Space', 'escape' → 'Esc'). */
export function keyDisplayName(key: string): string {
  const MAP: Record<string, string> = {
    ' ': 'Space',
    escape: 'Esc',
    arrowup: '↑',
    arrowdown: '↓',
    arrowleft: '←',
    arrowright: '→',
    tab: 'Tab',
    shift: 'Shift',
    control: 'Ctrl',
    alt: 'Alt',
    meta: 'Meta',
    f1: 'F1',
    f2: 'F2',
    f3: 'F3',
    f4: 'F4',
    f5: 'F5',
    f6: 'F6',
    f7: 'F7',
    f8: 'F8',
    backspace: 'Bksp',
    delete: 'Del',
    enter: 'Enter',
  };
  return MAP[key.toLowerCase()] ?? key.toUpperCase();
}

// Load on module init
loadHotkeys();
