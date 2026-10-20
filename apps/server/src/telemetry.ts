// Telemetry: sessions, notable events and stop reasons, keyed by player id. No names, no addresses,
// no free text: only event types and the event's own fields.
import { isNotable, type GameEvent } from '@idle-clash/kernel';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { telemetry } from './db/schema.ts';

export class Telemetry {
  private db: BetterSQLite3Database;
  private now: () => number;
  constructor(db: BetterSQLite3Database, now: () => number) {
    this.db = db;
    this.now = now;
  }

  record(type: string, playerId: string | null, data?: Record<string, unknown>): void {
    this.db
      .insert(telemetry)
      .values({ type, playerId, at: this.now(), data: data ? JSON.stringify(data) : null })
      .run();
  }

  /** Notable moments and lane stops, by type; the event carries ids and numbers only. */
  events(playerId: string, events: GameEvent[]): void {
    for (const e of events) {
      if (!isNotable(e) && e.type !== 'laneStopped') continue;
      const { type, ...data } = e;
      this.db
        .insert(telemetry)
        .values({ type: `game.${type}`, playerId, at: e.at, data: JSON.stringify(data) })
        .run();
    }
  }
}
