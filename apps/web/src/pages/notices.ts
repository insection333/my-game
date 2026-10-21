// The notices the page knows of: the server's (written changes), and this page's own events it has
// not yet heard back about, each once, newest first.
import { recap } from '@idle-clash/features';
import type { GameEvent } from '@idle-clash/kernel';
import type { GameView } from '../game/store.ts';

export type Notice = recap.RecapLine & { at: number };

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
    if (line) out.push(line);
  }
  return out;
}
