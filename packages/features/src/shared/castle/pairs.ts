// Castle Clash's pair-scoped rules (SPEC.md section 4D): what one attacker has done to one defender in the
// last 24 hours, and the compromised network a caught spy leaves on that pair only. Kept on the attacker's
// row, at most 20 pairs, the stalest dropped first (DESIGN.md 5.14).
import { ESPIONAGE } from '@idle-clash/content';
import type { Castle, PairEntry } from './castle.ts';

const blank = (d: string): PairEntry => ({ d, sieges: [], spies: [], cn: 0, cnUntil: 0 });

/** A pair as of now: old sieges and spy missions forgotten, a lapsed compromised network cleared. */
export function pairOf(c: Castle, defender: string, now: number): PairEntry {
  const p = c.pairs.find((x) => x.d === defender) ?? blank(defender);
  const since = now - ESPIONAGE.PAIR_WINDOW_MS;
  return {
    d: p.d,
    sieges: p.sieges.filter((t) => t > since),
    spies: p.spies.filter((t) => t > since),
    cn: p.cnUntil > now ? p.cn : 0,
    cnUntil: p.cnUntil > now ? p.cnUntil : 0,
  };
}

const lastTouch = (p: PairEntry) => Math.max(0, ...p.sieges, ...p.spies, p.cnUntil);

/** Every pair as of now, empty ones dropped, at most 20 kept (the most recently touched). */
export function prunePairs(pairs: readonly PairEntry[], now: number): PairEntry[] {
  const since = now - ESPIONAGE.PAIR_WINDOW_MS;
  return pairs
    .map((p) => ({
      ...p,
      sieges: p.sieges.filter((t) => t > since),
      spies: p.spies.filter((t) => t > since),
      cn: p.cnUntil > now ? p.cn : 0,
      cnUntil: p.cnUntil > now ? p.cnUntil : 0,
    }))
    .filter((p) => p.sieges.length || p.spies.length || p.cn > 0)
    .sort((a, b) => lastTouch(b) - lastTouch(a))
    .slice(0, ESPIONAGE.PAIR_ENTRIES);
}

/** The castle with one pair replaced (and the list pruned). */
export function withPair(c: Castle, pair: PairEntry, now: number): Castle {
  return { ...c, pairs: prunePairs([pair, ...c.pairs.filter((p) => p.d !== pair.d)], now) };
}
