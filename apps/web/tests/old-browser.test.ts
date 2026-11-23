// A browser too old for the game (session 207): a family's iPad held at iOS 12 or 15 failed on the game's
// first line and showed a blank page for ever. A small classic script, run first, now says so in the page.
import { runInThisContext } from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { oldBrowserHtml, oldBrowserJs } from '../src/old-browser.ts';

afterEach(() => vi.unstubAllGlobals());

/** Runs the script over a page with a root, as a browser that has read the page would. */
function run() {
  const root = {
    innerHTML: 'x',
    children: [] as { text: string }[],
    appendChild(p: { textContent: string }) {
      this.children.push({ text: p.textContent });
    },
  };
  const attrs: Record<string, string> = {};
  vi.stubGlobal('document', {
    readyState: 'complete',
    documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) },
    getElementById: () => root,
    createElement: () => ({ setAttribute: () => undefined, textContent: '' }),
    addEventListener: () => undefined,
  });
  runInThisContext(oldBrowserJs());
  return { attrs, said: root.children.map((c) => c.text) };
}

describe('a browser too old for the game', () => {
  it('is told so in the page, where it had a blank one', () => {
    vi.stubGlobal('structuredClone', undefined);
    const { attrs, said } = run();
    expect(attrs['data-too-old']).toBe('true');
    expect(said).toEqual([expect.stringMatching(/^This browser is too old for Idle Clash\./)]);
  });

  it('leaves a browser that has what the game needs alone', () => {
    expect(run()).toEqual({ attrs: {}, said: [] });
  });

  it('is written for the oldest browsers, and says scripts are needed where they are off', () => {
    expect(oldBrowserJs()).not.toMatch(/=>|\blet\b|\bconst\b|`/);
    expect(oldBrowserHtml()).toContain('<noscript>');
    expect(oldBrowserHtml()).toContain('needs JavaScript');
  });
});
