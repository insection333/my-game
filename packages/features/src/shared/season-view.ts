// The season said (session 164): its name, what it lifts and how long it has left, for the Hearth's Next up,
// and the short pill on the pages it touches (a skill's page, Combat), so a lift is seen where it is earned,
// as the castle's edict is.
import { fmt, t } from '@idle-clash/content';
import { SEASON_DAYS, seasonAt, type Twist } from './season.ts';

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
const nameOf = (twist: Twist) => t(NAME[twist.id]);

/** A picture for each twist, from the game's own icons. */
const PICTURE: Record<string, string> = {
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
  picture: string;
  href: string;
}

export function seasonView(now: number): SeasonView | null {
  const season = seasonAt(now);
  if (!season) return null;
  const { twist } = season;
  const days = Math.ceil((season.end - now) / DAY);
  const following = seasonAt(season.end);
  return {
    id: twist.id,
    title: t('season.title', { number: fmt.int(season.number), name: nameOf(twist) }),
    gives: t(GIVES[twist.id], { pct: fmt.pct(pctOf(twist)) }),
    left: days <= 1 ? t('season.daysLeftOne') : t('season.daysLeft', { days: fmt.int(Math.min(days, SEASON_DAYS)) }),
    // The season to come, in the last week of this one: a reason to look ahead.
    next: following && days <= 7 ? t('season.next', { name: nameOf(following.twist) }) : '',
    picture: PICTURE[twist.id] ?? 'woodcutting',
    href: placeOf(twist),
  };
}

/** The season's pill on a skill's page (`skill`) or on Combat (`combat`), or null where it lifts nothing. */
export function seasonPill(now: number, where: { skill: string } | { combat: true }): string | null {
  const twist = seasonAt(now)?.twist;
  if (!twist) return null;
  const skill = 'skill' in where ? where.skill : null;
  const gives =
    twist.finds !== undefined
      ? t('season.short.finds', { pct: fmt.pct(twist.finds) })
      : twist.xp && (skill ? twist.xp.skills.includes(skill) : twist.xp.skills.includes('melee'))
        ? t('season.short.xp', { pct: fmt.pct(twist.xp.pct) })
        : twist.yield && skill && twist.yield.skills.includes(skill)
          ? t('season.short.yield', { pct: fmt.pct(twist.yield.pct) })
          : twist.marks !== undefined && !skill
            ? t('season.short.marks', { pct: fmt.pct(twist.marks) })
            : null;
  return gives && t('season.pill', { name: nameOf(twist), gives });
}
