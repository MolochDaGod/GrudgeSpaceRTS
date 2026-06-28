/**
 * warlords-characters.ts — D1/R2 character fetch for Souls lobby & Hero RTS.
 */

import { authFetch, getUser } from './grudge-auth';

const CDN = import.meta.env.VITE_ASSET_CDN ?? 'https://assets.grudge-studio.com';

export interface WarlordsCharacter {
  characterId: string;
  name: string;
  race: string;
  heroClass: string;
  modelPath?: string;
  isActive?: boolean;
  appearance?: Record<string, unknown>;
  equipment?: Record<string, unknown>;
}

/** grudge6 race FBX paths on R2 CDN */
const RACE_MODELS: Record<string, string> = {
  human: `${CDN}/models/grudge6/races/WK_Characters.fbx`,
  barbarian: `${CDN}/models/grudge6/races/BRB_Characters.fbx`,
  elf: `${CDN}/models/grudge6/races/ELF_Characters.fbx`,
  dwarf: `${CDN}/models/grudge6/races/DWF_Characters.fbx`,
  orc: `${CDN}/models/grudge6/races/ORC_Characters.fbx`,
  undead: `${CDN}/models/grudge6/races/UD_Characters.fbx`,
  worge: `${CDN}/models/grudge6/races/WK_Characters.fbx`,
};

const RACE_LABELS: Record<string, string> = {
  human: 'Crusade Human',
  barbarian: 'Barbarian',
  elf: 'Fabled Elf',
  dwarf: 'Dwarf',
  orc: 'Orc',
  undead: 'Undead',
  worge: 'Worge',
};

export function raceModelUrl(race: string): string {
  return RACE_MODELS[race] ?? RACE_MODELS.human;
}

export function raceLabel(race: string): string {
  return RACE_LABELS[race] ?? race;
}

/** Guest roster when not logged in */
export const GUEST_CHARACTERS: WarlordsCharacter[] = [
  { characterId: 'guest-warrior', name: 'Iron Vanguard', race: 'human', heroClass: 'warrior' },
  { characterId: 'guest-berserker', name: 'Blood Fang', race: 'barbarian', heroClass: 'berserker' },
  { characterId: 'guest-ranger', name: 'Shadow Stalker', race: 'elf', heroClass: 'ranger' },
  { characterId: 'guest-mage', name: 'Arcane Warden', race: 'elf', heroClass: 'mage' },
  { characterId: 'guest-rogue', name: 'Night Blade', race: 'dwarf', heroClass: 'rogue' },
  { characterId: 'guest-gunslinger', name: 'Rust Reaper', race: 'orc', heroClass: 'gunslinger' },
];

export async function fetchWarlordsCharacters(): Promise<WarlordsCharacter[]> {
  const user = getUser();
  if (!user?.grudgeId || user.isGuest) return GUEST_CHARACTERS;

  try {
    const res = await authFetch(`/api/characters/${encodeURIComponent(user.grudgeId)}`);
    if (!res.ok) return GUEST_CHARACTERS;
    const data = await res.json();
    const rows: WarlordsCharacter[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.characters)
        ? data.characters
        : data?.characterId
          ? [data]
          : [];
    if (rows.length === 0) return GUEST_CHARACTERS;
    return rows.map((c) => ({
      characterId: c.characterId ?? (c as { id?: string }).id ?? 'unknown',
      name: c.name ?? 'Hero',
      race: c.race ?? 'human',
      heroClass: c.heroClass ?? 'warrior',
      modelPath: c.modelPath ?? raceModelUrl(c.race ?? 'human'),
      isActive: c.isActive,
      appearance: c.appearance,
      equipment: c.equipment,
    }));
  } catch (err) {
    console.warn('[warlords-characters] fetch failed:', err);
    return GUEST_CHARACTERS;
  }
}

/** Map hero class / race to ground combat CharacterClass */
export function toCombatClass(heroClass: string, race: string): import('./ground-combat').CharacterClass {
  const hc = heroClass.toLowerCase();
  if (hc.includes('berserk') || hc.includes('barbarian')) return 'berserker';
  if (hc.includes('rang') || hc.includes('arch')) return 'ranger';
  if (hc.includes('mage') || hc.includes('wizard') || hc.includes('sorc')) return 'mage';
  if (hc.includes('rogue') || hc.includes('assassin') || race === 'elf') return 'rogue';
  if (hc.includes('gun') || hc.includes('rifle')) return 'gunslinger';
  if (hc.includes('warrior') || hc.includes('knight') || hc.includes('paladin')) return 'warrior';
  return 'warrior';
}