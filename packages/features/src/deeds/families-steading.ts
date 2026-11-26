// The deeds of the steading (session 25): each work built, each raised to its pennant, and the whole
// steading to its pennants; and from session 244, when the later stages came, each work and the whole
// steading at its height.
import { fmt, t } from '@idle-clash/content';
import { PENNANT, STAGES, WORKS } from '../shared/steading.ts';
import { deed, lower, type Deed } from './content.ts';

export function steadingDeeds(): Deed[] {
  const each = WORKS.flatMap((w) => {
    const work = t(`work.${w.id}`);
    const words = { work, workLower: lower(work) };
    return [
      deed({
        id: `built-${w.id}`,
        family: 'works',
        key: 'deed.built',
        brief: true,
        row: w.id,
        tier: 'easy',
        target: 1,
        words,
        mark: fmt.int(1),
        shows: 'none',
        measure: (r) => r.stage(w.id),
      }),
      deed({
        id: `raised-${w.id}`,
        family: 'works',
        key: 'deed.raised',
        brief: true,
        row: w.id,
        tier: 'elite',
        target: PENNANT,
        words: { ...words, stages: fmt.int(PENNANT) },
        mark: fmt.int(PENNANT),
        measure: (r) => r.stage(w.id),
      }),
      deed({
        id: `height-${w.id}`,
        family: 'works',
        key: 'deed.height',
        brief: true,
        row: w.id,
        tier: 'master',
        target: STAGES,
        words: { ...words, stages: fmt.int(STAGES) },
        mark: fmt.int(STAGES),
        measure: (r) => r.stage(w.id),
      }),
    ];
  });
  const all = deed({
    id: 'steading-all',
    family: 'steading',
    tier: 'master',
    target: WORKS.length,
    words: { count: fmt.int(WORKS.length) },
    mark: fmt.int(WORKS.length),
    measure: (r) => r.worksRaised(),
  });
  const height = deed({
    id: 'steading-height',
    family: 'steading',
    key: 'deed.steadingHeight',
    tier: 'master',
    target: WORKS.length,
    words: { count: fmt.int(WORKS.length) },
    mark: fmt.int(WORKS.length),
    measure: (r) => r.worksAtHeight(),
  });
  return [...each, all, height];
}
