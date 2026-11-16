// A castle press that never reached the server (session 118): the store swallowed it, so on a dropped
// connection Siege, Raise or Drill did nothing at all and said nothing. It now says why, in the line that
// says "Not enough gold.", as every form does since session 117. A battle's refusal belongs to the row it
// was pressed from (session 119): on a phone the header's line was a screen above a stronghold's Siege.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from '../src/api.ts';
import { castleRun, castleStore, fight } from '../src/pages/castle/store.ts';

afterEach(() => vi.restoreAllMocks());

describe('a castle press', () => {
  it('says the server was not reached', async () => {
    vi.spyOn(api.castle, 'act').mockRejectedValue(new ApiError(0, null));
    expect(await castleRun({ type: 'drill', times: 1 } as never)).toBeNull();
    expect(castleStore.get().refused).toBe('Could not reach the server. Check your connection and try again.');
  });

  it('says to wait when pressed too often', async () => {
    vi.spyOn(api.castle, 'act').mockRejectedValue(
      new ApiError(429, { error: { code: 'tooManyTries', retryAfterSeconds: 30 } }),
    );
    await castleRun({ type: 'drill', times: 1 } as never);
    expect(castleStore.get().refused).toMatch(/^Too many tries\. Try again in /);
  });

  it("is said on the battle's own row, and a press elsewhere in the header", async () => {
    vi.spyOn(api.castle, 'act').mockRejectedValue(new ApiError(0, null));
    await fight('merc:1:3', { type: 'siege', target: 'merc:1:3' } as never);
    expect(castleStore.get().refusedAt).toBe('merc:1:3');
    await castleRun({ type: 'drill', times: 1 } as never);
    expect(castleStore.get().refusedAt).toBeNull();
  });
});
