// The realm's banner (session 235) as a page holds it: shown while it stands; put away by a player, it stays
// away for them (and not for another player on the browser) until a new banner goes up; gone once its time
// has run out.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bannerShown, putAway, setBanner } from '../src/game/banner.ts';
import { keepFor } from '../src/kept.ts';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  });
  setBanner(null);
});

const TEXT = 'The realm rests from 22:00 to 22:30 UTC tonight.';

describe("the realm's banner", () => {
  it('shows while it stands, stays away once put away, and shows again when a new one goes up', () => {
    keepFor('alder');
    setBanner({ id: 100, text: TEXT, until: 5_000 });
    expect(bannerShown(1_000)?.text).toBe(TEXT);
    expect(bannerShown(5_000)).toBeNull();
    putAway();
    expect(bannerShown(1_000)).toBeNull();
    // Another player on this browser has not put it away.
    keepFor('birch');
    expect(bannerShown(1_000)?.id).toBe(100);
    keepFor('alder');
    setBanner({ id: 200, text: 'Season 3 opens at midnight UTC.', until: 9_000 });
    expect(bannerShown(1_000)?.id).toBe(200);
    setBanner(null);
    expect(bannerShown(1_000)).toBeNull();
  });
});
