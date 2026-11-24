// The moments of a press answered at the forge, the Reliquary or the pedlar (sessions 98, 216 and 217): the
// words and the picture of a relic raised, a piece tempered and a lot handed in; and the realm's work (218).
import { pedlarPaidWords, realmWorkWords, relicRaisedWords, temperedWords } from '@idle-clash/features';
import type { EventOf, GameEvent } from '@idle-clash/kernel';
import { hasIcon } from '@idle-clash/ui';

/** A press of the player's own answered: a siege, an assault, a relic tempered, a work raised. */
export const byYou = (e: GameEvent) =>
  e.type === 'castleSiege' ||
  e.type === 'castleSpied' ||
  e.type === 'castleIncursion' ||
  e.type === 'castleLegend' ||
  e.type === 'castleTempered' ||
  e.type === 'workRaised' ||
  e.type === 'findUsed' ||
  e.type === 'relicRaised' ||
  e.type === 'gearTempered' ||
  e.type === 'pedlarPaid' ||
  e.type === 'realmGiven';

type Said = { title: string; body: string | null; icon: string | null };

export function pressSaid(e: EventOf<'relicRaised'> | EventOf<'gearTempered'> | EventOf<'pedlarPaid'>): Said {
  if (e.type === 'relicRaised') {
    const w = relicRaisedWords(e.relic, e.rank);
    return { title: w?.title ?? '', body: w?.body ?? null, icon: hasIcon(e.relic) ? e.relic : null };
  }
  const w = e.type === 'pedlarPaid' ? pedlarPaidWords(e) : temperedWords(e.item, e.step);
  return { title: w.title, body: w.body, icon: hasIcon(e.item) ? e.item : null };
}

/** The realm's work (session 218): a gift said in a toast; a stage raised in a banner, the work standing at
 *  the centre. */
export function realmWorkSaid(
  e: EventOf<'realmGiven'> | EventOf<'realmWorkStage'>,
): Said & { size: 'toast' | 'banner' | 'centre' } {
  const w = realmWorkWords(e);
  return {
    title: w.title,
    body: w.body,
    icon: null,
    size: e.type === 'realmGiven' ? 'toast' : e.stage >= 5 ? 'centre' : 'banner',
  };
}
