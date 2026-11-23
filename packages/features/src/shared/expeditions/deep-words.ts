// A descent into the Deep said (session 212): in its moment, the away recap and the notices tray alike.
// The deepest yet says so; a new waystone says the next descent starts there.
import { fmt, midSentence, t } from '@idle-clash/content';
import type { EventOf } from '@idle-clash/kernel';
import { deepBoss, waystoneOf } from './deep.ts';

const marks = (n: number) => (n === 1 ? t('expedition.marksOne') : t('expedition.marks', { marks: fmt.int(n) }));

export function deepDoneWords(e: EventOf<'deepDone'>): {
  title: string;
  body: string;
  size: 'centre' | 'banner' | 'toast';
} {
  const depth = fmt.int(e.depth);
  const how =
    e.outcome === 'lost'
      ? t('deep.done.lost', { boss: midSentence(t(`boss.${deepBoss(e.depth + 1).id}`)), marks: marks(e.marks) })
      : t(e.outcome === 'retreated' ? 'deep.done.retreated' : 'deep.done.surfaced', { marks: marks(e.marks) });
  const stone = waystoneOf(e.depth);
  const waystone = e.record && stone > waystoneOf(e.from) && stone > 0;
  return {
    title: e.record ? t('deep.done.record', { depth }) : t('deep.done.title', { depth }),
    body: waystone ? `${how} ${t('deep.done.waystone', { depth: fmt.int(stone) })}` : how,
    size: waystone ? 'centre' : e.record ? 'banner' : 'toast',
  };
}
