// How deeds read on the Deeds tab: categories of families, each a table of rows (a skill, a foe) whose
// steps are medallions; the deeds nearest to done and those done last; every deed's words, tier,
// points, progress and what it unlocks, for its sheet.
import { fmt, hasString, t } from '@idle-clash/content';
import type { State } from '@idle-clash/kernel';
import { POINTS, wordsOf, type Deed, type DeedTier } from './content.ts';
import { HONOURS, honourName } from './honours.ts';
import { CATEGORIES, deedList } from './list.ts';
import { Reader } from './reader.ts';
import { deedsOf } from './state.ts';

export interface DeedStep {
  id: string;
  mark: string;
  icon: string | null;
  tier: DeedTier;
  name: string;
  text: string;
  /** "Hard, 15 points" */
  worth: string;
  /** "Done 20 Oct 2026", or null while not done. */
  done: string | null;
  progress: number;
  /** "34 of 40", or null for a deed simply done or not. */
  count: string | null;
  unlocks: string[];
  /** A hidden deed not yet done: its words are not shown. */
  secret: boolean;
}
export interface DeedRow {
  id: string;
  label: string | null;
  icon: string | null;
  steps: DeedStep[];
}
export interface DeedFamily {
  id: string;
  name: string;
  about: string;
  done: string;
  rows: DeedRow[];
}
export interface DeedCategory {
  id: string;
  name: string;
  short: string;
  done: string;
  families: DeedFamily[];
}
export interface DeedsView {
  categories: DeedCategory[];
  /** The deeds nearest to done, and the last done. */
  nearest: DeedStep[];
  recent: DeedStep[];
}

const NEAREST = 6;
const RECENT = 6;

const of = (done: number, total: number) => t('deeds.of', { done: fmt.int(done), total: fmt.int(total) });

function countText(d: Deed, now: number): string | null {
  const n = Math.min(now, d.target);
  if (d.shows === 'count') return of(Math.floor(n), d.target);
  if (d.shows === 'minutes')
    return t('deeds.ofTime', { now: fmt.duration(n * 60_000), of: fmt.duration(d.target * 60_000) });
  return null;
}

/** What a deed unlocks, by name. */
const unlocksOf = (id: string) =>
  HONOURS.filter((h) => h.unlock && 'deed' in h.unlock && h.unlock.deed === id).map(honourName);

export function stepOf(d: Deed, r: Reader, doneAt: number | undefined): DeedStep {
  const secret = d.hidden && doneAt === undefined;
  const measured = doneAt === undefined ? d.measure(r) : d.target;
  return {
    id: d.id,
    mark: secret ? t('deeds.secretMark') : d.mark,
    icon: secret ? null : d.icon,
    tier: d.tier,
    name: secret ? t('deeds.secret.name') : wordsOf(d, 'name'),
    text: secret ? t('deeds.secret.text') : wordsOf(d, 'text'),
    worth: t('deeds.worth', { tier: t(`deeds.tier.${d.tier}`), points: fmt.int(POINTS[d.tier]) }),
    done: doneAt === undefined ? null : t('deeds.doneOn', { date: fmt.date(doneAt) }),
    progress: doneAt === undefined ? Math.min(1, Math.max(0, measured / d.target)) : 1,
    count: secret || doneAt !== undefined ? null : countText(d, measured),
    unlocks: secret ? [] : unlocksOf(d.id),
    secret,
  };
}

/** A row's label and icon: a skill, a foe, or the family's only row. */
function rowHead(d: Deed): { label: string | null; icon: string | null } {
  if (!d.row) return { label: null, icon: null };
  if (hasString(`skill.${d.row}`)) return { label: t(`skill.${d.row}`), icon: d.row };
  if (d.row === 'combat') return { label: t('deeds.row.combat'), icon: null };
  if (hasString(`boss.${d.row}`)) return { label: t(`boss.${d.row}`), icon: d.row };
  return { label: t(`action.combat.${d.row}`), icon: d.row };
}

export function deedsView(state: State, now: number): DeedsView {
  const done = deedsOf(state).done;
  const r = new Reader(state, now);
  const steps = new Map(
    deedList().map((d) => [d.id, stepOf(d, r, Object.hasOwn(done, d.id) ? done[d.id] : undefined)]),
  );
  const doneIn = (list: readonly Deed[]) => list.filter((d) => Object.hasOwn(done, d.id)).length;
  const categories = CATEGORIES.map((c): DeedCategory => {
    const inCategory = deedList().filter((d) => c.families.includes(d.family));
    return {
      id: c.id,
      name: t(`deeds.category.${c.id}`),
      short: t(`deeds.category.${c.id}.short`),
      done: of(doneIn(inCategory), inCategory.length),
      families: c.families.map((family): DeedFamily => {
        const list = inCategory.filter((d) => d.family === family);
        const rows = [...new Set(list.map((d) => d.row))].map((row): DeedRow => {
          const inRow = list.filter((d) => d.row === row);
          return { id: row || family, ...rowHead(inRow[0]), steps: inRow.map((d) => steps.get(d.id)!) };
        });
        return {
          id: family,
          name: t(`deeds.family.${family}`),
          about: t(`deeds.family.${family}.about`),
          done: of(doneIn(list), list.length),
          rows,
        };
      }),
    };
  });
  const open = [...steps.values()].filter((s) => !s.done && !s.secret && s.progress > 0 && s.progress < 1);
  const nearest = open.sort((a, b) => b.progress - a.progress).slice(0, NEAREST);
  const recent = Object.entries(done)
    .sort((a, b) => b[1] - a[1])
    .flatMap(([id]) => steps.get(id) ?? [])
    .slice(0, RECENT);
  return { categories, nearest, recent };
}
