// A player whose session ends is sent to Sign in, told why (session 157). The welcome page opened on
// Create account for everyone not signed in, so a player signed out mid-game (their password changed on
// another device, which ends every other session) or back on a device whose cookie had gone found a
// form for a new account with no word of why, and typing their own name and password there was refused
// as a name already taken.
import { describe, expect, it } from 'vitest';
import { bounceOf } from '../src/game/session.ts';
import { welcomeFor } from '../src/welcome-path.ts';

describe('a session ended', () => {
  it('sends a device that has played here to Sign in, and a new one to Create account', () => {
    expect(welcomeFor('/', '', true)).toBe('/welcome/sign-in');
    expect(welcomeFor('/skills/mining', '?panel=tray', true)).toBe(
      `/welcome/sign-in?next=${encodeURIComponent('/skills/mining?panel=tray')}`,
    );
    expect(welcomeFor('/', '', false)).toBe('/welcome');
    expect(welcomeFor('/combat', '', false)).toBe(`/welcome?next=${encodeURIComponent('/combat')}`);
  });

  it('says so when it ends in the middle of play, and not for a visitor', () => {
    expect(bounceOf('notSignedIn', 'playing')).toBe('ended');
    expect(bounceOf('notSignedIn', 'loading')).toBeNull();
    expect(bounceOf('notSignedIn', 'signedOut')).toBeNull();
    expect(bounceOf('banned', 'playing')).toBe('banned');
    expect(bounceOf('banned', 'loading')).toBe('banned');
  });
});
