// The recap's and the notices tray's words for one event (split from recap.ts in session 66): a line's
// kinds in the recap's order, its picture and where it leads.
import { fmt, formatStop, isQuietStop, t } from '@idle-clash/content';
import type { GameEvent } from '@idle-clash/kernel';
import { skillActions } from './catalog.ts';
import { castleIcon, castleMoment, isCastleEvent } from './castle/words.ts';
import { storyOf } from './expeditions/story.ts';
import { bossFoughtWords } from './expeditions/boss-words.ts';
import { rankUpWords } from './rank-up.ts';
import { remedyFor } from './remedy.ts';

export type RecapKind =
  | 'legendary'
  | 'newFind'
  | 'level'
  | 'kindled'
  | 'rare'
  | 'expedition'
  | 'castle'
  | 'rank'
  | 'mastery'
  | 'deed'
  | 'goal'
  | 'uncommon'
  | 'items'
  | 'xp'
  | 'defence'
  | 'stopped';

/** Best first: a line's place in the recap. */
export const RECAP_ORDER: readonly RecapKind[] = [
  'legendary',
  'newFind',
  'level',
  'kindled',
  'rare',
  'expedition',
  'castle',
  'rank',
  'mastery',
  'deed',
  'goal',
  'uncommon',
  'items',
  'xp',
  'defence',
  'stopped',
];

export interface RecapLine {
  kind: RecapKind;
  text: string;
  /** An item to draw beside it, if any. */
  icon: string | null;
  /** Where to go about it (a skill's page, the collection log, the item a lane ran out of). */
  href: string | null;
  /** A deed's medallion, drawn where it has no icon (session 68): its tier and its mark ("40"), the mark
   *  empty for a notice kept from before marks rode with deeds. */
  medal?: { tier: string; mark: string };
}

export const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
export const skillHref = (feature: string) => (feature === 'combat' ? '/combat' : `/skills/${feature}`);

/** An action's picture (session 58): what it makes, or the foe fought; the page draws it if it can. */
export const actionIcon = (a: { feature: string; id: string }): string =>
  skillActions()
    .find((s) => s.feature === a.feature)
    ?.actions.find((x) => x.id === a.id)?.gives?.[0]?.item ?? a.id;

/** A lane's stop pictured by what would set it going again, else by the action it stopped on. */
export const stopIcon = (e: Extract<GameEvent, { type: 'laneStopped' }>): string | null =>
  remedyFor(e.reason, e.action)?.item ?? (e.action ? actionIcon(e.action) : null);

/** Where to act on a lane that stopped by itself: where the lanes rail's remedy leads, or the action's
 *  own page. */
export function stopHref(e: Extract<GameEvent, { type: 'laneStopped' }>): string | null {
  const fix = remedyFor(e.reason, e.action);
  if (fix?.item) return `/storehouse?panel=item&item=${fix.item}`;
  if (fix?.path) return fix.path;
  return e.action ? skillHref(e.action.feature) : null;
}

export const kindledLine = (skill: string, count: number): RecapLine => ({
  kind: 'kindled',
  text: t('recap.kindled', { skill: t(`skill.${skill}`), count: fmt.int(count) }),
  icon: skill,
  href: `/skills/${skill}`,
});

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
        icon: e.skill,
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
        icon: actionIcon(e.action),
        href: skillHref(e.action.feature),
        at: e.at,
      };
    case 'goalDone':
      return {
        kind: 'goal',
        text: t('moment.goalDone', { goal: e.name ?? t(`goal.${e.goal}`) }),
        // A milestone pays gold; a short or daily goal, a cache (session 68: a milestone stood on a dot).
        icon: e.cache ? 'supply-cache' : 'gold',
        href: '/',
        at: e.at,
      };
    case 'kindled':
      return { ...kindledLine(e.skill, e.count), at: e.at };
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
    case 'bossFought': {
      const w = bossFoughtWords(e);
      return {
        kind: 'expedition',
        text: w.body ? `${w.title}. ${w.body}` : w.title,
        icon: e.boss,
        href: '/combat/expeditions',
        at: e.at,
      };
    }
    case 'deedDone':
      return {
        kind: 'deed',
        text: t('moment.deedDone', { deed: e.name }),
        icon: e.icon,
        medal: { tier: e.tier, mark: e.mark ?? '' },
        href: '/hiscores/deeds',
        at: e.at,
      };
    case 'castleSiege':
    case 'castleBesieged':
    case 'castleSpyCaught':
    case 'castleSpied':
    case 'castleIncursion':
    case 'castleOrders':
    case 'castleTempered': {
      if (!isCastleEvent(e)) return null;
      const m = castleMoment(e);
      return {
        kind: 'castle',
        text: m.body ? `${m.title}. ${m.body}` : m.title,
        icon: castleIcon(e),
        href: m.href,
        at: e.at,
      };
    }
    case 'rankUp': {
      const w = rankUpWords(e);
      return { kind: 'rank', text: w.body ? `${w.title}. ${w.body}` : w.title, icon: w.skill, href: w.href, at: e.at };
    }
    case 'laneStopped':
      if (isQuietStop(e.reason.code)) return null;
      return {
        kind: 'stopped',
        text: t('moment.laneStopped', { lane: t(`lane.${e.lane}`), reason: lower(formatStop(e.reason)) }),
        icon: stopIcon(e),
        href: stopHref(e),
        at: e.at,
      };
    default:
      return null;
  }
}
