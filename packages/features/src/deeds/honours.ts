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

export type HonourKind = 'title' | 'banner' | 'frame';
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

const title = (id: string, unlock: Unlock): Honour => ({ id, kind: 'title', unlock });
const at = (points: number) => ({ points });
const by = (deed: string) => ({ deed });
const ninetyNines = () => allSkills().map((s) => `level-${s}-99`);

export const HONOURS: readonly Honour[] = [
  // Titles: by points first, then by deed.
  title('wayfarer', at(100)),
  title('stalwart', at(500)),
  title('renowned', at(1_500)),
  title('illustrious', at(3_000)),
  title('exalted', at(5_000)),
  title('mythic', at(7_500)),
  ...Object.entries(SKILL_TITLES).map(([skill, id]) => title(id, by(`level-${skill}-99`))),
  title('grandmaster', by('masters-50')),
  title('warlord', by('defeats-100000')),
  title('peakbreaker', by('region-peaks')),
  title('curator', by('collector-all')),
  title('flamekeeper', by('fire-360')),
  title('magnate', by('gold-10000000')),
  title('paragon', by('rank-legend')),
  title('equilibrist', by('hidden-even')),
  title('wyrmslayer', by('boss-ember-wyrm')),
  title('trailblazer', by('runs-100')),
  // Banners: the woad everyone flies, and a colour for each region cleared and more.
  { id: 'woad', kind: 'banner', unlock: null },
  { id: 'moss', kind: 'banner', unlock: by('region-march') },
  { id: 'fen', kind: 'banner', unlock: by('region-fen') },
  { id: 'ember', kind: 'banner', unlock: by('region-peaks') },
  { id: 'night', kind: 'banner', unlock: at(2_000) },
  { id: 'gold', kind: 'banner', unlock: by('gold-1000000') },
  { id: 'dawn', kind: 'banner', unlock: { anyOf: ninetyNines, text: 'honour.unlock.any99' } },
  // Frames: by points.
  { id: 'bronze', kind: 'frame', unlock: at(250) },
  { id: 'silver', kind: 'frame', unlock: at(1_000) },
  { id: 'gold', kind: 'frame', unlock: at(2_500) },
  { id: 'dawn', kind: 'frame', unlock: at(6_000) },
];

export const honourOf = (kind: HonourKind, id: string) => HONOURS.find((h) => h.kind === kind && h.id === id);
export const DEFAULT_BANNER = 'woad';

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
export function shownHonours(state: State): { title: string | null; banner: string; frame: string | null } {
  const d = deedsOf(state);
  const points = pointsOf(state);
  const ok = (kind: HonourKind, id: string | null) => {
    const h = id ? honourOf(kind, id) : undefined;
    return h && unlocked(h, d.done, points) ? h.id : null;
  };
  return { title: ok('title', d.title), banner: ok('banner', d.banner) ?? DEFAULT_BANNER, frame: ok('frame', d.frame) };
}
