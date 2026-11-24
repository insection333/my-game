// The admin console's own account (session 227). Its name and password come from the server's environment
// (ADMIN_ACCOUNT_NAME, default "Admin"; ADMIN_ACCOUNT_PASSWORD, a secret written at deploy), never from the
// repository. At each start the account is made if missing, and its password set again if the secret has
// changed. It signs in as anyone does, is sent to the console, never plays (no save, refused every game
// route), stands in no count of players, and its sessions last STAFF_HOURS from sign-in, not 30 days.
import { nameKey, nameLook } from '@idle-clash/contracts';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { Ctx } from '../context.ts';
import { players } from '../db/schema.ts';
import { checkPassword, hashPassword } from './passwords.ts';

export const STAFF_HOURS = 12;

/** Makes the console's account, or sets its password again; a player already holding the name is left
 *  alone (and the console has no account of its own until the name is changed). */
export async function ensureStaff(ctx: Ctx): Promise<'made' | 'kept' | 'reset' | 'none' | 'nameHeld'> {
  const { name, password } = ctx.config.staff;
  if (!password) return 'none';
  const row = ctx.db
    .select()
    .from(players)
    .where(eq(players.nameKey, nameKey(name)))
    .get();
  if (row && row.role !== 'staff') return 'nameHeld';
  if (row) {
    if (await checkPassword(row.passwordHash, password)) return 'kept';
    ctx.db
      .update(players)
      .set({ passwordHash: await hashPassword(password) })
      .where(eq(players.id, row.id))
      .run();
    ctx.sessions.endAll(row.id);
    return 'reset';
  }
  ctx.db
    .insert(players)
    .values({
      id: randomUUID(),
      name,
      nameKey: nameKey(name),
      nameLook: nameLook(name),
      passwordHash: await hashPassword(password),
      createdAt: ctx.config.now(),
      role: 'staff',
    })
    .run();
  return 'made';
}
