// A fault, caught (session 108): Fight on a boss threw while the lanes were drawn, and the whole game went
// blank with no word and no report. A fault now says so, is reported, and offers Reload; in a page, the
// header and menu stay.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const reported: unknown[] = [];
vi.mock('../src/errors.ts', () => ({ report: (e: unknown) => reported.push(e) }));
const { Fault } = await import('../src/Fault.tsx');

describe('a fault', () => {
  it('is reported, and says so with Reload in place of what broke', () => {
    const boom = new Error('Missing string "combat.region.troll-chief.short"');
    const fault = new Fault({ children: null });
    fault.state = Fault.getDerivedStateFromError();
    fault.componentDidCatch(boom);
    expect(reported).toEqual([boom]);
    const html = renderToStaticMarkup(createElement(() => fault.render()));
    expect(html).toContain('Something broke here');
    expect(html).toContain('Reload');
  });
});
