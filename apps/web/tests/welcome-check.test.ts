// The welcome form refuses exactly what the server's sign-up schema refuses.
import { SignUp } from '@idle-clash/contracts';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { check } from '../src/pages/welcome-check.ts';

const names = fc.oneof(
  fc.string({ maxLength: 20 }),
  fc.stringMatching(/^[A-Za-z0-9 _-]{1,18}$/),
  fc.constantFrom('Rowan', 'Old Tom', 'a', ' Rowan', 'Rowan ', 'Ro  wan', 'Ro-wan_2', 'Rówan', 'x'.repeat(17)),
);
const passwords = fc.oneof(
  fc.string({ maxLength: 220 }),
  fc.constantFrom('a long enough secret', 'short', 'ten chars!', 'bad\u0007password', 'x'.repeat(201)),
);

describe('the welcome form', () => {
  it('accepts a sign-up exactly when the server would', () => {
    fc.assert(
      fc.property(names, passwords, fc.boolean(), (name, password, age) => {
        const page = Object.keys(check(true, name, password, age)).length === 0;
        const server = SignUp.safeParse({ name, password, ageConfirmed: age || undefined }).success;
        expect(page).toBe(server);
      }),
      { numRuns: 2000 },
    );
  });
});
