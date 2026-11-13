// A banned player is told (session 95): their pages are closed as banned, and every refused request
// says banned, so the welcome page they land on says the account is closed, where they arrived there
// with no word of why. Signing in again (once unbanned) clears it.
import { describe, expect, it } from 'vitest';
import { ApiError } from '../src/api.ts';
import { handled, sessionStore, signedOut } from '../src/game/session.ts';

describe('a banned player', () => {
  it('is signed out with the reason kept for the welcome page', () => {
    signedOut('banned');
    expect(sessionStore.get()).toMatchObject({ phase: 'signedOut', bounced: 'banned' });
    signedOut();
    expect(sessionStore.get().bounced).toBeNull();
    expect(handled(new ApiError(403, { error: { code: 'banned' } }))).toBe(true);
    expect(sessionStore.get().bounced).toBe('banned');
    expect(handled(new ApiError(401, { error: { code: 'notSignedIn' } }))).toBe(true);
    expect(sessionStore.get().bounced).toBeNull();
  });

  // Session 96: a deleted account landed on the welcome page with nothing to say it had worked.
  it('keeps word of an account deleted for the welcome page', () => {
    signedOut('deleted');
    expect(sessionStore.get()).toMatchObject({ phase: 'signedOut', bounced: 'deleted' });
  });
});
