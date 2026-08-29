export const PLAY_PATH_INTRO_TARGET = {
  screen: 'menu' as const,
  commanderSelectOpen: true,
};

export type PlayScreen =
  | 'intro'
  | 'menu'
  | 'codex'
  | 'howto'
  | 'editor'
  | 'playing'
  | 'ground_combat'
  | 'ground_rts'
  | 'universe';

/** Canonical URLs for each mode. Space RTS is /space; /game and /play alias it. */
export const ROUTE_TO_SCREEN: Record<string, PlayScreen> = {
  '/': 'menu',
  '/codex': 'codex',
  '/editor': 'editor',
  '/howto': 'howto',
  '/game': 'playing',
  '/space': 'playing',
  '/play': 'playing',
  '/ground': 'ground_combat',
  '/ground-rts': 'ground_rts',
  '/universe': 'universe',
};

export const SCREEN_TO_ROUTE: Partial<Record<PlayScreen, string>> = {
  menu: '/',
  codex: '/codex',
  editor: '/editor',
  howto: '/howto',
  playing: '/space',
  ground_combat: '/ground',
  ground_rts: '/ground-rts',
  universe: '/universe',
};

const SPACE_PLAY_PATHS = new Set(['/game', '/space', '/play']);
const DEEP_PLAY_PATHS = new Set([...SPACE_PLAY_PATHS, '/ground', '/ground-rts', '/universe', '/codex', '/editor', '/howto']);

export function screenFromPath(path: string): PlayScreen {
  const clean = path.replace(/\/+$/, '') || '/';
  return ROUTE_TO_SCREEN[clean] ?? 'menu';
}

export function isSpacePlayPath(path: string): boolean {
  const clean = path.replace(/\/+$/, '') || '/';
  return SPACE_PLAY_PATHS.has(clean);
}

/** Splash only on `/`. Deep links skip it so /space and /ground boot the game. */
export function shouldShowSplash(path: string, search: string): boolean {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  if (params.has('skipIntro') || params.has('hub')) return false;
  const clean = path.replace(/\/+$/, '') || '/';
  if (DEEP_PLAY_PATHS.has(clean) && clean !== '/') return false;
  return clean === '/';
}

const MODIFIER_ONLY_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta']);

export function shouldDismissIntroOnKey(e: Pick<KeyboardEvent, 'key'>): boolean {
  return e.key.length > 0 && !MODIFIER_ONLY_KEYS.has(e.key);
}
