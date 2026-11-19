// Session 156's stress test: a bad actor got past the letters' filter with a letter swapped for a look-alike
// sound ("fvck", "phuck"), a letter masked ("c*nt", "f*ck"), a word broken in two ("fu ck"), and told
// another player to "kill yourself" in so many words, where only "kys" was refused. Each is refused now, and
// ordinary letters still go.
import { describe, expect, it } from 'vitest';
import { cleanMessage, messageAllowed } from '../src/mail/filter.ts';

const allowed = (m: string) => messageAllowed(cleanMessage(m) ?? '');

describe("the letters' filter", () => {
  it('refuses the ways round it a bad actor found', () => {
    for (const m of [
      'fvck you',
      'phuck off',
      'c*nt',
      'f*cking idiot',
      'sh*t',
      'fu ck you',
      'sh it',
      'kill yourself',
      'go kill urself',
      'neck yourself',
    ])
      expect(allowed(m), m).toBe(false);
  });

  it('lets ordinary letters through', () => {
    for (const m of [
      'Scunthorpe is lovely, the class hit it off',
      'is it a good day for a siege?',
      'I will kill your troll tomorrow',
      'Good luck at 5* rating',
      'as is',
      'Fukushima has hot springs',
    ])
      expect(allowed(m), m).toBe(true);
  });
});
