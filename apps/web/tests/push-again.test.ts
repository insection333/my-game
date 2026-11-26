// Notices while away, told again (session 275). Settings said "On" while the browser held a subscription, yet the
// server could have let it go (a push service's 410, a restored backup older than it) and the time zone was told
// only when the player switched notices on: notices stopped without a word. Each day the game opens, the browser's
// subscription and time zone are told again, never asking the player anything.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../src/api.ts';
import { keepFor } from '../src/kept.ts';
import { pushAgain } from '../src/push.ts';

const store = new Map<string, string>();
const sub = { toJSON: () => ({ endpoint: 'https://fcm.googleapis.com/fcm/send/x', keys: { p256dh: 'p', auth: 'a' } }) };
let held: typeof sub | null = sub;
vi.stubGlobal('window', { PushManager: {}, Notification: {} });
vi.stubGlobal('Notification', { permission: 'granted' });
vi.stubGlobal('navigator', {
  userAgent: 'test',
  serviceWorker: {
    getRegistration: () => Promise.resolve({ pushManager: { getSubscription: () => Promise.resolve(held) } }),
  },
});
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
});
afterEach(() => vi.restoreAllMocks());

describe('notices while away, told again', () => {
  it('tells the server where they go once a day, and nothing without a subscription', async () => {
    keepFor('rowan');
    const on = vi.spyOn(api.push, 'on').mockResolvedValue(undefined);
    await pushAgain(1_000_000);
    expect(on).toHaveBeenCalledTimes(1);
    expect(on.mock.calls[0][0]).toMatchObject({ endpoint: 'https://fcm.googleapis.com/fcm/send/x' });
    await pushAgain(1_000_000 + 3_600_000);
    expect(on).toHaveBeenCalledTimes(1);
    await pushAgain(1_000_000 + 86_400_001);
    expect(on).toHaveBeenCalledTimes(2);
    held = null;
    await pushAgain(1_000_000 + 3 * 86_400_000);
    expect(on).toHaveBeenCalledTimes(2);
  });
});
