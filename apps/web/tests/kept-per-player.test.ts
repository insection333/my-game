// What a browser keeps is kept for each player (session 204): the tour's end, when the tray was last read and
// whether notices while away were offered were kept for the browser, so a second player on one device (a
// family's tablet, a friend's second account) never saw the tour, never had notices offered, and read the
// bell by the first player's reading.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { keepFor } from '../src/kept.ts';
import { notePushOffered, pushOffered } from '../src/push.ts';
import { finishTour, tourDone } from '../src/shell/tour-done.ts';
import { noteTrayRead, trayReadAt } from '../src/pages/tray-read.ts';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  vi.stubGlobal('window', { dispatchEvent: () => true });
});

describe('a second player on one browser', () => {
  it('sees the tour, is offered notices and reads the bell afresh', () => {
    keepFor('alder');
    finishTour();
    notePushOffered();
    noteTrayRead(1_000);
    expect([tourDone(), pushOffered(), trayReadAt()]).toEqual([true, true, 1_000]);
    keepFor('birch');
    expect([tourDone(), pushOffered(), trayReadAt()]).toEqual([false, false, 0]);
    keepFor('alder');
    expect([tourDone(), pushOffered(), trayReadAt()]).toEqual([true, true, 1_000]);
  });
});
