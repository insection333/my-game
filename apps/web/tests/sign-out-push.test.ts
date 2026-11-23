// Signing out lets go of this browser's notices while away (session 182): they belonged to the player who
// switched them on, so a browser left signed out (or signed into by another player) went on showing that
// player's notices, and the next player's Settings read "On" for notices sent to someone else.
import { describe, expect, it, vi } from 'vitest';

const calls: string[] = [];
vi.mock('../src/push.ts', () => ({ pushOff: () => (calls.push('pushOff'), Promise.resolve('off')) }));
vi.mock('../src/api.ts', () => ({
  api: { signOut: () => (calls.push('signOut'), Promise.resolve()) },
  showPlayer: () => undefined,
  ApiError: class extends Error {},
}));
vi.mock('../src/router.ts', () => ({ replace: () => undefined }));
vi.mock('../src/welcome-path.ts', () => ({ notePlayed: () => undefined }));
const { account } = await import('../src/game/session.ts');

describe('signing out', () => {
  it("lets go of this browser's notices first, while the server still knows whose they are", async () => {
    await account.signOut();
    expect(calls).toEqual(['pushOff', 'signOut']);
  });
});
