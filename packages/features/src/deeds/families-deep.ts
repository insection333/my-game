// The Deep's deeds (session 215): depths reached, its waystones from the first to the 150th. The first comes
// in a steady player's first descent at 99; the 150th, with the Deep's relics, about two years in.
import { fmt } from '@idle-clash/content';
import { deed, DEPTHS, type Deed } from './content.ts';

export function deepDeeds(): Deed[] {
  return DEPTHS.map(([depth, tier]) =>
    deed({
      id: `deep-${depth}`,
      family: 'deep',
      key: depth === DEPTHS[0][0] ? 'deed.deepFirst' : 'deed.deep',
      brief: true,
      shows: 'count',
      tier,
      target: depth,
      words: { count: fmt.int(depth) },
      mark: fmt.int(depth),
      icon: 'peaks',
      measure: (r) => r.deepest(),
    }),
  );
}
