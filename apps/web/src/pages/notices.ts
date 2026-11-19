// The notices the page knows of: the server's (written changes), and this page's own events it has
// not yet heard back about, each once, newest first.
import { fmt, t } from '@idle-clash/content';
import { recap } from '@idle-clash/features';
import type { GameEvent } from '@idle-clash/kernel';
import type { GameView } from '../game/store.ts';

/** A notice, and the lord it names where it names one (a siege or a spy against you), whose profile card
 *  it offers (session 46). */
export type Notice = recap.RecapLine & {
  at: number;
  who?: string;
  deed?: string;
  /** Deeds done together, newest first, with each one's tier beside it. */
  deeds?: string[];
  tiers?: string[];
};

/** Deeds done within the same minute, one after another, read as one line ("Deeds done: Castle 10, War
 *  marks: 100 and Tempered +3") rather than a column of "Deed done:" (session 46). */
const TOGETHER_MS = 60_000;

/** What makes two events one notice. A route this page runs at once and the server runs again (deeds
 *  recorded, a goal claimed) says the same thing at two clocks' times, so those are known by what they
 *  say: a deed by its id (done once ever), a goal by its words within the minute (session 58: "Deeds
 *  done: Castle 10, …, Castle 10" listed each deed twice). */
const keyOf = (e: GameEvent): string =>
  e.type === 'deedDone'
    ? `deed:${e.deed}`
    : e.type === 'goalDone'
      ? JSON.stringify({ ...e, at: Math.floor(e.at / TOGETHER_MS) })
      : JSON.stringify(e);

/** Deeds' tiers, least first: a line of deeds done together wears its best one's medallion (session 68). */
const TIERS = ['easy', 'hard', 'elite', 'master'];
const better = (a: Notice['medal'], b: Notice['medal']): Notice['medal'] =>
  !a ? b : !b ? a : TIERS.indexOf(b.tier) > TIERS.indexOf(a.tier) ? b : a;

/** Past this many deeds together, the line names the best and two more and counts the rest (session 150:
 *  twenty names stood as a wall of words over a newcomer's goals). */
const NAMED = 4;

/** The words for deeds done together, given newest first: in the order done, or the best first. */
function deedsText(names: string[], tiers: string[]): string {
  const done = [...names].reverse();
  if (done.length <= NAMED) return t('moment.deedsDone', { deeds: fmt.list(done) });
  const order = [...tiers].reverse();
  const best = order.reduce((b, tier, i) => (TIERS.indexOf(tier) > TIERS.indexOf(order[b]) ? i : b), 0);
  const shown = [done[best], ...done.filter((_, i) => i !== best).slice(0, 2)];
  return t('moment.deedsDoneMore', { deeds: shown.join(', '), count: fmt.int(done.length - shown.length) });
}

// Asked on every draw (the bell is always there): worked out again only when the lists change.
let last: { notices: GameEvent[]; events: GameEvent[]; length: number; out: Notice[] } | null = null;

export function noticesOf(view: Pick<GameView, 'notices' | 'events'>): Notice[] {
  if (
    last &&
    last.notices === view.notices &&
    last.length === view.events.length &&
    last.events.at(-1) === view.events.at(-1)
  )
    return last.out;
  const out = list(view);
  last = { notices: view.notices, events: view.events, length: view.events.length, out };
  return out;
}

function list(view: Pick<GameView, 'notices' | 'events'>): Notice[] {
  const seen = new Set<string>();
  const out: Notice[] = [];
  const all: GameEvent[] = [...view.notices, ...view.events];
  for (const e of all.sort((a, b) => b.at - a.at)) {
    const key = keyOf(e);
    if (seen.has(key)) continue;
    seen.add(key);
    const line = recap.noticeLine(e);
    if (!line) continue;
    const prev = out.at(-1);
    if (e.type === 'deedDone' && prev?.deed !== undefined && prev.at - e.at <= TOGETHER_MS) {
      const names = [...(prev.deeds ?? [prev.deed]), e.name];
      const tiers = [...(prev.tiers ?? [prev.medal?.tier ?? 'easy']), e.tier];
      out[out.length - 1] = {
        ...prev,
        medal: better(prev.medal, line.medal),
        deeds: names,
        tiers,
        text: deedsText(names, tiers),
      };
    } else if (e.type === 'deedDone') out.push({ ...line, deed: e.name, tiers: [e.tier] });
    else out.push(e.type === 'castleBesieged' || e.type === 'castleSpyCaught' ? { ...line, who: e.foe } : line);
  }
  return out;
}
