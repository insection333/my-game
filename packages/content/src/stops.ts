// Why a lane stopped, as the player reads it: "Needs level 14", "Out of tin ore". Numbers in a
// reason's detail go through the formatter; an `item` or a `foe` is shown by its name.
import { fmt } from './numbers.ts';
import { placeholders, t, templateOf, type Params } from './t.ts';

export interface Reason {
  code: string;
  detail?: Record<string, string | number>;
}

/** An item's name inside a sentence: "Out of tin ore", in sentence case. */
export const midSentence = (name: string) => name.charAt(0).toLowerCase() + name.slice(1);

/** `short`: the few words a lane's chip has room for ("Out of food"), where a reason has them. */
export function formatStop(reason: Reason, form: 'full' | 'short' = 'full'): string {
  const short = `stopShort.${reason.code}`;
  const key = form === 'short' && templateOf(short) !== undefined ? short : `stop.${reason.code}`;
  const params: Params = {};
  for (const p of placeholders(templateOf(key) ?? '')) {
    const v = reason.detail?.[p];
    if (v === undefined) continue;
    params[p] =
      typeof v === 'number'
        ? fmt.int(v)
        : p === 'item'
          ? midSentence(t(`item.${v}`))
          : p === 'foe'
            ? midSentence(t(`action.combat.${v}`))
            : v;
  }
  return t(key, params);
}
