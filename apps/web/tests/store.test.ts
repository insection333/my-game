// The page's game store against a fake server: a guess shown at once is never undone by an older
// state from the server, and the server's word is taken once nothing is in flight.
import { actionRegistry, FEATURES } from '@idle-clash/features';
import { createEngine, newState, seeded, type Command, type State } from '@idle-clash/kernel';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const T = Date.now();
const engine = createEngine(actionRegistry(FEATURES, () => true));
const run = (s: State, cmd: Command) => engine.command(s, T, cmd, seeded(s.seed)).state;
const start: Command = { type: 'start', lane: 'gathering', action: { feature: 'woodcutting', id: 'pine-tree' } };
const stop: Command = { type: 'stop', lane: 'gathering' };
const S0 = newState(7, T);
const SA = run(S0, start);
const SAB = run(SA, stop);

/** Command answers the test releases by hand, in the order it chooses. */
const answers: ((state: State) => void)[] = [];
const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  vi.stubGlobal('document', { hidden: false, addEventListener: () => undefined });
  vi.stubGlobal('WebSocket', undefined); // no live channel here
  vi.stubGlobal('fetch', (path: string) => {
    if (path === '/api/me')
      return Promise.resolve(
        json({ player: { id: 'p1', name: 'Rowan' }, flags: { woodcutting: true }, email: { enabled: false } }),
      );
    if (path === '/api/game') return Promise.resolve(json({ state: S0, now: T }));
    if (path === '/api/game/command')
      return new Promise<Response>((resolve) =>
        answers.push((state) => resolve(json({ result: { ok: true }, duplicate: false, events: [], state, now: T }))),
      );
    return Promise.reject(new Error(`unexpected ${path}`));
  });
});
afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const settle = () => new Promise((r) => setTimeout(r, 0));

describe('the game store', () => {
  it('keeps two quick commands on screen until the last answer arrives, then takes the server state', async () => {
    const { boot, sessionStore } = await import('../src/game/session.ts');
    const { game } = await import('../src/game/store.ts');
    await boot();
    expect(sessionStore.get().phase).toBe('playing');

    expect(game.command(start)).toEqual({ ok: true });
    expect(game.command(stop)).toEqual({ ok: true });
    expect(game.get().state.lanes.gathering.current).toBeNull();

    answers[0](SA); // the first answer knows nothing of the stop
    await settle();
    expect(game.get().state.lanes.gathering.current).toBeNull();

    const fromServer = { ...SAB, items: { 'pine-logs': 3 } }; // something only the server knew
    answers[1](fromServer);
    await settle();
    expect(game.get().state.items).toEqual({ 'pine-logs': 3 });
  });
});
