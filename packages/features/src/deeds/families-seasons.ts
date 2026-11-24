// The deeds of the seasons (session 166): a season of each twist played hard (its goals in one season), each
// opening a title of its own, and seasons played, the last opening the Seasoned. A twist comes round once in
// six seasons, about a year, so the six take a year to gather. From the seventh season a season pairs two
// twists, and its pairings played are deeds of their own (session 221).
import { fmt } from '@idle-clash/content';
import { TWISTS } from '../shared/season.ts';
import { SEASON_PICTURE, seasonName } from '../shared/season-view.ts';
import { deed, lower, PAIRINGS, SEASON_GOALS, SEASON_PLAYED, SEASONS, WEEKS, type Deed } from './content.ts';

export function seasonDeeds(): Deed[] {
  const each = TWISTS.map((tw) => {
    const season = seasonName(tw.id);
    return deed({
      id: `season-${tw.id}`,
      family: 'season',
      row: tw.id,
      tier: 'hard',
      target: SEASON_GOALS,
      words: { season, seasonLower: lower(season), count: fmt.int(SEASON_GOALS) },
      mark: '',
      icon: SEASON_PICTURE[tw.id] ?? null,
      measure: (r) => r.seasonBest(tw.id),
    });
  });
  const played = SEASONS.map(([count, tier]) =>
    deed({
      id: `seasons-${count}`,
      family: 'seasons',
      key: count === 1 ? 'deed.seasonFirst' : 'deed.seasons',
      brief: true,
      // The first is simply played or not ("A season played").
      shows: count === 1 ? 'none' : 'count',
      tier,
      target: count,
      words: { count: fmt.int(count), goals: fmt.int(SEASON_PLAYED) },
      mark: fmt.int(count),
      measure: (r) => r.seasonsPlayed(),
    }),
  );
  // Pairings (session 221): from the seventh season two twists together, fifteen pairings in all.
  const paired = PAIRINGS.map(([count, tier]) =>
    deed({
      id: `pairings-${count}`,
      family: 'pairings',
      key: count === 1 ? 'deed.pairingFirst' : 'deed.pairings',
      brief: true,
      shows: count === 1 ? 'none' : 'count',
      tier,
      target: count,
      words: { count: fmt.int(count), goals: fmt.int(SEASON_PLAYED) },
      mark: fmt.int(count),
      measure: (r) => r.pairingsPlayed(),
    }),
  );
  return [...each, ...played, ...paired];
}

/** The weeks' contracts kept (session 172): counted, never taken away. */
export function weekDeeds(): Deed[] {
  return WEEKS.map(([count, tier]) =>
    deed({
      id: `weeks-${count}`,
      family: 'weeks',
      key: count === 1 ? 'deed.weekFirst' : 'deed.weeks',
      brief: true,
      shows: count === 1 ? 'none' : 'count',
      tier,
      target: count,
      words: { count: fmt.int(count) },
      mark: fmt.int(count),
      measure: (r) => r.weeksKept(),
    }),
  );
}
