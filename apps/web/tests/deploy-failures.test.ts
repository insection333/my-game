// A script that cannot be fetched (session 280): offline, or the server restarting for a deploy. The welcome
// form fetches the game's code as it is focused, and a failure reloaded the page under the name and password
// being typed (the reload's handler took every failure for a deploy's missing file); and the failed fetch was
// kept, so signing in then failed every time until the page was reloaded by hand.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onceLoaded } from '../src/once-loaded.ts';

describe('a fetch of the game that fails', () => {
  it('is tried again the next time it is asked for, and kept once it is fetched', async () => {
    let tries = 0;
    const load = onceLoaded(() => {
      tries++;
      return tries === 1
        ? Promise.reject(new TypeError('Failed to fetch dynamically imported module'))
        : Promise.resolve({ ok: tries });
    });
    await expect(load()).rejects.toThrow('Failed to fetch');
    await expect(load()).resolves.toEqual({ ok: 2 });
    await expect(load()).resolves.toEqual({ ok: 2 });
    expect(tries).toBe(2);
  });
});

describe('a script missing while words are typed', () => {
  let typed = '';
  const reloads: string[] = [];
  const hear = new Map<string, (e: { preventDefault: () => void }) => void>();
  beforeEach(() => {
    vi.resetModules();
    typed = '';
    reloads.length = 0;
    vi.stubGlobal('window', { addEventListener: (type: string, fn: never) => hear.set(type, fn) });
    vi.stubGlobal('document', { querySelectorAll: () => (typed ? [{ value: typed }] : []) });
    vi.stubGlobal('location', { reload: () => reloads.push('reload') });
    vi.stubGlobal('sessionStorage', { getItem: () => null, setItem: () => undefined });
  });
  afterEach(() => vi.unstubAllGlobals());

  const fail = async () => {
    (await import('../src/deploys.ts')).reloadOnStaleFiles();
    let prevented = false;
    hear.get('vite:preloadError')?.({ preventDefault: () => (prevented = true) });
    return prevented;
  };

  it('does not reload the page under them, leaving the failure to the press', async () => {
    typed = 'Rowan';
    expect(await fail()).toBe(false);
    expect(reloads).toEqual([]);
  });

  it('reloads it into the new build when nothing is typed', async () => {
    expect(await fail()).toBe(true);
    expect(reloads).toEqual(['reload']);
  });

  // Session 301: presses made while a deploy restarts the server wait to be sent (session 274), and a script
  // missing meanwhile (a page opened then, its part not yet fetched) reloaded the page at once, losing them.
  it('waits for the presses still to be sent, then loads the new build', async () => {
    const deploys = await import('../src/deploys.ts');
    let waiting = 2;
    deploys.holdReloadWhile(() => waiting > 0);
    await fail();
    expect(reloads).toEqual([]);
    waiting = 0;
    deploys.reloadIfWaiting();
    expect(reloads).toEqual(['reload']);
  });
});

describe('the form a failed fetch of the game is said on', () => {
  it("says the server could not be reached, in each browser's words for it", async () => {
    const { refused } = await import('../src/refused.ts');
    for (const message of [
      'Failed to fetch dynamically imported module: https://idleclash.com/assets/store-AAAA.js',
      'error loading dynamically imported module: https://idleclash.com/assets/store-AAAA.js',
      'Importing a module script failed.',
    ])
      expect(refused(new TypeError(message))).toBe('Could not reach the server. Check your connection and try again.');
    expect(refused(new Error('boom'))).toBe('Something went wrong on our side. Try again in a moment.');
  });
});
