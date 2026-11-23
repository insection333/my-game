// The bounty board on the Combat page (session 175): the day's three bounties while none is held; the one
// held, with its count and what it pays; Take, Claim, and Let go. Pure routes: each takes the state and
// returns a new one, an answer and the events to announce.
import { dayTurns, fmt, t } from '@idle-clash/content';
import { give, type GameEvent, type State } from '@idle-clash/kernel';
import {
  BOUNTY_GOLD_FIGHTS,
  BOUNTY_MARKS,
  bountyOf,
  bountyWins,
  dayOf,
  offersFor,
  setBounty,
  winsOver,
  type Bounty,
} from '../shared/bounty.ts';
import { foeById, type Foe } from '../shared/combat/data.ts';
import { oddsFor } from '../shared/combat/odds.ts';
import { expeditionsOf, setExpeditions } from '../shared/expeditions/state.ts';

type Answer<R> = { state: State; result: R; events: GameEvent[] };
const no = <R>(state: State, result: R): Answer<R> => ({ state, result, events: [] });

/** A foe the player fares well against (Easy or Fair), with its pace. */
const fair = (state: State) => (foe: Foe) => {
  const o = oddsFor(state, foe);
  return o && (o.verdict === 'easy' || o.verdict === 'fair') ? o : null;
};

/** The day's offers still open: those not yet taken today. */
export function openOffers(state: State, now: number): Bounty[] {
  const b = bountyOf(state);
  const took = b.day === dayOf(now) ? b.took : [];
  return offersFor(state, now, fair(state)).filter((o) => !took.includes(o.foe));
}

const pays = (b: Bounty) => {
  const foe = foeById(b.foe)!;
  return { gold: foe.gold * b.count * BOUNTY_GOLD_FIGHTS, marks: BOUNTY_MARKS * (b.elite ? 2 : 1) };
};

export type TakeResult = { ok: true } | { ok: false; reason: 'held' | 'gone' };

/** Takes one of the day's bounties: its count runs from the foe's wins now. */
export function take(state: State, foe: string, now: number): Answer<TakeResult> {
  const b = bountyOf(state);
  if (b.taken) return no(state, { ok: false, reason: 'held' });
  const offer = openOffers(state, now).find((o) => o.foe === foe);
  if (!offer) return no(state, { ok: false, reason: 'gone' });
  const out = structuredClone(state);
  const day = dayOf(now);
  setBounty(out, {
    ...b,
    taken: { ...offer, base: winsOver(state, foe), day, at: now, won: 0 },
    day,
    took: [...(b.day === day ? b.took : []), foe],
  });
  return { state: out, result: { ok: true }, events: [] };
}

export const progressOf = (state: State) => {
  const held = bountyOf(state).taken;
  if (!held) return null;
  return { now: Math.min(held.count, bountyWins(state)), of: held.count };
};

export type ClaimResult = { ok: true } | { ok: false; reason: 'none' | 'notDone' };

/** Claims a bounty done: its marks and gold, and the bounty counted. */
export function claim(state: State, now: number): Answer<ClaimResult> {
  const b = bountyOf(state);
  const p = progressOf(state);
  if (!b.taken || !p) return no(state, { ok: false, reason: 'none' });
  if (p.now < p.of) return no(state, { ok: false, reason: 'notDone' });
  const out = structuredClone(state);
  const { gold, marks } = pays(b.taken);
  give(out, 'gold', gold);
  const e = expeditionsOf(out);
  setExpeditions(out, { ...e, marks: e.marks + marks });
  setBounty(out, { ...b, taken: null, done: b.done + 1, elites: b.elites + (b.taken.elite ? 1 : 0) });
  return {
    state: out,
    result: { ok: true },
    events: [{ type: 'bountyDone', at: now, foe: b.taken.foe, elite: b.taken.elite, gold, marks }],
  };
}

/** Lets a bounty go, for nothing: a foe grown too hard, or a change of plan. */
export function letGo(state: State): Answer<{ ok: true }> {
  const b = bountyOf(state);
  if (!b.taken) return no(state, { ok: true });
  const out = structuredClone(state);
  setBounty(out, { ...b, taken: null });
  return { state: out, result: { ok: true }, events: [] };
}

export interface BountyLine {
  foe: string;
  name: string;
  elite: boolean;
  text: string;
  pays: string;
}

export interface BountyView {
  held: (BountyLine & { count: string; progress: number; done: boolean }) | null;
  offers: BountyLine[];
  note: string;
}

const line = (b: Bounty): BountyLine => {
  const p = pays(b);
  const name = t(`action.combat.${b.foe}`);
  return {
    foe: b.foe,
    name,
    elite: b.elite,
    text: t(b.elite ? 'bounty.eliteText' : 'bounty.text', { foe: name, count: fmt.int(b.count) }),
    pays:
      p.marks === 1
        ? t('bounty.paysOne', { gold: fmt.int(p.gold) })
        : t('bounty.pays', { gold: fmt.int(p.gold), marks: fmt.int(p.marks) }),
  };
};

/** The board as the Combat page shows it; null before the player can fight. */
export function bountyView(state: State, now: number): BountyView | null {
  const b = bountyOf(state);
  const p = progressOf(state);
  const offers = b.taken ? [] : openOffers(state, now).map(line);
  // The day's three taken: the board says when the next come (session 183: it went, with no word of when).
  if (!b.taken && !offers.length)
    return offersFor(state, now, fair(state)).length
      ? { held: null, offers: [], note: t('bounty.allTaken', { back: dayTurns(now) }) }
      : null;
  return {
    held:
      b.taken && p
        ? {
            ...line(b.taken),
            count: t('goals.count', { now: fmt.int(p.now), of: fmt.int(p.of) }),
            progress: p.of ? p.now / p.of : 0,
            done: p.now >= p.of,
          }
        : null,
    offers,
    note: b.taken ? t('bounty.heldNote') : t('bounty.note'),
  };
}
