// Saves in SQLite (one file, write-ahead mode) through Drizzle. Every read mends a damaged save and
// keeps the damaged original; every write is checked against the schema and the revision it read.
import Database from 'better-sqlite3';
import { and, eq } from 'drizzle-orm';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { fileURLToPath } from 'node:url';
import { SaveConflict, type SaveStore } from '../requests.ts';
import { SaveDoc, SAVE_VERSION, type State } from '../schema.ts';
import { load } from '../versions.ts';
import { damagedSaves, saves } from './schema.ts';

const MIGRATIONS = fileURLToPath(new URL('../../migrations', import.meta.url));

export interface ReadSave {
  doc: SaveDoc;
  rev: number;
  /** What mending repaired on this read; empty for a sound save. */
  repairs: string[];
}

/** Statements kept, at most; past it they are all let go and kept afresh (a guard, never reached in use). */
const STATEMENTS_KEPT = 1000;

/**
 * Keeps each statement SQLite has compiled, by its text (session 37). Drizzle asks for a new one on
 * every query, and compiling them was the server's largest single cost under load. A statement is used
 * whole within one synchronous call (nothing here iterates one across an await), so sharing is safe; the
 * row shape Drizzle may have asked of it last time (`raw`) is reset before it is handed out again.
 */
function keepStatements(sqlite: Database.Database): void {
  const kept = new Map<string, Database.Statement>();
  const compile = sqlite.prepare.bind(sqlite);
  sqlite.prepare = ((source: string) => {
    const known = kept.get(source);
    if (known) {
      if (known.reader) known.raw(false);
      return known;
    }
    if (kept.size >= STATEMENTS_KEPT) kept.clear();
    const made = compile(source);
    kept.set(source, made);
    return made;
  }) as typeof sqlite.prepare;
}

export class SqliteStore implements SaveStore {
  readonly sqlite: Database.Database;
  readonly db: BetterSQLite3Database;

  constructor(path: string) {
    this.sqlite = new Database(path);
    this.sqlite.pragma('journal_mode = WAL');
    this.sqlite.pragma('synchronous = NORMAL');
    this.sqlite.pragma('busy_timeout = 5000');
    keepStatements(this.sqlite);
    this.db = drizzle(this.sqlite);
    migrate(this.db, { migrationsFolder: MIGRATIONS });
  }

  create(player: string, state: State, now: number): void {
    const doc = SaveDoc.parse({ version: SAVE_VERSION, state, requests: [] });
    this.db
      .insert(saves)
      .values({ playerId: player, version: SAVE_VERSION, rev: 0, doc: JSON.stringify(doc), updatedAt: now })
      .run();
  }

  read(player: string, now: number): ReadSave | null {
    return this.sqlite.transaction((): ReadSave | null => {
      const row = this.db.select().from(saves).where(eq(saves.playerId, player)).get();
      if (!row) return null;
      let raw: unknown;
      try {
        raw = JSON.parse(row.doc);
      } catch {
        raw = undefined;
      }
      const loaded = load(raw, now);
      const upgraded = loaded.from !== SAVE_VERSION;
      if (!loaded.repairs.length && !upgraded) return { doc: loaded.doc, rev: row.rev, repairs: [] };
      if (loaded.repairs.length) {
        this.db
          .insert(damagedSaves)
          .values({ playerId: player, doc: row.doc, repairs: JSON.stringify(loaded.repairs), at: now })
          .run();
      }
      this.writeRow(player, loaded.doc, row.rev, now);
      return { doc: loaded.doc, rev: row.rev + 1, repairs: loaded.repairs };
    })();
  }

  write(player: string, doc: SaveDoc, rev: number, now: number): void {
    this.writeRow(player, SaveDoc.parse(doc), rev, now);
  }

  private writeRow(player: string, doc: SaveDoc, rev: number, now: number): void {
    const done = this.db
      .update(saves)
      .set({ doc: JSON.stringify(doc), version: SAVE_VERSION, rev: rev + 1, updatedAt: now })
      .where(and(eq(saves.playerId, player), eq(saves.rev, rev)))
      .run();
    if (done.changes !== 1) throw new SaveConflict(player);
  }

  /** Deletes a player's save and every damaged copy of it (the account is being deleted). */
  remove(player: string): void {
    this.sqlite.transaction(() => {
      this.db.delete(saves).where(eq(saves.playerId, player)).run();
      this.db.delete(damagedSaves).where(eq(damagedSaves.playerId, player)).run();
    })();
  }

  /** The damaged originals kept for a player, newest last. */
  damaged(player: string) {
    return this.db.select().from(damagedSaves).where(eq(damagedSaves.playerId, player)).all();
  }

  close(): void {
    this.sqlite.close();
  }
}

export const openStore = (path: string) => new SqliteStore(path);
