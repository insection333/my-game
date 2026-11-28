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

// Session 292: a press refused as not what the server takes, from a page of an older build, is the build's
// fault, not the player's (a route's input changed by the deploy); the page loads the new build at once, as a
// press there would only be refused again, where it said the refusal and waited to be hidden.
describe('a press of an older build refused for its input', () => {
  const answer = (status: number, code: string, build: string) =>
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        new Response(JSON.stringify({ error: { code } }), {
          status,
          headers: { 'content-type': 'application/json', 'x-build': build },
        }),
      ),
    );

  it('loads the new build while seen, unless words are typed', async () => {
    await load();
    const { api } = await import('../src/api.ts');
    answer(400, 'invalidInput', NEW);
    await expect(api.signOut()).rejects.toMatchObject({ code: 'invalidInput' });
    expect(reloads).toEqual(['reload']);
  });

  it('leaves a refusal of its own build, or of another kind, to the press', async () => {
    await load();
    const { api } = await import('../src/api.ts');
    answer(400, 'invalidInput', OWN);
    await expect(api.signOut()).rejects.toMatchObject({ code: 'invalidInput' });
    answer(409, 'nameTaken', NEW);
    await expect(api.signOut()).rejects.toMatchObject({ code: 'nameTaken' });
    expect(reloads).toEqual([]);
    typed = 'Well fought';
    answer(400, 'invalidInput', NEW);
    await expect(api.signOut()).rejects.toMatchObject({ code: 'invalidInput' });
    expect(reloads).toEqual([]);
  });
});

// Session 292: a deploy restarts the server, and presses made meanwhile wait in the outbox (session 274) to be
// sent again; the first answer of the new server named a new build, and a page out of sight then loaded it at
// once, mid-way through sending, so every change still waiting behind the first was lost. It loads once all
// are sent.
describe('a page of an older build with changes waiting', () => {
  it('sends them all before it loads the new build', async () => {
    const m = await load();
    const { ApiError } = await import('../src/api.ts');
    const { outbox } = await import('../src/game/outbox.ts');
    const b = outbox({
      connected: () => undefined,
      handled: () => false,
      now: () => 0,
      pause: () => Promise.resolve(),
    });
    let up = false;
    const sent: string[] = [];
    const go = (name: string) => () => {
      if (!up) return Promise.reject(new ApiError(502, null));
      m.heardBuild(NEW);
      // Whether the page had loaded anew by the time this change was answered.
      sent.push(`${name}${reloads.length ? ' after a reload' : ''}`);
      return Promise.resolve(name);
    };
    void b.send(go('start'));
    await new Promise((r) => setTimeout(r, 0));
    void b.send(go('next'));
    void b.send(go('then'));
    hidden = true;
    up = true;
    await b.flush();
    expect(sent).toEqual(['start', 'next', 'then']);
    expect(reloads).toEqual(['reload']);
  });
});
