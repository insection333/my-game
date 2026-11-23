// A page left open across a deploy (session 202): an idle game's tab stays open for days while main deploys
// itself after every merged session, and the open page went on running the old build's engine every second
// over the new server's saves, its contracts and its words, until closed by hand. The server now names its
// build on every answer from the API; a page of another build loads the new one when it is next hidden or
// next moves to another page, never under a letter or a box being typed in.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const OWN = '/assets/index-AAAA1111.js';
const NEW = '/assets/index-BBBB2222.js';

let hidden = false;
let typed = '';
const reloads: string[] = [];
const hear = new Map<string, () => void>();

beforeEach(() => {
  vi.resetModules();
  hidden = false;
  typed = '';
  reloads.length = 0;
  hear.clear();
  vi.stubGlobal('document', {
    get hidden() {
      return hidden;
    },
    addEventListener: (type: string, fn: () => void) => hear.set(type, fn),
    querySelectorAll: () => (typed ? [{ value: typed }] : []),
  });
  vi.stubGlobal('location', {
    reload: () => reloads.push('reload'),
    assign: (href: string) => reloads.push(href),
  });
  vi.stubGlobal('sessionStorage', { getItem: () => null, setItem: () => undefined });
});
afterEach(() => vi.unstubAllGlobals());

const load = async () => {
  const m = await import('../src/deploys.ts');
  m.watchBuild(OWN);
  return m;
};

describe('a page of an older build', () => {
  it('loads the new build at once while hidden', async () => {
    const m = await load();
    hidden = true;
    m.heardBuild(NEW);
    expect(reloads).toEqual(['reload']);
  });

  it('waits while seen, then loads it when hidden', async () => {
    const m = await load();
    m.heardBuild(NEW);
    expect(reloads).toEqual([]);
    hidden = true;
    hear.get('visibilitychange')?.();
    expect(reloads).toEqual(['reload']);
  });

  it('goes to the next page as a fresh load of the new build', async () => {
    const m = await load();
    m.heardBuild(NEW);
    expect(m.staleBuild()).toBe(true);
    m.heardBuild(OWN);
    expect(m.staleBuild()).toBe(true);
  });

  it('never loads under words being typed', async () => {
    const m = await load();
    typed = 'Well fought at the ford';
    hidden = true;
    m.heardBuild(NEW);
    expect(reloads).toEqual([]);
    typed = '';
    hear.get('visibilitychange')?.();
    expect(reloads).toEqual(['reload']);
  });

  it('does nothing for its own build, an answer without one, or a page in development', async () => {
    const m = await load();
    hidden = true;
    m.heardBuild(OWN);
    m.heardBuild(null);
    expect(reloads).toEqual([]);
    m.watchBuild('/src/main.tsx');
    m.heardBuild(NEW);
    expect(reloads).toEqual([]);
  });
});
