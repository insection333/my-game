// Castle Clash's pair-scoped rules (SPEC.md section 4D): what one attacker has done to one defender in the
// last 24 hours, and the compromised network a caught spy leaves on that pair only. Kept on the attacker's
// row, at most 20 pairs, the stalest dropped first (DESIGN.md 5.14).
import { ESPIONAGE } from '@idle-clash/content';
import type { Castle, PairEntry } from './castle.ts';

const blank = (d: string): PairEntry => ({ d, sieges: [], spies: [], cn: 0, cnUntil: 0 });

/** A pair as of now: old sieges and spy missions forgotten, a lapsed compromised network cleared, and a
 *  stronghold that fell standing again once the siege that took it is a day old. */
export function pairOf(c: Pick<Castle, 'pairs'>, defender: string, now: number): PairEntry {
  const p = c.pairs.find((x) => x.d === defender) ?? blank(defender);
  const since = now - ESPIONAGE.PAIR_WINDOW_MS;
  const sieges = p.sieges.filter((t) => t > since);
  return {
    d: p.d,
    sieges,
    spies: p.spies.filter((t) => t > since),
    cn: p.cnUntil > now ? p.cn : 0,
    cnUntil: p.cnUntil > now ? p.cnUntil : 0,
    ...(p.fell && sieges.length ? { fell: true } : {}),
  };
}

const lastTouch = (p: PairEntry) => Math.max(0, ...p.sieges, ...p.spies, p.cnUntil);

/** Every pair as of now, empty ones dropped, at most 20 kept (the most recently touched). */
export function prunePairs(pairs: readonly PairEntry[], now: number): PairEntry[] {
  return pairs
    .map((p) => pairOf({ pairs: [p] }, p.d, now))
    .filter((p) => p.sieges.length || p.spies.length || p.cn > 0)
    .sort((a, b) => lastTouch(b) - lastTouch(a))
    .slice(0, ESPIONAGE.PAIR_ENTRIES);
}

/** The castle with one pair replaced (and the list pruned). */
export function withPair(c: Castle, pair: PairEntry, now: number): Castle {
  return { ...c, pairs: prunePairs([pair, ...c.pairs.filter((p) => p.d !== pair.d)], now) };
}
