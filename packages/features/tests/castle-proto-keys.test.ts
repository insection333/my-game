// A study's name taken from a request (session 277): "tech in techs" found "constructor", "toString" and the like
// on every object, so a forged study read a rank of NaN and was refused only because no purse holds NaN gold.
import { describe, expect, it } from 'vitest';
import { castleEngine as E } from '../src/index.ts';

describe('a study the War College does not have', () => {
  it('is refused as unknown, whatever its name', () => {
    const now = Date.UTC(2027, 0, 1);
    const castle = { ...E.newCastle('a', now), warMarks: 1_000 };
    for (const tech of ['constructor', 'toString', 'hasOwnProperty', '__proto__', 'valueOf', 'no-such-study'])
      expect(E.research({ castle, purse: 1e9 }, tech as never, now)).toEqual({ ok: false, reason: 'unknown' });
  });
});
