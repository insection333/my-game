// The season said (session 164): its name, what it lifts and how long it has left, for the Hearth's Next up,
// and the short pill on the pages it touches (a skill's page, Combat), so a lift is seen where it is earned,
// as the castle's edict is.
import { fmt, midSentence, t } from '@idle-clash/content';
import type { EventOf, State } from '@idle-clash/kernel';
import { SEASON_DAYS, seasonAt, TWISTS, type Twist } from './season.ts';
import { seasonsOf } from './season-state.ts';

const DAY = 86_400_000;

/** Each twist's name and what it gives, written whole so the content check sees every key used. */
const NAME: Record<string, string> = {
  greenwood: 'season.name.greenwood',
  forgefire: 'season.name.forgefire',
  muster: 'season.name.muster',
  omens: 'season.name.omens',
  road: 'season.name.road',
  plenty: 'season.name.plenty',
};
const GIVES: Record<string, string> = {
  greenwood: 'season.gives.greenwood',
  forgefire: 'season.gives.forgefire',
  muster: 'season.gives.muster',
  omens: 'season.gives.omens',
  road: 'season.gives.road',
  plenty: 'season.gives.plenty',
};
/** A twist's name ("The Greenwood"). */
export const seasonName = (twist: string) => t(NAME[twist]);
const nameOf = (twist: Twist) => seasonName(twist.id);
/** A season's name: its twist's, or its two twists' ("The Greenwood and the Omens", session 221). */
const namesOf = (twists: readonly Twist[]) =>
  twists.length > 1
    ? t('season.pairName', { a: nameOf(twists[0]), b: midSentence(nameOf(twists[1])) })
    : nameOf(twists[0]);
const givesOf = (twist: Twist) => t(GIVES[twist.id], { pct: fmt.pct(pctOf(twist)) });
/** What a season gives: its twist's, or both, one after the other. */
const allGives = (twists: readonly Twist[]) =>
  twists.length > 1 ? t('season.givesPair', { a: givesOf(twists[0]), b: givesOf(twists[1]) }) : givesOf(twists[0]);

/** A picture for each twist, from the game's own icons. */
export const SEASON_PICTURE: Record<string, string> = {
  greenwood: 'woodcutting',
  forgefire: 'smithing',
  muster: 'melee',
  omens: 'four-leaf-charm',
  road: 'expedition-mark',
  plenty: 'pine-logs',
};

/** Where the twist is played, for the Hearth's row to lead to. */
function placeOf(twist: Twist): string {
  if (twist.marks) return '/combat/expeditions';
  if (twist.xp?.skills.includes('melee')) return '/combat';
  return '/skills';
}

const pctOf = (twist: Twist): number => twist.xp?.pct ?? twist.finds ?? twist.marks ?? twist.yield?.pct ?? 0;

export interface SeasonView {
  id: string;
  title: string;
  gives: string;
  left: string;
  /** The season to come, in this one's last week; empty before. */
  next: string;
  /** The goals done in it so far (session 166), with the state; empty before the first. */
  done: string;
  picture: string;
  href: string;
}

export function seasonView(now: number, state?: State): SeasonView | null {
  const season = seasonAt(now);
  if (!season) return null;
  const { twist, twists } = season;
  const days = Math.ceil((season.end - now) / DAY);
  const following = seasonAt(season.end);
  return {
    id: twist.id,
    title: t('season.title', { number: fmt.int(season.number), name: namesOf(twists) }),
    gives: allGives(twists),
    left: days <= 1 ? t('season.daysLeftOne') : t('season.daysLeft', { days: fmt.int(Math.min(days, SEASON_DAYS)) }),
    // The season to come, in the last week of this one: a reason to look ahead.
    next: following && days <= 7 ? t('season.next', { name: namesOf(following.twists) }) : '',
    done: doneIn(state, season.number),
    picture: SEASON_PICTURE[twist.id] ?? 'woodcutting',
    href: placeOf(twist),
  };
}

/** The goals done in a season, in words; empty before the first. */
function doneIn(state: State | undefined, n: number): string {
  const goals = state ? seasonsOf(state).goals : {};
  const count = Object.hasOwn(goals, String(n)) ? goals[String(n)] : 0;
  if (count === 0) return '';
  return count === 1 ? t('season.goalsOne') : t('season.goals', { count: fmt.int(count) });
}

/** The season's pill on a skill's page (`skill`) or on Combat (`combat`), or null where it lifts nothing:
 *  named by the twists that lift something there. */
export function seasonPill(now: number, where: { skill: string } | { combat: true }): string | null {
  const twists = seasonAt(now)?.twists ?? [];
  const skill = 'skill' in where ? where.skill : null;
  const here = twists
    .map((twist) => ({
      twist,
      gives:
        twist.finds !== undefined
          ? t('season.short.finds', { pct: fmt.pct(twist.finds) })
          : twist.xp && (skill ? twist.xp.skills.includes(skill) : twist.xp.skills.includes('melee'))
            ? t('season.short.xp', { pct: fmt.pct(twist.xp.pct) })
            : twist.yield && skill && twist.yield.skills.includes(skill)
              ? t('season.short.yield', { pct: fmt.pct(twist.yield.pct) })
              : twist.marks !== undefined && !skill
                ? t('season.short.marks', { pct: fmt.pct(twist.marks) })
                : null,
    }))
    .filter((x): x is { twist: Twist; gives: string } => x.gives !== null);
  if (!here.length) return null;
  return t('season.pill', {
    name: namesOf(here.map((x) => x.twist)),
    gives: here.map((x) => x.gives).join(', '),
  });
}

/** A season opened, as its moment and the tray say it (session 166): "Season 2: The Forgefire", what it
 *  lifts, and the goals done in the season before. */
export function seasonOpenedWords(e: EventOf<'seasonOpened'>): { title: string; body: string; icon: string } {
  const twist = TWISTS.find((x) => x.id === e.twist) ?? TWISTS[0];
  const pair = e.pair === undefined ? undefined : TWISTS.find((x) => x.id === e.pair);
  const twists = pair ? [twist, pair] : [twist];
  const gives = allGives(twists);
  const last = e.last === 0 ? null : e.last === 1 ? t('season.lastOne') : t('season.last', { count: fmt.int(e.last) });
  return {
    title: t('season.title', { number: fmt.int(e.number), name: namesOf(twists) }),
    body: last ? t('season.openedBody', { gives, last }) : t('season.openedBodyFirst', { gives }),
    icon: SEASON_PICTURE[twist.id] ?? 'woodcutting',
  };
}
