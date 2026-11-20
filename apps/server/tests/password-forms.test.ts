// A password is the same password however a keyboard writes its letters (session 157). "Café" typed on
// one device is one letter é and on another an e and an accent mark (Unicode's NFC and NFD forms); the
// server compared the bytes, so a player who signed up on one could not sign in on the other.
import { hash } from '@node-rs/argon2';
import { describe, expect, it } from 'vitest';
import { checkPassword, hashPassword } from '../src/auth/passwords.ts';
import { ORIGIN, server, signUp } from './helpers.ts';

const COMPOSED = 'Café crème brûlée'.normalize('NFC');
const DECOMPOSED = COMPOSED.normalize('NFD');

const signIn = (s: Awaited<ReturnType<typeof server>>, password: string) =>
  s.app.inject({
    method: 'POST',
    url: '/api/auth/sign-in',
    headers: { 'content-type': 'application/json', origin: ORIGIN },
    payload: JSON.stringify({ name: 'Rowan', password }),
  });

describe('a password in either form', () => {
  it('signs in with the other form of the letters it was made with', async () => {
    expect(COMPOSED).not.toBe(DECOMPOSED);
    const s = await server();
    await signUp(s, 'Rowan', COMPOSED);
    expect((await signIn(s, DECOMPOSED)).statusCode).toBe(200);
    expect((await signIn(s, COMPOSED)).statusCode).toBe(200);
    expect((await signIn(s, 'Cafe creme brulee')).statusCode).toBe(401);
    await s.app.close();
  });

  it('checks a hash made before, from letters as they were typed', async () => {
    const before = await hash(DECOMPOSED, { algorithm: 2, memoryCost: 19_456, timeCost: 2, parallelism: 1 });
    expect(await checkPassword(before, DECOMPOSED)).toBe(true);
    expect(await checkPassword(await hashPassword(DECOMPOSED), COMPOSED)).toBe(true);
  });
});
