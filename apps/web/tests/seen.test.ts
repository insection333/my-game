// Reading the server while the page is seen (session 273): Hiscores and Castle Clash read every minute, and a
// tab left open out of sight went on reading for as long as it stayed open.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { whileSeen } from '../src/seen.ts';

const listeners = new Set<() => void>();
const doc = {
  hidden: false,
  addEventListener: (_: string, f: () => void) => listeners.add(f),
  removeEventListener: (_: string, f: () => void) => listeners.delete(f),
};
vi.stubGlobal('document', doc);
afterEach(() => vi.useRealTimers());

describe('reading while seen', () => {
  it('reads each minute while seen, nothing out of sight, and at once when seen again', () => {
    vi.useFakeTimers();
    let reads = 0;
    const stop = whileSeen(() => reads++, 60_000);
    vi.advanceTimersByTime(120_000);
    expect(reads).toBe(2);
    doc.hidden = true;
    vi.advanceTimersByTime(10 * 60_000);
    expect(reads).toBe(2);
    doc.hidden = false;
    for (const f of listeners) f();
    expect(reads).toBe(3);
    stop();
    expect(listeners.size).toBe(0);
    vi.advanceTimersByTime(120_000);
    expect(reads).toBe(3);
  });
});
