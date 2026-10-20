import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createEngine,
  handle,
  newState,
  PlayerQueue,
  REMEMBERED_REQUESTS,
  seeded,
  type Command,
} from '../src/index.ts';
import { openStore } from '../src/store/index.ts';
import { A, registry, T0 } from './fixtures.ts';

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('PlayerQueue', () => {
  it("never interleaves one player's requests, even when they await", async () => {
    const q = new PlayerQueue();
    const log: string[] = [];
    const req = (name: string, ms: number) =>
      q.run('p1', async () => {
        log.push(`${name} starts`);
        await pause(ms);
        log.push(`${name} ends`);
      });
    await Promise.all([req('a', 30), req('b', 1), req('c', 10)]);
    expect(log).toEqual(['a starts', 'a ends', 'b starts', 'b ends', 'c starts', 'c ends']);
    expect(q.busy).toBe(0);
  });

  it('keeps going after a request fails', async () => {
    const q = new PlayerQueue();
    const failed = q.run('p1', () => Promise.reject(new Error('boom')));
    const next = q.run('p1', () => 'fine');
    await expect(failed).rejects.toThrow('boom');
    await expect(next).resolves.toBe('fine');
  });

  it("lets different players' requests run side by side", async () => {
    const q = new PlayerQueue();
    const log: string[] = [];
    const req = (p: string) =>
      q.run(p, async () => {
        log.push(`${p} starts`);
        await pause(10);
        log.push(`${p} ends`);
      });
    await Promise.all([req('p1'), req('p2')]);
    expect(log.slice(0, 2)).toEqual(['p1 starts', 'p2 starts']);
  });
});

describe('handle', () => {
  function setup() {
    const dir = mkdtempSync(join(tmpdir(), 'idle-clash-'));
    const store = openStore(join(dir, 'game.db'));
    store.create('p1', newState(3, T0), T0);
    const engine = createEngine(registry);
    const queue = new PlayerQueue();
    let applied = 0;
    const send = (id: string, cmd: Command, now = T0) =>
      handle(queue, store, 'p1', id, now, async (doc) => {
        applied++;
        await pause(5); // a handler that awaits, as accounts will
        const out = engine.command(doc.state, now, cmd, seeded(doc.state.seed));
        return { doc: { ...doc, state: out.state }, result: out.result };
      });
    const done = () => {
      store.close();
      rmSync(dir, { recursive: true, force: true });
    };
    return { store, send, applied: () => applied, done };
  }

  it('applies concurrent requests one after the other, with no lost write', async () => {
    const t = setup();
    const results = await Promise.all([
      t.send('r1', { type: 'start', lane: 'gathering', action: A.pine }),
      t.send('r2', { type: 'queueNext', lane: 'gathering', action: A.copper }),
    ]);
    expect(results.map((r) => r.result)).toEqual([{ ok: true }, { ok: true }]);
    const { doc, rev } = t.store.read('p1', T0)!;
    expect(rev).toBe(2);
    expect(doc.state.lanes.gathering.current?.action).toEqual(A.pine);
    expect(doc.state.lanes.gathering.next).toEqual(A.copper);
    t.done();
  });

  it('acts on a request id once: a double click or retry returns the first answer', async () => {
    const t = setup();
    const cmd: Command = { type: 'start', lane: 'gathering', action: A.pine };
    const [first, second] = await Promise.all([t.send('same', cmd), t.send('same', cmd)]);
    expect(first).toEqual({ result: { ok: true }, duplicate: false });
    expect(second).toEqual({ result: { ok: true }, duplicate: true });
    expect(t.applied()).toBe(1);
    expect(t.store.read('p1', T0)!.rev).toBe(1);
    t.done();
  });

  it(`remembers the last ${REMEMBERED_REQUESTS} request ids`, async () => {
    const t = setup();
    for (let i = 0; i < REMEMBERED_REQUESTS + 5; i++) await t.send(`r${i}`, { type: 'stoke' });
    const { doc } = t.store.read('p1', T0)!;
    expect(doc.requests).toHaveLength(REMEMBERED_REQUESTS);
    expect(doc.requests[0].id).toBe('r5');
    t.done();
  });
});
