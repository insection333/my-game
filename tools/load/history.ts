// The load test's players as they will be once the game has run a while (session 37): before the
// measured minutes, each save is given weeks or months of history (the review sheets' veteran, elder and
// keeper: full Storehouses, mastery, deeds, expeditions), and two in three of them a castle with
// reports, so every request reads and writes saves of the size they will have. Written straight into the
// server's database file (SQLite takes the other process's writes), before any player acts.
import { castleEngine as E, actionRegistry, FEATURES } from '@idle-clash/features';
import { createEngine, seeded } from '@idle-clash/kernel';
import { CastleStore } from '../../apps/server/src/castle/store.ts';
import type { Ctx } from '../../apps/server/src/context.ts';
import { openDb } from '../../apps/server/src/db/open.ts';
import { elder, keeper } from '../verify/web/elder.ts';
import { veteran } from '../verify/web/veteran.ts';

const DAY = 86_400_000;

export function giveHistory(dbPath: string, ids: readonly string[]): { castles: number } {
  const db = openDb(dbPath);
  const engine = createEngine(actionRegistry(FEATURES, (f) => f.flag.on));
  const ctx = { engine, store: db.store, db: db.db } as unknown as Ctx;
  const castles = new CastleStore(ctx);
  const now = Date.now();
  let raised = 0;
  for (const [i, id] of ids.entries()) {
    const saved = db.store.read(id, now);
    if (!saved) continue;
    const make = [veteran, elder, keeper][i % 3];
    const made = make(ctx, saved.doc.state, now);
    // Most were here a moment ago; one in ten comes back after hours away, and catches up on its first input.
    const state = i % 10 === 0 ? made : engine.input(made, now, seeded(made.seed)).state;
    db.store.write(id, { ...saved.doc, state }, saved.rev, now);
    if (i % 3 === 0) continue;
    // A castle weeks old, its levels spread so lords sit in each other's brackets.
    const level = 8 + (i % 17);
    const c = E.newCastle(id, now - 30 * DAY);
    const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, level])) as E.Castle['levels'];
    const castle = { ...c, levels, shieldUntil: 0, treasury: 50_000_000, warMarks: 300, activeAp: 200 };
    castles.write({ ...castle, rating: E.bastionRating(castle) });
    for (let n = 0; n < 12; n++)
      castles.log(id, now - n * 3_600_000, 'incursion', { tier: n + 1, won: true, marks: 10 });
    raised++;
  }
  db.close();
  return { castles: raised };
}
