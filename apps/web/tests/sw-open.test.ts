// A notice pressed while the game is already open in a tab (session 302): the worker took the tab to the notice's
// page by navigating it, a load afresh that threw away a letter half written and the presses still waiting to be
// sent (session 274). The open tab is now told where to go and goes there in place; a tab of a build that does
// not listen is only brought forward.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { openFromNotice } from '../src/notice-open.ts';

type Listener = (e: unknown) => void;
function worker(
  clients: {
    url: string;
    focus: () => Promise<void>;
    navigate: (u: string) => Promise<void>;
    postMessage: (m: unknown) => void;
  }[],
) {
  const on = new Map<string, Listener>();
  const opened: string[] = [];
  const self = {
    location: { origin: 'https://idleclash.com' },
    addEventListener: (type: string, fn: Listener) => on.set(type, fn),
    skipWaiting: () => undefined,
    clients: {
      matchAll: () => Promise.resolve(clients),
      openWindow: (u: string) => (opened.push(u), Promise.resolve()),
      claim: () => undefined,
    },
    registration: { showNotification: () => Promise.resolve() },
  };
  runInNewContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), { self, URL });
  return { on, opened };
}

describe('a notice pressed with the game open', () => {
  it('tells the open tab where to go, rather than loading it afresh', async () => {
    const said: unknown[] = [];
    const went: string[] = [];
    const tab = {
      url: 'https://idleclash.com/storehouse',
      focus: () => Promise.resolve(),
      navigate: (u: string) => (went.push(u), Promise.resolve()),
      postMessage: (m: unknown) => said.push(m),
    };
    const { on, opened } = worker([tab]);
    let done: Promise<unknown> = Promise.resolve();
    on.get('notificationclick')!({
      notification: { close: () => undefined, data: { url: '/combat?region=peaks' } },
      waitUntil: (p: Promise<unknown>) => (done = p),
    });
    await done;
    expect(went).toEqual([]);
    expect(opened).toEqual([]);
    expect(said).toEqual([{ type: 'idle-clash:open', url: '/combat?region=peaks' }]);
  });

  it('goes there in place, and only to a page of this site', () => {
    const to: string[] = [];
    const go = (u: string) => to.push(u);
    openFromNotice({ type: 'idle-clash:open', url: '/combat?region=peaks' }, go);
    openFromNotice({ type: 'idle-clash:open', url: '//elsewhere.example' }, go);
    openFromNotice({ type: 'idle-clash:open', url: '/\\elsewhere.example' }, go);
    openFromNotice({ type: 'other', url: '/' }, go);
    openFromNotice(null, go);
    expect(to).toEqual(['/combat?region=peaks']);
  });
});
