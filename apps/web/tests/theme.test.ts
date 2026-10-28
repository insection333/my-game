// A theme change restyles the whole page (session 18): Chromium kept the old theme's colour on
// elements that inherit it from a parent drawn from a theme token, so every switch, chosen or the
// device's own, gives every element a colour of its own for one style pass and then its own again.
import { describe, expect, it } from 'vitest';
import { applyTheme, followScheme, repaintInk } from '../src/theme.ts';

/** A page root that records its attribute changes and each forced style pass. */
function page() {
  const log: string[] = [];
  const attrs = new Set<string>();
  const root = {
    dataset: {} as Record<string, string>,
    setAttribute: (a: string) => (attrs.add(a), log.push(`+${a}`)),
    removeAttribute: (a: string) => (attrs.delete(a), log.push(`-${a}`)),
    get offsetHeight() {
      log.push(attrs.has('data-repaint') ? 'pass with own colours' : 'pass');
      return 0;
    },
  };
  return { root: root as unknown as HTMLElement, log, dataset: root.dataset };
}

describe('a theme change', () => {
  it('restyles every element twice: once with a colour of its own, once with its own again', () => {
    const p = page();
    repaintInk(p.root);
    expect(p.log).toEqual(['+data-repaint', 'pass with own colours', '-data-repaint', 'pass']);
  });

  it('happens whenever the device turns light or dark', () => {
    const p = page();
    const listeners: (() => void)[] = [];
    const win = {
      matchMedia: () => ({ addEventListener: (_: string, f: () => void) => listeners.push(f) }),
    } as unknown as Window;
    globalThis.document = { documentElement: p.root } as unknown as Document;
    followScheme(win);
    for (const f of listeners) f();
    expect(p.log).toContain('pass with own colours');
  });

  it('and when the player chooses one, which the page then wears', () => {
    const p = page();
    globalThis.document = { documentElement: p.root } as unknown as Document;
    applyTheme('dark');
    expect(p.dataset.theme).toBe('dark');
    expect(p.log).toContain('pass with own colours');
    applyTheme('system');
    expect(p.dataset.theme).toBeUndefined();
  });
});
