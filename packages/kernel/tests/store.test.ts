import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createEngine, HOUR, newState, SAVE_VERSION, SaveConflict, seeded, type SaveDoc } from '../src/index.ts';
import { openStore, saves, type SqliteStore } from '../src/store/index.ts';
import { eq } from 'drizzle-orm';
import { A, registry, T0 } from './fixtures.ts';

let dir: string;
let store: SqliteStore;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'idle-clash-'));
  store = openStore(join(dir, 'game.db'));
});
afterEach(() => {
  store.close();
  rmSync(dir, { recursive: true, force: true });
});

const sample = () => readFileSync(new URL('./saves/v2.json', import.meta.url), 'utf8');

describe('the SQLite store', () => {
  it('applies its migrations to a new file, in write-ahead mode', () => {
    const tables = store.sqlite.prepare("select name from sqlite_master where type = 'table' order by name").all();
    expect(tables.map((t) => (t as { name: string }).name)).toEqual(
      expect.arrayContaining(['__drizzle_migrations', 'damaged_saves', 'saves']),
    );
    expect(store.sqlite.pragma('journal_mode', { simple: true })).toBe('wal');
  });

  it('round-trips a save exactly', () => {
    const engine = createEngine(registry);
    const rng = seeded(5);
    let state = newState(5, T0);
    state = engine.command(state, T0, { type: 'start', lane: 'gathering', action: A.pine }, rng).state;
    state = engine.advance(state, T0 + HOUR, rng).state;
    store.create('p1', state, T0);
    const read = store.read('p1', T0 + HOUR);
    expect(read).toEqual({ doc: { version: SAVE_VERSION, state, requests: [] }, rev: 0, repairs: [] });
  });

  it('refuses a write based on a stale read', () => {
    store.create('p1', newState(1, T0), T0);
    const a = store.read('p1', T0)!;
    const b = store.read('p1', T0)!;
    store.write('p1', a.doc, a.rev, T0);
    expect(() => store.write('p1', b.doc, b.rev, T0)).toThrow(SaveConflict);
  });

  it('never writes a save that fails the schema', () => {
    store.create('p1', newState(1, T0), T0);
    const { doc, rev } = store.read('p1', T0)!;
    const bad = { ...doc, state: { ...doc.state, clock: -1 } } as SaveDoc;
    expect(() => store.write('p1', bad, rev, T0)).toThrow();
  });

  it('mends a damaged save on read, keeps the original, and writes the mended one back', () => {
    store.create('p1', newState(1, T0), T0);
    const broken = sample().replace('"copper-ore": 10', '"copper-ore": -10');
    store.db.update(saves).set({ doc: broken }).where(eq(saves.playerId, 'p1')).run();
    const read = store.read('p1', T0 + 4 * HOUR)!;
    expect(read.repairs).toHaveLength(1);
    expect(read.doc.state.items['copper-ore']).toBeUndefined();
    expect(read.doc.state.items['pine-logs']).toBe(1440);
    expect(store.damaged('p1')).toMatchObject([{ doc: broken }]);
    expect(store.read('p1', T0 + 4 * HOUR)).toMatchObject({ rev: read.rev, repairs: [] });
  });

  it('mends a save that is not even JSON', () => {
    store.create('p1', newState(1, T0), T0);
    store.db.update(saves).set({ doc: '{"version":1,"state":' }).where(eq(saves.playerId, 'p1')).run();
    const read = store.read('p1', T0)!;
    expect(read.repairs).toEqual(['The save was unreadable; a fresh start was made']);
    expect(store.damaged('p1')).toHaveLength(1);
  });

  it('loads the version 1 sample save stored as an old player would have it', () => {
    store.create('p1', newState(1, T0), T0);
    store.db.update(saves).set({ doc: sample() }).where(eq(saves.playerId, 'p1')).run();
    const read = store.read('p1', T0 + 4 * HOUR)!;
    expect(read.repairs).toEqual([]);
    const next = createEngine(registry).advance(read.doc.state, T0 + 5 * HOUR, seeded(read.doc.state.seed));
    expect(next.state.items['pine-logs']).toBeGreaterThan(1440);
  });

  it('returns nothing for a player with no save', () => {
    expect(store.read('nobody', T0)).toBeNull();
  });
});
