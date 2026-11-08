// The notices the page knows of: the server's (written changes), and this page's own events it has
// not yet heard back about, each once, newest first.
import { fmt, t } from '@idle-clash/content';
import { recap } from '@idle-clash/features';
import type { GameEvent } from '@idle-clash/kernel';
import type { GameView } from '../game/store.ts';

/** A notice, and the lord it names where it names one (a siege or a spy against you), whose profile card
 *  it offers (session 46). */
export type Notice = recap.RecapLine & { at: number; who?: string; deed?: string; deeds?: string[] };

/** Deeds done within the same minute, one after another, read as one line ("Deeds done: Castle 10, War
 *  marks: 100 and Tempered +3") rather than a column of "Deed done:" (session 46). */
const TOGETHER_MS = 60_000;

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
    const key = JSON.stringify(e);
    if (seen.has(key)) continue;
    seen.add(key);
    const line = recap.noticeLine(e);
    if (!line) continue;
    const prev = out.at(-1);
    if (e.type === 'deedDone' && prev?.deed !== undefined && prev.at - e.at <= TOGETHER_MS) {
      const names = [...(prev.deeds ?? [prev.deed]), e.name];
      out[out.length - 1] = {
        ...prev,
        deeds: names,
        text: t('moment.deedsDone', { deeds: fmt.list([...names].reverse()) }),
      };
    } else if (e.type === 'deedDone') out.push({ ...line, deed: e.name });
    else out.push(e.type === 'castleBesieged' || e.type === 'castleSpyCaught' ? { ...line, who: e.foe } : line);
  }
  return out;
}
