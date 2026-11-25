// The console's heavier reads, made once in a while and shared (session 233). The server answers every
// request on one thread, SQLite with it, so the time a count takes is time no player is answered in; the
// Overview reads itself again every half minute while open, and two admins, or one with two tabs, would
// each make it afresh. A memo keeps what was made until it is `ms` old, by the server's clock, and every
// admin is answered from it: the page says the time its figures stand at.
import type Database from 'better-sqlite3';

export function memo<T>(now: () => number, ms: number, make: () => T): () => T {
  let made: { at: number; value: T } | null = null;
  return () => {
    const t = now();
    if (!made || t - made.at >= ms || t < made.at) made = { at: t, value: make() };
    return made.value;
  };
}

/** A statement prepared once and kept, where the console's reads prepared each query afresh on every read. */
export function statements(db: Database.Database) {
  const kept = new Map<string, Database.Statement>();
  return (sql: string) => {
    let s = kept.get(sql);
    if (!s) kept.set(sql, (s = db.prepare(sql)));
    return s;
  };
}
