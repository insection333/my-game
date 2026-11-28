// Tempering said on the gear sheet (session 216): a worn piece's steps and what they give, and what its next
// step takes (its tier's bars and trophies) with what is short; from Smithing 90, or once a piece is tempered.
import { fmt, t } from '@idle-clash/content';
import { countOf, type State } from '@idle-clash/kernel';
import { itemOf } from './catalog.ts';
import { skillLevel } from './skill.ts';
import { guardOf, stepCost, stepsOf, TEMPER, trophiesFor } from './temper.ts';
import { heirloomOf } from './heirlooms.ts';
import { codeOrder } from './order.ts';

export interface TemperLine {
  /** "Tempered 2 of 5: +2% damage", or null before the first step. */
  steps: string | null;
  /** "Next step: 60 Dawnsteel bars and 3 trophies", or null once fully tempered. */
  next: string | null;
  /** "Short of 2 trophies", or null. */
  short: string | null;
  ready: boolean;
}

/** The trophies held for a piece, the most held first. */
export const trophiesHeld = (state: State, item: string) =>
  trophiesFor(item)
    .map((id) => ({ id, count: countOf(state, id) }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count || codeOrder(a.id, b.id));

export function temperLine(state: State, item: string): TemperLine | null {
  // An heirloom is never tempered (session 251).
  if (heirloomOf(item)) return null;
  const steps = stepsOf(state, item);
  const open = skillLevel(state, 'smithing') >= TEMPER.OPENS;
  if (!open && steps === 0) return null;
  const weapon = itemOf(item)?.gear?.slot === 'weapon';
  const gives = weapon
    ? t('temper.damage', { pct: fmt.pct(steps * TEMPER.PCT) })
    : t('temper.guard', { pct: fmt.pct(guardOf(steps)) });
  const said = steps ? t('temper.steps', { steps: fmt.int(steps), of: fmt.int(TEMPER.STEPS), gives }) : null;
  const cost = steps < TEMPER.STEPS ? stepCost(item, steps + 1) : null;
  if (!cost || !open) return { steps: said, next: null, short: open ? null : t('temper.opens'), ready: false };
  const trophies = trophiesHeld(state, item).reduce((n, x) => n + x.count, 0);
  const bars = countOf(state, cost.bar);
  const lacking = [
    ...(bars < cost.bars
      ? [t('temper.shortBars', { count: fmt.int(cost.bars - bars), bar: t(`item.${cost.bar}`) })]
      : []),
    ...(trophies < cost.trophies
      ? [
          cost.trophies - trophies === 1
            ? t('temper.shortTrophiesOne')
            : t('temper.shortTrophies', { count: fmt.int(cost.trophies - trophies) }),
        ]
      : []),
  ];
  return {
    steps: said,
    next:
      cost.trophies === 1
        ? t('temper.nextOne', { bars: fmt.int(cost.bars), bar: t(`item.${cost.bar}`) })
        : t('temper.next', { bars: fmt.int(cost.bars), bar: t(`item.${cost.bar}`), trophies: fmt.int(cost.trophies) }),
    short: lacking.length ? t('temper.short', { what: lacking.join(', ') }) : null,
    ready: lacking.length === 0,
  };
}

/** A step tempered, said for its moment: the step reached and what the piece now gives; fully tempered, a
 *  banner. */
export function temperedWords(item: string, step: number): { title: string; body: string; top: boolean } {
  const weapon = itemOf(item)?.gear?.slot === 'weapon';
  return {
    title: t('temper.done', { item: t(`item.${item}`), step: fmt.int(step), of: fmt.int(TEMPER.STEPS) }),
    body: t('temper.now', {
      gives: weapon
        ? t('temper.damage', { pct: fmt.pct(step * TEMPER.PCT) })
        : t('temper.guard', { pct: fmt.pct(guardOf(step)) }),
    }),
    top: step >= TEMPER.STEPS,
  };
}
