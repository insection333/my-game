// Reads while the server is out of reach (session 287): the page asked for the game again every five seconds
// whether or not the last ask had come back, and an ask may wait half a minute before it is given up (session
// 282), so six reads stood waiting on a dead connection, each answered at once when it came back. One read at a
// time now, as the first read and the inbox ask (`keepTrying`).
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { newState } from '@idle-clash/kernel';

const T = Date.now();
let reads = 0;
let down = false;
const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  vi.stubGlobal('document', { hidden: false, addEventListener: () => undefined });
  vi.stubGlobal('window', { addEventListener: () => undefined, removeEventListener: () => undefined });
  vi.stubGlobal('WebSocket', undefined);
  vi.stubGlobal('fetch', (path: string) => {
    if (path === '/api/me')
      return Promise.resolve(
        json({ player: { id: 'p1', name: 'Rowan' }, flags: { woodcutting: true }, email: { enabled: false } }),
      );
    if (path === '/api/game') {
      reads++;
      return down ? new Promise<Response>(() => undefined) : Promise.resolve(json({ state: newState(7, T), now: T }));
    }
    return Promise.reject(new Error(`unexpected ${path}`));
  });
});
afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('a page that has lost the server', () => {
  it('asks for the game again one read at a time', async () => {
    const { boot } = await import('../src/game/session.ts');
    const { setConnected } = await import('../src/game/connection.ts');
    await boot();
    down = true;
    reads = 0;
    setConnected(false);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(reads).toBe(1);
  });
});
