// Where a player goes after signing in (session 279): "/\elsewhere" passed the test for an address on this site,
// and a browser reads that backslash as a slash, so a page of an older build (which follows with a full load,
// as it does after a deploy) left the site for the other.
import { describe, expect, it } from 'vitest';
import { safeNext } from '../src/router.ts';

describe('the address after signing in', () => {
  it('is a path on this site and nothing else', () => {
    expect(safeNext('/castle?tab=war')).toBe('/castle?tab=war');
    expect(safeNext('/')).toBe('/');
    for (const away of [
      '//elsewhere.example',
      '/\\elsewhere.example',
      'https://elsewhere.example',
      'javascript:alert(1)',
      '',
      null,
    ])
      expect(safeNext(away)).toBe('/');
  });
});
