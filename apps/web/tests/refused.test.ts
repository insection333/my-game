// A refusal said as what it was (session 117): Change password said "Something went wrong on our side"
// after five tries in an hour, where the server had said to wait 52 minutes, and so did Delete account,
// Feedback, the inbox and the admin page when the connection dropped. Each form now says it through
// `refused`, with its own words for its own refusals.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ApiError } from '../src/api.ts';
import { refused } from '../src/refused.ts';

const SRC = join(import.meta.dirname, '..', 'src');
const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : [],
  );

describe('a refusal', () => {
  it('says to wait when tried too often, and how long', () => {
    const err = new ApiError(429, { error: { code: 'tooManyTries', retryAfterSeconds: 52 * 60 } });
    expect(refused(err)).toBe('Too many tries. Try again in 52 min.');
  });

  it('says the server was not reached when it was not', () => {
    expect(refused(new ApiError(0, null))).toBe('Could not reach the server. Check your connection and try again.');
  });

  it("takes a form's own words for its own refusals, and the server's fault otherwise", () => {
    const wrong = new ApiError(401, { error: { code: 'wrongPassword' } });
    expect(refused(wrong, { wrongPassword: 'That password is not right.' })).toBe('That password is not right.');
    expect(refused(wrong)).toBe('Something went wrong on our side. Try again in a moment.');
    expect(refused(new Error('x'))).toBe('Something went wrong on our side. Try again in a moment.');
  });

  it('is said through refused on every page', () => {
    const own = files(SRC).filter(
      (f) => !f.endsWith('refused.ts') && readFileSync(f, 'utf8').includes("t('error.other')"),
    );
    expect(own.map((f) => relative(SRC, f))).toEqual([]);
  });
});
