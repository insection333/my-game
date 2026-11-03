// Honours: what deeds unlock, chosen on the Deeds tab and shown to everyone. A title beside your name
// on the hiscores and on the Hearth's plaque; a banner's colour on the plaque and your hiscores row;
// a frame around the plaque. Points unlock some, particular deeds the rest (a 99 in a skill, the whole
// log, the Ashen Peaks cleared).
import { fmt, t } from '@idle-clash/content';
import type { State } from '@idle-clash/kernel';
import { allSkills } from '../shared/standing.ts';
import { wordsOf } from './content.ts';
import { deedById, pointsOf } from './list.ts';
import { deedsOf } from './state.ts';

export type HonourKind = 'title' | 'banner' | 'frame' | 'picture' | 'glow' | 'badge' | 'scene';
/** Every kind, as a player chooses them (the honours sheet's order). */
export const HONOUR_KINDS: readonly HonourKind[] = ['picture', 'title', 'badge', 'frame', 'glow', 'banner', 'scene'];
export type Unlock = { points: number } | { deed: string } | { anyOf: () => string[]; text: string };
export interface Honour {
  id: string;
  kind: HonourKind;
  /** Null: everyone has it from the start. */
  unlock: Unlock | null;
}

const SKILL_TITLES: Record<string, string> = {
  woodcutting: 'forester',
  mining: 'delver',
  fishing: 'angler',
  runecraft: 'runeseer',
  smithing: 'forgemaster',
  cooking: 'feastmaker',
  fletching: 'master-fletcher',
  melee: 'blademaster',
  archery: 'sharpshooter',
  magic: 'archmage',
  hitpoints: 'unbroken',
};

/** The display pictures (session 43): twelve open to everyone (folk of the march and its beasts), fifteen
 *  foes and the three bosses. A picture's id is its icon's (`portrait-<id>`). */
export const PICTURES_OPEN = [
  'forester',
  'delver',
  'smith',
  'angler',
  'ranger',
  'mage',
  'knight',
  'stag',
  'wolf',
  'owl',
  'boar',
  'raven',
] as const;
export const PICTURE_FOES = [
  'hollow-rat',
  'goblin-slinger',
  'marsh-wisp',
  'orc-raider',
  'grave-wight',
  'hill-troll',
  'fell-huntsman',
  'bog-lurker',
  'drowned-acolyte',
  'mire-hulk',
  'bog-witch',
  'ash-troll',
  'ash-shaman',
  'obsidian-golem',
  'ember-sorcerer',
] as const;
export const PICTURE_BOSSES = ['troll-chief', 'drowned-warden', 'ember-wyrm'] as const;

const title = (id: string, unlock: Unlock): Honour => ({ id, kind: 'title', unlock });
const at = (points: number) => ({ points });
const by = (deed: string) => ({ deed });
const ninetyNines = () => allSkills().map((s) => `level-${s}-99`);
const firstKindlings = () => allSkills().map((s) => `kindled-${s}-1`);

export const HONOURS: readonly Honour[] = [
  // Titles: by points first (spaced over the year, as the year's simulation measures: about day 2, 5,
  // 30, 120, 265 and 345), then by deed.
  title('wayfarer', at(100)),
  title('stalwart', at(1_000)),
  title('renowned', at(2_500)),
  title('illustrious', at(4_500)),
  title('exalted', at(7_000)),
  title('mythic', at(10_000)),
  ...Object.entries(SKILL_TITLES).map(([skill, id]) => title(id, by(`level-${skill}-99`))),
  title('grandmaster', by('masters-40')),
  title('warlord', by('defeats-1000000')),
  title('peakbreaker', by('region-peaks')),
  title('curator', by('collector-all')),
  title('flamekeeper', by('fire-360')),
  title('magnate', by('gold-10000000')),
  title('paragon', by('rank-legend')),
  title('equilibrist', by('hidden-even')),
  title('wyrmslayer', by('boss-ember-wyrm')),
  title('trailblazer', by('runs-250')),
  title('kindled', { anyOf: firstKindlings, text: 'honour.unlock.anyKindled' }),
  title('everflame', by('kindlings-10')),
  // Banners: the woad everyone flies, and a colour for each region cleared and more.
  { id: 'woad', kind: 'banner', unlock: null },
  { id: 'moss', kind: 'banner', unlock: by('region-march') },
  { id: 'fen', kind: 'banner', unlock: by('region-fen') },
  { id: 'ember', kind: 'banner', unlock: by('region-peaks') },
  { id: 'night', kind: 'banner', unlock: at(2_000) },
  { id: 'gold', kind: 'banner', unlock: by('gold-1000000') },
  { id: 'dawn', kind: 'banner', unlock: { anyOf: ninetyNines, text: 'honour.unlock.any99' } },
  // Frames: by points, then two of prestige (session 43), for a castle grown great and a war long fought.
  { id: 'bronze', kind: 'frame', unlock: at(500) },
  { id: 'silver', kind: 'frame', unlock: at(2_000) },
  { id: 'gold', kind: 'frame', unlock: at(4_000) },
  { id: 'dawn', kind: 'frame', unlock: at(8_000) },
  { id: 'royal', kind: 'frame', unlock: by('castle-level-25') },
  { id: 'obsidian', kind: 'frame', unlock: by('defeats-250000') },
  // Pictures (session 43): twelve for everyone from the first day, a foe's once a hundred of them have
  // fallen to you, a boss's once beaten.
  ...PICTURES_OPEN.map((id): Honour => ({ id, kind: 'picture', unlock: null })),
  ...PICTURE_FOES.map((id): Honour => ({ id, kind: 'picture', unlock: by(`foe-${id}-100`) })),
  ...PICTURE_BOSSES.map((id): Honour => ({ id, kind: 'picture', unlock: by(`boss-${id}`) })),
  // Glows round the picture, slow and animated: a veteran's, each for a mid- to end-game milestone.
  { id: 'verdant', kind: 'glow', unlock: by('rank-knight') },
  { id: 'ember', kind: 'glow', unlock: by('routs-10') },
  { id: 'frost', kind: 'glow', unlock: by('boss-drowned-warden-50') },
  { id: 'wyrmfire', kind: 'glow', unlock: by('boss-ember-wyrm-100') },
  { id: 'aurora', kind: 'glow', unlock: by('rank-legend') },
  // Badges beside the title: rare, each for a feat few reach.
  { id: 'tower', kind: 'badge', unlock: by('castle-level-25') },
  { id: 'skull', kind: 'badge', unlock: by('defeats-500000') },
  { id: 'star', kind: 'badge', unlock: by('collector-all') },
  { id: 'flame', kind: 'badge', unlock: by('kindlings-10') },
  { id: 'wyrm', kind: 'badge', unlock: by('boss-ember-wyrm-100') },
  { id: 'crown', kind: 'badge', unlock: by('rank-legend') },
  // The scene behind a profile: the march by day for everyone, by night, and the lord's own castle.
  { id: 'march', kind: 'scene', unlock: null },
  { id: 'night', kind: 'scene', unlock: by('fortresses-25') },
  { id: 'castle', kind: 'scene', unlock: by('castle-level-10') },
];

export const honourOf = (kind: HonourKind, id: string) => HONOURS.find((h) => h.kind === kind && h.id === id);
export const DEFAULT_BANNER = 'woad';
export const DEFAULT_PICTURE = 'forester';
export const DEFAULT_SCENE = 'march';

/** Whether an honour is unlocked, given the deeds done and the points they make. */
export function unlocked(h: Honour, done: Readonly<Record<string, number>>, points: number): boolean {
  if (!h.unlock) return true;
  if ('points' in h.unlock) return points >= h.unlock.points;
  if ('deed' in h.unlock) return Object.hasOwn(done, h.unlock.deed);
  return h.unlock.anyOf().some((id) => Object.hasOwn(done, id));
}

/** How an honour is unlocked, in words. */
export function unlockText(h: Honour): string {
  if (!h.unlock) return t('honour.unlock.always');
  if ('points' in h.unlock) return t('honour.unlock.points', { points: fmt.int(h.unlock.points) });
  if ('deed' in h.unlock) {
    const d = deedById(h.unlock.deed);
    return d?.hidden
      ? t('honour.unlock.hidden')
      : t('honour.unlock.deed', { deed: d ? wordsOf(d, 'name') : h.unlock.deed });
  }
  return t(h.unlock.text);
}

export const honourName = (h: Pick<Honour, 'kind' | 'id'>) => t(`honour.${h.kind}.${h.id}`);

/** The honours a player shows, each still unlocked (a chosen honour is checked again as it is read). */
export interface Shown {
  title: string | null;
  banner: string;
  frame: string | null;
  picture: string;
  glow: string | null;
  badge: string | null;
  scene: string;
}

export function shownHonours(state: State): Shown {
  const d = deedsOf(state);
  const points = pointsOf(state);
  const ok = (kind: HonourKind, id: string | null) => {
    const h = id ? honourOf(kind, id) : undefined;
    return h && unlocked(h, d.done, points) ? h.id : null;
  };
  return {
    title: ok('title', d.title),
    banner: ok('banner', d.banner) ?? DEFAULT_BANNER,
    frame: ok('frame', d.frame),
    picture: ok('picture', d.picture) ?? DEFAULT_PICTURE,
    glow: ok('glow', d.glow),
    badge: ok('badge', d.badge),
    scene: ok('scene', d.scene) ?? DEFAULT_SCENE,
  };
}
