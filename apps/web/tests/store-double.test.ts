// Session 156: a bad actor's stress test found a double tap on Buy 10 bought twenty, and on Use spent two
// Rare finds: each press of a feature's route was sent as its own. The same press again within a double
// tap's time is now taken as one.
import { newState } from '@idle-clash/kernel';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const T = Date.now();
const S0 = { ...newState(7, T), items: { gold: 10_000 } };
const sent: string[] = [];
const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
  vi.setSystemTime(T);
  vi.stubGlobal('document', { hidden: false, addEventListener: () => undefined });
  vi.stubGlobal('WebSocket', undefined);
  vi.stubGlobal('fetch', (path: string) => {
    if (path === '/api/me')
      return Promise.resolve(
        json({ player: { id: 'p1', name: 'Rowan' }, flags: { storehouse: true }, email: { enabled: false } }),
      );
    if (path === '/api/game') return Promise.resolve(json({ state: S0, now: T }));
    if (path === '/api/notices') return Promise.resolve(json({ notices: [] }));
    if (path.startsWith('/api/f/')) {
      sent.push(path);
      return new Promise<Response>(() => undefined);
    }
    return Promise.resolve(json({}));
  });
});
afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('a press of a feature route', () => {
  it('takes a double tap as one press, and a later press as its own', async () => {
    const { boot } = await import('../src/game/session.ts');
    const { game } = await import('../src/game/store.ts');
    await boot();
    const buy = () => game.act('storehouse', 'buy', { item: 'bread', count: 10 });
    expect(buy()).toMatchObject({ ok: true });
    expect(buy()).toBeNull();
    expect(game.get().state.items.bread).toBe(10);
    expect(sent).toHaveLength(1);
    vi.advanceTimersByTime(1_000);
    expect(buy()).toMatchObject({ ok: true });
    expect(game.get().state.items.bread).toBe(20);
    expect(sent).toHaveLength(2);
  });
});
