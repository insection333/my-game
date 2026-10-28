// A page closed by the server because the player opened too many (code 4408) does not open again by
// itself, or a player with many tabs would have them close each other for ever; it opens again when
// the player comes back to it. A dropped page reopens as before.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onConnection } from '../src/game/connection.ts';
import { openLive } from '../src/game/live.ts';

const sockets: { onclose: ((e: { code: number }) => void) | null; onopen: (() => void) | null }[] = [];
const doc = { visibilityState: 'hidden', listeners: [] as (() => void)[] };

beforeEach(() => {
  sockets.length = 0;
  vi.useFakeTimers();
  vi.stubGlobal('location', { protocol: 'https:', host: 'idleclash.com' });
  vi.stubGlobal(
    'WebSocket',
    class {
      onclose = null;
      onopen = null;
      onmessage = null;
      constructor() {
        sockets.push(this);
      }
      close() {}
    },
  );
  vi.stubGlobal('document', {
    get visibilityState() {
      return doc.visibilityState;
    },
    addEventListener: (_: string, fn: () => void) => doc.listeners.push(fn),
    removeEventListener: () => undefined,
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  doc.listeners.length = 0;
});

const handlers = () => ({ state: vi.fn(), events: vi.fn(), signedOut: vi.fn(), reopened: vi.fn() });

describe('the live channel', () => {
  it('reopens a dropped page with growing pauses', () => {
    const live = openLive(handlers());
    sockets[0].onclose?.({ code: 1006 });
    vi.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(2);
    live.close();
  });

  it('stays closed when the player opened too many pages, until they come back to this one', () => {
    const on = handlers();
    const heard: boolean[] = [];
    const stop = onConnection((up) => heard.push(up));
    const live = openLive(on);
    sockets[0].onopen?.();
    sockets[0].onclose?.({ code: 4408 });
    vi.advanceTimersByTime(120_000);
    expect(sockets).toHaveLength(1);
    // Not shown as a lost connection: the page still plays through the server.
    expect(heard).not.toContain(false);
    doc.visibilityState = 'visible';
    for (const l of doc.listeners) l();
    expect(sockets).toHaveLength(2);
    sockets[1].onopen?.();
    expect(on.reopened).toHaveBeenCalled();
    stop();
    live.close();
  });
});
