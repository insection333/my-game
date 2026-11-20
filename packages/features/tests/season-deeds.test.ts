// The seasons' deeds and titles (session 166): a short goal or a day's goal claimed counts towards the season
// it is claimed in; sixty goals in one season of a twist is its deed, opening its title; twenty in a season
// counts it played, and six seasons played open the Seasoned. A twist comes round every sixth season, so a
// season of the Greenwood is the first, the seventh, the thirteenth.
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { goals } from '../src/goals/index.ts';
import { pending } from '../src/deeds/list.ts';
import { honourOf, unlocked } from '../src/deeds/honours.ts';
import '../src/index.ts';
import { SEASON_EPOCH } from '../src/shared/season.ts';
import { seasonsOf } from '../src/shared/season-state.ts';
import { seasonOpenedWords } from '../src/shared/season-view.ts';
import { needsRefresh, refresh } from '../src/goals/rules.ts';
import { FIRST_STEPS } from '../src/goals/content.ts';

const DAY = 86_400_000;
const T = SEASON_EPOCH + 3 * DAY + 9 * 3_600_000;
const day = new Date(T).toISOString().slice(0, 10);

/** A save whose day's goal is done and waits to be claimed. */
function ready(): State {
  const s = newState(1, T);
  return {
    ...s,
    skills: { woodcutting: { xp: 500 } },
    features: {
      goals: {
        claimed: [],
        short: [],
        made: 0,
        daily: { day, skill: 'woodcutting', target: 100, base: 0, reward: 100, claimed: false },
        milestones: [],
        opened: 0,
      },
    },
  };
}
const withSeasons = (goalsBySeason: Record<string, number>): State => ({
  ...newState(1, T),
  features: { seasons: { goals: goalsBySeason } },
});
const done = (s: State) => pending(s, T).map((d) => d.id);

describe("the seasons' deeds", () => {
  it('counts a goal claimed towards the season it is claimed in', () => {
    const out = goals.routes.claim.run(ready(), { goal: 'daily' }, T);
    expect(out.result).toEqual({ ok: true });
    expect(seasonsOf(out.state).goals).toEqual({ '1': 1 });
  });

  it("does a twist's deed with sixty goals in one season of it, in whichever year it comes round", () => {
    expect(done(withSeasons({ '1': 59 }))).not.toContain('season-greenwood');
    expect(done(withSeasons({ '1': 30, '7': 60 }))).toContain('season-greenwood');
    expect(done(withSeasons({ '2': 60 }))).toContain('season-forgefire');
    expect(done(withSeasons({ '2': 60 }))).not.toContain('season-greenwood');
  });

  it('counts a season played at twenty goals, and six played open the Seasoned', () => {
    const six = withSeasons({ '1': 20, '2': 25, '3': 20, '4': 90, '5': 21, '6': 20 });
    expect(done(six)).toEqual(expect.arrayContaining(['seasons-1', 'seasons-3', 'seasons-6']));
    expect(done(withSeasons({ '1': 20, '2': 19 }))).not.toContain('seasons-3');
    expect(unlocked(honourOf('title', 'seasoned')!, { 'seasons-6': T }, 0)).toBe(true);
    expect(unlocked(honourOf('title', 'greenwarden')!, { 'season-greenwood': T }, 0)).toBe(true);
    expect(unlocked(honourOf('title', 'greenwarden')!, {}, 10_000)).toBe(false);
  });
});

describe('a season opened', () => {
  /** A player past their first steps, the goals of season 1 counted and season 1 already said. */
  const player = (goals: Record<string, number>, seen: number): State => ({
    ...ready(),
    features: {
      ...ready().features,
      goals: { ...(ready().features.goals as object), claimed: FIRST_STEPS.map((f) => f.id) },
      seasons: { goals, seen },
    },
  });
  const second = SEASON_EPOCH + 56 * DAY + 3_600_000;

  it('is said once, on the first visit in it, with the goals done in the season before', () => {
    const s = player({ '1': 84 }, 1);
    expect(needsRefresh(s, second)).toBe(true);
    const out = refresh(s, second);
    expect(out.events).toEqual([{ type: 'seasonOpened', at: second, number: 2, twist: 'forgefire', last: 84 }]);
    expect(seasonOpenedWords(out.events[0] as never)).toEqual({
      title: 'Season 2: The Forgefire',
      body: 'Artisan skills earn 20% more XP for eight weeks. Last season you did 84 goals.',
      icon: 'smithing',
    });
    expect(refresh(out.state, second + 60_000).events).toEqual([]);
  });

  it('says nothing of a season before its first goal, and of a season already said', () => {
    const quiet = refresh(player({}, 0), second).events[0];
    expect(seasonOpenedWords(quiet as never).body).toBe('Artisan skills earn 20% more XP for eight weeks.');
    expect(refresh(player({}, 2), second).events).toEqual([]);
  });
});
