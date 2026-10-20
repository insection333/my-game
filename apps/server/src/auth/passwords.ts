// Passwords are stored only as Argon2id hashes (memory 19 MiB, 2 passes: OWASP's minimum).
import { hash, verify } from '@node-rs/argon2';

const OPTIONS = { algorithm: 2 /* Argon2id */, memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

export const hashPassword = (password: string) => hash(password, OPTIONS);

export async function checkPassword(stored: string, password: string): Promise<boolean> {
  try {
    return await verify(stored, password);
  } catch {
    return false;
  }
}

/** A hash to check against when the name does not exist, so a wrong name takes as long as a wrong password. */
let dummy: Promise<string> | null = null;
export const dummyHash = () => (dummy ??= hashPassword('no player has this password'));
