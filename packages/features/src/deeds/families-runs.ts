// The deeds of expeditions and bosses (step 16): each boss beaten, then beaten 25, 100 and 250 times (session 210), and all six; each
// boss's Legendary find and all the bosses' finds; a run of each length brought home with its boss
// beaten, and runs by the ten and the hundred; every twist met; and relics raised.
import { fmt, t } from '@idle-clash/content';
import { BOSSES, LENGTHS, TWISTS } from '../shared/expeditions/data.ts';
import { relics } from '../shared/expeditions/relics.ts';
import { deed, BOUNTIES, ELITE_BOUNTIES, REALM_FALLS, lower, type Deed, type DeedTier, type Steps } from './content.ts';
import type { Reader } from './reader.ts';

/** Wins over each boss (session 210: 25, 100 and 250, where 10, 50 and 100 came within months once the day's
 *  bosses were fought as the Hearth asks, and the steps now run into the second year). */
const BOSS_WINS: Steps = [
  [25, 'hard'],
  [100, 'elite'],
  [250, 'master'],
];
const LENGTH_TIERS: DeedTier[] = ['easy', 'easy', 'hard', 'elite'];
const RUNS: Steps = [
  [10, 'hard'],
  [50, 'hard'],
  [100, 'elite'],
  [250, 'master'],
];

export function runs(): Deed[] {
  const boss = (id: string) => ({ boss: t(`boss.${id}`), bossLower: lower(t(`boss.${id}`)) });
  const first = BOSSES.map((b) =>
    deed({
      id: `boss-${b.id}`,
      family: 'bossFirst',
      brief: true,
      tier: 'hard',
      target: 1,
      words: boss(b.id),
      mark: '',
      icon: b.id,
      shows: 'none',
      measure: (r) => r.bossWins(b.id),
    }),
  );
  const wins = BOSSES.flatMap((b) =>
    BOSS_WINS.map(([count, tier], i) =>
      deed({
        id: `boss-${b.id}-${count}`,
        family: 'boss',
        row: b.id,
        tier,
        target: count,
        words: { ...boss(b.id), count: fmt.int(count), roman: fmt.roman(i + 1) },
        mark: fmt.int(count),
        measure: (r) => r.bossWins(b.id),
      }),
    ),
  );
  // Every boss beaten (session 210): six since a second came to each region.
  const all = deed({
    id: 'bosses-all',
    family: 'bossesAll',
    tier: 'elite',
    target: BOSSES.length,
    words: { count: fmt.int(BOSSES.length) },
    mark: fmt.int(BOSSES.length),
    measure: (r) => BOSSES.filter((b) => r.bossWins(b.id) > 0).length,
  });
  const trophies = [
    ...BOSSES.map((b) =>
      deed({
        id: `trophy-${b.finds.legendary}`,
        family: 'trophy',
        tier: 'elite',
        target: 1,
        words: {
          item: t(`item.${b.finds.legendary}`),
          itemLower: lower(t(`item.${b.finds.legendary}`)),
          ...boss(b.id),
        },
        mark: '',
        icon: b.finds.legendary,
        shows: 'none',
        measure: (r) => r.found(b.finds.legendary),
      }),
    ),
    deed({
      id: 'trophies-all',
      family: 'trophies',
      tier: 'master',
      target: BOSSES.length * 2,
      words: { count: fmt.int(BOSSES.length * 2) },
      mark: fmt.int(BOSSES.length * 2),
      measure: (r) => r.trophies(),
    }),
  ];
  const lengths = LENGTHS.map((hours, i) =>
    deed({
      id: `run-${hours}h`,
      family: 'runLength',
      tier: LENGTH_TIERS[i],
      target: 1,
      words: { time: fmt.duration(hours * 3_600_000) },
      mark: fmt.duration(hours * 3_600_000),
      shows: 'none',
      measure: (r) => r.runsOf(hours),
    }),
  );
  const total = RUNS.map(([count, tier], i) =>
    deed({
      id: `runs-${count}`,
      family: 'runs',
      tier,
      target: count,
      words: { count: fmt.int(count), roman: fmt.roman(i + 1) },
      mark: fmt.int(count),
      measure: (r) => r.runs(),
    }),
  );
  const twists = deed({
    id: 'twists-all',
    family: 'twists',
    tier: 'hard',
    target: TWISTS.length,
    words: { count: fmt.int(TWISTS.length) },
    mark: fmt.int(TWISTS.length),
    measure: (r) => r.twistsMet(),
  });
  const relicDeeds = (
    [
      ['relic-first', 'easy', 1, (r: Reader) => r.relicRanks()],
      ['relic-full', 'hard', 1, (r: Reader) => r.relicsFull()],
      ['relic-all', 'master', relics().length, (r: Reader) => r.relicsFull()],
    ] as const
  ).map(([id, tier, target, measure], i) =>
    deed({
      id,
      family: 'relic',
      key: `deed.${id}`,
      tier,
      target: Math.max(1, target),
      words: { count: fmt.int(target) },
      mark: fmt.roman(i + 1),
      shows: 'none',
      measure: (r) => Math.min(measure(r), target),
    }),
  );
  // The realm's boss of the week (session 174): weeks it fell with this player's strike, its share taken.
  const realm = REALM_FALLS.map(([count, tier]) =>
    deed({
      id: `realm-${count}`,
      family: 'realm',
      key: count === 1 ? 'deed.realmFirst' : 'deed.realm',
      brief: true,
      shows: count === 1 ? 'none' : 'count',
      tier,
      target: count,
      words: { count: fmt.int(count) },
      mark: fmt.int(count),
      measure: (r) => r.realmFallen(),
    }),
  );
  // The bounty board (session 175): bounties done, and elite ones.
  const bounties = [
    ...BOUNTIES.map(([count, tier]) => ['bounties', count, tier, (r: Reader) => r.bounties()] as const),
    ...ELITE_BOUNTIES.map(([count, tier]) => ['elites', count, tier, (r: Reader) => r.eliteBounties()] as const),
  ].map(([family, count, tier, measure]) =>
    deed({
      id: `${family}-${count}`,
      family,
      key: count === 1 ? `deed.${family}First` : `deed.${family}`,
      brief: true,
      shows: count === 1 ? 'none' : 'count',
      tier,
      target: count,
      words: { count: fmt.int(count) },
      mark: fmt.int(count),
      measure,
    }),
  );
  return [...first, all, ...wins, ...trophies, ...lengths, ...total, twists, ...relicDeeds, ...realm, ...bounties];
}
