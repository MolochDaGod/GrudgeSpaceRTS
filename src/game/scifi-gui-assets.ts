/**
 * ── Sci-Fi GUI Asset Registry ─────────────────────────────────────────
 * All craftpix sci-fi GUI panel assets with paths and layout measurements.
 * Color variants: green (player/default), purple (void), gold (construct/legion).
 */

const G = '/assets/space/ui/scifi-gui';

export type GuiColor = 'green' | 'purple' | 'gold';

// ── Bars (SkillsLine) ─────────────────────────────────────────────────
// Single image 1020×745 containing 3 stacked bars:
//   Top bar (fleet):    ~y0-230, hex grid 2 rows × 13 cols
//   Middle bar (cmd):   ~y250-480, 9 square slots with +/⚡ endpoints
//   Bottom bar (queue): ~y500-720, circles on ends + 10 rect slots
export const BARS = {
  green: `${G}/bars-green.png`,
  purple: `${G}/bars-purple.png`,
  gold: `${G}/bars-gold.png`,
} as const;

// Bar region measurements (% of full 1020×745 image)
export const BAR_REGIONS = {
  /** Fleet bar — top section with hex grid (commander + 12 ships) */
  fleet: { top: 0, height: 230, imgH: 745 },
  /** Command card — middle with 9 square slots */
  command: { top: 250, height: 225, imgH: 745 },
  /** Build queue — bottom with circles + slots */
  queue: { top: 500, height: 230, imgH: 745 },
} as const;

// Slot positions within each bar (as % from left/top of bar region)
// Fleet bar: 13 hex cells in top row, health bars below
export const FLEET_SLOTS = {
  count: 13,
  // First slot (commander) is slightly larger
  startX: 5.5, // % from left edge
  slotW: 6.4, // % width per hex cell
  gapX: 0.5, // % gap between cells
  topRowY: 18, // % from top of fleet region
  slotH: 38, // % height of hex cell
  healthBarY: 62, // % from top where health bar starts
  healthBarH: 8, // % height of health bar
};

// Command card: 9 square slots
export const CMD_SLOTS = {
  count: 9,
  startX: 10.5, // % from left
  slotW: 8.2, // % width per slot
  gapX: 0.8,
  topY: 22, // % from top of command region
  slotH: 55, // % height
};

// Build queue: ~10 slots between circles
export const QUEUE_SLOTS = {
  count: 10,
  startX: 12, // % from left (after left circle)
  slotW: 7.2, // % width per slot
  gapX: 0.3,
  topY: 18, // % from top of queue region
  slotH: 60, // % height
  circleLeftX: 1, // % left circle center
  circleRightX: 93, // % right circle center
  circleY: 45, // % from top
  circleR: 5, // % radius
};

// ── Skill Trees ───────────────────────────────────────────────────────
export const SKILLTREES = {
  green: `${G}/skilltree-green.png`,
  purple: `${G}/skilltree-purple.png`,
  gold: `${G}/skilltree-gold.png`,
} as const;

// ── Canvas Button Spritesheets ────────────────────────────────────────
export const BUTTONS = {
  green: `${G}/buttons-green.png`,
  purple: `${G}/buttons-purple.png`,
  gold: `${G}/buttons-gold.png`,
} as const;

// ── Icon Menu (attack/shield/run/walk action buttons) ─────────────────
export const ICONS_MENU = {
  green: `${G}/icons-menu-green.png`,
  purple: `${G}/icons-menu-purple.png`,
  gold: `${G}/icons-menu-gold.png`,
} as const;

// Icon positions within the IconsMenu spritesheet (1440×960)
// Top row: 4 octagonal icons (attack, shield, run, walk)
// Bottom row: 4 hex icons with sub-icons
export const ICON_MENU_CLIPS = {
  attack: { x: 0, y: 0, w: 360, h: 360 },
  shield: { x: 360, y: 0, w: 360, h: 360 },
  run: { x: 720, y: 0, w: 360, h: 360 },
  walk: { x: 1080, y: 0, w: 360, h: 360 },
  // Bottom row hex variants (larger, with sub-buttons)
  attackHex: { x: 0, y: 480, w: 360, h: 480 },
  shieldHex: { x: 360, y: 480, w: 360, h: 480 },
  runHex: { x: 720, y: 480, w: 360, h: 480 },
  walkHex: { x: 1080, y: 480, w: 360, h: 480 },
};

// ── Menu Icons (settings, inventory, log, etc.) ───────────────────────
export const ICONS = {
  green: `${G}/icons-green.png`,
  purple: `${G}/icons-purple.png`,
  gold: `${G}/icons-gold.png`,
} as const;

// Icon positions within Icons spritesheet (1440×960) — 9 icons in 3+3+2+1 layout
export const MENU_ICON_CLIPS = {
  log: { x: 0, y: 0, w: 360, h: 320 }, // file/document
  settings: { x: 360, y: 0, w: 360, h: 320 }, // gear
  inventory: { x: 720, y: 0, w: 360, h: 320 }, // backpack
  checklist: { x: 1080, y: 0, w: 360, h: 320 }, // clipboard
  starmap: { x: 180, y: 320, w: 360, h: 320 }, // star/medal
  social: { x: 540, y: 320, w: 360, h: 320 }, // people
  save: { x: 900, y: 320, w: 360, h: 320 }, // floppy
  mail: { x: 180, y: 640, w: 360, h: 320 }, // envelope
  databook: { x: 540, y: 640, w: 360, h: 320 }, // book/circuit
};

// ── Journal (Captain's Log / AI Chat) ─────────────────────────────────
export const JOURNAL = {
  green: `${G}/journal-green.png`,
  purple: `${G}/journal-purple.png`,
  gold: `${G}/journal-gold.png`,
} as const;

// Journal layout (1122×691)
export const JOURNAL_LAYOUT = {
  sidebar: { x: 4.5, y: 13, w: 26, h: 72 }, // % — left list panel
  content: { x: 33, y: 10, w: 62, h: 60 }, // % — right text area
  actions: { x: 39, y: 80, w: 51, h: 14 }, // % — bottom 4 action slots
  sidebarRows: 10,
  actionSlots: 4,
};

// ── Inventory (Fleet & Planet Overview) ───────────────────────────────
export const INVENTORY = {
  green: `${G}/inventory-green.png`,
  purple: `${G}/inventory-purple.png`,
  gold: `${G}/inventory-gold.png`,
} as const;

// Inventory grid layout (635×793)
export const INVENTORY_LAYOUT = {
  grid: { x: 9, y: 12, w: 82, h: 75 }, // % — grid area
  cols: 5,
  rows: 6,
  slotsPerPage: 30,
  pageNavY: 92, // % from top — pagination arrows
};

// ── Empty Containers ──────────────────────────────────────────────────
export const CONTAINERS = {
  green: `${G}/container-green.png`,
  purple: `${G}/container-purple.png`,
  gold: `${G}/container-gold.png`,
} as const;

// ── Chat Frames (general-purpose canvas backgrounds) ──────────────────
export const CHAT_TEXT = {
  green: `${G}/chat-text-green.png`,
  purple: `${G}/chat-text-purple.png`,
  gold: `${G}/chat-text-gold.png`,
} as const;

export const CHAT_RADAR = {
  green: `${G}/chat-radar-green.png`,
  purple: `${G}/chat-radar-purple.png`,
  gold: `${G}/chat-radar-gold.png`,
} as const;

// ── Avatars ───────────────────────────────────────────────────────────
export const AVATARS = {
  green: `${G}/avatar-green.png`,
  purple: `${G}/avatar-purple.png`,
  gold: `${G}/avatar-gold.png`,
} as const;
