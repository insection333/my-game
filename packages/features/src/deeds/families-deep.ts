// The Deep's deeds (session 215), the pedlar's (session 217) and the realm's works' (session 218): depths reached, its waystones from the first to the 150th. The first comes
// in a steady player's first descent at 99; the 150th, with the Deep's relics, about two years in.
import { fmt } from '@idle-clash/content';
import { deed, DEPTHS, FAVOUR, REALM_WORKS_RAISED, type Deed } from './content.ts';

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

/** The pedlar's favour (session 217): the first lot handed in, then favour earned. */
export function pedlarDeeds(): Deed[] {
  return FAVOUR.map(([count, tier]) =>
    deed({
      id: `favour-${count}`,
      family: 'favour',
      key: count === 1 ? 'deed.favourFirst' : 'deed.favour',
      brief: true,
      shows: count === 1 ? 'none' : 'count',
      tier,
      target: count,
      words: { count: fmt.int(count) },
      mark: fmt.int(count),
      measure: (r) => r.favour(),
    }),
  );
}

/** The realm's works raised with the player's part (session 218). */
export function realmWorkDeeds(): Deed[] {
  return REALM_WORKS_RAISED.map(([count, tier]) =>
    deed({
      id: `realm-works-${count}`,
      family: 'realmWorks',
      key: count === 1 ? 'deed.realmWorksFirst' : 'deed.realmWorks',
      brief: true,
      shows: count === 1 ? 'none' : 'count',
      tier,
      target: count,
      words: { count: fmt.int(count) },
      mark: fmt.int(count),
      measure: (r) => r.realmWorks(),
    }),
  );
}
