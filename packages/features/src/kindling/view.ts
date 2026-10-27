// How Kindling reads on a skill's page: before 99, a line on what waits there; at 99 and past it, the
// Kindlings so far and the Paths with what each gives now.
import { fmt, MAX_LEVEL, t } from '@idle-clash/content';
import { xpOf, type State } from '@idle-clash/kernel';
import { allSkills } from '../shared/standing.ts';
import { kindlingsIn, kindlingOf, PATHS, pathPct, pathSkills } from '../shared/kindling.ts';
import { skillLevel } from '../shared/skill.ts';

export interface KindlingView {
  skill: string;
  /** At level 99: the panel shows; below it, only `note`. */
  top: boolean;
  kindlings: number;
  /** "Kindled 3 times", or "Not yet kindled". */
  count: string;
  /** Below 99, what waits there; for Hitpoints, why it takes no Path. */
  note: string | null;
  paths: { id: 'bounty' | 'lore' | 'fortune'; name: string; text: string; current: boolean }[];
}

export function kindlingView(state: State, skill: string): KindlingView {
  const xp = xpOf(state, skill);
  const n = kindlingsIn(xp);
  const top = skillLevel(state, skill) >= MAX_LEVEL;
  const chosen = kindlingOf(state).paths;
  const takes = pathSkills().includes(skill);
  return {
    skill,
    top,
    kindlings: n,
    count:
      n === 0
        ? t('kindling.unkindled')
        : n === 1
          ? t('kindling.countOne')
          : n === 2
            ? t('kindling.countTwo')
            : t('kindling.count', { count: fmt.int(n) }),
    note: !top ? t('kindling.locked') : takes ? null : t('kindling.noPath'),
    paths: takes
      ? PATHS.map((p) => ({
          id: p.id as 'bounty' | 'lore' | 'fortune',
          name: t(`kindling.path.${p.id}`),
          text: t(`kindling.raises.${p.raises}`, { pct: fmt.pct(pathPct(p, n)) }),
          current: Object.hasOwn(chosen, skill) && chosen[skill] === p.id,
        }))
      : [],
  };
}

/** Every skill's Kindling, for the skill page to pick its own. */
export const kindlingViews = (state: State): Record<string, KindlingView> =>
  Object.fromEntries(allSkills().map((s) => [s, kindlingView(state, s)]));
