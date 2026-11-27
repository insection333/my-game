// A request that never comes back (session 282): a phone moving from Wi-Fi to its own network can leave a
// connection open with no one at the other end, and the browser waits minutes on it. While a castle press
// waited, every castle button stayed greyed; while a command waited, the page took no word from the server.
// A request unanswered for half a minute is now given up as the server out of reach, which every press says
// and the game's sent changes wait out and send again.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, STALLED_MS } from '../src/api.ts';

let aborted = false;
beforeEach(() => {
  aborted = false;
  vi.useFakeTimers();
  vi.stubGlobal(
    'fetch',
    (_path: string, init: { signal?: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          aborted = true;
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      }),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('a request the server never answers', () => {
  it('is given up after half a minute as the server out of reach', async () => {
    const asked = api.me().catch((err: unknown) => err);
    await vi.advanceTimersByTimeAsync(STALLED_MS - 1);
    expect(aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const err = await asked;
    expect(aborted).toBe(true);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe('offline');
  });
});
