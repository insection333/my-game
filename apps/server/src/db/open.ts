// One SQLite file holds the kernel's saves and the server's tables. The kernel's store opens it and
// applies its migrations; the server applies its own on the same connection, in its own table.
import { openStore, type SqliteStore } from '@idle-clash/kernel/store';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { fileURLToPath } from 'node:url';

export interface Db {
  store: SqliteStore;
  db: BetterSQLite3Database;
  close: () => void;
}

export function openDb(path: string): Db {
  const store = openStore(path);
  const db = drizzle(store.sqlite);
  migrate(db, {
    migrationsFolder: fileURLToPath(new URL('../../migrations', import.meta.url)),
    migrationsTable: '__server_migrations',
  });
  return { store, db, close: () => store.close() };
}
