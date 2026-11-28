// The admin console's own account (session 227). Its name and password come from the server's environment
// (ADMIN_ACCOUNT_NAME, default "Admin"; ADMIN_ACCOUNT_PASSWORD, a secret written at deploy). With no secret
// set, the account is made with the first password the owner chose ("Password", session 237), which every
// admin route refuses until a password of the owner's own replaces it at the first sign-in; a password chosen
// so stands across restarts. A secret set later takes over once, when it is first seen or changes (an
// Argon2id hash of it kept in the server's settings), and never again on a restart, so a password changed in
// the console stands until the secret itself changes. It signs in as anyone does, is sent to the console, never
// plays (no save, refused every game route), stands in no count of players, and its sessions last
// STAFF_HOURS from sign-in, not 30 days.
import { nameKey, nameLook } from '@idle-clash/contracts';
import { eq } from 'drizzle-orm';
import { createHash, randomUUID } from 'node:crypto';
import type { Ctx } from '../context.ts';
import { players, serverSettings } from '../db/schema.ts';
import { checkPassword, hashPassword } from './passwords.ts';

export const STAFF_HOURS = 12;
const SECRET_KEY = 'staff.secret';

/** How the server knows a secret it has seen without keeping it: an Argon2id hash, as a password is kept
 *  (session 294). It was a SHA-256 of it, which a copy of the database (a backup) gave to a guesser at billions
 *  of tries a second, where the password's own hash beside it takes a fraction of a second a try; such an
 *  older mark is still known, once, and replaced. */
const oldMark = (secret: string) => createHash('sha256').update(`idle-clash console:${secret}`).digest('hex');
async function seenBefore(mark: string | undefined, secret: string): Promise<'yes' | 'old' | 'no'> {
  if (!mark) return 'no';
  if (mark.startsWith('$argon2')) return (await checkPassword(mark, secret)) ? 'yes' : 'no';
  return mark === oldMark(secret) ? 'old' : 'no';
}

/** Makes the console's account, or sets its password from a secret new to it; a player already holding the
 *  name is left alone (and the console has no account of its own until the name is changed). */
export async function ensureStaff(ctx: Ctx): Promise<'made' | 'kept' | 'reset' | 'none' | 'nameHeld'> {
  const { name, password, first } = ctx.config.staff;
  if (!password && !first) return 'none';
  const row = ctx.db
    .select()
    .from(players)
    .where(eq(players.nameKey, nameKey(name)))
    .get();
  if (row && row.role !== 'staff') return 'nameHeld';
  const seen = ctx.db.select().from(serverSettings).where(eq(serverSettings.key, SECRET_KEY)).get()?.value;
  const known = async (secret: string) => {
    const value = await hashPassword(secret);
    ctx.db
      .insert(serverSettings)
      .values({ key: SECRET_KEY, value })
      .onConflictDoUpdate({ target: serverSettings.key, set: { value } })
      .run();
  };
  if (row) {
    // No secret, or the secret already taken: the password stands as it is (the first, or one chosen since).
    if (!password) return 'kept';
    const before = await seenBefore(seen, password);
    if (before === 'old') await known(password);
    if (before !== 'no') return 'kept';
    ctx.db
      .update(players)
      .set({ passwordHash: await hashPassword(password), mustChangePassword: false })
      .where(eq(players.id, row.id))
      .run();
    await known(password);
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
      passwordHash: await hashPassword(password ?? first!),
      createdAt: ctx.config.now(),
      role: 'staff',
      // The first password is the owner's starting point, not theirs to keep.
      mustChangePassword: !password,
    })
    .run();
  if (password) await known(password);
  return 'made';
}
