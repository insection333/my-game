// Passwords are stored only as Argon2id hashes (memory 19 MiB, 2 passes: OWASP's minimum).
import { hash, verify } from '@node-rs/argon2';

const OPTIONS = { algorithm: 2 /* Argon2id */, memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

/** One form for a password's letters (session 157): "é" is one letter on one keyboard and an e with an
 *  accent mark on another (NFC and NFD), so the bytes differed and a player who signed up on one device
 *  could not sign in on the other. NFKC, as NIST's guidance for passwords asks. */
const oneForm = (password: string) => password.normalize('NFKC');

export const hashPassword = (password: string) => hash(oneForm(password), OPTIONS);

const matches = async (stored: string, password: string) => {
  try {
    return await verify(stored, password);
  } catch {
    return false;
  }
};

/** Whether a password is the one stored; a hash made before session 157, from the letters as typed, still
 *  checks against them. */
export async function checkPassword(stored: string, password: string): Promise<boolean> {
  if (await matches(stored, oneForm(password))) return true;
  return oneForm(password) !== password && (await matches(stored, password));
}

/** A hash to check against when the name does not exist, so a wrong name takes as long as a wrong password. */
let dummy: Promise<string> | null = null;
export const dummyHash = () => (dummy ??= hashPassword('no player has this password'));
