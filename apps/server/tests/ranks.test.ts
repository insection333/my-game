// The ladders held in memory (session 37) give every rank the table would: a player's rank is one more
// than the listed, unbanned players strictly above them, through writes, listings, bans and deletions.
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openDb, type Db } from '../src/db/open.ts';
import { Ranks, type Standing } from '../src/game/ranks.ts';

let db: Db;
afterEach(() => db?.close());

/** A small seeded generator, so a failure repeats. */
function rng(seed: number) {
  let x = seed;
  return () => (x = (x * 1_103_515_245 + 12_345) % 2 ** 31) / 2 ** 31;
}

function open() {
  db = openDb(join(mkdtempSync(join(tmpdir(), 'ranks-')), 'r.db'));
  const sq = db.store.sqlite;
  return {
    player: (id: string, listed: boolean) =>
      sq
        .prepare(
          `insert into players (id, name, name_key, name_look, password_hash, created_at, listed_at) values (?, ?, ?, ?, 'x', 0, ?)`,
        )
        .run(id, id, id, id, listed ? 1 : null),
    row: (s: Standing, skill = 'mining') =>
      sq
        .prepare(
          `insert into hiscores (player_id, skill, level, xp, milestones, reached_at) values (?, ?, ?, ?, 0, ?)
           on conflict (player_id, skill) do update set level = excluded.level, xp = excluded.xp, reached_at = excluded.reached_at`,
        )
        .run(s.playerId, skill, s.level, s.xp, s.reachedAt),
    set: (sql: string, ...args: unknown[]) => sq.prepare(sql).run(...args),
    /** The rank as the table counts it. */
    counted: (mine: Omit<Standing, 'playerId'>, skill = 'mining') =>
      (
        sq
          .prepare(
            `select count(*) as n from hiscores h join players p on p.id = h.player_id
             where h.skill = ? and h.xp > 0 and p.banned_at is null and p.listed_at is not null
               and (h.level > ? or (h.level = ? and h.xp > ?) or (h.level = ? and h.xp = ? and h.reached_at < ?))`,
          )
          .get(skill, mine.level, mine.level, mine.xp, mine.level, mine.xp, mine.reachedAt) as { n: number }
      ).n + 1,
  };
}

describe('ranks held in memory', () => {
  it('match the table through writes, listings, bans and deletions', () => {
    const t = open();
    const ranks = new Ranks(db.db);
    const r = rng(7);
    const ids = Array.from({ length: 60 }, (_, i) => `p${String(i).padStart(2, '0')}`);
    const listed = new Set<string>();
    const entry = new Map<string, Standing>();
    for (const id of ids) {
      const on = r() < 0.7;
      t.player(id, on);
      if (on) listed.add(id);
      // Few distinct levels and XP, so ties of every kind come up.
      const s = {
        playerId: id,
        level: 1 + Math.floor(r() * 4),
        xp: Math.floor(r() * 6) * 100,
        reachedAt: Math.floor(r() * 3),
      };
      t.row(s);
      entry.set(id, s);
    }
    const check = () => {
      for (const id of ids) expect(ranks.rank('mining', entry.get(id)!), id).toBe(t.counted(entry.get(id)!));
    };
    check();
    for (let step = 0; step < 400; step++) {
      const id = ids[Math.floor(r() * ids.length)];
      const roll = r();
      if (roll < 0.75) {
        // A row written: XP only grows; a level up now and then; reached now if the XP moved.
        const old = entry.get(id)!;
        const xp = old.xp + Math.floor(r() * 3) * 100;
        const s = {
          playerId: id,
          level: old.level + (r() < 0.2 ? 1 : 0),
          xp,
          reachedAt: xp === old.xp ? old.reachedAt : 3 + step,
        };
        t.row(s);
        entry.set(id, s);
        ranks.set('mining', s);
      } else if (roll < 0.85 && !listed.has(id)) {
        t.set('update players set listed_at = 1 where id = ?', id);
        listed.add(id);
        ranks.joined(id);
      } else if (roll < 0.92) {
        // A ban, or its lifting: the ladders are let go.
        t.set('update players set banned_at = case when banned_at is null then 1 else null end where id = ?', id);
        ranks.forget();
      } else if (roll < 0.95) {
        t.set('delete from hiscores where player_id = ?', id);
        ranks.drop(id);
        const s = { playerId: id, level: 1, xp: 0, reachedAt: 0 };
        t.row(s);
        entry.set(id, s);
      }
      if (step % 20 === 0) check();
    }
    check();
  });

  it('read a ladder only once, then keep it in step', () => {
    const t = open();
    const ranks = new Ranks(db.db);
    t.player('a', true);
    t.player('b', true);
    t.row({ playerId: 'a', level: 5, xp: 500, reachedAt: 0 });
    t.row({ playerId: 'b', level: 3, xp: 300, reachedAt: 0 });
    expect(ranks.rank('mining', { level: 3, xp: 300, reachedAt: 0 })).toBe(2);
    // Written to the table behind its back, the ladder does not see it; told, it does.
    t.row({ playerId: 'b', level: 6, xp: 600, reachedAt: 1 });
    expect(ranks.rank('mining', { level: 5, xp: 500, reachedAt: 0 })).toBe(1);
    ranks.set('mining', { playerId: 'b', level: 6, xp: 600, reachedAt: 1 });
    expect(ranks.rank('mining', { level: 5, xp: 500, reachedAt: 0 })).toBe(2);
  });
});
