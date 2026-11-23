// Why a lane stopped, as the player reads it: "Needs level 14", "Out of tin ore". Numbers in a
// reason's detail go through the formatter; an `item` or a `foe` is shown by its name.
import { fmt } from './numbers.ts';
import { allStringKeys, placeholders, t, templateOf, type Params } from './t.ts';

export interface Reason {
  code: string;
  detail?: Record<string, string | number>;
}

/** An item's name inside a sentence: "Out of tin ore", in sentence case. */
/** Stops that are no trouble: the player stopped the lane, a run came home, a boss was fought for the
 *  day, the fire went out (session 189: every absence ended so, and any press lights it and starts its lane
 *  again). Nothing to fix, so no alarm, no notice and no line in the recap. */
export const QUIET_STOPS: readonly string[] = [
  'stoppedByPlayer',
  'expeditionHome',
  // A descent over (session 212): its own line says how it went.
  'deepHome',
  'bossRested',
  'realmRested',
  'fireOut',
];
export const isQuietStop = (code: string): boolean => QUIET_STOPS.includes(code);

export const midSentence = (name: string) => name.charAt(0).toLowerCase() + name.slice(1);

/** The game's own names, which keep their capital inside a sentence: its pages and its skills. */
const NAMES = (): Set<string> =>
  new Set(
    allStringKeys()
      .filter((k) => /^(menu|skill)\.[a-z0-9-]+$/.test(k))
      .map((k) => templateOf(k)!)
      .filter((name) => !name.includes('{'))
      .map((name) => name.split(' ')[0]),
  );

/** `short`: the few words a lane's chip has room for ("Out of food"), where a reason has them. `mid`: said
 *  inside a sentence ("Combat stopped: out of tin ore"), its first word lowered unless it is one of the
 *  game's names ("Combat stopped: Storehouse full"; session 121). */
export function formatStop(reason: Reason, form: 'full' | 'short' | 'mid' = 'full'): string {
  if (form === 'mid') {
    const said = formatStop(reason);
    return NAMES().has(said.split(' ')[0]) ? said : midSentence(said);
  }
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
