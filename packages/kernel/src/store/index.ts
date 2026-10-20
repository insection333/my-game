// The SQLite store: server-side only. The web app imports @idle-clash/kernel, never this.
export { openStore, SqliteStore, type ReadSave } from './store.ts';
export { saves, damagedSaves } from './schema.ts';
