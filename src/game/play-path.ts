export const PLAY_PATH_INTRO_TARGET = {
  screen: 'menu',
  commanderSelectOpen: true,
} as const;

const MODIFIER_ONLY_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta']);

export function shouldDismissIntroOnKey(e: Pick<KeyboardEvent, 'key'>): boolean {
  return e.key.length > 0 && !MODIFIER_ONLY_KEYS.has(e.key);
}
