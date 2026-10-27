// The away recap (IA.md, the Hearth's Today): what happened while the player was away, as lines the
// page lists best first: Legendary finds, new entries in the collection log, levels, Rare finds,
// mastery steps, Uncommon finds, then what the lanes brought in, then any lane that stopped
// and why, with where to act. The simulation reads the same lines.
import { fmt, formatStop, isQuietStop, t } from '@idle-clash/content';
import type { AwaySummary, GameEvent } from '@idle-clash/kernel';
import { itemOf } from './catalog.ts';
import { storyOf } from './expeditions/story.ts';

export type RecapKind =
  | 'legendary'
  | 'newFind'
  | 'level'
  | 'rare'
  | 'expedition'
  | 'mastery'
  | 'deed'
  | 'goal'
  | 'uncommon'
  | 'items'
  | 'xp'
  | 'stopped';

/** Best first: a line's place in the recap. */
export const RECAP_ORDER: readonly RecapKind[] = [
  'legendary',
  'newFind',
  'level',
  'rare',
  'expedition',
  'mastery',
  'deed',
  'goal',
  'uncommon',
  'items',
  'xp',
  'stopped',
];

export interface RecapLine {
  kind: RecapKind;
  text: string;
  /** An item to draw beside it, if any. */
  icon: string | null;
  /** Where to go about it (a skill's page, the collection log, the item a lane ran out of). */
  href: string | null;
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const skillHref = (feature: string) => (feature === 'combat' ? '/combat' : `/skills/${feature}`);

/** Where to act on a lane that stopped by itself. */
function stopHref(e: Extract<GameEvent, { type: 'laneStopped' }>): string | null {
  const item = e.reason.detail?.item;
  switch (e.reason.code) {
    case 'outOfInputs':
      return typeof item === 'string' ? `/storehouse?panel=item&item=${item}` : '/storehouse';
    case 'storehouseFull':
      return '/storehouse';
    case 'retreated':
    case 'tooHurt':
    case 'noWeapon':
      return '/combat';
    default:
      return e.action ? skillHref(e.action.feature) : null;
  }
}

/** Every line of the recap, best first. Lines other than lane stops are the good things. */
export function recapLines(a: AwaySummary): RecapLine[] {
  const lines: RecapLine[] = [];
  const finds = a.events.filter((e) => e.type === 'find');
  for (const e of finds) {
    const text = t('moment.find', { rarity: t(`rarity.${e.rarity}`), item: t(`item.${e.item}`) });
    if (e.rarity === 'legendary') lines.push({ kind: 'legendary', text, icon: e.item, href: '/storehouse/log' });
    // New to the log: said so, since a first Uncommon find comes before a Rare one seen before.
    else if (e.first)
      lines.push({
        kind: 'newFind',
        text: t('recap.newFind', { item: t(`item.${e.item}`), rarity: t(`rarity.${e.rarity}`) }),
        icon: e.item,
        href: '/storehouse/log',
      });
  }
  // Rare finds the log already holds, one line an item: "Rare find: Torn banner ×4".
  const rares = new Map<string, number>();
  for (const e of finds) if (e.rarity === 'rare' && !e.first) rares.set(e.item, (rares.get(e.item) ?? 0) + 1);
  for (const [item, count] of rares) {
    const text = t('moment.find', { rarity: t('rarity.rare'), item: t(`item.${item}`) });
    lines.push({
      kind: 'rare',
      text: count > 1 ? t('recap.times', { what: text, count: fmt.int(count) }) : text,
      icon: item,
      href: '/storehouse/log',
    });
  }
  // Levels, one line a skill: "Mining reached level 14".
  const levels = new Map<string, number>();
  for (const e of a.events) if (e.type === 'levelUp') levels.set(e.skill, Math.max(levels.get(e.skill) ?? 0, e.level));
  for (const [skill, level] of levels)
    lines.push({
      kind: 'level',
      text: t('recap.level', { skill: t(`skill.${skill}`), level: fmt.int(level) }),
      icon: null,
      href: `/skills/${skill}`,
    });
  // Each run that came home, its story.
  for (const e of a.events)
    if (e.type === 'expeditionDone') {
      const story = storyOf(e);
      lines.push({
        kind: 'expedition',
        text: `${story.title}. ${story.body}`,
        icon: e.region,
        href: '/combat/expeditions',
      });
    }
  // Mastery, one line an action: the step it reached.
  const steps = new Map<string, Extract<GameEvent, { type: 'masteryStep' }>>();
  for (const e of a.events) if (e.type === 'masteryStep') steps.set(`${e.action.feature}:${e.action.id}`, e);
  for (const e of steps.values())
    lines.push({
      kind: 'mastery',
      text: t('moment.masteryStep', { action: t(`action.${e.action.feature}.${e.action.id}`), step: fmt.int(e.step) }),
      icon: null,
      href: skillHref(e.action.feature),
    });
  if (a.uncommon)
    lines.push({
      kind: 'uncommon',
      text: a.uncommon === 1 ? t('recap.uncommonOne') : t('recap.uncommon', { count: fmt.int(a.uncommon) }),
      icon: null,
      href: '/storehouse/log',
    });
  // What the lanes brought in: gold first, then the three items worth most.
  const gained = Object.entries(a.items).filter(([, n]) => n > 0);
  const worth = ([id, n]: [string, number]) => (id === 'gold' ? Infinity : n * (itemOf(id)?.value ?? 0));
  const top = gained.sort((x, y) => worth(y) - worth(x)).slice(0, 3);
  if (top.length)
    lines.push({
      kind: 'items',
      text: top
        .map(([id, n]) =>
          id === 'gold'
            ? t('recap.gold', { count: fmt.int(n) })
            : t('recap.item', { count: fmt.int(n), item: lower(t(`item.${id}`)) }),
        )
        .join(', '),
      icon: top.find(([id]) => id !== 'gold')?.[0] ?? null,
      href: '/storehouse',
    });
  const xp = Object.values(a.xp).reduce((n, x) => n + x, 0);
  const skills = Object.keys(a.xp).length;
  if (xp > 0) {
    const [only] = Object.keys(a.xp);
    const text =
      skills === 1
        ? t('recap.xpOne', { xp: fmt.int(xp), skill: t(`skill.${only}`) })
        : t('recap.xp', { xp: fmt.int(xp), skills: fmt.int(skills) });
    lines.push({ kind: 'xp', text, icon: null, href: '/skills' });
  }
  for (const e of a.events)
    if (e.type === 'laneStopped' && !isQuietStop(e.reason.code))
      lines.push({
        kind: 'stopped',
        text: t('moment.laneStopped', { lane: t(`lane.${e.lane}`), reason: lower(formatStop(e.reason)) }),
        icon: null,
        href: stopHref(e),
      });
  return lines.sort((x, y) => RECAP_ORDER.indexOf(x.kind) - RECAP_ORDER.indexOf(y.kind));
}

/** The good things in a recap: every line but the lane stops. */
export const goodThings = (lines: readonly RecapLine[]) => lines.filter((l) => l.kind !== 'stopped');

/** One event as the notices tray lists it: what happened, and where to act. Null for the rest. */
export function noticeLine(e: GameEvent): (RecapLine & { at: number }) | null {
  switch (e.type) {
    case 'find': {
      // The tray leaves out Uncommon finds the log already holds: they come by the dozen.
      if (e.rarity === 'uncommon' && !e.first) return null;
      const text = t('moment.find', { rarity: t(`rarity.${e.rarity}`), item: t(`item.${e.item}`) });
      const kind: RecapKind =
        e.rarity === 'legendary' ? 'legendary' : e.first ? 'newFind' : e.rarity === 'rare' ? 'rare' : 'uncommon';
      return { kind, text, icon: e.item, href: '/storehouse/log', at: e.at };
    }
    case 'levelUp':
      return {
        kind: 'level',
        text: t('recap.level', { skill: t(`skill.${e.skill}`), level: fmt.int(e.level) }),
        icon: null,
        href: `/skills/${e.skill}`,
        at: e.at,
      };
    case 'masteryStep':
      return {
        kind: 'mastery',
        text: t('moment.masteryStep', {
          action: t(`action.${e.action.feature}.${e.action.id}`),
          step: fmt.int(e.step),
        }),
        icon: null,
        href: skillHref(e.action.feature),
        at: e.at,
      };
    case 'goalDone':
      return {
        kind: 'goal',
        text: t('moment.goalDone', { goal: e.name ?? t(`goal.${e.goal}`) }),
        icon: e.cache ? 'supply-cache' : null,
        href: '/',
        at: e.at,
      };
    case 'expeditionDone': {
      const story = storyOf(e);
      return {
        kind: 'expedition',
        text: `${story.title}. ${story.body}`,
        icon: e.region,
        href: '/combat/expeditions',
        at: e.at,
      };
    }
    case 'deedDone':
      return {
        kind: 'deed',
        text: t('moment.deedDone', { deed: e.name }),
        icon: e.icon,
        href: '/hiscores/deeds',
        at: e.at,
      };
    case 'laneStopped':
      if (isQuietStop(e.reason.code)) return null;
      return {
        kind: 'stopped',
        text: t('moment.laneStopped', { lane: t(`lane.${e.lane}`), reason: lower(formatStop(e.reason)) }),
        icon: null,
        href: stopHref(e),
        at: e.at,
      };
    default:
      return null;
  }
}
