// The console's heavier reads, made once in a while and shared (session 233). The server answers every
// request on one thread, SQLite with it, so the time a count takes is time no player is answered in; the
// Overview reads itself again every half minute while open, and two admins, or one with two tabs, would
// each make it afresh. A memo keeps what was made until it is `ms` old, by the server's clock, and every
// admin is answered from it: the page says the time its figures stand at.
import type Database from 'better-sqlite3';

export function memo<T>(now: () => number, ms: number, make: () => T): (() => T) & { forget: () => void } {
  let made: { at: number; value: T } | null = null;
  const read = () => {
    const t = now();
    if (!made || t - made.at >= ms || t < made.at) made = { at: t, value: make() };
    return made.value;
  };
  /** Made afresh at the next read (an admin changed what it holds). */
  read.forget = () => void (made = null);
  return read;
}

/** What is kept for each server and must be made afresh once an admin acts or an account goes (session
 *  236: the directory, so a ban or a rename shows at once). */
const forgetters = new WeakMap<object, Set<() => void>>();
export function onChange(ctx: object, forget: () => void): void {
  const set = forgetters.get(ctx) ?? new Set();
  set.add(forget);
  forgetters.set(ctx, set);
}
export function changed(ctx: object): void {
  for (const f of forgetters.get(ctx) ?? []) f();
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
