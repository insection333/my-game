// Top up (session 139): offered once the treasury has spent a real part of its margin, not for a coin.
// The button filled to half again what the edict needs, and showed whenever the treasury stood a coin
// under that: a castle topped up a moment ago (upkeep takes about a coin a second) was asked to "Top up
// to 307K" with 307K in its treasury.
import { describe, expect, it } from 'vitest';
import { topUpOf } from '../src/pages/castle/Treasury.tsx';

describe('Top up', () => {
  const required = 204_700;

  it('fills to half again what the edict needs once the treasury falls under a quarter over it', () => {
    expect(topUpOf(Math.floor(required * 1.25) - 1, required)).toEqual({
      target: Math.ceil(required * 1.5),
      gold: Math.ceil(required * 1.5) - (Math.floor(required * 1.25) - 1),
    });
    expect(topUpOf(0, required)?.gold).toBe(Math.ceil(required * 1.5));
  });

  it('is not offered for a few coins of upkeep after a top-up', () => {
    expect(topUpOf(Math.ceil(required * 1.5) - 3, required)).toBeNull();
    expect(topUpOf(Math.ceil(required * 1.25), required)).toBeNull();
  });
});
