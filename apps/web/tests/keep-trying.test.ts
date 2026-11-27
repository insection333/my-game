// The server out of reach as the page opens (session 283): every merged session restarts it for a deploy, so
// a player opening the game in those seconds met "Cannot reach the server" and a Try again they had to press,
// however soon the server was back. The page now tries again by itself every few seconds and as soon as the
// device is back on a network, as the inbox does (session 118), and stops once it is let go.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { keepTrying, TRY_EVERY_MS } from '../src/keep-trying.ts';

const win = new Map<string, () => void>();
beforeEach(() => {
  vi.useFakeTimers();
  win.clear();
  vi.stubGlobal('window', {
    addEventListener: (type: string, fn: () => void) => win.set(type, fn),
    removeEventListener: (type: string) => win.delete(type),
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('a page that cannot reach the server', () => {
  it('tries again every few seconds and when back on a network, until let go', async () => {
    const tries: string[] = [];
    const stop = keepTrying(() => tries.push('try'));
    await vi.advanceTimersByTimeAsync(TRY_EVERY_MS * 2);
    expect(tries).toHaveLength(2);
    win.get('online')?.();
    expect(tries).toHaveLength(3);
    stop();
    await vi.advanceTimersByTimeAsync(TRY_EVERY_MS * 3);
    expect(tries).toHaveLength(3);
    expect(win.has('online')).toBe(false);
  });

  it('waits for a try still on its way rather than doubling it', async () => {
    let asked = 0;
    let answer = () => undefined as void;
    const stop = keepTrying(() => {
      asked++;
      return new Promise<void>((r) => (answer = r));
    });
    vi.advanceTimersByTime(TRY_EVERY_MS * 3);
    expect(asked).toBe(1);
    answer();
    await vi.advanceTimersByTimeAsync(TRY_EVERY_MS);
    expect(asked).toBe(2);
    stop();
  });
});
