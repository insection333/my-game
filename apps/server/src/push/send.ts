// Sending a notice (session 171): through the browser's own push service, signed with the server's keys,
// which it makes once and keeps in its database (never in the repository).
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import webpush from 'web-push';
import { serverSettings } from '../db/schema.ts';

export interface Keys {
  publicKey: string;
  privateKey: string;
}

/** The contact the push services may write to about the notices this server sends. */
const SUBJECT = 'mailto:admin@idleclash.com';

/** The server's keys, made the first time they are needed. */
export function keysOf(db: BetterSQLite3Database): Keys {
  const row = db.select().from(serverSettings).where(eq(serverSettings.key, 'vapid')).get();
  if (row) return JSON.parse(row.value) as Keys;
  const keys = webpush.generateVAPIDKeys();
  db.insert(serverSettings)
    .values({ key: 'vapid', value: JSON.stringify(keys) })
    .onConflictDoNothing()
    .run();
  return JSON.parse(db.select().from(serverSettings).where(eq(serverSettings.key, 'vapid')).get()!.value) as Keys;
}

export interface Subscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Sends one notice; answers the push service's status (404 and 410: the subscription is gone). */
export type Sender = (sub: Subscription, payload: string) => Promise<number>;

export const webPushSender =
  (keys: Keys): Sender =>
  async (sub, payload) => {
    try {
      const r = await webpush.sendNotification(sub, payload, {
        vapidDetails: { subject: SUBJECT, publicKey: keys.publicKey, privateKey: keys.privateKey },
        TTL: 12 * 3600,
        timeout: 10_000,
      });
      return r.statusCode;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      return typeof status === 'number' ? status : 0;
    }
  };
