// Why a lane stopped, as the player reads it: "Needs level 14", "Out of tin ore". Numbers in a
// reason's detail go through the formatter; an `item` is shown by its name.
import { fmt } from './numbers.ts';
import { placeholders, t, templateOf, type Params } from './t.ts';

export interface Reason {
  code: string;
  detail?: Record<string, string | number>;
}

export function formatStop(reason: Reason): string {
  const key = `stop.${reason.code}`;
  const params: Params = {};
  for (const p of placeholders(templateOf(key) ?? '')) {
    const v = reason.detail?.[p];
    if (v === undefined) continue;
    params[p] = typeof v === 'number' ? fmt.int(v) : p === 'item' ? t(`item.${v}`) : v;
  }
  return t(key, params);
}
