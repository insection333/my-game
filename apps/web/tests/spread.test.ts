// Pages coming back together (session 288). A deploy restarts the server and closes every page's live channel
// at the same moment; each reopened after the same pauses (1, 2, 4, 8 s …) and then read the game, so all came
// back in one wave. Measured with 500 players on one core, the wave took 1.8 s, every page waiting up to that
// long while nothing else was answered; spread over five seconds, each was answered in 5 ms. A reopening and
// a retry now each wait their pause give or take half, so pages closed together come back apart.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { keepTrying, TRY_EVERY_MS } from '../src/keep-trying.ts';
import { openLive } from '../src/game/live.ts';

const sockets: { onclose: ((e: { code: number }) => void) | null }[] = [];
beforeEach(() => {
  sockets.length = 0;
  vi.useFakeTimers();
  vi.stubGlobal('location', { protocol: 'https:', host: 'idleclash.com' });
  vi.stubGlobal(
    'WebSocket',
    class {
      onclose = null;
      onopen = null;
      onmessage = null;
      constructor() {
        sockets.push(this);
      }
      close() {}
    },
  );
  vi.stubGlobal('document', {
    visibilityState: 'visible',
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });
  vi.stubGlobal('window', { addEventListener: () => undefined, removeEventListener: () => undefined });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const on = () => ({
  state: vi.fn(),
  events: vi.fn(),
  signedOut: vi.fn(),
  reopened: vi.fn(),
  mail: vi.fn(),
  banner: vi.fn(),
  renamed: vi.fn(),
});

describe('pages closed together', () => {
  it('reopen their channels apart: the pause give or take half', () => {
    const soon = openLive(on(), () => 0);
    const late = openLive(on(), () => 0.999);
    sockets[0].onclose?.({ code: 1001 });
    sockets[1].onclose?.({ code: 1001 });
    vi.advanceTimersByTime(500);
    expect(sockets).toHaveLength(3);
    vi.advanceTimersByTime(999);
    expect(sockets).toHaveLength(4);
    soon.close();
    late.close();
  });

  it('try again apart', async () => {
    const tries: string[] = [];
    const soon = keepTrying(
      () => tries.push('soon'),
      () => 0,
    );
    const late = keepTrying(
      () => tries.push('late'),
      () => 0.999,
    );
    await vi.advanceTimersByTimeAsync(TRY_EVERY_MS / 2);
    expect(tries).toEqual(['soon']);
    await vi.advanceTimersByTimeAsync(TRY_EVERY_MS * 0.9);
    expect(tries).toEqual(['soon', 'soon']);
    await vi.advanceTimersByTimeAsync(TRY_EVERY_MS * 0.1);
    expect(tries.filter((x) => x === 'late')).toHaveLength(1);
    soon();
    late();
  });
});
