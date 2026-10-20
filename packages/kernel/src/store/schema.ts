// The database tables. Change these, then run `pnpm --filter @idle-clash/kernel db:generate` to add a
// migration in packages/kernel/migrations; migrations are applied in order when the store opens.
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** One row per player: the save document, its format version and a revision for safe writes. */
export const saves = sqliteTable('saves', {
  playerId: text('player_id').primaryKey(),
  version: integer('version').notNull(),
  rev: integer('rev').notNull(),
  doc: text('doc').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

/** A copy of every save that needed mending, exactly as it was stored, with what was repaired. */
export const damagedSaves = sqliteTable('damaged_saves', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  playerId: text('player_id').notNull(),
  doc: text('doc').notNull(),
  repairs: text('repairs').notNull(),
  at: integer('at').notNull(),
});
