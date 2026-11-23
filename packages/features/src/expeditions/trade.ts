// The quartermaster (session 191): once every relic is fully raised (about day 80 for a steady player),
// marks had nothing left to buy, so what a bounty, the realm's boss, a boss's daily fight and every run paid
// in marks was worth nothing for most of the year. The quartermaster takes them for gold, 25 marks for an
// hour of the player's own earning (the gold the goals pay by), so they keep their worth at every stage and
// buy the castle's next level. Shut while a relic can still be raised, so no mark is traded that a rank
// would have been better for.
import { fmt, t } from '@idle-clash/content';
import { give, type GameEvent, type State } from '@idle-clash/kernel';
import { rankOf, relics } from '../shared/expeditions/relics.ts';
import { expeditionsOf, setExpeditions } from '../shared/expeditions/state.ts';
import { earning, nice, paces } from '../shared/pace.ts';

/** Marks one trade takes. */
export const TRADE_MARKS = 25;
/** The least gold a trade pays, for a player with no work open (it never happens once relics are raised). */
const LEAST = 100;

/** Whether every relic stands at its last rank. */
export const allRaised = (state: State): boolean => relics().every((r) => rankOf(state, r.id) >= r.ranks);

/** Gold for one trade: an hour of the player's earning, said round. */
export const tradeGold = (state: State): number => Math.max(LEAST, nice(earning(paces(state)) * 3600));

type Answer<R> = { state: State; result: R; events: GameEvent[] };
export type TradeResult = { ok: true; gold: number; marks: number } | { ok: false; reason: 'relics' | 'marks' };

/** Trades `lots` of 25 marks for gold. */
export function trade(state: State, lots: number): Answer<TradeResult> {
  const no = (reason: 'relics' | 'marks') => ({ state, result: { ok: false as const, reason }, events: [] });
  if (!allRaised(state)) return no('relics');
  const e = expeditionsOf(state);
  const marks = lots * TRADE_MARKS;
  if (e.marks < marks) return no('marks');
  const gold = lots * tradeGold(state);
  const out = structuredClone(state);
  setExpeditions(out, { ...e, marks: e.marks - marks });
  give(out, 'gold', gold);
  return { state: out, result: { ok: true, gold, marks }, events: [] };
}

/** "25 marks", with its one-form. */
export const marksText = (n: number) =>
  n === 1 ? t('expedition.marksOne') : t('expedition.marks', { marks: fmt.int(n) });

export interface TradeView {
  text: string;
  /** One trade, and all the marks held at once (when that is more than one). */
  one: string;
  all: string | null;
  /** Lots in all, and whether one can be traded now. */
  lots: number;
}

export function tradeView(state: State): TradeView | null {
  if (!allRaised(state)) return null;
  const lots = Math.floor(expeditionsOf(state).marks / TRADE_MARKS);
  const each = tradeGold(state);
  const says = (n: number) => t('trade.button', { marks: marksText(n * TRADE_MARKS), gold: fmt.int(n * each) });
  return {
    text: t('trade.note', { marks: marksText(TRADE_MARKS) }),
    one: says(1),
    all: lots > 1 ? says(lots) : null,
    lots,
  };
}
