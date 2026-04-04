/**
 * ΓöÇΓöÇ Sci-Fi GUI Asset Registry ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
 * All craftpix sci-fi GUI panel assets with paths and layout measurements.
 * Color variants: green (player/default), purple (void), gold (construct/legion).
 */

const G = '/assets/space/ui/scifi-gui';

export type GuiColor = 'green' | 'purple' | 'gold';

// ΓöÇΓöÇ Bars (SkillsLine) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// Single image 1020├ù745 containing 3 stacked bars:
//   Top bar (fleet):    ~y0-230, hex grid 2 rows ├ù 13 cols
//   Middle bar (cmd):   ~y250-480, 9 square slots with +/ΓÜí endpoints
//   Bottom bar (queue): ~y500-720, circles on ends + 10 rect slots
export const BARS = {
  green: `${G}/bars-green.png`,
  purple: `${G}/bars-purple.png`,
  gold: `${G}/bars-gold.png`,
} as const;

// Bar region measurements (% of full 1020├ù745 image)
export const BAR_REGIONS = {
  /** Fleet bar ΓÇö top section with hex grid (commander + 12 ships) */
  fleet: { top: 0, height: 230, imgH: 745 },
  /** Command card ΓÇö middle with 9 square slots */
  command: { top: 250, height: 225, imgH: 745 },
  /** Build queue ΓÇö bottom with circles + slots */
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

// ΓöÇΓöÇ Skill Trees ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const SKILLTREES = {
  green: `${G}/skilltree-green.png`,
  purple: `${G}/skilltree-purple.png`,
  gold: `${G}/skilltree-gold.png`,
} as const;

// ΓöÇΓöÇ Canvas Button Spritesheets ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const BUTTONS = {
  green: `${G}/buttons-green.png`,
  purple: `${G}/buttons-purple.png`,
  gold: `${G}/buttons-gold.png`,
} as const;

// ΓöÇΓöÇ Icon Menu (attack/shield/run/walk action buttons) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const ICONS_MENU = {
  green: `${G}/icons-menu-green.png`,
  purple: `${G}/icons-menu-purple.png`,
  gold: `${G}/icons-menu-gold.png`,
} as const;

// Icon positions within the IconsMenu spritesheet (1440├ù960)
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

// ΓöÇΓöÇ Menu Icons (settings, inventory, log, etc.) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const ICONS = {
  green: `${G}/icons-green.png`,
  purple: `${G}/icons-purple.png`,
  gold: `${G}/icons-gold.png`,
} as const;

// Icon positions within Icons spritesheet (1440├ù960) ΓÇö 9 icons in 3+3+2+1 layout
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

// ΓöÇΓöÇ Journal (Captain's Log / AI Chat) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const JOURNAL = {
  green: `${G}/journal-green.png`,
  purple: `${G}/journal-purple.png`,
  gold: `${G}/journal-gold.png`,
} as const;

// Journal layout (1122├ù691)
export const JOURNAL_LAYOUT = {
  sidebar: { x: 4.5, y: 13, w: 26, h: 72 }, // % ΓÇö left list panel
  content: { x: 33, y: 10, w: 62, h: 60 }, // % ΓÇö right text area
  actions: { x: 39, y: 80, w: 51, h: 14 }, // % ΓÇö bottom 4 action slots
  sidebarRows: 10,
  actionSlots: 4,
};

// ΓöÇΓöÇ Inventory (Fleet & Planet Overview) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const INVENTORY = {
  green: `${G}/inventory-green.png`,
  purple: `${G}/inventory-purple.png`,
  gold: `${G}/inventory-gold.png`,
} as const;

// Inventory grid layout (635├ù793)
export const INVENTORY_LAYOUT = {
  grid: { x: 9, y: 12, w: 82, h: 75 }, // % ΓÇö grid area
  cols: 5,
  rows: 6,
  slotsPerPage: 30,
  pageNavY: 92, // % from top ΓÇö pagination arrows
};

// ΓöÇΓöÇ Empty Containers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const CONTAINERS = {
  green: `${G}/container-green.png`,
  purple: `${G}/container-purple.png`,
  gold: `${G}/container-gold.png`,
} as const;

// ΓöÇΓöÇ Chat Frames (general-purpose canvas backgrounds) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

// ΓöÇΓöÇ Avatars ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const AVATARS = {
  green: `${G}/avatar-green.png`,
  purple: `${G}/avatar-purple.png`,
  gold: `${G}/avatar-gold.png`,
} as const;

// ΓöÇΓöÇ Character Panel (Commander UI) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const CHARACTER = {
  green: `${G}/character-green.png`,
  purple: `${G}/character-purple.png`,
  gold: `${G}/character-gold.png`,
} as const;

// Character panel layout (805├ù700 approx)
// Left: wireframe body with 8 hex equipment slots
// Right: stats panel with name bars + stat bars + upgrade buttons
export const CHARACTER_LAYOUT = {
  // Hex equipment slot positions (% from panel top-left)
  hexSlots: [
    { id: 'head', x: 30, y: 7, w: 9, h: 10 },
    { id: 'shoulders', x: 18, y: 20, w: 9, h: 10 },
    { id: 'torso', x: 30, y: 20, w: 9, h: 10 },
    { id: 'hands_l', x: 10, y: 38, w: 9, h: 10 },
    { id: 'hands_r', x: 38, y: 38, w: 9, h: 10 },
    { id: 'legs', x: 24, y: 55, w: 9, h: 10 },
    { id: 'feet_l', x: 18, y: 72, w: 9, h: 10 },
    { id: 'feet_r', x: 30, y: 72, w: 9, h: 10 },
  ],
  // Right stats area
  statsPanel: { x: 52, y: 15, w: 42, h: 72 },
  // Name bars (3 rows at top of stats panel)
  nameBars: { x: 55, y: 18, w: 36, h: 4, gap: 1.5, count: 3 },
  // Stat bars (4 rows below name, with +/- buttons)
  statBars: { x: 55, y: 44, w: 28, h: 5, gap: 3, count: 4 },
  // +/- button column right of stat bars
  statButtons: { x: 85, y: 44, w: 4, h: 5, gap: 3 },
};

// ΓöÇΓöÇ Skill Tree Node Positions ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// Positions of the 11 octagonal node slots on the Skilltree frame (742├ù793)
// Measured as % from the panelΓÇÖs content area top-left.
// Layout matches the mockup: pyramid of connected nodes.
export const SKILLTREE_NODES = [
  // Row 1 (top) ΓÇö 1 node
  { idx: 0, x: 43, y: 14, w: 13, h: 10, size: 'large' },
  // Row 2 ΓÇö 2 nodes
  { idx: 1, x: 24, y: 28, w: 10, h: 8, size: 'small' },
  { idx: 2, x: 55, y: 25, w: 13, h: 10, size: 'large' },
  // Row 3 ΓÇö 3 nodes
  { idx: 3, x: 12, y: 44, w: 13, h: 10, size: 'large' },
  { idx: 4, x: 38, y: 44, w: 13, h: 10, size: 'large' },
  { idx: 5, x: 62, y: 44, w: 10, h: 8, size: 'small' },
  // Row 4 (bottom) ΓÇö 3 nodes
  { idx: 6, x: 12, y: 64, w: 13, h: 10, size: 'large' },
  { idx: 7, x: 32, y: 64, w: 10, h: 8, size: 'small' },
  { idx: 8, x: 60, y: 68, w: 10, h: 8, size: 'small' },
] as const;

// Tab categories matching the ATTACK/DEFENCE/CYBER/HEAL tabs on the frame
export const SKILLTREE_TABS = [
  { id: 'attack', label: 'ATTACK', trees: ['forge'] },
  { id: 'defence', label: 'DEFENCE', trees: ['tide', 'void'] },
  { id: 'cyber', label: 'CYBER', trees: ['cyber'] },
  { id: 'support', label: 'SUPPORT', trees: ['prism', 'vortex', 'command'] },
] as const;
