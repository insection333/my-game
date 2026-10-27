// The deeds of Kindling (step 17): each skill's first Kindling past 99 and its fifth, when its Path is
// at its strongest; and ten Kindlings across every skill.
import { fmt } from '@idle-clash/content';
import { KINDLINGS_THAT_STRENGTHEN } from '../shared/kindling.ts';
import { allSkills } from '../shared/standing.ts';
import { deed, skillName, type Deed, type Steps } from './content.ts';

const KINDLINGS: Steps = [
  [1, 'elite'],
  [KINDLINGS_THAT_STRENGTHEN, 'master'],
];
const ALL_KINDLINGS = 10;

export function kindlingDeeds(): Deed[] {
  const each = allSkills().flatMap((skill) =>
    KINDLINGS.map(([count, tier], i) =>
      deed({
        id: `kindled-${skill}-${count}`,
        family: 'kindling',
        row: skill,
        tier,
        target: count,
        words: { skill: skillName(skill), count: fmt.int(count), roman: fmt.roman(i + 1) },
        mark: fmt.int(count),
        // A first Kindling is done or not; "Earn 1 Kindling" would read oddly as a count.
        shows: count > 1 ? 'count' : 'none',
        measure: (r) => r.kindlings(skill),
      }),
    ),
  );
  const all = deed({
    id: `kindlings-${ALL_KINDLINGS}`,
    family: 'kindlings',
    tier: 'master',
    target: ALL_KINDLINGS,
    words: { count: fmt.int(ALL_KINDLINGS) },
    mark: fmt.int(ALL_KINDLINGS),
    measure: (r) => r.allKindlings(),
  });
  return [...each, all];
}
