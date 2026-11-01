// The deeds of Castle Clash (session 33, DESIGN.md section 7): a castle raised and grown, fortresses
// taken, war marks earned, relics forged and the War College studied. Each reads the castle's standing,
// which the castle's mirror keeps in the save.
import { fmt, RELIC, RELICS, TECH, TECH_IDS } from '@idle-clash/content';
import { deed, type Deed, type Steps } from './content.ts';

const LEVELS: Steps = [
  [10, 'hard'],
  [25, 'elite'],
];
const TAKEN: Steps = [
  [10, 'easy'],
  [25, 'hard'],
  [50, 'elite'],
];
const TEMPERED: Steps = [
  [3, 'hard'],
  [10, 'master'],
];
const MARKS: Steps = [
  [100, 'easy'],
  [1000, 'hard'],
];

export function castleDeeds(): Deed[] {
  const raised = deed({
    id: 'castle-raised',
    family: 'castle',
    key: 'deed.castleRaised',
    tier: 'easy',
    target: 1,
    words: {},
    mark: fmt.int(1),
    shows: 'none',
    measure: (r) => r.castleRaised(),
  });
  const levels = LEVELS.map(([level, tier]) =>
    deed({
      id: `castle-level-${level}`,
      family: 'castle',
      tier,
      target: level,
      words: { level: fmt.int(level) },
      mark: fmt.int(level),
      measure: (r) => r.castle('level'),
    }),
  );
  const taken = TAKEN.map(([count, tier]) =>
    deed({
      id: `fortresses-${count}`,
      family: 'fortresses',
      tier,
      target: count,
      words: { count: fmt.int(count) },
      mark: fmt.int(count),
      measure: (r) => r.castle('taken'),
    }),
  );
  const marks = MARKS.map(([count, tier]) =>
    deed({
      id: `war-marks-${count}`,
      family: 'warMarks',
      tier,
      target: count,
      words: { count: fmt.int(count) },
      mark: fmt.compact(count),
      measure: (r) => r.castle('marks'),
    }),
  );
  // Tempering is luck as much as patience: +3 in a few weeks of war marks, +10 a long chase.
  const tempered = TEMPERED.map(([count, tier]) =>
    deed({
      id: `tempered-${count}`,
      family: 'halls',
      key: 'deed.tempered',
      tier,
      target: count,
      words: { count: fmt.int(count) },
      mark: `+${fmt.int(count)}`,
      measure: (r) => r.castle('tempered'),
    }),
  );
  const relics = RELICS.length * RELIC.LEVELS;
  const ranks = TECH_IDS.length * TECH.RANKS;
  const halls = [
    deed({
      id: 'relic-forged',
      family: 'halls',
      key: 'deed.relicForged',
      tier: 'easy',
      target: 1,
      words: {},
      mark: fmt.int(1),
      shows: 'none',
      measure: (r) => r.castle('relics'),
    }),
    deed({
      id: 'reliquary-full',
      family: 'halls',
      key: 'deed.reliquaryFull',
      tier: 'master',
      target: relics,
      words: { count: fmt.int(RELICS.length), levels: fmt.int(RELIC.LEVELS), total: fmt.int(relics) },
      mark: fmt.int(relics),
      measure: (r) => r.castle('relics'),
    }),
    deed({
      id: 'college-full',
      family: 'halls',
      key: 'deed.collegeFull',
      tier: 'master',
      target: ranks,
      words: { count: fmt.int(TECH_IDS.length), ranks: fmt.int(TECH.RANKS), total: fmt.int(ranks) },
      mark: fmt.int(ranks),
      measure: (r) => r.castle('studies'),
    }),
  ];
  return [raised, ...levels, ...taken, ...marks, ...halls, ...tempered];
}
