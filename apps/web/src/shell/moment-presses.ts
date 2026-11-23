// The moments of a press answered at the forge, the Reliquary or the pedlar (sessions 98, 216 and 217): the
// words and the picture of a relic raised, a piece tempered and a lot handed in.
import { pedlarPaidWords, relicRaisedWords, temperedWords } from '@idle-clash/features';
import type { EventOf } from '@idle-clash/kernel';
import { hasIcon } from '@idle-clash/ui';

type Said = { title: string; body: string | null; icon: string | null };

export function pressSaid(e: EventOf<'relicRaised'> | EventOf<'gearTempered'> | EventOf<'pedlarPaid'>): Said {
  if (e.type === 'relicRaised') {
    const w = relicRaisedWords(e.relic, e.rank);
    return { title: w?.title ?? '', body: w?.body ?? null, icon: hasIcon(e.relic) ? e.relic : null };
  }
  const w = e.type === 'pedlarPaid' ? pedlarPaidWords(e) : temperedWords(e.item, e.step);
  return { title: w.title, body: w.body, icon: hasIcon(e.item) ? e.item : null };
}
