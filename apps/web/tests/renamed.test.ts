// A player renamed by an admin (session 291): their open page kept the old name until it was loaded again, so
// Your profile led to "There is no player of that name.", their own card offered Report this player, and the
// rail and Settings named them as they were. The server tells their pages the new name, and a page that was
// not listening (asleep, offline, closed for a newer one) asks again as its channel reopens.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { newState } from '@idle-clash/kernel';

const T = Date.now();
let name = 'Rowan';
const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
const sockets: { onmessage: ((e: { data: string }) => void) | null; onopen: (() => void) | null; onclose: unknown }[] =
  [];

beforeAll(() => {
  vi.stubGlobal('location', { protocol: 'https:', host: 'idleclash.com' });
  vi.stubGlobal('document', { hidden: false, visibilityState: 'visible', addEventListener: () => undefined });
  vi.stubGlobal('window', { addEventListener: () => undefined, removeEventListener: () => undefined });
  vi.stubGlobal(
    'WebSocket',
    class {
      onmessage = null;
      onopen = null;
      onclose = null;
      constructor() {
        sockets.push(this);
      }
      close() {}
    },
  );
  vi.stubGlobal('fetch', (path: string) => {
    if (path === '/api/me')
      return Promise.resolve(
        json({ player: { id: 'p1', name }, flags: { woodcutting: true }, email: { enabled: false } }),
      );
    if (path === '/api/game') return Promise.resolve(json({ state: newState(7, T), now: T }));
    if (path.startsWith('/api/mail')) return Promise.resolve(json({ unread: 0, letters: [] }));
    return Promise.resolve(json({}));
  });
});
afterAll(() => vi.unstubAllGlobals());

describe('a player renamed while their page is open', () => {
  it('is named anew as the server tells it, and asks again when the channel reopens', async () => {
    const { boot, sessionStore } = await import('../src/game/session.ts');
    await boot();
    expect(sessionStore.get().player?.name).toBe('Rowan');
    const socket = sockets.at(-1)!;
    socket.onmessage!({ data: JSON.stringify({ type: 'renamed', name: 'Birch' }) });
    expect(sessionStore.get().player).toEqual({ id: 'p1', name: 'Birch' });

    // Renamed again while the channel was down: the reopened channel asks who is here.
    name = 'Alder';
    socket.onopen!();
    (socket as unknown as { onclose: (e: { code: number }) => void }).onclose({ code: 1006 });
    await new Promise((r) => setTimeout(r, 1_600));
    sockets.at(-1)!.onopen!();
    await vi.waitFor(() => expect(sessionStore.get().player?.name).toBe('Alder'));
  });
});
