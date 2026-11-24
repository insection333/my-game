// Every companion gathered (session 226): the master deed asked for fourteen, all there were in session 179,
// and stayed at fourteen when session 210's three bosses brought three more, so "every companion" was done
// with three still to meet.
import { describe, expect, it } from 'vitest';
import '../src/index.ts';
import { COMPANIONS_GATHERED } from '../src/deeds/content.ts';
import { COMPANIONS } from '../src/shared/companions.ts';

describe('companions gathered', () => {
  it('ends at every companion there is', () => {
    expect(COMPANIONS_GATHERED.at(-1)).toEqual([COMPANIONS.length, 'master']);
  });
});
