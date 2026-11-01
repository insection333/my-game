// The deeds of the steading (session 25): each work built, and each fully raised; and the whole
// steading fully raised.
import { fmt, t } from '@idle-clash/content';
import { STAGES, WORKS } from '../shared/steading.ts';
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
        row: w.id,
        tier: 'elite',
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
  return [...each, all];
}
